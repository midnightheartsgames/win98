(function (T) {
  'use strict';
  const { IN, clamp, lerp } = T;

  const FONT_H = "'Arial Black', Impact, 'Segoe UI', Tahoma, sans-serif";
  const FONT_T = "Tahoma, 'Segoe UI', Arial, sans-serif";

  const MENU_KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    Enter: 'ok', NumpadEnter: 'ok', Space: 'ok', KeyU: 'ok', Numpad4: 'ok',
    Escape: 'back', Backspace: 'back', KeyI: 'back', Numpad5: 'back',
    KeyJ: 'b3', KeyK: 'b4', Numpad1: 'b3', Numpad2: 'b4'
  };

  class UI {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      root.classList.add('tk3');
      root.tabIndex = 0;
      root.innerHTML = '<canvas class="tk3-gl"></canvas><canvas class="tk3-hud"></canvas>';
      this.glc = root.querySelector('.tk3-gl');
      this.hudc = root.querySelector('.tk3-hud');
      this.g = this.hudc.getContext('2d');
      this.gl = new T.GL(this.glc);
      this.glOk = this.gl.ok();
      this.scene = new T.Scene(this.glOk ? this.gl : null);
      this.save = T.loadSave();
      this.audio = new T.Audio();
      this.applyOpts();
      this.held = new Set();
      this.padPrev = [];
      this.padBits = [0, 0];
      this.portraits = new Map();
      this.clock = 0;
      this.acc = 0; this.last = performance.now();
      this.fpsN = 0; this.fpsT = 0; this.fps = 0;
      this.screen = null; this.screenName = '';
      this.destroyed = false;
      this.mouse = { x: 0, y: 0, click: false };
      this.hot = [];
      this.bindInput();
      this.resize();
      this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
      if (this.ro) this.ro.observe(root);
      this.go(this.opts.start || 'boot');
      this.frame = this.frame.bind(this);
      this.raf = requestAnimationFrame(this.frame);
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      if (this.screen && this.screen.leave) this.screen.leave();
      this.audio.close();
      if (this.glOk) this.gl.destroy();
      this.root.innerHTML = '';
    }

    isActive() { return !this.opts.isActive || this.opts.isActive(); }

    applyOpts() {
      const o = this.save.opts;
      this.audio.setVolumes({ sfx: o.sfx, music: o.music, voice: o.voice });
      this.audio.announcer = o.announcer;
    }

    persist() { T.writeSave(this.save); }

    resize() {
      const w = Math.max(320, this.root.clientWidth | 0), h = Math.max(240, this.root.clientHeight | 0);
      this.W = w; this.H = h;
      this.hudc.width = w; this.hudc.height = h;
      if (this.glOk) this.gl.resize(w, h);
      this.S = Math.min(w / 800, h / 600);
    }

    bindInput() {
      const r = this.root;
      this.onKeyDown = e => this.key(e, true);
      this.onKeyUp = e => this.key(e, false);
      r.addEventListener('keydown', this.onKeyDown);
      r.addEventListener('keyup', this.onKeyUp);
      r.addEventListener('blur', () => this.held.clear());
      r.addEventListener('mousedown', e => {
        this.audio.resume();
        r.focus({ preventScroll: true });
        const b = this.hudc.getBoundingClientRect();
        this.mouse.x = (e.clientX - b.left) * this.W / b.width; this.mouse.y = (e.clientY - b.top) * this.H / b.height;
        const hit = this.hot.find(h => this.mouse.x >= h.x && this.mouse.x <= h.x + h.w && this.mouse.y >= h.y && this.mouse.y <= h.y + h.h);
        if (hit && this.screen && this.screen.click) this.screen.click(hit.id, e.button);
        else if (this.screen && this.screen.input && e.button === 2) this.screen.input('back', 0);
      });
      r.addEventListener('mousemove', e => {
        const b = this.hudc.getBoundingClientRect();
        this.mouse.x = (e.clientX - b.left) * this.W / b.width; this.mouse.y = (e.clientY - b.top) * this.H / b.height;
        const hit = this.hot.find(h => this.mouse.x >= h.x && this.mouse.x <= h.x + h.w && this.mouse.y >= h.y && this.mouse.y <= h.y + h.h);
        if (hit && this.screen && this.screen.hover) this.screen.hover(hit.id);
      });
      r.addEventListener('contextmenu', e => e.preventDefault());
    }

    key(e, down) {
      if (!this.isActive()) return;
      this.audio.resume();
      const code = e.code;
      const game = this.gameCodes().has(code) || MENU_KEYS[code] || /^F\d+$/.test(code);
      if (game) e.preventDefault();
      if (down) {
        if (this.held.has(code) && !e.repeat) return;
        const rep = this.held.has(code);
        this.held.add(code);
        if (this.screen && this.screen.rawKey && this.screen.rawKey(code, e)) return;
        const act = this.menuActionFor(code);
        if (act && this.screen && this.screen.input && (!rep || act.a === 'up' || act.a === 'down' || act.a === 'left' || act.a === 'right')) this.screen.input(act.a, act.p);
      } else this.held.delete(code);
    }

    gameCodes() {
      if (!this._codes || this._codesV !== this.save.keys) {
        const s = new Set();
        for (const p of ['p1', 'p2']) for (const k in this.save.keys[p]) s.add(this.save.keys[p][k]);
        this._codes = s; this._codesV = this.save.keys;
      }
      return this._codes;
    }

    menuActionFor(code) {
      const k = this.save.keys;
      for (const [pi, p] of [[0, 'p1'], [1, 'p2']]) {
        const m = k[p];
        if (code === m.up) return { a: 'up', p: pi };
        if (code === m.down) return { a: 'down', p: pi };
        if (code === m.left) return { a: 'left', p: pi };
        if (code === m.right) return { a: 'right', p: pi };
        if (code === m.b1 || code === m.start) return { a: code === m.start ? 'start' : 'ok', p: pi };
        if (code === m.b2) return { a: 'back', p: pi };
        if (code === m.b3) return { a: 'b3', p: pi };
        if (code === m.b4) return { a: 'b4', p: pi };
      }
      const a = MENU_KEYS[code];
      return a ? { a, p: code.startsWith('Arrow') || code.startsWith('Numpad') ? 1 : 0 } : null;
    }

    bitsFor(pi, shared) {
      const k = this.save.keys;
      const map = (m) => {
        let b = 0;
        if (this.held.has(m.up)) b |= IN.U;
        if (this.held.has(m.down)) b |= IN.D;
        if (this.held.has(m.left)) b |= IN.B;
        if (this.held.has(m.right)) b |= IN.F;
        if (this.held.has(m.b1)) b |= IN.P1;
        if (this.held.has(m.b2)) b |= IN.P2;
        if (this.held.has(m.b3)) b |= IN.K3;
        if (this.held.has(m.b4)) b |= IN.K4;
        return b;
      };
      let b = map(pi === 0 ? k.p1 : k.p2);
      if (shared && pi === 0) {
        const o = map(k.p2);
        b |= o;
        if (this.held.has('KeyZ')) b |= IN.K3;
        if (this.held.has('KeyX')) b |= IN.K4;
      }
      b |= this.padBits[pi] || 0;
      if (shared && pi === 0) b |= this.padBits[1] || 0;
      if ((b & IN.U) && (b & IN.D)) b &= ~(IN.U | IN.D);
      if ((b & IN.F) && (b & IN.B)) b &= ~(IN.F | IN.B);
      return b;
    }

    pollPads() {
      const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
      let slot = 0;
      this.padBits = [0, 0];
      for (let i = 0; i < pads.length && slot < 2; i++) {
        const p = pads[i];
        if (!p || !p.connected) continue;
        const b = (n) => p.buttons[n] && p.buttons[n].pressed;
        const ax = p.axes || [];
        let bits = 0;
        if (b(12) || ax[1] < -0.5) bits |= IN.U;
        if (b(13) || ax[1] > 0.5) bits |= IN.D;
        if (b(14) || ax[0] < -0.5) bits |= IN.B;
        if (b(15) || ax[0] > 0.5) bits |= IN.F;
        if (b(2)) bits |= IN.P1;
        if (b(3)) bits |= IN.P2;
        if (b(0)) bits |= IN.K3;
        if (b(1)) bits |= IN.K4;
        if (b(4)) bits |= IN.P1 | IN.P2;
        if (b(5)) bits |= IN.K3 | IN.K4;
        if (b(6)) bits |= IN.P1 | IN.K3;
        if (b(7)) bits |= IN.P2 | IN.K4;
        this.padBits[slot] = bits;
        const prev = this.padPrev[slot] || {};
        const now = { up: !!(bits & IN.U), down: !!(bits & IN.D), left: !!(bits & IN.B), right: !!(bits & IN.F), ok: !!b(0), back: !!b(1), start: !!b(9), b3: !!b(2), b4: !!b(3) };
        if (this.screen && this.screen.input && this.isActive()) {
          for (const a in now) if (now[a] && !prev[a]) { this.audio.resume(); this.screen.input(a, slot, true); }
        }
        this.padPrev[slot] = now;
        slot++;
      }
    }

    go(name, args) {
      const S = T.SCREENS && T.SCREENS[name];
      if (!S) return;
      if (this.screen && this.screen.leave) this.screen.leave();
      this.screenName = name;
      this.screen = new S(this, args || {});
      this.hot = [];
      if (this.screen.enter) this.screen.enter();
    }

    frame(now) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame);
      const dt = Math.min(100, now - this.last);
      this.last = now;
      this.fpsN++; this.fpsT += dt;
      if (this.fpsT >= 1000) { this.fps = this.fpsN; this.fpsN = 0; this.fpsT = 0; }
      this.pollPads();
      const step = 1000 / 60;
      this.acc += dt;
      let n = 0;
      while (this.acc >= step && n < 5) {
        this.acc -= step; n++;
        this.clock++;
        if (this.screen && this.screen.step) this.screen.step();
      }
      if (this.acc > step * 5) this.acc = 0;
      this.hot = [];
      const g = this.g;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, this.W, this.H);
      if (this.screen && this.screen.draw) this.screen.draw(g, this.W, this.H);
      if (this.save.opts.fps) this.text(`${this.fps} FPS`, this.W - 6, 14, 11, '#9f9', 'right', FONT_T);
      this.audio.tick();
    }

    hotspot(id, x, y, w, h) { this.hot.push({ id, x, y, w, h }); }

    text(str, x, y, size, color, align, font, o) {
      const g = this.g;
      const op = o || {};
      g.font = `${op.weight || (font === FONT_T ? 'normal' : '900')} ${op.italic ? 'italic ' : ''}${Math.round(size)}px ${font || FONT_H}`;
      g.textAlign = align || 'left';
      g.textBaseline = op.base || 'alphabetic';
      if (op.stroke) { g.lineJoin = 'round'; g.lineWidth = op.stroke; g.strokeStyle = op.strokeColor || '#000'; g.strokeText(str, x, y); }
      if (op.shadow) { g.fillStyle = op.shadow; g.fillText(str, x + (op.sd || 2), y + (op.sd || 2)); }
      if (op.grad) {
        const gr = g.createLinearGradient(0, y - size, 0, y);
        op.grad.forEach(([p, c]) => gr.addColorStop(p, c));
        g.fillStyle = gr;
      } else g.fillStyle = color || '#fff';
      g.fillText(str, x, y);
      return g.measureText(str).width;
    }

    wrap(str, x, y, maxW, size, color, lineH, font) {
      const g = this.g;
      g.font = `${Math.round(size)}px ${font || FONT_T}`;
      const words = String(str).split(/\s+/);
      let line = '', yy = y;
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (g.measureText(t).width > maxW && line) {
          g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(line, x, yy);
          line = w; yy += lineH;
        } else line = t;
      }
      if (line) { g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(line, x, yy); yy += lineH; }
      return yy;
    }

    panel(x, y, w, h, o) {
      const g = this.g;
      const op = o || {};
      g.save();
      g.fillStyle = op.fill || 'rgba(8,8,14,0.82)';
      g.beginPath();
      const k = op.cut === undefined ? 12 : op.cut;
      g.moveTo(x + k, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h - k); g.lineTo(x + w - k, y + h); g.lineTo(x, y + h); g.lineTo(x, y + k); g.closePath();
      g.fill();
      g.strokeStyle = op.stroke || 'rgba(232,164,48,0.9)'; g.lineWidth = op.lw || 2;
      g.stroke();
      g.restore();
    }

    bg(kind) {
      const g = this.g, W = this.W, H = this.H, t = this.clock;
      const gr = g.createLinearGradient(0, 0, W, H);
      if (kind === 'red') { gr.addColorStop(0, '#2a0404'); gr.addColorStop(0.5, '#5a0a08'); gr.addColorStop(1, '#140202'); }
      else if (kind === 'blue') { gr.addColorStop(0, '#040a1e'); gr.addColorStop(0.5, '#0a1a44'); gr.addColorStop(1, '#02040e'); }
      else { gr.addColorStop(0, '#0c0806'); gr.addColorStop(0.5, '#2a1a0a'); gr.addColorStop(1, '#060403'); }
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.save();
      g.globalAlpha = 0.07;
      g.strokeStyle = '#ffb040'; g.lineWidth = 2;
      for (let i = -H; i < W; i += 36) {
        const o = (t * 0.6) % 36;
        g.beginPath(); g.moveTo(i + o, 0); g.lineTo(i + o + H, H); g.stroke();
      }
      g.restore();
    }

    portrait(def, costume) {
      const key = def.id + ':' + (costume || 0);
      let c = this.portraits.get(key);
      if (c) return c;
      c = T.makeCanvas(128, 128);
      this.portraits.set(key, c);
      if (!this.glOk) { this.fallbackPortrait(c, def); return c; }
      this.renderPortrait(c, def, costume || 0);
      return c;
    }

    fallbackPortrait(c, def) {
      const g = c.getContext('2d');
      g.fillStyle = '#222'; g.fillRect(0, 0, 128, 128);
      g.fillStyle = '#e8a430'; g.font = "900 22px " + FONT_H; g.textAlign = 'center';
      g.fillText(def.short.slice(0, 6), 64, 72);
    }

    renderPortrait(c, def, costume) {
      const gl = this.gl;
      const look = T.lookFor(def, costume);
      const B = Object.assign({}, T.BODY, def.body || {});
      const S = def.stancePose ? T.fillPose(def.stancePose, T.stancePose(def.stance)) : T.stancePose(def.stance);
      const pose = T.mod(S, { py: 0.25, cy: -0.1, hy: 0.35, hp: 0.05 });
      const j = T.solve(pose, B);
      const sc = B.size || 1;
      const head = [j.head[0], j.head[1] - 0.05 * sc, j.head[2]];
      const W0 = gl.W, H0 = gl.H;
      const size = 128;
      gl.gl.viewport(0, 0, size, size);
      gl.W = size; gl.H = size;
      gl.clear([0.12, 0.1, 0.1]);
      gl.setEnv({ light: T.vnorm([0.85, 0.45, 0.35]), lightCol: [0.9, 0.86, 0.8], sky: [0.45, 0.45, 0.5], gnd: [0.36, 0.32, 0.3], fog: [0.1, 0.1, 0.1], fogR: [50, 60], rim: [0.3, 0.22, 0.12] });
      const eye = [head[0] + 0.95 * sc, head[1] + 0.02, head[2] + 0.28 * sc];
      gl.camera(eye, [head[0], head[1] - 0.04 * sc, head[2]], 0.5, 0.05, 20);
      gl.setTint([1, 1, 1]);
      const mb = new T.MB(8000);
      T.buildFighter(mb, j, B, look, [0, 0, 0], 0);
      gl.drawDyn(mb, {});
      const g = c.getContext('2d');
      g.drawImage(this.glc, 0, this.glc.height - size, size, size, 0, 0, 128, 128);
      const gr = g.createLinearGradient(0, 80, 0, 128);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)');
      g.fillStyle = gr; g.fillRect(0, 80, 128, 48);
      gl.W = W0; gl.H = H0;
      gl.gl.viewport(0, 0, W0, H0);
    }

    fighterView(items, cam, stage, o) {
      if (!this.glOk) return;
      const sc = this.scene;
      if (stage !== undefined && sc.stage !== stage) sc.setStage(stage);
      sc.cam = { eye: cam.eye.slice(), at: cam.at.slice(), fov: cam.fov || 0.7 };
      sc.render(items, o);
    }

    clearGL(c) { if (this.glOk) this.gl.clear(c || [0, 0, 0]); }
  }

  const SCREENS = {};
  Object.assign(T, { UI, SCREENS, FONT_H, FONT_T });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
