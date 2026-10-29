/* Auto-Continue: independent from Prompt Launcher v46's unmodified content.js.
   The editor uses the original light-DOM approach to preserve native typing.
   Styles are scoped to the extension host to avoid affecting ChatGPT. */
(() => {
  'use strict';
  if (window.__plAutoContinueInstalled) return;
  window.__plAutoContinueInstalled = true;
  const KEY = 'plAutoContinueSettings';
  const DEFAULT_CONTINUE_PROMPT='Continue the original assignment for one work cycle. Review progress and remaining tasks, then execute the highest-value unfinished work. Prioritize substantive results over planning, repetition, unnecessary verification, or marginal improvements.\n\nIf blocked, make whatever progress is possible, then complete all other independent work before revisiting the blocker. Persist through reasonable alternatives, but avoid unproductive retries.\n\nContinue across cycles while meaningful work remains. Only when the overall assignment is complete, or all feasible work has been exhausted and remaining blockers cannot be resolved, summarize the outcome and end with AUTOCONTINUE_COMPLETE on its own final line. Never use this marker merely because an individual cycle has ended.';
  const PREVIOUS_CONTINUE_PROMPT='Continue working towards the original assignment. Review progress and remaining tasks, and make substantive progress before stopping.';
  const defaults = {prompt:DEFAULT_CONTINUE_PROMPT, cycles:-1, minutes:-1, stop:'AUTOCONTINUE_COMPLETE', rollover:30};
  const HANDOFF_PREFIX='plRollover:';
  const conversationId=()=>location.pathname.match(/^\/c\/([^/?#]+)/)?.[1]||'';
  // DOM changes wake background tabs even when Chrome throttles timer callbacks.
  // A bounded timer remains necessary to confirm stable responses and deadlines.
  const delay = ms => new Promise(resolve => {
    let done=false, observer;
    const finish=()=>{if(done)return;done=true;observer?.disconnect();clearTimeout(timer);resolve();};
    const timer=setTimeout(finish,ms);
    // Only wake early for substantive conversation/composer changes, not the
    // Auto-Continue overlay's own status updates.
    observer=new MutationObserver(records=>{
      if(records.some(r=>!r.target?.closest?.('#pl-autocontinue-host')))finish();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-talvt-turn-state','data-pl-traffic-working','disabled','aria-disabled']});
  });
  const editor = () => {
    // Prefer ChatGPT's explicit composer ID, but tolerate current DOM variants.
    // Fallback candidates must belong to a visible form/composer near the bottom
    // of the viewport and must not live inside a conversation turn.
    const candidates=[
      document.querySelector('#prompt-textarea'),
      ...document.querySelectorAll('form div[contenteditable="true"][data-lexical-editor="true"],form div[contenteditable="true"][role="textbox"],form textarea,[data-testid="composer"] div[contenteditable="true"],[data-testid="composer"] textarea')
    ].filter(Boolean);
    const seen=new Set();
    return candidates.find(el=>{
      if(seen.has(el))return false;seen.add(el);
      if(!el.isConnected || el.closest('[data-message-author-role],[data-chatgpt-search-unit-key],[data-content-search-unit-key]'))return false;
      const box=(el.closest('form')||el.closest('[data-testid="composer"]')||el).getBoundingClientRect();
      return box.width>0 && box.height>0 && box.bottom>window.innerHeight*0.55 && box.top<window.innerHeight;
    }) || null;
  };
  const editorText = el => (el?.innerText ?? el?.value ?? '').trim();
  const send = () => {
    const e=editor();
    if(!e)return null;
    const composer=e.closest('form') || e.closest('[data-testid="composer"]');
    if(!composer)return null;
    // Scope Send detection to the actual composer, never a conversation turn
    // or another unrelated page control.
    const selectors=[
      'button[data-testid="send-button"]',
      'button[data-testid="composer-submit-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label^="Send" i]',
      'button[type="submit"]'
    ];
    const candidates=[...composer.querySelectorAll(selectors.join(','))];
    const visibleButtons=candidates.filter(b=>{
      const rect=b.getBoundingClientRect();
      return b.isConnected && rect.width>0 && rect.height>0 &&
        getComputedStyle(b).visibility!=='hidden' &&
        getComputedStyle(b).display!=='none';
    });
    // The composer may contain an inactive Send button and a live submit
    // control simultaneously. Never stop at the first disabled match.
    const enabled=visibleButtons.filter(b=>!b.disabled && b.getAttribute('aria-disabled')!=='true');
    return enabled[0] || null;
  };
  // Both the classic and the current search-unit based conversation DOM.
  const roleUnits = role => {
    const old=[...document.querySelectorAll(`[data-message-author-role="${role}"]`)];
    if(old.length)return old;
    return [...document.querySelectorAll(`[data-conversation-role="${role}"]`)]
      .map(label=>label.closest('[data-chatgpt-search-unit-key],[data-content-search-unit-key]') || label.parentElement)
      .filter(Boolean);
  };
  const messages = () => roleUnits('assistant');
  const userMessages = () => {
    const modern=roleUnits('user');
    if(modern.length)return modern.length;
    // Current ChatGPT UI labels user turns with an unannotated "You said:" H4.
    // Count those headings only; do not infer from arbitrary text or CSS classes.
    // Search-unit turns do not consistently carry either turn-key attribute.
    // The previous ancestor requirement silently returned zero for valid turns.
    return [...document.querySelectorAll('h4')].filter(el =>
      el.textContent?.trim()==='You said:'
    ).length;
  };
  const latestMessage = () => messages().at(-1);
  const latestText = () => {
    const m=latestMessage();
    if(!m)return '';
    return m.innerText || m.textContent || '';
  };
  const signature = () => `${messages().length}:${latestText()}`;
  const latestTurnComplete = () => {
    const m=latestMessage();
    if(!m)return false;
    const turn=m.closest('[data-talvt-turn-state]');
    return turn?.getAttribute('data-talvt-turn-state')==='complete';
  };
  const hasStopMarker = marker => {
    const m=latestMessage(), target=(marker||'').trim();
    if(!m||!target)return false;
    const clean=s=>(s||'').replace(/[\u200b-\u200d\ufeff]/g,'').trim();
    // A quoted example or earlier paragraph must never end the entire loop.
    const lines=(m.innerText||'').replace(/\r\n?/g,'\n').split('\n').map(clean).filter(Boolean);
    return lines.at(-1)===target;
  };
  const visible = e => !!e && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  // The favicon Traffic Light owns the working/ready signal.  This script
  // consumes its published state rather than independently scanning controls.
  const isBusy = () => document.documentElement.dataset.plTrafficWorking === 'true';
  let host, root, toggle, panel, statusNode, elapsedNode, runButton, active=null, settings={...defaults}, lastPage=location.href, terminalStatus='Ready';
  function updateElapsed(session=active) {
    if(!elapsedNode || !session)return;
    const minutes=Math.floor(Math.max(0,Date.now()-session.startedAt)/60000);
    elapsedNode.textContent=`Elapsed: ${minutes} min`;
  }
  function status(s) {if(statusNode) statusNode.textContent=s; if(toggle) toggle.title=`Auto-Continue: ${s}`;}
  function stop(s='Stopped') {terminalStatus=s;if(active){updateElapsed(active);active.cancelled=true;active=null;}if(runButton)runButton.textContent='Run';status(s);}
  function stillActive(s) {if(active!==s||s.cancelled)return false;if(location.href!==s.url){stop('Conversation changed');return false;}return true;}
  function expired(s) {return Date.now()>=s.deadline;}
  function fill(el,value) {
    el.focus();
    if(el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);
      el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));
    } else {
      const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(el);selection.removeAllRanges();selection.addRange(range);
      document.execCommand('insertText',false,value);
      el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));
    }
  }
  // Do not count an unchanged, preexisting assistant message as a new response.
  async function waitForIdle(s, baseline=null, baselineUsers=null) {
    let previous='',stable=0,observedBusy=false;
    const startingAssistants=messages().length;
    const requireNewResponse=baseline!==null;
    while(stillActive(s)) {
      if(expired(s)) {stop('Session timeout');return false;}
      const busy=isBusy(), sig=signature();
      if(busy) observedBusy=true;
      // Do not mistake an old assistant response (or a changing composer)
      // for the response to the continuation prompt we just submitted.
      const newAssistant=messages().length>startingAssistants ||
        (requireNewResponse && sig!==baseline && userMessages()>baselineUsers);
      const eligible=!requireNewResponse || newAssistant;
      if(eligible && !busy && sig===previous)stable++;else stable=0;
      previous=sig;
      if(eligible && stable>=7 && !busy)return true;
      await delay(500);
    }
    return false;
  }
  async function waitForReply(s, beforeUsers, beforeAssistants, beforeSignature, submittedEditor, submittedAt) {
    let previous='',stable=0,seenResponse=false,seenBusy=false,loops=0,seenComposerClear=false;

    while(stillActive(s)) {
      if(expired(s)){stop('Session timeout');return false;}
      const users=userMessages(), busy=isBusy(), sig=signature();
      // A cleared composer confirms that ChatGPT accepted the click even when
      // virtualized user turns leave the visible user count unchanged.
      if(submittedEditor?.isConnected && !editorText(submittedEditor))seenComposerClear=true;
      // Ambiguous DOM evidence is not proof of a failed submission. Never resend.
      if(++loops%4===0)status(`Running ${s.currentCycle || 0} / ${s.settings.cycles} · sent:${users>beforeUsers?'Y':'N'} · reply:${seenResponse?'Y':'N'} · busy:${busy?'Y':'N'} · assistants:${messages().length-beforeAssistants>=0?'+':''}${messages().length-beforeAssistants} · changed:${sig!==beforeSignature?'Y':'N'} · stable:${stable}`);
      // Wait for the sent prompt to enter the conversation. The assistant
      // element count is not reliable in ChatGPT's virtualized message DOM.
      const sent=users>beforeUsers;
      if(busy)seenBusy=true;
      // A new assistant turn is stronger evidence than unreliable user-heading counts.
      // Never retry submission: accept an observed reply even when the user DOM is uncountable.
      const assistantChanged=messages().length>beforeAssistants || sig!==beforeSignature;
      const completedChangedTurn=seenComposerClear && Date.now()-submittedAt>=1500 &&
        sig!==beforeSignature && !!latestMessage()?.closest('[data-talvt-turn-state]') && latestTurnComplete();
      if(assistantChanged && (sent || seenBusy || messages().length>beforeAssistants || completedChangedTurn))seenResponse=true;
      if(seenResponse && !busy && sig===previous && (!latestMessage()?.closest('[data-talvt-turn-state]') || latestTurnComplete()))stable++;else stable=0;
      previous=sig;
      if(stable>=7 && (seenBusy || sent || messages().length>beforeAssistants || completedChangedTurn))return true;
      await delay(500);
    }
    return false;
  }
  async function rollover(s) {
    if(!stillActive(s))return false;
    const id=conversationId();
    const map=(await chrome.storage.local.get('conversationPromptMap')).conversationPromptMap||{};
    const promptId=s.promptId||new URLSearchParams(location.search).get('pl_id')||map[id];
    const prompts=(await chrome.storage.local.get('prompts')).prompts||[];
    const launcher=prompts.find(p=>p.id===promptId && p.prompt?.trim());
    if(!launcher){stop('Rollover unavailable: no saved launcher prompt');return false;}
    const token=crypto.randomUUID();
    const handoff={token,promptId,settings:{...s.settings,cycles:s.settings.cycles===Infinity?0:s.settings.cycles,minutes:s.settings.minutes===Infinity?0:s.settings.minutes},startedAt:s.startedAt,completed:s.completed,createdAt:Date.now()};
    await chrome.storage.local.set({[HANDOFF_PREFIX+token]:handoff});
    // Confirm tab creation before reporting transfer; preserve session on error.
    status('Opening rollover tab');
    try {
      const reply=await chrome.runtime.sendMessage({type:'pl-rollover-open',token,promptId});
      if(!reply?.ok || !Number.isInteger(reply.tabId))throw Error(reply?.error||'Tab creation failed');
      stop('Transferred to new tab');
      return true;
    }catch(err){
      status('Rollover failed: '+(err?.message||err)+'; loop paused');
      stop('Rollover failed: '+(err?.message||err)+'; handoff saved');
      return false;
    }
  }
  async function execute(s) {
    status('Waiting for ChatGPT');
    if(!await waitForIdle(s))return;
    // Pre-existing assistant messages (including setup instructions) cannot stop a cycle.
    for(let i=s.completed;i<s.settings.cycles && stillActive(s);i++) {
      if(expired(s)){stop('Session timeout');return;}
      const e=editor();if(!e||editorText(e)){stop('Composer unavailable or not empty');return;}
      const before=signature(), beforeUsers=userMessages(), beforeAssistants=messages().length;
      fill(e,s.settings.prompt);
      await delay(350);
      if(!stillActive(s))return;
      // React may render the enabled Send control shortly after the input event.
      // Wait briefly for it; never click a disabled or unrelated button.
      let b=null;
      for(let attempt=0;attempt<12 && stillActive(s);attempt++){
        b=send();if(b)break;
        await delay(250);
      }
      if(!stillActive(s))return;
      if(!b){stop('Send unavailable: no enabled Send button in composer');return;}
      s.currentCycle=i+1;b.click();const submittedAt=Date.now();status(`Running ${i+1} / ${s.settings.cycles}`);
      // Wait for a genuinely new assistant turn, not a transient old message.
      if(!await waitForReply(s,beforeUsers,beforeAssistants,before,e,submittedAt))return;
      if(!stillActive(s))return;
      s.completed=i+1;status(`Completed ${s.completed} / ${s.settings.cycles}`);
      if(hasStopMarker(s.settings.stop)) {stop('Stop string detected');return;}
      if(s.settings.rollover>0 && s.completed<s.settings.cycles && s.completed%s.settings.rollover===0){await rollover(s);return;}
    }
    if(active===s)stop('All cycles completed');
  }
  function position() {
    if(!host)return;
    const e=editor();
    if(!e)return; // Retain last valid position while composer is temporarily absent.
    const composer=e.closest('form')||e.closest('[data-testid="composer"]')||e.parentElement;
    const r=composer?.getBoundingClientRect();if(!r?.width||!r?.height)return; // Never re-anchor to an unrelated field.
    host.style.display='block';
    // Separate overlay, never occupies the composer layout or shrinks its input.
    const x=Math.max(4,r.left-40), y=Math.max(4,r.bottom-39);
    host.style.left=`${x}px`;host.style.top=`${y}px`;
    if(!panel.hidden) {panel.style.left='0px';panel.style.bottom='43px';}
  }
  function mount() {
    if(!document.body||host)return;
    host=document.createElement('div');host.id='pl-autocontinue-host';
    host.style.cssText='position:fixed;z-index:2147483640;width:34px;height:34px;pointer-events:none';
    root=host;
    root.innerHTML=`<style>
      #pl-autocontinue-host *{box-sizing:border-box}#pl-autocontinue-host button,#pl-autocontinue-host input,#pl-autocontinue-host textarea{font:inherit}#pl-autocontinue-host button{cursor:pointer}
      #pl-autocontinue-host #toggle{pointer-events:auto;width:34px;height:34px;border-radius:50%;border:1px solid #8887;background:var(--main-surface-primary,#fff);color:var(--text-primary,#222);font:24px system-ui;display:grid;place-items:center}
      #pl-autocontinue-host #toggle:hover{background:var(--surface-hover,#ddd)}
      #pl-autocontinue-host #panel{pointer-events:auto;position:absolute;width:min(340px,calc(100vw - 20px));max-height:75vh;overflow:auto;background:var(--main-surface-primary,#fff);color:var(--text-primary,#222);border:1px solid #8887;border-radius:14px;padding:14px;box-shadow:0 8px 28px #0004;font:13px system-ui}
      #pl-autocontinue-host [hidden]{display:none!important}#pl-autocontinue-host .heading{display:flex;justify-content:space-between;align-items:center;font-size:16px;font-weight:700}
      #pl-autocontinue-host .close{background:none;border:0;color:inherit;font-size:20px}#pl-autocontinue-host label{display:block;margin:10px 0 5px;font-weight:600}#pl-autocontinue-host .promptHead{display:flex;justify-content:space-between;align-items:center}#pl-autocontinue-host .defaultPrompt:disabled{opacity:.38;cursor:default}#pl-autocontinue-host .defaultPrompt:not(:disabled){cursor:pointer}#pl-autocontinue-host .defaultPrompt{border:1px solid #8887;border-radius:7px;padding:3px 7px;background:transparent;color:inherit;font-size:12px;font-weight:500}
      #pl-autocontinue-host textarea,#pl-autocontinue-host input{display:block;width:100%;margin-top:5px;padding:7px;border:1px solid #8887;border-radius:7px;background:var(--main-surface-primary,#fff);color:inherit}
      #pl-autocontinue-host .fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}#pl-autocontinue-host .actions{display:flex;gap:8px;margin:12px 0}#pl-autocontinue-host .actions button{flex:1;border:1px solid #8887;border-radius:8px;padding:8px}#pl-autocontinue-host .run{background:#2563eb;color:white}#pl-autocontinue-host .status{font-size:12px}#pl-autocontinue-host small{opacity:.7}
    </style><button id="toggle" type="button" aria-label="Auto-Continue" title="Auto-Continue">↻</button>
    <section id="panel" hidden><div class="heading">Auto-Continue <button class="close" type="button" aria-label="Close panel">×</button></div>
    <label><span class="promptHead"><span>Continuation prompt</span><button class="defaultPrompt" data-default="prompt" type="button">Default</button></span><textarea id="prompt" rows="5"></textarea></label>
    <div class="fields"><label><span class="promptHead"><span>Cycles</span><button class="defaultPrompt" data-default="cycles" type="button">Default</button></span><input id="cycles" type="text" inputmode="numeric" placeholder="10000 (≤0: no limit)"></label><label><span class="promptHead"><span>Timeout (minutes)</span><button class="defaultPrompt" data-default="minutes" type="button">Default</button></span><input id="minutes" type="text" inputmode="decimal" placeholder="480 (≤0: no limit)"></label></div>
    <label><span class="promptHead"><span>Rollover every N cycles (0 or negative disables)</span><button class="defaultPrompt" data-default="rollover" type="button">Default</button></span><input id="rollover" type="text" inputmode="numeric" placeholder="0 (disabled)"></label>
    <label><span class="promptHead"><span>Stop string</span><button class="defaultPrompt" data-default="stop" type="button">Default</button></span><input id="stop" type="text"></label><div class="status" id="status" role="status">Ready</div><div class="status" id="elapsed">Elapsed: 0 min</div>
    <div class="actions"><button class="run" id="run" type="button">Run</button><button id="cancel" type="button">Cancel loop</button></div>
    <small>Keep this ChatGPT tab open without refreshing or changing conversations.</small></section>`;
    document.body.appendChild(host);
    toggle=root.querySelector('#'+'toggle');panel=root.querySelector('#'+'panel');statusNode=root.querySelector('#'+'status');elapsedNode=root.querySelector('#'+'elapsed');runButton=root.querySelector('#'+'run');
    const fields=['prompt','cycles','minutes','stop','rollover'];
    const refreshDefaults=()=>root.querySelectorAll('[data-default]').forEach(button=>{const k=button.dataset.default;button.disabled=root.querySelector('#'+k).value===String(defaults[k]);});
    const populate=()=>{fields.forEach(k=>root.querySelector('#'+k).value=settings[k]);refreshDefaults();};
    populate();
    chrome.storage.local.get(KEY).then(async result=>{const saved=result[KEY]||{};settings={...defaults,...saved};if(settings.prompt===PREVIOUS_CONTINUE_PROMPT){settings.prompt=DEFAULT_CONTINUE_PROMPT;await chrome.storage.local.set({[KEY]:{...saved,prompt:DEFAULT_CONTINUE_PROMPT}});}if(!active)populate();});
    toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;position();});
    root.querySelector('.close').addEventListener('click',()=>panel.hidden=true);
    // Native light-DOM fields: do not intercept typing, paste, or focus events.
    root.querySelector('#'+'cancel').addEventListener('click',()=>stop());
    fields.forEach(k=>root.querySelector('#'+k).addEventListener('input',refreshDefaults));
    root.querySelectorAll('[data-default]').forEach(button=>button.addEventListener('click',()=>{const k=button.dataset.default;root.querySelector('#'+k).value=defaults[k];refreshDefaults();}));
    runButton.addEventListener('click',async()=>{
      if(active)return;
      const c={};fields.forEach(k=>c[k]=root.querySelector('#'+k).value);
      const parseLimit=(value,integer)=> {
        const s=String(value).trim();
        if(!s)return NaN;
        const n=Number(s);
        return Number.isFinite(n) && n<=0 ? Infinity : (n>0 && (integer?Number.isSafeInteger(n):Number.isFinite(n))?n:NaN);
      };
      const rawCycles=String(c.cycles).trim(), rawMinutes=String(c.minutes).trim();
      const rollover=Number(String(c.rollover).trim());
      const cycles=parseLimit(rawCycles,true), minutes=parseLimit(rawMinutes,false);
      if(!c.prompt.trim()||!(cycles===Infinity||Number.isSafeInteger(cycles)&&cycles>=1)||!(minutes===Infinity||Number.isFinite(minutes)&&minutes>0)||!String(c.rollover).trim()||!Number.isSafeInteger(rollover)){status('Check prompt, cycles, timeout, and rollover');return;}
      // Persist the literal valid values the user entered (including zero/negative
      // unlimited limits). Convert them to Infinity only in the active session.
      c.cycles=Number(rawCycles);c.minutes=Number(rawMinutes);c.rollover=rollover;
      settings=c;await chrome.storage.local.set({[KEY]:c});
      const runtime={...c,cycles,minutes};
      const s={settings:runtime,url:location.href,startedAt:Date.now(),deadline:0,cancelled:false,completed:0};s.deadline=minutes===Infinity?Infinity:s.startedAt+minutes*60000;if(!Number.isFinite(s.deadline)&&minutes!==Infinity){status("Timeout too large");return;}active=s;updateElapsed(s);
      terminalStatus='Running';runButton.textContent='Running';execute(s);
    });
    // Resume only a handoff addressed to this new tab. Prompt Launcher handles
    // initial context submission; wait for its response before continuing.
    async function resumeHandoff(){
      const token=new URLSearchParams(location.search).get('pl_rollover') || (await chrome.runtime.sendMessage({type:'pl-rollover-token'}))?.token;
      if(!token)return;
      const key=HANDOFF_PREFIX+token;
      const stored=(await chrome.storage.local.get(key))[key];
      if(!stored||stored.token!==token||Date.now()-stored.createdAt>30*60*1000){status('Rollover handoff missing or expired');return;}
      const runtime={...stored.settings};
      if(runtime.cycles<=0)runtime.cycles=Infinity;
      if(runtime.minutes<=0)runtime.minutes=Infinity;
      if(!runtime||typeof runtime.prompt!=='string'||!Number.isSafeInteger(stored.completed)){status('Invalid rollover state');return;}
      const s={settings:runtime,url:location.href,startedAt:stored.startedAt,deadline:runtime.minutes===Infinity?Infinity:stored.startedAt+runtime.minutes*60000,cancelled:false,completed:stored.completed,promptId:stored.promptId};
      if(expired(s)){status('Session timeout');return;}
      // Do not submit a continuation until the launcher has produced a complete reply.
      status('Waiting for context reload');
      const start=Date.now();let seenBusy=false,seenReply=false,stable=0,prev='';
      while(Date.now()-start<180000){
        const busy=isBusy(),sig=signature();if(busy)seenBusy=true;
        if(messages().length>0 && (seenBusy||userMessages()>0))seenReply=true;
        if(seenReply&&!busy&&sig===prev&&(!latestMessage()?.closest('[data-talvt-turn-state]')||latestTurnComplete()))stable++;else stable=0;
        prev=sig;if(stable>=7)break;await delay(500);
      }
      if(stable<7){status('Context reload not confirmed; handoff retained');return;}
      // Keep the originating launcher identity attached to every successor conversation.
      const cid=conversationId();
      if(cid && stored.promptId){
        const data=await chrome.storage.local.get('conversationPromptMap');
        await chrome.storage.local.set({conversationPromptMap:{...(data.conversationPromptMap||{}),[cid]:stored.promptId}});
      }
      await chrome.storage.local.remove(key);
      // The launcher may have navigated from / to /c/<id> during context loading.
      s.url=location.href;
      active=s;runButton.textContent='Running';terminalStatus='Running';updateElapsed(s);execute(s);
      // Acknowledge only after the successor has restored and started its loop.
      // Failure to acknowledge leaves the predecessor open for recovery.
      try {
        const ack=await chrome.runtime.sendMessage({type:'pl-rollover-resumed',token});
        if(!ack?.ok)console.warn('Rollover predecessor cleanup failed:',ack?.error||'Unknown error');
      } catch(e) {console.warn('Rollover predecessor cleanup failed:',e);}
    }
    resumeHandoff().catch(e=>status('Rollover recovery failed: '+e.message));
    position();
    setInterval(()=>{if(active&&location.href!==active.url)stop('Conversation changed');if(!active && statusNode && statusNode.textContent!==terminalStatus)status(terminalStatus);updateElapsed();position();},650);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
