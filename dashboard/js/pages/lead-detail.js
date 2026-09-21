/**
 * SignalSnap Dashboard — Lead Detail Page
 */

import api from '../api.js';
import ui from '../components.js';
import utils from '../utils.js';

const STATUSES = ['new', 'contacted', 'qualified', 'lost'];

export async function render({ id }) {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div class="flex items-center gap-3">
        <a href="#/leads" class="btn btn-ghost btn-icon btn-sm" aria-label="Back">${ui.icon('back')}</a>
        <div>
          <h1 class="page-title">Lead #${utils.escapeHtml(String(id))}</h1>
        </div>
      </div>
    </div>
    <div class="page-content" id="lead-detail-body">${ui.loading('Loading lead…')}</div>`;

  _load(id);
}

async function _load(id) {
  const body = document.getElementById('lead-detail-body');
  if (!body) return;

  try {
    const lead = await api.getLead(id);
    body.innerHTML = _renderDetail(lead, id);
    _bindStatusButtons(id);
  } catch (err) {
    body.innerHTML = ui.errorPanel(err);
    const retryBtn = body.querySelector('.error-panel button');
    if (retryBtn) retryBtn.addEventListener('click', () => _load(id));
  }
}

function _renderDetail(lead, id) {
  const v = lead.visitor || {};
  const sessions = (v.sessions || []).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  const events = (v.events || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Score gauge
  const scoreMax = 50;
  const scorePct = Math.min(100, Math.max(0, (lead.score / scoreMax) * 100));
  let scoreColor = 'var(--color-intent-low)';
  if (lead.score >= 20) scoreColor = 'var(--color-intent-high)';
  else if (lead.score >= 10) scoreColor = 'var(--color-intent-medium)';

  return `
    <div class="detail-grid">
      <!-- Sidebar -->
      <div class="detail-sidebar">
        <!-- Score card -->
        <div class="card">
          <div class="card-body" style="text-align:center;padding:var(--space-6)">
            <div class="score-gauge">
              <svg class="score-gauge-svg" viewBox="0 0 100 60">
                <path class="score-gauge-arc score-gauge-bg" d="M 10 55 A 40 40 0 0 1 90 55" stroke-width="8" fill="none" stroke="var(--color-bg-tertiary)"/>
                <path class="score-gauge-arc score-gauge-fill" d="M 10 55 A 40 40 0 0 1 90 55" stroke-width="8" fill="none" stroke="${scoreColor}"
                  stroke-dasharray="${(scorePct / 100) * 126} 126" />
              </svg>
              <div class="score-gauge-value">${lead.score}</div>
              <div class="score-gauge-label">Intent Score</div>
            </div>
            <div style="margin-top:var(--space-3)">${ui.intentBadge(lead.intent_level)}</div>
          </div>
        </div>

        <!-- Lead info -->
        <div class="card">
          <div class="card-header"><span class="card-title">Lead Info</span></div>
          <div class="card-body">
            <div class="meta-list">
              <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${ui.statusBadge(lead.status)}</span></div>
              <div class="meta-item"><span class="meta-label">Created</span><span class="meta-value">${utils.formatDateTime(lead.created_at)}</span></div>
              <div class="meta-item"><span class="meta-label">Visitor</span><span class="meta-value"><a href="#/visitors/${encodeURIComponent(lead.visitor_id)}" class="cell-mono" style="font-size:var(--text-xs)">${utils.escapeHtml(lead.visitor_id)}</a></span></div>
              <div class="meta-item"><span class="meta-label">Company</span><span class="meta-value">${utils.escapeHtml(v.company || '—')}</span></div>
              <div class="meta-item"><span class="meta-label">Country</span><span class="meta-value">${utils.escapeHtml(v.country || '—')}</span></div>
              <div class="meta-item"><span class="meta-label">IP</span><span class="meta-value cell-mono">${utils.escapeHtml(v.ip || '—')}</span></div>
            </div>
          </div>
        </div>

        <!-- Status actions -->
        <div class="card">
          <div class="card-header"><span class="card-title">Change Status</span></div>
          <div class="card-body">
            <div class="flex flex-wrap gap-2" id="status-buttons">
              ${STATUSES.map(s => `
                <button class="btn ${lead.status === s ? 'btn-primary' : 'btn-secondary'} btn-sm"
                        data-set-status="${s}" ${lead.status === s ? 'disabled' : ''}>
                  ${s}
                </button>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Main -->
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
          <div class="card-header"><span class="card-title">Visitor Activity (${events.length})</span></div>
          <div class="card-body">
            ${events.length > 0 ? `
              <div class="timeline">
                ${events.slice(0, 80).map(e => `
                  <div class="timeline-item" data-type="${utils.escapeHtml(e.type)}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <div class="flex items-center gap-2" style="margin-bottom:2px">
                        ${ui.eventTypeBadge(e.type)}
                        <span class="timeline-time">${utils.formatDateTime(e.timestamp)}</span>
                      </div>
                      <div style="font-size:var(--text-xs);color:var(--color-text-secondary);word-break:break-all">${utils.escapeHtml(utils.pathFromUrl(e.page))}</div>
                      ${e.metadata_ && Object.keys(e.metadata_).length > 0 ? `<div class="code" style="margin-top:4px;display:inline-block">${utils.escapeHtml(JSON.stringify(e.metadata_))}</div>` : ''}
                      ${e.metadata && Object.keys(e.metadata).length > 0 ? `<div class="code" style="margin-top:4px;display:inline-block">${utils.escapeHtml(JSON.stringify(e.metadata))}</div>` : ''}
                    </div>
                  </div>`).join('')}
              </div>`
            : ui.emptyState('No activity')}
          </div>
        </div>
      </div>
    </div>`;
}

function _bindStatusButtons(id) {
  document.querySelectorAll('[data-set-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.setStatus;
      btn.disabled = true;
      btn.textContent = 'Updating…';

      try {
        await api.updateLeadStatus(id, newStatus);
        ui.toast(`Status changed to ${newStatus}`, 'success');
        _load(id); // Reload to reflect changes
      } catch (err) {
        ui.toast(err.message || 'Failed to update', 'error');
        btn.disabled = false;
        btn.textContent = newStatus;
      }
    });
  });
}
