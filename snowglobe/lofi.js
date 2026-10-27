/* ─────────────────────────────────────────────────────────────
   ART ALIVE: a little lo-fi tune for the snow globes, made live in the browser (no music files, nothing to license).
   Soft electric-piano chords (Dm9 · G13 · Cmaj9 · Am9), a warm bass, a lazy swung beat and vinyl crackle, at 74 BPM.
   const lofi = AALofi.create(audioContext, destinationNode);
   lofi.start()   lofi.stop(fadeSeconds)   lofi.mute(true|false)   lofi.playing
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const BPM = 74, BEAT = 60 / BPM;
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  // four bars: chord voicings (MIDI), bass root, and a few soft melody notes (beat, note)
  const BARS = [
    { chord: [50, 53, 57, 60, 64], bass: 38, mel: [[1.5, 74], [3, 72]] },
    { chord: [43, 53, 59, 64, 69], bass: 43, mel: [[0.5, 71], [2.5, 74]] },
    { chord: [48, 52, 55, 59, 62], bass: 36, mel: [[1, 76], [2.5, 74], [3.5, 72]] },
    { chord: [45, 55, 59, 60, 64], bass: 45, mel: [[2, 69]] }
  ];
  function create(ac, dest) {
    let out = null, lp = null, crackle = null, crackleG = null, timer = null, nextT = 0, step = 0, playing = false, muted = false, NB = null;
    const noise = () => { if (NB) return NB; NB = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return NB; };
    function chain() {
      out = ac.createGain(); out.gain.value = 0; lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2300; lp.Q.value = .4;
      lp.connect(out); out.connect(dest || ac.destination);
      // vinyl crackle: soft hiss plus little pops
      const cb = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), d = cb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .012 + (Math.random() < .0007 ? (Math.random() - .5) * .7 : 0);
      crackle = ac.createBufferSource(); crackle.buffer = cb; crackle.loop = true; const cf = ac.createBiquadFilter(); cf.type = 'bandpass'; cf.frequency.value = 3200; cf.Q.value = .5;
      crackleG = ac.createGain(); crackleG.gain.value = .35; crackle.connect(cf); cf.connect(crackleG); crackleG.connect(out); crackle.start();
    }
    function ep(m, t, dur, vel) {   // electric piano: sine + soft triangle, with a gentle wobble
      const f = mf(m), g = ac.createGain(), o1 = ac.createOscillator(), o2 = ac.createOscillator(), trem = ac.createOscillator(), tg = ac.createGain();
      o1.type = 'sine'; o1.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 2.001;
      const g2 = ac.createGain(); g2.gain.value = .12; o2.connect(g2); g2.connect(g); o1.connect(g);
      trem.frequency.value = 4.2; tg.gain.value = .18 * vel; trem.connect(tg); tg.connect(g.gain);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + .025); g.gain.exponentialRampToValueAtTime(vel * .35, t + .9); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      g.connect(lp); for (const o of [o1, o2, trem]) { o.start(t); o.stop(t + dur + .05); }
    }
    function bass(m, t, dur) {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = mf(m);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.32, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur + .05);
    }
    function kick(t) {
      const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + .18);
      g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.0001, t + .42); o.connect(g); g.connect(lp); o.start(t); o.stop(t + .45);
    }
    function hiss(t, dur, f, q, v, type) {
      const s = ac.createBufferSource(); s.buffer = noise(); const fl = ac.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
      const g = ac.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(fl); fl.connect(g); g.connect(lp); s.start(t, Math.random()); s.stop(t + dur + .02);
    }
    function schedule(t, i) {   // i counts eighth notes; 8 per bar
      const bar = BARS[Math.floor(i / 8) % 4], e = i % 8, swing = e % 2 ? BEAT * .1 : 0, tt = t + swing;
      if (e === 0) { bar.chord.forEach((m, k) => ep(m, tt + k * .018, BEAT * 3.6, .085)); bass(bar.bass, tt, BEAT * 1.4); }
      if (e === 5) { bar.chord.slice(1).forEach((m, k) => ep(m, tt + k * .014, BEAT * 1.6, .05)); bass(bar.bass + 7, tt, BEAT * .9); }
      if (e === 0 || e === 5) kick(tt);
      if (e === 2 || e === 6) hiss(tt, .16, 1900, .8, .14);                  // snare, brushed
      hiss(tt, .05, 8000, .7, e % 2 ? .035 : .055, 'highpass');                // hats
      for (const [b, m] of bar.mel) if (Math.round(b * 2) === e) ep(m, tt + .01, BEAT * 1.8, .05);
    }
    function tick() {
      while (nextT < ac.currentTime + .25) { schedule(nextT, step); step++; nextT += BEAT / 2; }
    }
    return {
      get playing() { return playing; },
      start() {
        if (playing || !ac) return; if (!out) chain(); if (ac.state === 'suspended') ac.resume();
        playing = true; step = 0; nextT = ac.currentTime + .08;
        out.gain.cancelScheduledValues(ac.currentTime); out.gain.setValueAtTime(out.gain.value, ac.currentTime); out.gain.linearRampToValueAtTime(muted ? 0 : .55, ac.currentTime + 1.2);
        tick(); timer = setInterval(tick, 60);
      },
      stop(fade) {
        if (!playing) return; playing = false; fade = fade == null ? 1.5 : fade;
        const t = ac.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + fade);
        setTimeout(() => { if (!playing) { clearInterval(timer); timer = null; } }, fade * 1000 + 300);
      },
      mute(m) { muted = !!m; if (out) { const t = ac.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(muted || !playing ? 0 : .55, t + .2); } }
    };
  }
  window.AALofi = { create };
})();
