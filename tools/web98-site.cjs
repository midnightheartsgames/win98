const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { stamp } = require('./web98-stamp.cjs');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'web98-site');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const W = 1024, H = 768;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadCatalog() {
  const sandbox = { localStorage: { getItem: () => null, setItem() {} }, console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/game-manager.js'), 'utf8'), sandbox);
  return sandbox.window.gameManager.catalog;
}

const shotFile = (g, n) => path.join(ROOT, 'content/steam', `${g.id}-${n}.jpg`);

function listGames(catalog) {
  return Object.values(catalog)
    .filter(g => g.steam && g.genre && Array.isArray(g.shots) && g.shots.length >= 2)
    .filter(g => [1, 2].every(n => fs.existsSync(shotFile(g, n))));
}

const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function plural(n, one, few, many) {
  const d10 = n % 10, d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few;
  return many;
}

const gamesNoun = n => plural(n, 'игра', 'игры', 'игр');
const demosNoun = n => plural(n, 'демоверсия', 'демоверсии', 'демоверсий');

const LEVELS = {
  purple: { short: 'Готово, обновляется', long: 'Готово полностью, будет обновляться' },
  green: { short: 'Готово полностью', long: 'Полностью играбельно' },
  blue: { short: 'Порт оригинала', long: 'Полноценный порт настоящей игры' },
  lime: { short: 'Готово на 80–95%', long: 'Почти готово, примерно на 80–95%' },
  yellow: { short: 'Готово на 40–70%', long: 'Играбельно, но есть недоделки, готово примерно на 40–70%' },
  orange: { short: 'Готово на 10–30%', long: 'Нужна крупная доработка, готово примерно на 10–30%' },
  red: { short: 'Переделка с нуля', long: 'Неиграбельно, нужна переделка с нуля' }
};

const READINESS = {
  purple: ['hsr98'],
  red: [],
  orange: ['diablo2', 'gta90'],
  yellow: ['wolf3d', 'diablo', 'doom', 'lol', 'avatar98', 'cop98', 'ow98', 'gtann', 'dota', 'kirill98'],
  lime: ['serioussam', 'forza', 'quake3', 'bttf', 'catniss'],
  green: ['stalker', 'sammax', 'sammax102', 'sammax103', 'sammax104', 'sammax105', 'sammax106', 'sammax201'],
  blue: ['legion', 'anotherwar', 'fallout']
};

const levelOf = id => Object.keys(READINESS).find(level => READINESS[level].includes(id)) || null;
const levelRank = id => {
  const rank = Object.keys(LEVELS).indexOf(levelOf(id));
  return rank < 0 ? Object.keys(LEVELS).length : rank;
};

function syncGames() {
  const catalog = loadCatalog();
  const games = listGames(catalog).sort((a, b) => levelRank(a.id) - levelRank(b.id));
  const unrated = games.filter(g => !levelOf(g.id)).map(g => g.id);
  if (unrated.length) console.log(`no readiness level: ${unrated.join(', ')}`);
  const dir = path.join(SITE, 'img/games');
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set();
  for (const g of games) {
    for (const n of [1, 2]) {
      const name = `${g.id}-${n}.jpg`;
      keep.add(name);
      fs.copyFileSync(shotFile(g, n), path.join(dir, name));
    }
  }
  for (const name of fs.readdirSync(dir)) if (!keep.has(name)) fs.unlinkSync(path.join(dir, name));

  const tiles = games.map(g => {
    const level = levelOf(g.id);
    const mark = level ? `<span class="game-level">${LEVELS[level].short}</span>` : '';
    return `
        <li><a class="game${level ? ' is-' + level : ''}" href="img/games/${g.id}-1.jpg" data-id="${g.id}"><img src="img/games/${g.id}-1.jpg" alt="" width="640" height="480" loading="lazy" decoding="async"><span class="game-title">${escapeHtml(g.title)}</span><span class="game-genre">${escapeHtml(g.genre)}</span>${mark}</a></li>`;
  }).join('');
  const legend = Object.keys(LEVELS).filter(level => READINESS[level].some(id => games.some(g => g.id === id))).map(level => `
        <li class="is-${level}"><span class="game-level">${LEVELS[level].long}</span><span class="legend-count">${READINESS[level].filter(id => games.some(g => g.id === id)).length}</span></li>`).join('');
  const data = games.map(g => {
    const level = levelOf(g.id);
    return { id: g.id, title: g.title, subtitle: g.subtitle, genre: g.genre, tags: g.tags || [], shots: g.shots.slice(0, 2), desc: g.desc || '', level, levelText: level ? LEVELS[level].long : '' };
  });
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  const file = path.join(SITE, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/(<ul class="shelf" id="games">)[\s\S]*?(\n      <\/ul>)/, `$1${tiles}$2`);
  html = html.replace(/(<ul class="legend" id="legend">)[\s\S]*?(\n        <\/ul>)/, `$1${legend}$2`);
  html = html.replace(/(<script type="application\/json" id="games-data">)[\s\S]*?(<\/script>)/, `$1${json}$2`);
  const steamCount = games.length;
  const demoCount = Object.values(catalog).filter(g => g.cdDemo).length;
  html = html.replace(/(data-fill="games-n">)[^<]*/g, `$1${games.length}`);
  html = html.replace(/(data-fill="games">)[^<]*/g, `$1${games.length} ${gamesNoun(games.length)}`);
  html = html.replace(/(data-fill="steam-n">)[^<]*/g, `$1${steamCount}`);
  html = html.replace(/(data-fill="steam">)[^<]*/g, `$1${steamCount} ${gamesNoun(steamCount)}`);
  html = html.replace(/(data-fill="demos">)[^<]*/g, `$1${demoCount} ${demosNoun(demoCount)}`);
  fs.writeFileSync(file, html);
  console.log(`games: ${steamCount} (Steam), Igromania CD demos not listed: ${demoCount}`);
}

const STATE = JSON.stringify({
  purchased: ['winamp', 'steam', 'doom', 'hsr98', 'gtann', 'forza', 'sammax'],
  downloaded: ['winamp', 'steam', 'doom', 'hsr98', 'gtann', 'forza', 'sammax'],
  installed: ['minesweeper', 'winamp', 'steam', 'doom', 'hsr98', 'gtann', 'forza', 'sammax'],
  steamMigrated: true
});

const reset = `for (const id of [...window.winManager.windows.keys()]) window.winManager.closeWindow(id); window.taskbar.closeStartMenu(); window.appClippy.hideBalloon();`;
const maximizeLast = `const w = [...window.winManager.windows.values()].pop(); window.winManager.toggleMaximize(w.id);`;

const SCENES = [
  { name: 'desktop', js: `${reset}`, wait: 9000 },
  { name: 'ie-steam', js: `${reset} window.appIE.open('http://www.steampowered.com');`, wait: 2500 },
  { name: 'steam-games', js: `${reset} window.appSteam.open(); window.appSteam.openGames('hsr98'); window.appSteam.openDetails('gtann');`, wait: 2500 },
  { name: 'interpedia', js: `${reset} window.appIE.open('http://www.interpedia.org'); ${maximizeLast}`, wait: 2500 },
  { name: 'youvid', js: `${reset} window.appIE.open('http://www.youvid.com'); ${maximizeLast}`, wait: 3000 },
  { name: 'poligon', js: `${reset} window.appIE.open('http://www.poligon3d.ru'); ${maximizeLast}`, wait: 3000, also: { name: 'clippy', clip: { x: 756, y: 392, width: 268, height: 344 } } },
  { name: 'netscape', js: `${reset} window.appNetscape.open('https://news.ycombinator.com'); ${maximizeLast}`, wait: 15000 },
  { name: 'icq', js: `${reset} window.appRunDialog.executeCommand('icq');`, wait: 2000, clip: { x: 50, y: 40, width: 242, height: 480 } },
  { name: 'winamp', js: `${reset} window.appRunDialog.executeCommand('winamp');`, wait: 2000, clip: { x: 50, y: 40, width: 382, height: 342 } }
];

async function captureShots(only) {
  const out = path.join(SITE, 'img');
  fs.mkdirSync(out, { recursive: true });
  const sport = 8200 + Math.floor(Math.random() * 700), dport = 9500 + Math.floor(Math.random() * 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'web98-site-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${profile}`, `--window-size=${W},${H}`, '--mute-audio', '--no-first-run', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
  const cleanup = async () => {
    try {
      const v = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const bws = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => bws.addEventListener('open', r, { once: true }));
      bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(300);
    } catch (e) { }
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
    });
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalJs = async expr => {
      const r = await send('Runtime.evaluate', { expression: `(() => { ${expr} })()`, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception ? r.result.exceptionDetails.exception.description : r.result.exceptionDetails.text);
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    const shot = async (name, clip) => {
      const r = await send('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: 1 } } : { format: 'png' });
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.result.data, 'base64'));
      console.log('shot', name);
    };
    const wanted = name => !only.length || only.includes(name);
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('win98_game_state', ${JSON.stringify(STATE)}); } catch (e) {}` });
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/` });
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      if (await evalJs('return !!(window.appIE && window.winManager && document.querySelector(".taskbar") && window.gameManager && window.appClippy);')) break;
    }
    await sleep(3000);
    for (const s of SCENES) {
      const shots = [{ name: s.name, clip: s.clip }].concat(s.also ? [s.also] : []).filter(x => wanted(x.name));
      if (!shots.length) continue;
      await evalJs(s.js);
      await sleep(s.wait);
      for (const x of shots) await shot(x.name, x.clip);
    }
    console.log('errors:', errors.length ? errors.slice(0, 10) : 'none');
  } finally {
    await cleanup();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--shots') await captureShots(args.slice(1));
  syncGames();
  stamp();
}

main().catch(e => { console.error(e); process.exit(1); });
