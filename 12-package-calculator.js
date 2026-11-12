/* Ömar Istanbul by Rima — Package Plan Calculator: Standard / Premium / VIP packages, messages and the PDF */
/* ===== Package Plan Calculator: Standard / Premium / VIP packages, built from the same Treatment Database and the same price engine as the Treatment Plan Calculator ===== */
/* version 4.0: the emoji pattern is built at run time with a simpler fallback, so an older iPhone that does not know \p{Extended_Pictographic} still loads this whole file */
const EMO_RE=(()=>{try{return new RegExp('[\\p{Extended_Pictographic}\\u200d\\ufe0f\\u20e3]+\\s?','gu')}catch(e){return /(?:[\u2600-\u27BF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF]|[\u200d\ufe0f\u20e3])+\s?/g}})();
const PK_TIERS=[{k:'std',n:'Standard Package',e:'🏥',c:'bg-sky-100 text-sky-900'},{k:'pre',n:'Premium Package',e:'💎',c:'bg-indigo-100 text-indigo-900'},{k:'vip',n:'VIP Package',e:'👑',c:'bg-amber-100 text-amber-900'}];
/* the flight ticket of the first visit: the amount (in the currency of the plan) used until the consultant types another one */
const PK_FL={EUR:350,USD:1500,CAD:2000,GBP:400,AUD:2500,NZD:2500};
/* the advanced view is no longer offered on screen (the consultants work in the simple view); the engine behind it stays for the tests */
var PK_ADV=!!window.__PKADV;
let PKP=null,pkMe=null,PK_OPEN=new Set(),PK_M={};
const pkKey=()=>'kc_pkp_'+me;
/* what is chosen for one All-on package inside one package: the implant type, the zygomatic type and the ticked treatments (with their quantities) */
const pkAo0=()=>({imp:'',zt:'',sel:{},seeded:false});
/* the packages are always shown in the High price list (tier 'h'); only the hidden advanced engine can use another list */
const pkPk0=()=>({im:'',cr:'',ho:'',pc:'-',tier:PK_ADV?'n':'h',ao:{a4:pkAo0(),a6:pkAo0(),zy:pkAo0()}});
/* the All-on packages of the plan (ticked once, the same for the three packages) */
const pkAp0=()=>({a4:{on:false,jaws:1},a6:{on:false,jaws:1},zy:{on:false,jaws:1,zn:2,in:6}});
const pkFresh=()=>({v:6,mode:'s',op:{in:true,ot:false,ap:false},cur:'-',vis:'Two Visits',tk:PK_ADV,fl:{},ni:'',nc:'',nh:'',q:{},hn:null,dep:null,ps:'r',s:'',o:false,sel:'std',ap:pkAp0(),pk:{std:pkPk0(),pre:pkPk0(),vip:pkPk0()}});
/* the packages come ready: the implant, crown(s) and hotel of the Standard, Premium and VIP package (the clinic can save its own choices as the default) */
const PK_SEED={std:{im:'i2',cr:'i15',ho:'i96'},pre:{im:'i4',cr:'i14',ho:'i94'},vip:{im:'i8',cr:'i16',ho:'i89'}},
 /* the same defaults by name: if the Treatment Database of a browser numbers its items differently, the package still starts with Medigma / El Emin, Hiossen / Centro WestSide, Straumann BLX / Uranus */
 PK_SEEDN={std:{im:/medigma/i,cr:/zirconium.*vita/i,ho:/el emin/i},pre:{im:/hiossen/i,cr:/zirconium.*straumann/i,ho:/centro/i},vip:{im:/straumann blx/i,cr:/zirconium.*ivoclar/i,ho:/uranus/i}},PK_ZT={std:'i11',pre:'i11',vip:'i12'};
/* the criteria that come ticked when an All-on package is ticked (the consultant can change them): the prosthesis, the temporary teeth and, for All-on-6 and Zygomatic, the crowns.
   i38 Hybrid, i41 Toronto, i36 Temporary Total Prosthesis After Implant (One Jaw), i37 Fixed Temporary, i15 Zirconium crowns German Vita; a number is a fixed quantity, null the quantity of the jaws chosen (the Temporary Total Prosthesis is one per jaw: 1 jaw = 1, 2 jaws = 2).
   The Standard package comes with the Temporary Total Prosthesis in All-on-4, All-on-6 and Zygomatic. They are found by name too, when the Treatment Database of a browser numbers its items differently */
const PK_AON={i36:/temporary total prosthesis/i,i37:/fixed temporary/i,i38:/hybrid/i,i41:/toronto/i,i15:/zirconium.*vita/i},
 pkAoRes=(id,ok)=>{const rx=PK_AON[id],f=trdFind(id);if(f&&(!rx||rx.test(f.t.n))&&ok.includes(f.t.p)&&trdOK(f.c,f.t))return f;const m=rx?trdAll().find(({c,t})=>rx.test(t.n)&&ok.includes(t.p)&&trdOK(c,t)):null;return m||null},
 PK_AO4={std:{i38:null,i36:null},pre:{i38:null,i37:null},vip:{i41:null,i37:null}},PK_AO={std:{a4:PK_AO4.std,a6:{i15:null,i36:null},zy:{i15:null,i36:null}},pre:{a4:PK_AO4.pre,a6:PK_AO4.pre,zy:PK_AO4.pre},vip:{a4:PK_AO4.vip,a6:PK_AO4.vip,zy:PK_AO4.vip}};
function pkNorm(s){const F=pkFresh();s=s&&typeof s=='object'?s:{};const pk={},ap={};
 const old=(s.v||1)<3,mid=(s.v||1)<5;
 PK_TIERS.forEach(t=>{const o=(s.pk||{})[t.k]||{},b=F.pk[t.k],ao={};
  /* a plan saved before the new package defaults starts again from them (the promotion and the price list are kept) */
  Object.keys(b.ao).forEach(k=>{const v=old?{}:(o.ao||{})[k]||{};ao[k]={...b.ao[k],...v,sel:{...(v.sel||{})}}});
  pk[t.k]={...b,...o,...(old?{im:'',cr:'',ho:''}:mid&&(t.k=='std'||t.k=='pre')?{ho:''}:{}),mx:undefined,c2:undefined,n2:undefined,tier:PK_ADV?(['l','n','h'].includes(o.tier)?o.tier:'n'):'h',ao}});
 Object.keys(F.ap).forEach(k=>{ap[k]={...F.ap[k],...((s.ap||{})[k]||{})}});
 return{...F,...s,v:6,m6:(s.v||1)<6||!!s.m6,mode:PK_ADV&&s.mode=='a'?'a':'s',op:{...F.op,...(s.op||{}),...((s.v||1)<2?{in:true}:{})},fl:{...(s.fl||{})},q:{...(s.q||{})},ap,pk}}
function pkPreset(){
 const U={},imps=pkImps(),crs=pkCrs(),hots=pkHots(),has=(a,id)=>!!id&&a.some(x=>x.t.id==id),
  seed=(a,id,rx)=>{const m=a.filter(x=>rx.test(x.t.n)),byId=m.find(x=>x.t.id==id);return byId?id:m[0]?m[0].t.id:has(a,id)?id:a[0]?a[0].t.id:''},
  pick=(a,u,id,rx)=>has(a,u)?u:seed(a,id,rx),o={};
 PK_TIERS.forEach(t=>{const d=PK_SEED[t.k],n=PK_SEEDN[t.k],u=U[t.k]||{};
  o[t.k]={im:pick(imps,u.im,d.im,n.im),cr:pick(crs,u.cr,d.cr,n.cr),ho:pick(hots,u.ho,d.ho,n.ho)}});
 return o}
/* fills what the consultant has not chosen: the package choices from the defaults, the implant (and zygomatic type) of a ticked All-on package from the package */
function pkEnsure(){
 const PS=pkPreset(),imps=pkImps(),crs=pkCrs(),hots=pkHots(),zy=trdByRole('zyg'),has=(a,id)=>!!id&&a.some(x=>x.t.id==id);let ch=false;
 /* a plan saved before the Temporary Total Prosthesis default: the All-on criteria that were never filled (nothing ticked) come ticked the first time, and the untouched Standard All-on-6 / Zygomatic choice (only the Vita crowns) gets the Temporary Total Prosthesis */
 if(PKP.m6){const ok0=['bs','pro','tmp','cr'];
  PK_TIERS.forEach(t=>{const P=PKP.pk[t.k];Object.keys(P.ao||{}).forEach(k=>{const a=P.ao[k],ks=Object.keys((a&&a.sel)||{});if(!a||!a.seeded)return;
   if(!ks.length)a.seeded=false;
   else if(t.k=='std'&&(k=='a6'||k=='zy')){const v=pkAoRes('i15',ok0),m=pkAoRes('i36',ok0);if(v&&m&&ks.length==1&&ks[0]==v.t.id&&a.sel[v.t.id]===null)a.sel[m.t.id]=null}})});
  delete PKP.m6;ch=true}
 /* the Temporary Total Prosthesis came ticked with a fixed quantity of 2: it is one per jaw now (1 jaw = 1), also in plans that were saved with the 2 */
 if(!PKP.t1){PKP.t1=1;ch=true;const ok1=['bs','pro','tmp','cr'];
  PK_TIERS.forEach(t=>{const P=PKP.pk[t.k];Object.keys(P.ao||{}).forEach(k=>{const a=P.ao[k],m=pkAoRes('i36',ok1);if(a&&a.sel&&m&&a.sel[m.t.id]===2)a.sel[m.t.id]=null})})}
 PK_TIERS.forEach(t=>{const P=PKP.pk[t.k],D=PS[t.k],set=(f,v)=>{if(P[f]!==v){P[f]=v;ch=true}};
  if(!P.im&&!P.cr&&!P.ho){['im','cr','ho'].forEach(f=>set(f,D[f]))}
  else{if(!has(imps,P.im))set('im',D.im);if(!has(crs,P.cr))set('cr',D.cr);if(!has(hots,P.ho))set('ho',D.ho)}
  TRD_PK.forEach(x=>{const g=PKP.ap[x.k];if(!g||!g.on)return;const a=P.ao[x.k]||(P.ao[x.k]=pkAo0());
   if(!(a.imp&&has(imps,a.imp))&&P.im){a.imp=P.im;ch=true}
   if(x.z&&!(a.zt&&zy.some(z=>z.t.id==a.zt))){const z=zy.some(y=>y.t.id==PK_ZT[t.k])?PK_ZT[t.k]:zy[0]?zy[0].t.id:'';if(z){a.zt=z;ch=true}}
   /* the criteria come ticked once, the first time the All-on package is ticked for this patient */
   if(!a.seeded){a.seeded=true;ch=true;if(!Object.keys(a.sel).length){const ok=x.c?['bs','pro','tmp','cr']:['bs','pro','tmp'],S0=(PK_AO[t.k]||{})[x.k]||{};
    Object.keys(S0).forEach(id=>{const f=pkAoRes(id,ok);if(f)a.sel[f.t.id]=S0[id]})}}})});
 if(ch)pkSave()}
