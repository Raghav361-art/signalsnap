/**
 * SignalSnap Dashboard — Reusable UI Component Factories
 */

import utils from './utils.js';

const ui = (() => {
  'use strict';

  /* ---- Icons (inline SVG) ---------------------------------------- */

  const icons = {
    overview:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    visitors:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    leads:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    tracking:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    settings:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    sun:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    monitor:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    search:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    refresh:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    logout:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    chevron:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    menu:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    x:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    empty:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
    error:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    kanban:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>',
    list:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    play:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    code:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    back:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  };

  function icon(name, cls = '') {
    return `<span class="icon ${cls}" aria-hidden="true">${icons[name] || ''}</span>`;
  }

  /* ---- Loading --------------------------------------------------- */

  function loading(msg = 'Loading…') {
    return `<div class="loading-panel"><div class="spinner"></div><span>${utils.escapeHtml(msg)}</span></div>`;
  }

  /* ---- Empty state ----------------------------------------------- */

  function emptyState(title = 'No data', desc = '') {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icons.empty}</div>
        <div class="empty-state-title">${utils.escapeHtml(title)}</div>
        ${desc ? `<div class="empty-state-desc">${utils.escapeHtml(desc)}</div>` : ''}
      </div>`;
  }

  /* ---- Error panel ----------------------------------------------- */

  function errorPanel(err, retryFn) {
    const msg = typeof err === 'string' ? err : (err.message || 'Something went wrong');
    const id = 'err-retry-' + Date.now();
    return `
      <div class="error-panel">
        <div class="empty-state-icon" style="color:var(--color-danger)">${icons.error}</div>
        <div class="error-panel-title">Error</div>
        <div class="error-panel-desc">${utils.escapeHtml(msg)}</div>
        ${retryFn ? `<button class="btn btn-secondary btn-sm" id="${id}">${icon('refresh')} Retry</button>` : ''}
      </div>`;
  }

  /* ---- Badge ----------------------------------------------------- */

  function intentBadge(level) {
    const cls = {
      high: 'badge-intent-high badge-dot',
      medium: 'badge-intent-medium badge-dot',
      low: 'badge-intent-low badge-dot',
    }[level] || 'badge-default';
    return `<span class="badge ${cls}">${utils.escapeHtml(level || '—')}</span>`;
  }

  function statusBadge(status) {
    const cls = {
      new: 'badge-status-new',
      contacted: 'badge-status-contacted',
      qualified: 'badge-status-qualified',
      lost: 'badge-status-lost',
    }[status] || 'badge-default';
    return `<span class="badge ${cls}">${utils.escapeHtml(status || '—')}</span>`;
  }

  function eventTypeBadge(type) {
    const map = {
      page_view: 'badge-primary',
      button_click: 'badge-success',
      form_submit: 'badge-warning',
    };
    return `<span class="badge ${map[type] || 'badge-default'}">${utils.escapeHtml(type)}</span>`;
  }

  /* ---- Bar chart ------------------------------------------------- */

  function barChart(data, colorMap = {}) {
    // data: { label: count, ... }
    const entries = Object.entries(data);
    if (entries.length === 0) return emptyState('No data');
    const max = Math.max(...entries.map(([, v]) => v), 1);
    const colors = ['var(--chart-1)','var(--chart-2)','var(--chart-3)','var(--chart-4)','var(--chart-5)','var(--chart-6)'];

    return `
      <div class="bar-chart">
        ${entries.map(([label, value], i) => {
          const pct = Math.max(2, (value / max) * 100);
          const color = colorMap[label] || colors[i % colors.length];
          return `
            <div class="bar-chart-col">
              <div class="bar-chart-value">${value}</div>
              <div class="bar-chart-bar" style="height:${pct}%;background:${color}" data-tooltip="${label}: ${value}"></div>
              <div class="bar-chart-label">${utils.escapeHtml(label)}</div>
            </div>`;
        }).join('')}
      </div>`;
  }

  /* ---- Donut chart ----------------------------------------------- */

  function donutChart(data, colorMap = {}) {
    const entries = Object.entries(data);
    if (entries.length === 0) return emptyState('No data');
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    const colors = ['var(--chart-1)','var(--chart-2)','var(--chart-3)','var(--chart-4)','var(--chart-5)','var(--chart-6)'];
    const r = 42, c = 2 * Math.PI * r;

    let offset = 0;
    const segments = entries.map(([label, value], i) => {
      const pct = value / total;
      const dash = pct * c;
      const gap = c - dash;
      const color = colorMap[label] || colors[i % colors.length];
      const html = `<circle class="donut-segment" cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="16" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset}" data-tooltip="${label}: ${value}"/>`;
      offset += dash;
      return { html, label, value, color };
    });

    return `
      <div class="donut-chart">
        <svg class="donut-svg" viewBox="0 0 120 120">
          ${segments.map(s => s.html).join('')}
        </svg>
        <div class="donut-legend">
          ${segments.map(s => `
            <div class="donut-legend-item">
              <span class="donut-legend-dot" style="background:${s.color}"></span>
              <span class="donut-legend-label">${utils.escapeHtml(s.label)}</span>
              <span class="donut-legend-value">${s.value}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /* ---- Score bar ------------------------------------------------- */

  function scoreBar(score, max = 50) {
    const pct = Math.min(100, Math.max(0, (score / max) * 100));
    let color = 'var(--color-intent-low)';
    if (score >= 20) color = 'var(--color-intent-high)';
    else if (score >= 10) color = 'var(--color-intent-medium)';
    return `<div class="score-bar"><div class="score-bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
  }

  /* ---- Toast system ---------------------------------------------- */

  function toast(msg, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'all 200ms ease';
      setTimeout(() => el.remove(), 200);
    }, duration);
  }

  /* ---- Pagination helper ----------------------------------------- */

  function paginate(items, page, perPage = 20) {
    const total = items.length;
    const pages = Math.ceil(total / perPage) || 1;
    const p = Math.max(1, Math.min(page, pages));
    const start = (p - 1) * perPage;
    return {
      items: items.slice(start, start + perPage),
      page: p,
      pages,
      total,
      start: start + 1,
      end: Math.min(start + perPage, total),
    };
  }

  function paginationControls(page, pages, onPage) {
    if (pages <= 1) return '';
    const id = 'pg-' + Date.now();
    return `
      <div class="flex items-center justify-between" style="padding:var(--space-3) var(--space-4); border-top:1px solid var(--color-border-light);">
        <span style="font-size:var(--text-xs);color:var(--color-text-secondary)">Page ${page} of ${pages}</span>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" ${page <= 1 ? 'disabled' : ''} data-pg-prev="${id}">Previous</button>
          <button class="btn btn-secondary btn-sm" ${page >= pages ? 'disabled' : ''} data-pg-next="${id}">Next</button>
        </div>
      </div>`;
  }

  return {
    icons, icon,
    loading, emptyState, errorPanel,
    intentBadge, statusBadge, eventTypeBadge,
    barChart, donutChart, scoreBar,
    toast,
    paginate, paginationControls,
  };
})();

export default ui;
