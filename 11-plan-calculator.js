/* Ömar Istanbul by Rima — Treatment Plan Calculator: plans, messages and the PDF */
/* ---------- Treatment Plan Calculator ---------- */
let TRP=null,trcMe=null,trcIds='',TRC_OPEN=new Set(),TRC_M={};
const trcKey=()=>'kc_plan_'+me;
const trcFresh=()=>({cur:'-',vis:'Two Visits',q:{},u:{},dep:null,pc:'-',s:'',o:false,pk:{},hn:{},tier:'h',ps:'r'});
const trcNorm=s=>{const pk={};Object.keys(s.pk||{}).forEach(k=>{const v=s.pk[k]||{};pk[k]={...v,sel:{...(v.sel||{})}}});return{...trcFresh(),...s,q:{...(s.q||{})},u:{...(s.u||{})},pk,hn:{...(s.hn||{})},tier:s.th&&['l','n','h'].includes(s.tier)?s.tier:'h',th:1}};
function trcLoad(){TRP=trcNorm(L(trcKey(),null)||{});trcMe=me}
const trcSave=()=>S(trcKey(),TRP);
/* ---------- prices: three price lists (Least, Normal, High), payment visits, promotion ---------- */
const trcR1=x=>Math.round(x*10)/10;
/* the visit a treatment belongs to, and the amount of every visit (used by the payment choice "By visit") */
const trcVo=(r,nv)=>trcIsF(r.t.n)?1:(nv==3&&trcV3(r.t))?3:2;
function trcVS(o,uf){const nv=trcNV(),A=[0,0,0];
 o.rows.forEach((r,i)=>{const amt=Math.round(r.q*uf(r,i));
  if(nv==1){A[0]+=amt;return}
  if(r.hot){const a=trcHA(r.t.id).slice(0,nv),s=a.reduce((x,y)=>x+y,0);
   if(s>0){let rem=amt;a.forEach((n,j)=>{const part=j==a.length-1?rem:Math.round(amt*n/s);A[j]+=part;rem-=part})}else A[nv-1]+=amt;return}
  A[trcVo(r,nv)-1]+=amt});
 return A.slice(0,nv)}
function trcSplit(total,dep,A){
 const pool=total-dep,n=trcNV(),sp=PDB.split,m=TRP.ps;
 if(!(total>0)||!(pool>0))return{dep,pool,n,v:[]};
 let v;
 if(n==1)v=[pool];
 else if(m=='v'&&A&&A.length==n){v=A.slice();v[n-1]+=total-v.reduce((x,y)=>x+y,0);let d=dep;for(let i=0;i<n&&d>0;i++){const k=Math.min(v[i],d);v[i]-=k;d-=k}v[n-1]+=pool-v.reduce((x,y)=>x+y,0)}
 else if(m=='e'){if(n==2){const a=Math.min(pool,trdRU(pool/2));v=[a,pool-a]}else{const a=Math.min(pool,trdRU(pool/3)),b=Math.min(pool-a,trdRU(pool/3));v=[a,b,pool-a-b]}}
 else if(n==2){const a=Math.min(pool,trdRU(pool*sp[2][0]/100));v=[a,pool-a]}
 else{const a=Math.min(pool,trdRU(pool*sp[3][0]/100)),b=Math.min(pool-a,trdRU(pool*sp[3][1]/100));v=[a,b,pool-a-b]}
 return{dep,pool,n,v}}
/* the promotion percentages that bring the treatments (never the hotels) down to the Normal or to the Least price list */
function trcSpec(o){const r={};if(!o.ok||!o.rows.length)return r;
 const nh=o.rows.filter(x=>!x.hot),B=nh.reduce((s,x)=>s+x.tot,0);if(!(B>0))return r;
 [['N','nR'],['L','lR']].forEach(([k,f])=>{const S=nh.reduce((s,x)=>s+Math.round(x.q*Math.min(x.eu,x[f])),0);if(S<B)r[k]={p:trcR1((B-S)/B*100)}});
 return r}
/* the promotion: a percentage (or "Normal" / "Least") taken off the treatments of the Custom Plan; hotels are never discounted */
function trcPromo(o){
 const sel=String(TRP.pc==null?'-':TRP.pc);if(!(o.ct>0))return null;
 const sp=trcSpec(o);let kind='',p=0;
 if(sel=='N'||sel=='L'){if(!sp[sel])return null;kind=sel}else{p=trdNum(sel.replace('%',''));if(!(p>0))return null}
 const f=kind=='N'?'nR':'lR',U=o.rows.map(r=>r.hot?r.eu:kind?Math.min(r.eu,r[f]):trdRU(r.eu*(1-p/100))),T=o.rows.map((r,i)=>Math.round(r.q*U[i])),price=T.reduce((a,b)=>a+b,0);
 return{p:kind?sp[kind].p:p,kind,u:U,t:T,price,save:o.ct-price,ok:price>=o.Lt,sp:trcSplit(price,o.cd,trcVS(o,(r,i)=>U[i]))}}
function trcCalc(){
 const R=trdRates(),cur=TRP.cur,ok=TRD_CUR.includes(cur),rate=ok?R[cur]:0,sym=ok?TRD_SYM[cur]:'',rows=[],pk=trcPkX(),tier=TRP.tier=='l'||TRP.tier=='h'?TRP.tier:'n';
 trdAll().forEach(({c,t})=>{const q=(trdNum(TRP.q[t.id])||0)+(pk.q[t.id]||0);if(!(q>0)||!trdOK(c,t))return;const p=trdP(c,t),u=trdNum(TRP.u[t.id]),bp=tier=='l'?p.l:tier=='h'?p.h:p.x,eu=u!=null&&u>=0?u:trdRU(bp*rate);
  rows.push({c,t,q,hot:c.kind=='h',lp:p.l,np:p.x,hp:p.h,lu:p.l*rate,nu:p.x*rate,hu:p.h*rate,lR:trdRU(p.l*rate),nR:trdRU(p.x*rate),hR:trdRU(p.h*rate),eu,tot:Math.round(q*eu)})});
 const o={rows,ok,cur,sym,rate,pk,tier};
 if(!ok||!rows.length)return o;
 /* the total of each price list is rounded up as a whole (as in the Excel workbook); the Custom Plan rounds every unit price */
 const U=(k,nh)=>rows.reduce((s,r)=>s+(nh&&r.hot?0:r.q*r[k]),0),S=(k,nh)=>trdRU(U(k,nh)*rate);
 o.Lt=S('lp');o.Nt=S('np');o.Ht=S('hp');
 o.Ls=trcSplit(o.Lt,PDB.deposit,trcVS(o,r=>r.lR));o.Ns=trcSplit(o.Nt,PDB.deposit,trcVS(o,r=>r.nR));o.Hs=trcSplit(o.Ht,PDB.deposit,trcVS(o,r=>r.hR));
 /* from the High price to the Normal / Least price: the amount and the percentage to take off the treatments (hotels excluded) */
 o.hH=S('hp',1);o.dHN=o.hH-S('np',1);o.pHN=U('hp',1)>0?trcR1((U('hp',1)-U('np',1))/U('hp',1)*100):null;o.dHL=o.hH-S('lp',1);o.pHL=U('hp',1)>0?trcR1((U('hp',1)-U('lp',1))/U('hp',1)*100):null;
 o.ct=rows.reduce((s,r)=>s+r.tot,0);const dp=trdNum(TRP.dep);o.cd=dp!=null&&dp>=0?dp:PDB.deposit;o.Cs=trcSplit(o.ct,o.cd,trcVS(o,r=>r.eu));
 o.dCL=o.ct-o.Lt;o.pCL=o.ct?trdRD(o.dCL/o.ct*100):null;o.dCN=o.ct-o.Nt;o.pCN=o.ct?trdRD(o.dCN/o.ct*100):null;o.dCH=o.ct-o.Ht;o.pCH=o.ct?trdRD(o.dCH/o.ct*100):null;
 o.pc=trcPromo(o);
 return o}
/* template engine: a line holding only a {TOKEN} expands to its lines (and disappears when empty) */
function trcTpl(tpl,tok){
 const R=String(tpl||'').split('\n').map(line=>{const m=/^\s*\{([A-Z_]+)\}\s*$/.exec(line);
  if(m&&m[1] in tok){const v=tok[m[1]];return v==null?{o:[],nl:1}:{o:Array.isArray(v)?v:String(v)==''?[]:String(v).split('\n')}}
  let nl=0;const t=line.replace(/\{([A-Z_]+)\}/g,(a,k)=>{if(!(k in tok))return a;const v=tok[k];if(v==null){nl=1;return a}return Array.isArray(v)?v.join('\n'):v});
  return nl?{o:[],nl:1}:{o:[t],plain:!/\{[A-Z_]+\}/.test(line)}});
 R.forEach((r,i)=>{if(r.plain&&R[i+1]&&R[i+1].nl)r.o=[]});
 const out=[];R.forEach(r=>out.push(...r.o));
 return out.join('\n').trim()}
