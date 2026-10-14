(function (G) {
  'use strict';
  const { T, GR, dist, dist2, clamp, VEHICLES, PEDS, WEAPONS, PICKUPS, SCORE, CHAPTERS, MISSIONS, MISSION_LIST, FRENZIES } = G;

  let sharedCity = null;
  G.getCity = () => sharedCity || (sharedCity = new G.City());

  const PRICES = { spray: 1000, bomb: 3000 };
  const FARE_PLACES = ['sq1905', 'passage', 'market', 'hotel_iset', 'hotel_central', 'dynamo', 'kosmos', 'drama', 'opera', 'circus', 'post', 'plotinka', 'dvorets', 'zelroshcha', 'vokzal', 'oborony', 'kommunarov', 'voznes', 'lenina_e', 'tkachey_yard', 'melkovka_yard', 'whitehouse', 'hosp_1', 'shkola'];
  const FARE_LINES = ['«Шеф, до {place}! Трёшку сверху дам».', '«На {place}, только быстро — жена ждёт».', '«До {place}. Счётчик можно не включать».', '«{place}, пожалуйста. Я на поезд опаздываю!»', '«Мне на {place}. Музыку погромче сделай»'];

  class Game {
    constructor(opts) {
      this.opts = opts || {};
      this.city = G.getCity();
      this.world = null;
      this.mission = null;
      this.msgs = [];
      this.mode = 'idle';
      this.events = [];
      this.sfxQueue = [];
      this.renamed = false;
    }

    get fem() { return !!(this.prog && G.CHARACTERS[this.prog.char].fem); }
    get chapter() { return CHAPTERS[this.prog.chapter]; }

    newGame(charIdx, opts) {
      this.prog = {
        char: charIdx || 0, chapter: 0, score: 0, chapterStart: 0, lives: 4, mult: 1,
        done: [], taken: [], exported: [], renamed: false,
        stats: { kills: 0, cops: 0, cars: 0, stolen: 0, missions: 0, fares: 0, crushed: 0, exported: 0, busted: 0, wasted: 0, frenzies: 0, time: 0, maxWanted: 0, spent: 0 }
      };
      this.startChapter(0, opts);
    }

    load(prog, opts) {
      this.prog = JSON.parse(JSON.stringify(prog));
      this.startChapter(this.prog.chapter, Object.assign({ keepScore: true }, opts || {}));
    }

    serialize() { return JSON.parse(JSON.stringify(this.prog)); }

    startChapter(n, opts) {
      const o = opts || {};
      const P = this.prog;
      P.chapter = n;
      if (!o.keepScore) P.chapterStart = P.score;
      if (!o.keepScore) P.mult = 1;
      P.exported = o.keepScore ? P.exported : [];
      P.taken = (P.taken || []).filter(k => !k.startsWith('f'));
      this.renamed = !!P.renamed;
      const ch = CHAPTERS[n];
      for (const g of Object.values(this.city.garages)) { g.open = g.kind !== 'deliver'; g.busy = 0; g.inside = false; g.car = null; }
      for (const pr of this.city.props) if (pr.down) pr.down = false;
      const spawn = this.city.places[ch.safe];
      this.world = new G.World(this.city, { seed: 100 + n * 17 + (o.seed || 0), character: G.CHARACTERS[P.char], spawn, density: o.density != null ? o.density : this.opts.density, gangs: o.gangs });
      const w = this.world;
      w.hostile = new Set(ch.hostile);
      w.handler = (t, e) => this.onWorld(t, e);
      w.canTake = k => this.canTake(k);
      for (const k of w.pickups) if (P.taken.includes(k.id)) k.active = false;
      w.ringing = new Set();
      this.updateGarages();
      if (!w.lastCar) {
        const city = this.city;
        const r = city.nearestPoint(spawn.x, spawn.y, (x, y) => city.surfAt(x, y) === GR.YARD && city.drivable(x, y) && city.drivable(x + 26, y) && city.drivable(x - 26, y) && city.drivable(x, y + 14) && city.drivable(x, y - 14), 400);
        if (r) w.spawnCar(n === 0 ? 'zaz968' : n === 1 ? 'vaz2106' : 'gaz24', r[0], r[1], 0, { parked: true });
      }
      if ((P.badges || 0) >= 20) { const s = this.city.places[ch.safe]; w.pickups.push({ id: 'safe_armor', type: 'armor', x: s.x + T, y: s.y, active: true, respawn: 60, t: 0 }); }
      if (this.city.spots.tank) { const s = this.city.spots.tank; w.spawnCar('t34', s.x, s.y, s.a, { parked: true, persist: true }); }
      for (const k of ['kazanka1']) { const s = this.city.spots[k]; if (s) w.spawnCar('kazanka', s.x, s.y, s.a, { parked: true, persist: true }); }
      this.mission = null;
      this.cooldown = {};
      this.phoneT = 0;
      this.taxi = null;
      this.frenzy = null;
      this.zone = '';
      this.zoneT = 0;
      this.targetAnnounced = P.score - P.chapterStart >= ch.target;
      this.msgs = [];
      this.mode = 'play';
      this.deadT = 0;
      this.finished = false;
      this.news = 0; this.newsT = 0;
    }

    msg(text, kind, time) {
      const t = G.genderize(text, this.fem);
      if (kind === 'objective') { this.objective = t; }
      this.msgs.push({ text: t, kind: kind || 'info', t: 0, life: time || (kind === 'big' ? 4 : kind === 'count' ? 0.9 : kind === 'story' ? 6 : kind === 'objective' ? 6 : 3.5) });
      if (this.msgs.length > 8) this.msgs.shift();
    }

    sfx(id) { this.sfxQueue.push(id); }

    addScore(v, x, y, label) {
      const P = this.prog;
      const pts = Math.round(v * P.mult);
      P.score += pts;
      if (x != null) this.world.floatText((pts >= 0 ? '+' : '') + G.fmtMoney(pts) + (label ? ' ' + label : ''), x, y, pts >= 0 ? '#ffe040' : '#ff5050');
      return pts;
    }

    spend(v) {
      const P = this.prog;
      if (P.score < v) return false;
      P.score -= v;
      P.stats.spent += v;
      return true;
    }

    canTake(k) {
      if (k.type === 'frenzy') return !this.mission && !this.frenzy && !this.prog.taken.includes(k.id);
      if (k.once && !k.mission && this.prog.taken.includes(k.id)) return false;
      return true;
    }

    updateGarages() {
      for (const g of Object.values(this.city.garages)) if (g.door) g.door.closed = !g.open;
    }

    onWorld(type, e) {
      const P = this.prog, w = this.world;
      if (this.mission) {
        const r = this.mission.onEvent(type, e);
        if (type === 'garage' && r) { this.garageMission(e, r); return; }
      }
      switch (type) {
        case 'kill': {
          const v = e.victim;
          if (e.attacker && e.attacker.isPlayer && !v.isPlayer) {
            const base = v.def.boss ? SCORE.boss : v.cop ? SCORE.cop : v.gang ? SCORE.gang : SCORE.ped;
            this.addScore(base, v.x, v.y);
            P.stats.kills++;
            if (v.cop) P.stats.cops++;
            if (this.frenzy) this.frenzyKill(v);
          }
          if (this.taxi && this.taxi.fare === v) { this.msg('Пассажир погиб. Бомбить так бомбить...', 'info'); this.taxi.fare = null; this.taxi.dest = null; }
          break;
        }
        case 'carDestroyed': {
          const c = e.car;
          if (e.attacker && e.attacker.isPlayer) {
            this.addScore(c.m.police ? SCORE.copcar : SCORE.car, c.x, c.y);
            P.stats.cars++;
            if (this.frenzy && this.frenzy.def.target === 'cars') this.frenzyCount();
          }
          break;
        }
        case 'enter':
          if (e.ped.isPlayer) {
            if (!e.car.counted) { e.car.counted = true; P.stats.stolen++; }
            this.msg(e.car.m.name, 'car', 2.5);
            if (e.car.m.tank && !P.taken.includes('tank')) { P.taken.push('tank'); this.msg('Т-34 с постамента у вокзала! Огонь — выстрел из пушки.', 'info'); }
          }
          break;
        case 'exit':
          if (e.ped.isPlayer && this.taxi && this.taxi.fare && this.taxi.fare.car === e.car) this.msg('Пассажир ждёт. Вернись в машину!', 'info');
          break;
        case 'pickup': {
          const k = e.pickup;
          if (!k.mission && k.once) P.taken.push(k.id);
          const def = PICKUPS[k.type];
          if (k.type === 'life') { P.lives++; this.msg('Лишняя жизнь!', 'big', 2); }
          else if (k.type === 'mult') { P.mult++; this.msg('Множитель ×' + P.mult + '!', 'big', 2); }
          else if (k.type === 'frenzy') this.startFrenzy(k.id);
          else if (k.type === 'badge') {
            P.badges = (P.badges || 0) + 1;
            this.addScore(1000, k.x, k.y, 'значок');
            if (P.badges >= 20) { this.addScore(50000, k.x, k.y, 'коллекция'); this.msg('Вся коллекция значков собрана! Бонус 50 000 и бронежилет в каждом убежище.', 'big', 5); }
            else this.msg('Значок ' + P.badges + ' из 20', 'info', 2.5);
          }
          else if (!k.mission) this.msg(def.name, 'info', 1.6);
          this.sfx('pickup');
          break;
        }
        case 'garage': this.garage(e.g, e.car); break;
        case 'garageDone': this.garageDone(e.g, e.car); break;
        case 'busted': if (this.mode === 'play') this.busted(); break;
        case 'wasted': if (this.mode === 'play') this.wasted(e.cause); break;
        case 'fuse': this.msg('Бомба! Четыре секунды — беги!', 'big', 2); break;
        case 'fireWarn': this.msg('Машина горит! Выходи!', 'big', 2); break;
        case 'wantedUp': P.stats.maxWanted = Math.max(P.stats.maxWanted, e.level); break;
        case 'pedBoard':
          if (this.taxi && e.ped === this.taxi.hail) this.fareBoarded(e.ped);
          break;
        default: break;
      }
    }

    garageMission(e, r) {
      const w = this.world, g = e.g, c = e.car;
      if (r === 'take') {
        w.exitCar(w.player);
        const P = w.player;
        if (P.car) { P.car = null; c.driver = null; }
        P.x = g.front.x; P.y = g.front.y;
        g.busy = 1.2; g.car = c;
        c.persist = true;
        w.removeCar(c);
        this.sfx('garage');
      }
    }

    garage(g, c) {
      const w = this.world, P = this.prog;
      if (!g.open) return;
      if (g.kind === 'spray') {
        if (c.m.boat || c.m.tank) return;
        if (!this.spend(PRICES.spray)) { this.msg('Покраска стоит ' + PRICES.spray + ' руб. Денег нет — приезжай позже.', 'info'); return; }
        g.busy = 1.6; g.car = c; c.parkedHold = true; c.vx = c.vy = 0;
        this.msg('Покраска «Кооператор»: −' + PRICES.spray + ' руб.', 'info');
        this.sfx('garage');
      } else if (g.kind === 'bomb') {
        if (c.bomb) { this.msg('Бомба уже стоит. Огонь — запустить таймер.', 'info'); return; }
        if (!this.spend(PRICES.bomb)) { this.msg('Бомба стоит ' + PRICES.bomb + ' руб.', 'info'); return; }
        g.busy = 1.6; g.car = c; c.parkedHold = true; c.vx = c.vy = 0;
        this.msg('Мастерская «Самоделкин»: −' + PRICES.bomb + ' руб.', 'info');
        this.sfx('garage');
      } else if (g.kind === 'crusher') {
        if (c.m.boat || c.m.tank) return;
        const pay = Math.round(c.m.value * 0.22 * Math.max(0.2, c.hp / c.maxHp));
        w.exitCar(w.player);
        const pp = w.player; if (pp.car) { pp.car = null; c.driver = null; }
        pp.x = g.front.x; pp.y = g.front.y;
        this.addScore(pay, g.x, g.y, 'металлолом');
        P.stats.crushed++;
        w.removeCar(c);
        g.busy = 1.2;
        this.sfx('crush');
        if (this.mission) this.mission.onEvent('crushed', {});
      } else if (g.kind === 'export') {
        const list = this.chapter.exportModels;
        if (!list.includes(c.mid) || P.exported.includes(c.mid)) { this.msg(list.includes(c.mid) ? 'Такую уже отправили. Нужна другая модель.' : 'Эту модель не заказывали. Список — на доске у порта (карта, M).', 'info'); return; }
        const pay = Math.round(c.m.value * Math.max(0.3, c.hp / c.maxHp));
        w.exitCar(w.player);
        const pp = w.player; if (pp.car) { pp.car = null; c.driver = null; }
        pp.x = g.front.x; pp.y = g.front.y;
        this.addScore(pay, g.x, g.y, 'экспорт');
        P.exported.push(c.mid);
        P.stats.exported++;
        w.removeCar(c);
        g.busy = 1.2;
        this.sfx('garage');
        if (P.exported.filter(m => list.includes(m)).length === list.length) { this.addScore(15000, g.x, g.y, 'весь заказ'); this.msg('Весь экспортный заказ выполнен! Бонус!', 'big'); }
        else this.msg('Экспорт: ' + c.m.name + ' отправлен' + '. Осталось ' + (list.length - P.exported.filter(m => list.includes(m)).length) + ' моделей.', 'info');
      }
    }

    garageDone(g, c) {
      const w = this.world;
      if (!c || c.removed) return;
      c.parkedHold = false;
      if (g.kind === 'spray') {
        const cols = c.m.colors.length > 1 ? c.m.colors.filter(x => x !== c.color) : ['#6a1422', '#1e4c5c', '#e6e2d6', '#3a6a4c'];
        c.color = cols[Math.floor(w.rng.next() * cols.length)];
        c.hp = c.maxHp; c.burning = false;
        w.setWanted(0);
        this.msg('Как новенькая! Милиция тебя больше не ищет.', 'info');
      } else if (g.kind === 'bomb') {
        c.bomb = true;
        this.msg('Бомба установлена. Огонь (Ctrl) в машине — таймер на 4 секунды.', 'info');
        if (this.mission) this.mission.onEvent('bombFitted', { car: c });
      }
    }

    busted() {
      const P = this.prog, w = this.world;
      this.mode = 'busted'; this.deadT = 0;
      P.stats.busted++;
      w.freeze = 99;
      this.failMission('Тебя {задержали|задержали}.');
      this.stopTaxi(true);
      this.stopFrenzy(false);
      this.sfx('busted');
    }

    wasted(cause) {
      const P = this.prog, w = this.world;
      this.mode = 'wasted'; this.deadT = 0;
      P.stats.wasted++;
      w.freeze = 99;
      this.deathCause = cause;
      this.failMission('');
      this.stopTaxi(true);
      this.stopFrenzy(false);
      this.sfx('wasted');
    }

    respawn() {
      const P = this.prog, w = this.world;
      const p = w.player;
      const busted = this.mode === 'busted';
      const ids = busted ? ['ovd_guvd', 'ovd_lenin', 'ovd_rail', 'ovd_oct', 'ovd_kirov'] : ['hosp_1', 'hosp_2', 'hosp_3'];
      let best = null, bd = 1e12;
      for (const id of ids) { const pl = this.city.places[id]; const d = dist2(pl.x, pl.y, p.x, p.y); if (d < bd) { bd = d; best = pl; } }
      if (p.car) { const c = p.car; if (c.driver === p) c.driver = null; c.pass = c.pass.filter(q => q !== p); p.car = null; }
      p.x = best.x; p.y = best.y; p.vx = p.vy = 0;
      p.dead = false; p.hp = p.maxHp; p.armor = 0; p.state = 'player'; p.burn = 0; p.down = 0;
      p.weapons = { fist: Infinity }; p.cur = 'fist';
      w.setWanted(0);
      w.freeze = 0;
      if (busted) { P.mult = Math.max(1, Math.floor(P.mult / 2)); this.msg('Отпустили под подписку о невыезде. Оружие изъято, множитель ×' + P.mult + '.', 'info'); }
      else {
        P.lives--; P.mult = Math.max(1, P.mult - 1);
        if (P.lives < 0) { this.mode = 'gameover'; return; }
        this.msg('Больница. Жизней осталось: ' + P.lives + '.', 'info');
      }
      this.mode = 'play';
    }

    restartChapter() {
      const P = this.prog;
      P.score = P.chapterStart;
      P.lives = Math.max(P.lives, 3);
      P.done = P.done.filter(id => MISSIONS[id].chapter !== P.chapter);
      this.startChapter(P.chapter, { keepScore: true });
    }

    failMission(reason) {
      const m = this.mission;
      if (!m) return;
      m.cleanup(false);
      this.mission = null;
      this.objective = '';
      this.cooldown[m.def.phone] = 12;
      this.msg('ЗАДАНИЕ ПРОВАЛЕНО', 'fail', 3);
      if (reason) this.msg(reason, 'info', 4);
      this.sfx('fail');
    }

    passMission() {
      const m = this.mission, P = this.prog;
      m.cleanup(true);
      this.mission = null;
      this.objective = '';
      P.done.push(m.def.id);
      P.stats.missions++;
      const pts = this.addScore(m.def.reward, this.world.px, this.world.py);
      P.mult = Math.min(9, P.mult + 1);
      this.msg('ЗАДАНИЕ ВЫПОЛНЕНО!', 'pass', 3.5);
      this.msg('+' + G.fmtMoney(pts) + ' руб. Множитель ×' + P.mult, 'info', 4);
      this.sfx('pass');
      this.cooldown[m.def.phone] = 6;
      if (m.def.finale) this.chapterDone();
    }

    chapterDone() {
      const P = this.prog;
      this.mode = P.chapter >= CHAPTERS.length - 1 ? 'win' : 'chapterEnd';
      if (this.mode === 'win') P.renamed = true;
      this.world.freeze = 99;
    }

    nextChapter() {
      const P = this.prog;
      P.chapter++;
      P.lives++;
      this.startChapter(P.chapter);
    }

    availableFor(phone) {
      const P = this.prog;
      const ch = this.chapter;
      const reached = P.score - P.chapterStart >= ch.target;
      for (const m of MISSION_LIST) {
        if (m.chapter !== P.chapter || m.phone !== phone || P.done.includes(m.id)) continue;
        if (m.after && !m.after.every(a => P.done.includes(a))) continue;
        if (m.finale && !reached) continue;
        return m;
      }
      return null;
    }

    updatePhones(dt) {
      const w = this.world, ch = this.chapter;
      for (const k of Object.keys(this.cooldown)) { this.cooldown[k] -= dt; if (this.cooldown[k] <= 0) delete this.cooldown[k]; }
      w.ringing.clear();
      if (this.mission || this.frenzy) return;
      for (const ph of Object.keys(ch.phones)) {
        if (this.cooldown[ph]) continue;
        if (this.availableFor(ph)) w.ringing.add(ph);
      }
      const p = w.player;
      if (p.car || p.dead) return;
      for (const ph of w.ringing) {
        const pl = this.city.places[ph];
        if (dist2(pl.x, pl.y, p.x, p.y) < 20 * 20) { this.startMission(this.availableFor(ph)); break; }
      }
    }

    startMission(def) {
      this.stopTaxi(true);
      const ch = this.chapter;
      this.brief = { who: ch.phones[def.phone], title: def.title, text: G.genderize(def.brief, this.fem), t: 0 };
      this.msg('«' + def.title + '»', 'title', 3);
      this.mission = new G.Mission(this, def);
      this.sfx('phone');
    }

    startFrenzy(id) {
      const def = FRENZIES[id];
      if (!def) return;
      this.prog.taken.push(id);
      const p = this.world.player;
      this.frenzy = { def, id, t: def.time, n: 0, saved: Object.assign({}, p.weapons), cur: p.cur };
      p.weapons[def.weapon] = 999;
      p.cur = def.weapon;
      this.msg(def.text, 'big', 4);
      this.sfx('frenzy');
    }

    frenzyKill(v) {
      const f = this.frenzy;
      if (!f) return;
      const tg = f.def.target;
      if (tg === 'gang' && v.gang) this.frenzyCount();
      else if (tg.startsWith('gang:') && v.gang === tg.slice(5)) this.frenzyCount();
    }

    frenzyCount() {
      const f = this.frenzy;
      f.n++;
      if (f.n >= f.def.n) { this.addScore(f.def.bonus, this.world.px, this.world.py, 'беспредел'); this.prog.stats.frenzies++; this.msg('БЕСПРЕДЕЛ ЗАВЕРШЁН!', 'pass', 3); this.sfx('pass'); this.stopFrenzy(true); }
    }

    stopFrenzy(ok) {
      const f = this.frenzy;
      if (!f) return;
      const p = this.world.player;
      if (!p.dead) { p.weapons = f.saved; p.cur = p.weapons[f.cur] ? f.cur : 'fist'; }
      this.frenzy = null;
      if (!ok && this.mode === 'play') { this.msg('БЕСПРЕДЕЛ ПРОВАЛЕН', 'fail', 3); this.sfx('fail'); }
    }

    toggleTaxi() {
      const w = this.world, c = w.player.car;
      if (this.taxi) { this.stopTaxi(false); return; }
      if (!c || c.m.boat || c.m.bike || c.m.tank || c.m.police) { this.msg('Бомбить можно только на обычной машине.', 'info'); return; }
      if (this.mission && this.mission.cur.do !== 'fares') { this.msg('Сначала закончи дело.', 'info'); return; }
      this.taxi = { car: c, hail: null, fare: null, dest: null, t: 0, next: 1 };
      this.msg('Бомбим! Ищи голосующих на тротуаре.', 'info');
    }

    stopTaxi(silent) {
      const t = this.taxi;
      if (!t) return;
      const w = this.world;
      for (const q of [t.hail, t.fare]) {
        if (!q || q.dead || q.removed) continue;
        if (q.car) w.ejectPed(q, q.car);
        q.state = 'walk'; q.persist = false; q.tag = null;
      }
      this.taxi = null;
      if (!silent) this.msg('Бомбить закончили.', 'info');
    }

    updateTaxi(dt) {
      const t = this.taxi;
      if (!t) return;
      const w = this.world, city = this.city, P = w.player;
      if (t.car.dead || t.car.removed) { this.stopTaxi(false); return; }
      if (t.fare) {
        const q = t.fare;
        if (q.dead || q.removed) { t.fare = null; return; }
        t.t -= dt;
        if (!q.car) { t.fare = null; return; }
        if (P.car !== q.car) { t.away = (t.away || 0) + dt; if (t.away > 8) { w.ejectPed(q, q.car); q.state = 'walk'; q.persist = false; t.fare = null; this.msg('Пассажир ушёл пешком.', 'info'); } return; }
        t.away = 0;
        if (t.t <= 0) { w.ejectPed(q, q.car); q.state = 'walk'; q.persist = false; t.fare = null; this.msg('«Я лучше на трамвае!» Пассажир ушёл без оплаты.', 'info'); return; }
        const c = q.car;
        if (dist(c.x, c.y, t.dest.x, t.dest.y) < 70 && Math.hypot(c.vx, c.vy) < 40) {
          const pay = Math.round(60 + t.len / 14 + Math.max(0, t.t) * 3);
          w.ejectPed(q, c);
          q.state = 'walk'; q.persist = false;
          t.fare = null;
          this.addScore(pay, c.x, c.y, 'за проезд');
          this.prog.stats.fares++;
          this.sfx('cash');
          if (this.mission) this.mission.onEvent('fare', {});
          t.next = 2;
        }
        return;
      }
      if (t.hail) {
        const q = t.hail;
        if (q.dead || q.removed || dist(q.x, q.y, w.px, w.py) > 1400) { t.hail = null; t.next = 1; return; }
        const c = P.car;
        if (c === t.car && q.state === 'hail' && dist(c.x, c.y, q.x, q.y) < 80 && Math.hypot(c.vx, c.vy) < 30) { q.state = 'enter'; q.goalCar = c; }
        return;
      }
      t.next -= dt;
      if (t.next > 0) return;
      t.next = 2;
      const net = city.net;
      const r = w.ringPoint(w.px, w.py, 280, 650, (x, y) => { const e = net.nearestWalk(x, y, 30 * city.M); if (!e) return null; const ed = net.walkEdges[e.edge]; return ed.kind === 'side' ? { e: ed, s: e.s } : null; });
      if (!r) return;
      const q0 = G.pointAt(r.e.pts, r.e.cum, r.s);
      if (!city.walkable(q0[0], q0[1])) return;
      const q = w.spawnPed('fare', q0[0], q0[1], { persist: true, tag: 'fare', state: 'hail' });
      const ln = net.nearestLane(q0[0], q0[1], null, 40 * city.M, false);
      if (ln) q.faceA = Math.atan2(ln.y - q0[1], ln.x - q0[0]);
      t.hail = q;
    }

    fareBoarded(q) {
      const t = this.taxi, w = this.world;
      t.hail = null;
      t.fare = q;
      const opts = FARE_PLACES.map(id => this.city.places[id]).filter(p => p && dist(p.x, p.y, q.x, q.y) > 900 && dist(p.x, p.y, q.x, q.y) < 3800);
      const dest = opts.length ? opts[Math.floor(w.rng.next() * opts.length)] : this.city.places.station;
      t.dest = dest;
      t.len = dist(dest.x, dest.y, q.x, q.y);
      t.t = t.len / 140 + 20;
      const line = FARE_LINES[Math.floor(w.rng.next() * FARE_LINES.length)].replace('{place}', dest.name);
      this.msg(line, 'story', 4);
    }

    update(dt, inp) {
      const w = this.world, P = this.prog;
      for (const m of this.msgs) m.t += dt;
      this.msgs = this.msgs.filter(m => m.t < m.life);
      if (this.brief) { this.brief.t += dt; if (this.brief.t > 9) this.brief = null; }
      if (this.mode === 'busted' || this.mode === 'wasted') {
        this.deadT += dt;
        w.step(dt, {});
        if (this.deadT > 3.2) this.respawn();
        return;
      }
      if (this.mode !== 'play') return;
      P.stats.time += dt;
      const input = inp || {};
      if (input.taxi) this.toggleTaxi();
      w.step(dt, input);
      if (this.mode !== 'play') return;
      if (this.mission) {
        this.mission.update(dt);
        if (this.mission && this.mission.state === 'done') this.passMission();
        else if (this.mission && this.mission.state === 'fail') this.failMission(this.mission.reason);
      }
      this.phoneT -= dt;
      if (this.phoneT <= 0) { this.phoneT = 0.25; this.updatePhones(0.25); }
      this.updateTaxi(dt);
      if (this.frenzy) {
        this.frenzy.t -= dt;
        if (this.frenzy.t <= 0) this.stopFrenzy(false);
      }
      const ch = this.chapter;
      if (!this.targetAnnounced && P.score - P.chapterStart >= ch.target) {
        this.targetAnnounced = true;
        this.msg('Цель главы достигнута! ' + ch.phones[ch.finalePhone] + ' ждёт звонка.', 'big', 5);
        this.sfx('pass');
      }
      const z = this.city.zoneName(w.px, w.py);
      if (z !== this.zone) { this.zone = z; this.zoneT = 0; }
      this.zoneT += dt;
      this.newsT += dt;
    }

    markers() {
      const out = this.mission ? this.mission.markers() : [];
      const w = this.world;
      if (this.taxi) {
        if (this.taxi.fare && this.taxi.dest) out.push({ x: this.taxi.dest.x, y: this.taxi.dest.y, r: 50, color: '#40ff60' });
        else if (this.taxi.hail && !this.taxi.hail.dead) out.push({ x: this.taxi.hail.x, y: this.taxi.hail.y, ground: false, color: '#40ff60' });
      }
      if (!this.mission && !this.frenzy && w.ringing && w.ringing.size) {
        let best = null, bd = 1e12;
        for (const ph of w.ringing) { const p = this.city.places[ph]; const d = dist2(p.x, p.y, w.px, w.py); if (d < bd) { bd = d; best = p; } }
        if (best) out.push({ x: best.x, y: best.y, ground: false, color: '#ffe040', phone: true });
      }
      return out;
    }

    stateSummary() {
      const P = this.prog, ch = this.chapter;
      return { score: P.score, target: P.chapterStart + ch.target, lives: P.lives, mult: P.mult };
    }
  }

  Object.assign(G, { Game, PRICES });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
