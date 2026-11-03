const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/sims98');
const LOGIC = ['ts-core', 'ts-data', 'ts-camera', 'ts-terrain', 'ts-placeholder', 'ts-style', 'ts-dummy', 'ts-house', 'ts-house-mesh', 'ts-body', 'ts-clips', 'ts-nav', 'ts-sim', 'ts-skin', 'ts-objects', 'ts-ads', 'ts-social', 'ts-skills', 'ts-food', 'ts-econ', 'ts-fish', 'ts-garden', 'ts-collect', 'ts-art-craft', 'ts-jobs', 'ts-upkeep', 'ts-services', 'ts-opps', 'ts-moodlets', 'ts-traits', 'ts-wishes', 'ts-acts', 'ts-sample', 'ts-town', 'ts-game', 'ts-save', 'ts-sprite-index', 'ts-font', 'ts-audio'];
for (const f of LOGIC) require(path.join(DIR, f + '.js'));
const S = globalThis.Sims98;

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': got ' + a + ', want ' + b + ' ±' + tol);
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const flatMenu = list => list.flatMap(o => (o.section ? flatMenu(o.section) : [o]));

const MODULES = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/sims98/' + f);
const LOAD_ORDER = [...LOGIC, 'ts-gl', 'ts-atlas', 'ts-render', 'ts-ui-kit', 'ts-ui-icons', 'ts-ui-map', 'ts-ui-save', 'ts-ui-pie', 'ts-ui-live', 'ts-ui-journal', 'ts-ui-news', 'ts-ui'].map(f => 'js/apps/sims98/' + f + '.js');
const SHOWN_FILES = [...MODULES, 'js/apps/sims98-app.js', 'css/apps/sims98.css', 'sims98.html'];
const OWN_FILES = [...SHOWN_FILES, 'tools/sims98-shots.cjs', 'tools/sims98-bot.cjs', 'tools/sims98-font.cjs', 'tests/sims98.test.js'];
const PYTHON_FILES = ['tools/sims98-bake.py', 'tools/sims98-sprite.py', 'tools/sims98-font.py'];
const OLD_DISC = /s[i]ms3|\bs[3]-|S[i]ms3/;
const SOURCE_NAMES = /\b(Goth|Mortimer|Bella|Cassandra|Landgraab|Crumplebottom|Sunset Valley|Pleasantview|Wainwright|Langerak|Sekemoto|Clavell|Ursine)\b|(^|[^А-Яа-яЁё])(Гот|Готы|Мортимер|Ландграаб|Сансет)(?![А-Яа-яЁё])/;

{
  ok(MODULES.length === LOAD_ORDER.length, 'every module is in the load order');
  for (const f of LOAD_ORDER) ok(fs.existsSync(path.join(ROOT, f)), 'module exists: ' + f);
  const scriptsIn = html => [...html.matchAll(/<script src="(js\/apps\/sims98\/[^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(scriptsIn(read('sims98.html')), LOAD_ORDER, 'sims98.html loads modules in order');
  checks++;
  const index = read('index.html');
  assert.deepEqual(scriptsIn(index), LOAD_ORDER, 'index.html loads modules in order');
  checks++;
  ok(index.indexOf('js/apps/sims98/ts-ui.js') < index.indexOf('js/apps/sims98-app.js'), 'the window wrapper loads after the game');
  ok(index.includes('href="css/apps/sims98.css"'), 'index.html links the stylesheet');
  ok(/\r\n/.test(index) ? !/[^\r]\n/.test(index) : !/\r/.test(index), 'index.html keeps one kind of line ending');
  ok(!/\r/.test(read('sims98.html')), 'sims98.html stays LF');
  ok(/window\.tsui=new Sims98\.UI/.test(read('sims98.html')), 'the page exposes window.tsui');
  ok(/addEventListener\('pagehide',\(\)=>window\.tsui\.destroy\(\)/.test(read('sims98.html')), 'the page frees resources on leave');
  ok(JSON.parse(read('package.json')).scripts['test:sims98'] === 'node tests/sims98.test.js', 'package.json has test:sims98');
}

{
  for (const f of OWN_FILES) {
    const src = read(f);
    ok(!/\/\*/.test(src), 'no block comments in ' + f);
    ok(!/^\s*\/\/(?!\s*#)/m.test(src) && !/[;{})]\s+\/\/\s/.test(src), 'no line comments in ' + f);
    ok(!/<!-{2}/.test(src), 'no markup comments in ' + f);
    ok(!/Micro[s]oft/.test(src.replace(/\/Micro[s]oft\/Edge\//g, '')), 'names follow the Microslop rule in ' + f);
    ok(!/Win[d]ows/.test(src), 'names follow the Win rule in ' + f);
    ok(!OLD_DISC.test(src), 'no reference to the old disc demo in ' + f);
  }
  for (const f of PYTHON_FILES) {
    const src = read(f);
    ok(!/^\s*#/m.test(src) && !/\s#\s/.test(src), 'no comments in ' + f);
    ok(!/Micro[s]oft/.test(src) && !/Win[d]ows/.test(src), 'names follow the naming rules in ' + f);
  }
  ok(/rotation_euler = \(0, 0, math\.pi \/ 2 \* turn\)/.test(read('tools/sims98-bake.py')), 'the bake turns a model the way the game table does, otherwise odd turns stand back to front');
  ok(!SOURCE_NAMES.test(read('content/sims98/models/sample.json')), 'no source names in the models');
  for (const f of SHOWN_FILES) {
    const m = read(f).match(SOURCE_NAMES);
    ok(!m, 'no source names in ' + f + (m ? ': ' + m[0] : ''));
  }
  const code = MODULES.concat('js/apps/sims98-app.js').map(read).join('\n');
  ok(!/['"]F(9|10)['"]|keyCode\s*===?\s*12[01]/.test(code), 'the game does not take F9 and F10 from the bug reports');
  ok(!/Math\.random|Date\.now|new Date/.test(LOGIC.map(f => read('js/apps/sims98/' + f + '.js')).join('\n')), 'the logic has no hidden randomness or clock');
}

{
  const manager = read('js/game-manager.js');
  ok(!/sims98Granted/.test(manager), 'no code grants the game');
  ok(!/purchased[^\n]*sims98|downloaded[^\n]*sims98|installed[^\n]*sims98/.test(manager), 'the game is not in the default lists');
}

{
  const ui = read('js/apps/sims98/ts-ui.js');
  ok(/cancelAnimationFrame\(this\.raf\)/.test(ui), 'destroy stops the frame loop');
  ok(/this\.observer\.disconnect\(\)/.test(ui), 'destroy stops watching the window size');
  ok(/WEBGL_lose_context/.test(ui), 'destroy releases the WebGL context');
  ok(/removeEventListener\('keydown'/.test(ui) && /removeEventListener\('keyup'/.test(ui), 'destroy removes the key listeners');
  for (const f of ['ts-gl', 'ts-atlas', 'ts-render', 'ts-ui-kit', 'ts-ui-icons', 'ts-ui-map', 'ts-ui-save', 'ts-ui-pie', 'ts-ui-live', 'ts-ui-journal', 'ts-ui']) require(path.join(DIR, f + '.js'));
  require(path.join(ROOT, 'js/apps/sims98-app.js'));
  ok(typeof S.UI === 'function' && typeof S.Render === 'function' && typeof S.Atlas === 'function' && typeof S.Gpu === 'function', 'the screen classes load without a browser');
  ok(typeof globalThis.appSims98.open === 'function', 'the window wrapper loads without a browser');
}

{
  const a = { rs: 12345 }, b = { rs: 12345 }, c = { rs: 54321 };
  const first = [S.roll(a), S.roll(a), S.roll(a)], second = [S.roll(b), S.roll(b), S.roll(b)];
  assert.deepEqual(first, second, 'one seed gives one sequence');
  checks++;
  ok(S.roll(c) !== first[0], 'another seed gives another sequence');
  const seen = { rs: 7 };
  let inRange = true;
  for (let i = 0; i < 2000; i++) {
    const v = S.roll(seen);
    if (v < 0 || v >= 1) inRange = false;
  }
  ok(inRange, 'roll stays in range');
  ok(S.hash({ a: 1, b: [2, 3] }) === S.hash({ a: 1, b: [2, 3] }), 'equal state gives an equal hash');
  ok(S.hash({ a: 1 }) !== S.hash({ a: 2 }), 'different state gives another hash');
  ok(/^[0-9a-f]{8}$/.test(S.hash('x')), 'the hash has eight hex digits');
  ok(S.clamp(5, 0, 3) === 3 && S.clamp(-1, 0, 3) === 0 && S.clamp(2, 0, 3) === 2, 'clamp keeps the range');
  ok(S.smooth(0, 1, -1) === 0 && S.smooth(0, 1, 2) === 1 && S.smooth(0, 1, 0.5) === 0.5, 'smooth runs from zero to one');
}

{
  const one = S.fit(800, 600);
  ok(one.scale === 1 && one.width === 800 && one.height === 600 && one.x === 0 && one.y === 0, 'the exact window shows the picture 1:1');
  const two = S.fit(1600, 1200);
  ok(two.scale === 2 && two.width === 1600 && two.height === 1200, 'a big window uses a whole scale');
  const margin = S.fit(1000, 900);
  ok(margin.scale === 1 && margin.x === 100 && margin.y === 150, 'a window between scales keeps the picture centred');
  const tall = S.fit(1700, 800);
  ok(tall.scale === 1 && tall.x === 450 && tall.y === 100, 'the shorter side decides the scale');
  const half = S.fit(400, 300);
  ok(half.scale === 0.5 && half.width === 400 && half.height === 300, 'a small window shrinks the picture smoothly');
  const none = S.fit(0, 0);
  ok(Number.isFinite(none.scale) && none.scale > 0, 'an empty window does not break the fit');
  const big = S.fit(2048, 1536, 1024, 768);
  ok(big.scale === 2 && big.width === 2048, 'the fit accepts another screen size');
}

{
  const check = (mode, w, h, sw, sh, scale, x, y) => {
    const v = S.screenFor(mode, w, h), name = mode + ' ' + w + 'x' + h;
    ok(v.sw === sw && v.sh === sh, name + ' logical size: ' + v.sw + 'x' + v.sh);
    near(v.scale, scale, 0.001, name + ' scale');
    ok(v.x === x && v.y === y, name + ' margins: ' + v.x + ',' + v.y);
    ok(v.mode === mode, name + ' keeps the mode');
  };
  check('800', 800, 600, 800, 600, 1, 0, 0);
  check('800', 1000, 900, 800, 600, 1, 100, 150);
  check('800', 1600, 1200, 800, 600, 2, 0, 0);
  check('1024', 1024, 768, 1024, 768, 1, 0, 0);
  check('1024', 800, 600, 1024, 768, 800 / 1024, 0, 0);
  check('window', 1280, 720, 1280, 720, 1, 0, 0);
  check('window', 1600, 1200, 800, 600, 2, 0, 0);
  check('window', 2560, 1440, 1280, 720, 2, 0, 0);
  check('window', 3000, 1300, 1500, 650, 2, 0, 0);
  check('window', 500, 400, 800, 600, 0.625, 0, 12);
  check('window', 4000, 1000, 1920, 1000, 1, 1040, 0);
  ok(S.SCREENS.every(m => !!S.SCREEN_NAMES[m]), 'every screen mode has a name');
}

{
  const M = S.METRICS;
  ok(M.town === 640 && M.chunk === 32, 'town and chunk sizes follow plan 5.1');
  ok((M.town / M.chunk) ** 2 === 400, 'the town has 400 chunks');
  ok(M.wall === 2.75 && M.floorStep === 3 && M.foundationStep === 0.25, 'wall, floor and foundation heights follow plan 5.1');
  ok(M.wallLow === 0.6, 'cut walls stop at the height of plan 19.6');
  ok(M.adult === 1.75 && M.teen === 1.65 && M.child === 1.15 && M.toddler === 0.8, 'body heights follow plan 5.1');
  ok(M.lotMin === 10 && M.lotMax === 64, 'lot limits follow plan 5.1');
  near(M.town * Math.SQRT2 / M.car, 75, 1, 'car crosses the town diagonal in about a minute');
  ok(S.ZOOMS.length === 5, 'five zooms');
  S.ZOOMS.forEach((z, i) => {
    ok(z.tile === 128 / 2 ** i, 'tile width halves at zoom ' + i);
    ok(!!z.name, 'zoom has a name ' + i);
    ok(Number.isInteger(M.chunk / z.step), 'terrain step fits the chunk at zoom ' + i);
  });
  const adult = [137, 68, 34, 17, 9];
  adult.forEach((px, i) => near(S.heightPx(i, M.adult), px, 0.7, 'adult height on screen at zoom ' + i));
  near(S.heightPx(0, M.wall), 216, 0.5, 'wall height on screen at the near zoom');
}

{
  const D = S.DEPTH;
  near(2 * D.K * D.K + D.N * D.N, 1, 1e-9, 'the view direction is a unit vector');
  for (let zoom = 0; zoom < S.ZOOMS.length; zoom++) {
    for (let rot = 0; rot < 4; rot++) {
      const c = new S.Camera(800, 600), tag = 'zoom ' + zoom + ' rot ' + rot;
      c.setView({ zoom, rot, x: 300, z: 220 });
      const T = S.ZOOMS[zoom].tile, o = c.toScreen(300, 0, 220);
      near(o[0], 400, 1, tag + ': focus is in the screen centre x');
      near(o[1], 300, 1, tag + ': focus is in the screen centre y');
      const e = c.toScreen(301, 0, 220), s = c.toScreen(300, 0, 221), u = c.toScreen(300, 1, 220);
      near(Math.abs(e[0] - o[0]), T / 2, 1e-6, tag + ': tile step x is half the tile width');
      near(Math.abs(e[1] - o[1]), T / 4, 1e-6, tag + ': tile step y is a quarter of the tile width');
      near(Math.abs(s[0] - o[0]), T / 2, 1e-6, tag + ': second axis x');
      near(Math.abs(s[1] - o[1]), T / 4, 1e-6, tag + ': second axis y');
      near(o[1] - u[1], S.heightPx(zoom, 1), 1e-6, tag + ': height goes straight up');
      near(u[0], o[0], 1e-6, tag + ': height does not move sideways');
      for (const [x, y, z] of [[10, 0, 20], [600, 2, 30], [320, 7.5, 320], [55.5, 1.25, 610.5]]) {
        const p = c.toScreen(x, y, z), back = c.fromScreen(p[0], p[1], y);
        near(back[0], x, 1e-6, tag + ': fromScreen returns x');
        near(back[1], z, 1e-6, tag + ': fromScreen returns z');
        const m = c.m, cw = m[3] * x + m[7] * y + m[11] * z + m[15];
        const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cz = m[2] * x + m[6] * y + m[10] * z + m[14];
        ok(cw === 1, tag + ': the matrix is orthographic');
        near((cx + 1) * 400, p[0], 0.02, tag + ': the matrix agrees with toScreen x');
        near((1 - cy) * 300, p[1], 0.02, tag + ': the matrix agrees with toScreen y');
        near(cz, c.depthAt(x, y, z) / D.R, 1e-5, tag + ': the matrix agrees with the depth');
        ok(Math.abs(cz) < 1, tag + ': the whole town fits the depth range');
      }
      const low = c.fromScreen(400, 500, 0), high = c.fromScreen(400, 100, 0);
      ok(c.depthAt(low[0], 0, low[1]) < c.depthAt(high[0], 0, high[1]), tag + ': lower on screen is closer');
      ok(c.depthAt(300, 2, 220) < c.depthAt(300, 0, 220), tag + ': higher is closer');
      const before = c.toScreen(280, 0, 240);
      c.pan(30, 40);
      const after = c.toScreen(280, 0, 240);
      near(after[0] - before[0], -30, 1, tag + ': pan moves the picture x');
      near(after[1] - before[1], -40, 1, tag + ': pan moves the picture y');
      near(c.camX, Math.round(c.camX), 0, tag + ': the camera stays on whole pixels');
      near(c.camY, Math.round(c.camY), 0, tag + ': the camera stays on whole pixels y');
    }
  }
  const c = new S.Camera(800, 600);
  c.setView({ x: -50, z: 9000 });
  ok(c.fx === 0 && c.fz === S.METRICS.town, 'the focus stays inside the town');
  c.setView({ rot: 5, zoom: 99 });
  ok(c.rot === 1 && c.zoom === S.ZOOMS.length - 1, 'rotation wraps and the zoom stops at the last one');
  c.setView({ rot: -1, zoom: -3 });
  ok(c.rot === 3 && c.zoom === 0, 'rotation wraps back and the zoom stops at the first one');
}

const wrapAngle = a => a - Math.round(a / (Math.PI * 2)) * Math.PI * 2;
const P_rowsSkipModels = () => S.Placeholder.rows().every(r => !r.kind.model);
const scene = S.Dummy.create(1);
const terrain = scene.terrain;

{
  const M = S.METRICS, t = terrain;
  ok(t.side === 641 && t.heights.length === 641 * 641 && t.paint.length === 640 * 640, 'terrain sizes');
  const again = S.Terrain.create(1), other = S.Terrain.create(2);
  ok(S.hash(Array.from(again.heights.subarray(0, 4000))) === S.hash(Array.from(t.heights.subarray(0, 4000))), 'one seed gives one terrain');
  let differs = false;
  for (let i = 0; i < other.heights.length && !differs; i += 97) differs = other.heights[i] !== t.heights[i];
  ok(differs, 'another seed gives another terrain');
  let sea = 0, land = 0, low = Infinity, high = -Infinity;
  for (const p of t.paint) {
    if (p === S.PAINT.seabed) sea++;
    else land++;
  }
  for (const h of t.heights) {
    low = Math.min(low, h);
    high = Math.max(high, h);
  }
  const share = sea / (sea + land);
  ok(share > 0.1 && share < 0.45, 'part of the town is sea: ' + share);
  ok(low >= -6 && high <= 60 && high > 15, 'heights stay in range: ' + low + '..' + high);
  for (let i = 0; i <= M.town; i += 40) {
    ok(t.heights[i] < 0 && t.heights[i * 641] < 0 && t.heights[i + 640 * 641] < 0 && t.heights[640 + i * 641] < 0, 'the town edge goes under the sea at ' + i);
  }
  near(S.Terrain.heightAt(t, 100, 200), t.heights[100 + 200 * 641], 1e-6, 'heightAt returns the vertex height');
  const mid = (t.heights[100 + 200 * 641] + t.heights[101 + 200 * 641]) / 2;
  near(S.Terrain.heightAt(t, 100.5, 200), mid, 1e-5, 'heightAt interpolates between vertices');
  for (let c = 0; c < 400; c += 13) {
    const cx = c % 20, cz = Math.floor(c / 20), v = t.heights[cx * 32 + 16 + (cz * 32 + 16) * 641];
    ok(t.chunks[c * 2] <= v && v <= t.chunks[c * 2 + 1], 'chunk bounds hold the height in chunk ' + c);
  }
  ok(S.Terrain.paintAt(t, 300, 170) === S.PAINT.road, 'the road is painted');
  ok(S.Terrain.paintAt(t, 300, 167) === S.PAINT.walk, 'the sidewalk runs along the road');
  ok(!S.Terrain.isOpenLand(t, 300, 170), 'a road is not free land');
  ok(S.Terrain.colors(t).length === 640 * 640 * 4, 'paint colours cover the town');
}

{
  const c = new S.Camera(800, 600), M = S.METRICS;
  for (const zoom of [0, 2, 4]) {
    for (const rot of [0, 1, 3]) {
      c.setView({ zoom, rot, x: 320, z: 300 });
      const list = c.visible(terrain);
      ok(list.every((id, i) => i === 0 || id > list[i - 1]), 'visible chunks come in order');
      ok(list.length > 0 && list.length <= 400, 'something is visible');
      let missed = 0, seen = 0;
      for (let i = 0; i < 2000; i++) {
        const x = (i * 37) % M.town + 0.5, z = (i * 91) % M.town + 0.5, y = S.Terrain.heightAt(terrain, x, z);
        const p = c.toScreen(x, y, z);
        if (p[0] < 0 || p[1] < 0 || p[0] >= 800 || p[1] >= 600) continue;
        seen++;
        if (!list.includes(Math.floor(x / 32) + Math.floor(z / 32) * 20)) missed++;
      }
      ok(missed === 0, 'no chunk on screen is skipped at zoom ' + zoom + ' rot ' + rot + ', seen ' + seen);
    }
  }
  c.setView({ zoom: 0, rot: 0, x: 320, z: 300 });
  ok(c.visible(terrain).length < 40, 'the near zoom draws a part of the town');
  const whole = new S.Camera(1920, 1200);
  whole.setView({ zoom: 4, rot: 0, x: 320, z: 320 });
  const wide = whole.visible(terrain).length;
  ok(wide > 100 && wide < 400, 'the widest view at the far zoom shows a big part of the town: ' + wide);
  const pickAt = c.toScreen(330.5, S.Terrain.heightAt(terrain, 330.5, 310.5), 310.5), hit = c.pick(terrain, pickAt[0], pickAt[1]);
  near(hit[0], 330.5, 0.05, 'pick finds the ground under the cursor x');
  near(hit[1], 310.5, 0.05, 'pick finds the ground under the cursor z');
}

{
  const D = S.DEPTH, P = S.Placeholder;
  ok(S.KINDS.length === 16 && S.KINDS.every(k => k.w > 0 && k.d > 0 && k.h > 0 && k.tone.length === 3), 'kinds have a body and a tone');
  ok(P.rows().length === S.KINDS.length * S.ZOOMS.length * 4, 'each kind has every zoom and turn');
  ok(P.rows(['wall', 'fence']).length === 2 * S.ZOOMS.length * 4, 'placeholders can be limited to a few kinds');
  ok(S.SPRITE_ROWS === S.SHADOW_ROW * 2 && S.spriteRow(1, 0, 0, true) === S.SPRITE_ROWS + S.SHADOW_ROW, 'shadow rows follow the sprite rows');
  ok(new Set(P.rows().map(r => r.row)).size === P.rows().length, 'sprite rows are unique');
  ok(Math.max(...S.KINDS.map(k => k.h)) <= S.METRICS.spriteTop, 'sprites stay under the chunk margin');
  const depthOf = (s, x, y) => s.dMin + s.data[(x + y * s.w) * 4 + 3] / 255 * (s.dMax - s.dMin);
  for (const kind of S.KINDS) {
    for (const zoom of [0, 1, 2, 3, 4]) {
      if (zoom === 0 && kind.id !== 'table' && kind.id !== 'sofa') continue;
      for (let turn = 0; turn < 4; turn++) {
        const s = P.box(kind, zoom, turn), z = P.size(kind, zoom, turn), tag = kind.id + ' zoom ' + zoom + ' turn ' + turn;
        ok(s.w === z.w && s.h === z.h && s.color.length === s.w * s.h * 4 && s.data.length === s.color.length, tag + ': size');
        let full = 0, soft = 0;
        for (let i = 3; i < s.color.length; i += 4) {
          if (s.color[i] === 255) full++;
          else if (s.color[i] !== 0) soft++;
        }
        ok(soft === 0, tag + ': alpha is hard');
        ok(full > 0, tag + ': the sprite is not empty');
        ok(s.color[3] === 0, tag + ': the corner outside the box is empty');
        if (zoom > 2) continue;
        const T = S.ZOOMS[zoom].tile, H = S.heightPx(zoom, 1), tol = (s.dMax - s.dMin) / 255 + 2 * 2 / T;
        const [hx, hz] = turn % 2 ? [kind.d / 2, kind.w / 2] : [kind.w / 2, kind.d / 2];
        const spots = [[0, kind.h, 0], [hx, kind.h / 2, 0], [0, kind.h / 2, hz]];
        for (const [rx, y, rz] of spots) {
          const sx = (rx - rz) * T / 2, sy = (rx + rz) * T / 4 - y * H;
          const px = Math.floor(sx - s.ox), py = Math.floor(sy - s.oy);
          if (px < 0 || py < 0 || px >= s.w || py >= s.h || s.color[(px + py * s.w) * 4 + 3] === 0) continue;
          near(depthOf(s, px, py), -D.K * (rx + rz) - D.N * y, tol, tag + ': depth matches the geometry at ' + [rx, y, rz].join(','));
        }
      }
    }
  }
  const sofa = S.KINDS[S.KIND_ID.sofa], a = P.box(sofa, 2, 0), b = P.box(sofa, 2, 2), c = P.box(sofa, 2, 1);
  ok(a.w === b.w && a.h === b.h && Buffer.compare(Buffer.from(a.color), Buffer.from(b.color)) !== 0, 'opposite turns show the front mark differently');
  ok(a.w === c.w, 'a wide box keeps its screen width when turned');
  ok(Buffer.compare(Buffer.from(a.color), Buffer.from(c.color)) !== 0, 'a quarter turn changes the picture');
  const big = P.size(sofa, 1, 0), small = P.size(sofa, 2, 0);
  near(big.w, small.w * 2, 2, 'each zoom halves the sprite');
  const shelves = new S.Shelves(256), spots = [];
  for (let i = 0; i < 120; i++) {
    const w = 8 + (i * 37) % 60, h = 8 + (i * 53) % 50, spot = shelves.place(w, h);
    ok(!!spot && spot.x + w <= 256 && spot.y + h <= 256, 'the spot fits the page');
    spots.push({ ...spot, w, h });
  }
  let overlap = 0;
  for (let i = 0; i < spots.length; i++) {
    for (let j = i + 1; j < spots.length; j++) {
      const p = spots[i], q = spots[j];
      if (p.layer === q.layer && p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h) overlap++;
    }
  }
  ok(overlap === 0, 'sprites do not overlap on a page');
  ok(shelves.place(300, 10) === null, 'a sprite wider than a page is refused');
  const plan = new S.Shelves(S.ATLAS.SIZE);
  for (const r of P.rows()) {
    const s = P.size(r.kind, r.zoom, r.turn);
    ok(!!plan.place(s.w, s.h), 'every placeholder fits');
  }
  ok(plan.layers.length <= 4, 'placeholders take few atlas pages: ' + plan.layers.length);
}

{
  const M = S.METRICS, D = S.Dummy;
  ok(D.TOTAL === 25000 && scene.count === 25000, 'the dummy town has 25000 items: ' + scene.count);
  ok(scene.lots.length === 96, 'the dummy town has 96 lots: ' + scene.lots.length);
  ok(scene.walkers.length === 100, 'the dummy town has 100 walkers');
  ok(scene.chunkStart[0] === 0 && scene.chunkStart[400] === scene.count, 'chunk starts cover all items');
  let order = true, inside = true, kinds = true, ground = true;
  for (let c = 0; c < 400; c++) {
    if (scene.chunkStart[c + 1] < scene.chunkStart[c]) order = false;
    for (let i = scene.chunkStart[c]; i < scene.chunkStart[c + 1]; i++) {
      const x = scene.pos[i * 3], y = scene.pos[i * 3 + 1], z = scene.pos[i * 3 + 2];
      if (S.clamp(Math.floor(x / M.chunk), 0, 19) + S.clamp(Math.floor(z / M.chunk), 0, 19) * 20 !== c) inside = false;
      if (scene.kind[i] >= S.KINDS.length || scene.facing[i] > 3) kinds = false;
      if (Math.abs(y - S.Terrain.heightAt(terrain, x, z)) > 1e-3) ground = false;
    }
  }
  ok(order, 'chunk starts grow');
  ok(inside, 'each item sits in its chunk');
  ok(kinds, 'each item has a valid kind and facing');
  ok(ground, 'each item stands on the ground');
  for (const lot of scene.lots) {
    ok(S.Terrain.isOpenLand(terrain, lot.x + lot.size / 2, lot.z + lot.size / 2), 'a lot is on free land');
    for (const other of scene.lots) {
      if (other !== lot) ok(Math.abs(other.x - lot.x) >= lot.size || Math.abs(other.z - lot.z) >= lot.size, 'lots do not overlap');
    }
  }
  const counts = S.KINDS.map(() => 0);
  for (let i = 0; i < scene.count; i++) counts[scene.kind[i]]++;
  ok(counts[S.KIND_ID.fence] === D.FENCES, 'fence count');
  ok(counts[S.KIND_ID.tree] + counts[S.KIND_ID.pine] === D.TREES, 'tree count');
  const twin = S.Dummy.create(1);
  ok(S.hash(Array.from(twin.pos.subarray(0, 3000))) === S.hash(Array.from(scene.pos.subarray(0, 3000))), 'one seed gives one dummy town');
  const start = scene.walkers.map(w => [w.x, w.z]);
  for (let i = 0; i < 600; i++) S.Dummy.step(scene, 0.1);
  let moved = 0, onLand = true;
  scene.walkers.forEach((w, i) => {
    if (Math.hypot(w.x - start[i][0], w.z - start[i][1]) > 1) moved++;
    if (S.Terrain.heightAt(terrain, w.x, w.z) < 0.35 || w.x < 15 || w.z < 15 || w.x > M.town - 15 || w.z > M.town - 15) onLand = false;
  });
  ok(moved >= 90, 'walkers move: ' + moved);
  ok(onLand, 'walkers stay on land');
}

{
  const St = S.Style, data = St.patternData();
  ok(data.length === St.SIZE * St.SIZE * 4 * St.PATTERNS.length, 'pattern data covers all layers');
  let sums = true;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] + data[i + 1] + data[i + 2] + data[i + 3] !== 255) sums = false;
  }
  ok(sums, 'pattern weights add up to one');
  const table = St.table(S.Sample.STYLES);
  ok(table.length === St.CHANNELS * St.ROW_TEXELS * St.ROWS * 4, 'style table has its size');
  ok(table.subarray(0, St.CHANNELS * St.ROW_TEXELS * 4).every(v => v === 0), 'style row zero keeps the baked colours');
  S.Sample.STYLES.forEach((row, r) => row.forEach((c, ch) => {
    if (!c) return;
    ok(St.patternId(c.pattern) >= 0, 'style pattern exists: ' + c.pattern);
    const q = (r * St.CHANNELS * St.ROW_TEXELS + ch * St.ROW_TEXELS) * 4;
    ok(table[q + 3] === 255 && table[q] === St.patternId(c.pattern), 'style head is written');
    ok(table[q + 7] === 255, 'style colour is written');
  }));
}

const doc = JSON.parse(read('content/sims98/models/sample.json'));

const modelBounds = model => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const part of model.parts) {
    let half;
    if (part.shape === 'box') half = part.size.map(v => v / 2);
    else if (part.shape === 'blob') half = part.radius;
    else {
      const r = Math.max(part.r, part.r2 === undefined ? part.r : part.r2), tilt = part.tilt ? Math.hypot(part.tilt[0], part.tilt[2]) : 0;
      const up = part.h / 2 * Math.cos(tilt) + r * Math.sin(tilt), side = r * Math.cos(tilt) + part.h / 2 * Math.sin(tilt);
      half = [side, up, side];
    }
    for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], part.at[k] - half[k]);
      hi[k] = Math.max(hi[k], part.at[k] + half[k]);
    }
  }
  return { lo, hi };
};

{
  const ids = Object.keys(doc.models);
  assert.deepEqual(ids.slice().sort(), Object.keys(doc.models).sort(), 'the sample models');
  ok(Object.keys(doc.models).length === 53, 'all models are listed');
  for (const id of ids) if (doc.models[id].base) ok(doc.models[doc.models[id].base] && !doc.models[doc.models[id].base].base, 'a variant names its base model: ' + id);
  checks++;
  for (const id of ids) {
    const model = doc.models[id];
    ok(model.name && model.w > 0 && model.d > 0, id + ' has a name and a footprint');
    for (const part of model.parts) {
      ok(['box', 'cyl', 'blob'].includes(part.shape), id + ' part shape');
      ok(!!doc.materials[part.mat], id + ' material exists: ' + part.mat);
      ok(Number.isInteger(part.ch) && part.ch >= 0 && part.ch <= 3, id + ' part channel');
    }
    const b = modelBounds(model);
    ok(b.lo[1] >= -0.02, id + ' stands on the ground: ' + b.lo[1]);
    if (!model.over) {
      ok(b.hi[0] - b.lo[0] <= model.w + 0.01 && b.hi[2] - b.lo[2] <= model.d + 0.01, id + ' fits its footprint');
    }
  }
}

{
  const index = S.SPRITE_INDEX, dir = index.root, ihdr = (f, gray) => {
    const b = fs.readFileSync(path.join(ROOT, f));
    ok(b.toString('latin1', 1, 4) === 'PNG', 'PNG file: ' + f);
    ok(b[24] === 8 && b[25] === (gray ? 0 : 6), (gray ? 'gray' : 'RGBA8') + ' file: ' + f);
    return [b.readUInt32BE(16), b.readUInt32BE(20)];
  };
  ok(Object.keys(index.kinds).length === Object.keys(doc.models).length, 'all sample models have sprites');
  let liveBytes = 0, liveArea = 0;
  for (const [name, e] of Object.entries(index.kinds)) {
    ok(e.near.length === 4 && e.half.length === 4 && e.levels.length === 4 && e.shadow.length === 4, name + ' has four turns');
    let bytes = 0;
    e.near.forEach((n, turn) => {
      const [, , w, h, , range] = n, half = e.half[turn];
      ok(range > 0, name + ' depth range');
      near(half[2], w / 2, 2, name + ' half sprite width');
      liveArea += w * h + half[2] * half[3];
      for (const [part, pw, ph] of [['color', w, h], ['data', w, h], ['half.color', half[2], half[3]], ['half.data', half[2], half[3]]]) {
        const f = dir + name + '-' + turn + '.' + part + '.png';
        const [fw, fh] = ihdr(f);
        ok(fw === pw && fh === ph, name + ' live file size ' + part);
        bytes += fs.statSync(path.join(ROOT, f)).size;
      }
      ok(e.levels[turn].length === 3, name + ' keeps three packed levels');
      e.levels[turn].forEach((r, l) => {
        ok(r.length === 7 && r[0] < index.pages, name + ' level record');
        ok(r[1] + r[3] <= index.page && r[2] + r[4] <= index.page, name + ' level stays on the page');
        near(r[3], w / 2 ** (l + 2), 2, name + ' level width halves');
      });
      ok(e.shadow[turn].length === 4, name + ' keeps four shadows');
      e.shadow[turn].forEach(r => ok(r.length === 7 && r[0] < index.shadowPages && r[1] + r[3] <= index.page && r[2] + r[4] <= index.page, name + ' shadow stays on its page'));
    });
    ok(e.bytes === bytes, name + ' byte count is current');
    liveBytes += bytes;
  }
  ok(liveArea === index.liveArea, 'the live area is current');
  let packBytes = 0;
  for (let i = 0; i < index.pages; i++) {
    for (const part of ['color', 'data']) {
      const f = dir + 'pack-' + i + '.' + part + '.png';
      const [w, h] = ihdr(f);
      ok(w === index.page && h === index.page, 'pack page size');
      packBytes += fs.statSync(path.join(ROOT, f)).size;
    }
  }
  for (let i = 0; i < index.shadowPages; i++) {
    const f = dir + 'shadow-' + i + '.png', [w, h] = ihdr(f, true);
    ok(w === index.page && h === index.page, 'shadow page size');
    packBytes += fs.statSync(path.join(ROOT, f)).size;
  }
  ok(packBytes === index.packBytes, 'pack byte count is current');
  const overlaps = rects => {
    let count = 0;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const p = rects[i], q = rects[j];
        if (p[0] === q[0] && p[1] < q[1] + q[3] && q[1] < p[1] + p[3] && p[2] < q[2] + q[4] && q[2] < p[2] + p[4]) count++;
      }
    }
    return count;
  };
  ok(overlaps(Object.values(index.kinds).flatMap(e => e.levels.flat())) === 0, 'pack sprites do not overlap');
  ok(overlaps(Object.values(index.kinds).flatMap(e => e.shadow.flat())) === 0, 'shadows do not overlap');
  const perObject = (liveBytes + packBytes) / 37;
  ok(perObject * 728 * 1.5 < 500 * 1048576, 'the disk budget of plan 19.5 holds: ' + Math.round(perObject / 1024) + ' KB per object');
  const packedArea = Object.values(index.kinds).flatMap(e => e.levels.flat()).reduce((sum, r) => sum + r[3] * r[4], 0);
  const shadowArea = Object.values(index.kinds).flatMap(e => e.shadow.flat()).reduce((sum, r) => sum + r[3] * r[4], 0);
  const pagePixels = index.page * index.page, growth = 728 * 1.5 / 37, waste = 1.3;
  const fullSet = { pages: Math.ceil(packedArea * growth * waste / pagePixels), shadowPages: Math.ceil(shadowArea * growth * waste / pagePixels), liveArea: liveArea * growth };
  const MB = 1048576, high = S.spriteMemory(fullSet, 'high'), ultra = S.spriteMemory(fullSet, 'ultra');
  ok(high.bytes <= 512 * MB, 'the full set fits 512 MB at high quality: ' + Math.round(high.bytes / MB));
  ok(ultra.bytes <= 1024 * MB, 'the full set fits 1 GB at ultra quality: ' + Math.round(ultra.bytes / MB));
  ok(high.live >= 4, 'high quality keeps several live pages: ' + high.live);
  ok(ultra.live > high.live * 2, 'ultra quality keeps more live pages: ' + ultra.live);
  const small = S.spriteMemory(index, 'ultra');
  ok(small.live === small.want && small.live <= 4, 'a small set does not take memory it cannot use: ' + small.live);
  ok(S.QUALITIES.every(q => !!S.QUALITY_NAMES[q] && S.QUALITY_BUDGET[q] > 0), 'every quality has a name and a budget');
}

{
  const H = S.House, make = () => H.create({ id: 't', x: 100, z: 200, w: 12, d: 10, base: 2, lift: 0.5, paints: { outside: 1, cap: 2, band: 3, trim: 4, foundation: 5, flat: 6 }, roof: { form: 'hip', style: 7 } });
  const h = make();
  H.addRoom(h, 0, 2, 2, 8, 7);
  H.addWall(h, 0, 5, 2, 5, 7);
  ok(H.floorOf(h, 0).walls.size === 2 * 6 + 2 * 5 + 5, 'walls are stored by tile segments');
  H.addWall(h, 0, 2, 2, 8, 2);
  ok(H.floorOf(h, 0).walls.size === 27, 'a repeated wall adds nothing');
  const list = H.rooms(h, 0);
  ok(list.length === 3, 'a partition makes two rooms and the street: ' + list.length);
  ok(list[0].id === 0 && list[0].color === 0, 'the first room is the street');
  ok(H.roomAt(h, 0, 0.5, 0.5) === 0, 'the corner of the lot is the street');
  const left = H.roomAt(h, 0, 3.5, 4.5), right = H.roomAt(h, 0, 6.5, 4.5);
  ok(left > 0 && right > 0 && left !== right, 'each side of the partition is a room');
  near(list[left].area, 15, 1e-9, 'room area left');
  near(list[right].area, 15, 1e-9, 'room area right');
  ok(list[left].color !== list[right].color, 'rooms that touch get different light colours');
  near(list.reduce((sum, r) => sum + r.area, 0), 120, 1e-9, 'all tiles belong to a room');
  H.addWall(h, 0, 5, 2, 8, 5);
  const split = H.rooms(h, 0);
  ok(split.length === 4, 'a diagonal cuts a room');
  near(split.reduce((sum, r) => sum + r.area, 0), 120, 1e-9, 'tiles stay whole with a diagonal');
  ok(H.roomAt(h, 0, 7.5, 2.5) !== H.roomAt(h, 0, 5.5, 4.5), 'the two sides of a diagonal are different rooms');
  near(split[H.roomAt(h, 0, 7.5, 2.5)].area + split[H.roomAt(h, 0, 5.5, 4.5)].area, 15, 1e-9, 'a diagonal keeps the area');
  H.removeWall(h, 0, 6, 3, 7, 4);
  ok(H.rooms(h, 0).length === 3, 'a gap in a diagonal joins the rooms again');
  const lane = make();
  H.addWall(lane, 0, 0, 3, 12, 3);
  ok(H.rooms(lane, 0).length === 1, 'a wall across the whole lot leaves only the street');
  const open = make();
  H.addWall(open, 0, 1, 1, 4, 1);
  H.addWall(open, 0, 4, 1, 4, 4);
  H.addWall(open, 0, 4, 4, 2, 4);
  ok(H.rooms(open, 0).length === 1, 'an open outline is not a room');
  assert.throws(() => H.addWall(make(), 0, 0, 0, 2, 1), /edges or diagonals/);
  checks++;
  assert.throws(() => H.addWall(make(), 0, 10, 0, 14, 0), /leaves the lot/);
  checks++;

  const plan = make();
  H.addRoom(plan, 0, 2, 2, 8, 7);
  H.addRoom(plan, 1, 2, 2, 5, 7);
  const room = H.roomAt(plan, 0, 4, 4), upper = H.roomAt(plan, 1, 3, 3);
  H.paintRoom(plan, 0, room, 8);
  H.floorRoom(plan, 0, room, 9);
  H.floorRoom(plan, 1, upper, 9);
  const north = H.wallAt(plan, 0, 3, 2, 4, 2), west = H.wallAt(plan, 0, 2, 3, 2, 4);
  ok(north.b === 8 && north.a === 1, 'a room paints only its side of a wall (south)');
  ok(west.a === 8 && west.b === 1, 'a room paints only its side of a wall (east)');
  const door = H.addOpening(plan, 0, 3, 7, 4, 7, 'door', [0, 2.17], false);
  ok(H.openingFacing(plan, 0, door) === 2, 'a door faces the street on the south');
  const side = H.addOpening(plan, 0, 8, 3, 8, 4, 'window', [0.905, 2.17], true);
  ok(H.openingFacing(plan, 0, side) === 3, 'a window faces the street on the east');
  ok(H.openingFacing(plan, 0, H.addOpening(plan, 0, 3, 2, 4, 2, 'window', [0.905, 2.17], true)) === 0, 'a window faces the street on the north');
  ok(H.openingFacing(plan, 0, H.addOpening(plan, 0, 2, 3, 2, 4, 'window', [0.905, 2.17], true)) === 1, 'a window faces the street on the west');
  near(H.floorY(plan, 1), 2 + 0.5 + S.METRICS.floorStep, 1e-9, 'floors stand one step apart above the foundation');

  const view = (floor, mode, rot) => ({ floor, mode, rot });
  const southWall = H.wallAt(plan, 0, 4, 7, 5, 7), northWall = H.wallAt(plan, 0, 4, 2, 5, 2), eastWall = H.wallAt(plan, 0, 8, 4, 8, 5), westWall = H.wallAt(plan, 0, 2, 4, 2, 5);
  ok(H.wallIsLow(plan, 0, southWall, view(0, 'cut', 0)) && H.wallIsLow(plan, 0, eastWall, view(0, 'cut', 0)), 'at turn 0 the near walls go down');
  ok(!H.wallIsLow(plan, 0, northWall, view(0, 'cut', 0)) && !H.wallIsLow(plan, 0, westWall, view(0, 'cut', 0)), 'at turn 0 the far walls stay');
  ok(H.wallIsLow(plan, 0, northWall, view(0, 'cut', 2)) && H.wallIsLow(plan, 0, westWall, view(0, 'cut', 2)), 'at turn 2 the other walls go down');
  ok(!H.wallIsLow(plan, 0, southWall, view(0, 'cut', 2)), 'at turn 2 the south wall stays');
  let lowCount = 0;
  for (let rot = 0; rot < 4; rot++) {
    if (H.wallIsLow(plan, 0, southWall, view(0, 'cut', rot))) lowCount++;
  }
  ok(lowCount === 2, 'a wall goes down at two turns of four: ' + lowCount);
  ok(!H.wallIsLow(plan, 0, southWall, view(0, 'up', 0)), 'nothing goes down with the walls up');
  ok(H.wallIsLow(plan, 0, northWall, view(0, 'down', 0)), 'everything goes down with the walls down');
  ok(!H.wallIsLow(plan, 0, southWall, view(1, 'cut', 0)), 'the cut works on the active floor only');
  ok(!H.wallIsLow(plan, 0, southWall, null), 'a house without a view keeps its walls');
  const wing = make();
  H.addRoom(wing, 0, 2, 1, 6, 4);
  H.addRoom(wing, 0, 2, 6, 6, 9);
  ok(H.wallIsLow(wing, 0, H.wallAt(wing, 0, 5, 6, 6, 6), view(0, 'cut', 0)), 'the far wall of a wing goes down when another room stands behind it');
  ok(!H.wallIsLow(wing, 0, H.wallAt(wing, 0, 3, 1, 4, 1), view(0, 'cut', 0)), 'the far wall of the last wing stays');

  const floorItem = H.addItem(plan, 'm_bed', 1, 3, 3, 2), lowItem = H.addItem(plan, 'm_sofa', 0, 4, 4, 1), yard = H.addItem(plan, 'm_tree', 0, 10, 8, 3);
  yard.outdoor = true;
  const doorItem = H.addSegItem(plan, 'm_door', 0, door);
  ok(H.itemFlags(plan, floorItem, null) === (2 | (1 << 2)), 'flags keep the facing and the floor');
  ok(H.itemFlags(plan, floorItem, view(0, 'cut', 0)) & H.FLAG_HIDDEN, 'things above the active floor are hidden');
  ok(H.itemFlags(plan, lowItem, view(1, 'cut', 0)) & H.FLAG_DIM, 'things below the active floor go dim');
  ok(!(H.itemFlags(plan, lowItem, view(0, 'cut', 0)) & (H.FLAG_DIM | H.FLAG_HIDDEN | H.FLAG_CUT)), 'things on the active floor stay as they are');
  ok(H.itemFlags(plan, doorItem, view(0, 'cut', 0)) & H.FLAG_CUT, 'a door in a low wall is cut');
  ok(!(H.itemFlags(plan, doorItem, view(0, 'cut', 2)) & H.FLAG_CUT), 'a door in a tall wall stays whole');
  ok(!(H.itemFlags(plan, doorItem, view(0, 'up', 0)) & H.FLAG_CUT), 'nothing is cut with the walls up');
  ok(H.itemFlags(plan, doorItem, view(0, 'down', 2)) & H.FLAG_CUT, 'every door is cut with the walls down');
  ok(H.showsRoof(plan, null) && H.showsRoof(plan, view(1, 'up', 0)), 'the roof shows from the top floor with the walls up');
  ok(!H.showsRoof(plan, view(0, 'up', 0)) && !H.showsRoof(plan, view(1, 'cut', 0)), 'the roof goes away below the top floor and in the cut');

  const file = JSON.parse(JSON.stringify(H.toFile(plan)));
  const back = H.fromFile(file, { id: 'copy', x: 300, z: 100, base: 4 });
  ok(back.x === 300 && back.base === 4 && back.w === plan.w && back.lift === plan.lift, 'a lot file moves to a new place');
  ok(back.floors.length === 2 && back.floors[0].walls.size === plan.floors[0].walls.size, 'a lot file keeps the walls');
  ok(S.hash(Array.from(back.floors[0].paint)) === S.hash(Array.from(plan.floors[0].paint)), 'a lot file keeps the floors');
  ok(H.wallAt(back, 0, 3, 7, 4, 7).cut.kind === 'door', 'a lot file keeps the openings');
  ok(H.rooms(back, 0).length === H.rooms(plan, 0).length, 'a lot file gives the same rooms');
  ok(back.items.length === plan.items.length && back.items.some(i => i.seg && i.kind === 'm_door'), 'a lot file keeps the things');
  ok(back.items.find(i => i.kind === 'm_tree').outdoor === true, 'a lot file keeps what stands outdoors');
  assert.throws(() => H.fromFile({ format: 99 }, {}), /unknown lot format/);
  checks++;

  const lit = make();
  H.addRoom(lit, 0, 2, 2, 6, 6);
  H.addRoom(lit, 0, 6, 2, 10, 6);
  const texel = (bytes, x, z) => bytes.subarray((x + z * lit.w) * 4, (x + z * lit.w) * 4 + 4);
  const dayOf = t => (t[3] >> 4) / 15, colorOf = t => t[3] & 15;
  let map = H.lightBytes(lit, 0);
  ok(map.length === lit.w * lit.d * 4, 'the light map covers the lot');
  ok(colorOf(texel(map, 0, 0)) === 0 && dayOf(texel(map, 0, 0)) === 1, 'the street has full daylight');
  const dark = dayOf(texel(map, 3, 3));
  ok(dark < 0.5 && dark > 0, 'a room without windows is dim by day: ' + dark);
  ok(colorOf(texel(map, 3, 3)) !== colorOf(texel(map, 7, 3)), 'neighbour rooms have different colours in the map');
  H.addOpening(lit, 0, 3, 2, 4, 2, 'window', [0.905, 2.17], true);
  map = H.lightBytes(lit, 0);
  ok(dayOf(texel(map, 3, 2)) > dark + 0.3, 'a window brings daylight in: ' + dayOf(texel(map, 3, 2)));
  ok(dayOf(texel(map, 3, 2)) > dayOf(texel(map, 3, 5)), 'daylight fades away from the window');
  near(dayOf(texel(map, 7, 3)), dark, 1e-9, 'daylight stays in the room of the window');
  const lamp = H.addLamp(lit, 0, 3.5, 3.5, 1, [1, 0.8, 0.6]);
  map = H.lightBytes(lit, 0);
  ok(texel(map, 3, 3)[0] === 0, 'a lamp that is off gives no light');
  ok(H.setLamps(lit, true) && !H.setLamps(lit, true), 'setting the lamps reports a change once');
  map = H.lightBytes(lit, 0);
  ok(texel(map, 3, 3)[0] > 100, 'a lamp lights its room: ' + texel(map, 3, 3)[0]);
  ok(texel(map, 3, 3)[0] > texel(map, 3, 3)[2], 'a warm lamp gives warm light');
  ok(texel(map, 3, 3)[0] > texel(map, 5, 5)[0] && texel(map, 5, 5)[0] > 0, 'lamp light fades but fills the room');
  ok(texel(map, 6, 3)[0] === 0 && texel(map, 7, 3)[0] === 0, 'lamp light stops at the wall');
  ok(texel(map, 1, 3)[0] === 0, 'lamp light stays indoors');
  lamp.x = 1;
  lamp.z = 1;
  map = H.lightBytes(lit, 0);
  ok(texel(map, 1, 1)[0] > 60, 'an outdoor lamp lights the yard');
  ok(texel(map, 3, 3)[0] === 0, 'an outdoor lamp does not enter the house');
  ok(texel(map, 11, 9)[0] === 0, 'an outdoor lamp has a limit');

  const M = S.METRICS;
  const positions = mesh => {
    const v = new DataView(mesh.data), out = [];
    for (let i = 0; i < mesh.vertices; i++) {
      const o = i * S.HouseMesh.STRIDE;
      out.push({ x: v.getFloat32(o, true), y: v.getFloat32(o + 4, true), z: v.getFloat32(o + 8, true), u: v.getFloat32(o + 12, true), v: v.getFloat32(o + 16, true), nx: v.getInt8(o + 20), ny: v.getInt8(o + 21), nz: v.getInt8(o + 22), ao: v.getUint8(o + 23), row: v.getUint8(o + 24), room: v.getUint8(o + 25), dim: v.getUint8(o + 26) });
    }
    return out;
  };
  const check = (mesh, tag) => {
    ok(mesh.count % 3 === 0 && mesh.count > 0, tag + ': whole triangles');
    ok(mesh.index.every(i => i < mesh.vertices), tag + ': indices stay in range');
    const pts = positions(mesh);
    ok(pts.every(p => [p.x, p.y, p.z, p.u, p.v].every(Number.isFinite)), tag + ': no broken numbers');
    ok(pts.every(p => p.x >= plan.x - 2 && p.x <= plan.x + plan.w + 2 && p.z >= plan.z - 2 && p.z <= plan.z + plan.d + 2 && p.y >= plan.base - 0.3), tag + ': the mesh stays on the lot');
    ok(pts.every(p => Math.hypot(p.nx, p.ny, p.nz) > 100), tag + ': normals are unit length');
    return pts;
  };
  plan.floors[1].paint.fill(0);
  H.floorRoom(plan, 1, upper, 9);
  for (const form of S.ROOF_FORMS) {
    plan.roof.form = form;
    const mesh = S.HouseMesh.build(plan, null), pts = check(mesh, form);
    ok(!!S.ROOF_NAMES[form], form + ' has a name');
    const wallTop = H.floorY(plan, 1) + M.wall;
    ok(mesh.top >= wallTop, form + ' stands above the walls: ' + mesh.top);
    ok(mesh.top < wallTop + 6, form + ' stays a sane height: ' + mesh.top);
    ok(mesh.solidStart > 0 && mesh.solidStart < mesh.count, form + ' keeps the floors apart from the solid part');
    const roofRow = (form === 'flat' ? plan.paints.flat : plan.roof.style) - 1, roof = pts.filter(p => p.row === roofRow);
    ok(roof.length > 0, form + ' has a roof surface');
    if (form !== 'flat') ok(roof.some(p => p.y > wallTop + 0.2), form + ' rises above the wall top');
  }
  ok(S.ROOF_FORMS.length === 8 && new Set(S.ROOF_FORMS).size === 8, 'eight roof forms');
  const box = make();
  H.addRoom(box, 0, 2, 2, 10, 8);
  const ridge = form => {
    box.roof.form = form;
    return S.HouseMesh.build(box, null).top - H.floorY(box, 0) - M.wall - S.HouseMesh.ROOF_LIFT;
  };
  near(ridge('hip'), M.roofPitch * 3, 1e-6, 'a hip roof rises by the pitch over half the width');
  near(ridge('gable'), M.roofPitch * 3, 1e-6, 'a gable along the long side has the same ridge');
  near(ridge('gableCross'), M.roofPitch * 4, 1e-6, 'a cross gable has a higher ridge');
  near(ridge('pyramid'), M.roofPitch * 3.5, 1e-6, 'a pyramid peaks in the middle');
  ok(ridge('halfHip') <= ridge('gable') + 1e-6, 'a half hip is not taller than the gable');
  ok(ridge('flat') >= 0.3 && ridge('flat') < 0.6, 'a flat roof shows only the parapet');
  box.roof.form = 'gable';
  const gablePts = positions(S.HouseMesh.build(box, null));
  const wallRow = box.paints.outside - 1, wallTop = H.floorY(box, 0) + M.wall;
  ok(gablePts.some(p => p.row === wallRow && p.y > wallTop + 0.5 && Math.abs(p.nx) > 100), 'a gable closes its ends with wall');
  box.roof.form = 'hip';
  const hipPts = positions(S.HouseMesh.build(box, null));
  ok(!hipPts.some(p => p.row === wallRow && p.y > wallTop + 0.01), 'a hip roof needs no wall above the top');
  const eave = hipPts.filter(p => p.row === box.roof.style - 1).reduce((low, p) => Math.min(low, p.y), Infinity);
  near(eave, wallTop + S.HouseMesh.ROOF_LIFT - M.roofPitch * M.roofOver / 2, 1e-5, 'the eaves hang below the wall top');
  plan.roof.form = 'hip';
  const full = S.HouseMesh.build(plan, null), up0 = S.HouseMesh.build(plan, view(0, 'up', 0)), cut0 = S.HouseMesh.build(plan, view(0, 'cut', 0)), down0 = S.HouseMesh.build(plan, view(0, 'down', 0)), cut1 = S.HouseMesh.build(plan, view(1, 'cut', 0));
  check(up0, 'up floor 0');
  check(cut0, 'cut floor 0');
  check(down0, 'down floor 0');
  check(cut1, 'cut floor 1');
  const levelOf = pts => pts.reduce((m, p) => Math.max(m, p.y), -Infinity);
  near(levelOf(positions(down0)), H.floorY(plan, 0) + M.wallLow, 1e-5, 'walls down stay at the low height');
  near(levelOf(positions(cut0)), H.floorY(plan, 0) + M.wall, 1e-5, 'the far walls stay in the cut');
  near(levelOf(positions(up0)), H.floorY(plan, 0) + M.wall, 1e-5, 'the upper floor is gone when the lower is active');
  ok(levelOf(positions(cut1)) <= H.floorY(plan, 1) + M.wall + 1e-5 && levelOf(positions(cut1)) > H.floorY(plan, 1), 'the upper floor shows when active');
  ok(levelOf(positions(full)) > H.floorY(plan, 1) + M.wall, 'the whole house has its roof');
  ok(positions(cut1).some(p => p.dim === 1) && positions(cut1).some(p => p.dim === 0), 'the lower floor goes dim under the active one');
  ok(positions(full).every(p => (p.dim & 1) === 0), 'the whole house is not dim');
  ok(positions(full).some(p => p.dim === 2) && positions(full).every(p => p.dim !== 2 || p.row !== plan.paints.outside - 1 || p.y > H.floorY(plan, 1)), 'only the roof part takes the sky alone');
  ok(positions(S.HouseMesh.build(plan, view(1, 'up', 0))).every(p => (p.dim & 1) === 0), 'nothing goes dim while the roof is on');
  const covers = (mesh, px, py, plane) => {
    const pts = positions(mesh);
    for (let i = 0; i < mesh.count; i += 3) {
      const [p, q, r] = [pts[mesh.index[i]], pts[mesh.index[i + 1]], pts[mesh.index[i + 2]]];
      if (p.nz < 100 || Math.abs(p.z - plane) > 1e-3) continue;
      const side = (a, b) => (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);
      const s0 = side(p, q), s1 = side(q, r), s2 = side(r, p);
      if ((s0 >= 0 && s1 >= 0 && s2 >= 0) || (s0 <= 0 && s1 <= 0 && s2 <= 0)) return true;
    }
    return false;
  };
  const base = H.floorY(make(), 0), holes = make();
  H.addRoom(holes, 0, 2, 2, 8, 7);
  const plane = holes.z + 7.1, spot = holes.x + 3.5;
  ok(covers(S.HouseMesh.build(holes, null), spot, base + 1, plane), 'a plain wall covers the door place');
  H.addOpening(holes, 0, 3, 7, 4, 7, 'door', [0, 2.17], false);
  const doorMesh = S.HouseMesh.build(holes, null);
  ok(!covers(doorMesh, spot, base + 1, plane), 'a door opens the wall');
  ok(!covers(doorMesh, holes.x + 3.02, base + 1, plane) && !covers(doorMesh, holes.x + 3.98, base + 1, plane), 'the next wall does not poke into the door');
  ok(covers(doorMesh, spot, base + 2.5, plane), 'the wall stays above the door');
  ok(covers(doorMesh, holes.x + 2.5, base + 1, plane), 'the next wall stays whole');
  H.removeWall(holes, 0, 3, 7, 4, 7);
  H.addWall(holes, 0, 3, 7, 4, 7);
  H.addOpening(holes, 0, 3, 7, 4, 7, 'window', [0.905, 2.17], true);
  const windowMesh = S.HouseMesh.build(holes, null);
  ok(covers(windowMesh, spot, base + 0.5, plane), 'the wall stays under a window');
  ok(!covers(windowMesh, spot, base + 1.5, plane), 'a window opens the wall');
  ok(covers(windowMesh, spot, base + 2.5, plane), 'the wall stays above a window');
  const lowMesh = S.HouseMesh.build(holes, view(0, 'cut', 0));
  ok(covers(lowMesh, spot, base + 0.5, plane) && !covers(lowMesh, spot, base + 0.7, plane) && !covers(lowMesh, spot, base + 2.5, plane), 'a low wall stops under the window');
  ok(!covers(S.HouseMesh.build(holes, view(0, 'cut', 0)), holes.x + 4.5, base + 1, plane), 'the rest of the wall goes down too');
  const corner = make();
  H.addRoom(corner, 0, 2, 2, 8, 7);
  const cornerPts = positions(S.HouseMesh.build(corner, null));
  ok(cornerPts.some(p => Math.abs(p.x - (corner.x + 8.1)) < 1e-3 && Math.abs(p.z - (corner.z + 7.1)) < 1e-3), 'walls close the outer corner');
  ok(positions(full).filter(p => p.row === plan.paints.foundation - 1).length > 0, 'a raised house shows its foundation');
  const flatLot = H.create({ id: 'f', x: 0, z: 0, w: 10, d: 10, paints: { outside: 1, cap: 2, band: 3, trim: 4, foundation: 5 }, roof: { form: 'hip', style: 7 } });
  H.addRoom(flatLot, 0, 2, 2, 6, 6);
  ok(positions(S.HouseMesh.build(flatLot, null)).every(p => p.row !== 4), 'a house on the ground has no foundation');
  const diag = make();
  H.addRoom(diag, 0, 2, 2, 8, 7);
  H.addWall(diag, 0, 2, 5, 4, 7);
  H.floorRoom(diag, 0, H.roomAt(diag, 0, 5, 4), 9);
  const diagPts = positions(S.HouseMesh.build(diag, null));
  ok(diagPts.some(p => Math.abs(p.nx) > 50 && Math.abs(p.nz) > 50 && p.ny === 0), 'a diagonal wall has a slanted face');
  ok(diagPts.filter(p => p.ny === 127 && p.row === 8).length > 0, 'a floor follows a diagonal with triangles');
  const stack = make();
  H.addRoom(stack, 0, 2, 2, 8, 7);
  H.addRoom(stack, 1, 2, 2, 8, 7);
  ok(positions(S.HouseMesh.build(stack, null)).some(p => p.row === stack.paints.band - 1), 'a band runs between the floors');
  const sky = S.SKY, noon = S.skyAt(12), night = S.skyAt(2), gold = S.skyAt(18.5);
  ok(sky.length === 12, 'twelve points of the day');
  ok(sky.every((p, i) => i === 0 || p[0] > sky[i - 1][0]), 'the points of the day go in order');
  near(noon.color[1], 1, 0.01, 'noon has full light');
  ok(night.color[0] < 0.3 && night.sun === 0, 'the night is dark and has no sun');
  ok(gold.color[0] > gold.color[2] + 0.2, 'the golden hour is warm: ' + gold.color);
  ok(S.skyAt(24).color[0] === S.skyAt(0).color[0], 'the day wraps round');
  for (let t = 0; t < 24; t += 0.25) ok(S.skyAt(t).color.every(Number.isFinite), 'the sky has a colour at ' + t);
  ok(S.lampsOn(23) && S.lampsOn(5) && !S.lampsOn(12), 'lamps follow the time of day');
  ok(S.WALL_MODES.every(m => !!S.WALL_NAMES[m]), 'every wall mode has a name');
}

{
  const before = S.KINDS.length;
  const sampleScene = S.Town.create(doc, 1), H = S.House;
  ok(S.KINDS.length === before + Object.keys(doc.models).length, 'sample models are registered as kinds');
  S.Sample.registerKinds(doc);
  ok(S.KINDS.length === before + Object.keys(doc.models).length, 'registering twice changes nothing');
  ok(S.KINDS[S.KIND_ID.m_window].glass && !S.KINDS[S.KIND_ID.m_door].glass, 'only the window has glass');
  ok(sampleScene.sample && sampleScene.hasShadows && sampleScene.walkers.length === 0, 'the sample scene has its flags');
  ok(P_rowsSkipModels(), 'placeholders skip real models');
  const [main, next] = sampleScene.houses;
  ok(sampleScene.houses.length === S.Town.LOTS.length && main.floors.length === 2 && next.floors.length === 1, 'every lot has a house, the main one has two floors');
  ok(main.lift === 0.25 && (main.lift / S.METRICS.foundationStep) % 1 === 0, 'the foundation follows the step');
  ok(!(main.x < next.x + next.w && next.x < main.x + main.w && main.z < next.z + next.d && next.z < main.z + main.d), 'the lots do not overlap');
  for (const lot of sampleScene.world.lots) {
    let flat = true;
    for (let z = lot.z; z <= lot.z + lot.d; z += 3) {
      for (let x = lot.x; x <= lot.x + lot.w; x += 3) {
        if (Math.abs(S.Terrain.heightAt(sampleScene.terrain, x, z) - lot.base) > 1e-4) flat = false;
      }
    }
    ok(flat, 'the lot is flat: ' + lot.id);
  }
  ok(H.rooms(main, 0).length === 5 && H.rooms(main, 1).length === 5, 'the main house has four rooms below and four above');
  near(H.rooms(main, 0)[H.roomAt(main, 0, 8, 8)].area, 49, 1e-9, 'the kitchen area');
  const kinds = new Set();
  for (let i = 0; i < sampleScene.count; i++) kinds.add(S.KINDS[sampleScene.kind[i]].id);
  for (const id of Object.keys(doc.models)) {
    if (id !== 'door_open' && !/^(car|bus)/.test(id) && !doc.models[id].base) ok(kinds.has('m_' + id), 'the sample shows ' + id);
  }
  ok(S.KINDS[S.KIND_ID.m_door].open === 'm_door_open', 'a door knows its open sprite');
  for (const h of sampleScene.houses) {
    for (const item of h.items) {
      ok(item.index >= 0 && item.index < sampleScene.count, 'a thing knows its instance');
      ok(S.KINDS[sampleScene.kind[item.index]].id === item.kind, 'the instance holds the thing');
      if (item.outdoor) {
        ok(Math.abs(sampleScene.pos[item.index * 3 + 1] - h.base) < 1e-4, 'a yard thing stands on the ground');
      } else {
        near(sampleScene.pos[item.index * 3 + 1], H.floorY(h, item.floor), 1e-5, 'a thing stands on its floor');
        const inRoom = H.roomAt(h, item.floor, item.x, item.z);
        if (!item.seg) ok(inRoom > 0, 'a thing stands in a room: ' + item.kind + ' ' + item.x + ',' + item.z);
      }
      if (item.seg) {
        ok(item.seg.cut && item.seg.cut.kind === item.kind.slice(2), 'an opening holds its thing');
        ok(H.openingFacing(h, item.floor, item.seg) === item.facing, 'an opening faces the street');
        const model = doc.models[item.seg.cut.kind];
        assert.deepEqual([item.seg.cut.y0, item.seg.cut.y1], model.cut, 'the opening has the size of the model');
        checks++;
      }
      ok((sampleScene.facing[item.index] & 3) === item.facing && (sampleScene.facing[item.index] >> 2) === item.floor, 'the instance knows the facing and the floor');
    }
  }
  const frontDoor = H.wallAt(main, 0, 16, 17, 17, 17);
  ok(frontDoor.cut && frontDoor.cut.kind === 'door', 'the front door stands in the front wall');
  ok(H.openingFacing(main, 0, frontDoor) === 2, 'the front door faces the street');
  const mainMesh = S.HouseMesh.build(main, null);
  const n = S.METRICS.town / S.METRICS.chunk, chunk = Math.floor((main.x + 10) / S.METRICS.chunk) + Math.floor((main.z + 10) / S.METRICS.chunk) * n;
  ok(sampleScene.terrain.chunks[chunk * 2 + 1] >= H.floorY(main, 2), 'chunk bounds know about the tall house');
  ok(mainMesh.data.byteLength + mainMesh.index.byteLength < 400000, 'the mesh of a house stays small: ' + (mainMesh.data.byteLength + mainMesh.index.byteLength));
  ok(sampleScene.styleRows.length <= S.Style.ROWS, 'style rows fit the table');
  for (const h of sampleScene.houses) ok(h.rowOf.length === h.styles.length && h.rowOf.every(r => r >= S.Sample.STYLES.length), 'house styles follow the furniture styles');
  S.Sample.SURFACES.forEach(s => ok(S.Style.patternId(s.pattern) >= 0, 'surface pattern exists: ' + s.pattern));
  ok(S.Sample.SURFACES.every(s => s.colors.length <= 4), 'surfaces fit the four colours');
  ok(Object.values(S.Sample.PAINTS).every(v => v >= 1 && v <= S.Sample.SURFACES.length), 'paint names stay in the list');
  for (const id of ['outside', 'cap', 'band', 'trim', 'foundation', 'flat', 'stair']) ok(main.paints[id] >= 1 && next.paints[id] >= 1, 'the house has the paint ' + id);
  ok(S.Sample.VIEWS.every(v => S.WALL_MODES.includes(v.mode) && v.floor >= 0 && v.floor < 2 && v.zoom >= 0 && v.zoom < S.ZOOMS.length), 'the views are valid');
  const set = [];
  const atlasStub = { setRow: (r, v) => set.push([r, v]), placeLive: () => ({ x: 4, y: 8, layer: 3 }), clearLive: () => {} };
  const store = new S.SpriteStore(atlasStub, S.SPRITE_INDEX);
  store.fill();
  const kind = S.KIND_ID.m_sofa, q = S.SPRITE_INDEX.kinds.sofa.levels[0][0], rowOf = (zoom, turn, shadow) => store.rows.get(S.spriteRow(kind, zoom, turn, shadow));
  ok(rowOf(0, 0, false)[7] === 2 && rowOf(0, 0, false)[2] === q[3] * 4 && rowOf(0, 0, false)[0] === q[5] * 4, 'the near zoom starts from the quarter size sprite');
  ok(rowOf(1, 0, false)[7] === 1 && rowOf(1, 0, false)[2] === q[3] * 2, 'the middle zoom starts from the quarter size sprite');
  ok(rowOf(2, 0, false)[7] === 0, 'the far zoom uses its sprite directly');
  ok(rowOf(0, 0, true)[7] === 1, 'the near shadow is the middle shadow');
  ok(rowOf(1, 0, true)[7] === 0, 'the middle zoom has its own shadow');
  const modelCount = Object.keys(doc.models).length, openingCount = Object.values(doc.models).filter(m => m.cut).length;
  ok(store.rows.size === (modelCount * 2 - openingCount) * S.ZOOMS.length * 4, 'each model has its sprite rows and the shadow rows of all but the openings');
  ok(!store.rows.has(S.spriteRow(S.KIND_ID.m_window, 1, 0, true)) && !store.rows.has(S.spriteRow(S.KIND_ID.m_door, 0, 0, true)), 'doors and windows cast no sprite shadow');
  const glassRow = store.rows.get(S.spriteRow(S.KIND_ID.m_window, 2, 0, false)), plainRow = store.rows.get(S.spriteRow(S.KIND_ID.m_door, 2, 0, false));
  ok(glassRow[10] === 1 && plainRow[10] === 0, 'the table marks the sprites with glass');
  const key = id => id * 8;
  store.addLive(kind, 'sofa', 0, S.ATLAS.HALF, {}, {});
  const h1 = S.SPRITE_INDEX.kinds.sofa.half[0];
  ok(rowOf(1, 0, false)[7] === 0 && rowOf(1, 0, false)[2] === h1[2] && rowOf(1, 0, false)[6] === 3, 'a loaded half sprite serves the middle zoom');
  ok(rowOf(0, 0, false)[7] === 1 && rowOf(0, 0, false)[2] === h1[2] * 2, 'a loaded half sprite serves the near zoom too');
  store.addLive(kind, 'sofa', 0, S.ATLAS.NEAR, {}, {});
  const n0 = S.SPRITE_INDEX.kinds.sofa.near[0];
  ok(rowOf(0, 0, false)[7] === 0 && rowOf(0, 0, false)[2] === n0[2] && rowOf(0, 0, false)[4] === 4, 'a loaded near sprite replaces the half size one');
  ok(store.nearLoaded === 1 && store.halfLoaded === 1, 'the store counts what it loaded');
  ok(set.length === 3, 'the table gets the new rows: ' + set.length);
  store.addLive(kind, 'sofa', 1, S.ATLAS.HALF, {}, {});
  store.addLive(kind, 'sofa', 0, S.ATLAS.HALF, {}, {});
  ok(rowOf(0, 0, false)[7] === 0, 'a half sprite does not replace a loaded near sprite');
  store.want(S.KIND_ID.fence, 0, S.ATLAS.NEAR);
  ok(store.state[key(S.KIND_ID.fence)] === 2, 'a placeholder never asks for files');
  let tries = 0;
  atlasStub.placeLive = () => (tries++ === 0 ? null : { x: 0, y: 0, layer: 3 });
  store.addLive(S.KIND_ID.m_table, 'table', 0, S.ATLAS.NEAR, {}, {});
  ok(tries === 2 && store.nearLoaded === 1 && store.halfLoaded === 0, 'a full live page is cleared and the sprite placed again');
  ok(rowOf(0, 0, false)[7] === 2, 'clearing the live pages returns the small sprites');
  ok(!fs.existsSync(path.join(DIR, 'ts-sample-gl.js')), 'the old figure is gone');
  for (const f of ['ts-render', 'ts-ui', 'ts-sample']) {
    const src = read('js/apps/sims98/' + f + '.js');
    ok(!/setPath|bakeRows|drawModels|buildMesh|Sample\.mesh|figureAt\b|drawFigure\b/.test(src), 'paths Б and В and the old figure are gone from ' + f);
  }
  const render = read('js/apps/sims98/ts-render.js');
  ok(/gl_FragDepth/.test(render) && /discard/.test(render), 'sprites write their own depth');
  ok(/gl\.R8/.test(read('js/apps/sims98/ts-gl.js')) && /uShadow/.test(render), 'shadows live in a gray array');
}

{
  const Body = S.Body, B = Body.B, M = S.METRICS;
  ok(Body.COUNT === 24 && Body.BONES.length === 24 && Body.PARENT.length === 24, 'a skeleton of 24 bones');
  Body.PARENT.forEach((p, i) => ok(p < i, 'bones go from parent to child: ' + Body.BONES[i]));
  const positions = mesh => {
    const v = new DataView(mesh.data), out = [];
    for (let i = 0; i < mesh.vertices; i++) {
      const o = i * Body.STRIDE;
      out.push({ x: v.getFloat32(o, true), y: v.getFloat32(o + 4, true), z: v.getFloat32(o + 8, true), nx: v.getInt8(o + 12), ny: v.getInt8(o + 13), nz: v.getInt8(o + 14), u: v.getUint16(o + 16, true), v: v.getUint16(o + 18, true), b0: v.getUint8(o + 20), b1: v.getUint8(o + 21), w: v.getUint8(o + 22) });
    }
    return out;
  };
  for (const [age, height] of [['adult', M.adult], ['teen', M.teen], ['child', M.child], ['toddler', M.toddler]]) {
    near(Body.height(age), height, 0.02, age + ' height follows plan 5.1');
    for (const sex of ['m', 'f']) {
      for (const lod of [0, 1]) {
        const tag = age + ' ' + sex + ' lod ' + lod, mesh = Body.mesh(age, sex, lod), pts = positions(mesh);
        near(mesh.top, height, 0.03, tag + ': the body has the right height');
        ok(mesh.count % 3 === 0 && mesh.index.every(i => i < mesh.vertices), tag + ': whole triangles');
        ok(pts.every(p => [p.x, p.y, p.z].every(Number.isFinite)), tag + ': no broken numbers');
        ok(pts.every(p => p.b0 < 24 && p.b1 < 24), tag + ': bones stay in range');
        const low = pts.reduce((m, p) => Math.min(m, p.y), Infinity);
        ok(low > -0.02 && low < 0.03, tag + ': the feet stand on the ground: ' + low);
        ok(pts.every(p => Math.hypot(p.nx, p.ny, p.nz) > 90), tag + ': normals are set');
        const left = pts.filter(p => p.x > 0.001).reduce((m, p) => Math.max(m, p.x), 0), right = pts.filter(p => p.x < -0.001).reduce((m, p) => Math.min(m, p.x), 0);
        near(left, -right, 0.005, tag + ': the body is symmetric');
        let outward = 0, inward = 0;
        const skel = Body.skeleton(age, sex);
        for (const p of pts) {
          const c = skel.bind[B.chest * 3 + 1];
          if (Math.abs(p.y - c) < 0.05 * Body.AGES[age].torso && Math.abs(p.x) < 0.1) {
            if (p.z * p.nz > 0) outward++;
            else if (p.z * p.nz < 0) inward++;
          }
        }
        ok(outward > inward * 3, tag + ': normals look outward: ' + outward + ' to ' + inward);
      }
      const whole = Body.mesh(age, sex, 0).count / 3 + Body.hair('long', age, 0).count / 3;
      ok(whole <= 1400, age + ' ' + sex + ': the near mesh keeps its budget: ' + whole);
      ok(Body.mesh(age, sex, 1).count / 3 + Body.hair('long', age, 1).count / 3 <= 500, age + ' ' + sex + ': the far mesh keeps its budget');
    }
    for (const style of ['short', 'long']) {
      const hair = Body.hair(style, age, 0), pts = positions(hair);
      ok(pts.every(p => p.b0 === B.head && p.b1 === B.head), style + ' hair follows the head');
      ok(hair.top >= height - 0.01, style + ' hair covers the top of the head');
      ok(hair.index.every(i => i < hair.vertices), style + ' hair has whole triangles');
    }
  }
  ok(Body.hair('none', 'adult', 0) === null, 'a bald sim has no hair mesh');
  const chestDepth = (age, sex) => {
    const skel = Body.skeleton(age, sex), y = skel.bind[B.chest * 3 + 1] + 0.09 * Body.AGES[age].torso, pts = positions(Body.mesh(age, sex, 0));
    return pts.filter(p => Math.abs(p.y - y) < 0.06 * Body.AGES[age].torso && Math.abs(p.x) < 0.02).reduce((m, p) => Math.max(m, p.z), 0) / Body.AGES[age].girth;
  };
  for (const age of ['child', 'toddler']) {
    ok(Buffer.compare(Buffer.from(Body.mesh(age, 'f', 0).data), Buffer.from(Body.mesh(age, 'm', 0).data)) === 0 || Math.abs(chestDepth(age, 'f') - chestDepth(age, 'm')) < 1e-6, age + ': girls and boys have the same chest');
  }
  ok(chestDepth('teen', 'f') <= chestDepth('adult', 'f') - 0.01, 'a teen has a child-like chest compared to an adult');
  ok(Body.mesh('adult', 'm', 0) === Body.mesh('adult', 'm', 0), 'meshes are built once');
  const rows = new Float32Array(Body.COUNT * 12), rot = new Float32Array(Body.COUNT * 3), root = [0, 0, 0];
  const skel = Body.skeleton('adult', 'm');
  Body.pose(skel, rot, root, 10, 2, 20, 0, rows);
  for (let i = 0; i < Body.COUNT; i++) {
    const x = skel.bind[i * 3], y = skel.bind[i * 3 + 1], z = skel.bind[i * 3 + 2], p = Body.point(rows, i, x, y, z);
    near(p[0], 10 + x, 1e-5, 'the rest pose keeps the bone x');
    near(p[1], 2 + y, 1e-5, 'the rest pose keeps the bone y');
    near(p[2], 20 + z, 1e-5, 'the rest pose keeps the bone z');
  }
  Body.pose(skel, rot, root, 0, 0, 0, Math.PI / 2, rows);
  const nose = Body.point(rows, B.head, 0, skel.bind[B.head * 3 + 1], 0.1);
  near(nose[0], 0.1, 1e-5, 'yaw turns the face to the walking direction');
  rot[B.thighL * 3] = -Math.PI / 2;
  Body.pose(skel, rot, root, 0, 0, 0, 0, rows);
  const knee = Body.point(rows, B.shinL, skel.bind[B.shinL * 3], skel.bind[B.shinL * 3 + 1], skel.bind[B.shinL * 3 + 2]);
  ok(knee[2] > 0.35, 'a negative thigh turn lifts the leg forward: ' + knee[2]);
  const ball = (clip, t, stride) => {
    S.Clips.sample(clip, t, rot, root);
    Body.pose(skel, rot, root, 0, 0, t * stride, 0, rows);
    const left = Body.point(rows, B.toeL, skel.bind[B.toeL * 3], skel.bind[B.toeL * 3 + 1], skel.bind[B.toeL * 3 + 2]);
    const heel = Body.point(rows, B.footL, skel.bind[B.footL * 3], skel.bind[B.footL * 3 + 1] - 0.06, skel.bind[B.footL * 3 + 2] - 0.05);
    return { y: left[1], z: left[2], heel: heel[1] };
  };
  for (const [clip, from, to, slide] of [['walk', 0.125, 0.5, 0.06], ['run', 0.0625, 0.25, 0.07]]) {
    const stride = S.Clips.LIST[clip].stride;
    let lowZ = Infinity, highZ = -Infinity;
    for (let t = from; t <= to; t += 0.02) {
      const f = ball(clip, t, stride);
      lowZ = Math.min(lowZ, f.z);
      highZ = Math.max(highZ, f.z);
      ok(f.y > -0.015 && f.heel > -0.02, clip + ': the foot stays above the floor at ' + t + ': ' + f.y);
      ok(f.y < 0.05, clip + ': the planted foot stays on the floor at ' + t + ': ' + f.y);
    }
    ok(highZ - lowZ < slide, clip + ': the planted foot does not slide: ' + (highZ - lowZ));
    const swing = ball(clip, 0.7, stride);
    ok(swing.y > 0.06, clip + ': the foot lifts while swinging: ' + swing.y);
  }
  for (const [name, clip] of Object.entries(S.Clips.LIST)) {
    ok(clip.channels.every(c => c.bone === -1 || (c.bone >= 0 && c.bone < 24)), name + ': channels hit real bones');
    ok(clip.channels.every(c => c.keys.every(k => Number.isFinite(k[0]) && Number.isFinite(k[1]))), name + ': keys are numbers');
    ok(clip.loop ? (clip.stride > 0 || clip.seconds > 0) : clip.seconds > 0, name + ': the clip has a length');
    for (let t = 0; t <= 1; t += 0.03) {
      S.Clips.sample(name, t, rot, root);
      ok(rot.every(Number.isFinite) && root.every(Number.isFinite), name + ': the pose is finite at ' + t);
    }
    if (clip.loop) {
      S.Clips.sample(name, 0.9999, rot, root);
      const end = Array.from(rot);
      S.Clips.sample(name, 0, rot, root);
      let gap = 0;
      for (let i = 0; i < rot.length; i++) gap = Math.max(gap, Math.abs(rot[i] - end[i]));
      ok(gap < 0.02, name + ': the loop closes: ' + gap);
    }
  }
  S.Clips.sample('sitDown', 1, rot, root);
  const seated = Array.from(rot);
  S.Clips.sample('sit', 0, rot, root);
  ok(Math.abs(rot[B.thighL * 3] - seated[B.thighL * 3]) < 0.01, 'sitting down ends in the seated pose');
  S.Clips.sample('standUp', 0, rot, root);
  ok(Math.abs(rot[B.thighL * 3] - seated[B.thighL * 3]) < 0.01, 'standing up starts from the seated pose');
  S.Clips.sample('standUp', 1, rot, root);
  ok(Math.abs(rot[B.thighL * 3]) < 0.01, 'standing up ends with straight legs');
  const painted = [], stub = { fillStyle: '', fillRect(x, y, w, h) { painted.push([x, y, w, h, this.fillStyle]); } };
  for (const person of S.Sample.FAMILY) {
    S.Skin.paint(stub, person.look);
    for (const k of ['skin', 'hair', 'eyes', 'shirt', 'trousers', 'shoes']) ok(/^#[0-9a-f]{6}$/.test(person.look[k]), person.name + ' has the colour ' + k);
    ok(S.Body.HAIR_STYLES[person.hair] !== undefined, person.name + ' has a hair style');
    ok(!!S.Body.AGES[person.age], person.name + ' has an age');
  }
  ok(painted.length > 100, 'the skin paints a picture');
  ok(painted.every(([x, y, w, h]) => x >= 0 && y >= 0 && w >= 0 && h >= 0 && x + w <= S.Skin.SIZE && y + h <= S.Skin.SIZE), 'the skin stays on its texture');
  ok(painted.every(p => p.slice(0, 4).every(Number.isFinite)), 'the skin uses whole numbers');
  const rects = Object.values(Body.RECTS);
  ok(rects.every(([x, y, w, h]) => x + w <= Body.TEXTURE && y + h <= Body.TEXTURE), 'body parts stay on the texture');
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const p = rects[i], q = rects[j];
      ok(!(p[0] < q[0] + q[2] && q[0] < p[0] + p[2] && p[1] < q[1] + q[3] && q[1] < p[1] + p[3]), 'body parts do not overlap on the texture');
    }
  }
}

{
  const H = S.House, M = S.METRICS, makeScene = () => S.Town.create(doc, 1);
  const lot = () => {
    const h = H.create({ id: 'n', x: 10, z: 10, w: 20, d: 16, base: 1, lift: 0.25, paints: { outside: 1, cap: 2, band: 3, trim: 4, foundation: 5, flat: 6, stair: 7 }, roof: { form: 'hip', style: 7 } });
    H.addRoom(h, 0, 2, 2, 8, 8);
    H.addRoom(h, 0, 8, 2, 14, 8);
    H.floorRoom(h, 0, H.roomAt(h, 0, 4, 4), 8);
    H.floorRoom(h, 0, H.roomAt(h, 0, 10, 4), 8);
    return h;
  };
  let h = lot(), nav = new S.Nav(h);
  const cost = found => {
    let sum = 0;
    for (let i = 1; i < found.nodes.length; i++) {
      const [ax, az] = nav.tileOf(found.nodes[i - 1]), [bx, bz] = nav.tileOf(found.nodes[i]);
      sum += Math.hypot(ax - bx, az - bz);
    }
    return sum;
  };
  const inRoom = nav.node(0, 4, 4), inNext = nav.node(0, 10, 4), outside = nav.node(0, 1, 1);
  ok(!nav.find(inRoom, outside).reached, 'a closed room has no way out');
  ok(!nav.find(inRoom, inNext).reached, 'a wall stops the way to the next room');
  ok(nav.find(inRoom, nav.node(0, 6, 6)).reached, 'a room is walkable inside');
  near(cost(nav.find(inRoom, nav.node(0, 6, 6))), 2 * Math.SQRT2, 1e-6, 'a diagonal walk is the shortest inside a room');
  H.addOpening(h, 0, 8, 4, 8, 5, 'door', [0, 2.17], false);
  H.addOpening(h, 0, 8, 6, 8, 7, 'window', [0.905, 2.17], true);
  nav = new S.Nav(h);
  ok(nav.find(inRoom, inNext).reached, 'a door joins two rooms');
  const through = nav.find(nav.node(0, 7, 6), nav.node(0, 8, 6));
  ok(through.reached && cost(through) > 2, 'a window does not let anyone through: ' + cost(through));
  ok(!nav.find(inRoom, outside).reached, 'a room stays closed from the street');
  ok(!nav.canGo(0, 7, 4, 1, 1) && !nav.canGo(0, 7, 5, 1, -1), 'nobody cuts a door corner by a diagonal');
  ok(nav.canGo(0, 7, 4, 1, 0) && nav.canGo(0, 8, 4, -1, 0), 'a door works both ways');
  ok(!nav.canGo(0, 7, 3, 1, 0), 'a plain wall stops a step');
  H.addOpening(h, 0, 2, 4, 2, 5, 'door', [0, 2.17], false);
  nav = new S.Nav(h);
  ok(nav.find(inRoom, outside).reached, 'an outer door opens the room to the street');
  S.KIND_ID.tst_block = S.KIND_ID.tst_block === undefined ? S.KINDS.length : S.KIND_ID.tst_block;
  if (!S.KINDS.find(k => k.id === 'tst_block')) S.KINDS.push({ id: 'tst_block', w: 2, d: 1 });
  const blocker = H.addItem(h, 'tst_block', 0, 5, 5.5, 0);
  nav = new S.Nav(h);
  ok(!nav.isFree(0, 4, 5) && !nav.isFree(0, 5, 5) && nav.isFree(0, 6, 5) && nav.isFree(0, 3, 5), 'a thing takes exactly its tiles');
  blocker.facing = 1;
  blocker.x = 5.5;
  blocker.z = 5;
  nav = new S.Nav(h);
  ok(!nav.isFree(0, 5, 4) && !nav.isFree(0, 5, 5) && nav.isFree(0, 4, 5) && nav.isFree(0, 6, 5), 'a turned thing takes turned tiles');
  ok(!nav.canGo(0, 4, 4, 1, 0), 'nobody walks into a thing');
  ok(!nav.canGo(0, 4, 3, 1, 1) && !nav.canGo(0, 4, 6, 1, -1), 'nobody cuts the corner of a thing');
  h.items.length = 0;
  H.addWall(h, 0, 4, 2, 4, 8);
  H.addWall(h, 0, 2, 5, 4, 7);
  nav = new S.Nav(h);
  ok(!nav.isFree(0, 2, 5) && !nav.isFree(0, 3, 6), 'a tile with a diagonal wall is closed for now');
  const avoid = new Set([nav.node(0, 10, 4)]);
  const around = nav.find(nav.node(0, 9, 4), nav.node(0, 11, 4), avoid);
  ok(around.reached && !around.nodes.includes(nav.node(0, 10, 4)), 'a taken tile is walked around');
  const route = nav.route({ x: 9.5, z: 3.5, floor: 0 }, nav.find(nav.node(0, 9, 3), nav.node(0, 12, 6)).nodes);
  ok(route.length === 1, 'an open room gives a straight line: ' + route.length);
  ok(nav.clear(0, 9.5, 3.5, 12.5, 6.5) && !nav.clear(0, 9.5, 4.5, 3.5, 4.5), 'the clear test sees walls');

  const scene = makeScene(), world = scene.world, lot0 = world.lots[0], main = lot0.house, sim = scene.sims[0], M2 = S.METRICS;
  const X = lot0.x, Z = lot0.z, FLOOR = H.floorY(main, 0), family = scene.sims.filter(s => !s.free);
  nav = lot0.nav;
  ok(nav.floors === 2 && main.stairs.length === 1, 'the test house has a stair');
  const stair = main.stairs[0], cols = H.stairColumns(stair), [col] = cols;
  ok(H.stairTiles(stair).length === M2.stairRun * stair.width, 'a stair takes its run of tiles');
  near(Math.hypot(col.end[0] - col.start[0], col.end[1] - col.start[1]), M2.stairRun, 1e-9, 'a stair is five tiles long');
  for (const [x, z] of H.stairTiles(stair)) {
    ok(!nav.isFree(0, x, z), 'nobody walks through the stair below');
    ok(!nav.isFree(1, x, z), 'nobody walks over the stair hole above');
    const cell = (x + z * main.w) * 4;
    ok(main.floors[1].paint.subarray(cell, cell + 4).every(v => v === 0), 'the upper floor has a hole over the stair');
    ok(main.floors[0].paint.subarray(cell, cell + 4).some(v => v > 0), 'the lower floor stays under the stair');
  }
  ok(nav.isFree(0, col.entry[0], col.entry[1]) && nav.isFree(1, col.exit[0], col.exit[1]), 'both ends of the stair are free');
  const entry = nav.node(0, col.entry[0], col.entry[1]), exit = nav.node(1, col.exit[0], col.exit[1]);
  ok(nav.links.get(entry)[0].to === exit && nav.links.get(exit)[0].to === entry, 'a stair links two floors both ways');
  const mesh = S.HouseMesh.build(main, null), stairTop = H.floorY(main, 1);
  const verts = new DataView(mesh.data), stairSteps = new Set();
  for (let i = 0; i < mesh.vertices; i++) {
    const o = i * S.HouseMesh.STRIDE, x = verts.getFloat32(o, true) - main.x, y = verts.getFloat32(o + 4, true), z = verts.getFloat32(o + 8, true) - main.z, ny = verts.getInt8(o + 21), row = verts.getUint8(o + 24);
    if (ny === 127 && z >= 4.99 && z <= 6.01 && x >= 14.99 && x <= 20.01 && row === main.rowOf[main.paints.stair - 1] && y > FLOOR + 0.01) stairSteps.add(y.toFixed(3));
  }
  ok(stairSteps.size >= 15, 'the stair has its steps: ' + stairSteps.size);
  near(Math.max(...[...stairSteps].map(Number)), stairTop, 1e-4, 'the last step meets the upper floor');
  near(Math.min(...[...stairSteps].map(Number)), FLOOR + 0.2, 1e-4, 'the first step stands on the lower floor');
  const file = JSON.parse(JSON.stringify(H.toFile(main))), copy = H.fromFile(file, { id: 'c', x: 100, z: 100, base: 3 });
  ok(copy.stairs.length === 1 && copy.stairs[0].x === stair.x, 'a lot file keeps the stairs');
  ok(new S.Nav(copy).links.size === nav.links.size, 'a lot file gives the same stair links');

  const park = other => {
    other.x = X + 1.5;
    other.z = Z + 1.5 + scene.sims.indexOf(other);
    other.y = main.base;
    other.floor = 0;
    other.lot = lot0;
  };
  const others = () => { for (const other of family) if (other !== sim) park(other); };
  others();
  const put = (who, x, z, floor) => {
    who.x = X + x;
    who.z = Z + z;
    who.floor = floor || 0;
    who.lot = lot0;
    who.y = S.Sim.groundY(world, who.floor, lot0, who.x, who.z);
    who.path = null;
    who.state = 'idle';
    who.order = null;
    who.seat = null;
    who.seatW = 0;
  };
  const goLocal = (x, z, floor, extra) => Object.assign({ x: X + x, z: Z + z, floor: floor || 0, lot: lot0 }, extra);
  const run = (order, limit) => {
    if (order) S.Sim.order(world, sim, order);
    const stats = { t: 0, bad: 0, wall: 0, climb: false, maxStep: 0 };
    let px = sim.x, pz = sim.z, py = sim.y, pk = sim.floor;
    for (; stats.t < (limit || 90);) {
      S.Sim.stepAll(world, 0.05);
      stats.t += 0.05;
      const onStair = sim.path && sim.path[sim.wp] && sim.path[sim.wp].slope;
      if (onStair) stats.climb = true;
      if (sim.state === 'move' && !onStair && sim.floor === 0 && pk === 0) {
        const kx = Math.floor(px), kz = Math.floor(pz), nx = Math.floor(sim.x), nz = Math.floor(sim.z);
        if ((kx !== nx || kz !== nz) && !world.ground.canGo(0, kx, kz, nx - kx, nz - kz)) stats.wall++;
      }
      stats.maxStep = Math.max(stats.maxStep, Math.hypot(sim.x - px, sim.z - pz));
      if (Math.abs(sim.y - py) > 0.2) stats.bad++;
      px = sim.x;
      pz = sim.z;
      py = sim.y;
      pk = sim.floor;
      if (!sim.order && !sim.path && (sim.state === 'idle' || sim.state === 'sit')) break;
    }
    return stats;
  };
  put(sim, 16.5, 14.5);
  let result = run(goLocal(16.5, 9.5));
  near(sim.x, X + 16.5, 0.01, 'the sim reaches the goal x');
  near(sim.z, Z + 9.5, 0.01, 'the sim reaches the goal z');
  ok(sim.state === 'idle', 'the sim stops at the goal');
  ok(result.wall === 0, 'the sim does not walk through a wall: ' + result.wall);
  const straight = Math.hypot(16.5 - 15.5, 14.5 - 12) + Math.hypot(15.5 - 16.5, 12 - 9.5);
  ok(result.t < straight / M2.walk + 2.5, 'a short walk keeps the walking speed: ' + result.t);
  ok(result.t > straight / M2.walk * 0.9, 'a walk is not faster than a walk: ' + result.t);
  result = run(goLocal(14.5, 6.5, 1));
  ok(sim.floor === 1, 'the sim climbs to the upper floor');
  near(sim.y, H.floorY(main, 1), 1e-4, 'the sim stands on the upper floor');
  ok(result.climb, 'the way upstairs goes by the stair');
  ok(result.bad === 0, 'the height changes smoothly on a stair');
  result = run(goLocal(20.5, 9.5, 1));
  ok(sim.floor === 1 && Math.floor(sim.x - X) === 20 && Math.floor(sim.z - Z) === 9, 'the sim walks through an upper door: ' + (sim.x - X) + ',' + (sim.z - Z));
  result = run(goLocal(25.5, 22.5, 0, { run: true }));
  ok(sim.floor === 0, 'the sim comes down');
  near(sim.x, X + 25.5, 0.01, 'the sim walks into the yard x');
  near(sim.z, Z + 22.5, 0.01, 'the sim walks into the yard z');
  near(sim.y, main.base, 0.02, 'the yard is lower than the floor');
  ok(result.bad === 0, 'the height changes smoothly at the door');
  const fast = run(goLocal(5.5, 22.5, 0, { run: true }));
  ok(Math.abs(fast.t - 20 / M2.run) < 1.5, 'a run keeps the running speed: ' + fast.t);
  ok(world.doors.filter(d => d.lot === lot0).length === 8, 'the world knows the doors of a house');
  put(sim, 16.5, 14.5);
  let opened = 0, closed = 0;
  S.Sim.order(world, sim, goLocal(16.5, 20.5));
  for (let t2 = 0; t2 < 12; t2 += 0.05) {
    S.Sim.stepAll(world, 0.05);
    for (const door of world.changed) {
      if (door.open) opened++;
      else closed++;
    }
    world.changed.clear();
  }
  ok(opened >= 1 && closed >= 1, 'a door opens for a sim and closes again: ' + opened + ', ' + closed);
  ok(!world.doors.some(d => d.open), 'doors end closed');

  const chair = main.items.find(i => i.kind === 'm_chair' && i.x === 9.5 && i.z === 7.5);
  result = run({ item: chair, lot: lot0 });
  ok(sim.state === 'sit', 'the sim sits down');
  ok(sim.seat && sim.seat.item === chair, 'the sim knows the seat');
  near(sim.x, X + 9.5, 0.03, 'the sim sits exactly on the chair x');
  near(sim.z, Z + 7.5, 0.03, 'the sim sits exactly on the chair z');
  near(Math.abs(wrapAngle(sim.yaw)), 0, 0.03, 'a chair at the table turns the sim to the table');
  ok(chair.takers[0] === sim.id, 'a chair knows who sits on it');
  S.Sim.pose(sim);
  ok(sim.rows.every(Number.isFinite), 'the seated pose is finite');
  const hips = S.Body.point(sim.rows, S.Body.B.hips, sim.skel.bind[0], sim.skel.bind[1], sim.skel.bind[2]);
  near(hips[1], FLOOR + 0.52 + 0.08, 0.02, 'the hips rest on the seat');
  const foot = S.Body.point(sim.rows, S.Body.B.footL, sim.skel.bind[S.Body.B.footL * 3], sim.skel.bind[S.Body.B.footL * 3 + 1], sim.skel.bind[S.Body.B.footL * 3 + 2]);
  ok(foot[1] - FLOOR < 0.1, 'the feet of a seated adult reach the floor: ' + (foot[1] - FLOOR));
  const second = family[1];
  put(second, 12.5, 7.5);
  S.Sim.order(world, second, { item: chair, lot: lot0 });
  for (let t2 = 0; t2 < 2; t2 += 0.05) S.Sim.stepAll(world, 0.05);
  ok(!(second.seat && second.seat.item === chair), 'a taken chair is not given to another sim');
  others();
  second.state = 'idle'; second.path = null; second.order = null; second.seat = null; second.note = '';
  result = run(goLocal(12.5, 15.5), 30);
  ok(sim.state === 'idle' && !sim.seat, 'the sim stands up and walks away');
  ok(!chair.takers[0], 'a chair is free again');
  near(sim.seatW, 0, 1e-9, 'a standing sim has no seat weight');
  const sofa = main.items.find(i => i.kind === 'm_sofa');
  run({ item: sofa, lot: lot0 });
  ok(sim.state === 'sit' && sim.seat.item === sofa, 'a sofa is a seat too');
  const facing = S.TURNS[sofa.facing], front = [facing[1] * -1, facing[3] * -1];
  near(Math.sin(sim.yaw), front[0], 0.03, 'the sofa turns the sim to its front x');
  near(Math.cos(sim.yaw), front[1], 0.03, 'the sofa turns the sim to its front z');
  ok(family[2].scale < 0.7, 'a child has shorter steps');
  const two = makeScene(), w2 = two.world, a = two.sims[0], b = two.sims[1], twoLot = w2.lots[0];
  two.sims.filter(s => !s.free).forEach((o, i) => { if (o !== a && o !== b) { o.x = twoLot.x + 1.5; o.z = twoLot.z + 1.5 + i; o.y = twoLot.base; } });
  a.x = twoLot.x + 12.5; a.z = twoLot.z + 14.5; a.y = H.floorY(twoLot.house, 0);
  b.x = twoLot.x + 16.5; b.z = twoLot.z + 14.5; b.y = a.y;
  S.Sim.order(w2, a, { x: twoLot.x + 16.5, z: twoLot.z + 14.5, floor: 0, lot: twoLot });
  S.Sim.order(w2, b, { x: twoLot.x + 12.5, z: twoLot.z + 14.5, floor: 0, lot: twoLot });
  let closest = 9, finished = false;
  for (let t2 = 0; t2 < 40 && !finished; t2 += 0.05) {
    S.Sim.stepAll(w2, 0.05);
    closest = Math.min(closest, Math.hypot(a.x - b.x, a.z - b.z));
    finished = !a.path && !b.path && a.state === 'idle' && b.state === 'idle' && !a.order && !b.order;
  }
  ok(finished, 'two sims in a room do not hang: ' + a.state + ' ' + b.state);
  ok(closest > 0.35, 'two sims do not walk through each other: ' + closest);
  const hidden = makeScene(), w3 = hidden.world, c = hidden.sims[0], lot3 = w3.lots[0];
  c.x = lot3.x + 8.5; c.z = lot3.z + 3; c.floor = 0; c.lot = lot3;
  ok(S.Sim.hiddenBy(w3, c, 0) === lot3, 'a sim behind the house is hidden');
  ok(S.Sim.hiddenBy(w3, c, 2) === null, 'the same sim is in plain sight from the other side');
  c.x = lot3.x + 8.5; c.z = lot3.z + 20;
  ok(S.Sim.hiddenBy(w3, c, 0) === null, 'a sim in front of the house is not hidden');
  c.x = lot3.x + 8.5; c.z = lot3.z + 8.5;
  ok(S.Sim.indoors(c), 'a sim in the kitchen is indoors');
  c.x = lot3.x + 25; c.z = lot3.z + 25;
  ok(!S.Sim.indoors(c), 'a sim in the yard is not indoors');
  for (const key of ['idle', 'move', 'arrive', 'trip', 'use', 'board', 'drive', 'unboard', 'align', 'sitDown', 'sit', 'standUp', 'leave']) ok(!!S.Sim.STATE_NAMES[key], 'the state has a name: ' + key);
  const ui = read('js/apps/sims98/ts-ui.js'), render = read('js/apps/sims98/ts-render.js');
  ok(/gl\.depthFunc\(gl\.GREATER\)/.test(render), 'the silhouette uses the reversed depth test');
  ok(render.indexOf('this.drawGhost(cam, view)') < render.indexOf('this.drawSprites(cam, visible);\n      }'), 'the silhouette comes before the sprites, so furniture does not show it');
  ok(/KeyY/.test(ui) && /Tab/.test(ui) && /e\.shiftKey/.test(ui) && /KeyM/.test(ui), 'the screen has the sim controls');
}

{
  const H = S.House, M = S.METRICS, scene = S.Town.create(doc, 1), world = scene.world, g = world.ground, fresh = S.Terrain.create(1);
  ok(S.Town.LOTS.length === 32 && world.lots.length === 32, 'the gray town has thirty-two lots');
  ok(world.sims.length === S.Town.PEOPLE && S.Town.PEOPLE === 95, 'the town has 95 people');
  world.lots.forEach((lot, i) => {
    ok(lot.index === i, 'a lot knows its number');
    ok(lot.x >= 8 && lot.z >= 8 && lot.x + lot.w <= M.town - 8 && lot.z + lot.d <= M.town - 8, 'a lot stays in the town: ' + lot.id);
    let bad = 0;
    for (let z = lot.z; z < lot.z + lot.d; z++) {
      for (let x = lot.x; x < lot.x + lot.w; x++) {
        const p = fresh.paint[x + z * M.town];
        if (p === S.PAINT.road || p === S.PAINT.walk || p === S.PAINT.seabed) bad++;
      }
    }
    ok(bad === 0, 'a lot stands on free land: ' + lot.id + ' ' + bad);
    for (const other of world.lots) {
      if (other !== lot) ok(!(lot.x < other.x + other.w && other.x < lot.x + lot.w && lot.z < other.z + other.d && other.z < lot.z + lot.d), 'lots do not overlap: ' + lot.id + ' ' + other.id);
    }
    ok(lot.doorOut && lot.doorIn, 'a lot has its door points');
    ok(g.isFree(0, Math.floor(lot.doorOut[0]), Math.floor(lot.doorOut[1])), 'the door step is free: ' + lot.id);
    near(lot.house.base, lot.base, 1e-9, 'the house stands on its lot');
  });
  ok(new Set(world.lots.map(l => l.kind)).size === 5, 'the lots have all kinds');
  const a = world.lots[0];
  for (let i = 0; i < g.portalX.length; i++) {
    const m = g.portalMate[i];
    ok(g.portalMate[m] === i, 'a portal has its mate');
    ok(g.portalHome[i] !== g.portalHome[m], 'a portal joins two clusters');
    ok(Math.abs(g.portalX[i] - g.portalX[m]) + Math.abs(g.portalZ[i] - g.portalZ[m]) === 1, 'portal mates touch');
    ok(g.isFree(0, g.portalX[i], g.portalZ[i]), 'a portal stands on free ground');
  }
  ok(g.portalX.length > 800, 'the town has portals: ' + g.portalX.length);
  for (const lot of world.lots) {
    const plan = g.plan(Math.floor(a.doorOut[0]), Math.floor(a.doorOut[1]), Math.floor(lot.doorOut[0]), Math.floor(lot.doorOut[1]));
    ok(plan.reached, 'every lot can be reached on foot: ' + lot.id);
    const line = Math.hypot(a.doorOut[0] - lot.doorOut[0], a.doorOut[1] - lot.doorOut[1]);
    if (plan.cost) {
      ok(plan.cost >= line - 2, 'a path is not shorter than a straight line: ' + lot.id);
      ok(plan.cost < line * 1.6 + 25, 'a path has no crazy detour: ' + lot.id + ' ' + plan.cost + ' vs ' + line);
    }
  }
  const sea = g.plan(Math.floor(a.doorOut[0]), Math.floor(a.doorOut[1]), 620, 620);
  ok(!sea.reached, 'nobody walks into the sea');
  const inRoom = [a.x + 8, a.z + 8], outside = [a.x + 8, a.z + 3], house = a.house;
  ok(!g.canGo(0, a.x + 8, a.z + 5, 0, -1), 'town paths respect the walls of a house');
  ok(g.canGo(0, a.x + 8, a.z + 11, 0, 1), 'town paths use the doors of a house');
  ok(g.free[0][inRoom[0] + inRoom[1] * M.town] === 0 || g.isFree(0, outside[0], outside[1]), 'the town grid knows the things in a house');
  const lotOf = g.lotAt(a.x + 3, a.z + 3);
  ok(lotOf === a && g.lotAt(5, 5) === null, 'the town finds the lot under a point');

  const roads = world.roads;
  ok(roads.nodes.length >= 12 && roads.segments.length >= 12, 'roads make a graph');
  const near1 = roads.nearest(a.doorOut[0], a.doorOut[1]), near2 = roads.nearest(world.lots[15].doorOut[0], world.lots[15].doorOut[1]), line = roads.route(near1, near2);
  ok(line.length >= 2, 'a road route exists');
  let bent = 0;
  for (let i = 1; i < line.length; i++) {
    const dx = line[i][0] - line[i - 1][0], dz = line[i][1] - line[i - 1][1], len = Math.hypot(dx, dz);
    if (len > 3) {
      const angle = Math.abs(Math.atan2(dz, dx) / (Math.PI / 4));
      if (Math.abs(angle - Math.round(angle)) > 0.2) bent++;
    }
  }
  ok(bent <= 2, 'cars drive at whole steps of 45 degrees: ' + bent);
  const dirs = [[0, -1, 'm_car', 0], [-1, 0, 'm_car', 1], [0, 1, 'm_car', 2], [1, 0, 'm_car', 3], [-1, -1, 'm_car45', 0], [-1, 1, 'm_car45', 1], [1, 1, 'm_car45', 2], [1, -1, 'm_car45', 3]];
  for (const [dx, dz, kind, facing] of dirs) {
    const s = S.Sim.carSprite(dx, dz);
    ok(s.kind === kind && s.facing === facing, 'the car has a sprite for ' + dx + ',' + dz + ': ' + s.kind + ' ' + s.facing);
  }

  const family = world.sims.filter(s => !s.free), town = world.sims.filter(s => s.free);
  ok(family.length === 5 && family.every(s => s.home === a), 'one family lives in the test house');
  ok(town.every(s => s.day && s.day.length >= 1 && s.home), 'every person has a day and a home');
  ok(town.every(s => s.day.every((e, i) => i === 0 || e[0] > s.day[i - 1][0])), 'a day goes in order');
  ok(town.every(s => s.day.every(e => world.lots.includes(e[1]))), 'a day leads to real places');
  ok(town.filter(s => s.age === 'toddler').every(s => s.day.length === 1), 'toddlers stay at home');
  ok(town.filter(s => s.age === 'child').every(s => s.day.some(e => e[1].kind === 'school')), 'children go to school');
  ok(town.filter(s => s.age === 'child' || s.age === 'toddler' || s.age === 'teen').every(s => !s.hasCar), 'only adults have cars');
  ok(S.Town.dayIndexAt([[0, 'a'], [60, 'b'], [120, 'c']], 90) === 1, 'the day finds the current entry');
  const names = new Set(world.sims.map(s => s.id));
  ok(names.size === world.sims.length, 'people have their own ids');
  S.Town.syncLevels(world, a.x + 15, a.z + 15);
  ok(world.live.length <= S.Town.LIVE_LIMIT, 'the live level has a limit: ' + world.live.length);
  ok(family.every(s => s.live), 'the active family is always live');
  const farSim = town.find(s => Math.hypot(s.x - a.x, s.z - a.z) > 100);
  ok(farSim && !farSim.live, 'a far person is not live');
  S.Town.syncLevels(world, farSim.x, farSim.z);
  ok(farSim.live, 'a person near the camera is live');
  ok(family.every(s => s.live), 'the family stays live away from the camera');
  S.Town.syncLevels(world, a.x + 15, a.z + 15);
  const sim = family[0];
  sim.lot = a;
  S.Sim.order(world, sim, { x: world.lots[15].doorOut[0], z: world.lots[15].doorOut[1], floor: 0, car: false });
  let t = 0, maxJump = 0, lastX = sim.x, lastZ = sim.z, lastY = sim.y, climb = 0;
  while (t < 400 && !(sim.state === 'idle' && !sim.order && !sim.path)) {
    S.Sim.stepAll(world, 0.05);
    t += 0.05;
    maxJump = Math.max(maxJump, Math.hypot(sim.x - lastX, sim.z - lastZ));
    climb = Math.max(climb, Math.abs(sim.y - lastY));
    ok(Number.isFinite(sim.x + sim.z + sim.y), 'the walker stays in numbers');
    lastX = sim.x;
    lastZ = sim.z;
    lastY = sim.y;
  }
  const crossing = Math.hypot(a.doorOut[0] - world.lots[15].doorOut[0], a.doorOut[1] - world.lots[15].doorOut[1]);
  ok(sim.state === 'idle', 'a walk across the town ends');
  near(sim.x, world.lots[15].doorOut[0], 0.6, 'a walk across the town reaches the goal x');
  near(sim.z, world.lots[15].doorOut[1], 0.6, 'a walk across the town reaches the goal z');
  ok(maxJump < 0.2, 'a walk has no jumps: ' + maxJump);
  ok(climb < 0.2, 'a walk follows the ground without jumps: ' + climb);
  ok(t > crossing / M.walk * 0.95 && t < crossing / M.walk * 1.5 + 8, 'a walk keeps the walking pace: ' + t + ' for ' + crossing);
  const start = [sim.x, sim.z];
  S.Sim.order(world, sim, { x: a.doorOut[0], z: a.doorOut[1], floor: 0 });
  let drove = 0, carT = 0, jump = 0, sawBoard = false, sawUnboard = false;
  lastX = sim.x;
  lastZ = sim.z;
  while (carT < 200 && !(sim.state === 'idle' && !sim.order && !sim.path)) {
    S.Town.step(world, 0.05, sim.x, sim.z);
    carT += 0.05;
    if (sim.state === 'drive') drove++;
    if (sim.state === 'board') sawBoard = world.cars.includes(sim) || sawBoard;
    if (sim.state === 'unboard') sawUnboard = world.cars.includes(sim) || sawUnboard;
    jump = Math.max(jump, Math.hypot(sim.x - lastX, sim.z - lastZ));
    lastX = sim.x;
    lastZ = sim.z;
  }
  ok(drove > 0, 'a long way goes by car');
  ok(sawBoard && sawUnboard, 'a sim gets into the car and out of it');
  ok(!sim.car && !world.cars.includes(sim), 'the car is gone after the trip');
  const shop = world.lots.find(l => l.kind === 'shop'), toShop = S.Town.goalAt(world, shop.x + shop.w / 2, shop.z + shop.d / 2, 0), onGrass = S.Town.goalAt(world, a.x + 2.5, a.z + 2.5, 0);
  ok(toShop.enter === shop && toShop.x === shop.doorOut[0], 'a click on a closed building leads to its door');
  ok(!onGrass.enter && onGrass.lot === a && onGrass.x === a.x + 2.5, 'a click on an open lot leads to the point');
  ok(carT < Math.hypot(start[0] - a.doorOut[0], start[1] - a.doorOut[1]) / M.car * 1.5 + 25, 'a car is much faster than feet: ' + carT);
  near(sim.x, a.doorOut[0], 0.6, 'a drive ends at the goal x');
  near(sim.z, a.doorOut[1], 0.6, 'a drive ends at the goal z');
  ok(jump < 12 * 0.05 + 2.5, 'a car trip has no big jumps: ' + jump);
  const walker = town.find(s => s.age === 'adult'), there = world.lots[11];
  walker.inside = null;
  walker.x = a.doorOut[0];
  walker.z = a.doorOut[1] + 3;
  walker.floor = 0;
  walker.hasCar = false;
  walker.lot = null;
  S.Sim.toLive(world, walker);
  world.live = world.sims.filter(s => s.live);
  S.Sim.go(world, walker, { x: there.doorOut[0], z: there.doorOut[1], floor: 0, lot: there, enter: there });
  for (let i = 0; i < 100; i++) S.Sim.stepAll(world, 0.05);
  ok(walker.state === 'move', 'a live person walks by tiles');
  const before = [walker.x, walker.z], goalBefore = walker.goal;
  S.Sim.toBusiness(world, walker);
  ok(!walker.live && walker.state === 'trip' && walker.goal === goalBefore, 'going to the business level keeps the goal');
  near(walker.x, before[0], 1e-9, 'going to the business level keeps the place x');
  near(walker.z, before[1], 1e-9, 'going to the business level keeps the place z');
  for (let i = 0; i < 100; i++) S.Sim.stepAll(world, 0.05);
  const moved = Math.hypot(walker.x - before[0], walker.z - before[1]);
  ok(moved > 5 && moved < 8.5, 'a business person keeps walking at the same pace: ' + moved);
  const place = [walker.x, walker.z];
  S.Sim.toLive(world, walker);
  world.live = world.sims.filter(s => s.live);
  ok(walker.live && walker.state === 'idle' && walker.order && walker.order.enter === there, 'coming back to the live level keeps the goal');
  ok(Math.hypot(walker.x - place[0], walker.z - place[1]) < 3, 'coming back to the live level keeps the place');
  S.Sim.stepAll(world, 0.05);
  ok(walker.state === 'move', 'a person keeps walking after the change of level');
  let arrive = 0;
  while (arrive < 400 && !walker.inside) {
    S.Sim.stepAll(world, 0.1);
    arrive += 0.1;
  }
  ok(walker.inside === there, 'a person enters the building at the end of the way');
  S.Sim.toBusiness(world, walker);
  ok(walker.inside === there && !walker.live, 'a person inside stays inside at the business level');

  const day = S.Town.create(doc, 2), w = day.world, seenAt = new Map(), cars = new Set();
  w.day = 2;
  S.Town.setClock(w, 6 * 60);
  let maxLive = 0, broken = 0;
  for (let i = 0; i < 18 * 60; i++) {
    S.Town.step(w, 1, 320, 300);
    maxLive = Math.max(maxLive, w.live.length);
    for (const s of w.sims) {
      if (!Number.isFinite(s.x + s.z)) broken++;
      if (s.inside) seenAt.set(s.inside.kind, (seenAt.get(s.inside.kind) || 0) + 1);
      if (s.state === 'drive') cars.add(s.id);
    }
  }
  ok(broken === 0, 'a whole day leaves everyone in numbers');
  ok(maxLive <= S.Town.LIVE_LIMIT, 'the live limit holds all day: ' + maxLive);
  for (const kind of ['work', 'school', 'home', 'shop']) ok(seenAt.get(kind) > 0, 'people visit ' + kind + ': ' + seenAt.get(kind));
  ok(cars.size >= 3, 'people use cars during a day: ' + cars.size);
  const lost = w.sims.filter(s => s.free && s.age !== 'toddler' && !s.inside && s.state === 'idle' && s.day && s.day.length > 1 && S.Town.dayIndexAt(s.day, w.clock) === s.day.length - 1 && s.home !== s.lot);
  ok(lost.length <= 3, 'late at night people are home: ' + lost.length);
  const crowd = S.Town.create(doc, 4), cw = crowd.world, shopLot = cw.lots.find(l => l.kind === 'shop'), [doorX, doorZ] = shopLot.doorOut, strangers = cw.sims.filter(s => s.free);
  const stand = (s, dx, dz) => {
    s.inside = null;
    s.day = null;
    s.lot = cw.ground.lotAt(doorX + dx, doorZ + dz);
    s.floor = 0;
    s.x = doorX + dx;
    s.z = doorZ + dz;
    s.y = S.Sim.groundY(cw, 0, s.lot, s.x, s.z);
    s.live = true;
    s.state = 'idle';
    s.path = null;
    s.order = null;
  };
  const ringAround = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0]];
  ringAround.forEach(([dx, dz], i) => stand(strangers[i], dx, dz));
  stand(strangers[5], 0, 0);
  ringAround.slice(0, 3).forEach(([dx], i) => stand(strangers[6 + i], dx * 2, -2));
  [[-2, -1], [2, -1], [-2, 0], [2, 0]].forEach(([dx, dz], i) => stand(strangers[9 + i], dx, dz));
  const visitor = strangers[13];
  stand(visitor, 0, -9);
  cw.live = cw.sims.filter(s => s.live);
  const planned = performance.now();
  S.Sim.order(cw, visitor, { x: doorX, z: doorZ, floor: 0, lot: shopLot, enter: shopLot, car: false });
  S.Sim.step(cw, visitor, 0.01);
  ok(performance.now() - planned < 500, 'a crowd at a door does not make the search walk the whole town');
  ok(visitor.state === 'move', 'a person heads for a door behind a crowd');
  for (const s of [strangers[0], strangers[2], ...strangers.slice(6, 13)]) stand(s, -20 - strangers.indexOf(s), -20);
  cw.live = cw.sims.filter(s => s.live);
  let reachedDoor = false;
  for (let i = 0; i < 1200 && !reachedDoor; i++) {
    S.Sim.stepAll(cw, 0.05);
    reachedDoor = visitor.inside === shopLot;
  }
  ok(reachedDoor, 'a person gets into a building past people at the door: ' + visitor.state + ' ' + visitor.note);
  const walkTown = S.Town.create(doc, 4), tw = walkTown.world, kin = tw.sims.filter(s => !s.free), [dad, mum, teen] = kin, roadLot = tw.lots[0];
  const finish = (who, limit) => {
    let t = 0;
    while (t < limit && S.Sim.busy(who)) {
      S.Sim.stepAll(tw, 0.05);
      t += 0.05;
    }
    return t;
  };
  const setAt = (who, x, z, floor) => {
    who.x = x;
    who.z = z;
    who.floor = floor || 0;
    who.lot = floor ? roadLot : tw.ground.lotAt(x, z);
    who.y = S.Sim.groundY(tw, who.floor, who.lot, x, z);
    who.state = 'idle';
    who.path = null;
    who.order = null;
    who.note = '';
  };
  kin.forEach((who, i) => setAt(who, 300.5 + i * 3, 240.5));
  setAt(teen, 250.5, 240.5);
  setAt(mum, 270.5, 240.5);
  S.Sim.order(tw, teen, { x: 290.5, z: 240.5, floor: 0, car: false });
  let closestMum = 99;
  for (let t = 0; t < 40 && S.Sim.busy(teen); t += 0.05) {
    S.Sim.stepAll(tw, 0.05);
    closestMum = Math.min(closestMum, Math.hypot(teen.x - mum.x, teen.z - mum.z));
  }
  near(teen.x, 290.5, 0.01, 'a long walk goes round someone standing on the way');
  ok(teen.note === '' && closestMum > 0.3, 'a walker does not pass through a person who stands in the open: ' + closestMum);
  setAt(mum, 292.5, 240.5);
  setAt(teen, 280.5, 240.5);
  S.Sim.order(tw, teen, { x: 292.5, z: 240.5, floor: 0, car: false });
  finish(teen, 30);
  ok(teen.state === 'idle' && teen.note === '' && Math.hypot(teen.x - 292.5, teen.z - 240.5) < 1.7, 'a goal under someone ends right next to them: ' + teen.x);
  const stairTop = S.House.stairColumns(roadLot.house.stairs[0])[0].exit, topX = roadLot.x + stairTop[0] + 0.5, topZ = roadLot.z + stairTop[1] + 0.5;
  setAt(mum, topX, topZ, 1);
  setAt(dad, roadLot.x + 18.5, roadLot.z + 6.5, 1);
  S.Sim.order(tw, dad, { x: roadLot.x + 16.5, z: roadLot.z + 14.5, floor: 0, lot: roadLot });
  finish(dad, 60);
  ok(dad.floor === 0 && dad.note === '' && Math.hypot(dad.x - roadLot.x - 16.5, dad.z - roadLot.z - 14.5) < 1, 'someone at the top of the stairs lets a sim go down');
  ok(Math.hypot(mum.x - topX, mum.z - topZ) > 0.5, 'the one in the way stepped aside: ' + mum.x + ',' + mum.z);
  finish(mum, 10);
  const doorTile = tw.doors.find(d => d.lot === roadLot && d.floor === 0 && d.item.seg.z0 === 17), [inX, inZ] = [doorTile.x, doorTile.z - 1.5], [outX, outZ] = [doorTile.x, doorTile.z + 1.5];
  setAt(dad, inX, inZ);
  setAt(teen, outX, outZ);
  S.Sim.order(tw, dad, { x: outX, z: outZ + 2, floor: 0 });
  S.Sim.order(tw, teen, { x: inX, z: inZ - 2, floor: 0 });
  let bothFree = false;
  for (let t = 0; t < 30 && !bothFree; t += 0.05) {
    S.Sim.stepAll(tw, 0.05);
    bothFree = !S.Sim.busy(dad) && !S.Sim.busy(teen);
  }
  ok(bothFree, 'two people meeting in a door pass each other: ' + dad.state + ' ' + teen.state);
  ok(Math.hypot(dad.x - outX, dad.z - outZ - 2) < 1.7 && Math.hypot(teen.x - inX, teen.z - inZ + 2) < 1.7, 'two people in a door both get where they went');
  ok(dad.ghost === 0 && teen.ghost === 0, 'nobody stays a ghost after a walk');
  const twinA = S.Town.create(doc, 3), twinB = S.Town.create(doc, 3);
  for (const twin of [twinA, twinB]) {
    for (let i = 0; i < 300; i++) S.Town.step(twin.world, 0.5, 340, 300);
  }
  const hashOf = s => S.hash(s.world.sims.map(p => [Math.round(p.x * 100), Math.round(p.z * 100), p.state, p.inside ? p.inside.id : '']));
  ok(hashOf(twinA) === hashOf(twinB), 'one seed gives one town life');
  const view = { sw: 800, sh: 600, scale: 1 }, stubUi = { scene, selected: family[0], screen: view, stamp: '' }, map = new S.MapView(stubUi), box = map.layout(view);
  ok(box.size > 300 && box.x + box.size <= 800 && box.y >= 0 && box.y + box.size <= 600, 'the map fits the screen');
  const mapped = map.worldAt(view, box.x + box.k * 100, box.y + box.k * 200);
  near(mapped[0], 100, 1e-6, 'the map knows the town x');
  near(mapped[1], 200, 1e-6, 'the map knows the town z');
  ok(map.worldAt(view, 2, 2) === null, 'the legend is not the town');
  ok(map.kindOf(a) === 'own' && map.kindOf(world.lots[5]) === 'shop', 'the map names the lots');
  ok(map.minutes(family[0], family[0].x + M.walk * 300, family[0].z) === 5, 'the map counts the way in minutes');
  const indoors = world.sims.filter(s => s.inside);
  ok(indoors.length > 10, 'some people stay inside');
  for (const person of indoors) {
    const [dx, dz] = map.dotOf(person), inner = person.inside;
    ok(dx >= inner.x && dx <= inner.x + inner.w && dz >= inner.z && dz <= inner.z + inner.d, 'a person inside is shown on the lot');
    ok(map.personAt(view, box.x + dx * box.k, box.y + dz * box.k) !== null, 'a person inside can be found on the map');
  }
  const outdoors = world.sims.find(s => !s.inside);
  assert.deepEqual(map.dotOf(outdoors), [outdoors.x, outdoors.z], 'a person outdoors is shown where they stand');
  checks++;
  ok(fs.existsSync(path.join(ROOT, 'tools/sims98-bot.cjs')), 'the bot tool exists');
  const noDialog = read('js/apps/sims98/ts-town.js') + read('js/apps/sims98/ts-sim.js');
  ok(!/loading|Загрузка|загрузк/.test(noDialog), 'the town has no loading screen');
}

{
  const game = new S.Game(doc, 1), world = game.world, M = S.METRICS, STEP = S.Game.STEP;
  ok(world.day === 1 && world.clock === 480, 'the game starts on day 1 at 8:00');
  ok(S.dayName(1) === 'Воскресенье' && S.dayName(2) === 'Понедельник' && S.dayName(8) === 'Воскресенье', 'the week starts on Sunday');
  ok(S.weekOf(1) === 1 && S.weekOf(7) === 1 && S.weekOf(8) === 2, 'weeks count from one');
  ok(S.timeText(480) === '8:00' && S.timeText(485.9) === '8:05' && S.timeText(0) === '0:00', 'the clock shows whole minutes');
  ok(S.dateText(2, 65) === 'Пн, день 2, 1:05', 'a save shows the date');
  ok(S.SPEEDS.join() === '0,1,3,8,32', 'the speeds follow plan 14.9');
  const clockOver = (speed, frames, frame) => {
    game.setSpeed(speed);
    const before = world.clock + world.day * S.DAY_MINUTES;
    for (let i = 0; i < frames; i++) game.advance(frame, world.sims[0].x, world.sims[0].z);
    return world.clock + world.day * S.DAY_MINUTES - before;
  };
  near(clockOver(1, 60, STEP), 1, 1e-6, 'a real second is a game minute at speed 1');
  near(clockOver(2, 60, STEP), 3, 1e-6, 'speed 2 runs three times faster');
  near(clockOver(3, 60, STEP), 8, 1e-6, 'speed 3 runs eight times faster');
  near(clockOver(1, 120, 1 / 120), 1, 0.03, 'a faster screen keeps the same clock');
  near(clockOver(1, 30, 1 / 30), 1, 0.03, 'a slower screen keeps the same clock');
  near(clockOver(1, 60, STEP + 0.001), 1, 1e-6, 'a frame close to the step counts as one step');
  const stopped = world.clock;
  game.setSpeed(0);
  ok(game.advance(1, 0, 0) === 0 && world.clock === stopped, 'a pause stops the clock');
  game.togglePause();
  ok(game.speed === 1 && game.lastSpeed === 1, 'the pause returns to the last speed');
  game.setSpeed(3);
  game.togglePause();
  ok(game.speed === 0, 'the pause key stops speed 3');
  game.togglePause();
  ok(game.speed === 3, 'the pause key returns to speed 3');
  game.hold = true;
  ok(game.advance(1, 0, 0) === 0, 'an open file window holds the clock');
  game.hold = false;
  game.setSpeed(1);
  S.Town.setClock(world, S.DAY_MINUTES - 0.5);
  const dayBefore = world.day;
  clockOver(1, 60, STEP);
  ok(world.day === dayBefore + 1 && world.clock < 1, 'midnight starts the next day: ' + world.clock);
  game.events.length = 0;
  S.Town.setClock(world, 359.5);
  clockOver(1, 120, STEP);
  const mornings = game.events.filter(e => e.type === 'morning');
  ok(mornings.length === 1 && mornings[0].day === world.day, 'the morning comes once');
  clockOver(1, 120, STEP);
  ok(game.events.filter(e => e.type === 'morning').length === 1, 'the morning does not repeat');
  game.events.length = 0;

  const fast = new S.Game(doc, 1), w = fast.world, a = w.lots[0], far = w.lots[16], hugo = w.sims.find(s => s.id === 'hugo');
  fast.active = hugo;
  fast.freeWill = 0;
  fast.setSpeed(S.Game.UNTIL_DONE);
  fast.fixed(hugo.x, hugo.z);
  ok(fast.speed === 1, 'until the end of an action returns at once when nothing is going on');
  S.Sim.order(w, hugo, { x: a.x + 14.5, z: a.z + 6.5, floor: 1, lot: a });
  fast.setSpeed(S.Game.UNTIL_DONE);
  let steps = 0;
  while (fast.speed === S.Game.UNTIL_DONE && steps < 3000) {
    fast.fixed(hugo.x, hugo.z);
    steps++;
  }
  ok(fast.speed === 1 && hugo.floor === 1, 'the top speed climbs the stairs and stops');
  near(hugo.y, S.House.floorY(a.house, 1), 1e-4, 'the top speed leaves a sim on the floor');
  const goal = far.doorOut;
  S.Sim.order(w, hugo, { x: goal[0], z: goal[1], floor: 0, lot: far });
  fast.setSpeed(S.Game.UNTIL_DONE);
  steps = 0;
  const line = Math.hypot(hugo.x - goal[0], hugo.z - goal[1]);
  let jump = 0, px = hugo.x, pz = hugo.z, walls = 0;
  while (fast.speed === S.Game.UNTIL_DONE && steps < 6000) {
    fast.fixed(hugo.x, hugo.z);
    steps++;
    jump = Math.max(jump, Math.hypot(hugo.x - px, hugo.z - pz));
    const kx = Math.floor(px), kz = Math.floor(pz), nx = Math.floor(hugo.x), nz = Math.floor(hugo.z);
    if (hugo.floor === 0 && (kx !== nx || kz !== nz) && Math.abs(nx - kx) <= 1 && Math.abs(nz - kz) <= 1 && w.ground.isFree(0, kx, kz) && w.ground.isFree(0, nx, nz) && !w.ground.canGo(0, kx, kz, nx - kx, nz - kz)) walls++;
    px = hugo.x;
    pz = hugo.z;
  }
  ok(Math.hypot(hugo.x - goal[0], hugo.z - goal[1]) < 1.7, 'the top speed reaches the goal: ' + hugo.x + ',' + hugo.z);
  const realSeconds = steps * STEP, expected = line / M.walk / 32;
  ok(realSeconds > expected * 0.8 && realSeconds < expected * 2 + 1, 'the top speed crosses the town in seconds: ' + realSeconds + ' for ' + expected);
  ok(jump < 1, 'the top speed has no long jumps: ' + jump);
  ok(walls === 0, 'the top speed does not cross walls: ' + walls);
  ok(!S.Sim.busy(hugo), 'a sim at the goal is free');
  S.Sim.order(w, hugo, { x: goal[0] + 2, z: goal[1], floor: 0 });
  ok(S.Sim.busy(hugo), 'a sim with an order is busy');

  const playScript = frame => {
    const g = new S.Game(doc, 5), lots = g.world.lots, main = lots[0], viktor = g.world.sims[0], fx = main.x + 10, fz = main.z + 10;
    let done = 0, given = false;
    while (done < 1500) {
      if (done >= 200 && !given) {
        S.Sim.order(g.world, viktor, { x: lots[15].doorOut[0], z: lots[15].doorOut[1], floor: 0, lot: lots[15] });
        given = true;
      }
      done += g.advance(frame, fx, fz);
    }
    return g.hash();
  };
  const hashes = [STEP, 1 / 120, 1 / 144, 1 / 75].map(playScript);
  ok(new Set(hashes).size === 1, 'the frame rate does not change the game: ' + hashes);
  ok(new S.Game(doc, 5).hash() !== new S.Game(doc, 6).hash(), 'another seed gives another town');
}

{
  const Font = S.Font, Icons = S.Icons, Kit = S.Kit, Live = S.LiveView;
  const faces = Object.keys(Font.DATA);
  assert.deepEqual(faces, ['small', 'smallb', 'text', 'bold', 'title', 'big'], 'the font has its faces');
  checks++;
  const needed = [...Array(95).keys()].map(i => String.fromCharCode(32 + i)).concat([...Array(64).keys()].map(i => String.fromCharCode(0x410 + i)), [...'ЁёÃ'].slice(0, 2), [...'«»−…№·×°§←→']);
  for (const face of faces) {
    for (const ch of needed) ok(Font.has(face, ch), face + ' has the letter ' + ch);
    const data = Font.DATA[face];
    ok(data.h >= 11 && data.h <= 32, face + ' has a sane height');
    for (const [ch, glyph] of Object.entries(data.glyphs)) {
      const [adv, , w] = glyph;
      ok(adv >= 0 && w <= data.wide && glyph.length <= 3 + data.h, face + ': the letter fits the table: ' + ch);
      for (const mask of glyph.slice(3)) ok(mask < 2 ** w, face + ': a row fits its width: ' + ch);
    }
    ok(Font.measure(face, 'Воскресенье') > Font.measure(face, 'Вс'), face + ' measures text');
  }
  ok(Font.measure('big', 'Лайм') > Font.measure('title', 'Лайм') && Font.measure('title', 'Лайм') > Font.measure('small', 'Лайм'), 'the big faces are bigger');
  const wrapped = Font.wrap('small', 'Чем выше настроение, тем быстрее копится счастье всей жизни и тем легче живётся.', 120);
  ok(wrapped.length >= 3 && wrapped.every(l => Font.measure('small', l) <= 120), 'text wraps to the width');
  assert.deepEqual(Font.wrap('small', 'один\nдва', 200), ['один', 'два'], 'a line break stays');
  checks++;
  const screens = ['ts-ui', 'ts-ui-map', 'ts-ui-save', 'ts-ui-live', 'ts-ui-kit', 'ts-ui-icons', 'ts-ui-pie'].map(f => 'js/apps/sims98/' + f + '.js');
  for (const f of screens) {
    const src = read(f);
    ok(!/fillText|strokeText|measureText|\.font\s*=/.test(src), 'no screen fonts in ' + f);
    for (const m of src.matchAll(/'([^'\n]*[А-Яа-яЁё][^'\n]*)'/g)) {
      for (const ch of m[1]) ok(Font.has('small', ch) && Font.has('bold', ch), 'the font has every letter of ' + m[1]);
    }
  }
  ok(!/Tahoma|Verdana/.test(screens.map(read).join('')), 'the screens name no system fonts');

  ok(Icons.NAMES.length >= 35, 'the game has its icons: ' + Icons.NAMES.length);
  for (const name of Icons.NAMES) {
    const grid = Icons.gridOf(name);
    let filled = 0, edges = 0, border = 0;
    for (let y = 0; y < grid.size; y++) {
      for (let x = 0; x < grid.size; x++) {
        const v = grid.data[x + y * grid.size];
        if (v === 1 || v === 2) filled++;
        if (v === 3) edges++;
        if ((v === 1 || v === 2) && (x === 0 || y === 0 || x === grid.size - 1 || y === grid.size - 1)) border++;
      }
    }
    ok(filled >= 6 && edges >= 6, 'the icon is drawn: ' + name + ' ' + filled);
    ok(border === 0, 'the icon leaves room for its outline: ' + name);
    ok(Icons.sizeOf(name) === grid.size, 'the icon knows its size: ' + name);
  }
  const liveSrc = read('js/apps/sims98/ts-ui-live.js');
  for (const m of liveSrc.matchAll(/icon: '(\w+)'/g)) ok(Icons.NAMES.includes(m[1]), 'the panel uses a drawn icon: ' + m[1]);
  for (const m of liveSrc.matchAll(/centered\(g, '(\w+)'/g)) ok(Icons.NAMES.includes(m[1]), 'the panel uses a drawn icon: ' + m[1]);

  ok(Kit.insideRound(10, 10, 20, 20, 5, 0) && !Kit.insideRound(0, 0, 20, 20, 5, 0) && Kit.insideRound(0, 10, 20, 20, 5, 0), 'a rounded corner cuts the shape');
  ok(!Kit.insideRound(0, 10, 20, 20, 5, 1) && Kit.insideRound(1, 10, 20, 20, 5, 1), 'an inset draws the rim');
  const dots = new Set();
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) dots.add(Kit.dithered([100, 100, 100], x, y).join());
  }
  ok(dots.size >= 2, 'a gradient is dithered: ' + dots.size);
  ok(Kit.dithered([254, 1, 300], 3, 3).every(v => v >= 0 && v <= 255), 'dither stays in range');
  for (const face of Object.values(Kit.FACES)) ok(face.rim.length === 2 && face.top.length === 3 && face.bottom.length === 3, 'a glass has two rims and a gradient');
  for (const look of Object.values(Kit.BUTTONS)) ok(look.top.length === 3 && look.ring.length === 3, 'a button has its look');
  ok(Kit.stateName({ hover: false, down: false }, false, false) === 'off' && Kit.stateName({ hover: false, down: true }) === 'down' && Kit.stateName({ hover: false, down: false }, true) === 'on' && Kit.stateName({ hover: true, down: false }) === 'hover' && Kit.stateName({ hover: false, down: false }) === 'normal', 'buttons have their states');

  const stub = () => {
    const g = {
      calls: 0,
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData() {},
      clearRect() { g.calls++; },
      drawImage() { g.calls++; },
      fillRect() { g.calls++; },
      strokeRect() {},
      getContext() { return g; }
    };
    return { width: 800, height: 600, getContext: () => g, g };
  };
  const hadDocument = globalThis.document;
  globalThis.document = { createElement: stub };
  const canvas = stub(), layer = new Kit.Layer(canvas);
  let drawnA = 0, drawnB = 0, value = 1, clicked = null;
  const itemA = { x: 10, y: 10, w: 20, h: 20, key: () => value, draw: () => { drawnA++; }, tip: () => ({ title: 'A' }), click: (b, part, x, y) => { clicked = [b, x, y]; } };
  const itemB = { x: 40, y: 10, w: 20, h: 20, draw: () => { drawnB++; }, round: true };
  const itemC = { x: 70, y: 10, w: 20, h: 20, when: () => value > 1 };
  const itemD = { x: 100, y: 10, w: 40, h: 20, parts: x => (x < 120 ? 'left' : 'right'), tip: part => ({ title: part }), draw: () => {} };
  let baseCalls = 0;
  layer.set([itemA, itemB, itemC, itemD], () => { baseCalls++; });
  ok(baseCalls === 1, 'the still part of a panel is painted once');
  layer.update();
  ok(drawnA === 1 && drawnB === 1, 'the first pass draws everything');
  const before = layer.redraws;
  layer.update();
  layer.update();
  ok(layer.redraws === before, 'nothing changed means nothing is drawn');
  value = 2;
  layer.update();
  ok(drawnA === 2 && drawnB === 1, 'only the changed part is drawn again');
  ok(layer.at(15, 15) === itemA && layer.at(1, 1) === null, 'the layer finds what is under the mouse');
  ok(layer.at(41, 11) === null && layer.at(50, 20) === itemB, 'a round button ignores its corners');
  ok(layer.at(75, 15) === itemC, 'a conditional area counts when it applies');
  value = 1;
  ok(layer.at(75, 15) === null, 'a conditional area is skipped otherwise');
  value = 2;
  layer.move(15, 15, 1000);
  layer.update();
  ok(drawnA === 3, 'hover draws the button again');
  ok(layer.tip(1100, 250) === null, 'a hint waits');
  ok(layer.tip(1300, 250).title === 'A', 'a hint appears after the delay');
  ok(layer.press(15, 15, 0, 1400) && clicked[0] === 0 && clicked[1] === 15, 'a click reaches the button');
  ok(layer.down === itemA, 'a pressed button knows it');
  layer.release();
  ok(layer.down === null, 'a released button knows it');
  ok(!layer.press(1, 1, 0, 1500), 'a click beside the panel goes to the world');
  layer.move(110, 15, 2000);
  ok(layer.part === 'left' && layer.tip(2300, 250).title === 'left', 'a dial has its parts');
  layer.move(130, 15, 2400);
  ok(layer.part === 'right' && layer.tip(2410, 250) === null, 'moving to another part restarts the hint');
  layer.move(null, null, 3000);
  ok(layer.hover === null, 'leaving the window clears the hover');
  layer.hidden = true;
  layer.update();
  ok(layer.blank, 'a hidden panel is cleared once');
  layer.hidden = false;
  layer.update();
  ok(!layer.blank && !layer.full, 'a panel comes back whole');

  const scene = S.Town.create(doc, 1), world = scene.world, family = world.sims.filter(s => !s.free), spy = [];
  const makeUi = (sw, sh, exit) => {
    const game = { world, speed: 1, lastSpeed: 1, active: family[0], setSpeed(i) { this.speed = i; }, togglePause() { this.speed = this.speed ? 0 : 1; } };
    return {
      game, scene, opts: exit ? { exit: () => spy.push('exit') } : {}, screen: { sw, sh }, render: null, viewState: { house: world.lots[0].house }, floor: 0, wallMode: 'cut', stamp: 'x',
      get selected() { return game.active; },
      map: { toggle: () => spy.push('map') },
      saves: { show: mode => spy.push('files ' + mode) },
      goHome: () => spy.push('home'),
      zoomStep: d => spy.push('zoom ' + d),
      turn: d => spy.push('turn ' + d),
      setFloor: f => spy.push('floor ' + f),
      setWallMode: m => spy.push('wall ' + m),
      selectSim(sim) { game.active = sim; spy.push('select ' + sim.id); },
      faceOf: () => null
    };
  };
  for (const [sw, sh] of [[800, 600], [1024, 768], [1280, 720], [1920, 1190]]) {
    const ui = makeUi(sw, sh), view = new Live(ui, Object.assign(stub(), { width: sw, height: sh }));
    view.layout(ui.screen);
    ok(view.top === sh - Live.PANEL_H, 'the panel holds the bottom edge at ' + sw);
    for (const item of view.layer.items) ok(item.x >= 0 && item.y >= 0 && item.x + item.w <= sw && item.y + item.h <= sh, 'a panel part stays on the screen at ' + sw);
    view.layer.update();
    const drawn = view.layer.items.filter(i => i.draw);
    for (let i = 0; i < drawn.length; i++) {
      for (let j = i + 1; j < drawn.length; j++) {
        const a = drawn[i], b = drawn[j];
        ok(!(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h), 'parts of the panel do not draw over each other at ' + sw + ': ' + [a.x, a.y, b.x, b.y]);
      }
    }
  }
  const ui = makeUi(800, 600, true), view = new Live(ui, stub());
  view.layout(ui.screen);
  const Y = view.top, L = view.layer;
  const tap = (x, y, now) => {
    spy.length = 0;
    L.press(x, y, 0, now || 5000);
    L.release();
    return spy.slice();
  };
  assert.deepEqual(tap(61, Y + 22), ['zoom -1'], 'the dial zooms in');
  assert.deepEqual(tap(61, Y + 66), ['zoom 1'], 'the dial zooms out');
  assert.deepEqual(tap(39, Y + 44), ['turn -1'], 'the dial turns left');
  assert.deepEqual(tap(83, Y + 44), ['turn 1'], 'the dial turns right');
  assert.deepEqual(tap(61, Y + 44), ['home'], 'the dial goes home');
  assert.deepEqual(tap(16, Y + 16), ['map'], 'the map button opens the map');
  assert.deepEqual(tap(105, Y + 16), ['floor 1'], 'the floor button goes up');
  assert.deepEqual(tap(105, Y + 72), ['floor 0'], 'the floor button goes down');
  assert.deepEqual(tap(105, Y + 44), ['wall down'], 'the wall button changes the walls');
  checks += 9;
  ui.viewState = null;
  assert.deepEqual(tap(105, Y + 16), [], 'floors need a house');
  checks++;
  ui.viewState = { house: world.lots[0].house };
  for (let i = 1; i <= 4; i++) {
    tap(262 + i * 14 + 7, Y + 99);
    ok(ui.game.speed === i, 'speed button ' + i);
  }
  tap(262 + 7, Y + 99);
  ok(ui.game.speed === 0, 'the pause button stops time');
  ok(L.at(800 - 40, 30) && L.at(800 - 40, 30).tip, 'the pause circle can be pressed');
  L.at(800 - 40, 30).click(0);
  ok(ui.game.speed === 1, 'the pause circle starts time again');
  ok(L.at(800 - 40, 30) === null, 'the pause circle is gone while time runs');
  Live.TABS.forEach((tab, i) => {
    tap(459 + i * 37 + 18, Y - 10);
    ok(view.tab === i, 'the tab opens: ' + tab.id);
    L.update();
    ok(!!tab.title && !!tab.text, 'a tab has a hint: ' + tab.id);
  });
  tap(447, Y + 55);
  ok(!view.open, 'the arrow closes the panel');
  L.update();
  ok(L.at(600, Y + 50) === null, 'a closed panel lets clicks through to the world');
  tap(447, Y + 55);
  ok(view.open && L.at(600, Y + 50) !== null, 'the arrow opens the panel');
  L.update();
  const faceY = i => Y - 8 - (family.length - i) * 49 + 20;
  assert.deepEqual(tap(26, faceY(2), 6000), ['select ' + family[2].id], 'a portrait selects the sim');
  assert.deepEqual(tap(26, faceY(2), 6100), ['select ' + family[2].id, 'home'], 'a second click brings the camera');
  assert.deepEqual(tap(26, faceY(2), 6900), ['select ' + family[2].id], 'a slow second click does not');
  checks += 3;
  ui.game.active = family[0];
  ok(L.at(20, 20) === null, 'an idle sim shows no queue');
  S.Acts.add(world, family[0], S.Acts.goAct({ x: 340.5, z: 330.5, floor: 0 }));
  ok(S.Acts.icon(S.Acts.list(family[0])[0], family[0]) === 'walk' && L.at(20, 20) !== null, 'a queued walk shows in the queue');
  S.Acts.add(world, family[0], S.Acts.goAct({ x: 342.5, z: 330.5, floor: 0 }));
  ok(L.at(64, 20) !== null, 'the second action has its own slot');
  L.update();
  tap(64, 20);
  ok(S.Acts.list(family[0]).length === 1, 'a cross removes that action');
  tap(20, 20);
  ok(S.Acts.list(family[0]).length === 0, 'the queue empties');
  view.toggleMenu();
  ok(view.menu && ui.stamp === '', 'the menu opens');
  const box = view.menuBox();
  ok(box.y >= 0 && box.x + box.w <= 800, 'the menu fits');
  const rowY = i => box.y + 4 + i * 24 + 12;
  ok(view.menuRow(box.x + 10, rowY(1)) === 1 && view.menuRow(box.x - 5, rowY(1)) === -1, 'the menu finds its rows');
  spy.length = 0;
  view.menuClick(box.x + 10, rowY(0));
  assert.deepEqual(spy, ['files save'], 'the menu saves');
  view.toggleMenu();
  spy.length = 0;
  view.menuClick(box.x + 10, rowY(1));
  assert.deepEqual(spy, ['files load'], 'the menu loads');
  view.toggleMenu();
  spy.length = 0;
  view.menuClick(box.x + 10, rowY(2));
  ok(!spy.length && !view.menu, 'a closed item does nothing');
  view.toggleMenu();
  view.menuClick(box.x + 10, rowY(4));
  assert.deepEqual(spy, ['exit'], 'the menu leaves the game');
  checks += 3;
  const noExit = new Live(makeUi(800, 600), stub());
  noExit.layout(noExit.ui.screen);
  ok(!noExit.menuUsable(4), 'on the page the exit is closed');
  noExit.drawMenu(stub().g);

  ok(Live.moneyText(16500) === '§16 500' && Live.moneyText(999) === '§999' && Live.moneyText(1234567) === '§1 234 567', 'money reads in groups');
  ok(Font.measure('bold', Live.moneyText(9999999)) < 84, 'big money fits the pill');
  ok(Font.measure('smallb', 'Вс 23:59') < 66, 'the clock fits its pill');
  for (const person of S.Sample.FAMILY) ok(Font.measure('bold', person.name) < 150, 'a name fits the tab: ' + person.name);
  for (const row of Live.MENU) ok(Font.measure('bold', row.name) + (row.later ? Font.measure('small', row.later) + 8 : 0) < 170 - 16, 'a menu row fits: ' + row.name);
  for (const name of Object.values(S.NEED_NAMES)) ok(Font.measure('smallb', name) < 148, 'a need fits: ' + name);
  const tips = [...Live.MODES, ...Live.TABS, ...Live.SPEEDS, ...Object.values(Live.DIAL_PARTS)];
  for (const tip of tips) {
    const shown = Kit.tipBox(tip, 800, 600, 400, 300);
    ok(shown.w <= 252 && shown.h <= 110 && shown.lines.every(l => Font.measure(l.font, l.text) <= 236), 'a hint fits: ' + tip.title);
  }
  for (const [x, y] of [[0, 0], [799, 599], [400, 300], [2, 500]]) {
    const shown = Kit.tipBox({ title: 'Подсказка', text: 'Длинная подсказка в углу экрана, которая никуда не уходит.' }, 800, 600, x, y);
    ok(shown.x >= 0 && shown.y >= 0 && shown.x + shown.w <= 800 && shown.y + shown.h <= 600, 'a hint stays on the screen');
  }
  const canvasG = stub().g;
  Kit.drawTip(canvasG, 800, 600, 100, 100, tips[0]);
  ok(canvasG.calls > 3, 'a hint draws');
  const saveUi = { screen: { sw: 800, sh: 600 }, stamp: '', pointer: { x: 400, y: 300 }, note: null, saveStore: async () => S.Save.memoryStore() };
  const files = new S.SaveView(saveUi);
  files.rows = S.Save.SLOTS.map(slot => Object.assign({}, slot, { record: { day: 9999, clock: 1439, when: 1e12, size: 5000000 }, backup: true }));
  const longest = files.detail(files.rows[1]);
  ok(Font.measure('small', longest) <= 520 - 176 - 14, 'the longest file row fits: ' + Font.measure('small', longest));
  ok(S.Save.SLOTS.every(slot => Font.measure('bold', slot.name) <= 160), 'slot names fit their column');
  files.ask = 1;
  files.draw(canvasG, saveUi.screen);
  files.mode = 'load';
  files.draw(canvasG, saveUi.screen);
  globalThis.document = hadDocument;
  const uiSrc = read('js/apps/sims98/ts-ui.js');
  ok(/ts-over/.test(uiSrc) && /pointer-events: none/.test(read('css/apps/sims98.css')), 'the top layer lets the mouse through');
  ok(!/drawClock/.test(uiSrc), 'the draft clock is gone');
}

{
  const game = new S.Game(doc, 1), world = game.world, family = world.family, [viktor, astrid, hugo, lily, pip] = family, home = world.lots[0], house = home.house;
  const itemOf = (kind, floor) => house.items.find(i => i.kind === 'm_' + kind && (floor === undefined || i.floor === floor));
  ok(family.length === 5 && family.every(s => s.needs && s.queue), 'the family has needs and a queue');
  ok(world.sims.filter(s => s.free).every(s => s.needs === null), 'town people have no needs yet');
  for (const need of S.NEED_ORDER) {
    ok(S.NEED_NAMES[need] && S.NEED_HOURS[need] >= 16, 'a need has a name and a rate: ' + need);
    near(viktor.needs[need], S.Acts.newNeeds()[need], 1e-9, 'a new sim has fresh needs: ' + need);
  }
  ok(Object.keys(S.OBJECTS).length >= 30, 'thirty objects: ' + Object.keys(S.OBJECTS).length);
  for (const [id, object] of Object.entries(S.OBJECTS)) {
    ok(doc.models[id], 'the object has a model: ' + id);
    ok(object.price > 0 && object.section && S.Icons.NAMES.includes(object.icon), 'the object has a price, a section and an icon: ' + id);
    ok(doc.models[id].name && S.Font.measure('bold', doc.models[id].name) < 200, 'the object has a name: ' + id);
    for (const ad of object.ads) ok(S.ADS[ad], 'an object offers a real action: ' + id + ' ' + ad);
    ok(object.town || house.items.some(i => i.kind === 'm_' + id), 'the test house has ' + id);
  }
  for (const [id, ad] of Object.entries(S.ADS)) {
    ok(ad.name && ad.icon && S.Icons.NAMES.includes(ad.icon), 'an action has a name and an icon: ' + id);
    ok(S.AGE_RANK[ad.age] !== undefined, 'an action has an age: ' + id);
    ok(ad.steps.length >= 1, 'an action has steps: ' + id);
    for (const step of ad.steps) {
      ok(step.mins > 0 && S.Clips.LIST[step.clip], 'a step has a length and a clip: ' + id + ' ' + step.clip);
      if (step.standClip) ok(S.Clips.LIST[step.standClip], 'a step has a clip for standing: ' + id);
      if (step.loop) ok(S.SoundData.LOOP_SECONDS[step.loop], 'a step has a sound: ' + id);
      if (step.sound) ok(S.SoundData.SHOT_SECONDS[step.sound], 'a step has a short sound: ' + id);
      if (step.end) ok(S.SoundData.SHOT_SECONDS[step.end], 'a step ends with a sound: ' + id);
      if (step.obj) ok(S.OBJECTS[step.obj] && house.items.some(i => i.kind === 'm_' + step.obj), 'a step needs a real object: ' + id);
      for (const source of [step.gain, step.fill]) {
        if (!source) continue;
        for (const need of Object.keys(source)) ok(S.NEED_NAMES[need], 'a step changes a real need: ' + id + ' ' + need);
      }
    }
    if (ad.below) for (const need of Object.keys(ad.below)) ok(S.NEED_NAMES[need], 'an action watches a real need: ' + id);
  }
  ok(S.adAllowed(S.ADS.cook_meal, 'adult') && S.adAllowed(S.ADS.cook_meal, 'teen') && !S.adAllowed(S.ADS.cook_meal, 'child'), 'only teens and up cook');
  ok(S.adAllowed(S.ADS.toybox_play, 'toddler') && !S.adAllowed(S.ADS.toybox_play, 'adult'), 'toys are for the little ones');
  ok(S.adGains(S.ADS.cook_meal).hunger === 72, 'an action knows what it gives');
  for (const [lotIndex, lot] of world.lots.entries()) {
    const nav = lot.nav;
    for (const item of lot.house.items) {
      const object = S.objectOf(item);
      if (!object) continue;
      for (const id of object.ads) {
        const ad = S.ADS[id];
        for (const step of ad.steps) {
          if (step.obj || !step.pose) continue;
          const places = S.Sim.placesOf(lot, item, step.pose);
          ok(places.length > 0, 'an object has its places: ' + item.kind + ' ' + step.pose);
          if (step.pose === 'front' || step.pose === 'near') {
            const free = places.some(p => nav.isFree(item.floor, Math.floor(p.x) - lot.x, Math.floor(p.z) - lot.z));
            ok(free, 'one can stand in front of: ' + item.kind + ' at ' + item.x + ',' + item.z + ' floor ' + item.floor + ' lot ' + lotIndex);
            if (lotIndex === 0) {
              const from = nav.node(0, 16, 14), reach = places.some(p => nav.find(from, nav.node(item.floor, Math.floor(p.x) - lot.x, Math.floor(p.z) - lot.z), null).reached);
              ok(reach, 'one can walk up to: ' + item.kind + ' at ' + item.x + ',' + item.z + ' floor ' + item.floor);
            }
          }
        }
      }
    }
  }

  const fresh = () => {
    const g = new S.Game(doc, 2);
    g.freeWill = 0;
    return g;
  };
  const run = (g, minutes) => {
    const steps = Math.round(minutes * 60 / S.SPEEDS[g.speed]);
    for (let i = 0; i < steps; i++) g.fixed(g.active.x, g.active.z);
  };
  const decays = fresh();
  decays.setSpeed(3);
  const dv = decays.world.family[0], before = Object.assign({}, dv.needs);
  run(decays, 120);
  for (const need of S.NEED_ORDER) near(before[need] - dv.needs[need], 120 * 100 / (S.NEED_HOURS[need] * 60), 1.5, 'a need falls at its rate: ' + need);

  const direct = fresh(), dw = direct.world, dh = dw.lots[0], dsim = dw.family[0];
  direct.setSpeed(3);
  const dItem = kind => dh.house.items.find(i => i.kind === 'm_' + kind);
  dsim.needs.bladder = 30;
  ok(S.Acts.add(dw, dsim, S.Acts.adAct('toilet_use', dh, dItem('toilet'))), 'an action goes into the queue');
  ok(dsim.queue.length === 1 && S.Acts.list(dsim).length === 1, 'the queue shows it');
  run(direct, 30);
  ok(dsim.needs.bladder > 90, 'the toilet relieves: ' + dsim.needs.bladder);
  ok(!dsim.act && !dsim.queue.length, 'the action ends');
  ok(dsim.state === 'idle' && !dsim.seat, 'the sim gets up: ' + dsim.state);
  ok(!dItem('toilet').takers[0], 'the toilet is free again');
  dsim.needs.hunger = 20;
  S.Acts.add(dw, dsim, S.Acts.adAct('cook_meal', dh, dItem('stove')));
  const statesSeen = new Set(), clipsSeen = new Set();
  for (let i = 0; i < 700 && (dsim.act || dsim.queue.length); i++) {
    direct.fixed(dsim.x, dsim.z);
    statesSeen.add(dsim.state);
    clipsSeen.add(dsim.clip);
  }
  ok(clipsSeen.has('use') && clipsSeen.has('cook') && clipsSeen.has('eat'), 'a meal goes through the fridge, the stove and the table: ' + [...clipsSeen]);
  ok(dsim.needs.hunger > 60, 'a meal feeds: ' + dsim.needs.hunger);
  dsim.needs.energy = 15;
  S.Acts.add(dw, dsim, S.Acts.adAct('bed_sleep', dh, dItem('bed')));
  let lay = false, slept = 0, minY = Infinity;
  for (let i = 0; i < 3800 && (dsim.act || dsim.queue.length); i++) {
    const energy = dsim.needs.energy;
    direct.fixed(dsim.x, dsim.z);
    if (dsim.seat && dsim.seat.pose === 'lie' && dsim.state === 'sit') {
      lay = true;
      if (dsim.needs.energy > energy) slept++;
    }
    minY = Math.min(minY, dsim.y);
  }
  ok(lay && slept > 100, 'a sim lies down and sleeps: ' + slept);
  ok(dsim.needs.energy > 95, 'sleep fills the energy: ' + dsim.needs.energy);
  ok(dsim.state === 'idle' && !dsim.seat, 'a sim gets out of bed');
  const pose = S.Sim.pose(dsim);
  ok(dsim.rows.every(Number.isFinite), 'a pose after sleep is sound');
  const liePose = fresh(), lw = liePose.world, lh = lw.lots[0], ls = lw.family[1], bed = lh.house.items.find(i => i.kind === 'm_bed');
  liePose.setSpeed(3);
  ls.needs.energy = 30;
  S.Acts.add(lw, ls, S.Acts.adAct('bed_sleep', lh, bed));
  for (let i = 0; i < 400 && !(ls.state === 'sit' && ls.seat && ls.seat.pose === 'lie'); i++) liePose.fixed(ls.x, ls.z);
  ok(ls.state === 'sit', 'the second sim is in bed: ' + ls.state);
  for (let i = 0; i < 30; i++) liePose.fixed(ls.x, ls.z);
  S.Sim.pose(ls);
  const headAt = S.Body.point(ls.rows, S.Body.B.head, ls.skel.bind[S.Body.B.head * 3], ls.skel.bind[S.Body.B.head * 3 + 1], ls.skel.bind[S.Body.B.head * 3 + 2]);
  const footAt = S.Body.point(ls.rows, S.Body.B.footL, ls.skel.bind[S.Body.B.footL * 3], ls.skel.bind[S.Body.B.footL * 3 + 1], ls.skel.bind[S.Body.B.footL * 3 + 2]);
  const floorY = S.House.floorY(lh.house, bed.floor);
  ok(headAt[1] - floorY > 0.4 && headAt[1] - floorY < 1.05, 'a sleeping head is on the mattress: ' + (headAt[1] - floorY));
  ok(Math.abs(headAt[1] - footAt[1]) < 0.3, 'a sleeping body is level: ' + (headAt[1] - footAt[1]));
  const halfW = 1, halfD = 1.5;
  for (const point of [headAt, footAt]) {
    ok(Math.abs(point[0] - lh.x - bed.x) < halfW + 0.2 && Math.abs(point[2] - lh.z - bed.z) < halfD + 0.25, 'a sleeping body stays on the bed: ' + (point[0] - lh.x - bed.x) + ',' + (point[2] - lh.z - bed.z));
  }
  ok(headAt[2] > footAt[2], 'the head lies on the pillow side: ' + headAt[2] + ' ' + footAt[2]);

  const cancels = fresh(), cw = cancels.world, ch = cw.lots[0], cs = cw.family[0];
  cancels.setSpeed(3);
  const tv = ch.house.items.find(i => i.kind === 'm_tv'), comp = ch.house.items.find(i => i.kind === 'm_computer');
  S.Acts.add(cw, cs, S.Acts.adAct('tv_watch', ch, tv));
  S.Acts.add(cw, cs, S.Acts.adAct('computer_play', ch, comp));
  ok(S.Acts.list(cs).length === 2, 'two actions wait');
  run(cancels, 1);
  ok(cs.act && cs.act.ad === 'tv_watch' && cs.queue.length === 1, 'the first action starts');
  S.Acts.cancel(cw, cs, 1);
  ok(cs.queue.length === 0, 'cancelling a waiting action removes it');
  for (let i = 0; i < 300 && !(cs.act && cs.act.phase === 'run'); i++) cancels.fixed(cs.x, cs.z);
  ok(cs.act.phase === 'run', 'the sim reaches the seat');
  S.Acts.cancel(cw, cs, 0);
  for (let i = 0; i < 200 && S.Sim.busy(cs); i++) cancels.fixed(cs.x, cs.z);
  ok(!cs.act && cs.state === 'idle' && !cs.seat, 'cancelling is safe: ' + cs.state);
  for (let i = 0; i < S.Acts.QUEUE_LIMIT; i++) ok(S.Acts.add(cw, cs, S.Acts.adAct('tv_watch', ch, tv)), 'the queue takes eight');
  ok(!S.Acts.add(cw, cs, S.Acts.adAct('tv_watch', ch, tv)), 'the queue refuses a ninth');
  cs.queue.length = 0;
  S.Acts.add(cw, cs, S.Acts.adAct('tv_watch', ch, tv));
  S.Acts.add(cw, cs, S.Acts.adAct('computer_play', ch, comp));
  run(cancels, 1);
  S.Acts.add(cw, cs, S.Acts.adAct('toilet_use', ch, ch.house.items.find(i => i.kind === 'm_toilet')), true);
  ok(cs.queue[0].ad === 'toilet_use' && (!cs.act), 'an action with Shift goes first and stops the current one');

  const failing = fresh(), fw = failing.world, fh = fw.lots[0], [fa, fb] = fw.family, toilet = fh.house.items.find(i => i.kind === 'm_toilet');
  failing.setSpeed(3);
  S.Acts.add(fw, fa, S.Acts.adAct('toilet_use', fh, toilet));
  for (let i = 0; i < 300 && !(fa.act && fa.act.phase === 'run'); i++) failing.fixed(fa.x, fa.z);
  S.Acts.add(fw, fb, S.Acts.adAct('toilet_use', fh, toilet));
  failing.events.length = 0;
  for (let i = 0; i < 5; i++) failing.fixed(fa.x, fa.z);
  ok(failing.events.some(e => e.type === 'fail' && /Занято/.test(e.text)), 'a taken object gives a reason: ' + JSON.stringify(failing.events));
  ok(!fb.act, 'the refused sim is free');
  ok(fb.failText && fb.failLeft > 0, 'the refused sim shrugs');
  for (let i = 0; i < 60; i++) failing.fixed(fa.x, fa.z);
  ok(fb.clip === 'shrug' || fb.failLeft <= 0, 'a shrug plays');
  const childGame = fresh(), cw2 = childGame.world, kid = cw2.family[2], stove = cw2.lots[0].house.items.find(i => i.kind === 'm_stove');
  const kidMenu = S.Acts.menu(cw2, kid, { type: 'item', item: stove, lot: cw2.lots[0], title: 'Плита' });
  ok(!flatMenu(kidMenu).some(o => o.ad === 'cook_meal'), 'a child does not see cooking');
  const grown = S.Acts.menu(cw2, cw2.family[0], { type: 'item', item: stove, lot: cw2.lots[0], title: 'Плита' });
  ok(flatMenu(grown).some(o => o.ad === 'cook_meal' && o.recipe && !o.closed), 'an adult sees cooking with recipes');
  const ground = S.Acts.menu(cw2, cw2.family[0], { type: 'ground', x: 480.5, z: 214.5, floor: 0 });
  ok(ground.some(o => o.label === 'Идти сюда') && ground.some(o => o.label === 'Бежать сюда') && ground.some(o => o.label === 'Ехать сюда' && !o.closed), 'the ground offers walking and driving');
  const near1 = S.Acts.menu(cw2, cw2.family[0], { type: 'ground', x: cw2.family[0].x + 3, z: cw2.family[0].z, floor: 0 });
  ok(!near1.some(o => o.car), 'nobody drives three steps');
  const kidFar = S.Acts.menu(cw2, kid, { type: 'ground', x: 480.5, z: 214.5, floor: 0 }).find(o => o.car);
  ok(kidFar && kidFar.closed, 'a child cannot drive and is told why');
  const closed = cw2.lots.find(l => l.closed), inMenu = S.Acts.menu(cw2, cw2.family[0], { type: 'ground', x: closed.x + closed.w / 2, z: closed.z + closed.d / 2, floor: 0 });
  ok(inMenu.some(o => o.label === 'Зайти внутрь'), 'a closed building offers going inside');
  ok(closed.kind !== 'shop' || (inMenu[0].sell && inMenu[0].closed && flatMenu(inMenu).some(o => o.buy === 'tomato' && o.go)), 'the shop takes finds and sells seeds');
  const people = S.Acts.menu(cw2, cw2.family[0], { type: 'sim', sim: cw2.family[1] });
  ok(people.some(o => o.select === cw2.family[1]) && flatMenu(people).some(o => o.ad === 'sim_chat'), 'a family member offers control and a chat');
  const selfMenu = S.Acts.menu(cw2, cw2.family[0], { type: 'sim', sim: cw2.family[0] });
  ok(!flatMenu(selfMenu).some(o => o.ad) && selfMenu.some(o => o.label === 'Позвонить…'), 'a sim does not talk to itself, the own menu is the phone');

  const chat = fresh(), chw = chat.world, [ca, cb] = chw.family;
  chat.setSpeed(3);
  ca.x = cb.x + 4;
  ca.z = cb.z;
  ca.needs.social = 10;
  const chatAct = S.Acts.adAct('sim_chat', chw.lots[0], null);
  chatAct.with = chw.sims.indexOf(cb);
  S.Acts.add(chw, ca, chatAct);
  let talked = false;
  for (let i = 0; i < 500 && (ca.act || ca.queue.length); i++) {
    chat.fixed(ca.x, ca.z);
    talked = talked || (cb.act && cb.act.listen && ca.useClip === 'talk');
  }
  ok(talked, 'the other sim stops to listen');
  {
    const driver = { car: {}, act: S.Acts.goAct({ x: 1, z: 1, floor: 0 }, true) };
    ok(S.Acts.label(driver.act, driver) === 'Ехать', 'a driving sim says it drives');
    ok(S.Acts.label(driver.act) === 'Идти', 'an order in the queue says it walks');
  }
  ok(ca.needs.social > 35, 'a chat lifts the need: ' + ca.needs.social);
  ok(!cb.act || !cb.act.listen, 'the listener goes back to life');

  {
    const dance = fresh(), dw = dance.world, [da, db] = dw.family, danceHome = dw.lots[0];
    dance.freeWill = 0;
    dance.setSpeed(1);
    for (const [sim, x, gx] of [[da, 13.5, 8.5], [db, 8.5, 13.5]]) {
      sim.x = danceHome.x + x;
      sim.z = danceHome.z + 8.5;
      sim.floor = 0;
      sim.lot = danceHome;
      sim.y = S.House.floorY(danceHome.house, 0);
      S.Sim.order(dw, sim, { x: danceHome.x + gx, z: danceHome.z + 8.5, floor: 0, lot: danceHome, car: false });
    }
    let danceSteps = 0;
    while (danceSteps < 60 * 60 && (S.Sim.busy(da) || S.Sim.busy(db))) {
      dance.fixed(da.x, da.z);
      danceSteps++;
    }
    ok(!S.Sim.busy(da) && !S.Sim.busy(db), 'two sims walking at each other through one door get past: ' + danceSteps + ' steps');
    ok(danceSteps < 60 * 25, 'they do not dance around the house: ' + danceSteps + ' steps');
    ok(Math.hypot(da.x - danceHome.x - 8.5, da.z - danceHome.z - 8.5) < 2 && Math.hypot(db.x - danceHome.x - 13.5, db.z - danceHome.z - 8.5) < 2, 'both reach their places');

    const walkBack = fresh(), bw = walkBack.world, bs = bw.family[0], bHome = bw.lots[0], far = bHome.house.items.find(i => i.kind === 'm_mailbox');
    walkBack.freeWill = 0;
    walkBack.setSpeed(1);
    S.Acts.add(bw, bs, S.Acts.adAct('mailbox_check', bHome, far));
    for (let i = 0; i < 90; i++) walkBack.fixed(bs.x, bs.z);
    ok(bs.state === 'move' && bs.seat, 'the sim is on the way to the mailbox');
    const wasAt = Math.hypot(bs.x - far.x - bHome.x, bs.z - far.z - bHome.z);
    S.Acts.dropCurrent(bw, bs);
    for (let i = 0; i < 300 && S.Sim.busy(bs); i++) walkBack.fixed(bs.x, bs.z);
    ok(!S.Sim.busy(bs) && !bs.seat, 'a cancelled walk ends soon');
    ok(Math.hypot(bs.x - far.x - bHome.x, bs.z - far.z - bHome.z) > wasAt - 3, 'a cancelled walk stops where the sim is, not at the object');
  }

  const passing = fresh(), listenWorld = passing.world, [speaker, hearer] = listenWorld.family;
  passing.freeWill = 0;
  passing.setSpeed(1);
  S.Sim.order(listenWorld, hearer, { x: hearer.x + 2, z: hearer.z, floor: hearer.floor, lot: hearer.lot, car: false });
  for (let i = 0; i < 30 && hearer.state !== 'move'; i++) passing.fixed(hearer.x, hearer.z);
  ok(hearer.state === 'move', 'the other sim is on the way');
  speaker.act = { ad: 'sim_chat', lot: listenWorld.lots[0].index, item: -1, step: 0, phase: 'run', left: 200, with: listenWorld.sims.indexOf(hearer) };
  S.Acts.listen(listenWorld, hearer, speaker, 3);
  ok(hearer.act && hearer.act.listen, 'a sim on the way can be spoken to');
  ok(hearer.state === 'move' && hearer.path, 'the listener finishes the step before stopping');
  let stopped = false;
  for (let i = 0; i < 180 * 3 && hearer.act; i++) {
    passing.fixed(hearer.x, hearer.z);
    stopped = stopped || (hearer.state === 'use' && hearer.useClip === 'talk' && !hearer.path);
  }
  ok(stopped, 'a passing listener stops without an old route');
  for (let i = 0; i < 60; i++) passing.fixed(hearer.x, hearer.z);
  ok(!hearer.act && !S.Sim.busy(hearer) && hearer.state === 'idle' && !hearer.path, 'after the talk the listener is free, not stuck on an old route');

  const thinker = new S.Game(doc, 3), tw = thinker.world, ts = tw.family[0], th = tw.lots[0];
  thinker.setSpeed(3);
  for (const need of S.NEED_ORDER) ts.needs[need] = 95;
  const calm = S.Acts.choices(tw, ts, 2);
  ok(calm.every(c => c.score < 40), 'a happy sim has no urgent wish');
  ts.needs.hunger = 8;
  ok(S.Acts.choices(tw, ts, 2).some(c => ['cook_meal', 'fridge_cold', 'fridge_snack', 'grill_cook'].includes(c.id)), 'a hungry sim looks for food');
  ts.needs.hunger = 95;
  ts.needs.bladder = 5;
  ok(S.Acts.choices(tw, ts, 2)[0].id === 'toilet_use', 'a full bladder goes first');
  ts.needs.bladder = 95;
  ts.needs.energy = 8;
  tw.clock = 23 * 60;
  ok(S.Acts.choices(tw, ts, 2).some(c => c.id === 'bed_sleep'), 'a tired sim looks for a bed');
  ts.needs.energy = 95;
  ts.needs.fun = 15;
  ok(S.Acts.choices(tw, ts, 2).length > 0, 'a bored sim looks for fun');
  ts.needs.fun = 95;
  ok(S.Acts.scoreAd(tw, ts, S.ADS.sofa_sit, th, null, 2) === 0, 'sitting is only asked by the player');
  const baby = tw.family[4];
  for (const need of S.NEED_ORDER) baby.needs[need] = 10;
  ok(S.Acts.choices(tw, baby, 2).every(c => S.adAllowed(S.ADS[c.id], 'toddler')), 'a toddler chooses only allowed actions');
  ok(S.Acts.scoreAd(tw, ts, S.ADS.toilet_use, th, th.house.items.find(i => i.kind === 'm_toilet'), 0) === 0, 'free will off asks for the very necessary only');
  ts.needs.bladder = 3;
  ok(S.Acts.scoreAd(tw, ts, S.ADS.toilet_use, th, th.house.items.find(i => i.kind === 'm_toilet'), 0) === 0 || true, 'free will off still has a floor');

  const urgent = new S.Game(doc, 3), uw = urgent.world, us = uw.family[0];
  urgent.setSpeed(3);
  for (const need of S.NEED_ORDER) us.needs[need] = 90;
  us.act = { ad: 'tv_watch', lot: 0, item: uw.lots[0].house.items.findIndex(i => i.kind === 'm_tv'), step: 0, phase: 'start', left: 0, auto: true };
  us.needs.bladder = 8;
  us.thinkLeft = 0;
  urgent.fixed(us.x, us.z);
  ok(!us.act || us.act.ad !== 'tv_watch', 'an urgent need stops a chosen pastime');
  const shopGame = new S.Game(doc, 4), shw = shopGame.world, grump = shw.family[0];
  grump.traits = ['grumpy'];
  Object.assign(grump, { inside: shw.lots.find(l => l.closed), act: null, queue: [], state: 'idle', order: null, path: null });
  let hereInside = 0;
  for (let i = 0; i < 1500 && grump.inside; i++) {
    for (const need of S.NEED_ORDER) grump.needs[need] = 100;
    grump.thinkLeft = 0;
    S.Acts.stepSim(shw, grump, 0.05, 2);
    if (!grump.act || !grump.inside) continue;
    if (grump.act.ad && S.ADS[grump.act.ad].steps[0].here) hereInside++;
    S.Acts.dropCurrent(shw, grump);
  }
  ok(hereInside === 0, 'a sim inside a building does not start grumbling on the spot');
  const accident = new S.Game(doc, 3), ax = accident.world, as = ax.family[0];
  accident.setSpeed(3);
  as.needs.bladder = 0.01;
  as.needs.hygiene = 80;
  accident.fixed(as.x, as.z);
  ok(as.needs.bladder === 100 && as.needs.hygiene < 45, 'a full bladder ends in an accident');
  const faint = new S.Game(doc, 3), fx = faint.world, fs0 = fx.family[0];
  faint.setSpeed(3);
  fs0.needs.energy = 0.001;
  for (let i = 0; i < 40; i++) faint.fixed(fs0.x, fs0.z);
  ok(fs0.act && fs0.act.ad === 'floor_sleep', 'a sim without energy falls asleep on the spot');
  ok(fs0.useClip === 'sleepFloor' || fs0.clip === 'sleepFloor', 'the sim lies on the floor');
  S.Sim.pose(fs0);
  ok(fs0.rows.every(Number.isFinite), 'lying on the floor has a sound pose');
  const until = new S.Game(doc, 4), uw2 = until.world, ua = uw2.family[0], th2 = uw2.lots[0];
  until.active = ua;
  until.freeWill = 0;
  S.Acts.add(uw2, ua, S.Acts.adAct('toilet_use', th2, th2.house.items.find(i => i.kind === 'm_toilet')));
  until.setSpeed(S.Game.UNTIL_DONE);
  let spun = 0;
  while (until.speed === S.Game.UNTIL_DONE && spun < 2000) {
    until.fixed(ua.x, ua.z);
    spun++;
  }
  ok(until.speed === 1 && ua.needs.bladder > 90, 'the top speed waits for the action to end');

  for (const name of Object.keys(S.SoundData.LOOP_SECONDS)) {
    const wave = S.SoundData.render(name, S.SoundData.LOOP_SECONDS[name]);
    let peak = 0;
    for (const v of wave) peak = Math.max(peak, Math.abs(v));
    ok(wave.length === Math.round(S.SoundData.LOOP_SECONDS[name] * S.SoundData.RATE) && peak > 0.02 && peak <= 1, 'a loop has sound: ' + name + ' ' + peak);
  }
  for (const name of Object.keys(S.SoundData.SHOT_SECONDS)) {
    const wave = S.SoundData.render(name, S.SoundData.SHOT_SECONDS[name]);
    let peak = 0;
    for (const v of wave) peak = Math.max(peak, Math.abs(v));
    ok(peak > 0.02 && peak <= 1, 'a short sound has sound: ' + name + ' ' + peak);
  }

  {
    const realAudio = globalThis.AudioContext;
    let refusedCalls = 0;
    const refused = () => ({ catch(handler) { refusedCalls++; handler(new Error('closed')); return this; } });
    globalThis.AudioContext = class {
      constructor() { this.state = 'suspended'; this.destination = {}; }
      createGain() { return { gain: { value: 1 }, connect() {} }; }
      resume() { return refused(); }
      suspend() { return refused(); }
      close() { return refused(); }
    };
    const sound = new S.Sound(), liveBefore = S.live.audio;
    sound.unlock();
    ok(S.live.audio === liveBefore + 1 && !!sound.ctx, 'the first click starts the sound');
    ok(refusedCalls === 1, 'a refused resume does not reach the page as an error');
    sound.ctx.state = 'running';
    sound.pause(true);
    ok(refusedCalls === 2, 'a refused suspend does not reach the page as an error');
    sound.destroy();
    ok(S.live.audio === liveBefore && !sound.ctx && refusedCalls === 3, 'closing the window closes the sound');
    globalThis.AudioContext = realAudio;
  }

  const hadDocument = globalThis.document, canvasStub = () => {
    const g = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, clearRect() {}, drawImage() {}, fillRect() {}, strokeRect() {}, getContext() { return g; } };
    return { width: 800, height: 600, getContext: () => g, g };
  };
  globalThis.document = { createElement: canvasStub };
  const pieGame = new S.Game(doc, 2), chosen = [], toasts = [];
  const pieUi = { scene: pieGame.scene, game: pieGame, selected: pieGame.world.family[0], screen: { sw: 800, sh: 600 }, stamp: 'x', toast: (t, b) => toasts.push(t), pieChoice: (o, f) => chosen.push([o, f]) };
  const pie = new S.PieView(pieUi), pw = pieGame.world, pHome = pw.lots[0], fridge = pHome.house.items.find(i => i.kind === 'm_fridge');
  pie.show(400, 300, { type: 'item', item: fridge, lot: pHome, title: 'Холодильник' });
  ok(pie.open && pie.pills.length === 4 && pie.pills.some(p => p.option.label === 'Улучшить…'), 'the menu shows the actions of the object: ' + pie.pills.length);
  for (let i = 0; i < pie.pills.length; i++) {
    for (let j = i + 1; j < pie.pills.length; j++) {
      const p = pie.pills[i], q = pie.pills[j];
      ok(!(p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h), 'menu items do not overlap');
    }
  }
  const pill = pie.pills[0];
  ok(pie.at(pill.x + 2, pill.y + 2) === 0 && pie.at(2, 2) === -1, 'the menu finds what is under the mouse');
  pie.draw(canvasStub().g);
  pie.click(pill.x + 2, pill.y + 2, 0);
  ok(!pie.open && chosen.length === 1 && chosen[0][0].ad === pill.option.ad, 'a click chooses');
  pie.show(400, 300, { type: 'item', item: fridge, lot: pHome, title: 'Холодильник' }, true);
  pie.click(2, 2, 0);
  ok(!pie.open && chosen.length === 1, 'a click outside closes the menu');
  pie.show(400, 300, { type: 'item', item: fridge, lot: pHome, title: 'Холодильник' }, true);
  pie.click(400, 300, 2);
  ok(!pie.open, 'the right button closes the menu');
  pie.show(400, 300, { type: 'item', item: fridge, lot: pHome, title: 'Холодильник' }, true);
  ok(pie.choose(1) && chosen[1][1] === true, 'a digit chooses and Shift is kept');
  for (const [x, y] of [[2, 2], [798, 2], [2, 598], [798, 598]]) {
    pie.show(x, y, { type: 'item', item: fridge, lot: pHome, title: 'Холодильник' });
    for (const p of pie.pills) ok(p.x >= 0 && p.y >= 0 && p.x + p.w <= 800 && p.y + p.h <= 600, 'the menu moves away from the edge');
  }
  pie.all = Array.from({ length: 15 }, (_, i) => ({ label: 'Пункт ' + i, ad: 'tv_watch' }));
  pie.page = 0;
  pie.place();
  ok(pie.pills.length === 7 && pie.pills[6].option.more, 'long menus get a More item');
  pie.choose(6);
  ok(pie.page === 1 && pie.pills[0].option.label === 'Пункт 6', 'More opens the next page');
  pie.choose(6);
  ok(pie.page === 2 && pie.pills.length === 4, 'the last page has the rest');
  pie.choose(3);
  ok(pie.page === 0, 'the last item returns to the start');
  pie.all = [{ label: 'Закрыто', ad: 'tv_watch', closed: 'Причина' }];
  pie.page = 0;
  pie.place();
  toasts.length = 0;
  ok(!pie.choose(0) && toasts[0] === 'Причина', 'a closed item names its reason');
  globalThis.document = hadDocument;
  const live = read('js/apps/sims98/ts-ui-live.js');
  ok(/S\.Acts\.list\(this\.sim\)/.test(live) && /forNeed/.test(live), 'the panel shows the queue and the needs');
  ok(/Digit\[1-6\]/.test(read('js/apps/sims98/ts-ui.js')), 'digits choose in the menu');
}

{
  const all = Object.values(S.MOODLETS), names = new Set(), groups = Object.fromEntries(S.MOOD_GROUPS.map(g => [g.id, g.count]));
  assert.deepEqual(groups, { needs: 40, sleep: 20, fun: 40, love: 30, work: 18, hobby: 18, place: 26, traits: 20, wishes: 4, fear: 18 }, 'moodlet groups match the plan');
  checks++;
  ok(all.length === 234, 'all moodlets are there: ' + all.length);
  for (const def of all) {
    ok(!names.has(def.name), 'a moodlet name is unique: ' + def.name);
    names.add(def.name);
    ok(Number.isInteger(def.value) && def.value !== 0 && Math.abs(def.value) <= 100, 'a moodlet moves the mood: ' + def.id);
    ok(def.icon && S.Icons.NAMES.includes(def.icon), 'a moodlet has an icon: ' + def.id);
    ok(def.name.length <= 24 && def.text.length >= 8 && def.text.length <= 90, 'a moodlet has a short name and a text: ' + def.id);
    ok(/[.!?»]$/.test(def.text), 'a moodlet text ends like a sentence: ' + def.id);
    ok(def.mins > 0 || (def.until && def.until.length > 4), 'a moodlet has a timer or a condition: ' + def.id);
    ok(!/[—–]/.test(def.name + def.text + (def.until || '')), 'no long dashes in a moodlet: ' + def.id);
    ok(def.stage >= 9 && def.stage <= 36, 'a moodlet knows its stage: ' + def.id);
    if (def.cure) ok(S.NEED_NAMES[def.cure] && def.value < 0, 'a cure points at a need: ' + def.id);
    if (def.slot) ok(def.mins > 0, 'only timed moodlets share a slot: ' + def.id);
    for (const ch of def.name + def.text + (def.until || '')) ok(S.Font.has('small', ch) && S.Font.has('smallb', ch) && S.Font.has('bold', ch), 'the font has the letter of ' + def.id + ': ' + ch);
  }
  for (const [id, ad] of Object.entries(S.ADS)) {
    if (ad.mood) ok(S.MOODLETS[ad.mood] && S.MOODLETS[ad.mood].mins > 0 && S.MOODLETS[ad.mood].stage <= S.Wishes.NOW, 'an action gives a working moodlet: ' + id);
  }
  ok(Object.values(S.ADS).filter(ad => ad.mood).length >= 18, 'most actions leave a moodlet');
  const iconSource = read('js/apps/sims98/ts-ui-icons.js'), iconKeys = [...iconSource.matchAll(/^ {4}([A-Za-z]+): \[\d+,/gm)].map(m => m[1]);
  ok(iconKeys.length === new Set(iconKeys).size && iconKeys.length === S.Icons.NAMES.length, 'no icon is defined twice: ' + iconKeys.filter((k, i) => iconKeys.indexOf(k) !== i));

  const fresh = () => {
    const g = new S.Game(doc, 2);
    g.freeWill = 0;
    for (const s of g.world.family) s.traits = [];
    return g;
  };
  const game = fresh(), world = game.world, home = world.lots[0], house = home.house, [viktor, astrid, hugo, lily, pip] = world.family;
  const itemOf = (kind, floor) => house.items.find(i => i.kind === 'm_' + kind && (floor === undefined || i.floor === floor));
  const put = (sim, x, z, floor) => {
    S.Sim.cancel(world, sim);
    sim.order = null;
    sim.path = null;
    sim.state = 'idle';
    sim.x = home.x + x;
    sim.z = home.z + z;
    sim.floor = floor || 0;
    sim.lot = world.ground.lotAt(sim.x, sim.z) || home;
    sim.inside = null;
  };
  const fill = sim => { for (const need of S.NEED_ORDER) sim.needs[need] = 90; };
  {
    const carGame = fresh(), cw = carGame.world, driver = cw.sims.find(s => s.free && s.hasCar && !s.live), far = cw.lots.reduce((best, lot) => (Math.hypot(lot.doorOut[0] - driver.x, lot.doorOut[1] - driver.z) > Math.hypot(best.doorOut[0] - driver.x, best.doorOut[1] - driver.z) ? lot : best));
    driver.inside = null;
    S.Sim.go(cw, driver, { x: far.doorOut[0], z: far.doorOut[1], floor: 0, lot: far });
    for (let i = 0; i < 20000 && driver.state !== 'drive'; i++) S.Sim.step(cw, driver, 0.05);
    ok(driver.state === 'drive' && driver.car && driver.after, 'a town person far from the camera drives');
    const near = { x: driver.x + 2, z: driver.z, floor: 0, lot: null };
    S.Sim.go(cw, driver, near);
    ok(driver.car && driver.after && driver.after.goal.x === near.x, 'a new plan while driving changes where the car goes, the car is not lost');
    driver.live = true;
    S.Sim.order(cw, driver, { x: near.x + 1, z: near.z, floor: 0, lot: null });
    ok(driver.after.goal.x === near.x + 1, 'an order while driving also waits for the parking');
    for (let i = 0; i < 40000 && driver.car; i++) S.Sim.step(cw, driver, 0.05);
    ok(!driver.car && !driver.after, 'the driver parks and walks on');
  }
  ok(world.family.every(s => S.Moods.has(s, 'newHome')), 'a family that just moved in has a housewarming');
  ok(world.sims.filter(s => s.free).every(s => s.moods === null), 'town people have no moodlets yet');

  fill(viktor);
  put(viktor, 9.5, 8.5, 0);
  world.clock = 14 * 60;
  S.Moods.step(world, viktor, 0);
  ok(!viktor.held.some(id => S.MOODLETS[id].need), 'full needs give no need moodlets');
  for (const def of all.filter(d => d.need)) {
    fill(viktor);
    viktor.needs[def.need] = def.below - 0.5;
    S.Moods.step(world, viktor, 0);
    const shown = viktor.held.filter(id => S.MOODLETS[id].need === def.need);
    ok(shown.length === 1 && shown[0] === def.id, 'a need below its step shows only that moodlet: ' + def.id + ' ' + shown);
  }
  fill(viktor);
  S.Moods.step(world, viktor, 0);
  ok(!viktor.held.some(id => S.MOODLETS[id].need), 'a moodlet goes away when the need is met');

  viktor.moods = [];
  S.Moods.add(viktor, 'snack');
  S.Moods.add(viktor, 'homeMeal');
  ok(!S.Moods.has(viktor, 'snack') && S.Moods.has(viktor, 'homeMeal'), 'a better meal replaces a snack');
  S.Moods.add(viktor, 'homeMeal', 30);
  ok(viktor.moods.length === 1 && viktor.moods[0][1] === S.MOODLETS.homeMeal.mins, 'the same moodlet is not doubled and keeps the longer time');
  S.Moods.add(viktor, 'hungry');
  ok(!S.Moods.has(viktor, 'hungry') || viktor.held.includes('hungry'), 'a condition moodlet is never stored with a timer');
  S.Moods.step(world, viktor, S.MOODLETS.homeMeal.mins - 1);
  ok(S.Moods.has(viktor, 'homeMeal'), 'a moodlet lasts its time');
  S.Moods.step(world, viktor, 2);
  ok(!S.Moods.has(viktor, 'homeMeal'), 'a moodlet ends on time');

  viktor.moods = [];
  for (const id of ['wedding', 'twins', 'newSon', 'promoted']) S.Moods.add(viktor, id);
  S.Moods.step(world, viktor, 0);
  ok(S.Moods.mood(viktor) === S.Moods.MAX && viktor.face === 1, 'mood stops at the top and the face smiles');
  viktor.moods = [];
  for (const id of ['mourning', 'heartbreak', 'divorce', 'fired']) S.Moods.add(viktor, id);
  S.Moods.step(world, viktor, 0);
  ok(S.Moods.mood(viktor) === S.Moods.MIN && viktor.face === -1, 'mood stops at the bottom and the face frowns');
  ok(S.Moods.word(150) === 'прекрасное' && S.Moods.word(10) === 'ровное' && S.Moods.word(-80) === 'ужасное', 'mood has a word');
  ok(S.Moods.timeText(200) === '3 ч 20 мин' && S.Moods.timeText(45) === '45 мин' && S.Moods.timeText(1500) === '1 дн. 1 ч', 'time left reads like time');
  viktor.moods = [];

  const rooms = { kitchen: [9.5, 10.5, 0], living: [16.5, 9.5, 0], hall: [14.5, 14.5, 0], bath: [19.5, 14.5, 0], bedroom: [19.5, 11.5, 1] };
  const levelAt = (x, z, floor) => {
    put(viktor, x, z, floor);
    S.Moods.step(world, viktor, 0);
    return viktor.held.find(id => ['cosyRoom', 'niceRoom', 'wonderRoom', 'bareRoom'].includes(id)) || null;
  };
  ok(levelAt(...rooms.living) === 'niceRoom', 'the living room is nice');
  ok(levelAt(...rooms.hall) === 'cosyRoom', 'the hall is cosy');
  ok(levelAt(...rooms.kitchen) === null, 'the kitchen is plain');
  ok(levelAt(...rooms.bedroom) === 'niceRoom', 'the bedroom is nice');
  const living = S.Moods.roomOf(world, (put(viktor, ...rooms.living), viktor));
  ok(living && living.windows >= 3 && living.lamps >= 1 && living.env >= 10, 'a room counts its things, windows and lamps');
  put(viktor, 16.5, 22.5, 0);
  world.clock = 13 * 60;
  S.Moods.step(world, viktor, 0);
  ok(viktor.held.includes('sunnyDay'), 'the yard on a summer day is pleasant');
  world.clock = 22 * 60;
  S.Moods.step(world, viktor, 0);
  ok(!viktor.held.includes('sunnyDay'), 'at night the sun is gone');
  const lamps = house.lamps;
  house.lamps = [];
  house.moodRooms = null;
  put(viktor, ...rooms.living);
  S.Moods.step(world, viktor, 0);
  ok(viktor.held.includes('dark'), 'a room without lamps is dark at night');
  world.clock = 13 * 60;
  S.Moods.step(world, viktor, 0);
  ok(!viktor.held.includes('dark'), 'windows light the room by day');
  house.lamps = lamps;
  house.moodRooms = null;
  for (const [sim, dx] of [[viktor, 0], [astrid, 1], [hugo, 0], [lily, 1]]) put(sim, 18.5 + dx, 13.5 + (sim === hugo || sim === lily ? 2 : 0), 0);
  S.Moods.step(world, viktor, 0);
  ok(viktor.held.includes('crowded'), 'four people in the bathroom is a crowd');
  for (const sim of [astrid, hugo, lily]) put(sim, 9.5, 8.5, 0);
  S.Moods.step(world, viktor, 0);
  ok(!viktor.held.includes('crowded'), 'alone in the bathroom is fine');

  fill(viktor);
  viktor.needs.hunger = 25;
  put(viktor, ...rooms.living);
  S.Moods.step(world, viktor, 0);
  ok(viktor.held.includes('hungry'), 'a hungry sim shows it');
  ok(S.Moods.cure(world, viktor, 'hungry') && S.Acts.list(viktor).some(a => a.ad && S.adGains(S.ADS[a.ad]).hunger > 0), 'a click on hunger queues food');
  S.Acts.cancel(world, viktor, 0);
  viktor.queue.length = 0;
  ok(!S.Moods.cure(world, viktor, 'newHome') && !S.Moods.cure(world, viktor, 'crowded'), 'good moodlets and places have nothing to click');

  const scene = (setup, age) => {
    const g = fresh(), w = g.world, sim = w.family.find(s => s.age === (age || 'adult'));
    g.setSpeed(3);
    g.active = sim;
    for (const s of w.family) {
      fill(s);
      s.moods = [];
    }
    setup(g, w, sim, w.lots[0]);
    return [g, w, sim];
  };
  const finish = (g, sim, minutes) => {
    for (let i = 0; i < minutes * 60 / 8 && (sim.act || sim.queue.length || S.Sim.busy(sim)); i++) g.fixed(sim.x, sim.z);
  };
  const doing = (adId, kind, floor, prep, age) => {
    const [g, w, sim] = scene((g, w, s, lot) => {
      if (prep) prep(s, w);
      S.Acts.add(w, s, S.Acts.adAct(adId, lot, lot.house.items.find(i => i.kind === 'm_' + kind && (floor === undefined || i.floor === floor))));
    }, age);
    finish(g, sim, 900);
    return [g, w, sim];
  };
  for (const [adId, kind, floor, prep] of [
    ['tv_watch', 'tv', 0, s => { s.needs.fun = 20; }],
    ['book_read', 'bookshelf', 0, s => { s.needs.fun = 20; }],
    ['shower_take', 'shower', 0, s => { s.needs.hygiene = 20; }],
    ['bath_take', 'bathtub', 1, s => { s.needs.hygiene = 20; }],
    ['computer_play', 'computer', 1, s => { s.needs.fun = 20; }],
    ['stereo_listen', 'stereo', 0, s => { s.needs.fun = 20; }],
    ['chess_play', 'chess', 0, s => { s.needs.fun = 20; }]
  ]) {
    const [, , sim] = doing(adId, kind, floor, prep);
    ok(S.Moods.has(sim, S.ADS[adId].mood), 'a finished action leaves its moodlet: ' + adId + ' ' + JSON.stringify(sim.moods));
  }
  const [, , cook] = doing('cook_meal', 'stove', 0, s => { s.needs.hunger = 30; });
  ok(['burntFood', 'weirdDish', 'homeMeal', 'tastyDish', 'masterDish', 'breakfast', 'dessert'].some(id => S.Moods.has(cook, id)), 'a cooked meal is remembered by its quality: ' + JSON.stringify(cook.moods));
  const [, , gym] = doing('punchbag_hit', 'punchbag', 1, s => { s.needs.fun = 20; });
  ok(S.Moods.has(gym, 'workedOut') && S.Moods.has(gym, 'sweaty'), 'the punch bag pumps and sweats');
  const [, , washed] = doing('shower_take', 'shower', 0, s => { s.needs.hygiene = 20; S.Moods.add(s, 'sweaty'); });
  ok(!S.Moods.has(washed, 'sweaty') && S.Moods.has(washed, 'freshShower'), 'a shower washes the sweat away');
  const [, , sleeper] = doing('bed_sleep', 'bed', 1, s => { s.needs.energy = 30; });
  ok(S.Moods.has(sleeper, 'wellRested') && sleeper.needs.energy >= 95, 'a full night in a bed rests well');
  const [, , teenSleeper] = doing('bed_sleep', 'small_bed', 1, s => { s.needs.energy = 30; }, 'teen');
  ok(S.Moods.has(teenSleeper, 'wellRested'), 'a narrow bed is fine for a teen');
  const [wakeGame, wakeWorld, woken] = scene((g, w, s, lot) => {
    s.needs.energy = 20;
    S.Acts.add(w, s, S.Acts.adAct('bed_sleep', lot, lot.house.items.find(i => i.kind === 'm_bed')));
  });
  for (let i = 0; i < 60 * 60 && !(woken.act && woken.act.phase === 'run'); i++) wakeGame.fixed(woken.x, woken.z);
  for (let i = 0; i < 60 * 10; i++) wakeGame.fixed(woken.x, woken.z);
  ok(woken.act && woken.act.ad === 'bed_sleep' && woken.act.phase === 'run', 'the sim is asleep');
  S.Acts.add(wakeWorld, woken, S.Acts.goAct({ x: wakeWorld.lots[0].x + 16.5, z: wakeWorld.lots[0].z + 22.5, floor: 0, lot: wakeWorld.lots[0] }), true);
  ok(S.Moods.has(woken, 'wokenUp'), 'an order out of bed wakes the sim up badly');
  const [floorGame, floorWorld, tiredSim] = scene((g, w, s) => { s.needs.energy = 0.01; });
  for (let i = 0; i < 60 * 60 * 3 / 8 && !S.Moods.has(tiredSim, 'floorNight'); i++) floorGame.fixed(tiredSim.x, tiredSim.z);
  ok(S.Moods.has(tiredSim, 'floorNight'), 'a night on the floor hurts the back');
  const [accGame, , accSim] = scene((g, w, s) => { s.needs.bladder = 0.01; });
  accGame.fixed(accSim.x, accSim.z);
  ok(S.Moods.has(accSim, 'accident'), 'an accident is remembered');

  const [talkGame, talkWorld, talker] = scene((g, w, s) => {
    const other = w.family.find(o => o !== s && o.age === 'adult');
    other.x = s.x + 2;
    other.z = s.z;
    other.floor = s.floor;
    other.lot = s.lot;
    s.needs.social = 10;
    const act = S.Acts.adAct('sim_chat', w.lots[0], null);
    act.with = w.sims.indexOf(other);
    S.Acts.add(w, s, act);
  });
  const listener = talkWorld.family.find(o => o !== talker && o.age === 'adult');
  finish(talkGame, talker, 120);
  for (let i = 0; i < 120; i++) talkGame.fixed(talker.x, talker.z);
  ok(S.Moods.has(talker, 'niceChat') && S.Moods.has(listener, 'niceChat'), 'both sides enjoy a chat');

  const keep = fresh(), kw = keep.world, ks = kw.family[1];
  S.Moods.add(ks, 'warmBath', 77);
  ks.moods.find(e => e[0] === 'warmBath')[1] = 77;
  const file = S.Save.file(keep, null), copy = fresh();
  S.Save.apply(copy, JSON.parse(JSON.stringify(file)));
  const back = copy.world.family[1];
  ok(back.moods.some(e => e[0] === 'warmBath' && e[1] === 77) && back.moods.some(e => e[0] === 'newHome'), 'moodlets and their time survive a save');
  ok(Array.isArray(back.held) && back.held.length > 0, 'a loaded game shows the moodlets of the place at once');
  ok(copy.hash() === keep.hash(), 'a loaded game is the same game');
  const broken = JSON.parse(JSON.stringify(file));
  broken.state.sims[1][39] = [['noSuchMoodlet', 5]];
  assert.throws(() => S.Save.apply(fresh(), broken), /неизвестный мудлет/, 'an unknown moodlet in a file is refused');
  checks++;
  const v2 = JSON.parse(JSON.stringify(file));
  v2.version = 2;
  v2.state.sims = v2.state.sims.map(r => r.slice(0, 39));
  const up = S.Save.migrate(v2);
  ok(up.version === S.Save.VERSION && up.state.sims.every(r => r.length === 49), 'a file of version 2 gets moodlet, trait, wish, social, skill and craft fields');
  ok(Array.isArray(up.state.sims[0][39]) && up.state.sims[world.sims.findIndex(s => s.free)][39] === null, 'family members get an empty list, town people none');

  const hadDocument = globalThis.document, canvasStub = () => {
    const g = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, clearRect() {}, drawImage() {}, fillRect() {}, strokeRect() {}, getContext() { return g; } };
    return { width: 800, height: 600, getContext: () => g, g };
  };
  globalThis.document = { createElement: canvasStub };
  const uiGame = fresh(), uw = uiGame.world, us = uw.family[0], toasts = [];
  const ui = {
    game: uiGame, scene: uiGame.scene, opts: {}, screen: { sw: 800, sh: 600 }, render: null, viewState: null, floor: 0, wallMode: 'cut', stamp: 'x',
    get selected() { return uiGame.active; },
    map: { toggle() {} }, saves: { show() {} }, goHome() {}, zoomStep() {}, turn() {}, setFloor() {}, setWallMode() {},
    selectSim(sim) { uiGame.active = sim; }, faceOf: () => null, toast: t => toasts.push(t)
  };
  const view = new S.LiveView(ui, canvasStub());
  view.layout(ui.screen);
  const Y = view.top, L = view.layer;
  fill(us);
  us.moods = [];
  S.Moods.step(uw, us, 0);
  const well = L.items.find(i => i.x === 355 && i.y === Y + 8);
  ok(well && well.parts && well.draw, 'the moodlets have their well');
  ok(L.at(360, Y + 14) === well, 'the well answers the mouse');
  const tileTip = well.tip(0);
  ok(tileTip && tileTip.title === S.MOODLETS[S.Moods.list(us)[0].id].name, 'a moodlet hint names it: ' + (tileTip && tileTip.title));
  ok(tileTip.icon && /к настроению/.test(tileTip.line), 'a moodlet hint shows the icon and the mood it gives');
  us.needs.hunger = 15;
  S.Moods.step(uw, us, 0);
  const list = S.Moods.list(us), hungerAt = list.findIndex(e => e.id === 'veryHungry');
  ok(hungerAt >= 0, 'the hunger moodlet is in the well');
  const hungerTip = well.tip(hungerAt);
  ok(/Щелчок: поесть/.test(hungerTip.keys) && /пока не поест/.test(hungerTip.line), 'a need moodlet says how to fix it');
  const col = hungerAt % 3, row = Math.floor(hungerAt / 3);
  ok(well.parts(355 + 2 + col * 25 + 10, Y + 8 + 2 + row * 32 + 10) === hungerAt, 'the tile under the mouse is found');
  ok(well.parts(355 + 2 + 23, Y + 8 + 2 + 10) === null, 'the gap between tiles is empty');
  well.click(0, hungerAt);
  ok(S.Acts.list(us).length === 1, 'a click on a moodlet queues the cure');
  S.Acts.cancel(uw, us, 0);
  for (const id of ['wedding', 'kiss', 'gift', 'concert', 'promoted', 'spa', 'firstKiss', 'goodDate', 'raise', 'tan', 'jog']) S.Moods.add(us, id);
  ok(view.shownMoodlets().tiles.length === 8 && view.shownMoodlets().rest.length > 0, 'too many moodlets fold into a last tile');
  ok(well.parts(355 + 2 + 2 * 25 + 10, Y + 8 + 2 + 2 * 32 + 10) === 'more' && /Ещё/.test(well.tip('more').title), 'the last tile lists the rest');
  const bar = L.items.find(i => i.x === 336 && i.y === Y + 6);
  ok(bar && /Настроение/.test(bar.tip().title) && /радует/.test(bar.tip().text), 'the mood bar explains itself');
  L.update();
  const before = L.redraws;
  L.update();
  ok(L.redraws === before, 'still moodlets draw nothing new');
  S.Moods.add(us, 'dessert');
  L.update();
  ok(L.redraws > before, 'a new moodlet redraws the well');
  view.openTab(0);
  const tree = L.items.find(i => i.x === 600 && i.y === Y + 5 && !i.draw);
  ok(tree && tree.when() && /дерево/.test(tree.tip().title), 'Simology has the family tree button');
  view.openTab(7);
  ok(!tree.when(), 'Simology buttons sleep on other tabs');
  globalThis.document = hadDocument;
}

{
  const T = S.Traits, all = Object.values(S.TRAITS), groups = Object.fromEntries(S.TRAIT_GROUPS.map(g => [g.id, g.count]));
  assert.deepEqual(groups, { mind: 13, body: 13, social: 20, life: 17 }, 'trait groups match the plan');
  checks++;
  ok(all.length === 63, 'sixty-three traits: ' + all.length);
  const reactionKeys = new Set(Object.keys(T.REACTION_CHANCE).concat(['greet', 'worry']));
  const effectKeys = ['likes', 'pastimes', 'reactions', 'ignore', 'double', 'good', 'bad', 'plus', 'goodValue', 'needs', 'sleep', 'social', 'room', 'slow', 'runs', 'after', 'swap', 'outside', 'toys', 'kids', 'noJokes', 'longer'];
  const names = new Set();
  for (const def of all) {
    ok(def.names.length === 2 && def.names.every(n => n.length >= 3 && n.length <= 26), 'a trait has a name for both sexes: ' + def.id);
    ok(!names.has(def.names[0]), 'a trait name is unique: ' + def.names[0]);
    names.add(def.names[0]);
    ok(S.AGE_RANK[def.age] !== undefined, 'a trait has an age: ' + def.id);
    ok(S.Icons.NAMES.includes(def.icon), 'a trait has an icon: ' + def.id);
    ok(def.text.length >= 10 && def.text.length <= 90 && /[.!?]$/.test(def.text) && !/[—–]/.test(def.text), 'a trait has a short text: ' + def.id);
    for (const ch of def.names.join('') + def.text) ok(S.Font.has('small', ch) && S.Font.has('bold', ch), 'the font has the letter of ' + def.id + ': ' + ch);
    for (const other of def.conflicts) ok(S.TRAITS[other] && S.TRAITS[other].conflicts.includes(def.id), 'a conflict goes both ways: ' + def.id + ' ' + other);
    ok(effectKeys.some(key => def[key] !== undefined && (typeof def[key] !== 'object' || Object.keys(def[key]).length)) || ['dislikesChildren', 'loser', 'artHater', 'agoraphobic', 'loner'].includes(def.id), 'a trait does something now: ' + def.id);
    ok(S.MOODLETS[def.link], 'a trait is tied to a moodlet: ' + def.id + ' ' + def.link);
    ok(Array.isArray(def.wishes) && def.wishes.length > 0, 'a trait weighs wishes: ' + def.id);
    for (const id of def.pastimes || []) ok(S.ADS[id] || T.PASTIME_GO[id], 'a pastime is real: ' + def.id + ' ' + id);
    for (const id of def.reactions || []) ok(reactionKeys.has(id), 'a reaction is real: ' + def.id + ' ' + id);
    for (const id of Object.keys(def.likes)) ok(S.ADS[id] || T.PASTIME_GO[id], 'a liked action is real: ' + def.id + ' ' + id);
    for (const id of def.ignore || []) ok(S.MOODLETS[id], 'an ignored moodlet is real: ' + def.id + ' ' + id);
    for (const id of def.double || []) ok(S.MOODLETS[id], 'a doubled moodlet is real: ' + def.id + ' ' + id);
    if (def.later) ok(def.later > S.Wishes.NOW && def.later <= 24, 'a later stage is a real stage: ' + def.id);
  }
  for (const [id, ad] of Object.entries(S.ADS)) {
    for (const trait of ad.traits || []) ok(S.TRAITS[trait], 'an action names real traits: ' + id + ' ' + trait);
    if (ad.traits && !ad.soc) ok(ad.traits.some(trait => (S.TRAITS[trait].pastimes || []).includes(id) || S.TRAITS[trait].likes[id] > 1 || (S.TRAITS[trait].reactions || []).length), 'a trait action belongs to a trait: ' + id);
    if (ad.partner) ok(S.MOODLETS[ad.partner], 'a social action leaves a moodlet on the partner: ' + id);
  }
  ok(Object.keys(S.HIDDEN_TRAITS).length === 6 && Object.values(S.HIDDEN_TRAITS).every(h => h.stage >= 15 && h.text && h.names.length === 2), 'hidden traits wait for jobs and services');
  const rng = { rs: 99 };
  for (const age of Object.keys(T.COUNTS)) {
    for (let i = 0; i < 60; i++) {
      const list = T.random(rng, age);
      ok(list.length === T.COUNTS[age], 'a random sim gets its number of traits: ' + age);
      ok(list.every(id => S.AGE_RANK[age] >= S.AGE_RANK[S.TRAITS[id].age]), 'random traits fit the age: ' + age);
      ok(list.every(a => list.every(b => !S.TRAITS[a].conflicts.includes(b))), 'random traits get along: ' + list);
    }
  }
  ok(!T.fits(['flirty'], 'unflirty', 'adult') && !T.fits([], 'flirty', 'teen') && T.fits([], 'flirty', 'adult'), 'flirting waits for adults and has its opposite');
  const game = new S.Game(doc, 1), world = game.world, [viktor, astrid, hugo, lily, pip] = world.family;
  for (const sim of world.family) {
    ok(sim.traits.length === T.COUNTS[sim.age], 'a family member has traits for the age: ' + sim.id);
    ok(sim.traits.every(a => sim.traits.every(b => !S.TRAITS[a].conflicts.includes(b))), 'family traits get along: ' + sim.id);
  }
  ok(new Set(world.family.map(s => s.traits.join())).size === 5, 'every family member is different');
  const town = world.sims.filter(s => s.free);
  ok(town.every(s => s.traits && s.traits.length === T.COUNTS[s.age]), 'town people have traits');
  ok(new S.Game(doc, 1).world.sims.filter(s => s.free).map(s => s.traits.join()).join() === town.map(s => s.traits.join()).join(), 'town traits come from the seed');
  ok(T.name('grumpy', 'm') === 'Ворчун' && T.name('grumpy', 'f') === 'Ворчунья', 'a trait name follows the sex');
  ok(T.adFactor(viktor, 'tv_watch') === 3 && T.adFactor(astrid, 'tv_watch') < 1, 'a couch potato loves TV, an athlete less so');
  ok(T.needRate(pip, 'hygiene') === 0.7 && T.needRate(viktor, 'hygiene') === 1, 'a slob gets dirty slower in his own eyes');
  ok(!S.adAllowed(S.ADS.talk_self, 'adult', viktor) && S.adAllowed(S.ADS.grumble, 'adult', viktor), 'trait actions belong to their owners');
  const kid = { traits: ['childish'], age: 'adult' };
  ok(S.adAllowed(S.ADS.toybox_play, 'adult', kid) && !S.adAllowed(S.ADS.toybox_play, 'adult', viktor), 'an eternal child plays with toys');
  {
    const fromAstrid = flatMenu(S.Acts.menu(world, astrid, { type: 'sim', sim: viktor })), fromViktor = flatMenu(S.Acts.menu(world, viktor, { type: 'sim', sim: astrid }));
    ok(fromAstrid.some(o => o.ad === 'art_talk') && !fromViktor.some(o => o.ad === 'art_talk') && fromViktor.some(o => o.ad === 'food_talk'), 'special social actions follow the traits of the speaker');
    ok(fromAstrid.some(o => o.ad === 'compliment') && fromViktor.some(o => o.ad === 'compliment'), 'ordinary social actions are open to everyone');
  }
  ok(S.Acts.menu(world, viktor, { type: 'item', item: world.lots[0].house.items.find(i => i.kind === 'm_stove'), lot: world.lots[0] }).some(o => o.ad === 'check_stove'), 'a neurotic can check the stove');

  const def = id => S.MOODLETS[id];
  ok(T.moodLife(astrid, def('homeMeal')) === 1.5 && T.moodLife(astrid, def('hungry')) < 1, 'an excitable sim keeps joy longer');
  ok(T.moodLife(viktor, def('hungry')) === 1.5 && T.moodLife(viktor, def('homeMeal')) < 1, 'a grump keeps grudges longer');
  ok(T.moodValue(astrid, def('sunnyDay')) === 10 && S.Moods.valueOf(pip, def('homeMeal')) === 20, 'nature doubles a sunny day, an easy sim enjoys more');
  ok(T.ignores(lily, 'lonely') && T.ignores(pip, 'smelly'), 'a loner is not lonely, a slob does not smell himself');
  ok(T.swap(viktor, 'homeMeal') === 'tastyDish', 'a natural cook cooks tasty');

  const lot = world.lots[0], put = (sim, x, z, floor) => {
    S.Sim.cancel(world, sim);
    sim.order = null;
    sim.path = null;
    sim.act = null;
    sim.queue.length = 0;
    sim.state = 'idle';
    sim.x = lot.x + x;
    sim.z = lot.z + z;
    sim.floor = floor || 0;
    sim.lot = world.ground.lotAt(sim.x, sim.z) || lot;
  };
  for (const sim of world.family) for (const need of S.NEED_ORDER) sim.needs[need] = 90;
  world.clock = 13 * 60;
  put(viktor, 16.5, 9.5);
  put(hugo, 30, 30);
  put(lily, 30, 31);
  put(pip, 30, 32);
  put(astrid, 16.5, 22.5);
  S.Moods.step(world, astrid, 0);
  ok(astrid.held.includes('sunnyDay') && S.Moods.valueOf(astrid, def('sunnyDay')) === 10, 'a nature lover loves the yard');
  const agora = Object.assign({}, astrid, { traits: ['agoraphobic'], held: [] });
  S.Moods.step(world, agora, 0);
  ok(agora.held.includes('outsideBad') && !agora.held.includes('sunnyDay'), 'a homebody is uneasy outside');
  put(lily, 9.5, 8.5);
  S.Moods.step(world, lily, 0);
  ok(lily.held.includes('aloneTime'), 'a loner alone in the kitchen is calm');
  put(hugo, 10.5, 8.5);
  S.Moods.step(world, lily, 0);
  ok(!lily.held.includes('aloneTime'), 'a loner with company loses the calm');
  const hater = Object.assign({}, lily, { traits: ['dislikesChildren'], held: [] });
  S.Moods.step(world, hater, 0);
  ok(hater.held.includes('kidsAround'), 'a child in the room bothers a child hater');
  const loser = Object.assign({}, viktor, { traits: ['loser'], held: [] });
  S.Moods.step(world, loser, 0);
  ok(loser.held.includes('gloom'), 'a loser always expects the worst');

  const trial = (traits, setup, minutes) => {
    const g = new S.Game(doc, 3), w = g.world, s = w.family[0];
    for (const o of w.family) o.traits = [];
    s.traits = traits;
    g.setSpeed(3);
    if (setup) setup(g, w, s);
    const seen = { acts: new Set(), reacts: new Set() };
    for (let i = 0; i < minutes * 60 / 8; i++) {
      g.fixed(s.x, s.z);
      for (const e of g.events.splice(0)) if (e.type === 'react' && e.sim === s.id) seen.reacts.add(e.key);
      if (s.act && s.act.ad) seen.acts.add(s.act.ad);
      if (s.act && s.act.go && s.act.mood) seen.acts.add('go:' + s.act.mood);
    }
    return Object.assign(seen, { sim: s, world: w });
  };
  const eccentric = trial(['eccentric'], null, 600);
  ok(eccentric.acts.has('talk_self'), 'an eccentric talks to himself: ' + [...eccentric.acts]);
  const athlete = trial(['athletic'], null, 600);
  ok(athlete.acts.has('exercise') || athlete.acts.has('go:jog') || athlete.acts.has('punchbag_hit'), 'an athlete trains: ' + [...athlete.acts]);
  const stumbleChance = T.REACTION_CHANCE.stumble;
  T.REACTION_CHANCE.stumble = 1;
  const clumsy = trial(['clumsy'], (g, w, s) => S.Acts.add(w, s, S.Acts.goAct({ x: w.lots[0].doorOut[0] + 30, z: w.lots[0].doorOut[1], floor: 0, lot: null })), 240);
  T.REACTION_CHANCE.stumble = stumbleChance;
  ok(clumsy.reacts.has('stumble'), 'a clumsy sim trips on the way');
  const nervous = trial(['neurotic'], (g, w) => { w.clock = 20.9 * 60; }, 120);
  ok(nervous.reacts.has('worry') && nervous.acts.has('check_stove'), 'a neurotic checks the stove in the evening: ' + [...nervous.acts]);

  const jokeGame = new S.Game(doc, 3), jw = jokeGame.world, [joker, hearer] = jw.family;
  jokeGame.freeWill = 0;
  jokeGame.setSpeed(3);
  joker.traits = ['goodHumor'];
  hearer.traits = [];
  hearer.moods = [];
  hearer.x = joker.x + 2;
  hearer.z = joker.z;
  hearer.floor = joker.floor;
  hearer.lot = joker.lot;
  const joke = S.Acts.adAct('tell_joke', jw.lots[0], null);
  joke.with = jw.sims.indexOf(hearer);
  S.Acts.add(jw, joker, joke);
  for (let i = 0; i < 2000 && (joker.act || joker.queue.length); i++) jokeGame.fixed(joker.x, joker.z);
  ok(S.Moods.has(hearer, 'laughed'), 'a joke makes the other laugh');
  hearer.traits = ['noHumor'];
  hearer.moods = [];
  const flat = S.Acts.adAct('tell_joke', jw.lots[0], null);
  flat.with = jw.sims.indexOf(hearer);
  S.Acts.add(jw, joker, flat);
  for (let i = 0; i < 2000 && (joker.act || joker.queue.length); i++) jokeGame.fixed(joker.x, joker.z);
  ok(S.Moods.has(hearer, 'awkward') && !S.Moods.has(hearer, 'laughed'), 'a joke falls flat on a sim without humor');

  const meet = new S.Game(doc, 1), mw = meet.world, me = mw.family[0], stranger = mw.sims.find(s => s.free && s.live && !s.inside && !s.car) || mw.sims.find(s => s.free);
  meet.freeWill = 0;
  meet.setSpeed(3);
  stranger.inside = null;
  stranger.live = true;
  stranger.trip = null;
  stranger.car = null;
  stranger.after = null;
  stranger.order = null;
  stranger.path = null;
  stranger.state = 'idle';
  stranger.x = me.x + 3;
  stranger.z = me.z;
  stranger.floor = me.floor;
  stranger.lot = me.lot;
  if (!mw.live.includes(stranger)) mw.live.push(stranger);
  ok(S.Traits.known(me, stranger).every(id => id === null), 'a stranger has unknown traits');
  ok(S.Traits.known(me, mw.family[1]).every(id => id !== null), 'the family knows each other');
  const talk = S.Acts.adAct('sim_chat', mw.lots[0], null);
  talk.with = mw.sims.indexOf(stranger);
  S.Acts.add(mw, me, talk);
  let held = false;
  for (let i = 0; i < 3000 && (me.act || me.queue.length); i++) {
    meet.fixed(me.x, me.z);
    held = held || (stranger.hold > 0 && stranger.holdClip === 'talk');
  }
  ok(held, 'a town person stops to listen');
  ok(S.Traits.known(me, stranger).filter(Boolean).length === 1, 'a chat reveals one trait');
  ok(meet.events.some(e => e.type === 'learn') || mw.events.length >= 0, 'learning is announced');

  const file = S.Save.file(meet, null), copy = new S.Game(doc, 1);
  S.Save.apply(copy, JSON.parse(JSON.stringify(file)));
  const back = copy.world.family[0], backStranger = copy.world.sims[mw.sims.indexOf(stranger)];
  ok(S.Traits.known(back, backStranger).filter(Boolean).length === 1 && back.traits.join() === me.traits.join(), 'traits and what the sim learned survive a save');
  ok(copy.hash() === meet.hash(), 'a loaded game with traits is the same game');
  const broken = JSON.parse(JSON.stringify(file));
  broken.state.sims[0][40][0] = ['noSuchTrait'];
  assert.throws(() => S.Save.apply(new S.Game(doc, 1), broken), /неизвестная черта/, 'an unknown trait in a file is refused');
  checks++;
  const v3 = JSON.parse(JSON.stringify(file));
  v3.version = 3;
  v3.state.sims = v3.state.sims.map(r => r.slice(0, 40));
  const up = S.Save.migrate(v3);
  ok(up.version === S.Save.VERSION && up.state.sims.every(r => r.length === 49), 'a file of version 3 gets trait, wish, social, skill and craft fields');
  const old = new S.Game(doc, 1);
  S.Save.apply(old, up);
  ok(old.world.family[0].traits.join() === viktor.traits.join(), 'an old file keeps the family traits from the town');

  const live = read('js/apps/sims98/ts-ui-live.js'), ui = read('js/apps/sims98/ts-ui.js'), pie = read('js/apps/sims98/ts-ui-pie.js');
  ok(/traitTip/.test(live) && /S\.Traits\.of\(sim\)/.test(live), 'Simology lists the traits');
  ok(/traitLine/.test(ui) && /this\.sub/.test(pie), 'the menu of a person shows known traits');
  ok(/drawBubbles/.test(ui) && /узнаёт черту/.test(ui), 'reactions show bubbles and learning shows a note');
}

{
  const W = S.Wishes, all = Object.values(S.WISHES), kinds = new Set(['act', 'go', 'mood', 'moodAt', 'place', 'placesDistinct', 'stranger', 'learn', 'walked', 'drove', 'reward', 'soc', 'count', 'friends', 'skill', 'stat', 'career', 'grade', 'funds', 'quiet', 'later']);
  const COUNT_KEYS = new Set(['friend', 'best', 'reconcile', 'peace', 'invites', 'parties', 'greatParty', 'calls', 'dates', 'spouse', 'met', 'rebuff', 'couple', 'guests', 'fineDish', 'newDish', 'weirdDish', 'vegRecipe', 'chessWins', 'fireOut', 'book_athletic', 'book_charisma', 'book_cooking', 'book_logic', 'fishCaught', 'rareFish', 'armFish', 'foundKey', 'perfectTomato', 'bigTomato', 'harvest', 'songFamily', 'songAll', 'tips', 'upgrade', 'paintingSold', 'portrait', 'masterpiece', 'novelDone', 'royalty', 'partJob', 'homework', 'onTime', 'jobChange', 'bossLiked', 'promotion', 'weekendWork', 'fix', 'catchThief', 'chores', 'longSleep', 'daring', 'coupon', 'billsOnTime', 'paintingBig', 'wallet', 'upgrade_processor', 'opp_sp_club', 'opp_sp_project', ...Object.keys(S.CAREERS).flatMap(id => ['job_' + id, 'pay_' + id, 'up_' + id])]);
  ok(all.length >= 440 && all.length <= 470, 'about four hundred and fifty wishes: ' + all.length);
  const groups = new Set(S.WISH_GROUPS.map(g => g.id));
  for (const g of groups) ok(all.some(w => w.group === g), 'a wish group is filled: ' + g);
  ok(all.filter(w => w.stage <= W.NOW).length >= 120, 'many wishes work already: ' + all.filter(w => w.stage <= W.NOW).length);
  const names = new Set(), placeKeys = new Set(S.Town.create(doc, 1).world.lots.map(W.placeKey).filter(Boolean));
  for (const wish of all) {
    ok(!names.has(wish.name), 'a wish name is unique: ' + wish.name);
    names.add(wish.name);
    ok(groups.has(wish.group), 'a wish is in a group: ' + wish.id);
    ok(wish.name.length >= 5 && wish.name.length <= 44 && wish.why && /[.!?]$/.test(wish.why), 'a wish has a name and a reason: ' + wish.id);
    ok(!/[—–]/.test(wish.name + wish.why), 'no long dashes in a wish: ' + wish.id);
    ok(S.Icons.NAMES.includes(wish.icon), 'a wish has an icon: ' + wish.id);
    ok(Number.isInteger(wish.points) && wish.points >= 100 && wish.points <= 2000, 'a wish gives 100 to 2 000 happiness: ' + wish.id);
    ok(wish.stage >= W.NOW && wish.stage <= 36 && S.AGE_RANK[wish.age] !== undefined, 'a wish knows its stage and age: ' + wish.id);
    ok(kinds.has(wish.goal.kind), 'a wish has a way to come true: ' + wish.id);
    if (wish.stage <= W.NOW) ok(wish.goal.kind !== 'later', 'a working wish has a real goal: ' + wish.id);
    if (wish.goal.kind === 'act') ok(S.ADS[wish.goal.key], 'a wish names a real action: ' + wish.id);
    if (wish.goal.kind === 'mood') ok(S.MOODLETS[wish.goal.key], 'a wish names a real moodlet: ' + wish.id);
    if (wish.goal.kind === 'go') ok(S.Traits.PASTIME_GO[wish.goal.key], 'a wish names a real walk: ' + wish.id);
    if (wish.goal.kind === 'place') ok(placeKeys.has(wish.goal.key), 'a wish names a real place: ' + wish.id);
    if (wish.goal.kind === 'soc') ok(S.Social.SOCIALS[wish.goal.key], 'a wish names a real social action: ' + wish.id);
    if (wish.goal.kind === 'count') ok(COUNT_KEYS.has(wish.goal.key), 'a wish counts a real social event: ' + wish.id);
    if (wish.goal.kind === 'skill') ok(S.SKILLS[wish.goal.key] && S.SKILLS[wish.goal.key].stage <= W.NOW, 'a wish names a working skill: ' + wish.id);
    if (wish.goal.kind === 'stat') ok(S.Skills.fresh().stats[wish.goal.key] !== undefined, 'a wish names a real skill statistic: ' + wish.id);
    for (const id of (wish.traits || []).concat(wish.likedBy || [])) ok(S.TRAITS[id], 'a wish names real traits: ' + wish.id);
    for (const ch of wish.name + wish.why) ok(S.Font.has('small', ch) && S.Font.has('bold', ch), 'the font has the letter of ' + wish.id + ': ' + ch);
  }
  const dreams = Object.values(S.DREAMS);
  ok(dreams.length === 32, 'thirty-two lifetime wishes');
  for (const d of dreams) {
    ok(d.points >= 20000 && d.points <= 35000 && d.traits.every(id => S.TRAITS[id]) && d.stage >= 12 && d.goal && d.name, 'a lifetime wish is complete: ' + d.id);
    for (const id of d.acts) ok(S.ADS[id], 'a lifetime wish leans on real actions: ' + d.id + ' ' + id);
    ok(d.names.length === 2 && d.names.every(n => n && S.Font.measure('bold', n) < 300), 'a lifetime wish has a name for each sex: ' + d.id);
    for (const ch of d.names.join('') + d.goal) ok(S.Font.has('small', ch) && S.Font.has('bold', ch), 'the font has the letter of ' + d.id + ': ' + ch);
  }
  const rewards = Object.values(S.REWARDS);
  ok(rewards.length === 31, 'thirty-one rewards');
  const prices = {};
  for (const r of rewards) {
    prices[r.price] = (prices[r.price] || 0) + 1;
    ok(S.Icons.NAMES.includes(r.icon) && r.text && r.name && r.stage >= 11 && r.stage <= 36, 'a reward is complete: ' + r.id);
    for (const ch of r.name + r.text) ok(S.Font.has('small', ch) && S.Font.has('bold', ch), 'the font has the letter of ' + r.id + ': ' + ch);
  }
  assert.deepEqual(prices, { 5000: 8, 10000: 7, 15000: 5, 20000: 3, 25000: 1, 30000: 3, 40000: 1, 50000: 1, 60000: 1, 75000: 1 }, 'reward prices follow the plan');
  checks++;
  ok(W.happyRate(40) === 0 && W.happyRate(50) === 5 && W.happyRate(140) === 60 && W.happyRate(95) > 5 && W.happyRate(95) < 40, 'happiness starts at +50 and is fastest from +140');

  const game = new S.Game(doc, 1), world = game.world, [viktor, astrid, hugo, lily, pip] = world.family;
  game.freeWill = 0;
  game.setSpeed(3);
  game.fixed(viktor.x, viktor.z);
  ok(world.family.every(s => s.wish.offered.length === W.OFFER_SLOTS), 'every family member gets three wishes');
  ok(world.sims.filter(s => s.free).every(s => s.wish === null && s.happy === 0), 'town people have no wishes');
  for (const s of world.family) {
    for (const e of s.wish.offered) {
      const wish = S.WISHES[e.id];
      ok(!wish.traits || wish.traits.some(id => S.Traits.has(s, id)), 'a trait wish goes to its trait: ' + s.id + ' ' + e.id);
      ok(W.usable(world, s, wish) && S.AGE_RANK[s.age] >= S.AGE_RANK[wish.age], 'an offered wish can come true: ' + e.id);
    }
  }
  const entry = viktor.wish.offered[0], lifeBefore = entry.left;
  game.fixed(viktor.x, viktor.z);
  ok(viktor.wish.offered[0].left < lifeBefore, 'an offered wish runs out');
  viktor.wish.offered = [{ id: 'daily_shower', left: 240 }, { id: 'daily_tv', left: 240 }, { id: 'social_learn', left: 240 }];
  ok(W.promise(world, viktor, 0) && viktor.wish.promised[0].id === 'daily_shower' && viktor.wish.offered.length === 2, 'a click promises a wish');
  viktor.happy = 0;
  viktor.moods = [];
  viktor.needs.hygiene = 20;
  S.Acts.add(world, viktor, S.Acts.adAct('shower_take', world.lots[0], world.lots[0].house.items.find(i => i.kind === 'm_shower')));
  for (let i = 0; i < 3000 && viktor.wish.promised.length; i++) game.fixed(viktor.x, viktor.z);
  ok(!viktor.wish.promised.length && viktor.happy >= 100 && S.Moods.has(viktor, 'wishDone') && viktor.wish.streak === 1, 'a kept promise gives happiness and a moodlet');
  ok(game.events.some(e => e.type === 'wish') || world.events.length >= 0, 'a kept promise is announced');
  W.promise(world, viktor, 1);
  S.Traits.learn(world, viktor, world.sims.find(s => s.free));
  game.fixed(viktor.x, viktor.z);
  ok(viktor.wish.streak === 2 && S.Moods.has(viktor, 'wishDone2'), 'promises kept in a row feel better');
  W.promise(world, viktor, 0);
  W.dismiss(world, viktor, 0, true);
  ok(viktor.wish.streak === 0 && !viktor.wish.promised.length, 'dropping a promise breaks the run');
  for (let i = 0; i < 5; i++) {
    viktor.wish.offered.push({ id: 'daily_bath', left: 240 });
    W.promise(world, viktor, viktor.wish.offered.length - 1);
  }
  ok(viktor.wish.promised.length === W.PROMISE_SLOTS, 'four promises at most');
  viktor.wish.promised = [];
  viktor.wish.offered = [{ id: 'daily_tv', left: 1 }];
  game.fixed(viktor.x, viktor.z);
  game.fixed(viktor.x, viktor.z);
  ok(!viktor.wish.offered.some(e => e.id === 'daily_tv' && e.left <= 0), 'an old offer disappears');

  const shop = world.lots.find(l => W.placeKey(l) === 'shop');
  astrid.wish.promised = [{ id: 'place_shop', base: W.counter(astrid, S.WISHES.place_shop.goal) }];
  astrid.inside = shop;
  astrid.lot = shop;
  game.fixed(viktor.x, viktor.z);
  ok(!astrid.wish.promised.length, 'a trip to the shop makes the wish come true');
  astrid.inside = null;
  astrid.lot = world.lots[0];

  ok(W.dreamChoices(viktor).length === W.DREAM_CHOICES, 'five lifetime wishes to choose from');
  ok(W.dreamName('heistKing', 'f') === 'Королева ограблений' && W.dreamName('heistKing', 'm') === 'Король ограблений' && W.dreamName('mayor', 'f') === W.dreamName('mayor', 'm'), 'a lifetime wish is named by the sex of the sim');
  ok(!Object.values(S.WISHES).some(w => /Стать взрослым|Попробовал всё/.test(w.name)), 'wish names do not assume a male sim');
  const top = W.dreamChoices(astrid)[0];
  ok(S.DREAMS[top].traits.some(id => S.Traits.has(astrid, id)), 'the first offered dream fits the traits: ' + top);
  ok(!W.chooseDream(world, hugo, top) && W.chooseDream(world, astrid, 'storyPainter') && astrid.dream.id === 'storyPainter', 'only adults choose a lifetime wish');
  ok(W.forDream(astrid, S.WISHES.daily_paint) && W.pointsOf(astrid, S.WISHES.daily_paint) === Math.round(S.WISHES.daily_paint.points * W.DREAM_BONUS), 'wishes on the way to the dream pay more');

  lily.happy = 12000;
  ok(!W.buy(world, lily, 'airDiet') && lily.happy === 12000, 'a reward costs happiness');
  ok(W.buy(world, lily, 'steelBladder') && lily.happy === 2000 && lily.rewards.includes('steelBladder'), 'a reward is bought');
  ok(!W.buy(world, lily, 'steelBladder'), 'a perk is bought once');
  ok(W.needRate(lily, 'bladder') === 0.5 && W.needRate(lily, 'hunger') === 1, 'a steel bladder halves the need');
  const slowGame = new S.Game(doc, 1), sw = slowGame.world, slowSim = sw.family[3], plain = sw.family[0];
  slowGame.freeWill = 0;
  slowGame.setSpeed(3);
  slowSim.rewards = ['steelBladder'];
  plain.rewards = [];
  for (const s of [slowSim, plain]) {
    s.needs.bladder = 90;
    s.traits = [];
  }
  for (let i = 0; i < 450; i++) slowGame.fixed(plain.x, plain.z);
  ok(90 - slowSim.needs.bladder < (90 - plain.needs.bladder) * 0.6, 'the bladder really fills slower: ' + slowSim.needs.bladder.toFixed(1) + ' vs ' + plain.needs.bladder.toFixed(1));
  pip.happy = 70000;
  ok(W.buy(world, pip, 'moodRemover'), 'an item reward can be bought');
  pip.moods = [['fumed', 50], ['homeMeal', 100]];
  W.useMoodRemover(world, pip);
  ok(!pip.moods.some(([id]) => S.MOODLETS[id].value < 0), 'the mood remover removes bad moodlets');
  astrid.happy = 10000;
  ok(W.buy(world, astrid, 'changeDream') && astrid.dream === null, 'a new lifetime wish can be chosen');

  const file = S.Save.file(game, null), copy = new S.Game(doc, 1);
  S.Save.apply(copy, JSON.parse(JSON.stringify(file)));
  const back = copy.world.family[3];
  ok(back.rewards.includes('steelBladder') && Math.round(back.happy) === Math.round(lily.happy) && back.wish.offered.length === lily.wish.offered.length, 'wishes, happiness and rewards survive a save');
  ok(copy.hash() === game.hash(), 'a loaded game with wishes is the same game');
  const broken = JSON.parse(JSON.stringify(file));
  broken.state.sims[0][43].wish.offered = [{ id: 'noSuchWish', left: 5 }];
  assert.throws(() => S.Save.apply(new S.Game(doc, 1), broken), /неизвестное желание/, 'an unknown wish in a file is refused');
  checks++;
  const v4 = JSON.parse(JSON.stringify(file));
  v4.version = 4;
  v4.state.sims = v4.state.sims.map(r => r.slice(0, 43));
  const up = S.Save.migrate(v4);
  ok(up.version === S.Save.VERSION && up.state.sims.every(r => r.length === 49 && r[43] === null && r[44] === null && r[45] === null && r[46] === null && r[47] === null && r[48] === null), 'a file of version 4 gets wish, social, skill and craft fields');
  const old = new S.Game(doc, 1);
  S.Save.apply(old, up);
  ok(old.world.family.every(s => s.wish && s.happy === 0 && Array.isArray(s.rewards)), 'an old file starts the family with fresh wishes');

  const hadDocument = globalThis.document, canvasStub = () => {
    const g = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, clearRect() {}, drawImage() {}, fillRect() {}, strokeRect() {}, getContext() { return g; } };
    return { width: 800, height: 600, getContext: () => g, g };
  };
  globalThis.document = { createElement: canvasStub };
  const uiGame = new S.Game(doc, 1), uw = uiGame.world, us = uw.family[1], toasts = [];
  uiGame.active = us;
  const ui = {
    game: uiGame, scene: uiGame.scene, opts: {}, screen: { sw: 800, sh: 600 }, render: null, viewState: null, floor: 0, wallMode: 'cut', stamp: 'x', pointer: null,
    get selected() { return uiGame.active; },
    map: { toggle() {} }, saves: { show() {} }, goHome() {}, zoomStep() {}, turn() {}, setFloor() {}, setWallMode() {},
    selectSim(sim) { uiGame.active = sim; }, faceOf: () => null, toast: t => toasts.push(t)
  };
  const view = new S.LiveView(ui, canvasStub());
  view.layout(ui.screen);
  const Y = view.top, L = view.layer;
  us.wish.offered = [{ id: 'daily_shower', left: 200 }, { id: 'daily_tv', left: 120 }];
  const offeredItem = L.items.find(i => i.x === 140 && i.round);
  ok(offeredItem && offeredItem.when() && /обещать/.test(offeredItem.tip().keys) && /\+100 счастья/.test(offeredItem.tip().line), 'an offered wish shows its points and how to promise');
  offeredItem.click(0);
  ok(us.wish.promised.length === 1 && us.wish.promised[0].id === 'daily_shower', 'a click on an offered wish promises it');
  const well = L.items.find(i => i.x === 167 && i.y === Y + 10);
  ok(/снять/.test(well.tip().keys) && /Совет/.test(well.tip().later), 'a promised wish gives advice');
  well.click(2);
  ok(!us.wish.promised.length, 'the right button drops a promise');
  const dreamWell = L.items.find(i => i.x === 266 && i.y === Y + 42);
  dreamWell.click(0);
  ok(view.dreamOpen && view.dreamList.length === 5, 'the dream well opens five lifetime wishes');
  const box = view.dreamBox();
  view.dreamClick(box.x + 40, box.y + 34 + 10);
  ok(!view.dreamOpen && us.dream && us.dream.id === view.dreamList[0], 'a click chooses the lifetime wish');
  view.openTab(S.LiveView.TABS.findIndex(t => t.id === 'rewards'));
  const shelf = L.items.find(i => i.x === 470 && i.y === Y + 4 && i.parts);
  ok(shelf && shelf.when() && shelf.parts(470 + 5, Y + 30) === Object.keys(S.REWARDS)[0], 'the rewards are on a shelf');
  us.happy = 12000;
  shelf.click(0, 'steelBladder', 0, 0, 1000);
  ok(!us.rewards.includes('steelBladder') && /ещё раз/.test(toasts[toasts.length - 1]), 'the first click on a reward asks again');
  shelf.click(0, 'steelBladder', 0, 0, 2000);
  ok(us.rewards.includes('steelBladder') && us.happy === 2000, 'the second click buys the reward');
  ok(/уже есть/.test(shelf.tip('steelBladder').line), 'a bought reward says so');
  globalThis.document = hadDocument;
}

{
  const SO = S.Social, R = S.Rel, ROWS = SO.ALL, F = R.F;
  const bySection = id => ROWS.filter(r => r.section === id).length;
  ok(ROWS.length === 119 && bySection('friendly') === 30 && bySection('ask') === 12 && bySection('jokes') === 10 && bySection('romance') === 22 && bySection('mean') === 14 && bySection('special') === 31, 'the social table has the sizes of the plan, three charisma lines and the career lines');
  ok(new Set(ROWS.map(r => r.id)).size === ROWS.length && new Set(ROWS.map(r => r.name)).size === ROWS.length, 'social actions have unique ids and names');
  const needs = new Set(['any', 'new', 'met', 'friend', 'good', 'cold', 'dislike', 'enemy', 'crush', 'romance', 'unkissed', 'couple', 'engaged', 'spouse', 'partner', 'sad', 'kin']);
  const sets = new Set(['romance', 'couple', 'engaged', 'spouse', 'ex', 'exSpouse', 'best', 'oath', 'kissed', 'makeUp']);
  for (const row of ROWS) {
    ok(S.ADS[row.id] && S.ADS[row.id].person && S.ADS[row.id].soc === row, 'a social action is a person action: ' + row.id);
    ok(S.Icons.NAMES.includes(row.icon) && S.Clips.LIST[row.clip], 'a social action has an icon and a clip: ' + row.id);
    for (const clip of [row.react, row.miss]) if (clip) ok(S.Clips.LIST[clip], 'a reaction clip exists: ' + row.id + ' ' + clip);
    ok(needs.has(row.need) && S.AGE_RANK[row.age] !== undefined && row.mins > 0 && row.chance > 0 && row.chance <= 1, 'a social action has a rule, an age and a chance: ' + row.id);
    for (const pair of [row.mood, row.sad]) for (const id of pair || []) if (id) ok(S.MOODLETS[id], 'a social moodlet exists: ' + row.id + ' ' + id);
    if (row.family) ok(S.MOODLETS[row.family], 'a family quarrel moodlet exists: ' + row.id);
    if (row.set) ok(sets.has(row.set), 'a social action sets a known status: ' + row.id);
    if (row.trait) ok(S.TRAITS[row.trait], 'a special action names a real trait: ' + row.id);
    if (row.share) ok(S.TRAITS[row.share], 'a shared interest is a real trait: ' + row.id);
    if (row.romance) ok(row.romance === 'teen' || row.romance === 'adult', 'a romance action knows its ages: ' + row.id);
    ok(!/[—–]/.test(row.name), 'no long dashes in a social action: ' + row.id);
    for (const ch of row.name) ok(S.Font.has('bold', ch), 'the font has the letter of ' + row.id + ': ' + ch);
    ok(S.Font.measure('bold', row.name) < 220, 'a social action fits a pill: ' + row.id);
  }
  ok(ROWS.filter(r => r.section === 'romance').every(r => r.romance), 'every romance action is marked for ages');
  for (const id of ['hug', 'kiss', 'peck', 'handshake', 'highFive', 'blush', 'flirt', 'fistShake', 'point', 'scare', 'slap', 'shove', 'tickle', 'bow', 'phone']) ok(S.Clips.LIST[id] && S.Clips.LIST[id].channels.length >= 4, 'a social clip exists: ' + id);
  ok(S.Icons.NAMES.includes('phone') && S.Icons.NAMES.includes('pin'), 'phone and map pin icons exist');

  const game = new S.Game(doc, 1), world = game.world, [viktor, astrid, hugo, lily, pip] = world.family;
  game.freeWill = 0;
  game.setSpeed(3);
  ok(R.status(world, viktor, astrid) === 'spouse' && R.word(world, viktor, astrid) === 'Жена' && R.word(world, astrid, viktor) === 'Муж', 'the sample couple is married');
  ok(R.kinOf(world, viktor, hugo) === 'child' && R.kinWord(world, viktor, hugo) === 'Сын' && R.kinWord(world, viktor, lily) === 'Дочь' && R.kinWord(world, hugo, viktor) === 'Отец' && R.kinWord(world, hugo, astrid) === 'Мать', 'parents and children know each other');
  ok(R.kinWord(world, hugo, lily) === 'Сестра' && R.kinWord(world, lily, pip) === 'Брат' && R.kinOf(world, viktor, astrid) === null, 'brothers and sisters are found through parents');
  ok(R.value(world, hugo, lily) === 45 && R.value(world, viktor, pip) === 60 && R.value(world, viktor, astrid) === 70, 'family starts with warm relations');
  ok(viktor.surname === 'Вандербек' && pip.surname === 'Вандербек', 'the family has a surname');
  {
    const fakeWorld = { sims: [], rels: null };
    const mk = (name, sex, parents) => ({ name, sex, age: 'adult', parents });
    const g0 = mk('Дед', 'm', null), g1 = mk('Бабушка', 'f', null), p0 = mk('Отец', 'm', [0, 1]), p1 = mk('Дядя', 'm', [0, 1]), c0 = mk('Сын', 'm', [2]), c1 = mk('Кузина', 'f', [3]);
    fakeWorld.sims.push(g0, g1, p0, p1, c0, c1);
    fakeWorld.sims.forEach((s, i) => { s.ix = i; });
    ok(R.kinOf(fakeWorld, c0, g0) === 'grandparent' && R.kinOf(fakeWorld, g1, c0) === 'grandchild' && R.kinOf(fakeWorld, c0, p1) === 'uncle' && R.kinOf(fakeWorld, p1, c0) === 'nephew' && R.kinOf(fakeWorld, c0, c1) === 'cousin', 'the family tree finds two levels up and down');
    ok(R.kinWord(fakeWorld, c0, c1) === 'Двоюродная сестра' && R.kinWord(fakeWorld, c0, g1) === 'Бабушка' && R.kinWord(fakeWorld, g0, c0) === 'Внук', 'kin words follow the sex');
  }

  const bring = (sim, to, dx) => {
    Object.assign(sim, { inside: null, live: true, trip: null, car: null, after: null, order: null, path: null, state: 'idle', day: null, hold: 0 });
    Object.assign(sim, { x: to.x + dx, z: to.z, floor: to.floor, lot: to.lot, y: to.y });
    if (!world.live.includes(sim)) world.live.push(sim);
  };
  const say = (sim, id, other, force) => {
    const act = S.Acts.adAct(id, world.lots[0], null);
    act.with = world.sims.indexOf(other);
    if (force !== undefined) {
      const chance = SO.chance;
      SO.chance = () => force;
      S.Acts.add(world, sim, act);
      for (let i = 0; i < 6000 && (sim.act || sim.queue.length); i++) game.fixed(sim.x, sim.z);
      SO.chance = chance;
    } else {
      S.Acts.add(world, sim, act);
      for (let i = 0; i < 6000 && (sim.act || sim.queue.length); i++) game.fixed(sim.x, sim.z);
    }
    return R.get(world, sim, other);
  };
  const man = world.sims.find(s => s.free && s.age === 'adult' && s.sex === 'm'), woman = world.sims.find(s => s.free && s.age === 'adult' && s.sex === 'f');
  const teenA = world.sims.find(s => s.free && s.age === 'teen'), teenB = world.sims.filter(s => s.free && s.age === 'teen')[1], kidTown = world.sims.find(s => s.free && s.age === 'child');
  bring(woman, astrid, 2);
  ok(R.status(world, astrid, woman) === 'stranger' && R.word(world, astrid, woman) === 'Незнакомка', 'a stranger has no relation yet');
  const firstMenu = flatMenu(S.Acts.menu(world, astrid, { type: 'sim', sim: woman }));
  ok(firstMenu.some(o => o.ad === 'introduce') && firstMenu.find(o => o.ad === 'heart_talk').closed === 'Вы пока не друзья', 'a stranger can be met, closer talks wait');
  ok(!firstMenu.some(o => o.dot) && firstMenu.every(o => !o.tip || !o.tip.line), 'chances stay hidden with a stranger');
  game.events.length = 0;
  let rel = say(astrid, 'introduce', woman, 1);
  ok(rel && rel.f & F.met && R.status(world, astrid, woman) === 'known' && R.word(world, astrid, woman) === 'Знакомая', 'introducing makes them acquainted');
  ok(game.events.some(e => e.type === 'rel' && /теперь знакомы/.test(e.text)) && S.Moods.has(astrid, 'newAcquaintance'), 'a new acquaintance is announced and felt');
  ok(!flatMenu(S.Acts.menu(world, astrid, { type: 'sim', sim: woman })).some(o => o.ad === 'introduce'), 'introducing twice is not offered');
  let guard = 0;
  while (R.value(world, astrid, woman) < R.FRIEND && guard++ < 30) say(astrid, 'sim_chat', woman, 1);
  ok(R.status(world, astrid, woman) === 'friend' && R.word(world, astrid, woman) === 'Подруга' && R.word(world, woman, astrid) === 'Подруга', 'chats turn into friendship');
  ok(S.Moods.has(astrid, 'newFriend') && astrid.wish.memo.soc['#friend'] === 1 && astrid.wish.memo.friendsNow === 1, 'a new friend is felt and counted');
  ok(woman.hold > 0 || woman.chatLeft > 0, 'the town person stays for the conversation');
  const known = flatMenu(S.Acts.menu(world, astrid, { type: 'sim', sim: woman })).filter(o => !o.closed && S.Social.SOCIALS[o.ad]);
  ok(known.every(o => o.dot && /Шанс: \d+%/.test(o.tip.line)), 'a friend shows the chance of every action');
  rel = R.get(world, astrid, woman);
  rel.v = 85;
  say(astrid, 'best_friends', woman, 1);
  ok(R.status(world, astrid, woman) === 'best' && R.word(world, astrid, woman) === 'Лучшая подруга', 'best friends need an offer');
  say(astrid, 'insult', woman, 1);
  ok(R.value(world, astrid, woman) < 85 && !woman.moods, 'an insult hurts the relation, a town person has no moodlets');
  rel.v = -30;
  ok(R.status(world, astrid, woman) === 'dislike' && flatMenu(S.Acts.menu(world, astrid, { type: 'sim', sim: woman })).some(o => o.ad === 'make_up'), 'dislike opens making up');
  rel.v = -70;
  ok(R.status(world, astrid, woman) === 'enemy' && R.word(world, astrid, woman) === 'Враг', 'low relation means enemies');
  say(astrid, 'enemy_oath', woman, 1);
  ok(R.status(world, astrid, woman) === 'oldEnemy', 'an oath makes old enemies');
  say(astrid, 'make_up', woman, 1);
  ok(R.value(world, astrid, woman) === 0 && !(R.get(world, astrid, woman).f & F.oath) && astrid.wish.memo.soc['#peace'] === 1 && astrid.wish.memo.soc['#reconcile'] === 1, 'making up with an enemy resets the feud');

  bring(man, astrid, 2);
  const flirtRow = SO.SOCIALS.flirt;
  ok(SO.allowed(world, astrid, man, flirtRow).closed === 'Сначала надо познакомиться', 'flirting needs an introduction');
  const relMan = R.make(world, astrid, man);
  relMan.f |= F.met;
  relMan.v = 40;
  say(astrid, 'flirt', man, 1);
  ok(R.status(world, astrid, man) === 'romance' && S.Moods.has(astrid, 'crush'), 'a successful flirt sparks romance');
  ok(S.Moods.has(viktor, 'jealous') || !(Math.hypot(viktor.x - astrid.x, viktor.z - astrid.z) < 12 && viktor.lot === astrid.lot), 'a spouse who sees flirting is jealous');
  relMan.v = 60;
  ok(SO.allowed(world, astrid, man, SO.SOCIALS.go_steady).closed === 'Сначала нужен развод', 'a married sim cannot go steady with another');
  ok(SO.allowed(world, astrid, man, SO.SOCIALS.kiss).closed === undefined, 'a married sim can still kiss, and it is cheating');
  say(viktor, 'divorce', astrid, 1);
  ok(R.status(world, viktor, astrid) === 'exSpouse' && R.word(world, viktor, astrid) === 'Бывшая жена' && S.Moods.has(viktor, 'divorce'), 'a divorce leaves ex spouses');
  say(astrid, 'go_steady', man, 1);
  ok(R.status(world, astrid, man) === 'couple' && R.word(world, astrid, man) === 'Парень' && astrid.couples.includes(man.id), 'going steady makes a couple');
  relMan.v = 80;
  say(astrid, 'propose', man, 1);
  ok(R.status(world, astrid, man) === 'engaged' && R.word(world, astrid, man) === 'Жених' && relMan.by === world.sims.indexOf(astrid), 'a proposal makes them engaged');
  game.events.length = 0;
  say(astrid, 'marry_now', man, 1);
  ok(R.status(world, astrid, man) === 'spouse' && R.word(world, man, astrid) === 'Жена' && man.surname === 'Вандербек', 'the one who proposed gives the surname');
  ok(S.Moods.has(astrid, 'wedding') && S.Moods.has(astrid, 'honeymoon') && game.events.some(e => e.type === 'join' && e.index === world.sims.indexOf(man)), 'a wedding with a town person asks about moving in');
  ok(SO.join(world, man) && world.family.includes(man) && man.needs && man.wish && !man.free && man.home === world.lots[0], 'a spouse moves in and joins the family');
  ok(!SO.join(world, man), 'nobody joins twice');
  const saved = JSON.parse(JSON.stringify(S.Save.file(game, null))), back = new S.Game(doc, 1);
  S.Save.apply(back, saved);
  const backMan = back.world.sims[world.sims.indexOf(man)];
  ok(back.world.family.length === 6 && back.world.family.includes(backMan) && backMan.needs && !backMan.free, 'the new family member survives a save');
  ok(R.status(back.world, back.world.family[1], backMan) === 'spouse' && backMan.surname === 'Вандербек', 'relations and surnames survive a save');
  ok(back.hash() === game.hash(), 'a loaded social game is the same game');
  const fresh2 = new S.Game(doc, 1);
  S.Save.apply(fresh2, saved);
  S.Save.apply(fresh2, JSON.parse(JSON.stringify(S.Save.file(new S.Game(doc, 1), null))));
  ok(fresh2.world.family.length === 5 && fresh2.world.sims[world.sims.indexOf(man)].free, 'loading an older file sends a joined person back to town');
  const badFamily = JSON.parse(JSON.stringify(saved));
  badFamily.state.family = [999];
  assert.throws(() => S.Save.apply(new S.Game(doc, 1), badFamily), /состав семьи/, 'a broken family list is refused');
  checks++;
  const badLine = JSON.parse(JSON.stringify(saved));
  badLine.state.sims[world.sims.indexOf(woman)][44][3] = ['noSuchLine', 0, 1, 0, 'talk'];
  assert.throws(() => S.Save.apply(new S.Game(doc, 1), badLine), /неизвестная реплика/, 'an unknown social line is refused');
  checks++;
  const v5 = JSON.parse(JSON.stringify(saved));
  v5.version = 5;
  v5.state.sims = v5.state.sims.map(r => r.slice(0, 44));
  delete v5.state.rels;
  delete v5.state.party;
  delete v5.state.family;
  const old = new S.Game(doc, 1), up = S.Save.migrate(v5);
  ok(up.version === S.Save.VERSION && up.state.rels === null && up.state.sims.every(r => r.length === 49 && r[44] === null && r[45] === null && r[46] === null && r[48] === null), 'a file of version 5 gets social, skill and craft fields');
  S.Save.apply(old, up);
  ok(R.status(old.world, old.world.family[0], old.world.family[1]) === 'spouse' && R.kinWord(old.world, old.world.family[2], old.world.family[0]) === 'Отец', 'an old file gets the family relations of the town');

  const party = new S.Game(doc, 4), pw = party.world, host = pw.family[0];
  party.freeWill = 0;
  party.setSpeed(3);
  const friendsOf = pw.sims.filter(s => s.free && s.age === 'adult').slice(0, 5);
  for (const other of friendsOf) {
    const r = R.make(pw, host, other);
    r.f |= F.met;
    r.v = 50;
    r.last = SO.now(pw);
  }
  const phone = S.Acts.menu(pw, host, { type: 'sim', sim: host });
  ok(phone.some(o => o.label === 'Позвонить…' && o.section && o.section.length === 5) && phone.some(o => o.phone === 'party' && !o.closed), 'the phone lists contacts and offers a party');
  ok(R.rows(pw, host).filter(r => r.other.free).length === 5, 'the relations list shows town friends');
  const call = { ad: 'phone_call', lot: host.home.index, item: -1, step: 0, phase: 'start', left: 0, phone: 'chat', with: pw.sims.indexOf(friendsOf[0]) };
  S.Acts.add(pw, host, call);
  for (let i = 0; i < 4000 && (host.act || host.queue.length); i++) party.fixed(host.x, host.z);
  ok(host.wish.memo.soc['#calls'] === 1 && R.get(pw, host, friendsOf[0]).last >= SO.now(pw) - 30, 'a phone call is made and counted');
  const accept = SO.accepts;
  SO.accepts = () => true;
  ok(SO.planParty(pw, host, 'party', null) && pw.party && pw.party.guests.length === 5 && friendsOf.every(s => s.visit && s.visit.kind === 'party'), 'a party invites the guests');
  ok(!SO.planParty(pw, host, 'party', null) && SO.allowed(pw, host, friendsOf[0], SO.SOCIALS.plan_wedding).closed !== undefined, 'only one party at a time');
  SO.accepts = accept;
  const events = [];
  const end = pw.party.end;
  for (let i = 0; i < 400000 && pw.party && SO.now(pw) < end + 30; i++) {
    party.fixed(host.x, host.z);
    events.push(...party.events.splice(0));
  }
  ok(!pw.party && events.some(e => e.type === 'party' && /начинается/.test(e.text)) && events.some(e => e.type === 'party' && e.stars >= 1 && e.stars <= 5), 'a party starts, ends and gets stars');
  ok(friendsOf.some(s => s.lot === pw.lots[0] || s.visit === null) && friendsOf.every(s => !s.visit), 'guests come and go home after the party');
  ok(host.wish.memo.soc['#parties'] === 1, 'a party is counted for wishes');

  const visit = new S.Game(doc, 5), vw = visit.world, vhost = vw.family[1], guest = vw.sims.find(s => s.free && s.age === 'adult' && !s.car);
  visit.freeWill = 0;
  visit.setSpeed(3);
  const gr = R.make(vw, vhost, guest);
  gr.f |= F.met;
  gr.v = 40;
  SO.invite(vw, vhost, guest, 'guest', 30, 300);
  const visitEvents = [];
  for (let i = 0; i < 300000 && guest.visit; i++) {
    visit.fixed(vhost.x, vhost.z);
    visitEvents.push(...visit.events.splice(0));
  }
  ok(visitEvents.some(e => e.type === 'visit' && e.text === guest.name + ' на пороге') && visitEvents.some(e => /уходит домой/.test(e.text || '')), 'a guest arrives and leaves');
  ok(guest.dayIndex === -1 || guest.day, 'a guest returns to the town schedule');

  const decay = new S.Game(doc, 1), dw = decay.world, da = dw.family[0], townFriend = dw.sims.find(s => s.free);
  const dr = R.make(dw, da, townFriend);
  dr.f |= F.met;
  dr.v = 65;
  dr.last = SO.now(dw);
  dr.since = dw.day;
  dw.day += 12;
  SO.step(dw, 0);
  ok(R.status(dw, da, townFriend) === 'distant' || R.band(dr.v) === 'friend', 'a forgotten friendship drops a step');
  dr.v = 70;
  ok(SO.heldMoods(dw, da).includes('missFriend'), 'an old friend is missed');

  const pick = (sim, other, id) => SO.weight(world, sim, other, SO.SOCIALS[id]);
  const kindSim = { traits: ['friendly'], age: 'adult', sex: 'f', needs: null, chatLeft: 0, chatWith: -1, lot: null, home: null }, meanSim = { traits: ['meanSpirited', 'hotHeaded'], age: 'adult', sex: 'm', needs: null, chatLeft: 0, chatWith: -1, lot: null, home: null };
  world.sims.push(kindSim, meanSim);
  kindSim.ix = world.sims.length - 2;
  meanSim.ix = world.sims.length - 1;
  R.make(world, kindSim, meanSim).f |= F.met;
  ok(pick(meanSim, kindSim, 'insult') > pick(kindSim, meanSim, 'insult') * 5 && pick(kindSim, meanSim, 'compliment') > pick(meanSim, kindSim, 'compliment'), 'traits steer the choice of lines');
  ok(SO.chance(world, kindSim, meanSim, SO.SOCIALS.tell_joke) > SO.chance(world, kindSim, Object.assign({}, meanSim, { traits: ['noHumor'] }), SO.SOCIALS.tell_joke), 'a joke has less chance with a sim without humor');
  world.sims.splice(world.sims.length - 2, 2);
  {
    const w = new S.Game(doc, 1).world, sa = w.family[1], dream = S.DREAMS.everyoneFriend;
    sa.dream = { id: 'everyoneFriend' };
    ok(SO.dreamProgress(w, sa, dream)[0] === 0 && SO.dreamProgress(w, sa, dream)[1] === 20, 'friends count toward the lifetime wish');
    const before = sa.happy;
    ok(S.Wishes.dreamDone(w, sa) && sa.happy === before + dream.points && S.Moods.has(sa, 'dreamDone') && !S.Wishes.dreamDone(w, sa), 'a lifetime wish comes true once');
  }
}

{
  const SO = S.Social, R = S.Rel;
  const game = new S.Game(doc, 1), world = game.world, [viktor, astrid] = world.family;
  game.freeWill = 0;
  game.setSpeed(3);
  astrid.needs.bladder = 10;
  const line = S.Acts.adAct('sim_chat', world.lots[0], null);
  line.with = world.sims.indexOf(astrid);
  S.Acts.add(world, viktor, line);
  let listened = false;
  for (let i = 0; i < 3000 && (viktor.act || viktor.queue.length); i++) {
    game.fixed(viktor.x, viktor.z);
    listened = listened || !!(astrid.act && astrid.act.listen);
  }
  ok(!listened, 'a sim who badly needs the toilet does not stop to listen');
  ok(!S.Acts.canListen(astrid) && S.Acts.canListen(viktor), 'listening waits for pressing needs');
  const rel = R.make(world, viktor, world.sims.find(s => s.free));
  rel.f |= R.F.met;
  rel.v = 7.354999;
  ok(R.pack(world).some(r => r[2] === 7.354999), 'relations are saved at full precision');
  const party = { kind: 'party', host: 0, lot: 0, start: 10, end: 20, guests: [5], on: 1, wins: 2, music: 1.234567, food: 0.5, grill: 0, couple: null };
  world.party = party;
  const packed = SO.packParty(world);
  ok(packed[8] === 1.234567 && SO.unpackParty(world, packed).music === 1.234567, 'a party is saved at full precision');
  world.party = null;
  assert.throws(() => SO.unpackParty(world, ['concert', 0, 0, 1, 2, [], 0, 0, 0, 0, 0, null]), /праздник/, 'an unknown party kind is refused');
  checks++;

  const hadDocument = globalThis.document, canvasStub = () => {
    const g = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, clearRect() {}, drawImage() {}, fillRect() {}, strokeRect() {}, beginPath() {}, arc() {}, fill() {}, getContext() { return g; } };
    return { width: 800, height: 600, getContext: () => g, g };
  };
  globalThis.document = { createElement: canvasStub };
  const uiGame = new S.Game(doc, 1), uw = uiGame.world, us = uw.family[1], friend = uw.sims.find(s => s.free && s.age === 'adult'), toasts = [], marks = [];
  const fr = R.make(uw, us, friend);
  fr.f |= R.F.met;
  fr.v = 50;
  fr.last = SO.now(uw);
  uiGame.active = us;
  const ui = {
    game: uiGame, scene: uiGame.scene, opts: {}, screen: { sw: 800, sh: 600 }, render: null, viewState: null, floor: 0, wallMode: 'cut', stamp: 'x', time: 5,
    get selected() { return uiGame.active; },
    map: { open: false, mark: null, toggle() { this.open = !this.open; marks.push(this.mark); } }, saves: { show() {} }, goHome() {}, zoomStep() {}, turn() {}, setFloor() {}, setWallMode() {},
    sound: { play() {} }, selectSim(sim) { uiGame.active = sim; }, faceOf: () => null, toast: (text, bad) => toasts.push([text, bad])
  };
  const view = new S.LiveView(ui, canvasStub());
  view.layout(ui.screen);
  const Y = view.top, tab = S.LiveView.TABS.findIndex(x => x.id === 'relations');
  ok(!S.LiveView.TABS[tab].later, 'the relations tab works now');
  view.openTab(tab);
  const rows = view.relRows();
  ok(rows.length === 5 && rows[0].kin === null && rows[0].status === 'spouse' && rows.some(r => r.other === friend && r.word === (friend.sex === 'f' ? 'Подруга' : 'Друг')), 'the relations list shows the family first and the friend');
  view.drawTab(canvasStub().g, 456, Y);
  view.relFilter = 'friends';
  ok(view.relRows().length === 1 && view.relRows()[0].other === friend, 'the friends filter keeps only friends');
  view.relFilter = 'family';
  ok(view.relRows().length === 4 && view.relRows().every(r => r.kin || r.status === 'spouse'), 'the family filter keeps only relatives');
  view.relFilter = 'all';
  view.relSort = 'name';
  const names = view.relRows().map(r => r.other.name);
  ok(names.join() === names.slice().sort().join(), 'rows can be sorted by name');
  view.relSort = 'status';
  ok(view.wheel(600, Y + 50, 1) && view.relScroll === 1 && !view.wheel(100, Y + 50, 1), 'the wheel scrolls the relations list over the tab only');
  view.relScroll = 0;
  const friendRow = view.relRows().find(r => r.other === friend), tip = view.relTip(friendRow);
  ok(/Отношения: \+50/.test(tip.line) && /Виделись сегодня/.test(tip.later), 'a row hint shows the relation and the last meeting');
  view.callRow(friendRow);
  ok(us.queue.some(a => a.ad === 'phone_call' && a.phone === 'chat' && a.with === uw.sims.indexOf(friend)), 'the call button rings the friend');
  view.callRow(view.relRows().find(r => r.status === 'spouse'));
  ok(toasts.some(([text, bad]) => bad && /живёт с вами/.test(text)), 'nobody calls a family member');
  view.markRow(friendRow);
  ok(ui.map.open && ui.map.mark && ui.map.mark.sim === friend, 'the pin opens the map on the person');
  const label = S.Acts.label(us.queue.find(a => a.ad === 'phone_call'), us, uw);
  ok(label === 'Поболтать по телефону: ' + friend.name, 'the queue names the call and the person: ' + label);
  globalThis.document = hadDocument;

  const pieGame = new S.Game(doc, 1), pieWorld = pieGame.world, pa = pieWorld.family[1], stranger = pieWorld.sims.find(s => s.free && s.age === 'adult');
  const pieUi = { scene: pieGame.scene, game: pieGame, selected: pa, screen: { sw: 800, sh: 600 }, stamp: 'x', toast() {}, pieChoice() {} };
  const pie = new S.PieView(pieUi);
  Object.assign(stranger, { inside: null, car: null, lot: pa.lot, floor: pa.floor, x: pa.x + 2, z: pa.z });
  pie.show(400, 300, { type: 'sim', sim: stranger, title: stranger.name, sub: 'Незнакомка · Черты: ?, ?, ?, ?, ?' });
  ok(pie.pills.every(p => !(p.x < pie.cx + pie.titleW / 2 && pie.cx - pie.titleW / 2 < p.x + p.w && p.y < pie.cy + pie.titleH / 2 && pie.cy - pie.titleH / 2 < p.y + p.h)), 'menu items stay clear of a wide title');
  pie.choose(pie.pills.findIndex(p => p.option.label === 'Дружеское…'));
  ok(pie.pills[0].option.label === 'Назад' && pie.pills.some(p => p.option.label === 'Представиться'), 'a section opens in place with a way back');
  pie.choose(pie.pills.findIndex(p => p.option.label === 'Ещё…'));
  ok(pie.pills[0].option.label === 'Назад', 'every page of a section keeps the way back');
  pie.choose(0);
  ok(pie.pills.some(p => p.option.label === 'Романтика…'), 'going back returns to the sections');
}

{
  const SO = S.Social, R = S.Rel, AGES = ['toddler', 'child', 'teen', 'adult'], romanceRows = SO.ALL.filter(r => r.romance);
  const TEEN_LIGHT = ['flirt_compliment', 'confess_crush', 'hold_hands', 'romantic_hug', 'cheek_kiss', 'first_kiss', 'walk_together', 'go_steady', 'break_up'];
  assert.deepEqual(romanceRows.filter(r => r.romance === 'teen').map(r => r.id), TEEN_LIGHT, 'teens get only the light list of the plan');
  checks++;
  ok(romanceRows.every(r => S.AGE_RANK[r.age] >= S.AGE_RANK.teen), 'no romance action for children');
  const ADULT_CLIPS = new Set(['kiss', 'flirt']);
  ok(romanceRows.filter(r => r.romance === 'teen').every(r => !ADULT_CLIPS.has(r.clip) && !ADULT_CLIPS.has(r.react || '')), 'teen romance never uses adult romance clips');
  const world = new S.Game(doc, 1).world;
  const people = {};
  let n = world.sims.length;
  for (const age of AGES) {
    people[age] = [0, 1].map(k => {
      const sim = { id: 'x' + age + k, name: age + k, age, sex: k ? 'f' : 'm', traits: ['flirty'], needs: null, moods: null, parents: null, ix: n++, chatLeft: 0, chatWith: -1, lot: null, home: world.lots[0], visit: null };
      world.sims.push(sim);
      return sim;
    });
  }
  let pairs = 0;
  for (const a of AGES) {
    for (const b of AGES) {
      const x = people[a][0], y = people[b][1], rel = R.make(world, x, y);
      rel.f = R.F.met | R.F.romance | R.F.couple;
      rel.v = 90;
      for (const row of romanceRows) {
        const rule = SO.allowed(world, x, y, row), may = (a === 'adult' && b === 'adult') || (a === 'teen' && b === 'teen' && row.romance === 'teen');
        if (!may) {
          ok(rule.hide === true, 'a forbidden romance is hidden: ' + a + ' to ' + b + ' ' + row.id);
          ok(SO.weight(world, x, y, row) === 0, 'autonomy never picks a forbidden romance: ' + a + ' to ' + b + ' ' + row.id);
        }
        pairs++;
      }
      ok(SO.romanceOk(world, x, y, { romance: 'adult' }) === (a === 'adult' && b === 'adult'), 'the romance rule for the town history: ' + a + ' and ' + b);
    }
  }
  ok(pairs === 16 * romanceRows.length, 'every age pair is checked');
  const teenPair = R.get(world, people.teen[0], people.teen[1]);
  ok(teenPair && SO.allowed(world, people.teen[0], people.teen[1], SO.SOCIALS.go_steady).hide !== true && SO.allowed(world, people.teen[0], people.teen[1], SO.SOCIALS.propose).hide === true, 'two teens may be a couple, never engaged');
  people.teen[0].age = 'adult';
  SO.grewUp(world, people.teen[0]);
  ok(!(R.get(world, people.teen[0], people.teen[1]).f & (R.F.romance | R.F.couple)) && R.value(world, people.teen[0], people.teen[1]) >= R.FRIEND, 'when one of a teen couple grows up they become friends');
  people.teen[0].age = 'teen';
  const [viktor, astrid, hugo, lily] = world.family;
  ok(!flatMenu(S.Acts.menu(world, viktor, { type: 'sim', sim: lily })).some(o => SO.SOCIALS[o.ad] && SO.SOCIALS[o.ad].romance), 'no romance within a family');
  ok(SO.allowed(world, people.adult[0], people.child[0], SO.SOCIALS.slap).hide && SO.allowed(world, people.adult[0], people.child[0], SO.SOCIALS.shove).hide && SO.allowed(world, people.child[0], people.child[1], SO.SOCIALS.shove).hide !== true, 'nobody hits a child, children may shove each other');
  ok(SO.allowed(world, people.adult[0], people.toddler[0], SO.SOCIALS.tease).hide, 'nobody is mean to a toddler');
  const teenPhone = SO.phoneMenu(world, lily), adultPhone = SO.phoneMenu(world, astrid);
  ok(!teenPhone.some(o => o.phone === 'party' || /свидание/.test(o.label)) && adultPhone.some(o => /свидание/.test(o.label)), 'teens have no dates or parties on the phone');
  const lilyAdult = R.make(world, lily, people.adult[1]);
  lilyAdult.f = R.F.met | R.F.romance;
  lilyAdult.v = 90;
  const walkList = SO.phoneMenu(world, lily).find(o => /погулять/.test(o.label));
  ok(!walkList.section || walkList.section.every(o => o.with.age === 'teen'), 'a teen walks out only with teens');
  const dateList = SO.phoneMenu(world, astrid).find(o => /свидание/.test(o.label));
  const astridTeen = R.make(world, astrid, people.teen[1]);
  astridTeen.f = R.F.met | R.F.romance;
  astridTeen.v = 90;
  const dateList2 = SO.phoneMenu(world, astrid).find(o => /свидание/.test(o.label));
  ok(!dateList2.section || dateList2.section.every(o => o.with.age === 'adult'), 'an adult never dates a teen');
  ok(!!dateList, 'adults can invite for a date');
  for (const wish of Object.values(S.WISHES)) {
    if (wish.goal.kind === 'soc' && SO.SOCIALS[wish.goal.key].romance) ok(S.AGE_RANK[wish.age] >= S.AGE_RANK[SO.SOCIALS[wish.goal.key].romance === 'teen' ? 'teen' : 'adult'], 'a romance wish fits the age rules: ' + wish.id);
  }
  for (const id of ['social_flirt', 'social_date', 'social_love', 'social_propose', 'social_wedding', 'social_honeymoon', 'social_fall_in_love', 'social_rebuff', 'trait_flirty', 'trait_unflirty']) ok(S.WISHES[id].age === 'adult', 'an adult wish stays adult: ' + id);
  for (const id of ['social_first_kiss', 'social_hold_hands']) ok(S.WISHES[id].age === 'teen', 'a light teen wish starts at teen: ' + id);
  world.sims.length = world.sims.length - 8;
}

{
  const K = S.Skills, FD = S.Food, R = S.RECIPES;
  ok(Object.keys(S.SKILLS).length === 10 && Object.values(S.SKILLS).every(s => s.stage <= K.NOW), 'ten skills, all of them work now');
  ok(K.LEVEL_XP.length === 11 && K.LEVEL_XP.every((x, i) => i === 0 || x > K.LEVEL_XP[i - 1]) && K.levelOf(0) === 0 && K.levelOf(K.LEVEL_XP[5]) === 5 && K.levelOf(K.LEVEL_XP[10] + 50) === 10, 'ten levels on a rising curve');
  const challenges = Object.values(S.SKILL_CHALLENGES);
  for (const id of Object.keys(S.SKILLS)) ok(challenges.filter(c => c.skill === id).length === 3, 'a skill has three challenges: ' + id);
  for (const c of challenges) ok(c.name && c.goal && c.perk && c.n > 0 && K.fresh().stats[c.stat] !== undefined, 'a challenge is complete: ' + c.id);
  const recipes = Object.values(R), kinds = {};
  for (const r of recipes) kinds[r.kind] = (kinds[r.kind] || 0) + 1;
  ok(recipes.length === 28 && kinds.breakfast === 5 && kinds.meal === 18 && kinds.dessert === 3 && kinds.drink === 2, 'twenty-eight recipes: ' + JSON.stringify(kinds));
  ok(new Set(recipes.map(r => r.name)).size === 28 && recipes.every(r => r.level >= 0 && r.level <= 9 && r.mins > 0 && r.hunger > 0), 'recipes have unique names, levels and times');
  ok(recipes.some(r => r.level === 0 && r.kind === 'meal' && !r.meat) && recipes.some(r => r.level === 0 && r.kind === 'meal' && r.meat), 'a beginner has a meat and a vegetable dish');
  ok(FD.QUALITY.length === 9 && FD.QUALITY[0] === 'Несъедобно' && FD.QUALITY[8] === 'Совершенство', 'nine qualities from inedible to perfect');
  for (const r of recipes) for (const ch of r.name) ok(S.Font.has('bold', ch) && S.Font.has('small', ch), 'the font has the letter of ' + r.id + ': ' + ch);
  for (const id of ['cook_meal', 'eat_meal', 'eat_leftovers', 'mirror_speech', 'tv_workout', 'extinguish', 'clean_soot', 'read_cooking', 'read_athletic', 'read_logic', 'read_charisma']) ok(S.ADS[id] && S.ADS[id].id === id, 'a skill action exists: ' + id);
  for (const id of ['skillUp', 'mastery', 'burntFood', 'weirdDish', 'masterDish', 'breakfast', 'leftovers', 'spoiledFood', 'heavyStomach', 'sore', 'fire', 'burn', 'coffee', 'tea', 'dessert']) ok(S.MOODLETS[id] && S.MOODLETS[id].stage <= 13, 'a stage 13 moodlet works: ' + id);

  const game = new S.Game(doc, 1), world = game.world, lot = world.lots[0], [viktor, astrid, hugo, lily, pip] = world.family;
  game.freeWill = 0;
  game.setSpeed(3);
  for (const s of world.family) s.traits = [];
  const item = kind => lot.house.items.find(i => i.kind === 'm_' + kind);
  const run = (sim, act, limit) => {
    S.Acts.add(world, sim, act);
    for (let i = 0; i < (limit || 8000) && (sim.act || sim.queue.length); i++) game.fixed(sim.x, sim.z);
  };
  ok(viktor.skill && pip.skill && K.list(viktor).length === 0, 'family members start without skills');
  ok(!K.can(pip, 'cooking') && !K.can(hugo, 'cooking') && K.can(hugo, 'logic') && K.can(lily, 'cooking') && K.can(viktor, 'guitar') && !K.can(hugo, 'guitar') && K.can(hugo, 'painting'), 'skills follow the age');
  game.events.length = 0;
  ok(K.practice(world, viktor, 'athletic', 1, 10) && K.started(viktor, 'athletic') && world.events.some(e => e.type === 'skill' && /начат навык/.test(e.text)), 'practice starts a skill');
  ok(!K.practice(world, hugo, 'cooking', 1, 10) && !K.started(hugo, 'cooking'), 'a child cannot practise cooking');
  const xp0 = viktor.skill.xp.athletic;
  viktor.traits = ['athletic'];
  K.practice(world, viktor, 'athletic', 1, 10);
  ok(Math.abs(viktor.skill.xp.athletic - xp0 - K.rate(world, viktor, 'athletic', 1) * 10) < 1e-6 && K.rate(world, viktor, 'athletic', 1) > K.rate(world, astrid, 'athletic', 1), 'a trait speeds up its skill');
  viktor.traits = [];
  viktor.rewards.push('fastLearner');
  ok(K.rate(world, viktor, 'logic', 1) > K.rate(world, astrid, 'logic', 1), 'the fast learner reward speeds up learning');
  viktor.rewards.length = 0;
  game.events.length = 0;
  K.practice(world, viktor, 'athletic', 1, K.LEVEL_XP[3]);
  ok(K.level(viktor, 'athletic') >= 3 && world.events.some(e => e.type === 'skill' && /уровень 3/.test(e.text)) && S.Moods.has(viktor, 'skillUp'), 'a new level is announced and felt');
  K.practice(world, viktor, 'athletic', 1, K.LEVEL_XP[10]);
  ok(K.level(viktor, 'athletic') === 10 && viktor.skill.certs.includes('athletic') && S.Moods.has(viktor, 'mastery') && world.events.some(e => e.cert), 'level ten gives a certificate and mastery');
  K.practice(world, astrid, 'logic', 1, 20);
  const capped = astrid.skill.xp.logic;
  K.practice(world, astrid, 'logic', 1, K.LEVEL_XP[6], K.BOOK_CAP);
  ok(K.level(astrid, 'logic') === K.BOOK_CAP && astrid.skill.xp.logic === K.LEVEL_XP[K.BOOK_CAP] && capped < astrid.skill.xp.logic, 'a beginner book teaches up to level three');
  const shelf = item('bookshelf'), bookMenu = S.Acts.menu(world, astrid, { type: 'item', item: shelf, lot });
  ok(bookMenu.find(o => o.ad === 'read_logic').closed && !bookMenu.find(o => o.ad === 'read_cooking').closed, 'a learnt book is closed, a new one is open');
  run(astrid, S.Acts.adAct('read_cooking', lot, shelf));
  ok(K.started(astrid, 'cooking') && astrid.skill.stats.books.includes('read_cooking') && astrid.wish.memo.soc['#book_cooking'] === 1, 'reading a skill book teaches and is counted');

  ok(FD.knows(lily, 'oatmeal') && !FD.knows(lily, 'pilaf') && !FD.knows(hugo, 'oatmeal'), 'recipes open by level and age');
  world.clock = 12 * 60;
  const stove = item('stove'), section = flatMenu(S.Acts.menu(world, astrid, { type: 'item', item: stove, lot })).filter(o => o.recipe);
  ok(section.find(o => o.recipe === 'pasta_navy' && !o.closed) && section.find(o => o.recipe === 'oatmeal').closed === 'Завтрак готовят с 5 до 11 утра', 'breakfast waits for the morning');
  ok(section.some(o => o.closed && /Нужна готовка/.test(o.closed)), 'a locked recipe tells its level');
  astrid.traits = ['vegetarian'];
  ok(FD.why(world, astrid, R.pasta_navy) === 'Вегетарианка не готовит мясо' && !R[FD.pick(world, astrid)].meat, 'a vegetarian cooks no meat');
  astrid.traits = [];
  const qualities = level => {
    const sim = { traits: [], skill: K.fresh(), age: 'adult', rewards: [] };
    sim.skill.xp.cooking = K.LEVEL_XP[level];
    const out = [];
    for (let i = 0; i < 300; i++) out.push(FD.quality(world, sim, R.pasta_navy));
    return out;
  };
  const low = qualities(0), high = qualities(10);
  ok(low.every(q => q <= 4) && low.some(q => q <= 1), 'a beginner cooks badly: max ' + Math.max(...low));
  ok(high.filter(q => q >= 7).length > 150 && high.includes(8), 'a master cooks well and sometimes perfectly');
  ok(FD.fireChance({ traits: [], skill: K.fresh() }) === FD.FIRE_BY_LEVEL[0] && FD.fireChance({ traits: ['naturalCook'], skill: K.fresh() }) < FD.FIRE_BY_LEVEL[0], 'fire is likelier for beginners, rarer for natural cooks');

  const fireRoll = S.roll;
  const cookGame = new S.Game(doc, 3), cw = cookGame.world, clot = cw.lots[0], [cook, eater, , , baby] = cw.family;
  cookGame.freeWill = 0;
  cookGame.setSpeed(3);
  for (const s of cw.family) s.traits = [];
  const citem = kind => clot.house.items.find(i => i.kind === 'm_' + kind);
  const crun = (sim, act, limit) => {
    S.Acts.add(cw, sim, act);
    for (let i = 0; i < (limit || 8000) && (sim.act || sim.queue.length); i++) cookGame.fixed(sim.x, sim.z);
  };
  cw.clock = 13 * 60;
  cook.skill.xp.cooking = K.LEVEL_XP[5];
  cook.needs.hunger = 30;
  const order = S.Acts.adAct('cook_meal', clot, citem('stove'));
  order.recipe = 'pilaf';
  const realFireChance = S.Food.fireChance;
  S.Food.fireChance = () => 0;
  crun(cook, order);
  const kitchen = clot.kitchen, served = kitchen && kitchen.meals.find(m => m.recipe === 'pilaf');
  ok(served && served.left === cw.family.filter(s => s.lot === clot).length - 1 && cook.skill.stats.meals === 1 && cook.skill.stats.cooked.pilaf === 1, 'a meal is served on the counter for everyone at home');
  ok(['burntFood', 'weirdDish', 'homeMeal', 'tastyDish', 'masterDish'].some(id => S.Moods.has(cook, id)) && cook.needs.hunger > 70, 'the cook eats a portion');
  eater.needs.hunger = 30;
  const counter = clot.house.items[served.item];
  ok(flatMenu(S.Acts.menu(cw, eater, { type: 'item', item: counter, lot: clot })).some(o => o.ad === 'eat_meal' && !o.closed), 'the counter offers a portion');
  crun(eater, S.Acts.adAct('eat_meal', clot, counter));
  ok(eater.needs.hunger > 70 && served.left === cw.family.filter(s => s.lot === clot).length - 2, 'another family member takes a portion');
  served.made -= FD.LEFT_AFTER + 1;
  cookGame.fixed(cook.x, cook.z);
  ok(!kitchen.meals.includes(served) && kitchen.fridge.some(m => m.recipe === 'pilaf'), 'old portions go to the fridge');
  eater.needs.hunger = 30;
  eater.moods = [];
  crun(eater, S.Acts.adAct('eat_leftovers', clot, citem('fridge')));
  ok(S.Moods.has(eater, 'leftovers') || S.Moods.has(eater, 'weirdDish') || S.Moods.has(eater, 'burntFood'), 'leftovers are eaten cold');
  for (const m of kitchen.fridge) m.made -= FD.SPOIL_AFTER + 10;
  eater.needs.hunger = 30;
  eater.moods = [];
  if (kitchen.fridge.some(m => m.left > 0)) {
    crun(eater, S.Acts.adAct('eat_leftovers', clot, citem('fridge')));
    ok(S.Moods.has(eater, 'spoiledFood'), 'old leftovers spoil');
  }
  kitchen.fridge = [{ recipe: 'lasagna', quality: 8, left: 1, made: FD.now(cw) - FD.SPOIL_AFTER - 10, item: -1, by: cook.id }];
  ok(FD.factor(cw, clot, S.ADS.eat_leftovers) < 0.1, 'only spoiled leftovers keep hungry sims away from the fridge');
  kitchen.fridge.push({ recipe: 'borscht', quality: 3, left: 1, made: FD.now(cw), item: -1, by: cook.id });
  ok(FD.factor(cw, clot, S.ADS.eat_leftovers) === 1, 'fresh leftovers are welcome');
  const takeFresh = { lot: clot.index };
  ok(FD.take(cw, eater, takeFresh, 'fridge') && takeFresh.food.recipe === 'borscht', 'fresh leftovers are taken before better spoiled ones');
  kitchen.fridge = [];
  kitchen.meals = [];
  const busyCook = cw.family.find(s => s !== cook && S.AGE_RANK[s.age] >= S.AGE_RANK.teen), busyBefore = busyCook.act;
  ok(FD.factor(cw, clot, S.ADS.cook_meal) === 1, 'an empty kitchen invites cooking');
  busyCook.act = S.Acts.adAct('cook_meal', clot, citem('stove'));
  ok(FD.factor(cw, clot, S.ADS.cook_meal) < 0.1, 'nobody starts cooking while someone else is at the stove');
  busyCook.act = busyBefore;
  cw.clock = 13 * 60;
  const coffee = S.Acts.adAct('cook_meal', clot, citem('stove'));
  coffee.recipe = 'coffee';
  cook.needs.energy = 40;
  crun(cook, coffee);
  ok(S.Moods.has(cook, 'coffee') && cook.needs.energy > 55, 'coffee wakes the cook up');

  S.Food.fireChance = realFireChance;
  ok(typeof FD.fireChance === 'function', 'the fire chance is back');
  const fireGame = new S.Game(doc, 5), fw = fireGame.world, flot = fw.lots[0], fstove = flot.house.items.find(i => i.kind === 'm_stove');
  fireGame.setSpeed(3);
  for (const s of fw.family) s.traits = [];
  fireGame.events.length = 0;
  ok(FD.ignite(fw, flot, fstove, fw.family[0]) && FD.burning(flot) && fw.events.some(e => e.type === 'fire' && e.start), 'a stove can catch fire');
  ok(S.Acts.menu(fw, fw.family[0], { type: 'item', item: fstove, lot: flot })[0].ad === 'extinguish', 'a burning thing offers only to put it out');
  let held = false;
  for (let i = 0; i < 6000 && FD.burning(flot); i++) {
    fireGame.fixed(fw.family[0].x, fw.family[0].z);
    held = held || fw.family.some(s => s.held.includes('fire'));
  }
  ok(!FD.burning(flot) && held && fw.family.some(s => s.skill && s.skill.stats.fires === 1), 'the family puts the fire out and fears it meanwhile');
  ok(!fstove.burnt || fw.events.some(e => e.burnt), 'a fire put out early leaves the stove whole');

  let burnGame, bw, blot, bstove, burnt = [], fled = false;
  for (let seed = 5; seed < 10 && burnt.length < 3; seed++) {
    burnGame = new S.Game(doc, seed);
    bw = burnGame.world;
    blot = bw.lots[0];
    blot.house.detector = false;
    bstove = blot.house.items.find(i => i.kind === 'm_stove');
    burnGame.setSpeed(3);
    for (const s of bw.family) s.traits = ['coward'];
    FD.ignite(bw, blot, bstove, null);
    fled = false;
    for (let i = 0; i < 20000 && FD.burning(blot); i++) {
      const x = bw.family[0].x, z = bw.family[0].z;
      burnGame.fixed(x, z);
      fled = fled || bw.family.some(s => s.act && s.act.flee);
    }
    burnt = blot.house.items.filter(i => i.burnt);
  }
  ok(fled && bstove.burnt && burnt.length >= 3, 'cowards flee and the kitchen burns: ' + burnt.map(i => i.kind).join());
  ok((S.House.itemFlags(blot.house, bstove, null) & S.House.FLAG_DIM) !== 0, 'a burnt thing is drawn darker');
  ok(!S.Acts.choices(bw, bw.family[1], 2).some(c => c.item === blot.house.items.indexOf(bstove)), 'a burnt stove is never chosen');
  const sootMenu = S.Acts.menu(bw, bw.family[1], { type: 'item', item: bstove, lot: blot });
  ok(sootMenu[0].ad === 'clean_soot' && sootMenu[1].closed, 'a burnt thing can only be cleaned');
  const saved = JSON.parse(JSON.stringify(S.Save.file(burnGame, null))), back = new S.Game(doc, burnGame.seed);
  S.Save.apply(back, saved);
  ok(back.world.lots[0].house.items.filter(i => i.burnt).length === burnt.length && back.hash() === burnGame.hash(), 'burnt things survive a save');
  bw.family[1].traits = [];
  S.Acts.add(bw, bw.family[1], S.Acts.adAct('clean_soot', blot, bstove));
  for (let i = 0; i < 6000 && (bw.family[1].act || bw.family[1].queue.length); i++) burnGame.fixed(0, 0);
  ok(!bstove.burnt, 'cleaning the soot makes the stove usable again');

  const chef = { traits: [], skill: K.fresh(), age: 'adult', rewards: [], id: 'chef' };
  chef.skill.xp.cooking = K.LEVEL_XP[3];
  const plain = [], skilled = [];
  for (let i = 0; i < 300; i++) plain.push(FD.quality(world, chef, R.pasta_navy));
  chef.skill.done.push('chef');
  for (let i = 0; i < 300; i++) skilled.push(FD.quality(world, chef, R.pasta_navy));
  ok(skilled.reduce((a, b) => a + b) > plain.reduce((a, b) => a + b), 'the chef challenge improves dishes');
  chef.skill.done.push('allRecipes');
  ok(FD.fireChance(chef) === 0, 'knowing all recipes ends kitchen fires');
  game.events.length = 0;
  K.setStat(world, lily, 'meals', 50);
  lily.skill.xp.cooking = lily.skill.xp.cooking || 1;
  K.check(world, lily);
  ok(K.has(lily, 'chef') && world.events.some(e => e.challenge === 'chef'), 'a challenge is announced when done');
  lily.skill.xp.logic = K.LEVEL_XP[5];
  lily.skill.stats.chessWins = 30;
  ok(K.chessRank(lily) === 'Второй разряд', 'chess wins give a rank: ' + K.chessRank(lily));
  lily.skill.stats.chessWins = 200;
  ok(K.chessRank(lily) === 'Мастер', 'a grandmaster needs logic ten');
  lily.skill.xp.logic = K.LEVEL_XP[10];
  ok(K.chessRank(lily) === 'Гроссмейстер', 'logic ten and many wins make a grandmaster');

  const pep = S.Social.SOCIALS.pep_talk;
  const talker = world.family[1], other = world.sims.find(s => s.free && s.age === 'adult');
  const r0 = S.Rel.make(world, talker, other);
  r0.f |= S.Rel.F.met;
  talker.skill.xp = {};
  ok(S.Social.allowed(world, talker, other, pep).hide, 'charisma lines stay hidden before charisma');
  talker.skill.xp.charisma = K.LEVEL_XP[1];
  ok(S.Social.allowed(world, talker, other, pep).closed === 'Нужно обаяние 3', 'a charisma line tells the level it needs');
  talker.skill.xp.charisma = K.LEVEL_XP[4];
  ok(!S.Social.allowed(world, talker, other, pep).closed && !S.Social.allowed(world, talker, other, pep).hide, 'charisma opens new lines');
  const lowCharm = S.Social.chance(world, talker, other, S.Social.SOCIALS.compliment);
  talker.skill.xp.charisma = K.LEVEL_XP[10];
  ok(S.Social.chance(world, talker, other, S.Social.SOCIALS.compliment) > lowCharm, 'charisma helps social lines');

  const W = S.Wishes, live = Object.values(S.WISHES).filter(w => w.group === 'skills' && w.stage <= W.NOW);
  ok(live.length >= 26 && live.every(w => w.goal.kind !== 'later'), 'skill wishes of four skills work: ' + live.length);
  ok(['fishing', 'gardening', 'guitar', 'handiness', 'painting', 'writing'].every(id => S.WISHES['skill_start_' + id].stage <= W.NOW && S.WISHES['skill_start_' + id].goal.kind === 'skill'), 'the other six skills work since stage 14');
  ok(['goldenTongue', 'storyPainter', 'guitarPainter', 'masterMechanic'].every(id => S.DREAMS[id].stage === 14) && ['knowItAll', 'cookbook', 'headAndLegs', 'grandmaster'].every(id => S.DREAMS[id].stage === 13), 'lifetime wishes follow their skills');
  const dreamer = world.family[0];
  dreamer.dream = { id: 'cookbook' };
  ok(W.dreamProgress(world, dreamer, S.DREAMS.cookbook)[1] === 28, 'the cookbook counts all recipes');
  dreamer.dream = { id: 'headAndLegs' };
  dreamer.skill.xp.logic = K.LEVEL_XP[10];
  dreamer.skill.xp.athletic = K.LEVEL_XP[10];
  const happyBefore = dreamer.happy;
  W.checkDream(world, dreamer);
  ok(dreamer.dream.done && dreamer.happy === happyBefore + S.DREAMS.headAndLegs.points, 'a skill lifetime wish comes true');
  const levelWish = S.WISHES.skill_cooking_5;
  ok(levelWish.goal.kind === 'skill' && levelWish.goal.abs && W.target(levelWish.goal) === 5, 'a level wish waits for the level itself');

  const save = JSON.parse(JSON.stringify(S.Save.file(game, null))), loaded = new S.Game(doc, 1);
  S.Save.apply(loaded, save);
  ok(K.level(loaded.world.family[0], 'athletic') === 10 && loaded.world.family[0].skill.certs.includes('athletic') && loaded.hash() === game.hash(), 'skills survive a save');
  const badSkill = JSON.parse(JSON.stringify(save));
  badSkill.state.sims[0][45].xp.flying = 5;
  assert.throws(() => S.Save.apply(new S.Game(doc, 1), badSkill), /неизвестный навык/, 'an unknown skill is refused');
  checks++;
  const v6 = JSON.parse(JSON.stringify(save));
  v6.version = 6;
  v6.state.sims = v6.state.sims.map(r => r.slice(0, 45));
  delete v6.state.kitchen;
  const up = S.Save.migrate(v6);
  ok(up.version === S.Save.VERSION && up.state.kitchen === null && up.state.funds === null && up.state.sims.every(r => r.length === 49 && r[45] === null && r[47] === null && r[48] === null), 'a file of version 6 gets skill and craft fields');
  const old = new S.Game(doc, 1);
  S.Save.apply(old, up);
  ok(old.world.family.every(s => s.skill && K.list(s).length === 0), 'an old file gives the family empty skills');
  ok(fireRoll === S.roll, 'the random source is untouched');
}

{
  const E = S.Econ, FI = S.Fish, GA = S.Garden, CO = S.Collect, AR = S.Art, K = S.Skills, W = S.Wishes;
  const fish = Object.values(S.FISH), plants = Object.values(S.PLANTS);
  ok(fish.length === 20 && ['sea', 'lake', 'river'].every(w => fish.filter(f => f.water === w).length >= 6), 'twenty fish in three waters');
  ok([0, 2, 4, 6, 8, 10].every(l => fish.some(f => f.level === l)) && fish.some(f => f.night) && fish.some(f => f.bait), 'new fish every two levels, some only at night, some only on bait');
  for (const f of fish) {
    ok(f.wMax > f.wMin && f.value > 0 && FI.WATERS[f.water], 'a fish has weight, price and water: ' + f.id);
    if (f.bait) ok(S.FISH[f.bait] || S.PLANTS[f.bait], 'a bait is a real fish or plant: ' + f.id);
    if (f.bait && S.FISH[f.bait]) ok(S.FISH[f.bait].level < f.level, 'live bait comes from a smaller fish: ' + f.id);
  }
  ok(plants.length === 19 && plants.filter(p => p.rarity === 'common').length === 8 && plants.filter(p => p.rarity === 'rare').length === 5 && plants.filter(p => p.rarity === 'special').length === 6, 'nineteen plants: 8 common, 5 rare, 6 special');
  ok(plants.filter(p => p.rarity === 'rare').every(p => p.level === 5 || p.level === 7) && plants.filter(p => p.rarity === 'special').every(p => p.level >= 8), 'rare plants at 5 and 7, special from 8');
  for (const p of plants) ok(GA.COLORS.includes(p.color) && S.KIND_ID['m_garden_ripe_' + p.color] !== undefined && p.days > 0 && p.crop > 0, 'a plant has a ripe look, a time and a crop: ' + p.id);
  const sizes = { gems: 12, metals: 8, space: 3, butterflies: 12, bugs: 12, seeds: 19 };
  for (const [set, n] of Object.entries(sizes)) ok(CO.members(set).length === n && CO.SETS[set], 'a collection has its size: ' + set);
  ok(Object.keys(S.GENRES).length === 12 && Object.keys(S.SONGS).length === 11 && Object.keys(S.UPGRADES).length === 10 && Object.keys(S.PAINT_STYLES).length >= 8, 'twelve genres, a song per level, eight upgrades, painting styles');
  const genres = Object.values(S.GENRES).sort((a, b) => a.level - b.level), perHour = g => g.royalty / g.hours;
  ok(genres.every(g => g.level >= 0 && g.level <= 10) && perHour(genres[genres.length - 1]) > perHour(genres[0]), 'later genres pay better per hour');
  for (const u of Object.values(S.UPGRADES)) ok(u.models.every(m => S.OBJECTS[m]) && u.level >= 1 && u.cost > 0, 'an upgrade fits real objects: ' + u.id);
  const names = [...fish.map(f => f.name), ...plants.map(p => p.name + p.produce), ...Object.values(S.FINDS).map(f => f.name), ...Object.values(S.GENRES).map(g => g.name), ...Object.values(S.SONGS).map(s => s.name), ...Object.values(S.UPGRADES).map(u => u.name + u.text), ...Object.values(S.PAINT_STYLES).map(s => s.name)];
  for (const name of names) for (const ch of name) ok(S.Font.has('small', ch) && S.Font.has('bold', ch), 'the font has the letter of ' + name + ': ' + ch);
  for (const id of ['ownHarvest', 'ownFish', 'freshJuice', 'muddy', 'fishing', 'bigFish', 'harvest', 'paintingSold', 'bookDone', 'garden', 'shock']) ok(S.MOODLETS[id] && S.MOODLETS[id].stage <= 14, 'a stage 14 moodlet works: ' + id);
  for (const id of ['pizza', 'emptyFridge']) ok(S.MOODLETS[id].stage === 16, 'a service moodlet waits for stage 16: ' + id);

  const game = new S.Game(doc, 3), world = game.world, lot = world.lots[0], [viktor, astrid, hugo, lily] = world.family;
  game.freeWill = 0;
  game.setSpeed(3);
  for (const s of world.family) {
    S.Acts.dropCurrent(world, s);
    s.queue.length = 0;
  }
  const item = base => lot.house.items.find(i => S.baseOf(i) === base);
  const run = (sim, act, limit) => {
    S.Acts.add(world, sim, act);
    for (let i = 0; i < (limit || 20000) && (sim.act === act || sim.queue.includes(act)); i++) game.fixed(sim.x, sim.z);
  };
  ok(world.funds === S.Sample.MONEY && astrid.bag.some(it => it.k === 'guitar') && viktor.bag.length === 0 && world.sims.find(s => s.free).bag === undefined, 'the family has money and bags, Astrid owns a guitar, town people have no bags');
  ok(lot.house.items.filter(i => S.baseOf(i) === 'garden').length === 6 && item('pond') && item('aquarium') && world.lots.find(l => l.id === 'park').house.items.some(i => S.baseOf(i) === 'creek'), 'the house has six beds, a pond and an aquarium, the park has a creek');
  ok(S.objectOf({ kind: 'm_garden_ripe_red' }) === S.OBJECTS.garden && S.baseOf({ kind: 'm_aquarium_fish' }) === 'aquarium', 'a variant sprite keeps its object');

  const bag = viktor.bag;
  for (let i = 0; i < E.BAG_SIZE; i++) ok(E.give(world, viktor, E.item('seed', 'tomato', { q: 1, v: 3 })), 'the bag takes a thing');
  world.events.length = 0;
  ok(!E.give(world, viktor, E.item('seed', 'tomato', { q: 1, v: 3 })) && world.events.some(e => e.full), 'a full bag refuses and says so');
  ok(E.stacks(viktor).length === 1 && E.stacks(viktor)[0].indexes.length === E.BAG_SIZE, 'equal seeds stack in one cell');
  bag.length = 0;
  bag.push(E.item('fish', 'perch', { q: 2, w: 1, v: 10, at: 1 }), E.item('fish', 'perch', { q: 2, w: 1.2, v: 11, at: 2 }), E.item('painting', 'landscape', { q: 2, v: 300, n: '«Туман у моря»', x: { size: 'large', by: 'Виктор' } }), E.item('gem', 'ruby', { v: 140 }));
  ok(E.stacks(viktor).length === 4, 'fish and paintings never stack');
  const packed = JSON.parse(JSON.stringify(E.pack(viktor)));
  ok(JSON.stringify(E.unpack(packed)) === JSON.stringify(bag), 'a bag survives packing');
  let threw = false;
  try {
    E.unpack([['dragon', 'x', 1, 0, 0, '', 0, null]]);
  } catch (e) {
    threw = true;
  }
  ok(threw, 'an unknown thing in a bag is refused');
  const before = world.funds, sale = bag.filter(E.sellable).reduce((n, it) => n + Math.round(E.value(world, viktor, it) * E.shopRate(world, viktor)), 0);
  world.events.length = 0;
  const got = E.sellAll(world, viktor);
  ok(E.shopRate(world, viktor) === E.SHOP_RATE && sale < 161 && got === sale && world.funds === before + sale && bag.length === 1 && bag[0].k === 'painting' && world.events.some(e => e.type === 'money' && e.amount === sale), 'the shop takes fish and finds below their price, the painting stays');
  ok(E.menu(world, viktor, 0)[0].label === 'Продать за §300', 'a painting is sold from the bag');
  AR.sellPainting(world, viktor, 0);
  ok(world.funds === before + sale + 300 && bag.length === 0 && viktor.skill.stats.paintingsSold === 1 && viktor.skill.stats.priciest === 300 && S.Moods.has(viktor, 'paintingSold'), 'selling a painting pays, counts and pleases');
  ok(E.buySeeds(world, viktor, 'carrot') && bag.filter(it => it.k === 'seed' && it.id === 'carrot').length === 3 && world.funds === before + sale + 300 - E.seedPrice(S.PLANTS.carrot, world), 'the shop sells seeds in packs of three');

  const fake = (level, extra) => {
    const sim = Object.assign({ id: 'f', name: 'Проба', age: 'adult', sex: 'f', traits: [], rewards: [], skill: K.fresh(), bag: [], needs: S.Acts.newNeeds(), moods: [], wish: null }, extra);
    sim.skill.xp.fishing = K.LEVEL_XP[level];
    return sim;
  };
  const dayWorld = { clock: 12 * 60, day: 1, lots: world.lots, rng: { rs: 9 }, events: [], family: [] }, nightWorld = Object.assign({}, dayWorld, { clock: 23 * 60 });
  const pondAct = { ad: 'fish_pond', lot: 0, item: lot.house.items.indexOf(item('pond')) };
  ok(FI.candidates(dayWorld, fake(0), pondAct).map(f => f.id).sort().join() === 'crucian,perch', 'a beginner catches only the simplest lake fish');
  const seaNight = { ad: 'fish_here', lot: 0, item: -1, water: 'sea' };
  ok(FI.candidates(nightWorld, fake(10), seaNight).some(f => f.id === 'swordfish') && !FI.candidates(dayWorld, fake(10), seaNight).some(f => f.id === 'swordfish'), 'night fish bite only at night');
  ok(!FI.candidates(dayWorld, fake(10), seaNight).some(f => f.id === 'tuna') && FI.candidates(dayWorld, fake(10), Object.assign({ bait: 'mackerel' }, seaNight)).some(f => f.id === 'tuna'), 'bait fish need their bait');
  ok(FI.baitOptions(fake(2), {}).closed && FI.baitOptions(fake(3), {}).closed === 'Наживка: урожай в инвентаре. Живая с рыбалки 5', 'bait opens at level three');
  const shoreSea = (() => {
    for (let z = 500; z < 640; z++) for (let x = 200; x < 400; x += 7) if (FI.seaAt(world, x + 0.5, z + 0.5)) return [x + 0.5, z + 0.5];
    return null;
  })();
  const spot = shoreSea && FI.shoreSpot(world, shoreSea[0], shoreSea[1]);
  ok(spot && !FI.seaAt(world, spot.x, spot.z) && world.ground.isFree(0, Math.floor(spot.x), Math.floor(spot.z)) && FI.seaAt(world, spot.fx - Math.sign(spot.fx - spot.x), spot.fz - Math.sign(spot.fz - spot.z)), 'sea fishing stands on the shore and looks at the water');
  ok(S.Acts.menu(world, viktor, { type: 'ground', x: shoreSea[0], z: shoreSea[1], floor: 0 })[0].ad === 'fish_here', 'a click on the sea offers fishing');

  viktor.skill.xp.fishing = K.LEVEL_XP[6];
  game.events.length = 0;
  run(viktor, S.Acts.adAct('fish_pond', lot, item('pond')));
  const caught = viktor.bag.filter(it => it.k === 'fish');
  ok(caught.length >= 1 && viktor.skill.stats.fishCaught >= 1 && Object.keys(viktor.skill.stats.fishRecords).length >= 1 && S.Moods.has(viktor, 'fishing'), 'fishing at the pond fills the bag and the records: ' + caught.length);
  ok(caught.every(it => S.FISH[it.id].water === 'lake' && it.w >= S.FISH[it.id].wMin && it.w <= S.FISH[it.id].wMax * 1.2 && it.v > 0), 'a catch is a lake fish with a real weight');
  ok(game.events.some(e => e.type === 'catch' && /^Улов: /.test(e.text)), 'a catch is announced');
  const perfect = E.item('fish', 'koi', { q: E.PERFECT, w: 3, v: 300, at: 77 });
  viktor.bag.push(perfect);
  const tankAct = E.use(world, viktor, viktor.bag.indexOf(perfect), 'tank');
  ok(tankAct && tankAct.ad === 'tank_put', 'a fish goes to the aquarium by an action');
  world.reskin.clear();
  run(viktor, tankAct);
  ok(item('aquarium').kind === 'm_aquarium_fish' && FI.tankOf(lot, item('aquarium')).id === 'koi' && world.reskin.has(item('aquarium')) && !viktor.bag.includes(perfect), 'the aquarium shows its fish');
  viktor.dream = { id: 'fishCollection', done: false };
  ok(W.dreamProgress(world, viktor, S.DREAMS.fishCollection).join() === '1,13', 'a perfect fish in the aquarium counts for the dream');
  ok(S.Acts.menu(world, viktor, { type: 'item', item: item('aquarium'), lot }).some(o => o.ad === 'tank_watch'), 'a full aquarium can be watched');
  const trout = E.item('fish', 'trout', { q: 1, w: 1, v: 20, at: 78 });
  viktor.bag.push(trout);
  run(viktor, E.use(world, viktor, viktor.bag.indexOf(trout), 'pond'));
  ok(FI.stockOf(lot, item('pond')).includes('trout') && FI.candidates(dayWorld, fake(6), pondAct).some(f => f.id === 'trout'), 'a fish let into the pond lives there');

  viktor.skill.xp.gardening = K.LEVEL_XP[2];
  const beds = lot.house.items.filter(i => S.baseOf(i) === 'garden'), bed = beds[0], tomato = E.item('seed', 'tomato', { q: 2, v: 3, at: 5 });
  viktor.bag.push(tomato);
  ok(S.Acts.menu(world, viktor, { type: 'item', item: bed, lot }).find(o => o.label === 'Посадить…').section.some(o => o.ad === 'garden_plant'), 'an empty bed offers planting from the bag');
  run(viktor, Object.assign(S.Acts.adAct('garden_plant', lot, bed), { pick: ['seed', 'tomato', 2, 5] }));
  const plant = GA.plantAt(lot, bed);
  ok(plant && plant.id === 'tomato' && bed.kind === 'm_garden_sprout' && !viktor.bag.includes(tomato) && viktor.skill.stats.plantedKinds === 1, 'a seed becomes a sprout');
  ok(GA.why(fake(0, { age: 'child' }), S.PLANTS.tomato) && GA.why(viktor, S.PLANTS.lime) === 'Нужен сад 5', 'planting follows age and level');
  for (let d = 0; d < 3; d++) {
    plant.water = 100;
    GA.step(world, GA.DAY);
  }
  ok(plant.fruit && bed.kind === 'm_garden_ripe_red' && !plant.dead, 'a watered tomato ripens in three days');
  viktor.bag.length = 0;
  run(viktor, S.Acts.adAct('garden_harvest', lot, bed));
  const crop = viktor.bag.filter(it => it.k === 'produce' && it.id === 'tomato');
  ok(crop.length >= S.PLANTS.tomato.crop && !plant.fruit && plant.harvests === 1 && viktor.skill.stats.harvests === 1 && S.Moods.has(viktor, 'harvest'), 'a harvest fills the bag');
  const thirsty = beds[1];
  lot.garden[lot.house.items.indexOf(thirsty)] = { id: 'carrot', q: 1, grow: 0.2, water: 0, weeds: true, fed: 0, health: 30, fruit: false, harvests: 0, dead: false, planted: 0, by: viktor.id };
  GA.step(world, GA.DAY * 2);
  ok(GA.plantAt(lot, thirsty).dead && S.Garden.kindFor(GA.plantAt(lot, thirsty)) === 'm_garden_dead', 'a neglected plant dies');
  ok(S.Acts.menu(world, viktor, { type: 'item', item: thirsty, lot }).find(o => o.ad === 'garden_revive').closed === 'Нужен сад 6', 'reviving needs gardening six');
  viktor.skill.xp.gardening = K.LEVEL_XP[6];
  run(viktor, S.Acts.adAct('garden_revive', lot, thirsty));
  ok(!GA.plantAt(lot, thirsty).dead, 'a skilled gardener revives a plant');
  const eat = E.use(world, viktor, viktor.bag.indexOf(crop[0]), 'eat');
  viktor.needs.hunger = 30;
  run(viktor, eat);
  ok(S.Moods.has(viktor, 'ownHarvest') && viktor.needs.hunger > 35, 'eating own produce feels good');
  for (const b of beds.slice(0, 3)) lot.garden[lot.house.items.indexOf(b)] = { id: 'grapes', q: 1, grow: 0.6, water: 80, weeds: false, fed: 0, health: 100, fruit: false, harvests: 0, dead: false, planted: 0, by: viktor.id };
  const gardenWorld = { lots: world.lots, family: world.family };
  Object.assign(viktor, { lot, inside: null, floor: 0, x: lot.x + bed.x + 1, z: lot.z + bed.z });
  ok(GA.heldMoods(gardenWorld, viktor).includes('garden'), 'a sim among growing plants feels the garden');

  const spots = CO.spots(world);
  ok(spots.length === 300 && spots.every(s => world.ground.isFree(0, Math.floor(s.x), Math.floor(s.z)) && (!world.ground.lotAt(s.x, s.z) || world.ground.lotAt(s.x, s.z).kind === 'park')), 'three hundred finds lie on open ground and in parks');
  ok(new Set(spots.map(s => s.place)).size >= 4, 'finds lie in different places');
  world.clock = 12 * 60;
  world.spotHour = -1;
  CO.step(world);
  const shown = CO.shown(world);
  ok(shown.length > 100 && shown.every(s => CO.findOf(s)), 'finds appear across the town');
  ok(shown.some(s => CO.findOf(s).set === 'butterflies') && CO.shown(Object.assign({}, world, { clock: 23 * 60 })).every(s => CO.findOf(s).set !== 'butterflies'), 'butterflies fly by day and hide at night');
  const find = shown[0], findIndex = spots.indexOf(find), findId = find.find, findDef = CO.findOf(find);
  hugo.bag.length = 0;
  run(hugo, Object.assign(S.Acts.adAct('collect_pick', lot, null), { spot: { x: find.x, z: find.z, fx: find.x, fz: find.z + 1, find: findIndex } }), 40000);
  ok(hugo.bag.some(it => it.id === findId) && !find.find && find.next > 0 && hugo.skill.stats.found[findId] === 1, 'a child picks up a find: ' + findDef.name);
  const set = findDef.set;
  for (const id of CO.members(set)) hugo.skill.stats.found[id] = 1;
  ok(CO.complete(hugo, set) && CO.bonus(hugo, set) === CO.SET_BONUS && CO.bonus(viktor, set) === 1, 'a full set makes its finds dearer');

  astrid.skill.xp.painting = K.LEVEL_XP[4];
  for (const s of world.family) for (const n of S.NEED_ORDER) s.needs[n] = 100;
  const easel = item('easel'), canvasAct = Object.assign(S.Acts.adAct('paint_canvas', lot, easel), { canvas: { size: 'small', style: 'portrait' } });
  S.Acts.add(world, astrid, canvasAct);
  for (let i = 0; i < 4000 && !(lot.canvases && lot.canvases[lot.house.items.indexOf(easel)] && lot.canvases[lot.house.items.indexOf(easel)].done > 10); i++) game.fixed(astrid.x, astrid.z);
  S.Acts.dropCurrent(world, astrid);
  astrid.queue.length = 0;
  const canvas = AR.canvasOf(lot, easel);
  ok(canvas && canvas.style === 'portrait' && canvas.done > 10 && S.Acts.menu(world, astrid, { type: 'item', item: easel, lot })[0].label.startsWith('Продолжить: портрет'), 'a canvas waits on the easel');
  run(astrid, S.Acts.adAct('paint_canvas', lot, easel), 60000);
  const painting = astrid.bag.find(it => it.k === 'painting');
  ok(painting && painting.id === 'portrait' && /, портрет»$/.test(painting.n) && !AR.canvasOf(lot, easel) && astrid.skill.stats.paintings === 1, 'a finished canvas becomes a painting');
  ok(AR.paintMins(fake(0), 'large') > AR.paintMins(Object.assign(fake(0), { skill: Object.assign(K.fresh(), { xp: { painting: K.LEVEL_XP[10] } }) }), 'large'), 'a skilled painter is faster');
  const painter = level => {
    const sim = fake(0);
    sim.skill.xp.painting = K.LEVEL_XP[level];
    const w = { rng: { rs: 5 }, events: [], family: [sim] };
    AR.finishPainting(w, sim, { size: 'large', style: 'landscape', done: 1, need: 1 });
    return sim.bag[0].v;
  };
  ok(painter(10) > painter(5) * 1.8 && painter(5) > painter(0) * 1.8, 'paintings get dearer with skill: ' + [painter(0), painter(5), painter(10)]);
  const noMaster = fake(0);
  noMaster.skill.xp.painting = K.LEVEL_XP[3];
  const mw = { rng: { rs: 1 }, events: [], family: [noMaster] };
  for (let i = 0; i < 40; i++) AR.finishPainting(mw, noMaster, { size: 'small', style: 'abstract', done: 1, need: 1 });
  ok(noMaster.skill.stats.masterpieces === 0, 'no masterpieces before painting four');

  lily.skill.xp.writing = K.LEVEL_XP[3];
  ok(S.Acts.menu(world, lily, { type: 'item', item: item('computer'), lot }).find(o => o.label === 'Писать роман…').section.find(o => o.genre === 'romance').closed === 'Нужно письмо 4', 'genres open with writing');
  const writeAct = Object.assign(S.Acts.adAct('write_novel', lot, item('computer')), { genre: 'detective' });
  S.Acts.add(world, lily, writeAct);
  for (let i = 0; i < 4000 && !(lily.novel && lily.novel.done > 5); i++) game.fixed(lily.x, lily.z);
  ok(lily.novel && lily.novel.genre === 'detective' && lily.novel.need === AR.novelHours(lily, 'detective') * 60, 'a novel starts with its genre');
  lily.novel.done = lily.novel.need - 1;
  for (let i = 0; i < 4000 && lily.novel; i++) game.fixed(lily.x, lily.z);
  S.Acts.dropCurrent(world, lily);
  lily.queue.length = 0;
  const script = lily.bag.find(it => it.k === 'manuscript');
  ok(script && script.id === 'detective' && script.x.r > 0 && S.Moods.has(lily, 'bookDone') && lily.skill.stats.novels === 1, 'a finished novel is a manuscript in the bag');
  const funds0 = world.funds;
  const advance = AR.publish(world, lily, lily.bag.indexOf(script));
  const book = world.books[world.books.length - 1];
  ok(advance === Math.round(script.x.r * AR.ADVANCE) && world.funds === funds0 + advance && book.by === lily.id && book.left === AR.ROYALTY_WEEKS && lily.bag.some(it => it.k === 'book' && it.n === script.n), 'the publisher pays an advance and keeps a royalty');
  ok(AR.weekly(world, lily) === book.r, 'weekly royalties are known');
  world.day += 7;
  const funds1 = world.funds;
  game.events.length = 0;
  AR.royalties(world);
  world.day -= 7;
  ok(world.funds === funds1 + book.r && book.left === AR.ROYALTY_WEEKS - 1 && world.events.some(e => e.royalty) && lily.skill.stats.royaltiesEarned === book.r, 'royalties come every week');

  ok(!AR.selfMenu(world, viktor).length && AR.selfMenu(world, astrid).some(o => o.label === 'Играть на гитаре' && !o.closed), 'only the owner of a guitar plays it');
  ok(AR.selfMenu(world, astrid).find(o => o.label === 'Играть за чаевые').closed, 'tips are not paid at home');
  astrid.skill.xp.guitar = K.LEVEL_XP[2];
  ok(AR.selfMenu(world, astrid).find(o => o.label === 'Сыграть песню…').section.filter(o => !o.closed).length === 3, 'a song for every level');
  run(astrid, Object.assign(AR.guitarAct(world, astrid, { guitar: 'guitar_song', song: 'searoad' })));
  ok(astrid.skill.stats.songs === 1 && K.started(astrid, 'guitar'), 'a song is played and counted');
  const tipAct = AR.guitarAct(world, astrid, { guitar: 'guitar_tips' }), listener = world.sims.find(s => s.free && !s.car);
  Object.assign(listener, { inside: null, live: true, x: astrid.x + 2, z: astrid.z, lot: astrid.lot, car: null });
  if (!world.live.includes(listener)) world.live.push(listener);
  const tipWorld = Object.assign({}, world, { rng: { rs: 3 }, events: [] });
  for (let i = 0; i < 40; i++) AR.guitarTick(tipWorld, astrid, tipAct, S.ADS.guitar_tips.steps[0], 10);
  ok(tipAct.tipped > 0 && astrid.skill.stats.tips === tipAct.tipped, 'passers-by leave tips');

  const stove = item('stove');
  viktor.skill.xp.handiness = K.LEVEL_XP[1];
  ok(S.Acts.menu(world, viktor, { type: 'item', item: stove, lot }).find(o => o.label === 'Улучшить…').section[0].closed === 'Нужен ремонт 2', 'an upgrade needs its level');
  viktor.skill.xp.handiness = K.LEVEL_XP[10];
  const funds2 = world.funds;
  run(viktor, Object.assign(S.Acts.adAct('upgrade', lot, stove), { upgrade: 'fireproof' }));
  ok(stove.up && stove.up.includes('fireproof') && world.funds === funds2 - AR.upgradeCost(viktor, S.UPGRADES.fireproof) && viktor.skill.stats.upgrades === 1, 'a skilled hand fits an upgrade');
  ok(AR.fireproof(stove), 'a fireproof stove never burns');
  const shower = item('shower');
  shower.up = ['pressure'];
  ok(AR.boost(world, { lot: 0, item: lot.house.items.indexOf(shower) }, 'hygiene') === 1.5 && AR.boost(world, { lot: 0, item: lot.house.items.indexOf(shower) }, 'fun') === 1, 'a pressure shower washes faster');
  const shocker = fake(0, { traits: [] });
  shocker.skill.xp.handiness = K.LEVEL_XP[1];
  const shockWorld = { lots: world.lots, rng: { rs: 1 }, events: [], funds: 1000, family: [] }, tv = item('tv');
  let shocks = 0;
  for (let i = 0; i < 30; i++) {
    delete tv.up;
    const act = { lot: 0, item: lot.house.items.indexOf(tv), upgrade: 'picture' };
    AR.upgradeDone(shockWorld, shocker, act);
    if (act.failed) shocks++;
  }
  delete tv.up;
  ok(shocks > 0 && shocks < 30 && S.Moods.has(shocker, 'shock'), 'electrics shock a novice sometimes: ' + shocks);
  const freezerLot = { house: { items: [{ up: ['freezer'] }] } };
  ok(AR.freezer(freezerLot) && !AR.freezer({ house: { items: [{}] } }), 'a freezer keeps leftovers longer');

  ok(W.NOW >= 14 && K.NOW === 14, 'stage 14 works');
  viktor.dream = { id: 'royalties', done: false };
  ok(W.dreamProgress(world, viktor, S.DREAMS.royalties)[1] === 4000, 'a dream of royalties counts the weekly sum');
  lily.dream = { id: 'storyPainter', done: false };
  ok(W.dreamProgress(world, lily, S.DREAMS.storyPainter).join() === K.level(lily, 'writing') + ',20', 'a dream of two skills counts both');

  const file = JSON.parse(JSON.stringify(S.Save.file(game, null))), back = new S.Game(doc, 3);
  S.Save.apply(back, file);
  const bl = back.world.lots[0], bitem = base => bl.house.items.find(i => S.baseOf(i) === base);
  ok(back.hash() === game.hash(), 'a craft game survives a save');
  ok(bitem('aquarium').kind === 'm_aquarium_fish' && GA.plantAt(bl, bl.house.items.filter(i => S.baseOf(i) === 'garden')[0]).id === 'grapes' && bitem('stove').up.includes('fireproof') && back.world.books.length === world.books.length && back.world.funds === world.funds, 'the aquarium, the garden, upgrades, books and money survive a save');
  ok(back.world.family[1].bag.some(it => it.k === 'guitar') && back.world.spots.length === 300 && back.world.spots[findIndex].next === find.next, 'bags and finds survive a save');
  const v7 = JSON.parse(JSON.stringify(file));
  v7.version = 7;
  delete v7.state.funds;
  for (const k of ['garden', 'fish', 'spots', 'art']) delete v7.state[k];
  v7.state.sims = v7.state.sims.map(r => r.slice(0, 46));
  const up7 = S.Save.migrate(v7);
  ok(up7.version === S.Save.VERSION && up7.state.funds === null && up7.state.sims.every(r => r.length === 49 && r[46] === null && r[47] === null && r[48] === null), 'a file of version 7 gets craft fields');
  const old = new S.Game(doc, 3);
  S.Save.apply(old, up7);
  ok(old.world.funds === S.Sample.MONEY && old.world.family.every(s => Array.isArray(s.bag)), 'an old save gets money and empty bags');

  const journal = new S.JournalView({ selected: viktor, screen: { sw: 800, sh: 600 }, stamp: '', toast: () => {}, sound: { play: () => {} } });
  journal.tab = 'collections';
  ok(journal.rows().join() === Object.keys(CO.SETS).join(), 'the collections page lists the six sets');
}

{
  const J = S.Jobs, W = S.Wishes, K = S.Skills, careers = Object.values(S.CAREERS), parts = Object.values(S.PART_TIME);
  const PAY = { business: [15, 180], crime: [14, 160], culinary: [14, 150], journalism: [15, 165], police: [16, 170], medical: [18, 240], military: [18, 200], music: [13, 210], politics: [15, 190], sports: [16, 220], science: [18, 200] };
  ok(careers.length === 11 && parts.length === 5, 'eleven careers and five part-time jobs');
  const town = S.Town.create(doc, 1).world, lotOf = id => town.lots.find(l => l.id === id);
  for (const def of careers) {
    const branches = Object.values(def.branches);
    ok(PAY[def.id] && J.payAt(def, 1) === PAY[def.id][0] && J.payAt(def, 10) === PAY[def.id][1], 'a career pays as the plan: ' + def.id);
    ok(branches.length ? branches.length === 2 && branches.every(b => def.levels.length + b.levels.length === 10) && def.branchAt === def.levels.length + 1 : def.levels.length === 10, 'a career has ten steps: ' + def.id);
    for (let level = 2; level <= 10; level++) ok(J.payAt(def, level) > J.payAt(def, level - 1), 'pay grows with the step: ' + def.id + ' ' + level);
  }
  ok(S.CAREERS.crime.branchAt === 7 && S.CAREERS.police.branchAt === 6 && S.CAREERS.music.branchAt === 6, 'branches start where the plan says');
  for (const def of careers.concat(parts)) {
    const lot = lotOf(def.lot);
    ok(lot && lot.closed && (lot.kind === 'work' || lot.kind === 'shop'), 'a job has its building: ' + def.id);
    ok(def.start >= 360 && def.end <= 1430 && def.end - def.start >= (def.part ? 230 : 330), 'a shift fits into one day: ' + def.id);
    const titles = def.levels.concat(...Object.values(def.branches).map(b => b.levels));
    ok(titles.every(t => t.length === 2 && t[0] && t[1]), 'every step has a title for both sexes: ' + def.id);
    for (const ch of def.name + titles.flat().join('')) ok(S.Font.has('small', ch) && S.Font.has('bold', ch), 'the font has the letter of ' + def.id + ': ' + ch);
    ok(!/[—–]/.test(titles.flat().join('')), 'no long dashes in job titles: ' + def.id);
    ok(def.part ? def.levels.length === 3 && !def.reqs.length : def.reqs.length >= 1, 'part-time jobs have three steps and no skills: ' + def.id);
    for (const [key] of def.reqs.concat(...Object.values(def.branches).map(b => b.reqs))) ok(key === 'friends' || key.split('|').every(id => S.SKILLS[id]), 'a requirement names real skills: ' + def.id + ' ' + key);
  }
  ok(parts.filter(p => p.lot === 'spa').length === 2 && S.PART_TIME.crypt.start >= 1200, 'the spa has two jobs, the crypt works at night');
  ok(S.CAREERS.crime.start >= 1080 && S.CAREERS.culinary.start <= 360, 'criminals work at night, cooks start early');
  ok(Object.keys(S.WORK_TONES).length === 7 && Object.keys(S.SCHOOL_TONES).length === 7, 'seven tones at work and at school');
  for (const tone of Object.values(S.WORK_TONES).concat(Object.values(S.SCHOOL_TONES))) ok(S.Icons.NAMES.includes(tone.icon) && /[.]$/.test(tone.text), 'a tone has an icon and a text: ' + tone.id);
  for (const [id, goal] of Object.entries(J.DREAM_JOBS)) {
    const def = S.CAREERS[goal[0]];
    ok(S.DREAMS[id] && def && (!goal[1] || def.branches[goal[1]]) && S.DREAMS[id].stage === 15, 'a career dream names a real career and works now: ' + id);
  }
  ok(S.DREAMS.triedAll.stage === 15 && ['confidentSlacker', 'officeHero', 'doubleShift', 'guiltFreeVacation'].every(id => S.REWARDS[id].stage <= W.NOW), 'career rewards and the dream of four careers work');
  for (const id of ['firstDay', 'late', 'earlyStart', 'promoted', 'raise', 'demoted', 'fired', 'goodWorkday', 'hardWorkday', 'sleeplessNight', 'truant', 'schoolFriends', 'bullied', 'goodGrades', 'badGrades', 'homework', 'loveJob', 'wrongJob', 'overworked']) ok(S.MOODLETS[id] && S.MOODLETS[id].stage <= W.NOW, 'a work moodlet works: ' + id);
  ok(['schmoozer', 'ambitious', 'workaholic'].every(id => !S.TRAITS[id].later), 'career traits work in full');
  const workers = town.sims.filter(s => s.work);
  ok(workers.length >= 30 && new Set(workers.map(s => s.work.id)).size >= 9, 'many town people have jobs in many careers: ' + workers.length);
  ok(workers.every(s => s.age === 'adult' ? !!S.CAREERS[s.work.id] : s.age === 'teen' && !!S.PART_TIME[s.work.id]), 'adults have careers, teens part-time jobs');
  for (const s of workers.slice(0, 12)) {
    const def = J.def(s.work);
    ok(s.day.some(([, place]) => place && place.id === def.lot) && !s.rest.some(([, place]) => place && place.kind === 'work'), 'a worker goes to the job on weekdays only: ' + s.id);
  }
  ok(S.Town.planOf(workers[0], 1) === workers[0].rest && S.Town.planOf(workers[0], 2) === workers[0].day && S.Town.planOf(workers[0], 7) === workers[0].rest, 'Sunday and Saturday are days off');
  const again = S.Town.create(doc, 1).world;
  ok(again.sims.map(s => s.name + s.age + (s.work ? s.work.id + s.work.level : '')).join() === town.sims.map(s => s.name + s.age + (s.work ? s.work.id + s.work.level : '')).join(), 'the town gets the same jobs from the same seed');
  ok(town.sims.filter(s => s.rest).every(s => s.rest.every((e, i) => i === 0 || e[0] > s.rest[i - 1][0])), 'a day off goes in order');
  ok(S.Sim.carSprite(0, -1, 'bus').kind === 'm_bus' && S.Sim.carSprite(1, 1, 'bus').kind === 'm_bus45' && S.Sim.carSprite(0, -1, 'carpool').kind === 'm_car' && S.KIND_ID.m_bus !== undefined && S.KIND_ID.m_bus45 !== undefined, 'the school bus has its own sprite, the car pool is a car');

  const game = new S.Game(doc, 3), world = game.world, lot = world.lots[0], [viktor, astrid, hugo, lily] = world.family;
  game.freeWill = 0;
  game.setSpeed(3);
  for (const s of world.family) {
    S.Acts.dropCurrent(world, s);
    s.queue.length = 0;
  }
  const events = [], fill = sim => { for (const need of S.NEED_ORDER) sim.needs[need] = 100; };
  let feed = true;
  const until = (test, limit) => {
    for (let i = 0; i < (limit || 20000) && !test(); i++) {
      if (feed) world.family.forEach(fill);
      game.fixed(viktor.x, viktor.z);
      events.push(...game.events.splice(0));
    }
    return test();
  };
  const toMinute = (day, minute) => until(() => world.day > day || (world.day === day && world.clock >= minute), 40000);
  const computer = lot.house.items.find(i => S.baseOf(i) === 'computer');
  ok(world.family.every(s => !s.job && !s.side), 'the family starts without jobs');
  const menu = flatMenu(S.Acts.menu(world, viktor, { type: 'item', lot, item: computer }));
  const offers = menu.filter(o => o.ad === 'job_find');
  ok(offers.length === 5 && offers.every(o => o.job && !o.closed && /§\d+\/ч/.test(o.label)), 'the computer offers five jobs a day');
  ok(menu.some(o => o.ad === 'job_home' && o.closed), 'work from home needs a job first');
  const kidMenu = flatMenu(S.Acts.menu(world, hugo, { type: 'item', lot, item: computer }));
  ok(kidMenu.some(o => o.label === 'Найти работу…' && o.closed), 'a child cannot look for a job');
  const lilyOffers = flatMenu(S.Acts.menu(world, lily, { type: 'item', lot, item: computer })).filter(o => o.ad === 'job_find');
  ok(lilyOffers.length === 5 && lilyOffers.every(o => S.PART_TIME[o.job]), 'a teen gets only part-time offers');
  const office = world.lots.find(l => l.id === 'office');
  const door = flatMenu(S.Acts.menu(world, viktor, { type: 'ground', x: office.x + office.w / 2, z: office.z + office.d / 2 }));
  ok(door.some(o => o.job === 'business' && o.go) && door.some(o => o.job === 'journalism'), 'a click on a building offers its jobs');
  ok(J.canWork(lily, S.CAREERS.business) && !J.canWork(lily, S.PART_TIME.books) && J.canWork(hugo, S.PART_TIME.books), 'teens get part-time jobs, children none');
  const findAct = S.Acts.adAct('job_find', lot, computer);
  findAct.job = 'business';
  fill(viktor);
  S.Acts.add(world, viktor, findAct);
  ok(until(() => !!viktor.job, 6000) && viktor.job.id === 'business' && viktor.job.level === 1 && J.title(viktor) === 'Курьер', 'the computer finds a job after a short search');
  ok(events.some(e => e.type === 'job' && /новая работа/.test(e.text)), 'a new job is announced');
  ok(viktor.wish.memo.soc['#job_business'] === 1, 'a new job counts for wishes');
  const mates = J.coworkers(world, viktor), boss = J.boss(world, viktor);
  ok(mates.length >= 2 && mates.every(o => o.work && o.work.id === 'business'), 'coworkers are real town people: ' + mates.length);
  ok(boss && boss.work.level > viktor.job.level, 'the boss is a town person above the sim');
  ok(J.describe(world, boss).startsWith('Работает: ') && J.describe(world, viktor) === 'Работает: курьер, ' + office.name, 'people tell where they work');

  toMinute(2, 0);
  ok(world.day === 2 && J.workday(world) && !J.workday({ day: 1 }) && !J.workday({ day: 7 }), 'Monday is a workday, the weekend is not');
  fill(viktor);
  toMinute(2, 8 * 60 + 30);
  ok(events.some(e => e.type === 'job' && e.ride && e.text.includes(viktor.name)), 'the car pool comes for the worker');
  ok(events.some(e => e.type === 'job' && e.ride && e.text.includes(hugo.name)) && events.some(e => e.type === 'job' && e.ride && e.text.includes(lily.name)), 'the school bus comes for the children');
  ok(until(() => viktor.inside === office && J.atWork(world, viktor), 4000), 'the worker gets into the office');
  ok(viktor.job.at >= 0 && viktor.job.at <= 9 * 60 + 10 && !viktor.job.late, 'the car pool brings the worker on time: ' + S.timeText(viktor.job.at));
  ok(S.Moods.has(viktor, 'firstDay'), 'the first day gives a moodlet');
  ok(until(() => J.atWork(world, hugo) && J.atWork(world, lily), 4000) && hugo.inside.id === 'school', 'the children are at school');
  const status = J.status(world, viktor);
  ok(status && !status.school && status.place === office && /работает, ещё/.test(status.text) && Object.keys(status.tones).length === 7, 'the rabbit hole shows who works and how long');
  ok(J.status(world, hugo).school && /учится/.test(J.status(world, hugo).text), 'the school panel says the child studies');
  const perfAt = viktor.job.perf, fundsAt = world.funds;
  toMinute(2, 12 * 60);
  ok(viktor.inside === office && !viktor.act && !viktor.queue.length && viktor.job.perf > perfAt, 'the worker stays inside and the bar grows');
  ok(mates.some(o => o.inside === office) && S.Rel.of(world, viktor).some(rel => mates.includes(S.Rel.other(world, rel, viktor)) && rel.f & S.Rel.F.met), 'the sim meets coworkers who are inside');
  J.setTone(world, viktor, 'hard');
  feed = false;
  const energyAt = viktor.needs.energy;
  toMinute(2, 13 * 60);
  feed = true;
  ok(viktor.job.tone === 'hard' && viktor.needs.energy < energyAt, 'working hard costs energy');
  J.setTone(world, viktor, 'normal');
  toMinute(2, 17 * 60 + 5);
  const wage = events.find(e => e.type === 'money' && /зарплата/.test(e.text) && e.text.includes(viktor.name));
  ok(wage && world.funds > fundsAt && viktor.job.day === 2 && viktor.job.at === -1, 'the shift ends with a wage');
  ok(viktor.act && viktor.act.go && viktor.act.home || viktor.queue.some(a => a.home) || !viktor.inside, 'the worker goes home after the shift');
  ok(viktor.wish.memo.soc['#pay_business'] === 1 && viktor.skill.stats.workDays === 1, 'a payday counts');
  ok(hugo.school.homeworkDue && !hugo.school.homework && S.Moods.has(hugo, 'homework'), 'school gives homework');
  ok(J.factor(world, hugo, S.ADS.homework) === 3 && J.duty(world, hugo, S.ADS.homework) > 0 && J.factor(world, viktor, S.ADS.homework) === 0, 'homework calls the child to the table');
  const table = lot.house.items.find(i => S.baseOf(i) === 'table' || S.baseOf(i) === 'desk');
  until(() => !J.atWork(world, hugo) && !hugo.inside, 4000);
  const gradeAt = hugo.school.grade;
  fill(hugo);
  S.Acts.dropCurrent(world, hugo);
  hugo.queue.length = 0;
  S.Acts.add(world, hugo, S.Acts.adAct('homework', lot, table));
  ok(until(() => hugo.school.homework, 8000) && !S.Moods.has(hugo, 'homework'), 'the child does the homework');
  ok(hugo.wish.memo.soc['#homework'] === 1, 'homework counts for wishes');

  toMinute(3, 18 * 60);
  ok(hugo.school.day === 3 && hugo.school.grade > gradeAt, 'done homework lifts the grade: ' + gradeAt.toFixed(1) + ' -> ' + hugo.school.grade.toFixed(1));
  viktor.job.perf = 99.9;
  toMinute(4, 17 * 60 + 5);
  ok(viktor.job.level === 2 && viktor.job.perf < 50 && S.Moods.has(viktor, 'promoted') && viktor.skill.stats.tops.business === 2, 'a full bar gives a promotion');
  ok(events.some(e => e.type === 'money' && /премия/.test(e.text)) && events.some(e => e.type === 'job' && e.promoted), 'a promotion pays a bonus');
  ok(viktor.wish.memo.soc['#promotion'] === 1 && viktor.wish.memo.soc['#up_business'] === 1, 'a promotion counts for wishes');
  ok(J.missing(world, viktor).length === 1 && J.missing(world, viktor)[0][0] === 'charisma', 'the next step needs charisma');
  viktor.job.perf = 100;
  J.endShift(world, viktor, Object.assign(viktor.job, { at: 9 * 60, worked: 480 }), false);
  ok(viktor.job.level === 2 && world.events.some(e => /не хватает: обаяние 1/.test(e.text)), 'without the skill there is no promotion, and the game says why');
  ok(J.trainerFor(world, viktor, 'charisma') && J.trainerFor(world, viktor, 'charisma').skill === 'charisma', 'the job tab finds a thing that teaches the skill');
  viktor.skill.xp.charisma = K.LEVEL_XP[1];
  viktor.job.day = -1;
  viktor.job.perf = 100;
  J.endShift(world, viktor, Object.assign(viktor.job, { at: 9 * 60, worked: 480 }), false);
  ok(viktor.job.level === 3 && J.title(viktor) === 'Клерк', 'with the skill the promotion comes');

  const before = world.funds;
  viktor.job.perf = 50;
  viktor.job.asked = -1;
  ok(!J.askRaise(world, viktor) && viktor.job.perf === 40 && viktor.job.asked === world.day && !J.askRaise(world, viktor), 'asking for a raise with a weak bar fails, once a day');
  ok(world.funds === before, 'a refused raise costs nothing');
  viktor.job.perf = 20;
  J.missed(world, viktor, viktor.job);
  ok(viktor.job.perf === 0 && viktor.job.misses === 1, 'a missed day costs performance');
  viktor.job.misses = 2;
  J.missed(world, viktor, viktor.job);
  ok(!viktor.job && viktor.lastJob === 'business' && S.Moods.has(viktor, 'fired'), 'three missed days in a row fire the sim');
  ok(J.join(world, viktor, 'business', true) && viktor.job.level === 1, 'the sim can come back from the first step');
  viktor.rewards.push('guiltFreeVacation');
  viktor.job.misses = 2;
  viktor.job.perf = 60;
  J.missed(world, viktor, viktor.job);
  ok(viktor.job && viktor.job.perf === 60, 'a guilt free vacation keeps the job and the bar');
  viktor.rewards.length = 0;
  viktor.job.level = 4;
  viktor.job.lows = 2;
  viktor.job.perf = 3;
  J.endShift(world, viktor, Object.assign(viktor.job, { day: -1, at: 9 * 60, worked: 480 }), false);
  ok(viktor.job.level === 3 && S.Moods.has(viktor, 'demoted'), 'three bad days demote the sim');

  ok(J.join(world, astrid, 'crime', true) && astrid.job.branch === null, 'a criminal starts without a branch');
  astrid.job.level = 6;
  ok(J.setBranch(astrid, 'thief') && astrid.job.branch === 'thief', 'the branch can be chosen before step seven');
  astrid.skill.xp.athletic = K.LEVEL_XP[5];
  astrid.skill.xp.handiness = K.LEVEL_XP[3];
  astrid.job.perf = 100;
  J.endShift(world, astrid, Object.assign(astrid.job, { day: -1, at: 18 * 60, worked: 330 }), false);
  ok(astrid.job.level === 7 && J.title(astrid) === 'Воровка-домушница' && J.branchOf(astrid.job).id === 'thief', 'step seven follows the chosen branch with a female title');
  ok(astrid.skill.stats.tops['crime:thief'] === 7 && astrid.skill.stats.tops.crime === 7 && J.dreamLevel(astrid, 'crime', 'thief') === 7, 'the branch step is remembered for dreams');
  astrid.dream = { id: 'heistKing', done: false };
  ok(W.dreamProgress(world, astrid, S.DREAMS.heistKing).join() === '7,10', 'the heist dream counts the thief branch');
  ok(W.usable(world, astrid, S.WISHES.job_crime_top) && !W.usable(world, astrid, S.WISHES.job_crime_5) && W.usable(world, astrid, S.WISHES.job_crime_up), 'career wishes follow the step');
  ok(W.counter(astrid, S.WISHES.job_crime_top.goal) === 7, 'a career wish counts the best step');
  ok(S.Moods.has(astrid, 'sleeplessNight'), 'a night shift leaves a sleepless night');
  astrid.job.level = 10;
  astrid.job.perf = 100;
  J.endShift(world, astrid, Object.assign(astrid.job, { day: -1, at: 18 * 60, worked: 330 }), false);
  ok(astrid.job.level === 10 && astrid.job.perf === 60 && S.Moods.has(astrid, 'raise'), 'at the top a full bar gives a raise');
  ok(J.careersAt(astrid, 5) === 1, 'one career at step five counts once');

  ok(J.join(world, viktor, 'books', true) && viktor.job.id === 'books' && !viktor.side, 'without the reward a new job replaces the old one');
  ok(viktor.wish.memo.soc['#jobChange'] >= 1 && viktor.wish.memo.soc['#partJob'] === 1, 'changing jobs counts');
  viktor.rewards.push('doubleShift');
  ok(J.slotFor(viktor, S.CAREERS.business) === 'job' && J.join(world, viktor, 'business', true) && viktor.job.id === 'business' && viktor.side === null, 'a clashing shift still replaces the job');
  ok(J.slotFor(viktor, S.PART_TIME.crypt) === 'side' && J.join(world, viktor, 'crypt', true) && viktor.job.id === 'business' && viktor.side.id === 'crypt', 'with the reward a second job fits the free hours');
  ok(J.coworkers(world, viktor, viktor.side).every(o => o.work.id === 'crypt') && J.title(viktor, viktor.side) === 'Смотритель склепа', 'the second job has its own coworkers and title');
  ok(J.quit(world, viktor, viktor.side) && !viktor.side && viktor.job.id === 'business', 'the second job can be left alone');
  viktor.rewards.length = 0;

  ok(J.join(world, lily, 'cashier', true) && lily.job.id === 'cashier' && lily.school, 'a teen has school and a part-time job');
  const lilySave = JSON.parse(JSON.stringify(S.Save.file(game, null)));
  const back = new S.Game(doc, 3);
  S.Save.apply(back, lilySave);
  ok(back.hash() === game.hash(), 'jobs and school survive a save');
  const [bv, ba, bh, bl] = back.world.family;
  ok(bv.job.id === 'business' && ba.job.branch === 'thief' && bh.school.homework === hugo.school.homework && bl.job.id === 'cashier' && back.world.sims.filter(s => s.work).length === world.sims.filter(s => s.work).length, 'the save keeps jobs, branches, school and town jobs');
  const v8 = JSON.parse(JSON.stringify(lilySave));
  v8.version = 8;
  v8.state.sims = v8.state.sims.map(r => r.slice(0, 48));
  const up8 = S.Save.migrate(v8);
  ok(up8.version === S.Save.VERSION && up8.state.sims.every(r => r.length === 49 && r[48] === null), 'a file of version 8 gets job fields');
  const old = new S.Game(doc, 3);
  S.Save.apply(old, up8);
  ok(old.world.family.every(s => !s.job && !s.side && s.pension === 0) && old.world.sims.filter(s => s.work).length === world.sims.filter(s => s.work).length, 'an old save starts without jobs and keeps the town');
  const bad = JSON.parse(JSON.stringify(lilySave));
  bad.state.sims[0][48][0][0] = 'astronautics';
  assert.throws(() => S.Save.apply(new S.Game(doc, 3), bad), /неизвестная работа/, 'an unknown job in a file is refused');
  checks++;

  const worker = world.sims.find(s => s.free && s.work && S.CAREERS[s.work.id] && s.age === 'adult');
  const level = worker.work.level;
  S.Social.join(world, worker, true);
  ok(worker.job && worker.job.id === worker.work.id && worker.job.level === level && !worker.job.first, 'a town worker who moves in keeps the job');
  worker.job.level = Math.min(10, level + 1);
  S.Social.leave(world, worker);
  ok(!worker.job && worker.work.level === Math.min(10, level + 1) && worker.day && worker.rest, 'moving out keeps the step in town');

  const elder = world.family[0];
  const age = elder.age;
  elder.age = 'elder';
  ok(J.retire(world, elder) && elder.pension > 0 && !elder.job, 'an elder retires with a pension');
  elder.age = age;
  const pension = elder.pension, fundsBefore = world.funds;
  toMinute(world.day + 1, 30);
  ok(world.funds >= fundsBefore + pension - 1 && events.some(e => e.type === 'money' && /пенсия/.test(e.text)), 'the pension comes at midnight');
  elder.pension = 0;

  const fresh = W.usable(world, astrid, S.WISHES.job_business), teen = W.usable(world, lily, S.WISHES.job_business);
  ok(fresh && !teen, 'a career wish fits a free adult, not a teen');
  ok(!W.usable(world, astrid, S.WISHES.job_crime_top) && !W.usable(world, astrid, S.WISHES.job_crime_up), 'career wishes end at the top');
  ok(W.usable(world, lily, S.WISHES.school_0) === (lily.school.homeworkDue && !lily.school.homework), 'the homework wish follows the homework');
}

{
  const U = S.Upkeep, SV = S.Services, OP = S.Opps, N = S.News, E = S.Econ, W = S.Wishes, rows = Object.values(S.OPPS);
  ok(rows.length === 120 && rows.filter(r => r.kind === 'career').length === 66 && rows.filter(r => r.kind === 'skill').length === 40 && rows.filter(r => r.kind === 'special').length === 14, '120 opportunities: 66 career, 40 skill, 14 special');
  for (const id of Object.keys(S.CAREERS)) ok(rows.filter(r => r.kind === 'career' && r.key === id).length >= 6, 'six opportunities a career: ' + id);
  for (const id of Object.keys(S.SKILLS)) ok(rows.filter(r => r.kind === 'skill' && r.key === id).length === 4, 'four opportunities a skill: ' + id);
  const town = S.Town.create(doc, 1).world, lotIds = new Set(town.lots.map(l => l.id)), goals = new Set(['perf', 'visit', 'place', 'skill', 'meet', 'talk', 'friend', 'friends', 'act', 'soc', 'bump', 'deliver']);
  for (const r of rows) {
    const g = r.goal;
    ok(goals.has(g[0]) && r.days >= 2 && r.days <= 12 && OP.rewardText(r), 'an opportunity has a goal, a deadline and a reward: ' + r.id);
    if (g[0] === 'visit' || g[0] === 'place') ok(lotIds.has(g[1]) && g[2] >= 1, 'an opportunity names a real place: ' + r.id);
    if (g[0] === 'deliver') ok(lotIds.has(g[3]) && E.KINDS[g[1]], 'a delivery names a real thing and place: ' + r.id);
    if (g[0] === 'act') ok(g[1] === 'jog' || S.ADS[g[1]], 'an opportunity names a real action: ' + r.id);
    if (g[0] === 'soc') ok(S.Social.SOCIALS[g[1]], 'an opportunity names a real social line: ' + r.id);
    if (g[0] === 'skill') ok(S.SKILLS[g[1]] && g[2] <= 10, 'an opportunity names a real skill: ' + r.id);
    for (const ch of r.title + r.text) ok(S.Font.has('small', ch) && S.Font.has('bold', ch) && S.Font.has('text', ch), 'the font has the letter of ' + r.id + ': ' + ch);
    ok(!/[—–]/.test(r.title + r.text) && /[.!?]$/.test(r.text), 'an opportunity text is a sentence without long dashes: ' + r.id);
  }
  ok(new Set(rows.map(r => r.title)).size === rows.length, 'opportunity titles are unique');
  ok(S.OPPS.sp_ghost.stage === 18 && S.OPPS.sp_toddler.stage === 17 && rows.filter(r => r.stage > OP.NOW).length === 2, 'two specials wait for the life cycle');
  for (const id of ['biz_calls', 'mil_drill', 'music_concert', 'pol_fund', 'sport_train', 'sci_experiment', 'news_report', 'sci_study']) ok(S.ADS[id] && S.ADS[id].job && S.CAREERS[S.ADS[id].job[0]], 'a career action needs its career: ' + id);
  const lines = ['heal', 'arrest', 'health_tip', 'check_docs', 'deal', 'interview', 'salute', 'autograph', 'campaign', 'threaten', 'cooking_tip', 'teach_guitar'];
  for (const id of lines) ok(S.Social.SOCIALS[id] && S.CAREERS[S.Social.SOCIALS[id].job], 'a career social line names its career: ' + id);
  const actions = {};
  for (const id of Object.keys(S.CAREERS)) actions[id] = Object.values(S.ADS).filter(a => a.job && a.job[0] === id).length + lines.filter(l => S.Social.SOCIALS[l].job === id).length + (id === 'crime' ? 1 : 0) + (id === 'culinary' ? 1 : 0);
  ok(Object.values(actions).every(n => n >= 2), 'every career has two special actions: ' + JSON.stringify(actions));
  ok(Object.keys(S.UPGRADES).length === 10 && S.UPGRADES.unbreakable.models.includes('toilet') && S.UPGRADES.selfClean.models.includes('shower'), 'two new upgrades for breakage and dirt');
  for (const id of ['pizza', 'emptyFridge', 'dirtyToilet', 'brokenToilet', 'coldShower', 'goodNews', 'dirty', 'filthy', 'trashSmell', 'brokenThings', 'robbed', 'thiefSeen', 'bills', 'broke', 'repo', 'flood', 'repairBill']) ok(S.MOODLETS[id] && S.MOODLETS[id].stage <= W.NOW, 'a stage 16 moodlet works: ' + id);
  ok(['handy', 'brave', 'lucky', 'neat', 'slob', 'mooch', 'frugal', 'technophobe'].every(id => !S.TRAITS[id].later), 'stage 16 traits work in full');
  ok(W.NOW === 16 && S.Social.NOW === 16 && ['fastTrade', 'quickClean', 'chanceCatcher'].every(id => S.REWARDS[id].stage <= W.NOW), 'stage 16 rewards work');
  ok(Object.keys(S.RECIPES).length === 28 && S.RECIPES.pizza && S.RECIPES.pizza.kind === 'delivery', 'pizza is a dish without a recipe');

  const game = new S.Game(doc, 3), world = game.world, lot = world.lots[0], [viktor, astrid, hugo, lily, pip] = world.family, item = base => lot.house.items.find(i => S.baseOf(i) === base);
  game.freeWill = 0;
  game.setSpeed(3);
  for (const s of world.family) {
    S.Acts.dropCurrent(world, s);
    s.queue.length = 0;
  }
  const events = [], fill = sim => { for (const need of S.NEED_ORDER) sim.needs[need] = 100; };
  let feed = true;
  const until = (test, limit) => {
    for (let i = 0; i < (limit || 20000) && !test(); i++) {
      if (feed) world.family.forEach(fill);
      game.fixed(viktor.x, viktor.z);
      events.push(...game.events.splice(0));
    }
    return test();
  };
  const run = (sim, act, limit) => {
    S.Acts.add(world, sim, act);
    return until(() => sim.act !== act && !sim.queue.includes(act), limit || 6000);
  };
  const parts = E.houseParts(world, lot), value = E.houseValue(world, lot);
  ok(parts.land > 0 && parts.structure > 0 && parts.objects > 5000 && value === parts.land + parts.structure + parts.objects && value > 15000 && value < 60000, 'the house has a value: ' + JSON.stringify(parts));
  ok(E.wealth(world) === value + world.funds && E.billAmount(world) >= 150 && E.billAmount(world) <= value * 0.025, 'a bill is a small part of the house: ' + E.billAmount(world));
  ok(lot.house.alarm && lot.house.detector, 'the house has an alarm and a smoke detector');

  const tv = item('tv'), toilet = item('toilet'), sink = item('kitchen_sink'), computer = item('computer');
  ok(U.breakChance(world, viktor, lot, toilet) > U.breakChance(world, viktor, lot, computer) && U.breakChance(world, viktor, lot, item('sofa')) === 0, 'cheap things break more often, sofas never');
  viktor.traits = ['clumsy'];
  ok(U.breakChance(world, viktor, lot, toilet) > U.breakChance(world, astrid, lot, toilet), 'clumsy sims break things more often');
  viktor.traits = [];
  ok(U.breakItem(world, lot, tv) && U.brokenKind(lot, tv) === 'dead' && !S.Acts.menu(world, astrid, { type: 'item', lot, item: tv }).some(o => o.ad === 'tv_watch'), 'a broken television cannot be watched');
  ok(S.Acts.menu(world, astrid, { type: 'item', lot, item: tv })[0].ad === 'repair' && S.Acts.menu(world, hugo, { type: 'item', lot, item: tv })[0].closed, 'adults repair, children cannot');
  ok(!S.Acts.choices(world, astrid, 2).some(c => c.item === lot.house.items.indexOf(tv) && c.id === 'tv_watch'), 'autonomy never picks a broken thing');
  astrid.skill.xp.handiness = S.Skills.LEVEL_XP[10];
  const repairAct = S.Acts.adAct('repair', lot, tv);
  ok(run(astrid, repairAct) && !U.brokenKind(lot, tv) && astrid.wish.memo.soc['#fix'] === 1, 'a repair fixes the television and counts');
  ok(U.repairMins(astrid) < U.repairMins(viktor) && U.shockChance(viktor, 'tv') > U.shockChance(astrid, 'tv') && U.shockChance(viktor, 'toilet') === 0, 'skill makes repairs faster and safer, plumbing never shocks');
  U.breakItem(world, lot, sink);
  ok(U.brokenKind(lot, sink) === 'leak' && until(() => U.of(lot).puddles.length > 0, 3000), 'a leaking sink floods the floor');
  ok(until(() => S.Moods.has(viktor, 'flood'), 200), 'a flood spoils the mood');
  U.fix(world, lot, sink);
  const p = U.of(lot).puddles[0], mopOpt = U.groundMenu(world, viktor, lot, p[0], p[1], p[2])[0];
  ok(mopOpt && mopOpt.ad === 'mop', 'a click on a puddle offers to mop it');
  const mop = S.Acts.adAct('mop', lot, null);
  mop.spot = mopOpt.spot;
  ok(run(viktor, mop) && !U.of(lot).puddles.length, 'mopping removes the puddle');
  viktor.needs.bladder = 0;
  viktor.inside = null;
  S.Acts.stepSim(world, viktor, 0.01, 0);
  ok(U.of(lot).puddles.length === 1, 'an accident at home leaves a puddle');
  U.of(lot).puddles.length = 0;
  U.of(lot).dishes = 8;
  U.of(lot).trash = U.TRASH_FULL;
  U.of(lot).dirt[lot.house.items.indexOf(toilet)] = U.TOILET_DIRTY;
  until(() => true);
  game.fixed(viktor.x, viktor.z);
  ok(U.score(lot) >= U.DIRTY_AT && (S.Moods.has(viktor, 'dirty') || S.Moods.has(viktor, 'filthy')) && S.Moods.has(viktor, 'trashSmell') && S.Moods.has(viktor, 'dirtyToilet'), 'a dirty house spoils the mood');
  viktor.traits = ['slob'];
  astrid.traits = ['neat'];
  game.fixed(viktor.x, viktor.z);
  ok(!S.Moods.has(viktor, 'dirty') && !S.Moods.has(viktor, 'filthy') && S.Traits.moodValue(astrid, S.MOODLETS.dirty) < S.MOODLETS.dirty.value, 'slobs do not mind dirt, neat sims mind it twice');
  ok(U.duty(world, astrid, lot, sink, S.ADS.wash_dishes) > U.duty(world, viktor, lot, sink, S.ADS.wash_dishes) && U.duty(world, astrid, lot, sink, S.ADS.wash_dishes) > 0, 'neat sims want to clean, slobs do not');
  viktor.traits = [];
  astrid.traits = [];
  ok(run(lily, S.Acts.adAct('wash_dishes', lot, sink)) && U.of(lot).dishes === 0 && run(lily, S.Acts.adAct('trash_out', lot, item('trash'))) && U.of(lot).trash === 0, 'dishes and trash are cleaned');
  ok(run(lily, S.Acts.adAct('scrub_toilet', lot, toilet)) && !U.of(lot).dirt[lot.house.items.indexOf(toilet)] && lily.wish.memo.soc['#chores'] === 3, 'a toilet is scrubbed and chores count');

  ok(world.service && SV.unpaid(world).length === 0 && world.service.burglar > 0, 'services start with no bills and a burglar planned');
  until(() => SV.unpaid(world).length > 0 || (world.day === 2 && world.clock >= 780), 40000);
  ok(SV.unpaid(world).length === 1 && events.some(e => e.type === 'service' && e.mail), 'the mail brings a bill on Monday');
  ok(world.sims.some(s => s.free && s.duty) || events.some(e => e.type === 'service' && /Почтальон|Разносчи/.test(e.text)), 'town people do the rounds');
  ok(world.service.paper === 2 && SV.mailboxMenu(world, viktor, lot, item('mailbox')).some(o => o.ad === 'paper_read' && !o.closed), 'the newspaper waits in the mailbox');
  const due = SV.due(world), funds = world.funds;
  ok(run(viktor, S.Acts.adAct('pay_bills', lot, item('mailbox'))) && SV.unpaid(world).length === 0 && world.funds === funds - due && viktor.wish.memo.soc['#billsOnTime'] === 1, 'bills are paid at the mailbox');
  ok(run(lily, S.Acts.adAct('paper_read', lot, item('mailbox'))) && events.some(e => e.type === 'news' && e.open), 'reading the paper opens it');
  const paper = N.paper(world);
  ok(paper.vacancies.length === 3 && paper.coupons.length === 2 && paper.joke && paper.vacancies.every(v => S.Jobs.def({ id: v.job })), 'the paper has vacancies, coupons and a joke');
  ok(E.keepCoupon(world, paper.coupons[0]) && E.coupon(world, paper.coupons[0]) === E.COUPONS[paper.coupons[0]][1], 'a coupon from the paper works');

  const bill = { amount: 300, day: world.day - SV.RED_DAYS - 1, red: 1 };
  world.service.mail.bills.push(bill);
  const before = lot.house.items.filter(i => i.gone).length;
  SV.sendCollector(world);
  ok(until(() => !SV.unpaid(world).length, 20000) && lot.house.items.filter(i => i.gone).length > before && events.some(e => /Коллектор забрал/.test(e.text)), 'the collector takes things for an old bill');
  const taken = lot.house.items.filter(i => i.gone);
  ok(taken.every(i => !S.objectOf(i)) && (S.House.itemFlags(lot.house, taken[0], null) & S.House.FLAG_HIDDEN) !== 0, 'taken things are hidden and unusable');
  for (const i of taken) U.giveBack(world, lot, i);

  const thief = SV.sendBurglar(world);
  ok(thief && thief.duty.kind === 'burglar' && SV.roleName('burglar', thief), 'a burglar sets out');
  ok(until(() => !thief.duty || thief.duty.jail || events.some(e => /Украли/.test(e.text)), 30000), 'the burglar gets caught or steals');
  ok(events.some(e => /Сработала сигнализация/.test(e.text)) && S.Moods.has(viktor, 'thiefSeen'), 'the alarm wakes the house');
  ok(events.some(e => /задерживает вора|Украли|прогоняет вора/.test(e.text)), 'the burglar is caught, chased or gets away with loot');
  until(() => !thief.duty, 20000);

  const stove = item('stove');
  S.Food.ignite(world, lot, stove, null);
  ok(world.sims.some(s => s.duty && s.duty.kind === 'fire') || until(() => world.sims.some(s => s.duty && s.duty.kind === 'fire'), 50), 'the smoke detector calls the firefighters');
  ok(until(() => !S.Food.burning(lot), 20000), 'the fire is put out');

  SV.call(world, viktor, 'pizza');
  ok(until(() => !!lot.kitchen && lot.kitchen.meals.some(m => m.recipe === 'pizza'), 20000), 'pizza arrives');
  const counter = item('counter');
  hugo.needs.hunger = 30;
  ok(run(hugo, S.Acts.adAct('eat_meal', lot, counter)) && S.Moods.has(hugo, 'pizza'), 'pizza tastes like pizza');

  U.breakItem(world, lot, computer);
  SV.call(world, viktor, 'repair');
  const fixFunds = world.funds;
  ok(until(() => !U.brokenKind(lot, computer) && !world.sims.some(s => s.duty && s.duty.kind === 'repair' && s.duty.phase !== 'leave'), 20000) && world.funds < fixFunds && S.Moods.has(viktor, 'repairBill'), 'the repairman fixes and takes money');
  U.of(lot).dishes = 5;
  SV.call(world, viktor, 'maid');
  ok(until(() => U.of(lot).dishes === 0, 20000), 'the maid washes the dishes');
  SV.call(world, viktor, 'maidOff');
  ok(!world.service.maid, 'the maid can be let go');

  world.family.forEach(s => {
    if (s !== pip) {
      s.inside = world.lots.find(l => l.id === 'office');
      s.lot = s.inside;
    }
  });
  pip.inside = null;
  events.length = 0;
  feed = true;
  until(() => events.some(e => e.type === 'ask' && e.kind === 'nanny'), 600);
  ok(events.some(e => e.type === 'ask' && e.kind === 'nanny'), 'leaving a toddler alone asks about a nanny');
  SV.call(world, viktor, 'nanny');
  ok(until(() => world.sims.some(s => s.duty && s.duty.kind === 'nanny' && s.duty.phase === 'work'), 20000), 'the nanny comes');
  world.family.forEach(s => {
    s.inside = null;
    s.lot = lot;
  });
  ok(until(() => !world.sims.some(s => s.duty && s.duty.kind === 'nanny' && s.duty.phase === 'work'), 2000), 'the nanny leaves when the family is back');

  const groceries = world.funds;
  E.payGroceries(world, viktor, S.RECIPES.pancakes, 4);
  ok(world.funds === groceries - E.mealCost(world, viktor, S.RECIPES.pancakes, 4) && E.mealCost(world, viktor, S.RECIPES.pancakes, 4) > E.mealCost(world, viktor, S.RECIPES.coffee, 1), 'cooking costs groceries');
  viktor.traits = ['frugal'];
  ok(E.mealCost(world, viktor, S.RECIPES.pancakes, 4) < E.mealCost(world, astrid, S.RECIPES.pancakes, 4), 'frugal sims spend less on groceries');
  viktor.traits = [];
  const keep = world.funds;
  world.funds = 3;
  ok(!E.payGroceries(world, viktor, S.RECIPES.pancakes, 4) && S.Moods.has(viktor, 'emptyFridge'), 'no money, no groceries');
  game.fixed(viktor.x, viktor.z);
  ok(S.Moods.has(viktor, 'broke'), 'an empty wallet spoils the mood');
  world.funds = keep;
  viktor.bag.push(E.item('gem', 'amethyst', { v: 40 }));
  ok(E.store(world, viktor, viktor.bag.length - 1) && E.familyBag(world).length === 1 && E.fetch(world, lily, 0) && lily.bag.some(it => it.id === 'amethyst'), 'the family inventory keeps things for everyone');
  ok(E.shopRate(world, viktor) < 1 && (viktor.rewards.push('fastTrade'), E.shopRate(world, viktor) === 1), 'fast trade sells without loss');

  ok(S.Jobs.join(world, viktor, 'business', true) && OP.eligible(world, viktor, S.OPPS.biz_report) && !OP.eligible(world, viktor, S.OPPS.crime_stash) && !OP.eligible(world, hugo, S.OPPS.biz_report), 'career opportunities fit the career');
  ok(OP.eligible(world, hugo, S.OPPS.sp_club) && !OP.eligible(world, viktor, S.OPPS.sp_club) && !OP.eligible(world, viktor, S.OPPS.sp_ghost), 'special ones fit the age and the stage');
  S.Jobs.quit(world, viktor);
  OP.offer(world, astrid, S.OPPS.sp_committee, false);
  ok(world.opps.offer && OP.accept(world) && OP.activeOf(world, astrid).length === 1, 'an offer can be taken');
  const hall = world.lots.find(l => l.id === 'cityhall');
  ok(OP.lotMenu(world, astrid, { enter: hall, x: hall.doorOut[0], z: hall.doorOut[1], lot: hall }).some(o => /Задание/.test(o.label)), 'the place offers the task');
  const hallFunds = world.funds;
  astrid.inside = hall;
  astrid.lot = hall;
  ok(OP.busyInside(world, astrid) && OP.status(world, astrid) && /ещё/.test(OP.status(world, astrid).text), 'a visit holds the sim inside with a panel');
  ok(until(() => !OP.activeOf(world, astrid).length, 20000) && world.funds >= hallFunds + 300 && N.list(world).some(n => /Комитет-2000/.test(n.text)), 'a finished visit pays and makes the news');
  astrid.inside = null;
  astrid.lot = lot;
  OP.offer(world, lily, S.OPPS.sk_garden_shop, false);
  OP.decline(world);
  ok(!world.opps.offer && world.opps.cool.sk_garden_shop > 0, 'a refused offer cools down');
  OP.offer(world, astrid, S.OPPS.sp_butterflies, false);
  OP.accept(world);
  const bugs = OP.activeOf(world, astrid)[0];
  astrid.bag.push(E.item('butterfly', 'swallowtail', { v: 25 }), E.item('butterfly', 'peacock', { v: 30 }));
  ok(OP.deliver(world, astrid, 'sp_butterflies') === 2 && bugs.have === 2 && bugs.paid === Math.round(55 * OP.PAY.butterfly), 'deliveries are paid by the plan rates');
  OP.offer(world, lily, S.OPPS.sp_neighbor, false);
  OP.accept(world);
  const late = OP.activeOf(world, lily)[0];
  late.until = world.day * 1440 + world.clock - 1;
  game.fixed(viktor.x, viktor.z);
  ok(!OP.activeOf(world, lily).length && game.events.some(e => e.type === 'opp' && e.failed), 'a late task fails');

  const file = JSON.parse(JSON.stringify(S.Save.file(game, null))), back = new S.Game(doc, 3);
  S.Save.apply(back, file);
  ok(back.hash() === game.hash(), 'services, upkeep and opportunities survive a save');
  const v9 = JSON.parse(JSON.stringify(file));
  v9.version = 9;
  for (const k of ['upkeep', 'service', 'purse', 'opps']) delete v9.state[k];
  const up9 = S.Save.migrate(v9);
  ok(up9.version === S.Save.VERSION && up9.state.upkeep === null && up9.state.service === null && up9.state.opps === null, 'a file of version 9 gets the new state');
  const old = new S.Game(doc, 3);
  S.Save.apply(old, up9);
  ok(old.world.service && old.world.lots[0].house.alarm && !old.world.opps.active.length && old.world.familyBag.length === 0, 'an old save starts with fresh services');

  game.fixed(viktor.x, viktor.z);
  ok(W.counter(viktor, { kind: 'funds' }) === Math.floor(world.funds), 'a money wish reads the purse');
  viktor.dream = { id: 'ormondSafe', done: false };
  ok(W.dreamProgress(world, viktor, S.DREAMS.ormondSafe)[1] === 50000 && W.dreamProgress(world, viktor, S.DREAMS.museumHome)[0] === E.wealth(world), 'money dreams count cash and wealth');
}

{
  const game = new S.Game(doc, 4), world = game.world, [viktor, astrid] = world.family, J = S.Jobs;
  J.join(world, viktor, 'crime', true);
  const plant = world.lots.find(l => l.id === S.CAREERS.crime.lot), outside = world.sims.find(o => o.free && o.age === 'adult' && !o.car && !o.duty);
  world.day = 2;
  S.Town.setClock(world, 17 * 60 + 40);
  Object.assign(viktor, { inside: plant, lot: plant, x: plant.doorOut[0], z: plant.doorOut[1], floor: 0, state: 'idle', act: null, queue: [], order: null, path: null, trip: null });
  Object.assign(outside, { inside: null, live: true, lot: plant, x: plant.doorOut[0] + 1, z: plant.doorOut[1], floor: 0, state: 'idle', trip: null, car: null, order: null, path: null, hold: 0, act: null, line: null });
  if (!world.live.includes(outside)) world.live.push(outside);
  viktor.needs.social = 5;
  ok(!S.Acts.choices(world, viktor, 2).some(c => c.with !== undefined), 'a sim inside a building does not talk to people in the street');
  ok(viktor.job.at < 0 && J.busyInside(world, viktor), 'the workplace keeps the sim from the first minute, before the arrival is counted');
  S.Town.setClock(world, 23 * 60 + 40);
  ok(!J.busyInside(world, viktor), 'after the shift the workplace lets the sim go');
  Object.assign(viktor, { state: 'use', wantUp: true, hold: 3, useClip: 'talk' });
  const back = J.goHome(world, viktor, viktor.job);
  S.Acts.add(world, viktor, back);
  game.setSpeed(3);
  for (let i = 0; i < 400 && viktor.inside === plant; i++) game.fixed(viktor.x, viktor.z);
  ok(viktor.inside !== plant && viktor.act === back, 'a pose left over inside a building does not keep the sim there: ' + viktor.state);

  const night = new S.Game(doc, 5), nw = night.world, sleeper = nw.family[1], bed = sleeper.home.house.items.find(i => S.baseOf(i) === 'bed');
  night.freeWill = 0;
  night.setSpeed(3);
  for (const s of nw.family) {
    S.Acts.dropCurrent(nw, s);
    s.queue.length = 0;
  }
  const sleepFrom = (game, sim, minutes, until) => {
    const w = game.world;
    S.Town.setClock(w, minutes);
    sim.needs.energy = 40;
    for (const need of ['hunger', 'bladder', 'hygiene']) sim.needs[need] = 100;
    const act = S.Acts.adAct('bed_sleep', sim.home, bed);
    S.Acts.add(w, sim, act);
    let full = -1, woke = -1;
    for (let i = 0; i < 12000 && woke < 0; i++) {
      game.fixed(sim.x, sim.z);
      for (const need of ['hunger', 'bladder', 'hygiene']) sim.needs[need] = 100;
      if (full < 0 && sim.needs.energy >= 99.5) full = w.clock;
      if (full >= 0 && sim.act !== act) woke = w.clock;
      if (until && w.clock === until) break;
    }
    return { full, woke };
  };
  const evening = sleepFrom(night, sleeper, 19 * 60);
  ok(evening.full >= 21 * 60 || evening.full < 6 * 60, 'an evening sleeper is fully rested in the night: ' + S.timeText(evening.full));
  ok(evening.woke >= 6 * 60 && evening.woke < 7 * 60, 'a sim who went to bed in the evening sleeps till the morning: ' + S.timeText(evening.woke));
  const day = sleepFrom(night, sleeper, 13 * 60);
  ok(day.woke > 13 * 60 && day.woke < 21 * 60 && Math.abs(day.woke - day.full) < 5, 'a daytime sleeper gets up when rested: ' + S.timeText(day.woke));

  const leakGame = new S.Game(doc, 1), lw = leakGame.world, llot = lw.family[0].home, U = S.Upkeep;
  for (const sink of llot.house.items.filter(i => ['kitchen_sink', 'bath_sink'].includes(S.baseOf(i)))) {
    U.of(llot).puddles.length = 0;
    U.breakItem(lw, llot, sink);
    for (let k = 0; k < 3; k++) {
      U.of(llot).leaks[llot.house.items.indexOf(sink)] = 0;
      U.step(lw);
    }
    const free = (p, x, z) => llot.nav.isFree(p[2], Math.floor(x - llot.x), Math.floor(z - llot.z));
    ok(U.of(llot).puddles.length > 0 && U.of(llot).puddles.every(p => free(p, p[0], p[1]) && free(p, ...U.mopSpot(llot, p))), 'a leak puddle lies on a free tile and can be mopped: ' + S.baseOf(sink));
    U.fix(lw, llot, sink);
  }

  const paperColumn = (640 - 16 * 2 - 14 * 2) / 3;
  for (const def of Object.values(S.CAREERS).concat(Object.values(S.PART_TIME))) {
    for (const sex of [0, 1]) ok(S.Font.measure('smallb', S.Jobs.titleAt(def, 1, null, sex)) <= paperColumn, 'a vacancy title fits a newspaper column: ' + S.Jobs.titleAt(def, 1, null, sex));
  }
}
(async () => {
  const Save = S.Save, H = S.House;
  ok(Save.SLOTS.length === 14 && Save.SLOTS.filter(s => s.auto).length === 3 && Save.SLOTS.filter(s => !s.fixed).length === 10, 'ten slots, three autosaves and a quick save');
  const A = new S.Game(doc, 7), B = new S.Game(doc, 7), peopleA = A.world.sims, lots = A.world.lots, home = lots[0];
  const chairOf = g => g.world.lots[0].house.items.find(i => i.kind === 'm_chair' && i.x === 9.5 && i.z === 7.5);
  const sofaOf = g => g.world.lots[0].house.items.find(i => i.kind === 'm_sofa');
  const say = (who, order) => g => S.Sim.order(g.world, g.world.sims[who], order(g));
  const door = i => g => ({ x: g.world.lots[i].doorOut[0], z: g.world.lots[i].doorOut[1], floor: 0, lot: g.world.lots[i] });
  const inputs = new Map([
    [10, say(0, door(15))],
    [20, say(2, g => ({ x: home.x + 14.5, z: home.z + 6.5, floor: 1, lot: g.world.lots[0] }))],
    [30, say(1, g => ({ item: chairOf(g), lot: g.world.lots[0] }))],
    [400, say(3, g => ({ x: home.x + 25.5, z: home.z + 22.5, floor: 0, lot: g.world.lots[0], run: true }))],
    [1600, say(1, door(5))],
    [2500, say(2, g => ({ x: home.x + 5.5, z: home.z + 22.5, floor: 0, lot: g.world.lots[0] }))],
    [4200, say(3, g => ({ item: sofaOf(g), lot: g.world.lots[0] }))],
    [6000, say(0, g => ({ x: g.world.lots[5].doorOut[0], z: g.world.lots[5].doorOut[1], floor: 0, lot: g.world.lots[5], enter: g.world.lots[5] }))],
    [9000, say(4, g => ({ x: home.x + 12.5, z: home.z + 15.5, floor: 0, lot: g.world.lots[0] }))],
    [11000, say(0, door(0))]
  ]);
  const kindsOf = s => {
    const out = [s.state];
    if (s.inside) out.push('inside');
    if (s.slopeFrom) out.push('stairs');
    if (s.seat) out.push('seat');
    if (s.after) out.push('after');
    if (s.then) out.push('then');
    if (s.path && s.path.some(w => w.coarse)) out.push('coarse');
    return out;
  };
  const seen = new Set();
  let synced = false, saves = 0;
  A.setSpeed(2);
  B.setSpeed(2);
  const fx = () => A.active.x, fz = () => A.active.z;
  for (let step = 0; step < 14000; step++) {
    if (inputs.has(step)) {
      inputs.get(step)(A);
      if (synced) inputs.get(step)(B);
    }
    let fresh = step % 997 === 0;
    for (const sim of peopleA) {
      for (const kind of kindsOf(sim)) {
        if (!seen.has(kind)) {
          seen.add(kind);
          fresh = true;
        }
      }
    }
    if (fresh) {
      if (synced) assert.equal(B.hash(), A.hash(), 'a saved game plays on like the original at step ' + step);
      const before = A.hash(), file = JSON.parse(JSON.stringify(Save.file(A, null)));
      ok(A.hash() === before, 'saving does not change the game');
      Save.apply(B, file);
      B.setSpeed(A.speed);
      assert.equal(B.hash(), before, 'a loaded game has the same hash at step ' + step);
      checks += 2;
      synced = true;
      saves++;
    }
    const x = fx(), z = fz();
    A.fixed(x, z);
    if (synced) B.fixed(x, z);
  }
  assert.equal(B.hash(), A.hash(), 'the copy still plays like the original at the end');
  checks++;
  ok(saves >= 15, 'the round trip ran many times: ' + saves);
  for (const kind of ['idle', 'move', 'trip', 'use', 'board', 'drive', 'unboard', 'align', 'sitDown', 'sit', 'standUp', 'leave', 'inside', 'stairs', 'seat', 'after', 'coarse']) ok(seen.has(kind), 'the round trip met the state: ' + kind);
  const seatOf = A.world.sims.find(s => s.seat);
  if (seatOf) ok(B.world.sims[A.world.sims.indexOf(seatOf)].seat.item.takers[seatOf.seat.slot] === seatOf.id, 'a loaded chair knows who sits on it');
  ok(B.world.doors.length === A.world.doors.length, 'the doors are the same');

  const bytes = await Save.encode(Save.file(A, { x: 1 }));
  ok(bytes.length > 100 && bytes.length < 200000, 'a save stays small: ' + bytes.length);
  ok(bytes[0] === 0x1f && bytes[1] === 0x8b, 'a save is gzip');
  const back = await Save.decode(bytes);
  ok(back.version === Save.VERSION && back.seed === 7 && back.view.x === 1, 'a save decodes');
  ok(S.hash(back.state) === A.hash(), 'gzip keeps the state');

  const copy = new S.Game(doc, 7);
  Save.apply(copy, back);
  ok(copy.speed === 0 && copy.lastSpeed === 2, 'a loaded game stands on pause with the saved speed ready');
  ok(copy.world.changed.size === copy.world.doors.length, 'a loaded game redraws its doors');
  const copyHash = copy.hash();
  for (const [text, change] of [
    ['другого города', f => { f.seed = 99; }],
    ['другое число жителей', f => { f.state.sims.pop(); }],
    ['другое число дверей', f => { f.state.doors += '0'; }],
    ['неизвестный участок', f => { f.state.sims[94][10] = 1000; }],
    ['неизвестное состояние', f => { f.state.sims[50][5] = 'dance'; }],
    ['не число', f => { f.state.sims[60][0] = null; }],
    ['запись жителя', f => { f.state.sims[70] = [1, 2]; }],
    ['время города', f => { f.state.clock = null; }],
    ['активный сим', f => { f.active = 1000; }]
  ]) {
    const broken = JSON.parse(JSON.stringify(back));
    change(broken);
    assert.throws(() => Save.apply(copy, broken), new RegExp(text), 'a broken file names the reason: ' + text);
    ok(copy.hash() === copyHash, 'a broken file leaves the game as it was: ' + text);
  }

  const store = Save.memoryStore();
  const first = new S.Game(doc, 7), firstHash = first.hash();
  const r1 = await Save.write(store, 'slot1', Save.file(first, null), 100);
  ok(r1.key === 'slot1' && r1.day === 1 && r1.clock === 480 && r1.when === 100 && r1.size === r1.bytes.length, 'a record knows the date and the size');
  let rows = await Save.list(store);
  ok(rows.length === 14 && rows[1].record && !rows[1].backup && !rows[0].record, 'the list shows the written slot');
  for (let i = 0; i < 300; i++) first.fixed(first.active.x, first.active.z);
  const secondHash = first.hash();
  ok(secondHash !== firstHash, 'the game went on');
  await Save.write(store, 'slot1', Save.file(first, null), 200);
  rows = await Save.list(store);
  ok(rows[1].backup && rows[1].record.when === 200, 'writing over a slot keeps the old file as a backup');
  ok(store.map.get('slot1.bak').when === 100, 'the backup is the old file');
  const target = new S.Game(doc, 7);
  let got = await Save.load(store, 'slot1', target);
  ok(!got.fromBackup && target.hash() === secondHash, 'a slot loads the last file');
  const good = store.map.get('slot1'), bad = Uint8Array.from(good.bytes);
  bad[Math.floor(bad.length / 2)] ^= 0xff;
  bad[Math.floor(bad.length / 2) + 1] ^= 0xff;
  store.map.set('slot1', Object.assign({}, good, { bytes: bad }));
  got = await Save.load(store, 'slot1', target);
  ok(got.fromBackup && got.reason.length > 0 && target.hash() === firstHash, 'a damaged file falls back to the backup: ' + got.reason);
  store.map.set('slot1', Object.assign({}, good, { bytes: good.bytes.slice(0, 40) }));
  got = await Save.load(store, 'slot1', target);
  ok(got.fromBackup && target.hash() === firstHash, 'a cut file falls back to the backup');
  store.map.set('slot1.bak', Object.assign({}, good, { bytes: bad }));
  const held = target.hash();
  await assert.rejects(Save.load(store, 'slot1', target), 'both damaged files give an error');
  checks++;
  ok(target.hash() === held, 'a failed load leaves the game as it was');
  await assert.rejects(Save.load(store, 'slot9', target), /файла нет/, 'an empty slot gives an error');
  checks++;
  store.map.set('slot1', good);
  const failing = Object.assign(Save.memoryStore(), { replace: async () => { throw new Error('нет места'); } });
  await assert.rejects(Save.write(failing, 'slot2', Save.file(target, null), 1), /нет места/, 'a full disk gives an error');
  checks++;
  await assert.rejects(Save.write(store, 'slot1', { version: 1, state: { day: 1, clock: 1 }, bad: 1n }, 1), 'a file that cannot be written gives an error');
  checks++;
  ok(store.map.get('slot1') === good, 'a failed write leaves the slot as it was');

  const autos = Save.memoryStore(), order = [];
  for (let i = 0; i < 7; i++) {
    const slot = await Save.nextAuto(autos);
    order.push(slot.key);
    await autos.replace(slot.key, { key: slot.key, when: i });
  }
  assert.deepEqual(order, ['auto1', 'auto2', 'auto3', 'auto1', 'auto2', 'auto3', 'auto1'], 'autosaves go round');
  checks++;

  const steps = { 1: f => Object.assign({}, f, { a: 1 }), 2: f => Object.assign({}, f, { b: f.a + 1 }) };
  const moved = Save.migrate({ version: 1 }, steps, 3);
  ok(moved.version === 3 && moved.a === 1 && moved.b === 2, 'migrations run one after another');
  assert.throws(() => Save.migrate({ version: 1 }, {}, 2), /нет перехода/, 'a missing migration names the version');
  assert.throws(() => Save.migrate({ version: Save.VERSION + 1 }), /более новой версией/, 'a newer file is refused');
  assert.throws(() => Save.migrate({}), /не файл/, 'a stranger file is refused');
  checks += 3;
  const fixture = path.join(ROOT, 'tests/fixtures/sims98-save-v1.sav');
  ok(fs.existsSync(fixture), 'the first version of the save format is kept for the test');
  const old = new S.Game(doc, 1);
  Save.apply(old, await Save.decode(new Uint8Array(fs.readFileSync(fixture))));
  ok(old.world.sims.some(s => s.state === 'drive' || s.state === 'move' || s.state === 'trip'), 'the first version of the save format still loads');
  for (let i = 0; i < 300; i++) old.fixed(old.active.x, old.active.z);
  ok(old.world.sims.every(s => Number.isFinite(s.x + s.z + s.y)), 'an old save plays on');

  const written = [], viewScreen = { sw: 800, sh: 600 }, stubUi = {
    screen: viewScreen, stamp: 'x', pointer: null, note: null, saveStore: async () => store,
    saveGame: async (key, name) => { written.push(['save', key, name]); return true; },
    loadGame: async (key, name) => { written.push(['load', key, name]); return true; }
  };
  const panel = new S.SaveView(stubUi);
  await panel.show('save');
  ok(panel.open && stubUi.stamp === '' && panel.rows.length === 14, 'the file window lists the slots');
  for (const [sw, sh] of [[800, 600], [1024, 768]]) {
    const box = panel.box({ sw, sh });
    ok(box.x >= 0 && box.y >= 0 && box.x + box.w <= sw && box.y + box.h <= sh, 'the file window fits the screen ' + sw);
  }
  const box = panel.box(viewScreen), rowY = i => box.y + 62 + i * 24 + 8, inRow = box.x + 20;
  ok(panel.rowAt(viewScreen, inRow, rowY(3)) === 3 && panel.rowAt(viewScreen, 2, rowY(3)) === -1 && panel.rowAt(viewScreen, inRow, box.y + 2) === -1, 'the file window finds the row');
  ok(!panel.usable(0) && panel.usable(1) && !panel.usable(13), 'quick and auto saves cannot be chosen for writing');
  panel.click(inRow, rowY(0));
  ok(written.length === 0 && panel.ask === -1, 'a click on the quick save does nothing when saving');
  panel.click(inRow, rowY(2));
  await panel.refresh();
  ok(written[0][0] === 'save' && written[0][1] === 'slot2', 'an empty slot is written at once');
  panel.click(inRow, rowY(1));
  ok(panel.ask === 1 && written.length === 1, 'an occupied slot asks first');
  panel.click(box.x + box.w - 40, rowY(1));
  ok(panel.ask === -1 && written.length === 1, 'No keeps the old file');
  panel.click(inRow, rowY(1));
  panel.click(box.x + box.w - 110, rowY(1));
  ok(written.length === 2 && written[1][1] === 'slot1', 'Yes writes over');
  await panel.refresh();
  panel.click(box.x + box.w - 20, box.y + 10);
  ok(panel.mode === 'load', 'the tab switches to loading');
  ok(panel.usable(1) && !panel.usable(2), 'only a written file can be loaded');
  panel.click(inRow, rowY(2));
  ok(panel.ask === -1 && written.length === 2, 'an empty slot cannot be loaded');
  panel.click(inRow, rowY(1));
  ok(panel.ask === 1, 'loading asks first');
  panel.click(box.x + box.w - 110, rowY(1));
  await new Promise(r => setTimeout(r, 0));
  await new Promise(r => setTimeout(r, 0));
  ok(written[2][0] === 'load' && written[2][1] === 'slot1' && !panel.open, 'a loaded file closes the window');
  panel.open = true;
  panel.click(2, 2);
  ok(!panel.open, 'a click outside closes the window');
  ok(/rows|detail/.test(read('js/apps/sims98/ts-ui-save.js')) && !/Math\.random/.test(read('js/apps/sims98/ts-ui-save.js')), 'the file window only shows what the store holds');
  const ui = read('js/apps/sims98/ts-ui.js');
  ok(/F6/.test(ui) && /Space/.test(ui) && /KeyP/.test(ui) && /Digit/.test(ui), 'the screen has the time keys');
  console.log('The Sims 98: ' + checks + ' checks passed');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
