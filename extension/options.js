let state={prompts:[]};
const DEFAULT_HUE=205;
const DEFAULT_NEW_PROMPT='Load and read the "context.txt" context file from my private GitHub repository "username/repository" and use it as the active project context for this conversation.';
function colorFromHue(hue){const h=((Number(hue??DEFAULT_HUE)%360)+360)%360/60,s=.78,v=.82,c=v*s,x=c*(1-Math.abs((h%2)-1)),m=v-c;let r=0,g=0,b=0;if(h<1)[r,g,b]=[c,x,0];else if(h<2)[r,g,b]=[x,c,0];else if(h<3)[r,g,b]=[0,c,x];else if(h<4)[r,g,b]=[0,x,c];else if(h<5)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];return `rgb(${Math.round((r+m)*255)},${Math.round((g+m)*255)},${Math.round((b+m)*255)})`;}
function promptIcon(hue){const wrap=document.createElement("div");wrap.className="promptIcon";wrap.style.setProperty("--prompt-color",colorFromHue(hue));wrap.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><path class="bubble" d="M8 8h48v36H29L17 55V44H8z"/><path class="bolt" d="M35 14 22 34h10l-4 16 15-23H33z"/></svg>';return wrap;}
async function load(){const x=await chrome.storage.local.get("prompts");state.prompts=Array.isArray(x.prompts)?x.prompts:[];let changed=false;for(const p of state.prompts)if(p.hue==null){p.hue=p.value==null?DEFAULT_HUE:Math.round((1-Math.max(0,Math.min(100,Number(p.value)))/100)*240);delete p.value;changed=true;}if(changed)await chrome.storage.local.set({prompts:state.prompts});render();}
async function persist(message="Saved"){await chrome.storage.local.set({prompts:state.prompts});const s=document.getElementById("status");s.textContent=message;clearTimeout(persist.timer);persist.timer=setTimeout(()=>s.textContent="",1200);}
function hostedBookmarkUrl(item){const hue=Math.round(((Number(item.hue??DEFAULT_HUE)%360)+360)%360);return `https://rafaelrbravo.com/prompt-launcher/colors/${hue}/?pl_id=${encodeURIComponent(item.id)}`;}
async function bookmarkBarId(){const tree=await chrome.bookmarks.getTree();const roots=tree?.[0]?.children||[];let bar=roots.find(x=>x.folderType==="bookmarks-bar")||roots.find(x=>/bookmark(s)? bar|favorites bar/i.test(x.title||""))||roots.find(x=>String(x.id)==="1");if(!bar)throw new Error("Could not identify the bookmarks bar.");return bar.id;}
async function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function primeFavicon(url){let tab=null;try{const primeUrl=url+(url.includes("?")?"&":"?")+"pl_prime=1";tab=await chrome.tabs.create({url:primeUrl,active:false});await wait(1800);}finally{if(tab?.id!=null){try{await chrome.tabs.remove(tab.id);}catch{}}}}
async function savePromptBookmark(item){const title=item.name||"Untitled",url=hostedBookmarkUrl(item);let existing=null;if(item.bookmarkId){try{existing=(await chrome.bookmarks.get(item.bookmarkId))?.[0]||null;}catch{existing=null;}}await primeFavicon(url);if(existing){await chrome.bookmarks.update(existing.id,{title,url});}else{const parentId=await bookmarkBarId();const made=await chrome.bookmarks.create({parentId,index:0,title,url});item.bookmarkId=made.id;await chrome.storage.local.set({prompts:state.prompts});}return !!existing;}
async function syncPromptBookmark(item){if(!item.bookmarkId)return;try{await chrome.bookmarks.update(item.bookmarkId,{title:item.name||"Untitled",url:hostedBookmarkUrl(item)});}catch{delete item.bookmarkId;await chrome.storage.local.set({prompts:state.prompts});}}
function render(){
  const root=document.getElementById("items");root.replaceChildren();
  for(const item of state.prompts){
    const row=document.createElement("div");row.className="item";row.dataset.promptId=item.id;
    const handle=document.createElement("button");handle.type="button";handle.className="dragHandle";handle.textContent="☰";handle.title="Drag to reorder";handle.setAttribute("aria-label","Drag to reorder prompt");handle.draggable=true;
    handle.addEventListener("dragstart",e=>{row.classList.add("dragging");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",item.id);});
    handle.addEventListener("dragend",()=>row.classList.remove("dragging"));
    row.addEventListener("dragover",e=>{e.preventDefault();e.dataTransfer.dropEffect="move";row.classList.add("dragOver");});
    row.addEventListener("dragleave",()=>row.classList.remove("dragOver"));
    row.addEventListener("drop",async e=>{e.preventDefault();row.classList.remove("dragOver");const draggedId=e.dataTransfer.getData("text/plain");if(!draggedId||draggedId===item.id)return;const from=state.prompts.findIndex(p=>p.id===draggedId),to=state.prompts.findIndex(p=>p.id===item.id);if(from<0||to<0)return;const [moved]=state.prompts.splice(from,1);state.prompts.splice(to,0,moved);await persist("Order saved");render();});
    const identity=document.createElement("div");identity.className="identity";
    const color=document.createElement("div");color.className="colorPicker";
    const swatch=document.createElement("button");swatch.type="button";swatch.className="colorCircle";swatch.title="Change tab color";swatch.setAttribute("aria-label","Change tab color");swatch.style.setProperty("--prompt-color",colorFromHue(item.hue));
    const slider=document.createElement("input");slider.className="hueSlider";slider.type="range";slider.min="0";slider.max="359";slider.step="1";slider.value=item.hue??DEFAULT_HUE;slider.title="HSV hue";slider.setAttribute("aria-label","HSV hue");slider.style.setProperty("--prompt-color",colorFromHue(item.hue));color.append(swatch,slider);
    const name=document.createElement("input");name.value=item.name;name.placeholder="Prompt name";identity.append(color,name);
    const prompt=document.createElement("textarea");prompt.value=item.prompt;prompt.placeholder="Prompt";
    const actions=document.createElement("div");actions.className="actions";
    const bookmark=document.createElement("button");bookmark.className="bookmark";bookmark.textContent=item.bookmarkId?"Update bookmark":"Add bookmark";
    const deleteBookmark=document.createElement("button");deleteBookmark.className="deleteBookmark";deleteBookmark.textContent="Delete bookmark";deleteBookmark.hidden=!item.bookmarkId;
    const del=document.createElement("button");del.className="delete";del.textContent="Delete prompt";
    name.addEventListener("change",async()=>{item.name=name.value.trim()||"Untitled";name.value=item.name;await syncPromptBookmark(item);await persist();});
    prompt.addEventListener("change",async()=>{item.prompt=prompt.value;await persist();});
    slider.addEventListener("input",()=>{item.hue=Number(slider.value);swatch.style.setProperty("--prompt-color",colorFromHue(item.hue));slider.style.setProperty("--prompt-color",colorFromHue(item.hue));});
    slider.addEventListener("change",async()=>{await syncPromptBookmark(item);await persist("Color saved");});
    bookmark.addEventListener("click",async()=>{try{const updated=await savePromptBookmark(item);bookmark.textContent="Update bookmark";deleteBookmark.hidden=false;await persist(updated?"Bookmark updated":"Bookmark added at far left");}catch(e){document.getElementById("status").textContent="Bookmark failed: "+(e?.message||String(e));}});
    deleteBookmark.addEventListener("click",async()=>{if(item.bookmarkId){try{await chrome.bookmarks.remove(item.bookmarkId);}catch{}delete item.bookmarkId;}await persist("Bookmark deleted");render();});
    del.addEventListener("click",async()=>{if(item.bookmarkId){try{await chrome.bookmarks.remove(item.bookmarkId);}catch{}}state.prompts=state.prompts.filter(x=>x.id!==item.id);await persist("Prompt deleted");render();});
    actions.append(bookmark,deleteBookmark,del);row.append(handle,identity,prompt,actions);root.append(row);
  }
}
document.getElementById("add").addEventListener("click",async()=>{state.prompts.push({id:crypto.randomUUID(),name:"",prompt:DEFAULT_NEW_PROMPT,hue:DEFAULT_HUE});await persist("Prompt added");render();});
load();


async function deleteAllPromptBookmarks(){
  const ids=[...new Set(state.prompts.map(p=>p.bookmarkId).filter(Boolean))];
  let removed=0;
  for(const id of ids){try{await chrome.bookmarks.remove(id);removed++;}catch{}}
  for(const p of state.prompts)delete p.bookmarkId;
  await chrome.storage.local.set({prompts:state.prompts});
  render();
  const status=document.getElementById("status");
  status.textContent=removed?`Deleted ${removed} Prompt Launcher bookmark${removed===1?"":"s"}`:"No Prompt Launcher bookmarks to delete";
  clearTimeout(persist.timer);persist.timer=setTimeout(()=>status.textContent="",1800);
}
document.getElementById("deleteAllBookmarks").addEventListener("click",deleteAllPromptBookmarks);

// Temporary v41 identity diagnostics.
(() => {
  const status=document.getElementById("status");
  const host=document.getElementById("deleteAllBookmarks")?.parentElement || document.body;
  const copy=document.createElement("button"); copy.textContent="Copy combined debug log";
  const clear=document.createElement("button"); clear.textContent="Clear identity debug log";
  copy.addEventListener("click", async()=>{const o=await chrome.storage.local.get(["identityDebugLog","faviconDomDebugLog"]);const combined=[...(o.identityDebugLog||[]),...(o.faviconDomDebugLog||[])].sort((a,b)=>String(a.t||"").localeCompare(String(b.t||"")));await navigator.clipboard.writeText(JSON.stringify(combined,null,2));status.textContent="Combined debug log copied";});
  clear.addEventListener("click", async()=>{await chrome.storage.local.remove(["identityDebugLog","faviconDomDebugLog"]);status.textContent="Combined debug log cleared";});
  host.append(copy,clear);
})();


// Portable clipboard transfer; bookmark IDs and extension-specific state are deliberately excluded.
const TRANSFER_FORMAT="chatgpt-prompt-launcher-prompts";
function transferStatus(message){const el=document.getElementById("status");el.textContent=message;clearTimeout(persist.timer);persist.timer=setTimeout(()=>el.textContent="",4500);}
document.getElementById("copyPrompts").addEventListener("click",async()=>{
  try{
    // Include unsaved edits in focused fields before export.
    if(document.activeElement?.matches(".item input, .item textarea"))document.activeElement.blur();
    await new Promise(resolve=>setTimeout(resolve,0));
    const prompts=state.prompts.map(p=>({name:p.name||"",prompt:p.prompt||"",hue:Number(p.hue??DEFAULT_HUE)}));
    await navigator.clipboard.writeText(JSON.stringify({format:TRANSFER_FORMAT,version:1,prompts},null,2));
    transferStatus(`Copied ${prompts.length} prompt${prompts.length===1?"":"s"} (no bookmarks)`);
  }catch(e){transferStatus("Copy failed: "+(e?.message||String(e)));}
});
document.getElementById("pastePrompts").addEventListener("click",async()=>{
  try{
    const raw=await navigator.clipboard.readText();
    const data=JSON.parse(raw);
    if(data?.format!==TRANSFER_FORMAT||data.version!==1||!Array.isArray(data.prompts))throw Error("Clipboard does not contain a compatible Prompt Launcher export");
    if(data.prompts.length>1000)throw Error("Too many prompts in clipboard");
    const prompts=data.prompts.map((p,i)=>{
      if(!p||typeof p.name!=="string"||typeof p.prompt!=="string"||!Number.isInteger(p.hue)||p.hue<0||p.hue>359||p.name.length>10000||p.prompt.length>1000000)throw Error(`Invalid prompt at position ${i+1}`);
      return {id:crypto.randomUUID(),name:p.name,prompt:p.prompt,hue:p.hue};
    });
    if(state.prompts.length&&!confirm(`Replace ${state.prompts.length} existing prompt(s) with ${prompts.length} copied prompt(s)? Existing bookmarks will not be modified, but their associations with these prompts will be lost.`))return;
    state.prompts=prompts;
    await persist(`Imported ${prompts.length} prompts; no bookmarks changed`);
    render();
    transferStatus(`Imported ${prompts.length} prompt${prompts.length===1?"":"s"}; no bookmarks created`);
  }catch(e){transferStatus("Paste failed: "+(e?.message||String(e)));}
});
