/**
 * SignalSnap Dashboard — Tracking Tester Page
 *
 * Developer tool: compose and send real tracking events, inspect responses.
 */

import api from '../api.js';
import ui from '../components.js';
import utils from '../utils.js';

let _log = [];

export function render() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Tracking Tester</h1>
        <div class="page-subtitle">Send real events to the tracking API and inspect responses</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-ghost btn-sm" id="tester-clear">Clear log</button>
      </div>
    </div>
    <div class="page-content">
      <div class="grid grid-2">
        <!-- Compose -->
        <div class="card">
          <div class="card-header"><span class="card-title">Compose Event</span></div>
          <div class="card-body">
            <form id="tester-form" novalidate>
              <div class="form-group">
                <label for="tester-type">Event Type</label>
                <select class="input select" id="tester-type">
                  <option value="page_view">page_view</option>
                  <option value="button_click">button_click</option>
                  <option value="form_submit">form_submit</option>
                  <option value="custom">custom</option>
                </select>
              </div>
              <div class="form-group">
                <label for="tester-page">Page URL</label>
                <input class="input" type="text" id="tester-page" value="https://example.com/pricing" />
              </div>
              <div class="form-group">
                <label for="tester-anon">Anonymous ID</label>
                <input class="input" type="text" id="tester-anon" placeholder="v_test-123" />
              </div>
              <div class="form-group">
                <label for="tester-session">Session ID</label>
                <input class="input" type="text" id="tester-session" placeholder="s_test-456" />
              </div>
              <div class="form-group">
                <label for="tester-meta">Metadata (JSON)</label>
                <textarea class="input" id="tester-meta" rows="3" placeholder='{"key": "value"}'>{}</textarea>
              </div>
              <div id="tester-error" style="color:var(--color-danger);font-size:var(--text-sm);min-height:20px;margin-top:var(--space-2)"></div>
              <button class="btn btn-primary" type="submit" style="width:100%;margin-top:var(--space-3)" id="tester-send">
                ${ui.icon('play')} Send Event
              </button>
            </form>

            <div class="divider"></div>
            <div style="font-size:var(--text-xs);color:var(--color-text-tertiary)">
              <strong>Quick templates:</strong>
            </div>
            <div class="flex flex-wrap gap-2" style="margin-top:var(--space-2)">
              <button class="btn btn-ghost btn-sm" data-template="pricing">Pricing Visit</button>
              <button class="btn btn-ghost btn-sm" data-template="signup">Signup Click</button>
              <button class="btn btn-ghost btn-sm" data-template="form">Form Submit</button>
              <button class="btn btn-ghost btn-sm" data-template="multi">Multi-Page Session</button>
            </div>
          </div>
        </div>

        <!-- Log -->
        <div class="card">
          <div class="card-header"><span class="card-title">Request Log</span></div>
          <div class="card-body" style="padding:0">
            <div class="tester-log" id="tester-log">
              ${_log.length === 0
                ? `<div class="empty-state" style="padding:var(--space-8)">
                    <div class="empty-state-icon">${ui.icons.code}</div>
                    <div class="empty-state-title" style="font-size:var(--text-sm)">No requests yet</div>
                    <div class="empty-state-desc">Send an event to see the request and response here</div>
                  </div>`
                : _log.map(_renderEntry).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;

  _setDefaults();
  _bindEvents();
}

function _setDefaults() {
  const anonInput = document.getElementById('tester-anon');
  const sessionInput = document.getElementById('tester-session');
  if (anonInput && !anonInput.value) anonInput.value = 'v_test-' + Math.random().toString(36).slice(2, 8);
  if (sessionInput && !sessionInput.value) sessionInput.value = 's_test-' + Math.random().toString(36).slice(2, 8);
}

function _bindEvents() {
  document.getElementById('tester-form').addEventListener('submit', _handleSend);
  document.getElementById('tester-clear').addEventListener('click', () => {
    _log = [];
    render();
  });

  document.querySelectorAll('[data-template]').forEach(btn => {
    btn.addEventListener('click', () => _applyTemplate(btn.dataset.template));
  });
}

