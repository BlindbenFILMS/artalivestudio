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

   THE RIDE (when the page hands in a snowmobile: `ride`). Before the snowflakes spell the phrase, the BIG GIFT comes down: a
   big red box lands in the snow ahead of him, shakes and bursts open, and in the puff of snow he is on the Ora snowmobile
   (figures/ora-snowmobile.js). He rides through the wood: JUMP (or a tap on the screen) hops it over campfires and branches,
   and up to the Ora coins. He is FREE TO MOVE along the snow: the two buttons beside JUMP are SLOWER and FASTER (so are the
   arrow keys, and a finger sliding on the screen), and they bring the snowmobile back and forward. How far forward it is, is
   how fast it is going, and the faster it is going the higher it jumps: the top coins want speed and then a jump at the right
   moment. (The whole ride goes by faster with it: the ride's seconds are seconds of track. The wood behind goes by faster
   too, streaks of air rush past, and the engine rises.) On a narrow screen the ride is seen from further back, so that about
   two lengths of the way ahead show when it is at the back.
   SNOWFLAKES FALL AGAIN on the ride, one letter at a time, and spell GOOD TIDINGS (the phrase at the top of the screen while he
   rides). Most come down ahead of him: he has to be brought forward to be under them. Each time it is spelled the lamp gains
   light, and it begins again. (When the ride is over the snowflakes spell the phrase of the round, as before.)
   RAMPS of snow come along, the first within the first few seconds. A ramp throws the snowmobile into a jump by itself, and
   JUMP pressed near its top makes that jump a good deal bigger (BIG AIR): the coins over a ramp want that, or speed. Later in the ride a ramp may have two things
   after it, the second just where the ramp's own jump comes down: only the big jump, or speed, clears both.
   The ride is about LIGHT. It begins in the dark, and stretches of the wood are dark all along: there the headlight shows what
   is coming (a campfire shows by its own light, and lights what is near it). Every coin makes the beam bigger, so more of the
   path ahead is lit, and sooner. For the first 20 seconds nothing can go wrong (RIDE_FREE). After that SKILL DECIDES HOW LONG
   THE RIDE LASTS: the lamp slowly runs down, a little faster for every second ridden; running into a campfire or a branch
   takes a third of it; and ICICLES FALL AGAIN: every few seconds the one that hangs nearest over the snowmobile shakes and
   then drops, and he has to be moved out from under it, forward or back, or it takes a quarter of the lamp. Coins charge the
   lamp, a little each (a hundredth), and each GOOD TIDINGS a quarter. All the while the ride gets a little faster, the dark
   stretches longer, and things come closer together. When the lamp is out the snowmobile comes to a stop, and the snowflakes
   spell the phrase. So the ride has no set end: someone who presses nothing rides half a minute, and a ride without a
   mistake lasts over three.
   (How its light, its dark and its coins look: ridelook.js.)

   THE SCORE (PTS, below): 10 for a small snowflake, 20 for a big one, 50 for a letter, 100 for a gift, 100 for each branch or
   campfire jumped over, and for speed 10 for every second under two minutes that the phrase took; on the ride, 10 for a coin and
   10 for every second of track ridden (and 100 for each thing jumped over, as before; 50 for each letter of GOOD TIDINGS, and
   200 each time it is spelled). Nothing takes points away. Before the ride there
   is only so much to be had (CAPS, below): snowflakes score until he has had all the snow he can use, and the first ten things
   jumped over score. So waiting, instead of catching the last letter, earns nothing: the big scores are made on the ride.
   The score is under the phrase all the while he plays (a few words of help come under it), each gain rises from where it
   was earned ("+100"), and the total is shown under the phrase made of snow. play() hands it back when the round is over.

   const game = createGame({ stage, globe, figure, backdrop, scenery, say, sounds, ride });   (ride: { model, state } = the snowman on the
   snowmobile as a second figure, and what the game may change of it: see figures/ora-snowmobile.js. Without it there is no ride.)
   const result = await game.play('HAPPY HOLIDAYS', () => { …the moment the globe is back on screen (still hidden in white): shake it, change its name… });
   result: { score, seconds (how long the phrase took), parts: { snow, letters, gifts, jumps, speed, coins, ride } (points), flakes, letters,
   gifts, jumps, coins (how many), ride (seconds of track ridden) }
   (scenery: the winter night in layers, from winterScenery() in globe3d.js, for the wood that moves past. Without it the
   still backdrop is shown.)

   To play: drag a finger left and right (the figure follows it), hold the left or the right arrow beside JUMP, tilt the
   phone, or use the arrow keys; press JUMP to jump. On the snowmobile: JUMP (the button, the space bar, or a tap on the
   screen), and SLOWER and FASTER (the two arrow buttons, the Left and Right arrow keys, or a finger sliding on the screen),
   which bring it back and forward along the snow.
   By ear: the letter that is needed rings from its side (left or right); the ring gets quicker as it comes down, and higher
   when the figure is right under it. An icicle that is about to drop ticks fast and glassy from its side: bright while the
   figure is under it, low and soft once he is out. A branch or a campfire knocks low and slow as it comes, then rings twice
   when it is time to jump. Screen readers are told each needed letter and its side, each gift, each icicle, each thing in
   his way, and what happened. On the ride the same knock and the same two notes say what is coming and when to jump, but only
   once the light has shown it: in the dark, a bigger beam means an earlier warning, by ear as well as by eye. A run of coins
   rings up the scale; two soft high notes say "jump now for the coins up there".
   Recorded sounds (sounds.js, when the page hands them in as `sounds`) go with those notes, each at its moment and each from
   where it happens: a pat for a snowflake, a chime for a letter (at that letter's own note), a rip and a sparkle for a gift, a
   click when a piece of him lands, a whoosh up and a thump down for a jump, his steps in the snow, knock-tumble-plop for a
   branch, a fwoomp and a hiss for a campfire that catches him, a crack and a scatter for an icicle, a warm swell as the phrase
   forms, and a long whoosh through the logo. Two go round: the winter night under the whole game, and a campfire's crackle,
   which grows as the fire comes near, from its side. They are textures, kept under the notes; without them (or with the
   sound off) the game is exactly as it was.
   The snowmobile has recordings of its own (18 November 2026): its engine starting as the big gift bursts open; the engine
   itself, two recordings that go round (a purr at the back, a higher hum right forward: sounds.engine()); the engine rising
   as it is brought forward quickly and sinking as it drops back; a crack and a thump for a branch; a swish as a ramp throws
   it, a rush of air and bells for BIG AIR, and a heavy thump as it comes down; a creak for an icicle about to fall and a
   smash for one that hits; a coin's own note, played up the scale; a flourish for GOOD TIDINGS; two soft notes when the lamp
   is low; and the engine puttering to a stop when it is out. Where one of these takes the place of notes the game rang
   before, or of a sound of the first half, those are still used if the recording cannot play.

   A figure that cannot be built piece by piece (figure.pieces is not set) is whole from the start and simply grows bigger
   with the snow; no gifts fall for it.
   ───────────────────────────────────────────────────────────── */
import { createHazards } from './hazards.js';   // how the branch, the campfire and a lost snowball look
import { createRideLook } from './ridelook.js'; // the snowmobile ride: how its light, its dark and its coins look

export const WORDS = ['HAPPY HOLIDAYS'];   // what the snowflakes spell: one of these each round, in turn

const SUNSHINE = false;   // rays of sunshine that melt him: switched off for now (true brings them back, twice in a long phrase)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, p) => a + (b - a) * p;
const easeOut = p => 1 - Math.pow(1 - clamp(p, 0, 1), 3), easeIn = p => Math.pow(clamp(p, 0, 1), 2.4), smooth = (a, b, v) => { const p = clamp((v - a) / (b - a), 0, 1); return p * p * (3 - 2 * p); };
const FONT = 'Archivo, "Arial Black", Arial, sans-serif';
const HEARTS_TOP = true;   // (24 Nov) on the ride the hearts are at the top, under the icicles and above the phrase (false: just above the buttons, as before)
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
const PTS = { flake: 10, big: 20, letter: 50, gift: 100, jump: 100, second: 10, par: 120, coin: 10, ride: 10, tidings: 200, home: 300 };   // (home: on the ride, for each heart he still has when he gets home)
//   // the score: a small snowflake, a big one, a letter, a gift, a thing jumped over; for speed, 10 for every second under two minutes (par) that the phrase took; and on the ride, a coin, and every second ridden
const CAPS = { snow: 400, jumps: 10 };   // before the ride: the most that snowflakes can score, and how many of the things jumped over score (so that waiting does not pay)
// THE RIDE on the snowmobile: the big gift, when the phrase is spelled
const HEARTS0 = 3, HEARTS_MAX = 5;        // HEARTS (Ben, 24 Nov: players "didnt know how many hits I had left"): he starts the ride with 3, and can catch more, up to 5. Running into a campfire or a branch, or an icicle that hits him, takes one. With none left the ride is over
const HEART_GAP = [35, 60];              // a heart to catch comes along every 35 seconds of track at first, and every 60 later on (and up to 6 more, as chance has it); none while he has all 5
const HOME = 210;                        // the ride's length in seconds of track (about two and a half minutes by the clock): there he is HOME, and every heart he still has is worth PTS.home. So a skilled rider gets to the end, and the best score there can be stays under the top-score list's limit
const DARK_LEVEL = .5;                   // how dark the wood is: half as dark as the darkest it was, the same all the ride long, with the headlight on (Ben, 24 Nov)
const RIDE_FREE = 20;                    // its first seconds are free: the lamp does not run down, and running into something, or an icicle, costs nothing (20 seconds since 18 Nov; it was 30)
const LAMP0 = .5, COIN_LIGHT = .01, BUMP = .34, ICE_HIT = .25;   // the lamp (0 out … 1 full): how full it is at the start; how much a coin adds (half of what it did: Ben, 18 Nov, "less lamp energy per coin but keep the points the same"); how much running into something takes (a third of the lamp: "hitting any obstacle take significant lamp energy"); and how much an icicle that comes down on him takes
const ICE_GAP = [8, 4.5];                // ICICLES FALL AGAIN on the ride (Ben, 18 Nov: "bring back the falling icicles that drain the lamp energy"). The first has its turn in the first half minute (FIRST: 16 seconds in, inside the free seconds, so it costs nothing and shows what they do); after it there is one every 8 seconds of track at first and every 4.5 at last (and up to 2 more, as chance has it)
const DRAIN = [.012, .00015];            // after the free seconds it runs down by this much a second, and by that much more for every second ridden since (so however well he rides, the lamp is out after about three and a half minutes of track: the best score there can be has to stay under the top-score list's limit). Since 18 Nov it is SKILL that decides how long a ride lasts: what ends most rides is what he runs into and the icicles that hit him, and coins give too little light to make up for that. Someone who presses nothing rides half a minute; a perfect ride lasts as long as it did
const FAST = [1.45, .0042];              // how fast the snowmobile goes, as a multiple of his walk: at first, and how much more for every second ridden after the free ones
const DARK1 = [0, 13], DARK2 = [23, 35.5]; // the dark stretches of the free seconds, in seconds ridden. The ride BEGINS in the dark, so that the headlight is met at once and is no surprise later; then moonlight; then a second, shorter dark, in which the first branch comes
const BOOST = .6, JUMP_UP = .35;         // brought right forward (the Faster button, or the Right arrow key, or a finger): how much faster it goes (the whole ride goes by that much quicker: its seconds are seconds of track), and how much higher it then jumps
const NEAR = [.32, .175];                // on a narrow screen (a phone held upright) the ride is seen from further back, so that more of the way ahead shows: the snowmobile is at most this part of the screen's width long, and it rides this far in from the left
const RING = .85;                        // the two notes that say "jump now" ring this long before a thing reaches the middle of the snowmobile (on foot: 0.6 s before it reaches his feet). Any jump from then until a quarter of a second before it arrives clears it
const RYAW = 1.08, RK = .62;             // how the snowmobile is turned to us as it rides (radians: a little short of side-on); and how big the things on the snow are drawn beside it (it is seen from further back than the walking snowman)
const RAMP = { h: .36, len: 1.5, auto: .8, best: 1.3, zone: .34, late: .2 };   // a ramp of snow: how high its top is and how long it is (in the snowmobile's own units: about a third of its height, and its length); how high it throws the snowmobile by itself, and with JUMP pressed near its top (as parts of an ordinary jump, measured from the top of the ramp); how much of its length, at the top end, is "near its top" (about a third of a second's ride); and for how long after it has thrown him a press still counts (seconds)
const TIDINGS = 'GOOD TIDINGS', TID_LIGHT = .25;   // on the ride snowflakes fall again, one letter at a time, and spell this (again and again, for as long as the ride lasts); and how much light the lamp gains each time it is spelled
const FAR = [.8, .86];                   // how far forward the snowmobile can be brought: until its nose is this far across the screen (a narrow one), or across the play area (a wide one)
const BACK = 1.5;                        // how much faster the wood behind goes by on the ride than the snow does, so that its speed shows
// What comes along in the first half minute, in order: [what, how many seconds of track after the thing before it] (a ramp takes 1.3 more).
// A RAMP FIRST, within a few seconds of setting off (Ben, 17 Nov: more ramps, and sooner): it throws him by itself, so nothing has to be
// known yet. Then coins and another ramp in the dark, and a campfire's light. In the moonlight THE FIRST ICICLE ('ice': nothing comes along
// the snow in its turn, so that its words can be read), and the top coins (speed, then a jump). In the second dark a ramp, a campfire, a
// ramp and a branch. (They come at seconds 1.4, 5.3, 7.9, 11.8, 16, 19.4, 22, 25.9, 28.5 and 32.4 of the ride.)
const FIRST = [['ramp', 1.4], ['coins', 2.6], ['ramp', 2.6], ['fire', 2.6], ['ice', 4.2], ['sky', 3.4], ['ramp', 2.6], ['fire', 2.6], ['ramp', 2.6], ['branch', 2.6]];
const LETTER_AT = 6;                     // the first letter of GOOD TIDINGS comes down this many seconds into the ride (after the first ramp, so that its words can be read)
const COIN_NOTES = [1046.5, 1174.66, 1318.5, 1396.91, 1568, 1760, 1975.53, 2093];   // a run of coins rings up the scale
const fmt = n => Math.round(n).toLocaleString('en-US');

export function createGame({ stage, globe, figure, backdrop, scenery = null, say = () => {}, cues = true, sounds = null, ride = null }) {
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
  const ICON_L = btnL.innerHTML, ICON_R = btnR.innerHTML, ICON_SLOW = arrow('M21.5 4.5 13 12 21.5 19.5z M11.5 4.5 3 12 11.5 19.5z'), ICON_FAST = arrow('M2.5 4.5 11 12 2.5 19.5z M12.5 4.5 21 12 12.5 19.5z');   // (on the snowmobile the Left and Right buttons are Slower and Faster: two arrowheads each)
  document.body.appendChild(bar);
  const look = createHazards({ calm }), rlook = createRideLook({ calm });
  const rideOK = !!(ride && ride.model && ride.state);   // there is a snowmobile to ride
  let fig = figure;                                       // the figure on the screen just now: the snowman or, on the ride, the snowman on the snowmobile
  let eng = null;                                         // the sound of its engine (ambience(), below)
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
      walk: 0, going: 0, rush: 0, jy: 0, jv: 0, air: false, gy: 0, ramp: null, launchT: -9, jumpAsk: -9, jumps: 0, obs: [], obAt: 6.5, obN: 0, trips: 0, burns: 0, cleared: 0, roll: null, singe: null, safeT: -9, heaps: [], trail: [], trailAt: 0, stepAt: 0, steer: null, pad: { l: 0, r: 0 }, hold: { l: 0, r: 0 }, padT: 0,
      score: 0, shown: 0, pts: { snow: 0, letters: 0, gifts: 0, jumps: 0, speed: 0, coins: 0, ride: 0 }, gains: [], ride: null, coins: 0, gainT: -9, doneAt: null, secs: null,
      sunAfter: sunTimes(letters.length), sunDue: 0, sun: null, ice: makeIce(), loose: null, iceAt: 3, iceA: 0, note: null, told: {},
      veil: 0, hud: 1, logo: false, cam: null, e: 0, view: null, geo: null, yaw0: 0, word3: null, rows: null, done: null, keys: { l: 0, r: 0 }, tilt: 0, tilt0: null, touchT: -9, back: null, zoom: null, played: 0 };
  }
  // how much of him the snow has made, and what the gifts have brought (while he is only a head, his arms, gloves and scarf
  // wait: they are back as soon as his middle is)
  const made = () => { const s = G.snow, g = G.got, on = k => (g[k] && s >= 1 ? 1 : 0); return { torso: s < 1 ? 0 : lerp(.42, 1, clamp((s - 1) / (NT - 1), 0, 1)), base: s <= NT ? 0 : lerp(.38, 1, clamp((s - NT - 1) / (NB - 1), 0, 1)),
    armR: on('armR'), armL: on('armL'), gloveR: on('gloveR'), gloveL: on('gloveL'), scarf: on('scarf'), buttons: [on('b1'), on('b2'), on('b3'), on('b4')] }; };
  // (as he gets taller the view draws back, so that the sky above him stays tall)
  const hfGoal = () => { const s = G.snow; return !pieces ? lerp(.22, .34, clamp(s / FULL, 0, 1)) : s <= NT ? lerp(HF[0], HF[1], s / NT) : s <= FULL ? lerp(HF[1], HF[2], (s - NT) / NB) : lerp(HF[2], HF[3], clamp((s - FULL) / NX, 0, 1)); };
  const riding = () => !!(G && G.ride && G.ride.on);          // he is on the snowmobile
  const heartTop = () => { const hr = clamp(PW * .042, 11, 16), cy = Math.max(hr * 1.45 + 8, iceH() * .7); return { hr, cy, room: Math.max(0, cy + hr * 1.45 + 6 - iceH()) }; };   // the row of hearts at the top, on the ride: over the tips of the icicles, so the phrase moves down only a little
  const figH = () => fig.height || 1.2;                       // the whole figure's height in its own picture (the picture is 2 units tall)
  const unit = () => (riding() ? G.ride.u : G.hf * H / figH());   // pixels per unit of that picture (the snowmobile: sized by its length)
  const feetY = () => (riding() ? moundY(G.sx) + 2 : groundY + H * .012) - G.jy;   // where its feet are on the screen (just under the top of the snow; higher in a jump). The snowmobile: the line its track runs along
  const body = () => (pieces && !riding() && figure.shape) || null;   // where its parts are just now (a figure built piece by piece)
  const headY = () => { if (riding()) return feetY() - 1.38 * G.ride.u; const b = body(); return b ? feetY() - b.top * unit() : groundY - G.jy - G.hf * H; };       // the top of its hat
  const reach = () => { const b = body(); return Math.max(24, (b ? b.half : fig.reach || .3) * unit()); };       // how far it spreads to each side (its arms, once it has one)
  const wide = () => { const b = body(); return Math.max(20, (b ? b.body : (fig.reach || .3) * .6) * unit()); }; // …and without its arms: its widest ball
  const grab = () => { const b = body(); return Math.max(22, reach() * (b && !b.arms ? .9 : .6)); };                // how near a flake must be to be caught
  const catchTo = top => { const b = body(); return b ? Math.max(feetY() - (b.balls[1][1] - b.balls[1][2] * .35) * unit(), top + b.top * unit() * .5) : top + G.hf * H * .5; };   // …and how far down: to the middle of his face, or half of him
  const foot = () => { const b = body(); let r = 0; if (b) for (const B of b.balls) if (B[2] > .001) r = B[2]; return clamp((b ? r : (fig.reach || .3) * .5) * unit() * .36, 14, 26); };   // half the width of what he stands on (his lowest ball, where it meets the snow)
  const edge = () => Math.min(wide(), PW * .3);               // how near the sides of the screen its middle can come: all the way, until its body touches the side
  const need = () => G.letters[G.i] || '';
  const note = (txt, dur) => { G.note = { txt, t0: G.t, dur: dur || 1.8 }; };
  // points: added to the score, and a small "+100" rises from where they were earned
  const plus = (n, px, py, tag) => { G.gainT = G.t; const near = G.gains.filter(q => q.t < .4 && Math.abs(q.x - px) < 70).length; G.gains.push({ n, tag: tag || '', x: px, y: py - near * 24, t: 0 }); if (G.gains.length > 16) G.gains.shift(); };   // (several at once: one above another)
  const gain = (n, kind, px, py, tag) => { if (!(n > 0)) return; G.score += n; G.pts[kind] += n; plus(n, px, py, tag); };
  const side = px => (Math.abs(px - G.sx) < grab() ? 'right above you' : px < G.sx ? 'on your left' : 'on your right');
  // what a snowflake scores: its points, until snowflakes have scored all they can (CAPS). After that he is told, once, to go for the letters.
  const snowPts = n => { const left = CAPS.snow - G.pts.snow; if (left > 0) return Math.min(n, left); if (!G.told.cap) { G.told.cap = 1; note('He has all the snow he needs: catch the letters!', 3.2); say('He has all the snow he needs. Catch the letters.'); } return 0; };
  const iceH = () => clamp(H * .105, 54, 112), iceX = c => PX + c.u * PW, iceLen = c => c.len * c.max * iceH();   // the longest an icicle gets; where one hangs; how long it is now
  const iceBusy = () => G.ice.some(c => c.state === 'shake' || c.state === 'fall');
  const kS = () => clamp(PW / 393, .85, 1.45) * 1.25;         // how big the things on the ground are drawn
  const pace = () => clamp(PW * .34, 120, 210);               // how fast the ground goes by as he walks: pixels a second
  const speed = () => pace() * G.going * (1 + G.rush) * (riding() ? G.ride.m * (1 + BOOST * G.ride.boost) * G.ride.z : 1);   // …just now (he sets off, he stops; it rushes by as he tumbles; faster on the snowmobile, and faster still the further forward it has been brought; z: seen from further back, the same speed is fewer pixels)
  const restY = px => moundY(px) + 6 * kS();                  // where a thing on the ground rests on the snow: on the line he walks along
  const peak = () => clamp(H * .16, 96, 170);                 // how high a jump goes: pixels
  // on the ride: how big the things on the snow are; how high the snowmobile jumps (at its ordinary speed, at the back); where it rides; and where the score and the light bar end
  const rk = () => kS() * RK * (G.ride ? G.ride.z : 1), rpeak = () => (G.ride ? G.ride.pk : peak());
  const rideX = () => Math.max(G.ride.len * .46 + 10, PX + PW * (W < 600 ? NEAR[1] : .25));
  const rideFar = () => Math.max(rideX() + G.ride.len * .5, Math.min(W * FAR[0], PX + PW * FAR[1]) - G.ride.len * .54);   // …and the furthest forward its middle can be brought
  const hudLow = () => { const S = slots(), sfs = clamp(PW * .05, 16, 25), w = clamp(PW * .44, 132, 220); return S.bottom + S.fs * .78 + sfs * 1.8 + 13 + Math.max(12, w * .1) / 2 + 5; };

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
    if (was < NT && G.snow >= NT) { [659.25, 783.99, 987.77].forEach((f, k) => globe.bell(f, k * .08, .05)); try { fig.tap(); } catch (e) {} if (!G.told.three) { G.told.three = 1; say('His middle is done. Now his bottom ball.'); } }
    if (was < FULL && G.snow >= FULL) { [783.99, 987.77, 1174.66, 1568].forEach((f, k) => globe.bell(f, k * .08, .05)); try { fig.tap(); } catch (e) {} G.cheerT = G.t; if (!G.told.whole) { G.told.whole = 1; say('All three balls are done.'); } }
  }
  // He loses some snow (n of it), but never a ball he already has. When he is whole or bigger, the loss still shows: his bottom
  // ball comes down a size, whatever snow he had to spare.
  function knock(n) { const floor = !pieces ? 0 : G.snow > NT ? NT + 1 : Math.min(G.snow, 1), lost = G.snow - Math.max(floor, Math.min(G.snow - n, FULL - Math.ceil(n * .75))); G.snow -= lost; return lost; }
  // where an arm, a glove, a button or the scarf belongs on him, on the screen
  const spot = k => { const b = body(), p = b && b.spots && b.spots[k], u = unit(); return p ? [G.sx + p[0] * u, feetY() - p[1] * u] : [G.sx, lerp(headY(), feetY(), .5)]; };
  // where one of his marks is on the screen just now (the top of his hat, the tip of his nose, the end of his scarf): exactly where it
  // was last drawn, turned and leaning and jumping as he is. Nothing for a scarf he has not got. (A figure with no marks: the top of it.)
  const mark = n => { const M = fig.marks, u = unit(); if (!M) return n === 'hat' ? [G.sx, headY() + 4] : null; const p = M[n]; if (!p || (n === 'scarf' && !(made().scarf > 0))) return null;
    return [G.sx + p[0] * u, feetY() - fig.feetV * u + p[1] * u]; };
  const at = n => { const p = fig.marks && fig.marks[n], u = unit(); return p ? [G.sx + p[0] * u, feetY() - fig.feetV * u + p[1] * u] : null; };   // (any mark of the figure on the screen: the snowmobile's lamp, its nose, the end of its track)

  function caught(f) {
    const t = G.t, pan = (f.x - W / 2) / (W / 2) * .6;
    if (f.kind === 'need') {   // the letter that is needed
      const k = G.i; G.fly.push({ ch: f.ch, k, x: f.x, y: f.y, t: 0, r: f.r }); pop(f.x, f.y, '#ffe9a8', 16, true);
      globe.bell(SCALE[k % SCALE.length], 0, .13); globe.bell(SCALE[k % SCALE.length] * 2, .07, .06); buzz(25); fx('letter', { pan, hz: chime(k) });
      try { fig.tap(); } catch (e) {} G.cheerT = t; G.caught++; G.i++; G.missRow = 0; G.nextAt = t + .8; G.letter = null; say(f.ch + '!'); gain(PTS.letter, 'letters', f.x, f.y);
      if (G.i >= G.letters.length) { G.nextAt = t + .9; G.sunDue = 0; G.doneAt = G.played; }   // the phrase is whole: no icicle now, and no sunshine (not even a ray that was just about to come)
      else if (G.i === G.iceAt) { G.iceAt += 3; shakeIce(); }             // every third letter brings an icicle down
      else if (G.sunAfter.length && G.i >= G.sunAfter[0]) { G.sunAfter.shift(); G.sunDue = t + .35; }   // (and, when it is switched on, now and then sunshine)
    } else if (f.kind === 'gift') {   // a gift: it bursts open, and what was in it flies to its place on him
      const k = nextGift(); G.gifts++; G.gift = null; G.giftAt = t + 2.6 + Math.random() * 1.6; G.cheerT = t; gain(PTS.gift, 'gifts', f.x, f.y);
      for (const col of ['#ffd76a', '#ff5a45', '#ffffff']) pop(f.x, f.y, col, 7, true);
      [1046.5, 1318.5, 1568, 2093].forEach((fq, n) => globe.bell(fq, n * .06, .055, pan)); buzz([20, 30, 20]); fx('gift', { pan });
      if (k) (PARTS[k] || [k]).forEach((p, n) => G.toys.push({ k: p, x: f.x, y: f.y, t: -n * .35 })); else { grow(3, pan); say('The gift was full of snow.'); }   // (nowhere to put anything just now)
    } else { pop(f.x, f.y, '#ffffff', 8); grow(2, pan); gain(snowPts(PTS.big), 'snow', f.x, f.y); fx('big', { pan }); }   // a big snowflake
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
  // ON THE RIDE icicles fall again (the first in its turn in FIRST, then ICE_GAP). The one that hangs nearest over the snowmobile shakes (it ticks, it glows, and a mark
  // on the snow shows where it will land), and then drops: he has to be moved out from under it, forward or back.
  function rideIce() {
    const R = G.ride, mid = G.sx + R.len * .03; let best = null;
    for (const c of G.ice) if (!c.deco && c.state === 'hang' && (!best || Math.abs(iceX(c) - mid) < Math.abs(iceX(best) - mid))) best = c;
    if (!best) return false; best.state = 'shake'; best.t = 0; best.cue = 0; best.max = 1; best.len = Math.max(best.len, .45); best.secs = .5; R.iceN++;   // (it is a long one: what length it lacks, it grows as it shakes)
    note(R.iceN <= 2 ? 'Icicle! Move out from under it' : 'Icicle!', R.iceN <= 2 ? 2.2 : 1.3);   // (every time: it hangs at the top of the screen, a long way from where he is looking)
    globe.bell(2793.83, 0, .06); globe.bell(3520, .07, .045); buzz(40); fx('creak', { pan: from(iceX(best)) }); say('An icicle above him is about to fall! Move him forward or back, out from under it.'); return true;
  }
  // One has come down on him. In the free seconds it is only a knock. After them it dims the lamp (ICE_HIT). For a moment after it nothing
  // else can catch him (and one that comes down on him in the moment after a bump breaks on him without harm).
  function rideIceHit() {
    const R = G.ride, t = G.t, free = R.t < RIDE_FREE; R.iceHits++; R.bumpT = t; R.safeT = Math.max(R.safeT, t + .8); G.ouchT = t; if (!free) loseHeart();
    chunks(14, '#d9ecff', true); [329.63, 261.63, 196].forEach((f, k) => globe.bell(f, k * .11, .08)); buzz([70, 40, 70]); fx('icehit', { pan: here() });   // (with the icicle's own breaking: together, an icicle that broke on something hard)
    note(free ? 'Bonk! Move away from icicles' : heartsLeft(), 2); say('An icicle hit him' + (free ? '. Move him out from under the next one.' : '. ' + heartsLeft(true)));
  }
  function stepIce(dt, play) {
    const t = G.t, R = G.ride, ride = G.phase === 'ride' && !!R && R.on && !R.end; G.iceA = Math.min(1, G.iceA + dt / 1.2);
    for (const c of G.ice) {
      const px = iceX(c), L = iceLen(c);
      if (c.state === 'fall') { c.vy += 2600 * dt; c.y += c.vy * dt; c.rot += dt * .5 * (c.ph > 3 ? 1 : -1); const tip = c.y + L, b = body(), u = unit(); let hit = false;
        if (play) for (const q of [0, .35, .7]) { const py = tip - L * q;   // (its point, and two places up its length)
          if (b) { for (const B of b.balls) if (B[2] > 0 && Math.hypot(px - (G.sx + B[0] * u), py - (feetY() - B[1] * u)) < B[2] * u * .94) hit = true; }
          else if (Math.abs(px - G.sx) < reach() * .55 && py > headY() + 4 && py < groundY) hit = true; }
        // (on the ride: it has come down onto the rider, who sits a little behind the middle, or onto the machine in front of and behind him)
        else if (ride) { const top = Math.abs(px - (G.sx - R.len * .1)) < R.len * .2 ? headY() + 5 : feetY() - .62 * R.u; hit = Math.abs(px - (G.sx + R.len * .03)) < R.len * .44 && tip > top && c.y < feetY(); }
        if (hit) { shatter(px, Math.min(tip, ride ? feetY() : groundY)); if (!ride) iceHit(); else { R.iceDown++; if (t >= R.safeT) rideIceHit(); } regrow(c); }
        else if (tip > moundY(px)) { shatter(px, moundY(px)); regrow(c); if (ride) R.iceDown++; }
        continue; }
      c.len = Math.min(1, c.len + dt / c.secs);   // it grows
      if (c.state === 'shake') { c.t += dt;
        if (!play && !ride) { c.state = 'hang'; continue; }
        if (cues && t >= c.cue) { const mid = ride ? G.sx + R.len * .03 : G.sx, under = Math.abs(px - mid) < (ride ? R.len * .47 : reach() * .8); c.cue = t + .09; globe.bell(under ? 2793.83 : 1396.91, 0, under ? .034 : .014, clamp((px - mid) / (PW * .3), -1, 1)); }
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
    const b = body(), u = unit(), was = G.snow; G.trips++; G.ouchT = G.t; G.jy = 0; G.jv = 0; G.air = false; G.jumpAsk = -9;
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
    const what = !fig.marks ? 'The top of him burns' : mark('scarf') ? 'The end of his scarf, the top of his hat and the tip of his nose burn' : 'The top of his hat and the tip of his nose burn';
    note(lost ? 'The fire melted him a little' : 'Hot! Jump over the campfire', 2); say((lost ? 'He landed in the campfire. ' : 'He touched the campfire. ') + what + ' for a moment' + (lost ? ', and he melts a little.' : '.') + ' Jump over the next one.');
  }
  function stepObs(dt, play) {
    const v = speed(), fw = foot(); let ready = false;
    for (const o of G.obs) { o.x -= v * dt; const gap = o.x - o.hx - (G.sx + fw), tc = gap / pace();   // tc: seconds until it reaches his feet
      if (play && !o.hit && !o.done) {
        if (Math.abs(o.x - G.sx) < o.hx + fw) {                                                                                             // it has reached him:
          if (G.roll || G.t < G.safeT) o.done = true;                                                                                       // (he is tumbling, or only just up again: it goes by)
          else if (G.jy >= o.hh) { o.done = true; G.cleared++; globe.bell(1046.5, 0, .04); globe.bell(1568, .07, .03); gain(G.cleared <= CAPS.jumps ? PTS.jump : 0, 'jumps', G.sx, headY() - 14); }   // he is over it: cleared (the first ten score)
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
  function ask() { if (!G || (G.phase !== 'play' && G.phase !== 'ride') || G.roll) return; const now = performance.now(); if (now - lastAsk < 220) return; lastAsk = now; G.jumpAsk = G.t; }

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
  // The last letter is caught: the phrase is spelled. Points for speed; what was falling and what lay in his way are gone; and he
  // is finished off. Then, if there is a snowmobile to ride, the big gift comes down (startGift, below); if not, the snowflakes
  // spell the phrase at once (startWord).
  function phraseDone() {
    G.letter = null; G.gift = null; G.sun = null;
    G.secs = G.doneAt == null ? G.played : G.doneAt; gain(Math.max(0, Math.ceil(PTS.par - G.secs)) * PTS.second, 'speed', G.sx, headY() - 18, 'SPEED');   // the quicker the phrase was spelled, the more
    for (const f of G.big) pop(f.x, f.y, f.kind === 'gift' ? '#ffd76a' : '#ffffff', 6); G.big = []; G.sparks = [];
    for (const o of G.obs) pop(o.x, moundY(o.x) - 10, o.kind === 'fire' ? '#ffc46b' : '#7a5433', 8); G.obs = []; for (const h of G.heaps) pop(h.x, moundY(h.x) - 6, '#ffffff', 8); G.heaps = []; glow(false); G.pad.l = G.pad.r = 0;   // nothing in his way now: he stops walking
    // he is finished off: the snow he still needs, and any arm, glove, button or the scarf that no gift brought, come down to him one after another
    G.snow = Math.max(G.snow, FULL);
    if (pieces) { let d = 0; for (const k of ALL) if (!G.got[k] && !G.toys.some(o => o.k === k)) G.toys.push({ k, x: W / 2 + (Math.random() - .5) * PW * .5, y: -24, t: -.5 - .36 * d++ }); }
    if (rideOK) startGift(); else startWord();
  }
  function startWord() {
    G.phase = 'word'; G.pt = 0; G.note = null; G.cheerT = G.t; try { fig.shake(0, true); } catch (e) {}
    G.hadKeys = bar.contains(document.activeElement); bar.style.visibility = 'hidden'; glow(false);
    const mine = G.lines; if (G.ride && G.ride.first) G.lines = G.ride.first.lines;   // (after a ride the phrase at the top is GOOD TIDINGS: what the snowflakes spell now is the phrase of the round)
    const Y = layout(), maxW = Y.one && G.lines.length > 1 ? Math.min(W * .86, PW * 1.9, 1000) : Math.min(PW * .88, 580);
    const pts = wordPoints(Y.rows, clamp(Math.round(maxW * (Y.rows.length > 1 ? 1.5 : 1)), 300, 900)); G.rows = Y.rows; G.wfs = pts.fs; G.wlh = pts.lh;   // (more dots on a bigger screen, so the letters stay crisp)
    G.WW = Math.min(maxW, .3 * H / (Y.rows.length * pts.lh)); G.lines = mine;
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
    if (night) { night.stop(); fire.stop(); } if (eng) eng.stop(); if (rideOK) { ride.model.pose = null; ride.model.sharp = 0; } fig = figure; btnL.style.visibility = btnR.style.visibility = ''; btnL.innerHTML = ICON_L; btnL.setAttribute('aria-label', 'Left'); btnR.innerHTML = ICON_R; btnR.setAttribute('aria-label', 'Right');
    const fin = G.fin, had = G.hadKeys || bar.contains(document.activeElement), result = { score: G.score, seconds: Math.round((G.secs == null ? G.played : G.secs) * 10) / 10, parts: Object.assign({}, G.pts), flakes: G.flakes, letters: G.caught, gifts: G.gifts, jumps: G.cleared, coins: G.coins, ride: G.ride ? Math.round(G.ride.t * 10) / 10 : 0 }; G = null; cv.style.display = 'none'; bar.style.display = 'none'; glow(false); btnL.style.background = btnR.style.background = GOLD; removeEventListener('resize', size);
    if (had && focusWas && focusWas.focus) try { focusWas.focus({ preventScroll: true }); } catch (e) {} focusWas = null; fin(result);
  }

  /* ── THE BIG GIFT, AND THE RIDE ── */
  // The phrase is spelled, and there is a snowmobile to ride. A big red box comes down and lands in the snow ahead of him; he goes
  // to stand beside it; it shakes, quicker and quicker, and bursts open in a puff of snow. In the puff he is on the snowmobile.
  function startGift() {
    const r = clamp(PW * .15, 46, 84), gx = PX + PW * .62;
    G.phase = 'gift'; G.pt = 0; G.note = null; G.cheerT = G.t; glow(false); G.pad.l = G.pad.r = 0; G.jumpAsk = -9;
    G.ride = { on: false, t: 0, m: 0, b: LAMP0, bs: LAMP0, dark: 0, darkOn: false, darkAt: DARK1[0], lightAt: DARK1[1], u: 1, len: 1, acc: 0, pitch: 0, flash: 0, end: 0, openT: 0, box: { x: gx, y: -r * 2.2, r, vy: 0, down: false, t: 0, cue: 0 },
      coins: [], beatAt: FIRST[0][1], beatN: 0, last: '', safeT: -9, bumpT: -9, bumps: 0, combo: 0, comboT: -9, run: 0, runAt: null, lowT: -9, sprayAt: 0, lampX: 0, reach: 0, told: {}, boost: 0, surge: 0, z: 1, pk: peak(), fastest: 0, ramps: [], airs: 0, lifts: 0, top: 1e9, first: null, hearts: HEARTS0, heartAt: 30, heartsGot: 0, heartT: -9, lostT: -9, home: false, letter: null, nextAt: LETTER_AT, iceAt: 1e9, iceN: 0, iceHits: 0, iceDown: 0, again: 0, tidings: 0, caught: 0, missed: 0, missRow: 0, gotAny: false, rushAt: -9, revAt: -9, backAt: -9 };
    G.tx = clamp(PX + PW * .27, PX + edge(), PX + PW - edge());
    ride.state.rider = true; ride.state.lamp = 1; ride.model.pose = { yaw: RYAW, lean: 0, look: -.45, up: 0, cheer: 0, walk: 0 };
    note('The big gift!', 2.4); [783.99, 1046.5, 1318.5].forEach((f, k) => globe.bell(f, k * .12, .06)); say(G.word + ' is spelled! Here comes the big gift.');
  }
  function stepGift(dt) {
    const R = G.ride, B = R.box, t = G.t;
    if (!R.on) { const rest = moundY(B.x) + 4 - B.r * .88; G.sx += (G.tx - G.sx) * Math.min(1, dt * 3.2);
      if (!B.down) { B.vy += 2400 * dt; B.y += B.vy * dt; if (B.y >= rest) { B.y = rest; B.down = true; B.t = 0; G.cheerT = t; pop(B.x, moundY(B.x), '#ffffff', 16, true); globe.bell(130.81, 0, .07); globe.bell(98, .05, .05); buzz(30); fx('land', { pan: from(B.x), vol: 1.5 }); } }
      else { B.t += dt; const k = clamp(B.t / 1.1, 0, 1); if (cues && B.t > .25 && t >= B.cue) { B.cue = t + lerp(.3, .09, k); globe.bell(1318.5 + 600 * k, 0, .03, from(B.x)); } }   // (it shakes, quicker and quicker)
      if (G.pt > .7) try { ride.model.frame(performance.now() / 1000, dt, { px: 256 }); } catch (e) {}   // (the snowmobile is made ready, unseen, so that it is there at once)
      if (B.down && B.t >= 1.25 && (!G.toys.length || B.t > 3.2)) openGift(); }   // (it waits until he is whole: what no gift brought may still be on its way to him)
    else { R.flash = Math.max(0, R.flash - dt / .55); G.sx += (rideX() - G.sx) * Math.min(1, dt * 2.4); G.tx = rideX(); ride.state.lamp = .35 + .65 * R.bs; R.bs += (R.b - R.bs) * Math.min(1, dt * 6);
      { const lamp = at('lamp'); R.lampX = lamp ? lamp[0] : G.sx + R.len * .4; R.reach = PW * (.14 + .5 * R.bs); }   // (the wood is dark from the first moment: the headlight is on as the puff of snow clears)
      if (G.pt >= R.openT + 1.3) { G.phase = 'ride'; G.pt = 0; } }
  }
  function openGift() {
    const R = G.ride, B = R.box, pan = from(B.x); R.on = true; R.openT = G.pt; R.flash = 1; fig = ride.model;
    // On the ride the phrase at the top is GOOD TIDINGS: its letters fall as snowflakes, as HAPPY HOLIDAYS did. (The phrase of the round is kept: the snowflakes spell it at the end.)
    R.first = { lines: G.lines, letters: G.letters, i: G.i }; G.lines = TIDINGS.split(' '); G.letters = TIDINGS.replace(/ /g, '').split(''); G.i = 0; G.fly = [];
    for (const c of G.ice) { if (c.state === 'fall') regrow(c); else c.state = 'hang'; } G.loose = null;   // (the icicles of the first half are all still: on the ride they fall by the ride's own clock)
    // how big the snowmobile is drawn: its length, from the end of its track to the tips of its skis, is a set part of the screen
    const M = fig.marks || {}, span = Math.max(.5, M.nose && M.rear ? M.nose[0] - M.rear[0] : 1.5), full = clamp(PW * .44, 150, 300);
    // (On a narrow screen it is seen from further back, and everything on the ride is that much smaller and that many fewer pixels a second: more of the way ahead shows, for longer.)
    // How high it jumps: as on foot, a little less where it is seen from further back (want). Above the snowmobile there should be room for that jump
    // and for the top coins over it, under the score and the light bar (room). Where there is not quite, the snowmobile is made a little smaller
    // until there nearly is, and the jump is as high as the room allows. On a low screen (a phone held on its side) there is no such room to be
    // had: there the snowmobile keeps its size and its jump is a low hop (44 pixels at the least: enough to clear a campfire), and the top coins,
    // like his hat on foot, go up behind the score for a moment.
    const room = l => groundY - hudLow() - 14 - (1.3 + RAMP.h * .8) * l / span - 2 * clamp(l / span * .11, 9, 17), want = l => peak() * lerp(1, l / full, .6), low = H < 500;   // (the coins over a ramp are the highest of all: higher than the top coins by most of the ramp's height)
    let len = clamp(Math.min(PW * .44, W * NEAR[0]), 104, 300); if (!low) while (len > 84 && room(len) < want(len) * .8) len *= .95;
    R.len = len; R.z = len / full; R.u = len / span; R.pk = clamp(Math.min(want(len), Math.max(44, room(len))), 30, 170);
    R.top = low ? 1e9 : Math.max(R.pk * 1.2, groundY - hudLow() - 8 - 1.38 * R.u);   // the highest it may ever be thrown (from a ramp, fast, with JUMP at the top): his hat stops just short of the light bar
    R.darkOn = true; R.dark = DARK_LEVEL; R.b = R.bs = .75;   // the wood is half dark from the first moment to the last, and the headlight is on (its light no longer comes and goes: hearts are what he has left)
    G.sx = clamp(B.x - R.len * .1, PX + R.len * .5, PX + PW - R.len * .5); G.tx = G.sx; G.jy = 0; G.jv = 0; G.air = false; G.gy = 0; G.ramp = null; G.vx = 0; G.roll = null;
    for (const col of ['#ffd76a', '#ff5a45', '#ffffff']) pop(B.x, B.y, col, 12, true); pop(G.sx, moundY(G.sx) - 20, '#ffffff', 22, true);
    [1046.5, 1318.5, 1568, 2093, 2637].forEach((f, n) => globe.bell(f, n * .07, .06, pan)); buzz([30, 40, 30, 40, 80]); fx('gift', { pan }); fx('piece', { pan, when: .35 }); fx('start', { pan: here(), when: .6 });   // (start: its starter whirs, once the gift's own burst has been heard, and the engine catches as the puff of snow clears and the ride begins)
    btnL.innerHTML = ICON_SLOW; btnL.setAttribute('aria-label', 'Slower'); btnR.innerHTML = ICON_FAST; btnR.setAttribute('aria-label', 'Faster');   // on the snowmobile the two buttons beside JUMP are SLOWER and FASTER: they bring it back and forward along the snow
    note('A snowmobile! Press JUMP to hop', 3.4);
    say('The big gift was a snowmobile with a headlight, and he is on it! He rides through a dark wood, and the headlight shows the way. Press Jump, or tap the screen, to hop over campfires and branches and to reach the Ora coins, worth points. He has three hearts: running into something, or an icicle, takes one. Catch the glowing hearts to get more. Hold the Faster button, where the Right button was, to bring him forward, which is faster and jumps higher; hold the Slower button to drop back. Icicles fall: move him out from under them. Snowflakes fall again: catch the letters to spell ' + TIDINGS.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()) + '.');
  }
  // What comes along on the ride, one thing after another: a line of coins on the snow; a campfire or a branch, with the path of
  // a good jump over it marked out in coins; coins up high (a jump at the right moment); or the top coins (speed, and then a jump
  // at the right moment). In the free seconds they come in a set order (FIRST); after that as they may, closer and closer together.
  function rideOb(kind, px) { const fire = kind === 'fire', k = rk(), o = { kind: fire ? 'fire' : 'branch', x: px, hx: (fire ? 17 : 22) * k, hh: (fire ? 30 : 15) * k, k, hit: false, done: false, rang: false, cue: 0, ph: Math.random(), seen: false, a: 0 }; G.obs.push(o); G.obN++; return o; }
  function beat() {
    const R = G.ride, tau = R.t, k = rk(), u = R.u, v = Math.max(80 * R.z, speed()), x0 = Math.max(W, PX + PW) + 60 * k, p = clamp((tau - RIDE_FREE) / 240, 0, 1), P = rpeak();
    let kind = FIRST[R.beatN] && FIRST[R.beatN][0];
    if (!kind) { const r = Math.random(); kind = r < .18 ? 'fire' : r < .34 ? 'branch' : r < .46 ? 'coins' : r < .58 ? 'high' : r < .7 ? 'sky' : 'ramp'; if (kind === R.last && kind !== 'coins' && Math.random() < .6) kind = 'coins'; }
    R.beatN++; R.last = kind; R.beatAt = tau + (FIRST[R.beatN] ? FIRST[R.beatN][1] : lerp(3, 1.7, p) + Math.random() * .7);
    const cr = clamp(u * .11, 9, 17), coin = (px, h, ring, sky) => R.coins.push({ x: px, h, r: cr, ph: Math.random() * 6.283, lit: 1, ring: !!ring, rang: false, sky: !!sky });
    // Coins: a line on the snow (ridden through); a few up high, which his head only reaches near the top of a jump (a jump at the right
    // moment); and the top coins, just out of reach of a jump at its ordinary speed: they want speed (the snowmobile brought forward), and then a jump at the right moment.
    if (kind === 'ice') { R.iceAt = tau; return; }   // (the first icicle: it is due now, and from now on they come by the clock. Nothing comes along the snow in its turn)
    if (kind === 'coins') { const gap = Math.max(24, u * .4); for (let i = 0; i < 5; i++) coin(x0 + i * gap, u * .55); }
    else if (kind === 'high') { const gap = u * .36; for (let i = 0; i < 4; i++) coin(x0 + i * gap, 1.3 * u + cr + .62 * P, i === 0); }
    else if (kind === 'sky') { const gap = u * .36; for (let i = 0; i < 5; i++) coin(x0 + i * gap, 1.3 * u + cr + P + 6, i === 0, true);
      if (!R.told.sky) { R.told.sky = 1; note('Top coins! Hold the arrow, then jump', 3.4); say('Coins high up. Hold the Faster button, or the Right arrow key, then jump: the faster he goes, the higher he jumps.'); } }
    // A ramp: a wedge of snow. It throws the snowmobile into a jump by itself (the path of that jump is marked out in coins), and JUMP pressed
    // near its top makes the jump a good deal bigger: over the path are four coins that only the bigger jump reaches (or speed). After the
    // free seconds there may be a campfire under the path (any jump from the ramp clears it), or, more and more often as the ride goes on,
    // a campfire or a branch and then another just where the ramp's own jump comes down: that wants JUMP at the top, or speed.
    else if (kind === 'ramp') { const L = RAMP.len * u, h = RAMP.h * u, g = 8 * P / (JT * JT), va = 4 * P / JT * Math.sqrt(RAMP.auto), Ta = (va + Math.sqrt(va * va + 2 * g * h)) / g, tb = 4 * P / JT * Math.sqrt(RAMP.best) / g;
      const lip = x0 + L, off = tq => lip + v * tq - R.len * .25;   // (off: where a thing must be now, to be at the middle of the snowmobile that long after the top of the ramp has gone by under its skis)
      const ramp = { x: x0, L, h, seen: false, a: 0, rang: false, armed: false, ph: Math.random() * 6.283 }; R.ramps.push(ramp); R.beatAt += 1.3;
      for (const q of [.14, .32, .5, .68, .86]) { const tq = q * Ta; coin(off(tq), h + va * tq - g * tq * tq / 2 + u * .55); }
      for (let i = 0; i < 4; i++) coin(off(tb) + (i - 1.5) * u * .36, 1.3 * u + cr + h + RAMP.auto * P + 8, false, true);
      if (tau >= RIDE_FREE) { const r2 = Math.random(), two = .2 + .4 * p, any = () => (Math.random() < .5 ? 'fire' : 'branch');
        if (r2 < two) { rideOb(any(), off(.75 * Ta)).ramp = ramp; rideOb(any(), off(Ta + 36 * k / v + .06)).ramp = ramp;   // (the second: it meets the snowmobile just after the ramp's own jump has come down)
          if (!R.told.long) { R.told.long = 1; note('Long jump! Press JUMP at the top', 3.2); say('Two things after this ramp. Press Jump at the top of the ramp, or go faster, to clear both.'); } }
        else if (r2 < two + .35) rideOb('fire', off(.72 * Ta)).ramp = ramp; } }   // (.ramp: a thing that comes after a ramp. The moment to press JUMP for it is the ramp's, so it does not ring "jump now" itself unless he is back on the snow with it still ahead)
    else { const far = v * JT, hx = x0 + far * .36; rideOb(kind, hx);
      if (kind === 'fire' || Math.random() < .7) for (const q of [-.36, -.18, 0, .18, .36]) { const tj = .5 + q; coin(hx + q * far, u * .55 + 4 * P * tj * (1 - tj)); }
      if (Math.random() < .3 * p) { rideOb(Math.random() < .5 ? 'fire' : 'branch', hx + v * 1.45); R.beatAt += 1.1; } }   // (later on, now and then a second thing close behind the first: two jumps)
  }
  function coinGot(c) {
    const R = G.ride, t = G.t, py = moundY(c.x) - c.h, pan = from(c.x); G.coins++;
    R.combo = t - R.comboT < 1.3 ? Math.min(R.combo + 1, COIN_NOTES.length - 1) : 0; R.comboT = t; if (!fx('coin', { pan, hz: COIN_NOTES[R.combo] })) { globe.bell(COIN_NOTES[R.combo], 0, .05, pan); globe.bell(COIN_NOTES[R.combo] * 2, .03, .02, pan); }   // (a run of coins rings up the scale: the coin's own recorded note, played higher each time)
    G.score += PTS.coin; G.pts.coins += PTS.coin; R.run += PTS.coin; R.runAt = [c.x, py]; pop(c.x, py, '#ffe08a', 6); buzz(8);   // (its points are shown once for the whole run of coins, when the run is over: see stepRide)
    if (!R.told.coin) { R.told.coin = 1; note('Ora coins: 10 points each!', 2.4); say('A coin! Every Ora coin is worth 10 points.'); }
  }
  // The next letter of GOOD TIDINGS comes down: mostly ahead of where he is (he must come forward for it), sometimes behind; never right over
  // him, so that there is something to do, and never out of reach. The first one, and one after two misses, comes down nearer.
  function rideLetter() {
    const R = G.ride, ch = need(), r = clamp(PW * .07, 24, 40), xb = rideX(), xf = rideFar(), arm = R.len * .47, easy = R.missRow >= 2 || !R.gotAny;
    const ahead = [Math.max(G.sx + arm + r * .6, xb + arm), xf + arm * .6], behind = [xb - arm * .4, G.sx - arm - r * .6], span = a => a[1] - a[0], pick = a => a[0] + Math.random() * span(a);
    let c = span(ahead) > 20 && (Math.random() < .72 || span(behind) < 20) ? pick(ahead) : span(behind) > 20 ? pick(behind) : G.sx + (Math.random() - .5) * arm; if (easy) c = lerp(G.sx, c, .55); c = clamp(c, r + 8, W - r - 8);
    const secs = Math.max(2.5, (calm ? 4 : 3.3) * PACE[G.i % PACE.length]) + (easy ? .7 : 0) - Math.min(.8, R.tidings * .2);   // (each time the phrase has been spelled they fall a little quicker)
    R.letter = { kind: 'need', ch, x: c, bx: c, y: -r * 1.4, r, vy: (moundY(c) + 2 - 1.38 * R.u + r * 1.4) / secs, rot: Math.random() * 6, spin: (Math.random() < .5 ? -1 : 1) * (.3 + Math.random() * .5), ph: Math.random() * 6 };
    if (!R.told.letter) { R.told.letter = 1; note('Catch ' + TIDINGS + '! Arrows move him', 3.4); }
    say(ch + ', ' + (Math.abs(c - G.sx) < arm ? 'right above you' : c > G.sx ? 'ahead: go faster' : 'behind: drop back') + '.');
  }
  function rideCaught(L) {
    const R = G.ride, k = G.i, pan = (L.x - W / 2) / (W / 2) * .6; R.letter = null; R.gotAny = true; R.missRow = 0; R.nextAt = R.t + .6; R.caught++; G.caught++; G.i++; G.cheerT = G.t;
    G.fly.push({ ch: L.ch, k, x: L.x, y: L.y, t: 0, r: L.r }); pop(L.x, L.y, '#ffe9a8', 16, true);
    globe.bell(SCALE[k % SCALE.length], 0, .13); globe.bell(SCALE[k % SCALE.length] * 2, .07, .06); buzz(25); fx('letter', { pan, hz: chime(k) }); say(L.ch + '!'); gain(PTS.letter, 'letters', L.x, L.y);
    if (G.i >= G.letters.length) {   // GOOD TIDINGS is spelled: points, and it begins again
      R.tidings++; R.again = R.t + 2.2; R.nextAt = R.t + 2.6; fx('tidings', { when: .12 }); gain(PTS.tidings, 'letters', G.sx + R.u * .5, headY() - 26, TIDINGS + '!');
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, n) => globe.bell(f, .18 + n * .09, .07)); buzz([30, 40, 30, 40, 90]); note(TIDINGS + '! Spell it again', 2.6); say(TIDINGS + ' is spelled! 200 points. Spell it again.'); }
  }
  // A heart is lost (a bump, or an icicle, after the free seconds). The heart breaks in the row above the buttons. With none left, the ride is over.
  function loseHeart() { const R = G.ride; R.hearts = Math.max(0, R.hearts - 1); R.lostT = G.t; if (R.hearts <= 0) R.endAt = G.t + .5; }
  const heartsLeft = long => { const n = G.ride.hearts; return n <= 0 ? (long ? 'No hearts left!' : 'Out of hearts!') : n === 1 ? (long ? 'One heart left! Catch a glowing heart.' : '1 heart left!') : (long ? n + ' hearts left.' : 'Ouch! ' + n + ' hearts left'); };
  // A heart to catch: it glows and beats, low enough to ride through, or now and then up where a jump reaches.
  function rideHeart() { const R = G.ride, u = R.u, x0 = Math.max(W, PX + PW) + 40, high = Math.random() < .35; R.coins.push({ x: x0, h: high ? u * .55 + rpeak() * .6 : u * .55, r: clamp(u * .2, 16, 28), ph: 0, lit: 1, ring: high, rang: false, heart: true }); }
  function heartGot(c) { const R = G.ride, py = moundY(c.x) - c.h; R.hearts = Math.min(HEARTS_MAX, R.hearts + 1); R.heartsGot++; R.heartT = G.t; pop(c.x, py, '#ff5d73', 14, true); buzz([20, 30, 40]);
    [659.25, 830.61, 987.77, 1318.5].forEach((f, k) => globe.bell(f, k * .07, .06)); note(R.hearts >= HEARTS_MAX ? 'Extra heart! Hearts full' : 'Extra heart! ' + R.hearts + ' hearts', 2); say('An extra heart! ' + R.hearts + ' hearts.'); }
  // He has run into something. In the free seconds it is only a bump. After them it dims the lamp. For a moment after it nothing
  // else can catch him. A campfire shows why, as it does when he walks: his scarf, hat and nose burn for a moment.
  function bump(o) {
    const R = G.ride, t = G.t, free = R.t < RIDE_FREE, fire = o.kind === 'fire', pan = here(); R.safeT = t + 1.2; R.bumpT = t; R.bumps++; if (!free) loseHeart();
    chunks(10, '#ffffff', true); pop(o.x, restY(o.x) - 10, fire ? '#ffc46b' : '#7a5433', 9); buzz([50, 30, 50]);
    if (fire) { G.burns++; G.singe = { t: 0, ph: Math.random(), on: FLAMES.map(q => q[0]).filter(n => mark(n)), at: [], out: false };
      for (let k = 0; k < 6; k++) G.pops.push({ x: o.x + (Math.random() - .5) * 24, y: restY(o.x) - 14 - Math.random() * 24, vx: -40 - Math.random() * 60, vy: -110 - Math.random() * 100, life: .7 + Math.random() * .4, t: 0, s: 3 + Math.random() * 4, col: 'rgba(235,242,255,.75)' });   // (steam)
      [523.25, 392, 261.63].forEach((f, k) => globe.bell(f, k * .12, .08)); fx('burn', { pan }); }
    else { G.trips++; [196, 146.83].forEach((f, k) => globe.bell(f, k * .09, .08)); if (!fx('bump', { pan })) fx('trip', { pan, cut: .32 }); }
    const what = fire ? 'He rode through the campfire' : 'He ran into the branch';
    note(free ? (fire ? 'Hot! Jump the campfires' : 'Bump! Jump the branches') : heartsLeft(), 2); say(what + (free ? '. Jump over the next one.' : '. ' + heartsLeft(true)));
  }
  // The lamp is out: the snowmobile comes to a stop, and the snowflakes spell the phrase.
  function endRide() {
    const R = G.ride; if (R.end) return; R.end = .001; glow(false); G.jumpAsk = -9; const home = R.home;
    if (home) { const bonus = PTS.home * R.hearts; if (bonus) { G.score += bonus; G.pts.ride += bonus; plus(bonus, G.sx + R.u * .5, headY() - 30, 'HOME!'); } }
    for (const o of G.obs) pop(o.x, moundY(o.x) - 10, o.kind === 'fire' ? '#ffc46b' : '#7a5433', 8); G.obs = []; for (const c of R.coins) pop(c.x, moundY(c.x) - c.h, '#ffe08a', 4); R.coins = []; for (const r of R.ramps) pop(r.x + r.L * .6, moundY(r.x) - r.h * .4, '#ffffff', 9); R.ramps = []; if (R.letter) { pop(R.letter.x, R.letter.y, '#ffffff', 8); R.letter = null; } G.pad.l = G.pad.r = 0; G.drag = null;
    [523.25, 415.3, 329.63].forEach((f, k) => globe.bell(f, k * .15, .07)); buzz([60, 50, 120]); fx('stop', { pan: here() });   // (stop: the engine putters and dies)
    if (home) { [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => globe.bell(f, .3 + k * .1, .07)); note('Home! ' + R.hearts + (R.hearts === 1 ? ' heart' : ' hearts') + ' x ' + PTS.home, 3); say('He made it home, with ' + R.hearts + (R.hearts === 1 ? ' heart' : ' hearts') + ' left: ' + PTS.home * R.hearts + ' more points. What a ride!'); }
    else { note('Out of hearts. What a ride!', 2.4); say('No hearts left, and the snowmobile comes to a stop. What a ride!'); }
  }
  function stepRide(dt) {
    const R = G.ride, t = G.t, u = R.u, over = !!R.end;
    // How far forward it has been brought is how fast it is going: at the back, its ordinary speed; right forward, BOOST faster (and a surge
    // forward shows at once, before it has got there). The whole ride goes with it. Its seconds are seconds of track: what comes along,
    // the dark stretches, the lamp running down and the points for riding all go by that much quicker (dtau).
    const xb = rideX(), xf = rideFar(), fwd = over ? 0 : clamp((G.sx - xb) / Math.max(1, xf - xb), 0, 1), surge = over ? 0 : clamp(G.vx / (PW * .9), -1, 1);
    R.boost += (clamp(fwd + Math.max(0, surge) * .4, 0, 1) - R.boost) * Math.min(1, dt * 7); if (R.boost < .004) R.boost = 0; R.fastest = Math.max(R.fastest, R.boost); R.surge = surge;
    if (surge > .35 && t - R.rushAt > .7 && !over) { R.rushAt = t; buzz(12);   // a surge forward: a burst of snow from its track, and the engine rising (its recording at most every second and a half, and only when there is still some way to go forward; without the recording: two quick low notes)
      if (t - R.revAt > 1.5 && fwd < .8) { R.revAt = t; if (!fx('revup', { pan: here() }) && cues) { globe.bell(196, 0, .045); globe.bell(293.66, .05, .045); } }
      const rr = at('rear'); if (rr && !G.air) for (let k = 0; k < 14; k++) G.pops.push({ x: rr[0] + Math.random() * 10, y: rr[1] + 2, vx: -(120 + Math.random() * 260), vy: -40 - Math.random() * 190, g: 420, life: .35 + Math.random() * .4, t: 0, s: 2.5 + Math.random() * 4.5, col: 'rgba(255,255,255,.9)' }); }
    if (surge < -.45 && fwd > .2 && t - R.backAt > 1.5 && !over) { R.backAt = t; fx('revdown', { pan: here() }); }   // dropping back: the engine sinks (at most every second and a half, and only when there is still some way to drop)
    const dtau = dt * (1 + BOOST * R.boost); if (R.end) R.end += dt; else R.t += dtau; const tau = R.t, free = tau < RIDE_FREE;
    // how fast: it sets off, then goes a little faster for every second ridden after the free ones; when the lamp is out it comes to a stop
    const goal = over ? 0 : FAST[0] + Math.max(0, tau - RIDE_FREE) * FAST[1]; R.m += (goal - R.m) * Math.min(1, dt * (over ? 2.4 : 1.2));
    const v = speed(), lamp = at('lamp'), nose = at('nose'), rear = at('rear'); R.lampX = lamp ? lamp[0] : G.sx + R.len * .4; R.reach = PW * (.14 + .5 * R.bs);   // (reach: how far ahead of the lamp its light shows the snow)
    // the wood: moonlit, then dark, by turns (the first dark stretch is short and comes inside the free seconds; later ones are longer, with less moonlight between)
    // (the dark no longer comes and goes since 24 Nov: DARK_LEVEL. What follows is kept, switched off, in case it is wanted again)
    if (false) { if (!R.darkOn && tau >= R.darkAt) { R.darkOn = true; if (!R.told.dark) { R.told.dark = 1; note('Dark wood! Your light shows the way', 3); } say('The wood grows dark. The headlight shows the way.'); globe.bell(196, 0, .05); globe.bell(146.83, .14, .05); }
      else if (R.darkOn && tau >= R.lightAt) { R.darkOn = false; if (tau < DARK2[0]) { R.darkAt = DARK2[0]; R.lightAt = DARK2[1]; } else { const q = clamp((tau - RIDE_FREE) / 210, 0, 1); R.darkAt = Math.max(RIDE_FREE + 4, tau + lerp(9, 5, q) + Math.random() * 2); R.lightAt = R.darkAt + lerp(8, 15, q) + Math.random() * 3; }
        say('Moonlight again.'); globe.bell(392, 0, .04); globe.bell(523.25, .12, .04); }
      }
    R.dark += (DARK_LEVEL - R.dark) * Math.min(1, dt * 1.6);
    // HEARTS: a heart to catch now and then (none while he has all five, and none in the last 15 seconds); the ride is over when the last
    // heart has gone (half a second after, so that it is seen to break), or HOME at the end of the way
    if (!over) { if (tau >= R.heartAt) { R.heartAt = tau + lerp(HEART_GAP[0], HEART_GAP[1], clamp((tau - RIDE_FREE) / 180, 0, 1)) + Math.random() * 6; if (R.hearts < HEARTS_MAX && tau < HOME - 15) rideHeart(); }
      if (!R.told.free && !free) { R.told.free = 1; note('Careful now: hits cost hearts!', 2.6); say('From now on, running into something, or an icicle that hits him, takes a heart. Catch the glowing hearts to get more.'); }
      if (R.endAt && t >= R.endAt) endRide(); else if (tau >= HOME) { R.home = true; endRide(); } }
    R.bs += (R.b - R.bs) * Math.min(1, dt * 6);
    const flick = calm ? 1 : 1 - .6 * Math.max(0, Math.sin((t - R.bumpT) * 40)) * Math.exp(-(t - R.bumpT) * 4); ride.state.lamp = R.end ? Math.max(0, .35 - R.end) : (.35 + .65 * R.bs) * flick;   // (it flickers when he has run into something)
    if (!R.end) { R.acc += dtau; while (R.acc >= 1) { R.acc -= 1; G.score += PTS.ride; G.pts.ride += PTS.ride; } }   // points for every second of track ridden (they count up quietly)
    if (!R.end && tau >= R.beatAt) beat();
    // the coins: the snowmobile and its rider have only to touch one (a low one is ridden through; a high one wants a jump)
    const fires = G.obs.filter(o => o.kind === 'fire'), x0 = rear ? rear[0] + R.len * .08 : G.sx - R.len * .4, x1 = nose ? nose[0] - R.len * .03 : G.sx + R.len * .5;
    for (const c of R.coins) { c.x -= v * dt; const shown = R.dark < .6 || c.x < R.lampX + R.reach + 10 || fires.some(f => Math.abs(f.x - c.x) < 170 * f.k); c.lit += ((shown ? 1 : 0) - c.lit) * Math.min(1, dt * 8);
      if (c.ring && !c.rang && c.x - x1 < v * .5) { c.rang = true; if (cues && !R.end) { const pan = clamp((c.x - G.sx) / (PW * .5), -1, 1); globe.bell(1568, 0, .04, pan); globe.bell(2093, .08, .04, pan); } }   // ("jump now for the coins up there")
      if (!R.end && c.x > x0 && c.x < x1 && c.h + c.r > G.jy - 4 && c.h - c.r < G.jy + 1.3 * u) { c.got = true; if (c.heart) heartGot(c); else coinGot(c); } }
    R.coins = R.coins.filter(c => !c.got && c.x > -40);
    if (R.run && (t - R.comboT > .4 || R.end)) { plus(R.run, Math.min(R.runAt[0], x1), R.runAt[1] - 16); R.run = 0; }   // a run of coins is over: its points rise once, together
    // The letters. Snowflakes fall again, one at a time, and spell GOOD TIDINGS. Most come down ahead of where the snowmobile is, so it has to be
    // brought forward to be under them (which is faster); some behind it. One is caught by being under it: on the snow or in a jump.
    if (!over) { if (R.again && tau >= R.again) { R.again = 0; G.i = 0; }   // (the phrase was whole: now it begins again)
      if (!R.letter && !R.again && tau >= R.nextAt && G.i < G.letters.length) rideLetter();
      const L = R.letter;
      if (L) { L.y += L.vy * dt; L.rot += dt * L.spin; L.x = L.bx + Math.sin(t * 1.2 + L.ph) * Math.min(8, PW * .02); const mid = G.sx + R.len * .03, top = headY();
        if (Math.abs(L.x - mid) < R.len * .47 + L.r * .4 && L.y + L.r * .5 > top && L.y - L.r < feetY() + 4) rideCaught(L);
        else if (L.y - L.r * .3 > moundY(L.x)) { pop(L.x, moundY(L.x), '#ffffff', 10); globe.bell(196, 0, .05); R.letter = null; R.missed++; R.missRow++; R.nextAt = tau + .7; say('Missed. ' + L.ch + ' is coming again.'); }
        else if (cues && t >= G.cueAt) { const dx = L.x - mid, under = Math.abs(dx) < R.len * .47, near = clamp((L.y + L.r) / Math.max(1, top), 0, 1); G.cueAt = t + lerp(.62, .17, near); globe.bell(under ? 1318.5 : 659.25, 0, under ? .05 : .032, clamp(dx / (PW * .3), -1, 1)); } } }
    // The icicles. Early in the ride one does not begin to shake while something on the snow is about to reach him (within 1.2 seconds), or a
    // ramp: one thing at a time. Later they come as they will.
    if (!over && tau >= R.iceAt) { const p = clamp((tau - RIDE_FREE) / 240, 0, 1), soon = p < .3 && (!!G.ramp || G.obs.some(o => !o.done && o.x > G.sx && (o.x - o.hx - G.sx) / Math.max(60, v) < 1.2) || R.ramps.some(r => r.x + r.L > G.sx - R.len * .3 && r.x - G.sx < v * .9));
      if (iceBusy() || soon || !rideIce()) R.iceAt = tau + .4; else R.iceAt = tau + lerp(ICE_GAP[0], ICE_GAP[1], p) + Math.random() * 2; }
    // what lies in his way. As on foot, what counts is the moment a thing reaches the middle of the snowmobile: in the air then, and
    // higher than it is, he is over it. The knocks and the two notes that say "now" come only once the thing has been seen: in
    // moonlight from the edge of the screen; in the dark when the headlight reaches it (a campfire shows by its own light, and
    // lights what is near it).
    let ready = false; const fw = 14 * rk();
    for (const o of G.obs) { o.x -= v * dt; const tc = (o.x - o.hx - G.sx) / Math.max(60, v);
      if (!o.seen && (R.dark < .6 || o.kind === 'fire' || o.x - o.hx < R.lampX + R.reach || fires.some(f => f !== o && Math.abs(f.x - o.x) < 165 * f.k))) { o.seen = true; const n = R.told[o.kind] = (R.told[o.kind] || 0) + 1;
        if (n === 1) note(o.kind === 'fire' ? 'A campfire! Jump over it' : 'A branch! Jump over it', 2.2); if (n <= 2) say(o.kind === 'fire' ? 'A campfire ahead. Jump when it rings.' : 'A branch ahead. Jump when it rings.'); }
      o.a += ((o.seen ? 1 : 0) - o.a) * Math.min(1, dt * 9);
      if (!o.hit && !o.done && !R.end) {
        if (Math.abs(o.x - G.sx) < o.hx + fw) { if (t < R.safeT) o.done = true; else if (G.jy >= o.hh) { o.done = true; G.cleared++; globe.bell(1046.5, 0, .04); globe.bell(1568, .07, .03); gain(PTS.jump, 'jumps', G.sx + u * .5, feetY() - u * 1.05); } else { o.hit = true; bump(o); } }   // (its points rise in front of him, clear of the words at the top)
        else if (o.x < G.sx) o.done = true;
        else if (o.seen) { const pan = clamp((o.x - G.sx) / (PW * .5), -1, 1), held = !!o.ramp && (o.ramp.x + o.ramp.L > G.sx + R.len * .25 || G.air);
          if (tc < RING && held) { /* (after a ramp: see beat) */ } else if (tc < RING) { ready = true; if (!o.rang) { o.rang = true; if (cues) { globe.bell(880, 0, .07, pan); globe.bell(1174.66, .09, .07, pan); } } }
          else if (cues && t >= o.cue) { o.cue = t + .26; globe.bell(o.kind === 'fire' ? 233.08 : 174.61, 0, .045, pan); if (o.kind === 'fire') globe.bell(311.13, .07, .025, pan); } } }
      if (o.x < -160) o.gone = true; }
    G.obs = G.obs.filter(o => !o.gone);
    // the ramps (in the dark a ramp shows from the first, dimly: its white edge, its gold arrowheads and its flag catch what light there is)
    for (const r of R.ramps) { r.x -= v * dt;
      if (!r.seen) { r.seen = true; const n = R.told.ramp = (R.told.ramp || 0) + 1;
        if (n === 1) note('A ramp! JUMP at the top for big air', 3.2); if (n <= 2) say('A ramp ahead: it throws him into a jump. Press Jump when it rings, at the top of the ramp, for a bigger jump.'); if (cues && !R.end) { globe.bell(392, 0, .04); globe.bell(587.33, .09, .04); } }
      r.a += ((r.seen ? 1 : 0) - r.a) * Math.min(1, dt * 9); }
    R.ramps = R.ramps.filter(r => r.x + r.L > -80);
    if (G.ramp && !R.end) { const q = (G.sx + R.len * .25 - G.ramp.x) / G.ramp.L; if (q >= 1 - RAMP.zone) { ready = true; if (!G.ramp.rang) { G.ramp.rang = true; if (cues) { globe.bell(880, 0, .07); globe.bell(1174.66, .09, .07); } } } }   // near the top of a ramp: now is the moment for JUMP
    glow(ready && !R.end);
    // the snow its track throws up behind
    if (rear && G.jy <= 0 && R.m > .25 && t >= R.sprayAt && G.pops.length < 170) { const kick = Math.max(0, surge), q = v / 200 * (1 + 1.6 * kick); R.sprayAt = t + (kick > .25 ? .011 : .028);   // (a great deal more of it when it surges forward)
      G.pops.push({ x: rear[0] + Math.random() * 6, y: rear[1] + 3, vx: -(50 + Math.random() * 130) * q, vy: -24 - Math.random() * 80 * q, g: 300, life: .3 + Math.random() * .3, t: 0, s: (1.5 + Math.random() * 2.4) * (1 + .6 * kick), col: 'rgba(255,255,255,.85)' }); }
    if (R.end > 1.9 && G.jy <= 0) startWord();
  }
  // How the snowmobile sits as it rides: turned a little short of side-on; its nose up as a jump rises and down as it comes back to
  // the snow; a jolt when it has run into something. When the ride is over it turns to face us.
  function ridePose(dt) {
    const R = G.ride, t = G.t, word = G.phase === 'word', q = word ? smooth(.1, 1.5, G.pt) : 0, jolt = calm ? 0 : Math.sin((t - R.bumpT) * 22) * Math.exp(-(t - R.bumpT) * 5) * .9;
    const air = G.air, want = calm ? 0 : (air ? clamp(-G.jv / (4 * rpeak() / JT), -1, 1) * 1.15 : G.ramp ? -Math.atan2(G.ramp.h, G.ramp.L) / .16 : -.22 * R.boost - .5 * Math.max(0, R.surge)) + jolt;   // (on a ramp it lies along the slope)
    R.pitch += (want - R.pitch) * Math.min(1, dt * 12);   // (its nose lifts a little when it is going faster)
    fig.pose = { yaw: lerp(RYAW, .214, q), lean: R.pitch, look: lerp(-.45, 0, q), up: 0, cheer: 0, walk: 0 };
  }

  // JUMP was pressed near the top of a ramp: the big jump (its words rise ahead of him, where he will not fly through them)
  function bigAir() { const R = G.ride; R.airs++; [659.25, 880, 1174.66, 1568].forEach((f, k) => globe.bell(f, k * .06, .05)); buzz([20, 30, 40]); fx('bigair', { pan: here() }); G.gainT = G.t; G.gains.push({ n: 0, tag: 'BIG AIR!', x: G.sx + R.len * .95, y: feetY() - R.u * 1.2, t: 0 }); say('Big air!'); }

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
    } else if (G.phase === 'ride' && !G.ride.end) {   // on the snowmobile: forward and back along the snow, between the left of the screen and well across it
      const xb = rideX(), xf = rideFar(), pad = G.pad.r - G.pad.l; G.padT = pad ? G.padT + dt : 0; if (pad) G.touchT = t;
      const push = (G.keys.r - G.keys.l) + pad * lerp(.7, 1, clamp(G.padT / .3, 0, 1)); if (push) G.tx += push * (xf - xb) * 2.1 * dt;   // (a button or a key held down: the whole way in about half a second)
      G.tx = clamp(G.tx, xb, xf); const want = (G.tx - G.sx) * 10, cap = PW * 2; G.vx = clamp(want, -cap, cap); G.sx += G.vx * dt;
    } else if (riding()) { G.vx *= Math.exp(-dt * 6); G.sx += G.vx * dt; if (G.ride.end) G.sx = clamp(G.sx, rideX(), rideFar()); }   // (the lamp is out: it comes to a stop where it may ride, however fast it was being brought forward)   // (the ride has not begun, or is over: it keeps its place)
    else { G.vx *= Math.exp(-dt * 6); G.sx = clamp(G.sx + G.vx * dt, lo, hi); }
    // tripped by a branch, he rolls forward along the snow, once over, a little way along the screen, while the ground rushes by
    const R = G.roll; if (R) { const p0 = clamp(R.t / ROLL, 0, 1); R.t += dt; const p1 = clamp(R.t / ROLL, 0, 1), ease = q => q * (2 - q), step = R.far * (ease(p1) - ease(p0));
      G.tx = clamp(G.tx + step, lo, hi); G.sx = clamp(G.sx + step, lo, hi); G.rush = calm ? 0 : 1.8 * Math.sin(Math.PI * p1);
      if (p1 >= 1) { G.roll = null; G.rush = 0; G.safeT = t + .35; pop(G.sx, moundY(G.sx), '#ffffff', 9); globe.bell(130.81, 0, .05); buzz(20); } }
    G.hf += (hfGoal() - G.hf) * Math.min(1, dt * (G.roll || t - G.ouchT < 1.6 ? .9 : 3));   // (after a fall the view comes in slowly)
    // he walks: the ground goes by (he sets off over the first two seconds, and stops when the phrase is spelled)
    const go = play || G.phase === 'ride'; G.going += ((go ? 1 : 0) - G.going) * Math.min(1, dt * (go ? 1.2 : 2.5)); const went = speed() * dt, rush = riding() ? BACK / G.ride.z : 1; G.walk += went; G.far = (G.far || 0) + went * rush;   // (far: how far the wood behind has gone by. On the ride it goes by faster than the snow does, so that speed shows)
    for (const f of G.amb) { f.v += (18 + f.s * 16) * (1 + f.z) * dt / H; f.u += (Math.sin(t * .9 + f.ph) * 6 * dt - (calm ? 0 : went * rush * (.1 + f.z * .18))) / W; if (f.v > 1.02) { f.v = -.02; f.u = Math.random(); } if (f.u < -.02) f.u += 1.04; }
    for (const m of G.trail) m.x -= went; if (G.trail.length && G.trail[0].x < -40) G.trail.shift();
    if (G.jy <= 0 && !G.roll && G.going > .3 && G.walk >= G.trailAt) { G.trailAt = G.walk + 26; G.trail.push({ x: riding() ? G.sx - G.ride.len * .3 : G.sx }); if (G.trail.length > 40) G.trail.shift(); }   // his track in the snow (the snowmobile's: from under its track)
    if (play && G.jy <= 0 && !G.roll && G.going > .3) { if (G.walk >= G.stepAt) { G.stepAt = G.walk + pace() * .5; fx('step', { pan: here() }); } }   // …and the sound of his steps: two a second at full pace
    else G.stepAt = G.walk + pace() * .18;                                                                                                          // (none in the air or in a tumble; the next one comes just after he is down)
    // Up and down. He is on the snow or in the air (G.air). The snow under him is level (G.gy = 0), except on the ride where a ramp is under the snowmobile's skis: there it is
    // the ramp's slope, and he rides up it. When the top of the ramp has gone by under the skis, the ramp throws him into a jump by itself.
    // A jump (JUMP): on the snowmobile, the faster it is going the higher it goes. Pressed near the top of a ramp, it sets the big jump:
    // the ramp then throws him a good deal higher (and so it does if JUMP is pressed just after the ramp has thrown him).
    { const on0 = G.ramp, onSnow = !G.air, RR = G.phase === 'ride' && !G.ride.end ? G.ride : null; let gy = 0, on = null;
      if (RR) { const rx = G.sx + RR.len * .25; for (const r of RR.ramps) if (rx >= r.x && rx < r.x + r.L) { gy = (rx - r.x) / r.L * r.h; on = r; } }
      const pk = riding() ? rpeak() : peak(), up = riding() ? 1 + JUMP_UP * G.ride.boost : 1, cap = h => (riding() && G.ride.top < 1e8 ? Math.min(h, Math.max(pk * .5, G.ride.top - G.jy)) : h), go = h => { G.jg = 8 * pk / (JT * JT); G.jv = Math.sqrt(2 * G.jg * cap(h)); };   // (go: thrown upward so as to rise by h more)
      let thrown = false;
      if (onSnow) { if (RR && on0 && !on) { const best = !!on0.armed; thrown = true; G.air = true; G.launchT = t; G.late = !best; RR.lifts++; go(pk * (best ? RAMP.best : RAMP.auto) * up);   // the top of the ramp has gone by: it throws him (higher, if JUMP was pressed near the top)
          globe.bell(392, 0, .05); globe.bell(523.25, .06, .05); globe.bell(783.99, .12, .04); buzz(20); if (!fx('launch', { pan: here() })) fx('jump', { pan: here() }); pop(G.sx + RR.len * .2, moundY(G.sx) - G.jy, '#ffffff', 8); if (best) { G.jumps++; bigAir(); } }
        else G.jy = gy; }
      const asked = (play || RR) && !G.roll && t - G.jumpAsk < .2;
      if (asked && onSnow && !thrown) { G.jumpAsk = -9;
        if (RR && on && (G.sx + RR.len * .25 - on.x) / on.L >= 1 - RAMP.zone) { if (!on.armed) { on.armed = true; globe.bell(987.77, 0, .05); buzz(10); } }   // near the top of a ramp: the big jump is set, and goes off at the top
        else { go(pk * up); G.jy = gy + .01; G.air = true; G.jumps++; globe.bell(392, 0, .05); globe.bell(659.25, .07, .04); buzz(15); fx('jump', { pan: here() }); } }
      else if (asked && RR && G.late && t - G.launchT < RAMP.late && G.air) { G.jumpAsk = -9; G.late = false; go(pk * RAMP.best * up); G.jumps++; bigAir(); }   // (pressed a moment after the ramp threw him: it still counts)
      if (G.air) { G.jv -= (G.jg || 8 * peak() / (JT * JT)) * dt; G.jy += G.jv * dt; if (G.jy <= gy && G.jv <= 0) { G.jy = gy; G.jv = 0; G.air = false; G.late = false; pop(G.sx, moundY(G.sx) - gy, '#ffffff', 6); globe.bell(130.81, 0, .035); if (!(riding() && fx('thump', { pan: here() }))) fx('land', { pan: here() }); } }
      G.gy = gy; G.ramp = G.air ? null : on; }

    if (play) {
      const top = headY(), bottom = catchTo(top), going = G.i < G.letters.length, most = PW < 360 ? 3 : PW < 520 ? 4 : 5, drop = top + G.jy;   // (drop: how far a flake falls to the top of his hat, as he stands)
      // small flakes to catch all the while: each one is a little more snow for him
      if (t >= G.sparkAt) { G.sparkAt = t + (t < 6 ? .6 : 1) + Math.random() * .9; const r = 9 + Math.random() * 5; G.sparks.push({ x: PX + r + Math.random() * (PW - 2 * r), y: -r * 2, r, vy: (drop + r * 2) / (2.2 + Math.random() * 2.2), rot: Math.random() * 6, ph: Math.random() * 6 }); }
      for (const s of G.sparks) { s.y += s.vy * dt; s.rot += dt * 1.2; s.x += Math.sin(t * 1.4 + s.ph) * 10 * dt;
        if (s.y > top - s.r && s.y < bottom && Math.abs(s.x - G.sx) < grab() + s.r * 1.5) { s.gone = true; pop(s.x, s.y, '#ffffff', 5); grow(1, (s.x - W / 2) / (W / 2) * .6); gain(snowPts(PTS.flake), 'snow', s.x, s.y); fx('flake', { pan: from(s.x) }); }
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

      if (!going && !G.letter && t >= G.nextAt && !G.fly.length && !G.roll) phraseDone();   // (if he is rolling just then, when he is up again)
      G.played += dt;
    }
    if (G.phase === 'gift') stepGift(dt);
    if (G.phase === 'ride') stepRide(dt); else stepObs(dt, play);
    if (G.ride && G.phase !== 'ride' && G.phase !== 'gift') { G.ride.dark += (0 - G.ride.dark) * Math.min(1, dt * 3); G.ride.flash = 0; }   // (the ride is over: the moon is out again)
    if (play || G.phase === 'ride' || G.phase === 'word' || G.phase === 'out') stepIce(dt, play);
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
    if (G.logo && !['play', 'word', 'gift', 'ride'].includes(G.phase)) { fig.pose = FRONT(); return; }   // a close-up of its logo: it faces us and keeps still
    if (riding()) { ridePose(dt); return; }
    const L = G.letter || G.gift || (G.phase === 'gift' && G.ride ? G.ride.box : null), glad = t - G.cheerT < .9, ouch = t - G.ouchT < .55 || !!G.roll, sad = t - G.meltT < 1.3 || t - G.ouchT < 1.2, S = G.sun;
    const over = G.ice.some(c => c.state === 'shake' && Math.abs(iceX(c) - G.sx) < reach());
    fig.pose = { yaw: clamp(G.vx / (PW * 1.6), -1, 1) * .5 + (play ? .22 * G.going : 0), lean: clamp(G.vx / (PW * 1.8), -1, 1) * -.9,
      look: ouch ? Math.sin((t - G.ouchT) * 24) * .9 : L ? clamp((L.x - G.sx) / (PW * .3), -1, 1) : 0, up: sad ? -.8 : over || (S && S.t < WARN && inSun(S)) ? 1 : L ? .75 : glad ? .4 : 0,
      cheer: G.phase === 'word' || G.phase === 'out' || glad || G.jy > 0 || G.roll ? 1 : sad ? 0 : L && Math.abs(L.x - G.sx) < reach() * 1.6 && L.y > headY() * .45 ? .65 : 0,
      walk: play ? Math.max(.6 * G.going, clamp(Math.abs(G.vx) / (PW * .8), 0, 1)) * (G.jy > 0 || G.roll ? 0 : 1) : 0 };
  }
  const FRONT = () => ({ yaw: riding() ? .214 : 0, lean: 0, look: 0, up: 0, cheer: 1, walk: 0, still: true, bare: !calm && G.e > .24 });   // (bare: its own logo is off, because the sharp one is drawn over it. On the snowmobile he sits turned a little: it is turned back by as much, so the logo on his hat faces us)
  const midY = () => feetY() - fig.feetV * unit();   // the middle of the figure's picture, in the game

  // Draw the figure's picture for this frame. Zoomed in, only the part of it that is on the screen is drawn, so it stays sharp.
  // (ox, oy: where the middle of its picture is on the page; u: pixels to one of its units; own: the game is drawing it, not the globe.)
  // In the game it is as far built as the snow and the gifts have made it; over the globe it is whole.
  function renderFigure(dt, ox, oy, u, own) {
    let view = null; const c = G.cam;
    if (c && c.Z > 1.25) { let x0 = 9, y0 = 9, x1 = -9, y1 = -9;
      for (const [sx, sy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const q = unCam(c, sx, sy), px = (q[0] - ox) / u, py = (q[1] - oy) / u; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
      x0 = Math.max(-1, x0); y0 = Math.max(-1, y0); x1 = Math.min(1, x1); y1 = Math.min(1, y1);
      if (x1 > x0 && y1 > y0) { const half = Math.max(x1 - x0, y1 - y0) / 2 * 1.03; if (half < .85) view = [(x0 + x1) / 2, (y0 + y1) / 2, half]; } }
    G.view = view; if (pieces && fig === figure) figure.made = own ? Object.assign(made(), G.snap ? { snap: true } : null) : null;
    if (!own && !view) return;   // (over the globe, the globe draws the figure itself)
    try { fig.frame(performance.now() / 1000, dt, own ? { px: clamp(2 * u * DPR, 256, 1280), view } : { view }); } catch (e) {}
    if (own) G.snap = false;     // (the first time, he is put together at once: nobody sees him change)
  }
  // The snowmobile, with him on it: drawn on top of the snow (its near ski is nearer to us than the line it rides along), with its
  // light on the snow ahead under it.
  function drawRide(u) {
    const R = G.ride, lamp = at('lamp'), on = R.end ? Math.max(0, 1 - R.end / .6) : 1;
    if (lamp && on > .01) { const cx = lamp[0] + R.reach * .55; rlook.pool(x, cx, moundY(cx) + 5, R.reach * .64, Math.max(10, u * .17), (.4 + .45 * R.bs) * on); }
    drawFigure(G.sx, feetY() - fig.feetV * u, u);
  }
  // a heart shape, its point at the bottom, centred on (cx, cy), r across from the middle
  function heartPath(cx, cy, r) { x.beginPath(); x.moveTo(cx, cy + r * .95); x.bezierCurveTo(cx - r * 1.35, cy + r * .1, cx - r * 1.05, cy - r * 1.15, cx, cy - r * .45); x.bezierCurveTo(cx + r * 1.05, cy - r * 1.15, cx + r * 1.35, cy + r * .1, cx, cy + r * .95); x.closePath(); }
  function drawHeart(cx, cy, r, fill, glowA) { x.save(); if (glowA > 0) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 2.6); g.addColorStop(0, `rgba(255,120,150,${.55 * glowA})`); g.addColorStop(1, 'rgba(255,120,150,0)'); x.fillStyle = g; x.fillRect(cx - r * 2.6, cy - r * 2.6, r * 5.2, r * 5.2); }
    heartPath(cx, cy, r); x.fillStyle = fill; x.fill(); x.lineWidth = Math.max(1.5, r * .16); x.strokeStyle = '#ffffff'; x.stroke(); x.beginPath(); x.ellipse(cx - r * .42, cy - r * .38, r * .2, r * .13, -.6, 0, 6.283); x.fillStyle = 'rgba(255,255,255,.6)'; x.fill(); x.restore(); }
  function drawCoins(t) { const R = G.ride, B = figure.badge; for (const c of R.coins) { const py = moundY(c.x) - c.h + (calm ? 0 : Math.sin(t * 3 + c.ph) * 2.5);
    if (c.heart) { const beat = calm ? .5 : .5 + .5 * Math.sin(t * 7.5); drawHeart(c.x, py, c.r * (calm ? 1 : .9 + .25 * beat), '#ff3d5a', .6 + .4 * beat); continue; }   // (a heart to catch: it beats, and glows)
    if (c.sky) { const q = calm ? .5 : .5 + .5 * Math.sin(t * 6 + c.ph); x.save(); x.globalAlpha = .5 + .4 * q; x.strokeStyle = '#ffe9a8'; x.lineWidth = Math.max(1.5, c.r * .16); x.beginPath(); x.arc(c.x, py, c.r * (1.42 + .14 * q), 0, 6.283); x.stroke(); x.restore(); }   // (the top coins, which want speed: a ring of light round each)
    rlook.coin(x, c.x, py, c.r, t * 5.2 + c.ph, lerp(1, c.lit, R.dark), B); } }
  // The dark of the wood, and the light in it. Where it is dark, a layer of dark lies over the picture, and every light takes its
  // share out of it: the beam of the headlight and its light on the snow; each campfire, which lights the snow and the air round
  // it; each coin, a glint; and the snowmobile and its rider, who are never lost. Then the beam itself, through the air.
  function drawLight(t) {
    const R = G.ride, u = R.u, lamp = at('lamp'); if (!lamp) return;
    const flick = calm ? 1 : 1 - .6 * Math.max(0, Math.sin((t - R.bumpT) * 40)) * Math.exp(-(t - R.bumpT) * 4), on = (R.end ? Math.max(0, 1 - R.end / .6) : 1) * flick;
    const bx = lamp[0] + R.reach, by = moundY(bx) - u * .05, half = R.reach * .2 + u * .1, px = lamp[0] + R.reach * .55;   // the beam: from the lamp to where its light ends on the snow ahead
    if (R.dark > .01) { const D = rlook.dark; D.begin(W, H, R.dark * .9);
      D.spot(G.sx + u * .05, feetY() - u * .62, u * 1.2, u * 1.0, .82);
      D.cone(lamp[0] - u * .05, lamp[1], bx + R.reach * .14, by, half * 1.5 + u * .1, on);
      D.spot(px, moundY(px) + 4, R.reach * .72, u * .36, .85 * on);
      for (const o of G.obs) if (o.kind === 'fire') { const f = calm ? 1 : .92 + .08 * Math.sin(t * 9 + o.ph * 20); D.spot(o.x, restY(o.x) - 26 * o.k, 215 * o.k * f, 165 * o.k * f, .97); }
      for (const c of R.coins) D.spot(c.x, moundY(c.x) - c.h, c.r * 2.6, c.r * 2.6, .66);
      for (const r of R.ramps) D.spot(r.x + r.L * .56, moundY(r.x + r.L * .5) - r.h * .75, r.L * .8, r.h * 2.3, .62 * r.a);   // (a ramp: dimly, from the first)
      for (const c of R.coins) if (c.heart) D.spot(c.x, moundY(c.x) - c.h, c.r * 2.8, c.r * 2.8, .9);   // (a heart to catch glows)
      if (R.letter) D.spot(R.letter.x, R.letter.y, R.letter.r * 2.5, R.letter.r * 2.5, .85);                                   // (a letter glows)
      for (const c of G.ice) if (c.state === 'shake' || c.state === 'fall') { const px = iceX(c), L = iceLen(c); D.spot(px, c.y + L * .5, L * .95, L * 1.15, .92); D.spot(px, moundY(px) + 4, clamp(PW * .075, 24, 44) * 1.7, 20, .85); if (c.state === 'shake') D.spot(px, (L + moundY(px)) / 2, clamp(PW * .05, 15, 26) * 1.3, (moundY(px) - L) * .56, .5); }   // (an icicle that is coming down glows, and so do the mark where it will land and the column over it)
      D.end(x); }
    // the air rushing by when it is going faster: streaks, more and brighter the faster it goes, and brightest as it surges forward. They are drawn
    // over the dark, so that they show in the dark wood too, and only between the words at the top and the snow (not with "reduce motion" on)
    if (!calm && R.boost > .1 && !R.end) { const a = clamp((R.boost - .1) / .5, 0, 1) * (1 + .5 * Math.max(0, R.surge)), fr = v => v - Math.floor(v), y0 = Math.min(hudLow() + 48, groundY - 120), y1 = groundY - 8; x.save(); x.lineCap = 'round'; x.strokeStyle = '#ffffff';
      for (let k = 0; k < 14; k++) { const len = PW * (.12 + .18 * fr(k * .37)), sp = PW * (2.6 + 1.8 * fr(k * .77)), px = W + len - fr((t * sp + k * 173) / (W + 2 * len)) * (W + 2 * len), py = lerp(y0, y1, fr(k * .618 + .13));
        x.globalAlpha = Math.min(.8, a * (.22 + .3 * fr(k * .29))); x.lineWidth = 1.6 + 2 * fr(k * .53); x.beginPath(); x.moveTo(px, py); x.lineTo(px + len, py); x.stroke(); }
      x.restore(); }
    rlook.beam(x, lamp[0], lamp[1], bx, by, half, (.2 + .5 * R.bs) * on * (.45 + .55 * R.dark));
  }
  // The big gift: the red box of the small gifts, several times the size. It rocks as it comes down, bounces once as it lands,
  // and shakes harder and harder before it opens.
  function drawBigGift(t) {
    const B = G.ride.box, k = B.down ? clamp(B.t / 1.1, 0, 1) : 0, dx = calm || !B.down ? 0 : Math.sin(t * 46) * 3.2 * k * k, hop = B.down && !calm ? Math.abs(Math.sin(B.t * 9)) * 7 * Math.exp(-B.t * 4) : 0;
    if (B.down) { x.save(); x.translate(B.x, moundY(B.x) + 5); x.scale(1, .22); const sh = x.createRadialGradient(0, 0, B.r * .2, 0, 0, B.r * 1.25); sh.addColorStop(0, 'rgba(36,58,112,.4)'); sh.addColorStop(1, 'rgba(36,58,112,0)'); x.fillStyle = sh; x.beginPath(); x.arc(0, 0, B.r * 1.25, 0, 6.283); x.fill(); x.restore(); }
    giftBox({ x: B.x + dx, y: B.y - hop, r: B.r, ph: 0 }, B.down ? 0 : t);
  }
  // A ramp: a wedge, low at the end he comes to and high at the far end. It is HIGH CONTRAST against the snow (Ben, 17 Nov): its side is
  // dark Ora blue with a darker edge, three bold gold arrowheads on it point up the slope, the slope itself is capped in white (it shows
  // against the dark wood behind), and at its top is a coral flag edged in white. (In the dark it shows from the first, dimly: see drawLight.)
  function drawRamps(t) {
    for (const r of G.ride.ramps) { if (!(r.a > .02)) continue; const x0 = r.x, x1 = r.x + r.L, y0 = moundY(x0) + 3, y1 = moundY(x1) + 3, top = y1 - r.h, k = r.h / 31, ang = Math.atan2(top - y0, x1 - x0), low = 9 * k;
      x.save(); x.globalAlpha = r.a; x.lineJoin = 'round'; x.lineCap = 'round';
      x.fillStyle = 'rgba(20,34,84,.3)'; x.beginPath(); x.ellipse((x0 + x1) / 2 + 8 * k, y1 + low + 1.5 * k, r.L * .57, 5.5 * k, 0, 0, 6.283); x.fill();   // its shadow on the snow
      x.beginPath(); x.moveTo(x0 - 7 * k, y0 + low); x.lineTo(x0 - 1 * k, y0 - 1); x.lineTo(x1 - 3 * k, top); x.quadraticCurveTo(x1 + 3 * k, top - 1.5 * k, x1 + 4 * k, top + 6 * k); x.lineTo(x1 + 9 * k, y1 + low); x.closePath();
      const g = x.createLinearGradient(0, top, 0, y1 + low); g.addColorStop(0, '#3157bd'); g.addColorStop(1, '#16286a'); x.fillStyle = g; x.fill(); x.lineWidth = Math.max(2, 2.8 * k); x.strokeStyle = '#0d1a45'; x.stroke();
      x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(3, 5.2 * k); x.beginPath(); x.moveTo(x0 + 1 * k, y0 - 2.5 * k); x.lineTo(x1 - 3 * k, top - 1 * k); x.stroke();   // the slope he rides up: capped in white
      x.strokeStyle = '#ffd66b'; x.lineWidth = Math.max(2.6, 4 * k);   // three gold arrowheads, pointing up the slope (bigger towards the top, where there is more room)
      for (const q of [.4, .62, .84]) { const deep = r.h * q + low, px = lerp(x0, x1, q), py = lerp(y0, top, q) + deep * .56, a = Math.min(deep * .26, 8.5 * k); x.save(); x.translate(px, py); x.rotate(ang * .6); x.beginPath(); x.moveTo(-a, -a); x.lineTo(a * .25, 0); x.lineTo(-a, a); x.stroke(); x.restore(); }
      const fx0 = x1 - 2 * k, wave = calm ? 0 : Math.sin(t * 7 + r.ph) * 2.4 * k;   // the flag at its top
      x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(3, 4 * k); x.beginPath(); x.moveTo(fx0, top); x.lineTo(fx0, top - 31 * k); x.stroke(); x.strokeStyle = '#243f88'; x.lineWidth = Math.max(1.6, 2.2 * k); x.beginPath(); x.moveTo(fx0, top); x.lineTo(fx0, top - 31 * k); x.stroke();
      x.beginPath(); x.moveTo(fx0, top - 31 * k); x.lineTo(fx0 + 20 * k, top - 24 * k + wave); x.lineTo(fx0, top - 17 * k); x.closePath(); x.fillStyle = '#ff5a45'; x.fill(); x.lineWidth = Math.max(1.2, 1.6 * k); x.strokeStyle = '#ffffff'; x.stroke();
      x.restore(); }
  }
  function drawFigure(ox, oy, u) { const V = G.view; if (!fig.canvas) return;
    if (V) x.drawImage(fig.canvas, ox + (V[0] - V[2]) * u, oy + (V[1] - V[2]) * u, 2 * V[2] * u, 2 * V[2] * u); else x.drawImage(fig.canvas, ox - u, oy - u, 2 * u, 2 * u); }

  /* ── drawing ── */
  function rr(a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  // The winter night behind him. In layers (scenery), the hills and the three rows of pines go by at their own speeds as he
  // walks, far things slowest; the sky, the moon and the stars keep still. (With "reduce motion" on, none of it moves.)
  function drawNight() {
    const Sc = scenery, pic = Sc ? Sc.sky : backdrop;
    if (!pic) { x.fillStyle = '#17306a'; x.fillRect(0, 0, W, H); return; }
    const bw = pic.width, bh = pic.height, s = Math.max(W / bw, H / bh), X0 = Math.min(0, Math.max(W - bw * s, W / 2 - bw * s * .58)), Y0 = H - bh * s, ws = bw * s;
    x.drawImage(pic, X0, Y0, ws, bh * s); if (!Sc) return;
    for (const L of Sc.layers) { const dy = Y0 + L.top * bh * s, dh = L.canvas.height * s; let dx = X0 - (calm ? 0 : ((G.far || 0) * L.speed) % ws); while (dx > 0) dx -= ws;
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
    const Y = layout(), fs = Y.fs, gap = fs * 1.02, y0 = Math.max(H * .085, 46, iceH() + fs * .62) + (HEARTS_TOP && riding() ? heartTop().room : 0), at = [];
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
        x.save(); x.translate(G.sx, cy); x.rotate(turn); x.translate(-G.sx, -cy); drawFigure(G.sx, feetY() - lift - fig.feetV * u, u); x.restore(); }
      else if (!riding()) drawFigure(G.sx, feetY() - fig.feetV * u, u);   // (the snowmobile is drawn after the snow: see drawRide)
      x.beginPath(); x.moveTo(0, H); for (let px = 0; px <= W + 8; px += 8) x.lineTo(px, moundY(px)); x.lineTo(W, H); x.closePath();
      g = x.createLinearGradient(0, groundY - 4, 0, H); g.addColorStop(0, '#f7faff'); g.addColorStop(1, '#cfdcf6'); x.fillStyle = g; x.fill();
      x.save(); x.clip();
      { const span = W + 260; for (let k = 0; k < 11; k++) { const row = k * 37 % 5, f = 1 + row * .13, mx = ((k * 211.7 + 60 - G.walk * f) % span + span) % span - 130, rx = 15 + (k * 53 % 4) * 7;   // drifts and hollows in the snow: the nearer ones (lower down) go by faster
          x.fillStyle = 'rgba(150,176,228,.36)'; x.beginPath(); x.ellipse(mx, moundY(mx) + 13 + row * 13, rx, rx * .19, 0, 0, 6.283); x.fill(); } }
      { const r0 = foot() * .55; for (const m of G.trail) { x.fillStyle = `rgba(150,176,228,${.5 * clamp(1 - (G.sx - m.x) / (W * .9), 0, 1)})`; x.beginPath(); x.ellipse(m.x, moundY(m.x) + 3, r0, r0 * .32, 0, 0, 6.283); x.fill(); } }
      for (const o of G.obs) if (o.kind === 'fire') look.pool(x, o.x, restY(o.x), o.k, t, o);   // the light of each campfire on the snow
      { const air = clamp((fig.air || 0) * 4 + (G.jy + Math.max(0, lift)) / peak(), 0, 1), rx = (riding() ? G.ride.len * .5 : reach() * 1.3) * (1 - air * .3); x.translate(G.sx, moundY(G.sx) + 3); x.scale(1, .24); const sh = x.createRadialGradient(0, 0, rx * .15, 0, 0, rx);   // (smaller and paler while he is in the air)
        sh.addColorStop(0, `rgba(36,58,112,${.34 * (1 - air * .5)})`); sh.addColorStop(1, 'rgba(36,58,112,0)'); x.fillStyle = sh; x.beginPath(); x.arc(0, 0, rx, 0, 6.283); x.fill(); }
      x.restore();
      if (G.ride && G.ride.ramps.length) drawRamps(t);
      if (riding()) drawRide(u);
      if (riding() && G.phase === 'ride') for (const c of G.ice) if (c.state === 'shake') {   // on the ride the snowmobile hides the mark on the snow: a pale column shows where the icicle will come down
        const px = iceX(c), L = iceLen(c), k = smooth(0, .3, c.t) * (calm ? .8 : .6 + .4 * Math.sin(t * 14)), w = clamp(PW * .05, 15, 26), y0 = L, y1 = moundY(px) + 4, g = x.createLinearGradient(px - w, 0, px + w, 0);
        g.addColorStop(0, 'rgba(255,224,150,0)'); g.addColorStop(.5, `rgba(255,224,150,${.42 * k})`); g.addColorStop(1, 'rgba(255,224,150,0)'); x.fillStyle = g; x.fillRect(px - w, y0, 2 * w, y1 - y0); }
      for (const c of G.ice) if (c.state === 'shake' || c.state === 'fall') {   // where the icicle will land: a dark mark on the snow
        const px = iceX(c), k = c.state === 'fall' ? 1 : smooth(0, .3, c.t) * (calm ? 1 : .75 + .25 * Math.sin(t * 14)), rx = clamp(PW * .075, 24, 44);
        x.save(); x.translate(px, moundY(px) + 4); x.scale(1, .26); x.fillStyle = `rgba(30,52,110,${.5 * k})`; x.beginPath(); x.arc(0, 0, rx, 0, 6.283); x.fill(); x.lineWidth = 3; x.strokeStyle = `rgba(255,214,120,${.9 * k})`; x.stroke(); x.restore(); }
      for (const h of G.heaps) look.heap(x, h.x, restY(h.x), h.r, smooth(.1, .75, h.t));   // a snowball he has lost
      for (const o of G.obs) { if (o.kind === 'fire') { o.lean = G.going; look.fire(x, o.x, restY(o.x), o.k, t, o); } else if (o.a == null) look.branch(x, o.x, restY(o.x), barTop, o.k, o);   // what lies in his way
        else if (o.a > .02) { x.globalAlpha = o.a; look.branch(x, o.x, restY(o.x), barTop, o.k, o); x.globalAlpha = 1; } }   // (on the ride, a branch in the dark is not there to be seen until a light finds it)
      if (G.singe && !R) {   // a campfire has caught him: for a moment the end of his scarf, the top of his hat and (only just) the tip of his nose burn, with the campfire's own fire
        const sg = G.singe, a = calm ? 1 : smooth(0, .14, sg.t) * (1 - smooth(SINGE - .55, SINGE, sg.t)), b = body(), hr = (b ? b.balls[1][2] : riding() ? .17 : (fig.reach || .3) * .5) * u; sg.at = [];
        for (const [n, tall, w, glow, sparks] of FLAMES) { const q = sg.on.includes(n) && mark(n); if (!q) continue; look.flame(x, q[0], q[1], hr * tall / 62, t, { ph: sg.ph + n.length * .29, lean: G.going, a, w, glow, sparks, cover: .78 }); sg.at.push([n, q[0], q[1], hr * tall]); } }
      if (G.ride && G.ride.coins.length) drawCoins(t);
      if (G.ride && G.ride.letter) letterFlake(G.ride.letter, 1);
      flakes(false);
      if (G.sun) drawSun(G.sun);
      for (const s of G.sparks) flake6(s.x, s.y, s.r, s.rot, .9);
      for (const f of G.big) { if (f.kind === 'blank') { flake6(f.x, f.y, f.r * 1.3, f.rot, .95); x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(f.x, f.y, f.r * .16, 0, 6.283); x.fill(); } else if (f.kind === 'gift') giftBox(f, t); else letterFlake(f, 1); }
      if (G.ride && !G.ride.on) drawBigGift(t);
      drawIce(t);
      for (const o of G.toys) toy(o);
      if (riding() && (G.phase === 'ride' || G.phase === 'gift')) drawLight(t);   // (after everything that the dark can hide, and before the points and the puffs of snow, which it does not)
      for (const p of G.pops) { x.globalAlpha = 1 - p.t / p.life; x.fillStyle = p.col; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 6.283); x.fill(); } x.globalAlpha = 1;
      for (const q of G.gains) {   // points just earned: "+100" rising from where they were earned (the big ones in gold)
        const p = q.t / 1.15, big = q.n >= 50 || !q.n, fs = (big ? 22 : 16) * clamp(PW / 393, .9, 1.3), txt = q.n ? '+' + fmt(q.n) + (q.tag ? ' ' + q.tag : '') : q.tag,   // (n = 0: words alone, as "BIG AIR!")
        py = Math.max(q.y - (calm ? 24 : 12 + 40 * easeOut(p)), riding() && G.hudY ? G.hudY + fs * .8 : -1e9);   // (on the ride they stop short of the score, the light bar and the words under them)
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
      if (G.ride && G.ride.flash > 0) { x.fillStyle = `rgba(244,248,255,${Math.min(1, G.ride.flash * 1.7) * .97})`; x.fillRect(0, 0, W, H); }   // the puff of snow as the big gift bursts open: in it, he is on the snowmobile
      // the phrase at the top: caught letters in gold, the one that is needed next pulsing
      if (G.hud > 0) { const S = slots(); x.save(); x.globalAlpha = G.hud; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
        G.letters.forEach((ch, k) => { const got = k < G.i && !G.fly.some(f => f.k === k), [px, py] = S.at[k], next = k === G.i && (G.phase === 'play' || (G.phase === 'ride' && !G.ride.again)), beat = next && !calm ? 1 + .09 * Math.sin(t * 5.5) : 1, fs = S.fs * beat; x.font = `900 ${fs}px ${FONT}`;
          if (got) { x.shadowColor = 'rgba(255,214,120,.9)'; x.shadowBlur = fs * .35; x.fillStyle = '#f6d37f'; x.fillText(ch, px, py); x.shadowColor = 'transparent'; x.lineWidth = Math.max(1.5, fs * .04); x.strokeStyle = 'rgba(60,36,4,.55)'; x.strokeText(ch, px, py); x.fillText(ch, px, py); }
          else if (next) { x.fillStyle = 'rgba(8,16,40,.45)'; x.fillText(ch, px, py); x.shadowColor = 'rgba(255,214,120,.95)'; x.shadowBlur = fs * .3; x.lineWidth = Math.max(2.5, fs * .07); x.strokeStyle = '#ffe08a'; x.strokeText(ch, px, py); x.shadowColor = 'transparent';
            x.fillStyle = '#ffe08a'; x.beginPath(); x.moveTo(px - fs * .16, py + fs * .66); x.lineTo(px + fs * .16, py + fs * .66); x.lineTo(px, py + fs * .5); x.closePath(); x.fill(); }   // (a small pointer under it)
          else { x.fillStyle = 'rgba(8,16,40,.5)'; x.fillText(ch, px, py); x.lineWidth = Math.max(2, fs * .055); x.strokeStyle = 'rgba(255,255,255,.9)'; x.strokeText(ch, px, py); } });
        for (const f of G.fly) { const q = easeOut(f.t), [sx, sy] = S.at[f.k], px = lerp(f.x, sx, q), py = lerp(f.y, sy, q) - Math.sin(Math.PI * q) * 40, fs = lerp(f.r * 1.02, S.fs, q); x.font = `900 ${fs}px ${FONT}`; x.shadowColor = 'rgba(255,214,120,.9)'; x.shadowBlur = fs * .4; x.fillStyle = '#ffe9a8'; x.fillText(f.ch, px, py); x.shadowColor = 'transparent'; }
        // a few words under it, when there is something to say
        const playing = G.phase === 'play' || G.phase === 'gift' || G.phase === 'ride', N = G.note, ha = N && playing ? smooth(0, .3, t - N.t0) * (1 - smooth(N.dur - .5, N.dur, t - N.t0)) : 0;
        const sfs = clamp(PW * .05, 16, 25), sby = S.bottom + S.fs * .78 + sfs * .9;   // the score, in its own place under the phrase all through the game (the number swells for a moment when it goes up)
        let low = 0, hudY = sby + sfs * .9;   // (low: how much room the light bar takes under the score, on the ride; hudY: where all this ends)
        if (playing) { const fs = sfs, f2 = fs * (calm ? 1.08 : 1.08 + .2 * Math.max(0, 1 - (t - G.gainT) / .22)), num = fmt(G.shown), by = sby;
          x.globalAlpha = G.hud * smooth(.2, .8, t); x.font = `800 ${fs}px ${FONT}`; const w1 = x.measureText('SCORE ').width; x.font = `900 ${f2}px ${FONT}`; const w2 = x.measureText(num).width, w = w1 + w2 + fs * 1.6, x0 = W / 2 - (w1 + w2) / 2;
          x.fillStyle = 'rgba(8,14,32,.62)'; rr(W / 2 - w / 2, by - fs * .9, w, fs * 1.8, fs * .9); x.fill(); x.textAlign = 'left'; x.font = `800 ${fs}px ${FONT}`; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillText('SCORE ', x0, by + fs * .04);
          x.font = `900 ${f2}px ${FONT}`; x.fillStyle = '#ffe08a'; x.fillText(num, x0 + w1, by + fs * .04); x.textAlign = 'center';
          if (riding()) { const R = G.ride, HT = HEARTS_TOP && heartTop(), hr = HT ? HT.hr : clamp((barTop - feetY() - 8) / 3, 9, 17), gap = hr * 2.7, n = HEARTS_MAX, w = gap * n + hr * .9, cy = HT ? HT.cy : barTop - 4 - hr * 1.45,   // (in the strip between the snow under the skis and the buttons, so that nothing on the snow is hidden)
            x0 = W / 2 - gap * (n - 1) / 2;   // HEARTS: what he has left, in a row just above the buttons (so that they are not taken for hearts to catch)
            x.globalAlpha = G.hud; x.fillStyle = 'rgba(8,14,32,.62)'; rr(W / 2 - w / 2, cy - hr * 1.45, w, hr * 2.9, hr * 1.45); x.fill();
            for (let k = 0; k < n; k++) { const cx = x0 + k * gap, full = k < R.hearts, lost = k === R.hearts && t - R.lostT < .8, won = k === R.hearts - 1 && t - R.heartT < .5;
              if (full) { const s = won && !calm ? 1 + .45 * Math.sin((t - R.heartT) / .5 * Math.PI) : R.hearts === 1 && !R.end && !calm ? 1 + .12 * Math.sin(t * 9) : 1; drawHeart(cx, cy, hr * s, '#ff3d5a', 0); }
              else if (lost) { const q = (t - R.lostT) / .8; x.save(); x.globalAlpha = G.hud * (1 - q); drawHeart(cx, cy - q * hr, hr * (1 + .5 * q), '#ffffff', 0); x.restore(); }
              else if (k < HEARTS_MAX) { heartPath(cx, cy, hr * .85); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.35)'; x.stroke(); } } } }
        if (ha > 0) { let fs = clamp(PW * .052, 17, 26); x.globalAlpha = ha * G.hud; x.font = `800 ${fs}px ${FONT}`; let w = x.measureText(N.txt).width; if (w > PW * .86) { fs *= PW * .86 / w; x.font = `800 ${fs}px ${FONT}`; w = PW * .86; } w += fs * 1.6; const by = sby + sfs * .9 + 6 + fs * .9 + low;   // (a few words of help, just under the score)
          x.fillStyle = 'rgba(8,14,32,.72)'; rr(W / 2 - w / 2, by - fs * .9, w, fs * 1.8, fs * .9); x.fill(); x.fillStyle = '#ffffff'; x.fillText(N.txt, W / 2, by + fs * .04); if (ha > .3) hudY = by + fs * .9; }
        G.hudY = hudY; x.restore(); }
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
  function logoAt(ox, oy, u) { const F = fig.focus; if (!F || !(F.front > .45)) return G.geo;
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
    const gl = globe.glass, T = calm ? .45 : G.intro ? 1.9 : TZ, hold = calm ? .5 : G.intro ? .25 : TH,   // (G.intro: the opening, out of the logo on the holiday card: a slower, grander zoom)
      chime = () => { globe.bell(1568, 0, .05); globe.bell(2093, .09, .04); };
    fig.sharp = ['play', 'word', 'gift', 'ride'].includes(G.phase) ? 0 : 1280;
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
      if (p >= 1) { G.phase = 'card2'; G.pt = 0; G.e = 1; G.cam = null; G.geo = null; G.back = { t: 0 }; if (riding()) { fig.sharp = 0; fig = figure; G.ride.on = false; }   // (behind the logo, the snowmobile is put away: the snowman in the globe is the one to come back to)
        figure.made = null; figure.pose = FRONT(); globe.rest(false); chime(); try { G.done && G.done(); } catch (e) {} }
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
    const p = G.phase, there = p === 'card' || p === 'open' || p === 'play' || p === 'gift' || p === 'ride' || p === 'word'; let v = 0, pan = 0;
    if (p === 'play' || p === 'ride') for (const o of G.obs) if (o.kind === 'fire') { const q = Math.pow(clamp(1 - Math.abs(o.x - G.sx) / (PW * 1.15), 0, 1), 2); if (q > v) { v = q; pan = clamp((o.x - G.sx) / (PW * .45), -1, 1) * .8; } }
    night.set(there ? 1 : 0, 0); fire.set(v, pan);
    // the snowmobile's engine (sounds.js: two recordings that go round, a purr and a hum). It comes in as the recording of it starting catches (a little over a second after the big gift bursts open), purrs at the back, rises to the hum as he is brought forward, is a little higher in a jump and as the ride gets faster, and gives way at once to the recording of it dying when the lamp is out
    if (rideOK && sounds.engine) { const R = G.ride, on = !!(R && R.on && (p === 'gift' || p === 'ride')); if (on && !eng) eng = sounds.engine();
      if (eng) { const since = !on ? 0 : p === 'gift' ? G.pt - R.openT : 1.3 + G.pt, rec = !!eng.recorded, push = on ? clamp(R.boost + .5 * Math.max(0, R.surge), 0, 1) : 0;   // (since: seconds since the gift burst open. push: how hard it is being driven; when the engine has to be made by sounds.js, with no recordings, that is what makes it louder)
        eng.set(!on ? 0 : R.end ? Math.max(0, 1 - R.end / (rec ? .5 : 1.3)) * (rec ? 1 : .62) : (.35 + .65 * Math.min(1, R.m / FAST[0])) * (rec ? 1 : .62 + .38 * push) * smooth(1.2, 2.0, since), !on ? 0 : clamp(.1 + .34 * Math.min(1.2, R.m / FAST[0]) + .4 * R.boost + .16 * Math.max(0, R.surge) + (G.jy > 0 ? .12 : 0), 0, 1)); } }
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
        if (!G.back) { G.veil = smooth(0, .45, G.pt); if (G.pt >= .5) { G.back = { t: 0 }; if (riding()) { fig = figure; G.ride.on = false; } figure.pose = null; figure.made = null; globe.rest(false); try { G.done && G.done(); } catch (e) {} if (!calm) zoomTo(1.9 > G.zoom ? G.zoom : 1.9); } }
        else { G.back.t += dt; const q = G.back.t / (calm ? .5 : 1.3); G.veil = 1 - smooth(0, .42, q); if (!calm) zoomTo(lerp(Math.min(1.9, G.zoom), 1, easeOut(q)));
          if (q >= 1) { zoomTo(1); finish(); return; } }
      }
    }
    try { ambience(); } catch (e) {}
    draw(); raf = requestAnimationFrame(frame);
  }

  /* ── input ── */
  // One finger (or the mouse) steers: he follows it. Any other finger that touches the screen meanwhile is a jump.
  // On the snowmobile a finger that keeps still is a tap, and a tap is a jump (as it lifts); once it has been dragged a little, the snowmobile follows it.
  const toX = e => { if (!G) return; if (G.phase === 'play') { G.tx = e.clientX; G.touchT = G.t; }
    else if (G.phase === 'ride' && G.drag) { if (!G.drag.on && Math.abs(e.clientX - G.drag.x) > 12) G.drag.on = true; if (G.drag.on) { G.tx = e.clientX; G.touchT = G.t; } } };
  cv.addEventListener('pointerdown', e => { if (!G) return;
    if (e.isPrimary) G.steer = null;   // (the first finger down is the steering one, whatever went before)
    if (G.steer != null && e.pointerId !== G.steer) { ask(); return; } G.steer = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    if (G.phase === 'ride') G.drag = { x: e.clientX, t: performance.now(), on: false }; else toX(e); });
  cv.addEventListener('pointermove', e => { if (!G || (e.pointerType === 'mouse' && !e.buttons) || (G.steer != null && e.pointerId !== G.steer)) return; toX(e); });
  const lift = e => { if (!G || e.pointerId !== G.steer) return; G.steer = null; if (G.phase === 'ride' && G.drag && !G.drag.on && e.type === 'pointerup' && performance.now() - G.drag.t < 450) ask(); G.drag = null; };
  for (const n of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(n, lift);
  btn.addEventListener('pointerdown', e => { e.preventDefault(); ask(); }); btn.addEventListener('click', ask);   // (click: the keyboard, or a screen reader's double tap)
  // The arrows beside JUMP: held down, he slides that way (gently at first, then as fast as with an arrow key). A short tap
  // is one step (a fifth of the way across), and so is a press from the keyboard or a screen reader's double tap.
  const arrowKey = (b, k, dir) => { let down = false, t0 = -1e9, t1 = -1e9, tx0 = 0; const STEP = () => dir * PW * .2, room = v => clamp(v, PX + edge(), PX + PW - edge());
    const set = on => { down = on; b.style.background = on ? LIT : GOLD; if (G) { G.hold[k] = on ? 1 : 0; G.pad[k] = on && (G.phase === 'play' || (G.phase === 'ride' && !G.ride.end)) ? 1 : 0; if (on) { tx0 = G.tx; G.touchT = G.t; } } };   // (hold: it is down, whatever is going on)
    b.addEventListener('pointerdown', e => { e.preventDefault(); t0 = performance.now(); try { b.setPointerCapture(e.pointerId); } catch (er) {} set(true); });
    for (const n of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(n, e => { if (!down) return; set(false); t1 = performance.now();
      if (n === 'pointerup' && G && G.phase === 'play' && t1 - t0 < 230) G.tx = room(tx0 + STEP());   // a tap: one step from where he was heading
      if (n === 'pointerup' && G && G.phase === 'ride' && !G.ride.end && t1 - t0 < 230) G.tx = clamp(tx0 + dir * (rideFar() - rideX()) * .34, rideX(), rideFar()); });   // (on the snowmobile: a third of the way forward or back)
    b.addEventListener('click', () => { if (G && performance.now() - Math.max(t0, t1) > 500) { if (G.phase === 'play') { G.tx = room(G.tx + STEP()); G.touchT = G.t; } else if (G.phase === 'ride' && !G.ride.end) G.tx = clamp(G.tx + dir * (rideFar() - rideX()) * .34, rideX(), rideFar()); } });   // (not the click that follows a press already dealt with)
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
    // The opening (24 Nov 2026): the page's holiday card has zoomed into its Ora logo until the logo sits level in the middle on the hat's
    // blue, exactly as the logo is drawn between the globe and the game. From there the view zooms out of the logo on the snowman's hat
    // to the globe, as it does after a round. Resolves when the globe is all there is. (Nothing happens without a figure with a logo.)
    get introOK() { return !!(figure && figure.focus && figure.badge && figure.badge.image); },
    get plate() { if (!(figure && figure.badge)) return null; size(); const P = plateGeo(); return { x: P.x, y: P.y, w: 2 * P.hw, h: 2 * P.hw / figure.badge.aspect, inner: tint(figure.badge.color, 1.22), outer: tint(figure.badge.color, .72) }; },
    intro() {
      if (G || !(figure && figure.focus && figure.badge && figure.badge.image)) return Promise.resolve(false);
      return new Promise(fin => { size(); addEventListener('resize', size); G = newRound(WORDS[0]); G.intro = true; G.logo = true; G.fin = () => fin(true); G.yaw0 = figure.facing || 0;
        G.phase = 'card2'; G.pt = 0; G.e = 1; G.cam = null; G.geo = null; G.back = { t: 0 }; figure.made = null; figure.pose = FRONT(); globe.rest(false); whoosh();
        cv.style.display = 'block'; last = performance.now(); raf = requestAnimationFrame(frame); });
    },
    jump: ask,   // (the same as pressing JUMP)
    // (for testing) give him this much snow and these parts, and put something in his way a little way ahead: test({ snow, got: [names], ob: ['branch' | 'fire', pixels ahead] })
    // test({ ride: true }): the phrase is spelled now (the big gift comes); on the ride: { rideT: seconds ridden, lamp: 0 … 1, dark: true | false, coin: [pixels ahead, height], ob: [...] }
    test(o) { if (!G || !o) return; if (o.snow != null) { G.snow = clamp(+o.snow, 0, MOST); G.snap = true; } for (const k of o.got || []) G.got[k] = true;
      if (o.ob) { if (G.phase === 'ride') rideOb(o.ob[0], G.sx + (o.ob[1] == null ? 400 : o.ob[1])); else { const q = spawnOb(o.ob[0]); if (o.ob[1] != null) q.x = G.sx + o.ob[1]; } }
      if (o.ride && G.phase === 'play') { G.i = G.letters.length; G.doneAt = G.played; G.letter = null; G.fly = []; G.nextAt = G.t; }
      const R = G.ride; if (!R) return; if (o.rideT != null) R.t = +o.rideT; if (o.lamp != null) R.b = clamp(+o.lamp, 0, 1); if (o.hearts != null) R.hearts = +o.hearts; if (o.heartAt != null) R.heartAt = +o.heartAt; if (o.heart) rideHeart(); if (o.home != null) { R.t = +o.home; } if (o.dark != null) { R.darkOn = !!o.dark; R.darkAt = o.dark ? 0 : 1e9; R.lightAt = 1e9; } if (o.beatAt != null) R.beatAt = +o.beatAt;
      if (o.coin) R.coins.push({ x: G.sx + o.coin[0], h: o.coin[1], r: clamp(R.u * .11, 9, 17), ph: 0, lit: 1, ring: false, rang: false });
      if (o.iceAt != null) R.iceAt = +o.iceAt; if (o.ice) rideIce(); if (o.to != null) G.tx = +o.to; if (o.letter && !R.letter) { rideLetter(); if (o.letter !== true) R.letter.bx = R.letter.x = +o.letter; }
      if (o.ramp) R.ramps.push({ x: G.sx + o.ramp[0], L: RAMP.len * R.u, h: RAMP.h * R.u, seen: false, a: 0, rang: false, armed: false, ph: 0 }); if (o.next) { R.beatN = Math.max(R.beatN, FIRST.length); R.last = ''; const was = Math.random; let k = 0; const want = { fire: .1, branch: .25, coins: .4, high: .5, sky: .65, ramp: .9 }[o.next]; Math.random = () => (k++ ? (o.rnd == null ? was() : o.rnd) : want); try { beat(); } finally { Math.random = was; } } },   // (ramp: [pixels ahead]; next: the kind of thing that comes along now; rnd: what chance says for the rest of it)
    // (for testing)
    get state() { return G && { phase: G.phase, word: G.word, i: G.i, n: G.letters.length, caught: G.caught, snow: G.snow, most: MOST, full: FULL, nt: NT, pieces, sunshine: SUNSHINE, made: made(), got: Object.keys(G.got), flakes: G.flakes, gifts: G.gifts, misses: G.misses, hits: G.hits, melts: G.melts,
      sx: G.sx, grab: grab(), reach: reach(), wide: wide(), edge: edge(), top: headY(), feet: feetY(), ground: groundY, hf: G.hf, W, H, PX, PW, t: G.t, pt: G.pt, back: G.back ? G.back.t : null, logo: G.logo, e: G.e, Z: G.cam ? G.cam.Z : 1, cam: G.cam, view: G.view, figAt: [G.sx, midY(), unit()], note: G.note && G.note.txt, hudBottom: slots().bottom, hudFs: slots().fs, iceH: iceH(),
      letter: G.letter && { ch: G.letter.ch, x: G.letter.x, y: G.letter.y, r: G.letter.r }, gift: G.gift && { x: G.gift.x, y: G.gift.y, r: G.gift.r }, big: G.big.map(f => ({ kind: f.kind, ch: f.ch, x: f.x, y: f.y, r: f.r, vy: f.vy })), sparks: G.sparks.map(s => ({ x: s.x, y: s.y, r: s.r })),
      ice: G.ice.filter(c => !c.deco).map(c => ({ x: iceX(c), len: iceLen(c), state: c.state, t: c.t, y: c.y })), shake: SHAKE, iceAt: G.iceAt, toys: G.toys.map(o => o.k),
      jy: G.jy, jumps: G.jumps, peak: peak(), jt: JT, walk: G.walk, pace: pace(), going: G.going, foot: foot(), obs: G.obs.map(o => ({ kind: o.kind, x: o.x, hx: o.hx, hh: o.hh, hit: o.hit, done: o.done })), trips: G.trips, burns: G.burns, singe: G.singe && { t: G.singe.t, left: SINGE - G.singe.t, on: G.singe.on, at: G.singe.at.map(q => [q[0], Math.round(q[1] * 10) / 10, Math.round(q[2] * 10) / 10, Math.round(q[3] * 10) / 10]) }, marks: ['hat', 'nose', 'scarf'].map(n => [n, mark(n)]), cleared: G.cleared, obN: G.obN, snd: { night: night ? night.level : 0, fire: fire ? [fire.level, fire.pan] : [0, 0], stepAt: G.stepAt }, lit, button: bar.style.visibility === 'visible', barTop, roll: G.roll && { p: clamp(G.roll.t / ROLL, 0, 1), hop: G.roll.hop, far: G.roll.far }, rush: G.rush, heaps: G.heaps.map(h => ({ x: h.x, r: h.r, t: h.t })), pad: G.pad, tx: G.tx, score: G.score, pts: G.pts, secs: G.secs, doneAt: G.doneAt, gains: G.gains.map(q => q.n),
      sun: G.sun && { x: G.sun.x, w: G.sun.w, t: G.sun.t, done: G.sun.done, warn: WARN, burn: BURN },
      barTop, rideOK, fig: fig === figure ? 'snowman' : 'ride', coins: G.coins, arrows: btnL.style.visibility !== 'hidden', caps: CAPS, rideFree: RIDE_FREE,
      ride: G.ride && { hearts: G.ride.hearts, heartsGot: G.ride.heartsGot, home: G.ride.home, homeAt: HOME, heartsMax: HEARTS_MAX, heartsOn: G.ride.coins.filter(c => c.heart).length, on: G.ride.on, t: G.ride.t, m: G.ride.m, b: G.ride.b, bs: G.ride.bs, dark: G.ride.dark, darkOn: G.ride.darkOn, u: G.ride.u, len: G.ride.len, end: G.ride.end, bumps: G.ride.bumps, lampX: G.ride.lampX, reach: G.ride.reach, flash: G.ride.flash, beatN: G.ride.beatN, pitch: G.ride.pitch, boost: G.ride.boost, surge: G.ride.surge, back: riding() ? rideX() : null, far: riding() ? rideFar() : null, tx: G.tx, vx: G.vx, letter: G.ride.letter && { ch: G.ride.letter.ch, x: G.ride.letter.x, y: G.ride.letter.y, r: G.ride.letter.r, vy: G.ride.letter.vy }, ice: { n: G.ride.iceN, hits: G.ride.iceHits, down: G.ride.iceDown, at: G.ride.iceAt, cost: ICE_HIT }, bumpCost: BUMP, coinLight: COIN_LIGHT, safe: G.ride.safeT - G.t, tidings: G.ride.tidings, lettersGot: G.ride.caught, lettersMissed: G.ride.missed, again: G.ride.again, first: G.ride.first && { i: G.ride.first.i, n: G.ride.first.letters.length }, fastest: G.ride.fastest, ramps: G.ride.ramps.map(r => ({ x: r.x, L: r.L, h: r.h, seen: r.seen, a: r.a, armed: r.armed })), onRamp: G.ramp ? (G.sx + G.ride.len * .25 - G.ramp.x) / G.ramp.L : -1, gy: G.gy, jv: G.jv, air: G.air, airs: G.ride.airs, lifts: G.ride.lifts, top: G.ride.top, ramp: RAMP, z: G.ride.z, peak: G.ride.pk, restX: riding() ? rideX() : null, hudLow: hudLow(), v: speed(), fastIcon: btnR.getAttribute('aria-label'),
        box: G.ride.on ? null : { x: G.ride.box.x, y: G.ride.box.y, r: G.ride.box.r, down: G.ride.box.down, t: G.ride.box.t }, coinsOn: G.ride.coins.filter(c => !c.heart).map(c => ({ x: c.x, h: c.h, r: c.r, lit: c.lit, sky: !!c.sky })),
        obs: G.obs.map(o => ({ kind: o.kind, x: o.x, seen: !!o.seen, a: o.a, hit: o.hit, done: o.done })), lamp: riding() ? at('lamp') : null, nose: riding() ? at('nose') : null, rear: riding() ? at('rear') : null, hat: riding() ? at('hat') : null, pose: fig.pose } }; }
  };
}
