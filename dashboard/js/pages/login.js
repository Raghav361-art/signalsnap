/**
 * SignalSnap Dashboard — Login Page
 */

import api from '../api.js';
import ui from '../components.js';
import router from '../router.js';

let _mode = 'login'; // 'login' | 'register'

export function render() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <div class="login-card card">
        <div class="login-header">
          <div class="nav-brand-logo">S</div>
          <div class="login-title" id="login-title">Sign in to SignalSnap</div>
          <div class="login-subtitle" id="login-subtitle">Enter your credentials to continue</div>
        </div>
        <div class="card-body" id="login-form-container"></div>
        <div class="card-footer" style="text-align:center;">
          <button class="btn btn-ghost btn-sm" id="login-toggle" type="button">
            Don't have an account? Register
          </button>
        </div>
      </div>
    </div>`;

  _renderForm();

  document.getElementById('login-toggle').addEventListener('click', () => {
    _mode = _mode === 'login' ? 'register' : 'login';
    _renderForm();
  });
}

function _renderForm() {
  const container = document.getElementById('login-form-container');
  const title = document.getElementById('login-title');
  const subtitle = document.getElementById('login-subtitle');
  const toggle = document.getElementById('login-toggle');

  if (_mode === 'login') {
    title.textContent = 'Sign in to SignalSnap';
    subtitle.textContent = 'Enter your credentials to continue';
    toggle.textContent = "Don't have an account? Register";
    container.innerHTML = `
      <form id="login-form" novalidate>
        <div class="form-group">
          <label for="login-user">Username</label>
          <input class="input" type="text" id="login-user" autocomplete="username" required placeholder="admin" />
        </div>
        <div class="form-group">
          <label for="login-pass">Password</label>
          <input class="input" type="password" id="login-pass" autocomplete="current-password" required placeholder="••••••••" />
        </div>
        <div id="login-error" style="color:var(--color-danger);font-size:var(--text-sm);min-height:24px;margin-top:var(--space-2)"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;margin-top:var(--space-2)" id="login-btn">Sign in</button>
      </form>`;

    document.getElementById('login-form').addEventListener('submit', _handleLogin);
  } else {
    title.textContent = 'Create an account';
    subtitle.textContent = 'Register to start using SignalSnap';
    toggle.textContent = 'Already have an account? Sign in';
    container.innerHTML = `
      <form id="register-form" novalidate>
        <div class="form-group">
          <label for="reg-user">Username</label>
          <input class="input" type="text" id="reg-user" autocomplete="username" required placeholder="admin" />
        </div>
        <div class="form-group">
          <label for="reg-email">Email</label>
          <input class="input" type="email" id="reg-email" autocomplete="email" required placeholder="admin@example.com" />
        </div>
        <div class="form-group">
          <label for="reg-pass">Password</label>
          <input class="input" type="password" id="reg-pass" autocomplete="new-password" required placeholder="••••••••" />
        </div>
        <div id="login-error" style="color:var(--color-danger);font-size:var(--text-sm);min-height:24px;margin-top:var(--space-2)"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;margin-top:var(--space-2)" id="register-btn">Create account</button>
      </form>`;

    document.getElementById('register-form').addEventListener('submit', _handleRegister);
  }
}

async function _handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const username = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value;
    if (!username || !password) { errEl.textContent = 'All fields are required'; return; }
    await api.login(username, password);
    router.navigate('/overview');
  } catch (err) {
    errEl.textContent = err.message || 'Login failed';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
}

async function _handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Creating…';

  try {
    const username = document.getElementById('reg-user').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value;
    if (!username || !email || !password) { errEl.textContent = 'All fields are required'; return; }
    await api.register(username, email, password);
    // Auto-login after registration
    await api.login(username, password);
    router.navigate('/overview');
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create account';
  }
}
