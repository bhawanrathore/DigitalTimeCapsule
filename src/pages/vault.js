/**
 * vault.js — The sealed capsule gallery (true lock enforced)
 */

import { loadCapsules, exportCapsules, importCapsules } from '../utils/storage.js';
import { isUnlockable } from '../utils/timer.js';
import { createCapsuleCard } from '../components/capsule-card.js';
import { toast } from '../components/toast.js';
import { navigate } from '../main.js';
import { animatePageIn } from '../utils/animations.js';

export function renderVault(container) {
  container.innerHTML = '';
  animatePageIn(container);

  let activeFilter = 'all';

  /* ---- Page shell ---- */
  const shell = document.createElement('div');
  shell.innerHTML = `
    <div style="padding:var(--space-10) var(--space-8) var(--space-20);">
      <div class="container">

        <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-8);">
          <button class="btn btn-ghost btn-sm" id="vault-back-btn">← Home</button>
        </div>

        <div class="section-header">
          <h1 class="section-title" style="font-size:var(--text-3xl)">
            <span class="title-icon">🔐</span> The Vault
          </h1>
          <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" id="vault-export-btn">📤 Export</button>
            <label class="btn btn-outline btn-sm" style="cursor:pointer">
              📥 Import
              <input type="file" id="vault-import-input" accept=".json" style="display:none" />
            </label>
            <button class="btn btn-gold btn-sm" id="vault-create-btn">✨ New Capsule</button>
          </div>
        </div>

        <div style="margin-bottom:var(--space-6);">
          <div class="filter-tabs" id="filter-tabs">
            <button class="filter-tab active" data-filter="all">All</button>
            <button class="filter-tab" data-filter="sealed">🔒 Sealed</button>
            <button class="filter-tab" data-filter="ready">🔓 Ready</button>
            <button class="filter-tab" data-filter="opened">✨ Opened</button>
          </div>
        </div>

        <div class="capsule-grid" id="vault-grid"></div>
      </div>
    </div>
  `;
  container.appendChild(shell);

  shell.querySelector('#vault-back-btn').addEventListener('click', () => navigate('/'));
  shell.querySelector('#vault-create-btn').addEventListener('click', () => navigate('/create'));

  shell.querySelector('#vault-export-btn').addEventListener('click', () => {
    exportCapsules();
    toast.success('Capsules exported!');
  });

  shell.querySelector('#vault-import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { added, skipped } = await importCapsules(file);
      toast.success(`Imported ${added} capsule${added !== 1 ? 's' : ''}${skipped ? ` (${skipped} skipped)` : ''}.`);
      renderGrid();
    } catch {
      toast.error('Invalid backup file.');
    }
    e.target.value = '';
  });

  /* ---- Filter tabs ---- */
  shell.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      shell.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      renderGrid();
    });
  });

  /* ---- Grid render ---- */
  const renderGrid = () => {
    const grid = shell.querySelector('#vault-grid');
    grid.innerHTML = '';

    const all       = loadCapsules();
    const filtered  = all.filter(c => {
      if (activeFilter === 'all')    return true;
      if (activeFilter === 'sealed') return !c.isUnlocked && !isUnlockable(c);
      if (activeFilter === 'ready')  return !c.isUnlocked && isUnlockable(c);
      if (activeFilter === 'opened') return c.isUnlocked;
      return true;
    });

    // Sort: ready first, then sealed by soonest unlock, then opened by most recent
    filtered.sort((a, b) => {
      const aReady   = !a.isUnlocked && isUnlockable(a);
      const bReady   = !b.isUnlocked && isUnlockable(b);
      if (aReady && !bReady)  return -1;
      if (!aReady && bReady)  return  1;
      if (!a.isUnlocked && !b.isUnlocked) return new Date(a.unlocksAt) - new Date(b.unlocksAt);
      return new Date(b.openedAt || 0) - new Date(a.openedAt || 0);
    });

    if (filtered.length === 0) {
      const labels = { all: 'No capsules yet', sealed: 'No sealed capsules', ready: 'None ready to open', opened: 'No opened capsules yet' };
      const descs  = {
        all:    'Your vault is empty. Create your first capsule!',
        sealed: 'All caught up — none are waiting.',
        ready:  'No capsules have reached their unlock date.',
        opened: 'You haven\'t opened any capsules yet.',
      };
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">${activeFilter === 'opened' ? '✨' : '🔒'}</div>
          <h3 class="empty-state-title">${labels[activeFilter]}</h3>
          <p class="empty-state-text">${descs[activeFilter]}</p>
          ${activeFilter === 'all' ? `<button class="btn btn-gold" id="vault-empty-create">✨ Create First Capsule</button>` : ''}
        </div>
      `;
      grid.querySelector('#vault-empty-create')?.addEventListener('click', () => navigate('/create'));
      return;
    }

    for (const cap of filtered) {
      const { el } = createCapsuleCard(cap, renderGrid);
      grid.appendChild(el);
    }
  };

  renderGrid();
}
