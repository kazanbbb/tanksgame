"use strict";
/* ===== КОНФИГ: баланс и награды меняются ТОЛЬКО здесь ===== */
const CFG={groupId:242637433, /* ЗАМЕНИТЕ на id вашего сообщества ВК */ rate:3000, W:3000, bots:14, food:350,
 tiers:[["Лёгкий",1,1,1],["Средний",5,2,1.5],["Тяжёлый",10,3,2.2],["Осадный",15,4,3],["Титан",20,5,4]], // [название, с какого уровня, стволов, множитель урона/брони]
 ups:[["spd","Скорость"],["dmg","Урон"],["hp","Броня"],["rel","Скорострельность"]],upMax:8,upCost:l=>40+l*35,
 community:[
  {id:"join",t:"Подписаться на сообщество",i:"👥",r:150,m:"VKWebAppJoinGroup",p:()=>({group_id:CFG.groupId}),cd:0},
  {id:"invite",t:"Пригласить друга",i:"📨",r:100,m:"VKWebAppShowInviteBox",p:()=>({}),cd:86400},
  {id:"share",t:"Поделиться на стене",i:"📣",r:80,m:"VKWebAppShowWallPostBox",p:()=>({message:"Играю в «Танчики.io»! Кто станет Титаном?"}),cd:86400},
  {id:"fav",t:"Добавить в избранное",i:"⭐",r:60,m:"VKWebAppAddToFavorites",p:()=>({}),cd:0},
  {id:"notif",t:"Включить уведомления",i:"🔔",r:60,m:"VKWebAppAllowNotifications",p:()=>({}),cd:0}],
 daily:[50,75,100,150,200,300,500]};
const NAMES=["Рядовой","Сержант","Капитан","Майор","Генерал","Маршал","Гром","Шторм","Лис","Волк","Ястреб","Медведь"];
const COLS=["#FF3D57","#FFC400","#B6FF00","#FF8A00","#C77DFF","#4DA3FF"];
/* ===== Состояние и сохранение (VK Storage + запасной localStorage) ===== */
const $=id=>document.getElementById(id),bridge=window.vkBridge||null,KEY="tio_v1";
let S={coins:0,up:{spd:0,dmg:0,hp:0,rel:0},streak:0,last:"",qdone:{},best:1,uid:"local"};
function save(){const s=JSON.stringify(S);try{localStorage.setItem(KEY,s)}catch(e){}if(bridge)bridge.send("VKWebAppStorageSet",{key:KEY,value:s}).catch(()=>{})}
async function load(){try{S=Object.assign(S,JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){}
 if(bridge){try{await bridge.send("VKWebAppInit");const u=await bridge.send("VKWebAppGetUserInfo");S.uid=u.id;const r=await bridge.send("VKWebAppStorageGet",{keys:[KEY]});if(r.keys[0].value)S=Object.assign(S,JSON.parse(r.keys[0].value))}catch(e){}}ui()}
const track=(e,d)=>{console.log("[analytics]",e,d||"");if(bridge)bridge.send("VKWebAppTrackEvent",{event_name:e,event_params:d||{}}).catch(()=>{})};
/* ===== Утилиты интерфейса ===== */
function toast(t){const e=$("toast");e.textContent=t;e.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>e.style.opacity=0,2200)}
function haptic(){if(bridge)bridge.send("VKWebAppTapticImpactOccurred",{style:"medium"}).catch(()=>{});navigator.vibrate&&navigator.vibrate(20)}
function coinsFx(){for(let i=0;i<10;i++){const c=document.createElement("div");c.className="coin";c.textContent="🪙";c.style.left=innerWidth/2+(Math.random()*120-60)+"px";c.style.top=innerHeight/2+"px";document.body.appendChild(c);
 requestAnimationFrame(()=>{c.style.transform="translate("+(Math.random()*80-40)+"px,-"+(200+Math.random()*100)+"px)";c.style.opacity=0});setTimeout(()=>c.remove(),1000)}}
