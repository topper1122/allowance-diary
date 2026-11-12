var KEY='punpun-allowance-diary';
var CATS=['school','essentials','wants','other'];
function defaults(){return{months:{},saves:[],goal:0,list:[],days:{},bank:[],piggy:[],wallet:0,ewallet:0,username:'',theme:'dark',updated:0,lim:{saveDay:0,daily:0,schoolDay:0,schoolMonth:0,essMonth:0,wantsMonth:0,saveMonth:0,ebMonth:0}}}
function norm(o){var d=defaults(),k;for(k in d){if(o[k]!==undefined&&o[k]!==null)d[k]=o[k]}d.lim=Object.assign(defaults().lim,o.lim||{});return d}
function load(){var o={};try{var r=localStorage.getItem(KEY);if(r)o=JSON.parse(r)||{}}catch(e){}return norm(o)}
var S=load(),tab='spend',ym=ymOf(new Date());
var U=null,db=null,authOpen=false,amode='login',msg='',aE='',pushT=null,unsub=null,vtab='save';
function persist(){S.updated=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}if(U&&db){clearTimeout(pushT);pushT=setTimeout(pushNow,800)}}
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
 var ey=mood==='low'?52:46,drop=mood==='low'?'<path d="M70 40q-3 6 0 8q3-2 0-8z" stroke="currentColor" stroke-width="1.5"/>':'';
 var mouth=mood==='ok'?'<path d="M43 68q7 5 14 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>':'<path d="M43 70q7-4 14 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
 return '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M50 14q-3-6-8-8M50 14q2-7 8-9M50 14q8-3 14-1"/><path d="M20 58C18 32 34 14 51 15C70 16 82 34 80 58C78 78 66 88 50 88C34 88 22 78 20 58Z"/><path d="M23 62C22 40 34 20 52 19" stroke-width="1" opacity=".5"/><circle cx="38" cy="'+ey+'" r="3" fill="currentColor"/><circle cx="60" cy="'+ey+'" r="3" fill="currentColor"/><path d="M46 56h10l-5 6z" style="fill:var(--bg)"/>'+mouth+drop+'<path d="M40 88v8M60 88v8M35 97h10M55 97h10"/></svg>'}

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
 var inc=m.received?eff(m):0,savedM=sum(inMonth(S.saves,ym)),bk=bankBal(inMonth(S.bank,ym))+sum(inMonth(S.piggy,ym));
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
 var F=[['daily','allowance per day'],['schoolDay','school allowance per day'],['schoolMonth','school allowance per month'],['essMonth','essentials allowance per month'],['wantsMonth','wants allowance per month'],['saveMonth','savings goal per month'],['saveDay','piggy bank goal per day'],['ebMonth','emergency money deposit per month']];
 return nav()+'<div class="card"><b>my limits</b><div class="sub">0 or blank = no limit</div><div class="fields">'+F.map(function(f){return'<div><div class="lbl">'+f[1]+'</div><input type="number" inputmode="decimal" data-lim="'+f[0]+'" placeholder="0" value="'+(L[f[0]]||'')+'"></div>'}).join('')+'</div></div>'+
 '<div class="card"><div class="lbl" style="margin-bottom:10px">spending (today · '+monthName()+')</div>'+meter('allowance today',sum(ts),L.daily)+meter('school today',sum(byCat(ts,'school')),L.schoolDay)+meter('school this month',sum(byCat(ms,'school')),L.schoolMonth)+meter('essentials this month',sum(byCat(ms,'essentials')),L.essMonth)+meter('wants this month',sum(byCat(ms,'wants')),L.wantsMonth)+'</div>'+
 '<div class="card"><div class="lbl" style="margin-bottom:10px">saving</div>'+meter('piggy bank today',sum(onDate(S.piggy,t)),L.saveDay,1)+meter('emergency deposits this month',sum(inMonth(S.bank.filter(function(x){return x.type==='in'}),ym)),L.ebMonth,1)+meter('saved this month',sum(inMonth(S.saves,ym)),L.saveMonth,1)+'</div>'
}

