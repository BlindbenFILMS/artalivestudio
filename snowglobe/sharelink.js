/* ─────────────────────────────────────────────────────────────
   ART ALIVE: share a link — the phone's own share sheet 
   six ways: Text message, Instagram, Facebook, LinkedIn, X, Copy link.
   AAShareLink.open({ url, title, text, onShare(kind) })
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const CSS = `.aasl{position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-end;justify-content:center;background:rgba(5,8,18,.6);padding:16px max(16px,env(safe-area-inset-right,0px)) calc(16px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.aasl .box{width:min(440px,100%);background:#141b2e;color:#f6f8ff;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:14px;box-shadow:0 20px 60px -20px #000}
.aasl h2{margin:0;font:900 20px/1.1 Archivo,"Arial Black",Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase}
.aasl .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.aasl a,.aasl button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:76px;padding:8px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#f6f8ff;font:700 13px/1.2 "Atkinson Hyperlegible",Verdana,sans-serif;text-decoration:none;cursor:pointer;text-align:center}
.aasl a:hover,.aasl button:hover{background:rgba(255,255,255,.1)}
.aasl a:focus-visible,.aasl button:focus-visible{outline:3px solid #7cc4ff;outline-offset:2px}
.aasl svg{width:26px;height:26px}
.aasl .link{display:flex;gap:8px;align-items:center}
.aasl .link button{min-height:44px;flex-direction:row;padding:0 14px;white-space:nowrap}
.aasl .link input{flex:1;min-width:0;min-height:44px;padding:0 12px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:#0b1020;color:#c3cde3;font:14px "Atkinson Hyperlegible",Verdana,sans-serif}
.aasl .close{min-height:48px;flex-direction:row;font:800 14px/1 Archivo,"Arial Black",Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase}
.aasl .st{margin:0;min-height:1.3em;color:#8fe3a2;font-weight:700;text-align:center}
@media (max-width:360px){.aasl .grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
  const I = {
    sms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"/></svg>',
    li: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 9h3.2v10.5H4.5zM6.1 3.8a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8zM9.7 9h3.1v1.4h.1c.4-.8 1.5-1.7 3.1-1.7 3.3 0 3.9 2.2 3.9 5v5.8h-3.2v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.2H9.7z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.5z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M9 9h11v11H9z"/><path d="M5 15H4V4h11v1"/></svg>'
  };
  let styled = false;
  function open(o) {
    o = o || {}; const url = o.url || location.href, title = o.title || document.title, text = o.text || title, log = k => { try { o.onShare && o.onShare(k); } catch (e) {} };
    if (!styled) { styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }
    const msg = text + ' ' + url, e = encodeURIComponent;
    const ov = document.createElement('div'); ov.className = 'aasl'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'aaslH');
    ov.innerHTML = '<div class="box"><h2 id="aaslH">Share it</h2><div class="grid"></div><p class="st" aria-live="polite"></p><button type="button" class="close">Close</button></div>';
    const grid = ov.querySelector('.grid'), st = ov.querySelector('.st');
    async function copy() { let ok = false; try { await navigator.clipboard.writeText(url); ok = true; } catch (er) {
        const t = document.createElement('textarea'); t.value = url; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0'; ov.appendChild(t); t.select(); try { ok = document.execCommand('copy'); } catch (er2) {} t.remove(); }
      return ok; }
    const add = (k, label, href, fn) => { const a = document.createElement(href ? 'a' : 'button'); if (href) { a.href = href; if (/^https/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } } else a.type = 'button';
      a.innerHTML = I[k] + '<span>' + label + '</span>'; a.onclick = ev => { log(k); if (fn) { ev.preventDefault(); fn(); } }; grid.appendChild(a); };
    add('sms', 'Text message', 'sms:?&body=' + e(msg));
    // Instagram has no share link: on a phone, the share menu (choose Instagram); elsewhere, copy the link to paste into a story or post
    add('ig', 'Instagram', '', async () => {
      if (navigator.share && matchMedia('(pointer:coarse)').matches) { try { await navigator.share({ title, text, url }); return; } catch (er) { if (er && er.name === 'AbortError') return; } }
      st.textContent = (await copy()) ? 'Link copied. Paste it into your Instagram story, post or bio.' : 'Copy this link into Instagram: ' + url; });
    add('fb', 'Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + e(url));
    add('li', 'LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' + e(url));
    add('x', 'X', 'https://twitter.com/intent/tweet?text=' + e(text) + '&url=' + e(url));
    add('copy', 'Copy link', '', async () => { st.textContent = (await copy()) ? 'Link copied!' : 'Here’s the link: ' + url; });
    const prev = document.activeElement;
    function close() { ov.remove(); removeEventListener('keydown', esc, true); if (prev && prev.focus) prev.focus(); }
    const esc = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } };
    addEventListener('keydown', esc, true); ov.addEventListener('click', ev => { if (ev.target === ov) close(); }); ov.querySelector('.close').onclick = close;
    document.body.appendChild(ov); grid.firstChild.focus();
  }
  // a phone's share sheet straight away; the panel where there isn't one
  async function share(o) {
    if (navigator.share && matchMedia('(pointer:coarse)').matches) {
      try { await navigator.share({ title: o.title, text: o.text, url: o.url }); o.onShare && o.onShare('native'); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    open(o);
  }
  window.AAShareLink = { open, share };
})();