/* ---------- package builders (All-on-4, All-on-6, Zygomatic) ---------- */
const trcNV=()=>TRP.vis=='One Visit'?1:TRP.vis=='Three Visits'?3:2;
const trdByRole=p=>trdAll().filter(({c,t})=>t.p==p&&trdOK(c,t));
/* the crowns offered under All-on-6 and Zygomatic: Vita and Straumann only */
const trcAoCrOK=t=>/vita|straumann/i.test(t.n),trcAoCr=()=>trdByRole('cr').filter(({t})=>trcAoCrOK(t));
const trcPkS=k=>{TRP.pk=TRP.pk||{};return TRP.pk[k]||(TRP.pk[k]={on:false,jaws:1,imp:'',sel:{},zt:'',zn:2,in:6})};
const trcPkR=()=>Object.assign({},TRD_PKD,PDB.pk||{});
function trcSelQ(s,t,jw){const R=trcPkR(),m=trdNum((s.sel||{})[t.id]);if(m!=null&&m>=0)return m;return t.p=='bs'?R.bs:t.p=='cr'?R.cr*jw:jw}
/* what the ticked packages add to the plan: priced quantities, free included lines, explanation blocks and warnings */
function trcPkX(){
 const R=trcPkR(),q={},inc=[],info=[],warn=[],add=(id,n)=>{if(n>0)q[id]=(q[id]||0)+n};let ni=0,nm=0,on=false,mu1=false;
 TRD_PK.forEach(P=>{const s=TRP.pk&&TRP.pk[P.k];if(!s||!s.on)return;on=true;
  const jw=P.j&&s.jaws==2?2:1,ok=P.c?['bs','pro','tmp','cr']:['bs','pro','tmp'],w=m=>warn.push({k:P.k,m:ti(m)});let pi=0;
  if(P.z){const z=trdFind(s.zt),zn=s.zn==4?4:2,k=trdZin(s.in),i=trdFind(s.imp);
   if(z&&z.t.p=='zyg'&&trdOK(z.c,z.t))add(z.t.id,zn);else w('Choose a zygomatic implant type.');
   if(i&&i.t.p=='imp'&&trdOK(i.c,i.t))add(i.t.id,k);else if(k>0)w('Choose an implant type.');pi=zn+k;ni+=pi}
  else{const n=(P.k=='a4'?R.i4:R.i6)*jw,i=trdFind(s.imp);
   if(i&&i.t.p=='imp'&&trdOK(i.c,i.t))add(i.t.id,n);else w('Choose an implant type.');pi=n;ni+=n}
  let cr=0,pro=false,fx=false;
  Object.keys(s.sel||{}).forEach(id=>{const f=trdFind(id);if(!f||!trdOK(f.c,f.t)||!ok.includes(f.t.p)||(f.t.p=='cr'&&!trcAoCrOK(f.t)))return;const n=trcSelQ(s,f.t,jw);add(id,n);if(f.t.p=='cr')cr+=n;if(f.t.p=='pro'&&n>0)pro=true;if(f.t.p=='tmp'&&n>0&&/fixed/i.test(f.t.n))fx=true});
  /* the multiunit abutments are only used with a Hybrid or a Toronto prosthesis: without one they are not listed */
  if(pro){nm+=pi;if(fx)mu1=true}
  if(P.c&&cr>0&&cr!=R.cr*jw)warn.push({k:P.k,m:ti('Crowns: {0} selected, {1} expected for the jaws chosen.',cr,R.cr*jw)});
  if(P.e)info.push(P.e)});
 if(on){const ex=trdAll().find(({t})=>t.n=='Tooth Extraction');
  inc.push({k:'ext',v:1,q:0,nm:ti('Full extraction'),e:ex?(ex.t.e||[]):['extraction']});
  if(nm>0)inc.push({k:'mu',v:mu1?1:2,q:nm,nm:ti('Multiunit abutment'),e:['multiunit']})}
 return{q,inc,info,warn,on,ni,nm,mu1}}
function trcPkH(){
 const R=trcPkR(),X=trcPkX(),lab='text-[10px] text-slate-500 font-bold uppercase',
  rd=(g,v,cur,l,fn,nt)=>`<label class="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"><input type="radio" name="${g}" ${v==cur?'checked':''} onchange="${fn}" class="accent-slate-800"><span${nt?' data-notr':''}>${l}</span></label>`,
  sub=(t,b)=>b?`<div class="space-y-1"><div class="${lab}">${t}</div><div class="flex flex-wrap gap-x-4 gap-y-1.5 items-center">${b}</div></div>`:'',
  sel=(P,f,role,cur)=>`<select onchange="trcPkV('${P.k}','${f}',this.value)" class="block border rounded p-1.5 text-xs font-bold text-slate-900 bg-white max-w-full"><option value="">Choose implant type…</option>${trdByRole(role).map(({t})=>`<option value="${t.id}" data-notr${t.id==cur?' selected':''}>${esc(trdTn(t))}</option>`).join('')}</select>`,
  chk=(P,s,t,jw)=>{const on=Object.prototype.hasOwnProperty.call(s.sel,t.id),m=trdNum(s.sel[t.id]);
   return `<label class="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer"><input type="checkbox" ${on?'checked':''} onchange="trcPkSel('${P.k}','${t.id}',this.checked)" class="w-4 h-4 accent-slate-800"><span data-notr>${esc(trdTn(t))}</span>${on?`<input type="number" min="0" step="1" value="${m!=null&&m>=0?m:trcSelQ(s,t,jw)}" title="Quantity" onclick="event.stopPropagation()" onchange="trcPkQ('${P.k}','${t.id}',this.value)" class="w-14 border rounded p-1 text-xs font-bold text-center bg-white">`:''}</label>`},
  grp=(P,s,jw,t,role)=>sub(t,(role=='cr'?trcAoCr():trdByRole(role)).map(({t})=>chk(P,s,t,jw)).join('')),
  card=P=>{const s=trcPkS(P.k),jw=P.j&&s.jaws==2?2:1,per=P.k=='a4'?R.i4:R.i6,w=X.warn.filter(x=>x.k==P.k);
   let h='';
   if(s.on){
    if(P.j)h+=sub('Jaws',rd('pkj_'+P.k,1,jw,'One jaw',`trcPkV('${P.k}','jaws',1)`)+rd('pkj_'+P.k,2,jw,'Upper and lower jaw',`trcPkV('${P.k}','jaws',2)`));
    if(P.z){
     h+=sub('Zygomatic implant type',trdByRole('zyg').map(({t})=>rd('pkz_'+P.k,t.id,s.zt,esc(trdTn(t)),`trcPkV('${P.k}','zt','${t.id}')`,1)).join(''));
     h+=sub('Number of zygomatic implants',[2,4].map(n=>rd('pkn_'+P.k,n,s.zn==4?4:2,n,`trcPkV('${P.k}','zn',${n})`,1)).join(''));
     h+=sub('Implant type',sel(P,'imp','imp',s.imp));
     h+=sub('Number of implants',TRD_ZI.map(n=>rd('pki_'+P.k,n,trdZin(s.in),n,`trcPkV('${P.k}','in',${n})`,1)).join(''))}
    else h+=sub('Implant type',sel(P,'imp','imp',s.imp)+`<span class="text-[10px] font-bold text-slate-500">${esc(ti('Implants: {0}',per*jw))}</span>`);
    h+=grp(P,s,jw,'Bone graft & sinus lift','bs')+grp(P,s,jw,'Hybrid / Toronto','pro');
    if(P.c)h+=grp(P,s,jw,'Crowns','cr');
    h+=grp(P,s,jw,'Dentures','tmp');
    h+=`<div class="text-[10px] font-bold text-amber-700 space-y-0.5" data-notr id="pkw_${P.k}">${w.map(x=>`<p>${esc(x.m)}</p>`).join('')}</div>`}
   else h=`<p class="text-[10px] text-slate-500">${esc(P.z?ti('Zygomatic implants with regular implants.'):ti('Implants per jaw: {0}',per))}</p>`;
   return `<div class="rounded-lg border ${s.on?'border-[#a08a7c] bg-amber-50':'border-slate-200 bg-slate-50'} p-3 space-y-2.5 min-w-0"><label class="flex items-center gap-2 font-bold text-sm cursor-pointer"><input type="checkbox" ${s.on?'checked':''} onchange="trcPkOn('${P.k}',this.checked)" class="w-4 h-4 accent-slate-800"><span>${P.n}</span></label>${h}</div>`};
 return `<div class="px-3 py-2 bg-slate-900 flex flex-wrap justify-between items-center gap-2"><b class="lux text-[#a08a7c] text-xs uppercase tracking-wider">Packages</b><span class="text-[10px] font-bold uppercase text-slate-300">All-on-4 · All-on-6 · Zygomatic</span></div><div class="p-3 grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">${TRD_PK.map(card).join('')}</div>`
  +(X.on?`<p class="px-3 pb-3 text-[10px] font-bold text-emerald-700">${esc(!(X.nm>0)?ti('Included at no charge and listed in the Treatment Explanation: full extraction (first visit).'):X.mu1?ti('Included at no charge and listed in the Treatment Explanation: full extraction and {0} multiunit abutments (first visit, because a Fixed Temporary is chosen).',X.nm):ti('Included at no charge and listed in the Treatment Explanation: full extraction (first visit) and {0} multiunit abutments (second visit).',X.nm))}</p>`:'')}
