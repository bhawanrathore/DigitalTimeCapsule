/**
 * animations.js — Cinematic animation utilities
 */

/* ---- Confetti ---- */
const CONFETTI_COLORS = [
  '#a855f7', '#c084fc', '#f59e0b', '#fcd34d',
  '#10b981', '#6366f1', '#ec4899', '#38bdf8',
];

export function launchConfetti(count = 120) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: 0;
        background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
        width: ${6 + Math.random() * 10}px;
        height: ${6 + Math.random() * 10}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation-duration: ${2 + Math.random() * 2.5}s;
        animation-delay: 0s;
      `;
      document.body.appendChild(piece);
      piece.addEventListener('animationend', () => piece.remove());
    }, Math.random() * 600);
  }
}

/* ---- Particle Burst from center ---- */
export function particleBurst(x, y, count = 24) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist  = 60 + Math.random() * 100;
    const size  = 4 + Math.random() * 8;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const dur   = 500 + Math.random() * 400;

    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      transform-origin: center;
      animation: particle-move ${dur}ms cubic-bezier(0.16,1,0.3,1) forwards;
    `;

    // Inject a unique keyframe per particle
    const kfName = `pf-${Date.now()}-${i}`;
    const style  = document.createElement('style');
    style.textContent = `
      @keyframes ${kfName} {
        0%   { transform: translate(0, 0) scale(1); opacity: 1; }
        100% { transform: translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    p.style.animationName = kfName;

    document.body.appendChild(p);
    p.addEventListener('animationend', () => { p.remove(); style.remove(); });
  }
}

/* ---- Seal Press Animation on a container element ---- */
export function playSealAnimation(container) {
  return new Promise((resolve) => {
    container.classList.add('sealing');
    setTimeout(resolve, 950);
  });
}

/* ---- Dramatic reveal entrance (stagger children) ---- */
export function revealStagger(parent, delay = 80) {
  const children = Array.from(parent.children);
  children.forEach((child, i) => {
    child.style.opacity = '0';
    child.style.transform = 'translateY(24px)';
    child.style.transition = `opacity 500ms ease ${i * delay}ms, transform 500ms cubic-bezier(0.16,1,0.3,1) ${i * delay}ms`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        child.style.opacity = '1';
        child.style.transform = 'translateY(0)';
      });
    });
  });
}

/* ---- Page transition ---- */
export function animatePageIn(el) {
  el.classList.add('page-enter');
  el.addEventListener('animationend', () => el.classList.remove('page-enter'), { once: true });
}

/* ---- Number count-up ---- */
export function countUp(el, from, to, duration = 800) {
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * ease);
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