function pkLoad(){PKP=pkNorm(L(pkKey(),null));pkMe=me}
const pkSave=()=>S(pkKey(),PKP);
const pkN=v=>{const n=trdNum(v);return n!=null&&n>0?Math.round(n):0};
const pkNV=()=>PKP.vis=='One Visit'?1:PKP.vis=='Three Visits'?3:2;
/* the implants, the crowns and the hotels offered in the drop-downs come from the Treatment Database (package roles of the Database; hotels = the hotel categories) */
const pkRole=(role,rx)=>{let a=trdAll().filter(({c,t})=>c.kind!='h'&&t.p==role&&trdOK(c,t));if(!a.length)a=trdAll().filter(({c,t})=>c.kind!='h'&&rx.test(c.name)&&t.p!='zyg'&&trdOK(c,t));return a};
const pkImps=()=>pkRole('imp',/implant/i),pkCrs=()=>pkRole('cr',/crown/i),pkHots=()=>trdAll().filter(({c,t})=>c.kind=='h'&&trdOK(c,t));
const pkGen=()=>new Set([...pkImps(),...pkCrs(),...pkHots()].map(x=>x.t.id));
/* the flight ticket is no longer offered (only the dormant advanced engine of the tests can still add it) */
function pkTk(){const c=PKP.cur;if(!PK_ADV||!PKP.tk||!TRD_CUR.includes(c))return 0;const v=trdNum(PKP.fl[c]);return v!=null&&v>=0?v:PK_FL[c]}
/* the All-on packages of one package, in the shape the Treatment Plan Calculator engine reads them */
function pkAO(k){const o={};TRD_PK.forEach(P=>{const g=PKP.ap[P.k];if(!g||!g.on)return;const t=PKP.pk[k].ao[P.k]||pkAo0();
 o[P.k]={on:true,jaws:P.j&&+g.jaws==2?2:1,zn:+g.zn==4?4:2,in:trdZin(g.in),imp:t.imp||'',zt:t.zt||'',sel:{...(t.sel||{})}}});return o}
/* the implant (and the zygomatic type) of every ticked All-on package must be chosen before the totals are shown */
function pkAoOk(k){let ok=true;TRD_PK.forEach(P=>{const g=PKP.ap[P.k];if(!g||!g.on)return;const s=PKP.pk[k].ao[P.k]||pkAo0(),i=trdFind(s.imp);
 if(!(i&&i.t.p=='imp'&&trdOK(i.c,i.t))&&!(P.z&&trdZin(g.in)==0))ok=false;if(P.z){const z=trdFind(s.zt);if(!(z&&z.t.p=='zyg'&&trdOK(z.c,z.t)))ok=false}});return ok}
/* the quantities of one package: the generic quantities are given to the implant, the crown(s) and the hotel chosen for it, plus the other treatments */
function pkQ(k){
 const P=PKP.pk[k],q={},warn=[],add=(id,n)=>{if(id&&n>0)q[id]=(q[id]||0)+n},has=(a,id)=>!!id&&a.some(x=>x.t.id==id),
  imps=pkImps(),crs=pkCrs(),hots=pkHots(),ni=pkN(PKP.ni),nc=pkN(PKP.nc),nh=pkN(PKP.nh),nv=pkNV();
 if(ni>0){if(has(imps,P.im))add(P.im,ni);else warn.push('Choose an implant for this package.')}
 if(nc>0){
  if(has(crs,P.cr))add(P.cr,nc);else warn.push('Choose a crown for this package.')}
 if(nh>0){if(has(hots,P.ho))add(P.ho,nh);else warn.push('Choose a hotel for this package.')}
 const gen=pkGen();
 Object.keys(PKP.q).forEach(id=>{const n=pkN(PKP.q[id]);if(n>0&&!gen.has(id)){const f=trdFind(id);if(f&&trdOK(f.c,f.t))add(id,n)}});
 const hn={};if(nh>0&&has(hots,P.ho)&&Array.isArray(PKP.hn)&&PKP.hn.length==nv)hn[P.ho]=PKP.hn.map(x=>Math.max(0,Math.round(+x||0)));
 return{q,hn,warn,pk:pkAO(k)}}
/* the Treatment Plan Calculator engine works on its own plan object: it is swapped for the plan of one package while that package is calculated */
function pkRun(k,Q,fn){const old=TRP,P=PKP.pk[k];TRP={...trcFresh(),cur:PKP.cur,vis:PKP.vis,ps:PKP.ps,dep:PKP.dep,q:Q.q,hn:Q.hn,pk:Q.pk,tier:P.tier,pc:P.pc==null?'-':P.pc};try{return fn()}finally{TRP=old}}
/* the visits of a plan with the flight ticket added to the first visit */
function pkVis(sp,K){const v=sp.v.slice();if(K>0&&v.length)v[0]+=K;return{...sp,v}}
/* the promotion of a package works exactly as in the Treatment Plan Calculator (trcSpec / trcPromo): the percentage is taken off the treatments only, the hotel
   nights keep their price, and the flight ticket (when there is one) is paid in full. The total includes the hotel, so the saving on the total is a little less than the percentage */
/* "Zoho Product": the individual prices that give the same total as the promoted package while the hotel keeps its full price: the whole discount is carried by the treatments.
   Every treatment has ONE whole-number unit price (never the same item with two prices). When the quantities do not allow the exact total with whole prices,
   the few currency units that are left are written as one "Adjustment" line, so the Grand Total is always the promoted package price */
function pkZoho(o,pm){
 const rows=o.rows,H=rows.reduce((s,x)=>s+(x.hot?x.tot:0),0),Bt=rows.reduce((s,x)=>s+(x.hot?0:x.tot),0),T=pm.price-H;
 if(!(Bt>0)||!(T>0)||T>=Bt)return null;
 const f=T/Bt,L=[],WD=6;
 rows.forEach((x,i)=>{if(x.hot)return;const e=x.eu*f;L.push({i,q:x.q,b:Math.floor(e+1e-9),e,cap:x.eu})});
 const D=T-L.reduce((s,l)=>s+l.q*l.b,0),W=L.reduce((s,l)=>s+l.q,0)*(WD+1)+Math.abs(D);
 let st=new Map([[0,{c:0,u:[]}]]);
 L.forEach(l=>{const nx=new Map();st.forEach((v,sum)=>{for(let d=-WD;d<=WD;d++){const u=l.b+d;if(u<0||u>l.cap)continue;const s2=sum+l.q*d;if(Math.abs(s2)>W)continue;const c=v.c+l.q*(u-l.e)*(u-l.e),o=nx.get(s2);if(!o||c<o.c)nx.set(s2,{c,u:[...v.u,u]})}});st=nx});
 /* the total nearest to the target: the exact one when the quantities allow it */
 let best=null;st.forEach((v,sum)=>{const dv=Math.abs(sum-D);if(!best||dv<best.dv||(dv==best.dv&&v.c<best.c))best={dv,c:v.c,sum,u:v.u}});
 if(!best)return null;
 const lines=[],rowT=rows.map(()=>0);
 rows.forEach((x,i)=>{if(x.hot){lines.push({x,q:x.q,u:x.eu,t:x.tot});rowT[i]=x.tot;return}const k=L.findIndex(y=>y.i==i),u=best.u[k];lines.push({x,q:x.q,u,t:x.q*u});rowT[i]=x.q*u});
 const adj=D-best.sum;
 if(lines.reduce((s,l)=>s+l.t,0)+adj!=pm.price)return null;
 return{lines,rowT,total:pm.price,adj,sp:trcSplit(pm.price,o.cd,trcVS(o,(x,i)=>rowT[i]/x.q))}}
function pkCalc(k,withM){
 const Q=pkQ(k);
 return pkRun(k,Q,()=>{
  const o=trcCalc(),r={k,Q,o,warn:Q.warn.slice(),pw:(o.pk&&o.pk.warn)||[],spec:{},complete:!Q.warn.length&&pkAoOk(k)};
  if(!o.ok||!o.rows.length)return r;
  /* the promotion: the one of the Treatment Plan Calculator (o.pc), taken off the treatments only */
  r.K=pkTk();r.N=o.ct;r.NT=o.ct+r.K;r.Lt=o.Lt;r.spec=trcSpec(o);r.pm=o.pc;
  const pmOk=!!(r.pm&&r.pm.ok);
  r.fin=pmOk?{sp:r.pm.sp,tot:r.pm.price+r.K,promo:true}:{sp:o.Cs,tot:r.N+r.K,promo:false};
  r.off=pmOk&&r.NT>0?trcR1((r.NT-r.fin.tot)/r.NT*100):0;
  r.zo=pmOk&&!PK_ADV?pkZoho(o,r.pm):null;
  if(withM){r.M=pkMsgs(k,r);r.I=trcInfoB(o)}
  return r})}
/* the First / Second Visit breakdown under the Final Plan of the Zoho Product message: the treatments and the hotel nights of each visit (hotel price x nights of the visit),
   then what makes the payment of the visit: the advance received from the previous visit, the deposit (the whole deposit is written once, in the first visit), the advance payment for the next visit */
function pkZohoVis(r){
 const zo=r.zo,sp=zo&&zo.sp,nv=sp?sp.n:0;
 if(!zo||nv<2||!sp.v||sp.v.length!=nv)return null;
 const A=Array.from({length:nv},()=>[]);let ok=true;
 zo.lines.forEach(e=>{const x=e.x;
  if(x.hot){const a=trcHA(x.t.id).slice(0,nv),s=a.reduce((p,q)=>p+q,0);if(s!=e.q){ok=false;return}a.forEach((n,j)=>{if(n>0)A[j].push({x,q:n,u:e.u,t:n*e.u})})}
  else A[trcVo(x,nv)-1].push(e)});
 if(!ok)return null;
 if(zo.adj)A[nv-1].push({adjust:1,t:zo.adj});
 const c=A.map(a=>a.reduce((s,e)=>s+e.t,0));
 if(c.reduce((s,y)=>s+y,0)!=zo.total)return null;
 let cin=0;const B=[];
 for(let j=0;j<nv;j++){
  const adj=[],dep=j==0?sp.dep:0,cout=sp.v[j]-c[j]+cin+dep;
  if(j==nv-1&&cout!=0)return null;
  if(cin>0)adj.push({k:'in+',j,a:-cin});else if(cin<0)adj.push({k:'in-',j,a:-cin});
  if(dep>0)adj.push({k:'dep',a:-dep});
  if(cout>0)adj.push({k:'out+',j,a:cout});else if(cout<0)adj.push({k:'out-',j,a:cout});
  const pay=c[j]+adj.reduce((s,y)=>s+y.a,0);
  if(pay!=sp.v[j])return null;
  B.push({i:j,items:A[j],adj,pay});cin=cout}
 return B}
/* removes the Tax Info block (its heading, in any language, and the lines under it) from a message */
function pkNoTax(s){const H=/^[\s\u200f]*(\u26a0\ufe0f?)?\s*(Tax Info|Informations fiscales|معلومات الضريبة|Vergi Bilgisi|Налоговая информация|Información fiscal|Steuerhinweis)/i,L=String(s).split('\n'),i=L.findIndex(x=>H.test(x));
 if(i<0)return s;let j=i;while(j<L.length&&L[j].trim()!=='')j++;L.splice(i,j-i);return L.join('\n').replace(/\n{3,}/g,'\n\n').replace(/\s+$/,'')}
/* what a package includes, in the order it is shown: the treatments, then what is included free (full extraction, multiunit abutments), the hotel nights always last */
function pkIncL(o,l){const inc=(o.pk&&o.pk.inc)||[],hot=x=>x.c&&x.c.kind=='h',rw=x=>({q:x.q,nm:trdTn(x.t,l)});
 return[...o.rows.filter(x=>!hot(x)).map(rw),...inc.map(x=>({q:x.q,nm:x.nm})),...o.rows.filter(hot).map(rw)]}
