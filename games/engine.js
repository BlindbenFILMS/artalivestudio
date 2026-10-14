/* Art Alive game engine. Plays one game made in the Game Maker: marble collect, marble maze, marble bowling,
   hidden treasures, slide puzzle and memory match. Shared by the maker's Play step and every downloaded game. */
(function () {
'use strict';
const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const SCALE = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1567.98, 1760];

/* ── sound ── */
let AC = null, OUT = null, NB = null;
function ac() {
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); OUT = AC.createGain(); OUT.gain.value = .55; OUT.connect(AC.destination); }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
  return AC;
}
function tone(f, d, type, v, when, pan) {
  const a = ac(); if (!a) return;
  d = d || .3; const t = a.currentTime + (when || 0), o = a.createOscillator(), g = a.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v || .2, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g);
  if (pan && a.createStereoPanner) { const p = a.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); p.connect(OUT); } else g.connect(OUT);
  o.start(t); o.stop(t + d + .05);
}
function noiseBuf(a) {
  if (!NB) { NB = a.createBuffer(1, a.sampleRate, a.sampleRate); const c = NB.getChannelData(0); for (let i = 0; i < c.length; i++) c[i] = Math.random() * 2 - 1; }
  return NB;
}
function noise(d, v, freq, q) {
  const a = ac(); if (!a) return;
  const s = a.createBufferSource(); s.buffer = noiseBuf(a);
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 800; f.Q.value = q || 1;
  const g = a.createGain(), t = a.currentTime; g.gain.setValueAtTime(v || .2, t); g.gain.exponentialRampToValueAtTime(.0001, t + (d || .15));
  s.connect(f); f.connect(g); g.connect(OUT); s.start(t); s.stop(t + (d || .15) + .05);
}
const SFX = {
  note(i, v) { const f = SCALE[i % SCALE.length]; tone(f, .55, 'triangle', v || .22); tone(f * 2, .35, 'sine', .05, .02); },
  collect(i) { SFX.note(i + 2); tone(SCALE[(i + 4) % 12] * 2, .25, 'sine', .07, .07); },
  bump(s) { noise(.07, clamp(s, .03, .3), 260, 1.5); },
  win() { [2, 4, 5, 7, 9].forEach((k, j) => tone(SCALE[k] * 2, .5, 'triangle', .16, j * .11)); [2, 4, 6].forEach(k => tone(SCALE[k], 1.4, 'sine', .09, .6)); },
  wrong() { tone(220, .16, 'square', .04); tone(185, .22, 'square', .04, .09); },
  flip() { noise(.05, .12, 2400, 2); },
  slide() { noise(.09, .1, 900, .8); },
  crash(n) { for (let i = 0; i < Math.min(n, 5); i++) noise(.2, .2, 400 + Math.random() * 900, 2); tone(110, .3, 'sine', .18); },
  ping(warm, pan) { tone(lerp(300, 1400, warm), .11, 'sine', lerp(.05, .2, warm), 0, pan); },
  start() { tone(523.25, .15, 'triangle', .15); tone(783.99, .25, 'triangle', .15, .1); },
  found() { [4, 7, 9].forEach((k, j) => tone(SCALE[k], .45, 'triangle', .18, j * .08)); },
  tick() { tone(1200, .04, 'square', .03); }
};
let rollSrc = null, rollGain = null;
function rollSound(speed) {
  const a = AC; if (!a) return;
  if (!rollSrc) {
    rollSrc = a.createBufferSource(); rollSrc.buffer = noiseBuf(a); rollSrc.loop = true;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; rollGain = a.createGain(); rollGain.gain.value = 0;
    rollSrc.connect(f); f.connect(rollGain); rollGain.connect(OUT); rollSrc.start();
  }
  rollGain.gain.setTargetAtTime(clamp(speed, 0, 1) * .16, a.currentTime, .05);
}
function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }


