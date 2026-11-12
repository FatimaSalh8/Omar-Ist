/* Ömar Istanbul by Rima — the three extra headers of the Follow up Messages window:
   BEFORE AND AFTER  one block per PATIENT (all his photos together) with the sentence under it; filters: men / women, white / brown / black
   STATUS            the same kind of blocks, without tags
   ACCOMMODATION     one block per hotel: photos + a short text + the Google location

   Made for MANY photos (1,500 and more); nothing is kept on the phone or the computer:
   - the photos are NOT loaded with the portal: only the small previews of the page that is on the screen are asked from the database,
     and they are thrown away when the person leaves the tab;
   - "Copy" asks the database for that ONE photo, puts it on the clipboard and forgets it (no need to open it first);
   - "All photos + text" (version 3.4) opens the Share menu with EVERY photo of the patient / hotel and the text (WhatsApp, Mail ...);
   - the database is read with a plain request (REST) so the browser does not even keep a copy in its own cache.
   A patient / hotel is one small record (collection "lib": tags, sentence, small previews); every full photo is its own record
   (collection "libfull"). The photos are put in by the administrator from a file that Claude prepares (Add photos from a file).
   The list of categories is kept in the shared settings (kc_expl) of the Follow up Messages. */
(function () {
  'use strict';
  var EX = window.EX; if (!EX) return;
  var g = function (id) { return document.getElementById(id); };
  var tt = function () { return typeof ti === 'function' ? ti.apply(null, arguments) : arguments[0]; };
  var isAdm = function () { return typeof me !== 'undefined' && me === 'admin'; };
  var PAGE = { ba: 8, sx: 8, ac: 40 };               /* records asked at a time */
  var TOPS = ['ba', 'ac', 'sx'], NAMES = { ba: 'Before and After', ac: 'Accommodation', sx: 'Status' };
  var GEN = [['m', 'Men'], ['f', 'Women']];
  var SKIN = [['w', 'White', '#f3d9c6'], ['br', 'Brown', '#a8714a'], ['bk', 'Black', '#4a2e22']];
  var DEF = [['zc', 'Zirconium Crowns'], ['ec', 'E-max Crowns'], ['vn', 'Veneers'], ['im', 'Implants'], ['a4', 'All on 4'], ['a6', 'All on 6'], ['zy', 'Zygomatic'], ['hs', 'Hollywood Smile'], ['al', 'Aligners']];
  var ST = {
    ba: { cat: '', g: '', s: '', sig: null, items: [], more: false, loading: false, err: '', seq: 0 },
    sx: { sig: null, items: [], more: false, loading: false, err: '', seq: 0 },
    ac: { sig: null, items: [], more: false, loading: false, err: '', seq: 0 }
  };
  var TK = {};                                       /* photos / texts copied in this visit */
  var DEL = null;                                    /* what the administrator armed for deletion */
  var CE = null;                                     /* category editor: { mode: 'add' | 'ren' } */
  var ED = null;                                     /* the sentence / hotel text that is being edited */
  var IM = null;                                     /* the import that is running or finished */
  var BK = '';                                       /* the text of the backup that is running */
  var SEL = {};                                      /* the photo that is chosen in each patient / hotel */
  var TTL = {};                                      /* the title of each hotel block */
  var MS = { on: false, ids: {} };                   /* "combine the same patient": which patients are ticked to be merged into one */

  var cx = function () { var c = window.EOP_CLOUD; return c && c.x ? c.x() : null; };
  var ov = function () { return EX.ov(); };
  var dataOk = function (u) { return typeof u === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(u); };
  var repaint = function () { EX.repaint(); };

  /* ---------- reading the database without keeping anything ---------- */
  function cfg() { return window.EOP_FIREBASE || null; }
  function token(x) {
    try { var u = x.fb.auth().currentUser; return u && u.getIdToken ? Promise.resolve(u.getIdToken()) : Promise.reject(new Error('no user')); } catch (e) { return Promise.reject(e); }
  }
  function root(c) { return 'projects/' + c.projectId + '/databases/(default)/documents'; }
  function fval(f) {
    if (!f) return undefined;
    if ('stringValue' in f) return f.stringValue; if ('integerValue' in f) return +f.integerValue; if ('doubleValue' in f) return f.doubleValue; if ('booleanValue' in f) return f.booleanValue;
    if (f.arrayValue) return (f.arrayValue.values || []).map(fval);
    if (f.mapValue) { var o = {}, m = f.mapValue.fields || {}; Object.keys(m).forEach(function (k) { o[k] = fval(m[k]); }); return o; }
    return undefined;
  }
  /* version 2.9: reads that do not go through the Firebase code are counted for the Database Firebase page */
  function cnt(n) { try { if (window.EOP_USAGE) window.EOP_USAGE.add('r', n); } catch (e) {} }
  function fdoc(d) { var o = { id: String((d && d.name) || '').split('/').pop() }, f = (d && d.fields) || {}; Object.keys(f).forEach(function (k) { o[k] = fval(f[k]); }); return o; }
  function restList(x, filters, limit, after) {
    var c = cfg(); if (!c || !c.projectId || typeof fetch !== 'function') return Promise.reject(new Error('no rest'));
    return token(x).then(function (tok) {
      var fl = filters.map(function (z) { return { fieldFilter: { field: { fieldPath: z[0] }, op: 'EQUAL', value: { stringValue: z[1] } } }; });
      var q = { from: [{ collectionId: 'lib' }], orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }], limit: limit };
      if (fl.length === 1) q.where = fl[0]; else if (fl.length > 1) q.where = { compositeFilter: { op: 'AND', filters: fl } };
      if (after) q.startAt = { values: [{ referenceValue: root(c) + '/lib/' + after }], before: false };
      return fetch('https://firestore.googleapis.com/v1/' + root(c) + ':runQuery', { method: 'POST', cache: 'no-store', headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: q }) });
    }).then(function (r) { if (!r.ok) throw new Error('rest ' + r.status); return r.json(); })
      .then(function (a) { var l = (Array.isArray(a) ? a : []).filter(function (z) { return z && z.document; }).map(function (z) { return fdoc(z.document); }); cnt(Math.max(1, l.length)); return l; });
  }
  function sdkList(x, filters, n) {
    var q = x.db.collection('lib'); filters.forEach(function (z) { q = q.where(z[0], '==', z[1]); });
    return q.limit(n).get().then(function (s) { var a = []; s.forEach(function (d) { a.push(Object.assign({ id: d.id }, d.data())); }); a.sort(function (p, r) { return p.id < r.id ? -1 : p.id > r.id ? 1 : 0; }); return a; });
  }
  /* ---------- one hotel for the Package Plan Calculator: asked once, kept until the Follow up window is closed ---------- */
  var XC = {}, XP = {};                               /* id -> the hotel record (0 = there is none), and the request that is running */
  function xid(name) { var nm = typeof trdHotelName === 'function' ? trdHotelName(name) : String(name || '').trim(), k = hkey(nm); return k ? acId(k) : ''; }
  function libOne(id) {
    var x = cx(); if (!x) return Promise.resolve(null); var c = cfg();
    var viaSdk = function () { return x.db.collection('lib').doc(id).get().then(function (d) { return d && d.exists ? Object.assign({ id: d.id }, d.data()) : null; }); };
    if (!c || !c.projectId || typeof fetch !== 'function') return viaSdk();
    return token(x).then(function (tok) { return fetch('https://firestore.googleapis.com/v1/' + root(c) + '/lib/' + encodeURIComponent(id), { cache: 'no-store', headers: { 'Authorization': 'Bearer ' + tok } }); })
      .then(function (r) { if (r.status === 404) { cnt(1); return null; } if (!r.ok) throw new Error('rest ' + r.status); cnt(1); return r.json(); })
      .then(function (d) { return d ? fdoc(d) : null; })
      .catch(function () { return viaSdk(); });
  }
  var stay = {
    get: function (name) { var id = xid(name); if (!id) return 0; var z = XC[id]; return z === undefined ? undefined : (z === 'w' ? undefined : z); },
    load: function (name) {
      var id = xid(name); if (!id) return Promise.resolve(0);
      if (XC[id] !== undefined && XC[id] !== 'w') return Promise.resolve(XC[id]);
      if (XP[id]) return XP[id];
      XC[id] = 'w';
      XP[id] = libOne(id).then(function (it) { XC[id] = it && phOf(it).length + String(it.cap || '').length + String(it.ct || '').length ? it : 0; delete XP[id]; return XC[id]; }, function () { XC[id] = 0; delete XP[id]; return 0; });
      return XP[id];
    },
    html: function (name) { var id = xid(name), it = XC[id]; return it && it !== 'w' ? caseHTML(it, 'ac', it.hn || (typeof trdHotelName === 'function' ? trdHotelName(name) : name), true) : ''; }
  };
  function fullOf(id) {
    var x = cx(); if (!x) return Promise.reject(new Error('offline'));
    var c = cfg();
    var viaSdk = function () { return x.db.collection('libfull').doc(id).get().then(function (d) { var o = d && d.exists ? d.data() : null; if (!o || !dataOk(o.d)) throw new Error('missing'); return o.d; }); };
    if (!c || !c.projectId || typeof fetch !== 'function') return viaSdk();
    return token(x).then(function (tok) { return fetch('https://firestore.googleapis.com/v1/' + root(c) + '/libfull/' + encodeURIComponent(id), { cache: 'no-store', headers: { 'Authorization': 'Bearer ' + tok } }); })
      .then(function (r) { if (!r.ok) throw new Error('rest ' + r.status); cnt(1); return r.json(); })
      .then(function (d) { var u = fdoc(d).d; if (!dataOk(u)) throw new Error('missing'); return u; })
      .catch(function () { return viaSdk(); });
  }

  /* ---------- the categories ---------- */
  function cats() {
    var L = ov().lib && Array.isArray(ov().lib.cats) ? ov().lib.cats : null;
    return L || DEF.map(function (c) { return { id: c[0], n: c[1], d: 1 }; });
  }
  var catName = function (c) { return c.d ? tt(c.n) : c.n; };
  var catById = function (id) { return cats().filter(function (c) { return c.id === id; })[0] || null; };
  function saveCats(L) { ov().lib = { cats: L }; EX.saveOV(); }
  var genName = function (v) { var a = GEN.filter(function (z) { return z[0] === v; })[0]; return a ? tt(a[1]) : ''; };
  var skinOf = function (v) { return SKIN.filter(function (z) { return z[0] === v; })[0] || null; };

  /* ---------- one patient / hotel ---------- */
  var hkey = function (n) { return typeof trdHK === 'function' ? trdHK(n) : String(n || '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase(); };
  function hash(s) { var h = 5381, i; for (i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
  var acId = function (key) { return 'ac_' + hash(key); };
  function phOf(it) { return (it && Array.isArray(it.ph) ? it.ph : []).filter(function (p) { return p && p.id && dataOk(p.t); }); }
  function ctOf(it) { try { var o = it && it.ct ? JSON.parse(it.ct) : null; return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  /* a word of the screen in the language of the PATIENT (the language chosen in the window), not of the consultant */
  function lw(k) {
    var l = EX.lang(), i = -1; if (typeof LANGS !== 'undefined') LANGS.forEach(function (z, j) { if (z[0] === l) i = j; });
    var r = typeof ROW !== 'undefined' ? ROW[k] : null; return i > 0 && r && r[i] ? r[i] : k;
  }
  function capOf(it) { var o = ctOf(it), l = EX.lang(); return String((l !== 'en' && typeof o[l] === 'string' && o[l].trim()) ? o[l] : (it.cap || '')).trim(); }
  function textOf(it) {
    var t = capOf(it), loc = String(it.loc || '').trim();
    return t + (loc ? (t ? '\n\n' : '') + '📍 ' + lw('Location') + ': ' + loc : '');
  }
  function find(id) { var r = null; ['ba', 'sx', 'ac'].forEach(function (k) { ST[k].items.forEach(function (it) { if (it.id === id) r = it; }); }); return r || (XC[id] && XC[id] !== 'w' ? XC[id] : null); }
  function secOf(id) { var r = ''; ['ba', 'sx', 'ac'].forEach(function (k) { ST[k].items.forEach(function (it) { if (it.id === id) r = k; }); }); return r || (XC[id] && XC[id] !== 'w' ? 'ac' : ''); }

  /* ---------- the list on the screen ---------- */
  function sigOf(sec) { var S = ST[sec]; return sec === 'ba' ? ['ba', S.cat, S.g, S.s].join('|') : sec; }
  function filtersOf(sec) { var S = ST[sec], f = [['sec', sec]]; if (sec === 'ba') { f.push(['cat', S.cat]); if (S.g) f.push(['g', S.g]); if (S.s) f.push(['s', S.s]); } return f; }
  function load(sec, more) {
    var S = ST[sec], x = cx(); if (!x) { S.err = 'offline'; S.loading = false; return; }
    var P = PAGE[sec], my = ++S.seq, f = filtersOf(sec), keep = more ? S.items.length : 0, after = more && keep ? S.items[keep - 1].id : null;
    S.loading = true; S.err = '';
    restList(x, f, P + 1, after).then(function (a) { return { a: a, all: false }; }, function () { return sdkList(x, f, keep + P + 1).then(function (a) { return { a: a, all: true }; }); })
      .then(function (r) {
        if (my !== S.seq) return;
        var lim = r.all ? keep + P : P, list = r.a.filter(function (z) { return phOf(z).length || sec === 'ac'; });
        S.more = r.a.length > lim; list = list.slice(0, lim);
        S.items = r.all ? list : (more ? S.items.concat(list) : list);
        S.loading = false;
        if (more && !r.all && addMore(sec, list)) return;       /* "Show more": only the new patients are drawn, the old ones stay as they are */
        repaint();
      }).catch(function () { if (my !== S.seq) return; S.loading = false; S.err = 'fail'; repaint(); });
  }
  function addMore(sec, fresh) {
    var cl = document.querySelector('#exb .ep-cl'), btn = document.querySelector('#exb [data-el="more"][data-sec="' + sec + '"]');
    if (!cl || !btn) return false;
    cl.insertAdjacentHTML('beforeend', fresh.map(function (it) { return caseHTML(it, sec, ''); }).join(''));
    if (ST[sec].more) btn.textContent = tt('Show more'); else { var bar = btn.parentNode; bar.parentNode.removeChild(bar); }
    return true;
  }
  function ensure(sec) {
    var S = ST[sec], sg = sigOf(sec);
    if (S.sig === sg) return;
    S.sig = sg; S.items = []; S.more = false; S.err = ''; S.loading = true;
    setTimeout(function () { if (ST[sec].sig === sg) load(sec, false); }, 0);
  }
  function reset() {                                  /* leaving the library: every preview is dropped */
    ['ba', 'sx', 'ac'].forEach(function (k) { var S = ST[k]; S.seq++; S.sig = null; S.items = []; S.more = false; S.loading = false; S.err = ''; });
    TK = {}; SEQ = {}; PREP = {}; DEL = null; CE = null; ED = null; SEL = {}; TTL = {}; XC = {}; XP = {}; MS = { on: false, ids: {} };
  }

  /* ---------- screens ---------- */
  var opt = function (v, t, sel) { return '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(t) + '</option>'; };
  function tagsOf(it) {
    var t = []; if (it.g) t.push(esc(genName(it.g)));
    var k = skinOf(it.s); if (k) t.push('<span class="ep-dot" style="background:' + k[2] + '"></span>' + esc(tt(k[1])));
    return t.join(' &middot; ');
  }
  function adminTools(it, sec) {
    if (sec !== 'ba') return '';
    var h = '<div class="ep-lta">';
    {
      h += '<select class="ep-in" data-elt="' + esc(it.id) + '|cat" aria-label="' + esc(tt('Category')) + '">' + cats().map(function (c) { return opt(c.id, catName(c), it.cat); }).join('') + '</select>'
        + '<select class="ep-in" data-elt="' + esc(it.id) + '|g" aria-label="' + esc(tt('Men or women')) + '">' + opt('', '-', it.g || '') + GEN.map(function (z) { return opt(z[0], tt(z[1]), it.g); }).join('') + '</select>'
        + '<select class="ep-in" data-elt="' + esc(it.id) + '|s" aria-label="' + esc(tt('Skin')) + '">' + opt('', '-', it.s || '') + SKIN.map(function (z) { return opt(z[0], tt(z[1]), it.s); }).join('') + '</select>';
    }
    return h + '</div>';
  }
  function editor() {
    var L = typeof LANGS !== 'undefined' ? LANGS.filter(function (l) { return l[0] !== 'en'; }) : [];
    return '<div class="ep-field"><label>' + esc(tt(ED.sec === 'ac' ? 'Message (English)' : 'Sentence (English)')) + '</label><textarea id="el_edc" rows="' + (ED.sec === 'ac' ? 7 : 3) + '">' + esc(ED.cap) + '</textarea></div>'
      + (ED.sec === 'ac' ? '<div class="ep-field"><label>' + esc(tt('Google location link')) + '</label><input type="text" id="el_edl" value="' + esc(ED.loc) + '" placeholder="https://maps.app.goo.gl/..."></div>' : '')
      + (L.length ? '<details class="ep-tr"><summary>' + esc(tt('Translations')) + '</summary>' + L.map(function (l) { return '<div class="ep-field"><label>' + esc(l[1]) + '</label><textarea rows="' + (ED.sec === 'ac' ? 4 : 2) + '" data-elatl="' + l[0] + '">' + esc((ED.tl && ED.tl[l[0]]) || '') + '</textarea></div>'; }).join('') + '</details>' : '')
      + '<div class="ep-bar" style="margin-top:8px"><button type="button" class="ep-btn ep-gold" data-el="edsave">&#10003; ' + esc(tt('Save')) + '</button><button type="button" class="ep-btn" data-el="edno">' + esc(tt('Cancel')) + '</button></div>';
  }
  /* ONE patient (or one hotel), laid out like the Patient Explanations: a title that minimizes the block, the small photos to choose from,
     the chosen photo with its text beside it, then 1 Copy photo / 2 Copy text / Photo + text together */
  var mmOf = function (id) { return 'lib:' + id; };
  var isMin = function (id) { return !!(EX.mm && EX.mm.get('lib', mmOf(id))); };
  function selOf(it) { var ph = phOf(it), s0 = SEL[it.id]; return ph.filter(function (p) { return p.id === s0; })[0] || ph[0] || null; }
  function titleOf(it, sec, title) {
    if (title) return esc(title);
    if (sec === 'sx') return esc(tt('Status'));
    var cn = catById(it.cat), t = tagsOf(it);
    return esc(cn ? catName(cn) : tt('Before and After')) + (t ? ' &middot; ' + t : '');
  }
  function caseHTML(it, sec, title, calc) {
    var mg = calc ? false : EX.mg(), ph = phOf(it), n = ph.length, ed = !calc && ED && ED.id === it.id, mn = isMin(it.id) && !ed, cur = selOf(it);
    if (title) TTL[it.id] = title;
    var merging = mg && !calc && !ed && MS.on && (sec === 'ba' || sec === 'sx'), picked = merging && !!MS.ids[it.id];
    var head = '<div class="ep-bh ep-hd" data-el="min" data-v="' + esc(it.id) + '" title="' + esc(tt(mn ? 'Press to open' : 'Press to minimize')) + '">'
      + (merging ? '<input type="checkbox" class="ep-mchk" style="margin-right:6px" data-el="msel" data-sec="' + esc(sec) + '" data-v="' + esc(it.id) + '"' + (picked ? ' checked' : '') + ' aria-label="' + esc(tt('Select for merge')) + '">' : '')
      + '<span class="ep-car">' + (mn ? '&#9656;' : '&#9662;') + '</span>'
      + (mn && cur ? '<img class="ep-hth" decoding="async" src="' + cur.t + '" alt="">' : '') + '<b class="lux" data-notr>' + titleOf(it, sec, title) + '</b>' + (n > 1 ? '<span class="ep-chip">&#128247; ' + n + '</span>' : '') + '<span class="ep-sp"></span>'
      + (mg && !ed && !merging ? '<button type="button" class="ep-btn" data-el="edit" data-v="' + esc(it.id) + '">&#9998; ' + esc(tt('Edit')) + '</button>'
        + '<button type="button" class="ep-btn ' + (DEL === it.id ? 'ep-bad' : '') + '" data-el="del" data-v="' + esc(it.id) + '">&#128465; ' + esc(DEL === it.id ? tt('Tap again to delete') : tt('Delete')) + '</button>' : '') + '</div>';
    var wrap = function (inner) { return '<div class="ep-blk ep-case" data-case="' + esc(it.id) + '"' + (calc ? ' data-calc="1"' : '') + '>' + head + inner + '</div>'; };
    if (ed) return wrap(editor());
    if (mn) return wrap('');
    var body = mg ? adminTools(it, sec) : '';
    if (n > 1) body += '<div class="ep-sub">' + esc(tt('Choose what to send')) + ' (' + n + ')</div><div class="ep-pick">' + ph.map(function (p, i) {
      return '<button type="button" class="ep-pk ' + (cur && p.id === cur.id ? 'ep-on' : '') + '" data-el="pick" data-v="' + esc(it.id + '|' + p.id) + '" aria-label="Photo ' + (i + 1) + '"><img decoding="async" src="' + p.t + '" alt=""></button>';
    }).join('') + '</div>';
    var k = cur ? it.id + '|' + cur.id : '', tx = textOf(it), dp = TK[k], dt = TK['t' + it.id], db = TK['b' + it.id], pr = PREP[it.id];
    var bar = (cur ? '<button type="button" class="ep-btn ' + (dp ? 'ep-ok' : 'ep-gold') + '" data-el="copy" data-v="' + esc(k) + '">' + (dp ? '&#10003; ' + esc(tt('Photo copied')) : '1 &middot; ' + esc(tt('Copy photo'))) + '</button>' : '')
      + (tx ? '<button type="button" class="ep-btn ' + (dt ? 'ep-ok' : 'ep-gold') + '" data-el="tx" data-v="' + esc(it.id) + '">' + (dt ? '&#10003; ' + esc(tt('Text copied')) : (cur ? '2 &middot; ' : '') + esc(tt('Copy text'))) + '</button>' : '')
      + (cur && (tx || n > 1) && shareOK() ? '<button type="button" class="ep-btn ' + (db ? 'ep-ok' : pr ? 'ep-gold' : '') + '" data-el="both" data-v="' + esc(it.id) + '">' + (db ? '&#10003; ' + esc(db) : pr ? '&#10148; ' + esc(tt('Tap again to send')) : esc(allLabel(n, tx))) + '</button>' : '')
      + (cur && n > 1 && EX.canClip() ? seqBtn(it.id, n, tx) : '')
      + (mg && cur ? '<button type="button" class="ep-btn ' + (DEL === 'p:' + k ? 'ep-bad' : '') + '" data-el="phdel" data-v="' + esc(k) + '">&#128465; ' + esc(DEL === 'p:' + k ? tt('Tap again to delete') : tt('Delete photo')) + '</button>' : '');
    body += '<div class="ep-part' + (cur ? ' ep-hasimg' : '') + (tx ? '' : ' ep-notx') + '">' + (cur ? '<img class="ep-img" decoding="async" src="' + cur.t + '" alt="" data-el="zoom" data-v="' + esc(k) + '">' : '')
      + (tx ? '<div class="ep-pt" data-notr>' + esc(tx) + '</div>' : '') + '<div class="ep-bar">' + bar + '</div></div>';
    return wrap(body);
  }
  function repaintCase(id) {                           /* only this block is drawn again (the list keeps its place on the screen) */
    var it = find(id), els = document.querySelectorAll('[data-case="' + id + '"]');
    if (!it || !els.length) { repaint(); return; }
    Array.prototype.forEach.call(els, function (el) { var c = el.hasAttribute('data-calc'); el.outerHTML = caseHTML(it, secOf(id), c ? (it.hn || '') : (TTL[id] || ''), c); });
  }
  var mbar = function () { return '<div class="ep-mbar ep-lite"><span class="ep-sp"></span><button type="button" class="ep-btn" data-el="mall" data-v="min">&#9662; ' + esc(tt('Minimize all')) + '</button><button type="button" class="ep-btn" data-el="mall" data-v="open">&#9656; ' + esc(tt('Expand all')) + '</button></div>'; };
  function gridHTML(sec) {
    var S = ST[sec];
    if (S.loading && !S.items.length) return '<p class="ep-sub">' + esc(tt('Loading...')) + '</p>';
    if (S.err && !S.items.length) return '<div class="ep-note">' + esc(tt('Could not load the photos. Check the internet and try again.')) + (isAdm() ? ' ' + esc(tt('Administrator: the newer firestore.rules must be published in Firebase.')) : '') + ' <button type="button" class="ep-btn" data-el="retry" data-sec="' + sec + '">' + esc(tt('Try again')) + '</button></div>';
    if (!S.items.length) return '<div class="ep-note">' + esc(tt('No photos here yet.')) + '</div>';
    return '<div class="ep-cl">' + (S.items.length > 1 ? mbar() : '') + S.items.map(function (it) { return caseHTML(it, sec, ''); }).join('') + '</div>'
      + (S.more ? '<div class="ep-bar" style="justify-content:center;margin-top:8px"><button type="button" class="ep-btn ep-gold" data-el="more" data-sec="' + sec + '">' + esc(tt('Show more')) + (S.loading ? ' ...' : '') + '</button></div>' : '');
  }
  function filterBar(S) {
    var fb = function (k, v, label, on, extra) { return '<button type="button" class="ep-fb ' + (on ? 'ep-on' : '') + '" data-el="' + k + '" data-v="' + v + '">' + (extra || '') + esc(label) + '</button>'; };
    return '<div class="ep-flt"><span class="ep-fl">' + esc(tt('Men or women')) + '</span>' + fb('fg', '', tt('All'), !S.g) + GEN.map(function (z) { return fb('fg', z[0], tt(z[1]), S.g === z[0]); }).join('')
      + '<span class="ep-fl" style="margin-left:8px">' + esc(tt('Skin')) + '</span>' + fb('fs', '', tt('All'), !S.s) + SKIN.map(function (z) { return fb('fs', z[0], tt(z[1]), S.s === z[0], '<span class="ep-dot" style="background:' + z[2] + '"></span>'); }).join('') + '</div>';
  }
  /* the administrator: categories */
  function catBar() {
    var S = ST.ba, cur = catById(S.cat), h = '<div class="ep-bar ep-mgbar"><b style="font-size:12px">' + esc(tt('Categories')) + '</b>';
    if (CE) {
      h += '<input type="text" id="el_catn" class="ep-in" maxlength="40" value="' + esc(CE.mode === 'ren' && cur ? catName(cur) : '') + '" placeholder="' + esc(tt('Category name')) + '"><button type="button" class="ep-btn ep-gold" data-el="catok">' + esc(tt('Save')) + '</button><button type="button" class="ep-btn" data-el="catno">' + esc(tt('Cancel')) + '</button>';
    } else {
      h += '<button type="button" class="ep-btn" data-el="catadd">+ ' + esc(tt('Add category')) + '</button>';
      if (cur) h += '<button type="button" class="ep-btn" data-el="catren">&#9998; ' + esc(tt('Rename')) + '</button><button type="button" class="ep-btn ' + (DEL === 'cat:' + cur.id ? 'ep-bad' : '') + '" data-el="catdel">&#128465; ' + esc(DEL === 'cat:' + cur.id ? tt('Tap again to delete {0}', catName(cur)) : tt('Delete this category')) + '</button>';
    }
    return h + '</div>';
  }
  /* the administrator: photos come from a file that Claude prepares (also a saved backup of the library) */
  function fileBar() {
    var h = '<div class="ep-mgbar ep-up"><b style="font-size:12px">' + esc(tt('Photo library')) + '</b>';
    if (IM && IM.state === 'run') {
      h += '<p id="el_pt" style="margin:6px 0;font-size:13px">' + esc(tt('Adding {0} of {1}...', Math.min(IM.done + 1, IM.total || 1), IM.total || 1)) + '</p><div class="ep-pbar"><i id="el_pg" style="width:' + Math.round(IM.done / (IM.total || 1) * 100) + '%"></i></div>';
    } else if (IM && IM.state === 'done') {
      h += '<p style="margin:6px 0;font-size:13px">&#10003; ' + esc(tt('{0} added', IM.added)) + (IM.skipped ? ' &middot; ' + esc(tt('{0} already there', IM.skipped)) : '') + (IM.fail ? ' &middot; <b style="color:#b91c1c">' + esc(tt('{0} failed', IM.fail)) + '</b>' : '') + '</p>'
        + (IM.denied ? '<div class="ep-note">' + esc(tt('Not saved: the newer firestore.rules must be published in Firebase first.')) + '</div>' : '')
        + (IM.bad ? '<div class="ep-note">' + esc(tt('A file was not a photo library file.')) + '</div>' : '')
        + '<div class="ep-bar"><button type="button" class="ep-btn ep-gold" data-el="imok">' + esc(tt('OK')) + '</button></div>';
    } else {
      h += '<div class="ep-bar" style="margin-top:6px"><label class="ep-btn ep-gold" style="cursor:pointer">&#11014; ' + esc(tt('Add photos from a file')) + '<input type="file" accept=".json,application/json" multiple hidden data-elimp></label>'
        + (BK ? '<span class="ep-sub" style="margin:0">' + esc(BK) + '</span>' : '<button type="button" class="ep-btn" data-el="bksave">&#11015; ' + esc(tt('Save the photo library')) + '</button>') + '</div>';
    }
    return h + '</div>';
  }
  function mergeBar(sec) {
    if (!(sec === 'ba' || sec === 'sx')) return '';
    var n = Object.keys(MS.ids).length, h = '<div class="ep-bar ep-mgbar">';
    if (!MS.on) {
      h += '<button type="button" class="ep-btn" data-el="mon" data-sec="' + sec + '">&#128279; ' + esc(tt('Combine photos of the same patient')) + '</button>';
    } else {
      h += '<b style="font-size:12px">' + esc(tt('Tick the patients to combine into one, then press Combine')) + '</b>'
        + (n >= 2 ? '<button type="button" class="ep-btn ' + (DEL === 'merge' ? 'ep-bad' : 'ep-gold') + '" data-el="mdo" data-sec="' + sec + '">&#10003; ' + esc(DEL === 'merge' ? tt('Tap again to combine {0} into one', n) : tt('Combine {0} selected into one', n)) + '</button>' : '')
        + '<button type="button" class="ep-btn" data-el="moff" data-sec="' + sec + '">' + esc(tt('Cancel')) + '</button>';
    }
    return h + '</div>';
  }
  function htmlBA() {
    var S = ST.ba, cs = cats(), h = '';
    if (!S.cat || !cs.some(function (c) { return c.id === S.cat; })) S.cat = cs[0] ? cs[0].id : '';
    ensure('ba');
    if (EX.mg()) h += catBar() + fileBar() + mergeBar('ba');
    h += '<div class="ep-tabs ep-sub2">' + cs.map(function (c) { return '<button type="button" class="ep-tab ' + (c.id === S.cat ? 'ep-on' : '') + '" data-el="cat" data-v="' + esc(c.id) + '">' + esc(catName(c)) + '</button>'; }).join('') + '</div>'
      + filterBar(S) + gridHTML('ba');
    return h;
  }
  function htmlSX() {
    ensure('sx');
    return (EX.mg() ? fileBar() + mergeBar('sx') : '') + gridHTML('sx');
  }

  /* ---------- the hotels ---------- */
  function hotels() {
    var seen = {}, out = []; if (typeof trdHotelItems !== 'function') return out;
    trdHotelItems().forEach(function (t) {
      var nm = typeof trdHotelName === 'function' ? trdHotelName(t.n) : String(t.n || '').trim(), k = hkey(nm);
      if (!k || seen[k]) return; seen[k] = 1; out.push({ key: k, name: nm });
    });
    return out;
  }
  function htmlAC() {
    var mg = EX.mg(), L = hotels(), S = ST.ac; ensure('ac');
    var bar = mg ? fileBar() : '';
    if (!L.length) return bar + '<div class="ep-note">' + esc(tt('No hotels in the Treatment Database yet.')) + '</div>';
    if (S.loading && !S.items.length) return bar + '<p class="ep-sub">' + esc(tt('Loading...')) + '</p>';
    if (S.err && !S.items.length) return bar + gridHTML('ac');
    var by = {}; S.items.forEach(function (it) { if (it.hk) by[it.hk] = it; });
    var shown = L.filter(function (z) { return mg || by[z.key]; });
    if (!shown.length) return bar + '<div class="ep-note">' + esc(tt('No messages here yet.')) + '</div>';
    return bar + '<div class="ep-cl">' + (shown.length > 1 ? mbar() : '') + shown.map(function (z) {
      var it = by[z.key];
      if (it) return caseHTML(it, 'ac', z.name);
      var id = acId(z.key);
      if (ED && ED.id === id) return '<div class="ep-blk ep-case"><div class="ep-bh"><b class="lux" data-notr>' + esc(z.name) + '</b></div>' + editor() + '</div>';
      return '<div class="ep-blk ep-case"><div class="ep-bh"><b class="lux" data-notr>' + esc(z.name) + '</b><span class="ep-sp"></span><button type="button" class="ep-btn" data-el="acnew" data-v="' + esc(z.key) + '">' + esc(tt('Add message')) + '</button></div><div class="ep-note">' + esc(tt('No message yet.')) + '</div></div>';
    }).join('') + '</div>';
  }

  /* ---------- copy / enlarge ---------- */
  function mark(btn, label) { if (!btn) return; btn.classList.remove('ep-gold'); btn.classList.add('ep-ok'); btn.innerHTML = '&#10003; ' + esc(label); }
  function copyPhoto(k, btn) {
    var pid = k.slice(k.indexOf('|') + 1);
    if (!cx()) { toast(tt('The shared database is not connected.')); return; }
    if (!EX.canClip()) { toast(tt('This window does not allow copying photos.')); return; }
    var net = false, png = fullOf(pid).then(function (u) { return EX.pngOf(u); }).catch(function (e) { net = true; throw e; });
    navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]).then(function () {
      TK[k] = 1; mark(btn, tt('Photo copied')); toast(tt('Photo copied. Paste it in WhatsApp.'), 4200);
    }, function () { toast(net ? tt('Could not load the photo. Check the internet and try again.') : tt('Copy was blocked in this window.')); });
  }
  /* version 3.4: "All photos + text" - EVERY photo of the patient / hotel together with the text.
     A clipboard cannot carry several photos into WhatsApp (and with a text on it, WhatsApp pastes only the text), so the button opens the
     Share menu of the phone or computer: choose WhatsApp and the chat, and all the photos go with the text.
     Where there is no Share menu (some computers), all the photos and the text are copied for email, Notes or Word. */
  /* version 3.5: "One by one" - for WhatsApp Web on a computer (a Share menu cannot reach it): every press copies the NEXT photo,
     the last press copies the text. Copy, paste in WhatsApp, press again ... */
  var SEQ = {};                                      /* patient / hotel -> the next thing to copy (0 = photo 1 ... n = the text) */
  var SHR = null;
  function shareOK() { if (SHR === null) { try { SHR = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.jpg', { type: 'image/jpeg' })] })); } catch (e) { SHR = false; } } return SHR; }
  function seqBtn(id, n, tx) {
    var i = SEQ[id] || 0, done = i > n || (i === n && !tx);
    var lb = done ? '&#10003; ' + esc(tt('All copied - start again')) : i < n ? '&#10148; ' + esc(i ? tt('Next: copy photo {0} of {1}', i + 1, n) : tt('One by one: copy photo 1 of {0}', n)) : '&#10148; ' + esc(tt('Last: copy the text'));
    return '<button type="button" class="ep-btn ' + (done ? 'ep-ok' : i ? 'ep-gold' : '') + '" data-el="seq" data-v="' + esc(id) + '">' + lb + '</button>';
  }
  function seqCopy(id, btn) {
    var it = find(id); if (!it || (btn && btn.disabled)) return;
    if (!cx()) { toast(tt('The shared database is not connected.')); return; }
    var ph = phOf(it), tx = textOf(it), n = ph.length, i = SEQ[id] || 0;
    if (i > n || (i === n && !tx)) i = 0;
    if (i < n) {
      if (!EX.canClip()) { toast(tt('This window does not allow copying photos.')); return; }
      if (btn) { btn.disabled = true; btn.textContent = tt('Copying...'); }
      var net = false, png = fullOf(ph[i].id).then(function (u) { return EX.pngOf(u); }).catch(function (e) { net = true; throw e; });
      navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]).then(function () {
        SEQ[id] = i + 1; SEL[id] = ph[i].id; repaintCase(id);
        toast(tt('Photo {0} of {1} copied. Paste it in WhatsApp, then press the button again.', i + 1, n), 4500);
      }, function () { repaintCase(id); toast(net ? tt('Could not load the photo. Check the internet and try again.') : tt('Copy was blocked in this window.')); });
      return;
    }
    EX.copyText(tx).then(function (ok) {
      if (!ok) { toast(tt('Copy was blocked in this window.')); return; }
      SEQ[id] = n + 1; repaintCase(id); toast(tt('Text copied. Paste it in WhatsApp.'), 4000);
    });
  }
  var PREP = {};                                     /* photos already loaded, waiting for the second tap (the Share menu needs a fresh tap) */
  function allLabel(n, tx) { return n > 1 ? (tx ? tt('All {0} photos + text', n) : tt('All {0} photos', n)) : tt('Photo + text together'); }
  function blobOf(u) {
    var i = u.indexOf(','), head = u.slice(5, i), b64 = /;base64/.test(head), type = head.split(';')[0] || 'image/jpeg';
    var raw = b64 ? atob(u.slice(i + 1)) : decodeURIComponent(u.slice(i + 1)), a = new Uint8Array(raw.length);
    for (var j = 0; j < raw.length; j++) a[j] = raw.charCodeAt(j);
    return new Blob([a], { type: type });
  }
  function filesOf(urls, name) {
    var base = String(name || 'photo').replace(/[^\w\- ]+/g, ' ').replace(/\s+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'photo';
    return urls.map(function (u, i) { var b = blobOf(u), ext = /png/.test(b.type) ? '.png' : /webp/.test(b.type) ? '.webp' : '.jpg'; return new File([b], base + '-' + (i + 1) + ext, { type: b.type }); });
  }
  var canShareFiles = function (files) { try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: files })); } catch (e) { return false; } };
  function shareNow(id, P, btn) {
    var d = { files: P.files }; if (P.text) d.text = P.text;
    return navigator.share(d).then(function () {
      delete PREP[id]; TK['b' + id] = tt('Sent') + ' - ' + allLabel(P.files.length, P.text).toLowerCase(); repaintCase(id);
    }, function (e) {
      if (e && e.name === 'NotAllowedError' && !P.again) { P.again = true; PREP[id] = P; delete TK['b' + id]; repaintCase(id); toast(tt('The photos are ready. Tap the button again to send them.'), 4200); return; }
      delete PREP[id]; repaintCase(id);
      if (!(e && e.name === 'AbortError')) toast(tt('Could not open the Share menu. Try again.'));
    });
  }
  function copyAll(id, P, urls) {
    if (!EX.canClip()) { EX.copyText(P.text).then(function (ok) { toast(ok ? tt('Copied the text only: this window does not allow photos.') : tt('Copy was blocked in this window.')); }); return; }
    var html = urls.map(function (u) { return '<p><img src="' + u + '" style="max-width:480px"></p>'; }).join('') + (P.text ? '<p>' + esc(P.text).replace(/\n/g, '<br>') + '</p>' : '');
    navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([P.text || ''], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]).then(function () {
      TK['b' + id] = tt('Copied') + ' - ' + allLabel(urls.length, P.text).toLowerCase(); repaintCase(id);
      toast(tt('Copied all the photos and the text. Paste them in an email, Notes or Word. To send them in WhatsApp, use this button on your phone.'), 6500);
    }, function () { toast(tt('Copy was blocked in this window.')); });
  }
  function copyBoth(id, btn) {
    var it = find(id); if (!it) return;
    if (PREP[id]) { shareNow(id, PREP[id], btn); return; }
    if (!cx()) { toast(tt('The shared database is not connected.')); return; }
    var ph = phOf(it), text = textOf(it); if (!ph.length) return;
    if (btn) { btn.disabled = true; btn.textContent = tt('Loading {0} photos...', ph.length); }
    Promise.all(ph.map(function (p) { return fullOf(p.id); })).then(function (urls) {
      var P = { files: filesOf(urls, TTL[id] || catName(catById(it.cat) || {}) || 'photo'), text: text };
      if (canShareFiles(P.files)) return shareNow(id, P, btn);
      copyAll(id, P, urls);
    }).catch(function () {
      repaintCase(id); toast(tt('Could not load the photos. Check the internet and try again.'));
    });
  }
  function copyTx(id, btn) {
    var it = find(id); if (!it) return;
    EX.copyText(textOf(it)).then(function (ok) {
      if (!ok) { toast(tt('Copy was blocked in this window.')); return; }
      TK['t' + id] = 1; mark(btn, tt('Text copied')); toast(tt('Text copied. Paste it in the caption box under the photo.'));
    });
  }
  function zoom(k) {
    var i = k.indexOf('|'), cid = k.slice(0, i), pid = k.slice(i + 1), it = find(cid), e = g('exlb'); if (!it || !e) return;
    var p = phOf(it).filter(function (z) { return z.id === pid; })[0]; if (!p) return;
    e.innerHTML = '<img src="' + p.t + '" alt="" data-lid="' + esc(pid) + '" class="ep-lbs"><button type="button" aria-label="Close">&times;</button>'; e.classList.remove('hidden');
    fullOf(pid).then(function (u) { var im = e.querySelector('img[data-lid]'); if (im && im.getAttribute('data-lid') === pid && !e.classList.contains('hidden')) { im.src = u; im.classList.remove('ep-lbs'); } }, function () {});
  }

  /* ---------- tags, sentence, deleting (administrator) ---------- */
  var noRight = function () { toast(tt('Not saved: you have no permission for this change.')); };
  function setTag(id, field, v) {
    var x = cx(); if (!x || !isAdm()) return;
    var o = {}; o[field] = v;
    x.db.collection('lib').doc(id).update(o).then(function () {
      var it = find(id); if (it) it[field] = v;
      toast(tt('Saved.')); if (field === 'cat' && it && ST.ba.cat !== v) ST.ba.items = ST.ba.items.filter(function (z) { return z.id !== id; }); repaint();
    }, noRight);
  }
  function edStart(id, key) {
    var it = id ? find(id) : null;
    if (it) ED = { id: it.id, sec: it.sec || secOf(it.id), cap: it.cap || '', loc: it.loc || '', tl: ctOf(it) };
    else ED = { id: acId(key), sec: 'ac', cap: '', loc: '', tl: {}, hk: key, isNew: true };
    DEL = null; repaint();
  }
  function edSync() {
    if (!ED) return; var c = g('el_edc'), l = g('el_edl'); if (c) ED.cap = c.value; if (l) ED.loc = l.value;
    document.querySelectorAll('[data-elatl]').forEach(function (e) { ED.tl = ED.tl || {}; ED.tl[e.getAttribute('data-elatl')] = e.value; });
  }
  function edSave() {
    var x = cx(); if (!x || !isAdm() || !ED) return; edSync();
    var E = ED, tl = {}; Object.keys(E.tl || {}).forEach(function (k) { if (k !== 'en' && typeof E.tl[k] === 'string' && E.tl[k].trim()) tl[k] = E.tl[k]; });
    var o = { cap: E.cap, ct: Object.keys(tl).length ? JSON.stringify(tl) : '' };
    if (E.sec === 'ac') o.loc = E.loc.trim();
    var ref = x.db.collection('lib').doc(E.id), done = function () { ED = null; ST[E.sec].sig = null; toast(tt('Saved.')); repaint(); };
    if (E.isNew) {
      var hn = (hotels().filter(function (z) { return z.key === E.hk; })[0] || {}).name || '';
      ref.set(Object.assign({ sec: 'ac', cat: '', g: '', s: '', hk: E.hk, hn: hn, ph: [], kb: 0, by: x.email, at: x.fb.firestore.FieldValue.serverTimestamp() }, o)).then(done, noRight);
    } else ref.update(o).then(done, noRight);
  }
  function delCase(id) {
    var x = cx(); if (!x || !isAdm()) return;
    if (DEL !== id) { DEL = id; repaint(); return; }
    DEL = null; var it = find(id), sec = secOf(id); if (!it) return;
    var cid = it.cat;
    Promise.all(phOf(it).map(function (p) { return x.db.collection('libfull').doc(p.id).delete(); }).concat([x.db.collection('lib').doc(id).delete()])).then(function () {
      ST[sec].items = ST[sec].items.filter(function (z) { return z.id !== id; }); toast(tt('Deleted.'));
      return sec === 'ba' ? cleanupCatIfEmpty(cid) : null;
    }).then(repaint, noRight);
  }
  function mergeDo(sec) {                              /* "Combine photos of the same patient": join the ticked patients into the first one's box */
    var x = cx(); if (!x || !isAdm()) return;
    var ids = Object.keys(MS.ids); if (ids.length < 2) return;
    if (DEL !== 'merge') { DEL = 'merge'; repaint(); return; }
    DEL = null;
    var S = ST[sec], ordered = S.items.filter(function (it) { return MS.ids[it.id]; });
    if (ordered.length < 2) { MS.on = false; MS.ids = {}; repaint(); return; }
    var head = ordered[0], rest = ordered.slice(1), ph = [];
    /* all the photos together under the first patient; his own text stays, the other boxes' texts are dropped with their (now empty) boxes */
    ordered.forEach(function (it) { phOf(it).forEach(function (p) { if (!ph.some(function (z) { return z.id === p.id; })) ph.push({ id: p.id, t: p.t }); }); });
    x.db.collection('lib').doc(head.id).update({ ph: ph }).then(function () {
      return rest.reduce(function (p, it) { return p.then(function () { return x.db.collection('lib').doc(it.id).delete(); }); }, Promise.resolve());
    }).then(function () {
      head.ph = ph; delete SEL[head.id];
      S.items = S.items.filter(function (it) { return it === head || !MS.ids[it.id]; });
      MS.on = false; MS.ids = {};
      toast(tt('Combined into one patient ({0} photos).', ph.length)); repaint();
    }, function () { MS.on = false; MS.ids = {}; noRight(); repaint(); });
  }
  function delPhoto(k) {
    var x = cx(); if (!x || !isAdm()) return;
    if (DEL !== 'p:' + k) { DEL = 'p:' + k; repaint(); return; }
    DEL = null; var i = k.indexOf('|'), cid = k.slice(0, i), pid = k.slice(i + 1), it = find(cid), sec = secOf(cid); if (!it) return;
    var rest = phOf(it).filter(function (p) { return p.id !== pid; });
    if (!rest.length && sec !== 'ac') { DEL = cid; delCase(cid); return; }
    x.db.collection('lib').doc(cid).update({ ph: rest.map(function (p) { return { id: p.id, t: p.t }; }) }).then(function () { return x.db.collection('libfull').doc(pid).delete(); }).then(function () {
      it.ph = rest; delete SEL[cid]; toast(tt('Deleted.')); repaint();
    }, noRight);
  }
  function catEmpty(id) {
    var x = cx(); if (!x) return Promise.resolve(false);
    var f = [['sec', 'ba'], ['cat', id]];
    return restList(x, f, 1, null).catch(function () { return sdkList(x, f, 1); }).then(function (a) { return !a.length; });
  }
  function cleanupCatIfEmpty(cid) {                     /* after deleting a patient: if that was the last one in a CUSTOM category, remove the now-empty category too */
    if (!cid) return null;
    var c = catById(cid); if (!c || c.d) return null;    /* never touch the built-in categories, even if empty */
    return catEmpty(cid).then(function (empty) {
      if (!empty) return;
      var L = cats().filter(function (z) { return z.id !== cid; }).map(function (z) { return { id: z.id, n: z.n, d: z.d ? 1 : 0 }; });
      if (!L.length) return;                            /* never remove the very last category */
      if (ST.ba.cat === cid) ST.ba.cat = L[0].id;
      saveCats(L);
    });
  }
  function catSave() {
    var inp = g('el_catn'), n = inp ? String(inp.value || '').trim() : ''; if (!n) { toast(tt('Write the name first.')); return; }
    var L = cats().map(function (c) { return { id: c.id, n: c.n, d: c.d ? 1 : 0 }; });
    if (CE && CE.mode === 'ren') { var c0 = L.filter(function (c) { return c.id === ST.ba.cat; })[0]; if (c0) { c0.n = n; c0.d = 0; } }
    else { var id = 'c' + Date.now().toString(36); L.push({ id: id, n: n, d: 0 }); ST.ba.cat = id; }
    CE = null; saveCats(L); toast(tt('Saved.')); repaint();
  }
  function catDelete() {
    var cur = catById(ST.ba.cat); if (!cur) return;
    if (DEL !== 'cat:' + cur.id) { DEL = 'cat:' + cur.id; repaint(); return; }
    DEL = null;
    if (cats().length < 2) { toast(tt('The last category cannot be deleted.')); repaint(); return; }
    catEmpty(cur.id).then(function (empty) {
      if (!empty) { toast(tt('This category still has photos. Delete or move them first.')); repaint(); return; }
      var L = cats().filter(function (c) { return c.id !== cur.id; }).map(function (c) { return { id: c.id, n: c.n, d: c.d ? 1 : 0 }; });
      ST.ba.cat = L[0].id; saveCats(L); toast(tt('Deleted.')); repaint();
    });
  }

  /* ---------- adding photos from a file (administrator) ---------- */
  /* Nothing that already exists is ever overwritten: a patient / hotel that is already there is skipped. */
  function paintProgress() {
    if (!IM) return; var t = g('el_pt'), p = g('el_pg');
    if (t) t.textContent = tt('Adding {0} of {1}...', Math.min(IM.done + 1, IM.total || 1), IM.total || 1);
    if (p) p.style.width = Math.round(IM.done / (IM.total || 1) * 100) + '%';
  }
  function putItem(x, it, newCats) {
    var sec = it && (it.sec === 'sx' || it.sec === 'ac') ? it.sec : 'ba', id = String(it && it.id || ''), hk = '', hn = '';
    var ph = (it && Array.isArray(it.ph) ? it.ph : []).filter(function (p) { return p && p.id && dataOk(p.t) && dataOk(p.d); });
    if (sec === 'ac') { hn = (typeof trdHotelName === 'function' ? trdHotelName(it.hn) : String(it.hn || '')).trim(); hk = hkey(hn); if (!hk) return Promise.reject(new Error('hotel')); id = acId(hk); }
    if (!id || !ph.length) return Promise.reject(new Error('empty'));
    var ref = x.db.collection('lib').doc(id);
    return ref.get().then(function (d) {
      var ex = d && d.exists ? d.data() : null;
      /* what is already there is never touched; only a hotel that has a text but no photos yet gets its photos (his text stays as he wrote it) */
      if (ex && !(sec === 'ac' && !phOf(ex).length)) { IM.skipped++; return; }
      var at = x.fb.firestore.FieldValue.serverTimestamp(), kb = 0;
      return ph.reduce(function (p, q) {
        return p.then(function () { var k = Math.round((q.d.length - 23) * 0.75 / 1024); kb += k; return x.db.collection('libfull').doc(q.id).set({ d: q.d, kb: k, by: x.email, at: at }); });
      }, Promise.resolve()).then(function () {
        var o = { sec: sec, cat: sec === 'ba' ? String(it.cat || '') : '', g: sec === 'ba' ? String(it.g || '') : '', s: sec === 'ba' ? String(it.s || '') : '', cap: String(it.cap || ''), ct: typeof it.ct === 'string' ? it.ct : '', loc: String(it.loc || ''), hk: hk, hn: hn, ph: ph.map(function (q) { return { id: q.id, t: q.t }; }), kb: kb, by: x.email, at: at };
        return ex ? ref.update({ ph: o.ph, kb: kb }) : ref.set(o);
      }).then(function () {
        IM.added++;
        if (sec === 'ba' && o_cat(it) && !catById(o_cat(it)) && !newCats[o_cat(it)]) newCats[o_cat(it)] = String(it.catn || it.cat);
      });
    });
  }
  var o_cat = function (it) { return String(it.cat || ''); };
  function importFiles(files) {
    var x = cx(); if (!x || !isAdm()) return;
    var list = [].slice.call(files || []); if (!list.length) return;
    IM = { state: 'run', total: 0, done: 0, added: 0, skipped: 0, fail: 0, bad: 0, denied: false }; repaint();
    var newCats = {};
    list.reduce(function (p, f) {
      return p.then(function () { return f.text(); }).then(function (txt) {
        var o; try { o = JSON.parse(txt); } catch (e) { IM.bad++; return; }
        if (!o || o.kind !== 'eop-photo-library' || !Array.isArray(o.items)) { IM.bad++; return; }
        IM.total += o.items.length; paintProgress();
        return o.items.reduce(function (q, it) {
          return q.then(function () { return putItem(x, it, newCats); }).catch(function (e) { IM.fail++; if (e && e.code === 'permission-denied') IM.denied = true; }).then(function () { IM.done++; paintProgress(); });
        }, Promise.resolve());
      });
    }, Promise.resolve()).then(function () {
      var ids = Object.keys(newCats);
      if (ids.length) { var L = cats().map(function (c) { return { id: c.id, n: c.n, d: c.d ? 1 : 0 }; }); ids.forEach(function (k) { L.push({ id: k, n: newCats[k], d: 0 }); }); saveCats(L); }
      IM.state = 'done'; ['ba', 'sx', 'ac'].forEach(function (k) { ST[k].sig = null; }); repaint();
    }, function () { IM.state = 'done'; IM.fail++; repaint(); });
  }

  /* ---------- the backup of the photo library (administrator) ---------- */
  var BKMAX = 24e6;                                   /* about this many characters in one file */
  function bkDownload(name, obj) {
    var b = new Blob([JSON.stringify(obj)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  function bkSave() {
    var x = cx(); if (!x || !isAdm() || BK) return;
    var day = new Date().toISOString().slice(0, 10), part = 0, size = 0, buf = [], total = 0, after = null;
    var flush = function () { if (!buf.length) return; part++; bkDownload('EOP-photo-library-' + day + '-part-' + part + '.json', { kind: 'eop-photo-library', v: 2, saved: new Date().toISOString(), part: part, items: buf }); buf = []; size = 0; };
    var say = function (t) { BK = t; repaint(); };
    var page = function () {
      return restList(x, [], 8, after).catch(function () { return x.db.collection('lib').limit(8).get().then(function (s) { var a = []; s.forEach(function (d) { a.push(Object.assign({ id: d.id }, d.data())); }); return a; }); }).then(function (a) {
        if (!a.length) return null;
        after = a[a.length - 1].id;
        return a.reduce(function (p, it) {
          return p.then(function () {
            var ph = phOf(it), out = [];
            return ph.reduce(function (q, pp) { return q.then(function () { return fullOf(pp.id).then(function (d) { out.push({ id: pp.id, t: pp.t, d: d }); }, function () {}); }); }, Promise.resolve()).then(function () {
              if (!out.length && it.sec !== 'ac') return;
              var cn = catById(it.cat);
              buf.push({ id: it.id, sec: it.sec, cat: it.cat || '', catn: cn ? catName(cn) : '', g: it.g || '', s: it.s || '', cap: it.cap || '', ct: it.ct || '', loc: it.loc || '', hn: it.hn || '', ph: out });
              out.forEach(function (o) { size += o.t.length + o.d.length + 60; }); size += 300; total++;
              if (size > BKMAX) flush(); say(tt('Saving... {0} photos', total));
            });
          });
        }, Promise.resolve()).then(function () { return a.length >= 8 ? page() : null; });
      });
    };
    say(tt('Saving... {0} photos', 0));
    page().then(function () { flush(); say(tt('Saved {0} photos in {1} file(s). Keep these files safe.', total, part)); setTimeout(function () { BK = ''; repaint(); }, 9000); }, function () { BK = ''; toast(tt('Could not save the photo library. Check the internet and try again.')); repaint(); });
  }

  /* ---------- clicks ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-el]'); if (!t) return;
    var a = t.dataset.el, v = t.dataset.v, sec = t.dataset.sec;
    switch (a) {
      case 'cat': ST.ba.cat = v; DEL = null; repaint(); break;
      case 'fg': ST.ba.g = v; repaint(); break;
      case 'fs': ST.ba.s = v; repaint(); break;
      case 'more': if (!ST[sec].loading) { load(sec, true); t.textContent = tt('Show more') + ' ...'; } break;
      case 'retry': ST[sec].sig = null; repaint(); break;
      case 'copy': copyPhoto(v, t); break;
      case 'both': copyBoth(v, t); break;
      case 'seq': seqCopy(v, t); break;
      case 'pick': { var pi = v.indexOf('|'); SEL[v.slice(0, pi)] = v.slice(pi + 1); DEL = null; repaintCase(v.slice(0, pi)); break; }
      case 'min': if (EX.mm) { EX.mm.toggle('lib', mmOf(v)); repaintCase(v); } break;
      case 'mall': if (EX.mm) { EX.mm.all('lib', v === 'min'); repaint(); } break;
      case 'tx': copyTx(v, t); break;
      case 'zoom': zoom(v); break;
      case 'del': delCase(v); break;
      case 'phdel': delPhoto(v); break;
      case 'mon': MS.on = true; MS.ids = {}; DEL = null; repaint(); break;
      case 'moff': MS.on = false; MS.ids = {}; DEL = null; repaint(); break;
      case 'msel': if (MS.ids[v]) delete MS.ids[v]; else MS.ids[v] = 1; DEL = null; repaint(); break;
      case 'mdo': mergeDo(sec); break;
      case 'edit': edStart(v); break;
      case 'acnew': edStart(null, v); break;
      case 'edsave': edSave(); break;
      case 'edno': ED = null; repaint(); break;
      case 'catadd': CE = { mode: 'add' }; repaint(); { var n1 = g('el_catn'); if (n1) n1.focus(); } break;
      case 'catren': CE = { mode: 'ren' }; repaint(); { var n2 = g('el_catn'); if (n2) n2.focus(); } break;
      case 'catno': CE = null; repaint(); break;
      case 'catok': catSave(); break;
      case 'catdel': catDelete(); break;
      case 'imok': IM = null; repaint(); break;
      case 'bksave': bkSave(); break;
    }
  });
  document.addEventListener('change', function (e) {
    var f = e.target; if (!f || !f.matches) return;
    if (f.matches('[data-elimp]')) { var fl = f.files; importFiles(fl); f.value = ''; }
    else if (f.matches('[data-elt]')) { var z = f.getAttribute('data-elt').split('|'); setTag(z[0], z[1], f.value); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && e.target.id === 'el_catn') { e.preventDefault(); catSave(); } });

  window.EL = {
    tops: TOPS, names: NAMES, reset: reset, stay: stay,
    html: function (top) { return '<div class="ep-lib">' + (top === 'ba' ? htmlBA() : top === 'sx' ? htmlSX() : htmlAC()) + '</div>'; },
    state: function () { return { ba: ST.ba, sx: ST.sx, ac: ST.ac }; },
    busy: function () { return !!(IM && IM.state === 'run'); }      /* a photo import is running: the 10-minute lock waits */
  };
})();
