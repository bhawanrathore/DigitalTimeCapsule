/**
 * create.js — Multi-step capsule creation wizard
 */

import { createCapsule, THEMES } from '../utils/capsule.js';
import { playSealAnimation } from '../utils/animations.js';
import { toast } from '../components/toast.js';
import { navigate } from '../main.js';
import { animatePageIn } from '../utils/animations.js';

const STEPS = ['Write', 'Date', 'Theme', 'Seal'];
const MAX_MSG_LEN = 5000;
const MAX_IMAGES  = 6;

export function renderCreate(container) {
  container.innerHTML = '';
  animatePageIn(container);

  /* ---- State ---- */
  const state = {
    step:    0,
    title:   '',
    message: '',
    images:  [],       // base64 data URLs
    unlocksAt: '',
    theme:   'space',
  };

  /* ---- Outer shell ---- */
  const shell = document.createElement('div');
  shell.innerHTML = `
    <div class="wizard-container">
      <div style="margin-bottom:var(--space-6)">
        <button class="btn btn-ghost btn-sm" id="back-nav-btn">← Back</button>
      </div>
      <h1 style="font-family:var(--font-display);font-size:var(--text-2xl);margin-bottom:var(--space-8);color:var(--color-text)">
        Create a New Capsule
      </h1>
      <div class="wizard-progress" id="wizard-progress"></div>
      <div id="wizard-body"></div>
    </div>
  `;
  container.appendChild(shell);

  shell.querySelector('#back-nav-btn').addEventListener('click', () => navigate('/'));

  /* ---- Progress bar renderer ---- */
  const renderProgress = () => {
    const prog = shell.querySelector('#wizard-progress');
    prog.innerHTML = STEPS.map((label, i) => {
      let cls = '';
      if (i < state.step)       cls = 'done';
      else if (i === state.step) cls = 'active';
      const lineCls = i < state.step ? 'done' : (i === state.step ? 'active' : '');
      return `
        <div class="wizard-step-indicator ${cls}">
          <div class="wizard-step-circle">${i < state.step ? '✓' : i + 1}</div>
          <div class="wizard-step-label">${label}</div>
        </div>
        ${i < STEPS.length - 1 ? `<div class="wizard-step-line ${lineCls}"></div>` : ''}
      `;
    }).join('');
  };

  /* ---- Step renderers ---- */
  const steps = [renderStep0, renderStep1, renderStep2, renderStep3];

  const goTo = (n) => {
    state.step = n;
    renderProgress();
    const body = shell.querySelector('#wizard-body');
    body.innerHTML = '';
    steps[n](body, state, goTo);
  };

  renderProgress();
  goTo(0);
}

/* ===== STEP 0: Write ===== */
function renderStep0(body, state, goTo) {
  body.innerHTML = `
    <div class="wizard-step-content slide-up">
      <h2 class="wizard-step-title">📝 Write Your Message</h2>
      <p class="wizard-step-subtitle">What do you want to say to your future self?</p>

      <div style="display:flex;flex-direction:column;gap:var(--space-6);">
        <div class="form-group">
          <label class="form-label" for="cap-title">Capsule Title *</label>
          <input class="form-input" id="cap-title" type="text"
            placeholder="A name for this memory..." maxlength="80"
            value="${escHtml(state.title)}" />
        </div>

        <div class="form-group">
          <label class="form-label" for="cap-message">Your Message</label>
          <textarea class="form-textarea" id="cap-message"
            placeholder="Dear future me…" maxlength="${MAX_MSG_LEN}"
            style="min-height:220px">${escHtml(state.message)}</textarea>
          <div class="char-counter" id="msg-counter">${state.message.length} / ${MAX_MSG_LEN}</div>
        </div>

        <div class="form-group">
          <label class="form-label">Attach Images (up to ${MAX_IMAGES})</label>
          <div class="image-upload-area" id="upload-area">
            <input type="file" id="img-input" accept="image/*" multiple />
            <div class="image-upload-icon">🖼️</div>
            <div class="image-upload-text">Drop images here or click to browse</div>
            <div class="image-upload-hint">JPG, PNG, GIF, WEBP · Max 5 MB each</div>
          </div>
          <div class="image-preview-grid" id="img-preview"></div>
        </div>
      </div>

      <div class="wizard-nav">
        <span></span>
        <button class="btn btn-primary" id="step0-next">Next: Set Date →</button>
      </div>
    </div>
  `;

  const titleInput = body.querySelector('#cap-title');
  const msgInput   = body.querySelector('#cap-message');
  const counter    = body.querySelector('#msg-counter');

  msgInput.addEventListener('input', () => {
    const len = msgInput.value.length;
    counter.textContent = `${len} / ${MAX_MSG_LEN}`;
    counter.className   = 'char-counter' + (len > MAX_MSG_LEN * 0.9 ? ' warning' : '') + (len >= MAX_MSG_LEN ? ' danger' : '');
  });

  /* ---- Image upload ---- */
  const preview = body.querySelector('#img-preview');
  const renderPreviews = () => {
    preview.innerHTML = state.images.map((src, i) => `
      <div class="image-preview-item">
        <img src="${src}" alt="Preview ${i + 1}" />
        <button class="image-preview-remove" data-idx="${i}" title="Remove">✕</button>
      </div>
    `).join('');
    preview.querySelectorAll('.image-preview-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        state.images.splice(parseInt(btn.dataset.idx), 1);
        renderPreviews();
      });
    });
  };

  const addImages = (files) => {
    const remaining = MAX_IMAGES - state.images.length;
    const toAdd = Array.from(files).slice(0, remaining);
    let loaded = 0;
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) { toast.error(`"${file.name}" exceeds 5 MB`); continue; }
      const reader = new FileReader();
      reader.onload = (e) => {
        state.images.push(e.target.result);
        loaded++;
        if (loaded === toAdd.length) renderPreviews();
      };
      reader.readAsDataURL(file);
    }
    if (files.length > remaining) toast.warning(`Only ${MAX_IMAGES} images allowed. Some were skipped.`);
  };

  body.querySelector('#img-input').addEventListener('change', e => addImages(e.target.files));

  const uploadArea = body.querySelector('#upload-area');
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragging'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragging'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('dragging');
    addImages(e.dataTransfer.files);
  });

  renderPreviews();

  body.querySelector('#step0-next').addEventListener('click', () => {
    const title = titleInput.value.trim();
    if (!title) { toast.error('Please add a title for your capsule.'); titleInput.focus(); return; }
    state.title   = title;
    state.message = msgInput.value.trim();
    goTo(1);
  });
}

