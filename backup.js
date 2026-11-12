/* Ömar Istanbul by Rima — Backup: one file with everything the portal keeps on this device (settings, prices, saved plans, saved cases, photos,
   commission sheets). Browsers can erase their data, so save a backup now and then. The same file puts everything back. */
const BK=(()=>{
 const KIND='omer-istanbul-backup',pad=n=>(n<10?'0':'')+n,stamp=d=>{d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
 const t=(k,...a)=>typeof ti=='function'?ti(k,...a):k.replace(/\{(\d+)\}/g,(m,i)=>a[+i]!=null?a[+i]:m);
 const keys=()=>Object.keys(localStorage).filter(k=>/^kc_/.test(k)&&!/^kc_(lasttab|fold|theme|lang|bk_)/.test(k));
 async function make(){
  await (window.EOP_CLOUD&&EOP_CLOUD.ready?EOP_CLOUD.ready():Promise.resolve());
  const ls={};keys().forEach(k=>{try{ls[k]=JSON.parse(localStorage.getItem(k))}catch(e){ls[k]=localStorage.getItem(k)}});
  return{kind:KIND,v:1,at:new Date().toISOString(),ls,db:window.EOP_CLOUD&&EOP_CLOUD.dump?EOP_CLOUD.dump():{}}}
 async function save(){
  try{const o=await make(),blob=new Blob([JSON.stringify(o)],{type:'application/json'}),nm='Omar Istanbul backup '+stamp()+'.json';
   const dl=typeof kcDl=='function'?await kcDl():null;
   if(dl)await dl.save({filename:nm,data:blob});else{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=nm;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},4000)}
   S('kc_bk_last',Date.now());msg(t('Backup saved ✓'),0);paint()}catch(e){msg(t('Could not save the backup.'),1)}}
 function msg(x,bad){const e=$('bkm');if(e){e.textContent=x;e.style.color=bad?'#b91c1c':'#047857'}}
 function pick(){const f=$('bkf');if(f){f.value='';f.click()}}
 async function restore(inp){
  const f=inp.files&&inp.files[0];if(!f)return;
  try{const o=JSON.parse(await f.text());
   if(!o||o.kind!==KIND||!o.ls)return msg(t('This is not a backup file of this portal.'),1);
   if(!confirm(t('Put this backup back? What is in the portal now will be replaced.')))return;
   await applyObj(o);
   msg(t('Backup restored ✓ — the portal reloads.'),0);setTimeout(()=>location.reload(),900)}
  catch(e){msg(t('Could not read this file.'),1)}}
 /* puts a backup (from a file or from the cloud copy) on this device: what is here now is replaced */
 async function applyObj(o){
  keys().forEach(k=>localStorage.removeItem(k));
  Object.keys(o.ls).forEach(k=>{try{localStorage.setItem(k,JSON.stringify(o.ls[k]))}catch(e){}});
  if(window.EOP_CLOUD&&EOP_CLOUD.restore)await EOP_CLOUD.restore(o.db||{},true)}
 function paint(){const e=$('bkl');if(!e)return;const l=L('kc_bk_last',0);e.textContent=l?t('Last backup: {0}',stamp(new Date(l))):t('No backup saved yet.')}
 function open(){
  $('mt').textContent=t('Backup');
  $('mb').innerHTML=`<p class="text-xs text-slate-600 mb-3">${esc(t('Everything you do in this portal stays on this device. Save a backup file now and then (for example every week) and keep it somewhere safe: it also moves everything to a new phone or computer.'))}</p>
   <p id="bkl" class="text-xs font-bold mb-2"></p>
   <div class="flex flex-wrap gap-2"><button type="button" onclick="BK.save()" class="g rounded px-4 py-2 font-bold uppercase text-xs">&#128190; ${esc(t('Save a backup now'))}</button><button type="button" onclick="BK.pick()" class="bg-slate-800 text-white rounded px-4 py-2 font-bold uppercase text-xs">${esc(t('Restore from a backup file'))}</button></div>
   <input type="file" id="bkf" accept=".json,application/json" class="hidden" onchange="BK.restore(this)"><p id="bkm" class="text-xs font-bold mt-3 min-h-[1rem]"></p>${window.CL?CL.html():''}`;
  $('md').classList.remove('hidden');paint();if(window.CL)CL.mount()}
 /* a quiet reminder when the last backup is more than 14 days old */
 setTimeout(()=>{try{const l=L('kc_bk_last',0);if(!sessionStorage.getItem('bk_nudge')&&(!l||Date.now()-l>14*864e5)&&Object.keys(localStorage).some(k=>/^kc_(pricedb|plans|kps)/.test(k))){sessionStorage.setItem('bk_nudge','1');toast(t('Remember to save a backup (menu: Backup).'))}}catch(e){}},9000);
 return{open,save,pick,restore,make,applyObj};
})();
