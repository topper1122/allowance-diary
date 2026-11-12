var KEY='punpun-allowance-diary';
var CATS=['school','essentials','wants','other'];
function defaults(){return{months:{},saves:[],goal:0,list:[],days:{},bank:[],lim:{daily:0,schoolDay:0,schoolMonth:0,essMonth:0,wantsDay:0,saveMonth:0,saveDay:0}}}
function load(){var d=defaults(),o={},k;try{var r=localStorage.getItem(KEY);if(r)o=JSON.parse(r)||{}}catch(e){}
 for(k in d){if(o[k]!==undefined&&o[k]!==null)d[k]=o[k]}
 d.lim=Object.assign(defaults().lim,o.lim||{});return d}
var S=load(),tab='spend',ym=ymOf(new Date());
function persist(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function pad(n){return(n<10?'0':'')+n}
function ymOf(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)}
function dstr(d){return ymOf(d)+'-'+pad(d.getDate())}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function money(n){return'₱'+(Number(n)||0).toLocaleString(undefined,{maximumFractionDigits:2})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function sum(a){return a.reduce(function(t,x){return t+(+x.amt||0)},0)}
function blank(){return{allowance:0,received:false,spends:[]}}
function M(){return S.months[ym]||(S.months[ym]=blank())}
function allSp(){var r=[];Object.keys(S.months).forEach(function(k){r=r.concat(S.months[k].spends||[])});return r}
function inMonth(a,y){return a.filter(function(s){return s.date&&s.date.indexOf(y)===0})}
function onDate(a,d){return a.filter(function(s){return s.date===d})}
function byCat(a,c){return a.filter(function(s){return(s.cat||'other')===c})}
function daysIn(y){var p=y.split('-');return new Date(+p[0],+p[1],0).getDate()}
function eff(m){return m.allowance>0?m.allowance:(S.lim.daily*daysIn(ym))}
function bankBal(a){return a.reduce(function(t,x){return t+(x.type==='out'?-x.amt:x.amt)},0)}
function monthName(){var p=ym.split('-');return new Date(+p[0],+p[1]-1,1).toLocaleString('en',{month:'long',year:'numeric'}).toLowerCase()}
function shift(n){var p=ym.split('-');ym=ymOf(new Date(+p[0],+p[1]-1+n,1))}
function dayLabel(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleString('en',{weekday:'short',month:'short',day:'numeric'}).toLowerCase()}
function val(id){var e=document.getElementById(id);return e?e.value.trim():''}

function face(mood){
 var ey=mood==='low'?52:46,drop=mood==='low'?'<path d="M70 40q-3 6 0 8q3-2 0-8z" stroke="#ececec" stroke-width="1.5"/>':'';
 var mouth=mood==='ok'?'<path d="M43 68q7 5 14 0" stroke="#ececec" stroke-width="1.8" stroke-linecap="round"/>':'<path d="M43 70q7-4 14 0" stroke="#ececec" stroke-width="1.8" stroke-linecap="round"/>';
 return '<svg viewBox="0 0 100 100" fill="none" stroke="#ececec" stroke-width="2" stroke-linecap="round"><path d="M50 14q-3-6-8-8M50 14q2-7 8-9M50 14q8-3 14-1"/><path d="M20 58C18 32 34 14 51 15C70 16 82 34 80 58C78 78 66 88 50 88C34 88 22 78 20 58Z"/><path d="M23 62C22 40 34 20 52 19" stroke-width="1" opacity=".5"/><circle cx="38" cy="'+ey+'" r="3" fill="#ececec"/><circle cx="60" cy="'+ey+'" r="3" fill="#ececec"/><path d="M46 56h10l-5 6z" fill="#0a0a0a"/>'+mouth+drop+'<path d="M40 88v8M60 88v8M35 97h10M55 97h10"/></svg>'}

function meter(l,u,mx,goal){
 if(!(mx>0))return '<div class="mt"><div class="row"><span class="lbl">'+l+'</span><span class="num sub">'+money(u)+' · no limit set</span></div></div>';
 var o=u>mx;
 return '<div class="mt"><div class="row"><span class="lbl">'+l+'</span><span class="num'+(o&&!goal?' over':'')+'">'+money(u)+' / '+money(mx)+'</span></div><div class="prog"><i style="width:'+Math.min(100,u/mx*100)+'%"></i></div>'+(o?'<div class="sub">'+(goal?'goal reached ✓':'over by '+money(u-mx))+'</div>':'')+'</div>'}
function nav(){return '<div class="nav"><button class="ghost" data-act="prev">‹</button><b>'+monthName()+'</b><button class="ghost" data-act="next">›</button></div>'}
function hero(mood,lbl,v,q){return '<div class="card hero">'+face(mood)+'<div><div class="lbl">'+lbl+'</div><div class="big num">'+money(v)+'</div><div class="quote">'+q+'</div></div></div>'}
function hist(a,act,sign){var h='';a.slice().sort(function(x,y){return x.date<y.date?1:-1}).forEach(function(s){
 h+='<div class="it"><span>'+esc(s.note||'saved')+' <span class="sub">'+dayLabel(s.date)+'</span></span><span><span class="num">'+(sign&&s.type==='out'?'−':sign?'+':'')+money(s.amt)+'</span><button class="x" data-act="'+act+'" data-id="'+s.id+'">✕</button></span></div>'});return h}

function viewSpend(){
 var m=M(),L=S.lim,all=allSp(),ms=inMonth(all,ym),spent=sum(ms),t=dstr(new Date()),ts=onDate(all,t);
 var inc=m.received?eff(m):0,savedM=sum(inMonth(S.saves,ym)),bk=bankBal(inMonth(S.bank,ym));
 var left=inc-spent-savedM-bk,mood=left<0?'low':(m.received?'ok':'none');
 var q=left<0?'…it’s all gone.':!m.received?'no allowance yet. waiting.':left<inc*0.2?'getting thin.':'still okay.';
 var n=daysIn(ym),per=[],i,bars='',list='',by={};
 for(i=0;i<n;i++)per.push(0);
 ms.forEach(function(s){var d=+s.date.slice(8,10);if(d>=1&&d<=n)per[d-1]+=+s.amt||0;(by[s.date]=by[s.date]||[]).push(s)});
 var mx=Math.max.apply(null,per.concat([1]));
 per.forEach(function(v,k){var id=ym+'-'+pad(k+1);bars+='<div class="bar'+(v?'':' z')+(id===t&&v?' t':'')+'" style="height:'+(v?Math.max(6,v/mx*100):3)+'%"></div>'});
 Object.keys(by).sort().reverse().forEach(function(k){
  list+='<div class="day"><div class="dh"><span>'+dayLabel(k)+'</span><span class="num">'+money(sum(by[k]))+'</span></div>';
  by[k].forEach(function(s){list+='<div class="it"><span>'+esc(s.note||'spent')+'<span class="tag">'+(s.cat||'other')+'</span></span><span><span class="num">'+money(s.amt)+'</span><button class="x" data-act="delSpend" data-id="'+s.id+'">✕</button></span></div>'});
  list+='</div>'});
 return nav()+hero(mood,'left this month',left,q)+
 '<div class="card"><div class="row"><div style="flex:1"><div class="lbl">allowance this month</div><input type="number" inputmode="decimal" id="allow" placeholder="'+(L.daily?money(L.daily*n):'0')+'" value="'+(m.allowance||'')+'"></div><label class="chk"><input type="checkbox" id="recv"'+(m.received?' checked':'')+'><span>received</span></label></div>'+
 (!m.allowance&&L.daily?'<div class="sub">blank = daily allowance × '+n+' days</div>':'')+
 '<div class="grid3" style="margin-top:14px"><div class="stat"><div class="lbl">spent</div><div class="num">'+money(spent)+'</div></div><div class="stat"><div class="lbl">saved</div><div class="num">'+money(savedM)+'</div></div></div></div>'+
 '<div class="card">'+meter('allowance today',sum(ts),L.daily)+'<div class="sub">set limits in the limits tab</div></div>'+
 '<div class="card"><b>write it down</b><div class="fields"><div><div class="lbl">amount</div><input type="number" inputmode="decimal" id="sAmt" placeholder="0"></div><div><div class="lbl">date</div><input type="date" id="sDate" value="'+(t.indexOf(ym)===0?t:ym+'-01')+'"></div>'+
 '<div><div class="lbl">type</div><select id="sCat">'+CATS.map(function(c){return'<option value="'+c+'">'+c+'</option>'}).join('')+'</select></div><div><div class="lbl">what for</div><input type="text" id="sNote" placeholder="lunch, bus…"></div></div><button data-act="addSpend">+ add spending</button></div>'+
 '<div class="card"><div class="lbl" style="margin-bottom:8px">spending per day</div><div class="bars">'+bars+'</div></div>'+(list||'<div class="empty">nothing spent yet.<br>quiet.</div>')
}

function viewLimits(){
 var L=S.lim,all=allSp(),ms=inMonth(all,ym),t=dstr(new Date()),ts=onDate(all,t);
 var F=[['daily','allowance per day'],['schoolDay','school allowance per day'],['schoolMonth','school allowance per month'],['essMonth','essentials max per month'],['wantsDay','wants max per day'],['saveMonth','savings goal per month'],['saveDay','savings goal per day']];
 return nav()+'<div class="card"><b>my limits</b><div class="sub">0 or blank = no limit</div><div class="fields">'+F.map(function(f){return'<div><div class="lbl">'+f[1]+'</div><input type="number" inputmode="decimal" data-lim="'+f[0]+'" placeholder="0" value="'+(L[f[0]]||'')+'"></div>'}).join('')+'</div></div>'+
 '<div class="card"><div class="lbl" style="margin-bottom:10px">spending (today · '+monthName()+')</div>'+meter('allowance today',sum(ts),L.daily)+meter('school today',sum(byCat(ts,'school')),L.schoolDay)+meter('school this month',sum(byCat(ms,'school')),L.schoolMonth)+meter('essentials this month',sum(byCat(ms,'essentials')),L.essMonth)+meter('wants today',sum(byCat(ts,'wants')),L.wantsDay)+'</div>'+
 '<div class="card"><div class="lbl" style="margin-bottom:10px">saving</div>'+meter('saved today',sum(onDate(S.saves,t)),L.saveDay,1)+meter('saved this month',sum(inMonth(S.saves,ym)),L.saveMonth,1)+'</div>'
}

function viewSave(){
 var tot=sum(S.saves),g=+S.goal||0,pc=g?Math.min(100,tot/g*100):0,L=S.lim,t=dstr(new Date());
 return hero(tot>0?'ok':'none','total saved',tot,tot?'small things add up.':'an empty jar.')+
 '<div class="card">'+meter('saved today',sum(onDate(S.saves,t)),L.saveDay,1)+meter('saved this month',sum(inMonth(S.saves,ym)),L.saveMonth,1)+'<div class="sub">goals are set in the limits tab</div></div>'+
 '<div class="card"><div class="lbl">my big goal</div><input type="number" inputmode="decimal" id="goal" placeholder="how much?" value="'+(g||'')+'">'+
 (g?'<div class="prog"><i style="width:'+pc+'%"></i></div><div class="row"><span class="sub">'+Math.round(pc)+'%</span><span class="sub num">'+money(Math.max(0,g-tot))+' to go</span></div>':'')+'</div>'+
 '<div class="card"><b>put some away</b><div class="fields"><div><div class="lbl">amount</div><input type="number" inputmode="decimal" id="vAmt" placeholder="0"></div><div><div class="lbl">note</div><input type="text" id="vNote" placeholder="piggy bank"></div></div><button data-act="addSave">+ save it</button></div>'+
 '<div class="card"><div class="lbl">history</div>'+(hist(S.saves,'delSave')||'<div class="empty">nothing here yet.</div>')+'</div>'
}

function viewBank(){
 var b=bankBal(S.bank);
 return hero(b>0?'ok':'none','emergency money',b,b>0?'for when it matters.':'nothing set aside yet.')+
 '<div class="card"><b>emergency bank</b><div class="sub">money in comes out of “left this month”</div><div class="fields"><div><div class="lbl">amount</div><input type="number" inputmode="decimal" id="bAmt" placeholder="0"></div><div><div class="lbl">note</div><input type="text" id="bNote" placeholder="why"></div></div><div class="btns"><button data-act="addBankIn">+ put in</button><button data-act="addBankOut">− take out</button></div></div>'+
 '<div class="card"><div class="lbl">history</div>'+(hist(S.bank,'delBank',1)||'<div class="empty">empty.</div>')+'</div>'
}

function viewDays(){
 var all=allSp(),n=daysIn(ym),yr=ym.slice(0,4),t=dstr(new Date()),rows='',done=0,i,id,v,dn,mo='',k;
 for(i=1;i<=n;i++){id=ym+'-'+pad(i);v=sum(onDate(all,id));dn=!!S.days[id];if(dn)done++;
  rows+='<div class="it'+(id>t?' fut':'')+(dn?' done':'')+'"><label class="chk"><input type="checkbox" data-act="dayDone" data-id="'+id+'"'+(dn?' checked':'')+'><span class="t">'+dayLabel(id)+'</span></label><span class="num">'+(v?money(v):'–')+'</span></div>'}
 for(i=1;i<=12;i++){k=yr+'-'+pad(i);v=sum(inMonth(all,k));
  mo+='<div class="it"><span'+(k===ym?'':' class="sub"')+'>'+new Date(+yr,i-1,1).toLocaleString('en',{month:'long'}).toLowerCase()+'</span><span class="num">'+(v?money(v):'–')+'</span></div>'}
 return nav()+'<div class="card"><div class="grid3"><div class="stat"><div class="lbl">this month</div><div class="num">'+money(sum(inMonth(all,ym)))+'</div></div><div class="stat"><div class="lbl">this year ('+yr+')</div><div class="num">'+money(sum(inMonth(all,yr)))+'</div></div></div></div>'+
 '<div class="card"><div class="row"><b>daily checklist</b><span class="sub">'+done+' / '+n+' written</span></div><div class="sub">tick a day once its spending is written down</div>'+rows+'</div>'+
 '<div class="card"><div class="lbl">'+yr+' by month</div>'+mo+'</div>'
}

function viewList(){
 var list='',open=0;
 S.list.forEach(function(it){if(!it.done)open+=+it.price||0;
  list+='<div class="it'+(it.done?' done':'')+'"><label class="chk"><input type="checkbox" data-act="toggle" data-id="'+it.id+'"'+(it.done?' checked':'')+'><span class="t">'+esc(it.text)+'</span></label><span>'+(it.price?'<span class="num">'+money(it.price)+'</span>':'')+'<button class="x" data-act="delItem" data-id="'+it.id+'">✕</button></span></div>'});
 var left=S.list.filter(function(i){return!i.done}).length;
 return '<div class="card"><b>checklist</b><div class="fields"><div class="full"><div class="lbl">to buy / to do</div><input type="text" id="lText" placeholder="notebook, pens…"></div><div><div class="lbl">price (optional)</div><input type="number" inputmode="decimal" id="lPrice" placeholder="0"></div></div><button data-act="addItem">+ add</button></div>'+
 '<div class="card"><div class="row"><span class="lbl">'+left+' left</span><span class="lbl num">'+(open?'needs '+money(open):'')+'</span></div>'+(list||'<div class="empty">the list is empty.</div>')+'</div>'
}

var VIEWS={spend:viewSpend,limits:viewLimits,save:viewSave,bank:viewBank,days:viewDays,list:viewList};
function render(){
 var y=window.scrollY;
 document.getElementById('app').innerHTML='<div class="top"><div><h1>allowance diary</h1><div class="sub">small money, small notes</div></div><div class="jp">おこづかい</div></div>'+VIEWS[tab]();
 document.getElementById('tabs').innerHTML=Object.keys(VIEWS).map(function(k){return'<button data-act="tab" data-id="'+k+'" class="'+(tab===k?'on':'')+'">'+k+'</button>'}).join('');
 window.scrollTo(0,y)
}

document.addEventListener('click',function(e){
 var b=e.target.closest('[data-act]');if(!b||b.type==='checkbox')return;
 var a=b.dataset.act,id=b.dataset.id,n,k;
 if(a==='tab')tab=id;
 else if(a==='prev')shift(-1);
 else if(a==='next')shift(1);
 else if(a==='addSpend'){n=parseFloat(val('sAmt'));if(!(n>0))return;var d=val('sDate')||dstr(new Date());k=d.slice(0,7);
  (S.months[k]||(S.months[k]=blank())).spends.push({id:uid(),amt:n,note:val('sNote'),date:d,cat:val('sCat')||'other'})}
 else if(a==='delSpend'){Object.keys(S.months).forEach(function(x){S.months[x].spends=S.months[x].spends.filter(function(s){return s.id!==id})})}
 else if(a==='addSave'){n=parseFloat(val('vAmt'));if(!(n>0))return;S.saves.push({id:uid(),amt:n,note:val('vNote'),date:dstr(new Date())})}
 else if(a==='delSave')S.saves=S.saves.filter(function(s){return s.id!==id});
 else if(a==='addBankIn'||a==='addBankOut'){n=parseFloat(val('bAmt'));if(!(n>0))return;var out=a==='addBankOut';
  if(out&&n>bankBal(S.bank))return;S.bank.push({id:uid(),amt:n,type:out?'out':'in',note:val('bNote')||(out?'taken out':'put in'),date:dstr(new Date())})}
 else if(a==='delBank')S.bank=S.bank.filter(function(s){return s.id!==id});
 else if(a==='addItem'){if(!val('lText'))return;S.list.push({id:uid(),text:val('lText'),price:parseFloat(val('lPrice'))||0,done:false})}
 else if(a==='delItem')S.list=S.list.filter(function(i){return i.id!==id});
 persist();render()
});
document.addEventListener('change',function(e){
 var t=e.target,m=M();
 if(t.id==='allow')m.allowance=parseFloat(t.value)||0;
 else if(t.id==='recv')m.received=t.checked;
 else if(t.id==='goal')S.goal=parseFloat(t.value)||0;
 else if(t.dataset.lim)S.lim[t.dataset.lim]=parseFloat(t.value)||0;
 else if(t.dataset.act==='toggle')S.list.forEach(function(i){if(i.id===t.dataset.id)i.done=t.checked});
 else if(t.dataset.act==='dayDone'){if(t.checked)S.days[t.dataset.id]=true;else delete S.days[t.dataset.id]}
 else return;
 persist();render()
});
render();
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}
