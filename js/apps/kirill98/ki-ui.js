(function (K) {
  'use strict';

  const GAME_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space', 'KeyC', 'KeyX', 'KeyE', 'KeyF', 'KeyV', 'KeyB', 'KeyR', 'KeyQ', 'KeyG', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'KeyT', 'KeyH', 'KeyM', 'KeyJ', 'KeyZ', 'F2', 'F3', 'F4', 'F5', 'F6', 'F9', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape']);
  const DT = 1 / 60, SENS = 0.0026, SEARCH_REACH = 2.4, TOPPLE_REACH = 7, AUTO_GAP = 90, HEARD_CAP = 12;
  const MODES = { ladder: 'лестница', swim: 'плывёт', crouch: 'присел', walk: 'шагом', sprint: 'рывок', run: 'бег', air: 'в прыжке' };
  const HERO_IDS = Object.keys(K.Body.HEROES);
  const CAUSES = { fell: 'упал', dead: 'убит на месте', head: 'отрублена голова', leg: 'отрублена нога', disarmed: 'обезоружен' };
  const LOST = { head: 'голову', lArm: 'левую руку', rArm: 'правую руку', lFore: 'левую руку по локоть', rFore: 'правую руку по локоть', lThigh: 'левую ногу', rThigh: 'правую ногу', lShin: 'левую ногу по колено', rShin: 'правую ногу по колено' };
  const SEVERED = { head: 'голова', lArm: 'левая рука', rArm: 'правая рука', lFore: 'левая рука по локоть', rFore: 'правая рука по локоть', lThigh: 'левая нога', rThigh: 'правая нога', lShin: 'левая нога по колено', rShin: 'правая нога по колено' };
  const FALLS = { fell: 'Вы упали без сил.', ko: 'Вы упали без сознания.', dead: 'Вас убили на месте.', head: 'Вам отрубили голову.', leg: 'Вы упали без ноги.', disarmed: 'Вас обезоружили.' };
  const BIND_WHY = { busy: 'Сейчас перевязать нельзя', hands: 'Нечем перевязать: нужна рука', bandage: 'Нет бинта', far: 'Подойдите ближе' };
  const MODE_NAME = { melee: 'ближний бой', bow: 'лук', crossbow: 'арбалет', taxe: 'метательные топорики', javelin: 'сулицы' };
  const MODE_KEY = { Digit1: ['melee'], Digit2: ['bow', 'crossbow'], Digit3: ['taxe'], Digit4: ['javelin'] };
  const bagHas = (bag, id) => (bag || []).some(s => s.id === id && s.n > 0);
  const ORDER_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];
  const CAPTIVE = { surrender: 'сдаётся', bound: 'связан', led: 'идёт за вами', jailed: 'под замком' };
  const sideOf = hero => K.Body.HEROES[hero].kit.side;
  const CLOSABLE = new Set(['search', 'captive', 'shop', 'doctor', 'fit', 'inn', 'chest', 'deed', 'wait', 'cart', 'store', 'council', 'talk', 'armory']);
  const PAUSING = new Set(['yard', 'fallen', 'title', 'start', 'slots', 'settings', 'map', 'village', 'ending', 'book', 'pass', 'war']);
  const GUARD_ROLES = new Set(['commander', 'medic', 'veteran', 'emperor', 'quarter', 'kennel', 'visitor']);
  const VILLAIN_ROLES = new Set(['scribe', 'scout', 'chief', 'spymaster', 'smith', 'surgeon']);
  const VILLAGE_PAL = { side: 'town', fig: 'm', face: 0, skin: [0.8, 0.7, 0.6], hairColor: [0.3, 0.2, 0.1], main: [0.32, 0.5, 0.2], accent: [0.82, 0.48, 0.14], metal: [0.4, 0.4, 0.42] };
  const START_SCREEN = { elf: 'pond', guard: 'muster', villain: 'chronicle' };
  const MODE_ITEM = { bow: 'bow', crossbow: 'crossbow', taxe: 'throwingAxe', javelin: 'javelin' };
  const SETTINGS = { grass: [0, 1, 2], treeRadius: [25, 40, 60], lines: [384, 480, 600], forest: [0.75, 1, 1.3], bodies: [60, 100, 160] };
  const CART_PAL = { side: 'town', fig: 'm', face: 0, skin: [0.8, 0.7, 0.6], hairColor: [0.3, 0.2, 0.1], main: [0.8, 0.74, 0.58], accent: [0.8, 0.52, 0.16], metal: [0.42, 0.42, 0.44] };
  const BALE_MESH = { bread: 'w.sack', grain: 'w.sack', cloth: 'w.bolt', wine: 'w.cask', medicine: 'w.crate', ore: 'w.ore', iron: 'w.ingots' };
  const WHEELS = [[-0.86, 0.55, -0.8], [0.86, 0.55, -0.8], [-0.86, 0.55, 0.8], [0.86, 0.55, 0.8]];
  const ROAD_REACH = 2.4, JINGLE = 0.42;
  const TALK = { shop: 'Торговать', inn: 'Говорить', doctor: 'Лечиться', master: 'Примерка', healer: 'Лечиться', carver: 'Примерка', elder: 'Совет', leader: 'Говорить', villager: 'Говорить', commander: 'Доложить', medic: 'Лечиться', veteran: 'Говорить', emperor: 'Говорить', quarter: 'Оружейная', kennel: 'Говорить', visitor: 'Пропуск', scribe: 'Говорить', scout: 'Говорить', chief: 'Говорить', spymaster: 'Говорить', smith: 'Кузня', surgeon: 'Лечиться' };
  const talkOf = (q, P) => q.soldier !== undefined ? (P && P.team === 'villain' ? TALK[q.role] || 'Говорить' : null) : TALK[q.role];
  const ROLE = { scribe: () => 'писарь Гусь', scout: () => 'разведчик', chief: () => 'вожак пехоты', spymaster: () => 'мастер шпионов', smith: () => 'кузнец', surgeon: () => 'костоправ', saboteur: () => 'чужой во дворе', commander: () => 'командир охраны', medic: () => 'лекарь дворца', veteran: () => 'ветеран у ворот', emperor: () => 'император', quarter: () => 'квартирмейстер', kennel: () => 'псарь', soldier: q => q.soldier !== undefined ? 'боец форта' + (this.state.army && this.state.army.people[q.soldier] ? `, верность ${Math.round(this.state.army.people[q.soldier].loyalty)}` : '') : 'стражник' + (q.guardman !== undefined && K.Guard.state(this.state).people[q.guardman].ten ? ', ваш десяток' : ''), visitor: () => 'посетитель у ворот', lurker: () => 'горожанин', healer: () => 'травница Корней', carver: () => 'резчик Корней', elder: () => 'старейшина Корней', leader: () => 'вожак партизан', villager: q => q.bucket ? 'носит воду' : 'житель Корней' + (q.debt ? ', долг ' + q.debt : ''), shop: q => K.Econ.SHOPS[q.shop].name.toLowerCase(), inn: () => 'хозяин «Колеса»', doctor: () => 'лекарь', master: () => 'мастер протезов', digger: () => 'могильщик', watch: () => 'городская стража', raider: q => { const g = K.World.state(this.state).groups.find(x => q.march && x.id === q.march.id); return (g ? K.World.NAMES[g.kind] : 'отряд') + ', ' + K.Data.SIDES[q.team].name[q.kit.fig].toLowerCase(); }, spy: () => 'горожанин', driver: q => 'возница, ' + K.Data.SIDES[q.team].name[q.kit.fig].toLowerCase(), escort: q => 'охрана корована, ' + K.Data.SIDES[q.team].name[q.kit.fig].toLowerCase() };
  const TALK_REACH = 3.2, WEAR_TIME = 5, FIT_SPIN = 0.45;
  const NEUTRAL = { side: 'town', fig: 'm', face: 0, skin: [0.8, 0.7, 0.6], hairColor: [0.3, 0.2, 0.1], main: [0.5, 0.45, 0.4], accent: [0.45, 0.3, 0.2], metal: [0.62, 0.62, 0.62] };

  const weaponName = (w, s) => K.Data.ITEMS[w].name.toLowerCase() + (s ? ' со щитом' : '');

  class UI {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      this.isActive = this.opts.isActive || (() => !document.hidden);
      this.frames = 0;
      this.paused = false;
      this.dirty = true;
      this.menu = null;
      this.panel = null;
      this.ready = false;
      this.keys = new Set();
      this.edges = new Set();
      this.mouse = { lmb: false, rmb: false, press: false, release: false };
      this.mode = 'first';
      this.free = null;
      this.debugOn = false;
      this.startHour = this.opts.hour !== undefined ? this.opts.hour : 10;
      this.acc = 0;
      this.last = 0;
      this.yaw = 0.52;
      this.pitch = 0.02;
      this.fov = 70 * Math.PI / 180;
      this.quick = null;
      this.stop = 0;
      this.shake = 0;
      this.duel = null;
      this.duels = [];
      this.rnd = K.rng(4242);
      this.settings = this.loadSettings();
      this.lines = this.opts.lines || this.settings.lines;
      this.saves = K.Save.slots(globalThis.indexedDB || null);
      this.playing = false;
      this.portraits = 0;
      this.duelSetup = { me: { weapon: K.Body.HERO_GEAR[this.settings.hero][0], shield: K.Body.HERO_GEAR[this.settings.hero][1] }, foe: { side: 'villain', weapon: 'axe', shield: false, exp: 'soldier' } };
      this.sound = new K.Sound();
      this.sound.volume = this.settings.volume / 100;
      root.classList.add('ki-root');
      root.tabIndex = -1;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ki-canvas';
      root.appendChild(this.canvas);
      this.loading = document.createElement('div');
      this.loading.className = 'ki-loading';
      this.loading.textContent = 'Загрузка долины...';
      root.appendChild(this.loading);
      try {
        this.gpu = new K.Gpu(this.canvas, { preserve: !!this.opts.preserve });
      } catch (e) {
        this.fail(e);
        return;
      }
      this.onKeyDown = e => this.keyDown(e);
      this.onKeyUp = e => this.keys.delete(e.code);
      this.onMouse = e => {
        if (document.pointerLockElement !== this.canvas || this.menu || this.panel) return;
        const F = this.state && this.state.player.fight;
        if (F && ((this.mouse.lmb && F.act && F.act.kind === 'wind') || this.mouse.rmb)) {
          K.Combat.steer(F, e.movementX, -e.movementY);
          return;
        }
        const s = SENS * this.settings.sens / 100;
        this.yaw += e.movementX * s;
        this.pitch = K.clamp(this.pitch - e.movementY * s * (this.settings.invert ? -1 : 1), -1.45, 1.45);
      };
      this.onDown = e => {
        if (document.pointerLockElement !== this.canvas || this.menu || this.panel) return;
        e.preventDefault();
        this.sound.wake();
        if (e.button === 0) { this.mouse.lmb = true; this.mouse.press = true; }
        if (e.button === 2) this.mouse.rmb = true;
      };
      this.onWheel = e => {
        if (document.pointerLockElement !== this.canvas || this.menu || this.panel) return;
        e.preventDefault();
        this.wheel = (this.wheel || 0) + Math.sign(e.deltaY);
      };
      this.onUp = e => {
        if (e.button === 0 && this.mouse.lmb) { this.mouse.lmb = false; this.mouse.release = true; }
        if (e.button === 2) this.mouse.rmb = false;
      };
      this.onMenuKey = e => e.preventDefault();
      this.onClick = () => this.lock();
      this.onLock = () => {
        const locked = document.pointerLockElement === this.canvas;
        if (this.locked && !locked && !this.menu && !this.panel && !this.releasing) this.openMenu();
        this.locked = locked;
        this.releasing = false;
        if (!locked) { this.mouse.lmb = false; this.mouse.rmb = false; }
      };
      this.onBlur = () => { this.keys.clear(); this.edges.clear(); this.mouse.lmb = false; this.mouse.rmb = false; };
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      window.addEventListener('blur', this.onBlur);
      document.addEventListener('mousemove', this.onMouse);
      document.addEventListener('mouseup', this.onUp);
      document.addEventListener('pointerlockchange', this.onLock);
      this.canvas.addEventListener('mousedown', this.onDown);
      this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
      this.canvas.addEventListener('contextmenu', this.onMenuKey);
      this.canvas.addEventListener('click', this.onClick);
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(root);
      this.resize();
      this.loop = ts => this.frame(ts);
      this.bootTimer = setTimeout(() => this.boot(), 30);
    }

    get player() { return this.state ? this.state.player.mv : null; }
    get hour() { return this.state ? this.state.hour : this.startHour; }
    set hour(v) { if (this.state) this.state.hour = v; else this.startHour = v; }
    get time() { return this.state ? this.state.time : 0; }

    boot() {
      if (this.destroyed) return;
      try {
        this.T = K.Terrain.build();
        this.F = K.Flora.build(this.T);
        this.W = K.Move.world(this.T, this.F);
        this.renderer = new K.Renderer(this.gpu, this.T, this.W, this.F);
      } catch (e) {
        this.fail(e);
        return;
      }
      this.hud = new K.Hud(this.root);
      this.state = this.newState();
      this.attach();
      this.loading.remove();
      this.ready = true;
      this.track(true);
      if (!this.opts.shots) this.openTitle();
      this.raf = requestAnimationFrame(this.loop);
    }

    newState() {
      return K.Save.start(this.W, { hero: this.settings.hero, at: [845, 1338], yaw: this.yaw, hour: this.startHour });
    }

    lying(id, at, uid) {
      const g = this.T.heightAt(at[0], at[1]);
      return K.Body.drop(id, new Float32Array([0, 0, 1, 1, 0, 0, 0, 1, 0, at[0], g + 0.04, at[1]]), { uid, born: 0 });
    }

    chairOf(id) {
      return (this.state.chairs || []).find(c => c.id === id) || null;
    }

    chairUse() {
      const S = this.state, P = S.player, mv = P.mv, c0 = this.chairOf(mv.chair || mv.pushing);
      if (mv.chair && c0) {
        c0.rider = null;
        mv.chair = null;
        const r = K.basis(c0.yaw, 0).right;
        mv.pos = [c0.pos[0] + r[0] * 0.65, this.W.groundAt(c0.pos[0] + r[0] * 0.65, c0.pos[2] + r[2] * 0.65, Infinity), c0.pos[2] + r[2] * 0.65];
        this.hud.toast('Вы вылезли из коляски');
        return true;
      }
      if (mv.pushing && c0) { c0.pusher = null; mv.pushing = null; this.hud.toast('Вы отпустили коляску'); return true; }
      let best = null, bd = 1.3;
      for (const c of S.chairs || []) { const d = Math.hypot(c.pos[0] - mv.pos[0], c.pos[2] - mv.pos[2]); if (d < bd) { bd = d; best = c; } }
      if (!best) return false;
      const f = K.basis(best.yaw, 0).fwd, behind = (mv.pos[0] - best.pos[0]) * f[0] + (mv.pos[2] - best.pos[2]) * f[2] < -0.25;
      if (behind && K.Wounds.caps(P.kit).stand && best.pusher === null) { best.pusher = 'player'; mv.pushing = best.id; this.hud.toast('Вы толкаете коляску, E: отпустить'); return true; }
      if (best.rider === null && best.pusher === null) { best.rider = 'player'; mv.chair = best.id; best.speed = 0; this.hud.toast('Вы в коляске: W и S катят, A и D поворачивают, E: вылезти'); return true; }
      return false;
    }

    rideChair(dt, inp) {
      const P = this.state.player, mv = P.mv, c = this.chairOf(mv.chair);
      if (!c) { mv.chair = null; return false; }
      if (c.pusher === null) K.Move.rollChair(c, inp, dt, this.W);
      mv.pos = c.pos.slice();
      mv.yaw = c.yaw;
      mv.vel = [Math.sin(c.yaw) * c.speed, 0, -Math.cos(c.yaw) * c.speed];
      mv.speed = Math.abs(c.speed);
      mv.onGround = true;
      mv.crawl = false;
      mv.crutchOn = false;
      mv.eye += (K.Move.CHAIR.eye - mv.eye) * Math.min(1, 10 * dt);
      return true;
    }

    pushChair(dt) {
      const P = this.state.player, mv = P.mv, c = this.chairOf(mv.pushing);
      if (!c || !K.Wounds.caps(P.kit).stand) { if (c) c.pusher = null; mv.pushing = null; return; }
      const f = [Math.sin(mv.yaw), 0, -Math.cos(mv.yaw)], along = mv.vel[0] * f[0] + mv.vel[2] * f[2];
      K.Move.rollChair(c, {}, dt, this.W, { yaw: mv.yaw, speed: along });
      const x = c.pos[0] - f[0] * 0.85, z = c.pos[2] - f[2] * 0.85, r = K.basis(c.yaw, 0).right, hy = c.pos[1] + 1.0, back = [c.pos[0] + f[0] * -0.42, c.pos[2] + f[2] * -0.42];
      mv.pos = [x, this.W.groundAt(x, z, mv.pos[1] + K.METRICS.step), z];
      mv.handles = [[back[0] - r[0] * 0.22, hy, back[1] - r[2] * 0.22], [back[0] + r[0] * 0.22, hy, back[1] + r[2] * 0.22]];
    }

    handsBusy() {
      const mv = this.state.player.mv, c = this.chairOf(mv.chair);
      return !!(c && c.pusher === null && Math.abs(c.speed) > 0.3) || !!mv.pushing;
    }

    testWound(key) {
      const S = this.state, P = S.player, F = P.fight, kit = P.kit;
      const LIMB = { lFore: 5, rFore: 6, lArm: 3, rArm: 4, lShin: 9, rShin: 10, lThigh: 7, rThigh: 8 };
      if (LIMB[key] !== undefined) {
        if ((kit.cut || {})[key]) return;
        const part = LIMB[key], parts = K.Combat.severs(kit, part).filter(p => !(kit.cut || {})[K.Body.PARTS[p]]);
        const r = K.Combat.apply(S, [{ kind: 'cut', to: P, at: P.mv.pos.slice(), dir: [0, 0, 0], parts }]);
        K.Wounds.hurt(P, { cut: part, part, damage: 1, type: 'chop', material: 'flesh' });
        this.react({ events: [], results: r, frozen: [] });
      } else if (key === 'lEye' || key === 'rEye') kit.eyes = Object.assign({}, kit.eyes, { [key[0]]: true });
      else if (['patch', 'glass', 'resin', 'ruby'].includes(key)) {
        const side = (kit.eyes || {}).l ? 'l' : (kit.eyes || {}).r ? 'r' : 'l';
        kit.eyes = Object.assign({}, kit.eyes, { [side]: key });
      } else if (key === 'peg') {
        for (const s of ['lShin', 'rShin']) if ((kit.cut || {})[s] && !(kit.pros || {})[s]) { kit.pros = Object.assign({}, kit.pros, { [s]: 'peg' }); kit.cut = Object.assign({}, kit.cut, { [s]: 'healed' }); break; }
      } else if (key === 'crutch') P.bag.push({ id: 'crutch', n: 1 });
      else if (key === 'chair') {
        const f = K.basis(this.yaw, 0).fwd, x = P.mv.pos[0] + f[0] * 1.6, z = P.mv.pos[2] + f[2] * 1.6;
        S.chairs.push(K.Move.chair(S.nextId++, x, z, this.yaw + Math.PI, this.W));
      } else if (key === 'bandage') { const have = P.bag.find(s => s.id === 'bandage'); if (have) have.n += 3; else P.bag.push({ id: 'bandage', n: 3 }); }
      else if (key === 'light') { F.bleed.light = K.Wounds.LIGHT.time; F.bleed.lightN = Math.min(3, F.bleed.lightN + 1); F.bleed.at = Object.assign({}, F.bleed.at, { 1: 'light' }); }
      else if (key === 'medium') { F.bleed.medium = K.Wounds.MEDIUM.time; F.bleed.at = Object.assign({}, F.bleed.at, { 2: 'medium' }); }
      else if (key === 'heal') {
        const pos = P.mv.pos.slice(), yaw = P.mv.yaw;
        if (P.mv.chair) this.chairUse();
        this.rise();
        P.mv.pos = pos;
        P.mv.yaw = yaw;
        return;
      }
      S.version++;
    }

    attach() {
      const S = this.state;
      S.player.anim = K.Anim.state();
      S.player.frames = new Float32Array(132);
      this.handFrames = new Float32Array(132);
      this.handGear = null;
      this.pose = K.Body.restPose();
      for (const p of S.people) {
        p.anim = K.Anim.state();
        p.frames = new Float32Array(132);
      }
      for (const it of S.items) it.frame = null;
      if (!S.player.team) S.player.team = sideOf(this.settings.hero);
      if (!S.player.look) S.player.look = K.Save.lookOf(S.player.kit);
      if (!S.visited) S.visited = [];
      if (!S.heard) S.heard = [];
      S.player.carry = S.bodies.find(b => b.carrier === 'player') || null;
      this.orders = false;
      if (this.hud) this.hud.orders(null);
      S.version++;
    }

    loadSettings() {
      const s = { grass: 2, precip: true, treeRadius: 40, border: false, hero: 'elf.m', blood: true, lines: 600, forest: 1, bodies: 160, dither: false, volume: 80, music: 60, sens: 100, invert: false, difficulty: 'normal', villainName: '' };
      try {
        const raw = localStorage.getItem('kirill98_settings');
        if (raw) Object.assign(s, JSON.parse(raw));
      } catch (e) { }
      for (const [k, list] of Object.entries(SETTINGS)) if (!list.includes(s[k])) s[k] = list[1 + (k === 'bodies')];
      if (!HERO_IDS.includes(s.hero)) s.hero = 'elf.m';
      if (!K.Data.DIFFICULTY[s.difficulty]) s.difficulty = 'normal';
      for (const [k, lo, hi, d] of [['volume', 0, 100, 80], ['music', 0, 100, 60], ['sens', 25, 200, 100]]) s[k] = Number.isFinite(Number(s[k])) ? K.clamp(Math.round(Number(s[k])), lo, hi) : d;
      for (const k of ['border', 'dither', 'invert']) s[k] = !!s[k];
      s.blood = s.blood !== false;
      s.villainName = String(s.villainName || '').slice(0, 24);
      return s;
    }

    saveSettings() {
      try { localStorage.setItem('kirill98_settings', JSON.stringify(this.settings)); } catch (e) { }
    }

    setOption(key, value) {
      this.settings[key] = value;
      this.saveSettings();
      if (key === 'lines' && !this.opts.lines) { this.lines = value; this.resize(); }
      if (key === 'volume') { this.sound.volume = value / 100; if (this.sound.master) this.sound.master.gain.value = this.sound.volume; }
      this.dirty = true;
    }

    rules() {
      return K.Data.DIFFICULTY[this.settings.difficulty] || K.Data.DIFFICULTY.normal;
    }

    setHero(id) {
      if (!K.Body.HEROES[id]) return;
      this.setOption('hero', id);
      if (this.state) {
        this.state.player.kit = K.Save.heroKit(id);
        this.state.player.look = K.Save.lookOf(this.state.player.kit);
        this.state.player.fight = K.Save.heroFight(id);
        this.state.player.team = sideOf(id);
        this.dropCarry();
        for (const p of this.state.people) if (p.fight && p.fight.hostile === this.state.player) p.fight.hostile = null;
      }
      this.duelSetup.me = { weapon: K.Body.HERO_GEAR[id][0], shield: K.Body.HERO_GEAR[id][1] };
      this.dirty = true;
    }

    resize() {
      const w = Math.max(1, this.root.clientWidth), h = Math.max(1, this.root.clientHeight);
      this.height = Math.max(120, Math.min(this.lines, Math.round(h)));
      this.width = Math.max(1, Math.round(this.height * w / h));
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.dirty = true;
    }

    keyDown(e) {
      if (!this.isActive() || !GAME_KEYS.has(e.code)) return;
      e.preventDefault();
      this.sound.wake();
      if (this.panel) {
        const kind = this.panelKind;
        if ((e.code === 'Escape' || e.code === 'KeyE' || e.code === 'KeyT' && kind === 'wait') && CLOSABLE.has(kind)) this.closePanel(true);
        else if (e.code === 'Escape' && kind === 'yard') this.closeYard();
        else if (e.code === 'Escape' && kind === 'start') this.openTitle();
        else if (e.code === 'Escape' && (kind === 'slots' || kind === 'settings')) this.closeSub();
        else if ((e.code === 'Escape' || e.code === 'KeyM') && kind === 'map') this.closePanel(true);
        return;
      }
      if (e.code === 'Escape' && this.orders) { this.toggleOrders(false); return; }
      if (e.code === 'Escape') {
        if (this.menu) this.closeMenu(false);
        else this.openMenu();
        return;
      }
      if (this.menu) return;
      if (!e.repeat) this.edges.add(e.code);
      this.keys.add(e.code);
    }

    lock() {
      if (this.menu || this.panel || !this.ready || !this.canvas.requestPointerLock) return;
      try {
        const p = this.canvas.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      } catch (e) { }
    }

    release() {
      if (document.pointerLockElement === this.canvas) {
        this.releasing = true;
        document.exitPointerLock();
      }
      this.keys.clear();
      this.edges.clear();
      this.mouse.lmb = false;
      this.mouse.rmb = false;
    }

    openMenu() {
      if (this.menu || !this.ready) return;
      if (this.panel) this.closePanel(false);
      this.release();
      this.menu = K.Screens.pause(this);
      this.root.appendChild(this.menu);
      this.menu.querySelector('.ki-btn').focus({ preventScroll: true });
      this.dirty = true;
    }

    closeMenu(relock) {
      if (this.menu) this.menu.remove();
      this.menu = null;
      this.root.focus({ preventScroll: true });
      if (relock) this.lock();
    }

    showPanel(el, kind) {
      if (this.panel) this.panel.remove();
      this.release();
      this.panel = el;
      this.panelKind = kind;
      this.root.appendChild(el);
      this.dirty = true;
    }

    closeAll() {
      if (this.menu) this.closeMenu(false);
      if (this.panel) this.closePanel(false);
    }

    openTitle() {
      if (!this.ready) return;
      this.closeAll();
      this.duel = null;
      this.fitting = null;
      const F = this.state.player.fight;
      if (!F || F.down) this.playing = false;
      this.showPanel(K.Screens.title(this), 'title');
    }

    openStart(side) {
      const hero = K.Save.SIDE_HEROES[side][0];
      this.startSetup = { side, hero, look: K.Save.lookOf(K.Body.HEROES[hero].kit), name: this.settings.villainName };
      this.showPanel(K.Screens[START_SCREEN[side]](this), 'start');
    }

    startGame() {
      const st = this.startSetup, S = K.Save.start(this.W, { side: st.side, hero: st.hero, look: st.look, name: st.side === 'villain' ? st.name : null, villainName: st.side === 'villain' ? null : this.settings.villainName });
      this.settings.hero = st.hero;
      if (st.side === 'villain') this.settings.villainName = S.player.name || '';
      this.saveSettings();
      this.adopt(S);
      this.playing = true;
      this.closeAll();
      this.lock();
      this.hud.toast(K.Save.STARTS[st.side].line, 6);
    }

    adopt(S) {
      this.W.dyn.length = 0;
      this.felling = null;
      this.state = S;
      this.seenReports = S.world.reports.length;
      this.wearing = null;
      this.fitting = null;
      this.yaw = S.player.mv.yaw;
      this.pitch = S.player.pitch || 0;
      this.mode = S.player.mode || 'first';
      this.free = null;
      this.duel = null;
      this.lastAuto = S.time;
      if (S.player.kit.hero) this.settings.hero = S.player.kit.hero;
      this.attach();
      this.track(true);
      this.dirty = true;
    }

    portrait(kind) {
      if (!this.ready || !this.startSetup) return null;
      const st = this.startSetup, kit = K.Save.heroKit(st.hero, st.look), face = kind === 'face', spot = K.Save.STARTS[face ? 'elf' : 'guard'];
      const [x, z] = spot.at, yaw = face ? 1.2 : Math.PI, gy = this.W.groundAt(x, z, Infinity), f = K.basis(yaw, 0).fwd, r = K.basis(yaw, 0).right;
      const live = [{ kit, frames: K.Body.fk(K.Body.figure(kit), K.Body.restPose(), [x, gy, z], yaw), gear: [], fist: [] }];
      if (!face) for (let i = 0; i < 6; i++) {
        const k2 = K.Body.kit('guard', null, K.rng(80 + i)), d = (i - 2.5) * 1.15, px = x - f[0] * 2.6 + r[0] * d, pz = z - f[2] * 2.6 + r[2] * d;
        live.push({ kit: k2, frames: K.Body.fk(K.Body.figure(k2), K.Body.restPose(), [px, this.W.groundAt(px, pz, Infinity), pz], yaw), gear: [], fist: [] });
      }
      const head = live[0].frames, hy = head[10] + 0.08, dist = face ? 0.5 : 2.5;
      const eye = face ? [head[9] + f[0] * dist, hy - 0.04, head[11] + f[2] * dist] : [x + f[0] * dist, gy + 1.2, z + f[2] * dist];
      const w = face ? 320 : 256, h = face ? 240 : 320;
      this.renderer.render({ eye, yaw: yaw + Math.PI, pitch: face ? 0.06 : 0.03, fov: (face ? 38 : 46) * Math.PI / 180, hour: face ? 8 : 7.5, time: 0, treeRadius: this.settings.treeRadius, people: { still: [], live, version: -(++this.portraits) } }, this.width, this.height);
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const a = w / h, sw = Math.min(this.width, this.height * a), sh = sw / a;
      out.getContext('2d').drawImage(this.canvas, (this.width - sw) / 2, (this.height - sh) / 2, sw, sh, 0, 0, w, h);
      this.state.version++;
      this.dirty = true;
      return out;
    }

    openSlots(mode, from) {
      this.subFrom = from;
      this.subBack = from === 'fallen' ? { el: this.panel, kind: this.panelKind } : null;
      if (this.menu) this.closeMenu(false);
      this.showPanel(K.Screens.slots(this, mode), 'slots');
    }

    openSettings(from) {
      this.subFrom = from;
      this.subBack = null;
      if (this.menu) this.closeMenu(false);
      this.showPanel(K.Screens.settings(this), 'settings');
    }

    closeSub() {
      const from = this.subFrom;
      if (from === 'title') this.openTitle();
      else if (from === 'fallen' && this.subBack) this.showPanel(this.subBack.el, this.subBack.kind);
      else { this.closePanel(false); this.openMenu(); }
    }

    openMap() {
      if (this.menu) this.closeMenu(false);
      this.showPanel(K.Screens.map(this), 'map');
    }

    tripTo(spot) {
      const P = this.state.player;
      return K.World.trip(this.state, this.W, [P.mv.pos[0], P.mv.pos[2]], spot.node || spot.at, P.team);
    }

    saveList() {
      return this.saves.list();
    }

    thumb() {
      try {
        this.draw();
        const c = document.createElement('canvas'), a = 4 / 3, sw = Math.min(this.width, this.height * a), sh = sw / a;
        c.width = 160;
        c.height = 120;
        c.getContext('2d').drawImage(this.canvas, (this.width - sw) / 2, (this.height - sh) / 2, sw, sh, 0, 0, 160, 120);
        return c.toDataURL('image/jpeg', 0.72);
      } catch (e) {
        return null;
      }
    }

    saveTo(id) {
      const why = K.Save.blocked(this.state);
      if (why) return Promise.resolve(why);
      const data = this.snapshot(), rec = K.Save.record(id, data, K.Save.meta(this.state, this.T), this.thumb());
      return this.saves.put(rec).then(() => null, e => 'Не удалось сохранить: ' + (e && e.message || e));
    }

    loadFrom(id) {
      return this.saves.get(id).then(rec => {
        if (!rec) { this.hud.toast('Ячейка пуста'); return false; }
        this.load(rec.data);
        this.playing = true;
        this.closeAll();
        this.lock();
        this.hud.toast(`Загружено: ${rec.meta.name}, день ${rec.meta.day}, ${rec.meta.place}`, 4);
        return true;
      }, e => { this.hud.toast('Не удалось загрузить: ' + (e && e.message || e), 4); return false; });
    }

    continueLatest() {
      if (this.playing) { this.closeAll(); this.lock(); return Promise.resolve(true); }
      return this.saveList().then(list => list.length ? this.loadFrom(list[0].id) : false, () => false);
    }

    autosave(force) {
      if (!this.playing || this.opts.shots) return;
      const S = this.state;
      if (K.Save.blocked(S) || (!force && S.time - (this.lastAuto || 0) < AUTO_GAP)) return;
      this.lastAuto = S.time;
      const data = this.snapshot(), m = K.Save.meta(S, this.T), thumb = this.thumb();
      this.saves.list().then(list => this.saves.put(K.Save.record(K.Save.autoSlot(list), data, m, thumb))).then(() => this.hud.toast('Автосохранение', 2), () => { });
    }

    openSearch(body) {
      if (this.panel || this.menu || !body) return;
      this.searching = body;
      this.showPanel(K.Screens.search(this, body), 'search');
    }

    openDuel() {
      if (this.menu) this.closeMenu(false);
      this.showPanel(K.Screens.duel(this), 'yard');
    }

    openWounds() {
      if (this.menu) this.closeMenu(false);
      this.showPanel(K.Screens.wounds(this), 'yard');
    }

    openReports() {
      if (this.menu) this.closeMenu(false);
      this.showPanel(K.Screens.reports(this), 'yard');
    }

    openSquad() {
      if (this.menu) this.closeMenu(false);
      this.showPanel(K.Screens.squad(this), 'yard');
    }

    openCaptive(p) {
      if (this.panel || this.menu || !p) return;
      this.showPanel(K.Screens.captive(this, p), 'captive');
    }

    captiveAct(p, act) {
      const S = this.state, P = S.player, name = K.Body.nameOf(p);
      if ((act === 'tie' || act === 'lead') && !K.Wounds.caps(P.kit).bindOther) { this.hud.toast('Нечем вязать: нужна рука'); return; }
      if (act === 'tie') { p.state = 'bound'; p.captor = 'player'; this.hud.toast('Связан: ' + name); }
      else if (act === 'lead') { p.state = 'led'; p.leader = 'player'; p.captor = 'player'; const pr = K.Places.PRISONS[P.team]; this.hud.toast(name + ' идёт за вами' + (pr ? '. Сдать: ' + pr.name : ''), 4); }
      else if (act === 'leave') { p.state = 'bound'; p.leader = null; this.hud.toast(name + ' остался связанным'); }
      else if (act === 'free') { K.AI.release(p, S); this.hud.toast('Отпущен: ' + name + '. Он запомнит вас', 4); }
      S.version++;
      this.closePanel(true);
    }

    startSquad(c) {
      const S = this.state, P = S.player, side = P.team, W = this.W, G = c.place === 'here' ? null : K.Places.GROUNDS[c.place];
      this.dropCarry();
      S.people = S.people.filter(p => !p.test);
      if (S.rescue) S.rescue = null;
      if (P.fight.down) this.rise();
      const yaw = G ? G.face : this.yaw, at = G ? G.a : [P.mv.pos[0], P.mv.pos[2]], b = K.basis(yaw, 0);
      P.mv = K.Move.body(W, at[0], at[1], yaw);
      this.yaw = yaw;
      this.pitch = -0.05;
      this.free = null;
      const spawn = (team, x, z, face, squad) => {
        const id = S.nextId++, q = K.Body.member(id, team, x, z, face, W);
        q.test = true;
        q.anim = K.Anim.state();
        q.frames = new Float32Array(132);
        if (squad) { q.squad = 'player'; q.debt = c.debt ? 1 : 0; }
        S.people.push(q);
        return q;
      };
      for (let i = 0; i < c.own; i++) spawn(side, at[0] - b.fwd[0] * (2.5 + Math.floor(i / 3) * 1.6) + b.right[0] * (i % 3 - 1) * 1.6, at[1] - b.fwd[2] * (2.5 + Math.floor(i / 3) * 1.6) + b.right[2] * (i % 3 - 1) * 1.6, yaw, true);
      const far = G ? Math.hypot(G.b[0] - G.a[0], G.b[1] - G.a[1]) : 28, foeAt = G ? G.b : [at[0] + b.fwd[0] * far, at[1] + b.fwd[2] * far];
      for (let i = 0; i < c.foes; i++) spawn(c.foe, foeAt[0] + b.right[0] * (i - (c.foes - 1) / 2) * 1.6, foeAt[1] + b.right[2] * (i - (c.foes - 1) / 2) * 1.6, yaw + Math.PI, false);
      const st = K.Data.STANDING[side];
      S.standing = Object.assign({ service: 0, respect: 0, loyalty: 0 }, S.standing || {});
      if (st) S.standing[st.stat] = c.valued ? Math.max(st.command, st.rescue) : 0;
      S.squad = c.own ? { order: 'follow', fire: false, at: null, face: yaw } : null;
      S.version++;
      this.closePanel(false);
      this.lock();
      this.track(true);
      const can = K.AI.canCommand(S);
      this.hud.toast(c.own ? (can.ok ? 'Q: команды отряду, G: нести раненого' : can.why) : 'Противник впереди', 5);
    }

    toggleOrders(on) {
      const S = this.state;
      if (on) {
        const can = K.AI.canCommand(S);
        if (!can.ok) { this.hud.toast(can.why); return; }
      }
      this.orders = !!on;
      this.hud.orders(on ? K.Data.COMMANDS.map((c, i) => (i + 1) + '  ' + (c.id === 'fire' && S.squad && S.squad.fire ? 'Не стрелять без приказа' : c.name)) : null);
    }

    command(i) {
      const S = this.state, c = K.Data.COMMANDS[i];
      if (!c) return;
      const r = K.AI.order(S, c.id, c.id === 'attack' ? this.aimedPerson(60) : null);
      this.hud.toast(r.ok ? 'Приказ: ' + r.text : r.why);
      this.toggleOrders(false);
    }

    aimedPerson(reach) {
      const c = this.camera(), b = K.basis(c.yaw, c.pitch), S = this.state;
      let best = null, bd = reach;
      for (const p of S.people) {
        if (!p.fight || p.fight.down || p.kit.side === 'straw') continue;
        const q = p.mv.pos, dx = q[0] - c.eye[0], dy = q[1] + 1.1 - c.eye[1], dz = q[2] - c.eye[2], d = Math.hypot(dx, dy, dz), along = dx * b.fwd[0] + dy * b.fwd[1] + dz * b.fwd[2];
        if (along <= 0 || d > bd) continue;
        if (Math.sqrt(Math.max(0, d * d - along * along)) < Math.max(0.6, d * 0.03)) { bd = d; best = p; }
      }
      return best;
    }

    dropCarry() {
      const S = this.state;
      if (!S || !S.player.carry) return;
      K.AI.putDown(S, S.player.carry);
      S.player.carry = null;
      S.player.mv.load = null;
    }

    carryKey() {
      const S = this.state, P = S.player, c = K.Wounds.caps(P.kit);
      if (P.carry) {
        const b = P.carry, team = (b.who && b.who.team) || b.kit.side, H = K.AI.healerNear(S, P.mv.pos, team, 4), name = K.Body.nameOf(b);
        P.carry = null;
        P.mv.load = null;
        if (H) { const ev = []; K.AI.deliver(S, b, this.W, 'player', ev); this.react({ events: ev, results: [], frozen: [] }); }
        else { K.AI.putDown(S, b); this.hud.toast('Положили: ' + name); }
        return;
      }
      const b = this.target && this.target.body;
      if (!b) { this.hud.toast('Нести некого: смотрите на упавшего'); return; }
      if (!c.drag) { this.hud.toast('Без рук не унести'); return; }
      if (P.mv.chair || P.mv.pushing) { this.hud.toast('Руки заняты коляской'); return; }
      K.Missile.cancel(P.fight);
      K.Combat.guard(P.fight, false);
      K.AI.lift(S, b, P);
      P.carry = b;
      P.mv.load = c.carry ? 'carry' : 'drag';
      this.hud.toast(c.carry ? 'Несёте: ' + K.Body.nameOf(b) + ' (G: положить, у лекаря: отдать)' : 'Без руки только волоком: ' + K.Body.nameOf(b), 4);
    }

    forceWeather() {
      const S = this.state, L = [null, ...K.Weather.KINDS, 'fog'], next = L[(L.indexOf(S.wxForce || null) + 1) % L.length];
      S.wxForce = next;
      this.hud.toast('Погода: ' + (next ? K.Weather.NAMES[next] : 'по дням'));
    }

    weatherStep() {
      const S = this.state, P = S.player, F = P.fight, wx = K.Weather.at(S), eye = this.camera().eye;
      if (F && F.torch && K.Weather.douses(wx, P.mv.pos)) { F.torch = false; this.hud.toast('Ливень залил факел'); }
      const bolt = K.Weather.bolt(S.seed || 0, S.time, wx);
      if (bolt && bolt.id !== this.boltId) {
        this.boltId = bolt.id;
        (this.thunders = this.thunders || []).push({ at: S.time - bolt.age + bolt.dist / 340, power: K.clamp(1.4 - bolt.dist / 2000, 0.3, 1.4), near: bolt.dist < 700 });
      }
      if (this.thunders && this.thunders.length) this.thunders = this.thunders.filter(t => { if (S.time < t.at) return true; this.sound.play('thunder', { power: t.power, near: t.near }); return false; });
      this.sound.rain(wx.rain * (K.Weather.sheltered(eye) ? 0.45 : 1));
    }

    weatherView(eye) {
      const S = this.state, wx = K.Weather.at(S), bolt = K.Weather.bolt(S.seed || 0, S.time, wx);
      return { wx, mist: K.Weather.mistAt(this.T, wx, eye[0], eye[2]), bolt, flash: K.Weather.flashOf(bolt), sheltered: K.Weather.sheltered(eye), precip: this.settings.precip !== false };
    }

    torchKey() {
      const P = this.state.player, F = P.fight, c = K.Wounds.caps(P.kit);
      if (F.torch) { F.torch = false; this.hud.toast('Факел погашен'); return; }
      if (!bagHas(P.bag, 'torch')) { this.hud.toast('Нет факела'); return; }
      if (F.shield) { this.hud.toast('Левая рука держит щит'); return; }
      const need = F.weapon ? (K.Data.WEAPONS[F.weapon].hands === 2 ? 3 : 2) : 1;
      if (c.hands < need) { this.hud.toast(need === 3 ? 'Двуручное оружие занимает обе руки' : 'Нечем держать факел'); return; }
      if (K.Weather.douses(K.Weather.at(this.state), P.mv.pos)) { this.hud.toast('Под ливнем факел не зажечь'); return; }
      if (F.mode === 'bow' || F.mode === 'crossbow') K.Missile.setMode(P, 'melee');
      F.torch = true;
      this.hud.toast('Факел горит: волки не подходят ближе 5 м');
    }

    startSkin(c) {
      const P = this.state.player, name = K.Beasts.SPECIES[c.beast].name.toLowerCase();
      if (c.skinned) { this.hud.toast('Туша уже освежёвана'); return; }
      if (!K.Beasts.SPECIES[c.beast].yield.length) { this.hud.toast('С этого зверя взять нечего'); return; }
      if (!K.Beasts.canSkin(P, P.bag)) { this.hud.toast('Свежевать нечем: нужен нож'); return; }
      P.skinning = { c, t: 0, at: P.mv.pos.slice() };
      this.hud.toast('Свежую: ' + name + ', ' + K.Beasts.SKIN_TIME + ' с', K.Beasts.SKIN_TIME);
    }

    skinStep(dt) {
      const S = this.state, P = S.player, k = P.skinning;
      if (P.fight.down || Math.hypot(P.mv.pos[0] - k.at[0], P.mv.pos[2] - k.at[2]) > 0.6 || S.time - (P.fight.hitTime || -99) < 0.2) { P.skinning = null; this.hud.toast('Свежевание прервано'); return; }
      k.t += dt;
      if (k.t < K.Beasts.SKIN_TIME) return;
      P.skinning = null;
      const got = K.Beasts.skin(S, k.c, P.bag);
      if (got) this.hud.toast('Взято: ' + got.map(g => K.Data.ITEMS[g.id].name.toLowerCase() + (g.n > 1 ? ' ×' + g.n : '')).join(', '), 4);
    }

    afterRescue() {
      const S = this.state, P = S.player, r = K.AI.carryOut(S, this.W);
      this.yaw = r.healer.face;
      this.pitch = 0;
      P.anim = K.Anim.state();
      this.closePanel(true);
      this.track(true);
      this.hud.toast('Вы у лекаря: ' + r.healer.name, 4);
    }

    closeYard() {
      this.closePanel(false);
      this.openMenu();
    }

    openTalk(q) {
      if (this.panel || this.menu || !q) return;
      const S = this.state, P = S.player;
      const ev = [], said = K.Elves && S.village ? K.Elves.talked(S, q.role, ev) : null;
      for (const e of ev) this.react({ events: [e], results: [], frozen: [] });
      if (q.role === 'shop') this.showPanel(K.Screens.shop(this, q.shop, q), 'shop');
      else if (q.role === 'doctor') this.showPanel(K.Screens.doctor(this, q), 'doctor');
      else if (q.role === 'healer') this.showPanel(K.Screens.doctor(this, q, 'ryabina', said), 'doctor');
      else if (q.role === 'carver') this.openFit(q, 'yasen', said);
      else if (q.role === 'elder') this.showPanel(K.Screens.council(this, q, said), 'council');
      else if (q.role === 'leader' || q.role === 'villager') this.showPanel(K.Screens.elfTalk(this, q, said), 'talk');
      else if (q.role === 'medic') this.showPanel(K.Screens.doctor(this, q, 'savva'), 'doctor');
      else if (q.role === 'surgeon' && q.team === 'villain') this.showPanel(K.Screens.doctor(this, q, 'frol'), 'doctor');
      else if (q.team === 'villain' && (q.soldier !== undefined || VILLAIN_ROLES.has(q.role))) { const vev = [], vs = K.Villain.talked(S, q.role, vev, q); this.villainEvents(vev); if (vs === 'hvosh') this.showPanel(K.Screens.villainTalk(this, q, 'Хозяин, руку отняли под заставой. Дай железную — буду рубить левой и правой.', true), 'talk'); else this.showPanel(K.Screens.villainTalk(this, q, vs || '«Слушаю, хозяин.»'), 'talk'); }
      else if (q.role === 'quarter') this.showPanel(K.Screens.armory(this, q), 'armory');
      else if (q.role === 'visitor') { if (q.visitor && q.visitor.state === 'queue') this.showPanel(K.Screens.pass(this, q), 'pass'); }
      else if (GUARD_ROLES.has(q.role)) { const gev = [], gs = K.Guard.talked(S, q.role, gev); for (const e of gev) this.react({ events: [e], results: [], frozen: [] }); this.showPanel(K.Screens.guardTalk(this, q, gs), 'talk'); }
      else if (q.role === 'inn') this.showPanel(K.Screens.inn(this, q), 'inn');
      else if (q.role === 'master') this.openFit(q, 'sharnir');
    }

    openFit(q, shop, said) {
      const S = this.state, P = S.player, spot = K.Places.town(this.T).fits[shop];
      if (this.panel) this.closePanel(false);
      if (spot && !P.mv.chair) { P.mv = K.Move.body(this.W, spot.at[0], spot.at[1], Math.atan2(q.mv.pos[0] - spot.at[0], -(q.mv.pos[2] - spot.at[1]))); S.version++; }
      this.fitting = { keeper: q, place: null, angle: P.mv.yaw + Math.PI, shop };
      this.showPanel(K.Screens.fit(this, q, said), 'fit');
    }

    villainEvents(list) {
      const S = this.state;
      for (const e of list) {
        if (e.kind === 'skip') { const h = ((e.to - S.hour) % 24 + 24) % 24; if (h > 0.01) { K.Econ.pass(S, h, { W: this.W, rnd: this.rnd }); this.track(true); } continue; }
        this.react({ events: [e], results: [], frozen: [] });
      }
    }

    hvoshDecide(give) {
      const ev = [], said = K.Villain.hvosh(this.state, give, ev);
      this.villainEvents(ev);
      return said;
    }

    warOrder(squad, kind, target, lead) {
      const S = this.state, r = K.Villain.order(S, squad, kind, target, { W: this.W, lead });
      if (r.ok && lead && r.group) { this.closePanel(true); this.hud.toast(r.text + '. Вы идёте с отрядом от ворот форта', 4); const g = r.group, at = K.World.POSTS.fort.gate; S.player.mv = K.Move.body(this.W, at[0] + 3, at[1] + 2, Math.PI / 2); this.yaw = S.player.mv.yaw; this.track(true); }
      else if (r.ok) this.hud.toast(r.text, 3);
      return r;
    }

    villainAssault(route) {
      const S = this.state, ev = [], r = K.Villain.startAssault(S, this.W, route, ev);
      if (!r.ok) return r;
      this.closePanel(true);
      this.villainEvents(ev);
      const at = K.World.POSTS.fort.gate;
      S.player.mv = K.Move.body(this.W, at[0] + 3, at[1] + 2, Math.PI / 2);
      this.yaw = S.player.mv.yaw;
      this.track(true);
      this.hud.toast(r.text + (route === 'goat' ? '. Налегке козьей тропой мимо заставы' : '. Лесной дорогой и трактом с тараном'), 5);
      return r;
    }

    villainSortie() {
      if (K.Villain.startSortie(this.state, this.W)) { this.closePanel(true); this.hud.toast('Шестеро с Кривым идут за вами. Козья тропа начинается за восточной калиткой', 5); }
    }

    villainLine() {
      const S = this.state, A = S.army;
      if (!A || this.free) return null;
      const g = K.Villain.introGoal(S);
      if (g) return g;
      const G = S.guard, E = K.World.state(S);
      if (E.assault && !E.assault.result && G && G.siege) return `Штурм! Ворота: прочность ${Math.round(G.gate.hp)}${G.gate.broken ? ' (выбиты) — к Белой башне со знаменем' : ''} · лестниц у стены: ${G.ladders.filter(L => L.up).length}`;
      if (A.assault) { const d = Math.round(Math.hypot(S.player.mv.pos[0] - 1146, S.player.mv.pos[2] - 700)); return `Войско идёт на дворец · до ворот ${d} м`; }
      const out = A.squads.filter(s => s.group).length;
      return `Верность ${K.Villain.loyalty(S)}% · страх ${K.Villain.fear(S)}%${out ? ' · отрядов в походе: ' + out : ''} · J — военный стол`;
    }

    passDecide(q, how) {
      const S = this.state, ev = [], said = K.Guard.decide(S, q, how, ev);
      K.Guard.post(S, ev, this.W, this.rnd);
      for (const e of ev) this.react({ events: [e], results: [], frozen: [] });
      this.closePanel(true);
      if (said) this.hud.toast(said, 3);
    }

    orderLine() {
      const S = this.state, P = S.player;
      if (P.team !== 'guard' || !S.guard || this.free) return null;
      const g = K.Guard.introGoal(S);
      if (g) return g;
      const o = S.guard.order, G = S.guard;
      if (G.siege) return `Штурм! Ворота: прочность ${Math.round(G.gate.hp)}${G.gate.broken ? ' (выбиты)' : ''} · лестниц у стены: ${G.ladders.filter(L => L.up).length} · внутри врагов: ${G.siege.inside}`;
      if (G.jail) return 'Гауптвахта: ночь под замком';
      if (!o) return S.hour < 7.6 ? 'Построение в 7:00 во дворе' : null;
      if (o.state !== 'given') return o.state === 'done' ? 'Приказ выполнен. Построение завтра в 7:00' : 'Приказ не выполнен';
      const at = o.pts ? o.pts[o.i] : o.at, d = at ? Math.round(Math.hypot(at[0] - P.mv.pos[0], at[1] - P.mv.pos[2])) : null;
      return `Приказ: ${o.name}, ${o.text}, до ${o.until}:00` + (d !== null && d > 10 ? ` · ${d} м` : '');
    }

    goalLine() {
      const S = this.state, P = S.player;
      if (P.team === 'guard') return this.orderLine();
      if (P.team === 'villain') return this.villainLine();
      if (!S.village || P.team !== 'elf' || this.free) return null;
      const g = K.Elves.introGoal(S);
      if (g) return g;
      const t = S.village.task;
      if (!t) return null;
      const d = Math.round(Math.hypot(t.at[0] - P.mv.pos[0], t.at[1] - P.mv.pos[2]));
      if (d < 12) { S.village.task = null; this.hud.toast('На месте: ' + t.text.toLowerCase(), 3); return null; }
      return 'Задание: ' + t.text + ' · ' + d + ' м';
    }

    setTask(t) {
      const S = this.state;
      if (!S.village) return;
      S.village.task = t ? { kind: t.kind, text: t.text, at: t.at.slice() } : null;
      this.closePanel(true);
      if (t) this.hud.toast('Задание: ' + t.text, 4);
    }

    elfAct(act, q) {
      const S = this.state, P = S.player;
      if (act === 'call') { const n = K.Elves.call(S, P.mv.pos); return n ? `Сбежались с вёдрами: ${n}` : 'Некому звать или нечего тушить'; }
      if (act === 'join') {
        const st = S.standing.respect || 0;
        if (q.role !== 'leader' && st < K.Data.STANDING.elf.command) return 'Пойдут с вами при уважении деревни ' + K.Data.STANDING.elf.command;
        if (S.people.filter(x => x.squad === 'player').length >= K.Data.STANDING.elf.most) return 'С вами и так полный отряд';
        q.squad = 'player';
        if (!S.squad) S.squad = { order: 'follow', fire: false, at: null, face: this.yaw };
        return K.Body.nameOf(q) + ' идёт с вами. Команды: Q';
      }
      if (act === 'leave') { q.squad = null; if (!S.people.some(x => x.squad === 'player')) S.squad = null; S.village.hourSet = -1; return K.Body.nameOf(q) + ' вернулся к своим делам'; }
      return '';
    }

    storeAct(how, id) {
      const S = this.state, P = S.player, E = K.Elves;
      if (how === 'put') { const r = E.deposit(S, P, id); return r.ok ? `В кладовую: ${K.Data.ITEMS[id].name.toLowerCase()} ×${r.n}` + (P.team === 'elf' ? `, уважение +${r.gain.toFixed(1).replace('.', ',')}` : '') : r.why; }
      if (how === 'take') { const r = E.take(S, P, id); return r.ok ? 'Взято: ' + K.Data.ITEMS[id].name.toLowerCase() : r.why; }
      if (how === 'build') { const r = E.build(S, id); return r.ok ? 'Построено: ' + r.name : r.why; }
      if (how === 'rebuild') { const r = E.rebuild(S, id); return r.ok ? 'Отстроен: ' + r.name : r.why; }
      return '';
    }

    trade(how, shop, id) {
      const S = this.state, P = S.player, r = how === 'buy' ? K.Econ.buy(S, P.bag, shop, id) : K.Econ.sell(S, P.bag, shop, id), name = K.Data.ITEMS[id].name.toLowerCase();
      if (!r.ok) return r.why;
      S.version++;
      if (how === 'sell') return `Продано: ${name}, +${r.price} сер.`;
      const worn = K.Econ.equip(P, id);
      return `Куплено: ${name}${r.n > 1 ? ' ×' + r.n : ''} за ${r.price} сер.${worn ? ', ' + worn : ''}`;
    }

    cure(id, who) {
      const S = this.state, r = K.Econ.treat(S, S.player, id, { W: this.W, rnd: this.rnd }, who);
      if (!r.ok) return r.why;
      S.version++;
      return `«Готово.» Заплачено ${r.price} сер.${r.hours ? ', прошло ' + r.hours + ' ч' : ''}`;
    }

    fitPros(id, how) {
      const S = this.state, r = K.Econ.fit(S, S.player, this.fitting.place, id, how, { W: this.W, rnd: this.rnd });
      if (!r.ok) return r.why;
      S.version++;
      return `Шарнир поставил: ${K.Data.ITEMS[id].name.toLowerCase()}. ${r.price ? 'Заплачено ' + r.price + ' сер.' : 'Даром.'}${r.hours ? ' Прошёл ' + r.hours + ' ч.' : ''}`;
    }

    rentRoom() {
      const S = this.state, r = K.Econ.rent(S, S.player.bag, K.Places.town(this.T).beds);
      return r.ok ? `«Комната наверху за стойкой, кровать у окна.» Снято до полудня за ${r.price} сер.` : r.why;
    }

    hireMerc() {
      const S = this.state, P = S.player, r = K.Econ.hire(S, P.bag);
      if (!r.ok) return r.why;
      const door = K.Places.town(this.T).doors.inn, id = S.nextId++, q = K.Body.member(id, 'town', door.at[0], door.at[1], door.face + Math.PI, this.W, null, 'm');
      q.kit.armor = ['mail'];
      q.kit.head = 'nasal';
      q.fight = K.Combat.fighter({ weapon: 'sword', shield: true, exp: 'soldier' });
      q.sack = [{ id: 'bandage', n: 2 }];
      q.team = P.team;
      q.squad = 'player';
      q.merc = { since: S.day, paid: S.day };
      q.anim = K.Anim.state();
      q.frames = new Float32Array(132);
      S.people.push(q);
      if (!S.squad) S.squad = { order: 'follow', fire: false, at: null, face: this.yaw };
      S.version++;
      return `«${K.Body.nameOf(q)} пойдёт с тобой.» Нанят за ${r.price} сер., дальше ${K.Econ.MERC.day} в день.`;
    }

    buyHome(id) {
      const S = this.state, r = K.Econ.buyHome(S, S.player.bag, id);
      if (!r.ok) return r.why;
      S.version++;
      this.hud.toast('Ваш дом: ' + r.name, 4);
      return 'Купчая подписана. Дом ваш.';
    }

    waitHours(h) {
      const S = this.state, r = K.Econ.wait(S, S.player, h, { W: this.W, rnd: this.rnd });
      this.closePanel(true);
      this.hud.toast(r.ok ? `Прошло ${r.hours} ч` : r.why, 3);
    }

    sleepIn(bed) {
      const S = this.state, r = K.Econ.sleep(S, S.player, bed, { W: this.W, rnd: this.rnd });
      if (!r.ok) { this.hud.toast(r.why, 3); return; }
      this.track(false);
      this.autosave(true);
      this.hud.toast(`Вы проспали ${r.hours} ч. Утро, день ${S.day}`, 4);
    }

    fixture() {
      const S = this.state, P = S.player, o = K.Places.town(this.T), p = P.mv.pos, b = K.basis(this.yaw, 0), E = K.Econ.state(S);
      const facing = (at, r) => { const dx = at[0] - p[0], dz = at[1] - p[2], d = Math.hypot(dx, dz); return d < r && (d < 0.6 || (dx * b.fwd[0] + dz * b.fwd[2]) / d > 0.45) ? d : Infinity; };
      let best = null, bd = Infinity;
      for (const bed of o.beds) { const d = facing(bed.at, 1.9); if (d < bd) { bd = d; best = { kind: 'bed', bed }; } }
      for (const ch of o.chests) if (ch.id === 'home' && E.homes.includes(ch.building) || ch.id === 'korni-hero' && P.team === 'elf' || ch.id === 'palace-hero' && P.team === 'guard' || ch.id === 'villain-hero' && P.team === 'villain') { const d = facing(ch.at, 1.6); if (d < bd) { bd = d; best = { kind: 'chest', chest: ch }; } }
      for (const sg of K.Places.signs()) if (Math.hypot(p[0] - sg.post[0], p[2] - sg.post[1]) < 2.2 && bd > 0.9) { bd = 0.9; best = { kind: 'sign', sign: sg }; }
      if (S.army && K.Villain && P.team === 'villain') {
        const FP = K.Places.FORT_PTS, G = S.guard;
        if (Math.hypot(p[0] - FP.table[0], p[2] - FP.table[1]) < 2.8 && bd > 0.5) { bd = 0.5; best = { kind: 'wartable' }; }
        if (S.army.saboteurs && S.army.saboteurs.length && Math.hypot(p[0] - FP.rope[0], p[2] - FP.rope[1]) < 2.6 && bd > 0.3) { bd = 0.3; best = { kind: 'rope' }; }
        if (G && G.siege) {
          for (const L of G.ladders) if (L.up && Math.hypot(p[0] - L.at[0], p[2] - L.at[1]) < 2.5 && bd > 0.25) { bd = 0.25; best = { kind: 'climb' }; }
          if (Math.hypot(p[0] - FP.banner[0], p[2] - FP.banner[1] - 8) < 4 && bd > 0.2) { bd = 0.2; best = { kind: 'banner' }; }
        }
      }
      if (S.guard && K.Guard && P.team === 'guard') {
        const G = S.guard, PP = K.Places.PALACE_PTS;
        if (G.siege) for (const L of G.ladders) if (L.up && Math.hypot(p[0] - L.top[0], p[2] - L.top[1]) < 3 && p[1] > 30 && bd > 0.2) { bd = 0.2; best = { kind: 'ladder', L }; }
        if (G.siege && !G.gate.broken && Math.hypot(p[0] - PP.lever[0], p[2] - PP.lever[1]) < 5 && bd > 0.6) { bd = 0.6; best = { kind: 'brace' }; }
        if (K.Guard.aditKnown(S) && (Math.hypot(p[0] - PP.adit.mouth[0], p[2] - PP.adit.mouth[1]) < 4 || Math.hypot(p[0] - PP.adit.exit[0], p[2] - PP.adit.exit[1]) < 3) && bd > 0.7) { bd = 0.7; best = { kind: 'adit' }; }
      }
      if (S.village && K.Elves) {
        const L = K.Elves, KO = K.Places.KORNI, V = S.village;
        for (const w of o.wells) { const d = facing(w.at, 1.9); if (d < bd) { bd = d; best = { kind: 'well', well: w }; } }
        const hid = L.houseAt(S, p, 2.6);
        if (hid && V.houses[hid].fire > 0 && !V.houses[hid].burnt && bd > 0.5) { bd = 0.5; best = { kind: 'pour', house: hid }; }
        { const d = facing(KO.store.at, 2.4); if (d < bd) { bd = d; best = { kind: 'store' }; } }
        const hi = L.herbAt(S, p);
        if (hi >= 0 && bd > 0.4) { bd = 0.4; best = { kind: 'herb', i: hi }; }
        const c = L.cacheAt(S, p);
        if (c && bd > 0.3) { bd = 0.3; best = { kind: 'cache', c }; }
        const sk = K.Places.CUTTERS.stack;
        if (Math.hypot(p[0] - sk[0], p[2] - sk[1]) < 4 && S.world && (S.world.sides.villain.ladders || S.world.sides.villain.ram || S.world.sides.villain.stock.logs >= 10) && bd > 1) { bd = 1; best = { kind: 'stack' }; }
        for (const ch of o.chests) if (ch.id === 'cutters-plans') { const d = facing(ch.at, 1.6); if (d < bd) { bd = d; best = { kind: 'plans' }; } }
        if (bagHas(P.bag, 'plans') && Math.hypot(p[0] - K.Places.PLAN_DROP.at[0], p[2] - K.Places.PLAN_DROP.at[1]) < 3.5 && bd > 0.8) { bd = 0.8; best = { kind: 'drop' }; }
      }
      for (const B of K.Places.BUILDINGS) if (B.price && !E.homes.includes(B.id)) { const d = facing(o.doors[B.id].at, 2.2); if (d < bd) { bd = d; best = { kind: 'deed', B }; } }
      return best;
    }

    fixLine(fx) {
      const P = this.state.player;
      if (fx.kind === 'chest') return '[E] Сундук';
      if (fx.kind === 'well') return P.bucket === 'full' ? 'Ведро полное: несите к огню' : '[E] Набрать ведро воды';
      if (fx.kind === 'pour') return P.bucket === 'full' ? '[E] Вылить ведро на огонь' : 'Горит! Ведро у колодца';
      if (fx.kind === 'store') return '[E] Кладовая Корней';
      if (fx.kind === 'herb') return '[E] Собрать травы';
      if (fx.kind === 'cache') return '[E] ' + fx.c.name;
      if (fx.kind === 'stack') return bagHas(P.bag, 'torch') ? '[E] Поджечь лестницы и таран Злого' : 'Лестницы и таран Злого: нужен факел';
      if (fx.kind === 'plans') return K.Elves.plansReady(this.state) ? '[E] Взять планы штурма' : 'Сундук рубщиков: пусто';
      if (fx.kind === 'drop') return '[E] Подбросить планы штурма к воротам';
      if (fx.kind === 'ladder') return '[E] Столкнуть лестницу';
      if (fx.kind === 'wartable') return '[E] Военный стол';
      if (fx.kind === 'sign') return '[E] Указатель';
      if (fx.kind === 'rope') return '[E] Перерезать верёвку';
      if (fx.kind === 'climb') return '[E] Лезть на стену';
      if (fx.kind === 'banner') return '[E] Поднять знамя на Белой башне';
      if (fx.kind === 'brace') return '[E] Подпереть ворота: прочность ' + Math.round(this.state.guard.gate.hp);
      if (fx.kind === 'adit') return '[E] Старый штрек';
      if (fx.kind === 'deed') return '[E] Купить: ' + fx.B.name.toLowerCase() + ', ' + fx.B.price + ' сер.';
      const may = K.Econ.bedOf(this.state, fx.bed);
      return may.ok ? '[E] Спать до утра' : fx.bed.kind === 'cot' ? 'Койка больных у Акима' : may.why;
    }

    useFixture(fx) {
      if (fx.kind === 'bed') this.sleepIn(fx.bed);
      else if (fx.kind === 'chest') this.showPanel(K.Screens.chest(this, fx.chest.building), 'chest');
      else if (fx.kind === 'deed') this.showPanel(K.Screens.deed(this, fx.B), 'deed');
      else this.elfFixture(fx);
    }

    elfFixture(fx) {
      const S = this.state, P = S.player, L = K.Elves, ear = this.ear();
      if (fx.kind === 'wartable') { this.openWar(); return; }
      if (fx.kind === 'sign') { this.hud.toast('Указатель: ' + this.signText(fx.sign), 6); return; }
      if (fx.kind === 'rope') { const ev = [], n = K.Villain.cutRope(S, ev); this.hud.toast(n ? `Верёвка перерезана: сорвались ${n}` : 'Верёвка перерезана, на ней никого', 3); this.sound.play('crack', { at: P.mv.pos, ear }); return; }
      if (fx.kind === 'climb') { if (K.Villain.climb(S, this.W, P)) { this.yaw = P.mv.yaw; this.hud.toast('Вы на стене дворца', 2); } return; }
      if (fx.kind === 'banner') { const ev = []; if (K.Villain.banner(S, P, ev)) { for (const e of ev) this.react({ events: [e], results: [], frozen: [] }); this.hud.toast('Знамя на Белой башне!', 5); } return; }
      if (fx.kind === 'ladder') { const ev = []; if (K.Guard.pushLadder(S, P, ev)) { this.hud.toast('Лестница рухнула вместе с теми, кто лез', 3); this.sound.play('crack', { at: P.mv.pos, ear }); } return; }
      if (fx.kind === 'brace') { if (K.Guard.brace(S)) this.hud.toast('Ворота подпёрты: прочность ' + Math.round(S.guard.gate.hp), 2); return; }
      if (fx.kind === 'adit') { const r = K.Guard.useAdit(S, this.W, P); if (r) { this.yaw = P.mv.yaw; K.Econ.pass(S, 1, { W: this.W, rnd: this.rnd }); this.track(true); this.hud.toast(r === 'fort' ? 'Штрек вывел в подвал Старого форта' : 'Вы вышли из штрека у рудника', 4); } return; }
      if (fx.kind === 'well') { if (P.bucket === 'full') return; P.bucket = 'full'; this.sound.play('splash', { at: P.mv.pos, ear }); this.hud.toast('Ведро воды'); }
      else if (fx.kind === 'pour') {
        if (P.bucket !== 'full') { this.hud.toast('Ведро у колодца'); return; }
        L.pour(S, fx.house, L.POUR);
        P.bucket = 'empty';
        this.sound.play('splash', { at: P.mv.pos, ear, power: 1.3 });
        const h = S.village.houses[fx.house];
        this.hud.toast(h.fire > 0 ? 'Огонь ещё горит: ещё ведро! Жителей зовите (E на жителе)' : 'Огонь сбит', 3);
      } else if (fx.kind === 'store') this.showPanel(K.Screens.store(this), 'store');
      else if (fx.kind === 'herb') { const n = L.pick(S, P, fx.i); if (n) this.hud.toast('Травы: +' + n + '. Рябине или в кладовую'); }
      else if (fx.kind === 'cache') { const got = L.openCache(S, P, fx.c); if (got) this.hud.toast(fx.c.name + ': ' + got.map(([id, n]) => K.Data.ITEMS[id].name.toLowerCase() + (n > 1 ? ' ×' + n : '')).join(', '), 5); }
      else if (fx.kind === 'stack') {
        if (!bagHas(P.bag, 'torch')) { this.hud.toast('Нужен факел'); return; }
        const had = L.burnStack(S);
        if (had) { if (P.team === 'elf') L.respect(S, 6, 'таран'); this.hud.toast(`Сгорели лестницы (${had.ladders}) и таран (${had.ram ? 'был' : 'не было'}). Готовность Злого падает`, 5); }
      } else if (fx.kind === 'plans') { if (L.takePlans(S, P)) this.hud.toast('Взяты планы штурма Злого. Подбросить к воротам дворца: империя станет терпимее к эльфам', 6); }
      else if (fx.kind === 'drop') { if (L.deliverPlans(S, P)) this.hud.toast('Планы у ворот. Стража найдёт их. Огня на Корни ждать меньше', 5); }
      S.version++;
    }

    payDay() {
      const S = this.state, P = S.player;
      for (const e of K.Econ.daily(S, P.bag)) {
        if (e.kind === 'paid') this.hud.toast(`Жалованье: ${K.Body.nameOf(e.who)}, ${e.price} сер.`);
        else {
          const door = K.Places.town(this.T).doors.inn;
          e.who.squad = null;
          e.who.team = 'town';
          e.who.act = { kind: 'stand', post: door.at.slice(), face: door.face };
          this.hud.toast(`${K.Body.nameOf(e.who)} ушёл: нечем платить`, 4);
        }
      }
      if (S.squad && !S.people.some(q => q.squad === 'player')) S.squad = null;
    }

    wearStep(dt) {
      const S = this.state, P = S.player, w = this.wearing;
      w.t += dt;
      if (w.t < WEAR_TIME) return;
      this.wearing = null;
      if (K.Econ.selfFit(P, w.id, w.place)) { S.version++; this.hud.toast('Надето: ' + K.Data.ITEMS[w.id].name.toLowerCase()); }
    }

    roadThing() {
      const S = this.state, P = S.player, p = P.mv.pos, Cv = K.Caravan, b = K.basis(this.yaw, 0);
      const ahead = (x, z, r) => { const dx = x - p[0], dz = z - p[2], d = Math.hypot(dx, dz); return d < r && (d < 0.8 || (dx * b.fwd[0] + dz * b.fwd[2]) / d > 0.3); };
      const st = Cv.STORES[P.team];
      if (st && Cv.cargoKg(P.bag) > 0 && Math.hypot(p[0] - st.at[0], p[2] - st.at[1]) < st.r) return { kind: 'store', store: st };
      const sawn = Cv.nearSawn(S, p, ROAD_REACH + 0.4);
      if (sawn && ahead(sawn.at[0], sawn.at[1], ROAD_REACH + 0.4)) return { kind: 'sawn', spot: sawn };
      const h = Cv.nearHarness(S, p, ROAD_REACH);
      if (h && (h.c.state === 'stopped' || h.c.state === 'led') && ahead(h.beast.mv.pos[0], h.beast.mv.pos[2], ROAD_REACH)) return { kind: 'harness', c: h.c };
      const cart = Cv.nearCart(S, p, ROAD_REACH);
      if (cart) return { kind: 'cart', c: cart.c, i: cart.i };
      return null;
    }

    roadLine(r) {
      if (r.kind === 'store') return '[E] Сложить груз: ' + r.store.name;
      if (r.kind === 'sawn') return '[E] Свалить дерево с охряной меткой';
      if (r.kind === 'harness') return r.c.state === 'led' ? '[E] Отпустить упряжь' : '[E] Взять упряжь: вести корован';
      return '[E] Телега: груз';
    }

    useRoad(r) {
      const S = this.state, P = S.player, Cv = K.Caravan;
      if (r.kind === 'store') { const d = Cv.deposit(S, P); if (d) this.hud.toast(`Сложено: ${d.n} шт. в ${d.name}`, 4); S.version++; return; }
      if (r.kind === 'sawn') { this.felling = { spot: r.spot, t: 0, tick: 0 }; this.hud.toast('Подрубаю дерево…'); return; }
      if (r.kind === 'harness') {
        if (r.c.state === 'led') { Cv.release(S, r.c); this.hud.toast('Упряжь отпущена'); return; }
        const res = Cv.lead(S, r.c);
        this.hud.toast(res.ok ? 'Вы ведёте корован: идите, волы пойдут следом' + (Cv.STORES[P.team] && Cv.STORES[P.team].cart ? '' : '. Телега в лес не пройдёт, груз носят в кладовую') : res.why, 4);
        return;
      }
      this.showPanel(K.Screens.cart(this, r.c, r.i), 'cart');
    }

    cartTake(c, i, goods) {
      const S = this.state, r = K.Caravan.take(S, S.player, c, i, goods);
      if (!r.ok) return r.why;
      S.version++;
      return goods === 'silver' ? `Забрано ${r.silver} сер.` : goods === 'bells' ? 'Бубенцы сняты: телега идёт без звона' : `Взято, ${r.kg} кг`;
    }

    cartFriends(c, i) {
      const S = this.state, got = K.Caravan.friendsCarry(S, S.player, c, i);
      S.version++;
      return got.length ? 'Несут свои: ' + got.map(q => K.Body.nameOf(q)).join(', ') : 'Своим больше не унести';
    }

    fellStep(dt) {
      const S = this.state, P = S.player, f = this.felling;
      if (Math.hypot(P.mv.pos[0] - f.spot.at[0], P.mv.pos[2] - f.spot.at[1]) > ROAD_REACH + 1.2 || P.fight.down) { this.felling = null; return; }
      f.t += dt;
      f.tick -= dt;
      if (f.tick <= 0) { f.tick = 0.5; this.sound.play('chop', { at: [f.spot.at[0], P.mv.pos[1] + 1, f.spot.at[1]], ear: this.ear() }); }
      if (f.t < K.Caravan.FELL_TIME) return;
      this.felling = null;
      if (K.Caravan.fell(S, f.spot.id)) this.hud.toast('Дерево падает на дорогу', 3);
    }

    ear() {
      const c = this.camera(), b = K.basis(c.yaw, 0);
      return { eye: c.eye, right: b.right };
    }

    news() {
      const S = this.state, E = K.World.state(S), side = S.player.team;
      if (this.seenReports === undefined) this.seenReports = E.reports.length;
      if (this.seenReports > E.reports.length) this.seenReports = 0;
      for (let i = this.seenReports; i < E.reports.length; i++) {
        const r = E.reports[i];
        if (r.level >= 2 && (r.side === side || r.side === 'all')) this.hud.toast((r.level >= 3 ? 'Тревога: ' : 'Донесение: ') + r.text, 5);
      }
      this.seenReports = E.reports.length;
    }

    smoke() {
      const S = this.state, out = [], eye = this.camera().eye, t = this.time, wx = K.Weather.at(S), wd = wx.windDir, ws = 0.4 + wx.wind * 1.2;
      for (const s of S.smokes || []) {
        if (Math.hypot(s.at[0] - eye[0], s.at[2] - eye[2]) > 1600) continue;
        for (let k = 0; k < 18; k++) {
          const ph = ((t * 0.05 + k / 18) % 1), y = s.at[1] + 1 + ph * 62 / (0.6 + ws * 0.4), drift = ph * ph * 22 * ws;
          out.push([s.at[0] + wd[0] * drift + Math.sin(k * 2.1 + t * 0.3) * 1.5, y, s.at[2] + wd[1] * drift + Math.cos(k * 1.7) * 1.5, 2.2 + ph * 11]);
        }
      }
      return out;
    }

    buyInfo() {
      const S = this.state, P = S.player, W = K.World;
      if (!K.Econ.pay(S, P.bag, 25)) return 'Не хватает серебра: нужно 25';
      const day = W.nextTreasury(S), spy = W.spyNews(S), V = W.state(S).sides.villain;
      const lines = [day ? `Казённый корован выйдет из Мостовицы в день ${day} в 8 утра` : 'Казённого корована на этой неделе не будет'];
      lines.push(spy ? 'По тракту идёт человек Злого под видом горожанина' : 'Чужих среди гостей сегодня нет');
      if (V.readiness >= 70) lines.push('В форте строят лестницы, люди Злого покупают верёвки');
      return '«' + lines.join('. ') + '.»';
    }

    bells(dt) {
      const S = this.state, P = S.player, heard = K.Caravan.hears(S, P.mv.pos), E = K.Caravan.state(S);
      this.jingle = (this.jingle || 0) - dt;
      if (heard.length && this.jingle <= 0) {
        this.jingle = JINGLE;
        for (const h of heard) this.sound.play('jingle', { at: h.at, ear: this.ear(), far: K.Caravan.BELLS });
      }
      for (const h of heard) if (!E.heard[h.c.id]) {
        E.heard[h.c.id] = true;
        this.hud.toast('Слышны бубенцы: ' + K.Caravan.KINDS[h.c.kind].name, 4);
        S.heard = (S.heard || []).filter(x => x.id !== h.c.id);
        S.heard.push({ id: h.c.id, kind: h.c.kind, at: [h.at[0], h.at[2]], day: S.day, hour: Math.floor(S.hour) });
        if (S.heard.length > HEARD_CAP) S.heard.splice(0, S.heard.length - HEARD_CAP);
      }
    }

    villageTick(dt) {
      const S = this.state, V = S.village, P = S.player, L = K.Elves, KO = K.Places.KORNI;
      this.hud.goal(this.goalLine());
      const fire = L.burning(S).length > 0;
      this.hud.alarm(P.team === 'elf' && V.alarm, P.team === 'elf' && fire);
      if (V.horn) {
        V.horn = false;
        const at = [KO.oak[0], this.T.heightAt(KO.oak[0], KO.oak[1]) + 12, KO.oak[1]];
        if (Math.hypot(at[0] - P.mv.pos[0], at[2] - P.mv.pos[2]) < 900) { this.sound.play('horn', { at, ear: this.ear(), far: 900 }); if (P.team === 'elf') this.hud.toast('Трубит рог Корней: набег!', 4); }
      }
      this.crackle = (this.crackle || 0) - dt;
      if (fire && this.crackle <= 0) {
        this.crackle = 1.3;
        const o = K.Places.town(this.T), id = L.burning(S)[0], h = o.houses[id];
        if (Math.hypot(h.at[0] - P.mv.pos[0], h.at[1] - P.mv.pos[2]) < 70) this.sound.play('fire', { at: [h.at[0], h.floor + 2, h.at[1]], ear: this.ear(), far: 70 });
      }
      if (P.team === 'elf') { const m = L.morning(S); if (m && S.day > 1) this.hud.toast('Донесения разведчиков: ' + m.lines.join('; '), 9); }
      if (V.endingNew && S.campaign && S.campaign.ending && !this.panel) { V.endingNew = false; if (P.team === 'elf') this.showPanel(K.Screens.ending(this, S.campaign.ending), 'ending'); }
    }

    signText(sg) {
      const ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'], yaw = this.state.player.mv.yaw;
      return sg.arms.map(a => { let r = Math.atan2(a.dir[0], -a.dir[1]) - yaw; r = Math.atan2(Math.sin(r), Math.cos(r)); return ARROWS[(Math.round(r / (Math.PI / 4)) + 8) % 8] + ' ' + a.to; }).join(' · ');
    }

    openWar() {
      const S = this.state, A = S.army, step = K.Villain.introStep(S);
      if (!A.table && step !== 'table') { this.hud.toast(step === 'free' ? 'Военный стол стоит в зале форта' : 'Военный стол ждёт: сначала ' + (K.Villain.introGoal(S) || 'дела во дворе').toLowerCase(), 3); return; }
      if (!A.table && Math.hypot(S.player.mv.pos[0] - K.Places.FORT_PTS.table[0], S.player.mv.pos[2] - K.Places.FORT_PTS.table[1]) > 4) { this.hud.toast('Военный стол стоит в зале форта', 3); return; }
      this.showPanel(K.Screens.warTable(this), 'war');
    }

    villainTick() {
      const S = this.state, A = S.army;
      this.hud.goal(this.villainLine());
      if (A.endingNew && S.campaign && S.campaign.ending && !this.panel) { A.endingNew = false; this.showPanel(K.Screens.ending(this, S.campaign.ending), 'ending'); }
    }

    guardTick() {
      const S = this.state, G = S.guard;
      if (!S.village || S.player.team !== 'elf') this.hud.goal(this.orderLine());
      if (G.endingNew && S.campaign && S.campaign.ending && !this.panel) { G.endingNew = false; this.showPanel(K.Screens.ending(this, S.campaign.ending), 'ending'); }
      if (G.order && G.order.skip && G.order.state === 'done') { const h = G.order.skip; G.order.skip = 0; K.Econ.pass(S, h, { W: this.W, rnd: this.rnd }); this.hud.toast(`Наряд отбыт: прошло ${h} ч`, 3); }
    }

    hookArm() {
      const L = K.Wounds.limbs(this.state.player.kit);
      return L.arms.l.kind === 'hook' || L.arms.r.kind === 'hook';
    }

    fitGlow() {
      const S = this.state, P = S.player, f = this.fitting;
      if (!f || !f.place || !P.frames) return null;
      const parent = { lFore: 3, rFore: 4, lShin: 7, rShin: 8, 'eye.l': 0, 'eye.r': 0 }[f.place];
      const cap = K.Body.capsules(P.kit, P.frames).find(c => c[0] === parent);
      if (!cap) return null;
      const at = parent === 0 ? [(cap[1][0] + cap[2][0]) / 2, (cap[1][1] + cap[2][1]) / 2 + 0.04, (cap[1][2] + cap[2][2]) / 2] : cap[2];
      const pulse = 0.55 + 0.45 * Math.sin(this.time * 5);
      return [at[0], at[1], at[2], 1, 0.82, 0.3, 0.32 * pulse + 0.12];
    }

    closePanel(relock) {
      if (this.panelKind === 'fit') this.fitting = null;
      if (this.panel) this.panel.remove();
      this.panel = null;
      this.panelKind = null;
      this.searching = null;
      this.root.focus({ preventScroll: true });
      if (relock) this.lock();
    }

    takeItem(body, key, quiet) {
      const item = K.Body.take(body, key, this.state.player.bag, this.state);
      if (!item) return null;
      if (K.Guard && body.who && body.who.team !== this.state.player.team) K.Guard.lootNote(this.state, item.id, item.n);
      this.state.version++;
      if (!quiet) this.hud.toast('Взято: ' + K.Data.ITEMS[item.id].name + (item.n > 1 ? ' ×' + item.n : ''));
      return item;
    }

    takeAll(body) {
      const got = K.Body.belongings(body, this.state).map(it => this.takeItem(body, it.key, true)).filter(Boolean);
      if (got.length) this.hud.toast('Взято: ' + got.map(it => K.Data.ITEMS[it.id].name + (it.n > 1 ? ' ×' + it.n : '')).join(', '));
      return got;
    }

    pickUp(thing) {
      const S = this.state, P = S.player, F = P.fight, list = thing.uid !== undefined ? S.items : S.parts, id = thing.item;
      list.splice(list.indexOf(thing), 1);
      S.version++;
      const place = thing.owner === 'player' && K.Data.ITEMS[id].kind === 'prosthesis' ? K.Econ.freeFor(P, id) : null;
      if (place) {
        const have = P.bag.find(s => s.id === id);
        if (have) have.n++; else P.bag.push({ id, n: 1 });
        this.wearing = { id, place, t: 0 };
        this.hud.toast('Надеваю: ' + K.Data.ITEMS[id].name.toLowerCase() + ' (5 с)');
        return;
      }
      const c = K.Wounds.caps(P.kit), W = K.Data.WEAPONS[id];
      if (W && F && !F.weapon && c.weapon && (W.hands === 1 || c.twoHanded || (id === 'spear' && c.weapon))) {
        F.weapon = id;
        F.hand = K.Wounds.handFor(P.kit, F.hand) || 'r';
        if (W.hands === 2 && id !== 'spear' && F.shield) { F.shield = false; P.bag.push({ id: 'shield', n: 1 }); }
        this.hud.toast('В руке: ' + K.Data.ITEMS[id].name.toLowerCase() + (F.hand === 'l' ? ' (левой)' : ''));
        return;
      }
      if (id === 'shield' && F && !F.shield && c.shield && (!F.weapon || K.Data.WEAPONS[F.weapon].hands === 1 || F.weapon === 'spear')) {
        F.shield = true;
        this.hud.toast('Щит в руке');
        return;
      }
      const have = P.bag.find(s => s.id === id);
      if (have) have.n++; else P.bag.push({ id, n: 1 });
      this.hud.toast('Поднято: ' + K.Data.ITEMS[id].name);
    }

    exit() {
      if (this.opts.onExit) this.opts.onExit();
    }

    setView(v) {
      if (!this.ready) return;
      const P = this.state.player;
      if (v.pos) P.mv = K.Move.body(this.W, v.pos[0], v.pos[1], v.yaw || 0);
      if (v.yaw !== undefined) this.yaw = v.yaw;
      if (v.pitch !== undefined) this.pitch = v.pitch;
      if (v.hour !== undefined) this.hour = v.hour;
      if (v.mode) this.mode = v.mode;
      if (v.hero) this.setHero(v.hero);
      this.free = v.free ? { pos: v.free.slice() } : null;
      this.fogScale = v.fogScale || 1;
      if (v.dither !== undefined) this.settings.dither = !!v.dither;
      if (v.treeRadius) this.settings.treeRadius = v.treeRadius;
      if (v.border !== undefined) this.settings.border = !!v.border;
      this.track(true);
      this.dirty = true;
    }

    frame(ts) {
      this.raf = requestAnimationFrame(this.loop);
      const now = ts / 1000;
      let dt = this.last ? now - this.last : 0;
      this.last = now;
      if (dt > 0.25) dt = 0.25;
      const active = this.isActive() && !document.hidden;
      this.paused = !active || !!this.menu || PAUSING.has(this.panelKind) || !!this.hold;
      if (!active) { this.keys.clear(); this.edges.clear(); }
      if (this.paused && this.sound) this.sound.rain(0);
      if (this.stop > 0) {
        this.stop -= dt;
        this.acc = 0;
      } else if (!this.paused) {
        this.acc += dt;
        while (this.acc >= DT) {
          this.update(DT);
          this.acc -= DT;
          if (this.stop > 0) { this.acc = 0; break; }
        }
        this.dirty = true;
      } else {
        this.acc = 0;
      }
      if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt * 2.2); this.dirty = true; }
      if (this.hud) this.hud.update(dt);
      if (!this.dirty) return;
      this.draw();
      this.dirty = false;
      this.frames++;
    }

    aim() {
      const c = this.camera(), b = K.basis(c.yaw, c.pitch), S = this.state;
      const hit = K.Body.pick(S.bodies.filter(x => x.frozen && !x.carrier), c.eye, b.fwd, SEARCH_REACH);
      let thing = null, bt = SEARCH_REACH;
      const ray = K.v3.add(c.eye, K.v3.scale(b.fwd, SEARCH_REACH));
      const consider = (it, a, e, r) => {
        const sd = K.Combat.segDist(c.eye, ray, a, e), dist = K.v3.len(K.v3.sub(sd.at, c.eye));
        if (sd.d < r && dist < bt) { bt = dist; thing = it; }
      };
      for (const it of S.items) if (it.frozen) consider(it, [it.pts[0], it.pts[1], it.pts[2]], [it.pts[3], it.pts[4], it.pts[5]], 0.12);
      for (const pc of S.parts) {
        if (!pc.frozen || !pc.item) continue;
        const a = pc.anchor * 3, o = [pc.pts[a], pc.pts[a + 1], pc.pts[a + 2]];
        consider(pc, o, o, 0.2);
      }
      let dummy = null, best = TOPPLE_REACH;
      for (const p of S.people) {
        const q = p.mv.pos, dx = q[0] - c.eye[0], dy = q[1] + 1.1 - c.eye[1], dz = q[2] - c.eye[2], d = Math.hypot(dx, dy, dz);
        if (d > best || d < 0.3 || p.kit.side === 'straw') continue;
        const along = dx * b.fwd[0] + dy * b.fwd[1] + dz * b.fwd[2];
        if (along <= 0) continue;
        const off = Math.sqrt(Math.max(0, d * d - along * along));
        if (off < 0.55) { best = d; dummy = p; }
      }
      const body = hit ? hit.body : null, stuck = K.Missile.pickNear(S, c.eye, b.fwd, SEARCH_REACH);
      const meat = K.Body.pick((S.carcasses || []).filter(x => !x.piece), c.eye, b.fwd, SEARCH_REACH), carcass = meat && (!hit || meat.dist < hit.dist) && (!thing || meat.dist < bt) ? meat.body : null;
      return { body: carcass ? null : thing && (!body || bt < hit.dist) ? null : body, thing: carcass ? null : thing && (!body || bt < hit.dist) ? thing : null, dummy, stuck: !thing && !body && !carcass ? stuck : null, carcass };
    }

    update(dt) {
      const k = c => this.keys.has(c) ? 1 : 0, edge = c => this.edges.has(c);
      const shift = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
      const S = this.state, W = this.W, P = S.player, F = P.fight, down = !!(F && F.down), R = this.rules();
      if (F && F.rules !== R) F.rules = R;
      if (edge('KeyV')) this.mode = this.mode === 'first' ? 'third' : 'first';
      if (edge('F2')) this.free = this.free ? null : { pos: this.camera().eye.slice() };
      if (edge('F3')) this.debugOn = !this.debugOn;
      if (edge('F4')) this.hour = (Math.floor(this.hour) + 1) % 24;
      if (edge('F7')) this.forceWeather();
      if (edge('F5')) this.quickSave();
      if (edge('F9')) { this.quickLoad(); this.edges.clear(); return; }
      this.yaw += (k('ArrowRight') - k('ArrowLeft')) * 1.8 * dt;
      this.pitch = K.clamp(this.pitch + (k('ArrowUp') - k('ArrowDown')) * 1.2 * dt, -1.45, 1.45);
      const target = this.free || down ? { body: null, thing: null, dummy: null } : this.aim();
      this.target = target;
      if (edge('F6') && target.dummy && !target.dummy.team) this.topple(target.dummy);
      if (edge('KeyQ') && F && !down && !this.panel && !this.free) this.toggleOrders(!this.orders);
      if (this.orders) for (let i = 0; i < ORDER_KEYS.length; i++) if (edge(ORDER_KEYS[i])) { this.edges.delete(ORDER_KEYS[i]); this.command(i); }
      if (edge('KeyG') && F && !down && !this.panel && !this.free) this.carryKey();
      if (edge('Digit5') && F && !down && !this.panel && !this.free && !this.orders) this.torchKey();
      if (P.skinning) this.skinStep(dt);
      if (edge('KeyB') && F && !down && !this.panel && !this.free) this.bandage();
      if (edge('KeyH') && F && !down && !this.panel && !this.free) this.hud.toast(K.Wounds.drink(P, P.bag) ? 'Настойка выпита: кровь идёт вдвое медленнее 60 с' : 'Нет настойки');
      if (edge('KeyT') && F && !down && !this.panel && !this.free && !this.menu) this.showPanel(K.Screens.wait(this), 'wait');
      if (edge('KeyM') && !down && !this.panel && !this.menu) { this.edges.clear(); this.openMap(); return; }
      if (edge('KeyJ') && !down && !this.panel && !this.menu && S.village && P.team === 'elf') { this.edges.clear(); this.showPanel(K.Screens.village(this), 'village'); return; }
      if (edge('KeyJ') && !down && !this.panel && !this.menu && S.guard && P.team === 'guard') { this.edges.clear(); this.showPanel(K.Screens.book(this), 'book'); return; }
      if (S.guard && P.team === 'guard') this.guardTick();
      if (edge('KeyJ') && !down && !this.panel && !this.menu && S.army && P.team === 'villain') { this.edges.clear(); this.openWar(); return; }
      if (S.army && P.team === 'villain') this.villainTick();
      if (edge('KeyZ') && F && !down && !this.panel && !this.free && S.village) { const r = K.Elves.place(S, P, bagHas(P.bag, 'stakes') ? 'pit' : 'snare'); this.hud.toast(r.ok ? (r.trap.kind === 'pit' ? 'Яма с кольями поставлена' : 'Петля поставлена') + ': свои её обходят' : r.why, 3); }
      if (S.village) this.villageTick(dt);
      if (this.wearing) this.wearStep(dt);
      if (this.felling) this.fellStep(dt);
      this.bells(dt);
      this.news();
      this.payDay();
      if (F && !down && !this.panel && !this.free && !this.orders) {
        for (const [code, list] of Object.entries(MODE_KEY)) if (edge(code)) this.pickMode(list);
        if (this.wheel) { this.cycleMode(this.wheel > 0 ? 1 : -1); this.wheel = 0; }
        if (edge('KeyR') && F.mode === 'crossbow' && !K.Missile.reload(P)) this.hud.toast(F.loaded ? 'Арбалет заряжен' : !K.Missile.count(P, 'bolt') ? 'Нет болтов' : 'Перезарядить можно только двумя руками');
      }
      let use = edge('KeyE');
      const talk = target.dummy && target.dummy.role && talkOf(target.dummy, P) && !target.dummy.fight.hostile && Math.hypot(target.dummy.mv.pos[0] - P.mv.pos[0], target.dummy.mv.pos[2] - P.mv.pos[2]) < TALK_REACH ? target.dummy : null;
      this.road = !down && !this.free && !this.panel && !talk ? this.roadThing() : null;
      this.fix = !down && !this.free && !this.panel && !talk && !this.road ? this.fixture() : null;
      if (use && talk && !down && !P.carry) { use = false; this.edges.clear(); this.openTalk(talk); }
      if (use && target.carcass && !down && !P.carry) { use = false; this.startSkin(target.carcass); }
      const held = target.dummy && target.dummy.state && target.dummy.state !== 'jailed' && Math.hypot(target.dummy.mv.pos[0] - P.mv.pos[0], target.dummy.mv.pos[2] - P.mv.pos[2]) < 2.4 ? target.dummy : null;
      if (use && held && !down) { use = false; this.edges.clear(); this.openCaptive(held); }
      else if (use && target.body && !P.carry) { use = false; this.edges.clear(); this.openSearch(target.body); }
      else if (use && target.thing) { use = false; this.pickUp(target.thing); }
      else if (use && target.stuck) { use = false; const id = K.Missile.collect(S, P, target.stuck); if (id) this.hud.toast('Подобрано: ' + K.Data.ITEMS[id].name.toLowerCase()); }
      else if (use && F && F.shieldLoad && F.shield && K.Missile.pull(P)) { use = false; this.hud.toast('Вырываю сулицу из щита'); }
      else if (use && !down && this.chairUse()) use = false;
      else if (use && this.road && !P.carry && !this.felling) { use = false; this.edges.clear(); this.useRoad(this.road); }
      else if (use && this.fix && !P.carry) { use = false; this.edges.clear(); this.useFixture(this.fix); }
      if (F && !down) {
        F.aim = { eye: [P.mv.pos[0], P.mv.pos[1] + P.mv.eye, P.mv.pos[2]], yaw: this.yaw, pitch: this.pitch };
        if (!this.panel && !this.free) {
          if (this.mouse.press && P.carry) this.hud.toast('Руки заняты: G, чтобы положить');
          else if (this.mouse.press && this.handsBusy()) this.hud.toast(P.mv.pushing ? 'Руки заняты коляской' : 'Руки на колёсах: остановитесь');
          else if (this.mouse.press && K.Missile.ranged(F)) { if (!K.Missile.press(P) && F.mode === 'crossbow' && !F.loaded && !F.reload) this.hud.toast(K.Missile.count(P, 'bolt') ? 'Перезарядить можно только двумя руками' : 'Нет болтов'); }
          else if (this.mouse.press) K.Combat.press(F);
          if (P.carry) { if (F.act) F.act = null; }
          else if (this.mouse.release && K.Missile.ranged(F)) K.Missile.release(P, S, this.rnd);
          else if (this.mouse.release) K.Combat.release(F, P.mv);
          if (this.mouse.rmb && K.Missile.ranged(F) && F.draw && !F.draw.fire) K.Missile.cancel(F);
          if (this.mouse.rmb && !F.guard) K.Combat.guard(F, true, F.lastGuard || 'right');
          else if (!this.mouse.rmb && F.guard) { F.lastGuard = F.guard.dir; K.Combat.guard(F, false); }
          if (edge('KeyF')) {
            const hook = this.hookArm() ? K.Combat.hookShield(S, P) : null;
            if (hook) { this.hud.toast('Зацеп: щит отведён'); for (const e of K.AI.law(S, [hook])) this.react({ events: [e], results: [] }); }
            else K.Combat.kick(F, P.mv);
          }
        }
      }
      this.mouse.press = false;
      this.mouse.release = false;
      if (this.free) {
        const b = K.basis(this.yaw, this.pitch), sp = (shift ? 60 : 18) * dt;
        const f = k('KeyW') - k('KeyS'), s = k('KeyD') - k('KeyA'), u = k('Space') - k('KeyC'), p = this.free.pos;
        this.free.pos = [p[0] + (b.fwd[0] * f + b.right[0] * s) * sp, p[1] + (b.fwd[1] * f + u) * sp, p[2] + (b.fwd[2] * f + b.right[2] * s) * sp];
      } else if (!this.panel && !down) {
        P.mv.limit = K.Wounds.caps(P.kit);
        P.mv.brush = P.kit.side !== 'elf';
        P.mv.aid = bagHas(P.bag, 'crutch') ? 'crutch' : null;
        P.mv.load = P.carry ? (K.Wounds.caps(P.kit).carry ? 'carry' : 'drag') : null;
        const still = F && F.binding, fwd = still ? 0 : k('KeyW') - k('KeyS'), side = still ? 0 : k('KeyD') - k('KeyA');
        if (P.mv.chair) this.rideChair(dt, { fwd, side });
        else {
          if (P.mv.pushing) P.mv.walk = true;
          K.Move.step(P.mv, { fwd, side, sprint: shift && !P.mv.pushing, jump: edge('Space') && !P.mv.pushing, crouch: edge('KeyC'), walk: edge('KeyX'), use, yaw: this.yaw }, dt, W);
          if (P.mv.pushing) this.pushChair(dt);
        }
      }
      if (P.mv.edge && !(this.edgeT > S.time)) { this.edgeT = S.time + 4; this.hud.toast('Дальше не пройти: ' + K.Edge.reason(this.T, P.mv.pos[0], P.mv.pos[2])); }
      K.Anim.update(P.anim, P.mv, dt);
      const r = K.AI.run(S, dt, W, this.rnd, this.pose);
      this.react(r);
      const eye = this.camera().eye, seen = b => this.seen(b);
      if (K.Body.trim(S.bodies, eye, seen, this.settings.bodies).length + K.Body.trim(S.parts, eye, seen, K.Body.PIECE_CAP).length + K.Body.trim(S.items, eye, seen, K.Body.ITEM_CAP).length) S.version++;
      this.renderer.fx.update(dt, this.T, S, this.settings.blood);
      this.edges.clear();
      const hour = (this.hour + dt / 80) % 24;
      if (hour < this.hour) S.day++;
      this.hour = hour;
      S.hour = hour;
      S.time += dt;
      this.weatherStep();
      this.track(false);
    }

    react(r) {
      const S = this.state, P = S.player, fx = this.renderer.fx, blood = this.settings.blood, cam = this.camera();
      const ear = { eye: cam.eye, right: K.basis(cam.yaw, 0).right };
      const mine = e => e.who === P || e.to === P;
      const blind = K.Wounds.caps(P.kit).blind;
      for (const e of r.events) {
        if (blind && e.at && e.kind !== 'drip') this.hearAt(e.at, e.kind === 'whoosh' ? 0.4 : 0.9);
        if (e.kind === 'drip') continue;
        if (e.kind === 'bound') { if (e.who === P) this.hud.toast(e.to === P ? 'Перевязано' : 'Перевязали: ' + K.Body.title(e.to.kit).toLowerCase()); else if (e.to === P) this.hud.toast('Вас перевязали'); continue; }
        if (e.kind === 'unrescued' && e.who === P) { this.fallen('Вас некому было вынести', 'Вы истекли кровью без сознания.'); continue; }
        if (e.kind === 'rescued') { this.rescued(e); continue; }
        if (e.kind === 'surrender') { if (K.v3.len(K.v3.sub(e.who.mv.pos, P.mv.pos)) < 30) this.hud.toast('Сдаётся: ' + K.Body.nameOf(e.who)); continue; }
        if (e.kind === 'call') { if (K.v3.len(K.v3.sub(e.who.mv.pos, P.mv.pos)) < 40) this.hud.toast(K.Body.nameOf(e.who) + ' зовёт своих'); continue; }
        if (e.kind === 'jailed') { if (e.who.captor === 'player') this.hud.toast('Пленный сдан: ' + e.prison.name, 4); continue; }
        if (e.kind === 'healed') {
          if (e.by === 'player') this.hud.toast(e.dead ? e.healer.name + ': он мёртв' : e.healer.name + ' принимает: ' + K.Body.nameOf(e.who) + (e.who.team === P.team ? ', долг ' + e.who.debt : ''), 4);
          continue;
        }
        if (e.kind === 'knife' || e.kind === 'tied' || e.kind === 'growl' || e.kind === 'packFlees') { if (e.kind === 'growl') this.sound.play('growl', { at: e.at, ear }); continue; }
        if (e.kind === 'bark') { this.sound.play('bark', { at: e.at, ear }); continue; }
        if (e.kind === 'owner') { this.hud.toast('Хозяева скотины этого не простят'); continue; }
        if (e.kind === 'offense') {
          if (e.who === P) this.hud.toast('Здесь не воюют! Городская стража идёт за вами', 4);
          else if (K.v3.len(K.v3.sub(e.who.mv.pos, P.mv.pos)) < 40) this.hud.toast('Драка в городе: стража идёт за ' + (K.Body.nameOf(e.who) || 'зачинщиком'), 3);
          continue;
        }
        if (e.kind === 'hooked') continue;
        if (e.kind === 'treefall') { this.sound.play('crack', { at: e.at, ear, far: 160 }); continue; }
        if (e.kind === 'crushed') { if (e.who === P) this.hud.toast('Вас придавило деревом'); continue; }
        if (e.kind === 'lost') {
          if (e.caravan.kind === 'trade') { const bf = K.Places.LANDMARKS.find(L => L.id === 'belfry'), at = [bf.at[0], this.T.heightAt(bf.at[0], bf.at[1]) + 24, bf.at[1]]; if (Math.hypot(at[0] - P.mv.pos[0], at[2] - P.mv.pos[2]) < 900) { this.sound.play('bell', { at, ear, far: 900 }); this.hud.toast('В Мостовице звонит колокол: пропал корован', 4); } }
          continue;
        }
        if (e.kind === 'witness') { this.hud.toast(`Свидетель дошёл до места «${e.haven}»: ${K.Caravan.KINDS[e.caravan.kind].name} ограбили` + (e.player ? ', на вас показали' : ''), 5); continue; }
        if (e.kind === 'delivered') { this.hud.toast(`Корован приведён: ${e.bales} шт. груза в ${e.store}` + (e.silver ? `, ${e.silver} сер.` : ''), 5); continue; }
        if (e.kind === 'cleared') { if (Math.hypot(e.spot.at[0] - P.mv.pos[0], e.spot.at[1] - P.mv.pos[2]) < 60) this.hud.toast('Охрана корована распилила завал'); continue; }
        if (e.kind === 'arrived' || e.kind === 'supplied') continue;
        if (e.kind === 'intro') { if (e.goal) this.hud.toast(e.goal, 5); continue; }
        if (e.kind === 'skip') { this.villainEvents([e]); continue; }
        if (e.kind === 'army') { if (P.team === 'villain' && e.who && e.who.length === 1) this.hud.toast(`${e.who[0]}: ${e.why} (верность ${e.dl > 0 ? '+' : ''}${e.dl}, страх ${e.df > 0 ? '+' : ''}${e.df})`, 3); continue; }
        if (e.kind === 'pay') { if (P.team === 'villain') this.hud.toast(`Жалованье: получили ${e.paid} из ${e.total}`, 4); continue; }
        if (e.kind === 'report') { if (P.team === 'villain') { const r = e.report, O = K.Villain.ORDERS[r.order]; this.hud.toast(`Отчёт на столе: ${O ? O.name.toLowerCase() : r.order}, вернулись ${r.back}${r.lost.length ? ', потеряны ' + r.lost.join(', ') : ''}`, 5); } continue; }
        if (e.kind === 'desert') { if (P.team === 'villain') this.hud.toast('Ночью ушли из форта: ' + e.names.join(', '), 5); continue; }
        if (e.kind === 'elfAttack') { if (P.team === 'villain') this.hud.toast(e.text, 5); continue; }
        if (e.kind === 'escaped') { this.hud.toast('Эльф ушёл по верёвке', 3); continue; }
        if (e.kind === 'rope' || e.kind === 'soldierDead' || e.kind === 'recruited' || e.kind === 'assaultStart') { if (e.kind === 'soldierDead' && P.team === 'villain') this.hud.toast('Погиб ' + e.name, 3); continue; }
        if (e.kind === 'muster') { this.hud.toast(`Перекличка: ${e.names.join(', ')}…` + (e.speech ? ` Строгов: «${e.speech}»` : '') + (e.order ? ` Приказ: ${e.order.name.toLowerCase()}.` : '') + (e.pay ? ` Жалованье ${e.pay} сер.` : '') + (e.late ? ' Опоздал: служба −1, без жалованья.' : ''), 8); continue; }
        if (e.kind === 'command') { this.hud.toast('Строгов: «' + e.text + '»', 3); this.sound.play('bell', { at: P.mv.pos, ear, power: 0.4 }); continue; }
        if (e.kind === 'service') { if (P.team === 'guard') this.hud.toast(`Служба ${e.d > 0 ? '+' + e.d : e.d}: ${e.why} (всего ${e.total})`, 4); continue; }
        if (e.kind === 'rank') { this.hud.toast((e.up ? 'Повышение: ' : 'Разжалован: ') + e.rank, 5); continue; }
        if (e.kind === 'trophies') { this.hud.toast(e.rule === 'hand' ? 'Строгов: «Трофеи сдать!» Взятое с тел — в оружейную до вечера' : 'Строгов: «Трофеи ваши»', 5); continue; }
        if (e.kind === 'jail') { this.hud.toast('Взыскание: ночь на гауптвахте', 5); continue; }
        if (e.kind === 'cell') { this.hud.toast('Гауптвахта. Утром выпустят', 4); continue; }
        if (e.kind === 'released') { this.hud.toast('Вас выпустили с гауптвахты', 3); continue; }
        if (e.kind === 'penalty') { this.hud.toast(e.text, 4); continue; }
        if (e.kind === 'gramota') { this.hud.toast('Савва выдал казённую грамоту: половина протеза у Шарнира', 5); continue; }
        if (e.kind === 'siege') { this.hud.toast(`Штурм! Лестниц ${e.ladders}${e.ram ? ', таран у ворот' : ''}${e.lurkers ? ', лазутчики у калитки и стока' : ''}`, 6); continue; }
        if (e.kind === 'ladder') { if (e.up) this.hud.toast('Лестницу снова приставили к стене', 2); continue; }
        if (e.kind === 'ram') { this.sound.play('wood', { at: e.at, ear, power: 1.4 }); continue; }
        if (e.kind === 'gateBroken' || e.kind === 'lever') { this.hud.toast(e.kind === 'lever' ? 'Лазутчики открыли ворота!' : 'Ворота выбиты!', 5); continue; }
        if (e.kind === 'climbed') continue;
        if (e.kind === 'prohor') { this.hud.toast('Прохору перебили ногу, он не может идти. Нести на плече (G) или отходить по приказу', 6); continue; }
        if (e.kind === 'guardDead') { if (P.team === 'guard') this.hud.toast('Погиб ' + e.name, 3); continue; }
        if (e.kind === 'say') { this.hud.toast(`${e.who}: «${e.text}»`, 7); continue; }
        if (e.kind === 'visitor' || e.kind === 'ending') continue;
        if (e.kind === 'houseBurnt') { if (P.team === 'elf' || this.nearKorni(120)) this.hud.toast('Сгорел дом: ' + e.name, 4); continue; }
        if (e.kind === 'fireSpread') { if (this.nearKorni(120)) this.hud.toast('Огонь перекинулся на соседний дом', 3); continue; }
        if (e.kind === 'houseSaved') { if (this.nearKorni(120)) this.hud.toast('Пожар потушен', 3); continue; }
        if (e.kind === 'trap') { if (Math.hypot(e.at[0] - P.mv.pos[0], e.at[2] - P.mv.pos[2]) < 60) { this.hud.toast((e.trap.kind === 'pit' ? 'В яму с кольями попал: ' : 'В петлю попал: ') + K.Body.nameOf(e.who), 3); this.sound.play('wood', { at: e.at, ear }); } continue; }
        if (e.kind === 'villagerDead') { if (P.team === 'elf' && (e.near || this.nearKorni(150))) this.hud.toast(`Погиб ${e.name}. Имя вырежут на дубе`, 4); continue; }
        if (e.kind === 'battle') { if (Math.hypot(e.at[0] - P.mv.pos[0], e.at[e.at.length - 1] - P.mv.pos[2]) < 400) this.hud.toast('Неподалёку был бой', 3); continue; }
        if (e.kind === 'assault') { this.hud.toast(e.result === 'taken' ? 'Дворец пал' : 'Штурм дворца отбит', 6); continue; }
        if (e.kind === 'pursuit') { this.hud.toast('За корованом погоня', 4); continue; }
        if (e.kind === 'kill') continue;
        if (e.kind === 'maim') {
          if (blood) { fx.spray('blood', e.at, e.dir, 30, 2.6); K.Fx.pool(S, e.at[0], e.at[2], 0.3, S.time, this.T.heightAt(e.at[0], e.at[2])); }
          this.sound.play('cut', { at: e.at, ear, power: 1.1 });
          if (e.who === P) this.hud.toast((e.head ? 'Отрублена голова: ' : 'Отрублена нога: ') + K.Beasts.SPECIES[e.beast].name.toLowerCase());
          continue;
        }
        if (e.kind === 'faint' || e.kind === 'died' || e.kind === 'unrescued') continue;
        if (e.kind === 'whoosh') this.sound.play('whoosh', { at: e.at, ear, power: e.power });
        else if (e.kind === 'hit') {
          const m = e.material;
          if (m === 'straw') fx.spray('straw', e.at, e.dir, 14, 2);
          else if (m === 'plate' || m === 'iron') fx.spray('spark', e.at, e.dir, 12, 3);
          if ((m === 'flesh' || m === 'mail') && e.type !== 'crush' && e.type !== 'blunt' && blood) fx.spray('blood', e.at, e.dir, Math.round((8 + e.damage * 0.7) * (e.body ? 0.4 : 1)), e.body ? 1.2 : 2.4);
          this.sound.play(m, { at: e.at, ear, power: 0.6 + e.damage / 40 });
          if (e.heavy && mine(e)) this.stop = Math.max(this.stop, 0.05 + Math.min(0.03, e.damage / 900));
          if (mine(e)) this.shake = Math.max(this.shake, Math.min(1, 0.25 + e.damage / 40));
          if (e.to === P) this.hud.hurt(e.damage / 35);
        } else if (e.kind === 'block' || e.kind === 'parry') {
          fx.spray('spark', e.at, [0, 1, 0], e.kind === 'parry' ? 18 : 8, 2);
          this.sound.play(e.kind === 'parry' ? 'parry' : e.material, { at: e.at, ear });
          if (mine(e)) { this.shake = Math.max(this.shake, e.kind === 'parry' ? 0.5 : 0.25); if (e.kind === 'parry') this.stop = Math.max(this.stop, 0.06); }
        } else if (e.kind === 'kick') this.sound.play('kick', { at: e.at, ear });
        else if (e.kind === 'eye') {
          if (blood) fx.spray('blood', e.at, [0, 1, 0], 16, 1.2);
          if (e.to === P) this.hud.toast('Вам выкололи ' + (e.side === 'l' ? 'левый' : 'правый') + ' глаз');
          else if (e.who === P) this.hud.toast('Глаз выколот');
        } else if (e.kind === 'cut') {
          if (e.to.kit.side === 'straw') fx.spray('straw', e.at, e.dir, 30, 2.5);
          else if (!e.iron && blood) {
            fx.spray('blood', e.at, e.dir, e.body ? 14 : 46, e.body ? 1.4 : 3.2);
            const g = this.T.heightAt(e.at[0], e.at[2]);
            K.Fx.pool(S, e.at[0], e.at[2], (e.body ? 0.18 : 0.35) + this.rnd() * 0.25, S.time, g);
          }
          this.sound.play(e.iron ? 'iron' : 'cut', { at: e.at, ear, power: 1.2 });
          if (mine(e)) this.stop = Math.max(this.stop, 0.08);
          const name = K.Body.PARTS[e.parts[0]];
          if (e.to === P) this.hud.toast('Вам отрубили ' + LOST[name]);
          else if (e.who === P && e.to.kit.side !== 'straw') this.hud.toast('Отрублена ' + SEVERED[name]);
        }
      }
      for (const b of r.frozen) {
        if (!blood) continue;
        const cut = Object.entries(b.kit.cut || {}).filter(([, v]) => v === 'fresh').length;
        if (b.keep ? b.blood : cut) {
          const a = (b.anchor !== undefined ? b.anchor : 8) * 3;
          K.Fx.pool(S, b.pts[a], b.pts[a + 2], b.keep ? 0.18 : 0.4 + cut * 0.12, S.time, this.T.heightAt(b.pts[a], b.pts[a + 2]));
        }
      }
      for (const x of r.results) {
        if (x.kind === 'down' && this.duel && x.who.id === this.duel.id) this.finishDuel(true, CAUSES[x.cause] || 'упал');
        else if (x.kind === 'disarmed' && this.duel && x.who.id === this.duel.id) this.finishDuel(true, CAUSES.disarmed);
        else if (x.kind === 'crippled' && this.duel && x.who.id === this.duel.id) this.finishDuel(true, CAUSES.leg);
        else if (x.kind === 'crippled' && x.who === P && this.duel && !this.duel.done) this.finishDuel(false, CAUSES.leg);
        else if (x.kind === 'disarmed' && x.who === P && this.duel && !this.duel.done) this.finishDuel(false, CAUSES.disarmed);
        else if (x.kind === 'defeat') this.defeat(x.cause);
      }
      if (P.fight && P.fight.down && !P.fight.reported) { P.fight.reported = true; this.defeat(P.fight.down); }
    }

    duelLine(win, cause) {
      const c = this.duelSetup, t = this.duel ? (this.state.time - this.duel.start).toFixed(1).replace('.', ',') : '';
      const foe = K.Data.SIDES[c.foe.side].name.m.toLowerCase(), who = win ? 'противник ' + cause : 'вы: ' + cause;
      return `За ${t} с: ${weaponName(c.me.weapon, c.me.shield)} против ${foe} (${weaponName(c.foe.weapon, c.foe.shield)}, ${K.Data.EXP[c.foe.exp].name}), ${who}`;
    }

    finishDuel(win, cause) {
      if (!this.duel || this.duel.done) return;
      this.duel.done = true;
      const line = this.duelLine(win, cause);
      this.duels.push({ win, line, time: this.state.time - this.duel.start });
      this.showPanel(K.Screens.outcome(this, { win, line, duel: true }), 'outcome');
    }

    defeat(cause) {
      if (this.duel && !this.duel.done) { this.finishDuel(false, CAUSES[cause] || 'пали'); return; }
      if (cause === 'ko') { this.showPanel(K.Screens.ko(this), 'ko'); return; }
      this.fallen('Вы погибли', FALLS[cause] || FALLS.dead);
    }

    rescued(e) {
      const S = this.state, P = S.player, from = S.rescue && S.rescue.from ? S.rescue.from : P.mv.pos, zone = this.T.zoneAt(from[0], from[2]), spot = this.T.spotAt(from[0], from[2]);
      const info = { by: K.Body.nameOf(e.by), from: 'Зона ' + zone + ' · ' + K.Places.ZONES[zone] + (spot ? ', ' + spot.name : ''), to: e.healer.name + ', ' + e.healer.place, hours: 6 };
      this.showPanel(K.Screens.rescued(this, info), 'fallen');
    }

    fallen(title, line) {
      const P = this.state.player, where = this.zone ? 'Зона ' + this.zone + ' · ' + K.Places.ZONES[this.zone] + (this.place ? ', ' + this.place : '') : '', by = P.fight && P.fight.hitBy;
      const S = K.Beasts.SPECIES, low = s => s[0].toLowerCase() + s.slice(1), who = !by ? '' : by.beast ? S[by.beast].name : (K.Body.nameOf(by) || K.Body.title(by.kit)) + (by.team ? ', ' + low(K.Data.SIDES[by.team].name[by.kit.fig || 'm']) : '');
      const item = by && !by.beast && by.fight ? (K.Missile.ranged(by.fight) ? MODE_ITEM[by.fight.mode] : by.fight.weapon) : null, arm = item && K.Data.ITEMS[item] ? ' (' + K.Data.ITEMS[item].name.toLowerCase() + ')' : '';
      this.showPanel(K.Screens.fallen(this, { title, line, where, by: who ? 'Последний удар: ' + who + arm : '' }), 'fallen');
      if (P.fight) P.fight.ko = 0;
    }

    pickMode(list) {
      const P = this.state.player, F = P.fight, have = list.filter(m => K.Missile.usable(P, m));
      if (!have.length) { this.hud.toast(list[0] === 'melee' ? 'Нет оружия в руке' : 'Нет: ' + list.map(m => MODE_NAME[m]).join(' или ')); return; }
      const next = have.length > 1 && have.includes(F.mode) ? have[(have.indexOf(F.mode) + 1) % have.length] : have[0];
      if (K.Missile.setMode(P, next)) this.hud.toast('В руках: ' + MODE_NAME[next]);
    }

    cycleMode(step) {
      const P = this.state.player, F = P.fight, list = K.Missile.modes(P), i = Math.max(0, list.indexOf(F.mode || 'melee'));
      const next = list[(i + step + list.length) % list.length];
      if (next && K.Missile.setMode(P, next)) this.hud.toast('В руках: ' + MODE_NAME[next]);
    }

    bandage() {
      const S = this.state, P = S.player, F = P.fight, t = this.target || {};
      const other = t.dummy && K.Wounds.bleeding(t.dummy.fight) ? t.dummy : t.body && t.body.ko > 0 && !t.body.stable ? t.body : null;
      const own = K.Wounds.bleeding(F) || Object.values(P.kit.cut || {}).includes('fresh');
      if (!other && !own) { this.hud.toast('Перевязывать нечего'); return; }
      const r = K.Wounds.bind(P, other || P, P.bag);
      if (!r.ok) { this.hud.toast(BIND_WHY[r.why] || BIND_WHY.busy); return; }
      this.hud.toast((other ? 'Перевязываю: ' + K.Body.title(other.kit).toLowerCase() : 'Перевязываюсь') + ', ' + r.time.toFixed(1).replace('.', ',') + ' с');
    }

    hearAt(at, power) {
      const c = this.camera(), dx = at[0] - c.eye[0], dz = at[2] - c.eye[2], d = Math.hypot(dx, dz);
      if (d > 25 || d < 0.05) return;
      const a = Math.atan2(dx, -dz) - c.yaw;
      this.hud.mark(a, power * (1 - d / 25));
    }

    rise() {
      const S = this.state, P = S.player, id = this.settings.hero, look = P.look && P.kit.hero === id ? P.look : null;
      P.kit = K.Save.heroKit(id, look);
      P.look = look || K.Save.lookOf(P.kit);
      P.fight = K.Save.heroFight(id);
      for (const s of K.Save.startBag(id)) if (!bagHas(P.bag, s.id)) P.bag.push(s);
      P.mv.stamina = 100;
      P.mv.tired = false;
      for (const p of S.people) if (p.fight && p.fight.hostile === P) { p.fight.hostile = null; K.Combat.guard(p.fight, false); }
      this.duel = null;
      S.version++;
      this.closePanel(true);
    }

    startDuel() {
      const S = this.state, P = S.player, c = this.duelSetup, R = K.Places.DRILL.ring;
      if (this.duel) {
        const old = S.people.find(p => p.id === this.duel.id);
        if (old) S.people.splice(S.people.indexOf(old), 1);
      }
      for (const p of S.people) if (p.fight && p.fight.hostile === P) p.fight.hostile = null;
      P.kit = K.Save.heroKit(this.settings.hero, P.look && P.kit.hero === this.settings.hero ? P.look : null);
      P.fight = K.Combat.fighter({ weapon: c.me.weapon, shield: c.me.shield, exp: 'soldier' });
      P.mv = K.Move.body(this.W, R.at[0], R.at[1], R.yaw);
      this.yaw = R.yaw;
      this.pitch = -0.04;
      this.free = null;
      const fx = Math.sin(R.yaw), fz = -Math.cos(R.yaw), x = R.at[0] + fx * 4.6, z = R.at[1] + fz * 4.6, id = S.nextId++;
      const side = c.foe.side, kit = K.Body.kit(side, null, K.rng(id * 13 + 5));
      const foe = K.Body.person(id, kit, x, z, R.yaw + Math.PI, this.W, { kind: 'stand', post: [x, z], face: R.yaw + Math.PI });
      foe.fight = K.Combat.fighter({ weapon: c.foe.weapon, shield: c.foe.shield, exp: c.foe.exp });
      foe.fight.hostile = P;
      foe.anim = K.Anim.state();
      foe.frames = new Float32Array(132);
      foe.duel = true;
      S.people.push(foe);
      this.duel = { id, start: S.time, done: false };
      S.version++;
      this.hud.toast('ЛКМ и мышь: замах, ЛКМ на месте: укол, ПКМ: блок, F: пинок', 6);
      this.closePanel(false);
      this.lock();
      this.track(true);
    }

    topple(p) {
      const S = this.state, mv = p.mv;
      const c = this.camera(), dx = mv.pos[0] - c.eye[0], dz = mv.pos[2] - c.eye[2], d = Math.hypot(dx, dz) || 1;
      if (p.fight) K.Combat.dropGear(S, p);
      const body = K.Body.fall(p.kit, p.frames, { id: p.id, vel: mv.vel.slice(), push: [dx / d * 2.2, 0.3, dz / d * 2.2], sack: p.sack, born: S.time });
      S.people.splice(S.people.indexOf(p), 1);
      S.bodies.push(body);
      K.Body.trim(S.bodies, c.eye, b => this.seen(b));
      S.version++;
      return body;
    }

    seen(b) {
      const c = this.camera(), f = K.basis(c.yaw, c.pitch).fwd, a = (b.anchor !== undefined ? b.anchor : 8) * 3;
      const dx = b.pts[a] - c.eye[0], dy = b.pts[a + 1] - c.eye[1], dz = b.pts[a + 2] - c.eye[2], d = Math.hypot(dx, dy, dz) || 1;
      return (dx * f[0] + dy * f[1] + dz * f[2]) / d > Math.cos(this.fov * 0.75) && d < K.daylight(this.hour).fogFar;
    }

    quickSave() {
      const why = K.Save.blocked(this.state);
      if (why) { this.hud.toast(why, 3); return false; }
      const data = this.snapshot();
      this.quick = JSON.stringify(data);
      this.hud.toast('Быстрое сохранение');
      this.saves.put(K.Save.record(K.Save.QUICK, data, K.Save.meta(this.state, this.T), this.thumb())).catch(e => this.hud.toast('Быстрое сохранение только до закрытия окна: ' + (e && e.message || e), 4));
      return true;
    }

    quickLoad() {
      if (this.quick) { this.load(JSON.parse(this.quick)); this.hud.toast('Быстрая загрузка'); return; }
      this.saves.get(K.Save.QUICK).then(rec => { if (rec) { this.load(rec.data); this.playing = true; this.hud.toast('Быстрая загрузка'); } else this.hud.toast('Быстрого сохранения нет'); }, () => this.hud.toast('Быстрого сохранения нет'));
    }

    load(obj) {
      const S = K.Save.unpack(obj, this.W);
      if (!S.people.some(q => q.role)) S.people.push(...K.Body.townsfolk(this.W, 600));
      if (!S.caravans) K.Caravan.init(S, K.rng(17));
      K.World.state(S);
      this.adopt(S);
    }

    snapshot() {
      const S = this.state;
      S.player.pitch = this.pitch;
      S.player.mode = this.mode;
      return K.Save.pack(S, this.W);
    }

    track(force) {
      const p = this.free ? this.free.pos : this.player.pos;
      const zone = this.T.zoneAt(p[0], p[2]), spot = this.T.spotAt(p[0], p[2]), id = spot ? spot.id : null;
      const entered = !force && this.zone && zone !== this.zone;
      if (force || zone !== this.zone) {
        this.zone = zone;
        this.spot = id;
        this.hud.show(zone + ' · ' + K.Places.ZONES[zone], spot ? spot.name : '');
      } else if (id !== this.spot) {
        this.spot = id;
        if (spot) this.hud.show(null, spot.name);
      }
      this.place = spot ? spot.name : '';
      const S = this.state;
      if (id && !this.free && S.visited && !S.visited.includes(id)) S.visited.push(id);
      if (entered && !this.free) this.autosave(false);
      const b = this.player, t = this.target || {};
      if (this.free || this.panel) this.hud.prompt(null);
      else if (b.ladder) this.hud.prompt('W и S: вверх и вниз, Пробел: спрыгнуть');
      else if (this.state.player.carry) this.hud.prompt(this.carryPrompt());
      else if (t.dummy && t.dummy.state && t.dummy.state !== 'jailed' && Math.hypot(t.dummy.mv.pos[0] - b.pos[0], t.dummy.mv.pos[2] - b.pos[2]) < 2.4) this.hud.prompt('[E] ' + K.Body.nameOf(t.dummy) + ' ' + CAPTIVE[t.dummy.state] + ': связать, вести, отпустить');
      else if (t.carcass) this.hud.prompt(t.carcass.skinned ? 'Освежёванная туша' : '[E] Освежевать: ' + K.Beasts.SPECIES[t.carcass.beast].name.toLowerCase() + (K.Beasts.SPECIES[t.carcass.beast].yield.length ? '' : ' (взять нечего)'));
      else if (t.body) this.hud.prompt('[E] Обыскать: ' + K.Body.nameOf(t.body).toLowerCase() + '  [G] Нести');
      else if (t.thing) this.hud.prompt('[E] Поднять: ' + K.Data.ITEMS[t.thing.item].name.toLowerCase());
      else if (t.stuck) this.hud.prompt('[E] Подобрать: ' + K.Data.ITEMS[K.Data.MISSILES[t.stuck.kind].ammo].name.toLowerCase());
      else if (this.state.player.fight && this.state.player.fight.shieldLoad && this.state.player.fight.shield) this.hud.prompt('[E] Вырвать сулицу из щита');
      else if (b.chair) this.hud.prompt('[E] Вылезти из коляски');
      else if (b.pushing) this.hud.prompt('[E] Отпустить коляску');
      else if ((this.state.chairs || []).some(c => Math.hypot(c.pos[0] - b.pos[0], c.pos[2] - b.pos[2]) < 1.3)) this.hud.prompt('[E] Коляска: сесть или, сзади, толкать');
      else if (K.Move.ladderNear(this.W, b) && (!b.limit || b.limit.ladder)) this.hud.prompt('[E] Лезть');
      else if (this.wearing) this.hud.prompt('Надеваю протез: ' + Math.ceil(WEAR_TIME - this.wearing.t) + ' с');
      else if (t.dummy && t.dummy.team) this.hud.prompt(this.personLine(t.dummy));
      else if (this.felling) this.hud.prompt('Подрубаю дерево: ' + Math.ceil(K.Caravan.FELL_TIME - this.felling.t) + ' с');
      else if (this.road) this.hud.prompt(this.roadLine(this.road));
      else if (this.fix) this.hud.prompt(this.fixLine(this.fix));
      else if (t.dummy && !(t.dummy.fight && t.dummy.fight.hostile)) this.hud.prompt('[F6] Уронить манекен');
      else this.hud.prompt(null);
    }

    nearKorni(r) {
      const p = this.state.player.mv.pos, k = K.Places.KORNI.at;
      return Math.hypot(p[0] - k[0], p[2] - k[1]) < r;
    }

    carryPrompt() {
      const S = this.state, P = S.player, b = P.carry, team = (b.who && b.who.team) || b.kit.side, H = K.AI.healerNear(S, P.mv.pos, team, 4);
      return H ? '[G] Отдать: ' + H.name : '[G] Положить: ' + K.Body.nameOf(b) + ' · лекарь: ' + (K.Places.HEALERS[team] || K.Places.HEALERS.town).name + ', ' + (K.Places.HEALERS[team] || K.Places.HEALERS.town).place;
    }

    personLine(q) {
      if (q.merc) return K.Body.nameOf(q) + ' · наёмник, в отряде, ' + K.Econ.MERC.day + ' сер. в день';
      if (q.role) return K.Body.nameOf(q) + ' · ' + ROLE[q.role](q) + (talkOf(q, this.state.player) && Math.hypot(q.mv.pos[0] - this.player.pos[0], q.mv.pos[2] - this.player.pos[2]) < TALK_REACH ? '  [E] ' + talkOf(q, this.state.player) : '');
      const P = this.state.player, own = q.team === P.team, foe = K.AI.enemies(P.team, q.team);
      const role = q.state ? CAPTIVE[q.state] : own ? 'свой' + (q.squad === 'player' ? ', в отряде' : '') + ', долг ' + (q.debt || 0) : foe ? 'враг' : 'чужой';
      return K.Body.nameOf(q) + ' · ' + K.Data.SIDES[q.team].name[q.kit.fig] + ' · ' + role;
    }

    camera() {
      const sh = this.shake > 0 ? this.shake * this.shake : 0, jy = sh * 0.03 * Math.sin(this.time * 71), jp = sh * 0.025 * Math.sin(this.time * 53 + 1);
      if (this.free) return { eye: this.free.pos, yaw: this.yaw, pitch: this.pitch };
      if (this.fitting) {
        const q = this.player.pos, a = this.fitting.angle + this.time * FIT_SPIN, r = 2.3, eye = [q[0] - Math.sin(a) * r, q[1] + 1.35, q[2] + Math.cos(a) * r];
        return { eye, yaw: a, pitch: -0.12 };
      }
      const p = this.player.pos, F = this.state && this.state.player.fight;
      const eyeH = F && F.down ? 0.35 : this.player.eye;
      const kick = F && F.act && F.act.kind === 'kick' ? Math.sin(Math.PI * K.clamp(F.act.t / K.Combat.KICK.time, 0, 1)) : 0;
      if (this.mode === 'first') return { eye: [p[0], p[1] + eyeH, p[2]], yaw: this.yaw + jy, pitch: this.pitch + jp - 0.3 * kick };
      const b = K.basis(this.yaw, this.pitch);
      const eye = [p[0] - b.fwd[0] * 3.4 + b.right[0] * 0.5, p[1] + 1.7 - b.fwd[1] * 3.4, p[2] - b.fwd[2] * 3.4 + b.right[2] * 0.5];
      eye[1] = Math.max(eye[1], this.T.heightAt(eye[0], eye[2]) + 0.4);
      return { eye, yaw: this.yaw + jy, pitch: this.pitch + jp };
    }

    modeName() {
      const b = this.player;
      if (b.ladder) return MODES.ladder;
      if (b.swim) return MODES.swim;
      if (!b.onGround) return MODES.air;
      if (b.crouch) return MODES.crouch;
      if (b.walk) return MODES.walk;
      return b.sprinting ? MODES.sprint : MODES.run;
    }

    gearOf(who) {
      const g = who.gear, F = who.fight, out = [];
      if (!g || !F) return out;
      if (g.weapon && K.Missile.ranged(F)) out.push([K.Missile.MESH[F.mode], g.weapon]);
      else if (g.weapon && F.weapon) out.push(['w.' + F.weapon, g.weapon]);
      if (g.shield && F.shield) out.push(['w.shield', g.shield]);
      if (g.crutch) out.push(['w.crutch', g.crutch]);
      if (g.torch && F.torch) out.push(['w.torch', g.torch]);
      if (g.nock) out.push(['w.arrow', g.nock]);
      return out;
    }

    fistOf(who) {
      const g = who.gear, F = who.fight, out = [];
      if (!g || !F) return out;
      const mine = F.hand === 'l' ? 5 : 6, other = mine === 5 ? 6 : 5;
      if (g.weapon && F.weapon) out.push(mine);
      const both = K.Missile.ranged(F) ? F.mode === 'bow' || F.mode === 'crossbow' : F.weapon && K.Data.WEAPONS[F.weapon].hands === 2;
      if ((g.shield && F.shield) || (g.weapon && both) || (g.torch && F.torch)) out.push(other);
      return out;
    }

    figures(c) {
      const S = this.state, P = S.player, live = [], still = [];
      for (const p of S.people) live.push({ kit: p.kit, frames: p.frames, gear: this.gearOf(p), fist: this.fistOf(p) });
      for (const b of S.bodies) if (b.carrier !== 'player') (b.frozen && !b.carrier ? still : live).push(b);
      for (const b of S.beasts || []) live.push(b);
      for (const m of S.carcasses || []) still.push(m);
      for (const pc of S.parts) (pc.frozen ? still : live).push(pc);
      const hold = S.player.carry;
      if (hold && (this.mode !== 'first' || this.free)) live.push(hold);
      this.caravanGear(live, still);
      this.villageGear(live);
      this.siegeGear(live);
      const flying = K.Missile.gear(S);
      if (flying.length) live.push({ kit: NEUTRAL, frames: null, gear: flying });
      for (const c of S.chairs || []) {
        c.frame = K.Anim.frameAt(c.pos, [0, 1, 0], [Math.sin(c.yaw), 0, -Math.cos(c.yaw)], c.frame);
        live.push({ kit: NEUTRAL, frames: null, gear: [['w.chair', c.frame]] });
      }
      for (const it of S.items) {
        if (!it.frozen || !it.frame) it.frame = K.Body.itemFrame(it, it.frame || undefined);
        (it.frozen ? still : live).push({ kit: it.pal || NEUTRAL, frames: null, gear: [[it.item === 'throwingAxe' ? 'w.taxe' : 'w.' + it.item, it.frame]] });
      }
      const away = Math.hypot(c.eye[0] - P.mv.pos[0], c.eye[1] - P.mv.pos[1] - 1, c.eye[2] - P.mv.pos[2]) > 1.5;
      if ((this.mode !== 'first' || this.free || this.fitting) && away && P.frames) live.push({ kit: P.kit, frames: P.frames, gear: this.gearOf(P), fist: this.fistOf(P) });
      let hands = null, leg = null;
      if (this.mode === 'first' && !this.free && !this.fitting && !P.mv.swim && !(P.fight && P.fight.down) && !P.carry) {
        const fp = K.Anim.firstPerson(P.anim, P.kit, c, P.fight, this.handFrames, this.handGear || undefined);
        this.handGear = fp.gear;
        hands = { kit: P.kit, frames: fp.frames, gear: this.gearOf({ gear: fp.gear, fight: P.fight }), fist: this.fistOf({ gear: fp.gear, fight: P.fight }) };
        if (P.fight.act && P.fight.act.kind === 'kick' && P.frames) leg = { kit: P.kit, frames: P.frames, parts: [8, 10] };
      }
      return { people: { still, live, version: S.version }, hands, leg };
    }

    caravanGear(live, still) {
      const S = this.state, A = K.Anim, Cv = K.Caravan;
      this.cartFrames = this.cartFrames || new Map();
      const frame = (key, o, up, fwd) => { let f = this.cartFrames.get(key); f = A.frameAt(o, up, fwd, f); this.cartFrames.set(key, f); return f; };
      for (const c of Cv.state(S).list) {
        if (!c.live) continue;
        for (const cart of c.carts) {
          if (!cart.pos) continue;
          const b = K.basis(cart.yaw, 0), gear = [], key = c.id + ':' + cart.i, local = (x, y, z) => [cart.pos[0] + b.right[0] * x + b.fwd[0] * -z, cart.pos[1] + y, cart.pos[2] + b.right[2] * x + b.fwd[2] * -z];
          gear.push([cart.armored ? 'w.cartIron' : 'w.cart', frame(key, cart.pos, [0, 1, 0], b.fwd)]);
          const roll = (cart.s || 0) / 0.55;
          WHEELS.forEach((w, k) => { const up = [b.fwd[0] * Math.sin(roll), Math.cos(roll), b.fwd[2] * Math.sin(roll)], fw = [b.fwd[0] * Math.cos(roll), -Math.sin(roll), b.fwd[2] * Math.cos(roll)]; gear.push(['w.cartWheel', frame(key + 'w' + k, local(w[0], w[1], w[2]), up, fw)]); });
          cart.bales.forEach((g, k) => { const col = k % 2, row = Math.floor(k / 2) % 5, lay = Math.floor(k / 10); gear.push([BALE_MESH[g], frame(key + 'b' + k, local(col ? 0.34 : -0.34, 0.75 + lay * 0.42, -1.1 + row * 0.55), [0, 1, 0], b.fwd)]); });
          if (cart.silver) [-0.5, 0, 0.5].forEach((z, k) => gear.push(['w.silverChest', frame(key + 's' + k, local(0, 0.75, z * 1.6), [0, 1, 0], b.fwd)]));
          if (cart.bells) gear.push(['w.bells', frame(key + 'bell', local(0, 1.12, -1.48), [0, 1, 0], b.fwd)]);
          live.push({ kit: CART_PAL, frames: null, gear });
        }
      }
      for (const spot of Cv.sawnSpots()) {
        const fr = Cv.trunkFrame(S, spot, this.T);
        if (fr) live.push({ kit: CART_PAL, frames: null, gear: [['w.trunk', fr]] });
      }
    }

    siegeGear(live) {
      const S = this.state, G = S.guard;
      if (!G || !G.siege) return;
      const A = K.Anim, T = this.T, PP = K.Places.PALACE_PTS, gear = [];
      this.siegeFrames = this.siegeFrames || new Map();
      const frame = (key, o, up, fwd) => { let f = this.siegeFrames.get(key); f = A.frameAt(o, up, fwd, f); this.siegeFrames.set(key, f); return f; };
      for (const L of G.ladders) {
        const g = T.heightAt(L.at[0], L.at[1]), lean = L.up ? 0.2 : 1.45, up = [Math.sin(lean), Math.cos(lean), 0], fwd = [0, 0, -1];
        gear.push(['w.siegeLadder', frame(L.id, [L.at[0] - (L.up ? 0 : 5.5), g, L.at[1]], up, fwd)]);
      }
      if (G.siege.ram) { const r = G.siege.ram.at; gear.push(['w.ram', frame('ram', [r[0], T.heightAt(r[0], r[1]), r[1]], [0, 1, 0], [0, 0, -1])]); }
      if (!G.gate.broken) gear.push(['w.gateDoor', frame('gate', [1151.5, T.heightAt(1151.5, 700), 700], [0, 1, 0], [0, 0, -1])]);
      if (gear.length) live.push({ kit: VILLAGE_PAL, frames: null, gear });
    }

    villageGear(live) {
      const S = this.state, A = K.Anim, V = S.village, T = this.T, P = K.Places;
      if (!V) return;
      this.villageFrames = this.villageFrames || new Map();
      const frame = (key, x, z, yaw, y) => { const g = y !== undefined ? y : T.heightAt(x, z); let f = this.villageFrames.get(key); f = A.frameAt([x, g, z], [0, 1, 0], [Math.sin(yaw), 0, -Math.cos(yaw)], f); this.villageFrames.set(key, f); return f; };
      const eye = this.camera().eye, near = (x, z, r) => Math.hypot(x - eye[0], z - eye[2]) < r, gear = [];
      for (const t of V.traps) if (t.armed && near(t.at[0], t.at[1], 60)) gear.push([t.kind === 'pit' ? 'w.pit' : 'w.snare', frame(t.id, t.at[0], t.at[1], 0)]);
      P.HERB_SPOTS.forEach((h, i) => { if (V.herbs[i] !== (S.day || 1) && near(h[0], h[1], 50)) gear.push(['w.herb', frame('herb' + i, h[0], h[1], i)]); });
      for (const c of P.CACHES) if (!V.caches[c.id] && near(c.at[0], c.at[1], 60)) gear.push(c.mark === 'ochre' ? ['w.cacheStone', frame('cache' + c.id, c.at[0], c.at[1], 0.6)] : ['w.bells', frame('cache' + c.id, c.at[0], c.at[1], 0, T.heightAt(c.at[0], c.at[1]) + 2.6)]);
      if (S.world && near(P.CUTTERS.stack[0], P.CUTTERS.stack[1], 120)) {
        const Vl = S.world.sides.villain, [x, z] = P.CUTTERS.stack;
        if (Vl.ladders) gear.push(['w.ladders', frame('ladders', x - 2, z, Math.PI / 2)]);
        if (Vl.ram) gear.push(['w.ram', frame('ram', x + 3, z + 3, Math.PI / 2)]);
      }
      for (const w of K.Places.town(T).wells) if (near(w.at[0], w.at[1], 60)) gear.push(['w.bucket', frame('well' + w.at[0], w.at[0] + 0.5, w.at[1] + 0.55, 0, w.y)]);
      if (gear.length) live.push({ kit: VILLAGE_PAL, frames: null, gear });
    }

    flames(f) {
      const out = [], S = this.state, flame = (fr, who) => { if (!fr) return; out.push([fr[9] + fr[3] * 0.72, fr[10] + fr[4] * 0.72, fr[11] + fr[5] * 0.72, 1, 0.62, 0.25, 1.1]); };
      if (f.hands && f.hands.gear) for (const [key, fr] of f.hands.gear) if (key === 'w.torch') flame(fr);
      for (const p of S.people) if (p.fight && p.fight.torch && p.gear && p.gear.torch) flame(p.gear.torch);
      if (S.player.fight && S.player.fight.torch && S.player.gear && S.player.gear.torch && (this.mode !== 'first' || this.free)) flame(S.player.gear.torch);
      for (const fire of this.state.fires || []) { out.push([fire.at[0], fire.at[1] + 0.3, fire.at[2], 1, 0.55, 0.2, 1.6]); out.push([fire.at[0] + 0.2, fire.at[1] + 0.7, fire.at[2] - 0.1, 1, 0.75, 0.3, 0.9]); }
      const glow = this.fitGlow();
      if (glow) out.push(glow);
      if (K.Elves && S.village) for (const g of K.Elves.flames(S)) out.push(g);
      if (K.Villain && S.army) for (const g of K.Villain.flames(S)) out.push(g);
      return out;
    }

    ammoLine(P) {
      const F = P.fight, M = K.Missile;
      if (F.mode === 'bow') return 'Лук · стрел ' + M.count(P, 'arrow');
      if (F.mode === 'crossbow') return 'Арбалет · ' + (F.loaded ? 'заряжен' : F.reload ? 'перезарядка' : 'R: перезарядить') + ' · болтов ' + M.count(P, 'bolt');
      if (F.mode === 'taxe') return 'Топорики · ' + M.count(P, 'throwingAxe');
      return 'Сулицы · ' + M.count(P, 'javelin');
    }

    sight() {
      const c = K.Wounds.caps(this.state.player.kit);
      if (c.view.l === 'ok' && c.view.r === 'ok' && !c.slit) return null;
      return { l: c.view.l, r: c.view.r, blind: c.blind, slit: c.slit, night: K.daylight(this.hour).night };
    }

    draw() {
      if (!this.ready) return;
      const c = this.camera(), b = this.player, f = this.figures(c), S = this.state, F = S.player.fight;
      this.renderer.render({
        eye: c.eye, yaw: c.yaw, pitch: c.pitch, fov: this.fov, hour: this.hour, time: this.time, fogScale: (this.fogScale || 1) * this.settings.forest, dither: this.settings.dither,
        treeRadius: this.settings.treeRadius, grass: this.settings.grass, day: this.state.day || 1, border: this.settings.border, people: f.people, hands: f.hands, leg: f.leg,
        fx: { S, blood: this.settings.blood }, glows: this.flames(f), smoke: this.smoke(), burnt: K.Elves ? K.Elves.burntKey(S) : '',
        sight: this.free ? null : this.sight(), weather: this.weatherView(c.eye)
      }, this.width, this.height);
      this.hud.hint(!this.locked && !this.menu && !this.panel && !this.opts.shots);
      const fighting = F && !F.down && !this.free && !this.menu && !this.panel;
      this.hud.cross(fighting, F);
      this.hud.ammo(fighting && K.Missile.ranged(F) ? this.ammoLine(S.player) : null, F && F.reload ? F.reload.t / F.reload.time : F && F.draw && !F.draw.fire ? Math.min(1, F.draw.t / K.Missile.drawTime(S.player, F.mode)) : -1);
      this.hud.stamina(fighting && (b.stamina < (b.staminaMax || 100) - 0.5 || !!F.act || !!F.guard), b.stamina, b.staminaMax || 100);
      const hurt = F && (K.Wounds.bleeding(F) || F.life < 99.5 || Object.keys(S.player.kit.cut || {}).length || Object.keys(S.player.kit.eyes || {}).length || !!F.binding);
      this.hud.wounds(!this.free && !this.menu && hurt, S.player, this.time);
      this.hud.blind(!this.free && K.Wounds.caps(S.player.kit).blind);
      if (this.panelKind === 'ko' && this.panel && this.panel.tick) {
        const R = S.rescue, by = R ? S.people.find(q => q.id === R.by) : null;
        this.panel.tick(F.ko || 0, by ? (by.fight.binding ? K.Body.nameOf(by) + ' перевязывает вас' : 'К вам бежит ' + K.Body.nameOf(by)) : '', !!F.stable);
      }
      if (this.debugOn) {
        const p = this.free ? this.free.pos : b.pos, hh = Math.floor(this.hour), mm = Math.floor((this.hour - hh) * 60), st = this.renderer.stats;
        const falling = S.bodies.filter(x => !x.frozen).length, foe = S.people.find(q => q.fight && q.fight.hostile === S.player);
        this.hud.debug(`x ${p[0].toFixed(1)}  z ${p[2].toFixed(1)}  y ${p[1].toFixed(1)}\nдень ${S.day}  зона ${this.zone}  ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}  ${K.Weather.at(S).name}  ${this.free ? 'свободная камера' : this.modeName()}\nскорость ${b.speed.toFixed(1)} м/с  выносливость ${Math.round(b.stamina)}  жизнь ${F ? Math.round(F.life) : '-'}${foe ? '  противник ' + Math.round(foe.fight.life) : ''}\nкусков земли ${st.chunks}  треугольников ${st.tris}  кадр ${this.frames}\n3D-деревьев рядом ${st.trees}  вызовов леса ${st.draws}  радиус ${this.settings.treeRadius} м\nзверей ${(S.beasts || []).length}  туш ${(S.carcasses || []).length}  людей ${S.people.length}${S.squad ? '  отряд: ' + S.squad.order + (S.squad.fire ? ', стрелять' : '') : ''}  тел ${S.bodies.length} (падают ${falling})  кусков ${S.parts.length}  вещей ${S.items.length}  частей в кадре ${st.people.instances}  вызовов ${st.people.draws}`);
      } else {
        this.hud.debug(null);
      }
    }

    fail(e) {
      const el = document.createElement('div');
      el.className = 'ki-fail';
      el.textContent = 'Игре нужен 3D-ускоритель с поддержкой WebGL2 (' + e.message + ').';
      if (this.loading) this.loading.remove();
      this.root.appendChild(el);
      this.failed = true;
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      clearTimeout(this.bootTimer);
      cancelAnimationFrame(this.raf);
      if (this.onKeyDown) {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
        document.removeEventListener('mousemove', this.onMouse);
        document.removeEventListener('mouseup', this.onUp);
        document.removeEventListener('pointerlockchange', this.onLock);
      }
      if (document.pointerLockElement === this.canvas) document.exitPointerLock();
      if (this.observer) this.observer.disconnect();
      if (this.sound) this.sound.destroy();
      if (this.saves) this.saves.close();
      this.villageFrames = null;
      if (this.gpu) this.gpu.destroy();
      this.root.innerHTML = '';
    }
  }

  K.UI = UI;
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
