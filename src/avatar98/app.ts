import { DEBUG, SCREEN_H, SCREEN_W, STEP_MS } from './config.ts';
import { Screen } from './core/screen.ts';
import { Input } from './core/input.ts';
import { Audio } from './core/audio.ts';
import { str } from './core/i18n.ts';
import type { GameData } from './data/types.ts';
import { loadGameData } from './data/loader.ts';
import { ValidationErrors } from './data/validate.ts';
import { Sprites } from './gfx/sprites.ts';
import { Font } from './gfx/font.ts';
import { UI } from './game/ui.ts';
import { Game } from './game/state.ts';
import { loadSettings, saveSettings, type Settings, BATTLE_SPEEDS, TEXT_SPEEDS } from './game/settings.ts';
import { readSlot, writeSlot, importSav, type SlotRecord } from './game/save.ts';

export interface Scene {
  opaque: boolean;
  update(): void;
  render(ctx: CanvasRenderingContext2D): void;
  enter?(): void;
  exit?(): void;
  resume?(): void;
  countsPlaytime?: boolean;
}

export interface AppOptions {
  base?: string;
  isActive?: () => boolean;
  onExit?: () => void;
  onExportFile?: (name: string, content: string) => boolean;
  listImportFiles?: () => { name: string; content: string }[];
  lang?: 'ru' | 'en';
  autostart?: string;
  importText?: string;
}

type SceneFactory = (app: App) => Scene;

export const SceneRegistry: { title?: SceneFactory; map?: (app: App) => Scene; gameover?: SceneFactory; debug?: SceneFactory } = {};

export class App {
  readonly root: HTMLElement;
  readonly screen: Screen;
  readonly input: Input;
  readonly audio: Audio;
  readonly opts: AppOptions;
  data!: GameData;
  sprites!: Sprites;
  font!: Font;
  ui!: UI;
  game: Game | null = null;
  settings: Settings;
  scenes: Scene[] = [];
  frame = 0;
  paused = false;
  destroyed = false;
  loadError: string | null = null;
  loading = true;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private fadeA = 0;
  private fadeTarget = 0;
  private fadeSpeed = 0;
  private fadeColor = '#000000';
  private fadeCb: (() => void) | null = null;
  private shakeT = 0;
  private shakeP = 0;
  private flashT = 0;
  private flashMax = 1;
  private flashColor = '#ffffff';
  private overlay: HTMLDivElement;
  private debugOpen = false;
  scannedEnemies = new Set<string>();
  lastSlot: number | null = null;

  constructor(root: HTMLElement, opts: AppOptions = {}) {
    this.root = root;
    this.opts = opts;
    root.classList.add('av98-root');
    root.style.position = root.style.position || 'relative';
    root.style.background = '#000';
    root.style.overflow = 'hidden';
    root.tabIndex = 0;
    this.settings = loadSettings();
    if (opts.lang && !globalThis.localStorage?.getItem('avatar98-settings')) this.settings.lang = opts.lang;
    str.lang = this.settings.lang;
    this.screen = new Screen(root);
    this.screen.crt = this.settings.crt;
    this.input = new Input(window, () => this.isActive());
    this.audio = new Audio();
    this.audio.musicVol = this.settings.music / 10;
    this.audio.sfxVol = this.settings.sfx / 10;
    this.input.onFirstGesture = () => this.audio.unlock();
    root.addEventListener('pointerdown', () => {
      root.focus({ preventScroll: true });
      this.audio.unlock();
    });
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    root.appendChild(this.overlay);
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
    this.boot().catch((e: Error) => {
      this.loadError = e instanceof ValidationErrors ? e.message : `${e.message}\n${e.stack ?? ''}`;
      console.error(e);
    });
  }