function give(n){S.coins+=n;coinsFx();save();ui()}
const fmt=s=>[s/3600,s/60%60,s%60].map(x=>String(Math.floor(x)).padStart(2,"0")).join(":");
function modal(h){$("mc").innerHTML=h+'<button class="btn gh" id="mx">Закрыть</button>';$("modal").style.display="flex";$("mx").onclick=()=>{$("modal").style.display="none";clearInterval(modal.t);ui()}}
/* ===== Лобби: прокачка ===== */
function ui(){$("coins").textContent="🪙 "+S.coins;$("best").textContent="Рекорд: уровень "+S.best;
 $("ups").innerHTML="<b>Характеристики</b>"+CFG.ups.map(([k,n])=>{const l=S.up[k],c=CFG.upCost(l),mx=l>=CFG.upMax;
  return '<div class="u"><div><b>'+n+"</b> <small>ур. "+l+"/"+CFG.upMax+'</small><div class="bar"><i style="width:'+l/CFG.upMax*100+'%"></i></div></div><button class="btn" data-u="'+k+'" '+(mx||S.coins<c?"disabled":"")+">"+(mx?"МАКС":"+ "+c+" 🪙")+"</button></div>"}).join("");
 document.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>{const k=b.dataset.u,c=CFG.upCost(S.up[k]);if(S.coins<c)return;S.coins-=c;S.up[k]++;haptic();save();ui();track("upgrade",{k})})}
/* ===== Отрисовка танка (форма зависит от эволюции tr) ===== */
function drawTank(c,x,y,a,r,tr,col){c.save();c.translate(x,y);c.rotate(a);
 c.fillStyle="#1b2744";c.fillRect(-r,-r*.9,r*2,r*.35);c.fillRect(-r,r*.55,r*2,r*.35); // гусеницы
 c.fillStyle=col;c.fillRect(-r*.85,-r*.6,r*1.7,r*1.2); // корпус
 const b=CFG.tiers[tr][2];c.fillStyle="#dfe9ff";for(let i=0;i<b;i++){const o=(i-(b-1)/2)*r*.24;c.fillRect(0,o-r*.08,r*1.3,r*.16)} // стволы
 c.fillStyle="#0A0E1A";c.beginPath();c.arc(0,0,r*.4,0,7);c.fill();c.strokeStyle=col;c.lineWidth=2;c.stroke();c.restore()}
const pv=$("pv").getContext("2d");let pa=0;
(function pvLoop(){if(!(G&&!G.over)){pa+=.015;pv.clearRect(0,0,260,150);drawTank(pv,130,75,pa,38,0,"#00E5FF")}requestAnimationFrame(pvLoop)})();
/* ===== Квесты сообщества ===== */
let lastClick=0;const cdLeft=q=>{const t=S.qdone[S.uid+":"+q.id];if(!t)return 0;return q.cd?Math.max(0,Math.ceil((t+q.cd*1000-Date.now())/1000)):-1};
function showQuests(){const draw=()=>$("mc").querySelectorAll("[data-q]").forEach(b=>{const c=cdLeft(CFG.community.find(x=>x.id===b.dataset.q));b.disabled=c!==0;b.textContent=c===0?"Получить":c<0?"Выполнено":fmt(c)});
 modal("<h2>Квесты сообщества</h2>"+CFG.community.map(q=>'<div class="q"><div>'+q.i+" <b>"+q.t+"</b><br><small>Награда: "+q.r+' 🪙</small></div><button class="btn" data-q="'+q.id+'"></button></div>').join(""));
 $("mc").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>doQuest(CFG.community.find(x=>x.id===b.dataset.q),draw));draw();modal.t=setInterval(draw,1000)}
async function doQuest(q,draw){if(Date.now()-lastClick<CFG.rate)return toast("Не так быстро");lastClick=Date.now(); // антифрод: 1 нажатие / 3 сек
 if(cdLeft(q)!==0)return;haptic();track("quest_click",{q:q.id});
 try{if(bridge){const r=await bridge.send(q.m,q.p());if(r&&r.result===false)throw 0}else toast("Демо вне VK: награда без вызова метода");
  S.qdone[S.uid+":"+q.id]=Date.now();toast("Награда получена! +"+q.r+" 🪙");give(q.r);track("quest_done",{q:q.id});draw()}
 catch(e){toast("Действие отменено — награда не выдана")}}
