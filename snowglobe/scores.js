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
   scores.clean(name)             the name as it will be kept: no symbols, single spaces, at most 12 characters ('' if nothing is left)
   ───────────────────────────────────────────────────────────── */
const KEY = 'aa-game-scores-1', MOST = 20000, LONG = 12;

export function clean(name) {
  let s = String(name == null ? '' : name).replace(/[‘’]/g, "'"); try { s = s.normalize('NFC'); } catch (e) {}
  try { s = s.replace(new RegExp("[^\\p{L}\\p{M}\\p{N} .'-]", 'gu'), ''); } catch (e) { s = s.replace(/[^A-Za-z0-9À-ɏ .'-]/g, ''); }   // letters of any alphabet, digits, spaces, . ' -
  return Array.from(s.replace(/\s+/g, ' ').trim()).slice(0, LONG).join('').trim();
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
    const rows = Object.keys(mem.here).map(k => ({ name: mem.here[k].name, score: whole(mem.here[k].score), you: !!mem.name && k === mem.name.toLowerCase() }));
    for (const q of sample || []) rows.push({ name: clean(q.name) || 'Player', score: whole(q.score), sample: true });
    rows.sort((a, b) => b.score - a.score || (a.you ? -1 : 1));
    rows.forEach((r, i) => { r.place = i && rows[i - 1].score === r.score ? rows[i - 1].place : i + 1; });
    const me = rows.find(r => r.you) || null;
    return { top: rows.slice(0, 10), players: rows.length, me: me && { place: me.place, name: me.name, score: me.score }, shared: false };
  }
  const tidy = d => {   // the shared list as it came, with this player's own row marked
    const top = d.top.slice(0, 10).map(r => ({ place: +r.place || 0, name: String(r.name || 'Player'), score: whole(r.score) })), me = d.me ? { place: +d.me.place || 0, name: String(d.me.name || 'Player'), score: whole(d.me.score) } : null;
    if (me) { const mine = top.find(r => r.place === me.place && r.name === me.name && r.score === me.score); if (mine) mine.you = true; }
    return { top, players: +d.players || top.length, me, shared: true };
  };

  return {
    board, clean,
    get me() { return { name: mem.name, best: mem.best }; },
    get shared() { return online; },
    async top() { const d = await ask('score_top', { b: board, p: mem.id, k: 10 }); return d ? tidy(d) : own(); },
    async save(name, score) {
      const nm = clean(name) || 'Player', sc = whole(score), k = nm.toLowerCase();
      mem.name = nm; mem.best = Math.max(whole(mem.best), sc); mem.here[k] = { name: nm, score: Math.max(sc, whole(mem.here[k] && mem.here[k].score)) }; keep();
      const d = await ask('score_save', { b: board, p: mem.id, n: nm, s: sc, k: 10 });
      if (!d) return own();
      if (d.me && d.me.name && d.me.name !== nm) { mem.name = String(d.me.name); keep(); }   // (the list may have tidied the name)
      return tidy(d);
    }
  };
}