/* ===== STEP 1: Date ===== */
function renderStep1(body, state, goTo) {
  // Min = 1 minute from now, default = 1 year
  const minDate = new Date(Date.now() + 60000).toISOString().slice(0, 16);
  const defDate = new Date(Date.now() + 365 * 24 * 3600000).toISOString().slice(0, 16);
  const curVal  = state.unlocksAt ? new Date(state.unlocksAt).toISOString().slice(0, 16) : defDate;

  body.innerHTML = `
    <div class="wizard-step-content slide-up">
      <h2 class="wizard-step-title">🗓️ Set the Unlock Date</h2>
      <p class="wizard-step-subtitle">Choose when this capsule will reveal its secrets.</p>

      <div class="form-group" style="margin-bottom:var(--space-6)">
        <label class="form-label" for="unlock-date">Unlock Date & Time *</label>
        <input class="form-input" id="unlock-date" type="datetime-local"
          min="${minDate}" value="${curVal}" />
      </div>

      <div id="date-preview" style="
        background:var(--color-bg-alt);
        border:1px solid var(--color-border);
        border-radius:var(--radius-md);
        padding:var(--space-5);
        text-align:center;
        font-family:var(--font-display);
      ">
        <div style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-2)">Opens in</div>
        <div id="date-preview-val" style="font-size:var(--text-2xl);color:var(--color-gold)"></div>
      </div>

      <div style="margin-top:var(--space-6)">
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-3)">Quick picks:</p>
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
          ${[
            ['1 Week',   7],
            ['1 Month',  30],
            ['6 Months', 180],
            ['1 Year',   365],
            ['5 Years',  1825],
            ['10 Years', 3650],
          ].map(([label, days]) =>
            `<button class="btn btn-outline btn-sm quick-pick" data-days="${days}">${label}</button>`
          ).join('')}
        </div>
      </div>

      <div class="wizard-nav">
        <button class="btn btn-ghost" id="step1-back">← Back</button>
        <button class="btn btn-primary" id="step1-next">Next: Choose Theme →</button>
      </div>
    </div>
  `;

  const dateInput = body.querySelector('#unlock-date');
  const preview   = body.querySelector('#date-preview-val');

  const updatePreview = () => {
    const val = dateInput.value;
    if (!val) { preview.textContent = '—'; return; }
    const ms   = new Date(val) - Date.now();
    if (ms <= 0) { preview.textContent = 'Must be in the future'; preview.style.color = 'var(--color-danger)'; return; }
    preview.style.color = 'var(--color-gold)';
    const days  = Math.floor(ms / 86400000);
    const years = (ms / (365.25 * 86400000)).toFixed(1);
    preview.textContent = days > 365 ? `${years} years` : days > 1 ? `${days} days` : `${Math.floor(ms / 3600000)} hours`;
  };

  dateInput.addEventListener('input', updatePreview);
  updatePreview();

  body.querySelectorAll('.quick-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = new Date(Date.now() + parseInt(btn.dataset.days) * 86400000);
      dateInput.value = d.toISOString().slice(0, 16);
      updatePreview();
    });
  });

  body.querySelector('#step1-back').addEventListener('click', () => { state.unlocksAt = dateInput.value; goTo(0); });
  body.querySelector('#step1-next').addEventListener('click', () => {
    const val = dateInput.value;
    if (!val || new Date(val) <= new Date()) { toast.error('Pick a future date!'); return; }
    state.unlocksAt = val;
    goTo(2);
  });
}