/* ===== Ежедневный бонус 7/7 ===== */
function showDaily(){const t=new Date().toDateString();
 const render=()=>{const cl=S.last===t,n=new Date();n.setHours(24,0,0,0);$("dd").innerHTML=CFG.daily.map((r,i)=>'<span style="display:inline-block;margin:3px;padding:8px;border-radius:10px;background:'+(i<S.streak?"var(--cy);color:#001018":"#1a2540")+'">'+(i+1)+": "+r+"</span>").join("")+"<p>До сброса: <b>"+fmt((n-Date.now())/1000)+"</b></p>";$("dc").disabled=cl;$("dc").textContent=cl?"Уже получено сегодня":"Забрать бонус"};
 modal("<h2>Ежедневный бонус</h2><div id='dd'></div><button class='btn' id='dc'></button>");
 $("dc").onclick=()=>{if(S.last===t)return;if(S.last!==new Date(Date.now()-864e5).toDateString()||S.streak>=7)S.streak=0;const r=CFG.daily[S.streak];S.streak++;S.last=t;haptic();toast("Награда получена! +"+r+" 🪙");give(r);track("daily_claim",{d:S.streak});render()};
 render();modal.t=setInterval(render,1000)}
/* ===== Бой в стиле agar.io ===== */
const cv=$("cv"),cx=cv.getContext("2d"),Z={spd:0,dmg:0,hp:0,rel:0};let G=null,K={},jx=0,jy=0,fireOn=false,mx=0,my=0,md=false,um=false,lastT=0;
const rnd=()=>Math.random()*(CFG.W-100)+50,lvOf=xp=>Math.min(25,Math.floor(Math.sqrt(xp/12))+1),tierOf=lv=>{let t=0;CFG.tiers.forEach((x,i)=>{if(lv>=x[1])t=i});return t};
function refresh(t,first){const tr=tierOf(t.lv),m=CFG.tiers[tr][3],u=t.bot?Z:S.up,ratio=first?1:t.hp/t.mhp;
 t.r=14+t.lv*1.1;t.mhp=(50+t.lv*6)*m*(1+u.hp*.15);t.hp=first?t.mhp:Math.min(t.mhp,t.mhp*ratio+t.mhp*.3);
 t.dmg=(6+t.lv*.6)*m*(1+u.dmg*.12);t.spd=190/(1+t.lv*.025)*(1+u.spd*.07);t.rel=.6/(1+u.rel*.12);
 if(!first&&tr>t.tr&&!t.bot){toast("Эволюция: "+CFG.tiers[tr][0]+"!");haptic();track("evolve",{tier:tr})}t.tr=tr}
function mk(x,y,bot,name,col,xp){const t={x,y,a:0,vx:0,vy:0,xp,lv:lvOf(xp),cd:0,bot,name,col,k:0,t:0,tr:0,mhp:0};refresh(t,true);return t}
function addXp(t,n){t.xp+=n;const l=lvOf(t.xp);if(l>t.lv){t.lv=l;refresh(t)}}
function spawnBot(){const p=G.p;let x,y;do{x=rnd();y=rnd()}while(Math.hypot(x-p.x,y-p.y)<500);G.t.push(mk(x,y,1,NAMES[Math.random()*NAMES.length|0],COLS[Math.random()*COLS.length|0],Math.random()*Math.random()*Math.max(60,G.p.xp*1.5)))}
function start(){G={t:[],b:[],f:[],over:0,z:1,lb:0};G.p=mk(CFG.W/2,CFG.W/2,0,"Вы","#00E5FF",0);G.t.push(G.p);
 for(let i=0;i<CFG.bots;i++)spawnBot();for(let i=0;i<CFG.food;i++)G.f.push({x:rnd(),y:rnd(),c:COLS[i%6],v:2});
 $("lobby").style.display="none";$("game").style.display="block";rs();lastT=performance.now();track("battle_start");requestAnimationFrame(loop)}
