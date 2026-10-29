chrome.runtime.onInstalled.addListener(async ({reason}) => {
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
