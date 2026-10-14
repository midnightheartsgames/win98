const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GAME = path.join(ROOT, 'content', 'Fallout');
const OUT = path.join(ROOT, 'js', 'apps', 'fallout');
const RU = path.join(ROOT, 'content', 'fallout-ru');

function looseFiles() {
  const out = {};
  const walk = rel => {
    for (const ent of fs.readdirSync(path.join(GAME, 'DATA', rel), { withFileTypes: true })) {
      const next = rel ? rel + '/' + ent.name : ent.name;
      if (ent.isDirectory()) {
        if (!rel && ent.name.toUpperCase() === 'SAVEGAME') continue;
        walk(next);
      } else {
        out[next.split('/').join('\\').toUpperCase()] = next;
      }
    }
  };
  walk('');
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a < b ? -1 : 1));
}

function russianKey(rel) {
  const msg = /^TEXT\/(DIALOG|GAME)\/([^/]+)\.txt$/.exec(rel);
  if (msg) return 'TEXT\\ENGLISH\\' + msg[1] + '\\' + msg[2].toUpperCase() + '.MSG';
  if (rel.startsWith('TEXT/')) return 'TEXT\\ENGLISH\\' + rel.slice(5).split('/').join('\\').toUpperCase();
  if (rel.toUpperCase() === 'BADWORDS.TXT') return 'DATA\\BADWORDS.TXT';
  return rel.split('/').join('\\').toUpperCase();
}

function russianFiles() {
  const out = {};
  const walk = rel => {
    const dir = path.join(RU, rel);
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const next = rel ? rel + '/' + ent.name : ent.name;
      if (ent.isDirectory()) walk(next);
      else if (!/\.md$/i.test(ent.name)) out[russianKey(next)] = next;
    }
  };
  walk('');
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a < b ? -1 : 1));
}

class Exe {
  constructor(file) {
    this.b = fs.readFileSync(file);
    const pe = this.b.readUInt32LE(0x3c);
    const count = this.b.readUInt16LE(pe + 6);
    const opt = this.b.readUInt16LE(pe + 20);
    this.image = this.b.readUInt32LE(pe + 24 + 28);
    this.sections = [];
    for (let i = 0, p = pe + 24 + opt; i < count; i++, p += 40) {
      this.sections.push({
        name: this.b.toString('latin1', p, p + 8).replace(/\0+$/, ''),
        va: this.b.readUInt32LE(p + 12),
        raw: this.b.readUInt32LE(p + 20),
        size: this.b.readUInt32LE(p + 16)
      });
    }
  }

  fileOf(va) {
    const rva = va - this.image;
    for (const s of this.sections) if (s.size && rva >= s.va && rva < s.va + s.size) return s.raw + rva - s.va;
    return -1;
  }

  str(off) {
    let e = off;
    while (this.b[e] && e - off < 256) e++;
    return this.b.toString('latin1', off, e);
  }

  ptrStr(off) {
    const va = this.b.readUInt32LE(off);
    if (!va) return null;
    const f = this.fileOf(va);
    if (f < 0) throw new Error('pointer out of image at 0x' + off.toString(16));
    return this.str(f);
  }

  ptrStrs(off, count) {
    const out = [];
    for (let i = 0; i < count; i++) out.push(this.ptrStr(off + i * 4));
    return out;
  }

  rgb(off, count) {
    const out = [];
    for (let i = 0; i < count; i++) out.push([this.b[off + i * 3], this.b[off + i * 3 + 1], this.b[off + i * 3 + 2]]);
    return out;
  }
}

function expect(cond, what) {
  if (!cond) throw new Error('FALLOUTW.EXE does not match version 1.2: ' + what);
}