function shoot(t){if(t.cd>0)return;t.cd=t.rel;const b=CFG.tiers[t.tr][2];for(let i=0;i<b;i++){const a=t.a+(i-(b-1)/2)*.12;G.b.push({x:t.x+Math.cos(a)*t.r,y:t.y+Math.sin(a)*t.r,vx:Math.cos(a)*520,vy:Math.sin(a)*520,o:t,dm:t.dmg/Math.sqrt(b),l:1.1})}}
function ai(t,dt){t.t-=dt;if(t.t<=0){t.t=.5+Math.random()*.6;let th=null,pr=null,dth=380,dpr=460,df=520,fd=null;
  G.t.forEach(o=>{if(o===t)return;const d=Math.hypot(o.x-t.x,o.y-t.y);if(o.lv>t.lv+1&&d<dth){dth=d;th=o}else if(o.lv<=t.lv+1&&d<dpr){dpr=d;pr=o}});
  if(!th&&!pr)G.f.forEach(f=>{const d=Math.hypot(f.x-t.x,f.y-t.y);if(d<df){df=d;fd=f}});
  t.th=th;t.pr=pr;const g=th?[t.x*2-th.x,t.y*2-th.y]:pr?[pr.x,pr.y]:fd?[fd.x,fd.y]:[t.x+Math.random()*600-300,t.y+Math.random()*600-300];t.tx=g[0];t.ty=g[1]}
 const a=Math.atan2(t.ty-t.y,t.tx-t.x),d=Math.hypot(t.tx-t.x,t.ty-t.y);t.vx=d>20?Math.cos(a)*t.spd*.8:0;t.vy=d>20?Math.sin(a)*t.spd*.8:0;
 const g=t.pr||t.th;if(g&&Math.hypot(g.x-t.x,g.y-t.y)<400){t.a=Math.atan2(g.y-t.y,g.x-t.x);shoot(t)}else if(d>20)t.a=a}
function step(dt){const p=G.p;let vx=jx+(K.d||K.arrowright?1:0)-(K.a||K.arrowleft?1:0),vy=jy+(K.s||K.arrowdown?1:0)-(K.w||K.arrowup?1:0);const l=Math.hypot(vx,vy);if(l>1){vx/=l;vy/=l}
 p.vx=vx*p.spd;p.vy=vy*p.spd;
 if(um)p.a=Math.atan2((my-cv.height/2)/G.z,(mx-cv.width/2)/G.z);
 else if(fireOn){let bd=500;G.t.forEach(o=>{const d=Math.hypot(o.x-p.x,o.y-p.y);if(o!==p&&d<bd){bd=d;p.a=Math.atan2(o.y-p.y,o.x-p.x)}})}else if(l>.1)p.a=Math.atan2(vy,vx);
 if(fireOn||md||K[" "])shoot(p);
 G.t.forEach(t=>{if(t.bot)ai(t,dt);t.cd-=dt;t.x=Math.max(t.r,Math.min(CFG.W-t.r,t.x+t.vx*dt));t.y=Math.max(t.r,Math.min(CFG.W-t.r,t.y+t.vy*dt));t.hp=Math.min(t.mhp,t.hp+dt*1.5);
  G.f.forEach(f=>{if(Math.abs(f.x-t.x)<t.r+6&&Math.abs(f.y-t.y)<t.r+6){addXp(t,f.v);if(f.tmp)f.x=-1e5;else{f.x=rnd();f.y=rnd()}}})});
 G.f=G.f.filter(f=>f.x>-9e4);
 G.b.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;if(b.l<=0)b.x=-1e5;else G.t.forEach(t=>{if(t!==b.o&&b.x>-9e4&&!t.dead&&Math.hypot(b.x-t.x,b.y-t.y)<t.r){b.x=-1e5;t.hp-=b.dm;
   if(t.hp<=0){t.dead=1;addXp(b.o,t.xp*.4+15);b.o.k++;for(let i=0;i<8;i++)G.f.push({x:t.x+Math.random()*60-30,y:t.y+Math.random()*60-30,c:t.col,v:Math.max(3,t.xp/40),tmp:1})}}})});
 G.b=G.b.filter(b=>b.x>-9e4);G.t=G.t.filter(t=>!t.dead);if(p.dead)return end();
 while(G.t.length<CFG.bots+1)spawnBot();
 if((G.lb-=dt)<=0){G.lb=.4;const s=[...G.t].sort((a,b)=>b.xp-a.xp).slice(0,5);$("lb").innerHTML=s.map((t,i)=>(t===p?"<b style='color:var(--cy)'>":"<span>")+(i+1)+". "+t.name+" "+(t.xp|0)+(t===p?"</b>":"</span>")).join("<br>");
  $("hl").textContent="Ур. "+p.lv+" · "+CFG.tiers[p.tr][0];const a=(p.lv-1)**2*12,n=p.lv**2*12;$("hx").style.width=Math.min(100,(p.xp-a)/(n-a)*100)+"%"}}