function viewSave(){
 var tot=sum(S.saves),g=+S.goal||0,pc=g?Math.min(100,tot/g*100):0,L=S.lim,t=dstr(new Date());
 return hero(tot>0?'ok':'none','total saved',tot,tot?'small things add up.':'an empty jar.')+
 '<div class="card">'+meter('saved this month',sum(inMonth(S.saves,ym)),L.saveMonth,1)+'<div class="sub">goals are set in the limits tab</div></div>'+
 '<div class="card"><div class="lbl">my big goal</div><input type="number" inputmode="decimal" id="goal" placeholder="how much?" value="'+(g||'')+'">'+
 (g?'<div class="prog"><i style="width:'+pc+'%"></i></div><div class="row"><span class="sub">'+Math.round(pc)+'%</span><span class="sub num">'+money(Math.max(0,g-tot))+' to go</span></div>':'')+'</div>'+
 '<div class="card"><b>put some away</b><div class="fields"><div><div class="lbl">amount</div><input type="number" inputmode="decimal" id="vAmt" placeholder="0"></div><div><div class="lbl">note</div><input type="text" id="vNote" placeholder="piggy bank"></div></div><button data-act="addSave">+ save it</button></div>'+
 '<div class="card"><div class="lbl">history</div>'+(hist(S.saves,'delSave')||'<div class="empty">nothing here yet.</div>')+'</div>'
}

