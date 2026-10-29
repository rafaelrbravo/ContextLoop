(() => {
  const q=new URLSearchParams(location.search);
  const hue=Number(q.get("hue")||205);
  const target=q.get("target")||"https://chatgpt.com/";
  function colorFromHue(hue){const h=((hue%360)+360)%360/60,s=.78,v=.82,c=v*s,x=c*(1-Math.abs((h%2)-1)),m=v-c;let r=0,g=0,b=0;if(h<1)[r,g,b]=[c,x,0];else if(h<2)[r,g,b]=[x,c,0];else if(h<3)[r,g,b]=[0,c,x];else if(h<4)[r,g,b]=[0,x,c];else if(h<5)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];return `rgb(${Math.round((r+m)*255)},${Math.round((g+m)*255)},${Math.round((b+m)*255)})`;}
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#111';g.beginPath();g.arc(32,32,30,0,Math.PI*2);g.fill();g.fillStyle=colorFromHue(hue);g.beginPath();g.arc(32,32,25,0,Math.PI*2);g.fill();
  const link=document.createElement('link');link.rel='icon';link.type='image/png';link.href=c.toDataURL('image/png');document.head.appendChild(link);
  // Give Chrome a moment to observe the favicon before navigating away.
  setTimeout(()=>location.replace(target),700);
})();