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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aayla98-edge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=1400,1150', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore', windowsHide: true });
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
    try { if ((await fetch(`http://127.0.0.1:${sport}/aayla98.html`)).status === 200) break; } catch (e) { }
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
  const f = await cdp.eval('ayui.frames');
  await cdp.until('ayui.frames > ' + (f + n), 20000);
};

const helpers = cdp => cdp.eval(`(() => {
  window.pause = ms => new Promise(r => setTimeout(r, ms));
  window.typed = () => { const l = ayui.vn.line; return !!l && l.shown >= l.total; };
  window.vnTo = async (pred, max, pick) => {
    for (let i = 0; i < (max || 600); i++) {
      if (pred()) return true;
      const v = ayui.vn;
      if (ayui.flight) flyOut();
      else if (ayui.overlay && ayui.overlay.key) ayui.overlay.key('Enter');
      else if (v.choice) v.pick(pick ? pick(v) : v.choice.index);
      else if (v.active()) v.key('Enter');
      await pause(20);
    }
    return pred();
  };
  window.flyOut = () => {
    const v = ayui.flight;
    if (v.mode === 'intro') v.key('Enter');
    else if (v.mode === 'fly' && !v.f.over) v.f.finish('win');
    else if (v.mode === 'result') v.key('Enter');
  };
  window.placeAt = (x, y, dir) => {
    const f = ayui.field;
    f.p.x = x * 16 + 8;
    f.p.y = y * 16 + 14;
    f.p.dir = dir;
    f.trail = [];
    for (const fl of f.followers) { fl.x = f.p.x; fl.y = f.p.y + 2; }
  };
  window.autoFight = async stopWhen => {
    const v = ayui.battle;
    ayui.keys.add('Enter');
    for (let n = 0; n < 3000 && v.mode !== 'result' && !v.done; n++) {
      if (stopWhen && stopWhen(v)) break;
      if (v.mode === 'intro') v.introT = 0;
      if (v.mode === 'cmd') {
        const h = v.hero(), cmds = v.b.commands(h), can = id => (cmds.find(c => c.id === id) || {}).enabled;
        const front = v.b.inRow('front'), all = v.b.enemies();
        if (can('brace')) v.commit('brace');
        else if (front.length && can('blade')) v.commit('blade', front[0].id);
        else if (front.length && can('fists')) v.commit('fists', front[0].id);
        else if (can('vlightning')) v.commit('vlightning', all[0].id);
        else if (can('leap')) v.commit('leap', all[0].id);
        else if (can('pull')) v.commit('pull', v.b.inRow('back')[0].id);
        else v.commit('guard');
      }
      await pause(40);
    }
    ayui.keys.delete('Enter');
    return v.mode;
  };
  return true;
})()`);

const storyKit = async (cdp, out, log, label, ranks) => {
  const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
  const bot = require('./aayla98-bot.cjs');
  await cdp.open('/aayla98.html?label=' + label);
  await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
  await helpers(cdp);
  await cdp.eval(`(() => {
    const A = Aayla98;
    window.choose = ${bot.choose.toString()};
    window.reply = ${bot.reply.toString()};
    window.fight5 = async (until) => {
      const v = ayui.battle;
      ayui.keys.add('Enter');
      for (let n = 0; n < 6000 && v.mode !== 'result' && !v.done; n++) {
        if (until && until(v)) break;
        if (v.mode === 'intro') v.introT = 0;
        if (v.mode === 'ask') v.answer(reply(v.b));
        else if (v.mode === 'play' && v.cur && v.cur.wait) v.key('Enter');
        else if (v.mode === 'cmd') {
          const c = choose(v.b);
          v.commit(c.skill, c.target, c.extra);
        }
        await pause(30);
      }
      ayui.keys.delete('Enter');
      return v.mode;
    };
    return true;
  })()`);
  const battle = async (name, until) => {
    if (!(await cdp.eval('vnTo(() => !!ayui.battle, 600)'))) throw new Error('no battle before ' + name);
    await sleep(700);
    await shot(name + '.png');
    const r = await cdp.eval(until ? `fight5(${until})` : 'fight5()');
    if (until && r !== 'result') { await sleep(400); await shot(name + '-mid.png'); await cdp.eval('fight5()'); }
    await sleep(300);
    const res = await cdp.eval('ayui.battle && (ayui.battle.b.over + (ayui.battle.b.endReason ? "/" + ayui.battle.b.endReason : ""))');
    log.push(name + ': ' + r + ' ' + res);
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('!ayui.battle', 5000);
  };
  const free = () => cdp.eval('vnTo(() => ayui.field && !ayui.vn.active() && !ayui.overlay, 300)');
  const talk = async (x, y, dir, name, pick, line) => {
    await free();
    await cdp.eval(`placeAt(${x}, ${y}, "${dir}"), ayui.field.interact(), true`);
    if (name) {
      const ready = line ? 'ayui.vn.line && typed()' : '!!ayui.vn.choice';
      if (!(await cdp.eval(`vnTo(() => ${ready}, 300)`))) throw new Error('no scene at ' + name);
      await sleep(200);
      await shot(name + '.png');
    }
    await cdp.eval(`vnTo(() => ayui.field && !ayui.vn.active() && !ayui.overlay, 300${pick === undefined ? '' : ', v => ' + pick})`);
  };
  const enemy = async (id, name, until) => {
    await free();
    await cdp.eval(`(() => { const e = ayui.field.objs.find(o => o.id === "${id}"); placeAt(Math.floor(e.px / 16), Math.floor((e.py - 3) / 16), "right"); return true; })()`);
    await battle(name, until);
  };
  const respite = async (name, want) => {
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen, 400)'))) throw new Error('no respite ' + name);
    await sleep(300);
    await shot(name + '.png');
    const took = [];
    for (let i = 0; i < 6 && await cdp.eval('!!ayui.state.respite'); i++) {
      const key = await cdp.eval(`(() => {
        const s = ayui.overlay;
        if (!(s instanceof Aayla98.RespiteScreen)) return null;
        const all = [];
        s.rooms.forEach((r, i) => s.options(r).forEach((o, k) => { if (o.enabled) all.push({ i, k, key: o.act + ':' + (o.id || '') }); }));
        const c = ${JSON.stringify(want)}.map(w => all.find(x => x.key === w)).find(Boolean) || all[0];
        if (!c) return null;
        s.open(c.i);
        s.choose(c.k);
        return c.key;
      })()`);
      if (!key) break;
      took.push(key);
      if (await cdp.eval('vnTo(() => ayui.vn.line && typed(), 100)')) {
        await sleep(200);
        await shot(name + '-' + key.replace(':', '-') + '.png');
      }
      await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen || ayui.overlay instanceof Aayla98.PalaceScreen || !ayui.state.respite, 300)');
      if (await cdp.eval('ayui.overlay instanceof Aayla98.PalaceScreen')) {
        await cdp.eval('ayui.overlay.finish(), true');
        await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen || !ayui.state.respite, 300)');
      }
    }
    log.push(name + ': ' + took.join(', ') + ' ' + JSON.stringify(await cdp.eval(`({ level: ayui.state.party[0].level, ranks: ${JSON.stringify(ranks)}.map(id => Aayla98.Bonds.rank(ayui.state, id)) })`)));
  };
  return { shot, battle, free, talk, enemy, respite };
};

