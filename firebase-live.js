/* Ömar Istanbul by Rima — everything is saved straight into Firebase (the Omer Istanbul project, see firebase-config.js).
   - The sign-in of the opening page IS the Firebase sign-in (one email + password, no second sign-in).
   - Every change (tickets, deposits, pipeline, prices, targets, commission sheets, saved plans, Studio cases, settings) is written
     to Firestore the moment it is saved:  portal/<user id>/kv/<setting>  and  portal/<user id>/db/<collection~id>.
   - Firebase is the shared truth. For every item the device knows what it looked like when the portal was opened (BASE):
       changed in Firebase since then  -> this device takes the Firebase version (a change made on another device);
       changed only on this device     -> it is sent to Firebase.
     So a device with old data never overwrites newer data from another device.
   - The browser only keeps a working copy, so the portal also opens without internet; the changes go up when it is back.
   - The very first time, what this device already holds is sent up, so nothing is lost.
   This file is loaded right after 01-core.js, before the modules, so BASE is what the device held before anything was changed. */
window.OMR_LIVE = !!(window.OI_FIREBASE && OI_FIREBASE.apiKey && OI_FIREBASE.projectId);
window.FL = (function () {
  'use strict';
  var ON = window.OMR_LIVE, CFG = window.OI_FIREBASE || {}, CDN = 'https://www.gstatic.com/firebasejs/10.12.5/';
  var CH = 700000;                                   /* one Firestore record holds at most 1 MB: bigger values are cut in parts */
  var fb = null, auth = null, fs = null, user = null, loadP = null, applying = false, started = false, ready = false, unsub = [];
  var state = 'off';
  /* what is kept per device only (not sent): the sign-in, the backup dates, the last page, the folded menu, the theme and the language */
  var SKIP = /^kc_(auth|bk_|lasttab|fold|theme|lang|font|wasin|liverates)/;   /* liverates: the exchange rates each device fetches itself */
  var synced = function (k) { return /^kc_/.test(k) && !SKIP.test(k); };
  var lsKeys = function () { var a = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (synced(k)) a.push(k); } return a; };
  /* what this device held when the portal was opened */
  var BASE = {}, BASEDB = null;
  try { lsKeys().forEach(function (k) { BASE[k] = localStorage.getItem(k); }); } catch (e) {}

  function js(u) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = u; s.crossOrigin = 'anonymous'; s.onload = ok; s.onerror = function () { no(new Error('load')); }; document.head.appendChild(s); }); }
  function load() {
    if (!ON) return Promise.reject(new Error('off'));
    if (loadP) return loadP;
    loadP = (async function () {
      if (!window.firebase || !firebase.firestore) { await js(CDN + 'firebase-app-compat.js'); await js(CDN + 'firebase-auth-compat.js'); await js(CDN + 'firebase-firestore-compat.js'); }
      fb = window.firebase; if (!fb.apps.length) fb.initializeApp(CFG);
      auth = fb.auth(); fs = fb.firestore();
      try { fs.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) {}
      try { await fs.enablePersistence({ synchronizeTabs: true }); } catch (e) {}   /* offline copy inside Firebase too */
      await new Promise(function (res) { var un = auth.onAuthStateChanged(function (u) { user = u; un(); res(); }); });
    })().catch(function (e) { loadP = null; throw e; });
    return loadP;
  }
  var root = function () { return fs.collection('portal').doc(user.uid); };
  var kv = function () { return root().collection('kv'); };
  var dbc = function () { return root().collection('db'); };
  var dbId = function (c, id) { return encodeURIComponent(c) + '~' + encodeURIComponent(id); };
  var unId = function (rid) { var i = rid.indexOf('~'); return i < 0 ? null : [decodeURIComponent(rid.slice(0, i)), decodeURIComponent(rid.slice(i + 1))]; };

  /* ---------- status (the small cloud next to the name) ---------- */
  function set(s) { state = s; paint(); }
  function paint() {
    var e = document.getElementById('flst'); if (!e) return;
    var T = { off: ['☁', 'Not connected to Firebase'], wait: ['☁ …', 'Connecting to Firebase…'], saving: ['☁ ↑', 'Saving to Firebase…'], ok: ['☁ ✓', 'Everything is saved in Firebase'], offline: ['☁ ⚠', 'No internet: the changes are kept and sent when it is back'], err: ['☁ ✕', 'Firebase could not save: check the internet'] }[state] || ['☁', ''];
    e.textContent = T[0]; e.title = typeof ti == 'function' ? ti(T[1]) : T[1]; e.setAttribute('data-s', state);
  }

  /* ---------- writing (cut into parts when big) ---------- */
  async function writeStr(col, id, str) {
    var old = await col.doc(id).get().catch(function () { return null; }), oldN = old && old.exists ? (old.data().parts || 0) : 0;
    var parts = str.length > CH ? Math.ceil(str.length / CH) : 0, b = fs.batch();
    if (!parts) b.set(col.doc(id), { s: str, parts: 0, at: Date.now() });
    else { b.set(col.doc(id), { s: '', parts: parts, at: Date.now() }); for (var i = 0; i < parts; i++) b.set(col.doc(id + '~p' + i), { s: str.slice(i * CH, (i + 1) * CH), part: true }); }
    for (var j = parts; j < oldN; j++) b.delete(col.doc(id + '~p' + j));
    await b.commit();
  }
  async function delStr(col, id) {
    var old = await col.doc(id).get().catch(function () { return null; }), n = old && old.exists ? (old.data().parts || 0) : 0, b = fs.batch();
    b.delete(col.doc(id)); for (var j = 0; j < n; j++) b.delete(col.doc(id + '~p' + j)); await b.commit();
  }
  function readAll(snap) {
    var main = {}, parts = {};
    snap.forEach(function (d) { var x = d.data(); if (x.part) parts[d.id] = x.s; else main[d.id] = x; });
    var out = {};
    Object.keys(main).forEach(function (id) { var x = main[id]; if (!x.parts) out[id] = x.s; else { var s = ''; for (var i = 0; i < x.parts; i++) s += parts[id + '~p' + i] || ''; out[id] = s; } });
    return out;
  }

  /* ---------- the queue of changes (one write per item, the latest value wins) ---------- */
  var Q = {}, qt = 0, flushing = false;
  function queue(key, job) { Q[key] = job; clearTimeout(qt); qt = setTimeout(flush, 400); }
  async function flush() {
    if (!user || flushing) return;
    var keys = Object.keys(Q); if (!keys.length) return;
    set('saving'); flushing = true;
    var jobs = keys.map(function (k) { return [k, Q[k]]; }); keys.forEach(function (k) { delete Q[k]; });
    try { for (var i = 0; i < jobs.length; i++) { await jobs[i][1](); } set(navigator.onLine === false ? 'offline' : 'ok'); }
    catch (e) { set(navigator.onLine === false ? 'offline' : 'err'); jobs.forEach(function (j) { if (!Q[j[0]]) Q[j[0]] = j[1]; }); setTimeout(flush, 5000); }
    finally { flushing = false; if (Object.keys(Q).length) setTimeout(flush, 300); }
  }
  /* a setting of this device goes up; once it is in Firebase it is the new shared value (BASE) */
  function pushKey(k) {
    queue('kv:' + k, async function () {
      var v = localStorage.getItem(k);
      if (v == null) await delStr(kv(), k); else await writeStr(kv(), k, v);
      if (v == null) delete BASE[k]; else BASE[k] = v;
    });
  }
  function pushDoc(c, id) {
    queue('db:' + c + '/' + id, async function () {
      var cur = localDb(), d = cur[c] && cur[c][id], s = d === undefined ? null : JSON.stringify(d), rid = dbId(c, id);
      if (s == null) await delStr(dbc(), rid); else await writeStr(dbc(), rid, s);
      if (BASEDB) { if (s == null) delete BASEDB[rid]; else BASEDB[rid] = s; }
    });
  }
  window.addEventListener('omr-changed', function (e) {
    if (applying || !ready) return;          /* before the Firebase data has arrived, start() compares everything with BASE */
    var x = e.detail || {};
    if (x.k && synced(x.k)) pushKey(x.k);
    else if (x.c && x.id != null) pushDoc(x.c, x.id);
  });
  window.addEventListener('online', function () { if (user) flush(); });
  window.addEventListener('offline', function () { if (user) set('offline'); });

  /* ---------- comparing this device with Firebase ---------- */
  function localDb() { return window.OMR_CLOUD && OMR_CLOUD.dump ? OMR_CLOUD.dump() : {}; }
  function flatDb(o) { var r = {}; Object.keys(o || {}).forEach(function (c) { Object.keys(o[c]).forEach(function (id) { r[dbId(c, id)] = JSON.stringify(o[c][id]); }); }); return r; }
  /* returns true when something from Firebase was taken (the screens must then be refreshed) */
  /* the first time a device meets Firebase it may hold entries Firebase does not have yet: nothing of it is thrown away */
  var firstKey = function () { return 'fl_first_' + (user && user.uid); };
  var isFirst = function () { try { return localStorage.getItem(firstKey()) !== '1'; } catch (e) { return false; } };
  var markFirst = function () { try { localStorage.setItem(firstKey(), '1'); } catch (e) {} };
  /* two lists of records (tickets, deposits ...): every record of both, the Firebase one when both have the same id */
  function unionById(a, b) {
    try { var A = JSON.parse(a), B = JSON.parse(b); if (!Array.isArray(A) || !Array.isArray(B)) return null;
      if (!A.concat(B).every(function (x) { return x && typeof x === 'object' && x.id != null; })) return null;
      var have = {}; A.forEach(function (x) { have[x.id] = 1; }); var out = A.slice(); B.forEach(function (x) { if (!have[x.id]) out.push(x); });
      return JSON.stringify(out); } catch (e) { return null; }
  }
  async function merge(rls, rdb) {
    var took = false, first = isFirst(); applying = true;
    try {
      /* the settings */
      var all = {}; Object.keys(rls).forEach(function (k) { if (k !== '__meta') all[k] = 1; }); lsKeys().forEach(function (k) { all[k] = 1; }); Object.keys(BASE).forEach(function (k) { all[k] = 1; });
      Object.keys(all).forEach(function (k) {
        var r = k in rls ? rls[k] : null, b = k in BASE ? BASE[k] : null, l = localStorage.getItem(k);
        if (first && l != null && l !== r) {                                   /* first meeting: keep this device's entries too */
          if (r == null) { pushKey(k); return; }
          var u2 = unionById(r, l);
          if (u2 != null && u2 !== r) { try { localStorage.setItem(k, u2); } catch (e) {} BASE[k] = r; pushKey(k); took = true; return; }
        }
        if (r === b) { if (l !== b) pushKey(k); return; }                       /* only this device changed it: send */
        if (l !== r) { try { if (r == null) localStorage.removeItem(k); else localStorage.setItem(k, r); took = true; } catch (e) {} }  /* changed in Firebase: take */
        if (r == null) delete BASE[k]; else BASE[k] = r;
      });
      /* the big things (saved cases, saved plans ...) */
      var L = flatDb(localDb()), dAll = {}, takeDb = false, M = {};
      Object.keys(rdb).forEach(function (k) { dAll[k] = 1; }); Object.keys(L).forEach(function (k) { dAll[k] = 1; }); Object.keys(BASEDB || {}).forEach(function (k) { dAll[k] = 1; });
      Object.keys(dAll).forEach(function (k) {
        var r = k in rdb ? rdb[k] : null, b = BASEDB && k in BASEDB ? BASEDB[k] : null, l = k in L ? L[k] : null, keep = l;
        if (first && r == null && l != null) { var u3 = unId(k); if (u3) pushDoc(u3[0], u3[1]); (M[u3[0]] = M[u3[0]] || {})[u3[1]] = JSON.parse(l); return; }
        if (r === b) { if (l !== b) { var u = unId(k); if (u) pushDoc(u[0], u[1]); } }
        else { keep = r; if (l !== r) takeDb = true; if (BASEDB) { if (r == null) delete BASEDB[k]; else BASEDB[k] = r; } }
        if (keep != null) { var v = unId(k); if (v) { try { (M[v[0]] = M[v[0]] || {})[v[1]] = JSON.parse(keep); } catch (e) {} } }
      });
      if (takeDb && window.OMR_CLOUD && OMR_CLOUD.restore) { await OMR_CLOUD.restore(M, true); took = true; }
    } finally { applying = false; }
    if (first) markFirst();
    return took;
  }

  /* the very first time: everything this device holds goes up */
  async function firstUpload() {
    set('saving');
    var ks = lsKeys();
    for (var i = 0; i < ks.length; i++) { var v = localStorage.getItem(ks[i]); await writeStr(kv(), ks[i], v); BASE[ks[i]] = v; }
    var L = flatDb(localDb());
    for (var k in L) await writeStr(dbc(), k, L[k]);
    BASEDB = L; markFirst();
    await kv().doc('__meta').set({ s: JSON.stringify({ init: Date.now() }), parts: 0, at: Date.now() });
  }
  var busyUI = function () { return !!document.querySelector('form:not(#lgf) input:focus,form:not(#lgf) textarea:focus,form:not(#lgf) select:focus'); };
  var reloadSoon = function () { if (busyUI()) { setTimeout(reloadSoon, 4000); return; } location.reload(); };

  /* ---------- start: after the sign-in (or when the portal opens already signed in) ---------- */
  async function start() {
    if (!ON || started || !user) return; started = true; set('wait');
    try {
      if (window.OMR_CLOUD && OMR_CLOUD.ready) await OMR_CLOUD.ready();
      if (BASEDB === null) BASEDB = flatDb(localDb());
      var meta = await kv().doc('__meta').get();
      if (!meta.exists) await firstUpload();
      else {
        var took = await merge(readAll(await kv().get()), readAll(await dbc().get()));
        if (took) { clearTimeout(qt); await flush(); set('ok'); location.reload(); return; }   /* what this device sends goes up before the reload */
      }
      ready = true; set('ok'); flush();
    } catch (e) { started = false; set(navigator.onLine === false ? 'offline' : 'err'); setTimeout(start, 8000); return; }
    /* changes made on another device arrive by themselves */
    var first = { kv: true, db: true };
    var onSnap = function (which) {
      return function (snap) {
        if (first[which]) { first[which] = false; return; }
        if (snap.metadata && snap.metadata.hasPendingWrites) return;
        recheck();
      };
    };
    unsub.push(kv().onSnapshot(onSnap('kv'), function () {}));
    unsub.push(dbc().onSnapshot(onSnap('db'), function () {}));
  }
  /* a change seen in Firebase: compared only while this device is not sending (its own echo is then equal to BASE: nothing to take) */
  var rt = 0;
  function recheck() {
    clearTimeout(rt);
    if (flushing || Object.keys(Q).length) { rt = setTimeout(recheck, 1500); return; }
    Promise.all([kv().get(), dbc().get()]).then(function (r) {
      if (flushing || Object.keys(Q).length) { rt = setTimeout(recheck, 1500); return false; }
      return merge(readAll(r[0]), readAll(r[1]));
    }).then(function (took) {
      if (took) { try { toast(ti('Updated from another device')); } catch (e) {} clearTimeout(qt); flush().then(function () { setTimeout(reloadSoon, 800); }); }
      else flush();
    }).catch(function () {});
  }

  /* ---------- sign in / out ---------- */
  async function signIn(email, pw) {
    await load();
    try { await auth.setPersistence(fb.auth.Auth.Persistence.LOCAL); } catch (e) {}
    var r = await auth.signInWithEmailAndPassword(email, pw); user = r.user; return user;
  }
  async function current() { try { await load(); } catch (e) { return null; } return user; }
  async function signOut() { try { await flush(); unsub.forEach(function (u) { u(); }); await load(); await auth.signOut(); } catch (e) {} user = null; started = false; ready = false; set('off'); }

  return { on: ON, load: load, signIn: signIn, signOut: signOut, current: current, start: start, flush: flush, state: function () { return state; }, paint: paint };
})();
