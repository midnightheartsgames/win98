const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TOWN = {
  dk: [113, -50, 1.8, 98, -26, 11, 14],
  dkside: [160, -40, 3, 60, 0, 10, 10],
  dkfar: [215, -175, 14, 95, -20, 6, 17.5],
  square: [215, -40, 9, 120, -110, 2, 12],
  squaretop: [100, -40, 75, 110, -112, 0, 12, 1.0],
  hub: [128, -98, 1.8, 100, -117, 2, 15],
  univermag: [248, -286, 2.5, 284, -330, 9, 13],
  univermag2: [235, -268, 20, 300, -350, 4, 16],
  mir: [40, -112, 2.2, -32, -128, 7, 15],
  mirside: [-10, -60, 3, -40, -125, 6, 11],
  parkgate: [-24, 11.5, 2, -54, 6, 7, 13],
  gazgate: [1344, -970, 2.2, 1383, -930, 8, 12],
  gazgate2: [1330, -1000, 25, 1383, -930, 4, 17],
  lenin: [1356, -966, 1.7, 1364, -957, 6, 13],
  soc: [-440, -470, 2.2, -360, -420, 8, 14],
  khrush: [-1200, -700, 2.2, -1150, -760, 8, 13],
  aerialc: [260, -260, 90, 60, -60, 0, 11, 0.95],
  lenina: [1480, -1180, 3, 1600, -1300, 4, 12],
  tram: [228, -40, 2.5, 200, -130, 5, 12],
  radius: [-735, -345, 2, -770, -386, 10, 15],
  fountain: [-192, -8, 2.2, -213.5, -20, 2, 14],
  wheel: [-341, 308, 2, -368, 325, 12, 14],
  tir: [-345.5, 260, 1.8, -356, 260, 1.8, 14, 0.8],
  rodina: [-480, -240, 2, -476, -200, 5, 14],
  dance: [-245, -140, 2.5, -257.5, -153, 1.5, 21, 1.0],
  attr: [-338, 252, 2.2, -380, 300, 4, 13],
  soc: [-30, -500, 2.2, -45, -541, 5, 13],
  oktyabrya: [250, -420, 2.2, 160, -470, 5, 13],
  ilyicha: [-470, -700, 2.2, -520, -650, 5, 13],
  hotel: [128, -300, 2, 104.8, -296.7, 3, 13],
  hotelroad: [118, -258, 2.2, 104, -296, 4, 13, 0.95],
  busstop: [14.5, -212.5, 2.2, 13.3, -206.5, 2.6, 13, 0.7],
  kiosk: [-8, -205, 2, -9.4, -197.4, 2.6, 13, 0.7],
  billboard: [253.5, -433, 2.5, 255, -444.6, 5.2, 13, 0.8],
  roofboxes: [-850, -1405, 2, -860, -1466, 28, 13],
  gazyard: [1410, -905, 2, 1383, -930, 6, 13],
  mirfront: [5, -104, 1.8, -22, -106.5, 8, 14],
  umplaza: [238, -290, 2.2, 300, -350, 6, 13, 1.0],
  parkgatetext: [-36, 9, 2, -54, 6, 11, 13, 0.6]
};
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);
const PHOTO_SET = `(() => {
  const N = GtaNN, P = nnui.photo, w = nnui.game.world, pl = w.player, c = nnui.city;
  const aim = (x, y, z, tx, ty, tz) => { Object.assign(P.c, { x, y, z, yaw: Math.atan2(tx - x, -(tz - z)), pitch: Math.atan2(ty - y, Math.hypot(tx - x, tz - z)), roll: 0 }); };
  const dk = N.photoSpots(c).find(s => s.id === 'dk'), side = dk.side, L = Math.hypot(side.x - dk.x, side.z - dk.z), ux = (side.x - dk.x) / L, uz = (side.z - dk.z) / L;
  const tyoma = d => { pl.x = side.x + ux * d; pl.z = side.z + uz * d; pl.y = c.groundY(pl.x, pl.z); pl.yaw = Math.atan2(ux, -uz); pl.vx = pl.vz = 0; };
  const set = (o) => { Object.assign(P.prefs, o.prefs || {}); P.lens = N.PHOTO.LENSES.indexOf(o.lens || 21); P.ev = o.ev || 0; P.af = o.af || 30; };
  window.nnPhoto = {
    scene(hour, d) { nnShots.place('dk', 0, 0, 0, hour); tyoma(d); nnShots.weather('clear'); nnShots.pump(90); tyoma(d); nnui.camYaw = Math.atan2(-ux, uz); nnui.camPos = null; nnShots.pump(30); return true; },
    open() { P.open(); return P.on; },
    wide() { const d = Math.hypot(pl.x - dk.x, pl.z - dk.z) + 24, x = dk.x + ux * d + uz * 6, z = dk.z + uz * d - ux * 6; aim(x, c.groundY(x, z) + 2.4, z, dk.x, dk.y - 2, dk.z); return true; },
    portrait() { aim(pl.x + ux * 4.2 + uz * 1.4, pl.y + 1.55, pl.z + uz * 4.2 - ux * 1.4, pl.x, pl.y + 1.4, pl.z); return true; },
    set,
    seen() { return P.seen().join(','); },
    shot(o) { set(o); if (o.view === 'portrait') this.portrait(); else this.wide(); P.af = P.centerDist(); nnShots.pump(3); return P.capture().url; }
  };
  return true;
})()`;
const PHOTO_SHOTS = [
  ['gold_print', { lens: 21, prefs: { film: 'gold', frame: 'print', date: true, aspect: '32', stop: 4, focus: 0, flash: false, tyoma: true } }],
  ['portrait_instant', { lens: 85, view: 'portrait', prefs: { film: 'life', frame: 'instant', date: false, aspect: '34', stop: 0, focus: 0, flash: false, tyoma: true } }],
  ['bw', { lens: 24, prefs: { film: 'bw', frame: 'none', date: false, aspect: '43', stop: 6, focus: 0, flash: false, tyoma: true } }],
  ['svema_strip', { lens: 28, prefs: { film: 'svema', frame: 'strip', date: false, aspect: '32', stop: 3, focus: 0, flash: false, tyoma: true } }],
  ['sepia', { lens: 35, prefs: { film: 'sepia', frame: 'print', date: false, aspect: '11', stop: 5, focus: 0, flash: false, tyoma: false } }],
  ['vhs', { lens: 21, prefs: { film: 'vhs', frame: 'none', date: true, aspect: '43', stop: 6, focus: 0, flash: false, tyoma: true } }]
];

