(function (M) {
  'use strict';
  const LAYOUTS = {
    full: [[0, 0, 1, 1]],
    two_h: [[0, 0, 1, 0.5], [0, 0.5, 1, 1]],
    two_v: [[0, 0, 0.5, 1], [0.5, 0, 1, 1]],
    three_a: [[0, 0, 1, 0.52], [0, 0.52, 0.5, 1], [0.5, 0.52, 1, 1]],
    three_b: [[0, 0, 0.5, 0.48], [0.5, 0, 1, 0.48], [0, 0.48, 1, 1]],
    three_v: [[0, 0, 0.34, 1], [0.34, 0, 0.67, 1], [0.67, 0, 1, 1]],
    three_h: [[0, 0, 1, 0.34], [0, 0.34, 1, 0.67], [0, 0.67, 1, 1]],
    four: [[0, 0, 0.5, 0.5], [0.5, 0, 1, 0.5], [0, 0.5, 0.5, 1], [0.5, 0.5, 1, 1]],
    l_big: [[0, 0, 0.62, 1], [0.62, 0, 1, 0.5], [0.62, 0.5, 1, 1]],
    r_big: [[0, 0, 0.38, 0.5], [0, 0.5, 0.38, 1], [0.38, 0, 1, 1]],
    strip4: [[0, 0, 1, 0.42], [0, 0.42, 0.34, 1], [0.34, 0.42, 0.67, 1], [0.67, 0.42, 1, 1]],
    top3: [[0, 0, 0.34, 0.45], [0.34, 0, 0.67, 0.45], [0.67, 0, 1, 0.45], [0, 0.45, 1, 1]],
    five: [[0, 0, 0.5, 0.36], [0.5, 0, 1, 0.36], [0, 0.36, 1, 0.68], [0, 0.68, 0.5, 1], [0.5, 0.68, 1, 1]],
    wide3: [[0, 0, 1, 0.3], [0, 0.3, 1, 0.65], [0, 0.65, 1, 1]]
  };
  M.NOVEL_LAYOUTS = LAYOUTS;

  function wrap(c, text, maxW) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  const ART = {
    black(c, w, h) { c.fillStyle = '#050505'; c.fillRect(0, 0, w, h); },
    title(c, w, h, p) {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#07080c'); g.addColorStop(1, '#161a22');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      ART.snowflakes(c, w, h, 160, 11);
      c.textAlign = 'center';
      c.fillStyle = '#e8e4d8';
      c.font = `${Math.round(h * 0.05)}px Georgia, serif`;
      c.fillText(p.sup || '', w / 2, h * 0.4);
      c.font = `bold ${Math.round(h * 0.085)}px Georgia, serif`;
      const lines = wrap(c, p.text || '', w * 0.86);
      lines.forEach((L, i) => c.fillText(L, w / 2, h * 0.53 + i * h * 0.1));
      if (p.sub) { c.font = `italic ${Math.round(h * 0.04)}px Georgia, serif`; c.fillStyle = '#b8b0a0'; c.fillText(p.sub, w / 2, h * 0.53 + lines.length * h * 0.1 + h * 0.03); }
    },
    snowflakes(c, w, h, n, seed) {
      const r = new M.RNG(seed || 3);
      for (let i = 0; i < n; i++) { c.fillStyle = `rgba(230,235,245,${0.2 + r.next() * 0.7})`; c.beginPath(); c.arc(r.next() * w, r.next() * h, 0.6 + r.next() * 2.2, 0, 6.3); c.fill(); }
    },
    skyline(c, w, h, p) {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0a0c12'); g.addColorStop(0.7, '#2a2a34'); g.addColorStop(1, '#3a3036');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const r = new M.RNG(p && p.seed || 5);
      for (let layer = 0; layer < 3; layer++) {
        let x = -10;
        const base = h * (0.55 + layer * 0.12);
        while (x < w) {
          const bw = w * r.range(0.04, 0.12), bh = h * r.range(0.15, 0.55) * (1 - layer * 0.2);
          c.fillStyle = ['#15171c', '#0f1014', '#08090b'][layer];
          c.fillRect(x, base - bh, bw, h);
          if (r.chance(0.2)) c.fillRect(x + bw * 0.45, base - bh - h * 0.05, bw * 0.1, h * 0.05);
          for (let yy = base - bh + 5; yy < h; yy += 7) for (let xx = x + 3; xx < x + bw - 3; xx += 6) if (r.chance(0.12)) { c.fillStyle = r.chance(0.7) ? 'rgba(240,200,120,0.8)' : 'rgba(190,210,250,0.7)'; c.fillRect(xx, yy, 2, 3); }
          x += bw + r.range(0, 6);
        }
      }
      if (p && p.tower) { c.fillStyle = '#050608'; c.fillRect(w * 0.44, h * 0.05, w * 0.12, h); c.fillRect(w * 0.48, 0, w * 0.04, h * 0.1); c.fillStyle = 'rgba(255,60,40,0.9)'; c.fillRect(w * 0.495, h * 0.02, 3, 3); }
      ART.snowflakes(c, w, h, 220, 7);
    },
    newspaper(c, w, h, p) {
      c.fillStyle = '#1a1814'; c.fillRect(0, 0, w, h);
      c.save(); c.translate(w / 2, h / 2); c.rotate(p.rot || -0.05);
      const pw = w * 0.86, ph = h * 0.9;
      c.fillStyle = '#d8d2c0'; c.fillRect(-pw / 2, -ph / 2, pw, ph);
      c.fillStyle = '#1a1a1a';
      c.textAlign = 'center';
      c.font = `bold ${Math.round(ph * 0.1)}px Georgia, serif`;
      c.fillText(p.paper || 'НЬЮ-ЙОРК ДЕЙЛИ', 0, -ph / 2 + ph * 0.13);
      c.fillRect(-pw / 2 + 10, -ph / 2 + ph * 0.17, pw - 20, 2);
      c.font = `bold ${Math.round(ph * 0.085)}px Arial, sans-serif`;
      wrap(c, p.text || '', pw * 0.9).forEach((L, i) => c.fillText(L, 0, -ph / 2 + ph * 0.31 + i * ph * 0.1));
      c.fillStyle = '#7a766a';
      c.fillRect(-pw / 2 + 14, ph * 0.02, pw * 0.4, ph * 0.38);
      for (let i = 0; i < 12; i++) c.fillRect(pw * 0.02, ph * 0.02 + i * ph * 0.032, pw * 0.44, 2);
      c.restore();
    },
    letter(c, w, h, p) {
      c.fillStyle = '#16140f'; c.fillRect(0, 0, w, h);
      c.save(); c.translate(w / 2, h / 2); c.rotate(p.rot || 0.03);
      const pw = w * 0.8, ph = h * 0.9;
      c.fillStyle = '#e4dcc4'; c.fillRect(-pw / 2, -ph / 2, pw, ph);
      c.fillStyle = '#2a2440';
      c.textAlign = 'left';
      c.font = `italic ${Math.round(Math.min(h * 0.06, w * 0.04))}px "Segoe Script", "Comic Sans MS", cursive`;
      wrap(c, p.text || '', pw * 0.85).forEach((L, i) => c.fillText(L, -pw / 2 + pw * 0.07, -ph / 2 + ph * 0.13 + i * h * 0.075));
      c.restore();
    },
    phone(c, w, h, p) {
      const g = c.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.7);
      g.addColorStop(0, '#3a3024'); g.addColorStop(1, '#060504');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = '#0c0c0c';
      c.save(); c.translate(w * 0.5, h * 0.55); c.rotate(-0.4);
      c.fillRect(-w * 0.3, -h * 0.07, w * 0.6, h * 0.14);
      c.beginPath(); c.ellipse(-w * 0.3, 0, w * 0.08, h * 0.12, 0, 0, 6.3); c.fill();
      c.beginPath(); c.ellipse(w * 0.3, 0, w * 0.08, h * 0.12, 0, 0, 6.3); c.fill();
      c.fillStyle = 'rgba(255,230,190,0.18)'; c.fillRect(-w * 0.28, -h * 0.065, w * 0.56, h * 0.025);
      c.restore();
      if (p.ring) { c.strokeStyle = 'rgba(255,240,200,0.6)'; c.lineWidth = 3; for (let i = 1; i < 4; i++) { c.beginPath(); c.arc(w * 0.78, h * 0.3, i * w * 0.04, -1, 0.4); c.stroke(); } }
    },
    pills(c, w, h) {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
      g.addColorStop(0, '#2a2620'); g.addColorStop(1, '#050404');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = '#c8781a'; c.fillRect(w * 0.38, h * 0.25, w * 0.24, h * 0.55);
      c.fillStyle = '#eee8dc'; c.fillRect(w * 0.36, h * 0.18, w * 0.28, h * 0.1);
      c.fillStyle = '#f0e8d0'; c.fillRect(w * 0.4, h * 0.42, w * 0.2, h * 0.2);
      c.fillStyle = '#e8e2d4';
      const r = new M.RNG(3);
      for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(w * r.range(0.15, 0.85), h * r.range(0.82, 0.95), w * 0.025, h * 0.015, r.range(0, 3), 0, 6.3); c.fill(); }
    },
    tv(c, w, h, p) {
      c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#1e2a30'; c.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
      g.addColorStop(0, p.color || '#3a5a6a'); g.addColorStop(1, '#0a1418');
      c.fillStyle = g; c.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
      c.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = h * 0.1; y < h * 0.9; y += 3) c.fillRect(w * 0.1, y, w * 0.8, 1);
      if (p.face) { c.fillStyle = '#c8a08a'; c.beginPath(); c.ellipse(w * 0.5, h * 0.42, w * 0.1, h * 0.15, 0, 0, 6.3); c.fill(); c.fillStyle = '#2a2a3a'; c.fillRect(w * 0.34, h * 0.56, w * 0.32, h * 0.3); }
      if (p.photo) { c.fillStyle = '#9a9488'; c.fillRect(w * 0.62, h * 0.18, w * 0.2, h * 0.28); c.fillStyle = '#3a342c'; c.beginPath(); c.ellipse(w * 0.72, h * 0.3, w * 0.05, h * 0.07, 0, 0, 6.3); c.fill(); }
      c.fillStyle = 'rgba(200,20,20,0.85)'; c.fillRect(w * 0.1, h * 0.74, w * 0.8, h * 0.1);
      c.fillStyle = '#fff'; c.textAlign = 'left'; c.font = `bold ${Math.round(h * 0.055)}px Arial, sans-serif`;
      c.fillText(p.text || '', w * 0.13, h * 0.81);
    },
    syringe(c, w, h) {
      c.fillStyle = '#060606'; c.fillRect(0, 0, w, h);
      c.save(); c.translate(w / 2, h / 2); c.rotate(-0.5);
      c.fillStyle = 'rgba(200,220,230,0.55)'; c.fillRect(-w * 0.28, -h * 0.05, w * 0.4, h * 0.1);
      c.fillStyle = 'rgba(40,120,200,0.8)'; c.fillRect(-w * 0.2, -h * 0.035, w * 0.3, h * 0.07);
      c.fillStyle = '#aaa'; c.fillRect(w * 0.12, -h * 0.006, w * 0.22, h * 0.012);
      c.fillStyle = '#ccc'; c.fillRect(-w * 0.36, -h * 0.06, w * 0.08, h * 0.12);
      c.restore();
      c.strokeStyle = '#a0101a'; c.lineWidth = w * 0.025;
      c.beginPath(); c.moveTo(w * 0.62, h * 0.15); c.lineTo(w * 0.72, h * 0.42); c.lineTo(w * 0.82, h * 0.15); c.stroke();
    },
    blood(c, w, h) {
      c.fillStyle = '#080404'; c.fillRect(0, 0, w, h);
      const r = new M.RNG(8);
      c.fillStyle = '#6a0606';
      for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(w * (0.3 + r.next() * 0.4) + r.range(-w * 0.2, w * 0.2), h * (0.3 + r.next() * 0.4), r.range(2, w * 0.06), 0, 6.3); c.fill(); }
    },
    photo(c, w, h) {
      c.fillStyle = '#0c0a08'; c.fillRect(0, 0, w, h);
      c.save(); c.translate(w / 2, h / 2); c.rotate(0.06);
      const pw = w * 0.7, ph = h * 0.78;
      c.fillStyle = '#f0ece0'; c.fillRect(-pw / 2, -ph / 2, pw, ph);
      const g = c.createLinearGradient(0, -ph / 2, 0, ph / 2);
      g.addColorStop(0, '#9ab0c0'); g.addColorStop(1, '#6a7a50');
      c.fillStyle = g; c.fillRect(-pw / 2 + pw * 0.05, -ph / 2 + ph * 0.05, pw * 0.9, ph * 0.72);
      c.fillStyle = '#e0c0a8'; c.beginPath(); c.arc(-pw * 0.12, -ph * 0.12, pw * 0.08, 0, 6.3); c.fill();
      c.fillStyle = '#b88a4a'; c.beginPath(); c.arc(-pw * 0.12, -ph * 0.17, pw * 0.085, Math.PI, 0); c.fill();
      c.fillStyle = '#d8b09a'; c.beginPath(); c.arc(pw * 0.12, -ph * 0.14, pw * 0.08, 0, 6.3); c.fill();
      c.fillStyle = '#231811'; c.beginPath(); c.arc(pw * 0.12, -ph * 0.19, pw * 0.08, Math.PI, 0); c.fill();
      c.fillStyle = '#f0e8e0'; c.beginPath(); c.arc(0, ph * 0.06, pw * 0.06, 0, 6.3); c.fill();
      c.fillStyle = '#9ab0c8'; c.fillRect(-pw * 0.28, ph * 0.0, pw * 0.2, ph * 0.3); c.fillStyle = '#3a3e44'; c.fillRect(pw * 0.06, ph * 0.0, pw * 0.2, ph * 0.3);
      c.restore();
    },
    eyes(c, w, h) {
      c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
      const g = c.createLinearGradient(0, h * 0.25, 0, h * 0.75);
      g.addColorStop(0, '#2a1a12'); g.addColorStop(0.5, '#b88a70'); g.addColorStop(1, '#2a1a12');
      c.fillStyle = g; c.fillRect(0, h * 0.25, w, h * 0.5);
      for (const x of [0.3, 0.7]) {
        c.fillStyle = '#e8e0d8'; c.beginPath(); c.ellipse(w * x, h * 0.52, w * 0.11, h * 0.06, 0, 0, 6.3); c.fill();
        c.fillStyle = '#34485a'; c.beginPath(); c.arc(w * x, h * 0.52, h * 0.055, 0, 6.3); c.fill();
        c.fillStyle = '#000'; c.beginPath(); c.arc(w * x, h * 0.52, h * 0.025, 0, 6.3); c.fill();
        c.fillStyle = '#1a0e08'; c.save(); c.translate(w * x, h * 0.4); c.rotate(x < 0.5 ? 0.12 : -0.12); c.fillRect(-w * 0.13, -h * 0.02, w * 0.26, h * 0.04); c.restore();
      }
    },
    gun(c, w, h) {
      c.fillStyle = '#060606'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#1a1a1c';
      c.save(); c.translate(w * 0.5, h * 0.5); c.rotate(-0.15);
      c.fillRect(-w * 0.3, -h * 0.1, w * 0.55, h * 0.14); c.fillRect(w * 0.08, -h * 0.02, w * 0.12, h * 0.36);
      c.fillStyle = 'rgba(200,200,210,0.2)'; c.fillRect(-w * 0.3, -h * 0.1, w * 0.55, h * 0.02);
      c.restore();
    },
    badge(c, w, h) {
      c.fillStyle = '#0a0806'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#b89a40';
      c.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? w * 0.14 : w * 0.2; c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
      c.fill();
      c.fillStyle = '#1a1a1a'; c.textAlign = 'center'; c.font = `bold ${Math.round(h * 0.07)}px Georgia`; c.fillText('DEA', w / 2, h / 2 + h * 0.025);
    },
    text(c, w, h, p) {
      c.fillStyle = p.bg || '#050505'; c.fillRect(0, 0, w, h);
      c.fillStyle = p.fg || '#e8e4d8'; c.textAlign = 'center';
      c.font = `${p.italic ? 'italic ' : ''}${Math.round(h * (p.size || 0.08))}px Georgia, serif`;
      wrap(c, p.text || '', w * 0.85).forEach((L, i, a) => c.fillText(L, w / 2, h / 2 - (a.length - 1) * h * 0.06 + i * h * 0.12));
    },
    static(c, w, h) {
      const img = c.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 200; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      c.putImageData(img, 0, 0);
    },
    flash(c, w, h) {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
      g.addColorStop(0, '#fff8e0'); g.addColorStop(0.3, '#ffb040'); g.addColorStop(1, '#200800');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
  };
  M.NOVEL_ART = ART;

  class Novel {
    constructor(ui) {
      this.ui = ui;
      this.cv = ui.novelCv;
      this.c = this.cv.getContext('2d');
      this.scenes = new Map();
      this.active = false;
    }

    dropScenes() {
      for (const sc of this.scenes.values()) if (this.ui.r) this.ui.r.disposeScene(sc.scene);
      this.scenes.clear();
    }

    sceneFor(setId) {
      const ui = this.ui, r = ui.r;
      if (!setId || setId === 'level') return { scene: ui.levelScene, props: ui.game ? ui.game.props : [], world: ui.game ? ui.game.world : null };
      if (this.scenes.has(setId)) return this.scenes.get(setId);
      const def = M.SETS[setId];
      if (!def) return { scene: ui.levelScene, props: ui.game ? ui.game.props : [], world: ui.game ? ui.game.world : null };
      const w = M.buildLevel(def);
      r.loadWorld(w, { keep: true, lmRes: 0.5 });
      while (!r.bakeDone) r.bakeStep(1000);
      const scene = r.captureScene();
      const props = w.propDefs.concat(def.props || []).map((d, i) => Object.assign({ id: 'setp' + i, open: 0 }, d));
      const entry = { scene, props, world: w };
      this.scenes.set(setId, entry);
      return entry;
    }

    async play(id, o) {
      o = o || {};
      const ui = this.ui;
      const src = M.STORY[id];
      if (!src || !ui.r) return;
      const pages = src.slice();
      if (o.chapter) {
        const def = o.chapter;
        const title = { layout: 'full', panels: [{ art: 'title', p: { sup: def.part === 1 && def.chapter === 1 ? 'Часть I. Американская мечта' : def.id === 'prologue' ? 'Часть I. Американская мечта' : def.part === 1 ? 'Часть I' : '', text: M.chapterLabel(def), sub: def.titleEn || '' } }], title: true };
        pages.unshift(title);
      }
      const prevMode = ui.mode;
      ui.mode = 'novel';
      ui.unlock();
      this.cv.style.display = 'block';
      this.active = true;
      this.skipAll = false;
      if (!ui.audio.musicId || ['ambient', 'station', 'hotel', 'club', 'tension', 'tutorial', 'prologue'].includes(ui.audio.musicId)) ui.audio.playMusic('novel');
      for (const page of pages) {
        if (this.skipAll || ui.destroyed) break;
        await this.showPage(page);
      }
      this.active = false;
      this.cv.style.display = 'none';
      this.page = null;
      if (ui.levelScene) ui.r.useScene(ui.levelScene);
      if (ui.mode === 'novel') ui.mode = prevMode === 'novel' ? 'play' : prevMode;
    }

    layoutRects(page) {
      const W = this.cv.clientWidth || this.ui.el.clientWidth || 800, H = this.cv.clientHeight || this.ui.el.clientHeight || 600;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
      this.dpr = dpr;
      const aspect = page.title ? 1.5 : 1.36;
      let ph = H * 0.94, pw = ph * aspect;
      if (pw > W * 0.96) { pw = W * 0.96; ph = pw / aspect; }
      const px = (W - pw) / 2, py = (H - ph) / 2;
      const L = LAYOUTS[page.layout] || LAYOUTS.full;
      const gut = Math.max(4, pw * 0.008);
      return { W, H, px, py, pw, ph, rects: L.slice(0, page.panels.length).map(q => [px + q[0] * pw + gut, py + q[1] * ph + gut, (q[2] - q[0]) * pw - gut * 2, (q[3] - q[1]) * ph - gut * 2]) };
    }

    async renderPanel(panel, rect) {
      const w = Math.max(16, Math.round(rect[2] * this.dpr)), h = Math.max(16, Math.round(rect[3] * this.dpr));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const c = cv.getContext('2d');
      let points = [];
      if (panel.art) {
        (ART[panel.art] || ART.black)(c, w, h, panel.p || {});
      } else if (panel.shot) {
        let s = panel.shot;
        if (s.rel === 'player' && this.ui.game) {
          const o = this.ui.game.player.pos;
          const add = p => [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
          s = Object.assign({}, s, { cam: add(s.cam), at: add(s.at), actors: (s.actors || []).map(a => Object.assign({}, a, { pos: add(a.pos) })) });
        }
        const ent = this.sceneFor(s.set);
        if (!ent.scene) { ART.black(c, w, h); return { canvas: cv, points }; }
        const r = this.ui.r;
        r.useScene(ent.scene);
        const actors = (s.actors || []).map((a, i) => ({
          key: 'nv' + i + (a.look || ''), look: a.look, seed: a.seed || 1, pos: a.pos, yaw: a.yaw || 0, weapon: a.weapon || null,
          state: Object.assign({ t: a.t || 1, phase: a.phase || 0, move: [0, 0], speed: 0, hold: a.hold || 'none', pitch: a.pitch || 0, aimDir: M.dirFromYawPitch(a.yaw || 0, a.pitch || 0), yaw: a.yaw || 0 }, a.pose || {}),
          lie: a.lie, boost: 1.25
        }));
        const pts = actors.map(a => [a.pos[0], a.pos[1] + (a.state.special === 'lie' || a.state.death ? 0.3 : a.state.special === 'sit' || a.state.special === 'kneel' || a.state.special === 'cradle' ? 1.3 : a.state.crouch ? 1.2 : 1.78), a.pos[2]]);
        const fog = s.fog || null;
        const res = r.renderToCanvas({
          cam: { pos: s.cam, target: s.at, fov: (s.fov || 50) * Math.PI / 180 },
          actors, props: s.noProps ? [] : ent.props, items: [], throws: [], fx: null, dyn: (s.lights || []).concat(s.noFill ? [] : [{ pos: [s.cam[0], s.cam[1] + 0.8, s.cam[2]], color: [0.5, 0.48, 0.45], r: 11 }]), time: 1,
          novel: true, grade: s.grade || [0.92, 0.97, 1.08], grain: 0.05, lightning: s.flash || 0, projectPts: pts, fog
        }, w, h);
        c.drawImage(res.canvas, 0, 0);
        points = res.points.map(p => p ? [p[0] / this.dpr, p[1] / this.dpr] : null);
        if (s.snow) ART.snowflakes(c, w, h, s.snow === true ? 140 : s.snow, 13);
        if (s.rain) { c.strokeStyle = 'rgba(200,210,230,0.35)'; const rr = new M.RNG(3); for (let i = 0; i < 180; i++) { const x = rr.next() * w, y = rr.next() * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 18); c.stroke(); } }
        if (s.muzzle) for (const m of s.muzzle) { const sp = this.projectMuzzle(res, m, w, h); if (sp) { const g = c.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], w * 0.06); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.3, 'rgba(255,170,60,0.8)'); g.addColorStop(1, 'rgba(255,100,20,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); } }
        if (s.red) { c.fillStyle = `rgba(120,0,0,${s.red})`; c.globalCompositeOperation = 'multiply'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over'; }
      }
      return { canvas: cv, points };
    }

    projectMuzzle(res, m, w, h) {
      const r = this.ui.r;
      if (!r.lastCam) return null;
      const q = M.GL.mat4.project(r.lastCam.vp, m);
      return q ? [(q[0] * 0.5 + 0.5) * w, (1 - (q[1] * 0.5 + 0.5)) * h] : null;
    }

    async showPage(page) {
      const L = this.layoutRects(page);
      this.page = { page, L, imgs: [], panel: 0, beat: 0, t: 0, fade: 0 };
      this.draw(true);
      await M.nextFrame();
      for (let i = 0; i < page.panels.length; i++) {
        this.page.imgs[i] = await this.renderPanel(page.panels[i], L.rects[i]);
        if (i === 0) this.draw();
      }
      this.ui.audio.play('page');
      const P = this.page;
      for (P.panel = 0; P.panel < page.panels.length; P.panel++) {
        const pn = page.panels[P.panel];
        const beats = Math.max(1, (pn.cap || []).length + (pn.say || []).length);
        for (P.beat = 1; P.beat <= beats; P.beat++) {
          P.t = 0;
          this.draw();
          if (pn.sfx && P.beat === 1) this.ui.audio.play(pn.sfx);
          const res = await this.waitKey(pn.auto);
          if (res === 'skip') { this.skipAll = true; return; }
        }
      }
    }

    waitKey(auto) {
      return new Promise(resolve => {
        this.resolve = resolve;
        if (auto) this.autoT = setTimeout(() => this.key('next'), auto * 1000);
      });
    }

    key(k) {
      if (!this.resolve) return;
      if (this.page && this.page.t < 0.18 && k === 'next') return;
      clearTimeout(this.autoT);
      const r = this.resolve;
      this.resolve = null;
      r(k);
    }

    frame(dt) {
      if (!this.page) return;
      this.page.t += dt;
      this.draw();
    }

    draw(blank) {
      const P = this.page;
      if (!P) return;
      const c = this.c, d = this.dpr;
      c.setTransform(d, 0, 0, d, 0, 0);
      const { W, H, px, py, pw, ph, rects } = P.L;
      c.fillStyle = '#000';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#0e0e10';
      c.fillRect(px, py, pw, ph);
      if (blank) return;
      rects.forEach((rc, i) => {
        c.fillStyle = '#050505';
        c.fillRect(rc[0], rc[1], rc[2], rc[3]);
        if (i > P.panel || !P.imgs[i]) return;
        const a = i === P.panel && P.beat === 1 ? Math.min(1, P.t / 0.35) : 1;
        c.globalAlpha = a;
        c.drawImage(P.imgs[i].canvas, rc[0], rc[1], rc[2], rc[3]);
        c.globalAlpha = 1;
        c.strokeStyle = '#d8d4c8';
        c.lineWidth = 1.5;
        c.strokeRect(rc[0] + 0.5, rc[1] + 0.5, rc[2] - 1, rc[3] - 1);
        const pn = P.page.panels[i];
        const shown = i < P.panel ? 1e9 : P.beat;
        this.texts(c, pn, rc, shown, P.imgs[i].points, i === P.panel ? P.t : 9);
      });
      c.fillStyle = 'rgba(220,210,190,0.55)';
      c.font = `${Math.round(11)}px Georgia, serif`;
      c.textAlign = 'right';
      c.fillText('Пробел, Enter или щелчок: дальше    Esc: пропустить', px + pw - 4, py + ph + Math.min(14, (H - ph) / 2 - 2));
    }

    texts(c, pn, rc, shown, points, t) {
      const caps = pn.cap || [], says = pn.say || [];
      const fs = Math.max(11, Math.min(17, rc[3] * 0.052, rc[2] * 0.034));
      let k = 0;
      let cy = rc[1] + 8;
      let by = rc[1] + rc[3] - 8;
      const bottom = pn.capPos === 'bottom';
      const items = [];
      caps.forEach(t0 => items.push({ kind: 'cap', text: t0 }));
      says.forEach(s0 => items.push({ kind: 'say', s: s0 }));
      if (bottom) {
        const capItems = items.filter(q => q.kind === 'cap');
        c.font = `${fs}px Georgia, serif`;
        let total = 0;
        for (const q of capItems) total += wrap(c, q.text, rc[2] * 0.8).length * fs * 1.25 + 14;
        cy = rc[1] + rc[3] - total - 6;
      }
      for (const it of items) {
        k++;
        if (k > shown) break;
        const a = k === shown ? Math.min(1, t / 0.25) : 1;
        c.globalAlpha = a;
        if (it.kind === 'cap') {
          c.font = `${fs}px Georgia, "Times New Roman", serif`;
          const lines = wrap(c, it.text, rc[2] * 0.8);
          const bw = Math.min(rc[2] - 12, Math.max(...lines.map(L => c.measureText(L).width)) + 16);
          const bh = lines.length * fs * 1.25 + 10;
          const bx = rc[0] + 8;
          c.fillStyle = '#f2eee2';
          c.fillRect(bx, cy, bw, bh);
          c.strokeStyle = '#111';
          c.lineWidth = 1;
          c.strokeRect(bx + 0.5, cy + 0.5, bw - 1, bh - 1);
          c.fillStyle = '#111';
          c.textAlign = 'left';
          lines.forEach((L, i) => c.fillText(L, bx + 8, cy + fs * 1.05 + i * fs * 1.25));
          cy += bh + 6;
        } else {
          const s = it.s;
          c.font = `bold ${fs * 0.92}px "Trebuchet MS", Arial, sans-serif`;
          const lines = wrap(c, s.text, rc[2] * 0.42);
          const bw = Math.max(...lines.map(L => c.measureText(L).width)) + 22;
          const bh = lines.length * fs * 1.15 + 14;
          const anchor = s.actor !== undefined && points && points[s.actor] ? points[s.actor] : null;
          let bx, byy;
          if (s.at) { bx = rc[0] + s.at[0] * rc[2] - bw / 2; byy = rc[1] + s.at[1] * rc[3] - bh / 2; }
          else if (anchor) { bx = rc[0] + anchor[0] - bw / 2 + (s.dx || 0) * rc[2]; byy = rc[1] + anchor[1] - bh - rc[3] * 0.12 + (s.dy || 0) * rc[3]; }
          else { bx = rc[0] + rc[2] - bw - 10; byy = by - bh; by -= bh + 8; }
          bx = M.clamp(bx, rc[0] + 4, rc[0] + rc[2] - bw - 4);
          byy = M.clamp(byy, rc[1] + 4 + (s.low ? rc[3] * 0.4 : 0), rc[1] + rc[3] - bh - 4);
          c.fillStyle = s.phone ? '#e8f0e0' : '#ffffff';
          c.strokeStyle = '#111';
          c.lineWidth = 1.4;
          const rr = Math.min(12, bh / 2);
          c.beginPath();
          c.moveTo(bx + rr, byy); c.lineTo(bx + bw - rr, byy); c.quadraticCurveTo(bx + bw, byy, bx + bw, byy + rr); c.lineTo(bx + bw, byy + bh - rr); c.quadraticCurveTo(bx + bw, byy + bh, bx + bw - rr, byy + bh);
          if (anchor && !s.at) {
            const tx = M.clamp(rc[0] + anchor[0], bx + 10, bx + bw - 10);
            c.lineTo(Math.min(bx + bw - rr, tx + 10), byy + bh);
            c.lineTo(rc[0] + anchor[0], Math.min(rc[1] + anchor[1] - 6, byy + bh + rc[3] * 0.1));
            c.lineTo(Math.max(bx + rr, tx - 4), byy + bh);
          }
          c.lineTo(bx + rr, byy + bh); c.quadraticCurveTo(bx, byy + bh, bx, byy + bh - rr); c.lineTo(bx, byy + rr); c.quadraticCurveTo(bx, byy, bx + rr, byy);
          c.closePath();
          if (s.phone) c.setLineDash([4, 3]);
          c.fill(); c.stroke();
          c.setLineDash([]);
          c.fillStyle = '#111';
          c.textAlign = 'center';
          lines.forEach((L, i) => c.fillText(L, bx + bw / 2, byy + 7 + fs * 0.95 + i * fs * 1.15));
          if (s.who && !anchor) { c.font = `bold ${fs * 0.7}px Arial, sans-serif`; c.textAlign = 'left'; c.fillStyle = '#555'; c.fillText(M.SPEAKERS[s.who] || s.who, bx + 8, byy + 10); }
        }
        c.globalAlpha = 1;
      }
    }
  }
  M.Novel = Novel;
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