/* ── Ben's own voice: lines recorded with Chatterbox play instead of the computer voice (voice/voice.json) ── */
const VOICEPACK = { map: null, base: '', ready: null,
  load(base) { if (this.ready) return this.ready; this.base = base; try { this.ready = fetch(base + 'voice.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(m => { this.map = m; }).catch(() => {}); } catch (e) { this.ready = Promise.resolve(); } return this.ready; },
  file(t) { if (!this.map || !t) return null; const f = this.map[String(t).trim().replace(/\s+/g, ' ')]; return f ? this.base + f : null; } };
/* ── voice: the creator's recording, or the browser's voice reading their words ── */
let curAudio = null, lastVoice = 0;
function stopVoice() { if (curAudio) { curAudio.pause(); curAudio = null; } try { speechSynthesis.cancel(); } catch (e) {} }
function speakText(t, cb) { try { const u = new SpeechSynthesisUtterance(t); u.rate = 1; u.lang = VOICE_LANG === 'es' ? 'es-ES' : VOICE_LANG; u.onend = () => cb && cb(); speechSynthesis.speak(u); } catch (e) { cb && cb(); } }
function sayLine(line, cb) {
  if (!line) return false;
  if (!line.audio && line.text) { const f = VOICEPACK.file(line.text); if (f) line = { text: line.text, audio: f }; }
  lastVoice = performance.now();
  if (line.audio) {
    stopVoice(); const a = new Audio(line.audio); curAudio = a;
    a.onended = () => { if (curAudio === a) curAudio = null; cb && cb(); };
    a.play().catch(() => { if (line.text) speakText(line.text, cb); });
    return true;
  }
  if (line.text && line.text.trim()) { stopVoice(); speakText(line.text, cb); return true; }
  return false;
}
function voiceBusy() { return (curAudio && !curAudio.paused) || (window.speechSynthesis && speechSynthesis.speaking); }


/* ── Spanish for the game buttons, messages and computer voice ── */
const ES = {
  'Play': 'Jugar', 'Play again': 'Jugar otra vez', 'Restart': 'Reiniciar', 'Hear about it': 'Escuchar la obra', 'Hint': 'Pista',
  'Play on the painting': 'Jugar sobre la pintura', 'Back to the screen': 'Volver a la pantalla', 'Controls': 'Controles', 'View': 'Vista', 'Sound guide': 'Guía de sonido',
  'Joystick': 'Palanca', 'Arrow buttons': 'Botones de flecha', 'Tilt the phone': 'Inclinar el teléfono',
  'Full sight': 'Vista completa', 'Blurry sight': 'Vista borrosa', 'Tunnel vision': 'Visión de túnel', 'Center loss': 'Pérdida central', 'High contrast': 'Alto contraste',
  'Roll': 'Lanzar', 'Flip': 'Voltear', 'Peek': 'Mirar', 'Listen': 'Escuchar', 'Recenter': 'Recentrar', 'Recentered': 'Recentrado',
  'Tilt your phone to move.': 'Inclina tu teléfono para moverte.', 'Up': 'Arriba', 'Down': 'Abajo', 'Left': 'Izquierda', 'Right': 'Derecha',
  'Joystick. Drag to move. Arrow keys work too.': 'Palanca. Arrastra para moverte. También funcionan las flechas.',
  'You did it!': '¡Lo lograste!', 'Solved!': '¡Resuelto!', 'All pairs found!': '¡Todas las parejas!', 'Strike!': '¡Chuza!', 'All pins down!': '¡Todos los bolos derribados!',
  'All treasures found!': '¡Todos los tesoros encontrados!', 'You made it!': '¡Llegaste!', 'All collected!': '¡Todo recogido!', 'Rolling!': '¡Rodando!',
  'Very close!': '¡Muy cerca!', 'Getting warm.': 'Caliente.', 'Cool.': 'Tibio.', 'Cold. Keep looking.': 'Frío. Sigue buscando.', 'Piece in place': 'Pieza en su lugar', 'A pair!': '¡Una pareja!',
  'Press Play again for a new round.': 'Pulsa Jugar otra vez para una nueva ronda.', 'No description yet.': 'Aún no hay descripción.',
  'Tilt was not allowed. Choose Joystick or Arrow buttons.': 'No se permitió inclinar. Elige Palanca o Botones de flecha.',
  'Roll the marble to collect them all.': 'Rueda la canica para recogerlos todos.', 'Roll the marble through the maze to the goal.': 'Rueda la canica por el laberinto hasta la meta.',
  'Aim, then press Roll.': 'Apunta y pulsa Lanzar.', 'Search the painting. The beeps speed up as you get close.': 'Explora la pintura. Los pitidos se aceleran cuando te acercas.',
  'Slide the pieces back into place.': 'Desliza las piezas a su lugar.', 'Flip two cards at a time to find pairs.': 'Voltea dos cartas a la vez para encontrar parejas.',
  'Point your camera at the painting. Keep all four corners in view.': 'Apunta la cámara a la pintura. Mantén las cuatro esquinas a la vista.',
  'Camera on. Point at the painting.': 'Cámara encendida. Apunta a la pintura.', 'Found it! Play right on the painting.': '¡La encontré! Juega sobre la pintura.',
  'Found the painting. Play!': 'Encontré la pintura. ¡A jugar!', 'Lost the painting. Point back at it.': 'Perdí la pintura. Vuelve a apuntarla.',
  'The camera was not allowed. You can keep playing on the screen.': 'No se permitió la cámara. Puedes seguir jugando en la pantalla.'
};
const ES_NOUN = { Stars: 'Estrellas', Hearts: 'Corazones', Gems: 'Gemas', Notes: 'Notas' };
const ES_RULES = [
  [/^(Stars|Hearts|Gems|Notes): (\d+) of (\d+) · (.*)$/, m => `${ES_NOUN[m[1]]}: ${m[2]} de ${m[3]} · ${m[4]}`],
  [/^Reach the gold goal · (.*)$/, m => `Llega a la meta dorada · ${m[1]}`],
  [/^Roll (\d+) of 3 · Pins down: (\d+) of (\d+)$/, m => `Lanzamiento ${m[1]} de 3 · Bolos derribados: ${m[2]} de ${m[3]}`],
  [/^Treasures found: (\d+) of (\d+)$/, m => `Tesoros encontrados: ${m[1]} de ${m[2]}`],
  [/^Pieces in place: (\d+) of (\d+) · Moves: (\d+)$/, m => `Piezas en su lugar: ${m[1]} de ${m[2]} · Movimientos: ${m[3]}`],
  [/^Pairs: (\d+) of (\d+) · Turns: (\d+)$/, m => `Parejas: ${m[1]} de ${m[2]} · Turnos: ${m[3]}`],
  [/^(\d+) moves$/, m => `${m[1]} movimientos`], [/^(\d+) turns$/, m => `${m[1]} turnos`], [/^In (\d+) rolls?$/, m => `En ${m[1]} lanzamiento${m[1] === '1' ? '' : 's'}`],
  [/^(\d+) of (\d+) pins!$/, m => `¡${m[1]} de ${m[2]} bolos!`], [/^(\d+) of (\d+)$/, m => `${m[1]} de ${m[2]}`],
  [/^Found (.*)!$/, m => `¡Encontraste ${m[1] === 'a treasure' ? 'un tesoro' : m[1]}!`], [/^Card (\d+): note (\d+)$/, m => `Carta ${m[1]}: nota ${m[2]}`],
  [/^Card (\d+), row (\d+)(, matched|, face up)?$/, m => `Carta ${m[1]}, fila ${m[2]}${m[3] === ', matched' ? ', emparejada' : m[3] ? ', boca arriba' : ''}`],
  [/^(\d+) pins down\. Roll again\.$/, m => `${m[1]} bolos derribados. Lanza otra vez.`], [/^(\d+) of (\d+) pieces are in place\.$/, m => `${m[1]} de ${m[2]} piezas están en su lugar.`],
  [/^Controls: (.*)$/, m => 'Controles: ' + (ES[m[1]] || m[1])], [/^View: (.*)$/, m => 'Vista: ' + (ES[m[1]] || m[1])]
];
function toES(t) { if (t == null) return t; t = String(t); if (ES[t]) return ES[t]; for (const [re, f] of ES_RULES) { const m = t.match(re); if (m) return f(m); } return t; }
function translateDom(el, L) { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) { const t = n.nodeValue.trim(); if (t) { const x = L(t); if (x !== t) n.nodeValue = n.nodeValue.replace(t, x); } }
  el.querySelectorAll('[aria-label]').forEach(e => { e.setAttribute('aria-label', L(e.getAttribute('aria-label'))); }); }
let VOICE_LANG = 'en';
/* ── the painting, prepared once in each way it can be seen ── */
function sizeFor(img, long) {
  const a = img.naturalWidth / img.naturalHeight;
  return a >= 1 ? [long, Math.round(long / a)] : [Math.round(long * a), long];
}
function prepArt(img, W, H) {
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const full = mk(); full.getContext('2d').drawImage(img, 0, 0, W, H);
  // blurry: shrink then stretch, which works in every browser
  const sm = document.createElement('canvas'); sm.width = Math.max(8, W >> 4); sm.height = Math.max(8, H >> 4);
  const sx = sm.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(full, 0, 0, sm.width, sm.height);
  const blur = mk(), bx = blur.getContext('2d'); bx.imageSmoothingQuality = 'high'; bx.drawImage(sm, 0, 0, W, H);
  // high contrast: bold edges of colour
  const con = mk(), cx = con.getContext('2d'); cx.drawImage(full, 0, 0);
  try {
    const d = cx.getImageData(0, 0, W, H), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const l = (p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11);
      for (let k = 0; k < 3; k++) { let v = l + (p[i + k] - l) * 1.6; v = (v - 128) * 1.9 + 128; p[i + k] = clamp(v, 0, 255); }
    }
    cx.putImageData(d, 0, 0);
  } catch (e) {}
  // dimmed, for card and fog backgrounds
  return { full, blur, contrast: con, W, H };
}

/* ── living effects, the same ones the Creator Studio offers ── */
function makeFx(W, H) {
  const P = [], M = Math.min(W, H);
  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn(kind) {
    if (kind === 'sparkles') return { k: kind, x: rnd(0, W), y: rnd(0, H), life: 0, max: rnd(.6, 1.6), s: rnd(.008, .02) * M };
    if (kind === 'embers') return { k: kind, x: rnd(0, W), y: H + 10, vx: rnd(-10, 10), vy: rnd(-70, -30) * M / 600, life: 0, max: rnd(2, 5), s: rnd(1.2, 3) * M / 600, ph: rnd(0, TAU) };
    if (kind === 'rain') return { k: kind, x: rnd(-W * .2, W), y: rnd(-H, 0), vy: rnd(700, 1000) * M / 600, life: 0, max: 9, s: rnd(10, 22) * M / 600 };
    if (kind === 'snow') return { k: kind, x: rnd(0, W), y: rnd(-H * .2, 0), vy: rnd(18, 45) * M / 600, life: 0, max: 30, s: rnd(1.5, 4) * M / 600, ph: rnd(0, TAU) };
  }
  const want = { sparkles: 34, embers: 40, rain: 90, snow: 70 };
  return {
    bursts: [],
    burst(x, y, col, n) { for (let i = 0; i < (n || 24); i++) { const a = rnd(0, TAU), sp = rnd(60, 260) * M / 600; this.bursts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(.5, 1.1), c: col || '#ffd27a', s: rnd(2, 5) * M / 600 }); } },
    rings: [],
    ring(x, y, col) { this.rings.push({ x, y, life: 0, c: col || 'rgba(255,230,180,' }); },
    update(dt, fx) {
      for (const k in want) {
        if (!fx[k]) continue;
        let n = 0; for (const p of P) if (p.k === k) n++;
        for (; n < want[k]; n++) { const p = spawn(k); if (k === 'rain' || k === 'snow') p.y = rnd(-H, H); P.push(p); }
      }
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.life += dt;
        if (p.vx !== undefined) p.x += p.vx * dt;
        if (p.vy !== undefined) p.y += p.vy * dt;
        if (p.k === 'embers') p.x += Math.sin(p.life * 2 + p.ph) * 12 * dt;
        if (p.k === 'snow') p.x += Math.sin(p.life * .8 + p.ph) * 14 * dt;
        if (p.k === 'rain') p.x += p.vy * .12 * dt;
        if (!fx[p.k] || p.life > p.max || p.y > H + 30 || p.y < -H * 1.2) P.splice(i, 1);
      }
      for (let i = this.bursts.length - 1; i >= 0; i--) { const b = this.bursts[i]; b.life += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= .96; b.vy = b.vy * .96 + 40 * dt; if (b.life > b.max) this.bursts.splice(i, 1); }
      for (let i = this.rings.length - 1; i >= 0; i--) { this.rings[i].life += dt; if (this.rings[i].life > 1) this.rings.splice(i, 1); }
    },
    glow(ctx, t, fx) {
      if (!fx.glow) return;
      const x = W * (.5 + .28 * Math.sin(t * .23)), y = H * (.42 + .2 * Math.cos(t * .17)), r = M * (.55 + .08 * Math.sin(t * .9));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,214,150,.30)'); g.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    },
    draw(ctx, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const p of P) {
        const f = p.life / p.max, a = Math.sin(Math.PI * clamp(f, 0, 1));
        if (p.k === 'sparkles') {
          const s = p.s * (.6 + .4 * Math.sin(t * 9 + p.x));
          ctx.globalAlpha = a; ctx.fillStyle = '#fff6d8';
          ctx.beginPath(); ctx.moveTo(p.x, p.y - s * 2); ctx.lineTo(p.x + s * .35, p.y); ctx.lineTo(p.x, p.y + s * 2); ctx.lineTo(p.x - s * .35, p.y); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(p.x - s * 2, p.y); ctx.lineTo(p.x, p.y + s * .35); ctx.lineTo(p.x + s * 2, p.y); ctx.lineTo(p.x, p.y - s * .35); ctx.closePath(); ctx.fill();
        } else if (p.k === 'embers') {
          ctx.globalAlpha = a * .9; ctx.fillStyle = f < .5 ? '#ffcf6a' : '#ff6a2a';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill();
        } else if (p.k === 'rain') {
          ctx.globalAlpha = .35; ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = Math.max(1, p.s * .08);
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.s * .12, p.y - p.s); ctx.stroke();
        } else if (p.k === 'snow') {
          ctx.globalAlpha = .85; ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill();
        }
      }
      for (const b of this.bursts) { ctx.globalAlpha = 1 - b.life / b.max; ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(b.x, b.y, b.s, 0, TAU); ctx.fill(); }
      ctx.restore();
      for (const r of this.rings) {
        ctx.save(); ctx.globalAlpha = 1 - r.life; ctx.strokeStyle = r.c + (1 - r.life) + ')'; ctx.lineWidth = M * .012 * (1 - r.life) + 1;
        ctx.beginPath(); ctx.arc(r.x, r.y, M * (.03 + r.life * .16), 0, TAU); ctx.stroke(); ctx.restore();
      }
    }
  };
}

