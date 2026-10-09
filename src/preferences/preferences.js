import { useSyncExternalStore } from 'react';
import { UZ } from './translations';
const KEY = 'jm_preferences';
const EVENT = 'jm-preferences-change';
function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
export function getPreferences() { const value = read(); return { language: value.language === 'uz' ? 'uz' : 'ru', theme: value.theme === 'dark' ? 'dark' : 'light' }; }
export function applyPreferences() { const value = getPreferences(); document.documentElement.lang = value.language; document.documentElement.dataset.theme = value.theme; }
export function setPreference(key, value) {
  const next = { ...getPreferences(), [key]: value };
  localStorage.setItem(KEY, JSON.stringify(next)); applyPreferences(); window.dispatchEvent(new Event(EVENT));
}
function subscribe(callback) { window.addEventListener(EVENT, callback); window.addEventListener('storage', callback); return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); }; }
const snapshot = () => { const value = getPreferences(); return `${value.language}:${value.theme}`; };
export function useLanguage() { useSyncExternalStore(subscribe, snapshot, () => 'ru:light'); return getPreferences(); }
export function translate(text, values = []) {
  if (typeof text !== 'string') return text;
  const output = getPreferences().language === 'uz' ? (UZ[text] || text) : text;
  return output.replace(/\{(\d+)\}/g, (match, i) => values[i] === undefined ? match : String(values[i]));
}
window.addEventListener('storage', applyPreferences);
applyPreferences();
