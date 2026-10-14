import type { App, Scene } from '../app.ts';
import { ListMenu, COLORS, formatTime, type MenuItem } from './ui.ts';
import { str } from '../core/i18n.ts';
import { Factories } from './registry.ts';
import { latestSlot, allSlots } from './save.ts';
import { Game } from './state.ts';
import { SceneRegistry } from '../app.ts';
import { makeCanvas } from '../gfx/pixel.ts';
import { Particles } from '../gfx/particles.ts';
import { Rng } from '../core/rng.ts';

function bigText(app: App, text: string, scale: number, fill: string, outline: string): HTMLCanvasElement {
  const w = app.font.measure(text) + 4;
  const [c, ctx] = makeCanvas(w, 12);
  app.font.draw(ctx, text, 2, 2, fill, null);
  const [big, bctx] = makeCanvas(w * scale + 4, 12 * scale + 4);
  bctx.imageSmoothingEnabled = false;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) {
    bctx.globalCompositeOperation = 'source-over';
    bctx.drawImage(c, 2 + dx * 2, 2 + dy * 2, w * scale, 12 * scale);
  }
  bctx.globalCompositeOperation = 'source-in';
  bctx.fillStyle = outline;
  bctx.fillRect(0, 0, big.width, big.height);
  bctx.globalCompositeOperation = 'source-over';
  const [inner, ictx] = makeCanvas(w * scale, 12 * scale);
  ictx.imageSmoothingEnabled = false;
  ictx.drawImage(c, 0, 0, w * scale, 12 * scale);
  ictx.globalCompositeOperation = 'source-in';
  const g = ictx.createLinearGradient(0, 0, 0, 12 * scale);
  g.addColorStop(0, '#fff8d0');
  g.addColorStop(0.45, fill);
  g.addColorStop(1, '#a02010');
  ictx.fillStyle = g;
  ictx.fillRect(0, 0, inner.width, inner.height);
  bctx.drawImage(inner, 2, 2);
  return big;
}

export class TitleScene implements Scene {
  opaque = true;
  private app: App;
  private menu: ListMenu;
  private t = 0;
  private idle = 0;
  private pressed = false;
  private logo: HTMLCanvasElement | null = null;
  private sub: HTMLCanvasElement | null = null;
  private stars: { x: number; y: number; b: number }[] = [];
  private fx = new Particles();
  private rng = new Rng(9);
  private msg: string | null = null;
  private msgT = 0;

  constructor(app: App) {
    this.app = app;
    const hasSave = latestSlot() !== null;
    const items: MenuItem[] = [
      { label: str.t('title.new'), value: 'new' },
      { label: str.t('title.continue'), value: 'continue', enabled: hasSave },
      { label: str.t('title.load'), value: 'load' },
      { label: str.t('title.settings'), value: 'settings' }
    ];
    if (app.opts.onExit) items.push({ label: str.t('title.exit'), value: 'exit' });
    this.menu = new ListMenu(items, 6);
    this.menu.index = hasSave ? 1 : 0;
    this.menu.soundMove = () => app.sfx('cursor');
    this.menu.soundBuzz = () => app.sfx('error');
    for (let i = 0; i < 90; i++) this.stars.push({ x: this.rng.range(0, 320), y: this.rng.range(0, 150), b: this.rng.range(0, 6.28) });
  }

  enter(): void {
    this.app.music('title');
  }

  resume(): void {
    this.app.music('title');
    this.idle = 0;
  }

  update(): void {
    this.t++;
    this.idle++;
    const inp = this.app.input;
    if (inp.anyPressed()) this.idle = 0;
    if (this.msgT > 0) this.msgT--;
    if (this.t % 4 === 0) this.fx.add({ x: this.rng.range(80, 240), y: 150, vx: this.rng.range(-0.3, 0.3), vy: this.rng.range(-0.9, -0.4), life: 70, size: 2, color: this.rng.pick(['#ff8030', '#ffd060', '#ff5020']), drag: 0.995 });
    this.fx.update();
    if (this.idle > 60 * 30 && !this.app.fading) {
      this.idle = 0;
      this.startAttract();
      return;
    }
    if (!this.pressed) {
      if (inp.pressed('confirm') || inp.pressed('menu')) {
        this.pressed = true;
        this.app.sfx('confirm');
      }
      return;
    }
    const r = this.menu.update(inp);
    if (r !== 'confirm') {
      if (r === 'cancel') this.pressed = false;
      return;
    }
    const v = this.menu.current?.value;
    this.app.sfx('cursor_ok');
    if (v === 'new') {
      this.app.music('stop');
      this.app.fadeOut(40, () => this.app.newGame());
    } else if (v === 'continue') {
      const s = latestSlot();
      if (s !== null) this.app.fadeOut(30, () => this.app.loadSlot(s));
    } else if (v === 'load') {
      if (Factories.save) this.app.push(Factories.save(this.app, 'load'));
    } else if (v === 'settings') {
      if (Factories.settings) this.app.push(Factories.settings(this.app));
    } else if (v === 'exit') this.app.opts.onExit?.();
  }

