(function (F) {
  'use strict';
  const TC = globalThis.TouchControls;

  const TUNE = {
    slider: { zone: { x: 0, y: 0.4, w: 0.5, h: 0.6 }, deadZone: 0.04 },
    slideMm: [10, 14, 18, 24, 30],
    tiltDeg: [15, 25, 35],
    tiltDead: 2,
    steerButtons: { size: 17, left: { left: 6, bottom: 6 }, right: { left: 28, bottom: 6 } },
    pedals: { at: { right: 4, bottom: 4 }, w: 46, h: 20, brake: 0.45, gas: 0.55 },
    hand: { size: 13, at: { right: 34, bottom: 27 } },
    event: { size: 14, at: { right: 6, bottom: 27 } },
    fix: { size: 12, at: { right: 22, bottom: 44 } },
    gearUp: { size: 11, at: { right: 52, bottom: 16 } },
    gearDown: { size: 11, at: { right: 52, bottom: 3 } },
    top: { size: 11, top: 3, first: 3, step: 13 },
    rewind: { size: 12, at: { right: 4, top: 3 } },
    look: { zone: { x: 0, y: 0, w: 1, h: 0.4 }, radPerMm: 0.02 },
    map: { k: 0.6, gapMm: 6, slopMm: 2 },
    photo: { stick: { x: 0.36, y: 0.42, w: 0.3, h: 0.58 }, look: { x: 0.34, y: 0, w: 0.66, h: 1 }, shoot: { size: 17, at: { right: 6, bottom: 6 } }, up: { size: 11, at: { right: 6, bottom: 38 } }, down: { size: 11, at: { right: 6, bottom: 26 } }, hide: { size: 10, at: { right: 20, top: 3 } }, pinchStep: 0.06, panelPx: 286 },
    hudMin: 0.75,
    haptic: { hitMs: 5, hitMax: 60, shift: 10, land: 25 },
    eventRange: 30,
    weakPhoneMB: 6000,
    presets: {
      phone: { gfx: 'high', res: 0, draw: 900, flora: 1, traffic: 1 },
      weak: { gfx: 'retro', res: 360, draw: 600, flora: 0, traffic: 0.5, fps: 30 }
    }
  };

  const ACTIONS = ['steer', 'throttle', 'brake', 'hand', 'rewind', 'camera', 'lookBack', 'photo', 'pause', 'event', 'fix', 'gearUp', 'gearDown', 'lights', 'horn', 'radio', 'reset', 'map', 'look'];
  const LAYOUT = {
    steer: 'slider|tilt|buttons', throttle: 'pedals:gas', brake: 'pedals:brake', hand: 'hand', rewind: 'rewind', camera: 'camera', lookBack: 'back', photo: 'photo',
    pause: 'pause', event: 'start', fix: 'fix', gearUp: 'up', gearDown: 'down', lights: 'more', horn: 'more', radio: 'more', reset: 'more', map: 'mapTap', look: 'lookArea'
  };

  class Touch {
    static wanted() { return !!(TC && TC.wanted()); }

    constructor(ui) {
      this.ui = ui;
      this.bridge = globalThis.Parohod98Game || null;
      if (this.bridge) ui.opts.onExit = () => this.bridge.exit();
      const tc = this.tc = TC.create({ className: 'fz-touch' });
      const T = TUNE;
      this.slider = tc.slider({ zone: T.slider.zone, fullMm: 18, deadZone: T.slider.deadZone, cls: 'fz-tslide' });
      this.left = tc.button({ label: '◀', at: T.steerButtons.left, size: T.steerButtons.size, cls: 'fz-tbtn' });
      this.right = tc.button({ label: '▶', at: T.steerButtons.right, size: T.steerButtons.size, cls: 'fz-tbtn' });
      this.lookArea = tc.look({ zone: T.look.zone });
      this.pedals = tc.pad({ at: T.pedals.at, w: T.pedals.w, h: T.pedals.h, cls: 'fz-tpedals', parts: [{ key: 'brake', label: 'ТОРМОЗ', flex: T.pedals.brake }, { key: 'gas', label: 'ГАЗ', flex: T.pedals.gas }] });
      this.hand = tc.button({ label: 'РУЧНИК', at: T.hand.at, size: T.hand.size, cls: 'fz-tbtn' });
      this.start = tc.button({ label: 'СТАРТ', sub: '', at: T.event.at, size: T.event.size, cls: 'fz-tbtn fz-tevent', onTap: () => ui.press('Enter') });
      this.fix = tc.button({ label: 'ЧИНИТЬ', at: T.fix.at, size: T.fix.size, cls: 'fz-tbtn' });
      this.up = tc.button({ label: '▲', at: T.gearUp.at, size: T.gearUp.size, cls: 'fz-tbtn', onTap: () => { ui.shiftUp = true; } });
      this.down = tc.button({ label: '▼', at: T.gearDown.at, size: T.gearDown.size, cls: 'fz-tbtn', onTap: () => { ui.shiftDown = true; } });
      const top = (label, i, o) => tc.button(Object.assign({ label, at: { left: T.top.first + i * T.top.step, top: T.top.top }, size: T.top.size, cls: 'fz-tbtn fz-ttop' }, o));
      this.pause = top('II', 0, { onTap: () => { if (this.canDrive()) ui.openPause(); } });
      this.camera = top('КАМ', 1, { onTap: () => ui.press('KeyC') });
      this.back = top('НАЗАД', 2, { onDown: () => { ui.keys.back = true; }, onUp: () => { ui.keys.back = false; } });
      this.photo = top('ФОТО', 3, { onTap: () => ui.openPhoto() });
      this.more = top('ЕЩЁ', 4, { onTap: () => this.moreList() });
      this.rewind = tc.button({ label: '◀◀', at: T.rewind.at, size: T.rewind.size, cls: 'fz-tbtn' });
      this.mapTap = { cx: 0, cy: 0, r: 0 };
      tc.onAny = () => ui.audio.unlock();
      this.zero = null;
      this.lastAngle = NaN;
      this.hinted = false;
      this.onLost = e => {
        e.preventDefault();
        setTimeout(() => location.reload(), 1500);
      };
      ui.view.addEventListener('webglcontextlost', this.onLost);
      ui.el.classList.add('fz-phone');
      this.backBtn = document.createElement('button');
      this.backBtn.type = 'button';
      this.backBtn.className = 'fz-tback';
      this.backBtn.textContent = '‹ Назад';
      this.backBtn.addEventListener('click', () => this.menuBack());
      ui.el.appendChild(this.backBtn);
      this.buildPhotoPad();
      this.onMapTap = e => {
        if (!this.canDrive() || !this.mapTap.r) return;
        if (Math.hypot(e.clientX - this.mapTap.cx, e.clientY - this.mapTap.cy) > this.mapTap.r) return;
        e.preventDefault();
        e.stopPropagation();
        ui.press('KeyM');
      };
      tc.layer.addEventListener('pointerdown', this.onMapTap, { capture: true });
      if (this.bridge) {
        globalThis.parohod98Back = () => this.backKey();
        globalThis.parohod98Pause = on => this.pauseApp(on);
      }
      this.injectStyle();
      this.applyScheme();
    }

    injectStyle() {
      if (document.getElementById('fz-touch-style')) return;
      const st = document.createElement('style');
      st.id = 'fz-touch-style';
      st.textContent = [
        '.fz-touch .tc-btn{background:rgba(12,14,20,.55);border:2px solid rgba(255,255,255,.75);font:italic 700 12px "Segoe UI","Trebuchet MS",Tahoma,Arial,sans-serif;letter-spacing:.3px}',
        '.fz-touch .fz-ttop{border-radius:10px;font-size:11px}',
        '.fz-touch .fz-tevent{border-color:#e6146e;background:rgba(230,20,110,.55)}',
        '.fz-touch .tc-btn small{font-size:9px;max-width:90%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
        '.fz-touch .tc-pad i{background:rgba(12,14,20,.5);border:2px solid rgba(255,255,255,.7);border-radius:12px;font:italic 700 15px "Segoe UI","Trebuchet MS",Tahoma,Arial,sans-serif}',
        '.fz-touch .tc-pad i:last-child{border-color:#3fc46a}',
        '.fz-touch .tc-pad i.on{background:rgba(255,255,255,.3)}',
        '.fz-touch .tc-stick{border:2px solid rgba(255,255,255,.6);background:rgba(12,14,20,.35)}',
        '.fz-touch .tc-track{background:rgba(12,14,20,.45);border:2px solid rgba(255,255,255,.6)}',
        '.fz-touch .tc-knob{background:#e6146e;border:2px solid #fff}',
        '.tc-hint.fz-touch div{background:rgba(12,14,20,.94);border-left:6px solid #e6146e}',
        '.tc-hint.fz-touch h3{font:italic 700 22px "Segoe UI","Trebuchet MS",Tahoma,Arial,sans-serif;color:#fff}',
        '.tc-hint.fz-touch button,.tc-list.fz-touch button{background:#e6146e;color:#fff;border:0;font-style:italic}',
        '.tc-list.fz-touch button:disabled{background:#555}'
      ].join('\n');
      document.head.appendChild(st);
    }

    settings() { return this.ui.settings(); }

    defaults(s) {
      if (s.tsteer == null) s.tsteer = 'slider';
      if (s.tslide == null) s.tslide = 18;
      if (s.ttilt == null) s.ttilt = 25;
      if (s.tauto == null) s.tauto = false;
      if (s.fps == null) s.fps = 0;
      if (this.bridge && s.tpreset === 'weak' && !s.tpresetV) {
        s.fps = TUNE.presets.weak.fps;
        s.tpresetV = 2;
      }
      if (this.bridge && !s.tpreset) {
        let mem = {};
        try { mem = JSON.parse(this.bridge.memory()) || {}; } catch (e) {}
        const weak = !!mem.lowRam || (mem.totalMB > 0 && mem.totalMB < TUNE.weakPhoneMB);
        Object.assign(s, TUNE.presets[weak ? 'weak' : 'phone']);
        s.tpreset = weak ? 'weak' : 'phone';
        s.tpresetV = 2;
        this.ui.applySettings();
      }
    }

    settingsRows() {
      return [
        ['Сенсорный экран', null],
        ['Руль', 'tsteer', ['slider', 'tilt', 'buttons'], v => ({ slider: 'Ползунок', tilt: 'Наклон телефона', buttons: 'Кнопки' })[v]],
        ['Ход ползунка до упора', 'tslide', TUNE.slideMm, v => v + ' мм'],
        ['Наклон до упора', 'ttilt', TUNE.tiltDeg, v => v + '°'],
        ['Автогаз', 'tauto', [false, true], v => v ? 'Вкл: газ нажат всегда' : 'Выкл'],
        ['Частота кадров', 'fps', [30, 60, 90, 120, 0], v => v ? v + ' кадров/с' : 'Как у экрана']
      ];
    }

    applyScheme() {
      const s = this.settings();
      this.defaults(s);
      const tc = this.tc;
      this.slider.fullMm = s.tslide;
      tc.setShown(this.slider, s.tsteer === 'slider');
      tc.setShown(this.left, s.tsteer === 'buttons');
      tc.setShown(this.right, s.tsteer === 'buttons');
      this.scheme = s.tsteer;
      this.fullMm = s.tslide;
      if (s.tsteer !== 'tilt') this.zero = null;
      tc.layout();
    }

    buildPhotoPad() {
      const ui = this.ui, P = TUNE.photo;
      const ptc = this.ptc = TC.create({ className: 'fz-touch fz-tphoto' });
      this.pStick = ptc.stick({ zone: P.stick, radiusMm: 10, deadZone: 0.1, cls: 'fz-tstick' });
      this.pLook = ptc.look({ zone: P.look });
      const key = (code, on) => { if (ui.photo) { if (on) ui.photo.held.add(code); else ui.photo.held.delete(code); } };
      this.pShoot = ptc.button({ label: 'СНЯТЬ', at: P.shoot.at, size: P.shoot.size, cls: 'fz-tbtn fz-tevent', onTap: () => ui.photo && ui.photo.shoot() });
      ptc.button({ label: 'ВЫШЕ', at: P.up.at, size: P.up.size, cls: 'fz-tbtn', onDown: () => key('KeyR', true), onUp: () => key('KeyR', false) });
      ptc.button({ label: 'НИЖЕ', at: P.down.at, size: P.down.size, cls: 'fz-tbtn', onDown: () => key('KeyF', true), onUp: () => key('KeyF', false) });
      this.pHide = ptc.button({ label: 'СКРЫТЬ', at: P.hide.at, size: P.hide.size, cls: 'fz-tbtn fz-ttop', onTap: () => { if (ui.photo) { ui.photo.toggleUi(); this.clipPhoto(ui.photo.bare); } } });
      const fingers = new Map();
      let pinch = null;
      const spread = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
      ptc.layer.addEventListener('pointerdown', e => {
        fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (fingers.size === 2 && ui.photo) pinch = { d: spread() };
      }, true);
      ptc.layer.addEventListener('pointermove', e => {
        if (!fingers.has(e.pointerId)) return;
        fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (!pinch || fingers.size < 2 || !ui.photo) return;
        const d = spread(), r = d / Math.max(1, pinch.d);
        if (Math.abs(r - 1) < P.pinchStep) return;
        ui.photo.wheel({ deltaY: r > 1 ? -100 : 100, shiftKey: true, preventDefault() {} });
        pinch.d = d;
      }, true);
      const lift = e => { fingers.delete(e.pointerId); if (fingers.size < 2) pinch = null; };
      ptc.layer.addEventListener('pointerup', lift, true);
      ptc.layer.addEventListener('pointercancel', lift, true);
      this.clipPhoto(false);
      ptc.show(false);
    }

    clipPhoto(bare) {
      const P = TUNE.photo, x = bare ? 0 : Math.max(P.stick.x, (P.panelPx + 8) / Math.max(1, window.innerWidth));
      this.ptc.layer.style.clipPath = bare ? '' : 'inset(0 0 0 ' + P.panelPx + 'px)';
      this.pStick.zone = Object.assign({}, P.stick, { x });
      this.pLook.zone = Object.assign({}, P.look, { x: bare ? 0 : x, w: 1 - (bare ? 0 : x) });
      this.ptc.layout();
    }

    updatePhoto() {
      const ui = this.ui, ph = ui.photo, top = ui.menus.top;
      const on = !!ph && !!top && top.isPhoto;
      if (on && !this.ptc.visible) this.clipPhoto(ph.bare);
      this.ptc.show(on);
      if (!on) return;
      const s = this.pStick, set = (code, v) => { if (v) ph.held.add(code); else ph.held.delete(code); };
      set('KeyW', s.y < -0.3); set('KeyS', s.y > 0.3); set('KeyA', s.x < -0.3); set('KeyD', s.x > 0.3);
      const d = this.ptc.takeLook(this.pLook);
      if (d.dx || d.dy) ph.drag(d.dx * TC.PX_PER_MM, d.dy * TC.PX_PER_MM);
    }

    menuBack() {
      const ui = this.ui;
      if (!ui.menuOpen) return;
      ui.menus.key({ code: 'Escape', key: 'Escape', preventDefault() {}, stopPropagation() {} });
    }

    bindMap(cv, scr, act) {
      const ui = this.ui, g = ui.game, fingers = new Map();
      let drag = null, pinch = null;
      const toCur = (x, y) => {
        const r = cv.getBoundingClientRect();
        scr.cur.x = scr.cx + (x - r.left - r.width / 2) / scr.zoom;
        scr.cur.z = scr.cz + (y - r.top - r.height / 2) / scr.zoom;
      };
      const spread = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
      cv.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse') return;
        e.preventDefault();
        try { cv.setPointerCapture(e.pointerId); } catch (err) {}
        fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (fingers.size === 1) drag = { x: e.clientX, y: e.clientY, cx: scr.cx, cz: scr.cz, moved: false };
        else { drag = null; pinch = { d: spread(), zoom: scr.zoom }; }
      });
      cv.addEventListener('pointermove', e => {
        if (!fingers.has(e.pointerId)) return;
        fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && fingers.size >= 2) { scr.zoom = F.clamp(pinch.zoom * spread() / Math.max(1, pinch.d), 0.12, 3); return; }
        if (!drag) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) > this.tc.mm(TUNE.map.slopMm)) drag.moved = true;
        if (drag.moved) { scr.cx = drag.cx - dx / scr.zoom; scr.cz = drag.cz - dy / scr.zoom; }
      });
      const lift = e => {
        if (!fingers.has(e.pointerId)) return;
        fingers.delete(e.pointerId);
        if (drag && !drag.moved) toCur(e.clientX, e.clientY);
        if (fingers.size < 2) pinch = null;
        if (!fingers.size) drag = null;
      };
      cv.addEventListener('pointerup', lift);
      cv.addEventListener('pointercancel', lift);
      const box = document.createElement('div');
      box.className = 'fz-tmapbtns';
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'quiet';
      clear.textContent = 'Убрать метку';
      clear.addEventListener('click', () => { g.setWaypoint(null); });
      const go = document.createElement('button');
      go.type = 'button';
      go.addEventListener('click', () => act());
      box.append(clear, go);
      scr.el.appendChild(box);
      const label = () => {
        if (!box.isConnected) return;
        const op = scr.hover && scr.hover.kind === 'op';
        const text = op ? 'Переместиться' : 'Метка';
        if (go.textContent !== text) go.textContent = text;
        clear.hidden = !g.waypoint;
        requestAnimationFrame(label);
      };
      requestAnimationFrame(label);
      label();
    }

    watchTyping() {
      if (this.typingBound) return;
      this.typingBound = true;
      const ui = this.ui;
      ui.el.addEventListener('focusin', e => { if (e.target && e.target.tagName === 'INPUT') ui.el.classList.add('fz-typing'); });
      ui.el.addEventListener('focusout', e => { if (e.target && e.target.tagName === 'INPUT') ui.el.classList.remove('fz-typing'); });
    }

    canDrive() {
      const ui = this.ui;
      return ui.mode === 'play' && !!ui.game && !ui.menuOpen && !ui.photo;
    }

    tilt() {
      if (!this.bridge || typeof this.bridge.tilt !== 'function') return NaN;
      const a = Number(this.bridge.tilt());
      return Number.isFinite(a) ? a : NaN;
    }

    level() {
      const a = this.tilt();
      if (Number.isFinite(a)) this.zero = a;
    }

    steerValue() {
      if (this.scheme === 'slider') return { steer: this.slider.value, analog: this.slider.active };
      if (this.scheme === 'buttons') return { steer: (this.right.down ? 1 : 0) - (this.left.down ? 1 : 0), analog: false };
      const a = this.tilt();
      this.lastAngle = a;
      if (!Number.isFinite(a)) return { steer: 0, analog: false };
      if (this.zero === null) this.zero = a;
      return { steer: TC.tiltSteer(a, this.zero, this.settings().ttilt, TUNE.tiltDead), analog: true };
    }

    merge(inp) {
      if (!this.tc.visible || this.tc.userHidden) return inp;
      const st = this.steerValue();
      if (st.analog || st.steer) {
        inp.steer = st.steer;
        inp.analog = st.analog;
      }
      const part = this.pedals.part;
      const stopGas = part === 'brake' || this.hand.down || this.rewind.down;
      if (part === 'gas' || (this.settings().tauto && !stopGas)) inp.thr = 1;
      if (part === 'brake') inp.brk = 1;
      if (this.hand.down) inp.hand = true;
      if (this.rewind.down) inp.rewind = true;
      if (this.fix.down) inp.fix = true;
      return inp;
    }

    hudLayout() {
      const ui = this.ui, w = ui.hud.w || window.innerWidth, h = ui.hud.h || window.innerHeight;
      const s = Math.min(1.25, Math.max(TUNE.hudMin, h / 720));
      const pr = this.pedals.el.getBoundingClientRect(), tr = this.pause.el.getBoundingClientRect(), root = ui.el.getBoundingClientRect();
      const lift = pr.height ? Math.max(0, root.bottom - pr.top + 6 - 30 * s) : 0;
      const topDy = tr.height ? Math.max(0, tr.bottom - root.top + 4 - 26 * s) : 0;
      const R = 88 * s * TUNE.map.k;
      const gap = this.tc.mm(TUNE.map.gapMm);
      const left = this.tc.prefs.left;
      const edge = pr.width ? (left ? pr.right - root.left : pr.left - root.left) : w * 0.62;
      const cx = left ? Math.max(edge + gap + R, w * 0.5 - R) : Math.min(edge - gap - R, w * 0.5 + R + gap);
      const cy = h - R - 30 * s * 0.5;
      const zone = this.tc.zoneRect(TUNE.slider.zone);
      const clash = this.scheme === 'slider' && cx + R > zone.x && cx - R < zone.x + zone.w;
      this.mapTap = { cx: root.left + cx, cy: root.top + cy, r: clash ? 0 : R };
      return { minScale: TUNE.hudMin, lift, topDy, map: { cx, cy, k: TUNE.map.k } };
    }

    update(dt) {
      const ui = this.ui, g = ui.game, driving = this.canDrive();
      this.tc.show(driving);
      this.watchTyping();
      const top = ui.menus.top;
      const ownExit = top && top.el && ['fz-results', 'fz-credits'].some(c => top.el.classList.contains(c));
      this.backBtn.classList.toggle('on', !!(ui.menuOpen && top && !top.isPhoto && !ownExit && !(ui.mode === 'title' && ui.menus.stack.length <= 1)));
      this.updatePhoto();
      const s = ui.settings();
      if (s.tsteer !== this.scheme || s.tslide !== this.fullMm || !s.tpreset && this.bridge) this.applyScheme();
      if (!driving || !g) return;
      const d = this.tc.takeLook(this.lookArea);
      if ((d.dx || d.dy) && ui.canLook()) {
        const k = TUNE.look.radPerMm * (s.msens || 1);
        ui.lookTurn(d.dx * k, -d.dy * k * (s.minv ? -1 : 1));
        ui.look.idle = 0;
      }
      const tc = this.tc, v = g.veh, dm = v.dmg;
      tc.setShown(this.rewind, g.canRewind());
      const ev = !g.race && g.nearestEvent(TUNE.eventRange);
      tc.setShown(this.start, !!ev);
      if (ev && this.eventId !== ev.id) {
        this.eventId = ev.id;
        const sub = this.start.el.querySelector('small');
        if (sub) sub.textContent = ev.name;
      }
      tc.setShown(this.fix, !!(dm && dm.mechOn && !dm.burning && !dm.burnt && dm.hp < F.DMG.TUNE.fixHp));
      tc.setShown(this.up, !s.auto);
      tc.setShown(this.down, !s.auto);
      if (!this.hinted) {
        this.hinted = true;
        tc.hint('forza', 'Управление', [
          'Руль: ' + ({ slider: 'палец на нижней левой части экрана ведите влево и вправо', tilt: 'наклоняйте телефон, ноль ставит «Ещё» → «Выровнять руль»', buttons: 'кнопки ◀ и ▶ слева' })[s.tsteer],
          'Справа педали: ГАЗ у края, ТОРМОЗ левее. Палец можно перекатывать, тормоз на месте включает задний ход',
          'РУЧНИК над тормозом, ◀◀ вверху справа — перемотка (держать)',
          'Палец на верхней части экрана — осмотреться, НАЗАД — смотреть назад',
          'СТАРТ появляется у события, ЧИНИТЬ — когда двигатель повреждён и машина стоит',
          'Касание мини-карты открывает карту, ЕЩЁ — фары, гудок, радио, эвакуатор',
          'Схему руля, ход ползунка и автогаз можно поменять в настройках'
        ], 'Понятно');
      }
    }

    moreList() {
      const ui = this.ui, g = ui.game;
      if (!g) return;
      const opts = [
        { value: 'lights', label: g.lightsOn ? 'Фары: выкл' : 'Фары: вкл' },
        { value: 'horn', label: 'Гудок' },
        { value: 'radio', label: 'Радио' },
        { value: 'map', label: 'Карта' },
        { value: 'reset', label: 'На дорогу' }
      ];
      if (this.scheme === 'tilt') opts.unshift({ value: 'level', label: 'Выровнять руль' });
      this.tc.choose(opts, v => {
        if (v === 'lights') ui.press('KeyL');
        else if (v === 'horn') ui.press('KeyH');
        else if (v === 'radio') ui.cycleRadio();
        else if (v === 'map') ui.press('KeyM');
        else if (v === 'reset') ui.press('Backspace');
        else if (v === 'level') this.level();
      });
    }

    event(e, g) {
      if (e.t === 'hit' || e.t === 'carhit') this.tc.vibrate(Math.min(TUNE.haptic.hitMax, Math.round((e.impact || 1) * TUNE.haptic.hitMs)));
      else if (e.t === 'land' && e.impact > 3) this.tc.vibrate(TUNE.haptic.land);
      else if (e.t === 'shift') this.tc.vibrate(TUNE.haptic.shift);
    }

    backKey() {
      const ui = this.ui;
      const list = document.querySelector('.tc-list');
      if (list) { list.remove(); return true; }
      if (ui.mode === 'title' && !ui.menuOpen) { this.bridge.exit(); return true; }
      if (ui.menuOpen || ui.mode === 'title') {
        ui.menus.key({ code: 'Escape', key: 'Escape', preventDefault() {}, stopPropagation() {} });
        return true;
      }
      if (ui.mode === 'play' && ui.game) { ui.openPause(); return true; }
      return true;
    }

    pauseApp(on) {
      const ui = this.ui;
      if (on) {
        if (this.canDrive()) ui.openPause();
        this.tc.release();
        ui.keys = {};
        ui.audio.suspend();
      } else ui.audio.resume();
    }

    destroy() {
      this.tc.destroy();
      this.ptc.destroy();
      this.backBtn.remove();
      this.ui.view.removeEventListener('webglcontextlost', this.onLost);
    }
  }

  Touch.TUNE = TUNE;
  Touch.ACTIONS = ACTIONS;
  Touch.LAYOUT = LAYOUT;
  Touch.tiltSteer = TC && TC.tiltSteer;
  F.Touch = Touch;
  if (typeof module !== 'undefined') module.exports = F;
})(globalThis.Forza = globalThis.Forza || {});
