/* Ömar Istanbul by Rima — saved plans and discount requests.
   A consultant saves a plan (found again by the kit number) and asks the administrator for more discount.
   The administrator opens a request, sees the plan with the clinic's local prices (the consultant never sees them),
   and answers Discount Approved / Not Approved; the answer goes back to the consultant (also in Messages). */
(function () {
  'use strict';
  var PL = [], RQ = [], X = null, started = false;
  var ST = { search: '', cons: 'all', rf: 'all', view: null, last: { name: '', kit: '' }, pkk: 'std', fp: {}, dn: {}, edit: null, rm: null };
  var tt = function (k) { var a = Array.prototype.slice.call(arguments); return typeof ti === 'function' ? ti.apply(null, a) : k; };
  var isAdm = function () { return me === 'admin'; };
  var isGst = function () { return typeof GUEST !== 'undefined' && GUEST; };       /* a guest saves plans, but asks for no discount (no discount requests, no chat) */
  var fm = function (sym, n) { return typeof trdFm === 'function' ? trdFm(sym, n) : sym + Math.round(n); };
  var kitFmt = function (k) { k = String(k || '').trim(); return /^kit-/i.test(k) ? k.toUpperCase() : 'KIT-' + k; };
  var kitKey = function (k) { return String(k || '').trim().replace(/^kit-/i, '').toLowerCase().replace(/[^a-z0-9]/g, ''); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function when(ms) {
    if (!ms) return '';
    var d = new Date(ms), n = new Date(), hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (d.toDateString() === n.toDateString()) return tt('Today') + ' ' + hm;
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + (d.getFullYear() !== n.getFullYear() ? '/' + d.getFullYear() : '') + ' ' + hm;
  }
  var PKN = { std: 'Standard Package', pre: 'Premium Package', vip: 'VIP Package' };
  var kindName = function (p) { return p.kind === 'pkg' ? tt(PKN[p.pkk] || 'Package plan') : tt('Treatment plan'); };

  /* ---------- window used by every part of this module ---------- */
  function modal(title, html, wide) {
    var m = document.getElementById('epm');
    if (!m) {
      m = document.createElement('div'); m.id = 'epm'; m.className = 'ep-ov hidden';
      m.innerHTML = '<div class="ep-md" role="dialog" aria-modal="true"><div class="ep-mh"><b class="lux" id="eptt"></b><button type="button" class="ep-x" data-ep="mclose" aria-label="Close">&times;</button></div><div id="epmb"></div></div>';
      document.body.appendChild(m);
    }
    m.querySelector('.ep-md').classList.toggle('ep-wide', !!wide);
    document.getElementById('eptt').textContent = title;
    document.getElementById('epmb').innerHTML = html;
    m.classList.remove('hidden'); document.body.style.overflow = 'hidden';
    var b = document.getElementById('epmb'); if (b) b.scrollTop = 0;
  }
  function mclose() { var m = document.getElementById('epm'); if (m) m.classList.add('hidden'); if (!(document.getElementById('exm') && !document.getElementById('exm').classList.contains('hidden'))) document.body.style.overflow = ''; }

  /* ---------- the numbers of a plan (also for the plan of another consultant: the state is swapped for a moment) ---------- */
  function sumUp(o, pm, r) {
    var rate = o.rate;
    var lines = o.rows.map(function (x, i) {
      var p = trdP(x.c, x.t), b = trdNum(x.t.b);
      var g = pm && pm.u ? pm.u[i] : x.eu, tot = pm && pm.t ? pm.t[i] : x.tot;
      /* the hotel has its own local price too (what a night costs the clinic), so a free or discounted night shows in the local total and in the room */
      var loc = trdRU(((b > 0) ? b : p.l) * rate);
      return { n: x.t.n, q: x.q, list: x.hR, given: g, tot: tot, local: loc, hot: !!x.hot };
    });
    var T = { list: 0, given: 0, local: 0, nl: 0, ng: 0 };
    lines.forEach(function (l) {
      T.list += l.q * l.list; T.given += l.tot; T.local += l.q * l.local;
      T.nl += l.q * l.list; T.ng += l.tot;
    });
    if (r && r.fin && r.fin.tot > 0) T.given = r.fin.tot;
    T.pct = T.nl > 0 ? Math.round((T.nl - T.ng) / T.nl * 1000) / 10 : 0;
    T.room = T.given - T.local;
    /* version 3.6: the payment split of the plan (deposit + visits) and the package flight ticket, for the supervisor price */
    var sp = r ? r.fin.sp : (pm && pm.u ? pm.sp : o.Cs);
    return { lines: lines, T: T, sym: o.sym, cur: o.cur, sp: sp || null, K: r ? (r.K || 0) : 0 };
  }
  function calc(kind, stStr, pkk) {
    var st; try { st = JSON.parse(stStr); } catch (e) { return null; }
    var out = null, keep = TRP, keepP = (typeof PKP !== 'undefined') ? PKP : null;
    try {
      if (kind === 'plan') {
        TRP = trcNorm(st); var o = trcCalc();
        if (o.ok && o.rows.length) out = sumUp(o, o.pc || null, null);
      } else {
        PKP = pkNorm(st); var k = pkk || PKP.sel || 'std', r = pkCalc(k, false);
        if (r.o.ok && r.o.rows.length) out = sumUp(r.o, r.pm || null, r);
      }
    } catch (e) { try { console.error(e); } catch (x) {} }
    finally { TRP = keep; if (kind !== 'plan') PKP = keepP; }
    return out;
  }
  function current(kind) {
    if (kind === 'plan') { if (trcMe !== me || !TRP) trcLoad(); return JSON.stringify(TRP); }
    if (pkMe !== me || !PKP) pkLoad(); return JSON.stringify(PKP);
  }
  var discPct = function (l) { return !(l.list > 0) ? null : Math.round((l.list - l.given) / l.list * 1000) / 10; };
  var pctTxt = function (p) { return p == null ? '<span class="ep-chip">' + esc(tt('none')) + '</span>' : (p > 0 ? '-' : '') + (p <= 0 ? '0' : p) + '%'; };

  /* ---------- what is shown ---------- */
  function lineTable(c, local) {
    var f = function (n) { return fm(c.sym, n); }, T = c.T;
    return '<div class="ep-scroll"><table class="ep-t"><thead><tr><th>' + esc(tt('Treatment')) + '</th><th>' + esc(tt('Qty')) + '</th><th>' + esc(tt('Price before')) + '</th><th>' + esc(tt('Price given')) + '</th><th>' + esc(tt('Discount')) + '</th><th>' + esc(tt('Total')) + '</th>'
      + (local ? '<th>&#128274; ' + esc(tt('Local unit')) + '</th><th>&#128274; ' + esc(tt('Local total')) + '</th><th>' + esc(tt('Room')) + '</th>' : '') + '</tr></thead><tbody>'
      + c.lines.map(function (l) {
        var room = l.q * (l.given - l.local);
        return '<tr><td data-notr style="white-space:normal">' + esc(l.n) + '</td><td>' + l.q + '</td><td data-notr>' + f(l.list) + '</td><td data-notr>' + f(l.given) + '</td><td data-notr>' + pctTxt(discPct(l)) + '</td><td data-notr>' + f(l.tot) + '</td>'
          + (local ? '<td data-notr>' + f(l.local) + '</td><td data-notr>' + f(l.q * l.local) + '</td><td data-notr style="font-weight:800;color:' + (room < 0 ? '#b91c1c' : '#047857') + '">' + f(room) + '</td>' : '') + '</tr>';
      }).join('')
      + '<tr class="ep-tot"><td>' + esc(tt('Total')) + '</td><td></td><td data-notr>' + f(T.list) + '</td><td></td><td data-notr>' + pctTxt(T.pct) + '</td><td data-notr>' + f(T.given) + '</td>'
      + (local ? '<td></td><td data-notr>' + f(T.local) + '</td><td data-notr>' + f(T.room) + '</td>' : '') + '</tr></tbody></table></div>';
  }
  function localView(c) {
    var f = function (n) { return fm(c.sym, n); }, T = c.T, neg = T.room < 0;
    return '<div class="ep-tiles"><div class="ep-tile"><small>' + esc(tt('Consultant’s price')) + '</small><b data-notr>' + f(T.given) + '</b></div><div class="ep-tile"><small>&#128274; ' + esc(tt('Local price (minimum)')) + '</small><b data-notr>' + f(T.local) + '</b></div>'
      + '<div class="ep-tile ' + (neg ? 'ep-neg' : 'ep-pos') + '"><small>' + esc(neg ? tt('Below the local price by') : tt('Room to give')) + '</small><b data-notr>' + f(Math.abs(T.room)) + '</b></div></div>' + lineTable(c, true);
  }
  /* ---------- version 3.6: the supervisor price ----------
     The administrator writes the final total for the patient. The discount is spread over the TREATMENTS only (hotel nights and the
     package flight ticket keep their price): every treatment gives part of its room above the local price, so none goes under its local
     unit price, unless the total itself is under the local total (allowed, with a red warning). The deposit stays, the visits keep the
     same share as in the plan. The consultant sees the new table, the payment plan and a ready message; the plan is locked until the
     consultant removes the supervisor price. */
  function supMin(c) {
    var t = c.K || 0;
    c.lines.forEach(function (l) { t += l.hot ? l.tot : Math.min(l.tot, l.q * l.local); });
    return t;
  }
  function supCalc(c, X) {
    X = Math.round(X);
    var fixed = c.K || 0, G = 0;
    c.lines.forEach(function (l) { if (l.hot) fixed += l.tot; else G += l.tot; });
    var Y = Math.max(0, X - fixed), D = G - Y;
    var R0 = c.lines.map(function (l) {
      var base = l.hot ? l.tot : Math.max(0, Math.min(l.tot, l.q * l.local));
      return { n: l.n, q: l.q, hot: l.hot, local: l.local, u: l.given, t: l.tot, room: l.hot ? 0 : Math.max(0, l.tot - base), base: base };
    });
    var R = R0.reduce(function (a, x) { return a + x.room; }, 0), B = R0.reduce(function (a, x) { return a + (x.hot ? 0 : x.base); }, 0), low = D > R;
    if (D > 0) {
      R0.forEach(function (x) {
        if (x.hot || !(x.q > 0)) return;
        var nt = !low ? (R > 0 ? x.t - D * x.room / R : x.t) : (B > 0 ? x.base - (D - R) * x.base / B : 0);
        x.u = Math.max(0, Math.round(nt / x.q)); x.t = x.q * x.u;
      });
      /* whole prices: the small difference left by the rounding is put on the treatments one unit at a time, the smallest quantities first */
      var diff = Y - R0.reduce(function (a, x) { return a + (x.hot ? 0 : x.t); }, 0), C = R0.filter(function (x) { return !x.hot && x.q > 0; }).sort(function (a, b) { return a.q - b.q; });
      for (var k = 0; k < 2000 && diff; k++) {
        var moved = false;
        for (var j = 0; j < C.length && diff; j++) {
          var x = C[j], sg = diff > 0 ? 1 : -1, nu = x.u + sg;
          if (x.q > Math.abs(diff) || nu < 0 || (sg < 0 && !low && nu < x.local)) continue;
          x.u = nu; x.t = x.q * nu; diff -= sg * x.q; moved = true;
        }
        if (!moved) break;
      }
    }
    var tot = R0.reduce(function (a, x) { return a + x.t; }, 0) + (c.K || 0);
    var sp = c.sp || {}, dep = sp.dep > 0 ? Math.min(sp.dep, tot) : 0, n = sp.n > 0 ? sp.n : 1, pool = tot - dep, v = [];
    if (pool > 0) {
      var old = Array.isArray(sp.v) && sp.v.length === n ? sp.v : null, S0 = old ? old.reduce(function (a, b) { return a + b; }, 0) : 0;
      v = old && S0 > 0 ? old.map(function (a) { return Math.round(pool * a / S0); }) : (function () { var a = []; for (var i = 0; i < n; i++) a.push(Math.round(pool / n)); return a; })();
      v[n - 1] += pool - v.reduce(function (a, b) { return a + b; }, 0);
    }
    var rows = R0.map(function (x) { return { n: x.n, q: x.q, u: x.u, t: x.t, hot: !!x.hot }; });
    var below = R0.some(function (x) { return !x.hot && x.u < x.local; });
    var out = { tot: tot, K: c.K || 0, rows: rows, dep: dep, v: v, below: below, same: D <= 0, sym: c.sym, cur: c.cur };
    out.msg = supMsg(out);
    return out;
  }
  var VIS = ['First Visit', 'Second Visit', 'Third Visit'];
  function supMsg(s) {
    var f = function (n) { return fm(s.sym, n); }, L = ['After Supervisor approval', ''];
    s.rows.forEach(function (x) { L.push(x.n + ' : ' + x.q + ' × ' + f(x.u) + ' = ' + f(x.t)); });
    if (s.K > 0) L.push('Flight ticket : ' + f(s.K));
    L.push('', '*Grand Total = ' + f(s.tot) + '*', '', '✅ Final Plan:', '• Deposit: ' + f(s.dep));
    s.v.forEach(function (a, i) { L.push('• ' + (s.v.length === 1 ? 'Rest of the payment' : VIS[i]) + ': ' + f(a)); });
    return L.join('\n');
  }
  /* the table, the payment plan and the message (the consultant gets a Copy button) */
  function supView(s, rid, locals) {
    var f = function (n) { return fm(s.sym, n); };
    var h = '<div class="ep-scroll"><table class="ep-t"><thead><tr><th>' + esc(tt('Qty')) + '</th><th>' + esc(tt('Treatment')) + '</th><th>' + esc(tt('Unit price')) + '</th><th>' + esc(tt('Total')) + '</th>' + (locals ? '<th>&#128274; ' + esc(tt('Local unit')) + '</th>' : '') + '</tr></thead><tbody>'
      + s.rows.map(function (x, i) {
        var lo = locals ? locals[i] : null, red = lo != null && !x.hot && x.u < lo;
        return '<tr><td>' + x.q + '</td><td data-notr style="white-space:normal;text-align:left">' + esc(x.n) + (x.hot ? ' <span class="ep-chip">' + esc(tt('no discount')) + '</span>' : '') + '</td><td data-notr style="font-weight:800' + (red ? ';color:#b91c1c' : '') + '">' + f(x.u) + '</td><td data-notr>' + f(x.t) + '</td>' + (locals ? '<td data-notr>' + (lo != null ? f(lo) : '') + '</td>' : '') + '</tr>';
      }).join('')
      + (s.K > 0 ? '<tr><td>1</td><td style="text-align:left">' + esc(tt('Flight ticket')) + ' <span class="ep-chip">' + esc(tt('no discount')) + '</span></td><td data-notr>' + f(s.K) + '</td><td data-notr>' + f(s.K) + '</td>' + (locals ? '<td></td>' : '') + '</tr>' : '')
      + '<tr class="ep-tot"><td></td><td style="text-align:left">' + esc(tt('Grand Total')) + '</td><td></td><td data-notr>' + f(s.tot) + '</td>' + (locals ? '<td></td>' : '') + '</tr></tbody></table></div>';
    h += '<div class="ep-tiles"><div class="ep-tile"><small>' + esc(tt('Deposit')) + '</small><b data-notr>' + f(s.dep) + '</b></div>'
      + s.v.map(function (a, i) { return '<div class="ep-tile"><small>' + esc(tt(s.v.length === 1 ? 'Rest of the payment' : VIS[i])) + '</small><b data-notr>' + f(a) + '</b></div>'; }).join('')
      + '<div class="ep-tile ep-pos"><small>' + esc(tt('Total')) + '</small><b data-notr>' + f(s.tot) + '</b></div></div>';
    h += '<pre class="ep-supmsg" data-notr>' + esc(s.msg || supMsg(s)) + '</pre>';
    if (rid) h += '<div class="ep-bar"><button type="button" class="ep-btn ep-gold" data-ep="supcopy" data-v="' + esc(rid) + '">&#128203; ' + esc(tt('Copy message')) + '</button></div>';
    return h;
  }
  function fpPreview(r, c) {
    var v = parseFloat(ST.fp[r.id]); if (!(v > 0)) return '';
    var s = supCalc(c, v), f = function (n) { return fm(c.sym, n); }, mn = supMin(c);
    if (s.same) return '<p class="ep-note">' + esc(tt('{0} is not lower than the consultant’s price ({1}). Nothing will change in the plan.', f(v), f(c.T.given))) + '</p>';
    var h = '<p class="ep-sub" style="margin:6px 0">' + esc(tt('Preview: this is what {0} will see.', String(r.name || '').split(/\s+/)[0])) + '</p>';
    if (s.tot < mn) h += '<p class="ep-note ep-badn"><b>&#9888; ' + esc(tt('Below the local price by {0}', f(mn - s.tot))) + '</b> &mdash; ' + esc(tt('the lowest price without going under the local prices is {0}.', f(mn))) + '</p>';
    if (s.tot !== Math.round(v)) h += '<p class="ep-note">' + esc(tt('Whole prices per unit give {0} (the closest to {1}).', f(s.tot), f(v))) + '</p>';
    return h + supView(s, null, c.lines.map(function (l) { return l.hot ? null : l.local; }));
  }
  /* a plan is locked while it carries the supervisor price of a request that still exists */
  function planOf(r) { return PL.filter(function (x) { return x.id === r.planId; })[0] || null; }
  function locked(r) { var p = planOf(r); return !!(p && p.sup && p.sup.reqId === r.id); }
  function supRemove(rid) {
    var r = RQ.filter(function (x) { return x.id === rid; })[0], p = r && planOf(r); if (!p || !need()) return;
    if (ST.rm !== rid) { ST.rm = rid; rReq(); setTimeout(function () { if (ST.rm === rid) { ST.rm = null; rReq(); } }, 6000); return; }
    ST.rm = null; delete p.sup;
    X.db.collection('plans').doc(p.id).update({ sup: X.fb.firestore.FieldValue.delete() }).catch(function () { toast(tt('Not saved: you have no permission for this change.')); });
    rReq(); toast(tt('Supervisor discount removed. The plan is back in Saved Plans and opens in the calculator.'), 5000);
  }
  var chip = function (s) { return s === 'pending' ? '<span class="ep-chip ep-warn">' + esc(tt('Waiting for the admin')) + '</span>' : s === 'approved' ? '<span class="ep-chip ep-okc">' + esc(tt('Discount Approved')) + '</span>' : '<span class="ep-chip ep-badc">' + esc(tt('Not Approved')) + '</span>'; };

  /* ---------- buttons in the two calculators ---------- */
  function btns(kind) {
    var ed = isAdm() && ST.edit && ST.edit.kind === kind ? '<div class="ep-chip ep-warn" style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px">&#9998; ' + esc(tt('Editing {0}’s plan {1}', ST.edit.name, ST.edit.kit)) + ' <button type="button" class="ep-btn" data-ep="edstop" style="padding:2px 8px">' + esc(tt('Stop')) + '</button></div>' : '';
    return ed + '<div><button type="button" onclick="EP.save(\'' + kind + '\')" class="bg-slate-800 text-white rounded px-3 py-1.5 font-bold uppercase">&#128190; ' + esc(tt('Save plan')) + '</button></div>'
      + (isAdm() || isGst() ? '' : '<div><button type="button" onclick="EP.reqOpen(\'' + kind + '\')" class="g rounded px-3 py-1.5 font-bold uppercase">&#128232; ' + esc(tt('Request more discount')) + '</button></div>');
  }
  function patientBox(name, kit) {
    return '<div class="ep-row"><div class="ep-field"><label>' + esc(tt('Patient name')) + '</label><input type="text" id="ep_pn" value="' + esc(name) + '" autocomplete="off"></div><div class="ep-field"><label>' + esc(tt('Kit number')) + '</label><input type="text" id="ep_pk" value="' + esc(kit) + '" autocomplete="off" placeholder="12111"></div></div>';
  }
  function readPatient() {
    var n = (document.getElementById('ep_pn') || {}).value || '', k = (document.getElementById('ep_pk') || {}).value || '';
    n = n.trim(); k = k.trim();
    if (!n || !k) { toast(tt('Enter the patient name and the kit number first.')); return null; }
    ST.last = { name: n, kit: k }; return { name: n, kit: kitFmt(k) };
  }
  function need() { if (!X) { toast(tt('The shared database is not connected.')); return false; } return true; }

  function savePlan(kind, p, quiet, pkk, as) {
    var st = current(kind), c = calc(kind, st, pkk);
    if (!c) { toast(tt('Enter at least one treatment and choose a currency first.')); return null; }
    var owner = as ? as.owner : X.email;
    var id = owner.replace(/[^a-z0-9]/gi, '_') + '__' + kitKey(p.kit) + '__' + kind;
    var old = PL.filter(function (x) { return x.id === id; })[0];
    var doc = { owner: owner, name: as ? as.name : ME_NAME, kit: p.kit, patient: p.name, kind: kind, pkk: kind === 'pkg' ? (pkk || PKP.sel || 'std') : '', cur: c.cur, tg: c.T.given, tl: c.T.list, pct: c.T.pct, st: st, kb: Math.round(st.length / 1024 * 10) / 10, ms: Date.now(), at: X.fb.firestore.FieldValue.serverTimestamp() };
    if (as) doc.adm = true;                              /* version 3.6: changed by the supervisor */
    var card = kind === 'plan' && window.PCS ? PCS.att() : null;   /* version 4.1: the card from Plan Card Studio is saved with the plan */
    if (card) doc.card = 1;
    var up = X.db.collection('plans').doc(id).set(doc);
    if (card) X.db.collection('cards').doc(id).set({ owner: owner, img: card.img, items: card.items || [], patient: card.patient || '', kit: card.kit || '', by: card.by || '', ms: Date.now() })
      .catch(function () { toast(tt('The plan was saved, but its card photo could not be saved.')); });
    else if (old && old.card) X.db.collection('cards').doc(id).delete().catch(function () {});
    up.catch(function () { toast(tt('Not saved: you have no permission for this change.')); });
    var cp = Object.assign({ id: id }, doc); delete cp.at;
    PL = PL.filter(function (x) { return x.id !== id; }); PL.unshift(cp);
    if (!quiet) toast(as ? tt('Saved in {0}’s plans.', as.name) : tt(old ? 'Plan updated.' : 'Plan saved.') + ' ' + tt('Find it in Saved Plans by the kit number.'));
    badges();
    return cp;
  }
  function save(kind) {
    if (!need()) return;
    var c = calc(kind, current(kind));
    if (!c) { toast(tt('Enter at least one treatment and choose a currency first.')); return; }
    var ed = isAdm() && ST.edit && ST.edit.kind === kind ? ST.edit : null;
    if (ed) { modal(tt('Save plan'), '<p class="ep-note">&#9998; ' + esc(tt('You opened {0}’s plan {1}. "Replace" saves your changes in {0}’s plan: {0} sees your version (and any supervisor price on it is removed).', ed.name, ed.kit)) + '</p>' + patientBox(ed.patient, String(ed.kit).replace(/^kit-/i, ''))
      + '<div class="ep-bar" style="margin-top:12px"><button type="button" class="ep-btn ep-gold" data-ep="dorepl" data-v="' + kind + '">' + esc(tt('Replace {0}’s plan', ed.name)) + '</button><button type="button" class="ep-btn" data-ep="dosave" data-v="' + kind + '">' + esc(tt('Save as my own plan')) + '</button><button type="button" class="ep-btn" data-ep="mclose">' + esc(tt('Cancel')) + '</button></div>'); return; }
    modal(tt('Save plan'), '<p class="ep-sub">' + esc(kind === 'pkg' ? tt('Package plan') : tt('Treatment plan')) + '</p>' + patientBox(ST.last.name, ST.last.kit)
      + '<div class="ep-bar" style="margin-top:12px"><button type="button" class="ep-btn ep-gold" data-ep="dosave" data-v="' + kind + '">' + esc(tt('Save')) + '</button><button type="button" class="ep-btn" data-ep="mclose">' + esc(tt('Cancel')) + '</button></div>');
  }
  function doSave(kind) { var p = readPatient(); if (!p) return; var r = savePlan(kind, p, false); if (r) mclose(); }
  function doRepl(kind) { var ed = ST.edit, p = readPatient(); if (!p || !ed) return; var r = savePlan(kind, p, false, ed.pkk || null, { owner: ed.owner, name: ed.name }); if (r) { ST.edit = null; mclose(); render(); } }

  /* ---------- the consultant asks for more discount ---------- */
  function reqOpen(kind) {
    if (!need()) return;
    var c = calc(kind, current(kind));
    if (!c) { toast(tt('Enter at least one treatment and choose a currency first.')); return; }
    /* version 3.8: a package request can be for one, two or all three packages (one request is sent for each package ticked) */
    var pk = kind === 'pkg' ? '<div class="ep-field"><label>' + esc(tt('Which packages need a discount?')) + '</label><div class="ep-bar" id="ep_pkks">' + ['std', 'pre', 'vip'].map(function (k) { return '<label class="ep-btn" style="cursor:pointer"><input type="checkbox" value="' + k + '"' + (k === (PKP.sel || 'std') ? ' checked' : '') + '> ' + esc(tt(PKN[k])) + '</label>'; }).join('') + '</div></div>' : '';
    modal(tt('Request more discount'), '<p class="ep-sub">' + esc(kind === 'pkg' ? tt('Package plan') : tt('Treatment plan')) + '</p>' + patientBox(ST.last.name, ST.last.kit) + pk
      + '<div id="ep_lt">' + (kind === 'pkg' ? pkgTables() : lineTable(c, false)
      + '<div class="ep-field"><label>' + esc(tt('Price the patient asks for (optional)')) + ' (' + esc(c.cur) + ')</label><input type="number" min="0" id="ep_ask" inputmode="decimal"></div>') + '</div>'
      + '<div class="ep-field"><label>' + esc(tt('Note for the admin (optional)')) + '</label><textarea id="ep_note" rows="3" placeholder="' + esc(tt('Why the patient needs more, what will close the deal...')) + '"></textarea></div>'
      + '<p class="ep-note">' + esc(tt('The admin sees this plan with the clinic’s local prices and answers in your Messages. This plan is saved automatically.')) + '</p>'
      + '<div class="ep-bar"><button type="button" class="ep-btn ep-gold" data-ep="sendreq" data-v="' + kind + '">&#128232; ' + esc(tt('Send request')) + '</button><button type="button" class="ep-btn" data-ep="mclose">' + esc(tt('Cancel')) + '</button></div>', true);
    var box = document.getElementById('ep_pkks');
    if (box) box.onchange = function () { var keep = {}; pkPicked().forEach(function (k) { var i = document.getElementById('ep_ask_' + k); if (i) keep[k] = i.value; }); document.getElementById('ep_lt').innerHTML = pkgTables(keep); };
  }
  function pkPicked() { return Array.prototype.map.call(document.querySelectorAll('#ep_pkks input:checked'), function (i) { return i.value; }); }
  /* the table of every package that is ticked, each with its own "price the patient asks for" */
  function pkgTables(keep) {
    var ks = document.getElementById('ep_pkks') ? pkPicked() : [PKP.sel || 'std'];
    if (!ks.length) return '<p class="ep-note">' + esc(tt('Tick at least one package.')) + '</p>';
    return ks.map(function (k) {
      var cc = calc('pkg', current('pkg'), k);
      return '<h4 class="lux" style="font-weight:700;font-size:14px;margin:10px 0 4px">' + esc(tt(PKN[k])) + '</h4>' + (cc ? lineTable(cc, false) : '<p class="ep-sub">' + esc(tt('This package cannot be shown.')) + '</p>')
        + '<div class="ep-field"><label>' + esc(tt('Price the patient asks for (optional)')) + ' &mdash; ' + esc(tt(PKN[k])) + (cc ? ' (' + esc(cc.cur) + ')' : '') + '</label><input type="number" min="0" id="ep_ask_' + k + '" inputmode="decimal" value="' + esc((keep && keep[k]) || '') + '"></div>';
    }).join('');
  }
  function sendReq(kind) {
    var p = readPatient(); if (!p) return;
    var ks = kind === 'pkg' ? pkPicked() : [''];
    if (!ks.length) { toast(tt('Tick at least one package.')); return; }
    var pl = savePlan(kind, p, true, ks[0] || ''); if (!pl) return;
    var note = ((document.getElementById('ep_note') || {}).value || '').trim(), sent = 0;
    ks.forEach(function (pkk) {
      var c = kind === 'pkg' ? calc(kind, pl.st, pkk) : null;
      if (kind === 'pkg' && !c) return;
      var ask = parseFloat((document.getElementById(kind === 'pkg' ? 'ep_ask_' + pkk : 'ep_ask') || {}).value) || 0;
      var ref = X.db.collection('requests').doc();
      var doc = { owner: X.email, name: me, kit: p.kit, patient: p.name, kind: kind, pkk: pkk, cur: c ? c.cur : pl.cur, planId: pl.id, st: pl.st, tg: c ? c.T.given : pl.tg, tl: c ? c.T.list : pl.tl, pct: c ? c.T.pct : pl.pct, ask: ask, note: note, status: 'pending', dec: '', ms: Date.now(), at: X.fb.firestore.FieldValue.serverTimestamp() };
      ref.set(doc).then(function () {
        if (window.EC && EC.post) EC.post({ thread: X.email, type: 'request', reqId: ref.id });
      }).catch(function () { toast(tt('Not saved: you have no permission for this change.')); });
      var cp = Object.assign({ id: ref.id }, doc); delete cp.at; RQ.unshift(cp); sent++;
    });
    mclose(); badges(); toast(sent > 1 ? tt('{0} requests sent to the admin (one for each package). The answers will arrive in Messages.', sent) : tt('Request sent to the admin. The answer will arrive in Messages.'));
  }

  /* ---------- opening a saved plan again ---------- */
  function openPlan(id, asAdm) {
    var p = PL.filter(function (x) { return x.id === id; })[0] || RQ.filter(function (x) { return x.id === id || x.planId === id; })[0]; if (!p) return;
    /* version 3.6: a plan with a supervisor price does not open in the calculator: it opens its discount request */
    if (!asAdm && p.sup && p.sup.reqId) {
      if (RQ.some(function (x) { return x.id === p.sup.reqId; })) { mclose(); ST.view = p.sup.reqId; tab = 'requests'; render(); window.scrollTo(0, 0); toast(tt('This plan has a supervisor price. To change it in the calculator, press "Remove the supervisor discount" first.'), 5500); return; }
      delete p.sup; if (X) X.db.collection('plans').doc(p.id).update({ sup: X.fb.firestore.FieldValue.delete() }).catch(function () {});     /* its request was deleted: the lock goes with it */
    }
    var st; try { st = JSON.parse(p.st); } catch (e) { return; }
    ST.edit = asAdm && p.owner && p.owner !== (X && X.email) ? { id: p.id, owner: p.owner, name: p.name, kit: p.kit, patient: p.patient, kind: p.kind, pkk: p.pkk || '' } : null;
    ST.last = { name: p.patient || '', kit: p.kit || '' };
    mclose();
    if (p.kind === 'pkg') { PKP = pkNorm(st); pkMe = me; if (p.pkk) PKP.sel = p.pkk; pkSave(); tab = 'pkcalc'; }
    else {
      TRP = trcNorm(st); trcMe = me; trcSave(); tab = 'plancalc';
      var pl = PL.filter(function (x) { return x.id === (p.planId || p.id); })[0] || p;
      if (window.PCS) {
        PCS.setAtt(null);
        if (pl.card && X) X.db.collection('cards').doc(pl.id).get().then(function (d) {
          var o = d && d.exists ? d.data() : null; if (!o || !o.img) return;
          PCS.setAtt({ patient: o.patient, kit: o.kit, items: o.items || [], img: o.img, by: o.by || '', ms: o.ms });
          var h = document.getElementById('trcard'); if (h && tab === 'plancalc') h.innerHTML = PCS.attHTML();
        }).catch(function () { toast(tt('The card photo of this plan could not be loaded.')); });
      }
    }
    render(); window.scrollTo(0, 0); toast(ST.edit ? tt('{0}’s plan is open in your calculator. Press Save plan to replace it.', ST.edit.name) : tt('Plan opened.'));
  }
  function delPlan(btn, id) {
    if (!btn.dataset.a) { btn.dataset.a = 1; btn.textContent = tt('Sure?'); setTimeout(function () { btn.dataset.a = ''; btn.textContent = '🗑'; }, 3000); return; }
    if (!need()) return;
    var gone = PL.filter(function (x) { return x.id === id; })[0];
    PL = PL.filter(function (x) { return x.id !== id; });
    X.db.collection('plans').doc(id).delete().catch(function () {}); paintPlans();
    if (gone && gone.card) X.db.collection('cards').doc(id).delete().catch(function () {});   /* version 4.1: its card goes too */
  }
  function planLocal(id) {
    var p = PL.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var c = calc(p.kind, p.st, p.pkk);
    modal(p.patient + ' · ' + p.kit, '<p class="ep-sub">' + esc(p.name || '') + ' · ' + esc(kindName(p)) + ' · ' + esc(when(p.ms)) + '</p><p class="ep-note">&#128274; ' + esc(tt('Local prices are visible to you only.')) + '</p>' + (c ? localView(c) : '<p class="ep-sub">' + esc(tt('This plan cannot be shown.')) + '</p>'), true);
  }

  /* ---------- the page: Saved Plans ---------- */
  function planRows() {
    var q = ST.search.trim().toLowerCase(), qk = kitKey(ST.search);
    return PL.filter(function (p) {
      if (isAdm() && ST.cons !== 'all' && p.name !== ST.cons) return false;
      if (!q) return true;
      return (qk && kitKey(p.kit).indexOf(qk) >= 0) || String(p.patient || '').toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return (b.ms || 0) - (a.ms || 0); });
  }
  function rPlans() {
    var el = document.getElementById('vpl'), adm = isAdm();
    if (!el.dataset.built || el.dataset.me !== me) {
      el.dataset.built = 1; el.dataset.me = me;
      el.innerHTML = '<div><h2 class="lux font-bold text-lg">' + esc(adm ? tt('All Saved Plans') : tt('Saved Plans')) + '</h2><p class="text-xs text-slate-500">' + esc(adm ? tt('Every plan you saved. Search by kit number or patient name.') : tt(isGst() ? 'Your saved plans. Search by kit number or patient name, or open one.' : 'Your saved plans. Search by kit number or patient name, open one, or send it to the admin as a request.')) + '</p></div>'
        + '<div class="ep-row ' + (adm ? 'ep-r3' : '') + '"><div class="ep-field"><label>' + esc(tt('Search kit number or patient')) + '</label><input type="text" id="ep_ps" value="' + esc(ST.search) + '" placeholder="12111" autocomplete="off"></div>'
        + '' + '<div class="ep-tile" id="ep_pt" style="align-self:end"></div></div><div id="plist"></div>';
      document.getElementById('ep_ps').oninput = function () { ST.search = this.value; paintPlans(); };
      var pc = document.getElementById('ep_pc'); if (pc) pc.onchange = function () { ST.cons = this.value; paintPlans(); };
    }
    paintPlans();
  }
  function paintPlans() {
    var list = document.getElementById('plist'); if (!list || tab !== 'plans') return;
    var adm = isAdm(), L = planRows();
    var pc = document.getElementById('ep_pc');
    if (pc) { var names = {}; PL.forEach(function (p) { names[p.name] = 1; }); var o = '<option value="all">' + esc(tt('All consultants')) + '</option>' + Object.keys(names).sort().map(function (n) { return '<option' + (n === ST.cons ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join(''); if (pc.dataset.sig !== o) { pc.innerHTML = o; pc.dataset.sig = o; pc.value = ST.cons; } }
    var kb = PL.reduce(function (s, p) { return s + (p.kb || 0); }, 0), pt = document.getElementById('ep_pt');
    if (pt) pt.innerHTML = '<small>' + esc(tt('{0} plans saved', PL.length)) + '</small><b>' + kb.toFixed(1) + ' KB</b>';
    if (!L.length) { list.innerHTML = '<p class="ep-sub" style="padding:14px">' + esc(PL.length ? tt('No plan found.') : tt('No saved plans yet. Press Save plan in a calculator.')) + '</p>'; return; }
    list.innerHTML = '<div class="ep-scroll"><table class="ep-t"><thead><tr><th>' + esc(tt('Kit')) + '</th><th>' + esc(tt('Patient')) + '</th>' + '<th>' + esc(tt('Type')) + '</th><th>' + esc(tt('Price to patient')) + '</th><th>' + esc(tt('Discount')) + '</th><th>' + esc(tt('Saved')) + '</th><th></th></tr></thead><tbody>'
      + L.map(function (p) {
        var sym = TRD_SYM[p.cur] || '', lk = !!(p.sup && p.sup.reqId);
        return '<tr><td data-notr><b>' + esc(p.kit) + '</b></td><td data-notr style="white-space:normal">' + esc(p.patient) + (p.adm ? ' <span class="ep-chip">' + esc(tt('Changed by the supervisor')) + '</span>' : '') + (p.card ? ' <span class="ep-chip" title="' + esc(tt('Plan card')) + '">📎</span>' : '') + '</td>' + '<td>' + esc(kindName(p)) + '</td><td data-notr>' + fm(sym, p.tg || 0) + (lk ? '<br><span class="ep-chip ep-okc">&#128274; ' + esc(tt('Supervisor price')) + ' ' + fm(sym, p.sup.tot || 0) + '</span>' : '') + '</td><td data-notr>' + pctTxt(p.pct > 0 ? p.pct : 0) + '</td><td data-notr>' + esc(when(p.ms)) + '</td>'
          + '<td style="white-space:nowrap">' + (adm ? '<button type="button" class="ep-btn ep-gold" data-ep="plocal" data-v="' + esc(p.id) + '">&#128274; ' + esc(tt('Local prices')) + '</button> <button type="button" class="ep-btn" data-ep="aopen" data-v="' + esc(p.id) + '">&#9998; ' + esc(tt('Open in my calculator')) + '</button> ' : '<button type="button" class="ep-btn" data-ep="popen" data-v="' + esc(p.id) + '">' + esc(lk ? tt('Open discount request') : tt('Open')) + '</button> ' + (isGst() || lk ? '' : '<button type="button" class="ep-btn ep-gold" data-ep="preq" data-v="' + esc(p.id) + '">' + esc(tt('Request discount')) + '</button> '))
          + '<button type="button" class="ep-btn" data-ep="pdel" data-v="' + esc(p.id) + '" aria-label="Delete">&#128465;</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  /* request a discount for a plan that is already saved: it is opened in its calculator first, so the numbers are the same */
  function reqFromPlan(id) { var lk = PL.filter(function (x) { return x.id === id; })[0]; if (lk && lk.sup && lk.sup.reqId) { openPlan(id); return; } openPlan(id); setTimeout(function () { var p = PL.filter(function (x) { return x.id === id; })[0]; if (p) reqOpen(p.kind); }, 150); }

  /* ---------- the page: Discount Requests ---------- */
  var pending = function () { return RQ.filter(function (r) { return r.status === 'pending'; }).length; };
  var shownReq = function () { return RQ.filter(function (x) { return ST.rf === 'all' || (ST.rf === 'new' ? x.status === 'pending' : x.status !== 'pending'); }).sort(function (a, b) { return (b.ms || 0) - (a.ms || 0); }); };
  function rReq() {
    var el = document.getElementById('vrq'), adm = isAdm();
    var r = ST.view && RQ.filter(function (x) { return x.id === ST.view; })[0];
    if (!r) ST.view = null;
    var keepNote = document.getElementById('ep_dn'), keepFp = document.getElementById('ep_fp');
    if (r && ((keepNote && document.activeElement === keepNote) || (keepFp && document.activeElement === keepFp))) return;        /* the administrator is writing the answer: nothing is redrawn */
    if (r) { el.innerHTML = '<div class="ep-bar"><button type="button" class="ep-btn" data-ep="rback">&larr; ' + esc(adm ? tt('Discount Requests') : tt('My Discount Requests')) + '</button></div>' + detail(r); return; }
    var L = shownReq();
    el.innerHTML = '<div><h2 class="lux font-bold text-lg">' + esc(adm ? tt('Discount Requests') : tt('My Discount Requests')) + '</h2><p class="text-xs text-slate-500">' + esc(adm ? tt('Tap a request to open its treatment plan with the clinic’s local prices. Only you can see this page.') : tt('Your requests for more discount and the answers of the admin.')) + '</p></div>'
      + '<div class="ep-bar">' + [['all', tt('All')], ['new', tt('New') + ' (' + pending() + ')'], ['done', tt('Answered')]].map(function (f) { return '<button type="button" class="ep-btn ' + (ST.rf === f[0] ? 'ep-gold' : '') + '" data-ep="rfilter" data-v="' + f[0] + '">' + esc(f[1]) + '</button>'; }).join('')
      + (adm && L.length ? '<button type="button" class="ep-btn ' + (ST.rdel === 'all' ? 'ep-bad' : '') + '" data-ep="rdelall">&#128465; ' + esc(ST.rdel === 'all' ? tt('Tap again to delete all shown ({0})', L.length) : tt('Delete all shown ({0})', L.length)) + '</button>' : '') + '</div>'
      + '<div class="ep-list">' + (L.length ? L.map(function (x) {
        var sym = TRD_SYM[x.cur] || '';
        return '<div class="ep-lr" data-ep="rsel" data-v="' + esc(x.id) + '" role="button" tabindex="0"><div style="min-width:0"><b data-notr>' + esc(x.patient) + '</b> <small data-notr>' + esc(x.kit) + '</small><br><small data-notr>' + (adm ? esc(x.name) + ' · ' : '') + esc(kindName(x)) + ' · ' + fm(sym, x.tg || 0) + ' · ' + esc(when(x.ms)) + '</small></div>' + chip(x.status)
          + (adm ? '<button type="button" class="ep-btn ' + (ST.rdel === x.id ? 'ep-bad' : '') + '" data-ep="rdel" data-v="' + esc(x.id) + '" aria-label="' + esc(tt('Delete')) + '">&#128465;' + (ST.rdel === x.id ? ' ' + esc(tt('Tap again to delete')) : '') + '</button>' : '') + '<span class="ep-chip">' + esc(tt('Open')) + ' &rsaquo;</span></div>';
      }).join('') : '<p class="ep-sub">' + esc(tt('No requests here.')) + '</p>') + '</div>';
  }
  function detail(r) {
    var adm = isAdm(), c = calc(r.kind, r.st, r.pkk), first = String(r.name || '').split(/\s+/)[0];
    var h = '<div class="ep-bar" style="justify-content:space-between"><div style="min-width:0"><h2 class="lux" style="font-size:17px;font-weight:700" data-notr>' + esc(r.patient) + ' <span style="font-size:12px;color:#6e7099;font-family:Montserrat">' + esc(r.kit) + '</span></h2><p class="ep-sub" style="margin:0" data-notr>' + esc(r.name) + ' · ' + esc(kindName(r)) + ' · ' + esc(when(r.ms)) + '</p></div>' + chip(r.status) + '</div>';
    var dl = adm ? '<div class="ep-bar" style="margin-top:8px"><button type="button" class="ep-btn ' + (ST.rdel === r.id ? 'ep-bad' : '') + '" data-ep="rdel" data-v="' + esc(r.id) + '">&#128465; ' + esc(ST.rdel === r.id ? tt('Tap again to delete') : tt('Delete this request')) + '</button></div>' : '';
    if (!c) return h + '<p class="ep-sub">' + esc(tt('This plan cannot be shown.')) + '</p>' + dl;
    if (adm) h += '<p class="ep-note">&#128274; <b>' + esc(tt('Local prices are visible to you only.')) + '</b> ' + esc(tt('The consultant never sees these columns.')) + '</p>' + localView(c);
    else h += lineTable(c, false);
    var T = c.T, f = function (n) { return fm(c.sym, n); };
    h += '<p style="margin:10px 0 0;font-size:13px"><b>' + esc(tt('Total discount given')) + ':</b> <span data-notr>' + pctTxt(T.pct) + ' (' + f(T.nl - T.ng) + ' / ' + f(T.nl) + ')</span>';
    if (r.ask > 0) h += '<br><b>' + esc(tt('Patient asks for')) + ':</b> <span data-notr>' + f(r.ask) + '</span>' + (adm ? ' → <span data-notr>' + (r.ask >= T.local ? esc(tt('{0} above the local price', '\u0001')).replace('\u0001', f(r.ask - T.local)) : esc(tt('{0} below the local price', '\u0001')).replace('\u0001', f(T.local - r.ask))) + '</span>' : '');
    h += '</p>';
    if (r.note) h += '<p class="ep-note"><b>' + esc(adm ? tt('{0} wrote', first) : tt('Your note')) + ':</b> <span data-notr>' + esc(r.note) + '</span></p>';
    if (r.status === 'pending') {
      if (adm) {
        var mn = supMin(c);
        h += '<h3 class="lux" style="font-weight:700;font-size:14px;margin-top:6px">' + esc(tt('Final price for the patient')) + '</h3><p class="ep-sub" style="margin:0 0 6px">' + esc(tt('Optional. Write the total you approve; the discount is spread over the treatments (hotel nights and flight ticket keep their price). Leave it empty to keep the plan as it is and only write a message, for example a flight ticket.')) + '</p>'
          + '<div class="ep-bar"><div class="ep-field" style="margin:0;min-width:160px;flex:0 1 220px"><label>' + esc(tt('Total')) + ' (' + esc(c.cur) + ')</label><input type="number" min="0" step="1" id="ep_fp" inputmode="decimal" value="' + esc(ST.fp[r.id] || '') + '" placeholder="' + esc(String(Math.round(T.given))) + '"></div>'
          + '<button type="button" class="ep-btn ep-gold" data-ep="fploc" data-v="' + mn + '">&#128274; ' + esc(tt('Use the local price ({0})', f(mn))) + '</button>' + (ST.fp[r.id] ? '<button type="button" class="ep-btn" data-ep="fpclr">' + esc(tt('Clear')) + '</button>' : '') + '</div><div id="ep_fpv">' + fpPreview(r, c) + '</div>';
        h += '<h3 class="lux" style="font-weight:700;font-size:14px;margin-top:6px">' + esc(tt('Your answer')) + '</h3><div class="ep-field"><label>' + esc(tt('Message to {0} (optional)', first)) + '</label><textarea id="ep_dn" rows="3" placeholder="' + esc(tt('e.g. You can cover a flight ticket up to $500')) + '">' + esc(ST.dn[r.id] || '') + '</textarea></div>'
          + '<div class="ep-bar"><span class="ep-sub" style="margin:0">' + esc(tt('Quick notes')) + ':</span>' + ['You can cover a flight ticket up to $500', 'Offer one extra hotel night', 'Hold this price, no more discount'].map(function (q) { return '<button type="button" class="ep-btn" data-ep="quick" data-v="' + esc(q) + '">' + esc(tt(q)) + '</button>'; }).join('') + '</div>'
          + '<div class="ep-bar" style="margin-top:8px"><button type="button" class="ep-btn ep-yes" data-ep="decide" data-v="approved|' + esc(r.id) + '">&#10003; ' + esc(tt('Discount Approved')) + '</button><button type="button" class="ep-btn ep-bad" data-ep="decide" data-v="declined|' + esc(r.id) + '">&#10005; ' + esc(tt('Not Approved')) + '</button><button type="button" class="ep-btn" data-ep="gochat" data-v="' + esc(r.owner) + '">&#128172; ' + esc(tt('Only reply in chat')) + '</button></div>';
      } else h += '<p class="ep-note">' + esc(tt('Waiting for the admin. The answer arrives in Messages.')) + '</p>';
    } else h += '<p class="ep-note ' + (r.status === 'approved' ? 'ep-okn' : 'ep-badn') + '"><b>' + esc(r.status === 'approved' ? tt('Discount Approved') : tt('Not Approved')) + '</b>' + (r.dec ? ' &mdash; <span data-notr>' + esc(r.dec) + '</span>' : '') + '</p>';
    var lk = locked(r);
    if (r.sup && r.status === 'approved') {
      h += '<h3 class="lux" style="font-weight:700;font-size:15px;margin-top:10px">&#9989; ' + esc(tt('Supervisor approval')) + '</h3>';
      if (!lk) { var pp = planOf(r); h += '<p class="ep-note">' + esc(pp && pp.sup && pp.sup.reqId ? tt('A newer supervisor price (another request for this plan) is now on the plan.') : tt('This supervisor price was removed from the plan.')) + '</p>'; }
      h += supView(r.sup, lk || adm ? r.id : null, null);
      if (!adm && lk) h += '<div class="ep-bar"><button type="button" class="ep-btn ' + (ST.rm === r.id ? 'ep-bad' : '') + '" data-ep="suprm" data-v="' + esc(r.id) + '">' + esc(ST.rm === r.id ? tt('Tap again: remove the supervisor discount') : tt('Remove the supervisor discount')) + '</button></div>';
    }
 h += dl;
    if (!adm) h += lk ? '<p class="ep-note">&#128274; ' + esc(tt('This plan is locked with the supervisor price. To change it in the calculator, remove the supervisor discount first.')) + '</p>'
      : '<div class="ep-bar"><button type="button" class="ep-btn" data-ep="popen" data-v="' + esc(r.planId || r.id) + '">' + esc(tt('Open this plan in the calculator')) + '</button></div>';
    return h;
  }
  /* the administrator deletes a request, or all the requests shown (tap twice); the database allows it only to the administrator */
  var rdt = 0;
  function rdArm(v) { ST.rdel = v; clearTimeout(rdt); rdt = setTimeout(function () { ST.rdel = null; rReq(); }, 6000); rReq(); }
  function delReq(id) {
    if (!need() || !isAdm()) return;
    if (ST.rdel !== id) { rdArm(id); return; }
    ST.rdel = null; clearTimeout(rdt);
    RQ = RQ.filter(function (x) { return x.id !== id; }); if (ST.view === id) ST.view = null;
    X.db.collection('requests').doc(id).delete().catch(function () { toast(tt('Not saved: you have no permission for this change.')); });
    badges(); rReq(); toast(tt('Request deleted.'));
  }
  function delAllReq() {
    if (!need() || !isAdm()) return;
    var L = shownReq(); if (!L.length) return;
    if (ST.rdel !== 'all') { rdArm('all'); return; }
    ST.rdel = null; clearTimeout(rdt);
    var ids = L.map(function (x) { return x.id; }), i = 0;
    RQ = RQ.filter(function (x) { return ids.indexOf(x.id) < 0; });
    (function next() {
      var b = X.db.batch(); ids.slice(i, i + 400).forEach(function (id) { b.delete(X.db.collection('requests').doc(id)); }); i += 400;
      b.commit().then(function () { if (i < ids.length) next(); }).catch(function () { toast(tt('Not saved: you have no permission for this change.')); });
    })();
    badges(); rReq(); toast(tt('{0} requests deleted.', ids.length));
  }
  function decide(status, id) {
    if (!need()) return;
    var r = RQ.filter(function (x) { return x.id === id; })[0]; if (!r || r.status !== 'pending') return;
    var note = ((document.getElementById('ep_dn') || {}).value || '').trim();
    var sup = null, fpv = parseFloat(ST.fp[id]);
    if (status === 'approved' && fpv > 0) { var c = calc(r.kind, r.st, r.pkk); if (c) { var s0 = supCalc(c, fpv); if (!s0.same) sup = s0; } }
    r.status = status; r.dec = note; r.decMs = Date.now();
    var upd = { status: status, dec: note, decMs: r.decMs, decBy: X.email };
    if (sup) { upd.sup = sup; r.sup = sup; }
    X.db.collection('requests').doc(id).update(upd).then(function () {
      if (window.EC && EC.post) EC.post({ thread: r.owner, type: 'decision', reqId: id, status: status, note: note + (sup ? (note ? '\n' : '') + tt('Supervisor price') + ': ' + fm(sup.sym, sup.tot) : '') });
    }).catch(function () { toast(tt('Not saved: you have no permission for this change.')); });
    if (sup && r.planId) {                               /* the plan is locked with this price until the consultant removes it */
      var pl = PL.filter(function (x) { return x.id === r.planId; })[0], ps = Object.assign({ reqId: id }, { tot: sup.tot, sym: sup.sym, cur: sup.cur });
      if (pl) pl.sup = ps;
      X.db.collection('plans').doc(r.planId).update({ sup: ps }).catch(function () { toast(tt('The price was sent, but the plan could not be locked.')); });
    }
    delete ST.fp[id]; delete ST.dn[id];
    badges(); rReq(); toast(tt(status === 'approved' ? 'Approval sent to {0}.' : 'Answer sent to {0}.', String(r.name || '').split(/\s+/)[0]));
  }

  /* ---------- listeners ---------- */
  function badges() { try { if (typeof buildNav === 'function' && me) buildNav(); } catch (e) {} if (window.EPR && EPR.refresh) { /* online box is separate */ } }
  var tmr = 0;
  function changed() {
    clearTimeout(tmr);
    tmr = setTimeout(function () {
      badges();
      try { if (tab === 'plans') paintPlans(); else if (tab === 'requests') rReq(); } catch (e) { try { console.error(e); } catch (x) {} }
    }, 60);
  }
  function enter() {
    if (started) return;
    if (!(window.EOP_CLOUD && EOP_CLOUD.x)) return;
    X = EOP_CLOUD.x(); if (!X) return;
    started = true;
    var adm = X.role === 'admin', db = X.db;
    var qp = adm ? db.collection('plans') : db.collection('plans').where('owner', '==', X.email);
    var err = function (e) { try { console.warn('plans/requests:', e && e.code); } catch (x) {} };
    qp.onSnapshot(function (s) { PL = s.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }).map(function (p) { if (!p.ms && p.at && p.at.toMillis) p.ms = p.at.toMillis(); return p; }); changed(); }, err);
    if (!isGst()) (adm ? db.collection('requests') : db.collection('requests').where('owner', '==', X.email)).onSnapshot(function (s) { RQ = s.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }).map(function (p) { if (!p.ms && p.at && p.at.toMillis) p.ms = p.at.toMillis(); return p; }); changed(); }, err);
  }

  /* ---------- clicks ---------- */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'epm') { mclose(); return; }
    var t = e.target.closest && e.target.closest('[data-ep]'); if (!t) return;
    var a = t.dataset.ep, v = t.dataset.v;
    switch (a) {
      case 'mclose': mclose(); break;
      case 'dosave': doSave(v); break;
      case 'sendreq': sendReq(v); break;
      case 'popen': openPlan(v); break;
      case 'preq': reqFromPlan(v); break;
      case 'pdel': delPlan(t, v); break;
      case 'plocal': planLocal(v); break;
      case 'aopen': openPlan(v, true); break;
      case 'dorepl': doRepl(v); break;
      case 'edstop': ST.edit = null; render(); toast(tt('Stopped. Saving now keeps the plan as your own.')); break;
      case 'fploc': ST.fp[ST.view] = v; rReq(); break;
      case 'fpclr': delete ST.fp[ST.view]; rReq(); break;
      case 'suprm': supRemove(v); break;
      case 'supcopy': { var rq = RQ.filter(function (x) { return x.id === v; })[0], txt = rq && rq.sup ? (rq.sup.msg || supMsg(rq.sup)) : '';
        var done = function (ok) { if (ok) { t.classList.remove('ep-gold'); t.classList.add('ep-ok'); t.textContent = '\u2713 ' + tt('Message copied'); toast(tt('Message copied. Paste it to the patient.')); } else toast(tt('Copy was blocked in this window.')); };
        if (window.EX && EX.copyText) EX.copyText(txt).then(done); else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); });
        break; }
      case 'rfilter': ST.rf = v; ST.rdel = null; rReq(); break;
      case 'rsel': ST.view = v; ST.rdel = null; rReq(); window.scrollTo(0, 0); break;
      case 'rback': ST.view = null; ST.rdel = null; rReq(); break;
      case 'rdel': delReq(v); break;
      case 'rdelall': delAllReq(); break;
      case 'quick': { var n = document.getElementById('ep_dn'); if (n) { n.value = v; n.focus(); } break; }
      case 'decide': { var p = v.split('|'); decide(p[0], p[1]); break; }
      case 'gochat': ST.chatTo = v; if (window.EC) EC.openThread(v); tab = 'chat'; render(); break;
    }
  });
  document.addEventListener('input', function (e) {
    var id = e.target && e.target.id; if (!ST.view || (id !== 'ep_fp' && id !== 'ep_dn')) return;
    if (id === 'ep_dn') { ST.dn[ST.view] = e.target.value; return; }
    ST.fp[ST.view] = e.target.value;
    var r = RQ.filter(function (x) { return x.id === ST.view; })[0], c = r && calc(r.kind, r.st, r.pkk), pv = document.getElementById('ep_fpv');
    if (pv && c) pv.innerHTML = fpPreview(r, c);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var m = document.getElementById('epm'); if (m && !m.classList.contains('hidden')) mclose(); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.dataset && e.target.dataset.ep === 'rsel') { e.preventDefault(); e.target.click(); }
  });

  window.EP = {
    enter: enter, btns: btns, save: save, reqOpen: reqOpen, rPlans: rPlans, rReq: rReq, modal: modal, mclose: mclose,
    pending: pending, req: function (id) { return RQ.filter(function (x) { return x.id === id; })[0] || null; },
    badge: function (k) { return k === 'requests' && isAdm() ? pending() : 0; },
    openReq: function (id) { ST.view = id; tab = 'requests'; render(); window.scrollTo(0, 0); },
    setPatient: function (n, k) { ST.last = { name: n || '', kit: String(k || '').replace(/^kit-/i, '') }; },
    calc: calc, lineTable: lineTable, chip: chip, when: when, plans: function () { return PL; }, requests: function () { return RQ; }
  };
})();
