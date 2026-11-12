/* Ömar Istanbul by Rima — Cloud copy on Firebase.
   The portal keeps working on this device (as before). When firebase-config.js is filled in, the same copy that the Backup file holds
   (settings, prices, saved plans, saved cases, photos, commission sheets) is also kept in YOUR Firebase project, so that a second phone or
   computer can get it. Rima signs in with an email and a password (Firebase Authentication).
   Safety rules of this module:
   - a copy is NEVER replaced without asking: if the cloud has a newer copy from another device, the automatic sending stops and Rima is told;
   - the data is stored in  portal/<user id>/snapshot  (see firestore.rules: only that user can read or write it);
   - nothing is loaded from Google when firebase-config.js is empty. */
const CL=(()=>{
 const CFG=window.OI_FIREBASE||{};
 const ON=!!(CFG.apiKey&&CFG.projectId);
 const SDK='10.12.5',CDN='https://www.gstatic.com/firebasejs/'+SDK+'/';
 const CHUNK=300000;                         /* one Firestore record may hold 1 MB: the copy is cut into pieces of 300,000 characters */
 const t=(k,...a)=>typeof ti=='function'?ti(k,...a):k.replace(/\{(\d+)\}/g,(m,i)=>a[+i]!=null?a[+i]:m);
 let fbk=null,auth=null,fs=null,user=null,busy=false,loadP=null,seen='',note='',info=null,started=false;

 /* ---------- Firebase code (loaded only when needed) ---------- */
 const js=u=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.crossOrigin='anonymous';s.onload=ok;s.onerror=()=>no(new Error('load '+u));document.head.appendChild(s)});
 function load(){
  if(!ON)return Promise.reject(new Error('off'));
  if(loadP)return loadP;
  loadP=(async()=>{
   if(!window.firebase){await js(CDN+'firebase-app-compat.js');await js(CDN+'firebase-auth-compat.js');await js(CDN+'firebase-firestore-compat.js')}
   fbk=window.firebase;if(!fbk.apps.length)fbk.initializeApp(CFG);
   auth=fbk.auth();fs=fbk.firestore();
   try{fs.settings({experimentalAutoDetectLongPolling:true,merge:true})}catch(e){}
   await new Promise(res=>{const un=auth.onAuthStateChanged(u=>{user=u;un();res()})});
   auth.onAuthStateChanged(u=>{const was=user&&user.uid;user=u;if((u&&u.uid)!==was)onUser()});
  })().catch(e=>{loadP=null;throw e});
  return loadP;
 }
 const base=()=>fs.collection('portal').doc(user.uid).collection('snapshot');

 /* ---------- a short fingerprint of the data of this device (the same data gives the same number, in any order) ---------- */
 const hs=s=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h};
 function finger(o){
  let x=0,n=0;
  Object.keys(o.ls||{}).forEach(k=>{x^=hs(k+'='+JSON.stringify(o.ls[k]));n++});
  Object.keys(o.db||{}).forEach(c=>Object.keys(o.db[c]).forEach(id=>{x^=hs(c+'/'+id+'='+JSON.stringify(o.db[c][id]));n++}));
  return n+'.'+(x>>>0).toString(36);
 }
 const when=at=>{try{return new Date(at).toLocaleString()}catch(e){return String(at)}};
 const lastAt=()=>L('kc_bk_cloudat',0);
 function why(e){
  const c=(e&&e.code)||'';
  if(/invalid-credential|wrong-password|user-not-found|invalid-email|missing-password|invalid-login/.test(c))return t('Wrong email or password.');
  if(/too-many-requests/.test(c))return t('Too many attempts. Wait a few minutes and try again.');
  if(/permission-denied/.test(c))return t('The cloud refused the request. Check the Firestore rules (FIREBASE-GUIDE.txt).');
  return t('Could not reach the cloud. Check the internet and the Firebase settings.');
 }

 /* ---------- the cloud copy ---------- */
 async function meta(){const m=await base().doc('meta').get();return m.exists?m.data():null}
 async function send(auto){
  if(busy||!ON)return;busy=true;note='';paint();
  try{
   await load();if(!user)throw new Error('signed-out');
   const o=await BK.make(),f=finger(o),col=base(),m=await meta(),cloudAt=m?m.at||0:0;
   if(cloudAt>lastAt()){
    if(auto){note=t('A newer copy is in the cloud. Open Backup and press “Get from the cloud”.');info=m;return}
    if(!confirm(t('The cloud has a newer copy from another device. Replace it with the copy of this device?')))return;
   }
   const s=JSON.stringify(o),n=Math.max(1,Math.ceil(s.length/CHUNK)),at=Date.now();
   for(let i=0;i<n;i++)await col.doc(at+'_'+i).set({i,s:s.slice(i*CHUNK,(i+1)*CHUNK)});
   await col.doc('meta').set({at,parts:n,size:s.length,fp:f,device:(navigator.platform||'device'),v:1});
   S('kc_bk_cloudat',at);S('kc_bk_cloudfp',f);info={at,parts:n};
   /* the pieces of the older copies are removed after the new one is complete */
   try{const all=await col.get();for(const d of all.docs){if(d.id!=='meta'&&d.id.indexOf(at+'_')!==0)await d.ref.delete()}}catch(e){}
   note=t('Cloud copy saved ✓');
  }catch(e){note=(e&&e.message==='signed-out')?'':why(e)}
  finally{busy=false;paint()}
 }
 async function get(){
  if(busy||!ON)return;busy=true;note='';paint();
  try{
   await load();if(!user)throw new Error('signed-out');
   const col=base(),m=await meta();
   if(!m){note=t('No cloud copy yet.');return}
   if(!confirm(t('Put the cloud copy on this device? What is on this device now will be replaced.')))return;
   let s='';for(let i=0;i<m.parts;i++){const d=await col.doc(m.at+'_'+i).get();if(!d.exists)throw new Error('piece');s+=d.data().s}
   const o=JSON.parse(s);
   if(!o||o.kind!=='omer-istanbul-backup'||!o.ls)throw new Error('format');
   await BK.applyObj(o);
   S('kc_bk_cloudat',m.at);S('kc_bk_cloudfp',m.fp||'');
   note=t('Cloud copy restored ✓ — the portal reloads.');paint();setTimeout(()=>location.reload(),900);
  }catch(e){note=(e&&e.message==='signed-out')?'':why(e)}
  finally{busy=false;paint()}
 }
 /* is there a newer copy from another device? (one read) */
 async function check(){
  try{await load();if(!user)return;const m=await meta();info=m;
   if(m&&(m.at||0)>lastAt()){note=t('A newer copy is in the cloud. Open Backup and press “Get from the cloud”.');try{toast(note)}catch(e){}}
   paint()}catch(e){}
 }
 /* every 90 seconds: if the data changed and stayed the same for one round, it is sent (without asking only when no newer copy exists) */
 async function tick(now){
  if(!ON||busy||!user)return;
  try{
   await (window.EOP_CLOUD&&EOP_CLOUD.ready?EOP_CLOUD.ready():Promise.resolve());
   const f=finger(await BK.make());
   if(f===L('kc_bk_cloudfp','')){seen=f;return}
   if(now||f===seen)await send(true);else seen=f;
  }catch(e){}
 }

 /* ---------- sign in / out ---------- */
 async function signin(){
  const e=($('cle')||{}).value||'',p=($('clp')||{}).value||'';
  if(!e||!p)return;
  busy=true;note='';paint();
  try{await load();await auth.signInWithEmailAndPassword(e.trim(),p);note=''}
  catch(x){note=why(x)}
  finally{busy=false;paint()}
 }
 async function signout(){try{await load();await auth.signOut()}catch(e){}note='';info=null;paint()}
 function onUser(){paint();if(user)setTimeout(check,400)}

 /* ---------- the box inside the Backup window ---------- */
 function html(){
  return `<div class="mt-5 pt-4 border-t border-slate-200"><b class="lux text-sm">${esc(t('Cloud copy (Firebase)'))}</b><div id="cls" class="mt-2"></div></div>`;
 }
 const btn=(fn,txt,dark)=>`<button type="button" ${busy?'disabled':''} onclick="CL.${fn}()" class="${dark?'bg-slate-800 text-white':'g'} rounded px-4 py-2 font-bold uppercase text-xs" style="${busy?'opacity:.5':''}">${esc(txt)}</button>`;
 function paint(){
  const el=$('cls');if(!el)return;
  let h='';
  if(!ON){h=`<p class="text-xs text-slate-600">${esc(t('Not connected. Fill in firebase-config.js (see FIREBASE-GUIDE.txt) to turn on the cloud copy.'))}</p>`}
  else if(!loadP&&!user){h=`<p class="text-xs text-slate-500">${esc(t('Connecting…'))}</p>`}
  else if(!user){
   h=`<form onsubmit="CL.signin();return false" class="grid gap-2 max-w-sm">
    <input id="cle" type="email" autocomplete="username" placeholder="${esc(t('Email'))}" class="border rounded p-2 text-sm w-full">
    <input id="clp" type="password" autocomplete="current-password" placeholder="${esc(t('Password'))}" class="border rounded p-2 text-sm w-full">
    <div>${btn('signin',t('Sign in'))}</div></form>`;
  }else{
   const la=lastAt(),ca=info&&info.at;
   h=`<p class="text-xs font-bold mb-1">${esc(t('Signed in as {0}',user.email||''))}</p>
    <p class="text-xs text-slate-600 mb-2">${esc(ca?t('Last cloud copy: {0}',when(ca)):t('No cloud copy yet.'))}</p>
    <div class="flex flex-wrap gap-2">${btn('send',t('Send to the cloud now'))}${btn('get',t('Get from the cloud'),1)}${btn('signout',t('Sign out'),1)}</div>
    <p class="text-[11px] text-slate-500 mt-2">${esc(t('This device sends its changes to the cloud by itself after a minute. A copy is never replaced without asking you.'))}</p>`;
  }
  h+=`<p class="text-xs font-bold mt-2 min-h-[1rem]" style="color:${/✓/.test(note)?'#047857':'#b91c1c'}">${esc(note)}</p>`;
  el.innerHTML=h;
 }
 function mount(){
  paint();
  if(ON&&!loadP)load().then(()=>{paint();if(user)check()}).catch(()=>{note=why({});paint()});
 }

 /* ---------- start ---------- */
 function start(){
  if(!ON||started)return;started=true;
  setTimeout(()=>{load().then(()=>{if(user)check();else if(!sessionStorage.getItem('cl_nudge')){sessionStorage.setItem('cl_nudge','1');try{toast(t('Sign in to the cloud copy (menu: Backup).'))}catch(e){}}}).catch(()=>{})},3000);
  setInterval(()=>tick(false),90000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)tick(true);else if(user)check()});
 }
 start();
 const api={on:ON,html,mount,paint,signin,signout,send:()=>send(false),get,tick,finger};
 window.CL=api;
 return api;
})();
