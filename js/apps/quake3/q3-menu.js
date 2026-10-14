(function (Q) {
  'use strict';
  const M4 = Q.M4;
  const SHOT_KEY = 'q3a_shots_v2';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  class FireLogo {
    constructor(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.W = 900; this.H = 260;
      canvas.width = this.W; canvas.height = this.H;
      this.FW = 225; this.FH = 65;
      this.heat = new Uint8Array(this.FW * this.FH);
      this.pal = [];
      for (let i = 0; i < 64; i++) {
        const t = i / 63;
        this.pal.push([Math.min(255, t * 3 * 255), Math.min(255, Math.max(0, t * 3 - 1) * 255), Math.min(255, Math.max(0, t * 3 - 2) * 255)]);
      }
      this.mask = Q.mkCanvas(this.W, this.H);
      const m = this.mask.getContext('2d');
      m.fillStyle = '#fff';
      m.textAlign = 'center';
      m.textBaseline = 'alphabetic';
      m.save();
      m.translate(this.W / 2, 150);
      m.scale(1.08, 1.35);
      m.font = "122px Impact, 'Arial Black', sans-serif";
      m.fillText('QUAKE III', 0, 0);
      m.restore();
      this.maskData = m.getImageData(0, 0, this.W, this.H).data;
      this.src = new Uint8Array(this.FW * this.FH);
      for (let y = 0; y < this.FH; y++) for (let x = 0; x < this.FW; x++) {
        const mx = Math.floor((x + 0.5) * this.W / this.FW), my = Math.floor((y + 0.5) * this.H / this.FH);
        this.src[y * this.FW + x] = this.maskData[(my * this.W + mx) * 4 + 3] > 100 ? 1 : 0;
      }
      this.fireCv = Q.mkCanvas(this.FW, this.FH);
      this.fctx = this.fireCv.getContext('2d');
      this.img = this.fctx.createImageData(this.FW, this.FH);
      this.seed = 1;
    }

    rnd() { this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff; return this.seed / 0x7fffffff; }

    step() {
      const W = this.FW, H = this.FH, h = this.heat, s = this.src;
      for (let i = 0; i < h.length; i++) if (s[i]) h[i] = this.rnd() < 0.5 ? 18 + Math.floor(this.rnd() * 26) : h[i];
      for (let y = 1; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          const r = Math.floor(this.rnd() * 3);
          const dst = (y - 1) * W + Math.min(W - 1, Math.max(0, x - r + 1));
          if (s[dst]) continue;
          const v = h[i] - (this.rnd() < 0.6 ? 2 : 1);
          h[dst] = v > 0 ? v : 0;
        }
      }
    }

    draw() {
      this.step();
      const d = this.img.data, h = this.heat;
      for (let i = 0; i < h.length; i++) {
        const c = this.pal[Math.min(63, h[i])];
        d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = this.src[i] ? 0 : Math.min(255, h[i] * 7);
      }
      this.fctx.putImageData(this.img, 0, 0);
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.W, this.H);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.fireCv, 0, 0, this.W, this.H);
      ctx.restore();
      ctx.save();
      ctx.translate(this.W / 2, 150);
      ctx.scale(1.08, 1.35);
      ctx.font = "122px Impact, 'Arial Black', sans-serif";
      ctx.textAlign = 'center';
      for (let k = 8; k > 0; k--) { ctx.fillStyle = `rgb(${30 + k * 7},${4 + k},0)`; ctx.fillText('QUAKE III', k * 0.9, k); }
      const g = ctx.createLinearGradient(0, -92, 0, 0);
      g.addColorStop(0, '#ffe890'); g.addColorStop(0.3, '#ffa020'); g.addColorStop(0.65, '#d04008'); g.addColorStop(1, '#5a0c00');
      ctx.fillStyle = g;
      ctx.fillText('QUAKE III', 0, 0);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.5;
      ctx.scale(1 / 1.08, 1 / 1.35);
      ctx.drawImage(this.fireCv, -this.W / 2, -150 - 10, this.W, this.H);
      ctx.restore();
      ctx.save();
      ctx.font = "bold 44px 'Arial Black', Impact, sans-serif";
      ctx.textAlign = 'center';
      'ARENA'.split('').forEach((c, i) => {
        const x = this.W / 2 + (i - 2) * 150;
        ctx.fillStyle = '#3a1400'; ctx.fillText(c, x + 3, 235);
        const g2 = ctx.createLinearGradient(0, 198, 0, 232);
        g2.addColorStop(0, '#ffe080'); g2.addColorStop(1, '#c05808');
        ctx.fillStyle = g2; ctx.fillText(c, x, 232);
      });
      ctx.restore();
    }
  }
  Q.FireLogo = FireLogo;

  class Cine {
    constructor(world, script) {
      this.world = world;
      this.script = script;
      this.t0 = null;
      const sp = world.spawns, im = world.intermission;
      const c = [(world.mins[0] + world.maxs[0]) / 2, (world.mins[1] + world.maxs[1]) / 2, im.pos[2] - 40];
      const pick = i => sp[i % sp.length].pos;
      this.shots = [];
      const n = Math.max(3, Math.ceil(script.dur / 6));
      for (let i = 0; i < n; i++) {
        const a = pick(i * 3 + 1), b = pick(i * 3 + 2);
        this.shots.push({ from: [a[0], a[1], a[2] + 70], to: [b[0], b[1], b[2] + 90], look: i % 2 ? c : im.pos });
      }
      this.shots.unshift({ from: [im.pos[0], im.pos[1], im.pos[2] + 120], to: im.pos, look: Q.vma(im.pos, 400, Q.angleVectors(im.yaw, im.pitch).fwd) });
    }
    view(time) {
      if (this.t0 === null) this.t0 = time;
      const t = time - this.t0;
      const i = Math.min(this.shots.length - 1, Math.floor(t / 6));
      const k = Q.smooth(Math.min(1, (t - i * 6) / 6));
      const s = this.shots[i];
      const pos = Q.vlerp(s.from, s.to, k);
      const a = Q.vecToAngles(Q.vsub(s.look, pos));
      return { pos, yaw: a.yaw, pitch: Q.clamp(a.pitch, -0.8, 0.8), thirdPerson: true };
    }
    done(time) { return this.t0 !== null && time - this.t0 > this.script.dur; }
    drawText(ctx, w, h, time) {
      const t = this.t0 === null ? 0 : time - this.t0;
      const lines = this.script.lines;
      const per = this.script.dur / lines.length;
      const i = Math.min(lines.length - 1, Math.floor(t / per));
      const k = (t - i * per) / per;
      const a = Math.min(1, k * 4, (1 - k) * 4);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h * 0.1); ctx.fillRect(0, h * 0.9, w, h * 0.1);
      ctx.globalAlpha = Math.max(0, a);
      ctx.font = `${Math.round(h * 0.034)}px 'Arial Black', Verdana, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000'; ctx.fillText(lines[i], w / 2 + 2, h * 0.82 + 2);
      ctx.fillStyle = '#f0d8b0'; ctx.fillText(lines[i], w / 2, h * 0.82);
      ctx.globalAlpha = 1;
      if (t < 1.5) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 1.5})`; ctx.fillRect(0, 0, w, h); }
      if (t > this.script.dur - 1.5) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, (t - this.script.dur + 1.5) / 1.5)})`; ctx.fillRect(0, 0, w, h); }
    }
  }
  Q.Cine = Cine;

  const CINEMATICS = [
    { id: 'intro', name: 'INTRO', map: 'q3dm1', dur: 34, bots: ['sarge', 'klesk', 'mynx', 'anarki'], lines: [
      'Beyond the edge of the known worlds lies the Arena Eternal.',
      'The Vadrigar built it for one purpose: to watch the greatest warriors of all time fight.',
      'Soldiers, killers and creatures are torn from their own ages and thrown into the gates.',
      'Death here is only a pause. Every fallen warrior is reborn to fight again.',
      'Climb the tiers. Defeat the Arena Lords. Face Xaero.',
      'Welcome to the Arena.'] },
    { id: 'tier1', name: 'TIER 1', map: 'q3tourney1', dur: 24, need: 1, bots: ['sarge', 'ranger', 'phobos'], lines: [
      'Sarge has fallen at Power Station 0218.',
      'The trainees are behind you now.',
      'The Vadrigar are watching. The Skilled tier awaits.',
      'Tier 2 is open.'] },
    { id: 'tier2', name: 'TIER 2', map: 'q3tourney2', dur: 24, need: 2, bots: ['hunter', 'grunt', 'daemia'], lines: [
      'Hunter has lost her last hunt at the Proving Grounds.',
      'Few warriors ever get this far.',
      'The deeper tiers of the Arena Eternal are sealed in this edition.',
      'Until they open, the Arena belongs to you.'] }
  ];
  Q.CINEMATICS = CINEMATICS;

  const SERVER_NAMES = ['[RU] Nizhny Novgorod Arena', 'Clan MoD Railers', 'Fido 2:5020 Q3', 'ZONA-NET q3dm6 24/7', 'Chelyabinsk Hardcore', 'LAN Party 2000', 'Moscow Online DM', 'id Software Test', 'Cybercafe Neo', 'Quake Russia #1', 'Rocket Arena Pub', 'Kolyan Server'];
  const HUMAN_NICKS = ['Stiffer', 'R2aD2', 'Kolyan_NN', 'Morph', 'LenaCat', 'Serega_Voodoo2', 'Gordon_F', 'Wirts_Leg', 'FreelanceMax', 'Zver', 'DeathFromAbove', 'RailGod', 'LamerX', '[MoD]Tank', 'Babka', 'Vitalik98', 'Shaitan', 'Cooller'];

  class Menu {
    constructor(ui) {
      this.ui = ui;
      this.el = ui.menuEl;
      this.stack = [];
      this.cur = null;
      this.shots = {};
      this.portraits = {};
      this.shotQueue = [];
      this.logo = null;
      this.previewModel = null;
      this.selTier = 1;
      this.selMap = null;
      this.skirm = { map: 'q3dm6', gametype: 'ffa', fraglimit: 20, timelimit: 10, bots: [{ bot: 'sarge', skill: 3 }, { bot: 'klesk', skill: 3 }, { bot: 'mynx', skill: 3 }], team: 'red' };
      try { localStorage.removeItem('q3a_shots_v1'); } catch (e) { }
      const cache = (() => { try { return JSON.parse(localStorage.getItem(SHOT_KEY)) || {}; } catch (e) { return {}; } })();
      for (const a of Q.ARENAS) {
        const k = a.map + ':' + Q.hash(Q.MAPS[a.map] ? Q.MAPS[a.map].build.toString() : '');
        if (cache[k]) this.shots[a.map] = cache[k];
      }
    }

    destroy() { this.el.innerHTML = ''; }

    sound(k) { this.ui.audio.init(); this.ui.audio.play(k || 'menu', { vol: 0.5 }); }

    show(screen, arg) {
      if (screen === 'main' || screen === 'ingame' || screen === 'results') this.stack = [];
      else if (this.cur && this.cur !== screen) this.stack.push(this.cur);
      this.render(screen, arg);
    }

    render(screen, arg) {
      this.cur = screen;
      this.arg = arg;
      this.el.style.display = 'flex';
      this.el.className = 'q3-layer q3-menu q3-s-' + screen + (this.ui.mode === 'paused' ? ' q3-over' : '');
      this.previewModel = null;
      this.logo = null;
      const fn = this['s_' + screen];
      if (fn) fn.call(this, arg);
      this.el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { this.sound('menu_ok'); this.show(b.dataset.go); }));
      this.el.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { this.sound('menu_ok'); this.back(); }));
      this.el.querySelectorAll('.q3-item, .q3-btn, .q3-shotwrap, .q3-skill, .q3-row, .q3-tab, .q3-mod').forEach(b => b.addEventListener('mouseenter', () => this.sound('menu')));
    }

    redraw(arg) { this.render(this.cur, arg); }

    hide() { this.el.style.display = 'none'; this.el.innerHTML = ''; this.cur = null; this.logo = null; this.previewModel = null; }

    back() {
      if (this.cur === 'ingame') { this.ui.resume(); return; }
      if (this.cur === 'main') { this.show('exit'); return; }
      const prev = this.stack.pop();
      if (prev) this.render(prev);
      else if (this.ui.mode === 'paused') this.render('ingame');
      else this.render('main');
    }

    key(e) {
      if (e.code === 'Enter' && this.cur === 'sp') { const b = this.el.querySelector('.q3-fight'); if (b) b.click(); }
    }

    dialog(title, text, buttons) {
      const d = document.createElement('div');
      d.className = 'q3-dialog';
      d.innerHTML = `<div class="q3-dlg"><div class="q3-dlg-t">${esc(title)}</div><div class="q3-dlg-x">${esc(text)}</div><div class="q3-dlg-b">${(buttons || [{ t: 'OK' }]).map((b, i) => `<span class="q3-btn" data-i="${i}">${esc(b.t)}</span>`).join('')}</div></div>`;
      this.el.style.display = 'flex';
      this.el.appendChild(d);
      d.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => {
        this.sound('menu_ok');
        d.remove();
        const bt = (buttons || [{ t: 'OK' }])[Number(b.dataset.i)];
        if (bt && bt.fn) bt.fn();
      }));
    }

    frame(dt) {
      const ui = this.ui, r = ui.r;
      if (this.logo) this.logo.draw();
      if (!r) return;
      if (this.shotQueue.length && !this.shotBusy) this.makeNextShot();
      if (ui.mode === 'paused') {
        if (ui.game && ui.lastView) ui.scene.draw(ui.game, ui.fx, ui.lastView, { time: ui.time, alpha: 1, hide: ui.lastView.hide });
        return;
      }
      r.begin();
      if (this.cur === 'main' || this.cur === 'exit') {
        const view = { pos: [-330, 0, 64], yaw: 0, pitch: 0.2, w: r.cv.width, h: r.cv.height, fov: 70 };
        const cam = r.camera(view);
        r.beginModels(cam, [{ pos: [-160, -90, 80], r: 420, col: [0.9, 0.2, 0.15] }], view.pos);
        let m = M4.translate(M4.ident(), 0, 0, 8);
        m = M4.rotZ(m, Math.sin(ui.time * 0.25) * 0.5);
        m = M4.scale(m, 2.05, 2.05, 2.05);
        r.drawMesh(Q.emblemMesh(), m, { amb: [0.2, 0.04, 0.03], dcol: [1.25, 0.45, 0.35], dir: Q.vnorm([-0.8, -0.3, 0.55]) }, { spec: 1.3, twoSided: true });
        r.endModels();
      }
      if (this.previewModel) {
        const box = this.el.querySelector('.q3-preview');
        if (box) {
          const rc = box.getBoundingClientRect(), rr = ui.view.getBoundingClientRect();
          const sx = r.cv.width / rr.width, sy = r.cv.height / rr.height;
          const x = (rc.left - rr.left) * sx, y = (rc.top - rr.top) * sy, w = rc.width * sx, h = rc.height * sy;
          if (w > 4 && h > 4) {
            r.viewportRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
            r.clearDepth();
            const proj = M4.persp(34 * Q.DEG, w / h, 1, 1000);
            const vm = M4.view([-150, 0, 4], 0, 0.02, 0);
            r.beginModels({ vp: M4.mul(proj, vm) }, [], [-150, 0, 4]);
            const ch = Q.getCharacter(Q.BOTS[this.previewModel].look, null);
            const pose = [];
            Q.poseCharacter(ch, { pos: [0, 0, 0], yaw: ui.time * 0.7, legYaw: ui.time * 0.7, pitch: 0, t: ui.time, onGround: true, gestureT: (ui.time % 6) < 1.6 ? ui.time % 6 : 9 }, pose);
            const lit = { amb: [0.45, 0.42, 0.4], dcol: [0.9, 0.85, 0.8], dir: Q.vnorm([-0.6, 0.5, 0.6]) };
            for (const p of pose) r.drawMesh(p.mesh, p.m, lit, {});
            if (pose.weaponMatrix) r.drawMesh(Q.weaponMesh(Q.BOTS[this.previewModel].fav || 5), pose.weaponMatrix, lit, {});
            r.endModels();
            r.resetViewport();
          }
        }
      }
    }

    queueShots(maps) {
      for (const m of maps) if (!this.shots[m] && !this.shotQueue.includes(m) && Q.MAPS[m]) this.shotQueue.push(m);
    }

    makeNextShot() {
      const ui = this.ui, r = ui.r;
      const map = this.shotQueue.shift();
      if (!map || this.shots[map]) return;
      this.shotBusy = true;
      setTimeout(() => {
        try {
          const w = Q.loadWorld(map);
          const b = ui.getBake(map);
          r.loadWorld(w, b);
          ui.scene.setWorld(w);
          const def = Q.MAPS[map], ls = def.levelshot || { pos: w.intermission.pos, yaw: w.intermission.yaw / Q.DEG, pitch: w.intermission.pitch / Q.DEG };
          const W = r.cv.width, H = r.cv.height;
          r.resize(640, 480);
          const view = { pos: ls.pos, yaw: ls.yaw * Q.DEG, pitch: ls.pitch * Q.DEG, w: 640, h: 480, fov: 90 };
          const fx = new Q.FX(w, {});
          const keep = [r.bright, r.gamma, r.contrast], D = Q.UI_DEFAULTS;
          r.bright = D.brightness; r.gamma = D.gamma; r.contrast = D.contrast;
          ui.scene.draw(null, fx, view, { time: 3 });
          [r.bright, r.gamma, r.contrast] = keep;
          const c = document.createElement('canvas');
          c.width = 320; c.height = 240;
          c.getContext('2d').drawImage(r.cv, 0, 0, 320, 240);
          this.shots[map] = c.toDataURL('image/jpeg', 0.82);
          r.resize(W, H);
          r.freeWorld();
          try {
            const cache = JSON.parse(localStorage.getItem(SHOT_KEY) || '{}');
            cache[map + ':' + Q.hash(def.build.toString())] = this.shots[map];
            localStorage.setItem(SHOT_KEY, JSON.stringify(cache));
          } catch (e) { }
          this.el.querySelectorAll(`[data-shot="${map}"]`).forEach(img => { img.style.backgroundImage = `url(${this.shots[map]})`; img.classList.add('ready'); });
        } catch (err) { console.error(err); }
        this.shotBusy = false;
      }, 20);
    }

    portrait(botKey) {
      if (this.portraits[botKey]) return this.portraits[botKey];
      const ui = this.ui, r = ui.r;
      if (!r || !Q.BOTS[botKey]) return '';
      try {
        const W = r.cv.width, H = r.cv.height;
        if (W < 64 || H < 64) return '';
        const look = Q.BOTS[botKey].look;
        const ch = Q.getCharacter(look, null);
        const orbb = look.arch === 'orbb';
        r.viewportRect(0, 0, 64, 64);
        const gl = r.gl;
        gl.clearColor(0.1, 0.02, 0.02, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearColor(0, 0, 0, 1);
        r.resetViewport();
        ui.scene.drawIcon(orbb ? ch.parts.torso : ch.parts.head, 0, 0, 64, 64, Math.PI + 0.35, { dist: orbb ? 100 : 40, fov: 30 * Q.DEG, z: orbb ? 10 : ch.d.headH * 0.5, pitch: 0.05 });
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        c.getContext('2d').drawImage(r.cv, 0, 0, 64, 64, 0, 0, 64, 64);
        this.portraits[botKey] = c.toDataURL('image/png');
        return this.portraits[botKey];
      } catch (e) { return ''; }
    }

    port(botKey, label) {
      const src = this.portrait(botKey);
      return `<div class="q3-port" data-bot="${botKey}">${src ? `<img src="${src}" alt="">` : '<div class="q3-noimg"></div>'}<span>${esc(label || Q.BOTS[botKey].name)}</span></div>`;
    }

    shotBox(map, extra) {
      const s = this.shots[map];
      return `<div class="q3-shot ${s ? 'ready' : ''} ${extra || ''}" data-shot="${map}" data-map="${map}" style="${s ? `background-image:url(${s})` : ''}"><span class="q3-shot-n">${esc(Q.MAPS[map] ? Q.MAPS[map].name : map)}</span></div>`;
    }

    s_main() {
      const mod = Q.MODS.find(m => m.id === this.ui.o.mod);
      this.el.innerHTML = `
        <canvas class="q3-logo"></canvas>
        <div class="q3-main-items">
          <div class="q3-item" data-go="sp">SINGLE PLAYER</div>
          <div class="q3-item" data-go="servers">MULTIPLAYER</div>
          <div class="q3-item" data-go="setup">SETUP</div>
          <div class="q3-item" data-go="demos">DEMOS</div>
          <div class="q3-item" data-go="cinematics">CINEMATICS</div>
          <div class="q3-item" data-m="ta">TEAM ARENA</div>
          <div class="q3-item" data-go="mods">MODS</div>
          <div class="q3-item" data-go="exit">EXIT</div>
        </div>
        ${mod && mod.id !== 'baseq3' ? `<div class="q3-curmod">MOD: ${esc(mod.name)}</div>` : ''}
        ${this.ui.glError ? `<div class="q3-glerr">OpenGL could not be initialized: ${esc(this.ui.glError)}</div>` : ''}
        <div class="q3-copy">Quake III Arena(c) 1999-2000, Id Software, Inc.  All Rights Reserved</div>`;
      this.logo = new FireLogo(this.el.querySelector('.q3-logo'));
      this.el.querySelector('[data-m=ta]').addEventListener('click', () => {
        this.sound('menu_ok');
        this.dialog('TEAM ARENA', 'QUAKE III: TEAM ARENA is not installed. The mission pack requires the Team Arena CD.');
      });
      this.queueShots(Q.ARENAS.map(a => a.map));
    }

    s_exit() {
      this.s_main();
      this.el.querySelector('.q3-main-items').style.visibility = 'hidden';
      this.dialog('EXIT GAME?', '', [{ t: 'YES', fn: () => this.ui.exit() }, { t: 'NO', fn: () => this.show('main') }]);
    }

    tierUnlocked(n) {
      if (n <= 1) return true;
      const prev = Q.TIERS[n - 2];
      return prev.maps.every(m => this.ui.profile.sp[m]);
    }

    mapUnlocked(map) {
      const a = Q.arena(map);
      if (!this.tierUnlocked(a.tier)) return false;
      if (a.type !== 'tourney') return true;
      const t = Q.TIERS[a.tier - 1];
      return t.maps.filter(m => m !== map).every(m => this.ui.profile.sp[m]);
    }

    s_sp() {
      const ui = this.ui;
      const tier = Q.TIERS[this.selTier - 1];
      const unlocked = this.tierUnlocked(tier.n);
      if (!this.selMap || !tier.maps.includes(this.selMap)) this.selMap = tier.maps.find(m => this.mapUnlocked(m) && !ui.profile.sp[m]) || tier.maps[0];
      const a = Q.arena(this.selMap);
      const skill = ui.o.skill;
      this.el.innerHTML = `
        <div class="q3-title">SINGLE PLAYER</div>
        <div class="q3-tierbar"><span class="q3-arrow ${this.selTier > 1 ? '' : 'off'}" data-t="-1">&#9664;</span><span class="q3-tier">TIER ${tier.n} &mdash; ${tier.name.toUpperCase()}</span><span class="q3-arrow ${this.selTier < Q.TIERS.length ? '' : 'off'}" data-t="1">&#9654;</span></div>
        <div class="q3-shots">${tier.maps.map(m => {
          const ok = this.mapUnlocked(m);
          const done = ui.profile.sp[m];
          return `<div class="q3-shotwrap ${m === this.selMap ? 'sel' : ''} ${ok ? '' : 'locked'}" data-pick="${m}">${this.shotBox(m)}<div class="q3-shot-id">${m.toUpperCase()}</div>${done ? `<div class="q3-done" title="${esc(Q.SKILLS[done - 1])}">${done}</div>` : ''}${ok ? '' : '<div class="q3-lock">LOCKED</div>'}</div>`;
        }).join('')}</div>
        ${unlocked ? '' : `<div class="q3-note">Complete Tier ${tier.n - 1} to unlock this tier.</div>`}
        <div class="q3-brief">
          <div class="q3-brief-map">${esc(this.selMap.toUpperCase())}: ${esc(Q.MAPS[this.selMap].name.toUpperCase())}</div>
          <div class="q3-brief-info">${a.type === 'tourney' ? 'TOURNAMENT' : 'FREE FOR ALL'} &nbsp;&middot;&nbsp; FRAGLIMIT ${a.fraglimit} &nbsp;&middot;&nbsp; TIMELIMIT ${a.timelimit}</div>
          <div class="q3-opps">${a.bots.map(b => this.port(b)).join('')}</div>
        </div>
        <div class="q3-skills">${Q.SKILLS.map((s, i) => `<span class="q3-skill ${i === skill ? 'sel' : ''}" data-sk="${i}">${esc(s.toUpperCase())}</span>`).join('')}</div>
        <div class="q3-foot">
          <span class="q3-btn q3-backbtn" data-back>&#9664; BACK</span>
          <span class="q3-btn q3-small" data-m="reset">RESET GAME</span>
          <span class="q3-btn q3-small" data-go="skirmish">CUSTOM SKIRMISH</span>
          <span class="q3-btn q3-fight ${this.mapUnlocked(this.selMap) ? '' : 'off'}">FIGHT &#9654;</span>
        </div>`;
      this.el.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => {
        const n = this.selTier + Number(b.dataset.t);
        if (n < 1 || n > Q.TIERS.length) return;
        this.sound('menu_ok');
        this.selTier = n; this.selMap = null;
        this.redraw();
      }));
      this.el.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
        this.sound('menu_ok');
        this.selMap = b.dataset.pick;
        this.redraw();
      }));
      this.el.querySelectorAll('[data-sk]').forEach(b => b.addEventListener('click', () => {
        this.sound('menu_ok');
        ui.o.skill = Number(b.dataset.sk);
        ui.saveProfile();
        this.el.querySelectorAll('[data-sk]').forEach(x => x.classList.toggle('sel', x === b));
      }));
      this.el.querySelector('[data-m=reset]').addEventListener('click', () => {
        this.dialog('RESET GAME?', 'This clears all single player progress.', [{ t: 'YES', fn: () => { ui.profile.sp = {}; ui.saveProfile(); this.selTier = 1; this.selMap = null; this.redraw(); } }, { t: 'NO' }]);
      });
      this.el.querySelector('.q3-fight').addEventListener('click', () => {
        if (!this.mapUnlocked(this.selMap)) return;
        this.sound('menu_ok');
        this.startArena(this.selMap);
      });
      this.queueShots(tier.maps);
    }

    startArena(map) {
      const ui = this.ui, a = Q.arena(map);
      const skill = ui.o.skill + 1;
      ui.startMatch({ map, gametype: a.type === 'tourney' ? 'tourney' : 'ffa', fraglimit: a.fraglimit, timelimit: a.timelimit, bots: a.bots.map(b => ({ bot: b, skill })), sp: a, skill, mod: 'baseq3' });
    }

    s_results(res) {
      const ui = this.ui;
      res = res || {};
      const a = Q.arena(res.map) || Q.ARENAS[0];
      const tier = Q.TIERS[a.tier - 1];
      const tierDone = tier.maps.every(m => ui.profile.sp[m]);
      const idx = tier.maps.indexOf(res.map);
      let next = null;
      if (res.win) {
        const all = Q.TIERS.flatMap(t => t.maps);
        next = all.find(m => this.mapUnlocked(m) && !ui.profile.sp[m]) || null;
      }
      const justDone = res.win && tierDone && idx === tier.maps.length - 1;
      const aw = ui.profile.awards;
      this.el.innerHTML = `
        <div class="q3-title">${res.win ? 'VICTORY' : 'DEFEAT'}</div>
        <div class="q3-res">
          ${this.shotBox(res.map, 'big')}
          <div class="q3-res-t">${esc(Q.MAPS[res.map] ? Q.MAPS[res.map].name : '')}</div>
          <div class="q3-res-s">${res.win ? 'Arena completed on ' + esc(Q.SKILLS[(res.skill || 1) - 1]) + '.' : 'You must finish first to complete the arena.'}</div>
          ${justDone ? `<div class="q3-res-tier">TIER ${tier.n} COMPLETE${Q.TIERS[tier.n] ? ' &mdash; TIER ' + (tier.n + 1) + ' UNLOCKED' : ''}</div>` : ''}
          <div class="q3-medals">${['excellent', 'impressive', 'gauntlet', 'accuracy', 'perfect', 'frags'].map(k => `<div class="q3-medal"><canvas width="48" height="48" data-medal="${k}"></canvas><span>${aw[k] || 0}</span></div>`).join('')}</div>
        </div>
        <div class="q3-foot">
          <span class="q3-btn q3-backbtn" data-go="main">&#9664; MENU</span>
          <span class="q3-btn q3-small" data-m="again">PLAY AGAIN</span>
          ${justDone ? '<span class="q3-btn q3-small" data-m="cine">WATCH CINEMATIC</span>' : ''}
          ${next ? '<span class="q3-btn q3-fight" data-m="next">NEXT ARENA &#9654;</span>' : '<span class="q3-btn q3-fight" data-go="sp">ARENAS &#9654;</span>'}
        </div>`;
      this.el.querySelectorAll('[data-medal]').forEach(c => Q.medalIcon(c.getContext('2d'), c.dataset.medal, 0, 0, 48));
      const again = this.el.querySelector('[data-m=again]');
      if (again) again.addEventListener('click', () => this.startArena(res.map));
      const nx = this.el.querySelector('[data-m=next]');
      if (nx) nx.addEventListener('click', () => { this.selMap = next; this.selTier = Q.arena(next).tier; this.startArena(next); });
      const cn = this.el.querySelector('[data-m=cine]');
      if (cn) cn.addEventListener('click', () => this.playCine(CINEMATICS.find(c => c.need === tier.n)));
      if (res.win) this.ui.say(justDone ? 'you_win' : 'excellent');
    }

    servers() {
      const day = Math.floor(Date.now() / 86400000);
      const rnd = Q.rng(day * 31 + (this.refresh || 0));
      const maps = Q.ARENAS.map(a => a.map);
      const list = [];
      for (let i = 0; i < 9; i++) {
        const map = maps[rnd.int(maps.length)];
        const gt = rnd() < 0.2 ? 'tourney' : rnd() < 0.35 ? 'team' : 'ffa';
        const max = gt === 'tourney' ? 2 : 8;
        const n = gt === 'tourney' ? 1 : 2 + rnd.int(max - 3);
        list.push({ name: SERVER_NAMES[(i + day) % SERVER_NAMES.length], map, gt, n, max, ping: 40 + rnd.int(320), seed: rnd.int(1e9), mod: rnd() < 0.15 ? 'instagib' : 'baseq3' });
      }
      return list.sort((a, b) => a.ping - b.ping);
    }

    s_servers() {
      const list = this.servers();
      this.selServer = this.selServer === undefined ? 0 : Math.min(this.selServer, list.length - 1);
      this.el.innerHTML = `
        <div class="q3-title">ARENA SERVERS</div>
        <div class="q3-srv-src">SERVERS: <b>INTERNET</b> &nbsp;&middot;&nbsp; GAME TYPE: <b>ALL</b> &nbsp;&middot;&nbsp; SORT BY: <b>PING</b></div>
        <div class="q3-table">
          <div class="q3-row q3-head"><span>SERVER NAME</span><span>MAP</span><span>PLAYERS</span><span>TYPE</span><span>PING</span></div>
          ${list.map((s, i) => `<div class="q3-row ${i === this.selServer ? 'sel' : ''}" data-srv="${i}"><span>${esc(s.name)}</span><span>${s.map}</span><span>${s.n}/${s.max}</span><span>${s.mod === 'instagib' ? 'INSTAGIB' : s.gt === 'ffa' ? 'FFA' : s.gt === 'team' ? 'TEAM DM' : 'TOURNEY'}</span><span class="${s.ping > 250 ? 'bad' : ''}">${s.ping}</span></div>`).join('')}
        </div>
        <div class="q3-note">Modem link detected: 56 Kbps. Fewer players, lower ping.</div>
        <div class="q3-foot">
          <span class="q3-btn q3-backbtn" data-back>&#9664; BACK</span>
          <span class="q3-btn q3-small" data-m="refresh">REFRESH</span>
          <span class="q3-btn q3-small" data-go="skirmish">CREATE</span>
          <span class="q3-btn q3-fight">FIGHT &#9654;</span>
        </div>`;
      this.el.querySelectorAll('[data-srv]').forEach(r => {
        r.addEventListener('click', () => { this.selServer = Number(r.dataset.srv); this.el.querySelectorAll('[data-srv]').forEach(x => x.classList.toggle('sel', x === r)); });
        r.addEventListener('dblclick', () => this.join(list[Number(r.dataset.srv)]));
      });
      this.el.querySelector('[data-m=refresh]').addEventListener('click', () => { this.refresh = (this.refresh || 0) + 1; this.redraw(); });
      this.el.querySelector('.q3-fight').addEventListener('click', () => this.join(list[this.selServer]));
    }

    join(s) {
      if (!s) return;
      const rnd = Q.rng(s.seed);
      const keys = Object.keys(Q.BOTS);
      const bots = [];
      const nicks = HUMAN_NICKS.slice();
      for (let i = 0; i < s.n; i++) {
        const k = keys[rnd.int(keys.length)];
        const nick = nicks.splice(rnd.int(nicks.length), 1)[0];
        bots.push({ bot: k, skill: 2 + rnd.int(3), name: nick, ping: 30 + rnd.int(300), team: s.gt === 'team' ? (i % 2 ? 'red' : 'blue') : null });
      }
      this.ui.startMatch({ map: s.map, gametype: s.gt, fraglimit: s.gt === 'tourney' ? 10 : 20, timelimit: 15, bots, mod: s.mod, serverName: s.name, team: s.gt === 'team' ? 'red' : null });
    }

    s_skirmish() {
      const k = this.skirm;
      const botOpts = sel => Object.keys(Q.BOTS).map(b => `<option value="${b}" ${b === sel ? 'selected' : ''}>${esc(Q.BOTS[b].name)}</option>`).join('');
      this.el.innerHTML = `
        <div class="q3-title">START SERVER</div>
        <div class="q3-skirm">
          <div class="q3-mapgrid">${Q.ARENAS.map(a => `<div class="q3-shotwrap ${a.map === k.map ? 'sel' : ''}" data-pick="${a.map}">${this.shotBox(a.map)}<div class="q3-shot-id">${a.map.toUpperCase()}</div></div>`).join('')}</div>
          <div class="q3-form">
            <label>GAME TYPE <select data-f="gametype">${Object.entries(Q.GAMETYPES).map(([id, n]) => `<option value="${id}" ${id === k.gametype ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label>FRAG LIMIT <input data-f="fraglimit" type="number" min="0" max="200" value="${k.fraglimit}"></label>
            <label>TIME LIMIT <input data-f="timelimit" type="number" min="0" max="60" value="${k.timelimit}"></label>
            ${k.gametype === 'team' ? `<label>YOUR TEAM <select data-f="team"><option value="red" ${k.team === 'red' ? 'selected' : ''}>RED</option><option value="blue" ${k.team === 'blue' ? 'selected' : ''}>BLUE</option></select></label>` : ''}
            <div class="q3-sub">BOTS</div>
            ${k.bots.map((b, i) => `<div class="q3-botrow"><select data-b="${i}">${botOpts(b.bot)}</select><select data-s="${i}">${Q.SKILLS.map((s, j) => `<option value="${j + 1}" ${j + 1 === b.skill ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>${k.gametype === 'team' ? `<select data-tm="${i}"><option value="red" ${b.team === 'red' ? 'selected' : ''}>RED</option><option value="blue" ${b.team !== 'red' ? 'selected' : ''}>BLUE</option></select>` : ''}<span class="q3-x" data-rm="${i}">&times;</span></div>`).join('')}
            ${k.bots.length < 7 ? '<span class="q3-btn q3-small" data-m="add">+ ADD BOT</span>' : ''}
            <div class="q3-note">MOD: ${esc((Q.MODS.find(m => m.id === this.ui.o.mod) || Q.MODS[0]).name)}</div>
          </div>
        </div>
        <div class="q3-foot">
          <span class="q3-btn q3-backbtn" data-back>&#9664; BACK</span>
          <span class="q3-btn q3-fight">FIGHT &#9654;</span>
        </div>`;
      const redraw = () => this.redraw();
      this.el.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { this.sound('menu_ok'); k.map = b.dataset.pick; redraw(); }));
      this.el.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('change', () => {
        const f = inp.dataset.f;
        k[f] = f === 'fraglimit' || f === 'timelimit' ? Q.clamp(Number(inp.value) || 0, 0, 200) : inp.value;
        if (f === 'gametype') { if (k.gametype === 'team') k.bots.forEach((b, i) => { b.team = i % 2 ? k.team : (k.team === 'red' ? 'blue' : 'red'); }); redraw(); }
      }));
      this.el.querySelectorAll('[data-b]').forEach(s => s.addEventListener('change', () => { k.bots[Number(s.dataset.b)].bot = s.value; }));
      this.el.querySelectorAll('[data-s]').forEach(s => s.addEventListener('change', () => { k.bots[Number(s.dataset.s)].skill = Number(s.value); }));
      this.el.querySelectorAll('[data-tm]').forEach(s => s.addEventListener('change', () => { k.bots[Number(s.dataset.tm)].team = s.value; }));
      this.el.querySelectorAll('[data-rm]').forEach(s => s.addEventListener('click', () => { k.bots.splice(Number(s.dataset.rm), 1); redraw(); }));
      const add = this.el.querySelector('[data-m=add]');
      if (add) add.addEventListener('click', () => {
        const used = new Set(k.bots.map(b => b.bot));
        const free = Object.keys(Q.BOTS).find(b => !used.has(b)) || 'sarge';
        k.bots.push({ bot: free, skill: 3, team: k.bots.length % 2 ? 'red' : 'blue' });
        redraw();
      });
      this.el.querySelector('.q3-fight').addEventListener('click', () => {
        this.sound('menu_ok');
        if (k.gametype === 'tourney') k.bots = k.bots.slice(0, 1);
        this.ui.startMatch({ map: k.map, gametype: k.gametype, fraglimit: k.fraglimit, timelimit: k.timelimit, bots: k.bots.map(b => ({ bot: b.bot, skill: b.skill, team: k.gametype === 'team' ? b.team || 'blue' : null })), team: k.gametype === 'team' ? k.team : null, mod: this.ui.o.mod });
      });
      this.queueShots(Q.ARENAS.map(a => a.map));
    }

    s_setup(tab) {
      const ui = this.ui, o = ui.o;
      tab = tab || this.setupTab || 'player';
      this.setupTab = tab;
      const tabs = [['player', 'PLAYER'], ['controls', 'CONTROLS'], ['system', 'SYSTEM'], ['game', 'GAME OPTIONS'], ['sound', 'SOUND'], ['defaults', 'DEFAULTS']];
      const chk = (k, label) => `<label class="q3-chk"><input type="checkbox" data-o="${k}" ${o[k] ? 'checked' : ''}> ${label}</label>`;
      const rng = (k, label, min, max, step) => `<label>${label} <input type="range" data-o="${k}" min="${min}" max="${max}" step="${step}" value="${o[k]}"><em data-v="${k}">${o[k]}</em></label>`;
      const sel = (k, label, opts) => `<label>${label} <select data-o="${k}">${opts.map(([v, n]) => `<option value="${v}" ${String(o[k]) === String(v) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
      let body = '';
      if (tab === 'player') {
        body = `<div class="q3-player">
          <div class="q3-form"><label>NAME <input data-o="name" maxlength="20" value="${esc(o.name)}"></label>
          <div class="q3-sub">MODEL</div>
          <div class="q3-models">${Object.keys(Q.BOTS).map(b => `<div class="q3-mod ${b === o.model ? 'sel' : ''}" data-model="${b}">${this.portrait(b) ? `<img src="${this.portrait(b)}" alt="">` : ''}<span>${esc(Q.BOTS[b].name)}</span></div>`).join('')}</div></div>
          <div class="q3-preview"></div>
          <div class="q3-mdesc">${esc(Q.BOTS[o.model] ? Q.BOTS[o.model].name.toUpperCase() : '')}<br><small>${esc(Q.BOTS[o.model] ? Q.BOTS[o.model].tag : '')}</small></div>
        </div>`;
      } else if (tab === 'controls') {
        body = `<div class="q3-form">${rng('sens', 'MOUSE SPEED', 1, 20, 0.5)}${chk('invert', 'INVERT MOUSE')}${chk('alwaysRun', 'ALWAYS RUN')}
          <div class="q3-keys">
            <div><b>W A S D</b> move</div><div><b>SPACE</b> jump</div><div><b>C / CTRL</b> crouch</div><div><b>SHIFT</b> walk</div>
            <div><b>MOUSE 1</b> attack</div><div><b>MOUSE 2 / E</b> zoom</div><div><b>1 - 9, WHEEL</b> weapons</div><div><b>Q</b> last weapon</div>
            <div><b>ENTER / F</b> use item</div><div><b>G</b> gesture</div><div><b>TAB</b> scores</div><div><b>~</b> console</div><div><b>F12</b> screenshot</div><div><b>ARROWS</b> turn / move</div>
          </div></div>`;
      } else if (tab === 'system') {
        body = `<div class="q3-form">${sel('video', 'VIDEO MODE', [['auto', 'Window size'], ['512', '512x384'], ['640', '640x480'], ['800', '800x600'], ['1024', '1024x768']])}
          ${sel('filter', 'TEXTURE FILTER', [['nearest', 'Nearest'], ['bilinear', 'Bilinear'], ['trilinear', 'Trilinear']])}
          ${rng('brightness', 'BRIGHTNESS', 0.6, 1.8, 0.05)}${rng('gamma', 'GAMMA', 0.6, 2.4, 0.05)}${rng('contrast', 'CONTRAST', 0.6, 1.6, 0.05)}${chk('dlights', 'DYNAMIC LIGHTS')}${chk('marks', 'MARKS ON WALLS')}${chk('brass', 'EJECTING BRASS')}${chk('fps', 'DRAW FPS')}
          <div class="q3-note">GL_RENDERER: ${esc(this.glName())}</div></div>`;
      } else if (tab === 'game') {
        body = `<div class="q3-form">
          <label>CROSSHAIR <span class="q3-xhairs">${[1, 2, 3, 4, 5, 6, 7].map(n => `<canvas width="32" height="32" data-xh="${n}" class="${o.crosshair === n ? 'sel' : ''}"></canvas>`).join('')}</span></label>
          ${rng('crosshairSize', 'CROSSHAIR SIZE', 12, 48, 2)}${rng('fov', 'FIELD OF VIEW', 70, 120, 1)}
          ${chk('drawGun', 'DRAW GUN')}${chk('identify', 'IDENTIFY TARGET')}${chk('autoswitch', 'AUTOSWITCH WEAPONS')}${chk('timer', 'DRAW TIMER')}${chk('botChat', 'BOT CHAT')}${chk('blood', 'BLOOD AND GIBS')}</div>`;
      } else if (tab === 'sound') {
        body = `<div class="q3-form">${rng('sfx', 'EFFECTS VOLUME', 0, 1, 0.05)}${rng('music', 'MUSIC VOLUME', 0, 1, 0.05)}${chk('voice', 'ANNOUNCER VOICE')}</div>`;
      } else {
        body = `<div class="q3-form"><div class="q3-note">Reset all settings to their defaults? Single player progress is kept.</div><span class="q3-btn q3-small" data-m="defaults">SET TO DEFAULTS</span></div>`;
      }
      this.el.innerHTML = `
        <div class="q3-title">SETUP</div>
        <div class="q3-setup"><div class="q3-tabs">${tabs.map(([id, n]) => `<div class="q3-tab ${id === tab ? 'sel' : ''}" data-tab="${id}">${n}</div>`).join('')}</div><div class="q3-panel">${body}</div></div>
        <div class="q3-foot"><span class="q3-btn q3-backbtn" data-back>&#9664; BACK</span></div>`;
      if (tab === 'player') this.previewModel = o.model;
      this.el.querySelectorAll('[data-tab]').forEach(t => t.addEventListener('click', () => { this.sound('menu_ok'); this.redraw(t.dataset.tab); }));
      this.el.querySelectorAll('[data-o]').forEach(inp => {
        const ev = inp.type === 'range' || inp.tagName === 'INPUT' && inp.type !== 'checkbox' ? 'input' : 'change';
        inp.addEventListener(ev, () => {
          const k = inp.dataset.o;
          if (inp.type === 'checkbox') o[k] = inp.checked;
          else if (inp.type === 'range') { o[k] = Number(inp.value); const v = this.el.querySelector(`[data-v="${k}"]`); if (v) v.textContent = inp.value; }
          else o[k] = k === 'name' ? inp.value.slice(0, 20) || 'UnnamedPlayer' : inp.value;
          ui.applySettings();
        });
      });
      this.el.querySelectorAll('[data-model]').forEach(m => m.addEventListener('click', () => {
        this.sound('menu_ok');
        o.model = m.dataset.model;
        ui.applySettings();
        this.el.querySelectorAll('[data-model]').forEach(x => x.classList.toggle('sel', x === m));
        this.previewModel = o.model;
        const d = this.el.querySelector('.q3-mdesc');
        if (d) d.innerHTML = `${esc(Q.BOTS[o.model].name.toUpperCase())}<br><small>${esc(Q.BOTS[o.model].tag)}</small>`;
      }));
      this.el.querySelectorAll('[data-xh]').forEach(c => {
        const n = Number(c.dataset.xh);
        Q.drawCrosshair(c.getContext('2d'), n, 16, 16, 22, '#ffffff');
        c.addEventListener('click', () => { o.crosshair = n; ui.applySettings(); this.el.querySelectorAll('[data-xh]').forEach(x => x.classList.toggle('sel', x === c)); });
      });
      const def = this.el.querySelector('[data-m=defaults]');
      if (def) def.addEventListener('click', () => {
        const keep = { name: o.name, model: o.model, skill: o.skill };
        Object.assign(o, Q.UI_DEFAULTS, keep);
        ui.applySettings();
        this.dialog('SETUP', 'Settings restored to defaults.');
      });
    }

    glName() {
      const r = this.ui.r;
      if (!r) return 'none';
      try {
        const ext = r.gl.getExtension('WEBGL_debug_renderer_info');
        return ext ? r.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : r.gl.getParameter(r.gl.RENDERER);
      } catch (e) { return 'OpenGL'; }
    }

    s_demos() {
      const ui = this.ui;
      const list = ui.listDemos();
      const builtin = [
        { name: 'DEMO001', desc: 'The Camping Grounds — Orbb, Bitterman, Grunt, Daemia', d: { map: 'q3dm6', gametype: 'ffa', fraglimit: 20, timelimit: 0, seed: 1999, mod: 'baseq3', warmup: 0, bots: [{ bot: 'orbb', skill: 4 }, { bot: 'bitterman', skill: 4 }, { bot: 'grunt', skill: 4 }, { bot: 'daemia', skill: 5 }], limit: 180 } },
        { name: 'DEMO002', desc: 'The Proving Grounds — Hunter vs Klesk', d: { map: 'q3tourney2', gametype: 'tourney', fraglimit: 10, timelimit: 0, seed: 2000, mod: 'baseq3', warmup: 0, bots: [{ bot: 'hunter', skill: 5 }, { bot: 'klesk', skill: 5 }], limit: 180 } }
      ];
      this.selDemo = this.selDemo || 0;
      const rows = builtin.map(b => ({ name: b.name, desc: b.desc, d: b.d, built: true })).concat(list.map((d, i) => ({ name: 'DEMO' + String(i + 3).padStart(3, '0'), desc: `${Q.MAPS[d.map] ? Q.MAPS[d.map].name : d.map} — ${new Date(d.date).toLocaleString()} — ${Q.fmtTime((d.len || 0) / 60)}`, d, idx: i })));
      this.el.innerHTML = `
        <div class="q3-title">DEMOS</div>
        <div class="q3-list">${rows.map((r, i) => `<div class="q3-row ${i === this.selDemo ? 'sel' : ''}" data-d="${i}"><span class="q3-dn">${esc(r.name)}</span><span>${esc(r.desc)}</span></div>`).join('')}</div>
        <div class="q3-note">Your last matches are recorded automatically.</div>
        <div class="q3-foot">
          <span class="q3-btn q3-backbtn" data-back>&#9664; BACK</span>
          <span class="q3-btn q3-small" data-m="del">DELETE</span>
          <span class="q3-btn q3-fight">PLAY &#9654;</span>
        </div>`;
      this.el.querySelectorAll('[data-d]').forEach(r => {
        r.addEventListener('click', () => { this.selDemo = Number(r.dataset.d); this.el.querySelectorAll('[data-d]').forEach(x => x.classList.toggle('sel', x === r)); });
        r.addEventListener('dblclick', () => ui.playDemo(rows[Number(r.dataset.d)].d));
      });
      this.el.querySelector('[data-m=del]').addEventListener('click', () => {
        const r = rows[this.selDemo];
        if (!r || r.built) { this.dialog('DEMOS', 'Built-in demos cannot be deleted.'); return; }
        ui.deleteDemo(r.idx);
        this.selDemo = 0;
        this.redraw();
      });
      this.el.querySelector('.q3-fight').addEventListener('click', () => { const r = rows[this.selDemo]; if (r) ui.playDemo(r.d); });
    }

    s_cinematics() {
      const ui = this.ui;
      this.selCine = this.selCine || 0;
      const ok = c => !c.need || Q.TIERS[c.need - 1].maps.every(m => ui.profile.sp[m]);
      this.el.innerHTML = `
        <div class="q3-title">CINEMATICS</div>
        <div class="q3-cines">${CINEMATICS.map((c, i) => `<div class="q3-item q3-cine ${ok(c) ? '' : 'off'} ${i === this.selCine ? 'sel' : ''}" data-c="${i}">${c.name}</div>`).join('')}</div>
        <div class="q3-note">Tier cinematics unlock when the tier is complete.</div>
        <div class="q3-foot"><span class="q3-btn q3-backbtn" data-back>&#9664; BACK</span><span class="q3-btn q3-fight">PLAY &#9654;</span></div>`;
      this.el.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => {
        const c = CINEMATICS[Number(b.dataset.c)];
        if (!ok(c)) return;
        this.selCine = Number(b.dataset.c);
        this.el.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('sel', x === b));
      }));
      this.el.querySelector('.q3-fight').addEventListener('click', () => { const c = CINEMATICS[this.selCine]; if (ok(c)) this.playCine(c); });
    }

    playCine(c) {
      if (!c) return;
      this.ui.startMatch({ map: c.map, gametype: 'ffa', fraglimit: 0, timelimit: 0, seed: 77, warmup: 0, bots: c.bots.map(b => ({ bot: b, skill: 4 })), spectate: true, demo: true, cine: c });
    }

    s_mods() {
      const ui = this.ui;
      this.selMod = this.selMod || ui.o.mod;
      this.el.innerHTML = `
        <div class="q3-title">MODS</div>
        <div class="q3-list">${Q.MODS.map(m => `<div class="q3-row ${m.id === this.selMod ? 'sel' : ''}" data-mod="${m.id}"><span class="q3-dn">${esc(m.name)}${m.id === ui.o.mod ? ' *' : ''}</span><span>${esc(m.desc)}</span></div>`).join('')}</div>
        <div class="q3-note">Mods change the rules of skirmish and multiplayer matches. Single player always uses Quake III Arena rules.</div>
        <div class="q3-foot"><span class="q3-btn q3-backbtn" data-back>&#9664; BACK</span><span class="q3-btn q3-fight">LOAD &#9654;</span></div>`;
      this.el.querySelectorAll('[data-mod]').forEach(r => r.addEventListener('click', () => { this.selMod = r.dataset.mod; this.el.querySelectorAll('[data-mod]').forEach(x => x.classList.toggle('sel', x === r)); }));
      this.el.querySelector('.q3-fight').addEventListener('click', () => {
        ui.o.mod = this.selMod;
        ui.saveProfile();
        this.sound('menu_ok');
        this.show('main');
      });
    }

    s_ingame() {
      const ui = this.ui, g = ui.game;
      const sk = ui.cfg && !ui.cfg.sp;
      this.el.innerHTML = `
        <div class="q3-ingame">
          <div class="q3-item" data-m="resume">RESUME GAME</div>
          ${sk ? '<div class="q3-item" data-m="addbot">ADD BOTS</div><div class="q3-item" data-m="rmbot">REMOVE BOTS</div>' : ''}
          <div class="q3-item" data-go="setup">SETUP</div>
          <div class="q3-item" data-m="restart">RESTART ARENA</div>
          <div class="q3-item" data-m="leave">LEAVE ARENA</div>
          <div class="q3-item" data-m="exit">EXIT GAME</div>
        </div>
        <div class="q3-igtitle">${esc(g ? Q.MAPS[g.mapId].name : '')}</div>`;
      const on = (k, fn) => { const b = this.el.querySelector(`[data-m=${k}]`); if (b) b.addEventListener('click', () => { this.sound('menu_ok'); fn(); }); };
      on('resume', () => ui.resume());
      on('restart', () => ui.startMatch(ui.cfg));
      on('leave', () => ui.leave());
      on('exit', () => this.dialog('EXIT GAME?', '', [{ t: 'YES', fn: () => ui.exit() }, { t: 'NO' }]));
      on('addbot', () => {
        const used = new Set(g.players.map(p => p.botKey));
        const free = Object.keys(Q.BOTS).filter(b => !used.has(b));
        const b = free[Math.floor(Math.random() * free.length)] || 'sarge';
        g.addPlayer({ bot: b, skill: ui.o.skill + 1 });
        g.emit({ t: 'print', text: Q.BOTS[b].name + ' entered the game' });
        this.dialog('ADD BOTS', Q.BOTS[b].name + ' entered the game.');
      });
      on('rmbot', () => {
        const b = g.players.filter(p => p.ai).pop();
        if (!b) return;
        g.removePlayer(b);
        this.dialog('REMOVE BOTS', b.name + ' left the game.');
      });
    }
  }
  Q.Menu = Menu;
})(globalThis.Quake3 = globalThis.Quake3 || {});
