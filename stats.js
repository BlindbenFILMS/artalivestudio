/* ─────────────────────────────────────────────────────────────
   ART ALIVE: counting how people enjoy a piece (for its creator's stats page)
   AAStats.log(code, kind)   kind: open, camera, found, capture, share, save, reply
   Keeps only: the kind of device, the local hour, language and time zone. Nothing that identifies anyone.
   Skipped when the browser asks not to be tracked. Needs setup/analytics-setup.sql; until then it quietly does nothing.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const once = new Set();   // open, camera and found count once per visit to a page
  function device() {
    const ua = navigator.userAgent || '', touch = (navigator.maxTouchPoints || 0) > 1, small = Math.min(screen.width, screen.height);
    if (/iPad|Tablet/i.test(ua) || (touch && /Macintosh/.test(ua)) || (touch && small >= 600 && !/Mobi/i.test(ua))) return 'tablet';
    if (/Mobi|iPhone|Android/i.test(ua) || (touch && small < 600)) return 'phone';
    return 'computer';
  }
  function log(code, kind) {
    try {
      if (!code || !/^[a-z0-9]{8}$/.test(code)) return;
      if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
      if (/^(open|camera|found)$/.test(kind)) { const k = code + ':' + kind; if (once.has(k)) return; once.add(k); }
      if (!window.AAAccount || !AAAccount.configured || !AAAccount.load) return;
      let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
      AAAccount.load().then(cl => cl.rpc('log_event', { c: code, k: kind, dev: device(), hr: new Date().getHours(), lg: (navigator.language || '').slice(0, 12), zone: tz.slice(0, 48) }))
        .then(() => {}, () => {});
    } catch (e) {}
  }
  window.AAStats = { log };
})();
