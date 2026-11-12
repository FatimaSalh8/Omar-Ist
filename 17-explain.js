/* Ömar Istanbul by Rima — explanations with photos: one box (photo + text) for every explanation that is needed in a plan,
   the text is the patient explanation of the Treatment Database (tab Patient Explanations), the photo belongs to the treatment,
   the "Follow up Messages" window (NR, Waiting For Photos, Negotiation, After The Patient Sent The Photos, About Us,
   Implants, Crowns, All on 4, All on 6, Zygomatic), favorites and the copy buttons.
   The texts and photo choices are in explain-data.js, the photos in photos.js. The administrator can change texts and photos;
   the changes are shared with everybody (settings key kc_expl, photos added later go to the shared database "media"). */
(function () {
  'use strict';
  var D0 = window.EXD || { items: [], fu: [] };
  var OV = { items: {}, fu: null, hide: [], pv: {}, gone: [], off: [], lib: null, acc: {}, top: [] };   /* what the administrator changed: photos of a treatment, the Follow up categories, hidden picture lists, picture versions per language (pv), deleted built-in messages (gone), deleted entries of a picture list (off) */
  var PREF = {}, TITLES = {}, PREFSIG = {};      /* the photos of the treatments that are in the plan come first */
  var MED = {};                              /* photos the administrator added later (shared database) */
  var ver = 1, TICK = {}, SEL = {}, MIN = {};
  var FUS = { sec: 'fav', lt: null, grp: 'nr1', mg: false, last: {}, edit: null, addCat: false, delArm: null, delGrp: null, delItem: null, delPh: null, q: '', mv: null };
  var PE = null;                             /* the editor: { kind:'tx'|'fu', key|id, title, parts[], isNew, sec, grp, delArm } */

  var hk = function (n) { return typeof trdHK === 'function' ? trdHK(n) : String(n || '').trim().toLowerCase(); };
  var phUrl = function (id) { return (window.EOP_PH && window.EOP_PH[id]) || (window.EOP_PH2 && window.EOP_PH2[id]) || (window.EOP_PH2B && window.EOP_PH2B[id]) || (window.EOP_PH2C && window.EOP_PH2C[id]) || MED[id] || (window.EOP_PH4 && window.EOP_PH4[id]) || ''; };
  /* a photo can have a version for every language (the writing inside the picture). The picture of the chosen language is used when there is one, otherwise the English photo:
     1) the picture the administrator uploaded for that language himself (OV.pv, the globe button in the editor) always comes first,
     2) then the Arabic, French and Russian pictures that came with the portal (photos4ar.js, photos4fr.js, photos4ru.js, listed in EOP_PHL),
     3) every other language shows the English photo. A photo never changes: only its own version in the language is shown. */
  var PLF = {};                              /* language -> 1 while its pictures are loading, 2 when they are here */
  var PLP = {};
  var plMap = function (id, l) { var m = window.EOP_PHL && id && window.EOP_PHL[id]; return (m && m[l]) || ''; };
  var plLoad = function (l) {
    if (!l || !window.EOP_PHL_FILES || !window.EOP_PHL_FILES[l]) return Promise.resolve();
    if (PLP[l]) return PLP[l];
    PLF[l] = 1;
    PLP[l] = new Promise(function (res) {
      /* the pictures of one language come in several small files (the GitHub upload refuses big ones); the language is ready when all of them are here */
      var fl = [].concat(window.EOP_PHL_FILES[l]), left = fl.length, bad = false;
      var fin = function (ok) { PLF[l] = ok ? 2 : 0; if (!ok) delete PLP[l]; res(); if (ok) setTimeout(function () { ver++; refreshPanels(); if ($('exm') && !$('exm').classList.contains('hidden') && !FUS.edit) fuPaint(); phSwap(); }, 0); };
      var one = function () { if (--left === 0) fin(!bad); };
      fl.forEach(function (f) {
        var sc = document.createElement('script');
        sc.src = f; sc.async = true; sc.onload = one; sc.onerror = function () { bad = true; one(); };
        document.head.appendChild(sc);
      });
    });
    return PLP[l];
  };
  var phV = function (id, l) {
    l = l || lg(); var v = id && OV.pv && OV.pv[id];
    if (v && v[l] && phUrl(v[l])) return v[l];
    var b = plMap(id, l); if (b && phUrl(b)) return b;
    return id;
  };
  var phL = function (id, l) { l = l || lg(); if (plMap(id, l) && PLF[l] !== 2) plLoad(l); return phUrl(phV(id, l)); };
  /* puts the picture of the chosen language into the pictures that are already on the screen (without redrawing the window, so nothing typed is lost) */
  var phSwap = function () {
    var q = document.querySelectorAll('img[data-ph]'), i, im, u;
    for (i = 0; i < q.length; i++) { im = q[i]; u = phL(im.getAttribute('data-ph'), im.getAttribute('data-l') || undefined); if (u && im.getAttribute('src') !== u) im.setAttribute('src', u); }
  };
  /* true while the picture of the chosen language is still being loaded (copying waits for it) */
  var phBusy = function (id, l) { l = l || lg(); return !!(plMap(id, l) && !(OV.pv && OV.pv[id] && OV.pv[id][l]) && PLF[l] !== 2 && window.EOP_PHL_FILES && window.EOP_PHL_FILES[l]); };
  var phEnsure = function (id, l) { return plLoad(l || lg()); };
  var kbPh = function (id) { return Math.round(((phUrl(id) || '').length - 23) * 0.75 / 1024); };
  var isA4 = function (p) { return !!(p.ph && /^a4/.test(p.ph)); }, isA6 = function (p) { return !!(p.ph && /^a6/.test(p.ph)); }, isA = function (p) { return isA4(p) || isA6(p); };
  var idxAll = function (t) { return t.parts.map(function (p, i) { return i; }); };
  var first = function () { return 'Rima'; };
  /* the old Google link of "About Us" (part 8) is shown, copied and edited as the new one, wherever it is still saved */
  var LNK0 = 'https://share.google/FDkLKh6wyTEq5wH5J', LNK1 = 'https://maps.app.goo.gl/8An9qpzsyTZbtRBr9?g_st=ac';
  var fixLnk = function (t) { return String(t == null ? '' : t).split(LNK0).join(LNK1); };
  var fill = function (t) { return fixLnk(String(t || '').replace(/\{consultant\}/g, first())); };
  var tt = function (k) { var a = Array.prototype.slice.call(arguments); return typeof ti === 'function' ? ti.apply(null, a) : k; };
  var isAdm = function () { return me === 'admin'; };

  /* ---------- minimized messages: "Minimize all" closes every message box; a box opens when it is pressed (remembered on this device) ---------- */
  var MM = L('kc_msgmin', {}); if (!MM || typeof MM !== 'object') MM = {};
  function mmGet(sc, id) { var s = MM[sc]; if (!s) return false; return (s.ov && s.ov[id] !== undefined) ? !!s.ov[id] : s.base === 'min'; }
  function mmSave() { S('kc_msgmin', MM); }
  function mmToggle(sc, id) { var s = MM[sc] = MM[sc] || { base: 'open', ov: {} }; s.ov = s.ov || {}; s.ov[id] = !mmGet(sc, id); mmSave(); }
  function mmAll(sc, min) { MM[sc] = { base: min ? 'min' : 'open', ov: {} }; mmSave(); }
  var mmBar = function (sc, title) { return '<div class="ep-mbar' + (sc === 'fu' ? ' ep-lite' : '') + '" style="grid-column:1/-1">' + (sc === 'fu' ? '' : '<b class="lux">' + esc(tt(title || 'Messages')) + '</b>') + '<span class="ep-sp"></span><button type="button" class="ep-btn" data-ex="mall" data-v="' + sc + '|min">&#9662; ' + esc(tt('Minimize all')) + '</button><button type="button" class="ep-btn" data-ex="mall" data-v="' + sc + '|open">&#9656; ' + esc(tt('Expand all')) + '</button></div>'; };
  /* the message cards of the calculators are built by the calculators; they get a clickable title here */
  function paintCard(hd) {
    var sc = hd.dataset.sc, id = hd.dataset.id, mn = mmGet(sc, id), b = hd.querySelector('b');
    if (b) b.textContent = (mn ? '\u25B8 ' : '\u25BE ') + hd.dataset.t0;
    var sib = hd.nextElementSibling; while (sib) { sib.style.display = mn ? 'none' : ''; sib = sib.nextElementSibling; }
  }
  function decorate(hostId, sc, prefix, bar) {
    var h = $(hostId); if (!h) return;
    if (bar && !h.querySelector('.ep-mbar')) h.insertAdjacentHTML('afterbegin', mmBar(sc));
    h.querySelectorAll(':scope > div').forEach(function (card) {
      var hd = card.firstElementChild; if (!hd) return;
      var btn = hd.querySelector('button[onclick]'), m = btn && /Copy\('([^']+)'\)/.exec(btn.getAttribute('onclick') || ''); if (!m) return;
      if (!hd.dataset.sc) {
        var b = hd.querySelector('b'); hd.dataset.t0 = b ? b.textContent : '';
        hd.dataset.sc = sc; hd.dataset.id = prefix + m[1]; hd.dataset.ex = 'bmin'; hd.dataset.v = sc + '|' + prefix + m[1]; hd.style.cursor = 'pointer';
        btn.setAttribute('onclick', 'event.stopPropagation();' + btn.getAttribute('onclick'));
      }
      paintCard(hd);
    });
  }
  function mmRepaint(sc) {
    document.querySelectorAll('[data-ex="bmin"][data-sc]').forEach(function (hd) { if (hd.dataset.sc === sc) paintCard(hd); });
    if (sc === 'calc') refreshPanels(); else if ($('exm') && !$('exm').classList.contains('hidden') && !FUS.edit) fuPaint();
  }

  /* ---------- the data ---------- */
  /* the language of the portal; LO is set for a moment while one message is built in the language that was chosen for that message (the language button inside the Follow up messages) */
  var LO = null, ML = {}, WL = null;      /* WL: the language chosen with the button in the header of the Follow up Messages window (null = the language of the portal) */
  var lg = function () { return LO || (typeof trdLg === 'function' ? trdLg() : 'en'); };
  var lgP = function () { return typeof trdLg === 'function' ? trdLg() : 'en'; };
  function dbMap() { var m = {}; if (typeof trdAll === 'function') trdAll().forEach(function (x) { var k = hk(x.t.n); if (!m[k]) m[k] = x; }); return m; }
  /* one explanation of the database (title + text) in the language of the portal */
  function blkTxt(k) {
    if (typeof trdIB !== 'function' || (typeof trdIDead === 'function' && trdIDead(k))) return '';
    var b = trdIB(k, lg()), t = (b.t || '').trim(), x = (b.x || '').trim();
    return t && x ? t + '\n\n' + x : (t || x);
  }
  /* explanations that belong to a treatment of the list although the Treatment Database does not link them to it */
  var IBX = [[/direct green/i, ['imp_direct']], [/composite bonding/i, ['bonding']]];
  function oldText(it, ph, db) {
    if (ph && it.g === 'Crowns') { if (/^a4/.test(ph)) return blkTxt('allon4'); if (/^a6/.test(ph)) return blkTxt('allon6'); }
    var r = db[it.key], ks = r ? (r.t.e || []).slice() : [];
    IBX.forEach(function (x) { if (x[0].test(it.nm || '')) x[1].forEach(function (k) { if (ks.indexOf(k) < 0) ks.push(k); }); });
    return ks.map(blkTxt).filter(Boolean).join('\n\n');
  }
  /* photos the administrator already put in the Follow up messages: they are used for the explanations of the same subject (until he chooses the photos of that treatment himself) */
  var SC = { v: -1, l: null };
  function fuScan() {
    if (SC.v === ver && SC.l) return SC.l;
    var out = [];
    fuList().forEach(function (s) { s.groups.forEach(function (g) { g.msgs.forEach(function (m) {
      var ph = (m.parts || []).map(function (p) { return p.ph; }).filter(Boolean); if (!ph.length) return;
      out.push({ hay: [s.n, g.n, m.title].join(' ').toLowerCase(), ph: ph });
    }); }); });
    SC = { v: ver, l: out }; return out;
  }
  function autoPh(blocks) {
    var out = [], KW = D0.kw || {}, S0 = fuScan();
    blocks.forEach(function (b) {
      var src = KW[b], re; if (!src) return; try { re = new RegExp(src, 'i'); } catch (e) { return; }
      S0.forEach(function (x) { if (re.test(x.hay)) x.ph.forEach(function (p) { if (out.indexOf(p) < 0) out.push(p); }); });
    });
    return out;
  }
  function items() {
    var db = dbMap(), base = itemsBase(db), have = {};
    base.forEach(function (x) { have[x.key] = 1; });
    /* a treatment that is not in the built-in lists but got photos from the administrator (📝 in the Treatment Database) */
    Object.keys(OV.items).forEach(function (k) {
      var row = db[k], o = OV.items[k]; if (have[k] || !row || !o || !Array.isArray(o.parts) || !o.parts.length) return;
      var it = { key: k, nm: row.t.n, dn: '', g: 'Treatments', k: 'other', mine: true }; it.title = typeof trdTn === 'function' ? trdTn(row.t) : row.t.n;
      it.parts = o.parts.map(function (p) { return { ph: p.ph || null, t: oldText(it, p.ph || null, db) }; }); base.push(it);
    });
    return base;
  }
  function itemsBase(db) {
    return D0.items.map(function (i) {
      var k = hk(i.nm), o = OV.items[k], mine = !!(o && Array.isArray(o.parts) && o.parts.length), P0 = mine ? o.parts : i.parts, row = db[k], it = { key: k, nm: i.nm, dn: i.dn || '', g: i.g, k: i.k, mine: mine };
      it.title = it.dn ? tt(it.dn) : (row && typeof trdTn === 'function' ? trdTn(row.t) : i.nm);
      it.parts = P0.map(function (p) { return { ph: p.ph || null, t: oldText(it, p.ph || null, db) }; });
      if (!mine && row) {
        var have = {}; it.parts.forEach(function (p) { if (p.ph) have[p.ph] = 1; });
        var extra = autoPh(row.t.e || []).filter(function (p) { return !have[p]; });
        if (extra.length) { if (it.parts.length === 1 && !it.parts[0].ph) it.parts = []; extra.forEach(function (p) { it.parts.push({ ph: p, t: oldText(it, p, db) }); }); }
      }
      return it;
    });
  }
  var itemBy = function (key) { return items().filter(function (x) { return x.key === key; })[0] || null; };
  /* the explanation boxes of a plan: the photos of every treatment that uses the explanation */
  function ibPhotos(k) {
    var out = [], seen = {}, db = dbMap(), add = function (ph) { if (ph && !seen[ph]) { seen[ph] = 1; out.push(ph); } }, I0 = items();
    I0.forEach(function (it) {
      var r = db[it.key]; if (!r || (r.t.e || []).indexOf(k) < 0) return;
      calcIdx(it).forEach(function (i) { add(it.parts[i].ph); });
    });
    if (k === 'allon4' || k === 'allon6') {   /* the All-on-4 / All-on-6 explanation: the posters of the bridges and the full-arch cases */
      var re = k === 'allon4' ? /^a4/ : /^a6/;
      I0.forEach(function (it) { it.parts.forEach(function (p) { if (p.ph && re.test(p.ph)) add(p.ph); }); });
      add('n06'); add('n40'); autoPh([k]).forEach(add);
    }
    return out;
  }
  function ibMsg(k) {
    var b = trdIB(k, lg()), txt = blkTxt(k), ph = ibPhotos(k), pf = PREF[k] || [];
    if (pf.length) ph = pf.filter(function (x) { return ph.indexOf(x) >= 0; }).concat(ph.filter(function (x) { return pf.indexOf(x) < 0; }));
    return { title: b.t || (typeof trdIL === 'function' ? trdIL(k) : k), parts: ph.length ? ph.map(function (p) { return { t: txt, ph: p }; }) : [{ t: txt, ph: null }] };
  }
  var fuList = function () { return OV.fu || D0.fu; };
  /* messages that belong to a treatment are shown on the treatment side (Patient Explanations), under their own category, and not in Messages.
     m.at = the category id (set it to '' to keep a message in Messages). Nothing is saved: the categories "Zygomatic", "Pterygoid Implants" and "Treatments" simply show there. */
  var MV_CAT = { 'zygomatic': 'zy', 'pterygoid implants': 'zy', 'treatments': '*' };
  var atOf = function (s, m) {
    if (typeof m.at === 'string') return m.at;
    var c = MV_CAT[String(s.n || '').trim().toLowerCase()]; if (!c) return '';
    if (c !== '*') return c;
    var t = String(m.title || '').toLowerCase();
    return /gum|periodon/.test(t) ? 'gu' : /orthodon|brace|aligner|invisalign/.test(t) ? 'or' : /hair/.test(t) ? 'ha' : 'dt';
  };
  var gone = function () { return OV.gone || []; };
  /* translations that came with the program for the messages and names that were already on the site: they are used only while no translation was typed in, and only while the English text is still exactly the one they were written for. Nothing is saved, so whatever was typed or changed on the site always wins. */
  var BTR = D0.btr || { n: {}, t: {} }, BL = ['fr', 'ar', 'tr', 'ru', 'es', 'de', 'ro', 'it', 'pt'];
  var nz = function (s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); };
  var btN = function (s, l) { var a = BTR.n[nz(s).toLowerCase()], i = BL.indexOf(l); return (a && i >= 0 && a[i]) || ''; };
  var btT = function (s, l) { var a = BTR.t[nz(s)], i = BL.indexOf(l); return (a && i >= 0 && a[i]) || ''; };
  var secN = function (s) { var l = lg(), v = s.nl && s.nl[l]; return (typeof v === 'string' && v.trim()) ? v : (btN(s.n, l) || s.n); };
  var mTitle = function (m) { var l = lg(), v = m.tn && m.tn[l]; return (typeof v === 'string' && v.trim()) ? v : (btN(m.title, l) || m.title || ''); };
  var pText = function (p) { var l = lg(), v = p.tl && p.tl[l]; return (typeof v === 'string' && v.trim()) ? v : (btT(p.t, l) || p.t || ''); };
  var locM = function (m) { return { id: m.id, title: mTitle(m), parts: m.parts.map(function (p) { return { t: pText(p), ph: p.ph || null }; }) }; };
  /* messages that came with the program (photo messages for Negotiation and Waiting For Photos) are added to the categories of the administrator without touching what he made; if he deletes one it stays deleted */
  function seedSec(S0, cat) {
    var nm = (D0.catnames && D0.catnames[cat]) || cat;
    return S0.filter(function (s) { return s.id === cat; })[0] || S0.filter(function (s) { return String(s.n || '').trim().toLowerCase() === nm; })[0] || null;
  }
  var VW = { v: -1, d: null };
  function fuView() {
    if (VW.v === ver && VW.d) return VW.d;
    var have = {}, out = fuList().map(function (s) { return { id: s.id, n: s.n, nl: s.nl, groups: s.groups.map(function (g) { g.msgs.forEach(function (m) { have[m.id] = 1; }); return { id: g.id, n: g.n, msgs: g.msgs.slice() }; }) }; });
    (D0.seeds || []).forEach(function (sd) { if (have[sd.id] || gone().indexOf(sd.id) >= 0) return; var s = seedSec(out, sd.cat); if (s && s.groups.length) s.groups[0].msgs.push(sd); });
    VW = { v: ver, d: out }; return out;
  }
  function materialize(id) {
    var has = fuList().some(function (s) { return s.groups.some(function (g) { return g.msgs.some(function (m) { return m.id === id; }); }); });
    if (has) return;
    var sd = (D0.seeds || []).filter(function (x) { return x.id === id; })[0]; if (!sd) return;
    if (!OV.fu) OV.fu = clone(D0.fu);
    var s = seedSec(OV.fu, sd.cat); if (s && s.groups.length) { s.groups[0].msgs.push(clone(sd)); ver++; }
  }
  function fuFind(id, view) {
    var S0 = view ? fuView() : fuList();
    for (var i = 0; i < S0.length; i++) for (var j = 0; j < S0[i].groups.length; j++) {
      var g = S0[i].groups[j], m = g.msgs.filter(function (x) { return x.id === id; })[0];
      if (m) return { s: S0[i], g: g, m: m };
    }
    return null;
  }
  var lkOf = function (key) { return ML[key] || (WL && $('exm') && !$('exm').classList.contains('hidden') ? WL : null); };
  function msgOf(key) {
    var l = lkOf(key), m;
    if (l && l !== lgP()) {
      LO = l;
      try { m = msgOf0(key); } finally { LO = null; }
      if (m) m = { id: m.id, title: m.title, lang: l, parts: m.parts.map(function (p) { var q = {}; Object.keys(p).forEach(function (k) { q[k] = p[k]; }); q.l = l; return q; }) };
      return m;
    }
    return msgOf0(key);
  }
  function msgOf0(key) {
    var i = key.indexOf(':'), k = key.slice(0, i), id = key.slice(i + 1);
    if (k === 'tx') { var t = itemBy(id); return t ? { title: t.title, parts: t.parts } : null; }
    if (k === 'ib') return ibMsg(id);
    if (k === 'st') return stMsg(id);
    if (k === 'fu') { var f = fuFind(id, true); return f ? locM(f.m) : null; }
    return null;
  }
  var noA = function (t) { return idxAll(t).filter(function (i) { return !isA(t.parts[i]); }); };
  var TABS = [
    { id: 'imp', n: 'Implants', pick: function (t) { return t.k === 'implant'; }, idx: idxAll },
    { id: 'cr', n: 'Crowns', pick: function (t) { return t.g === 'Crowns'; }, idx: function (t) { return idxAll(t).filter(function (i) { return !isA(t.parts[i]); }); } },
    { id: 'a4', n: 'All on 4', pick: function (t) { return t.parts.some(isA4); }, idx: function (t) { return idxAll(t).filter(function (i) { return isA4(t.parts[i]); }); }, lab: ' - All-on-4' },
    { id: 'a6', n: 'All on 6', pick: function (t) { return t.parts.some(isA6); }, idx: function (t) { return idxAll(t).filter(function (i) { return isA6(t.parts[i]); }); }, lab: ' - All-on-6' },
    { id: 'zy', n: 'Zygomatic', pick: function (t) { return t.k === 'zygomatic' || t.k === 'pterygoid'; }, idx: idxAll },
    { id: 'su', n: 'Surgery', og: 1, pick: function (t) { return t.g === 'Surgery'; }, idx: noA },
    { id: 'pr', n: 'Prosthetics', og: 1, pick: function (t) { return t.g === 'Prosthetics'; }, idx: noA },
    { id: 'dt', n: 'Dental treatments', og: 1, pick: function (t) { return t.g === 'Treatments'; }, idx: noA },
    { id: 'gu', n: 'Gums', og: 1, pick: function (t) { return t.g === 'Gums'; }, idx: noA },
    { id: 'or', n: 'Orthodontics', og: 1, pick: function (t) { return t.g === 'Orthodontics'; }, idx: noA },
    { id: 'st', n: 'Stay and transfers', og: 1, pick: function (t) { return t.g === 'Stay'; }, idx: noA },
    { id: 'ha', n: 'Hair transplant', ib: 'hair' },
    { id: 'mx', n: 'More explanations', ib: 'rest' }];
  var GORD = ['Surgery', 'Prosthetics', 'Treatments', 'Gums', 'Orthodontics', 'Stay'], GLAB = { Surgery: 'Surgery', Prosthetics: 'Prosthetics', Treatments: 'Treatments', Gums: 'Gums', Orthodontics: 'Orthodontics', Stay: 'Stay and transfers' };
  var calcIdx = function (t) { return t.g === 'Crowns' ? idxAll(t).filter(function (i) { return !isA(t.parts[i]); }) : idxAll(t); };
  var hasContent = function (t, only) { return (only || idxAll(t)).some(function (i) { return (t.parts[i].t || '').trim() || t.parts[i].ph; }); };
  /* the Patient Explanations of the Treatment Database that belong to no treatment of the lists above (hair transplant, the ones you wrote yourself ...) */
  function ibCovered() {
    var cov = { allon4: 1, allon6: 1 }, db = dbMap();
    items().forEach(function (it) { var r = db[it.key]; ((r && r.t.e) || []).forEach(function (k) { cov[k] = 1; }); IBX.forEach(function (x) { if (x[0].test(it.nm || '')) x[1].forEach(function (k) { cov[k] = 1; }); }); });
    return cov;
  }
  function ibTabBlocks(T) {
    var keys = typeof trdIK === 'function' ? trdIK() : [], cov = ibCovered(), off = OV.off || [];
    return keys.filter(function (k) { return T.ib === 'hair' ? /^hair_/.test(k) : (!/^hair_/.test(k) && !cov[k]); })
      .filter(function (k) { return off.indexOf(T.id + ':' + k) < 0; })
      .map(function (k) { var m = ibMsg(k); return { key: 'ib:' + k, m: m, only: idxAll(m), title: m.title, id: k, g: '', ib: true }; })
      .filter(function (b) { return hasContent(b.m, b.only); });
  }
  /* the messages of the administrator that belong to this treatment category */
  function movedBlocks(id) {
    var out = [];
    fuView().forEach(function (s) { s.groups.forEach(function (g) { g.msgs.forEach(function (m) {
      if (atOf(s, m) !== id) return;
      var lm = locM(m), ttl = (!String(lm.title || '').trim() || /^new message$/i.test(String(lm.title).trim())) ? secN(s) : lm.title;
      if (hasContent(lm, idxAll(lm))) out.push({ key: 'fu:' + m.id, m: lm, only: idxAll(lm), title: ttl, id: m.id, g: '', fu: true });
    }); }); });
    return out;
  }
  /* a moved message sits right after the explanation with the same name (if there is one), otherwise at the end */
  function placeMoved(base, mv) {
    var out = base.slice(), nm = function (b) { return String(b.title || '').trim().toLowerCase(); };
    mv.forEach(function (b) {
      var at = -1; out.forEach(function (x, k) { if (!x.fu && nm(x) === nm(b)) at = k; });
      if (at < 0) out.push(b); else out.splice(at + 1, 0, b);
    });
    return out;
  }
  function tabBlocks(id) {
    var T = TABS.filter(function (x) { return x.id === id; })[0]; if (!T) return [];
    if (T.ib) return placeMoved(ibTabBlocks(T), movedBlocks(id));
    var off = OV.off || [];
    var base = items().filter(T.pick).filter(function (t) { return off.indexOf(id + ':' + t.key) < 0 && !(T.og && off.indexOf('ot:' + t.key) >= 0); }).map(function (t) { return { key: 'tx:' + t.key, m: { title: t.title, parts: t.parts }, only: T.idx(t), title: t.title + (T.lab || ''), id: t.key, g: t.g }; })
      .filter(function (b) { return hasContent(b.m, b.only); });
    return placeMoved(base, movedBlocks(id));
  }

  /* ---------- favorites (belong to the person, follow her to any device) ---------- */
  var favKey = function () { return 'kc_fav_' + me; };
  var favs = function () { var o = L(favKey(), {}); return o && typeof o === 'object' ? o : {}; };
  function favList() {
    var f = favs();
    return Object.keys(f).sort(function (a, b) { return (f[b] || 0) - (f[a] || 0); }).map(function (k) {
      var j = k.lastIndexOf('|'), key = k.slice(0, j), i = +k.slice(j + 1), m = msgOf(key);
      return m && m.parts[i] ? { key: key, i: i, m: m } : null;
    }).filter(Boolean);
  }
  function favToggle(v) {
    var f = favs(); if (f[v]) delete f[v]; else f[v] = Date.now();
    S(favKey(), f);
    var on = !!f[v];
    document.querySelectorAll('[data-ex="fav"]').forEach(function (b) { if (b.dataset.v === v) { b.classList.toggle('ep-on', on); b.innerHTML = (on ? '&#9733; ' : '&#9734; ') + esc(tt('Favorite')); } });
    toast(on ? tt('Added to Favorites.') : tt('Removed from Favorites.'));
    if ($('exm') && !$('exm').classList.contains('hidden') && FUS.sec === 'fav') fuPaint();
    side();
  }

  /* ---------- copy ---------- */
  function pngOf(url) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { var c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); c.toBlob(function (b) { b ? res(b) : rej(new Error('picture')); }, 'image/png'); }; i.onerror = rej; i.src = url; }); }
  function copyText(text) {
    return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () {
      try { var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); return !!ok; } catch (e) { return false; }
    });
  }
  var htmlPart = function (text, url) { return esc(text).replace(/\n/g, '<br>') + (url ? '<br><br><img src="' + url + '" style="max-width:480px;width:100%">' : ''); };
  var canClip = function () { return !!(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write); };
  function copyBoth(text, url) {
    if (!url || !canClip()) return copyText(text).then(function (ok) { return ok ? 'text' : 'fail'; });
    var png = pngOf(url);
    var item = function (h) { var o = { 'text/plain': new Blob([text], { type: 'text/plain' }), 'image/png': png }; if (h) o['text/html'] = new Blob(['<div>' + htmlPart(text, url) + '</div>'], { type: 'text/html' }); return new ClipboardItem(o); };
    return navigator.clipboard.write([item(true)]).catch(function () { return navigator.clipboard.write([item(false)]); }).then(function () { return 'both'; }).catch(function () { return copyText(text).then(function (ok) { return ok ? 'text' : 'fail'; }); });
  }
  function split(v) { var j = v.lastIndexOf('|'), key = v.slice(0, j), i = +v.slice(j + 1), m = msgOf(key); return { key: key, i: i, m: m, p: m && m.parts[i] }; }
  function mark(btn, t) { if (!btn) return; btn.classList.remove('ep-gold'); btn.classList.add('ep-ok'); btn.innerHTML = '&#10003; ' + esc(t); }
  function copyPhoto(v, btn) {
    var s = split(v); if (!s.p || !s.p.ph) return;
    if (phBusy(s.p.ph, s.p.l)) { phEnsure(s.p.ph, s.p.l).then(function () { copyPhoto(v, btn); }); return; }
    if (!canClip()) { toast(tt('This window does not allow copying photos.')); return; }
    navigator.clipboard.write([new ClipboardItem({ 'image/png': pngOf(phL(s.p.ph, s.p.l)) })]).then(function () { TICK[v + ':ph'] = 1; mark(btn, tt('Photo copied')); toast(tt('Photo copied. Paste it in WhatsApp, then press 2 Copy text and paste it in the caption box.'), 5200); }, function () { toast(tt('Copy was blocked in this window.')); });
  }
  function copyTxt(v, btn) {
    var s = split(v); if (!s.p) return;
    copyText(fill(s.p.t)).then(function (ok) {
      if (!ok) { toast(tt('Copy was blocked in this window.')); return; }
      if (s.p.ph) { TICK[v + ':tx'] = 1; mark(btn, tt('Text copied')); toast(tt('Text copied. Paste it in the caption box under the photo.')); } else { TICK[v] = 1; mark(btn, tt('Copied')); toast(tt('Copied.')); }
    });
  }
  function copyPart(v, btn) {
    var s = split(v); if (!s.p) return;
    if (s.p.ph && phBusy(s.p.ph, s.p.l)) { phEnsure(s.p.ph, s.p.l).then(function () { copyPart(v, btn); }); return; }
    copyBoth(fill(s.p.t), s.p.ph ? phL(s.p.ph, s.p.l) : null).then(function (r) {
      if (r === 'fail') { toast(tt('Copy was blocked in this window.')); return; }
      TICK[v] = 1; mark(btn, s.p.ph ? tt('Copied - photo + text') : tt('Copied'));
      toast(r === 'both' ? tt('Copied photo + text. Paste in email or Notes. WhatsApp keeps only the photo: use 1 Copy photo, then 2 Copy text.') : (s.p.ph ? tt('Copied the text only: this window does not allow photos.') : tt('Copied.')), 5200);
    });
  }
  function copyAll(btn, key) {
    var m = msgOf(key); if (!m) return;
    var bz = m.parts.filter(function (p) { return p.ph && phBusy(p.ph, p.l); });
    if (bz.length) { Promise.all(bz.map(function (p) { return phEnsure(p.ph, p.l); })).then(function () { copyAll(btn, key); }); return; }
    var texts = m.parts.map(function (p) { return fill(p.t); }), plain = texts.filter(function (t) { return t.trim(); }).join('\n\n');
    var html = '<div>' + m.parts.map(function (p, i) { return htmlPart(texts[i], p.ph ? phL(p.ph, p.l) : null); }).join('<br><br>') + '</div>';
    var pr = canClip() ? navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([plain], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]).then(function () { return 'all'; }) : Promise.reject();
    pr.catch(function () { return copyText(plain).then(function (ok) { return ok ? 'text' : 'fail'; }); }).then(function (r) {
      if (r === 'fail') { toast(tt('Copy was blocked in this window.')); return; }
      toast(r === 'all' ? tt('Copied all parts in order. Paste in email or Notes. For WhatsApp use 1 Copy photo, then 2 Copy text, on each part.') : tt('Copied the texts only: this window does not allow photos.'), 5200);
    });
  }

  /* ---------- the blocks ---------- */
  function starHTML(k) { var on = !!favs()[k]; return '<button type="button" class="ep-btn ' + (on ? 'ep-on' : '') + '" data-ex="fav" data-v="' + esc(k) + '" aria-label="Favorite">' + (on ? '&#9733; ' : '&#9734; ') + esc(tt('Favorite')) + '</button>'; }
  var MVL = [];
  function admHTML(txk, i) {
    var v = txk + '|' + i, armed = FUS.delPh === v;
    return '<div class="ep-adm"><button type="button" class="ep-btn ' + (armed ? 'ep-bad' : '') + '" data-ex="txdel" data-v="' + esc(v) + '">&#128465; ' + esc(armed ? tt('Tap again to delete') : tt('Delete photo')) + '</button>'
      + '<select class="ep-in ep-mv" data-mv="' + esc(v) + '"><option value="">' + esc(tt('Move to another treatment...')) + '</option>' + MVL.filter(function (z) { return z.key !== txk; }).map(function (z) { return '<option value="' + esc(z.key) + '">' + esc(z.title) + '</option>'; }).join('') + '</select></div>';
  }
  function partHTML(key, i, Q, showN, txk) {
    var p = Q[i], k = key + '|' + i, done = TICK[k], dp = TICK[k + ':ph'], dt = TICK[k + ':tx'], hasT = !!(p.t || '').trim();
    if (!hasT && !p.ph) return '';
    var pn = showN ? '<span class="ep-pn">' + esc(tt('Part {0} of {1}').replace('{0}', i + 1).replace('{1}', Q.length)) + '</span>' : '';
    var miss = !!(p.ph && !phL(p.ph, p.l)), hasImg = !!p.ph && !miss;
    var bar = hasImg
      ? pn + '<button type="button" class="ep-btn ' + (dp ? 'ep-ok' : 'ep-gold') + '" data-ex="cphoto" data-v="' + esc(k) + '">' + (dp ? '&#10003; ' + esc(tt('Photo copied')) : '1 &middot; ' + esc(tt('Copy photo'))) + '</button>'
        + (hasT ? '<button type="button" class="ep-btn ' + (dt ? 'ep-ok' : 'ep-gold') + '" data-ex="ctxt" data-v="' + esc(k) + '">' + (dt ? '&#10003; ' + esc(tt('Text copied')) : '2 &middot; ' + esc(tt('Copy text'))) + '</button><button type="button" class="ep-btn ' + (done ? 'ep-ok' : '') + '" data-ex="cpart" data-v="' + esc(k) + '">' + (done ? '&#10003; ' + esc(tt('Copied')) + ' - ' + esc(tt('photo + text')) : esc(tt('Photo + text together'))) + '</button>' : '')
      : pn + '<button type="button" class="ep-btn ' + (done ? 'ep-ok' : 'ep-gold') + '" data-ex="cpart" data-v="' + esc(k) + '">' + (done ? '&#10003; ' + esc(tt('Copied')) : '&#128203; ' + esc(tt('Copy text'))) + '</button>';
    return '<div class="ep-part' + (hasImg ? ' ep-hasimg' : '') + (hasT ? '' : ' ep-notx') + '">' + (miss ? '<label class="ep-noimg"><span>&#128247; ' + esc(tt('No photo yet')) + '</span><b>+ ' + esc(tt('Add photo')) + '</b><input type="file" accept="image/*" data-pfill="' + esc(p.ph) + '" hidden></label>' : '') + (hasImg ? '<img class="ep-img" src="' + phL(p.ph, p.l) + '" alt="photo" data-ex="zoom" data-v="' + esc(p.ph) + '" data-ph="' + esc(p.ph) + '"' + (p.l ? ' data-l="' + esc(p.l) + '"' : '') + '>' : '')
      + (hasT ? '<div class="ep-pt" data-notr>' + esc(fill(p.t)) + '</div>' : '') + '<div class="ep-bar">' + bar + starHTML(k) + '</div>' + (txk && p.ph ? admHTML(txk, i) : '') + '</div>';
  }
  var BO = {};
  function blockHTML(key, m, o) {
    o = o || {};
    var sc = o.scope || 'calc'; BO[sc + '|' + key] = o;
    var lgOn = sc === 'fu';                   /* the Follow up messages window: all its messages follow the language button in the header */
    if (lgOn && lkOf(key) && lkOf(key) !== lgP()) { var m2 = msgOf(key); if (m2) m = m2; }
    var mid = key + (o.only ? '#' + o.only.join('.') : ''), mn = mmGet(sc, mid);
    var Q = m.parts, idx = o.only || Q.map(function (p, i) { return i; }), nph = idx.filter(function (i) { return Q[i].ph; }).length;
    var pick = (!!o.pick && idx.length > 1) || (lgOn && idx.length > 1 && nph > 1);   /* several pictures: the small ones are shown to choose from, then the chosen one (a list of text-only parts stays a list) */
    var multi = Q.length > 1 && !o.only && !o.pick && !o.noall, body;
    if (pick) {
      var sel = idx.indexOf(SEL[key]) >= 0 ? SEL[key] : idx[0];
      body = '<div class="ep-sub">' + esc(tt('Choose what to send')) + ' (' + idx.length + ')</div><div class="ep-pick">' + idx.map(function (i, n) {
        return '<button type="button" class="ep-pk ' + (i === sel ? 'ep-on' : '') + '" data-ex="pick" data-v="' + esc(key) + '|' + i + '" aria-label="Option ' + (n + 1) + '">' + (Q[i].ph ? '<img src="' + phL(Q[i].ph, Q[i].l) + '" alt="" data-ph="' + esc(Q[i].ph) + '"' + (Q[i].l ? ' data-l="' + esc(Q[i].l) + '"' : '') + '>' : '<span>' + esc(tt('Text')) + ' ' + (n + 1) + '</span>') + '</button>';
      }).join('') + '</div>' + partHTML(key, sel, Q, false, o.txkey);
    } else body = idx.map(function (i) { return partHTML(key, i, Q, Q.length > 1 && idx.length > 1, o.txkey); }).join('');
    if (mn) body = '';
    return '<div class="ep-blk" data-key="' + esc(key) + '"' + (pick && !mn ? ' data-pick="1" data-sc="' + sc + '"' : '') + '><div class="ep-bh ep-hd" data-ex="bmin" data-v="' + sc + '|' + esc(mid) + '" title="' + esc(tt(mn ? 'Press to open' : 'Press to minimize')) + '"><span class="ep-car">' + (mn ? '&#9656;' : '&#9662;') + '</span><b class="lux" data-notr>' + esc(o.title || m.title) + '</b>'
      + (multi ? '<span class="ep-chip">' + esc(tt('{0} parts', Q.length)) + '</span>' : '') + '<span class="ep-sp"></span>'
      + (multi && !mn ? '<button type="button" class="ep-btn" data-ex="call" data-v="' + esc(key) + '" title="' + esc(tt('Copies every text and photo in order, for email or Notes')) + '">' + esc(tt('Copy all in order')) + '</button>' : '')
      + (o.ord ? '<span class="ep-mvud"><button type="button" class="ep-btn" data-ex="mmv" data-v="' + esc(o.ord.id) + '|-1" title="' + esc(tt('Move up')) + '" aria-label="' + esc(tt('Move up')) + '"' + (o.ord.first ? ' disabled' : '') + '>&#9650;</button><button type="button" class="ep-btn" data-ex="mmv" data-v="' + esc(o.ord.id) + '|1" title="' + esc(tt('Move down')) + '" aria-label="' + esc(tt('Move down')) + '"' + (o.ord.last ? ' disabled' : '') + '>&#9660;</button></span>' : '')
      + (o.mv ? '<button type="button" class="ep-btn' + (FUS.mv === o.mv ? ' ep-on' : '') + '" data-ex="fumv" data-v="' + esc(o.mv) + '">&#8644; ' + esc(tt('Move to...')) + '</button>' : '')
      + (o.edit ? '<button type="button" class="ep-btn" data-ex="' + o.edit + '" data-v="' + esc(o.id) + '">' + esc(tt('Edit')) + '</button>' : '')
      + (o.del ? '<button type="button" class="ep-btn ' + (FUS.delItem === o.delId ? 'ep-bad' : '') + '" data-ex="' + o.del + '" data-v="' + esc(o.delId) + '">&#128465; ' + esc(FUS.delItem === o.delId ? tt('Tap again to delete') : tt('Delete')) + '</button>' : '') + '</div>' + (o.mv && FUS.mv === o.mv ? mvBar(o.mv) : '') + body + '</div>';
  }
  /* version 3.4: "Move to..." - the list of every category (and every NR) a message can be moved into */
  function mvBar(id) {
    var f = fuFind(id, true), opts = fuList().map(function (s) {
      return s.groups.map(function (g) {
        var here = f && f.s.id === s.id && f.g.id === g.id;
        return '<option value="' + esc(s.id + '|' + g.id) + '"' + (here ? ' disabled' : '') + '>' + esc(secN(s) + (s.groups.length > 1 ? ' \u00B7 ' + g.n : '') + (here ? ' (' + tt('here now') + ')' : '')) + '</option>';
      }).join('');
    }).join('');
    return '<div class="ep-bar ep-mvbar"><b style="font-size:12px">' + esc(tt('Move this message to')) + '</b><select id="ex_mv" class="ep-in" aria-label="' + esc(tt('Move this message to')) + '"><option value="">' + esc(tt('Choose...')) + '</option>' + opts + '</select>'
      + '<button type="button" class="ep-btn ep-gold" data-ex="fumvok" data-v="' + esc(id) + '">' + esc(tt('Move')) + '</button><button type="button" class="ep-btn" data-ex="fumvno">' + esc(tt('Cancel')) + '</button></div>';
  }
  var hasPhoto = function (m, idx) { return (idx || m.parts.map(function (p, i) { return i; })).some(function (i) { return m.parts[i].ph; }); };
  var calcOpts = function (key) { var t = key.indexOf('tx:') === 0 ? itemBy(key.slice(3)) : null; return { pick: true, scope: 'calc', only: t ? calcIdx(t) : null, title: TITLES[key] }; };

  /* ---------- the panel under a calculator: one block per treatment that was chosen ---------- */
  var panels = {};
  function minOf(id) { return MIN[id] === undefined ? !!L('kc_exmin_' + id, false) : MIN[id]; }
  function panelHTML(id, title, inner, compact) {
    var m = minOf(id);
    return '<div class="ep-panel' + (compact ? ' ep-cmp' : '') + '"><div class="ep-ph"><b class="lux">' + esc(tt(title)) + '</b><span class="ep-sp"></span>'
      + (compact ? '' : '<button type="button" class="ep-btn" data-ex="fumodal">&#128221; ' + esc(tt('Follow up Messages')) + '</button><button type="button" class="ep-btn" data-ex="favmodal">&#9733; ' + esc(tt('Favorites')) + '</button>')
      + '<button type="button" class="ep-btn" data-ex="mall" data-v="calc|min">&#9662; ' + esc(tt('Minimize all')) + '</button><button type="button" class="ep-btn" data-ex="mall" data-v="calc|open">&#9656; ' + esc(tt('Expand all')) + '</button>'
      + '<button type="button" class="ep-btn" data-ex="min" data-v="' + id + '">' + (m ? '&#9656; ' + esc(tt('Expand')) : '&#9662; ' + esc(tt('Minimize'))) + '</button></div>'
      + (m ? '' : '<div class="ep-pb">' + inner + '</div>') + '</div>';
  }
  /* one box for every explanation the plan needs (the same ones as the message About your treatments) */
  function ibBlocks(o) {
    var I = typeof trcInfoB === 'function' ? trcInfoB(o && o.rows ? o : { rows: Array.isArray(o) ? o : [], pk: {} }) : { blocks: [] }, rows = (o && o.rows) || (Array.isArray(o) ? o : []);
    var list = I.blocks.map(function (b) {
      var names = [], pref = [];
      rows.forEach(function (r) {
        var t = r && r.t; if (!t || (t.e || []).indexOf(b.k) < 0) return;
        var nm = typeof trdTn === 'function' ? trdTn(t) : t.n; if (names.indexOf(nm) < 0) names.push(nm);
        var it = itemBy(hk(t.n)); if (it) calcIdx(it).forEach(function (i) { var ph = it.parts[i].ph; if (ph && pref.indexOf(ph) < 0) pref.push(ph); });
      });
      return { k: b.k, key: 'ib:' + b.k, t: b.t || '', x: b.x || '', names: names, pref: pref };
    });
    /* version 3.0: the implant brand always comes first, then the rest in their usual order */
    var isImp = function (b) { return typeof trcBR === 'function' && trcBR(b.k) === 'impl'; };
    return list.filter(isImp).concat(list.filter(function (b) { return !isImp(b); }));
  }
  /* the accommodation of one package: the hotel that was chosen (its photos and text from the Accommodation library),
     or, when the package has no hotel, the transportation photo with a sentence that we provide the transportation */
  var STX = {
    t: ['Private transportation', 'Transport priv\u00E9', '\u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u062E\u0627\u0635', '\u00D6zel ula\u015F\u0131m', '\u041B\u0438\u0447\u043D\u044B\u0439 \u0442\u0440\u0430\u043D\u0441\u0444\u0435\u0440', 'Transporte privado', 'Privater Transport', 'Transport privat', 'Trasporto privato', 'Transporte privado'],
    x: ['We provide your transportation: private airport and city transfers are arranged by the clinic for you.',
      'Nous assurons votre transport\u00A0: les transferts priv\u00E9s depuis l\u2019a\u00E9roport et en ville sont organis\u00E9s par la clinique.',
      '\u0646\u0648\u0641\u0651\u0631 \u0644\u0643 \u0648\u0633\u064A\u0644\u0629 \u0627\u0644\u0646\u0642\u0644: \u062A\u062A\u0648\u0644\u0649 \u0627\u0644\u0639\u064A\u0627\u062F\u0629 \u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u062A\u0646\u0642\u0644\u0627\u062A \u0627\u0644\u062E\u0627\u0635\u0629 \u0645\u0646 \u0627\u0644\u0645\u0637\u0627\u0631 \u0648\u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u062F\u064A\u0646\u0629.',
      'Ula\u015F\u0131m\u0131n\u0131z\u0131 biz sa\u011Fl\u0131yoruz: havaliman\u0131 ve \u015Fehir i\u00E7i \u00F6zel transferleriniz klinik taraf\u0131ndan organize edilir.',
      '\u041C\u044B \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0438\u0432\u0430\u0435\u043C \u0432\u0430\u0448 \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442: \u0438\u043D\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043B\u044C\u043D\u044B\u0435 \u0442\u0440\u0430\u043D\u0441\u0444\u0435\u0440\u044B \u0438\u0437 \u0430\u044D\u0440\u043E\u043F\u043E\u0440\u0442\u0430 \u0438 \u043F\u043E \u0433\u043E\u0440\u043E\u0434\u0443 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0443\u0435\u0442 \u043A\u043B\u0438\u043D\u0438\u043A\u0430.',
      'Nos encargamos de su transporte: la cl\u00EDnica organiza los traslados privados desde el aeropuerto y por la ciudad.',
      'Wir k\u00FCmmern uns um Ihren Transport: Private Transfers vom Flughafen und in der Stadt organisiert die Klinik f\u00FCr Sie.',
      'V\u0103 asigur\u0103m transportul: transferurile private de la aeroport \u0219i \u00EEn ora\u0219 sunt organizate de clinic\u0103.',
      'Ci occupiamo del vostro trasporto: i trasferimenti privati dall\u2019aeroporto e in citt\u00E0 sono organizzati dalla clinica.',
      'Tratamos do seu transporte: os transportes privados do aeroporto e na cidade s\u00E3o organizados pela cl\u00EDnica.']
  };
  var stIdx = function () { var l = lg(), i = typeof LANGS !== 'undefined' ? LANGS.map(function (z) { return z[0]; }).indexOf(l) : 0; return i < 0 ? 0 : i; };
  function stMsg(id) {
    if (id !== 'transport') return null;
    var i = stIdx(); return { id: 'st:transport', title: STX.t[i] || STX.t[0], parts: [{ t: STX.x[i] || STX.x[0], ph: 'ab_vans' }] };
  }
  function stayOf(hostId, o) {
    var r = { drop: false, html: '', sig: '' }; if (!o || !o.stay) return r;
    var hn = o.stay.hn || '';
    if (hn) {
      if (!window.EL || !EL.stay) return r;
      var z = EL.stay.get(hn);
      if (z === undefined) {
        EL.stay.load(hn).then(function () { var h = $(hostId); if (h && panels[hostId] === o) { h.dataset.dirty = 1; render(hostId, o); } });
        r.drop = true; r.html = '<p class="ep-sub">' + esc(tt('Loading...')) + '</p>'; r.sig = 'L'; return r;
      }
      if (z) { r.drop = true; r.html = EL.stay.html(hn); r.sig = 'R' + z.id; } else r.sig = 'N';
      return r;
    }
    if (o.stay.any) { var key = 'st:transport', m = stMsg('transport'); TITLES[key] = m.title; r.html = blockHTML(key, m, calcOpts(key)); r.sig = 'T' + stIdx(); }
    return r;
  }
  function render(hostId, o) {
    var host = $(hostId); if (!host) return;
    var B = ibBlocks(o), sy = stayOf(hostId, o);
    if (sy.drop) B = B.filter(function (b) { return b.k !== 'hotel'; });
    var sig = B.map(function (b) { return b.k + ':' + b.t.length + ':' + b.x.length + ':' + b.pref.join('.'); }).join(',') + '|' + ver + '|' + minOf(hostId) + '|' + me + '|' + lg() + '|' + JSON.stringify(MM.calc || 0) + '|' + sy.sig;
    panels[hostId] = o;
    if (host.dataset.sig === sig && !host.dataset.dirty) return;
    host.dataset.sig = sig; delete host.dataset.dirty;
    B.forEach(function (b) {
      var s = b.pref.join('.'); if (PREFSIG[b.k] !== s) { PREFSIG[b.k] = s; delete SEL[b.key]; }
      PREF[b.k] = b.pref; TITLES[b.key] = b.names.length ? b.names.join(' \u00B7 ') : b.t;
    });
    var M = B.map(function (b) { return { b: b, m: ibMsg(b.k) }; });
    var inner = (M.length || sy.html) ? M.map(function (z) { return blockHTML(z.b.key, z.m, calcOpts(z.b.key)); }).join('') + sy.html
      : '<p class="ep-sub">' + esc(tt('Enter a quantity above and every explanation you need for the plan appears here, with its photo.')) + '</p>';
    host.innerHTML = panelHTML(hostId, (o && o.title) || 'Explanations & photos', inner, !!(o && o.compact));
  }
  function refreshPanels() { Object.keys(panels).forEach(function (id) { var h = $(id); if (h) { h.dataset.dirty = 1; render(id, panels[id]); } }); }
  function pickPh(v) {
    var j = v.lastIndexOf('|'), key = v.slice(0, j); SEL[key] = +v.slice(j + 1);
    document.querySelectorAll('.ep-blk[data-key]').forEach(function (el) { if (el.dataset.key === key && el.dataset.pick) { var m = msgOf(key), o2 = BO[(el.dataset.sc || 'calc') + '|' + key]; if (m) el.outerHTML = blockHTML(key, m, o2 || calcOpts(key)); } });
  }

  /* ---------- the Follow Up Messages window ---------- */
  var tabOn = function (t) { var hide = OV.hide || []; return hide.indexOf(t.id) < 0 && !(t.og && hide.indexOf('ot') >= 0); };
  function secs() {
    return [{ id: 'fav', n: '\u2605 ' + tt('Favorites') }].concat(fuView().map(function (s) {
      var gs = s.groups.map(function (g) { return { id: g.id, n: g.n, msgs: g.msgs.filter(function (m) { return !atOf(s, m); }) }; });
      var moved = s.groups.some(function (g) { return g.msgs.some(function (m) { return atOf(s, m); }); });
      return { id: s.id, n: secN(s), groups: gs, empty: moved && gs.every(function (g) { return !g.msgs.length; }) };
    }).filter(function (x) { return !x.empty; }))
      .concat(TABS.filter(function (t) { return tabOn(t) && (!t.ib || tabBlocks(t.id).length); }).map(function (t) { return { id: t.id, n: tt(t.n), tab: true }; }));
  }
  /* the ONE language button of the window (next to its title): the text and the pictures of every message change to the chosen language; the language of the portal stays as it is */
  function lgHead() {
    return '<label class="ep-lgw" title="' + esc(tt('Language of the messages')) + '"><span aria-hidden="true">&#127760;</span><select id="exlg" class="ep-in ep-lgs" aria-label="' + esc(tt('Language of the messages')) + '">'
      + LL(false).map(function (l) { return '<option value="' + l[0] + '">' + esc(l[1]) + '</option>'; }).join('') + '</select></label>';
  }
  function ensureModal() {
    var m = $('exm'); if (m) return m;
    m = document.createElement('div'); m.id = 'exm'; m.className = 'ep-ov hidden';
    m.innerHTML = '<div class="ep-md" role="dialog" aria-modal="true"><div class="ep-mh"><b class="lux" id="ext">' + esc(tt('Follow up Messages')) + '</b>' + lgHead() + '<button type="button" class="ep-x" data-ex="close" aria-label="Close">&times;</button></div><div id="exb"></div></div>';
    document.body.appendChild(m);
    var lb = document.createElement('div'); lb.id = 'exlb'; lb.className = 'ep-lb hidden'; document.body.appendChild(lb);
    return m;
  }
  function open(sec) {
    var m = ensureModal(); FUS.edit = null; PE = null;
    FUS.q = ''; FUS.addCat = false; FUS.delArm = null; FUS.delGrp = null;
    if (sec) FUS.sec = sec; else if (!FUS.sec) FUS.sec = 'fav';
    $('ext').textContent = tt('Follow up Messages'); m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; fuPaint();
    var b = $('exb'); if (b) b.scrollTop = 0;
  }
  function close() { FUS.ro = false; FUS.mv = null; if (window.EL) EL.reset(); ML = {}; if (WL) { WL = null; ver++; refreshPanels(); } FUS.mg = false; var m = $('exm'); if (m) m.classList.add('hidden'); document.body.style.overflow = ''; FUS.edit = null; PE = null; FUS.delItem = null; FUS.delPh = null; var l = $('exlb'); if (l) { l.classList.add('hidden'); l.innerHTML = ''; } }
  function fuPaint() {
    var e = $('exb'); if (!e) return;
    var sl = $('exlg'); if (sl) sl.value = WL || lgP();
    var y = e.scrollTop; e.innerHTML = FUS.edit ? peHTML() : fuHTML();
    e.querySelectorAll('.ep-tabs').forEach(function (t) { var on = t.querySelector('.ep-tab.ep-on'); if (on) t.scrollLeft = Math.max(0, on.offsetLeft - 12); });
    if (FUS.edit) e.scrollTop = 0; else e.scrollTop = y;
  }
  function tabOpts(tid, b) {
    if (b.fu) { var o0 = { scope: 'fu', title: b.title }; if (isAdm() && FUS.mg) { o0.edit = 'edfu'; o0.id = b.id; o0.del = 'fudel'; o0.delId = 'm:' + b.id; } return o0; }
    var adm = isAdm(), same = b.only.length > 1 && b.only.every(function (i) { return (b.m.parts[i].t || '') === (b.m.parts[b.only[0]].t || ''); });
    var o = { scope: 'fu', only: b.only, noall: true, title: b.title, pick: same };
    if (adm && FUS.mg) {
      if (b.ib) { o.del = 'ibdel'; o.delId = 'x:' + b.id; }
      else { o.edit = 'edtx'; o.id = b.id; o.del = 'txhide'; o.delId = tid + ':' + b.id; o.txkey = b.id; }
    }
    return o;
  }
  var topOf = function (sec) { return sec.id === 'fav' ? 'fav' : sec.tab ? 'exp' : 'msg'; };
  function goSec(id) {
    FUS.lt = null; FUS.sec = id; FUS.delArm = null; FUS.delGrp = null; FUS.delItem = null; FUS.delPh = null; FUS.addCat = false;
    var sc = fuList().filter(function (x) { return x.id === id; })[0]; if (sc) FUS.grp = sc.groups[0].id;
  }
  /* the order of the top tabs (Favorites, Messages, Patient Explanations, Before and After, Accommodation, Status): the administrator changes it, everybody sees it */
  function topOrder() {
    var all = ['fav', 'msg', 'exp'].concat(window.EL ? EL.tops : []), o = (Array.isArray(OV.top) ? OV.top : []).filter(function (k, i, a) { return all.indexOf(k) >= 0 && a.indexOf(k) === i; });
    all.forEach(function (k) { if (o.indexOf(k) < 0) o.push(k); });
    return o;
  }
  function moveTop(v) {
    var q = v.split('|'), k = q[0], d = +q[1], o = topOrder(), i = o.indexOf(k), j = i + d;
    if (i < 0 || j < 0 || j >= o.length) return;
    o.splice(i, 1); o.splice(j, 0, k); OV.top = o; saveOV(); fuPaint();
  }
  /* version 3.4: the order of the categories of Messages, of the NR tabs and of the messages inside them (administrator, ⇅ Reorder) */
  function fuOwn() { if (!OV.fu) OV.fu = clone(D0.fu); return OV.fu; }
  function moveSec(v) {
    var q = v.split('|'), d = +q[1], ids = secs().filter(function (s) { return s.id !== 'fav' && topOf(s) === 'msg'; }).map(function (s) { return s.id; });
    var i = ids.indexOf(q[0]), j = i + d; if (i < 0 || j < 0 || j >= ids.length) return;
    var F = fuOwn(), a = F.findIndex(function (s) { return s.id === ids[i]; }), b = F.findIndex(function (s) { return s.id === ids[j]; }); if (a < 0 || b < 0) return;
    var t = F[a]; F[a] = F[b]; F[b] = t; saveOV(); fuPaint();
  }
  function moveGrp(v) {
    var q = v.split('|'), d = +q[1], s = fuOwn().filter(function (x) { return x.id === FUS.sec; })[0]; if (!s) return;
    var i = s.groups.findIndex(function (g) { return g.id === q[0]; }), j = i + d; if (i < 0 || j < 0 || j >= s.groups.length) return;
    var t = s.groups[i]; s.groups[i] = s.groups[j]; s.groups[j] = t; saveOV(); fuPaint();
  }
  function moveMsg(v) {
    var q = v.split('|'), d = +q[1], sec = secs().filter(function (s) { return s.id === FUS.sec; })[0]; if (!sec || !sec.groups) return;
    var vg = sec.groups.filter(function (g) { return g.id === FUS.grp; })[0] || sec.groups[0], ids = vg.msgs.map(function (m) { return m.id; });
    var i = ids.indexOf(q[0]), j = i + d; if (i < 0 || j < 0 || j >= ids.length) return;
    ids.splice(j, 0, ids.splice(i, 1)[0]); ids.forEach(materialize);
    var s = fuOwn().filter(function (x) { return x.id === sec.id; })[0], g = s && s.groups.filter(function (x) { return x.id === vg.id; })[0]; if (!g) return;
    var by = {}, at = []; g.msgs.forEach(function (m, k) { if (ids.indexOf(m.id) >= 0) { by[m.id] = m; at.push(k); } });
    if (at.length !== ids.length) return;
    at.forEach(function (k, n) { g.msgs[k] = by[ids[n]]; }); saveOV(); fuPaint();
  }
  /* version 3.4: "Move to..." - a message goes to the end of another category (or another NR) */
  function moveTo(id) {
    var sl = $('ex_mv'), v = sl && sl.value; if (!v) { toast(tt('Choose where the message goes.')); return; }
    var p = v.indexOf('|'), sid = v.slice(0, p), gid = v.slice(p + 1);
    materialize(id); fuOwn();
    var f = fuFind(id, false), s = OV.fu.filter(function (x) { return x.id === sid; })[0], g = s && s.groups.filter(function (x) { return x.id === gid; })[0];
    if (!f || !g || f.g === g) return;
    f.g.msgs = f.g.msgs.filter(function (m) { return m.id !== id; }); g.msgs.push(f.m);
    FUS.mv = null; saveOV(); fuPaint(); toast(tt('Moved to {0}.', secN(s) + (s.groups.length > 1 ? ' \u00B7 ' + g.n : '')));
  }
  function fuMain() {
    var adm = isAdm(), mg = adm && FUS.mg, S0 = secs(), sec = S0.filter(function (s) { return s.id === FUS.sec; })[0] || S0[1] || S0[0];
    var grp = sec.groups ? (sec.groups.filter(function (g) { return g.id === FUS.grp; })[0] || sec.groups[0]) : null, LT = (FUS.lt && window.EL && EL.tops.indexOf(FUS.lt) >= 0) ? FUS.lt : null, top = LT || topOf(sec);
    if (!LT) FUS.last[top] = sec.id;
    var cnt = function (s) { return s.id === 'fav' ? favList().length : s.tab ? tabBlocks(s.id).length : s.groups.reduce(function (n, g) { return n + g.msgs.length; }, 0); };
    var tb = function (v, label, n) { return '<button type="button" class="ep-tab ' + (top === v ? 'ep-on' : '') + '" data-ex="top" data-v="' + v + '">' + label + (n ? '<small>' + n + '</small>' : '') + '</button>'; };
    var TOPL = { fav: '&#9733; ' + esc(tt('Favorites')), msg: esc(tt('Messages')), exp: esc(tt('Patient Explanations')) };
    if (window.EL) EL.tops.forEach(function (k) { TOPL[k] = esc(tt(EL.names[k])); });
    var ord = topOrder(), ro = adm && FUS.ro;
    var h = '<div class="ep-tabs ep-top">' + ord.map(function (k, i) {
      if (!ro) return tb(k, TOPL[k], 0);
      return '<span class="ep-rt"><button type="button" class="ep-btn" data-ex="tmv" data-v="' + k + '|-1" aria-label="Move left"' + (i ? '' : ' disabled') + '>&#9664;</button><b>' + TOPL[k] + '</b><button type="button" class="ep-btn" data-ex="tmv" data-v="' + k + '|1" aria-label="Move right"' + (i < ord.length - 1 ? '' : ' disabled') + '>&#9654;</button></span>';
    }).join('')
      + '</div>';
    if (top !== 'fav' && !LT) {
      var SUBS = S0.filter(function (s) { return s.id !== 'fav' && topOf(s) === top; }), sro = ro && top === 'msg';
      h += '<div class="ep-tabs ep-sub2">' + SUBS.map(function (s, i) { var c = cnt(s); return (sro ? '<span class="ep-rt"><button type="button" class="ep-btn" data-ex="smv" data-v="' + s.id + '|-1" aria-label="' + esc(tt('Move left')) + '"' + (i ? '' : ' disabled') + '>&#9664;</button>' : '') + '<button type="button" class="ep-tab ' + (s.id === sec.id ? 'ep-on' : '') + '" data-ex="tab" data-v="' + s.id + '">' + esc(s.n) + (c ? '<small>' + c + '</small>' : '') + '</button>' + (sro ? '<button type="button" class="ep-btn" data-ex="smv" data-v="' + s.id + '|1" aria-label="' + esc(tt('Move right')) + '"' + (i < SUBS.length - 1 ? '' : ' disabled') + '>&#9654;</button></span>' : ''); }).join('') + '</div>';
    }
    if (sec.id === 'nr' && !LT) h += '<div class="ep-tabs ep-sub3">' + sec.groups.map(function (g, i) { return (ro ? '<span class="ep-rt"><button type="button" class="ep-btn" data-ex="gmv" data-v="' + g.id + '|-1" aria-label="' + esc(tt('Move left')) + '"' + (i ? '' : ' disabled') + '>&#9664;</button>' : '') + '<button type="button" class="ep-tab ' + (g.id === grp.id ? 'ep-on' : '') + '" data-ex="grp" data-v="' + g.id + '">' + esc(g.n) + (g.msgs.length ? '<small>' + g.msgs.length + '</small>' : '') + '</button>' + (ro ? '<button type="button" class="ep-btn" data-ex="gmv" data-v="' + g.id + '|1" aria-label="' + esc(tt('Move right')) + '"' + (i < sec.groups.length - 1 ? '' : ' disabled') + '>&#9654;</button></span>' : ''); }).join('') + (mg ? '<button type="button" class="ep-tab" data-ex="addnr">+ ' + esc(tt('Add NR')) + '</button>' : '') + (mg && sec.groups.length > 1 ? '<button type="button" class="ep-tab ' + (FUS.delGrp === grp.id ? 'ep-redtab' : '') + '" data-ex="grpdel">' + esc(FUS.delGrp === grp.id ? tt('Tap again to delete {0}').replace('{0}', grp.n) : tt('Delete {0}').replace('{0}', grp.n)) + '</button>' : '') + '</div>';
    if (LT) return h + '<div style="height:6px"></div>' + EL.html(LT);
    if (mg) {
      h += '<div class="ep-bar ep-mgbar">' + (FUS.addCat
        ? '<input type="text" id="ex_newcat" class="ep-in" maxlength="40" placeholder="' + esc(tt('Category name')) + '"><button type="button" class="ep-btn ep-gold" data-ex="catok">' + esc(tt('Add')) + '</button><button type="button" class="ep-btn" data-ex="catno">' + esc(tt('Cancel')) + '</button>'
        : '<button type="button" class="ep-btn" data-ex="catadd">+ ' + esc(tt('Add category')) + '</button>')
        + (sec.id !== 'fav' ? '<button type="button" class="ep-btn ' + (FUS.delArm === sec.id ? 'ep-bad' : '') + '" data-ex="catdel">' + esc(FUS.delArm === sec.id ? tt('Tap again to delete {0}').replace('{0}', sec.n) : tt('Delete this category')) + '</button>' : '')
        + (((OV.hide || []).length + (OV.off || []).length) ? '<button type="button" class="ep-btn" data-ex="catrestore">' + esc(tt('Show deleted picture lists')) + ' (' + ((OV.hide || []).length + (OV.off || []).length) + ')</button>' : '')
        + '<button type="button" class="ep-btn" data-ex="fuexp">&#11015; ' + esc(tt('Export messages')) + '</button><label class="ep-btn" style="cursor:pointer">&#11014; ' + esc(tt('Import translations')) + '<input type="file" accept=".json,application/json" data-fuimp hidden></label></div>';
    }
    var blocks;
    if (sec.id === 'fav') {
      var L1 = favList();
      blocks = (L1.length ? L1.map(function (f) { return blockHTML(f.key, f.m, { scope: 'fu', only: [f.i], noall: true, title: f.m.title + (f.m.parts.length > 1 ? ' - ' + tt('Part {0}', f.i + 1) : '') }); }).join('') : '<div class="ep-note">' + esc(tt('No favorites yet.')) + ' ' + esc(tt('Press {0} under any photo and it will wait for you here.', '\u0001')).replace('\u0001', '<b>&#9734; ' + esc(tt('Favorite')) + '</b>') + '</div>');
    } else if (sec.tab) {
      blocks = tabBlocks(sec.id).map(function (b) { return blockHTML(b.key, b.m, tabOpts(sec.id, b)); }).join('') || '<div class="ep-note">' + esc(tt('No messages here yet.')) + '</div>';
    } else {
      blocks = (grp.msgs.length ? grp.msgs.map(function (m, i) { var o1 = mg ? { scope: 'fu', edit: 'edfu', id: m.id, del: 'fudel', delId: 'm:' + m.id, mv: m.id } : { scope: 'fu' }; if (ro) o1.ord = { id: m.id, first: !i, last: i === grp.msgs.length - 1 }; return blockHTML('fu:' + m.id, locM(m), o1); }).join('') : '<div class="ep-note">' + esc(tt('No messages here yet.')) + (mg ? ' ' + esc(tt('Press {0} to write the first one.', '\u0001')).replace('\u0001', '<b>+ ' + esc(tt('Add message')) + '</b>') : '') + '</div>');
      if (mg) blocks += '<div class="ep-bar" style="margin-top:6px"><button type="button" class="ep-btn ep-gold" data-ex="addfu">+ ' + esc(tt('Add message')) + '</button></div>';
    }
    return h + '<div style="height:6px"></div>' + (sec.id === 'fav' && !favList().length ? '' : mmBar('fu')) + blocks;
  }
  /* the search: every message of every category, and the picture lists, by title or text */
  function fuHits(q) {
    var out = [], adm = isAdm() && FUS.mg, has = function (title, parts) { return (title + ' ' + parts.map(function (p) { return fill(p.t); }).join(' ')).toLowerCase().indexOf(q) >= 0; };
    fuView().forEach(function (s) {
      s.groups.forEach(function (g) {
        g.msgs.forEach(function (m) { if (atOf(s, m)) return; var lm = locM(m); if (has(lm.title || '', lm.parts)) out.push({ where: secN(s) + (s.groups.length > 1 ? ' \u00B7 ' + g.n : ''), key: 'fu:' + m.id, m: lm, o: adm ? { scope: 'fu', edit: 'edfu', id: m.id, del: 'fudel', delId: 'm:' + m.id } : { scope: 'fu' } }); });
      });
    });
    var hide = OV.hide || [];
    TABS.filter(tabOn).forEach(function (T) {
      tabBlocks(T.id).forEach(function (b) {
        if (!has(b.title, b.only.map(function (i) { return b.m.parts[i]; }))) return;
        out.push({ where: tt(T.n), key: b.key, m: b.m, o: tabOpts(T.id, b) });
      });
    });
    return out;
  }
  function fuFound() {
    var q = (FUS.q || '').trim().toLowerCase(), H = fuHits(q);
    return '<p class="ep-sub" style="margin:4px 0">' + esc(H.length ? tt('{0} found').replace('{0}', H.length) : tt('Nothing found. Try another word.')) + '</p>' + (H.length ? mmBar('fu') : '')
      + H.map(function (h) { return '<div class="ep-hit"><span class="ep-chip">' + esc(h.where) + '</span>' + blockHTML(h.key, h.m, h.o) + '</div>'; }).join('');
  }
  /* the two administrator buttons (Reorder tabs, Manage) are small icons next to the search */
  function admIcons() {
    if (!isAdm()) return '';
    var ib = function (on, act, ico, name) { return '<button type="button" class="ep-ib' + (on ? ' ep-on' : '') + '" data-ex="' + act + '" title="' + esc(tt(on ? 'Done' : name)) + '" aria-label="' + esc(tt(on ? 'Done' : name)) + '">' + (on ? '&#10003;' : ico) + '</button>'; };
    return ib(FUS.ro, 'tro', '&#8645;', 'Reorder tabs') + ib(FUS.mg, 'manage', '&#9881;', 'Manage');
  }
  function fuHTML() {
    if (isAdm()) MVL = items().map(function (z) { return { key: z.key, title: z.title }; }).sort(function (a, b) { return a.title.localeCompare(b.title); });
    return '<div class="ep-srch"><span aria-hidden="true">&#128269;</span><input type="search" id="ex_q" class="ep-in" autocomplete="off" value="' + esc(FUS.q || '') + '" placeholder="' + esc(tt('Search all messages...')) + '"><button type="button" class="ep-btn" data-ex="qclear"' + (FUS.q ? '' : ' hidden') + '>' + esc(tt('Clear')) + '</button>' + admIcons() + '</div>'
      + '<div id="ex_main">' + ((FUS.q || '').trim() ? fuFound() : fuMain()) + '</div>';
  }
  function fuSearch(v) {
    FUS.q = v; var m = $('ex_main'); if (!m) return;
    m.innerHTML = (v || '').trim() ? fuFound() : fuMain();
    var c = document.querySelector('[data-ex="qclear"]'); if (c) c.hidden = !v;
  }

  /* ---------- the editor (administrator): parts = a text with its own photo under it ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var LL = function (skipEn) { return (typeof LANGS !== 'undefined' ? LANGS : []).filter(function (l) { return !skipEn || l[0] !== 'en'; }); };
  function cleanMap(o) { var r = {}, n = 0; Object.keys(o || {}).forEach(function (k) { if (typeof o[k] === 'string' && o[k].trim()) { r[k] = o[k]; n++; } }); return n ? r : null; }
  function peStart(target, title, parts, needTitle, tn) {
    PE = { target: target, title: title, tn: (tn && typeof tn === 'object') ? clone(tn) : {}, needTitle: !!needTitle, delArm: false, lib: null, pv: clone(OV.pv || {}),
      parts: clone(parts).map(function (p) { var tl = (p.tl && typeof p.tl === 'object') ? p.tl : {}; Object.keys(tl).forEach(function (k) { if (typeof tl[k] === 'string') tl[k] = fixLnk(tl[k]); }); return { t: fixLnk(p.t || ''), ph: p.ph || null, tl: tl }; }) };
    if (!PE.parts.length) PE.parts.push({ t: '', ph: null, tl: {} });
    FUS.edit = true; ensureModal().classList.remove('hidden'); document.body.style.overflow = 'hidden'; fuPaint();
  }
  function libIds() {
    var seen = {}, out = [], add = function (o) { Object.keys(o || {}).forEach(function (k) { if (!seen[k]) { seen[k] = 1; out.push(k); } }); };
    add(window.EOP_PH); add(window.EOP_PH2); add(window.EOP_PH2B); add(window.EOP_PH2C); add(MED); return out;
  }
  function trBox(label, inner) { return '<details class="ep-tr"><summary>' + esc(label) + '</summary>' + inner + '</details>'; }
  function peHTML() {
    var needT = PE.needTitle, tx = PE.target.kind === 'tx', LS = LL(true), LA = LL(false);
    return '<div class="ep-bar" style="margin-bottom:8px"><button type="button" class="ep-btn" data-ex="pecancel">&larr; ' + esc(tt('Back')) + '</button></div>'
      + (needT ? '<div class="ep-field"><label>' + esc(tt('Message name')) + '</label><input type="text" id="pe_title" value="' + esc(PE.title) + '" placeholder="' + esc(tt('e.g. Second reminder')) + '"></div>'
        + trBox(tt('Name in other languages'), LS.map(function (l) { return '<div class="ep-field"><label>' + esc(l[1]) + '</label><input type="text" data-ptn="' + l[0] + '" value="' + esc(PE.tn[l[0]] || '') + '" placeholder="' + esc(btN(PE.title, l[0])) + '"></div>'; }).join(''))
        : '<p class="ep-sub" style="margin-bottom:8px"><b>' + esc(PE.title) + '</b></p>')
      + PE.parts.map(function (p, i) {
        return '<div class="ep-pe"><div class="ep-bar" style="justify-content:space-between"><b style="font-size:12px">' + esc(tt(tx ? 'Photo' : 'Part')) + ' ' + (i + 1) + '</b>' + (PE.parts.length > 1 ? '<button type="button" class="ep-btn" data-ex="perm" data-v="' + i + '">' + esc(tt('Remove this part')) + '</button>' : '') + '</div>'
          + (tx ? '' : '<div class="ep-field"><label>' + esc(tt('Text')) + '</label><textarea data-pet="' + i + '" rows="5">' + esc(p.t) + '</textarea></div>'
            + trBox(tt('Text in other languages'), LS.map(function (l) { return '<div class="ep-field"><label>' + esc(l[1]) + '</label><textarea data-pel="' + i + '|' + l[0] + '" rows="4" placeholder="' + esc(btT(p.t, l[0])) + '">' + esc((p.tl || {})[l[0]] || '') + '</textarea></div>'; }).join('')))
          + '<div class="ep-peph">' + (p.ph && phUrl(p.ph) ? '<img src="' + phUrl(p.ph) + '" alt=""><span class="ep-chip">' + kbPh(p.ph) + ' KB</span><button type="button" class="ep-btn" data-ex="perph" data-v="' + i + '">' + esc(tt('Remove photo')) + '</button>' : '<span class="ep-sub" style="margin:0">' + esc(tt('No photo')) + '</span>')
          + '<label class="ep-btn" style="cursor:pointer">&#128247; ' + esc(p.ph ? tt('Change') : tt('Add')) + ' ' + esc(tt('photo')) + '<input type="file" accept="image/*" data-pef="' + i + '" hidden></label>'
          + '<button type="button" class="ep-btn" data-ex="libopen" data-v="' + i + '">' + esc(tt('From the photo library')) + '</button></div>'
          + (PE.lib === i ? '<div class="ep-libg">' + libIds().map(function (id) { return '<button type="button" class="ep-pk" data-ex="libpick" data-v="' + i + '|' + esc(id) + '"><img src="' + phUrl(id) + '" alt="" loading="lazy"></button>'; }).join('') + '</div>' : '')
          + (p.ph ? trBox(tt('This picture in other languages'), '<p class="ep-sub" style="margin:4px 0">' + esc(tt('If the writing inside the picture must change with the language, add the picture of that language here. The photo itself stays the same photo.')) + '</p>'
            + LA.map(function (l) { var id = (PE.pv[p.ph] || {})[l[0]]; return '<div class="ep-lv"><b>' + esc(l[1]) + '</b>' + (id && phUrl(id) ? '<img src="' + phUrl(id) + '" alt=""><button type="button" class="ep-btn" data-ex="pvdel" data-v="' + i + '|' + l[0] + '">' + esc(tt('Remove')) + '</button>' : '<span class="ep-sub" style="margin:0">' + esc(tt('Same picture')) + '</span>') + '<label class="ep-btn" style="cursor:pointer">&#128247; ' + esc(id ? tt('Change') : tt('Add')) + '<input type="file" accept="image/*" data-pvf="' + i + '|' + l[0] + '" hidden></label></div>'; }).join('')) : '')
          + '</div>';
      }).join('')
      + (tx ? '<p class="ep-sub" style="margin:2px 0 8px">' + esc(tt('The explanation text of this treatment is in the Treatment Database, tab Patient Explanations. Here you choose its photos.')) + '</p>'
        : '<p class="ep-sub" style="margin:2px 0 8px">' + esc(tt('Write {0} where the consultant’s first name should appear. A photo without text is sent as a photo only.', '\u0001')).replace('\u0001', '<b>{consultant}</b>') + '</p>')
      + '<div class="ep-bar"><button type="button" class="ep-btn" data-ex="peadd">+ ' + esc(tt(tx ? 'Add another photo' : 'Add another text + photo')) + '</button></div>'
      + '<div class="ep-bar" style="margin-top:12px"><button type="button" class="ep-btn ep-gold" data-ex="pesave">' + esc(tt('Save')) + '</button><button type="button" class="ep-btn" data-ex="pecancel">' + esc(tt('Cancel')) + '</button>'
      + (PE.target.kind === 'fu' && !PE.target.isNew ? '<button type="button" class="ep-btn ep-bad" data-ex="pedel" style="margin-left:auto">' + esc(PE.delArm ? tt('Tap again to delete') : tt('Delete message')) + '</button>' : '') + '</div>';
  }
  function peSync() {
    var e = $('exb'); if (!e || !PE) return;
    e.querySelectorAll('[data-pet]').forEach(function (t) { var p = PE.parts[+t.dataset.pet]; if (p) p.t = t.value; });
    e.querySelectorAll('[data-pel]').forEach(function (t) { var z = t.dataset.pel.split('|'), p = PE.parts[+z[0]]; if (p) { p.tl = p.tl || {}; p.tl[z[1]] = t.value; } });
    e.querySelectorAll('[data-ptn]').forEach(function (t) { PE.tn[t.dataset.ptn] = t.value; });
    var ti_ = $('pe_title'); if (ti_) PE.title = ti_.value;
  }
  function shrink(file, mx0, cap0) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onerror = rej;
      fr.onload = function () {
        var im = new Image();
        im.onerror = rej;
        im.onload = function () {
          var mx = mx0 || 900, cap = cap0 || 200000, w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, mx / Math.max(w, h));
          var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
          var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
          var q = 0.82, u = c.toDataURL('image/jpeg', q);
          while (u.length > cap && q > 0.4) { q -= 0.08; u = c.toDataURL('image/jpeg', q); }
          res({ url: u, kb: Math.round((u.length - 23) * 0.75 / 1024) });
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function putMedia(id, url, kb) {
    var x = window.EOP_CLOUD && EOP_CLOUD.x && EOP_CLOUD.x();
    if (x && x.db) x.db.collection('media').doc(id).set({ d: url, kb: kb, by: x.email, at: x.fb.firestore.FieldValue.serverTimestamp() }).catch(function () { toast(tt('Not saved: you have no permission for this change.')); });
  }
  var newId = function () { return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); };
  function peFile(i, file) {
    shrink(file).then(function (r) {
      peSync(); var id = newId();
      MED[id] = r.url; putMedia(id, r.url, r.kb); PE.parts[i].ph = id; fuPaint(); toast(tt('Photo shrunk to {0} KB.').replace('{0}', r.kb));
    }).catch(function () { toast(tt('Could not read that photo.')); });
  }
  /* the picture of the same photo for one language (the writing inside the picture is in that language) */
  function peVer(z, file) {
    var j = z.indexOf('|'), i = +z.slice(0, j), lc = z.slice(j + 1);
    shrink(file, 1400, 360000).then(function (r) {
      peSync(); var base = PE.parts[i] && PE.parts[i].ph; if (!base) return;
      var id = newId(); MED[id] = r.url; putMedia(id, r.url, r.kb);
      PE.pv[base] = PE.pv[base] || {}; PE.pv[base][lc] = id; fuPaint(); toast(tt('Picture added for this language.'));
    }).catch(function () { toast(tt('Could not read that photo.')); });
  }
  function saveOV() { S('kc_expl', OV); ver++; refreshPanels(); side(); }
  function mergePv() {
    OV.pv = OV.pv || {};
    PE.parts.forEach(function (p) { if (!p.ph) return; var m = cleanMap(PE.pv[p.ph]); if (m) OV.pv[p.ph] = m; else delete OV.pv[p.ph]; });
  }
  function peSave() {
    peSync();
    var tg = PE.target;
    mergePv();
    if (tg.kind === 'tx') { var ps = PE.parts.filter(function (p) { return p.ph; }).map(function (p) { return { t: '', ph: p.ph }; }); OV.items[tg.key] = { parts: ps.length ? ps : [{ t: '', ph: null }] }; }
    else {
      var parts = PE.parts.filter(function (p, i) { return (p.t || '').trim() || p.ph || PE.parts.length === 1; }).map(function (p) { var o = { t: p.t, ph: p.ph || null }, tl = cleanMap(p.tl); if (tl) o.tl = tl; return o; });
      if (!OV.fu) OV.fu = clone(D0.fu);
      var title = (PE.title || '').trim() || tt('New message'), tn = cleanMap(PE.tn);
      if (tg.isNew) {
        var s = OV.fu.filter(function (x) { return x.id === tg.sec; })[0], g = s && s.groups.filter(function (x) { return x.id === tg.grp; })[0], nm = { id: 'f' + Date.now().toString(36), title: title, parts: parts };
        if (tn) nm.tn = tn;
        if (g) g.msgs.push(nm);
      } else { OV.fu.forEach(function (s) { s.groups.forEach(function (g) { g.msgs.forEach(function (m) { if (m.id === tg.id) { m.title = title; m.parts = parts; if (tn) m.tn = tn; else delete m.tn; } }); }); }); }
    }
    saveOV(); var wasTx = PE.target.kind === 'tx' && FUS.fromDb; PE = null; FUS.edit = null;
    if (wasTx) { FUS.fromDb = false; close(); toast(tt('Saved. Consultants see it now.')); } else { fuPaint(); toast(tt('Saved. Consultants see it now.')); }
  }
  function peCancel() { var fromDb = FUS.fromDb; PE = null; FUS.edit = null; if (fromDb) { FUS.fromDb = false; close(); } else fuPaint(); }
  function dropMsg(id) {
    if (!OV.fu) OV.fu = clone(D0.fu);
    OV.fu.forEach(function (s) { s.groups.forEach(function (g) { g.msgs = g.msgs.filter(function (m) { return m.id !== id; }); }); });
    if ((D0.seeds || []).some(function (x) { return x.id === id; }) && gone().indexOf(id) < 0) OV.gone = gone().concat([id]);
  }
  function peDel() {
    if (!PE.delArm) { peSync(); PE.delArm = true; fuPaint(); return; }
    dropMsg(PE.target.id);
    saveOV(); PE = null; FUS.edit = null; fuPaint(); toast(tt('Message deleted.'));
  }
  /* delete one message, one photo, one entry of a picture list (administrator, tap twice) */
  function fuDelMsg(arm) {
    if (FUS.delItem !== arm) { FUS.delItem = arm; fuPaint(); return; }
    dropMsg(arm.slice(2)); FUS.delItem = null; saveOV(); fuPaint(); toast(tt('Message deleted.'));
  }
  /* delete a Patient Explanation of the Treatment Database from the list (tap twice): a built-in one is hidden everywhere and can be brought back in the Treatment Database */
  function ibDel(arm) {
    var k = arm.slice(2);
    if (FUS.delItem !== arm) { FUS.delItem = arm; fuPaint(); return; }
    if (typeof PDB === 'undefined') return;
    if (typeof TRD_INFO !== 'undefined' && TRD_INFO[k]) { if (!(PDB.xd || []).includes(k)) PDB.xd = (PDB.xd || []).concat([k]); }
    else { PDB.ic = (PDB.ic || []).filter(function (x) { return x.k !== k; }); if (PDB.io) delete PDB.io[k]; }
    FUS.delItem = null; if (typeof trdSave === 'function') trdSave(); ver++; refreshPanels(); fuPaint(); toast(tt('Deleted.'));
  }
  function txHide(arm) {
    if (FUS.delItem !== arm) { FUS.delItem = arm; fuPaint(); return; }
    OV.off = (OV.off || []).concat([arm]); FUS.delItem = null; saveOV(); fuPaint(); toast(tt('Deleted.'));
  }
  function txParts(key) { var it = itemBy(key); return it ? it.parts.filter(function (p) { return p.ph; }).map(function (p) { return { t: '', ph: p.ph }; }) : []; }
  function txSet(key, ps) { OV.items[key] = { parts: ps.length ? ps : [{ t: '', ph: null }] }; }
  function txDel(v) {
    var j = v.lastIndexOf('|'), key = v.slice(0, j), i = +v.slice(j + 1), it = itemBy(key); if (!it || !it.parts[i]) return;
    if (FUS.delPh !== v) { FUS.delPh = v; fuPaint(); return; }
    var ph = it.parts[i].ph; txSet(key, txParts(key).filter(function (p) { return p.ph !== ph; }));
    FUS.delPh = null; saveOV(); fuPaint(); toast(tt('Photo deleted.'));
  }
  function txMove(v, target) {
    var j = v.lastIndexOf('|'), key = v.slice(0, j), i = +v.slice(j + 1), it = itemBy(key), tg = itemBy(target); if (!it || !tg || !it.parts[i] || key === target) return;
    var ph = it.parts[i].ph; if (!ph) return;
    txSet(key, txParts(key).filter(function (p) { return p.ph !== ph; }));
    var tp = txParts(target); if (!tp.some(function (p) { return p.ph === ph; })) tp.push({ t: '', ph: ph }); txSet(target, tp);
    saveOV(); fuPaint(); toast(tt('Photo moved to {0}.').replace('{0}', tg.title));
  }
  /* the messages as a file (to translate them) and the translations back: only empty places are filled, the original texts are never changed */
  function exportFu() {
    var out = { kind: 'eop-follow-up', version: 1, languages: LL(true).map(function (l) { return l[0]; }), categories: fuList().map(function (s) { return { id: s.id, name: s.n, groups: s.groups.map(function (g) { return { id: g.id, name: g.n, messages: g.msgs.map(function (m) { return { id: m.id, title: m.title, parts: m.parts.map(function (p) { return { text: p.t || '', photo: !!p.ph }; }) }; }) }; }) }; }) };
    var blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'follow-up-messages.json'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 600);
    toast(tt('The messages were saved as a file in your downloads.'), 4200);
  }
  function importFu(file) {
    var fr = new FileReader();
    fr.onerror = function () { toast(tt('This file cannot be read.')); };
    fr.onload = function () {
      var j; try { j = JSON.parse(fr.result); } catch (e) { toast(tt('This file cannot be read.')); return; }
      if (!j || j.kind !== 'eop-follow-up-translations') { toast(tt('This is not a translation file.')); return; }
      if (!OV.fu) OV.fu = clone(D0.fu);
      var n = 0, M = j.messages || {}, C = j.categories || {}, put = function (o, f, src) { if (!src || typeof src !== 'object') return; o[f] = o[f] || {}; Object.keys(src).forEach(function (l) { if (typeof src[l] === 'string' && src[l].trim() && !(o[f][l] || '').trim()) { o[f][l] = src[l]; n++; } }); };
      OV.fu.forEach(function (s) {
        if (C[s.id]) put(s, 'nl', C[s.id]);
        s.groups.forEach(function (g) { g.msgs.forEach(function (m) { var x = M[m.id]; if (!x) return; put(m, 'tn', x.title); (x.parts || []).forEach(function (pt, i) { if (m.parts[i]) put(m.parts[i], 'tl', pt); }); }); });
      });
      saveOV(); fuPaint(); toast(tt('{0} translations added.').replace('{0}', n), 4200);
    };
    fr.readAsText(file);
  }
  function catAdd() {
    var i = $('ex_newcat'), name = ((i && i.value) || '').trim();
    if (!name) { toast(tt('Type a name for the category.')); return; }
    if (!OV.fu) OV.fu = clone(D0.fu);
    var id = 'c' + Date.now().toString(36);
    OV.fu.push({ id: id, n: name, groups: [{ id: id + 'g', n: name, msgs: [] }] });
    FUS.sec = id; FUS.grp = id + 'g'; FUS.addCat = false; saveOV(); fuPaint(); toast(tt('Category added.'));
  }
  function catDel() {
    var sec = secs().filter(function (s) { return s.id === FUS.sec; })[0]; if (!sec || sec.id === 'fav') return;
    if (FUS.delArm !== sec.id) { FUS.delArm = sec.id; fuPaint(); return; }
    if (sec.tab) OV.hide = (OV.hide || []).concat([sec.id]);
    else { if (!OV.fu) OV.fu = clone(D0.fu); OV.fu = OV.fu.filter(function (x) { return x.id !== sec.id; }); }
    FUS.delArm = null; FUS.sec = 'fav'; saveOV(); fuPaint(); toast(tt('Category deleted.'));
  }
  function grpDel() {
    var cur = fuList().filter(function (x) { return x.id === 'nr'; })[0]; if (!cur || cur.groups.length < 2) return;
    if (FUS.delGrp !== FUS.grp) { FUS.delGrp = FUS.grp; fuPaint(); return; }
    if (!OV.fu) OV.fu = clone(D0.fu);
    var s = OV.fu.filter(function (x) { return x.id === 'nr'; })[0];
    s.groups = s.groups.filter(function (g) { return g.id !== FUS.grp; }); FUS.grp = s.groups[0].id; FUS.delGrp = null; saveOV(); fuPaint(); toast(tt('Deleted.'));
  }
  function editItem(key, fromDb) {
    var it = itemBy(key);
    if (!it) { var r = typeof trdAll === 'function' ? trdAll().filter(function (x) { return hk(x.t.n) === key; })[0] : null; it = { key: key, nm: r ? r.t.n : key, parts: [{ t: '', ph: null }] }; }
    FUS.fromDb = !!fromDb; peStart({ kind: 'tx', key: key }, it.title || it.nm, it.parts, false);
  }
  function lightbox(id, l) { var e = $('exlb'); if (!e || !phL(id, l)) return; if (phBusy(id, l)) phEnsure(id, l).then(function () { lightbox(id, l); }); e.innerHTML = '<img src="' + phL(id, l) + '" alt="photo"><button type="button" aria-label="Close">&times;</button>'; e.classList.remove('hidden'); }

  /* ---------- clicks ---------- */
  document.addEventListener('click', function (e) {
    var lb = e.target.closest && e.target.closest('#exlb'); if (lb) { lb.classList.add('hidden'); lb.innerHTML = ''; return; }
    var ov = e.target; if (ov && ov.id === 'exm') { close(); return; }
    if (e.target.closest && e.target.closest('.ep-lgw')) return;
    var t = e.target.closest && e.target.closest('[data-ex]'); if (!t) return;
    var a = t.dataset.ex, v = t.dataset.v;
    switch (a) {
      case 'fumodal': open(FUS.sec === 'fav' && !favList().length ? 'nr' : (FUS.sec || 'nr')); break;
      case 'favmodal': FUS.lt = null; open('fav'); break;
      case 'close': close(); break;
      case 'min': MIN[v] = !minOf(v); S('kc_exmin_' + v, MIN[v]); var h = $(v); if (h) { h.dataset.dirty = 1; render(v, panels[v]); } break;
      case 'tab': goSec(v); fuPaint(); break;
      case 'top': { if (window.EL && EL.tops.indexOf(v) >= 0) { FUS.lt = v; FUS.delArm = null; FUS.delGrp = null; FUS.delItem = null; FUS.delPh = null; FUS.addCat = false; fuPaint(); break; } if (window.EL) EL.reset(); var S1 = secs(), tg = v === 'fav' ? 'fav' : (S1.some(function (x) { return x.id === FUS.last[v] && topOf(x) === v; }) ? FUS.last[v] : (S1.filter(function (x) { return topOf(x) === v; })[0] || S1[0]).id); goSec(tg); fuPaint(); break; }
      case 'tro': FUS.ro = !FUS.ro; fuPaint(); break;
      case 'tmv': moveTop(v); break;
      case 'smv': moveSec(v); break;
      case 'gmv': moveGrp(v); break;
      case 'mmv': moveMsg(v); break;
      case 'fumv': FUS.mv = FUS.mv === v ? null : v; fuPaint(); break;
      case 'fumvok': moveTo(v); break;
      case 'fumvno': FUS.mv = null; fuPaint(); break;
      case 'manage': FUS.mg = !FUS.mg; FUS.mv = null; FUS.delArm = null; FUS.delGrp = null; FUS.delItem = null; FUS.delPh = null; FUS.addCat = false; fuPaint(); break;
      case 'ibdel': ibDel(v); break;
      case 'grp': FUS.grp = v; FUS.delGrp = null; fuPaint(); break;
      case 'addnr': { if (!OV.fu) OV.fu = clone(D0.fu); var s1 = OV.fu.filter(function (x) { return x.id === 'nr'; })[0], n = 1 + Math.max.apply(null, s1.groups.map(function (g0) { return parseInt(String(g0.id).replace(/\D/g, ''), 10) || 0; }).concat([0])), g = { id: 'nr' + n, n: 'NR' + n, msgs: [] }; s1.groups.push(g); FUS.grp = g.id; saveOV(); fuPaint(); toast(tt('{0} added.', 'NR' + n)); break; }
      case 'grpdel': grpDel(); break;
      case 'catadd': FUS.addCat = true; fuPaint(); { var ni = $('ex_newcat'); if (ni) ni.focus(); } break;
      case 'catno': FUS.addCat = false; fuPaint(); break;
      case 'catok': catAdd(); break;
      case 'catdel': catDel(); break;
      case 'qclear': fuSearch(''); { var qi = $('ex_q'); if (qi) { qi.value = ''; qi.focus(); } } break;
      case 'catrestore': OV.hide = []; OV.off = []; saveOV(); fuPaint(); toast(tt('The picture lists are back.')); break;
      case 'addfu': { var s2 = fuList().filter(function (x) { return x.id === FUS.sec; })[0]; if (!s2) break; var g2 = s2.groups.filter(function (x) { return x.id === FUS.grp; })[0] || s2.groups[0]; peStart({ kind: 'fu', isNew: true, sec: s2.id, grp: g2.id }, '', [{ t: '', ph: null }], true); break; }
      case 'edfu': { materialize(v); var f = fuFind(v, false); if (f) peStart({ kind: 'fu', id: v }, f.m.title, f.m.parts, true, f.m.tn); break; }
      case 'txdel': txDel(v); break;
      case 'txhide': txHide(v); break;
      case 'fudel': fuDelMsg(v); break;
      case 'fuexp': exportFu(); break;
      case 'libopen': peSync(); PE.lib = PE.lib === +v ? null : +v; fuPaint(); break;
      case 'libpick': { var q1 = v.indexOf('|'); peSync(); PE.parts[+v.slice(0, q1)].ph = v.slice(q1 + 1); PE.lib = null; fuPaint(); break; }
      case 'pvdel': { var q2 = v.indexOf('|'), pi = +v.slice(0, q2), lc = v.slice(q2 + 1); peSync(); var b0 = PE.parts[pi] && PE.parts[pi].ph; if (b0 && PE.pv[b0]) delete PE.pv[b0][lc]; fuPaint(); break; }
      case 'edtx': editItem(v, false); break;
      case 'cphoto': copyPhoto(v, t); break;
      case 'ctxt': copyTxt(v, t); break;
      case 'cpart': copyPart(v, t); break;
      case 'call': copyAll(t, v); break;
      case 'fav': favToggle(v); break;
      case 'pick': pickPh(v); break;
      case 'bmin': { var i0 = v.indexOf('|'); mmToggle(v.slice(0, i0), v.slice(i0 + 1)); mmRepaint(v.slice(0, i0)); break; }
      case 'mall': { var p2 = v.split('|'); mmAll(p2[0], p2[1] === 'min'); mmRepaint(p2[0]); break; }
      case 'zoom': lightbox(v, t.dataset.l || undefined); break;
      case 'peadd': peSync(); PE.parts.push({ t: '', ph: null, tl: {} }); fuPaint(); break;
      case 'perm': peSync(); PE.parts.splice(+v, 1); if (!PE.parts.length) PE.parts.push({ t: '', ph: null, tl: {} }); fuPaint(); break;
      case 'perph': peSync(); PE.parts[+v].ph = null; fuPaint(); break;
      case 'pesave': peSave(); break;
      case 'pecancel': peCancel(); break;
      case 'pedel': peDel(); break;
    }
  });
  document.addEventListener('change', function (e) {
    var f = e.target; if (!f || !f.matches) return;
    if (f.matches('[data-pfill]') && f.files && f.files[0]) {
      var file0 = f.files[0], sid = f.dataset.pfill; f.value = '';
      shrink(file0).then(function (r) { MED[sid] = r.url; ver++; putMedia(sid, r.url, r.kb); try { refreshPanels(); } catch (z) {} try { fuPaint(); } catch (z) {} toast(tt('Photo added.')); }).catch(function () { toast(tt('Could not read that photo.')); });
    } else if (f.matches('[data-pef]') && f.files && f.files[0]) { var file = f.files[0]; f.value = ''; peFile(+f.dataset.pef, file); }
    else if (f.matches('[data-pvf]') && f.files && f.files[0]) { var file2 = f.files[0], z = f.dataset.pvf; f.value = ''; peVer(z, file2); }
    else if (f.matches('[data-fuimp]') && f.files && f.files[0]) { var file3 = f.files[0]; f.value = ''; importFu(file3); }
    else if (f.matches('[data-mv]') && f.value) txMove(f.dataset.mv, f.value);
    else if (f.id === 'exlg') { WL = f.value === lgP() ? null : f.value; if (WL) plLoad(WL); fuPaint(); }
  });
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'ex_q') fuSearch(e.target.value); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && e.target.id === 'ex_newcat') { e.preventDefault(); catAdd(); return; } if (e.key === 'Escape') { var l = $('exlb'); if (l && !l.classList.contains('hidden')) { l.classList.add('hidden'); l.innerHTML = ''; return; } var m = $('exm'); if (m && !m.classList.contains('hidden')) close(); } });

  /* ---------- the two buttons in the top bar, next to the name ---------- */
  function side() {
    var h = $('epside'); if (!h) return;
    if (typeof me === 'undefined' || !me) { h.innerHTML = ''; return; }
    var n = favList().length;
    h.innerHTML = '<button type="button" class="ep-hbtn" data-ex="fumodal">&#128221; ' + esc(tt('Follow up Messages')) + '</button><button type="button" class="ep-hbtn" data-ex="favmodal">&#9733; ' + esc(tt('Favorites')) + (n ? ' <span class="ep-chip">' + n + '</span>' : '') + '</button>';
  }

  /* ---------- from the shared settings / the shared photos ---------- */
  function load(v) {
    var o = v && typeof v === 'object' ? v : {};
    var strs = function (a) { return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string'; }) : []; };
    OV = { items: (o.items && typeof o.items === 'object') ? o.items : {}, fu: Array.isArray(o.fu) ? o.fu : null, hide: strs(o.hide), pv: (o.pv && typeof o.pv === 'object') ? o.pv : {}, gone: strs(o.gone), off: strs(o.off), lib: (o.lib && typeof o.lib === 'object' && Array.isArray(o.lib.cats)) ? o.lib : null, acc: (o.acc && typeof o.acc === 'object') ? o.acc : {}, top: strs(o.top) };
    ver++; refreshPanels(); if ($('exm') && !$('exm').classList.contains('hidden') && !FUS.edit) fuPaint(); side();
  }
  function setMedia(id, d) { if (typeof d === 'string' && d.indexOf('data:image') === 0) { MED[id] = d; ver++; } }
  /* the photos the administrator added later are kept in the shared database */
  var mediaOn = false;
  function enter() {
    if (mediaOn) return;
    var x = window.EOP_CLOUD && EOP_CLOUD.x && EOP_CLOUD.x(); if (!x) return;
    mediaOn = true;
    x.db.collection('media').onSnapshot(function (s) {
      s.docChanges().forEach(function (ch) { if (ch.type !== 'removed') { var d = ch.doc.data() || {}; setMedia(ch.doc.id, d.d); } });
      refreshPanels(); if ($('exm') && !$('exm').classList.contains('hidden') && !FUS.edit) fuPaint();
    }, function (e) { try { console.warn('media:', e && e.code); } catch (z) {} });
  }
  window.EX = {
    enter: enter, decorate: decorate, load: load, render: render, open: open, close: close, side: side, editItem: editItem, items: items, itemBy: itemBy, fill: fill, first: first, phUrl: phUrl, kbPh: kbPh, shrink: shrink,
    editDb: function (id) { var f = typeof trdFind === 'function' ? trdFind(id) : null; if (f) editItem(hk(f.t.n), true); },
    setMedia: setMedia, putMedia: putMedia, newId: newId, ov: function () { return OV; }, saveOV: saveOV, repaint: fuPaint, mg: function () { return isAdm() && FUS.mg; }, lang: function () { return WL || lgP(); }, refresh: function () { ver++; refreshPanels(); side(); if ($('exm') && !$('exm').classList.contains('hidden') && !FUS.edit) fuPaint(); }, copyText: copyText, pngOf: pngOf, canClip: canClip, lightbox: lightbox, mm: { get: mmGet, toggle: mmToggle, all: mmAll }
  };
  window.epPhLoaded = function () { ver++; refreshPanels(); };
  load(L('kc_expl', null));
})();