function trcPkUp(full){trcSave();if(full)$('trcpk').innerHTML=trcPkH();else{const X=trcPkX();TRD_PK.forEach(P=>{const e=$('pkw_'+P.k);if(e)e.innerHTML=X.warn.filter(x=>x.k==P.k).map(x=>`<p>${esc(x.m)}</p>`).join('')})}trcList();trcCu(true);trcOut()}
function trcPkOn(k,b){const s=trcPkS(k);s.on=!!b;trcPkUp(true)}
function trcPkV(k,f,v){const s=trcPkS(k);s[f]=(f=='jaws'||f=='zn'||f=='in')?+v:v;trcPkUp(true)}
function trcPkSel(k,id,b){const s=trcPkS(k);if(b)s.sel[id]=null;else delete s.sel[id];trcPkUp(true)}
function trcPkQ(k,id,v){const s=trcPkS(k),n=trdNum(v);s.sel[id]=n!=null&&n>=0?Math.round(n):null;trcPkUp(false)}

/* hotel nights per visit: 3 nights in the first visit, the rest in the following visits (the consultant can still type her own numbers) */
const trcCaps=(T,nv)=>{T=Math.max(0,Math.round(T));if(nv==1)return[T];const a=Math.min(3,T),r=T-a;if(nv==2)return[a,r];const b=Math.ceil(r/2);return[a,b,r-b]};
const trcHots=()=>trdAll().filter(({c,t})=>c.kind=='h'&&trdOK(c,t)).map(({t})=>({id:t.id,n:Math.max(0,Math.round(trdNum(TRP.q[t.id])||0))})).filter(x=>x.n>0);
function trcAlloc(){const nv=trcNV(),H=trcHots(),res={};if(!H.length)return res;
 const man={},auto=[];
 H.forEach(h=>{const m=TRP.hn&&TRP.hn[h.id];if(Array.isArray(m)&&m.length==nv)man[h.id]=m.map(x=>Math.max(0,Math.round(+x||0)));else auto.push(h)});
 const cap=trcCaps(H.reduce((s,h)=>s+h.n,0),nv);
 Object.keys(man).forEach(id=>{res[id]=man[id];man[id].forEach((n,i)=>{cap[i]=Math.max(0,cap[i]-n)})});
 auto.forEach(h=>{let left=h.n;const a=Array(nv).fill(0);for(let i=0;i<nv&&left>0;i++){const k=Math.min(cap[i],left);a[i]=k;cap[i]-=k;left-=k}if(left>0)a[nv-1]+=left;res[h.id]=a});
 return res}
function trcHA(id){const a=trcAlloc()[id];return a?a.slice():Array(trcNV()).fill(0)}
function trcNights(o){const h=o.rows.filter(r=>r.c.kind=='h');if(!h.length)return null;const v=Array(trcNV()).fill(0);h.forEach(r=>trcHA(r.t.id).forEach((n,i)=>{v[i]+=n}));return v.some(n=>n>0)?v:null}
/* stay length per visit: the hotel nights when a hotel is chosen, otherwise 3 nights for the first visit and the rest of a week for the next visits */
const trcStayV=o=>trcNights(o)||trcCaps(7,trcNV());
const trcPl=(n,l,k)=>{
 const F={en:[['night','nights'],['day','days']],fr:[['nuit','nuits'],['jour','jours']],es:[['noche','noches'],['día','días']],de:[['Nacht','Nächte'],['Tag','Tage']],tr:[['gece','gece'],['gün','gün']],it:[['notte','notti'],['giorno','giorni']],pt:[['noite','noites'],['dia','dias']]};
 if(l=='ro'){const w=k?['zi','zile']:['noapte','nopți'],b=n%100;return n+' '+(n==1?w[0]:(n==0||(b>=2&&b<=19)?w[1]:'de '+w[1]))}
 if(F[l]){const w=F[l][k];return n+' '+(n==1||(l=='fr'&&n==0)?w[0]:w[1])}
 if(l=='ru'){const w=k?['день','дня','дней']:['ночь','ночи','ночей'],a=n%10,b=n%100;return n+' '+(a==1&&b!=11?w[0]:a>=2&&a<=4&&(b<12||b>14)?w[1]:w[2])}
 if(l=='ar'){const a=k?['يوم واحد','يومان','أيام','يومًا']:['ليلة واحدة','ليلتان','ليالٍ','ليلة'];return n==1?a[0]:n==2?a[1]:n>=3&&n<=10?n+' '+a[2]:n+' '+a[3]}
 return n+' '+(k?'days':'nights')};
const trcND=(n,l)=>{n=Math.max(0,Math.round(n));return trcPl(n,l,0)+' / '+trcPl(n+1,l,1)};
function trcHW(id){const n=Math.max(0,Math.round(trdNum(TRP.q[id])||0)),sum=trcHA(id).reduce((x,y)=>x+y,0);return sum!=n?ti('The nights per visit add up to {0}, but {1} nights are selected.',sum,n):''}
function trcHRi(id){const nv=trcNV(),a=trcHA(id);
 return `<div class="flex flex-wrap items-center gap-2 text-[10px] font-bold text-sky-900" style="position:sticky;left:0;max-width:min(100%,calc(100vw - 4.5rem))"><span class="uppercase">Nights per visit</span>${a.map((v,i)=>`<label class="inline-flex items-center gap-1"><span>${esc(ti(['First Visit','Second Visit','Third Visit'][i]))}</span><input type="number" min="0" step="1" value="${v}" onchange="trcHn('${id}',${i},this.value)" class="w-14 border rounded p-1 text-xs font-bold text-center bg-white"></label>`).join('')}<span data-w class="text-amber-700" data-notr>${esc(trcHW(id))}</span></div>`}
function trcHRow(t){const show=trcNV()>1&&Math.round(trdNum(TRP.q[t.id])||0)>0;return `<tr id="trh_${t.id}" class="${show?'':'hidden'}"><td colspan="5" class="whitespace-normal bg-sky-50">${show?trcHRi(t.id):''}</td></tr>`}
function trcHRr(id){const tr=$('trh_'+id);if(!tr)return;const show=trcNV()>1&&Math.round(trdNum(TRP.q[id])||0)>0,c=tr.firstElementChild;tr.classList.toggle('hidden',!show);
 if(!show){c.innerHTML='';return}
 const ins=c.querySelectorAll('input'),a=trcHA(id);
 if(ins.length==a.length){ins.forEach((x,i)=>{if(document.activeElement!==x)x.value=a[i]});const w=c.querySelector('[data-w]');if(w)w.textContent=trcHW(id)}else c.innerHTML=trcHRi(id)}
function trcHRa(){document.querySelectorAll('tr[id^="trh_"]').forEach(tr=>trcHRr(tr.id.slice(4)))}
function trcHQ(id){if(TRP.hn&&TRP.hn[id]){delete TRP.hn[id];trcSave()}trcHRa()}
function trcHn(id,i,v){const a=trcHA(id);a[i]=Math.max(0,Math.round(trdNum(v)||0));TRP.hn=TRP.hn||{};TRP.hn[id]=a;trcSave();trcHRa();trcOut()}

/* helpers for the visit a treatment belongs to */
const trcIsF=n=>PDB.kw.map(k=>k.toLowerCase()).filter(Boolean).some(k=>String(n).toLowerCase().includes(k));
const trcV3=t=>t.p=='cr'||t.p=='pro'||(!trcIsF(t.n)&&/crown|veneer|bridge|hybrid|prosthesis|bonding|onlay/i.test(t.n));
/* number of selected treatments of a category (shown while the category is closed) */
const trcSelT=(c,pq)=>{const n=c.items.filter(t=>trdOK(c,t)&&(trdNum(TRP.q[t.id])||0)+(pq[t.id]||0)>0).length;return n?ti('{0} selected',n):''};
function trcSelB(c){const e=$('trsel_'+c.id);if(e)e.textContent=trcSelT(c,trcPkX().q)}

/* "About your treatments": one block per distinct explanation, told in the order of the treatment story */
const trcBR=k=>TRD_BR[k]||'x';
function trcInfoB(o){const l=trdLg(),seen=new Set(),blocks=[],miss=[],pk=o.pk||{};
 const take=ks=>{let any=false;(ks||[]).forEach(k=>{if(trdIDead(k))return;const b=trdIB(k,l);if(!(b.t||b.x))return;any=true;if(seen.has(k))return;seen.add(k);blocks.push({k,t:b.t,x:b.x})});return any};
 (pk.info||[]).forEach(k=>take([k]));
 o.rows.forEach(r=>{if(!take(r.t.e))miss.push(r.t)});
 (pk.inc||[]).forEach(x=>take(x.e));
 const ix=b=>{const i=TRD_RORD.indexOf(trcBR(b.k));return i<0?TRD_RORD.indexOf('x'):i};
 return{blocks:blocks.map((b,i)=>[b,i]).sort((a,b)=>ix(a[0])-ix(b[0])||a[1]-b[1]).map(a=>a[0]),miss}}
