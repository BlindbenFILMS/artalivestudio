/* ─────────────────────────────────────────────────────────────
   ART ALIVE: a figure that speaks, its mouth moving to the words.

   A line that was recorded beforehand:
     import { createLine } from './speak.js';
     const line = createLine({ src, from, to, fps, mouth });   // (see figures/ora-snowman/hello.js; from = where in the recording to begin, usually 0)
     figure.talk = () => line.mouth();   // how wide the mouth is open just now, 0 … 1 (0 when it isn't speaking)
     line.unlock();                      // call from a tap, so that the sound is allowed to play a moment later
     line.say(() => { …it has finished… });
     line.speaking                       // true from say() until the last word (or until the sound fails: then the mouth just stays shut)
     line.hush()                         // stop it now

   A line the visitor records, there and then:
     import { createRecorder } from './speak.js';
     const rec = createRecorder({ seconds: 12 });
     await rec.start(() => { …the time is up… });   // from a tap. Asks for the microphone; rejects if it is refused or there is none
     rec.recording, rec.left, rec.level()            // while the microphone is open: true, the seconds left, and how loud the voice is (0 … 1)
     const mine = await rec.stop();                  // null if nothing was heard; otherwise a line with say(), mouth(), speaking and hush(), like the one above
   Nothing is sent anywhere: a recording lives in the page that made it, and is gone when the page is closed.
   ───────────────────────────────────────────────────────────── */
const open36 = (s, k) => (k < 0 || k >= s.length ? 0 : parseInt(s[k], 36) / 35);
const mouthAt = (d, t) => { const i = t * d.fps, i0 = Math.floor(i), p = i - i0; return open36(d.mouth, i0) * (1 - p) + open36(d.mouth, i0 + 1) * p; };

export function createLine(d) {
  const audio = new Audio(); audio.preload = 'auto'; audio.src = d.src;
  let speaking = false, wanted = false, done = null, mark = { ct: 0, at: 0 }, guard = 0;
  // where the sound has got to: the player's own clock moves in small jumps, so between the jumps we count the time ourselves
  const clock = () => { const ct = audio.currentTime, now = performance.now(); if (ct !== mark.ct) mark = { ct, at: now }; return audio.paused ? ct : Math.min(ct + .3, mark.ct + (now - mark.at) / 1000); };
  const stop = () => { if (!speaking) return; speaking = false; clearTimeout(guard); const f = done; done = null; if (f) try { f(); } catch (e) {} };
  audio.addEventListener('ended', stop);
  audio.addEventListener('timeupdate', () => { if (speaking && audio.currentTime >= d.to) stop(); });
  audio.addEventListener('error', stop);
  return {
    audio,
    get speaking() { return speaking; },
    // from a tap: play a moment of it in silence, so that the browser lets it play by itself afterwards
    unlock() { if (wanted) return; try { audio.muted = true; const p = audio.play(); if (p && p.then) p.then(() => { if (!wanted) { audio.pause(); try { audio.currentTime = d.from; } catch (e) {} audio.muted = false; } }, () => { if (!wanted) audio.muted = false; }); } catch (e) {} },
    say(whenDone) {
      wanted = true; done = whenDone || null; speaking = true; mark = { ct: -1, at: 0 };
      clearTimeout(guard); guard = setTimeout(stop, (d.to - d.from + 5) * 1000);   // (whatever happens to the sound, it is over by then)
      audio.muted = false; try { audio.currentTime = d.from; } catch (e) {}
      try { const p = audio.play(); if (p && p.catch) p.catch(stop); } catch (e) { stop(); }
    },
    hush() { if (!speaking) return; try { audio.pause(); } catch (e) {} stop(); },
    mouth() { return speaking && !audio.paused ? mouthAt(d, clock() + .03) : 0; }   // (a hair early: a mouth that leads the sound looks right, one that lags doesn't)
  };
}

/* How wide the mouth should be open, moment by moment, for a stretch of recorded sound (x: one channel, −1 … 1; sr: samples a second).
   Loud vowels open it wide, each syllable is made to stand out, and it is shut in the pauses.
   Returns { mouth, fps, first, last, peak }: the openings as one character each (0 = closed … z = wide open), when the voice begins
   and ends (seconds), and how loud the loudest part is (0 … 1). */
