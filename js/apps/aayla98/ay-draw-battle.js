(function (A) {
  'use strict';
  const LANES = [112, 130, 148];
  const POS = { back: 44, front: 98, party: 238, shift: 6, partyShift: 14 };
  const PARTY_LANE = [1, 0, 2];
  const CATS = { blade: 'Клинок', hand: 'Удар', force: 'Сила', stance: 'Стойка', talk: 'Слово', own: 'Свой приём', items: 'Вещи', flee: 'Отход' };
  const CAT_ORDER = Object.keys(CATS);
  const ADVANTAGE = { party: 'Засада: первый ход ваш, один враг в бреши', enemy: 'Вас заметили: первый ход у врага', none: 'Встреча лицом к лицу' };
  const OUTCOME = { surrender: 'сдаётся', flee: 'бежит', info: 'выдаёт сведения и уходит', rage: 'злится: бьёт сильнее, Слово закрыто' };
  const STATUS_NAMES = { poison: 'яд', stun: 'оглушение', disarmed: 'без оружия', fear: 'страх', blind: 'ослепление', calm: 'покой', saberOff: 'клинок погас', slow: 'замедление', rooted: 'корни', shieldOff: 'щит снят', grounded: 'сбит на землю', rage: 'ярость', regen: 'корни лечат', suppressed: 'под огнём', hacked: 'взломан' };
  const STANCES = { evade: 'Кувырок нексу', guard: 'Защита', focus: 'Сосредоточиться: +30 % Силы', calm: 'Покой', shadow: 'Тень', barrier: 'Барьер Силы', cover: 'Прикрывает', djemso: 'Джем-Со', roots: 'Корни' };
  const ROW = { front: 'передний ряд', back: 'задний ряд' };
  const MELEE = new Set(['blade', 'combo', 'leap', 'whirl', 'stab', 'punch', 'bite', 'bigbite', 'fists', 'claw', 'tentacles', 'barb', 'tail', 'zap', 'feral', 'baton', 'vblade', 'ksaber', 'nip', 'pounce']);
  const SHAPES = {
    human: { w: 48, h: 64, ax: 24, ay: 61, crop: [15, 5, 18, 18, 2], talk: [10, 0, 30, 40], chest: [0, -34], hand: [14, -29] },
    spider: { w: 32, h: 24, ax: 16, ay: 22, crop: [10, 4, 18, 18, 2], talk: [4, 0, 26, 24], chest: [4, -10], hand: [8, -9] },
    giant: { w: 80, h: 60, ax: 40, ay: 58, crop: [34, 18, 36, 36, 1], talk: [30, 10, 46, 46], chest: [8, -26], hand: [18, -20] },
    lylek: { w: 48, h: 48, ax: 24, ay: 46, crop: [24, 4, 20, 20, 2], talk: [16, 0, 32, 40], chest: [4, -26], hand: [14, -30] },
    lylek_young: { w: 40, h: 40, ax: 20, ay: 38, crop: [20, 4, 16, 16, 2], talk: [12, 0, 28, 34], chest: [3, -20], hand: [12, -24] },
    lylek_old: { w: 72, h: 68, ax: 36, ay: 66, crop: [36, 4, 30, 30, 1], talk: [26, 0, 46, 56], chest: [6, -38], hand: [22, -44] },
    illusion: { w: 56, h: 54, ax: 28, ay: 52, crop: [28, 4, 24, 24, 1], talk: [18, 0, 36, 46], chest: [5, -30], hand: [16, -34] },
    challat: { w: 44, h: 40, ax: 22, ay: 38, crop: [22, 8, 20, 20, 2], talk: [8, 2, 36, 34], chest: [0, -22], hand: [8, -22] },
    axrx: { w: 48, h: 64, ax: 24, ay: 62, crop: [24, 6, 18, 18, 2], talk: [10, 0, 30, 40], chest: [0, -34], hand: [14, -29] },
    b1: { w: 32, h: 56, ax: 15, ay: 54, crop: [12, 4, 16, 16, 2], talk: [6, 0, 22, 34], chest: [0, -32], hand: [10, -30] },
    b2: { w: 40, h: 60, ax: 18, ay: 58, crop: [12, 6, 18, 18, 2], talk: [8, 0, 26, 40], chest: [0, -34], hand: [16, -30] },
    droideka: { w: 44, h: 44, ax: 20, ay: 42, crop: [14, 2, 18, 18, 2], talk: [8, 0, 30, 30], chest: [0, -26], hand: [16, -26] },
    geonosian: { w: 40, h: 52, ax: 18, ay: 50, crop: [14, 4, 16, 16, 2], talk: [8, 0, 26, 36], chest: [2, -30], hand: [14, -30] },
    dianoga: { w: 64, h: 56, ax: 30, ay: 54, crop: [32, 2, 20, 20, 2], talk: [20, 0, 40, 40], chest: [4, -26], hand: [12, -34] },
    grievous: { w: 56, h: 72, ax: 24, ay: 70, crop: [18, 0, 20, 20, 2], talk: [14, 0, 32, 50], chest: [0, -44], hand: [14, -40] },
    secdroid: { w: 44, h: 64, ax: 20, ay: 62, crop: [14, 4, 18, 18, 2], talk: [8, 0, 30, 40], chest: [0, -36], hand: [18, -32] },
    acklay: { w: 64, h: 52, ax: 32, ay: 50, crop: [28, 12, 30, 30, 1], talk: [24, 8, 38, 40], chest: [6, -24], hand: [16, -18] },
    endor_beast: { w: 76, h: 70, ax: 38, ay: 68, crop: [38, 4, 30, 30, 1], talk: [28, 0, 46, 56], chest: [6, -40], hand: [22, -46] },
    turret: { w: 44, h: 44, ax: 20, ay: 42, crop: [14, 2, 18, 18, 2], talk: [8, 0, 30, 30], chest: [0, -26], hand: [16, -26] },
    rakatan: { w: 44, h: 64, ax: 20, ay: 62, crop: [14, 4, 18, 18, 2], talk: [8, 0, 30, 40], chest: [0, -36], hand: [18, -32] }
  };
  const SCENES = {
    cave: { wall: ['#100c14', '#211a22', '#352a2a'], floor: ['#352c26', '#463a30', '#55473a'], crack: '#2a221c' },
    mine: { wall: ['#0c0a0e', '#1c161c', '#302626'], floor: ['#2a2420', '#38302a', '#463c32'], crack: '#221c18' },
    estate: { wall: ['#1e1218', '#3a2026', '#5a3030'], floor: ['#4a2a22', '#6a3a2a', '#7a4a32'], crack: '#3a2018' },
    ryloth_cave: { wall: ['#120e10', '#2a1e1a', '#3e2c22'], floor: ['#3a2a1e', '#4a3826', '#5a4630'], crack: '#2a1e14' },
    kiffex_temple: { wall: ['#0c0a0e', '#1e1418', '#33222a'], floor: ['#2a2226', '#3a2e30', '#4a3a38'], crack: '#1e1618' },
    kiffex_post: { wall: ['#101216', '#22282e', '#3a4048'], floor: ['#2a2e34', '#3a4048', '#4a5058'], crack: '#1e2228' },
    kiffex_cantina: { wall: ['#140e14', '#2a1a22', '#402832'], floor: ['#302024', '#40302e', '#4e3c36'], crack: '#22161a' },
    kiffex_hills: { wall: ['#1a2a3a', '#3a5a6a', '#8aa0a8'], floor: ['#3a4a24', '#4a5a2c', '#5a6a34'], crack: '#2e3a1c' },
    kiffex_sanctum: { wall: ['#0a080c', '#1e0c12', '#36141a'], floor: ['#22161a', '#301c20', '#3e2226'], crack: '#160c10' },
    avos_cave: { wall: ['#0a0c10', '#161c24', '#262c34'], floor: ['#2a2622', '#36302a', '#423a32'], crack: '#1e1a16' },
    fenn_house: { wall: ['#1e1210', '#3a2018', '#5a3424'], floor: ['#3a2418', '#4a2e1e', '#5a3a26'], crack: '#2a1810' },
    secura_chamber: { wall: ['#0e1018', '#1a2030', '#2a3448'], floor: ['#202838', '#2a3446', '#344056'], crack: '#161c28' },
    ordmantell_junk: { wall: ['#3a3a3e', '#5a5650', '#8a8070'], floor: ['#4a4438', '#5a5244', '#6a6050'], crack: '#3a3428' },
    kintan_wastes: { wall: ['#2a0e0a', '#5a1e10', '#a0401a'], floor: ['#1a1414', '#262020', '#322a28'], crack: '#120e0e' },
    kintan_fortress: { wall: ['#120a0a', '#2a1410', '#46221a'], floor: ['#221818', '#2e2020', '#3a2826'], crack: '#160e0e' },
    kintan_cell: { wall: ['#0c0a0a', '#1c1614', '#2c2420'], floor: ['#1a1614', '#24201c', '#2e2824'], crack: '#100c0a' },
    kintan_edge: { wall: ['#1a0806', '#4a140a', '#8a2a10'], floor: ['#221a18', '#2e2420', '#3a2e28'], crack: '#160e0c' },
    geonosis_arena: { wall: ['#5a2e14', '#7a3e1a', '#a85a2a'], floor: ['#a0642e', '#b8783a', '#c88a48'], crack: '#7a4a22' },
    wheel_maint: { wall: ['#0e0e14', '#1a1a26', '#2a2a3a'], floor: ['#22222c', '#2c2c38', '#363644'], crack: '#16161e' },
    wheel_pit: { wall: ['#0a0c0a', '#161c14', '#24301e'], floor: ['#20241a', '#2a3020', '#343a28'], crack: '#14180e' },
    wheel_shaft: { wall: ['#08080e', '#14141e', '#222232'], floor: ['#2a2a36', '#343442', '#40404e'], crack: '#1a1a24' },
    kamino_lab: { wall: ['#a8bcbc', '#c0d4d4', '#d8e8e8'], floor: ['#8aa0a4', '#98aeb2', '#a6bcc0'], crack: '#7a9094' },
    kamino_platform: { wall: ['#1a2228', '#2a343a', '#3a4a50'], floor: ['#4a5458', '#566064', '#626c70'], crack: '#3a4448' },
    hypori_wreck: { wall: ['#100c0c', '#1e1614', '#2e221c'], floor: ['#2a201a', '#342a22', '#3e322a'], crack: '#1a140e' },
    temple_hall: { wall: ['#2a2430', '#3a3440', '#4a4450'], floor: ['#4a3e34', '#5a4c40', '#6a5a4c'], crack: '#3a2e26' },
    devaron_suite: { wall: ['#2a1418', '#4a2228', '#6a3436'], floor: ['#5a3a2a', '#6a4632', '#7a523a'], crack: '#4a2e20' },
    devaron_base: { wall: ['#1a2230', '#2e3a4e', '#4a5a72'], floor: ['#3a3a30', '#46463a', '#525244'], crack: '#2e2e26' },
    devaron_cave: { wall: ['#0e1016', '#1a1e28', '#2a3040'], floor: ['#2a2a26', '#343430', '#3e3e38'], crack: '#1e1e1a' },
    cavamina_cantina: { wall: ['#140e10', '#2a1c1e', '#3e2a2a'], floor: ['#2e2220', '#3a2c28', '#463630'], crack: '#221816' },
    cavamina_forest: { wall: ['#0e1a14', '#1e3424', '#2e4e34'], floor: ['#2a3420', '#344028', '#3e4c30'], crack: '#1e2618' },
    duum_hq: { wall: ['#14141a', '#24242e', '#363644'], floor: ['#2a2a32', '#34343e', '#3e3e4a'], crack: '#1e1e26' },
    duum_fire: { wall: ['#1a0a08', '#3a140c', '#6a2410'], floor: ['#2a2020', '#342828', '#3e302e'], crack: '#1e1616' },
    honoghr_forest: { wall: ['#2a2414', '#4a401c', '#7a6a2a'], floor: ['#3a3218', '#4a401e', '#5a4e26'], crack: '#2a2412' },
    honoghr_temple: { wall: ['#0e0e0c', '#22221a', '#3a3a28'], floor: ['#26261e', '#303026', '#3a3a2e'], crack: '#1a1a14' },
    honoghr_ship: { wall: ['#1a140e', '#3a2e1a', '#6a5428'], floor: ['#2e2618', '#3a301e', '#463a24'], crack: '#221c12' },
    anzat_school: { wall: ['#0e0a10', '#201822', '#3a2c38'], floor: ['#2a2024', '#34282c', '#3e3034'], crack: '#1e161a' },
    anzat_dock: { wall: ['#0e0c14', '#1e1a2a', '#342e44'], floor: ['#2a2830', '#34323a', '#3e3c44'], crack: '#1e1c24' },
    saleucami_camp: { wall: ['#2a1a14', '#5a3420', '#9a5a30'], floor: ['#3a2a1e', '#4a3624', '#5a422c'], crack: '#2a1e14' },
    saleucami_caverns: { wall: ['#140808', '#3a1208', '#6a200c'], floor: ['#221614', '#2c1c18', '#36221c'], crack: '#160e0c' },
    saleucami_gate: { wall: ['#140808', '#3a1208', '#6a200c'], floor: ['#221614', '#2c1c18', '#36221c'], crack: '#160e0c' },
    vos_mind: { wall: ['#04040a', '#0c0c1a', '#16162a'], floor: ['#0e0e1a', '#141424', '#1a1a2e'], crack: '#08080e' },
    intrepid_gym: { wall: ['#141418', '#26262e', '#3a3a44'], floor: ['#2a2a30', '#34343a', '#3e3e46'], crack: '#1e1e24' },
    felucia_jungle: { wall: ['#1a3a2a', '#2a5a3a', '#4a8a4a'], floor: ['#2a3a1e', '#344624', '#3e522a'], crack: '#1e2a14' },
    felucia_nigkoe: { wall: ['#1a2420', '#2a3a32', '#3a5a4a'], floor: ['#2a302a', '#343c34', '#3e483e'], crack: '#1e241e' },
    felucia_kwayteow: { wall: ['#102018', '#2a4a34', '#4a7a4a'], floor: ['#2a3420', '#343e28', '#3e4a30'], crack: '#1e2616' },
    felucia_niango: { wall: ['#1a3020', '#3a6a3a', '#6a9a4a'], floor: ['#3a4424', '#46502c', '#525c34'], crack: '#2a3218' },
    endor_cave: { wall: ['#0a0a08', '#1a1810', '#2a2618'], floor: ['#22201a', '#2c2a22', '#36342a'], crack: '#16140e' }
  };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  const flip = c => {
    const m = document.createElement('canvas');
    m.width = c.width;
    m.height = c.height;
    const g = m.getContext('2d');
    g.translate(c.width, 0);
    g.scale(-1, 1);
    g.drawImage(c, 0, 0);
    return m;
  };

  const plot = (g, a, b, fn) => {
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
    for (let i = 0; i <= n; i++) fn(Math.round(a[0] + (b[0] - a[0]) * i / n), Math.round(a[1] + (b[1] - a[1]) * i / n));
  };

  const beam = (g, a, b, glow, core) => {
    g.fillStyle = glow;
    plot(g, a, b, (x, y) => { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); });
    g.fillStyle = core;
    plot(g, a, b, (x, y) => g.fillRect(x, y, 1, 1));
  };

  A.BattleView = class {
    constructor(ui, opts) {
      this.ui = ui;
      this.b = opts.battle;
      this.enc = opts.encounter || {};
      this.onEnd = opts.onEnd;
      this.defeats = opts.defeats || 0;
      this.sound = ui.vn ? ui.vn.sound : new A.Audio(ui);
      this.cache = new Map();
      this.vis = new Map();
      for (const u of this.b.units) this.addVis(u);
      this.fx = [];
      this.pops = [];
      this.rocks = [];
      this.queue = [];
      this.cur = null;
      this.t = 0;
      this.mode = 'intro';
      this.introT = this.b.advantage === 'none' ? 1 : 1.8;
      this.braceShown = this.b.braceUp;
      this.sel = { cat: 0, cmd: 0, tgt: 0, talk: 0, result: 0 };
      this.lastCat = {};
      this.hits = [];
      this.read = {};
      this.banner = null;
      this.talkShow = null;
      this.tl = this.b.timeline(9);
      this.queue.push(...this.b.begin());
      if (this.b.heroes().some(u => u.armed !== false)) this.sound.sfx('ignite');
    }

    addVis(u) {
      const shape = SHAPES[u.beast] || SHAPES.human;
      const v = {
        id: u.id, side: u.side, key: u.key, name: u.name, look: u.look, beast: u.beast, weapon: u.weapon, row: u.row, slot: u.slot,
        hp: u.hp, maxhp: u.maxhp, shape, x: 0, y: 0, hx: 0, hy: 0, speed: 8, off: 0, offY: 0, alpha: 1, down: u.hp <= 0,
        anim: null, lunge: null, hurtT: 0, flash: 0, fade: 0, fall: null
      };
      this.vis.set(u.id, v);
      this.place(v, true);
      return v;
    }

    home(v) {
      if (v.side === 'party') {
        const lane = PARTY_LANE[v.slot] === undefined ? v.slot : PARTY_LANE[v.slot];
        return [POS.party + lane * POS.partyShift, LANES[lane]];
      }
      const u = this.b.unit(v.id), air = u && u.fly && v.row === 'back' ? 16 : 0;
      return [(v.row === 'front' ? POS.front : POS.back) - v.slot * POS.shift, LANES[v.slot] - air];
    }

    place(v, snap) {
      const h = this.home(v);
      v.hx = h[0];
      v.hy = h[1];
      if (snap) { v.x = h[0]; v.y = h[1]; }
    }

    dir(v) { return v.side === 'party' ? -1 : 1; }
    chest(v) { return [v.x + v.shape.chest[0] * this.dir(v), v.y + v.shape.chest[1]]; }
    hand(v) { return [v.x + v.off + v.shape.hand[0] * this.dir(v), v.y + v.offY + v.shape.hand[1]]; }

    hero() {
      const u = this.b.current();
      return u && u.side === 'party' && !this.b.over ? u : null;
    }

    sprite(v, frame) {
      const key = (v.beast || v.look) + ':' + frame + ':' + (v.weapon || '') + ':' + v.side;
      let c = this.cache.get(key);
      if (!c) {
        c = (v.beast ? A.Pix.beast(v.beast, frame) : A.Pix.battle(v.look, frame, v.weapon)).canvas();
        if (v.side === 'enemy' && !v.beast) c = flip(c);
        this.cache.set(key, c);
      }
      return c;
    }

    icon(id) {
      let c = this.cache.get('icon:' + id);
      if (!c) {
        c = A.Pix.icon(id).canvas();
        this.cache.set('icon:' + id, c);
      }
      return c;
    }

    frameOf(v) {
      if (v.down) return 'ko';
      if (v.anim && v.anim.t < v.anim.d) return v.anim.frames[Math.min(v.anim.frames.length - 1, Math.floor(v.anim.t / v.anim.d * v.anim.frames.length))];
      if (v.hurtT > 0) return 'hurt';
      return Math.floor(this.t * 2 + v.slot * 0.7) % 2 ? 'idle1' : 'idle0';
    }

    pose(v, kind, d) {
      const frames = kind === 'force' && !v.beast ? ['force0', 'force1', 'force2'] : v.beast ? ['attack0', 'attack1', 'attack2'] : ['attack0', 'attack1', 'attack2', 'attack3'];
      v.anim = { frames, t: 0, d };
    }

    say(v, text) {
      this.banner = { text: v ? `${v.name} · ${text}` : text, t: 1.4 };
    }

    pop(v, text, col, dy) {
      this.pops.push({ x: (v.x + v.off) * 2, y: (v.y - v.shape.ay - 2) * 2 + (dy || 0), text, col: col || '#ffffff', t: 0, life: 1 });
    }

    hit(v, dmg, e) {
      e = e || {};
      v.hp = Math.max(0, v.hp - dmg);
      if (e.immune) this.pop(v, e.cortosis ? 'кортозис' : 'нет урона', '#b0b0b8');
      else this.pop(v, String(dmg), e.color || (e.weak ? '#ffd040' : e.resist ? '#a0a0a8' : '#ffffff'));
      if (e.breach) this.pop(v, 'БРЕШЬ', '#ffa040', -18);
      if (dmg > 0) {
        v.hurtT = 0.3;
        v.flash = 0.08;
        const sk = e.skill && A.SKILLS[e.skill];
        this.sound.sfx(sk && sk.type === 'blade' && !v.beast ? 'clash' : 'hit');
      }
    }

    beat(e) {
      const V = id => this.vis.get(id);
      switch (e.type) {
        case 'turn': {
          this.actor = e.who;
          if (this.tl) {
            const i = this.tl.indexOf(e.who);
            this.tl = i >= 0 ? this.tl.slice(i) : [e.who].concat(this.tl);
          }
          const v = V(e.who);
          return { d: v && v.side === 'enemy' ? 0.16 : 0.04 };
        }
        case 'use': {
          const v = V(e.who), sk = A.SKILLS[e.skill];
          this.say(v, sk.name);
          if (sk.menu === 'force' || sk.menu === 'own' || e.skill === 'focus') this.pose(v, 'force', 0.5);
          return { d: 0.18 };
        }
        case 'strike': {
          const src = V(e.who), tgt = V(e.target), sk = A.SKILLS[e.skill];
          const land = () => this.hit(tgt, e.dmg, e);
          if (src.side === 'enemy') this.say(src, sk.name);
          if (e.skill === 'push' || e.skill === 'instinct') {
            this.fx.push({ kind: 'wave', from: this.hand(src), to: this.chest(tgt), t: 0, life: 0.3 });
            this.sound.sfx('force');
            return { d: 0.42, hits: [[0.72, land]] };
          }
          if (e.skill === 'vlightning') {
            this.pose(src, 'force', 0.45);
            this.fx.push({ kind: 'lightning', from: this.hand(src), to: this.chest(tgt), t: 0, life: 0.4 });
            this.sound.sfx('lightning');
            return { d: 0.46, hits: [[0.55, land]] };
          }
          if (e.skill === 'throw') {
            this.pose(src, 'attack', 0.3);
            this.fx.push({ kind: 'saber', from: this.hand(src), to: this.chest(tgt), t: 0, life: 0.42, col: (this.b.unit(src.id) || {}).saber || (A.HEROES[src.key] || {}).blade || '#e83a2a' });
            this.sound.sfx('blade');
            return { d: 0.4, hits: [[0.5, land]] };
          }
          this.pose(src, 'attack', 0.36);
          if (MELEE.has(e.skill)) src.lunge = { t: 0, d: 0.36, dx: (tgt.x - src.x) * 0.72, arc: e.skill === 'leap' ? 18 : 0 };
          this.sound.sfx(src.beast || e.skill === 'fists' || e.skill === 'zap' ? 'hit' : 'blade');
          return { d: 0.4, hits: [[0.5, land]] };
        }
        case 'shot': {
          const src = V(e.who), tgt = V(e.target), from = this.hand(src), to = this.chest(tgt);
          this.say(src, 'Выстрел');
          this.pose(src, 'attack', 0.3);
          this.sound.sfx('shot');
          this.fx.push({ kind: 'bolt', from, to, t: 0, life: 0.2 });
          if (!e.deflected && !e.shielded) return { d: 0.36, hits: [[0.55, () => this.hit(tgt, e.dmg)]] };
          const aim = V(e.to) || src;
          return {
            d: 0.62,
            hits: [
              [0.33, () => {
                this.pose(tgt, 'attack', 0.22);
                this.sound.sfx('deflect');
                this.pop(tgt, 'отражено', '#ff9a80');
                this.fx.push({ kind: 'bolt', from: to, to: this.chest(aim), t: 0, life: 0.18 });
              }],
              [0.66, () => (e.shielded ? this.pop(aim, 'щит держит', '#9ad8ff', -18) : this.hit(aim, e.deflected))]
            ]
          };
        }
        case 'line': {
          this.speech = { text: e.text, who: e.who, t: 0 };
          const m = e.frag && A.Memory.get(e.frag);
          if (m && A.Memory.has(this.b.S, e.frag)) this.flash = { still: m.still, t: 1.4 };
          return { d: 0.9 };
        }
        case 'will':
          this.will = e.value;
          return { d: 0.15 };
        case 'duelEnd':
          this.banner = { text: e.text, t: 2.4 };
          this.speech = null;
          return { d: 1.4 };
        case 'vanish': {
          const v = V(e.who);
          this.pop(v, 'исчез', '#c8a8ff');
          this.sound.sfx('force');
          for (const id of e.illusions) {
            const u = this.b.unit(id), iv = this.vis.get(id) || this.addVis(u);
            iv.alpha = 0;
            iv.fadeIn = true;
          }
          this.banner = { text: 'Каркко растворяется в воздухе. Вокруг встают мороки', t: 1.8 };
          return { d: 0.7 };
        }
        case 'dispel': {
          const v = V(e.target);
          this.pop(v, 'морок', '#c8a8ff');
          v.fade = 1;
          return { d: 0.3 };
        }
        case 'unveil':
          this.banner = { text: e.byRead ? 'Чутьё Воса находит настоящего Каркко' : 'Каркко появляется у Воса за спиной', t: 1.8 };
          return { d: 0.6 };
        case 'three':
          this.banner = { text: 'Сила троих: мастера снаружи отдают Восу свою силу', t: 2.2 };
          this.sound.sfx('heal');
          return { d: 1 };
        case 'salute': {
          const v = V(e.who);
          this.banner = { text: 'Каркко салютует клинком. Вос бьёт.', t: 2.4 };
          this.sound.sfx('clash');
          v.fade = 1;
          return { d: 1.4 };
        }
        case 'rooted':
          this.pop(V(e.who), 'корни держат', '#a8d070');
          return { d: 0.25 };
        case 'flee': {
          const v = V(e.target);
          this.pop(v, 'бежит', '#d8c8a8', -18);
          v.fade = 1;
          v.leaving = true;
          return { d: 0.35 };
        }
        case 'instinct': {
          const v = V(e.who);
          this.banner = { text: 'Инстинкт: Эйла бьёт Силой, не помня как', t: 1.8 };
          this.pose(v, 'force', 0.5);
          this.pop(v, 'инстинкт', '#8ad8ff', -18);
          return { d: 0.5 };
        }
        case 'down': {
          const v = V(e.target);
          if (e.ko) this.pop(v, 'без сознания', '#d8c8a8', -18);
          v.down = true;
          if (v.side === 'enemy') v.fade = 1;
          this.sound.sfx('down');
          return { d: 0.28 };
        }
        case 'move': {
          const v = V(e.target);
          v.row = e.to[0];
          v.slot = e.to[1];
          v.speed = e.how === 'advance' ? 6 : 14;
          this.place(v);
          if (e.how === 'advance') this.say(v, 'Шаг вперёд');
          return { d: 0.32 };
        }
        case 'collide': {
          const v = V(e.target);
          this.hit(v, e.dmg);
          this.pop(v, 'удар о своих', '#d8c8a8', -18);
          return { d: 0.32 };
        }
        case 'fall': {
          const v = V(e.target), where = A.HAZARDS[e.hazard] || e.hazard;
          if (e.kind === 'out') {
            v.fall = { t: 0 };
            this.pop(v, where + '!', '#ff8a6a');
            this.sound.sfx('down');
            return { d: 0.7 };
          }
          this.hit(v, e.dmg);
          this.pop(v, 'край: ' + where, '#ff8a6a', -18);
          return { d: 0.45 };
        }
        case 'collapse': {
          this.braceShown = false;
          this.sound.sfx('rocks');
          for (let i = 0; i < 26; i++) this.rocks.push({ x: 8 + (i * 37) % 70, y: 30 - (i * 13) % 40, vy: 20 + (i * 7) % 30, s: 2 + i % 3 });
          const hits = [];
          for (const [id, kind, dmg] of e.hit) {
            const v = V(id);
            if (kind === 'out') hits.push([0.55, () => { v.fade = 1; this.pop(v, 'под завалом', '#d8c8a8'); }]);
            else hits.push([0.6, () => this.hit(v, dmg)]);
          }
          return { d: 0.95, hits };
        }
        case 'summon': {
          const u = this.b.unit(e.target), v = this.vis.get(e.target) || this.addVis(u);
          v.alpha = 0;
          v.fadeIn = true;
          if (e.who) this.say(V(e.who), 'Зов роя');
          else this.pop(v, e.text || 'новый враг', '#a8e0ff', -18);
          return { d: 0.45 };
        }
        case 'idle':
          this.say(V(e.who), A.SKILLS[e.skill].name);
          return { d: 0.3 };
        case 'evade':
          this.say(V(e.who), A.SKILLS[e.skill].name);
          this.pop(V(e.target), 'мимо', '#a8e8c8');
          return { d: 0.32 };
        case 'status':
          this.pop(V(e.target), STATUS_NAMES[e.status] || e.status, '#c8b8ff', -18);
          return { d: 0.3 };
        case 'poison':
          this.hit(V(e.target), e.dmg, { color: '#7ad86a' });
          return { d: 0.32 };
        case 'stunned':
          this.pop(V(e.who), 'оглушение: ход пропущен', '#f8e070');
          return { d: 0.5 };
        case 'resist':
          this.pop(V(e.target), 'не сдвинулся', '#d8c8a8', -18);
          return { d: 0.32 };
        case 'stance':
          this.pop(V(e.who), e.stance === 'deflect' ? `Отражение: ${e.charges}` : STANCES[e.stance] || e.stance, '#ffc8a0');
          this.fx.push({ kind: 'glow', at: V(e.who), t: 0, life: 0.4, col: e.stance === 'deflect' ? '#ff8070' : '#8ad0ff' });
          return { d: 0.3 };
        case 'reveal':
          for (const id of e.targets) this.pop(V(id), 'раскрыт', '#8ad8ff');
          this.fx.push({ kind: 'sense', t: 0, life: 0.6 });
          return { d: 0.55 };
        case 'read': {
          const v = V(e.target);
          this.read[e.target] = e.intents;
          this.pop(v, 'Прочтение', '#8ad8ff');
          this.banner = { text: `${v.name}: дальше ${e.intents.map(i => i.name.toLowerCase()).join(', ')}`, t: 2.2 };
          return { d: 0.9 };
        }
        case 'talk':
          this.talkShow = e;
          return {
            d: 0.1, wait: true,
            done: () => {
              this.talkShow = null;
              const v = V(e.target);
              if (e.outcome === 'rage') this.pop(v, 'ярость', '#ff4a3a');
              else { v.fade = 1; v.leaving = true; }
            }
          };
        case 'heal': {
          const v = V(e.target);
          v.hp = Math.min(v.maxhp, v.hp + e.amount);
          this.pop(v, '+' + e.amount, '#7ae07a');
          this.sound.sfx('heal');
          return { d: 0.35 };
        }
        case 'tempo':
          this.pop(V('aayla'), `+${e.amount} Темпа`, '#ff9a80');
          return { d: 0.3 };
        case 'cure':
          this.pop(V(e.target), 'яд снят', '#7ae07a');
          return { d: 0.3 };
        case 'escape':
          for (const v of this.vis.values()) if (v.side === 'party') { v.hx += 90; v.speed = 4; }
          this.say(null, 'Отход');
          return { d: 0.65 };
        case 'victory':
          this.say(null, 'Победа');
          return { d: 0.4 };
        case 'defeat':
          this.say(null, 'Отряд пал');
          return { d: 0.6 };
        case 'bet':
          this.say(V(e.who), e.kind === 'fast' ? `Ставка ${e.stake}: быстрая победа` : `Ставка ${e.stake}: без ран`);
          return { d: 0.5 };
        case 'counter':
          this.pop(V(e.who), 'Джем-Со: ответ', '#ffd27a', -18);
          return { d: 0.25 };
        case 'chip':
          this.say(V(e.who), 'Счастливая фишка Вилли');
          this.pop(V(e.who), '+' + e.hp, '#a8f0a0', -18);
          return { d: 0.8 };
      }
      return null;
    }

    next() {
      while (!this.cur && this.queue.length) {
        const bt = this.beat(this.queue.shift());
        if (!bt) continue;
        this.cur = { t: 0, d: bt.d || 0, wait: !!bt.wait, done: bt.done, hits: (bt.hits || []).map(([at, fn]) => ({ at, fn, done: false })) };
      }
    }

    play(step) {
      this.next();
      while (this.cur) {
        const c = this.cur;
        c.t += step;
        step = 0;
        for (const h of c.hits) if (!h.done && c.t >= h.at * c.d) { h.done = true; h.fn(); }
        if (c.wait || c.t < c.d) return;
        for (const h of c.hits) if (!h.done) { h.done = true; h.fn(); }
        if (c.done) c.done();
        this.cur = null;
        this.next();
      }
      this.settle();
    }

    settle() {
      for (const u of this.b.units) {
        const v = this.vis.get(u.id) || this.addVis(u);
        v.hp = u.hp;
        v.maxhp = u.maxhp;
        if (v.row !== u.row || v.slot !== u.slot) {
          v.row = u.row;
          v.slot = u.slot;
          this.place(v);
        }
        if (u.gone && !v.fade && !v.fall) v.fade = 1;
        v.down = u.hp <= 0;
      }
      this.tl = null;
      this.actor = null;
      const over = this.b.over;
      if (!over && this.b.ask) {
        this.mode = 'ask';
        this.sel.ask = 0;
        return;
      }
      if (over === 'win' || over === 'end') {
        this.res = this.b.finish();
        this.mode = 'result';
        this.sound.sfx('win');
      } else if (over === 'lose') {
        this.mode = 'result';
        this.sel.result = 0;
        this.sound.sfx('lose');
      } else if (over === 'flee') {
        this.res = this.b.finish();
        this.end({ over: 'flee', res: this.res });
      } else this.openCmd();
    }

    end(r) {
      if (this.done) return;
      this.done = true;
      this.mode = 'done';
      this.onEnd(r);
    }

    cats() {
      const u = this.hero();
      if (!u) return [];
      const cmds = this.b.commands(u);
      return CAT_ORDER.map(id => ({ id, name: CATS[id], cmds: cmds.filter(c => c.menu === id) }))
        .filter(c => c.cmds.length)
        .map(c => Object.assign(c, { enabled: c.cmds.some(x => x.enabled), why: c.cmds.some(x => x.enabled) ? null : c.cmds[0].why }));
    }

    openCmd() {
      const u = this.hero();
      if (!u) return;
      this.mode = 'cmd';
      const cats = this.cats();
      this.sel.cat = Math.min(cats.length - 1, this.lastCat[u.id] || 0);
      this.sel.cmd = 0;
      this.pending = null;
    }

    cmdList() {
      const c = this.cats()[this.sel.cat];
      return c ? c.cmds : [];
    }

    targetsFor(u, cmd) {
      if (cmd.id === 'flee') return null;
      if (cmd.id.startsWith('item:')) {
        const it = A.ITEMS[cmd.id.slice(5)];
        return it.tempo ? null : this.b.heroes().map(h => h.id);
      }
      const sk = A.SKILLS[cmd.id];
      if (sk && sk.effect === 'deflect' && (u.deflectLevel || 1) >= 3) return this.b.targets(u, cmd.id);
      if (!sk || sk.target === 'self' || sk.target === 'none') return null;
      return this.b.targets(u, cmd.id);
    }

    choose(cmd) {
      const u = this.hero();
      this.pending = cmd;
      const list = this.targetsFor(u, cmd);
      if (!list) return this.commit(cmd.id);
      this.tgts = list.slice().sort((p, q) => this.order(p) - this.order(q));
      this.sel.tgt = 0;
      if (cmd.id.startsWith('item:') && A.ITEMS[cmd.id.slice(5)].heal) {
        let low = 2;
        this.tgts.forEach((id, i) => { const h = this.b.unit(id), r = h.hp / h.maxhp; if (r < low) { low = r; this.sel.tgt = i; } });
      }
      this.backTo = this.cmdList().length === 1 ? 'cmd' : 'skill';
      this.mode = 'target';
      this.sound.click();
    }

    order(id) {
      if (id === 'front' || id === 'frontAll' || id === 'fast') return 0;
      if (id === 'back' || id === 'clean') return 1;
      const u = this.b.unit(id);
      if (!u) return 9;
      return u.side === 'party' ? u.slot : (u.row === 'front' ? 0 : 3) + u.slot;
    }

    commit(skillId, target, extra) {
      const u = this.hero();
      if (!u) return;
      let tgt = target;
      if (tgt === undefined || tgt === null) {
        const sk = A.SKILLS[skillId];
        tgt = skillId.startsWith('item:') ? 'aayla' : sk && sk.target === 'none' ? 'none' : u.id;
      }
      this.lastCat[u.id] = this.sel.cat;
      this.actor = u.id;
      this.tl = [u.id].concat(this.b.forecast(u, skillId, 8));
      const ev = this.b.act(skillId, tgt, extra);
      this.queue.push(...ev);
      this.mode = 'play';
      this.pending = null;
      this.sound.click();
    }

    tpos(id) {
      if (id === 'front' || id === 'frontAll') return [POS.front, LANES[1]];
      if (id === 'back') return [POS.back, LANES[1]];
      if (id === 'fast' || id === 'clean') return [id === 'fast' ? POS.back : POS.front, LANES[0]];
      const v = this.vis.get(id);
      return v ? [v.hx, v.hy] : [160, 120];
    }

    moveTarget(dx, dy) {
      const n = this.tgts.length;
      if (n < 2) return;
      const cur = this.tpos(this.tgts[this.sel.tgt]);
      let best = -1, bd = Infinity;
      this.tgts.forEach((id, i) => {
        if (i === this.sel.tgt) return;
        const p = this.tpos(id), ex = p[0] - cur[0], ey = p[1] - cur[1];
        if ((dx && Math.sign(ex) !== dx) || (dy && Math.sign(ey) !== dy)) return;
        const d = Math.abs(ex) * (dx ? 1 : 3) + Math.abs(ey) * (dy ? 1 : 3);
        if (d < bd) { bd = d; best = i; }
      });
      this.sel.tgt = best >= 0 ? best : (this.sel.tgt + (dx + dy > 0 ? 1 : -1) + n) % n;
      this.sound.blip(900);
    }

    answer(id) {
      const ev = this.b.answer(id);
      this.queue.push(...ev);
      this.mode = 'play';
      this.sound.click();
    }

    drawAsk(g) {
      const F = A.Font, K = A.UIKit, q = this.b.ask;
      if (!q) return;
      const lines = F.wrap('text', q.text, 592), h = 30 + lines.length * 18 + q.options.length * 26, y = Math.min(346, 474 - h);
      K.bevel(g, 8, y, 624, 474 - y, '#120c18', '#c8a070', '#3a2418');
      lines.forEach((l, i) => F.draw(g, 'text', l, 24, y + 10 + i * 18, '#f0e0c8', K.SHADOW));
      this.hits = [];
      q.options.forEach((o, i) => {
        const oy = y + 18 + lines.length * 18 + i * 26, on = i === this.sel.ask;
        if (on) {
          g.fillStyle = 'rgba(200,160,112,0.25)';
          g.fillRect(16, oy - 2, 608, 24);
        }
        F.draw(g, on ? 'bold' : 'text', (on ? '> ' : '  ') + o.text, 28, oy + 2, on ? K.GOLD : K.INK, K.SHADOW);
        this.hits.push({ x: 16, y: oy - 2, w: 608, h: 24, hover: () => { this.sel.ask = i; }, fn: () => this.answer(o.id) });
      });
    }

    wantsBack() {
      return this.mode === 'skill' || this.mode === 'target' || this.mode === 'talk';
    }

    key(code) {
      const up = code === 'ArrowUp' || code === 'KeyW', down = code === 'ArrowDown' || code === 'KeyS';
      const left = code === 'ArrowLeft' || code === 'KeyA', right = code === 'ArrowRight' || code === 'KeyD';
      const ok = code === 'Enter' || code === 'Space', back = code === 'Escape';
      const wrap = (i, n) => (n ? (i + n) % n : 0);
      switch (this.mode) {
        case 'intro':
          if (ok) { this.introT = 0; return true; }
          return !back;
        case 'play':
          if (ok && this.cur && this.cur.wait) { this.cur.wait = false; this.cur.t = this.cur.d; return true; }
          return !back;
        case 'cmd': {
          const cats = this.cats();
          if (up || down) { this.sel.cat = wrap(this.sel.cat + (up ? -1 : 1), cats.length); this.sel.cmd = 0; this.sound.blip(900); return true; }
          if (ok || right) {
            const c = cats[this.sel.cat];
            if (!c || !c.enabled) { this.sound.blip(300); return true; }
            if (c.cmds.length === 1 && (c.id === 'talk' || c.id === 'flee')) { this.choose(c.cmds[0]); return true; }
            this.mode = 'skill';
            this.sel.cmd = Math.max(0, c.cmds.findIndex(x => x.enabled));
            this.sound.click();
            return true;
          }
          return !back;
        }
        case 'skill': {
          const list = this.cmdList();
          if (up || down) { this.sel.cmd = wrap(this.sel.cmd + (up ? -1 : 1), list.length); this.sound.blip(900); return true; }
          if (ok || right) {
            const c = list[this.sel.cmd];
            if (!c || !c.enabled) { this.sound.blip(300); return true; }
            this.choose(c);
            return true;
          }
          if (back || left) { this.mode = 'cmd'; this.sound.blip(600); return true; }
          return true;
        }
        case 'target':
          if (up || down || left || right) { this.moveTarget(left ? -1 : right ? 1 : 0, up ? -1 : down ? 1 : 0); return true; }
          if (ok) {
            const t = this.tgts[this.sel.tgt];
            if (this.pending.id === 'talk') {
              this.talkTarget = t;
              const list = this.b.approaches(this.b.unit(t));
              this.sel.talk = Math.max(0, list.findIndex(a => a.enabled));
              this.mode = 'talk';
              this.sound.click();
              return true;
            }
            this.commit(this.pending.id, t);
            return true;
          }
          if (back) { this.mode = this.backTo; this.sound.blip(600); return true; }
          return true;
        case 'talk': {
          const list = this.b.approaches(this.b.unit(this.talkTarget));
          if (up || down) { this.sel.talk = wrap(this.sel.talk + (up ? -1 : 1), list.length); this.sound.blip(900); return true; }
          if (ok) {
            const a = list[this.sel.talk];
            if (!a.enabled) { this.sound.blip(300); return true; }
            this.commit('talk', this.talkTarget, { approach: a.id });
            return true;
          }
          if (back) { this.mode = 'target'; this.sound.blip(600); return true; }
          return true;
        }
        case 'ask': {
          const q = this.b.ask;
          if (!q) { this.settle(); return true; }
          if (up || down) { this.sel.ask = wrap(this.sel.ask + (up ? -1 : 1), q.options.length); this.sound.blip(900); return true; }
          if (ok) { this.answer(q.options[this.sel.ask].id); return true; }
          return !back;
        }
        case 'result': {
          const opts = this.resultOptions();
          if (up || down) { this.sel.result = wrap(this.sel.result + (up ? -1 : 1), opts.length); this.sound.blip(900); return true; }
          if (ok) { opts[this.sel.result].act(); return true; }
          return !back;
        }
      }
      return false;
    }

    resultOptions() {
      if (this.b.over === 'win' || this.b.over === 'end') return [{ label: 'Дальше', act: () => this.end({ over: this.b.over, res: this.res }) }];
      const opts = [{ label: 'Повторить бой', act: () => this.end({ over: 'lose', help: false }) }];
      if (A.DIFFICULTY[this.b.S.difficulty || 'normal'].help && this.defeats + 1 >= 2) opts.push({ label: 'Повторить с Помощью Силы: +25 % здоровья и Силы', act: () => this.end({ over: 'lose', help: true }) });
      return opts;
    }

    click(x, y, button) {
      if (button === 2) return this.key('Escape');
      for (let i = this.hits.length - 1; i >= 0; i--) {
        const h = this.hits[i];
        if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) { if (h.hover) h.hover(); return h.fn(); }
      }
      if (this.mode === 'intro' || this.mode === 'play' || this.mode === 'result') this.key('Enter');
    }

    hover(x, y) {
      for (let i = this.hits.length - 1; i >= 0; i--) {
        const h = this.hits[i];
        if (h.hover && x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) return h.hover();
      }
    }

    update(dt) {
      this.t += dt;
      const held = this.ui.held ? this.ui.held() : new Set();
      const step = this.mode === 'play' && (held.has('Enter') || held.has('Space')) ? dt * 3 : dt;
      if (this.mode === 'intro') {
        this.introT -= dt;
        if (this.introT <= 0) this.mode = 'play';
      }
      for (const v of this.vis.values()) {
        const k = Math.min(1, dt * v.speed);
        v.x += (v.hx - v.x) * k;
        v.y += (v.hy - v.y) * k;
        if (Math.abs(v.hx - v.x) < 0.5) v.speed = 8;
        if (v.anim) v.anim.t += step;
        if (v.lunge) {
          v.lunge.t += step;
          const f = Math.min(1, v.lunge.t / v.lunge.d), s = Math.sin(Math.PI * f);
          v.off = v.lunge.dx * s;
          v.offY = -v.lunge.arc * s;
          if (f >= 1) { v.lunge = null; v.off = 0; v.offY = 0; }
        }
        v.hurtT = Math.max(0, v.hurtT - step);
        v.flash = Math.max(0, v.flash - step);
        if (v.fadeIn) { v.alpha = Math.min(1, v.alpha + step * 3); if (v.alpha >= 1) v.fadeIn = false; }
        if (v.fade && !v.fadeIn) {
          v.fade = Math.max(0, v.fade - step * (v.leaving ? 1.2 : 1.6));
          v.alpha = Math.min(v.alpha, v.fade);
          if (v.leaving) v.hx -= dt * 50;
        }
        if (v.fall) {
          v.fall.t += step;
          v.hx = v.x = v.x - step * 40;
          v.offY = v.fall.t * v.fall.t * 260;
          v.alpha = Math.max(0, 1 - v.fall.t * 1.6);
        }
      }
      for (const f of this.fx) f.t += step;
      this.fx = this.fx.filter(f => f.t < f.life);
      for (const p of this.pops) p.t += dt;
      this.pops = this.pops.filter(p => p.t < p.life);
      for (const r of this.rocks) { r.vy += 300 * step; r.y += r.vy * step; }
      this.rocks = this.rocks.filter(r => r.y < 150);
      if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
      if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; }
      if (this.mode === 'play') this.play(step);
    }

    bg() {
      const scene = this.b.group.scene || 'cave', key = scene + ':' + (this.b.hazard || '');
      if (this.bgKey === key) return this.bgCanvas;
      const S = SCENES[scene] || SCENES.cave, R = new A.Art.Raster(320, 240);
      R.dither(0, 0, 320, 98, S.wall);
      R.dither(0, 96, 320, 76, S.floor);
      for (const [y, w] of [[104, 1], [114, 1], [128, 1], [146, 1], [166, 1]]) R.rect(0, y, 320, w, S.crack);
      for (let i = 0; i < 14; i++) {
        const x = (i * 53) % 320;
        R.poly([[x, 0], [x + 9, 0], [x + 4, 8 + (i * 7) % 14]], S.wall[0]);
      }
      if (scene === 'mine') {
        R.rect(0, 18, 320, 4, '#3a2a1c');
        for (let x = 30; x < 320; x += 58) R.rect(x, 18, 6, 80, '#46321f');
        R.rect(0, 160, 320, 1, '#6a6a70');
        R.rect(0, 167, 320, 1, '#6a6a70');
        for (let x = 4; x < 320; x += 12) R.rect(x, 159, 3, 10, '#3a2a1c');
        for (let i = 0; i < 7; i++) {
          const x = 20 + i * 44, y = 40 + (i * 17) % 40;
          R.poly([[x, y - 4], [x + 3, y], [x, y + 4], [x - 3, y]], '#2a7a9a');
          R.set(x, y - 1, '#a8f0ff');
        }
      } else if (scene === 'estate') {
        for (let x = 24; x < 320; x += 72) {
          R.rect(x, 10, 10, 86, '#4a2a2a');
          R.rect(x + 2, 10, 2, 86, '#6a3a34');
          R.rect(x - 4, 30, 18, 6, '#c8903a');
          R.set(x + 4, 28, '#ffe0a0');
        }
        R.dither(40, 104, 240, 52, ['#5a1a2a', '#7a2a3a', '#5a1a2a']);
        R.rect(40, 104, 240, 2, '#c8a050');
        R.rect(40, 154, 240, 2, '#c8a050');
      } else if (scene === 'kiffex_temple' || scene === 'kiffex_sanctum') {
        for (let x = 20; x < 320; x += 66) {
          R.rect(x, 6, 12, 92, scene === 'kiffex_sanctum' ? '#3a1a20' : '#2e2428');
          R.rect(x + 2, 6, 2, 92, '#4a3438');
          R.rect(x - 3, 2, 18, 5, '#4a3438');
        }
        if (scene === 'kiffex_sanctum') {
          R.rect(140, 30, 40, 50, '#24101a');
          R.rect(146, 36, 28, 44, '#3a1822');
          R.rect(150, 20, 20, 12, '#5a2028');
        }
      } else if (scene === 'kiffex_post') {
        for (let x = 10; x < 320; x += 48) {
          R.rect(x, 20, 30, 50, '#2a3038');
          R.rect(x + 3, 24, 24, 14, '#4a6a7a');
          R.rect(x + 3, 42, 24, 2, '#c8a040');
        }
        for (let x = 0; x < 320; x += 6) R.rect(x, 86, 3, 10, '#1a1e24');
      } else if (scene === 'kiffex_cantina') {
        R.rect(20, 40, 280, 10, '#5a3a2a');
        R.rect(20, 50, 280, 44, '#3a2420');
        for (let x = 40; x < 300; x += 34) {
          R.rect(x, 26, 6, 14, '#8a6a3a');
          R.set(x + 2, 25, '#ffd080');
        }
        for (let i = 0; i < 18; i++) R.set(20 + (i * 47) % 280, 12 + (i * 13) % 20, '#6a5a5a');
      } else if (scene === 'kiffex_hills') {
        R.dither(0, 0, 320, 60, ['#1a2a3a', '#3a5a6a', '#8aa0a8']);
        for (let i = 0; i < 6; i++) R.poly([[i * 64 - 20, 98], [i * 64 + 22, 46 + (i * 17) % 20], [i * 64 + 70, 98]], i % 2 ? '#3a4a2a' : '#2e3e22');
        for (let i = 0; i < 12; i++) R.rect(12 + i * 27, 100 + (i * 11) % 30, 3, 6, '#2a3a1a');
      } else if (scene === 'fenn_house') {
        for (let x = 30; x < 320; x += 80) {
          R.rect(x, 20, 40, 60, '#4a2a1c');
          R.rect(x + 4, 24, 32, 52, '#6a3a24');
          R.rect(x + 18, 24, 2, 52, '#3a2016');
        }
        R.dither(30, 104, 260, 40, ['#5a2014', '#7a3018', '#5a2014']);
      } else if (scene === 'secura_chamber') {
        R.rect(130, 14, 60, 70, '#0a0e18');
        R.dither(132, 16, 56, 66, ['#1a2a4a', '#3a5a8a', '#1a2a4a']);
        R.rect(158, 14, 2, 70, '#2a3448');
        R.rect(30, 70, 70, 26, '#3a2a3a');
        R.rect(30, 66, 70, 6, '#6a5a7a');
      } else if (scene === 'ordmantell_junk') {
        for (let i = 0; i < 9; i++) {
          const x = i * 38 - 10, h = 30 + (i * 17) % 40;
          R.poly([[x, 98], [x + 20, 98 - h], [x + 46, 98]], i % 2 ? '#4a4a4e' : '#5a5248');
          R.rect(x + 12, 98 - h / 2, 10, 4, '#7a6a5a');
        }
      } else if (scene === 'kintan_wastes' || scene === 'kintan_edge') {
        R.dither(0, 0, 320, 70, scene === 'kintan_edge' ? ['#1a0806', '#4a140a', '#8a2a10'] : ['#3a120a', '#7a2a12', '#c05a20']);
        for (let i = 0; i < 7; i++) R.poly([[i * 52 - 10, 98], [i * 52 + 18, 50 + (i * 13) % 30], [i * 52 + 50, 98]], '#1a1010');
        if (scene === 'kintan_edge') R.dither(0, 160, 320, 12, ['#ff6a1a', '#c0300a', '#ff8a2a']);
      } else if (scene === 'kintan_fortress' || scene === 'kintan_cell') {
        for (let x = 16; x < 320; x += 48) {
          R.rect(x, 10, 14, 88, '#2a1814');
          R.rect(x + 3, 10, 3, 88, '#3a221c');
        }
        if (scene === 'kintan_cell') for (let x = 120; x < 200; x += 8) R.rect(x, 20, 2, 76, '#5a5048');
      } else if (scene === 'avos_cave') {
        for (let x = 18; x < 320; x += 74) {
          R.rect(x, 14, 6, 84, '#3a2e22');
          R.rect(x - 6, 14, 18, 4, '#4a3a2a');
        }
        R.rect(0, 12, 320, 3, '#2a2218');
        for (let i = 0; i < 40; i++) {
          const x = (i * 71) % 320, y = 20 + (i * 37) % 70;
          R.set(x, y, i % 3 ? '#2a7aa8' : '#8ae0ff');
        }
        R.ellipse(160, 74, 34, 40, '#06080c');
        R.rect(126, 74, 68, 24, '#06080c');
        for (let i = 0; i < 14; i++) R.set(140 + (i * 11) % 40, 50 + (i * 7) % 40, '#6ad0ff');
      } else if (scene === 'geonosis_arena') {
        R.dither(0, 0, 320, 40, ['#8a4a20', '#b8682a', '#e0a060']);
        for (let x = 0; x < 320; x += 4) R.rect(x, 40 + (x % 8 ? 0 : 1), 3, 22, '#6a3418');
        for (let i = 0; i < 140; i++) R.set((i * 37) % 320, 43 + (i * 13) % 18, i % 3 ? '#a0603a' : '#d8a060');
        R.rect(0, 62, 320, 4, '#4a2410');
        for (let x = 30; x < 320; x += 90) {
          R.rect(x, 50, 6, 46, '#7a4020');
          R.rect(x - 2, 48, 10, 3, '#a85a2a');
        }
      } else if (scene === 'wheel_maint' || scene === 'wheel_pit' || scene === 'wheel_shaft') {
        for (let y = 14; y < 90; y += 18) R.rect(0, y, 320, 3, '#2a2a3a');
        for (let x = 20; x < 320; x += 56) {
          R.rect(x, 0, 5, 96, '#24243a');
          R.rect(x + 1, 0, 1, 96, '#3a3a5a');
        }
        for (let i = 0; i < 8; i++) R.rect(14 + i * 40, 30 + (i % 3) * 12, 8, 2, '#d060c0');
        if (scene === 'wheel_pit') R.dither(0, 150, 320, 22, ['#1a2a1a', '#2a3a20', '#1a2a1a']);
        if (scene === 'wheel_shaft') {
          R.rect(0, 100, 320, 2, '#8a8aa0');
          for (let x = 0; x < 320; x += 10) R.rect(x, 96, 1, 6, '#6a6a80');
        }
      } else if (scene === 'kamino_lab') {
        for (let x = 10; x < 320; x += 60) {
          R.ellipse(x + 20, 46, 18, 22, '#c8dcdc');
          R.ellipse(x + 20, 46, 14, 18, '#7a9aa8');
        }
        R.rect(0, 90, 320, 6, '#a8c0c0');
      } else if (scene === 'kamino_platform') {
        for (let i = 0; i < 4; i++) R.ellipse(240 + i * 22, 70, 14, 10, '#4a5a60');
        R.rect(200, 76, 120, 20, '#3a4a50');
        for (let x = 0; x < 320; x += 16) R.rect(x, 96, 8, 1, '#5a6a70');
      } else if (scene === 'hypori_wreck') {
        for (let i = 0; i < 6; i++) R.poly([[i * 60, 0], [i * 60 + 30, 0], [i * 60 + 50, 90], [i * 60 + 40, 96]], i % 2 ? '#2a1e1a' : '#3a2a22');
        for (let i = 0; i < 20; i++) R.set((i * 53) % 320, 10 + (i * 29) % 80, '#ffb050');
      } else if (scene === 'temple_hall') {
        for (let x = 20; x < 320; x += 70) {
          R.rect(x, 4, 14, 92, '#5a5060');
          R.rect(x + 3, 4, 3, 92, '#7a7080');
        }
        R.dither(60, 110, 200, 50, ['#4a3a5a', '#5a4a6a', '#4a3a5a']);
      } else if (scene === 'devaron_suite') {
        for (let x = 24; x < 320; x += 72) {
          R.rect(x, 12, 12, 84, '#5a2a30');
          R.rect(x + 3, 12, 3, 84, '#7a3a40');
          R.rect(x - 4, 10, 20, 4, '#c8a050');
        }
        R.dither(40, 104, 240, 48, ['#4a1a2a', '#6a2a3a', '#4a1a2a']);
      } else if (scene === 'devaron_base' || scene === 'devaron_cave') {
        if (scene === 'devaron_base') {
          R.dither(0, 0, 320, 56, ['#3a4a6a', '#5a6a8a', '#8a9ab8']);
          for (let i = 0; i < 7; i++) R.poly([[i * 52 - 12, 98], [i * 52 + 20, 40 + (i * 13) % 22], [i * 52 + 54, 98]], i % 2 ? '#2a3448' : '#344058');
        } else {
          for (let i = 0; i < 9; i++) R.poly([[i * 38, 0], [i * 38 + 14, 0], [i * 38 + 7, 18 + (i * 11) % 22]], '#0a0c12');
          for (let i = 0; i < 16; i++) R.rect(12 + (i * 37) % 300, 60 + (i * 17) % 30, 6 + i % 4, 4, '#3a3e48');
        }
      } else if (scene === 'cavamina_cantina') {
        R.rect(20, 40, 280, 10, '#5a3a2a');
        R.rect(20, 50, 280, 44, '#3a2420');
        for (let x = 40; x < 300; x += 40) {
          R.rect(x, 26, 6, 14, '#8a6a3a');
          R.set(x + 2, 25, '#ffd080');
        }
      } else if (scene === 'cavamina_forest') {
        for (let i = 0; i < 9; i++) {
          const x = 10 + i * 36;
          R.rect(x, 20, 8, 78, '#2a1e14');
          R.ellipse(x + 4, 22, 20, 14, i % 2 ? '#1e3a24' : '#284a2c');
        }
      } else if (scene === 'duum_hq' || scene === 'duum_fire') {
        for (let x = 16; x < 320; x += 60) {
          R.rect(x, 10, 40, 60, '#20202a');
          R.rect(x + 4, 14, 32, 16, scene === 'duum_fire' ? '#6a2a10' : '#2a3a4a');
        }
        R.rect(0, 86, 320, 10, '#18181e');
        if (scene === 'duum_fire') for (let i = 0; i < 26; i++) R.rect(8 + (i * 47) % 304, 60 + (i * 13) % 34, 3 + i % 3, 6 + i % 5, i % 2 ? '#ff8a2a' : '#ffd060');
      } else if (scene === 'honoghr_forest' || scene === 'honoghr_ship') {
        for (let i = 0; i < 9; i++) {
          const x = 8 + i * 37, h = 50 + (i * 23) % 40;
          R.rect(x, 98 - h, 6, h, '#2a2010');
          R.line(x + 3, 98 - h + 10, x + 14, 98 - h, '#3a2c14');
          R.line(x + 3, 98 - h + 20, x - 8, 98 - h + 8, '#3a2c14');
        }
        for (let i = 0; i < 22; i++) R.rect((i * 47) % 320, 100 + (i * 13) % 60, 4, 2, '#c8b040');
        if (scene === 'honoghr_ship') {
          R.poly([[200, 96], [230, 60], [300, 64], [316, 96]], '#3a3a40');
          R.rect(236, 70, 40, 8, '#5a5a62');
        }
      } else if (scene === 'honoghr_temple') {
        for (let x = 14; x < 320; x += 62) {
          R.rect(x, 8, 16, 90, '#2a2a1e');
          R.rect(x + 3, 8, 3, 90, '#3e3e2c');
          for (let y = 20; y < 90; y += 18) R.rect(x + 6, y, 6, 2, '#6a6a3a');
        }
        R.rect(130, 30, 60, 66, '#141410');
        for (let i = 0; i < 6; i++) R.rect(138 + i * 8, 40 + (i % 2) * 10, 3, 3, '#8a8a4a');
      } else if (scene === 'anzat_school') {
        for (let x = 30; x < 320; x += 90) {
          R.rect(x, 10, 10, 86, '#2a1e28');
          R.rect(x + 2, 10, 2, 86, '#3e2e3a');
        }
        R.dither(40, 104, 240, 44, ['#2a1e22', '#3a2a2e', '#2a1e22']);
      } else if (scene === 'anzat_dock') {
        R.dither(0, 0, 320, 50, ['#0a0a14', '#14142a', '#0a0a14']);
        for (let i = 0; i < 30; i++) R.set((i * 59) % 320, (i * 17) % 46, '#c8c8e0');
        R.poly([[180, 96], [220, 50], [250, 44], [290, 70], [300, 96]], '#3a3a4a');
        R.rect(222, 60, 30, 6, '#6a6a8a');
        for (const x of [20, 70, 120]) { R.rect(x, 70, 30, 26, '#4a3e30'); R.rect(x, 82, 30, 1, '#2a2218'); }
      } else if (scene === 'saleucami_camp') {
        R.dither(0, 0, 320, 60, ['#3a1e14', '#7a3a1e', '#c0702a']);
        R.ellipse(160, 70, 120, 36, '#4a5a8a');
        R.ellipse(160, 74, 116, 32, '#2a1e1a');
        for (let i = 0; i < 6; i++) R.poly([[i * 60, 98], [i * 60 + 18, 80], [i * 60 + 36, 98]], '#5a5a4a');
      } else if (scene === 'saleucami_caverns' || scene === 'saleucami_gate') {
        for (let i = 0; i < 10; i++) R.poly([[i * 34, 0], [i * 34 + 16, 0], [i * 34 + 8, 16 + (i * 13) % 26]], '#0a0404');
        for (let i = 0; i < 14; i++) R.rect((i * 41) % 320, 60 + (i * 11) % 34, 8 + i % 5, 2, i % 2 ? '#ff6a1a' : '#c0300a');
      } else if (scene === 'felucia_jungle' || scene === 'felucia_kwayteow' || scene === 'felucia_niango') {
        for (let i = 0; i < 8; i++) {
          const x = 12 + i * 42, h = 40 + (i * 19) % 40;
          R.rect(x + 6, 98 - h, 6, h, '#d8c8a0');
          R.ellipse(x + 9, 98 - h, 18 + (i % 3) * 4, 8, i % 2 ? '#c84a7a' : '#e08a2a');
          R.ellipse(x + 9, 96 - h, 12, 4, i % 2 ? '#e87aa0' : '#f0b050');
        }
        if (scene === 'felucia_niango') { R.rect(220, 50, 70, 46, '#5a6a6a'); R.rect(228, 58, 54, 10, '#8aa0a0'); }
      } else if (scene === 'felucia_nigkoe') {
        for (let x = 10; x < 320; x += 50) { R.rect(x, 16, 36, 80, '#2a3a32'); for (let y = 24; y < 90; y += 10) R.rect(x + 4, y, 28, 2, '#5a6a5a'); }
      } else if (scene === 'intrepid_gym') {
        for (let x = 20; x < 320; x += 70) { R.rect(x, 20, 40, 60, '#22222a'); R.rect(x + 4, 24, 32, 20, '#3a4a5a'); }
        R.dither(60, 110, 200, 50, ['#3a3a5a', '#4a4a6a', '#3a3a5a']);
      } else if (scene === 'endor_cave') {
        for (let i = 0; i < 12; i++) R.poly([[i * 28, 0], [i * 28 + 14, 0], [i * 28 + 7, 24 + (i * 13) % 30]], '#2a2618');
        for (let i = 0; i < 18; i++) R.rect((i * 53) % 300 + 6, 150 + (i * 7) % 18, 6, 2, '#d8d0b8');
      } else if (scene === 'vos_mind') {
        for (let i = 0; i < 40; i++) R.set((i * 73) % 320, (i * 29) % 96, i % 4 ? '#2a2a4a' : '#e0c040');
        R.ellipse(160, 50, 30, 40, '#08080e');
      } else if (scene === 'ryloth_cave') {
        for (let i = 0; i < 9; i++) {
          const x = 12 + i * 36, y = 70 + (i * 23) % 26;
          R.rect(x, y, 2, 8, '#6a5a3a');
          R.ellipse(x + 1, y, 5, 3, i % 2 ? '#c87a3a' : '#a8c86a');
          R.set(x + 1, y - 1, '#fff0b0');
        }
      } else {
        for (const [x, y] of [[276, 80], [292, 84], [284, 70]]) {
          R.rect(x, y, 14, 12, '#5a4630');
          R.rect(x, y + 5, 14, 1, '#3a2c1e');
          R.rect(x + 6, y, 1, 12, '#3a2c1e');
        }
      }
      if (this.b.hazard === 'chasm') {
        for (let y = 94; y < 172; y += 2) {
          const edge = 16 + ((y * 7) % 5) - (y > 140 ? 2 : 0);
          R.rect(0, y, edge, 2, '#040306');
          R.rect(edge, y, 1, 2, '#6a5a4a');
        }
        R.dither(0, 90, 18, 8, [S.wall[1], '#040306']);
      }
      if (this.b.hazard === 'gate') {
        R.rect(2, 90, 4, 82, '#2a2a32');
        R.rect(16, 90, 4, 82, '#2a2a32');
        for (let y = 96; y < 170; y += 8) R.rect(6, y, 10, 1, '#ff4a3a');
      }
      if (this.b.hazard === 'lava') R.dither(0, 94, 20, 78, ['#c0300a', '#ff6a1a', '#c0300a']);
      if (this.b.hazard === 'ocean') {
        R.dither(0, 94, 20, 78, ['#0a2a3a', '#1a4a5a', '#0a2a3a']);
        for (let y = 96; y < 172; y += 6) R.rect(18 + (y % 4), y, 3, 1, '#a8d8e8');
      }
      R.rect(0, 172, 320, 68, '#08060c');
      this.bgCanvas = R.canvas();
      this.bgKey = key;
      return this.bgCanvas;
    }

    drawHazard(g) {
      const h = this.b.hazard;
      if (this.b.group.scene === 'duum_fire') {
        for (let i = 0; i < 18; i++) {
          const x = (i * 61) % 320, y = 172 - ((this.t * 40 + i * 23) % 60);
          g.fillStyle = i % 3 ? 'rgba(255,140,40,0.55)' : 'rgba(255,220,90,0.6)';
          g.fillRect(x, Math.round(y), 2, 3);
        }
      }
      if (this.b.group.rain) {
        g.fillStyle = 'rgba(180,210,230,0.45)';
        for (let i = 0; i < 60; i++) g.fillRect(Math.round((i * 53 + this.t * 140) % 330 - 10), Math.round((i * 97 + this.t * 260) % 172), 1, 4);
      }
      if (h === 'ocean' && this.hazardHint) {
        g.fillStyle = `rgba(80,180,255,${0.25 + 0.2 * Math.sin(this.t * 8)})`;
        g.fillRect(0, 94, 22, 78);
      }
      if (h === 'chasm' && this.hazardHint) {
        g.fillStyle = `rgba(255,110,70,${0.25 + 0.2 * Math.sin(this.t * 8)})`;
        g.fillRect(0, 94, 20, 78);
      }
      if (h !== 'brace') return;
      if (this.braceShown) {
        g.fillStyle = '#5a4026';
        g.fillRect(10, 58, 5, 92);
        g.fillRect(70, 58, 5, 92);
        g.fillRect(6, 56, 74, 5);
        g.fillStyle = '#3a2816';
        g.fillRect(28, 58, 1, 3);
        g.fillRect(52, 57, 1, 4);
        g.fillStyle = '#4a4040';
        for (let i = 0; i < 8; i++) g.fillRect(12 + i * 8, 50 - (i % 3) * 2, 6, 6);
        if (this.hazardHint) {
          g.fillStyle = `rgba(255,190,90,${0.25 + 0.2 * Math.sin(this.t * 8)})`;
          g.fillRect(6, 56, 74, 5);
        }
      } else {
        g.fillStyle = '#4a4040';
        for (let i = 0; i < 24; i++) g.fillRect(8 + (i * 29) % 66, 96 + (i * 17) % 50, 6 + i % 4, 4 + i % 3);
        g.fillStyle = '#5a4026';
        g.fillRect(14, 120, 30, 3);
        g.fillRect(40, 132, 26, 3);
      }
    }

    marked() {
      if (this.mode !== 'target' || !this.tgts) return new Set();
      const t = this.tgts[this.sel.tgt];
      if (t === 'front' || t === 'back') return new Set(this.b.inRow(t).map(e => e.id));
      if (t === 'frontAll') return new Set(this.b.inRow('front').map(e => e.id));
      return new Set([t]);
    }

    drawUnit(g, v, marked) {
      const s = v.shape, fr = this.frameOf(v), c = this.sprite(v, fr);
      const x = Math.round(v.x + v.off - s.ax), y = Math.round(v.y + v.offY - s.ay);
      g.globalAlpha = Math.max(0, Math.min(1, v.alpha));
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(Math.round(v.x - s.w * 0.25), Math.round(v.y - 1), Math.round(s.w * 0.5), 3);
      if (v.flash > 0) g.filter = 'brightness(260%)';
      else if (marked) g.filter = `brightness(${135 + 25 * Math.sin(this.t * 10)}%)`;
      const u = this.b.unit(v.id);
      if (u && u.hidden) g.globalAlpha = Math.min(g.globalAlpha, 0.18 + 0.08 * Math.sin(this.t * 6));
      g.drawImage(c, x, y);
      g.filter = 'none';
      const hb = (u && u.saber) || (A.HEROES[v.key] || {}).blade;
      if (v.side === 'party' && !v.down && u && u.armed !== false && !u.status.saberOff && hb) {
        const p = A.Pix.POSES[fr], a = A.Pix.saberLine(p, 5)[1], b = A.Pix.saberLine(p, 22)[1];
        beam(g, [x + a[0], y + a[1]], [x + b[0], y + b[1]], hb, '#fff4ee');
        if (u.saber2) {
          const h = p.bhand, ang = (p.saber + 50) * Math.PI / 180;
          beam(g, [x + h[0], y + h[1]], [x + h[0] + Math.cos(ang) * 17, y + h[1] + Math.sin(ang) * 17], u.saber2, '#f4fff0');
        }
      }
      if (u && u.shield && !u.status.shieldOff && !v.down) {
        g.strokeStyle = `rgba(120,200,255,${0.45 + 0.15 * Math.sin(this.t * 6)})`;
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(x + s.w / 2, y + s.h / 2, s.w / 2 + 2, s.h / 2 + 2, 0, 0, Math.PI * 2);
        g.stroke();
      }
      if (v.side === 'enemy' && !v.beast && !v.down && u && u.blade) {
        const p = A.Pix.POSES[fr], a = A.Pix.saberLine(p, 5)[1], b = A.Pix.saberLine(p, 22)[1];
        beam(g, [x + s.w - a[0], y + a[1]], [x + s.w - b[0], y + b[1]], u.blade, '#fff4ee');
      }
      g.globalAlpha = 1;
    }

    drawFx(g) {
      for (const f of this.fx) {
        const k = Math.min(1, f.t / f.life);
        if (f.kind === 'bolt') {
          const p = lerp(f.from, f.to, k), d = Math.hypot(f.to[0] - f.from[0], f.to[1] - f.from[1]) || 1;
          const q = [p[0] - (f.to[0] - f.from[0]) / d * 6, p[1] - (f.to[1] - f.from[1]) / d * 6];
          beam(g, q, p, '#ff3a28', '#ffd8c8');
        } else if (f.kind === 'wave') {
          const p = lerp(f.from, f.to, k);
          g.strokeStyle = `rgba(170,220,255,${1 - k * 0.6})`;
          g.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            g.beginPath();
            g.arc(p[0] + i * 4, p[1], 4 + i * 3 + k * 4, Math.PI * 0.65, Math.PI * 1.35);
            g.stroke();
          }
        } else if (f.kind === 'lightning') {
          let prev = f.from;
          for (let i = 1; i <= 7; i++) {
            const base = lerp(f.from, f.to, i / 7), j = i === 7 ? 0 : (Math.random() - 0.5) * 10;
            const p = [base[0], base[1] + j];
            beam(g, prev, p, '#9a7aff', '#ffffff');
            prev = p;
          }
        } else if (f.kind === 'saber') {
          const p = k < 0.5 ? lerp(f.from, f.to, k * 2) : lerp(f.to, f.from, (k - 0.5) * 2), a = this.t * 30;
          beam(g, [p[0] - Math.cos(a) * 7, p[1] - Math.sin(a) * 7], [p[0] + Math.cos(a) * 7, p[1] + Math.sin(a) * 7], f.col, '#fff4ee');
        } else if (f.kind === 'glow') {
          g.strokeStyle = f.col;
          g.globalAlpha = 1 - k;
          g.beginPath();
          g.arc(f.at.x, f.at.y - f.at.shape.ay / 2, 14 + k * 8, 0, Math.PI * 2);
          g.stroke();
          g.globalAlpha = 1;
        } else if (f.kind === 'sense') {
          g.strokeStyle = `rgba(140,216,255,${1 - k})`;
          g.beginPath();
          g.arc(250, 120, 20 + k * 220, 0, Math.PI * 2);
          g.stroke();
        }
      }
      g.fillStyle = '#5a5050';
      for (const r of this.rocks) g.fillRect(Math.round(r.x), Math.round(r.y), r.s, r.s);
    }

    statusIcons(u) {
      const out = [];
      if (!u) return out;
      if (u.breach) out.push('breach');
      for (const k of ['poison', 'stun', 'fear', 'blind', 'calm', 'saberOff', 'slow', 'suppressed']) if (u.status[k]) out.push(k);
      if (u.hacked > 0) out.push('hacked');
      if (u.rage) out.push('rage');
      if (u.disarmed) out.push('disarmed');
      if (u.deflect && u.deflect.charges > 0) out.push('deflect');
      if (u.evade) out.push('evade');
      if (u.guard) out.push('guard');
      if (u.covering) out.push('cover');
      return out;
    }

    drawMarks(g, marked) {
      for (const v of this.vis.values()) {
        if (v.alpha < 0.5 || v.down) continue;
        const u = this.b.unit(v.id), top = Math.round(v.y - v.shape.ay - 2);
        if (v.side === 'enemy') {
          const w = v.beast === 'giant' ? 40 : 20, x = Math.round(v.x - w / 2), y = Math.round(v.y + 3);
          g.fillStyle = '#100808';
          g.fillRect(x - 1, y - 1, w + 2, 4);
          g.fillStyle = '#d84a3a';
          g.fillRect(x, y, Math.round(w * v.hp / v.maxhp), 2);
        }
        const icons = this.statusIcons(u);
        icons.forEach((id, i) => g.drawImage(this.icon(id), Math.round(v.x - icons.length * 4 + i * 8), top - 8));
        if (marked.has(v.id)) {
          const bob = Math.round(Math.sin(this.t * 8) * 2), ax = Math.round(v.x), ay = top - 12 + bob - (icons.length ? 8 : 0);
          g.fillStyle = '#f4bf6a';
          g.fillRect(ax - 3, ay, 7, 1);
          g.fillRect(ax - 2, ay + 1, 5, 1);
          g.fillRect(ax - 1, ay + 2, 3, 1);
          g.fillRect(ax, ay + 3, 1, 1);
        }
      }
    }

    draw(gfx) {
      const lg = gfx.lg, g = gfx.g;
      this.hits = [];
      const marked = this.marked();
      const pend = this.mode === 'target' && this.pending && this.tgts ? this.tgts[this.sel.tgt] : null;
      const pu = pend && this.b.unit(pend);
      this.hazardHint = !!(this.pending && ((this.pending.id === 'push' && pu && pu.row === 'back' && this.b.hazard && this.b.hazard !== 'brace') || this.pending.id === 'brace'));
      if (this.mode === 'skill') {
        const c = this.cmdList()[this.sel.cmd];
        if (c && c.id === 'brace') this.hazardHint = true;
      }
      lg.drawImage(this.bg(), 0, 0);
      if (this.flash) {
        let c = this.cache.get('still:' + this.flash.still);
        if (!c) { c = A.Art.stillPixels(this.flash.still).canvas(); this.cache.set('still:' + this.flash.still, c); }
        lg.globalAlpha = Math.min(0.55, this.flash.t / 1.4 * 0.55);
        lg.drawImage(c, 0, 0, 320, 240);
        lg.globalAlpha = 1;
      }
      this.drawHazard(lg);
      const order = [...this.vis.values()].filter(v => v.alpha > 0.02).sort((p, q) => p.y - q.y || p.x - q.x);
      for (const v of order) this.drawUnit(lg, v, marked.has(v.id));
      this.drawFx(lg);
      this.drawMarks(lg, marked);
      gfx.present();
      this.drawHazardLabel(g);
      this.drawTimeline(g);
      this.drawDuel(g);
      this.drawPops(g);
      this.drawSpeech(g);
      this.drawStrip(g);
      this.drawCommands(g);
      this.drawParty(g);
      if (this.mode === 'talk' || this.talkShow) this.drawTalk(g);
      if (this.mode === 'ask') this.drawAsk(g);
      if (this.mode === 'intro') this.drawIntro(g);
      if (this.mode === 'result') this.drawResult(g);
    }

    drawDuel(g) {
      const F = A.Font, K = A.UIKit;
      if (this.b.will !== undefined) {
        const w = this.will !== undefined ? this.will : this.b.will, x = 456, y = 50;
        F.draw(g, 'text', 'Воля Каркко ' + w, x, y, '#ff9a8a', K.SHADOW);
        g.fillStyle = '#0a0810';
        g.fillRect(x, y + 16, 162, 8);
        g.fillStyle = '#c83a3a';
        g.fillRect(x + 1, y + 17, Math.round(160 * w / 100), 6);
        g.fillStyle = '#f4bf6a';
        g.fillRect(x + 1 + Math.round(160 * A.DUELS.sanctum.lowerAt / 100), y + 14, 1, 12);
      }
      if (this.b.duel && this.b.duel.status && this.b.over !== 'end') {
        const t = this.b.duel.status(this.b);
        F.draw(g, 'bold', t, 618 - F.measure('bold', t), 52, '#a8e0ff', K.SHADOW);
      }
      if (this.b.duel && this.b.duel.turns && !this.b.duel.status && this.b.over !== 'end') {
        const left = Math.max(0, this.b.duel.turns - (this.b.turns.aayla || 0));
        const t = this.b.groupId === 'traa_duel' ? `Продержаться: ${left}` : `До зова Каркко: ${left}`;
        F.draw(g, 'bold', t, 618 - F.measure('bold', t), 52, '#ffc8a0', K.SHADOW);
      }
    }

    drawSpeech(g) {
      if (!this.speech) return;
      const F = A.Font, K = A.UIKit, c = A.CAST[this.speech.who];
      const lines = F.wrap('text', c ? c.name + ': ' + this.speech.text : this.speech.text, 420), w = 440, x = 100, y = 86, h = 10 + lines.length * 16;
      K.bevel(g, x, y, w, h, 'rgba(14,20,14,0.96)', '#7a9a6a', '#1a2a18');
      lines.forEach((l, i) => F.draw(g, 'text', l, x + 10, y + 5 + i * 16, '#d8f0c8', K.SHADOW));
    }

    drawHazardLabel(g) {
      const h = this.b.hazard;
      if (!h || (h === 'brace' && !this.braceShown)) return;
      const F = A.Font, K = A.UIKit, text = A.HAZARDS[h], x = 6, y = h === 'brace' ? 90 : 166;
      const w = F.measure('text', text) + 12;
      g.fillStyle = 'rgba(10,6,8,0.75)';
      g.fillRect(x, y, w, 18);
      F.draw(g, 'text', text, x + 6, y + 1, this.hazardHint ? '#ffb090' : '#c8a890', K.SHADOW);
    }

    timelineIds() {
      const u = this.hero();
      if (this.mode === 'play' || this.mode === 'intro') return (this.tl || this.b.timeline(8)).filter(id => { const x = this.b.unit(id); return x && this.b.active(x); });
      if (!u) return this.b.timeline(8);
      let skill = null;
      if (this.mode === 'skill') { const c = this.cmdList()[this.sel.cmd]; skill = c && c.id; }
      if (this.mode === 'target' || this.mode === 'talk') skill = this.pending && this.pending.id;
      if (!skill) return this.b.timeline(8);
      return [u.id].concat(this.b.forecast(u, skill, 7));
    }

    portrait(g, v, x, y, size) {
      const c = this.sprite(v, 'idle0'), [cx, cy, cw, ch] = v.shape.crop;
      const sx = v.side === 'enemy' && !v.beast ? v.shape.w - cx - cw : cx;
      g.imageSmoothingEnabled = false;
      g.drawImage(c, sx, cy, cw, ch, x, y, size, size);
    }

    drawTimeline(g) {
      const F = A.Font, K = A.UIKit, ids = this.timelineIds().slice(0, 8), n = ids.length;
      if (!n) return;
      const W = 34, gap = 5, x0 = Math.round(320 - (n * (W + gap) - gap) / 2), y0 = 6;
      const hero = this.hero(), forecast = hero && (this.mode === 'skill' || this.mode === 'target' || this.mode === 'talk');
      F.draw(g, 'text', 'Очередь', x0 - 62, y0 + 9, '#a89a80', K.SHADOW);
      ids.forEach((id, i) => {
        const v = this.vis.get(id), u = this.b.unit(id);
        if (!v || !u) return;
        const x = x0 + i * (W + gap);
        g.fillStyle = v.side === 'party' ? '#1e3a5a' : '#4a1e1e';
        g.fillRect(x, y0, W, W);
        this.portrait(g, v, x + 1, y0 + 1, W - 2);
        let frame = '#6a5a4a';
        if (i === 0) frame = '#f4bf6a';
        if (forecast && i > 0 && id === hero.id) frame = '#ffe8a0';
        g.strokeStyle = frame;
        g.lineWidth = i === 0 || (forecast && id === hero.id) ? 2 : 1;
        g.strokeRect(x + 0.5, y0 + 0.5, W - 1, W - 1);
        if (u.ai === 'shooter' && !u.disarmed) g.drawImage(this.icon('blaster'), x + W - 9, y0 + W - 9);
        if (forecast && i > 0 && id === hero.id) F.draw(g, 'text', 'снова', x + 2, y0 + W + 1, '#ffe8a0', K.SHADOW);
      });
    }

    drawPops(g) {
      const F = A.Font, K = A.UIKit;
      if (this.banner && this.mode === 'play') {
        const t = this.banner.text, w = F.measure('bold', t) + 24, x = Math.round(320 - w / 2);
        K.bevel(g, x, 58, w, 22, 'rgba(18,12,28,0.92)', '#8a7a60', '#2a2018');
        F.draw(g, 'bold', t, x + 12, 61, K.GOLD, K.SHADOW);
      }
      for (const p of this.pops) {
        const k = p.t / p.life, a = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        g.globalAlpha = a;
        F.draw(g, 'bold', p.text, Math.round(p.x - F.measure('bold', p.text) / 2), Math.round(p.y - 24 - k * 22), p.col, '#05030a');
        g.globalAlpha = 1;
      }
    }

    known(u) {
      const k = this.b.known[u.key];
      return k || {};
    }

    targetInfo(id) {
      if (id === 'front' || id === 'back') return `${ROW[id]}: ${this.b.inRow(id).length} врага`;
      if (id === 'frontAll') return `весь передний ряд: ${this.b.inRow('front').length} врага`;
      if (id === 'fast') return `Ставка: победа не дольше ${A.BET.fast} ходов Эйлы, выигрыш втрое`;
      if (id === 'clean') return `Ставка: у всех к концу боя не меньше ${Math.round(A.BET.clean * 100)} % здоровья, выигрыш втрое`;
      const u = this.b.unit(id);
      if (!u) return '';
      if (u.side === 'party') return `${u.name}: здоровье ${u.hp}/${u.maxhp}`;
      const parts = [u.name, ROW[u.row], `${u.hp}/${u.maxhp}`];
      const kn = this.known(u);
      if (kn.nrav) parts.push('нрав: ' + (A.NRAV[A.ENEMIES[u.key].nrav] || 'зверь'));
      if (this.read[id]) parts.push('дальше: ' + this.read[id].map(i => i.name.toLowerCase()).join(', '));
      return parts.join(' · ');
    }

    pushHint(u) {
      if (!u) return '';
      if (u.row === 'front') return this.b.freeSlot('back', u.slot) === null ? 'ударится о стоящих сзади' : 'отлетит в задний ряд';
      if (u.weight === 'heavy' && u.pushes < 1) return 'тяжёлый: сдвинет только второй толчок';
      if (!this.b.hazard || this.b.hazard === 'brace') return 'ударится о стену';
      if (u.boss) return u.hazardCool > 0 ? 'устоял недавно: ударится о стену' : 'сорвётся на край: –15 % здоровья';
      return 'упадёт: ' + A.HAZARDS[this.b.hazard];
    }

    drawStrip(g) {
      const F = A.Font, K = A.UIKit, L = id => A.Input.label(id, this.ui.device);
      let text = '', col = K.INK, icons = null;
      const u = this.hero();
      if (this.mode === 'cmd' && u) {
        const c = this.cats()[this.sel.cat];
        text = c && !c.enabled ? `${c.name}: ${c.why}` : `Ход: ${u.name}. ${L('move')}: выбор, ${L('ok')}: команда, ${L('menu')}: пауза`;
        if (c && !c.enabled) col = '#e09080';
      } else if (this.mode === 'skill' && u) {
        const c = this.cmdList()[this.sel.cmd];
        if (c) {
          text = `${c.name}: ${c.about}`;
          if (!c.enabled) { text += ` · ${c.why}`; col = '#e09080'; }
          if (c.id === 'deflect') {
            const list = this.b.forecast(u, 'deflect', 12), n = this.b.shotsBefore(u.id, list);
            const lv = A.STANCE.deflect[Math.max(0, Math.min(2, (u.deflectLevel || 1) - 1))];
            text += ` · до хода выстрелят: ${n}, стойка примет ${lv.charges}`;
          }
        }
      } else if (this.mode === 'target') {
        const id = this.tgts[this.sel.tgt], tu = this.b.unit(id);
        text = this.targetInfo(id);
        if (this.pending.id === 'push') text += ' · ' + this.pushHint(tu);
        if (this.pending.id === 'deflect') text = tu && tu.side === 'enemy' ? 'Отражение III: все выстрелы уйдут в ' + tu.name : 'Отражение III: выстрелы вернутся в стрелков';
        if (tu && tu.side === 'enemy') {
          const kn = this.known(tu);
          icons = kn.weak ? this.b.weakness(tu.key) : 'unknown';
        }
      } else if (this.mode === 'talk') text = `Слово: ${L('move')}: подход, ${L('ok')}: сказать, ${L('back')}: назад`;
      else if (this.mode === 'play' && this.cur && this.cur.wait) text = `${L('ok')}: дальше`;
      else if (this.mode === 'play') text = `${L('ok')} (держать): быстрее`;
      if (!text) return;
      g.fillStyle = 'rgba(8,6,14,0.82)';
      g.fillRect(8, 318, 624, 24);
      g.fillStyle = '#4a3a2a';
      g.fillRect(8, 318, 624, 1);
      let x = 18;
      F.draw(g, 'text', text, x, 322, col, K.SHADOW);
      x += F.measure('text', text) + 10;
      if (icons === 'unknown') F.draw(g, 'text', 'слабости: ?', x, 322, '#a89a80', K.SHADOW);
      else if (icons) {
        const draw = (label, list, c2) => {
          if (!list.length) return;
          F.draw(g, 'text', label, x, 322, c2, K.SHADOW);
          x += F.measure('text', label) + 4;
          for (const t of list) {
            g.drawImage(this.icon(t), x, 323, 14, 14);
            x += 17;
          }
          x += 6;
        };
        draw('слабость', icons.weak, '#ffd040');
        draw('стойкость', icons.resist, '#a0a0a8');
        draw('неуязвим', icons.immune, '#808088');
      }
    }

    drawCommands(g) {
      const F = A.Font, K = A.UIKit;
      K.bevel(g, 8, 346, 404, 128, 'rgba(18,12,28,0.95)', '#8a7a60', '#2a2018');
      const u = this.hero(), menuMode = ['cmd', 'skill', 'target', 'talk'].includes(this.mode);
      if (!u || !menuMode) {
        const a = this.actor && this.b.unit(this.actor);
        F.draw(g, 'bold', a ? `Ходит: ${a.name}` : this.b.group.name, 20, 352, K.GOLD, K.SHADOW);
        if (this.b.hazard) F.draw(g, 'text', 'Опасность у края: ' + A.HAZARDS[this.b.hazard], 20, 374, '#c8a890', K.SHADOW);
        return;
      }
      F.draw(g, 'bold', 'Ход: ' + u.name, 20, 352, K.GOLD, K.SHADOW);
      const cats = this.cats();
      cats.forEach((c, i) => {
        const y = 374 + i * 16, on = i === this.sel.cat;
        if (on) {
          g.fillStyle = this.mode === 'cmd' ? 'rgba(244,191,106,0.22)' : 'rgba(244,191,106,0.1)';
          g.fillRect(14, y - 1, 126, 16);
        }
        F.draw(g, 'text', (on ? '> ' : '  ') + c.name, 18, y, c.enabled ? (on ? '#fff4d8' : K.INK) : '#6a6070', K.SHADOW);
        this.hits.push({
          x: 14, y: y - 1, w: 126, h: 16,
          hover: () => { if (this.mode === 'cmd') this.sel.cat = i; },
          fn: () => { if (this.mode !== 'cmd' && this.mode !== 'skill') return; this.sel.cat = i; this.mode = 'cmd'; this.key('Enter'); }
        });
      });
      const list = this.cmdList(), sub = this.mode !== 'cmd';
      list.forEach((c, i) => {
        const y = 374 + i * 16, on = sub && i === this.sel.cmd;
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.22)';
          g.fillRect(148, y - 1, 258, 16);
        }
        const col = !c.enabled ? '#6a6070' : c.gift ? (on ? '#ffb0a0' : '#ff6a5a') : on ? '#fff4d8' : sub ? K.INK : '#a89a80';
        F.draw(g, 'text', c.name, 156, y, col, K.SHADOW);
        const cost = c.fp ? `Сила ${c.fp}` : c.tempo ? `Темп ${c.tempo}` : '';
        if (cost) F.draw(g, 'text', cost, 400 - F.measure('text', cost), y, c.enabled ? '#a8c8e8' : '#6a6070', K.SHADOW);
        this.hits.push({
          x: 148, y: y - 1, w: 258, h: 16,
          hover: () => { if (this.mode === 'cmd' || this.mode === 'skill') { this.mode = 'skill'; this.sel.cmd = i; } },
          fn: () => {
            if (this.mode !== 'cmd' && this.mode !== 'skill') return;
            this.mode = 'skill';
            this.sel.cmd = i;
            this.key('Enter');
          }
        });
      });
      if (this.mode === 'target') {
        this.tgts.forEach((id, i) => {
          const p = this.tpos(id), v = this.vis.get(id), s = v ? v.shape : SHAPES.human;
          this.hits.push({ x: (p[0] - s.ax) * 2, y: (p[1] - s.ay) * 2, w: s.w * 2, h: s.h * 2, hover: () => { this.sel.tgt = i; }, fn: () => { this.sel.tgt = i; this.key('Enter'); } });
        });
      }
    }

    drawParty(g) {
      const F = A.Font, K = A.UIKit;
      K.bevel(g, 420, 346, 212, 128, 'rgba(18,12,28,0.95)', '#8a7a60', '#2a2018');
      const cur = this.hero();
      this.b.units.filter(u => u.side === 'party').forEach((u, i) => {
        const v = this.vis.get(u.id), y = 352 + i * 41, on = cur && cur.id === u.id && ['cmd', 'skill', 'target', 'talk'].includes(this.mode);
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.14)';
          g.fillRect(426, y - 2, 200, 40);
        }
        F.draw(g, 'bold', u.name, 430, y, v.down ? '#8a6060' : on ? K.GOLD : K.INK, K.SHADOW);
        const bar = (by, h, f, col) => {
          g.fillStyle = '#0a0810';
          g.fillRect(430, by, 102, h);
          g.fillStyle = col;
          g.fillRect(431, by + 1, Math.round(100 * Math.max(0, Math.min(1, f))), h - 2);
        };
        bar(y + 18, 7, v.hp / v.maxhp, v.hp / v.maxhp < 0.35 ? '#ff6a3a' : '#d84a3a');
        if (u.maxfp > 0) bar(y + 27, 5, u.fp / Math.max(1, u.maxfp), '#5aa8f0');
        F.draw(g, 'text', `${v.hp}/${v.maxhp}`, 538, y + 12, K.INK, K.SHADOW);
        if (u.maxfp > 0) F.draw(g, 'text', 'Сила ' + u.fp, 538, y + 25, '#a8c8e8', K.SHADOW);
        else if (u.retinue) F.draw(g, 'text', 'свита', 538, y + 25, '#a8a0a0', K.SHADOW);
        if (u.tempo !== null && u.tempo !== undefined) {
          const col = u.saber || (A.HEROES[u.id] || {}).blade || '#e83a2a';
          for (let k = 0; k < 5; k++) {
            const x = 588 + k * 8, lit = k < u.tempo;
            g.fillStyle = lit ? col : '#2a2028';
            g.fillRect(x, y + 2, 4, 14);
            if (lit) {
              g.fillStyle = '#fff0e8';
              g.fillRect(x + 1, y + 3, 2, 12);
            }
          }
          F.draw(g, 'text', 'Темп', 584 - F.measure('text', 'Темп') - 4, y, '#c8a8a0', K.SHADOW);
        }
        const icons = this.statusIcons(u);
        let ix = 434 + F.measure('bold', u.name) + 4;
        for (const id of icons) {
          g.drawImage(this.icon(id), ix, y + 1, 14, 14);
          ix += 16;
        }
      });
    }

    drawTalk(g) {
      const F = A.Font, K = A.UIKit, id = this.talkShow ? this.talkShow.target : this.talkTarget, u = this.b.unit(id), v = this.vis.get(id);
      if (!u || !v) return;
      K.bevel(g, 40, 92, 560, 214, 'rgba(14,10,24,0.96)', '#d8b884', '#4a3020');
      g.fillStyle = '#1a1424';
      g.fillRect(54, 106, 98, 128);
      const c = this.sprite(v, 'idle0'), [cx, cy, cw, ch] = v.shape.talk;
      const sx = v.side === 'enemy' && !v.beast ? v.shape.w - cx - cw : cx;
      g.imageSmoothingEnabled = false;
      g.drawImage(c, sx, cy, cw, ch, 56, 108, 94, Math.round(94 * ch / cw));
      F.draw(g, 'bold', u.name, 168, 104, K.GOLD, K.SHADOW);
      const kn = this.known(u), d = A.ENEMIES[u.key];
      if (kn.nrav) F.draw(g, 'text', 'нрав: ' + A.NRAV[d.nrav], 168 + F.measure('bold', u.name) + 12, 104, '#a89a80', K.SHADOW);
      if (this.talkShow) {
        const e = this.talkShow, lines = [];
        F.wrap('text', 'Эйла: ' + e.say, 410).forEach(l => lines.push([l, '#c8d8f0']));
        F.wrap('text', u.name + ': ' + e.reply, 410).forEach(l => lines.push([l, K.INK]));
        lines.forEach(([l, col], i) => F.draw(g, 'text', l, 168, 130 + i * 18, col, K.SHADOW));
        const out = `${u.name} ${OUTCOME[e.outcome]}`;
        F.draw(g, 'bold', out, 168, 140 + lines.length * 18, e.outcome === 'rage' ? '#ff7a6a' : '#a8e8a0', K.SHADOW);
        F.draw(g, 'text', A.Input.label('ok', this.ui.device) + ': дальше', 168, 280, '#a89a80', K.SHADOW);
        this.hits.push({ x: 40, y: 92, w: 560, h: 214, fn: () => this.key('Enter') });
        return;
      }
      const greet = this.b.greet(d.nrav);
      F.wrap('text', '«' + greet + '»', 410).forEach((l, i) => F.draw(g, 'text', l, 168, 128 + i * 18, K.INK, K.SHADOW));
      this.b.approaches(u).forEach((a, i) => {
        const y = 186 + i * 22, on = i === this.sel.talk;
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.2)';
          g.fillRect(164, y - 2, 420, 20);
        }
        F.draw(g, 'text', (on ? '> ' : '  ') + a.name, 168, y, a.enabled ? (on ? '#fff4d8' : K.INK) : '#6a6070', K.SHADOW);
        const note = a.enabled ? (a.id === 'threat' ? 'страх, тёмный путь' : '') : a.why;
        if (note) F.draw(g, 'text', note, 300, y, a.enabled ? '#a89a80' : '#8a6a70', K.SHADOW);
        this.hits.push({ x: 164, y: y - 2, w: 420, h: 20, hover: () => { this.sel.talk = i; }, fn: () => { this.sel.talk = i; this.key('Enter'); } });
      });
    }

    drawIntro(g) {
      const F = A.Font, K = A.UIKit, title = this.b.group.name, sub = ADVANTAGE[this.b.advantage] || '';
      const w = Math.max(F.measure('bold', title), F.measure('text', sub)) + 48, x = Math.round(320 - w / 2);
      K.bevel(g, x, 140, w, 52, 'rgba(14,10,24,0.94)', '#d8b884', '#4a3020');
      F.draw(g, 'bold', title, Math.round(320 - F.measure('bold', title) / 2), 148, K.GOLD, K.SHADOW);
      F.draw(g, 'text', sub, Math.round(320 - F.measure('text', sub) / 2), 168, this.b.advantage === 'enemy' ? '#ff9a80' : this.b.advantage === 'party' ? '#a8e8a0' : K.INK, K.SHADOW);
    }

    drawResult(g) {
      const F = A.Font, K = A.UIKit, win = this.b.over === 'win' || this.b.over === 'end', lines = [];
      if (win) {
        const r = this.res;
        if (this.b.over === 'end') lines.push([{ call: 'Зов Каркко оборвал поединок.', retreat: 'Свита ушла в холмы.', lower: 'Эйла опустила клинок.', seal: 'Проход закрыт. Мальчики живы.', fled: 'Моргукаи ушли с мальчиком.', run: 'Джедаи прорвались к реке лавы.', hand: 'Бок без правой кисти стоит у края.' }[r.reason] || 'Бой окончен.', K.GOLD]);
        if (r.xp) lines.push(['Опыт +' + r.xp, K.INK]);
        if (r.credits) lines.push(['Кредиты +' + r.credits, K.INK]);
        if (r.bet) lines.push([r.bet > 0 ? 'Ставка выиграна: +' + r.bet + ' кредитов' : 'Ставка проиграна: ' + r.bet + ' кредитов', r.bet > 0 ? '#a8e8a0' : '#ffa080']);
        if (r.talked) lines.push(['Ушли без боя: ' + r.talked, '#a8e8a0']);
        for (const [id, lv] of r.levels) lines.push([`${A.HEROES[id].name}: уровень ${lv}`, K.GOLD]);
        for (const [id, hp, fp] of r.recovered) lines.push([`Сила затянула раны: ${A.HEROES[id].name} +${hp} здоровья, –${fp} Силы`, '#a8c8e8']);
        if (this.b.S.flags['info_' + this.b.groupId]) lines.push(['Сведения записаны в журнал.', '#c8b8ff']);
      } else lines.push(['Отряд пал. Бой можно начать заново.', K.INK]);
      const opts = this.resultOptions();
      const w = Math.max(320, ...lines.map(l => F.measure('text', l[0]) + 48), ...opts.map(o => F.measure('text', o.label) + 72));
      const h = 56 + lines.length * 18 + opts.length * 20, x = Math.round(320 - w / 2), y = Math.round(170 - h / 2);
      K.bevel(g, x, y, w, h, 'rgba(14,10,24,0.96)', '#d8b884', '#4a3020');
      const title = this.b.over === 'end' ? 'Бой окончен' : win ? 'Победа' : 'Поражение';
      F.draw(g, 'bold', title, Math.round(320 - F.measure('bold', title) / 2), y + 10, win ? K.GOLD : '#ff8a6a', K.SHADOW);
      lines.forEach(([l, col], i) => F.draw(g, 'text', l, x + 24, y + 34 + i * 18, col, K.SHADOW));
      opts.forEach((o, i) => {
        const oy = y + 40 + lines.length * 18 + i * 20, on = i === this.sel.result;
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.2)';
          g.fillRect(x + 20, oy - 2, w - 40, 18);
        }
        F.draw(g, 'text', (on ? '> ' : '  ') + o.label, x + 24, oy, on ? '#fff4d8' : K.INK, K.SHADOW);
        this.hits.push({ x: x + 20, y: oy - 2, w: w - 40, h: 18, hover: () => { this.sel.result = i; }, fn: () => { this.sel.result = i; o.act(); } });
      });
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