/* ---------- the messages of one package (written in the language chosen in the portal) ---------- */
function pkMsgs(k,r){
 const o=r.o,l=trdLg(),RM=l=='ar'?'‏':'',f=n=>trdFm(o.sym,n),nm=x=>trdTn(x.t,l),rows=o.rows,T=PK_TIERS.find(x=>x.k==k),
  lb=String(trdTx('lb',l)).split('\n').map(s=>s.trim()),Lb=[lb[0]||'Deposit',lb[1]||'First Visit',lb[2]||'Second Visit',lb[3]||'Third Visit',lb[4]||'On Arrival'],
  X=a=>a.map(s=>s===''?'':RM+s).join('\n'),nv=trcNV(),K=r.K,tk=K>0,hasH=rows.some(x=>x.c.kind=='h'),
  hasI=pkN(PKP.ni)>0||((o.pk&&o.pk.ni)||0)>0,hasC=pkN(PKP.nc)>0||rows.some(x=>x.t.p=='cr'),
  TU=ti(T.n).toLocaleUpperCase(l),IT=(()=>{/* the treatments of the package; the free extraction and multiunit abutments of an All-on package are listed with them */
   const kw=PDB.kw.map(k=>k.toLowerCase()).filter(Boolean),isF=n=>kw.some(k=>n.toLowerCase().includes(k)),inc=(o.pk&&o.pk.inc)||[],il=x=>'• '+(x.q>0?x.q+' × ':'')+x.nm,
    a=rows.map(x=>'• '+x.q+' × '+nm(x));let at=-1;rows.forEach((x,i)=>{if(isF(x.t.n))at=i});
   a.splice(at+1,0,...inc.filter(x=>x.k=='mu').map(il));a.unshift(...inc.filter(x=>x.k!='mu'&&x.v==1).map(il));return a})(),pm=r.pm,pmOk=!!(pm&&pm.ok),fin=r.fin,
  St=trcStayV(o),Nn=i=>trcND(St[i]!=null?St[i]:0,l),
  mu1=!!(o.pk&&(o.pk.inc||[]).some(x=>x.k=='mu'&&x.v==1)),IM=['• '+ti('Implant phase'),...(mu1?['• '+ti('Multiunit abutment')]:[])],CR='• '+ti('Crowns placement'),TR='• '+ti('Treatment phase'),FN='• '+ti('Final phase'),FU='• '+ti('Follow-up and additional treatments'),
  V=(lab,i,a)=>['✈️🏨 '+lab.toLocaleUpperCase(l)+' ('+Nn(i)+')',...a],
  VIS=nv==1?V(Lb[4],0,hasI&&hasC?[...IM,CR]:hasI?IM:hasC?[CR]:[TR]):nv==2?[...V(Lb[1],0,hasI?IM:[TR]),...V(Lb[2],1,[hasC?CR:FN])]:[...V(Lb[1],0,hasI?IM:[TR]),...V(Lb[2],1,[FU]),...V(Lb[3],2,[hasC?CR:FN])],
  SEP='──────────────',vip=k=='vip',
  D=vip?['An experience like no other, featuring industry leading ultimate aesthetics and long-term performance','Enjoy full peace of mind with hotel, transfers, and many additional necessary treatments covered on the house for your convenience'].map(ti)
   :k=='pre'?[ti('An upgraded option for enhanced aesthetics and maintaining strength, offering a refined balance between beauty, durability, and comfort.')]
   :[ti('A cost-effective solution designed for natural-looking results and long-term stability.'),ti('A great choice for patients seeking long-lasting aesthetic and functional outcomes.')],
  /* what each package includes (a VIP package has many more benefits) */
  PERK=b=>vip?[['👨‍⚕️','Private Consultation with Chief Dentist'],['🏨','A Luxurious Stay In a 5 Star Hotel - Breakfast Included'],['🛩️','Private Airport and City Transfers'],
    ['🦷','Free Custom Night Guard to protect the Crowns or Veneers'],['🛡️','10-Year Warranty on Dental Restorations'],['💳','Payment Method: Complete Coverage of any added Tax On Card Payments'],['🧪','All materials used are FDA approved']].map(([e,t])=>e+' '+(b?'*'+ti(t)+'*':ti(t)))
   :[...(hasH?['🏨 '+ti('Hotel accommodation included')]:[]),'🛬 '+ti('Airport transfer included'),'🛡️ '+ti('10-Year Warranty on Dental Restorations'),'💳 '+ti('Payment Method: Cash Payment'),'🧪 '+ti('All materials used are FDA approved')],
  B=trcMsgs(o),M={};
 M.info=B.info||'';
 /* the plan messages use the message templates of the Treatment Database, exactly as the Treatment Plan Calculator does; the flight ticket is added to the first visit */
 const ln=(x,u,t)=>RM+nm(x)+' : '+x.q+' × '+f(u)+' = '+f(t),
  tkL=tk?[RM+'✈ '+ti('Flight Ticket Included: {0} (1 person only)',f(K))]:[],tkN=tk?[RM+'✈ '+ti('Flight included for 1 person only (first visit only)')]:[],
  planT=sp=>{const v=pkVis(sp,K).v,a=['• '+Lb[0]+': '+f(o.cd)];if(sp.n==1){if(v.length)a.push('• '+Lb[4]+': '+f(v[0]))}else v.forEach((x,i)=>a.push('• '+Lb[i+1]+': '+f(x)));return a},
  tok={DEPOSIT:trdN0(o.cd),CUR:o.sym.trim()};
 M.normal=trcTpl(trdTx('normal',l),{...tok,LINES:[...rows.map(x=>ln(x,x.eu,x.tot)),...tkL],TOTAL:f(r.NT),PLAN:[...planT(o.Cs),...tkN]});
  /* the Zoho Product message is only the product lines, the grand total and the final plan of the manual template: no availability, no deposit sentence, no heading, no tax info */
  if(r.zo){const ORD=['First','Second','Third'],zv=pkZohoVis(r),zl=e=>e.adjust?RM+ti('Adjustment')+' : '+(e.t<0?'-':'')+f(Math.abs(e.t)):RM+nm(e.x)+' : '+e.q+' × '+f(e.u)+' = '+f(e.t),zT=(()=>{const T=String(trdTx('manual',l)).split('\n'),a=T.findIndex(x=>x.includes('{LINES}')),b=T.findIndex(x=>x.includes('{PLAN}'));return a>=0&&b>=a?T.slice(a,b+1).join('\n'):T.join('\n')})(),
   ak=a=>a.k=='dep'?Lb[0]:ti(a.k=='in+'?'Advance Payment From the '+ORD[a.j-1]+' Visit':a.k=='out+'?'Advance Payment For the '+ORD[a.j+1]+' Visit':a.k=='in-'?'Remaining From the '+ORD[a.j-1]+' Visit':'Remaining To Be Paid In the '+ORD[a.j+1]+' Visit'),
   zvT=zv?zv.flatMap(b=>['',RM+'*'+Lb[b.i+1]+'*',...b.items.map(zl),...b.adj.map(a=>RM+ak(a)+' : '+(a.a<0?'-':'')+f(Math.abs(a.a))),RM+'*'+ti('Total')+' = '+f(b.pay)+'*']):[];
   M.zoho=trcTpl(zT,{...tok,LINES:[...r.zo.lines.map(zl),...(r.zo.adj?[zl({adjust:1,t:r.zo.adj})]:[]),...tkL],TOTAL:f(fin.tot),PLAN:[...planT(r.zo.sp),...tkN,...zvT]})}
 if(PK_ADV)M.manual=trcTpl(trdTx('manual',l),{...tok,...trcAvail(l),LINES:[...rows.map((x,i)=>pmOk?ln(x,pm.u[i],pm.t[i]):ln(x,x.eu,x.tot)),...tkL],TOTAL:f(fin.tot),PLAN:[...planT(fin.sp),...tkN]});
 if(pm)M.promo=trcTpl(trdTx('promo',l),{...tok,...trcAvail(l),PCT:pm.p+'%',STANDARD:f(r.NT),SAVING:pm.ok?f(pm.save):ti('Discount is not acceptable'),DETAILS:rows.map(x=>RM+'• '+x.q+' - '+nm(x)),PROMO:f(pm.price+K),TERMS:[...planT(pm.sp),...tkN]});
 /* the Treatment Explanation of a package: what the package is and what it includes (layout of the clinic's workbook) */
 M.exp=X(['*'+T.e+' '+TU+'*','',...(vip?D.map((x,i)=>'*'+x+'*'+(i?' ✅':' 🌟')):D.map((x,i)=>(i?'':'🦷 ')+x)),SEP,...IT,'',...VIS,...(vip?['']:[]),SEP,...(tk?['✈️ '+ti('Flight Ticket Covers First Visit')]:[]),...PERK(true),'']);
 /* the VIP package messages carry no Tax Info */
 if(vip)['manual','promo','normal'].forEach(x=>{if(M[x])M[x]=pkNoTax(M[x])});
 return M}
/* one message for the three packages: the availability and the closing lines of the Package Promoted Plan template, and for every package its normal price, its discount and its promoted price */
function pkAll(R){
 const l=trdLg(),RM=l=='ar'?'‏':'',all=PK_TIERS.map(t=>R[t.k]),any=all.filter(r=>r.o.ok&&r.o.rows.length),L=any.filter(r=>r.complete);
 if(!any.length)return{t:'',h:all.some(r=>r.o.rows.length)?'Choose a currency to create this message.':'Enter the quantity of at least one treatment to create this message.'};
 if(!L.length)return{t:'',h:'The prices of a package appear when every choice of that package is made.'};
 if(!L.some(r=>r.pm&&r.pm.ok))return{t:'',h:'Choose a valid promotion % for at least one package to create this message.'};
 const o=L[0].o,f=n=>trdFm(o.sym,n),tk=L.some(r=>r.K>0),
  T=String(trdTx('promo',l)).split('\n'),iD=T.findIndex(s=>s.includes('{DEPOSIT}')),
  tok={DEPOSIT:trdN0(o.cd),CUR:o.sym.trim(),...trcAvail(l)},
  head=iD>=0?trcTpl(T.slice(0,iD+1).join('\n'),tok):'',
  /* the All Packages Promoted Plan has no emojis and no closing lines (no tax info, no important information) */
  noE=x=>String(x).split('\n').map(q=>q.replace(EMO_RE,'').replace(/\s+$/,'')).join('\n'),
  blk=r=>{const t=PK_TIERS.find(x=>x.k==r.k),ok=r.pm&&r.pm.ok,a=[RM+'*'+t.e+' '+ti(t.n).toLocaleUpperCase(l)+'*',RM+'💰 '+ti('Normal Price: {0}',f(r.NT))];
   if(ok)a.push(RM+'🏷️ '+ti('Discount: {0}',r.pm.p+'%'),RM+'🔥 *'+ti('Promotional Price: {0}',f(r.fin.tot))+'*');
   return a.join('\n')},
  mid=L.map(blk).join('\n\n')+(tk?'\n\n'+RM+'✈ '+ti('Flight included for 1 person only (first visit only)'):'');
 return{t:noE([head,mid].filter(Boolean).join('\n\n')),h:''}}
/* ---------- screen ---------- */
/* the three input boxes open and close; what is chosen inside shows in the header of each box */
const PK_ACC=['in','ot','ap'];
function pkSum(){
 const n=f=>pkN(PKP[f]),gen=pkGen();let so=0;
 Object.keys(PKP.q).forEach(id=>{const f=trdFind(id);if(f&&!gen.has(id)&&trdOK(f.c,f.t)&&pkN(PKP.q[id])>0)so++});
 const v={in:[['Implants','ni'],['Crowns','nc'],['Hotel nights','nh']].filter(x=>n(x[1])>0).map(x=>ti(x[0])+' '+n(x[1])).join(' · '),
  ot:so?ti('{0} selected',so):'',ap:TRD_PK.filter(P=>PKP.ap[P.k].on).map(P=>P.n).join(' · ')};
 PK_ACC.forEach(k=>{const e=$('pksm_'+k);if(e&&e.textContent!==v[k])e.textContent=v[k]})}
function pkOpUp(){PK_ACC.forEach(k=>{const o=!!PKP.op[k],b=$('pkb_'+k),h=$('pkh_'+k),c=$('pkv_'+k);
 if(b)b.classList.toggle('hidden',!o);if(h)h.setAttribute('aria-expanded',o?'true':'false');if(c)c.style.transform=o?'rotate(180deg)':''})}
