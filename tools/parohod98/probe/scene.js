(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const sceneId = params.get('probe');
  if (!sceneId) return;
  const DUR = Math.max(3, Number(params.get('dur')) || 60);
  const WARM = Math.min(5, DUR / 4);
  const LONG = params.get('long') === '1';
  const bridge = window.Parohod98Game;
  const RESULT_KEY = 'parohod98.probe.result.' + sceneId;
  const SAVE_PREFIXES = ['ss98-', 'fh_riga_', 'fh_photo_probe', 'gtann_', 'parohod98.hint.'];

  const now = () => Math.round(performance.now());
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const memory = () => { try { return bridge ? JSON.parse(bridge.memory()) : null; } catch (e) { return null; } };
  const display = () => { try { return bridge && bridge.display ? JSON.parse(bridge.display()) : null; } catch (e) { return null; } };
  const heapMB = () => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);

  const result = { scene: sceneId, game: (window.Parohod98 || {}).game || '', dur: DUR, long: LONG, started: new Date().toISOString(), loadMenu: null, loadPlay: null, heapLimitMB: performance.memory ? Math.round(performance.memory.jsHeapSizeLimit / 1048576) : null, viewport: [innerWidth, innerHeight, devicePixelRatio], segments: [], errors: [], memory: { before: memory() }, display: display() };
  const addError = msg => { if (result.errors.length < 20) result.errors.push({ t: now(), msg: String(msg).slice(0, 300) }); };
  addEventListener('error', e => addError(e.message + (e.filename ? ' @ ' + e.filename.split('/').pop() + ':' + e.lineno : '')));
  addEventListener('unhandledrejection', e => addError('rejection: ' + (e.reason && e.reason.message || e.reason)));

  const saved = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (SAVE_PREFIXES.some(p => k.startsWith(p))) saved[k] = localStorage.getItem(k);
  }

  try { localStorage.setItem('parohod98.hint.' + result.game, '1'); } catch (e) {}

  const meter = { rec: null, last: 0, frames: 0 };
  const loop = t => {
    if (meter.last && meter.rec) meter.rec.push(t - meter.last);
    meter.last = t;
    meter.frames++;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  function stats(dts) {
    const n = dts.length;
    if (!n) return { frames: 0 };
    const total = dts.reduce((a, b) => a + b, 0);
    const sorted = dts.slice().sort((a, b) => a - b);
    const worst = sorted.slice(Math.floor(n * 0.95));
    const out = {
      frames: n,
      fps: Math.round(n / (total / 1000) * 10) / 10,
      p50: Math.round(sorted[Math.floor(n * 0.5)] * 10) / 10,
      p95: Math.round(sorted[Math.min(n - 1, Math.floor(n * 0.95))] * 10) / 10,
      worst5: Math.round(worst.reduce((a, b) => a + b, 0) / worst.length * 10) / 10,
      long50: dts.filter(d => d > 50).length
    };
    if (LONG) {
      const perMinute = [];
      let acc = 0, count = 0;
      for (const d of dts) {
        acc += d;
        count++;
        if (acc >= 60000) { perMinute.push(Math.round(count / (acc / 1000) * 10) / 10); acc = 0; count = 0; }
      }
      out.perMinute = perMinute;
    }
    return out;
  }

  async function wait(pred, timeout, what) {
    const end = performance.now() + timeout;
    while (performance.now() < end) {
      try { if (pred()) return true; } catch (e) {}
      await sleep(100);
    }
    throw new Error('timeout: ' + what);
  }

  async function framesPass(n) {
    const target = meter.frames + n;
    await wait(() => meter.frames >= target, 120000, n + ' frames');
  }

  async function segment(name, setup) {
    if (setup) await setup();
    await sleep(WARM * 1000);
    const heap = heapMB();
    meter.rec = [];
    await sleep(DUR * 1000);
    const dts = meter.rec;
    meter.rec = null;
    result.segments.push(Object.assign({ name, heapBefore: heap, heapAfter: heapMB(), memory: memory() }, stats(dts)));
    localStorage.setItem(RESULT_KEY, JSON.stringify(Object.assign({ partial: true }, result)));
  }

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    result.memory.after = memory();
    result.ended = new Date().toISOString();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (SAVE_PREFIXES.some(p => k.startsWith(p))) localStorage.removeItem(k);
    }
    for (const [k, v] of Object.entries(saved)) localStorage.setItem(k, v);
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
    if (bridge) bridge.exit();
    else location.href = '../../launcher/index.html';
  }

  window.parohod98Back = () => { result.aborted = 'back'; finish(); return true; };
  window.parohod98Pause = on => { if (on) result.interrupted = (result.interrupted || 0) + 1; };

  const turnAngle = (fx, fz, dx, dz) => Math.atan2(dx * -fz + dz * fx, dx * fx + dz * fz);

  async function seriousSam() {
    await wait(() => window.ssui && ssui.renderer && (ssui.demo || ssui.game), 120000, 'title');
    result.loadMenu = now();
    const ui = ssui, S = window.SeriousSam98;
    let t = 0;
    ui.input = function () {
      t += 1 / 60;
      return { fwd: 0.4, strafe: Math.sin(t * 0.7), dyaw: 0.9 / 60, fire: true };
    };
    let waves = null;
    const start = async (level, quality) => {
      ui.options.quality = quality;
      ui.resize();
      const t0 = now();
      ui.startLevel(level, 2, null);
      await wait(() => ui.state === 'play' && ui.game && ui.game.levelIndex === level, 120000, 'level ' + level);
      const g = ui.game;
      g.cheat('god');
      g.cheat('giveall');
      g.player.infAmmo = true;
      clearInterval(waves);
      waves = setInterval(() => {
        const gg = ui.game;
        if (!gg || gg.state !== 'play') return;
        const next = gg.triggers.find(tr => !tr.fired && !tr.actions.some(a => a.secret || a.exit) && (!tr.after || gg.waveDone(tr.after)));
        if (!next) return;
        const p = gg.player, x = (next.x0 + next.x1) / 2, z = (next.z0 + next.z1) / 2;
        p.x = x; p.z = z; p.y = gg.W.groundAt(x, z); p.vx = p.vy = p.vz = 0; p.ground = true;
      }, 6000);
      return now() - t0;
    };
    result.loadPlay = await start(0, 2);
    if (LONG) {
      await segment('Уровень 1 · MED (долгий)', () => { ui.options.quality = 1; ui.resize(); });
    } else {
      await segment('Уровень 1 · HIGH');
      await segment('Уровень 1 · MED', () => { ui.options.quality = 1; ui.resize(); });
      await segment('Уровень 1 · LOW', () => { ui.options.quality = 0; ui.resize(); });
      result.loadLevel5 = await start(Math.min(4, S.LEVELS.length - 1), 2);
      await segment('Уровень 5 · HIGH');
    }
    clearInterval(waves);
  }

  function forzaDrive(F, game, route, st) {
    const v = game.veh;
    const pr = route.project(v.x, v.z, st.idx, 30);
    st.idx = pr.i;
    const tp = route.point(pr.s + Math.max(7, v.speed * 0.5));
    const off = tp.line * 0.9;
    const tx = tp.x - tp.tz * off, tz = tp.z + tp.tx * off;
    const ang = turnAngle(Math.sin(v.yaw), -Math.cos(v.yaw), tx - v.x, tz - v.z);
    const mu = v.spec.grip * 0.92;
    const dec = Math.min(v.spec.grip * 1.05, v.spec.brake) * 9.81 * 0.82;
    let vt = 200;
    for (let k = 0; k < 60; k++) {
      const p = route.point(pr.s + k * 4);
      const surf = F.surfGrip(p.surf, v.spec.off, false);
      const vc = Math.sqrt(mu * surf * 9.81 / Math.max(Math.abs(route.curv[p.i]) * 0.8, 1e-4));
      vt = Math.min(vt, Math.sqrt(vc * vc + 2 * dec * surf * k * 4));
    }
    st.s = pr.s;
    return { thr: v.speed < vt - 1 ? 1 : v.speed < vt ? 0.4 : 0, brk: v.speed > vt + 2 ? Math.min(1, (v.speed - vt) / 6) : 0, steer: F.clamp(ang * 2.2, -1, 1), analog: true, hand: false, rewind: false, shiftUp: false, shiftDown: false, fix: false };
  }

  async function forza() {
    await wait(() => window.fzui && fzui.mode === 'title', 300000, 'title');
    result.loadMenu = now();
    const ui = fzui, F = window.Forza;
    const t0 = now();
    ui.newGame();
    const g = ui.game;
    if (g.race) g.abandonEvent();
    if (ui.menus) ui.menus.closeAll();
    const route = ui.routeFor(F.EV.get('vecriga'));
    const st = { idx: -1, s: 0, slow: 0 };
    const place = s => {
      const p = route.point(s);
      g.veh.place(p.x, p.z, Math.atan2(p.tx, -p.tz), ui.world);
      st.idx = -1;
    };
    place(0);
    ui.input = () => forzaDrive(F, g, route, st);
    const watch = setInterval(() => {
      if (ui.menuOpen && ui.menus) ui.menus.closeAll();
      if (g.veh.speed < 1.5) st.slow++; else st.slow = 0;
      if (st.slow > 4) { place(st.s + 15); st.slow = 0; }
    }, 1000);
    await framesPass(30);
    result.loadPlay = now() - t0;
    const preset = p => () => { Object.assign(ui.settings(), p); ui.applySettings(); };
    if (LONG) {
      await segment('Высокое (долгий)', preset({ gfx: 'high', res: 0 }));
    } else {
      await segment('Ультра', preset({ gfx: 'ultra', res: 0 }));
      await segment('Высокое', preset({ gfx: 'high', res: 0 }));
      await segment('Ретро 2000 · 480', preset({ gfx: 'retro', res: 480 }));
      await segment('Ретро 2000 · 360 · дальность 600 · без растительности', preset({ gfx: 'retro', res: 360, draw: 600, flora: 0 }));
    }
    clearInterval(watch);
  }

  async function gtann() {
    await wait(() => window.nnui && nnui.state === 'menu', 300000, 'menu');
    result.loadMenu = now();
    const ui = nnui, N = window.GtaNN;
    const t0 = now();
    ui.audio.init();
    ui.game = new N.Game(ui.city, { settings: ui.settings, voice: ui.voice, newGame: false, state: Object.assign(N.Game.newState(), { done: { m1: true }, clock: 13 * 60 }) });
    ui.demo = false;
    ui.state = 'play';
    ui.menus.close();
    ui.debug.act('tp', 'univermag');
    ui.resetCam();
    await framesPass(30);
    result.loadPlay = now() - t0;
    const g = () => ui.game;
    g().world.god = true;
    ui.debug.car.model = N.VEHICLES.vaz2106 ? 'vaz2106' : Object.keys(N.VEHICLES)[0];
    ui.debug.car.livery = '';
    const mode = { walk: false, t: 0 };
    const enterCar = () => {
      const w = g().world, pl = w.player;
      if (!pl.veh) {
        const lane = w.city.nearestLane(pl.x, pl.z, 150, l => l.ambient);
        if (lane) { pl.x = lane.x; pl.z = lane.z; pl.yaw = Math.atan2(lane.dx, -lane.dz); }
        ui.debug.act('drive');
      }
      mode.walk = false;
    };
    const leaveCar = () => {
      const w = g().world, pl = w.player;
      if (pl.veh) w.exitVehicle(pl);
      mode.walk = true;
    };
    ui.buildInput = function () {
      const w = g().world, pl = w.player;
      mode.t += 1 / 60;
      if (mode.walk || !pl.veh) {
        ui.camYaw += 0.4 / 60;
        return { fwd: 1, right: 0, camYaw: ui.camYaw, skip: true, skipAll: true };
      }
      const v = pl.veh;
      const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw);
      const lane = w.city.nearestLane(v.x + fx * 10, v.z + fz * 10, 40, l => l.ambient);
      let steer = 0;
      if (lane) {
        const tx = lane.x + lane.dx * 8, tz = lane.z + lane.dz * 8;
        steer = N.clamp(turnAngle(fx, fz, tx - v.x, tz - v.z) * 2, -1, 1);
      }
      const speed = Math.abs(v.spd || 0);
      return { fwd: speed < 13 ? 0.8 : 0, right: steer, steer, camYaw: ui.camYaw, skip: true, skipAll: true };
    };
    const watch = setInterval(() => {
      const game = g();
      if (game.cut && game.endCut) game.endCut();
      if (ui.menus && ui.menus.active && ui.state !== 'menu') { ui.menus.close(); ui.state = 'play'; }
      const pl = game.world.player;
      if (pl.veh && Math.abs(pl.veh.spd || 0) < 1) {
        mode.stuck = (mode.stuck || 0) + 1;
        if (mode.stuck > 4) {
          const lane = game.world.city.nearestLane(pl.veh.x + 30, pl.veh.z, 120, l => l.ambient);
          if (lane) { pl.veh.x = lane.x; pl.veh.z = lane.z; pl.veh.vx = pl.veh.vz = 0; pl.veh.yaw = Math.atan2(lane.dx, -lane.dz); pl.x = lane.x; pl.z = lane.z; }
          mode.stuck = 0;
        }
      } else mode.stuck = 0;
    }, 1000);
    const settings = (s, walk) => () => {
      Object.assign(ui.settings, s);
      ui.applySettings();
      if (walk) leaveCar(); else enterCar();
    };
    if (LONG) {
      await segment('Машина · низкие · 0.6 (долгий)', settings({ gfx: 'low', scale: 0.6 }));
    } else {
      await segment('Машина · высокие · 1.0', settings({ gfx: 'high', scale: 1 }));
      await segment('Машина · низкие · 0.6', settings({ gfx: 'low', scale: 0.6 }));
      await segment('Пешком · низкие · 0.6', settings({ gfx: 'low', scale: 0.6 }, true));
      await segment('Машина · низкие · 0.4', settings({ gfx: 'low', scale: 0.4 }));
      await segment('Машина · низкие · 0.4 · дальность 0.5 · город низко · плотность 0.5', settings({ gfx: 'low', scale: 0.4, draw: 0.5, city: 'low', cars: 'low', traffic: 0.5, peds: 0.5 }));
    }
    clearInterval(watch);
  }

  const SCENES = { serioussam: seriousSam, forza, gtann };

  (async () => {
    try {
      const run = SCENES[result.game];
      if (!run) throw new Error('no scene for ' + result.game);
      await run();
    } catch (e) {
      addError(e && e.stack || e);
      result.failed = String(e && e.message || e);
    }
    finish();
  })();
})();
