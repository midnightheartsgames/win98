(function (B) {
  'use strict';
  const rgb = B.rgb;

  const COL = {
    GREY: rgb(176, 176, 176),
    SALMON: rgb(176, 160, 144),
    PURPLE: rgb(160, 160, 176),
    GREEN: rgb(136, 160, 164),
    YELLOW: rgb(176, 176, 128),
    BLUE: rgb(144, 160, 192),
    BROWN: rgb(160, 140, 120),
    BUTBG: rgb(144, 144, 144),
    BLACK: rgb(0, 0, 0),
    WHITE: rgb(255, 255, 255),
    TEXTSEL: rgb(255, 255, 255),
    MENU: rgb(190, 190, 190),
    MENUGAP: rgb(176, 176, 176),
    MENUHI: rgb(112, 112, 192),
    MENUCAT: rgb(160, 160, 160),
    MENUCATHI: rgb(50, 50, 100),
    TIP: rgb(255, 255, 208)
  };

  function emboss(r, x1, y1, x2, y2, base, sel, flat) {
    x1 = Math.round(x1); y1 = Math.round(y1); x2 = Math.round(x2); y2 = Math.round(y2);
    if (x2 - x1 < 3 || y2 - y1 < 3) { r.rect(x1, y1, x2 + 1, y2 + 1, base); return; }
    const hi = B.shade(base, 60), lo = B.shade(base, -60), drop = B.shade(base, -45);
    const fill = sel ? lo : base;
    const top = sel ? B.shade(base, -100) : hi, bottom = sel ? hi : lo;
    const K = COL.BLACK;
    if (!flat) {
      r.rect(x1 + 3, y1 - 1, x2 - 1, y1, drop);
      r.rect(x2 + 1, y1 + 1, x2 + 2, y2 - 2, drop);
      r.px(x2, y1, drop);
    }
    r.rect(x1 + 2, y1 + 2, x2 - 1, y2 - 1, fill);
    r.hline(x1 + 2, x2 - 2, y2, K);
    r.hline(x1 + 2, x2 - 2, y1, K);
    r.vline(x1, y1 + 2, y2 - 2, K);
    r.vline(x2, y1 + 2, y2 - 2, K);
    r.px(x1 + 1, y2 - 1, K); r.px(x2 - 1, y2 - 1, K);
    r.px(x1 + 1, y1 + 1, K); r.px(x2 - 1, y1 + 1, K);
    r.hline(x1 + 2, x2 - 2, y2 - 1, top);
    r.vline(x1 + 1, y1 + 2, y2 - 2, top);
    r.hline(x1 + 2, x2 - 2, y1 + 1, bottom);
    r.vline(x2 - 1, y1 + 2, y2 - 2, bottom);
  }

  function fmtNum(v, prec) {
    if (prec <= 0) return String(Math.round(v));
    return (+v).toFixed(prec);
  }

  function parseMenu(str) {
    const items = [];
    let title = '';
    String(str).split('|').forEach((part, idx) => {
      let s = part;
      let value = null;
      const t = s.indexOf('%t');
      if (t >= 0) { title = s.slice(0, t).trim(); return; }
      if (s.indexOf('%l') >= 0) { items.push({ sep: true }); return; }
      const xm = s.match(/%x\s*(-?\d+)/);
      if (xm) { value = +xm[1]; s = s.replace(/%x\s*-?\d+/, ''); }
      const im = s.match(/%i(\d+),(\d+)/);
      let icon = null;
      if (im) { icon = [+im[1], +im[2]]; s = s.replace(/%i\d+,\d+/, ''); }
      items.push({ str: s.trim(), value: value === null ? items.filter(it => !it.sep).length : value, icon });
    });
    return { title, items };
  }

  class Button {
    constructor(block, o) {
      Object.assign(this, { col: COL.GREY, min: 0, max: 1, step: 1, prec: 0, str: '', tip: '', w: 40, h: 19 }, o);
      this.block = block;
    }

    get value() { return this.get ? this.get() : 0; }
    set value(v) { if (this.set) this.set(v); }

    isOn() {
      const v = this.value;
      if (this.type === 'ROW') return v === this.rowValue;
      if (this.type === 'TOGN') return !v;
      return !!v;
    }

    label() {
      const t = this.type;
      if (t === 'NUM') return this.str + fmtNum(this.value, this.prec);
      if (t === 'NUMSLI') return this.str + fmtNum(this.value, this.prec);
      if (t === 'TEX' || t === 'IDPOIN') return this.str + (this.value == null ? '' : this.value);
      if (t === 'MENU') {
        const m = parseMenu(this.menu());
        const it = m.items.find(i => !i.sep && i.value === this.value);
        return it ? it.str : (this.str || '');
      }
      return this.str;
    }

    rect() {
      const b = this.block;
      const x1 = b.px(this.x), y1 = b.py(this.y), x2 = b.px(this.x + this.w) - 1, y2 = b.py(this.y + this.h) - 1;
      return [x1, y1, x2, y2];
    }

    inside(x, y) {
      const [x1, y1, x2, y2] = this.rect();
      return x >= x1 && x <= x2 && y >= y1 && y <= y2;
    }
  }

  class Block {
    constructor(r, opts = {}) {
      this.r = r;
      this.buts = [];
      this.ox = opts.ox || 0;
      this.oy = opts.oy || 0;
      this.scale = opts.scale || 1;
      this.font = opts.font || 'helv12';
      this.name = opts.name || '';
      this.area = opts.area || null;
      this.col = COL.GREY;
      this.emboss = 'X';
    }

    px(x) { return Math.round(this.ox + x * this.scale); }
    py(y) { return Math.round(this.oy + y * this.scale); }

    add(type, o) {
      const but = new Button(this, Object.assign({ type, col: this.col }, o));
      this.buts.push(but);
      return but;
    }

    but(str, x, y, w, h, func, tip, extra) { return this.add('BUT', Object.assign({ str, x, y, w, h, func, tip }, extra)); }
    tog(str, x, y, w, h, get, set, tip, extra) { return this.add('TOG', Object.assign({ str, x, y, w, h, get, set, tip }, extra)); }
    row(str, x, y, w, h, get, set, rowValue, tip, extra) { return this.add('ROW', Object.assign({ str, x, y, w, h, get, set, rowValue, tip }, extra)); }
    num(str, x, y, w, h, get, set, min, max, step, prec, tip, extra) { return this.add('NUM', Object.assign({ str, x, y, w, h, get, set, min, max, step, prec, tip }, extra)); }
    sli(str, x, y, w, h, get, set, min, max, prec, tip, extra) { return this.add('NUMSLI', Object.assign({ str, x, y, w, h, get, set, min, max, prec: prec == null ? 3 : prec, step: (max - min) / 100, tip }, extra)); }
    tex(str, x, y, w, h, get, set, maxlen, tip, extra) { return this.add('TEX', Object.assign({ str, x, y, w, h, get, set, maxlen: maxlen || 79, tip }, extra)); }
    menu(menu, x, y, w, h, get, set, tip, extra) { return this.add('MENU', Object.assign({ menu: typeof menu === 'function' ? menu : () => menu, x, y, w, h, get, set, tip }, extra)); }
    label(str, x, y, w, h, extra) { return this.add('LABEL', Object.assign({ str, x, y, w, h }, extra)); }
    icon(icon, x, y, w, h, func, tip, extra) { return this.add('BUT', Object.assign({ icon, x, y, w, h, func, tip, str: '' }, extra)); }
    icontog(icon, x, y, w, h, get, set, tip, extra) { return this.add('TOG', Object.assign({ icon, x, y, w, h, get, set, tip, str: '' }, extra)); }
    iconrow(icon0, count, x, y, w, h, get, set, tip, extra) { return this.add('ICONROW', Object.assign({ icon0, count, x, y, w, h, get, set, tip, str: '' }, extra)); }
    col3(x, y, w, h, get, extra) { return this.add('COL', Object.assign({ x, y, w, h, get }, extra)); }
    idpoin(str, x, y, w, h, get, set, tip, extra) { return this.add('IDPOIN', Object.assign({ str, x, y, w, h, get, set, tip }, extra)); }

    find(x, y) {
      for (let i = this.buts.length - 1; i >= 0; i--) {
        const b = this.buts[i];
        if (b.type === 'LABEL' && !b.func) continue;
        if (b.hidden) continue;
        if (b.inside(x, y)) return b;
      }
      return null;
    }

    draw() {
      for (const b of this.buts) if (!b.hidden) drawButton(this.r, b);
    }
  }

  function textY(y1, y2, font) {
    const f = B.font(font);
    const h = y2 - y1 + 1;
    return y1 + Math.floor((h - f.ascent + (font === 'helv8' ? 1 : 2)) / 2) + (font === 'helv12' ? 1 : font === 'helv8' ? 1 : 0);
  }

  function fitText(font, str, w) {
    if (B.textWidth(font, str) <= w) return str;
    let s = str;
    while (s.length > 1 && B.textWidth(font, s) > w) s = s.slice(1);
    return s;
  }

  function fitTextEnd(font, str, w) {
    if (B.textWidth(font, str) <= w) return str;
    let s = str;
    while (s.length > 1 && B.textWidth(font, s) > w) s = s.slice(0, -1);
    return s;
  }

  function drawButton(r, b) {
    const [x1, y1, x2, y2] = b.rect();
    const font = b.font || b.block.font;
    const pressed = UI.pressed === b;
    const editing = UI.edit && UI.edit.but === b;
    const t = b.type;
    if (t === 'LABEL') {
      const s = fitTextEnd(font, b.str, x2 - x1 + 1);
      const tx = b.center ? Math.round((x1 + x2 - B.textWidth(font, s)) / 2) : x1;
      r.text(font, s, tx, textY(y1, y2, font), b.textcol != null ? b.textcol : COL.BLACK);
      return;
    }
    if (t === 'SEPR') return;
    if (t === 'COL') {
      const c = b.get();
      r.frame(x1, y1, x2, y2, COL.BLACK);
      r.rect(x1 + 1, y1 + 1, x2, y2, B.rgbf(c[0], c[1], c[2]));
      return;
    }
    let sel = false;
    if (t === 'TOG' || t === 'TOGN' || t === 'ROW') sel = b.isOn();
    if ((t === 'BUT' || t === 'MENU' || t === 'ICONROW') && pressed) sel = true;
    if (b.forceSel) sel = true;
    if (editing) {
      emboss(r, x1, y1, x2, y2, B.shade(b.col, -20), true, b.flat);
    } else {
      emboss(r, x1, y1, x2, y2, b.col, sel, b.flat);
    }
    const textcol = editing ? COL.WHITE : sel ? COL.WHITE : COL.BLACK;
    if (t === 'NUMSLI' && !editing) {
      const lab = b.label();
      const lw = Math.min(B.textWidth(font, lab) + 6, Math.floor((x2 - x1) * 0.55));
      const sx1 = x1 + lw, sx2 = x2 - 4;
      const f = (b.value - b.min) / ((b.max - b.min) || 1);
      const ymid = Math.round((y1 + y2) / 2);
      r.hline(sx1, sx2, ymid, B.shade(b.col, -60));
      r.hline(sx1, sx2, ymid - 1, B.shade(b.col, 60));
      const kx = Math.round(sx1 + B.clamp(f, 0, 1) * (sx2 - sx1 - 4));
      r.rect(kx, ymid - 3, kx + 5, ymid + 4, COL.BLACK);
      r.rect(kx + 1, ymid - 2, kx + 4, ymid + 3, B.shade(b.col, 20));
      r.text(font, fitTextEnd(font, lab, lw - 2), x1 + 4, textY(y1, y2, font), textcol);
      return;
    }
    if (b.minusIcon) {
      const mx = Math.round((x1 + x2) / 2), my = Math.round((y1 + y2) / 2);
      r.rect(mx - 5, my - 2, mx + 5, my + 3, COL.BLACK);
      r.rect(mx - 4, my - 1, mx + 4, my + 2, COL.WHITE);
      return;
    }
    if (b.icon && t !== 'ICONROW') {
      const sc = Math.min(1, (y2 - y1 - 1) / 16, (x2 - x1 - 1) / 15);
      const iw = Math.round(15 * sc), ih = Math.round(16 * sc);
      const ix = Math.round((x1 + x2 + 1 - iw) / 2), iy = Math.round((y1 + y2 + 1 - ih) / 2);
      r.iconScaled(b.icon[0], b.icon[1], b.str ? x1 + 3 : ix, iy, sel ? B.shade(b.col, -60) : b.col, sc);
      if (b.str) r.text(font, b.str, x1 + 21, textY(y1, y2, font), textcol);
      return;
    }
    if (t === 'ICONROW') {
      const v = b.value;
      const ic = b.icons ? b.icons[v] : [b.icon0[0] + v, b.icon0[1]];
      r.icon(ic[0], ic[1], x1 + Math.round((x2 - x1 + 1 - 15) / 2) - 1, Math.round((y1 + y2 + 1 - 16) / 2), sel ? B.shade(b.col, -60) : b.col);
      const my = Math.round((y1 + y2) / 2);
      for (let i = 0; i < 3; i++) {
        r.vline(x1 - 3 + i, my - i, my + i, COL.BLACK);
        r.vline(x2 + 3 - i, my - i, my + i, COL.BLACK);
      }
      r.px(x1 - 3, my, COL.WHITE); r.px(x2 + 3, my, COL.WHITE);
      return;
    }
    let s;
    if (editing) {
      const e = UI.edit;
      const pre = (t === 'TEX' || t === 'IDPOIN') ? b.str : '';
      const full = pre + e.text;
      s = fitText(font, full, x2 - x1 - 6);
      const tx = x1 + 4, ty = textY(y1, y2, font);
      r.text(font, s, tx, ty, COL.WHITE);
      const cutoff = full.length - s.length;
      const cx = tx + B.textWidth(font, full.slice(cutoff, pre.length + e.cursor));
      r.rect(cx, y1 + 3, cx + 2, y2 - 2, rgb(255, 0, 0));
      return;
    }
    s = b.label();
    const avail = x2 - x1 - 2;
    if (t === 'MENU') {
      s = fitTextEnd(font, s, avail - 10);
      r.text(font, s, x1 + 4 + Math.max(0, Math.round((avail - 10 - B.textWidth(font, s)) / 2)), textY(y1, y2, font), textcol);
      const my = Math.round((y1 + y2) / 2);
      r.rect(x2 - 8, my - 1, x2 - 3, my + 2, COL.WHITE);
      r.hline(x2 - 8, x2 - 4, my - 1, COL.BLACK);
      return;
    }
    if (t === 'TEX' || t === 'IDPOIN') {
      s = fitTextEnd(font, s, avail);
      r.text(font, s, x1 + 4, textY(y1, y2, font), textcol);
      return;
    }
    s = fitText(font, s, avail);
    const tw = B.textWidth(font, s);
    const tx = b.left ? x1 + 4 : Math.round((x1 + x2 + 1 - tw) / 2);
    r.text(font, s, tx, textY(y1, y2, font), textcol);
  }

  const UI = {
    COL,
    emboss,
    parseMenu,
    fmtNum,
    Block,
    Button,
    drawButton,
    textY,
    fitText,
    fitTextEnd,
    pressed: null,
    edit: null,
    tipTimer: null
  };

  UI.press = function (ctx, block, but, ev) {
    const t = but.type;
    if (but.disabled) return null;
    if (t === 'TOG' || t === 'TOGN') {
      const cur = but.value;
      if (but.bit != null) but.value = cur ^ but.bit;
      else but.value = t === 'TOGN' ? !cur : !cur;
      if (but.func) but.func(ev);
      ctx.changed(but);
      return null;
    }
    if (t === 'ROW') {
      but.value = but.rowValue;
      if (but.func) but.func(ev);
      ctx.changed(but);
      return null;
    }
    if (t === 'BUT') {
      UI.pressed = but;
      ctx.redrawBlock(block);
      return {
        move(e) { const inside = but.inside(e.x, e.y); if ((UI.pressed === but) !== inside) { UI.pressed = inside ? but : null; ctx.redrawBlock(block); } },
        up(e) {
          const hit = but.inside(e.x, e.y);
          UI.pressed = null;
          ctx.redrawBlock(block);
          if (hit && but.func) but.func(e);
          if (hit) ctx.changed(but);
          return true;
        }
      };
    }
    if (t === 'TEX' || t === 'IDPOIN') {
      UI.startEdit(ctx, block, but, ev.x);
      return null;
    }
    if (t === 'NUM' || t === 'NUMSLI') {
      if (ev.shift && t === 'NUM') { UI.startEdit(ctx, block, but); return null; }
      const [x1, , x2] = but.rect();
      const start = but.value;
      const sx = ev.x;
      let moved = false;
      const sliderPart = t === 'NUMSLI' ? x1 + Math.min(B.textWidth(block.font, but.label()) + 6, Math.floor((x2 - x1) * 0.55)) : null;
      const onSlider = t === 'NUMSLI' && ev.x >= sliderPart;
      const setv = v => {
        v = B.clamp(v, but.min, but.max);
        if (but.prec <= 0) v = Math.round(v);
        but.value = v;
      };
      if (onSlider) {
        const apply = e => { const f = (e.x - sliderPart) / Math.max(1, x2 - 4 - sliderPart - 4); setv(but.min + B.clamp(f, 0, 1) * (but.max - but.min)); ctx.changed(but, true); };
        apply(ev);
        return { move: apply, up() { if (but.func) but.func(); ctx.changed(but); return true; } };
      }
      return {
        move(e) {
          const dx = e.x - sx;
          if (!moved && Math.abs(dx) < 3) return;
          moved = true;
          let step = but.step || 1;
          if (t === 'NUMSLI') step = (but.max - but.min) / 200;
          let delta = dx * step * (e.shift ? 0.1 : 1);
          if (e.ctrl) delta = Math.round(delta / (step * 10)) * step * 10;
          setv(start + delta);
          ctx.changed(but, true);
        },
        up(e) {
          if (!moved) {
            if (t === 'NUMSLI') { UI.startEdit(ctx, block, but); return true; }
            const w = x2 - x1;
            const rel = e.x - x1;
            const step = but.step || 1;
            const inc = but.prec <= 0 ? Math.max(1, step) : step * 10;
            if (rel < w * 0.35) setv(start - inc);
            else if (rel > w * 0.65) setv(start + inc);
            else { UI.startEdit(ctx, block, but); return true; }
          }
          if (but.func) but.func();
          ctx.changed(but);
          return true;
        }
      };
    }
    if (t === 'MENU') {
      UI.pressed = but;
      ctx.redrawBlock(block);
      const [x1, y1, x2, y2] = but.rect();
      UI.pupmenu(ctx, but.menu(), { x: x1, y: y1, w: x2 - x1, current: but.value, block: but }).then(v => {
        UI.pressed = null;
        if (v != null && v !== -1) {
          but.value = v;
          if (but.func) but.func(v);
          ctx.changed(but);
        }
        ctx.redrawBlock(block);
      });
      return null;
    }
    if (t === 'ICONROW') {
      const [x1, y1, x2, y2] = but.rect();
      UI.iconMenu(ctx, but, x1, y1, x2, y2).then(v => {
        if (v != null && v >= 0) {
          but.value = v;
          if (but.func) but.func(v);
          ctx.changed(but);
        }
        ctx.redrawBlock(block);
      });
      return null;
    }
    if (t === 'LABEL' && but.func) { but.func(ev); return null; }
    return null;
  };

  UI.startEdit = function (ctx, block, but, clickX) {
    const t = but.type;
    let text;
    if (t === 'NUM' || t === 'NUMSLI') text = fmtNum(but.value, but.prec);
    else text = but.value == null ? '' : String(but.value);
    UI.edit = { but, block, text, orig: text, cursor: text.length, ctx };
    ctx.redrawBlock(block);
  };

  UI.finishEdit = function (accept) {
    const e = UI.edit;
    if (!e) return;
    UI.edit = null;
    const but = e.but;
    if (accept && e.text !== e.orig) {
      if (but.type === 'NUM' || but.type === 'NUMSLI') {
        let v = UI.evalNumber(e.text);
        if (v != null && isFinite(v)) {
          v = B.clamp(v, but.min, but.max);
          if (but.prec <= 0) v = Math.round(v);
          but.value = v;
          if (but.func) but.func();
        }
      } else {
        but.value = but.maxlen ? e.text.slice(0, but.maxlen) : e.text;
        if (but.func) but.func();
      }
      e.ctx.changed(but);
    }
    e.ctx.redrawBlock(e.block);
  };

  UI.evalNumber = function (s) {
    s = String(s).trim();
    if (!/^[-+*/().0-9eE\s]+$/.test(s)) return null;
    try {
      const v = Function('"use strict";return (' + s + ')')();
      return typeof v === 'number' ? v : null;
    } catch (err) { return null; }
  };

  UI.editKey = function (ev) {
    const e = UI.edit;
    if (!e) return false;
    const k = ev.key;
    if (k === 'RET' || k === 'PADENTER') { UI.finishEdit(true); return true; }
    if (k === 'ESC') { UI.finishEdit(false); return true; }
    if (k === 'LEFTARROW') { e.cursor = ev.ctrl ? 0 : Math.max(0, e.cursor - 1); }
    else if (k === 'RIGHTARROW') { e.cursor = ev.ctrl ? e.text.length : Math.min(e.text.length, e.cursor + 1); }
    else if (k === 'HOME') e.cursor = 0;
    else if (k === 'END') e.cursor = e.text.length;
    else if (k === 'BACKSPACE') {
      if (ev.shift) { e.text = ''; e.cursor = 0; }
      else if (e.cursor > 0) { e.text = e.text.slice(0, e.cursor - 1) + e.text.slice(e.cursor); e.cursor--; }
    } else if (k === 'DEL') {
      e.text = e.text.slice(0, e.cursor) + e.text.slice(e.cursor + 1);
    } else if (ev.char && ev.char.length === 1 && !ev.ctrl && !ev.alt) {
      const max = e.but.maxlen || 79;
      if (e.text.length < max) {
        e.text = e.text.slice(0, e.cursor) + ev.char + e.text.slice(e.cursor);
        e.cursor++;
      }
    } else return true;
    e.ctx.redrawBlock(e.block);
    return true;
  };

  function popupFrame(r, x1, y1, x2, y2) {
    r.rect(x1 + 4, y1 - 4, x2 + 5, y1, B.rgb(0, 0, 0));
    r.rect(x2 + 1, y1 - 4, x2 + 5, y2 - 3, B.rgb(0, 0, 0));
    r.rect(x1, y1, x2 + 1, y2 + 1, COL.MENUGAP);
    r.hline(x1, x2, y2, COL.WHITE);
    r.vline(x1, y1, y2, COL.WHITE);
  }

  UI.pupmenu = function (ctx, str, opt = {}) {
    return new Promise(resolve => {
      const m = parseMenu(str);
      const font = 'helv12';
      const rowH = 20;
      const items = m.items;
      let w = Math.max(opt.w || 0, 60, B.textWidth(font, m.title) + 20, ...items.map(it => it.sep ? 0 : B.textWidth(font, it.str) + 24 + (it.icon ? 20 : 0)));
      const n = items.length + (m.title ? 1 : 0);
      const h = n * rowH + 4;
      const W = ctx.raster.w, H = ctx.raster.h;
      let cur = items.findIndex(it => !it.sep && it.value === opt.current);
      if (cur < 0) cur = items.findIndex(it => !it.sep);
      let mx = opt.x != null ? opt.x : ctx.mouse[0] - w / 2;
      let ytop;
      if (opt.block) ytop = opt.y + (items.length - cur) * rowH + (m.title ? rowH : 0) + rowH / 2;
      else {
        const ry = ctx.mouse[1];
        ytop = ry + (cur + 1 + (m.title ? 1 : 0)) * rowH - rowH / 2 + 2;
      }
      let x1 = Math.round(B.clamp(mx, 2, W - w - 8));
      let y2 = Math.round(B.clamp(ytop, h + 6, H - 3));
      const y1 = y2 - h;
      const rowAt = y => Math.floor((y2 - 2 - y) / rowH) - (m.title ? 1 : 0);
      let hot = cur;
      const close = v => { ctx.closeOverlay(ov); resolve(v); };
      const ov = {
        draw(r) {
          popupFrame(r, x1, y1, x1 + w, y2);
          let y = y2 - 2;
          if (m.title) {
            r.rect(x1 + 2, y - rowH + 3, x1 + w - 1, y, COL.MENUCAT);
            r.text('helvb12', m.title, x1 + 8, y - rowH + 8, COL.BLACK);
            y -= rowH;
          }
          items.forEach((it, i) => {
            if (it.sep) {
              r.rect(x1 + 2, y - rowH + 3, x1 + w - 1, y, COL.MENU);
              r.hline(x1 + 6, x1 + w - 6, y - rowH / 2 + 1, B.shade(COL.MENU, -60));
              r.hline(x1 + 6, x1 + w - 6, y - rowH / 2, COL.WHITE);
            } else {
              const on = i === hot;
              r.rect(x1 + 2, y - rowH + 3, x1 + w - 1, y, on ? COL.MENUHI : COL.MENU);
              let tx = x1 + 8;
              if (it.icon) { r.icon(it.icon[0], it.icon[1], tx, y - rowH + 4, on ? COL.MENUHI : COL.MENU); tx += 20; }
              r.text(font, it.str, tx, y - rowH + 8, on ? COL.WHITE : COL.BLACK);
            }
            y -= rowH;
          });
        },
        move(e) {
          const i = rowAt(e.y);
          const nh = (e.x >= x1 && e.x <= x1 + w && i >= 0 && i < items.length && !items[i].sep) ? i : -1;
          if (nh !== hot) { hot = nh; ctx.redrawOverlay(); }
          if (e.x < x1 - 60 || e.x > x1 + w + 60 || e.y < y1 - 60 || e.y > y2 + 60) close(-1);
        },
        down(e) {
          if (e.x < x1 || e.x > x1 + w || e.y < y1 || e.y > y2) { close(-1); return; }
          ov.armed = true;
        },
        up(e) {
          const i = rowAt(e.y);
          if (e.x >= x1 && e.x <= x1 + w && i >= 0 && i < items.length && !items[i].sep) close(items[i].value);
          else if (ov.armed) close(-1);
        },
        key(e) {
          if (e.key === 'ESC') close(-1);
          else if (e.key === 'RET' || e.key === 'PADENTER') { if (hot >= 0) close(items[hot].value); }
          else if (e.key === 'UPARROW' || e.key === 'DOWNARROW') {
            const d = e.key === 'UPARROW' ? -1 : 1;
            let i = hot;
            for (let k = 0; k < items.length; k++) { i = (i + d + items.length) % items.length; if (!items[i].sep) break; }
            hot = i; ctx.redrawOverlay();
          } else if (/^[1-9]$/.test(e.char || '')) {
            const real = items.filter(it => !it.sep);
            const it = real[+e.char - 1];
            if (it) close(it.value);
          }
        }
      };
      ctx.openOverlay(ov);
    });
  };

  UI.okee = function (ctx, str) {
    return UI.pupmenu(ctx, 'OK? %t|' + str + ' %x1').then(v => v === 1);
  };

  UI.error = function (ctx, str) {
    return new Promise(resolve => {
      const font = 'helv12';
      const msg = 'ERROR: ' + str;
      const w = B.textWidth(font, msg) + 24, h = 24;
      const x1 = Math.round(B.clamp(ctx.mouse[0] - w / 2, 2, ctx.raster.w - w - 8));
      const y1 = Math.round(B.clamp(ctx.mouse[1] - h / 2, 8, ctx.raster.h - h - 4));
      const close = () => { ctx.closeOverlay(ov); resolve(); };
      const ov = {
        draw(r) {
          popupFrame(r, x1, y1, x1 + w, y1 + h);
          r.rect(x1 + 2, y1 + 2, x1 + w - 1, y1 + h - 1, COL.MENU);
          r.text(font, msg, x1 + 12, y1 + 8, rgb(160, 0, 0));
        },
        move(e) { if (e.x < x1 - 40 || e.x > x1 + w + 40 || e.y < y1 - 40 || e.y > y1 + h + 40) close(); },
        down() { close(); },
        key() { close(); }
      };
      ctx.openOverlay(ov);
    });
  };

  UI.notice = function (ctx, str) {
    return new Promise(resolve => {
      const font = 'helv12';
      const w = B.textWidth(font, str) + 24, h = 24;
      const x1 = Math.round(B.clamp(ctx.mouse[0] - w / 2, 2, ctx.raster.w - w - 8));
      const y1 = Math.round(B.clamp(ctx.mouse[1] - h / 2, 8, ctx.raster.h - h - 4));
      const close = () => { ctx.closeOverlay(ov); resolve(); };
      const ov = {
        draw(r) {
          popupFrame(r, x1, y1, x1 + w, y1 + h);
          r.rect(x1 + 2, y1 + 2, x1 + w - 1, y1 + h - 1, COL.MENU);
          r.text(font, str, x1 + 12, y1 + 8, COL.BLACK);
        },
        move(e) { if (e.x < x1 - 40 || e.x > x1 + w + 40 || e.y < y1 - 40 || e.y > y1 + h + 40) close(); },
        down() { close(); },
        key() { close(); }
      };
      ctx.openOverlay(ov);
    });
  };

  UI.numButtons = function (ctx, title, fields) {
    return new Promise(resolve => {
      const font = 'helv12';
      const vals = fields.map(f => f.value);
      const rowH = 22;
      const w = Math.max(200, B.textWidth(font, title) + 30);
      const h = (fields.length + 2) * rowH + 8;
      const x1 = Math.round(B.clamp(ctx.mouse[0] - w / 2, 2, ctx.raster.w - w - 8));
      const y1 = Math.round(B.clamp(ctx.mouse[1] - h / 2, 8, ctx.raster.h - h - 4));
      const block = new Block(ctx.raster, { font: 'helv12' });
      block.col = COL.GREY;
      fields.forEach((f, i) => {
        const y = y1 + h - 6 - (i + 2) * rowH;
        if (f.type === 'tog') block.tog(f.label, x1 + 10, y, w - 20, 20, () => vals[i], v => { vals[i] = v; });
        else if (f.type === 'text') block.tex(f.label, x1 + 10, y, w - 20, 20, () => vals[i], v => { vals[i] = v; }, f.maxlen || 19);
        else block.num(f.label, x1 + 10, y, w - 20, 20, () => vals[i], v => { vals[i] = v; }, f.min, f.max, f.step || 1, f.prec || 0);
      });
      let done = false;
      const close = ok => {
        if (done) return;
        done = true;
        if (UI.edit) UI.finishEdit(true);
        ctx.closeOverlay(ov);
        resolve(ok ? vals : null);
      };
      const okb = block.but(title, x1 + 10, y1 + h - 6 - rowH, w - 20, 20, () => close(true));
      okb.col = COL.SALMON;
      let modal = null;
      const ov = {
        block,
        draw(r) {
          popupFrame(r, x1, y1, x1 + w, y1 + h);
          r.rect(x1 + 2, y1 + 2, x1 + w - 1, y1 + h - 1, COL.MENU);
          block.draw();
        },
        move(e) {
          if (modal && modal.move) { modal.move(e); return; }
          if (!UI.edit && (e.x < x1 - 50 || e.x > x1 + w + 50 || e.y < y1 - 50 || e.y > y1 + h + 50)) close(false);
        },
        down(e) {
          if (UI.edit) UI.finishEdit(true);
          const but = block.find(e.x, e.y);
          if (but) modal = UI.press(ctx, block, but, e);
          else if (e.x < x1 || e.x > x1 + w || e.y < y1 || e.y > y1 + h) close(false);
        },
        up(e) { if (modal && modal.up) modal.up(e); modal = null; },
        key(e) {
          if (UI.edit) { UI.editKey(e); return; }
          if (e.key === 'ESC') close(false);
          else if (e.key === 'RET' || e.key === 'PADENTER') close(true);
        }
      };
      ctx.openOverlay(ov);
    });
  };

  UI.button = function (ctx, label, value, min, max, prec, step) {
    return UI.numButtons(ctx, 'OK', [{ label, value, min, max, prec: prec || 0, step: step || 1 }]).then(v => (v ? v[0] : null));
  };

  UI.textInput = function (ctx, label, value, maxlen) {
    return UI.numButtons(ctx, 'OK', [{ label, value, type: 'text', maxlen }]).then(v => (v ? v[0] : null));
  };

  UI.iconMenu = function (ctx, but, bx1, by1, bx2, by2) {
    return new Promise(resolve => {
      const n = but.count;
      const cw = bx2 - bx1 + 1, ch = 20;
      const cur = but.value;
      const x1 = bx1, y2 = Math.min(ctx.raster.h - 2, by2 + (n - 1 - cur) * ch);
      const y1 = y2 - n * ch;
      let hot = cur;
      const close = v => { ctx.closeOverlay(ov); resolve(v); };
      const idxAt = (x, y) => (x < x1 || x > x1 + cw || y < y1 || y > y2) ? -1 : Math.floor((y2 - y) / ch);
      const ov = {
        draw(r) {
          r.rect(x1 + 3, y1 - 3, x1 + cw + 4, y2 - 2, B.rgb(0, 0, 0));
          for (let i = 0; i < n; i++) {
            const yy = y2 - (i + 1) * ch;
            const col = i === hot ? B.shade(but.col, -40) : but.col;
            emboss(r, x1, yy + 1, x1 + cw, yy + ch, col, i === hot, true);
            const ic = but.icons ? but.icons[i] : [but.icon0[0] + i, but.icon0[1]];
            r.icon(ic[0], ic[1], x1 + Math.round((cw - 15) / 2), yy + 3, col);
          }
        },
        move(e) {
          const i = idxAt(e.x, e.y);
          if (i !== hot && i >= 0) { hot = i; ctx.redrawOverlay(); }
          if (e.x < x1 - 50 || e.x > x1 + cw + 50 || e.y < y1 - 50 || e.y > y2 + 50) close(-1);
        },
        down(e) { if (idxAt(e.x, e.y) < 0) close(-1); },
        up(e) { const i = idxAt(e.x, e.y); if (i >= 0) close(i); },
        key(e) { if (e.key === 'ESC') close(-1); }
      };
      ctx.openOverlay(ov);
    });
  };

  UI.toolbox = function (ctx, pages, startPage) {
    return new Promise(resolve => {
      const font = 'helv12', bfont = 'helvb12';
      const rowH = 20, catW = 82, itemW = 170;
      const maxRows = Math.max(pages.length, ...pages.map(p => p.items.length));
      const h = maxRows * rowH + 2;
      const w = catW + itemW + 4;
      let page = Math.max(0, Math.min(pages.length - 1, startPage || 0));
      let sub = null;
      let hot = -1;
      const x1 = Math.round(B.clamp(ctx.mouse[0] - catW - itemW / 2, 2, ctx.raster.w - w - 8));
      const y2 = Math.round(B.clamp(ctx.mouse[1] + rowH * (page + 0.5), h + 6, ctx.raster.h - 3));
      const y1 = y2 - h;
      const close = v => { ctx.closeOverlay(ov); resolve(v); };
      const rowAt = y => Math.floor((y2 - 1 - y) / rowH);
      const items = () => (sub ? sub.items : pages[page].items);
      const ov = {
        draw(r) {
          popupFrame(r, x1, y1, x1 + w, y2);
          for (let i = 0; i < maxRows; i++) {
            const yt = y2 - 1 - i * rowH, yb = yt - rowH + 3;
            const p = pages[i];
            const on = !sub && i === page;
            r.rect(x1 + 2, yb, x1 + catW, yt + 1, p ? (on ? COL.MENUCATHI : COL.MENUCAT) : COL.MENUCAT);
            if (p) r.text(bfont, p.name, x1 + 6, yb + 5, on ? rgb(240, 240, 240) : COL.BLACK);
            const it = items()[i];
            const hi = it && i === hot && !it.sep;
            r.rect(x1 + catW + 3, yb, x1 + w - 1, yt + 1, hi ? COL.MENUHI : COL.MENU);
            if (it && !it.sep) {
              r.text(font, it.name, x1 + catW + 7, yb + 5, hi ? COL.WHITE : COL.BLACK);
              const rt = it.items ? '>>' : (it.key || '');
              if (rt) r.text(font, rt, x1 + w - 6 - B.textWidth(font, rt), yb + 5, hi ? COL.WHITE : COL.BLACK);
            }
          }
          if (sub) {
            r.rect(x1 + 2, y2 - 1 - rowH + 3, x1 + catW, y2, COL.MENUCATHI);
            r.text(bfont, sub.name.toUpperCase(), x1 + 6, y2 - 1 - rowH + 8, rgb(240, 240, 240));
          }
        },
        move(e) {
          const i = rowAt(e.y);
          if (e.x >= x1 && e.x <= x1 + catW && i >= 0 && i < pages.length && !sub) {
            if (page !== i) { page = i; hot = -1; ctx.redrawOverlay(); }
            return;
          }
          const nh = (e.x > x1 + catW && e.x <= x1 + w && i >= 0 && i < items().length) ? i : -1;
          if (nh !== hot) { hot = nh; ctx.redrawOverlay(); }
          if (e.x < x1 - 80 || e.x > x1 + w + 80 || e.y < y1 - 80 || e.y > y2 + 80) close(null);
        },
        down(e) {
          if (e.x < x1 || e.x > x1 + w || e.y < y1 || e.y > y2) { close(null); return; }
          ov.armed = true;
        },
        up(e) {
          const i = rowAt(e.y);
          if (e.x > x1 + catW && i >= 0 && i < items().length) {
            const it = items()[i];
            if (!it || it.sep) return;
            if (it.items) { sub = it; hot = -1; ctx.redrawOverlay(); return; }
            close(it);
          } else if (sub && e.x <= x1 + catW) { sub = null; ctx.redrawOverlay(); }
        },
        key(e) {
          if (e.key === 'ESC') { if (sub) { sub = null; ctx.redrawOverlay(); } else close(null); }
        }
      };
      ctx.openOverlay(ov);
    });
  };

  UI.pulldown = function (ctx, items, x, ytop) {
    return new Promise(resolve => {
      const font = 'helv12';
      const rowH = 19;
      const w = Math.max(120, ...items.map(it => (it.sep ? 0 : B.textWidth(font, it.str) + B.textWidth(font, it.key || '') + 40)));
      const h = items.length * rowH + 4;
      const x1 = Math.round(B.clamp(x, 2, ctx.raster.w - w - 8));
      const y2 = Math.round(Math.min(ytop, ctx.raster.h - 2));
      const y1 = y2 - h;
      let hot = -1;
      const rowAt = y => Math.floor((y2 - 2 - y) / rowH);
      const close = v => { ctx.closeOverlay(ov); resolve(v); };
      const ov = {
        draw(r) {
          popupFrame(r, x1, y1, x1 + w, y2);
          items.forEach((it, i) => {
            const yt = y2 - 2 - i * rowH, yb = yt - rowH + 1;
            const on = i === hot && !it.sep;
            r.rect(x1 + 2, yb, x1 + w - 1, yt + 1, on ? COL.MENUHI : COL.MENU);
            if (it.sep) { r.hline(x1 + 6, x1 + w - 6, yb + 9, B.shade(COL.MENU, -60)); r.hline(x1 + 6, x1 + w - 6, yb + 8, COL.WHITE); return; }
            const tc = on ? COL.WHITE : it.disabled ? B.shade(COL.MENU, -50) : COL.BLACK;
            r.text(font, it.str, x1 + 8, yb + 5, tc);
            if (it.key) r.text(font, it.key, x1 + w - 8 - B.textWidth(font, it.key), yb + 5, tc);
          });
        },
        move(e) {
          const i = rowAt(e.y);
          const nh = e.x >= x1 && e.x <= x1 + w && i >= 0 && i < items.length ? i : -1;
          if (nh !== hot) { hot = nh; ctx.redrawOverlay(); }
          if (e.x < x1 - 50 || e.x > x1 + w + 50 || e.y < y1 - 50 || e.y > y2 + 40) close(null);
        },
        down(e) { if (e.x < x1 || e.x > x1 + w || e.y < y1 || e.y > y2) close(null); else ov.armed = true; },
        up(e) {
          const i = rowAt(e.y);
          if (e.x >= x1 && e.x <= x1 + w && i >= 0 && i < items.length && !items[i].sep && !items[i].disabled) close(items[i]);
          else if (ov.armed) close(null);
        },
        key(e) { if (e.key === 'ESC') close(null); }
      };
      ctx.openOverlay(ov);
    }).then(it => { if (it && it.func) it.func(); return it; });
  };

  UI.drawTip = function (r, x, y, str) {
    const font = 'helv8';
    const w = B.textWidth(font, str) + 8, h = 13;
    const x1 = Math.round(B.clamp(x, 2, r.w - w - 3)), y1 = Math.round(B.clamp(y - h - 18, 2, r.h - h - 2));
    r.rect(x1 + 2, y1 - 2, x1 + w + 2, y1 + h - 2, B.rgb(0, 0, 0));
    r.rect(x1, y1, x1 + w, y1 + h, COL.TIP);
    r.frame(x1, y1, x1 + w - 1, y1 + h - 1, COL.BLACK);
    r.text(font, str, x1 + 4, y1 + 4, COL.BLACK);
  };

  B.UI = UI;
})(globalThis.B204 = globalThis.B204 || {});