/* paragraphs, linked with a short connecting sentence chosen by the role of each treatment in the plan */
function trcInfoM(blocks,RM,l){
 const A=[],imp=blocks.some(b=>['impl','pkg'].includes(trcBR(b.k)));let prev=null;
 blocks.forEach((x,i)=>{const r=trcBR(x.k);let lead='';
  if(i>0){const a=TRD_LEAD[r==prev?'same':(imp&&TRD_LEAD[r+'_i']?r+'_i':r)];lead=a?(a[trdLn(l)]||a[0]||''):''}
  prev=r;if(i)A.push('');
  A.push(RM+trdIc(x.k)+' '+x.t);
  const body=String(x.x).split('\n').map(z=>z.trim()).filter(Boolean);
  if(body.length)body[0]=(lead?lead+' ':'')+body[0];else if(lead)body.push(lead);
  body.forEach(z=>A.push(RM+z))});
 return A}
/* available appointments: taken from the saved sheet marked "Use in plans" in Appointment Planning */
const TRC_GEN_RU=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
function trcAvail(l){const e=typeof plActive=='function'?plActive():null;if(!e||!(e.slots||[]).length)return{DATES:null,UNTIL:null};
 const RM=l=='ar'?'‏':'',T=PLT[l]||PLT.en,SL=plSort(e.slots),g={};
 SL.forEach(x=>{const k=x.year+'-'+x.month;(g[k]=g[k]||[]).push(x)});
 /* "fully booked until": the month after the last available date (December -> January of the next year) */
 const z=SL[SL.length-1],nx=new Date(+z.year,+z.month,1),ny=nx.getFullYear(),nm=nx.getMonth()+1,
  mo=(m,y)=>plMon(m,l)+' '+y,lo=plMon(nm,l).toLowerCase(),
  until=l=='ru'?TRC_GEN_RU[nm-1]+' '+ny+' года':l=='es'?lo+' de '+ny:l=='fr'||l=='it'||l=='ro'?lo+' '+ny:l=='pt'?lo+' de '+ny:mo(nm,ny),D=[''];
 /* the layout asked for by the clinic: the month, its dates directly below it as a sub-list (indented, no star), one blank line between months and before the next part */
 Object.keys(g).forEach((k,i)=>{const[y,m]=k.split('-');if(i)D.push('');D.push(RM+mo(m,y));g[k].forEach(x=>D.push(RM+'    '+plWd(x.year,x.month,x.day,l)+' '+plOrd(x.day,l)+' '+T.at+' '+x.time))});
 D.push('');
 return{DATES:D,UNTIL:until}}
function trcAvNote(){const e=typeof plActive=='function'?plActive():null;
 return e?`<div class="px-3 pt-2 text-[10px] font-semibold text-emerald-700"><span>Appointment dates from the saved sheet:</span> <span data-notr>${esc(plMonthsTxt(e.keys))}</span></div>`
 :`<div class="px-3 pt-2 text-[10px] font-semibold text-amber-700">Choose the appointment dates: open Appointment Planning and press “Use in plans” on a saved sheet. Until then the dates are left out of this message.</div>`}
function trcMsgs(o){
 const l=trdLg(),RM=l=='ar'?'‏':'',lb=String(trdTx('lb',l)).split('\n').map(s=>s.trim()),Lb=[lb[0]||'Deposit',lb[1]||'First Visit',lb[2]||'Second Visit',lb[3]||'Third Visit',lb[4]||'On Arrival'],
  kw=PDB.kw.map(k=>k.toLowerCase()).filter(Boolean),isF=n=>kw.some(k=>n.toLowerCase().includes(k)),rows=o.rows,M={},nm=x=>trdTn(x.t,l),
  planL=(dep,sp,f)=>{const a=['• '+Lb[0]+': '+f(dep)];if(sp.n==1){if(sp.v.length)a.push('• '+Lb[4]+': '+f(sp.v[0]))}else sp.v.forEach((x,i)=>a.push('• '+Lb[i+1]+': '+f(x)));return a};
 if(rows.length){const b=x=>RM+'• '+x.q+' × '+nm(x),nv=trcNV(),St=trcStayV(o),Nn=i=>trcND(St[i]!=null?St[i]:0,l),
   v3=x=>trcV3(x.t),
   vo=x=>isF(x.t.n)?1:(nv==3&&v3(x))?3:2,inc=(o.pk&&o.pk.inc)||[],il=x=>RM+'• '+(x.q>0?x.q+' × ':'')+x.nm,
   i1=inc.filter(x=>x.v==1).map(il),i2=inc.filter(x=>x.v==2).map(il),
   hr=rows.filter(x=>x.c.kind=='h'),nh=rows.filter(x=>x.c.kind!='h'),hv=i=>hr.map(x=>[x,trcHA(x.t.id)[i]||0]).filter(a=>a[1]>0).map(a=>RM+'• '+a[1]+' × '+nm(a[0])),
   F=[...i1,...nh.filter(x=>vo(x)==1).map(b),...hv(0)],S=[...i2,...nh.filter(x=>vo(x)==2).map(b),...(nv>1?hv(1):[])],T=[...nh.filter(x=>vo(x)==3).map(b),...(nv>2?hv(2):[])],A=rows.map(b);
  let at=-1;rows.forEach((x,i)=>{if(isF(x.t.n))at=i});A.splice(at+1,0,...i2);A.unshift(...i1);
  M.exp=trcTpl(trdTx(nv==1?'expOne':'expMulti',l),{LIST:A,FIRST:F,SECOND:S,THIRDV:nv==3?[ti('Third Visit (after 3–6 months, {0})',Nn(2)),...T]:[],NIGHTSA:Nn(0),NIGHTSB:nv>1?Nn(1):'',NIGHTSC:nv>2?Nn(2):''});
  const I=trcInfoB(o);if(I.blocks.length)M.info=trcTpl(trdTx('info',l),{INFO:trcInfoM(I.blocks,RM,l)})}
 if(o.ok&&rows.length&&o.ct>0){
  const f=n=>trdFm(o.sym,n),pu=o.pc&&o.pc.ok?o.pc:null,
   ln=(x,u,t)=>RM+nm(x)+' : '+x.q+' × '+f(u)+' = '+f(t),
   tk={LINES:rows.map(x=>ln(x,x.eu,x.tot)),TOTAL:f(o.ct),PLAN:planL(o.cd,o.Cs,f),DEPOSIT:trdN0(o.cd),CUR:o.sym.trim()};
  M.normal=trcTpl(trdTx('normal',l),tk);
  /* the Individual Price Promoted Plan lists the individual prices after the promotion (hotels are never discounted) */
  const mk=pu?{LINES:rows.map((x,i)=>ln(x,pu.u[i],pu.t[i])),TOTAL:f(pu.price),PLAN:planL(o.cd,pu.sp,f)}:{};
  M.manual=trcTpl(trdTx('manual',l),{...tk,...mk,...trcAvail(l)});
  if(o.pc)M.promo=trcTpl(trdTx('promo',l),{PCT:o.pc.p+'%',STANDARD:f(o.ct),SAVING:o.pc.ok?f(o.pc.save):ti('Discount is not acceptable'),DETAILS:rows.map(x=>RM+'• '+x.q+' - '+nm(x)),PROMO:f(o.pc.price),TERMS:planL(o.cd,o.pc.sp,f),DEPOSIT:tk.DEPOSIT,CUR:tk.CUR,...trcAvail(l)})}
 return M}

