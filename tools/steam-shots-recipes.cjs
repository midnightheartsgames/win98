const desktopGame = (app, windowId, width, height, extraSetup = []) => ({
  page: 'index.html',
  frame: false,
  timeout: 60000,
  el: '#shot-target',
  ready: `!!(window.winManager && window.${app})`,
  setup: [`await __shots.sleep(13000);
    ${app}.open(); await __shots.sleep(500);
    const win = winManager.windows.get('${windowId}');
    Object.assign(win.element.style, { left: '20px', top: '20px', width: '${width}px', height: '${height}px' });
    window.dispatchEvent(new Event('resize'));
    win.bodyElement.id = 'shot-target';
    await __shots.sleep(1500);`, ...extraSetup]
});

const samMaxEpisode = (page, ui, rooms) => ({
  page,
  ready: `!!window.${ui}`,
  size: [640, 480],
  el: '.smx-cv',
  setup: [`${ui}.resize = () => { ${ui}.cv.style.width = '640px'; ${ui}.cv.style.height = '480px'; }; ${ui}.resize(); ${ui}.newGame(); await __shots.sleep(600);
    const g = ${ui}.g; g.killTasks(); g.fade = 0; g.fadeTo = 0; g.closeup = null; g.speech = [];`],
  shots: rooms.map(([room, x, y, flags]) => ({ steps: [`Object.assign(${ui}.g.f, ${JSON.stringify(flags || {})}); ${ui}.g.setRoom('${room}', { x: ${x}, y: ${y}, dir: 's' }); await __shots.sleep(2600);`] }))
});

