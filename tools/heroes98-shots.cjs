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