  private startAttract(): void {
    const app = this.app;
    app.fadeOut(40, () => {
      const g = new Game(app.data);
      g.setFlag('game_started');
      g.setFlag('attract');
      const sp = app.data.maps.vision_vault.spawns.start;
      g.s.map = { id: 'vision_vault', x: sp.x, y: sp.y, dir: 'up' };
      app.game = g;
      const f = SceneRegistry.map;
      if (!f) return;
      const scene = f(app) as Scene & { runner: { start(c: unknown[]): void } };
      const attract: Scene = {
        opaque: false,
        update: () => {
          if (app.input.anyPressed() && !app.fading) app.fadeOut(20, () => app.toTitle());
        },
        render: (ctx) => {
          app.ui.window(ctx, 110, 222, 100, 16, 'dark', 0.7);
          app.ui.textCenter(ctx, str.t('title.demo'), 160, 226, COLORS.dim);
        }
      };
      app.replaceAll(scene);
      scene.runner.start(app.data.events.attract_vision ?? []);
      app.push(attract);
      app.fadeIn(40);
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const g = ctx.createLinearGradient(0, 0, 0, 240);
    g.addColorStop(0, '#05030e');
    g.addColorStop(0.55, '#1a0c28');
    g.addColorStop(1, '#3a1410');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 320, 240);
    for (const s of this.stars) {
      const b = 0.5 + Math.sin(s.b + this.t / 40) * 0.5;
      ctx.fillStyle = b > 0.8 ? '#ffffff' : b > 0.4 ? '#9aa0d0' : '#4a4a70';
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
    }
    ctx.fillStyle = '#e8e0ff';
    ctx.beginPath();
    ctx.arc(250, 44, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a0c28';
    ctx.beginPath();
    ctx.arc(256, 40, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#12081a';
    ctx.beginPath();
    ctx.moveTo(0, 170);
    const peaks = [0, 150, 30, 120, 70, 140, 110, 100, 160, 130, 210, 95, 260, 135, 300, 115, 320, 140];
    for (let i = 0; i < peaks.length; i += 2) ctx.lineTo(peaks[i], peaks[i + 1]);
    ctx.lineTo(320, 170);
    ctx.fill();
    ctx.fillStyle = '#0a0410';
    ctx.fillRect(0, 160, 320, 80);
    for (let x = 0; x < 320; x += 18) {
      const h = 10 + ((x * 37) % 24);
      ctx.fillStyle = '#0a0410';
      ctx.fillRect(x, 160 - h, 14, h);
      if ((x / 18) % 3 === 0) {
        ctx.fillStyle = this.t % 90 < 60 || x % 4 ? '#f0c060' : '#6a4a20';
        ctx.fillRect(x + 4, 160 - h + 4, 2, 2);
      }
    }
    ctx.save();
    ctx.globalAlpha = 0.25 + Math.sin(this.t / 30) * 0.08;
    ctx.strokeStyle = '#60e0c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 240);
    ctx.bezierCurveTo(60, 170, 20, 110, 70, 60);
    ctx.moveTo(300, 240);
    ctx.bezierCurveTo(260, 180, 300, 120, 250, 80);
    ctx.stroke();
    ctx.restore();
    this.fx.render(ctx);
    const cx = 160;
    const cy = 64;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#c08040';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.stroke();
    const sym = ['#a0d0f0', '#60a0f0', '#90c060', '#ff6030'];
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 2 + this.t / 400;
      ctx.fillStyle = i === 3 ? sym[3] : i === 2 && this.t % 240 < 120 ? '#6a8040' : '#303050';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34, i === 3 ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (!this.logo) {
      this.logo = bigText(this.app, 'АВАТАР', 4, '#ffb040', '#2a0808');
      this.sub = bigText(this.app, str.t('title.sub'), 2, '#f0e0c0', '#1a0610');
    }
    ctx.drawImage(this.logo, Math.round(160 - this.logo.width / 2), 40);
    if (this.sub) ctx.drawImage(this.sub, Math.round(160 - this.sub.width / 2), 94);
    ui.textCenter(ctx, str.t('title.tag'), 160, 122, '#a090c0');
    if (!this.pressed) {
      if (Math.floor(this.t / 30) % 2 === 0) ui.textCenter(ctx, str.t('title.press'), 160, 180, '#ffffff');
    } else {
      const h = this.menu.items.length * 11 + 12;
      ui.window(ctx, 110, 150, 100, h);
      this.menu.render(ctx, ui, 128, 157, 80);
    }
    ui.text(ctx, str.t('title.copy'), 4, 230, '#504868');
    ui.textRight(ctx, 'v1.0 DEMO', 316, 230, '#504868');
    if (this.msg && this.msgT > 0) ui.textCenter(ctx, this.msg, 160, 136, COLORS.gold);
  }
}

export class SettingsScene implements Scene {
  opaque = true;
  private app: App;
  private idx = 0;
  private rows = ['atb', 'battleSpeed', 'textSpeed', 'music', 'sfx', 'crt', 'runDefault', 'lang'] as const;

  constructor(app: App) {
    this.app = app;
  }

  private value(k: (typeof this.rows)[number]): string {
    const s = this.app.settings;
    switch (k) {
      case 'atb':
        return str.t(s.atb === 'wait' ? 'settings.wait' : 'settings.active');
      case 'battleSpeed':
      case 'textSpeed':
        return '■'.repeat(s[k] + 1) + '□'.repeat(4 - s[k]);
      case 'music':
      case 'sfx':
        return '■'.repeat(s[k]) + '□'.repeat(10 - s[k]);
      case 'crt':
      case 'runDefault':
        return str.t(s[k] ? 'settings.on' : 'settings.off');
      case 'lang':
        return s.lang === 'ru' ? 'Русский' : 'English';
    }
  }

  private change(k: (typeof this.rows)[number], d: number): void {
    const s = this.app.settings;
    switch (k) {
      case 'atb':
        s.atb = s.atb === 'wait' ? 'active' : 'wait';
        break;
      case 'battleSpeed':
      case 'textSpeed':
        s[k] = Math.max(0, Math.min(4, s[k] + d));
        break;
      case 'music':
      case 'sfx':
        s[k] = Math.max(0, Math.min(10, s[k] + d));
        break;
      case 'crt':
      case 'runDefault':
        s[k] = !s[k];
        break;
      case 'lang':
        s.lang = s.lang === 'ru' ? 'en' : 'ru';
        break;
    }
    this.app.applySettings();
    this.app.sfx(k === 'sfx' ? 'confirm' : 'cursor');
  }

  update(): void {
    const inp = this.app.input;
    if (inp.repeat('up')) {
      this.idx = (this.idx + this.rows.length - 1) % this.rows.length;
      this.app.sfx('cursor');
    }
    if (inp.repeat('down')) {
      this.idx = (this.idx + 1) % this.rows.length;
      this.app.sfx('cursor');
    }
    if (inp.repeat('left')) this.change(this.rows[this.idx], -1);
    if (inp.repeat('right') || inp.pressed('confirm')) this.change(this.rows[this.idx], 1);
    if (inp.pressed('cancel') || inp.pressed('menu')) {
      this.app.sfx('cancel');
      this.app.pop();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    ctx.fillStyle = '#060818';
    ctx.fillRect(0, 0, 320, 240);
    ui.window(ctx, 4, 4, 312, 22);
    ui.text(ctx, str.t('settings.title'), 12, 11, COLORS.gold);
    ui.window(ctx, 4, 28, 312, 120);
    this.rows.forEach((k, i) => {
      const y = 36 + i * 13;
      ui.text(ctx, str.t(`settings.${k}`), 24, y, i === this.idx ? COLORS.gold : COLORS.text);
      ui.text(ctx, this.value(k), 178, y);
      if (i === this.idx) ui.cursor(ctx, 22, y);
    });
    ui.window(ctx, 4, 150, 312, 86);
    this.app.font.wrap(str.t(`settings.help.${this.rows[this.idx]}`), 296).forEach((l, i) => ui.text(ctx, l, 12, 158 + i * 11, COLORS.title));
    ui.text(ctx, str.t('settings.controls'), 12, 204, COLORS.dim);
    ui.text(ctx, str.t('settings.controls2'), 12, 215, COLORS.dim);
  }
}

export class TitleCardScene implements Scene {
  opaque = true;
  private app: App;
  private title: string;
  private sub: string | null;
  private frames: number;
  private t = 0;

  constructor(app: App, title: string, sub: string | null, frames: number) {
    this.app = app;
    this.title = title;
    this.sub = sub;
    this.frames = frames;
  }

  enter(): void {
    this.app.setFade(0);
  }

  exit(): void {
    this.app.setFade(1);
  }

  update(): void {
    this.t++;
    if (this.t > 40 && (this.app.input.pressed('confirm') || this.t >= this.frames)) this.app.pop();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 320, 240);
    const a = Math.min(1, this.t / 30, (this.frames - this.t) / 30);
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = '#c08040';
    ctx.fillRect(60, 112, 200, 1);
    ui.textCenter(ctx, this.title, 160, 98, '#f8e0b0');
    if (this.sub) ui.textCenter(ctx, this.sub, 160, 120, '#a090c0');
    ctx.globalAlpha = 1;
  }
}

export class NameScene implements Scene {
  opaque = true;
  private app: App;
  private done: (n: string) => void;
  private name: string;
  private grid: string[];
  private cx = 0;
  private cy = 0;
  private cols = 11;

  constructor(app: App, done: (n: string) => void) {
    this.app = app;
    this.done = done;
    this.name = app.game?.s.name ?? 'Иса';
    const ru = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя';
    const en = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-\'';
    this.grid = [...(app.settings.lang === 'en' ? en + ru : ru + en)];
  }

  enter(): void {
    this.app.setFade(0);
  }

  exit(): void {
    this.app.setFade(1);
  }

  private finish(): void {
    const n = this.name.trim() || 'Иса';
    this.done(n);
    this.app.sfx('confirm');
    this.app.pop();
  }

  update(): void {
    const inp = this.app.input;
    const rows = Math.ceil(this.grid.length / this.cols) + 1;
    for (const ch of inp.takeTyped()) {
      if (/^[A-Za-zА-Яа-яЁё\-']$/.test(ch) && this.name.length < 10) this.name += ch;
    }
    if (inp.repeat('left')) this.cx = (this.cx + this.cols - 1) % this.cols;
    if (inp.repeat('right')) this.cx = (this.cx + 1) % this.cols;
    if (inp.repeat('up')) this.cy = (this.cy + rows - 1) % rows;
    if (inp.repeat('down')) this.cy = (this.cy + 1) % rows;
    if (inp.repeat('left') || inp.repeat('right') || inp.repeat('up') || inp.repeat('down')) this.app.sfx('cursor');
    if (inp.pressed('cancel')) {
      this.name = this.name.slice(0, -1);
      this.app.sfx('cancel');
    }
    if (inp.pressed('menu')) this.finish();
    if (inp.pressed('confirm')) {
      if (this.cy === rows - 1) {
        if (this.cx < 4) this.name = this.name.slice(0, -1);
        else if (this.cx < 8) this.name = 'Иса';
        else return this.finish();
        this.app.sfx('cursor_ok');
        return;
      }
      const ch = this.grid[this.cy * this.cols + this.cx];
      if (ch && this.name.length < 10) {
        this.name += ch;
        this.app.sfx('cursor_ok');
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    ctx.fillStyle = '#060818';
    ctx.fillRect(0, 0, 320, 240);
    ui.window(ctx, 4, 4, 312, 60);
    ui.portrait(ctx, 'isa', 'normal', 12, 10, true);
    ui.text(ctx, str.t('name.prompt'), 68, 14, COLORS.title);
    ui.window(ctx, 68, 30, 120, 18, 'dark');
    ui.text(ctx, this.name + (Math.floor(this.app.frame / 20) % 2 ? '_' : ''), 74, 35, COLORS.gold);
    ui.window(ctx, 4, 66, 312, 170);
    const rows = Math.ceil(this.grid.length / this.cols);
    this.grid.forEach((ch, i) => {
      const x = 20 + (i % this.cols) * 27;
      const y = 74 + Math.floor(i / this.cols) * 11;
      ui.text(ctx, ch, x, y);
    });
    const by = 74 + rows * 11 + 4;
    ui.text(ctx, str.t('name.del'), 20, by, COLORS.text);
    ui.text(ctx, str.t('name.reset'), 128, by, COLORS.text);
    ui.text(ctx, str.t('name.ok'), 236, by, COLORS.gold);
    if (this.cy === rows) ui.cursor(ctx, this.cx < 4 ? 18 : this.cx < 8 ? 126 : 234, by);
    else ui.cursor(ctx, 18 + this.cx * 27, 74 + this.cy * 11);
    ui.text(ctx, str.t('name.hint'), 12, 226, COLORS.dim);
  }
}

export class GameOverScene implements Scene {
  opaque = true;
  private app: App;
  private t = 0;

  constructor(app: App) {
    this.app = app;
  }

  enter(): void {
    this.app.music('stop');
    this.app.setFade(0);
  }

  update(): void {
    this.t++;
    if (this.t > 90 && (this.app.input.pressed('confirm') || this.app.input.pressed('cancel'))) this.app.fadeOut(40, () => this.app.toTitle());
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 320, 240);
    const a = Math.min(1, this.t / 60);
    ctx.globalAlpha = a;
    ui.textCenter(ctx, str.t('gameover.title'), 160, 100, '#e05040');
    ui.textCenter(ctx, str.t('gameover.hint'), 160, 124, '#a090c0');
    if (this.t > 90 && Math.floor(this.t / 30) % 2) ui.textCenter(ctx, str.t('gameover.press'), 160, 160, COLORS.dim);
    ctx.globalAlpha = 1;
  }
}

export class RadioScene implements Scene {
  opaque = false;
  private app: App;
  private freq = 88.0;
  private t = 0;
  private playing: { id: string; lines: string[]; idx: number; t: number } | null = null;

  constructor(app: App) {
    this.app = app;
  }

  enter(): void {
    this.app.sfx('radio_on');
  }

  private stations() {
    const g = this.app.game;
    if (!g) return [];
    const map = g.data.maps[g.s.map.id];
    return g.data.radio.filter((r) => (r.region === map?.region || r.region === 'any') && g.test(r.if));
  }

  update(): void {
    this.t++;
    const inp = this.app.input;
    const g = this.app.game;
    if (!g) return;
    if (inp.pressed('cancel') || inp.pressed('extra')) {
      this.app.sfx('radio_off');
      this.app.pop();
      return;
    }
    if (this.playing) {
      this.playing.t++;
      if (inp.pressed('confirm') || this.playing.t > 240) {
        this.playing.idx++;
        this.playing.t = 0;
        if (this.playing.idx >= this.playing.lines.length) this.playing = null;
      }
      return;
    }
    const step = inp.down('run') ? 0.5 : 0.1;
    if (inp.repeat('left')) this.freq = Math.max(88, Math.round((this.freq - step) * 10) / 10);
    if (inp.repeat('right')) this.freq = Math.min(108, Math.round((this.freq + step) * 10) / 10);
    if (inp.repeat('left') || inp.repeat('right')) this.app.sfx('tick');
    const st = this.stations().find((s) => Math.abs(s.freq - this.freq) < 0.05);
    if (!st && this.t % 20 === 0) this.app.sfx('static');
    if (st && inp.pressed('confirm')) {
      const lines = str.dialogue(st.lines).map((l) => l.replace(/^[^|]*\|/, ''));
      this.playing = { id: st.id, lines, idx: 0, t: 0 };
      if (!g.s.radio.includes(st.id)) {
        g.s.radio.push(st.id);
        g.setFlag(st.flag);
        this.app.sfx('quest');
        const rq = g.data.quests.radio_voices;
        if (rq) g.setQuest('radio_voices', Math.min(rq.steps.length + 1, 1 + g.s.radio.length));
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const g = this.app.game;
    ui.window(ctx, 30, 40, 260, 120, 'gold');
    ui.text(ctx, str.t('radio.title'), 40, 48, COLORS.gold);
    ctx.fillStyle = '#201408';
    ctx.fillRect(44, 64, 232, 26);
    for (let f = 88; f <= 108; f += 2) {
      const x = 48 + ((f - 88) / 20) * 224;
      ctx.fillStyle = '#806030';
      ctx.fillRect(Math.round(x), 80, 1, 6);
      if (f % 4 === 0) this.app.font.draw(ctx, String(f), Math.round(x) - 5, 68, '#a08050', null);
    }
    const nx = 48 + ((this.freq - 88) / 20) * 224;
    ctx.fillStyle = '#ff4020';
    ctx.fillRect(Math.round(nx), 64, 1, 26);
    ui.textCenter(ctx, `${this.freq.toFixed(1)} МГц`, 160, 96, '#fff0c0');
    const st = this.stations().find((s) => Math.abs(s.freq - this.freq) < 0.05);
    if (this.playing) {
      const known = g?.data.radio.find((r) => r.id === this.playing?.id);
      ui.text(ctx, known?.name ?? '', 40, 110, COLORS.gold);
      const line = this.playing.lines[this.playing.idx] ?? '';
      this.app.font.wrap(line, 236).slice(0, 3).forEach((l, i) => ui.text(ctx, l, 40, 122 + i * 10));
    } else if (st) {
      ui.text(ctx, st.name, 40, 110, COLORS.gold);
      ui.text(ctx, str.t('radio.tune'), 40, 122, COLORS.text);
    } else {
      let noise = '';
      for (let i = 0; i < 30; i++) noise += '~-.·'[(i * 7 + this.t) % 4];
      ui.text(ctx, noise, 40, 114, '#6a6048');
    }
    ui.text(ctx, str.t('radio.help'), 40, 148, COLORS.dim);
  }
}

export class EndingScene implements Scene {
  opaque = true;
  private app: App;
  private t = 0;
  private stage = 0;
  private menu: ListMenu;

  constructor(app: App) {
    this.app = app;
    this.menu = new ListMenu([
      { label: str.t('ending.clean_save'), value: 'save' },
      { label: str.t('ending.to_title'), value: 'title' }
    ], 3);
    this.menu.soundMove = () => app.sfx('cursor');
  }

  enter(): void {
    this.app.music('finale');
    this.app.fadeIn(60);
    const g = this.app.game;
    if (g) {
      g.setFlag('demo_complete');
      g.s.chapter = 'ch2';
    }
  }

  resume(): void {
    this.app.music('finale');
  }

  update(): void {
    this.t++;
    const inp = this.app.input;
    if (this.stage === 0) {
      if (this.t > 120 && inp.pressed('confirm')) {
        this.stage = 1;
        this.app.sfx('confirm');
      }
      return;
    }
    const r = this.menu.update(inp);
    if (r !== 'confirm') return;
    const v = this.menu.current?.value;
    if (v === 'save' && Factories.save) {
      const g = this.app.game;
      if (g) {
        g.s.clean = true;
        g.healAll();
        g.s.map = { id: 'rc_rooftop_final', x: 9, y: 9, dir: 'down' };
      }
      this.app.push(Factories.save(this.app, 'clean'));
    } else if (v === 'title') this.app.fadeOut(60, () => this.app.toTitle());
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const g = this.app.game;
    ctx.fillStyle = '#04030a';
    ctx.fillRect(0, 0, 320, 240);
    const a = Math.min(1, this.t / 60);
    ctx.globalAlpha = a;
    ui.textCenter(ctx, str.t('ending.tbc'), 160, 26, '#f8e0b0');
    ui.textCenter(ctx, str.t('ending.next'), 160, 40, '#a090c0');
    if (g) {
      ui.window(ctx, 50, 58, 220, 120);
      const rows: [string, string][] = [
        [str.t('ending.time'), formatTime(g.s.playtime)],
        [str.t('ending.battles'), `${g.s.stats.wins}/${g.s.stats.battles}`],
        [str.t('ending.escapes'), `${g.s.stats.escapes}`],
        [str.t('ending.level'), `${g.cs('isa').level}`],
        [str.t('ending.secrets'), `${g.s.stats.secrets.length}`],
        [str.t('ending.chests'), `${g.s.stats.chests}`],
        [str.t('ending.quests'), `${Object.keys(g.data.quests).filter((q) => g.questDone(q)).length}/${Object.keys(g.data.quests).length}`],
        [str.t('ending.paisho'), `${g.s.paisho.beaten.length}/${g.data.paisho.opponents.length}`],
        [str.t('ending.radio'), `${g.s.radio.length}/${g.data.radio.length}`],
        [str.t('ending.gold'), `${g.s.gold}`]
      ];
      rows.forEach(([k, v], i) => {
        ui.text(ctx, k, 62, 66 + i * 11, COLORS.dim);
        ui.textRight(ctx, v, 258, 66 + i * 11);
      });
    }
    if (this.stage === 0 && this.t > 120 && Math.floor(this.t / 30) % 2) ui.textCenter(ctx, str.t('gameover.press'), 160, 196, COLORS.dim);
    if (this.stage === 1) {
      ui.window(ctx, 80, 184, 160, 36);
      this.menu.render(ctx, ui, 100, 191, 136);
    }
    ctx.globalAlpha = 1;
  }
}

export function slotSummary(): string {
  const s = allSlots().filter(Boolean).length;
  return `${s}`;
}
