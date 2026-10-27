/* ─────────────────────────────────────────────────────────────
   MAGIC POSTCARD: soundscapes. Each place can have a 16-second sound loop that matches its animation
   (waves, gulls, fireworks…). It plays in step with the picture, loops without a gap, and gets quieter
   while a video message is talking.
   const s = MagicSound.create('stock/sounds/asbury-park.mp3', { getTime: () => video.currentTime });
   MagicSound.unlock()  (call inside a tap, so phones allow sound), s.start(), s.stop(), s.duck(true|false), s.mute(true|false)
   Sound files: 17 seconds = half a second of the loop's end, the 16-second loop, half a second of its start.
   No need to edit this file.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  let ctx = null;
  const ac = () => { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); } return ctx; };
  function unlock() { try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}   // iPhone: play like the videos do, even with the silent switch on
    const c = ac(); if (!c) return; if (c.state === 'suspended') c.resume().catch(() => {});
    try { const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {} }
  const cache = new Map();
  function load(url) { if (!cache.has(url)) cache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error('sound'); return r.arrayBuffer(); })
    .then(b => new Promise((ok, no) => { const c = ac(); if (!c) return no(new Error('no audio')); c.decodeAudioData(b, ok, no); }))); return cache.get(url); }
  function create(url, opts) {
    const o = opts || {}, L = o.length || 16, PAD = .5, VOL = o.volume == null ? .85 : o.volume, getTime = o.getTime || (() => 0);
    let src = null, gain = null, startCtx = 0, startOff = 0, timer = 0, running = false, ducked = false, muted = false, buf = null;
    const level = () => muted ? 0 : ducked ? VOL * .4 : VOL;
    const pos = () => ((startOff + ctx.currentTime - startCtx) % L + L) % L;
    function play(at) {
      const c = ac(); if (!c || !buf) return;
      const old = src, oldGain = gain;
      gain = c.createGain(); gain.gain.setValueAtTime(0, c.currentTime); gain.gain.linearRampToValueAtTime(level(), c.currentTime + .25); gain.connect(c.destination);
      src = c.createBufferSource(); src.buffer = buf; src.loop = true; src.loopStart = PAD; src.loopEnd = PAD + L; src.connect(gain);
      startOff = ((at % L) + L) % L; startCtx = c.currentTime; src.start(0, PAD + startOff);
      if (old) { try { oldGain.gain.cancelScheduledValues(c.currentTime); oldGain.gain.setValueAtTime(oldGain.gain.value, c.currentTime); oldGain.gain.linearRampToValueAtTime(0, c.currentTime + .25); old.stop(c.currentTime + .3); } catch (e) {} }
    }
    // keep in step with the picture: if they drift apart, slide back into place
    function check() { if (!running || !src) return; const want = ((getTime() % L) + L) % L; let d = Math.abs(pos() - want); d = Math.min(d, L - d); if (d > .15) play(want); }
    const api = {
      ready: load(url).then(b => { buf = b; return true; }).catch(() => false),
      start() { running = true; unlock(); api.ready.then(ok => { if (!ok || !running) return; play(getTime()); clearInterval(timer); timer = setInterval(check, 1000); }); },
      stop() { running = false; clearInterval(timer); if (src && ctx) { const s = src, g = gain; try { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + .3); s.stop(ctx.currentTime + .35); } catch (e) {} } src = null; },
      duck(on) { ducked = !!on; if (gain && ctx) gain.gain.setTargetAtTime(level(), ctx.currentTime, .15); },
      mute(on) { muted = !!on; if (gain && ctx) gain.gain.setTargetAtTime(level(), ctx.currentTime, .08); },
      get running() { return running; }, get muted() { return muted; }
    };
    return api;
  }
  window.MagicSound = { create, unlock };
})();
