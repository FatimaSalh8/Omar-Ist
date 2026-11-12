/* Ömar Istanbul by Rima — phone app helper
   1) shows the version number in the left menu
   2) keeps the app files on the device (service worker, offline support)
   3) when a new version has been uploaded, a message appears in the middle of the page with one button: "Update now"
      (the same as refreshing the page). "Later" closes it and it comes back after 10 minutes. */
(function () {
  var k = document.getElementById('kver');
  if (k && window.EOP_VERSION) k.textContent = 'Version ' + window.EOP_VERSION;
  if (window.claude || !/^https?:$/.test(location.protocol)) return;

  var TXT = {
    en: ['A new version is ready', 'Press the button to update. It takes a second and everything you saved stays.', 'Update now', 'Later', 'Version'],
    fr: ['Une nouvelle version est disponible', 'Appuyez sur le bouton pour mettre à jour. Cela prend une seconde et tout ce que vous avez enregistré reste.', 'Mettre à jour', 'Plus tard', 'Version'],
    ar: ['يتوفر إصدار جديد', 'اضغط على الزر للتحديث. يستغرق ثانية واحدة ويبقى كل ما حفظته.', 'حدّث الآن', 'لاحقاً', 'الإصدار'],
    tr: ['Yeni bir sürüm hazır', 'Güncellemek için düğmeye basın. Bir saniye sürer ve kaydettiğiniz her şey korunur.', 'Şimdi güncelle', 'Daha sonra', 'Sürüm'],
    ru: ['Доступна новая версия', 'Нажмите кнопку, чтобы обновить. Это займёт секунду, всё сохранённое останется.', 'Обновить сейчас', 'Позже', 'Версия'],
    es: ['Hay una nueva versión', 'Pulsa el botón para actualizar. Tarda un segundo y todo lo que guardaste se conserva.', 'Actualizar ahora', 'Más tarde', 'Versión'],
    de: ['Eine neue Version ist bereit', 'Tippen Sie auf die Schaltfläche, um zu aktualisieren. Es dauert eine Sekunde und alles Gespeicherte bleibt erhalten.', 'Jetzt aktualisieren', 'Später', 'Version'],
    ro: ['O versiune nouă este disponibilă', 'Apasă butonul pentru actualizare. Durează o secundă și tot ce ai salvat rămâne.', 'Actualizează acum', 'Mai târziu', 'Versiunea'],
    it: ['È disponibile una nuova versione', 'Premi il pulsante per aggiornare. Basta un secondo e tutto ciò che hai salvato resta.', 'Aggiorna ora', 'Più tardi', 'Versione'],
    pt: ['Há uma nova versão', 'Toque no botão para atualizar. Leva um segundo e tudo o que guardou fica.', 'Atualizar agora', 'Mais tarde', 'Versão']
  };
  var lang = function () { var l = typeof LANG === 'string' ? LANG : 'en'; return TXT[l] ? l : 'en'; };
  var reg = null, reloading = false, newVer = '', hiddenAt = 0, LATER = 10 * 60 * 1000, POLL = 3 * 60 * 1000;

  function paint() {
    var b = document.getElementById('eopUpd'); if (!b) return;
    var t = TXT[lang()];
    b.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    b.querySelector('[data-u=t]').textContent = t[0];
    b.querySelector('[data-u=b]').textContent = t[1];
    b.querySelector('[data-u=v]').textContent = newVer ? t[4] + ' ' + newVer : '';
    b.querySelector('[data-u=go]').textContent = t[2];
    b.querySelector('[data-u=later]').textContent = t[3];
  }
  /* the update itself: the new files are already waiting on this device, so it is one switch and a reload */
  function whenReady(cb) {
    if (reg && reg.waiting) return cb(reg.waiting);
    if (reg && reg.installing) {
      var w = reg.installing;
      w.addEventListener('statechange', function () { if (w.state === 'installed') cb(reg.waiting || w); });
      return;
    }
    if (reg) { reg.update().then(function () { if (reg.waiting) cb(reg.waiting); else if (reg.installing) whenReady(cb); else cb(null); }, function () { cb(null); }); return; }
    cb(null);
  }
  function hard() {
    var done = function () { location.reload(); };
    try { caches.keys().then(function (ks) { return Promise.all(ks.filter(function (x) { return /^eop-\d/.test(x); }).map(function (x) { return caches.delete(x); })); }).then(done, done); } catch (e) { done(); }
  }
  function apply(go) {
    go.disabled = true; go.style.opacity = '.6';
    var fired = false, timer = setTimeout(function () { if (!reloading) { reloading = true; hard(); } }, 9000);
    whenReady(function (w) {
      if (fired) return; fired = true;
      if (w && w.postMessage) w.postMessage('SKIP_WAITING');          /* the page reloads by itself when the new files take over */
      else { clearTimeout(timer); reloading = true; hard(); }
    });
  }
  function popup() {
    var old = document.getElementById('eopUpd');
    if (old) { old.style.display = 'flex'; paint(); return; }
    if (!document.body) return;
    var b = document.createElement('div');
    b.id = 'eopUpd'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-modal', 'true'); b.setAttribute('data-notr', '');
    /* the same look as the "Opening your portal" screen */
    b.style.cssText = 'position:fixed;inset:0;z-index:300;background:#1b2335;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;font-family:Montserrat,system-ui,sans-serif';
    b.innerHTML = '<div style="text-align:center;color:#a08a7c;max-width:360px;width:100%">'
      + '<div class="lux" style="display:inline-block;background:#161a59;color:#a08a7c;font-size:30px;font-weight:700;padding:16px;border-radius:12px;border:1px solid rgba(160,138,124,.45)">EOP</div>'
      + '<p class="lux" style="margin:14px 0 0;font-size:16px;letter-spacing:.1em">EXECUTIVE OPERATIONS PORTAL</p>'
      + '<p data-u="t" style="margin:26px 0 0;font-size:16px;font-weight:700;color:#ffffff"></p>'
      + '<p data-u="b" style="margin:8px 0 0;font-size:12px;line-height:1.55;color:#d8cfc8"></p>'
      + '<p data-u="v" style="margin:10px 0 0;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#a08a7c"></p>'
      + '<button type="button" data-u="go" style="display:block;width:100%;margin:22px 0 0;background:#a08a7c;color:#161a59;border:0;border-radius:10px;padding:14px;font:800 13px Montserrat,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;cursor:pointer"></button>'
      + '<button type="button" data-u="later" aria-label="Later" style="margin-top:10px;background:transparent;color:#9b9cbb;border:0;font:700 11px Montserrat,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;cursor:pointer;padding:6px"></button></div>';
    document.body.appendChild(b);
    b.querySelector('[data-u=go]').onclick = function () { apply(this); };
    b.querySelector('[data-u=later]').onclick = function () {
      b.style.display = 'none';
      setTimeout(function () { if (!reloading) popup(); }, LATER);
    };
    paint();
  }
  /* when the language is changed the message follows */
  if (typeof window.setLang === 'function') {
    var o = window.setLang;
    window.setLang = function () { var r = o.apply(this, arguments); try { paint(); } catch (e) {} return r; };
  }

  /* a second way to notice a new version: the small version file on the website is compared with this page's version */
  function same(a, b) { return String(a) === String(b); }
  function poll() {
    if (!window.EOP_VERSION || typeof fetch !== 'function') return Promise.resolve();
    return fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && j.version && !same(j.version, window.EOP_VERSION)) { newVer = String(j.version); popup(); }
    }).catch(function () {});
  }
  window.EOP_UPD = { check: poll, show: popup };
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { poll(); if (reg) { try { reg.update(); } catch (e) {} } } });
  setInterval(function () { if (!document.hidden) poll(); }, POLL);
  setTimeout(poll, 20000);

  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloading) return; reloading = true; location.reload();
  });
  navigator.serviceWorker.register('sw.js').then(function (r) {
    reg = r;
    var watch = function (w) { w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) { poll().then(popup); } }); };
    if (r.waiting && navigator.serviceWorker.controller) poll().then(popup);
    r.addEventListener('updatefound', function () { if (r.installing) watch(r.installing); });
    var check = function () { try { r.update(); } catch (e) {} };
    setInterval(check, POLL);
  }).catch(function () {});
})();
