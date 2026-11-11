/**
 * capsule.js — Capsule data model & factory
 */

import { addCapsule, updateCapsule, getCapsule } from './storage.js';

/** Theme metadata */
export const THEMES = {
  space:  { icon: '🌌', label: 'Deep Space',    desc: 'Cosmic wonder' },
  ocean:  { icon: '🌊', label: 'Ocean Depths',  desc: 'Mystery below' },
  forest: { icon: '🌲', label: 'Ancient Forest', desc: 'Timeless wisdom' },
  retro:  { icon: '📼', label: 'Retro Vibe',    desc: 'Nostalgia wave' },
};

/** Create a UUID v4 */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Build a new capsule object and persist it.
 * @param {{ title, message, images, unlocksAt, theme }} data
 */
export function createCapsule({ title, message, images = [], unlocksAt, theme = 'space' }) {
  if (!title?.trim()) throw new Error('Title is required');
  if (!unlocksAt)     throw new Error('Unlock date is required');
  if (new Date(unlocksAt) <= new Date()) throw new Error('Unlock date must be in the future');

  const capsule = {
    id:         uuid(),
    title:      title.trim(),
    message:    message?.trim() || '',
    images,                                   // base64 data URLs
    createdAt:  new Date().toISOString(),
    unlocksAt:  new Date(unlocksAt).toISOString(),
    theme,
    isUnlocked: false,
    openedAt:   null,
  };

  addCapsule(capsule);
  return capsule;
}

/**
 * Mark a capsule as unlocked (called on first reveal).
 */
export function unlockCapsule(id) {
  const capsule = getCapsule(id);
  if (!capsule) return null;
  if (!capsule.isUnlocked) {
    capsule.isUnlocked = true;
    capsule.openedAt = new Date().toISOString();
    updateCapsule(capsule);
  }
  return capsule;
}
