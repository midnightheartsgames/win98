const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const DIR = path.join(__dirname, '..', 'js/apps/tf98');
for (const f of ['tf-core', 'tf-data', 'tf-weapons', 'tf-build', 'tf-world', 'tf-nav', 'tf-maps-yard', 'tf-maps-arena', 'tf-maps-2fort', 'tf-game', 'tf-modes', 'tf-ai']) require(path.join(DIR, f + '.js'));
const T = globalThis.Tf98;

const args = process.argv.slice(3);
const opt = (name, fallback) => {
  const hit = args.find(a => a.startsWith('--' + name + '='));
  return hit ? hit.split('=')[1] : fallback;
};
const firstWord = fallback => args.find(a => !a.startsWith('--')) || fallback;
const MODES = { '2fort': 'ctf' };
const RULES = { arena: { respawn: 5 }, '2fort': { wave: 10 } };

T.MAPS.duelbox = {
  name: 'Поле',
  build(B) {
    B.ground(-60, -30, 60, 30, 0, [], 'ground', { t: 8 });
    B.spawn('hot', -40, 0, Math.PI / 2);
    B.spawn('cold', 40, 0, -Math.PI / 2);
    B.roam(0, 0);
    B.bounds(-60, -30, 60, 30);
    B.killY(-30);
  }
};

function newMatch(map, level, seed, size) {
  const levels = { hot: opt('hot', level), cold: opt('cold', level) };
  return new T.Game({ map, mode: MODES[map] || null, visual: false, spectate: true, bots: { size, levels }, seed, rules: Object.assign({}, RULES[map] || { respawn: 5 }) });
}

function perf() {
  const map = firstWord('arena');
  const size = Number(opt('size', 12)), level = opt('level', 'worker'), seconds = Number(opt('seconds', 60));
  const started = Date.now();
  const g = newMatch(map, level, Number(opt('seed', 1)), size);
  const built = Date.now() - started;
  let total = 0, worst = 0;
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) {
    const t0 = process.hrtime.bigint();
    g.step(T.blankInput());
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    total += ms;
    if (ms > worst) worst = ms;
  }
  const mem = process.memoryUsage().heapUsed / 1048576;
  console.log(JSON.stringify({ map, bots: size * 2, level, seconds, buildMs: built, nodes: g.nav.n, avgMs: +(total / steps).toFixed(3), worstMs: +worst.toFixed(2), heapMb: +mem.toFixed(1), frags: g.score, stuck: g.aiStuck || 0 }));
}

function playOut(g, seconds, each) {
  const limit = seconds * 60;
  let i = 0;
  for (; i < limit; i++) {
    g.step(T.blankInput());
    if (each) each(i);
    if (g.mode && g.mode.phase === 'over') break;
  }
  return i / 60;
}

function match() {
  const map = firstWord('arena');
  const seeds = Number(opt('seeds', 1)), size = Number(opt('size', 12)), level = opt('level', 'worker');
  const limit = Number(opt('seconds', MODES[map] ? 1200 : 120));
  const wins = { hot: 0, cold: 0, none: 0 };
  const byMerc = {};
  for (const id of T.MERC_ORDER) byMerc[id] = { kills: 0, deaths: 0 };
  let timeSum = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const g = newMatch(map, level, seed * 101 + 7, size);
    const log = [];
    const time = playOut(g, limit, () => {
      for (const ev of g.events) {
        if (ev.type === 'kill') {
          byMerc[g.heroes[ev.by].merc].kills++;
          byMerc[g.heroes[ev.victim].merc].deaths++;
        } else if (ev.type === 'flag') {
          log.push(ev.what);
        }
      }
    });
    timeSum += time;
    const m = g.mode;
    if (m) {
      wins[m.winner || 'none']++;
      const seen = {};
      for (const w of log) seen[w] = (seen[w] || 0) + 1;
      console.log('seed', seed, 'winner', m.winner, 'phase', m.phase, 'captures', JSON.stringify(m.captures), 'time', Math.round(time), 'flags', JSON.stringify(seen), 'frags', JSON.stringify(g.score), 'stuck', g.aiStuck);
    } else {
      console.log('seed', seed, 'frags', JSON.stringify(g.score), 'stuck', g.aiStuck);
    }
  }
  console.log('wins', JSON.stringify(wins), 'average time', Math.round(timeSum / seeds));
  console.log(T.MERC_ORDER.map(id => id + ' ' + byMerc[id].kills + '/' + byMerc[id].deaths).join('  '));
}

