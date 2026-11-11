/**
 * timer.js — Countdown & unlock date helpers
 */

/**
 * Returns the time remaining from now until `targetDateISO`.
 * Returns null if targetDateISO is in the past.
 */
export function getTimeRemaining(targetDateISO) {
  const now  = Date.now();
  const end  = new Date(targetDateISO).getTime();
  const diff = end - now;

  if (diff <= 0) return null;

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, totalMs: diff };
}

/** True if the capsule's unlock date has passed */
export function isUnlockable(capsule) {
  return Date.now() >= new Date(capsule.unlocksAt).getTime();
}

/** Human-readable relative unlock date, e.g. "2 years, 3 months" */
export function relativeUnlockDate(targetDateISO) {
  const now    = new Date();
  const target = new Date(targetDateISO);
  const diff   = target - now;

  if (diff <= 0) return 'Ready to open!';

  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months= Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);

  if (years >= 1) {
    const rem = months - years * 12;
    return rem > 0 ? `${years}y ${rem}m` : `${years} year${years > 1 ? 's' : ''}`;
  }
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''}`;
  if (weeks >= 1)  return `${weeks} week${weeks > 1 ? 's' : ''}`;
  if (days >= 1)   return `${days} day${days > 1 ? 's' : ''}`;
  if (hours >= 1)  return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
}

/** Format a date ISO string to a nice locale string */
export function formatDate(isoString) {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(isoString));
}

/** Format a date+time ISO string */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(isoString));
}

/** Zero-pad a number to 2 digits */
export function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Start a live countdown ticker.
 * Calls `callback(remaining | null)` immediately and then every second.
 * Returns a cleanup function.
 */
export function startCountdown(targetDateISO, callback) {
  const tick = () => callback(getTimeRemaining(targetDateISO));
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}
