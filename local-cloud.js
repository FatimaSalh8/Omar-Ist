/* Ömar Istanbul by Rima — the local database.
   The portal has ONE user (Rima, the administrator), so nothing is shared with other people. Everything is kept on this device:
   small settings in the browser storage (localStorage) and the big things (saved cases, photos, saved plans, Follow up Messages
   pictures, the PDF design pictures) in IndexedDB. This file answers the same calls as Firebase Firestore (collection / doc / get /
   set / update / delete / where / onSnapshot / batch), so the modules do not know the difference.
   To share the data between devices later, this file can be replaced by a real Firebase connection without touching the modules.
   Save a backup file now and then (menu: Backup): browsers can erase their data when the phone is almost full. */
(function () {
  'use strict';
  var DBNAME = 'omer-istanbul-portal', STORE = 'docs';
  var idb = null, MEM = Object.create(null), subs = [], loaded = false, waiters = [];
  var DEL = { __op: 'delete' }, TS = { __op: 'ts' };

  var clone = function (o) { try { return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)); } catch (e) { return JSON.parse(JSON.stringify(o)); } };
  var col = function (c) { return MEM[c] || (MEM[c] = new Map()); };
  var uid = function () { return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9); };

  /* ---------- storage ---------- */
  function openDb() {
    return new Promise(function (res) {
      if (!window.indexedDB) return res(null);
      var r;
      try { r = indexedDB.open(DBNAME, 1); } catch (e) { return res(null); }
      r.onupgradeneeded = function () { try { r.result.createObjectStore(STORE, { keyPath: 'k' }); } catch (e) {} };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { res(null); };
      r.onblocked = function () { res(null); };
    });
  }
  function loadAll() {
    return openDb().then(function (db) {
      idb = db;
      if (!db) return;
      return new Promise(function (res) {
        try {
          var q = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
          q.onsuccess = function () { (q.result || []).forEach(function (r) { col(r.c).set(r.id, r.d); }); res(); };
          q.onerror = function () { res(); };
        } catch (e) { res(); }
      });
    }).then(function () {
      loaded = true; waiters.splice(0).forEach(function (f) { f(); });
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    });
  }
  var ready = function () { return loaded ? Promise.resolve() : new Promise(function (r) { waiters.push(r); }); };
  function put(c, id, d) {
    if (!idb) return;
    try { idb.transaction(STORE, 'readwrite').objectStore(STORE).put({ k: c + '/' + id, c: c, id: id, d: d }); } catch (e) {}
  }
  function drop(c, id) {
    if (!idb) return;
    try { idb.transaction(STORE, 'readwrite').objectStore(STORE).delete(c + '/' + id); } catch (e) {}
  }

  /* ---------- snapshots ---------- */
  function snapOf(c, id, d) {
    return { id: id, exists: d !== undefined, ref: docRef(c, id), data: function () { return d === undefined ? undefined : clone(d); } };
  }
  function match(d, f) {
    var v = d[f.field];
    switch (f.op) {
      case '==': return v === f.val;
      case '!=': return v !== f.val;
      case '<': return v < f.val; case '<=': return v <= f.val; case '>': return v > f.val; case '>=': return v >= f.val;
      case 'in': return Array.isArray(f.val) && f.val.indexOf(v) >= 0;
      case 'array-contains': return Array.isArray(v) && v.indexOf(f.val) >= 0;
      default: return true;
    }
  }
  function run(c, q) {
    var out = [];
    col(c).forEach(function (d, id) { if ((q.filters || []).every(function (f) { return match(d, f); })) out.push([id, d]); });
    (q.orders || []).slice().reverse().forEach(function (o) {
      out.sort(function (a, b) { var x = a[1][o.field], y = b[1][o.field]; return (x < y ? -1 : x > y ? 1 : 0) * (o.dir === 'desc' ? -1 : 1); });
    });
    if (q.lim) out = out.slice(0, q.lim);
    var docs = out.map(function (p) { return snapOf(c, p[0], p[1]); });
    return { docs: docs, size: docs.length, empty: !docs.length, forEach: function (f) { docs.forEach(f); } };
  }
  function notify(c) {
    subs.slice().forEach(function (s) {
      if (s.c !== c) return;
      try { s.cb(run(s.c, s.q)); } catch (e) { try { console.warn('local db listener:', e); } catch (z) {} }
    });
  }

  /* ---------- writes ---------- */
  function apply(old, data, merge) {
    var base = merge && old ? clone(old) : {};
    Object.keys(data).forEach(function (k) {
      var v = data[k];
      if (v === DEL) delete base[k];
      else if (v === TS) base[k] = Date.now();
      else base[k] = clone(v);
    });
    return base;
  }
  function setDoc(c, id, data, opts) {
    return ready().then(function () {
      var nd = apply(col(c).get(id), data, !!(opts && opts.merge));
      col(c).set(id, nd); put(c, id, nd); notify(c);
    });
  }
  function updDoc(c, id, data) {
    return ready().then(function () {
      var old = col(c).get(id);
      if (old === undefined) throw new Error('not-found');
      /* "a.b" style field paths are written as a plain key (the modules only use flat fields) */
      var nd = apply(old, data, true);
      col(c).set(id, nd); put(c, id, nd); notify(c);
    });
  }
  function delDoc(c, id) {
    return ready().then(function () { col(c).delete(id); drop(c, id); notify(c); });
  }

  /* ---------- the Firestore-like objects ---------- */
  function docRef(c, id) {
    return {
      id: id, path: c + '/' + id,
      get: function () { return ready().then(function () { return snapOf(c, id, col(c).get(id)); }); },
      set: function (d, o) { return setDoc(c, id, d, o); },
      update: function (d) { return updDoc(c, id, d); },
      delete: function () { return delDoc(c, id); },
      onSnapshot: function (cb) {
        var s = { c: c, q: { filters: [{ field: '__id', op: '==', val: id }] }, cb: null };
        s.cb = function () { cb(snapOf(c, id, col(c).get(id))); };
        subs.push(s); ready().then(function () { s.cb(); });
        return function () { var i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); };
      }
    };
  }
  function query(c, q) {
    var self = {
      where: function (field, op, val) { return query(c, { filters: (q.filters || []).concat([{ field: field, op: op, val: val }]), orders: q.orders, lim: q.lim }); },
      orderBy: function (field, dir) { return query(c, { filters: q.filters, orders: (q.orders || []).concat([{ field: field, dir: dir }]), lim: q.lim }); },
      limit: function (n) { return query(c, { filters: q.filters, orders: q.orders, lim: n }); },
      get: function () { return ready().then(function () { return run(c, q); }); },
      onSnapshot: function (cb, err) {
        var s = { c: c, q: q, cb: cb };
        subs.push(s);
        ready().then(function () { try { cb(run(c, q)); } catch (e) { if (err) err(e); } });
        return function () { var i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); };
      }
    };
    return self;
  }
  function collection(c) {
    var q = query(c, {});
    q.doc = function (id) { return docRef(c, id == null ? uid() : String(id)); };
    q.add = function (d) { var r = docRef(c, uid()); return r.set(d).then(function () { return r; }); };
    return q;
  }
  function batch() {
    var ops = [];
    return {
      set: function (ref, d, o) { ops.push(function () { return ref.set(d, o); }); return this; },
      update: function (ref, d) { ops.push(function () { return ref.update(d); }); return this; },
      delete: function (ref) { ops.push(function () { return ref.delete(); }); return this; },
      commit: function () { return ops.reduce(function (p, f) { return p.then(f); }, Promise.resolve()); }
    };
  }
  var db = { collection: collection, batch: batch };
  var fb = { firestore: { FieldValue: { delete: function () { return DEL; }, serverTimestamp: function () { return TS; } } } };
  var me = { db: db, fb: fb, email: 'rima@omeristanbul.local', role: 'admin', job: 'admin', name: 'Rima', roots: ['rima@omeristanbul.local'] };

  /* ---------- for the backup file ---------- */
  function dump() { var o = {}; Object.keys(MEM).forEach(function (c) { var a = {}; MEM[c].forEach(function (d, id) { a[id] = d; }); if (Object.keys(a).length) o[c] = a; }); return o; }
  function restore(o, replace) {
    return ready().then(function () {
      var jobs = [];
      /* replace = true: what is not in the backup is removed from this device (a deleted case stays deleted) */
      if (replace) Object.keys(MEM).forEach(function (c) {
        Array.from(MEM[c].keys()).forEach(function (id) {
          if (!(o && o[c] && Object.prototype.hasOwnProperty.call(o[c], id))) { MEM[c].delete(id); drop(c, id); }
        });
        jobs.push(c);
      });
      Object.keys(o || {}).forEach(function (c) { Object.keys(o[c]).forEach(function (id) { col(c).set(id, o[c][id]); put(c, id, o[c][id]); }); jobs.push(c); });
      jobs.forEach(notify);
    });
  }

  window.EOP_CLOUD = { x: function () { return me; }, out: function () {}, ready: ready, dump: dump, restore: restore, local: true, logout: function () { location.reload(); } };
  loadAll();
})();