function _applyTemplate(name) {
  const type = document.getElementById('tester-type');
  const page = document.getElementById('tester-page');
  const meta = document.getElementById('tester-meta');

  switch (name) {
    case 'pricing':
      type.value = 'page_view';
      page.value = 'https://example.com/pricing';
      meta.value = '{"referrer": "google"}';
      break;
    case 'signup':
      type.value = 'button_click';
      page.value = 'https://example.com/pricing';
      meta.value = '{"label": "signup-cta", "plan": "pro"}';
      break;
    case 'form':
      type.value = 'form_submit';
      page.value = 'https://example.com/contact';
      meta.value = '{"form": "contact-us"}';
      break;
    case 'multi':
      _sendMultiPage();
      return;
  }
}

async function _sendMultiPage() {
  const anonId = document.getElementById('tester-anon').value.trim() || 'v_test-' + Math.random().toString(36).slice(2, 8);
  const sessionId = document.getElementById('tester-session').value.trim() || 's_test-' + Math.random().toString(36).slice(2, 8);

  const pages = [
    { page: 'https://example.com/', metadata: { referrer: 'google' } },
    { page: 'https://example.com/features', metadata: {} },
    { page: 'https://example.com/pricing', metadata: {} },
    { page: 'https://example.com/pricing', metadata: { action: 'scroll-to-plans' } },
    { page: 'https://example.com/contact', metadata: {} },
  ];

  const events = pages.map((p, i) => ({
    type: i === 3 ? 'button_click' : 'page_view',
    page: p.page,
    timestamp: Date.now() - (pages.length - i) * 30000,
    anonymous_id: anonId,
    session_id: sessionId,
    ...(Object.keys(p.metadata).length > 0 ? { metadata: p.metadata } : {}),
  }));

  await _sendEvents(events);
}

async function _handleSend(e) {
  e.preventDefault();
  const errEl = document.getElementById('tester-error');
  errEl.textContent = '';

  const type = document.getElementById('tester-type').value;
  const page = document.getElementById('tester-page').value.trim();
  const anonId = document.getElementById('tester-anon').value.trim();
  const sessionId = document.getElementById('tester-session').value.trim();
  const metaStr = document.getElementById('tester-meta').value.trim();

  if (!type || !page || !anonId || !sessionId) {
    errEl.textContent = 'All fields are required';
    return;
  }

  let metadata = null;
  if (metaStr && metaStr !== '{}') {
    try { metadata = JSON.parse(metaStr); } catch {
      errEl.textContent = 'Invalid JSON in metadata';
      return;
    }
  }

  const event = {
    type,
    page,
    timestamp: Date.now(),
    anonymous_id: anonId,
    session_id: sessionId,
  };
  if (metadata && Object.keys(metadata).length > 0) event.metadata = metadata;

  await _sendEvents([event]);
}

async function _sendEvents(events) {
  const btn = document.getElementById('tester-send');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

  const entry = {
    time: new Date().toISOString(),
    request: { events },
    response: null,
    error: null,
    status: null,
  };

  try {
    const resp = await api.trackEvents(events);
    entry.response = resp;
    entry.status = 200;
  } catch (err) {
    entry.error = err;
    entry.status = err.status || 0;
  }

  _log.unshift(entry);

  // Update log display
  const logEl = document.getElementById('tester-log');
  if (logEl) logEl.innerHTML = _log.map(_renderEntry).join('');

  if (btn) { btn.disabled = false; btn.innerHTML = `${ui.icon('play')} Send Event`; }
}

function _renderEntry(entry) {
  const isOk = entry.status >= 200 && entry.status < 300;
  return `
    <div class="tester-entry">
      <div>
        <span class="tester-entry-time">${utils.formatTime(entry.time)}</span>
        <span class="tester-entry-method">POST /track</span>
        <span class="tester-entry-status ${isOk ? 'ok' : 'err'}">${entry.status || 'ERR'}</span>
        <span style="color:var(--color-text-tertiary);margin-left:var(--space-2)">${entry.request.events.length} event(s)</span>
      </div>
      <details>
        <summary style="cursor:pointer;font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:4px">Show details</summary>
        <div class="tester-detail">
<strong>Request:</strong>
${utils.escapeHtml(JSON.stringify(entry.request, null, 2))}

<strong>Response:</strong>
${utils.escapeHtml(JSON.stringify(entry.response || entry.error, null, 2))}
        </div>
      </details>
    </div>`;
}