function pkOp(k){PKP.op[k]=!PKP.op[k];pkSave();pkOpUp()}
function pkNote(any){
 let h='';
 if(!TRD_CUR.includes(PKP.cur))h+='<p class="text-amber-700">Choose a currency to see prices and the payment plan.</p>';else if(!any)h+='<p class="text-slate-500">Enter the quantity of at least one treatment.</p>';
 if(PDB.ratesMode=='manual')h+=`<p class="text-slate-400 font-semibold">${esc(ti('Exchange rates: set manually by the admin.'))}</p>`;
 else{const ag=trdRAge();h+=`<p class="${ag!=null&&ag>3?'text-amber-700':'text-slate-400'} font-semibold">${esc(ti('Exchange rates: automatic, updated {0}.',TRD_LIVE.at)+(ag!=null&&ag>3?' '+ti('The rates may be out of date.'):''))}</p>`}
 const hid=PDB.cats.reduce((s,c)=>s+c.items.filter(t=>!trdOK(c,t)).length,0);
 if(hid)h+=`<p class="text-slate-400 font-semibold">${esc(ti('{0} treatments are not shown because their price is not set yet.',hid))}</p>`;
 $('pknote').innerHTML=h}
/* Promotion %: the usual list plus the percentages that bring the treatments exactly to the Normal or the Least price (as in the Treatment Plan Calculator) */
function pkPcOpt(r,v){
 const sp=r.spec||{},nums=[...new Set((PDB.promoC||[]).map(Number).filter(x=>x>0&&x<100))];
 if(/^[0-9.]+%$/.test(v)){const p=trdNum(v.replace('%',''));if(p>0&&!nums.includes(p))nums.push(p)}
 const A=nums.map(p=>({k:p,s:0,v:p+'%',t:p+'%'}));
 [['N','Normal Price'],['L','Least Price']].forEach(([k,n])=>{if(sp[k])A.push({k:sp[k].p,s:1,v:k,t:sp[k].p+'% — '+ti(n)})});
 A.sort((a,b)=>a.k-b.k||a.s-b.s);
 return['<option value="-">-</option>',...A.map(x=>`<option value="${x.v}"${x.v==v?' selected':''}>${esc(x.t)}</option>`)].join('')}
/* the criteria of one ticked All-on package inside one package: implant type, zygomatic type, bone graft, hybrid / Toronto, crowns, dentures */
function pkAoH(t,P,r){
 const R=trcPkR(),g=PKP.ap[P.k],s=PKP.pk[t.k].ao[P.k]||pkAo0(),jw=P.j&&+g.jaws==2?2:1,lab='text-[10px] text-slate-500 font-bold uppercase',
  sub=(x,b)=>b?`<div class="space-y-1"><div class="${lab}">${x}</div><div class="flex flex-wrap gap-x-4 gap-y-1.5 items-center">${b}</div></div>`:'',
  rd=(nm,v,cur,l,fn)=>`<label class="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"><input type="radio" name="${nm}" ${v==cur?'checked':''} onchange="${fn}" class="accent-slate-800"><span data-notr>${l}</span></label>`,
  selI=()=>`<select onchange="pkAoV('${t.k}','${P.k}','imp',this.value)" class="block border rounded p-1.5 text-xs font-bold text-slate-900 bg-white max-w-full"><option value="">Choose implant type…</option>${trdByRole('imp').map(({t:x})=>`<option value="${x.id}" data-notr${x.id==s.imp?' selected':''}>${esc(trdTn(x))}</option>`).join('')}</select>`,
  chk=x=>{const on=Object.prototype.hasOwnProperty.call(s.sel,x.id),m=trdNum(s.sel[x.id]);
   return `<label class="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer"><input type="checkbox" ${on?'checked':''} onchange="pkAoSel('${t.k}','${P.k}','${x.id}',this.checked)" class="w-4 h-4 accent-slate-800"><span data-notr>${esc(trdTn(x))}</span>${on?`<input type="number" min="0" step="1" value="${m!=null&&m>=0?m:trcSelQ(s,x,jw)}" title="${esc(ti('Quantity'))}" onclick="event.stopPropagation()" onchange="pkAoQ('${t.k}','${P.k}','${x.id}',this.value)" class="w-14 border rounded p-1 text-xs font-bold text-center bg-white">`:''}</label>`},
  grp=(x,role)=>sub(x,(role=='cr'?trcAoCr():trdByRole(role)).map(({t:y})=>chk(y)).join('')),
  per=P.z?(+g.zn==4?4:2)+trdZin(g.in):(P.k=='a4'?R.i4:R.i6)*jw,w=(r.pw||[]).filter(x=>x.k==P.k);
 let h=`<div class="flex flex-wrap items-center justify-between gap-2"><b class="text-sm" data-notr>${esc(P.n)}</b><span class="text-[10px] font-bold text-slate-500">${esc(ti('Implants: {0}',per))}</span></div>`;
 if(P.z)h+=sub('Zygomatic implant type',trdByRole('zyg').map(({t:x})=>rd('pkz_'+t.k,x.id,s.zt,esc(trdTn(x)),`pkAoV('${t.k}','${P.k}','zt','${x.id}')`)).join(''));
 h+=sub('Implant type',selI());
 h+=grp('Bone graft & sinus lift','bs')+grp('Hybrid / Toronto','pro');
 if(P.c)h+=grp('Crowns','cr');
 h+=grp('Dentures','tmp');
 h+=`<div class="text-[10px] font-bold text-amber-700 space-y-0.5" data-notr>${w.map(x=>`<p>${esc(x.m)}</p>`).join('')}</div>`;
 return `<div class="rounded-lg border border-[#a08a7c] bg-amber-50 p-3 space-y-2.5 min-w-0">${h}</div>`}
/* what the consultant chooses for one package: only what the plan contains (implant, crown(s), hotel and the criteria of the ticked All-on packages) and what is still missing */
function pkPackH(t,r){
 const P=PKP.pk[t.k],lab='block text-[10px] text-slate-500 font-bold uppercase',inp='block w-full border rounded p-1.5 mt-1 text-xs font-bold text-slate-900 normal-case bg-white',
  ni=pkN(PKP.ni),nc=pkN(PKP.nc),nh=pkN(PKP.nh),qn=n=>`<span class="text-slate-400 normal-case" data-notr>× ${n}</span>`,
  sel=(fld,list,ph)=>`<select onchange="pkPk('${t.k}','${fld}',this.value)" class="${inp}"><option value="">${esc(ti(ph))}</option>${list.map(({t:x})=>`<option value="${x.id}" data-notr${x.id==P[fld]?' selected':''}>${esc(trdTn(x))}</option>`).join('')}</select>`,
  aos=TRD_PK.filter(x=>PKP.ap[x.k]&&PKP.ap[x.k].on);
 let c='';
 if(ni>0)c+=`<label class="${lab}">${esc(ti('Implant'))} ${qn(ni)}${sel('im',pkImps(),'Choose an implant…')}</label>`;
 if(nc>0)c+=`<label class="${lab}">${esc(ti('Crown'))} ${qn(nc)}${sel('cr',pkCrs(),'Choose a crown…')}</label>`;
 if(nh>0)c+=`<label class="${lab}">${esc(ti('Hotel'))} ${qn(nh)}${sel('ho',pkHots(),'Choose a hotel…')}</label>`;
 c+=aos.map(x=>pkAoH(t,x,r)).join('');
 if(!c)c=`<p class="text-xs text-slate-500 italic">${esc(ti('Enter implants, crowns or hotel nights, or tick an All-on package.'))}</p>`;
 let w='';
 if(r.warn.length)w=`<div class="text-[10px] font-bold text-amber-700 space-y-0.5">${r.warn.map(w=>`<p>${esc(ti(w))}</p>`).join('')}</div>`;
 return c+w}
function pkCard(t,r){
 const P=PKP.pk[t.k],o=r.o,f=n=>trdFm(o.sym||'',n),ok=!!(o.ok&&o.rows.length),pm=r.pm,pmOk=!!(pm&&pm.ok),
  lab='block text-[10px] text-slate-500 font-bold uppercase',inp='block w-full border rounded p-1.5 mt-1 text-xs font-bold text-slate-900 normal-case bg-white';
 let h=`<div class="px-3 py-2 ${t.c} flex flex-wrap justify-between items-center gap-2"><b class="text-xs uppercase" data-notr>${t.e} ${esc(ti(t.n))}</b><span class="text-sm font-bold" data-notr>${ok?f(r.fin.tot):''}</span></div>`;
 const cap=x=>`<div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">${x}</div>`;
 let pk=cap('Packaging')+pkPackH(t,r);
 let pr=cap('Pricing');
 if(!o.ok)pr+=`<p class="text-xs text-amber-700 font-semibold">Choose a currency to see prices and the payment plan.</p>`;
 else if(!o.rows.length)pr+=`<p class="text-xs text-slate-500 italic">Enter the quantity of at least one treatment.</p>`;
 else{
  const ps='style="padding:4px 5px"',L=o.rows.map((x,i)=>`<tr><td ${ps} class="text-center" data-notr>${x.q}</td><td ${ps} class="whitespace-normal" data-notr>${esc(trdTn(x.t))}</td><td ${ps} data-notr>${f(x.eu)}</td><td ${ps} class="font-bold" data-notr>${f(x.tot)}</td>${pmOk?`<td ${ps} class="font-bold text-amber-700" data-notr>${f(pm.t[i])}</td>`:''}</tr>`).join('');
  pr+=`<div class="overflow-x-auto"><table><thead><tr>${['Qty','Treatment','Unit Price','Total'].concat(pmOk?['Promoted Price']:[]).map(x=>`<th ${ps}>${x}</th>`).join('')}</tr></thead><tbody>${L}</tbody></table></div>`;
  /* the three prices, each with its payment plan (as in the Treatment Plan Calculator) */
  const df=(d,p)=>p==null?'':trcRowR('Difference from High Price',f(d)+trcPct(p),'text-purple-700'),
   box=(k,cl,sp,tot,x)=>`<div class="rounded-xl border ${o.tier==k?'border-slate-800 ring-2 ring-slate-800':'border-slate-200'} overflow-hidden bg-white min-w-0"><div class="px-3 py-2 ${cl} text-xs font-bold uppercase flex flex-wrap justify-between items-center gap-x-3 gap-y-1"><span>${trcTierName(k)}</span><label class="inline-flex items-center gap-1.5 text-[10px] normal-case cursor-pointer"><input type="checkbox" ${o.tier==k?'checked':''} onchange="pkUse('${t.k}','${k}')" class="w-4 h-4 accent-slate-800"><span>Use for this package</span></label></div>${trcPlanH(sp,PDB.deposit,tot,f)}${x||''}</div>`;
  pr+=`<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">${box('l','bg-emerald-100 text-emerald-900',o.Ls,o.Lt,df(o.dHL,o.pHL))}${box('n','bg-indigo-100 text-indigo-900',o.Ns,o.Nt,df(o.dHN,o.pHN))}${box('h','bg-rose-100 text-rose-900',o.Hs,o.Ht,'')}</div>`;
  /* promotion */
  pr+=`<div class="space-y-1"><div class="${lab}"><span>Promotion %</span><div class="flex gap-2"><select onchange="pkPk('${t.k}','pc',this.value)" class="${inp}">${pkPcOpt(r,String(P.pc==null?'-':P.pc))}</select><input type="number" min="0" max="99" step="any" placeholder="${esc(ti('Other %'))}" title="${esc(ti('Other %'))}" onchange="pkPc(this,'${t.k}')" class="${inp} max-w-[6rem]"></div></div><p class="text-[10px] text-slate-500">The percentage covers the treatments only, not the hotel. The prices and the total below include the hotel, so the saving on the total is a little less than the percentage.</p></div>`;
  const R=[trcRowR(trcTierName(o.tier),f(r.N),'text-indigo-700')];
  if(r.K>0)R.push(trcRowR('Flight Ticket',f(r.K)));
  if(pm){if(pmOk){R.push(trcRowR('Promoted Price',f(pm.price),'text-amber-700'));R.push(trcRowR('Saving',f(pm.save),'text-purple-700'))}else R.push(trcRowR('Promotion',trcNo()))}
  R.push(trcRowR('Total',f(r.fin.tot),'text-slate-900'));
  if(pmOk)R.push(trcRowR('OFF',r.off+'%','text-purple-700'));
  pr+=`<div class="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">${trcBox('Package price','bg-slate-100 text-slate-800',R.join(''))}${trcBox('Payment plan','bg-slate-100 text-slate-800',trcPlanH(pkVis(r.fin.sp,r.K),o.cd,r.fin.tot,f))}</div>`}
 h+=`<div class="p-3 grid grid-cols-1 xl:grid-cols-2 gap-4 items-start"><div class="space-y-3 min-w-0">${pk}</div><div class="space-y-3 min-w-0">${pr}</div></div>`;
 return `<div class="rounded-xl border border-slate-200 overflow-hidden bg-white min-w-0">${h}</div>`}
