/* ─────────────────────────────────────────────────────────────
   ART ALIVE: the recorded sounds of the snowman game (snowgame.js) and its page (snowman.html).

   The game already rings clear notes that guide a player (where the next letter is, when to jump, when an icicle is loose);
   those are made by globe.js and are not touched here. These are the sounds that go with them: snow, wood, glass, fire, and a
   little music at the end. They were made by Ben in Runway, then cut, cleaned and levelled (README, "Sounds"). They are kept
   UNDER the guiding notes: nothing here may cover a note a player steers by.

   The files are in snowglobe/sounds/. Nothing is fetched until prepare() is called, and nothing can sound until unlock() is
   called from a tap (a browser lets no page make sound before one). If a file is missing, or the sound is switched off, the
   game plays exactly as it does without this file: every call here is safe to make at any time.

   const sounds = createSounds();
   sounds.prepare()                  begin fetching the files (any time; no sound yet)
   sounds.unlock()                   from a tap: sound is allowed now (and the files are fetched, if they were not already)
   sounds.play('flake', { pan })     one sound, once. pan: −1 left … 1 right. Also: vol (1 = as set below), hz (for a sound with a note: play
                                     it at this pitch), when (seconds from now), from (seconds into it), cut (let it go after this many seconds)
   const fire = sounds.loop('fire')  a sound that goes round. fire.set(level 0 … 1, pan): how much of it just now (call it as often as
                                     you like: it glides); fire.stop(): fade it out and let it go
   const eng = sounds.engine()       the snowmobile's engine. It is not a recording: it is made here, from two low notes that putter.
                                     eng.set(level 0 … 1, how fast it is turning 0 … 1) as often as you like; eng.stop()
   sounds.on = false                 everything here off (or on again). sounds.on reads it back
   sounds.state, sounds.log          (for testing) what is loaded, and the last 300 sounds played
   ───────────────────────────────────────────────────────────── */

// Each sound, and the file or files it is played from (several: one is picked each time, never the same one twice running).
const FILES = {
  flake: ['flake-1', 'flake-2', 'flake-3'],   // a small snowflake caught (about fifty a round)
  big: ['flake-big'],                         // a big snowflake caught
  letter: ['letter'],                         // the letter that is needed, caught
  gift: ['gift'],                             // a gift caught: it bursts open
  piece: ['piece'],                           // an arm, a glove, the scarf or two buttons land in their place on him
  jump: ['jump'], land: ['land'],             // he leaves the snow; he comes down on it
  step: ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'],   // a step in the snow as he walks
  burn: ['burn'],                             // a campfire has caught him
  trip: ['trip'],                             // a branch has tripped him: knock, tumble, plop (the plop comes 0.9 s after the knock, as he comes up)
  icicle: ['icicle'],                         // an icicle breaks on the snow, or on him
  finale: ['finale'],                         // the phrase is finished: the snowflakes spell it across the sky
  zoom: ['zoom'],                             // the view goes into the logo on his hat and out of it (into the game, and back)
  card: ['card'], top: ['top-score'],         // the score card opens; the player is in the first three
  tap: ['tap'],                               // a button pressed
  night: ['night-loop'], fire: ['campfire-loop']   // loops: the winter night under the game; a campfire as it comes and goes
};

// HOW LOUD each sound is played, in dB below full scale, as it will seem on a phone (its loudest tenth of a second; a loop: its
// average). For comparison, the guiding notes run from about −40 (a letter ticking far to one side) to −23 (a letter caught).
// To make one louder or softer, change its figure here: 3 is a small step, 6 a clear one, and 10 sounds about twice as loud (−10: half).
// MASTER moves them all together.
const MASTER = 0;
const LOUD = { flake: -39, big: -35, letter: -29, gift: -29, piece: -32, jump: -33, land: -32, step: -45, burn: -28, trip: -28, icicle: -29,
  finale: -25, zoom: -31, card: -28, top: -26, tap: -38, night: -44, fire: -31, engine: -40 };   // (engine: the snowmobile's, made here: a low purr, well under the notes that say what is coming)
// How loud each file is as it was written (measured the same way, by the script that prepared them): the game needs this to play
// each one at the figure above. A file that is replaced needs its figure measured again.
const AS_WRITTEN = { 'flake-1': -23.8, 'flake-2': -20.5, 'flake-3': -20.9, 'flake-big': -20.4, letter: -20.5, gift: -20.4, piece: -22.8, jump: -20.4, land: -20.3,
  'step-1': -20.4, 'step-2': -20.4, 'step-3': -20.4, 'step-4': -20.4, 'step-5': -20.4, burn: -20.4, trip: -20.5, icicle: -20.4, finale: -20.4, zoom: -20.4,
  card: -20.5, 'top-score': -20.4, tap: -20.5, 'night-loop': -20.4, 'campfire-loop': -22.9 };
