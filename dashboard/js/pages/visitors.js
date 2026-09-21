/**
 * SignalSnap Dashboard — Visitors List Page
 */

import api from '../api.js';
import ui from '../components.js';
import utils from '../utils.js';

let _visitors = [];
let _search = '';
let _sort = 'last_seen';
let _sortDir = 'desc';
let _page = 1;
const PER_PAGE = 20;

export async function render() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Visitors</h1>
        <div class="page-subtitle" id="visitors-count"></div>
      </div>
      <div class="page-actions">
        <div class="input-group">
          <span class="input-icon">${ui.icons.search}</span>
          <input class="input" type="search" id="visitors-search" placeholder="Search visitors…" aria-label="Search visitors" />
        </div>
        <button class="btn btn-secondary btn-sm" id="visitors-refresh" aria-label="Refresh">${ui.icon('refresh')}</button>
      </div>
    </div>
    <div id="visitors-body">${ui.loading('Loading visitors…')}</div>`;

  document.getElementById('visitors-search').addEventListener('input', utils.debounce(e => {
    _search = e.target.value.toLowerCase();
    _page = 1;
    _renderTable();
  }));
  document.getElementById('visitors-refresh').addEventListener('click', _load);
  _load();
}

async function _load() {
  const body = document.getElementById('visitors-body');
  if (!body) return;

  try {
    _visitors = await api.getVisitors();
    _renderTable();
  } catch (err) {
    body.innerHTML = ui.errorPanel(err);
    const retryBtn = body.querySelector('.error-panel button');
    if (retryBtn) retryBtn.addEventListener('click', _load);
  }
}

function _filtered() {
  let list = _visitors;
  if (_search) {
    list = list.filter(v =>
      (v.anonymous_id || '').toLowerCase().includes(_search) ||
      (v.company || '').toLowerCase().includes(_search) ||
      (v.country || '').toLowerCase().includes(_search) ||
      (v.ip || '').toLowerCase().includes(_search)
    );
  }

  // Sort
  list = [...list].sort((a, b) => {
    let av, bv;
    switch (_sort) {
      case 'last_seen':   av = new Date(a.last_seen); bv = new Date(b.last_seen); break;
      case 'first_seen':  av = new Date(a.first_seen); bv = new Date(b.first_seen); break;
      case 'sessions':    av = (a.sessions || []).length; bv = (b.sessions || []).length; break;
      case 'events':      av = (a.events || []).length; bv = (b.events || []).length; break;
      case 'anonymous_id':av = a.anonymous_id; bv = b.anonymous_id; break;
      case 'company':     av = a.company || ''; bv = b.company || ''; break;
      default:            av = 0; bv = 0;
    }
    if (typeof av === 'string') {
      const cmp = av.localeCompare(bv);
      return _sortDir === 'asc' ? cmp : -cmp;
    }
    return _sortDir === 'asc' ? av - bv : bv - av;
  });

  return list;
}

function _renderTable() {
  const body = document.getElementById('visitors-body');
  if (!body) return;
  const filtered = _filtered();
  const p = ui.paginate(filtered, _page, PER_PAGE);

  document.getElementById('visitors-count').textContent = `${utils.formatNumber(filtered.length)} visitors`;

  if (filtered.length === 0) {
    body.innerHTML = `<div class="page-content">${_search ? ui.emptyState('No matches', 'Try a different search term') : ui.emptyState('No visitors yet', 'Set up the tracking pixel to start collecting data')}</div>`;
    return;
  }

  const sortIcon = (col) => {
    if (_sort !== col) return '<span class="sort-indicator">↕</span>';
    return `<span class="sort-indicator">${_sortDir === 'asc' ? '↑' : '↓'}</span>`;
  };

  body.innerHTML = `
    <div class="table-wrap">
      <table class="table" id="visitors-table">
        <thead><tr>
          <th data-sortable="anonymous_id" ${_sort === 'anonymous_id' ? `aria-sort="${_sortDir === 'asc' ? 'ascending' : 'descending'}"` : ''}>Visitor ${sortIcon('anonymous_id')}</th>
          <th data-sortable="company" ${_sort === 'company' ? `aria-sort="${_sortDir === 'asc' ? 'ascending' : 'descending'}"` : ''}>Company ${sortIcon('company')}</th>
          <th>Country</th>
          <th>IP</th>
          <th data-sortable="sessions" ${_sort === 'sessions' ? `aria-sort="${_sortDir === 'asc' ? 'ascending' : 'descending'}"` : ''}>Sessions ${sortIcon('sessions')}</th>
          <th data-sortable="events" ${_sort === 'events' ? `aria-sort="${_sortDir === 'asc' ? 'ascending' : 'descending'}"` : ''}>Events ${sortIcon('events')}</th>
          <th data-sortable="first_seen" ${_sort === 'first_seen' ? `aria-sort="${_sortDir === 'asc' ? 'ascending' : 'descending'}"` : ''}>First Seen ${sortIcon('first_seen')}</th>
          <th data-sortable="last_seen" ${_sort === 'last_seen' ? `aria-sort="${_sortDir === 'asc' ? 'ascending' : 'descending'}"` : ''}>Last Seen ${sortIcon('last_seen')}</th>
        </tr></thead>
        <tbody>
          ${p.items.map(v => `
            <tr class="clickable" data-href="#/visitors/${encodeURIComponent(v.anonymous_id)}">
              <td class="cell-mono" style="max-width:180px"><span class="truncate" style="display:block">${utils.escapeHtml(v.anonymous_id)}</span></td>
              <td>${utils.escapeHtml(v.company || '—')}</td>
              <td>${utils.escapeHtml(v.country || '—')}</td>
              <td class="cell-mono">${utils.escapeHtml(v.ip || '—')}</td>
              <td>${(v.sessions || []).length}</td>
              <td>${(v.events || []).length}</td>
              <td>${utils.formatDate(v.first_seen)}</td>
              <td>${utils.timeAgo(v.last_seen)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${ui.paginationControls(p.page, p.pages)}`;

  // Sort handlers
  body.querySelectorAll('th[data-sortable]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sortable;
      if (_sort === col) { _sortDir = _sortDir === 'asc' ? 'desc' : 'asc'; }
      else { _sort = col; _sortDir = 'desc'; }
      _page = 1;
      _renderTable();
    });
  });

  // Pagination handlers
  const prevBtn = body.querySelector('[data-pg-prev]');
  const nextBtn = body.querySelector('[data-pg-next]');
  if (prevBtn) prevBtn.addEventListener('click', () => { _page--; _renderTable(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { _page++; _renderTable(); });
}
