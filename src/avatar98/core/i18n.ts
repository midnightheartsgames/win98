export type Lang = 'ru' | 'en';

export class Strings {
  lang: Lang = 'ru';
  private tables: Record<Lang, Record<string, string>> = { ru: {}, en: {} };
  private lines: Record<Lang, Record<string, string[]>> = { ru: {}, en: {} };
  playerName = 'Иса';
  missing = new Set<string>();

  addStrings(lang: Lang, table: Record<string, string>): void {
    Object.assign(this.tables[lang], table);
  }
  addDialogue(lang: Lang, table: Record<string, string[] | string>): void {
    for (const k of Object.keys(table)) {
      const v = table[k];
      this.lines[lang][k] = Array.isArray(v) ? v : [v];
    }
  }
  has(key: string): boolean {
    return key in this.tables.ru || key in this.tables.en;
  }
  hasDialogue(key: string): boolean {
    return key in this.lines.ru || key in this.lines.en;
  }
  t(key: string, params?: Record<string, string | number>): string {
    let s = this.tables[this.lang][key] ?? this.tables.ru[key];
    if (s === undefined) {
      this.missing.add(key);
      s = key;
    }
    return this.fill(s, params);
  }
  dialogue(key: string): string[] {
    const v = this.lines[this.lang][key] ?? this.lines.ru[key];
    if (!v) {
      this.missing.add(key);
      return [`|${key}`];
    }
    return v.map((l) => this.fill(l));
  }
  fill(s: string, params?: Record<string, string | number>): string {
    return s.replace(/\{(\w+)\}/g, (m, k: string) => {
      if (k === 'player') return this.playerName;
      if (params && params[k] !== undefined) return String(params[k]);
      return m;
    });
  }
  stringKeys(lang: Lang): string[] {
    return Object.keys(this.tables[lang]);
  }
  dialogueKeys(lang: Lang): string[] {
    return Object.keys(this.lines[lang]);
  }
  dialogueCount(lang: Lang): number {
    let n = 0;
    for (const k of Object.keys(this.lines[lang])) n += this.lines[lang][k].length;
    return n;
  }
}

export const str = new Strings();
