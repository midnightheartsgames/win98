import type { SaveData } from './state.ts';
import { SAVE_SLOTS, SAVE_VERSION } from '../config.ts';
import { hashString } from '../core/rng.ts';
import { safeDel, safeGet, safeSet } from './settings.ts';

export interface SlotMeta {
  slot: number;
  name: string;
  level: number;
  place: string;
  playtime: number;
  savedAt: number;
  chapter: string;
  clean: boolean;
  party: string[];
}

export interface SlotRecord {
  meta: SlotMeta;
  data: SaveData;
}

const PREFIX = 'avatar98-slot-';
const MAGIC = 'AVATAR98SAV';

export function slotKey(slot: number): string {
  return `${PREFIX}${slot}`;
}

export function readSlot(slot: number): SlotRecord | null {
  const raw = safeGet(slotKey(slot));
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw) as SlotRecord;
    if (!rec || !rec.data || !rec.meta) return null;
    return rec;
  } catch {
    return null;
  }
}

export function writeSlot(slot: number, rec: SlotRecord): boolean {
  return safeSet(slotKey(slot), JSON.stringify(rec));
}

export function deleteSlot(slot: number): void {
  safeDel(slotKey(slot));
}

export function allSlots(): (SlotRecord | null)[] {
  return Array.from({ length: SAVE_SLOTS }, (_, i) => readSlot(i + 1));
}

export function latestSlot(): number | null {
  let best: number | null = null;
  let t = -1;
  allSlots().forEach((r, i) => {
    if (r && r.meta.savedAt > t) {
      t = r.meta.savedAt;
      best = i + 1;
    }
  });
  return best;
}

function toBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(b: string): string {
  const bin = atob(b);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function exportSav(rec: SlotRecord): string {
  const body = JSON.stringify(rec);
  const sum = hashString(body).toString(16).padStart(8, '0');
  const b64 = toBase64(body);
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 76) lines.push(b64.slice(i, i + 76));
  return `${MAGIC} v${SAVE_VERSION} ${sum}\r\n${lines.join('\r\n')}\r\n`;
}

export function importSav(text: string): SlotRecord {
  const clean = text.replace(/\r/g, '').trim();
  const nl = clean.indexOf('\n');
  if (nl < 0) throw new Error('bad_format');
  const header = clean.slice(0, nl).trim().split(/\s+/);
  if (header[0] !== MAGIC) throw new Error('bad_format');
  const body = fromBase64(clean.slice(nl + 1).replace(/\s+/g, ''));
  if (hashString(body).toString(16).padStart(8, '0') !== header[2]) throw new Error('bad_checksum');
  const rec = JSON.parse(body) as SlotRecord;
  if (!rec.data || !rec.meta || typeof rec.data.map?.id !== 'string') throw new Error('bad_format');
  return rec;
}

export function savFileName(rec: SlotRecord): string {
  const base = rec.meta.clean ? 'CH2_READY' : `SLOT${rec.meta.slot}`;
  return `ISA_${base}.SAV`;
}
