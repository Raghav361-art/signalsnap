/**
 * SignalSnap Dashboard — API Client
 *
 * Centralised HTTP client. Every dashboard page uses this instead of raw fetch.
 *
 * Configuration:
 *   api.setBase('http://localhost:8000')  — set the backend URL
 *   api.setToken('...')                   — set the JWT bearer token
 */

const api = (() => {
  'use strict';

  let _base = localStorage.getItem('ss_api_base') || 'http://localhost:8000';
  let _token = localStorage.getItem('ss_token') || '';

  /* ---- config ---------------------------------------------------- */

  function setBase(url) {
    _base = url.replace(/\/+$/, '');
    localStorage.setItem('ss_api_base', _base);
  }

  function getBase() { return _base; }

  function setToken(t) {
    _token = t || '';
    if (_token) localStorage.setItem('ss_token', _token);
    else        localStorage.removeItem('ss_token');
  }

  function getToken() { return _token; }

  function clearAuth() {
    _token = '';
    localStorage.removeItem('ss_token');
  }

  function isAuthenticated() { return !!_token; }

  /* ---- core request --------------------------------------------- */

  async function request(method, path, { body, headers: extra } = {}) {
    const url = _base + path;
    const headers = { ...extra };

    if (_token) headers['Authorization'] = 'Bearer ' + _token;

    const opts = { method, headers };

    if (body !== undefined) {
      if (typeof body === 'string') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        opts.body = body;
      } else {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }

    let res;
    try {
      res = await fetch(url, opts);
    } catch (err) {
      throw { network: true, message: 'Network error — is the backend running?' };
    }

    if (res.status === 401) {
      clearAuth();
      window.dispatchEvent(new CustomEvent('ss:auth-expired'));
      throw { status: 401, message: 'Session expired' };
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw {
        status: res.status,
        message: (data && (data.detail || data.message)) || `HTTP ${res.status}`,
        data,
      };
    }

    return data;
  }

  /* ---- convenience ---------------------------------------------- */

  const get    = (path) => request('GET', path);
  const post   = (path, body) => request('POST', path, { body });
  const patch  = (path, body) => request('PATCH', path, { body });
  const del    = (path) => request('DELETE', path);

  /* ---- auth ----------------------------------------------------- */

  async function login(username, password) {
    const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const data = await request('POST', '/auth/token', { body });
    setToken(data.access_token);
    return data;
  }

  async function register(username, email, password) {
    return post('/auth/register', { username, email, password });
  }

  /* ---- typed endpoints ------------------------------------------ */

  const getStats       = () => get('/stats');
  const getVisitors    = () => get('/visitors');
  const getVisitor     = (anonId) => get('/visitors/' + encodeURIComponent(anonId));
  const getLeads       = () => get('/leads');
  const getLead        = (id) => get('/leads/' + id);
  const updateLeadStatus = (id, status) => patch('/leads/' + id + '/status', { status });
  const getHealth      = () => get('/health');

  async function trackEvents(events) {
    return post('/track', { events });
  }

  return {
    setBase, getBase, setToken, getToken, clearAuth, isAuthenticated,
    request, get, post, patch, del,
    login, register,
    getStats, getVisitors, getVisitor, getLeads, getLead,
    updateLeadStatus, getHealth, trackEvents,
  };
})();

export default api;
