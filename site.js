/* Art Alive: shared behaviour for every page. Visitor counting and the waitlist and contact forms. Settings live in site-config.js. */
(function () {
  var C = window.ART_ALIVE || {};
  // visitor counting: page views, plus named moments through aaCount('name')
  window.aaCount = function (name) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, title: name, event: true }); } catch (e) {} };
  if (C.goatcounter && /^[a-z0-9-]+$/i.test(C.goatcounter)) {
    var s = document.createElement('script'); s.async = true; s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', 'https://' + C.goatcounter + '.goatcounter.com/count'); document.head.appendChild(s);
  }
  // show the public email wherever a page asks for it
  document.querySelectorAll('[data-email]').forEach(function (el) {
    if (!C.contactEmail) { el.hidden = true; return; }
    var a = el.querySelector('a') || el; a.textContent = C.contactEmail; if (a.tagName === 'A') a.href = 'mailto:' + C.contactEmail; el.hidden = false;
  });
  // forms marked data-form send to the form service
  document.querySelectorAll('form[data-form]').forEach(function (f) {
    var status = f.querySelector('[role="status"]'), btn = f.querySelector('button[type="submit"]'), label = btn ? btn.textContent : '';
    var say = function (t, ok) { if (status) { status.textContent = t; status.className = 'status ' + (ok ? 'ok' : 'bad'); } };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      if (!C.formEndpoint) { say('This form isn’t connected yet, so nothing was sent.' + (C.contactEmail ? ' Please email ' + C.contactEmail + ' instead.' : ' Please try again soon.'), false); return; }
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      fetch(C.formEndpoint, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); f.reset(); say(f.getAttribute('data-thanks') || 'Thank you. It’s on its way.', true); window.aaCount(f.getAttribute('data-form') + '-sent'); })
        .catch(function () { say('It didn’t send. Check your connection and try again.' + (C.contactEmail ? ' Or email ' + C.contactEmail + '.' : ''), false); })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = label; } });
    });
  });
})();
