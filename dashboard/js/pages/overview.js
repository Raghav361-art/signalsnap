/**
 * SignalSnap Dashboard — Overview Page
 */

import api from '../api.js';
import ui from '../components.js';
import utils from '../utils.js';

const STATUS_COLORS = {
  new: 'var(--color-status-new)',
  contacted: 'var(--color-status-contacted)',
  qualified: 'var(--color-status-qualified)',
  lost: 'var(--color-status-lost)',
};
const INTENT_COLORS = {
  high: 'var(--color-intent-high)',
  medium: 'var(--color-intent-medium)',
  low: 'var(--color-intent-low)',
};

let _refreshTimer = null;

export async function render() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Overview</h1>
        <div class="page-subtitle">Real-time analytics dashboard</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" id="overview-refresh" aria-label="Refresh">${ui.icon('refresh')} Refresh</button>
      </div>
    </div>
    <div class="page-content" id="overview-body">${ui.loading('Loading dashboard…')}</div>`;

  document.getElementById('overview-refresh').addEventListener('click', _load);
  _load();

  // Auto-refresh every 30s
  _clearRefresh();
  _refreshTimer = setInterval(_load, 30000);
}

export function destroy() {
  _clearRefresh();
}

function _clearRefresh() {
  if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
}

async function _load() {
  const body = document.getElementById('overview-body');
  if (!body) return;

  try {
    const [stats, visitors, leads] = await Promise.all([
      api.getStats(),
      api.getVisitors(),
      api.getLeads(),
    ]);

    body.innerHTML = _renderDashboard(stats, visitors, leads);
  } catch (err) {
    body.innerHTML = ui.errorPanel(err);
    const retryBtn = body.querySelector('.error-panel button');
    if (retryBtn) retryBtn.addEventListener('click', _load);
  }
}

function _renderDashboard(stats, visitors, leads) {
  // Derive additional metrics
  const avgScore = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length)
    : 0;
  const conversionRate = stats.totalVisitors > 0
    ? ((stats.totalLeads / stats.totalVisitors) * 100).toFixed(1)
    : '0.0';
  const eventsPerVisitor = stats.totalVisitors > 0
    ? (stats.totalEvents / stats.totalVisitors).toFixed(1)
    : '0';

  const recentVisitors = visitors.slice(0, 8);
  const recentLeads = leads.slice(0, 8);

  return `
    <!-- Stat cards -->
    <div class="stat-grid section">
      ${_statCard('Total Visitors', utils.formatCompact(stats.totalVisitors), 'All time')}
      ${_statCard('Active Now', stats.activeNow, 'Last 5 minutes')}
      ${_statCard('Total Leads', utils.formatCompact(stats.totalLeads), `${stats.leadsToday} today`)}
      ${_statCard('High Intent', stats.highIntentLeads, `Avg score: ${avgScore}`)}
      ${_statCard('Total Events', utils.formatCompact(stats.totalEvents), `${eventsPerVisitor}/visitor`)}
      ${_statCard('Conversion', conversionRate + '%', 'Visitors → Leads')}
    </div>

    <!-- Charts -->
    <div class="grid grid-2 section">
      <div class="card">
        <div class="card-header"><span class="card-title">Leads by Status</span></div>
        ${Object.keys(stats.leadsByStatus).length > 0
          ? ui.donutChart(stats.leadsByStatus, STATUS_COLORS)
          : `<div class="card-body">${ui.emptyState('No leads yet')}</div>`}
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Leads by Intent</span></div>
        ${Object.keys(stats.leadsByIntent).length > 0
          ? ui.barChart(stats.leadsByIntent, INTENT_COLORS)
          : `<div class="card-body">${ui.emptyState('No leads yet')}</div>`}
      </div>
    </div>

    <!-- Recent tables -->
    <div class="grid grid-2 section">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent Visitors</span>
          <a href="#/visitors" class="btn btn-ghost btn-sm">View all</a>
        </div>
        ${recentVisitors.length > 0
          ? `<div class="table-wrap"><table class="table">
              <thead><tr>
                <th>Visitor</th>
                <th>Company</th>
                <th>Sessions</th>
                <th>Last Seen</th>
              </tr></thead>
              <tbody>
                ${recentVisitors.map(v => `
                  <tr class="clickable" data-href="#/visitors/${encodeURIComponent(v.anonymous_id)}">
                    <td class="cell-mono cell-truncate">${utils.escapeHtml(v.anonymous_id)}</td>
                    <td>${utils.escapeHtml(v.company || '—')}</td>
                    <td>${(v.sessions || []).length}</td>
                    <td>${utils.timeAgo(v.last_seen)}</td>
                  </tr>`).join('')}
              </tbody>
            </table></div>`
          : `<div class="card-body">${ui.emptyState('No visitors yet', 'Set up the tracking pixel to start collecting data')}</div>`}
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent Leads</span>
          <a href="#/leads" class="btn btn-ghost btn-sm">View all</a>
        </div>
        ${recentLeads.length > 0
          ? `<div class="table-wrap"><table class="table">
              <thead><tr>
                <th>Visitor</th>
                <th>Score</th>
                <th>Intent</th>
                <th>Status</th>
              </tr></thead>
              <tbody>
                ${recentLeads.map(l => `
                  <tr class="clickable" data-href="#/leads/${l.id}">
                    <td class="cell-mono cell-truncate">${utils.escapeHtml(l.visitor_id)}</td>
                    <td><strong>${l.score}</strong></td>
                    <td>${ui.intentBadge(l.intent_level)}</td>
                    <td>${ui.statusBadge(l.status)}</td>
                  </tr>`).join('')}
              </tbody>
            </table></div>`
          : `<div class="card-body">${ui.emptyState('No leads yet', 'Leads are created automatically when visitor scores reach the threshold')}</div>`}
      </div>
    </div>`;
}

function _statCard(label, value, sub) {
  return `
    <div class="card stat-card">
      <div class="stat-label">${utils.escapeHtml(label)}</div>
      <div class="stat-value">${value}</div>
      ${sub ? `<div class="stat-sub">${utils.escapeHtml(sub)}</div>` : ''}
    </div>`;
}

// Handle clickable table rows
document.addEventListener('click', e => {
  const row = e.target.closest('tr[data-href]');
  if (row) {
    const href = row.dataset.href;
    window.location.hash = href;
  }
});
