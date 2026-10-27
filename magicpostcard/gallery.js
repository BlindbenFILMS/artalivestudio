/* ─────────────────────────────────────────────────────────────
   MAGIC POSTCARD: the example pages (Locations, Events, For Businesses).
   Draws postcards from stock/catalog.json and brings one to life at a time when tapped.
   MPGallery.load() → the templates;  MPGallery.card(template, overrides) → { el, play(), stop() }
   No need to edit this file.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const MP = window.MagicPostcard;
  const vsrc = p => p && /\.mp4$/.test(p) && !document.createElement('video').canPlayType('video/mp4; codecs="avc1.4D401E"') ? p.replace(/\.mp4$/, '.webm') : p;
  const loadImg = src => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
  let cat = null, playing = null, seq = 0;   // seq: only the most recent tap gets to play
  async function load() {
    if (!cat) cat = fetch('stock/catalog.json', { cache: 'no-cache' }).then(r => r.json()).then(c => c.templates.map(t => Object.assign(t, {
      cat: t.category || 'location', src: 'stock/' + (t.image || t.id) + '.jpg', thumb: 'stock/thumbs/' + (t.image || t.id) + '.jpg' })));
    return cat;
  }
  function card(t, o) {
    o = o || {};
    const el = document.createElement('div'); el.className = 'pg-card';
    el.innerHTML = '<canvas class="pg-base" role="img"></canvas><div class="pg-live"></div><canvas class="pg-top" aria-hidden="true"></canvas>';
    const base = el.querySelector('.pg-base'), top = el.querySelector('.pg-top'), live = el.querySelector('.pg-live');
    base.setAttribute('aria-label', 'Magic Postcard: ' + ((o.greetText != null ? o.greetText : t.greetText) || 'Greetings from') + ' ' + (o.place || t.place) + '. ' + (t.blurb || ''));
    let photo = null, anim = null, vid = null, drawn = null;
    const data = () => ({ photo, place: o.place || t.place, greet: true, greetText: o.greetText != null ? o.greetText : (t.greetText || 'Greetings from'), to: o.to || '', accent: o.accent || '#ec9a72', qr: o.qr || 'https://artalivestudio.com/magicpostcard/', icon: o.icon });
    function draw() { if (!drawn) drawn = loadImg(t.src).then(async im => { photo = im; const sc = Math.min(2, (devicePixelRatio || 1) * (o.scale || 1)); await MP.draw(base, 'front', data(), { scale: sc }); await MP.drawTop(top, data(), { scale: sc }); }); return drawn; }
    const api = {
      el, template: t, draw,
      async play() { const my = ++seq; try { await draw(); } catch (e) { return; } if (my !== seq || !el.isConnected) return; if (playing && playing !== api) playing.stop(); playing = api; el.classList.add('on');
        if (t.video) { if (!vid) { vid = document.createElement('video'); Object.assign(vid, { muted: true, loop: true, playsInline: true }); vid.setAttribute('playsinline', ''); vid.src = vsrc(t.video); live.appendChild(vid); } vid.play().catch(() => {}); }
        else if (window.MagicAnimate && t.live) { if (!anim) { anim = MagicAnimate.create(photo, Object.assign({ size: o.size || 512 }, t.live)); live.appendChild(anim.canvas); } anim.start(); }
        el.dispatchEvent(new CustomEvent('pgplay')); },
      stop() { el.classList.remove('on'); if (vid) vid.pause(); if (anim) { anim.destroy(); anim.canvas.remove(); anim = null; } if (playing === api) playing = null; el.dispatchEvent(new CustomEvent('pgstop')); },
      get on() { return el.classList.contains('on'); }
    };
    return api;
  }
  // draw cards only as they scroll into view (a page can hold dozens)
  function lazy(list) { if (!('IntersectionObserver' in window)) { list.forEach(c => c.draw()); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const c = list.find(x => x.el === e.target); if (c) c.draw(); io.unobserve(e.target); } }), { rootMargin: '300px' });
    list.forEach(c => io.observe(c.el)); }
  window.MPGallery = { load, card, lazy, vsrc, stopAll: () => { if (playing) playing.stop(); } };
})();
