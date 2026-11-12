/* Ömar Istanbul by Rima — the three records of the portal: Ticket Calendar, Deposit Calendar and Potential Patients Pipeline.
   One user (Rima), so there is no consultant column and no consultant list. The lists start empty and are saved on the device
   (kc_tickets, kc_deposits, kc_potentials: they are part of the Backup file and of the cloud copy). */
Object.assign(E,{
 tickets:{t:'Ticket Calendar',s:'arrivalDate',
  cols:[['bookingMadeOn','Booking Made On','d'],['kitNumber','Kit #','k'],['patientName','Patient Name - Zoho'],['arrivalDate','Arrival Date','d'],['departureDate','Departure Date','d'],['airport','Airport'],['appointmentDate','Appointment Date','d'],['pay1','Visit Payment','m'],['pay2','2nd Visit Payment','m'],['totalPayment','Total Plan Amount','M'],['hotel','Hotel'],['nights','Nights'],['pricePerNight','Price/Night','p'],['currency','Currency'],['visitType','Visit Type'],['treatmentPlan','Treatment Plan']],
  f:[['bookingMadeOn','Booking Made On','date'],['kitNumber','Kit Number','text'],['patientName','Patient Name - Zoho','text'],['arrivalDate','Arrival Date','date'],['departureDate','Departure Date','date'],['airport','Airport',['IST','SAW']],['appointmentDate','Appointment Date','date'],['visitType','Visit Type',['First Visit','Second Visit','Third Visit','Canceled','Unsold']],['pay1','Visit Payment','number'],['pay2','2nd Visit Payment','number'],['totalPayment','Total Plan Amount','number'],['hotel','Hotel','hotel'],['currency','Currency',CUR],['treatmentPlan','Treatment Plan Details','area']]},
 deposits:{t:'Deposit Calendar',s:'depositMadeOn',
  cols:[['depositMadeOn','Deposit Made On','d'],['kitNumber','Kit #','k'],['patientName','Patient Name - Zoho'],['totalPlanAmount','Total Plan Amount','M'],['amount','Deposit Amount','M'],['currency','Currency'],['depositLink','Deposit Payment Link','l']],
  f:[['depositMadeOn','Deposit Made On','date'],['kitNumber','Kit Number','text'],['patientName','Patient Name - Zoho','text'],['totalPlanAmount','Total Plan Amount','number'],['amount','Deposit Amount','number'],['currency','Currency',CUR],['depositLink','Deposit Payment Link','url']]},
 potentials:{t:'Potential Patients',s:'date',
  cols:[['date','Date','d'],['status','Status'],['kitNumber','Kit Number','k'],['patientName','Patient Name - Zoho'],['notes','Notes / Remarks']],
  f:[['date','Date','date'],['status','Status',['NR','No Reply','Waiting For photos','Waiting For Evaluation','Negotiation','Waiting For Deposit','Waiting For Ticket','Postponed','Confirmed']],['kitNumber','Kit Number','text'],['patientName','Patient Name - Zoho','text'],['notes','Notes / Remarks','area']]}
});
Object.assign(SUB,{tickets:'Track bookings, visits, accommodations, and follow-ups (Sorted by Arrival Date).',deposits:'Track incoming deposits (Sorted by Deposit Made On Date).',potentials:'Track incoming lead statuses, postponed clients, and confirmed conversions.'});

let af='ALL',HS=[];
const msg=t=>{const m=$('mg');if(!m)return;m.textContent=ti(t);setTimeout(()=>m.textContent='',3500)};
const sel=()=>[...document.querySelectorAll('.ck:checked')].map(c=>c.value);
function snap(){HS.push(JSON.stringify(D));if(HS.length>15)HS.shift()}
function undo(){if(!HS.length)return msg('Nothing to undo.');Object.assign(D,JSON.parse(HS.pop()));Object.keys(K).forEach(k=>S(K[k],D[k]));render()}

function cell(r,c){const v=r[c[0]];
 if(c[2]=='d')return fd(v);
 if(c[2]=='p')return '$'+(v||0);
 if(c[2]=='M'&&tab=='tickets'&&r.visitType=='Unsold')return'-';
 if(c[2]=='M')return typeof v=='number'?'$'+(v||0)+' '+(r.currency||'USD'):(v||'Second Visit');
 if(c[2]=='k')return v?(/^KIT-/i.test(v)?v:'KIT-'+v):'';
 if(c[2]=='m')return typeof v=='number'?(v>0?'$'+v+' '+(r.currency||'USD'):'-'):(v||'-');
 return v??''}

