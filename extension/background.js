// Portable settings sync; bookmark IDs and running sessions stay device-local.
const SYNC_PROMPTS_KEY = 'syncedPromptsV1';
const SYNC_AUTO_KEY = 'syncedAutoContinueV1';
const portablePrompts = prompts => prompts.map(({bookmarkId, ...p}) => p);
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
let queue = Promise.resolve();
function enqueue(job) {
  queue = queue.then(job).catch(e => console.warn('Prompt sync:', e));
  return queue;
}
function combineInitial(local, remote) {
  const result = remote.map(p => ({...p}));
  const ids = new Set(result.map(p => p.id));
  for (const p of local) {
    if (!ids.has(p.id)) { result.push({...p}); ids.add(p.id); }
  }
  return result;
}
function withLocalBookmarks(prompts, local) {
  const bookmarks = new Map(local.filter(p => p.bookmarkId).map(p => [p.id,p.bookmarkId]));
  return prompts.map(p => ({...p, ...(bookmarks.has(p.id) ? {bookmarkId:bookmarks.get(p.id)} : {})}));
}
async function applyRemotePrompts(remote, initial=false) {
  const local = (await chrome.storage.local.get('prompts')).prompts || [];
  const merged = initial ? combineInitial(local, remote) : remote;
  const next = withLocalBookmarks(merged, local);
  if (!same(next, local)) await chrome.storage.local.set({prompts:next});
  if (initial && !same(merged,remote)) await chrome.storage.sync.set({[SYNC_PROMPTS_KEY]:portablePrompts(merged)});
}
async function migratePortableSettings() {
  return enqueue(async () => {
    const [local,sync] = await Promise.all([
      chrome.storage.local.get(['prompts','plAutoContinueSettings']),
      chrome.storage.sync.get([SYNC_PROMPTS_KEY,SYNC_AUTO_KEY])
    ]);
    if (Array.isArray(sync[SYNC_PROMPTS_KEY])) {
      await applyRemotePrompts(sync[SYNC_PROMPTS_KEY],true);
    } else if (Array.isArray(local.prompts)) {
      await chrome.storage.sync.set({[SYNC_PROMPTS_KEY]:portablePrompts(local.prompts)});
    }
    if (sync[SYNC_AUTO_KEY] === undefined && local.plAutoContinueSettings !== undefined) {
      await chrome.storage.sync.set({[SYNC_AUTO_KEY]:local.plAutoContinueSettings});
    } else if (sync[SYNC_AUTO_KEY] !== undefined && !same(local.plAutoContinueSettings,sync[SYNC_AUTO_KEY])) {
      await chrome.storage.local.set({plAutoContinueSettings:sync[SYNC_AUTO_KEY]});
    }
  });
}
chrome.storage.onChanged.addListener((changes,area) => {
  if (area === 'sync') {
    enqueue(async () => {
      if (Array.isArray(changes[SYNC_PROMPTS_KEY]?.newValue))
        await applyRemotePrompts(changes[SYNC_PROMPTS_KEY].newValue);
      if (changes[SYNC_AUTO_KEY] && !same(
        (await chrome.storage.local.get('plAutoContinueSettings')).plAutoContinueSettings,
        changes[SYNC_AUTO_KEY].newValue))
        await chrome.storage.local.set({plAutoContinueSettings:changes[SYNC_AUTO_KEY].newValue});
    });
  } else if (area === 'local') {
    enqueue(async () => {
      const updates = {};
      if (Array.isArray(changes.prompts?.newValue)) {
        const portable = portablePrompts(changes.prompts.newValue);
        const remote = (await chrome.storage.sync.get(SYNC_PROMPTS_KEY))[SYNC_PROMPTS_KEY];
        if (!same(portable,remote)) updates[SYNC_PROMPTS_KEY] = portable;
      }
      if (changes.plAutoContinueSettings) {
        const value = changes.plAutoContinueSettings.newValue;
        const remote = (await chrome.storage.sync.get(SYNC_AUTO_KEY))[SYNC_AUTO_KEY];
        if (!same(value,remote)) updates[SYNC_AUTO_KEY] = value;
      }
      if (Object.keys(updates).length) await chrome.storage.sync.set(updates);
    });
  }
});
migratePortableSettings();

