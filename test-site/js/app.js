/**
 * Acme SaaS — Test Site App
 *
 * Handles page navigation, tracked interactions, contact form,
 * and SignalSnap pixel initialisation with configurable credentials.
 */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- */
  /*  Page navigation                                                  */
  /* ---------------------------------------------------------------- */

  const pages = ['home', 'features', 'pricing', 'blog', 'contact'];

  function showPage(name) {
    if (!pages.includes(name)) name = 'home';

    pages.forEach(p => {
      const el = document.getElementById('page-' + p);
      if (el) el.hidden = p !== name;
    });

    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      link.classList.toggle('active', link.dataset.page === name);
    });

    window.scrollTo(0, 0);

    // Track page view (if pixel is active and this wasn't triggered by pixel's own hashchange listener)
    if (typeof SignalSnap !== 'undefined' && SignalSnap.getAnonymousId && SignalSnap.getAnonymousId()) {
      // The pixel auto-tracks on hashchange, so we don't double-track here
    }
  }

  // Hash-based routing
  function onHash() {
    const hash = (window.location.hash || '#home').replace('#', '');
    showPage(hash);
  }
  window.addEventListener('hashchange', onHash);
  onHash();

  /* ---------------------------------------------------------------- */
  /*  Tracked interactions                                             */
  /* ---------------------------------------------------------------- */

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-track]');
    if (!el) return;

    const type = el.dataset.track;
    let meta = {};
    try { meta = JSON.parse(el.dataset.meta || '{}'); } catch (_) {}

    if (typeof SignalSnap !== 'undefined' && SignalSnap.track) {
      SignalSnap.track(type, meta);
    }
  });

  /* ---------------------------------------------------------------- */
  /*  Contact form                                                     */
  /* ---------------------------------------------------------------- */

  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Track the form submission
      if (typeof SignalSnap !== 'undefined' && SignalSnap.track) {
        SignalSnap.track('form_submit', {
          form: 'contact',
          name: document.getElementById('contact-name').value,
          company: document.getElementById('contact-company').value,
        });
      }
      // Show success
      document.getElementById('contact-success').hidden = false;
      form.reset();
      setTimeout(function () {
        var el = document.getElementById('contact-success');
        if (el) el.hidden = true;
      }, 4000);
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Config panel — pixel setup                                       */
  /* ---------------------------------------------------------------- */

  const configToggle = document.getElementById('config-toggle');
  const configBody = document.getElementById('config-body');

  configToggle.addEventListener('click', function () {
    const isHidden = configBody.hidden;
    configBody.hidden = !isHidden;
    if (!isHidden) return;
    // Populate current values
    document.getElementById('cfg-api').value = localStorage.getItem('ss_test_api') || 'http://localhost:8000';
    _updatePixelStatus();
  });

  document.getElementById('cfg-save').addEventListener('click', function () {
    var apiBase = document.getElementById('cfg-api').value.trim();
    localStorage.setItem('ss_test_api', apiBase);
    document.getElementById('cfg-status').textContent = '✓ Saved. Initializing pixel…';
    _initPixel(apiBase);
  });

  function _updatePixelStatus() {
    var statusEl = document.getElementById('cfg-pixel-status');
    var anonEl = document.getElementById('cfg-anon-id');
    var sessionEl = document.getElementById('cfg-session-id');
    var queueEl = document.getElementById('cfg-queue');

    if (typeof SignalSnap !== 'undefined' && SignalSnap.getAnonymousId && SignalSnap.getAnonymousId()) {
      statusEl.textContent = '✓ Active';
      statusEl.style.color = '#10b981';
      anonEl.textContent = SignalSnap.getAnonymousId();
      sessionEl.textContent = SignalSnap.getSessionId();
      queueEl.textContent = SignalSnap.getQueueLength();
    } else {
      statusEl.textContent = 'Not initialized';
      statusEl.style.color = '#ef4444';
    }
  }

  // Refresh pixel status periodically when panel is open
  setInterval(function () {
    if (!configBody.hidden) _updatePixelStatus();
  }, 2000);

  /* ---------------------------------------------------------------- */
  /*  Pixel initialisation                                             */
  /* ---------------------------------------------------------------- */

  function _initPixel(apiBase) {
    if (typeof SignalSnap === 'undefined') {
      var statusEl = document.getElementById('cfg-status');
      if (statusEl) statusEl.textContent = '✗ SignalSnap pixel not loaded';
      return;
    }

    // Destroy previous instance if any
    try { SignalSnap.destroy(); } catch (_) {}

    SignalSnap.init({
      apiBase: apiBase,
      flushInterval: 2000,
      autoPageView: true,
      debug: true,
    });

    var statusEl = document.getElementById('cfg-status');
    if (statusEl) statusEl.textContent = '✓ Pixel initialized';
    _updatePixelStatus();
  }

  // Auto-init immediately — no token required
  var storedApi = localStorage.getItem('ss_test_api') || 'http://localhost:8000';
  _initPixel(storedApi);

})();
