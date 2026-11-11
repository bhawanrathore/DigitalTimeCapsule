/**
 * open.js — Cinematic capsule reveal page (true lock enforced)
 */

import { getCapsule } from '../utils/storage.js';
import { isUnlockable } from '../utils/timer.js';
import { unlockCapsule, THEMES } from '../utils/capsule.js';
import { launchConfetti, particleBurst, revealStagger, animatePageIn } from '../utils/animations.js';
import { showLightbox } from '../components/modal.js';
import { mountCountdown } from '../components/countdown.js';
import { formatDate, formatDateTime } from '../utils/timer.js';
import { navigate } from '../main.js';
import { toast } from '../components/toast.js';

export function renderOpen(container, id) {
  container.innerHTML = '';
  animatePageIn(container);

  const capsule = getCapsule(id);

  /* ---- Not found ---- */
  if (!capsule) {
    container.innerHTML = `
      <div class="reveal-page">
        <div class="reveal-content">
          <div class="empty-state">
            <div class="empty-state-icon">🕳️</div>
            <h2 class="empty-state-title">Capsule Not Found</h2>
            <p class="empty-state-text">This capsule may have been deleted or the link is invalid.</p>
            <button class="btn btn-primary" id="open-not-found-back">← Back to Vault</button>
          </div>
        </div>
      </div>
    `;
    container.querySelector('#open-not-found-back').addEventListener('click', () => navigate('/vault'));
    return;
  }

  const theme    = THEMES[capsule.theme] || THEMES.space;
  const unlockable = isUnlockable(capsule);

  /* ===== TRUE LOCK: not yet unlockable ===== */
  if (!unlockable && !capsule.isUnlocked) {
    renderSealedView(container, capsule, theme);
    return;
  }

  /* ===== UNLOCK + REVEAL ===== */
  const unlocked = unlockCapsule(id); // marks isUnlocked, sets openedAt
  renderRevealView(container, unlocked || capsule, theme, !unlocked?.isUnlocked);
}

/* ---- Sealed (locked) view ---- */
function renderSealedView(container, capsule, theme) {
  container.innerHTML = `
    <div class="reveal-page">
      <div class="reveal-content">
        <div class="reveal-header">
          <span class="reveal-seal-icon" style="filter:drop-shadow(0 0 24px hsl(260 70% 55% / 0.6))">${theme.icon}</span>
          <h1 class="reveal-title">${escHtml(capsule.title)}</h1>
          <div style="display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-5);border-radius:var(--radius-full);background:hsl(260 70% 55%/0.12);border:1px solid hsl(260 70% 55%/0.3);margin-bottom:var(--space-8);">
            <span>🔒</span>
            <span style="font-family:var(--font-display);font-size:var(--text-sm);color:var(--color-primary-glow);letter-spacing:.08em">SEALED</span>
          </div>
        </div>

        <div style="
          background:var(--color-surface);
          border:1px solid var(--color-border);
          border-radius:var(--radius-xl);
          padding:var(--space-10);
          margin-bottom:var(--space-8);
          display:flex;flex-direction:column;align-items:center;gap:var(--space-6);
        ">
          <p style="color:var(--color-text-muted);font-size:var(--text-base);">This capsule opens in</p>
          <div id="sealed-countdown"></div>
          <p style="color:var(--color-text-faint);font-size:var(--text-sm);">
            🗓️ Unlocks on <strong style="color:var(--color-gold)">${formatDateTime(capsule.unlocksAt)}</strong>
          </p>
        </div>

        <div style="
          background:hsl(260 70% 55% / 0.05);
          border:1px dashed hsl(260 70% 55% / 0.3);
          border-radius:var(--radius-lg);
          padding:var(--space-6);
          text-align:center;
          margin-bottom:var(--space-8);
        ">
          <p style="color:var(--color-text-muted);font-size:var(--text-sm);">
            🔐 This capsule is <strong style="color:var(--color-primary-glow)">true-locked</strong>.
            Its contents are hidden until the unlock date arrives.
            Come back then to reveal your memories.
          </p>
        </div>

        <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap">
          <button class="btn btn-outline" id="sealed-vault-btn">← Back to Vault</button>
          <button class="btn btn-ghost" id="sealed-home-btn">🏠 Home</button>
        </div>
      </div>
    </div>
  `;

  mountCountdown(
    container.querySelector('#sealed-countdown'),
    capsule.unlocksAt,
    () => {
      toast.info('🎉 Your capsule just unlocked! Refreshing…');
      setTimeout(() => renderOpen(container, capsule.id), 1000);
    }
  );

  container.querySelector('#sealed-vault-btn').addEventListener('click', () => navigate('/vault'));
  container.querySelector('#sealed-home-btn').addEventListener('click', () => navigate('/'));
}

