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
/* dark mode: text that is still dark on a dark background (colours written in many places, e.g. Follow up Messages) is brightened automatically */
(function(){const lum=c=>{const m=String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);if(!m)return null;if(m[4]!==undefined&&+m[4]<.15)return -1;return(0.2126*m[1]+0.7152*m[2]+0.0722*m[3])/255};
 const bgOf=el=>{while(el&&el.nodeType===1){const l=lum(getComputedStyle(el).backgroundColor);if(l!==null&&l>=0)return l;el=el.parentElement}return 1};
 const run=()=>{const on=document.documentElement.getAttribute('data-theme')==='dark';
  if(!on){document.querySelectorAll('[data-dk]').forEach(e=>{e.style.removeProperty('color');e.removeAttribute('data-dk')});return}
  const all=document.body.getElementsByTagName('*');
  for(let i=0;i<all.length;i++){const e=all[i];if(e.closest('svg,canvas,style,script,iframe,#plp,#plpv,#login,#omrhi,#omrUpd'))continue;
   let txt=false;for(const n of e.childNodes){if(n.nodeType===3&&n.nodeValue.trim()){txt=true;break}}if(!txt&&!/^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName))continue;
   if(e.hasAttribute('data-dk'))e.style.removeProperty('color');const l=lum(getComputedStyle(e).color);if(l===null)continue;const bg=bgOf(e);
   if(l<=.42&&bg<.3){e.style.setProperty('color','#e7e9f1','important');e.setAttribute('data-dk','1')}
   else if(l>=.7&&bg>.78){e.style.setProperty('color','#161a59','important');e.setAttribute('data-dk','1')}
   else e.removeAttribute('data-dk')}};
 let t=0;const sch=()=>{clearTimeout(t);t=setTimeout(run,120)};
 new MutationObserver(sch).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-theme','style']});
 addEventListener('load',sch)})();
