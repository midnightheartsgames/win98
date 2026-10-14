(function (FO) {
  'use strict';

  const ART = { BACK: 240, SLIDER: 241, BIG_KNOB: 242, SMALL_KNOB: 243, CHECK_ON: 244, CHECK_OFF: 245, SLIDER_HELD: 247, RED_UP: 8, RED_DOWN: 9 };
  const BIG = 0;
  const SMALL = 1;
  const SLIDER = 2;
  const SLIDE_X = 384;
  const SLIDE_W = 219;
  const BRIGHT_MAX = 1.17999267578125;
  const BRIGHT_STEP = 0.01124954223632812;
  const RES_MODES = ['r640', 'r800', 'fit'];
  const RES_LABELS = ['640x480', '800x600', 'Window'];

  FO.PREF_DEFAULTS = {
    gameDifficulty: 1, combatDifficulty: 1, violenceLevel: 3, targetHighlight: 2, combatMessages: 1, combatTaunts: 1, languageFilter: 0,
    running: 0, subtitles: 0, itemHighlight: 1, combatSpeed: 0, playerSpeed: 0, textDelay: 3.5, masterVolume: 22281, musicVolume: 22281,
    soundVolume: 22281, speechVolume: 22281, brightness: 1, mouseSensitivity: 1
  };

  FO.SCREEN_DEFAULTS = { res: 'r640', sideArt: 1, scaling: FO.SCALE.FIT };

  FO.screenPref = function (prefs, key) {
    return prefs && prefs[key] !== undefined ? prefs[key] : FO.SCREEN_DEFAULTS[key];
  };

  FO.PREFS_KEY = 'fallout98_prefs';

  FO.loadPrefs = function () {
    try {
      return JSON.parse(localStorage.getItem(FO.PREFS_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  };

  FO.savePrefs = function (prefs) {
    try {
      localStorage.setItem(FO.PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      return false;
    }
    return true;
  };

  FO.prefValue = function (prefs, key) {
    return prefs && prefs[key] !== undefined ? prefs[key] : FO.PREF_DEFAULTS[key];
  };

  FO.applyBrightness = function (g) {
    if (!g.colors) return;
    g.colors.gamma = Math.max(1, Math.min(BRIGHT_MAX, FO.prefValue(g.prefs, 'brightness')));
    g.colors.rebuild();
  };

  FO.stepBrightness = function (g, dir) {
    const v = Math.max(1, Math.min(BRIGHT_MAX, FO.prefValue(g.prefs, 'brightness') + dir * BRIGHT_STEP));
    g.prefs.brightness = v;
    FO.savePrefs(g.prefs);
    FO.applyBrightness(g);
  };

  const PREFS = [
    { key: 'gameDifficulty', kind: BIG, x: 76, y: 71, labels: [203, 204, 205] },
    { key: 'combatDifficulty', kind: BIG, x: 76, y: 149, labels: [206, 204, 208] },
    { key: 'violenceLevel', kind: BIG, x: 76, y: 226, labels: [214, 215, 204, 216] },
    { key: 'targetHighlight', kind: BIG, x: 76, y: 309, labels: [202, 201, 213] },
    { key: 'res', kind: BIG, x: 76, y: 387, labels: RES_LABELS },
    { key: 'combatMessages', kind: SMALL, x: 299, y: 74, labels: [211, 212], flip: true },
    { key: 'combatTaunts', kind: SMALL, x: 299, y: 141, labels: [202, 201] },
    { key: 'languageFilter', kind: SMALL, x: 299, y: 207, labels: [202, 201] },
    { key: 'running', kind: SMALL, x: 299, y: 271, labels: [209, 219] },
    { key: 'subtitles', kind: SMALL, x: 299, y: 338, labels: [202, 201] },
    { key: 'itemHighlight', kind: SMALL, x: 299, y: 404, labels: [202, 201] },
    { key: 'combatSpeed', kind: SLIDER, x: 374, y: 50, labels: [207, 210], min: 0, max: 50, whole: true },
    { key: 'textDelay', kind: SLIDER, x: 374, y: 125, labels: [217, 209, 218], min: 1, max: 6, reverse: true },
    { key: 'masterVolume', kind: SLIDER, x: 374, y: 196, labels: [202, 221, 209, 222], min: 0, max: 32767, whole: true, volume: true },
    { key: 'musicVolume', kind: SLIDER, x: 374, y: 247, labels: [202, 221, 209, 222], min: 0, max: 32767, whole: true, volume: true },
    { key: 'soundVolume', kind: SLIDER, x: 374, y: 298, labels: [202, 221, 209, 222], min: 0, max: 32767, whole: true, volume: true },
    { key: 'speechVolume', kind: SLIDER, x: 374, y: 349, labels: [202, 221, 209, 222], min: 0, max: 32767, whole: true, volume: true },
    { key: 'brightness', kind: SLIDER, x: 374, y: 400, labels: [207, 223], min: 1, max: BRIGHT_MAX },
    { key: 'mouseSensitivity', kind: SLIDER, x: 374, y: 451, labels: [207, 218], min: 1, max: 2.5 }
  ];
  const TITLES = {
    left: { ids: [101, 102, 103, 104, 'RESOLUTION'], ys: [48, 125, 203, 286, 363] },
    middle: { ids: [106, 107, 108, 109, 110, 111], ys: [49, 116, 181, 247, 313, 380] },
    right: { ids: [112, 113, 114, 115, 116, 117, 118, 119], ys: [19, 94, 165, 216, 268, 319, 369, 420] }
  };
  const BIG_DX = [2, 25, 46, 46];
  const BIG_DY = [10, -4, 10, 31];

  class PrefsScreen extends FO.Win {
    constructor(play) {
      super(play);
      this.overBar = true;
      this.msg = new Map();
      this.saved = Object.assign({}, play.g.prefs);
      this.dir = {};
      this.drag = null;
      this.button({ id: 'default', x: 23, y: 450, w: 15, h: 16, up: ART.RED_UP, down: ART.RED_DOWN, onClick: () => this.defaults() });
      this.button({ id: 'done', x: 148, y: 450, w: 15, h: 16, up: ART.RED_UP, down: ART.RED_DOWN, key: ['Enter', 'NumpadEnter', 'KeyP'], onClick: () => this.close() });
      this.button({ id: 'cancel', x: 263, y: 450, w: 15, h: 16, up: ART.RED_UP, down: ART.RED_DOWN, key: ['Escape'], onClick: () => this.cancel() });
      this.button({ id: 'speed', x: 383, y: 68, w: 18, h: 18, up: -1, down: -1, onClick: () => this.set('playerSpeed', this.get('playerSpeed') ? 0 : 1) });
    }

    async enter() {
      const g = this.g;
      const path = FO.textPath('GAME\\OPTIONS.MSG');
      this.msg = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
      await g.art.loadAll(Object.values(ART).map(FO.IFACE));
    }

    leave() {
      FO.savePrefs(this.g.prefs);
    }

    m(id) {
      if (typeof id === 'string') return FO.tr(this.g, id);
      const e = this.msg.get(id);
      return e ? e.text : '';
    }

    get(key) {
      if (key === 'res') return Math.max(0, RES_MODES.indexOf(FO.screenPref(this.g.prefs, 'res')));
      return FO.prefValue(this.g.prefs, key);
    }

    set(key, v) {
      const g = this.g;
      if (key === 'res') {
        g.setResolution(RES_MODES[v]);
        return;
      }
      g.prefs[key] = v;
      if (key === 'brightness') FO.applyBrightness(g);
      if (/Volume$/.test(key) && g.audio) g.audio.apply();
    }

    defaults() {
      for (const [k, v] of Object.entries(FO.PREF_DEFAULTS)) this.set(k, v);
    }

    cancel() {
      const g = this.g;
      g.prefs = Object.assign({}, this.saved);
      g.setResolution(FO.screenPref(this.saved, 'res'));
      FO.applyBrightness(g);
      if (g.audio) g.audio.apply();
      this.close();
    }

    keyDown(e) {
      if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        FO.stepBrightness(this.g, 1);
        return true;
      }
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        FO.stepBrightness(this.g, -1);
        return true;
      }
      return super.keyDown(e);
    }

    font() {
      return this.g.fonts[101];
    }

    lh() {
      const f = this.font();
      return f.height + f.lineGap;
    }

    bigLabels(p) {
      const f = this.font();
      return p.labels.map((id, v) => {
        const s = this.m(id);
        const w = f.width(s);
        const x = v === 0 ? p.x + BIG_DX[0] - w : v === 1 ? p.x + BIG_DX[1] - (w >> 1) : p.x + BIG_DX[v];
        return { s, w, x, y: p.y + BIG_DY[v] };
      });
    }

    smallLabels(p) {
      const f = this.font();
      return p.labels.map((id, v) => {
        const s = this.m(id);
        const w = f.width(s);
        return { s, w, x: v === 0 ? p.x + 4 - w : p.x + 21, y: p.y - 5 };
      });
    }

    sliderLabels(p) {
      const f = this.font();
      const n = p.labels.length;
      return p.labels.map((id, v) => {
        const s = this.m(id);
        const w = f.width(s);
        let x = SLIDE_X;
        if (v === n - 1 && v > 0) x = 624 - w;
        else if (v === 1 && n === 3) x = 504 - (w >> 1) - 2;
        else if (v === 1 && n === 4) x = 444 + (w >> 1) - 8;
        else if (v === 2 && n === 4) x = 564 - w - 4;
        return { s, w, x, y: p.y - 12 };
      });
    }

    sliderPos(p) {
      const v = this.get(p.key);
      if (p.reverse) return Math.round((p.max - v) * (SLIDE_W / (p.max - p.min)) + SLIDE_X);
      return Math.round((Math.max(p.min, Math.min(p.max, v)) - p.min) * (SLIDE_W / (p.max - p.min)) + SLIDE_X);
    }

    sliderValue(p, x) {
      const pos = Math.max(SLIDE_X, Math.min(603, x - 6)) - SLIDE_X;
      let v = p.min + pos / (SLIDE_W / (p.max - p.min));
      v = Math.max(p.min, Math.min(p.max, v));
      if (p.reverse) v = p.max - v + p.min;
      return p.whole ? Math.round(v) : v;
    }

    label(scr, l, color) {
      const sp = l.s.indexOf(' ');
      if (sp < 0) {
        FO.textIn(this.g, l.s, this.x + l.x, this.y + l.y, 0, color, 101);
        return;
      }
      FO.textIn(this.g, l.s.slice(0, sp), this.x + l.x, this.y + l.y, 0, color, 101);
      FO.textIn(this.g, l.s.slice(sp + 1), this.x + l.x + 5, this.y + l.y + this.lh(), 0, color, 101);
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr, this.g);
      this.x = ox;
      this.y = oy;
      this.blit(scr, ART.BACK, 0, 0);
      const label = this.color('label');
      FO.textIn(g, this.m(100), this.x + 74, this.y + 10, 0, label, 104);
      TITLES.left.ids.forEach((id, i) => {
        const s = this.m(id);
        FO.textIn(g, s, this.x + 99 - (g.fonts[103].width(s) >> 1), this.y + TITLES.left.ys[i], 0, label, 103);
      });
      TITLES.middle.ids.forEach((id, i) => FO.textIn(g, this.m(id), this.x + 206, this.y + TITLES.middle.ys[i], 0, label, 103));
      TITLES.right.ids.forEach((id, i) => FO.textIn(g, this.m(id), this.x + 384, this.y + TITLES.right.ys[i], 0, label, 103));
      FO.textIn(g, this.m(120), this.x + 43, this.y + 449, 0, label, 103);
      FO.textIn(g, this.m(4), this.x + 169, this.y + 449, 0, label, 103);
      FO.textIn(g, this.m(121), this.x + 283, this.y + 449, 0, label, 103);
      FO.textIn(g, this.m(122), this.x + 405, this.y + 72, 0, label, 101);
      this.blit(scr, this.get('playerSpeed') ? ART.CHECK_ON : ART.CHECK_OFF, 383, 68);
      for (const p of PREFS) this.drawPref(scr, p, label);
      this.drawButtons(scr);
    }

    drawPref(scr, p, label) {
      const v = this.get(p.key);
      if (p.kind === BIG) {
        this.bigLabels(p).forEach(l => this.label(scr, l, label));
        const knob = this.art(ART.BIG_KNOB);
        if (knob) scr.blitPart(knob, 0, Math.max(0, Math.min(3, v)) * 47, 46, 47, this.x + p.x, this.y + p.y);
        return;
      }
      if (p.kind === SMALL) {
        this.smallLabels(p).forEach(l => this.label(scr, l, label));
        const knob = this.art(ART.SMALL_KNOB);
        const frame = p.flip ? (v ^ 1) & 1 : v ? 1 : 0;
        if (knob) scr.blitPart(knob, 0, frame * 25, 22, 25, this.x + p.x, this.y + p.y);
        return;
      }
      const dim = this.color('labelOff');
      this.sliderLabels(p).forEach((l, i) => this.label(scr, l, p.volume && i === 0 && v === p.min ? dim : label));
      const held = this.drag === p;
      this.blit(scr, held ? ART.SLIDER_HELD : ART.SLIDER, this.sliderPos(p), p.y);
    }

    local(m) {
      return [m.x - this.x, m.y - this.y];
    }

    clickBig(p, mx, my) {
      const v = this.get(p.key);
      const n = p.labels.length;
      const lh = this.lh();
      const ls = this.bigLabels(p);
      const minX = ls[0].x;
      const maxX = ls[n - 1].x + ls[n - 1].w;
      if (Math.hypot(mx - (p.x + 23), my - (p.y + 21)) <= 16) {
        let d = this.dir[p.key] | 0;
        let nv = v;
        if (d === 0) {
          if (v === n - 1) {
            d = 1;
            nv = v - 1;
          } else {
            nv = v + 1;
          }
        } else if (v === 0) {
          d = 0;
          nv = v + 1;
        } else {
          nv = v - 1;
        }
        this.dir[p.key] = d;
        return nv;
      }
      if (my <= p.y) {
        if (mx >= p.x + 9 && mx <= p.x + 37) {
          this.dir[p.key] = v === 0 ? 0 : 1;
          return 1;
        }
        return v;
      }
      if (my >= p.y + BIG_DY[0] && my <= p.y + BIG_DY[0] + lh) {
        if (mx >= minX && mx <= p.x) {
          this.dir[p.key] = 0;
          return 0;
        }
        if (n >= 3 && mx >= p.x + 46 && mx <= maxX) {
          this.dir[p.key] = v > 2 ? 1 : 0;
          return 2;
        }
      }
      if (n === 4 && my >= p.y + BIG_DY[3] && my <= p.y + BIG_DY[3] + 2 * lh && mx >= p.x + 46 && mx <= maxX) {
        this.dir[p.key] = 1;
        return 3;
      }
      return v;
    }

    clickSmall(p, mx, my) {
      const v = this.get(p.key);
      const ls = this.smallLabels(p);
      if (Math.hypot(mx - (p.x + 11), my - (p.y + 12)) <= 10) return v ? 0 : 1;
      if (my < p.y - 5 || my > p.y - 5 + this.lh() + 2) return v;
      if (mx >= ls[0].x && mx <= p.x) return p.flip ? 1 : 0;
      if (mx >= p.x + 22 && mx <= ls[1].x + ls[1].w) return p.flip ? 0 : 1;
      return v;
    }

    region(p) {
      if (p.kind === SLIDER) return [SLIDE_X, p.y - 12, 240, 23];
      const ls = p.kind === BIG ? this.bigLabels(p) : this.smallLabels(p);
      const last = ls[ls.length - 1];
      return p.kind === BIG ? [ls[0].x, p.y - 4, last.x + last.w - ls[0].x, 48] : [ls[0].x, p.y - 5, last.x + last.w - ls[0].x, 28];
    }

    mouseDown(m, button) {
      super.mouseDown(m, button);
      if (this.pressed || button !== 0) return;
      const [mx, my] = this.local(m);
      for (const p of PREFS) {
        const r = this.region(p);
        if (mx < r[0] || my < r[1] || mx >= r[0] + r[2] || my >= r[1] + r[3]) continue;
        if (p.kind === BIG) this.set(p.key, this.clickBig(p, mx, my));
        else if (p.kind === SMALL) this.set(p.key, this.clickSmall(p, mx, my));
        else {
          this.drag = p;
          this.set(p.key, this.sliderValue(p, mx));
        }
        return;
      }
    }

    mouseMove(m) {
      if (!this.drag) return;
      this.set(this.drag.key, this.sliderValue(this.drag, m.x - this.x));
    }

    mouseUp(m, button) {
      this.drag = null;
      super.mouseUp(m, button);
    }
  }

  FO.PrefsScreen = PrefsScreen;

  FO.loadScreenText = async function (g) {
    if (g.scrnset) return;
    const path = FO.textPath('GAME\\SCRNSET.MSG');
    g.scrnset = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
  };

  FO.screenText = function (g, id) {
    const e = g.scrnset && g.scrnset.get(id);
    return e ? e.text : '';
  };

  const SCREEN = {
    BG: 'ART\\INTRFACE\\HR_SCRN_BG.FRM', SELECT: 'ART\\INTRFACE\\HR_IFACE_SELECT.FRM',
    title: [370, 16, 260], list: { x: 52, y: 182, w: 129, titleY: 160, rowY: 236, row: 18 },
    sliders: [{ key: 'scaling', y: 119, title: 150, labels: [151, 152, 153] }, { key: 'sideArt', y: 209, title: 106, labels: ['Black', 'Metal', 'Leather'] }],
    slideX: 400, step: 90, knob: 21, preview: [410, 292], hole: [47, 10, 133, 90],
    done: [393, 433], cancel: [523, 433], labelDx: 19
  };
  const MSG = { TITLE: 1, RESOLUTION: 101, DONE: 54, CANCEL: 55 };

  class ScreenSettings extends FO.Win {
    constructor(host) {
      super(host);
      this.overBar = true;
      const prefs = this.g.prefs;
      this.saved = { res: FO.screenPref(prefs, 'res'), sideArt: FO.screenPref(prefs, 'sideArt'), scaling: FO.screenPref(prefs, 'scaling') };
      this.button({ id: 'done', x: SCREEN.done[0], y: SCREEN.done[1], w: 15, h: 16, up: ART.RED_UP, down: ART.RED_DOWN, key: ['Enter', 'NumpadEnter'], onClick: () => this.close() });
      this.button({ id: 'cancel', x: SCREEN.cancel[0], y: SCREEN.cancel[1], w: 15, h: 16, up: ART.RED_UP, down: ART.RED_DOWN, key: ['Escape'], onClick: () => this.cancel() });
    }

    async enter() {
      const g = this.g;
      await FO.loadScreenText(g);
      await g.art.loadAll([ART.SLIDER, ART.RED_UP, ART.RED_DOWN].map(FO.IFACE));
      await Promise.all([SCREEN.BG, SCREEN.SELECT].concat(FO.IFACE_ART).map(p => g.art.loadPath(p)));
    }

    leave() {
      FO.savePrefs(this.g.prefs);
    }

    get(key) {
      if (key === 'res') return Math.max(0, RES_MODES.indexOf(FO.screenPref(this.g.prefs, 'res')));
      return FO.screenPref(this.g.prefs, key);
    }

    set(key, v) {
      const g = this.g;
      if (key === 'res') g.setResolution(RES_MODES[v]);
      else g.prefs[key] = v;
    }

    cancel() {
      const g = this.g;
      g.prefs.sideArt = this.saved.sideArt;
      g.prefs.scaling = this.saved.scaling;
      g.setResolution(this.saved.res);
      this.close();
    }

    label(id) {
      return typeof id === 'string' ? FO.tr(this.g, id) : FO.screenText(this.g, id);
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr, this.g);
      this.x = ox;
      this.y = oy;
      this.blit(scr, SCREEN.BG, 0, 0);
      const label = this.color('label');
      const title = this.label(MSG.TITLE);
      FO.textIn(g, title, ox + SCREEN.title[0], oy + SCREEN.title[1], SCREEN.title[2], label, 104, 'center');
      const L = SCREEN.list;
      FO.textIn(g, this.label(MSG.RESOLUTION), ox + L.x, oy + L.titleY, L.w, label, 103, 'center');
      const res = this.get('res');
      RES_LABELS.forEach((s, i) => FO.textIn(g, this.label(s), ox + L.x, oy + L.rowY + i * L.row, L.w, this.color(i === res ? 'green' : 'dark'), 101, 'center'));
      for (const s of SCREEN.sliders) this.drawSlider(scr, s, label);
      this.drawPreview(scr);
      this.drawButtons(scr);
      FO.textIn(g, this.label(MSG.DONE), ox + SCREEN.done[0] + SCREEN.labelDx, oy + SCREEN.done[1] - 1, 0, label, 103);
      FO.textIn(g, this.label(MSG.CANCEL), ox + SCREEN.cancel[0] + SCREEN.labelDx, oy + SCREEN.cancel[1] - 1, 0, label, 103);
    }

    drawSlider(scr, s, label) {
      const g = this.g;
      FO.textIn(g, this.label(s.title), this.x + SCREEN.slideX, this.y + s.y - 27, 0, label, 103);
      const v = this.get(s.key);
      s.labels.forEach((id, i) => {
        const cx = SCREEN.slideX + i * SCREEN.step + (SCREEN.knob >> 1);
        FO.textIn(g, this.label(id), this.x + cx - 40, this.y + s.y + 15, 80, this.color(i === v ? 'label' : 'tabOff'), 101, 'center');
      });
      this.blit(scr, ART.SLIDER, SCREEN.slideX + v * SCREEN.step, s.y);
    }

    drawPreview(scr) {
      const [px, py] = SCREEN.preview;
      this.blit(scr, SCREEN.SELECT, px, py);
      const side = FO.SIDE_ART[this.get('sideArt')];
      const art = side && FO.frameOfArt(this.g, side[1]);
      const [hx, hy, hw, hh] = SCREEN.hole;
      if (art) scr.blitPart(art, 0, 0, hw, hh, this.x + px + hx, this.y + py + hy);
    }

    mouseDown(m, button) {
      super.mouseDown(m, button);
      if (this.pressed || button !== 0) return;
      const mx = m.x - this.x;
      const my = m.y - this.y;
      const L = SCREEN.list;
      if (mx >= L.x && mx < L.x + L.w && my >= L.rowY - 4) {
        const row = Math.floor((my - L.rowY + 4) / L.row);
        if (row >= 0 && row < RES_LABELS.length) {
          FO.uiSound(this.g, 'ib1p1xx1');
          this.set('res', row);
          return;
        }
      }
      for (const s of SCREEN.sliders) {
        if (my < s.y - 6 || my > s.y + 28 || mx < SCREEN.slideX - 20 || mx > SCREEN.slideX + 2 * SCREEN.step + SCREEN.knob + 20) continue;
        const v = Math.max(0, Math.min(2, Math.round((mx - SCREEN.slideX - (SCREEN.knob >> 1)) / SCREEN.step)));
        FO.uiSound(this.g, 'ib1p1xx1');
        this.set(s.key, v);
        return;
      }
      const [px, py] = SCREEN.preview;
      const [hx, hy, hw, hh] = SCREEN.hole;
      if (mx >= px + hx && my >= py + hy && mx < px + hx + hw && my < py + hy + hh) {
        FO.uiSound(this.g, 'ib1p1xx1');
        this.set('sideArt', (this.get('sideArt') + 1) % FO.SIDE_ART.length);
      }
    }
  }

  FO.ScreenSettings = ScreenSettings;
})(globalThis.FO = globalThis.FO || {});
