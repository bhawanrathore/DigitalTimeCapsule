/**
 * home.js — Dashboard page
 */

import { loadCapsules } from '../utils/storage.js';
import { isUnlockable } from '../utils/timer.js';
import { exportCapsules, importCapsules } from '../utils/storage.js';
import { createCapsuleCard } from '../components/capsule-card.js';
import { toast } from '../components/toast.js';
import { navigate } from '../main.js';
import { countUp, animatePageIn } from '../utils/animations.js';

export function renderHome(container) {
  container.innerHTML = '';
  animatePageIn(container);

  const capsules = loadCapsules();
  const total    = capsules.length;
  const sealed   = capsules.filter(c => !c.isUnlocked && !isUnlockable(c)).length;
  const opened   = capsules.filter(c => c.isUnlocked).length;
  const ready    = capsules.filter(c => !c.isUnlocked && isUnlockable(c)).length;
  const nextUnlock = capsules
    .filter(c => !c.isUnlocked && !isUnlockable(c))
    .sort((a, b) => new Date(a.unlocksAt) - new Date(b.unlocksAt))[0];

  /* ---- Hero ---- */
  const hero = document.createElement('section');
  hero.className = 'hero';
  hero.innerHTML = `
    <div class="hero-eyebrow">Your Personal Memory Vault</div>
    <h1 class="hero-title">
      Seal <span class="accent">Memories</span> Across Time
    </h1>
    <p class="hero-subtitle">
      Write to your future self. Attach images. Lock it with a date.
      Rediscover it when the moment arrives.
    </p>
    <div class="hero-actions">
      <button class="btn btn-gold btn-lg" id="hero-create-btn">✨ Create a Capsule</button>
      <button class="btn btn-outline btn-lg" id="hero-vault-btn">🔒 My Vault</button>
    </div>
  `;
  container.appendChild(hero);

  hero.querySelector('#hero-create-btn').addEventListener('click', () => navigate('/create'));
  hero.querySelector('#hero-vault-btn').addEventListener('click', () => navigate('/vault'));

  /* ---- Stats ---- */
  const statsSection = document.createElement('section');
  statsSection.style.cssText = 'padding: 0 var(--space-8) var(--space-10);';
  statsSection.innerHTML = `
    <div class="container">
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value" id="stat-total">0</div>
          <div class="stat-label">Total Capsules</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-sealed" style="color:var(--color-primary-glow)">0</div>
          <div class="stat-label">Sealed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-ready" style="color:var(--color-gold)">0</div>
          <div class="stat-label">Ready to Open</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-opened" style="color:var(--color-success)">0</div>
          <div class="stat-label">Opened</div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(statsSection);

  // Animate stat count-ups
  setTimeout(() => {
    countUp(statsSection.querySelector('#stat-total'),  0, total);
    countUp(statsSection.querySelector('#stat-sealed'), 0, sealed);
    countUp(statsSection.querySelector('#stat-ready'),  0, ready);
    countUp(statsSection.querySelector('#stat-opened'), 0, opened);
  }, 100);

  /* ---- Recent capsules ---- */
  const mainSection = document.createElement('section');
  mainSection.style.cssText = 'padding: 0 var(--space-8) var(--space-16);';

  const recent = [...capsules].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  if (total === 0) {
    mainSection.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">⏳</div>
          <h2 class="empty-state-title">No Capsules Yet</h2>
          <p class="empty-state-text">Your first time capsule is waiting to be born. What will you say to your future self?</p>
          <button class="btn btn-gold btn-lg" id="empty-create-btn">✨ Create Your First Capsule</button>
        </div>
      </div>
    `;
    mainSection.querySelector('#empty-create-btn').addEventListener('click', () => navigate('/create'));
  } else {
    mainSection.innerHTML = `
      <div class="container">
        <div class="section-header">
          <h2 class="section-title"><span class="title-icon">🕐</span> Recent Capsules</h2>
          <div style="display:flex;gap:var(--space-3)">
            <button class="btn btn-outline btn-sm" id="export-btn">📤 Export</button>
            <label class="btn btn-outline btn-sm" style="cursor:pointer">
              📥 Import
              <input type="file" id="import-input" accept=".json" style="display:none" />
            </label>
            <button class="btn btn-primary btn-sm" id="view-all-btn">View All →</button>
          </div>
        </div>
        <div class="capsule-grid" id="capsule-grid"></div>
      </div>
    `;

    const grid = mainSection.querySelector('#capsule-grid');
    const cleanups = [];
    for (const cap of recent) {
      const { el, cleanup } = createCapsuleCard(cap, () => renderHome(container));
      grid.appendChild(el);
      cleanups.push(cleanup);
    }

    mainSection.querySelector('#export-btn').addEventListener('click', () => {
      exportCapsules();
      toast.success('Capsules exported!');
    });

    mainSection.querySelector('#import-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const { added, skipped } = await importCapsules(file);
        toast.success(`Imported ${added} capsule${added !== 1 ? 's' : ''}${skipped ? ` (${skipped} skipped)` : ''}.`);
        renderHome(container);
      } catch {
        toast.error('Invalid backup file.');
      }
      e.target.value = '';
    });

    mainSection.querySelector('#view-all-btn').addEventListener('click', () => navigate('/vault'));
  }

  container.appendChild(mainSection);
}