/* the three prices of every package in every currency (the plan in the Treatment Plan Calculator style); the tick chooses the price list the package is built on */
function pkTot(R){
 const Rt=trdRates(),ps='style="padding:4px 5px"',T=(rows,c,k)=>trdRU(rows.reduce((s,x)=>s+x.q*x[k],0)*Rt[c]);let b='',any=false,K=0;
 PK_TIERS.forEach(t=>{const r=R[t.k],rows=r.o.rows,ok=rows.length>0&&r.complete;if(rows.length)any=true;if(r.K>K)K=r.K;
  b+=`<tr><td ${ps} colspan="${TRD_CUR.length+1}" class="font-bold uppercase text-[10px] ${t.c}" data-notr>${t.e} ${esc(ti(t.n))}</td></tr>`;
  [['l','lp','text-emerald-700'],['n','np','text-indigo-700'],['h','hp','text-rose-700']].forEach(([k,pk,cl])=>{
   b+=`<tr><td ${ps}><label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" ${PKP.pk[t.k].tier==k?'checked':''} onchange="pkUse('${t.k}','${k}')" class="w-4 h-4 accent-slate-800"><span>${trcTierName(k)}</span></label></td>${TRD_CUR.map(c=>`<td ${ps} class="text-center ${cl}" data-notr>${ok?trdFm(TRD_SYM[c],T(rows,c,pk)):'—'}</td>`).join('')}</tr>`})});
 return any?`<div class="rounded-xl border border-slate-200 overflow-x-auto"><table><thead><tr><th ${ps}>Selected totals</th>${TRD_CUR.map(c=>`<th ${ps} class="text-center">${c}</th>`).join('')}</tr></thead><tbody>${b}</tbody></table></div>${PKP.tk?`<p class="text-[10px] text-slate-500 mt-1">${esc(ti('The flight ticket is not included in these prices.'))}</p>`:''}${PK_TIERS.some(t=>R[t.k].o.rows.length&&!R[t.k].complete)?`<p class="text-[10px] text-amber-700 font-semibold mt-1">${esc(ti('The prices of a package appear when every choice of that package is made.'))}</p>`:''}`:''}
const PK_CARDS=[['','Plan messages'],['exp','Treatment Explanation'],['normal','Normal Plan'],['manual','Individual Price Promoted Plan'],['','Package messages'],['promo','Package Promoted Plan'],['all','All Packages Promoted Plan']];
/* one message card: title, Copy button, the appointment-dates hint where it applies and the text (or what is missing) */
function pkMc(k,t,r,A){
 const o=r.o,M=PK_M,
  hint=k=>k=='all'?A.h:k=='info'&&o.rows.length?'None of the selected treatments has a patient explanation yet.':!o.ok&&k!='exp'&&k!='info'?'Choose a currency to create this message.':!o.rows.length?'Enter the quantity of at least one treatment to create this message.':'Choose a valid promotion % for this package to create this message.',
  ix=k=>{if(k=='manual'||k=='promo'||k=='all')return trcAvNote();if(k!='info'||!o.rows.length||!r.I)return'';const I=r.I;return I.blocks.length||I.miss.length?`<div class="px-3 pt-2 text-[10px] space-y-1"><div class="flex flex-wrap gap-1" data-notr>${I.blocks.map(b=>`<span class="bg-emerald-50 text-emerald-800 rounded px-1.5 py-0.5 font-bold">${esc(b.t)}</span>`).join('')}</div>${I.miss.length?`<p class="text-amber-700 font-semibold"><span>No explanation yet for:</span> <span data-notr>${esc(I.miss.map(t=>trdTn(t)).join(', '))}</span></p>`:''}</div>`:''};
 return `<div class="rounded-xl border border-slate-200 overflow-hidden bg-white"><div class="px-3 py-2 bg-slate-900 flex flex-wrap items-center justify-between gap-2"><b class="lux text-[#a08a7c] text-xs uppercase tracking-wider">${t}</b><div class="flex items-center gap-2"><button type="button" onclick="pkCopy('${k}')" class="g rounded px-2 py-1 text-[10px] font-bold uppercase">Copy</button></div></div>${ix(k)}<div class="p-2">${M[k]?`<textarea id="pkm_${k}" readonly data-notr dir="auto" style="unicode-bidi:plaintext" rows="${k=='info'||k=='exp'||k=='all'?18:14}" class="w-full border rounded p-2 text-xs font-semibold bg-slate-50">${esc(M[k])}</textarea>`:`<p class="text-xs text-slate-500 italic p-2">${hint(k)}</p>`}</div></div>`}
function pkMsg(r,A){
 const M=r.M||{};M.all=A.t;PK_M=M;
 $('pkm').innerHTML=PK_CARDS.map(([k,t])=>k===''?`<div style="grid-column:1/-1" class="text-[10px] font-bold uppercase tracking-wider text-slate-500 pt-1">${t}</div>`:pkMc(k,t,r,A)).join('');if(window.EX)EX.decorate('pkm','calc','pkm:')}
async function pkCopy(k){
 const t=PK_M[k];if(!t)return;
 try{await navigator.clipboard.writeText(t);toast(ti('Copied.'))}
 catch(e){const x=$('pkm_'+k);let ok=false;if(x){x.focus();x.select();try{ok=document.execCommand('copy')}catch(y){}}toast(ok?ti('Copied.'):ti('Select the text and copy it manually.'))}}
/* one message of one package (Copy plan = the Treatment Explanation of the package, Normal Prices, Individual Price Promoted Plan, Package Promoted Plan) */
async function pkCopyM(k,m){
 const t=(PK_MS[k]||{})[m];if(!t)return;
 try{await navigator.clipboard.writeText(t);toast(ti('Copied.'))}
 catch(e){const x=document.createElement('textarea');x.value=t;x.setAttribute('readonly','');x.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(x);x.focus();x.select();let ok=false;try{ok=document.execCommand('copy')}catch(y){}x.remove();toast(ok?ti('Copied.'):ti('Select the text and copy it manually.'))}}
/* ---------- PDF of the packages: the three packages with their prices and payment plans, then the Normal Prices and the Zoho Product message of every package (same look as the PDF of the Treatment Plan Calculator) ---------- */
/* the text of one message exactly as it is copied: every line, every blank line and the spaces at the start of a line are kept (white-space:pre-wrap); a long message is cut in blocks of 8 lines so a page can end between them, and a blank line is exactly one line of space */
function pkPdfTxt(s){
 const L=String(s).replace(/\s+$/,'').split('\n'),P=[];let cur=[];
 L.forEach(q=>{if(/^[\s\u200f]*$/.test(q)){if(cur.length){P.push({t:cur,g:1});cur=[]}else if(P.length)P[P.length-1].g++}else cur.push(q)});
 if(cur.length)P.push({t:cur,g:0});
 return P.map(p=>{const out=[];for(let i=0;i<p.t.length;i+=8)out.push({t:p.t.slice(i,i+8),g:i+8>=p.t.length?p.g:0});return out.map(b=>`<div class="pavoid" dir="auto" data-g="${b.g}" style="white-space:pre-wrap;unicode-bidi:plaintext;font-size:10.5px;line-height:1.6;color:#20256b;margin:0 0 ${(b.g*1.6).toFixed(1)}em">${esc(b.t.join('\n'))}</div>`).join('')}).join('')}
function pkPdfData(){
 const R={};PK_TIERS.forEach(t=>{R[t.k]=pkCalc(t.k,true)});
 return{R,L:PK_TIERS.map(t=>R[t.k]).filter(r=>r.o.ok&&r.o.rows.length&&r.complete)}}
function pkPdfCheck(D){
 if(!TRD_CUR.includes(PKP.cur))return'Choose a currency before downloading the PDF.';
 if(!PK_TIERS.some(t=>D.R[t.k].o.rows.length))return'Enter the quantity of at least one treatment first.';
 if(!D.L.length)return'The prices of a package appear when every choice of that package is made.';
 return''}
function pkPdfAsk(){
 pkEnsure();
 const bad=pkPdfCheck(pkPdfData());if(bad)return toast(ti(bad));
 if($('pkpm'))return;
 const lab='block text-[10px] text-slate-500 font-bold uppercase',inp='block w-full border rounded p-2 mt-1 text-sm font-bold text-slate-900 normal-case bg-white',d=document.createElement('div');
 d.id='pkpm';d.className='fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4';
 d.addEventListener('keydown',e=>{if(e.key=='Escape')pkPdfX()});
 d.addEventListener('mousedown',e=>{if(e.target===d)pkPdfX()});
 d.innerHTML=`<form onsubmit="return pkPdfGo(event)" class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4"><h3 class="lux font-bold text-base">Download the plan as PDF</h3><p class="text-xs text-slate-500">Write the patient name and the kit number. Both are printed on the PDF.</p><label class="${lab}">Patient name<input id="pkpt" autocomplete="off" value="${esc(PKP.pt||'')}" class="${inp}"></label><label class="${lab}">Kit number<input id="pkkit" autocomplete="off" value="${esc(PKP.kit||'')}" class="${inp}"></label><div class="flex flex-wrap justify-end gap-2 text-xs font-bold uppercase"><button type="button" onclick="pkPdfX()" class="bg-slate-200 rounded px-4 py-2">Cancel</button><button type="submit" class="bg-slate-800 text-white rounded px-4 py-2">⬇ Download PDF</button></div></form>`;
 document.body.appendChild(d);
 ['pkpt','pkkit'].forEach(i=>$(i).addEventListener('input',e=>e.target.classList.remove('border-red-500','ring-1','ring-red-500')));
 $('pkpt').focus()}
function pkPdfX(){const d=$('pkpm');if(d)d.remove()}
function pkPdfGo(ev){if(ev&&ev.preventDefault)ev.preventDefault();
 const a=$('pkpt'),b=$('pkkit');if(!a||!b)return false;
 const nm=a.value.trim(),kt=b.value.trim();
 if(!nm||!kt){const x=!nm?a:b;x.classList.add('border-red-500','ring-1','ring-red-500');x.focus();toast(ti('Please write the patient name and the kit number first.'));return false}
 PKP.pt=nm;PKP.kit=kt;pkSave();pkPdfX();pkPdfRun(nm,kt);return false}
async function pkPdfRun(pt,kit){
 if(TRC_BUSY)return;
 const dl=await kcDl();if(!dl)return toast(ti('Saving files is not available in this view.'));
 TRC_BUSY=true;
 try{
  const D=pkPdfData(),bad=pkPdfCheck(D);if(bad)return toast(ti(bad));
  toast(ti('Preparing the PDF…'));
  try{await document.fonts.ready}catch(x){}
  const l=trdLg(),wrap=document.createElement('div');wrap.style.cssText='position:fixed;left:-10000px;top:0;width:794px';
  const el=document.createElement('div');el.className='tcp';el.setAttribute('dir',l=='ar'?'rtl':'ltr');
  el.style.cssText="width:794px;padding:26px 38px;box-sizing:border-box;background:#ffffff;color:#161a59;font-family:Montserrat,'Noto Sans Arabic',sans-serif";
  el.innerHTML=pkPdfHtml({...D,l,pt,kit,at:new Date().toISOString()});
  wrap.appendChild(el);document.body.appendChild(wrap);
  const fn=(ti('Package Plan')+' - '+pt+' - '+kit).replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim()+'.pdf';
  try{const blob=await html2pdf().set({margin:[10,0,10,0],image:{type:'jpeg',quality:0.98},html2canvas:{onclone:thmLight,scale:2,backgroundColor:'#ffffff',scrollX:0,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:'.pavoid'}}).from(el).outputPdf('blob');
   await dl.save({filename:fn,data:blob})}catch(x){if(!x||x.code!='declined')toast(ti('Could not create the PDF.'))}
  wrap.remove()}
 finally{TRC_BUSY=false}}
