/**
 * SignalSnap Dashboard — Utility Functions
 */

const utils = (() => {
  'use strict';

  /* ---- date / time ----------------------------------------------- */

  function formatDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date)) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatDateTime(d) {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date)) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatTime(d) {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date)) return '—';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function timeAgo(d) {
    if (!d) return '—';
    const now = Date.now();
    const then = new Date(d).getTime();
    const diff = Math.max(0, now - then);
    const s = Math.floor(diff / 1000);
    if (s < 60)    return s + 's ago';
    const m = Math.floor(s / 60);
    if (m < 60)    return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24)    return h + 'h ago';
    const day = Math.floor(h / 24);
    if (day < 30)  return day + 'd ago';
    return formatDate(d);
  }

  /* ---- numbers --------------------------------------------------- */

  function formatNumber(n) {
    if (n == null) return '0';
    return Number(n).toLocaleString('en-US');
  }

  function formatCompact(n) {
    if (n == null) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  /* ---- duration -------------------------------------------------- */

  function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  /* ---- misc ------------------------------------------------------ */

  function truncate(str, len = 40) {
    if (!str) return '—';
    return str.length > len ? str.slice(0, len) + '…' : str;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function debounce(fn, ms = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function pathFromUrl(url) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }

  return {
    formatDate, formatDateTime, formatTime, timeAgo,
    formatNumber, formatCompact,
    formatDuration, truncate, escapeHtml, debounce, pathFromUrl,
  };
})();

export default utils;