/* controls + scaffolding */
function rTRC(){
 if(trcMe!==me||!TRP)trcLoad();
 TRC_OPEN.clear();
 const sel=(id,fn,opts,v)=>`<select id="${id}" onchange="${fn}" class="block border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white">${opts.map(o=>`<option value="${o[0]}"${o[0]==v?' selected':''}>${o[1]}</option>`).join('')}</select>`,
  lab='block text-[10px] text-slate-500 font-bold uppercase',
  popt=(l,v)=>{const a=[...new Set(l.map(Number).filter(x=>x>0))].sort((x,y)=>x-y).map(x=>x+'%');if(v&&v!='-'&&!a.includes(v))a.push(v);return['-',...a].map(x=>`<option value="${x}"${x==v?' selected':''}>${x}</option>`).join('')};
 $('trcbar').innerHTML=`<div><label class="${lab}">Currency${sel('trcc',"trcSet('cur',this.value)",[['-','-'],...TRD_CUR.map(c=>[c,c])],TRP.cur)}</label></div>`
  +`<div><label class="${lab}">Visits${sel('trcv',"trcSet('vis',this.value)",[['One Visit','One Visit'],['Two Visits','Two Visits'],['Three Visits','Three Visits']],TRP.vis)}</label></div>`
  +`<div class="grow min-w-[10rem]"><label class="${lab}">Search<input id="trcs" value="${esc(TRP.s)}" placeholder="Search treatments…" oninput="trcSrch(this.value)" class="block w-full border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white"></label></div>`
  +`<div class="pb-2"><label class="inline-flex items-center gap-2 text-xs font-bold text-slate-700 normal-case cursor-pointer"><input type="checkbox" id="trco" ${TRP.o?'checked':''} onchange="trcOnly(this.checked)" class="w-4 h-4 accent-slate-800"><span>Show selected only</span></label></div>`
  +`<div><button type="button" onclick="trcReset(this)" class="bg-slate-700 text-white rounded px-3 py-1.5 font-bold uppercase">Reset</button></div>`
  +`<div><button type="button" onclick="trcPdfAsk()" class="bg-slate-800 text-white rounded px-3 py-1.5 font-bold uppercase">⬇ Download PDF</button></div>`+(window.EP?EP.btns('plan'):'');
 $('trccu').innerHTML=`<div class="px-3 py-2 bg-slate-900 flex flex-wrap justify-between items-center gap-2"><div class="flex flex-wrap items-baseline gap-2"><b class="lux text-[#a08a7c] text-xs uppercase tracking-wider">Custom Plan — Your Prices</b><span id="trccP" class="text-[10px] font-semibold text-slate-300" data-notr></span></div><span id="trccT" class="text-sm font-bold text-[#a08a7c]" data-notr></span></div>`
  +`<div class="p-2 overflow-x-auto"><table><thead><tr>${['Qty','Treatment','Unit Price','Total','Least Unit','Normal Unit','High Unit'].map(h=>`<th class="whitespace-normal" style="padding:4px 5px">${h}</th>`).join('')}</tr></thead><tbody id="trccb"></tbody></table></div>`
  +`<div class="px-3 pb-2 flex flex-wrap gap-3 items-end text-xs"><label class="${lab}">Your deposit<input id="trcd" type="number" min="0" step="any" value="${TRP.dep==null?'':esc(TRP.dep)}" placeholder="${PDB.deposit}" oninput="trcDep(this.value)" class="block w-28 border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white"></label><label class="${lab}">Promotion %<select id="trcps" onchange="trcSet('pc',this.value)" class="block border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white"></select></label><label class="${lab}">Payment visits<select id="trcpv" onchange="trcSet('ps',this.value)" class="block border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white"></select></label></div><p class="px-3 pb-2 text-[10px] text-slate-500">The percentage covers the treatments only, not the hotel. The prices and the total below include the hotel, so the saving on the total is a little less than the percentage.</p><div id="trccr" class="px-3 pb-3"></div>`;
 $('trcpk').innerHTML=trcPkH();
 {const pc=$('trcard');if(pc)pc.innerHTML=window.PCS?PCS.attHTML():''}   /* version 4.1: the card attached from Plan Card Studio, above the messages */
 trcList();trcCu(true);trcOut()}
function trcSet(k,v){if(k=='cur'&&TRD_CUR.includes(TRP.cur)&&v!=TRP.cur){TRP.u={};TRP.dep=null;const d=$('trcd');if(d)d.value=''}TRP[k]=v;trcSave();if(k=='cur')trcCu(true);if(k=='vis'){trcSave();trcList()}trcOut()}
function trcDep(v){TRP.dep=v;trcSave();trcOut()}
function trcSrch(v){TRP.s=v;trcSave();trcList()}
function trcOnly(b){TRP.o=!!b;trcSave();trcList()}
function trcTg(el){if((TRP.s||'').trim()||TRP.o)return;const id=el.dataset.cat;if(el.open){TRC_OPEN.clear();TRC_OPEN.add(id);document.querySelectorAll('#trcl details[data-cat]').forEach(d=>{if(d!==el&&d.open)d.open=false})}else TRC_OPEN.delete(id)}
function trcReset(b){if(!b.dataset.a){b.dataset.a=1;b.textContent='Sure? Click again';setTimeout(()=>{b.dataset.a='';b.textContent='Reset'},3000);return}
 TRP=trcFresh();trcSave();rTRC()}
function trcRowH(c,t,pq){const p=trdP(c,t),q=TRP.q[t.id]==null?'':TRP.q[t.id],n=(trdNum(q)||0)+(pq||0);
 return `<tr data-id="${t.id}"><td class="whitespace-normal" data-notr>${esc(trdTn(t))}<span class="block text-[9px] text-slate-400 font-semibold">$${trdN2(p.l)} / $${trdN2(p.x)} / $${trdN2(p.h)}</span><span id="trb_${t.id}" class="block text-[9px] text-emerald-700 font-bold">${pq?esc(ti('+{0} from the packages',pq)):''}</span></td><td><input type="number" min="0" step="1" value="${esc(q)}" data-id="${t.id}" oninput="trcQ(this)" class="w-16 border rounded p-1 text-xs font-bold text-center"></td><td id="trl_${t.id}" class="text-emerald-700" data-notr>${n>0?'$'+trdN2(n*p.l):''}</td><td id="trn_${t.id}" class="text-indigo-700" data-notr>${n>0?'$'+trdN2(n*p.x):''}</td><td id="trk_${t.id}" class="text-rose-700" data-notr>${n>0?'$'+trdN2(n*p.h):''}</td></tr>`+(c.kind=='h'?trcHRow(t):'')}
function trcList(){
 const q=(TRP.s||'').trim().toLowerCase(),only=!!TRP.o,pq=trcPkX().q,eq=id=>(trdNum(TRP.q[id])||0)+(pq[id]||0);let h='';
 PDB.cats.forEach(c=>{
  const cs=(c.name+' '+Object.values(c.tn||{}).join(' ')).toLowerCase(),its=c.items.filter(t=>trdOK(c,t)&&(!q||trdSn(t).includes(q)||cs.includes(q))&&(!only||eq(t.id)>0));
  if(!its.length)return;
  const open=q||only||TRC_OPEN.has(c.id);
  h+=`<details data-cat="${c.id}" ${open?'open':''} ontoggle="trcTg(this)" class="border-b border-slate-200"><summary class="cursor-pointer select-none px-3 py-2 bg-slate-900 text-[#a08a7c] text-xs font-bold uppercase tracking-wider flex justify-between gap-2"><span data-notr>${esc(trdCn(c))}</span><span class="flex items-center gap-2"><span id="trsel_${c.id}" class="text-[10px] text-emerald-300 normal-case" data-notr>${esc(trcSelT(c,pq))}</span><span class="text-[10px] text-slate-400" data-notr>${its.length}</span></span></summary>${c.d?`<p class="px-3 py-1 text-[10px] text-slate-500 bg-slate-50" data-notr>${esc(c.d)}</p>`:''}<table><thead><tr><th>Treatment</th><th>Qty</th><th>Least Price</th><th>Normal Price</th><th>High Price</th></tr></thead><tbody>${its.map(t=>trcRowH(c,t,pq[t.id])).join('')}</tbody></table></details>`});
 $('trcl').innerHTML=h||`<p class="p-4 text-xs text-slate-500 italic">No treatments found.</p>`}
function trcQ(el){const id=el.dataset.id,f=trdFind(id);if(trdNum(el.value)>0)TRP.q[id]=el.value;else delete TRP.q[id];trcSave();
 if(f){const p=trdP(f.c,f.t),n=(trdNum(TRP.q[id])||0)+(trcPkX().q[id]||0),a=$('trl_'+id),b=$('trn_'+id),k=$('trk_'+id);if(a)a.textContent=n>0?'$'+trdN2(n*p.l):'';if(b)b.textContent=n>0?'$'+trdN2(n*p.x):'';if(k)k.textContent=n>0?'$'+trdN2(n*p.h):'';if(f.c.kind=='h')trcHQ(id);trcSelB(f.c)}
 trcCu();trcOut()}
function trcCuRow(r,f){const id=r.t.id,ps='style="padding:4px 5px"';
 return `<tr data-id="${id}"><td ${ps} id="tcq_${id}" class="text-center" data-notr>${r.q}</td><td ${ps} class="whitespace-normal" data-notr>${esc(trdTn(r.t))}</td><td ${ps}><input type="number" min="0" step="any" value="${r.eu}" data-id="${id}" oninput="trcU(this)" class="w-20 border rounded p-1 text-xs font-bold ${r.tot<Math.round(r.q*r.lR)?'text-red-600':''}"></td><td ${ps} id="tct_${id}" class="font-bold" data-notr>${f(r.tot)}</td><td ${ps} class="text-slate-500" data-notr>${f(r.lR)}</td><td ${ps} class="text-slate-500" data-notr>${f(r.nR)}</td><td ${ps} class="text-slate-500" data-notr>${f(r.hR)}</td></tr>`}
function trcCu(force){
 const o=trcCalc(),k=o.rows.map(r=>r.t.id).join(',')+'|'+TRP.cur+'|'+o.tier,tb=$('trccb');if(!tb)return;
 if(force||k!==trcIds){trcIds=k;const f=n=>trdFm(o.sym,n),u=n=>o.sym+trdN2(n);
  tb.innerHTML=!o.ok?`<tr><td colspan="7" class="text-center py-3 text-slate-400 italic">Choose a currency to see prices and the payment plan.</td></tr>`:!o.rows.length?`<tr><td colspan="7" class="text-center py-3 text-slate-400 italic">Enter the quantity of at least one treatment.</td></tr>`:o.rows.map(r=>trcCuRow(r,f)).join('')}
 else o.rows.forEach(r=>{const a=$('tcq_'+r.t.id),b=$('tct_'+r.t.id);if(a)a.textContent=r.q;if(b)b.textContent=trdFm(o.sym,r.tot)})}