function rowColor(r){
 if(tab=='potentials')return r.status=='Postponed'?'bg-slate-200':r.status=='Confirmed'?'bg-green-100':'';
 if(tab=='deposits'){const n=(r.patientName||'').trim().toLowerCase();return n&&D.tickets.some(t=>(t.patientName||'').trim().toLowerCase()==n)?'bg-yellow-100':''}
 if(r.visitType=='Canceled')return'bg-red-200';
 if(r.visitType=='Unsold')return'bg-silver';
 const d=x=>x?new Date(x+'T00:00:00'):null,n=new Date();n.setHours(0,0,0,0);
 const a=d(r.arrivalDate),e=d(r.departureDate);
 if(e&&n>e)return(+r.pay2>0)?'bg-blue-100':'bg-green-100';
 if(r.visitType=='Second Visit'&&(!r.bookingMadeOn||r.isUnbookedSecondVisit))return'bg-slate-300';
 if(a&&e&&n>=a&&n<=e)return'bg-pink-100';
 if(a&&a>=n&&(a-n)/864e5<=14)return'bg-yellow-100';
 return''}

/* a ticket whose first visit is over and that has a 2nd Visit Payment gets its own Second Visit row, six months after the arrival */
function clones(){const n=new Date();n.setHours(0,0,0,0);let ch=0;
 const ld=x=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(x||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null},
  p6=x=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(x||'');if(!m)return'';let y=+m[1],mo=+m[2]-1+6;y+=Math.floor(mo/12);mo%=12;const last=new Date(Date.UTC(y,mo+1,0)).getUTCDate();return y+'-'+String(mo+1).padStart(2,'0')+'-'+String(Math.min(+m[3],last)).padStart(2,'0')},
  kk=t=>String(t.kitNumber||'').replace(/^KIT-/i,'').trim().toLowerCase()+'|'+String(t.patientName||'').trim().toLowerCase(),
  has=new Set(D.tickets.filter(t=>t.visitType=='Second Visit').map(kk));
 D.tickets.slice().forEach(t=>{if(t.visitType=='First Visit'&&t.departureDate&&!t.hasClonedSecondVisit){const d=ld(t.departureDate);
  if(d&&n>d&&(parseFloat(t.pay2)||0)>0){t.hasClonedSecondVisit=true;ch=1;if(has.has(kk(t)))return;const fa=p6(t.arrivalDate);
   D.tickets.push({id:'t_'+Date.now()+'_'+Math.floor(Math.random()*100000),bookingMadeOn:'',kitNumber:t.kitNumber,patientName:t.patientName,arrivalDate:fa,departureDate:'',airport:t.airport||'IST',appointmentDate:fa,pay1:t.pay2||0,pay2:'Second Visit',totalPayment:'Second Visit',visitType:'Second Visit',hotel:t.hotel||'Else Where',nights:0,pricePerNight:0,currency:t.currency||'USD',treatmentPlan:t.treatmentPlan||'',isUnbookedSecondVisit:true});has.add(kk(t))}}});
 if(ch)S(K.tickets,D.tickets)}

/* ---------- the screen of the three records ---------- */
function rRec(){
 clones();
 const e=E[tab],cvv=tab=='tickets'&&cv.on;
 $('ttl').textContent=tab=='potentials'?'Potential Patients Pipeline':e.t;$('tsub').textContent=SUB[tab];
 $('tb').parentElement.classList.toggle('hidden',tab=='potentials'||cvv);$('pt').classList.toggle('hidden',tab!='potentials');
 $('add').textContent='+ Add '+(tab=='tickets'?'Ticket':tab=='deposits'?'Deposit':'Patient')+' Entry';
 $('mf').classList.toggle('hidden',tab=='potentials');$('ub').classList.toggle('hidden',tab!='tickets');
 $('leg').classList.toggle('hidden',tab!='tickets'||cv.on);$('leg').classList.toggle('flex',tab=='tickets'&&!cv.on);
 $('cv').classList.toggle('hidden',!cvv);$('cvb').classList.toggle('hidden',tab!='tickets'||cvv);$('tvb').classList.toggle('hidden',!cvv);
 $('selbar').classList.toggle('hidden',cvv);$('mfi').classList.toggle('hidden',cvv);$('mpb').classList.toggle('hidden',tab!='tickets');$('tq').classList.toggle('hidden',tab!='tickets');
 if(tab=='tickets')legMark();
 if(cvv){rCal();return}
 let rows=D[tab].slice();
 const mv=$('mpk').value;
 if(tab=='tickets'){$('bc').textContent=rows.filter(t=>rowColor(t)=='bg-blue-100').length;$('gc').textContent=rows.filter(t=>rowColor(t)=='bg-slate-300').length;$('uc').textContent=rows.filter(t=>t.visitType=='Unsold').length;
  if(mv){const by=$('mpb').value=='a'?'appointmentDate':'bookingMadeOn';rows=rows.filter(t=>(t[by]||'').startsWith(mv))}
  const tq=($('tq').value||'').trim().toLowerCase(),tqd=tq.replace(/\D/g,'');
  if(tq)rows=rows.filter(t=>String(t.patientName||'').toLowerCase().includes(tq)||(tqd&&String(t.kitNumber||'').replace(/\D/g,'').includes(tqd)));
  if(af!='ALL')rows=rows.filter(t=>rowColor(t)==af)}
 if(tab=='deposits'&&mv)rows=rows.filter(d=>(d.depositMadeOn||'').startsWith(mv));
 rows.sort((a,b)=>(a[e.s]||'9')<(b[e.s]||'9')?-1:1);
 const tbl=rows=>'<thead><tr><th><input type="checkbox" aria-label="Select all" onchange="document.querySelectorAll(\'.ck\').forEach(c=>c.checked=this.checked);depInfo()"></th>'+e.cols.map(c=>`<th>${c[1]}</th>`).join('')+(tab=='potentials'?'<th>Action</th>':'')+'</tr></thead><tbody>'
 +(rows.length?rows.map(r=>`<tr class="${rowColor(r)}"><td><input type="checkbox" class="ck" value="${r.id}"></td>`
  +e.cols.map(c=>`<td>${c[2]=='l'?(/^https?:/.test(r[c[0]]||'')?`<a class="text-blue-600 underline" target="_blank" rel="noopener" href="${esc(r[c[0]])}">Link</a>`:'-'):esc(cell(r,c))}</td>`).join('')
  +`${tab=='potentials'?`<td><select onchange="qm('${r.id}',this.value)" class="border rounded text-[10px] bg-white"><option value="">-- Quick Move --</option><option value="Active">Active Pipeline</option><option>Postponed</option><option>Confirmed</option></select></td>`:''}</tr>`).join('')
 :`<tr><td colspan="30" class="text-center text-slate-400 py-4">No entries yet.</td></tr>`)+'</tbody>';
 if(tab=='potentials'){const P=s=>rows.filter(x=>x.status==s),pp=P('Postponed'),pc=P('Confirmed'),pa=rows.filter(x=>x.status!='Postponed'&&x.status!='Confirmed');$('pcp').textContent=pp.length;$('pcc').textContent=pc.length;$('tp1').innerHTML=tbl(pp);$('tp2').innerHTML=tbl(pc);$('tp3').innerHTML=tbl(pa)}else $('tb').innerHTML=tbl(rows);
 depInfo()}