export function measureMouth(x, sr, fps = 50) {
  const hop = Math.round(sr / 100), win = Math.round(sr * .025), n = Math.max(0, Math.floor((x.length - win) / hop)), y = new Float32Array(x.length);
  // keep the range of a voice: a gentle cut above 3200 Hz and below 250 Hz
  { const a1 = Math.exp(-2 * Math.PI * 3200 / sr), a2 = Math.exp(-2 * Math.PI * 250 / sr); let lp = 0, hp = 0, prev = 0; for (let i = 0; i < x.length; i++) { lp = lp * a1 + x[i] * (1 - a1); hp = a2 * (hp + lp - prev); prev = lp; y[i] = hp; } }
  const db = new Float32Array(n); let top = 0;
  for (let k = 0; k < n; k++) { let s = 0; const i0 = k * hop; for (let i = i0; i < i0 + win; i++) s += y[i] * y[i]; const e = Math.sqrt(s / win); if (e > top) top = e; db[k] = 20 * Math.log10(Math.max(e, 1e-9)); }
  const pct = (a, q) => { const s = Float32Array.from(a).sort(); return s.length ? s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))] : 0; };
  const peak = pct(db, .995), floor = peak - 30, v = new Float32Array(n), z = new Float32Array(n);
  for (let k = 0; k < n; k++) v[k] = Math.pow(Math.max(0, Math.min(1, (db[k] - floor) / (peak - floor))), 1.6);
  for (let k = 0; k < n; k++) { let s = 0, c = 0; for (let j = Math.max(0, k - 12); j <= Math.min(n - 1, k + 12); j++) { s += v[j]; c++; } z[k] = Math.max(0, Math.min(1, v[k] + 1.1 * (v[k] - s / c))); }   // each syllable stands out from the quarter of a second around it
  let w = 0; for (let k = 0; k < n; k++) { w = z[k] > w ? z[k] : w + (z[k] - w) * .45; v[k] = w; }                    // it opens at once and closes a touch more slowly
  for (let k = 0; k < n; k++) z[k] = .25 * v[Math.max(0, k - 1)] + .5 * v[k] + .25 * v[Math.min(n - 1, k + 1)];
  const full = Math.max(1e-6, pct(z, .997)); let first = -1, last = -1;
  for (let k = 0; k < n; k++) { z[k] = Math.min(1, z[k] / full); if (z[k] > .08) { if (first < 0) first = k; last = k; } }
  const t0 = win / 2 / sr, T = x.length / sr; let mouth = '';
  for (let j = 0; j <= Math.floor(T * fps); j++) { const i = (j / fps - t0) * 100, i0 = Math.floor(i), p = i - i0, val = i0 < 0 || i0 + 1 >= n ? 0 : z[i0] * (1 - p) + z[i0 + 1] * p; mouth += '0123456789abcdefghijklmnopqrstuvwxyz'[Math.round(Math.max(0, Math.min(1, val)) * 35)]; }
  return { mouth, fps, first: first < 0 ? 0 : first / 100 + t0, last: last < 0 ? 0 : last / 100 + t0, peak: top };
}

export function createRecorder(o = {}) {
  const MAX = o.seconds || 12;
  let ctx = null, stream = null, node = null, src = null, sink = null, chunks = [], total = 0, lvl = 0, recording = false, full = null;
  // a line made from what was recorded: played by the page's own sound, so the mouth and the voice keep exact time
  function made(samples, sr) {
    const m = measureMouth(samples, sr); if (!(m.peak > .012) || m.last - m.first < .15) return null;   // nothing but quiet
    const buf = ctx.createBuffer(1, samples.length, sr); buf.getChannelData(0).set(samples);
    let pk = 0; for (let i = 0; i < samples.length; i += 4) { const a = Math.abs(samples[i]); if (a > pk) pk = a; }
    const from = Math.max(0, m.first - .12), len = Math.min(buf.duration - from, m.last + .3 - from);
    let speaking = false, node2 = null, t0 = 0, done = null;
    const stop = () => { if (!speaking) return; speaking = false; const nd = node2; node2 = null; try { nd && nd.stop(); } catch (e) {} const f = done; done = null; if (f) try { f(); } catch (e) {} };
    return { seconds: len, get speaking() { return speaking; },
      say(whenDone) { stop(); done = whenDone || null; try { if (ctx.state === 'suspended') ctx.resume();
          const nd = ctx.createBufferSource(), g = ctx.createGain(); nd.buffer = buf; g.gain.value = Math.min(4, .9 / Math.max(.05, pk)); nd.connect(g); g.connect(ctx.destination);   // (as loud as a voice should be, however quietly it was spoken)
          nd.onended = () => { if (node2 === nd) stop(); }; const at = ctx.currentTime + .04; nd.start(at, from, len); node2 = nd; t0 = at - from; speaking = true; } catch (e) { speaking = true; stop(); } },
      hush() { stop(); },
      mouth() { return speaking ? mouthAt(m, ctx.currentTime - t0 - (ctx.outputLatency || 0) + .03) : 0; } };
  }
  function close() { recording = false; full = null; try { node && (node.onaudioprocess = null); src && src.disconnect(); node && node.disconnect(); sink && sink.disconnect(); } catch (e) {}
    try { stream && stream.getTracks().forEach(t => t.stop()); } catch (e) {} stream = node = src = sink = null; }
  return {
    get recording() { return recording; },
    get left() { return recording && ctx ? Math.max(0, MAX - total / ctx.sampleRate) : 0; },
    level() { return recording ? lvl : 0; },
    async start(whenFull) {
      if (recording) return; if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no microphone here');
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) throw new Error('no sound here');
      ctx = ctx || new AC(); if (ctx.state === 'suspended') try { await ctx.resume(); } catch (e) {}
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });   // (the browser asks the visitor)
      chunks = []; total = 0; lvl = 0; full = whenFull || null;
      src = ctx.createMediaStreamSource(stream); node = ctx.createScriptProcessor(4096, 1, 1); sink = ctx.createGain(); sink.gain.value = 0;   // (it has to be joined up to run; it makes no sound)
      node.onaudioprocess = e => { if (!recording) return; const d = e.inputBuffer.getChannelData(0); chunks.push(new Float32Array(d)); total += d.length;
        let s = 0; for (let i = 0; i < d.length; i += 8) s += d[i] * d[i]; lvl = Math.min(1, Math.sqrt(s / (d.length / 8)) * 6);
        if (total >= MAX * ctx.sampleRate && full) { const f = full; full = null; setTimeout(f, 0); } };
      src.connect(node); node.connect(sink); sink.connect(ctx.destination); recording = true;
    },
    async stop() {
      if (!recording) return null; const sr = ctx.sampleRate, n = Math.min(total, Math.round(MAX * sr)), all = new Float32Array(n); let at = 0;
      for (const c of chunks) { if (at >= n) break; all.set(at + c.length <= n ? c : c.subarray(0, n - at), at); at += c.length; }
      close(); chunks = []; await new Promise(r => setTimeout(r, 120));   // (a moment for the phone to hand the sound back from the microphone to the speaker)
      return made(all, sr);
    },
    cancel() { close(); chunks = []; }
  };
}
