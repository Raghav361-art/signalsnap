/**
 * SignalSnap Dashboard — Theme Manager
 *
 * Three modes: light | dark | system
 * Persisted in localStorage('ss_theme').
 */

const theme = (() => {
  'use strict';

  const KEY = 'ss_theme';
  let _mode = localStorage.getItem(KEY) || 'system';

  function _apply() {
    const resolved = _mode === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : _mode;

    document.documentElement.setAttribute('data-theme', resolved);
    // Update toggle button state if present
    document.querySelectorAll('[data-theme-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeBtn === _mode);
    });
  }

  function set(mode) {
    _mode = mode;
    localStorage.setItem(KEY, _mode);
    _apply();
  }

  function get() { return _mode; }

  function resolved() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function toggle() {
    const r = resolved();
    set(r === 'light' ? 'dark' : 'light');
  }

  function init() {
    _apply();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (_mode === 'system') _apply();
    });
  }

  return { init, set, get, resolved, toggle };
})();

export default theme;