function exeTables() {
  const exe = new Exe(path.join(GAME, 'FALLOUTW.EXE'));
  const C = 0xE5C40;
  expect(exe.b.slice(C, C + 6).equals(Buffer.from([0, 108, 0, 11, 115, 7])), 'palette cycle table');
  const cycles = {
    slime: exe.rgb(C, 4),
    shore: exe.rgb(C + 12, 6),
    fireSlow: exe.rgb(C + 30, 5),
    fireFast: exe.rgb(C + 45, 5),
    monitors: exe.rgb(C + 60, 5)
  };
  const movies = exe.ptrStrs(0xE61FC, 14).map(s => s.replace(/\.mve$/i, '').toUpperCase());
  expect(movies[0] === 'IPLOGO' && movies[2] === 'INTRO' && movies[13] === 'RAEKILLS', 'movie table');
  const E = 0x11A0C0;
  const enc = exe.ptrStrs(E, 18).map(s => s && s.replace(/\.map$/i, '').toUpperCase());
  expect(enc[0] === 'DESERT1' && enc[12] === 'FOOT' && enc[17] === 'COLATRUK', 'encounter map table');
  const row = i => enc.slice(i * 3, i * 3 + 3).filter(Boolean);
  const mapNames = fs.readFileSync(path.join(GAME, 'DATA', 'TEXT', 'ENGLISH', 'GAME', 'MAP.MSG'), 'latin1');
  const mapCount = [...mapNames.matchAll(/\{(\d+)\}\{[^}]*\}\{[^}]*\.MAP\}/gi)].length;
  const mapMusic = exe.ptrStrs(E + 18 * 4, mapCount).map(s => s && s.toUpperCase());
  expect(mapMusic.every(s => /^[0-9A-Z]+$/.test(s || '')) && mapMusic[6] === '06VAULT' && mapMusic[35] === '06VAULT', 'map music table');
  const Q = 0xE8028;
  const quests = [];
  for (let city = 0; city < 12; city++) {
    for (let k = 0; k < 9; k++) {
      const gvar = exe.b.readInt16LE(Q + (city * 9 + k) * 2);
      if (gvar) quests.push([700 + city * 10, 701 + city * 10 + k, gvar]);
    }
  }
  expect(quests.length === 33 && quests[0][2] === 238 && quests[3][2] === 101 && quests[32][2] === 128, 'quest table');
  const holodisks = [];
  for (let i = 0; i < 18; i++) holodisks.push(exe.b.readInt16LE(0x76E5C + i * 2));
  expect(holodisks[0] === 162 && holodisks[2] === 161 && holodisks[17] === 311, 'holodisk table');
  const holidays = [];
  for (let i = 0; i < 8; i++) holidays.push([0, 2, 4].map(k => exe.b.readInt16LE(0xE8100 + i * 6 + k)));
  expect(holidays[0].join() === '1,1,100' && holidays[7].join() === '12,25,107', 'holiday table');
  const automap = [];
  for (let i = 0; i < mapCount; i++) {
    const elevs = [0, 1, 2].filter(e => exe.b.readInt32LE(0xA820 + (i * 3 + e) * 4) === 0);
    if (elevs.length) automap.push(i);
  }
  expect(automap.length === 42 && automap[0] === 3 && automap[41] === 55 && !automap.includes(19), 'automap table');
  const ints = (va, n) => {
    const f = exe.fileOf(va);
    const out = [];
    for (let i = 0; i < n; i++) out.push(exe.b.readInt32LE(f + i * 4));
    return out;
  };
  const rows = (list, size) => {
    const out = [];
    for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    return out;
  };
  const hitLocations = ints(0x4FEC90, 9);
  expect(hitLocations.join() === '-40,-30,-30,0,-20,-20,-60,-30,0', 'called shot penalties');
  const crits = rows(rows(rows(ints(0x4FECB4, 15 * 9 * 6 * 7), 7), 6), 9);
  expect(crits[0][0][0].join() === '4,0,-1,0,0,5001,5000' && crits[14][8][5][5] > 6000, 'critical hit table');
  const playerCrits = rows(rows(ints(0x50454C, 9 * 6 * 7), 7), 6);
  expect(playerCrits[0][0][5] === 6500, 'player critical hit table');
  const critFails = rows(ints(0x504B3C, 7 * 5), 5);
  expect(critFails[0].join() === '0,32768,32768,524290,2097152', 'critical miss table');
  const perks = rows(ints(0x506324, 64 * 15), 15).map(r => r.slice(2));
  expect(perks[2].slice(0, 4).join() === '3,3,11,2' && perks[54].join() === '-1,1,-1,0,-1,0,-2,0,-2,0,0,-3,0' && perks[62][3] === 30, 'perk table');
  const radiation = { enMod: ints(0x504D44, 6), stats: ints(0x504D5C, 8), penalty: rows(ints(0x504D7C, 6 * 8), 8) };
  expect(radiation.enMod.join() === '2,0,-2,-4,-6,-8' && radiation.penalty[5].join() === '-6,-5,-5,-5,-3,-6,-20,-10', 'radiation table');
  const addiction = { pids: ints(0x5057C0, 7), gvars: ints(0x5057A4, 7) };
  expect(addiction.pids.join() === '106,87,53,110,48,124,125' && addiction.gvars.join() === '189,190,191,192,193,194,194', 'addiction table');
  const stats = rows(ints(0x507ECC, 38 * 6), 6).map(r => [r[2], r[3], r[4], r[1]]);
  expect(stats[0].join() === '1,10,5,0' && stats[16].join() === '0,100,0,94' && stats[33].join() === '16,35,25,0' && stats[29][1] === 100, 'stat table');
  const skills = rows(ints(0x507AA4, 18 * 11), 11).map(r => [...r.slice(4, 11), r[3]]);
  expect(skills[3].join() === '65,1,5,0,1,0,0,31' && skills[17].join() === '5,1,2,4,1,100,0,45', 'skill table');
  const pcStats = rows(ints(0x508258, 5 * 6), 6).map(r => [r[3], r[4], r[5]]);
  expect(pcStats[1].join() === '1,2147483647,1' && pcStats[3].join() === '-20,20,0', 'pc stat table');
  const P = exe.fileOf(0x5079E4);
  const premades = [0, 1, 2].map(i => {
    const o = P + i * 44;
    return [exe.str(o).toUpperCase(), exe.b.readInt32LE(o + 20), exe.str(o + 24)];
  });
  expect(premades[0][0] === 'PREMADE\\COMBAT' && premades[2][1] === 203 && premades[1][2] === 'VID 208-206-49-229', 'premade table');
  const worldmap = worldmapTables(exe, ints, rows);
  const D = exe.fileOf(0x53A9C8);
  const mveDelta = [];
  for (let i = 0; i < 256; i++) mveDelta.push(exe.b.readInt16LE(D + i * 2));
  expect(mveDelta[43] === 43 && mveDelta[44] === 47 && mveDelta[120] === -29973 && mveDelta[128] === 1 && mveDelta[130] === 5481 && mveDelta[255] === -1, 'movie audio delta table');
  const places = exe.fileOf(0x473864);
  const mapPlaces = [];
  for (let i = 0; i < 66; i++) mapPlaces.push(exe.b.readInt16LE(places + i * 2));
  expect(mapPlaces[0] === 100 && mapPlaces[3] === 505 && mapPlaces[16] === 116 && mapPlaces[60] === 160 && mapPlaces[65] === 506, 'map place name table');
  return {
    cycles,
    movies,
    encounterMaps: { desert: row(0), mountain: row(1), city: row(2), ocean: row(3) },
    specialMaps: enc.slice(12),
    mapMusic,
    quests,
    holodisks,
    holidays,
    automap,
    hitLocations,
    crits,
    playerCrits,
    critFails,
    perks,
    radiation,
    addiction,
    stats,
    skills,
    pcStats,
    premades,
    worldmap,
    mveDelta,
    mapPlaces
  };
}