function qm(id,v){if(!v)return;snap();const p=D.potentials.find(x=>x.id==id);if(p){p.status=v=='Active'?'NR':v;S(K.potentials,D.potentials);render()}}
function ptg(k){const x=$('px'+k),o=x.style.display=='none';x.style.display=o?'':'none';$('pb'+k).textContent=o?'▼ Minimize':'▲ Expand'}

/* ---------- add / edit ---------- */
function openM(id){
 const e=E[tab],r=id?D[tab].find(x=>x.id==id):{};
 $('mt').textContent=ti(id?'Edit {0}':'Add {0}',ti(e.t));
 const sel=(n,o,v)=>`<select name="${n}" class="w-full border rounded p-2 font-semibold">${o.map(x=>`<option ${x==v?'selected':''}>${esc(x)}</option>`).join('')}</select>`;
 let h=`<form onsubmit="save(event)" class="grid grid-cols-2 gap-3 text-xs"><input type="hidden" name="id" value="${id||''}">`;
 e.f.forEach(([n,l,t])=>{
  let v=r[n]??(t=='number'?0:''),i;
  if(n=='kitNumber')v=String(v).replace(/^KIT-/i,'');
  if(Array.isArray(t)){i=sel(n,[...t,...(v&&!t.includes(v)?[v]:[])],v||t[0]);if(n=='visitType')i=i.replace('<select ','<select onchange="unsoldFx(this.form)" ')+'<div id="unsm" class="hidden text-[10px] font-semibold text-slate-500 mt-1">Unsold: the patient did not buy. The payment fields are closed. The patient still counts as a ticket.</div>'}
  else if(t=='hotel')i=sel(n,[...H.map(x=>x.name),...(v&&!H.some(x=>x.name==v)?[v]:[])],v||H[0].name);
  else if(t=='area')i=`<textarea name="${n}" rows="2" class="w-full border rounded p-2 font-semibold">${esc(v)}</textarea>`;
  else i=`<input name="${n}" type="${t}" ${t=='number'?'step="0.01"':''} ${n=='kitNumber'||n=='patientName'?'required':''} value="${esc(typeof v=='string'||typeof v=='number'?v:'')}" class="w-full border rounded p-2 font-semibold">`;
  h+=`<label class="${t=='area'||n=='patientName'?'col-span-2':''}">${l}${i}</label>`});
 $('mb').innerHTML=h+'<button class="col-span-2 g rounded py-2 font-bold uppercase">Save Entry</button></form>';
 $('md').classList.remove('hidden');unsoldFx($('mb').querySelector('form'))}
