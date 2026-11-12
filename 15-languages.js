/* Ömar Istanbul by Rima — the 10 languages: translation of every screen */
/* ===== Languages ===== */
const LANGS=[['en','English','en-US'],['fr','Français','fr-FR'],['ar','العربية','ar'],['tr','Türkçe','tr-TR'],['ru','Русский','ru-RU'],['es','Español','es-ES'],['de','Deutsch','de-DE'],['ro','Română','ro-RO'],['it','Italiano','it-IT'],['pt','Português','pt-PT']];
/* TRX: see js/translations.js */
const ROW={};TRX.forEach(r=>{ROW[r[0]]=r});
let LANG='en',LI=0;
function ti(k,...a){const r=ROW[k],s=LI&&r&&r[LI]?r[LI]:k;return a.length?s.replace(/\{(\d)\}/g,(m,i)=>a[+i]!==undefined?a[+i]:m):s}
const NT=new WeakMap(),NOTR=new Set(['SCRIPT','STYLE','TEXTAREA','CODE','NOSCRIPT','TITLE']),ATTRS=['placeholder','title','aria-label'];
const NOLAY=new Set(['HTML','BODY','TABLE','THEAD','TBODY','TR','FORM','SECTION','MAIN','ASIDE','HEADER','UL','OL']);
function nightsTxt(n){
 if(LANG==='ru'){const a=n%10,b=n%100;return n+' '+(a==1&&b!=11?'ночь':(a>=2&&a<=4&&(b<12||b>14)?'ночи':'ночей'))}
 if(LANG==='ar')return n==2?'ليلتان':(n>=3&&n<=10?n+' ليالٍ':n+' ليلة');
 if(LANG==='ro'&&typeof trcPl==='function')return trcPl(n,'ro',0);
 return ti(n==1?'{0} Night':'{0} Nights',n)}
function dirMark(el,on){
 if(!el.dataset)return;
 if(!on){if(el.dataset.ad){el.removeAttribute('dir');delete el.dataset.ad}return}
 if(el.hasAttribute('dir')||NOLAY.has(el.nodeName))return;
 const c=typeof el.className=='string'?el.className:'';
 if(/(^|\s)(flex|grid|inline-flex)(\s|$)/.test(c))return;
 el.setAttribute('dir','auto');el.dataset.ad='1'}
/* a text with a symbol or number in front of it or behind it ("▾ Normal Plan", "13. Saved Plans", "Team online ▾") is translated from the words alone */
function lk(key){
 const r=ROW[key];if(r&&r[LI])return r[LI];
 const q=/^([^A-Za-z\u00C0-\u024F]*?)([A-Za-z\u00C0-\u024F].*?)([\s\u25BE\u25B8\u25B4\u25BC\u25B2\u25BA\u203A\u00BB\u2026\u2192:]*)$/.exec(key);
 if(q&&(q[1]||q[3])){const r2=ROW[q[2]];if(r2&&r2[LI])return q[1]+r2[LI]+q[3]}
 return null}
function doText(n){
 const p=n.parentNode;if(!p||p.nodeType!==1||NOTR.has(p.nodeName)||(p.closest&&p.closest('[data-notr]')))return;
 let rec=NT.get(n);const v=n.nodeValue;
 if(!rec||v!==rec.o){rec={s:v,o:v};NT.set(n,rec)}
 const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(rec.s);
 if(p.nodeName==='OPTION'&&!p.hasAttribute('value'))p.setAttribute('value',m[2].replace(/\s+/g,' '));
 let out=rec.s,hit=false;
 if(m[2]&&LI){const t=lk(m[2].replace(/\s+/g,' '));if(t){out=m[1]+t+m[3];hit=true}}
 if(out!==v)n.nodeValue=out;
 rec.o=out;
 dirMark(p,LANG==='ar'&&!!m[2]&&/[؀-ۿ]/.test(out))}
function doAttr(el){
 if(el.nodeType!==1)return;
 const S=el._sa||(el._sa={});
 for(const a of ATTRS){
  if(!el.hasAttribute(a))continue;
  const cur=el.getAttribute(a);
  if(!S[a]||cur!==S[a].o)S[a]={s:cur,o:cur};
  const r=LI?ROW[S[a].s.replace(/\s+/g,' ').trim()]:null,out=r&&r[LI]?r[LI]:S[a].s;
  if(out!==cur)el.setAttribute(a,out);
  S[a].o=out}
 if(/^(INPUT|TEXTAREA|SELECT)$/.test(el.nodeName))dirMark(el,LANG==='ar')}
function walk(root){
 if(root.nodeType===3){doText(root);return}
 if(root.nodeType!==1)return;
 doAttr(root);
 const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
 while((n=tw.nextNode())){n.nodeType===3?doText(n):doAttr(n)}}
const MO=new MutationObserver(ms=>{for(const m of ms){
 if(m.type==='characterData')doText(m.target);
 else if(m.type==='attributes')doAttr(m.target);
 else m.addedNodes.forEach(walk)}});
function setTitle(){document.title='Ömar Istanbul · by Rima'}
function setLang(c){
 let i=LANGS.findIndex(x=>x[0]===c);if(i<0){i=0;c='en'}
 LANG=c;LI=i;
 try{localStorage.setItem('kc_lang',c)}catch(e){}
 document.documentElement.lang=c;
 ['lgh','lgl'].forEach(id=>{const s=$(id);if(s)s.value=c});
 setTitle();
 try{cm()}catch(e){}
 walk(document.body);
 if(me){lists();render()}else{try{buildNav()}catch(x){}}
 try{if(window.EX)EX.refresh()}catch(e){}}
function i18nStart(){
 const opts=LANGS.map(l=>`<option value="${l[0]}">${l[1]}</option>`).join('');
 ['lgh'].forEach(id=>{const s=$(id);if(!s)return;s.innerHTML=opts;s.onchange=()=>setLang(s.value)});
 let c='en';try{c=localStorage.getItem('kc_lang')||'en'}catch(e){}
 MO.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
 setLang(c)}
