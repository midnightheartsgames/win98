(function (N) {
  'use strict';
  const TC = globalThis.TouchControls;
  const DEG = Math.PI / 180;

  const TUNE = {
    stick: { radiusMm: 11, deadZone: 0.08, zone: { x: 0, y: 0.25, w: 0.45, h: 0.75 }, sprintOver: 1.25 },
    look: { zone: { x: 0.45, y: 0, w: 0.55, h: 1 }, radPerMm: 0.0036 },
    carLook: { zone: { x: 0.3, y: 0, w: 0.7, h: 0.38 } },
    fire: { size: 19, at: { right: 12, bottom: 10 } },
    aim: { size: 13, at: { right: 38, bottom: 6 } },
    jump: { size: 12, at: { right: 36, bottom: 25 } },
    enter: { size: 13, at: { right: 60, bottom: 36 } },
    reload: { size: 11, at: { right: 56, bottom: 22 } },
    cancel: { size: 11, at: { right: 56, bottom: 22 } },
    trip: { size: 12, at: { right: 52, top: 4 } },
    weapon: { size: 12, at: { right: 5, top: 17 } },
    pause: { size: 11, at: { left: 4, top: 4 } },
    cam: { size: 11, at: { left: 17, top: 4 } },
    slider: { zone: { x: 0, y: 0.4, w: 0.5, h: 0.6 }, fullMm: 18, deadZone: 0.04 },
    pedals: { at: { right: 4, bottom: 4 }, w: 46, h: 20, brake: 0.45, gas: 0.55 },
    hand: { size: 13, at: { right: 34, bottom: 27 } },
    exit: { size: 13, at: { right: 6, bottom: 27 } },
    horn: { size: 12, at: { right: 20, bottom: 27 } },
    behind: { size: 11, at: { right: 52, bottom: 32 } },
    driveby: { at: { right: 52, bottom: 18 }, w: 30, h: 12 },
    cannon: { size: 16, at: { right: 52, bottom: 6 } },
    mg: { size: 14, at: { right: 70, bottom: 6 } },
    radio: { size: 11, at: { left: 30, top: 4 } },
    side: { size: 11, at: { left: 43, top: 4 } },
    steerButtons: { size: 17, left: { left: 6, bottom: 6 }, right: { left: 28, bottom: 6 } },
    slideMm: [10, 14, 18, 24, 30],
    tiltDeg: [15, 25, 35],
    tiltDead: 2,
    autoSlot: 5,
    photo: { panelPx: 300, stick: { x: 0, y: 0.4, w: 0.34, h: 0.6 }, look: { x: 0, y: 0, w: 1, h: 1 }, shoot: { size: 15, at: { left: 36, bottom: 6 } }, up: { size: 11, at: { left: 36, bottom: 36 } }, down: { size: 11, at: { left: 36, bottom: 23 } }, hide: { size: 11, at: { left: 4, top: 4 } }, pinchStep: 0.1 },
    assist: [
      { cone: 0, speed: 0 },
      { cone: 6, speed: 10 },
      { cone: 10, speed: 20 }
    ],
    assistRange: 70,
    radar: { k: 0.7, gapMm: 4 },
    haptic: { shot: 8, heavy: 18, hurt: 35, every: 0.1 },
    weakPhoneMB: 6000,
    presets: {
      phone: { gfx: 'high', scale: 0.7, draw: 1, cars: 'high', city: 'high', traffic: 1, peds: 1 },
      weak: { gfx: 'low', scale: 0.4, draw: 0.5, cars: 'low', city: 'low', traffic: 0.5, peds: 0.5, fps: 30 }
    }
  };

  const ACTIONS = ['move', 'sprint', 'look', 'fire', 'aim', 'jump', 'enter', 'reload', 'weapon', 'throwCancel', 'skip', 'camera', 'pause', 'map'];
  const LAYOUT = { move: 'stick', sprint: 'stick', look: 'lookArea', fire: 'fire', aim: 'aim', jump: 'jump', enter: 'enter', reload: 'reload', weapon: 'weapon', throwCancel: 'cancel', skip: 'trip', camera: 'cam', pause: 'pause', map: 'radarTap' };
  const CAR_ACTIONS = ['steer', 'gas', 'brake', 'hand', 'exit', 'horn', 'behind', 'radio', 'driveby', 'cannon', 'mg', 'side', 'camera', 'pause', 'look'];
  const CAR_LAYOUT = { steer: 'slider', gas: 'pedals', brake: 'pedals', hand: 'hand', exit: 'exit', horn: 'horn', behind: 'behind', radio: 'radio', driveby: 'driveby', cannon: 'cannon', mg: 'mg', side: 'side', camera: 'cam', pause: 'pause', look: 'carLook' };
  const TEXTS = [
    ['W/S — газ и тормоз, A/D — руль, Пробел — ручник. F — выйти из машины.', 'Слева руль, справа педали, над тормозом РУЧНИК. ВЫЙТИ — выйти из машины.'],
    ['Мышь — обзор, левая кнопка — удар, правая — прицел. Q/E — смена оружия.', 'Правая половина экрана — обзор, ОГОНЬ — удар, ПРИЦЕЛ — прицел. Значок оружия — смена оружия.'],
    ['Правая кнопка — прицел, левая — выстрел. В прицеле Тёма стреляет точнее. R — перезарядка.', 'ПРИЦЕЛ — прицел, ОГОНЬ — выстрел. В прицеле Тёма стреляет точнее. R — перезарядка.'],
    ['Левая кнопка — удар. Кастет бьёт сильнее кулака. Упавшего добивать не обязательно.', 'ОГОНЬ — удар. Кастет бьёт сильнее кулака. Упавшего добивать не обязательно.'],
    ['Shift — бег. Догони и сбей с ног.', 'Палец за краем кольца стика — бег. Догони и сбей с ног.'],
    ['В любом такси нажми T, чтобы подрабатывать извозом.', 'В любом такси нажми РАБОТА, чтобы подрабатывать извозом.'],
    ['В милицейской машине нажми T — будешь ловить преступников.', 'В милицейской машине нажми РАБОТА — будешь ловить преступников.'],
    ['Правая кнопка — прицел СВД. Колесо мыши — кратность.', 'ПРИЦЕЛ — прицел СВД.'],
    ['В машине Q или E — посмотреть вбок, левая кнопка — стрелять из окна.', 'В машине кнопки ◄ и ► стреляют из окна влево и вправо.'],
    ['Колесо — масштаб · тяни мышью · Esc — назад', 'Щипок — масштаб · тяни пальцем · «Назад» — выйти'],
    ['Своей машины нет — подойди к любой и нажми F. Водителя Тёма вытащит сам.', 'Своей машины нет — подойди к любой и нажми СЕСТЬ. Водителя Тёма вытащит сам.'],
    ['В любом такси нажми T и подрабатывай извозом.', 'В любом такси нажми РАБОТА и подрабатывай извозом.'],
    ['С правой кнопкой мыши стрелять точнее. С СВД — ещё и видно дальше.', 'С ПРИЦЕЛОМ стрелять точнее. С СВД — ещё и видно дальше.'],
    ['В прыжке A и D кренят машину. Приземляйся на колёса, а не на крышу.', 'В прыжке руль кренит машину. Приземляйся на колёса, а не на крышу.'],
    ['Машина легла на бок? Качни её A или D. Перевёрнутая на крышу — загорится.', 'Машина легла на бок? Качни её рулём. Перевёрнутая на крышу — загорится.']
  ];
  const TEXT_RULES = [
    [/F8 — фотоаппарат\./, '«Фотоаппарат» в паузе.'],
    [/F8 или «Фотоаппарат»/, '«Фотоаппарат» в паузе'],
    [/\(Пробел\)/, '(ПРЫЖОК)'],
    [/Зажми левую кнопку:/, 'Держи ОГОНЬ:'],
    [/R — передумать\. G — [^.]*\./, '✕ — передумать.'],
    [/В вагоне F — сесть или встать, X — пропустить/, 'В вагоне кнопки: сесть или встать, X — пропустить'],
    [/мышь — смотреть по сторонам, C — камера/, 'палец — смотреть по сторонам, ВИД — камера'],
    [/F — выйти внизу, X — докрутить/, 'Кнопка внизу — выйти, X — докрутить'],
    [/мышь — прицел, ЛКМ — выстрел/, 'палец — прицел, ОГОНЬ — выстрел'],
    [/F — уйти от стойки/, 'кнопка — уйти от стойки']
  ];

  function touchText(text) {
    if (!text) return text;
    const whole = TEXTS.find(t => t[0] === text);
    if (whole) return whole[1];
    return TEXT_RULES.reduce((s, [re, to]) => s.replace(re, to), String(text));
  }

  const HEAVY = new Set(['shotgun', 'toz34', 'sks', 'svd', 'rpg7', 'pkm']);

  function threat(w, d) {
    if (!d || d.dead || d.isPlayer || d.friendly || d.kind !== 'ped') return false;
    if (d.ai && d.ai.target === w.player) return true;
    return !!(d.cop && w.wanted && w.wanted.level > 0);
  }

  function aimAssist(view, targets, level, dt, firing) {
    const t = TUNE.assist[Math.max(0, Math.min(TUNE.assist.length - 1, level | 0))];
    const out = { dyaw: 0, dpitch: 0, target: null, angle: Infinity };
    if (!t.cone) return out;
    let best = null;
    for (const g of targets) {
      const dx = g.x - view.x, dy = g.y - view.y, dz = g.z - view.z;
      const yawTo = Math.atan2(dx, -dz), pitchTo = Math.atan2(dy, Math.hypot(dx, dz));
      const ey = N.wrap(yawTo - view.yaw), ep = pitchTo - view.pitch;
      const ang = Math.hypot(ey * Math.cos(view.pitch), ep) / DEG;
      if (ang < out.angle) { out.angle = ang; best = { g, ey, ep }; }
    }
    if (!best || out.angle > t.cone || !firing) return out;
    const step = t.speed * DEG * dt;
    out.dyaw = Math.max(-step, Math.min(step, best.ey));
    out.dpitch = Math.max(-step, Math.min(step, best.ep));
    out.target = best.g;
    return out;
  }

  class Touch {
    static wanted() { return !!(TC && TC.wanted()); }

    constructor(ui) {
      this.ui = ui;
      this.bridge = globalThis.Parohod98Game || null;
      const s = ui.settings;
      if (s.touchSens == null) s.touchSens = 5;
      if (s.touchAim == null) s.touchAim = 2;
      if (s.fps == null) s.fps = 0;
      if (this.bridge && !s.tpreset) {
        let mem = {};
        try { mem = JSON.parse(this.bridge.memory()) || {}; } catch (e) {}
        const weak = !!mem.lowRam || (mem.totalMB > 0 && mem.totalMB < TUNE.weakPhoneMB);
        Object.assign(s, TUNE.presets[weak ? 'weak' : 'phone']);
        s.tpreset = weak ? 'weak' : 'phone';
        N.saveSettings(s);
      }
      if (s.tsteer == null) s.tsteer = 'slider';
      if (s.tslide == null) s.tslide = TUNE.slider.fullMm;
      if (s.ttilt == null) s.ttilt = 25;
      if (this.bridge) ui.opts.onExit = () => this.bridge.exit();
      N.touchUi = true;
      N.touchText = touchText;
      N.saveSlots = TUNE.autoSlot;
      ui.el.classList.add('nn-phone');
      this.stripRadio();
      const tc = this.tc = TC.create({ className: 'nn-touch' });
      const T = TUNE, mouse = ui.mouse;
      const press = k => { ui.pressed.add(k); };
      const hold = (k, on) => { if (on) ui.keys.add(k); else ui.keys.delete(k); };
      this.stick = tc.stick({ zone: T.stick.zone, radiusMm: T.stick.radiusMm, deadZone: T.stick.deadZone, cls: 'nn-tstick' });
      this.slider = tc.slider({ zone: T.slider.zone, fullMm: T.slider.fullMm, deadZone: T.slider.deadZone, cls: 'nn-tslide' });
      this.lookArea = tc.look({ zone: T.look.zone });
      this.carLook = tc.look({ zone: T.carLook.zone });
      this.pedals = tc.pad({ at: T.pedals.at, w: T.pedals.w, h: T.pedals.h, cls: 'nn-tpedals', parts: [{ key: 'brake', label: 'ТОРМОЗ', flex: T.pedals.brake }, { key: 'gas', label: 'ГАЗ', flex: T.pedals.gas }] });
      this.hand = tc.button({ label: 'РУЧНИК', at: T.hand.at, size: T.hand.size, cls: 'nn-tbtn' });
      this.exit = tc.button({ label: 'ВЫЙТИ', at: T.exit.at, size: T.exit.size, cls: 'nn-tbtn', onTap: () => press('enter') });
      this.left = tc.button({ label: '◀', at: T.steerButtons.left, size: T.steerButtons.size, cls: 'nn-tbtn' });
      this.right = tc.button({ label: '▶', at: T.steerButtons.right, size: T.steerButtons.size, cls: 'nn-tbtn' });
      this.horn = tc.button({ label: 'ГУДОК', at: T.horn.at, size: T.horn.size, cls: 'nn-tbtn', onDown: () => press('horn') });
      this.behind = tc.button({ label: 'НАЗАД', at: T.behind.at, size: T.behind.size, cls: 'nn-tbtn', onDown: () => hold('behind', true), onUp: () => hold('behind', false) });
      this.driveby = tc.pad({ at: T.driveby.at, w: T.driveby.w, h: T.driveby.h, cls: 'nn-tdrive', parts: [{ key: 'q', label: '◄ ОГОНЬ', flex: 1 }, { key: 'e', label: 'ОГОНЬ ►', flex: 1 }], onPart: key => {
        hold('q', key === 'q');
        hold('e', key === 'e');
        if (key && !mouse.l) mouse.lp = true;
        mouse.l = !!key;
      } });
      this.cannon = tc.button({ label: 'ПУШКА', at: T.cannon.at, size: T.cannon.size, cls: 'nn-tbtn nn-tfire', onDown: () => { mouse.lp = true; mouse.l = true; }, onUp: () => { mouse.l = false; } });
      this.mg = tc.button({ label: 'ПУЛЕМЁТ', at: T.mg.at, size: T.mg.size, cls: 'nn-tbtn', onDown: () => { mouse.r = true; }, onUp: () => { mouse.r = false; } });
      this.radio = tc.button({ label: 'РАДИО', at: T.radio.at, size: T.radio.size, cls: 'nn-tbtn nn-ttop', onTap: () => press('r'), onLong: () => this.radioList() });
      this.side = tc.button({ label: 'РАБОТА', at: T.side.at, size: T.side.size, cls: 'nn-tbtn nn-ttop', onTap: () => press('side') });
      this.fire = tc.button({ label: 'ОГОНЬ', at: T.fire.at, size: T.fire.size, look: this.lookArea, cls: 'nn-tbtn nn-tfire', onDown: () => { mouse.lp = true; mouse.l = true; ui.audio.init(); ui.audio.resume(); }, onUp: () => { mouse.l = false; } });
      this.aim = tc.button({ label: 'ПРИЦЕЛ', at: T.aim.at, size: T.aim.size, cls: 'nn-tbtn', onTap: () => { mouse.r = !mouse.r; this.aim.el.classList.toggle('lit', mouse.r); } });
      this.jump = tc.button({ label: 'ПРЫЖОК', at: T.jump.at, size: T.jump.size, cls: 'nn-tbtn', onDown: () => { press('space'); hold('space', true); }, onUp: () => hold('space', false) });
      this.enter = tc.button({ label: 'СЕСТЬ', at: T.enter.at, size: T.enter.size, cls: 'nn-tbtn nn-tenter', onTap: () => press('enter') });
      this.reload = tc.button({ label: 'R', sub: 'перезар.', at: T.reload.at, size: T.reload.size, cls: 'nn-tbtn', onTap: () => press('r') });
      this.cancel = tc.button({ label: '✕', sub: 'отмена', at: T.cancel.at, size: T.cancel.size, cls: 'nn-tbtn', onTap: () => press('r') });
      this.trip = tc.button({ label: 'X', sub: 'пропустить', at: T.trip.at, size: T.trip.size, cls: 'nn-tbtn', onTap: () => press('trip') });
      this.weapon = tc.button({ label: '', sub: '', at: T.weapon.at, size: T.weapon.size, cls: 'nn-tbtn nn-tweapon', onTap: () => press('e'), onSwipe: d => press(d > 0 ? 'e' : 'q'), onLong: () => this.weaponList() });
      this.pause = tc.button({ label: 'II', at: T.pause.at, size: T.pause.size, cls: 'nn-tbtn nn-ttop', onTap: () => { if (ui.state === 'play') ui.pause('main'); } });
      this.cam = tc.button({ label: 'ВИД', at: T.cam.at, size: T.cam.size, cls: 'nn-tbtn nn-ttop', onTap: () => press('cam') });
      this.radarTap = { cx: 0, cy: 0, r: 0 };
      tc.onAny = () => { ui.audio.init(); ui.audio.resume(); };
      this.onRadar = e => {
        if (ui.state !== 'play' || !this.radarTap.r) return;
        if (Math.hypot(e.clientX - this.radarTap.cx, e.clientY - this.radarTap.cy) > this.radarTap.r) return;
        e.preventDefault();
        e.stopPropagation();
        ui.pause('map');
      };
      tc.layer.addEventListener('pointerdown', this.onRadar, { capture: true });
      this.onLost = e => { e.preventDefault(); setTimeout(() => location.reload(), 1500); };
      ui.glc.addEventListener('webglcontextlost', this.onLost);
      if (this.bridge) {
        globalThis.parohod98Back = () => this.backKey();
        globalThis.parohod98Pause = on => this.pauseApp(on);
      }
      this.skipBtn = document.createElement('button');
      this.skipBtn.type = 'button';
      this.skipBtn.className = 'nn-tskip';
      this.skipBtn.textContent = 'Пропустить';
      this.skipBtn.addEventListener('pointerdown', e => e.stopPropagation());
      this.skipBtn.addEventListener('mousedown', e => e.stopPropagation());
      this.skipBtn.addEventListener('click', () => ui.pressed.add('trip'));
      ui.el.appendChild(this.skipBtn);
      this.shopEl = document.createElement('div');
      this.shopEl.className = 'nn-tshop';
      this.shopEl.hidden = true;
      this.shopEl.addEventListener('mousedown', e => e.stopPropagation());
      ui.el.appendChild(this.shopEl);
      this.buildPhotoPad();
      this.mode = null;
      this.zero = null;
      this.lastWeapon = null;
      this.shotT = 0;
      this.hinted = false;
      this.injectStyle();
    }

    injectStyle() {
      if (document.getElementById('nn-touch-style')) return;
      const st = document.createElement('style');
      st.id = 'nn-touch-style';
      st.textContent = [
        '.nn-touch .tc-btn{background:rgba(10,10,10,.5);border:2px solid rgba(255,255,255,.75);font:bold 12px Arial,sans-serif;text-transform:uppercase}',
        '.nn-touch .nn-tfire{border-color:#e8b020;background:rgba(150,40,10,.6);font-size:15px}',
        '.nn-touch .nn-tenter{border-color:#7fd060;background:rgba(30,90,20,.6)}',
        '.nn-touch .tc-btn.lit{background:rgba(232,176,32,.65);color:#111;text-shadow:none}',
        '.nn-touch .nn-ttop,.nn-touch .nn-tweapon{border-radius:8px}',
        '.nn-touch .nn-tweapon{font-size:10px}',
        '.nn-touch .tc-btn small{font-size:9px;text-transform:none}',
        '.nn-touch .tc-stick{border:2px solid rgba(255,255,255,.6);background:rgba(0,0,0,.25)}',
        '.nn-touch .tc-knob{background:rgba(232,176,32,.75);border:2px solid #fff}',
        '.nn-touch .tc-track{background:rgba(0,0,0,.4);border:2px solid rgba(255,255,255,.6)}',
        '.nn-touch .tc-pad i{background:rgba(10,10,10,.5);border:2px solid rgba(255,255,255,.7);border-radius:10px;font:bold 15px Arial,sans-serif}',
        '.nn-touch .nn-tpedals i:last-child{border-color:#7fd060}',
        '.nn-touch .nn-tdrive i{border-color:#e8b020;font-size:13px}',
        '.nn-touch .tc-pad i.on{background:rgba(255,255,255,.3)}',
        '.tc-hint.nn-touch div{background:rgba(0,0,0,.9);border:2px solid #e8b020}',
        '.tc-hint.nn-touch h3{font:bold 22px Impact,"Arial Black",sans-serif;color:#e8b020}',
        '.tc-hint.nn-touch button,.tc-list.nn-touch button{background:#222;color:#e8b020;border:2px solid #e8b020}',
        '.tc-list.nn-touch button:disabled{color:#666}'
      ].join('\n');
      document.head.appendChild(st);
    }

    stripRadio() {
      const flag = globalThis.Parohod98;
      if (!this.bridge || !flag || flag.edition !== 'apk') return;
      let parts = [];
      try { parts = JSON.parse(this.bridge.info()).parts || []; } catch (e) {}
      if (!parts.includes('radio')) N.RADIO.length = 0;
    }

    buildPhotoPad() {
      const ui = this.ui, P = TUNE.photo;
      const ptc = this.ptc = TC.create({ className: 'nn-touch nn-tphoto' });
      const key = (code, on) => { if (ui.photo && ui.photo.on) { if (on) ui.photo.keys.add(code); else ui.photo.keys.delete(code); } };
      this.pStick = ptc.stick({ zone: P.stick, radiusMm: 10, deadZone: 0.1, cls: 'nn-tstick' });
      this.pLook = ptc.look({ zone: P.look });
      ptc.button({ label: 'СНЯТЬ', at: P.shoot.at, size: P.shoot.size, cls: 'nn-tbtn nn-tfire', onTap: () => { if (ui.photo.on) ui.photo.shoot(); } });
      ptc.button({ label: 'ВЫШЕ', at: P.up.at, size: P.up.size, cls: 'nn-tbtn', onDown: () => key('Space', true), onUp: () => key('Space', false) });
      ptc.button({ label: 'НИЖЕ', at: P.down.at, size: P.down.size, cls: 'nn-tbtn', onDown: () => key('AltLeft', true), onUp: () => key('AltLeft', false) });
      ptc.button({ label: 'СКРЫТЬ', at: P.hide.at, size: P.hide.size, cls: 'nn-tbtn nn-ttop', onTap: () => { if (ui.photo.on) { ui.photo.key({ code: 'KeyH' }, true); ui.photo.key({ code: 'KeyH' }, false); } } });
      const fingers = new Map();
      let pinch = null;
      const spread = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
      ptc.layer.addEventListener('pointerdown', e => {
        fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (fingers.size === 2) pinch = { d: spread() };
      }, true);
      ptc.layer.addEventListener('pointermove', e => {
        if (!fingers.has(e.pointerId)) return;
        fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (!pinch || fingers.size < 2 || !ui.photo.on) return;
        const d = spread(), r = d / Math.max(1, pinch.d);
        if (Math.abs(r - 1) < P.pinchStep) return;
        ui.photo.adjust('lens', r > 1 ? 1 : -1);
        pinch.d = d;
      }, true);
      const lift = e => { fingers.delete(e.pointerId); if (fingers.size < 2) pinch = null; };
      ptc.layer.addEventListener('pointerup', lift, true);
      ptc.layer.addEventListener('pointercancel', lift, true);
      ptc.show(false);
    }

    updatePhoto() {
      const ui = this.ui, ph = ui.photo, on = !!ph && ph.on && !ui.menus.active;
      this.ptc.show(on);
      if (!on) return;
      this.ptc.layer.style.clipPath = ph.hidden ? '' : 'inset(0 ' + TUNE.photo.panelPx + 'px 0 0)';
      const s = this.pStick, set = (code, v) => { if (v) ph.keys.add(code); else ph.keys.delete(code); };
      set('KeyW', s.y < -0.3); set('KeyS', s.y > 0.3); set('KeyA', s.x < -0.3); set('KeyD', s.x > 0.3);
      const d = this.ptc.takeLook(this.pLook);
      if (d.dx || d.dy) ph.look(d.dx * TC.PX_PER_MM, d.dy * TC.PX_PER_MM);
    }

    bindMap(c, V, redraw) {
      const fingers = new Map();
      let drag = null, pinch = null;
      const spread = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
      c.style.touchAction = 'none';
      c.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse') return;
        e.preventDefault();
        try { c.setPointerCapture(e.pointerId); } catch (err) {}
        fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (fingers.size === 1) drag = { x: e.clientX, y: e.clientY };
        else { drag = null; pinch = { d: spread(), zoom: V.zoom }; }
      });
      c.addEventListener('pointermove', e => {
        if (!fingers.has(e.pointerId)) return;
        fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && fingers.size >= 2) { V.zoom = N.clamp(pinch.zoom * spread() / Math.max(1, pinch.d), 0.2, 3); redraw(); return; }
        if (!drag) return;
        V.x -= (e.clientX - drag.x) / V.zoom;
        V.z -= (e.clientY - drag.y) / V.zoom;
        drag = { x: e.clientX, y: e.clientY };
        redraw();
      });
      const lift = e => {
        fingers.delete(e.pointerId);
        if (fingers.size < 2) pinch = null;
        if (!fingers.size) drag = null;
      };
      c.addEventListener('pointerup', lift);
      c.addEventListener('pointercancel', lift);
    }

    controlsRows() {
      return [
        ['Левая половина экрана', 'Ходьба: стик под пальцем, за краем кольца — рывок'],
        ['Правая половина экрана', 'Обзор; в машине — верхняя часть экрана'],
        ['ОГОНЬ', 'Удар, выстрел; граната: держать — замах, отпустить — бросок, ✕ — отмена'],
        ['ПРИЦЕЛ', 'Вид через плечо, у СВД — оптика. Помощь прицела — в настройках'],
        ['ПРЫЖОК, СЕСТЬ, R', 'Прыжок, сесть в машину, перезарядка'],
        ['Значок оружия', 'Касание — следующее, сдвиг — листать, долгое нажатие — список'],
        ['Руль и педали', 'Ползунок, наклон телефона или кнопки — в настройках; педали справа, палец можно перекатывать'],
        ['РУЧНИК, ГУДОК, НАЗАД, ВЫЙТИ', 'В машине; НАЗАД — смотреть назад, пока держите'],
        ['◄ ОГОНЬ ►', 'Стрельба из окна влево и вправо'],
        ['РАДИО', 'Касание — следующая станция, долгое нажатие — список'],
        ['РАБОТА', 'Подработка в такси и милицейской машине'],
        ['ПУШКА, ПУЛЕМЁТ', 'Танк и БТР; башня идёт за обзором'],
        ['ВИД', 'Камера'],
        ['Мини-карта', 'Касание открывает карту'],
        ['Сценка', 'Касание — следующая реплика, «Пропустить» — вся сценка'],
        ['«Назад» Android', 'Пауза, выход из меню']
      ];
    }

    radioList() {
      const ui = this.ui, v = ui.game.world.player.veh;
      if (!v) return;
      const opts = N.RADIO.map((st, i) => ({ value: i, label: st.name })).concat({ value: N.RADIO.length, label: 'Выключить' });
      this.tc.choose(opts, i => { v.radio = i; ui.showRadio(true); });
    }

    renderShop() {
      const ui = this.ui, g = ui.game, s = g.shop, el = this.shopEl;
      el.textContent = '';
      const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
      el.appendChild(h('h3', '', s.title));
      const list = h('div', 'nn-tshop-list');
      s.items.forEach((it, i) => {
        const owned = it.owned && it.kind !== 'ammo';
        const row = h('button', g.state.money < it.price && !owned ? 'poor' : '');
        row.type = 'button';
        row.disabled = !!owned;
        row.append(h('span', '', it.name + (it.note ? ' — ' + it.note : '')), h('b', '', owned ? 'есть' : N.money(it.price)));
        row.addEventListener('click', () => {
          s.sel = i;
          ui.audio.play(g.buy(i) ? 'money' : 'deny');
          this.renderShop();
        });
        list.appendChild(row);
      });
      el.appendChild(list);
      const foot = h('div', 'nn-tshop-foot');
      foot.appendChild(h('span', '', (s.msg ? s.msg + ' · ' : '') + 'У тебя: ' + N.money(g.state.money)));
      const close = h('button', '', 'Выйти');
      close.type = 'button';
      close.addEventListener('click', () => { g.closeShop(); ui.audio.play('menu'); });
      foot.appendChild(close);
      el.appendChild(foot);
    }

    updateOverlays() {
      const ui = this.ui, g = ui.game;
      const shop = !!(g && g.shop) && ui.state === 'play' && !ui.menus.active;
      if (shop && this.shopEl.hidden) this.renderShop();
      this.shopEl.hidden = !shop;
      this.skipBtn.classList.toggle('on', !!(g && g.cut) && ui.state === 'play' && !ui.menus.active);
    }

    autoSave() {
      const g = this.ui.game;
      if (!g || this.ui.demo || this.ui.state === 'menu' || g.mission || g.side || g.cut || g.death || g.shop) return false;
      return g.save(TUNE.autoSlot, 'save_hotel');
    }

    steerValue() {
      const s = this.ui.settings;
      if (s.tsteer === 'slider') return this.slider.active ? this.slider.value : null;
      if (s.tsteer === 'buttons') {
        const d = (this.right.down ? 1 : 0) - (this.left.down ? 1 : 0);
        return d || null;
      }
      const a = this.bridge && typeof this.bridge.tilt === 'function' ? Number(this.bridge.tilt()) : NaN;
      if (!Number.isFinite(a)) return null;
      if (this.zero === null) this.zero = a;
      return TC.tiltSteer(a, this.zero, s.ttilt, TUNE.tiltDead);
    }

    settingsRows() {
      const s = this.ui.settings;
      const cycle = (key, list) => () => { const i = list.indexOf(s[key]); s[key] = list[(i + 1) % list.length]; this.ui.applySettings(); };
      const back = (key, list) => d => { const i = Math.max(0, list.indexOf(s[key])); s[key] = list[(i + (d < 0 ? list.length - 1 : 1)) % list.length]; this.ui.applySettings(); };
      const SENS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], AIM = [0, 1, 2], FPS = [30, 60, 90, 120, 0];
      const STEER = ['slider', 'tilt', 'buttons'];
      return [
        { label: 'Руль', note: { slider: 'ползунок', tilt: 'наклон телефона', buttons: 'кнопки' }[s.tsteer], fn: cycle('tsteer', STEER), adj: back('tsteer', STEER) },
        { label: 'Ход ползунка до упора', note: s.tslide + ' мм', fn: cycle('tslide', TUNE.slideMm), adj: back('tslide', TUNE.slideMm) },
        { label: 'Наклон до упора', note: s.ttilt + '°', fn: cycle('ttilt', TUNE.tiltDeg), adj: back('ttilt', TUNE.tiltDeg) },
        { label: 'Чувствительность пальца', note: String(s.touchSens), fn: cycle('touchSens', SENS), adj: back('touchSens', SENS) },
        { label: 'Помощь прицела', note: ['выкл', 'слабая', 'обычная'][s.touchAim], fn: cycle('touchAim', AIM), adj: back('touchAim', AIM) },
        { label: 'Частота кадров', note: s.fps ? s.fps + ' кадров/с' : 'как у экрана', fn: cycle('fps', FPS), adj: back('fps', FPS) }
      ];
    }

    playing() {
      const ui = this.ui;
      return ui.state === 'play' && !!ui.game && !ui.menus.active && !ui.debug.open && !(ui.photo && ui.photo.on) && !ui.game.cut && !ui.game.shop;
    }

    setMode(car, turret) {
      const s = this.ui.settings;
      const m = (car ? (turret ? 'tank' : 'car') : 'foot') + s.tsteer + s.tslide;
      if (this.modeKey === m) return;
      this.modeKey = m;
      this.mode = car ? 'car' : 'foot';
      const tc = this.tc, foot = !car;
      for (const b of [this.stick, this.fire, this.aim, this.jump, this.weapon]) tc.setShown(b, foot);
      for (const b of [this.pedals, this.hand, this.exit, this.horn]) tc.setShown(b, car);
      tc.setShown(this.slider, car && s.tsteer === 'slider');
      tc.setShown(this.left, car && s.tsteer === 'buttons');
      tc.setShown(this.right, car && s.tsteer === 'buttons');
      tc.setShown(this.lookArea, foot);
      tc.setShown(this.carLook, car);
      tc.setShown(this.behind, car && !turret);
      tc.setShown(this.cannon, !!turret);
      tc.setShown(this.mg, !!turret);
      tc.setShown(this.radio, car && !turret && N.RADIO.length > 0);
      this.slider.fullMm = s.tslide;
      if (s.tsteer !== 'tilt') this.zero = null;
      if (this.ui.mouse.r && (car || turret)) { this.ui.mouse.r = false; this.aim.el.classList.remove('lit'); }
      this.carLook.zone = turret ? TUNE.photo.look : TUNE.carLook.zone;
      tc.layout();
    }

    merge(inp, pl) {
      if (!this.tc.visible || this.tc.userHidden) return inp;
      if (pl.veh) {
        const part = this.pedals.part, steer = this.steerValue();
        if (steer !== null) { inp.steer = steer; inp.right = steer; }
        if (part === 'gas') inp.fwd = 1;
        if (part === 'brake') inp.fwd = -1;
        if (this.hand.down) inp.hand = true;
        return inp;
      }
      const s = this.stick;
      if (s.active) {
        inp.fwd = N.clamp((inp.fwd || 0) - s.y, -1, 1);
        inp.right = N.clamp((inp.right || 0) + s.x, -1, 1);
        inp.steer = inp.right;
        if (s.over > TUNE.stick.sprintOver) inp.sprint = true;
      }
      return inp;
    }

    look(dt) {
      const ui = this.ui, s = ui.settings, area = this.mode === 'car' ? this.carLook : this.lookArea;
      const d = this.tc.takeLook(area);
      if (this.mode === 'car') this.tc.takeLook(this.lookArea);
      else this.tc.takeLook(this.carLook);
      const k = TUNE.look.radPerMm * s.touchSens / (s.sens || 1);
      if (d.dx || d.dy) {
        ui.mouse.dx += d.dx * k / 0.0032;
        ui.mouse.dy += d.dy * k / 0.0028;
      }
      this.assist(dt);
    }

    assist(dt) {
      const ui = this.ui, g = ui.game, w = g.world, pl = w.player, cam = ui.camState;
      const level = ui.settings.touchAim;
      if (!level || pl.veh || !cam || N.WEAPONS[pl.weapon].melee || N.WEAPONS[pl.weapon].throw) return;
      const dx = cam.tx - cam.x, dy = cam.ty - cam.y, dz = cam.tz - cam.z, L = Math.hypot(dx, dy, dz) || 1;
      const view = { x: cam.x, y: cam.y, z: cam.z, yaw: Math.atan2(dx, -dz), pitch: Math.asin(N.clamp(dy / L, -1, 1)) };
      const near = [];
      for (const p of w.peds) {
        if (!threat(w, p) || Math.hypot(p.x - pl.x, p.z - pl.z) > TUNE.assistRange) continue;
        const t = { x: p.x, y: p.y + 1.2, z: p.z, p };
        near.push(t);
      }
      if (!near.length) return;
      const seen = near.filter(t => w.los(cam.x, cam.y, cam.z, t.x, t.y, t.z));
      const r = aimAssist(view, seen, level, dt, this.fire.down);
      if (!r.target) return;
      ui.camYaw = N.wrap(ui.camYaw + r.dyaw);
      ui.camPitch = N.clamp(ui.camPitch - r.dpitch, -0.75, 1.2);
      this.locked = r.target.p;
    }

    hudLayout(W, H, S) {
      const dpr = W / Math.max(1, window.innerWidth);
      const R = 92 * S * TUNE.radar.k;
      const top = this.pause.el.getBoundingClientRect();
      const topDy = top.height ? top.bottom * dpr : 0;
      if (this.mode === 'car') {
        const pr = this.pedals.el.getBoundingClientRect();
        const right = pr.width ? pr.left * dpr - this.tc.mm(TUNE.radar.gapMm) * dpr : W * 0.6;
        const x0 = Math.max(W * 0.5 + 6, right - 2 * R);
        this.radarTap = { cx: (x0 + R) / dpr, cy: (H - 10 * S - R) / dpr, r: 0 };
        return { radar: [x0, H - 10 * S, R], topDy };
      }
      const x0 = W * 0.47 - R;
      this.radarTap = { cx: (x0 + R) / dpr, cy: (H - 10 * S - R) / dpr, r: R / dpr };
      return { radar: [x0, H - 10 * S, R], topDy };
    }

    update(dt) {
      const ui = this.ui, g = ui.game, on = this.playing();
      this.tc.show(on);
      this.updatePhoto();
      this.updateOverlays();
      if (!on || !g) { if (ui.mouse.l && !this.fire.down) ui.mouse.l = false; return; }
      const pl = g.world.player, tc = this.tc;
      const driving = pl.veh && pl.veh.driver === pl;
      this.setMode(!!pl.veh, !!(pl.veh && pl.veh.spec.turret));
      const W0 = N.WEAPONS[pl.weapon];
      tc.setShown(this.driveby, !!driving && !pl.veh.spec.turret && !W0.melee && !W0.throw);
      tc.setShown(this.side, !!driving && !g.mission && (pl.veh.livery === 'taxi' || pl.veh.livery === 'militia' || !!pl.veh.copCar || !!g.side));
      const prompt = ui.prompt() || '';
      const fKey = /F — ([^:\s]+(?: [^:\s]+)?)/.exec(prompt);
      tc.setShown(this.enter, !pl.veh && !!fKey);
      if (fKey) {
        const label = fKey[1].replace('выкинуть водителя', 'выкинуть').toUpperCase().slice(0, 9);
        const b = this.enter.el.querySelector('b');
        if (b.textContent !== label) b.textContent = label;
      }
      tc.setShown(this.trip, /X — /.test(prompt));
      if (!pl.veh) {
        const W = N.WEAPONS[pl.weapon], slot = pl.weapons[pl.weapon] || {};
        tc.setShown(this.reload, !!(W.clip && slot.clip < W.clip && slot.ammo > 0));
        tc.setShown(this.cancel, pl.charging > 0);
        const label = pl.weapon + ':' + slot.clip + ':' + slot.ammo;
        if (label !== this.lastWeapon) {
          this.lastWeapon = label;
          this.weapon.el.querySelector('b').textContent = String(W.name || pl.weapon).split(' ')[0].slice(0, 9).toUpperCase();
          const sub = this.weapon.el.querySelector('small');
          if (sub) sub.textContent = W.melee || pl.weapon === 'fists' ? '' : (slot.clip || 0) + '/' + (slot.ammo || 0);
        }
        if (W.melee && ui.mouse.r) { ui.mouse.r = false; this.aim.el.classList.remove('lit'); }
      } else {
        tc.setShown(this.reload, false);
        tc.setShown(this.cancel, false);
      }
      this.look(dt);
      if (this.shotT > 0) this.shotT -= dt;
      if (!this.hinted) {
        this.hinted = true;
        tc.hint('gtann', 'Управление', [
          'Левая половина экрана — ходьба: стик появляется под пальцем. Палец за краем кольца — рывок',
          'Правая половина — камера. ОГОНЬ стреляет, пока держите; ведите пальцем по кнопке, чтобы целиться',
          'ПРИЦЕЛ — вид через плечо, помощь прицела ведёт к ближайшему врагу, пока нажат огонь',
          'Граната: держите ОГОНЬ, чтобы замахнуться, отпустите — бросок, ✕ — отмена',
          'СЕСТЬ появляется у машины. В машине: ползунок руля слева, педали справа, ВЫЙТИ',
          'Значок оружия: касание — следующее, сдвиг — листать, долгое нажатие — список',
          'II — пауза и карта, касание мини-карты тоже открывает карту'
        ], 'Понятно');
      }
    }

    promptText(text) {
      if (!text) return text;
      return text.replace(/ЛКМ — /g, 'ОГОНЬ — ').replace(/(^|\s)[FX] — /g, '$1');
    }

    weaponList() {
      const ui = this.ui, pl = ui.game.world.player;
      const opts = N.SLOTS.map((ids, i) => {
        const id = ids.find(x => pl.weapons[x] && (x === 'fists' || pl.weapons[x].ammo > 0 || pl.weapons[x].clip > 0));
        return id ? { value: i, label: String(N.WEAPONS[id].name || id).toUpperCase() } : null;
      }).filter(Boolean);
      this.tc.choose(opts, i => ui.pressed.add('s' + i));
    }

    event(e) {
      const pl = this.ui.game.world.player;
      if (e.t === 'shot' && e.p === pl) {
        if (HEAVY.has(e.w)) this.tc.vibrate(TUNE.haptic.heavy);
        else if (this.shotT <= 0) { this.tc.vibrate(TUNE.haptic.shot); this.shotT = TUNE.haptic.every; }
      } else if (e.t === 'hurt') this.tc.vibrate(TUNE.haptic.hurt);
    }

    backKey() {
      const ui = this.ui;
      const list = document.querySelector('.tc-list');
      if (list) { list.remove(); return true; }
      if (ui.debug.open) { ui.debug.close(); return true; }
      if (ui.game && ui.game.shop && ui.state === 'play') { ui.game.closeShop(); return true; }
      if (ui.photo && ui.photo.on) { ui.photo.close(); return true; }
      if (ui.menus.active) {
        if (ui.state === 'menu' && ui.menus.active === 'main') { this.bridge.exit(); return true; }
        ui.menus.key({ code: 'Escape', key: 'Escape', preventDefault() {}, stopPropagation() {} });
        return true;
      }
      if (ui.game && ui.game.cut) { ui.pressed.add('trip'); return true; }
      if (ui.state === 'play') { ui.pause('main'); return true; }
      return true;
    }

    pauseApp(on) {
      const ui = this.ui;
      if (on) {
        this.autoSave();
        if (ui.state === 'play' && ui.game && !ui.game.death) ui.pause('main');
        this.tc.release();
        ui.keys.clear();
        ui.mouse.l = false;
        if (ui.audio.on) ui.audio.setRadio(ui.audio.station, false);
        if (ui.audio.ac && ui.audio.ac.state === 'running') ui.audio.ac.suspend();
      } else ui.audio.resume();
    }

    destroy() {
      this.tc.destroy();
      this.ptc.destroy();
      this.skipBtn.remove();
      this.shopEl.remove();
      this.ui.glc.removeEventListener('webglcontextlost', this.onLost);
    }
  }

  Touch.TUNE = TUNE;
  Touch.ACTIONS = ACTIONS;
  Touch.LAYOUT = LAYOUT;
  Touch.CAR_ACTIONS = CAR_ACTIONS;
  Touch.CAR_LAYOUT = CAR_LAYOUT;
  Touch.touchText = touchText;
  Touch.aimAssist = aimAssist;
  Touch.threat = threat;
  N.Touch = Touch;
  if (typeof module !== 'undefined') module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