function crcTable() {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
}
const CRC = crcTable();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4), crc = Buffer.alloc(4), body = Buffer.concat([Buffer.from(type), data]);
  len.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePng(file, w, h, rgb) {
  const head = Buffer.alloc(13);
  head.writeUInt32BE(w, 0);
  head.writeUInt32BE(h, 4);
  head[8] = 8;
  head[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', head), pngChunk('IDAT', zlib.deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))]));
}

function heat() {
  const map = firstWord('2fort');
  const seeds = Number(opt('seeds', 2)), level = opt('level', 'worker'), seconds = Number(opt('seconds', 600));
  const out = opt('out', path.join(process.cwd(), 'tf98-heat-' + map + '.png'));
  const splits = [2, -1];
  const layerOf = y => (y >= splits[0] ? 0 : y >= splits[1] ? 1 : 2);
  const probe = newMatch(map, level, 1, 12);
  const nav = probe.nav, W = nav.nx, H = nav.nz, cells = W * H;
  const stay = [new Float64Array(cells), new Float64Array(cells), new Float64Array(cells)];
  const dead = [new Float64Array(cells), new Float64Array(cells), new Float64Array(cells)];
  const cellOf = (x, z) => T.clamp(Math.floor(z - nav.z0), 0, H - 1) * W + T.clamp(Math.floor(x - nav.x0), 0, W - 1);
  for (let seed = 1; seed <= seeds; seed++) {
    const g = newMatch(map, level, seed * 211 + 3, 12);
    playOut(g, seconds, i => {
      if (i % 15 === 0) for (const h of g.heroes) if (h.alive) stay[layerOf(h.pos.y)][cellOf(h.pos.x, h.pos.z)]++;
      for (const ev of g.events) {
        if (ev.type !== 'death') continue;
        const h = g.heroes[ev.hero];
        dead[layerOf(h.pos.y)][cellOf(h.pos.x, h.pos.z)]++;
      }
    });
  }
  const scale = 5, gap = 8;
  const cols = 2, rows = 3;
  const iw = cols * W * scale + (cols + 1) * gap, ih = rows * H * scale + (rows + 1) * gap;
  const img = Buffer.alloc(iw * ih * 3, 24);
  const floorOf = [new Uint8Array(cells), new Uint8Array(cells), new Uint8Array(cells)];
  const mainComp = nav.comp[nav.nearest(probe.map.flags[0].x, probe.map.flags[0].y - 0.9, probe.map.flags[0].z, 3)];
  for (let k = 0; k < nav.n; k++) if (nav.comp[k] === mainComp) floorOf[layerOf(nav.y[k])][nav.col[k]] = nav.wet[k] ? 2 : 1;
  const paint = (px, py, r, g, b) => {
    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        const at = ((py + dy) * iw + px + dx) * 3;
        img[at] = r; img[at + 1] = g; img[at + 2] = b;
      }
    }
  };
  [stay, dead].forEach((sets, col) => {
    sets.forEach((set, row) => {
      let peak = 1;
      for (let i = 0; i < cells; i++) if (set[i] > peak) peak = set[i];
      const ox = gap + col * (W * scale + gap), oy = gap + row * (H * scale + gap);
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
          const c = j * W + i, px = ox + i * scale, py = oy + (H - 1 - j) * scale;
          const v = Math.sqrt(set[c] / peak), base = floorOf[row][c];
          if (v > 0) paint(px, py, Math.round(70 + 185 * v), Math.round(70 + 110 * (1 - v)), Math.round(50 * (1 - v)));
          else if (base === 1) paint(px, py, 66, 66, 72);
          else if (base === 2) paint(px, py, 40, 62, 86);
        }
      }
    });
  });
  writePng(out, iw, ih, img);
  console.log('saved', out, 'columns: stay, deaths; rows: upper floor, ground, below');
}

function duelOnce(a, b, dist, level, seed) {
  const g = new T.Game({ map: 'duelbox', visual: false, spectate: true, seed, rules: { respawn: 0, noRespawn: true } });
  const left = g.addBot(a, 'hot', level), right = g.addBot(b, 'cold', level);
  left.pos.x = -dist / 2; right.pos.x = dist / 2;
  left.prev.x = left.pos.x; right.prev.x = right.pos.x;
  left.yaw = Math.PI / 2; right.yaw = -Math.PI / 2;
  for (let i = 0; i < 60 * 45; i++) {
    g.step(T.blankInput());
    if (!left.alive || !right.alive) break;
  }
  if (left.alive && !right.alive) return 1;
  if (right.alive && !left.alive) return 0;
  return 0.5;
}

function duel() {
  const n = Number(opt('n', 67)), level = opt('level', 'worker');
  const dists = opt('dist', '5,15,30').split(',').map(Number);
  const list = opt('mercs', T.MERC_ORDER.join(',')).split(',');
  console.log('win % of the row against the column, ' + level + ', ' + n + ' fights per cell, distances ' + dists.join(' '));
  console.log(['', ...list].map(s => s.padEnd(10)).join(''));
  for (const a of list) {
    const row = [a.padEnd(10)];
    for (const b of list) {
      let wins = 0, fights = 0;
      for (const d of dists) {
        for (let s = 1; s <= n; s++) { wins += duelOnce(a, b, d, level, s * 31 + d); fights++; }
      }
      row.push(String(Math.round(wins / fights * 100)).padEnd(10));
    }
    console.log(row.join(''));
  }
}

const command = process.argv[2];
if (command === 'perf') perf();
else if (command === 'match') match();
else if (command === 'heat') heat();
else if (command === 'duel') duel();
else console.log('usage: node tools/tf98-bot.cjs perf [map] | match [map] [--seeds=4] [--level=worker] [--hot=level] [--cold=level] | heat [map] [--out=file.png] | duel [--n=67] [--mercs=a,b] [--dist=5,15,30]');
