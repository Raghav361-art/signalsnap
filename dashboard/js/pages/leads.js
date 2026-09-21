/**
 * SignalSnap Dashboard — Leads Page (Table + Kanban)
 */

import api from '../api.js';
import ui from '../components.js';
import utils from '../utils.js';

const STATUSES = ['new', 'contacted', 'qualified', 'lost'];

let _leads = [];
let _view = 'table'; // 'table' | 'kanban'
let _search = '';
let _filterStatus = '';
let _filterIntent = '';
let _sort = 'created_at';
let _sortDir = 'desc';
let _page = 1;
const PER_PAGE = 20;

export async function render() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Leads</h1>
        <div class="page-subtitle" id="leads-count"></div>
      </div>
      <div class="page-actions">
        <div class="input-group">
          <span class="input-icon">${ui.icons.search}</span>
          <input class="input" type="search" id="leads-search" placeholder="Search leads…" aria-label="Search leads" />
        </div>
        <select class="input select" id="leads-filter-status" aria-label="Filter by status" style="width:auto;min-width:120px">
          <option value="">All Statuses</option>
          ${STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <select class="input select" id="leads-filter-intent" aria-label="Filter by intent" style="width:auto;min-width:120px">
          <option value="">All Intents</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm ${_view === 'table' ? 'active' : ''}" id="leads-view-table" aria-label="Table view" style="border-color:${_view === 'table' ? 'var(--color-primary)' : ''}">${ui.icon('list')}</button>
          <button class="btn btn-secondary btn-sm ${_view === 'kanban' ? 'active' : ''}" id="leads-view-kanban" aria-label="Kanban view" style="border-color:${_view === 'kanban' ? 'var(--color-primary)' : ''}">${ui.icon('kanban')}</button>
        </div>
        <button class="btn btn-secondary btn-sm" id="leads-refresh" aria-label="Refresh">${ui.icon('refresh')}</button>
      </div>
    </div>
    <div id="leads-body">${ui.loading('Loading leads…')}</div>`;

  document.getElementById('leads-search').addEventListener('input', utils.debounce(e => {
    _search = e.target.value.toLowerCase(); _page = 1; _renderView();
  }));
  document.getElementById('leads-filter-status').addEventListener('change', e => {
    _filterStatus = e.target.value; _page = 1; _renderView();
  });
  document.getElementById('leads-filter-intent').addEventListener('change', e => {
    _filterIntent = e.target.value; _page = 1; _renderView();
  });
  document.getElementById('leads-view-table').addEventListener('click', () => {
    _view = 'table'; _renderView(); _updateViewBtns();
  });
  document.getElementById('leads-view-kanban').addEventListener('click', () => {
    _view = 'kanban'; _renderView(); _updateViewBtns();
  });
  document.getElementById('leads-refresh').addEventListener('click', _load);
  _load();
}

function _updateViewBtns() {
  const tb = document.getElementById('leads-view-table');
  const kb = document.getElementById('leads-view-kanban');
  if (tb) tb.style.borderColor = _view === 'table' ? 'var(--color-primary)' : '';
  if (kb) kb.style.borderColor = _view === 'kanban' ? 'var(--color-primary)' : '';
}

async function _load() {
  const body = document.getElementById('leads-body');
  if (!body) return;

  try {
    _leads = await api.getLeads();
    _renderView();
  } catch (err) {
    body.innerHTML = `<div class="page-content">${ui.errorPanel(err)}</div>`;
    const retryBtn = body.querySelector('.error-panel button');
    if (retryBtn) retryBtn.addEventListener('click', _load);
  }
}

function _filtered() {
  let list = _leads;
  if (_search) {
    list = list.filter(l =>
      (l.visitor_id || '').toLowerCase().includes(_search) ||
      (l.company || '').toLowerCase().includes(_search) ||
      (l.country || '').toLowerCase().includes(_search)
    );
  }
  if (_filterStatus) list = list.filter(l => l.status === _filterStatus);
  if (_filterIntent) list = list.filter(l => l.intent_level === _filterIntent);
  return list;
}

function _sorted(list) {
  return [...list].sort((a, b) => {
    let av, bv;
    switch (_sort) {
      case 'score':      av = a.score; bv = b.score; break;
      case 'intent_level': av = { high: 3, medium: 2, low: 1 }[a.intent_level] || 0; bv = { high: 3, medium: 2, low: 1 }[b.intent_level] || 0; break;
      case 'status':     av = a.status; bv = b.status; break;
      case 'visitor_id': av = a.visitor_id; bv = b.visitor_id; break;
      case 'created_at': default: av = new Date(a.created_at); bv = new Date(b.created_at); break;
    }
    if (typeof av === 'string') return _sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return _sortDir === 'asc' ? av - bv : bv - av;
  });
}

function _renderView() {
  if (_view === 'kanban') _renderKanban();
  else _renderTable();
}

function _renderTable() {
  const body = document.getElementById('leads-body');
  if (!body) return;
  const filtered = _sorted(_filtered());
  const p = ui.paginate(filtered, _page, PER_PAGE);

  const countEl = document.getElementById('leads-count');
  if (countEl) countEl.textContent = `${utils.formatNumber(filtered.length)} leads`;

  if (filtered.length === 0) {
    body.innerHTML = `<div class="page-content">${_search || _filterStatus || _filterIntent ? ui.emptyState('No matches', 'Try different filters') : ui.emptyState('No leads yet', 'Leads are created when visitors reach the scoring threshold')}</div>`;
    return;
  }

  const sortIcon = (col) => {
    if (_sort !== col) return '<span class="sort-indicator">↕</span>';
    return `<span class="sort-indicator">${_sortDir === 'asc' ? '↑' : '↓'}</span>`;
  };

  body.innerHTML = `
    <div class="table-wrap">
      <table class="table" id="leads-table">
        <thead><tr>
          <th data-sortable="visitor_id">Visitor ${sortIcon('visitor_id')}</th>
          <th>Company</th>
          <th>Country</th>
          <th data-sortable="score">Score ${sortIcon('score')}</th>
          <th data-sortable="intent_level">Intent ${sortIcon('intent_level')}</th>
          <th data-sortable="status">Status ${sortIcon('status')}</th>
          <th data-sortable="created_at">Created ${sortIcon('created_at')}</th>
        </tr></thead>
        <tbody>
          ${p.items.map(l => `
            <tr class="clickable" data-href="#/leads/${l.id}">
              <td class="cell-mono" style="max-width:180px"><span class="truncate" style="display:block">${utils.escapeHtml(l.visitor_id)}</span></td>
              <td>${utils.escapeHtml(l.company || '—')}</td>
              <td>${utils.escapeHtml(l.country || '—')}</td>
              <td>
                <div class="flex items-center gap-2"><strong>${l.score}</strong></div>
                ${ui.scoreBar(l.score)}
              </td>
              <td>${ui.intentBadge(l.intent_level)}</td>
              <td>${ui.statusBadge(l.status)}</td>
              <td>${utils.timeAgo(l.created_at)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${ui.paginationControls(p.page, p.pages)}`;

  // Sort
  body.querySelectorAll('th[data-sortable]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sortable;
      if (_sort === col) _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
      else { _sort = col; _sortDir = 'desc'; }
      _page = 1; _renderTable();
    });
  });

  // Pagination
  const prevBtn = body.querySelector('[data-pg-prev]');
  const nextBtn = body.querySelector('[data-pg-next]');
  if (prevBtn) prevBtn.addEventListener('click', () => { _page--; _renderTable(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { _page++; _renderTable(); });
}

function _renderKanban() {
  const body = document.getElementById('leads-body');
  if (!body) return;
  const filtered = _filtered();

  const countEl = document.getElementById('leads-count');
  if (countEl) countEl.textContent = `${utils.formatNumber(filtered.length)} leads`;

  const byStatus = {};
  STATUSES.forEach(s => { byStatus[s] = []; });
  filtered.forEach(l => {
    if (byStatus[l.status]) byStatus[l.status].push(l);
    else byStatus.new.push(l);
  });

  body.innerHTML = `
    <div class="page-content">
      <div class="kanban" id="kanban-board">
        ${STATUSES.map(status => `
          <div class="kanban-column" data-status="${status}" id="kanban-col-${status}">
            <div class="kanban-column-header">
              <span class="kanban-column-title">${ui.statusBadge(status)}</span>
              <span class="kanban-column-count">${byStatus[status].length}</span>
            </div>
            <div class="kanban-cards" data-status="${status}">
              ${byStatus[status].map(l => `
                <div class="kanban-card" draggable="true" data-lead-id="${l.id}" data-current-status="${l.status}">
                  <div class="kanban-card-title cell-mono truncate">${utils.escapeHtml(l.visitor_id)}</div>
                  <div class="kanban-card-meta flex items-center justify-between">
                    <span>${ui.intentBadge(l.intent_level)}</span>
                    <span><strong>${l.score}</strong></span>
                  </div>
                  ${l.company ? `<div class="kanban-card-meta" style="margin-top:4px">${utils.escapeHtml(l.company)}</div>` : ''}
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`;

  _initDragDrop();
}

function _initDragDrop() {
  const board = document.getElementById('kanban-board');
  if (!board) return;

  let draggedId = null;

  board.addEventListener('dragstart', e => {
    const card = e.target.closest('.kanban-card');
    if (!card) return;
    draggedId = parseInt(card.dataset.leadId);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  board.addEventListener('dragend', e => {
    const card = e.target.closest('.kanban-card');
    if (card) card.classList.remove('dragging');
    board.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
    draggedId = null;
  });

  board.addEventListener('dragover', e => {
    e.preventDefault();
    const col = e.target.closest('.kanban-column');
    if (col) {
      board.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
      col.classList.add('drag-over');
    }
  });

  board.addEventListener('drop', async e => {
    e.preventDefault();
    const col = e.target.closest('.kanban-column');
    if (!col || draggedId == null) return;

    const newStatus = col.dataset.status;
    const lead = _leads.find(l => l.id === draggedId);
    if (!lead || lead.status === newStatus) return;

    try {
      await api.updateLeadStatus(draggedId, newStatus);
      lead.status = newStatus;
      _renderKanban();
      ui.toast(`Lead moved to ${newStatus}`, 'success');
    } catch (err) {
      ui.toast(err.message || 'Failed to update status', 'error');
    }
  });

  // Click to navigate to lead detail
  board.addEventListener('click', e => {
    const card = e.target.closest('.kanban-card');
    if (card && !e.target.closest('[draggable]')?.classList.contains('dragging')) {
      window.location.hash = '#/leads/' + card.dataset.leadId;
    }
  });
}
