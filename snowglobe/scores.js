/* ─────────────────────────────────────────────────────────────
   ART ALIVE: the TOP SCORES of a game.

   Everyone who plays from the same link shares one list (a "board"). The list lives in the site's database (Supabase): two
   functions, score_save and score_top, made by setup/game-scores-setup.sql and reached with the site's publishable key
   from site-config.js (never the secret key; it goes in the apikey header, the way the site's other pages send it).
   What is sent: the board's name, the name the player typed, their score, and a random number that stands for this
   device (so playing again raises their own score instead of adding them twice).

   Until that setup file has been run, or when there is no internet, nothing is lost: the scores are kept on this device
   (the names that have played here, each with their best), and the list shows those.

   const scores = createScores({ board: 'snowman' });       (sample: [{ name, score }] adds made-up names: for a preview only)
   scores.me                      { name, best }: what this device remembers of its player
   await scores.top()             { top: [{ place, name, score, you }], players, me: { place, name, score } | null, shared }
   await scores.save(name, score) the same, after saving. shared: true = it is the shared list; false = this device's own
   scores.rude(name)              true when the name holds a swear word or a slur (see rude() below): the page does not save it
   scores.clean(name)             the name as it will be kept: no symbols, single spaces, at most 12 characters ('' if nothing is left)
   ───────────────────────────────────────────────────────────── */
const KEY = 'aa-game-scores-1', MOST = 20000, LONG = 12;