chrome.runtime.onInstalled.addListener(async ({reason}) => {
  await migratePortableSettings();
  const data = await chrome.storage.local.get("prompts");
  if (!Array.isArray(data.prompts)) await chrome.storage.local.set({prompts:[]});
  if (reason === "install") chrome.runtime.openOptionsPage();
});
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(message?.type!=='pl-rollover-open')return;
  (async()=>{
    const {token,promptId}=message;
    if(!sender.tab?.id||typeof token!=='string'||typeof promptId!=='string')throw Error('Invalid handoff');
    const data=await chrome.storage.local.get(['prompts','plRollover:'+token]);
    const handoff=data['plRollover:'+token];
    const prompt=(data.prompts||[]).find(p=>p.id===promptId);
    if(!handoff||handoff.promptId!==promptId||!prompt?.prompt?.trim())throw Error('Missing launcher or handoff');
    const url='https://chatgpt.com/?pl_autosend=1&pl_id='+encodeURIComponent(promptId)+'&pl_rollover='+encodeURIComponent(token);
    // Keep the successor in the opener's actual window. Chrome rejects an
    // openerTabId if the destination defaults to a different focused window.
    const opener=await chrome.tabs.get(sender.tab.id);
    // Select the successor whenever its opener is the selected tab in that
    // window, even if another Chrome window currently has focus.
    // Never focus a window solely because a rollover happened.
    const follow=opener.active;
    // Creating an active tab in an unfocused window can pull that window forward.
    // Create inactive first, then select within its window without focusing the window.
    let tab;
    try {
      tab=await chrome.tabs.create({url,active:false,windowId:opener.windowId,openerTabId:opener.id});
    } catch (error) {
      // If the opener moved windows between lookup and creation, retry in its
      // current window. Never retry unrelated failures or create duplicates.
      if(!String(error).includes('Tab opener must be in the same window'))throw error;
      const current=await chrome.tabs.get(opener.id);
      tab=await chrome.tabs.create({url,active:false,windowId:current.windowId,openerTabId:current.id});
    }
    // Only replace the selected tab if the opener is still selected.
    // chrome.tabs.update({active:true}) selects a tab but does not request window focus.
    if(follow){
      const selected=await chrome.tabs.query({active:true,windowId:tab.windowId});
      if(selected.some(t=>t.id===opener.id))await chrome.tabs.update(tab.id,{active:true});
    }
    await chrome.storage.local.set({['plRolloverTab:'+tab.id]:token,['plRolloverPredecessor:'+token]:opener.id});
    return {ok:true,tabId:tab.id};
  })().then(sendResponse,e=>sendResponse({ok:false,error:String(e)}));
  return true;
});

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(message?.type!=='pl-rollover-token')return;
  chrome.storage.local.get('plRolloverTab:'+sender.tab?.id).then(data=>sendResponse({token:data['plRolloverTab:'+sender.tab?.id]||null}));
  return true;
});

// Successor confirms its Auto-Continue session is running before predecessor closes.
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(message?.type!=='pl-rollover-resumed')return;
  (async()=>{
    const successorId=sender.tab?.id,token=message.token;
    if(!Number.isInteger(successorId)||typeof token!=='string')throw Error('Invalid resume acknowledgement');
    const keys=['plRolloverTab:'+successorId,'plRolloverPredecessor:'+token];
    const data=await chrome.storage.local.get(keys);
    if(data[keys[0]]!==token||!Number.isInteger(data[keys[1]]))throw Error('Resume acknowledgement does not match handoff');
    const predecessorId=data[keys[1]];
    if(predecessorId===successorId)throw Error('Cannot close successor');
    // Clear the one-time close authorization before attempting removal.
    await chrome.storage.local.remove(keys);
    try{await chrome.tabs.remove(predecessorId);}catch(e){
      // The predecessor may already have been closed by the user.
      if(!String(e).includes('No tab with id'))throw e;
    }
    return {ok:true};
  })().then(sendResponse,e=>sendResponse({ok:false,error:String(e)}));
  return true;
});