function viewPiggy(){
 var t=dstr(new Date()),tot=sum(S.piggy),tdy=sum(onDate(S.piggy,t)),by={},list='';
 S.piggy.forEach(function(s){(by[s.date]=by[s.date]||[]).push(s)});
 Object.keys(by).sort().reverse().forEach(function(k){
  list+='<div class="day"><div class="dh"><span>'+dayLabel(k)+'</span><span class="num">'+money(sum(by[k]))+'</span></div>';
  by[k].forEach(function(s){list+='<div class="it"><span>'+esc(s.note||'saved')+'</span><span><span class="num">'+money(s.amt)+'</span><button class="x" data-act="delPiggy" data-id="'+s.id+'">✕</button></span></div>'});
  list+='</div>'});
 return hero(tot>0?'ok':'none','in my piggy bank',tot,'saved today: '+money(tdy))+
 '<div class="card">'+meter('saved today',tdy,S.lim.saveDay,1)+'<div class="sub">daily goal is set in the limits tab</div></div>'+
 '<div class="card"><b>drop a coin</b><div class="fields"><div><div class="lbl">amount</div><input type="number" inputmode="decimal" id="pAmt" placeholder="0"></div><div><div class="lbl">date</div><input type="date" id="pDate" value="'+t+'"></div><div class="full"><div class="lbl">note</div><input type="text" id="pNote" placeholder="coin jar"></div></div><button data-act="addPiggy">+ save for the day</button></div>'+
 '<div class="card"><div class="lbl">saved each day</div>'+(list||'<div class="empty">no coins yet.</div>')+'</div>'
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

function applyTheme(){var l=S.theme==='light';document.documentElement.dataset.theme=l?'light':'dark';var m=document.querySelector('meta[name=theme-color]');if(m)m.content=l?'#f4f4f2':'#0a0a0a'}
var DEV=(function(){var d='';try{d=localStorage.getItem('pp-dev');if(!d){d=uid();localStorage.setItem('pp-dev',d)}}catch(e){}return d||uid()})();
function fbOK(){return !!(window.FIREBASE_CONFIG&&window.firebase&&firebase.initializeApp)}
function errText(e){var c=e&&e.code||'';
 if(/invalid-credential|wrong-password|user-not-found/.test(c))return'wrong email or password';
 if(c==='auth/email-already-in-use')return'that email is already used';
 if(c==='auth/weak-password')return'password needs 6+ characters';
 if(c==='auth/invalid-email')return'that email doesn’t look right';
 if(/popup-closed|cancelled-popup/.test(c))return'cancelled';
 if(c==='auth/requires-recent-login')return'log out, log in again, then retry';
 if(c==='auth/unauthorized-domain')return'add this site to authorized domains in Firebase';
 return(e&&e.message)||'something went wrong'}
function pushNow(){if(U&&db)db.collection('users').doc(U.uid).set({data:JSON.stringify(S),updated:S.updated||0,dev:DEV}).catch(function(){})}
function applyRemote(r){try{S=norm(JSON.parse(r.data));S.updated=r.updated;localStorage.setItem(KEY,JSON.stringify(S));applyTheme();render()}catch(e){}}
function stopSync(){if(unsub){unsub();unsub=null}}
function startSync(){stopSync();var ref=db.collection('users').doc(U.uid);
 ref.get().then(function(d){var r=d.exists?d.data():null;
  if(r&&r.data&&r.updated>(S.updated||0))applyRemote(r);else pushNow();
  unsub=ref.onSnapshot(function(s){var x=s.data();if(x&&x.dev!==DEV&&x.data&&x.updated>(S.updated||0))applyRemote(x)})
 }).catch(function(){msg='could not sync right now';render()})}
function initFB(){
 if(!fbOK())return;
 try{firebase.initializeApp(window.FIREBASE_CONFIG);db=firebase.firestore();
  firebase.auth().onAuthStateChanged(function(u){U=u;
   if(u){authOpen=false;if(!S.username&&u.displayName)S.username=u.displayName;startSync()}
   else{stopSync();var sk='';try{sk=localStorage.getItem('pp-skip')}catch(e){}if(!sk)authOpen=true}
   render()})
 }catch(e){msg='online setup problem'}
}
function fail(e){msg=errText(e);render()}
function doAuth(){
 var em=val('aEmail'),pw=(document.getElementById('aPass')||{}).value||'',un=val('aName'),a=firebase.auth();aE=em;
 if(!em||!pw){msg='enter your email and password';return}
 var p=amode==='signup'?a.createUserWithEmailAndPassword(em,pw).then(function(c){var nm=un||em.split('@')[0];S.username=nm;persist();return c.user.updateProfile({displayName:nm})}):a.signInWithEmailAndPassword(em,pw);
 msg='one moment…';p.catch(fail)}
function gLogin(){var a=firebase.auth();msg='';a.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(fail)}
function forgot(){var em=val('aEmail');if(!em){msg='type your email first';return}aE=em;firebase.auth().sendPasswordResetEmail(em).then(function(){msg='reset link sent. check your email.';render()}).catch(fail)}
function savePass(){var pw=(document.getElementById('nPass')||{}).value||'';if(pw.length<6){msg='password needs 6+ characters';return}U.updatePassword(pw).then(function(){msg='password changed';render()}).catch(fail)}

function viewVault(){
 return '<div class="sub">vault</div><div class="stabs">'+['save','piggy','bank'].map(function(k){return'<button data-act="vtab" data-id="'+k+'" class="'+(vtab===k?'sel':'')+'">'+k+'</button>'}).join('')+'</div>'+(vtab==='save'?viewSave():vtab==='piggy'?viewPiggy():viewBank())
}
function viewMe(){
 var w=+S.wallet||0,e=+S.ewallet||0,pw=U&&U.providerData.some(function(p){return p.providerId==='password'}),acc;
 var m=msg?'<div class="msg">'+esc(msg)+'</div>':'';
 var nameF='<div class="fields"><div class="full"><div class="lbl">username</div><input type="text" id="uName" value="'+esc(S.username||'')+'" placeholder="your name"></div></div>';
 if(U)acc='<div class="card"><b>account</b><div class="sub">'+esc(U.email||'signed in')+' · synced</div>'+m+nameF+'<button data-act="saveName">save username</button>'+
  (pw?'<div class="fields"><div class="full"><div class="lbl">new password</div><input type="password" id="nPass" placeholder="6+ characters" autocomplete="new-password"></div></div><button data-act="savePass">change password</button>':'<div class="sub" style="margin-top:10px">signed in with Google, so Google manages your password.</div>')+
  '<div style="margin-top:14px"><button data-act="signOut">log out</button></div></div>';
 else acc='<div class="card"><b>account</b><div class="sub">'+(fbOK()?'log in to save your data online and open it on other devices.':'online login isn’t set up yet, so data stays on this phone.')+'</div>'+m+nameF+'<div class="btns"><button data-act="saveName">save username</button>'+(fbOK()?'<button data-act="openAuth">log in</button>':'')+'</div></div>';
 return '<div class="card hero">'+face('ok')+'<div><div class="lbl">hi,</div><div class="big">'+esc(S.username||'friend')+'</div><div class="quote">'+(U?'saved online':'on this phone')+'</div></div></div>'+
 '<div class="card"><b>my money now</b><div class="fields"><div><div class="lbl">wallet</div><input type="number" inputmode="decimal" id="wallet" placeholder="0" value="'+(w||'')+'"></div><div><div class="lbl">e-wallet</div><input type="number" inputmode="decimal" id="ewallet" placeholder="0" value="'+(e||'')+'"></div></div><div class="row"><span class="lbl">current money</span><span class="num big" style="font-size:24px">'+money(w+e)+'</span></div></div>'+
 '<div class="card"><b>my stats</b><div class="it"><span class="lbl">current savings</span><span class="num">'+money(sum(S.saves))+'</span></div><div class="it"><span class="lbl">piggy bank</span><span class="num">'+money(sum(S.piggy))+'</span></div><div class="it"><span class="lbl">emergency bank</span><span class="num">'+money(bankBal(S.bank))+'</span></div></div>'+
 '<div class="card"><b>look</b><div class="btns" style="margin-top:8px"><button data-act="theme" data-id="dark" class="'+(S.theme!=='light'?'sel':'')+'">dark</button><button data-act="theme" data-id="light" class="'+(S.theme==='light'?'sel':'')+'">light</button></div></div>'+acc
}
function viewAuth(){
 var su=amode==='signup';
 return '<div class="wrap"><div class="hero" style="justify-content:center">'+face('ok')+'</div><h1 style="text-align:center">allowance diary</h1><div class="sub" style="text-align:center;margin:4px 0 16px">log in to keep your notes safe</div>'+
 '<div class="stabs"><button data-act="authMode" data-id="login" class="'+(su?'':'sel')+'">log in</button><button data-act="authMode" data-id="signup" class="'+(su?'sel':'')+'">sign up</button></div>'+
 '<div class="card"><div class="fields">'+(su?'<div class="full"><div class="lbl">username</div><input type="text" id="aName" placeholder="your name"></div>':'')+'<div class="full"><div class="lbl">email</div><input type="email" id="aEmail" autocomplete="email" value="'+esc(aE)+'"></div><div class="full"><div class="lbl">password</div><input type="password" id="aPass" autocomplete="'+(su?'new':'current')+'-password"></div></div>'+
 (msg?'<div class="msg">'+esc(msg)+'</div>':'')+'<div class="btns"><button data-act="doAuth">'+(su?'create account':'log in')+'</button>'+(su?'':'<button class="ghost" style="font-size:16px" data-act="forgot">forgot password?</button>')+'</div></div>'+
 '<div class="empty">or</div><div class="card"><button style="width:100%" data-act="google">continue with Google</button></div>'+
 '<div class="empty"><button class="ghost" style="font-size:17px" data-act="skip">not now</button></div></div>'
}
var VIEWS={spend:viewSpend,limits:viewLimits,vault:viewVault,days:viewDays,list:viewList,profile:viewMe};
function render(){
 var y=window.scrollY,tb=document.getElementById('tabs'),ap=document.getElementById('app');
 if(authOpen){ap.innerHTML=viewAuth();tb.innerHTML='';return}
 ap.innerHTML='<div class="top"><div><h1>allowance diary</h1><div class="sub">small money, small notes</div></div><div class="jp">おこづかい</div></div>'+VIEWS[tab]();
 tb.innerHTML=Object.keys(VIEWS).map(function(k){return'<button data-act="tab" data-id="'+k+'" class="'+(tab===k?'on':'')+'">'+k+'</button>'}).join('');
 window.scrollTo(0,y)
}

document.addEventListener('click',function(e){
 var b=e.target.closest('[data-act]');if(!b||b.type==='checkbox')return;
 var a=b.dataset.act,id=b.dataset.id,n,k;
 if(a==='tab'){tab=id;msg=''}
 else if(a==='vtab')vtab=id;
 else if(a==='theme'){S.theme=id;applyTheme()}
 else if(a==='openAuth'){authOpen=true;msg=''}
 else if(a==='skip'){authOpen=false;msg='';try{localStorage.setItem('pp-skip','1')}catch(x){}}
 else if(a==='authMode'){amode=id;msg=''}
 else if(a==='doAuth')doAuth();
 else if(a==='google')gLogin();
 else if(a==='forgot')forgot();
 else if(a==='signOut'){if(fbOK())firebase.auth().signOut()}
 else if(a==='saveName'){var nm=val('uName');if(!nm)return;S.username=nm;msg='saved';if(U)U.updateProfile({displayName:nm}).catch(function(){})}
 else if(a==='savePass')savePass();
 else if(a==='prev')shift(-1);
 else if(a==='next')shift(1);
 else if(a==='addSpend'){n=parseFloat(val('sAmt'));if(!(n>0))return;var d=val('sDate')||dstr(new Date());k=d.slice(0,7);
  (S.months[k]||(S.months[k]=blank())).spends.push({id:uid(),amt:n,note:val('sNote'),date:d,cat:val('sCat')||'other'})}
 else if(a==='delSpend'){Object.keys(S.months).forEach(function(x){S.months[x].spends=S.months[x].spends.filter(function(s){return s.id!==id})})}
 else if(a==='addSave'){n=parseFloat(val('vAmt'));if(!(n>0))return;S.saves.push({id:uid(),amt:n,note:val('vNote'),date:dstr(new Date())})}
 else if(a==='addPiggy'){n=parseFloat(val('pAmt'));if(!(n>0))return;S.piggy.push({id:uid(),amt:n,note:val('pNote'),date:val('pDate')||dstr(new Date())})}
 else if(a==='delPiggy')S.piggy=S.piggy.filter(function(s){return s.id!==id});
 else if(a==='delSave')S.saves=S.saves.filter(function(s){return s.id!==id});
 else if(a==='addBankIn'||a==='addBankOut'){n=parseFloat(val('bAmt'));if(!(n>0))return;var out=a==='addBankOut';
  if(out&&n>bankBal(S.bank))return;S.bank.push({id:uid(),amt:n,type:out?'out':'in',note:val('bNote')||(out?'taken out':'put in'),date:dstr(new Date())})}
 else if(a==='delBank')S.bank=S.bank.filter(function(s){return s.id!==id});
 else if(a==='addItem'){if(!val('lText'))return;S.list.push({id:uid(),text:val('lText'),price:parseFloat(val('lPrice'))||0,done:false})}
 else if(a==='delItem')S.list=S.list.filter(function(i){return i.id!==id});
 if(['tab','prev','next','vtab','openAuth','skip','authMode','doAuth','google','forgot','signOut','savePass'].indexOf(a)<0)persist();
 render()
});
document.addEventListener('change',function(e){
 var t=e.target,m=M();
 if(t.id==='allow')m.allowance=parseFloat(t.value)||0;
 else if(t.id==='recv')m.received=t.checked;
 else if(t.id==='wallet')S.wallet=parseFloat(t.value)||0;
 else if(t.id==='ewallet')S.ewallet=parseFloat(t.value)||0;
 else if(t.id==='goal')S.goal=parseFloat(t.value)||0;
 else if(t.dataset.lim)S.lim[t.dataset.lim]=parseFloat(t.value)||0;
 else if(t.dataset.act==='toggle')S.list.forEach(function(i){if(i.id===t.dataset.id)i.done=t.checked});
 else if(t.dataset.act==='dayDone'){if(t.checked)S.days[t.dataset.id]=true;else delete S.days[t.dataset.id]}
 else return;
 persist();render()
});
applyTheme();initFB();render();
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}