function worldmapTables(exe, ints, rows) {
  const at = va => exe.fileOf(va);
  const shorts = (va, n) => {
    const f = at(va);
    const out = [];
    for (let i = 0; i < n; i++) out.push(exe.b.readInt16LE(f + i * 2));
    return out;
  };
  const grid = va => [...exe.b.slice(at(va), at(va) + 28 * 30)].map(v => v.toString(16)).join('');
  const towns = rows(shorts(0x4A9E64, 24), 2);
  expect(towns[0].join() === '16,1' && towns[6].join() === '17,14' && towns[11].join() === '15,20', 'world map town tiles');
  const terrain = grid(0x4A948C);
  const frequency = grid(0x4A97D4);
  const regions = grid(0x4A9B1C);
  expect(terrain.slice(0, 28) === '1110000001111111111100000000' && frequency.slice(0, 28) === '3333333332211100001112223333' && regions.slice(0, 28) === 'bbbbbbbbb2222224442255500000', 'world map terrain tables');
  const coast = ints(0x4A93FC, 30);
  expect(coast.join() === '0,0,0,0,0,0,0,1,1,1,2,3,4,5,5,5,5,8,11,12,14,14,17,18,19,19,20,20,20,21', 'world map coast table');
  const townGvars = shorts(0x4A9E94, 12);
  expect(townGvars.join() === '67,70,68,71,69,72,73,74,78,76,75,77', 'town gvar table');
  const entranceGvars = rows(shorts(0x4A9EAC, 12 * 7), 7).map(r => r.slice(0, r.indexOf(0) < 0 ? 7 : r.indexOf(0)));
  expect(entranceGvars[0].join() === '558,559,560,561' && entranceGvars[6].length === 6 && entranceGvars[11].join() === '599,600', 'entrance gvar table');
  const spot = o => {
    let e = o + 6;
    while (exe.b[e] && e < o + 22) e++;
    return [exe.b.readInt16LE(o), exe.b.readInt16LE(o + 2), exe.b.readInt16LE(o + 4), exe.b.toString('latin1', o + 6, e).replace(/\.MAP$/i, '').toUpperCase()];
  };
  const hotspots = [];
  for (let t = 0; t < 15; t++) {
    const list = [];
    for (let k = 0; k < 7; k++) {
      const s = spot(at(0x539410) + t * 154 + k * 22);
      if (!s[0] || !s[1]) break;
      list.push(s);
    }
    hotspots.push(list);
  }
  expect(hotspots[0][0].join() === '202,303,0,V13ENT' && hotspots[6].length === 6 && hotspots[14][0][3] === 'BRODEAD', 'town hotspot table');
  const craters = [];
  for (let k = 0; k < 5; k++) {
    const s = spot(at(0x5398E0) + k * 22);
    if (s[3]) craters.push(s[3]);
  }
  expect(craters.join() === 'MBENT', 'crater map table');
  const specials = rows(shorts(0x4A9474, 12), 2);
  expect(specials.join(';') === '1,30;31,50;51,70;71,80;81,90;91,100', 'special encounter ranges');
  const mapTown = shorts(0x4A9F54, 66);
  expect(mapTown[3] === 5 && mapTown[35] === 0 && mapTown[55] === 7 && mapTown[62] === -1, 'map town table');
  const buttonY = shorts(0x4A93E4, 12);
  expect(buttonY.join() === '61,88,115,143,171,200,228,256,283,310,338,367', 'world map button table');
  const bf = at(0x508768);
  const blocked = [];
  for (let y = 0; y < 1500; y++) {
    const runs = [];
    let prev = 0;
    for (let x = 0; x < 1064; x++) {
      const bit = exe.b[bf + y * 133 + (x >> 3)] & (0x80 >> (x & 7)) ? 1 : 0;
      if (bit !== prev) {
        runs.push(x);
        prev = bit;
      }
    }
    if (prev) runs.push(1064);
    blocked.push(runs);
  }
  const blockedPixels = blocked.reduce((s, r) => s + r.reduce((a, x, i) => a + (i & 1 ? x : -x), 0), 0);
  expect(blocked[700].join() === '0,268' && blockedPixels === 660322, 'world map blocked bitmap');
  return { towns, terrain, frequency, regions, coast, townGvars, entranceGvars, hotspots, craters, specials, mapTown, buttonY, blocked };
}