export function clean(name) {
  let s = String(name == null ? '' : name).replace(/[‘’]/g, "'"); try { s = s.normalize('NFC'); } catch (e) {}
  try { s = s.replace(new RegExp("[^\\p{L}\\p{M}\\p{N} .'-]", 'gu'), ''); } catch (e) { s = s.replace(/[^A-Za-z0-9À-ɏ .'-]/g, ''); }   // letters of any alphabet, digits, spaces, . ' -
  return Array.from(s.replace(/\s+/g, ' ').trim()).slice(0, LONG).join('').trim();
}

// NAMES THAT ARE NOT FRIENDLY (24 Nov 2026; Ben: "WE NEED a profanity filter that looks for and prevents curse words to be typed in").
// rude(name) is true when a name holds a swear word or a slur, also when it is spelled with numbers or symbols for letters (sh1t, $hit),
// with letters doubled (fuuuck), or with spaces or dots between them. The words are not written here: only fingerprints of them are kept
// (a 32-bit FNV-1a hash of each; the list and the script that makes them are kept out of the site). Words in ANY are found anywhere in a
// name (so a name cannot hide one inside another word); the short words in WHOLE only as a whole word (so Cassie, Dickson, Hancock,
// Grape and Essex are all fine). The page will not save such a name, and a name like that already on a list is shown as "Player".
// (The database has its own check as well, in setup/game-scores-setup.sql.)
const ANY = new Set([4499183, 551573376, 594944398, 607931310, 608640602, 641486548, 740225889, 825071621, 846011781, 919192496, 931162246, 1128815096, 1129680376, 1394556622, 1418208120, 1420925638, 1468312105, 1471684052, 1626653616, 1631846163, 1825958011, 1891424249, 2090526271, 2094384677, 2108761896, 2113294878, 2150367198, 2170560880, 2174255971, 2233071915, 2285825857, 2326647249, 2341128772, 2393155737, 2401174130, 2444789715, 2447652168, 2460286864, 2490427312, 2491417249, 2505785029, 2523928442, 2534310150, 2536489863, 2562532229, 2758825305, 2761596009, 2773387833, 2785552513, 2792189898, 2824268595, 2885938328, 2916843581, 2919109247, 3004352723, 3017570559, 3104482549, 3114006918, 3125845923, 3168946342, 3184963045, 3248370327, 3403705867, 3510611045, 3634523446, 3646700319, 3656079069, 3666295138, 3684792787, 3691556361, 3739672974, 3758695880, 3866578250, 3909764211, 3938945542, 3947871341, 4010308924, 4064161250, 4137990222, 4146676842, 4183830597, 4211135728, 4222367796, 4244962838, 4250961641, 4253324943]);
const WHOLE = new Set([28231040, 35318560, 113924760, 179613742, 336914794, 393612970, 477198310, 565441057, 846393306, 999235177, 1362321360, 1413536787, 1579491469, 1698156692, 1905087418, 1911768552, 1931933751, 2123226675, 2185256537, 2261164244, 2374926977, 2380100407, 2421490421, 2559999058, 2597914442, 2686129127, 2798283979, 2985822365, 3034323724, 3070944574, 3130294067, 3152482286, 3368596176, 3517900517, 3525777895, 3527241627, 3560639797, 3610473989, 3685727517, 3745178858, 3907026317, 3981844376, 3993778410, 4022571063, 4156838336, 4219586990]);
const LEET = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g', '+': 't' };
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };   // (the letters checked are a … z only, so one byte each)
export function rude(name) {
  let s = String(name == null ? '' : name).toLowerCase(); try { s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
  s = s.replace(/[0-9!|@$+]/g, c => LEET[c] || c); const one = w => w.replace(/(.)\1+/g, '$1');
  const words = s.split(/[^a-z]+/).filter(Boolean), joined = words.join('');
  for (const w of words.concat(words.length > 1 ? [joined] : [])) if (WHOLE.has(fnv(w)) || WHOLE.has(fnv(one(w)))) return true;
  for (const t of [joined, one(joined)]) for (let i = 0; i < t.length; i++) for (let j = i + 3; j <= t.length; j++) if (ANY.has(fnv(t.slice(i, j)))) return true;
  return false;
}

export function createScores({ board = 'snowman', sample = null } = {}) {
  const C = (typeof window !== 'undefined' && window.ART_ALIVE) || {}, url = String(C.supabaseUrl || '').replace(/\/+$/, ''), key = C.supabaseKey || '';
  board = String(board || 'snowman').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'snowman';
  let online = !!(url && key);   // (switched off for the rest of this visit if the database says the functions are not there)
  // what this device remembers: its random number, the player's name and best, and every name that has played here
  let mem = { id: '', name: '', best: 0, here: {} };
  try { const all = JSON.parse(localStorage.getItem(KEY) || '{}'); if (all && all[board]) mem = Object.assign(mem, all[board]); if (all && all.id) mem.id = all.id; } catch (e) {}
  if (!/^[a-z0-9]{12,32}$/.test(mem.id)) { const a = new Uint8Array(16); try { crypto.getRandomValues(a); } catch (e) { for (let i = 0; i < 16; i++) a[i] = Math.random() * 256; } mem.id = Array.from(a, v => 'abcdefghijklmnopqrstuvwxyz0123456789'[v % 36]).join(''); }
  if (!mem.here || typeof mem.here !== 'object') mem.here = {};
  const keep = () => { try { const all = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; all.id = mem.id; all[board] = { name: mem.name, best: mem.best, here: mem.here }; localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {} };
  const whole = n => Math.max(0, Math.min(MOST, Math.round(+n || 0)));

  async function ask(fn, args) {   // one of the two database functions; null = no answer to be had
    if (!online) return null;
    const stop = typeof AbortController === 'function' ? new AbortController() : null, timer = setTimeout(() => { try { stop && stop.abort(); } catch (e) {} }, 8000);
    try {
      const r = await fetch(url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify(args), signal: stop ? stop.signal : undefined });
      if (r.status === 404) online = false;   // the setup file has not been run yet: this device's own list will do
      if (!r.ok) return null;
      const d = await r.json(); return d && Array.isArray(d.top) ? d : null;
    } catch (e) { return null; } finally { clearTimeout(timer); }
  }
  // this device's own list: the names that have played here (and, in a preview, the made-up ones), best first
  function own() {
    const rows = Object.keys(mem.here).map(k => ({ name: rude(mem.here[k].name) ? 'Player' : mem.here[k].name, score: whole(mem.here[k].score), you: !!mem.name && k === mem.name.toLowerCase() }));
    for (const q of sample || []) rows.push({ name: clean(q.name) || 'Player', score: whole(q.score), sample: true });
    rows.sort((a, b) => b.score - a.score || (a.you ? -1 : 1));
    rows.forEach((r, i) => { r.place = i && rows[i - 1].score === r.score ? rows[i - 1].place : i + 1; });
    const me = rows.find(r => r.you) || null;
    return { top: rows.slice(0, 10), players: rows.length, me: me && { place: me.place, name: me.name, score: me.score }, shared: false };
  }
  const tidy = d => {   // the shared list as it came, with this player's own row marked
    const nice = n => (rude(n) ? 'Player' : String(n || 'Player')), top = d.top.slice(0, 10).map(r => ({ place: +r.place || 0, name: nice(r.name), score: whole(r.score) })), me = d.me ? { place: +d.me.place || 0, name: nice(d.me.name), score: whole(d.me.score) } : null;
    if (me) { const mine = top.find(r => r.place === me.place && r.name === me.name && r.score === me.score); if (mine) mine.you = true; }
    return { top, players: +d.players || top.length, me, shared: true };
  };

  return {
    board, clean, rude,
    get me() { return { name: mem.name, best: mem.best }; },
    get shared() { return online; },
    async top() { const d = await ask('score_top', { b: board, p: mem.id, k: 10 }); return d ? tidy(d) : own(); },
    async save(name, score) {
      const nm = (rude(name) ? '' : clean(name)) || 'Player', sc = whole(score), k = nm.toLowerCase();   // (the page will not ask to save a rude name; if it were asked, it is saved as Player)
      mem.name = nm; mem.best = Math.max(whole(mem.best), sc); mem.here[k] = { name: nm, score: Math.max(sc, whole(mem.here[k] && mem.here[k].score)) }; keep();
      const d = await ask('score_save', { b: board, p: mem.id, n: nm, s: sc, k: 10 });
      if (!d) return own();
      if (d.me && d.me.name && d.me.name !== nm) { mem.name = String(d.me.name); keep(); }   // (the list may have tidied the name)
      return tidy(d);
    }
  };
}
