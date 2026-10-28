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

const SCENES = {
  async boot(cdp, out, log) {
    await cdp.open('/aayla98.html');
    await cdp.until('window.ayui && ayui.frames > 5');
    await frames(cdp, 3);
    log.push('boot: ' + JSON.stringify(await cdp.eval('({ frames: ayui.frames, ticks: ayui.ticks, view: ayui.screen, live: Aayla98.live })')));
    await cdp.shot(path.join(out, 'boot.png'), '.ay-canvas');
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
    await cdp.eval('localStorage.removeItem("aayla98_album"), ayui.vn.read.clear(), ayui.vn.restart(), true');
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
    await cdp.eval('ayui.vn.auto = false, ayui.field = null, ayui.vn.restart(), true');
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
    await cdp.eval('localStorage.removeItem("aayla98_album"), ayui.vn.read.clear(), ayui.vn.restart(), true');
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
    await cdp.eval('localStorage.removeItem("aayla98_album"), ayui.vn.read.clear(), ayui.vn.restart(), true');
    await cdp.eval(`(() => {
      window.pause = ms => new Promise(r => setTimeout(r, ms));
      window.typed = () => { const l = ayui.vn.line; return !!l && l.shown >= l.total; };
      window.vnTo = async (pred, max) => {
        for (let i = 0; i < (max || 600); i++) {
          if (pred()) return true;
          const v = ayui.vn;
          if (v.choice) v.pick(v.choice.index);
          else if (v.active()) v.key('Enter');
          await pause(20);
        }
        return pred();
      };
      window.placeAt = (x, y, dir) => {
        const f = ayui.field;
        f.p.x = x * 16 + 8;
        f.p.y = y * 16 + 14;
        f.p.dir = dir;
        f.trail = [];
        for (const fl of f.followers) { fl.x = f.p.x; fl.y = f.p.y + 2; }
      };
      window.autoFight = async () => {
        const v = ayui.battle;
        ayui.keys.add('Enter');
        for (let n = 0; n < 3000 && v.mode !== 'result' && !v.done; n++) {
          if (v.mode === 'intro') v.introT = 0;
          if (v.mode === 'cmd') {
            const h = v.hero(), cmds = v.b.commands(h), can = id => (cmds.find(c => c.id === id) || {}).enabled;
            const front = v.b.inRow('front'), all = v.b.enemies();
            if (can('brace')) v.commit('brace');
            else if (front.length && can('blade')) v.commit('blade', front[0].id);
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
    await cdp.until('ayui.card && ayui.card.kind === "end"', 5000);
    await shot('prologue-end.png');
    const fin = await cdp.eval('({ party: ayui.state.party.map(m => m.id + ":" + m.level + ":" + (m.skills || []).length), forgot: ayui.state.flags.forgot, asante: ayui.state.flags.asante_joined, tone: ayui.state.flags.pol_tone })');
    log.push('end: ' + JSON.stringify(fin));
    if (fin.party.join() !== 'aayla:1:0' || !fin.forgot) throw new Error('the prologue did not reset Aayla');
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
