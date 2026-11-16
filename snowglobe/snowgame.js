/* ─────────────────────────────────────────────────────────────
   ART ALIVE: Build the Snowman. A game of about a minute, played inside the snow globe.

   After a shake, as the snow settles, the view zooms in until the inside of the glass fills the screen. (With a figure that
   has a logo on it, the view zooms into that logo until it fills the screen, then back out of it into the game, and the
   same on the way back to the globe. Otherwise the snow rushes up white in between.)

   The game begins with only the snowman's head, in its hat, sitting on the snow. He sets off walking: the wood moves past
   behind him. He slides left and right, all the way to both sides of the screen, to catch what falls, and jumps over what
   lies in his way:
     · Snowflakes, big and small, build him. First a second ball grows under his head and gets bigger; then a third ball
       grows under that. After that he grows a little bigger all over. As he gets taller the view draws back, so the sky
       above him stays tall.
     · Letters, one at a time and only the ones that are needed, spell the phrase at the top (the next one pulses there).
       A missed letter simply falls again: nobody loses.
     · Gifts turn into the rest of him: an arm, his other arm, his scarf, a glove, his other glove, two coal buttons, two more.
     · Icicles grow along the top of the screen and tremble. One falls for every three letters caught. It is the one that
       wobbles more than the rest: it hangs over the third letter as that letter comes down, and when the letter is caught it
       shakes hard for a moment and drops. If it lands on him it knocks some snow off.
     · Fallen branches lie right across his path, and campfires burn on it (two campfires for every branch). JUMP (the
       button, the space bar or the up arrow, or a second finger anywhere) takes him over them. A branch he does not clear
       trips him: his bottom ball stays behind at the branch, where it slumps into a heap of snow, and the rest of him
       rolls forward along the snow, once over, and comes up a ball shorter. A campfire he does not clear melts him a little:
       and to show why, for a moment the end of his scarf (once he has it), the top of his hat and, only just, the tip of his
       nose burn with that same fire. (How they look is in hazards.js: the fire is the one from 8 GATES, drawn flat.)
     · Rays of sunshine are switched off for now (SUNSHINE, below, brings them back).
   When the last letter is caught he is finished off (any snow, arm, glove, button or scarf still missing arrives), the
   snowflakes swirl together and spell the phrase across the sky, and the view zooms back out to the globe with the snow flying.

   THE SCORE (PTS, below): 10 for a small snowflake, 20 for a big one, 50 for a letter, 100 for a gift, 100 for each branch or
   campfire jumped over, and for speed 10 for every second under two minutes that the phrase took. Nothing takes points away.
   The score is under the phrase all the while he plays (a few words of help come under it), each gain rises from where it
   was earned ("+100"), and the total is shown under the phrase made of snow. play() hands it back when the round is over.

   const game = createGame({ stage, globe, figure, backdrop, scenery, say, sounds });
   const result = await game.play('HAPPY HOLIDAYS', () => { …the moment the globe is back on screen (still hidden in white): shake it, change its name… });
   result: { score, seconds (how long the phrase took), parts: { snow, letters, gifts, jumps, speed } (points), flakes, letters, gifts, jumps (how many) }
   (scenery: the winter night in layers, from winterScenery() in globe3d.js, for the wood that moves past. Without it the
   still backdrop is shown.)

   To play: drag a finger left and right (the figure follows it), hold the left or the right arrow beside JUMP, tilt the
   phone, or use the arrow keys; press JUMP to jump.
   By ear: the letter that is needed rings from its side (left or right); the ring gets quicker as it comes down, and higher
   when the figure is right under it. An icicle that is about to drop ticks fast and glassy from its side: bright while the
   figure is under it, low and soft once he is out. A branch or a campfire knocks low and slow as it comes, then rings twice
   when it is time to jump. Screen readers are told each needed letter and its side, each gift, each icicle, each thing in
   his way, and what happened.
   Recorded sounds (sounds.js, when the page hands them in as `sounds`) go with those notes, each at its moment and each from
   where it happens: a pat for a snowflake, a chime for a letter (at that letter's own note), a rip and a sparkle for a gift, a
   click when a piece of him lands, a whoosh up and a thump down for a jump, his steps in the snow, knock-tumble-plop for a
   branch, a fwoomp and a hiss for a campfire that catches him, a crack and a scatter for an icicle, a warm swell as the phrase
   forms, and a long whoosh through the logo. Two go round: the winter night under the whole game, and a campfire's crackle,
   which grows as the fire comes near, from its side. They are textures, kept under the notes; without them (or with the
   sound off) the game is exactly as it was.

   A figure that cannot be built piece by piece (figure.pieces is not set) is whole from the start and simply grows bigger
   with the snow; no gifts fall for it.
   ───────────────────────────────────────────────────────────── */
import { createHazards } from './hazards.js';   // how the branch, the campfire and a lost snowball look

export const WORDS = ['HAPPY HOLIDAYS'];   // what the snowflakes spell: one of these each round, in turn

const SUNSHINE = false;   // rays of sunshine that melt him: switched off for now (true brings them back, twice in a long phrase)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, p) => a + (b - a) * p;
const easeOut = p => 1 - Math.pow(1 - clamp(p, 0, 1), 3), easeIn = p => Math.pow(clamp(p, 0, 1), 2.4), smooth = (a, b, v) => { const p = clamp((v - a) / (b - a), 0, 1); return p * p * (3 - 2 * p); };
const FONT = 'Archivo, "Arial Black", Arial, sans-serif';
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];   // the catch notes climb, one per letter
const PACE = [1.15, .8, 1, .75, 1.2];                                     // the letters come quick and slow by turns
const NT = 10, NB = 14, NX = 8, FULL = NT + NB, MOST = NT + NB + NX;      // snow (a small flake is 1, a big one 2) to finish his middle ball, then his bottom ball, then to grow a little bigger all over
const KNOCK = 4, MELT = 5;                                                // how much of it an icicle knocks off, and how much a campfire melts (a branch takes his whole bottom ball)
const SINGE = 1.6;                                                        // how long (seconds) the campfire's flames stay on him when it has caught him
const FLAMES = [['scarf', 1, .95, .1, 2], ['hat', 1.1, .9, .14, 2], ['nose', .42, .55, .04, 0]];   // …and where: [the mark on him, how tall its flame (1 = half the width of his head), how wide beside a campfire's, how bright its glow, how many sparks]. The one on his nose is small on purpose.
const GIFTS = ['armR', 'armL', 'scarf', 'gloveR', 'gloveL', 'btnT', 'btnB'];   // what the gifts turn into, in this order (R and L: his own right and left; btnT, btnB: the two buttons on his middle, the two on his bottom ball)
const PARTS = { btnT: ['b1', 'b2'], btnB: ['b3', 'b4'] }, ALL = ['armR', 'armL', 'gloveR', 'gloveL', 'scarf', 'b1', 'b2', 'b3', 'b4'];   // (a gift of buttons is two of them)
const GOT = { armR: ['An arm!', 'The gift was an arm.'], armL: ['His other arm!', 'The gift was his other arm.'], gloveR: ['A glove!', 'The gift was a glove.'], gloveL: ['His other glove!', 'The gift was his other glove.'],
  scarf: ['A scarf!', 'The gift was his scarf.'], b1: ['Two coal buttons!', 'The gift was two coal buttons.'], b3: ['Two more buttons!', 'The gift was two more coal buttons.'] };
const HF = [.52, .42, .33, .345];   // how tall the whole snowman would stand (as a part of the screen): with only his head made, with his middle done, when he is whole, and at his biggest. (The taller he is, the further back the view: the sky above him stays tall.)
const JT = 1.05;                    // a jump, from the snow and back: seconds
const ROLL = .9;                    // tripped by a branch: his tumble forward, seconds
const PTS = { flake: 10, big: 20, letter: 50, gift: 100, jump: 100, second: 10, par: 120 };   // the score: a small snowflake, a big one, a letter, a gift, a thing jumped over; and for speed, 10 for every second under two minutes (par) that the phrase took
const fmt = n => Math.round(n).toLocaleString('en-US');