function trcU(el){const id=el.dataset.id,v=trdNum(el.value);if(v!=null&&v>=0)TRP.u[id]=el.value;else delete TRP.u[id];trcSave();
 const o=trcCalc(),r=o.rows.find(x=>x.t.id==id);if(r){const b=$('tct_'+id);if(b)b.textContent=trdFm(o.sym,r.tot);el.classList.toggle('text-red-600',r.tot<Math.round(r.q*r.lR))}
 trcOut()}

/* results */
const trcRowR=(l,v,c)=>`<div class="flex justify-between gap-2 px-3 py-1 border-b last:border-0 text-xs"><span class="text-slate-500">${l}</span><b class="${c||''} text-right" data-notr>${v}</b></div>`;
const trcBox=(t,c,b)=>`<div class="rounded-xl border border-slate-200 overflow-hidden bg-white"><div class="px-3 py-2 ${c} text-xs font-bold uppercase">${t}</div>${b}</div>`;
function trcPlanH(sp,dep,tot,f){
 const R=[trcRowR('Deposit',f(dep))];
 for(let i=0;i<sp.n;i++)R.push(trcRowR(['First Visit','Second Visit','Third Visit'][i],sp.v.length?f(sp.v[i]):'—'));
 R.push(trcRowR('Total',f(tot),'text-slate-900'));return R.join('')}
const trcPct=p=>p==null?'':' ('+p+'%)';
const trcNo=()=>`<span class="text-red-600">${esc(ti('Discount is not acceptable'))}</span>`;
function trcNote(o){
 const hid=PDB.cats.reduce((s,c)=>s+c.items.filter(t=>!trdOK(c,t)).length,0);let h='';
 if(!o.ok)h+='<p class="text-amber-700">Choose a currency to see prices and the payment plan.</p>';else if(!o.rows.length)h+='<p class="text-slate-500">Enter the quantity of at least one treatment.</p>';
 if(PDB.ratesMode=='manual')h+=`<p class="text-slate-400 font-semibold">${esc(ti('Exchange rates: set manually by the admin.'))}</p>`;
 else{const ag=trdRAge();h+=`<p class="${ag!=null&&ag>3?'text-amber-700':'text-slate-400'} font-semibold">${esc(ti('Exchange rates: automatic, updated {0}.',TRD_LIVE.at)+(ag!=null&&ag>3?' '+ti('The rates may be out of date.'):''))}</p>`}
 if(hid)h+=`<p class="text-slate-400 font-semibold">${esc(ti('{0} treatments are not shown because their price is not set yet.',hid))}</p>`;
 $('trcnote').innerHTML=h}
/* ---------- results: Least / Normal / High prices with tick boxes, differences, promotion, payment visits ---------- */
const trcTierName=k=>k=='l'?'Least Price':k=='h'?'High Price':'Normal Price';
/* the tick boxes: only one price list is used by the Custom Plan */
function trcTier(k){
 if(!['l','n','h'].includes(k))return;
 const ch=TRP.tier!=k;TRP.tier=k;
 if(ch){TRP.u={};if(TRP.pc=='N'||TRP.pc=='L')TRP.pc='-'}
 trcSave();trcCu(true);trcOut()}
const trcTick=(o,k)=>`<input type="checkbox" name="trctier" data-tier="${k}" ${o.tier==k?'checked':''} onchange="trcTier('${k}')" class="w-4 h-4 accent-slate-800">`;
/* Promotion %: the usual list plus the percentages that bring the treatments exactly to the Normal or the Least price */
function trcPcOpt(o){
 const sp=trcSpec(o),v=String(TRP.pc==null?'-':TRP.pc),nums=[...new Set((PDB.promoC||[]).map(Number).filter(x=>x>0&&x<100))];
 if(/^[0-9.]+%$/.test(v)){const p=trdNum(v.replace('%',''));if(p>0&&!nums.includes(p))nums.push(p)}
 const L=nums.map(p=>({k:p,s:0,v:p+'%',t:p+'%'}));
 [['N','Normal Price'],['L','Least Price']].forEach(([k,n])=>{if(sp[k])L.push({k:sp[k].p,s:1,v:k,t:sp[k].p+'% — '+ti(n)})});
 L.sort((a,b)=>a.k-b.k||a.s-b.s);
 return['<option value="-">-</option>',...L.map(x=>`<option value="${x.v}"${x.v==v?' selected':''}>${esc(x.t)}</option>`)].join('')}
function trcPcSel(o){const e=$('trcps');if(e)e.innerHTML=trcPcOpt(o)}
/* Payment visits: the rule saved in the settings, equal parts, or each visit pays its own treatments */
function trcPsOpt(){
 const n=trcNV(),sp=PDB.split,pc=a=>a.map(x=>x+'%').join(' / '),
  rule=n==2?[sp[2][0],100-sp[2][0]]:n==3?[sp[3][0],sp[3][1],100-sp[3][0]-sp[3][1]]:[100],eq=n==2?[50,50]:n==3?[33,33,33]:[100],v=TRP.ps=='e'||TRP.ps=='v'?TRP.ps:'r';
 return[['r',ti('Rule: {0}',pc(rule))],['e',ti('Equal split: {0}',pc(eq))],['v',ti('By visit: the treatments listed in each visit')]].map(([k,t])=>`<option value="${k}"${k==v?' selected':''}>${esc(t)}</option>`).join('')}
function trcPsSel(){const e=$('trcpv');if(!e)return;e.innerHTML=trcPsOpt();e.disabled=trcNV()==1}
function trcTot(o){
 const R=trdRates(),ps='style="padding:4px 5px"',T=(c,k,nh)=>trdRU(o.rows.reduce((s,r)=>s+(nh&&r.hot?0:r.q*r[k]),0)*R[c]),
  row=(k,pk,cl)=>`<tr><td ${ps}><label class="inline-flex items-center gap-1.5 cursor-pointer">${trcTick(o,k)}<span>${trcTierName(k)}</span></label></td>${TRD_CUR.map(c=>`<td ${ps} class="text-center ${cl}" data-notr>${trdFm(TRD_SYM[c],T(c,pk))}</td>`).join('')}</tr>`;
 $('trct').innerHTML=o.rows.length?`<div class="rounded-xl border border-slate-200 overflow-x-auto"><table><thead><tr><th ${ps}>Selected totals</th>${TRD_CUR.map(c=>`<th ${ps} class="text-center">${c}</th>`).join('')}</tr></thead><tbody>${row('l','lp','text-emerald-700')}${row('n','np','text-indigo-700')}${row('h','hp','text-rose-700')}</tbody></table></div>`:''}
function trcPan(o){
 const el=$('trcp');if(!o.ok||!o.rows.length){el.innerHTML='';return}
 const f=n=>trdFm(o.sym,n),df=(d,p)=>p==null?'':trcRowR('Difference from High Price',f(d)+trcPct(p),'text-purple-700'),
  box=(k,c,sp,tot,x)=>`<div class="rounded-xl border ${o.tier==k?'border-slate-800 ring-2 ring-slate-800':'border-slate-200'} overflow-hidden bg-white min-w-0"><div class="px-3 py-2 ${c} text-xs font-bold uppercase flex flex-wrap justify-between items-center gap-x-3 gap-y-1"><span>${trcTierName(k)}</span><label class="inline-flex items-center gap-1.5 text-[10px] normal-case cursor-pointer">${trcTick(o,k)}<span>Use in Custom Plan</span></label></div>${trcPlanH(sp,PDB.deposit,tot,f)}${x||''}</div>`;
 el.innerHTML=box('l','bg-emerald-100 text-emerald-900',o.Ls,o.Lt,df(o.dHL,o.pHL))+box('n','bg-indigo-100 text-indigo-900',o.Ns,o.Nt,df(o.dHN,o.pHN))+box('h','bg-rose-100 text-rose-900',o.Hs,o.Ht,'')}
function trcCuRes(o){
 const el=$('trccr'),T=$('trccT'),P=$('trccP');if(!o.ok||!o.rows.length){el.innerHTML='';T.textContent='';if(P)P.textContent='';return}
 const f=n=>trdFm(o.sym,n);T.textContent=f(o.ct);if(P)P.textContent='('+ti(trcTierName(o.tier))+')';
 let h=trcBox('Payment plan','bg-slate-100 text-slate-800',trcPlanH(o.Cs,o.cd,o.ct,f))
  +trcBox('Difference','bg-purple-100 text-purple-900',trcRowR('vs Least Price',f(o.dCL)+trcPct(o.pCL),o.dCL<0?'text-red-600':'text-emerald-700')+trcRowR('vs Normal Price',f(o.dCN)+trcPct(o.pCN),o.dCN<0?'text-red-600':'text-indigo-700')+trcRowR('vs High Price',f(o.dCH)+trcPct(o.pCH),o.dCH<0?'text-red-600':'text-rose-700'));
 if(o.pc)h+=trcBox('Promotion','bg-amber-100 text-amber-900',trcRowR('Promoted Price',f(o.pc.price),'text-amber-700')+trcRowR('Saving',o.pc.ok?f(o.pc.save):trcNo(),'text-purple-700')+trcPlanH(o.pc.sp,o.cd,o.pc.price,f));
 el.innerHTML=`<div class="grid grid-cols-1 md:grid-cols-3 gap-3">${h}</div>`}
