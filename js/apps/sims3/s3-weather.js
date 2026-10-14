(function (S) {
  'use strict';
  const G = S.Game.prototype;

  const WEATHER = {
    clear: { name: 'Ясно', icon: 'm_sun', next: { clear: 0.5, cloudy: 0.38, rain: 0.12 }, hours: [5, 14] },
    cloudy: { name: 'Пасмурно', icon: 'm_cloud', next: { clear: 0.38, cloudy: 0.17, rain: 0.33, storm: 0.12 }, hours: [3, 9] },
    rain: { name: 'Дождь', icon: 'w_rain', next: { cloudy: 0.55, clear: 0.15, rain: 0.15, storm: 0.15 }, hours: [2, 7] },
    storm: { name: 'Гроза', icon: 'w_storm', next: { rain: 0.55, cloudy: 0.45 }, hours: [1, 4] }
  };
  const WEATHER_KEYS = Object.keys(WEATHER);

  G.initWeather = function () {
    if (this.weather && WEATHER[this.weather.kind]) return this.weather;
    this.weather = { kind: 'clear', prev: 'clear', since: this.t - 60, until: this.t + 7 * 60, next: 'cloudy', strikeT: 0 };
    return this.weather;
  };

  G.nextWeather = function (kind) {
    const table = WEATHER[kind].next;
    let r = this.rng.next(), acc = 0;
    for (const [k, p] of Object.entries(table)) { acc += p; if (r <= acc) return k; }
    return 'clear';
  };

  G.setWeather = function (kind, hours) {
    if (!WEATHER[kind]) return;
    const W = this.initWeather();
    const before = W.kind;
    const [a, b] = WEATHER[kind].hours;
    W.prev = W.kind;
    W.kind = kind;
    W.since = this.t;
    W.until = this.t + 60 * (hours || this.rng.int(a, b));
    W.next = this.nextWeather(kind);
    if (before === kind) return;
    const hh = this.active();
    if (!hh || hh.lot < 0) return;
    if (kind === 'rain' && before !== 'storm') this.notify('Начался дождь. Симам на улице лучше поискать крышу над головой.', { icon: 'w_rain', minor: true, force: true });
    else if (kind === 'storm') this.notify('Надвигается гроза! Молнии бьют по открытым местам.', { icon: 'w_storm', force: true, kind: 'storm' });
    else if (kind === 'clear' && (before === 'rain' || before === 'storm')) this.notify('Небо прояснилось.', { icon: 'm_sun', minor: true, force: true });
  };

  G.isRaining = function () { const W = this.weather; return !!W && (W.kind === 'rain' || W.kind === 'storm'); };
  G.weatherName = function (kind) { return (WEATHER[kind || (this.weather && this.weather.kind) || 'clear'] || WEATHER.clear).name; };

  G.sheltered = function (x, y, lv) {
    const w = this.world;
    lv = lv || 0;
    if (w.indoor(x, y, lv)) return true;
    for (let l = lv + 1; l < w.L; l++) if (w.hasFloor(x, y, l)) return true;
    const lot = this.lots[w.lotAt(x, y)];
    return !!(lot && lot.roofPieces && lot.roofPieces.some(p => (p.lv || 0) >= lv && x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h));
  };

  G.outdoors = function (sim) {
    if (!sim || sim.hidden || sim.inside || sim.dead) return false;
    return !this.sheltered(Math.floor(sim.x), Math.floor(sim.y), sim.lv || 0);
  };

  G.weatherHour = function () {
    const W = this.initWeather();
    if (this.t >= W.until) this.setWeather(W.next);
    if (this.isRaining()) {
      for (const ob of this.world.objects.values()) {
        if (ob.t !== 'plant_garden' || ob.st.dead) continue;
        if (!this.world.indoor(ob.x, ob.y, ob.lv || 0)) { ob.st.water = 100; }
      }
    }
    if (W.kind === 'storm' && this.rng.chance(0.35)) this.lightningStrike();
  };

  G.lightningStrike = function () {
    const hh = this.active();
    if (!hh || hh.lot < 0) return null;
    const lot = this.lots[hh.lot];
    const w = this.world;
    const exposed = this.members(hh).filter(s => this.outdoors(s) && s.lot === lot.id);
    let spot = null;
    if (exposed.length && this.rng.chance(0.4)) {
      const s = this.rng.pick(exposed);
      spot = [Math.floor(s.x) + this.rng.int(-2, 2), Math.floor(s.y) + this.rng.int(-2, 2)];
    } else {
      for (let k = 0; k < 20 && !spot; k++) {
        const x = lot.x + this.rng.int(0, lot.w - 1), y = lot.y + this.rng.int(0, lot.h - 1);
        if (!this.sheltered(x, y, 0)) spot = [x, y];
      }
    }
    if (!spot) return null;
    this.fx('spark', { x: spot[0] + 0.5, y: spot[1] + 0.5 });
    this.fxAt = { x: spot[0] + 0.5, y: spot[1] + 0.5, t: this.t };
    this.sound('zap', { x: spot[0] + 0.5, y: spot[1] + 0.5 });
    for (const s of this.sims.values()) {
      if (s.dead || !this.outdoors(s) || (s.lv || 0) !== 0) continue;
      const d = Math.hypot(s.x - spot[0] - 0.5, s.y - spot[1] - 0.5);
      if (d < 0.9) {
        s.addMood('singed', this.t);
        s.addNeed('hygiene', -40); s.addNeed('energy', -15);
        this.hardStop(s);
        this.queue(s, 'panic', s, {});
        if (this.isActive(s)) this.notify('В ' + s.first + ' ударила молния! Сим цел, но причёска уже не та.', { sim: s, icon: 'w_storm' });
      } else if (d < 4) {
        s.addMood(s.has('brave') || s.has('daredevil') ? 'thrilled' : 'storm_scared', this.t);
      }
    }
    return spot;
  };

  G.weatherTick = function (dt) {
    const W = this.initWeather();
    if (W.kind === 'clear' || W.kind === 'cloudy') return;
    W.tickT = (W.tickT || 0) + dt;
    if (W.tickT < 1) return;
    const step = W.tickT;
    W.tickT = 0;
    const storm = W.kind === 'storm';
    for (const s of this.sims.values()) {
      if (s.dead || s.hidden || s.inside || s.isBaby) continue;
      if (this.outdoors(s)) {
        if (s.has('loves_outdoors')) s.addMood('rain_joy', this.t);
        else s.addMood('soaked', this.t);
        s.removeMood('cozy_rain');
        if (!s.swimZ) s.addNeed('hygiene', -0.06 * step);
      } else if (this.isActive(s) && !s.hasMood('soaked') && s.lot >= 0 && this.lots[s.lot] && this.lots[s.lot].hh === s.hh) {
        if (storm && s.has('coward')) s.addMood('storm_scared', this.t);
        else s.addMood('cozy_rain', this.t);
      }
    }
  };

  G.weatherPenalty = function (sim, ob) {
    if (!this.isRaining()) return 1;
    if (ob && ob.x !== undefined && !this.sheltered(ob.x, ob.y, ob.lv || 0)) return 0.15;
    return 1;
  };

  Object.assign(S, { WEATHER, WEATHER_KEYS });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