export function createGame({ stage, globe, figure, backdrop, scenery = null, say = () => {}, cues = true, sounds = null }) {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pieces = !!figure.pieces;   // the figure can be built up piece by piece
  const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:none;touch-action:none;z-index:3';
  document.body.appendChild(cv);
  const x = cv.getContext('2d');
  // The controls: a row of real buttons over the game, at the bottom, in the snow: left · JUMP · right. (The gaps between
  // them let a touch through to the game.)
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:4;display:none;box-sizing:border-box;justify-content:center;align-items:stretch;gap:clamp(8px,2.4vw,14px);height:clamp(48px,8.4vh,64px);padding:0 max(12px,env(safe-area-inset-right,0px)) 0 max(12px,env(safe-area-inset-left,0px));pointer-events:none';
  const GOLD = '#e2b45a', LIT = '#fff0b8', PILL = 'box-sizing:border-box;margin:0;display:flex;align-items:center;justify-content:center;border-radius:999px;border:3px solid #fff;background:' + GOLD + ';color:#1a1206;cursor:pointer;pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;box-shadow:0 8px 22px -8px rgba(0,0,0,.7);transition:background .12s,box-shadow .12s;';
  const control = (label, html, css) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = html; if (label) b.setAttribute('aria-label', label); b.style.cssText = PILL + css; bar.appendChild(b); return b; };
  const arrow = d => `<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false"><path d="${d}" fill="currentColor"/></svg>`;
  const btnL = control('Left', arrow('M17 3.5 5.5 12 17 20.5z'), 'flex:0 0 clamp(54px,17vw,88px);padding:0');
  const btn = control('', 'Jump', 'flex:0 1 300px;min-width:0;padding:0 10px;font:900 clamp(18px,5.4vw,24px)/1 ' + FONT + ';letter-spacing:.16em;text-transform:uppercase');
  const btnR = control('Right', arrow('M7 3.5 18.5 12 7 20.5z'), 'flex:0 0 clamp(54px,17vw,88px);padding:0');
  document.body.appendChild(bar);
  const look = createHazards({ calm });
  // one soft snowflake dot (for the falling snow and for the words made of snow)
  const dotImg = document.createElement('canvas'); dotImg.width = dotImg.height = 32;
  { const g = dotImg.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.45, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }

  let W = 1, H = 1, DPR = 1, PW = 1, PX = 0, groundY = 1, barTop = 1;
  function size() { DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.max(1, Math.round(W * DPR)); cv.height = Math.max(1, Math.round(H * DPR));
    PW = Math.min(W, H * .8); PX = (W - PW) / 2; const r = bar.getBoundingClientRect(); barTop = r.height ? r.top : H;
    groundY = Math.min(H * .84, barTop - (H < 500 ? Math.max(18, H * .05) : Math.max(30, H * .095))); }   // his path: the snow from here down to the buttons (not so deep on a low, wide screen, where the sky is short)
  const moundY = px => groundY + Math.pow((px - W / 2) / (W / 2), 2) * H * .03;

  let G = null, raf = 0, last = 0, lastAsk = 0, lit = false, focusWas = null;   // G: the round being played
  const WARN = calm ? 1.9 : 1.4, BURN = 1.5, FADE = .5;   // a ray of sunshine: it warns, it shines, it goes
  const SHAKE = calm ? 1.9 : 1.3;                          // an icicle: how long it shakes before it drops
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  // The recorded sounds, when the page has them (sounds.js): each is asked for by name at its moment. They go with the notes, under
  // them. Without them, or with the sound off, nothing else changes.
  const fx = (n, o) => { try { return !!sounds && sounds.play(n, o); } catch (e) { return false; } };
  const from = px => clamp((px - W / 2) / (W / 2), -1, 1) * .6, here = () => from(G.sx) * .85;   // where a sound comes from: a place on the screen; where he is
  const chime = k => { const f = SCALE[k % SCALE.length] * 2; return f > 1640 ? f / 2 : f; };      // the letter chime's note: the note of that letter's bell, in the octave where the chime sounds best
  const whoosh = () => fx('zoom', calm ? { from: .5, cut: 1.1 } : null);                            // through the logo (with "reduce motion" on the way through is short: so is the whoosh)
  let night = null, fire = null;                                                                    // the two sounds that go round (ambience(), below)
  const shuffle = a => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
  const glow = on => { if (on === lit) return; lit = on; btn.style.background = on ? LIT : GOLD; btn.style.boxShadow = on ? '0 0 0 6px rgba(255,224,138,.55), 0 8px 22px -8px rgba(0,0,0,.7)' : '0 8px 22px -8px rgba(0,0,0,.7)'; };   // the button lights up when it is time to jump

  /* ── what is on the screen ── */
  // A ray of sunshine (when SUNSHINE is on) comes just after a letter is caught: he is standing still and nothing he needs is
  // falling yet, so there is always time to get away. Never after the first letter or the last, never after a catch that brings
  // an icicle down, and (in a long phrase) not after the catch before that one either, so that the icicle can be seen wobbling
  // over its letter. A short word has one; a longer one has two, a few letters apart.
  function sunTimes(n) { if (!SUNSHINE) return []; if (n <= 3) return [Math.max(1, n - 1)];
    let all = []; for (let k = 2; k < n; k++) if (k % 3 === 1) all.push(k); if (all.length < 2) { all = []; for (let k = 2; k < n; k++) if (k % 3) all.push(k); } shuffle(all);
    const a = all[0], b = all.find(k => Math.abs(k - a) >= 2); return (b == null ? [a] : [a, b]).sort((p, q) => p - q); }
  // The icicles: a row over the part of the screen he can reach (these can fall), and more to the sides of a wide screen
  // (these only hang). Each has its own length, its own speed of growing and its own slow sway.
  function makeIce() { const n = clamp(Math.round(PW / 64), 5, 11), out = [], jig = () => (Math.random() - .5) * .3;
    const one = (u, deco) => ({ u, deco, len: 0, max: .55 + Math.random() * .45, secs: 3.5 + Math.random() * 4, w: .8 + Math.random() * .45, ph: Math.random() * 6.283, f: 1.5 + Math.random() * 1.3, state: 'hang', t: 0, cue: 0, y: 0, vy: 0, rot: 0 });
    for (let k = 0; k < n; k++) out.push(one((k + .5 + jig()) / n, false));
    for (let k = 0, m = Math.floor(PX / (PW / n)); k < m; k++) out.push(one(-(k + .5 + jig()) / n, true), one(1 + (k + .5 + jig()) / n, true));
    return out; }
  function newRound(text) {
    const words = text.split(' '), letters = words.join('').split(''); let lines = words;
    if (words.length > 2) { let best = 1, d = 99; for (let k = 1; k < words.length; k++) { const q = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length); if (q < d) { d = q; best = k; } }   // (more than two words: two rows of about the same length)
      lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]; }
    const amb = [], n = Math.round(clamp(W * H / 5200, 60, 150));
    for (let i = 0; i < n; i++) amb.push({ u: Math.random(), v: Math.random(), s: 1.2 + Math.pow(Math.random(), 2) * 3.4, z: Math.random(), ph: Math.random() * 6.283 });
    return { word: text, lines, letters, i: 0, phase: 'in', pt: 0, t: 0, amb, sparks: [], pops: [], fly: [], big: [], toys: [], letter: null, gift: null, nextAt: 3.3, sparkAt: .25, blankAt: .6, giftAt: 5, cueAt: 0,
      sx: W / 2, tx: W / 2, vx: 0, hf: pieces ? HF[0] : .25, snow: 0, got: {}, snap: true, caught: 0, flakes: 0, gifts: 0, misses: 0, missRow: 0, melts: 0, hits: 0, cheerT: -9, ouchT: -9, meltT: -9,
      walk: 0, going: 0, rush: 0, jy: 0, jv: 0, jumpAsk: -9, jumps: 0, obs: [], obAt: 6.5, obN: 0, trips: 0, burns: 0, cleared: 0, roll: null, singe: null, safeT: -9, heaps: [], trail: [], trailAt: 0, stepAt: 0, steer: null, pad: { l: 0, r: 0 }, padT: 0,
      score: 0, shown: 0, pts: { snow: 0, letters: 0, gifts: 0, jumps: 0, speed: 0 }, gains: [], gainT: -9, doneAt: null, secs: null,
      sunAfter: sunTimes(letters.length), sunDue: 0, sun: null, ice: makeIce(), loose: null, iceAt: 3, iceA: 0, note: null, told: {},
      veil: 0, hud: 1, logo: false, cam: null, e: 0, view: null, geo: null, yaw0: 0, word3: null, rows: null, done: null, keys: { l: 0, r: 0 }, tilt: 0, tilt0: null, touchT: -9, back: null, zoom: null, played: 0 };
  }
  // how much of him the snow has made, and what the gifts have brought (while he is only a head, his arms, gloves and scarf
  // wait: they are back as soon as his middle is)
  const made = () => { const s = G.snow, g = G.got, on = k => (g[k] && s >= 1 ? 1 : 0); return { torso: s < 1 ? 0 : lerp(.42, 1, clamp((s - 1) / (NT - 1), 0, 1)), base: s <= NT ? 0 : lerp(.38, 1, clamp((s - NT - 1) / (NB - 1), 0, 1)),
    armR: on('armR'), armL: on('armL'), gloveR: on('gloveR'), gloveL: on('gloveL'), scarf: on('scarf'), buttons: [on('b1'), on('b2'), on('b3'), on('b4')] }; };
  // (as he gets taller the view draws back, so that the sky above him stays tall)
  const hfGoal = () => { const s = G.snow; return !pieces ? lerp(.22, .34, clamp(s / FULL, 0, 1)) : s <= NT ? lerp(HF[0], HF[1], s / NT) : s <= FULL ? lerp(HF[1], HF[2], (s - NT) / NB) : lerp(HF[2], HF[3], clamp((s - FULL) / NX, 0, 1)); };
  const figH = () => figure.height || 1.2;                    // the whole figure's height in its own picture (the picture is 2 units tall)
  const unit = () => G.hf * H / figH();                       // pixels per unit of that picture
  const feetY = () => groundY + H * .012 - G.jy;              // where its feet are on the screen (just under the top of the snow; higher in a jump)
  const body = () => (pieces && figure.shape) || null;        // where its parts are just now (a figure built piece by piece)
  const headY = () => { const b = body(); return b ? feetY() - b.top * unit() : groundY - G.jy - G.hf * H; };       // the top of its hat
  const reach = () => { const b = body(); return Math.max(24, (b ? b.half : figure.reach || .3) * unit()); };       // how far it spreads to each side (its arms, once it has one)
  const wide = () => { const b = body(); return Math.max(20, (b ? b.body : (figure.reach || .3) * .6) * unit()); }; // …and without its arms: its widest ball
  const grab = () => { const b = body(); return Math.max(22, reach() * (b && !b.arms ? .9 : .6)); };                // how near a flake must be to be caught
  const catchTo = top => { const b = body(); return b ? Math.max(feetY() - (b.balls[1][1] - b.balls[1][2] * .35) * unit(), top + b.top * unit() * .5) : top + G.hf * H * .5; };   // …and how far down: to the middle of his face, or half of him
  const foot = () => { const b = body(); let r = 0; if (b) for (const B of b.balls) if (B[2] > .001) r = B[2]; return clamp((b ? r : (figure.reach || .3) * .5) * unit() * .36, 14, 26); };   // half the width of what he stands on (his lowest ball, where it meets the snow)
  const edge = () => Math.min(wide(), PW * .3);               // how near the sides of the screen its middle can come: all the way, until its body touches the side
  const need = () => G.letters[G.i] || '';
  const note = (txt, dur) => { G.note = { txt, t0: G.t, dur: dur || 1.8 }; };
  // points: added to the score, and a small "+100" rises from where they were earned
  const gain = (n, kind, px, py, tag) => { if (!(n > 0)) return; G.score += n; G.pts[kind] += n; G.gainT = G.t; const near = G.gains.filter(q => q.t < .4 && Math.abs(q.x - px) < 70).length; G.gains.push({ n, tag: tag || '', x: px, y: py - near * 24, t: 0 }); if (G.gains.length > 16) G.gains.shift(); };   // (several at once: one above another)
  const side = px => (Math.abs(px - G.sx) < grab() ? 'right above you' : px < G.sx ? 'on your left' : 'on your right');
  const iceH = () => clamp(H * .105, 54, 112), iceX = c => PX + c.u * PW, iceLen = c => c.len * c.max * iceH();   // the longest an icicle gets; where one hangs; how long it is now
  const iceBusy = () => G.ice.some(c => c.state === 'shake' || c.state === 'fall');
  const kS = () => clamp(PW / 393, .85, 1.45) * 1.25;         // how big the things on the ground are drawn
  const pace = () => clamp(PW * .34, 120, 210);               // how fast the ground goes by as he walks: pixels a second
  const speed = () => pace() * G.going * (1 + G.rush);        // …just now (he sets off, he stops; it rushes by as he tumbles)
  const restY = px => moundY(px) + 6 * kS();                  // where a thing on the ground rests on the snow: on the line he walks along
  const peak = () => clamp(H * .16, 96, 170);                 // how high a jump goes: pixels

  // a column clear of the other big things that are still high up, so two never fall on top of each other
  const clearOf = (c, r) => !G.big.some(f => f.y < H * .5 && Math.abs(f.bx - c) < (f.r + r) * 1.12);
  function freeX(r) { const lo = PX + r + 8, hi = PX + PW - r - 8, S = G.sun; for (let k = 0; k < 12; k++) { const c = lo + Math.random() * (hi - lo); if (clearOf(c, r) && !(S && Math.abs(c - S.x) < S.w / 2 + r * .4)) return c; } return null; }
  const flake = (kind, ch, c, r, secs) => ({ kind, ch, x: c, bx: c, y: -r * 1.4, r, vy: (headY() + G.jy + r * 1.4) / secs, rot: Math.random() * 6, spin: (Math.random() < .5 ? -1 : 1) * (.3 + Math.random() * .5), ph: Math.random() * 6 });   // (it reaches the top of his hat, as he stands, in that many seconds)

  // The icicle nearest to px begins to wobble: it is the next one to fall. (Only one that hangs over where he can stand.)
  function loosen(px) {
    const room = grab() * .6, over = c => iceX(c) > PX + edge() - room && iceX(c) < PX + PW - edge() + room; let best = null;
    for (const pass of [over, () => true]) { for (const c of G.ice) if (!c.deco && c.state !== 'fall' && c.state !== 'shake' && pass(c) && (!best || Math.abs(iceX(c) - px) < Math.abs(iceX(best) - px))) best = c; if (best) break; }
    if (G.loose && G.loose !== best && G.loose.state === 'loose') G.loose.state = 'hang';
    if (best) { best.state = 'loose'; best.t = 0; best.len *= best.max; best.max = 1; best.secs = 1.3; } G.loose = best; return best;   // (it is also the longest: from the length it has, it grows to full length now)
  }
  function spawnLetter() {   // the next letter of the phrase: never right over the figure, so there is somewhere to go
    const ch = need(), r = clamp(PW * .088, 30, 46), easy = G.missRow >= 2, lo = PX + r + 8, hi = PX + PW - r - 8, S = G.sun;
    let lx = null, c = G.sx;
    if (S) {   // there is a ray of sunshine: the letter comes down beside it (never inside it), on the figure's side if there is room there
      const z = S.w / 2 + r * .7, L = [lo, Math.min(hi, S.x - z)], R = [Math.max(lo, S.x + z), hi], span = a => a[1] - a[0];
      let a = G.sx < S.x ? L : R; if (span(a) < r * .6) a = a === L ? R : L; if (span(a) < 0) a = [lo, hi];
      for (let k = 0; k < 12 && lx == null; k++) { c = a[0] + Math.random() * span(a); if (clearOf(c, r)) lx = c; }
    } else for (let k = 0; k < 12 && lx == null; k++) { const far = easy ? .12 : .2 + Math.random() * .2; c = G.sx + (Math.random() < .5 ? -1 : 1) * far * PW; if (c < lo || c > hi) c = G.sx - (c - G.sx); c = clamp(c, lo, hi); if (clearOf(c, r)) lx = c; }
    if (lx == null) lx = c;
    // the third letter of every three comes down under an icicle, which begins to wobble: it will fall when this letter is caught
    let ice = null; if (G.i === G.iceAt - 1 && G.iceAt < G.letters.length) { ice = loosen(lx); const ix = ice ? clamp(iceX(ice), lo, hi) : lx; if (!S || Math.abs(ix - S.x) >= S.w / 2 + r * .7) lx = ix; }
    const base = (calm ? 4.2 : 3.4) + (5 - Math.min(5, G.letters.length)) * .5;   // (a short word's letters fall a little slower)
    const secs = Math.max(2.3, base * (easy ? 1.15 : PACE[G.i % PACE.length])) + (easy ? .8 : 0);
    G.letter = flake('need', ch, lx, r, secs); G.big.push(G.letter);
    if (!G.told.letter) { G.told.letter = 1; note('Catch the letters to spell!', 3); }
    else if (ice && !G.told.ice) { G.told.ice = 1; note(calm ? 'That icicle is loose!' : 'That icicle is wobbling!', 2.6); }   // (with "reduce motion" on it does not wobble: it glows)
    say(ch + ', ' + side(lx) + (ice ? ', under a loose icicle.' : '.'));
  }
  function spawnBlank() {   // a big snowflake with no letter (the very first one comes down close to him, to show what snow is for)
    const r = clamp(PW * .07, 22, 36), first = !G.told.blank; let c = first ? clamp(G.sx + (Math.random() < .5 ? -1 : 1) * Math.min(PW * .17, grab() * .85), PX + r + 8, PX + PW - r - 8) : freeX(r); if (c == null) return;
    G.told.blank = 1; G.big.push(flake('blank', '', c, r, first ? 2.4 : 2.4 + Math.random() * 2.9));   // every flake at its own speed
  }
  // What the next gift will turn into. An arm or a button needs its ball to be big enough to wear it, the scarf needs his
  // middle done, and a glove needs its arm.
  const have = k => (PARTS[k] || [k]).every(p => G.got[p] || G.toys.some(o => o.k === p));
  const fits = k => !have(k) && (k === 'scarf' ? G.snow >= NT : k === 'btnB' ? G.snow >= NT + 6 : k === 'gloveR' ? !!G.got.armR : k === 'gloveL' ? !!G.got.armL : G.snow >= 4);
  const nextGift = () => (pieces && GIFTS.find(fits)) || null;
  function spawnGift() {
    const r = clamp(PW * .078, 26, 40), c = freeX(r); if (c == null) return;
    G.gift = flake('gift', '', c, r, 3.3 + Math.random()); G.big.push(G.gift);
    globe.bell(2093, 0, .045, (c - W / 2) / (W / 2) * .6); globe.bell(2637, .09, .04, (c - W / 2) / (W / 2) * .6);
    if (!G.told.gift) { G.told.gift = 1; note('A gift! Catch it', 2.4); }
    say('A gift, ' + side(c) + '.');
  }
  function pop(px, py, col, n, big) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, v = (60 + Math.random() * 160) * (big ? 1.5 : 1); G.pops.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: .5 + Math.random() * .4, t: 0, s: 2 + Math.random() * 3, col }); } }

  // snow for the snowman: he grows, and says so when a ball begins or is done
  function grow(n, pan) {
    const was = G.snow; G.snow = Math.min(MOST, was + n); G.flakes++;
    globe.bell(1175 * Math.pow(2, G.snow / MOST), 0, n > 1 ? .034 : .024, pan);   // (the note climbs as he grows)
    if (!pieces) return;
    if (was < 1 && G.snow >= 1) { globe.bell(392, 0, .06); globe.bell(587.33, .09, .06); if (!G.told.two) { G.told.two = 1; say('A second ball is growing under his head.'); } }
    if (was < NT && G.snow >= NT) { [659.25, 783.99, 987.77].forEach((f, k) => globe.bell(f, k * .08, .05)); try { figure.tap(); } catch (e) {} if (!G.told.three) { G.told.three = 1; say('His middle is done. Now his bottom ball.'); } }
    if (was < FULL && G.snow >= FULL) { [783.99, 987.77, 1174.66, 1568].forEach((f, k) => globe.bell(f, k * .08, .05)); try { figure.tap(); } catch (e) {} G.cheerT = G.t; if (!G.told.whole) { G.told.whole = 1; say('All three balls are done.'); } }
  }
  // He loses some snow (n of it), but never a ball he already has. When he is whole or bigger, the loss still shows: his bottom
  // ball comes down a size, whatever snow he had to spare.
  function knock(n) { const floor = !pieces ? 0 : G.snow > NT ? NT + 1 : Math.min(G.snow, 1), lost = G.snow - Math.max(floor, Math.min(G.snow - n, FULL - Math.ceil(n * .75))); G.snow -= lost; return lost; }
  // where an arm, a glove, a button or the scarf belongs on him, on the screen
  const spot = k => { const b = body(), p = b && b.spots && b.spots[k], u = unit(); return p ? [G.sx + p[0] * u, feetY() - p[1] * u] : [G.sx, lerp(headY(), feetY(), .5)]; };
  // where one of his marks is on the screen just now (the top of his hat, the tip of his nose, the end of his scarf): exactly where it
  // was last drawn, turned and leaning and jumping as he is. Nothing for a scarf he has not got. (A figure with no marks: the top of it.)
  const mark = n => { const M = figure.marks, u = unit(); if (!M) return n === 'hat' ? [G.sx, headY() + 4] : null; const p = M[n]; if (!p || (n === 'scarf' && !(made().scarf > 0))) return null;
    return [G.sx + p[0] * u, feetY() - figure.feetV * u + p[1] * u]; };

  function caught(f) {
    const t = G.t, pan = (f.x - W / 2) / (W / 2) * .6;
    if (f.kind === 'need') {   // the letter that is needed
      const k = G.i; G.fly.push({ ch: f.ch, k, x: f.x, y: f.y, t: 0, r: f.r }); pop(f.x, f.y, '#ffe9a8', 16, true);
      globe.bell(SCALE[k % SCALE.length], 0, .13); globe.bell(SCALE[k % SCALE.length] * 2, .07, .06); buzz(25); fx('letter', { pan, hz: chime(k) });
      try { figure.tap(); } catch (e) {} G.cheerT = t; G.caught++; G.i++; G.missRow = 0; G.nextAt = t + .8; G.letter = null; say(f.ch + '!'); gain(PTS.letter, 'letters', f.x, f.y);
      if (G.i >= G.letters.length) { G.nextAt = t + .9; G.sunDue = 0; G.doneAt = G.played; }   // the phrase is whole: no icicle now, and no sunshine (not even a ray that was just about to come)
      else if (G.i === G.iceAt) { G.iceAt += 3; shakeIce(); }             // every third letter brings an icicle down
      else if (G.sunAfter.length && G.i >= G.sunAfter[0]) { G.sunAfter.shift(); G.sunDue = t + .35; }   // (and, when it is switched on, now and then sunshine)
    } else if (f.kind === 'gift') {   // a gift: it bursts open, and what was in it flies to its place on him
      const k = nextGift(); G.gifts++; G.gift = null; G.giftAt = t + 2.6 + Math.random() * 1.6; G.cheerT = t; gain(PTS.gift, 'gifts', f.x, f.y);
      for (const col of ['#ffd76a', '#ff5a45', '#ffffff']) pop(f.x, f.y, col, 7, true);
      [1046.5, 1318.5, 1568, 2093].forEach((fq, n) => globe.bell(fq, n * .06, .055, pan)); buzz([20, 30, 20]); fx('gift', { pan });
      if (k) (PARTS[k] || [k]).forEach((p, n) => G.toys.push({ k: p, x: f.x, y: f.y, t: -n * .35 })); else { grow(3, pan); say('The gift was full of snow.'); }   // (nowhere to put anything just now)
    } else { pop(f.x, f.y, '#ffffff', 8); grow(2, pan); gain(PTS.big, 'snow', f.x, f.y); fx('big', { pan }); }   // a big snowflake
  }
  function landed(f) {
    pop(f.x, moundY(f.x), '#ffffff', f === G.letter ? 10 : 5);
    if (f === G.letter) { globe.bell(196, 0, .05); G.misses++; G.missRow++; G.letter = null; G.nextAt = G.t + .8; say('Missed. ' + f.ch + ' is coming again.'); }   // it comes round again
    else if (f === G.gift) { pop(f.x, moundY(f.x), '#ffd76a', 6); G.gift = null; G.giftAt = G.t + 2.4; say('The gift landed in the snow. Another will come.'); }
  }

  // an icicle: when the third letter is caught, the wobbling one shakes hard, then drops
  function shakeIce() {
    const c = G.loose && G.loose.state === 'loose' ? G.loose : loosen(G.sx); if (!c) return; c.state = 'shake'; c.t = 0; c.cue = 0; G.loose = null;
    G.told.drop = (G.told.drop || 0) + 1; if (G.told.drop <= 2) note('Icicle! Slide away', 1.8);
    globe.bell(2793.83, 0, .06); globe.bell(3520, .07, .045); buzz(40); say('The icicle ' + side(iceX(c)) + ' is about to fall! Slide away.');
  }
  function shatter(px, py) { pop(px, py, '#d9ecff', 14, true); pop(px, py, '#ffffff', 6);
    const pan = clamp((px - W / 2) / (W / 2), -1, 1) * .7; globe.bell(3135.96, 0, .05, pan); globe.bell(2349.32, .03, .05, pan); globe.bell(3951.07, .06, .035, pan); globe.bell(146.83, 0, .06, pan); fx('icicle', { pan }); }
  function regrow(c) { c.state = 'hang'; c.len = 0; c.y = 0; c.vy = 0; c.rot = 0; c.max = .55 + Math.random() * .45; c.secs = 6 + Math.random() * 4; if (G.loose === c) G.loose = null; }
  const chunks = (n, col, up) => { for (let k = 0; k < n; k++) G.pops.push({ x: G.sx + (Math.random() - .5) * wide() * 1.6, y: lerp(headY(), feetY(), .15 + Math.random() * .7), vx: (Math.random() - .5) * 260, vy: up ? -70 - Math.random() * 170 : 30 + Math.random() * 90, life: .7 + Math.random() * .5, t: 0, s: 3 + Math.random() * 4, col }); };
  function iceHit() {
    G.hits++; G.ouchT = G.t; const lost = knock(KNOCK); chunks(18, '#ffffff', true);
    [329.63, 261.63, 196].forEach((f, k) => globe.bell(f, k * .11, .08)); buzz([70, 40, 70]);
    note(lost ? 'An icicle knocked some snow off' : 'Bonk! Mind the icicles', 1.9); say(lost ? 'An icicle hit him and knocked some snow off. Catch more snowflakes.' : 'An icicle hit him. Mind the icicles.');
  }
  function stepIce(dt, play) {
    const t = G.t; G.iceA = Math.min(1, G.iceA + dt / 1.2);
    for (const c of G.ice) {
      const px = iceX(c), L = iceLen(c);
      if (c.state === 'fall') { c.vy += 2600 * dt; c.y += c.vy * dt; c.rot += dt * .5 * (c.ph > 3 ? 1 : -1); const tip = c.y + L, b = body(), u = unit(); let hit = false;
        if (play) for (const q of [0, .35, .7]) { const py = tip - L * q;   // (its point, and two places up its length)
          if (b) { for (const B of b.balls) if (B[2] > 0 && Math.hypot(px - (G.sx + B[0] * u), py - (feetY() - B[1] * u)) < B[2] * u * .94) hit = true; }
          else if (Math.abs(px - G.sx) < reach() * .55 && py > headY() + 4 && py < groundY) hit = true; }
        if (hit) { shatter(px, Math.min(tip, groundY)); iceHit(); regrow(c); }
        else if (tip > moundY(px)) { shatter(px, moundY(px)); regrow(c); }
        continue; }
      c.len = Math.min(1, c.len + dt / c.secs);   // it grows
      if (c.state === 'shake') { c.t += dt;
        if (!play) { c.state = 'hang'; continue; }
        if (cues && t >= c.cue) { const under = Math.abs(px - G.sx) < reach() * .8; c.cue = t + .09; globe.bell(under ? 2793.83 : 1396.91, 0, under ? .034 : .014, clamp((px - G.sx) / (PW * .3), -1, 1)); }
        if (c.t >= SHAKE) { c.state = 'fall'; c.y = 0; c.vy = 30; globe.bell(1975.53, 0, .05); } }
      else if (c.state === 'loose') { if (!play) { c.state = 'hang'; continue; } c.t += dt; if (c.t > .5 && L > 8) { c.t = 0; G.pops.push({ x: px, y: L, vx: 0, vy: 30, life: .8, t: 0, s: 2.2, col: '#d9ecff' }); } }   // (it drips)
    }
  }

  // What lies in his way as he walks: a fallen branch first, then two campfires for every branch. They come along the snow
  // from the right, at the pace of the ground. What counts is the moment one reaches him: if he is in the air then, higher
  // than it is, he has cleared it (even if he comes down on it afterwards); if not, he has run into it. So a jump at any
  // time in the second before it arrives will do. The JUMP button lights up, and two notes ring, when it is time.
  function spawnOb(kind) {
    const fire = kind ? kind === 'fire' : G.obN % 3 !== 0, k = kS(), o = { kind: fire ? 'fire' : 'branch', x: W + 40 * k + pace(), hx: (fire ? 17 : 22) * k, hh: (fire ? 34 : 16) * k, k, hit: false, done: false, rang: false, cue: 0, ph: Math.random() };   // (it starts a second's walk beyond the right side of the screen, so there is warning even for a snowman standing over there)
    G.obs.push(o); G.obN++; const first = !G.told[o.kind]; G.told[o.kind] = 1;
    if (first) note(fire ? 'A campfire! Jump over it' : 'Jump over the branch!', 2.6);
    say(fire ? 'A campfire is coming along the snow. Jump over it when it rings.' : 'A fallen branch lies across the path. Jump over it when it rings.');
    return o;
  }
  // He has run into a branch. He loses his bottom ball, whichever ball that is just now (a bare head has none to lose): it
  // stays behind at the branch and slumps into a heap of snow. The rest of him tumbles forward: he rolls along the snow,
  // once over, a little way along the screen, while the ground rushes by, and comes up again.
  function trip(o) {
    const b = body(), u = unit(), was = G.snow; G.trips++; G.ouchT = G.t; G.jy = 0; G.jv = 0; G.jumpAsk = -9;
    if (pieces && was >= 1) { const B = b && b.balls[was > NT ? 3 : 2]; if (B && B[2] > .001) G.heaps.push({ x: G.sx + B[0] * u, r: Math.max(9, B[2] * u), t: 0 });
      G.snow = was > NT ? NT : 0; G.snap = true; }   // (the ball is gone from him at once: it is the heap now)
    else if (!pieces) knock(8);
    const lost = was - G.snow, room = PX + PW - edge() - G.sx;
    G.roll = { t: 0, hop: clamp(H * .016, 8, 16), far: calm ? 0 : Math.max(0, Math.min(PW * .12, room)) };
    chunks(lost ? 16 : 8, '#ffffff', true); pop(o.x, restY(o.x) - 10, '#7a5433', 7);
    [196, 146.83].forEach((f, k) => globe.bell(f, k * .09, .08)); if (!calm) [246.94, 220, 196, 174.61].forEach((f, k) => globe.bell(f, .2 + k * .13, .045)); buzz([40, 30, 40, 30, 70]);
    fx('trip', { pan: here() });   // knock, tumble, and a plop as he comes up (the recording's plop is ROLL seconds after its knock)
    note(!lost ? 'Oops! Jump over the branches' : pieces ? 'He tripped and lost a snowball!' : 'He tripped and lost some snow!', 2.2);
    say(!lost ? 'He tripped on the branch and tumbled forward. Jump over the next one.' : pieces ? 'He tripped on the branch. His bottom snowball stayed behind and he tumbled forward. Catch snowflakes to grow it back, and jump over the next one.' : 'He tripped on the branch, lost some snow and tumbled forward. Jump over the next one.');
  }
  function hitOb(o) {
    if (o.kind !== 'fire') return trip(o);
    G.ouchT = G.t; const lost = knock(MELT); G.burns++; G.meltT = G.t; chunks(16, '#bfe3ff', false);
    G.singe = { t: 0, ph: Math.random(), on: FLAMES.map(q => q[0]).filter(n => mark(n)), at: [], out: false };   // it has caught him: what he has of scarf, hat and nose burns for a moment (drawn in draw())
    for (let k = 0; k < 8; k++) G.pops.push({ x: o.x + (Math.random() - .5) * 30, y: restY(o.x) - 20 - Math.random() * 30, vx: (Math.random() - .5) * 40, vy: -120 - Math.random() * 120, life: .8 + Math.random() * .4, t: 0, s: 4 + Math.random() * 4, col: 'rgba(235,242,255,.75)' });   // (steam)
    [523.25, 392, 261.63].forEach((f, k) => globe.bell(f, k * .12, .08)); buzz([60, 40, 60]); fx('burn', { pan: here() });
    const what = !figure.marks ? 'The top of him burns' : mark('scarf') ? 'The end of his scarf, the top of his hat and the tip of his nose burn' : 'The top of his hat and the tip of his nose burn';
    note(lost ? 'The fire melted him a little' : 'Hot! Jump over the campfire', 2); say((lost ? 'He landed in the campfire. ' : 'He touched the campfire. ') + what + ' for a moment' + (lost ? ', and he melts a little.' : '.') + ' Jump over the next one.');
  }
  function stepObs(dt, play) {
    const v = speed(), fw = foot(); let ready = false;
    for (const o of G.obs) { o.x -= v * dt; const gap = o.x - o.hx - (G.sx + fw), tc = gap / pace();   // tc: seconds until it reaches his feet
      if (play && !o.hit && !o.done) {
        if (Math.abs(o.x - G.sx) < o.hx + fw) {                                                                                             // it has reached him:
          if (G.roll || G.t < G.safeT) o.done = true;                                                                                       // (he is tumbling, or only just up again: it goes by)
          else if (G.jy >= o.hh) { o.done = true; G.cleared++; globe.bell(1046.5, 0, .04); globe.bell(1568, .07, .03); gain(PTS.jump, 'jumps', G.sx, headY() - 14); }                    // he is over it: cleared
          else { o.hit = true; hitOb(o); } }                                                                                                 // …or not high enough
        else if (o.x < G.sx) o.done = true;                                                                                                  // (it is behind him: he came down past it)
        else { if (tc < .6 && !G.roll) ready = true; const pan = clamp((o.x - G.sx) / (PW * .4), -1, 1);
          if (tc < .6 && !o.rang) { o.rang = true; if (cues) { globe.bell(880, 0, .06, pan); globe.bell(1174.66, .09, .06, pan); } }        // "now"
          else if (cues && G.t >= o.cue && !o.rang) { o.cue = G.t + .3; globe.bell(o.kind === 'fire' ? 233.08 : 174.61, 0, .035, pan); if (o.kind === 'fire') globe.bell(311.13, .07, .02, pan); } } }
      if (o.x < -160) o.gone = true; }
    G.obs = G.obs.filter(o => !o.gone); glow(play && ready);
    for (const h of G.heaps) { h.x -= v * dt; h.t += dt; } G.heaps = G.heaps.filter(h => h.x > -h.r * 2.5);   // what he has lost stays where it fell
  }
  // JUMP: asked for by the button, a key or a second finger; he leaves the snow at once (or, if he is still in the air, the
  // moment he lands, when that is within a fifth of a second)
  function ask() { if (!G || G.phase !== 'play' || G.roll) return; const now = performance.now(); if (now - lastAsk < 220) return; lastAsk = now; G.jumpAsk = G.t; }

  // a ray of sunshine, where the figure is standing: a warning, then the heat
  function startSun() {
    const w = clamp(PW * .34, 110, 240); G.sun = { x: clamp(G.sx, PX + w / 2 + 4, PX + PW - w / 2 - 4), w, t: 0, hit: 0, done: false, cue: 0, n: 0 };
    if (G.melts + (G.sunsSeen || 0) < 2) note('Sunshine! Slide away', 2); G.sunsSeen = (G.sunsSeen || 0) + 1;
    say('Sunshine ' + side(G.sun.x) + '! Slide away.');
  }
  const inSun = S => Math.abs(G.sx - S.x) < S.w * .5 + reach() * .15;
  // the ray is narrow at the top and wide on the snow; while it shines, the snowflakes inside it melt away
  const inBeam = (px, py) => { const S = G.sun; return !!S && S.t >= WARN && S.t < WARN + BURN && Math.abs(px - S.x) < lerp(S.w * .36, S.w, clamp(py / Math.max(1, moundY(S.x)), 0, 1)) / 2; };
  function melt(S) {
    S.done = true; G.melts++; G.meltT = G.t; const lost = knock(KNOCK); chunks(16, '#bfe3ff', false);
    [392, 329.63, 261.63].forEach((f, k) => globe.bell(f, k * .13, .08)); buzz([60, 40, 60]);
    note(lost ? 'The sun melted him a little' : 'Too hot! Keep out of the sun', 1.9); say(lost ? 'The sun melted him a little. Catch more snowflakes.' : 'Too hot. Keep out of the sunshine.');
  }

  // the points that make the phrase, sampled from big letters (so the snowflakes can gather into it): one row of words or two
  function wordPoints(rows, most) {
    const c = document.createElement('canvas'), fw = 900, g = c.getContext('2d', { willReadFrequently: true });
    let fs = 230; g.font = `900 ${fs}px ${FONT}`; fs = Math.min(400, fs * fw * .94 / Math.max(...rows.map(r => g.measureText(r).width)));
    const lh = fs * 1.08, fh = Math.ceil(Math.max(460, lh * rows.length + fs * .5)); c.width = fw; c.height = fh;
    g.font = `900 ${fs}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    rows.forEach((r, j) => g.fillText(r, fw / 2, fh / 2 + (j - (rows.length - 1) / 2) * lh + fs * .04));
    const d = g.getImageData(0, 0, fw, fh).data; let pts = [], step = 11;
    for (; step < 40; step++) { pts = [];
      for (let y = step / 2, row = 0; y < fh; y += step * .87, row++) for (let px = step / 2 + (row % 2 ? step / 2 : 0); px < fw; px += step) if (d[((y | 0) * fw + (px | 0)) * 4 + 3] > 110) pts.push([px / fw - .5, (y - fh / 2) / fw]);
      if (pts.length <= most) break; }
    pts.gap = step / fw; pts.fs = fs / fw; pts.lh = lh / fw;   // how far apart the dots are, how tall the letters and how far apart the rows (as parts of the phrase's width)
    return pts;
  }
  // The phrase at the top and the phrase made of snow are laid out the same way: a word on each row on a phone; all on one row
  // on a wide screen, where the letters are as big that way.
  function layout() { const L = G.lines, flat = L.join(' '), longest = Math.max(...L.map(s => s.length));
    const fs2 = clamp(PW / (longest + 1.6), 18, 68), fs1 = clamp(Math.min(W * .96, PW * 2) / (flat.length + 1.6), 18, 68), one = L.length < 2 || fs1 >= fs2;
    return { rows: one ? [flat] : L, fs: one ? fs1 : fs2, one }; }
  // the snow phrase sits in the open sky between the icicles and his head, as big as fits there
  const wordW = () => G.WW || Math.min(PW * .88, 580);
  const wordY = () => { const n = G.rows ? G.rows.length : 1; return Math.max(H * (n > 1 ? .275 : .235), iceH() + 10 + wordW() * (G.wlh || .25) * n / 2); };
  function startWord() {
    G.phase = 'word'; G.pt = 0; G.letter = null; G.gift = null; G.sun = null; G.note = null; G.cheerT = G.t; try { figure.shake(0, true); } catch (e) {}
    G.secs = G.doneAt == null ? G.played : G.doneAt; gain(Math.max(0, Math.ceil(PTS.par - G.secs)) * PTS.second, 'speed', G.sx, headY() - 18, 'SPEED');   // the quicker the phrase was spelled, the more
    for (const f of G.big) pop(f.x, f.y, f.kind === 'gift' ? '#ffd76a' : '#ffffff', 6); G.big = []; G.sparks = [];
    for (const o of G.obs) pop(o.x, moundY(o.x) - 10, o.kind === 'fire' ? '#ffc46b' : '#7a5433', 8); G.obs = []; for (const h of G.heaps) pop(h.x, moundY(h.x) - 6, '#ffffff', 8); G.heaps = []; G.hadKeys = bar.contains(document.activeElement); bar.style.visibility = 'hidden'; glow(false); G.pad.l = G.pad.r = 0;   // nothing in his way now: he stops walking
    // he is finished off: the snow he still needs, and any arm, glove, button or the scarf that no gift brought, come down to him one after another
    G.snow = Math.max(G.snow, FULL);
    if (pieces) { let d = 0; for (const k of ALL) if (!G.got[k] && !G.toys.some(o => o.k === k)) G.toys.push({ k, x: W / 2 + (Math.random() - .5) * PW * .5, y: -24, t: -.5 - .36 * d++ }); }
    const Y = layout(), maxW = Y.one && G.lines.length > 1 ? Math.min(W * .86, PW * 1.9, 1000) : Math.min(PW * .88, 580);
    const pts = wordPoints(Y.rows, clamp(Math.round(maxW * (Y.rows.length > 1 ? 1.5 : 1)), 300, 900)); G.rows = Y.rows; G.wfs = pts.fs; G.wlh = pts.lh;   // (more dots on a bigger screen, so the letters stay crisp)
    G.WW = Math.min(maxW, .3 * H / (Y.rows.length * pts.lh));
    const WW = wordW(), wy = wordY(), [hx, hy] = [G.sx, lerp(headY(), feetY(), .25)];
    G.amb.sort(() => Math.random() - .5); const take = Math.min(pts.length, G.amb.length), pool = G.amb.slice(0, take).map(f => [f.u * W, f.v * H]); G.amb = G.amb.slice(take);   // those flakes are in the phrase now
    G.word3 = pts.map((p, k) => { const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * 44, from = k < pool.length ? pool[k] : [hx + Math.cos(a) * d, hy + Math.sin(a) * d];   // (the dots that no falling flake supplies come from round about him)
      return { x0: from[0], y0: from[1], x1: W / 2 + p[0] * WW, y1: wy + p[1] * WW, d: Math.random() * .55, ph: Math.random() * 6.283, s: Math.max(4, pts.gap * WW * 1.9), vx: 0, vy: 0, x: from[0], y: from[1] }; });
    for (let k = 0; k < 4; k++) globe.bell([523.25, 659.25, 783.99, 1046.5][k], k * .12, .09);
    globe.bell(1318.5, .6, .08); buzz([30, 40, 30, 40, 90]); fx('finale');
    say(G.word + '! Your score: ' + fmt(G.score) + '.');
  }
  function begin() {   // the game is on the screen: the first words of help, and the buttons
    G.phase = 'play'; G.pt = 0; G.t = 0; note(pieces ? 'Catch snowflakes to grow!' : 'Catch the snowflakes!', 3.1);
    bar.style.visibility = 'visible'; try { focusWas = document.activeElement; btn.focus({ preventScroll: true }); } catch (e) {}
    say('Catch snowflakes to build the snowman, and catch the letters to spell ' + G.word.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()) + '. Slide left and right with a finger or with the Left and Right buttons. Press Jump to hop over branches and campfires, and keep away from falling icicles' + (SUNSHINE ? ' and out of the sunshine.' : '.'));
  }
  function finish() {   // the round is over: the game's canvas and buttons go, and the keyboard is where it was
    if (night) { night.stop(); fire.stop(); }
    const fin = G.fin, had = G.hadKeys || bar.contains(document.activeElement), result = { score: G.score, seconds: Math.round((G.secs == null ? G.played : G.secs) * 10) / 10, parts: Object.assign({}, G.pts), flakes: G.flakes, letters: G.caught, gifts: G.gifts, jumps: G.cleared }; G = null; cv.style.display = 'none'; bar.style.display = 'none'; glow(false); btnL.style.background = btnR.style.background = GOLD; removeEventListener('resize', size);
    if (had && focusWas && focusWas.focus) try { focusWas.focus({ preventScroll: true }); } catch (e) {} focusWas = null; fin(result);
  }

  /* ── one step of the game ── */
  function step(dt) {
    const t = (G.t += dt); G.pt += dt; const play = G.phase === 'play';
    // the figure follows the finger, the keys or the tilt of the phone: all the way to both sides of the screen
    const lo = PX + edge(), hi = PX + PW - edge();
    if (play) {
      const lean = t - G.touchT > 1.5 ? clamp(G.tilt - (G.tilt0 || 0), -1, 1) : 0;   // the tilt of the phone (from how it was held when the round began), unless a finger is steering
      const pad = G.pad.r - G.pad.l; G.padT = pad ? G.padT + dt : 0; if (G.pad.l || G.pad.r) G.touchT = t;   // an arrow button is held: it steers (gently at first, so a short press is a small move; then as fast as an arrow key)
      const push = (G.keys.r - G.keys.l) + pad * lerp(.65, 1, clamp(G.padT / .45, 0, 1)) + (Math.abs(lean) > .1 ? lean * 1.6 : 0); if (push) G.tx += push * PW * 1.15 * dt;
      G.tx = clamp(G.tx, lo, hi); const want = (G.tx - G.sx) * 12, cap = PW * 2.4; G.vx = clamp(want, -cap, cap); G.sx += G.vx * dt;
    } else { G.vx *= Math.exp(-dt * 6); G.sx = clamp(G.sx + G.vx * dt, lo, hi); }
    // tripped by a branch, he rolls forward along the snow, once over, a little way along the screen, while the ground rushes by
    const R = G.roll; if (R) { const p0 = clamp(R.t / ROLL, 0, 1); R.t += dt; const p1 = clamp(R.t / ROLL, 0, 1), ease = q => q * (2 - q), step = R.far * (ease(p1) - ease(p0));
      G.tx = clamp(G.tx + step, lo, hi); G.sx = clamp(G.sx + step, lo, hi); G.rush = calm ? 0 : 1.8 * Math.sin(Math.PI * p1);
      if (p1 >= 1) { G.roll = null; G.rush = 0; G.safeT = t + .35; pop(G.sx, moundY(G.sx), '#ffffff', 9); globe.bell(130.81, 0, .05); buzz(20); } }
    G.hf += (hfGoal() - G.hf) * Math.min(1, dt * (G.roll || t - G.ouchT < 1.6 ? .9 : 3));   // (after a fall the view comes in slowly)
    // he walks: the ground goes by (he sets off over the first two seconds, and stops when the phrase is spelled)
    G.going += ((play ? 1 : 0) - G.going) * Math.min(1, dt * (play ? 1.2 : 2.5)); const went = speed() * dt; G.walk += went;
    for (const f of G.amb) { f.v += (18 + f.s * 16) * (1 + f.z) * dt / H; f.u += (Math.sin(t * .9 + f.ph) * 6 * dt - (calm ? 0 : went * (.1 + f.z * .18))) / W; if (f.v > 1.02) { f.v = -.02; f.u = Math.random(); } if (f.u < -.02) f.u += 1.04; }
    for (const m of G.trail) m.x -= went; if (G.trail.length && G.trail[0].x < -40) G.trail.shift();
    if (G.jy <= 0 && !G.roll && G.going > .3 && G.walk >= G.trailAt) { G.trailAt = G.walk + 26; G.trail.push({ x: G.sx }); if (G.trail.length > 40) G.trail.shift(); }   // his track in the snow
    if (play && G.jy <= 0 && !G.roll && G.going > .3) { if (G.walk >= G.stepAt) { G.stepAt = G.walk + pace() * .5; fx('step', { pan: here() }); } }   // …and the sound of his steps: two a second at full pace
    else G.stepAt = G.walk + pace() * .18;                                                                                                          // (none in the air or in a tumble; the next one comes just after he is down)
    // a jump
    if (play && G.jy <= 0 && !G.roll && t - G.jumpAsk < .2) { G.jumpAsk = -9; G.jv = 4 * peak() / JT; G.jy = .01; G.jumps++; globe.bell(392, 0, .05); globe.bell(659.25, .07, .04); buzz(15); fx('jump', { pan: here() }); }
    if (G.jy > 0) { G.jv -= 8 * peak() / (JT * JT) * dt; G.jy += G.jv * dt; if (G.jy <= 0) { G.jy = 0; G.jv = 0; pop(G.sx, moundY(G.sx), '#ffffff', 6); globe.bell(130.81, 0, .035); fx('land', { pan: here() }); } }

    if (play) {
      const top = headY(), bottom = catchTo(top), going = G.i < G.letters.length, most = PW < 360 ? 3 : PW < 520 ? 4 : 5, drop = top + G.jy;   // (drop: how far a flake falls to the top of his hat, as he stands)
      // small flakes to catch all the while: each one is a little more snow for him
      if (t >= G.sparkAt) { G.sparkAt = t + (t < 6 ? .6 : 1) + Math.random() * .9; const r = 9 + Math.random() * 5; G.sparks.push({ x: PX + r + Math.random() * (PW - 2 * r), y: -r * 2, r, vy: (drop + r * 2) / (2.2 + Math.random() * 2.2), rot: Math.random() * 6, ph: Math.random() * 6 }); }
      for (const s of G.sparks) { s.y += s.vy * dt; s.rot += dt * 1.2; s.x += Math.sin(t * 1.4 + s.ph) * 10 * dt;
        if (s.y > top - s.r && s.y < bottom && Math.abs(s.x - G.sx) < grab() + s.r * 1.5) { s.gone = true; pop(s.x, s.y, '#ffffff', 5); grow(1, (s.x - W / 2) / (W / 2) * .6); gain(PTS.flake, 'snow', s.x, s.y); fx('flake', { pan: from(s.x) }); }
        else if (s.y > moundY(s.x) - 2 || inBeam(s.x, s.y)) s.gone = true; }
      G.sparks = G.sparks.filter(s => !s.gone);

      // the big things: the letter that is needed (one at a time), big snowflakes, and now and then a gift
      if (going && !G.letter && t >= G.nextAt) spawnLetter();
      if (going && t >= G.blankAt) { G.blankAt = t + 1.9 + Math.random() * 1.4; if (G.big.length < most) spawnBlank(); }
      if (going && !G.gift && t >= G.giftAt && G.big.length <= most && nextGift()) spawnGift();
      for (const f of G.big) {
        f.y += f.vy * dt; f.rot += dt * f.spin; f.x = f.bx + Math.sin(t * 1.2 + f.ph) * Math.min(10, PW * .02);
        if (f.y + f.r * .5 > top && f.y - f.r < bottom && Math.abs(f.x - G.sx) < grab() + f.r * .5) { f.gone = true; caught(f); }
        else if (f.y - f.r * .3 > moundY(f.x)) { f.gone = true; landed(f); }
        else if (f.kind === 'blank' && f.y > f.r && inBeam(f.x, f.y)) { f.gone = true; pop(f.x, f.y, '#bfe3ff', 7); }   // melted by the sunshine
      }
      G.big = G.big.filter(f => !f.gone);
      const L = G.letter;
      if (L && cues && t >= G.cueAt) { const dx = L.x - G.sx, under = Math.abs(dx) < grab() + L.r * .5, near = clamp((L.y + L.r) / Math.max(1, top), 0, 1);
        G.cueAt = t + lerp(.62, .17, near); globe.bell(under ? 1318.5 : 659.25, 0, under ? .05 : .032, clamp(dx / (PW * .3), -1, 1)); }
      if ((G.missRow >= 4 || G.played > 45 + G.letters.length * 6) && L) L.bx += (G.sx - L.bx) * Math.min(1, dt * 3);     // (four misses in a row, or a very long round: the letters come to the figure)

      // what lies in his way: a branch or a campfire every four and a half to seven seconds (not while an icicle is loose or coming down: one thing at a time)
      if (going && t >= G.obAt) { if (G.loose || iceBusy() || G.obs.some(o => o.x > W * .45)) G.obAt = t + .5; else { G.obAt = t + 4.4 + Math.random() * 2.6; spawnOb(); } }

      // sunshine (when it is switched on)
      if (going && G.sunDue && t >= G.sunDue) {
        if (G.letter || iceBusy()) { G.sunDue = 0; G.sunAfter.unshift(G.i + 1); }   // the next letter is already on its way, or an icicle is coming down: after the next catch, then
        else if (!G.sun) { G.sunDue = 0; startSun(); } }                            // (while the last ray is still fading, it waits a moment)
      const S = G.sun;
      if (S) { S.t += dt; const burn = S.t >= WARN && S.t < WARN + BURN;
        if (cues && t >= S.cue && S.t < WARN + BURN) { const inIt = inSun(S); S.cue = t + (burn ? .12 : .23);   // bright and clear while he is in it, low and soft once he is out
          globe.bell([523.25, 659.25, 783.99, 1046.5][S.n++ % 4] * (burn ? 2 : 1) * (inIt ? 1 : .5), 0, inIt ? .04 : .016, clamp((S.x - G.sx) / (PW * .3), -1, 1)); }
        if (burn && !S.done && inSun(S)) { S.hit += dt; if (S.hit > .3) melt(S); }
        if (S.t > WARN + BURN + FADE) G.sun = null; }

      if (!going && !G.letter && t >= G.nextAt && !G.fly.length && !G.roll) startWord();   // (if he is rolling just then, when he is up again)
      G.played += dt;
    }
    stepObs(dt, play);
    if (play || G.phase === 'word' || G.phase === 'out') stepIce(dt, play);
    // what was in a gift, on its way to its place on him
    for (const o of G.toys) { o.t += dt / .55; if (o.t >= 1) { o.done = true; G.got[o.k] = true; const [px, py] = spot(o.k), sc = o.k === 'scarf', N = GOT[o.k]; pop(px, py, '#ffe9a8', 9);
      globe.bell(sc ? 880 : 587.33, 0, .07); globe.bell(sc ? 1318.5 : 880, .07, .05); fx('piece', { pan: from(px) });
      if (G.phase === 'play' && N) { note(N[0], 1.5); say(N[1]); } } }
    G.toys = G.toys.filter(o => !o.done);
    for (const f of G.fly) f.t += dt / .6; G.fly = G.fly.filter(f => f.t < 1);
    for (const p of G.pops) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g == null ? 420 : p.g) * dt; } G.pops = G.pops.filter(p => p.t < p.life);
    if (G.singe) { const sg = G.singe; sg.t += dt;   // the flames on him: they last a moment, and as each dies out a wisp of smoke goes up from it
      if (!sg.out && sg.t > SINGE - .26) { sg.out = true; if (!calm) for (const q of sg.at) for (let k = 0; k < 2; k++) G.pops.push({ x: q[1] + (Math.random() - .5) * 4, y: q[2] - q[3] * (.3 + .25 * k), vx: -12 - Math.random() * 16, vy: -30 - Math.random() * 22, g: -14, life: .7 + Math.random() * .4, t: 0, s: Math.max(1.6, q[3] * (.07 + Math.random() * .04)), col: 'rgba(152,160,186,.5)' }); }
      if (sg.t >= SINGE || G.roll) G.singe = null; }
    for (const q of G.gains) q.t += dt; G.gains = G.gains.filter(q => q.t < 1.15); G.shown = Math.abs(G.score - G.shown) < 1 ? G.score : G.shown + (G.score - G.shown) * Math.min(1, dt * 9);

    if (G.phase === 'word') {
      G.hud = Math.max(0, 1 - G.pt / .7);
      for (const p of G.word3) { const q = easeOut((G.pt - p.d) / 1.25), bend = Math.sin(Math.PI * clamp((G.pt - p.d) / 1.25, 0, 1)) * 26;
        p.x = lerp(p.x0, p.x1, q) + Math.cos(p.ph) * bend; p.y = lerp(p.y0, p.y1, q) + Math.sin(p.ph) * bend; }
      if (G.pt > (calm ? 3.4 : 4.3) + (pieces ? .5 : 0)) { G.phase = 'out'; G.pt = 0; whoosh(); for (const p of G.word3) { const a = Math.atan2(p.y - wordY(), p.x - W / 2) + (Math.random() - .5); p.vx = Math.cos(a) * (200 + Math.random() * 500); p.vy = Math.sin(a) * (200 + Math.random() * 500) - 80; } }
    }
    if (G.phase === 'out' && G.word3) for (const p of G.word3) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }

    // the figure itself: it walks forward, turned a little the way it is going; it looks up at the letter (or at an icicle that is
    // about to drop on it), throws its arms up at a catch and in a jump, shakes its head when something has hit it, and droops
    // when it has lost some snow
    if (G.back) return;
    if (G.logo && G.phase !== 'play' && G.phase !== 'word') { figure.pose = FRONT(); return; }   // a close-up of its logo: it faces us and keeps still
    const L = G.letter || G.gift, glad = t - G.cheerT < .9, ouch = t - G.ouchT < .55 || !!G.roll, sad = t - G.meltT < 1.3 || t - G.ouchT < 1.2, S = G.sun;
    const over = G.ice.some(c => c.state === 'shake' && Math.abs(iceX(c) - G.sx) < reach());
    figure.pose = { yaw: clamp(G.vx / (PW * 1.6), -1, 1) * .5 + (play ? .22 * G.going : 0), lean: clamp(G.vx / (PW * 1.8), -1, 1) * -.9,
      look: ouch ? Math.sin((t - G.ouchT) * 24) * .9 : L ? clamp((L.x - G.sx) / (PW * .3), -1, 1) : 0, up: sad ? -.8 : over || (S && S.t < WARN && inSun(S)) ? 1 : L ? .75 : glad ? .4 : 0,
      cheer: G.phase === 'word' || G.phase === 'out' || glad || G.jy > 0 || G.roll ? 1 : sad ? 0 : L && Math.abs(L.x - G.sx) < reach() * 1.6 && L.y > headY() * .45 ? .65 : 0,
      walk: play ? Math.max(.6 * G.going, clamp(Math.abs(G.vx) / (PW * .8), 0, 1)) * (G.jy > 0 || G.roll ? 0 : 1) : 0 };
  }
  const FRONT = () => ({ yaw: 0, lean: 0, look: 0, up: 0, cheer: 1, walk: 0, still: true, bare: !calm && G.e > .24 });   // (bare: its own logo is off, because the sharp one is drawn over it)
  const midY = () => feetY() - figure.feetV * unit();   // the middle of the figure's picture, in the game

  // Draw the figure's picture for this frame. Zoomed in, only the part of it that is on the screen is drawn, so it stays sharp.
  // (ox, oy: where the middle of its picture is on the page; u: pixels to one of its units; own: the game is drawing it, not the globe.)
  // In the game it is as far built as the snow and the gifts have made it; over the globe it is whole.
  function renderFigure(dt, ox, oy, u, own) {
    let view = null; const c = G.cam;
    if (c && c.Z > 1.25) { let x0 = 9, y0 = 9, x1 = -9, y1 = -9;
      for (const [sx, sy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const q = unCam(c, sx, sy), px = (q[0] - ox) / u, py = (q[1] - oy) / u; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
      x0 = Math.max(-1, x0); y0 = Math.max(-1, y0); x1 = Math.min(1, x1); y1 = Math.min(1, y1);
      if (x1 > x0 && y1 > y0) { const half = Math.max(x1 - x0, y1 - y0) / 2 * 1.03; if (half < .85) view = [(x0 + x1) / 2, (y0 + y1) / 2, half]; } }
    G.view = view; if (pieces) figure.made = own ? Object.assign(made(), G.snap ? { snap: true } : null) : null;
    if (!own && !view) return;   // (over the globe, the globe draws the figure itself)
    try { figure.frame(performance.now() / 1000, dt, own ? { px: clamp(2 * u * DPR, 256, 1280), view } : { view }); } catch (e) {}
    if (own) G.snap = false;     // (the first time, he is put together at once: nobody sees him change)
  }
  function drawFigure(ox, oy, u) { const V = G.view; if (!figure.canvas) return;
    if (V) x.drawImage(figure.canvas, ox + (V[0] - V[2]) * u, oy + (V[1] - V[2]) * u, 2 * V[2] * u, 2 * V[2] * u); else x.drawImage(figure.canvas, ox - u, oy - u, 2 * u, 2 * u); }

  /* ── drawing ── */
  function rr(a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  // The winter night behind him. In layers (scenery), the hills and the three rows of pines go by at their own speeds as he
  // walks, far things slowest; the sky, the moon and the stars keep still. (With "reduce motion" on, none of it moves.)
  function drawNight() {
    const Sc = scenery, pic = Sc ? Sc.sky : backdrop;
    if (!pic) { x.fillStyle = '#17306a'; x.fillRect(0, 0, W, H); return; }
    const bw = pic.width, bh = pic.height, s = Math.max(W / bw, H / bh), X0 = Math.min(0, Math.max(W - bw * s, W / 2 - bw * s * .58)), Y0 = H - bh * s, ws = bw * s;
    x.drawImage(pic, X0, Y0, ws, bh * s); if (!Sc) return;
    for (const L of Sc.layers) { const dy = Y0 + L.top * bh * s, dh = L.canvas.height * s; let dx = X0 - (calm ? 0 : (G.walk * L.speed) % ws); while (dx > 0) dx -= ws;
      for (; dx < W; dx += ws) x.drawImage(L.canvas, Math.floor(dx), dy, Math.ceil(ws) + 1, dh); }
    x.drawImage(Sc.haze.canvas, 0, Y0 + Sc.haze.top * bh * s, W, Sc.haze.canvas.height * s);
  }
  function flake6(px, py, r, rot, a) {   // a six-armed snowflake
    x.save(); x.translate(px, py); x.rotate(rot); x.globalAlpha = a; x.strokeStyle = '#ffffff'; x.lineCap = 'round'; x.lineWidth = Math.max(1.4, r * .11); x.shadowColor = 'rgba(190,220,255,.9)'; x.shadowBlur = r * .5;
    x.beginPath(); for (let k = 0; k < 6; k++) { const c = Math.cos(k * Math.PI / 3), s = Math.sin(k * Math.PI / 3); x.moveTo(0, 0); x.lineTo(c * r, s * r);
      for (const [d, l] of [[.55, .3], [.8, .2]]) for (const sg of [-1, 1]) { const bx = c * r * d, by = s * r * d, a2 = k * Math.PI / 3 + sg * 1.0; x.moveTo(bx, by); x.lineTo(bx + Math.cos(a2) * r * l, by + Math.sin(a2) * r * l); } }
    x.stroke(); x.restore();
  }
  function letterFlake(L, a) {   // a letter on a snowflake, ringed with gold like its place in the phrase
    flake6(L.x, L.y, L.r * 1.25, L.rot, a * .95);
    x.save(); x.globalAlpha = a; x.shadowColor = 'rgba(255,224,150,.95)'; x.shadowBlur = L.r * .7; x.fillStyle = '#f6f9ff'; x.beginPath(); x.arc(L.x, L.y, L.r * .68, 0, 6.283); x.fill();
    x.shadowColor = 'transparent'; x.lineWidth = Math.max(2.5, L.r * .09); x.strokeStyle = '#f1c256'; x.stroke();
    x.fillStyle = '#10295f'; x.font = `900 ${Math.round(L.r * 1.02)}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(L.ch, L.x, L.y + L.r * .05); x.restore();
  }
  function giftBox(f, t) {   // a gift: a red box with a gold ribbon and bow, rocking as it falls
    const r = f.r; x.save(); x.translate(f.x, f.y); x.rotate(calm ? 0 : Math.sin(t * 2.4 + f.ph) * .17);
    x.shadowColor = 'rgba(255,226,150,.95)'; x.shadowBlur = r * .75;
    x.fillStyle = '#f0503c'; rr(-r * .86, -r * .46, r * 1.72, r * 1.34, r * .14); x.fill(); x.shadowColor = 'transparent';                    // the box…
    x.fillStyle = '#ff7f6d'; rr(-r, -r * .76, r * 2, r * .46, r * .12); x.fill();                                                           // …and its lid
    x.fillStyle = '#ffd76a'; x.fillRect(-r * .17, -r * .76, r * .34, r * 1.64); x.fillRect(-r * .86, r * .08, r * 1.72, r * .27);          // the ribbon, down and across
    x.lineJoin = 'round'; x.lineWidth = Math.max(2, r * .1); x.strokeStyle = '#ffd76a'; x.fillStyle = '#ffeeb8';                              // the bow
    for (const sg of [-1, 1]) { x.beginPath(); x.moveTo(0, -r * .8); x.bezierCurveTo(sg * r * .2, -r * 1.5, sg * r * 1.0, -r * 1.36, sg * r * .62, -r * .9); x.bezierCurveTo(sg * r * .4, -r * .76, sg * r * .15, -r * .76, 0, -r * .8); x.closePath(); x.fill(); x.stroke(); }
    x.fillStyle = '#ffd76a'; x.beginPath(); x.arc(0, -r * .82, r * .14, 0, 6.283); x.fill();
    x.lineWidth = Math.max(1.5, r * .05); x.strokeStyle = 'rgba(255,255,255,.9)'; rr(-r * .86, -r * .46, r * 1.72, r * 1.34, r * .14); x.stroke(); rr(-r, -r * .76, r * 2, r * .46, r * .12); x.stroke();
    x.restore();
  }
  function toy(o) {   // what was in the gift, flying to its place: a twig arm, a red glove, a coal button or the scarf
    if (o.t < 0) return; const q = easeOut(o.t), [tx, ty] = spot(o.k), px = lerp(o.x, tx, q), py = lerp(o.y, ty, q) - Math.sin(Math.PI * q) * 46, r = lerp(15, 7, q), k = o.k;
    x.save(); x.translate(px, py); x.shadowColor = 'rgba(255,226,150,.95)'; x.shadowBlur = 14; x.lineCap = 'round'; x.lineJoin = 'round';
    if (k === 'scarf') { x.strokeStyle = '#ff5a45'; x.lineWidth = r * .8; x.beginPath(); x.ellipse(0, 0, r * 1.5, r * .7, 0, 0, 6.283); x.stroke();
      x.shadowColor = 'transparent'; x.beginPath(); x.moveTo(r * .9, r * .5); x.lineTo(r * 1.3, r * 2.2); x.moveTo(r * .6, r * .6); x.lineTo(r * .5, r * 2); x.stroke();
      x.strokeStyle = '#243f88'; x.lineWidth = r * .28; x.beginPath(); x.moveTo(r * 1.2, r * 1.7); x.lineTo(r * 1.26, r * 2); x.moveTo(r * .52, r * 1.55); x.lineTo(r * .5, r * 1.85); x.stroke(); }
    else if (k === 'armR' || k === 'armL') { const sg = k === 'armR' ? -1 : 1; x.rotate(q * 6.283 * sg);   // (it tumbles once on the way)
      x.strokeStyle = '#fff'; x.lineWidth = r * .62; x.beginPath(); x.moveTo(-r * 1.9, r * .5); x.lineTo(r * 1.9, -r * .5); x.moveTo(r * .5, -r * .12); x.lineTo(r * 1.2, -r * 1.2); x.stroke();
      x.shadowColor = 'transparent'; x.strokeStyle = '#8a5a36'; x.lineWidth = r * .38; x.stroke(); }
    else if (k === 'gloveR' || k === 'gloveL') { x.fillStyle = '#ff5a45'; x.beginPath(); x.ellipse(0, -r * .15, r * .95, r * 1.2, 0, 0, 6.283); x.fill(); x.shadowColor = 'transparent';
      x.beginPath(); x.arc((k === 'gloveR' ? 1 : -1) * r * .95, r * .1, r * .45, 0, 6.283); x.fill(); x.fillStyle = '#243f88'; rr(-r * .8, r * .85, r * 1.6, r * .6, r * .2); x.fill();
      x.lineWidth = Math.max(1.5, r * .14); x.strokeStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.ellipse(0, -r * .15, r * .95, r * 1.2, 0, 0, 6.283); x.stroke(); }
    else { x.fillStyle = '#262a42'; x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill(); x.shadowColor = 'transparent'; x.lineWidth = Math.max(1.5, r * .16); x.strokeStyle = 'rgba(255,255,255,.9)'; x.stroke();
      x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(-r * .32, -r * .34, r * .22, 0, 6.283); x.fill(); }
    x.restore();
  }
  // One icicle, hanging from (px, top): L long, w wide where it hangs, swung by ang. hot (0 … 1): it glows warm, because it is
  // the one that is about to fall.
  function icicle(px, top, L, w, ang, hot) {
    if (L < 2) return; x.save(); x.translate(px, top); x.rotate(ang);
    const g = x.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(.5, hot > 0 ? '#fff3cf' : '#dcedff'); g.addColorStop(1, hot > 0 ? '#ffd98a' : '#a9cdf7');
    if (hot > 0) { x.shadowColor = `rgba(255,214,120,${.55 + .45 * hot})`; x.shadowBlur = 8 + 16 * hot; }
    x.fillStyle = g; x.beginPath(); x.moveTo(-w / 2, -2); x.quadraticCurveTo(-w * .16, L * .5, 0, L); x.quadraticCurveTo(w * .16, L * .5, w / 2, -2); x.closePath(); x.fill();
    x.shadowColor = 'transparent'; x.lineCap = 'round'; x.lineWidth = Math.max(1, w * .08); x.strokeStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.moveTo(-w * .2, L * .05); x.quadraticCurveTo(-w * .1, L * .4, -w * .03, L * .72); x.stroke();   // a glint down one side
    x.restore();
  }
  function drawIce(t) {   // the frost along the top of the screen, and the icicles hanging from it: all tremble; the loose one wobbles
    const a = G.iceA; if (a <= 0) return; const hI = iceH(), wI = clamp(PW * .064, 18, 30); x.save(); x.globalAlpha = a;
    const fr = x.createLinearGradient(0, 0, 0, hI * .16); fr.addColorStop(0, '#ffffff'); fr.addColorStop(1, '#cfe2fb'); x.fillStyle = fr;
    x.beginPath(); x.moveTo(-4, -4); for (let px = -4; px <= W + 6; px += 6) x.lineTo(px, hI * .075 + 2.4 * Math.sin(px * .11) + 1.6 * Math.sin(px * .29 + 2)); x.lineTo(W + 6, -4); x.closePath(); x.fill();
    for (const c of G.ice) { const px = iceX(c), L = iceLen(c), w = c.w * wI; let ang = 0, hot = 0, top = 0;
      if (c.state === 'fall') { top = c.y; ang = calm ? 0 : c.rot * .2; hot = 1; }
      else if (c.state === 'shake') { const k = Math.min(1, c.t / .2); ang = calm ? 0 : .2 * Math.sin(t * 36 + c.ph) * k; top = calm ? 0 : Math.sin(t * 51) * 1.6; hot = calm ? .6 + .4 * Math.sin(t * 8) : 1; }
      else if (c.state === 'loose') { ang = calm ? 0 : .19 * Math.sin(t * 8.5 + c.ph); hot = calm ? .5 + .3 * Math.sin(t * 5) : .6; }
      else ang = calm ? 0 : .05 * Math.sin(t * c.f + c.ph) + .02 * Math.sin(t * 6.7 + c.ph * 3);
      icicle(px, top, L, w, ang, hot); }
    x.restore();
  }
  function drawSun(S) {   // pale and slowly pulsing while it warns, strong while it shines
    const a = lerp(calm ? .2 : .19 + .08 * Math.sin(S.t * 12), .56, smooth(WARN, WARN + .25, S.t)) * smooth(0, .25, S.t) * (1 - smooth(WARN + BURN, WARN + BURN + FADE, S.t));
    if (a <= 0) return; const gy = moundY(S.x), tw = S.w * .36, bw = S.w;
    x.save(); x.translate(S.x, gy + 5); x.scale(1, .22); x.fillStyle = `rgba(255,206,92,${Math.min(.62, a * 1.5)})`; x.beginPath(); x.arc(0, 0, bw * .56, 0, 6.283); x.fill(); x.restore();   // where it falls on the snow
    x.save(); x.globalCompositeOperation = 'lighter';
    for (const [k, m] of [[1, .55], [.72, .45]]) { const g = x.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, `rgba(255,236,160,${a * m})`); g.addColorStop(1, `rgba(255,212,104,${a * m * .7})`); x.fillStyle = g;
      x.beginPath(); x.moveTo(S.x - tw * k / 2, -12); x.lineTo(S.x + tw * k / 2, -12); x.lineTo(S.x + bw * k / 2, gy + 8); x.lineTo(S.x - bw * k / 2, gy + 8); x.closePath(); x.fill(); }
    let g = x.createRadialGradient(S.x, -H * .03, 4, S.x, -H * .03, S.w * 1.05); g.addColorStop(0, `rgba(255,246,196,${Math.min(1, a * 1.9)})`); g.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = g; x.fillRect(S.x - S.w * 1.1, 0, S.w * 2.2, S.w * 1.1);
    x.translate(S.x, gy + 5); x.scale(1, .22); g = x.createRadialGradient(0, 0, 4, 0, 0, bw * .62); g.addColorStop(0, `rgba(255,222,120,${Math.min(1, a * 1.5)})`); g.addColorStop(1, 'rgba(255,222,120,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, bw * .62, 0, 6.283); x.fill();
    x.restore();
  }
  function slots() {   // the phrase at the top, just under the icicles: outlines that fill with gold as the letters are caught
    const Y = layout(), fs = Y.fs, gap = fs * 1.02, y0 = Math.max(H * .085, 46, iceH() + fs * .62), at = [];
    Y.rows.forEach((row, j) => { const x0 = W / 2 - gap * (row.length - 1) / 2; [...row].forEach((ch, c) => { if (ch !== ' ') at.push([x0 + gap * c, y0 + j * fs * 1.16]); }); });
    return { fs, at, bottom: y0 + (Y.rows.length - 1) * fs * 1.16, wide: gap * (Math.max(...Y.rows.map(r => r.length)) - 1) + fs };
  }
  function draw() {
    const t = G.t; x.setTransform(DPR, 0, 0, DPR, 0, 0); x.clearRect(0, 0, W, H);
    const ph = G.phase, globeSide = G.logo && (ph === 'in' || ph === 'card2' || ph === 'back');
    const seen = G.logo ? !globeSide : ph === 'in' ? G.veil >= 1 : !G.back;   // (while the globe itself is on the screen, only what lies over it is drawn)
    const lens = c => { if (c) x.setTransform(DPR * c.a, DPR * c.b, DPR * c.c, DPR * c.d, DPR * c.tx, DPR * c.ty); else x.setTransform(DPR, 0, 0, DPR, 0, 0); };
    if (seen) {
      if (G.cam) { x.fillStyle = '#0b1530'; x.fillRect(0, 0, W, H); lens(G.cam); }   // (zoomed toward the logo)
      drawNight();   // the same winter night as in the glass, filling the screen
      let g = x.createRadialGradient(W / 2, H * .5, Math.min(W, H) * .35, W / 2, H * .5, Math.hypot(W, H) * .56); g.addColorStop(0, 'rgba(10,20,45,0)'); g.addColorStop(1, 'rgba(8,16,40,.6)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const flakes = far => { for (const f of G.amb) { if ((f.z < .5) !== far) continue; const sz = f.s * (1.2 + f.z * 1.6) * 2; x.globalAlpha = .45 + f.z * .5; x.drawImage(dotImg, f.u * W - sz / 2, f.v * H - sz / 2, sz, sz); } x.globalAlpha = 1; };
      flakes(true);
      if (G.hud > 0) { const S = slots(), hw = S.wide / 2 + S.fs * .7, y0 = S.at[0][1] - S.fs * .72, y1 = S.bottom + S.fs * .86;   // a soft dark band of sky where the phrase is, so its letters read over the moon (level on the screen, whatever the zoom)
        lens(null); x.save(); x.globalAlpha = G.hud * .46; x.shadowColor = 'rgba(6,12,34,1)'; x.shadowBlur = S.fs; x.fillStyle = 'rgb(6,12,34)'; rr(W / 2 - hw, y0, 2 * hw, y1 - y0, S.fs * .5); x.fill(); x.restore(); lens(G.cam); }
      // the figure, then the snow it stands in (with the marks in it going by, and his track), and its shadow on the snow
      const u = unit(), R = G.roll && !calm ? G.roll : null; let lift = 0;
      if (R) {   // tumbling forward, once over: he rolls along the snow as an egg would (lowest when he is on his side), with a small bounce
        const rp = clamp(R.t / ROLL, 0, 1), turn = 6.2832 * rp * (2 - rp), tall = (feetY() - headY()) / 2, across = Math.min(tall, wide());
        lift = Math.hypot(across * Math.sin(turn), tall * Math.cos(turn)) - tall + Math.sin(Math.PI * rp) * R.hop; const cy = feetY() - tall - lift;
        x.save(); x.translate(G.sx, cy); x.rotate(turn); x.translate(-G.sx, -cy); drawFigure(G.sx, feetY() - lift - figure.feetV * u, u); x.restore(); }
      else drawFigure(G.sx, feetY() - figure.feetV * u, u);
      x.beginPath(); x.moveTo(0, H); for (let px = 0; px <= W + 8; px += 8) x.lineTo(px, moundY(px)); x.lineTo(W, H); x.closePath();
      g = x.createLinearGradient(0, groundY - 4, 0, H); g.addColorStop(0, '#f7faff'); g.addColorStop(1, '#cfdcf6'); x.fillStyle = g; x.fill();
      x.save(); x.clip();
      { const span = W + 260; for (let k = 0; k < 11; k++) { const row = k * 37 % 5, f = 1 + row * .13, mx = ((k * 211.7 + 60 - G.walk * f) % span + span) % span - 130, rx = 15 + (k * 53 % 4) * 7;   // drifts and hollows in the snow: the nearer ones (lower down) go by faster
          x.fillStyle = 'rgba(150,176,228,.36)'; x.beginPath(); x.ellipse(mx, moundY(mx) + 13 + row * 13, rx, rx * .19, 0, 0, 6.283); x.fill(); } }
      { const r0 = foot() * .55; for (const m of G.trail) { x.fillStyle = `rgba(150,176,228,${.5 * clamp(1 - (G.sx - m.x) / (W * .9), 0, 1)})`; x.beginPath(); x.ellipse(m.x, moundY(m.x) + 3, r0, r0 * .32, 0, 0, 6.283); x.fill(); } }
      for (const o of G.obs) if (o.kind === 'fire') look.pool(x, o.x, restY(o.x), o.k, t, o);   // the light of each campfire on the snow
      { const air = clamp((figure.air || 0) * 4 + (G.jy + Math.max(0, lift)) / peak(), 0, 1), rx = reach() * 1.3 * (1 - air * .3); x.translate(G.sx, moundY(G.sx) + 3); x.scale(1, .24); const sh = x.createRadialGradient(0, 0, rx * .15, 0, 0, rx);   // (smaller and paler while he is in the air)
        sh.addColorStop(0, `rgba(36,58,112,${.34 * (1 - air * .5)})`); sh.addColorStop(1, 'rgba(36,58,112,0)'); x.fillStyle = sh; x.beginPath(); x.arc(0, 0, rx, 0, 6.283); x.fill(); }
      x.restore();
      for (const c of G.ice) if (c.state === 'shake' || c.state === 'fall') {   // where the icicle will land: a dark mark on the snow
        const px = iceX(c), k = c.state === 'fall' ? 1 : smooth(0, .3, c.t) * (calm ? 1 : .75 + .25 * Math.sin(t * 14)), rx = clamp(PW * .075, 24, 44);
        x.save(); x.translate(px, moundY(px) + 4); x.scale(1, .26); x.fillStyle = `rgba(30,52,110,${.5 * k})`; x.beginPath(); x.arc(0, 0, rx, 0, 6.283); x.fill(); x.lineWidth = 3; x.strokeStyle = `rgba(255,214,120,${.9 * k})`; x.stroke(); x.restore(); }
      for (const h of G.heaps) look.heap(x, h.x, restY(h.x), h.r, smooth(.1, .75, h.t));   // a snowball he has lost
      for (const o of G.obs) { if (o.kind === 'fire') { o.lean = G.going; look.fire(x, o.x, restY(o.x), o.k, t, o); } else look.branch(x, o.x, restY(o.x), barTop, o.k, o); }   // what lies in his way
      if (G.singe && !R) {   // a campfire has caught him: for a moment the end of his scarf, the top of his hat and (only just) the tip of his nose burn, with the campfire's own fire
        const sg = G.singe, a = calm ? 1 : smooth(0, .14, sg.t) * (1 - smooth(SINGE - .55, SINGE, sg.t)), b = body(), hr = (b ? b.balls[1][2] : (figure.reach || .3) * .5) * u; sg.at = [];
        for (const [n, tall, w, glow, sparks] of FLAMES) { const q = sg.on.includes(n) && mark(n); if (!q) continue; look.flame(x, q[0], q[1], hr * tall / 62, t, { ph: sg.ph + n.length * .29, lean: G.going, a, w, glow, sparks, cover: .78 }); sg.at.push([n, q[0], q[1], hr * tall]); } }
      flakes(false);
      if (G.sun) drawSun(G.sun);
      for (const s of G.sparks) flake6(s.x, s.y, s.r, s.rot, .9);
      for (const f of G.big) { if (f.kind === 'blank') { flake6(f.x, f.y, f.r * 1.3, f.rot, .95); x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(f.x, f.y, f.r * .16, 0, 6.283); x.fill(); } else if (f.kind === 'gift') giftBox(f, t); else letterFlake(f, 1); }
      drawIce(t);
      for (const o of G.toys) toy(o);
      for (const p of G.pops) { x.globalAlpha = 1 - p.t / p.life; x.fillStyle = p.col; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 6.283); x.fill(); } x.globalAlpha = 1;
      for (const q of G.gains) {   // points just earned: "+100" rising from where they were earned (the big ones in gold)
        const p = q.t / 1.15, big = q.n >= 50, fs = (big ? 22 : 16) * clamp(PW / 393, .9, 1.3), txt = '+' + fmt(q.n) + (q.tag ? ' ' + q.tag : ''), py = q.y - (calm ? 24 : 12 + 40 * easeOut(p));
        x.save(); x.globalAlpha = 1 - smooth(.62, 1, p); x.font = `900 ${fs}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; const half = x.measureText(txt).width / 2 + 8, px = clamp(q.x, half, Math.max(half, W - half)); x.lineWidth = fs * .3; x.strokeStyle = 'rgba(8,14,32,.9)'; x.strokeText(txt, px, py); x.fillStyle = big ? '#ffe08a' : '#ffffff'; x.fillText(txt, px, py); x.restore(); }
      // the phrase made of snow
      if (G.word3) { const hold = G.phase === 'word' ? smooth(.2, 1.4, G.pt) : 1, fade = G.phase === 'out' ? 1 - smooth(0, .5, G.pt) : 1;
        const WW = wordW(), fs = WW * (G.wfs || .25), lh = WW * (G.wlh || .27), wy = wordY(), rows = G.rows || [G.word], nr = rows.length;
        { x.save(); x.globalAlpha = hold * fade * .5; x.translate(W / 2, wy); x.scale(1, Math.max(.3, (fs * 1.5 + lh * (nr - 1)) / WW)); const dk = x.createRadialGradient(0, 0, WW * .1, 0, 0, WW * .62); dk.addColorStop(0, 'rgba(6,12,34,1)'); dk.addColorStop(1, 'rgba(6,12,34,0)'); x.fillStyle = dk; x.beginPath(); x.arc(0, 0, WW * .62, 0, 6.283); x.fill(); x.restore(); }   // a darker patch of sky behind the phrase, so it reads against the moon
        if (G.phase === 'word' && hold > .4) { x.save(); x.globalAlpha = (hold - .4) * .42; x.fillStyle = '#ffffff'; x.shadowColor = '#bfe0ff'; x.shadowBlur = 30; x.font = `900 ${fs}px ${FONT}`;
          x.textAlign = 'center'; x.textBaseline = 'middle'; rows.forEach((r, j) => x.fillText(r, W / 2, wy + (j - (nr - 1) / 2) * lh + fs * .04)); x.restore(); }
        for (const p of G.word3) { const sz = p.s * (1 + .14 * Math.sin(t * 5 + p.ph)); x.globalAlpha = fade * (.82 + .18 * Math.sin(t * 3 + p.ph * 2)); x.drawImage(dotImg, p.x - sz / 2, p.y - sz / 2, sz, sz); } x.globalAlpha = 1;
        const sa = (G.phase === 'word' ? smooth(1, 1.6, G.pt) : 1) * fade;   // …and under it, the score
        if (sa > 0) { const f2 = clamp(PW * .074, 24, 42), sy = wy + (fs + lh * (nr - 1)) / 2 + f2 * 1.05, txt = 'SCORE ' + fmt(G.shown); x.save(); x.globalAlpha = sa; x.font = `900 ${f2}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
          x.lineWidth = f2 * .22; x.strokeStyle = 'rgba(8,14,32,.9)'; x.strokeText(txt, W / 2, sy); x.shadowColor = 'rgba(255,214,120,.9)'; x.shadowBlur = f2 * .4; x.fillStyle = '#ffe08a'; x.fillText(txt, W / 2, sy); x.restore(); } }
      // a glint of the glass, top left: we are inside the globe
      x.save(); x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,.14)'; x.lineWidth = Math.min(W, H) * .028; x.beginPath(); x.arc(W * .5, H * .62, Math.hypot(W, H) * .56, Math.PI * 1.14, Math.PI * 1.3); x.stroke(); x.restore();
      lens(null);
      // the phrase at the top: caught letters in gold, the one that is needed next pulsing
      if (G.hud > 0) { const S = slots(); x.save(); x.globalAlpha = G.hud; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
        G.letters.forEach((ch, k) => { const got = k < G.i && !G.fly.some(f => f.k === k), [px, py] = S.at[k], next = k === G.i && G.phase === 'play', beat = next && !calm ? 1 + .09 * Math.sin(t * 5.5) : 1, fs = S.fs * beat; x.font = `900 ${fs}px ${FONT}`;
          if (got) { x.shadowColor = 'rgba(255,214,120,.9)'; x.shadowBlur = fs * .35; x.fillStyle = '#f6d37f'; x.fillText(ch, px, py); x.shadowColor = 'transparent'; x.lineWidth = Math.max(1.5, fs * .04); x.strokeStyle = 'rgba(60,36,4,.55)'; x.strokeText(ch, px, py); x.fillText(ch, px, py); }
          else if (next) { x.fillStyle = 'rgba(8,16,40,.45)'; x.fillText(ch, px, py); x.shadowColor = 'rgba(255,214,120,.95)'; x.shadowBlur = fs * .3; x.lineWidth = Math.max(2.5, fs * .07); x.strokeStyle = '#ffe08a'; x.strokeText(ch, px, py); x.shadowColor = 'transparent';
            x.fillStyle = '#ffe08a'; x.beginPath(); x.moveTo(px - fs * .16, py + fs * .66); x.lineTo(px + fs * .16, py + fs * .66); x.lineTo(px, py + fs * .5); x.closePath(); x.fill(); }   // (a small pointer under it)
          else { x.fillStyle = 'rgba(8,16,40,.5)'; x.fillText(ch, px, py); x.lineWidth = Math.max(2, fs * .055); x.strokeStyle = 'rgba(255,255,255,.9)'; x.strokeText(ch, px, py); } });
        for (const f of G.fly) { const q = easeOut(f.t), [sx, sy] = S.at[f.k], px = lerp(f.x, sx, q), py = lerp(f.y, sy, q) - Math.sin(Math.PI * q) * 40, fs = lerp(f.r * 1.02, S.fs, q); x.font = `900 ${fs}px ${FONT}`; x.shadowColor = 'rgba(255,214,120,.9)'; x.shadowBlur = fs * .4; x.fillStyle = '#ffe9a8'; x.fillText(f.ch, px, py); x.shadowColor = 'transparent'; }
        // a few words under it, when there is something to say
        const N = G.note, ha = N && G.phase === 'play' ? smooth(0, .3, t - N.t0) * (1 - smooth(N.dur - .5, N.dur, t - N.t0)) : 0;
        const sfs = clamp(PW * .05, 16, 25), sby = S.bottom + S.fs * .78 + sfs * .9;   // the score, in its own place under the phrase all through the game (the number swells for a moment when it goes up)
        if (G.phase === 'play') { const fs = sfs, f2 = fs * (calm ? 1.08 : 1.08 + .2 * Math.max(0, 1 - (t - G.gainT) / .22)), num = fmt(G.shown), by = sby;
          x.globalAlpha = G.hud * smooth(.2, .8, t); x.font = `800 ${fs}px ${FONT}`; const w1 = x.measureText('SCORE ').width; x.font = `900 ${f2}px ${FONT}`; const w2 = x.measureText(num).width, w = w1 + w2 + fs * 1.6, x0 = W / 2 - (w1 + w2) / 2;
          x.fillStyle = 'rgba(8,14,32,.62)'; rr(W / 2 - w / 2, by - fs * .9, w, fs * 1.8, fs * .9); x.fill(); x.textAlign = 'left'; x.font = `800 ${fs}px ${FONT}`; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillText('SCORE ', x0, by + fs * .04);
          x.font = `900 ${f2}px ${FONT}`; x.fillStyle = '#ffe08a'; x.fillText(num, x0 + w1, by + fs * .04); x.textAlign = 'center'; }
        if (ha > 0) { let fs = clamp(PW * .052, 17, 26); x.globalAlpha = ha * G.hud; x.font = `800 ${fs}px ${FONT}`; let w = x.measureText(N.txt).width; if (w > PW * .86) { fs *= PW * .86 / w; x.font = `800 ${fs}px ${FONT}`; w = PW * .86; } w += fs * 1.6; const by = sby + sfs * .9 + 6 + fs * .9;   // (a few words of help, just under the score)
          x.fillStyle = 'rgba(8,14,32,.72)'; rr(W / 2 - w / 2, by - fs * .9, w, fs * 1.8, fs * .9); x.fill(); x.fillStyle = '#ffffff'; x.fillText(N.txt, W / 2, by + fs * .04); }
        x.restore(); }
    } else if (globeSide && G.cam && G.view) {   // over the globe as the view goes into it: the figure once more, sharp
      const gl = globe.glass, a = smooth(1.3, 2.2, G.cam.Z);
      if (a > 0) { lens(G.cam); x.save(); x.beginPath(); x.rect(gl.x - gl.r, gl.y - gl.r, 2 * gl.r, (1 + figure.feetV - .16) * gl.r); x.clip(); x.globalAlpha = a; drawFigure(gl.x, gl.y, gl.r); x.restore(); lens(null); }
    }
    if (G.logo) { drawPlate(); return; }
    // the white of rushing snow, between the globe and the game
    if (G.veil > 0) { const v = G.veil; x.fillStyle = `rgba(244,248,255,${smooth(.25, 1, v)})`; x.fillRect(0, 0, W, H);
      if (!calm) { const m = Math.hypot(W, H) * .6; for (let k = 0; k < 54; k++) { const a = k * 2.399, rr2 = ((k * 37 % 54) / 54 * .7 + .3) * m * Math.pow(v, 1.6), sz = (6 + (k % 7) * 5) * (1 + v * 3); x.globalAlpha = clamp(v * 1.4, 0, 1) * .9; x.drawImage(dotImg, W / 2 + Math.cos(a) * rr2 - sz / 2, H * .5 + Math.sin(a) * rr2 - sz / 2, sz, sz); } x.globalAlpha = 1; } }
  }

  /* ── zooming the globe itself (the stage holds its two canvases) ── */
  function zoomTo(z) {   // z = 1: as it is; bigger: toward the glass, which ends up filling the screen
    const gl = globe.glass; if (z <= 1.001) { stage.style.transform = ''; stage.style.willChange = ''; return; }
    stage.style.willChange = 'transform'; stage.style.transformOrigin = `${gl.x}px ${gl.y}px`;
    const k = (z - 1) / Math.max(.001, G.zoom - 1); stage.style.transform = `translate(${(W / 2 - gl.x) * k}px, ${(H / 2 - gl.y) * k}px) scale(${z})`;
  }

  /* ── through the logo: when the figure has a logo on it (figure.focus, figure.badge), the way into the game is a zoom into
     that logo until it fills the screen, then a zoom back out of the same logo into the game; and the same on the way back ── */
  const TZ = 1.15, TH = .35;   // seconds: each zoom, and the moment the logo is held between them
  const tint = (hex, f) => { const v = parseInt(String(hex || '#243f88').replace('#', '').slice(0, 6), 16) || 0; return `rgb(${[16, 8, 0].map(sh => Math.round(Math.min(255, ((v >> sh) & 255) * f))).join(',')})`; };
  const plateGeo = () => ({ x: W / 2, y: H * .5, hw: Math.min(W * .8, H * .42 * figure.badge.aspect) / 2 });   // the logo on its card: level, in the middle
  // where the logo is on the page when nothing is zoomed: its middle, half its width and height, and its tilt
  function logoAt(ox, oy, u) { const F = figure.focus; if (!F || !(F.front > .45)) return G.geo;
    return (G.geo = { x: ox + F.x * u, y: oy + F.y * u, hw: Math.max(2, Math.hypot(F.ux, F.uy) * u), ang: Math.atan2(F.uy, F.ux), ux: F.ux * u, uy: F.uy * u, vx: F.vx * u, vy: F.vy * u }); }
  // the view for an amount of zoom e (0 = as it is … 1 = the logo level, in the middle, as big as on its card)
  function camFor(g, e) {
    if (!g || !(e > 0)) return null; const P = plateGeo(), Z1 = Math.max(1, P.hw / g.hw), Z = Math.pow(Z1, e), m = Z1 > 1.001 ? (Z - 1) / (Z1 - 1) : e, rot = -g.ang * e;
    const cx = g.x + (P.x - g.x) * m, cy = g.y + (P.y - g.y) * m, co = Math.cos(rot) * Z, si = Math.sin(rot) * Z;
    return { Z, rot, a: co, b: si, c: -si, d: co, tx: cx - (co * g.x - si * g.y), ty: cy - (si * g.x + co * g.y),
      lx: cx, ly: cy, ux: co * g.ux - si * g.uy, uy: si * g.ux + co * g.uy, vx: co * g.vx - si * g.vy, vy: si * g.vx + co * g.vy };   // (the logo on the screen: its middle, half its width and half its height, as arrows)
  }
  const unCam = (c, sx, sy) => { const dx = sx - c.tx, dy = sy - c.ty, k = c.Z * c.Z; return [(c.d * dx - c.c * dy) / k, (-c.b * dx + c.a * dy) / k]; };   // a point on the screen, back in the unzoomed picture
  function setStage(c) { if (!c) { stage.style.transform = ''; stage.style.willChange = ''; return; }
    stage.style.willChange = 'transform'; stage.style.transformOrigin = '0 0'; stage.style.transform = `matrix(${c.a.toFixed(5)},${c.b.toFixed(5)},${c.c.toFixed(5)},${c.d.toFixed(5)},${c.tx.toFixed(2)},${c.ty.toFixed(2)})`; }
  // The logo, sharp, drawn over the one on the figure (which is then switched off, so there is only ever one), and its colour
  // spreading out behind it until that is all there is. Small, it takes the shape the logo has on the hat (tilted, seen a little
  // from below); as it grows it straightens, and on its card it is exactly itself: level and in its true proportions.
  function drawPlate() {
    const e = G.e, B = figure.badge; if (!(e > 0) || !B) return; const c = G.cam, flat = calm || !c, P = plateGeo();
    const mx = flat ? P.x : c.lx, my = flat ? P.y : c.ly, aF = flat ? e : smooth(.5, .96, e), aL = flat ? e : smooth(.08, .22, e);
    if (aF > 0) { x.globalAlpha = aF; const r = x.createRadialGradient(mx, my, 0, mx, my, Math.hypot(W, H) * .62); r.addColorStop(0, tint(B.color, 1.22)); r.addColorStop(1, tint(B.color, .72)); x.fillStyle = r; x.fillRect(0, 0, W, H); }
    if (aL > 0 && B.image) { let ux = P.hw, uy = 0, vx = 0, vy = P.hw / B.aspect;
      if (!flat) { const w = Math.hypot(c.ux, c.uy), a = Math.atan2(c.uy, c.ux), k = smooth(.15, .8, e); ux = c.ux; uy = c.uy; vx = lerp(c.vx, -Math.sin(a) * w / B.aspect, k); vy = lerp(c.vy, Math.cos(a) * w / B.aspect, k); }
      x.globalAlpha = aL; x.save(); x.transform(ux, uy, vx, vy, mx, my); x.drawImage(B.image, -1, -1, 2, 2); x.restore(); }
    x.globalAlpha = 1;
  }
  function logoFrame(dt) {
    const gl = globe.glass, T = calm ? .45 : TZ, hold = calm ? .5 : TH, chime = () => { globe.bell(1568, 0, .05); globe.bell(2093, .09, .04); };
    figure.sharp = G.phase === 'play' || G.phase === 'word' ? 0 : 1280;
    if (G.phase === 'in') {             // over the globe: the figure turns to face us, and the view goes into the logo on its hat
      G.pt += dt; G.t += dt; const p = clamp(G.pt / T, 0, 1);
      G.e = smooth(.06, 1, p); figure.pose = Object.assign(FRONT(), { yaw: G.yaw0 * (1 - smooth(0, .28, p)) }); G.cam = calm ? null : camFor(logoAt(gl.x, gl.y, gl.r), G.e); setStage(G.cam); renderFigure(0, gl.x, gl.y, gl.r, false);
      if (p >= 1) { G.phase = 'card'; G.pt = 0; G.e = 1; G.cam = null; G.geo = null; setStage(null); globe.rest(true); figure.grow(1, true); G.hud = 0; chime(); }
    } else if (G.phase === 'card') {    // the logo fills the screen for a moment; behind it the game takes the globe's place (and of the snowman, only his head is left)
      step(dt); renderFigure(dt, G.sx, midY(), unit(), true);
      if (G.pt >= hold) { G.phase = 'open'; G.pt = 0; }
    } else if (G.phase === 'open') {    // out of the logo, into the game
      step(dt); const p = clamp(G.pt / T, 0, 1);
      G.e = 1 - smooth(0, .94, p); G.cam = calm ? null : camFor(logoAt(G.sx, midY(), unit()), G.e); G.hud = smooth(.7, 1, p); renderFigure(dt, G.sx, midY(), unit(), true);
      if (p >= 1) { G.e = 0; G.cam = null; G.geo = null; G.hud = 1; begin(); }
    } else if (G.phase === 'out') {     // the phrase is spelled: into the logo again
      step(dt); const p = clamp(G.pt / T, 0, 1);
      G.e = smooth(.06, 1, p); G.cam = calm ? null : camFor(logoAt(G.sx, midY(), unit()), G.e); renderFigure(dt, G.sx, midY(), unit(), true);
      if (p >= 1) { G.phase = 'card2'; G.pt = 0; G.e = 1; G.cam = null; G.geo = null; G.back = { t: 0 }; figure.made = null; figure.pose = FRONT(); globe.rest(false); chime(); try { G.done && G.done(); } catch (e) {} }
    } else if (G.phase === 'card2') {   // behind the logo the globe is back, its snow flying (and the snowman in it is whole)
      G.pt += dt; G.back.t += dt; figure.pose = FRONT(); if (G.pt >= hold + .1) { G.phase = 'back'; G.pt = 0; }
    } else if (G.phase === 'back') {    // out of the logo, back to the globe
      G.pt += dt; G.back.t += dt; const p = clamp(G.pt / T, 0, 1);
      G.e = 1 - smooth(0, .94, p); figure.pose = FRONT(); G.cam = calm ? null : camFor(logoAt(gl.x, gl.y, gl.r), G.e); setStage(G.cam); renderFigure(0, gl.x, gl.y, gl.r, false);
      if (p >= 1) { setStage(null); figure.pose = null; figure.sharp = 0; figure.made = null; finish(); }
    } else {                            // the game itself
      step(dt); if (G.phase === 'out') { G.pt = 0; [659.25, 880, 1174.66].forEach((f, k) => globe.bell(f, k * .1, .045)); }
      renderFigure(dt, G.sx, midY(), unit(), true);
    }
  }

  // The two sounds that go round. The winter night lies under the whole game: it comes up as the game appears behind the logo and
  // goes as the view leaves again. A campfire crackles: faintly when it sets out, more and more as it comes, most as it reaches
  // him, and less again as it goes by; and from the side it is on.
  function ambience() {
    if (!sounds || !sounds.loop) return; if (!night) { night = sounds.loop('night'); fire = sounds.loop('fire'); }
    const p = G.phase, there = p === 'card' || p === 'open' || p === 'play' || p === 'word'; let v = 0, pan = 0;
    if (p === 'play') for (const o of G.obs) if (o.kind === 'fire') { const q = Math.pow(clamp(1 - Math.abs(o.x - G.sx) / (PW * 1.15), 0, 1), 2); if (q > v) { v = q; pan = clamp((o.x - G.sx) / (PW * .45), -1, 1) * .8; } }
    night.set(there ? 1 : 0, 0); fire.set(v, pan);
  }
  function frame(now) {
    if (!G) return; const dt = clamp((now - last) / 1000, 0, .05); last = now;
    if (G.logo) { logoFrame(dt); if (!G) return; }
    else if (G.phase === 'in') {        // zoom in; the snow rushes up white; then the game is there
      G.pt += dt; const p = G.pt / (calm ? .6 : 1.25);
      if (!calm) zoomTo(lerp(1, G.zoom, easeIn(p))); G.veil = smooth(.5, 1, p); G.t += dt;
      if (p >= 1) { zoomTo(1); globe.rest(true); G.veilOut = .5; figure.grow(1, true); begin(); }
    } else {
      if (G.veilOut > 0) { G.veilOut -= dt; G.veil = clamp(G.veilOut / .5, 0, 1); }
      step(dt); if (!G.back) renderFigure(dt, G.sx, midY(), unit(), true);
      if (G.phase === 'out') {          // the phrase bursts into white; behind it the globe comes back, close up, and pulls away
        if (!G.back) { G.veil = smooth(0, .45, G.pt); if (G.pt >= .5) { G.back = { t: 0 }; figure.pose = null; figure.made = null; globe.rest(false); try { G.done && G.done(); } catch (e) {} if (!calm) zoomTo(1.9 > G.zoom ? G.zoom : 1.9); } }
        else { G.back.t += dt; const q = G.back.t / (calm ? .5 : 1.3); G.veil = 1 - smooth(0, .42, q); if (!calm) zoomTo(lerp(Math.min(1.9, G.zoom), 1, easeOut(q)));
          if (q >= 1) { zoomTo(1); finish(); return; } }
      }
    }
    try { ambience(); } catch (e) {}
    draw(); raf = requestAnimationFrame(frame);
  }

  /* ── input ── */
  // One finger (or the mouse) steers: he follows it. Any other finger that touches the screen meanwhile is a jump.
  const toX = e => { if (G && G.phase === 'play') { G.tx = e.clientX; G.touchT = G.t; } };
  cv.addEventListener('pointerdown', e => { if (!G) return; if (e.isPrimary) G.steer = null;   // (the first finger down is the steering one, whatever went before)
    if (G.steer != null && e.pointerId !== G.steer) { ask(); return; } G.steer = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (er) {} toX(e); });
  cv.addEventListener('pointermove', e => { if (!G || (e.pointerType === 'mouse' && !e.buttons) || (G.steer != null && e.pointerId !== G.steer)) return; toX(e); });
  const lift = e => { if (G && e.pointerId === G.steer) G.steer = null; }; for (const n of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(n, lift);
  btn.addEventListener('pointerdown', e => { e.preventDefault(); ask(); }); btn.addEventListener('click', ask);   // (click: the keyboard, or a screen reader's double tap)
  // The arrows beside JUMP: held down, he slides that way (gently at first, then as fast as with an arrow key). A short tap
  // is one step (a fifth of the way across), and so is a press from the keyboard or a screen reader's double tap.
  const arrowKey = (b, k, dir) => { let down = false, t0 = -1e9, t1 = -1e9, tx0 = 0; const STEP = () => dir * PW * .2, room = v => clamp(v, PX + edge(), PX + PW - edge());
    const set = on => { down = on; b.style.background = on ? LIT : GOLD; if (G) { G.pad[k] = on && G.phase === 'play' ? 1 : 0; if (on) { tx0 = G.tx; G.touchT = G.t; } } };
    b.addEventListener('pointerdown', e => { e.preventDefault(); t0 = performance.now(); try { b.setPointerCapture(e.pointerId); } catch (er) {} set(true); });
    for (const n of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(n, e => { if (!down) return; set(false); t1 = performance.now();
      if (n === 'pointerup' && G && G.phase === 'play' && t1 - t0 < 230) G.tx = room(tx0 + STEP()); });   // a tap: one step from where he was heading
    b.addEventListener('click', () => { if (G && G.phase === 'play' && performance.now() - Math.max(t0, t1) > 500) { G.tx = room(G.tx + STEP()); G.touchT = G.t; } });   // (not the click that follows a press already dealt with)
    b.addEventListener('contextmenu', e => e.preventDefault()); };
  arrowKey(btnL, 'l', -1); arrowKey(btnR, 'r', 1);
  const key = on => e => { if (!G) return; const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { G.keys.l = on; e.preventDefault(); } if (k === 'ArrowRight' || k === 'd' || k === 'D') { G.keys.r = on; e.preventDefault(); }
    if (k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || k === 'w' || k === 'W') { if (on && !e.repeat) ask(); e.preventDefault(); } };
  addEventListener('keydown', key(1)); addEventListener('keyup', key(0));
  addEventListener('deviceorientation', e => { if (!G || e.gamma == null) return; const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    const tip = ang === 90 ? e.beta : ang === -90 || ang === 270 ? -e.beta : ang === 180 ? -e.gamma : e.gamma; G.tilt = clamp(Math.sin(tip * Math.PI / 180) * 1.6, -1, 1); if (G.tilt0 == null) G.tilt0 = G.tilt; });

  return {
    get playing() { return !!G; },
    // play one round: a word, or a phrase of two (or a few) words. back() is called at the moment the globe is on screen again
    // (still hidden: in white, or behind the logo).
    play(word, back) {
      if (G) return Promise.resolve(false);
      return new Promise(fin => {
        bar.style.display = 'flex'; bar.style.visibility = 'hidden';   // (in place, so the snow can begin just above the buttons; they show when the game is on)
        size(); addEventListener('resize', size);
        const text = String(word || WORDS[0]).toUpperCase().replace(/[^A-Z ]/g, ' ').trim().split(/\s+/).filter(Boolean).slice(0, 4).join(' ').slice(0, 20).trim() || WORDS[0];
        G = newRound(text); G.done = back; G.fin = r => fin(r);
        const gl = globe.glass; G.zoom = Math.max(1.6, 1.06 * Math.hypot(W, H) / 2 / Math.max(20, gl.r));
        G.logo = !!(figure.focus && figure.badge && figure.badge.image);   // a figure with a logo: the way in and out is through the logo
        if (G.logo) { G.yaw0 = figure.facing || 0; [523.25, 659.25, 783.99].forEach((f, k) => globe.bell(f, k * .1, .045)); }
        whoosh();
        cv.style.display = 'block'; last = performance.now(); raf = requestAnimationFrame(frame);
      });
    },
    jump: ask,   // (the same as pressing JUMP)
    // (for testing) give him this much snow and these parts, and put something in his way a little way ahead: test({ snow, got: [names], ob: ['branch' | 'fire', pixels ahead] })
    test(o) { if (!G || !o) return; if (o.snow != null) { G.snow = clamp(+o.snow, 0, MOST); G.snap = true; } for (const k of o.got || []) G.got[k] = true; if (o.ob) { const q = spawnOb(o.ob[0]); if (o.ob[1] != null) q.x = G.sx + o.ob[1]; } },
    // (for testing)
    get state() { return G && { phase: G.phase, word: G.word, i: G.i, n: G.letters.length, caught: G.caught, snow: G.snow, most: MOST, full: FULL, nt: NT, pieces, sunshine: SUNSHINE, made: made(), got: Object.keys(G.got), flakes: G.flakes, gifts: G.gifts, misses: G.misses, hits: G.hits, melts: G.melts,
      sx: G.sx, grab: grab(), reach: reach(), wide: wide(), edge: edge(), top: headY(), feet: feetY(), ground: groundY, hf: G.hf, W, H, PX, PW, t: G.t, pt: G.pt, back: G.back ? G.back.t : null, logo: G.logo, e: G.e, Z: G.cam ? G.cam.Z : 1, cam: G.cam, view: G.view, figAt: [G.sx, midY(), unit()], note: G.note && G.note.txt, hudBottom: slots().bottom, hudFs: slots().fs, iceH: iceH(),
      letter: G.letter && { ch: G.letter.ch, x: G.letter.x, y: G.letter.y, r: G.letter.r }, gift: G.gift && { x: G.gift.x, y: G.gift.y, r: G.gift.r }, big: G.big.map(f => ({ kind: f.kind, ch: f.ch, x: f.x, y: f.y, r: f.r, vy: f.vy })), sparks: G.sparks.map(s => ({ x: s.x, y: s.y, r: s.r })),
      ice: G.ice.filter(c => !c.deco).map(c => ({ x: iceX(c), len: iceLen(c), state: c.state, t: c.t, y: c.y })), shake: SHAKE, iceAt: G.iceAt, toys: G.toys.map(o => o.k),
      jy: G.jy, jumps: G.jumps, peak: peak(), jt: JT, walk: G.walk, pace: pace(), going: G.going, foot: foot(), obs: G.obs.map(o => ({ kind: o.kind, x: o.x, hx: o.hx, hh: o.hh, hit: o.hit, done: o.done })), trips: G.trips, burns: G.burns, singe: G.singe && { t: G.singe.t, left: SINGE - G.singe.t, on: G.singe.on, at: G.singe.at.map(q => [q[0], Math.round(q[1] * 10) / 10, Math.round(q[2] * 10) / 10, Math.round(q[3] * 10) / 10]) }, marks: ['hat', 'nose', 'scarf'].map(n => [n, mark(n)]), cleared: G.cleared, obN: G.obN, snd: { night: night ? night.level : 0, fire: fire ? [fire.level, fire.pan] : [0, 0], stepAt: G.stepAt }, lit, button: bar.style.visibility === 'visible', barTop, roll: G.roll && { p: clamp(G.roll.t / ROLL, 0, 1), hop: G.roll.hop, far: G.roll.far }, rush: G.rush, heaps: G.heaps.map(h => ({ x: h.x, r: h.r, t: h.t })), pad: G.pad, tx: G.tx, score: G.score, pts: G.pts, secs: G.secs, doneAt: G.doneAt, gains: G.gains.map(q => q.n),
      sun: G.sun && { x: G.sun.x, w: G.sun.w, t: G.sun.t, done: G.sun.done, warn: WARN, burn: BURN } }; }
  };
}
