/* Ömar Istanbul by Rima — the file download helper and the live exchange rates */
/* ---------- saving files and live exchange rates ---------- */
/* inside Claude the page asks the viewer to confirm each saved file; on a normal website the browser downloads the file itself */
async function kcDl(){
 if(window.claude&&typeof claude.use=='function'){try{return await claude.use('downloads')}catch(e){return null}}
 return{save:async({filename,data})=>{
  const nm=String(filename||'download'),ty=/\.pdf$/i.test(nm)?'application/pdf':/\.xlsx$/i.test(nm)?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':/\.json$/i.test(nm)?'application/json':'application/octet-stream';
  const b=data instanceof Blob?data:new Blob([data],{type:ty}),u=URL.createObjectURL(b),a=document.createElement('a');
  a.href=u;a.download=nm;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},5000)}}}

/* live exchange rates: on a normal website the portal asks a public rate feed (USD base) when it opens and every 3 hours, and keeps the answer;
   inside Claude the page cannot reach the feed, and the daily refresh of the published page keeps the rates current */
const KC_RF=[
 ['https://open.er-api.com/v6/latest/USD',j=>j&&j.result=='success'&&j.rates?{r:j.rates,at:new Date((+j.time_last_update_unix||Date.now()/1000)*1000).toISOString().slice(0,10)}:null],
 ['https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CAD,AUD,NZD',j=>j&&j.rates&&j.date?{r:j.rates,at:String(j.date).slice(0,10)}:null]];
function kcRatesApply(r,at){
 if(!r||!at||String(at)<String(TRD_LIVE.at))return false;
 const nr={...TRD_LIVE.r};let ch=false;
 ['EUR','GBP','CAD','AUD','NZD'].forEach(c=>{const v=+r[c],o=+nr[c];if(v>0&&isFinite(v)&&(!(o>0)||(v/o>.7&&v/o<1.43))&&v!==o){nr[c]=v;ch=true}});
 if(String(at)!==String(TRD_LIVE.at))ch=true;
 if(ch){TRD_LIVE.r=nr;TRD_LIVE.at=String(at)}
 return ch}
function kcRatesRefresh(){if(typeof me=='undefined'||!me)return;const a=document.activeElement,typing=a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);if(!typing&&['plancalc','pkcalc','pricedb'].includes(tab))render()}
async function trdLiveGo(){
 if(typeof fetch!='function'||window.claude)return false;
 for(const [u,f] of KC_RF){
  try{const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),9000);let res;try{res=await fetch(u,{cache:'no-store',signal:ac.signal})}finally{clearTimeout(tm)}
   if(!res||!res.ok)continue;const x=f(await res.json());if(!x)continue;
   const ch=kcRatesApply(x.r,x.at);S('kc_liverates',{at:TRD_LIVE.at,r:TRD_LIVE.r,got:Date.now()});if(ch)kcRatesRefresh();return true}catch(e){}}
 return false}
(()=>{const c=L('kc_liverates',null);if(c&&c.r&&c.at)kcRatesApply(c.r,c.at)})();
setTimeout(trdLiveGo,1200);setInterval(trdLiveGo,3*3600*1000);
