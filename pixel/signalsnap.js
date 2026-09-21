/**
 * SignalSnap Tracking Pixel
 *
 * Lightweight client-side tracker.
 *
 * Usage:
 *   SignalSnap.init({ apiBase: 'http://localhost:8000', token: '...' });
 *   SignalSnap.track('button_click', { label: 'cta' });
 *
 * Automatic behaviour:
 *   - Generates a persistent anonymous_id (localStorage)
 *   - Generates a per-tab session_id (sessionStorage)
 *   - Tracks page_view on init and on popstate / pushState
 *   - Batches events and flushes every `flushInterval` ms
 *   - Flushes on visibilitychange (hidden) and beforeunload
 *   - Retries failed flushes with exponential backoff (max 3 attempts)
 */

(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function uuid() {
    // crypto.randomUUID where available, else fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getOrSet(storage, key, factory) {
    var val = null;
    try { val = storage.getItem(key); } catch (_) { /* private browsing */ }
    if (val) return val;
    val = factory();
    try { storage.setItem(key, val); } catch (_) { /* ignore */ }
    return val;
  }

  /* ------------------------------------------------------------------ */
  /*  Core                                                               */
  /* ------------------------------------------------------------------ */

  var SDK_VERSION = '1.0.0';
  var MAX_BATCH  = 50;          // backend enforces max 50
  var MAX_RETRY  = 3;

  var _cfg = {
    apiBase:       '',           // required — e.g. http://localhost:8000
    token:         '',           // JWT bearer token (optional)
    flushInterval: 3000,         // ms between automatic flushes
    autoPageView:  true,         // track page_view on init + navigation
    debug:         false,
  };

  var _queue      = [];
  var _anonId     = '';
  var _sessionId  = '';
  var _flushTimer = null;
  var _initialized = false;
  var _flushing   = false;

  /* ---- public ---------------------------------------------------- */

  function init(opts) {
    if (!opts || !opts.apiBase) {
      console.error('[SignalSnap] apiBase is required');
      return;
    }

    Object.keys(opts).forEach(function (k) {
      if (k in _cfg) _cfg[k] = opts[k];
    });

    // Strip trailing slash
    _cfg.apiBase = _cfg.apiBase.replace(/\/+$/, '');

    _anonId    = getOrSet(localStorage,   'ss_anon_id',    function () { return 'v_' + uuid(); });
    _sessionId = getOrSet(sessionStorage,  'ss_session_id', function () { return 's_' + uuid(); });

    _initialized = true;

    // Periodic flush
    _flushTimer = setInterval(flush, _cfg.flushInterval);

    // Flush on tab hide / close
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('beforeunload', flush);

    // Auto page-view
    if (_cfg.autoPageView) {
      _trackPageView();
      _patchHistory();
    }

    if (_cfg.debug) console.log('[SignalSnap] initialized', { anonId: _anonId, sessionId: _sessionId });
  }

  function track(type, metadata) {
    if (!_initialized) {
      console.warn('[SignalSnap] not initialized — call SignalSnap.init() first');
      return;
    }

    var evt = {
      type:         String(type).substring(0, 100),
      page:         location.href.substring(0, 2048),
      timestamp:    Date.now(),
      anonymous_id: _anonId,
      session_id:   _sessionId,
    };

    if (metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0) {
      evt.metadata = metadata;
    }

    _queue.push(evt);

    if (_cfg.debug) console.log('[SignalSnap] queued', evt);

    // Flush immediately if we hit the batch limit
    if (_queue.length >= MAX_BATCH) flush();
  }

  function flush() {
    if (!_initialized || _queue.length === 0 || _flushing) return;

    var batch = _queue.splice(0, MAX_BATCH);
    _send(batch, 0);
  }

  function identify(traits) {
    // Future: merge traits into visitor context.
    // Currently the backend doesn't support an identify endpoint,
    // so we store locally for metadata enrichment.
    if (traits && typeof traits === 'object') {
      try { localStorage.setItem('ss_traits', JSON.stringify(traits)); } catch (_) { /* ignore */ }
    }
  }

  function getAnonymousId()  { return _anonId; }
  function getSessionId()    { return _sessionId; }
  function getQueueLength()  { return _queue.length; }

  function destroy() {
    if (_flushTimer) clearInterval(_flushTimer);
    flush();
    _initialized = false;
  }

  /* ---- internal --------------------------------------------------- */

  function _trackPageView() {
    track('page_view');
  }

  function _patchHistory() {
    // Intercept pushState / replaceState to track SPA navigation
    var origPush    = history.pushState;
    var origReplace = history.replaceState;

    history.pushState = function () {
      origPush.apply(this, arguments);
      _trackPageView();
    };

    history.replaceState = function () {
      origReplace.apply(this, arguments);
      _trackPageView();
    };

    window.addEventListener('popstate', _trackPageView);
    window.addEventListener('hashchange', _trackPageView);
  }

  function _send(batch, attempt) {
    if (batch.length === 0) return;
    _flushing = true;

    var url = _cfg.apiBase + '/track';

    var headers = { 'Content-Type': 'application/json' };
    if (_cfg.token) {
      headers['Authorization'] = 'Bearer ' + _cfg.token;
    }

    var body = JSON.stringify({ events: batch });

    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    Object.keys(headers).forEach(function (h) { xhr.setRequestHeader(h, headers[h]); });

    xhr.onload = function () {
      _flushing = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        if (_cfg.debug) console.log('[SignalSnap] flushed', batch.length, 'events');
      } else {
        if (_cfg.debug) console.warn('[SignalSnap] flush failed', xhr.status, xhr.responseText);
        _retry(batch, attempt);
      }
    };

    xhr.onerror = function () {
      _flushing = false;
      if (_cfg.debug) console.warn('[SignalSnap] network error');
      _retry(batch, attempt);
    };

    xhr.send(body);
  }

  function _retry(batch, attempt) {
    if (attempt >= MAX_RETRY) {
      // Put events back at the front of the queue so they aren't lost
      _queue = batch.concat(_queue);
      if (_cfg.debug) console.warn('[SignalSnap] max retries reached, re-queued', batch.length, 'events');
      return;
    }

    var delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    if (_cfg.debug) console.log('[SignalSnap] retrying in', delay, 'ms (attempt', attempt + 1, ')');

    setTimeout(function () { _send(batch, attempt + 1); }, delay);
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  var SignalSnap = {
    version:        SDK_VERSION,
    init:           init,
    track:          track,
    flush:          flush,
    identify:       identify,
    getAnonymousId: getAnonymousId,
    getSessionId:   getSessionId,
    getQueueLength: getQueueLength,
    destroy:        destroy,
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignalSnap;
  } else {
    root.SignalSnap = SignalSnap;
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