/* ── shapes ── */
function starPath(ctx, x, y, r, pts, inner) { ctx.beginPath(); for (let i = 0; i < pts * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / pts, rr = i % 2 ? r * (inner || .45) : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
function heartPath(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y + r * .9); ctx.bezierCurveTo(x - r * 1.5, y - r * .1, x - r * .7, y - r * 1.2, x, y - r * .45); ctx.bezierCurveTo(x + r * .7, y - r * 1.2, x + r * 1.5, y - r * .1, x, y + r * .9); ctx.closePath(); }
function gemPath(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x - r, y - r * .3); ctx.lineTo(x - r * .5, y - r * .85); ctx.lineTo(x + r * .5, y - r * .85); ctx.lineTo(x + r, y - r * .3); ctx.lineTo(x, y + r); ctx.closePath(); }
function notePath(ctx, x, y, r) { ctx.beginPath(); ctx.ellipse(x - r * .25, y + r * .45, r * .45, r * .33, -.4, 0, TAU); ctx.rect(x + r * .1, y - r * .9, r * .16, r * 1.35); ctx.moveTo(x + r * .1, y - r * .9); ctx.quadraticCurveTo(x + r * .8, y - r * .7, x + r * .7, y - r * .1); ctx.lineTo(x + r * .26, y - r * .45); ctx.closePath(); }
const ITEM_COL = { star: ['#ffe27a', '#f5a623'], heart: ['#ff8fa3', '#e8433a'], gem: ['#9fe6ff', '#2aa8e0'], note: ['#fff1c9', '#ff7a2a'] };
function drawItem(ctx, style, x, y, r, t) {
  const c = ITEM_COL[style] || ITEM_COL.star, bob = Math.sin(t * 3 + x * .05) * r * .12;
  y += bob;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2); g.addColorStop(0, c[0] + '88'); g.addColorStop(1, c[0] + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
  if (style === 'heart') heartPath(ctx, x, y, r); else if (style === 'gem') gemPath(ctx, x, y, r); else if (style === 'note') notePath(ctx, x, y, r); else starPath(ctx, x, y, r, 5);
  const f = ctx.createLinearGradient(x, y - r, x, y + r); f.addColorStop(0, c[0]); f.addColorStop(1, c[1]);
  ctx.fillStyle = f; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * .12); ctx.strokeStyle = 'rgba(20,16,12,.75)'; ctx.stroke();
}
function drawMarble(ctx, kind, x, y, r, vx, vy, t, look) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x + r * .25, y + r * .35, r * 1.05, r * .8, 0, 0, TAU); ctx.fill();
  if (kind === 'sun') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * .8);
    ctx.fillStyle = 'rgba(255,190,60,.55)'; for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); ctx.beginPath(); ctx.moveTo(r * .8, -r * .18); ctx.lineTo(r * 1.55, 0); ctx.lineTo(r * .8, r * .18); ctx.fill(); }
    ctx.restore();
    const g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, '#fff7c2'); g.addColorStop(.5, '#ffc23a'); g.addColorStop(1, '#ff7a2a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  } else if (kind === 'glass') {
    const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .05, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.35, 'rgba(160,220,255,.55)'); g.addColorStop(1, 'rgba(30,90,160,.85)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * .92, 0, TAU); ctx.clip(); ctx.translate(x, y); ctx.rotate(t * 1.5 + (vx + vy) * .002);
    ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = r * .22; ctx.beginPath(); ctx.moveTo(-r, -r * .2); ctx.bezierCurveTo(-r * .3, r * .6, r * .3, -r * .6, r, r * .2); ctx.stroke();
    ctx.strokeStyle = '#e8433a'; ctx.lineWidth = r * .12; ctx.beginPath(); ctx.moveTo(-r, r * .3); ctx.bezierCurveTo(-r * .2, -r * .5, r * .4, r * .7, r, -r * .1); ctx.stroke();
    ctx.restore();
  } else if (kind === 'paint') {
    const g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r * 1.1); g.addColorStop(0, '#ffd2b0'); g.addColorStop(.4, '#ff7a2a'); g.addColorStop(1, '#b8331f');
    ctx.fillStyle = g; ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, w = 1 + .08 * Math.sin(a * 5 + t * 4); ctx.lineTo(x + Math.cos(a) * r * w, y + Math.sin(a) * r * w); }
    ctx.fill();
  } else {
    // the eyeball, which looks where it is rolling
    const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.75, '#efe7dc'); g.addColorStop(1, '#c9b8a6');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(200,60,50,.35)'; ctx.lineWidth = Math.max(1, r * .04);
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + 1; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * .95, y + Math.sin(a) * r * .95); ctx.quadraticCurveTo(x + Math.cos(a + .3) * r * .7, y + Math.sin(a + .3) * r * .7, x + Math.cos(a + .1) * r * .55, y + Math.sin(a + .1) * r * .55); ctx.stroke(); }
    const ix = x + look.x * r * .42, iy = y + look.y * r * .42;
    const ig = ctx.createRadialGradient(ix, iy, r * .05, ix, iy, r * .46); ig.addColorStop(0, '#7fd3ff'); ig.addColorStop(.7, '#2aa8e0'); ig.addColorStop(1, '#155a80');
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(ix, iy, r * .44, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0b0d10'; ctx.beginPath(); ctx.arc(ix, iy, r * .2, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(x - r * .38, y - r * .42, r * .2, r * .12, -.6, 0, TAU); ctx.fill();
  ctx.restore();
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/* ── defaults the maker also uses ── */
const NOUN = { star: ['star', 'stars'], heart: ['heart', 'hearts'], gem: ['gem', 'gems'], note: ['note', 'notes'] };
function pinRack(p) {
  const n = p.n || 10, rows = n >= 10 ? 4 : n >= 6 ? 3 : 2, out = [];
  for (let r = 0; r < rows; r++) for (let i = 0; i <= r; i++) out.push({ dx: (i - r / 2), dy: -r });
  return out.slice(0, n);
}
function autoCrops(n, W, H) {
  const g = 4, cells = [];
  for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) cells.push({ x: (i + .5) / g, y: (j + .5) / g });
  for (let i = cells.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [cells[i], cells[k]] = [cells[k], cells[i]]; }
  return cells.slice(0, n).map(c => ({ x: c.x, y: c.y }));
}

/* ── the game ── */
const VIEWS = [['full', 'Full sight'], ['blur', 'Blurry sight'], ['tunnel', 'Tunnel vision'], ['center', 'Center loss'], ['contrast', 'High contrast']];
const CONTROLS = [['joystick', 'Joystick'], ['buttons', 'Arrow buttons'], ['tilt', 'Tilt the phone']];
const ACTION = { bowl: 'Roll', memory: 'Flip', puzzle: 'Peek', treasure: 'Listen' };

