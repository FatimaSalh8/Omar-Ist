/* Ömar Istanbul by Rima — the basics every module uses: storage helpers, the module router and the small shared pieces */
const L=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
/* ONE user (Rima, the administrator). The data stays on this device — see local-cloud.js */
const CLOUD=false;
const S=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){try{window.dispatchEvent(new CustomEvent('eop-notsaved',{detail:{k,why:'the storage of this browser is full'}}))}catch(x){}}};
const $=i=>document.getElementById(i);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd=s=>s?s.split('-').reverse().join('/'):'';
const BRAND='Ömar Istanbul';              /* the name of the clinic */
const BRAND_BY='by Rima';                 /* the name of this portal is "Ömar Istanbul by Rima" */
const ME_NAME='Rima';

/* the old team lists are kept as empty lists, so the modules that still look at them simply find nobody */
let C=[],A=[];
let H=[{id:'h0',name:'Else Where',price:0}];     /* the hotels: filled from the Treatment Database (hSync) */
const K={},D={tickets:[],deposits:[],potentials:[]},E={};
const CUR=['USD','EUR','CAD','AUD','TRY','GBP'];
let me=null,tab='stats';

function toast(t){const d=document.createElement('div');d.className='fixed bottom-4 right-4 z-[60] bg-slate-900 text-[#a08a7c] text-xs font-bold px-4 py-2 rounded-lg shadow-lg';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),4000)}
function cm(){const m=$('md');if(m)m.classList.add('hidden')}
function lists(){}

/* the modules of the portal and the screen of each one */
const VIEWS={commission:'vc',stats:'vs',planner:'vp',plancalc:'vpc',pkcalc:'vpk',pricedb:'vpd',plans:'vpl',kps:'vkps',kpsc:'vkpsc'};
function render(){
 if(!me)return;
 if(!VIEWS[tab])tab='stats';
 S('kc_lasttab_'+me,tab);
 buildNav();
 Object.keys(VIEWS).forEach(k=>{const v=$(VIEWS[k]);if(v)v.classList.toggle('hidden',k!=tab)});
 document.body.classList.toggle('kps-full',tab=='kps');
 if(window.KPS&&KPS.seen)KPS.seen(tab);
 if(tab=='kps')return window.KPS&&KPS.render();
 if(tab=='kpsc')return window.KPS&&KPS.cases();
 if(tab=='plans')return window.EP&&EP.rPlans();
 if(tab=='planner')return rPlan();
 if(tab=='plancalc')return rTRC();
 if(tab=='pkcalc')return rPK();
 if(tab=='pricedb')return rTRD();
 if(tab=='stats')return rStats();
 if(tab=='commission')return rComm()}
const SUB={kps:'Photos, diagnosis, treatment, plan card, price and PDF: the prices come from the Treatment Database.',kpsc:'The cases saved in Kristal Plan Studio.'};
