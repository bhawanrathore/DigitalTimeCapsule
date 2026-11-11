/**
 * storage.js — localStorage abstraction + JSON export/import
 */

const STORAGE_KEY = 'dtc_capsules';

/** Load all capsules from localStorage */
export function loadCapsules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Persist the full capsule array */
export function saveCapsules(capsules) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
}

/** Get a single capsule by ID */
export function getCapsule(id) {
  return loadCapsules().find((c) => c.id === id) || null;
}

/** Add a capsule */
export function addCapsule(capsule) {
  const capsules = loadCapsules();
  capsules.push(capsule);
  saveCapsules(capsules);
}

/** Update a capsule in place */
export function updateCapsule(updated) {
  const capsules = loadCapsules().map((c) =>
    c.id === updated.id ? updated : c
  );
  saveCapsules(capsules);
}

/** Delete a capsule by ID */
export function deleteCapsule(id) {
  const capsules = loadCapsules().filter((c) => c.id !== id);
  saveCapsules(capsules);
}

/* ---- Export / Import ---- */

/** Download all capsules as a JSON file */
export function exportCapsules() {
  const capsules = loadCapsules();
  const blob = new Blob(
    [JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), capsules }, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `digital-time-capsule-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import capsules from a JSON File object.
 * Returns { added, skipped } counts.
 */
export function importCapsules(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const incoming = Array.isArray(data.capsules) ? data.capsules : data;
        if (!Array.isArray(incoming)) throw new Error('Invalid format');

        const existing = loadCapsules();
        const existingIds = new Set(existing.map((c) => c.id));

        let added = 0;
        let skipped = 0;
        for (const cap of incoming) {
          if (!cap.id || !cap.title) { skipped++; continue; }
          if (existingIds.has(cap.id)) { skipped++; continue; }
          existing.push(cap);
          existingIds.add(cap.id);
          added++;
        }
        saveCapsules(existing);
        resolve({ added, skipped });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}
