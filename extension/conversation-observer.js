/* Observe page-owned conversation responses without requesting private APIs.
   MAIN world, document_start. Only numeric counts cross into the extension. */
(() => {
  'use strict';
  if (window.__plConversationObserverInstalled) return;
  window.__plConversationObserverInstalled = true;
  const MARK='pl-conversation-count-v1';
  const role=node=>node?.message?.author?.role||node?.author?.role||node?.role||'';
  const currentId=()=>location.pathname.match(/^\/c\/([^/?#]+)/)?.[1]||'';
  const publish=(id,count)=>{
    if(id && id===currentId() && Number.isSafeInteger(count) && count>=0)
      window.postMessage({source:MARK,id,count},location.origin);
  };
  const mappingCount=data=>{
    const mapping=data?.mapping, current=data?.current_node||data?.currentNode;
    if(!mapping || !current || !mapping[current])return null;
    const seen=new Set();let id=current,count=0;
    while(id && mapping[id] && !seen.has(id)){
      seen.add(id);
      if(role(mapping[id])==='user')count++;
      id=mapping[id].parent;
    }
    return id && !mapping[id] ? null : count;
  };
  const sessions=new Map();
  function inspect(url,data){
    const match=url.match(/\/backend-api\/conversations?\/([a-f0-9-]{20,})(?:[/?#]|$)/i);
    if(!match || !data || typeof data!=='object')return;
    const id=match[1], mapped=mappingCount(data);
    if(mapped!==null){publish(id,mapped);return;}
    const items=[data.items,data.messages,data.turns,data?.data?.items,data?.data?.messages].find(Array.isArray);
    if(!items)return;
    const info=data.page_info||data.pageInfo||data.pagination||{};
    const hasMore=info.has_previous_page??info.hasPreviousPage??info.has_more??info.hasMore;
    const cursor=info.start_cursor||info.startCursor||info.next_cursor||info.nextCursor;
    const session=sessions.get(id)||{roles:new Map(),pages:0};
    for(const item of items){
      const message=item?.message||item,mid=message?.id||item?.id;
      if(mid)session.roles.set(mid,role(item));
    }
    session.pages++;
    sessions.set(id,session);
    // Publish only when the response explicitly indicates the entire history
    // is loaded; otherwise partial pages would be misleading.
    if(hasMore===false){
      publish(id,[...session.roles.values()].filter(r=>r==='user').length);
      sessions.delete(id);
    }else if(!cursor && items.length<100 && session.pages===1){
      publish(id,[...session.roles.values()].filter(r=>r==='user').length);
      sessions.delete(id);
    }
  }
  const original=window.fetch;
  if(typeof original==='function'){
    window.fetch=function(...args){
      const request=args[0];
      const url=typeof request==='string'?request:request?.url||'';
      const result=Reflect.apply(original,this,args);
      if(/\/backend-api\/conversations?\//.test(url)){
        result.then(response=>{
          if(!response?.ok)return;
          response.clone().json().then(data=>inspect(url,data)).catch(()=>{});
        }).catch(()=>{});
      }
      return result;
    };
  }
  // ChatGPT may load conversation history through XHR rather than fetch.
  const xhrOpen=XMLHttpRequest.prototype.open, xhrSend=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(method,url,...rest){
    this.__plHistoryUrl=typeof url==='string'?url:'';
    return Reflect.apply(xhrOpen,this,[method,url,...rest]);
  };
  XMLHttpRequest.prototype.send=function(...args){
    const url=this.__plHistoryUrl;
    if(/\/backend-api\/conversations?\//.test(url)){
      this.addEventListener('load',()=>{
        if(this.status<200||this.status>=300)return;
        try{
          const data=this.responseType==='json'?this.response:JSON.parse(this.responseText);
          inspect(url,data);
        }catch(_){}
      },{once:true});
    }
    return Reflect.apply(xhrSend,this,args);
  };
})();