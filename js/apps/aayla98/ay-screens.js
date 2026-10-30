(function (A) {
  'use strict';
  const SUNSET = ['#140e24', '#2a1c3c', '#5a2a48', '#9a4a42', '#d8783a', '#f4b45a'];
  const DIM = '#6a6070', HINT = '#a89a80';

  const big = (g, font, text, cx, y, scale, color) => {
    const F = A.Font, w = F.measure(font, text) + 2, c = document.createElement('canvas');
    c.width = w;
    c.height = 18;
    F.draw(c.getContext('2d'), font, text, 1, 1, color, '#05030a');
    g.imageSmoothingEnabled = false;
    g.drawImage(c, Math.round(cx - w * scale / 2), y, w * scale, 18 * scale);
  };

  const sky = ui => {
    if (!ui.skyCanvas) {
      const c = document.createElement('canvas');
      c.width = A.LW;
      c.height = A.LH;
      const s = c.getContext('2d');
      ui.gfx.band(s, 0, 170, SUNSET);
      ui.gfx.band(s, 170, 240, ['#2a1a18', '#140c0c']);
      s.fillStyle = '#ffe2a0';
      s.beginPath();
      s.arc(232, 170, 14, Math.PI, 0);
      s.fill();
      ui.skyCanvas = c;
    }
    return ui.skyCanvas;
  };

  const logo = (g, top) => {
    big(g, 'bold', 'STAR WARS', 320, top, 2, '#f4bf6a');
    big(g, 'bold', 'Aayla Secura', 320, top + 46, 3, '#ffffff');
    big(g, 'text', 'Twilight', 320, top + 116, 2, '#f4dca0');
  };

  const center = (g, font, text, y, color) => A.Font.draw(g, font, text, Math.round(320 - A.Font.measure(font, text) / 2), y, color, A.UIKit.SHADOW);

  const plate = (g, title, x, y) => {
    const F = A.Font, K = A.UIKit, w = F.measure('bold', title) + 28;
    K.bevel(g, x, y, w, 24, '#5a3a28', '#b08a5a', '#1a120c');
    F.draw(g, 'bold', title, x + 14, y + 4, K.GOLD, K.SHADOW);
  };

  const clock = sec => {
    const m = Math.floor((sec || 0) / 60);
    return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
  };

  const date = at => {
    const d = new Date(at), p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const chapterShort = id => (A.CHAPTERS[id] || { short: id }).short;

  class Menu {
    constructor(ui) {
      this.ui = ui;
      this.sound = ui.vn ? ui.vn.sound : new A.Audio(ui);
      this.sel = 0;
      this.hits = [];
      this.t = 0;
    }

    update(dt) { this.t += dt; }

    move(d, n) {
      this.sel = (this.sel + d + n) % n;
      this.sound.click();
    }

    click(x, y) {
      const h = this.hits.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
      if (h) h.fn();
      return true;
    }

    hover(x, y) {
      const h = this.hits.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
      if (h && h.hover) h.hover();
    }
  }

  A.ForgetScreen = class {
    constructor(ui, opts) {
      this.ui = ui;
      this.music = 'aayla';
      this.sound = ui.vn ? ui.vn.sound : new A.Audio(ui);
      this.names = opts.lost.map(id => A.SKILLS[id].name);
      this.level = opts.level;
      this.done = opts.done;
      this.t = 0;
      this.gone = 0;
      this.step = 0.6;
      this.fadeAt = 1.6;
      this.titleAt = this.fadeAt + this.names.length * this.step + 1.4;
    }

    shownLevel() {
      const k = Math.min(1, Math.max(0, (this.t - this.fadeAt) / (this.names.length * this.step)));
      return Math.max(1, Math.round(this.level - (this.level - 1) * k));
    }

    update(dt) {
      this.t += dt;
      const gone = Math.max(0, Math.min(this.names.length, Math.floor((this.t - this.fadeAt) / this.step) + 1));
      if (this.t >= this.fadeAt && gone > this.gone) {
        this.gone = gone;
        this.sound.sfx('fade');
      }
    }

    key(code) {
      if (code !== 'Enter' && code !== 'Space') return code !== 'Escape';
      if (this.t < this.titleAt) this.t = this.titleAt;
      else if (this.t > this.titleAt + 1.5) this.done();
      return true;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit;
      g.fillStyle = '#05030a';
      g.fillRect(0, 0, A.W, A.H);
      if (this.t < this.titleAt) {
        const head = 'Эйла Секура', lv = 'Уровень ' + this.shownLevel();
        F.draw(g, 'bold', head, Math.round(320 - F.measure('bold', head) / 2), 70, K.GOLD, K.SHADOW);
        F.draw(g, 'text', lv, Math.round(320 - F.measure('text', lv) / 2), 92, K.INK, K.SHADOW);
        const rows = Math.ceil(this.names.length / 2);
        this.names.forEach((name, i) => {
          const col = i < rows ? 0 : 1, row = i % rows, x = col ? 352 : 128, y = 140 + row * 26;
          const fadeStart = this.fadeAt + i * this.step, a = this.t < fadeStart ? Math.min(1, this.t / 0.8) : Math.max(0, 1 - (this.t - fadeStart) / 0.45);
          if (a <= 0) return;
          g.globalAlpha = a;
          F.draw(g, 'text', name, x, y, '#e8d8b0', K.SHADOW);
          g.fillStyle = '#e83a2a';
          g.fillRect(x - 14, y + 6, 8, 2);
          g.globalAlpha = 1;
        });
        return;
      }
      const k = Math.min(1, (this.t - this.titleAt) / 1.5);
      g.globalAlpha = k;
      g.imageSmoothingEnabled = false;
      g.drawImage(sky(this.ui), 0, 0, A.LW, A.LH, 0, 0, A.W, A.H);
      logo(g, 110);
      g.globalAlpha = 1;
      if (this.t > this.titleAt + 1.5) {
        const hint = A.Input.label('ok', this.ui.device) + ': дальше';
        F.draw(g, 'text', hint, Math.round(320 - F.measure('text', hint) / 2), 430, K.INK, K.SHADOW);
      }
    }
  };

  A.ChapterCard = class {
    constructor(ui, opts) {
      this.ui = ui;
      this.id = opts.id;
      this.done = opts.done;
      this.t = 0;
    }

    update(dt) {
      this.t += dt;
      if (this.t > 3) this.finish();
    }

    finish() {
      if (this.over) return;
      this.over = true;
      this.done();
    }

    key(code) {
      if (code === 'Enter' || code === 'Space') this.finish();
      return true;
    }

    draw(gfx) {
      const g = gfx.g, K = A.UIKit, info = A.CHAPTERS[this.id] || { short: '', name: this.id };
      g.fillStyle = '#05030a';
      g.fillRect(0, 0, A.W, A.H);
      g.globalAlpha = Math.min(1, this.t / 0.6, Math.max(0, (3 - this.t) / 0.5));
      center(g, 'bold', info.short, 190, K.GOLD);
      const m = /«(.+)»/.exec(info.name);
      big(g, 'bold', m ? m[1] : info.name, 320, 214, 2, '#f4ecd8');
      g.globalAlpha = 1;
    }
  };

  A.CreditsScreen = class {
    constructor(ui, opts) {
      this.ui = ui;
      this.done = opts.done;
      this.ending = opts.ending || 'felucia';
      this.music = 'temple';
      this.t = 0;
      this.speed = 26;
      this.thumbs = new Map();
      const C = A.CREDITS, rows = [];
      const add = (kind, text, extra) => rows.push(Object.assign({ kind, text }, extra || {}));
      add('big', 'Star Wars: Aayla Secura');
      add('title', 'Twilight');
      add('gap');
      for (const s of C.studio) add('line', s);
      add('gap');
      add('cg', A.CHAPTERS.ch7.name, { cg: C.endings[this.ending] || C.endings.felucia });
      for (const [ch, cg] of C.chapters) add('cg', A.CHAPTERS[ch].name, { cg });
      add('gap');
      add('head', 'По мотивам');
      for (const [what, who] of C.sources) {
        add('line', what);
        add('dim', who);
      }
      add('gap');
      add('dim', C.thanks);
      add('gap');
      add('title', 'Спасибо, что играли');
      this.rows = rows;
      let y = 0;
      for (const r of rows) {
        r.y = y;
        y += r.kind === 'cg' ? 150 : r.kind === 'gap' ? 30 : r.kind === 'big' ? 40 : 24;
      }
      this.length = y;
    }

    thumb(id) {
      if (!this.thumbs.has(id)) {
        const c = document.createElement('canvas');
        c.width = A.W;
        c.height = A.H;
        A.Art.drawCg(c.getContext('2d'), id);
        this.thumbs.set(id, c);
      }
      return this.thumbs.get(id);
    }

    update(dt) {
      this.t += dt;
      if (this.offset() > this.length + 40) this.finish();
    }

    offset() {
      return this.t * this.speed - A.H;
    }

    finish() {
      if (this.over) return;
      this.over = true;
      this.done();
    }

    key(code) {
      if (code === 'Escape') this.finish();
      if (code === 'Enter' || code === 'Space') this.speed = this.speed > 30 ? 26 : 120;
      return true;
    }

    draw(gfx) {
      const g = gfx.g, K = A.UIKit, F = A.Font, off = this.offset();
      g.fillStyle = '#05030a';
      g.fillRect(0, 0, A.W, A.H);
      for (const r of this.rows) {
        const y = Math.round(r.y - off);
        if (y < -160 || y > A.H + 20) continue;
        if (r.kind === 'big') big(g, 'bold', r.text, 320, y, 2, K.GOLD);
        if (r.kind === 'title') center(g, 'bold', r.text, y, '#f4ecd8');
        if (r.kind === 'head') center(g, 'bold', r.text, y, K.GOLD);
        if (r.kind === 'line') center(g, 'text', r.text, y, '#e8d8b8');
        if (r.kind === 'dim') center(g, 'text', r.text, y, '#9a8a70');
        if (r.kind === 'cg') {
          g.imageSmoothingEnabled = false;
          g.drawImage(this.thumb(r.cg), 240, y, 160, 120);
          g.strokeStyle = '#8a7448';
          g.strokeRect(239.5, y - 0.5, 161, 121);
          center(g, 'text', r.text, y + 126, '#e8d8b8');
        }
      }
      F.draw(g, 'text', 'Enter: быстрее · Esc: в главное меню', 12, A.H - 20, '#5a5048', K.SHADOW);
    }
  };

  A.TitleScreen = class extends Menu {
    constructor(ui) {
      super(ui);
      this.music = 'aayla';
      this.latest = ui.latestSave();
      this.items = [
        { id: 'new', label: 'Новая игра', on: true },
        { id: 'continue', label: 'Продолжить', on: !!this.latest },
        { id: 'load', label: 'Загрузить', on: !!this.latest },
        { id: 'album', label: 'Альбом', on: false, why: 'откроется на этапе 17' },
        { id: 'settings', label: 'Настройки', on: true }
      ];
      if (ui.opts.onExit) this.items.push({ id: 'exit', label: 'Выход', on: true });
      this.sel = this.latest ? 1 : 0;
    }

    pick(i) {
      const it = this.items[i];
      if (!it || !it.on) return;
      this.sound.click();
      const ui = this.ui;
      if (it.id === 'new') ui.newGame();
      if (it.id === 'continue') ui.loadGame(this.latest.blob);
      if (it.id === 'load') ui.openSaves('load', () => ui.showTitle());
      if (it.id === 'settings') ui.openSettings(() => ui.showTitle());
      if (it.id === 'exit') ui.opts.onExit();
    }

    key(code) {
      const n = this.items.length;
      if (code === 'ArrowUp' || code === 'KeyW') this.move(-1, n);
      else if (code === 'ArrowDown' || code === 'KeyS') this.move(1, n);
      else if (code === 'Enter' || code === 'Space') this.pick(this.sel);
      return true;
    }

    background(g) {
      const b = this.latest && this.latest.blob, map = b && b.S.field && b.S.field.map && A.Maps.DEFS[b.S.field.map];
      if (map && map.bg && A.Art.LIST.bg[map.bg]) {
        A.Art.drawBg(g, map.bg, A.Art.LIST.bg[map.bg].times[0]);
        g.fillStyle = 'rgba(8,6,16,0.55)';
        g.fillRect(0, 0, A.W, A.H);
        return;
      }
      g.imageSmoothingEnabled = false;
      g.drawImage(sky(this.ui), 0, 0, A.LW, A.LH, 0, 0, A.W, A.H);
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit;
      this.background(g);
      logo(g, 46);
      this.hits = [];
      const w = 260, x = 320 - w / 2, y = 222, h = 20 + this.items.length * 24;
      K.bevel(g, x, y, w, h, 'rgba(20,14,32,0.92)', '#d8b884', '#4a3020');
      this.items.forEach((it, i) => {
        const iy = y + 10 + i * 24, on = i === this.sel;
        if (on) {
          g.fillStyle = it.on ? K.GOLD : '#5a5060';
          g.fillRect(x + 8, iy, w - 16, 22);
        }
        center(g, 'bold', it.label, iy + 3, on ? '#1c1840' : it.on ? K.INK : DIM);
        this.hits.push({ x: x + 8, y: iy, w: w - 16, h: 22, hover: () => { this.sel = i; }, fn: () => { this.sel = i; this.pick(i); } });
      });
      const cur = this.items[this.sel];
      let note = cur.why || '';
      if (cur.id === 'continue' && this.latest) {
        const m = this.latest.blob.meta;
        note = [chapterShort(m.chapter), m.place, clock(m.time)].filter(Boolean).join(' · ');
      }
      if (note) center(g, 'text', note, y + h + 10, HINT);
      center(g, 'text', 'Midnight Studio / LucasArts (2001) / Win 98 Edition', 452, '#c8b8a0');
    }
  };

  A.SaveScreen = class extends Menu {
    constructor(ui, opts) {
      super(ui);
      this.mode = opts.mode;
      this.back = opts.back;
      this.reload();
      this.sel = 0;
      this.confirm = null;
      this.thumbs = new Map();
    }

    reload() {
      const all = A.Save.list(this.ui.store());
      this.rows = this.mode === 'save' ? all.filter(e => e.kind === 'slot') : all;
    }

    thumb(e) {
      const src = e.blob && e.blob.meta.thumb;
      if (!src) return null;
      let img = this.thumbs.get(src);
      if (!img) {
        img = new Image();
        img.src = src;
        this.thumbs.set(src, img);
      }
      return img.complete && img.naturalWidth ? img : null;
    }

    pick(i) {
      const e = this.rows[i];
      if (!e) return;
      if (this.mode === 'load') {
        if (!e.blob) return;
        this.sound.click();
        this.ui.loadGame(e.blob);
        return;
      }
      if (e.blob && !this.confirm) {
        this.confirm = { i, yes: false };
        this.sound.click();
        return;
      }
      this.ui.saveTo(e.key, 'slot', e.name);
      this.confirm = null;
      this.reload();
      this.back();
    }

    key(code) {
      if (this.confirm) {
        if (code === 'ArrowLeft' || code === 'ArrowRight' || code === 'KeyA' || code === 'KeyD') this.confirm.yes = !this.confirm.yes;
        else if (code === 'Enter' || code === 'Space') {
          if (this.confirm.yes) this.pick(this.confirm.i);
          else this.confirm = null;
        } else if (code === 'Escape') this.confirm = null;
        return true;
      }
      const n = this.rows.length;
      if (code === 'ArrowUp' || code === 'KeyW') this.move(-1, n);
      else if (code === 'ArrowDown' || code === 'KeyS') this.move(1, n);
      else if (code === 'Enter' || code === 'Space') this.pick(this.sel);
      else if (code === 'Escape' || code === 'Backspace') this.back();
      return true;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit;
      g.fillStyle = '#100c18';
      g.fillRect(0, 0, A.W, A.H);
      g.fillStyle = 'rgba(255,255,255,0.03)';
      for (let y = 0; y < A.H; y += 2) g.fillRect(0, y, A.W, 1);
      plate(g, this.mode === 'save' ? 'Сохранить игру' : 'Загрузить игру', 24, 16);
      this.hits = [];
      const lx = 24, ly = 52, rh = 31;
      K.bevel(g, lx - 6, ly - 6, 388, this.rows.length * rh + 10, 'rgba(26,18,30,0.95)', '#8a6a48', '#1a120c');
      this.rows.forEach((e, i) => {
        const y = ly + i * rh, on = i === this.sel;
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.22)';
          g.fillRect(lx - 2, y - 2, 380, rh - 2);
        }
        F.draw(g, 'bold', e.name, lx + 4, y, on ? K.GOLD : K.INK, K.SHADOW);
        if (e.blob) {
          const m = e.blob.meta;
          F.draw(g, 'text', [chapterShort(m.chapter), m.place].filter(Boolean).join(' · '), lx + 4, y + 14, '#c8b8a0', K.SHADOW);
          const d = date(e.blob.at);
          F.draw(g, 'text', d, lx + 372 - F.measure('text', d), y, HINT, K.SHADOW);
        } else F.draw(g, 'text', 'пусто', lx + 4, y + 14, DIM, K.SHADOW);
        this.hits.push({ x: lx - 2, y: y - 2, w: 380, h: rh - 2, hover: () => { if (!this.confirm) this.sel = i; }, fn: () => { if (this.confirm) return; this.sel = i; this.pick(i); } });
      });
      const e = this.rows[this.sel], px = 422, py = 52;
      K.bevel(g, px - 6, py - 6, 206, 300, 'rgba(26,18,30,0.95)', '#8a6a48', '#1a120c');
      g.fillStyle = '#05030a';
      g.fillRect(px + 14, py + 4, 160, 120);
      const img = e && this.thumb(e);
      if (img) g.drawImage(img, px + 14, py + 4, 160, 120);
      else center2(g, e && e.blob ? 'без миниатюры' : 'пусто', px + 94, py + 58);
      if (e && e.blob) {
        const m = e.blob.meta, lines = [(A.CHAPTERS[m.chapter] || { name: m.chapter }).name, m.place, 'Время в игре ' + clock(m.time), date(e.blob.at)];
        let y = py + 136;
        for (const l of lines.filter(Boolean)) for (const w of F.wrap('text', l, 186)) { F.draw(g, 'text', w, px + 4, y, K.INK, K.SHADOW); y += 16; }
      }
      const hint = `${A.Input.label('ok', this.ui.device)}: ${this.mode === 'save' ? 'сохранить' : 'загрузить'}    ${A.Input.label('back', this.ui.device)}: назад`;
      F.draw(g, 'text', hint, 24, 452, HINT, K.SHADOW);
      if (this.confirm) {
        const t = `Перезаписать: ${this.rows[this.confirm.i].name}?`, w = F.measure('bold', t) + 60, x = 320 - w / 2;
        K.bevel(g, x, 190, w, 76, 'rgba(20,14,32,0.97)', '#d8b884', '#4a3020');
        center(g, 'bold', t, 202, K.GOLD);
        ['Нет', 'Да'].forEach((label, k) => {
          const on = this.confirm.yes === (k === 1), bx = 320 - 90 + k * 100;
          if (on) {
            g.fillStyle = K.GOLD;
            g.fillRect(bx, 232, 80, 22);
          }
          F.draw(g, 'bold', label, bx + 40 - F.measure('bold', label) / 2, 235, on ? '#1c1840' : K.INK, on ? null : K.SHADOW);
          this.hits.unshift({ x: bx, y: 232, w: 80, h: 22, hover: () => { this.confirm.yes = k === 1; }, fn: () => { this.confirm.yes = k === 1; this.key('Enter'); } });
        });
      }
    }
  };

  const center2 = (g, text, cx, y) => A.Font.draw(g, 'text', text, Math.round(cx - A.Font.measure('text', text) / 2), y, DIM, A.UIKit.SHADOW);

  A.MemoryScreen = class extends Menu {
    constructor(ui, opts) {
      super(ui);
      this.back = opts.back;
      this.S = ui.state;
      this.list = A.MEMORY.slice().sort((a, b) => b.at - a.at || a.id - b.id);
      this.now = 31;
      this.sel = Math.max(0, this.list.findIndex(e => A.Memory.has(this.S, e.id)));
      this.stills = new Map();
    }

    key(code) {
      const n = this.list.length;
      if (code === 'ArrowLeft' || code === 'KeyA' || code === 'ArrowUp' || code === 'KeyW') this.move(-1, n);
      else if (code === 'ArrowRight' || code === 'KeyD' || code === 'ArrowDown' || code === 'KeyS') this.move(1, n);
      else if (code === 'Escape' || code === 'Backspace' || code === 'Enter' || code === 'Space') this.back();
      return true;
    }

    x(at) {
      return Math.round(56 + (A.Memory.FROM - at) / (A.Memory.FROM - this.now) * 528);
    }

    still(id) {
      return pictureOf(this.stills, id);
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit, S = this.S;
      g.fillStyle = '#120e14';
      g.fillRect(0, 0, A.W, A.H);
      g.fillStyle = 'rgba(216,184,132,0.04)';
      for (let y = 0; y < A.H; y += 3) g.fillRect(0, y, A.W, 1);
      plate(g, 'Память', 24, 16);
      const found = (S.memory || []).length, total = A.MEMORY.filter(e => !e.gap).length, will = A.Memory.will(S);
      F.draw(g, 'text', `Обрывков найдено: ${found} из ${total}` + (will ? `    Связная память: Воля +${will}` : ''), 180, 20, HINT, K.SHADOW);
      const ly = 124;
      g.fillStyle = '#8a6a48';
      g.fillRect(56, ly, 528, 2);
      for (let y = A.Memory.FROM; y >= this.now; y -= 1) {
        const x = this.x(y), major = (y % 4 === 0 && y - this.now >= 3) || y === this.now;
        g.fillStyle = major ? '#c8a878' : '#6a5440';
        g.fillRect(x, ly - (major ? 4 : 2), 1, major ? 10 : 6);
        if (major) {
          const t = y === this.now ? y + ' ДБЯ' : String(y);
          F.draw(g, 'text', t, Math.round(x - F.measure('text', t) / 2), ly + 10, '#a08a6a', K.SHADOW);
        }
      }
      this.hits = [];
      this.list.forEach((e, i) => {
        const x = this.x(e.at), up = i % 2 === 0, y = up ? ly - 34 - (i % 4 === 0 ? 0 : 12) : ly + 30 + (i % 4 === 1 ? 0 : 12);
        const told = e.gap && A.Memory.told(S), has = A.Memory.has(S, e.id) || told, pale = A.Memory.faded(S, e.id), on = i === this.sel;
        g.fillStyle = '#5a4630';
        g.fillRect(x, Math.min(y + 8, ly), 1, Math.abs(ly - (y + 8)));
        const col = e.gap && !told ? null : told ? '#7ad8c8' : has ? (pale ? '#a8b8d0' : '#f4bf6a') : '#3a3034';
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.35)';
          g.fillRect(x - 11, y - 3, 22, 22);
        }
        if (col) {
          g.fillStyle = has ? 'rgba(244,191,106,0.25)' : 'rgba(0,0,0,0)';
          g.fillRect(x - 9, y - 1, 18, 18);
          g.fillStyle = col;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x + 8, y + 8);
          g.lineTo(x, y + 16);
          g.lineTo(x - 8, y + 8);
          g.closePath();
          g.fill();
        } else {
          g.strokeStyle = '#a08a6a';
          g.setLineDash([2, 2]);
          g.strokeRect(x - 7.5, y + 0.5, 15, 15);
          g.setLineDash([]);
        }
        const num = String(e.id);
        F.draw(g, 'bold', num, Math.round(x - F.measure('bold', num) / 2), y + 1, has ? '#2a1a08' : '#8a7a80', null);
        this.hits.push({ x: x - 10, y: y - 2, w: 20, h: 20, hover: () => { this.sel = i; }, fn: () => { this.sel = i; } });
      });
      const e = this.list[this.sel], told = e.gap && A.Memory.told(S), has = A.Memory.has(S, e.id) || told, px = 24, py = 196;
      K.bevel(g, px, py, 592, 240, 'rgba(26,18,22,0.95)', '#8a6a48', '#1a120c');
      g.fillStyle = '#05030a';
      g.fillRect(px + 12, py + 12, 240, 180);
      if (has) {
        g.imageSmoothingEnabled = false;
        g.drawImage(this.still(told ? e.told : e.still), px + 12, py + 12, 240, 180);
        if (A.Memory.faded(S, e.id)) { g.fillStyle = 'rgba(120,140,170,0.4)'; g.fillRect(px + 12, py + 12, 240, 180); }
      } else center2(g, e.gap ? 'пустое место' : '?', px + 132, py + 96);
      const tx = px + 268;
      F.draw(g, 'bold', `${e.id}. ${told ? e.toldTitle : has || e.gap ? e.title : 'Не найден'}`, tx, py + 14, has ? K.GOLD : '#c8b8a0', K.SHADOW);
      if (e.year) F.draw(g, 'text', e.year, tx, py + 32, HINT, K.SHADOW);
      let y = py + 54;
      const text = told ? e.toldText : e.gap ? e.text : has ? e.text : 'Обрывок ещё не вернулся.';
      for (const l of F.wrap('text', text, 300)) { F.draw(g, 'text', l, tx, y, K.INK, K.SHADOW); y += 16; }
      if (has && !e.gap) {
        y += 8;
        const ready = A.Memory.ready(S, e.id), what = (ready ? 'Вернулось: ' : 'Вернётся в главе 3: ') + A.Memory.reward(e);
        for (const l of F.wrap('text', what, 300)) { F.draw(g, 'text', l, tx, y, ready ? '#a8d8a0' : '#a8b8d0', K.SHADOW); y += 16; }
        if (A.Memory.faded(S, e.id)) F.draw(g, 'text', 'Бледный обрывок: его вытащил Пло Кун.', tx, y + 4, '#a8b8d0', K.SHADOW);
      }
      F.draw(g, 'text', `Стрелки: выбрать    ${A.Input.label('back', this.ui.device)}: назад`, 24, 452, HINT, K.SHADOW);
    }
  };

  A.PartyScreen = class extends Menu {
    constructor(ui, opts) {
      super(ui);
      this.back = opts.back;
      this.S = ui.state;
      A.Party.ensure(this.S);
    }

    key(code) {
      const n = Math.max(1, this.S.party.length);
      if (code === 'ArrowLeft' || code === 'KeyA' || code === 'ArrowUp' || code === 'KeyW') this.move(-1, n);
      else if (code === 'ArrowRight' || code === 'KeyD' || code === 'ArrowDown' || code === 'KeyS') this.move(1, n);
      else if (code === 'Escape' || code === 'Backspace' || code === 'Enter' || code === 'Space') this.back();
      return true;
    }

    sources(S, m) {
      const out = [], skills = A.Party.skills(S, m);
      const mem = A.Memory.skills(S);
      for (const id of skills) {
        const sk = A.SKILLS[id];
        const from = m.id !== 'aayla' ? 'свой приём' : A.GIFTS.includes(id) ? 'дар Каркко' : mem.includes(id) ? 'память' : 'основа';
        out.push([sk.name, from, !!sk.gift]);
      }
      return out;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit, S = this.S;
      g.fillStyle = '#0e1418';
      g.fillRect(0, 0, A.W, A.H);
      g.fillStyle = 'rgba(120,200,255,0.04)';
      for (let y = 0; y < A.H; y += 3) g.fillRect(0, y, A.W, 1);
      plate(g, 'Отряд', 24, 16);
      this.hits = [];
      S.party.forEach((m, i) => {
        const h = A.HEROES[A.heroId(m)], x = 160 + i * 120, on = i === this.sel;
        K.bevel(g, x, 16, 110, 24, on ? '#5a4a28' : 'rgba(26,30,36,0.9)', '#8a7a5a', '#1a1612');
        F.draw(g, 'bold', h.name, x + 55 - F.measure('bold', h.name) / 2, 20, on ? K.GOLD : K.INK, K.SHADOW);
        this.hits.push({ x, y: 16, w: 110, h: 24, hover: () => { this.sel = i; }, fn: () => { this.sel = i; } });
      });
      const m = S.party[this.sel];
      if (!m) return;
      const hid = A.heroId(m), h = A.HEROES[hid], st = A.Party.stats(S, m);
      K.bevel(g, 24, 56, 200, 340, 'rgba(20,26,32,0.95)', '#5a7a8a', '#0a1014');
      let c = this.cache && this.cache[hid + S.chapter];
      if (!c) {
        this.cache = this.cache || {};
        c = this.cache[hid + S.chapter] = A.Pix.battle(A.Party.look(S, hid), 'idle0', A.Party.armed(S, m.id) ? undefined : 'none').canvas();
      }
      g.imageSmoothingEnabled = false;
      g.drawImage(c, 76, 90, 96, 128);
      if (m.id === 'aayla') {
        const d = S.dark || 0;
        F.draw(g, 'text', 'Тьма ' + d, 40, 248, d >= 70 ? '#ff6a5a' : d >= 40 ? '#ffa080' : '#c8c0d0', K.SHADOW);
        g.fillStyle = '#05060a';
        g.fillRect(40, 268, 168, 10);
        g.fillStyle = d >= 70 ? '#c82a2a' : d >= 40 ? '#c86a3a' : '#6a5a8a';
        g.fillRect(41, 269, Math.round(166 * d / 100), 8);
        for (const mark of [40, 70]) {
          g.fillStyle = '#e8d8b0';
          g.fillRect(41 + Math.round(166 * mark / 100), 266, 1, 14);
        }
        const note = d >= 70 ? 'Тьма сильна, дары открыты' : d >= 40 ? 'тёмные дары открыты' : 'Тьма не мешает';
        F.draw(g, 'text', note, 40, 286, '#a89a80', K.SHADOW);
      }
      const tx = 244;
      K.bevel(g, tx, 56, 372, 340, 'rgba(20,26,32,0.95)', '#5a7a8a', '#0a1014');
      F.draw(g, 'bold', `${h.name} · уровень ${m.level}`, tx + 14, 66, K.GOLD, K.SHADOW);
      const next = A.xpFor(m.level + 1) - (m.xp || 0);
      F.draw(g, 'text', h.retinue ? 'Свита: павшего Каркко заменяет другим' : `Опыт ${m.xp || 0}, до следующего уровня ${Math.max(0, next)}`, tx + 14, 86, '#a8b8c0', K.SHADOW);
      const rows = [['Здоровье', `${m.hp}/${st.hp}`], ['Сила', `${m.fp}/${st.fp}`], ['Мощь', st.mig], ['Воля', st.wil], ['Ловкость', st.agi], ['Стойкость', st.sta]];
      rows.forEach(([k, v], i) => {
        F.draw(g, 'text', k, tx + 14, 112 + i * 18, K.INK, K.SHADOW);
        F.draw(g, 'text', String(v), tx + 150, 112 + i * 18, '#e8f0f8', K.SHADOW);
      });
      F.draw(g, 'bold', 'Приёмы', tx + 14, 230, K.GOLD, K.SHADOW);
      this.sources(S, m).forEach(([name, from, gift], i) => {
        const col = i % 2, row = Math.floor(i / 2), x = tx + 14 + col * 180, y = 250 + row * 16;
        F.draw(g, 'text', `${name} · ${from}`, x, y, gift ? '#ff8a7a' : '#c8d8e0', K.SHADOW);
      });
      F.draw(g, 'text', `Стрелки: другой герой    ${A.Input.label('back', this.ui.device)}: назад`, 24, 452, HINT, K.SHADOW);
    }
  };

  A.SettingsScreen = class extends Menu {
    constructor(ui, opts) {
      super(ui);
      this.back = opts.back;
      this.rows = [
        { id: 'cps', name: 'Скорость текста', values: [[25, 'медленно'], [45, 'обычно'], [80, 'быстро'], [9999, 'сразу']] },
        { id: 'music', name: 'Громкость музыки', values: Array.from({ length: 11 }, (_, i) => [i * 10, i * 10 + ' %']) },
        { id: 'sfx', name: 'Громкость звуков', values: Array.from({ length: 11 }, (_, i) => [i * 10, i * 10 + ' %']) },
        { id: 'difficulty', name: 'Сложность', values: [['story', 'Рассказ'], ['normal', 'Обычная'], ['master', 'Мастер']] },
        { id: 'done', name: 'Готово' }
      ];
    }

    change(d) {
      const r = this.rows[this.sel];
      if (!r.values) return;
      const s = this.ui.settings, i = r.values.findIndex(v => v[0] === s[r.id]);
      const next = r.values[Math.max(0, Math.min(r.values.length - 1, (i < 0 ? 0 : i) + d))];
      s[r.id] = next[0];
      this.ui.applySettings();
      this.sound.click();
    }

    key(code) {
      const n = this.rows.length;
      if (code === 'ArrowUp' || code === 'KeyW') this.move(-1, n);
      else if (code === 'ArrowDown' || code === 'KeyS') this.move(1, n);
      else if (code === 'ArrowLeft' || code === 'KeyA') this.change(-1);
      else if (code === 'ArrowRight' || code === 'KeyD') this.change(1);
      else if (code === 'Enter' || code === 'Space') { if (this.rows[this.sel].id === 'done') this.back(); else this.change(1); }
      else if (code === 'Escape' || code === 'Backspace') this.back();
      return true;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit, s = this.ui.settings;
      g.fillStyle = '#100c18';
      g.fillRect(0, 0, A.W, A.H);
      plate(g, 'Настройки', 24, 16);
      this.hits = [];
      const x = 120, w = 400;
      K.bevel(g, x - 8, 90, w + 16, this.rows.length * 34 + 16, 'rgba(26,18,30,0.95)', '#8a6a48', '#1a120c');
      this.rows.forEach((r, i) => {
        const y = 100 + i * 34, on = i === this.sel;
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.22)';
          g.fillRect(x, y - 4, w, 28);
        }
        F.draw(g, 'bold', r.name, x + 12, y + 2, on ? K.GOLD : K.INK, K.SHADOW);
        if (r.values) {
          const v = r.values.find(q => q[0] === s[r.id]) || r.values[0], t = `< ${v[1]} >`;
          F.draw(g, 'text', t, x + w - 16 - F.measure('text', t), y + 2, K.INK, K.SHADOW);
        }
        this.hits.push({ x, y: y - 4, w, h: 28, hover: () => { this.sel = i; }, fn: () => { this.sel = i; this.key('Enter'); } });
      });
      if (this.ui.state && this.ui.inGame()) center(g, 'text', 'Сложность меняется сразу и для этой игры.', 300, HINT);
      F.draw(g, 'text', 'Стрелки влево и вправо: изменить', 24, 452, HINT, K.SHADOW);
    }
  };

  const iconOf = (cache, id) => {
    let c = cache.get('icon:' + id);
    if (!c) {
      c = A.Art.stillIcon(id).canvas();
      cache.set('icon:' + id, c);
    }
    return c;
  };

  const pictureOf = (cache, id) => {
    const real = A.Art.image(A.Art.stillFile(id));
    if (real) return real;
    let c = cache.get('still:' + id);
    if (!c) {
      c = document.createElement('canvas');
      c.width = A.LW;
      c.height = A.LH;
      const s = c.getContext('2d');
      s.imageSmoothingEnabled = false;
      s.drawImage(A.Art.stillPixels(id).canvas(), 0, 0);
      s.drawImage(iconOf(cache, id), 100, 75, 120, 90);
      cache.set('still:' + id, c);
    }
    return c;
  };

  const lines = (g, text, x, y, w, max, color) => {
    const F = A.Font, out = F.wrap('text', text, w);
    out.slice(0, max).forEach((l, i) => F.draw(g, 'text', i === max - 1 && out.length > max ? l.replace(/\s*\S*$/, '…') : l, x, y + i * 16, color, A.UIKit.SHADOW));
    return Math.min(max, out.length);
  };

  const pick = (list, from, d) => {
    const n = list.length;
    for (let k = 1; k <= n; k++) {
      const i = (from + d * k + n * 4) % n;
      if (list[i]) return i;
    }
    return from;
  };

  A.PalaceScreen = class extends Menu {
    constructor(ui, opts) {
      super(ui);
      this.music = 'memory';
      this.S = ui.state;
      this.done = opts.done;
      this.cache = new Map();
      this.order = A.Memory.slots();
      this.gapAt = this.order.findIndex(id => A.Memory.get(id).gap);
      this.slots = this.order.map(() => null);
      const have = A.Memory.pieces(this.S), prev = this.S.palace && this.S.palace.order;
      if (prev) {
        let k = 0;
        this.order.forEach((id, i) => {
          if (i === this.gapAt) return;
          const v = prev[k++];
          if (v && have.includes(v) && !this.slots.includes(v)) this.slots[i] = v;
        });
      }
      this.tray = have.filter(id => !this.slots.includes(id)).sort((a, b) => A.Memory.get(a).title.localeCompare(A.Memory.get(b).title, 'ru'));
      this.area = this.tray.length ? 'tray' : 'line';
      this.sel = this.area === 'tray' ? 0 : this.order.findIndex((id, i) => i !== this.gapAt);
      this.hand = null;
      this.result = null;
    }

    focus() {
      if (this.hand) return this.hand;
      if (this.area === 'tray') return this.tray[this.sel] || null;
      return this.sel === this.gapAt ? this.order[this.gapAt] : this.slots[this.sel];
    }

    move(d) {
      if (this.area === 'tray') this.sel = this.tray.length ? (this.sel + d + this.tray.length) % this.tray.length : 0;
      else this.sel = pick(this.order.map((id, i) => i !== this.gapAt), this.sel, d);
      this.sound.click();
    }

    swapArea() {
      if (this.area === 'tray') {
        this.area = 'line';
        const x = this.sel / Math.max(1, this.tray.length - 1);
        this.sel = Math.round(x * (this.order.length - 1));
        if (this.sel === this.gapAt) this.sel++;
      } else if (this.tray.length || this.hand) {
        this.area = 'tray';
        this.sel = Math.min(this.tray.length, Math.round(this.sel / (this.order.length - 1) * Math.max(0, this.tray.length - 1)));
      }
      this.sound.click();
    }

    act() {
      if (this.area === 'tray') {
        if (this.hand) {
          this.tray.splice(Math.min(this.sel, this.tray.length), 0, this.hand);
          this.hand = null;
        } else if (this.tray[this.sel]) {
          this.hand = this.tray.splice(this.sel, 1)[0];
          this.sel = Math.min(this.sel, Math.max(0, this.tray.length - 1));
          if (!this.tray.length) {
            this.area = 'line';
            this.sel = this.slots.findIndex((v, i) => !v && i !== this.gapAt);
            if (this.sel < 0) this.sel = 0;
          }
        }
      } else if (this.sel !== this.gapAt) {
        const was = this.slots[this.sel];
        if (this.hand) {
          this.slots[this.sel] = this.hand;
          this.hand = was || null;
        } else if (was) {
          this.hand = was;
          this.slots[this.sel] = null;
        }
      }
      this.sound.click();
    }

    unplace() {
      if (this.hand) {
        this.tray.push(this.hand);
        this.hand = null;
      } else if (this.area === 'line' && this.sel !== this.gapAt && this.slots[this.sel]) {
        this.tray.push(this.slots[this.sel]);
        this.slots[this.sel] = null;
      }
      this.sound.click();
    }

    finish() {
      if (this.result) return;
      if (this.hand) { this.tray.push(this.hand); this.hand = null; }
      const order = this.slots.filter((v, i) => i !== this.gapAt);
      const pairs = A.Memory.arrange(this.S, order);
      this.result = { pairs, will: A.Memory.will(this.S), t: this.t };
      this.sound.sfx('heal');
    }

    close() {
      if (this.closed) return;
      this.closed = true;
      this.done();
    }

    update(dt) {
      this.t += dt;
      if (this.result && this.t - this.result.t > 2.4) this.close();
    }

    key(code) {
      if (this.result) {
        if (this.t - this.result.t > 0.3 && (code === 'Enter' || code === 'Space' || code === 'Escape')) this.close();
        return true;
      }
      if (code === 'ArrowLeft' || code === 'KeyA') this.move(-1);
      else if (code === 'ArrowRight' || code === 'KeyD') this.move(1);
      else if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') this.swapArea();
      else if (code === 'Enter' || code === 'Space') this.act();
      else if (code === 'Backspace') this.unplace();
      else if (code === 'Escape') this.finish();
      return true;
    }

    slotX(i) {
      return Math.round(28 + i * (A.W - 56 - 44) / (this.order.length - 1));
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit, S = this.S;
      g.fillStyle = '#120e10';
      g.fillRect(0, 0, A.W, A.H);
      g.fillStyle = 'rgba(216,184,132,0.05)';
      for (let x = 0; x < A.W; x += 4) g.fillRect(x, 0, 1, A.H);
      plate(g, 'Дворец памяти', 24, 12);
      F.draw(g, 'text', 'Расставь обрывки по линии жизни. Подсказки внутри картинок.', 192, 16, HINT, K.SHADOW);
      const ly = 144;
      g.fillStyle = '#8a6a48';
      g.fillRect(24, ly, 592, 2);
      F.draw(g, 'text', A.Memory.FROM + ' ДБЯ', 24, ly + 26, '#a08a6a', K.SHADOW);
      F.draw(g, 'text', '30 ДБЯ', 616 - F.measure('text', '30 ДБЯ'), ly + 26, '#a08a6a', K.SHADOW);
      this.hits = [];
      this.order.forEach((id, i) => {
        const x = this.slotX(i), y = 96, on = this.area === 'line' && this.sel === i, gap = i === this.gapAt;
        g.fillStyle = '#c8a878';
        g.fillRect(x + 22, ly - 6, 1, 14);
        const yr = String(Math.round(A.Memory.get(id).at));
        F.draw(g, 'text', yr, Math.round(x + 22 - F.measure('text', yr) / 2), ly + 8, '#b09a78', K.SHADOW);
        K.bevel(g, x, y, 44, 34, on ? '#5a4628' : '#1e1612', on ? K.GOLD : '#6a5440', '#0a0806');
        const v = gap ? (A.Memory.told(S) ? A.Memory.get(id).told : null) : this.slots[i] ? A.Memory.get(this.slots[i]).still : null;
        g.imageSmoothingEnabled = false;
        if (v) {
          g.drawImage(iconOf(this.cache, v), x + 2, y + 2, 40, 30);
          if (!gap && A.Memory.faded(S, this.slots[i])) { g.fillStyle = 'rgba(120,140,170,0.45)'; g.fillRect(x + 2, y + 2, 40, 30); }
        } else if (gap) {
          g.strokeStyle = '#a08a6a';
          g.setLineDash([2, 2]);
          g.strokeRect(x + 4.5, y + 4.5, 35, 25);
          g.setLineDash([]);
          F.draw(g, 'bold', '?', x + 19, y + 9, '#a08a6a', K.SHADOW);
        }
        this.hits.push({ x, y, w: 44, h: 34, hover: () => { this.area = 'line'; this.sel = i; }, fn: () => { this.area = 'line'; this.sel = i; this.act(); } });
      });
      const fid = this.focus(), fe = fid && A.Memory.get(fid), px = 24, py = 186;
      K.bevel(g, px, py, 592, 132, 'rgba(26,18,22,0.95)', '#8a6a48', '#1a120c');
      g.fillStyle = '#05030a';
      g.fillRect(px + 10, py + 10, 150, 112);
      if (fe) {
        const told = fe.gap && A.Memory.told(S);
        if (!fe.gap || told) g.drawImage(pictureOf(this.cache, told ? fe.told : fe.still), px + 10, py + 10, 150, 112);
        else center2(g, 'пусто', px + 85, py + 58);
        const tx = px + 176;
        F.draw(g, 'bold', fe.gap ? (told ? fe.toldTitle : 'Пустое место') : fe.title, tx, py + 12, K.GOLD, K.SHADOW);
        let y = py + 34;
        if (!fe.gap && A.Memory.faded(S, fid)) {
          F.draw(g, 'text', A.Memory.ready(S, fid) ? 'Бледный обрывок, умение вернулось' : 'Бледный обрывок: умение вернётся в главе 3', tx, y, '#a8b8d0', K.SHADOW);
          y += 18;
        }
        const hint = fe.gap ? (told ? fe.toldText : 'Здесь был рассказ Квинлана о войне Старка. Он не вернулся.') : A.Memory.HINTS[fid];
        lines(g, hint, tx, y, 400, 5, K.INK);
        if (this.hand) F.draw(g, 'text', 'В руке. Enter: поставить', tx, py + 110, '#ffd080', K.SHADOW);
      } else center2(g, 'Выбери обрывок или место на линии', 320, py + 58);
      F.draw(g, 'bold', 'Обрывки', 24, 326, K.GOLD, K.SHADOW);
      if (!this.tray.length) F.draw(g, 'text', 'все на линии', 100, 326, HINT, K.SHADOW);
      this.tray.forEach((id, k) => {
        const x = 24 + k * 54, y = 346, on = this.area === 'tray' && this.sel === k;
        K.bevel(g, x, y, 50, 40, on ? '#5a4628' : '#1e1612', on ? K.GOLD : '#6a5440', '#0a0806');
        g.drawImage(iconOf(this.cache, A.Memory.get(id).still), x + 5, y + 5, 40, 30);
        if (A.Memory.faded(S, id)) { g.fillStyle = 'rgba(120,140,170,0.45)'; g.fillRect(x + 5, y + 5, 40, 30); }
        this.hits.push({ x, y, w: 50, h: 40, hover: () => { this.area = 'tray'; this.sel = k; }, fn: () => { this.area = 'tray'; this.sel = k; this.act(); } });
      });
      if (this.hand) {
        const hx = this.area === 'tray' ? 24 + Math.min(this.sel, 10) * 54 + 30 : this.slotX(this.sel) + 26, hy = this.area === 'tray' ? 332 : 74;
        K.bevel(g, hx, hy, 44, 34, '#6a5430', '#ffd080', '#2a1c0c');
        g.drawImage(iconOf(this.cache, A.Memory.get(this.hand).still), hx + 2, hy + 2, 40, 30);
      }
      K.bevel(g, 516, 402, 100, 28, '#4a3a22', '#c8a050', '#1a1208');
      F.draw(g, 'bold', 'Готово', 566 - F.measure('bold', 'Готово') / 2, 408, K.GOLD, K.SHADOW);
      this.hits.push({ x: 516, y: 402, w: 100, h: 28, fn: () => this.finish() });
      F.draw(g, 'text', 'Стрелки: выбрать    Enter: взять или поставить    Backspace: убрать    Esc: готово', 24, 452, HINT, K.SHADOW);
      if (this.result) {
        g.fillStyle = 'rgba(8,6,10,0.8)';
        g.fillRect(0, 0, A.W, A.H);
        center(g, 'bold', 'Связная память', 196, K.GOLD);
        center(g, 'text', this.result.pairs ? `Соседей на своих местах: ${this.result.pairs}. Воля +${this.result.will}` : 'Ни одна пара не встала на место. Воля прежняя', 222, K.INK);
      }
    }
  };

  A.RespiteScreen = class extends Menu {
    constructor(ui, opts) {
      super(ui);
      this.music = 'temple';
      this.S = ui.state;
      this.id = opts.id;
      this.pick = opts.pick;
      this.def = A.RESPITES[this.id];
      this.place = A.Respite.place(this.id);
      this.rooms = this.place.rooms;
      this.sel = Math.max(0, this.rooms.findIndex(r => this.options(r).length));
      this.mode = 'rooms';
      this.act = 0;
    }

    options(room) {
      return A.Respite.options(this.S, this.id, room.id);
    }

    people(room) {
      return A.Respite.people(this.S, this.id).filter(p => p.room === room.id);
    }

    open(i) {
      const list = this.options(this.rooms[i]);
      if (!list.length) { this.sound.click(); return; }
      this.sel = i;
      this.mode = 'acts';
      this.act = Math.max(0, list.findIndex(o => o.enabled));
      this.sound.click();
    }

    choose(k) {
      const o = this.options(this.rooms[this.sel])[k];
      if (!o || !o.enabled || !this.S.respite || this.S.respite.left <= 0) return;
      this.sound.click();
      this.pick(o);
    }

    key(code) {
      if (this.mode === 'acts') {
        const n = this.options(this.rooms[this.sel]).length;
        if (code === 'ArrowUp' || code === 'KeyW') { this.act = (this.act + n - 1) % n; this.sound.click(); }
        else if (code === 'ArrowDown' || code === 'KeyS') { this.act = (this.act + 1) % n; this.sound.click(); }
        else if (code === 'Enter' || code === 'Space') this.choose(this.act);
        else if (code === 'Escape' || code === 'Backspace') { this.mode = 'rooms'; this.sound.click(); }
        return true;
      }
      const n = this.rooms.length;
      if (code === 'ArrowLeft' || code === 'KeyA') this.move(-1, n);
      else if (code === 'ArrowRight' || code === 'KeyD') this.move(1, n);
      else if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') this.move(3, n);
      else if (code === 'Enter' || code === 'Space') this.open(this.sel);
      else if (code === 'Escape') return false;
      return true;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit, S = this.S, R = S.respite || { left: 0 };
      g.fillStyle = '#1c1812';
      g.fillRect(0, 0, A.W, A.H);
      for (let y = 0; y < A.H; y += 24) for (let x = (y / 24) % 2 ? 0 : 24; x < A.W; x += 48) {
        g.fillStyle = 'rgba(200,184,138,0.05)';
        g.fillRect(x, y, 46, 22);
      }
      plate(g, 'Передышка · ' + this.place.name, 24, 12);
      const year = this.def.years && this.def.years[Math.min(this.def.years.length - 1, this.def.count - R.left)];
      F.draw(g, 'text', 'Передышка ' + this.def.when + '. Одно занятие, одна сцена.' + (year ? ' Сейчас ' + year + '.' : ''), 24, 44, HINT, K.SHADOW);
      F.draw(g, 'text', 'Занятия', 446, 18, HINT, K.SHADOW);
      for (let i = 0; i < this.def.count; i++) {
        const x = 512 + i * 22, lit = i < R.left;
        g.fillStyle = '#3a3024';
        g.fillRect(x - 1, 32, 12, 4);
        g.fillStyle = lit ? '#ffd27a' : '#2a2420';
        g.beginPath();
        g.ellipse(x + 5, 24, 6, 8, 0, 0, Math.PI * 2);
        g.fill();
        if (lit) {
          g.fillStyle = 'rgba(255,210,122,0.25)';
          g.beginPath();
          g.arc(x + 5, 24, 13, 0, Math.PI * 2);
          g.fill();
        }
      }
      this.hits = [];
      this.rooms.forEach((room, i) => {
        const list = this.options(room), folk = this.people(room), on = i === this.sel, empty = !list.length && !folk.length;
        const x = room.x - 40, y = room.y - 30, w = 176, h = 130;
        K.bevel(g, x, y, w, h, on ? 'rgba(70,58,32,0.95)' : empty ? 'rgba(30,26,22,0.9)' : 'rgba(44,38,28,0.95)', on ? K.GOLD : empty ? '#4a4034' : '#8a7448', '#0c0a06');
        F.draw(g, 'bold', room.name, x + 10, y + 6, empty ? '#6a6050' : on ? K.GOLD : '#e8d8b0', K.SHADOW);
        folk.forEach((p, k) => {
          const bd = A.BONDS[p.who], c = A.CAST[p.who] || (bd && A.CAST[bd.who]) || { name: p.who, plate: '#6a6a7a' }, cx = x + 20, cy = y + 38 + k * 28, tx = cx + 16;
          g.fillStyle = c.plate || '#6a6a7a';
          g.beginPath();
          g.arc(cx, cy, 10, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = '#0c0a06';
          g.stroke();
          const full = bd && !A.CAST[p.who] ? bd.name : c.name, initial = full[0];
          F.draw(g, 'bold', initial, Math.round(cx - F.measure('bold', initial) / 2), cy - 8, '#fff4dc', K.SHADOW);
          const nm = (bd && !A.CAST[p.who] ? full : full.split(' ')[0]) + (p.via ? ': ' + p.viaName : '');
          F.draw(g, 'text', nm, tx, cy - 10, '#e8d8b8', K.SHADOW);
          if (p.last) {
            const tag = 'последний раз', after = tx + F.measure('text', nm) + 8, fits = after + F.measure('text', tag) <= x + w - 8;
            F.draw(g, 'text', tag, fits ? after : tx + (p.bond ? A.Bonds.max(p.who) * 8 + 6 : 0), fits ? cy - 10 : cy + 1, '#ff9a7a', K.SHADOW);
          }
          if (p.bond) {
            const max = A.Bonds.max(p.who);
            for (let s2 = 0; s2 < max; s2++) {
              g.fillStyle = s2 < p.rank ? '#7ad8ff' : '#3a4448';
              g.fillRect(tx + s2 * 8, cy + 7, 6, 3);
            }
          }
        });
        if (empty) F.draw(g, 'text', 'здесь пусто', x + 10, y + 56, '#6a6050', K.SHADOW);
        const top = y + 34 + folk.length * 28;
        list.slice(0, Math.max(1, Math.floor((y + h - 6 - top) / 16))).forEach((o, k) => {
          const t = o.act === 'train' ? o.name.replace('Тренировка: ', '') : o.name.split(':')[0];
          F.draw(g, 'text', '· ' + t, x + 10, top + k * 16, o.enabled ? '#c8e0a0' : '#7a7060', K.SHADOW);
        });
        this.hits.push({ x, y, w, h, hover: () => { if (this.mode === 'rooms') this.sel = i; }, fn: () => { if (this.mode === 'rooms') this.open(i); else if (i !== this.sel) { this.mode = 'rooms'; this.sel = i; } } });
      });
      const px = 24, py = 384;
      K.bevel(g, px, py, 592, 60, 'rgba(20,16,12,0.96)', '#8a7448', '#0c0a06');
      const room = this.rooms[this.sel], list = this.options(room);
      if (this.mode === 'acts') {
        list.forEach((o, k) => {
          const y = py + 6 + k * 16 - Math.max(0, this.act - 2) * 16;
          if (y < py + 2 || y > py + 46) return;
          const on = k === this.act;
          if (on) { g.fillStyle = 'rgba(244,191,106,0.18)'; g.fillRect(px + 6, y - 1, 300, 16); }
          F.draw(g, 'text', o.name, px + 10, y, !o.enabled ? '#7a7060' : on ? K.GOLD : K.INK, K.SHADOW);
          this.hits.push({ x: px + 6, y: y - 1, w: 300, h: 16, hover: () => { this.act = k; }, fn: () => { this.act = k; this.choose(k); } });
        });
        const o = list[this.act];
        if (o) lines(g, o.enabled ? o.about : 'Нельзя: ' + o.why, px + 320, py + 6, 262, 3, o.enabled ? '#c8d8b0' : '#ff9a7a');
      } else {
        const folk = this.people(room).filter(p => p.last);
        const text = list.length ? 'Enter: выбрать занятие в этой комнате.' : 'Здесь сейчас нечем заняться.';
        F.draw(g, 'text', text, px + 10, py + 6, K.INK, K.SHADOW);
        if (folk.length) F.draw(g, 'text', folk.map(p => (A.CAST[p.who] || A.BONDS[p.who] || { name: p.who }).name).join(', ') + ': рядом в последний раз, в следующих передышках не будет.', px + 10, py + 24, '#ff9a7a', K.SHADOW);
      }
      F.draw(g, 'text', this.mode === 'acts' ? 'Стрелки: занятие    Enter: начать    Esc: к комнатам' : `Стрелки: комната    Enter: открыть    ${A.Input.label('menu', this.ui.device)}: меню`, 24, 452, HINT, K.SHADOW);
    }
  };


  A.DossierScreen = class extends Menu {
    constructor(ui, opts) {
      super(ui);
      this.back = opts.back;
      this.S = ui.state;
      this.music = 'cover';
    }

    key(code) {
      if (['Escape', 'Backspace', 'Enter', 'Space'].includes(code)) { this.sound.click(); this.back(); }
      return true;
    }

    click() {
      this.key('Enter');
      return true;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit, S = this.S, d = A.Cover.def(S) || Object.values(A.COVERS)[0];
      g.fillStyle = '#0c0e10';
      g.fillRect(0, 0, A.W, A.H);
      K.bevel(g, 70, 30, 500, 420, '#1c2420', '#5a7a6a', '#0a100c');
      g.fillStyle = '#0e1612';
      g.fillRect(84, 44, 472, 392);
      g.fillStyle = 'rgba(120,220,160,0.05)';
      for (let y = 44; y < 436; y += 3) g.fillRect(84, y, 472, 1);
      F.draw(g, 'bold', 'ДАТАПАД ТОЛМА · ДОСЬЕ', 100, 54, '#8ae0b0', K.SHADOW);
      F.draw(g, 'bold', d.alias, 100, 80, K.GOLD, K.SHADOW);
      F.draw(g, 'text', d.name, 100 + F.measure('bold', d.alias) + 12, 80, '#a8c8b8', K.SHADOW);
      let y = 104;
      y += 16 * lines(g, d.legend, 100, y, 440, 2, K.INK) + 10;
      F.draw(g, 'bold', 'Можно', 100, y, '#a8e8a0', K.SHADOW);
      y += 18;
      for (const t of d.allowed) { F.draw(g, 'text', '· ' + t, 108, y, '#c8e8c8', K.SHADOW); y += 16; }
      y += 8;
      F.draw(g, 'bold', 'Выдаст', 100, y, '#ffa080', K.SHADOW);
      y += 18;
      for (const t of d.gives) { F.draw(g, 'text', '· ' + t, 108, y, '#f0c8b8', K.SHADOW); y += 16; }
      y += 8;
      F.draw(g, 'bold', 'Нужные сведения', 100, y, '#8ae0b0', K.SHADOW);
      y += 18;
      for (const [k, t] of d.intel) {
        const has = !!S.flags[k];
        g.fillStyle = has ? '#8ae0b0' : '#2a3a32';
        g.fillRect(108, y + 4, 8, 8);
        F.draw(g, 'text', t, 124, y, has ? '#e8f8f0' : '#8aa898', K.SHADOW);
        y += 16;
      }
      if (S.cover) F.draw(g, 'text', 'Подозрение сейчас: ' + Math.round(S.cover.sus) + ' из 100', 100, 404, S.cover.sus >= 70 ? '#ffa080' : '#a8c8b8', K.SHADOW);
      F.draw(g, 'text', 'Enter: закрыть датапад', 380, 404, HINT, K.SHADOW);
    }
  };

  A.ShopScreen = class extends Menu {
    constructor(ui, opts) {
      super(ui);
      this.back = opts.back;
      this.S = ui.state;
      this.note = null;
    }

    buy(i) {
      const id = A.SHOP.items[i][0], r = A.Shop.buy(this.S, id);
      this.note = r.ok ? 'Куплено: ' + A.ITEMS[id].name : 'Нельзя: ' + r.why;
      this.sound.click();
    }

    key(code) {
      const n = A.SHOP.items.length;
      if (code === 'ArrowUp' || code === 'KeyW') this.move(-1, n);
      else if (code === 'ArrowDown' || code === 'KeyS') this.move(1, n);
      else if (code === 'Enter' || code === 'Space') this.buy(this.sel);
      else if (code === 'Escape' || code === 'Backspace') this.back();
      return true;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit, S = this.S;
      g.fillStyle = '#140c08';
      g.fillRect(0, 0, A.W, A.H);
      plate(g, A.SHOP.name, 24, 16);
      F.draw(g, 'text', 'Кредиты: ' + (S.credits || 0), 460, 20, K.GOLD, K.SHADOW);
      this.hits = [];
      A.SHOP.items.forEach(([id, price], i) => {
        const y = 80 + i * 44, on = i === this.sel, it = A.ITEMS[id];
        K.bevel(g, 40, y, 560, 36, on ? '#4a3420' : '#24180e', on ? K.GOLD : '#6a4a2a', '#0a0604');
        F.draw(g, 'bold', it.name, 54, y + 4, on ? K.GOLD : K.INK, K.SHADOW);
        F.draw(g, 'text', it.about, 54, y + 19, '#c8b8a0', K.SHADOW);
        F.draw(g, 'text', price + ' кр.', 470, y + 4, (S.credits || 0) >= price ? '#e8d8b0' : '#8a6a5a', K.SHADOW);
        F.draw(g, 'text', 'есть: ' + (S.items[id] || 0), 470, y + 19, '#a8a090', K.SHADOW);
        this.hits.push({ x: 40, y, w: 560, h: 36, hover: () => { this.sel = i; }, fn: () => { this.sel = i; this.buy(i); } });
      });
      if (this.note) F.draw(g, 'text', this.note, 40, 420, '#a8e8a0', K.SHADOW);
      F.draw(g, 'text', `Стрелки: товар    Enter: купить    ${A.Input.label('back', this.ui.device)}: назад`, 24, 452, HINT, K.SHADOW);
    }
  };

  A.RepairScreen = class extends Menu {
    constructor(ui, opts) {
      super(ui);
      this.def = A.REPAIRS[opts.id];
      this.rot = A.Repair.start(opts.id);
      this.name = opts.name || this.def.name;
      this.done = opts.done;
      this.cx = 0;
      this.cy = this.def.from;
      this.won = false;
    }

    turn(x, y) {
      if (this.won) return;
      this.cx = x;
      this.cy = y;
      A.Repair.turn(this.rot, x, y);
      this.sound.click();
      if (A.Repair.solved(this.def, this.rot)) {
        this.won = true;
        this.sound.sfx('heal');
      }
    }

    key(code) {
      const d = this.def;
      if (this.won) {
        if (code === 'Enter' || code === 'Space' || code === 'Escape') this.done(true);
        return true;
      }
      if (code === 'ArrowLeft' || code === 'KeyA') this.cx = (this.cx + d.w - 1) % d.w;
      else if (code === 'ArrowRight' || code === 'KeyD') this.cx = (this.cx + 1) % d.w;
      else if (code === 'ArrowUp' || code === 'KeyW') this.cy = (this.cy + d.h - 1) % d.h;
      else if (code === 'ArrowDown' || code === 'KeyS') this.cy = (this.cy + 1) % d.h;
      else if (code === 'Enter' || code === 'Space') this.turn(this.cx, this.cy);
      else if (code === 'Escape' || code === 'Backspace') this.done(false);
      return true;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit, d = this.def, S = 56, w = d.w * S, h = d.h * S;
      const x0 = Math.round(320 - w / 2), y0 = Math.round(250 - h / 2), lit = A.Repair.lit(d, this.rot), L = id => A.Input.label(id, this.ui.device);
      g.fillStyle = '#0c0a12';
      g.fillRect(0, 0, A.W, A.H);
      plate(g, 'Починка: ' + this.name, 24, 16);
      F.draw(g, 'text', 'Поверните плитки так, чтобы ток дошёл от источника слева до выхода справа.', 24, 60, '#c8c0d8', K.SHADOW);
      K.bevel(g, x0 - 20, y0 - 20, w + 40, h + 40, '#1a1a24', '#6a6a7a', '#0a0a10');
      this.hits = [];
      for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) {
        const X = x0 + x * S, Y = y0 + y * S, on = lit.has(x + ',' + y), cur = x === this.cx && y === this.cy && !this.won;
        K.bevel(g, X + 2, Y + 2, S - 4, S - 4, cur ? '#2e2a40' : '#20202a', cur ? K.GOLD : '#4a4a5a', '#0a0a10');
        const m = A.Repair.mask(A.Repair.type(d, x, y), this.rot[y][x]), c = S / 2;
        g.fillStyle = on ? '#ffd860' : '#6a6a7a';
        g.fillRect(X + c - 5, Y + c - 5, 10, 10);
        if (m & 1) g.fillRect(X + c - 3, Y + 4, 6, c - 4);
        if (m & 2) g.fillRect(X + c, Y + c - 3, c - 4, 6);
        if (m & 4) g.fillRect(X + c - 3, Y + c, 6, c - 4);
        if (m & 8) g.fillRect(X + 4, Y + c - 3, c - 4, 6);
        this.hits.push({ x: X, y: Y, w: S, h: S, hover: () => { if (!this.won) { this.cx = x; this.cy = y; } }, fn: () => (this.won ? this.done(true) : this.turn(x, y)) });
      }
      g.fillStyle = '#ffd860';
      g.fillRect(x0 - 18, y0 + d.from * S + S / 2 - 5, 16, 10);
      F.draw(g, 'bold', 'ток', x0 - 54, y0 + d.from * S + S / 2 - 8, '#ffd860', K.SHADOW);
      g.fillStyle = this.won ? '#6ad06a' : '#7a2a1a';
      g.fillRect(x0 + w + 2, y0 + d.to * S + S / 2 - 5, 16, 10);
      F.draw(g, 'bold', 'выход', x0 + w + 22, y0 + d.to * S + S / 2 - 8, this.won ? '#a8f0a0' : '#c8a090', K.SHADOW);
      if (this.won) {
        const t = `Заработало! ${L('ok')}: дальше`;
        F.draw(g, 'bold', t, Math.round(320 - F.measure('bold', t) / 2), y0 + h + 34, '#a8f0a0', K.SHADOW);
      }
      F.draw(g, 'text', `${L('move')}: плитка    ${L('ok')}: повернуть    ${L('back')}: бросить работу`, 24, 452, HINT, K.SHADOW);
    }
  };

  const NODE_ORDER = ['tholme', 'vos', 'traa', 'kit', 'bly', 'villie', 'secura', 'ekria'];

  A.BondsScreen = class extends Menu {
    constructor(ui, opts) {
      super(ui);
      this.back = opts.back;
      this.S = ui.state;
      this.known = A.Bonds.known(this.S);
      this.ids = NODE_ORDER.filter(id => A.BONDS[id]);
      this.sel = Math.max(0, this.ids.findIndex(id => this.known.includes(id)));
      this.cache = new Map();
    }

    key(code) {
      const mask = this.ids.map(id => this.known.includes(id));
      if (code === 'ArrowLeft' || code === 'KeyA' || code === 'ArrowUp' || code === 'KeyW') { this.sel = pick(mask, this.sel, -1); this.sound.click(); }
      else if (code === 'ArrowRight' || code === 'KeyD' || code === 'ArrowDown' || code === 'KeyS') { this.sel = pick(mask, this.sel, 1); this.sound.click(); }
      else if (code === 'Escape' || code === 'Backspace' || code === 'Enter' || code === 'Space') this.back();
      return true;
    }

    bust(id) {
      const d = A.BONDS[id], key = 'bust:' + id;
      let c = this.cache.get(key);
      if (!c) {
        c = A.Art.bustPixels(d.who, { slot: 'center', outfit: d.outfit, face: 'calm', lekku: 'still' }, 0).canvas();
        this.cache.set(key, c);
      }
      return c;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit, S = this.S;
      g.fillStyle = '#06121a';
      g.fillRect(0, 0, A.W, A.H);
      g.fillStyle = 'rgba(90,200,255,0.06)';
      for (let y = 0; y < A.H; y += 3) g.fillRect(0, y, A.W, 1);
      plate(g, 'Связи', 24, 12);
      const cx = 192, cy = 246;
      g.strokeStyle = 'rgba(120,210,255,0.18)';
      for (const r of [60, 110, 160]) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); }
      this.hits = [];
      this.ids.forEach((id, i) => {
        const a = -Math.PI / 2 + i * Math.PI * 2 / this.ids.length, nx = Math.round(cx + Math.cos(a) * 150), ny = Math.round(cy + Math.sin(a) * 140);
        const known = this.known.includes(id), b = A.Bonds.get(S, id), max = A.Bonds.max(id), on = i === this.sel;
        if (known) {
          const free = A.Bonds.released(S, id);
          for (let s = 0; s < max; s++) {
            const t0 = 0.18 + s / max * 0.7, t1 = t0 + 0.7 / max - 0.03;
            g.strokeStyle = s < b.rank ? (free ? '#ffd27a' : '#7ad8ff') : 'rgba(80,120,140,0.35)';
            g.lineWidth = s < b.rank ? 3 : 1;
            g.beginPath();
            g.moveTo(cx + (nx - cx) * t0, cy + (ny - cy) * t0);
            g.lineTo(cx + (nx - cx) * t1, cy + (ny - cy) * t1);
            g.stroke();
          }
          g.lineWidth = 1;
        }
        g.fillStyle = on ? 'rgba(244,191,106,0.35)' : 'rgba(0,0,0,0)';
        g.beginPath();
        g.arc(nx, ny, 20, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = known ? (A.CAST[A.BONDS[id].who] || {}).plate || '#4a6a7a' : '#14222a';
        g.beginPath();
        g.arc(nx, ny, 15, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = known ? '#a8e0ff' : '#2a3a44';
        g.stroke();
        const label = known ? A.BONDS[id].name : '?';
        F.draw(g, 'bold', known ? label[0] : '?', Math.round(nx - F.measure('bold', known ? label[0] : '?') / 2), ny - 8, known ? '#ffffff' : '#3a4a54', K.SHADOW);
        if (known) F.draw(g, 'text', label, Math.round(nx - F.measure('text', label) / 2), ny + 17, on ? K.GOLD : '#c8e8f8', K.SHADOW);
        if (known) this.hits.push({ x: nx - 20, y: ny - 20, w: 40, h: 40, hover: () => { this.sel = i; }, fn: () => { this.sel = i; } });
      });
      g.fillStyle = '#4f86c0';
      g.beginPath();
      g.arc(cx, cy, 20, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#d8f0ff';
      g.stroke();
      F.draw(g, 'bold', 'Эйла', Math.round(cx - F.measure('bold', 'Эйла') / 2), cy - 8, '#ffffff', K.SHADOW);
      const id = this.ids[this.sel], px = 392, py = 56;
      K.bevel(g, px, py, 228, 388, 'rgba(10,26,34,0.95)', '#4a8aa0', '#04080a');
      if (!this.known.includes(id)) {
        center2(g, 'Эйла ещё никого не знает', px + 114, py + 180);
        return;
      }
      const d = A.BONDS[id], b = A.Bonds.get(S, id), max = A.Bonds.max(id);
      g.imageSmoothingEnabled = false;
      g.drawImage(this.bust(id), px + 58, py + 8, 112, 160);
      let y = py + 172;
      F.draw(g, 'bold', d.name, px + 12, y, K.GOLD, K.SHADOW);
      y += 18;
      F.draw(g, 'text', `Ступень ${b.rank} из ${max}` + (A.Bonds.released(S, id) ? ', отпущена' : ''), px + 12, y, '#a8e0ff', K.SHADOW);
      y += 16;
      if (d.letgo && b.letgo) { F.draw(g, 'text', `Отпустить: шаг ${b.letgo} из ${d.letgo}`, px + 12, y, '#ffd27a', K.SHADOW); y += 16; }
      y += 4;
      const last = b.last && A.BOND_SCENES[b.last];
      y += 16 * lines(g, last || 'Сцен связи ещё не было.', px + 12, y, 204, 2, K.INK) + 6;
      const nextRank = b.rank + 1;
      if (nextRank <= max) y += 16 * lines(g, `Ступень ${nextRank}: ${A.Bonds.when(S, id, nextRank)}`, px + 12, y, 204, 2, '#c8d8b0') + 6;
      else { F.draw(g, 'text', 'Все ступени открыты', px + 12, y, '#c8d8b0', K.SHADOW); y += 22; }
      for (const [r, text] of A.Bonds.rewards(id)) {
        if (y > py + 368) break;
        y += 16 * lines(g, `${r}. ${text}`, px + 12, y, 204, 2, r <= b.rank ? '#ffe4a8' : '#5a7a88');
      }
      F.draw(g, 'text', `Стрелки: другой человек    ${A.Input.label('back', this.ui.device)}: назад`, 24, 452, HINT, K.SHADOW);
    }
  };

  A.BondCard = class {
    constructor(ui, opts) {
      this.ui = ui;
      this.id = opts.id;
      this.rank = opts.rank;
      this.done = opts.done;
      this.t = 0;
      this.hits = [];
      if (ui.vn) ui.vn.sound.sfx('win');
    }

    update(dt) { this.t += dt; }

    finish() {
      if (this.over || this.t < 0.4) return;
      this.over = true;
      this.done();
    }

    key(code) {
      if (code === 'Enter' || code === 'Space') this.finish();
      return true;
    }

    click() {
      this.finish();
      return true;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit, d = A.BONDS[this.id], spec = A.Bonds.spec(this.id, this.rank), max = A.Bonds.max(this.id);
      g.fillStyle = '#0a0806';
      g.fillRect(0, 0, A.W, A.H);
      g.globalAlpha = Math.min(1, this.t / 0.4);
      K.bevel(g, 140, 150, 360, 170, 'rgba(34,26,14,0.97)', '#e0b060', '#1a1208');
      center(g, 'bold', 'Связь · ' + d.name, 166, K.GOLD);
      for (let s = 0; s < max; s++) {
        const x = 320 - max * 18 + s * 36, lit = s < this.rank, now = s === this.rank - 1;
        g.fillStyle = lit ? (now ? '#ffe8a0' : '#e0b060') : '#3a3020';
        g.fillRect(x, 202, 30, 6);
        if (now) { g.fillStyle = `rgba(255,232,160,${0.3 + 0.2 * Math.sin(this.t * 6)})`; g.fillRect(x - 3, 198, 36, 14); }
      }
      center(g, 'text', `Ступень ${this.rank} из ${max}`, 220, K.INK);
      if (spec && spec.reward) {
        const out = F.wrap('text', spec.reward, 320);
        out.slice(0, 3).forEach((l, i) => center(g, 'text', l, 246 + i * 16, '#ffe4a8'));
      }
      g.globalAlpha = 1;
      if (this.t > 0.6) center(g, 'text', 'Enter: дальше', 300, HINT);
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