function writeModule(name, body) {
  const src = '(function (FO) {\n  \'use strict\';\n\n' + body + '\n})(globalThis.FO = globalThis.FO || {});\n';
  fs.writeFileSync(path.join(OUT, name), src);
  console.log('wrote', path.relative(ROOT, path.join(OUT, name)), src.length, 'bytes');
}

function elevatorType(parsed) {
  const b = parsed.bytes;
  let p = parsed.code;
  const recent = [];
  while (p + 2 <= b.length) {
    const op = (b[p] << 8) | b[p + 1];
    if (op === 0x810B && recent.length >= 2 && recent[recent.length - 2] === 15) return recent[recent.length - 1];
    recent.push(op === 0xC001 ? ((b[p + 2] << 24) | (b[p + 3] << 16) | (b[p + 4] << 8) | b[p + 5]) : null);
    p += 2;
    if (op === 0xC001 || op === 0xA001 || op === 0x9001) p += 4;
  }
  return -1;
}

async function derivedTables(loose) {
  const FO = globalThis.FO = globalThis.FO || {};
  FO.LOOSE = loose;
  for (const m of ['fo-core', 'fo-dat', 'fo-formats', 'fo-hex', 'fo-proto', 'fo-map']) require(path.join(OUT, m + '.js'));
  const data = await FO.Data.open(FO.nodeSource(GAME), loose);
  const protos = new FO.Protos(data);
  await protos.init();
  const lst = FO.readScriptsLst(await data.text('SCRIPTS\\SCRIPTS.LST'));
  const types = new Map();
  for (let i = 0; i < lst.length; i++) {
    if (!/^elev/i.test(lst[i].name)) continue;
    const path_ = 'SCRIPTS\\' + lst[i].name.toUpperCase();
    if (!data.has(path_)) continue;
    const t = elevatorType(FO.readInt(await data.get(path_)));
    if (t >= 0) types.set(i, t);
  }
  const mapMsg = FO.readMsg(await data.text('TEXT\\ENGLISH\\GAME\\MAP.MSG'));
  const elevators = {};
  for (let idx = 0; idx < 100; idx++) {
    const m = mapMsg.get(idx);
    if (!m || !/\.MAP$/i.test(m.text)) continue;
    const map = FO.readMap(await data.get('MAPS\\' + m.text.toUpperCase()), protos);
    for (const s of map.scripts[1]) {
      const t = types.get(s.index);
      if (t === undefined) continue;
      (elevators[t] = elevators[t] || []).push({ map: idx, elev: (s.tile >>> 29) & 7, tile: s.tile & 0x3FFFFFF });
    }
  }
  for (const list of Object.values(elevators)) list.sort((a, b) => a.map - b.map || a.elev - b.elev || a.tile - b.tile);
  return { elevators };
}

module.exports = { looseFiles, russianFiles, exeTables, derivedTables };

function fileList(name, files) {
  return '  FO.' + name + ' = {\n' + Object.entries(files).map(([k, v]) => '    ' + JSON.stringify(k) + ': ' + JSON.stringify(v)).join(',\n') + '\n  };';
}

if (require.main === module) {
  const loose = looseFiles();
  writeModule('fo-files.js', fileList('LOOSE', loose) + '\n\n' + fileList('RU', russianFiles()));
  if (process.argv[2] === 'files') process.exit(0);
  writeModule('fo-exe.js', '  FO.EXE = {\n' + Object.entries(exeTables()).map(([k, v]) => '    ' + k + ': ' + JSON.stringify(v)).join(',\n') + '\n  };');
  derivedTables(loose).then(t => writeModule('fo-gen.js', '  FO.GEN = ' + JSON.stringify(t) + ';'));
}
