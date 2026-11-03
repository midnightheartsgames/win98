const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

async function launch() {
  const sport = randomPort(8300, 600), dport = randomPort(9600, 300);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore', windowsHide: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'heroes98-edge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=1700,1300', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore', windowsHide: true });
  const close = async () => {
    try {
      const v = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const bws = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => bws.addEventListener('open', r, { once: true }));
      bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(400);
    } catch (e) { }
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch (e) { }
    server.kill();
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { }
  };
  let target = null;
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch (e) { }
  }
  if (!target) { await close(); throw new Error('Edge did not start'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let seq = 0;
  const pending = new Map(), errors = [];
  ws.addEventListener('message', m => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails;
      errors.push(x.exception ? x.exception.description : x.text);
    }
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value || a.description).join(' '));
  });
  const send = (method, params) => new Promise(r => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) {
      const x = r.result.exceptionDetails;
      throw new Error(x.exception ? x.exception.description : x.text);
    }
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  await send('Runtime.enable', {});
  await send('Page.enable', {});
  await send('Network.enable', {});
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`http://127.0.0.1:${sport}/heroes98.html`)).status === 200) break; } catch (e) { }
    await sleep(250);
  }
  const base = `http://127.0.0.1:${sport}`;
  const cdp = {
    errors, eval: evalJs, send,
    async open(page) {
      await send('Page.navigate', { url: base + page });
      await this.until('location.href === ' + JSON.stringify(base + page) + ' && document.readyState === "complete"', 30000);
    },
    async until(expr, ms) {
      const end = Date.now() + (ms || 15000);
      while (Date.now() < end) {
        try { if (await evalJs(expr)) return true; } catch (e) { }
        await sleep(100);
      }
      throw new Error('timeout: ' + expr);
    },
    async key(key, code, keyCode) {
      const p = { key, code: code || key, windowsVirtualKeyCode: keyCode || 0, nativeVirtualKeyCode: keyCode || 0 };
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
      await sleep(150);
    },
    async shot(file, selector) {
      let clip;
      if (selector) {
        const r = await evalJs(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) }; })()`);
        if (r) clip = { ...r, scale: 1 };
      }
      const res = await send('Page.captureScreenshot', clip ? { format: 'png', clip } : { format: 'png' });
      fs.writeFileSync(file, Buffer.from(res.result.data, 'base64'));
      return file;
    }
  };
  return { cdp, close };
}

const frames = async (cdp, n) => {
  const f = await cdp.eval('heui.frames');
  await cdp.until('heui.frames > ' + (f + n), 20000);
};
const SCENES = {
  async arts(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    await cdp.eval(`(() => {
      const H = Heroes98, MD = H.MapData;
      heui.startGame(H.Maps.build('ford', { seed: 5, slots: [{ faction: 'league', human: true }, { faction: 'barrows' }] }));
      const v = heui.view, S = v.S, me = v.hero();
      for (const id of [...H.ART_SETS.forge.items, 'thronehelm', 'pilotboots', 'starlens', 'oathring', 'couriers']) H.Hero.giveArt(me, id);
      for (const id of ['moonguide', 'ashmantle', 'luckbone', 'tidecoat', 'moonblade', 'sevenmoons', 'horseshoe']) me.bag.push(id);
      S.ver++;
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.eval(`(() => { const v = heui.view, H = Heroes98; heui.show(new H.HeroView(heui, v, v.hero())); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'arts-hero.png'), '.he-canvas');
    const tip = await cdp.eval(`(() => {
      const v = heui.view, r = v.regions.find(q => q.id === 'art-right');
      v.pointer('move', r.x + 8, r.y + 8, 0);
      return { lines: r.info ? r.info() : null };
    })()`);
    log.push('tip: ' + JSON.stringify(tip));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'arts-tip.png'), '.he-canvas');
    const stock = await cdp.eval(`(() => {
      const H = Heroes98, g = heui.game, S = g.S, t = H.Town.list(S, 0)[0], me = S.heroes[0];
      heui.show(g);
      S.players[0].res.gold = 40000;
      t.built.push('hall2', 'market', 'special4');
      [me.c, me.r] = H.MapData.entry(t);
      g.openTown(t);
      heui.view.openBuilding('special4');
      return H.Town.shop(S, t);
    })()`);
    log.push('chamber: ' + JSON.stringify(stock));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'arts-chamber.png'), '.he-canvas');
    await cdp.eval(`(() => {
      const v = heui.view, r = v.regions.find(q => q.id === 'ch-0');
      v.pointer('move', r.x + 4, r.y + 4, 0);
      v.pointer('down', r.x + 4, r.y + 4, 0);
      return true;
    })()`);
    await frames(cdp, 3);
    const left = await cdp.eval('Heroes98.Town.shop(heui.game.S, Heroes98.Town.list(heui.game.S, 0)[0])[0]');
    log.push('bought from the chamber: ' + (left === null));
    if (left !== null) throw new Error('the chamber did not sell');
    await cdp.shot(path.join(out, 'arts-bought.png'), '.he-canvas');
  },
  async sites(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    await cdp.eval(`(() => {
      const H = Heroes98;
      heui.startGame(H.Maps.build('chasha', { seed: 5, slots: [{ faction: 'league', human: true }, { faction: 'barrows' }, { faction: 'barrows' }, { faction: 'league' }] }));
      const v = heui.view, S = v.S;
      S.players[0].seen = S.players[0].seen.map(l => l.map(() => 1));
      S.players[0].res.gold = 60000;
      S.players[0].res.wood = 40;
      S.ver++;
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'sites-home.png'), '.he-canvas');
    const look = async (name, c, r, level) => {
      await cdp.eval(`(() => { const v = heui.view; v.level = ${level || 0}; v.cam.x = ${c} * 32 - 400; v.cam.y = ${r} * 32 - 224; v.clampCam(); v.ver = -1; v.vis = new Uint8Array(v.S.map.w * v.S.map.h).fill(1); return true; })()`);
      await frames(cdp, 3);
      await cdp.shot(path.join(out, name + '.png'), '.he-canvas');
    };
    await look('sites-zone', 24, 24);
    await look('sites-outer', 40, 18);
    await look('sites-sea', 42, 42);
    await look('sites-middle', 56, 56);
    await look('sites-under', 28, 28, 1);
    await cdp.eval(`(() => {
      const H = Heroes98, MD = H.MapData, v = heui.view, S = v.S, boat = S.map.objs.find(o => o.t === 'boat'), me = v.hero();
      me.c = boat.c; me.r = boat.r; me.boat = boat.id; boat.gone = true; me.steps = 18;
      v.center(me);
      S.ver++;
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'sites-boat.png'), '.he-canvas');
    const pirate = await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, S = v.S, me = v.hero(), M = S.map;
      me.army = [{ unit: 'plated', count: 20, stars: 0, vet: 0 }, { unit: 'crossbow', count: 40, stars: 0, vet: 0 }, { unit: 'aeronaut', count: 6, stars: 0, vet: 0 }, null, null, null, null];
      const o = H.MapData.add(M, { t: 'monster', c: me.c + 1, r: me.r, l: 0, owner: -1, unit: 'pirates', count: 30, max: 60, mood: 'fierce' });
      S.pending = { kind: 'encounter', hero: me.id, obj: o.id, from: [me.c, me.r], ratio: 3, offer: null, chance: 0, price: 0 };
      v.fight();
      return { deck: heui.view.B.deck, stacks: heui.view.B.stacks.length };
    })()`);
    log.push('water battle: ' + JSON.stringify(pirate));
    if (!pirate.deck) throw new Error('no deck in a water battle');
    await frames(cdp, 5);
    await cdp.shot(path.join(out, 'sites-deck.png'), '.he-canvas');
    const planks = await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, B = v.B;
      for (let i = 0; i < 2000 && B.round < H.BATTLE.deckPlanks && B.winner < 0; i++) H.Battle.act(B, { type: 'defend' });
      v.sync();
      return { round: B.round, left: B.obstacles.length };
    })()`);
    log.push('planks: ' + JSON.stringify(planks));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'sites-planks.png'), '.he-canvas');
    await cdp.eval(`(() => {
      const H = Heroes98, v = heui.game, S = v.S, me = S.heroes[0];
      S.battle = null;
      S.pending = null;
      heui.show(v);
      const boat = S.map.objs.find(o => o.id === me.boat);
      if (boat) boat.gone = false;
      me.boat = null;
      const vault = S.map.objs.find(o => o.t === 'eaglenest' || o.t === 'trollcave'), e = H.MapData.entry(vault);
      me.c = e[0]; me.r = e[1]; me.l = vault.l;
      v.center(me);
      S.ver++;
      S.pending = { kind: 'vault', hero: me.id, obj: vault.id, from: [e[0], e[1] + 1] };
      return true;
    })()`);
    await frames(cdp, 4);
    await cdp.shot(path.join(out, 'sites-vault.png'), '.he-canvas');
    await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, S = v.S, me = S.heroes[0];
      v.closeModal('retreat');
      const dw = S.map.objs.find(o => o.t === 'dwell-wolves'), ev = [];
      H.OBJ_VISIT.dwelling(S, me, dw, ev);
      v.events(ev);
      return true;
    })()`);
    await frames(cdp, 4);
    await cdp.shot(path.join(out, 'sites-dwelling.png'), '.he-canvas');
    await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, S = v.S, me = S.heroes[0];
      v.closeModal('leave');
      for (const m of S.map.objs.filter(o => o.t === 'menhir').slice(0, 3)) S.players[0].menhirs.push({ id: m.id, c: m.c, r: m.r });
      v.kingdom = { tab: 'heart' };
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'sites-heart.png'), '.he-canvas');
    await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, S = v.S;
      v.kingdom = null;
      const o = S.map.objs.find(x => x.t === 'observatory');
      o.owner = 0;
      v.calendar = true;
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'sites-calendar.png'), '.he-canvas');
    const count = await cdp.eval(`(() => {
      const H = Heroes98, ids = Object.keys(H.OBJ).filter(k => H.OBJ[k].kind !== 'town');
      const make = (id, list) => {
        const cv = document.createElement('canvas');
        cv.id = id;
        cv.width = 960;
        cv.height = 720;
        cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99';
        const g = cv.getContext('2d');
        g.fillStyle = '#4f7d3a';
        g.fillRect(0, 0, 960, 720);
        list.forEach((t, i) => {
          const x = 8 + (i % 10) * 96, y = 26 + Math.floor(i / 10) * 118, o = { t, c: 0, r: 0, l: 0, owner: -1, art: 'luckbone', spell: 'spark', unit: 'wolves', count: 5, mood: 'hostile', color: i % 8, tier: 1, built: [] };
          H.MapDraw.object(g, o, x, y, 0.5, null);
          g.fillStyle = '#fff';
          g.font = '10px Arial';
          g.fillText(t, x, y + 106);
        });
        document.body.appendChild(cv);
      };
      make('sheet1', ids.slice(0, 60));
      make('sheet2', ids.slice(60, 120));
      make('sheet3', ids.slice(120));
      document.getElementById('sheet2').style.display = 'none';
      document.getElementById('sheet3').style.display = 'none';
      return ids.length;
    })()`);
    log.push('object sheets: ' + count + ' kinds');
    for (const n of [1, 2, 3]) {
      await cdp.eval(`(() => { for (const k of [1, 2, 3]) document.getElementById('sheet' + k).style.display = k === ${n} ? 'block' : 'none'; return true; })()`);
      await sleep(150);
      await cdp.shot(path.join(out, 'objects-' + n + '.png'), '#sheet' + n);
    }
  },
  async siege(cdp, out, log) {
    const press = id => cdp.eval(`(() => { const v = heui.view, r = (v.regions || []).find(q => q.id === ${JSON.stringify(id)}); if (!r) return false; v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); return true; })()`);
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    await cdp.eval(`(() => {
      const H = Heroes98;
      heui.startGame(H.Maps.build('ford', { seed: 5, slots: [{ faction: 'league', human: true }, { faction: 'barrows' }] }));
      const v = heui.view, S = v.S, me = v.hero(), t = H.Town.list(S, 1)[0], foe = S.heroes.find(h => h.owner === 1), gate = H.MapData.entry(t);
      foe.c = 2; foe.r = 2;
      me.c = gate[0]; me.r = gate[1] + 1;
      me.level = 12;
      me.atk = 8; me.def = 8;
      me.skills.machines = 3;
      me.machines = ['ballista', 'tent', 'wagon'];
      me.army = [{ unit: 'plated', count: 30, stars: 0, vet: 0 }, { unit: 'crossbow', count: 60, stars: 0, vet: 0 }, { unit: 'militia', count: 120, stars: 0, vet: 0 }, { unit: 'aeronaut', count: 8, stars: 0, vet: 0 }, null, null, null];
      t.garrison = [{ unit: 'shade', count: 60, stars: 0, vet: 0 }, { unit: 'horsebow', count: 25, stars: 0, vet: 0 }, { unit: 'stonewoman', count: 10, stars: 0, vet: 0 }, null, null, null, null];
      v.center(me);
      S.ver++;
      return true;
    })()`);
    await frames(cdp, 3);
    const open = fort => cdp.eval(`(() => {
      const H = Heroes98, v = heui.game, S = v.S, me = S.heroes[0], t = H.Town.list(S).find(o => o.faction === 'barrows');
      heui.show(v);
      S.pending = { kind: 'town', hero: me.id, obj: t.id, from: [me.c, me.r] };
      S.battle = null;
      t.built = t.built.filter(id => !/^fort/.test(id));
      for (let n = 1; n <= ${fort}; n++) t.built.push('fort' + n);
      v.fight();
      return { fort: heui.view.B.siege.fort, towers: heui.view.B.siege.towers, moat: heui.view.B.siege.moat, dmg: heui.view.B.siege.dmg, stacks: heui.view.B.stacks.length };
    })()`);
    for (const fort of [1, 2, 3]) {
      const info = await open(fort);
      log.push('siege fort ' + fort + ': ' + JSON.stringify(info));
      if (info.fort !== fort) throw new Error('wrong fortification on the field');
      await cdp.until('heui.view.B && !heui.view.beats.length && !heui.view.beat', 20000);
      await frames(cdp, 2);
      await cdp.shot(path.join(out, 'siege-' + fort + '.png'), '.he-canvas');
    }
    const force = unit => cdp.eval(`(() => {
      const v = heui.view, B = v.B, s = B.stacks.find(q => q.unit === ${JSON.stringify(unit)} && q.side === 0);
      v.beats = [];
      v.beat = null;
      v.deploying = false;
      B.active = s.id;
      v.rc = null;
      v.sync();
      return s.id;
    })()`);
    await force('catapult');
    await cdp.until('heui.view.mine() && heui.view.rc', 10000);
    const before = await cdp.eval(`(() => {
      const v = heui.view, D = Heroes98.BattleDraw, B = v.B, [x, y] = D.center(B.siege.col, 3);
      v.pointer('move', x, y, 0);
      return { hp: B.siege.pieces.map(p => p.hp), hover: v.hover && v.hover.piece, x, y };
    })()`);
    log.push('catapult aim: ' + JSON.stringify(before));
    if (before.hover == null) throw new Error('the catapult does not aim at the wall');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'siege-catapult.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.pointer('down', ${before.x}, ${before.y}, 0); return true; })()`);
    await frames(cdp, 4);
    const after = await cdp.eval('heui.view.B.siege.pieces.map(p => p.hp)');
    log.push('catapult hit: ' + JSON.stringify(after));
    if (after.reduce((a, b) => a + b, 0) >= before.hp.reduce((a, b) => a + b, 0)) throw new Error('the catapult did not hit');
    await cdp.until('!heui.view.beats.length && !heui.view.beat', 20000);
    await force('tent');
    await cdp.until('heui.view.mine() && heui.view.rc', 10000);
    const tent = await cdp.eval(`(() => {
      const v = heui.view, H = Heroes98, own = v.B.stacks[0], p = H.BattleDraw.stackPos(own);
      own.hp = 3;
      v.pointer('move', p[0], p[1], 0);
      const aim = v.hover && !!v.hover.tend;
      v.pointer('down', p[0], p[1], 0);
      return { aim, hp: own.hp };
    })()`);
    log.push('tent: ' + JSON.stringify(tent));
    if (!tent.aim || tent.hp <= 3) throw new Error('the tent did not heal');
    await cdp.until('!heui.view.beats.length && !heui.view.beat', 20000);
    await force('ballista');
    await cdp.until('heui.view.mine() && heui.view.rc', 10000);
    const ball = await cdp.eval(`(() => {
      const v = heui.view, H = Heroes98, foe = H.Battle.targets(v.B, 0)[0], p = H.BattleDraw.stackPos(foe);
      v.pointer('move', p[0], p[1] - 4, 0);
      return { kind: v.hover && v.hover.kind, x: p[0], y: p[1] - 4 };
    })()`);
    log.push('ballista: ' + JSON.stringify(ball));
    if (ball.kind !== 'shot') throw new Error('the ballista cannot aim');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'siege-ballista.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.pointer('down', ${ball.x}, ${ball.y}, 0); return true; })()`);
    await cdp.until('!heui.view.beats.length && !heui.view.beat', 20000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'siege-panel.png'), '.he-canvas');
    await cdp.eval('heui.view.quick(), true');
    await cdp.until('!!heui.view.result', 60000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'siege-result.png'), '.he-canvas');
    const siegeEnd = await cdp.eval('({ winner: heui.view.B.winner, round: heui.view.B.round })');
    log.push('siege end: ' + JSON.stringify(siegeEnd));
    await cdp.eval(`(() => { const v = heui.view, b = v.resultButtons[0]; v.pointer('down', b.x + 2, b.y + 2, 0); return true; })()`);
    for (let i = 0; i < 40; i++) {
      await frames(cdp, 2);
      const leveling = await cdp.eval(`(() => { const v = heui.view; if (!(v instanceof Heroes98.LevelView)) return false; const r = v.regions.find(q => q.act); if (r) { v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); } return true; })()`);
      if (!leveling) break;
    }
    await cdp.eval(`(() => {
      const H = Heroes98, v = heui.game, S = v.S, me = S.heroes[0], own = H.Town.list(S, 0)[0], foe = S.heroes.find(h => h.owner === 1), gate = H.MapData.entry(own);
      heui.show(v);
      v.modal = null;
      v.modalQueue = [];
      S.pending = null;
      S.battle = null;
      S.over = null;
      for (const p of S.players) p.out = false;
      foe.alive = true;
      foe.c = me.c + 1 > 46 ? me.c - 1 : me.c + 1;
      foe.r = me.r;
      foe.army = [{ unit: 'stonekhan', count: 8, stars: 0, vet: 0 }, null, null, null, null, null, null];
      S.players[0].res.gold = 90000;
      me.alive = true;
      if (!me.army.some(Boolean)) me.army[0] = { unit: 'militia', count: 30, stars: 0, vet: 0 };
      S.ver++;
      S.pending = { kind: 'duel', hero: me.id, enemy: foe.id, from: [me.c, me.r] };
      v.fight();
      v.ui.view.deploying = false;
      return true;
    })()`);
    await cdp.until('heui.view.mine() && heui.view.rc', 30000);
    const flee = await cdp.eval(`({ flee: heui.view.enabled('flee'), ransom: heui.view.enabled('ransom'), price: Heroes98.Battle.ransomPrice(heui.view.B, 0) })`);
    log.push('retreat buttons: ' + JSON.stringify(flee));
    if (!flee.flee || !flee.ransom) throw new Error('retreat buttons are off');
    await cdp.eval(`heui.view.press('flee'), true`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'battle-flee.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, b = v.askButtons()[1]; v.pointer('down', b.x + 2, b.y + 2, 0); return true; })()`);
    if (await cdp.eval('heui.view.B.winner >= 0')) throw new Error('declining the retreat ended the battle');
    await cdp.eval(`heui.view.press('ransom'), true`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'battle-ransom.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, b = v.askButtons()[0]; v.pointer('down', b.x + 2, b.y + 2, 0); return true; })()`);
    await cdp.until('!!heui.view.result', 20000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'battle-ransom-result.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, b = v.resultButtons[0]; v.pointer('down', b.x + 2, b.y + 2, 0); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.MapView', 5000);
    await frames(cdp, 3);
    const back = await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, S = v.S, me = S.heroes[0], own = H.Town.nearestTavern(S, me);
      S.players[1].out = false;
      const out = { away: me.away, returning: S.returning.length, gold: S.players[0].res.gold };
      for (const h of S.heroes) if (h.owner === 1) { h.c = 40; h.r = 2; h.steps = 0; }
      S.day += 1;
      out.waiting = H.Town.backHeroes(S, own).length;
      v.openTown(own);
      heui.view.press('tavern');
      return out;
    })()`);
    log.push('after the ransom: ' + JSON.stringify(back));
    if (!back.away || back.waiting !== 1) throw new Error('the hero does not wait in the tavern');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'tavern-back.png'), '.he-canvas');
    if (!(await press('tv-back'))) throw new Error('no button to hire the hero back');
    await frames(cdp, 2);
    const hired = await cdp.eval(`({ alive: heui.game.S.heroes[0].alive, win: heui.view.win })`);
    log.push('hired back: ' + JSON.stringify(hired));
    if (!hired.alive) throw new Error('the hero did not come back');
    const town = await cdp.eval(`(() => {
      const H = Heroes98, v = heui.game, S = v.S, me = S.heroes[0], own = heui.view.o, far = H.Town.list(S).find(o => o !== own), gate = H.MapData.entry(own);
      far.owner = 0;
      for (const o of S.map.objs) if (o.t === 'monster') o.gone = true;
      far.pool = [30, 12, 6, 0, 0, 0, 0];
      far.built = [...new Set([...far.built, 'dwell1', 'dwell2', 'dwell3'])];
      own.built = [...new Set([...own.built, 'smith', 'market', 'caravan'])];
      me.c = gate[0];
      me.r = gate[1];
      me.machines = [];
      S.ver++;
      heui.view.closeWin();
      heui.view.press('smith');
      return far.name;
    })()`);
    log.push('second town: ' + town);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'smith.png'), '.he-canvas');
    if (!(await press('sm-ballista'))) throw new Error('no ballista button');
    const bought = await cdp.eval('heui.game.S.heroes[0].machines.join()');
    log.push('bought: ' + bought);
    if (bought !== 'ballista') throw new Error('the machine was not bought');
    await cdp.eval(`(() => { heui.view.closeWin(); heui.view.press('caravan'); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'caravan-window.png'), '.he-canvas');
    await press('cv-go');
    await frames(cdp, 2);
    const sent = await cdp.eval('heui.game.S.caravans.length');
    log.push('caravans on the way: ' + sent);
    if (sent !== 1) throw new Error('the caravan did not leave');
    await cdp.eval(`(() => {
      const H = Heroes98, v = heui.game, S = v.S, cv = S.caravans[0], me = S.heroes[0];
      heui.view.exit();
      S.caravans.push({ id: S.nextCaravan++, owner: 1, to: H.Town.list(S, 0)[0].id, l: 0, c: me.c + 2, r: me.r + 2, dir: 1, stacks: [{ unit: 'shade', count: 20, stars: 0, vet: 0 }] });
      H.Adv.reveal(S, 0, 0, cv.c, cv.r, 4);
      v.center(cv);
      S.ver++;
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'caravan-map.png'), '.he-canvas');
    const raid = await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, S = v.S, me = v.hero(), cv = S.caravans.find(q => q.owner === 1);
      v.center(me);
      const p = H.Adv.path(S, me, cv.c, cv.r);
      v.plan = Object.assign({}, p, { goal: [cv.c, cv.r], steps: p.steps.map(s => ({ ...s })) });
      v.go();
      return { kind: p.kind, steps: p.steps.length };
    })()`);
    log.push('path to the caravan: ' + JSON.stringify(raid));
    if (raid.kind !== 'caravan') throw new Error('the path to a stranger caravan is not an attack');
    await cdp.until('!!heui.view.modal', 15000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'caravan-modal.png'), '.he-canvas');
    await cdp.eval(`heui.view.closeModal('fight'), true`);
    await cdp.until('heui.view instanceof Heroes98.BattleView', 5000);
    await cdp.eval('heui.view.quick(), true');
    await cdp.until('!!heui.view.result', 30000);
    await cdp.eval(`(() => { const v = heui.view, b = v.resultButtons[0]; v.pointer('down', b.x + 2, b.y + 2, 0); return true; })()`);
    await frames(cdp, 3);
    const taken = await cdp.eval(`({ left: heui.game.S.caravans.filter(q => q.owner === 1).length, shade: heui.game.S.heroes[0].army.some(s => s && s.unit === 'shade') })`);
    log.push('caravan taken: ' + JSON.stringify(taken));
    if (taken.left !== 0 || !taken.shade) throw new Error('the caravan was not taken');
  },
  async sound(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    const r = await cdp.eval(`(async () => {
      const ui = heui, H = Heroes98, wait = ms => new Promise(ok => setTimeout(ok, ms));
      ui.audio();
      const ctx = ui.actx, probe = ctx.createAnalyser();
      probe.fftSize = 2048;
      ui.sound.master.connect(probe);
      await ctx.resume();
      const peak = () => {
        const d = new Float32Array(probe.fftSize);
        probe.getFloatTimeDomainData(d);
        return Math.max(...d.map(Math.abs));
      };
      const themes = {};
      for (const id of Object.keys(H.THEMES)) {
        ui.music(id);
        let top = 0;
        for (let i = 0; i < 12; i++) {
          await wait(70);
          top = Math.max(top, peak());
        }
        themes[id] = Math.round(top * 1000) / 1000;
      }
      ui.sound.stop();
      await wait(900);
      const quiet = peak();
      const sounds = {};
      for (const [name, arg] of [['click'], ['pop'], ['coin'], ['step', 'forest'], ['step', 'saltflat'], ['hit', { kind: 'melee' }], ['hit', { kind: 'spell' }], ['hit', { kind: 'bell', unit: 'ringer' }], ['hit', { kind: 'melee', unit: 'halberdier' }], ['hit', { kind: 'melee', unit: 'horseguard' }], ['shot'], ['shot', 'crossbow'], ['shot', 'cuirassier'], ['shot', 'mortar'], ['shot', 'bombard'], ['shot', 'horsebow'], ['shot', 'stormkhan'], ['hit', { kind: 'melee', unit: 'bonebull' }], ['hit', { kind: 'melee', unit: 'shade' }], ['death', 'stonewoman'], ['death', 'shade'], ['death'], ['death', 'plated'], ['death', 'aeronaut'], ['death', 'horseguard'], ['death', 'bombard'], ['cast']]) {
        ui.sfx(name, arg);
        let top = 0;
        for (let i = 0; i < 5; i++) {
          await wait(16);
          top = Math.max(top, peak());
        }
        sounds[name + (arg ? ':' + (typeof arg === 'string' ? arg : arg.kind + (arg.unit ? '/' + arg.unit : '')) : '')] = Math.round(top * 1000) / 1000;
        await wait(120);
      }
      await wait(800);
      ui.settings.music = 0;
      ui.saveSettings();
      ui.music('battle');
      let muted = 0;
      for (let i = 0; i < 8; i++) {
        await wait(70);
        muted = Math.max(muted, peak());
      }
      ui.settings.music = 0.6;
      ui.saveSettings();
      const state = ctx.state, before = Object.assign({}, H.live);
      ui.destroy();
      return { state, themes, quiet: Math.round(quiet * 1000) / 1000, sounds, muted: Math.round(muted * 1000) / 1000, before, after: Object.assign({}, H.live), closed: ctx.state, cleared: ui.sound === null };
    })()`);
    log.push('sound: ' + JSON.stringify(r));
    for (const [id, v] of Object.entries(r.themes)) if (!(v > 0.01)) throw new Error('theme is silent: ' + id);
    for (const [id, v] of Object.entries(r.sounds)) if (!(v > 0.005)) throw new Error('sound is silent: ' + id);
    if (r.muted > 0.001) throw new Error('music volume 0 still plays');
    if (r.after.audio !== 0 || !r.cleared) throw new Error('the audio context was not released');
  },
  async game(cdp, out, log) {
    const press = id => cdp.eval(`(() => { const v = heui.view, r = (v.regions || []).find(q => q.id === ${JSON.stringify(id)}); if (!r) return false; v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); return true; })()`);
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'title.png'), '.he-canvas');
    await cdp.eval(`heui.view.press('new'), true`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'title-new.png'), '.he-canvas');
    await cdp.eval(`heui.view.press('scenario'), true`);
    await cdp.until('heui.view instanceof Heroes98.SetupView', 5000);
    await frames(cdp, 2);
    if (!(await press('map-mesha'))) throw new Error('the medium map is not in the list');
    await frames(cdp, 2);
    if (!(await press('fac-1'))) throw new Error('no people button');
    await frames(cdp, 2);
    await press('diff-hard');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'setup.png'), '.he-canvas');
    await press('diff-normal');
    await frames(cdp, 2);
    await cdp.eval(`heui.view.seed = 7, heui.view.start(), true`);
    await cdp.until('heui.view instanceof Heroes98.MapView', 5000);
    await frames(cdp, 3);
    const opened = await cdp.eval(`({ players: heui.view.S.players.map(p => p.faction + (p.human ? ':human' : ':ai')), towns: Heroes98.Town.list(heui.view.S).length, pid: heui.view.pid, sel: heui.view.hero().owner })`);
    log.push('game opened: ' + JSON.stringify(opened));
    if (opened.sel !== opened.pid) throw new Error('the selected hero is not the human one');
    await cdp.shot(path.join(out, 'game-map.png'), '.he-canvas');
    await cdp.key('F5', 'F5', 116);
    await cdp.until(`Heroes98.Save.list().then(l => l.some(m => m.id === 'q'))`, 8000);
    const hash = await cdp.eval('Heroes98.Save.hash(heui.game.S)');
    await cdp.eval(`heui.view.press('end'), true`);
    await frames(cdp, 2);
    if (await cdp.eval('!!heui.view.modal')) await cdp.eval(`heui.view.closeModal('yes'), true`);
    await cdp.until('heui.view.ai', 3000);
    await cdp.shot(path.join(out, 'game-ai-turn.png'), '.he-canvas');
    await cdp.until('heui.view.S.turn === heui.view.pid && !heui.view.ai', 120000);
    const after = await cdp.eval(`({ day: heui.view.S.day, slots: 0 })`);
    log.push('after the AI turn: ' + JSON.stringify(after));
    if (after.day !== 2) throw new Error('the day did not change after the AI turn');
    await cdp.until(`Heroes98.Save.list().then(l => l.some(m => m.id[0] === 'a'))`, 8000);
    await cdp.eval(`heui.openMenu(), true`);
    await frames(cdp, 2);
    const items = await cdp.eval(`[...document.querySelectorAll('.he-btn')].map(b => b.textContent)`);
    log.push('menu: ' + JSON.stringify(items));
    await cdp.shot(path.join(out, 'game-menu.png'), '.he-page-game');
    await cdp.eval(`[...document.querySelectorAll('.he-btn')].find(b => b.textContent === 'Сохранить').click(), true`);
    await cdp.until('heui.view instanceof Heroes98.SaveView', 5000);
    await frames(cdp, 4);
    await press('slot-m1');
    await cdp.until('heui.view instanceof Heroes98.MapView', 8000);
    await cdp.eval(`heui.openMenu(), [...document.querySelectorAll('.he-btn')].find(b => b.textContent === 'Загрузить').click(), true`);
    await cdp.until('heui.view instanceof Heroes98.SaveView && Object.keys(heui.view.metas).length >= 3', 8000);
    await frames(cdp, 6);
    await cdp.shot(path.join(out, 'game-load.png'), '.he-canvas');
    await press('slot-q');
    await cdp.until('heui.view instanceof Heroes98.MapView && heui.game.S.day === 1', 8000);
    const loaded = await cdp.eval('Heroes98.Save.hash(heui.game.S)');
    log.push('quick save hash ' + hash + ', after load ' + loaded);
    if (loaded !== hash) throw new Error('the loaded game differs from the saved one');
    await cdp.eval(`heui.openMenu(), [...document.querySelectorAll('.he-btn')].find(b => b.textContent === 'Настройки').click(), true`);
    await cdp.until('heui.view instanceof Heroes98.SettingsView', 5000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'settings.png'), '.he-canvas');
    await cdp.key('Escape', 'Escape', 27);
    await cdp.until('heui.view instanceof Heroes98.MapView', 5000);
    const duel = await cdp.eval(`(() => {
      const v = heui.view, S = v.S, me = v.hero(), foe = S.heroes.find(h => h.alive && h.owner !== v.pid), H = Heroes98;
      foe.c = me.c + 2;
      foe.r = me.r + 1;
      foe.army = [{ unit: foe.faction === 'league' ? 'militia' : 'shade', count: 8, stars: 0, vet: 0 }, null, null, null, null, null, null];
      S.ver++;
      v.refresh();
      const p = H.Adv.path(S, me, foe.c, foe.r);
      v.plan = Object.assign({}, p, { goal: [foe.c, foe.r], steps: p.steps.map(s => ({ ...s })) });
      v.go();
      return { kind: p.kind, steps: p.steps.length, here: !!p.here };
    })()`);
    log.push('duel path: ' + JSON.stringify(duel));
    if (duel.kind !== 'duel') throw new Error('the path to an enemy hero is not a duel');
    await cdp.until('!!heui.view.modal', 15000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'game-duel.png'), '.he-canvas');
    await cdp.eval(`heui.view.closeModal('fight'), true`);
    await cdp.until('heui.view instanceof Heroes98.BattleView', 5000);
    await frames(cdp, 3);
    await cdp.key('F5', 'F5', 116);
    await frames(cdp, 10);
    await cdp.key('F6', 'F6', 117);
    await cdp.until('heui.view instanceof Heroes98.BattleView && heui.game.S.battle', 8000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'game-battle-loaded.png'), '.he-canvas');
    await cdp.eval('heui.view.quick(), true');
    await cdp.until('!!heui.view.result', 30000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'game-battle-result.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, b = v.resultButtons[0]; v.pointer('down', b.x + 2, b.y + 2, 0); return true; })()`);
    for (let i = 0; i < 20; i++) {
      await frames(cdp, 2);
      const leveling = await cdp.eval(`(() => { const v = heui.view; if (!(v instanceof Heroes98.LevelView)) return false; const r = v.regions.find(q => q.act); if (r) { v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); } return true; })()`);
      if (!leveling) break;
    }
    await cdp.until('heui.view instanceof Heroes98.MapView', 5000);
    const raid = await cdp.eval(`(() => {
      const v = heui.view, S = v.S, me = v.hero(), foe = S.heroes.find(h => h.alive && h.owner !== v.pid);
      if (!foe) return null;
      foe.c = me.c + 2;
      foe.r = me.r + 1;
      foe.army = [{ unit: 'stonekhan', count: 6, stars: 0, vet: 0 }, null, null, null, null, null, null];
      foe.steps = 18;
      for (const h of S.heroes) if (h.alive && h.owner === foe.owner && h !== foe) h.alive = false;
      for (const h of S.heroes) if (h.alive && h.owner !== v.pid && h.owner !== foe.owner) h.alive = false;
      S.ver++;
      v.ui.settings.confirm = false;
      v.press('end');
      return { foe: foe.owner, hero: me.id };
    })()`);
    log.push('AI raid: ' + JSON.stringify(raid));
    if (raid) {
      await cdp.until(`heui.view instanceof Heroes98.MapView && heui.view.modal && heui.view.modal.title === 'Враг нападает!'`, 60000);
      await frames(cdp, 2);
      await cdp.shot(path.join(out, 'game-raid.png'), '.he-canvas');
      await cdp.eval(`heui.view.closeModal('fight'), true`);
      await cdp.until('heui.view instanceof Heroes98.BattleView', 5000);
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'game-raid-battle.png'), '.he-canvas');
      const side = await cdp.eval('heui.view.player');
      log.push('AI raid battle: human side ' + side);
      if (side !== 1) throw new Error('the human does not defend on the right');
      await cdp.eval('heui.view.quick(), true');
      await cdp.until('!!heui.view.result', 30000);
      await cdp.eval(`(() => { const v = heui.view, b = v.resultButtons[0]; v.pointer('down', b.x + 2, b.y + 2, 0); return true; })()`);
      await cdp.until('heui.view instanceof Heroes98.MapView', 5000);
      await cdp.until('heui.view instanceof Heroes98.ResultView || (heui.view instanceof Heroes98.MapView && (!!heui.view.modal || (heui.view.S.turn === heui.view.pid && !heui.view.ai)))', 60000);
      await frames(cdp, 3);
      const state = await cdp.eval(`({ result: heui.view instanceof Heroes98.ResultView, win: heui.view.win, alive: heui.view.myHeroes ? heui.view.myHeroes().length : 0, day: heui.view.S.day })`);
      log.push('after the raid: ' + JSON.stringify(state));
      await cdp.shot(path.join(out, 'game-after-raid.png'), '.he-canvas');
      if (state.result && state.win) throw new Error('the human side won a raid that could not be won');
    }
    await cdp.eval(`heui.loadFrom('m1'), true`);
    await cdp.until('heui.view instanceof Heroes98.MapView && heui.game && heui.game.S.day === 2 && !heui.game.S.over', 8000);
    await frames(cdp, 3);
    await cdp.eval(`(() => {
      const v = heui.view, S = v.S;
      for (const p of S.players) if (p.id !== v.pid) { for (const h of S.heroes) if (h.owner === p.id) h.alive = false; for (const o of S.map.objs) if (o.t === 'town' && o.owner === p.id) o.owner = -1; }
      Heroes98.Adv.conclude(S, []);
      return true;
    })()`);
    await cdp.until('heui.view instanceof Heroes98.ResultView', 8000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'game-result.png'), '.he-canvas');
    const res = await cdp.eval('({ win: heui.view.win, score: heui.view.score })');
    log.push('result: ' + JSON.stringify(res));
    if (!res.win) throw new Error('the result screen does not show the win');
    await cdp.eval(`(() => { const v = heui.view, r = v.regions.find(q => q.id === 'menu'); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.TitleView', 5000);
    await frames(cdp, 4);
    if (!(await cdp.eval('!!heui.view.last'))) throw new Error('the title does not see the saves');
    await cdp.shot(path.join(out, 'title-continue.png'), '.he-canvas');
  },
  async boot(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 5');
    await frames(cdp, 3);
    const info = await cdp.eval('({ frames: heui.frames, ticks: heui.ticks, view: heui.screen, size: [heui.gfx.canvas.width, heui.gfx.canvas.height], live: Heroes98.live, start: heui.view instanceof Heroes98.TitleView })');
    log.push('boot: ' + JSON.stringify(info));
    if (info.size[0] !== 800 || info.size[1] !== 600) throw new Error('canvas is not 800x600');
    if (info.ticks < 3) throw new Error('logic does not run');
    if (!info.start) throw new Error('the game does not open on the title screen');
    await cdp.shot(path.join(out, 'boot.png'), '.he-canvas');
    await cdp.eval('heui.showTrials(), true');
    await frames(cdp, 2);
    await cdp.key('Escape', 'Escape', 27);
    await frames(cdp, 2);
    const menu = await cdp.eval('({ open: !!heui.menu, paused: heui.paused, items: [...document.querySelectorAll(".he-btn")].map(b => b.textContent) })');
    log.push('menu: ' + JSON.stringify(menu));
    if (!menu.open || !menu.paused) throw new Error('Esc did not open the paused menu');
    const ticks = await cdp.eval('heui.ticks');
    await frames(cdp, 10);
    if (await cdp.eval('heui.ticks') !== ticks) throw new Error('logic runs while the menu is open');
    await cdp.shot(path.join(out, 'menu.png'), '.he-page-game');
    await cdp.key('Escape', 'Escape', 27);
    await frames(cdp, 2);
    if (await cdp.eval('!!heui.menu')) throw new Error('Esc did not close the menu');
  },
  async battle(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    await cdp.eval('heui.showTrials(), true');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'trials.png'), '.he-canvas');
    await cdp.eval('heui.startTrial(0), true');
    await cdp.until('heui.view.B && (heui.view.mine() || heui.view.B.winner >= 0)', 30000);
    const aim = `(() => { const v = heui.view, H = Heroes98, s = v.mine(); if (!s) return null; for (const foe of H.Battle.alive(v.B).filter(t => t.side !== s.side)) { const p = H.BattleDraw.stackPos(foe); v.pointer('move', p[0], p[1] - 4, 0); if (v.hover && v.hover.fc) return { unit: s.unit, foe: foe.unit, hover: v.hover.kind, fc: v.hover.fc }; } return { unit: s.unit, none: true }; })()`;
    let first = null;
    for (let i = 0; i < 12; i++) {
      first = await cdp.eval(aim);
      if (first && !first.none) break;
      await cdp.eval('heui.view.press("defend"), true');
      await cdp.until('heui.view.B.winner >= 0 || heui.view.mine()', 30000);
    }
    log.push('battle aim: ' + JSON.stringify(first));
    if (!first.hover || !first.fc) throw new Error('no forecast on an enemy');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'battle.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, p = Heroes98.BattleDraw.stackPos(v.B.stacks[v.B.active]); v.pointer('down', p[0], p[1] - 4, 2); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'info.png'), '.he-canvas');
    await cdp.eval(`heui.view.pointer('up', 0, 0, 2), true`);
    await cdp.eval(aim);
    await cdp.eval(`(() => { const v = heui.view, m = v.mouse; v.pointer('down', m[0], m[1], 0); return true; })()`);
    await frames(cdp, 12);
    await cdp.shot(path.join(out, 'battle-hit.png'), '.he-canvas');
    await cdp.until('heui.view.B.winner >= 0 || heui.view.mine()', 30000);
    await cdp.eval('heui.view.press("quick"), true');
    await cdp.until('!!heui.view.result', 30000);
    await frames(cdp, 3);
    const res = await cdp.eval('({ result: heui.view.result, log: heui.view.log.length })');
    log.push('battle result: ' + JSON.stringify({ winner: res.result.winner, round: res.result.round, xp: res.result.xp, log: res.log }));
    await cdp.shot(path.join(out, 'result.png'), '.he-canvas');
  },
  async style(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    for (let p = 0; p < 4; p++) {
      await cdp.eval(`heui.show(new Heroes98.StyleSheet(heui, ${p})), true`);
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'style-' + (p + 1) + '.png'), '.he-canvas');
    }
    log.push('style: ' + JSON.stringify(await cdp.eval('({ pictures: Heroes98.Art.all().length, files: Object.keys(Heroes98.Art.FILES).length })')));
  },
  async map(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    await cdp.eval('heui.startMap(), true');
    await frames(cdp, 4);
    await cdp.shot(path.join(out, 'map.png'), '.he-canvas');
    const at = 'const at = (c, r) => [c * 32 + 16 - v.cam.x, 24 + r * 32 + 16 - v.cam.y];';
    await cdp.eval(`(() => { const v = heui.view; ${at} const p = at(4, 43); v.pointer('move', p[0], p[1], 0); v.pointer('down', p[0], p[1], 0); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'map-path.png'), '.he-canvas');
    const planned = await cdp.eval('heui.view.plan && heui.view.plan.steps.length');
    if (!planned) throw new Error('no path to the wood pile');
    await cdp.eval('heui.view.go(), true');
    await cdp.until('!heui.view.moving && !heui.view.anim', 20000);
    const wood = await cdp.eval('heui.view.S.players[0].res.wood');
    log.push('map walk: wood ' + wood);
    if (wood <= 20) throw new Error('the pile was not picked up');
    await cdp.eval(`(() => { const v = heui.view; ${at} const p = at(9, 38); v.pointer('down', p[0], p[1], 2); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'map-info.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.pointer('up', 0, 0, 2); const h = v.hero(); h.c = 13; h.r = 37; v.S.ver++; Heroes98.Adv.reveal(v.S, 0, 0, 13, 37, 5); v.center(h); ${at} const p = at(16, 34); v.pointer('move', p[0], p[1], 0); v.pointer('down', p[0], p[1], 0); v.go(); return true; })()`);
    await cdp.until('!!heui.view.modal', 20000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'map-encounter.png'), '.he-canvas');
    const pend = await cdp.eval('({ title: heui.view.modal.title, lines: heui.view.modal.lines, buttons: heui.view.modal.buttons.map(b => b.id) })');
    log.push('map encounter: ' + JSON.stringify(pend));
    await cdp.eval(`(() => { const v = heui.view, m = v.modal; v.modal = null; m.pick('fight'); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.BattleView', 10000);
    await cdp.eval('heui.view.quick(), true');
    await cdp.until('!!heui.view.result', 20000);
    await cdp.eval(`(() => { const v = heui.view, b = v.resultButtons[0]; v.pointer('down', b.x + 2, b.y + 2, 0); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.MapView', 10000);
    await frames(cdp, 3);
    const after = await cdp.eval('({ xp: heui.view.hero().xp, alive: heui.view.hero().alive, army: heui.view.hero().army.filter(Boolean).map(s => s.unit + ":" + s.count) })');
    log.push('map after battle: ' + JSON.stringify(after));
    await cdp.shot(path.join(out, 'map-after.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.modal = null; v.press('end'); if (v.modal) { const m = v.modal; v.modal = null; m.pick('yes'); } return v.S.day; })()`);
    await frames(cdp, 3);
    const day = await cdp.eval('heui.view.S.day');
    log.push('map day: ' + day);
    if (day !== 2) throw new Error('end of day did not work');
    await cdp.shot(path.join(out, 'map-day2.png'), '.he-canvas');
  },
  async 'campaign-1'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    const press = id => `(() => { const v = heui.view, r = v.regions.find(q => q.id === ${JSON.stringify(id)}); if (!r) throw new Error('no region ' + ${JSON.stringify(id)}); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`;
    await cdp.eval(`(() => { Heroes98.Campaign.reset(); const v = heui.view; v.page = 'new'; v.press('campaign'); return heui.view.constructor.name; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-1-map.png'), '.he-canvas');
    await cdp.eval(press('camp-nabat'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-1-card.png'), '.he-canvas');
    await cdp.eval(press('card-normal'));
    await frames(cdp, 2);
    await cdp.eval(press('card-play'));
    await frames(cdp, 3);
    const slide = await cdp.eval('heui.view.constructor.name');
    log.push('after play: ' + slide);
    if (slide !== 'SlidesView') throw new Error('the opening did not start');
    await cdp.shot(path.join(out, 'campaign-1-opening.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-1-brief.png'), '.he-canvas');
    await cdp.eval(press('bonus-1'));
    await frames(cdp, 2);
    await cdp.eval(press('brief-go'));
    await cdp.until('!!heui.game && !!heui.game.S.scene', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-1-scene.png'), '.he-canvas');
    const first = await cdp.eval(`(() => { const v = heui.game, S = v.S; let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { lines: n, gold: S.players[0].res.gold, goals: S.script.goals.map(g => g.text), campaign: S.campaign.id }; })()`);
    log.push('mission 1: ' + JSON.stringify(first));
    if (first.goals.length !== 3) throw new Error('the goals of mission 1 did not appear');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-1-m1.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.game; v.kingdom = { tab: 'goals' }; return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-1-goals.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.game.kingdom = null; return true; })()`);
    const missions = await cdp.eval('Heroes98.Campaign.get("nabat").missions.length');
    for (let i = 0; i < missions; i++) {
      const won = await cdp.eval(`(() => {
        const v = heui.game, S = v.S, h = Heroes98.Campaign.heroOf(S);
        Heroes98.Hero.giveArt(h, 'saltring');
        Heroes98.Hero.giveArt(h, 'quilted');
        S.over = { winner: 0, why: 'script' };
        v.finish();
        return heui.view.constructor.name;
      })()`);
      if (won !== 'MissionEndView') throw new Error('no mission end screen, got ' + won);
      await frames(cdp, 3);
      if (i === 0) await cdp.shot(path.join(out, 'campaign-1-end.png'), '.he-canvas');
      await cdp.eval(press('end-go'));
      await frames(cdp, 3);
      if (i === missions - 1) break;
      await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
      await frames(cdp, 2);
      await cdp.shot(path.join(out, 'campaign-1-brief' + (i + 2) + '.png'), '.he-canvas');
      await cdp.eval(press('brief-go'));
      await cdp.until('!!heui.game && !!heui.game.S && heui.game.S.campaign.mission === ' + (i + 1), 15000);
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-1-scene' + (i + 2) + '.png'), '.he-canvas');
      const st = await cdp.eval(`(() => { const v = heui.game, S = v.S, h = Heroes98.Campaign.heroOf(S); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { level: h.level, cap: h.levelCap, arts: Object.values(h.arts).filter(Boolean).length + h.bag.length, goals: S.script.goals.length, day: S.day }; })()`);
      log.push('mission ' + (i + 2) + ': ' + JSON.stringify(st));
      if (!st.goals) throw new Error('mission ' + (i + 2) + ' has no goals');
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-1-m' + (i + 2) + '.png'), '.he-canvas');
    }
    const finale = await cdp.eval('heui.view.constructor.name');
    log.push('after the last mission: ' + finale);
    if (finale !== 'SlidesView') throw new Error('the ending did not start');
    await cdp.shot(path.join(out, 'campaign-1-ending.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-1-done.png'), '.he-canvas');
    const after = await cdp.eval(`(() => { const C = Heroes98.Campaign; return { finished: C.finished('nabat'), next: C.isOpen('sol'), view: heui.view.constructor.name, stored: !!localStorage.getItem('heroes98_campaigns') }; })()`);
    log.push('after the campaign: ' + JSON.stringify(after));
    if (!after.finished || !after.next || after.view !== 'CampaignView' || !after.stored) throw new Error('the campaign did not finish');
    await cdp.eval(`(() => { const C = Heroes98.Campaign; C.reset(); return true; })()`);
    await cdp.eval(press('camp-nabat'));
    await frames(cdp, 2);
    await cdp.eval(press('card-play'));
    await frames(cdp, 2);
    await cdp.eval(press('slide-skip'));
    await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
    await frames(cdp, 3);
    await cdp.eval(press('brief-go'));
    await cdp.until('!!heui.game && !!heui.game.S.scene', 15000);
    await cdp.eval(`(() => { const v = heui.game, S = v.S; let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); S.over = { winner: -1, why: 'lost' }; v.finish(); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-1-lost.png'), '.he-canvas');
    await cdp.eval(press('end-again'));
    await cdp.until('heui.view.constructor.name === "BriefView"', 5000);
    await frames(cdp, 2);
    await cdp.eval(press('brief-back'));
    await frames(cdp, 3);
    await cdp.eval(`(() => { Heroes98.Campaign.reset(); return true; })()`);
  },
  async 'campaign-2'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    const press = id => `(() => { const v = heui.view, r = v.regions.find(q => q.id === ${JSON.stringify(id)}); if (!r) throw new Error('no region ' + ${JSON.stringify(id)}); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`;
    await cdp.eval(`(() => { const C = Heroes98.Campaign; C.reset(); const r = C.begin('nabat', 'easy'); r.done = [0, 1, 2, 3, 4]; r.finished = true; r.flags = { letters_sent: 1, aisulu_led: 1 }; const v = heui.view; v.page = 'new'; v.press('campaign'); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-2-map.png'), '.he-canvas');
    await cdp.eval(press('camp-sol'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-2-card.png'), '.he-canvas');
    await cdp.eval(press('card-normal'));
    await frames(cdp, 2);
    await cdp.eval(press('card-play'));
    await frames(cdp, 3);
    if (await cdp.eval('heui.view.constructor.name') !== 'SlidesView') throw new Error('the opening did not start');
    await cdp.shot(path.join(out, 'campaign-2-opening.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-2-brief.png'), '.he-canvas');
    await cdp.eval(press('bonus-1'));
    await frames(cdp, 2);
    await cdp.eval(press('brief-go'));
    await cdp.until('!!heui.game && !!heui.game.S.scene', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-2-scene.png'), '.he-canvas');
    const first = await cdp.eval(`(() => { const v = heui.game, S = v.S; let n = 0, spirit = false; while (S.scene && n++ < 200) { if (S.scene.who === 'spirit') spirit = true; v.sceneNext(0); } return { lines: n, spirit, goals: S.script.goals.map(g => g.id), kept: S.campaign.flags }; })()`);
    log.push('mission 1: ' + JSON.stringify(first));
    if (first.goals.length !== 4 || !first.spirit) throw new Error('mission 1 did not read the first campaign');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-2-m1.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.game; v.kingdom = { tab: 'goals' }; return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-2-goals.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.game.kingdom = null; return true; })()`);
    for (let i = 0; i < 5; i++) {
      const won = await cdp.eval(`(() => { const v = heui.game, S = v.S; S.over = { winner: 0, why: 'script' }; v.finish(); return heui.view.constructor.name; })()`);
      if (won !== 'MissionEndView') throw new Error('no mission end screen, got ' + won);
      await frames(cdp, 3);
      if (i === 0) await cdp.shot(path.join(out, 'campaign-2-end.png'), '.he-canvas');
      await cdp.eval(press('end-go'));
      await frames(cdp, 3);
      if (i === 4) break;
      await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
      await frames(cdp, 2);
      await cdp.shot(path.join(out, 'campaign-2-brief' + (i + 2) + '.png'), '.he-canvas');
      await cdp.eval(press('brief-go'));
      await cdp.until('!!heui.game && !!heui.game.S && heui.game.S.campaign.mission === ' + (i + 1), 15000);
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-2-scene' + (i + 2) + '.png'), '.he-canvas');
      const st = await cdp.eval(`(() => { const v = heui.game, S = v.S, h = Heroes98.Campaign.heroOf(S); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { level: h.level, cap: h.levelCap, goals: S.script.goals.length, day: S.day, team: S.players.map(p => p.team) }; })()`);
      log.push('mission ' + (i + 2) + ': ' + JSON.stringify(st));
      if (!st.goals) throw new Error('mission ' + (i + 2) + ' has no goals');
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-2-m' + (i + 2) + '.png'), '.he-canvas');
      if (i === 2) {
        const seen = await cdp.eval(`(() => { const v = heui.game, S = v.S, o = S.map.objs.find(x => x.tag === 'order'), from = [o.c, o.r]; v.center(o); return { from, seen: !!S.players[0].seen[0][o.r * S.map.w + o.c] }; })()`);
        log.push('wagons at the start: ' + JSON.stringify(seen));
        if (!seen.seen) throw new Error('the wagons are not shown at the start');
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-2-wagons.png'), '.he-canvas');
        const moved = await cdp.eval(`(() => { const H = Heroes98, v = heui.game, S = v.S; H.Adv.endTurn(S); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); const o = S.map.objs.find(x => x.tag === 'order'); v.center(o); return { c: o.c, r: o.r, day: S.day, seen: !!S.players[0].seen[0][o.r * S.map.w + o.c] }; })()`);
        log.push('wagons after a day: ' + JSON.stringify(moved));
        if (moved.day !== 2 || moved.c === 74 && moved.r === 60 || !moved.seen) throw new Error('the wagons did not move into sight');
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-2-wagons2.png'), '.he-canvas');
      }
      if (i === 3) {
        const asked = await cdp.eval(`(() => { const H = Heroes98, v = heui.game, S = v.S, h = H.Campaign.heroOf(S), o = S.map.objs.find(x => x.tag === 'v1'), e = H.MapData.entry(o); S.players[0].seen[0].fill(1); h.c = e[0]; h.r = e[1]; v.center(h); H.OBJ_VISIT.hamlet(S, h, o, []); return S.pending && S.pending.site; })()`);
        if (asked !== 'hamlet') throw new Error('the village did not ask');
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-2-village.png'), '.he-canvas');
        const looted = await cdp.eval(`(() => { const v = heui.game, S = v.S, gold = S.players[0].res.gold, b = v.modal.buttons.find(o => o.id === 'take'); v.pointer('move', b.x + 4, b.y + 4, 0); v.pointer('down', b.x + 4, b.y + 4, 0); v.pointer('up', b.x + 4, b.y + 4, 0); return { gold: S.players[0].res.gold - gold, done: S.map.objs.find(x => x.tag === 'v1').done, scene: S.scene && S.scene.who, spare: S.script.goals.find(g => g.id === 'spare').state }; })()`);
        log.push('village looted: ' + JSON.stringify(looted));
        if (looted.gold !== 1500 || !looted.done || !looted.done.includes(0)) throw new Error('the village did not pay');
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-2-touch.png'), '.he-canvas');
        const ally = await cdp.eval(`(() => { const H = Heroes98, v = heui.game, S = v.S; let n = 0; while (S.scene && n++ < 50) v.sceneNext(0); const k = S.heroes.find(x => x.hid === 'kaidar'); v.center(k); S.players[0].seen[0].fill(1); v.vis = H.Adv.visible(S, 0, 0); const what = v.whatAt(k.c, k.r); return { allied: H.Adv.allied(S, 0, 1), foe: H.Adv.allied(S, 0, 2), name: k.name, spare: S.script.goals.find(g => g.id === 'spare').state, text: what && what.text, modal: !!v.modal }; })()`);
        log.push('ally: ' + JSON.stringify(ally));
        if (!ally.allied || ally.foe || ally.spare !== 'fail' || ally.modal) throw new Error('the teams or the optional goal did not work');
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-2-khan.png'), '.he-canvas');
      }
    }
    if (await cdp.eval('heui.view.constructor.name') !== 'SlidesView') throw new Error('the ending did not start');
    await cdp.shot(path.join(out, 'campaign-2-ending.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-2-done.png'), '.he-canvas');
    const after = await cdp.eval(`(() => { const C = Heroes98.Campaign; return { finished: C.finished('sol'), next: C.isOpen('zapoved'), view: heui.view.constructor.name }; })()`);
    log.push('after the campaign: ' + JSON.stringify(after));
    if (!after.finished || !after.next || after.view !== 'CampaignView') throw new Error('the campaign did not finish');
    await cdp.eval(`(() => { Heroes98.Campaign.reset(); return true; })()`);
  },
  async 'campaign-3'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    const press = id => `(() => { const v = heui.view, r = v.regions.find(q => q.id === ${JSON.stringify(id)}); if (!r) throw new Error('no region ' + ${JSON.stringify(id)}); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`;
    await cdp.eval(`(() => { const C = Heroes98.Campaign; C.reset(); const a = C.begin('nabat', 'easy'); a.done = [0, 1, 2, 3, 4]; a.finished = true; const b = C.begin('sol', 'easy'); b.done = [0, 1, 2, 3, 4]; b.finished = true; b.flags = { spared_villages: 1, kaidar_host: 1 }; const v = heui.view; v.page = 'new'; v.press('campaign'); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-3-map.png'), '.he-canvas');
    await cdp.eval(press('camp-zapoved'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-3-card.png'), '.he-canvas');
    await cdp.eval(press('card-normal'));
    await frames(cdp, 2);
    await cdp.eval(press('card-play'));
    await frames(cdp, 3);
    if (await cdp.eval('heui.view.constructor.name') !== 'SlidesView') throw new Error('the opening did not start');
    await cdp.shot(path.join(out, 'campaign-3-opening.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-3-brief.png'), '.he-canvas');
    await cdp.eval(press('bonus-1'));
    await frames(cdp, 2);
    await cdp.eval(press('brief-go'));
    await cdp.until('!!heui.game && !!heui.game.S.scene', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-3-scene.png'), '.he-canvas');
    const first = await cdp.eval(`(() => { const v = heui.game, S = v.S; let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { lines: n, goals: S.script.goals.map(g => g.id), kept: S.campaign.flags }; })()`);
    log.push('mission 1: ' + JSON.stringify(first));
    if (first.goals.length !== 4) throw new Error('the goals of mission 1 did not appear');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-3-m1.png'), '.he-canvas');
    for (let i = 0; i < 5; i++) {
      const won = await cdp.eval(`(() => { const v = heui.game, S = v.S; S.over = { winner: 0, why: 'script' }; v.finish(); return heui.view.constructor.name; })()`);
      if (won !== 'MissionEndView') throw new Error('no mission end screen, got ' + won);
      await frames(cdp, 3);
      if (i === 0) await cdp.shot(path.join(out, 'campaign-3-end.png'), '.he-canvas');
      await cdp.eval(press('end-go'));
      await frames(cdp, 3);
      if (i === 4) break;
      await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
      await frames(cdp, 2);
      await cdp.shot(path.join(out, 'campaign-3-brief' + (i + 2) + '.png'), '.he-canvas');
      await cdp.eval(press('brief-go'));
      await cdp.until('!!heui.game && !!heui.game.S && heui.game.S.campaign.mission === ' + (i + 1), 15000);
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-3-scene' + (i + 2) + '.png'), '.he-canvas');
      const st = await cdp.eval(`(() => { const v = heui.game, S = v.S, h = Heroes98.Campaign.heroOf(S); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { level: h.level, cap: h.levelCap, goals: S.script.goals.length, day: S.day, team: S.players.map(p => p.team) }; })()`);
      log.push('mission ' + (i + 2) + ': ' + JSON.stringify(st));
      if (!st.goals) throw new Error('mission ' + (i + 2) + ' has no goals');
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-3-m' + (i + 2) + '.png'), '.he-canvas');
      if (i === 0) {
        const burned = await cdp.eval(`(() => { const H = Heroes98, v = heui.game, S = v.S, b = S.heroes.find(x => x.hid === 'borovoy'), o = S.map.objs.find(x => x.tag === 'v1'), allied = H.Adv.allied(S, 0, 1); S.day = 10; S.script.done = S.script.done.filter(i => H.Script.eventsOf(S.map)[i].on !== 'day' || H.Script.eventsOf(S.map)[i].day !== 10); H.Script.poll(S, []); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); H.OBJ_VISIT.hamlet(S, b, o, []); H.Script.poll(S, []); while (S.scene && n++ < 400) v.sceneNext(0); return { allied, after: H.Adv.allied(S, 0, 1), gone: !!o.gone, goals: S.script.goals.map(g => g.id + ':' + g.state) }; })()`);
        log.push('Боровой turns: ' + JSON.stringify(burned));
        if (!burned.allied || burned.after || !burned.gone) throw new Error('Боровой did not turn on the player');
      }
      if (i === 2) {
        const f = await cdp.eval(`(() => { const v = heui.game, S = v.S, a = S.map.objs.find(x => x.tag === 'shore'); S.players[0].seen[0].fill(1); v.vis = Heroes98.Adv.visible(S, 0, 0); v.center(a); return { link: a.link, to: S.map.objs.find(o => o.id === a.link).c }; })()`);
        log.push('ferry: ' + JSON.stringify(f));
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-3-lake.png'), '.he-canvas');
      }
    }
    if (await cdp.eval('heui.view.constructor.name') !== 'SlidesView') throw new Error('the ending did not start');
    await cdp.shot(path.join(out, 'campaign-3-ending.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-3-done.png'), '.he-canvas');
    const after = await cdp.eval(`(() => { const C = Heroes98.Campaign; return { finished: C.finished('zapoved'), next: C.isOpen('chasha'), view: heui.view.constructor.name }; })()`);
    log.push('after the campaign: ' + JSON.stringify(after));
    if (!after.finished || !after.next || after.view !== 'CampaignView') throw new Error('the campaign did not finish');
    await cdp.eval(`(() => { Heroes98.Campaign.reset(); return true; })()`);
  },
  async 'campaign-4'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    const press = id => `(() => { const v = heui.view, r = v.regions.find(q => q.id === ${JSON.stringify(id)}); if (!r) throw new Error('no region ' + ${JSON.stringify(id)}); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`;
    await cdp.eval(`(() => { const C = Heroes98.Campaign; C.reset(); const a = C.begin('nabat', 'easy'); a.done = [0, 1, 2, 3, 4]; a.finished = true; const b = C.begin('sol', 'easy'); b.done = [0, 1, 2, 3, 4]; b.finished = true; b.flags = { spared_villages: 1, kaidar_host: 1 }; const z = C.begin('zapoved', 'easy'); z.done = [0, 1, 2, 3, 4]; z.finished = true; z.flags = { branch_given: 1, snake_free: 1 }; const v = heui.view; v.page = 'new'; v.press('campaign'); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-4-map.png'), '.he-canvas');
    await cdp.eval(press('camp-chasha'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-4-card.png'), '.he-canvas');
    await cdp.eval(press('card-normal'));
    await frames(cdp, 2);
    await cdp.eval(press('card-play'));
    await frames(cdp, 3);
    if (await cdp.eval('heui.view.constructor.name') !== 'SlidesView') throw new Error('the opening did not start');
    await cdp.shot(path.join(out, 'campaign-4-opening.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-4-brief.png'), '.he-canvas');
    await cdp.eval(press('bonus-1'));
    await frames(cdp, 2);
    await cdp.eval(press('brief-go'));
    await cdp.until('!!heui.game && !!heui.game.S.scene', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-4-scene.png'), '.he-canvas');
    const first = await cdp.eval(`(() => { const v = heui.game, S = v.S; let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { lines: n, goals: S.script.goals.map(g => g.id), kept: S.campaign.flags }; })()`);
    log.push('mission 1: ' + JSON.stringify(first));
    if (first.goals.length !== 4) throw new Error('the goals of mission 1 did not appear');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-4-m1.png'), '.he-canvas');
    for (let i = 0; i < 5; i++) {
      const won = await cdp.eval(`(() => { const v = heui.game, S = v.S; S.over = { winner: 0, why: 'script' }; v.finish(); return heui.view.constructor.name; })()`);
      if (won !== 'MissionEndView') throw new Error('no mission end screen, got ' + won);
      await frames(cdp, 3);
      if (i === 0) await cdp.shot(path.join(out, 'campaign-4-end.png'), '.he-canvas');
      await cdp.eval(press('end-go'));
      await frames(cdp, 3);
      if (i === 4) break;
      await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
      await frames(cdp, 2);
      await cdp.shot(path.join(out, 'campaign-4-brief' + (i + 2) + '.png'), '.he-canvas');
      await cdp.eval(press('brief-go'));
      await cdp.until('!!heui.game && !!heui.game.S && heui.game.S.campaign.mission === ' + (i + 1), 15000);
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-4-scene' + (i + 2) + '.png'), '.he-canvas');
      const st = await cdp.eval(`(() => { const v = heui.game, S = v.S, h = Heroes98.Campaign.heroOf(S); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { level: h.level, cap: h.levelCap, goals: S.script.goals.length, day: S.day, team: S.players.map(p => p.team) }; })()`);
      log.push('mission ' + (i + 2) + ': ' + JSON.stringify(st));
      if (!st.goals) throw new Error('mission ' + (i + 2) + ' has no goals');
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-4-m' + (i + 2) + '.png'), '.he-canvas');
      if (i === 2) {
        const f = await cdp.eval(`(() => { const v = heui.game, S = v.S, t = S.map.objs.find(x => x.tag === 'shell'); S.players[0].seen[1].fill(1); v.level = 1; v.vis = Heroes98.Adv.visible(S, 0, 1); v.center(t); return { level: t.l, c: t.c }; })()`);
        log.push('Нижний Престол: ' + JSON.stringify(f));
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-4-deep.png'), '.he-canvas');
        await cdp.eval(`(() => { const v = heui.game; v.level = 0; return true; })()`);
      }
      if (i === 3) {
        const ebb = await cdp.eval(`(() => { const H = Heroes98, v = heui.game, S = v.S; S.day = 3; H.Script.poll(S, []); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); S.players[0].seen[0].fill(1); v.vis = H.Adv.visible(S, 0, 0); v.center({ c: 56, r: 56, l: 0 }); return { shoal: H.MapData.terrainAt(S.map, 0, 40, 56).id, reef: H.MapData.terrainAt(S.map, 0, 70, 35).id }; })()`);
        log.push('отлив: ' + JSON.stringify(ebb));
        if (ebb.shoal !== 'sand' || ebb.reef !== 'rock') throw new Error('the ebb did not raise the shoals');
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-4-ebb.png'), '.he-canvas');
      }
    }
    if (await cdp.eval('heui.view.constructor.name') !== 'SlidesView') throw new Error('the ending did not start');
    await cdp.shot(path.join(out, 'campaign-4-ending.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-4-done.png'), '.he-canvas');
    const after = await cdp.eval(`(() => { const C = Heroes98.Campaign; return { finished: C.finished('chasha'), next: C.isOpen('zhar'), view: heui.view.constructor.name }; })()`);
    log.push('after the campaign: ' + JSON.stringify(after));
    if (!after.finished || !after.next || after.view !== 'CampaignView') throw new Error('the campaign did not finish');
    await cdp.eval(`(() => { Heroes98.Campaign.reset(); return true; })()`);
  },
  async 'campaign-5'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    const press = id => `(() => { const v = heui.view, r = v.regions.find(q => q.id === ${JSON.stringify(id)}); if (!r) throw new Error('no region ' + ${JSON.stringify(id)}); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`;
    await cdp.eval(`(() => { const C = Heroes98.Campaign; C.reset(); const a = C.begin('nabat', 'easy'); a.done = [0, 1, 2, 3, 4]; a.finished = true; const b = C.begin('sol', 'easy'); b.done = [0, 1, 2, 3, 4]; b.finished = true; b.flags = { spared_villages: 1, kaidar_host: 1 }; const z = C.begin('zapoved', 'easy'); z.done = [0, 1, 2, 3, 4]; z.finished = true; z.flags = { branch_given: 1, snake_free: 1 }; const w = C.begin('chasha', 'easy'); w.done = [0, 1, 2, 3, 4]; w.finished = true; w.flags = { heart_given: 1, shell_found: 1 }; const v = heui.view; v.page = 'new'; v.press('campaign'); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-5-map.png'), '.he-canvas');
    await cdp.eval(press('camp-zhar'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-5-card.png'), '.he-canvas');
    await cdp.eval(press('card-normal'));
    await frames(cdp, 2);
    await cdp.eval(press('card-play'));
    await frames(cdp, 3);
    if (await cdp.eval('heui.view.constructor.name') !== 'SlidesView') throw new Error('the opening did not start');
    await cdp.shot(path.join(out, 'campaign-5-opening.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-5-brief.png'), '.he-canvas');
    await cdp.eval(press('bonus-1'));
    await frames(cdp, 2);
    await cdp.eval(press('brief-go'));
    await cdp.until('!!heui.game && !!heui.game.S.scene', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-5-scene.png'), '.he-canvas');
    const first = await cdp.eval(`(() => { const v = heui.game, S = v.S; let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { lines: n, goals: S.script.goals.map(g => g.id), kept: S.campaign.flags }; })()`);
    log.push('mission 1: ' + JSON.stringify(first));
    if (first.goals.length !== 4) throw new Error('the goals of mission 1 did not appear');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-5-m1.png'), '.he-canvas');
    for (let i = 0; i < 5; i++) {
      const won = await cdp.eval(`(() => { const v = heui.game, S = v.S; S.over = { winner: 0, why: 'script' }; v.finish(); return heui.view.constructor.name; })()`);
      if (won !== 'MissionEndView') throw new Error('no mission end screen, got ' + won);
      await frames(cdp, 3);
      if (i === 0) await cdp.shot(path.join(out, 'campaign-5-end.png'), '.he-canvas');
      await cdp.eval(press('end-go'));
      await frames(cdp, 3);
      if (i === 4) break;
      await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
      await frames(cdp, 2);
      await cdp.shot(path.join(out, 'campaign-5-brief' + (i + 2) + '.png'), '.he-canvas');
      await cdp.eval(press('brief-go'));
      await cdp.until('!!heui.game && !!heui.game.S && heui.game.S.campaign.mission === ' + (i + 1), 15000);
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-5-scene' + (i + 2) + '.png'), '.he-canvas');
      const st = await cdp.eval(`(() => { const v = heui.game, S = v.S, h = Heroes98.Campaign.heroOf(S); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { level: h.level, cap: h.levelCap, goals: S.script.goals.length, day: S.day, team: S.players.map(p => p.team) }; })()`);
      log.push('mission ' + (i + 2) + ': ' + JSON.stringify(st));
      if (!st.goals) throw new Error('mission ' + (i + 2) + ' has no goals');
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-5-m' + (i + 2) + '.png'), '.he-canvas');
      if (i === 1) {
        const f = await cdp.eval(`(() => { const v = heui.game, S = v.S, t = S.map.objs.find(x => x.tag === 'convoy'); S.players[0].seen[0].fill(1); v.vis = Heroes98.Adv.visible(S, 0, 0); v.center(t); return { route: t.route.length, pace: t.pace }; })()`);
        log.push('обоз: ' + JSON.stringify(f));
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-5-convoy.png'), '.he-canvas');
      }
      if (i === 3) {
        const lava = await cdp.eval(`(() => { const H = Heroes98, v = heui.game, S = v.S; S.day = 8; H.Script.poll(S, []); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); S.players[0].seen[0].fill(1); v.vis = H.Adv.visible(S, 0, 0); v.center({ c: 42, r: 28, l: 0 }); return { at: H.MapData.terrainAt(S.map, 0, 41, 25).id }; })()`);
        log.push('лава: ' + JSON.stringify(lava));
        if (lava.at !== 'lava') throw new Error('the Old Forge did not pour lava');
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-5-lava.png'), '.he-canvas');
      }
    }
    if (await cdp.eval('heui.view.constructor.name') !== 'SlidesView') throw new Error('the ending did not start');
    await cdp.shot(path.join(out, 'campaign-5-ending.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-5-done.png'), '.he-canvas');
    const after = await cdp.eval(`(() => { const C = Heroes98.Campaign; return { finished: C.finished('zhar'), next: C.isOpen('tysyacha'), view: heui.view.constructor.name }; })()`);
    log.push('after the campaign: ' + JSON.stringify(after));
    if (!after.finished || !after.next || after.view !== 'CampaignView') throw new Error('the campaign did not finish');
    await cdp.eval(`(() => { Heroes98.Campaign.reset(); return true; })()`);
  },
  async 'campaign-6'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    const press = id => `(() => { const v = heui.view, r = v.regions.find(q => q.id === ${JSON.stringify(id)}); if (!r) throw new Error('no region ' + ${JSON.stringify(id)}); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`;
    await cdp.eval(`(() => {
      const H = Heroes98, C = H.Campaign;
      C.reset();
      const carried = (hid, level, arts) => { const rec = H.HEROES.find(x => x.id === hid), h = H.Hero.init({ hid, cls: rec.cls, faction: H.CLASSES[rec.cls].faction, level: 1, xp: H.XP_TABLE[level], army: [], c: 0, r: 0, l: 0 }, {}); H.Hero.autoUp({ rs: 5, ver: 0 }, h); return C.carryOf(h, arts); };
      const done = (id, flags, hero) => { const r = C.begin(id, 'easy'); r.done = [0, 1, 2, 3, 4]; r.finished = true; r.flags = flags; r.hero = hero; };
      done('nabat', { aisulu_led: 1, letters_sent: 1 }, carried('adelina', 17, ['bellcuirass']));
      done('sol', { kaidar_host: 1, spared_villages: 1, promised_guilty: 1 }, carried('aisulu', 16, []));
      done('zapoved', { branch_given: 1, snake_alive: 1, villages_kept: 1, zap_paid: 1 }, carried('vedana', 16, []));
      done('chasha', { heart_given: 1, shell_found: 1, merra_spared: 1, pearl_refused: 1 }, carried('naera', 17, []));
      done('zhar', { link_flawed: 1, guilds_sworn: 1, judges_freed: 1 }, carried('irga', 16, []));
      const v = heui.view;
      v.page = 'new';
      v.press('campaign');
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-6-map.png'), '.he-canvas');
    await cdp.eval(press('camp-tysyacha'));
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-6-card.png'), '.he-canvas');
    await cdp.eval(press('card-normal'));
    await frames(cdp, 2);
    await cdp.eval(press('card-play'));
    await frames(cdp, 3);
    if (await cdp.eval('heui.view.constructor.name') !== 'SlidesView') throw new Error('the opening did not start');
    await cdp.shot(path.join(out, 'campaign-6-opening.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-6-brief.png'), '.he-canvas');
    await cdp.eval(press('brief-go'));
    await cdp.until('!!heui.game && !!heui.game.S.scene', 15000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-6-scene.png'), '.he-canvas');
    const first = await cdp.eval(`(() => { const v = heui.game, S = v.S; let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { lines: n, goals: S.script.goals.map(g => g.id), allies: Object.keys(S.campaign.allies) }; })()`);
    log.push('mission 1: ' + JSON.stringify(first));
    if (first.goals.length !== 3 || first.allies.length !== 5) throw new Error('mission 1 has no goals or the allies were not handed over');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-6-m1.png'), '.he-canvas');
    for (let i = 0; i < 5; i++) {
      const won = await cdp.eval(`(() => { const v = heui.game, S = v.S; if (S.campaign.mission === 4) S.campaign.flags.throne_taken = 1; S.over = { winner: 0, why: 'script' }; v.finish(); return heui.view.constructor.name; })()`);
      if (won !== 'MissionEndView') throw new Error('no mission end screen, got ' + won);
      await frames(cdp, 3);
      await cdp.eval(press('end-go'));
      await frames(cdp, 3);
      if (i === 4) break;
      await cdp.until('heui.view.constructor.name === "BriefView" && !!heui.view.doc', 15000);
      await frames(cdp, 2);
      await cdp.shot(path.join(out, 'campaign-6-brief' + (i + 2) + '.png'), '.he-canvas');
      await cdp.eval(press('brief-go'));
      await cdp.until('!!heui.game && !!heui.game.S && heui.game.S.campaign.mission === ' + (i + 1), 15000);
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-6-scene' + (i + 2) + '.png'), '.he-canvas');
      const st = await cdp.eval(`(() => { const v = heui.game, S = v.S, h = Heroes98.Campaign.heroOf(S); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); return { level: h.level, cap: h.levelCap, goals: S.script.goals.length, heroes: S.heroes.filter(x => x.alive && x.owner === 0).map(x => x.name + ' ' + x.level) }; })()`);
      log.push('mission ' + (i + 2) + ': ' + JSON.stringify(st));
      if (!st.goals) throw new Error('mission ' + (i + 2) + ' has no goals');
      await frames(cdp, 3);
      await cdp.shot(path.join(out, 'campaign-6-m' + (i + 2) + '.png'), '.he-canvas');
      if (i === 1) {
        const joined = await cdp.eval(`(() => { const H = Heroes98, v = heui.game, S = v.S, hut = S.map.objs.find(o => o.tag === 'adel'); hut.done = [0]; H.Script.poll(S, []); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); const a = S.heroes.find(h => h.alive && h.hid === 'adelina'); S.players[0].seen[0].fill(1); v.vis = H.Adv.visible(S, 0, 0); v.center(a); return { level: a.level, owner: a.owner, army: a.army.filter(Boolean).length }; })()`);
        log.push('Аделина: ' + JSON.stringify(joined));
        if (joined.level !== 17 || joined.owner !== 0) throw new Error('Аделина did not join with her level');
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-6-joined.png'), '.he-canvas');
      }
      if (i === 2) {
        const cut = await cdp.eval(`(() => { const H = Heroes98, v = heui.game, S = v.S, before = H.MapData.roadAt(S.map, 0, 56, 22); S.map.objs.find(o => o.tag === 'r1').owner = 0; H.Script.poll(S, []); let n = 0; while (S.scene && n++ < 200) v.sceneNext(0); S.players[0].seen[0].fill(1); v.vis = H.Adv.visible(S, 0, 0); v.center({ c: 56, r: 22, l: 0 }); return { before, after: H.MapData.roadAt(S.map, 0, 56, 22), crown: !!S.campaign.flags.crown_back }; })()`);
        log.push('дорога: ' + JSON.stringify(cut));
        if (cut.before !== 3 || cut.after !== 0) throw new Error('the ruin did not cut the moon road');
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-6-road.png'), '.he-canvas');
      }
      if (i === 3) {
        await cdp.eval(`(() => { const v = heui.game, S = v.S, h = Heroes98.Campaign.heroOf(S); v.center(h); return true; })()`);
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-6-allies.png'), '.he-canvas');
        const deep = await cdp.eval(`(() => { const H = Heroes98, v = heui.game, S = v.S; S.players[0].seen[1].fill(1); v.level = 1; v.vis = H.Adv.visible(S, 0, 1); v.center({ c: 72, r: 72, l: 1 }); return { level: v.level, song: !!S.map.objs.find(o => o.tag === 'song' && o.l === 1) }; })()`);
        log.push('храм: ' + JSON.stringify(deep));
        await frames(cdp, 3);
        await cdp.shot(path.join(out, 'campaign-6-temple.png'), '.he-canvas');
      }
    }
    if (await cdp.eval('heui.view.constructor.name') !== 'SlidesView') throw new Error('the ending did not start');
    await cdp.shot(path.join(out, 'campaign-6-ending.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await frames(cdp, 3);
    const morning = await cdp.eval(`(() => ({ view: heui.view.constructor.name, title: heui.view.o.title, pages: heui.view.o.slides.length }))()`);
    log.push('утро: ' + JSON.stringify(morning));
    if (morning.view !== 'SlidesView' || morning.pages !== 6) throw new Error('the first morning did not start');
    await cdp.shot(path.join(out, 'campaign-6-morning.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.i = 5; return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-6-throne.png'), '.he-canvas');
    await cdp.eval(press('slide-skip'));
    await frames(cdp, 3);
    if (await cdp.eval('heui.view.constructor.name') !== 'CreditsView') throw new Error('no credits after the morning');
    await cdp.eval(`(() => { heui.view.t = 9; return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'campaign-6-credits.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.leave(); return true; })()`);
    await frames(cdp, 3);
    const after = await cdp.eval(`(() => { const C = Heroes98.Campaign; return { finished: C.finished('tysyacha'), flags: C.runOf('tysyacha').flags.throne_taken, view: heui.view.constructor.name }; })()`);
    log.push('after the campaign: ' + JSON.stringify(after));
    if (!after.finished || !after.flags || after.view !== 'CampaignView') throw new Error('the campaign did not finish');
    await cdp.shot(path.join(out, 'campaign-6-done.png'), '.he-canvas');
    await cdp.eval(`(() => { Heroes98.Campaign.reset(); return true; })()`);
  },
  async modes(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    const press = id => `(() => { const v = heui.view, r = v.regions.find(q => q.id === ${JSON.stringify(id)}); if (!r) throw new Error('no region ' + ${JSON.stringify(id)}); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`;
    await cdp.eval('(() => { Heroes98.Maps.loadFiles(); return true; })()');
    await cdp.until('Heroes98.Maps.LIST.every(m => m.make || m.doc)', 30000);
    await cdp.eval(`(() => {
      const F = Heroes98.Fame;
      F.clear();
      [[1320, 'Семь рек', 'tide', 64, 'hard'], [980, 'Брод у мельницы', 'league', 31, 'normal'], [760, 'Три дня', 'barrows', 40, 'normal'], [430, 'Остров на остров', 'thicket', 58, 'easy']].forEach(([score, map, faction, days, difficulty]) => F.add({ score, rank: F.rankOf(score), map, faction, days, difficulty, w: 80, when: '03.11.2026' }));
      heui.view.press('fame');
      return true;
    })()`);
    await frames(cdp, 3);
    if (await cdp.eval('heui.view.constructor.name') !== 'FameView') throw new Error('no Hall of Fame');
    await cdp.shot(path.join(out, 'modes-fame.png'), '.he-canvas');
    await cdp.eval(press('back'));
    await cdp.eval(`(() => { heui.view.page = 'new'; heui.view.press('duel'); return true; })()`);
    await frames(cdp, 3);
    await cdp.eval(press('pick-9'));
    await cdp.eval(press('pick-6'));
    await cdp.eval(press('field-1'));
    await cdp.eval(press('moon'));
    await cdp.eval(press('who-1'));
    await frames(cdp, 3);
    const duel = await cdp.eval(`(() => { const v = heui.view; return { view: v.constructor.name, picks: v.picks, who: v.who, field: v.field, moon: v.moon }; })()`);
    log.push('поединок: ' + JSON.stringify(duel));
    if (duel.view !== 'DuelView' || duel.who.join() !== 'human,human') throw new Error('duel screen did not take the picks');
    await cdp.shot(path.join(out, 'modes-duel.png'), '.he-canvas');
    await cdp.eval(press('fight'));
    await frames(cdp, 4);
    await cdp.until('heui.view.constructor.name === "BattleView" && !heui.view.beats.length && !heui.view.beat', 20000);
    await frames(cdp, 3);
    const fight = await cdp.eval(`(() => { const v = heui.view, B = v.B; return { humans: v.humans, player: v.player, active: B.stacks[B.active] ? B.stacks[B.active].side : -1, deploying: v.deploying }; })()`);
    log.push('бой двух людей: ' + JSON.stringify(fight));
    await cdp.shot(path.join(out, 'modes-duel-battle.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.deploying = false; v.quick(); return true; })()`);
    await cdp.until('heui.view.result', 30000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'modes-duel-end.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.setup.done(v.B); return true; })()`);
    await frames(cdp, 3);
    const back = await cdp.eval(`(() => ({ view: heui.view.constructor.name, last: heui.view.last }))()`);
    log.push('после поединка: ' + JSON.stringify(back));
    if (back.view !== 'DuelView' || !back.last) throw new Error('the duel did not come back');
    await cdp.eval(press('back'));
    await cdp.eval(`(() => { heui.view.page = 'new'; heui.view.press('scenario'); return true; })()`);
    await frames(cdp, 3);
    for (const id of ['salt', 'seven', 'crown', 'horn', 'ruins', 'border', 'conv', 'dark', 'isles', 'seals', 'three', 'union']) {
      await cdp.eval(`(() => { const v = heui.view; v.pick(Heroes98.Maps.LIST.find(m => m.id === ${JSON.stringify(id)})); v.size = 'все'; v.count = 0; v.top = Math.max(0, v.maps().indexOf(v.rec) - 5); return true; })()`);
      await frames(cdp, 2);
      await cdp.shot(path.join(out, 'modes-map-' + id + '.png'), '.he-canvas');
    }
    await cdp.eval(`(() => { const v = heui.view; v.pick(Heroes98.Maps.LIST.find(m => m.id === 'union')); return true; })()`);
    await cdp.eval(press('who-1'));
    await frames(cdp, 2);
    const union = await cdp.eval(`(() => { const v = heui.view; return { who: v.slots.map(s => s.who), team: v.slots.map(s => s.team), fixed: v.fixedTeams }; })()`);
    log.push('союз: ' + JSON.stringify(union));
    if (!union.fixed || union.who.filter(w => w === 'human').length !== 2) throw new Error('union setup did not take two humans');
    await cdp.shot(path.join(out, 'modes-setup-union.png'), '.he-canvas');
    await cdp.eval(press('start'));
    await cdp.until('heui.view.constructor.name === "PassView"', 20000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'modes-pass-1.png'), '.he-canvas');
    await cdp.eval(press('go'));
    await cdp.until('heui.view.constructor.name === "MapView"', 20000);
    await frames(cdp, 3);
    const seen = await cdp.eval(`(() => { const v = heui.game, S = v.S, ally = S.heroes.find(h => h.alive && h.owner === 1); return { pid: v.pid, allyAt: [ally.c, ally.r], allySeen: S.players[0].seen[0][ally.r * S.map.w + ally.c], allied: Heroes98.Adv.allied(S, 0, 1) }; })()`);
    log.push('общий обзор: ' + JSON.stringify(seen));
    if (!seen.allySeen || !seen.allied) throw new Error('the ally is not seen');
    await cdp.shot(path.join(out, 'modes-union-map.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.game; v.press('end'); if (v.modal) v.closeModal('yes'); return true; })()`);
    await cdp.until('heui.view.constructor.name === "PassView"', 30000);
    await frames(cdp, 2);
    const pass = await cdp.eval(`(() => ({ pid: heui.game.pid, turn: heui.game.S.turn }))()`);
    log.push('передача хода: ' + JSON.stringify(pass));
    if (pass.pid !== 1) throw new Error('the turn did not pass to the blue player');
    await cdp.shot(path.join(out, 'modes-pass-2.png'), '.he-canvas');
    await cdp.eval(press('go'));
    await cdp.until('heui.view.constructor.name === "MapView"', 20000);
    await cdp.eval(`(() => {
      const v = heui.game, S = v.S, mine = S.heroes.find(h => h.alive && h.owner === 1), ally = S.heroes.find(h => h.alive && h.owner === 0), MD = Heroes98.MapData;
      const spot = Heroes98.Path.DIRS.map(([x, y]) => [ally.c + x, ally.r + y]).find(([c, r]) => MD.groundCost(S.map, ally.l, c, r) && !Heroes98.Adv.heroAt(S, ally.l, c, r) && !S.map.objs.some(o => MD.cells(o).some(([p, q]) => p === c && q === r)));
      mine.c = spot[0];
      mine.r = spot[1];
      mine.l = ally.l;
      v.sel = mine.id;
      v.center(mine);
      S.ver++;
      v.meet(ally);
      return true;
    })()`);
    await frames(cdp, 3);
    if (await cdp.eval('heui.view.constructor.name') !== 'ExchangeView') throw new Error('no meeting of allies');
    await cdp.shot(path.join(out, 'modes-meet.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.game; heui.show(v); v.S.over = { winner: 1, why: 'defeat' }; v.finish(); return true; })()`);
    await frames(cdp, 3);
    const result = await cdp.eval(`(() => { const v = heui.view; return { view: v.constructor.name, win: v.win, place: v.place, pid: v.pid }; })()`);
    log.push('итог: ' + JSON.stringify(result));
    if (result.view !== 'ResultView' || !result.win || result.place < 1) throw new Error('the win did not reach the Hall of Fame');
    await cdp.shot(path.join(out, 'modes-result.png'), '.he-canvas');
    await cdp.eval(`(() => { Heroes98.Fame.clear(); return true; })()`);
  },
  async 'faction-thicket'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const start = (left, right, ready, extra) => `(() => {
      const H = Heroes98, ui = heui, B = H.Battle.create(Object.assign({ seed: 11, obstacles: [], ready: ${JSON.stringify(ready)}, sides: [{ stacks: ${JSON.stringify(left)} }, { stacks: ${JSON.stringify(right)} }] }, ${JSON.stringify(extra || {})}));
      ui.show(new H.BattleView(ui, { name: 'Проба Чащи', player: 0, seed: 11, B, done: () => {}, resumed: true }));
      return B.stacks.map(s => s.unit);
    })()`;
    const hover = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); const h = v.hover || {}; return { kind: h.kind || null, bad: h.bad || null, ward: !!h.ward, cry: !!h.cry, grow: !!h.grow }; })()`;
    const click = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); v.pointer('down', x, y, 0); v.pointer('up', x, y, 0); return true; })()`;
    const idle = async () => cdp.until('!heui.view.beat && !heui.view.beats.length && !!heui.view.rc', 20000);
    const rows = await cdp.eval(`Heroes98.FACTIONS.thicket.units`);
    const bigs = ['leshy', 'borovik', 'warden', 'zmey', 'threeheaded', 'firezmey'], all = [];
    rows.forEach((row, t) => row.forEach((unit, k) => all.push({ unit, count: 5 + t, c: 1 + k * 4 + (t % 2) * 2 + (bigs.includes(unit) ? 1 : 0), r: t + 1 })));
    await cdp.eval(start(all, [{ unit: 'militia', count: 10, c: 13, r: 0 }], [100]));
    await frames(cdp, 3);
    await idle();
    await cdp.shot(path.join(out, 'faction-thicket.png'), '.he-canvas');
    const traits = await cdp.eval(`(() => { const H = Heroes98; return H.FACTIONS.thicket.units.flat().map(id => id + ': ' + H.unitTraits(H.UNITS[id]).map(t => t[0]).join(', ')); })()`);
    log.push('thicket traits: ' + traits.join('; '));

    await cdp.eval(start([{ unit: 'bereginya', count: 10, c: 2, r: 2 }, { unit: 'auka', count: 30, c: 3, r: 5 }], [{ unit: 'militia', count: 30, c: 8, r: 5 }], [100, 0, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    const ward = await cdp.eval(hover(3, 5));
    log.push('ward aim: ' + JSON.stringify(ward));
    if (!ward.ward) throw new Error('the ward does not aim');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-thicket-ward.png'), '.he-canvas');
    await cdp.eval(click(3, 5));
    await cdp.until('heui.view.B.stacks[1].fx.some(e => e.trait === "Оберег")', 8000);

    await cdp.eval(start([{ unit: 'rusalka', count: 12, c: 3, r: 4 }], [{ unit: 'crossbow', count: 20, c: 6, r: 4 }, { unit: 'militia', count: 20, c: 13, r: 8 }], [100, 0, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    const pull = await cdp.eval(hover(6, 4));
    log.push('pull aim: ' + JSON.stringify(pull));
    if (pull.kind !== 'lasso') throw new Error('the pull does not aim');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-thicket-pull.png'), '.he-canvas');
    await cdp.eval(click(6, 4));
    await cdp.until('heui.view.B.stacks[1].c === 4', 8000);

    await cdp.eval(start([{ unit: 'gamayun', count: 5, c: 3, r: 2 }, { unit: 'plated', count: 20, c: 3, r: 6 }], [{ unit: 'militia', count: 30, c: 12, r: 6 }], [100, 0, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    const cry = await cdp.eval(hover(3, 6));
    if (!cry.cry) throw new Error('the cry does not aim');
    await cdp.eval(click(3, 6));
    await cdp.until('heui.view.B.stacks[0].cried === 1', 8000);

    await cdp.eval(start([{ unit: 'warden', count: 4, c: 3, r: 4 }], [{ unit: 'militia', count: 30, c: 12, r: 6 }], [100, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    const grow = await cdp.eval(hover(5, 4));
    if (!grow.grow) throw new Error('the warden does not plant');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-thicket-grow.png'), '.he-canvas');
    await cdp.eval(click(5, 4));
    await cdp.until('heui.view.B.obstacles.length === 1', 8000);

    const planting = await cdp.eval(`(() => {
      const H = Heroes98, ui = heui, B = H.Battle.create({ seed: 11, obstacles: [], ready: [100, 0], sides: [{ plantByHand: true, stacks: [{ unit: 'auka', count: 40, c: 1, r: 4 }], hero: { brush: 3, perks: [], spells: [], ranks: {}, mana: 0, power: 0, level: 1 } }, { stacks: [{ unit: 'militia', count: 30, c: 12, r: 4 }] }] });
      ui.show(new H.BattleView(ui, { name: 'Заросли', player: 0, seed: 11, B, done: () => {}, resumed: false }));
      return { deploying: heui.view.deploying, left: B.sides[0].plantLeft };
    })()`);
    log.push('planting: ' + JSON.stringify(planting));
    if (!planting.deploying || planting.left !== 3) throw new Error('no planting screen');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'faction-thicket-plant.png'), '.he-canvas');
    await cdp.eval(click(4, 4));
    await frames(cdp, 2);
    await cdp.eval(click(4, 7));
    await frames(cdp, 2);
    const left = await cdp.eval('heui.view.B.sides[0].plantLeft');
    if (left !== 1) throw new Error('clicks did not plant: ' + left);
    await cdp.shot(path.join(out, 'faction-thicket-plant2.png'), '.he-canvas');
    await cdp.eval(`(() => { const b = heui.view.deployBtn || { x: 330, y: 462 }; heui.view.pointer('move', 400, 470, 0); heui.view.pointer('down', 400, 470, 0); return true; })()`);
    await frames(cdp, 3);
    const passing = await cdp.eval(`(() => { const v = heui.view, B = v.B; return { deploying: v.deploying, obstacles: B.obstacles.length }; })()`);
    log.push('after planting: ' + JSON.stringify(passing));
    if (passing.deploying) throw new Error('the deploy button did not start the battle');

    const opened = await cdp.eval(`(() => {
      const H = Heroes98, TW = H.Town;
      heui.startGame(H.Maps.build('ford', { seed: 7, slots: [{ faction: 'thicket', human: true }, { faction: 'league' }] }));
      const v = heui.view, S = v.S, t = TW.list(S, 0)[0], me = v.hero();
      Object.assign(S.players[0].res, { gold: 60000, wood: 90, ore: 90, amber: 40 });
      t.today = false; TW.build(S, t, 'special1');
      const b = H.MapData.add(S.map, { t: 'town', c: 24, r: 24, l: 0, owner: 0, faction: 'thicket', name: 'Берёзовый Кут', built: ['hall1', 'special1'] });
      TW.setup && TW.setup(S, b);
      b.garrison = b.garrison || [null, null, null, null, null, null, null];
      b.pool = b.pool || [0, 0, 0, 0, 0, 0, 0];
      const ring = H.MapData.add(S.map, { t: 'witchring', c: me.c + 3, r: me.r + 3, l: 0, owner: 0 });
      [me.c, me.r] = H.MapData.entry(t);
      me.steps = H.Adv.daySteps(S, me);
      S.ver++;
      v.openTown(t);
      heui.view.openBuilding('special1');
      return { win: heui.view.win.kind, targets: H.Sites.ringTargets(S, me, t).map(o => H.Sites.ringName(S, o)), cost: H.Sites.ringCost(S, me) };
    })()`);
    log.push('ring window: ' + JSON.stringify(opened));
    if (opened.win !== 'ring' || opened.targets.length < 2) throw new Error('the ring window has no targets');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'ring-window.png'), '.he-canvas');
    const jumped = await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, r = v.regions.find(q => /^ring-\\d/.test(q.id));
      v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0);
      const g = heui.game, me = g.hero();
      return { view: heui.view.constructor.name, day: me.ringDay, steps: me.steps, at: [me.c, me.r] };
    })()`);
    log.push('ring jump: ' + JSON.stringify(jumped));
    if (jumped.view !== 'MapView' || jumped.day !== 1) throw new Error('the jump did not work from the window');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'ring-after.png'), '.he-canvas');
    const circle = await cdp.eval(`(() => {
      const H = Heroes98, m = heui.view, S = m.S, me = m.hero(), ring = S.map.objs.find(o => o.t === 'witchring');
      me.ringDay = 0;
      me.steps = H.Adv.daySteps(S, me);
      [me.c, me.r] = H.MapData.entry(ring);
      S.players[0].seen[0].fill(1);
      m.vis = H.Adv.visible(S, 0, 0);
      m.center(me);
      const ev = [];
      H.OBJ_VISIT.witchring(S, me, ring, ev);
      m.events(ev);
      m.pendingModal();
      return { site: S.pending && S.pending.site, options: S.pending && S.pending.options.map(o => o[1]) };
    })()`);
    log.push('witch circle: ' + JSON.stringify(circle));
    if (circle.site !== 'ring') throw new Error('the circle does not ask');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'ring-circle.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.closeModal('stay'); return true; })()`);
  },
  async 'faction-tide'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const start = (left, right, ready, hero) => `(() => {
      const H = Heroes98, ui = heui, B = H.Battle.create({ seed: 11, obstacles: [], ready: ${JSON.stringify(ready)}, sides: [{ stacks: ${JSON.stringify(left)}${hero ? ', hero: ' + JSON.stringify(hero) : ''} }, { stacks: ${JSON.stringify(right)} }] });
      ui.show(new H.BattleView(ui, { name: 'Проба Прилива', player: 0, seed: 11, B, done: () => {}, resumed: true }));
      return B.stacks.map(s => s.unit);
    })()`;
    const hover = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); const h = v.hover || {}; return { kind: h.kind || null, bad: h.bad || null, deep: !!h.deep, flood: !!h.flood, area: (h.area || []).length }; })()`;
    const click = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); v.pointer('down', x, y, 0); v.pointer('up', x, y, 0); return true; })()`;
    const idle = async () => cdp.until('!heui.view.beat && !heui.view.beats.length && !!heui.view.rc', 20000);
    const hero = more => Object.assign({ perks: [], spells: [], ranks: {}, mana: 0, power: 0, level: 1 }, more);
    const rows = await cdp.eval(`Heroes98.FACTIONS.tide.units`);
    const bigs = ['turtlefort', 'turtleram', 'turtlebeacon', 'kraken', 'ancientkraken', 'devourer'], all = [];
    rows.forEach((row, t) => row.forEach((unit, k) => all.push({ unit, count: 5 + t, c: 1 + k * 4 + (t % 2) * 2 + (bigs.includes(unit) ? 1 : 0), r: t + 1 })));
    await cdp.eval(start(all, [{ unit: 'militia', count: 10, c: 13, r: 0 }], [100]));
    await frames(cdp, 3);
    await idle();
    await cdp.shot(path.join(out, 'faction-tide.png'), '.he-canvas');
    const traits = await cdp.eval(`(() => { const H = Heroes98; return H.FACTIONS.tide.units.flat().map(id => id + ': ' + H.unitTraits(H.UNITS[id]).map(t => t[0]).join(', ')); })()`);
    log.push('tide traits: ' + traits.join('; '));

    await cdp.eval(start([{ unit: 'seawitch', count: 12, c: 2, r: 3 }, { unit: 'shellman', count: 40, c: 3, r: 4 }], [{ unit: 'crossbow', count: 30, c: 12, r: 4 }], [100, 0, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    await cdp.until('heui.view.B.stacks[1].fx.some(e => e.trait === "Туман")', 8000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'faction-tide-fog.png'), '.he-canvas');

    await cdp.eval(start([{ unit: 'kraken', count: 2, c: 2, r: 4 }], [{ unit: 'crossbow', count: 30, c: 12, r: 4 }], [100, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    const dive = await cdp.eval(hover(11, 4));
    log.push('dive aim: ' + JSON.stringify(dive));
    if (!dive.deep) throw new Error('the Kraken does not aim its dive');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-tide-deep.png'), '.he-canvas');
    await cdp.eval(click(11, 4));
    await cdp.until('heui.view.B.stacks[0].deeped === true && heui.view.B.stacks[0].c === 11', 8000);

    await cdp.eval(start([{ unit: 'shellman', count: 40, c: 2, r: 4 }, { unit: 'rayrider', count: 3, c: 2, r: 7 }], [{ unit: 'plated', count: 10, c: 11, r: 4 }, { unit: 'crossbow', count: 20, c: 12, r: 2 }], [100, 0, 0, 0], hero({ flood: true })));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('order'), true`);
    const flood = await cdp.eval(hover(11, 4));
    log.push('flood aim: ' + JSON.stringify(flood));
    if (!flood.flood || flood.area !== 5) throw new Error('the flood does not aim');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-tide-flood-aim.png'), '.he-canvas');
    await cdp.eval(click(11, 4));
    await cdp.until('!!heui.view.B.shallow', 8000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'faction-tide-flood.png'), '.he-canvas');

    await cdp.eval(start([{ unit: 'shellman', count: 40, c: 2, r: 4 }], [{ unit: 'plated', count: 10, c: 9, r: 4 }, { unit: 'crossbow', count: 20, c: 11, r: 2 }, { unit: 'militia', count: 30, c: 13, r: 7 }], [100, 60, 60, 60], hero({ high: 'wave' })));
    await frames(cdp, 2);
    await idle();
    await cdp.shot(path.join(out, 'faction-tide-wave-before.png'), '.he-canvas');
    await cdp.eval(`heui.view.press('order'), true`);
    await cdp.until('heui.view.B.stacks[1].c === 11', 8000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'faction-tide-wave.png'), '.he-canvas');

    await cdp.eval(`(() => { const v = heui.view; v.B.round = 2; return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-tide-ebb.png'), '.he-canvas');

    const water = await cdp.eval(`(() => {
      const H = Heroes98, MD = H.MapData, M = MD.create(40, 30, ['meadow']);
      MD.paint(M, 0, 'water', (c, r) => c >= 16 && c < 24);
      MD.add(M, { t: 'chest', c: 26, r: 12, l: 0 });
      const S = H.Adv.create(M, { seed: 7, moons: null, players: [{ name: 'Наэра', color: 0, faction: 'tide', human: true }, { name: 'Чужой', color: 1, faction: 'league', human: false }], heroes: [{ owner: 0, hid: 'naera', name: 'Наэра', cls: 'deeppriest', faction: 'tide', c: 14, r: 14, army: [{ unit: 'shellman', count: 30 }] }, { owner: 1, name: 'Чужой', cls: 'captain', faction: 'league', c: 39, r: 0, army: [{ unit: 'militia', count: 5 }] }] });
      S.heroes[0].steps = H.Adv.daySteps(S, S.heroes[0]);
      heui.startGame({ S });
      const v = heui.view, h = v.hero(), p = H.Adv.path(S, h, 26, 12);
      v.plan = p;
      return { walks: !!p, cost: p && p.steps.slice(0, 4).map(s => s.cost), steps: h.steps };
    })()`);
    log.push('tide on water: ' + JSON.stringify(water));
    if (!water.walks || water.cost[2] !== 1.5) throw new Error('a Tide hero does not walk on water');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'faction-tide-water.png'), '.he-canvas');
    const moved = await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, S = v.S, h = v.hero();
      for (const c of [15, 16, 17, 18]) H.Adv.step(S, h, c, 14);
      S.ver++;
      v.centerOn && v.centerOn(h);
      return { c: h.c, boat: h.boat, steps: h.steps };
    })()`);
    log.push('walked: ' + JSON.stringify(moved));
    if (moved.c !== 18 || moved.boat) throw new Error('the walk over water failed');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'faction-tide-water2.png'), '.he-canvas');
  },
  async 'faction-forge'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const start = (left, right, ready, hero) => `(() => {
      const H = Heroes98, ui = heui, B = H.Battle.create({ seed: 11, obstacles: [], ready: ${JSON.stringify(ready)}, sides: [{ stacks: ${JSON.stringify(left)}${hero ? ', hero: ' + JSON.stringify(hero) : ''} }, { stacks: ${JSON.stringify(right)} }] });
      ui.show(new H.BattleView(ui, { name: 'Проба Горнил', player: 0, seed: 11, B, done: () => {}, resumed: true }));
      return B.stacks.map(s => s.unit);
    })()`;
    const hover = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); const h = v.hover || {}; return { bad: h.bad || null, temper: !!h.temper }; })()`;
    const click = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); v.pointer('down', x, y, 0); v.pointer('up', x, y, 0); return true; })()`;
    const idle = async () => cdp.until('!heui.view.beat && !heui.view.beats.length && !!heui.view.rc', 20000);
    const hero = more => Object.assign({ perks: [], spells: [], ranks: {}, mana: 0, power: 0, level: 1 }, more);
    const rows = await cdp.eval(`Heroes98.FACTIONS.forge.units`);
    const bigs = ['slaggiant', 'obsidiangiant', 'slagthrower', 'volcano', 'firemountain', 'sleepingvolcano'], all = [];
    rows.forEach((row, t) => row.forEach((unit, k) => all.push({ unit, count: 5 + t, c: 1 + k * 4 + (t % 2) * 2 + (bigs.includes(unit) ? 1 : 0), r: t + 1 })));
    await cdp.eval(start(all, [{ unit: 'militia', count: 10, c: 13, r: 0 }], [100]));
    await cdp.eval(`(() => { heui.view.B.stacks.forEach((s, i) => { if (s.side === 0) s.heat = i % 4; }); return true; })()`);
    await frames(cdp, 3);
    await idle();
    await cdp.shot(path.join(out, 'faction-forge.png'), '.he-canvas');
    const traits = await cdp.eval(`(() => { const H = Heroes98; return H.FACTIONS.forge.units.flat().map(id => id + ': ' + H.unitTraits(H.UNITS[id]).map(t => t[0]).join(', ')); })()`);
    log.push('forge traits: ' + traits.join('; '));

    await cdp.eval(start([{ unit: 'temperer', count: 10, c: 1, r: 4 }, { unit: 'slaggiant', count: 4, c: 4, r: 4 }], [{ unit: 'crossbow', count: 30, c: 12, r: 4 }], [100, 0, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    const temper = await cdp.eval(hover(4, 4));
    log.push('temper aim: ' + JSON.stringify(temper));
    if (!temper.temper) throw new Error('the temperers do not aim');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-forge-temper.png'), '.he-canvas');
    await cdp.eval(click(4, 4));
    await cdp.until('heui.view.B.stacks[1].fx.some(e => e.trait === "Закалка")', 8000);

    await cdp.eval(start([{ unit: 'overheated', count: 6, c: 5, r: 4 }], [{ unit: 'militia', count: 60, c: 6, r: 4 }, { unit: 'militia', count: 60, c: 5, r: 3 }, { unit: 'militia', count: 60, c: 5, r: 5 }], [100, 0, 0, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.shot(path.join(out, 'faction-forge-burst-before.png'), '.he-canvas');
    await cdp.eval(`heui.view.press('skill'), true`);
    await cdp.until('heui.view.B.stacks[0].count === 0', 8000);
    await frames(cdp, 4);
    await cdp.shot(path.join(out, 'faction-forge-burst.png'), '.he-canvas');

    await cdp.eval(start([{ unit: 'apprentice', count: 40, c: 2, r: 4 }, { unit: 'caster', count: 6, c: 1, r: 6 }], [{ unit: 'plated', count: 20, c: 10, r: 4 }, { unit: 'crossbow', count: 30, c: 12, r: 2 }, { unit: 'salamander', count: 20, c: 12, r: 7 }], [100, 50, 50, 50, 50], hero({ high: 'erupt', level: 15 })));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('order'), true`);
    await cdp.until('heui.view.B.stacks[0].heat === 3', 8000);
    await frames(cdp, 4);
    await cdp.shot(path.join(out, 'faction-forge-erupt.png'), '.he-canvas');

    const lava = await cdp.eval(`(() => {
      const H = Heroes98, MD = H.MapData, M = MD.create(40, 30, ['ash']);
      MD.paint(M, 0, 'lava', (c, r) => c >= 16 && c < 22);
      MD.paint(M, 0, 'meadow', (c, r) => c < 6);
      MD.add(M, { t: 'chest', c: 26, r: 12, l: 0 });
      const S = H.Adv.create(M, { seed: 7, moons: null, players: [{ name: 'Ирга', color: 0, faction: 'forge', human: true }, { name: 'Чужой', color: 1, faction: 'league', human: false }], heroes: [{ owner: 0, hid: 'irga', name: 'Ирга', cls: 'forgemaster', faction: 'forge', c: 14, r: 14, army: [{ unit: 'apprentice', count: 30 }] }, { owner: 1, name: 'Чужой', cls: 'captain', faction: 'league', c: 39, r: 0, army: [{ unit: 'militia', count: 5 }] }] });
      S.heroes[0].steps = H.Adv.daySteps(S, S.heroes[0]);
      heui.startGame({ S });
      const v = heui.view, h = v.hero(), p = H.Adv.path(S, h, 26, 12);
      v.plan = p;
      return { walks: !!p, cost: p && p.steps.slice(0, 4).map(s => s.cost) };
    })()`);
    log.push('forge on lava: ' + JSON.stringify(lava));
    if (!lava.walks) throw new Error('a Forge hero does not walk on lava');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'faction-forge-lava.png'), '.he-canvas');
  },
  async 'faction-throne'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const start = (left, right, ready, hero, hand) => `(() => {
      const H = Heroes98, ui = heui, B = H.Battle.create({ seed: 11, obstacles: [], ready: ${JSON.stringify(ready)}, sides: [{ plantByHand: ${!!hand}, stacks: ${JSON.stringify(left)}${hero ? ', hero: ' + JSON.stringify(hero) : ''} }, { stacks: ${JSON.stringify(right)} }] });
      ui.show(new H.BattleView(ui, { name: 'Проба Престола', player: 0, seed: 11, B, done: () => {}, resumed: true }));
      return B.stacks.map(s => s.unit);
    })()`;
    const hover = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); const h = v.hover || {}; return { bad: h.bad || null, mend: !!h.mend }; })()`;
    const click = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); v.pointer('down', x, y, 0); v.pointer('up', x, y, 0); return true; })()`;
    const idle = async () => cdp.until('!heui.view.beat && !heui.view.beats.length && !!heui.view.rc', 20000);
    const hero = more => Object.assign({ perks: [], spells: [], ranks: {}, mana: 0, power: 0, level: 1 }, more);
    const crown = more => hero(Object.assign({ mirror: 1, mirrorShare: 0.3, mirrorRounds: 3, mirrorTier: 5 }, more));
    const rows = await cdp.eval(`Heroes98.FACTIONS.throne.units`);
    const bigs = ['throneknight', 'oathkeeper', 'punisher', 'shard', 'radiantshard', 'darkshard'], all = [];
    rows.forEach((row, t) => row.forEach((unit, k) => all.push({ unit, count: 5 + t, c: 1 + k * 4 + (t % 2) * 2 + (bigs.includes(unit) ? 1 : 0), r: t + 1 })));
    await cdp.eval(start(all, [{ unit: 'militia', count: 10, c: 13, r: 0 }], [100]));
    await frames(cdp, 3);
    await idle();
    await cdp.shot(path.join(out, 'faction-throne.png'), '.he-canvas');
    const traits = await cdp.eval(`(() => { const H = Heroes98; return H.FACTIONS.throne.units.flat().map(id => id + ': ' + H.unitTraits(H.UNITS[id]).map(t => t[0]).join(', ')); })()`);
    log.push('throne traits: ' + traits.join('; '));

    await cdp.eval(start([{ unit: 'legionary', count: 40, c: 1, r: 2 }, { unit: 'moonmaiden', count: 8, c: 1, r: 5 }, { unit: 'deerrider', count: 4, c: 1, r: 7 }, { unit: 'throneknight', count: 2, c: 1, r: 9 }], [{ unit: 'militia', count: 60, c: 12, r: 3 }, { unit: 'crossbow', count: 30, c: 13, r: 6 }], [100, 0, 0, 0, 0, 0], crown(), true));
    await frames(cdp, 3);
    const deploy = await cdp.eval(`(() => ({ deploying: heui.view.deploying, left: heui.view.B.sides[0].mirrorLeft }))()`);
    log.push('mirror deploy: ' + JSON.stringify(deploy));
    if (!deploy.deploying || deploy.left !== 1) throw new Error('the reflection is not offered before the battle');
    await cdp.shot(path.join(out, 'faction-throne-mirror.png'), '.he-canvas');
    await cdp.eval(click(1, 5));
    await cdp.until('!heui.view.beat && !heui.view.beats.length', 8000);
    await frames(cdp, 3);
    const copy = await cdp.eval(`(() => { const s = heui.view.B.stacks.find(x => x.reflection); return s ? { unit: s.unit, count: s.count, c: s.c, r: s.r } : null; })()`);
    log.push('reflection: ' + JSON.stringify(copy));
    if (!copy || copy.unit !== 'moonmaiden') throw new Error('the click did not reflect the maidens');
    await cdp.shot(path.join(out, 'faction-throne-mirrored.png'), '.he-canvas');

    await cdp.eval(start([{ unit: 'moonmaiden', count: 10, c: 1, r: 4 }, { unit: 'throneknight', count: 3, c: 3, r: 6 }], [{ unit: 'militia', count: 30, c: 12, r: 4 }], [100, 0, 0]));
    await frames(cdp, 2);
    await cdp.eval(`(() => { const B = heui.view.B; Heroes98.Battle.hurt(B.stacks[1], 260); B.stacks[0].shots = 0; heui.view.sync(); heui.view.rc = null; return true; })()`);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    const mend = await cdp.eval(hover(3, 6));
    log.push('mend aim: ' + JSON.stringify(mend));
    if (!mend.mend) throw new Error('the maidens do not aim their light');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-throne-mend.png'), '.he-canvas');
    await cdp.eval(click(3, 6));
    await cdp.until('heui.view.B.stacks[0].mended === 1', 8000);

    await cdp.eval(start([{ unit: 'legionary', count: 30, c: 2, r: 4 }, { unit: 'moonarcher', count: 12, c: 1, r: 6 }], [{ unit: 'plated', count: 20, c: 10, r: 4 }, { unit: 'crossbow', count: 30, c: 12, r: 2 }], [100, 50, 50, 50], hero({ high: 'kings', level: 24 })));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('order'), true`);
    await cdp.until('heui.view.B.stacks.some(s => s.unit === "moonking")', 8000);
    await cdp.until('heui.view.vis[heui.view.B.stacks.find(s => s.unit === "moonking").id].alpha > 0', 8000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'faction-throne-kings.png'), '.he-canvas');

    const road = await cdp.eval(`(() => {
      const H = Heroes98, MD = H.MapData, M = MD.create(40, 30, ['highland']);
      MD.road(M, 0, 3, [[6, 14], [34, 14]]);
      MD.add(M, { t: 'chest', c: 30, r: 14, l: 0 });
      MD.add(M, { t: 'whiteruin', c: 18, r: 18, l: 0 });
      const S = H.Adv.create(M, { seed: 7, moons: null, players: [{ name: 'Валерия', color: 0, faction: 'throne', human: true }, { name: 'Чужой', color: 1, faction: 'league', human: false }], heroes: [{ owner: 0, hid: 'valeria', name: 'Валерия', cls: 'royalknight', faction: 'throne', c: 8, r: 14, army: [{ unit: 'legionary', count: 30 }] }, { owner: 1, name: 'Чужой', cls: 'captain', faction: 'league', c: 39, r: 0, army: [{ unit: 'militia', count: 5 }] }] });
      S.heroes[0].steps = H.Adv.daySteps(S, S.heroes[0]);
      heui.startGame({ S });
      const v = heui.view, h = v.hero(), p = H.Adv.path(S, h, 30, 14);
      v.plan = p;
      return { walks: !!p, cost: p && p.steps.slice(0, 3).map(s => s.cost) };
    })()`);
    log.push('throne on the moon road: ' + JSON.stringify(road));
    if (!road.walks) throw new Error('no path along the moon road');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'faction-throne-road.png'), '.he-canvas');
  },
  async 'faction-barrows'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const start = (left, right, ready) => `(() => {
      const H = Heroes98, ui = heui, B = H.Battle.create({ seed: 11, obstacles: [], ready: ${JSON.stringify(ready)}, sides: [{ stacks: ${JSON.stringify(left)} }, { stacks: ${JSON.stringify(right)} }] });
      ui.show(new H.BattleView(ui, { name: 'Проба Курганов', player: 0, seed: 11, B, done: () => {}, resumed: true }));
      return B.stacks.map(s => s.unit);
    })()`;
    const hover = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); const h = v.hover || {}; return { kind: h.kind || null, bad: h.bad || null, call: !!h.call }; })()`;
    const click = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); v.pointer('down', x, y, 0); v.pointer('up', x, y, 0); return true; })()`;
    const idle = async () => cdp.until('!heui.view.beat && !heui.view.beats.length && !!heui.view.rc', 20000);
    const rows = await cdp.eval(`Heroes98.FACTIONS.barrows.units`);
    const bigs = ['bonebull', 'thunderbull', 'greybull', 'stonekhan', 'kurgankhan', 'stormkhan'], all = [];
    rows.forEach((row, t) => row.forEach((unit, k) => all.push({ unit, count: 5 + t, c: 1 + k * 4 + (t % 2) * 2 + (bigs.includes(unit) ? 1 : 0), r: t + 1 })));
    await cdp.eval(start(all, [{ unit: 'militia', count: 10, c: 13, r: 0 }], [100]));
    await frames(cdp, 3);
    await idle();
    await cdp.shot(path.join(out, 'faction-barrows.png'), '.he-canvas');
    const traits = await cdp.eval(`(() => { const H = Heroes98; return H.FACTIONS.barrows.units.flat().map(id => id + ': ' + H.unitTraits(H.UNITS[id]).map(t => t[0]).join(', ')); })()`);
    log.push('barrows traits: ' + traits.join('; '));

    await cdp.eval(start([{ unit: 'lasso', count: 12, c: 3, r: 4 }], [{ unit: 'crossbow', count: 20, c: 7, r: 4 }, { unit: 'militia', count: 20, c: 13, r: 8 }], [100, 0, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    const lasso = await cdp.eval(hover(7, 4));
    log.push('lasso aim: ' + JSON.stringify(lasso));
    if (lasso.kind !== 'lasso') throw new Error('the lasso does not aim');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-barrows-lasso.png'), '.he-canvas');
    const secondOn = await cdp.eval(`heui.view.enabled('alarm')`);
    if (!secondOn) throw new Error('no button for the saddle shot');
    await cdp.eval(click(7, 4));
    await cdp.until('heui.view.B.stacks[1].c === 5', 8000);

    await cdp.eval(start([{ unit: 'stonekhan', count: 2, c: 2, r: 2 }, { unit: 'shade', count: 40, c: 2, r: 7 }], [{ unit: 'militia', count: 10, c: 13, r: 8 }], [100, 0, 0]));
    await frames(cdp, 2);
    await cdp.eval(`(() => { const s = heui.view.B.stacks[1]; s.count = 25; heui.view.rc = null; return true; })()`);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    const call = await cdp.eval(hover(2, 7));
    log.push('call aim: ' + JSON.stringify(call));
    if (!call.call) throw new Error('the kin call does not aim');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-barrows-call.png'), '.he-canvas');
    await cdp.eval(click(2, 7));
    await cdp.until('heui.view.B.stacks[1].count === 28', 8000);

    await cdp.eval(start([{ unit: 'stormeagle', count: 6, c: 2, r: 4 }], [{ unit: 'militia', count: 30, c: 7, r: 4 }], [100, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(click(7, 4));
    await cdp.until('heui.view.B.stacks[1].count < 30 && heui.view.B.stacks[0].c === 2', 8000);

    const opened = await cdp.eval(`(() => {
      const H = Heroes98, TW = H.Town;
      heui.startGame(H.Maps.build('ford', { seed: 7, slots: [{ faction: 'barrows', human: true }, { faction: 'league' }] }));
      const v = heui.view, S = v.S, t = TW.list(S, 0)[0], me = v.hero();
      Object.assign(S.players[0].res, { gold: 60000, wood: 90, ore: 90, salt: 40 });
      for (const id of ['tavern', 'hall2', 'special1', 'barrow2']) { t.today = false; TW.build(S, t, id, 'a'); }
      t.barrow.push({ unit: 'shade', count: 30 }, { unit: 'stonewoman', count: 6 }, { unit: 'saltnoyon', count: 2 });
      [me.c, me.r] = H.MapData.entry(t);
      v.openTown(t);
      heui.view.openBuilding('special1');
      return heui.view.win.kind + ', limit ' + TW.barrowLimit(S, t);
    })()`);
    log.push('barrow window: ' + opened);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'barrow-window.png'), '.he-canvas');
    const press = id => `(() => { const v = heui.view, r = v.regions.find(q => q.id === ${JSON.stringify(id)}); if (!r) throw new Error('no region ' + ${JSON.stringify(id)}); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`;
    const before = await cdp.eval('heui.game.S.players[0].res.gold');
    await cdp.eval(press('bw-all-saltnoyon'));
    await frames(cdp, 2);
    await cdp.eval(press('bw-raise'));
    await frames(cdp, 3);
    const after = await cdp.eval(`(() => { const S = heui.game.S, t = Heroes98.Town.list(S, 0)[0]; return { gold: S.players[0].res.gold, raised: t.raised, left: t.barrow.map(e => e.unit + ' ' + e.count), risen: S.players[0].risen }; })()`);
    log.push('raised: ' + JSON.stringify(after) + ' from gold ' + before);
    if (!after.risen || after.gold >= before) throw new Error('raising did not work through the window');
    await cdp.shot(path.join(out, 'barrow-raised.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.closeWin(); heui.view.openWin({ kind: 'blueprint' }); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'barrow-blueprint.png'), '.he-canvas');
    const stone = await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view; v.closeWin(); v.exit();
      const m = heui.view, S = m.S, me = m.hero(), t = H.Town.list(S, 0)[0];
      t.built = t.built.filter(id => id !== 'special1' && id !== 'barrow2');
      S.players[0].shades.push({ unit: 'stonewoman', count: 12 });
      const o = H.MapData.add(S.map, { t: 'kurganstone', c: me.c + 3, r: me.r + 3, l: me.l, owner: -1 });
      m.ver = -1;
      m.center(me);
      const ev = [];
      H.OBJ_VISIT.barrowstone(S, me, o, ev);
      m.events(ev);
      m.pendingModal();
      return { pending: S.pending && S.pending.site, lines: S.pending && S.pending.lines };
    })()`);
    log.push('stone: ' + JSON.stringify(stone));
    if (stone.pending !== 'barrowstone') throw new Error('the stone does not ask');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'barrow-stone.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.closeModal('raise'); return true; })()`);
    await frames(cdp, 2);
    const raisedStone = await cdp.eval('heui.game.hero().army.filter(Boolean).map(s => s.unit + " " + s.count)');
    log.push('army after the stone: ' + raisedStone.join(', '));
    if (!raisedStone.some(s => s.startsWith('stonewoman'))) throw new Error('the stone did not raise anyone');
  },
  async 'faction-league'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const start = (left, right, ready) => `(() => {
      const H = Heroes98, ui = heui, B = H.Battle.create({ seed: 11, obstacles: [], ready: ${JSON.stringify(ready)}, sides: [{ stacks: ${JSON.stringify(left)} }, { stacks: ${JSON.stringify(right)} }] });
      ui.show(new H.BattleView(ui, { name: 'Проба Лиги', player: 0, seed: 11, B, done: () => {}, resumed: true }));
      return B.stacks.map(s => s.unit);
    })()`;
    const hover = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); const h = v.hover || {}; return { kind: h.kind || null, bad: h.bad || null, spot: h.spot ? [h.spot.c, h.spot.r] : null, brace: !!(h.fc && h.fc.brace), retal: !!(h.fc && h.fc.retal) }; })()`;
    const click = (c, r) => `(() => { const [x, y] = Heroes98.BattleDraw.center(${c}, ${r}), v = heui.view; v.pointer('move', x, y, 0); v.pointer('down', x, y, 0); v.pointer('up', x, y, 0); return true; })()`;
    const idle = async () => cdp.until('!heui.view.beat && !heui.view.beats.length && !!heui.view.rc', 20000);
    const rows = await cdp.eval(`Heroes98.FACTIONS.league.units`);
    const all = [];
    rows.forEach((row, t) => row.forEach((unit, k) => all.push({ unit, count: 5 + t, c: 1 + k * 4 + (t % 2) * 2 + (H_big(unit) ? 1 : 0), r: t + 1 })));
    function H_big(id) { return ['horseguard', 'palaceknight', 'cuirassier', 'bombard', 'mortar', 'culverin'].includes(id); }
    await cdp.eval(start(all, [{ unit: 'shade', count: 10, c: 13, r: 0 }], [100]));
    await frames(cdp, 3);
    await idle();
    await cdp.shot(path.join(out, 'faction-league.png'), '.he-canvas');
    const traits = await cdp.eval(`(() => { const H = Heroes98; return H.FACTIONS.league.units.flat().map(id => id + ': ' + H.unitTraits(H.UNITS[id]).map(t => t[0]).join(', ')); })()`);
    log.push('league traits: ' + traits.join('; '));
    await cdp.eval(`(() => { const [x, y] = Heroes98.BattleDraw.center(10, 7), v = heui.view; v.mouse = [400, 380]; v.pointer('down', x, y, 2); return v.info; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-league-info.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.pointer('up', 400, 380, 2); v.info = null; return true; })()`);

    await cdp.eval(start([{ unit: 'cuirassier', count: 4, c: 4, r: 4 }], [{ unit: 'plated', count: 5, c: 7, r: 4 }, { unit: 'shade', count: 20, c: 12, r: 8 }], [100, 0, 0]));
    await frames(cdp, 2);
    await idle();
    await cdp.eval(`heui.view.press('skill'), true`);
    const volley = await cdp.eval(hover(7, 4));
    log.push('volley aim: ' + JSON.stringify(volley));
    if (volley.kind !== 'volley') throw new Error('the volley does not aim');
    const farVolley = await cdp.eval(hover(12, 8));
    if (!farVolley.bad) throw new Error('the volley reaches too far');
    await cdp.eval(hover(7, 4));
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-league-volley.png'), '.he-canvas');
    await cdp.eval(click(7, 4));
    await cdp.until('heui.view.B.stacks[0].volleyed === true');

    await cdp.eval(start([{ unit: 'halberdier', count: 4, c: 4, r: 4 }], [{ unit: 'plated', count: 5, c: 7, r: 4 }], [100, 0]));
    await frames(cdp, 2);
    await idle();
    const pole = await cdp.eval(hover(7, 4));
    log.push('pole aim: ' + JSON.stringify(pole));
    if (pole.kind !== 'pole' || pole.retal) throw new Error('the halberd does not strike through a cell');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-league-pole.png'), '.he-canvas');
    await cdp.eval(click(7, 4));
    await cdp.until('heui.view.B.stacks[1].count < 5 || heui.view.B.stacks[1].hp < 55');

    await cdp.eval(start([{ unit: 'horseguard', count: 3, c: 2, r: 4 }, { unit: 'alarmist', count: 8, c: 2, r: 8 }], [{ unit: 'pikeman', count: 30, c: 8, r: 4 }, { unit: 'shieldbearer', count: 20, c: 12, r: 8 }], [100, 0, 0, 0]));
    await frames(cdp, 2);
    await idle();
    const brace = await cdp.eval(hover(8, 4));
    log.push('pikes aim: ' + JSON.stringify(brace));
    if (!brace.brace) throw new Error('the tip does not warn about pikes');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-league-brace.png'), '.he-canvas');
    await cdp.eval(`(() => { const B = heui.view.B; B.active = 1; heui.view.rc = null; return true; })()`);
    await frames(cdp, 2);
    await idle();
    const alarm = await cdp.eval(`(() => { const v = heui.view, r = v.buttons.find(b => b.id === 'alarm'); return { on: v.enabled('alarm'), x: r.x, y: r.y }; })()`);
    if (!alarm.on) throw new Error('the alarm button is off');
    await cdp.shot(path.join(out, 'faction-league-alarm.png'), '.he-canvas');
    const before = await cdp.eval('heui.view.B.stacks[0].ready');
    await cdp.eval(`(() => { const v = heui.view, r = v.buttons.find(b => b.id === 'alarm'); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`);
    await cdp.until('heui.view.B.stacks[1].alarmed === true');
    log.push('alarm: horse guard readiness ' + before + ' -> ' + await cdp.eval('heui.view.B.stacks[0].ready'));

    await cdp.eval(start([{ unit: 'mortar', count: 2, c: 1, r: 4 }, { unit: 'culverin', count: 2, c: 1, r: 8 }], [{ unit: 'plated', count: 5, c: 8, r: 4 }, { unit: 'militia', count: 20, c: 8, r: 5 }, { unit: 'crossbow', count: 10, c: 9, r: 4 }], [100, 0, 0, 0, 0]));
    await frames(cdp, 2);
    await idle();
    const mortar = await cdp.eval(hover(8, 4));
    log.push('mortar aim: ' + JSON.stringify(mortar));
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'faction-league-mortar.png'), '.he-canvas');
    await cdp.eval(click(8, 4));
    await cdp.until('heui.view.B.stacks[0].shots < 4');
    await cdp.until('heui.view.beats.length > 0 || !!heui.view.beat', 5000);
    await sleep(350);
    await cdp.shot(path.join(out, 'faction-league-splash.png'), '.he-canvas');
    const hurt = await cdp.eval(`heui.view.B.stacks.filter(s => s.side === 1).map(s => s.unit + ' ' + s.count)`);
    log.push('after the mortar: ' + hurt.join(', '));
  },
  async contracts(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    const opened = await cdp.eval(`(() => {
      const H = Heroes98, TW = H.Town;
      heui.startGame(H.Maps.build('ford', { seed: 7, slots: [{ faction: 'league', human: true }, { faction: 'barrows' }] }));
      const v = heui.view, S = v.S, t = TW.list(S, 0)[0], me = v.hero();
      Object.assign(S.players[0].res, { gold: 60000, wood: 90, ore: 90, salt: 40, sulfur: 40, amber: 20, moonsilver: 20 });
      for (const id of ['tavern', 'hall2', 'special1']) { t.today = false; TW.build(S, t, id, 'a'); }
      [me.c, me.r] = H.MapData.entry(t);
      v.openTown(t);
      heui.view.openBuilding('special1');
      return heui.view.win.kind + ': ' + H.Contracts.board(S, t).map(d => d.kind).join(',');
    })()`);
    log.push('board: ' + opened);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'contracts-board.png'), '.he-canvas');
    const press = id => `(() => { const v = heui.view, r = v.regions.find(q => q.id === ${JSON.stringify(id)}); if (!r) throw new Error('no region ' + ${JSON.stringify(id)}); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`;
    for (let i = 0; i < 3; i++) {
      await cdp.eval(press('ct-take-0'));
      await frames(cdp, 2);
    }
    const taken = await cdp.eval(`heui.game.S.players[0].deals.map(d => d.kind)`);
    log.push('taken: ' + taken.join(','));
    if (taken.length !== 3) throw new Error('contracts were not taken through the window');
    await cdp.shot(path.join(out, 'contracts-taken.png'), '.he-canvas');
    const supply = await cdp.eval(`(() => { const d = heui.game.S.players[0].deals.find(x => x.kind === 'supply'); return d ? { id: d.id, pay: d.pay, gold: heui.game.S.players[0].res.gold } : null; })()`);
    if (supply) {
      await cdp.eval(press('ct-give-' + supply.id));
      await frames(cdp, 2);
      const gold = await cdp.eval('heui.game.S.players[0].res.gold');
      log.push('supply paid: ' + (gold - supply.gold) + ' of ' + supply.pay);
      if (gold - supply.gold !== supply.pay) throw new Error('the supply was not paid');
    }
    await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view; v.closeWin(); v.exit();
      const m = heui.view, S = m.S, d = S.players[0].deals.find(x => x.kind === 'hire'), o = H.Contracts.target(S, d), me = m.hero();
      m.center(o);
      return !!me;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'contracts-map.png'), '.he-canvas');
    const asked = await cdp.eval(`(() => {
      const H = Heroes98, m = heui.view, S = m.S, d = S.players[0].deals.find(x => x.kind === 'hire'), o = H.Contracts.target(S, d), me = m.hero();
      const g = H.Adv.grid(S, o.l, 0), spot = H.Path.DIRS.map(([x, y]) => [o.c + x, o.r + y]).find(([c, r]) => H.MapData.inside(S.map, c, r) && !g.block[H.MapData.idx(S.map, c, r)] && H.MapData.groundCost(S.map, o.l, c, r));
      me.steps = 40;
      const far = H.Path.DIRS.map(([x, y]) => [spot[0] + x, spot[1] + y]).find(([c, r]) => H.MapData.inside(S.map, c, r) && !g.guard[H.MapData.idx(S.map, c, r)] && !g.block[H.MapData.idx(S.map, c, r)] && H.MapData.groundCost(S.map, o.l, c, r));
      [me.c, me.r] = far || spot;
      m.events(H.Adv.engage(S, me, o.id, 'attack'));
      m.pendingModal();
      return { pending: S.pending && S.pending.kind, deal: S.pending && S.pending.deal, price: S.pending && S.pending.price, count: o.count, offer: S.pending && S.pending.offer };
    })()`);
    log.push('hire encounter: ' + JSON.stringify(asked));
    if (asked.pending !== 'encounter' || asked.offer !== 'join' || asked.deal == null) throw new Error('the hire contract did not offer the stack');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'contracts-hire.png'), '.he-canvas');
    const joined = await cdp.eval(`(() => { const m = heui.view, H = Heroes98; m.closeModal('accept'); const S = m.S; return { left: S.players[0].deals.map(d => d.kind), done: S.players[0].dealsDone, army: m.hero().army.filter(Boolean).map(s => s.unit + ' ' + s.count) }; })()`);
    log.push('after hire: ' + JSON.stringify(joined));
    if (joined.left.includes('hire')) throw new Error('the hire contract stayed open');
    await cdp.eval(`(() => { const m = heui.view; m.kingdom = { tab: 'deals' }; return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'contracts-kingdom.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.kingdom = null; return true; })()`);
  },
  async 'town-league'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    await cdp.eval(`(() => {
      heui.startMap();
      const v = heui.view, H = Heroes98, t = H.Town.list(v.S, 0)[0];
      Object.assign(v.S.players[0].res, { gold: 60000, wood: 90, ore: 90, salt: 40, sulfur: 40 });
      for (const id of ['dwell3', 'market', 'smith', 'tavern', 'hall2', 'guild1', 'guild2', 'dwell4', 'special2', 'special3', 'store', 'dwell1u', 'dwell5', 'fort2', 'dwell6', 'caravan']) { t.today = false; H.Town.build(v.S, t, id, 'a'); }
      v.openTown(t);
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-league.png'), '.he-canvas');
    const hover = await cdp.eval(`(() => { const v = heui.view, e = Heroes98.TownDraw.LAYOUT.league.find(x => x[0] === 'special2'); v.pointer('move', e[2] + e[4] / 2, e[3] + e[5] / 2, 0); return v.hover; })()`);
    log.push('town-league hover: ' + hover);
    if (hover !== 'special2') throw new Error('hovering the bell tower does not pick it');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-league-hover.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, e = Heroes98.TownDraw.LAYOUT.league.find(x => x[0] === 'dwell3'); v.pointer('move', e[2] + e[4] / 2, e[3] + e[5] - 10, 0); v.pointer('down', e[2] + e[4] / 2, e[3] + e[5] - 10, 0); v.pointer('up', 0, 0, 0); return true; })()`);
    await frames(cdp, 2);
    const rec = await cdp.eval('({ win: heui.view.win && heui.view.win.kind, unit: heui.view.win && heui.view.win.unit, n: heui.view.win && heui.view.win.n })');
    log.push('town-league recruit window: ' + JSON.stringify(rec));
    if (rec.win !== 'recruit') throw new Error('a click on the dwelling does not open the recruit window');
    await cdp.eval(`(() => { const v = heui.view, b = v.regions.find(r => r.id === 'r-max'); v.pointer('move', b.x + 2, b.y + 2, 0); v.pointer('down', b.x + 2, b.y + 2, 0); v.pointer('up', 0, 0, 0); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-recruit.png'), '.he-canvas');
    const before = await cdp.eval('heui.view.o.pool[2]');
    await cdp.eval(`(() => { const v = heui.view, b = v.regions.find(r => r.id === 'r-hire'); v.pointer('move', b.x + 2, b.y + 2, 0); v.pointer('down', b.x + 2, b.y + 2, 0); v.pointer('up', 0, 0, 0); return true; })()`);
    const after = await cdp.eval('({ pool: heui.view.o.pool[2], hero: heui.view.S.heroes[0].army.filter(Boolean).map(s => s.unit + ":" + s.count) })');
    log.push('town-league hire: pool ' + before + ' -> ' + JSON.stringify(after));
    if (after.pool >= before) throw new Error('hiring did not take creatures from the dwelling');
    for (const [kind, file] of [['all', 'town-all.png'], ['tavern', 'town-tavern.png'], ['market', 'town-market.png'], ['guild', 'town-guild.png']]) {
      await cdp.eval(`(() => { const v = heui.view; v.win = null; v.press(${JSON.stringify(kind)}); return true; })()`);
      await frames(cdp, 2);
      await cdp.shot(path.join(out, file), '.he-canvas');
    }
    await cdp.eval(`(() => { const v = heui.view, a = Heroes98.Town.visitor(v.S, v.o).army; v.win = null; v.cellDown('hero', a, 0); v.cellDrop({ key: 'garrison', army: v.o.garrison, slot: 0 }); return true; })()`);
    await frames(cdp, 2);
    const rows = await cdp.eval('({ garrison: heui.view.o.garrison.filter(Boolean).map(s => s.unit + ":" + s.count), hero: heui.view.S.heroes[0].army.filter(Boolean).map(s => s.unit + ":" + s.count) })');
    log.push('town-league rows: ' + JSON.stringify(rows));
    if (!rows.garrison.length) throw new Error('a stack did not move to the garrison');
    await cdp.shot(path.join(out, 'town-league-rows.png'), '.he-canvas');
    await cdp.key('Escape', 'Escape', 27);
    await frames(cdp, 2);
    if (!(await cdp.eval('heui.view instanceof Heroes98.MapView && !heui.menu'))) throw new Error('Esc does not leave the town');
    await cdp.eval(`(() => { heui.view.press('kingdom'); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'kingdom.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.kingdom.tab = 'income'; return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'kingdom-income.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.kingdom = null; return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'map-town.png'), '.he-canvas');
  },
  async 'town-barrows'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    await cdp.eval(`(() => {
      heui.startMap();
      const v = heui.view, H = Heroes98, t = H.Town.list(v.S)[1], h = v.hero();
      h.army[3] = { unit: 'plated', count: 30 };
      h.c = 45; h.r = 23; v.S.ver++;
      H.Adv.reveal(v.S, 0, 0, 45, 23, 6);
      v.center(h);
      return true;
    })()`);
    await frames(cdp, 2);
    await cdp.eval(`(() => { const v = heui.view, at = [45 * 32 + 16 - v.cam.x, 24 + 21 * 32 + 16 - v.cam.y]; v.pointer('move', at[0], at[1], 0); v.pointer('down', at[0], at[1], 0); v.go(); return true; })()`);
    await cdp.until('!!heui.view.modal', 20000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-siege-ask.png'), '.he-canvas');
    const ask = await cdp.eval('({ title: heui.view.modal.title, lines: heui.view.modal.lines })');
    log.push('town-barrows garrison: ' + JSON.stringify(ask));
    await cdp.eval(`(() => { const v = heui.view, m = v.modal; v.modal = null; m.pick('fight'); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.BattleView', 10000);
    await cdp.eval('heui.view.quick(), true');
    await cdp.until('!!heui.view.result', 30000);
    await cdp.eval(`(() => { const v = heui.view, b = v.resultButtons[0]; v.pointer('down', b.x + 2, b.y + 2, 0); return true; })()`);
    for (let i = 0; i < 20; i++) {
      await frames(cdp, 2);
      const leveling = await cdp.eval(`(() => { const v = heui.view; if (!(v instanceof Heroes98.LevelView)) return false; const r = v.regions.find(q => q.act); if (r) { v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); } return true; })()`);
      if (!leveling) break;
    }
    await cdp.until('heui.view instanceof Heroes98.TownView', 10000);
    const taken = await cdp.eval('({ name: heui.view.o.name, owner: heui.view.o.owner, faction: heui.view.o.faction })');
    log.push('town-barrows taken: ' + JSON.stringify(taken));
    if (taken.owner !== 0 || taken.faction !== 'barrows') throw new Error('the Курганы town was not taken');
    await cdp.eval(`(() => {
      const v = heui.view, H = Heroes98, t = v.o;
      Object.assign(v.S.players[0].res, { gold: 60000, wood: 90, ore: 90, salt: 60 });
      for (const id of ['smith', 'guild1', 'dwell4', 'hall2', 'special1', 'special3', 'special4', 'dwell5', 'dwell6', 'store', 'dwell2u', 'fort2', 'guild2']) { t.today = false; H.Town.build(v.S, t, id, 'b'); }
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-barrows.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, e = Heroes98.TownDraw.LAYOUT.barrows.find(x => x[0] === 'dwell4'); v.pointer('move', e[2] + e[4] / 2, e[3] + e[5] / 2, 0); return v.hover; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-barrows-hover.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.openRecruit(2); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-barrows-recruit.png'), '.he-canvas');
  },
  async 'town-thicket'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const built = await cdp.eval(`(() => {
      const H = Heroes98, TW = H.Town;
      heui.startGame(H.Maps.build('ford', { seed: 7, slots: [{ faction: 'thicket', human: true }, { faction: 'league' }] }));
      const v = heui.view, S = v.S, t = TW.list(S, 0)[0];
      Object.assign(S.players[0].res, { gold: 90000, wood: 120, ore: 120, amber: 90, moonsilver: 30 });
      for (const id of ['smith', 'market', 'guild1', 'dwell3', 'hall2', 'special1', 'special2', 'special3', 'special4', 'dwell4', 'dwell5', 'dwell6', 'dwell7', 'store', 'dwell2u', 'fort2', 'guild2', 'caravan']) { t.today = false; if (H.Town.why ? !H.Town.why(S, t, id) : true) H.Town.build(S, t, id, 'a'); }
      v.openTown(t);
      return t.built.length;
    })()`);
    log.push('town-thicket buildings: ' + built);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-thicket.png'), '.he-canvas');
    const hover = await cdp.eval(`(() => { const v = heui.view, e = Heroes98.TownDraw.LAYOUT.thicket.find(x => x[0] === 'special2'); v.pointer('move', e[2] + e[4] / 2, e[3] + e[5] / 2, 0); return v.hover; })()`);
    log.push('town-thicket hover: ' + hover);
    if (hover !== 'special2') throw new Error('hovering the birch does not pick it');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-thicket-hover.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.openRecruit(2); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-thicket-recruit.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.closeWin(); heui.view.openWin({ kind: 'blueprint' }); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-thicket-blueprint.png'), '.he-canvas');
  },
  async 'town-tide'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const built = await cdp.eval(`(() => {
      const H = Heroes98, TW = H.Town;
      heui.startGame(H.Maps.build('ford', { seed: 7, slots: [{ faction: 'tide', human: true }, { faction: 'league' }] }));
      const v = heui.view, S = v.S, t = TW.list(S, 0)[0];
      t.water = true;
      Object.assign(S.players[0].res, { gold: 90000, wood: 120, ore: 120, amber: 90, salt: 90, moonsilver: 30 });
      for (const id of ['smith', 'market', 'guild1', 'dwell3', 'hall2', 'special1', 'special2', 'special3', 'special4', 'dwell4', 'dwell5', 'dwell6', 'dwell7', 'store', 'dwell2u', 'fort2', 'guild2', 'caravan', 'shipyard']) { t.today = false; if (TW.can ? TW.can(S, t, id) : true) TW.build(S, t, id); }
      v.openTown(t);
      return t.built.length;
    })()`);
    log.push('town-tide buildings: ' + built);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-tide.png'), '.he-canvas');
    const hover = await cdp.eval(`(() => { const v = heui.view, e = Heroes98.TownDraw.LAYOUT.tide.find(x => x[0] === 'special3'); v.pointer('move', e[2] + e[4] / 2, e[3] + e[5] / 2, 0); return v.hover; })()`);
    log.push('town-tide hover: ' + hover);
    if (hover !== 'special3') throw new Error('hovering the lighthouse does not pick it');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-tide-hover.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.openRecruit(2); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-tide-recruit.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.closeWin(); heui.view.openWin({ kind: 'blueprint' }); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-tide-blueprint.png'), '.he-canvas');
  },
  async 'town-forge'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const built = await cdp.eval(`(() => {
      const H = Heroes98, TW = H.Town;
      heui.startGame(H.Maps.build('ford', { seed: 7, slots: [{ faction: 'forge', human: true }, { faction: 'league' }] }));
      const v = heui.view, S = v.S, t = TW.list(S, 0)[0];
      Object.assign(S.players[0].res, { gold: 90000, wood: 120, ore: 220, sulfur: 90, moonsilver: 30 });
      for (const id of ['smith', 'market', 'guild1', 'dwell3', 'hall2', 'special1', 'special2', 'special3', 'special4', 'dwell4', 'dwell5', 'dwell6', 'dwell7', 'store', 'dwell2u', 'fort2', 'guild2', 'caravan']) { t.today = false; TW.build(S, t, id); }
      v.openTown(t);
      return t.built.length;
    })()`);
    log.push('town-forge buildings: ' + built);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-forge.png'), '.he-canvas');
    const hover = await cdp.eval(`(() => { const v = heui.view, e = Heroes98.TownDraw.LAYOUT.forge.find(x => x[0] === 'special1'); v.pointer('move', e[2] + e[4] / 2, e[3] + e[5] / 2, 0); return v.hover; })()`);
    log.push('town-forge hover: ' + hover);
    if (hover !== 'special1') throw new Error('hovering the great forge does not pick it');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-forge-hover.png'), '.he-canvas');
    const forged = await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, S = v.S, t = v.o, h = H.Town.visitor(S, t);
      if (!h) return { hero: false };
      const plains = Object.values(H.ARTIFACTS).filter(a => a.rank === 'plain' && !a.scroll && a.slot === 'head');
      h.bag = [plains[0].id, plains[1].id, plains[2].id];
      v.openBuilding('special1');
      return { hero: true, win: v.win && v.win.kind, pairs: H.Town.reforgePairs(h).length };
    })()`);
    log.push('reforge window: ' + JSON.stringify(forged));
    if (forged.win !== 'reforge' || !forged.pairs) throw new Error('the reforge window has no pairs');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-forge-reforge.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, r = v.regions.find(q => q.id === 'reforge-0'); v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); v.pointer('up', r.x + 4, r.y + 4, 0); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-forge-reforged.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.closeWin(); heui.view.openWin({ kind: 'blueprint' }); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-forge-blueprint.png'), '.he-canvas');
  },
  async 'town-throne'(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const built = await cdp.eval(`(() => {
      const H = Heroes98, TW = H.Town;
      heui.startGame(H.Maps.build('ford', { seed: 7, slots: [{ faction: 'throne', human: true }, { faction: 'league' }] }));
      const v = heui.view, S = v.S, t = TW.list(S, 0)[0];
      Object.assign(S.players[0].res, { gold: 90000, wood: 120, ore: 120, moonsilver: 90 });
      for (const id of ['smith', 'market', 'guild1', 'dwell3', 'hall2', 'special1', 'special2', 'special4', 'dwell4', 'dwell5', 'special3', 'dwell6', 'dwell7', 'store', 'dwell2u', 'fort2', 'guild2', 'caravan']) { t.today = false; TW.build(S, t, id); }
      v.openTown(t);
      return t.built.length;
    })()`);
    log.push('town-throne buildings: ' + built);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-throne.png'), '.he-canvas');
    const hover = await cdp.eval(`(() => { const v = heui.view, e = Heroes98.TownDraw.LAYOUT.throne.find(x => x[0] === 'special1'); v.pointer('move', e[2] + e[4] / 2, e[3] + e[5] / 2, 0); return v.hover; })()`);
    log.push('town-throne hover: ' + hover);
    if (hover !== 'special1') throw new Error('hovering the white throne does not pick it');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-throne-hover.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.openRecruit(4); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'town-throne-recruit.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.closeWin(); heui.view.openWin({ kind: 'blueprint' }); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'town-throne-blueprint.png'), '.he-canvas');
  },
  async blueprint(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    await cdp.eval(`(() => {
      heui.startMap();
      const v = heui.view, H = Heroes98, t = H.Town.list(v.S, 0)[0];
      for (const id of ['dwell3', 'market', 'smith']) { t.today = false; H.Town.build(v.S, t, id); }
      t.today = false;
      v.openTown(t);
      heui.view.press('blueprint');
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'blueprint.png'), '.he-canvas');
    const st = await cdp.eval(`(() => { const v = heui.view, H = Heroes98; return Object.fromEntries(['dwell4', 'hall2', 'special1', 'shipyard', 'dwell7'].map(id => [id, H.Town.state(v.S, v.o, id).s])); })()`);
    log.push('blueprint states: ' + JSON.stringify(st));
    await cdp.eval(`(() => { const v = heui.view, f = v.frameAt('dwell5'); v.pointer('move', f.x + 4, f.y + 4, 0); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'blueprint-hover.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, f = v.frameAt('dwell1u'); v.pointer('move', f.x + 4, f.y + 4, 0); v.pointer('down', f.x + 4, f.y + 4, 0); v.pointer('up', 0, 0, 0); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'blueprint-build.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, b = v.regions.find(r => r.id === 'b-go'); v.pointer('move', b.x + 2, b.y + 2, 0); v.pointer('down', b.x + 2, b.y + 2, 0); v.pointer('up', 0, 0, 0); return v.win.kind; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'blueprint-branch.png'), '.he-canvas');
    const kind = await cdp.eval('heui.view.win && heui.view.win.kind');
    if (kind !== 'branch') throw new Error('the upgraded dwelling does not ask for a branch');
    await cdp.eval(`(() => { const v = heui.view, b = v.regions.find(r => r.id === 'br-b'); v.pointer('move', b.x + 2, b.y + 2, 0); v.pointer('down', b.x + 2, b.y + 2, 0); v.pointer('up', 0, 0, 0); return true; })()`);
    await frames(cdp, 3);
    const done = await cdp.eval('({ branch: heui.view.o.branch[1], built: heui.view.o.built.includes("dwell1u"), win: heui.view.win })');
    log.push('blueprint branch: ' + JSON.stringify(done));
    if (done.branch !== 'b' || !done.built) throw new Error('the branch was not built');
    await cdp.shot(path.join(out, 'blueprint-done.png'), '.he-canvas');
  },
  async hero(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    await cdp.eval(`(() => { heui.startMap(); heui.view.hero().xp = Heroes98.XP_TABLE[6]; return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.LevelView', 10000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'hero-level.png'), '.he-canvas');
    const seen = [];
    for (let i = 0; i < 40; i++) {
      const st = await cdp.eval(`(() => { const v = heui.view; if (!(v instanceof Heroes98.LevelView)) return null; const u = v.h.up; return u ? u.step + ':' + u.level : 'none'; })()`);
      if (st === null) break;
      seen.push(st);
      if (st === 'talent:6') {
        await frames(cdp, 2);
        await cdp.shot(path.join(out, 'hero-level-talent.png'), '.he-canvas');
      }
      if (st === 'perk:' + st.split(':')[1]) {
        await frames(cdp, 2);
        await cdp.shot(path.join(out, 'hero-level-perk.png'), '.he-canvas');
      }
      await cdp.eval(`(() => { const v = heui.view, r = v.regions.find(q => q.act); if (r) { v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); } return true; })()`);
      await frames(cdp, 2);
    }
    log.push('hero level steps: ' + seen.join(' '));
    const lv = await cdp.eval(`(() => { const h = heui.view.hero(); return { level: h.level, skills: h.skills, perks: h.perks, talents: h.talents, stats: [h.atk, h.def, h.power, h.wis] }; })()`);
    log.push('hero after levels: ' + JSON.stringify(lv));
    if (lv.level !== 6 || lv.talents.length !== 1) throw new Error('level 6 talent was not taken');
    await cdp.eval(`(() => {
      const v = heui.view, h = v.hero(), HE = Heroes98.Hero;
      for (const id of ['bellcuirass', 'khanaxe', 'couriers', 'saltring', 'millerring', 'luckbone', 'wormwood', 'quilted', 'eldersword', 'saltcharm', 'roadcloak']) HE.giveArt(h, id);
      h.army[0].stars = 2;
      h.army[1].stars = 1;
      v.S.ver++;
      v.pointer('move', 140, 490, 0);
      v.pointer('down', 140, 490, 0);
      v.pointer('up', 140, 490, 0);
      return true;
    })()`);
    await cdp.until('heui.view instanceof Heroes98.HeroView', 5000);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'hero.png'), '.he-canvas');
    const drag = await cdp.eval(`(() => {
      const v = heui.view, h = v.h, a = v.regions.find(r => r.id === 'art-0'), b = v.regions.find(r => r.id === 'art-body');
      const item = h.bag[0], worn = h.arts.body;
      v.pointer('move', a.x + 4, a.y + 4, 0);
      v.pointer('down', a.x + 4, a.y + 4, 0);
      v.pointer('move', b.x + 4, b.y + 4, 0);
      v.pointer('up', b.x + 4, b.y + 4, 0);
      return { item, worn, body: h.arts.body, bag0: h.bag[0] };
    })()`);
    log.push('hero drag artifact: ' + JSON.stringify(drag));
    if (drag.body !== drag.item || drag.bag0 !== drag.worn) throw new Error('dragging from the bag to the body place did not swap');
    await cdp.eval(`(() => { const v = heui.view, c = v.regions.find(r => r.id === 'art-head'); v.pointer('move', c.x + 4, c.y + 4, 0); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'hero-tip.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, c = v.regions.find(r => r.id === 'cell-hero0'); v.pointer('move', c.x + 4, c.y + 4, 0); v.pointer('down', c.x + 4, c.y + 4, 2); v.pointer('up', c.x + 4, c.y + 4, 2); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'hero-split.png'), '.he-canvas');
    const split = await cdp.eval(`(() => { const v = heui.view, b = v.regions.find(r => r.id === 'split-go'); v.pointer('move', b.x + 4, b.y + 4, 0); v.pointer('down', b.x + 4, b.y + 4, 0); v.pointer('up', b.x + 4, b.y + 4, 0); return v.h.army.filter(Boolean).map(s => s.unit + ':' + s.count + ':' + (s.stars || 0)); })()`);
    log.push('hero split: ' + JSON.stringify(split));
    if (split.filter(s => s.startsWith('militia')).length !== 2) throw new Error('split did not make two stacks');
    await cdp.key('Escape', 'Escape', 27);
    await frames(cdp, 2);
    if (!(await cdp.eval('heui.view instanceof Heroes98.MapView'))) throw new Error('Esc does not close the hero window');
    const two = await cdp.eval(`(() => {
      const v = heui.view, H = Heroes98, t = H.Town.list(v.S, 0)[0], a = v.hero();
      const r = H.Town.hire(v.S, t, 0);
      const b = v.S.heroes[1];
      H.Hero.giveArt(b, 'scoutcloak');
      v.S.ver++;
      return { ok: r.ok, at: [b.c, b.r], gate: [a.c, a.r], adj: H.Hero.adjacent(a, b) };
    })()`);
    log.push('hero second: ' + JSON.stringify(two));
    if (!two.adj) throw new Error('the hired hero does not stand next to the first');
    await frames(cdp, 2);
    await cdp.eval(`(() => { const v = heui.view, b = v.S.heroes[1], x = b.c * 32 + 16 - v.cam.x, y = 24 + b.r * 32 + 16 - v.cam.y; v.pointer('move', x, y, 0); v.pointer('down', x, y, 0); v.pointer('up', x, y, 0); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.ExchangeView', 5000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'hero-exchange.png'), '.he-canvas');
    const ex = await cdp.eval(`(() => {
      const v = heui.view, b = v.regions.find(r => r.id === 'give-a' + v.a.id), before = v.b.army.filter(Boolean).length;
      v.pointer('move', b.x + 4, b.y + 4, 0);
      v.pointer('down', b.x + 4, b.y + 4, 0);
      v.pointer('up', b.x + 4, b.y + 4, 0);
      return { before, after: v.b.army.filter(Boolean).length, left: v.a.army.filter(Boolean).map(s => s.unit + ':' + s.count) };
    })()`);
    log.push('hero exchange: ' + JSON.stringify(ex));
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'hero-exchange-given.png'), '.he-canvas');
    await cdp.key('Escape', 'Escape', 27);
    await frames(cdp, 2);
    const fight = await cdp.eval(`(() => {
      const v = heui.view, H = Heroes98, h = v.S.heroes[1];
      v.sel = h.id;
      h.skills.tactics = 2;
      h.skills.leadership = 3;
      h.perks.push('warcry');
      h.army = [{ unit: 'militia', count: 80 }, { unit: 'crossbow', count: 30 }, { unit: 'ringer', count: 10 }, { unit: 'horseguard', count: 3 }, null, null, null];
      h.c = 13; h.r = 37;
      v.S.ver++;
      H.Adv.reveal(v.S, 0, 0, 13, 37, 6);
      v.center(h);
      return true;
    })()`);
    log.push('hero fight ready: ' + fight);
    await frames(cdp, 2);
    await cdp.eval(`(() => { const v = heui.view, x = 16 * 32 + 16 - v.cam.x, y = 24 + 34 * 32 + 16 - v.cam.y; v.pointer('move', x, y, 0); v.pointer('down', x, y, 0); v.go(); return true; })()`);
    await cdp.until('!!heui.view.modal', 20000);
    await cdp.eval(`(() => { const v = heui.view; v.closeModal('fight'); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.BattleView', 10000);
    await frames(cdp, 3);
    if (!(await cdp.eval('heui.view.deploying'))) throw new Error('Тактика does not open the deployment');
    await cdp.shot(path.join(out, 'battle-deploy.png'), '.he-canvas');
    const dep = await cdp.eval(`(() => {
      const v = heui.view, D = Heroes98.BattleDraw, s = v.B.stacks[0], p = D.center(s.c, s.r), q = D.center(3, 4);
      v.pointer('down', p[0], p[1], 0);
      v.pointer('down', q[0], q[1], 0);
      const placed = [s.c, s.r];
      v.pointer('move', 400, 470, 0);
      v.pointer('down', 400, 470, 0);
      return { placed, deploying: v.deploying };
    })()`);
    log.push('battle deploy: ' + JSON.stringify(dep));
    if (dep.placed[0] !== 3 || dep.deploying) throw new Error('deployment did not place the stack');
    await cdp.until('heui.view.mine() && heui.view.rc', 30000);
    const order = await cdp.eval(`(() => {
      const v = heui.view, Bt = Heroes98.Battle, B = v.B, s = v.mine();
      v.press('order');
      const t = Bt.alive(B).find(x => x.side === s.side && x !== s), p = Heroes98.BattleDraw.stackPos(t);
      v.pointer('move', p[0], p[1] - 2, 0);
      return { mode: v.mode, ally: !!(v.hover && v.hover.ally), target: t.id, ready: t.ready };
    })()`);
    log.push('battle order: ' + JSON.stringify(order));
    if (order.mode !== 'warcry' || !order.ally) throw new Error('Клич does not aim at an ally');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'battle-order.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.pointer('down', v.mouse[0], v.mouse[1], 0); return true; })()`);
    await frames(cdp, 4);
    const after = await cdp.eval('({ ready: heui.view.B.stacks[' + order.target + '].ready, used: heui.view.B.sides[0].used })');
    log.push('battle after order: ' + JSON.stringify(after));
    if (!after.used.warcry) throw new Error('Клич was not used');
    await cdp.eval('heui.view.quick(), true');
    await cdp.until('!!heui.view.result', 30000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'battle-result-hero.png'), '.he-canvas');
  },
  async magic(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    await cdp.eval(`(() => {
      heui.startMap();
      const v = heui.view, H = Heroes98, h = v.hero(), HE = H.Hero;
      v.S.moons = ['gold', 'green', 'black', 'silver', 'white', 'red', 'azure', 'convergence'];
      h.level = 14;
      h.skills.zhar = 2;
      h.skills.yasna = 3;
      h.power = 9;
      h.wis = 12;
      h.mana = 120;
      for (const id of ['spark', 'firearrow', 'fireball', 'meteor', 'balm', 'blessing', 'dawn', 'skyveil', 'resurrect', 'whitefull', 'haste']) HE.learn(h, id);
      v.S.ver++;
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'magic-map-moon.png'), '.he-canvas');
    await cdp.key('c', 'KeyC', 67);
    await frames(cdp, 3);
    if (!(await cdp.eval('heui.view.calendar'))) throw new Error('C does not open the calendar');
    await cdp.shot(path.join(out, 'calendar.png'), '.he-canvas');
    await cdp.key('Escape', 'Escape', 27);
    await frames(cdp, 2);
    if (await cdp.eval('heui.view.calendar || !!heui.menu')) throw new Error('Esc does not close the calendar');
    await cdp.key('b', 'KeyB', 66);
    await cdp.until('heui.view instanceof Heroes98.BookView', 5000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'book-road.png'), '.he-canvas');
    const road = await cdp.eval(`(() => {
      const v = heui.view, r = v.regions.find(q => q.id === 'sp-tailwind'), h = v.parent.hero(), before = h.steps;
      v.pointer('move', r.x + 40, r.y + 20, 0);
      v.pointer('down', r.x + 40, r.y + 20, 0);
      return { before, after: h.steps, view: heui.view.constructor.name, mana: h.mana };
    })()`);
    log.push('magic road: ' + JSON.stringify(road));
    if (road.after !== road.before + 5) throw new Error('Попутный ветер from the book did not work');
    await cdp.eval(`(() => { const v = heui.view; v.pointer('move', 140, 490, 0); v.pointer('down', 140, 490, 0); v.pointer('up', 140, 490, 0); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.HeroView', 5000);
    await frames(cdp, 2);
    await cdp.eval(`(() => { const v = heui.view, b = v.regions.find(r => r.id === 'h-book'); v.pointer('move', b.x + 4, b.y + 4, 0); v.pointer('down', b.x + 4, b.y + 4, 0); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.BookView', 5000);
    await frames(cdp, 2);
    await cdp.eval(`(() => { const v = heui.view, t = v.regions.find(r => r.id === 'tab-zhar'); v.pointer('move', t.x + 4, t.y + 4, 0); v.pointer('down', t.x + 4, t.y + 4, 0); return true; })()`);
    await frames(cdp, 2);
    await cdp.eval(`(() => { const v = heui.view, r = v.regions.find(q => q.id === 'sp-fireball'); v.pointer('move', r.x + 40, r.y + 20, 0); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'book-school.png'), '.he-canvas');
    await cdp.key('Escape', 'Escape', 27);
    await frames(cdp, 2);
    await cdp.key('Escape', 'Escape', 27);
    await cdp.until('heui.view instanceof Heroes98.MapView', 5000);
    await cdp.eval(`(() => {
      const v = heui.view, H = Heroes98, h = v.hero();
      h.army = [{ unit: 'militia', count: 80 }, { unit: 'crossbow', count: 30 }, { unit: 'ringer', count: 10 }, { unit: 'plated', count: 6 }, null, null, null];
      h.c = 13; h.r = 37;
      v.S.ver++;
      H.Adv.reveal(v.S, 0, 0, 13, 37, 6);
      v.center(h);
      return true;
    })()`);
    await frames(cdp, 2);
    await cdp.eval(`(() => { const v = heui.view, x = 16 * 32 + 16 - v.cam.x, y = 24 + 34 * 32 + 16 - v.cam.y; v.pointer('move', x, y, 0); v.pointer('down', x, y, 0); v.go(); return true; })()`);
    await cdp.until('!!heui.view.modal', 20000);
    await cdp.eval(`(() => { heui.view.closeModal('fight'); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.BattleView', 10000);
    await cdp.until('heui.view.mine() && heui.view.rc', 30000);
    await cdp.key('c', 'KeyC', 67);
    await cdp.until('heui.view instanceof Heroes98.BookView', 5000);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'book-battle.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view, t = v.regions.find(r => r.id === 'tab-zhar'); v.pointer('move', t.x + 4, t.y + 4, 0); v.pointer('down', t.x + 4, t.y + 4, 0); return true; })()`);
    await frames(cdp, 2);
    await cdp.eval(`(() => { const v = heui.view, r = v.regions.find(q => q.id === 'sp-fireball'); v.pointer('move', r.x + 40, r.y + 20, 0); v.pointer('down', r.x + 40, r.y + 20, 0); return true; })()`);
    await cdp.until('heui.view instanceof Heroes98.BattleView && heui.view.mode === "spell"', 5000);
    const aimed = await cdp.eval(`(() => { const v = heui.view, H = Heroes98, p = H.BattleDraw.center(7, 5); v.pointer('move', p[0], p[1], 0); return { kind: v.mode, area: v.hover && v.hover.area && v.hover.area.length, mana: v.B.sides[0].hero.mana }; })()`);
    log.push('magic aim: ' + JSON.stringify(aimed));
    if (aimed.area !== 7) throw new Error('Огненный шар does not show its seven cells');
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'battle-aim-spell.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.pointer('down', v.mouse[0], v.mouse[1], 0); return true; })()`);
    await frames(cdp, 8);
    await cdp.shot(path.join(out, 'battle-cast.png'), '.he-canvas');
    const cast = await cdp.eval(`({ mana: heui.view.B.sides[0].hero.mana, acted: heui.view.B.sides[0].acted, round: heui.view.B.round, log: heui.view.log.slice(-4) })`);
    log.push('magic cast: ' + JSON.stringify(cast));
    if (cast.mana >= aimed.mana) throw new Error('the spell took no mana');
    await cdp.until('heui.view.B.winner >= 0 || (heui.view.mine() && heui.view.rc)', 30000);
    await cdp.eval(`(() => {
      const v = heui.view, Bt = Heroes98.Battle, B = v.B;
      if (B.winner >= 0) return false;
      const own = Bt.alive(B).filter(s => s.side === 0);
      B.sides[0].acted = 0;
      const a = Bt.castOptions(B, 'blessing')[0];
      v.castNow(a);
      return true;
    })()`);
    await frames(cdp, 8);
    await cdp.eval(`(() => { const v = heui.view, s = v.B.stacks[0], p = Heroes98.BattleDraw.stackPos(s); v.pointer('down', p[0], p[1] - 4, 2); return true; })()`);
    await frames(cdp, 2);
    await cdp.shot(path.join(out, 'battle-effects.png'), '.he-canvas');
    await cdp.eval(`heui.view.pointer('up', 0, 0, 2), true`);
    await cdp.eval('heui.view.quick(), true');
    await cdp.until('!!heui.view.result', 30000);
    await cdp.eval(`(() => { const v = heui.view, b = v.resultButtons[0]; v.pointer('down', b.x + 2, b.y + 2, 0); return true; })()`);
    for (let i = 0; i < 20; i++) {
      await frames(cdp, 2);
      const leveling = await cdp.eval(`(() => { const v = heui.view; if (!(v instanceof Heroes98.LevelView)) return false; const r = v.regions.find(q => q.act); if (r) { v.pointer('move', r.x + 4, r.y + 4, 0); v.pointer('down', r.x + 4, r.y + 4, 0); } return true; })()`);
      if (!leveling) break;
    }
    await cdp.until('heui.view instanceof Heroes98.MapView', 5000);
    const manaAfter = await cdp.eval('heui.view.hero().mana');
    log.push('magic mana on the map: ' + manaAfter);
    if (manaAfter >= 120) throw new Error('spent mana did not stay spent');
    await cdp.eval(`(() => {
      const v = heui.view, H = Heroes98, t = H.Town.list(v.S, 0)[0], h = v.hero();
      Object.assign(v.S.players[0].res, { gold: 60000, wood: 90, ore: 90, salt: 40, sulfur: 40, moonsilver: 20 });
      h.c = 5; h.r = 40;
      for (const id of ['guild1', 'guild2', 'guild3', 'guild4', 'guild5']) { t.today = false; H.Town.build(v.S, t, id); }
      v.S.ver++;
      v.openTown(t);
      heui.view.press('guild');
      return true;
    })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'guild.png'), '.he-canvas');
    const guild = await cdp.eval(`(() => { const v = heui.view, o = v.o; return { shelves: [1, 2, 3, 4, 5].map(c => Heroes98.Town.shelf(o, c).length), known: Heroes98.Town.visitor(v.S, o).spells.length }; })()`);
    log.push('magic guild: ' + JSON.stringify(guild));
    if (guild.shelves.join() !== '4,3,3,2,1') throw new Error('guild shelves are wrong');
  },
  async leaks(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 2');
    const r = await cdp.eval(`(async () => {
      const H = Heroes98, before = { ...H.live };
      let peak = 0;
      for (let i = 0; i < 10; i++) {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:600px';
        document.body.appendChild(el);
        const ui = new H.UI(el, { isActive: () => true });
        if (ui.audio()) peak = Math.max(peak, H.live.audio);
        await new Promise(r => setTimeout(r, 60));
        ui.destroy();
        el.remove();
      }
      await new Promise(r => setTimeout(r, 200));
      return { before, after: { ...H.live }, peak };
    })()`);
    log.push('leaks: ' + JSON.stringify(r));
    for (const k of Object.keys(r.before)) if (r.after[k] !== r.before[k]) throw new Error('leak in ' + k);
    if (r.peak !== r.before.audio + 1) throw new Error('audio context was not created');
  },
  async editor(cdp, out, log) {
    await cdp.open('/heroes98.html?editor');
    await cdp.until('window.heui && heui.editor && heui.editor.visible');
    const drag = (from, to) => `(() => {
      const ed = heui.editor, s = ed.scroller, r = s.getBoundingClientRect();
      const at = ([c, y]) => ({ clientX: r.left + c * 32 + 16 - s.scrollLeft, clientY: r.top + y * 32 + 16 - s.scrollTop, button: 0, buttons: 1, pointerId: 1, bubbles: true });
      s.dispatchEvent(new PointerEvent('pointerdown', at(${JSON.stringify(from)})));
      s.dispatchEvent(new PointerEvent('pointermove', at(${JSON.stringify(to)})));
      s.dispatchEvent(new PointerEvent('pointerup', at(${JSON.stringify(to)})));
      return true;
    })()`;
    const tool = js => cdp.eval(`(() => { heui.editor.setTool(${js}); return true; })()`);
    await cdp.eval(`(() => { const H = Heroes98; heui.editor.setDoc(H.MapFile.blank({ w: 48, levels: 2, players: 2, name: 'Малая проба' })); heui.editor.brush = 5; return true; })()`);
    await tool(`{ kind: 'terrain', id: 'forest' }`);
    await cdp.eval(drag([8, 12], [12, 14]));
    await tool(`{ kind: 'terrain', id: 'water' }`);
    await cdp.eval(drag([16, 3], [16, 6]));
    await tool(`{ kind: 'road', v: 1 }`);
    await cdp.eval(drag([2, 9], [14, 9]));
    await tool(`{ kind: 'river', v: 1 }`);
    await cdp.eval(drag([3, 14], [10, 3]));
    await tool(`{ kind: 'town', faction: 'league' }`);
    await cdp.eval(drag([1, 5], [1, 5]));
    await tool(`{ kind: 'town', faction: 'barrows' }`);
    await cdp.eval(drag([18, 10], [18, 10]));
    await tool(`{ kind: 'object', t: 'goldmine' }`);
    await cdp.eval(drag([7, 6], [7, 6]));
    const placed = await cdp.eval(`(() => {
      const ed = heui.editor, M = ed.doc.map, towns = M.objs.filter(o => o.t === 'town');
      return { towns: towns.length, water: M.ter[0].filter(v => v === Heroes98.TERRAIN_INDEX.water).length, road: M.road[0].filter(Boolean).length, river: M.river[0].filter(Boolean).length, mine: M.objs.some(o => o.t === 'goldmine'), undo: ed.undo.length, sel: !!ed.sel };
    })()`);
    log.push('editor placed: ' + JSON.stringify(placed));
    if (placed.towns !== 2 || !placed.water || !placed.road || !placed.river || !placed.mine || placed.undo < 7) throw new Error('editor pointer tools failed');
    await cdp.eval(`(() => {
      const ed = heui.editor, M = ed.doc.map, towns = M.objs.filter(o => o.t === 'town');
      ed.edit(() => { towns[0].owner = 0; towns[1].owner = 1; });
      ed.tab = 'objects';
      ed.setTool({ kind: 'select' });
      ed.sel = { obj: towns[0] };
      ed.renderProps();
      ed.runCheck(true);
      return true;
    })()`);
    await sleep(300);
    await cdp.shot(path.join(out, 'editor-main.png'));
    const issues = await cdp.eval(`heui.editor.issues.map(x => x.level + ': ' + x.text)`);
    log.push('editor issues: ' + JSON.stringify(issues));
    if (issues.some(x => x.startsWith('error'))) throw new Error('clean map shows errors');
    await cdp.eval(`(() => {
      const ed = heui.editor, mine = ed.doc.map.objs.find(o => o.t === 'goldmine');
      ed.sel = { obj: mine };
      ed.renderProps();
      ed.eventFor(mine, 'visit');
      const area = ed.node.querySelector('.he-ed-dlg textarea');
      area.value = 'show renier left\\nrenier: Прииск наш, капитан.\\nchoice\\n- Хорошо\\n- Ещё бы\\nend\\ngive gold 1234';
      area.dispatchEvent(new Event('input'));
      return true;
    })()`);
    await sleep(200);
    await cdp.shot(path.join(out, 'editor-event.png'));
    const events = await cdp.eval(`(() => {
      const ed = heui.editor, done = [...ed.node.querySelectorAll('.he-ed-dlg-foot button')].find(b => b.textContent === 'Готово');
      done.click();
      return { events: ed.doc.events.length, scenes: ed.doc.scenes, dialogs: ed.dialogs.length };
    })()`);
    log.push('editor event: ' + JSON.stringify(events));
    if (events.events !== 1 || events.dialogs || !events.scenes.includes('give gold 1234')) throw new Error('event dialog failed');
    const undo = await cdp.eval(`(() => {
      const ed = heui.editor, H = Heroes98, was = H.MapFile.write(ed.doc);
      ed.stepBack();
      const back = ed.doc.events.length;
      ed.stepForward();
      return { back, same: H.MapFile.write(ed.doc) === was };
    })()`);
    if (undo.back !== 0 || !undo.same) throw new Error('undo failed ' + JSON.stringify(undo));
    await cdp.eval(`(() => {
      const ed = heui.editor;
      ed.askPlayers();
      return true;
    })()`);
    await sleep(200);
    await cdp.shot(path.join(out, 'editor-players.png'));
    await cdp.eval(`(() => {
      const ed = heui.editor;
      ed.dialogs[0]();
      ed.askGoals();
      return true;
    })()`);
    await sleep(200);
    await cdp.shot(path.join(out, 'editor-goals.png'));
    await cdp.eval(`(() => { const ed = heui.editor; ed.dialogs[0](); ed.tab = 'monsters'; ed.setTool({ kind: 'select' }); ed.save(); return true; })()`);
    await cdp.until(`!heui.editor.dirty`, 5000);
    const again = await cdp.eval(`(async () => {
      const ed = heui.editor, H = Heroes98, rows = await H.Save.maps.all(), rec = rows.find(r => r.id === ed.fileId), text = H.MapFile.write(ed.doc);
      return { stored: !!rec, same: rec && rec.text === text, name: rec && rec.name };
    })()`);
    log.push('editor saved: ' + JSON.stringify(again));
    if (!again.same) throw new Error('save and open give another map');
    await cdp.eval(`(() => { heui.editor.play(); return true; })()`);
    await cdp.until(`heui.view && heui.view.S && !heui.editor.visible`, 5000);
    await frames(cdp, 3);
    const walk = await cdp.eval(`(() => {
      const H = Heroes98, v = heui.view, S = v.S, h = v.hero(), mine = S.map.objs.find(o => o.t === 'goldmine'), e = H.MapData.entry(mine), gold = S.players[0].res.gold;
      h.steps = 200;
      const p = H.Adv.path(S, h, e[0], e[1]);
      for (const s of p.steps) v.events(H.Adv.step(S, h, s.c, s.r).ev);
      return { scene: S.scene && S.scene.text, gold };
    })()`);
    log.push('editor play: ' + JSON.stringify(walk));
    if (walk.scene !== 'Прииск наш, капитан.') throw new Error('the event did not open a scene');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'editor-scene.png'), '.he-canvas');
    await cdp.eval(`(() => { const v = heui.view; v.key('Space'); return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'editor-choice.png'), '.he-canvas');
    const after = await cdp.eval(`(() => {
      const v = heui.view, S = v.S;
      v.sceneNext(1);
      return { open: !!S.scene, gold: S.players[0].res.gold };
    })()`);
    if (after.open || after.gold !== walk.gold + 1234) throw new Error('the choice did not go on ' + JSON.stringify(after) + ' from ' + walk.gold);
    await cdp.eval(`(() => { const v = heui.view; v.kingdom = { tab: 'goals' }; return true; })()`);
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'editor-goals-tab.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.kingdom = null; heui.toTitle(); return true; })()`);
    await cdp.until(`heui.editor.visible`, 5000);
    await cdp.eval(`(() => {
      const ed = heui.editor, H = Heroes98;
      ed.setDoc(H.MapFile.clone(H.Maps.docOf(H.Maps.LIST[2])));
      ed.goTo(30, 30);
      return true;
    })()`);
    await sleep(500);
    await cdp.shot(path.join(out, 'editor-chasha.png'));
    const sweep = await cdp.eval(`(async () => {
      const ed = heui.editor, H = Heroes98, MF = H.MapFile, fails = [];
      ed.setDoc(MF.blank({ w: 80, players: 2, name: 'Все объекты' }));
      let c = 1, r = 1;
      for (const t of Object.keys(H.OBJ)) {
        if (t === 'digspot' || t === 'heartstone') continue;
        if (c > 70) { c = 1; r += 4; }
        if (['boat', 'whirlpool', 'barrel'].includes(t)) MF.brush(ed.doc.map, 0, 'water', c + 1, r + 1, 5);
        const extra = t === 'town' ? { faction: 'league', name: 'Город', built: ['hall1'], garrison: [] } : t === 'monster' ? { unit: 'wolves', count: 3, max: 9, mood: 'hostile' } : {};
        ed.placeObject(t, c, r, extra);
        const made = ed.sel && ed.sel.obj;
        if (!made || made.t !== t) fails.push('place ' + t);
        else if (!ed.props.children.length) fails.push('props ' + t);
        c += 5;
      }
      ed.cache.clear();
      ed.draw();
      ed.sel = null;
      for (const hid of [null, H.HEROES[0].id]) {
        ed.placeHero(hid, 2, r + 4 + (hid ? 2 : 0));
        if (!ed.sel || !ed.sel.hero || !ed.props.children.length) fails.push('hero props');
      }
      ed.sel = null;
      ed.draw();
      for (const tab of ['terrain', 'lines', 'objects', 'towns', 'heroes', 'monsters', 'events']) {
        ed.tab = tab;
        ed.renderPalette();
        if (!ed.palette.children.length) fails.push('tab ' + tab);
      }
      for (const ask of ['askNew', 'askProps', 'askPlayers', 'askGoals', 'askScenes']) {
        ed.dirty = false;
        ed[ask]();
        await new Promise(q => setTimeout(q, 20));
        if (!ed.dialogs.length) fails.push('dialog ' + ask);
        while (ed.dialogs.length) ed.dialogs[0]();
      }
      ed.dirty = false;
      ed.askOpen();
      await new Promise(q => setTimeout(q, 300));
      if (!ed.dialogs.length || !ed.node.querySelector('.he-ed-dlg .he-ed-item')) fails.push('open list');
      while (ed.dialogs.length) ed.dialogs[0]();
      const text = MF.write(ed.doc);
      ed.exportFile();
      if (!ed.statusLine.textContent.includes('.h98m')) fails.push('export');
      ed.setDoc(MF.blank({ w: 48 }));
      const box = new DataTransfer();
      box.items.add(new File([text], 'probe.h98m'));
      ed.fileInput.files = box.files;
      ed.importFile();
      await new Promise(q => setTimeout(q, 300));
      if (MF.write(ed.doc) !== text) fails.push('import');
      const bad = new DataTransfer();
      bad.items.add(new File(['not a map'], 'bad.h98m'));
      ed.fileInput.files = bad.files;
      ed.importFile();
      await new Promise(q => setTimeout(q, 300));
      if (!ed.statusLine.textContent.includes('не похож') || MF.write(ed.doc) !== text) fails.push('bad import');
      return { fails, objects: ed.doc.map.objs.length };
    })()`);
    log.push('editor sweep: ' + JSON.stringify(sweep));
    if (sweep.fails.length) throw new Error('editor sweep: ' + sweep.fails.join(', '));
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    const setup = await cdp.eval(`(async () => {
      const H = Heroes98;
      heui.view.press('scenario');
      const v = heui.view;
      await new Promise(r => setTimeout(r, 800));
      const own = v.own.find(m => m.name === 'Малая проба');
      if (!own) return { fail: 'no own map', list: v.own.length };
      v.pick(own);
      return { name: v.rec.name, slots: v.slots.length, file: !!H.Maps.LIST[0].doc };
    })()`);
    log.push('editor setup: ' + JSON.stringify(setup));
    if (setup.fail || setup.slots !== 2 || !setup.file) throw new Error('the own map is not in the scenario list');
    await frames(cdp, 3);
    await cdp.shot(path.join(out, 'editor-setup.png'), '.he-canvas');
    await cdp.eval(`(() => { heui.view.start(); return true; })()`);
    await cdp.until(`heui.view && heui.view.S && heui.view.S.mapName === 'Малая проба'`, 5000);
    await cdp.eval(`(async () => {
      const H = Heroes98;
      for (const r of await H.Save.maps.all()) await H.Save.maps.del(r.id);
      return true;
    })()`);
  },
  async random(cdp, out, log) {
    await cdp.open('/heroes98.html');
    await cdp.until('window.heui && heui.frames > 3');
    await cdp.eval(`(() => { heui.view.press('new'); heui.view.press('random'); return true; })()`);
    await frames(cdp, 3);
    const click = id => cdp.eval(`(() => {
      const v = heui.view, r = v.regions.find(q => q.id === ${JSON.stringify(id)});
      if (!r) throw new Error('no region ' + ${JSON.stringify(id)});
      v.pointer('move', r.x + 3, r.y + 3, 0);
      v.pointer('down', r.x + 3, r.y + 3, 0);
      return { off: !!r.off };
    })()`);
    await cdp.shot(path.join(out, 'random-empty.png'), '.he-canvas');
    const rows = [];
    for (const id of ['duel', 'ring', 'bowl', 'star', 'islands', 'under', 'eight']) {
      await click('tpl-' + id);
      await frames(cdp, 2);
      await cdp.eval(`(() => { heui.view.seed = 777; return true; })()`);
      await click('show');
      await cdp.until(`!heui.view.busy && heui.view.result && !heui.view.stale`, 20000);
      await frames(cdp, 3);
      const r = await cdp.eval(`(() => { const v = heui.view, m = v.result; return { id: v.template, w: v.w, players: v.slots.length, doc: !!m.doc, tries: m.tries, zones: m.meta && m.meta.zones, objects: m.doc && m.doc.map.objs.length }; })()`);
      rows.push(r);
      if (!r.doc) throw new Error('no map for ' + id);
      await cdp.shot(path.join(out, 'random-' + id + '.png'), '.he-canvas');
    }
    log.push('random maps: ' + JSON.stringify(rows));
    const typed = await cdp.eval(`(() => {
      const v = heui.view;
      v.pointer('move', 500, 80, 0);
      v.pointer('down', 500, 80, 0);
      const was = v.typing;
      for (const c of ['Backspace', 'Backspace', 'Backspace', 'Digit1', 'Digit2', 'Digit3']) v.key(c);
      v.key('Enter');
      return { was, seed: v.seed, typing: v.typing, stale: v.stale };
    })()`);
    log.push('random seed typed: ' + JSON.stringify(typed));
    if (!typed.was || typed.seed !== 123 || typed.typing || !typed.stale) throw new Error('the seed cannot be typed');
    await click('tpl-ring');
    await frames(cdp, 2);
    await click('size-80');
    await click('more');
    await click('more');
    await click('water-few');
    await click('mob-strong');
    await click('lv-2');
    await click('fac-1');
    await frames(cdp, 2);
    const set = await cdp.eval(`(() => { const v = heui.view; return { w: v.w, players: v.slots.length, water: v.water, neutrals: v.neutrals, levels: v.levels, faction: v.slots[1].faction }; })()`);
    log.push('random settings: ' + JSON.stringify(set));
    if (set.w !== 80 || set.players < 4 || set.water !== 'few' || set.neutrals !== 'strong' || set.levels !== 2) throw new Error('the settings do not work');
    await click('start');
    await cdp.until(`heui.view && heui.view.S`, 20000);
    await frames(cdp, 4);
    const game = await cdp.eval(`(() => {
      const v = heui.view, S = v.S, H = Heroes98;
      return { name: S.mapName, players: S.players.length, levels: S.map.levels, hero: !!v.hero(), human: S.players.filter(p => p.human).length, town: S.map.objs.filter(o => o.t === 'town' && o.owner === 0).length };
    })()`);
    log.push('random game: ' + JSON.stringify(game));
    if (game.players !== set.players || game.levels !== 2 || !game.hero || game.human !== 1 || game.town !== 1) throw new Error('the game does not match the settings');
    await cdp.shot(path.join(out, 'random-game.png'), '.he-canvas');
    await cdp.eval(`(() => {
      const H = Heroes98, r = H.Rmg.make({ template: 'bowl', w: 80, levels: 1, water: 'many', neutrals: 'normal', seed: 5150, players: [{ faction: 'league' }, { faction: 'barrows' }, { faction: 'league' }, { faction: 'barrows' }] });
      heui.toTitle();
      heui.openEditor();
      heui.editor.setDoc(H.MapFile.clone(r.doc));
      const t = r.doc.map.objs.find(o => o.id === r.doc.players[0].town);
      heui.editor.goTo(t.c, t.r, 0);
      return true;
    })()`);
    await sleep(600);
    await cdp.shot(path.join(out, 'random-editor-bowl.png'));
    await cdp.eval(`(() => {
      const H = Heroes98, r = H.Rmg.make({ template: 'under', w: 48, levels: 2, water: 'none', neutrals: 'normal', seed: 5151, players: [{ faction: 'league' }, { faction: 'barrows' }] }), ed = heui.editor;
      ed.setDoc(H.MapFile.clone(r.doc));
      ed.goTo(24, 24, 1);
      return true;
    })()`);
    await sleep(600);
    await cdp.shot(path.join(out, 'random-editor-under.png'));
  },
  async window(cdp, out, log) {
    await cdp.open('/index.html');
    await cdp.until('window.winManager && window.appHeroes98 && document.querySelector("#desktop")', 60000);
    await sleep(8000);
    const r = await cdp.eval(`(async () => {
      const H = Heroes98, wm = winManager, before = { ...H.live };
      let peak = 0;
      for (let i = 0; i < 10; i++) {
        appHeroes98.open();
        await new Promise(r => setTimeout(r, 120));
        if (!wm.windows.has('app_heroes98') || !appHeroes98.ui) return { fail: 'not opened ' + i };
        if (appHeroes98.ui.audio()) peak = Math.max(peak, H.live.audio);
        wm.closeWindow('app_heroes98');
        await new Promise(r => setTimeout(r, 400));
      }
      appHeroes98.open();
      await new Promise(r => setTimeout(r, 300));
      return { before, after: { ...H.live }, peak, open: wm.windows.has('app_heroes98'), view: appHeroes98.ui.screen };
    })()`);
    log.push('window: ' + JSON.stringify(r));
    if (r.fail) throw new Error(r.fail);
    if (r.view.scale !== 1) throw new Error('window does not show the picture 1:1');
    if (r.after.uis !== r.before.uis + 1 || r.after.loops !== r.before.loops + 1 || r.after.audio !== r.before.audio || r.peak !== r.before.audio + 1) throw new Error('window open/close leaks');
    await cdp.shot(path.join(out, 'window.png'));
    const edit = await cdp.eval(`(async () => {
      const H = Heroes98, wm = winManager, before = { ...H.live };
      appHeroes98.openEditor();
      await new Promise(r => setTimeout(r, 400));
      const ui = appHeroes98.editorUi, open = wm.windows.has('app_heroes98_edit') && !!ui && !!ui.editor && ui.editor.visible;
      const wide = ui.editor.canvas.width, tall = ui.editor.canvas.height;
      return { open, wide, tall, before };
    })()`);
    log.push('window editor: ' + JSON.stringify(edit));
    if (!edit.open || edit.wide < 200 || edit.tall < 100) throw new Error('the editor window did not open');
    await cdp.shot(path.join(out, 'window-editor.png'));
    const shut = await cdp.eval(`(async () => {
      const H = Heroes98, wm = winManager;
      wm.closeWindow('app_heroes98_edit');
      await new Promise(r => setTimeout(r, 500));
      return { after: { ...H.live }, open: wm.windows.has('app_heroes98_edit'), gone: !appHeroes98.editorUi };
    })()`);
    log.push('window editor closed: ' + JSON.stringify(shut));
    if (shut.open || !shut.gone || shut.after.uis !== edit.before.uis || shut.after.loops !== edit.before.loops) throw new Error('the editor window leaks');
  }
};

(async () => {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const out = path.resolve(args.find(a => a.includes('/') || a.includes('\\')) || path.join(os.tmpdir(), 'heroes98-shots'));
  const names = args.filter(a => SCENES[a]);
  fs.mkdirSync(out, { recursive: true });
  const { cdp, close } = await launch();
  const log = [];
  let failed = false;
  try {
    for (const n of names.length ? names : Object.keys(SCENES)) {
      try { await SCENES[n](cdp, out, log); log.push(n + ': ok'); } catch (e) { failed = true; log.push(n + ': FAIL ' + e.message); }
    }
  } finally {
    await close();
  }
  if (cdp.errors.length) { failed = true; log.push('page errors: ' + cdp.errors.join(' | ')); }
  console.log(log.join('\n'));
  console.log('out: ' + out);
  process.exit(failed ? 1 : 0);
})();
