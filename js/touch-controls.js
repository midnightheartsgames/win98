(function (root) {
  'use strict';
  if (root.TouchControls) return;

  const PX_PER_MM = 160 / 25.4;
  const PREFS_KEY = 'parohod98.touch';
  const DEFAULT_PREFS = { opacity: 0.55, scale: 1, left: false, vibrate: true };
  const LONG_PRESS = 450;
  const TAP_SLOP_MM = 2.5;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function readPrefs() {
    try { return Object.assign({}, DEFAULT_PREFS, JSON.parse(root.localStorage.getItem(PREFS_KEY)) || {}); } catch (e) { return Object.assign({}, DEFAULT_PREFS); }
  }

  function stickVector(dx, dy, radius, deadZone) {
    const len = Math.hypot(dx, dy);
    const over = radius > 0 ? len / radius : 0;
    if (len < 1e-6 || over <= deadZone) return { x: 0, y: 0, over };
    const k = Math.min(1, (over - deadZone) / (1 - deadZone)) / len;
    return { x: dx * k, y: dy * k, over };
  }

  function slide(dxMm, fullMm, deadZone) {
    const v = clamp(dxMm / fullMm, -1, 1);
    const a = Math.abs(v);
    return a <= deadZone ? 0 : Math.sign(v) * (a - deadZone) / (1 - deadZone);
  }

  function tiltSteer(angle, zero, full, dead) {
    if (!Number.isFinite(angle)) return 0;
    let d = angle - zero;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    const a = Math.abs(d);
    if (a <= dead) return 0;
    return Math.sign(d) * Math.min(1, (a - dead) / Math.max(1, full - dead));
  }

  function testChannel() {
    const b = root.Parohod98Game;
    if (!b || typeof b.info !== 'function') return false;
    try { return JSON.parse(b.info()).channel === 'test'; } catch (e) { return false; }
  }

  const STYLE = [
    '.tc-layer{position:fixed;inset:0;z-index:50;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}',
    '.tc-layer[hidden]{display:none}',
    '.tc-btn{position:absolute;box-sizing:border-box;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;font:bold 13px sans-serif;color:#fff;text-shadow:0 1px 2px #000;pointer-events:none;transition:transform .05s}',
    '.tc-btn.on{transform:scale(.92)}',
    '.tc-btn[hidden]{display:none}',
    '.tc-btn small{font-size:10px;font-weight:normal}',
    '.tc-stick{position:absolute;border-radius:50%;pointer-events:none;box-sizing:border-box}',
    '.tc-knob{position:absolute;border-radius:50%;pointer-events:none;box-sizing:border-box}',
    '.tc-hint{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);font:15px/1.4 sans-serif;color:#fff}',
    '.tc-hint div{max-width:88vw;max-height:90vh;display:flex;flex-direction:column;padding:10px 16px;box-sizing:border-box}',
    '.tc-hint h3{margin:0 0 4px}',
    '.tc-hint ul{margin:0;padding-left:18px;overflow:auto;flex:1;font-size:13px}',
    '.tc-hint li{margin:2px 0}',
    '.tc-hint button{margin-top:8px;min-height:44px;min-width:140px;align-self:center;font:bold 16px sans-serif}',
    '.tc-track{position:absolute;pointer-events:none;box-sizing:border-box;border-radius:999px}',
    '.tc-pad{position:absolute;display:flex;pointer-events:none;box-sizing:border-box;gap:4px}',
    '.tc-pad.mirror{flex-direction:row-reverse}',
    '.tc-pad[hidden],.tc-track[hidden],.tc-knob[hidden],.tc-stick[hidden]{display:none}',
    '.tc-pad i{flex:1 1 0;display:flex;align-items:center;justify-content:center;font:bold 14px sans-serif;font-style:normal;color:#fff;text-shadow:0 1px 2px #000;box-sizing:border-box;transition:transform .05s}',
    '.tc-pad i.on{transform:scale(.95)}',
    '.tc-list{position:fixed;z-index:55;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;inset:0;background:rgba(0,0,0,.45);padding:24px;box-sizing:border-box}',
    '.tc-list button{min-width:110px;min-height:56px;font:bold 14px sans-serif}'
  ].join('\n');

  class Controls {
    constructor(opts = {}) {
      this.prefs = readPrefs();
      this.cls = opts.className || '';
      this.bridge = root.Parohod98Game || null;
      this.items = [];
      this.owners = new Map();
      this.visible = true;
      this.userHidden = false;
      if (!document.getElementById('tc-style')) {
        const st = document.createElement('style');
        st.id = 'tc-style';
        st.textContent = STYLE;
        document.head.appendChild(st);
      }
      this.layer = document.createElement('div');
      this.layer.className = 'tc-layer ' + this.cls;
      document.body.appendChild(this.layer);
      const on = (t, fn) => this.layer.addEventListener(t, fn, { passive: false });
      on('pointerdown', e => this.down(e));
      on('pointermove', e => this.move(e));
      on('pointerup', e => this.up(e));
      on('pointercancel', e => this.up(e));
      on('contextmenu', e => e.preventDefault());
      this.onKey = e => { if (e.isTrusted && !['F10'].includes(e.code)) { this.userHidden = true; this.apply(); } };
      this.onTouch = () => { if (this.userHidden) { this.userHidden = false; this.apply(); } };
      root.addEventListener('keydown', this.onKey, true);
      root.addEventListener('touchstart', this.onTouch, { capture: true, passive: true });
      this.onResize = () => this.layout();
      root.addEventListener('resize', this.onResize);
    }

    mm(v) { return v * PX_PER_MM * this.prefs.scale; }

    safe() {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      const s = { top: parseFloat(cs.paddingTop) || 0, right: parseFloat(cs.paddingRight) || 0, bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0 };
      probe.remove();
      return s;
    }

    side(anchor) {
      if (!this.prefs.left) return anchor;
      const a = Object.assign({}, anchor);
      if ('left' in anchor || 'right' in anchor) { a.left = anchor.right; a.right = anchor.left; if (a.left === undefined) delete a.left; if (a.right === undefined) delete a.right; }
      return a;
    }

    zoneRect(z) {
      const W = root.innerWidth, H = root.innerHeight;
      let x = z.x * W;
      if (this.prefs.left) x = W - (z.x + z.w) * W;
      return { x, y: z.y * H, w: z.w * W, h: z.h * H };
    }

    button(o) {
      const el = document.createElement('div');
      el.className = 'tc-btn ' + (o.cls || '');
      el.innerHTML = '<b></b>' + (o.sub != null ? '<small></small>' : '');
      el.querySelector('b').textContent = o.label || '';
      if (o.sub) el.querySelector('small').textContent = o.sub;
      this.layer.appendChild(el);
      const b = Object.assign({ kind: 'button', el, down: false, shown: true, taps: 0 }, o);
      this.items.push(b);
      this.layout();
      return b;
    }

    stick(o) {
      const base = document.createElement('div');
      base.className = 'tc-stick ' + (o.cls || '');
      const knob = document.createElement('div');
      knob.className = 'tc-knob ' + (o.cls || '');
      this.layer.append(base, knob);
      const s = Object.assign({ kind: 'stick', base, knob, x: 0, y: 0, over: 0, active: false, deadZone: 0.08, radiusMm: 11 }, o);
      this.items.push(s);
      this.layout();
      return s;
    }

    slider(o) {
      const track = document.createElement('div');
      track.className = 'tc-track ' + (o.cls || '');
      const knob = document.createElement('div');
      knob.className = 'tc-knob ' + (o.cls || '');
      this.layer.append(track, knob);
      const s = Object.assign({ kind: 'slider', track, knob, value: 0, active: false, deadZone: 0.04, fullMm: 18, shown: true }, o);
      this.items.push(s);
      this.layout();
      return s;
    }

    pad(o) {
      const el = document.createElement('div');
      el.className = 'tc-pad ' + (o.cls || '');
      for (const p of o.parts) {
        const seg = document.createElement('i');
        seg.textContent = p.label || '';
        seg.style.flexGrow = p.flex || 1;
        p.el = seg;
        el.appendChild(seg);
      }
      this.layer.appendChild(el);
      const pad = Object.assign({ kind: 'pad', el, part: null, active: false, shown: true }, o);
      this.items.push(pad);
      this.layout();
      return pad;
    }

    sliderValue(sl, x) {
      return slide((x - sl.cx) / this.mm(1), sl.fullMm, sl.deadZone);
    }

    padPart(pad, x) {
      const r = pad.el.getBoundingClientRect();
      let rx = clamp((x - r.left) / Math.max(1, r.width), 0, 1);
      if (this.prefs.left) rx = 1 - rx;
      const total = pad.parts.reduce((a, p) => a + (p.flex || 1), 0);
      let acc = 0;
      for (const p of pad.parts) {
        acc += (p.flex || 1) / total;
        if (rx <= acc) return p.key;
      }
      return pad.parts[pad.parts.length - 1].key;
    }

    setPart(pad, key) {
      if (pad.part === key) return;
      pad.part = key;
      for (const p of pad.parts) p.el.classList.toggle('on', p.key === key);
      if (pad.onPart) pad.onPart(key);
    }

    hitPad(pad, x, y) {
      if (!pad.shown || this.layer.hidden) return false;
      const r = pad.el.getBoundingClientRect();
      return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }

    look(o) {
      const l = Object.assign({ kind: 'look', dx: 0, dy: 0, active: false }, o);
      this.items.push(l);
      return l;
    }

    layout() {
      const sf = this.safe(), op = this.prefs.opacity;
      for (const it of this.items) {
        if (it.kind === 'button') {
          const a = this.side(it.at), d = this.mm(it.size);
          Object.assign(it.el.style, { width: d + 'px', height: d + 'px', left: '', right: '', top: '', bottom: '', opacity: it.down ? Math.min(1, op + 0.3) : op });
          if (a.left !== undefined) it.el.style.left = sf.left + this.mm(a.left) + 'px';
          if (a.right !== undefined) it.el.style.right = sf.right + this.mm(a.right) + 'px';
          if (a.top !== undefined) it.el.style.top = sf.top + this.mm(a.top) + 'px';
          if (a.bottom !== undefined) it.el.style.bottom = sf.bottom + this.mm(a.bottom) + 'px';
          it.el.hidden = !it.shown;
        } else if (it.kind === 'stick') {
          const r = this.mm(it.radiusMm), z = this.zoneRect(it.zone);
          const cx = it.active ? it.cx : z.x + Math.max(sf.left, 0) + r + this.mm(10), cy = it.active ? it.cy : z.y + z.h - r - this.mm(10);
          Object.assign(it.base.style, { width: 2 * r + 'px', height: 2 * r + 'px', left: cx - r + 'px', top: cy - r + 'px', opacity: it.active ? op : op * 0.6 });
          const kr = r * 0.45;
          Object.assign(it.knob.style, { width: 2 * kr + 'px', height: 2 * kr + 'px', left: cx + it.x * r - kr + 'px', top: cy + it.y * r - kr + 'px', opacity: it.active ? Math.min(1, op + 0.3) : op * 0.6 });
          it.base.hidden = it.knob.hidden = it.shown === false;
        } else if (it.kind === 'slider') {
          const full = this.mm(it.fullMm), th = this.mm(5), kr = this.mm(4.5), z = this.zoneRect(it.zone);
          const cx = it.active ? it.cx : z.x + Math.max(sf.left, 0) + full + this.mm(8), cy = it.active ? it.cy : z.y + z.h - this.mm(12);
          Object.assign(it.track.style, { width: 2 * full + 'px', height: th + 'px', left: cx - full + 'px', top: cy - th / 2 + 'px', opacity: it.active ? op : op * 0.5 });
          Object.assign(it.knob.style, { width: 2 * kr + 'px', height: 2 * kr + 'px', left: cx + it.value * full - kr + 'px', top: cy - kr + 'px', opacity: it.active ? Math.min(1, op + 0.3) : op * 0.5 });
          it.track.hidden = it.knob.hidden = !it.shown;
        } else if (it.kind === 'pad') {
          const a = this.side(it.at);
          Object.assign(it.el.style, { width: this.mm(it.w) + 'px', height: this.mm(it.h) + 'px', left: '', right: '', top: '', bottom: '', opacity: op });
          if (a.left !== undefined) it.el.style.left = sf.left + this.mm(a.left) + 'px';
          if (a.right !== undefined) it.el.style.right = sf.right + this.mm(a.right) + 'px';
          if (a.top !== undefined) it.el.style.top = sf.top + this.mm(a.top) + 'px';
          if (a.bottom !== undefined) it.el.style.bottom = sf.bottom + this.mm(a.bottom) + 'px';
          it.el.classList.toggle('mirror', !!this.prefs.left);
          it.el.hidden = !it.shown;
        }
      }
    }

    hitButton(b, x, y) {
      if (!b.shown || this.layer.hidden) return false;
      const r = b.el.getBoundingClientRect();
      if (!r.width) return false;
      const pad = this.mm(1.5);
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      return Math.hypot(x - cx, y - cy) <= r.width / 2 + pad;
    }

    inZone(z, x, y) {
      const r = this.zoneRect(z);
      return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    }

    down(e) {
      e.preventDefault();
      const x = e.clientX, y = e.clientY;
      let owner = null;
      for (let i = this.items.length - 1; i >= 0 && !owner; i--) {
        const it = this.items[i];
        if (it.kind === 'button' && this.hitButton(it, x, y)) owner = it;
        else if (it.kind === 'pad' && !it.active && this.hitPad(it, x, y)) owner = it;
      }
      if (!owner) for (const it of this.items) if ((it.kind === 'stick' || it.kind === 'look' || it.kind === 'slider') && it.shown !== false && !it.active && this.inZone(it.zone, x, y)) { owner = it; break; }
      if (!owner) return;
      try { this.layer.setPointerCapture(e.pointerId); } catch (err) {}
      this.owners.set(e.pointerId, { it: owner, x, y, sx: x, sy: y, t: performance.now(), moved: false, long: null });
      const o = this.owners.get(e.pointerId);
      if (owner.kind === 'button') {
        owner.down = true;
        owner.el.classList.add('on');
        owner.el.style.opacity = Math.min(1, this.prefs.opacity + 0.3);
        if (owner.onDown) owner.onDown();
        if (owner.onLong) o.long = setTimeout(() => { o.long = 'fired'; owner.onLong(); }, LONG_PRESS);
      } else if (owner.kind === 'stick') {
        owner.active = true;
        owner.cx = x; owner.cy = y; owner.x = owner.y = 0;
        this.layout();
      } else if (owner.kind === 'slider') {
        owner.active = true;
        owner.cx = x; owner.cy = y; owner.value = 0;
        this.layout();
      } else if (owner.kind === 'pad') {
        owner.active = true;
        this.setPart(owner, this.padPart(owner, x));
      } else {
        owner.active = true;
      }
      if (this.onAny) this.onAny();
    }

    move(e) {
      const o = this.owners.get(e.pointerId);
      if (!o) return;
      e.preventDefault();
      const it = o.it, x = e.clientX, y = e.clientY;
      const dx = x - o.x, dy = y - o.y;
      o.x = x; o.y = y;
      if (!o.moved && Math.hypot(x - o.sx, y - o.sy) > this.mm(TAP_SLOP_MM)) {
        o.moved = true;
        if (o.long && o.long !== 'fired') { clearTimeout(o.long); o.long = null; }
      }
      if (it.kind === 'stick') {
        const v = stickVector(x - it.cx, y - it.cy, this.mm(it.radiusMm), it.deadZone);
        it.x = v.x; it.y = v.y; it.over = v.over;
        this.layout();
      } else if (it.kind === 'slider') {
        it.value = this.sliderValue(it, x);
        this.layout();
      } else if (it.kind === 'pad') {
        this.setPart(it, this.padPart(it, x));
      } else if (it.kind === 'look' || (it.kind === 'button' && it.look)) {
        const target = it.kind === 'look' ? it : it.look;
        target.dx += dx / (PX_PER_MM * this.prefs.scale);
        target.dy += dy / (PX_PER_MM * this.prefs.scale);
      }
      if (it.kind === 'button' && it.onSwipe && o.moved) {
        const sx = (x - o.sx) / this.mm(1);
        if (Math.abs(sx) >= 8) { it.onSwipe(Math.sign(sx)); o.sx = x; o.swiped = true; }
      }
    }

    up(e) {
      const o = this.owners.get(e.pointerId);
      if (!o) return;
      e.preventDefault();
      this.owners.delete(e.pointerId);
      const it = o.it;
      if (o.long && o.long !== 'fired') clearTimeout(o.long);
      if (it.kind === 'button') {
        it.down = false;
        it.el.classList.remove('on');
        it.el.style.opacity = this.prefs.opacity;
        if (it.onUp) it.onUp();
        if (it.onTap && o.long !== 'fired' && !o.swiped && (!o.moved || !it.look)) it.onTap();
      } else if (it.kind === 'stick') {
        it.active = false; it.x = it.y = it.over = 0;
        this.layout();
      } else if (it.kind === 'slider') {
        it.active = false; it.value = 0;
        this.layout();
      } else if (it.kind === 'pad') {
        it.active = false;
        this.setPart(it, null);
      } else {
        it.active = false;
      }
    }

    takeLook(l) {
      const d = { dx: l.dx, dy: l.dy };
      l.dx = l.dy = 0;
      return d;
    }

    release() {
      for (const [id] of this.owners) this.up({ pointerId: id, preventDefault() {} });
    }

    show(on) {
      this.visible = !!on;
      this.apply();
    }

    apply() {
      const hide = !this.visible || this.userHidden;
      if (hide && !this.layer.hidden) this.release();
      this.layer.hidden = hide;
    }

    setShown(b, on) {
      if (b.shown === !!on) return;
      b.shown = !!on;
      if (b.el) b.el.hidden = !on;
      if (b.kind === 'slider') b.track.hidden = b.knob.hidden = !on;
      if (b.kind === 'stick') b.base.hidden = b.knob.hidden = !on;
      if (!on) for (const [id, o] of this.owners) if (o.it === b) this.up({ pointerId: id, preventDefault() {} });
    }

    vibrate(ms) {
      if (!this.prefs.vibrate) return;
      if (this.bridge && this.bridge.vibrate) this.bridge.vibrate(ms);
      else if (root.navigator && root.navigator.vibrate) root.navigator.vibrate(ms);
    }

    hint(key, title, lines, okText) {
      const store = 'parohod98.hint.' + key;
      try { if (root.localStorage.getItem(store)) return null; } catch (e) {}
      return this.showHint(title, lines, okText, () => { try { root.localStorage.setItem(store, '1'); } catch (e) {} });
    }

    showHint(title, lines, okText, done) {
      const box = document.createElement('div');
      box.className = 'tc-hint ' + this.cls;
      const inner = document.createElement('div');
      const h = document.createElement('h3');
      h.textContent = title;
      const ul = document.createElement('ul');
      for (const l of lines) { const li = document.createElement('li'); li.textContent = l; ul.appendChild(li); }
      const ok = document.createElement('button');
      ok.textContent = okText || 'Понятно';
      inner.append(h, ul, ok);
      box.appendChild(inner);
      document.body.appendChild(box);
      const close = () => { box.remove(); if (done) done(); };
      box.addEventListener('click', close);
      return box;
    }

    choose(options, onPick) {
      const box = document.createElement('div');
      box.className = 'tc-list ' + this.cls;
      for (const opt of options) {
        const b = document.createElement('button');
        b.textContent = opt.label;
        b.disabled = !!opt.disabled;
        b.addEventListener('click', ev => { ev.stopPropagation(); if (performance.now() - opened < 400) return; box.remove(); onPick(opt.value); });
        box.appendChild(b);
      }
      const opened = performance.now();
      box.addEventListener('click', () => { if (performance.now() - opened > 400) box.remove(); });
      document.body.appendChild(box);
      return box;
    }

    destroy() {
      this.release();
      root.removeEventListener('keydown', this.onKey, true);
      root.removeEventListener('touchstart', this.onTouch, { capture: true });
      root.removeEventListener('resize', this.onResize);
      this.layer.remove();
    }
  }

  root.TouchControls = {
    PX_PER_MM,
    PREFS_KEY,
    DEFAULT_PREFS,
    stickVector,
    slide,
    tiltSteer,
    testChannel,
    readPrefs,
    clamp,
    wanted: () => !!(root.Parohod98 || (root.location && /[?&]touch\b/.test(root.location.search))),
    create: opts => new Controls(opts)
  };
})(typeof window !== 'undefined' ? window : globalThis);
