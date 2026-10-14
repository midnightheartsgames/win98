import type { Lang } from '../core/i18n.ts';

export interface Settings {
  atb: 'active' | 'wait';
  battleSpeed: number;
  textSpeed: number;
  music: number;
  sfx: number;
  crt: boolean;
  lang: Lang;
  runDefault: boolean;
}

const KEY = 'avatar98-settings';

export const DEFAULT_SETTINGS: Settings = { atb: 'wait', battleSpeed: 2, textSpeed: 2, music: 7, sfx: 8, crt: false, lang: 'ru', runDefault: false };

export function safeGet(key: string): string | null {
  try {
    return globalThis.localStorage ? globalThis.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): boolean {
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeDel(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    return;
  }
}

export function loadSettings(): Settings {
  const out = { ...DEFAULT_SETTINGS };
  const raw = safeGet(KEY);
  if (raw) {
    try {
      Object.assign(out, JSON.parse(raw));
    } catch {
      return out;
    }
  }
  return out;
}

export function saveSettings(s: Settings): void {
  safeSet(KEY, JSON.stringify(s));
}

export const BATTLE_SPEEDS = [0.6, 0.8, 1, 1.3, 1.7];
export const TEXT_SPEEDS = [0.5, 1, 2, 4, 99];
