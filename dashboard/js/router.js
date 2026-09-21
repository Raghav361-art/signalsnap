/**
 * SignalSnap Dashboard — Hash-based SPA Router
 */

const router = (() => {
  'use strict';

  let _routes = [];
  let _notFound = null;
  let _before = null;   // guard — return false to cancel navigation
  let _current = null;

  function on(pattern, handler) {
    // pattern examples: '/overview', '/visitors/:id', '/leads/:id'
    const keys = [];
    const re = new RegExp(
      '^' +
      pattern.replace(/:([^/]+)/g, (_m, key) => {
        keys.push(key);
        return '([^/]+)';
      }) +
      '$'
    );
    _routes.push({ pattern, re, keys, handler });
  }

  function notFound(handler) { _notFound = handler; }
  function before(fn) { _before = fn; }

  function navigate(path) {
    window.location.hash = '#' + path;
  }

  function currentPath() {
    return (window.location.hash || '#/').slice(1) || '/';
  }

  async function _resolve() {
    const path = currentPath();

    if (_before) {
      const ok = await _before(path);
      if (ok === false) return;
    }

    for (const route of _routes) {
      const match = path.match(route.re);
      if (match) {
        const params = {};
        route.keys.forEach((key, i) => {
          params[key] = decodeURIComponent(match[i + 1]);
        });
        _current = { path, pattern: route.pattern, params };
        await route.handler(params);
        _updateNavActive(path);
        return;
      }
    }

    _current = { path, pattern: null, params: {} };
    if (_notFound) await _notFound(path);
  }

  function _updateNavActive(path) {
    document.querySelectorAll('.nav-link[data-route]').forEach(link => {
      const route = link.dataset.route;
      const isActive = path === route || (route !== '/' && path.startsWith(route));
      link.classList.toggle('active', isActive);
    });
  }

  function start() {
    window.addEventListener('hashchange', _resolve);
    // Handle link clicks
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="#/"]');
      if (link) {
        e.preventDefault();
        navigate(link.getAttribute('href').slice(1));
      }
    });
    _resolve();
  }

  function getCurrent() { return _current; }

  return { on, notFound, before, navigate, currentPath, start, getCurrent };
})();

export default router;