const PAGE = `(() => {
  const N = GtaNN;
  window.nnShots = {
    pump(n, dt) { for (let i = 0; i < n; i++) nnui.step(dt || 1 / 60); return true; },
    shot() {
      const a = nnui.glc, b = nnui.hudc, c = document.createElement('canvas');
      c.width = a.width; c.height = a.height;
      nnui.step(1 / 60);
      const x = c.getContext('2d');
      x.drawImage(a, 0, 0);
      x.drawImage(b, 0, 0, c.width, c.height);
      return c.toDataURL('image/png');
    },
    start() { nnui.newGame(); for (let i = 0; i < 20; i++) nnui.step(1 / 60); if (nnui.game.mission) nnui.game.mission.fail('shots'); if (nnui.game.cut) nnui.game.endCut(); return true; },
    place(id, dx, dz, yaw, clock) {
      const g = nnui.game, w = g.world, p = w.city.places[id] || { x: id[0], z: id[1] };
      if (g.mission) { g.mission.fail('shots'); }
      if (g.cut) g.endCut();
      g.msg.big = null; g.msg.title = null; g.subs = [];
      g.teleport(typeof id === 'string' ? id : 'hotel_door', 0, 0);
      const q = N.placeAt(p, dx || 0, dz || 0);
      w.player.x = q[0]; w.player.z = q[1]; w.player.y = w.city.groundY(w.player.x, w.player.z);
      const a = (yaw || 0) + (p.rot || 0);
      w.player.yaw = a;
      nnui.camYaw = a; nnui.camPitch = 0.18; nnui.camPos = null;
      if (clock !== undefined) w.clock = clock;
      return true;
    },
    road(x, z, clock, turn) {
      const w = nnui.game.world, nl = w.city.nearestLane(x, z, 200, l => l.ambient);
      const yaw = N.yawOf(nl.dx, nl.dz) + (turn || 0);
      this.place([nl.x, nl.z], 0, 0, yaw, clock);
      return nl.lane.id;
    },
    look(pitch, dist) { nnui.camPitch = pitch; if (dist) nnui.settings.camDist = dist; nnui.camPos = null; return true; },
    car(model, livery) {
      const w = nnui.game.world, pl = w.player;
      const v = w.spawnVehicle(model, pl.x, pl.z, pl.yaw, { livery });
      w.seat(pl, v, true);
      nnui.camPos = null;
      return v.id;
    },
    cutRun(id, choice) {
      const g0 = nnui.game;
      const st = GtaNN.Game.newState();
      const idx = GtaNN.MISSIONS.findIndex(m => m.id === id);
      for (let i = 0; i < idx; i++) st.done[GtaNN.MISSIONS[i].id] = true;
      st.flags.ledger = choice ? 'kesha' : 'lyova';
      nnui.game = new GtaNN.Game(nnui.city, { settings: nnui.settings, state: st, headless: true });
      nnui.demo = false; nnui.state = 'play'; nnui.menus.close();
      const g = nnui.game, w = g.world, pl = w.player;
      g.startMission(id);
      this.run = g.mission;
      this.run.botChoice = choice || 0;
      this.lastShot = null;
      return true;
    },
    cutAdvance() {
      const g = nnui.game, w = g.world, pl = w.player, run = this.run;
      for (let k = 0; k < 400; k++) {
        if (g.mission !== run) return 'end';
        if (g.cut) {
          const key = g.cut.i + '|' + g.cut.shots.length + '|' + run.i;
          if (key !== this.lastShot) {
            this.lastShot = key;
            const c = g.cut, at = this.shotAt || 0.5;
            for (let f = 0; f < 600 && g.cut === c && c.i === +key.split('|')[0] && c.t < Math.max(1.2, c.est * at); f++) nnui.step(1 / 60);
            return 'shot ' + run.i + ':' + key.split('|')[0];
          }
          g.nextShot();
          continue;
        }
        const s = run.cur;
        const putAt = (x, z, veh) => {
          if (veh) { if (pl.veh !== veh) { if (pl.veh) w.exitVehicle(pl); if (veh.driver && veh.driver !== pl) { const d = veh.driver; w.unseat(d); d.x = veh.x + 3; d.z = veh.z; } w.seat(pl, veh, true); veh.ai = null; } veh.x = x; veh.z = z; veh.vx = veh.vz = 0; pl.x = x; pl.z = z; }
          else { if (pl.veh) w.exitVehicle(pl); pl.x = x; pl.z = z; pl.y = nnui.city.groundY(x, z); }
        };
        if (s) {
          if (s.type === 'goto') { const tg = run.targetOf(s); let veh = null; if (s.veh && s.veh !== 'none' && s.veh !== 'any') veh = run.ents[s.veh]; if (s.veh === 'any') veh = pl.veh || w.spawnVehicle('vaz2106', pl.x + 3, pl.z, 0); if (s.with) { const q = run.ents[s.with]; if (veh && q && q.veh !== veh) { if (q.veh) w.unseat(q); w.seat(q, veh, false); } } putAt(tg.x, tg.z, veh); if (s.y !== undefined) pl.y = s.y; }
          else if (s.type === 'enter') { const v = run.ents[s.tag]; putAt(v.x, v.z, v); }
          else if (s.type === 'kill') { const tags = typeof s.tags === 'function' ? s.tags(run) : s.tags; for (const t of tags) { const e = run.ents[t]; if (e && !e.dead) w.damagePed(e, 9999, pl, 'bullet'); } }
          else if (s.type === 'destroy') { for (const t of s.tags) { const e = run.ents[t]; if (e && !e.dead) w.damageVehicle(e, 99999, pl, true); } }
          else if (s.type === 'collect') { const kk = run.ents[s.tag]; if (kk) putAt(kk.x, kk.z, null); }
          else if (s.type === 'lose') w.setWanted(0);
          else if ((s.type === 'fn' || s.type === 'tail') && s.bot) s.bot(run);
          else if (s.type === 'tail') { const v = run.ents[s.tag]; if (v && v.ai && v.ai.path) { const e = v.ai.path[v.ai.path.length - 1]; v.x = e.x; v.z = e.z; v.ai.arrived = true; } }
          else if (s.type === 'choice') { const o = s.options[run.botChoice || 0]; const pp = nnui.city.places[o.at]; putAt(pp.x, pp.z, null); }
        }
        for (let f = 0; f < 10; f++) nnui.step(1 / 60);
      }
      return 'timeout ' + (run.cur && run.cur.type);
    },
    weather(kind, clock) { const w = nnui.game.world; w.setWeather(kind, 'instant', true); if (clock !== undefined) w.clock = clock; return true; },
    missionTo(id, until, choice) {
      this.cutRun(id, choice || 0);
      const g = nnui.game, run = this.run, w = g.world, pl = w.player;
      for (let k = 0; k < 600 && g.mission === run; k++) {
        if (until(run, g)) return true;
        if (g.cut) { g.endCut(); nnui.step(1 / 60); continue; }
        const s = run.cur;
        if (s.type === 'goto') { const tg = run.targetOf(s); let veh = null; if (s.veh && s.veh !== 'none' && s.veh !== 'any') veh = run.ents[s.veh]; if (s.veh === 'any') veh = pl.veh || w.spawnVehicle('vaz2106', pl.x + 3, pl.z, 0); if (veh && pl.veh !== veh) { if (pl.veh) w.exitVehicle(pl); w.seat(pl, veh, true); } if (s.with) { const q = run.ents[s.with]; if (veh && q && q.veh !== veh) { if (q.veh) w.unseat(q); w.seat(q, veh, false); } } if (veh) { veh.x = tg.x; veh.z = tg.z; veh.y = w.city.groundY(tg.x, tg.z); veh.vx = veh.vz = 0; } else if (pl.veh) w.exitVehicle(pl); pl.x = tg.x; pl.z = tg.z; }
        else if (s.type === 'enter') { const v = run.ents[s.tag]; if (pl.veh) w.exitVehicle(pl); w.seat(pl, v, true); }
        else if (s.type === 'kill') { for (const t of (typeof s.tags === 'function' ? s.tags(run) : s.tags)) { const e = run.ents[t]; if (e && !e.dead) w.damagePed(e, 9999, pl, 'bullet'); } }
        else if ((s.type === 'fn' || s.type === 'tail') && s.bot) s.bot(run);
        for (let f = 0; f < 10; f++) nnui.step(1 / 60);
      }
      return false;
    },
    gun(id) { const g = nnui.game, pl = g.world.player; g.giveWeapon(id, 300); pl.weapon = id; return true; },
    fire(n, spread) { const w = nnui.game.world, pl = w.player; pl.anim.aim = 1; for (let i = 0; i < n; i++) { const m = w.muzzle(pl); w.fire(pl, pl.weapon, m.x, m.y, m.z, Math.sin(pl.yaw), 0.03, -Math.cos(pl.yaw), spread || 0.02); } return true; },
    antisun() { const h = (nnui.game.world.clock / 60) % 24, az = (h / 24) * Math.PI * 2 - Math.PI * 0.6; nnui.camYaw = Math.atan2(-Math.cos(az), Math.sin(az)); nnui.camPos = null; nnui.game.world.player.yaw = nnui.camYaw; return true; },
    async smash() {
      const city = nnui.city, rows = [];
      const clearPath = (rec, fx, fz, len, half) => {
        for (let t = 1; t <= len; t++) {
          const x = rec.x - fx * t, z = rec.z - fz * t;
          let hit = city.ground(x, z) === N.GT.WATER;
          city.hash.query(x - half, z - half, x + half, z + half, it => {
            if (it === rec.col || it.kind === 'edge') return;
            if (it.circle ? Math.hypot(it.x - x, it.z - z) < it.r + half : it.poly ? N.pointInPoly(it.poly, x, z) || N.circlePoly(x, z, half, it.poly) : true) { hit = true; return true; }
          });
          if (hit) return false;
        }
        return true;
      };
      const camFree = (x, z) => { let ok = true; city.hash.query(x - 1, z - 1, x + 1, z + 1, it => { if (it.kind === 'building' || it.kind === 'tree') { ok = false; return true; } }); return ok; };
      const pick = (kind, axis, half, len, filter) => {
        for (const r of city.brks) {
          if (r.kind !== kind || !r.col || r.base || (filter && !filter(r))) continue;
          for (const flip of [0, Math.PI]) {
            const a = r.rot + (axis === 'x' ? 0 : -Math.PI / 2) + flip, fx = Math.cos(a), fz = Math.sin(a);
            if (!clearPath(r, fx, fz, len, half) || !clearPath(r, -fx, -fz, 8, half)) continue;
            for (const s of [1, -1]) {
              const cx = r.x + fx * 3 - fz * 10 * s, cz = r.z + fz * 3 + fx * 10 * s;
              if (camFree(cx, cz)) return { r, fx, fz, cx, cz };
            }
          }
        }
        return null;
      };
      const run = (label, kind, axis, speed, half, len, filter) => {
        const pk = pick(kind, axis, half || 1.3, len || 18, filter);
        if (!pk) { rows.push([label + ': no spot', []]); return; }
        const { r, fx, fz, cx, cz } = pk;
        nnui.game = new N.Game(city, { settings: nnui.settings, state: N.Game.newState(), headless: true });
        const g = nnui.game, w = g.world, pl = w.player;
        w.settings.ambient = false;
        w.setWeather('clear', 'instant', true);
        w.clock = 12.5 * 60;
        for (const p of w.peds.slice()) if (!p.isPlayer) w.removePed(p);
        for (const v of w.vehs.slice()) w.removeVehicle(v);
        const d = 14 + N.VEHICLES.vaz2107.hl;
        pl.x = r.x - fx * d; pl.z = r.z - fz * d;
        const v = w.spawnVehicle('vaz2107', pl.x, pl.z, Math.atan2(fx, -fz));
        w.seat(pl, v, true);
        const gy = city.groundY(r.x, r.z);
        nnui.computeCamera = () => ({ x: cx, y: gy + 3.2, z: cz, tx: r.x + fx * 3, ty: gy + 0.8, tz: r.z + fz * 3, fov: 1.0 });
        const want = [0.1, 0.35, 0.7, 1.3, 3.0], frames = [];
        let hitAt = -1;
        for (let i = 0; i < 900 && frames.length < want.length; i++) {
          if (hitAt < 0) { v.vx = fx * speed; v.vz = fz * speed; }
          nnui.step(1 / 60);
          if (hitAt < 0 && w.broken.has(r)) hitAt = i;
          if (hitAt >= 0 && i - hitAt >= Math.round(want[frames.length] * 60)) { g.msg.big = null; g.msg.title = null; frames.push(this.shot()); }
        }
        rows.push([label + ' ' + Math.round(speed * 3.6) + ' km/h' + (hitAt < 0 ? ': not broken' : ''), frames]);
      };
      run('bench', 'bench', 'z', 9);
      run('bench', 'bench', 'z', 14);
      run('lamp post', 'lamp', 'x', 15, 1.3, 18, r => !r.p.park);
      run('fence panel', 'fence', 'z', 12);
      run('containers', 'bin', 'z', 10, 0.55, 12);
      run('picket fence', 'picket', 'z', 10);
      run('road sign', 'sign', 'z', 13);
      delete nnui.computeCamera;
      const W = 320, Hh = 200, c = document.createElement('canvas');
      c.width = W * 5; c.height = (Hh + 20) * rows.length;
      const x2 = c.getContext('2d');
      x2.fillStyle = '#000'; x2.fillRect(0, 0, c.width, c.height);
      for (let k = 0; k < rows.length; k++) {
        const [label, frames] = rows[k], Y = k * (Hh + 20);
        x2.fillStyle = '#fff'; x2.font = '14px Arial'; x2.fillText(label, 6, Y + 15);
        for (let i = 0; i < frames.length; i++) {
          const img = new Image();
          await new Promise(res => { img.onload = res; img.src = frames[i]; });
          x2.drawImage(img, i * W, Y + 20, W, Hh);
        }
      }
      return c.toDataURL('image/png');
    },
    stats() { return JSON.stringify(Object.assign({}, nnui.renderer.stats, { peds: nnui.game.world.peds.length, vehs: nnui.game.world.vehs.length })); },
    lineup(clock) {
      this.start();
      const g = nnui.game, w = g.world, pl = w.player;
      g.msg.big = null; g.msg.title = null; g.subs = [];
      w.settings.ambient = false;
      w.settings.cops = false;
      const nl = w.city.nearestLane(1500, -1150, 200, l => l.ambient);
      this.spot = { x: nl.x, z: nl.z, yaw: N.yawOf(nl.dx, nl.dz) };
      pl.x = nl.x + 40; pl.z = nl.z + 40; pl.y = w.city.groundY(pl.x, pl.z); pl.hidden = true;
      w.clock = clock;
      w.setWeather('clear', 'instant', true);
      return true;
    },
    view(x, z, h, tx, tz, th, hour, fov, keep) {
      const g = nnui.game;
      if (!keep || !g || nnui.state !== 'play') this.start();
      const w = nnui.game.world, pl = w.player;
      nnui.game.msg.big = null; nnui.game.msg.title = null; nnui.game.subs = [];
      if (pl.veh) w.exitVehicle(pl);
      w.clock = hour * 60;
      w.setWeather('clear', 'instant', true);
      pl.x = x; pl.z = z; pl.y = w.city.groundY(x, z); pl.hidden = true;
      const gy = w.city.groundY(x, z), ty = w.city.groundY(tx, tz);
      nnui.computeCamera = () => ({ x, y: gy + h, z, tx, ty: ty + th, tz, fov: fov || 0.9 });
      for (let i = 0; i < 40; i++) nnui.step(1 / 60);
      return true;
    },
    green(kind, hour) {
      const q = nnui.city.greenSpots[kind];
      if (!q) return false;
      return this.view(q.x, q.z, 1.8, q.tx, q.tz, 0.8, hour || 13, 0.95);
    },
    bview(id, d, side, hour, h) {
      const b = nnui.city.buildings[id], p = b.poly, walls = [];
      for (let i = 0; i < p.length; i += 2) {
        const j = (i + 2) % p.length, ex = p[j] - p[i], ez = p[j + 1] - p[i + 1], L = Math.hypot(ex, ez);
        walls.push({ L, mx: (p[i] + p[j]) / 2, mz: (p[i + 1] + p[j + 1]) / 2, nx: ez / L, nz: -ex / L });
      }
      walls.sort((a, c) => c.L - a.L);
      const w = walls[Math.min(side || 0, walls.length - 1)];
      const x = w.mx + w.nx * d + w.nz * d * 0.35, z = w.mz + w.nz * d - w.nx * d * 0.35;
      return this.view(x, z, h || 1.8, w.mx, w.mz, Math.min(b.h * 0.55, 9), hour || 13, 0.95, true);
    },
    clearStreet() {
      const w = nnui.game.world;
      for (const v of w.vehs.slice()) w.removeVehicle(v);
      for (const p of w.peds.slice()) if (!p.isPlayer) w.removePed(p);
    },
    VIEWS: { f34: [0.78, -0.62, 0.32], r34: [-0.78, 0.62, 0.32], side: [0, 1, 0.12], front: [1, 0, 0.18], rear: [-1, 0, 0.18], top: [0.35, -0.3, 1.2], ws: [0.55, -0.25, 0.42], fdet: [0.9, -0.42, 0.1, 0.5, 0.75], rdet: [-0.9, 0.42, 0.1, 0.5, -0.75], sdet: [0.3, -0.95, 0.12, 0.5, 0.2] },
    sheet(tiles, cols, tw, th) {
      const w = nnui.game.world, s = this.spot;
      const rows = Math.ceil(tiles.length / cols);
      const c = document.createElement('canvas');
      c.width = cols * tw; c.height = rows * th;
      const g = c.getContext('2d');
      g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
      tiles.forEach(([item, view, mode], i) => {
        this.clearStreet();
        const [model, livery] = item.split(':');
        const spec = N.VEHICLES[model];
        w.clock = mode === 'sunset' ? 19.6 * 60 : mode === 'day' || mode === 'ind' || mode === 'dead' || mode === 'wet' ? 13 * 60 : 23 * 60;
        w.setWeather(mode === 'wet' || mode === 'wetnight' ? 'rain' : 'clear', 'instant', true);
        const v = w.spawnVehicle(model, s.x, s.z, s.yaw, { livery: livery || null, color: livery ? undefined : '#8a8c88' });
        if (mode === 'dead') { v.dead = true; v.hp = 0; }
        const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw), rx = Math.cos(v.yaw), rz = Math.sin(v.yaw);
        const V = this.VIEWS[view], d = (spec.shape.L * 0.95 + 2.6) * (V[3] || 1), ty = v.y + spec.shape.H * (V[3] ? 0.4 : 0.5);
        const cx = v.x + fx * (V[4] || 0) * spec.hl, cz = v.z + fz * (V[4] || 0) * spec.hl;
        nnui.computeCamera = () => ({ x: cx + (fx * V[0] + rx * V[1]) * d, y: ty + V[2] * d, z: cz + (fz * V[0] + rz * V[1]) * d, tx: cx, ty, tz: cz, fov: 0.75 });
        for (let k = 0; k < 4; k++) nnui.step(1 / 60);
        if (mode !== 'day' && mode !== 'dead' && mode !== 'wet' && mode !== 'sunset') {
          v.lights = mode !== 'ind';
          v.brake = mode === 'brake';
          v.rev = mode === 'brake';
          v.siren = !!livery && mode === 'siren';
          v.ind = mode === 'ind' ? 2 : 0;
          nnui.render(1 / 60);
        }
        const a = nnui.glc, sc = Math.max(tw / a.width, th / a.height), sw = tw / sc, sh = th / sc;
        const x0 = (i % cols) * tw, y0 = Math.floor(i / cols) * th;
        g.drawImage(a, (a.width - sw) / 2, (a.height - sh) / 2, sw, sh, x0, y0, tw, th);
        g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x0, y0, tw, 18);
        g.fillStyle = '#ff0'; g.font = '13px sans-serif'; g.fillText(item + ' ' + spec.name + ' · ' + view + ' ' + mode, x0 + 4, y0 + 14);
      });
      delete nnui.computeCamera;
      return c.toDataURL('image/png');
    },
    metroSheet(set) {
      const g = nnui.game, w = g.world, pl = w.player, L = w.city.metroLine, OZ = N.METRO.OZ, MP = N.METRO.P, M = w.metro, st = L.st, tiles = [];
      w.setWeather('clear', 'instant', true);
      const findT = (si, dir, phase) => {
        for (let t = 0; t < L.cycle; t += 0.5) for (const tr of M.trains) { const s = L.state(t + tr.off, {}); if (s.seg.type === 'stop' && s.seg.st === si && (s.L === 0 ? 1 : -1) === dir && s.tau > phase && s.tau < phase + 0.6) return t; }
        return 0;
      };
      const go = (t, clock) => { w.t = t; w.clock = clock; M.poseAll(true); };
      const place = (x, z, y, yaw) => { g.teleport('mpl_kir'); pl.x = x; pl.z = z; pl.y = y; pl.yaw = yaw; pl.vx = pl.vz = 0; nnui.camPos = null; g.fade = null; for (const m of g.markers()) g.cool.add(m.id); };
      const cam = (x, y, z, tx, ty, tz, fov) => { nnui.computeCamera = () => ({ x, y, z, tx, ty, tz, fov: fov || 1.05 }); };
      const snap = label => {
        for (let i = 0; i < 8; i++) nnui.step(1 / 60);
        g.msg.big = null; g.msg.title = null; g.msg.help = null; nnui.step(1 / 60);
        const c = document.createElement('canvas');
        c.width = 640; c.height = 400;
        const x = c.getContext('2d');
        x.drawImage(nnui.glc, 0, 0, 640, 400);
        x.drawImage(nnui.hudc, 0, 0, 640, 400);
        x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(0, 0, 640, 18);
        x.fillStyle = '#ff0'; x.font = '13px sans-serif'; x.fillText(label, 4, 14);
        tiles.push(c);
      };
      if (set === 'inside') {
        const q = st[1], e = -1, X = q.x;
        go(10, 13 * 60);
        place(X + e * 66, OZ - 1, MP.top, N.yawOf(-e, 0));
        cam(X + e * 74, MP.top + 1.8, OZ - 5, X + e * 58, MP.top + 1.2, OZ + 1);
        snap('Кировская: вестибюль, турникеты');
        place(X + e * 47, OZ, 2.6, N.yawOf(-e, 0));
        cam(X + e * 48, 4.4, OZ + 1, X + e * 38, 6.6, OZ, 1.0);
        snap('Кировская: мозаика над спуском');
        go(findT(1, 1, 8), 15 * 60);
        const T = M.trains.find(o => o.stop === 1), c = T.cars[1];
        place(c.x + c.ex * 1.5, c.z, 0, N.yawOf(c.ex, c.ez));
        cam(c.x - c.ex * 8, 1.65, c.z - c.ez * 8 + 0.2, c.x + c.ex * 8, 1.4, c.z + c.ez * 8);
        snap('Салон вагона 81-717');
        place(q.x - 120, OZ + MP.track, MP.bed, N.yawOf(-1, 0));
        cam(q.x - 112, 0.4, OZ + 6.3, q.x - 180, 0.2, OZ + 6.6, 1.0);
        snap('Тоннель');
      } else if (set === 'street') {
        for (const gi of [0, 6]) {
          const gp = L.gates[gi], P0 = w.city.places['mg' + gi];
          g.teleport('mg' + gi);
          g.fade = null; for (const m of g.markers()) g.cool.add(m.id);
          pl.x = P0.x + Math.sin(P0.yaw) * 3; pl.z = P0.z - Math.cos(P0.yaw) * 3;
          w.clock = 15 * 60;
          cam(P0.x + Math.sin(P0.yaw) * 8 + Math.cos(P0.yaw) * 3, 2.2, P0.z - Math.cos(P0.yaw) * 8 + Math.sin(P0.yaw) * 3, gp.px, 1.6, gp.pz, 1.0);
          snap('Павильон ' + gi + ': ' + gp.sign);
        }
      } else {
        go(findT(0, 1, 6), 13 * 60);
        place(st[0].x - 20, OZ + 2, 0, N.yawOf(1, 0));
        cam(st[0].x - 30, 1.7, OZ - 2.5, st[0].x + 10, 2.2, OZ + 1.5);
        snap('Парк культуры');
        go(findT(1, 1, 8), 12 * 60);
        place(st[1].x + 4, OZ + 3.8, 0, N.yawOf(0, 1));
        cam(st[1].x - 14, 1.7, OZ + 1.2, st[1].x + 20, 1.6, OZ + 4);
        snap('Кировская');
        go(findT(2, -1, 8), 18 * 60);
        place(st[2].x, OZ, 0, N.yawOf(1, 0));
        cam(st[2].x - 30, 1.7, OZ + 1.0, st[2].x + 20, 2.0, OZ - 1.5);
        snap('Комсомольская');
        go(findT(3, -1, 8), 19 * 60);
        place(st[3].x + 5, OZ - 3.8, 0, N.yawOf(0, -1));
        cam(st[3].x + 25, 1.7, OZ - 1.0, st[3].x - 10, 1.4, OZ - 6.0, 1.0);
        snap('Автозаводская');
      }
      delete nnui.computeCamera;
      const out = document.createElement('canvas');
      out.width = 1280; out.height = 400 * Math.ceil(tiles.length / 2);
      const o = out.getContext('2d');
      tiles.forEach((c, i) => o.drawImage(c, (i % 2) * 640, Math.floor(i / 2) * 400));
      return out.toDataURL('image/png');
    },
    liveryItems() {
      const out = [];
      for (const id of N.VEHICLE_IDS) for (const l of Object.keys(N.VEHICLES[id].liveries || {})) out.push(id + ':' + l);
      return out;
    },
    carStats() {
      const models = {};
      for (const id of N.VEHICLE_IDS) for (const l of [null].concat(Object.keys(N.VEHICLES[id].liveries || {}))) {
        const m = N.Models.car(id, l), ds = m.doors || [];
        models[id + (l ? ':' + l : '')] = { body: m.mb.nv, tris: m.mb.ni / 3, doors: ds.reduce((a, d) => a + d.mb.nv, 0), glass: m.gl.nv + ds.reduce((a, d) => a + d.gl.nv, 0), lamps: (m.lamps || []).length };
      }
      return JSON.stringify({ wheel: N.Models.wheel().nv, models });
    },
    perf(n) {
      const S = nnui.scene, R = nnui.renderer, fill = S.fill, render = R.render;
      let tf = 0, tr = 0, dv = 0, gv = 0;
      S.fill = function (f) { const t = performance.now(); const x = fill.call(this, f); tf += performance.now() - t; dv += R.dyn.nv; gv += R.glass.nv; return x; };
      R.render = function (f) { const t = performance.now(); const x = render.call(this, f); tr += performance.now() - t; return x; };
      for (let i = 0; i < n; i++) nnui.step(1 / 60);
      delete S.fill;
      delete R.render;
      return JSON.stringify({ frames: n, fillMs: +(tf / n).toFixed(3), renderMs: +(tr / n).toFixed(3), dynVerts: Math.round(dv / n), glassVerts: Math.round(gv / n), vehs: nnui.game.world.vehs.length });
    },
    benchSet(army) {
      this.lineup(13 * 60);
      this.clearStreet();
      const w = nnui.game.world, s = this.spot, pl = w.player;
      const at = (d, l) => [s.x + Math.sin(s.yaw) * d + Math.cos(s.yaw) * l, s.z - Math.cos(s.yaw) * d + Math.sin(s.yaw) * l];
      const own = w.spawnVehicle('volga3110', s.x, s.z, s.yaw, { color: '#8a8c88' });
      w.seat(pl, own, true);
      const list = army ? ['t72', 'btr80', 'ural4320', 't72', 'btr80', 'ural4320', 'uaz469', 'avtozak', 'paz', 'gaz53'] : N.VEHICLE_IDS.filter(id => N.VEHICLES[id].type !== 'tank' && N.VEHICLES[id].type !== 'apc');
      for (let i = 0; i < 28; i++) {
        const id = list[i % list.length], q = at(7 + i * 5.2, i % 2 ? 3.2 : -3.2), L = Object.keys(N.VEHICLES[id].liveries || {});
        const v = w.spawnVehicle(id, q[0], q[1], s.yaw + (i % 3 ? 0 : Math.PI), { livery: army ? 'army' : i % 4 === 0 ? L[i % Math.max(1, L.length)] : null, color: '#7a2a24' });
        if (i % 2) w.seat(w.spawnPed('worker', v.x, v.z, 0), v, true);
      }
      if (army) { const h = at(70, -20); w.heli = N.AI.newHeli('mi24', h[0], h[1], w.city.groundY(h[0], h[1]) + 25); }
      nnui.camYaw = s.yaw; nnui.camPitch = 0.12; nnui.camPos = null;
      for (let i = 0; i < 30; i++) nnui.render(1 / 60);
    },
    benchCars(n) {
      const out = {}, S = nnui.scene, R = nnui.renderer, fill = S.fill;
      for (const army of [false, true]) {
        this.benchSet(army);
        for (const cars of Object.keys(N.CAR_DETAIL)) {
          nnui.settings.cars = cars;
          for (let i = 0; i < 20; i++) nnui.render(1 / 60);
          let tf = 0, dv = 0;
          S.fill = function (f) { const t = performance.now(); const x = fill.call(this, f); tf += performance.now() - t; dv += R.dyn.nv; return x; };
          for (let i = 0; i < n; i++) nnui.render(1 / 60);
          delete S.fill;
          out[(army ? 'army ' : 'street ') + cars] = { fillMs: +(tf / n).toFixed(3), dynVerts: Math.round(dv / n) };
        }
      }
      nnui.settings.cars = 'high';
      return JSON.stringify(out);
    }
  };
  return true;
})()`;

