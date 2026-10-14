(function (D) {
  'use strict';
  const { clamp, dist } = D;
  const el = (tag, cls, html, parent) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  D.el = el; D.esc = esc;
  const PANEL_KEYS = { KeyC: 'char', KeyI: 'inv', KeyK: 'abil', KeyJ: 'journal', KeyM: 'map', KeyT: 'tactics', KeyN: 'craft', KeyP: 'party' };
  const TOPBAR = [['char', 'head', 'Персонаж (C)'], ['abil', 'hand', 'Способности (K)'], ['inv', 'bag', 'Инвентарь (I)'], ['journal', 'book', 'Журнал и кодекс (J)'], ['map', 'compass', 'Карта (M)'], ['tactics', 'target', 'Тактика (T)'], ['craft', 'mortar', 'Ремесло (N)'], ['party', 'people', 'Отряд (P)'], ['menu', 'gear', 'Меню (Esc)']];
  const SETTINGS_KEY = 'dao98_settings';
  const defaults = { music: 0.45, sfx: 0.8, master: 0.85, res: 0.85, autoPause: true, bars: true, difficulty: 'normal', camSpeed: 1, subtitles: true, voice: true, voiceVol: 0.9, voiceRate: 1, voiceM: '', voiceF: '', voiceNarr: '' };
  const speechOpts = s => ({ on: s.voice, vol: s.voiceVol, rate: s.voiceRate, m: s.voiceM, f: s.voiceF, narr: s.voiceNarr });
  D.speechOpts = speechOpts;

  class UI {
    constructor(root, opts) {
      this.opts = opts || {};
      this.root = root;
      this.box = el('div', 'dao98');
      this.box.tabIndex = 0;
      root.appendChild(this.box);
      this.cv = el('canvas', 'da-gl', null, this.box);
      this.ov = el('canvas', 'da-ov', null, this.box);
      this.octx = this.ov.getContext('2d');
      this.hud = el('div', 'da-hud', null, this.box);
      this.layer = el('div', 'da-layer', null, this.box);
      this.fadeEl = el('div', 'da-fade', null, this.box);
      this.settings = Object.assign({}, defaults);
      try { Object.assign(this.settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { }
      this.audio = new D.Audio();
      this.audio.vol = { master: this.settings.master, music: this.settings.music, sfx: this.settings.sfx };
      this.audio.speech = speechOpts(this.settings);
      try { this.R = new D.Renderer(this.cv); } catch (e) { this.glError = e.message || String(e); }
      this.pcv = document.createElement('canvas');
      this.pcv.width = 96; this.pcv.height = 96;
      try { this.PR = new D.Renderer(this.pcv, { preserve: true }); } catch (e) { this.PR = null; }
      this.portraits = new Map();
      this.keys = {};
      this.mouse = { x: 0, y: 0, down: false, rdown: false, drag: 0 };
      this.cam = { yaw: 0, pitch: 0.35, dist: 7, zoom: 0.3, tx: 0, ty: 0, tz: 0, shake: 0 };
      this.floats = [];
      this.logLines = [];
      this.screen = 'menu';
      this.g = null;
      this.panel = null;
      this.hover = null;
      this.targeting = null;
      this.moveMark = null;
      this.lastHud = 0;
      this.tabHeld = false;
      this.bindInput();
      this.frame = this.frame.bind(this);
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
      this.onResize();
      this.resizeObs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.onResize()) : null;
      if (this.resizeObs) this.resizeObs.observe(this.box);
      this.showMenu();
    }
    saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch (e) { } }
    active() { return !this.opts.isActive || this.opts.isActive(); }
    destroy() {
      this.dead = true;
      cancelAnimationFrame(this.raf);
      this.audio.stop();
      this.audio.hush();
      if (this.audio.ctx) try { this.audio.ctx.close(); } catch (e) { }
      if (this.resizeObs) this.resizeObs.disconnect();
      window.removeEventListener('keydown', this.kd);
      window.removeEventListener('keyup', this.ku);
      window.removeEventListener('mouseup', this.mu);
      this.box.remove();
    }
    onResize() {
      const w = Math.max(320, this.box.clientWidth), h = Math.max(240, this.box.clientHeight);
      const s = this.settings.res || 1;
      this.cv.width = Math.round(w * s); this.cv.height = Math.round(h * s);
      this.ov.width = w; this.ov.height = h;
    }
    sfx(id) { this.audio.play(id); }
    clearLayer() { this.layer.innerHTML = ''; this.panel = null; }
    fade(out, t) {
      this.fadeEl.style.transition = 'opacity ' + (t || 0.8) + 's';
      this.fadeEl.style.opacity = out ? 1 : 0;
    }

    bindInput() {
      const b = this.box;
      this.kd = e => this.onKey(e, true);
      this.ku = e => this.onKey(e, false);
      window.addEventListener('keydown', this.kd);
      window.addEventListener('keyup', this.ku);
      b.addEventListener('contextmenu', e => e.preventDefault());
      b.addEventListener('mousedown', e => {
        this.audio.init(); this.audio.resume();
        if (this.audio.want && this.audio.ctx) { const w = this.audio.want; this.audio.want = null; this.audio.music(w); }
        b.focus({ preventScroll: true });
        if (e.target !== this.ov) return;
        const r = this.ov.getBoundingClientRect();
        this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top;
        if (e.button === 2 || e.button === 1) { this.mouse.rdown = true; this.mouse.drag = 0; this.mouse.lx = e.clientX; this.mouse.ly = e.clientY; }
        if (e.button === 0) { this.mouse.down = true; this.clickWorld(e); }
      });
      this.mu = e => {
        if (e.button === 2 && this.mouse.rdown) {
          this.mouse.rdown = false;
          if (this.mouse.drag < 5) this.rightClick();
        }
        if (e.button === 0) this.mouse.down = false;
      };
      window.addEventListener('mouseup', this.mu);
      b.addEventListener('mousemove', e => {
        const r = this.ov.getBoundingClientRect();
        this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top;
        if (this.mouse.rdown) {
          const dx = e.clientX - this.mouse.lx, dy = e.clientY - this.mouse.ly;
          this.mouse.lx = e.clientX; this.mouse.ly = e.clientY;
          this.mouse.drag += Math.abs(dx) + Math.abs(dy);
          this.cam.yaw -= dx * 0.008 * this.settings.camSpeed;
          this.cam.pitchAdj = clamp((this.cam.pitchAdj || 0) + dy * 0.004, -0.25, 0.5);
        }
      });
      b.addEventListener('wheel', e => {
        if (this.screen !== 'game' || this.panel) return;
        if (e.target !== this.ov) return;
        e.preventDefault();
        this.cam.zoom = clamp(this.cam.zoom + Math.sign(e.deltaY) * 0.07, 0, 1);
      }, { passive: false });
    }

    onKey(e, down) {
      if (this.dead || !this.active()) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') && this.box.contains(document.activeElement)) {
        if (down && e.code === 'Escape') document.activeElement.blur();
        return;
      }
      if (!this.box.isConnected) return;
      const code = e.code;
      this.keys[code] = down;
      if (!down) { if (code === 'Tab') { this.tabHeld = false; if (this.g) this.g.showAll = false; } return; }
      if (this.screen === 'menu' || this.screen === 'create') { if (this.onFrontKey) this.onFrontKey(e); return; }
      if (this.screen !== 'game' || !this.g) return;
      const g = this.g;
      if (['Space', 'Tab', 'F1', 'F2', 'F3', 'F4', 'F5', 'F9', 'Escape'].includes(code) || code.startsWith('Digit') || code.startsWith('Arrow')) e.preventDefault();
      if (this.slidesEl) { if (code === 'Space' || code === 'Enter' || code === 'Escape') this.nextSlide(); return; }
      if (g.mode === 'dialog') {
        if (code.startsWith('Digit')) { const n = +code.slice(5); this.chooseReply(n === 0 ? 9 : n - 1); }
        else if (code === 'Space' || code === 'Enter') this.dialogContinue();
        return;
      }
      if (g.mode === 'map') { if (code === 'Escape' && this.mapCancel) this.mapCancel(); return; }
      if (code === 'Escape') {
        if (this.targeting) { this.targeting = null; return; }
        if (g.loot) { this.closeLoot(); return; }
        if (this.panel) { this.closePanel(); return; }
        this.openPanel('menu');
        return;
      }
      if (this.panel && this.panel !== 'menu' && PANEL_KEYS[code] === this.panel) { this.closePanel(); return; }
      if (PANEL_KEYS[code] && g.mode !== 'dead') { this.openPanel(PANEL_KEYS[code]); return; }
      if (this.panel) return;
      if (code === 'Space') { g.paused = !g.paused; this.sfx('click'); return; }
      if (code === 'Tab') { this.tabHeld = true; g.showAll = true; return; }
      if (code === 'KeyH') { g.holdPos = !g.holdPos; this.toast(g.holdPos ? 'Отряд удерживает позицию' : 'Отряд следует за лидером'); return; }
      if (code === 'KeyL') { this.logBig = !this.logBig; return; }
      if (code === 'KeyB') { this.selectAllToggle(); return; }
      if (code === 'F5') { this.quickSave(); return; }
      if (code === 'F9') { this.quickLoad(); return; }
      if (/^F[1-4]$/.test(code)) { const i = +code.slice(1) - 1; if (g.party[i]) this.setLeader(g.party[i]); return; }
      if (code.startsWith('Digit')) { const n = +code.slice(5); this.useSlot(n === 0 ? 9 : n - 1); return; }
      if (code === 'KeyR') { this.cam.yaw = (g.leader ? g.leader.face : 0); return; }
    }
    selectAllToggle() {
      const g = this.g;
      if (g.selected.length > 1) g.selected = [g.leader];
      else g.selected = g.party.filter(D.alive);
    }

    frame(now) {
      if (this.dead) return;
      this.raf = requestAnimationFrame(this.frame);
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      if (this.screen === 'menu' && this.drawMenuBg) { this.drawMenuBg(dt); return; }
      if (this.screen === 'create' && this.drawCreate) { this.drawCreate(dt); return; }
      if (this.screen !== 'game' || !this.g) return;
      const g = this.g;
      if (this.pendingLoad) {
        this.pendingLoad--;
        if (this.pendingLoad === 0) this.finishLoading();
        return;
      }
      if (this.active() && g.mode !== 'dialog' && !this.panel && g.leader && !g.leader.dead) this.pollMove();
      else if (g.leader) g.leader.dirMove = null;
      if (!(this.panel === 'menu')) g.update(this.panel ? 0 : dt);
      this.handleEvents();
      if (this.screen !== 'game' || !this.g) return;
      if (this.renderSerial !== g.areaSerial && !this.pendingLoad) { this.showLoading(g.areaId); return; }
      this.updateCamera(dt);
      this.pickHover();
      if (this.R && g.L) this.R.render(g, this.cam, this);
      if (this.moveMark) this.moveMark.t -= dt * 1.5;
      this.drawOverlay(dt);
      if (now - this.lastHud > 90) { this.lastHud = now; this.updateHud(); }
    }

    pollMove() {
      const g = this.g, k = this.keys;
      let f = 0, s = 0;
      if (k.KeyW || k.ArrowUp) f++;
      if (k.KeyS || k.ArrowDown) f--;
      if (k.KeyA || k.ArrowLeft) s--;
      if (k.KeyD || k.ArrowRight) s++;
      if (k.KeyQ) this.cam.yaw += 1.8 * 0.016 * this.settings.camSpeed;
      if (k.KeyE) this.cam.yaw -= 1.8 * 0.016 * this.settings.camSpeed;
      const l = g.leader;
      if ((f || s) && g.mode === 'play' && !D.incap(l)) {
        const yaw = this.cam.yaw;
        const fx = Math.sin(yaw), fz = Math.cos(yaw);
        let mx = fx * f - fz * s, mz = fz * f + fx * s;
        const n = Math.hypot(mx, mz);
        l.dirMove = [mx / n, mz / n];
        l.order = null; l.path = null;
      } else l.dirMove = null;
    }

    updateCamera(dt) {
      const g = this.g, c = this.cam;
      const l = g.leader || g.pc;
      if (!l) return;
      const z = c.zoom;
      let dist = 3.4 + 24 * Math.pow(z, 1.35);
      let pitch = 0.2 + 0.95 * z + (c.pitchAdj || 0);
      let ty = l.y + 1.55 - z * 0.9;
      let tx = l.x, tz = l.z;
      let yaw = c.yaw;
      if (g.mode === 'dialog' && g.dialog) {
        const line = g.curLine();
        let sp = null;
        if (line && line.sp !== 'narr') sp = g.ents.find(e => e.key === line.sp && !e.gone) || (g.roster[line.sp] && g.party.includes(g.roster[line.sp]) ? g.roster[line.sp] : null);
        if (!sp && g.dialog.speaker) sp = g.dialog.speaker;
        if (sp) {
          g.dialog.talkUid = sp.uid;
          const other = sp === l ? (g.dialog.speaker && g.dialog.speaker !== l ? g.dialog.speaker : null) : l;
          const M = this.R ? this.R.modelFor(sp) : null;
          const head = sp.y + (M ? M.height : 1.7) - 0.25;
          tx = sp.x; tz = sp.z; ty = head;
          if (other && dist < 999) {
            const a = Math.atan2(sp.x - other.x, sp.z - other.z);
            yaw = a + 0.35;
            dist = Math.max(2.2, Math.min(5.5, D.dist(sp.x, sp.z, other.x, other.z) + 1.4));
          } else { yaw = (sp.face || 0) + Math.PI + 0.3; dist = 2.6; }
          pitch = 0.08;
          c.yaw += D.wrapAngle(yaw - c.yaw) * Math.min(1, dt * 3);
          yaw = c.yaw;
        }
      }
      if (g.mode !== 'dialog' && g.L) {
        const nav = g.L.nav;
        const limitAt = (p, d) => {
          const ex = tx - Math.sin(yaw) * Math.cos(p) * d, ez = tz - Math.cos(yaw) * Math.cos(p) * d;
          const steps = Math.ceil(d * 5);
          let inWall = false;
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = tx + (ex - tx) * t, zz = tz + (ez - tz) * t;
            const cx = Math.floor(x), cz = Math.floor(zz);
            if (!nav.inside(cx, cz)) return t;
            const sidx = cz * nav.w + cx;
            const s = g.L.solid[sidx];
            const y = ty + Math.sin(p) * d * t;
            const hit = (s === 1 || s === 2) && y < nav.corner(cx, cz) + (g.L.wallH[sidx] || 4) + 0.4;
            if (hit) inWall = true;
            else if (inWall) return Math.max(0, t - 1 / steps);
          }
          return 1;
        };
        let bestP = pitch, bestD = 0;
        for (const dp of [0, 0.15, 0.3, 0.45]) {
          const p = Math.min(1.3, pitch + dp);
          const f = limitAt(p, dist);
          const dd = dist * f;
          if (f >= 1) { bestP = p; bestD = dist; break; }
          if (dd > bestD + 0.4) { bestD = dd; bestP = p; }
        }
        pitch = bestP;
        dist = Math.max(1.8, bestD);
      }
      const k = Math.min(1, dt * 8);
      c.tx += (tx - c.tx) * k; c.tz += (tz - c.tz) * k; c.ty += (ty - c.ty) * k;
      if (Math.abs(tx - c.tx) > 12 || Math.abs(tz - c.tz) > 12) { c.tx = tx; c.tz = tz; c.ty = ty; }
      c.dist += (dist - c.dist) * Math.min(1, dt * 10);
      c.pitch += (pitch - c.pitch) * Math.min(1, dt * 8);
      if (c.shake > 0) { c.shake -= dt; c.tx += (Math.random() - 0.5) * c.shake * 0.6; c.ty += (Math.random() - 0.5) * c.shake * 0.6; }
    }

    pickAt(mx, my) {
      const g = this.g, R = this.R;
      if (!R || !R.invVP || !g.L) return null;
      const ray = R.ray(mx, my);
      const o = ray.o, d = ray.d;
      const nav = g.L.nav;
      let groundT = null, ground = null;
      for (let t = 0.5; t < 160; t += 0.25) {
        const x = o[0] + d[0] * t, y = o[1] + d[1] * t, z = o[2] + d[2] * t;
        const cx = Math.floor(x), cz = Math.floor(z);
        if (!nav.inside(cx, cz)) { if (y < -2) break; continue; }
        const i = cz * nav.w + cx;
        const s = g.L.solid[i];
        const gy = nav.heightAt(x, z);
        if ((s === 1 || s === 2) && y < gy + (g.L.wallH[i] || 4)) { groundT = t; ground = null; break; }
        if (y <= gy) { groundT = t; ground = [x, z]; break; }
      }
      let best = null, bt = groundT !== null ? groundT + 0.8 : 1e9;
      for (const e of g.ents) {
        if (e.gone || (e.dead && !this.targeting)) continue;
        if (e.faction === 'hostile' && e.sustained && e.sustained.includes('stealth')) continue;
        const h = e.look.kind === 'ogre' ? 3.4 : e.look.kind === 'humanoid' || !e.look.kind ? (e.look.race === 'dwarf' ? 1.4 : 1.85) : e.look.kind === 'bear' ? 1.4 : e.look.kind === 'rage' ? 2.2 : 1.0;
        const r = Math.max(0.45, e.radius + 0.12);
        const ox = o[0] - e.x, oz = o[2] - e.z;
        const a = d[0] * d[0] + d[2] * d[2], bq = 2 * (ox * d[0] + oz * d[2]), cq = ox * ox + oz * oz - r * r;
        const disc = bq * bq - 4 * a * cq;
        if (disc < 0) continue;
        const t0 = (-bq - Math.sqrt(disc)) / (2 * a), t1 = (-bq + Math.sqrt(disc)) / (2 * a);
        for (const t of [t0, t1]) {
          if (t < 0) continue;
          const y = o[1] + d[1] * t;
          const base = e.y + (e.dead || e.down ? -0.5 : 0);
          if (y >= base - 0.1 && y <= base + (e.dead || e.down ? 0.8 : h)) { if (t < bt) { bt = t; best = { ent: e }; } break; }
        }
      }
      for (const ob of g.activeObjs()) {
        if (ob.t === 'trig' || (ob.t === 'box' && ob.empty && ob.kind !== 'chest')) continue;
        if (ob.t === 'exit' && ob.hidden) continue;
        const y0 = nav.heightAt(ob.x, ob.z);
        const cy = y0 + (ob.t === 'door' ? 1.3 : ob.t === 'exit' ? 1 : ob.kind === 'mirror' ? 1.3 : 0.5);
        const r = ob.t === 'exit' ? 1.1 : ob.t === 'door' ? 0.8 : ob.kind === 'pouch' ? 0.45 : 0.7;
        const vx = ob.x - o[0], vy = cy - o[1], vz = ob.z - o[2];
        const t = vx * d[0] + vy * d[1] + vz * d[2];
        if (t < 0) continue;
        const px = o[0] + d[0] * t - ob.x, py = o[1] + d[1] * t - cy, pz = o[2] + d[2] * t - ob.z;
        if (Math.hypot(px, py * 0.6, pz) < r && t < bt) { bt = t; best = { obj: ob }; }
      }
      if (best) return best;
      if (ground) return { ground };
      return null;
    }
    pickHover() {
      if (this.g.mode !== 'play' && this.g.mode !== 'cutscene') { this.hover = null; this.aim = null; return; }
      if (this.mouse.rdown) return;
      this.hover = this.pickAt(this.mouse.x, this.mouse.y);
      const tg = this.targeting;
      this.aim = null;
      if (tg && this.hover) {
        const p = this.hover.ent ? [this.hover.ent.x, this.hover.ent.z] : this.hover.ground || (this.hover.obj ? [this.hover.obj.x, this.hover.obj.z] : null);
        if (p && tg.r) this.aim = { x: p[0], z: p[1], r: tg.r, ok: true };
      }
      let cur = 'default';
      const h = this.hover;
      if (tg) cur = 'crosshair';
      else if (h && h.ent) cur = h.ent.faction === 'hostile' ? 'crosshair' : h.ent.dlg || h.ent.kind === 'party' || (h.ent.npc && h.ent.npc.barks) ? 'help' : 'default';
      else if (h && h.obj) cur = 'pointer';
      this.ov.style.cursor = cur;
    }

    clickWorld(e) {
      const g = this.g;
      if (!g || this.screen !== 'game') return;
      if (this.slidesEl) { this.nextSlide(); return; }
      if (g.mode === 'dialog') { this.dialogContinue(); return; }
      if (g.mode !== 'play' || this.panel || g.loot) return;
      const h = this.pickAt(this.mouse.x, this.mouse.y);
      const l = g.leader;
      if (!l || D.incap(l) || l.dead || l.down) return;
      if (this.targeting) { this.confirmTarget(h); return; }
      if (!h) return;
      const group = g.selected.length > 1 ? g.selected.filter(D.alive) : [l];
      if (h.ent) {
        const t = h.ent;
        if (t.faction === 'hostile') { for (const c of group) g.cmdAttack(c, t); l.target = t.uid; this.sfx('click'); return; }
        if (t.kind === 'party' && t !== l) { if (e.shiftKey || g.combat) { this.setLeader(t); return; } g.talkTo(t); return; }
        if (t === l) return;
        if (t.neutralFoe && t.dlg) { g.cmdInteract(l, Object.assign(t, {})); return; }
        if (t.kind === 'npc' || t.neutralFoe) {
          if (e.altKey && l.skills.stealing) { g.cmdInteract(l, { t: 'steal', x: t.x, z: t.z, ent: t }); return; }
          g.cmdInteract(l, t);
          return;
        }
        return;
      }
      if (h.obj) { g.cmdInteract(l, h.obj); this.sfx('click'); return; }
      if (h.ground) {
        const [x, z] = h.ground;
        if (group.length > 1) group.forEach((c, i) => { const off = i === 0 ? [0, 0] : [Math.sin(i * 2.1) * 1.3, Math.cos(i * 2.1) * 1.3]; g.cmdMove(c, x + off[0], z + off[1]); });
        else g.cmdMove(l, x, z);
        this.moveMark = { x, z, t: 1 };
      }
    }
    rightClick() {
      const g = this.g;
      if (!g || this.screen !== 'game') return;
      if (this.targeting) { this.targeting = null; return; }
      if (g.mode === 'play' && g.leader) g.cmdStop(g.leader);
    }

    setLeader(c) {
      const g = this.g;
      if (!g.party.includes(c) || c.dead) return;
      if (c.down) { this.toast(c.name + ' без сознания'); return; }
      g.leader = c;
      g.selected = [c];
      c.order = null;
      this.updateHud(true);
    }

    beginTargeting(kind, payload) {
      const g = this.g;
      const l = g.leader;
      if (kind === 'ab') {
        const a = D.AB[payload];
        if (a.kind === 'sus' || a.tgt === 'self') { g.cmdAbility(l, payload, l); return; }
        const err = g.canUse(l, payload);
        if (err) { this.toast(err, 'warn'); return; }
        const r = a.fx.aoe ? a.fx.aoe.r : a.fx.bolt && a.fx.bolt.aoe ? a.fx.bolt.aoe : a.fx.field ? a.fx.field.r : 0;
        this.targeting = { kind: 'ab', id: payload, tgt: a.tgt, r, name: a.name };
        if (l.target && a.tgt === 'enemy') {
          const t = g.ents.find(e => e.uid === l.target && D.isFoeOf(l, e));
          if (t && !this.keys.ShiftLeft) { g.cmdAbility(l, payload, t); this.targeting = null; }
        }
        return;
      }
      if (kind === 'item') {
        const it = D.ITEMS[payload];
        if (it.use.bomb || it.use.trap) { this.targeting = { kind: 'item', id: payload, tgt: 'ground', r: it.use.bomb ? it.use.bomb.r : 0.6, name: it.name }; return; }
        const err = g.useItem(l, payload);
        if (err) this.toast(err, 'warn');
      }
    }
    confirmTarget(h) {
      const g = this.g, l = g.leader, tg = this.targeting;
      if (!h) return;
      if (tg.kind === 'ab') {
        let t = null;
        if (tg.tgt === 'enemy') { if (!h.ent || !D.isFoeOf(l, h.ent)) { this.toast('Выберите врага', 'warn'); return; } t = h.ent; }
        else if (tg.tgt === 'ally') { if (!h.ent || h.ent.faction !== 'party' || h.ent.dead) { this.toast('Выберите союзника', 'warn'); return; } t = h.ent; }
        else if (tg.tgt === 'any') { if (!h.ent) return; t = h.ent; }
        else if (tg.tgt === 'ground') { const p = h.ent ? [h.ent.x, h.ent.z] : h.ground || (h.obj ? [h.obj.x, h.obj.z] : null); if (!p) return; t = { x: p[0], z: p[1] }; }
        if (g.cmdAbility(l, tg.id, t)) this.targeting = null;
        return;
      }
      if (tg.kind === 'item') {
        const p = h.ent ? [h.ent.x, h.ent.z] : h.ground;
        if (!p) return;
        if (D.dist(l.x, l.z, p[0], p[1]) > 14) { this.toast('Слишком далеко', 'warn'); return; }
        const err = g.useItem(l, tg.id, { x: p[0], z: p[1] });
        if (err) this.toast(err, 'warn');
        this.targeting = null;
      }
    }

    quickbarFor(c) {
      if (!c.qb) c.qb = [];
      const qb = c.qb;
      const want = ['attack'];
      for (const id of c.abilities) { const a = D.AB[id]; if (a && a.kind !== 'pas') want.push('ab:' + id); }
      for (const w of want) if (!qb.includes(w) && qb.length < 12) qb.push(w);
      for (let i = qb.length - 1; i >= 0; i--) if (qb[i] && qb[i].startsWith('ab:') && !c.abilities.includes(qb[i].slice(3))) qb.splice(i, 1);
      const items = ['poultice_greater', 'poultice', 'poultice_lesser', 'lyrium', 'lyrium_lesser', 'stamina_draught', 'injury_kit', 'mabari_crunch', 'fire_bomb', 'acid_flask', 'freeze_bomb', 'trap_spike', 'venom'];
      const slots = qb.slice(0, 12);
      const res = slots.slice();
      if (c.look.kind === 'dog') { if (this.g.count('mabari_crunch')) res.push('item:mabari_crunch'); }
      else for (const id of items) if (this.g.count(id) && res.length < 14 && !(D.ITEMS[id].mageOnly && c.cls !== 'mage') && id !== 'mabari_crunch') { if (id.startsWith('poultice') && res.some(x => x.startsWith('item:poultice'))) continue; res.push('item:' + id); }
      if (c === this.g.pc && this.g.flag('mg_mouse') && this.g.areaId === 'harrowing') res.push('mouse');
      return res;
    }
    useSlot(i) {
      const g = this.g, l = g.leader;
      const s = this.quickbarFor(l)[i];
      if (!s) return;
      if (s === 'attack') { const t = g.nearestFoe(l, 20); if (t) { g.cmdAttack(l, t); l.target = t.uid; } return; }
      if (s === 'mouse') { g.setMouse(!l.mouse); this.toast(l.mouse ? 'Вы принимаете облик мыши' : 'Вы снова в своём теле'); return; }
      const [k, id] = s.split(':');
      this.beginTargeting(k, id);
    }

    handleEvents() {
      const g = this.g;
      const evs = g.events;
      g.events = [];
      let spoken = null;
      for (const ev of evs) {
        switch (ev.type) {
          case 'toast': this.toast(ev.text, ev.kind); break;
          case 'log': this.log(ev.text, ev.kind); break;
          case 'sound': this.sfx(ev.id); break;
          case 'float': this.floats.push({ uid: ev.uid, text: ev.text, col: ev.col, t: 0, off: (Math.random() - 0.5) * 30 }); break;
          case 'fx': if (this.R) this.R.onFx(ev, g); break;
          case 'shake': this.cam.shake = Math.max(this.cam.shake, ev.t); break;
          case 'quest': this.toast((ev.done ? 'Задание выполнено: ' : ev.isNew ? 'Новое задание: ' : 'Журнал обновлён: ') + ev.name, ev.done ? 'gold' : 'quest'); break;
          case 'codex': this.toast('Кодекс: ' + ev.title, 'codex'); break;
          case 'item': this.toast('Получено: ' + ev.name + (ev.n > 1 ? ' ×' + ev.n : ''), 'item'); break;
          case 'gold': if (ev.n >= 100) this.toast('+' + D.fmtMoney(ev.n), 'item'); break;
          case 'xp': this.log('+' + ev.n + ' опыта', 'xp'); break;
          case 'levelup': this.toast(ev.name + ' достигает уровня ' + ev.lvl + '!', 'gold'); this.sfx('levelup'); break;
          case 'approve': this.toast(ev.name + (ev.n > 0 ? ' одобряет (+' + ev.n + ')' : ' не одобряет (' + ev.n + ')'), ev.n > 0 ? 'good' : 'bad'); this.sfx(ev.n > 0 ? 'approve' : 'disapprove'); break;
          case 'join': this.toast(ev.name + ' присоединяется к отряду', 'gold'); this.portraits.clear(); break;
          case 'check': this.log('[' + ev.label + '] ' + (ev.ok ? 'успех' : 'неудача'), ev.ok ? 'good' : 'bad'); break;
          case 'dialog': if (ev.open) this.showDialog(); else { this.hideDialog(); spoken = null; } break;
          case 'dialogline': this.renderDialog(); break;
          case 'speak': spoken = ev; this.renderDialog(); break;
          case 'loot': this.showLoot(); break;
          case 'shop': this.openPanel('shop'); break;
          case 'worldmap': this.showWorldMap(); break;
          case 'slides': this.showSlides(); break;
          case 'loading': this.showLoading(ev.area); break;
          case 'area': this.onArea(ev); break;
          case 'autosave': this.autoSave(); break;
          case 'combat': this.onCombat(ev.on); break;
          case 'pause': break;
          case 'gameover': this.showDeath(); break;
          case 'panel': this.openPanel(ev.id); break;
          case 'fade': this.fade(ev.out, ev.t); break;
          case 'music': this.audio.music(ev.id); break;
          case 'party': this.updateHud(true); break;
          case 'leader': this.updateHud(true); break;
          case 'end': this.showEnding(ev); break;
          case 'achieve': this.achieve(ev.id); break;
          default: break;
        }
      }
      if (spoken && g.dialog) this.audio.say(spoken.text, g.speakerVoice(spoken.sp));
    }
    onCombat(on) {
      const g = this.g;
      this.audio.music(on ? 'battle' : (g.music || (D.THEMES[g.theme] || {}).music || 'castle'));
      if (on && this.settings.autoPause) { g.paused = true; this.toast('Бой! Игра на паузе — отдайте приказы.', 'warn'); }
    }
    onArea(ev) {
      const g = this.g;
      this.areaName = ev.name;
      this.audio.music(g.combat ? 'battle' : g.music || (D.THEMES[g.theme] || {}).music);
      this.buildMinimap();
      this.cam.yaw = g.leader ? g.leader.face : 0;
      this.updateHud(true);
      this.toast(ev.name, 'area');
    }
    showLoading(areaId) {
      this.loadingEl && this.loadingEl.remove();
      const a = D.AREAS[areaId] || {};
      const tips = D.TIPS || ['Пробел ставит игру на паузу.'];
      const div = el('div', 'da-loading', `<canvas></canvas><div class="da-load-box"><div class="da-load-title">${esc(a.name || '')}</div><div class="da-load-tip">${esc(tips[Math.floor(Math.random() * tips.length)])}</div><div class="da-load-bar"><i></i></div></div>`, this.box);
      const cv = div.querySelector('canvas');
      cv.width = 640; cv.height = 400;
      if (D.paintScene) D.paintScene(cv.getContext('2d'), 640, 400, a.art || 'loading_' + ((D.THEMES[typeof a.theme === 'string' ? a.theme : 'castle_day'] || {}).outdoor ? 'out' : 'in'));
      this.loadingEl = div;
      this.pendingLoad = 3;
      this.pendingArea = areaId;
    }
    finishLoading() {
      const g = this.g;
      if (g.pendingGoto) g.finishGoto();
      this.handleEvents();
      if (this.R && g.L) this.R.setArea(g);
      this.renderSerial = g.areaSerial;
      this.buildMinimap();
      const l = this.loadingEl;
      this.loadingEl = null;
      if (l) { const bar = l.querySelector('.da-load-bar i'); if (bar) bar.style.width = '100%'; l.style.opacity = '0'; setTimeout(() => l.remove(), 400); }
    }

    toast(text, kind) {
      if (!this.toastBox) return;
      const t = el('div', 'da-toast ' + (kind || ''), esc(text), this.toastBox);
      setTimeout(() => t.classList.add('out'), kind === 'area' ? 2600 : 3200);
      setTimeout(() => t.remove(), kind === 'area' ? 3400 : 4000);
      while (this.toastBox.children.length > 6) this.toastBox.firstChild.remove();
    }
    log(text, kind) {
      this.logLines.push({ text, kind, t: performance.now() });
      if (this.logLines.length > 120) this.logLines.shift();
      this.logDirty = true;
    }

    buildHud() {
      const h = this.hud;
      h.innerHTML = '';
      const pwrap = el('div', 'da-pwrap', null, h);
      this.partyEl = el('div', 'da-party', null, pwrap);
      this.partyBtns = el('div', 'da-partybtns', null, pwrap);
      const hold = el('button', 'da-rbtn', `<img src="${D.ICONS.ui('hold', 20)}">`, this.partyBtns);
      hold.title = 'Удерживать позицию (H)';
      hold.onclick = () => { this.g.holdPos = !this.g.holdPos; hold.classList.toggle('on', this.g.holdPos); };
      const all = el('button', 'da-rbtn', `<img src="${D.ICONS.ui('people', 20)}">`, this.partyBtns);
      all.title = 'Выбрать весь отряд (B)';
      all.onclick = () => this.selectAllToggle();
      this.topbar = el('div', 'da-topbar', null, h);
      for (const [id, ic, title] of TOPBAR) {
        const b = el('button', 'da-tb', `<img src="${D.ICONS.ui(ic, 26)}">`, this.topbar);
        b.title = title;
        b.onclick = () => { if (this.panel === id) this.closePanel(); else this.openPanel(id); };
        b.dataset.id = id;
      }
      this.miniWrap = el('div', 'da-miniwrap', '<canvas class="da-mini" width="150" height="150"></canvas><div class="da-mini-ring"></div><div class="da-areaname"></div>', h);
      this.mini = this.miniWrap.querySelector('canvas');
      this.areaEl = this.miniWrap.querySelector('.da-areaname');
      this.targetEl = el('div', 'da-target', null, h);
      this.pauseEl = el('div', 'da-pause', 'ПАУЗА', h);
      this.toastBox = el('div', 'da-toasts', null, h);
      this.logEl = el('div', 'da-log', null, h);
      this.qbar = el('div', 'da-qbar', null, h);
      this.qbarL = el('div', 'da-qleft', null, this.qbar);
      const mk = (ic, title, fn) => { const b = el('button', 'da-qs small', `<img src="${D.ICONS.ui(ic, 22)}">`, this.qbarL); b.title = title; b.onclick = fn; return b; };
      mk('attack', 'Атаковать ближайшего', () => this.useSlot(0));
      mk('stop', 'Стоп', () => this.g.cmdStop(this.g.leader));
      mk('hold', 'Пауза (Пробел)', () => { this.g.paused = !this.g.paused; });
      this.qslots = el('div', 'da-qslots', null, this.qbar);
      this.xpBar = el('div', 'da-xpbar', '<i></i>', this.qbar);
      this.hintEl = el('div', 'da-hint', null, h);
    }
    portraitFor(c) {
      const key = JSON.stringify([c.look, c.equip && c.equip.head, c.mouse]);
      if (this.portraits.has(key)) return this.portraits.get(key);
      let url;
      if (this.PR) {
        try {
          this.PR.renderPreview(c, { head: c.look.kind === 'humanoid' || !c.look.kind, bg: [0.08, 0.07, 0.06] });
          url = this.pcv.toDataURL();
        } catch (e) { url = D.ICONS.portrait2d(c.look, 64); }
      } else url = D.ICONS.portrait2d(c.look, 64);
      this.portraits.set(key, url);
      return url;
    }
    updateHud(force) {
      const g = this.g;
      if (!g || !this.partyEl) return;
      this.pauseEl.style.display = g.paused && g.mode === 'play' ? 'block' : 'none';
      this.areaEl.textContent = (g.def && g.def.name) || '';
      const sig = g.party.map(c => c.uid + (c === g.leader ? 'L' : '') + (g.selected.includes(c) ? 'S' : '')).join(',');
      if (force || sig !== this.partySig) {
        this.partySig = sig;
        this.partyEl.innerHTML = '';
        g.party.forEach((c, i) => {
          const d = el('div', 'da-pm' + (c === g.leader ? ' lead' : '') + (g.selected.includes(c) ? ' sel' : ''), `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" class="bg"/><circle cx="40" cy="40" r="36" class="hp"/><circle cx="40" cy="40" r="31" class="bg2"/><circle cx="40" cy="40" r="31" class="mp ${c.cls === 'mage' ? 'mana' : 'stam'}"/></svg><img src="${this.portraitFor(c)}"><div class="da-pm-lv"></div><div class="da-pm-name">${esc(c.name)}</div><div class="da-pm-num">F${i + 1}</div>`, this.partyEl);
          d.onclick = e => { if (e.shiftKey) { if (!g.selected.includes(c)) g.selected.push(c); else g.selected = g.selected.filter(x => x !== c || x === g.leader); this.updateHud(true); } else this.setLeader(c); };
          d.ondblclick = () => { this.setLeader(c); this.openPanel('char'); };
          d.oncontextmenu = e => { e.preventDefault(); this.setLeader(c); this.openPanel('inv'); };
          d._c = c;
        });
      }
      for (const d of this.partyEl.children) {
        const c = d._c;
        const hp = c.dead || c.down ? 0 : c.hp / c.stats.hpMax, mp = c.stats.mpMax ? c.mp / c.stats.mpMax : 0;
        const C1 = 2 * Math.PI * 36, C2 = 2 * Math.PI * 31;
        d.querySelector('.hp').style.strokeDasharray = (C1 * hp * 0.5) + ' ' + C1;
        d.querySelector('.mp').style.strokeDasharray = (C2 * mp * 0.5) + ' ' + C2;
        d.classList.toggle('down', !!(c.down || c.dead));
        d.classList.toggle('hurt', hp < 0.3 && hp > 0);
        const pts = c.points.attr + c.points.talent + c.points.skill;
        const lv = d.querySelector('.da-pm-lv');
        lv.textContent = pts ? '+' : '';
        lv.title = pts ? 'Есть непотраченные очки' : '';
        d.title = `${c.name}\nЗдоровье: ${Math.round(c.hp)}/${c.stats.hpMax}\n${c.cls === 'mage' ? 'Мана' : 'Выносливость'}: ${Math.round(c.mp)}/${c.stats.mpMax}${c.injuries.length ? '\nТравмы: ' + c.injuries.map(i => D.INJURIES.find(x => x.id === i).name).join(', ') : ''}`;
      }
      const l = g.leader;
      const qb = this.quickbarFor(l);
      const qsig = l.uid + ':' + qb.join(',') + ':' + l.sustained.join(',');
      if (force || qsig !== this.qsig) {
        this.qsig = qsig;
        this.qslots.innerHTML = '';
        qb.forEach((s, i) => {
          const b = el('button', 'da-qs', null, this.qslots);
          let icon, title;
          if (s === 'attack') { icon = D.ICONS.ui('attack', 34); title = 'Атаковать'; }
          else if (s === 'mouse') { icon = D.ICONS.item('mouse_form', 40); title = 'Облик мыши'; }
          else { const [k, id] = s.split(':'); if (k === 'ab') { icon = D.ICONS.ability(id, 40); const a = D.AB[id]; title = a.name + (a.cost ? ' — ' + (l.cls === 'mage' ? 'мана ' : 'выносл. ') + g.abilityCost(l, a) : '') + (a.cd ? ', перезарядка ' + a.cd + ' с' : '') + '\n' + a.desc; } else { icon = D.ICONS.item(id, 40); title = D.ITEMS[id].name; } }
          b.innerHTML = `<img src="${icon}"><i class="cd"></i><b>${i < 10 ? (i + 1) % 10 : ''}</b><em></em>`;
          b.title = title;
          b.onclick = () => this.useSlot(i);
          b._s = s;
        });
      }
      for (const b of this.qslots.children) {
        const s = b._s;
        let frac = 0, on = false, dis = false, cnt = '';
        if (s.startsWith('ab:')) {
          const id = s.slice(3), a = D.AB[id];
          if (a.cd && l.cds[id] > 0) frac = l.cds[id] / a.cd;
          on = l.sustained.includes(id);
          dis = l.mp < g.abilityCost(l, a) && !on;
        } else if (s.startsWith('item:')) { const id = s.slice(5); cnt = g.count(id); dis = !cnt; if (l.cds.item > 0) frac = l.cds.item / 2; }
        b.querySelector('.cd').style.height = (frac * 100) + '%';
        b.classList.toggle('on', on);
        b.classList.toggle('dis', dis);
        b.querySelector('em').textContent = cnt;
      }
      const xpNow = l.xp - D.xpForLevel(l.lvl), xpNeed = D.xpForLevel(l.lvl + 1) - D.xpForLevel(l.lvl);
      this.xpBar.firstChild.style.width = clamp(xpNow / xpNeed * 100, 0, 100) + '%';
      this.xpBar.title = 'Опыт: ' + l.xp + ' / ' + D.xpForLevel(l.lvl + 1);
      const tgt = (this.hover && this.hover.ent && this.hover.ent.faction === 'hostile' && this.hover.ent) || g.ents.find(e => e.uid === l.target && e.faction === 'hostile' && !e.dead);
      if (tgt && !tgt.dead) {
        this.targetEl.style.display = 'block';
        const rk = D.RANKS[tgt.rank] || D.RANKS.normal;
        this.targetEl.innerHTML = `<div class="nm">${esc(tgt.name)}</div><div class="rk rk-${tgt.rank}">${rk[0]} · ур. ${tgt.lvl}</div><div class="bar"><i style="width:${clamp(tgt.hp / tgt.stats.hpMax * 100, 0, 100)}%"></i></div>${tgt.effects.filter(e => e.st || e.debuff).map(e => `<span class="st">${esc(e.st ? D.ST_NAME[e.st] || e.st : 'ослаблен')}</span>`).join('')}`;
      } else this.targetEl.style.display = 'none';
      if (this.logDirty || this.logBig !== this.logBigShown) {
        this.logDirty = false;
        this.logBigShown = this.logBig;
        const n = this.logBig ? 18 : 6;
        this.logEl.classList.toggle('big', !!this.logBig);
        this.logEl.innerHTML = this.logLines.slice(-n).map(x => `<div class="${x.kind}">${esc(x.text)}</div>`).join('');
      }
      const now = performance.now();
      if (!this.logBig) for (const [i, d] of Array.from(this.logEl.children).entries()) { const ln = this.logLines[this.logLines.length - this.logEl.children.length + i]; if (ln) d.style.opacity = Math.max(0, 1 - (now - ln.t - 6000) / 3000); }
      if (this.targeting) this.hintEl.textContent = 'Цель: ' + this.targeting.name + ' — ЛКМ выбрать, ПКМ отмена';
      else if (this.hover && this.hover.obj) this.hintEl.textContent = this.objLabel(this.hover.obj);
      else this.hintEl.textContent = '';
      this.drawMinimap();
    }
    objLabel(o) {
      if (o.t === 'box') return (o.label || { chest: 'Сундук', barrel: 'Бочка', crate: 'Ящик', sack: 'Мешок', pouch: 'Добыча', corpse: 'Тело', bookcase: 'Книжный шкаф', wardrobe: 'Шкаф', cauldron: 'Котёл', altar: 'Алтарь', grave: 'Могила', pod: 'Кокон', bones: 'Останки', rubble: 'Обломки' }[o.kind] || 'Контейнер') + (o.lock && !o.unlocked ? ' (заперто)' : o.empty ? ' (пусто)' : '');
      if (o.t === 'door') return (o.label || 'Дверь') + (o.lock && !o.open ? ' (заперто)' : '');
      if (o.t === 'exit') return o.label || (D.AREAS[o.to] ? D.AREAS[o.to].name : 'Выход');
      if (o.t === 'use') return o.label || 'Осмотреть';
      return '';
    }

    buildMinimap() {
      const g = this.g;
      if (!g || !g.L) return;
      const L = g.L;
      const c = document.createElement('canvas');
      c.width = L.w; c.height = L.h;
      const x = c.getContext('2d');
      const img = x.createImageData(L.w, L.h);
      for (let i = 0; i < L.w * L.h; i++) {
        const s = L.solid[i], f = L.floor[i];
        let col;
        if (s === 1) col = [58, 44, 30];
        else if (s === 2) col = [70, 62, 50];
        else if (s === 3) col = [10, 8, 6];
        else if (!f) col = [20, 16, 12];
        else if (L.nav.walk[i]) col = !isNaN(L.water[i]) ? [60, 90, 100] : L.roof[i] ? [170, 150, 118] : [150, 134, 100];
        else col = [100, 86, 64];
        img.data[i * 4] = col[0]; img.data[i * 4 + 1] = col[1]; img.data[i * 4 + 2] = col[2]; img.data[i * 4 + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      this.miniBase = c;
    }
    drawMinimap() {
      const g = this.g, cv = this.mini;
      if (!cv || !this.miniBase || !g.leader) return;
      const x = cv.getContext('2d');
      const S = 150, sc = 3.2;
      x.save();
      x.clearRect(0, 0, S, S);
      x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 2, 0, 7); x.clip();
      x.fillStyle = '#140f0a'; x.fillRect(0, 0, S, S);
      x.translate(S / 2, S / 2);
      x.rotate(Math.PI + this.cam.yaw);
      x.scale(sc, sc);
      const l = g.leader;
      x.translate(-l.x, -l.z);
      x.imageSmoothingEnabled = false;
      x.drawImage(this.miniBase, 0, 0);
      const dot = (px, pz, col, r) => { x.fillStyle = col; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill(); };
      const surv = g.party.reduce((m, c) => Math.max(m, c.skills.survival || 0), 0);
      for (const o of g.activeObjs()) {
        if (o.t === 'exit' && !o.hidden) { x.fillStyle = '#6af'; x.fillRect(o.x - 0.8, o.z - 0.8, 1.6, 1.6); }
        if (o.t === 'box' && !o.empty && o.kind !== 'corpse') { x.fillStyle = '#dca'; x.fillRect(o.x - 0.4, o.z - 0.4, 0.8, 0.8); }
      }
      for (const e of g.ents) {
        if (e.dead || e.gone) continue;
        if (e.faction === 'hostile') { if (e.aware || D.dist(e.x, e.z, l.x, l.z) < 8 + surv * 8) dot(e.x, e.z, '#e33', 0.7); }
        else if (e.kind === 'npc') dot(e.x, e.z, e.dlg ? '#fd6' : '#aa8', 0.55);
        else if (e.faction === 'ally') dot(e.x, e.z, '#6af', 0.55);
      }
      for (const c of g.party) if (c !== l && !c.dead) dot(c.x, c.z, '#6e6', 0.6);
      x.restore();
      x.save();
      x.translate(S / 2, S / 2);
      x.fillStyle = '#fff'; x.strokeStyle = '#000';
      x.rotate(Math.PI + this.cam.yaw - l.face + Math.PI);
      x.beginPath(); x.moveTo(0, -6); x.lineTo(4, 4); x.lineTo(0, 2); x.lineTo(-4, 4); x.closePath(); x.fill(); x.stroke();
      x.restore();
    }

    drawOverlay(dt) {
      const x = this.octx, R = this.R, g = this.g;
      const W = this.ov.width, H = this.ov.height;
      x.clearRect(0, 0, W, H);
      if (!R || !R.VP || g.mode === 'dialog') { this.floats = this.floats.filter(f => (f.t += dt) < 1.4); return; }
      x.textAlign = 'center';
      x.font = 'bold 13px Georgia, serif';
      const byUid = new Map(g.ents.map(e => [e.uid, e]));
      for (const e of g.ents) {
        if (e.dead || e.gone) continue;
        const hov = this.hover && this.hover.ent === e;
        const showBar = (this.settings.bars && g.combat && (e.faction === 'hostile' && e.aware)) || hov || (this.tabHeld && e.faction !== 'party');
        const showName = hov || this.tabHeld;
        if (!showBar && !showName) continue;
        const M = R.modelFor(e);
        const p = R.project(e.x, e.y + (M.height || 1.8) + 0.3, e.z);
        if (!p || p[2] > 45) continue;
        if (showName) {
          x.fillStyle = 'rgba(0,0,0,0.7)';
          const nm = e.name;
          x.fillText(nm, p[0] + 1, p[1] - 7);
          x.fillStyle = e.faction === 'hostile' ? '#ff8870' : e.faction === 'party' ? '#b8f0b0' : e.dlg ? '#ffe08a' : '#e0d8c0';
          x.fillText(nm, p[0], p[1] - 8);
        }
        if (showBar && e.faction !== 'neutral') {
          const w = e.rank === 'boss' ? 70 : 44;
          x.fillStyle = 'rgba(0,0,0,0.75)'; x.fillRect(p[0] - w / 2 - 1, p[1] - 3, w + 2, 6);
          x.fillStyle = e.faction === 'hostile' ? '#c22' : '#3a3';
          x.fillRect(p[0] - w / 2, p[1] - 2, w * clamp(e.hp / e.stats.hpMax, 0, 1), 4);
        }
      }
      if (this.tabHeld) {
        x.font = '12px Georgia, serif';
        for (const o of g.activeObjs()) {
          if (o.t === 'trig' || (o.t === 'box' && o.empty) || (o.t === 'exit' && o.hidden)) continue;
          const p = R.project(o.x, g.L.nav.heightAt(o.x, o.z) + 1.2, o.z);
          if (!p || p[2] > 35) continue;
          x.fillStyle = 'rgba(0,0,0,0.7)'; x.fillText(this.objLabel(o), p[0] + 1, p[1] + 1);
          x.fillStyle = '#e8d8a0'; x.fillText(this.objLabel(o), p[0], p[1]);
        }
      }
      x.font = 'bold 15px Georgia, serif';
      for (const f of this.floats) {
        f.t += dt;
        const e = byUid.get(f.uid);
        if (!e) continue;
        const M = R.modelFor(e);
        const p = R.project(e.x, e.y + (M.height || 1.8) + 0.2 + f.t * 0.9, e.z);
        if (!p) continue;
        const a = f.t < 1 ? 1 : Math.max(0, 1 - (f.t - 1) / 0.4);
        x.globalAlpha = a;
        x.fillStyle = '#000'; x.fillText(f.text, p[0] + f.off + 1, p[1] + 1);
        x.fillStyle = f.col || '#fff'; x.fillText(f.text, p[0] + f.off, p[1]);
      }
      x.globalAlpha = 1;
      this.floats = this.floats.filter(f => f.t < 1.4);
    }

    showDialog() {
      this.hideDialog();
      this.hud.classList.add('talk');
      this.dlgEl = el('div', 'da-dialog', '<div class="da-lb top"></div><div class="da-lb bot"></div><div class="da-dbox"><div class="da-dspk"></div><div class="da-dtext"></div><div class="da-dreplies"></div></div>', this.box);
      this.renderDialog();
    }
    hideDialog() { this.audio.hush(); this.hud.classList.remove('talk'); if (this.dlgEl) { this.dlgEl.remove(); this.dlgEl = null; } }
    renderDialog() {
      const g = this.g;
      if (!this.dlgEl || !g.dialog) return;
      const line = g.curLine();
      const spk = this.dlgEl.querySelector('.da-dspk'), txt = this.dlgEl.querySelector('.da-dtext'), rep = this.dlgEl.querySelector('.da-dreplies');
      spk.textContent = line && line.name ? line.name : '';
      txt.className = 'da-dtext' + (line && line.sp === 'narr' ? ' narr' : '');
      txt.textContent = line ? line.text : '';
      const opts = g.replies();
      rep.innerHTML = '';
      if (!opts.length) {
        const c = el('div', 'da-reply cont', g.moreLines() || (g.curNode() && g.nextAfter(g.curNode())) ? '<b>▸</b> Продолжить' : '<b>▸</b> Закончить разговор', rep);
        c.onclick = () => this.dialogContinue();
        return;
      }
      opts.forEach((r, i) => {
        const tag = r.check ? `<span class="chk">[${esc(r.label)}]</span> ` : '';
        const d = el('div', 'da-reply', `<b>${i + 1}.</b> ${tag}${esc(r.text)}`, rep);
        d.onclick = () => this.chooseReply(i);
      });
    }
    chooseReply(i) {
      const g = this.g;
      if (!g.dialog) return;
      if (!g.replies().length) { this.dialogContinue(); return; }
      this.sfx('click');
      g.choose(i);
      this.handleEvents();
      this.renderDialog();
    }
    dialogContinue() {
      const g = this.g;
      if (!g.dialog) return;
      if (g.replies().length) return;
      g.advance();
      this.handleEvents();
      this.renderDialog();
    }

    showLoot() {
      const g = this.g;
      this.lootEl && this.lootEl.remove();
      if (!g.loot) return;
      const rec = g.loot.rec;
      const d = el('div', 'da-loot', null, this.layer);
      this.lootEl = d;
      const render = () => {
        if (!g.loot) { d.remove(); this.lootEl = null; return; }
        d.innerHTML = `<div class="da-loot-t">${esc(this.objLabel(g.loot.obj).replace(/ \(.*\)$/, ''))}</div><div class="da-loot-list"></div><div class="da-loot-b"><button class="da-btn all">Взять всё</button><button class="da-btn close">Закрыть</button></div>`;
        const list = d.querySelector('.da-loot-list');
        if (rec.gold) { const r = el('div', 'da-loot-row', `<span class="coin"></span><span>${D.fmtMoney(rec.gold)}</span>`, list); r.onclick = () => { g.takeGold(); this.sfx('coins'); render(); }; }
        rec.items.forEach(([id, n], i) => {
          const it = D.ITEMS[id];
          const r = el('div', 'da-loot-row', `<img src="${D.ICONS.item(id, 32)}"><span>${esc(it.name)}${n > 1 ? ' ×' + n : ''}</span>`, list);
          r.title = D.itemTooltip ? D.itemTooltip(it, g) : it.name;
          r.onclick = () => { g.takeLoot(i); this.sfx('loot'); render(); };
        });
        if (!rec.gold && !rec.items.length) el('div', 'da-loot-empty', 'Пусто', list);
        d.querySelector('.all').onclick = () => { g.takeAll(); this.sfx('loot'); this.closeLoot(); };
        d.querySelector('.close').onclick = () => this.closeLoot();
      };
      render();
    }
    closeLoot() { this.g.closeLoot(); if (this.lootEl) { this.lootEl.remove(); this.lootEl = null; } }

    showSlides() {
      const g = this.g;
      if (!g.slides) return;
      this.slidesEl && this.slidesEl.remove();
      const d = el('div', 'da-slides', '<canvas width="800" height="450"></canvas><div class="da-slide-text"></div><div class="da-slide-hint">Щелчок или пробел — дальше</div>', this.box);
      this.slidesEl = d;
      d.onclick = () => this.nextSlide();
      this.renderSlide();
    }
    renderSlide() {
      const g = this.g, d = this.slidesEl;
      if (!d) return;
      if (!g.slides) { d.remove(); this.slidesEl = null; return; }
      const s = g.slides.list[g.slides.i];
      const cv = d.querySelector('canvas');
      if (D.paintScene) D.paintScene(cv.getContext('2d'), 800, 450, s.img);
      const t = d.querySelector('.da-slide-text');
      t.textContent = g.subst(s.text);
      t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    }
    nextSlide() {
      const g = this.g;
      if (!g.slides) { if (this.slidesEl) { this.slidesEl.remove(); this.slidesEl = null; } return; }
      this.sfx('page');
      g.nextSlide();
      this.renderSlide();
    }

    showDeath() {
      const d = el('div', 'da-death', `<div class="da-death-t">Отряд погиб</div><div class="da-death-s">Мор поглотит Ферелден. Но, возможно, у истории есть другой конец.</div><div class="da-death-b"><button class="da-btn load">Загрузить последнее сохранение</button><button class="da-btn menu">Главное меню</button></div>`, this.layer);
      d.querySelector('.load').onclick = () => { d.remove(); this.loadLatest(); };
      d.querySelector('.menu').onclick = () => { d.remove(); this.showMenu(); };
      this.audio.music('sad');
    }

    startGame(g) {
      this.g = g;
      this.screen = 'game';
      this.clearLayer();
      this.hideDialog();
      if (this.slidesEl) { this.slidesEl.remove(); this.slidesEl = null; }
      this.menuEl && this.menuEl.remove();
      this.menuEl = null;
      this.hud.style.display = '';
      this.buildHud();
      this.logLines = [];
      this.portraits.clear();
      this.renderSerial = -1;
      this.cam.yaw = g.leader ? g.leader.face : 0;
      this.cam.zoom = 0.3;
      g.autoPause = false;
      this.fade(0, 0.1);
      this.showLoading(g.areaId);
      this.box.focus({ preventScroll: true });
    }

    listSaves() {
      try { return JSON.parse(localStorage.getItem('dao98_saves') || '[]'); } catch (e) { return []; }
    }
    writeSave(slot, label) {
      const g = this.g;
      if (!g || g.mode === 'dialog' || g.mode === 'cutscene' || g.combat && slot !== 'auto') { if (slot !== 'auto') this.toast('Сейчас сохраниться нельзя', 'warn'); return false; }
      try {
        const data = g.serialize();
        localStorage.setItem('dao98_save_' + slot, JSON.stringify(data));
        const list = this.listSaves().filter(s => s.slot !== slot);
        list.unshift({ slot, label: label || (slot === 'auto' ? 'Автосохранение' : slot === 'quick' ? 'Быстрое сохранение' : 'Сохранение'), name: g.pc.name, lvl: g.pc.lvl, area: g.def.name, time: Date.now(), play: Math.round(g.playTime), origin: g.origin, look: g.pc.look });
        localStorage.setItem('dao98_saves', JSON.stringify(list.slice(0, 30)));
        if (slot !== 'auto') this.toast('Игра сохранена', 'good');
        return true;
      } catch (e) { this.toast('Ошибка сохранения: ' + e.message, 'warn'); return false; }
    }
    loadSave(slot) {
      try {
        const data = JSON.parse(localStorage.getItem('dao98_save_' + slot));
        if (!data) { this.toast('Сохранение не найдено', 'warn'); return false; }
        const g = D.Game.load(data, {});
        this.startGame(g);
        return true;
      } catch (e) { console.error(e); this.toast('Не удалось загрузить: ' + e.message, 'warn'); return false; }
    }
    autoSave() { this.writeSave('auto'); }
    quickSave() { this.writeSave('quick'); }
    quickLoad() { this.loadSave('quick'); }
    loadLatest() { const l = this.listSaves()[0]; if (l) this.loadSave(l.slot); else this.showMenu(); }

    achieve(id) {
      let p;
      try { p = JSON.parse(localStorage.getItem('dao98_profile') || '{}'); } catch (e) { p = {}; }
      p.ach = p.ach || {};
      if (p.ach[id]) return;
      p.ach[id] = Date.now();
      try { localStorage.setItem('dao98_profile', JSON.stringify(p)); } catch (e) { }
      const a = (D.ACHIEVEMENTS || {})[id];
      if (a) this.toast('Достижение: ' + a.name, 'gold');
    }
  }

  D.UI = UI;
})(globalThis.Dao98 = globalThis.Dao98 || {});