const VARY = { flake: .1, big: .04, step: .14, piece: .03 };   // these come often: each time a little louder or softer, a little higher or lower (this much each way), so no two are quite alike
const HZ = { letter: 1171.5 };                                 // the note a file sounds, where it has one (the letter chime: the D two octaves above middle C)
// The loops: [where the loop begins in the file, how long it is] in seconds. Each file holds the loop with 0.3 s of itself before
// and after it, so the join is good wherever a browser puts the very start of the file. (Each loop is a whole number of MP3 frames long.)
const LOOP = { night: [.12, 17.998367], fire: [.12, 7.993469] };
const WIDE = { night: .55 };                                   // played twice at once, half a loop apart, one to each side: wide in headphones, and the join is never bare
const EASE = { night: .5, fire: .09 };                         // how quickly a loop glides to a new level (seconds)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), gain = db => Math.pow(10, db / 20);

export function createSounds({ base = new URL('./sounds/', import.meta.url).href } = {}) {
  const names = Array.from(new Set([].concat(...Object.values(FILES)))), bytes = {}, decoding = {}, bufs = {}, last = {}, log = [], loops = [];
  let AC = null, OUT = null, on = true, loaded = 0;
  const live = () => !!AC && on && AC.state === 'running';

  // the bytes of every file (asked for once); then, when sound is allowed, each one made ready to play
  function prepare() { for (const f of names) if (!bytes[f]) bytes[f] = fetch(base + f + '.mp3').then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null); }
  function ready() { if (!AC) return; prepare();
    for (const f of names) if (!decoding[f]) decoding[f] = bytes[f].then(b => b && new Promise(ok => { try { AC.decodeAudioData(b, ok, () => ok(null)); } catch (e) { ok(null); } }))
      .then(buf => { if (buf) { bufs[f] = buf; loaded++; } }).catch(() => {}); }
  function unlock() {
    try {
      if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; AC = new C(); OUT = AC.createGain(); OUT.gain.value = on ? 1 : 0; OUT.connect(AC.destination); }
      if (AC.state !== 'running' && !document.hidden) { const p = AC.resume(); if (p && p.catch) p.catch(() => {}); }
      ready();
    } catch (e) { AC = null; }
  }
  // how loud to play a file so that it comes out at its sound's figure. (A one-channel file goes through a panner, which gives each
  // side 3 dB less of it when it is in the middle: allowed for here.)
  const level = (name, f, one) => gain(MASTER + LOUD[name] - AS_WRITTEN[f] + (one ? 3 : 0));
  const note = (n, f, v, pan, rate, when) => { log.push({ n, f, t: AC.currentTime + (when || 0), v: Math.round(v * 1000) / 1000, pan: Math.round(pan * 100) / 100, rate: Math.round(rate * 1000) / 1000 }); if (log.length > 300) log.shift(); };

  function play(name, o) {
    o = o || {}; const list = FILES[name]; if (!list || !live()) return false;
    const have = list.filter(f => bufs[f]); if (!have.length) return false;
    let f = have[Math.floor(Math.random() * have.length)]; if (have.length > 1 && f === last[name]) f = have[(have.indexOf(f) + 1) % have.length]; last[name] = f;
    try {
      const buf = bufs[f], one = buf.numberOfChannels === 1, wob = VARY[name] || 0, pan = clamp(+o.pan || 0, -1, 1), panner = (one || pan) && AC.createStereoPanner ? AC.createStereoPanner() : null;
      const v = level(name, f, one && !!panner) * (o.vol == null ? 1 : Math.max(0, +o.vol)) * (1 + (Math.random() * 2 - 1) * wob);
      const rate = clamp((o.hz && HZ[name] ? o.hz / HZ[name] : 1) * (1 + (Math.random() * 2 - 1) * wob * .5), .25, 4), t = AC.currentTime + Math.max(0, +o.when || 0);
      const src = AC.createBufferSource(), g = AC.createGain(); src.buffer = buf; src.playbackRate.value = rate; g.gain.value = v; src.connect(g);
      if (panner) { panner.pan.value = pan; g.connect(panner); panner.connect(OUT); } else g.connect(OUT);
      src.start(t, Math.max(0, +o.from || 0));
      if (o.cut > 0) { g.gain.setValueAtTime(v, t + o.cut); g.gain.linearRampToValueAtTime(0, t + o.cut + .3); src.stop(t + o.cut + .32); }   // let go early: a third of a second's fade
      note(name, f, v, pan, rate, o.when); return true;
    } catch (e) { return false; }
  }

  // A sound that goes round. It starts (silently) the first time it is asked for more than nothing, glides to each level it is
  // given, and is let go by stop().
  function loop(name) {
    const f = FILES[name][0], at = LOOP[name], wide = WIDE[name] || 0, ease = EASE[name] || .1; let nodes = null, want = 0, side = 0, told = [-1, -9];
    function start() {
      if (nodes || !live() || !bufs[f]) return; const buf = bufs[f], n = wide && AC.createStereoPanner ? 2 : 1; nodes = [];
      for (let k = 0; k < n; k++) {
        const src = AC.createBufferSource(), g = AC.createGain(), p = AC.createStereoPanner ? AC.createStereoPanner() : null;
        src.buffer = buf; src.loop = true; src.loopStart = at[0]; src.loopEnd = at[0] + at[1]; g.gain.value = 0; src.connect(g);
        if (p) { p.pan.value = n > 1 ? (k ? wide : -wide) : side; g.connect(p); p.connect(OUT); } else g.connect(OUT);
        src.start(0, at[0] + (Math.random() * .4 + (k ? .5 : 0)) * at[1]); nodes.push({ src, g, p, v: level(name, f, buf.numberOfChannels === 1 && !!p && n === 1) });
      }
      told = [-1, -9]; note(name, f, 0, side, 1);
    }
    const me = {
      get level() { return want; }, get pan() { return side; }, get going() { return !!nodes; },
      set(v, pan) {
        want = clamp(+v || 0, 0, 1); side = clamp(+pan || 0, -1, 1); if (want > 0) start(); if (!nodes || !AC) return;
        if (Math.abs(want - told[0]) < .002 && Math.abs(side - told[1]) < .01) return; told = [want, side];   // (asked for every frame: only a change is passed on)
        try { const t = AC.currentTime; for (const q of nodes) { q.g.gain.setTargetAtTime(q.v * want, t, ease); if (q.p && nodes.length === 1) q.p.pan.setTargetAtTime(side, t, .08); } } catch (e) {}
      },
      stop() {
        want = 0; if (!nodes || !AC) { nodes = null; return; } const t = AC.currentTime, old = nodes; nodes = null;
        try { for (const q of old) { q.g.gain.cancelScheduledValues(t); q.g.gain.setTargetAtTime(0, t, .12); q.src.stop(t + .7); } } catch (e) {}
      }
    };
    loops.push(me); return me;
  }

  // The snowmobile's engine. Two low buzzing notes a fifth apart, their loudness fluttering quickly (the putter of a small engine),
  // with the top taken off. Turning faster, the notes and the putter rise and a little more of the top is let through. Most of it
  // lies below what a phone's loudspeaker plays, so on a phone it is a soft purr; it never covers the notes a player rides by.
  function engine() {
    let n = null, want = 0, rev = 0;
    function start() {
      if (n || !live()) return;
      try { const o1 = AC.createOscillator(), o2 = AC.createOscillator(), g2 = AC.createGain(), am = AC.createGain(), lfo = AC.createOscillator(), depth = AC.createGain(), f = AC.createBiquadFilter(), out = AC.createGain();
        o1.type = 'sawtooth'; o2.type = 'square'; g2.gain.value = .3; am.gain.value = .62; lfo.type = 'sine'; depth.gain.value = .36; f.type = 'lowpass'; f.Q.value = .7; out.gain.value = 0;
        o1.connect(am); o2.connect(g2); g2.connect(am); lfo.connect(depth); depth.connect(am.gain); am.connect(f); f.connect(out); out.connect(OUT);
        o1.start(); o2.start(); lfo.start(); n = { o1, o2, lfo, f, out }; tune(.01); note('engine', 'engine', 0, 0, 1); } catch (e) { n = null; }
    }
    function tune(glide) { const t = AC.currentTime, f0 = 46 + 42 * rev; n.o1.frequency.setTargetAtTime(f0, t, glide); n.o2.frequency.setTargetAtTime(f0 * 1.505, t, glide); n.lfo.frequency.setTargetAtTime(11 + 14 * rev, t, glide);
      n.f.frequency.setTargetAtTime(250 + 430 * rev, t, glide); n.out.gain.setTargetAtTime(gain(MASTER + LOUD.engine) * want, t, .12); }
    const me = {
      get level() { return want; }, get pan() { return 0; }, get going() { return !!n; }, get rev() { return rev; },
      set(v, r) { want = clamp(+v || 0, 0, 1); rev = clamp(+r || 0, 0, 1); if (want > 0) start(); if (n && AC) try { tune(.09); } catch (e) {} },
      stop() { want = 0; if (!n || !AC) { n = null; return; } const t = AC.currentTime, old = n; n = null;
        try { old.out.gain.cancelScheduledValues(t); old.out.gain.setTargetAtTime(0, t, .15); for (const k of ['o1', 'o2', 'lfo']) old[k].stop(t + 1); } catch (e) {} }
    };
    loops.push(me); return me;
  }

  // A page that is put away (another tab, the phone locked) goes quiet, and carries on when it is back. And if the phone itself
  // has stopped the sound (a call, say), the next touch starts it again.
  document.addEventListener('visibilitychange', () => { if (!AC) return; try { const p = document.hidden ? AC.suspend() : AC.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {} });
  addEventListener('pointerdown', () => { if (AC && AC.state !== 'running' && !document.hidden) try { const p = AC.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }, { capture: true, passive: true });

  return {
    prepare, unlock, play, loop, engine,
    get on() { return on; },
    set on(v) { on = !!v; if (AC && OUT) try { OUT.gain.setTargetAtTime(on ? 1 : 0, AC.currentTime, .03); } catch (e) {} if (!on) for (const l of loops) l.stop(); },
    get state() { return { on, unlocked: !!AC, running: !!AC && AC.state === 'running', loaded, files: names.length, asked: Object.keys(bytes).length, loops: loops.map(l => ({ level: l.level, pan: l.pan, going: l.going })) }; },
    log
  };
}