/* ---- Reveal view ---- */
function renderRevealView(container, capsule, theme, isFirstOpen) {
  container.innerHTML = `
    <div class="reveal-page">
      <div class="reveal-content">
        <div class="reveal-header" id="reveal-header">
          <span class="reveal-seal-icon">
            <span id="reveal-anim-icon" style="display:inline-block;transition:transform 1s cubic-bezier(0.34,1.56,0.64,1)">🔒</span>
          </span>
          <h1 class="reveal-title">${escHtml(capsule.title)}</h1>
          <div style="display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-5);border-radius:var(--radius-full);background:hsl(42 90% 58%/0.15);border:1px solid hsl(42 90% 58%/0.4);">
            <span>${theme.icon}</span>
            <span style="font-family:var(--font-display);font-size:var(--text-sm);color:var(--color-gold);letter-spacing:.08em">${theme.label}</span>
          </div>
        </div>

        <div class="reveal-dates" id="reveal-dates">
          <div class="reveal-date-item">
            <div class="reveal-date-label">Created</div>
            <div class="reveal-date-value">${formatDate(capsule.createdAt)}</div>
          </div>
          <div class="reveal-date-item" style="border-left:1px solid var(--color-border);padding-left:var(--space-8)">
            <div class="reveal-date-label">Sealed for</div>
            <div class="reveal-date-value" style="color:var(--color-gold)">${sealedDuration(capsule.createdAt, capsule.unlocksAt)}</div>
          </div>
          <div class="reveal-date-item" style="border-left:1px solid var(--color-border);padding-left:var(--space-8)">
            <div class="reveal-date-label">Opened</div>
            <div class="reveal-date-value" style="color:var(--color-success)">${formatDate(capsule.openedAt)}</div>
          </div>
        </div>

        ${capsule.message ? `
        <div class="reveal-message-box" id="reveal-msg">
          <p class="reveal-message-text">${escHtml(capsule.message)}</p>
        </div>` : ''}

        ${capsule.images?.length ? `
        <div id="reveal-imgs">
          <h3 style="font-family:var(--font-display);font-size:var(--text-lg);color:var(--color-text);margin-bottom:var(--space-4);text-align:left;">
            📷 Memories (${capsule.images.length})
          </h3>
          <div class="reveal-images-grid">
            ${capsule.images.map((src, i) => `
              <div class="reveal-image-item" data-idx="${i}">
                <img src="${src}" alt="Memory ${i + 1}" loading="lazy" />
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <div class="reveal-actions" id="reveal-actions">
          <button class="btn btn-primary btn-lg" id="reveal-vault-btn">🔐 Back to Vault</button>
          <button class="btn btn-outline" id="reveal-new-btn">✨ Create Another</button>
        </div>
      </div>
    </div>
  `;

  /* ---- Image lightbox ---- */
  container.querySelectorAll('.reveal-image-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.idx);
      showLightbox(capsule.images[idx], `Memory ${idx + 1}`);
    });
  });

  container.querySelector('#reveal-vault-btn').addEventListener('click', () => navigate('/vault'));
  container.querySelector('#reveal-new-btn').addEventListener('click', () => navigate('/create'));

  /* ---- Cinematic entrance ---- */
  if (isFirstOpen) {
    // 1. Animate lock → open icon
    setTimeout(() => {
      const icon = container.querySelector('#reveal-anim-icon');
      if (icon) {
        icon.style.transform = 'scale(1.4) rotate(-15deg)';
        setTimeout(() => {
          icon.textContent = '🎉';
          icon.style.transform = 'scale(1) rotate(0deg)';
        }, 200);
      }
    }, 300);

    // 2. Stagger children
    setTimeout(() => {
      const content = container.querySelector('.reveal-content');
      if (content) revealStagger(content, 100);
    }, 500);

    // 3. Confetti + particle burst
    setTimeout(() => {
      launchConfetti(150);
      const rect = container.querySelector('.reveal-seal-icon')?.getBoundingClientRect();
      if (rect) particleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 30);
    }, 600);

    toast.success('🎉 Your time capsule is open!', 5000);
  }
}

function sealedDuration(createdAt, unlocksAt) {
  const ms    = new Date(unlocksAt) - new Date(createdAt);
  const days  = Math.round(ms / 86400000);
  const years = (ms / (365.25 * 86400000)).toFixed(1);
  if (days > 365) return `~${years} years`;
  if (days > 30)  return `${Math.round(days / 30.44)} months`;
  return `${days} day${days !== 1 ? 's' : ''}`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