const SCENES = {
  async boot(cdp, out, log) {
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.frames > 5');
    await frames(cdp, 3);
    log.push('boot: ' + JSON.stringify(await cdp.eval('({ frames: ayui.frames, ticks: ayui.ticks, view: ayui.screen, live: Aayla98.live })')));
    await cdp.shot(path.join(out, 'boot.png'), '.ay-canvas');
    if (!(await cdp.eval('ayui.overlay instanceof Aayla98.TitleScreen'))) throw new Error('the game does not open on the title screen');
    await cdp.eval('ayui.newGame(), true');
    await frames(cdp, 3);
    await cdp.key('Escape', 'Escape', 27);
    await frames(cdp, 2);
    const menu = await cdp.eval('({ open: !!ayui.menu, paused: ayui.paused, items: [...document.querySelectorAll(".ay-btn")].map(b => b.textContent) })');
    log.push('menu: ' + JSON.stringify(menu));
    if (!menu.open || !menu.paused) throw new Error('Esc did not open the paused menu');
    const ticks = await cdp.eval('ayui.ticks');
    await frames(cdp, 10);
    if (await cdp.eval('ayui.ticks') !== ticks) throw new Error('logic runs while the menu is open');
    await cdp.shot(path.join(out, 'menu.png'), '.ay-page-game');
    await cdp.key('Escape', 'Escape', 27);
    await frames(cdp, 2);
    if (await cdp.eval('!!ayui.menu')) throw new Error('Esc did not close the menu');
  },
  async pattern(cdp, out, log) {
    await cdp.open('/aayla98.html?pattern');
    await cdp.until('window.ayui && ayui.frames > 5 && !ayui.vn');
    await cdp.shot(path.join(out, 'pattern.png'), '.ay-canvas');
  },
  async vn(cdp, out, log) {
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await cdp.eval('localStorage.removeItem("aayla98_album"), ayui.vn.read.clear(), ayui.newGame(), true');
    const enter = () => cdp.key('Enter', 'Enter', 13);
    const state = () => cdp.eval('(() => { const v = ayui.vn; return { line: v.line && { who: v.line.who, text: v.line.text, shown: v.line.shown, total: v.line.total }, choice: v.choice && { stage: v.choice.stage, rows: v.rows(), title: v.choiceTitle() }, ended: v.ended, cg: v.story.vn.cg, busts: Object.keys(v.story.vn.busts) }; })()');
    const done = () => cdp.until('!ayui.vn.line || ayui.vn.line.shown >= ayui.vn.line.total', 10000);
    const until = async (test, max) => {
      for (let i = 0; i < (max || 40); i++) {
        const s = await state();
        if (test(s)) return s;
        if (s.line && s.line.shown < s.line.total) await done();
        else await enter();
      }
      throw new Error('scene did not reach the expected state');
    };
    await sleep(400);
    const typing = await state();
    if (!typing.line || typing.line.who !== '-' || typing.line.shown >= typing.line.total) throw new Error('first line is not typed letter by letter');
    await cdp.shot(path.join(out, 'vn-typing.png'), '.ay-canvas');
    await done();
    await cdp.shot(path.join(out, 'vn-narration.png'), '.ay-canvas');
    let s = await until(x => x.line && x.line.who === 'aayla');
    await done();
    await cdp.shot(path.join(out, 'vn-dialogue.png'), '.ay-canvas');
    s = await until(x => x.choice);
    log.push('choice: ' + JSON.stringify(s.choice));
    if (!/читает лекку/.test(s.choice.title) || s.choice.rows.length !== 2) throw new Error('first choice is not a lekku choice with two answers');
    await cdp.key('ArrowDown', 'ArrowDown', 40);
    await cdp.shot(path.join(out, 'vn-choice.png'), '.ay-canvas');
    await enter();
    s = await state();
    log.push('lekku: ' + JSON.stringify(s.choice));
    if (!s.choice || s.choice.stage !== 'lekku' || s.choice.rows.length !== 2) throw new Error('lekku row did not open');
    await cdp.shot(path.join(out, 'vn-lekku.png'), '.ay-canvas');
    await enter();
    await done();
    s = await state();
    log.push('after lie: ' + JSON.stringify(s.line) + ' ' + JSON.stringify(await cdp.eval('ayui.vn.state.flags')));
    if (!s.line || !/лекку/.test(s.line.text) || !(await cdp.eval('ayui.vn.state.flags.lekku_tell'))) throw new Error('calm lie did not show on the lekku');
    await cdp.shot(path.join(out, 'vn-tell.png'), '.ay-canvas');
    s = await until(x => x.cg === 'heart_of_fire' && x.line);
    await done();
    await cdp.shot(path.join(out, 'vn-cg.png'), '.ay-canvas');
    s = await until(x => x.choice);
    await cdp.key('ArrowDown', 'ArrowDown', 40);
    await cdp.key('ArrowDown', 'ArrowDown', 40);
    await cdp.shot(path.join(out, 'vn-choice2.png'), '.ay-canvas');
    await enter();
    s = await until(x => x.line && x.line.who === 'vos');
    await done();
    await cdp.shot(path.join(out, 'vn-three.png'), '.ay-canvas');
    if (s.busts.length !== 3) throw new Error('three busts expected with Vos');
    await cdp.key('Backspace', 'Backspace', 8);
    await sleep(200);
    if (!(await cdp.eval('!!ayui.vn.backlog'))) throw new Error('Backspace did not open the log');
    await cdp.shot(path.join(out, 'vn-log.png'), '.ay-canvas');
    await cdp.key('Backspace', 'Backspace', 8);
    await cdp.key('KeyA', 'KeyA', 65);
    if (!(await cdp.eval('ayui.vn.auto'))) throw new Error('A did not switch auto mode on');
    await cdp.until('!!ayui.field', 90000);
    await sleep(500);
    await cdp.shot(path.join(out, 'vn-to-field.png'), '.ay-canvas');
    log.push('flags: ' + JSON.stringify(await cdp.eval('ayui.vn.state.flags')));
    await cdp.eval('ayui.vn.auto = false, ayui.newGame(), true');
    await sleep(200);
    const read = await cdp.eval('ayui.vn.read.size');
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Control', code: 'ControlLeft', windowsVirtualKeyCode: 17 });
    await cdp.until('ayui.vn.choice', 10000);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Control', code: 'ControlLeft', windowsVirtualKeyCode: 17 });
    log.push('skip to first choice over ' + read + ' read lines');
    await cdp.key('Escape', 'Escape', 27);
    if (!(await cdp.eval('!!ayui.menu'))) throw new Error('Esc did not open the menu during the scene');
    await cdp.key('Escape', 'Escape', 27);
  },
  async sheets(cdp, out, log) {
    await cdp.open('/aayla98.html?pattern');
    await cdp.until('window.ayui && ayui.frames > 2');
    await cdp.eval(`(() => {
      window.sheet = (w, h, bg) => {
        let c = document.getElementById('sheet');
        if (c) c.remove();
        c = document.createElement('canvas');
        c.id = 'sheet';
        c.width = w;
        c.height = h;
        c.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;image-rendering:pixelated';
        document.body.appendChild(c);
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.fillStyle = bg || '#2a2440';
        g.fillRect(0, 0, w, h);
        return g;
      };
      window.label = (g, t, x, y) => Aayla98.Font.draw(g, 'text', t, x, y, '#f4ecd8', '#000');
      return true;
    })()`);
    for (const look of ['aayla_padawan', 'vos_early']) {
      await cdp.eval(`(() => {
        const A = Aayla98, P = A.Pix, g = sheet(1360, 1000, '#5a6a5a');
        label(g, 'Поле 16×24 ×6: ' + '${look}', 10, 6);
        P.DIRS.forEach((d, i) => P.FIELD_FRAMES.forEach((f, j) => {
          g.drawImage(P.field('${look}', d, f).canvas(), 10 + j * 110, 28 + i * 152, 96, 144);
          if (i === 0) label(g, f, 10 + j * 110, 172 - 152 + 152 * 4 + 4 + 0 * i);
        }));
        P.DIRS.forEach((d, i) => label(g, d, 670, 90 + i * 152));
        label(g, 'Бой 48×64 ×4 (клинок дорисован как эффект)', 740, 6);
        P.BATTLE_FRAMES.forEach((f, k) => {
          const x = 740 + (k % 3) * 205, y = 28 + Math.floor(k / 3) * 268;
          const cv = P.battle('${look}', f).canvas();
          g.drawImage(cv, x, y, 192, 256);
          const p = P.POSES[f], s = P.saberLine(p, 26);
          if (!p.down) {
            g.strokeStyle = P.LOOKS['${look}'].blade;
            g.lineWidth = 6;
            g.lineCap = 'round';
            g.beginPath();
            g.moveTo(x + s[0][0] * 4, y + s[0][1] * 4);
            g.lineTo(x + s[1][0] * 4, y + s[1][1] * 4);
            g.stroke();
            g.strokeStyle = '#ffffff';
            g.lineWidth = 2;
            g.stroke();
          }
          label(g, f, x, y + 240);
        });
        return true;
      })()`);
      await cdp.shot(path.join(out, 'sheet-' + look + '.png'), '#sheet');
    }
    await cdp.eval(`(() => {
      const A = Aayla98, g = sheet(1400, 1050);
      const faces = A.CAST.aayla.faces;
      faces.forEach((f, i) => {
        const R = A.Art.bustPixels('aayla', { outfit: 'padawan', face: f, lekku: 'still' }, 0);
        g.drawImage(R.canvas(), 10 + (i % 5) * 280, 10 + Math.floor(i / 5) * 260, 140 * 1.8, 200 * 1.2);
        label(g, A.FACE_NAMES[f], 14 + (i % 5) * 280, 12 + Math.floor(i / 5) * 260);
      });
      Object.keys(A.LEKKU).forEach((l, i) => {
        const R = A.Art.bustPixels('aayla', { outfit: 'padawan', face: 'calm', lekku: l }, 0);
        g.drawImage(R.canvas(), 10 + i * 152, 540, 140, 200);
        label(g, A.LEKKU[l].slice(0, 18), 14 + i * 152, 742);
      });
      Object.keys(A.CAST.aayla.outfits).forEach((o, i) => {
        const R = A.Art.bustPixels('aayla', { outfit: o, face: 'smile', lekku: 'still' }, 0);
        g.drawImage(R.canvas(), 10 + i * 152, 780, 140, 200);
        label(g, A.CAST.aayla.outfits[o].name, 14 + i * 152, 982);
      });
      return true;
    })()`);
    await cdp.shot(path.join(out, 'sheet-busts-aayla.png'), '#sheet');
    await cdp.eval(`(() => {
      const A = Aayla98, g = sheet(1400, 1060), ids = Object.keys(A.CAST);
      ids.forEach((w, i) => {
        const c = A.CAST[w], R = A.Art.bustPixels(w, { outfit: Object.keys(c.outfits)[0], face: 'calm', lekku: 'still' }, 0);
        const x = 6 + (i % 11) * 126, y = 6 + Math.floor(i / 11) * 262;
        g.drawImage(R.canvas(), x, y, 126, 180);
        label(g, c.name.slice(0, 15), x, y + 184);
        label(g, A.KINDS[c.kind].slice(0, 15), x, y + 202);
      });
      return true;
    })()`);
    await cdp.shot(path.join(out, 'sheet-cast.png'), '#sheet');
    await cdp.eval(`(() => {
      const A = Aayla98, g = sheet(1300, 1240), ids = Object.keys(A.Art.LIST.bg);
      ids.forEach((id, i) => {
        const x = 4 + (i % 8) * 162, y = 4 + Math.floor(i / 8) * 150;
        const b = A.Art.LIST.bg[id];
        g.drawImage(A.Art.bgPixels(id, b.times[0]).canvas(), x, y, 160, 120);
        label(g, id, x, y + 122);
      });
      return true;
    })()`);
    await cdp.shot(path.join(out, 'sheet-bg.png'), '#sheet');
    log.push('sheets: ' + JSON.stringify(await cdp.eval('({ cast: Object.keys(Aayla98.CAST).length, bg: Object.keys(Aayla98.Art.LIST.bg).length, cg: Object.keys(Aayla98.Art.LIST.cg).length, still: Object.keys(Aayla98.Art.LIST.still).length })')));
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 2');
    await cdp.eval('ayui.leaveTitle(), ayui.vn.idle(), true');
    const shots = [['ph-cg', "v.story.vn.cg = 'heart_of_fire'"], ['ph-bondcg', "v.story.vn.cg = 'bond_kit'"], ['ph-still', "v.story.vn.still = 'heart13'"], ['ph-bg', "v.story.vn.bg = 'felucia_niango'; v.story.vn.time = 'day'; v.story.vn.busts = { aayla: { slot: 'left', outfit: 'robe', face: 'resolute', lekku: 'tense' }, bly: { slot: 'center', outfit: 'phase2', face: 'calm', lekku: 'still' }, ekria: { slot: 'right', outfit: 'padawan', face: 'smile', lekku: 'still' } }"]];
    for (const [name, code] of shots) {
      await cdp.eval(`(() => { const v = ayui.vn; v.story.vn.cg = null; v.story.vn.still = null; ${code}; v.line = null; v.choice = null; return true; })()`);
      await sleep(400);
      await cdp.shot(path.join(out, name + '.png'), '.ay-canvas');
    }
  },
  async field(cdp, out, log) {
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await cdp.eval('localStorage.removeItem("aayla98_album"), ayui.vn.read.clear(), ayui.newGame(), true');
    for (let i = 0; i < 80 && !(await cdp.eval('!!ayui.field')); i++) {
      const s = await cdp.eval('({ choice: !!ayui.vn.choice, typing: !!(ayui.vn.line && ayui.vn.line.shown < ayui.vn.line.total) })');
      await cdp.key('Enter', 'Enter', 13);
      if (s.choice && (await cdp.eval('ayui.vn.choice && ayui.vn.choice.stage === "lekku"'))) await cdp.key('Enter', 'Enter', 13);
    }
    if (!(await cdp.eval('!!ayui.field && ayui.field.map.id === "lessu_market"'))) throw new Error('the garden scene did not hand over to the market');
    await cdp.eval(`(() => {
      const TS = 16;
      window.walk = (tx, ty) => new Promise((done, fail) => {
        const f = ayui.field, keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        const route = f.path(f.playerTile(), [tx, ty]);
        if (!route) return fail(new Error('no path to ' + tx + ',' + ty));
        let i = 1, n = 0;
        const tick = () => {
          keys.forEach(k => ayui.keys.delete(k));
          if (ayui.battle) ayui.battle.end({ over: 'win' });
          if (ayui.vn.active()) { ayui.vn.key('Enter'); return requestAnimationFrame(tick); }
          if (i >= route.length) return done(true);
          const gx = route[i][0] * TS + 8, gy = route[i][1] * TS + 14, dx = gx - f.p.x, dy = gy - f.p.y;
          if (Math.hypot(dx, dy) < 2) { i++; return requestAnimationFrame(tick); }
          if (dx > 1) ayui.keys.add('ArrowRight');
          if (dx < -1) ayui.keys.add('ArrowLeft');
          if (dy > 1) ayui.keys.add('ArrowDown');
          if (dy < -1) ayui.keys.add('ArrowUp');
          if (++n > 3000) return fail(new Error('walk timeout'));
          requestAnimationFrame(tick);
        };
        tick();
      });
      window.faceTo = dir => { const f = ayui.field; f.p.dir = dir; return true; };
      const v = ayui.view, orig = v.sprite.bind(v);
      v.sprite = (l, d, fr) => { if (!Aayla98.Pix.LOOKS[l] && !Aayla98.Pix.FIELD_BEASTS[l]) window.__bad = [l, d, fr, new Error().stack.split(String.fromCharCode(10)).slice(1, 4).join(' | ')]; return orig(l, d, fr); };
      return true;
    })()`);
    await sleep(400);
    await cdp.shot(path.join(out, 'field-market.png'), '.ay-canvas');
    await cdp.eval('walk(17, 9)');
    await cdp.eval('faceTo("up")');
    await sleep(200);
    await cdp.shot(path.join(out, 'field-prompt.png'), '.ay-canvas');
    await cdp.key('Enter', 'Enter', 13);
    await sleep(900);
    await cdp.shot(path.join(out, 'field-talk.png'), '.ay-canvas');
    await cdp.eval('(async () => { while (ayui.vn.active()) { ayui.vn.key("Enter"); await new Promise(r => setTimeout(r, 120)); } return true; })()');
    await cdp.eval('walk(29, 17)');
    await cdp.key('q', 'KeyQ', 81);
    await sleep(250);
    await cdp.shot(path.join(out, 'field-sense.png'), '.ay-canvas');
    await cdp.eval('walk(33, 12)');
    await cdp.eval('faceTo("up")');
    await sleep(150);
    await cdp.shot(path.join(out, 'field-force.png'), '.ay-canvas');
    await cdp.key('x', 'KeyX', 88);
    await sleep(500);
    await cdp.shot(path.join(out, 'field-pulled.png'), '.ay-canvas');
    const crate = await cdp.eval('ayui.field.objs.filter(o => o.type === "crate").map(o => [o.x, o.y])');
    log.push('crates after pull: ' + JSON.stringify(crate));
    if (crate.some(c => c[0] === 33 && c[1] === 8)) throw new Error('the crate in front of the hatch did not move');
    await cdp.eval('walk(33, 5)');
    await cdp.eval('faceTo("up")');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('ayui.field.map.id === "ryll_tunnels"', 5000);
    await sleep(300);
    await cdp.shot(path.join(out, 'field-tunnels.png'), '.ay-canvas');
    await cdp.eval('walk(12, 17)');
    await cdp.eval('(async () => { await new Promise(r => setTimeout(r, 6500)); if (ayui.battle) ayui.battle.end({ over: "win" }); return true; })()');
    await cdp.eval(`(() => { const f = ayui.field; f.p.x = 12 * 16 + 8; f.p.y = 18 * 16 + 14; f.p.dir = 'down'; f.senseCool = 0; return true; })()`);
    await cdp.key('q', 'KeyQ', 81);
    await sleep(300);
    await cdp.shot(path.join(out, 'field-cones.png'), '.ay-canvas');
    await cdp.eval(`(() => { const f = ayui.field; f.p.x = 15 * 16 + 8; f.p.y = 7 * 16 + 14; f.p.dir = 'down'; return true; })()`);
    await cdp.until('ayui.battle || ayui.field.objs.some(o => o.mode === "alert" || o.mode === "chase")', 8000);
    await sleep(150);
    await cdp.shot(path.join(out, 'field-alert.png'), '.ay-canvas');
    await cdp.until('!!ayui.battle', 8000);
    await sleep(100);
    await cdp.shot(path.join(out, 'field-battle-start.png'), '.ay-canvas');
    log.push('encounter: ' + JSON.stringify(await cdp.eval('ayui.battle.enc')));
    await cdp.eval(`(() => {
      const pads = { connected: true, buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })), axes: [0, 0] };
      window.__pad = pads;
      navigator.getGamepads = () => [pads];
      return true;
    })()`);
    await cdp.eval('__pad.buttons[0].pressed = true, true');
    await sleep(120);
    await cdp.eval('__pad.buttons[0].pressed = false, true');
    await sleep(120);
    if (await cdp.eval('ayui.battle && ayui.battle.mode === "intro"')) throw new Error('gamepad A did not skip the battle intro');
    await cdp.eval('ayui.battle && ayui.battle.end({ over: "win" }), true');
    log.push('device after gamepad: ' + (await cdp.eval('ayui.device')));
    await cdp.eval('walk(23, 21)');
    await cdp.eval('faceTo("right")');
    await cdp.eval('__pad.buttons[5].pressed = true, true');
    await sleep(120);
    await cdp.eval('__pad.buttons[5].pressed = false, true');
    await sleep(300);
    if (!(await cdp.eval('ayui.field.bridgeDown()'))) throw new Error('gamepad RB did not pull the bridge');
    await cdp.eval('walk(25, 21)');
    await cdp.shot(path.join(out, 'field-bridge.png'), '.ay-canvas');
    await cdp.eval('navigator.getGamepads = () => [], ayui.device = "kb", true');
    await cdp.eval('walk(23, 25)');
    await cdp.eval('(async () => { for (let i = 0; i < 62; i++) { if (ayui.battle) ayui.battle.end({ over: "win" }); await new Promise(r => setTimeout(r, 100)); } return true; })()');
    await cdp.eval(`(() => { const f = ayui.field; if (ayui.battle) ayui.battle.end({ over: 'win' }); f.p.x = 23 * 16 + 8; f.p.y = 25 * 16 + 14; f.senseCool = 0; for (const e of f.objs) if (e.type === 'enemy') f.resolve(e.id, 'won'); return true; })()`);
    await cdp.key('q', 'KeyQ', 81);
    await cdp.eval('faceTo("right")');
    await sleep(200);
    await cdp.shot(path.join(out, 'field-jump-mark.png'), '.ay-canvas');
    await cdp.key('Enter', 'Enter', 13);
    await sleep(260);
    await cdp.shot(path.join(out, 'field-jump.png'), '.ay-canvas');
    await sleep(600);
    if (!(await cdp.eval('Math.floor(ayui.field.p.x / 16) === 28'))) throw new Error('the jump did not land on the ledge');
    await cdp.eval(`(() => { const f = ayui.field; f.p.x = 43 * 16 + 8; f.p.y = 20 * 16 + 14; f.p.dir = 'right'; f.trail = []; return true; })()`);
    await sleep(200);
    await cdp.key('Enter', 'Enter', 13);
    await sleep(300);
    if (!(await cdp.eval('ayui.vn.active() && ayui.vn.story.pc.label === "pro_warehouse"'))) throw new Error('the warehouse door did not open the warehouse scene');
    await cdp.eval('(async () => { while (ayui.vn.active()) { ayui.vn.key("Enter"); await new Promise(r => setTimeout(r, 60)); } return true; })()');
    await sleep(400);
    if (!(await cdp.eval('ayui.field && ayui.field.map.id === "ryll_mine"'))) throw new Error('the warehouse and the reception did not lead to the mine');
    await cdp.shot(path.join(out, 'field-mine.png'), '.ay-canvas');
    log.push('bad sprite: ' + JSON.stringify(await cdp.eval('window.__bad || null')));
    log.push('state: ' + JSON.stringify(await cdp.eval('({ items: ayui.state.items, beat: ayui.state.field.maps.ryll_tunnels.beat, dark: ayui.state.dark })')));
  },
  async battle(cdp, out, log) {
    const enter = () => cdp.key('Enter', 'Enter', 13);
    const esc = () => cdp.key('Escape', 'Escape', 27);
    const down = () => cdp.key('ArrowDown', 'ArrowDown', 40);
    const up = () => cdp.key('ArrowUp', 'ArrowUp', 38);
    const st = () => cdp.eval('(() => { const v = ayui.battle; if (!v) return null; const h = v.hero(); return { mode: v.mode, cat: v.sel.cat, cmd: v.sel.cmd, cats: v.cats().map(c => c.id), cmds: v.cmdList().map(c => c.id), hero: h && h.id, over: v.b.over, tgt: v.tgts && v.tgts[v.sel.tgt] }; })()');
    const menu = () => cdp.until('ayui.battle && (ayui.battle.mode === "cmd" || ayui.battle.mode === "result")', 30000);
    const pick = async (cat, cmd) => {
      let s = await st();
      const ci = s.cats.indexOf(cat);
      if (ci < 0) throw new Error(`no category ${cat} for ${s.hero}: ${s.cats}`);
      while (s.cat !== ci) { await (s.cat < ci ? down() : up()); s = await st(); }
      await enter();
      if (!cmd) return;
      s = await st();
      const k = s.cmds.indexOf(cmd);
      if (k < 0) throw new Error(`no command ${cmd}: ${s.cmds}`);
      while (s.cmd !== k) { await (s.cmd < k ? down() : up()); s = await st(); }
      await enter();
    };
    const aim = id => cdp.eval(`(() => { const v = ayui.battle, i = v.tgts.indexOf(${JSON.stringify(id)}); if (i < 0) return false; v.sel.tgt = i; return true; })()`);
    const click = async (x, y) => {
      const r = await cdp.eval('(() => { const b = document.querySelector(".ay-canvas").getBoundingClientRect(); return { x: b.left, y: b.top, k: b.width / 640 }; })()');
      const p = { x: r.x + x * r.k, y: r.y + y * r.k, button: 'left', clickCount: 1 };
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...p });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...p });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...p });
      await sleep(150);
    };
    const auto = () => cdp.eval(`(async () => {
      const v = ayui.battle;
      ayui.keys.add('Enter');
      for (let n = 0; n < 2400 && v.mode !== 'result' && !v.done; n++) {
        if (v.mode === 'cmd') {
          const h = v.hero(), cmds = v.b.commands(h), can = id => (cmds.find(c => c.id === id) || {}).enabled;
          const front = v.b.inRow('front'), all = v.b.enemies();
          if (front.length && can('blade')) v.commit('blade', front[0].id);
          else if (can('vlightning')) v.commit('vlightning', all[0].id);
          else if (can('leap')) v.commit('leap', all[0].id);
          else if (can('pull')) v.commit('pull', v.b.inRow('back')[0].id);
          else v.commit('guard');
        }
        await new Promise(r => setTimeout(r, 50));
      }
      ayui.keys.delete('Enter');
      return v.mode;
    })()`);
    const shotsAt = async (name, ms) => { await sleep(ms); await cdp.shot(path.join(out, name), '.ay-canvas'); };

    await cdp.open('/aayla98.html?battle=smugglers_c');
    await cdp.until('window.ayui && ayui.battle && ayui.frames > 5');
    await cdp.shot(path.join(out, 'battle-intro.png'), '.ay-canvas');
    await enter();
    await menu();
    await sleep(200);
    log.push('first turn: ' + JSON.stringify(await st()));
    await cdp.shot(path.join(out, 'battle-menu.png'), '.ay-canvas');
    await pick('stance');
    await sleep(150);
    await cdp.shot(path.join(out, 'battle-deflect.png'), '.ay-canvas');
    log.push('stance: ' + JSON.stringify(await st()));
    await cdp.eval(`(() => {
      const pads = { connected: true, buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })), axes: [0, 0] };
      window.__pad = pads;
      navigator.getGamepads = () => [pads];
      return true;
    })()`);
    await cdp.eval('__pad.buttons[1].pressed = true, true');
    await sleep(120);
    await cdp.eval('__pad.buttons[1].pressed = false, true');
    await sleep(120);
    await cdp.eval('navigator.getGamepads = () => [], ayui.device = "kb", true');
    if ((await st()).mode !== 'cmd') throw new Error('gamepad B did not go back to the command list');
    await pick('force', 'push');
    const back = await cdp.eval('ayui.battle.b.inRow("back").map(e => e.id)');
    if (!(await aim(back[0]))) throw new Error('the back row is not a Push target');
    await sleep(200);
    await cdp.shot(path.join(out, 'battle-push-target.png'), '.ay-canvas');
    await enter();
    await shotsAt('battle-push.png', 380);
    await menu();
    const fell = await cdp.eval(`ayui.battle.b.unit(${JSON.stringify(back[0])}).gone`);
    log.push('pushed: ' + fell);
    if (fell !== 'fell') throw new Error('the Push did not throw the smuggler into the chasm');
    let s = await st();
    if (s.hero === 'vos') {
      await pick('own');
      await sleep(150);
      await enter();
      await sleep(150);
      await enter();
      await shotsAt('battle-read.png', 500);
      await menu();
      s = await st();
    }
    for (let i = 0; i < 4 && s.mode === 'cmd' && s.hero !== 'aayla'; i++) {
      await cdp.eval('ayui.battle.commit("guard"), true');
      await menu();
      s = await st();
    }
    if (s.hero === 'aayla') {
      await pick('talk');
      const tg = await cdp.eval('ayui.battle.tgts');
      if (!tg.length) throw new Error('nobody to talk to');
      await enter();
      await sleep(200);
      await cdp.shot(path.join(out, 'battle-talk.png'), '.ay-canvas');
      const list = await cdp.eval('ayui.battle.b.approaches(ayui.battle.b.unit(ayui.battle.talkTarget)).map(a => a.id)');
      const k = list.indexOf('mind');
      for (let i = await cdp.eval('ayui.battle.sel.talk'); i < k; i++) await down();
      await enter();
      await cdp.until('!!ayui.battle.talkShow', 10000);
      await sleep(200);
      await cdp.shot(path.join(out, 'battle-talk-reply.png'), '.ay-canvas');
      log.push('talk: ' + JSON.stringify(await cdp.eval('(() => { const e = ayui.battle.talkShow; return { approach: e.approach, outcome: e.outcome }; })()')));
      await enter();
    }
    await menu();
    s = await st();
    if (s.mode === 'cmd') {
      const ci = await cdp.eval('ayui.battle.cats().findIndex(c => c.enabled && c.cmds.length > 1)');
      await sleep(100);
      await click(60, 378 + ci * 16);
      await sleep(100);
      const m = await st();
      log.push('mouse: ' + JSON.stringify(m));
      if (m.mode !== 'skill' && m.mode !== 'target') throw new Error('mouse click on the first category did not open it');
      await esc();
      if ((await st()).mode !== 'cmd') await esc();
    }
    const end1 = await auto();
    await sleep(300);
    await cdp.shot(path.join(out, 'battle-victory.png'), '.ay-canvas');
    log.push('end: ' + end1 + ' ' + JSON.stringify(await cdp.eval('ayui.battle.res')));
    if (end1 !== 'result' || (await cdp.eval('ayui.battle.b.over')) !== 'win') throw new Error('the trial fight was not won');
    await enter();
    await cdp.until('ayui.battle && ayui.battle.mode === "intro"', 10000);

    await cdp.open('/aayla98.html?battle=spider_boss');
    await cdp.until('window.ayui && ayui.battle && ayui.frames > 5');
    await enter();
    await menu();
    await sleep(150);
    await cdp.shot(path.join(out, 'battle-boss.png'), '.ay-canvas');
    s = await st();
    if (s.hero !== 'aayla') throw new Error('Aayla does not open the boss fight');
    await pick('force', 'brace');
    await shotsAt('battle-collapse.png', 450);
    await menu();
    log.push('brace: ' + JSON.stringify(await cdp.eval('({ up: ayui.battle.b.braceUp, boss: ayui.battle.b.enemies().filter(e => e.boss).map(e => e.hp + "/" + e.maxhp) })')));
    const end2 = await auto();
    await sleep(300);
    await cdp.shot(path.join(out, 'battle-boss-end.png'), '.ay-canvas');
    log.push('boss end: ' + end2 + ' ' + (await cdp.eval('ayui.battle.b.over')));

    await cdp.open('/aayla98.html?battle=smugglers_d');
    await cdp.until('window.ayui && ayui.battle && ayui.frames > 5');
    await cdp.eval('ayui.state.difficulty = "story", ayui.defeats = 1, ayui.battle.defeats = 1, true');
    await cdp.eval('(() => { const v = ayui.battle; for (const u of v.b.units) if (u.side === "party") { u.hp = 1; v.vis.get(u.id).hp = 1; } return true; })()');
    await enter();
    await cdp.eval(`(async () => {
      const v = ayui.battle;
      for (let n = 0; n < 200 && v.mode !== 'result'; n++) {
        if (v.mode === 'cmd') v.commit('guard');
        await new Promise(r => setTimeout(r, 50));
      }
      return v.mode;
    })()`);
    await sleep(300);
    await cdp.shot(path.join(out, 'battle-defeat.png'), '.ay-canvas');
    const opts = await cdp.eval('ayui.battle.resultOptions().map(o => o.label)');
    log.push('defeat options: ' + JSON.stringify(opts));
    if (opts.length !== 2) throw new Error('two defeats on Story did not offer the Help of the Force');
    await down();
    await enter();
    await cdp.until('ayui.battle && ayui.battle.mode === "intro"', 10000);
    const helped = await cdp.eval('(() => { const b = ayui.battle.b, a = b.unit("aayla"); return { help: b.help, maxhp: a.maxhp, plain: Aayla98.stats("aayla", a.level).hp }; })()');
    log.push('help: ' + JSON.stringify(helped));
    if (!helped.help || helped.maxhp !== Math.round(helped.plain * 1.25)) throw new Error('the Help of the Force did not raise health');
  },
  async prologue(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await cdp.eval('localStorage.removeItem("aayla98_album"), ayui.vn.read.clear(), ayui.newGame(), true');
    await helpers(cdp);
    if (!(await cdp.eval('vnTo(() => ayui.vn.story.pc.label === "pro_lessu" && ayui.vn.line && ayui.vn.line.who === "vos")'))) throw new Error('the garden did not lead to the arrival on Ryloth');
    await cdp.until('typed()');
    await shot('prologue-arrival.png');
    if (!(await cdp.eval('vnTo(() => !!ayui.field && !ayui.vn.active())'))) throw new Error('the arrival did not open the market');
    log.push('music in the market: ' + (await cdp.eval('ayui.musicWanted()')));
    await cdp.eval('ayui.enterField("ryll_tunnels", "hatch"), placeAt(43, 20, "right"), true');
    await sleep(200);
    await cdp.key('Enter', 'Enter', 13);
    if (!(await cdp.eval('vnTo(() => ayui.vn.story.pc.label === "pro_warehouse" && typed() && ayui.vn.line.who === "vos", 80)'))) throw new Error('the warehouse door did not open the warehouse scene');
    await shot('prologue-warehouse.png');
    if (!(await cdp.eval('(async () => { for (let i = 0; i < 400; i++) { const v = ayui.vn; if (v.choice && v.story.pc.label === "pro_pol") return true; if (v.active() && !v.choice) v.key("Enter"); await pause(20); } return false; })()'))) throw new Error('no choice of tone at Pol');
    await sleep(200);
    await shot('prologue-pol.png');
    await cdp.eval('ayui.vn.pick(0), true');
    await sleep(150);
    await cdp.eval('ayui.vn.pick(1), true');
    await cdp.until('typed()');
    await sleep(100);
    await shot('prologue-pol-lekku.png');
    log.push('Pol: ' + JSON.stringify(await cdp.eval('({ tone: ayui.state.flags.pol_tone, read: ayui.state.flags.lekku_read, bond: ayui.state.bonds.secura, line: ayui.vn.line.text })')));
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "ryll_mine" && !ayui.vn.active())'))) throw new Error('the reception did not lead to the mine');
    await sleep(700);
    await shot('prologue-mine.png');
    await cdp.eval('placeAt(20, 12, "right"), true');
    await sleep(300);
    await shot('prologue-cocoons.png');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('typed()', 5000);
    await shot('prologue-worker.png');
    await cdp.eval('vnTo(() => !ayui.vn.active())');
    await cdp.eval('placeAt(36, 18, "right"), ayui.keys.add("ArrowRight"), true');
    await cdp.until('ayui.vn.active()', 8000);
    await cdp.eval('ayui.keys.delete("ArrowRight"), true');
    await cdp.eval('vnTo(() => ayui.vn.story.pc.label === "pro_asante" && typed() && ayui.vn.line.who === "aayla")');
    await shot('prologue-asante.png');
    await cdp.eval('vnTo(() => !ayui.vn.active() && ayui.field.followers.length === 2)');
    await cdp.eval('placeAt(40, 16, "down"), ayui.keys.add("ArrowDown"), true');
    await sleep(900);
    await cdp.eval('ayui.keys.delete("ArrowDown"), true');
    await sleep(200);
    await shot('prologue-party.png');
    log.push('followers: ' + (await cdp.eval('ayui.field.followers.map(f => f.look).join()')));
    await cdp.eval('placeAt(34, 29, "right"), true');
    await sleep(200);
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.text.includes("паук размером") && typed(), 200)');
    await shot('prologue-lair.png');
    if (!(await cdp.eval('vnTo(() => !!ayui.battle, 200)'))) throw new Error('the lair did not start the boss fight');
    await sleep(600);
    await shot('prologue-boss.png');
    const fight = await cdp.eval('autoFight()');
    log.push('boss: ' + fight + ' ' + (await cdp.eval('ayui.battle && ayui.battle.b.over')));
    if (fight !== 'result' || (await cdp.eval('ayui.battle.b.over')) !== 'win') throw new Error('the boss fight was not won');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('!ayui.battle', 5000);
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "glitteryll" && ayui.vn.line && ayui.vn.line.who === "pol" && ayui.vn.line.text.includes("понемногу") && typed(), 200)');
    await shot('prologue-glitteryll.png');
    log.push('music at the end: ' + (await cdp.eval('ayui.musicWanted()')));
    if (!(await cdp.eval('vnTo(() => !!ayui.overlay, 100)'))) throw new Error('the prologue did not show the forgetting');
    await sleep(4200);
    await shot('prologue-forget.png');
    await cdp.until('ayui.overlay.t > ayui.overlay.titleAt + 1.7', 20000);
    await shot('prologue-title.png');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('ayui.overlay instanceof Aayla98.ChapterCard', 5000);
    await sleep(900);
    await shot('prologue-chapter.png');
    await cdp.until('!ayui.overlay && ayui.vn.line && ayui.state.chapter === "ch1"', 8000);
    log.push('chapter 1 opens with: ' + (await cdp.eval('ayui.vn.line.text')) + ' / auto save: ' + (await cdp.eval('!!localStorage.getItem("aayla98_auto")')));
    const fin = await cdp.eval('({ party: ayui.state.party.map(m => m.id + ":" + m.level + ":" + (m.skills || []).length), forgot: ayui.state.flags.forgot, asante: ayui.state.flags.asante_joined, tone: ayui.state.flags.pol_tone })');
    log.push('end: ' + JSON.stringify(fin));
    if (fin.party.join() !== 'aayla:1:0' || !fin.forgot) throw new Error('the prologue did not reset Aayla');
  },
  async ch1(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html?label=ch1_start');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await helpers(cdp);
    await cdp.until('ayui.overlay instanceof Aayla98.ChapterCard', 5000);
    await sleep(1200);
    await shot('ch1-card.png');
    await cdp.until('!ayui.overlay && typed()', 8000);
    await shot('ch1-wake.png');
    if (!(await cdp.eval('vnTo(() => !!ayui.vn.choice, 200)'))) throw new Error('no dose in the first morning');
    await sleep(200);
    await shot('ch1-dose.png');
    await cdp.eval('ayui.vn.pick(1), true');
    await sleep(150);
    await shot('ch1-dose-lekku.png');
    await cdp.eval('ayui.vn.pick(0), true');
    if (!(await cdp.eval('vnTo(() => !!ayui.field && !ayui.vn.active(), 200)'))) throw new Error('the morning did not open the estate');
    await sleep(700);
    await shot('ch1-estate.png');
    log.push('after the first dose: ' + JSON.stringify(await cdp.eval('({ poured: ayui.state.flags.poured, suspicion: ayui.state.flags.suspicion, map: ayui.field.map.id, can: ["sense", "push", "sneak"].map(a => ayui.field.can(a)) })')));
    await cdp.eval('placeAt(19, 5, "up"), true');
    await sleep(200);
    await shot('ch1-misra.png');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('ayui.vn.active() && typed()', 5000);
    await shot('ch1-rehearse.png');
    await cdp.eval('vnTo(() => !ayui.vn.active())');
    await cdp.eval('Object.assign(ayui.state.flags, { day: 2, poured: 1, dose_today: "poured" }), ayui.vn.runLabel("ch1_night"), true');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.still === "wampa" && typed(), 100)');
    await shot('ch1-memory.png');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "mem" && typed(), 100)');
    await shot('ch1-recall.png');
    log.push('recalled: ' + JSON.stringify(await cdp.eval('ayui.state.memory')) + ' ' + (await cdp.eval('ayui.vn.line.text')));
    await cdp.eval('Object.assign(ayui.state.flags, { day: 5, dose_today: "drunk" }), ayui.vn.runLabel("ch1_night"), true');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "your_saber" && ayui.vn.choice, 200)');
    await sleep(200);
    await shot('ch1-saber.png');
    await cdp.eval('vnTo(() => ayui.vn.choice && ayui.vn.story.pc.label === "ch1_balcony_night", 200)');
    await sleep(200);
    await shot('ch1-feeling.png');
    await cdp.eval('ayui.vn.pick(1), true');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "balcony" && typed(), 100)');
    await shot('ch1-balcony.png');
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.state.flags.escape && !ayui.vn.active(), 200)'))) throw new Error('the balcony did not start the escape');
    await sleep(600);
    await shot('ch1-escape.png');
    log.push('escape: ' + JSON.stringify(await cdp.eval('({ saber: ayui.state.flags.saber, feeling: ayui.state.flags.feeling, guards: ayui.field.objs.filter(o => o.type === "enemy").length, music: ayui.musicWanted() })')));
    await cdp.eval('placeAt(3, 19, "down"), true');
    await sleep(100);
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('ayui.vn.choice', 8000).catch(() => cdp.eval('vnTo(() => !!ayui.vn.choice, 100)'));
    await sleep(200);
    await shot('ch1-warn.png');
    await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "rock_gardens" && !ayui.vn.active(), 200)');
    await cdp.eval('placeAt(14, 12, "right"), true');
    await sleep(1500);
    await shot('ch1-gardens.png');
    await cdp.eval('ayui.enterField("lylek_caves", "start"), placeAt(6, 8, "down"), ayui.keys.add("ArrowDown"), true');
    await cdp.until('ayui.vn.active()', 8000);
    await cdp.eval('ayui.keys.delete("ArrowDown"), true');
    await cdp.eval('vnTo(() => !!ayui.battle, 100)');
    await sleep(800);
    await shot('ch1-lylek.png');
    await cdp.eval('autoFight(v => v.banner && /Инстинкт/.test(v.banner.text))');
    await sleep(250);
    await shot('ch1-instinct.png');
    const fight = await cdp.eval('autoFight()');
    log.push('first lylek: ' + fight + ' ' + (await cdp.eval('ayui.battle.b.over')) + ' instinct ' + (await cdp.eval('ayui.battle.b.instinctUsed')));
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('!ayui.battle', 5000);
    await cdp.eval('vnTo(() => !ayui.vn.active(), 100)');
    await sleep(500);
    await shot('ch1-caves.png');
    await cdp.eval('ayui.enterField("port_road", "start"), placeAt(29, 10, "right"), ayui.field.storm = { phase: "blow", t: 30, heat: 1 }, true');
    await sleep(900);
    await shot('ch1-storm.png');
    await cdp.eval('placeAt(52, 7, "up"), ayui.field.storm = { phase: "calm", t: 30, heat: 0 }, true');
    await sleep(100);
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "pod" && typed(), 200)');
    await shot('ch1-pod.png');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.ChapterCard && ayui.state.chapter === "ch2", 100)'))) throw new Error('chapter 1 did not open chapter 2');
    await sleep(900);
    await shot('ch1-to-ch2.png');
    log.push('end of chapter 1 opens chapter 2, auto save: ' + (await cdp.eval('JSON.parse(localStorage.getItem("aayla98_auto")).S.chapter')));
  },
  async ch2(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html?label=ch2_start');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await helpers(cdp);
    await cdp.eval(`window.duelFight = async () => {
      const v = ayui.battle;
      ayui.keys.add('Enter');
      for (let n = 0; n < 3000 && v.mode !== 'result' && !v.done; n++) {
        if (v.mode === 'intro') v.introT = 0;
        if (v.mode === 'cmd') {
          const h = v.hero(), cmds = v.b.commands(h), can = id => (cmds.find(c => c.id === id) || {}).enabled;
          const k = v.b.units.find(e => e.key === 'karkko');
          if (can('lower')) v.commit('lower');
          else if (v.b.groupId === 'duel_sanctum') v.commit('guard');
          else if (k && k.hidden && can('read')) v.commit('read', v.b.targets(h, 'read')[0]);
          else if (k && !k.hidden && can('vlightning')) v.commit('vlightning', k.id);
          else if (k && !k.hidden && can('blade')) v.commit('blade', k.id);
          else if (h.retinue && can('hunger')) v.commit('hunger', v.b.enemies().filter(e => !e.hidden)[0].id);
          else if (v.b.inRow('front').length && can('blade')) v.commit('blade', v.b.inRow('front')[0].id);
          else v.commit('guard');
        }
        await pause(40);
      }
      ayui.keys.delete('Enter');
      return v.mode;
    }, true`);
    await cdp.until('ayui.overlay instanceof Aayla98.ChapterCard', 5000);
    await sleep(1200);
    await shot('ch2-card.png');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "voice" && typed(), 200)');
    await shot('ch2-voice.png');
    if (!(await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active(), 200)'))) throw new Error('the crash did not lead to the temple');
    await sleep(600);
    await shot('ch2-temple.png');
    log.push('start of chapter 2: ' + JSON.stringify(await cdp.eval('({ dark: ayui.state.dark, chapter: ayui.state.chapter, look: Aayla98.Party.look(ayui.state, "aayla") })')));
    await cdp.eval('placeAt(20, 25, "up"), true');
    await sleep(100);
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('ayui.vn.active() && typed()', 5000);
    await shot('ch2-doors.png');
    await cdp.eval('vnTo(() => !ayui.vn.active())');
    await cdp.eval('ayui.vn.runLabel("ch2_release"), true');
    await cdp.eval('vnTo(() => !!ayui.vn.choice, 100)');
    await sleep(200);
    await shot('ch2-release-choice.png');
    await cdp.eval('ayui.vn.pick(1), true');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "release" && typed(), 100)');
    await shot('ch2-release.png');
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "kiffex_post" && !ayui.vn.active(), 200)'))) throw new Error('the release did not send Aayla to the post');
    await sleep(600);
    await shot('ch2-post.png');
    log.push('post: ' + JSON.stringify(await cdp.eval('({ party: ayui.state.party.map(m => m.id + ":" + m.level), followers: ayui.field.followers.map(f => f.key), guards: ayui.field.enemiesLeft() })')));
    await cdp.eval('ayui.startBattle({ group: "post_a", advantage: "none", obj: null }), true');
    await cdp.until('ayui.battle && ayui.battle.mode === "cmd"', 10000).catch(() => {});
    await cdp.eval('(() => { const v = ayui.battle; v.introT = 0; return true; })()');
    await cdp.eval(`(async () => { const v = ayui.battle; for (let n = 0; n < 300; n++) { if (v.mode === 'intro') v.introT = 0; if (v.mode === 'cmd' && v.hero()) { if (v.hero().id === 'aayla') return true; v.commit('guard'); } await pause(40); } return false; })()`);
    await cdp.eval('(() => { const v = ayui.battle, cats = v.cats(); v.sel.cat = Math.max(0, cats.findIndex(c => c.id === "force")); v.mode = "skill"; v.sel.cmd = 0; return true; })()');
    await sleep(300);
    await shot('ch2-gifts.png');
    await cdp.eval('ayui.battle.mode = "cmd", true');
    const pf = await cdp.eval('duelFight()');
    log.push('post fight with the retinue: ' + pf + ' ' + (await cdp.eval('ayui.battle && ayui.battle.b.over')));
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('!ayui.battle', 5000);
    await cdp.eval('vnTo(() => !ayui.vn.active(), 50)');
    await cdp.eval('ayui.vn.runLabel("ch2_post_end"), true');
    await cdp.eval('vnTo(() => !!ayui.vn.choice, 100)');
    await sleep(200);
    await shot('ch2-guard.png');
    await cdp.eval('ayui.vn.pick(2), true');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "vilbum" && typed(), 200)');
    await shot('ch2-vilbum.png');
    await cdp.eval('vnTo(() => !!ayui.battle, 200)');
    await sleep(500);
    await shot('ch2-cantina.png');
    await cdp.eval('duelFight()');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('!ayui.battle', 5000);
    await cdp.eval('vnTo(() => !!ayui.battle, 200)');
    await sleep(700);
    await shot('ch2-duel-cantina.png');
    const dc = await cdp.eval('duelFight()');
    await sleep(300);
    await shot('ch2-duel-end.png');
    log.push('cantina duel: ' + dc + ' ' + (await cdp.eval('ayui.battle.b.over + "/" + ayui.battle.b.endReason')));
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('!ayui.battle', 5000);
    await cdp.eval('vnTo(() => ayui.vn.story.vn.still === "lodi" && typed(), 100)');
    await shot('ch2-lodi.png');
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "kiffex_hills" && !ayui.vn.active(), 200)'))) throw new Error('the cantina did not lead to the hills');
    await cdp.eval('placeAt(10, 8, "up"), true');
    await sleep(100);
    await cdp.key('Enter', 'Enter', 13);
    await sleep(200);
    await cdp.eval('placeAt(34, 9, "up"), true');
    await sleep(100);
    await cdp.key('Enter', 'Enter', 13);
    await sleep(400);
    await shot('ch2-hills.png');
    log.push('ambush: ' + JSON.stringify(await cdp.eval('({ placed: ayui.state.flags.placed, score: ayui.state.flags.ambush_score, followers: ayui.field.followers.length })')));
    await cdp.eval('placeAt(38, 18, "up"), true');
    await sleep(100);
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('vnTo(() => ayui.vn.story.vn.still === "temple_years" && typed(), 200)');
    await shot('ch2-tholme.png');
    await cdp.eval('vnTo(() => !!ayui.battle, 200)');
    await sleep(700);
    await shot('ch2-traa.png');
    const tr = await cdp.eval('duelFight()');
    log.push('T\'ra Saa: ' + tr + ' ' + (await cdp.eval('ayui.battle.b.over + "/" + ayui.battle.b.endReason')));
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('!ayui.battle', 5000);
    await cdp.eval('vnTo(() => !!ayui.vn.choice, 200)');
    await sleep(200);
    await shot('ch2-report.png');
    await cdp.eval('ayui.vn.pick(0), true');
    await cdp.eval('vnTo(() => !!ayui.battle, 200)');
    await sleep(700);
    await cdp.eval(`(async () => { const v = ayui.battle; for (let n = 0; n < 400; n++) { if (v.mode === 'intro') v.introT = 0; if (v.mode === 'cmd') { const c = v.b.commands(v.hero()).find(x => x.id === 'lower'); if (c && c.enabled) return true; v.commit('guard'); } await pause(40); } return false; })()`);
    await sleep(500);
    await shot('ch2-sanctum.png');
    log.push('sanctum: will ' + (await cdp.eval('ayui.battle.b.will')) + ', turns ' + (await cdp.eval('ayui.battle.b.turns.aayla')));
    await cdp.eval('duelFight()');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('!ayui.battle', 5000);
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "sanctum" && typed(), 100)');
    await shot('ch2-lower.png');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "lightning" && typed(), 100)');
    await shot('ch2-lightning.png');
    await cdp.eval('vnTo(() => !!ayui.battle, 100)');
    await sleep(700);
    await shot('ch2-karkko.png');
    await cdp.eval(`(async () => { const v = ayui.battle; ayui.keys.add('Enter'); for (let n = 0; n < 1500; n++) { if (v.b.enemies().some(e => e.fake) && v.mode === 'cmd') break; if (v.mode === 'intro') v.introT = 0; if (v.mode === 'cmd') { const k = v.b.units.find(e => e.key === 'karkko'); v.commit('blade', k.id); } await pause(40); } ayui.keys.delete('Enter'); return true; })()`);
    await sleep(300);
    await shot('ch2-illusions.png');
    const kf = await cdp.eval('duelFight()');
    await sleep(300);
    await shot('ch2-karkko-end.png');
    log.push('Karkko: ' + kf + ' ' + (await cdp.eval('ayui.battle.b.over + " three " + ayui.battle.b.three')));
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('!ayui.battle', 5000);
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "kiffu_council" && typed(), 100)');
    await shot('ch2-kiffu.png');
    await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.BondCard, 200)');
    await sleep(700);
    await shot('ch2-bond-traa.png');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.ChapterCard && ayui.overlay.id === "int", 200)'))) throw new Error('chapter 2 does not lead into the interlude');
    await sleep(1200);
    await shot('ch2-end.png');
    log.push('end of chapter 2: ' + JSON.stringify(await cdp.eval('({ dark: ayui.state.dark, memory: ayui.state.memory, party: ayui.state.party.map(m => m.id + ":" + m.level), heart: ayui.state.flags.heart, traa: ayui.state.bonds.traa.rank })')));
    await cdp.eval('ayui.card = null, ayui.overlay = new Aayla98.PartyScreen(ayui, { back: () => {} }), true');
    await sleep(300);
    await shot('ch2-party.png');
  },
  async interlude(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html?label=int_start');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await helpers(cdp);
    await cdp.eval(`window.caveFight = async () => {
      const v = ayui.battle;
      ayui.keys.add('Enter');
      for (let n = 0; n < 3000 && v.mode !== 'result' && !v.done; n++) {
        if (v.mode === 'intro') v.introT = 0;
        if (v.mode === 'cmd') {
          const h = v.hero(), cmds = v.b.commands(h), can = id => (cmds.find(c => c.id === id) || {}).enabled;
          const E = v.b.enemies(), front = E.filter(e => e.row === 'front'), rows = ['front', 'back'].sort((a, b) => E.filter(e => e.row === b).length - E.filter(e => e.row === a).length);
          if (can('seal')) v.commit('seal');
          else if (h.key === 'plo' && can('telepathy') && E.filter(e => e.row === rows[0]).length >= 2) v.commit('telepathy', rows[0]);
          else if (h.key === 'tholme' && !h.hidden && can('shadow') && n % 3 === 0) v.commit('shadow', h.id);
          else if (front.length && can('blade')) v.commit('blade', front[0].id);
          else v.commit('guard');
        }
        await pause(40);
      }
      ayui.keys.delete('Enter');
      return v.mode;
    }, true`);
    await cdp.until('ayui.overlay instanceof Aayla98.ChapterCard', 5000);
    await sleep(1200);
    await shot('int-card.png');
    const palace = 'ayui.overlay instanceof Aayla98.PalaceScreen';
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "plo" && typed(), 200)');
    await shot('int-plo.png');
    await cdp.eval(`vnTo(() => ${palace} || (ayui.vn.line && ayui.vn.line.who === 'mem' && typed()), 300)`);
    await shot('int-restore.png');
    if (!(await cdp.eval(`vnTo(() => ${palace}, 300)`))) throw new Error('the memory palace did not open');
    await sleep(300);
    await shot('int-palace.png');
    log.push('palace tray: ' + (await cdp.eval('ayui.overlay.tray.map(id => Aayla98.Memory.get(id).title).join(", ")')));
    await cdp.eval(`(() => { const s = ayui.overlay, want = Aayla98.Memory.slots(); s.area = 'tray'; s.sel = s.tray.indexOf(want[0]); s.act(); s.area = 'line'; s.sel = 0; s.act(); s.area = 'tray'; s.sel = s.tray.indexOf(want[1]); s.act(); s.area = 'line'; s.sel = 4; return true; })()`);
    await sleep(300);
    await shot('int-palace-hand.png');
    await cdp.eval(`(() => { const s = ayui.overlay, want = Aayla98.Memory.slots(); if (s.hand) { s.tray.push(s.hand); s.hand = null; } s.slots = want.map((id, i) => i === s.gapAt ? null : id); s.tray = []; s.finish(); return true; })()`);
    await sleep(500);
    await shot('int-palace-result.png');
    log.push('palace: Will +' + (await cdp.eval('Aayla98.Memory.will(ayui.state)')) + ', faded ' + (await cdp.eval('ayui.state.faded.join()')));
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "dallin" && typed(), 300)');
    await shot('int-dallin.png');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.bg === "avos_mine" && ayui.vn.line && typed(), 300)');
    await shot('int-avos.png');
    if (!(await cdp.eval('vnTo(() => !!ayui.battle, 300)'))) throw new Error('no cave battle');
    await sleep(800);
    await shot('int-cave.png');
    await cdp.eval(`(async () => { const v = ayui.battle; for (let n = 0; n < 400; n++) { if (v.mode === 'intro') v.introT = 0; if (v.mode === 'cmd' && v.hero() && v.hero().key === 'plo') { const c = v.cats(); v.sel.cat = Math.max(0, c.findIndex(x => x.id === 'force')); v.mode = 'skill'; v.sel.cmd = 0; return true; } if (v.mode === 'cmd') v.commit('blade', v.b.inRow('front')[0].id); await pause(40); } return false; })()`);
    await sleep(300);
    await shot('int-cave-force.png');
    await cdp.eval('ayui.battle.mode = "cmd", true');
    const r = await cdp.eval('caveFight()');
    await sleep(300);
    await shot('int-seal.png');
    log.push('cave: ' + r + ' ' + (await cdp.eval('ayui.battle.b.over + "/" + ayui.battle.b.endReason + " turns " + JSON.stringify(ayui.battle.b.turns)')));
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('!ayui.battle', 5000);
    await cdp.eval('vnTo(() => ayui.vn.story.vn.still === "stark_veterans" && typed(), 200)');
    await shot('int-veterans.png');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "yoda" && ayui.vn.line && ayui.vn.line.who === "yoda" && typed(), 300)');
    await shot('int-yoda.png');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "blue_blade" && typed(), 300)');
    await shot('int-blade.png');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.bg === "temple_cell" && ayui.vn.line && ayui.vn.line.who === "tholme" && ayui.vn.story.pc.label.startsWith("bond_") && typed(), 300)');
    await shot('int-bond-tholme.png');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.BondCard, 300)'))) throw new Error('no bond card after the Tholme scene');
    await sleep(700);
    await shot('int-bondcard.png');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen, 100)'))) throw new Error('the respite did not open');
    await sleep(300);
    await shot('int-respite.png');
    log.push('interlude: ' + JSON.stringify(await cdp.eval('({ level: ayui.state.party[0].level, tholme: ayui.state.bonds.tholme, blade: ayui.state.flags.blade_blue, told: ayui.state.flags.stark_told, memory: ayui.state.memory.length })')));
  },
  async respite(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await cdp.eval('Object.keys(localStorage).filter(k => k.startsWith("aayla98_slot") || k === "aayla98_auto" || k === "aayla98_quick").forEach(k => localStorage.removeItem(k)), true');
    await cdp.open('/aayla98.html?label=int_blade_made');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await helpers(cdp);
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen, 400)'))) throw new Error('the respite did not open');
    await sleep(300);
    await shot('respite-rooms.png');
    await cdp.key('ArrowRight', 'ArrowRight', 39);
    await cdp.key('Enter', 'Enter', 13);
    await sleep(200);
    await shot('respite-hall.png');
    log.push('hall: ' + (await cdp.eval('Aayla98.Respite.options(ayui.state, "p1", "hall").map(o => o.name + (o.enabled ? "" : " (" + o.why + ")")).join("; ")')));
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "xiaan" && typed(), 100)');
    await shot('respite-train.png');
    await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen, 100)');
    await sleep(300);
    await shot('respite-two-left.png');
    await cdp.eval('ayui.overlay.sel = 3, ayui.overlay.open(3), true');
    await sleep(200);
    await shot('respite-council.png');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "bond_tholme" && typed(), 200)');
    await shot('respite-bond2.png');
    await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.BondCard, 200)');
    await sleep(700);
    await shot('respite-bondcard.png');
    await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen, 50)');
    await sleep(200);
    await cdp.key('Escape', 'Escape', 27);
    await sleep(200);
    const menu = await cdp.eval('[...document.querySelectorAll(".ay-btn")].map(b => b.textContent)');
    log.push('pause menu in the respite: ' + menu.join(', '));
    if (!menu.includes('Сохранить') || !menu.includes('Связи')) throw new Error('no save or bonds in the respite pause menu');
    await cdp.eval('[...document.querySelectorAll(".ay-btn")].find(b => b.textContent === "Сохранить").click(), true');
    await sleep(300);
    await cdp.key('Enter', 'Enter', 13);
    await sleep(400);
    const saved = await cdp.eval('(() => { const raw = localStorage.getItem("aayla98_slot_1"); const b = raw && JSON.parse(raw); return { size: raw ? raw.length : 0, left: b && b.S.respite && b.S.respite.left, place: b && b.meta.place, thumb: !!(b && b.meta.thumb), hash: b && Aayla98.Save.hash(Object.assign({}, b.S, { time: 0 })) }; })()');
    log.push('saved in the respite: ' + JSON.stringify(Object.assign({}, saved, { hash: undefined })));
    if (saved.left !== 1) throw new Error('the respite save lost the activities');
    await cdp.key('Escape', 'Escape', 27);
    await sleep(200);
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.overlay instanceof Aayla98.TitleScreen && ayui.frames > 3');
    await helpers(cdp);
    await cdp.eval('ayui.loadGame(Aayla98.Save.read(localStorage, "aayla98_slot_1")), true');
    await sleep(500);
    const back = await cdp.eval('({ screen: ayui.overlay instanceof Aayla98.RespiteScreen, left: ayui.state.respite && ayui.state.respite.left, hash: Aayla98.Save.hash(Object.assign({}, ayui.state, { time: 0 })) })');
    log.push('loaded: ' + JSON.stringify(Object.assign({}, back, { same: back.hash === saved.hash, hash: undefined })));
    if (!back.screen || back.left !== 1 || back.hash !== saved.hash) throw new Error('loading did not reopen the same respite');
    await shot('respite-loaded.png');
    await cdp.eval('ayui.overlay.sel = 0, ayui.overlay.open(0), true');
    await cdp.key('Enter', 'Enter', 13);
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.PalaceScreen, 100)'))) throw new Error('meditation did not open the palace');
    await sleep(300);
    await shot('respite-palace.png');
    await cdp.eval('ayui.overlay.finish(), true');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.ChapterCard && ayui.overlay.id === "ch3", 300)'))) throw new Error('the interlude does not lead into chapter 3');
    await sleep(300);
    await shot('respite-end.png');
    log.push('after P1: ' + JSON.stringify(await cdp.eval('({ dark: ayui.state.dark, tholme: ayui.state.bonds.tholme.rank, deflect: ayui.state.party[0].deflect, level: ayui.state.party[0].level, auto: !!localStorage.getItem("aayla98_auto") })')));
  },
  async bonds(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html?label=int_blade_made');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await helpers(cdp);
    await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen, 400)');
    await cdp.key('Escape', 'Escape', 27);
    await sleep(200);
    await cdp.eval('[...document.querySelectorAll(".ay-btn")].find(b => b.textContent === "Связи").click(), true');
    await sleep(300);
    await shot('bonds-tholme.png');
    const pick = async who => {
      await cdp.eval(`ayui.overlay.sel = ayui.overlay.ids.indexOf(${JSON.stringify(who)}), true`);
      await sleep(200);
      await shot('bonds-' + who + '.png');
    };
    await pick('traa');
    await pick('vos');
    log.push('known bonds: ' + (await cdp.eval('ayui.overlay.known.join(", ")')));
    await cdp.key('Escape', 'Escape', 27);
    await sleep(200);
    if (!(await cdp.eval('ayui.overlay instanceof Aayla98.RespiteScreen'))) throw new Error('back from bonds does not return to the respite');
    await cdp.eval('ayui.under = ayui.overlay, ayui.overlay = new Aayla98.PartyScreen(ayui, { back: () => ayui.restore() }), true');
    await sleep(300);
    await shot('bonds-party.png');
  },
  async memory(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html?label=int_start');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await helpers(cdp);
    await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.PalaceScreen, 400)');
    await cdp.eval(`(() => { const s = ayui.overlay, want = Aayla98.Memory.slots(); s.slots = want.map((id, i) => i === s.gapAt ? null : id); [s.slots[5], s.slots[7]] = [s.slots[7], s.slots[5]]; s.tray = []; s.area = 'line'; s.sel = 6; return true; })()`);
    await sleep(300);
    await shot('memory-palace-pale.png');
    await cdp.eval('ayui.overlay.finish(), true');
    await sleep(400);
    await shot('memory-palace-result.png');
    await cdp.eval('ayui.overlay.close(), true');
    await cdp.eval('ayui.openMemory(), ayui.overlay.sel = ayui.overlay.list.findIndex(e => e.id === 6), true');
    await sleep(300);
    await shot('memory-pale.png');
    await cdp.eval('ayui.overlay.sel = ayui.overlay.list.findIndex(e => e.id === 12), true');
    await sleep(200);
    await shot('memory-12.png');
    await cdp.eval('ayui.state.flags.stark_told = true, ayui.overlay.sel = ayui.overlay.list.findIndex(e => e.id === 11), true');
    await sleep(200);
    await shot('memory-told.png');
    log.push('memory: ' + JSON.stringify(await cdp.eval('({ memory: ayui.state.memory, faded: ayui.state.faded, will: Aayla98.Memory.will(ayui.state) })')));
  },
  async flight(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    const pilot = require('./aayla98-bot.cjs').pilot.toString();
    const setup = async id => {
      await cdp.open('/aayla98.html?flight=' + id);
      await cdp.until('window.ayui && ayui.flight && ayui.frames > 3');
      await cdp.eval(`(() => {
        const A = Aayla98, PICKS = new WeakMap();
        window.pilot = ${pilot};
        window.drive = () => { ayui.flight.input = () => pilot(ayui.flight.f); };
        window.flyFor = (sec, until) => {
          const v = ayui.flight, f = v.f;
          let last = null;
          for (let i = 0; i < sec * 60 && !f.over; i++) {
            if (until && until(f)) break;
            const inp = pilot(f);
            f.step(1 / 60, inp);
            for (const e of f.take()) if (e.type === 'radio') last = e;
          }
          v.queue = [];
          if (last) v.say(last);
          return Math.round(f.t);
        };
        window.freeze = on => { ayui.menu = on ? {} : null; };
        return true;
      })()`);
    };
    const still = async (name, ms) => {
      await sleep(ms || 600);
      await cdp.eval('freeze(true), true');
      await sleep(120);
      await shot(name);
      await cdp.eval('freeze(false), true');
    };
    await setup('kintan');
    await sleep(400);
    await shot('flight-kintan-intro.png');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('ayui.flight.mode === "fly"', 5000);
    await sleep(1200);
    await cdp.key('Shift', 'ShiftLeft', 16);
    await sleep(200);
    const dash = await cdp.eval('ayui.flight.f.stats.dashes');
    if (dash !== 1) throw new Error('Shift does not dash: ' + dash);
    await cdp.eval('drive(), true');
    await still('flight-kintan-start.png', 300);
    await cdp.key('Escape', 'Escape', 27);
    const t0 = await cdp.eval('ayui.flight.f.t');
    await sleep(600);
    const t1 = await cdp.eval('ayui.flight.f.t');
    if (!(await cdp.eval('!!ayui.menu')) || t1 !== t0) throw new Error('the pause menu does not stop the flight');
    await cdp.key('Escape', 'Escape', 27);
    await sleep(300);
    if ((await cdp.eval('ayui.flight.f.t')) <= t1) throw new Error('the flight does not go on after the pause');
    log.push('kintan: dash on Shift, pause stops the clock at ' + t1.toFixed(1) + ' s');
    await cdp.eval('flyFor(30, f => f.t > 23)');
    await still('flight-kintan-bok.png');
    await cdp.eval('flyFor(40, f => f.t > 51)');
    await still('flight-kintan-lava.png');
    await cdp.eval('flyFor(60, f => f.boss && f.boss.phase === "aim")');
    await still('flight-kintan-dive.png', 150);
    await cdp.eval('flyFor(200, f => f.boss && f.boss.phase === "down")');
    await still('flight-kintan-down.png', 400);
    await cdp.eval('flyFor(10)');
    await cdp.until('ayui.flight.mode === "result"', 8000);
    await sleep(300);
    await shot('flight-kintan-win.png');
    log.push('kintan won: ' + JSON.stringify(await cdp.eval('({ t: Math.round(ayui.flight.f.t), shields: ayui.flight.f.ship.shield, stats: ayui.flight.f.stats })')));
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('ayui.flight && ayui.flight.mode === "intro"', 5000);
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('(() => { const f = ayui.flight.f; f.ship.shield = 1; f.ship.inv = 0; f.bolts.push({ x: f.ship.x, y: f.ship.y, vx: 0, vy: 0, r: 2, dmg: 8, type: "bolt", wait: 0 }); return true; })()');
    await cdp.until('ayui.flight.mode === "result"', 5000);
    await sleep(300);
    await shot('flight-lose.png');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.until('ayui.flight && ayui.flight.mode === "intro" && ayui.flight.f.t === 0 && ayui.defeats === 1', 5000);
    log.push('lost flight starts again from the beginning');
    await setup('kamino');
    await cdp.eval(`(() => {
      const pads = { connected: true, buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })), axes: [0, 0] };
      window.__pad = pads;
      navigator.getGamepads = () => [pads];
      return true;
    })()`);
    await cdp.eval('__pad.buttons[0].pressed = true, true');
    await sleep(200);
    await cdp.eval('__pad.axes = [0.9, 0], true');
    await sleep(500);
    await cdp.eval('__pad.buttons[5].pressed = true, true');
    await sleep(120);
    await cdp.eval('__pad.buttons[5].pressed = false, true');
    await sleep(200);
    const pad = await cdp.eval('({ mode: ayui.flight.mode, shots: ayui.flight.f.stats.shots, x: Math.round(ayui.flight.f.ship.x), dashes: ayui.flight.f.stats.dashes, device: ayui.device })');
    if (pad.mode !== 'fly' || !(pad.shots > 0) || !(pad.x > 200) || pad.dashes !== 1) throw new Error('gamepad does not fly: ' + JSON.stringify(pad));
    await shot('flight-pad.png');
    await cdp.eval('__pad.buttons[0].pressed = false, __pad.axes = [0, 0], navigator.getGamepads = () => [], ayui.device = "kb", true');
    log.push('gamepad: A takes off and fires, stick steers, RB dashes ' + JSON.stringify(pad));
    await cdp.eval('drive(), true');
    await cdp.eval('flyFor(60, f => f.t > 38)');
    await still('flight-kamino.png', 700);
    await cdp.eval('flyFor(60, f => f.foes.some(o => o.kind === "ally" && o.shotT > 0))');
    await still('flight-kamino-wingman.png', 30);
    await cdp.eval('flyFor(200)');
    await cdp.until('ayui.flight.mode === "result"', 8000);
    await sleep(300);
    await shot('flight-kamino-win.png');
    log.push('kamino: ' + JSON.stringify(await cdp.eval('({ over: ayui.flight.f.over, t: Math.round(ayui.flight.f.t), stats: ayui.flight.f.stats })')));
    await setup('saleucami');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('drive(), true');
    await cdp.eval('flyFor(30, f => f.t > 20)');
    await still('flight-saleucami-approach.png');
    await cdp.eval('flyFor(60, f => f.t > 70)');
    await still('flight-saleucami-dome.png');
    await cdp.eval('flyFor(60, f => f.foes.some(o => o.kind === "wing" && o.y < 150))');
    await still('flight-saleucami-xiaan.png', 300);
    await cdp.eval('flyFor(30, f => !f.dome && f.t > 116)');
    await still('flight-saleucami-cannons.png');
    await cdp.eval('flyFor(200)');
    await cdp.until('ayui.flight.mode === "result"', 8000);
    await sleep(300);
    await shot('flight-saleucami-win.png');
    log.push('saleucami: ' + JSON.stringify(await cdp.eval('({ over: ayui.flight.f.over, t: Math.round(ayui.flight.f.t), stats: ayui.flight.f.stats })')));
  },
  async cover(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html?label=ch3_start');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await helpers(cdp);
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.DossierScreen, 300)'))) throw new Error('no dossier at the start of the cover');
    await sleep(300);
    await shot('cover-dossier.png');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('vnTo(() => ayui.vn.choice && ayui.vn.choice.lekku, 200)');
    await sleep(200);
    await shot('cover-overseer.png');
    await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "fenn_house" && !ayui.vn.active(), 300)');
    await sleep(600);
    await shot('cover-field.png');
    const T = 16;
    await cdp.eval(`(() => { const f = ayui.field, g = f.objs.find(o => o.id === 'x'); placeAt(7, 8, 'left'); g.px = 3 * ${T} + 8; g.py = 8 * ${T} + 14; g.angle = 0; g.calm = 0; g.mode = 'patrol'; g.route = []; return true; })()`);
    await sleep(400);
    await shot('cover-seen.png');
    log.push('seen in the corridor: ' + JSON.stringify(await cdp.eval('({ sus: Math.round(ayui.state.cover.sus) })')));
    await cdp.eval(`(() => { const f = ayui.field, g = f.objs.find(o => o.id === 'x'); g.px = 10 * ${T} + 8; g.angle = Math.PI; const v = f.objs.find(o => o.id === 'v'); v.px = 16 * ${T} + 8; v.py = 9 * ${T} + 14; v.angle = Math.PI; v.route = []; placeAt(36, 3, 'right'); return true; })()`);
    await sleep(200);
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "servant" && ayui.vn.line && ayui.vn.line.who === "rofenn" && typed(), 200)');
    await shot('cover-screen.png');
    await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active(), 200)');
    await cdp.eval('placeAt(17, 17, "up"), true');
    await sleep(200);
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('vnTo(() => !!ayui.vn.choice, 200)');
    await sleep(200);
    await shot('cover-maid.png');
    await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active(), 200, v => 2)');
    log.push('intel: ' + JSON.stringify(await cdp.eval('({ screen: !!ayui.state.flags.intel_screen, maid: !!ayui.state.flags.intel_maid, sus: Math.round(ayui.state.cover.sus) })')));
    await cdp.eval('ayui.under = null, ayui.openDossier(), true');
    await sleep(300);
    await shot('cover-dossier-progress.png');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval(`(() => { ayui.state.cover.sus = 90; const f = ayui.field, g = f.objs.find(o => o.id === 'x'); placeAt(7, 8, 'left'); g.px = 3 * ${T} + 8; g.py = 8 * ${T} + 14; g.angle = 0; g.calm = 0; return true; })()`);
    if (!(await cdp.eval('vnTo(() => ayui.vn.story.pc.label === "ch3_exposed" && ayui.vn.line && typed(), 200)'))) throw new Error('suspicion 100 did not expose the cover');
    await shot('cover-exposed.png');
    if (!(await cdp.eval('vnTo(() => !!ayui.battle, 200)'))) throw new Error('no fight after the exposure');
    await sleep(700);
    await shot('cover-fight.png');
    log.push('exposed: ' + JSON.stringify(await cdp.eval('({ group: ayui.battle.b.groupId, exposed: ayui.state.cover && ayui.state.cover.exposed })')));
  },
  async ch3(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html?label=ch3_report');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await helpers(cdp);
    await cdp.eval(`window.fight3 = async (until) => {
      const v = ayui.battle;
      ayui.keys.add('Enter');
      for (let n = 0; n < 4000 && v.mode !== 'result' && !v.done; n++) {
        if (until && until(v)) break;
        if (v.mode === 'intro') v.introT = 0;
        if (v.mode === 'cmd') {
          const h = v.hero(), cmds = v.b.commands(h), can = id => (cmds.find(c => c.id === id) || {}).enabled;
          const E = v.b.enemies().filter(e => !e.hidden), front = E.filter(e => e.row === 'front'), cort = e => (Aayla98.ENEMY_KINDS[e.kind] || {}).cortosis;
          const hard = E.find(cort);
          if (h.key === 'villie' && can('bet')) v.commit('bet', 'fast');
          else if (h.key === 'villie' && can('vshot') && E.length) v.commit('vshot', E[0].id);
          else if (h.key === 'secura_guard' && can('zapstaff') && front.length) v.commit('zapstaff', front[0].id);
          else if (h.id === 'aayla' && hard && hard.row === 'back' && v.b.hazard === 'chasm' && can('push') && !(hard.hazardCool > 0)) v.commit('push', hard.id);
          else if (h.id === 'aayla' && hard && hard.row === 'back' && can('pull')) v.commit('pull', hard.id);
          else if (h.id === 'aayla' && hard && hard.row === 'front' && can('fists')) v.commit('fists', hard.id);
          else if (front.length && can('blade') && !cort(front[0])) v.commit('blade', front[0].id);
          else if (E.length && can('vlightning')) v.commit('vlightning', E[0].id);
          else v.commit('guard');
        }
        await pause(30);
      }
      ayui.keys.delete('Enter');
      return v.mode;
    }, true`);
    const battle = async (name, until) => {
      if (!(await cdp.eval('vnTo(() => !!ayui.battle, 400)'))) throw new Error('no battle before ' + name);
      await sleep(700);
      await shot(name + '.png');
      const r = await cdp.eval(until ? `fight3(${until})` : 'fight3()');
      if (until) { await sleep(300); await shot(name + '-mid.png'); await cdp.eval('fight3()'); }
      await sleep(300);
      const res = await cdp.eval('ayui.battle && (ayui.battle.b.over + (ayui.battle.b.endReason ? "/" + ayui.battle.b.endReason : ""))');
      log.push(name + ': ' + r + ' ' + res);
      await cdp.key('Enter', 'Enter', 13);
      await cdp.until('!ayui.battle', 5000);
    };
    await battle('ch3-night', 'v => v.b.unit("aayla").status.saberOff');
    await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "ordmantell_junk" && !ayui.vn.active(), 400)');
    await sleep(500);
    await shot('ch3-junk.png');
    await cdp.eval('placeAt(21, 5, "right"), ayui.field.interact(), true');
    await battle('ch3-hunters');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "junkyard" && typed(), 100)');
    await shot('ch3-junkyard.png');
    await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.BondCard, 200)');
    await sleep(700);
    await shot('ch3-bond-vos.png');
    await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active(), 200)');
    await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active() && !ayui.overlay, 200)');
    await cdp.eval('placeAt(35, 5, "up"), ayui.field.interact(), true');
    if (!(await cdp.eval('vnTo(() => !!ayui.vn.choice, 200)'))) throw new Error('Villie did not talk');
    await sleep(200);
    await shot('ch3-villie.png');
    await cdp.eval('ayui.vn.pick(2), true');
    if (!(await cdp.eval('vnTo(() => !!ayui.flight, 300)'))) throw new Error('no flight over Kintan');
    await sleep(300);
    await shot('ch3-flight-intro.png');
    log.push('flight from the story: ' + JSON.stringify(await cdp.eval('({ id: ayui.flight.f.id, resume: (() => { const l = ayui.latestSave(); return l && l.blob.kind === "auto" ? l.blob.S.resume : null; })() })')));
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "villie" && /летать/.test(ayui.vn.line.text) && typed(), 300)');
    await shot('ch3-flight.png');
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "kintan_wastes" && !ayui.vn.active(), 300)'))) throw new Error('no wastes after the flight');
    await sleep(500);
    await shot('ch3-wastes.png');
    log.push('wastes: ' + JSON.stringify(await cdp.eval('({ party: ayui.state.party.map(m => m.id + ":" + m.level), followers: ayui.field.followers.map(f => f.key), villie: !!ayui.state.flags.with_villie, credits: ayui.state.credits })')));
    await cdp.eval('(() => { const p = ayui.field.objs.find(o => o.id === "p"); placeAt(Math.floor(p.px / 16), Math.floor((p.py - 3) / 16) + 1, "up"); return true; })()');
    await battle('ch3-patrol');
    await cdp.eval('vnTo(() => !ayui.vn.active(), 50)');
    await cdp.eval('ayui.vn.runLabel("ch3_ambush"), true');
    await battle('ch3-ambush');
    await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active(), 100)');
    await cdp.eval('ayui.vn.runLabel("ch3_lava"), true');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "lava" && typed(), 100)');
    await shot('ch3-lava.png');
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "kintan_fortress" && !ayui.vn.active(), 300)'))) throw new Error('no fortress after the lava');
    await sleep(500);
    await shot('ch3-fortress.png');
    await cdp.eval('placeAt(37, 4, "up"), ayui.field.interact(), true');
    await battle('ch3-axrx', 'v => v.b.thrown');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "nat" && /Ван/.test(ayui.vn.line.text) && typed(), 200)');
    await shot('ch3-nat.png');
    await battle('ch3-bok');
    await cdp.eval('vnTo(() => !!ayui.vn.choice, 200)');
    await sleep(200);
    await shot('ch3-bok-choice.png');
    await cdp.eval('ayui.vn.pick(1), true');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.bg === "secura_chamber" && ayui.vn.line && typed(), 200)');
    await shot('ch3-ryloth.png');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "knighting" && typed(), 300)');
    await shot('ch3-knighting.png');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen, 300)'))) throw new Error('no respite after the knighting');
    await sleep(300);
    await shot('ch3-p2.png');
    for (let i = 0; i < 2; i++) {
      await cdp.eval(`(() => { const s = ayui.overlay, i = s.rooms.findIndex(r => s.options(r).some(o => o.enabled)); s.open(i); s.choose(s.options(s.rooms[i]).findIndex(o => o.enabled)); return true; })()`);
      await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen || ayui.overlay instanceof Aayla98.PalaceScreen, 300)');
      if (await cdp.eval('ayui.overlay instanceof Aayla98.PalaceScreen')) { await cdp.eval('ayui.overlay.finish(), true'); await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen, 300)'); }
    }
    await sleep(300);
    await shot('ch3-p3.png');
    log.push('chronicle: ' + JSON.stringify(await cdp.eval('({ id: ayui.state.respite && ayui.state.respite.id, left: ayui.state.respite && ayui.state.respite.left, level: ayui.state.party[0].level })')));
    await cdp.eval('ayui.under = ayui.overlay, ayui.openBonds(), true');
    await sleep(300);
    await shot('ch3-bonds.png');
    await cdp.eval('ayui.restore(), true');
  },
  async ch4(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html?label=ch4_start');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await helpers(cdp);
    await cdp.eval(`window.fight4 = async (until) => {
      const v = ayui.battle;
      ayui.keys.add('Enter');
      for (let n = 0; n < 6000 && v.mode !== 'result' && !v.done; n++) {
        if (until && until(v)) break;
        if (v.mode === 'intro') v.introT = 0;
        if (v.mode === 'cmd') {
          const h = v.hero(), cmds = v.b.commands(h), can = id => (cmds.find(c => c.id === id) || {}).enabled;
          const E = v.b.enemies().filter(e => !e.hidden), front = E.filter(e => e.row === 'front');
          const weak = v.b.heroes().find(x => x.id !== h.id && x.hp < x.maxhp * 0.5);
          if (v.b.groupId === 'zenex_bridge' && h.id === 'aayla' && v.b.daze >= 60 && can('focus')) v.commit('focus');
          else if (v.b.groupId === 'hypori' && h.id === 'aayla' && weak && can('cover:' + weak.id)) v.commit('cover:' + weak.id);
          else if (h.key === 'kit' && can('shiicho') && front.length) v.commit('shiicho', 'frontAll');
          else if (front.length && can('blade')) v.commit('blade', front[0].id);
          else if (front.length && can('fists')) v.commit('fists', front[0].id);
          else if (E.length && can('vlightning')) v.commit('vlightning', E[0].id);
          else if (can('leap') && v.b.targets(h, 'leap').length) v.commit('leap', v.b.targets(h, 'leap')[0]);
          else if (can('pull') && v.b.targets(h, 'pull').length) v.commit('pull', v.b.targets(h, 'pull')[0]);
          else v.commit('guard');
        }
        await pause(30);
      }
      ayui.keys.delete('Enter');
      return v.mode;
    }, true`);
    const battle = async (name, until) => {
      if (!(await cdp.eval('vnTo(() => !!ayui.battle, 500)'))) throw new Error('no battle before ' + name);
      await sleep(700);
      await shot(name + '.png');
      const r = await cdp.eval(until ? `fight4(${until})` : 'fight4()');
      if (until) { await sleep(400); await shot(name + '-mid.png'); await cdp.eval('fight4()'); }
      await sleep(300);
      const res = await cdp.eval('ayui.battle && (ayui.battle.b.over + (ayui.battle.b.endReason ? "/" + ayui.battle.b.endReason : ""))');
      log.push(name + ': ' + r + ' ' + res);
      await cdp.key('Enter', 'Enter', 13);
      await cdp.until('!ayui.battle', 5000);
    };
    const talk = async (x, y, dir, name, pick) => {
      await cdp.eval(`vnTo(() => ayui.field && !ayui.vn.active() && !ayui.overlay, 300)`);
      await cdp.eval(`placeAt(${x}, ${y}, "${dir}"), ayui.field.interact(), true`);
      if (name) {
        if (!(await cdp.eval('vnTo(() => !!ayui.vn.choice, 300)'))) throw new Error('no choice at ' + name);
        await sleep(200);
        await shot(name + '.png');
      }
      await cdp.eval(`vnTo(() => ayui.field && !ayui.vn.active() && !ayui.overlay, 300${pick === undefined ? '' : ', v => ' + pick})`);
    };
    const repair = async (x, y, name) => {
      await cdp.eval(`vnTo(() => ayui.field && !ayui.vn.active() && !ayui.overlay, 300)`);
      await cdp.eval(`placeAt(${x}, ${y}, "right"), ayui.field.interact(), true`);
      if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RepairScreen, 50)'))) throw new Error('no repair screen at ' + x + ',' + y);
      await sleep(300);
      if (name) await shot(name + '.png');
      const clicks = await cdp.eval('(() => { const o = ayui.overlay, c = Aayla98.Repair.solve(o.def, o.rot); for (const [x, y] of c) o.turn(x, y); return { clicks: c.length, won: o.won }; })()');
      if (!clicks.won) throw new Error('the repair is not solved');
      await sleep(300);
      if (name) await shot(name + '-done.png');
      await cdp.key('Enter', 'Enter', 13);
      await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active() && !ayui.overlay, 300)');
      return clicks.clicks;
    };
    await battle('ch4-arena', 'v => v.b.waved && v.mode === "cmd"');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "arena" && typed(), 200)');
    await shot('ch4-arena-cg.png');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "tholme" && typed(), 200)');
    await shot('ch4-council.png');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.DossierScreen, 300)'))) throw new Error('no dossier for Jayzaa');
    await sleep(300);
    await shot('ch4-dossier.png');
    await cdp.key('Enter', 'Enter', 13);
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "jayzaa" && typed(), 200)');
    await shot('ch4-jayzaa.png');
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "wheel_levels" && !ayui.vn.active(), 300)'))) throw new Error('no Wheel map');
    await sleep(700);
    await shot('ch4-wheel.png');
    const n1 = await repair(11, 5, 'ch4-repair');
    await talk(6, 4, 'up', 'ch4-bar', 0);
    await talk(12, 15, 'up', 'ch4-tookarti', 0);
    const n2 = await repair(40, 5);
    log.push('Wheel: ' + JSON.stringify(await cdp.eval('({ intel: Aayla98.Cover.got(ayui.state), sus: Math.round(ayui.state.cover.sus), credits: ayui.state.credits, lock: ayui.field.objs.some(o => o.id === "d") })')) + ', clicks ' + n1 + '+' + n2);
    await cdp.eval('placeAt(35, 18, "down"), true');
    await sleep(400);
    await shot('ch4-lower.png');
    await cdp.eval('placeAt(40, 21, "right"), ayui.field.interact(), true');
    await battle('ch4-trap');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "vos" && /механик/.test(ayui.vn.line.text) && typed(), 200)');
    await shot('ch4-korto.png');
    await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.BondCard, 300)');
    await sleep(700);
    await shot('ch4-bond-vos.png');
    await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active() && !ayui.overlay, 300)');
    await cdp.eval('placeAt(32, 21, "down"), ayui.field.interact(), true');
    await battle('ch4-dianoga');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "zenex" && /Приставь/.test(ayui.vn.line.text) && typed(), 300)');
    await shot('ch4-walkway.png');
    await battle('ch4-zenex', 'v => v.b.daze >= 40 && v.mode === "cmd"');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "neimoidian" && typed(), 200)');
    await shot('ch4-contact.png');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "rancisis" && typed(), 300)');
    await shot('ch4-generals.png');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "anakin" && /запутано/.test(ayui.vn.line.text) && typed(), 200)');
    await shot('ch4-anakin.png');
    if (!(await cdp.eval('vnTo(() => !!ayui.flight, 300)'))) throw new Error('no flight over Kamino');
    await sleep(300);
    await shot('ch4-flight.png');
    log.push('flight: ' + JSON.stringify(await cdp.eval('({ id: ayui.flight.f.id, resume: (() => { const l = ayui.latestSave(); return l && l.blob.kind === "auto" ? l.blob.S.resume : null; })() })')));
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "kamino_tipoca" && !ayui.vn.active(), 400)'))) throw new Error('no Kamino map');
    await sleep(700);
    await shot('ch4-kamino.png');
    await talk(29, 10, 'up', 'ch4-saynta', 0);
    await cdp.eval('placeAt(25, 11, "down"), true');
    await sleep(100);
    await cdp.eval('ayui.field.step(1 / 60, { sense: true }), true');
    await sleep(500);
    await shot('ch4-sense.png');
    await cdp.eval('ayui.vn.runLabel("ch4_alarm"), true');
    await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active() && !ayui.overlay, 300)');
    await cdp.eval('(() => { const e = ayui.field.objs.find(o => o.id === "e"); placeAt(Math.floor(e.px / 16) - 1, Math.floor((e.py - 3) / 16), "right"); return true; })()');
    await battle('ch4-b2');
    await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active() && !ayui.overlay, 300)');
    await cdp.eval('ayui.vn.runLabel("ch4_platform"), true');
    await battle('ch4-kuma');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "underwater" && typed(), 300)');
    await shot('ch4-underwater.png');
    await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.BondCard, 300)');
    await sleep(700);
    await shot('ch4-bond-kit.png');
    await cdp.eval('vnTo(() => ayui.vn.line && /Джар/.test(ayui.vn.line.text) && typed(), 300)');
    await shot('ch4-sabers.png');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen, 300)'))) throw new Error('no respite P4');
    await sleep(300);
    await shot('ch4-p4.png');
    for (let i = 0; i < 3; i++) {
      await cdp.eval(`(() => { const s = ayui.overlay, i = s.rooms.findIndex(r => s.options(r).some(o => o.enabled)); s.open(i); s.choose(s.options(s.rooms[i]).findIndex(o => o.enabled)); return true; })()`);
      await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen || ayui.overlay instanceof Aayla98.PalaceScreen || !!ayui.battle, 300)');
      if (await cdp.eval('ayui.overlay instanceof Aayla98.PalaceScreen')) { await cdp.eval('ayui.overlay.finish(), true'); await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.RespiteScreen || !!ayui.battle, 300)'); }
      if (await cdp.eval('!!ayui.battle || !ayui.state.respite')) break;
    }
    log.push('P4: ' + JSON.stringify(await cdp.eval('({ log: ayui.state.flags.rs_p4, level: ayui.state.party[0].level, kit: Aayla98.Bonds.rank(ayui.state, "kit") })')));
    await battle('ch4-hypori', 'v => v.b.covered && v.mode === "cmd"');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "hypori" && typed(), 300)');
    await shot('ch4-hypori-cg.png');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "bly" && typed(), 300)');
    await shot('ch4-bly.png');
    await battle('ch4-spar');
    await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.BondCard, 300)');
    await sleep(700);
    await shot('ch4-bond-bly.png');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.ChapterCard && ayui.overlay.id === "ch5", 300)'))) throw new Error('chapter 4 does not lead into chapter 5');
    await sleep(300);
    await shot('ch4-end.png');
    log.push('end of chapter 4: ' + JSON.stringify(await cdp.eval('({ level: ayui.state.party[0].level, ranks: ["vos", "kit", "bly"].map(id => Aayla98.Bonds.rank(ayui.state, id)), spar: ayui.state.flags.duel_spar, hypori: [ayui.state.flags.duel_hypori_turns, ayui.state.flags.duel_hypori_kept], green: !!ayui.state.flags.saber_green, cover: ayui.state.flags.cover_jayzaa })')));
  },
  async ch5(cdp, out, log) {
    const { shot, battle, free, talk, enemy, respite } = await storyKit(cdp, out, log, 'ch5_start', ['traa', 'kit', 'bly', 'secura', 'tholme']);
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "elsah" && typed(), 200)');
    await shot('ch5-elsah.png');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "kuro" && typed(), 200)');
    await shot('ch5-kuro.png');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "vos_holo" && typed(), 200)');
    await shot('ch5-vos-holo.png');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.DossierScreen, 400)'))) throw new Error('no dossier for Tuulaa');
    await sleep(300);
    await shot('ch5-dossier.png');
    await cdp.key('Enter', 'Enter', 13);
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "devaron_suite" && !ayui.vn.active(), 300)'))) throw new Error('no Devaron map');
    await sleep(700);
    await shot('ch5-suite.png');
    await talk(5, 5, 'up', 'ch5-jeweler', 0);
    await talk(10, 19, 'up', 'ch5-saba', 0);
    await talk(4, 19, 'up', 'ch5-miles', 0);
    await talk(22, 15, 'up', 'ch5-senator', 0);
    await talk(39, 15, 'right', 'ch5-hunter', undefined, true);
    await free();
    await sleep(400);
    await shot('ch5-suite-hud.png');
    log.push('cover: ' + JSON.stringify(await cdp.eval('({ intel: Aayla98.Cover.got(ayui.state), sus: Math.round(ayui.state.cover.sus), credits: ayui.state.credits, spent: ayui.state.flags.spent })')));
    await cdp.eval('placeAt(4, 19, "up"), ayui.field.interact(), true');
    if (!(await cdp.eval('vnTo(() => ayui.vn.choice && ayui.vn.story.pc.label === "ch5_confront", 300)'))) throw new Error('no confrontation with the senator');
    await sleep(200);
    await shot('ch5-confront.png');
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "devaron_base" && !ayui.vn.active(), 300)'))) throw new Error('no Blue Mountains');
    await sleep(700);
    await shot('ch5-base.png');
    await enemy('q', 'ch5-chasm');
    await enemy('p', 'ch5-raiders', 'v => v.talkShow && v.cur && v.cur.wait');
    await free();
    await cdp.eval('placeAt(26, 16, "down"), ayui.field.interact(), true');
    await free();
    await cdp.eval('ayui.vn.runLabel("ch5_cave"), true');
    await cdp.eval('vnTo(() => ayui.vn.line && ayui.vn.line.who === "aurra" && typed(), 200)');
    await shot('ch5-aurra-quote.png');
    await battle('ch5-aurra', 'v => v.mode === "ask"');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "antenna" && typed(), 200)');
    await shot('ch5-antenna.png');
    await battle('ch5-raid', 'v => v.b.enemies().some(e => e.status.rooted) && v.mode === "cmd"');
    await respite('ch5-p5', ['bond:traa', 'bond:kit', 'train:push3', 'archive:ch6']);
    if (await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "bond_traa" && typed(), 200)')) await shot('ch5-traa-3.png');
    if (await cdp.eval('vnTo(() => ayui.vn.choice && ayui.vn.story.pc.label === "bond_kit_4", 200)')) { await sleep(300); await shot('ch5-kit-4.png'); }
    await battle('ch5-cantina');
    await battle('ch5-forest');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "shonju" && typed(), 200)');
    await shot('ch5-shonju-cg.png');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.bg === "shonju_castle" && ayui.vn.line && ayui.vn.line.who === "shonju" && typed(), 300)');
    await shot('ch5-castle.png');
    await battle('ch5-guards');
    if (!(await cdp.eval('vnTo(() => ayui.field && ayui.field.map.id === "duum_hq" && !ayui.vn.active(), 400)'))) throw new Error('no burning station');
    await sleep(1500);
    await shot('ch5-fire.png');
    await cdp.eval('placeAt(23, 6, "right"), true');
    await sleep(800);
    await shot('ch5-fire-wall.png');
    log.push('fire: ' + JSON.stringify(await cdp.eval('({ timer: Math.round(ayui.field.timer), fires: ayui.field.objs.filter(o => o.type === "fire").length })')));
    await cdp.eval('ayui.vn.runLabel("ch5_control"), true');
    await battle('ch5-shonju', 'v => v.mode === "ask"');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "laugh" && typed(), 200)');
    await shot('ch5-laugh.png');
    await cdp.eval('vnTo(() => ayui.vn.story.vn.cg === "found" && typed(), 300)');
    await shot('ch5-found.png');
    await respite('ch5-p6', ['bond:bly', 'bond:secura']);
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.ChapterCard && ayui.overlay.id === "ch6", 300)'))) throw new Error('chapter 5 does not lead into chapter 6');
    await sleep(300);
    await shot('ch5-end.png');
    log.push('end of chapter 5: ' + JSON.stringify(await cdp.eval('({ level: ayui.state.party[0].level, ranks: ["traa", "kit", "bly", "secura"].map(id => Aayla98.Bonds.rank(ayui.state, id)), letgo: Aayla98.Bonds.get(ayui.state, "vos").letgo, cover: ayui.state.flags.cover_tuulaa, found: !!ayui.state.flags.found_self })')));
  },
  async ch6(cdp, out, log) {
    const { shot, battle, free, talk, enemy, respite } = await storyKit(cdp, out, log, 'ch6_start', ['vos', 'tholme', 'bly', 'kit']);
    const map = async (id, name) => {
      if (!(await cdp.eval(`vnTo(() => ayui.field && ayui.field.map.id === "${id}" && !ayui.vn.active() && !ayui.overlay, 600)`))) throw new Error('no map ' + id);
      await sleep(800);
      await shot(name + '.png');
    };
    const line = async (test, name, max) => {
      if (!(await cdp.eval(`vnTo(() => ${test}, ${max || 300})`))) throw new Error('no scene ' + name);
      await sleep(200);
      await shot(name + '.png');
    };
    await line('ayui.vn.line && ayui.vn.line.who === "bly" && typed()', 'ch6-holstice');
    await line('ayui.vn.story.pc.label === "ch6_secret_end" && ayui.vn.line && typed()', 'ch6-hospital');
    await respite('ch6-p7', ['bond:vos', 'archive:ch7']);
    await line('ayui.vn.line && ayui.vn.line.who === "bly_thinks" && typed()', 'ch6-bly-thinks');
    await map('honoghr_forest', 'ch6-forest');
    await cdp.eval('placeAt(17, 13, "right"), ayui.field.sense(), true');
    await sleep(900);
    await shot('ch6-forest-sense.png');
    await talk(6, 6, 'up', 'ch6-armor', undefined, true);
    await enemy('n', 'ch6-noghri');
    await free();
    await cdp.eval('ayui.vn.runLabel("ch6_ambush"), true');
    await battle('ch6-ambush', 'v => (v.b.turns.aayla || 0) >= 2 && v.mode === "cmd"');
    await battle('ch6-horde', 'v => v.b.spawned > 0 && v.mode === "cmd"');
    await line('!!ayui.vn.choice && ayui.vn.story.pc.label === "ch6_vos"', 'ch6-vos-arrives');
    await map('honoghr_temple', 'ch6-temple');
    await talk(6, 17, 'down');
    await cdp.eval('placeAt(23, 13, "left"), ayui.field.senseShow = 5, true');
    await sleep(700);
    await shot('ch6-decoy.png');
    log.push('decoy: ' + JSON.stringify(await cdp.eval('ayui.field.objs.filter(o => o.type === "enemy").map(o => o.id + ":" + o.mode)')));
    await enemy('n', 'ch6-temple-guards');
    await enemy('q', 'ch6-temple-droids');
    await talk(10, 10, 'up', 'ch6-en', undefined, true);
    await talk(20, 7, 'up', 'ch6-sigils', undefined, true);
    await free();
    await cdp.eval('placeAt(20, 7, "up"), true');
    await sleep(500);
    await shot('ch6-grab.png');
    await cdp.eval('ayui.field.force("pull"), true');
    await line('ayui.vn.story.pc.label === "ch6_ship" && ayui.vn.line && ayui.vn.line.who === "vos" && typed()', 'ch6-ship');
    await battle('ch6-vos', 'v => (v.b.turns.aayla || 0) >= 2 && v.mode === "cmd"');
    await line('!!ayui.vn.choice && ayui.vn.story.pc.label === "ch6_fallen"', 'ch6-fallen');
    await line('ayui.vn.story.vn.cg === "bly_shoots" && typed()', 'ch6-bly-shoots');
    await line('ayui.vn.story.vn.cg === "honoghr" && typed()', 'ch6-honoghr');
    await respite('ch6-p8', ['bond:bly', 'bond:kit', 'bond:vos', 'archive:ch7']);
    await line('ayui.vn.line && ayui.vn.line.who === "akku" && typed()', 'ch6-seii');
    await battle('ch6-students', 'v => v.b.units.some(u => u.gone === "ko") && v.mode === "cmd"');
    await line('!!ayui.vn.choice && ayui.vn.story.pc.label === "ch6_maggot"', 'ch6-gort');
    await map('anzat_dock', 'ch6-dock');
    await cdp.eval('placeAt(17, 3, "down"), ayui.field.senseShow = 5, true');
    await sleep(700);
    await shot('ch6-dock-watch.png');
    await talk(30, 9, 'up', 'ch6-logs', undefined, true);
    await free();
    await cdp.eval('ayui.vn.runLabel("ch6_bokclone"), true');
    await battle('ch6-bok-clone');
    await line('ayui.vn.line && ayui.vn.line.who === "bulq" && typed()', 'ch6-bulq');
    await line('ayui.vn.line && ayui.vn.line.who === "obiwan" && typed()', 'ch6-trigalis');
    await line('ayui.vn.line && ayui.vn.line.who === "bly" && ayui.vn.story.pc.label === "ch6_saleucami" && typed()', 'ch6-saleucami');
    await battle('ch6-camp', 'v => (v.b.turns.aayla || 0) >= 2 && v.mode === "cmd"');
    await map('saleucami_caverns', 'ch6-caverns');
    await cdp.eval('ayui.vn.runLabel("ch6_vos_leaves"), true');
    await free();
    await cdp.eval('placeAt(16, 22, "right"), true');
    await sleep(600);
    await shot('ch6-gate.png');
    await cdp.eval('ayui.field.toggle(ayui.field.objs.find(o => o.id === "l")), ayui.field.toggle(ayui.field.objs.find(o => o.id === "j")), true');
    await enemy('e', 'ch6-clones');
    await talk(22, 4, 'up', 'ch6-charge', undefined, true);
    await talk(33, 4, 'up');
    await cdp.eval('placeAt(42, 7, "up"), ayui.field.interact(), true');
    await battle('ch6-bok', 'v => v.mode === "ask"');
    await line('ayui.vn.story.vn.cg === "bok_gate" && typed()', 'ch6-bok-gate');
    await line('ayui.vn.story.pc.label === "ch6_hall" && ayui.vn.line && ayui.vn.line.who === "tholme" && typed()', 'ch6-hall');
    await map('vos_mind', 'ch6-mind');
    await talk(10, 20, 'up', 'ch6-medallion', undefined, true);
    await talk(28, 21, 'up', 'ch6-sanctum', undefined, true);
    await talk(24, 12, 'up', 'ch6-balcony', undefined, true);
    await talk(14, 4, 'up', 'ch6-kiffu', undefined, true);
    await free();
    await cdp.eval('placeAt(30, 11, "up"), true');
    await sleep(600);
    await shot('ch6-mind-lights.png');
    await cdp.eval('ayui.vn.runLabel("ch6_shadows"), true');
    await battle('ch6-shadows', 'v => (v.b.turns.aayla || 0) >= 3 && v.mode === "cmd"');
    await line('ayui.vn.story.vn.cg === "hand_dark" && typed()', 'ch6-hand');
    if (!(await cdp.eval('vnTo(() => !!ayui.card, 600)'))) throw new Error('no end card after chapter 6');
    await sleep(300);
    await shot('ch6-end.png');
    log.push('end of chapter 6: ' + JSON.stringify(await cdp.eval('({ level: ayui.state.party[0].level, ranks: ["vos", "tholme", "bly", "kit"].map(id => Aayla98.Bonds.rank(ayui.state, id)), letgo: Aayla98.Bonds.get(ayui.state, "vos").letgo, deflected: !!ayui.state.flags.honoghr_deflected, held: ayui.state.flags.duel_honoghr_turns, party: ayui.state.party.map(m => m.id) })')));
  },
  async ch7(cdp, out, log) {
    const { shot, battle, free, talk, enemy, respite } = await storyKit(cdp, out, log, 'ch7_start', ['bly', 'ekria', 'kit']);
    const map = async (id, name) => {
      if (!(await cdp.eval(`vnTo(() => ayui.field && ayui.field.map.id === "${id}" && !ayui.vn.active() && !ayui.overlay, 600)`))) throw new Error('no map ' + id);
      await sleep(800);
      await shot(name + '.png');
    };
    const line = async (test, name, max) => {
      if (!(await cdp.eval(`vnTo(() => ${test}, ${max || 300})`))) throw new Error('no scene ' + name);
      await sleep(200);
      await shot(name + '.png');
    };
    await battle('ch7-spar', 'v => (v.b.turns.aayla || 0) >= 3 && v.mode === "cmd"');
    await line('ayui.vn.story.vn.cg === "sparring" && typed()', 'ch7-sparring');
    await line('ayui.vn.line && ayui.vn.line.who === "ekria" && typed()', 'ch7-ekria');
    await line('!!ayui.vn.choice && ayui.vn.story.pc.label === "ch7_yoda"', 'ch7-yoda');
    await line('!!ayui.vn.choice && ayui.vn.story.pc.label === "ch7_decide"', 'ch7-decide');
    await map('endor_forest', 'ch7-endor');
    await free();
    await cdp.eval('placeAt(29, 5, "up"), ayui.field.interact(), true');
    await line('ayui.vn.line && ayui.vn.line.who === "droid" && ayui.vn.story.pc.label === "ch7_droid" && typed()', 'ch7-droid');
    await line('ayui.vn.line && ayui.vn.line.who === "droid" && ayui.vn.story.pc.label === "ch7_village" && typed()', 'ch7-village', 400);
    await map('endor_mountain', 'ch7-mountain');
    await cdp.eval('ayui.vn.runLabel("ch7_climb_2"), true');
    await line('ayui.vn.line && ayui.vn.line.who === "droid" && typed()', 'ch7-climb');
    await free();
    await cdp.eval('ayui.vn.runLabel("ch7_beast"), true');
    await battle('ch7-beast', 'v => v.b.under && v.mode === "cmd"');
    await line('ayui.vn.story.vn.cg === "forest_spirit" && typed()', 'ch7-forest-spirit');
    await map('felucia_jungle', 'ch7-jungle');
    await enemy('a', 'ch7-acklay');
    await talk(8, 11, 'up', 'ch7-cell', undefined, true);
    await free();
    await cdp.eval('placeAt(22, 14, "up"), ayui.field.interact(), true');
    await battle('ch7-hill');
    await line('ayui.vn.story.vn.cg === "bravest" && typed()', 'ch7-bravest');
    await talk(30, 14, 'up');
    await battle('ch7-turrets');
    await free();
    await cdp.eval('placeAt(36, 13, "up"), ayui.field.interact(), true');
    await battle('ch7-turrets-b');
    await free();
    await cdp.eval('ayui.vn.runLabel("ch7_jungle_end"), true');
    await map('nigkoe_prison', 'ch7-nigkoe');
    await enemy('g', 'ch7-gossam');
    await talk(3, 14, 'up', 'ch7-cells', undefined, true);
    await free();
    await cdp.eval('ayui.vn.runLabel("ch7_legion"), true');
    await line('ayui.vn.line && ayui.vn.line.who === "bly" && ayui.vn.story.pc.label === "ch7_legion" && typed()', 'ch7-legion');
    await free();
    await free();
    await cdp.eval('placeAt(20, 4, "up"), ayui.field.interact(), true');
    await line('ayui.vn.line && ayui.vn.story.pc.label === "ch7_roof" && typed()', 'ch7-roof');
    await battle('ch7-guards');
    if (!(await cdp.eval('vnTo(() => !!ayui.flight, 400)'))) throw new Error('no bike chase');
    await cdp.eval('ayui.flight.key("Enter"), true');
    await sleep(4000);
    await shot('ch7-bikes.png');
    await line('ayui.vn.story.vn.cg === "waterfall" && typed()', 'ch7-waterfall', 600);
    await map('kwayteow_water', 'ch7-water');
    await cdp.eval('ayui.vn.runLabel("ch7_base"), true');
    await line('ayui.vn.line && ayui.vn.line.who === "bly" && ayui.vn.story.pc.label === "ch7_base" && typed()', 'ch7-base');
    await map('kwayteow_escape', 'ch7-escape');
    await cdp.eval('ayui.vn.runLabel("ch7_escape_out"), true');
    await line('ayui.vn.line && ayui.vn.line.who === "mace" && typed()', 'ch7-report');
    await respite('ch7-p10', ['bond:bly', 'bond:ekria', 'meditate']);
    await battle('ch7-niango', 'v => (v.b.turns.aayla || 0) >= 2 && v.mode === "cmd"');
    await line('ayui.vn.story.vn.cg === "bird" && typed()', 'ch7-bird');
    await line('ayui.vn.line && ayui.vn.line.who === "bly_thinks" && typed()', 'ch7-order');
    if (await cdp.eval('vnTo(() => !!ayui.vn.choice && ayui.vn.story.pc.label === "ch7_turn", 300)')) {
      await sleep(1200);
      await shot('ch7-turn.png');
      await cdp.eval('ayui.vn.pick(1), true');
    }
    await line('ayui.vn.story.vn.cg === "end_felucia" && typed()', 'ch7-end-felucia', 400);
    await line('ayui.vn.story.vn.cg === "legacy" && typed()', 'ch7-legacy', 400);
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.CreditsScreen, 600)'))) throw new Error('no credits after the canon ending');
    await sleep(2500);
    await shot('ch7-credits.png');
    await cdp.eval('ayui.overlay.t = 30, true');
    await sleep(300);
    await shot('ch7-credits-mid.png');
    log.push('end of chapter 7: ' + JSON.stringify(await cdp.eval('({ ending: ayui.state.flags.ending, level: ayui.state.party[0].level, ranks: ["bly", "ekria", "kit"].map(id => Aayla98.Bonds.rank(ayui.state, id)), endor: !!ayui.state.flags.endor, heart: !!ayui.state.flags.heart_given })')));
    await cdp.eval('ayui.overlay.key("Escape"), true');
    if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.TitleScreen, 100)'))) throw new Error('the credits do not return to the title');
  },
  async endings(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    for (const [name, setup, pick] of [['other', 'ayui.state.bonds.bly.rank = 5; ayui.state.dark = 10;', 0], ['dark', 'ayui.state.dark = 80;', null]]) {
      await cdp.open('/aayla98.html?label=ch7_start');
      await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
      await helpers(cdp);
      await cdp.eval(`(() => { ${setup} ayui.overlay = null; ayui.battle = null; ayui.vn.runLabel("ch7_bird"); return true; })()`);
      if (pick !== null) {
        if (!(await cdp.eval('vnTo(() => !!ayui.vn.choice && ayui.vn.story.pc.label === "ch7_turn", 300)'))) throw new Error('no timed choice for ' + name);
        await sleep(600);
        await shot('endings-' + name + '-turn.png');
        await cdp.eval(`ayui.vn.pick(${pick}), true`);
      }
      if (!(await cdp.eval(`vnTo(() => ayui.vn.story.vn.cg === "end_${name}" && typed(), 400)`))) throw new Error('no CG for the ending ' + name);
      await sleep(200);
      await shot('endings-' + name + '.png');
      if (!(await cdp.eval('vnTo(() => ayui.overlay instanceof Aayla98.CreditsScreen, 400)'))) throw new Error('no credits after ' + name);
      await sleep(1500);
      await shot('endings-' + name + '-credits.png');
      log.push(name + ': ' + JSON.stringify(await cdp.eval('({ ending: ayui.state.flags.ending })')));
    }
    await cdp.open('/aayla98.html?label=ch7_start');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await helpers(cdp);
    await cdp.eval('(() => { ayui.overlay = null; ayui.battle = null; ayui.vn.runLabel("ch7_turn"); return true; })()');
    await cdp.eval('vnTo(() => !!ayui.vn.choice, 100)');
    await sleep(5800);
    log.push('timed choice after 5.8 s: ' + JSON.stringify(await cdp.eval('({ label: ayui.vn.story.pc.label, choice: !!ayui.vn.choice })')));
    if (await cdp.eval('!!ayui.vn.choice')) throw new Error('the timed choice did not run out');
  },
  async screens(cdp, out, log) {
    const shot = name => cdp.shot(path.join(out, name), '.ay-canvas');
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.vn && ayui.frames > 3');
    await cdp.eval('Object.keys(localStorage).filter(k => k.startsWith("aayla98_")).forEach(k => localStorage.removeItem(k)), true');
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.overlay instanceof Aayla98.TitleScreen && ayui.frames > 3');
    await helpers(cdp);
    await shot('screens-title-new.png');
    const items = await cdp.eval('ayui.overlay.items.map(i => i.label + (i.on ? "" : " (нет)"))');
    log.push('title: ' + items.join(', '));
    if (await cdp.eval('ayui.overlay.items.find(i => i.id === "continue").on')) throw new Error('continue is open without saves');
    await cdp.eval('ayui.startAt("ch1_start"), true');
    await cdp.eval('vnTo(() => ayui.field && !ayui.vn.active(), 400)');
    await cdp.eval('placeAt(23, 15, "left"), true');
    await sleep(400);
    await cdp.key('Escape', 'Escape', 27);
    await sleep(200);
    const menu = await cdp.eval('[...document.querySelectorAll(".ay-btn")].map(b => b.textContent)');
    log.push('pause menu: ' + menu.join(', '));
    if (!menu.includes('Сохранить') || !menu.includes('Память')) throw new Error('the pause menu has no save or memory');
    await cdp.eval('[...document.querySelectorAll(".ay-btn")].find(b => b.textContent === "Сохранить").click(), true');
    await sleep(300);
    await shot('screens-save.png');
    await cdp.key('Enter', 'Enter', 13);
    await sleep(300);
    const before = await cdp.eval('(() => { const raw = localStorage.getItem("aayla98_slot_1") || ""; const S = raw ? JSON.parse(raw).S : {}; return { hash: Aayla98.Save.hash(Object.assign({}, S, { time: 0 })), map: ayui.field.map.id, x: ayui.field.p.x, y: ayui.field.p.y, slot: !!raw, size: raw.length }; })()');
    log.push('saved: ' + JSON.stringify(before));
    if (!before.slot || before.size > 61440) throw new Error('slot 1 was not written within 60 KB');
    await cdp.key('F5', 'F5', 116);
    await sleep(300);
    await shot('screens-quick.png');
    await cdp.eval('ayui.state.memory = [1, 2, 4], ayui.openMemory(), true');
    await sleep(300);
    await shot('screens-memory.png');
    await cdp.key('ArrowRight', 'ArrowRight', 39);
    await cdp.key('ArrowRight', 'ArrowRight', 39);
    await sleep(200);
    await shot('screens-memory-2.png');
    await cdp.key('Escape', 'Escape', 27);
    await cdp.eval('ayui.openSettings(), true');
    await sleep(200);
    await shot('screens-settings.png');
    await cdp.key('Escape', 'Escape', 27);
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.overlay instanceof Aayla98.TitleScreen && ayui.frames > 3');
    await helpers(cdp);
    await sleep(400);
    await shot('screens-title-continue.png');
    await cdp.eval('ayui.overlay.pick(2), true');
    await sleep(300);
    await shot('screens-load.png');
    const row = await cdp.eval('ayui.overlay.rows.findIndex(r => r.key === "aayla98_slot_1")');
    await cdp.eval(`ayui.overlay.sel = ${row}, true`);
    await cdp.key('Enter', 'Enter', 13);
    await sleep(500);
    const after = await cdp.eval('({ hash: Aayla98.Save.hash(Object.assign({}, ayui.state, { time: 0 })), map: ayui.field && ayui.field.map.id, x: ayui.field && ayui.field.p.x, y: ayui.field && ayui.field.p.y })');
    log.push('loaded: ' + JSON.stringify(after));
    if (after.map !== before.map || after.x !== before.x || after.y !== before.y) throw new Error('loading did not return Aayla to the same place');
    if (after.hash !== before.hash) throw new Error('the loaded state differs from the saved one');
    await shot('screens-loaded.png');
  },
  async leaks(cdp, out, log) {
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.frames > 2');
    const r = await cdp.eval(`(async () => {
      const A = Aayla98, before = { ...A.live };
      let peak = 0;
      for (let i = 0; i < 10; i++) {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;left:0;top:0;width:640px;height:480px';
        document.body.appendChild(el);
        const ui = new A.UI(el, { isActive: () => true });
        if (ui.audio()) peak = Math.max(peak, A.live.audio);
        await new Promise(r => setTimeout(r, 60));
        ui.destroy();
        el.remove();
      }
      await new Promise(r => setTimeout(r, 200));
      return { before, after: { ...A.live }, peak };
    })()`);
    log.push('leaks: ' + JSON.stringify(r));
    for (const k of Object.keys(r.before)) if (r.after[k] !== r.before[k]) throw new Error('leak in ' + k);
    if (r.peak !== r.before.audio + 1) throw new Error('audio context was not created');
  },
  async window(cdp, out, log) {
    await cdp.open('/index.html');
    await cdp.until('window.winManager && window.appAayla98 && document.querySelector("#desktop")', 60000);
    await sleep(8000);
    const r = await cdp.eval(`(async () => {
      const A = Aayla98, wm = winManager, before = { ...A.live };
      let peak = 0;
      for (let i = 0; i < 10; i++) {
        appAayla98.open();
        await new Promise(r => setTimeout(r, 120));
        if (!wm.windows.has('app_aayla98') || !appAayla98.ui) return { fail: 'not opened ' + i };
        if (appAayla98.ui.audio()) peak = Math.max(peak, A.live.audio);
        wm.closeWindow('app_aayla98');
        await new Promise(r => setTimeout(r, 400));
      }
      appAayla98.open();
      await new Promise(r => setTimeout(r, 300));
      return { before, after: { ...A.live }, peak, open: wm.windows.has('app_aayla98'), view: appAayla98.ui.screen };
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
  const out = path.resolve(args.find(a => a.includes('/') || a.includes('\\')) || path.join(os.tmpdir(), 'aayla98-shots'));
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
