/**
 * capsule-card.js — Reusable capsule card component
 */

import { THEMES } from '../utils/capsule.js';
import { isUnlockable, getTimeRemaining, formatDate } from '../utils/timer.js';
import { mountCountdown } from './countdown.js';
import { deleteCapsule } from '../utils/storage.js';
import { showModal } from './modal.js';
import { toast } from './toast.js';
import { navigate } from '../main.js';

/**
 * Create a capsule card DOM element.
 * @param {object} capsule
 * @param {function} [onDelete]  — called after deletion
 * @returns {{ el: HTMLElement, cleanup: function }}
 */
export function createCapsuleCard(capsule, onDelete) {
  const theme       = THEMES[capsule.theme] || THEMES.space;
  const unlockable  = isUnlockable(capsule);
  const remaining   = getTimeRemaining(capsule.unlocksAt);

  const wrapper = document.createElement('div');
  wrapper.className = 'capsule-card';
  wrapper.setAttribute('data-theme', capsule.theme);
  wrapper.setAttribute('data-capsule-id', capsule.id);

  /* ---- Badge ---- */
  let badgeHTML = '';
  if (capsule.isUnlocked) {
    badgeHTML = `<span class="badge badge-opened">✨ Opened</span>`;
  } else if (unlockable) {
    badgeHTML = `<span class="badge badge-ready">🔓 Ready!</span>`;
  } else {
    badgeHTML = `<span class="badge badge-sealed">🔒 Sealed</span>`;
  }

  /* ---- Image count indicator ---- */
  const imgCount = capsule.images?.length || 0;
  const imgBadge = imgCount > 0
    ? `<span style="font-size:var(--text-xs);color:var(--color-text-muted);">📷 ${imgCount} image${imgCount > 1 ? 's' : ''}</span>`
    : '';

  wrapper.innerHTML = `
    <div class="capsule-card-inner">
      <div class="capsule-card-header">
        <div>
          ${badgeHTML}
          <h3 class="capsule-card-title" style="margin-top:var(--space-2)">${escHtml(capsule.title)}</h3>
        </div>
        <div class="capsule-card-theme-icon" title="${theme.label}">${theme.icon}</div>
      </div>

      <div class="capsule-card-meta">
        <div class="capsule-card-date">
          <span>📅 Created ${formatDate(capsule.createdAt)}</span>
        </div>
        <div class="capsule-card-date">
          <span>🗓️ Opens ${formatDate(capsule.unlocksAt)}</span>
        </div>
        ${imgBadge}
        <div class="capsule-card-countdown" id="countdown-${capsule.id}"></div>
      </div>

      <div class="capsule-card-actions">
        ${unlockable || capsule.isUnlocked
          ? `<button class="btn btn-gold btn-sm" id="open-btn-${capsule.id}">✨ Open Capsule</button>`
          : `<button class="btn btn-outline btn-sm" disabled>🔒 Sealed</button>`
        }
        <button class="btn btn-danger btn-icon btn-sm" id="del-btn-${capsule.id}" title="Delete capsule" style="margin-left:auto">🗑️</button>
      </div>
    </div>
  `;

  /* ---- Live countdown ---- */
  const countdownEl = wrapper.querySelector(`#countdown-${capsule.id}`);
  let cleanupTimer  = () => {};

  if (!capsule.isUnlocked) {
    cleanupTimer = mountCountdown(countdownEl, capsule.unlocksAt, () => {
      // When timer expires, refresh the card's badge + button
      wrapper.querySelector('.badge').outerHTML = `<span class="badge badge-ready">🔓 Ready!</span>`;
      const actions = wrapper.querySelector('.capsule-card-actions');
      const oldBtn  = actions.querySelector('button:first-child');
      if (oldBtn) {
        oldBtn.className = 'btn btn-gold btn-sm';
        oldBtn.disabled = false;
        oldBtn.textContent = '✨ Open Capsule';
        oldBtn.id = `open-btn-${capsule.id}`;
        attachOpenHandler(oldBtn, capsule.id);
      }
    });
  } else {
    countdownEl.innerHTML = `<span style="color:var(--color-success);font-size:var(--text-xs);">✨ Opened ${formatDate(capsule.openedAt)}</span>`;
  }

  /* ---- Button handlers ---- */
  const openBtn = wrapper.querySelector(`#open-btn-${capsule.id}`);
  if (openBtn) attachOpenHandler(openBtn, capsule.id);

  wrapper.querySelector(`#del-btn-${capsule.id}`).addEventListener('click', (e) => {
    e.stopPropagation();
    showModal({
      title: 'Delete Capsule?',
      body: `"<strong>${escHtml(capsule.title)}</strong>" will be permanently deleted. This cannot be undone.`,
      confirmText: 'Delete Forever',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        cleanupTimer();
        deleteCapsule(capsule.id);
        wrapper.style.transition = 'opacity 300ms ease, transform 300ms ease';
        wrapper.style.opacity = '0';
        wrapper.style.transform = 'scale(0.9)';
        setTimeout(() => { wrapper.remove(); onDelete?.(); }, 300);
        toast.success('Capsule deleted.');
      },
    });
  });

  /* ---- Click entire card to open (if ready) ---- */
  wrapper.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    if (isUnlockable(capsule) || capsule.isUnlocked) navigate(`/open/${capsule.id}`);
  });

  return { el: wrapper, cleanup: cleanupTimer };
}

function attachOpenHandler(btn, id) {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    navigate(`/open/${id}`);
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