function create(root, data, opts) {
  opts = opts || {};
  const D = JSON.parse(JSON.stringify(data));
  D.fx = D.fx || {}; D.lines = D.lines || {};
  const type = D.type || 'collect';
  root.classList.add('aag');
  root.innerHTML = `
  <div class="aag-stage"><canvas class="aag-cv"></canvas>
    <div class="aag-cover"><button type="button" class="aag-play">Play</button><p class="aag-tip"></p></div>
    <div class="aag-win" hidden><p class="aag-wint">You did it!</p><p class="aag-wins"></p><button type="button" class="aag-again">Play again</button></div>
  </div>
  <p class="aag-status" aria-live="polite"></p>
  <div class="aag-ctrl"><div class="aag-pad"></div><div class="aag-acts"></div></div>
  <div class="aag-bar">
    <button type="button" data-a="restart">Restart</button>
    <button type="button" data-a="hear">Hear about it</button>
    <button type="button" data-a="hint">Hint</button>
    <button type="button" data-a="ar" class="aag-arbtn" hidden>Play on the painting</button>
  </div>
  <div class="aag-opts">
    <label>Controls<select class="aag-csel">${CONTROLS.map(c => `<option value="${c[0]}">${c[1]}</option>`).join('')}</select></label>
    <label>View<select class="aag-vsel">${VIEWS.map(v => `<option value="${v[0]}">${v[1]}</option>`).join('')}</select></label>
    <label class="aag-chk"><input type="checkbox" class="aag-guide" checked> Sound guide</label>
  </div>
  <p class="aag-sr" aria-live="assertive"></p>`;
  const $ = s => root.querySelector(s);
  try { if (location.protocol !== 'file:') VOICEPACK.load(D.voicePack || new URL('../voice/', location.href).href); } catch (e) {}
  const LANG = String(D.lang || 'en').slice(0, 2); VOICE_LANG = LANG; const L = t => LANG === 'es' ? toES(t) : t;
  if (LANG !== 'en') { translateDom(root, L); root.setAttribute('lang', LANG); }
  const cv = $('.aag-cv'), ctx = cv.getContext('2d'), statusEl = $('.aag-status'), srEl = $('.aag-sr');
  const cover = $('.aag-cover'), winEl = $('.aag-win'), pad = $('.aag-pad'), acts = $('.aag-acts');
  const csel = $('.aag-csel'), vsel = $('.aag-vsel'), guide = $('.aag-guide');
  csel.value = D.controls || 'joystick'; vsel.value = D.view || 'full';
  cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', (D.title || 'Painting') + (D.artist ? ', by ' + D.artist : '') + '. ' + ((D.lines.about && D.lines.about.text) || ''));
  if (type === 'memory' || type === 'puzzle') guide.closest('label').hidden = true;
  const announce = t => { t = L(t); srEl.textContent = ''; setTimeout(() => { srEl.textContent = t; }, 30); };

  let W = 960, H = 720, M = 720, art = null, fxr = null, S = null, running = false, alive = true, raf = 0, last = 0, T = 0;
  const vec = { x: 0, y: 0 }, src = { joy: { x: 0, y: 0 }, pad: { x: 0, y: 0 }, key: { x: 0, y: 0 }, tilt: { x: 0, y: 0 }, touch: null };
  let actionDown = false;

  /* controls under the picture */
  function buildPad() {
    const mode = csel.value; pad.innerHTML = ''; src.joy.x = src.joy.y = src.pad.x = src.pad.y = 0;
    if (mode === 'joystick') {
      pad.innerHTML = '<div class="aag-joy" role="application" aria-label="Joystick. Drag to move. Arrow keys work too."><div class="aag-knob"></div></div>';
      const base = pad.firstChild, knob = base.firstChild; let id = null;
      const set = (cx, cy) => { const r = base.getBoundingClientRect(), R = r.width / 2; let dx = cx - (r.left + R), dy = cy - (r.top + R); const d = Math.hypot(dx, dy), m = R * .6; if (d > m) { dx *= m / d; dy *= m / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; src.joy.x = dx / m; src.joy.y = dy / m; };
      base.addEventListener('pointerdown', e => { id = e.pointerId; base.setPointerCapture(id); ac(); set(e.clientX, e.clientY); e.preventDefault(); });
      base.addEventListener('pointermove', e => { if (e.pointerId === id) set(e.clientX, e.clientY); });
      const end = e => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; src.joy.x = src.joy.y = 0; };
      base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
    } else if (mode === 'buttons') {
      pad.innerHTML = `<div class="aag-dpad">
        <button type="button" class="u" data-d="0,-1" aria-label="Up">▲</button>
        <button type="button" class="l" data-d="-1,0" aria-label="Left">◀</button>
        <button type="button" class="r" data-d="1,0" aria-label="Right">▶</button>
        <button type="button" class="d" data-d="0,1" aria-label="Down">▼</button></div>`;
      pad.querySelectorAll('button').forEach(b => {
        const [dx, dy] = b.dataset.d.split(',').map(Number);
        const on = e => { e.preventDefault(); ac(); src.pad.x = dx; src.pad.y = dy; stepOnce = { x: dx, y: dy }; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (er) {} };
        const off = () => { if (src.pad.x === dx && src.pad.y === dy) { src.pad.x = src.pad.y = 0; } b.classList.remove('on'); };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off);
        b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); src.pad.x = dx; src.pad.y = dy; stepOnce = { x: dx, y: dy }; } });
        b.addEventListener('keyup', off);
      });
    } else {
      pad.innerHTML = '<div class="aag-tiltbox"><p>Tilt your phone to move.</p><button type="button" class="aag-small">Recenter</button></div>';
      pad.querySelector('button').onclick = () => { tilt0 = null; announce('Recentered'); };
      askTilt();
    }
    if (LANG !== 'en') translateDom(pad, L);
    acts.innerHTML = '';
    if (ACTION[type]) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'aag-act'; b.textContent = L(ACTION[type]);
      b.addEventListener('pointerdown', e => { e.preventDefault(); ac(); actionDown = true; doAction(true); });
      b.addEventListener('pointerup', () => { actionDown = false; doAction(false); });
      b.addEventListener('pointerleave', () => { if (actionDown) { actionDown = false; doAction(false); } });
      b.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); doAction(true); } });
      b.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') doAction(false); });
      acts.appendChild(b);
    }
  }
  let stepOnce = false, tilt0 = null, tiltAsked = false;
  function onTilt(e) {
    if (e.beta == null) return;
    if (!tilt0) tilt0 = { b: e.beta, g: e.gamma };
    src.tilt.x = clamp((e.gamma - tilt0.g) / 22, -1, 1); src.tilt.y = clamp((e.beta - tilt0.b) / 22, -1, 1);
  }
  function askTilt() {
    if (tiltAsked) return; tiltAsked = true;
    const go = () => window.addEventListener('deviceorientation', onTilt);
    try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then(s => { if (s === 'granted') go(); else announce('Tilt was not allowed. Choose Joystick or Arrow buttons.'); }, () => { tiltAsked = false; }); else go(); } catch (e) { go(); }
  }
  csel.onchange = () => { buildPad(); announce('Controls: ' + csel.options[csel.selectedIndex].text); };
  vsel.onchange = () => announce('View: ' + vsel.options[vsel.selectedIndex].text);
  const keys = {};
  function onKey(e) {
    if (!root.isConnected) return;
    const tag = (e.target && e.target.tagName) || ''; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const map = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd', a: 'l', d: 'r', w: 'u', s: 'd' };
    const k = map[e.key];
    if (k) { if (!running && e.type === 'keydown') return; e.preventDefault(); if (e.type === 'keydown' && !keys[k]) { keys[k] = 1; stepOnce = { x: k === 'r' ? 1 : k === 'l' ? -1 : 0, y: k === 'd' ? 1 : k === 'u' ? -1 : 0 }; } else if (e.type === 'keyup') keys[k] = 0; src.key.x = (keys.r || 0) - (keys.l || 0); src.key.y = (keys.d || 0) - (keys.u || 0); }
    if (running && (e.key === ' ' || e.key === 'Enter') && e.target === document.body) { e.preventDefault(); if (e.type === 'keydown' && !e.repeat) doAction(true); if (e.type === 'keyup') doAction(false); }
  }
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  function readVec() {
    const list = [src.key, src.pad, src.joy, csel.value === 'tilt' ? src.tilt : { x: 0, y: 0 }];
    for (const s of list) if (Math.abs(s.x) > .08 || Math.abs(s.y) > .08) { vec.x = s.x; vec.y = s.y; return; }
    vec.x = vec.y = 0;
  }

  /* pointer on the picture */
  const toArt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
  let ptrId = null;
  cv.addEventListener('pointerdown', e => { if (!running) return; ptrId = e.pointerId; cv.setPointerCapture(ptrId); src.touch = toArt(e); tap(src.touch); e.preventDefault(); });
  cv.addEventListener('pointermove', e => { if (e.pointerId === ptrId) src.touch = toArt(e); });
  const pend = e => { if (e.pointerId === ptrId) { ptrId = null; src.touch = null; } };
  cv.addEventListener('pointerup', pend); cv.addEventListener('pointercancel', pend);

  /* buttons */
  root.querySelectorAll('.aag-bar button').forEach(b => b.addEventListener('click', () => {
    ac(); const a = b.dataset.a;
    if (a === 'restart') { reset(); begin(false); }
    if (a === 'hear') { if (!sayLine(D.lines.about)) announce(D.title ? D.title + (D.artist ? ', by ' + D.artist : '') : 'No description yet.'); }
    if (a === 'hint') hint();
    if (a === 'ar') { if (AR) stopAR(); else startAR(); }
  }));
  $('.aag-play').addEventListener('click', () => { ac(); if (csel.value === 'tilt') askTilt(); begin(true); });
  $('.aag-again').addEventListener('click', () => { reset(); begin(false); });

  /* load */
  const img = new Image();
  img.onload = () => {
    if (!alive) return;
    [W, H] = sizeFor(img, opts.long || 1000); M = Math.min(W, H);
    cv.width = W; cv.height = H; root.style.setProperty('--aag-ar', W + '/' + H); root.style.setProperty('--aag-ar-n', (W / H).toFixed(4));
    art = prepArt(img, W, H); fxr = makeFx(W, H);
    reset(); buildPad();
    $('.aag-tip').textContent = L(TIPS[type] || '');
    last = performance.now(); raf = requestAnimationFrame(loop);
  };
  img.src = D.img;

  const TIPS = {
    collect: 'Roll the marble to collect them all.', maze: 'Roll the marble through the maze to the goal.', bowl: 'Aim, then press Roll.',
    treasure: 'Search the painting. The beeps speed up as you get close.', puzzle: 'Slide the pieces back into place.', memory: 'Flip two cards at a time to find pairs.'
  };

  /* ── state per game ── */
  const px = p => ({ x: p.x * W, y: p.y * H });
  function reset() {
    running = false; winEl.hidden = true; stopVoice();
    const r = M * .04;
    S = { t: 0, done: false, focus: { x: W / 2, y: H / 2 }, msgT: 0 };
    if (type === 'collect' || type === 'maze' || type === 'bowl') {
      const st = px((type === 'bowl' ? D.ball : type === 'maze' ? D.mStart : D.start) || (type === 'bowl' ? { x: .5, y: .9 } : { x: .5, y: .5 }));
      S.m = { x: st.x, y: st.y, vx: 0, vy: 0, r: type === 'bowl' ? M * .045 : r, look: { x: 0, y: 0 } };
      S.trail = [];
    }
    if (type === 'collect') { S.items = (D.items || []).map(p => ({ ...px(p), got: false })); S.got = 0; }
    if (type === 'maze') {
      S.walls = (D.walls || []).map(w => [w[0] * W, w[1] * H, w[2] * W, w[3] * H]); S.goal = px(D.goal || { x: .9, y: .1 });
      S.m.r = M * .028;
    }
    if (type === 'bowl') {
      const c = px(D.pins || { x: .5, y: .3 }), sp = M * .075;
      S.pins = pinRack(D.pins || {}).map(o => { const x = c.x + o.dx * sp, y = c.y - o.dy * sp * .9; return { x, y, hx: x, hy: y, vx: 0, vy: 0, r: M * .03, down: false, fade: 1 }; });
      S.start = { x: S.m.x, y: S.m.y }; S.phase = 'aim'; S.aim = 0; S.power = 0; S.rolls = 0; S.downCount = 0; S.settle = 0;
    }
    if (type === 'treasure') {
      S.items = (D.treasures || []).map(p => ({ ...px(p), got: false, name: p.name, line: p.line })); S.got = 0;
      S.seek = { x: W / 2, y: H * .55 }; S.nextPing = 0;
      S.fog = document.createElement('canvas'); S.fog.width = W; S.fog.height = H;
      const f = S.fog.getContext('2d');
      if (D.fog !== false) {
        f.fillStyle = 'rgba(14,16,22,.94)'; f.fillRect(0, 0, W, H);
        for (let i = 0; i < 260; i++) { f.fillStyle = `rgba(${40 + Math.random() * 30},${44 + Math.random() * 30},${60 + Math.random() * 40},${Math.random() * .25})`; f.beginPath(); f.arc(Math.random() * W, Math.random() * H, M * (.02 + Math.random() * .08), 0, TAU); f.fill(); }
      }
    }
    if (type === 'puzzle') {
      const n = clamp(D.size || 3, 2, 6); S.n = n; S.tiles = []; for (let i = 0; i < n * n; i++) S.tiles.push(i);
      S.blank = n * n - 1; S.moves = 0; S.anim = {}; S.peek = 0;
      let prev = -1, b = n * n - 1;
      for (let k = 0; k < 40 * n * n || isSolved(); k++) {
        const opts2 = nbrs(b, n).filter(x => x !== prev); const nb = opts2[Math.floor(Math.random() * opts2.length)];
        S.tiles[b] = S.tiles[nb]; S.tiles[nb] = n * n - 1; prev = b; b = nb; if (k > 4000) break;
      }
      S.cursor = 0;
    }
    if (type === 'memory') {
      const P = clamp(D.pairs || 6, 2, 8);
      const crops = (D.crops && D.crops.length >= P ? D.crops : autoCrops(P)).slice(0, P);
      const cards = []; crops.forEach((c, i) => { cards.push({ p: i, c }); cards.push({ p: i, c }); });
      for (let i = cards.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [cards[i], cards[k]] = [cards[k], cards[i]]; }
      cards.forEach(c => { c.up = false; c.flip = 0; c.done = false; });
      const n = cards.length, cols = n <= 8 ? 4 : 4, rows = Math.ceil(n / cols);
      S.cards = cards; S.cols = cols; S.rows = rows; S.open = []; S.turns = 0; S.pairs = 0; S.P = P; S.cursor = 0; S.wait = 0; S.reveal = 0;
    }
    if (type === 'treasure' || type === 'collect') { /* nothing more */ }
    status();
    cover.hidden = false; root.classList.remove('aag-on');
  }
  function begin(first) {
    cover.hidden = true; winEl.hidden = true; running = true; root.classList.add('aag-on'); SFX.start();
    if (first !== false) { if (!sayLine(D.lines.welcome)) announce(TIPS[type]); }
    status();
  }
  const fmtT = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function status() {
    if (!S) return; let t = '';
    const nn = NOUN[D.itemStyle] || NOUN.star;
    if (type === 'collect') t = `${nn[1][0].toUpperCase() + nn[1].slice(1)}: ${S.got} of ${S.items.length} · ${fmtT(S.t)}`;
    if (type === 'maze') t = `Reach the gold goal · ${fmtT(S.t)}`;
    if (type === 'bowl') t = `Roll ${Math.min(S.rolls + 1, 3)} of 3 · Pins down: ${S.downCount} of ${S.pins.length}`;
    if (type === 'treasure') t = `Treasures found: ${S.got} of ${S.items.length}`;
    if (type === 'puzzle') t = `Pieces in place: ${inPlace()} of ${S.n * S.n - 1} · Moves: ${S.moves}`;
    if (type === 'memory') t = `Pairs: ${S.pairs} of ${S.P} · Turns: ${S.turns}`;
    t = L(t); if (statusEl.textContent !== t) statusEl.textContent = t;
  }
  function good() { if (performance.now() - lastVoice > 3500 && !voiceBusy() && D.lines.good && (D.lines.good.audio || D.lines.good.text)) sayLine(D.lines.good); }
  function win(detail) {
    if (S.done) return; S.done = true; running = false; root.classList.remove('aag-on');
    SFX.win(); buzz([60, 40, 60, 40, 160]);
    for (let i = 0; i < 6; i++) setTimeout(() => fxr && fxr.burst(Math.random() * W, Math.random() * H * .7, ['#ffd27a', '#ff7a2a', '#2aa8e0', '#fff'][i % 4], 30), i * 140);
    $('.aag-wint').textContent = L(detail.big || 'You did it!'); $('.aag-wins').textContent = L(detail.small || '');
    setTimeout(() => { winEl.hidden = false; $('.aag-again').focus({ preventScroll: true }); }, 900);
    if (!sayLine(D.lines.win)) announce(L(detail.big || 'You did it!') + ' ' + L(detail.small || ''));
    rollSound(0);
  }
  function hint() {
    if (!sayLine(D.lines.hint)) announce(TIPS[type]);
    if (!S) return;
    S.hintT = 2.2;
    if (type === 'puzzle') announce(`${inPlace()} of ${S.n * S.n - 1} pieces are in place.`);
    if (type === 'memory') { S.reveal = 1.1; }
  }

  /* ── puzzle helpers ── */
  function nbrs(i, n) { const r = Math.floor(i / n), c = i % n, o = []; if (r > 0) o.push(i - n); if (r < n - 1) o.push(i + n); if (c > 0) o.push(i - 1); if (c < n - 1) o.push(i + 1); return o; }
  function isSolved() { return S && S.tiles && S.tiles.every((t, i) => t === i); }
  function inPlace() { let k = 0; S.tiles.forEach((t, i) => { if (t === i && t !== S.n * S.n - 1) k++; }); return k; }
  function slideFrom(pos) {
    const n = S.n, bpos = S.tiles.indexOf(n * n - 1);
    if (!nbrs(bpos, n).includes(pos)) { SFX.wrong(); return; }
    const id = S.tiles[pos]; S.tiles[bpos] = id; S.tiles[pos] = n * n - 1; S.moves++;
    const fr = { x: pos % n - bpos % n, y: Math.floor(pos / n) - Math.floor(bpos / n) }; S.anim[id] = { x: fr.x, y: fr.y };
    if (id === bpos) { SFX.note(id); buzz(25); const tw = W / n, th = H / n; fxr.ring((bpos % n + .5) * tw, (Math.floor(bpos / n) + .5) * th, 'rgba(255,215,120,'); announce('Piece in place'); } else SFX.slide();
    status();
    if (isSolved()) win({ big: 'Solved!', small: `${S.moves} moves` });
  }
  function puzzleDir(dx, dy) { // arrow moves a piece in that direction into the gap
    const n = S.n, b = S.tiles.indexOf(n * n - 1), r = Math.floor(b / n), c = b % n;
    const sr = r - dy, sc = c - dx; if (sr < 0 || sr >= n || sc < 0 || sc >= n) { SFX.bump(.08); return; }
    slideFrom(sr * n + sc);
  }

  /* ── memory helpers ── */
  function cardRect(i) {
    const pad2 = M * .04, gap = M * .025, cw = (W - pad2 * 2 - gap * (S.cols - 1)) / S.cols, ch = (H - pad2 * 2 - gap * (S.rows - 1)) / S.rows;
    const c = i % S.cols, r = Math.floor(i / S.cols); return { x: pad2 + c * (cw + gap), y: pad2 + r * (ch + gap), w: cw, h: ch };
  }
  function flipCard(i) {
    const c = S.cards[i]; if (!c || c.up || c.done || S.wait > 0 || S.open.length >= 2) return;
    c.up = true; S.open.push(i); SFX.flip(); SFX.note(c.p * 2 % 12, .18); buzz(15);
    announce(`Card ${i + 1}: note ${c.p + 1}`);
    if (S.open.length === 2) {
      S.turns++; const [a, b] = S.open.map(k => S.cards[k]);
      if (a.p === b.p) {
        a.done = b.done = true; S.open = []; S.pairs++;
        setTimeout(() => { SFX.collect(a.p); buzz([30, 30, 50]); [a, b].forEach((cc, j) => { const r = cardRect(S.cards.indexOf(cc)); fxr.burst(r.x + r.w / 2, r.y + r.h / 2, '#ffd27a', 18); }); }, 250);
        announce('A pair!'); good();
        if (S.pairs === S.P) setTimeout(() => win({ big: 'All pairs found!', small: `${S.turns} turns` }), 600);
      } else { S.wait = 1.1; setTimeout(() => SFX.wrong(), 450); }
      status();
    }
  }

  /* ── input events ── */
  function tap(p) {
    if (type === 'puzzle') { const n = S.n, c = Math.floor(p.x / (W / n)), r = Math.floor(p.y / (H / n)); slideFrom(clamp(r, 0, n - 1) * n + clamp(c, 0, n - 1)); }
    if (type === 'memory') { for (let i = 0; i < S.cards.length; i++) { const r = cardRect(i); if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) { S.cursor = i; flipCard(i); break; } } }
    if (type === 'bowl' && S.phase === 'aim') { S.aim = clamp(Math.atan2(p.x - S.m.x, S.m.y - p.y), -1, 1); }
  }
  function doAction(down) {
    if (!running || !S) return;
    if (type === 'bowl') { if (down && S.phase === 'aim') launch(); }
    if (type === 'memory' && down) flipCard(S.cursor);
    if (type === 'puzzle') S.peek = down ? 1 : 0;
    if (type === 'treasure' && down) { S.nextPing = 0; const n = nearest(S.items, S.seek); if (n) { const d = Math.hypot(n.x - S.seek.x, n.y - S.seek.y) / M; announce(d < .15 ? 'Very close!' : d < .3 ? 'Getting warm.' : d < .5 ? 'Cool.' : 'Cold. Keep looking.'); } }
  }
  function launch() {
    const sp = M * lerp(1.4, 2.6, S.power);
    S.m.vx = Math.sin(S.aim) * sp; S.m.vy = -Math.cos(S.aim) * sp; S.phase = 'roll'; S.settle = 0; tone(196, .3, 'triangle', .15);
    announce('Rolling!');
  }
  const nearest = (arr, p) => { let b = null, bd = 1e9; for (const it of arr) { if (it.got) continue; const d = Math.hypot(it.x - p.x, it.y - p.y); if (d < bd) { bd = d; b = it; } } return b; };

  /* ── physics ── */
  function wallHit(m, w) {
    const [x1, y1, x2, y2] = w, dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
    const t = clamp(((m.x - x1) * dx + (m.y - y1) * dy) / L2, 0, 1), cx = x1 + dx * t, cy = y1 + dy * t;
    let nx = m.x - cx, ny = m.y - cy; const d = Math.hypot(nx, ny), lim = m.r + M * .009;
    if (d < lim && d > 0.0001) {
      nx /= d; ny /= d; m.x = cx + nx * lim; m.y = cy + ny * lim;
      const vn = m.vx * nx + m.vy * ny; if (vn < 0) { m.vx -= 1.5 * vn * nx; m.vy -= 1.5 * vn * ny; if (-vn > M * .15) { SFX.bump(-vn / M * .25); buzz(12); } }
    }
  }
  function edges(m, bounce) {
    let hit = 0;
    if (m.x < m.r) { m.x = m.r; if (m.vx < 0) { hit = -m.vx; m.vx *= -bounce; } }
    if (m.x > W - m.r) { m.x = W - m.r; if (m.vx > 0) { hit = m.vx; m.vx *= -bounce; } }
    if (m.y < m.r) { m.y = m.r; if (m.vy < 0) { hit = -m.vy; m.vy *= -bounce; } }
    if (m.y > H - m.r) { m.y = H - m.r; if (m.vy > 0) { hit = m.vy; m.vy *= -bounce; } }
    if (hit > M * .2) { SFX.bump(hit / M * .2); buzz(10); }
  }
  function marbleStep(dt) {
    const m = S.m, A = M * 2.4;
    let ax = vec.x, ay = vec.y;
    if (src.touch && type !== 'bowl') { const dx = src.touch.x - m.x, dy = src.touch.y - m.y, d = Math.hypot(dx, dy); if (d > m.r * .5) { const k = clamp(d / (M * .2), 0, 1); ax = dx / d * k; ay = dy / d * k; } }
    m.vx += ax * A * dt; m.vy += ay * A * dt;
    const fr = Math.pow(.25, dt); m.vx *= fr; m.vy *= fr;
    const sp = Math.hypot(m.vx, m.vy), max = M * 1.3; if (sp > max) { m.vx *= max / sp; m.vy *= max / sp; }
    const steps = 4;
    for (let s = 0; s < steps; s++) {
      m.x += m.vx * dt / steps; m.y += m.vy * dt / steps;
      if (S.walls) for (const w of S.walls) wallHit(m, w);
      edges(m, .45);
    }
    const spd = Math.hypot(m.vx, m.vy); m.look.x = lerp(m.look.x, spd > 5 ? m.vx / spd * clamp(spd / (M * .3), 0, 1) : 0, .15); m.look.y = lerp(m.look.y, spd > 5 ? m.vy / spd * clamp(spd / (M * .3), 0, 1) : 0, .15);
    rollSound(spd / (M * 1.2));
    if (D.marble === 'paint' && spd > 10) { S.trail.push({ x: m.x, y: m.y, a: 1 }); if (S.trail.length > 240) S.trail.shift(); }
    S.focus = { x: m.x, y: m.y };
  }
  function bowlStep(dt) {
    const m = S.m;
    if (S.phase === 'aim') {
      S.aim = clamp(S.aim + vec.x * dt * 1.4, -1, 1); S.power = .5 + .5 * Math.sin(S.t * 3.2);
      rollSound(0); S.focus = { x: m.x, y: m.y }; return;
    }
    m.vx += vec.x * M * .6 * dt; // spin
    const fr = Math.pow(.45, dt), frp = Math.pow(.18, dt);
    const all = [m, ...S.pins.filter(p => p.fade > .02)];
    for (let s = 0; s < 4; s++) {
      for (const b of all) { b.x += b.vx * dt / 4; b.y += b.vy * dt / 4; }
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), lim = a.r + b.r;
        if (d < lim && d > .001) {
          const nx = dx / d, ny = dy / d, ma = a === m ? 4 : 1, mb = b === m ? 4 : 1, ov = lim - d;
          a.x -= nx * ov * mb / (ma + mb); a.y -= ny * ov * mb / (ma + mb); b.x += nx * ov * ma / (ma + mb); b.y += ny * ov * ma / (ma + mb);
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) {
            const jimp = -(1.6) * rv / (1 / ma + 1 / mb);
            a.vx -= jimp * nx / ma; a.vy -= jimp * ny / ma; b.vx += jimp * nx / mb; b.vy += jimp * ny / mb;
            if (-rv > M * .1) { SFX.crash(1); buzz(20); }
          }
        }
      }
    }
    for (const b of all) { const k = b === m ? fr : frp; b.vx *= k; b.vy *= k; }
    for (const p of S.pins) { if (p.down) p.fade = Math.max(0, p.fade - dt * .5); else if (Math.hypot(p.x - p.hx, p.y - p.hy) > p.r * 1.4 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) { p.down = true; S.downCount++; fxr.burst(p.x, p.y, '#fff', 10); status(); } }
    rollSound(Math.hypot(m.vx, m.vy) / (M * 2));
    S.focus = { x: m.x, y: m.y };
    const out = m.x < -m.r || m.x > W + m.r || m.y < -m.r || m.y > H + m.r;
    const still = (Math.hypot(m.vx, m.vy) < M * .07 || S.downCount >= S.pins.length) && S.pins.every(p => p.fade <= .02 || Math.hypot(p.vx, p.vy) < M * .03);
    if (out || still) S.settle += dt; else S.settle = 0;
    if (S.settle > .9) {
      S.rolls++;
      for (const p of S.pins) if (p.down) { p.fade = 0; p.vx = p.vy = 0; } else { p.x = p.hx; p.y = p.hy; p.vx = p.vy = 0; }
      if (S.downCount >= S.pins.length) { win({ big: S.rolls === 1 ? 'Strike!' : 'All pins down!', small: `In ${S.rolls} roll${S.rolls > 1 ? 's' : ''}` }); return; }
      if (S.rolls >= 3) { win({ big: `${S.downCount} of ${S.pins.length} pins!`, small: 'Press Play again for a new round.' }); return; }
      announce(`${S.downCount} pins down. Roll again.`);
      m.x = S.start.x; m.y = S.start.y; m.vx = m.vy = 0; S.phase = 'aim'; status();
    }
  }
  function treasureStep(dt) {
    const s = S.seek, sp = M * .5;
    s.x = clamp(s.x + vec.x * sp * dt, 0, W); s.y = clamp(s.y + vec.y * sp * dt, 0, H);
    if (src.touch) { s.x = lerp(s.x, src.touch.x, .35); s.y = lerp(s.y, src.touch.y, .35); }
    S.focus = { x: s.x, y: s.y };
    const f = S.fog.getContext('2d'); f.save(); f.globalCompositeOperation = 'destination-out';
    const g = f.createRadialGradient(s.x, s.y, 0, s.x, s.y, M * .1); g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    f.fillStyle = g; f.beginPath(); f.arc(s.x, s.y, M * .1, 0, TAU); f.fill(); f.restore();
    const n = nearest(S.items, s); if (!n) return;
    const d = Math.hypot(n.x - s.x, n.y - s.y), warm = clamp(1 - d / (M * .7), 0, 1);
    S.warm = warm;
    if (d < M * .07) {
      n.got = true; S.got++; SFX.found(); buzz([40, 30, 80]); fxr.burst(n.x, n.y, '#ffd27a', 36); fxr.ring(n.x, n.y);
      f.save(); f.globalCompositeOperation = 'destination-out'; f.beginPath(); f.arc(n.x, n.y, M * .16, 0, TAU); f.fill(); f.restore();
      announce('Found ' + (n.name || 'a treasure') + '!');
      if (!sayLine(n.line)) good();
      status();
      if (S.got === S.items.length) setTimeout(() => { S.clearFog = 1; win({ big: 'All treasures found!', small: fmtT(S.t) }); }, 900);
      return;
    }
    if (guide.checked) {
      S.nextPing -= dt;
      if (S.nextPing <= 0) { SFX.ping(warm, clamp((n.x - s.x) / (M * .5), -1, 1)); if (warm > .72) buzz(Math.round(10 + warm * 25)); S.nextPing = lerp(1.1, .11, Math.pow(warm, 1.4)); }
    }
  }
  function guidePing(dt, target) {
    if (!guide.checked || !target) return;
    S.nextPing = (S.nextPing || 0) - dt;
    if (S.nextPing > 0) return;
    const d = Math.hypot(target.x - S.m.x, target.y - S.m.y), warm = clamp(1 - d / (M * 1.1), 0, 1);
    SFX.ping(warm * .8, clamp((target.x - S.m.x) / (M * .5), -1, 1)); S.nextPing = lerp(1.4, .25, warm);
  }
  function stepDiscrete(dt) {
    S.repeat = (S.repeat || 0) - dt;
    let v = vec;
    if (stepOnce) { v = stepOnce; stepOnce = false; S.repeat = .42; S.held = false; }
    else {
      const mag = Math.max(Math.abs(vec.x), Math.abs(vec.y));
      if (mag < .5) { S.repeat = 0; S.held = false; return; }
      if (S.repeat > 0) return;
      S.repeat = S.held ? .22 : .42; S.held = true;
    }
    const dx = Math.abs(v.x) > Math.abs(v.y) ? Math.sign(v.x) : 0, dy = dx ? 0 : Math.sign(v.y);
    if (!dx && !dy) return;
    if (type === 'puzzle') puzzleDir(dx, dy);
    if (type === 'memory') {
      const c = S.cursor % S.cols, r = Math.floor(S.cursor / S.cols);
      const nc = clamp(c + dx, 0, S.cols - 1), nr = clamp(r + dy, 0, S.rows - 1), ni = Math.min(nr * S.cols + nc, S.cards.length - 1);
      if (ni !== S.cursor) { S.cursor = ni; SFX.tick(); const cd = S.cards[ni]; announce(`Card ${ni + 1}, row ${nr + 1}` + (cd.done ? ', matched' : cd.up ? ', face up' : '')); } else SFX.bump(.06);
    }
  }

  /* ── frame ── */
  function loop(now) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
    readVec();
    if (running && S && !S.done) {
      S.t += dt;
      if (type === 'collect') {
        marbleStep(dt);
        for (let i = 0; i < S.items.length; i++) { const it = S.items[i]; if (!it.got && Math.hypot(it.x - S.m.x, it.y - S.m.y) < S.m.r + M * .035) { it.got = true; S.got++; SFX.collect(S.got); buzz(30); fxr.burst(it.x, it.y, ITEM_COL[D.itemStyle || 'star'][0], 26); fxr.ring(it.x, it.y); status(); announce(`${S.got} of ${S.items.length}`); good(); if (S.got === S.items.length) win({ big: 'All collected!', small: fmtT(S.t) }); } }
        guidePing(dt, nearest(S.items, S.m));
      }
      if (type === 'maze') {
        marbleStep(dt);
        if (Math.hypot(S.goal.x - S.m.x, S.goal.y - S.m.y) < S.m.r + M * .04) { fxr.ring(S.goal.x, S.goal.y); win({ big: 'You made it!', small: fmtT(S.t) }); }
        guidePing(dt, S.goal);
      }
      if (type === 'bowl') bowlStep(dt);
      if (type === 'treasure') treasureStep(dt);
      if (type === 'puzzle' || type === 'memory') stepDiscrete(dt);
      if (type === 'memory' && S.wait > 0) { S.wait -= dt; if (S.wait <= 0) { S.open.forEach(k => { S.cards[k].up = false; }); S.open = []; } }
      if (Math.floor(S.t) !== Math.floor(S.t - dt)) status();
    } else if (S && S.m) rollSound(0);
    if (S && S.hintT) S.hintT = Math.max(0, S.hintT - dt);
    if (S && S.reveal) S.reveal = Math.max(0, S.reveal - dt);
    fxr.update(dt, D.fx);
    draw();
  }

  function drawArt(src2) {
    const fx = D.fx, k = fx.breathe ? 1 + .012 * (1 + Math.sin(T * 1.3)) : 1;
    const view = vsel.value, im = view === 'blur' ? art.blur : view === 'contrast' ? art.contrast : art.full;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.drawImage(src2 || im, -W / 2, -H / 2, W, H); ctx.restore();
  }
  function draw() {
    if (!art || !S) return;
    ctx.clearRect(0, 0, W, H);
    const view = vsel.value, im = view === 'blur' ? art.blur : view === 'contrast' ? art.contrast : art.full;
    if (type === 'puzzle') drawPuzzle(im);
    else if (type === 'memory') drawMemory(im);
    else drawArt();
    fxr.glow(ctx, T, D.fx);
    if (type === 'collect') for (const it of S.items) if (!it.got) drawItem(ctx, D.itemStyle || 'star', it.x, it.y, M * .032, T);
    if (type === 'maze') drawMaze();
    if (type === 'bowl') drawBowl();
    if (type === 'treasure') drawTreasure();
    if (S.trail && S.trail.length) { ctx.save(); for (const p of S.trail) { p.a *= .995; ctx.globalAlpha = p.a * .55; ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.arc(p.x, p.y, S.m.r * .5, 0, TAU); ctx.fill(); } ctx.restore(); }
    if (S.m) drawMarble(ctx, D.marble || 'eye', S.m.x, S.m.y, S.m.r, S.m.vx, S.m.vy, T, S.m.look);
    fxr.draw(ctx, T);
    if (S.hintT && S.m && type === 'collect') { const n = nearest(S.items, S.m); if (n) arrow(S.m, n); }
    if (S.hintT && type === 'maze') arrow(S.m, S.goal);
    if (S.hintT && type === 'treasure') { const n = nearest(S.items, S.seek); if (n) arrow(S.seek, n); }
    // how it looks with less sight: the dark follows where you play
    if (view === 'tunnel' || view === 'center') {
      const f = S.focus, g = view === 'tunnel' ? ctx.createRadialGradient(f.x, f.y, M * .12, f.x, f.y, M * .42) : ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, M * .2);
      if (view === 'tunnel') { g.addColorStop(0, 'rgba(5,6,8,0)'); g.addColorStop(1, 'rgba(5,6,8,.97)'); }
      else { g.addColorStop(0, 'rgba(40,36,34,.92)'); g.addColorStop(.6, 'rgba(40,36,34,.6)'); g.addColorStop(1, 'rgba(40,36,34,0)'); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }
  function arrow(a, b) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x), r = M * .12, x = a.x + Math.cos(ang) * r, y = a.y + Math.sin(ang) * r;
    ctx.save(); ctx.globalAlpha = Math.min(1, S.hintT); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = '#ffd27a'; ctx.strokeStyle = '#14100c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(M * .05, 0); ctx.lineTo(-M * .03, -M * .035); ctx.lineTo(-M * .015, 0); ctx.lineTo(-M * .03, M * .035); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
  }
  function drawMaze() {
    const lw = M * .018;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(10,10,14,.8)'; ctx.lineWidth = lw + 6; ctx.beginPath(); for (const w of S.walls) { ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); } ctx.stroke();
    ctx.strokeStyle = '#f2ede4'; ctx.lineWidth = lw; ctx.shadowColor = 'rgba(255,214,150,.9)'; ctx.shadowBlur = 12; ctx.stroke();
    ctx.restore();
    const g = S.goal, p = 1 + .15 * Math.sin(T * 4);
    ctx.save(); ctx.fillStyle = 'rgba(245,166,35,.35)'; ctx.beginPath(); ctx.arc(g.x, g.y, M * .06 * p, 0, TAU); ctx.fill();
    drawItem(ctx, 'star', g.x, g.y, M * .035, T); ctx.restore();
  }
  function drawBowl() {
    const m = S.m;
    // lane
    ctx.save(); ctx.globalAlpha = .18; ctx.fillStyle = '#000'; ctx.fillRect(S.start.x - M * .22, 0, M * .44, H); ctx.restore();
    for (const p of S.pins) {
      if (p.fade <= 0) continue;
      ctx.save(); ctx.globalAlpha = p.fade;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(p.x + p.r * .2, p.y + p.r * .3, p.r, p.r * .8, 0, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(p.x - p.r * .3, p.y - p.r * .3, p.r * .1, p.x, p.y, p.r); g.addColorStop(0, '#fff'); g.addColorStop(1, '#d9d2c7');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#e8433a'; ctx.lineWidth = p.r * .25; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .62, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    if (S.phase === 'aim' && running) {
      const L = M * .32, ex = m.x + Math.sin(S.aim) * L, ey = m.y - Math.cos(S.aim) * L;
      ctx.save(); ctx.setLineDash([M * .02, M * .015]); ctx.strokeStyle = 'rgba(255,214,150,.95)'; ctx.lineWidth = M * .01;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
      // power meter
      const bw = M * .3, bh = M * .03, bx = m.x - bw / 2, by = Math.min(H - bh - 6, m.y + m.r + M * .03);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; roundRect(ctx, bx - 3, by - 3, bw + 6, bh + 6, bh); ctx.fill();
      const gg = ctx.createLinearGradient(bx, 0, bx + bw, 0); gg.addColorStop(0, '#2aa8e0'); gg.addColorStop(.6, '#f5a623'); gg.addColorStop(1, '#e8433a');
      ctx.fillStyle = gg; roundRect(ctx, bx, by, Math.max(bh, bw * S.power), bh, bh / 2); ctx.fill();
      ctx.restore();
    }
  }
  function drawTreasure() {
    if (S.clearFog) S.clearFog = Math.max(0, S.clearFog - .02);
    ctx.save(); ctx.globalAlpha = S.clearFog !== undefined ? S.clearFog : 1; ctx.drawImage(S.fog, 0, 0); ctx.restore();
    for (const it of S.items) if (it.got) {
      ctx.save(); ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = M * .008; ctx.beginPath(); ctx.arc(it.x, it.y, M * .05, 0, TAU); ctx.stroke();
      drawItem(ctx, 'gem', it.x, it.y - M * .085, M * .022, T); ctx.restore();
    }
    if (running || !S.done) {
      const s = S.seek, w = S.warm || 0, r = M * (.055 + w * .03);
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2);
      g.addColorStop(0, `rgba(255,${Math.round(lerp(230, 140, w))},${Math.round(lerp(160, 60, w))},.55)`); g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, r * 2, 0, TAU); ctx.fill();
      ctx.strokeStyle = w > .7 ? '#ff7a2a' : '#f2ede4'; ctx.lineWidth = M * .008; ctx.beginPath(); ctx.arc(s.x, s.y, r * (1 + .1 * Math.sin(T * (4 + w * 10))), 0, TAU); ctx.stroke();
    }
  }
  function drawPuzzle(im) {
    const n = S.n, tw = W / n, th = H / n, gap = Math.max(2, M * .004), blankId = n * n - 1, solved = S.done;
    ctx.fillStyle = '#0d0f13'; ctx.fillRect(0, 0, W, H);
    for (let pos = 0; pos < n * n; pos++) {
      const id = S.tiles[pos]; if (id === blankId && !solved) continue;
      let c = pos % n, r = Math.floor(pos / n); const a = S.anim[id];
      if (a) { c += a.x; r += a.y; a.x *= .7; a.y *= .7; if (Math.abs(a.x) + Math.abs(a.y) < .01) delete S.anim[id]; }
      const sx = (id % n) * tw, sy = Math.floor(id / n) * th;
      ctx.drawImage(im, sx, sy, tw, th, c * tw + gap / 2, r * th + gap / 2, tw - gap, th - gap);
      if (!solved && id === pos) { ctx.strokeStyle = 'rgba(255,214,120,.65)'; ctx.lineWidth = gap * 1.5; ctx.strokeRect(c * tw + gap, r * th + gap, tw - gap * 2, th - gap * 2); }
    }
    if (S.peek > 0) { ctx.save(); ctx.globalAlpha = .85; ctx.drawImage(im, 0, 0, W, H); ctx.restore(); }
    if (!solved && running) {
      const b = S.tiles.indexOf(blankId), bc = b % n, br = Math.floor(b / n);
      ctx.save(); ctx.strokeStyle = 'rgba(42,168,224,.8)'; ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.strokeRect(bc * tw + 6, br * th + 6, tw - 12, th - 12); ctx.restore();
    }
  }
  function drawMemory(im) {
    ctx.save(); ctx.drawImage(im, 0, 0, W, H); if (!S.done) { ctx.fillStyle = 'rgba(10,12,16,.72)'; ctx.fillRect(0, 0, W, H); } ctx.restore();
    if (S.done) return;
    const csz = M * .3;
    for (let i = 0; i < S.cards.length; i++) {
      const c = S.cards[i], r = cardRect(i), want = (c.up || c.done || S.reveal > 0) ? 1 : 0;
      c.flip = lerp(c.flip, want, .25);
      const sx = Math.abs(Math.cos(c.flip * Math.PI)), face = c.flip > .5, cx = r.x + r.w / 2;
      ctx.save(); ctx.translate(cx, 0); ctx.scale(Math.max(.02, sx), 1); ctx.translate(-cx, 0);
      roundRect(ctx, r.x, r.y, r.w, r.h, M * .02);
      if (face) {
        ctx.save(); ctx.clip(); const s = Math.max(r.w, r.h) / Math.min(r.w, r.h);
        const cw = csz * (r.w >= r.h ? 1 : r.w / r.h), ch = csz * (r.h > r.w ? 1 : r.h / r.w);
        const ccx = clamp(c.c.x * W - cw / 2, 0, W - cw), ccy = clamp(c.c.y * H - ch / 2, 0, H - ch);
        ctx.drawImage(im, ccx, ccy, cw, ch, r.x, r.y, r.w, r.h); ctx.restore();
        ctx.lineWidth = M * .008; ctx.strokeStyle = c.done ? '#ffd27a' : '#f2ede4'; ctx.stroke();
      } else {
        const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, '#ff7a2a'); g.addColorStop(.55, '#e8433a'); g.addColorStop(1, '#2aa8e0');
        ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = M * .006; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = `900 ${Math.round(Math.min(r.w, r.h) * .5)}px Archivo, Arial Black, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', cx, r.y + r.h / 2 + 2);
      }
      ctx.restore();
      if (i === S.cursor && running && csel.value !== 'tilt' || i === S.cursor && running) { ctx.save(); ctx.strokeStyle = '#2aa8e0'; ctx.lineWidth = M * .012; roundRect(ctx, r.x - M * .01, r.y - M * .01, r.w + M * .02, r.h + M * .02, M * .025); ctx.stroke(); ctx.restore(); }
    }
  }


  /* ── play on the real painting: the camera finds the art and the game sits right on it ── */
  let AR = null;
  const arBtn = root.querySelector('.aag-arbtn');
  if (window.AACapture && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) arBtn.hidden = false;
  const stageEl = root.querySelector('.aag-stage');
  function startAR() {
    ac();
    const vid = document.createElement('video'); vid.className = 'aag-arvid'; vid.muted = true; vid.playsInline = true; vid.setAttribute('playsinline', ''); vid.autoplay = true;
    const tip = document.createElement('p'); tip.className = 'aag-artip'; tip.setAttribute('aria-live', 'polite'); tip.textContent = L('Point your camera at the painting. Keep all four corners in view.');
    AR = { vid, tip, stream: null, q: null, seen: 0, lost: 0, t: 0, raf: 0 };
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }).then(st => {
      if (!AR) { st.getTracks().forEach(t => t.stop()); return; }
      AR.stream = st; vid.srcObject = st; vid.play().catch(() => {});
      stageEl.prepend(vid); stageEl.appendChild(tip); stageEl.classList.add('aag-ar'); arBtn.textContent = L('Back to the screen');
      announce('Camera on. Point at the painting.');
      if (window.AACapture.resetTracking) AACapture.resetTracking(); AR.trk = null;
      const tick = () => {
        if (!AR) return; AR.raf = requestAnimationFrame(tick);
        const vw = vid.videoWidth, vh = vid.videoHeight; if (!vw) return;
        stageEl.style.setProperty('--aag-arr', vw + '/' + vh); stageEl.style.setProperty('--aag-arn', (vw / vh).toFixed(4));
        if (!AR.trk) AR.trk = AACapture.tracker ? AACapture.tracker() : null;
        const r = AR.trk ? AR.trk.update(vid, vw, vh) : AACapture.detect(vid, vw, vh), sw = stageEl.clientWidth, sh = stageEl.clientHeight;
        if (r) {
          AR.q = r.c.map(([x, y]) => [x * sw, y * sh]);
          AR.lost = 0; if (!AR.seen) { AR.seen = 1; SFX.found(); buzz([30, 30, 60]); tip.textContent = L('Found it! Play right on the painting.'); announce('Found the painting. Play!'); setTimeout(() => { if (AR) tip.classList.add('hide'); }, 2200); }
        } else if (AR.q) { AR.lost++; if (AR.lost === 15) { tip.textContent = L('Lost the painting. Point back at it.'); tip.classList.remove('hide'); } }
        if (AR.q) {
          const H = AACapture.homography([[0, 0], [W, 0], [W, H0()], [0, H0()]], AR.q);
          cv.style.transform = `matrix3d(${H[0]},${H[3]},0,${H[6]},${H[1]},${H[4]},0,${H[7]},0,0,1,0,${H[2]},${H[5]},0,1)`;
          cv.style.opacity = AR.lost > 15 ? .35 : 1;
        }
      };
      tick();
    }).catch(() => { AR = null; announce('The camera was not allowed. You can keep playing on the screen.'); });
  }
  const H0 = () => H;
  function stopAR() {
    if (!AR) return; cancelAnimationFrame(AR.raf); if (AR.stream) AR.stream.getTracks().forEach(t => t.stop());
    AR.vid.remove(); AR.tip.remove(); AR = null;
    stageEl.classList.remove('aag-ar'); cv.style.transform = ''; cv.style.opacity = ''; if (arBtn) arBtn.textContent = L('Play on the painting');
  }
  return {
    destroy() { stopAR(); alive = false; cancelAnimationFrame(raf); stopVoice(); rollSound(0); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); window.removeEventListener('deviceorientation', onTilt); root.innerHTML = ''; },
    get state() { return S; }, start() { begin(); }, canvas: cv
  };
}

window.AAGame = { create, prepArt, makeFx, drawItem, drawMarble, sizeFor, pinRack, autoCrops, SFX, sayLine, stopVoice, ac, VIEWS, NOUN };
})();