/* Visit Type "Unsold": Visit Payment, 2nd Visit Payment and Total Plan Amount are closed (the patient did not buy) */
function unsoldFx(f){if(!f||!f.elements||!f.elements.visitType)return;const u=f.elements.visitType.value=='Unsold';
 ['pay1','pay2','totalPayment'].forEach(n=>{const i=f.elements[n];if(!i)return;i.disabled=u;i.classList.toggle('bg-slate-100',u);i.classList.toggle('opacity-50',u)});
 const m=$('unsm');if(m)m.classList.toggle('hidden',!u)}
function save(ev){ev.preventDefault();snap();
 const o=Object.fromEntries(new FormData(ev.target)),old=o.id?D[tab].find(x=>x.id==o.id):null;
 E[tab].f.forEach(f=>{if(f[2]=='number'){const v=o[f[0]];o[f[0]]=(v===''&&old&&typeof old[f[0]]=='string'&&old[f[0]])?old[f[0]]:(parseFloat(v)||0)}});
 o.kitNumber=o.kitNumber.replace(/^KIT-/i,'');
 if(tab=='tickets'&&o.visitType=='Unsold'){o.pay1=0;o.pay2=0;o.totalPayment=0}
 if(tab=='tickets'){const h=H.find(x=>x.name==o.hotel);o.pricePerNight=h?h.price:(old&&old.hotel==o.hotel&&typeof old.pricePerNight=='number'?old.pricePerNight:0);o.isUnbookedSecondVisit=false;
  o.nights=o.arrivalDate&&o.departureDate?Math.max(0,Math.round((new Date(o.departureDate)-new Date(o.arrivalDate))/864e5)):0}
 const id=o.id;delete o.id;
 if(id){const i=D[tab].findIndex(x=>x.id==id);D[tab][i]={...D[tab][i],...o}}
 else D[tab].push({id:tab[0]+'_'+Date.now(),...o});
 if(tab=='tickets')clones();
 S(K[tab],D[tab]);cm();render()}
function edSel(){const s=sel();if(s.length!=1)return msg('Select exactly ONE row with the checkboxes to edit.');openM(s[0])}
function delSel(b){const s=sel();if(!s.length)return msg('Select at least one row with the checkboxes.');
 if(!b.dataset.a){b.dataset.a=1;b.textContent=ti('Sure? Click again');setTimeout(()=>{b.dataset.a='';b.textContent=ti('Delete Selected')},3000);return}
 snap();D[tab]=D[tab].filter(x=>!s.includes(x.id));S(K[tab],D[tab]);b.dataset.a='';b.textContent=ti('Delete Selected');render()}

/* ---------- Deposit Calendar: the ticked rows written out in a box, ready to paste in WhatsApp ---------- */
const DSYM={USD:'$',EUR:'€',GBP:'£',CAD:'C$',AUD:'A$',TRY:'₺',TL:'₺'};
function depTxt(r){const c=r.currency||'USD',a=Number(r.amount)||0;
 return['Consultant Name : '+ME_NAME,'Payment Date : '+(r.depositMadeOn?fd(r.depositMadeOn):'-'),'Kit-Number : '+cell(r,['kitNumber','','k']),'Patient Name : '+(r.patientName||''),'Paid Amount : '+(DSYM[c]||'')+a.toLocaleString('en-US')+' '+c,'Link : '+(/^https?:/.test(r.depositLink||'')?r.depositLink:'-')].join('\n')}
function depInfo(){const b=$('dinfo');if(!b)return;
 const ids=tab=='deposits'?[...document.querySelectorAll('#tb .ck:checked')].map(c=>c.value):[],R=ids.map(id=>D.deposits.find(x=>String(x.id)==id)).filter(Boolean);
 b.classList.toggle('hidden',!R.length);if(!R.length){b.innerHTML='';return}
 b.innerHTML='<div class="dpi-h"><b class="lux">'+esc(ti('Deposit details'))+'</b><span>'+esc(ti('{0} selected',R.length))+'</span>'+(R.length>1?'<button type="button" class="dpi-c" onclick="depCopy(-1,this)">📋 '+esc(ti('Copy all'))+'</button>':'')+'</div><div class="dpi-l">'
  +R.map((r,i)=>'<div class="dpi"><pre data-notr>'+esc(depTxt(r))+'</pre><button type="button" class="dpi-c" onclick="depCopy('+i+',this)">📋 '+esc(ti('Copy'))+'</button></div>').join('')+'</div>';
 b._r=R}
function depCopy(i,btn){const R=$('dinfo')._r||[],t=i<0?R.map(depTxt).join('\n\n'):depTxt(R[i]||{});
 const ok=()=>{btn.textContent='✓ '+ti('Copied');btn.classList.add('dpi-ok');toast(ti('Copied. Paste it in WhatsApp.'))},no=()=>toast(ti('Copy was blocked in this window.'));
 if(window.EX&&EX.copyText)EX.copyText(t).then(x=>x?ok():no());else if(navigator.clipboard)navigator.clipboard.writeText(t).then(ok,no);else no()}