function trcMsg(o){
 const M=trcMsgs(o);TRC_M=M;
 const hint=k=>k=='info'&&o.rows.length?'None of the selected treatments has a patient explanation yet.':!o.ok&&k!='exp'&&k!='info'?'Choose a currency to create this message.':!o.rows.length?'Enter the quantity of at least one treatment to create this message.':'Choose a promotion % in the Custom Plan to create this message.',
  ix=k=>{if(k=='manual'||k=='promo')return trcAvNote();if(k!='info'||!o.rows.length)return'';const I=trcInfoB(o);return I.blocks.length||I.miss.length?`<div class="px-3 pt-2 text-[10px] space-y-1"><div class="flex flex-wrap gap-1" data-notr>${I.blocks.map(b=>`<span class="bg-emerald-50 text-emerald-800 rounded px-1.5 py-0.5 font-bold">${esc(b.t)}</span>`).join('')}</div>${I.miss.length?`<p class="text-amber-700 font-semibold"><span>No explanation yet for:</span> <span data-notr>${esc(I.miss.map(t=>trdTn(t)).join(', '))}</span></p>`:''}</div>`:''},
  card=(k,t)=>`<div class="rounded-xl border border-slate-200 overflow-hidden bg-white"><div class="px-3 py-2 bg-slate-900 flex flex-wrap items-center justify-between gap-2"><b class="lux text-[#a08a7c] text-xs uppercase tracking-wider">${t}</b><div class="flex items-center gap-2"><button type="button" onclick="trcCopy('${k}')" class="g rounded px-2 py-1 text-[10px] font-bold uppercase">Copy</button></div></div>${ix(k)}<div class="p-2">${M[k]?`<textarea id="trcm_${k}" readonly data-notr dir="auto" style="unicode-bidi:plaintext" rows="${k=='info'?18:14}" class="w-full border rounded p-2 text-xs font-semibold bg-slate-50">${esc(M[k])}</textarea>`:`<p class="text-xs text-slate-500 italic p-2">${hint(k)}</p>`}</div></div>`;
 $('trcm').innerHTML=card('exp','Treatment Explanation')+card('normal','Normal Plan')+card('manual','Individual Price Promoted Plan')+card('promo','Package Promoted Plan'); if(window.EX){EX.decorate('trcm','calc','trcm:',true);
  /* version 3.0: the hotel that was chosen brings its accommodation (photos and text of the Follow up Messages > Accommodation); without a hotel, the transportation */
  const ht=o.rows.filter(r=>r.hot&&r.q>0).sort((a,b)=>b.q-a.q)[0],tr=o.rows.some(r=>r.t&&(r.t.e||[]).some(k=>trcBR(k)=='trans'));
  EX.render('trcx',Object.assign({},o,{stay:{any:o.rows.length>0&&!tr,hn:ht?ht.t.n:''}}))}}
async function trcCopy(k){
 const t=TRC_M[k];if(!t)return;
 try{await navigator.clipboard.writeText(t);toast(ti('Copied.'))}
 catch(e){const x=$('trcm_'+k);let ok=false;if(x){x.focus();x.select();try{ok=document.execCommand('copy')}catch(y){}}toast(ok?ti('Copied.'):ti('Select the text and copy it manually.'))}}
/* ===== PDF of the plan: a popup asks for the patient name and the kit number ===== */
let TRC_BUSY=false;
function trcPdfAsk(){
 const o=trcCalc();
 if(!o.rows.length)return toast(ti('Enter the quantity of at least one treatment first.'));
 if(!o.ok)return toast(ti('Choose a currency before downloading the PDF.'));
 if($('trcpm'))return;
 const lab='block text-[10px] text-slate-500 font-bold uppercase',inp='block w-full border rounded p-2 mt-1 text-sm font-bold text-slate-900 normal-case bg-white',d=document.createElement('div');
 d.id='trcpm';d.className='fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4';
 d.addEventListener('keydown',e=>{if(e.key=='Escape')trcPdfX()});
 d.addEventListener('mousedown',e=>{if(e.target===d)trcPdfX()});
 d.innerHTML=`<form onsubmit="return trcPdfGo(event)" class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4"><h3 class="lux font-bold text-base">Download the plan as PDF</h3><p class="text-xs text-slate-500">Write the patient name and the kit number. Both are printed on the PDF.</p><label class="${lab}">Patient name<input id="trcpt" autocomplete="off" class="${inp}"></label><label class="${lab}">Kit number<input id="trckit" autocomplete="off" class="${inp}"></label><div class="flex flex-wrap justify-end gap-2 text-xs font-bold uppercase"><button type="button" onclick="trcPdfX()" class="bg-slate-200 rounded px-4 py-2">Cancel</button><button type="submit" class="bg-slate-800 text-white rounded px-4 py-2">⬇ Download PDF</button></div></form>`;
 document.body.appendChild(d);
 ['trcpt','trckit'].forEach(i=>$(i).addEventListener('input',e=>e.target.classList.remove('border-red-500','ring-1','ring-red-500')));
 $('trcpt').focus()}
function trcPdfX(){const d=$('trcpm');if(d)d.remove()}
function trcPdfGo(ev){if(ev&&ev.preventDefault)ev.preventDefault();
 const a=$('trcpt'),b=$('trckit');if(!a||!b)return false;
 const nm=a.value.trim(),kt=b.value.trim();
 if(!nm||!kt){const x=!nm?a:b;x.classList.add('border-red-500','ring-1','ring-red-500');x.focus();toast(ti('Please write the patient name and the kit number first.'));return false}
 trcPdfX();trcPdfRun(nm,kt);return false}
async function trcPdfRun(pt,kit){
 if(TRC_BUSY)return;
 const dl=await kcDl();if(!dl)return toast(ti('Saving files is not available in this view.'));
 TRC_BUSY=true;
 try{
  const o=trcCalc();if(!o.ok||!o.rows.length)return toast(ti('Choose a currency before downloading the PDF.'));
  toast(ti('Preparing the PDF…'));
  try{await document.fonts.ready}catch(x){}
  const D={o,M:trcMsgs(o),l:trdLg(),vis:TRP.vis,pt,kit,at:new Date().toISOString()};
  const wrap=document.createElement('div');wrap.style.cssText='position:fixed;left:-10000px;top:0;width:794px';
  const el=document.createElement('div');el.className='tcp';el.setAttribute('dir',D.l=='ar'?'rtl':'ltr');
  el.style.cssText="width:794px;padding:26px 38px;box-sizing:border-box;background:#ffffff;color:#161a59;font-family:Montserrat,'Noto Sans Arabic',sans-serif";
  el.innerHTML=trcPdfHtml(D);
  wrap.appendChild(el);document.body.appendChild(wrap);
  const fn=(ti('Treatment Plan')+' - '+pt+' - '+kit).replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim()+'.pdf';
  try{const blob=await html2pdf().set({margin:[10,0,10,0],image:{type:'jpeg',quality:0.98},html2canvas:{onclone:thmLight,scale:2,backgroundColor:'#ffffff',scrollX:0,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:'.pavoid'}}).from(el).outputPdf('blob');
   await dl.save({filename:fn,data:blob})}catch(x){if(!x||x.code!='declined')toast(ti('Could not create the PDF.'))}
  wrap.remove()}
 finally{TRC_BUSY=false}}
