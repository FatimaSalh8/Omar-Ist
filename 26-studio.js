/* Ömar Istanbul by Rima — Kristal Plan Studio (module 1) and Saved Cases (module 2), in their own box at the top of the menu.
   The studio is the clinic's own app (kristal-plan-studio.html). It is shown in its own frame so its design stays exactly as it was made.
   It has no database of its own:
   - prices, hotels, exchange rates, deposit, payment split: the Treatment Database of the portal
   - messages and explanation photos: the same as the Treatment Plan Calculator (message templates, Follow up Messages, Appointment Planning dates)
   - the PDF design (PDF Builder): on Firebase, only the administrator changes it (kc_kps_tpl + the "kpstpl" pictures)
   - the cases: on Firebase, "kps" (the list: patient, kit number, consultant) and "kpsfile" (the case itself and its photos).
     A consultant sees her own cases, the administrator sees all of them. */
(function () {
  'use strict';
  var tt = function (k) { var a = Array.prototype.slice.call(arguments); return typeof ti === 'function' ? ti.apply(null, a) : k; };
  var X = null, started = false, CASES = [], ST = { q: '', cons: 'all', rm: null }, stale = false, TIMGS = null, OUT = null, M = {};
  var SLOTS = ['upper', 'lower', 'full'];
  var isAdm = function () { return me === 'admin'; };
  var lg = function () { return typeof trdLg === 'function' ? trdLg() : 'en'; };
  var frame = function () { return document.getElementById('kpsf'); };
  var studio = function () { var f = frame(); try { return f && f.contentWindow && f.contentWindow.KPS_OPEN ? f.contentWindow : null; } catch (e) { return null; } };
  function cx() { if (X) return X; if (window.EOP_CLOUD && EOP_CLOUD.x) X = EOP_CLOUD.x(); return X; }
  var kitFmt = function (k) { k = String(k || '').trim(); return !k ? '' : /^kit-/i.test(k) ? k.toUpperCase() : 'KIT-' + k; };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function when(ms) {
    if (!ms) return '';
    var d = new Date(ms), n = new Date(), hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (d.toDateString() === n.toDateString()) return tt('Today') + ' ' + hm;
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + (d.getFullYear() !== n.getFullYear() ? '/' + d.getFullYear() : '') + ' ' + hm;
  }
  function jget(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- the treatment list of the studio, from the Treatment Database ---------- */
  /* the studio sorts every treatment into a type (implant, crown, hotel ...); the type comes from the name */
  var hk = function (n) { return String(n == null ? '' : n).replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase(); };
  function typeOf(n, c) {
    var s = hk(n), g = hk(c && c.name);
    if ((c && c.kind === 'h') || /^nights?\s*-/.test(s)) return 'hotel';
    if (/transport|transfer/.test(s)) return 'transport';
    if (/fib(er|re) ?post/.test(s)) return 'fiberpost';
    if (/apical|apicoectom|apex resection/.test(s)) return 'apical';
    if (/temporary (teeth|tooth)/.test(s)) return 'temptooth';
    if (/temporary/.test(s)) return 'temporary';
    if (/zygomatic/.test(s)) return 'zygomatic';
    if (/pte?r?y?goid/.test(s)) return 'pterygoid';
    if (/implant removal/.test(s)) return 'implantremoval';
    if (/multiunit|abutment/.test(s)) return 'abutment';
    if (/implant/.test(s)) return 'implant';
    if (/veneer/.test(s)) return 'veneer';
    if (/crown/.test(s)) return 'crown';
    if (/sinus.*package/.test(s)) return 'sinuspkg';
    if (/sinus/.test(s)) return 'sinuslift';
    if (/graft block|bone graft/.test(s)) return 'bonegraft';
    if (/membrane/.test(s)) return 'membrane';
    if (/extraction/.test(s)) return 'extraction';
    if (/general anesth/.test(s)) return 'generalanesthesia';
    if (/sedation/.test(s)) return 'sedation';
    if (/hybrid/.test(s)) return 'hybrid';
    if (/toronto/.test(s)) return 'toronto';
    if (/prosthesis|denture/.test(s)) return 'denture';
    if (/root canal|retreatment/.test(s)) return 'rootcanal';
    if (/composite|filling|onlay/.test(s)) return 'filling';
    if (/clean/.test(s)) return 'cleaning';
    if (/whitening/.test(s)) return 'whitening';
    if (/night guard/.test(s)) return 'nightguard';
    if (/gum|gingiv|flep|kron boyu/.test(s)) return 'gum';
    if (/invisalign|brace|ortho/.test(s)) return 'ortho';
    return /surgery/.test(g) ? 'surgery' : 'toothother';
  }
  function items() {
    var out = [];
    (PDB.cats || []).forEach(function (c) {
      (c.items || []).forEach(function (t) {
        if (!t || !t.n || !trdOK(c, t)) return;
        var p = trdP(c, t);
        out.push({ id: t.id, g: c.name, n: t.n, t: typeOf(t.n, c), l: +p.l || 0, x: +p.x || 0, h: +p.h || 0 });
      });
    });
    return out;
  }
  function rates() { var r = PDB.rates || {}, o = {}; ['EUR', 'GBP', 'CAD', 'AUD', 'NZD'].forEach(function (k) { if (+r[k] > 0) o[k] = +r[k]; }); return { at: PDB.ratesAt || '', r: o }; }
  function pdb() {
    var sp = PDB.split || {};
    return { deposit: +PDB.deposit > 0 ? +PDB.deposit : 300, sp2: (sp[2] && +sp[2][0]) || 60, sp3: (sp[3] && sp[3].length === 2) ? [+sp[3][0], +sp[3][1]] : [40, 30],
      promo: Array.isArray(PDB.promoC) ? PDB.promoC.slice() : [], kw: Array.isArray(PDB.kw) ? PDB.kw.slice() : [] };
  }

  /* ---------- appointment dates: the saved sheet marked "Use in plans" in Appointment Planning ---------- */
  function avail() { return typeof trcAvail === 'function' ? trcAvail(lg()) : { DATES: null, UNTIL: null }; }
  function availPdf(l) {
    l = l || 'en';
    var e = typeof plActive === 'function' ? plActive() : null;
    if (!e || !(e.slots || []).length || typeof trcAvail !== 'function') return { until: '', dates: '' };
    var a = trcAvail(l), T = (typeof PLT !== 'undefined' && (PLT[l] || PLT.en)) || { at: 'at' };
    var d = plSort(e.slots).map(function (x) { return plWd(x.year, x.month, x.day, l) + ' ' + plOrd(x.day, l) + ' ' + plMon(x.month, l) + ' ' + T.at + ' ' + x.time; });
    return { until: a.UNTIL || '', dates: d.join('\n') };
  }

  /* ---------- the PDF design: one for everybody, only the administrator saves it ---------- */
  function tplGet() { return L('kc_kps_tpl', null); }
  function tplSet(o) { if (isAdm()) S('kc_kps_tpl', o); }
  /* a picture must stay under the size of one Firebase record (1 MB) */
  function shrink(url) {
    return new Promise(function (res) {
      if (!url || url.length < 900000) return res(url);
      var png = /^data:image\/png/.test(url), im = new Image();
      im.onload = function () {
        var sc = Math.min(1, 2000 / Math.max(im.width, im.height)), q = 0.85, out = url;
        for (var i = 0; i < 12; i++) {
          var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * sc)); c.height = Math.max(1, Math.round(im.height * sc));
          var x = c.getContext('2d'); if (!png) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
          x.drawImage(im, 0, 0, c.width, c.height);
          out = png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', q);
          if (out.length < 900000) break;
          sc *= 0.82; if (!png && q > 0.6) q -= 0.05;
        }
        res(out);
      };
      im.onerror = function () { res(url); };
      im.src = url;
    });
  }
  var docId = function (k) { return String(k).replace(/[\/]/g, '_'); };
  function tplImgs() {
    if (TIMGS) return Promise.resolve(TIMGS);
    var x = cx(); if (!x) return Promise.resolve({});
    return x.db.collection('kpstpl').get().then(function (s) { var o = {}; s.docs.forEach(function (d) { var v = d.data(); if (v && v.k && v.img) o[v.k] = v.img; }); TIMGS = o; return o; }).catch(function () { return {}; });
  }
  function tplImgSet(k, url) {
    var x = cx(); if (!x || !isAdm()) return Promise.resolve();
    return shrink(url).then(function (u) { if (TIMGS) TIMGS[k] = u; return x.db.collection('kpstpl').doc(docId(k)).set({ k: k, img: u, ms: Date.now() }); }).catch(function (e) { toast(tt('NOT saved to the shared database ({0}) - it is kept on this device', (e && e.code) || 'no connection')); });
  }
  function tplImgDel(k) {
    var x = cx(); if (!x || !isAdm()) return Promise.resolve();
    if (TIMGS) delete TIMGS[k];
    return x.db.collection('kpstpl').doc(docId(k)).delete().catch(function () {});
  }

  /* ---------- the cases ---------- */
  var chain = Promise.resolve();
  function saveCase(c, photo, quiet, sum) { var p = chain.then(function () { return doSave(c, photo, sum); }); chain = p.catch(function () {}); return p; }
  async function doSave(c, photo, sum) {
    var x = cx(); if (!x) throw new Error(tt('no connection'));
    var db = x.db, id = String(c.id);
    if (!c.owner) { c.owner = x.email; c.by = x.name || ''; }        /* the case belongs to the person who saved it first */
    c.phUp = c.phUp || {};
    for (var i = 0; i < SLOTS.length; i++) {
      var s = SLOTS[i], t = c.photos && c.photos[s];
      if (t && c.phUp[s] !== t) { var u = photo(s); if (u) { u = await shrink(u); await db.collection('kpsfile').doc(id + '_' + s).set({ owner: c.owner, img: u, ms: Date.now() }); c.phUp[s] = t; } }
      else if (!t && c.phUp[s]) { await db.collection('kpsfile').doc(id + '_' + s).delete().catch(function () {}); delete c.phUp[s]; }
    }
    var keep = Object.assign({}, c); delete keep.cloud;
    await db.collection('kpsfile').doc(id + '_data').set({ owner: c.owner, data: JSON.stringify(keep), ms: Date.now() });
    await db.collection('kps').doc(id).set({ owner: c.owner, by: c.by || '', patient: String((c.patient && c.patient.name) || '').trim(), kit: String((c.patient && c.patient.kit) || '').trim(),
      sum: String(sum || ''), plans: (c.plans || []).length, photos: Object.keys(c.photos || {}).length, ms: Date.now() });
    enter();
  }
  async function loadCase(id) {
    var x = cx(); if (!x) throw new Error(tt('no connection'));
    var db = x.db, d = await db.collection('kpsfile').doc(id + '_data').get();
    if (!d.exists) throw new Error(tt('This case was not found.'));
    var ph = {};
    for (var i = 0; i < SLOTS.length; i++) { var p = await db.collection('kpsfile').doc(id + '_' + SLOTS[i]).get().catch(function () { return null; }); if (p && p.exists && p.data().img) ph[SLOTS[i]] = p.data().img; }
    return { json: d.data().data, photos: ph };
  }
  async function openCase(id, btn) {
    var w = studio();
    if (!w) { tab = 'kps'; render(); setTimeout(function () { openCase(id); }, 1200); return; }
    if (w.KPS_DIRTY && w.KPS_DIRTY() && !confirm(tt('The case open in the studio is not saved. Open the other case anyway?'))) return;
    if (btn) { btn.disabled = true; btn.textContent = tt('Opening...'); }
    try {
      if (w.KPS_FLUSH) await w.KPS_FLUSH();
      var r = await loadCase(id);
      tab = 'kps'; render();
      await w.KPS_OPEN(r.json, r.photos);
    } catch (e) { toast((e && e.message) || tt('no connection')); }
    finally { if (btn) { btn.disabled = false; btn.textContent = tt('Open'); } }
  }
  function delCase(id) {
    var x = cx(); if (!x) return;
    var db = x.db;
    db.collection('kps').doc(id).delete().catch(function () {});
    ['data'].concat(SLOTS).forEach(function (s) { db.collection('kpsfile').doc(id + '_' + s).delete().catch(function () {}); });
    var w = studio(); if (w && w.KPS_GONE) w.KPS_GONE(id);
    toast(tt('Case deleted.'));
  }
  function enter() {
    if (started) return;
    var x = cx(); if (!x) return;
    started = true;
    var q = x.role === 'admin' ? x.db.collection('kps') : x.db.collection('kps').where('owner', '==', x.email);
    q.onSnapshot(function (s) { CASES = s.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }); if (tab === 'kpsc') rList(); },
      function (e) { try { console.warn('kps:', e && e.code); } catch (y) {} });
  }

  /* ---------- the messages and the photos under the studio (the same as under the Treatment Plan Calculator) ---------- */
  function out(d) {
    OUT = d;
    var box = document.getElementById('kpso'); if (!box) return;
    box.classList.toggle('hidden', !d);
    var fm = document.getElementById('kpsfm'); if (fm) fm.classList.toggle('hidden', !d);
    if (!d) return;
    M = {};
    var card = function (c) {
      M[c.k] = c.txt;
      return '<div class="rounded-xl border border-slate-200 overflow-hidden bg-white"><div class="px-3 py-2 bg-slate-900 flex flex-wrap items-center justify-between gap-2"><b class="lux text-[#a08a7c] text-xs uppercase tracking-wider">' + esc(tt(c.t)) + '</b><div class="flex items-center gap-2"><button type="button" onclick="kpsCopy(\'' + c.k + '\')" class="g rounded px-2 py-1 text-[10px] font-bold uppercase">' + esc(tt('Copy')) + '</button></div></div>'
        + (c.k === 'manual' || c.k === 'promo' || c.k === 'all' ? (typeof trcAvNote === 'function' ? trcAvNote() : '') : '')
        + '<div class="p-2">' + (c.txt ? '<textarea id="kpsm_' + c.k + '" readonly data-notr dir="auto" style="unicode-bidi:plaintext" rows="14" class="w-full border rounded p-2 text-xs font-semibold bg-slate-50">' + esc(c.txt) + '</textarea>' : '<p class="text-xs text-slate-500 italic p-2">' + esc(tt(c.hint)) + '</p>') + '</div></div>';
    };
    var m = document.getElementById('kpsm'), sig = JSON.stringify(d.cards) + lg();
    if (m.dataset.sig !== sig) { m.dataset.sig = sig; m.innerHTML = d.cards.map(card).join(''); if (window.EX) EX.decorate('kpsm', 'calc', 'kpsm:', true); }
    else d.cards.forEach(function (c) { M[c.k] = c.txt; });
    if (window.EX) {
      var rows = (d.rows || []).map(function (r) { var f = r.id ? trdFind(r.id) : null; return f ? { t: f.t, c: f.c, q: r.q, hot: f.c.kind === 'h' } : null; }).filter(Boolean);
      var ht = rows.filter(function (r) { return r.hot && r.q > 0; }).sort(function (a, b) { return b.q - a.q; })[0],
        tr = rows.some(function (r) { return (r.t.e || []).some(function (k) { return typeof trcBR === 'function' && trcBR(k) === 'trans'; }); });
      EX.render('kpsx', { rows: rows, pk: {}, stay: { any: rows.length > 0 && !tr, hn: ht ? ht.t.n : '' } });
    }
  }
  window.kpsCopy = async function (k) {
    var t = M[k]; if (!t) return;
    try { await navigator.clipboard.writeText(t); toast(tt('Copied.')); }
    catch (e) { var x = document.getElementById('kpsm_' + k), ok = false; if (x) { x.focus(); x.select(); try { ok = document.execCommand('copy'); } catch (y) {} } toast(ok ? tt('Copied.') : tt('Select the text and copy it manually.')); }
  };

  /* ---------- Saved Cases ---------- */
  function rCases() {
    var host = document.getElementById('vkpsc'); if (!host) return;
    enter();
    if (!host.dataset.built) {
      host.dataset.built = 1;
      host.innerHTML = '<div class="flex flex-wrap items-end justify-between gap-3 mb-4"><div class="min-w-0"><h2 class="lux font-bold text-lg">Saved Cases</h2><p class="text-xs text-slate-500">The cases saved in Kristal Plan Studio. Open a case and it opens straight in the studio.</p></div>'
        + '<div class="flex flex-wrap items-end gap-2"><label class="block text-[10px] text-slate-500 font-bold uppercase">Search<input id="kpsq" placeholder="Patient name or kit number" class="block w-64 max-w-full border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white text-xs"></label>'
        + '<label id="kpscw" class="block text-[10px] text-slate-500 font-bold uppercase hidden">Consultant<select id="kpscs" class="block border rounded p-1.5 mt-1 font-bold text-slate-900 normal-case bg-white text-xs"></select></label></div></div><div id="kpsl"></div>';
      document.getElementById('kpsq').oninput = function (e) { ST.q = e.target.value; rList(); };
      document.getElementById('kpscs').onchange = function (e) { ST.cons = e.target.value; rList(); };
    }
    rList();
  }
  function rList() {
    var el = document.getElementById('kpsl'); if (!el) return;
    var adm = isAdm(), q = ST.q.trim().toLowerCase(), qk = q.replace(/^kit-/, '').replace(/[^a-z0-9]/g, '');
    var cw = document.getElementById('kpscw'), cs = document.getElementById('kpscs');
    if (adm && cw && cs) {
      cw.classList.remove('hidden');
      var names = []; CASES.forEach(function (c) { var n = c.by || c.owner; if (n && names.indexOf(n) < 0) names.push(n); }); names.sort();
      var h = '<option value="all">' + esc(tt('All consultants')) + '</option>' + names.map(function (n) { return '<option value="' + esc(n) + '"' + (ST.cons === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');
      if (cs.innerHTML !== h) cs.innerHTML = h;
    }
    if (!cx()) { el.innerHTML = '<p class="text-sm text-slate-500 italic p-4">' + esc(tt('The saved cases are on Firebase: they show when the portal is connected.')) + '</p>'; return; }
    var L2 = CASES.filter(function (c) {
      if (adm && ST.cons !== 'all' && (c.by || c.owner) !== ST.cons) return false;
      if (!q) return true;
      var k = String(c.kit || '').toLowerCase().replace(/^kit-/, '').replace(/[^a-z0-9]/g, '');
      return String(c.patient || '').toLowerCase().indexOf(q) >= 0 || (qk && k.indexOf(qk) >= 0);
    }).sort(function (a, b) { return (b.ms || 0) - (a.ms || 0); });
    if (!L2.length) { el.innerHTML = '<p class="text-sm text-slate-500 italic p-4">' + esc(tt(CASES.length ? 'No case matches the search.' : 'No saved case yet. Press “Save case” in Kristal Plan Studio.')) + '</p>'; return; }
    el.innerHTML = '<div class="space-y-2">' + L2.map(function (c) {
      var arm = ST.rm === c.id;
      return '<div class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex flex-wrap items-center gap-3"><div class="min-w-0 grow">'
        + '<div class="flex flex-wrap items-baseline gap-2"><b class="text-sm text-slate-900" data-notr>' + esc(c.patient || tt('(no name)')) + '</b>' + (c.kit ? '<span class="rounded bg-[#a08a7c]/15 text-[#8a7466] px-1.5 py-0.5 text-[10px] font-bold" data-notr>' + esc(kitFmt(c.kit)) + '</span>' : '') + '</div>'
        + '<div class="text-[11px] text-slate-500 mt-0.5"><span data-notr>' + esc(c.sum || '') + '</span>' + (adm ? ' · <span data-notr>' + esc(c.by || c.owner || '') + '</span>' : '') + ' · <span data-notr>' + esc(when(c.ms)) + '</span></div></div>'
        + '<div class="flex items-center gap-2"><button type="button" data-kpo="' + esc(c.id) + '" class="g rounded px-3 py-1.5 text-[11px] font-bold uppercase">' + esc(tt('Open')) + '</button>'
        + '<button type="button" data-kpd="' + esc(c.id) + '" class="rounded px-3 py-1.5 text-[11px] font-bold uppercase ' + (arm ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300') + '">' + esc(arm ? tt('Sure? Click again') : tt('Delete')) + '</button></div></div>';
    }).join('') + '</div>';
    el.querySelectorAll('[data-kpo]').forEach(function (b) { b.onclick = function () { openCase(b.dataset.kpo, b); }; });
    el.querySelectorAll('[data-kpd]').forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.kpd;
        if (ST.rm !== id) { ST.rm = id; rList(); setTimeout(function () { if (ST.rm === id) { ST.rm = null; rList(); } }, 3000); return; }
        ST.rm = null; delCase(id);
      };
    });
  }

  /* ---------- the studio module ---------- */
  function rStudio() {
    enter();
    var f = frame(); if (!f) return;
    if (!f.src || stale) {
      if (stale && f.src) { var w = studio(); if (w && w.KPS_FLUSH) { try { w.KPS_FLUSH(); } catch (e) {} } }
      stale = false; f.src = 'kristal-plan-studio.html?v=' + (window.EOP_VERSION || '');
    }
    if (OUT) out(OUT);
  }
  /* the prices or the PDF design changed: the studio takes them the next time it is opened */
  function changed() { stale = true; TIMGS = null; if (tab === 'kps') { var w = studio(); if (w && w.KPS_PRICES) w.KPS_PRICES(); } }

  window.KPSB = {
    admin: isAdm, uid: function () { var x = cx(); return (x && x.email) || me || 'local'; }, me: function () { return me; },
    items: items, rates: rates, pdb: pdb, typeOf: typeOf,
    tx: function (k) { return typeof trdTx === 'function' ? trdTx(k, lg()) : ''; },
    labels: function () { var lb = String(this.tx('lb')).split('\n').map(function (s) { return s.trim(); }); return [lb[0] || 'Deposit', lb[1] || 'First Visit', lb[2] || 'Second Visit', lb[3] || 'Third Visit', lb[4] || 'On Arrival']; },
    nights: function (n) { return typeof trcND === 'function' ? trcND(n, lg()) : n + ' nights'; },
    itemName: function (id) { var f = typeof trdFind === 'function' ? trdFind(id) : null; return f ? trdTn(f.t, lg()) : ''; },
    ti: tt, rm: function () { return lg() === 'ar' ? '‏' : ''; },
    lang: lg,
    /* the names of the treatments in every language (Treatment Database > translated names), for the PDF in another language */
    names: function () {
      var o = {};
      if (typeof trdTn !== 'function') return o;
      ['fr', 'ar', 'tr', 'ru', 'es', 'de', 'ro', 'it', 'pt'].forEach(function (l) {
        var m = {};
        (PDB.cats || []).forEach(function (c) { (c.items || []).forEach(function (t) { if (!t || !t.n) return; var n = trdTn(t, l); if (n && n !== t.n) m[String(t.n).replace(/\s+/g, ' ').trim()] = n; }); });
        o[l] = m;
      });
      return o;
    },
    avail: avail, availPdf: availPdf,
    tplGet: tplGet, tplSet: tplSet, tplImgs: tplImgs, tplImgSet: tplImgSet, tplImgDel: tplImgDel,
    curGet: function () { return jget('kc_kps_cur_' + me); }, curSet: function (c) { jset('kc_kps_cur_' + me, c); },
    draftGet: function () { return jget('kps_case_' + me); }, draftSet: function (c) { jset('kps_case_' + me, c); },
    saveCase: saveCase, out: out, list: function () { return CASES; }, cloud: function () { return !!cx(); }
  };
  /* the studio is a full page: "Back to the portal" goes back to the module used before it */
  var PREV = null;
  function seen(t) { if (t !== 'kps' && t !== 'kpsc') PREV = t; var o = document.getElementById('kpsfo'); if (o) o.classList.toggle('hidden', !isAdm()); }
  function back() { var on = typeof navOrder === 'function' ? navOrder() : []; tab = PREV && on.indexOf(PREV) >= 0 ? PREV : (on.filter(function (k) { return k !== 'kps'; })[0] || 'tickets'); render(); }
  function toMsgs() { var m = document.getElementById('kpso'); if (m && !m.classList.contains('hidden')) m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  window.KPS = { render: rStudio, cases: rCases, changed: changed, open: openCase, seen: seen, back: back, toMsgs: toMsgs };
})();