async function main() {
  const out = process.argv[2] || path.join(os.tmpdir(), 'gtann-shots');
  const scenes = (process.argv[3] || 'menu,street,car,night,gaz').split(',');
  fs.mkdirSync(out, { recursive: true });
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nnedge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=1280,800', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  const cleanup = () => {
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) { }
    server.kill();
  };
  try {
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch (e) { }
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    const errors = [];
    ws.addEventListener('message', m => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
      if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) errors.push(d.params.args.map(a => a.value || a.description).join(' '));
    });
    const send = (method, params) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalJs = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception ? r.result.exceptionDetails.exception.description : r.result.exceptionDetails.text);
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    await send('Runtime.enable', {});
    await send('Page.enable', {});
    for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${sport}/gtann.html`)).status === 200) break; } catch (e) { } await sleep(250); }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/gtann.html?debug` });
    let st = null;
    for (let i = 0; i < 240; i++) {
      await sleep(500);
      try { st = await evalJs('window.nnui && nnui.state'); } catch (e) { }
      if (st === 'menu' || st === 'error') break;
    }
    console.log('state', st);
    if (st !== 'menu') { console.log(await evalJs("document.querySelector('.nn-load-text') && document.querySelector('.nn-load-text').textContent")); console.log(errors.join('\n')); return; }
    await evalJs(PAGE);
    const save = async name => {
      const url = await evalJs('nnShots.shot()');
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      console.log(name, await evalJs('nnShots.stats()'));
    };
    const saveNow = async (name, expr) => {
      const url = await evalJs('(() => { ' + expr + '; return nnShots.shot(); })()');
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      console.log(name, await evalJs('nnShots.stats()'));
    };
    const page = async name => {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.result.data, 'base64'));
      console.log(name, 'page shot');
    };
    const script = fs.existsSync(process.argv[4] || '') ? fs.readFileSync(process.argv[4], 'utf8') : null;
    for (const sc of scenes) {
      const t0 = Date.now();
      if (sc === 'menu') { await evalJs('nnShots.pump(30)'); await save('menu'); }
      else if (sc === 'start') { await evalJs('nnShots.start()'); await evalJs('nnShots.pump(20)'); await save('start'); }
      else if (sc === 'intro') { await evalJs('nnui.newGame(); true'); await evalJs('nnShots.pump(200)'); await save('intro'); }
      else if (sc === 'street') { await evalJs('nnShots.start()'); await evalJs("nnShots.place('hotel_door', -6, 0, Math.PI/2+0.4, 14*60)"); await evalJs('nnShots.pump(300)'); await save('street'); }
      else if (sc === 'car') { await evalJs("nnShots.start(); nnShots.road(520, -420, 17*60)"); await evalJs("nnShots.car('volga3110')"); await evalJs('nnShots.pump(200)'); await save('car'); }
      else if (sc === 'lenina') { await evalJs("nnShots.start(); nnShots.road(1500, -1150, 12*60); nnShots.look(0.32)"); await evalJs('nnShots.pump(240)'); await save('lenina'); }
      else if (sc === 'yard') { await evalJs("nnShots.start(); nnShots.place('flat', -8, 6, 0.6, 13*60)"); await evalJs('nnShots.pump(200)'); await save('yard'); }
      else if (sc === 'market') { await evalJs("nnShots.start(); nnShots.place('market', 0, 6, 0, 11*60)"); await evalJs('nnShots.pump(200)'); await save('market'); }
      else if (sc === 'zarya') { await evalJs("nnShots.start(); nnShots.place('zarya_in', 0, 0, 0, 16*60)"); await evalJs('nnShots.pump(200)'); await save('zarya'); }
      else if (sc === 'port') { await evalJs("nnShots.start(); nnShots.place('port', -20, 0, Math.PI / 2, 7*60)"); await evalJs('nnShots.pump(200)'); await save('port'); }
      else if (sc === 'aerial') { await evalJs("nnShots.start(); nnShots.road(300, -400, 10*60); nnui.camMode = 3"); await evalJs('nnShots.pump(120)'); await save('aerial'); await evalJs('nnui.camMode = 0; true'); }
      else if (sc === 'night') { await evalJs("nnShots.place('club_door', -12, 10, Math.PI/2, 23*60)"); await evalJs('nnShots.pump(240)'); await save('night'); }
      else if (sc === 'gaz') { await evalJs("nnShots.place('gaz_gate', -30, -20, Math.PI/2, 19.8*60)"); await evalJs('nnShots.pump(200)'); await save('gaz'); }
      else if (sc === 'soc') { await evalJs("nnShots.place('dk', 10, 0, -Math.PI/2, 11*60)"); await evalJs('nnShots.pump(200)'); await save('soc'); }
      else if (sc === 'river') { await evalJs("nnShots.place('colonel', -20, 30, Math.PI/2+0.5, 18.5*60)"); await evalJs('nnShots.pump(200)'); await save('river'); }
      else if (sc === 'park') { await evalJs("nnShots.place('ferris', 20, 30, -0.6, 15*60)"); await evalJs('nnShots.pump(200)'); await save('park'); }
      else if (sc === 'club') { await evalJs("(() => { nnShots.place('club_in', 0, 0, Math.PI, 23*60); const r = nnui.city.clubRoom; nnui.game.world.player.x = r.x0 + 6; nnui.game.world.player.z = r.z1 - 3; return true; })()"); await evalJs('nnShots.pump(120)'); await save('club'); }
      else if (sc === 'cars') {
        await evalJs("(() => { nnShots.lineup(13 * 60); nnShots.clearStreet(); const w = nnui.game.world, s = w.city.places.stadium, N = GtaNN; N.VEHICLE_IDS.forEach((m, i) => { const q = N.placeAt(s, -15 + (i % 6) * 6, -16 + Math.floor(i / 6) * 9); w.spawnVehicle(m, q[0], q[1], (s.rot || 0) + 0.6); }); const c = N.placeAt(s, 0, -2), e = N.placeAt(s, 0, 36), y = w.city.groundY(c[0], c[1]); nnui.computeCamera = () => ({ x: e[0], y: y + 15, z: e[1], tx: c[0], ty: y, tz: c[1], fov: 0.95 }); nnShots.pump(30); return true; })()");
        await save('cars');
        await evalJs('delete nnui.computeCamera; true');
      }
      else if (sc.startsWith('lineup:')) {
        const [, view, mode] = sc.split(':');
        await evalJs(`nnShots.lineup(13 * 60)`);
        const url = await evalJs(`nnShots.sheet(GtaNN.VEHICLE_IDS.map(id => [id, '${view}', '${mode || 'day'}']), 4, 400, 250)`);
        fs.writeFileSync(path.join(out, 'lineup_' + view + '_' + (mode || 'day') + '.png'), Buffer.from(url.split(',')[1], 'base64'));
        console.log('lineup', view, mode || 'day');
      }
      else if (sc.startsWith('metro')) {
        const set = sc.split(':')[1] || 'stations';
        await evalJs('nnShots.start()');
        const url = await evalJs(`nnShots.metroSheet('${set}')`);
        fs.writeFileSync(path.join(out, 'metro_' + set + '.png'), Buffer.from(url.split(',')[1], 'base64'));
        console.log('metro', set);
      }
      else if (sc.startsWith('liveries')) {
        const [, view, mode] = sc.split(':');
        await evalJs(`nnShots.lineup(13 * 60)`);
        const url = await evalJs(`nnShots.sheet(nnShots.liveryItems().map(id => [id, '${view || 'f34'}', '${mode || 'day'}']), 4, 400, 250)`);
        fs.writeFileSync(path.join(out, 'liveries_' + (view || 'f34') + '_' + (mode || 'day') + '.png'), Buffer.from(url.split(',')[1], 'base64'));
        console.log('liveries', view || 'f34', mode || 'day');
      }
      else if (sc.startsWith('closeup:')) {
        const item = sc.slice(8);
        await evalJs(`nnShots.lineup(13 * 60)`);
        const tiles = [['f34', 'day'], ['r34', 'day'], ['side', 'day'], ['front', 'day'], ['rear', 'day'], ['ws', 'day'], ['f34', 'night'], ['r34', 'brake'], ['fdet', 'day'], ['rdet', 'day'], ['sdet', 'day'], ['fdet', 'ind']].map(([v, m]) => [item, v, m]);
        const url = await evalJs(`nnShots.sheet(${JSON.stringify(tiles)}, 4, 480, 300)`);
        fs.writeFileSync(path.join(out, 'closeup_' + item.replace(':', '_') + '.png'), Buffer.from(url.split(',')[1], 'base64'));
        console.log('closeup', item);
      }
      else if (sc.startsWith('view:')) {
        const v = sc.slice(5).split(':').map(Number);
        await evalJs(`nnShots.view(${v.slice(0, 7).join(',')}, ${v[7] || 0.9})`);
        await save('view_' + v.slice(0, 2).join('_'));
        await evalJs('delete nnui.computeCamera; true');
      }
      else if (sc.startsWith('green:')) {
        const [kind, hour] = sc.slice(6).split('@');
        if (await evalJs(`nnShots.green('${kind}', ${+hour || 13})`)) await save('green_' + kind + (hour ? '_' + hour : ''));
        else console.log('no green spot', kind);
        await evalJs('delete nnui.computeCamera; true');
      }
      else if (sc.startsWith('bview:')) {
        const [id, d, side, hour, h] = sc.slice(6).split(':').map(Number);
        await evalJs(`nnShots.bview(${id}, ${d || 26}, ${side || 0}, ${hour || 13}, ${h || 1.8})`);
        await save('bview_' + id + '_' + (side || 0) + (hour ? '_' + hour : ''));
        await evalJs('delete nnui.computeCamera; true');
      }
      else if (sc.startsWith('town:')) {
        const name = sc.slice(5), v = TOWN[name.split('@')[0]];
        const hour = name.includes('@') ? +name.split('@')[1] : v[6];
        await evalJs(`nnShots.view(${v.slice(0, 6).join(',')}, ${hour}, ${v[7] || 0.9}, true)`);
        await save('town_' + name.replace('@', '_'));
        await evalJs('delete nnui.computeCamera; true');
      }
      else if (sc === 'carstats') console.log('carstats', await evalJs('nnShots.carStats()'));
      else if (sc === 'smash') {
        const r = await evalJs('nnShots.smash()');
        fs.writeFileSync(path.join(out, 'smash.png'), Buffer.from(r.split(',')[1], 'base64'));
        console.log('smash sheet');
      }
      else if (sc === 'perf') {
        await evalJs("nnShots.start(); nnShots.road(1500, -1150, 17 * 60); nnShots.car('volga3110'); nnShots.pump(240); true");
        console.log('perf day', await evalJs('nnShots.perf(180)'));
        await evalJs("nnui.game.world.clock = 23 * 60; nnShots.pump(30); true");
        console.log('perf night', await evalJs('nnShots.perf(180)'));
      }
      else if (sc === 'drive') {
        await evalJs("(() => { nnShots.start(); nnShots.road(3000, -650, 16*60); const w = nnui.game.world, pl = w.player; w.spawnVehicle('vaz2107', pl.x + Math.sin(pl.yaw) * 4, pl.z - Math.cos(pl.yaw) * 4, pl.yaw, { color: '#7e1a22' }); nnui.el.focus(); return true; })()");
        const key = async (code, type) => send('Input.dispatchKeyEvent', { type, code, key: code.replace('Key', '').toLowerCase(), windowsVirtualKeyCode: code === 'KeyF' ? 70 : code === 'KeyW' ? 87 : code === 'KeyA' ? 65 : 0 });
        await key('KeyF', 'keyDown'); await evalJs('nnShots.pump(3)'); await key('KeyF', 'keyUp');
        await evalJs('nnShots.pump(60)');
        console.log('in car', await evalJs('!!nnui.game.world.player.veh'));
        await key('KeyW', 'keyDown'); await evalJs('nnShots.pump(180)');
        await key('KeyA', 'keyDown'); await evalJs('nnShots.pump(40)'); await key('KeyA', 'keyUp');
        await evalJs('nnShots.pump(40)');
        console.log('speed', await evalJs('nnui.game.world.player.veh && nnui.game.world.player.veh.spd.toFixed(1)'));
        await save('drive');
        await key('KeyW', 'keyUp');
      }
      else if (sc === 'interior') { await evalJs("(() => { nnShots.place('club_door', 0, 0, 0, 23*60); const pl = nnui.game.world.player, r = nnui.city.clubRoom; pl.x = r.x0 + 20; pl.z = r.z0 + 12; pl.y = 0.1; nnui.camYaw = Math.PI * 0.8; nnui.camPos = null; return true; })()"); await evalJs('nnShots.pump(60)'); await save('interior'); }
      else if (sc.startsWith('cut:')) {
        const [, id, ch] = sc.split(':');
        await evalJs(`nnShots.cutRun('${id}', ${+(ch || 0)})`);
        if (script) await evalJs(script);
        for (let n = 0; n < 80; n++) {
          const r = await evalJs('nnShots.cutAdvance()');
          if (r === 'end' || r.startsWith('timeout')) { console.log(id, r); break; }
          await save(id + '_' + r.split(' ')[1].replace(':', '_'));
        }
      }
      else if (sc === 'heap') { await send('HeapProfiler.enable', {}); await send('HeapProfiler.collectGarbage', {}); const h = await send('Runtime.getHeapUsage', {}); console.log('heap used', Math.round(h.result.usedSize / 1e6), 'MB of', Math.round(h.result.totalSize / 1e6), 'MB'); }
      else if (sc === 'mainmenu') { await evalJs('nnShots.pump(20)'); await page('mainmenu'); }
      else if (sc === 'pause') { await evalJs("nnui.pause('map'); nnShots.pump(2); true"); await page('pause_map'); await evalJs("nnui.menus.pause('stats'); true"); await page('pause_stats'); await evalJs("nnui.menus.pause('brief'); true"); await page('pause_brief'); await evalJs('nnui.resume(); true'); }
      else if (sc === 'mission') { await evalJs("nnui.newGame(); for (let i = 0; i < 20; i++) nnui.step(1/60); while (nnui.game.cut) { nnui.game.endCut(); nnui.step(1/60); } nnShots.pump(90); true"); await save('mission'); }
      else if (sc === 'clear') { await evalJs("nnShots.start(); nnShots.road(1500, -1150, 11*60); nnShots.weather('clear'); nnShots.look(-0.18)"); await evalJs('nnShots.pump(120)'); await save('clear'); }
      else if (sc === 'cloudy') { await evalJs("nnShots.start(); nnShots.road(1500, -1150, 15*60); nnShots.weather('cloudy'); nnShots.look(-0.12)"); await evalJs('nnShots.pump(120)'); await save('cloudy'); }
      else if (sc === 'rain') { await evalJs("nnShots.start(); nnShots.road(1500, -1150, 13*60); nnShots.weather('rain'); nnShots.look(0.2)"); await evalJs('nnShots.pump(180)'); await save('rain'); }
      else if (sc === 'rainnight') { await evalJs("nnShots.start(); nnShots.road(1500, -1150, 23*60); nnShots.weather('rain'); nnShots.car('volga3110'); nnShots.look(0.12)"); await evalJs('nnShots.pump(180)'); await save('rainnight'); }
      else if (sc === 'fog') { await evalJs("nnShots.start(); nnShots.road(1500, -1150, 7.5*60); nnShots.weather('fog'); nnShots.look(0.1)"); await evalJs('nnShots.pump(150)'); await save('fog'); }
      else if (sc === 'fognight') { await evalJs("nnShots.start(); nnShots.road(1500, -1150, 22.8*60); nnShots.weather('fog'); nnShots.car('vaz2107'); nnShots.look(0.1)"); await evalJs('nnShots.pump(150)'); await save('fognight'); }
      else if (sc === 'storm') { await evalJs("nnShots.start(); nnShots.place('colonel', -20, 30, Math.PI / 2 + 0.5, 21.6*60); nnShots.weather('rain'); nnShots.look(-0.05)"); await evalJs('nnShots.pump(90)'); await saveNow('storm', "nnui.game.world.wx.lightning(1800); nnui.game.world.wx.strike.a = nnui.camYaw + 0.15; nnShots.pump(2)"); }
      else if (sc === 'stars') { await evalJs("nnShots.start(); nnShots.place('colonel', -20, 30, 0, 0.5*60); nnShots.weather('clear'); nnui.camYaw = 0.72; nnui.game.world.player.yaw = 0.72; nnShots.look(-0.62)"); await evalJs('nnShots.pump(60)'); await save('stars'); }
      else if (sc === 'rainbow') { await evalJs("nnShots.start(); nnShots.place('colonel', -20, 30, 0, 19.4*60); const wx = nnui.game.world.wx; wx.set('clear', 'instant', true); wx.wet = 1; wx.puddle = 0.6; wx.afterRain = 10; wx.rainbow = 1; nnShots.antisun(); nnShots.look(-0.22)"); await evalJs('nnShots.pump(60)'); await save('rainbow'); }
      else if (sc === 'guns') { await evalJs("nnShots.start(); nnShots.road(1500, -1150, 21*60); nnShots.weather('clear'); nnShots.gun('ak'); nnShots.look(0.05); nnShots.pump(60); true"); await saveNow('guns', "nnui.game.world.player.yaw += Math.PI / 2; nnShots.fire(1); nnShots.pump(5); nnShots.fire(1); nnShots.pump(1)"); }
      else if (sc === 'shotgun') { await evalJs("nnShots.start(); nnShots.road(1500, -1150, 21.5*60); nnShots.weather('rain'); nnShots.gun('shotgun'); nnShots.look(0.05); nnShots.pump(60); true"); await saveNow('shotgun', "nnui.game.world.player.yaw -= Math.PI / 2.4; nnShots.fire(1, 0.08); nnShots.pump(2)"); }
      else if (sc === 'boom') { await evalJs("(() => { nnShots.start(); nnShots.road(1500, -1150, 16*60); nnShots.weather('clear'); const w = nnui.game.world, pl = w.player; w.god = true; nnShots.boomCar = w.spawnVehicle('vaz2106', pl.x + Math.sin(pl.yaw) * 14, pl.z - Math.cos(pl.yaw) * 14, pl.yaw + 1); nnShots.pump(30); return true; })()"); await saveNow('boom', "nnui.game.world.blowUp(nnShots.boomCar); nnShots.pump(5)"); await saveNow('boom2', "nnShots.pump(40)"); }
      else if (sc === 'enter') { await evalJs("(() => { nnShots.start(); nnShots.road(520, -420, 13*60); const w = nnui.game.world, pl = w.player; w.settings.ambient = false; w.spawnVehicle('vaz2106', pl.x + Math.cos(pl.yaw) * 3.5, pl.z + Math.sin(pl.yaw) * 3.5, pl.yaw, { color: '#7e1a22' }); w.tryEnter(pl); for (let i = 0; i < 200 && pl.enter && pl.enter.ph === 'go'; i++) nnui.step(1 / 60); nnShots.pump(22); nnui.camYaw = pl.yaw + 2.3; nnui.camPitch = 0.2; nnui.camPos = null; nnShots.pump(2); return true; })()"); await save('enter'); }
      else if (sc === 'drown') { await evalJs("(() => { nnShots.start(); nnShots.place('colonel', -20, 30, 0, 15*60); const w = nnui.game.world, pl = w.player, c = w.city, B = c.bankL; let best = null; for (let i = 0; i < B.length / 2 - 1 && !best; i++) { const x = (B[i*2] + B[i*2+2]) / 2, z = (B[i*2+1] + B[i*2+3]) / 2; let busy = false; c.hash.query(x - 14, z - 14, x + 14, z + 14, () => { busy = true; return true; }); if (c.inPlay(x, z) && !busy) best = { x, z, i }; } let nx = -(B[best.i*2+3] - B[best.i*2+1]), nz = B[best.i*2+2] - B[best.i*2]; const L = Math.hypot(nx, nz); nx /= L; nz /= L; if (!c.inWater(best.x + nx * 5, best.z + nz * 5)) { nx = -nx; nz = -nz; } pl.x = best.x + nx * 9; pl.z = best.z + nz * 9; pl.y = c.groundY(pl.x, pl.z); pl.yaw = Math.atan2(-nx, nz); nnShots.pump(80); nnui.camYaw = pl.yaw + 2.6; nnui.camPitch = 0.3; nnui.camPos = null; nnShots.pump(2); return true; })()"); await save('drown'); }
      else if (sc === 'peds') { await evalJs("(() => { nnShots.start(); nnShots.place('stadium', 0, 30, 0, 13*60); const w = nnui.game.world, s = w.city.places.stadium; w.settings.ambient = false; Object.keys(GtaNN.PED_KINDS).forEach((k, i) => { const q = GtaNN.placeAt(s, -10 + (i % 10) * 2.2, -6 + Math.floor(i / 10) * 4); const p = w.spawnPed(k, q[0], q[1], (s.rot || 0) + Math.PI); p.ai = { mode: 'idle' }; }); const pl = w.player, q = GtaNN.placeAt(s, 0, 4.5); pl.x = q[0]; pl.z = q[1]; pl.y = w.city.groundY(pl.x, pl.z); pl.yaw = (s.rot || 0); nnui.camYaw = pl.yaw; nnui.camPitch = 0.15; nnui.camMode = 2; nnui.camPos = null; nnShots.pump(30); return true; })()"); await save('peds'); await evalJs('nnui.camMode = 1; true'); }
      else if (sc === 'abilities') { await evalJs("nnShots.start(); nnShots.place('hotel_door', -6, 0, Math.PI/2+0.4, 14*60); nnui.debug.show(); nnui.debug.act('jump'); nnui.debug.act('fly'); nnui.keys.clear(); for (let i = 0; i < 90; i++) nnui.game.step(1/60, { rise: true }); nnui.game.world.player.x += 14; nnShots.pump(20); nnui.debug.refresh(); nnui.debug.el.querySelector('[data-k=moves]').closest('section').scrollIntoView(); true"); await page('abilities'); await evalJs("nnui.debug.act('fly'); nnui.debug.act('jump'); nnui.debug.close(); true"); }
      else if (sc === 'photo' || sc === 'photonight') {
        const night = sc === 'photonight';
        const jpg = (name, url) => { fs.writeFileSync(path.join(out, name + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); console.log(name, Math.round(url.length * 0.75 / 1024) + ' KB'); };
        await evalJs('nnShots.start(); true');
        await evalJs(PHOTO_SET);
        await evalJs(`nnPhoto.scene(${night ? 23.4 * 60 : 19.2 * 60}, 2)`);
        console.log('opened', await evalJs('nnPhoto.open()'));
        if (night) {
          jpg('photo_night_plain', await evalJs("nnPhoto.shot({ lens: 28, view: 'portrait', prefs: { film: 'life', frame: 'none', date: true, aspect: '43', stop: 4, focus: 0, flash: false, tyoma: true } })"));
          jpg('photo_night_flash', await evalJs("nnPhoto.shot({ lens: 28, view: 'portrait', prefs: { film: 'life', frame: 'none', date: true, aspect: '43', stop: 4, focus: 0, flash: true, tyoma: true } })"));
          jpg('photo_night_bokeh', await evalJs("nnPhoto.shot({ lens: 135, prefs: { film: 'gold', frame: 'none', date: false, aspect: '32', stop: 0, focus: 9, flash: false, tyoma: true } })"));
        } else {
          await evalJs("nnPhoto.set({ lens: 21, prefs: { film: 'gold', frame: 'print', date: true, aspect: '32', stop: 4, focus: 0, flash: false, tyoma: true } }); nnPhoto.wide(); nnShots.pump(4); true");
          console.log('seen from the square:', await evalJs('nnPhoto.seen()'));
          await page('photo_ui');
          for (const [name, o] of PHOTO_SHOTS) jpg('photo_' + name, await evalJs(`nnPhoto.shot(${JSON.stringify(o)})`));
          await evalJs("(() => { nnPhoto.set({ lens: 21, prefs: { film: 'gold', frame: 'none', date: true, aspect: 'screen', stop: 4, focus: 0, flash: false, tyoma: true } }); nnPhoto.wide(); const r = nnui.photo.shoot(); nnShots.pump(20); return !!r; })()");
          await page('photo_after_shot');
          await evalJs("nnui.photo.close(); nnui.pause('album'); nnShots.pump(2); true");
          await page('photo_album');
          await evalJs('nnui.resume(); nnShots.pump(4); nnui.el.focus(); true');
          const VK = { F8: 119, KeyW: 87, Enter: 13, Escape: 27, KeyH: 72, ArrowDown: 40, ArrowRight: 39 };
          const press = async (code, hold) => {
            await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: code === 'Enter' || code === 'Escape' || code === 'F8' || code.startsWith('Arrow') ? code : code.slice(3).toLowerCase(), windowsVirtualKeyCode: VK[code] || 0 });
            await evalJs(`nnShots.pump(${hold || 2})`);
            await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: code === 'Enter' || code === 'Escape' || code === 'F8' || code.startsWith('Arrow') ? code : code.slice(3).toLowerCase(), windowsVirtualKeyCode: VK[code] || 0 });
          };
          await press('F8');
          const before = JSON.parse(await evalJs('JSON.stringify({ on: nnui.photo.on, x: nnui.photo.c.x, z: nnui.photo.c.z, n: GtaNN.PhotoAlbum.count(), t: nnui.game.world.t })'));
          await press('KeyW', 40);
          await press('ArrowDown');
          await press('ArrowRight');
          await press('Enter');
          const after = JSON.parse(await evalJs('JSON.stringify({ on: nnui.photo.on, x: nnui.photo.c.x, z: nnui.photo.c.z, n: GtaNN.PhotoAlbum.count(), t: nnui.game.world.t, roll: nnui.photo.c.roll })'));
          await press('Escape');
          const closed = await evalJs('!nnui.photo.on && !document.querySelector(".nn-photo")');
          console.log('keys: F8 opens', before.on, '· W moves', Math.hypot(after.x - before.x, after.z - before.z).toFixed(2), 'm · arrows set roll', after.roll.toFixed(3), '· Enter shoots', before.n, '->', after.n, '· world still', before.t === after.t, '· Esc closes', closed);
        }
      }
      else if (sc === 'failmenu') {
        await evalJs("(() => { nnShots.missionTo('m3', r => r.cp && r.cp.id === 'zarya' && r.i > r.cp.i); const g = nnui.game; g.mission.fail('Главный ушёл.'); nnShots.pump(150); nnui.askFail(); return true; })()");
        await page('failmenu');
        await evalJs("nnui.menus.key({ code: 'Enter', preventDefault() {} }); nnShots.pump(90); true");
        await save('failmenu_retry');
      }
      else if (sc === 'faildead') {
        await evalJs("(() => { nnShots.missionTo('m3', r => r.cp && r.cp.id === 'zarya' && r.i > r.cp.i); const g = nnui.game; g.world.damagePed(g.world.player, 999, null, 'bullet'); nnShots.pump(60 * 4); if (g.failReq) nnui.askFail(); return true; })()");
        await page('faildead');
        await evalJs("nnui.menus.sel = 2; nnui.menus.highlight(); nnui.menus.choose(); nnShots.pump(120); true");
        await save('faildead_hospital');
      }
      else if (sc === 'cargo') {
        await evalJs("(() => { nnShots.missionTo('m3', r => r.cur && r.cur.type === 'goto' && r.cur.veh === 'van'); nnShots.pump(30); return true; })()");
        await save('cargo');
      }
      else if (sc === 'tail') {
        await evalJs("(() => { nnShots.missionTo('m4', r => r.cur && r.cur.type === 'tail'); const g = nnui.game, w = g.world, pl = w.player, v = g.mission.get('volga'); const sp = w.spawnVehicle('vaz2107', v.x - Math.sin(v.yaw) * 40, v.z + Math.cos(v.yaw) * 40, v.yaw); w.seat(pl, sp, true); g.mission.stepVars.sus = 0.55; nnShots.pump(120); nnui.camYaw = sp.yaw; nnui.camPos = null; nnShots.pump(20); return true; })()");
        await save('tail');
      }
      else if (sc === 'radio') {
        await evalJs("(() => { nnShots.missionTo('m6', r => r.cur && r.cur.type === 'kill'); const g = nnui.game; g.say('colonel', 'Подъехали. Две машины, четверо. Гена — в белой куртке.', { via: 'radio' }); nnShots.pump(40); return true; })()");
        await save('radio');
      }
      else if (sc === 'debugmissions') {
        await evalJs("nnShots.start(); nnShots.place('hotel_door', -6, 0, Math.PI/2+0.4, 14*60); nnui.debug.act('mission', 'm4'); nnShots.pump(20); if (nnui.game.cut) nnui.game.endCut(); nnShots.pump(5); nnui.debug.show(); nnShots.pump(10); nnui.debug.el.querySelector('[data-k=mission]').closest('section').scrollIntoView(); true");
        await page('debugmissions');
        await evalJs('nnui.debug.close(); true');
      }
      else if (sc === 'debug') { await evalJs("nnShots.start(); nnShots.place('hotel_door', -6, 0, Math.PI/2+0.4, 14*60); nnui.debug.show(); nnShots.pump(20); true"); await page('debug'); await evalJs('nnui.debug.close(); true'); }
      else if (sc === 'script' && script) {
        const r = await evalJs(script);
        if (typeof r === 'string' && r.startsWith('data:image/png')) { fs.writeFileSync(path.join(out, 'script.png'), Buffer.from(r.split(',')[1], 'base64')); console.log('script sheet'); }
        else { console.log(r); await save('script'); }
      }
      else if (sc === 'carbench') { const r = JSON.parse(await evalJs('nnShots.benchCars(240)')); for (const [k, v] of Object.entries(r)) console.log('carbench', k.padEnd(12), JSON.stringify(v)); }
      else if (sc === 'cpu' && script) {
        await evalJs(script);
        await send('Profiler.enable', {});
        await send('Profiler.setSamplingInterval', { interval: 100 });
        await send('Profiler.start', {});
        await evalJs('(() => { for (let i = 0; i < 300; i++) nnui.render(1 / 60); return true; })()');
        const prof = (await send('Profiler.stop', {})).result.profile;
        const total = (prof.endTime - prof.startTime) / 1000, hits = prof.nodes.reduce((a, n) => a + (n.hitCount || 0), 0) || 1, self = new Map();
        for (const n of prof.nodes) {
          const f = n.callFrame, key = (f.functionName || '(anonymous)') + ' ' + path.basename(f.url || '') + ':' + (f.lineNumber + 1);
          self.set(key, (self.get(key) || 0) + (n.hitCount || 0));
        }
        console.log('cpu per frame', (total / 300).toFixed(2), 'ms');
        for (const [k, h] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(((h / hits) * total / 300).toFixed(3).padStart(7), 'ms', k);
      }
      console.log(sc, (Date.now() - t0) + ' ms');
    }
    if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 20).join('\n'));
    else console.log('no errors');
  } finally { cleanup(); }
}

main().catch(e => { console.error(e); process.exit(1); });
