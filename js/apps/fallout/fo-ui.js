(function (FO) {
  'use strict';

  FO.IFACE = idx => FO.fid(FO.ART.INTERFACE, idx);

  FO.BTN_SOUNDS = {
    ib1: ['ib1p1xx1', 'ib1lu1x1'], ib2: ['ib2p1xx1', 'ib2lu1x1'], ib3: ['ib3p1xx1', 'ib3lu1x1'],
    ib1p: ['ib1p1xx1', ''], ib2p: ['ib2p1xx1', ''], ib3p: ['ib3p1xx1', ''],
    toggle: ['toggle', 'toggle'], menu: ['nmselec0', 'nmselec1'], none: ['', '']
  };

  FO.buttonSound = function (g, kind, release) {
    const pair = FO.BTN_SOUNDS[kind] || FO.BTN_SOUNDS.ib1;
    const name = pair[release ? 1 : 0];
    if (name) FO.uiSound(g, name);
  };

  FO.UICOLOR = {
    green: [0, 248, 0], dim: [0, 176, 0], dark: [0, 96, 0], yellow: [248, 248, 88], red: [248, 0, 0], white: [248, 248, 248],
    gray: [168, 168, 168], light: [216, 216, 160], orange: [248, 144, 64], label: [144, 136, 24], labelOff: [88, 72, 16],
    doneGreen: [64, 152, 32], deepGreen: [0, 120, 0], title: [160, 152, 24], titleDown: [144, 136, 8], menuText: [160, 176, 160],
    creditTitle: [104, 88, 72], creditName: [144, 120, 40], creditHead: [136, 136, 136], tabOff: [112, 96, 24], tagGray: [160, 160, 160],
    inactive: [8, 72, 8], inactiveSel: [120, 120, 40]
  };

  FO.BAR_H = 100;

  FO.screenOrigin = function (scr, g) {
    const bar = g && g.play && g.mode === g.play && scr.h - FO.BAR_H >= 480 ? FO.BAR_H : 0;
    return [Math.max(0, (scr.w - 640) >> 1), Math.max(0, (scr.h - bar - 480) >> 1)];
  };

  FO.SCALE = { NONE: 0, FIT: 1, FILL: 2 };

  FO.scaleRect = function (W, H, w, h, mode) {
    if (mode === FO.SCALE.FILL) return [0, 0, W, H];
    const s = mode === FO.SCALE.FIT ? Math.min(W / w, H / h) : 1;
    const rw = Math.round(w * s);
    const rh = Math.round(h * s);
    return [(W - rw) >> 1, (H - rh) >> 1, rw, rh];
  };

  FO.uiColor = function (g, name) {
    const c = FO.UICOLOR[name] || FO.UICOLOR.green;
    return g.colors.nearest(c[0], c[1], c[2]);
  };

  FO.frameOfArt = function (g, idx) {
    const frm = typeof idx === 'string' ? g.art.getPath(idx) : g.art.get(idx >= 0x1000000 ? idx : FO.IFACE(idx));
    return frm ? frm.dirs[0].frames[0] : null;
  };

  FO.blitArt = function (g, scr, idx, x, y, frame) {
    const frm = typeof idx === 'string' ? g.art.getPath(idx) : g.art.get(idx >= 0x1000000 ? idx : FO.IFACE(idx));
    if (!frm) return null;
    const d = frm.dirs[0];
    const f = d.frames[Math.min(frame || 0, d.frames.length - 1)];
    scr.blit(f, x, y);
    return f;
  };

  FO.textIn = function (g, s, x, y, w, color, font, align) {
    const f = g.fonts[font === undefined ? 101 : font];
    if (!f) return;
    let tx = x;
    if (align === 'center') tx = x + ((w - f.width(s)) >> 1);
    else if (align === 'right') tx = x + w - f.width(s);
    f.draw(g.scr, s, tx, y, color, g.colors);
  };

  class Btn {
    constructor(o) {
      Object.assign(this, { x: 0, y: 0, w: 0, h: 0, up: -1, down: -1, disabled: false, onClick: null, key: null, id: '' }, o);
    }

    contains(mx, my) {
      return mx >= this.x && my >= this.y && mx < this.x + this.w && my < this.y + this.h;
    }
  }

  FO.Btn = Btn;

  class Win {
    constructor(play) {
      this.p = play;
      this.g = play.g;
      this.buttons = [];
      this.pressed = null;
      this.x = 0;
      this.y = 0;
      this.pauses = true;
    }

    art(idx) {
      return FO.frameOfArt(this.g, idx);
    }

    blit(scr, idx, x, y, frame) {
      return FO.blitArt(this.g, scr, idx, this.x + x, this.y + y, frame);
    }

    text(s, x, y, color, font) {
      return this.g.text(s, this.x + x, this.y + y, color, font === undefined ? 101 : font);
    }

    color(name) {
      return FO.uiColor(this.g, name);
    }

    button(o) {
      const b = new Btn(o);
      if (!b.w && b.up >= 0) {
        const f = this.art(b.up);
        if (f) {
          b.w = f.w;
          b.h = f.h;
        }
      }
      this.buttons.push(b);
      return b;
    }

    center(w, h) {
      const scr = this.g.scr;
      this.x = Math.max(0, (scr.w - w) >> 1);
      this.y = Math.max(0, ((scr.h - (this.overBar ? 0 : 100)) - h) >> 1);
    }

    hit(m) {
      const lx = m.x - this.x;
      const ly = m.y - this.y;
      for (let i = this.buttons.length - 1; i >= 0; i--) {
        const b = this.buttons[i];
        if (!b.disabled && b.contains(lx, ly)) return b;
      }
      return null;
    }

    drawButtons(scr) {
      const art = v => typeof v === 'string' || v >= 0;
      for (const b of this.buttons) {
        const down = this.pressed === b && b.contains(this.g.mouse.x - this.x, this.g.mouse.y - this.y);
        if (down && art(b.down)) this.blit(scr, b.down, b.x, b.y);
        else if (art(b.up) && !b.baked) this.blit(scr, b.up, b.x, b.y);
      }
    }

    mouseDown(m, button) {
      if (button !== 0) return;
      this.pressed = this.hit(m);
      if (this.pressed) FO.buttonSound(this.g, this.pressed.sound, false);
    }

    mouseUp(m, button) {
      if (button !== 0) return;
      const b = this.pressed;
      this.pressed = null;
      if (b && this.hit(m) === b) {
        FO.buttonSound(this.g, b.sound, true);
        if (b.onClick) b.onClick(b);
      }
    }

    keyDown(e) {
      for (const b of this.buttons) {
        if (b.key && (b.key === e.code || (Array.isArray(b.key) && b.key.includes(e.code))) && !b.disabled && b.onClick) {
          b.onClick(b);
          return true;
        }
      }
      if (e.code === 'Escape' && this.cancel) {
        this.cancel();
        return true;
      }
      return false;
    }

    close() {
      (this.owner || this.p).closeModal(this);
    }
  }

  FO.Win = Win;

  FO.ACTION_ICONS = { look: [259, 258], talk: [263, 262], use: [265, 264], rotate: [261, 260], skill: [304, 303], inven: [257, 256], drop: [255, 254], unload: [302, 301], cancel: [253, 252] };

  class ActionMenu {
    constructor(play, obj, x, y, items, bottom) {
      this.p = play;
      this.obj = obj;
      this.items = items;
      const scr = play.g.scr;
      this.x = Math.min(x + 12, scr.w - 40);
      this.y = Math.max(0, Math.min(y, (bottom === undefined ? play.mapH() : bottom) - items.length * 40));
      this.hover = 0;
    }

    update(m) {
      const i = Math.floor((m.y - this.y) / 40);
      this.hover = Math.max(0, Math.min(this.items.length - 1, i));
    }

    draw(scr) {
      const g = this.p.g;
      this.items.forEach((it, i) => {
        const pair = FO.ACTION_ICONS[it];
        FO.blitArt(g, scr, pair[i === this.hover ? 1 : 0], this.x, this.y + i * 40);
      });
    }
  }

  FO.ActionMenu = ActionMenu;

  const BOX = { art: [218, 217], top: [23, 27], doneY: [81, 98], pairX: [51, 37], lines: [5, 6], width: [168, 256], doneBox: 209 };
  FO.MESSAGE_BOX_ART = [...BOX.art, BOX.doneBox, 8, 9];

  class MessageBox extends Win {
    constructor(play, o) {
      super(play);
      this.o = Object.assign({ title: '', lines: [], color: 'orange', titleColor: 'orange', x: -1, y: -1, large: false, yesNo: false, onClose: null, onNo: null }, o);
      this.overBar = true;
      this.msg = new Map();
      const yes = this.o.yesNo ? ['Enter', 'NumpadEnter', 'KeyY'] : ['Enter', 'NumpadEnter', 'Escape'];
      this.button({ id: 'done', w: 15, h: 16, up: 8, down: 9, key: yes, onClick: () => this.done(true) });
      if (this.o.yesNo) this.button({ id: 'no', w: 15, h: 16, up: 8, down: 9, key: ['Escape', 'KeyN'], onClick: () => this.done(false) });
    }

    async enter() {
      const g = this.g;
      const path = FO.textPath('GAME\\DBOX.MSG');
      this.msg = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
      await g.art.loadAll([...BOX.art, BOX.doneBox, 8, 9].map(FO.IFACE));
    }

    size() {
      const f = this.g.fonts[101];
      const all = [this.o.title, ...this.o.lines].filter(Boolean);
      const widest = Math.max(0, ...all.map(s => f.width(s)));
      return this.o.large || this.o.yesNo || widest > BOX.width[0] || all.length > BOX.lines[0] ? 1 : 0;
    }

    done(yes) {
      this.close();
      if (yes && this.o.onClose) this.o.onClose();
      if (!yes && this.o.onNo) this.o.onNo();
    }

    label(id) {
      const e = this.msg.get(id);
      return e ? e.text : '';
    }

    draw(scr) {
      const g = this.g;
      const s = this.size();
      const box = this.art(BOX.art[s]);
      const bw = box ? box.w : 215;
      const [ox, oy] = FO.screenOrigin(scr, this.g);
      this.x = this.o.x >= 0 ? ox + this.o.x : (scr.w - bw) >> 1;
      this.y = this.o.y >= 0 ? oy + this.o.y : (scr.h - (box ? box.h : 113)) >> 1;
      this.blit(scr, BOX.art[s], 0, 0);
      const done = this.art(BOX.doneBox);
      const dw = done ? done.w : 0;
      const dy = BOX.doneY[s];
      const slots = this.o.yesNo ? [[BOX.pairX[s], 101], [BOX.pairX[s] + dw + 24, 102]] : [[(bw - dw) >> 1, 100]];
      const label = this.color('label');
      slots.forEach(([dx, id], i) => {
        if (done) this.blit(scr, BOX.doneBox, dx, dy);
        this.buttons[i].x = dx + 13;
        this.buttons[i].y = dy + 4;
        this.text(this.label(id), dx + 35, dy + 3, label, 103);
      });
      this.drawButtons(scr);
      const f = g.fonts[101];
      const lh = f.height + f.lineGap;
      const rows = this.o.lines.length + (this.o.title ? 1 : 0);
      let y = BOX.top[s] + ((lh * BOX.lines[s]) >> 1) - ((lh * rows) >> 1);
      const line = (str, color) => {
        FO.textIn(g, str, this.x, this.y + y, bw, this.color(color), 101, 'center');
        y += lh;
      };
      if (this.o.title) line(this.o.title, this.o.titleColor);
      for (const l of this.o.lines) line(l, this.o.color);
    }
  }

  FO.MessageBox = MessageBox;
})(globalThis.FO = globalThis.FO || {});