function pkPdfHtml(D){
 const {R,L,l,pt,kit,at}=D,o0=L[0].o,GD='#8a7466',GL='rgba(160,138,124,.5)',NV='#161a59',cin="Lato,Montserrat,'Noto Sans Arabic',sans-serif",f=n=>trdFm(o0.sym,n),
  lbl=String(trdTx('lb',l)).split('\n').map(s=>s.trim()),Lb=[lbl[0]||'Deposit',lbl[1]||'First Visit',lbl[2]||'Second Visit',lbl[3]||'Third Visit',lbl[4]||'On Arrival'],
  H=t=>`<div class="pavoid" style="margin:18px 0 8px;font-family:${cin};font-size:12px;font-weight:700;color:${GD};text-transform:uppercase;letter-spacing:.12em;border-bottom:1px solid ${GL};padding-bottom:4px">${esc(t)}</div>`,
  dt=(()=>{try{return new Date(at).toLocaleDateString(LANGS[trdLn(l)][2],{dateStyle:'medium'})}catch(e){return String(at).slice(0,10)}})(),
  info=(k,v)=>`<div style="display:flex;gap:6px;align-items:baseline;font-size:10.5px;line-height:1.6"><span style="color:#6e7099;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;min-width:84px">${esc(k)}</span><b dir="auto" style="unicode-bidi:plaintext">${esc(v)}</b></div>`,
  head=`<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid ${GL};padding-bottom:12px"><div style="display:flex;align-items:center;gap:12px"><div style="background:${NV};color:#a08a7c;font-family:Lato,Montserrat,sans-serif;font-weight:700;font-size:13px;letter-spacing:.02em;width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center">EOP</div><div><div style="font-family:Lato,Montserrat,sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;color:${NV}">EXECUTIVE OPERATIONS PORTAL</div><div style="font-size:9px;font-weight:700;letter-spacing:.2em;color:#a08a7c;margin-top:4px;text-transform:uppercase">${esc(ti('Package Plan'))}</div></div></div><div style="min-width:0">${info(ti('Patient name'),pt)}${info(ti('Kit number'),kit)}${info(ti('Date'),dt)}${info(ti('Currency'),o0.cur)}${info(ti('Visits'),ti(PKP.vis))}${me!='admin'?info(ti('Consultant'),me):''}</div></div>`,
  pr=(a,b,c,col)=>`<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:${c?'11':'10'}px;padding:4px 10px;border-bottom:1px solid #e3ddd8${c?';font-weight:800':''}"><span style="color:#4b4f80">${esc(a)}</span><b dir="ltr" style="unicode-bidi:isolate;${col?'color:'+col:''}">${esc(b)}</b></div>`,
  plan=(sp,dep,total)=>{let h=pr(Lb[0],f(dep));if(sp.n==1){if(sp.v.length)h+=pr(Lb[4],f(sp.v[0]))}else sp.v.forEach((x,i)=>{h+=pr(Lb[i+1],f(x))});return h+pr(ti('Total'),f(total),1)},
  COL={std:['#e0f2fe','#0c4a6e'],pre:['#e0e7ff','#312e81'],vip:['#fef3c7','#78350f']},
  box=t=>{const r=R[t.k],ok=r.o.ok&&r.o.rows.length&&r.complete,pm=r.pm,pmOk=!!(pm&&pm.ok),c=COL[t.k],o=r.o;
   let b='';
   if(!ok)b=`<div style="font-size:9.5px;color:#92400e;padding:8px 10px">${esc(ti('The prices of a package appear when every choice of that package is made.'))}</div>`;
   else{
    const inc=(o.pk&&o.pk.inc)||[],li=pkIncL(o,l).map(x=>`<li>${x.q>0?`<b>${x.q}</b> × `:''}${esc(x.nm)}</li>`).join('');
    b=`<div style="padding:8px 10px 6px"><div style="font-size:8.5px;font-weight:800;color:#6e7099;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">${esc(ti('Includes'))}</div><ul style="margin:0;padding-inline-start:14px;font-size:9.5px;line-height:1.55;color:#20256b">${li}</ul></div>`
     +pr(ti('Package price'),f(r.NT),0,'#4338ca')+pr(ti('Discount Applied'),pmOk?pm.p+'%':'—',0,'#7e22ce')+pr(ti('Promoted Price'),pmOk?f(r.fin.tot):'—',1,'#b45309')
     +(pm&&!pmOk?`<div style="font-size:9.5px;font-weight:700;color:#b45309;padding:4px 10px">${esc(ti('Discount is not acceptable'))}</div>`:'')
     +`<div style="background:#efe9e3;font-size:8.5px;font-weight:800;color:#4b4f80;text-transform:uppercase;letter-spacing:.06em;padding:4px 10px;margin-top:6px">${esc(ti('Payment plan'))}</div>`+plan(r.fin.sp,o.cd,r.fin.tot)}
   return `<div style="flex:1 1 200px;min-width:0;border:1px solid #d8cfc8;border-radius:8px;overflow:hidden"><div style="background:${c[0]};color:${c[1]};padding:7px 10px"><div style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em">${esc(ti(t.n))}</div></div>${b}</div>`},
  txt=(t,s)=>s?H(t)+pkPdfTxt(s):'',
  foot=``;
 /* 1. the three packages side by side, 2. the Normal Prices and the Zoho Product message of every package */
 let msgs='';
 PK_TIERS.forEach(t=>{const r=R[t.k];if(!(r.o.ok&&r.o.rows.length&&r.complete))return;const M=r.M||{},pn=ti(t.n);
  msgs+=txt(pn+' — '+ti('Normal Prices'),M.normal)+txt(pn+' — Zoho Product',M.zoho)});
 return (l=='ar'?'<style>.tcp *{letter-spacing:normal!important}</style>':'')+head
  +H(ti('Packages'))+`<div class="pavoid" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start">${PK_TIERS.map(box).join('')}</div>`
  +msgs+foot}
function pkOut(){
 if(PKP.mode!='a')return pkOutS();
 const R={};PK_TIERS.forEach(t=>{R[t.k]=pkCalc(t.k,t.k==PKP.sel)});
 pkNote(PK_TIERS.some(t=>R[t.k].o.rows.length));pkSum();
 $('pkt').innerHTML=pkTot(R);
 /* one tab per package: its packaging, its pricing and its messages */
 const cur=PK_TIERS.find(x=>x.k==PKP.sel)||PK_TIERS[0];
 $('pkmt').innerHTML=PK_TIERS.map(t=>{const r=R[t.k],ok=r.o.ok&&r.o.rows.length;
  return `<button type="button" onclick="pkTier('${t.k}')" class="px-4 py-2 rounded-lg text-xs font-bold text-left ${t.k==cur.k?'bg-slate-900 text-[#a08a7c]':'bg-slate-200 text-slate-700'}" data-notr>${t.e} ${esc(ti(t.n))}<span class="block text-[10px] font-semibold opacity-80">${ok?trdFm(r.o.sym,r.fin.tot):'—'}</span></button>`}).join('');
 $('pkc').innerHTML=pkCard(cur,R[cur.k]);
 pkMsg(R[cur.k],pkAll(R));pkPsSel();pkHnUp()}
/* ---------- the simple view: the three packages with their prices, and one message to copy ---------- */
let PK_MS={},PK_SO=new Set(),PK_SX=new Set();
const pkHd=(n,t,h)=>`<div class="px-3 py-2 bg-slate-900 flex flex-wrap justify-between items-center gap-2"><b class="lux text-[#a08a7c] text-xs uppercase tracking-wider"><span data-notr style="display:inline-flex;align-items:center;justify-content:center;width:1.25rem;height:1.25rem;border-radius:9999px;background:#a08a7c;color:#161a59;font-size:10px;margin-right:.5rem">${n}</span>${t}</b>${h?`<span class="text-[10px] font-bold uppercase text-slate-300">${h}</span>`:''}</div>`;
function pkSo(el){const k=el.dataset.so,au=el.dataset.auto=='1';if(el.open){if(!au)PK_SO.add(k);PK_SX.delete(k)}else{PK_SO.delete(k);if(au)PK_SX.add(k)}}
/* the payment plan of a package (Deposit, the visits, Total): the plan of the promoted price, or of the package price while no promotion is chosen */
function pkPlanRows(r){
 const l=trdLg(),lb=String(trdTx('lb',l)).split('\n').map(x=>x.trim()),Lb=[lb[0]||'Deposit',lb[1]||'First Visit',lb[2]||'Second Visit',lb[3]||'Third Visit',lb[4]||'On Arrival'],sp=pkVis(r.fin.sp,r.K||0),rows=[[Lb[0],r.o.cd]];
 if(sp.n==1){if(sp.v.length)rows.push([Lb[4],sp.v[0]])}else sp.v.forEach((x,i)=>rows.push([Lb[i+1],x]));
 return{rows,total:r.fin.tot}}
