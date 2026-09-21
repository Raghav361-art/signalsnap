/**
 * SignalSnap Dashboard — Visitor Detail Page
 */

import api from '../api.js';
import ui from '../components.js';
import utils from '../utils.js';

export async function render({ id }) {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <a href="#/visitors" class="btn btn-ghost btn-icon btn-sm" aria-label="Back">${ui.icon('back')}</a>
        <div>
          <h1 class="page-title">Visitor Detail</h1>
          <div class="page-subtitle cell-mono">${utils.escapeHtml(id)}</div>
        </div>
      </div>
    </div>
    <div class="page-content" id="visitor-detail-body">${ui.loading('Loading visitor…')}</div>`;

  _load(id);
}

async function _load(id) {
  const body = document.getElementById('visitor-detail-body');
  if (!body) return;

  try {
    const visitor = await api.getVisitor(id);
    body.innerHTML = _renderDetail(visitor);
  } catch (err) {
    body.innerHTML = ui.errorPanel(err);
    const retryBtn = body.querySelector('.error-panel button');
    if (retryBtn) retryBtn.addEventListener('click', () => _load(id));
  }
}

function _renderDetail(v) {
  const sessions = (v.sessions || []).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  const events = (v.events || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const leads = v.leads || [];

  // Derived metrics
  const totalDuration = sessions.reduce((s, ses) => s + (ses.duration || 0), 0);
  const totalPages = sessions.reduce((s, ses) => s + (ses.page_count || 0), 0);
  const eventTypes = {};
  events.forEach(e => { eventTypes[e.type] = (eventTypes[e.type] || 0) + 1; });

  return `
    <div class="detail-grid">
      <!-- Sidebar -->
      <div class="detail-sidebar">
        <div class="card">
          <div class="card-header"><span class="card-title">Visitor Info</span></div>
          <div class="card-body">
            <div class="meta-list">
              <div class="meta-item"><span class="meta-label">Anonymous ID</span><span class="meta-value code">${utils.escapeHtml(v.anonymous_id)}</span></div>
              <div class="meta-item"><span class="meta-label">IP Address</span><span class="meta-value cell-mono">${utils.escapeHtml(v.ip || '—')}</span></div>
              <div class="meta-item"><span class="meta-label">Company</span><span class="meta-value">${utils.escapeHtml(v.company || '—')}</span></div>
              <div class="meta-item"><span class="meta-label">Country</span><span class="meta-value">${utils.escapeHtml(v.country || '—')}</span></div>
              <div class="meta-item"><span class="meta-label">First Seen</span><span class="meta-value">${utils.formatDateTime(v.first_seen)}</span></div>
              <div class="meta-item"><span class="meta-label">Last Seen</span><span class="meta-value">${utils.timeAgo(v.last_seen)}</span></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Summary</span></div>
          <div class="card-body">
            <div class="meta-list">
              <div class="meta-item"><span class="meta-label">Sessions</span><span class="meta-value">${sessions.length}</span></div>
              <div class="meta-item"><span class="meta-label">Events</span><span class="meta-value">${events.length}</span></div>
              <div class="meta-item"><span class="meta-label">Total Duration</span><span class="meta-value">${utils.formatDuration(totalDuration)}</span></div>
              <div class="meta-item"><span class="meta-label">Pages Viewed</span><span class="meta-value">${totalPages}</span></div>
              <div class="meta-item"><span class="meta-label">Leads</span><span class="meta-value">${leads.length}</span></div>
            </div>
          </div>
        </div>

        ${leads.length > 0 ? `
        <div class="card">
          <div class="card-header"><span class="card-title">Associated Leads</span></div>
          <div class="card-body" style="padding:0">
            ${leads.map(l => `
              <a href="#/leads/${l.id}" class="meta-item" style="padding:var(--space-3) var(--space-5);text-decoration:none;display:flex;border-bottom:1px solid var(--color-border-light)">
                <span style="flex:1">${ui.intentBadge(l.intent_level)} <strong style="margin-left:var(--space-2)">Score: ${l.score}</strong></span>
                ${ui.statusBadge(l.status)}
              </a>`).join('')}
          </div>
        </div>` : ''}

        ${Object.keys(eventTypes).length > 0 ? `
        <div class="card">
          <div class="card-header"><span class="card-title">Event Types</span></div>
          ${ui.barChart(eventTypes)}
        </div>` : ''}
      </div>

      <!-- Main content -->
      <div class="detail-main">
        <!-- Sessions -->
        <div class="card">
          <div class="card-header"><span class="card-title">Sessions (${sessions.length})</span></div>
          ${sessions.length > 0 ? `
            <div class="table-wrap">
              <table class="table">
                <thead><tr>
                  <th>Session ID</th>
                  <th>Start</th>
                  <th>Duration</th>
                  <th>Pages</th>
                </tr></thead>
                <tbody>
                  ${sessions.map(s => `
                    <tr>
                      <td class="cell-mono cell-truncate" style="max-width:200px">${utils.escapeHtml(s.session_id)}</td>
                      <td>${utils.formatDateTime(s.start_time)}</td>
                      <td>${utils.formatDuration(s.duration)}</td>
                      <td>${s.page_count}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`
          : `<div class="card-body">${ui.emptyState('No sessions')}</div>`}
        </div>

        <!-- Activity Timeline -->
        <div class="card">
          <div class="card-header"><span class="card-title">Activity Timeline (${events.length})</span></div>
          <div class="card-body">
            ${events.length > 0 ? `
              <div class="timeline">
                ${events.slice(0, 100).map(e => `
                  <div class="timeline-item" data-type="${utils.escapeHtml(e.type)}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <div class="flex items-center gap-2" style="margin-bottom:2px">
                        ${ui.eventTypeBadge(e.type)}
                        <span class="timeline-time">${utils.formatDateTime(e.timestamp)}</span>
                      </div>
                      ${(e.metadata || e.metadata_) && Object.keys(e.metadata || e.metadata_).length > 0 ? `<div class="code" style="margin-top:4px;display:inline-block">${utils.escapeHtml(JSON.stringify(e.metadata || e.metadata_))}</div>` : ''}
                    </div>
                  </div>`).join('')}
              </div>
              ${events.length > 100 ? `<div style="text-align:center;padding:var(--space-3);color:var(--color-text-tertiary);font-size:var(--text-xs)">Showing first 100 of ${events.length} events</div>` : ''}`
            : ui.emptyState('No activity yet')}
          </div>
        </div>
      </div>
    </div>`;
}
