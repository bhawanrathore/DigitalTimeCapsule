/**
 * countdown.js — Live countdown timer component
 * Renders into a given container element and cleans up its interval on unmount.
 */

import { startCountdown, pad2 } from '../utils/timer.js';

/**
 * Mount a live countdown into `el`.
 * @param {HTMLElement} el  — container to render into
 * @param {string} targetDateISO
 * @param {function} [onExpire]  — called when timer reaches 0
 * @returns {function} cleanup  — call to stop the interval
 */
export function mountCountdown(el, targetDateISO, onExpire) {
  const render = (remaining) => {
    if (!remaining) {
      el.innerHTML = `
        <div class="countdown-display">
          <span style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--color-gold);letter-spacing:0.08em;">
            🔓 Ready to Open!
          </span>
        </div>
      `;
      onExpire?.();
      return;
    }

    const { days, hours, minutes, seconds } = remaining;

    el.innerHTML = `
      <div class="countdown-display">
        ${days > 0 ? `
        <div class="countdown-unit">
          <span class="countdown-value">${days}</span>
          <span class="countdown-label">day${days !== 1 ? 's' : ''}</span>
        </div>
        <span class="countdown-sep">:</span>` : ''}
        <div class="countdown-unit">
          <span class="countdown-value">${pad2(hours)}</span>
          <span class="countdown-label">hrs</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-unit">
          <span class="countdown-value">${pad2(minutes)}</span>
          <span class="countdown-label">min</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-unit">
          <span class="countdown-value">${pad2(seconds)}</span>
          <span class="countdown-label">sec</span>
        </div>
      </div>
    `;
  };

  return startCountdown(targetDateISO, render);
}

/**
 * Compact inline countdown string for use in capsule cards.
 * Returns a plain HTML string (no interval — call mountCountdown for live).
 */
export function countdownBadgeHTML(remaining) {
  if (!remaining) return `<span style="color:var(--color-gold);">🔓 Ready!</span>`;
  const { days, hours, minutes } = remaining;
  if (days > 0)   return `<span>⏳ ${days}d ${hours}h remaining</span>`;
  if (hours > 0)  return `<span>⏳ ${hours}h ${minutes}m remaining</span>`;
  return `<span style="color:var(--color-warning);">⏳ ${minutes}m remaining</span>`;
}