/* one package: what it contains, its normal price, the promotion and the promoted price; the choices of the package are one click away */
function pkRowS(t,r){
 const P=PKP.pk[t.k],o=r.o,f=n=>trdFm(o.sym||'',n),ok=!!(o.ok&&o.rows.length),pm=r.pm,pmOk=!!(pm&&pm.ok),show=ok&&r.complete,
  lab='text-[10px] text-slate-500 font-bold uppercase',inp='border rounded p-1.5 text-xs font-bold text-slate-900 normal-case bg-white',
  aos=TRD_PK.some(x=>PKP.ap[x.k]&&PKP.ap[x.k].on),key='chg_'+t.k,open=PK_SO.has(key)||(aos&&!PK_SX.has(key)),
  inc=(o.pk&&o.pk.inc)||[],
  li=ok?pkIncL(o,trdLg()).map(x=>`<li>${x.q>0?`<b>${x.q}</b> × `:''}${esc(x.nm)}</li>`).join(''):'',
  row=(l,v,c)=>`<div class="flex justify-between items-baseline gap-3 py-1 border-b border-slate-100"><span class="text-xs text-slate-600">${l}</span><b class="${c||'text-slate-900'}" data-notr>${v}</b></div>`;
 /* order inside a package: what it includes, Package price, Discount Applied, Promoted Price, then the choices and the promotion, then the copy buttons */
 let msg='',prices='',promo='',btns='';
 if(!o.ok)msg=`<p class="text-xs text-amber-700 font-semibold">Choose a currency to see prices and the payment plan.</p>`;
 else if(!o.rows.length)msg=`<p class="text-xs text-slate-500 italic">Enter the quantity of at least one treatment.</p>`;
 else if(!show)msg=`<div class="text-[10px] font-bold text-amber-700 space-y-0.5">${(r.warn.length?r.warn.map(w=>ti(w)):[ti('The prices of a package appear when every choice of that package is made.')]).map(w=>`<p>${esc(w)}</p>`).join('')}</div>`;
 else{
  prices=row(esc(ti('Package price')),f(r.NT),'text-indigo-700');
  prices+=row(esc(ti('Discount Applied')),pmOk?pm.p+'%':'—','text-purple-700')+row(esc(ti('Promoted Price')),pmOk?f(r.fin.tot):'—','text-amber-700 text-base');
  if(pm&&!pmOk)prices+=`<p class="text-xs font-bold text-amber-700 pt-1">${esc(ti('Discount is not acceptable'))}</p>`;
  {const pp=pkPlanRows(r);prices+=`<div class="mt-2 px-2 py-1 text-[10px] font-bold uppercase text-slate-600" style="background:#efe9e3;letter-spacing:.06em">${esc(ti('Payment plan'))}</div>`+pp.rows.map(([a,b])=>row(esc(a),f(b))).join('')+row('<b>'+esc(ti('Total'))+'</b>',f(pp.total),'text-slate-900 text-base')}
  promo=`<div class="space-y-1"><div class="${lab}">${esc(ti('Promotion %'))}</div><select onchange="pkPk('${t.k}','pc',this.value)" class="${inp} block w-full">${pkPcOpt(r,String(P.pc==null?'-':P.pc))}</select><p class="text-[10px] text-slate-500">${esc(ti('The percentage covers the treatments only, not the hotel. The prices and the total below include the hotel, so the saving on the total is a little less than the percentage.'))}</p></div>`;
  /* the messages of the package, one button each */
  const M=PK_MS[t.k]||{},bt=(m,l,on,pri)=>`<button type="button" ${on?`onclick="pkCopyM('${t.k}','${m}')"`:'disabled'} class="${pri?'g':'bg-slate-200 text-slate-800'} w-full rounded px-3 py-2 text-[11px] font-bold uppercase ${on?'':'opacity-40 cursor-not-allowed'}">${l}</button>`;
  btns=`<div class="flex flex-col gap-1.5 pt-1">${bt('exp','Copy plan',!!M.exp,1)}${bt('normal','Normal Prices',!!M.normal)}${bt('promo','Package Promoted Plan',pmOk&&!!M.promo)}${bt('zoho','<span data-notr>Zoho Product</span>',pmOk&&!!M.zoho)}</div>`}
 const head=`<div class="px-3 py-2 ${t.c}"><div class="flex flex-wrap justify-between items-center gap-2"><b class="text-xs uppercase" data-notr>${esc(ti(t.n))}</b><span class="text-sm font-bold" data-notr>${show?f(r.fin.tot):''}</span></div></div>`,
  chg=`<details data-so="${key}" data-auto="${open&&!PK_SO.has(key)?1:''}" ontoggle="pkSo(this)" ${open?'open':''}><summary class="cursor-pointer select-none text-[11px] font-bold text-sky-800">${esc(ti('Change the implant, crown or hotel'))}</summary><div class="pt-2 space-y-3">${pkPackH(t,r)}</div></details>`;
 return `<div class="rounded-xl border border-slate-200 overflow-hidden bg-white min-w-0">${head}<div class="p-3 space-y-3"><div class="min-w-0 space-y-2"><div class="${lab}">${esc(ti('Includes'))}</div>${li?`<ul class="text-xs text-slate-800 space-y-0.5 list-disc pl-4" data-notr>${li}</ul>`:`<p class="text-xs text-slate-500 italic">${esc(ti('Enter implants, crowns or hotel nights, or tick an All-on package.'))}</p>`}</div>${msg?`<div class="min-w-0">${msg}</div>`:''}${prices?`<div class="min-w-0">${prices}</div>`:''}<div class="min-w-0">${chg}</div>${promo}${btns}<div id="pkx_${t.k}" class="min-w-0"></div></div></div>`}
function pkSimpleH(R,A,cur){
 const rows=PK_TIERS.map(t=>pkRowS(t,R[t.k])).join('');
 return `<div class="rounded-xl border border-slate-200 overflow-hidden bg-white">${pkHd(4,'Packages','')}<div class="p-3 space-y-3"><div class="grid gap-3 items-start" style="grid-template-columns:repeat(auto-fit,minmax(17rem,1fr))">${rows}</div></div></div>`
  +`<div class="rounded-xl border border-slate-200 overflow-hidden bg-white">${pkHd(5,'Message to send','')}<div class="p-3" id="pkma"></div></div>`}
function pkOutS(){
 document.querySelectorAll('#pksimple details[data-so]').forEach(pkSo);
 pkEnsure();
 const R={};PK_TIERS.forEach(t=>{R[t.k]=pkCalc(t.k,true)});
 pkNote(PK_TIERS.some(t=>R[t.k].o.rows.length));pkSum();
 PK_MS={};PK_TIERS.forEach(t=>{PK_MS[t.k]=R[t.k].M||{}});
 const cur=PK_TIERS.find(x=>x.k==PKP.sel)||PK_TIERS[0],A=pkAll(R);
 $('pksimple').innerHTML=pkSimpleH(R,A,cur);
 if(window.EX){PK_TIERS.forEach(t=>{const q=R[t.k].o,ho=PKP.pk[t.k].ho,ht=ho?q.rows.find(x=>x.t&&x.t.id==ho):null;
   EX.render('pkx_'+t.k,{rows:q.rows,pk:{info:(q.pk&&q.pk.info)||[],inc:(q.pk&&q.pk.inc)||[]},title:'Explanations & photos',compact:true,stay:{any:q.rows.length>0,hn:ht?ht.t.n:''}})});
  const px=$('pkx');if(px){px.innerHTML='';delete px.dataset.sig}}
 /* the message to send: all packages with the availability */
 const r0=R[cur.k];PK_M={...(r0.M||{}),all:A.t};$('pkma').innerHTML=pkMc('all','All Packages Promoted Plan',r0,A);if(window.EX)EX.decorate('pkma','calc','pkm:');
 pkPsSel();pkHnUp()}
function pkPsOpt(){
 const n=pkNV(),sp=PDB.split,pc=a=>a.map(x=>x+'%').join(' / '),
  rule=n==2?[sp[2][0],100-sp[2][0]]:n==3?[sp[3][0],sp[3][1],100-sp[3][0]-sp[3][1]]:[100],eq=n==2?[50,50]:n==3?[33,33,33]:[100],v=PKP.ps=='e'||PKP.ps=='v'?PKP.ps:'r';
 return[['r',ti('Rule: {0}',pc(rule))],['e',ti('Equal split: {0}',pc(eq))],['v',ti('By visit: the treatments and hotel nights of each visit')]].map(([k,t])=>`<option value="${k}"${k==v?' selected':''}>${esc(t)}</option>`).join('')}
function pkPsSel(){const e=$('pkps');if(!e)return;e.innerHTML=pkPsOpt();e.disabled=pkNV()==1}
/* nights per visit of the hotel: 3 nights in the first visit and the rest in the next visits, unless the consultant types her own numbers */
function pkHnA(){const nv=pkNV(),nh=pkN(PKP.nh);return Array.isArray(PKP.hn)&&PKP.hn.length==nv?PKP.hn.map(x=>Math.max(0,Math.round(+x||0))):trcCaps(nh,nv)}
function pkHnH(){const nv=pkNV(),nh=pkN(PKP.nh);if(nv<2||nh<1)return'';const a=pkHnA(),sum=a.reduce((x,y)=>x+y,0);
 return `<div class="flex flex-wrap items-center gap-2 text-[10px] font-bold text-sky-900"><span class="uppercase">Nights per visit</span>${a.map((v,i)=>`<label class="inline-flex items-center gap-1"><span>${esc(ti(['First Visit','Second Visit','Third Visit'][i]))}</span><input type="number" min="0" step="1" value="${v}" onchange="pkHn(${i},this.value)" class="w-14 border rounded p-1 text-xs font-bold text-center bg-white"></label>`).join('')}<span data-w class="text-amber-700" data-notr>${sum!=nh?esc(ti('The nights per visit add up to {0}, but {1} nights are selected.',sum,nh)):''}</span></div>`}
function pkHnUp(){const e=$('pkhn');if(!e)return;const nv=pkNV(),nh=pkN(PKP.nh);
 if(nv<2||nh<1){if(e.innerHTML)e.innerHTML='';return}
 const ins=e.querySelectorAll('input');
 if(ins.length!=nv){e.innerHTML=pkHnH();return}
 const a=pkHnA(),sum=a.reduce((x,y)=>x+y,0);ins.forEach((x,i)=>{if(document.activeElement!==x)x.value=a[i]});
 const w=e.querySelector('span[data-w]');if(w)w.textContent=sum!=nh?ti('The nights per visit add up to {0}, but {1} nights are selected.',sum,nh):''}
function pkHn(i,v){const a=pkHnA();a[i]=Math.max(0,Math.round(trdNum(v)||0));PKP.hn=a;pkSave();pkOut()}
/* the other treatments: the same categories as the Treatment Database, without the implants, crowns and hotels that are chosen for each package; every row lists the Least, Normal and High price */
function pkSelT(c){const g=pkGen(),n=c.items.filter(t=>!g.has(t.id)&&trdOK(c,t)&&pkN(PKP.q[t.id])>0).length;return n?ti('{0} selected',n):''}
function pkRowH(c,t){const p=trdP(c,t),n=pkN(PKP.q[t.id]),q=PKP.q[t.id]==null?'':PKP.q[t.id];
 return `<tr data-id="${t.id}"><td class="whitespace-normal" data-notr>${esc(trdTn(t))}<span class="block text-[9px] text-slate-400 font-semibold">$${trdN2(p.l)} / $${trdN2(p.x)} / $${trdN2(p.h)}</span></td><td><input type="number" min="0" step="1" value="${esc(q)}" data-id="${t.id}" oninput="pkQty2(this)" class="w-16 border rounded p-1 text-xs font-bold text-center"></td><td id="pkl_${t.id}" class="text-emerald-700" data-notr>${n>0?'$'+trdN2(n*p.l):''}</td><td id="pkn_${t.id}" class="text-indigo-700" data-notr>${n>0?'$'+trdN2(n*p.x):''}</td><td id="pkk_${t.id}" class="text-rose-700" data-notr>${n>0?'$'+trdN2(n*p.h):''}</td></tr>`}
function pkList(){
 const q=(PKP.s||'').trim().toLowerCase(),only=!!PKP.o,gen=pkGen();let h='';
 PDB.cats.forEach(c=>{
  const cs=(c.name+' '+Object.values(c.tn||{}).join(' ')).toLowerCase(),its=c.items.filter(t=>!gen.has(t.id)&&trdOK(c,t)&&(!q||trdSn(t).includes(q)||cs.includes(q))&&(!only||pkN(PKP.q[t.id])>0));
  if(!its.length)return;
  const open=q||only||PK_OPEN.has(c.id);
  h+=`<details data-cat="${c.id}" ${open?'open':''} ontoggle="pkTg(this)" class="border-b border-slate-200"><summary class="cursor-pointer select-none px-3 py-2 bg-slate-900 text-[#a08a7c] text-xs font-bold uppercase tracking-wider flex justify-between gap-2"><span data-notr>${esc(trdCn(c))}</span><span class="flex items-center gap-2"><span id="pksel_${c.id}" class="text-[10px] text-emerald-300 normal-case" data-notr>${esc(pkSelT(c))}</span><span class="text-[10px] text-slate-400" data-notr>${its.length}</span></span></summary>${c.d?`<p class="px-3 py-1 text-[10px] text-slate-500 bg-slate-50" data-notr>${esc(c.d)}</p>`:''}<table><thead><tr><th>Treatment</th><th>Qty</th><th>Least Price</th><th>Normal Price</th><th>High Price</th></tr></thead><tbody>${its.map(t=>pkRowH(c,t)).join('')}</tbody></table></details>`});
 $('pkl').innerHTML=h||`<p class="p-4 text-xs text-slate-500 italic">No treatments found.</p>`}
function pkTg(el){if((PKP.s||'').trim()||PKP.o)return;const id=el.dataset.cat;if(el.open){PK_OPEN.clear();PK_OPEN.add(id);document.querySelectorAll('#pkl details[data-cat]').forEach(d=>{if(d!==el&&d.open)d.open=false})}else PK_OPEN.delete(id)}
function pkQty2(el){const id=el.dataset.id,f=trdFind(id);if(trdNum(el.value)>0)PKP.q[id]=el.value;else delete PKP.q[id];pkSave();
 if(f){const p=trdP(f.c,f.t),n=pkN(PKP.q[id]),b=$('pksel_'+f.c.id);[['pkl_','l'],['pkn_','x'],['pkk_','h']].forEach(([pre,k])=>{const a=$(pre+id);if(a)a.textContent=n>0?'$'+trdN2(n*p[k]):''});if(b)b.textContent=pkSelT(f.c)}
 pkOut()}
