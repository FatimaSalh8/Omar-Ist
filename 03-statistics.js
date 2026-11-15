/* Ömar Istanbul by Rima — Monthly Performance Statistics (the consultant view of Rima).
   The figures come from the monthly Excel sheets uploaded under "Commission Structure & Audits" (see 04-commission.js). All money is in euro. */
const R={USD:1,EUR:1.124,GBP:1.3328,CAD:0.7063,AUD:0.6951,TRY:0.0202};
const usd=(a,c)=>Math.round((parseFloat(a)||0)*(R[c]||1));
const nm=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const mn=m=>{const[p,q]=String(m).split('-');return new Date(+p,q-1,1).toLocaleString(LANGS[LI][2],{month:'long'})+' '+p};
const money=v=>(v<0?'− ':'')+'€ '+Math.abs(+v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const stShort=m=>{const[p,q]=m.split('-');return new Date(+p,q-1,1).toLocaleString(LANGS[LI][2],{month:'short'})+' '+p.slice(2)};
const stMonths=(m,n)=>{const[y,q]=m.split('-').map(Number),o=[];for(let i=n-1;i>=0;i--){const d=new Date(y,q-1-i,1);o.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'))}return o};
const stK=v=>v>=10000?(v/1000)+'K':String(v);

/* a column chart of the net total of the last 6 months, with the tiers of the commission as thin lines */
function stChart(ms,sel){
 const D=ms.map(m=>{const c=cxCalc(m);return{m,c}}),T=cxTiers(),top=Math.max(0,...D.map(d=>d.c?d.c.net:0));
 const nx=T.find(t=>t[0]>top),want=Math.max(top,nx?nx[0]:top)*1.08||1000,step=want>60000?20000:want>30000?10000:want>12000?5000:want>6000?2000:want>2400?1000:500,ymax=Math.ceil(want/step)*step;
 const W=Math.max(300,Math.min(760,(($('vs')&&$('vs').clientWidth)||720)-72)),H=230,ml=46,mr=64,mt=16,mb=30,pw=W-ml-mr,ph=H-mt-mb,band=pw/ms.length,bw=Math.min(24,band*.5),Y=v=>mt+ph-Math.max(0,v)/ymax*ph;
 let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ti('Net total per month'))}">`;
 for(let v=0;v<=ymax;v+=ymax/4)s+=`<line x1="${ml}" x2="${W-mr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e3ddd8" stroke-width="1"/><text class="st-ax" x="${ml-6}" y="${Y(v)+3}" text-anchor="end">${esc(stK(Math.round(v)))}</text>`;
 T.forEach(t=>{if(t[0]>0&&t[0]<ymax)s+=`<line x1="${ml}" x2="${W-mr}" y1="${Y(t[0])}" y2="${Y(t[0])}" stroke="#9b9cbb" stroke-width="1"/><text class="st-ax" x="${W-mr+5}" y="${Y(t[0])+3}" text-anchor="start">${t[1]}% ≥ ${esc(stK(t[0]))}</text>`});
 D.forEach((d,i)=>{
  const cx0=ml+band*i+band/2,x=cx0-bw/2,net=d.c?d.c.net:0,y=Y(net),h=Math.max(0,mt+ph-y),r=Math.min(4,h),on=d.m===sel;
  if(d.c&&net>0)s+=`<path d="M${x},${mt+ph}V${y+r}Q${x},${y} ${x+r},${y}H${x+bw-r}Q${x+bw},${y} ${x+bw},${y+r}V${mt+ph}Z" fill="${on?'#161a59':'#b9b8dd'}"/>`;
  if(on&&d.c)s+=`<text class="st-val" x="${cx0}" y="${Math.min(y,mt+ph)-6}" text-anchor="middle">${esc(cxN(Math.round(net)))}</text>`;
  s+=`<text class="st-ax" x="${cx0}" y="${H-10}" text-anchor="middle"${on?' style="font-weight:800;fill:#161a59"':''}>${esc(stShort(d.m))}</text>`
   +`<rect class="st-hit" data-i="${i}" x="${ml+band*i}" y="${mt}" width="${band}" height="${ph+mb-6}" tabindex="0" role="img" aria-label="${esc(mn(d.m)+': '+(d.c?money(d.c.net):'-'))}"/>`});
 s+=`</svg><div class="st-tip" id="sttip"></div>`;
 return{html:`<div class="st-chart" id="stch">${s}</div>`,D}}
function stHover(D){
 const box=$('stch'),tip=$('sttip');if(!box||!tip)return;
 const show=(el)=>{const d=D[+el.dataset.i];if(!d)return;tip.textContent='';
  const mk=(t,tag)=>{const e=document.createElement(tag||'span');e.textContent=t;tip.appendChild(e)};
  mk(mn(d.m));
  if(d.c){mk(money(d.c.net),'b');mk(ti('Commission')+' '+d.c.pct+'% = '+money(d.c.comm));mk(ti('{0} patients',d.c.n)+' · '+ti('{0} deposits',d.c.deps))}else mk(ti('No sheet for this month.'));
  tip.style.display='block';const r=el.getBoundingClientRect(),b=box.getBoundingClientRect();tip.style.left=(r.left-b.left+r.width/2)+'px';tip.style.top=Math.max(34,(r.top-b.top)+30)+'px'};
 box.querySelectorAll('.st-hit').forEach(el=>{el.addEventListener('pointerenter',()=>show(el));el.addEventListener('pointermove',()=>show(el));el.addEventListener('focus',()=>show(el));el.addEventListener('pointerleave',()=>{tip.style.display='none'});el.addEventListener('blur',()=>{tip.style.display='none'})})}

function stMeter(C){
 const T=cxTiers(),max=T[T.length-1][0]*1.12||1,p=v=>Math.min(100,Math.max(0,v/max*100));
 return `<div class="st-meter" role="img" aria-label="${esc(ti('Progress to the next tier'))}"><div class="st-fill" style="width:${p(C.net)}%"></div>`
  +T.map((t,i)=>t[0]>0?`<div class="st-tick" style="left:${p(t[0])}%"><span class="${i%2?'d':'u'}">${t[1]}% · ${esc(stK(t[0]))}</span></div>`:'').join('')+`</div>`
  +`<p class="text-xs font-bold" style="color:#4b4f80">${esc(C.next?ti('{0} more net to reach {1}%',money(C.gap),C.next[1]):ti('Top tier reached.'))}</p>`}

function stBreak(C){
 const pay={},cur={};
 C.A0.forEach(x=>{const k=cxPay(x.r.tm),p=pay[k]||(pay[k]={n:0,e:0});p.n++;p.e+=x.c.te;
  if(x.r.tr){const c=x.r.tc||'-',q=cur[c]||(cur[c]={n:0,o:0,e:0});q.n++;q.o+=+x.r.tr||0;q.e+=x.c.te}});
 const tb=(h,o,f)=>`<table class="st-t"><thead><tr><th>${esc(ti(h[0]))}</th><th class="n">${esc(ti('Patients'))}</th>${h[1]?`<th class="n">${esc(ti(h[1]))}</th>`:''}<th class="n">${esc(ti('Treatment €'))}</th></tr></thead><tbody>`
  +Object.keys(o).map(k=>`<tr><td>${esc(f(k))}</td><td class="n">${o[k].n}</td>${h[1]?`<td class="n">${cxE(o[k].o)}</td>`:''}<td class="n">${cxE(o[k].e)}</td></tr>`).join('')+`</tbody></table>`;
 return `<div class="st-two"><div>${tb(['Payment'],pay,k=>ti(k))}</div><div>${tb(['Currency','Original amount'],cur,k=>k)}</div></div>`}


/* ---------- LIVE from the Ticket Calendar and the Deposit Calendar (as in the old portal) ----------
   Tickets received = tickets whose "Booking Made On" is in the month. Patients arrived = tickets whose arrival is in the month.
   Expected cash = the Visit Payment of the tickets arriving that month; the hotel (nights x price per night) is taken off to give the net.
   Deposits received = deposits whose "Deposit Made On" is in the month; a deposit with a payment link earns the deposit bonus.
   The commission % follows the same tiers as Commission Structure & Audits. Targets are kept per month on this device (kc_targets). */
let STG=L('kc_targets',{});
const stEur=(m,a,c)=>{a=parseFloat(a);if(!isFinite(a)||!a)return 0;c=String(c||'USD').toUpperCase().trim();if(c==='EUR')return a;
 const M=typeof CXM!='undefined'&&CXM[m],r=(M&&cxRate(M,c))||cxDefRates()[c];return r>0?a*r:0};
const stOk=t=>t.visitType!=='Canceled'&&t.visitType!=='Unsold';
function stLive(m){
 const T=(D.tickets||[]).filter(stOk),P=(D.deposits||[]),inM=v=>String(v||'').startsWith(m);
 const booked=T.filter(t=>inM(t.bookingMadeOn)),arr=T.filter(t=>inM(t.arrivalDate)),deps=P.filter(d=>inM(d.depositMadeOn));
 const cash=arr.reduce((s,t)=>s+stEur(m,t.pay1,t.currency),0),hotel=arr.reduce((s,t)=>s+stEur(m,(+t.nights||0)*(+t.pricePerNight||0),t.currency),0);
 const exp=booked.reduce((s,t)=>s+stEur(m,t.pay1,t.currency),0),net=cash-hotel,Ts=cxTiers(),pct=cxPct(Math.max(0,net)),depE=deps.reduce((s,d)=>s+stEur(m,d.amount,d.currency),0),linked=deps.filter(d=>/^https?:/i.test(d.depositLink||'')).length;
 const g=STG[m]||{},tg={dep:+g.dep||0,tix:+g.tix||0,cash:+g.cash||0},hit=(tg.dep||tg.tix||tg.cash)&&(!tg.dep||deps.length>=tg.dep)&&(!tg.tix||booked.length>=tg.tix)&&(!tg.cash||exp>=tg.cash);
 return{m,exp,tix:booked.length,arr:arr.length,deps:deps.length,depE,cash,hotel,net,pct,comm:Math.round(Math.max(0,net)*pct)/100,bonus:linked*CXS.dep,linked,tg,hit:!!hit,tb:hit?(+STG._bonus||0):0}}
function stTgSet(m,k,v){const g=STG[m]=STG[m]||{};v=Math.max(0,parseFloat(v)||0);if(v)g[k]=v;else delete g[k];if(!Object.keys(g).length)delete STG[m];S('kc_targets',STG);rStats()}
function stTgBonus(v){STG._bonus=Math.max(0,parseFloat(v)||0);S('kc_targets',STG);rStats()}
/* the 6-month forecast: the month chosen and the 5 months after it */
const stNext=(m,n)=>{const[y,q]=m.split('-').map(Number),o=[];for(let i=0;i<n;i++){const d=new Date(y,q-1+i,1);o.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'))}return o};
function stLiveHtml(m){
 const X=stLive(m),cur=nm(),eu=v=>money(v),k=(l,v,c)=>`<div class="cx-tile"><span>${esc(l)}</span><b style="color:${c}">${v}</b></div>`;
 let h=`<div class="cx-sum"><div class="cx-sumh"><b class="lux uppercase tracking-wider text-sm" style="color:#c9a24a">${esc(ti('{0} Performance Summary',mn(m)))}</b><span style="font-size:10px;color:#9b9cbb">${esc(ti('Consolidated Executive Metrics'))}</span></div><div class="cx-tiles" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">`
  +k(ti('Month Total Cash'),eu(X.cash),'#34d399')+k(ti('Net Total'),eu(X.net),'#818cf8')+k(ti('Patients Arrived'),X.arr,'#fbbf24')+k(ti('Commission Amount'),eu(X.comm),'#c084fc')+k(ti('Total Bonuses'),eu(X.tb)+' + '+cxN(X.bonus)+' ₺','#60a5fa')+`</div></div>`;
 const tin=(mm,key,v)=>`<input type="number" min="0" step="1" value="${v||0}" onchange="stTgSet('${mm}','${key}',this.value)" class="st-tin" aria-label="${esc(ti(key=='dep'?'Deposit Target':key=='tix'?'Tickets Target':'Cash Target'))}">`;
 const R6=stNext(m,6).map(stLive);
 h+=`<div class="st-card" style="padding:0;overflow:hidden"><div class="cx-wrap" style="margin:0;border:0"><table class="st-t st-fc" style="min-width:1180px"><thead>`
  +`<tr><th rowspan="2">${esc(ti('Month (6-Month Forecast)'))}</th><th colspan="3" class="c st-g1">${esc(ti('Target Criteria'))}</th><th colspan="3" class="c st-g2">${esc(ti('Expected Income Performance'))}</th><th rowspan="2" class="n">${esc(ti('Month Total Cash'))} (€)</th><th rowspan="2" class="n">${esc(ti('Net Total'))} (€)</th><th rowspan="2" class="n">${esc(ti('Patients Arrived'))}</th><th rowspan="2" class="n">${esc(ti('Comm. %'))}</th><th rowspan="2" class="n">${esc(ti('Comm. Amount'))} (€)</th><th rowspan="2" class="n">${esc(ti('Target Bonus'))} (€)</th><th rowspan="2" class="n">${esc(ti('Deposit Bonus'))} (₺)</th></tr>`
  +`<tr><th class="n st-g1">${esc(ti('Deposit Target'))}</th><th class="n st-g1">${esc(ti('Tickets Target'))}</th><th class="n st-g1">${esc(ti('Cash Target'))} (€)</th><th class="n st-g2">${esc(ti('Deposits Rec’d'))}</th><th class="n st-g2">${esc(ti('Tickets Rec’d'))}</th><th class="n st-g2">${esc(ti('Income Cash Exp.'))} (€)</th></tr></thead><tbody>`
  +R6.map(x=>`<tr class="${x.m===m?'on':''}"><td style="white-space:nowrap">${esc(mn(x.m))}${x.m===cur?' ('+esc(ti('Active'))+')':''}</td>`
   +`<td class="n st-g1">${tin(x.m,'dep',x.tg.dep)}</td><td class="n st-g1">${tin(x.m,'tix',x.tg.tix)}</td><td class="n st-g1">${tin(x.m,'cash',x.tg.cash)}</td>`
   +`<td class="n st-g2${x.tg.dep&&x.deps>=x.tg.dep?' st-ok':''}">${x.deps}</td><td class="n st-g2${x.tg.tix&&x.tix>=x.tg.tix?' st-ok':''}">${x.tix}</td><td class="n st-g2${x.tg.cash&&x.exp>=x.tg.cash?' st-ok':''}">${cxE(x.exp)}</td>`
   +`<td class="n" style="color:#059669">${cxE(x.cash)}</td><td class="n" style="color:#4f46e5">${cxE(x.net)}</td><td class="n" style="color:#d97706">${x.arr}</td><td class="n" style="color:#7c3aed">${x.pct}%</td><td class="n" style="color:#7c3aed"><b>${cxE(x.comm)}</b></td><td class="n">${x.tb?cxE(x.tb):'0'}</td><td class="n">${cxN(x.bonus)}</td></tr>`).join('')
  +`</tbody></table></div></div>`;
 h+=`<div class="st-card np" style="display:flex;flex-wrap:wrap;gap:14px;align-items:center"><label class="text-xs font-bold">${esc(ti('Target Bonus'))} (€): <input type="number" min="0" step="1" class="cx-in" style="width:110px" value="${+STG._bonus||0}" onchange="stTgBonus(this.value)"></label><span style="font-size:11px;color:#6b6c80">${esc(ti('Paid in a month where every target that is set is reached. Type the targets straight into the table.'))}</span></div>`;
 const T=cxTiers();
 h+=`<div class="st-card"><h3>💎 ${esc(ti('Tiered Commission Rate Reference Structure'))}</h3><div class="st-tiers">${T.map((t,i)=>`<div class="${X.pct===t[1]&&cxTierI(X.net)===i?'on':''}"><small>${esc(cxRange(i))} €</small><b>${t[1]}%</b><i>* ${esc(ti('Net Total'))} (€)</i></div>`).join('')}</div>`;
 const RT=(typeof CXM!='undefined'&&CXM[m]&&CXM[m].rates)?Object.assign({},cxDefRates(),CXM[m].rates):cxDefRates();
 h+=`<h3 style="margin-top:16px">💱 ${esc(ti('Active Currency Conversion Rates (to EUR)'))}</h3><div class="st-rates">${['EUR','USD','GBP','CAD','AUD','TRY'].map(c=>`<div><b>${c}</b><span>${(+RT[c]||0).toLocaleString('en-US',{maximumFractionDigits:4})} EUR</span></div>`).join('')}</div>`
  +`<p style="font-size:10px;color:#9b9cbb;margin:10px 0 0">${esc(ti('Month Total Cash = Visit Payment of the tickets arriving in the month; Net Total = cash minus hotel. Income Cash Exp. = Visit Payment of the tickets booked in the month. Canceled and unsold tickets are left out.'))}</p></div>`;
 return h}
function rStats(){
 const m=cxSel(),C=cxCalc(m),ms=stMonths(m,6);let h=`<div class="cx-h"><div><h2 class="lux font-bold text-lg uppercase tracking-wider">${esc(ti('Monthly Performance Statistics'))}</h2><p class="text-xs text-slate-500">${esc(ti('Target criteria, expected cash, tiered commission breakdown, and bonus audits.'))}</p></div>`
  +`<div class="cx-bar np"><button type="button" class="ep-btn ep-gold" onclick="print()">🖨 ${esc(ti('Print / PDF Export'))}</button><label class="text-xs font-bold">${esc(ti('Filter Month'))}:</label><input type="month" id="sm" value="${m}" onchange="cxMonthSet(this.value);rStats()" class="cx-in"><button type="button" class="ep-btn" onclick="$('sm').value=nm();cxMonthSet(nm());rStats()">${esc(ti('Current Month'))}</button></div></div>`;
 const all=ms.map(x=>cxCalc(x)),any=all.some(Boolean);
 h+=stLiveHtml(m)+`<h3 class="lux font-bold uppercase tracking-wider text-sm" style="margin:26px 0 8px;color:#a08a7c">${esc(ti('Commission from the monthly Excel sheet'))}</h3>`;
 if(!any){
  h+=`<div class="cx-empty"><b>${esc(ti('No figures yet.'))}</b><p>${esc(ti('Upload the Excel sheet of a month under Commission Structure & Audits and the statistics appear here.'))}</p><p style="margin-top:10px"><button type="button" class="ep-btn ep-gold" onclick="tab='commission';render()">${esc(ti('Open Commission Structure & Audits'))}</button></p></div>`;
  $('vs').innerHTML=h;return}
 if(C){
  const tr=C.M.rates&&+C.M.rates.TRY>0?C.M.rates.TRY:0,avg=C.n?C.net/C.n:0,t=(l,v,k)=>`<div class="cx-tile"><span>${esc(l)}</span><b style="color:${k}">${v}</b></div>`;
  h+=`<div class="cx-sum"><div class="cx-sumh"><b class="lux uppercase tracking-wider text-sm" style="color:#a08a7c">${esc(ti('{0} Performance Summary',mn(m)))}</b><span style="font-size:10px;color:#9b9cbb">${esc(ME_NAME)}</span></div><div class="cx-tiles">`
   +t(ti('Patients'),C.n,'#e3ddd8')+t(ti('Treatments'),money(C.te),'#34d399')+t(ti('Net Total'),money(C.net),'#818cf8')+t(ti('Commission')+' ('+C.pct+'%)',money(C.comm),'#c084fc')
   +t(ti('Deposits'),C.deps,'#e3ddd8')+t(ti('Deposit bonus'),cxN(C.bonus)+' ₺','#60a5fa')+t(ti('Average net per patient'),money(avg),'#e3ddd8')+(C.A1.length?t(ti('Welcome commission'),money(C.wcomm),'#34d399'):'')
   +`</div>`+(tr&&C.bonus?`<p style="font-size:10px;color:#9b9cbb;margin:10px 0 0">${esc(ti('Deposit bonus in euro at the rate of the month: {0}',money(C.bonus*tr)))}</p>`:'')+`</div>`}
 else h+=`<div class="cx-empty"><b>${esc(ti('No sheet for {0}.',mn(m)))}</b></div>`;
 const ch=stChart(ms,m);
 h+=`<div class="st-grid">`+(C?`<div class="st-card" style="grid-column:1/-1"><h3>${esc(ti('Progress to the next tier'))}</h3>${stMeter(C)}</div>`:'')
  +`<div class="st-card" style="grid-column:1/-1"><h3>${esc(ti('Net total per month'))} — ${esc(ti('last 6 months'))}</h3>${ch.html}</div>`+(C?`<div class="st-card" style="grid-column:1/-1"><h3>${esc(ti('Breakdown of {0}',mn(m)))}</h3>${stBreak(C)}</div>`:'')+`</div>`;
 const tot=all.filter(Boolean).reduce((a,c)=>({n:a.n+c.n,d:a.d+c.deps,net:a.net+c.net,comm:a.comm+c.comm,b:a.b+c.bonus,w:a.w+c.wcomm}),{n:0,d:0,net:0,comm:0,b:0,w:0});
 h+=`<div class="st-card"><h3>${esc(ti('Month by month'))}</h3><div class="cx-wrap" style="margin-top:0"><table class="st-t" style="min-width:640px"><thead><tr><th>${esc(ti('Month'))}</th><th class="n">${esc(ti('Patients'))}</th><th class="n">${esc(ti('Deposits'))}</th><th class="n">${esc(ti('Net Total'))}</th><th class="n">%</th><th class="n">${esc(ti('Commission'))}</th><th class="n">${esc(ti('Deposit bonus'))}</th><th class="n">${esc(ti('Welcome commission'))}</th></tr></thead><tbody>`
  +ms.map((x,i)=>{const c=all[i];return c?`<tr class="${x===m?'on':''}"><td>${esc(mn(x))}</td><td class="n">${c.n}</td><td class="n">${c.deps}</td><td class="n">${cxE(c.net)}</td><td class="n">${c.pct}%</td><td class="n"><b>${cxE(c.comm)}</b></td><td class="n">${cxN(c.bonus)} ₺</td><td class="n">${c.A1.length?cxE(c.wcomm):'-'}</td></tr>`:`<tr><td>${esc(mn(x))}</td><td colspan="7" style="color:#9b9cbb;font-style:italic">${esc(ti('No sheet for this month.'))}</td></tr>`}).join('')
  +`</tbody><tfoot><tr><td>${esc(ti('Total'))}</td><td class="n">${tot.n}</td><td class="n">${tot.d}</td><td class="n">${cxE(tot.net)}</td><td></td><td class="n">${cxE(tot.comm)}</td><td class="n">${cxN(tot.b)} ₺</td><td class="n">${tot.w?cxE(tot.w):'-'}</td></tr></tfoot></table></div></div>`;
 $('vs').innerHTML=h;stHover(ch.D)}
