(function (FO) {
  'use strict';

  const CYCLES = [
    { name: 'slime', first: 229, ms: 200 },
    { name: 'monitors', first: 233, ms: 100 },
    { name: 'fireSlow', first: 238, ms: 200 },
    { name: 'fireFast', first: 243, ms: 142 },
    { name: 'shore', first: 248, ms: 200 }
  ];
  const ALARM = 254;

  FO.TRANS = {
    glass: [72, 144, 255, 0.55],
    steam: [255, 255, 255, 0.6],
    energy: [255, 240, 80, 0.75],
    red: [255, 24, 0, 0.7],
    wall: [96, 96, 96, 0.45]
  };

  class Colors {
    constructor(pal) {
      this.base = pal.rgb;
      this.inv = pal.inv;
      this.rgb = new Uint8Array(pal.rgb);
      this.lut = new Uint32Array(256);
      this.phase = CYCLES.map(() => 0);
      this.due = CYCLES.map(() => 0);
      this.alarm = 0;
      this.alarmStep = 4;
      this.alarmDue = 0;
      this.gamma = 1;
      this.fade = 1;
      this.fadeTint = 0;
      this.shades = new Array(129);
      this.blends = {};
      this.cycle(0, true);
    }

    pushPalette(rgb) {
      this.stack = this.stack || [];
      this.stack.push(this.rgb);
      this.rgb = new Uint8Array(rgb);
      this.frozen = (this.frozen | 0) + 1;
      this.rebuild();
    }

    popPalette() {
      if (!this.stack || !this.stack.length) return;
      this.rgb = this.stack.pop();
      this.frozen = Math.max(0, (this.frozen | 0) - 1);
      this.cycle(0, true);
    }

    nearest(r, g, b) {
      return this.inv[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];
    }

    shade(level) {
      const l = level < 0 ? 0 : level > 128 ? 128 : level | 0;
      let t = this.shades[l];
      if (t) return t;
      t = new Uint8Array(256);
      for (let c = 1; c < 256; c++) {
        if (c >= 229 || l === 128) {
          t[c] = c;
          continue;
        }
        const r = (this.base[c * 3] * l) >> 7;
        const g = (this.base[c * 3 + 1] * l) >> 7;
        const b = (this.base[c * 3 + 2] * l) >> 7;
        t[c] = this.nearest(r, g, b);
      }
      this.shades[l] = t;
      return t;
    }

    blend(kind) {
      let t = this.blends[kind];
      if (t) return t;
      const [tr, tg, tb, alpha] = FO.TRANS[kind] || FO.TRANS.glass;
      t = new Uint8Array(65536);
      for (let s = 0; s < 256; s++) {
        const sr = this.base[s * 3];
        const sg = this.base[s * 3 + 1];
        const sb = this.base[s * 3 + 2];
        const a = Math.min(1, alpha * (0.35 + (sr + sg + sb) / 765));
        for (let d = 0; d < 256; d++) {
          const dr = this.base[d * 3];
          const dg = this.base[d * 3 + 1];
          const db = this.base[d * 3 + 2];
          t[(s << 8) | d] = this.nearest(dr + (tr - dr) * a, dg + (tg - dg) * a, db + (tb - db) * a);
        }
      }
      this.blends[kind] = t;
      return t;
    }

    setCycleColor(index, rgb) {
      this.rgb[index * 3] = rgb[0];
      this.rgb[index * 3 + 1] = rgb[1];
      this.rgb[index * 3 + 2] = rgb[2];
    }

    cycle(now, force) {
      if (this.frozen) return false;
      let changed = !!force;
      CYCLES.forEach((c, i) => {
        if (!force && now < this.due[i]) return;
        this.due[i] = now + c.ms;
        const list = FO.EXE.cycles[c.name];
        const n = list.length;
        if (!force) this.phase[i] = (this.phase[i] + 1) % n;
        for (let k = 0; k < n; k++) this.setCycleColor(c.first + k, list[(k + n - this.phase[i]) % n]);
        changed = true;
      });
      if (force || now >= this.alarmDue) {
        this.alarmDue = now + 33;
        this.alarm += this.alarmStep;
        if (this.alarm >= 252 || this.alarm <= 0) this.alarmStep = -this.alarmStep;
        this.alarm = Math.max(0, Math.min(252, this.alarm));
        this.setCycleColor(ALARM, [this.alarm, 0, 0]);
        changed = true;
      }
      if (changed) this.rebuild();
      return changed;
    }

    setFade(f, tint) {
      this.fadeJob = null;
      this.fade = f;
      this.fadeTint = tint | 0;
      this.rebuild();
    }

    fadeTo(target, ms, done) {
      if (this.fadeJob && this.fadeJob.done) this.fadeJob.done();
      this.fadeJob = { from: this.fade, to: target, ms, t: 0, done: done || null };
    }

    fading() {
      return !!this.fadeJob;
    }

    stepFade(ms) {
      const j = this.fadeJob;
      if (!j) return;
      j.t += ms;
      const k = Math.min(1, j.t / j.ms);
      this.fade = j.from + (j.to - j.from) * k;
      this.rebuild();
      if (k < 1) return;
      this.fadeJob = null;
      if (j.done) j.done();
    }

    rebuild() {
      const g = this.gamma;
      const f = this.fade;
      const t = this.fadeTint * (1 - f);
      const curve = c => g === 1 ? c : Math.min(63, Math.round(Math.pow(c >> 2, g))) << 2;
      for (let i = 0; i < 256; i++) {
        const r = curve(this.rgb[i * 3]);
        const gg = curve(this.rgb[i * 3 + 1]);
        const b = curve(this.rgb[i * 3 + 2]);
        this.lut[i] = 0xFF000000 | ((b * f + t) << 16) | ((gg * f + t) << 8) | (r * f + t);
      }
    }
  }

  FO.Colors = Colors;
})(globalThis.FO = globalThis.FO || {});
