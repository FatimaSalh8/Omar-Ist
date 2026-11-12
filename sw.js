/* Ömar Istanbul by Rima — service worker
   It keeps the app files on the phone/computer so the portal opens fast and also without internet,
   and it tells the page when a newer version has been uploaded ("Update available — tap to refresh").
   The version below changes with every new upload. */
const VERSION = '1.3';
const CACHE = 'oi-' + VERSION;          // the app files of this version
const EXT = 'oi-libs';                  // PDF / Excel libraries and fonts (kept between versions)
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'version.json', 'app.css', 'tailwind.css', 'version.js', 'translations.js', 'treatment-data.js', '01-core.js', 'local-cloud.js', '02-accounts.js', '03-statistics.js', '04-commission.js', '05-navigation.js', '06-records.js', '10-treatment-database.js', '11-plan-calculator.js', '12-package-calculator.js', '13-offers.js', '14-planner.js', '15-languages.js', 'explain-data.js', '17-explain.js', '18-plans.js', '21-library.js', '26-studio.js', '16-start.js', 'backup.js', 'firebase-config.js', 'cloud-sync.js', 'pwa.js', 'logo.png', 'logo-white.png', 'login-bg.jpg', 'fonts/inter-400.woff', 'fonts/inter-500.woff', 'fonts/inter-600.woff', 'fonts/inter-700.woff', 'fonts/poppins-400.woff', 'fonts/poppins-500.woff', 'fonts/poppins-700.woff', 'fonts/lora.woff', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png'
];
const LIBS = /^https:\/\/(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|www\.gstatic\.com\/firebasejs)\//;

self.addEventListener('install', e => {
  /* version 3.5: the new version takes over at once (before, a phone or computer could keep showing an old version until "Update now") */
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))));
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('oi-') && k !== CACHE && k !== EXT).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    /* the version file is always read fresh */
    if (u.pathname.endsWith('/version.json')) {
      e.respondWith(fetch(r, { cache: 'no-store' }).catch(() => caches.match(r)));
      return;
    }
    /* version 3.5: the portal's own files come from the internet first (always the newest version); the copy on the device is used only without internet */
    e.respondWith(
      fetch(r, { cache: 'no-cache' }).then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; }
        return caches.match(r, { ignoreSearch: true }).then(hit => hit || res);      /* the website answered with an error: the saved copy, if there is one */
      }).catch(() => caches.match(r, { ignoreSearch: true }).then(hit => hit || (r.mode === 'navigate' ? caches.match('index.html') : Response.error())))
    );
    return;
  }
  if (LIBS.test(r.url)) {
    /* libraries, Firebase code and fonts: answer from the phone first, refresh in the background */
    e.respondWith(caches.open(EXT).then(async c => {
      const hit = await c.match(r);
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
  /* everything else (the live exchange rates, for example) goes straight to the internet */
});