function trcPdfHtml(D){
 const {o,M,l,pt,kit,at,vis}=D,GD='#8a7466',GL='rgba(160,138,124,.5)',NV='#161a59',cin="Lato,Montserrat,'Noto Sans Arabic',sans-serif",f=n=>trdFm(o.sym,n),u=n=>o.sym+trdN2(n),
  lbl=String(trdTx('lb',l)).split('\n').map(s=>s.trim()),Lb=[lbl[0]||'Deposit',lbl[1]||'First Visit',lbl[2]||'Second Visit',lbl[3]||'Third Visit',lbl[4]||'On Arrival'],
  H=t=>`<div class="pavoid" style="margin:18px 0 8px;font-family:${cin};font-size:12px;font-weight:700;color:${GD};text-transform:uppercase;letter-spacing:.12em;border-bottom:1px solid ${GL};padding-bottom:4px">${esc(t)}</div>`,
  cell=(t,w,al,st)=>`<div style="flex:0 0 ${(w/9.5*100).toFixed(3)}%;box-sizing:border-box;min-width:0;text-align:${al||'start'};padding:0 5px;${st||''}">${t}</div>`,
  rowS='display:flex;align-items:center;font-size:9.5px;padding:5px 0;border-bottom:1px solid #e3ddd8',
  dt=(()=>{try{return new Date(at).toLocaleDateString(LANGS[trdLn(l)][2],{dateStyle:'medium'})}catch(e){return String(at).slice(0,10)}})(),
  pct=p=>p==null?'':' ('+p+'%)',
  info=(k,v)=>`<div style="display:flex;gap:6px;align-items:baseline;font-size:10.5px;line-height:1.6"><span style="color:#6e7099;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;min-width:84px">${esc(k)}</span><b dir="auto" style="unicode-bidi:plaintext">${esc(v)}</b></div>`,
  head=`<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid ${GL};padding-bottom:12px"><div style="display:flex;align-items:center;gap:12px"><div style="background:${NV};color:#a08a7c;font-family:Lato,Montserrat,sans-serif;font-weight:700;font-size:13px;letter-spacing:.02em;width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center">EOP</div><div><div style="font-family:Lato,Montserrat,sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;color:${NV}">EXECUTIVE OPERATIONS PORTAL</div><div style="font-size:9px;font-weight:700;letter-spacing:.2em;color:#a08a7c;margin-top:4px;text-transform:uppercase">${esc(ti('Treatment Plan'))}</div></div></div><div style="min-width:0">${info(ti('Patient name'),pt)}${info(ti('Kit number'),kit)}${info(ti('Date'),dt)}${info(ti('Currency'),o.cur)}${info(ti('Visits'),ti(vis))}${me!='admin'?info(ti('Consultant'),me):''}</div></div>`;
 /* price tables: Least / Normal / High, and the custom plan */
 const nm=r=>esc(trdTn(r.t,l)),
  GC=[['Least Price','#047857'],['Normal Price','#4338ca'],['High Price','#be123c']],
  grp=`<div class="pavoid" style="display:flex;font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#ffffff;text-align:center">${cell('',2.65,'start','background:'+NV+';padding:5px')}${GC.map(g=>cell(esc(ti(g[0])),2.28,'center','background:'+g[1]+';padding:5px')).join('')}</div>`,
  W3=[2.2,.45,1,1.28,1,1.28,1,1.28],
  colH=(...t)=>`<div class="pavoid" style="display:flex;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#4b4f80;background:#efe9e3;padding:4px 0">${t.map((x,i)=>cell(esc(x),W3[i],i==0?'start':i==1?'center':'end')).join('')}</div>`,
  tot3=`<div class="pavoid" style="display:flex;align-items:center;font-size:11px;font-weight:800;padding:7px 0;border-top:2px solid ${NV}">${cell(esc(ti('Total')),2.65)}${[[o.Lt,'#047857'],[o.Nt,'#4338ca'],[o.Ht,'#be123c']].map(g=>cell(f(g[0]),2.28,'end','color:'+g[1])).join('')}</div>`;
 const tr1=o.rows.map(r=>`<div class="pavoid" style="${rowS}">${cell(nm(r),2.2,'start','font-weight:600;white-space:normal')}${cell(r.q,.45,'center')}${[['lR','#047857'],['nR','#4338ca'],['hR','#be123c']].map(g=>cell(f(r[g[0]]),1,'end','color:'+g[1])+cell(f(Math.round(r.q*r[g[0]])),1.28,'end','color:'+g[1]+';font-weight:700')).join('')}</div>`).join('');
 const t1=grp+colH(ti('Treatment'),ti('Qty'),ti('Unit Price'),ti('Total'),ti('Unit Price'),ti('Total'),ti('Unit Price'),ti('Total'))+tr1+tot3;
 const W2=[2.9,.6,1.2,1.3,1.1,1.2,1.2],
  tr2=o.rows.map(r=>`<div class="pavoid" style="${rowS}">${cell(nm(r),W2[0],'start','font-weight:600;white-space:normal')}${cell(r.q,W2[1],'center')}${cell(f(r.eu),W2[2],'end','font-weight:700')}${cell(f(r.tot),W2[3],'end','font-weight:800'+(r.tot<Math.round(r.q*r.lR)?';color:#dc2626':''))}${cell(f(r.lR),W2[4],'end','color:#6e7099')}${cell(f(r.nR),W2[5],'end','color:#6e7099')}${cell(f(r.hR),W2[6],'end','color:#6e7099')}</div>`).join('');
 const t2=`<div class="pavoid" style="display:flex;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#ffffff;background:${NV};padding:6px 0">${[ti('Treatment'),ti('Qty'),ti('Unit Price'),ti('Total'),ti('Least Unit'),ti('Normal Unit'),ti('High Unit')].map((x,i)=>cell(esc(x),W2[i],i==0?'start':i==1?'center':'end')).join('')}</div>`+tr2
  +`<div class="pavoid" style="display:flex;align-items:center;font-size:11px;font-weight:800;padding:7px 0;border-top:2px solid ${NV}">${cell(esc(ti('Total')),W2[0]+W2[1]+W2[2])}${cell(f(o.ct),W2[3],'end')}${cell('',W2[4]+W2[5]+W2[6])}</div>`;
 /* payment plans */
 const pr=(a,b,c)=>`<div style="display:flex;justify-content:space-between;gap:8px;font-size:10px;padding:4px 10px;border-bottom:1px solid #e3ddd8${c?';font-weight:800':''}"><span style="color:#4b4f80">${esc(a)}</span><b dir="ltr" style="unicode-bidi:isolate">${esc(b)}</b></div>`,
  plan=(sp,dep,total)=>{let h=pr(Lb[0],f(dep));if(sp.n==1){if(sp.v.length)h+=pr(Lb[4],f(sp.v[0]))}else sp.v.forEach((x,i)=>{h+=pr(Lb[i+1],f(x))});return h+pr(ti('Total'),f(total),1)},
  box=(t,bg,fg,b)=>`<div class="pavoid" style="flex:1 1 200px;min-width:0;border:1px solid #d8cfc8;border-radius:8px;overflow:hidden"><div style="background:${bg};color:${fg};font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;padding:6px 10px">${esc(t)}</div>${b}</div>`,
  boxes=a=>`<div style="display:flex;flex-wrap:wrap;gap:10px">${a.join('')}</div>`,
  tn=k=>ti(k=='l'?'Least Price':k=='h'?'High Price':'Normal Price'),
  df=(d,p)=>p==null?'':pr(ti('Difference from High Price'),f(d)+pct(p));
 const bLN=[box(tn('l')+(o.tier=='l'?' ✓':''),'#d1fae5','#064e3b',plan(o.Ls,PDB.deposit,o.Lt)+df(o.dHL,o.pHL)),box(tn('n')+(o.tier=='n'?' ✓':''),'#e0e7ff','#312e81',plan(o.Ns,PDB.deposit,o.Nt)+df(o.dHN,o.pHN)),box(tn('h')+(o.tier=='h'?' ✓':''),'#ffe4e6','#881337',plan(o.Hs,PDB.deposit,o.Ht))];
 const bC=[box(ti('Payment plan'),'#efe9e3','#20256b',plan(o.Cs,o.cd,o.ct)),box(ti('Difference'),'#f3e8ff','#581c87',pr(ti('vs Least Price'),f(o.dCL)+pct(o.pCL))+pr(ti('vs Normal Price'),f(o.dCN)+pct(o.pCN))+pr(ti('vs High Price'),f(o.dCH)+pct(o.pCH)))];
 if(o.pc)bC.push(box(ti('Promotion')+' ('+o.pc.p+'%)','#fef3c7','#78350f',pr(ti('Promoted Price'),f(o.pc.price))+pr(ti('Saving'),o.pc.ok?f(o.pc.save):ti('Discount is not acceptable'))+plan(o.pc.sp,o.cd,o.pc.price)));
 /* the messages */
 const chunks=s=>{const out=[];String(s).replace(/\*([^*\n]+)\*/g,'$1').replace(/^(\u200f?)\* +/gm,'$1• ').split(/\n(?:[ \t]*\n)+/).forEach(p=>{const L=p.replace(/^\n+|\n+$/g,'').split('\n');for(let i=0;i<L.length;i+=8)out.push(L.slice(i,i+8).join('\n'))});return out},
  txt=(t,s)=>s?H(t)+chunks(s).map(p=>`<div class="pavoid" dir="auto" style="white-space:pre-wrap;unicode-bidi:plaintext;font-size:10.5px;line-height:1.6;color:#20256b;margin-bottom:6px">${esc(p)}</div>`).join(''):'';
 const foot=``;
 return (l=='ar'?'<style>.tcp *{letter-spacing:normal!important}</style>':'')+head
  +txt(ti('Normal Plan'),M.normal)+txt(ti('Individual Price Promoted Plan'),M.manual)+foot}

/* every box shows all of its content: lists and text areas grow with what is inside, so nothing needs scrolling */
function fitTA(){document.querySelectorAll('textarea:not(#zt)').forEach(t=>{if(!t.getClientRects().length)return;t.style.overflow='hidden';t.style.resize='none';t.style.height='auto';t.style.height=(t.scrollHeight+2)+'px'})}
let FIT_Q=0;const fitSch=()=>{if(FIT_Q)return;FIT_Q=requestAnimationFrame(()=>{FIT_Q=0;try{fitTA()}catch(e){}})};
if(document.body){new MutationObserver(fitSch).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('input',e=>{if(e.target&&e.target.tagName=='TEXTAREA')fitSch()});
 document.addEventListener('click',fitSch);document.addEventListener('toggle',fitSch,true);addEventListener('resize',fitSch);fitSch()}
function trcOut(){const o=trcCalc();trcNote(o);trcTot(o);trcPan(o);trcPcSel(o);trcPsSel();trcCuRes(o);trcMsg(o)}
