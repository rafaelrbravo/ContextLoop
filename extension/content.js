(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  let promptId = params.get("pl_id") || "";
  let activeConversationId = "";
  let launchConversationId = "";
  const CONVERSATION_MAP_KEY = "conversationPromptMap";

  function conversationIdFromUrl(url=location.href) {
    try {
      const m = new URL(url).pathname.match(/^\/c\/([^/?#]+)/);
      return m ? m[1] : "";
    } catch { return ""; }
  }

  async function getConversationMap() {
    return (await chrome.storage.local.get(CONVERSATION_MAP_KEY))[CONVERSATION_MAP_KEY] || {};
  }

  async function setConversationMapping(conversationId, id) {
    if (!conversationId || !id) return;
    const map = await getConversationMap();
    if (map[conversationId] === id) return;
    map[conversationId] = id;
    await chrome.storage.local.set({[CONVERSATION_MAP_KEY]: map});
  }
  const FALLBACK = { idle:"#000000" };
  let promptColor = null;
  let faviconPromptId = promptId;
  let state = "idle";
  let mode = "chat";
  let lastWorking = false;

  function hsvHueColor(hue) {
    // Single-slider prompt palette: user controls HSV H (hue); S/V stay fixed.
    const h = (((Number(hue ?? 205) % 360) + 360) % 360) / 60;
    const s = 0.78, v = 0.82, c = v * s, x = c * (1 - Math.abs((h % 2) - 1)), m = v - c;
    let r=0,g=0,b=0;
    if(h<1)[r,g,b]=[c,x,0]; else if(h<2)[r,g,b]=[x,c,0]; else if(h<3)[r,g,b]=[0,c,x];
    else if(h<4)[r,g,b]=[0,x,c]; else if(h<5)[r,g,b]=[x,0,c]; else [r,g,b]=[c,0,x];
    return `rgb(${Math.round((r+m)*255)},${Math.round((g+m)*255)},${Math.round((b+m)*255)})`;
  }

  function faded(color) {
    const c = document.createElement("canvas"); c.width=c.height=1;
    const g=c.getContext("2d"); g.fillStyle=color; g.fillRect(0,0,1,1);
    const [r,gg,b]=Array.from(g.getImageData(0,0,1,1).data);
    // Mix strongly toward white while retaining the prompt identity color.
    const mix = n => Math.round(n*0.38 + 255*0.62);
    return `rgb(${mix(r)},${mix(gg)},${mix(b)})`;
  }

  function icon(color, shape, borderColor="#202124") {
    const c=document.createElement("canvas"); c.width=c.height=64; const g=c.getContext("2d");
    g.fillStyle=borderColor;
    if(shape==="work") { g.fillRect(2,2,60,60); g.fillStyle=color; g.fillRect(7,7,50,50); }
    else { g.beginPath(); g.arc(32,32,30,0,Math.PI*2); g.fill(); g.beginPath(); g.arc(32,32,25,0,Math.PI*2); g.fillStyle=color; g.fill(); }
    return c.toDataURL("image/png");
  }

  function currentColor(kind) {
    const base = promptColor || FALLBACK.idle;
    return kind === "working" ? faded(base) : base;
  }

  function forceFavicon(kind,currentMode=mode) {
    state=kind; mode=currentMode; if(!document.head)return;
    document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"],link[rel="mask-icon"]').forEach(n=>n.remove());
    const link=document.createElement("link"); link.id="chatgpt-prompt-launcher-favicon"; link.rel="icon"; link.type="image/png"; link.href=icon(currentColor(kind),currentMode,promptColor ? "#202124" : "#ffffff"); document.head.appendChild(link);
  }
  function visible(el){if(!el)return false;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=="none"&&s.visibility!=="hidden";}
  function isWorkMode(){
    if (/(^|\/)work(\/|$)/i.test(location.pathname)) return true;
    const candidates=document.querySelectorAll('button,[role="button"],[role="option"],[role="menuitem"],[data-testid],[aria-label]');
    for(const el of candidates){if(!visible(el))continue;const text=[el.getAttribute("data-testid"),el.getAttribute("aria-label"),el.getAttribute("title"),el.textContent].filter(Boolean).join(" ").trim().toLowerCase();const selected=el.getAttribute("aria-pressed")==="true"||el.getAttribute("aria-selected")==="true"||el.getAttribute("data-state")==="on"||el.getAttribute("data-state")==="checked"||el.getAttribute("data-state")==="active";if(selected&&/(^|\s)work(\s|$)/.test(text))return true;}
    for(const el of candidates){if(!visible(el))continue;const label=[el.getAttribute("aria-label"),el.getAttribute("title")].filter(Boolean).join(" ").trim().toLowerCase();if(label==="work"||label==="work mode"||label.includes("work mode"))return true;} return false;
  }
  function isWorking(){const candidates=document.querySelectorAll('button,[role="button"],[data-testid],[aria-label]');for(const el of candidates){if(!visible(el))continue;const text=[el.getAttribute("data-testid"),el.getAttribute("aria-label"),el.getAttribute("title"),el.textContent].filter(Boolean).join(" ").trim().toLowerCase();if(text.includes("stop generating")||text.includes("stop streaming")||text.includes("stop responding")||text.includes("stop response")||text.includes("stop task")||text.includes("stop work")||text==="stop")return true;}return false;}
  function update(){if(!document.head)return;const working=isWorking(),currentMode=isWorkMode()?"work":"chat",modeChanged=currentMode!==mode;if(working){if(state!=="working"||modeChanged)forceFavicon("working",currentMode);}else if(lastWorking){forceFavicon("idle",currentMode);}else if(state!=="idle"||modeChanged){forceFavicon("idle",currentMode);}lastWorking=working;document.documentElement.dataset.plTrafficWorking=working?"true":"false";document.dispatchEvent(new CustomEvent("pl-traffic-state",{detail:{working}}));}

  async function loadPromptColor(id=faviconPromptId){
    if(!id){promptColor=null;return false;}
    const {prompts=[]}=await chrome.storage.local.get("prompts");
    const item=prompts.find(x=>x.id===id);
    if(!item)return false;
    faviconPromptId=id;
    promptColor=hsvHueColor(item.hue ?? 205);
    return true;
  }

  async function resolveInitialIdentity(){
    activeConversationId=conversationIdFromUrl();
    if(promptId){
      launchConversationId=activeConversationId;
      if(activeConversationId) await setConversationMapping(activeConversationId,promptId);
      return;
    }
    if(activeConversationId){
      const map=await getConversationMap();
      promptId=map[activeConversationId]||"";
      faviconPromptId=promptId;
    }
  }

  async function syncConversationIdentity(){
    const nextConversationId=conversationIdFromUrl();
    if(nextConversationId===activeConversationId)return;
    const previousConversationId=activeConversationId;
    activeConversationId=nextConversationId;
    const map=await getConversationMap();

    // A newly submitted chat first receives a local-chatgpt:* ID, then ChatGPT
    // promotes that same conversation to its permanent ID in the same document.
    if(promptId && previousConversationId && previousConversationId===launchConversationId &&
       previousConversationId.startsWith("local-chatgpt%3A") && nextConversationId && !map[nextConversationId]){
      await setConversationMapping(nextConversationId,promptId);
      launchConversationId=nextConversationId;
      return;
    }

    // First conversation ID created from the launcher URL.
    if(promptId && !previousConversationId && nextConversationId){
      await setConversationMapping(nextConversationId,promptId);
      launchConversationId=nextConversationId;
      return;
    }

    // Ordinary SPA navigation: identity belongs to the destination conversation.
    if(nextConversationId){
      const mapped=map[nextConversationId]||"";
      promptId=mapped;
      if(mapped){
        await loadPromptColor(mapped);
      }else{
        faviconPromptId="";
        promptColor=null;
      }
      forceFavicon(state,isWorkMode()?"work":"chat");
    }
  }

  async function bootTraffic(){
    await resolveInitialIdentity();
    await loadPromptColor();
    const boot=()=>{if(!document.head)return setTimeout(boot,25);mode=isWorkMode()?"work":"chat";forceFavicon("idle",mode);document.addEventListener("visibilitychange",update);window.addEventListener("focus",update);const obs=new MutationObserver(()=>{const ours=document.getElementById("chatgpt-prompt-launcher-favicon");const foreign=document.querySelector('link[rel="icon"]:not(#chatgpt-prompt-launcher-favicon),link[rel="shortcut icon"],link[rel="apple-touch-icon"],link[rel="mask-icon"]');if(!ours||foreign)forceFavicon(state,mode);});obs.observe(document.head,{childList:true,subtree:true,attributes:true});setInterval(()=>{syncConversationIdentity();update();},500);}; boot();
  }
  bootTraffic();

  // Persistent Prompt Launcher strip in ChatGPT's left sidebar.
  const BAR_ID="chatgpt-prompt-launcher-bar";
  const BAR_STYLE_ID="chatgpt-prompt-launcher-bar-style";
  function promptHref(item){return "https://chatgpt.com/?pl_autosend=1&pl_prompt="+encodeURIComponent(item.prompt||"")+"&pl_id="+encodeURIComponent(item.id);}
  function ensureBarStyle(){
    if(document.getElementById(BAR_STYLE_ID))return;
    const st=document.createElement("style");st.id=BAR_STYLE_ID;st.textContent=`
#${BAR_ID}{display:flex;align-items:center;gap:5px;padding:6px 8px;margin:2px 4px 6px;flex-wrap:wrap;overflow:visible;flex:0 0 auto}
#${BAR_ID} a{display:flex;align-items:center;gap:5px;height:28px;min-width:max-content;padding:0 6px;border-radius:6px;text-decoration:none;color:inherit;font-size:13px;font-weight:500;line-height:1;white-space:nowrap;transition:background .12s ease,transform .08s ease}
#${BAR_ID} .pl-dot{display:inline-block;width:9px;height:9px;min-width:9px;border-radius:50%;border:1px solid rgba(0,0,0,.28);flex:none}
#${BAR_ID} a:hover{background:rgba(127,127,127,.14)} #${BAR_ID} a:active{transform:scale(.97)} #${BAR_ID} .pl-label{display:block;overflow:hidden;text-overflow:ellipsis;max-width:140px}
`;document.documentElement.appendChild(st);
  }
  function findSidebarHost(){
    const navs=[...document.querySelectorAll("nav")].filter(visible);
    for(const nav of navs){const r=nav.getBoundingClientRect();if(r.left<80&&r.width>160&&r.width<500&&r.height>300)return nav;}
    const asides=[...document.querySelectorAll("aside")].filter(visible);
    for(const el of asides){const r=el.getBoundingClientRect();if(r.left<80&&r.width>160&&r.width<500&&r.height>300)return el;}
    return null;
  }
  async function renderPromptBar(){
    ensureBarStyle();
    const host=findSidebarHost();if(!host)return false;
    let bar=document.getElementById(BAR_ID);if(!bar){bar=document.createElement("div");bar.id=BAR_ID;bar.setAttribute("aria-label","Prompt Launcher");host.prepend(bar);}else if(!host.contains(bar))host.prepend(bar);
    const {prompts=[]}=await chrome.storage.local.get("prompts");bar.replaceChildren();
    for(const item of prompts){
      const a=document.createElement("a");a.href=promptHref(item);a.title=item.name||"Untitled";a.setAttribute("aria-label",item.name||"Untitled");const label=document.createElement("span");label.className="pl-label";label.textContent=item.name||"Untitled";const dot=document.createElement("span");dot.className="pl-dot";dot.style.backgroundColor=hsvHueColor(item.hue??205);dot.setAttribute("aria-hidden","true");a.append(dot,label);bar.appendChild(a);
    }
    bar.hidden=prompts.length===0;return true;
  }
  let barRenderPending=false;
  function scheduleBarRender(){if(barRenderPending)return;barRenderPending=true;setTimeout(async()=>{barRenderPending=false;await renderPromptBar();},80);}
  function bootPromptBar(){
    const start=()=>{renderPromptBar();const obs=new MutationObserver(()=>{if(!document.getElementById(BAR_ID)||!findSidebarHost()?.contains(document.getElementById(BAR_ID)))scheduleBarRender();});obs.observe(document.documentElement,{childList:true,subtree:true});};
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
    chrome.storage.onChanged.addListener((changes,area)=>{if(area==="local"&&changes.prompts)scheduleBarRender();});
  }
  bootPromptBar();

  const RECENT_STYLE_ID="chatgpt-prompt-launcher-recent-context-style";
  function cssEscapeString(v){return String(v).replace(/\\/g,"\\\\").replace(/"/g,'\\"');}
  async function decorateRecents(){
    const map=await getConversationMap();
    const {prompts=[]}=await chrome.storage.local.get("prompts");
    const byId=new Map(prompts.map(p=>[p.id,p]));
    const rules=[];
    for(const [cid,pid] of Object.entries(map)){
      const item=byId.get(pid); if(!item)continue;
      const color=hsvHueColor(item.hue??205);
      rules.push(`a[href*="/c/${cssEscapeString(cid)}"]::before{content:"" !important;width:9px !important;height:9px !important;min-width:9px !important;max-width:9px !important;border-radius:50% !important;border:1px solid #202124 !important;display:inline-block !important;margin:0 7px 0 0 !important;padding:0 !important;box-sizing:border-box !important;background-color:${color} !important;background-image:none !important;opacity:1 !important;filter:none !important;box-shadow:none !important;flex:0 0 9px !important}`);
    }
    let st=document.getElementById(RECENT_STYLE_ID);
    if(!st){st=document.createElement("style");st.id=RECENT_STYLE_ID;document.documentElement.appendChild(st);}
    const css=rules.join("\n"); if(st.textContent!==css)st.textContent=css;
  }
  decorateRecents();
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==="local"&&(changes.prompts||changes[CONVERSATION_MAP_KEY]))decorateRecents();});

  if (params.get("pl_autosend") !== "1") return;
  async function resolveWantedPrompt(){
    const direct=params.get("pl_prompt")||params.get("prompt")||"";
    if(direct)return direct;
    if(!promptId)return "";
    const {prompts=[]}=await chrome.storage.local.get("prompts");
    return prompts.find(x=>x.id===promptId)?.prompt||"";
  }
  let wanted="";
  async function bootAutosend(){
    wanted=await resolveWantedPrompt(); if(!wanted)return;
  const editorSelectors=["#prompt-textarea",'div[contenteditable="true"][data-lexical-editor="true"]','div[contenteditable="true"][role="textbox"]',"textarea"];
  const sendSelectors=['button[data-testid="send-button"]','button[aria-label="Send prompt"]','button[aria-label^="Send" i]'];
  const getEditor=()=>document.querySelector(editorSelectors.join(",")); const getText=e=>((e?.innerText??e?.value??"")+"").trim();
  function fillEditor(editor){editor.focus();if(editor instanceof HTMLTextAreaElement||editor instanceof HTMLInputElement){const proto=editor instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;if(setter)setter.call(editor,wanted);else editor.value=wanted;editor.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText",data:wanted}));editor.dispatchEvent(new Event("change",{bubbles:true}));}else{const sel=window.getSelection(),range=document.createRange();range.selectNodeContents(editor);sel.removeAllRanges();sel.addRange(range);document.execCommand("insertText",false,wanted);editor.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText",data:wanted}));}}
  let attempts=0;const maxAttempts=160;const timer=setInterval(()=>{attempts++;const editor=getEditor();if(!editor){if(attempts>=maxAttempts)clearInterval(timer);return;}if(!getText(editor))fillEditor(editor);if(!getText(editor)){if(attempts>=maxAttempts)clearInterval(timer);return;}const send=document.querySelector(sendSelectors.join(","));if(send&&!send.disabled&&send.getAttribute("aria-disabled")!=="true"){clearInterval(timer);send.click();return;}if(attempts>20){editor.focus();const opts={key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:true,cancelable:true};editor.dispatchEvent(new KeyboardEvent("keydown",opts));editor.dispatchEvent(new KeyboardEvent("keyup",opts));}if(attempts>=maxAttempts)clearInterval(timer);},150);

  }
  bootAutosend();
})();