function draw(){const w=cv.width,h=cv.height,p=G.p,z=G.z=Math.max(.5,1-p.lv*.012)*Math.min(1,Math.max(w,h)/800);
 cx.setTransform(1,0,0,1,0,0);cx.fillStyle="#0A0E1A";cx.fillRect(0,0,w,h);cx.setTransform(z,0,0,z,w/2-p.x*z,h/2-p.y*z);
 const vw=w/z/2+80,vh=h/z/2+80,ok=o=>Math.abs(o.x-p.x)<vw&&Math.abs(o.y-p.y)<vh;
 cx.fillStyle="#0d1426";cx.fillRect(0,0,CFG.W,CFG.W);cx.strokeStyle="rgba(0,229,255,.07)";cx.lineWidth=1;cx.beginPath();
 for(let i=0;i<=CFG.W;i+=100){cx.moveTo(i,0);cx.lineTo(i,CFG.W);cx.moveTo(0,i);cx.lineTo(CFG.W,i)}cx.stroke();cx.strokeStyle="#FF3D57";cx.lineWidth=6;cx.strokeRect(0,0,CFG.W,CFG.W);
 G.f.forEach(f=>{if(ok(f)){cx.fillStyle=f.c;cx.beginPath();cx.arc(f.x,f.y,f.tmp?7:5,0,7);cx.fill()}});
 G.t.forEach(t=>{if(!ok(t))return;drawTank(cx,t.x,t.y,t.a,t.r,t.tr,t.col);cx.fillStyle="#fff";cx.font="bold 12px sans-serif";cx.textAlign="center";cx.fillText(t.name,t.x,t.y-t.r-14);
  cx.fillStyle="#222";cx.fillRect(t.x-t.r,t.y-t.r-10,t.r*2,4);cx.fillStyle=t.hp/t.mhp>.3?"#3dff8a":"#FF3D57";cx.fillRect(t.x-t.r,t.y-t.r-10,t.r*2*t.hp/t.mhp,4)});
 cx.fillStyle="#fff";G.b.forEach(b=>{if(ok(b))cx.fillRect(b.x-3,b.y-3,6,6)})}
function loop(t){if(G.over)return;const dt=Math.min(.05,(t-lastT)/1000);lastT=t;step(dt);if(!G.over){draw();requestAnimationFrame(loop)}}
function end(){G.over=1;const p=G.p,c=Math.floor(p.xp/8)+p.k*3;S.coins+=c;S.best=Math.max(S.best,p.lv);save();track("battle_end",{lv:p.lv,k:p.k});
 $("game").style.display="none";$("lobby").style.display="flex";ui();
 modal("<h2>Танк уничтожен</h2><p>Уровень: <b>"+p.lv+"</b> · Эволюция: <b>"+CFG.tiers[p.tr][0]+"</b><br>Уничтожено: <b>"+p.k+"</b> · Награда: <b>+"+c+" 🪙</b></p><p class='mu'>Потратьте монеты на улучшения в лобби.</p><button class='btn rd' id='ag'>Играть снова</button>");
 $("ag").onclick=()=>{$("modal").style.display="none";clearInterval(modal.t);start()}}
/* ===== Управление ===== */
function rs(){cv.width=innerWidth;cv.height=innerHeight}addEventListener("resize",()=>{if(G&&!G.over)rs()});
addEventListener("keydown",e=>K[e.key.toLowerCase()]=1);addEventListener("keyup",e=>K[e.key.toLowerCase()]=0);
cv.addEventListener("pointermove",e=>{if(e.pointerType==="mouse"){um=true;mx=e.clientX;my=e.clientY}});cv.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse")md=true});addEventListener("pointerup",()=>md=false);
const joy=$("joy"),kn=$("knob");function jm(e){const r=joy.getBoundingClientRect();let x=(e.clientX-r.left-60)/50,y=(e.clientY-r.top-60)/50,l=Math.hypot(x,y);if(l>1){x/=l;y/=l}jx=x;jy=y;kn.style.left=40+x*40+"px";kn.style.top=40+y*40+"px"}
joy.addEventListener("pointerdown",e=>{joy.setPointerCapture(e.pointerId);jm(e)});joy.addEventListener("pointermove",e=>{if(joy.hasPointerCapture(e.pointerId))jm(e)});joy.addEventListener("pointerup",()=>{jx=jy=0;kn.style.left=kn.style.top="40px"});
$("fire").addEventListener("pointerdown",()=>{fireOn=true;um=false});["pointerup","pointerleave","pointercancel"].forEach(n=>$("fire").addEventListener(n,()=>fireOn=false));
$("go").onclick=start;$("bQ").onclick=showQuests;$("bD").onclick=showDaily;load();
