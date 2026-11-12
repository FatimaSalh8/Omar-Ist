/* Ömar Istanbul by Rima — Commission Structure & Audits
   The monthly Excel sheet of the consultant (sheets LİSTE and KURLAR) is read in the browser, every amount is converted to euro,
   the commission tier is chosen from the NET total and the commission is always paid in euro. Each deposit paid by link (IYZICO) earns a bonus in Turkish lira.
   The same data feeds "Monthly Performance Statistics". Everything is stored on this device (kc_cx = the months, kc_cset = the structure). */

/* ---------- the commission structure (editable under "Structure") ---------- */
const CXD={tiers:[[0,3],[20000,3.5],[35000,4],[50000,4.5],[65000,5]],dep:1500,card:10,wrate:1};
let CXM=L('kc_cx',{}),CXS=Object.assign({},CXD,L('kc_cset',{})),CXSEL=null,CXO=false,CXP=null;
if(!Array.isArray(CXS.tiers)||!CXS.tiers.length)CXS.tiers=CXD.tiers.map(t=>t.slice());
const cxSave=()=>S('kc_cx',CXM),cxSetSave=()=>S('kc_cset',CXS);
const cxUp=s=>String(s==null?'':s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const cxTiers=()=>CXS.tiers.map(t=>[+t[0]||0,+t[1]||0]).sort((a,b)=>a[0]-b[0]);
const cxTierI=net=>{const T=cxTiers();let i=0;T.forEach((t,k)=>{if(net>=t[0])i=k});return i};
const cxPct=net=>cxTiers()[cxTierI(net)][1];
const r2=v=>Math.round((+v||0)*100)/100;
const cxIsCard=m=>/KRED|CARD|KART/.test(cxUp(m)),cxIsIyz=m=>/IYZ/.test(cxUp(m));
function cxSel(){if(!CXSEL||!/^\d{4}-\d{2}$/.test(CXSEL)){const k=Object.keys(CXM).sort();CXSEL=k.length?k[k.length-1]:nm()}return CXSEL}
/* euro value of one unit of each currency: the rates of the sheet first, then the live feed for the ones the sheet leaves empty */
function cxDefRates(){
 const r={USD:0.9,GBP:1.2,TRY:0.02,EUR:1},v=typeof TRD_LIVE!='undefined'&&TRD_LIVE&&TRD_LIVE.r?TRD_LIVE.r:null;
 if(v&&v.EUR>0)['CAD','AUD'].forEach(c=>{if(v[c]>0)r[c]=Math.round(v.EUR/v[c]*10000)/10000});
 return r}
function cxRate(M,c){c=cxUp(c).trim();if(c==='EUR')return 1;if(!c||c==='-')return null;const r=parseFloat(M.rates&&M.rates[c]);return r>0?r:null}
function cxRow(M,r){
 const f=v=>{v=parseFloat(v);return isFinite(v)?v:0},ta=f(r.tr),ha=f(r.hp),rt=cxRate(M,r.tc),rh=ha?cxRate(M,r.hc):1;
 const te=ta&&rt?ta*rt:0,he=ha&&rh?ha*rh:0,ded=((cxIsCard(r.tm)?te:0)+(cxIsCard(r.hm)?he:0))*CXS.card/100;
 return{te,he,tot:te-he,ded,net:te-he-ded,dep:cxIsIyz(r.tm)&&te>0,bad:!!((ta&&!rt)||(ha&&!rh))}}
function cxCalc(m){
 const M=CXM[m];if(!M)return null;
 const A0=[],A1=[];(M.rows||[]).forEach(r=>{const c=cxRow(M,r);(r.ws?A1:A0).push({r,c})});
 const sum=(a,k)=>a.reduce((s,x)=>s+x.c[k],0),net=sum(A0,'net'),T=cxTiers(),ti0=cxTierI(net),pct=T[ti0][1],deps=A0.filter(x=>x.c.dep).length,wn=sum(A1,'net'),nx=T[ti0+1]||null;
 return{m,M,A0,A1,n:A0.length,te:sum(A0,'te'),he:sum(A0,'he'),ded:sum(A0,'ded'),net,pct,ti:ti0,comm:r2(net*pct/100),deps,bonus:deps*CXS.dep,
  wn,wcomm:r2(wn*CXS.wrate/100),bad:[...A0,...A1].filter(x=>x.c.bad).length,next:nx,gap:nx?Math.max(0,nx[0]-net):0}}

/* ---------- reading the Excel file (.xlsx is a zip of XML files: no library needed) ---------- */
const XL=(()=>{
 const u16=(b,o)=>b[o]|b[o+1]<<8,u32=(b,o)=>(b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0,dec=new TextDecoder();
 async function inflate(d){const ds=new DecompressionStream('deflate-raw'),w=ds.writable.getWriter();w.write(d);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer())}
 function unzip(buf){
  const b=new Uint8Array(buf);let e=-1;
  for(let i=b.length-22;i>=Math.max(0,b.length-65600);i--){if(u32(b,i)===0x06054b50){e=i;break}}
  if(e<0)throw new Error('not a zip');
  const n=u16(b,e+10),F={};let p=u32(b,e+16);
  for(let i=0;i<n;i++){
   if(u32(b,p)!==0x02014b50)throw new Error('bad zip');
   const meth=u16(b,p+10),csz=u32(b,p+20),nl=u16(b,p+28),el=u16(b,p+30),cl=u16(b,p+32),lo=u32(b,p+42);
   F[dec.decode(b.subarray(p+46,p+46+nl))]={meth,csz,lo};p+=46+nl+el+cl}
  return async nm=>{const f=F[nm];if(!f)return null;const ln=u16(b,f.lo+26),le=u16(b,f.lo+28),s=f.lo+30+ln+le,raw=b.subarray(s,s+f.csz);return dec.decode(f.meth===0?raw:await inflate(raw))}}
 const xml=t=>{const d=new DOMParser().parseFromString(t,'application/xml');if(d.getElementsByTagName('parsererror').length)throw new Error('bad xml');return d};
 const els=(n,t)=>[...n.getElementsByTagNameNS('*',t)];
 const txt=n=>els(n,'t').filter(t=>!(t.parentNode&&t.parentNode.localName==='rPh')).map(t=>t.textContent).join('');
 const col=r=>{let c=0;for(const ch of r.replace(/\d+/g,''))c=c*26+ch.charCodeAt(0)-64;return c-1};
 async function read(file){
  const get=unzip(await file.arrayBuffer()),wbx=await get('xl/workbook.xml');if(!wbx)throw new Error('no workbook');
  const ss=await get('xl/sharedStrings.xml'),SS=ss?els(xml(ss),'si').map(txt):[];
  const rl=await get('xl/_rels/workbook.xml.rels'),T={};
  if(rl)els(xml(rl),'Relationship').forEach(r=>{T[r.getAttribute('Id')]=r.getAttribute('Target')});
  const out=[];
  for(const s of els(xml(wbx),'sheet')){
   const id=s.getAttribute('r:id')||s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');let t=T[id];if(!t)continue;
   t=t.replace(/^\/?(xl\/)?/,'');const sx=await get('xl/'+t);if(!sx)continue;
   const rows=new Map();
   els(xml(sx),'c').forEach(c=>{
    const ref=c.getAttribute('r');if(!ref)return;const ty=c.getAttribute('t'),v=els(c,'v')[0],rn=+ref.replace(/\D/g,'');let val=null;
    if(ty==='inlineStr')val=txt(c);
    else if(v){const x=v.textContent;val=ty==='s'?(SS[+x]??''):ty==='str'||ty==='e'?x:ty==='b'?x==='1':(isFinite(parseFloat(x))?parseFloat(x):x)}
    if(val===null||val==='')return;
    if(!rows.has(rn))rows.set(rn,{});rows.get(rn)[col(ref)]=val});
   out.push({name:s.getAttribute('name')||'',rows})}
  return out}
 return{read}})();

/* the consultant's workbook: the sheet LİSTE (left block = the consultant, right block = "Karşılama"/welcome) and the sheet KURLAR (euro value of each currency) */
function cxParse(sheets,fname){
 const nz=s=>cxUp(s).replace(/[^A-Z0-9]/g,''),str=v=>v==null?'':String(v).replace(/\s+/g,' ').trim(),num=v=>{const x=parseFloat(String(v).replace(',','.'));return isFinite(x)?x:0};
 const li=sheets.find(s=>nz(s.name)==='LISTE')||sheets.find(s=>/LIST/.test(nz(s.name)))||sheets[0],kr=sheets.find(s=>/KUR|RATE/.test(nz(s.name)));
 if(!li)throw new Error('no sheet');
 let hr=-1,heads=[];
 [...li.rows.keys()].sort((a,b)=>a-b).some(rn=>{const o=li.rows.get(rn),h=Object.keys(o).filter(k=>nz(o[k])==='HASTAADI').map(Number).sort((a,b)=>a-b);if(h.length){hr=rn;heads=h;return true}return false});
 if(hr<0)throw new Error('no header');
 const rows=[],last=Math.max(...li.rows.keys());
 heads.slice(0,2).forEach((c0,ws)=>{
  for(let rn=hr+1;rn<=last;rn++){
   const o=li.rows.get(rn);if(!o)continue;
   const n=str(o[c0]),tr=num(o[c0+1]),hp=num(o[c0+5]);
   if(/PRIMBILGI|TOPLAM$/.test(nz(n)))break;          /* the summary block under the list ("PRİM BİLGİLERİ") is not a patient */
   if(!(tr>0)&&!(hp>0))continue;
   const cu=v=>{const x=cxUp(str(v)).trim();return x==='-'?'':x},me=v=>{const x=cxUp(str(v)).trim();return x||'-'};
   rows.push({id:'r'+Date.now().toString(36)+rows.length,n:n==='-'?'':n,tr:tr||'',tc:cu(o[c0+2]),tm:me(o[c0+3]),hn:str(o[c0+4])||'-',hp:hp||'',hc:cu(o[c0+6]),hm:me(o[c0+7]),ws})}});
 const rates={};
 if(kr)[...kr.rows.keys()].sort((a,b)=>a-b).forEach(rn=>{const o=kr.rows.get(rn),c=cxUp(str(o[0])).trim(),v=num(o[1]);if(/^[A-Z]{3}$/.test(c)&&v>0)rates[c]=v});
 const fromSheet=Object.keys(rates).filter(c=>c!=='EUR'),def=cxDefRates();
 Object.keys(def).forEach(c=>{if(!(rates[c]>0))rates[c]=def[c]});rates.EUR=1;
 const used=new Set();rows.forEach(r=>{if(r.tc)used.add(r.tc);if(r.hp&&r.hc)used.add(r.hc)});
 const lack=[...used].filter(c=>!(rates[c]>0));
 const t=li.rows.get(1)||{},title=str(Object.values(t).join(' ')),mm=/(20\d\d)\D{0,3}(0[1-9]|1[0-2])\b/.exec(fname||'');
 return{rows,rates,fromSheet,lack,title,file:fname||'',month:mm?mm[1]+'-'+mm[2]:null,n0:rows.filter(r=>!r.ws).length,n1:rows.filter(r=>r.ws).length}}

/* ---------- the screen ---------- */
const cxMsg=(t,bad)=>{const e=$('cxmsg');if(e){e.textContent=ti(t);e.style.color=bad?'#b91c1c':'#047857'}};
const cxN=v=>(+v||0).toLocaleString('en-US',{maximumFractionDigits:2}),cxE=v=>(+v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const cxPay=m=>{const x=cxUp(m).trim();return x==='NAKIT'||x==='CASH'?'Cash':cxIsCard(x)?'Credit card':cxIsIyz(x)?'Iyzico link':'-'};
const CX_M=['NAKIT','KREDI KARTI','IYZICO','-'],CX_C=['EUR','USD','GBP','TRY','CAD','AUD'];
function cxOpts(list,cur,lab){const l=list.includes(cur)||!cur?list:list.concat([cur]);return l.map(v=>`<option value="${esc(v)}"${v===cur?' selected':''}>${esc(lab?lab(v):v)}</option>`).join('')}
function cxRange(i){const T=cxTiers(),a=T[i][0],b=T[i+1]?T[i+1][0]-1:null;return b==null?cxN(a)+' +':cxN(a)+' – '+cxN(b)}
function cxTilesHtml(C){
 const t=(l,v,k)=>`<div class="cx-tile"><span>${l}</span><b style="color:${k}">${v}</b></div>`;
 return `<div class="cx-sumh"><b class="lux uppercase tracking-wider text-sm" style="color:#a08a7c">${esc(ti('{0} Commission Summary',mn(C.m)))}</b><span style="font-size:10px;color:#9b9cbb">${esc(ME_NAME)}</span></div><div class="cx-tiles">`
  +t(ti('Patients'),C.n,'#e3ddd8')+t(ti('Treatments'),money(C.te),'#34d399')+t(ti('Hotel'),'− '+money(C.he),'#fb7185')+t(ti('Card deduction'),'− '+money(C.ded),'#fbbf24')+t(ti('Net Total'),money(C.net),'#818cf8')
  +t(ti('Commission')+' ('+C.pct+'%)',money(C.comm),'#c084fc')+t(ti('Deposits'),C.deps,'#e3ddd8')+t(ti('Deposit bonus'),cxN(C.bonus)+' ₺','#60a5fa')
  +(C.A1.length?t(ti('Welcome commission'),money(C.wcomm),'#34d399'):'')+`</div>`}
function cxTiersHtml(C){
 const T=cxTiers();
 return `<div class="cx-tiers">`+T.map((t,i)=>`<div class="cx-tr${i===C.ti?' on':''}"><b>${t[1]}%</b><span>€ ${cxRange(i)}</span></div>`).join('')+`</div>`
  +`<p class="text-xs mt-2 font-bold" style="color:#4b4f80">${C.next?esc(ti('{0} more net to reach {1}%',money(C.gap),C.next[1])):esc(ti('Top tier reached.'))}</p>`}
function cxRowHtml(x){
 const r=x.r,c=x.c,i=(f,v,cl,ph)=>`<input data-i="${r.id}" data-f="${f}" value="${esc(v==null?'':v)}" onchange="cxEdit(this)"${cl?` class="${cl}"`:''}${ph?` placeholder="${esc(ti(ph))}"`:''}>`,
  s=(f,v,list,lab)=>`<select data-i="${r.id}" data-f="${f}" onchange="cxEdit(this)">${cxOpts(list,v,lab)}</select>`;
 return `<tr id="cxr_${r.id}" class="${c.bad?'bad':''}"><td>${i('n',r.n,'','Patient name')}</td><td>${i('tr',r.tr,'rt')}</td><td>${s('tc',r.tc,CX_C)}</td><td>${s('tm',r.tm,CX_M,cxPay)}</td>`
  +`<td>${i('hn',r.hn)}</td><td>${i('hp',r.hp,'rt')}</td><td>${s('hc',r.hc,CX_C)}</td><td>${s('hm',r.hm,CX_M,cxPay)}</td>`
  +`<td class="n c-te">${c.te?cxE(c.te):'-'}</td><td class="n c-he">${c.he?cxE(c.he):'-'}</td><td class="n c-ded">${c.ded?cxE(c.ded):'-'}</td><td class="n c-net"><b>${cxE(c.net)}</b></td>`
  +`<td class="np"><button type="button" class="cx-x" title="Remove this patient" onclick="cxDel('${r.id}')">✕</button></td></tr>`}
function cxTableHtml(C,ws){
 const A=ws?C.A1:C.A0,sum=k=>A.reduce((s,x)=>s+x.c[k],0);
 const th=['Patient','Treatment','Currency','Payment','Hotel','Hotel amount','Currency','Payment','Treatment €','Hotel €','Deduction €','Net €',''].map((h,k)=>`<th${k==12?' class="np"':''}>${esc(ti(h))}</th>`).join('');
 const cg=[19,8,6,12,9,8,6,12,7,6,7,8,2].map(w=>`<col style="width:${w}%">`).join('');
 return `<div class="cx-wrap"><table class="cx-t" data-ws="${ws}"><colgroup>${cg}</colgroup><thead><tr>${th}</tr></thead><tbody>`+(A.length?A.map(cxRowHtml).join(''):`<tr><td colspan="13" style="text-align:center;color:#9b9cbb;padding:14px;font-style:italic">${esc(ti('No patients in this list.'))}</td></tr>`)
  +`</tbody><tfoot><tr><td colspan="8">${esc(ti('Total'))}</td><td class="n t-te">${cxE(sum('te'))}</td><td class="n t-he">${cxE(sum('he'))}</td><td class="n t-ded">${cxE(sum('ded'))}</td><td class="n t-net">${cxE(sum('net'))}</td><td class="np"></td></tr></tfoot></table></div>`}
function cxRatesHtml(C){
 const M=C.M,cur=[...new Set(['USD','GBP','TRY','CAD','AUD',...Object.keys(M.rates||{}).filter(c=>c!=='EUR'),...M.rows.flatMap(r=>[r.tc,r.hp&&r.hc]).filter(c=>c&&c!=='EUR')])];
 return `<div class="cx-rates">`+cur.map(c=>{const v=M.rates&&M.rates[c];return `<label class="cx-rt${v>0?'':' miss'}"><span>1 ${esc(c)} =</span><input data-c="${esc(c)}" value="${v>0?v:''}" placeholder="?" inputmode="decimal" onchange="cxRateEdit(this)"><span>€</span></label>`}).join('')+`</div>`}
function cxStructHtml(){
 const T=cxTiers(),f='class="cx-in" inputmode="decimal"';
 return `<div class="cx-struct np"><b class="lux uppercase text-xs tracking-wider">${esc(ti('Commission structure'))}</b><p class="text-xs text-slate-500 mb-2">${esc(ti('The commission is always in euro. The percentage is chosen from the net total of the month and applies to the whole amount.'))}</p>`
  +`<div class="cx-sg">`+T.map((t,i)=>`<label><span>${esc(ti('From (€ net)'))}</span><input ${f} id="cxs_f${i}" value="${t[0]}"${i===0?' readonly':''}></label><label><span>${esc(ti('Commission %'))}</span><input ${f} id="cxs_p${i}" value="${t[1]}"></label>`).join('')+`</div>`
  +`<div class="cx-sg" style="margin-top:8px"><label><span>${esc(ti('Deposit bonus per deposit (₺)'))}</span><input ${f} id="cxs_dep" value="${CXS.dep}"></label><label><span>${esc(ti('Credit card deduction %'))}</span><input ${f} id="cxs_card" value="${CXS.card}"></label><label><span>${esc(ti('Welcome (Karşılama) commission %'))}</span><input ${f} id="cxs_w" value="${CXS.wrate}"></label></div>`
  +`<div class="cx-bar" style="justify-content:flex-end;margin-top:10px"><button type="button" class="ep-btn" onclick="cxStructReset()">${esc(ti('Back to the standard structure'))}</button><button type="button" class="ep-btn ep-gold" onclick="cxStructSave()">${esc(ti('Save structure'))}</button></div></div>`}

function rComm(){
 const m=cxSel(),C=cxCalc(m),mk=Object.keys(CXM).length;
 let h=`<div class="cx-h"><div><h2 class="lux font-bold text-lg uppercase tracking-wider">${esc(ti('Commission Structure & Audits'))}</h2><p class="text-xs text-slate-500">${esc(ti('Upload the monthly Excel sheet: every amount is converted to euro, the tier is chosen from the net total and the commission is always paid in euro.'))}</p></div>`
  +`<div class="cx-bar np"><label class="text-xs font-bold">${esc(ti('Month'))}:</label><input type="month" id="cmo" value="${m}" onchange="cxMonthSet(this.value)" class="cx-in">`
  +`<button type="button" class="ep-btn ep-gold" onclick="cxPick()">⬆ ${esc(ti('Upload Excel sheet'))}</button><input type="file" id="cxf" accept=".xlsx,.xlsm" class="hidden" onchange="cxFile(this)">`
  +`<button type="button" class="ep-btn" onclick="cxAdd(0)">+ ${esc(ti('Add patient'))}</button>`
  +(C?`<button type="button" class="ep-btn" onclick="cxPdf()">${esc(ti('PDF statement'))}</button><button type="button" class="ep-btn" onclick="cxXls()">${esc(ti('Excel'))}</button>`:'')
  +`<button type="button" class="ep-btn" onclick="cxTog()">⚙ ${esc(ti('Structure'))}</button></div></div><p id="cxmsg" class="text-xs font-bold np" style="min-height:1rem"></p>`;
 if(CXO)h+=cxStructHtml();
 if(!C){
  h+=`<div class="cx-empty"><b>${esc(ti('No commission sheet for {0} yet.',mn(m)))}</b><p>${esc(ti('Upload the Excel sheet of the month (sheets LİSTE and KURLAR) or add the patients one by one.'))}</p>`
   +(mk?`<p class="text-xs">${esc(ti('Months already saved: {0}',Object.keys(CXM).sort().map(k=>mn(k)).join(', ')))}</p>`:'')+`</div>`;
  $('vc').innerHTML=h;return}
 h+=`<div class="cx-sum" id="cxsum">${cxTilesHtml(C)}</div><div id="cxtiers">${cxTiersHtml(C)}</div>`
  +`<p id="cxwarn" class="text-xs font-bold np" style="color:#b45309">${C.bad?esc(ti('{0} patient(s) with a currency that has no rate: fill the rate below.',C.bad)):''}</p>`
  +`<div><b class="lux uppercase text-xs tracking-wider">${esc(ti('Patients — sales consultant'))}</b><span class="text-xs text-slate-500"> · ${esc(m?C.M.file||'':'')}</span>${cxTableHtml(C,0)}<div class="cx-bar np" style="margin-top:6px"><button type="button" class="ep-btn" onclick="cxAdd(0)">+ ${esc(ti('Add patient'))}</button></div></div>`
  +`<div><b class="lux uppercase text-xs tracking-wider">${esc(ti('Welcome (Karşılama)'))}</b>`+(C.A1.length?cxTableHtml(C,1):`<p class="text-xs text-slate-500">${esc(ti('Nobody in the welcome list this month.'))}</p>`)+`<div class="cx-bar np" style="margin-top:6px"><button type="button" class="ep-btn" onclick="cxAdd(1)">+ ${esc(ti('Add to the welcome list'))}</button></div></div>`
  +`<div class="np"><b class="lux uppercase text-xs tracking-wider">${esc(ti('Exchange rates of this month (euro value of 1 unit)'))}</b><p class="text-xs text-slate-500 mb-1">${esc(ti('Taken from the sheet KURLAR. You can correct them here.'))}</p>${cxRatesHtml(C)}</div>`
  +`<div class="cx-bar np" style="justify-content:space-between"><span class="text-[11px] text-slate-500">${esc(ti('Credit card payments lose {0}% (as in the sheet). Payments by Iyzico link are the deposits.',CXS.card))}</span><button type="button" class="ep-btn" onclick="cxDelMonth()">${esc(ti('Remove this month'))}</button></div>`;
 $('vc').innerHTML=h}

/* the numbers change while she types: only the computed cells are redrawn, so the cursor stays where it is */
function cxPaint(){
 const m=cxSel(),C=cxCalc(m);if(!C||!$('cxsum'))return rComm();
 $('cxsum').innerHTML=cxTilesHtml(C);$('cxtiers').innerHTML=cxTiersHtml(C);
 [...C.A0,...C.A1].forEach(x=>{const tr=$('cxr_'+x.r.id);if(!tr)return;tr.classList.toggle('bad',x.c.bad);
  const set=(k,v)=>{const e=tr.querySelector('.'+k);if(e)e.innerHTML=v};
  set('c-te',x.c.te?cxE(x.c.te):'-');set('c-he',x.c.he?cxE(x.c.he):'-');set('c-ded',x.c.ded?cxE(x.c.ded):'-');set('c-net','<b>'+cxE(x.c.net)+'</b>')});
 document.querySelectorAll('#vc table.cx-t').forEach(t=>{const A=+t.dataset.ws?C.A1:C.A0,sum=k=>cxE(A.reduce((s,x)=>s+x.c[k],0));
  [['te','t-te'],['he','t-he'],['ded','t-ded'],['net','t-net']].forEach(([k,c])=>{const e=t.querySelector('.'+c);if(e)e.textContent=sum(k)})});
 const w=$('cxwarn');if(w)w.textContent=C.bad?ti('{0} patient(s) with a currency that has no rate: fill the rate below.',C.bad):''}
function cxMonthSet(v){if(/^\d{4}-\d{2}$/.test(v))CXSEL=v;rComm()}
function cxTog(){CXO=!CXO;rComm()}
function cxEdit(el){
 const M=CXM[cxSel()];if(!M)return;const r=M.rows.find(x=>x.id===el.dataset.i);if(!r)return;let v=el.value;const f=el.dataset.f;
 if(f==='tr'||f==='hp'){v=String(v).replace(',','.').trim();v=v===''?'':parseFloat(v);if(v!==''&&!isFinite(v))v=''}
 else if(f==='tc'||f==='hc')v=cxUp(v).trim();
 else v=String(v).trim();
 r[f]=v;cxSave();cxPaint()}
function cxRateEdit(el){
 const M=CXM[cxSel()];if(!M)return;const v=parseFloat(String(el.value).replace(',','.'));
 M.rates=M.rates||{};if(v>0)M.rates[el.dataset.c]=v;else delete M.rates[el.dataset.c];
 el.parentNode.classList.toggle('miss',!(v>0));cxSave();cxPaint()}
function cxAdd(ws){
 const m=cxSel();if(!CXM[m])CXM[m]={rows:[],rates:cxDefRates(),file:'',at:Date.now()};
 const id='r'+Date.now().toString(36)+Math.floor(Math.random()*1e4);
 CXM[m].rows.push({id,n:'',tr:'',tc:'EUR',tm:'NAKIT',hn:'-',hp:'',hc:'EUR',hm:'-',ws:ws?1:0});cxSave();rComm();
 const e=document.querySelector('[data-i="'+id+'"][data-f="n"]');if(e)e.focus()}
function cxDel(id){const M=CXM[cxSel()];if(!M)return;M.rows=M.rows.filter(r=>r.id!==id);cxSave();rComm()}
function cxDelMonth(){const m=cxSel();if(!CXM[m]||!confirm(ti('Remove all the data of {0}?',mn(m))))return;delete CXM[m];CXSEL=null;cxSave();rComm()}
function cxStructSave(){
 const n=i=>parseFloat(String($(i).value).replace(',','.')),T=[];
 for(let i=0;i<CXS.tiers.length;i++){const a=i===0?0:n('cxs_f'+i),p=n('cxs_p'+i);if(!isFinite(a)||!isFinite(p)||p<0||p>100)return cxMsg('Please enter valid numbers.',1);T.push([a,p])}
 for(let i=1;i<T.length;i++)if(T[i][0]<=T[i-1][0])return cxMsg('Each tier must start higher than the one before.',1);
 const d=n('cxs_dep'),c=n('cxs_card'),w=n('cxs_w');if(![d,c,w].every(x=>isFinite(x)&&x>=0))return cxMsg('Please enter valid numbers.',1);
 CXS={tiers:T,dep:d,card:c,wrate:w};cxSetSave();CXO=false;rComm();cxMsg('Saved ✓')}
function cxStructReset(){if(!confirm(ti('Go back to the standard structure?')))return;CXS={tiers:CXD.tiers.map(t=>t.slice()),dep:CXD.dep,card:CXD.card,wrate:CXD.wrate};cxSetSave();CXO=false;rComm()}

/* ---------- uploading the sheet ---------- */
function cxPick(){const f=$('cxf');if(f)f.click()}
async function cxFile(inp){
 const f=inp.files&&inp.files[0];if(!f)return;
 try{
  if(typeof DecompressionStream!='function')throw new Error('old browser');
  const P=cxParse(await XL.read(f),f.name);
  if(!P.rows.length)return cxMsg('No patients were found in this sheet (the headings “HASTA ADI” are needed).',1);
  CXP=P;cxPreview()}
 catch(e){cxMsg('Could not read this file. Please upload the Excel sheet as .xlsx.',1)}
 inp.value=''}
function cxPreview(){
 const P=CXP,m=P.month||cxSel(),L2=Object.keys(P.rates).filter(c=>c!=='EUR').map(c=>c+' = '+P.rates[c]+(P.fromSheet.includes(c)?'':' *')).join(' · ');
 $('mt').textContent=ti('Upload Excel sheet');
 $('mb').innerHTML=`<p class="text-xs mb-2"><b>${esc(P.file)}</b>${P.title?' · '+esc(P.title):''}</p>`
  +`<p class="text-sm font-bold mb-1">${esc(ti('{0} patients found',P.n0))}${P.n1?' + '+esc(ti('{0} in the welcome list',P.n1)):''}</p>`
  +`<p class="text-xs text-slate-600 mb-1">${esc(ti('Rates (€)'))}: ${esc(L2)}</p>${L2.includes('*')?`<p class="text-[11px] text-slate-500 mb-1">* ${esc(ti('not in the sheet: taken from the live exchange rates'))}</p>`:''}`
  +(P.lack.length?`<p class="text-xs font-bold mb-1" style="color:#b45309">${esc(ti('No rate for: {0}. Fill it in after the import.',P.lack.join(', ')))}</p>`:'')
  +`<label class="text-xs font-bold block mt-3">${esc(ti('Put these patients in the month'))}<input type="month" id="cxpm" value="${m}" onchange="cxPreviewWarn()" class="cx-in" style="display:block;margin-top:4px"></label><p id="cxpw" class="text-xs font-bold mt-1" style="color:#b45309"></p>`
  +`<div class="cx-bar" style="justify-content:flex-end;margin-top:14px"><button type="button" class="ep-btn" onclick="cm()">${esc(ti('Cancel'))}</button><button type="button" class="ep-btn ep-gold" onclick="cxImport()">${esc(ti('Import'))}</button></div>`;
 $('md').classList.remove('hidden');cxPreviewWarn()}
function cxPreviewWarn(){const m=$('cxpm').value,e=$('cxpw');if(e)e.textContent=CXM[m]?ti('{0} already has data: it will be replaced.',mn(m)):''}
function cxImport(){
 const m=$('cxpm').value,P=CXP;if(!/^\d{4}-\d{2}$/.test(m)||!P)return;
 CXM[m]={rows:P.rows,rates:P.rates,file:P.file,at:Date.now()};CXSEL=m;cxSave();CXP=null;cm();rComm();cxMsg('Imported ✓')}

/* ---------- the statement as PDF and as Excel ---------- */
function cxStmt(C){
 const td=(v,a)=>`<td style="padding:4px 5px;border-bottom:1px solid #e3ddd8;font-size:9px;${a?'text-align:right;white-space:nowrap':''}">${v}</td>`,th=(v,a)=>`<th style="padding:5px;background:#efe9e3;color:#4b4f80;font-size:8px;text-transform:uppercase;text-align:${a?'right':'left'}">${esc(v)}</th>`;
 const tbl=A=>`<table style="width:100%;border-collapse:collapse;margin-bottom:12px"><thead><tr>${th(ti('Patient'))}${th(ti('Treatment'),1)}${th(ti('Hotel'),1)}${th(ti('Treatment €'),1)}${th(ti('Hotel €'),1)}${th(ti('Deduction €'),1)}${th(ti('Net €'),1)}</tr></thead><tbody>`
  +A.map(x=>{const r=x.r,c=x.c;return `<tr>${td(esc(r.n||'-'))}${td(r.tr?cxN(r.tr)+' '+esc(r.tc)+' · '+esc(ti(cxPay(r.tm))):'-',1)}${td(r.hp?cxN(r.hp)+' '+esc(r.hc)+' · '+esc(ti(cxPay(r.hm))):'-',1)}${td(c.te?cxE(c.te):'-',1)}${td(c.he?cxE(c.he):'-',1)}${td(c.ded?cxE(c.ded):'-',1)}${td('<b>'+cxE(c.net)+'</b>',1)}</tr>`}).join('')+`</tbody></table>`;
 const row=(l,v,b)=>`<div style="display:flex;justify-content:space-between;padding:4px 8px;border-bottom:1px solid #e3ddd8;font-size:10px${b?';font-weight:800;background:#f7f3ef':''}"><span style="color:#4b4f80">${esc(l)}</span><b>${v}</b></div>`;
 return `<div class="pcard" style="margin-bottom:14px">${tbl(C.A0)}<div style="width:260px;margin-left:auto;border:1px solid #e3ddd8;border-radius:8px;overflow:hidden">`
  +row(ti('Treatments'),money(C.te))+row(ti('Hotel'),'− '+money(C.he))+row(ti('Card deduction'),'− '+money(C.ded))+row(ti('Net Total'),money(C.net),1)+row(ti('Commission')+' ('+C.pct+'%)',money(C.comm),1)
  +row(ti('Deposits'),C.deps)+row(ti('Deposit bonus'),cxN(C.bonus)+' ₺',1)+`</div></div>`
  +(C.A1.length?`<div class="pcard"><div style="font-size:10px;font-weight:800;margin:6px 0">${esc(ti('Welcome (Karşılama)'))}</div>${tbl(C.A1)}<div style="width:260px;margin-left:auto;border:1px solid #e3ddd8;border-radius:8px;overflow:hidden">${row(ti('Net Total'),money(C.wn))+row(ti('Welcome commission')+' ('+CXS.wrate+'%)',money(C.wcomm),1)}</div></div>`:'')}
async function cxPdf(){
 const m=cxSel(),C=cxCalc(m);if(!C)return;
 const dl=await kcDl();if(!dl)return cxMsg('Saving files is not available in this view.',1);
 if(typeof html2pdf!='function')return cxMsg('The PDF maker could not be loaded (it needs the internet once).',1);
 try{await document.fonts.ready}catch(x){}
 const wrap=document.createElement('div');wrap.style.cssText='position:fixed;left:-10000px;top:0;width:794px';
 const el=document.createElement('div');el.style.cssText="width:794px;padding:30px 40px;box-sizing:border-box;background:#ffffff;color:#161a59;font-family:Montserrat,'Noto Sans Arabic',sans-serif";
 el.innerHTML=(LANG==='ar'?'<style>*{letter-spacing:0!important}</style>':'')+`<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #a08a7c;padding-bottom:14px;margin-bottom:18px"><div><div style="font-family:Lato,Montserrat,sans-serif;font-size:14px;font-weight:700;letter-spacing:.08em">OMER ISTANBUL <span style="color:#a08a7c">${esc(BRAND_BY)}</span></div><div style="font-size:9px;font-weight:700;letter-spacing:.2em;color:#a08a7c;margin-top:6px;text-transform:uppercase">${esc(ti('Commission Statement'))} — ${esc(mn(m))} — ${esc(ME_NAME)}</div></div><div style="background:#161a59;color:#cdbcb0;font-family:Lato,Montserrat,sans-serif;font-weight:700;font-size:14px;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center">OI</div></div>`+cxStmt(C);
 wrap.appendChild(el);document.body.appendChild(wrap);
 const fn=('Commission - '+ME_NAME+' - '+mn(m)).replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim()+'.pdf';
 try{const blob=await html2pdf().set({margin:[10,0,10,0],image:{type:'jpeg',quality:0.98},html2canvas:{onclone:thmLight,scale:2,backgroundColor:'#ffffff',scrollX:0,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:'.pcard'}}).from(el).outputPdf('blob');
  await dl.save({filename:fn,data:blob})}catch(x){if(!x||x.code!='declined')cxMsg('Could not create the PDF.',1)}
 wrap.remove()}
/* the Excel file has the layout of the consultant's own sheet (LİSTE + KURLAR), so it can be uploaded again */
function cxSheets(m){
 const M=CXM[m],hd=['HASTA ADI','TEDAVİ ÖDEMESİ','PARA BİRİMİ','ÖDEME ŞEKLİ','OTEL ADI','ÖDEME MİKTARI','PARA BİRİMİ','ÖDEME ŞEKLİ'],L1=M.rows.filter(r=>!r.ws),L2=M.rows.filter(r=>r.ws),n=Math.max(L1.length,L2.length,1),A=[];
 const one=r=>r?[r.n,r.tr===''?null:r.tr,r.tc||'-',r.tm,r.hn||'-',r.hp===''?null:r.hp,r.hc||'-',r.hm]:['','','','','','','',''];
 A[0]=['',ME_NAME+'\n'+m.slice(0,4)+' - PRIM TABLOSU'];A[3]=['Satış Danışmanı','','','','','','','','','','Karşılama'];A[4]=[...hd,'','','',...hd];
 for(let i=0;i<n;i++)A[5+i]=[...one(L1[i]),'','','',...one(L2[i])];
 const R=[['PARA BİRİMİ','EUR KARŞILIĞI'],...Object.keys(M.rates).map(c=>[c,M.rates[c]])];
 return{liste:A,kurlar:R}}
async function cxXls(){
 const m=cxSel(),C=cxCalc(m);if(!C)return;const dl=await kcDl();if(!dl)return;
 const s=cxSheets(m),fn='Commission - '+ME_NAME+' - '+m+'.xlsx';
 try{
  if(typeof XLSX=='undefined'){ /* no Excel library (offline): a CSV file opens in Excel too */
   const csv='﻿'+s.liste.map(r=>r.map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
   return await dl.save({filename:fn.replace(/\.xlsx$/,'.csv'),data:new Blob([csv],{type:'text/csv'})})}
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(s.liste),'LİSTE');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(s.kurlar),'KURLAR');
  await dl.save({filename:fn,data:new Blob([XLSX.write(wb,{type:'array',bookType:'xlsx'})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})})}
 catch(x){if(!x||x.code!='declined')cxMsg('Could not create the Excel file.',1)}}
