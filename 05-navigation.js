/* Ömar Istanbul by Rima — the module menu (and the phone menu bar) */
const NAVS=[['tickets','Ticket Calendar'],['deposits','Deposit Calendar'],['potentials','Potential Patients Pipeline'],['commission','Commission Structure & Audits'],['stats','Monthly Performance Statistics'],['planner','Appointment Planning'],['plancalc','Treatment Plan Calculator'],['pkcalc','Package Plan Calculator'],['pricedb','Treatment Database'],['plans','All Saved Plans'],['kps','Omer Istanbul Dental Center'],['kpsc','Saved Cases']];
const NAVG=[['tickets','deposits','potentials'],['commission','stats'],['planner','plancalc','pkcalc','plans']];
const NAVT=['Records','My Performance','Planning & Prices'];
function navFolds(){const f=L('kc_fold',{});return f&&typeof f=='object'&&!Array.isArray(f)?f:{}}
function navFold(g){const f=navFolds();f['g'+g]=!f['g'+g];S('kc_fold',f);buildNav()}
function navOrder(){return NAVG.flat()}
function navBadge(k){return''}
function buildNav(){const T=Object.fromEntries(NAVS),fold=navFolds();let i=-1;
 $('nav').innerHTML=NAVG.map((g,gi)=>{const folded=!!fold['g'+gi]&&!g.includes(tab);
  const head=`<button type="button" class="ep-gh" onclick="navFold(${gi})" aria-expanded="${folded?'false':'true'}"><span>${esc(ti(NAVT[gi]||''))}</span><span class="ep-gc"><span class="ep-gn">${g.length}</span><span class="ep-gv">${folded?'&#9656;':'&#9662;'}</span></span></button>`;
  return '<div class="ep-grp ep-box">'+head+(folded?'':g.map(k=>{i++;return `<button type="button" data-t="${k}" onclick="tab='${k}';render();navPhone(false)" class="w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition ${k==tab?'g':'text-slate-600 hover:bg-slate-200'}">${esc(ti(T[k]))}</button>`}).join(''))+'</div>'}).join('');
 navLabel();{const d=$('setdb');if(d){d.classList.toggle('g',tab=='pricedb');d.classList.toggle('text-slate-600',tab!='pricedb')}const k=$('kpsb');if(k)k.classList.toggle('on',tab=='kps'||tab=='kpsc')}}
function navLabel(){const e=$('mnavT');if(!e)return;const T=Object.fromEntries(NAVS);e.textContent=ti(T[tab]||'')}
function navPhone(open){const w=$('navwrap'),b=$('mnav');if(!w||!b)return;const on=open===undefined?w.classList.contains('hidden'):!!open;w.classList.toggle('hidden',!on);b.setAttribute('aria-expanded',on?'true':'false');$('mnavC').textContent=on?'▴':'▾'}

/* the Settings gear at the bottom left: a small menu opens next to it */
function setTog(open){const p=$('setbox'),g=$('setg');if(!p||!g)return;const on=open===undefined?p.classList.contains('hidden'):!!open;p.classList.toggle('hidden',!on);g.setAttribute('aria-expanded',on?'true':'false')}
document.addEventListener('click',e=>{const w=$('setw');if(w&&!w.contains(e.target))setTog(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')setTog(false)});
