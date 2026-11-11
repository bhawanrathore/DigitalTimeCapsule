/**
 * main.js — App bootstrap & hash-based router
 */

import './style.css';
import { renderHome }   from './pages/home.js';
import { renderCreate } from './pages/create.js';
import { renderVault }  from './pages/vault.js';
import { renderOpen }   from './pages/open.js';

/* ---- Navbar ---- */
function renderNavbar() {
  const existing = document.getElementById('dtc-navbar');
  if (existing) return; // only create once

  const nav = document.createElement('nav');
  nav.id = 'dtc-navbar';
  nav.className = 'navbar';
  nav.innerHTML = `
    <div class="navbar-brand" id="nav-brand">
      <span class="brand-icon">⏳</span>
      <span>DigitalTimeCapsule</span>
    </div>
    <div class="navbar-links">
      <button class="nav-btn nav-btn-ghost" id="nav-home">Home</button>
      <button class="nav-btn nav-btn-ghost" id="nav-vault">🔐 Vault</button>
      <button class="nav-btn nav-btn-primary" id="nav-create">✨ New Capsule</button>
    </div>
  `;

  document.getElementById('app').before(nav);

  nav.querySelector('#nav-brand').addEventListener('click',  () => navigate('/'));
  nav.querySelector('#nav-home').addEventListener('click',   () => navigate('/'));
  nav.querySelector('#nav-vault').addEventListener('click',  () => navigate('/vault'));
  nav.querySelector('#nav-create').addEventListener('click', () => navigate('/create'));
}

/* ---- Router ---- */
export function navigate(path) {
  history.pushState(null, '', path.startsWith('#') ? path : `#${path}`);
  route();
}

function route() {
  const hash = location.hash.replace('#', '') || '/';
  const app  = document.getElementById('app');

  // Clean up any active countdown timers stored on the container
  app.__cleanups?.forEach(fn => fn());
  app.__cleanups = [];

  if (hash === '/' || hash === '') {
    renderHome(app);
  } else if (hash === '/create') {
    renderCreate(app);
  } else if (hash === '/vault') {
    renderVault(app);
  } else if (hash.startsWith('/open/')) {
    const id = hash.replace('/open/', '');
    renderOpen(app, id);
  } else {
    // 404 fallback
    app.innerHTML = `
      <div class="empty-state" style="min-height:80vh">
        <div class="empty-state-icon">🌌</div>
        <h2 class="empty-state-title">Lost in Time</h2>
        <p class="empty-state-text">This page doesn't exist in any timeline.</p>
        <button class="btn btn-primary" onclick="navigate('/')">← Go Home</button>
      </div>
    `;
  }
}

/* ---- Init ---- */
renderNavbar();
window.addEventListener('popstate', route);
window.navigate = navigate; // expose for inline onclick fallbacks
route();