  private async boot(): Promise<void> {
    const base = this.opts.base ?? 'content/avatar98/';
    this.data = await loadGameData(async (p) => {
      const r = await fetch(base + p, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${base + p}`);
      return r.text();
    });
    for (const lang of Object.keys(this.data.lang)) {
      for (const f of this.data.lang[lang]) {
        str.addStrings(lang as 'ru' | 'en', f.strings);
        str.addDialogue(lang as 'ru' | 'en', f.dialogue);
      }
    }
    this.font = new Font(this.data.font);
    this.sprites = new Sprites(this.data.looks, this.data.tiles.tiles);
    this.ui = new UI(this.font, this.sprites);
    this.audio.setData(this.data.music, this.data.sfx);
    this.loading = false;
    if (this.opts.importText) {
      this.toTitle();
      this.importText(this.opts.importText);
    } else if (this.opts.autostart === 'new') this.newGame();
    else this.toTitle();
  }

  isActive(): boolean {
    if (this.destroyed) return false;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
    if (this.opts.isActive) return this.opts.isActive();
    return typeof document === 'undefined' || document.hasFocus();
  }

  get top(): Scene | undefined {
    return this.scenes[this.scenes.length - 1];
  }

  push(s: Scene): void {
    this.scenes.push(s);
    s.enter?.();
  }

  pop(): Scene | undefined {
    const s = this.scenes.pop();
    s?.exit?.();
    this.top?.resume?.();
    return s;
  }

  remove(s: Scene): void {
    const i = this.scenes.indexOf(s);
    if (i >= 0) {
      this.scenes.splice(i, 1);
      s.exit?.();
      if (i === this.scenes.length) this.top?.resume?.();
    }
  }

  replaceAll(s: Scene): void {
    while (this.scenes.length) this.scenes.pop()?.exit?.();
    this.push(s);
  }

  fadeOut(frames: number, cb?: () => void, color = '#000000'): void {
    this.fadeTarget = 1;
    this.fadeSpeed = 1 / Math.max(1, frames);
    this.fadeColor = color;
    this.fadeCb = cb ?? null;
    if (frames <= 0 || this.fadeA >= 1) {
      this.fadeA = 1;
      this.fadeCb = null;
      cb?.();
    }
  }

  fadeIn(frames: number): void {
    this.fadeTarget = 0;
    this.fadeSpeed = 1 / Math.max(1, frames);
    this.fadeCb = null;
  }

  setFade(a: number): void {
    this.fadeA = a;
    this.fadeTarget = a;
  }

  get fading(): boolean {
    return this.fadeA !== this.fadeTarget;
  }

  get fadeLevel(): number {
    return this.fadeA;
  }

  shake(frames: number, power = 2): void {
    this.shakeT = Math.max(this.shakeT, frames);
    this.shakeP = power;
  }

  flash(color: string, frames: number): void {
    this.flashColor = color;
    this.flashT = frames;
    this.flashMax = frames;
  }

  music(id: string | null): void {
    if (!id || id === 'stop') this.audio.stop(0.6);
    else this.audio.play(id);
  }

  sfx(id: string): void {
    this.audio.sfx(id);
  }

  get textSpeed(): number {
    return TEXT_SPEEDS[this.settings.textSpeed] ?? 1;
  }

  get battleSpeed(): number {
    return BATTLE_SPEEDS[this.settings.battleSpeed] ?? 1;
  }

  applySettings(): void {
    saveSettings(this.settings);
    this.audio.musicVol = this.settings.music / 10;
    this.audio.sfxVol = this.settings.sfx / 10;
    this.audio.applyVolume();
    this.screen.crt = this.settings.crt;
    str.lang = this.settings.lang;
  }

  t(key: string, params?: Record<string, string | number>): string {
    return str.t(key, params);
  }

  toTitle(): void {
    this.game = null;
    this.setFade(1);
    const f = SceneRegistry.title;
    if (!f) throw new Error('title scene missing');
    this.replaceAll(f(this));
    this.fadeIn(30);
  }

  newGame(): void {
    this.game = new Game(this.data);
    this.scannedEnemies = new Set();
    str.playerName = this.game.s.name;
    this.lastSlot = null;
    const f = SceneRegistry.map;
    if (!f) throw new Error('map scene missing');
    this.setFade(1);
    this.replaceAll(f(this));
  }

  debugStart(o: { map: string; spawn: string; flags?: string[]; items?: Record<string, number>; party?: string[]; level?: number; pipo?: boolean; vars?: Record<string, number>; quests?: Record<string, number> }): void {
    const g = new Game(this.data);
    g.setFlag('game_started');
    for (const f of o.flags ?? []) g.setFlag(f);
    for (const [k, v] of Object.entries(o.items ?? {})) g.give(k, v);
    for (const id of o.party ?? []) g.join(id);
    if (o.pipo) {
      g.join('pipo');
      g.s.pipo = true;
    }
    for (const id of Object.keys(g.s.roster)) if (o.level) g.setLevel(id, o.level);
    Object.assign(g.s.vars, o.vars ?? {});
    Object.assign(g.s.quests, o.quests ?? {});
    const sp = this.data.maps[o.map].spawns[o.spawn];
    g.s.map = { id: o.map, x: sp.x, y: sp.y, dir: sp.dir ?? 'down' };
    this.game = g;
    str.playerName = g.s.name;
    const f = SceneRegistry.map;
    if (!f) return;
    this.setFade(1);
    this.replaceAll(f(this));
  }

  debugWinBattle(): boolean {
    const bs = this.scenes.find((s) => (s as unknown as { battle?: { actors: { side: string; alive: boolean; hp: number }[]; checkEnd(): void } }).battle) as unknown as { battle: { actors: { side: string; alive: boolean; hp: number }[]; checkEnd(): void } } | undefined;
    if (!bs) return false;
    for (const a of bs.battle.actors) if (a.side === 'enemy') {
      a.hp = 0;
      a.alive = false;
    }
    bs.battle.checkEnd();
    return true;
  }

  loadRecord(rec: SlotRecord, slot: number | null): void {
    this.game = new Game(this.data, rec.data);
    str.playerName = this.game.s.name;
    this.lastSlot = slot;
    this.scannedEnemies = new Set();
    const f = SceneRegistry.map;
    if (!f) throw new Error('map scene missing');
    this.setFade(1);
    this.replaceAll(f(this));
  }

  loadSlot(slot: number): boolean {
    const rec = readSlot(slot);
    if (!rec) return false;
    this.loadRecord(rec, slot);
    return true;
  }

  saveToSlot(slot: number, placeName: string): boolean {
    const g = this.game;
    if (!g) return false;
    const data = g.toSave();
    const rec: SlotRecord = {
      meta: { slot, name: g.s.name, level: g.cs('isa').level, place: placeName, playtime: g.s.playtime, savedAt: data.savedAt, chapter: g.s.chapter, clean: g.s.clean, party: [...g.s.party] },
      data
    };
    const ok = writeSlot(slot, rec);
    if (ok) this.lastSlot = slot;
    return ok;
  }

  gameOver(): void {
    const f = SceneRegistry.gameover;
    if (!f) {
      this.toTitle();
      return;
    }
    this.replaceAll(f(this));
  }

  importText(text: string): boolean {
    if (this.loading) {
      this.opts.importText = text;
      return false;
    }
    try {
      const rec = importSav(text);
      this.fadeOut(20, () => this.loadRecord(rec, null));
      return true;
    } catch {
      this.sfx('error');
      return false;
    }
  }

  exportFile(name: string, content: string): boolean {
    let ok = false;
    if (this.opts.onExportFile) ok = this.opts.onExportFile(name, content);
    if (ok) return true;
    try {
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      ok = true;
    } catch {
      return ok;
    }
    return ok;
  }

  pickImportFile(cb: (content: string | null) => void): void {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.sav,.SAV';
    inp.style.display = 'none';
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) {
        cb(null);
        return;
      }
      f.text().then((t) => cb(t), () => cb(null));
      inp.remove();
    };
    document.body.appendChild(inp);
    inp.click();
  }

  private loop(now: number): void {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.last) this.last = now;
    let dt = now - this.last;
    this.last = now;
    if (dt > 250) dt = 250;
    const active = this.isActive();
    if (!active) {
      if (!this.paused) {
        this.paused = true;
        this.audio.suspend();
        this.input.clear();
      }
      this.render();
      return;
    }
    if (this.paused) {
      this.paused = false;
      this.audio.resume();
    }
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP_MS && steps < 4) {
      this.step();
      this.acc -= STEP_MS;
      steps++;
    }
    if (steps >= 4) this.acc = 0;
    this.render();
  }

  step(): void {
    this.input.update();
    this.frame++;
    if (this.loading || this.loadError) return;
    this.ui.tick();
    if (DEBUG && this.input.pressed('debug') && SceneRegistry.debug && this.game && !this.debugOpen) {
      this.debugOpen = true;
      const d = SceneRegistry.debug(this);
      const origExit = d.exit?.bind(d);
      d.exit = () => {
        this.debugOpen = false;
        origExit?.();
      };
      this.push(d);
      this.input.consume('debug');
    }
    if (this.fadeA !== this.fadeTarget) {
      if (this.fadeA < this.fadeTarget) this.fadeA = Math.min(this.fadeTarget, this.fadeA + this.fadeSpeed);
      else this.fadeA = Math.max(this.fadeTarget, this.fadeA - this.fadeSpeed);
      if (this.fadeA === this.fadeTarget && this.fadeCb) {
        const cb = this.fadeCb;
        this.fadeCb = null;
        cb();
      }
    }
    const top = this.top;
    if (top) {
      top.update();
      if (this.game && top.countsPlaytime !== false && this.scenes.some((s) => s.countsPlaytime)) this.game.s.playtime++;
    }
    if (this.shakeT > 0) this.shakeT--;
    if (this.flashT > 0) this.flashT--;
  }

  render(): void {
    const ctx = this.screen.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    if (this.loadError) {
      this.renderError(ctx);
      this.screen.present();
      return;
    }
    if (this.loading) {
      ctx.fillStyle = '#8890b8';
      ctx.font = '8px monospace';
      ctx.fillText('Загрузка...', 130, 120);
      this.screen.present();
      return;
    }
    if (this.shakeT > 0) {
      const p = this.shakeP;
      ctx.setTransform(1, 0, 0, 1, Math.round((Math.random() * 2 - 1) * p), Math.round((Math.random() * 2 - 1) * p));
    }
    let start = 0;
    for (let i = this.scenes.length - 1; i >= 0; i--) {
      if (this.scenes[i].opaque) {
        start = i;
        break;
      }
    }
    for (let i = start; i < this.scenes.length; i++) this.scenes[i].render(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.flashT > 0) {
      ctx.globalAlpha = (this.flashT / this.flashMax) * 0.85;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      ctx.globalAlpha = 1;
    }
    if (this.fadeA > 0) {
      ctx.globalAlpha = this.fadeA;
      ctx.fillStyle = this.fadeColor;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      ctx.globalAlpha = 1;
    }
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,16,0.55)';
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      this.ui.window(ctx, 110, 104, 100, 30);
      this.ui.textCenter(ctx, this.t('ui.paused'), 160, 115);
    }
    this.screen.present();
  }

  private renderError(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#200010';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.fillStyle = '#ffb0b0';
    ctx.font = '8px monospace';
    const lines = (this.loadError ?? '').split('\n').slice(0, 26);
    lines.forEach((l, i) => ctx.fillText(l.slice(0, 64), 4, 10 + i * 9));
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.input.destroy();
    this.audio.destroy();
    this.screen.destroy();
    this.overlay.remove();
  }
}