document.addEventListener('change',e=>{if(tab=='deposits'&&e.target&&e.target.closest&&e.target.closest('#tb'))depInfo()});

/* ---------- PDF of the ticked rows (a ticket confirmation, a deposit receipt, a potential-patient summary) ---------- */
async function pdfSel(){const s=sel();if(!s.length)return msg('Select at least one row to export a PDF.');
 const dl=await kcDl();if(!dl)return msg('PDF saving is not available in this view.');
 try{await document.fonts.ready}catch(x){}
 const NV='#161a59',MO='#8a7466',
  kt=k=>k?(/^KIT-/i.test(k)?k:'KIT-'+k):'-',v=x=>x?esc(x):'-',dd=x=>x?fd(x):'-',
  amt=(n,c)=>typeof n=='number'?n+' '+(c||'USD'):(n||'-'),
  lb='display:block;font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:3px',
  vl='font-size:12px;font-weight:700;color:'+NV,
  card='background:#ffffff;border:1px solid #e3dcd5;border-radius:14px;padding:16px 18px;margin-bottom:16px',
  card2='background:#f7f3ef;border:1px solid #e3dcd5;border-radius:14px;padding:14px 18px;margin-bottom:16px',
  grid='display:grid;grid-template-columns:1fr 1fr;gap:16px 24px',
  fld=(l,x)=>`<div><span style="${lb}">${ti(l)}</span><div style="${vl}">${x}</div></div>`,
  head=t=>`<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${MO};padding-bottom:14px;margin-bottom:20px"><div><div style="font-size:16px;font-weight:700;color:${NV};letter-spacing:.08em">ÖMAR ISTANBUL BY RIMA</div><div style="font-size:9px;font-weight:700;letter-spacing:.2em;color:${MO};margin-top:6px;text-transform:uppercase">${ti(t)}</div></div><div style="background:${NV};color:#ffffff;font-weight:700;font-size:14px;width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center">ÖI</div></div>`,
  who=(l,d)=>`<div style="${card2};display:flex;justify-content:space-between;align-items:center"><div><span style="${lb}">${ti('Assigned Medical Consultant')}</span><div style="font-size:16px;font-weight:700;color:${NV}">${esc(ME_NAME)}</div></div><div style="text-align:right"><span style="${lb}">${ti(l)}</span><div style="${vl}">${dd(d)}</div></div></div>`,
  pay=(t,a)=>`<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:22px 18px;text-align:center;margin-bottom:16px"><div style="font-size:10px;font-weight:700;letter-spacing:.14em;color:#047857;text-transform:uppercase">✦ ${ti(t)} ✦</div><div style="font-size:28px;font-weight:800;color:#047857;margin-top:8px">${a}</div></div>`,
  bar=a=>`<div style="background:${NV};border-radius:14px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center"><span style="color:#ffffff;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">${ti('Total Plan Amount:')}</span><span style="color:#ffffff;font-size:22px;font-weight:800">${a}</span></div>`,
  note=(l,x)=>`<div style="${card2}"><span style="${lb}">${ti(l)}</span><div style="font-size:11px;color:#334155;white-space:pre-wrap;word-break:break-all">${x}</div></div>`;
 for(const id of s){const r=D[tab].find(x=>x.id==id);if(!r)continue;
  let body,fn;
  if(tab=='tickets'){
   const n=parseFloat(r.nights)||0;
   body=head('Ticket Confirmation')+who('Booking Date',r.bookingMadeOn)
    +`<div style="${card};${grid}">`+fld('Patient Name',v(r.patientName))+fld('Kit Number',kt(r.kitNumber))+fld('Arrival Date',dd(r.arrivalDate))+fld('Departure Date',dd(r.departureDate))+fld('Airport',v(r.airport))+fld('Appointment Date',dd(r.appointmentDate))+fld('Hotel Accommodation',v(r.hotel))+fld('Nights Stayed',typeof nightsTxt=='function'?nightsTxt(n):String(n))+'</div>'
    +pay('Visit Payment',r.visitType=='Unsold'?'-':amt(r.pay1,r.currency))+note('Treatment Plan Details',v(r.treatmentPlan))+bar(r.visitType=='Unsold'?'-':amt(r.totalPayment,r.currency));
   fn=(r.patientName||'Ticket')+' - '+(r.arrivalDate?fd(r.arrivalDate).replace(/\//g,'-'):ti('No arrival date'));
  }else if(tab=='deposits'){
   body=head('Deposit Confirmation Receipt')+who('Deposit Made On',r.depositMadeOn)
    +`<div style="${card};${grid}">`+fld('Patient Name',v(r.patientName))+fld('Kit Number',kt(r.kitNumber))+'</div>'
    +pay('Deposit Amount Received',amt(r.amount,r.currency))+note('Deposit Payment Link',v(r.depositLink))+bar(amt(r.totalPlanAmount,r.currency));
   fn=[r.patientName||'Deposit',kt(r.kitNumber),amt(r.amount,r.currency)].join(' - ');
  }else{
   body=head('Potential Patient Summary')+who('Date',r.date)
    +`<div style="${card};${grid}">`+fld('Patient Name',v(r.patientName))+fld('Kit Number',kt(r.kitNumber))+fld('Status',v(r.status))+'</div>'+note('Notes / Remarks',v(r.notes));
   fn=(r.patientName||'Patient')+' - '+kt(r.kitNumber);
  }
  fn=fn.replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim()+'.pdf';
  const wrap=document.createElement('div');wrap.style.cssText='position:fixed;left:-10000px;top:0;width:794px';
  const el=document.createElement('div');
  el.style.cssText="width:794px;padding:40px;box-sizing:border-box;background:#ffffff;color:"+NV+";font-family:Montserrat,'Noto Sans Arabic',sans-serif";
  el.innerHTML=(LANG==='ar'?'<style>*{letter-spacing:0!important}</style>':'')+body;wrap.appendChild(el);document.body.appendChild(wrap);
  try{const blob=await html2pdf().set({margin:0,image:{type:'jpeg',quality:0.98},html2canvas:{onclone:thmLight,scale:2,backgroundColor:'#ffffff',scrollX:0,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['avoid-all']}}).from(el).outputPdf('blob');
   await dl.save({filename:fn,data:blob})}catch(x){if(!x||x.code!='declined')msg('Could not create the PDF.')}
  wrap.remove()}}

/* ---------- Ticket Calendar: the colour legend ---------- */
function legInit(){const l=$('leg');if(!l)return;
 l.innerHTML=[['bg-red-200','Canceled'],['bg-blue-100','First Visit Done','bc'],['bg-slate-300','2nd Visit Unbooked','gc'],['bg-yellow-100','Upcoming (≤14 Days)'],['bg-pink-100','In Istanbul'],['bg-green-100','Departed'],['bg-silver','Unsold','uc']].map(([c,t,id])=>`<button onclick="af='${c}';render()" class="px-2.5 py-1 rounded ${c} flex items-center gap-1">${t}${id?` <span id="${id}" class="bg-slate-800 text-white px-1.5 rounded-full text-[9px]">0</span>`:''}</button>`).join('')+'<button onclick="af=\'ALL\';render()" class="px-2.5 py-1 rounded bg-slate-900 text-white ml-auto">Show All</button>'}
legInit();
$('add').onclick=()=>openM();

/* ===== Ticket Calendar: month and year view ===== */
const CVK={a:{f:'arrivalDate',ic:'✈',lb:'Arrival Date',c:['#dbeafe','#60a5fa','#1e3a8a']},p:{f:'appointmentDate',ic:'🦷',lb:'Appointment Date',c:['#dcfce7','#4ade80','#14532d']},d:{f:'departureDate',ic:'🏠',lb:'Departure Date',c:['#fef9c3','#facc15','#713f12']}};
const CVO=['a','p','d'];
let cv={on:false,mode:'month',y:new Date().getFullYear(),m:new Date().getMonth(),k:{a:1,p:1,d:1}};
const cvIso=(y,m,d)=>y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
const cvCap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
const cvMon=(y,m)=>cvCap(new Date(y,m,1).toLocaleString(LANGS[LI][2],{month:'long'}));
const cvToday=()=>{const n=new Date();return cvIso(n.getFullYear(),n.getMonth(),n.getDate())};
const cvDead=t=>t.visitType=='Canceled';
function legMark(){[...$('leg').children].forEach(b=>{const on=(b.getAttribute('onclick')||'').includes("af='"+af+"'");['ring-2','ring-slate-900'].forEach(k=>b.classList.toggle(k,on))})}
const cvBase=()=>D.tickets;
const cvSort=(a,b)=>CVO.indexOf(a.k)-CVO.indexOf(b.k)||(a.t.patientName||'').localeCompare(b.t.patientName||'');
const cvMap=all=>{const m={};cvBase().forEach(t=>CVO.forEach(k=>{const ds=t[CVK[k].f];if((all||cv.k[k])&&ds)(m[ds]=m[ds]||[]).push({t,k,ds})}));Object.values(m).forEach(a=>a.sort(cvSort));return m};
const cvTip=t=>[t.patientName,t.kitNumber?'KIT-'+String(t.kitNumber).replace(/^KIT-/i,''):'',t.arrivalDate?ti('Arrival Date')+': '+fd(t.arrivalDate):'',t.appointmentDate?ti('Appointment Date')+': '+fd(t.appointmentDate):'',t.departureDate?ti('Departure Date')+': '+fd(t.departureDate):'',t.hotel||'',t.visitType||''].filter(Boolean).join(' · ');
const cvChip=e=>{const c=CVK[e.k].c,t=e.t;return `<div data-cv="chip" title="${esc(CVK[e.k].ic+' '+ti(CVK[e.k].lb)+' · '+cvTip(t))}" style="display:block;width:100%;text-align:start;background:${c[0]};border:1px solid ${c[1]};color:${c[2]};border-radius:4px;padding:1px 4px;font-size:10px;font-weight:700;line-height:1.35;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-top:2px;${cvDead(t)?'text-decoration:line-through;opacity:.55;':''}">${CVK[e.k].ic} ${esc(t.patientName||'')}</div>`};
function cvMonthHTML(mp){const y=cv.y,m=cv.m,loc=LANGS[LI][2],first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate(),td=cvToday();
 const wd=[...Array(7)].map((_,i)=>`<div style="padding:4px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;background:#f1f5f9;border:1px solid #e2e8f0">${esc(new Date(2024,0,1+i).toLocaleString(loc,{weekday:'short'}))}</div>`).join('');
 let cells='';for(let b=0;b<first;b++)cells+='<div style="background:#f8fafc;border:1px solid #f1f5f9;min-height:96px"></div>';
 for(let d=1;d<=n;d++){const ds=cvIso(y,m,d),ts=mp[ds]||[],dow=(first+d-1)%7;
  cells+=`<div onclick="cvDayOpen('${ds}')" onkeydown="if(event.key=='Enter')cvDayOpen('${ds}')" role="button" tabindex="0" style="cursor:pointer;min-height:96px;min-width:0;padding:3px;border:1px solid #e2e8f0;background:${dow>4?'#f8fafc':'#ffffff'};${ds==td?'box-shadow:inset 0 0 0 2px #8a7466;':''}"><div style="font-size:11px;font-weight:700;color:${ds==td?'#161a59':'#475569'}">${d}</div>${ts.slice(0,4).map(cvChip).join('')}${ts.length>4?`<span style="display:block;margin-top:2px;font-size:10px;font-weight:700;color:#4338ca;text-decoration:underline">${esc(ti('+{0} more',ts.length-4))}</span>`:''}</div>`}
 return `<div style="overflow-x:auto"><div style="min-width:760px"><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr))">${wd}</div><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr))">${cells}</div></div></div>`}
function cvYearHTML(mp){const y=cv.y,loc=LANGS[LI][2],td=cvToday();
 const wk=[...Array(7)].map((_,i)=>`<span>${esc(new Date(2024,0,1+i).toLocaleString(loc,{weekday:'narrow'}))}</span>`).join('');
 const cards=[...Array(12)].map((_,m)=>{const first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate(),cnt=new Set();let cells='';
  for(let b=0;b<first;b++)cells+='<div></div>';
  for(let d=1;d<=n;d++){const ds=cvIso(y,m,d),ts=mp[ds]||[];ts.forEach(e=>cnt.add(e.t.id));
   const ks=CVO.filter(k=>ts.some(e=>e.k==k));let bg='#ffffff',bd='#e2e8f0',fg='#64748b';
   if(ks.length){bd=CVK[ks[0]].c[1];fg='#1e293b';bg=ks.length==1?CVK[ks[0]].c[1]:`linear-gradient(90deg,${ks.map((k,i)=>`${CVK[k].c[1]} ${i*100/ks.length}% ${(i+1)*100/ks.length}%`).join(',')})`}
   cells+=`<button type="button" onclick="cvDayOpen('${ds}')"${ts.length?` title="${esc(ts.map(e=>CVK[e.k].ic+' '+e.t.patientName).join(', '))}"`:''} style="aspect-ratio:1;font-size:9px;font-weight:700;border-radius:3px;border:1px solid ${bd};background:${bg};color:${fg};${ds==td?'box-shadow:0 0 0 2px #8a7466;':''}">${d}</button>`}
  return `<div style="border:${m==cv.m?'2px solid #8a7466':'1px solid #e2e8f0'};border-radius:10px;padding:${m==cv.m?'7px':'8px'}"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px;margin-bottom:4px"><button type="button" onclick="cvMonthOpen(${m})" class="lux font-bold text-sm hover:underline">${esc(cvMon(y,m))}</button><span style="font-size:10px;font-weight:700;color:#64748b">${esc(ti('Tickets: {0}',cnt.size))}</span></div><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;text-align:center;font-size:8px;font-weight:700;color:#94a3b8;margin-bottom:2px">${wk}</div><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px">${cells}</div></div>`}).join('');
 return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px">${cards}</div>`}
function rCal(){const mp=cvMap(),Y=new Date().getFullYear(),base=cvBase();
 const yrs=[...new Set([Y-1,Y,Y+1,Y+2,cv.y,...base.flatMap(t=>CVO.map(k=>+(t[CVK[k].f]||'').slice(0,4))).filter(Boolean)])].sort((a,b)=>a-b);
 $('cvy').innerHTML=yrs.map(y=>`<option value="${y}">${y}</option>`).join('');$('cvy').value=String(cv.y);
 $('cvm').innerHTML=[...Array(12)].map((_,i)=>`<option value="${i}">${cvMon(cv.y,i)}</option>`).join('');$('cvm').value=String(cv.m);
 const yr=cv.mode=='year';$('cvt').textContent=yr?String(cv.y):cvMon(cv.y,cv.m)+' '+cv.y;$('cvm').classList.toggle('hidden',yr);
 [['cvbm','month'],['cvby','year']].forEach(([id,md])=>{const on=cv.mode==md;$(id).classList.toggle('bg-slate-900',on);$(id).classList.toggle('text-white',on);$(id).classList.toggle('bg-white',!on)});
 const all=CVO.every(k=>cv.k[k]);
 $('cvf').innerHTML=`<button type="button" onclick="cvAll()" aria-pressed="${all}" style="padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;border:2px solid #161a59;background:${all?'#161a59':'#fff'};color:${all?'#fff':'#161a59'}">${esc(ti('All Together'))}</button>`+CVO.map(k=>{const c=CVK[k].c,on=cv.k[k];return `<button type="button" onclick="cvKind('${k}')" aria-pressed="${!!on}" style="padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;border:2px solid ${on?c[1]:'#cbd5e1'};background:${on?c[0]:'#fff'};color:${on?c[2]:'#94a3b8'}">${CVK[k].ic} ${esc(ti(CVK[k].lb))}</button>`}).join('');
 const pre=yr?cv.y+'-':cv.y+'-'+String(cv.m+1).padStart(2,'0')+'-';
 const note=Object.keys(mp).some(d=>d.startsWith(pre))?'':`<p class="text-xs text-slate-400 italic text-center py-2">${ti('No tickets match this view.')}</p>`;
 $('cvg').classList.toggle('hidden',yr);$('cvyr').classList.toggle('hidden',!yr);
 if(yr)$('cvyr').innerHTML=cvYearHTML(mp)+note;else $('cvg').innerHTML=cvMonthHTML(mp)+note}
function cvToggle(on){cv.on=!!on;if(on){const n=new Date();cv.y=n.getFullYear();cv.m=n.getMonth()}render()}
function cvNav(d){if(cv.mode=='year')cv.y+=d;else{cv.m+=d;if(cv.m<0){cv.m=11;cv.y--}else if(cv.m>11){cv.m=0;cv.y++}}rCal()}
function cvMode(md){cv.mode=md;rCal()}
function cvGoToday(){const n=new Date();cv.y=n.getFullYear();cv.m=n.getMonth();rCal()}
function cvPick(){cv.m=+$('cvm').value;cv.y=+$('cvy').value;rCal()}
function cvMonthOpen(m){cv.m=m;cv.mode='month';rCal();try{$('cv').scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}}
function cvKind(k){if(CVO.every(x=>cv.k[x]))cv.k={a:0,p:0,d:0,[k]:1};else{cv.k[k]=cv.k[k]?0:1;if(!CVO.some(x=>cv.k[x]))cv.k={a:1,p:1,d:1}}rCal()}
function cvAll(){cv.k={a:1,p:1,d:1};rCal()}
function cvDayOpen(ds){const[y,m,d]=ds.split('-').map(Number),O='pad',ts=(cvMap(1)[ds]||[]).slice().sort((x,z)=>O.indexOf(x.k)-O.indexOf(z.k)||(x.t.patientName||'').localeCompare(z.t.patientName||''));
 const n=k=>ts.filter(e=>e.k==k&&!cvDead(e.t)).length;
 $('mt').textContent=ti('Tickets on {0}',new Date(y,m-1,d).toLocaleDateString(LANGS[LI][2],{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
 const box=(k,lb)=>{const c=CVK[k].c;return `<div style="background:${c[0]};border:1px solid ${c[1]};color:${c[2]};border-radius:10px;padding:8px 6px;text-align:center"><div style="font-size:24px;font-weight:800;line-height:1.1">${n(k)}</div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${CVK[k].ic} ${esc(ti(lb))}</div></div>`};
 $('mb').innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px">${box('p','Appointments')}${box('a','Arrivals')}${box('d','Departures')}</div>`+(ts.length?ts.map(e=>{const c=CVK[e.k].c,t=e.t;return `<div data-cv="row" style="background:${c[0]};border:1px solid ${c[1]};color:${c[2]};border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:12px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="${cvDead(t)?'text-decoration:line-through;opacity:.6':''}">${CVK[e.k].ic} ${esc(t.patientName||'')} <span style="font-weight:600">· ${esc(ti(CVK[e.k].lb))}</span></b><button type="button" onclick="openM('${t.id}')" class="g rounded px-2 py-1 text-[10px] font-bold uppercase">Edit ticket</button></div><div style="font-size:11px;margin-top:3px">${esc(cvTip(t))}</div></div>`}).join(''):`<p class="text-xs text-slate-500">${ti('No tickets on this day.')}</p>`);
 $('md').classList.remove('hidden')}