module.exports = {
  doom: {
    page: 'doom.html',
    ready: 'typeof ui !== "undefined" && !!ui.renderer',
    el: '.dm98-stage',
    setup: ['ui.hintEl.style.display = "none";'],
    shots: [
      { steps: ['ui.newGame(2, "E1M1"); await __shots.sleep(1200);'] },
      { steps: ['ui.newGame(2, "E1M3"); await __shots.sleep(1200);'] }
    ]
  },
  serioussam: {
    page: 'serious-sam.html',
    ready: '!!window.ssui && !!ssui.renderer',
    setup: [`window.ssHorde = async (level, weapon, list, wait) => {
      ssui.startLevel(level, 1, null);
      await __shots.until(() => ssui.state === 'play');
      ssui.locked = () => true;
      const g = ssui.game, p = g.player;
      p.hp = 100; p.weapons.add(weapon); p.ammo.bullets = 500; p.ammo.shells = 100; p.cur = weapon;
      const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
      for (const [type] of list) g.seen.add(type);
      for (const [type, side, dist] of list) {
        const [x, z] = g.findStandSpot(p.x + fx * dist + fz * side, p.z + fz * dist - fx * side, 2, 1);
        g.spawnEnemy(type, x, z, null);
      }
      await __shots.sleep(wait);
      ssui.mouse.fire = true;
      await __shots.sleep(350);
      ssui.netQueue = []; ssui.netricsa = null; ssui.toasts = []; ssui.popup = null;
      await __shots.sleep(120);
    };`],
    shots: [
      { steps: ['await ssHorde(1, "tommy", [["werebull", -3, 17], ["werebull", 4, 21], ["kamikaze", -1, 11], ["kamikaze", 2, 12], ["kamikaze", -4, 14], ["kamikaze", 5, 15]], 700);'] },
      { steps: ['await ssHorde(3, "minigun", [["gnaar", -2, 10], ["kleer", 3, 12], ["kleer", -5, 15], ["harpy", 1, 11], ["harpy", -2, 13], ["rocketeer", 6, 17]], 900);'] }
    ]
  },
  stalker98_demo: {
    page: 'stalker98.html',
    ready: '!!window.stui && !!stui.renderer',
    setup: [`window.stPlace = (x, z, tx, tz, pitch, hour) => {
      const g = stui.game, p = g.player;
      p.x = x; p.z = z; p.y = g.W.groundAt(x, z, 0.3); p.vx = p.vy = p.vz = 0;
      p.yaw = Math.atan2(tx - x, tz - z); p.pitch = pitch || 0;
      if (hour != null) g.time = Math.floor(g.time / 86400) * 86400 + hour * 3600;
      stui.prevPos = null; stui.camY = null;
    };
    window.stClean = () => { if (stui.W && stui.W.close) stui.W.close(); stui.toasts = []; stui.newsQ = []; stui.newsCur = null; stui.subs = []; };`],
    shots: [
      { steps: ['stui.locked = () => true; stui.pendingSkill = 1; stui.startNewGame(); await __shots.until(() => stui.state === "play"); stClean(); stPlace(-59.5, -202.5, -64, -198, -0.1, 21); await __shots.sleep(1800); stClean(); await __shots.sleep(200);'] },
      { steps: ['stui.game = new Stalker98.Game({ level: "garbage", skill: 1, seed: 11, lang: "ru" }); stui.enterGame(true); stClean(); stPlace(-70, -56, -90, -38, 0.0, 16.5); await __shots.sleep(1800); stClean(); await __shots.sleep(200);'] }
    ]
  },
  moh98: {
    page: 'moh98.html',
    ready: '!!window.mhui && !!mhui.renderer',
    setup: [`window.mhPlace = (x, z, tx, tz, pitch) => {
      const g = mhui.game, p = g.player;
      p.x = x; p.z = z; p.y = g.W.groundAt(x, z, 0.3); p.vx = p.vy = p.vz = 0;
      p.yaw = Math.atan2(tx - x, tz - z); p.pitch = pitch || 0;
      mhui.prevPos = null; mhui.camY = null;
    };
    window.mhStart = async i => { mhui.locked = () => true; mhui.startMission(i, 1); await __shots.until(() => mhui.state === 'play'); mhui.game.god = true; };
    window.mhClean = () => { mhui.msgs = []; mhui.subs = []; };`],
    shots: [
      { steps: ['await mhStart(0); mhPlace(-2, -92, -3, -67, 0.02); await __shots.sleep(1500); mhClean(); await __shots.sleep(200);'] },
      { steps: ['await mhStart(5); await __shots.sleep(1500); mhClean(); await __shots.sleep(200);'] }
    ]
  },
  cop98: {
    page: 'cop98.html',
    ready: '!!(window.cpui && cpui.mode === "menu")',
    setup: [`window.cpPlace = (x, y, tx, ty, pitch, minutes) => {
      const g = cpui.game, p = g.player;
      p.x = x; p.y = y; p.z = g.W.groundAt(x, y, g.T.heightAt(x, y) + 0.4).h; p.vx = p.vy = p.vz = 0;
      p.yaw = Math.atan2(ty - y, tx - x); p.pitch = pitch || 0;
      if (minutes != null) g.time = Math.floor(g.time / 1440) * 1440 + minutes;
    };
    window.cpClean = () => { cpui.msgs = []; cpui.newsPop = null; };`],
    shots: [
      { steps: ['cpui.newGame(1); await __shots.until(() => cpui.game); await __shots.sleep(300); cpui.closePanel(); cpui.mode = "play"; cpPlace(234, 214, 166, 246, 0.02, 12 * 60 + 20); const g = cpui.game; g.spawnAnomalies("electra", 1); g.spawnCreatures("bloodsucker", 1); g.spawnCreatures("dog", 2); await __shots.sleep(700); cpClean(); await __shots.sleep(300);'] },
      { steps: ['cpPlace(813, 777, 862, 724, 0.02, 18 * 60 + 40); await __shots.sleep(2200); cpClean(); await __shots.sleep(300);'] }
    ]
  },
  mc98_demo: {
    page: 'mc98.html',
    ready: '!!window.mcui',
    setup: [`window.mcSpawn = list => {
      const g = mcui.game, p = g.player, fx = -Math.sin(mcui.yaw), fz = -Math.cos(mcui.yaw);
      for (const [type, side, dist] of list) {
        const x = p.x + fx * dist + fz * side, z = p.z + fz * dist - fx * side;
        const y = g.world.topSolid(Math.floor(x), Math.floor(z)) + 1;
        g.entities.push(new Mc98.Mob(type, x, y, z));
      }
    };`],
    shots: [
      { steps: ['mcui.createWorld("Steam", "42", "survival", 2); await __shots.until(() => mcui.mode === "play", 30000); mcui.pitch = -0.12; mcSpawn([["pig", -2, 6], ["cow", 3, 9], ["sheep", -4, 11], ["chicken", 1, 5]]); await __shots.sleep(2200); mcui.messages = []; mcui.toasts = []; await __shots.sleep(200);'] },
      { steps: ['mcui.game.time = 12600; mcui.yaw += 2.4; mcui.pitch = -0.08; mcSpawn([["creeper", -1, 5], ["zombie", 2, 7], ["skeleton", -3, 9]]); await __shots.sleep(1800); mcui.messages = []; mcui.toasts = []; await __shots.sleep(200);'] }
    ]
  },
  hl2_demo: {
    page: 'hl2.html',
    ready: '!!window.hlui',
    setup: [`window.hlClean = () => { const h = hlui.hud; h.subs = []; h.hints = []; h.title = null; h.notice = null; h.fade = null; h.flash = null; };
    window.hlStart = async i => { hlui.startChapter(i, 1); await __shots.until(() => hlui.mode === 'play', 40000); await __shots.sleep(2500); hlClean(); await __shots.sleep(300); };`],
    shots: [
      { steps: ['await hlStart(6);'] },
      { steps: ['await hlStart(10);'] }
    ]
  },
  quake3: {
    page: 'quake3.html',
    ready: '!!window.q3ui && !!q3ui.menu',
    setup: [`window.q3Action = async (map, bots) => {
      const Q = window.Quake3;
      q3ui.startMatch({ map, bots, warmup: 0 });
      await __shots.until(() => q3ui.mode === 'play' && q3ui.game && q3ui.game.local, 60000);
      const g = q3ui.game, me = g.local;
      g.cheat('god'); g.cheat('give all');
      await __shots.sleep(1500);
      g.selectWeapon(me, Q.WP.ROCKET);
      let aimed = false;
      for (let k = 0; k < 60 && !aimed; k++) {
        const bots = g.players.filter(p => p !== me && p.health > 0 && p.ps && p.ps.onGround);
        for (const bot of bots) {
          const t = bot.ps.origin;
          for (let i = 0; i < 16 && !aimed; i++) {
            const ang = i / 16 * Math.PI * 2, dist = 230;
            const pos = [t[0] + Math.cos(ang) * dist, t[1] + Math.sin(ang) * dist, t[2] + 4];
            const clear = g.world.trace([t[0], t[1], t[2] + 8], pos, Q.PLAYER_MINS, Q.PLAYER_MAXS, Q.MASK_PLAYER).fraction >= 0.999;
            const floor = g.world.trace(pos, [pos[0], pos[1], pos[2] - 40], Q.PLAYER_MINS, Q.PLAYER_MAXS, Q.MASK_PLAYER).fraction < 1;
            if (!clear || !floor) continue;
            me.ps.origin = pos; me.ps.velocity = [0, 0, 0];
            aimed = bot;
          }
          if (aimed) break;
        }
        if (!aimed) await __shots.sleep(250);
      }
      q3ui.keys.attack = true;
      for (let k = 0; k < 9; k++) {
        if (aimed) { const o = me.ps.origin, t = aimed.ps.origin; q3ui.yaw = Math.atan2(t[1] - o[1], t[0] - o[0]); q3ui.pitch = 0.04; }
        await __shots.sleep(50);
      }
      q3ui.keys.attack = false;
    };`],
    shots: [
      { steps: ['await q3Action("q3dm6", [{ bot: "sarge", skill: 3 }, { bot: "mynx", skill: 3 }, { bot: "grunt", skill: 3 }, { bot: "hunter", skill: 3 }]);'] },
      { steps: ['await q3Action("q3dm1", [{ bot: "orbb", skill: 3 }, { bot: "daemia", skill: 3 }, { bot: "bitterman", skill: 3 }]);'] }
    ]
  },
  tekken98_demo: {
    page: 'tekken3.html',
    ready: '!!window.tkui && !!window.Tk3 && !!Tk3.FIGHTER',
    setup: [`window.tkFight = async (stage, a, b, wait) => {
      tkui.go('fight', { mode: 'vs', stage, p: [{ def: Tk3.FIGHTER[a], human: false, level: 3 }, { def: Tk3.FIGHTER[b], human: false, level: 3 }], onEnd() { } });
      await __shots.sleep(wait);
    };`],
    shots: [
      { steps: ['await tkFight("seoul", "kenta", "irina", 6500);'] },
      { steps: ['await tkFight("temple", "ray", "volkov", 7200);'] }
    ]
  },
  dmc98_demo: {
    page: 'dmc98.html',
    ready: '!!window.dmui && !!dmui.renderer',
    setup: [`window.dmFight = async (mi, foes, wait) => {
      dmui.locked = () => true; dmui.options.tips = false;
      dmui.startMission(mi, dmui.data.diff);
      await __shots.until(() => dmui.state === 'play' && dmui.game);
      const g = dmui.game;
      if (g.cut) g.endCut();
      await __shots.sleep(300);
      if (g.cut) g.endCut();
      const p = g.player, fx = Math.sin(p.face), fz = Math.cos(p.face);
      for (const [type, side, dist] of foes) Dmc98.spawnFoe(g, type, p.x + fx * dist + fz * side, p.z + fz * dist - fx * side, { instant: true });
      dmui.cards = []; dmui.popups = []; g.msgs = [];
      await __shots.sleep(wait);
      dmui.cards = []; dmui.popups = []; g.msgs = [];
    };`],
    shots: [
      { steps: ['await dmFight(0, [["dante", 0, 5]], 1400);'] },
      { steps: ['await dmFight(2, [["frost", -2, 5], ["frost", 2, 6], ["assault", 0, 8]], 1600);'] }
    ]
  },
  sammax: samMaxEpisode('sammax.html', 'smxui', [['office', 150, 166], ['homegate', 150, 168]]),
  sammax102: samMaxEpisode('sammax102.html', 'smx2', [['quiz', 150, 168], ['sitcom', 150, 170]]),
  sammax103: samMaxEpisode('sammax103.html', 'smx3', [['casino', 150, 168], ['playland', 150, 170]]),
  sammax104: samMaxEpisode('sammax104.html', 'smx4', [
    ['lawn', 488, 190, { caseOpen: true, presMet: true, whizzerIn: true, chucklesOut: true, puppetDown: true, election: true, maxRuns: true }],
    ['oval', 236, 182, { chucklesOut: false, puppetDown: false, election: false, maxRuns: false }]
  ]),
  sammax105: samMaxEpisode('sammax105.html', 'smx5', [
    ['street2', 176, 152, { caseOpen: true, sybilFree: true, cannonTaken: true, gogglesFixed: true, vr: true, controlSeen: true, car: 'скф' }],
    ['control', 120, 178, { bugOn: 'bluster', popOff: true }]
  ]),
  sammax106: (() => {
    const recipe = samMaxEpisode('sammax106.html', 'smx6', [
      ['moon', 330, 162, { caseOpen: true, moonSeen: true, uniGot: true }],
      ['sanctum', 150, 172, { blisterOpen: true, doorSeen: true, doorOpen: true, beam: true, maxSplit: true, redDone: true, greenDone: true, blueDone: true, maxWhole: true }]
    ]);
    recipe.shots[1].steps.push(`smx6.g.vt.fight = { started: true, trap: 1, bound: true, hughIn: false, lander: '', cycle: 1 }; smx6.g.inv = ['max', 'gun', 'spoon']; SamMax.EP106.sanctum.stage(smx6.g); await __shots.sleep(1400);`);
    return recipe;
  })(),
  sammax201: samMaxEpisode('sammax201.html', 'smx21', [
    ['street', 312, 158, { introDone: true, flintHole: true }],
    ['workshop', 262, 172, { introDone: true, robotDown: true, labelRead: true, poleSeen: true }]
  ]),
  sammax202_demo: samMaxEpisode('sammax202.html', 'smx22', [
    ['beach', 250, 160, { introDone: true, beachVisited: true }],
    ['volcano', 160, 166, { introDone: true, volcanoReady: true }]
  ]),
  bttf: {
    page: 'bttf.html',
    ready: '!!window.btui',
    size: [640, 480],
    el: '.btf-cv',
    setup: [`btui.resize = () => { btui.cv.style.width = '640px'; btui.cv.style.height = '480px'; }; btui.resize(); btui.newGame(); await __shots.sleep(600);
      window.btShot = (room, x, y, setup) => { const g = btui.g, E = BTTF.EP1; g.killTasks(); g.drive = null; g.mode = 'room'; g.dialog = null; setup(g, E); g.setRoom(room, { x, y, dir: 's' }); g.killTasks(); E.dress(g); g.fade = 0; g.fadeTo = 0; g.speech = []; g.mx = -40; g.my = -40; };`],
    shots: [
      { steps: [`btShot('lab', 300, 420, (g, E) => { g.f.introDone = true; g.f.nightmare = true; E.setChapter(g, 1); g.place('george', 'lab', 236, 352, 's'); g.place('biff', 'lab', 470, 380, 'w'); }); await __shots.sleep(1500);`] },
      { steps: [`btShot('square', 1240, 420, (g, E) => { E.setChapter(g, 4); Object.assign(g.f, { dressed: true, arrived: true, alias: 1, emmettMet: true }); g.place('edna', 'square', 1180, 390, 'w'); g.place('kid', 'square', 1480, 404, 's'); g.place('matches', 'square', 1522, 408, 'w'); g.place('einstein', 'square', 1300, 410, 'w'); g.place('emmett', 'square', 995, 360, 's'); }); await __shots.sleep(1500);`] }
    ]
  },
  dota: {
    page: 'dota.html',
    ready: '!!window.dotaui && dotaui.screen',
    setup: [`window.mobaHot = (g, list, r) => {
      const xs = g.units.map(u => u.x), ys = g.units.map(u => u.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const inner = h => h.x > x0 + (x1 - x0) * 0.25 && h.x < x1 - (x1 - x0) * 0.25 && h.y > y0 + (y1 - y0) * 0.25 && h.y < y1 - (y1 - y0) * 0.25;
      let best = null, bestN = -1;
      for (const h of list.filter(h => !h.dead && inner(h))) {
        const n = g.units.filter(u => !u.dead && u.team !== h.team && u.team !== 2 && Math.hypot(u.x - h.x, u.y - h.y) < r).length;
        if (n > bestN) { bestN = n; best = h; }
      }
      return best;
    };
    window.dotaMatch = async ticks => {
      dotaui.sel.mode = 2; dotaui.startPick();
      const heroes = ['sven', 'lina', 'pudge', 'crystal_maiden', 'juggernaut', 'axe', 'lion', 'sniper', 'enigma', 'techies'];
      dotaui.pickSlots.forEach((s, i) => { s.hero = heroes[i]; s.shown = true; });
      dotaui.startLoading();
      await __shots.until(() => dotaui.screen === 'game' && dotaui.g, 60000);
      const g = dotaui.g;
      for (let i = 0; i < ticks; i++) { g.tick(); dotaui.processEvents(g); }
      const h = mobaHot(g, g.heroes, 700);
      if (h) { dotaui.R.centerOn(h.x, h.y); dotaui.followUnit = h; }
      dotaui.chat = []; dotaui.msg = null; dotaui.mx = -900; dotaui.my = -900;
      await __shots.sleep(1500);
    };`],
    shots: [
      { steps: ['await dotaMatch(5400);'] },
      { steps: ['const g = dotaui.g; for (let i = 0; i < 5400; i++) { g.tick(); dotaui.processEvents(g); } const h = mobaHot(g, g.heroes, 700); if (h) { dotaui.R.centerOn(h.x, h.y); dotaui.followUnit = h; } dotaui.chat = []; dotaui.mx = -900; dotaui.my = -900; await __shots.sleep(1500);'] }
    ]
  },
  lol: {
    page: 'lol.html',
    ready: '!!window.lolui && lolui.screen',
    setup: [`window.lolHot = () => {
      const g = lolui.g;
      let best = null, bestN = -1;
      for (const h of g.champs.filter(h => !h.dead)) {
        const n = g.units.filter(u => !u.dead && u.team !== h.team && Math.hypot(u.x - h.x, u.y - h.y) < 600).length;
        if (n > bestN) { bestN = n; best = h; }
      }
      if (best) { lolui.R.centerOn(best.x, best.y); lolui.camLocked = false; }
    };
    window.lolMatch = async ticks => {
      lolui.startLoading(true);
      await __shots.until(() => lolui.screen === 'game', 90000);
      const g = lolui.g;
      for (let i = 0; i < ticks; i++) { g.tick(); lolui.processEvents(g); }
      lolHot(); lolui.chat = [];
      await __shots.sleep(1500);
    };`],
    shots: [
      { steps: ['await lolMatch(5400);'] },
      { steps: ['const g = lolui.g; for (let i = 0; i < 5400; i++) { g.tick(); lolui.processEvents(g); } lolHot(); lolui.chat = []; await __shots.sleep(1500);'] }
    ]
  },
  ow98: {
    page: 'ow98.html',
    ready: '!!window.owui',
    setup: [`window.owAction = async (map, hero, seconds) => {
      owui.startMatch({ map, hero, assemble: 0, setup: 0 });
      await __shots.until(() => owui.mode === 'match' && owui.game && owui.game.player && owui.game.player.alive, 60000);
      const g = owui.game, p = g.player;
      for (let i = 0; i < seconds * 60; i++) { g.step(owui.input()); owui.processQuiet(g); }
      let pair = null, best = 1e9;
      for (const a of g.heroes) {
        if (!a.alive || a === p || a.team !== p.team) continue;
        for (const e of g.heroes) {
          if (!e.alive || e.team === p.team) continue;
          const d = Math.hypot(a.x - e.x, a.z - e.z);
          if (d < best && d > 5) { best = d; pair = [a, e]; }
        }
      }
      if (pair) {
        const [a, e] = pair, dx = e.x - a.x, dz = e.z - a.z, l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
        const clear = (x0, z0, x1, z1) => { const d = Math.hypot(x1 - x0, z1 - z0); const r = g.world.raycast(x0, a.y + 1.5, z0, (x1 - x0) / d, 0, (z1 - z0) / d, d); return !r || (r.t !== undefined ? r.t >= d - 0.5 : false); };
        let spot = null;
        for (const back of [4, 6, 3, 8, 2]) for (const side of [0, 2, -2, 3.5, -3.5]) {
          if (spot) break;
          const x = a.x - ux * back - uz * side, z = a.z - uz * back + ux * side;
          if (clear(a.x, a.z, x, z) && clear(x, z, e.x, e.z)) spot = [x, z];
        }
        if (!spot) spot = [a.x - ux * 1.5, a.z - uz * 1.5];
        p.x = spot[0]; p.z = spot[1]; p.y = a.y; p.vx = p.vy = p.vz = 0;
        owui.yaw = Math.atan2(e.x - p.x, e.z - p.z); owui.pitch = -0.04;
      }
      owui.hud.chat = []; owui.hud.notices = []; owui.hud.announce = null;
      await __shots.sleep(900);
      owui.hud.chat = []; owui.hud.notices = [];
    };`],
    shots: [
      { steps: ['await owAction("hanamura", "soldier", 28);'] },
      { steps: ['owui.leaveMatch(); await __shots.sleep(800); Ow98.Screens.show(owui, "hero", { hero: "tracer" }); await __shots.sleep(2500);'] }
    ]
  },
  forza: {
    page: 'forza.html',
    ready: '!!window.fzui && fzui.mode === "title"',
    timeout: 90000,
    setup: [`const prof = Forza.Profile.newProfile(); prof.prologue = true; fzui.startGame(prof, false); await __shots.sleep(500);
    window.fzClean = () => { fzui.hud.banners = []; fzui.hud.toasts = []; fzui.hud.big = null; fzui.locT = 0; };`],
    shots: [
      { steps: ['const g = fzui.game; g.clock = 16.5; g.setWeather("clear", true); fzui.beginEvent("vecriga"); fzui.camMode = "chase"; fzui.keys = {}; await __shots.sleep(4200); fzui.keys = { up: true }; await __shots.sleep(2600); fzClean(); await __shots.sleep(150);'] },
      { steps: ['const g = fzui.game; fzui.keys = {}; if (g.race) g.abandonEvent(); const h = Forza.MAP.HUB; g.clock = 19.4; g.setWeather("clear", true); g.veh.place(h.x, h.z, h.yaw, fzui.world); fzui.camPos = null; fzui.camMode = "chase"; fzui.keys = { up: true }; await __shots.sleep(2600); fzui.keys = {}; fzClean(); await __shots.sleep(200);'] }
    ]
  },
  gtann: {
    page: 'gtann.html',
    ready: '!!window.nnui && nnui.state === "menu"',
    timeout: 90000,
    setup: [`window.nnPump = n => { for (let i = 0; i < n; i++) nnui.step(1 / 60); };
    window.nnPlace = (id, dx, dz, yaw, clock) => {
      const g = nnui.game, w = g.world, p = w.city.places[id] || { x: id[0], z: id[1] };
      if (g.mission) g.mission.fail('shots');
      if (g.cut) g.endCut();
      g.msg.big = null; g.msg.title = null; g.subs = [];
      g.teleport(typeof id === 'string' ? id : 'hotel_door', 0, 0);
      w.player.x = p.x + (dx || 0); w.player.z = p.z + (dz || 0); w.player.y = w.city.groundY(w.player.x, w.player.z);
      w.player.yaw = yaw || 0;
      nnui.camYaw = yaw || 0; nnui.camPitch = 0.18; nnui.camPos = null;
      if (clock !== undefined) w.clock = clock;
    };
    nnui.newGame(); nnPump(20); if (nnui.game.mission) nnui.game.mission.fail('shots'); if (nnui.game.cut) nnui.game.endCut(); nnui.demo = false; nnui.state = 'play'; nnui.menus.close();`],
    shots: [
      { steps: ['const w = nnui.game.world, nl = w.city.nearestLane(520, -420, 200, l => l.ambient); nnPlace([nl.x, nl.z], 0, 0, GtaNN.yawOf(nl.dx, nl.dz), 17 * 60); const pl = w.player; const v = w.spawnVehicle("volga3110", pl.x, pl.z, pl.yaw, {}); w.seat(pl, v, true); nnui.camPos = null; nnPump(200); nnui.game.msg.big = null; nnui.game.msg.title = null; await __shots.sleep(400);'] },
      { steps: ['const w = nnui.game.world, pl = w.player; if (pl.veh) w.exitVehicle(pl); nnPlace("ferris", 20, 30, -0.6, 15 * 60); nnPump(200); await __shots.sleep(400);'] }
    ]
  },
  maxpayne_demo: {
    page: 'maxpayne.html',
    ready: '!!window.mpui',
    setup: ['MaxPayne.fastFrames = true;'],
    shots: [
      { steps: ['window.mpLevel = mpui.startLevel("bogart"); await __shots.until(() => mpui.novel && mpui.novel.page, 20000); await __shots.sleep(900); mpui.novel.page.t = 1; mpui.novel.key("next"); await __shots.sleep(1800); const pg = mpui.novel.page; for (let i = 0; i < 12 && pg === mpui.novel.page && pg.panel < pg.page.panels.length - 1; i++) { pg.t = 1; mpui.novel.key("next"); await __shots.sleep(500); } await __shots.sleep(1200);'] },
      { steps: ['for (let i = 0; i < 40 && mpui.mode !== "play"; i++) { if (mpui.novel.page) mpui.novel.page.t = 1; mpui.novel.key("next"); await __shots.sleep(250); } await mpLevel; mpui.mode = "play"; await __shots.sleep(2500);'] }
    ]
  },
  xiii_demo: {
    page: 'xiii.html',
    ready: '!!(window.x13ui && x13ui.menu)',
    setup: ['window.x13Go = async id => { x13ui.startLevel(id, {}); await __shots.until(() => x13ui.mode === "play" && x13ui.game, 40000); x13ui.lock = () => {}; await __shots.sleep(2500); x13ui.hud.notes = []; x13ui.hud.msgs = []; await __shots.sleep(150); };'],
    shots: [
      { steps: ['await x13Go("bank");'] },
      { steps: ['await x13Go("lake");'] }
    ]
  },
  kotor98_demo: {
    page: 'kotor98.html',
    ready: '!!(window.ktui && ktui.screen === "title")',
    setup: [`ktui.settings.game.autoPause = false; ktui.startNewGame({ cls: 'soldier' }); await __shots.sleep(300); ktui.closeSub(); ktui.enterGame();
    window.ktGo = async (area, cam, fight) => {
      const g = ktui.game;
      if (g.dialog) g.closeDialog(true);
      g.mode = 'play'; g.paused = false; g.travel(area); g.doTravel(); await __shots.sleep(1200);
      if (g.dialog) g.closeDialog(true);
      g.mode = 'play'; ktui.layer.innerHTML = '';
      if (fight) {
        const L = g.leader, h = g.creatures.filter(c => c.faction === 'hostile' && !c.dead).sort((a, b) => K2d(L, a) - K2d(L, b))[0];
        if (h) { const party = g.partyCreatures(); party.forEach((c, i) => { c.x = h.x - 3.2 + i * 1.3; c.z = h.z - 3.5 - (i % 2); }); }
        g.paused = false;
      }
      Object.assign(ktui.r.cam, cam);
      await __shots.sleep(fight ? 2600 : 1200);
      if (g.dialog) g.closeDialog(true);
      ktui.layer.innerHTML = '';
      document.querySelectorAll('.kt-toast').forEach(e => e.remove());
      await __shots.sleep(200);
    };
    window.K2d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);`],
    shots: [
      { steps: ['await ktGo("upper_cantina", { dist: 10, pitch: 0.62 }, false);'] },
      { steps: ['await ktGo("vulkar_base", { dist: 9, pitch: 0.7 }, true);'] }
    ]
  },
  dao98_demo: {
    page: 'dao98.html',
    ready: '!!window.daui',
    setup: [`const g0 = new Dao98.Game({}); g0.newGame({ origin: 'hn', race: 'human', cls: 'warrior', sex: 'm', name: 'Эдан' }); daui.settings.autoPause = false; daui.startGame(g0); await __shots.sleep(1500);
    window.daGo = async (area, zoom, yawOff, fight) => {
      const g = daui.g;
      const quiet = () => { for (let i = 0; i < 6 && g.dialog; i++) g.closeDialog(); if (g.mode === 'dialog') g.mode = 'play'; daui.hideDialog(); };
      quiet(); g.enterArea(area); await __shots.sleep(900); quiet();
      if (fight) {
        const pc = g.leader, h = g.ents.filter(e => e.faction === 'hostile' && !e.dead).sort((a, b) => Math.hypot(a.x - pc.x, a.z - pc.z) - Math.hypot(b.x - pc.x, b.z - pc.z))[0];
        if (h) { pc.x = h.x - 3; pc.z = h.z - 3; pc.face = Math.atan2(h.x - pc.x, h.z - pc.z); }
      }
      g.paused = false;
      daui.cam.zoom = zoom; daui.cam.yaw = (g.leader ? g.leader.face : 0) + (yawOff || 0);
      await __shots.sleep(fight ? 2400 : 1800);
      quiet(); if (daui.toastBox) daui.toastBox.innerHTML = '';
      await __shots.sleep(200);
    };`],
    shots: [
      { steps: ['await daGo("flemeth_hut", 0.5, 0.5, false);'] },
      { steps: ['await daGo("ishal_yard", 0.45, 0.4, true);'] }
    ]
  },
  diablo2: {
    page: 'diablo2.html',
    ready: '!!window.d2ui',
    setup: [`d2ui.createChar('Кашья', 'sorceress', false);
    await __shots.until(() => d2ui.screen === 'cine' || d2ui.screen === 'loading' || d2ui.screen === 'game', 10000);
    if (d2ui.screen === 'cine' && d2ui.cine) d2ui.cine.done();
    await __shots.until(() => d2ui.screen === 'game' && d2ui.g, 30000);`],
    shots: [
      { steps: ['await __shots.sleep(2500); d2ui.msgs = [];'] },
      { steps: [`const g = d2ui.g; g.enterArea('bloodmoor', 'start'); await __shots.sleep(800);
        const h = g.hero; h.invuln = true;
        const mons = g.area.ents.filter(e => e.kind === 'mon' && !e.dead);
        let best = null, bestN = 0;
        for (const m of mons) { const n = mons.filter(o => Math.hypot(o.x - m.x, o.y - m.y) < 6).length; if (n > bestN) { bestN = n; best = m; } }
        if (best) { const spot = g.freeSpot(g.area, best.x - 4, best.y + 2, 3); if (spot) { h.x = spot.x; h.y = spot.y; } g.cmdSkill('left', best.x, best.y, best, true); }
        await __shots.sleep(2400); d2ui.msgs = [];`] }
    ]
  },
  gta90: {
    page: 'gta90.html',
    ready: '!!(window.g90ui && g90ui.city)',
    timeout: 90000,
    setup: ['g90ui.newGame(0); await __shots.sleep(300); g90ui.startPlay(); await __shots.sleep(800);'],
    shots: [
      { steps: [`const g = g90ui.game, w = g.world, city = w.city, P = w.player, p = city.places.rat_start;
        if (P.car) w.exitCar(P);
        P.x = p.x; P.y = p.y;
        const r = city.net.nearestLane(p.x, p.y, null, 400, true);
        const car = w.spawnCar('gaz24', r.x, r.y, r.a, { parked: true });
        car.color = '#1c1c20';
        w.enterCar(P, car);
        g90ui.zoomMul = 0.72; g90ui.cam.x = P.x; g90ui.cam.y = P.y; g90ui.cam.zoom = 1.12 * 0.72;
        g90ui.keys = { up: true }; await __shots.sleep(1800); g90ui.keys = {}; await __shots.sleep(500);
        g.msgs = []; g.brief = null; await __shots.sleep(200);`] },
      { steps: [`const g = g90ui.game, w = g.world, city = w.city, P = w.player, p = city.places.bank;
        if (P.car) w.exitCar(P);
        P.x = p.x; P.y = p.y;
        const r = city.net.nearestLane(p.x, p.y, null, 900, true);
        const car = w.spawnCar('vaz2106', r.x, r.y, r.a, { parked: true });
        w.enterCar(P, car);
        g90ui.zoomMul = 0.62; g90ui.cam.x = P.x; g90ui.cam.y = P.y; g90ui.cam.zoom = 1.12 * 0.62;
        w.setWanted(3);
        g90ui.keys = { up: true }; await __shots.sleep(1500); g90ui.keys = {}; await __shots.sleep(2600);
        g.msgs = []; g.brief = null; await __shots.sleep(200);`] }
    ]
  },
  sims3: {
    page: 'sims3.html',
    ready: '!!(window.s3ui && s3ui.r && s3ui.mode === "menu")',
    timeout: 90000,
    shots: [
      { steps: [`const game = s3ui.freshGame(); const hh = [...game.households.values()].find(h => h.key === 'goth'); game.playFamily(hh.id); s3ui.settings.tips = false; s3ui.startLive();
        await __shots.sleep(1200); for (const d of s3ui.dlgs.slice()) d.close(); s3ui.closeScreens();
        await __shots.sleep(3500); for (const d of s3ui.dlgs.slice()) d.close(); await __shots.sleep(300);`] },
      { steps: ['s3ui.newCASGame(); await __shots.sleep(3500);'] }
    ]
  },
  korovany_demo: {
    page: 'korovany.html',
    ready: '!!(window.kvui && kvui.state === "title")',
    setup: [`window.kvStart = async (fac) => { kvui.newGame(fac, fac === 'elf' ? 'Ольха' : 'Гаврила'); await __shots.until(() => kvui.state === 'play' && kvui.game && kvui.game.pf === fac, 20000); await __shots.sleep(400); kvui.S.close(); kvui.toasts = []; return kvui.game; };
    window.kvTp = (x, z, yaw, pitch) => { const g = kvui.game, p = g.player; p.x = x; p.z = z; p.y = g.world.groundAt(x, z); p.vx = p.vz = p.vy = 0; kvui.camYaw = yaw; kvui.camPitch = pitch; p.yaw = yaw; g.input.yaw = yaw; g.updateCells(); };
    window.kvHour = h => { const g = kvui.game; g.time = Math.floor(g.time / 1440) * 1440 + h * 60; };`],
    shots: [
      { steps: [`const g = await kvStart('elf'); kvHour(9.5); const V = g.world.places.village; kvTp(V.x + 12, V.z + 44, -1.05, 0.16); kvui.camDist = 3.4; g.player.drawn = true; g.player.slot = 'ranged'; const el = g.actors.filter(a => a.fac === 'elf' && !a.player && a.role !== 'service').slice(0, 3); el.forEach((a, i) => { a.x = V.x + 2 - i * 3; a.z = V.z + 40 - i * 2; a.y = g.world.groundAt(a.x, a.z); a.ai.mode = 'post'; a.ai.post = { x: a.x, z: a.z, yaw: 1.4 }; }); g.updateCells(); await __shots.sleep(2500); kvui.toasts = []; await __shots.sleep(200);`] },
      { steps: [`const g = kvui.game; kvHour(15.5); const K = Korovany; for (const w of g.wagons.slice()) w.gone = true; K.AI.launchCaravan(g, 'supply', { tag: 'shot' }); const ws = g.wagons.filter(w => w.tag === 'shot'); for (const w of ws) K.AI.wagonSkip(g, w, 2.6 - ws.indexOf(w) * 0.12); for (const w of ws) w.wait = 999; const w0 = ws[0]; const rx = Math.cos(w0.yaw), rz = Math.sin(w0.yaw), fx = Math.sin(w0.yaw), fz = -Math.cos(w0.yaw); const px = w0.x + rx * 8 - fx * 5.5, pz = w0.z + rz * 8 - fz * 5.5; const gd = w0.guards.map(id => g.byId.get(id)); const mx = (px + w0.x) / 2, mz = (pz + w0.z) / 2; gd[0].x = mx; gd[0].z = mz; gd[0].y = g.world.groundAt(mx, mz); g.updateCells(); g.computePose(gd[0]); g.kill(gd[0], g.player, 'wound'); for (let i = 0; i < 4; i++) g.decal(mx + (Math.random() - 0.5) * 1.5, mz + (Math.random() - 0.5) * 1.5, 0.45, 'blood'); kvTp(px, pz, Math.atan2(w0.x - px, -(w0.z - pz)) - 0.1, -0.1); g.player.drawn = true; g.player.slot = 'melee'; kvui.camDist = 3.8; gd.slice(1).forEach((a, i) => { a.x = w0.x + rx * 4.5 + fx * (i * 3 - 2); a.z = w0.z + rz * 4.5 + fz * (i * 3 - 2); a.y = g.world.groundAt(a.x, a.z); a.hostile.add(g.player.id); a.aware.set(g.player.id, { known: true, s: 1 }); a.drawn = true; }); g.updateCells(); await __shots.sleep(1300); kvui.toasts = []; kvui.drawPrompt = () => {}; await __shots.sleep(200);`] }
    ]
  },
  catniss: {
    page: 'catniss.html',
    ready: '!!(window.cnui && cnui.S)',
    size: [640, 480],
    el: '.cnx-cv',
    setup: [`localStorage.removeItem('catniss98_save'); cnui.save = Object.assign(Catniss.defaultSave(), { intro: true, lives: 7 }); cnui.opts.noAutoPause = true;
    window.cnPlace = (id, cx, cy, face) => { cnui.go('play', { id }); const g = cnui.screen.game; g.player.x = cx * 16 + 1; g.player.y = (cy + 1) * 16 - g.player.h; g.player.face = face || 1; g.snapCamera(); return g; };`],
    shots: [
      { steps: [`const g = cnPlace('1-1', 176, 9); await __shots.sleep(3200); const p = g.player; p.x = 185 * 16; p.y = 8 * 16; p.vy = -90; p.vx = 105; p.face = 1; g.player.invul = 0; g.snapCamera(); await __shots.sleep(140);`] },
      { steps: [`const g = cnPlace('4-3', 40, 11); await __shots.sleep(3600); const v = g.ents.find(e => e.type === 'van'); const p = g.player; p.x = 38 * 16; p.y = 7 * 16 - p.h; p.face = 1; g.player.invul = 0; g.snapCamera(); await __shots.until(() => v.st === 'expose', 9000); await __shots.sleep(500);`] }
    ]
  },
  plov: {
    page: 'plov.html',
    ready: '!!(window.plui && window.Plov)',
    setup: [`let t = performance.now();
    window.plBot = (day, sec) => {
      localStorage.removeItem('plov98_save'); plui.save = Object.assign(Plov.defaultSave(), { day }); plui.persist();
      plui.go('play', { day }); plui.screen.start();
      const s = plui.screen, bot = new Plov.Bot(s.game, { slow: 0 }), raf = window.requestAnimationFrame;
      window.requestAnimationFrame = () => 0;
      try { for (let i = 0; i < sec * 60; i++) { if (s.game.modal) s.game.ack(); bot.tick(1 / 60); t = Math.max(t, plui.last || 0) + 1000 / 60; plui.frame(t); if (s.phase !== 'play') break; } }
      finally { window.requestAnimationFrame = raf; }
    };`],
    shots: [
      { steps: ['plBot(3, 40); await __shots.sleep(300);'] },
      { steps: ['plBot(8, 50); await __shots.sleep(300);'] }
    ]
  },
  legion: {
    page: 'legion.html',
    ready: '!!(window.lgui && window.Legion && lgui.screens)',
    timeout: 90000,
    setup: [`const L = Legion; const p = L.Army.newProfile('Легат', 1); p.glory = 3000; p.denarii = 900; lgui.profile = p; lgui.save();`],
    shots: [
      { steps: [`const L = Legion; lgui.go('field', { level: L.LEVELS[1] }); const f = lgui.screens.field;
        await __shots.until(() => f.mode === 'deploy', 30000); f.startBattle();
        const b = f.battle; const n = Math.round(50 / L.TICK); for (let i = 0; i < n && b.state === 'battle'; i++) { b.tick(); f.processEvents(); }
        const mine = b.squads.filter(q => q.side === 0 && q.onField && q.alive > 0), foes = b.squads.filter(q => q.side === 1 && q.onField && q.alive > 0);
        let best = null, bd = 1e9; for (const a of mine) for (const e of foes) { const d = Math.hypot((a.cx || a.ax) - (e.cx || e.ax), (a.cz || a.az) - (e.cz || e.az)); if (d < bd) { bd = d; best = [a, e]; } }
        const c = f.renderer.cam; if (best) { c.tx = ((best[0].cx || best[0].ax) + (best[1].cx || best[1].ax)) / 2; c.tz = ((best[0].cz || best[0].az) + (best[1].cz || best[1].az)) / 2; } c.dist = 38;
        await __shots.sleep(1500);`] },
      { steps: [`lgui.go('campaign'); await __shots.sleep(1800); document.querySelectorAll('.lga-modal-back').forEach(e => e.remove()); await __shots.sleep(600);`] }
    ]
  },
  falloutzp_demo: {
    page: 'falloutzp.html',
    ready: '!!(window.zpui && zpui.r && zpui.r.env && zpui.mode !== "loading")',
    timeout: 90000,
    setup: [`zpui.beginNewGame({}); await __shots.until(() => zpui.game && zpui.game.player, 60000); await __shots.sleep(800);
      const g = zpui.game; zpui.closeAllPanels(); g.flags.chargenDone = true; g.flags.introDone = true; g.setStage('mq01', 30, { force: true });
      g.wxTarget = FalloutZP.WEATHER[0]; g.wxNext = 1e9; Object.assign(g.wx, FalloutZP.WEATHER[0]);
      window.zpView = async (x, z, yaw, pitch, hour, third) => {
        if (!g.cell.exterior) g.enterCell('ext', null);
        const p = g.player; p.x = x; p.z = z; p.y = g.ext.cw.groundAt(x, z, 300); const sw = g.waterSwim(p); if (sw !== null) p.y = sw; p.vx = p.vz = p.vy = 0; p.holstered = true;
        zpui.view.yaw = yaw; zpui.view.pitch = pitch; zpui.view.third = !!third; g.time = hour * 60; g.messages.length = 0;
        if (zpui.hudUI && zpui.hudUI.notes) zpui.hudUI.notes.length = 0;
        await __shots.sleep(2600);
      };`],
    shots: [
      { steps: ['await zpView(477.6, 167.7, 0.81, 0.12, 10, false);'] },
      { steps: ['await zpView(-332, -194, -0.49, 0.06, 18.4, false);'] }
    ]
  },
  fallout: {
    page: 'fallout.html?map=HUBENT&lang=ru',
    ready: '!!(window.fogame && fogame.mode && fogame.mode.w && fogame.mode.w.map && !fogame.mode.busy)',
    size: [640, 480],
    el: '.fo-canvas',
    timeout: 90000,
    setup: [`window.foNoon = () => { const sc = fogame.play.sc; sc.time = Math.floor(sc.time / 864000) * 864000 + 864000 + 12 * 36000; };
      window.foClean = () => { const p = fogame.play; p.log.length = 0; p.floats = []; };
      window.foTalk = async (map, name) => {
        const p = fogame.play;
        await p.goto(p.w.mapIndex(map), -1, -1, -1);
        foNoon();
        const w = p.w;
        const s = w.map.scriptList.find(x => x.name === name && x.self);
        let t = -1;
        for (let dir = 0; dir < 6 && t < 0; dir++) { const c = FO.hexStep(FO.hexStep(s.self.tile, dir), dir); if (c >= 0 && !w.blocker(c, s.self.elev, w.dude)) t = c; }
        w.moveTo(w.dude, t, s.self.elev);
        p.centerOn(w.dude.tile);
        await w.preload(w.elev);
        p.talk(s.self, true);
        await __shots.sleep(3000);
      };
      foNoon(); await __shots.sleep(1500);`],
    shots: [
      { steps: ['foClean(); fogame.play.centerOn(fogame.play.w.dude.tile); await __shots.sleep(1500); foClean(); await __shots.sleep(300);'] },
      { steps: ['await foTalk("SHADYW", "ARADESH");'] }
    ]
  },
  anotherwar: {
    page: 'anotherwar.html',
    ready: '!!(window.awui && awui.game)',
    setup: [`await awui.game.newGame({ cls: 'strongman', name: 'Зигмунт', stats: Object.assign({}, AW.Rules.CLASSES.strongman.base) });
      await __shots.until(() => awui.game.W && !awui.game.assetsBusy, 60000);
      window.awLevel = async id => { await awui.game.W.changeLevel(id); await __shots.until(() => !awui.game.assetsBusy, 60000); await __shots.sleep(2500); };`],
    shots: [
      { steps: ['await awLevel("A01_Rynek");'] },
      { steps: ['await awLevel("A02_CafeRene"); awui.game.W.openDialog("rene"); await __shots.sleep(2200);'] }
    ]
  },
  hsr98: {
    page: 'hsr98.html',
    ready: '!!(window.hsrui && window.Hsr98)',
    setup: [`const H = Hsr98, ui = window.hsrui;
    ui.running = false;
    Math.random = H.makeRandom(11);
    window.hsrPump = (n, dt = 1 / 30) => { for (let i = 0; i < n; i++) ui.update(dt); ui.render(); };
    window.hsrFresh = (map, party) => {
      const st = H.newState();
      Object.assign(st, { name: 'Стелла', gender: 'f', map, x: null, y: null, jade: 1600, credits: 25480, power: 142, tp: 4, obj: 'Найти Броню в Белобоге' });
      for (const f of ['intro', 'asta_met', 'hs_power', 'doom', 'express_intro', 'jarilo_arrive', 'plains_met', 'belobog_intro', 'sampo_met', 'events_note']) st.flags[f] = true;
      for (const id of Object.keys(H.CHARS)) if (id !== 'trail_p') st.roster[id] = { lvl: id === 'trail' ? 32 : 28, exp: 420, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
      st.party = party || ['trail', 'march', 'danheng', 'himeko'];
      st.pendingTechs = [];
      const g = new H.Game({ state: st, seed: 7 });
      for (const k of st.party) g.autoEquip(k);
      ui.game = g; ui.screens = []; ui.dlg = null; ui.toasts = []; ui.particles = [];
      ui.enterField(); ui.banner = null;
      return g;
    };`],
    shots: [
      { steps: ['const g = hsrFresh("j_plains", ["trail", "march", "arlan", "himeko"]); g.startBattle({ enemies: ["reaver:20", "flamespawn:20", "eliminator:20"], lvl: 20, bg: "station", music: "battle" }); hsrui.drainGameEvents(); hsrPump(160); await __shots.sleep(200);'] },
      { steps: ['hsrFresh("j_belobog"); hsrPump(30); await __shots.sleep(200);'] }
    ]
  },
  avatar98: {
    page: 'avatar98.html',
    ready: '!!(window.av98 && av98.data && av98.data.maps)',
    size: [640, 480],
    el: '#game canvas',
    setup: [`av98.opts.isActive = () => true; window.avStart = async map => { const sp = Object.keys(av98.data.maps[map].spawns)[0]; av98.debugStart({ map, spawn: sp, party: ['tao', 'miri'], level: 8 }); await __shots.sleep(2500); };`],
    shots: [
      { steps: ['await avStart("shinryu_market");'] },
      { steps: [`const ms = av98.scenes.find(s => s.startBattle); if (ms) ms.startBattle("t_docks_thugs"); await __shots.sleep(3500);`] }
    ]
  },
  fallout98_demo: {
    page: 'fallout2.html',
    frameEl: '#standalone-root',
    el: '#standalone-root',
    ready: '!!window.falloutUI',
    setup: ['await __shots.sleep(800); __shots.clickText("НАЧАТЬ ИСПЫТАНИЕ"); await __shots.sleep(1500);'],
    shots: [
      { steps: ['await __shots.sleep(1000);'] },
      { steps: ['__shots.clickText("CHA"); await __shots.sleep(1500);'] }
    ]
  },
  'half-life_demo': {
    page: 'half-life.html',
    el: '.hl98-stage',
    size: [800, 640],
    ready: 'typeof game !== "undefined" && !!game.renderer',
    setup: ['game.capture = () => {}; await __shots.sleep(600); __shots.clickText("NEW GAME"); await __shots.sleep(1500);',
      'window.hlQuiet = () => { game.world.noticeTime = 0; for (const k of ["notice", "prompt", "chapter"]) if (game.ui[k]) game.ui[k].style.visibility = "hidden"; };'],
    shots: [
      { steps: ['await __shots.sleep(2600); hlQuiet(); await __shots.sleep(150);'] },
      { steps: [`game.makeWorld(1); game.resume(); await __shots.sleep(600);
        const w = game.world, p = w.player, r = w.rooms[Math.max(0, w.room)];
        const fx = Math.cos(p.yaw), fz = Math.sin(p.yaw);
        const vort = w.spawn('vortigaunt', Math.max(0, w.room), p.x - r.x + fx * 4.5 - fz * 0.8, p.z - r.z + fz * 4.5 + fx * 0.8);
        const crab = w.spawn('headcrab', Math.max(0, w.room), p.x - r.x + fx * 3 + fz * 1.2, p.z - r.z + fz * 3 - fx * 1.2);
        await __shots.sleep(900); p.yaw = Math.atan2(vort.z - p.z, vort.x - p.x); hlQuiet(); await __shots.sleep(150);`] }
    ]
  },
  'neon-racer_demo': {
    page: 'midnight-glide.html',
    el: '#game canvas',
    ready: 'typeof game !== "undefined" && !!game.menu',
    setup: [`game.state = "menu"; game.action("restart"); await __shots.sleep(800);
      window.glidePilot = setInterval(() => {
        const ph = game.physics, tr = game.track, k = game.controller.keys;
        const t = tr.nearest(ph.x, ph.z).progress, a = tr.sample(t), b = tr.sample((t + 0.001) % 1), len = Math.max(500, Math.hypot(b.x - a.x, b.z - a.z) / 0.001);
        const target = tr.sample((t + 14 / len) % 1);
        let d = Math.atan2(target.x - ph.x, target.z - ph.z) - ph.yaw;
        while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        k.add('ArrowUp'); k.delete('ArrowLeft'); k.delete('ArrowRight');
        if (d > 0.04) k.add('ArrowLeft'); else if (d < -0.04) k.add('ArrowRight');
      }, 30);`],
    shots: [
      { steps: ['await __shots.sleep(9000);'] },
      { steps: ['game.controller.keys.add("ShiftLeft"); await __shots.sleep(4000);'] }
    ]
  },
  diablo: {
    page: 'diablo.html',
    ready: 'typeof ui !== "undefined"',
    setup: ['await __shots.sleep(600); __shots.clickText("Новая игра"); await __shots.sleep(800); __shots.clickText("Начать"); await __shots.sleep(1500); __shots.clickText("В путь"); await __shots.sleep(1500);'],
    shots: [
      { steps: ['await __shots.sleep(1500);'] },
      { steps: [`const g = ui.game; g.enterLevel(2, "down"); await __shots.sleep(800);
        const L = g.level, h = g.hero, m = L.monsters.filter(x => !x.dead).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
        if (m) { for (const [dx, dy] of [[-2, 1], [2, 1], [-2, -1], [1, 2], [-1, -2], [3, 0], [0, 3]]) { const x = m.x + dx, y = m.y + dy; if (L.walkable(x, y) && !L.occ[y * L.w + x]) { L.unplace(h); L.place(h, x, y); break; } } }
        await __shots.sleep(2500);`] }
    ]
  },
  wolf3d: Object.assign(desktopGame('appWolf3D', 'app_wolf3d', 820, 660, [
    `const ww = winManager.windows.get('app_wolf3d'); ww.bodyElement.removeAttribute('id'); ww.bodyElement.querySelector('.wl3d-stage').id = 'shot-target'; appWolf3D.ui.hintEl.style.display = 'none';
    window.wolfShot = async (ep, floor, setup) => { const ui = appWolf3D.ui; ui.newGame(ep, 2, floor); await __shots.until(() => ui.screen === 'play'); setup(ui.game); await __shots.sleep(900); };`
  ]), {
    shots: [
      { steps: ['await wolfShot(0, 0, g => { g.px = 15.5; g.py = 18; g.angle = Math.PI - 0.12; const a = g.actors.find(x => x.tx === 10 && x.ty === 17); if (a) a.dir = 0; });'] },
      { steps: ['await wolfShot(0, 8, g => { g.px = 21.5; g.py = 21.5; g.angle = Math.atan2(13.5 - 21.5, 17.5 - 21.5) + 0.22; g.weapons[3] = true; g.weapon = 3; g.chosen = 3; g.ammo = 99; g.god = true; g.hideGod = true; }); appWolf3D.ui.held.add("ControlLeft"); await __shots.sleep(260);'] }
    ]
  }),
  quest_demo: Object.assign(desktopGame('appScummQuest', 'app_scumm_quest', 820, 640), {
    shots: [
      { steps: ['await __shots.sleep(300);'] },
      { steps: ['appScummQuest.changeRoom("rooftop", 40, 115); await __shots.sleep(1800);'] }
    ]
  }),
  homm1_demo: {
    page: 'homm1.html',
    ready: '!!(window.hmui && window.HoMM1)',
    size: [640, 480],
    el: '#homm1-canvas',
    setup: [`hmui.audio.setMuted(true);`],
    shots: [
      {
        steps: [`
          hmui.menuFaction = 'knight';
          hmui.menuMode = 'campaign';
          hmui.menuCampaignIdx = 0;
          hmui.startCampaignOrScenario();
          hmui.modal = null;
          const h = hmui.world.getHero(hmui.world.selectedHeroId);
          if (h) {
            hmui.world.revealFog('blue', h.x, h.y, 10);
            hmui.centerCameraOnSelectedHero();
            const path = HoMM1.findPath(hmui.world, h, h.x + 4, h.y + 2);
            if (path && path.reachable) {
              hmui.plannedPath = path;
              hmui.plannedTarget = { x: h.x + 4, y: h.y + 2 };
            }
          }
          hmui.render();
          await __shots.sleep(400);
        `]
      },
      {
        steps: [`
          const atkHero = HoMM1.createHero('kilburn', 'blue', new HoMM1.RNG(777));
          atkHero.army = [
            { unit: 'paladin', count: 6 },
            { unit: 'swordsman', count: 14 },
            { unit: 'archer', count: 24 },
            { unit: 'griffin', count: 10 },
            { unit: 'cavalry', count: 12 }
          ];
          const defHero = HoMM1.createHero('agar', 'red', new HoMM1.RNG(888));
          defHero.army = [
            { unit: 'dragon', count: 3 },
            { unit: 'hydra', count: 7 },
            { unit: 'minotaur', count: 12 },
            { unit: 'centaur', count: 30 },
            { unit: 'gargoyle', count: 18 }
          ];
          hmui.activeCombat = new HoMM1.Combat(atkHero, defHero, {
            seed: 777,
            terrain: 'dirt',
            siege: { faction: 'warlock', hasCastle: true, hasTurrets: true }
          });
          hmui.modal = null;
          hmui.screen = 'combat';
          hmui.render();
          await __shots.sleep(400);
        `]
      }
    ]
  },
  stalker: Object.assign(desktopGame('appStalker', 'app_stalker', 820, 640), {
    shots: [
      { steps: ['await __shots.sleep(2500); appStalker.finishTyping(); await __shots.sleep(200);'] },
      { steps: ['for (let i = 0; i < 3; i++) { appStalker.finishTyping(); appStalker.pick(0); await __shots.sleep(100); } appStalker.finishTyping(); await __shots.sleep(300);'] }
    ]
  })
};