/* Package Treatments: the generic quantities, one under the other */
function pkInH(){
 const lab='block text-[10px] text-slate-500 font-bold uppercase',inp='block w-full border rounded p-1.5 mt-1 text-sm font-bold text-slate-900 normal-case bg-white',
  fld=(f,t,ph)=>`<label class="${lab}">${t}<input id="pkq_${f}" type="number" min="0" step="1" value="${esc(PKP[f])}" placeholder="${esc(ph)}" oninput="pkQty('${f}',this.value)" class="${inp}"></label>`;
 return `<div class="p-3 space-y-3 max-w-md"><div class="grid grid-cols-1 gap-3">${fld('ni','Implants','0')}${fld('nc','Crowns','0')}${fld('nh','Hotel nights','0')}<div id="pkhn" class="empty:hidden"></div></div><p class="text-[10px] text-slate-500">${esc(ti(PKP.mode=='a'?'The exact implant, crown and hotel are chosen for each package.':'The packages are ready: the implant, crown and hotel of each one can be changed in its package.'))}</p></div>`}
/* All-on packages: ticked once here, their criteria are chosen inside each package */
function pkApH(){
 const R=trcPkR(),lab='text-[10px] text-slate-500 font-bold uppercase',
  rd=(nm,v,cur,l,fn)=>`<label class="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"><input type="radio" name="${nm}" ${v==cur?'checked':''} onchange="${fn}" class="accent-slate-800"><span data-notr>${l}</span></label>`,
  sub=(t,b)=>`<div class="space-y-1"><div class="${lab}">${t}</div><div class="flex flex-wrap gap-x-4 gap-y-1.5 items-center">${b}</div></div>`;let ni=0,on=false;
 const card=P=>{const g=PKP.ap[P.k],jw=P.j&&+g.jaws==2?2:1,per=P.k=='a4'?R.i4:R.i6;let h='';
  if(g.on){on=true;
   if(P.j)h+=sub('Jaws',rd('pkj_'+P.k,1,jw,'One jaw',`pkApV('${P.k}','jaws',1)`)+rd('pkj_'+P.k,2,jw,'Upper and lower jaw',`pkApV('${P.k}','jaws',2)`));
   if(P.z){const zn=+g.zn==4?4:2,k=trdZin(g.in);ni+=zn+k;
    h+=sub('Number of zygomatic implants',[2,4].map(n=>rd('pkn_'+P.k,n,zn,n,`pkApV('${P.k}','zn',${n})`)).join(''));
    h+=sub('Number of implants',TRD_ZI.map(n=>rd('pki_'+P.k,n,k,n,`pkApV('${P.k}','in',${n})`)).join(''))}
   else{ni+=per*jw;h+=`<span class="text-[10px] font-bold text-slate-500">${esc(ti('Implants: {0}',per*jw))}</span>`}}
  else h=`<p class="text-[10px] text-slate-500">${esc(P.z?ti('Zygomatic implants with regular implants.'):ti('Implants per jaw: {0}',per))}</p>`;
  return `<div class="rounded-lg border ${g.on?'border-[#a08a7c] bg-amber-50':'border-slate-200 bg-slate-50'} p-3 space-y-2.5 min-w-0"><label class="flex items-center gap-2 font-bold text-sm cursor-pointer"><input type="checkbox" ${g.on?'checked':''} onchange="pkApOn('${P.k}',this.checked)" class="w-4 h-4 accent-slate-800"><span>${P.n}</span></label>${h}</div>`},
  cs=TRD_PK.map(card).join('');
 return `<div class="p-3 space-y-3"><div class="grid gap-3" style="grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))">${cs}</div><p class="text-[10px] text-slate-500">${esc(ti('The implant type and the other criteria of a ticked package are chosen inside each package.'))}</p>${on?`<p class="text-[10px] font-bold text-emerald-700">${esc(ti('Included at no charge and listed in the Treatment Explanation: tooth extraction (first visit) and {0} multiunit abutments (second visit, or first visit when a Fixed Temporary is chosen).',ni))}</p>`:''}</div>`}
function rPK(){
 if(pkMe!==me||!PKP)pkLoad();
 PK_OPEN.clear();
 const sel=(id,fn,opts,v)=>`<select id="${id}" onchange="${fn}" class="block border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white">${opts.map(o=>`<option value="${o[0]}"${o[0]==v?' selected':''}>${o[1]}</option>`).join('')}</select>`,
  lab='block text-[10px] text-slate-500 font-bold uppercase',cur=PKP.cur,fl=trdNum(PKP.fl[cur]);
 const adv=PKP.mode=='a',
  c1=`<div><label class="${lab}">Currency${sel('pkcur',"pkSet('cur',this.value)",[['-','-'],...TRD_CUR.map(c=>[c,c])],cur)}</label></div>`,
  c2=`<div><label class="${lab}">Visits${sel('pkvis',"pkSet('vis',this.value)",[['One Visit','One Visit'],['Two Visits','Two Visits'],['Three Visits','Three Visits']],PKP.vis)}</label></div>`,
  cps=`<div><label class="${lab}">Payment visits<select id="pkps" onchange="pkSet('ps',this.value)" class="block border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white"></select></label></div>`,
  cdep=`<div><label class="${lab}">Your deposit<input id="pkdep" type="number" min="0" step="any" value="${PKP.dep==null?'':esc(PKP.dep)}" placeholder="${PDB.deposit}" oninput="pkDep(this.value)" class="block w-28 border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white"></label></div>`,
  ctk=`<div class="pb-2"><label class="inline-flex items-center gap-2 text-xs font-bold text-slate-700 normal-case cursor-pointer"><input type="checkbox" id="pktk" ${PKP.tk?'checked':''} onchange="pkSet('tk',this.checked)" class="w-4 h-4 accent-slate-800"><span>Flight ticket included</span></label></div>`,
  cfl=`<div><label class="${lab}">Flight ticket price<input id="pkfl" type="number" min="0" step="any" value="${fl!=null&&fl>=0?esc(PKP.fl[cur]):''}" placeholder="${TRD_CUR.includes(cur)?PK_FL[cur]:''}" ${TRD_CUR.includes(cur)?'':'disabled'} oninput="pkFl(this.value)" class="block w-28 border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white"></label></div>`;
 /* simple view: currency, visits, payment visits, deposit, nights per visit, a new patient and the PDF (no flight ticket, no hidden settings) */
 $('pkbar').innerHTML=adv?c1+c2+cps+cdep+ctk+cfl+`<div><button type="button" onclick="pkReset(this)" class="bg-slate-700 text-white rounded px-3 py-1.5 font-bold uppercase">Reset</button></div>`
  :c1+c2+cps+cdep+`<div><button type="button" id="pkrs" onclick="pkReset(this)" class="bg-slate-700 text-white rounded px-3 py-1.5 font-bold uppercase">Reset</button></div><div><button type="button" id="pkpdf" onclick="pkPdfAsk()" class="bg-slate-800 text-white rounded px-3 py-1.5 font-bold uppercase">⬇ Download PDF</button></div>`+(window.EP?EP.btns('pkg'):'');
 /* the two views: the simple one (default) and the advanced one with every option */
 [['s','pkmd_s'],['a','pkmd_a']].forEach(([m,id])=>{const e=$(id);if(e)e.className='px-3 py-1.5 '+(PKP.mode==m||(m=='s'&&!adv)?'bg-slate-900 text-[#a08a7c]':'bg-white text-slate-700')});
 $('pksimple').classList.toggle('hidden',adv);$('pkadv').classList.toggle('hidden',!adv);
 if(adv)$('pksimple').innerHTML='';else['pkt','pkmt','pkc','pkm'].forEach(i=>{$(i).innerHTML=''});
 $('pkdesc').textContent=adv?'Enter how many implants, crowns and hotel nights the patient needs, then choose the exact implant, crown and hotel of the Standard, Premium and VIP packages. Prices come from the Treatment Database.':'Enter how many implants, crowns and hotel nights the patient needs. The three packages are ready: choose a promotion and copy the message. Prices come from the Treatment Database.';
 $('pksb').innerHTML=`<div class="grow min-w-[10rem]"><label class="${lab}">Search<input id="pks" value="${esc(PKP.s)}" placeholder="${esc(ti('Search treatments…'))}" oninput="pkSrch(this.value)" class="block w-full border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white"></label></div>`
  +`<div class="pb-2"><label class="inline-flex items-center gap-2 text-xs font-bold text-slate-700 normal-case cursor-pointer"><input type="checkbox" id="pko" ${PKP.o?'checked':''} onchange="pkOnly(this.checked)" class="w-4 h-4 accent-slate-800"><span>Show selected only</span></label></div>`;
 $('pkin').innerHTML=pkInH();
 $('pkap').innerHTML=pkApH();
pkList();pkOpUp();pkOut()}
/* simple view (default) and advanced view */
function pkSet(k,v){
 if(k=='cur'&&v!=PKP.cur){PKP.dep=null;const d=$('pkdep');if(d)d.value=''}
 if(k=='vis')PKP.hn=null;
 PKP[k]=v;pkSave();
 if(k=='cur'){const e=$('pkfl'),ok=TRD_CUR.includes(v);if(e){e.disabled=!ok;e.placeholder=ok?PK_FL[v]:'';const x=trdNum(PKP.fl[v]);e.value=x!=null&&x>=0?PKP.fl[v]:''}}
 pkOut()}
function pkDep(v){PKP.dep=v;pkSave();pkOut()}
function pkFl(v){const c=PKP.cur;if(!TRD_CUR.includes(c))return;if(trdNum(v)!=null&&trdNum(v)>=0)PKP.fl[c]=v;else delete PKP.fl[c];pkSave();pkOut()}
function pkSrch(v){PKP.s=v;pkSave();pkList()}
function pkOnly(b){PKP.o=!!b;pkSave();pkList()}
function pkQty(f,v){PKP[f]=v;if(f=='nh')PKP.hn=null;pkSave();pkOut()}
function pkPk(k,f,v){PKP.pk[k][f]=v;pkSave();pkOut()}
function pkPc(el,k){const v=trdNum(el.value);if(v!=null&&v>0&&v<100)PKP.pk[k].pc=v+'%';el.value='';pkSave();pkOut()}
/* the price list (Least / Normal / High) a package is built on */
function pkUse(k,p){const P=PKP.pk[k];if(!['l','n','h'].includes(p))return;if(P.tier!=p){P.tier=p;if(P.pc=='N'||P.pc=='L')P.pc='-'}pkSave();pkOut()}
/* the package whose messages are shown */
function pkTier(k){PKP.sel=k;pkSave();pkOut()}
/* All-on packages: ticked and sized once; the criteria are chosen in each package */
function pkApOn(k,b){PKP.ap[k].on=!!b;pkSave();$('pkap').innerHTML=pkApH();pkOut()}
function pkApV(k,f,v){PKP.ap[k][f]=+v;pkSave();$('pkap').innerHTML=pkApH();pkOut()}
function pkAoS(t,k){const P=PKP.pk[t];return P.ao[k]||(P.ao[k]=pkAo0())}
function pkAoV(t,k,f,v){pkAoS(t,k)[f]=v;pkSave();pkOut()}
function pkAoSel(t,k,id,b){const s=pkAoS(t,k);if(b)s.sel[id]=null;else delete s.sel[id];pkSave();pkOut()}
function pkAoQ(t,k,id,v){const s=pkAoS(t,k),n=trdNum(v);s.sel[id]=n!=null&&n>=0?Math.round(n):null;pkSave();pkOut()}
function pkReset(b){const lb=b.dataset.t||'Reset';if(!b.dataset.a){b.dataset.a=1;b.textContent='Sure? Click again';setTimeout(()=>{b.dataset.a='';b.textContent=lb},3000);return}
 const op=PKP.op,mode=PKP.mode;PKP=pkFresh();PKP.op={...op};PKP.mode=mode;pkSave();rPK()}