/* ===== STEP 2: Theme ===== */
function renderStep2(body, state, goTo) {
  body.innerHTML = `
    <div class="wizard-step-content slide-up">
      <h2 class="wizard-step-title">🎨 Choose a Theme</h2>
      <p class="wizard-step-subtitle">Every capsule has its own soul. Pick yours.</p>

      <div class="theme-grid">
        ${Object.entries(THEMES).map(([key, t]) => `
          <label class="theme-option" for="theme-${key}">
            <input type="radio" name="theme" id="theme-${key}" value="${key}" ${state.theme === key ? 'checked' : ''} />
            <div class="theme-option-inner">
              <div class="theme-icon">${t.icon}</div>
              <div class="theme-name">${t.label}</div>
              <div class="theme-desc">${t.desc}</div>
            </div>
          </label>
        `).join('')}
      </div>

      <div class="wizard-nav">
        <button class="btn btn-ghost" id="step2-back">← Back</button>
        <button class="btn btn-primary" id="step2-next">Next: Seal It →</button>
      </div>
    </div>
  `;

  body.querySelectorAll('input[name="theme"]').forEach(r => {
    r.addEventListener('change', () => { state.theme = r.value; });
  });

  body.querySelector('#step2-back').addEventListener('click', () => goTo(1));
  body.querySelector('#step2-next').addEventListener('click', () => {
    const checked = body.querySelector('input[name="theme"]:checked');
    state.theme = checked?.value || 'space';
    goTo(3);
  });
}

/* ===== STEP 3: Seal ===== */
function renderStep3(body, state, goTo) {
  const theme = THEMES[state.theme] || THEMES.space;

  body.innerHTML = `
    <div class="wizard-step-content slide-up">
      <h2 class="wizard-step-title">🔒 Seal Your Capsule</h2>
      <p class="wizard-step-subtitle">Review and lock it forever — until unlock day.</p>

      <div style="
        background:var(--color-bg-alt);
        border:1px solid var(--color-border);
        border-radius:var(--radius-lg);
        padding:var(--space-6);
        margin-bottom:var(--space-8);
        display:flex;flex-direction:column;gap:var(--space-3);
      ">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <span style="font-size:1.8rem">${theme.icon}</span>
          <div>
            <div style="font-family:var(--font-display);font-size:var(--text-lg);color:var(--color-text)">${escHtml(state.title)}</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.08em">${theme.label}</div>
          </div>
        </div>
        ${state.message ? `
        <div style="border-top:1px solid var(--color-border);padding-top:var(--space-3);font-size:var(--text-sm);color:var(--color-text-muted);max-height:120px;overflow:hidden;position:relative;">
          <p style="white-space:pre-wrap">${escHtml(state.message.slice(0, 200))}${state.message.length > 200 ? '…' : ''}</p>
        </div>` : ''}
        <div style="border-top:1px solid var(--color-border);padding-top:var(--space-3);display:flex;gap:var(--space-6)">
          <div>
            <div style="font-size:var(--text-xs);color:var(--color-text-faint);text-transform:uppercase;letter-spacing:.1em">Opens</div>
            <div style="font-family:var(--font-display);font-size:var(--text-base);color:var(--color-gold)">${new Date(state.unlocksAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
          </div>
          ${state.images.length > 0 ? `
          <div>
            <div style="font-size:var(--text-xs);color:var(--color-text-faint);text-transform:uppercase;letter-spacing:.1em">Images</div>
            <div style="font-family:var(--font-display);font-size:var(--text-base);color:var(--color-text)">${state.images.length}</div>
          </div>` : ''}
        </div>
      </div>

      <div class="seal-animation-container">
        <div class="seal-wax" id="seal-wax" style="background:radial-gradient(circle at 35% 35%, hsl(42 90% 65%), hsl(42 70% 42%));box-shadow:0 8px 32px hsl(42 90% 50%/0.5)">
          <div class="seal-rings"></div>
          <span>🔒</span>
        </div>
        <p style="color:var(--color-text-muted);font-size:var(--text-sm);text-align:center;">
          Once sealed, this capsule cannot be opened until<br/>
          <strong style="color:var(--color-gold)">${new Date(state.unlocksAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</strong>
        </p>
      </div>

      <div class="wizard-nav">
        <button class="btn btn-ghost" id="step3-back">← Back</button>
        <button class="btn btn-gold btn-lg" id="seal-btn">🔒 Seal the Capsule</button>
      </div>
    </div>
  `;

  body.querySelector('#step3-back').addEventListener('click', () => goTo(2));

  body.querySelector('#seal-btn').addEventListener('click', async () => {
    const btn  = body.querySelector('#seal-btn');
    const seal = body.querySelector('#seal-wax');
    btn.disabled = true;
    btn.textContent = 'Sealing…';

    await playSealAnimation(seal);

    try {
      createCapsule({
        title:     state.title,
        message:   state.message,
        images:    state.images,
        unlocksAt: state.unlocksAt,
        theme:     state.theme,
      });
      toast.success('Capsule sealed! 🔒');
      setTimeout(() => navigate('/vault'), 600);
    } catch (err) {
      toast.error(err.message);
      btn.disabled = false;
      btn.textContent = '🔒 Seal the Capsule';
    }
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
