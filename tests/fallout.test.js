const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/fallout');
const GAME = path.join(ROOT, 'content/Fallout');
const ORDER = ['fo-core', 'fo-dat', 'fo-formats', 'fo-files', 'fo-exe', 'fo-gen', 'fo-hex', 'fo-art', 'fo-proto', 'fo-map', 'fo-color', 'fo-render', 'fo-light', 'fo-text', 'fo-acm', 'fo-sound', 'fo-mve', 'fo-path', 'fo-anim', 'fo-rules', 'fo-world', 'fo-vm', 'fo-scripts', 'fo-ops', 'fo-combat', 'fo-ai', 'fo-attack', 'fo-items', 'fo-travel', 'fo-save', 'fo-ui', 'fo-turns', 'fo-iface', 'fo-dialog', 'fo-inven', 'fo-barter', 'fo-charscr', 'fo-perkdlg', 'fo-select', 'fo-panels', 'fo-automap', 'fo-pipboy', 'fo-worldmap', 'fo-prefs', 'fo-movie', 'fo-endgame', 'fo-saveload', 'fo-viewer', 'fo-play', 'fo-menu', 'fo-game'];
const SIM = ORDER.slice(0, ORDER.indexOf('fo-save') + 1);
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const BANNED = new RegExp(['Micro' + 'soft', 'Win' + 'dows'].join('|'));
let checks = 0;
let D0 = null;
let finished = false;
process.on('exit', code => {
  if (finished || code !== 0) return;
  console.error('fallout: the run stopped after ' + checks + ' checks with work still pending');
  process.exitCode = 1;
});
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();

for (const m of SIM) require(path.join(DIR, m + '.js'));
const FO = globalThis.FO;

async function archives() {
  const lz = FO.lzss(Uint8Array.from([0xff, 0xfd, 65, 66, 67]), 3);
  ok(FO.latin1(lz) === 'ABC', 'raw LZSS block');
  const comp = FO.lzss(Uint8Array.from([0, 5, 0x01, 88, 0xee, 0x0f, 0]), 19);
  ok(FO.latin1(comp) === 'X' + ' '.repeat(18), 'LZSS back reference into the space-filled dictionary');
  const D = await FO.Data.open(FO.nodeSource(GAME), FO.LOOSE);
  const [critter, master] = D.archives;
  ok(master.files.size === 19784 && critter.files.size === 5459, 'DAT indexes: ' + master.files.size + ' + ' + critter.files.size);
  ok(D.where('ART\\INTRFACE\\HR_IFACE_800.FRM') === 'DATA' && D.where('art/critters/hmjmpsaa.frm') === 'CRITTER.DAT' && D.where('COLOR.PAL') === 'MASTER.DAT', 'lookup order: DATA, then archives');
  ok(D.where('SCRIPTS\\TANDI.INT') === 'DATA', 'patched scripts from DATA override MASTER.DAT');
  ok(!D.has('SAVEGAME\\SLOT01\\SAVE.DAT'), 'original saves are not part of the game data');
  return D;
}

async function looseIsCurrent() {
  const tool = require(path.join(ROOT, 'tools/fallout-data.cjs'));
  ok(JSON.stringify(tool.looseFiles()) === JSON.stringify(FO.LOOSE), 'fo-files.js matches content/Fallout/DATA (run node tools/fallout-data.cjs)');
  ok(JSON.stringify(tool.exeTables()) === JSON.stringify(FO.EXE), 'fo-exe.js matches FALLOUTW.EXE');
  ok(JSON.stringify(await tool.derivedTables(FO.LOOSE)) === JSON.stringify(FO.GEN), 'fo-gen.js matches the elevator scripts of the maps');
}

async function everyFile(D) {
  const count = {};
  const bad = [];
  let frames = 0;
  let messages = 0;
  for (const k of D.list(/./)) {
    const ext = (/\.([^.\\]+)$/.exec(k) || [0, ''])[1];
    count[ext] = (count[ext] || 0) + 1;
    try {
      const u8 = await D.get(k);
      if (/^FR[M0-5]$/.test(ext)) {
        const f = FO.readFrm(u8);
        for (const d of f.dirs) for (const fr of d.frames) {
          frames++;
          if (fr.px.length !== fr.w * fr.h) bad.push(k + ': frame size');
        }
      } else if (ext === 'MSG') messages += FO.readMsg(FO.latin1(u8)).size;
      else if (ext === 'PRO') FO.readPro(u8);
      else if (ext === 'INT') FO.readInt(u8);
      else if (ext === 'LIP') FO.readLip(u8);
      else if (ext === 'FON') FO.readFon(u8);
      else if (ext === 'AAF') FO.readAaf(u8);
      else if (ext === 'RIX') FO.readRix(u8);
      else if (ext === 'GCD') FO.readGcd(u8);
      else if (ext === 'PAL') FO.readPal(u8);
      else if (ext === 'GAM') FO.readGam(FO.latin1(u8));
      else if (ext === 'LST') FO.readLst(FO.latin1(u8));
      else if (ext === 'SVE') FO.readSve(FO.latin1(u8));
      else if (ext === 'CFG') FO.readIni(FO.latin1(u8));
    } catch (e) {
      bad.push(k + ': ' + e.message);
    }
  }
  ok(bad.length === 0, 'every file parses: ' + bad.slice(0, 5).join('; '));
  ok(count.FRM > 7500 && count.PRO === 4306 && count.INT === 952 && count.MAP === 72 && count.MSG > 1900 && count.LIP === 1601, 'file counts: ' + JSON.stringify(count));
  ok(frames > 370000 && messages > 100000, 'frames ' + frames + ', messages ' + messages);
}

async function samples(D) {
  const pal = FO.readPal(await D.get('COLOR.PAL'));
  ok(pal.free.length === 28 && pal.free[0] === 0 && pal.free[1] === 229 && pal.free[27] === 255, 'COLOR.PAL keeps index 0 and 229..255 for transparency and cycling');
  ok(pal.inv && pal.inv.length === 32768 && pal.rgb[3] > 0, 'palette and inverse colour table');

  const iface = FO.readFrm(await D.get('ART\\INTRFACE\\IFACE.FRM'));
  ok(iface.single && iface.dirs[0].frames[0].w === 640, 'interface bar is 640 wide');
  const hr = FO.readFrm(await D.get('ART\\INTRFACE\\HR_IFACE_800.FRM'));
  ok(hr.dirs[0].frames[0].w === 800, 'hi-res bar from DATA is 800 wide');
  const walk = FO.readFrm(await D.get('ART\\CRITTERS\\HMJMPSAB.FRM'));
  ok(!walk.single && walk.count > 1 && walk.dirs.every(d => d.frames.length === walk.count), 'critter walk has six directions');

  const maps = FO.readMsg(await D.text('TEXT\\ENGLISH\\GAME\\MAP.MSG'));
  ok(maps.get(0).text === 'DESERT1.MAP' && maps.get(65).text === 'HUBMIS1.MAP', 'map index list');
  const aradesh = FO.readMsg(await D.text('TEXT\\ENGLISH\\DIALOG\\ARADESH.MSG'));
  ok([...aradesh.values()].some(m => m.text.includes('Your business in Shady Sands?')), 'line breaks inside a message join without losing words');

  const gvars = FO.readGam(await D.text('DATA\\VAULT13.GAM'));
  ok(gvars.length === 618 && gvars[10].name === 'VAULT_WATER' && gvars[10].value === 150, 'global variables');
  const scripts = FO.readScriptsLst(await D.text('SCRIPTS\\SCRIPTS.LST'));
  ok(scripts[0].name === 'obj_dude.int' && scripts[1].name === 'elder.int' && scripts[1].vars === 10, 'script list with local variable counts');

  const items = FO.readLst(await D.text('PROTO\\ITEMS\\ITEMS.LST'));
  const metal = FO.readPro(await D.get('PROTO\\ITEMS\\' + items[1]));
  ok(metal.pid === 2 && metal.sub === 0 && metal.ac === 10 && metal.dr[0] === 30 && metal.dr[1] === 75 && metal.weight === 35 && metal.cost === 1100, 'pid 2 is metal armor');
  const crit = FO.readPro(await D.get('PROTO\\CRITTERS\\' + FO.readLst(await D.text('PROTO\\CRITTERS\\CRITTERS.LST'))[0]));
  ok(crit.type === 1 && crit.base.length === 35 && crit.skills.length === 18, 'critter prototype');

  const intro = FO.readSve(await D.text('TEXT\\ENGLISH\\CUTS\\INTRO.SVE'));
  ok(intro.some(s => s.text === 'War. War never changes.'), 'intro subtitles');
  const lip = FO.readLip(await D.get('SOUND\\SPEECH\\HARRY\\HARRY_10.LIP'));
  ok(lip.name === 'HARRY_10' && lip.markers.length === 36 && lip.markers.every((m, i) => !i || m.pos >= lip.markers[i - 1].pos), 'lip-sync markers');
  const font = FO.readFon(await D.get('FONT0.FON'));
  ok(font.height > 0 && font.glyphs.length === font.count, 'bitmap font');
  const aaf = FO.readAaf(await D.get('FONT1.AAF'));
  ok(aaf.height === 9 && aaf.glyphs.length === 256, 'AAF font');
  const splash = FO.readRix(await D.get('ART\\SPLASH\\SPLASH0.RIX'));
  ok(splash.w === 640 && splash.h === 480 && splash.px.length === 640 * 480, 'splash screen');
  const max = FO.readGcd(await D.get('PREMADE\\COMBAT.GCD'));
  ok(max.name === 'Max Stone' && max.tags[0] === 0 && max.traits[0] === 6, 'premade character');

  const tandi = FO.readInt(await D.get('SCRIPTS\\TANDI.INT'));
  ok(tandi.procs.some(p => p.name === 'do_dialogue') && tandi.code > 0x2A, 'script procedures');
  ok(FO.EXE.cycles.slime.length === 4 && FO.EXE.cycles.shore.length === 6 && FO.EXE.movies.length === 14 && FO.EXE.mapMusic.length === maps.size - [...maps.keys()].filter(k => k > 65).length, 'tables from FALLOUTW.EXE');
}

function geometry() {
  let seed = 12345;
  const rnd = n => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % n;
  };
  let picked = 0;
  let stepped = 0;
  for (let i = 0; i < 3000; i++) {
    const x = 2 + rnd(196);
    const y = 2 + rnd(196);
    const t = y * 200 + x;
    const [cx, cy] = FO.hexCenter(t);
    if (FO.worldHex(cx, cy) === t && FO.worldHex(cx + 9, cy + 3) === t && FO.worldHex(cx - 9, cy - 3) === t) picked++;
    for (let d = 0; d < 6; d++) {
      const n = FO.hexStep(t, d);
      if (FO.hexDist(t, n) === 1 && FO.hexStep(n, (d + 3) % 6) === t && FO.hexDir(t, n) === d) stepped++;
    }
  }
  ok(picked === 3000, 'screen point inside a hex picks that hex: ' + picked);
  ok(stepped === 18000, 'neighbours: distance 1, reversible, direction agrees: ' + stepped);
  const sizes = [1, 2, 3, 8].map(r => {
    const seen = new Set();
    FO.hexRing(20100, r, t => seen.add(t));
    return [...seen].filter(t => FO.hexDist(20100, t) === r).length;
  });
  ok(sizes.join() === '6,12,18,48', 'hex rings have 6r hexes: ' + sizes);
  const line = FO.hexLine(20100, 20100 + 7 * 200 + 5);
  ok(line[0] === 20100 && line[line.length - 1] === 20100 + 7 * 200 + 5 && line.every((t, i) => !i || FO.hexDist(line[i - 1], t) === 1), 'hex lines are continuous');
  const [a, b] = [FO.squareLeft(5050) - FO.hexLeft(20101), FO.squareTop(5050) - FO.hexTop(20101)];
  ok(a === -16 && b === -2, 'floor squares sit 16 px left and 2 px above their first hex: ' + a + ',' + b);
}

async function maps(D) {
  const art = new FO.Art(D);
  await art.init();
  const protos = new FO.Protos(D);
  await protos.init();
  const names = D.list(/^MAPS\\[^\\]+\.MAP$/);
  ok(names.length === 72, '72 maps');
  const fids = new Set();
  let objects = 0;
  let maxFloor = 0;
  const missingProto = new Set();
  const parsed = {};
  for (const k of names) {
    const m = FO.readMap(await D.get(k), protos);
    parsed[k.slice(5, -4)] = m;
    for (let e = 0; e < 3; e++) {
      if (m.header.flags & (2 << e)) continue;
      for (let s = 0; s < FO.SQUARES; s++) {
        maxFloor = Math.max(maxFloor, m.floors[e][s] & 0xFFF, m.roofs[e][s] & 0xFFF);
        if ((m.floors[e][s] & 0xFFF) > 1) fids.add(FO.fid(FO.ART.TILE, m.floors[e][s] & 0xFFF));
        if ((m.roofs[e][s] & 0xFFF) > 1) fids.add(FO.fid(FO.ART.TILE, m.roofs[e][s] & 0xFFF));
      }
      const walk = list => {
        for (const o of list) {
          objects++;
          fids.add(o.fid);
          if (!protos.get(o.pid)) missingProto.add(o.pid.toString(16));
          walk(o.inventory.map(i => i.obj));
        }
      };
      walk(m.objects[e]);
    }
  }
  ok(objects > 50000, 'objects on all maps: ' + objects);
  ok(maxFloor < art.lists[FO.ART.TILE].length, 'tile ids stay inside TILES.LST');
  ok(missingProto.size === 0, 'every map object has a prototype: ' + [...missingProto].slice(0, 8));
  const missingArt = [];
  for (const fid of fids) if (!(await art.load(fid))) missingArt.push(fid.toString(16));
  ok(missingArt.join() === '100001b', 'every art id used by the maps loads, except the child critter this release ships without: ' + missingArt.slice(0, 8));
  ok(parsed.V13ENT.header.index === 35 && parsed.V13ENT.scripts[1].length === 2 && parsed.VAULT13.scripts[3].length === 63, 'map headers and script blocks');
  const exits = parsed.V13ENT.objects[0].filter(o => FO.isExitGrid(o.pid));
  ok(exits.length > 0 && exits.every(o => o.destMap >= -2 && o.destTile >= -1), 'exit grids carry destinations');

  const colors = new FO.Colors(FO.readPal(await D.get('COLOR.PAL')));
  const v13 = parsed.V13ENT;
  const scr = new FO.Screen(640, 480);
  const [cx, cy] = FO.hexCenter(v13.header.tile);
  const view = { map: v13, elev: 0, x: cx - 320, y: cy - 190, art, colors, objects: v13.objects };
  const vis = FO.drawMap(scr, view);
  let lit = 0;
  for (const c of scr.px) if (c) lit++;
  ok(vis.length > 100 && lit > 640 * 480 * 0.9, 'Vault 13 entrance renders: ' + vis.length + ' objects, ' + lit + ' pixels');
  ok(colors.shade(64)[colors.nearest(200, 200, 200)] !== colors.nearest(200, 200, 200) && colors.shade(128)[77] === 77, 'light tables darken and keep full light');
  const before = colors.lut[229];
  colors.cycle(10000);
  ok(colors.lut[229] !== before || colors.lut[248] !== 0, 'palette cycling animates water and slime');

  const caves = parsed.CAVES;
  const light = FO.computeLight(caves.objects[0], 0x4000);
  let bright = 0;
  for (const l of light) if (l > 0x4000) bright++;
  ok(bright > 500, 'light sources brighten the caves: ' + bright);

  const shady = parsed.SHADYE;
  let roofSq = -1;
  for (let s = 0; s < FO.SQUARES && roofSq < 0; s++) if (FO.roofAt(shady.roofs[0], s) > 1) roofSq = s;
  const hidden = FO.roofHidden(shady.roofs[0], roofSq);
  let count = 0;
  for (const h of hidden) count += h;
  ok(count > 4 && count < 2000 && FO.roofHidden(shady.roofs[0], 0) === null, 'a roof hides as one connected piece: ' + count);

  const fonts = await FO.loadFonts(D);
  ok(fonts[101] && fonts[101].width('Vault 13') > 20 && fonts[0] && fonts[0].wrap('one two three four', 40).length > 1, 'game fonts measure and wrap text');
}

async function movement(D) {
  const game = { data: D, art: new FO.Art(D), protos: new FO.Protos(D) };
  await game.art.init();
  await game.protos.init();
  const w = new FO.World(game);
  await w.init();
  ok(w.mapNames[35] === 'V13ENT' && w.mapIndex('vault13.map') === 6, 'map names from MAP.MSG');
  await w.enter('V13ENT', 17090, 0, 2);
  const d = w.dude;
  ok(d.tile === 17090 && w.at(17090, 0).includes(d) && w.map.byElev[0].includes(d), 'dude placed and indexed');
  const exits = w.map.byElev[0].filter(o => FO.isExitGrid(o.pid) && o.destMap === 6);
  ok(exits.length > 0, 'vault door exit grids');
  const target = exits.map(e => e.tile).sort((a, b) => FO.hexDist(d.tile, a) - FO.hexDist(d.tile, b))[0];
  ok(!w.findPath(d, target, 0), 'the closed vault door blocks the way in');
  const vaultDoor = w.map.byElev[0].find(o => w.isDoor(o) && FO.hexDist(o.tile, d.tile) < 10 && /Outer/.test(game.protos.name(o.pid)));
  let doorDone = false;
  w.setDoor(vaultDoor, true, () => { doorDone = true; });
  for (let i = 0; i < 400 && !doorDone; i++) w.anim.update(50);
  let exited = null;
  w.on.step = o => {
    const ex = o.dude && w.exitAt(o.tile, o.elev);
    if (ex) {
      exited = ex;
      return false;
    }
    return true;
  };
  let walked = null;
  w.anim.run([{ kind: 'move', obj: d, tile: target, done: r => { walked = r; } }]);
  for (let i = 0; i < 2000 && walked === null; i++) w.anim.update(50);
  ok(exited && exited.destMap === 6 && d.x === 0 && d.y === 0 && FO.fidAnim(d.fid) === FO.ANIM.STAND, 'walking onto the vault door exit grid stops the dude there: ' + (exited && exited.tile));
  await w.enter(exited.destMap, exited.destTile, exited.destElev, exited.destRot);
  ok(w.map.name === 'VAULT13' && d.tile === exited.destTile && w.states.has('V13ENT'), 'exit grid leads into Vault 13 and keeps the cave state');

  const door = w.map.byElev[0].find(o => w.isDoor(o) && !w.locked(o) && !w.doorOpen(o));
  ok(door && w.blocks(door), 'closed door blocks');
  let opened = false;
  w.setDoor(door, true, () => { opened = true; });
  for (let i = 0; i < 200 && !opened; i++) w.anim.update(50);
  ok(opened && w.doorOpen(door) && !w.blocks(door) && (door.flags & FO.FLAG.LIGHT_THRU), 'door opens to its last frame and lets light and walkers through');
  let closed = false;
  w.setDoor(door, false, () => { closed = true; });
  for (let i = 0; i < 200 && !closed; i++) w.anim.update(50);
  ok(closed && door.frame === 0 && w.blocks(door), 'door closes again');

  const free = [];
  FO.hexRing(d.tile, 2, t => { if (!w.blocker(t, 0, d)) free.push(t); });
  const item = w.adopt({ id: w.newId(), pid: 0x00000001, fid: FO.fid(FO.ART.ITEM, 0), tile: -1, elev: 0, rot: 0, frame: 0, flags: 0, x: 0, y: 0, lightRadius: 0, lightIntensity: 0, sid: -1, inventory: [] }, 0, null);
  w.add(item, free[0], 0);
  ok(w.at(free[0], 0).includes(item) && !w.blocks(item), 'items lie on the floor without blocking');
  w.take(d, item, 1);
  ok(item.tile === -1 && item.owner === d && d.inventory.length === 1 && !w.at(free[0], 0).includes(item), 'picked item moves into the inventory');
  const path = w.findPath(d, free[free.length - 1], 0);
  ok(path && path.length >= 2 && path.every((t, i) => FO.hexDist(i ? path[i - 1] : d.tile, t) === 1), 'paths step through neighbouring hexes');
}

function stackCheck(t) {
  const SIMPLE = { 0x8000: [0, 0], 0x8002: [0, 0], 0x8003: [0, 0], 0x800F: [0, 0], 0x8012: [1, 1], 0x8013: [2, 0], 0x8014: [1, 1], 0x8015: [2, 0], 0x8016: [1, 0], 0x801A: [1, 0], 0x8027: [2, 0], 0x8028: [1, 1], 0x802C: [0, 0], 0x8031: [2, 0], 0x8032: [1, 1], 0x8043: [1, 1], 0x8044: [1, 1], 0x8045: [1, 1], 0x8046: [1, 1] };
  for (let op = 0x8033; op <= 0x8042; op++) SIMPLE[op] = [2, 1];
  const b = t.bytes;
  const rd = p => (b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3];
  const bodies = new Set(t.procs.map(p => p.body));
  const errors = [];
  const run = (entry, init) => {
    const seen = new Map();
    const work = [[entry, init]];
    while (work.length) {
      let [ip, st] = work.pop();
      const S = st.s.slice();
      const R = st.r.slice();
      let base = st.base;
      for (let steps = 0; steps < 200000; steps++) {
        const sig = S.length + '/' + R.length + '/' + base;
        if (seen.has(ip)) {
          if (seen.get(ip) !== sig) errors.push('depth ' + ip);
          break;
        }
        seen.set(ip, sig);
        if (ip + 2 > b.length) break;
        const op = (b[ip] << 8) | b[ip + 1];
        let next = ip + 2;
        const pop = () => {
          if (!S.length) errors.push('underflow ' + ip);
          return S.length ? S.pop() : {};
        };
        const sig2 = FO.OPCODES[op];
        if (op === 0xC001) {
          S.push({ c: rd(ip + 2) });
          next += 4;
        } else if (op === 0xA001 || op === 0x9001) {
          S.push({});
          next += 4;
        } else if (SIMPLE[op] || sig2) {
          const [p, q] = SIMPLE[op] || [sig2[1], sig2[2]];
          for (let i = 0; i < p; i++) pop();
          for (let i = 0; i < q; i++) S.push({});
        } else if (op === 0x801B) {
          const v = pop();
          S.push(v, v);
        } else if (op === 0x800C) S.push(R.length ? R.pop() : {});
        else if (op === 0x800D) R.push(pop());
        else if (op === 0x8019) {
          const a = R.pop();
          const c = R.pop();
          R.push(a, c);
        } else if (op === 0x8029) {
          R.pop();
          base = 'popped';
        } else if (op === 0x802A) {
          if (typeof base === 'number') S.length = base;
        } else if (op === 0x802B) {
          const n = pop();
          R.push({});
          base = S.length - (n.c || 0);
        } else if (op === 0x8004) {
          const a = pop();
          if (a.c === undefined || (bodies.has(a.c) && a.c !== entry)) break;
          next = a.c;
        } else if (op === 0x802F) {
          pop();
          const a = pop();
          if (a.c === undefined) break;
          work.push([a.c, { s: S.slice(), r: R.slice(), base }]);
        } else if (op === 0x8030) {
          pop();
          const a = S[S.length - 1];
          if (!a || a.c === undefined) break;
          work.push([a.c, { s: S.slice(0, -1), r: R.slice(), base }]);
        } else if (op === 0x8005) {
          pop();
          const n = pop();
          for (let i = 0; i < (n.c || 0); i++) pop();
          R.pop();
          S.push({});
        } else break;
        ip = next;
      }
    }
  };
  run(0, { s: [], r: [], base: null });
  for (const p of t.procs) {
    if (!p.name || /^\.+$/.test(p.name)) continue;
    const init = [];
    for (let i = 0; i < p.args; i++) init.push({});
    init.push({ c: p.args });
    run(p.body, { s: init, r: [{}], base: null });
  }
  return errors;
}

async function scripting(D) {
  let bad = 0;
  const known = new Set(['BOSLORI.INT', 'CHILDR~1.INT', 'CHUCK.INT', 'GATEDEMO.INT', 'GLOW4W~1.INT', 'GUNRUNR.INT', 'MORBID.INT', 'MUTFRUIT.INT', 'NHUP2DN1.INT', 'PRISON.INT', 'REVULSE.INT', 'RNDMTN.INT', 'SAMMY.INT', 'TERM1.INT', 'TEST.INT', 'THORNDYK.INT', 'V13CAVES.INT']);
  const odd = [];
  for (const k of D.list(/^SCRIPTS\\[^\\]+\.INT$/)) {
    const errs = stackCheck(FO.readInt(await D.get(k)));
    if (errs.length) {
      bad++;
      if (!known.has(k.slice(8))) odd.push(k.slice(8));
    }
  }
  ok(odd.length === 0 && bad <= known.size, 'opcode signatures balance the stack in every script except ' + bad + ' original oddities: ' + odd.slice(0, 6));

  const game = { data: D, art: new FO.Art(D), protos: new FO.Protos(D), prefs: {} };
  await game.art.init();
  await game.protos.init();
  const base = new FO.Scripts(game, new FO.World(game));
  await base.init();
  let errors = 0;
  const firstErrors = [];
  let ran = 0;
  for (const k of D.list(/^MAPS\\[^\\]+\.MAP$/)) {
    const w = new FO.World(game);
    await w.init();
    const sc = new FO.Scripts(game, w);
    sc.list = base.list;
    sc.gvars = base.gvars.slice();
    sc.gvarNames = base.gvarNames;
    sc.host = {};
    w.on.step = o => {
      sc.spatial(o);
      return true;
    };
    await w.enter(k.slice(5, -4), -1, -1, -1);
    sc.enterMap();
    for (let i = 0; i < 60; i++) {
      w.anim.update(100);
      sc.critterProc(100);
      sc.advance(1);
    }
    ran += w.map.scriptList.length;
    errors += sc.errors.length;
    firstErrors.push(...sc.errors.slice(0, 1));
    ok(sc.vm.missing.size === 0, k + ' uses no unimplemented opcode: ' + [...sc.vm.missing.keys()]);
  }
  ok(errors === 0 && ran > 2000, 'scripts of all maps run without errors: ' + ran + ' instances, ' + errors + ' errors ' + firstErrors.slice(0, 3));

  const w = new FO.World(game);
  await w.init();
  const sc = new FO.Scripts(game, w);
  sc.list = base.list;
  sc.gvars = base.gvars.slice();
  sc.gvarNames = base.gvarNames;
  const said = [];
  sc.host = { say: s => said.push(s), float: (o, s) => said.push(s), centerOn() {} };
  await w.enter('V13ENT', -1, -1, -1);
  sc.enterMap();
  ok(w.dude.tile === 17690 && w.dude.rot === 2, 'the cave map script puts the dude in front of the vault door: ' + w.dude.tile);
  await w.enter('SHADYW', -1, -1, -1);
  sc.enterMap();
  const talker = w.map.scriptList.find(s => s.self && s.name === 'ARADESH');
  ok(talker, 'Aradesh has his script');
  sc.exec(talker, FO.ACT.TALK, { source: w.dude });
  ok(sc.dialog && sc.dialog.waiting === talker && sc.dialog.node.reply.length > 10, 'talking to Aradesh opens a dialogue: ' + (sc.dialog && sc.dialog.node.reply.slice(0, 60)));
  let nodes = 0;
  while (sc.dialog && sc.dialog.waiting && nodes < 20) {
    const opts = sc.dialog.node.options;
    sc.resumeDialog(opts.length ? opts.length - 1 : -1);
    nodes++;
  }
  ok(!sc.dialog && nodes > 0 && sc.errors.length === 0, 'choosing options walks the dialogue to its end: ' + nodes + ' nodes ' + sc.errors.slice(0, 2));
}

async function pipboy(D) {
  for (const m of ['fo-ui', 'fo-automap', 'fo-pipboy']) require(path.join(DIR, m + '.js'));
  ok(FO.EXE.quests.length === 33 && FO.EXE.holodisks.length === 18 && FO.EXE.holidays.length === 8 && FO.EXE.automap.length === 42, 'quest, holodisk, holiday and automap tables from FALLOUTW.EXE');
  const gvars = new Array(618).fill(0);
  let cities = FO.pipQuests(gvars);
  ok(cities.length === 1 && cities[0].msg === 700 && cities[0].quests.length === 1 && cities[0].quests[0].msg === 704 && !cities[0].quests[0].done, 'a new game lists only the water chip');
  gvars[101] = 2;
  gvars[103] = 1;
  gvars[43] = 2;
  cities = FO.pipQuests(gvars);
  ok(cities[0].quests[0].done && cities[1].msg === 720 && cities[1].quests.map(q => q.msg + (q.done ? '+' : '')).join() === '723,724+', 'quests appear at 1 and are crossed out from 2');
  gvars[162] = 1;
  gvars[311] = 1;
  ok(FO.pipDisks(gvars).join() === '0,17', 'holodisks follow their globals');
  ok(FO.restTicks(FO.START_TIME, 0) === 6000 && FO.restTicks(FO.START_TIME, 8) === 777600 && FO.restTicks(FO.START_TIME, 12) === Infinity, 'alarm clock rest lengths');

  const game = { data: D, art: new FO.Art(D), protos: new FO.Protos(D) };
  await game.art.init();
  await game.protos.init();
  const w = new FO.World(game);
  await w.init();
  await w.enter('V13ENT', 17690, 0, 2);
  w.processSeen();
  const seen = w.map.byElev[0].filter(o => o.flags & FO.FLAG.SEEN);
  const far = seen.filter(o => Math.abs(Math.floor(o.tile / 200) - 88) > 16);
  ok(seen.length > 10 && far.length === 0 && FO.hasAutomap(w.map, 0), 'the dude marks walls near his steps as seen for the automap: ' + seen.length);
  ok(FO.mapPlaceName(w, 6) === 'Vault 13' && FO.mapLevelName(w, 6, 0) === 'Entrance', 'automap names from MAP.MSG');

  for (const m of ['fo-iface', 'fo-dialog', 'fo-inven', 'fo-barter']) require(path.join(DIR, m + '.js'));
  const item = pid => ({ id: w.newId(), pid, proto: game.protos.get(pid), flags: 0, inventory: [], tile: -1 });
  const npcPid = 0x01000000 | 1;
  const npc = { id: w.newId(), pid: npcPid, proto: game.protos.get(npcPid), flags: 0, inventory: [], critter: { hp: 10, results: 0 } };
  const play = { w, g: game, sc: { gvars: new Array(618).fill(0) } };
  const table = { inventory: [{ count: 100, obj: item(41) }] };
  ok(FO.totalCost(game.protos, table) === 100 && FO.barterAsk(play, npc, table, 0) === 100, 'money keeps its face value in barter');
  const knife = item(4);
  const priced = { inventory: [{ count: 2, obj: knife }] };
  const cost = FO.totalCost(game.protos, priced);
  const pct = Math.max(10, Math.min(300, 100 + FO.skillValue(w.dude, FO.SKILL.BARTER) - FO.skillValue(npc, FO.SKILL.BARTER)));
  ok(cost === 2 * knife.proto.cost && FO.barterAsk(play, npc, priced, 0) === Math.trunc(cost * 100 / pct), 'barter price follows the skill difference: ' + FO.barterAsk(play, npc, priced, 0) + ' of ' + cost);
  w.dude.perks = { [FO.PERK.MASTER_TRADER]: 1 };
  ok(FO.barterAsk(play, npc, priced, 0) < Math.trunc(cost * 100 / pct), 'Master Trader lowers the asking price');
  w.dude.perks = {};

  require(path.join(DIR, 'fo-panels.js'));
  const said = [];
  const thief = { w: Object.assign(w, { party: [npc] }), g: game, sc: { rand: () => 100 }, say: s => said.push(s), text: id => ({ 570: 'caught %s', 571: 'steal %s' })[id] || '' };
  ok(FO.stealCheck(thief, w.dude, npc, knife, false, 1) && /^steal /.test(said[0]), 'party members never catch the thief');
  w.party = [];
  const rolls = [100, 100, 1, 100];
  thief.sc.rand = () => rolls.shift();
  ok(!FO.stealCheck(thief, w.dude, npc, knife, false, 1) && /^caught /.test(said[1]), 'a failed roll with a watchful victim gets the thief caught');
}

function seeded(seed) {
  let s = seed >>> 0;
  return (a, b) => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return a + Math.floor(r * (b - a + 1));
  };
}

async function combat(D) {
  require(path.join(DIR, 'fo-turns.js'));
  const packets = FO.readAiPackets(await D.text('DATA\\AI.TXT'));
  const rats = packets.find(p => p.packet_num === 12);
  ok(packets.length === 95 && packets[0].name === 'Player AI' && packets[0].hurt_too_much === 0x7C && rats.max_dist === 6 && rats.min_to_hit === 2, 'AI.TXT packets with hurt_too_much masks');
  FO.AI_PACKETS = packets;
  ok(FO.EXE.crits.length === 15 && FO.EXE.playerCrits.length === 9 && FO.EXE.critFails.length === 7 && FO.EXE.hitLocations[FO.HIT_LOC.EYES] === -60, 'critical tables from FALLOUTW.EXE');

  const game = { data: D, art: new FO.Art(D), protos: new FO.Protos(D), prefs: Object.assign({}, FO.PREF_DEFAULTS || {}, { combatTaunts: 0 }) };
  await game.art.init();
  await game.protos.init();
  const w = new FO.World(game);
  await w.init();
  await w.enter('V13ENT', 20100, 0, 2);
  const d = w.dude;
  const rat = w.map.byElev[0].filter(o => o.pid === 0x1000030).sort((a, b) => FO.hexDist(a.tile, d.tile) - FO.hexDist(b.tile, d.tile))[0];
  FO.lightOf = () => FO.LIGHT_FULL;
  FO.gameTime = () => 0;
  FO.combatDifficulty = () => 1;
  d.critter.ap = 7;
  rat.critter.ap = 6;
  ok(FO.badShot(w, d, rat, FO.HIT_MODE.PUNCH, false) === FO.BAD_SHOT.OUT_OF_RANGE, 'a far rat is out of punching range');
  let near = -1;
  for (let dir = 0; dir < 6 && near < 0; dir++) {
    const t = FO.hexStep(d.tile, dir);
    if (t >= 0 && !w.blocker(t, 0, rat)) near = t;
  }
  w.place(rat, near, 0);
  rat.rot = FO.hexDir(rat.tile, d.tile);
  ok(FO.badShot(w, d, rat, FO.HIT_MODE.PUNCH, false) === FO.BAD_SHOT.OK && FO.objDist(d, rat) === 1, 'an adjacent rat can be punched');
  d.critter.ap = 2;
  ok(FO.badShot(w, d, rat, FO.HIT_MODE.PUNCH, false) === FO.BAD_SHOT.NO_AP && FO.apCost(d, FO.HIT_MODE.PUNCH, true) === 4, 'punches cost 3 AP and aimed ones 4');
  d.critter.ap = 7;
  const toHit = FO.determineToHit(w, d, rat, FO.HIT_LOC.UNCALLED, FO.HIT_MODE.PUNCH, true);
  ok(toHit === Math.min(95, FO.skillValue(d, FO.SKILL.UNARMED) - FO.statValue(rat, FO.STAT.AC)), 'to-hit is the unarmed skill minus armor class: ' + toHit);
  ok(FO.determineToHit(w, d, rat, FO.HIT_LOC.EYES, FO.HIT_MODE.PUNCH, true) === toHit - 30, 'aimed melee pays half the called-shot penalty');
  d.critter.results = FO.DAM.CRIP_LEG_LEFT;
  ok(FO.apPerHexes(d, 3) === 12, 'a crippled leg makes every hex cost 4 AP');
  d.critter.results = FO.DAM.CRIP_LEG_LEFT | FO.DAM.CRIP_LEG_RIGHT;
  ok(FO.apPerHexes(d, 1) === 8, 'two crippled legs cost 8 AP a hex');
  d.critter.results = 0;

  const rolls = [1, 4];
  FO.combatRand = (a, b) => (rolls.length ? rolls.shift() : a);
  const ctx = FO.newAttack(d, rat, FO.HIT_MODE.PUNCH, FO.HIT_LOC.UNCALLED);
  FO.computeAttack(w, ctx);
  const dt = FO.statValue(rat, FO.STAT.DT);
  const dr = FO.statValue(rat, FO.STAT.DR);
  const want = Math.max(0, 4 - dt) - Math.trunc(Math.max(0, 4 - dt) * dr / 100);
  ok(ctx.roll === FO.ROLL.SUCCESS && (ctx.attackerFlags & FO.DAM.HIT) && ctx.defenderLocation === FO.HIT_LOC.TORSO && ctx.defenderDamage === want, 'a rolled punch hits the torso for its damage roll less DT and DR: ' + ctx.defenderDamage);
  ok(!!(ctx.defenderFlags & FO.DAM.DEAD) === (rat.critter.hp - want <= 0), 'lethal damage is marked before the animation');

  const said = [];
  const sc = { time: 0, exec: () => null, removeTimers() {}, addEvent() {}, removeEvents() {}, kill() {}, addItem() {} };
  const play = {
    w, g: game, sc, said, floats: [], busy: false, cursor: 'move', targeting: null,
    iface: { attackMode: () => ({ hitMode: FO.HIT_MODE.PUNCH, aimed: false }), refreshItems() {} },
    say: s => said.push(s), float() {}, passTime: n => { sc.time += n; }, openModal() {}, uiSound() {},
    giveExp: n => FO.addExperience(w.dude, n, () => said.push(play.text(600, 'STAT'))),
    text: (id, file) => {
      const m = file === 'MISC' ? misc : file === 'STAT' ? stat : proto;
      const e = m.get(id);
      return e ? e.text : '';
    }
  };
  const load = async name => FO.readMsg(await D.text(FO.textPath('GAME\\' + name + '.MSG')));
  const [misc, stat, proto] = [await load('MISC'), await load('STAT'), await load('PROTO')];
  const cb = new FO.Combat(play);
  cb.combatMsg = await load('COMBAT');
  cb.combatAiMsg = await load('COMBATAI');
  ctx.defenderDamage = 3;
  ctx.defenderFlags = 0;
  const lines = FO.combatDisplay(cb, ctx);
  ok(lines.some(l => l === 'Cave Rat was hit for 3 hit points.'), 'combat messages come from COMBAT.MSG: ' + lines.join(' | '));
  said.length = 0;

  FO.combatRand = seeded(7);
  const expBefore = d.exp | 0;
  const hpBefore = d.critter.hp;
  const done = cb.run({ attacker: rat, defender: d, apBonus: 0, accuracy: 0, damageBonus: 0, min: 0, max: 0x7FFFFFFF, changeFlags: 0 });
  let finished = false;
  done.then(() => { finished = true; });
  let rounds = 0;
  let ratActed = false;
  for (let i = 0; i < 4000 && !finished; i++) {
    w.anim.update(50);
    cb.tick();
    if (cb.current === rat && w.anim.busy(rat)) ratActed = true;
    if (cb.canAct()) {
      rounds++;
      if (!(rat.critter.results & FO.DAM.DEAD) && FO.apCost(d, FO.HIT_MODE.PUNCH, false) <= d.critter.ap) cb.attackThis(rat, false);
      else cb.endTurn();
    }
    await new Promise(r => setImmediate(r));
  }
  ok(finished && !cb.active && !w.inCombat, 'combat runs to its end without a browser: ' + rounds + ' dude actions');
  ok(rat.critter.results & FO.DAM.DEAD, 'the rat dies');
  ok((rat.flags & FO.FLAG.NO_BLOCK) && (rat.flags & FO.FLAG.FLAT), 'the corpse no longer blocks and lies flat');
  ok(ratActed || d.critter.hp < hpBefore || said.some(l => /^Cave Rat/.test(l)), 'the rat fights back');
  ok((d.exp | 0) - expBefore === FO.killExp(rat) && d.kills && d.kills[FO.critterKillType(rat)] === 1, 'killing the rat gives its experience at the end of combat and counts the kill');
  ok(said.some(l => /exp\. points\.$/.test(l)), 'the end of combat reports the experience: ' + said[said.length - 1]);
  ok(d.critter.ap === FO.statValue(d, FO.STAT.MAX_AP) && sc.time >= 5, 'combat rounds pass game time and AP refill afterwards');
  FO.combatRand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
}

async function items(D) {
  const game = { data: D, art: new FO.Art(D), protos: new FO.Protos(D), prefs: {} };
  await game.art.init();
  await game.protos.init();
  const w = new FO.World(game);
  await w.init();
  await w.enter('V13ENT', 20100, 0, 2);
  const d = w.dude;
  const load = async name => FO.readMsg(await D.text(FO.textPath('GAME\\' + name + '.MSG')));
  const msgs = {};
  for (const n of ['PROTO', 'MISC', 'ITEM', 'PERK', 'STAT', 'COMBAT']) msgs[n] = await load(n);
  const S = FO.Scripts.prototype;
  const sc = { time: FO.START_TIME, gvars: new Array(620).fill(0), events: [], w, kill: o => { o.critter.results |= FO.DAM.DEAD; } };
  for (const k of ['addEvent', 'eventsOf', 'allEvents', 'dropEvent', 'removeEvents', 'removeTimers', 'carried']) sc[k] = S[k];
  const said = [];
  const play = {
    w, g: game, sc, said, floats: [], say: s => said.push(s),
    giveExp: n => FO.addExperience(w.dude, n, () => said.push(play.text(600, 'STAT'))),
    text: (id, file) => { const e = msgs[file || 'PROTO'].get(id); return e ? e.text : ''; },
    passTime: n => advance(n), openModal() {}, iface: { refreshItems() {} }
  };
  play.combat = new FO.Combat(play);
  play.combat.combatMsg = msgs.COMBAT;
  const advance = n => {
    sc.time += n;
    const due = sc.allEvents().filter(t => t.at <= sc.time).sort((a, b) => a.at - b.at);
    for (const t of due) {
      sc.dropEvent(t);
      FO.itemEvent(play, t);
    }
  };
  const item = pid => ({ id: w.newId(), pid, proto: game.protos.get(pid), flags: 0, inventory: [], tile: -1, owner: null });
  const give = (pid, n) => {
    const it = item(pid);
    it.owner = d;
    d.inventory.push({ count: n || 1, obj: it });
    return it;
  };
  const max = FO.statValue(d, FO.STAT.MAX_HP);
  const rolls = [];
  FO.combatRand = (a, b) => (rolls.length ? rolls.shift() : a);
  d.critter.hp = 5;
  rolls.push(17);
  const stim = give(40, 2);
  FO.useItemOn(play, d, d, stim);
  ok(d.critter.hp === 22 && d.inventory.find(e => e.obj === stim).count === 1 && said.includes('You gained 17 Current Hit Points.'), 'a stimpak heals 10-20 hit points and is used up: ' + said.join(' | '));

  const st = FO.statValue(d, FO.STAT.ST);
  const buff = give(87);
  rolls.push(100);
  FO.useItemOn(play, d, d, buff);
  ok(FO.statValue(d, FO.STAT.ST) === st + 2 && sc.eventsOf(d, 'drug').length === 2 && !d.inventory.some(e => e.obj === buff), 'Buffout adds +2 ST now and queues two later stages');
  advance(360 * 600);
  ok(FO.statValue(d, FO.STAT.ST) === st - 2, 'six hours later Buffout crashes below normal');
  advance(720 * 600);
  ok(FO.statValue(d, FO.STAT.ST) === st && d.stats.bonus[FO.STAT.AG] === 0 && d.stats.bonus[FO.STAT.EN] === 0, 'after 18 hours every Buffout bonus is gone');
  ok(!FO.isAddicted(play, 87), 'a lucky roll means no addiction');

  said.length = 0;
  rolls.push(1);
  FO.useItemOn(play, d, d, give(87));
  ok(sc.gvars[190] === 1 && sc.eventsOf(d, 'withdrawal').length === 1 && FO.isAddicted(play, 87), 'a failed addiction roll marks the Buffout addiction global and queues withdrawal');
  advance(2880 * 600);
  ok(said.includes('You\'ve got the shakes.') && d.stats.bonus[FO.STAT.AG] === -3 && sc.eventsOf(d, 'withdrawal').length === 1, 'withdrawal starts after the onset with the craving perk effects: ' + d.stats.bonus.slice(0, 7).join(','));
  advance(10080 * 600);
  ok(sc.gvars[190] === 0 && said.includes('You feel better.') && FO.statValue(d, FO.STAT.ST) === st, 'a week later the withdrawal ends and the global clears');

  const hp = d.critter.hp = 20;
  FO.adjustPoison(play, d, 10);
  const resist = FO.statValue(d, FO.STAT.POISON_RESIST);
  const poison = 10 - Math.trunc(10 * resist / 100);
  ok(d.critter.poison === poison && said.includes('You have been poisoned!'), 'poison is reduced by poison resistance: ' + poison);
  advance(10 * (505 - 5 * poison));
  ok(d.critter.poison === poison - 2 && d.critter.hp === hp - 1 && said.includes('You take damage from poison.'), 'each poison tick removes 2 poison and 1 hit point');

  d.critter.rad = 0;
  FO.adjustRads(play, d, 300);
  ok(d.critter.rad === 300 - Math.trunc(300 * FO.statValue(d, FO.STAT.RAD_RESIST) / 100) && d.radExposed, 'radiation is reduced by radiation resistance');
  rolls.push(1, 4);
  FO.processRads(play);
  const sick = sc.eventsOf(d, 'radiation');
  ok(sick.length === 1 && sick[0].data.level === 2 && sick[0].at - sc.time === 4 * 36000, 'a radiation check queues sickness of the dose level 4-18 hours later');
  const strength = FO.statValue(d, FO.STAT.ST);
  advance(4 * 36000);
  ok(FO.statValue(d, FO.STAT.ST) === strength - 1 && said.includes('You feel very nauseous, and after some mild vomiting, slightly fatigued.'), 'level 2 sickness costs 1 ST');
  advance(168 * 36000);
  ok(FO.statValue(d, FO.STAT.ST) === strength, 'radiation sickness heals after a week');

  said.length = 0;
  const book = give(73);
  const science = FO.skillValue(d, FO.SKILL.SCIENCE);
  const t0 = sc.time;
  FO.useItem(play, d, book);
  const n = Math.trunc((100 - science) / 10);
  ok(FO.skillValue(d, FO.SKILL.SCIENCE) === science + n && sc.time - t0 === (11 - FO.statValue(d, FO.STAT.IN)) * 3600 && said.includes('You read the book.') && !d.inventory.some(e => e.obj === book), 'reading the Big Book of Science raises Science by (100 - skill) / 10 points');
  FO.combatRand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
}

async function rules(D) {
  const S = FO.STAT;
  const game = { data: D, art: new FO.Art(D), protos: new FO.Protos(D), prefs: {} };
  await game.art.init();
  await game.protos.init();
  const w = new FO.World(game);
  await w.init();
  const d = w.dude;
  await FO.loadPremade(D, d, 'PREMADE\\COMBAT');
  ok(d.name === 'Max Stone' && FO.statValue(d, S.ST) === 10 && FO.statValue(d, S.MAX_HP) === 43 && d.critter.hp === 43, 'a premade loads base stats, Bruiser adds strength and hit points start full');
  ok(FO.statValue(d, S.MELEE_DMG) === 9 && FO.statValue(d, S.MAX_AP) === 6 && FO.statValue(d, S.CARRY) === 275 && FO.statValue(d, S.DR + FO.DMG.EMP) === 100, 'Heavy Handed, Bruiser and the premade EMP resistance follow the 1.2 tables');
  ok(FO.statValue(d, S.BETTER_CRITS) === 0 && FO.skillValue(d, FO.SKILL.UNARMED) === 93, 'Heavy Handed is clamped at zero better criticals and Unarmed starts at 65 + (AG + ST) / 2 plus the tag bonus');

  const said = [];
  FO.addExperience(d, 1000, () => said.push('up'));
  ok(d.level === 2 && FO.statValue(d, S.MAX_HP) === 49 && d.critter.hp === 43 && said.length === 1 && FO.pcFlag(d, FO.PC_FLAG.LEVEL), 'a level adds EN / 2 + 2 hit points to the maximum, but current hit points stay clamped to the old maximum');
  FO.levelCheck(d);
  ok(d.skillPoints === 13 && d.lastLevel === 2 && !d.freePerk, 'skill points arrive when the character screen opens: 5 + 2 x IN');
  FO.addExperience(d, 2000);
  FO.levelCheck(d);
  ok(d.level === 3 && d.skillPoints === 26 && d.freePerk, 'every third level grants a free perk');
  const list = FO.perkList(d);
  ok(list.includes(FO.PERK.BONUS_HTH_DAMAGE) && !list.includes(FO.PERK.AWARENESS) && !list.includes(FO.PERK.TOUGHNESS) && !list.includes(FO.PERK.ACTION_BOY), 'perk requirements come from the EXE perk table: level, SPECIAL minimums and ranks');
  FO.perkAdd(d, FO.PERK.BONUS_HTH_DAMAGE);
  const melee = FO.statValue(d, S.MELEE_DMG);
  FO.perkSub(d, FO.PERK.BONUS_HTH_DAMAGE);
  ok(melee === 11 && FO.statValue(d, S.MELEE_DMG) === 9 && FO.statBonus(d, S.MELEE_DMG) === 0, 'perk effects are written to bonus stats and removed again');

  await FO.loadPremade(D, d, 'PREMADE\\BLANK');
  d.perks[FO.PERK.SWIFT_LEARNER] = 1;
  FO.addExperience(d, 100);
  ok(d.exp === 105 && d.name === 'None' && FO.statValue(d, S.DR + FO.DMG.EMP) === 100, 'Swift Learner adds 5% per rank to experience');
  d.perks = {};
  const armor = pid => ({ id: w.newId(), pid, proto: game.protos.get(pid), flags: FO.FLAG.WORN, inventory: [], tile: -1, owner: d });
  const leather = armor(1);
  FO.adjustArmor(d, null, leather);
  ok(FO.statValue(d, S.AC) === 5 + leather.proto.ac && FO.statValue(d, S.DR) === leather.proto.dr[0] && FO.statValue(d, S.DT) === leather.proto.dt[0], 'worn armor writes its AC, DT and DR into the bonus stats');
  const power = armor(3);
  FO.adjustArmor(d, leather, power);
  ok(FO.statValue(d, S.ST) === 8 && FO.statValue(d, S.CARRY) === 225 && FO.statValue(d, S.RAD_RESIST) === 40, 'Powered Armor adds +3 ST through its perk and recalculates carry weight');
  FO.adjustArmor(d, power, null);
  ok(FO.statValue(d, S.ST) === 5 && FO.statValue(d, S.AC) === 5 && FO.statBonus(d, S.RAD_RESIST) === 0 && FO.statValue(d, S.CARRY) === 150, 'taking armor off restores every stat');

  d.traits = [FO.TRAIT.SMALL_FRAME, FO.TRAIT.KAMIKAZE];
  FO.recalcDerived(d);
  ok(FO.statValue(d, S.AG) === 6 && FO.statValue(d, S.CARRY) === 100 && FO.statValue(d, S.AC) === 0 && FO.statValue(d, S.SEQUENCE) === 15, 'Small Frame and Kamikaze use base stats like the EXE');
  d.traits = [FO.TRAIT.FAST_METABOLISM, -1];
  FO.recalcDerived(d);
  FO.perkAddEffect(d, FO.PERK.RAD_RESISTANCE);
  ok(FO.statValue(d, S.RAD_RESIST) === 15 && FO.statValue(d, S.POISON_RESIST) === 0 && FO.statValue(d, S.HEAL_RATE) === 3, 'Fast Metabolism removes only the base resistances, perks still count');
  FO.perkRemoveEffect(d, FO.PERK.RAD_RESISTANCE);
  d.traits = [-1, -1];
  FO.recalcDerived(d);
  ok(FO.setBaseStat(d, S.MAX_HP, 50) === -1 && FO.setBaseStat(d, S.ST, 11) === -3 && FO.setBaseStat(d, S.ST, 6) === 0 && FO.statValue(d, S.MAX_HP) === 31, 'derived stats cannot be set directly, primary stats are range checked and recalculate the rest');
  const turn = FO.combatTurn;
  FO.combatTurn = () => null;
  d.critter.ap = 4;
  const ac = FO.statValue(d, S.AC);
  FO.combatTurn = turn;
  ok(ac === 9, 'unspent action points add to armor class on other combatants turns');

  for (const m of ['fo-charscr', 'fo-perkdlg']) require(path.join(DIR, m + '.js'));
  const host = { g: game, w, openModal() {}, closeModal() {}, top() { return null; } };
  const pick = (perk, setup) => {
    d.perks = {};
    d.traits = [FO.TRAIT.HEAVY_HANDED, FO.TRAIT.BRUISER];
    d.tags = [0, 1, 3, -1];
    if (setup) setup();
    const editor = { dude: d, m: () => '', x: 0, y: 0 };
    editor.saved = { perks: Object.assign({}, d.perks), tags: d.tags.slice(), traits: d.traits.slice() };
    const dlg = new FO.PerkPicker(host, editor);
    dlg.sel = dlg.list.findIndex(it => it.id === perk);
    dlg.top = 0;
    return dlg;
  };
  d.freePerk = true;
  d.level = 12;
  d.stats.base[S.IN] = 6;
  let dlg = pick(FO.PERK.EDUCATED);
  const points = d.skillPoints;
  dlg.accept();
  ok(dlg.sel >= 0 && FO.perkRank(d, FO.PERK.EDUCATED) === 1 && d.skillPoints === points + 2 && !d.freePerk, 'Educated adds two skill points when it is picked');
  d.freePerk = true;
  dlg = pick(FO.PERK.TAG);
  dlg.accept();
  ok(dlg.phase === 'tag' && !dlg.list.some(it => it.id === 0 || it.id === 1 || it.id === 3), 'Tag! asks for a skill that is not tagged yet');
  dlg.sel = 0;
  const tagged = dlg.list[0].id;
  dlg.accept();
  ok(d.tags[3] === tagged && FO.perkRank(d, FO.PERK.TAG) === 1, 'the fourth tag slot holds the Tag! skill');
  d.freePerk = true;
  dlg = pick(FO.PERK.TAG);
  dlg.accept();
  dlg.cancel();
  ok(FO.perkRank(d, FO.PERK.TAG) === 0 && d.tags[3] === -1 && d.freePerk, 'cancelling the tag choice takes Tag! back and keeps the free perk');
  dlg = pick(FO.PERK.MUTATE);
  dlg.accept();
  ok(dlg.phase === 'lose' && dlg.list.length === 2, 'Mutate! first asks which trait to lose');
  dlg.sel = dlg.list.findIndex(it => it.id === FO.TRAIT.BRUISER);
  dlg.accept();
  ok(dlg.phase === 'pick' && d.traits[0] === FO.TRAIT.HEAVY_HANDED && d.traits[1] === -1 && !dlg.list.some(it => it.id === FO.TRAIT.BRUISER), 'the lost trait is gone and cannot be picked again');
  dlg.sel = dlg.list.findIndex(it => it.id === FO.TRAIT.GIFTED);
  dlg.accept();
  ok(d.traits[1] === FO.TRAIT.GIFTED && FO.statValue(d, S.ST) === 6 + 1, 'the new trait takes the free slot and changes stats at once');

  require(path.join(DIR, 'fo-panels.js'));
  const load = async name => FO.readMsg(await D.text(FO.textPath('GAME\\' + name + '.MSG')));
  const msgs = { SKILL: await load('SKILL'), MISC: await load('MISC'), PROTO: await load('PROTO') };
  const Sc = FO.Scripts.prototype;
  const sc = { time: FO.START_TIME, gvars: new Array(620).fill(0), events: [], w, rand: seeded(11) };
  for (const k of ['addEvent', 'eventsOf', 'allEvents', 'dropEvent', 'removeEvents', 'removeTimers', 'carried']) sc[k] = Sc[k];
  const heard = [];
  const play = {
    w, g: game, sc, say: s => heard.push(s), openSteal() {}, openLoot() {},
    text: (id, file) => { const e = msgs[file || 'PROTO'].get(id); return e ? e.text : ''; },
    passTime: n => { sc.time += n; },
    giveExp: n => FO.addExperience(d, n)
  };
  await FO.loadPremade(D, d, 'PREMADE\\BLANK');
  d.traits = [-1, -1];
  d.perks = {};
  d.critter.results = 0;
  const day = FO.gameTime;
  FO.gameTime = () => sc.time;
  const heals = [];
  for (let i = 0; i < 40; i++) {
    sc.rand = seeded(100 + i);
    d.critter.hp = 5;
    d.skillUseTimes = {};
    heard.length = 0;
    FO.skillUse(play, d, d, FO.SKILL.FIRST_AID, 0);
    if (d.critter.hp > 5) heals.push(d.critter.hp - 5);
  }
  ok(heals.length > 0 && heals.every(n => n >= 1 && n <= 5), 'First Aid heals 1-5 hit points without Healer: ' + [...new Set(heals)].sort().join(','));
  d.skillUseTimes = {};
  const t0 = sc.time;
  let used = 0;
  for (let i = 0; i < 6 && used < 3; i++) {
    sc.rand = seeded(500 + i);
    d.critter.hp = 5;
    heard.length = 0;
    const exp = d.exp;
    FO.skillUse(play, d, d, FO.SKILL.FIRST_AID, 0);
    if (d.critter.hp > 5) {
      used++;
      ok(d.exp - exp === 25 && heard.some(l => l === 'You earn 25 XP for honing your skills.'), 'a successful First Aid gives 25 experience');
    }
  }
  ok(sc.time > t0 && (sc.time - t0) % 1800 === 0, 'every First Aid attempt takes three minutes');
  d.critter.hp = 5;
  heard.length = 0;
  ok(used === 3 && FO.skillUse(play, d, d, FO.SKILL.FIRST_AID, 0) === -1 && d.critter.hp === 5 && /taxed|tired|strain/.test(heard[0]), 'the fourth healing within a day is refused');
  sc.time += 25 * 36000;
  ok(FO.skillUseSlot(d, FO.SKILL.FIRST_AID, sc.time) === 2, 'the oldest use frees its slot after 24 hours');
  d.critter.hp = FO.statValue(d, S.MAX_HP);
  d.critter.results = FO.DAM.CRIP_LEG_LEFT;
  d.skillUseTimes = {};
  let healed = false;
  for (let i = 0; i < 20 && !healed; i++) {
    sc.rand = seeded(900 + i);
    heard.length = 0;
    d.skillUseTimes = {};
    FO.skillUse(play, d, d, FO.SKILL.DOCTOR, 50);
    healed = !(d.critter.results & FO.DAM.CRIP_LEG_LEFT);
  }
  ok(healed && heard[0] === 'You heal your crippled left leg.' && (heard.includes('You heal 0 hit points.') || heard.includes('You fail to do any healing.')), 'Doctor heals a crippled limb and still rolls the hit point part on a healthy patient: ' + heard.join(' | '));
  const kit = { pid: 47, proto: game.protos.get(47), flags: 0, inventory: [], tile: -1, owner: d };
  w.inCombat = true;
  heard.length = 0;
  ok(FO.useKit(play, d, d, kit) === -1 && heard[0] === 'You cannot do that in combat.', 'medical kits cannot be used in combat');
  w.inCombat = false;
  ok(FO.useKit(play, d, d, { pid: 40 }) === null, 'other items are not kits');
  heard.length = 0;
  FO.skillUse(play, d, d, FO.SKILL.SCIENCE, 0);
  FO.skillUse(play, d, d, FO.SKILL.REPAIR, 0);
  FO.skillUse(play, d, d, FO.SKILL.TRAPS, 0);
  ok(heard.join('|') === 'You fail to learn anything.|You cannot repair that.|You fail to find any traps.', 'Science, Repair and Traps only print their failure lines when no script handles them');
  w.anim = w.anim || { cancel() {} };
  sc.rand = seeded(3);
  FO.toggleSneak(play);
  const working = d.sneakWorking;
  ok(FO.isSneaking(d) && sc.eventsOf(d, 'sneak').length === 1 && FO.isSneakWorking(d) === working, 'sneaking rolls the skill and queues a new roll in a minute');
  FO.toggleSneak(play);
  ok(!FO.isSneaking(d) && sc.eventsOf(d, 'sneak').length === 0 && !FO.isSneakWorking(d), 'turning sneak off drops the queued roll');
  sc.time = FO.START_TIME;
  let crits = 0;
  for (let i = 0; i < 200; i++) if (FO.rollVs(95, 100, seeded(i))[0] === FO.ROLL.CRIT_SUCCESS) crits++;
  sc.time = 864000 * 2;
  let late = 0;
  for (let i = 0; i < 200; i++) if (FO.rollVs(95, 100, seeded(i))[0] === FO.ROLL.CRIT_SUCCESS) late++;
  FO.gameTime = day;
  ok(crits === 0 && late > 150, 'no critical rolls during the first game day');
}

async function travel(D) {
  for (const m of ['fo-select', 'fo-automap', 'fo-pipboy', 'fo-worldmap', 'fo-prefs', 'fo-movie', 'fo-endgame', 'fo-saveload', 'fo-viewer', 'fo-play', 'fo-menu']) require(path.join(DIR, m + '.js'));
  const W = FO.EXE.worldmap;
  const DAY = FO.WM.DAY;
  const GV = FO.WM.GV;
  ok(W.towns.length === 12 && W.hotspots.length === 15 && W.blocked.length === 1500 && W.terrain.length === 840 && W.mapTown.length === 66, 'world map tables from FALLOUTW.EXE');
  const fresh = FO.newWorldMap();
  ok(fresh.x === 825 && fresh.y === 75 && fresh.known === 1 && fresh.entrances[0] === 1 && fresh.fog.length === 899, 'a new game starts at Vault 13 with only the vault known');
  ok(FO.wmTownAt(825, 75) === 0 && FO.wmTownAt(1275, 75) === 1 && FO.wmTownAt(800, 75) === 0 && FO.wmTownAt(799, 75) === -1, 'towns occupy one 50 pixel tile');
  ok(FO.wmBlocked(100, 700) && !FO.wmBlocked(300, 700) && !FO.wmBlocked(100, 0) && !FO.wmBlocked(1100, 700), 'the ocean bitmap blocks travel west of the coast');
  ok(FO.wmTerrain(25, 25) === 1 && FO.wmTerrain(1375, 1475) === 0 && FO.wmTerrain(25, 1475) === 3 && FO.wmRegion(25, 25) === 11, 'terrain and region tiles');

  const skill = FO.skillValue;
  const trip = FO.newTrip(fresh);
  const speed = (outdoors, pathfinder) => {
    FO.skillValue = () => outdoors;
    FO.wmSpeed(trip, { dude: true, perks: { [FO.PERK.PATHFINDER]: pathfinder } });
    return trip.checkSteps + '/' + trip.stepTime;
  };
  ok(speed(0, 0) === '60/14400' && speed(50, 0) === '89/9707' && speed(150, 0) === '119/7260' && speed(0, 1) === '60/10800', 'steps per encounter check and ticks per step follow Outdoorsman with the float rounding of 0.01, Pathfinder cuts the step time');
  FO.skillValue = skill;

  const at = { x: 10, y: 10 };
  const line = FO.newTrip(at);
  FO.wmLine(line, at, 12, 15);
  const steps = [];
  while (FO.wmStep(line, at)) steps.push(at.x + ',' + at.y);
  ok(steps.join(' ') === '11,11 11,12 12,13 12,14 12,15', 'steep world map lines step sideways early like the EXE: ' + steps.join(' '));

  const fog = FO.newWorldMap();
  FO.wmReveal(fog, false);
  const seen = [...fog.fog].filter(v => v === 1).length;
  ok(FO.wmFog(fog, 16, 1) === 2 && seen === 8 && FO.wmFog(fog, 18, 1) === 0, 'the current tile is visited and its neighbours seen');
  fog.x = 825;
  fog.y = 525;
  FO.wmReveal(fog, true);
  ok(FO.wmFog(fog, 18, 12) === 1 && FO.wmFog(fog, 14, 8) === 1 && FO.wmFog(fog, 19, 10) === 0, 'the Scout perk widens the view to five tiles');
  fog.x = 21 * 50 + 10;
  fog.y = 29 * 50 + 10;
  FO.wmReveal(fog, false);
  ok(FO.wmFog(fog, 0, 29) === 2 && FO.wmFog(fog, 20, 29) === 2, 'standing at the coast reveals the ocean to the west');

  const g = {
    data: D, art: new FO.Art(D), protos: new FO.Protos(D), prefs: {}, scr: new FO.Screen(640, 480), mouse: { x: 0, y: 0, inside: false, down: 0 }, keys: new Set(), opts: {}, now: 0,
    active: () => true,
    setMode(m) {
      if (this.mode && this.mode.leave) this.mode.leave();
      this.mode = m;
      return m && m.enter ? m.enter() : null;
    }
  };
  await g.art.init();
  await g.protos.init();
  const world = await FO.newWorld(g);
  const sc = new FO.Scripts(g, world);
  await sc.init();
  const play = new FO.Play(g, world, sc);
  g.play = play;
  await g.setMode(play);
  await play.start('V13ENT', -1, -1, -1);
  const wm = world.wm;
  const midnight = sc.events.find(t => t.kind === 'midnight');
  ok(midnight && midnight.at === DAY, 'map loads schedule the next midnight: ' + (midnight && midnight.at));
  const sync = FO.newWorldMap();
  FO.wmSync(sync, sc.gvars, FO.START_TIME);
  const e = sync.entrances;
  ok(sync.known === 3 && FO.wmFog(sync, 25, 1) === 1 && e[7] === 1 && [e[0], e[1], e[2], e[3]].join() === '1,0,0,0', 'Vault 15 is marked from its global and only the cave entrance of Vault 13 is open on the first day');
  FO.wmSync(sync, sc.gvars, DAY * 2);
  ok([e[0], e[1], e[2], e[3]].join() === '1,1,1,1', 'the vault levels open on the town map after the first day');

  const rand = FO.combatRand;
  const queue = list => (a, b) => (list.length ? list.shift() : a);
  FO.combatRand = (a, b) => a;
  const road = { x: 625, y: 625 };
  ok(FO.wmEncounterRoll(road) && !FO.wmEncounterRoll({ x: 825, y: 75 }), 'a low 3d6 meets an encounter outside towns');
  FO.combatRand = (a, b) => b;
  ok(!FO.wmEncounterRoll(road), 'a high 3d6 passes quietly');
  const lucky = { dude: true, pid: FO.DUDE_PID, stats: FO.defaultDudeStats(), perks: {}, traits: [-1, -1], critter: {} };
  const specials = { specials: 0 };
  FO.combatRand = queue([6, 6, 6, 100, 6, 6, 6, 100, 85]);
  ok(FO.wmSpecialRoll(specials, lucky) === 5 && FO.wmSpecialRoll(specials, lucky) === 4 && specials.specials === 0x30, 'special encounters need 18 on 3d6 + LK - 5 and reroll ranges already used');

  await play.openWorldMap(false);
  const screen = g.mode;
  ok(screen instanceof FO.WorldMapScreen && !world.map && world.states.has('V13ENT') && screen.standing && screen.viewX === 825 - 247 && screen.viewY === 0, 'leaving for the world map saves the cave and centers the view on the dude');
  ok(FO.wmKnown(wm, 1) && !FO.wmKnown(wm, 2), 'the world map knows Vault 13 and Vault 15');
  FO.combatRand = (a, b) => b;
  const start = sc.time;
  screen.townButton(2);
  ok(!screen.moving, 'unknown towns ignore their button');
  screen.townButton(1);
  ok(screen.moving && screen.toTown, 'a known town button starts the trip');
  let frames = 0;
  while (screen.moving && frames < 5000) {
    screen.tick();
    frames++;
  }
  const spent = sc.time - start;
  ok(!screen.moving && screen.standing && FO.wmTownAt(wm.x, wm.y) === 1 && spent > DAY * 3, 'the dude walks to Vault 15 and stops there: ' + frames + ' frames, ' + (spent / DAY).toFixed(2) + ' days');
  ok(sc.gvars[GV.VAULT_WATER] === 150 - Math.floor(sc.time / DAY) && sc.events.filter(t => t.kind === 'midnight').length === 1, 'every midnight on the road costs the vault a day of water: ' + sc.gvars[GV.VAULT_WATER]);
  ok(FO.wmFog(wm, 25, 1) === 2 && FO.wmFog(wm, 20, 1) >= 1 && screen.trail.every(b => b === 0), 'the road is revealed and the trail is cleared on arrival');

  g.mouse.x = screen.x + wm.x - screen.viewX + 22;
  g.mouse.y = screen.y + wm.y - screen.viewY + 21;
  g.mouse.inside = true;
  ok(screen.overDude(), 'the marker reacts to the mouse');
  screen.mouseDown(g.mouse, 0);
  ok(screen.enterTown && screen.target === 1, 'clicking the standing dude enters the town');
  screen.tick();
  ok(screen.anim && screen.anim.kind === 'enter', 'entering shows the pressed marker first');
  screen.animate(400);
  const townMap = screen.top();
  ok(townMap instanceof FO.TownMapScreen && townMap.town === 1 && townMap.spots.length === 1 && townMap.spots[0].k === 0, 'Vault 15 shows its one known entrance on the town map');
  townMap.finish({ mode: 2, town: 1, entrance: 0 });
  const settle = async () => {
    for (let i = 0; i < 1000 && (g.mode !== play || play.busy); i++) await new Promise(r => setImmediate(r));
  };
  await settle();
  ok(world.map && world.map.name === 'VAULTENT' && sc.gvars[GV.LOAD_MAP_INDEX] === 0 && g.mode === play && wm.town === 1, 'the chosen entrance loads its map with its LOAD_MAP_INDEX');

  await play.openWorldMap(false);
  const second = g.mode;
  FO.combatRand = (a, b) => a;
  FO.wmLine(second.trip, wm, wm.x - 200, wm.y + 150);
  second.moving = true;
  second.standing = false;
  frames = 0;
  while (!second.encounter && frames < 2000) {
    second.tick();
    frames++;
  }
  ok(second.encounter && !second.special && !second.moving, 'a low roll stops the trip for a random encounter after ' + frames + ' frames');
  second.tick();
  ok(second.anim && second.anim.kind === 'blink', 'the encounter marker blinks before the map loads');
  second.animate(14 * 199 + 1);
  await settle();
  const maps = Object.values(FO.EXE.encounterMaps).flat();
  ok(maps.includes(world.map.name) && sc.gvars[GV.LOAD_MAP_INDEX] === 2 && sc.gvars[GV.WORLD_TERRAIN] === FO.wmRegion(wm.x, wm.y), 'the encounter loads a terrain map with LOAD_MAP_INDEX 2 and WORLD_TERRAIN: ' + world.map.name);
  const encounter = world.map.name;
  FO.combatRand = rand;

  const before = sc.time;
  await play.goto('V13ENT', -1, -1, -1);
  ok(!world.states.has(encounter) && world.states.has('VAULTENT'), 'random encounter maps are not kept');
  ok(FO.wmTownAt(wm.x, wm.y) === 0 && sc.time - before > DAY, 'a map change into another town walks the world map position there and spends the travel time: ' + ((sc.time - before) / DAY).toFixed(2) + ' days');

  const d = world.dude;
  const near = [0, 1, 2, 3, 4, 5].map(dir => FO.hexStep(d.tile, dir)).find(t => t >= 0 && !world.blocker(t, d.elev, null));
  const ian = sc.createObject(0x100004C, near, d.elev);
  const ianIndex = sc.list.findIndex(x => /^ian\.int$/i.test(x.name));
  sc.attach(ian, ianIndex, null, null);
  ian.script.lvars[0] = 42;
  world.party = [ian];
  const rat = world.map.byElev[0].find(o => o.pid === 0x1000030);
  const ratTile = rat.tile;
  rat.critter.results |= FO.DAM.DEAD;
  const flare = sc.createObject(205, near, d.elev);
  sc.addEvent(flare, 600, 'flare');
  sc.addTimer(rat, 600, 1);
  await play.goto('VAULT13', -1, -1, -1);
  const cave = world.states.get('V13ENT');
  ok(world.map.name === 'VAULT13' && world.map.byElev[ian.elev].includes(ian) && ian.tile === near && ian.script.lvars[0] === 42 && world.map.scriptList.includes(ian.script) && !cave.scriptList.includes(ian.script), 'party members keep their tile and script when the map changes');
  ok(flare.destroyed && !(cave.timers || []).some(t => t.obj === rat), 'leaving a map burns out flares and drops script timers');
  world.party = [];
  cave.savedAt = sc.time - 7 * DAY;
  await play.goto('V13ENT', -1, -1, -1);
  const remains = world.map.byElev[0].find(o => o.pid === 0x5000004 && o.tile === ratTile);
  ok(remains && !world.map.byElev[0].includes(rat) && remains.frame >= 0 && remains.frame <= 8, 'after six days dead critters turn into remains');

  const door = world.map.byElev[0].find(o => world.isDoor(o));
  door.openFlags = (door.openFlags | 0) | FO.JAMMED;
  sc.gvars[GV.VAULT_WATER] = 101;
  ok(FO.midnight(play) && world.movies.has(11) && sc.gvars[GV.VAULT_WATER] === 100 && !(door.openFlags & FO.JAMMED), 'midnight unjams locks and warns when the water runs low');
  sc.gvars[GV.VAULT_WATER] = 1;
  FO.midnight(play);
  ok(play.gameOver && world.movies.has(6), 'the last day of water ends the game');
  play.gameOver = false;
  sc.gvars[GV.VAULT_WATER] = 100;

  const exp = d.exp;
  sc.gvars[GV.VATS_TIMER] = sc.time - 2500;
  const blast = FO.wmTimed(play);
  ok(blast && !blast.home && d.exp - exp >= 10000 && sc.gvars[GV.VATS_BLOWN] === 1 && sc.gvars[GV.VATS_DONE] === 2 && !sc.gvars[GV.VATS_TIMER] && sc.gvars[GV.REPUTATION] === 5 && world.movies.has(3), 'the Vats explode four minutes after the timer starts');
  ok(FO.wmCrater(play, 'MBENT') === 'MBDEAD' && FO.wmCrater(play, 'CHILDRN1') === 'CHILDRN1', 'the military base becomes a crater after the Vats');

  d.critter.hp = 1;
  d.restTicks = 0;
  play.passTime(180 * 600 - 1, true);
  const rested = d.critter.hp;
  play.passTime(1, true);
  ok(rested === 1 && d.critter.hp === 1 + FO.statValue(d, FO.STAT.HEAL_RATE), 'resting heals once every three hours');
}

async function audio(D) {
  const fnv = a => {
    let x = 2166136261 >>> 0;
    for (let i = 0; i < a.length; i++) {
      x ^= a[i] & 0xFFFF;
      x = Math.imul(x, 16777619) >>> 0;
    }
    return x.toString(16);
  };
  const decode = async p => FO.decodeAcm(await D.get(p));
  const ammo = await decode('SOUND\\SFX\\AMMO.ACM');
  ok(ammo.samples.length === 15345 && ammo.channels === 1 && ammo.rate === 22050 && fnv(ammo.samples) === '6ee33f47', 'ACM sound effects decode like the ffmpeg reference');
  const talk = await decode('SOUND\\SPEECH\\ARDSH\\ARA_10.ACM');
  ok(talk.samples.length === 308119 && fnv(talk.samples.subarray(0, 308118)) === 'f1b7ab59', 'ACM speech decodes like the ffmpeg reference');
  const click = await decode('SOUND\\SFX\\BUTIN1.ACM');
  ok(fnv(click.samples) === '29cdc598', 'out of range packed indices read zero like the zero-filled tables of the original decoder');
  const music = new FO.AcmDecoder(await D.get('SOUND\\MUSIC\\03WRLDMP.ACM'));
  ok(music.channels === 2 && music.total === 8078854 && music.level === 7 && music.rows === 16, 'music headers are stereo 22050 Hz streams');
  const close = (a, b) => Math.abs(a - b) < 1e-4;
  ok(FO.volumeGain(32767) === 1 && close(FO.volumeGain(16384), Math.pow(10, -999 / 2000)) && close(FO.volumeGain(22281), Math.pow(10, -556 / 2000)) && FO.volumeGain(0) === 1e-5, 'volumes follow the DirectSound conversion of the EXE: -1000 * log2(32767 / v) hundredths of a dB');

  const A = FO.ANIM;
  ok(FO.critterSuffix(A.DODGE, 0) === 'an' && FO.critterSuffix(A.DODGE, 5) === 'he' && FO.critterSuffix(A.THROW, 1) === 'dm' && FO.critterSuffix(A.THROW, 4) === 'gm' && FO.critterSuffix(A.THROW, 5) === 'as', 'armed dodges and throws use the art codes of the EXE');
  const g = { data: D, art: new FO.Art(D), protos: new FO.Protos(D), prefs: {} };
  await g.art.init();
  await g.protos.init();
  const snd = new FO.Sound(g);
  snd.ctx = {};
  snd.cached = () => Promise.resolve(null);
  const critter = (index, weapon) => ({ fid: FO.fid(FO.ART.CRITTER, index, 0, weapon || 0), pid: 0x01000002 });
  const male = critter(11);
  const female = critter(4);
  ok(FO.sfxArt(g, male, A.HIT_FRONT, 0) === 'HMJMPSAO' && snd.sfxPath('HMJMPSAO', male) === 'SOUND\\SFX\\HMXXXXAO.ACM', 'critter sounds fall back to the shared human set');
  ok(FO.sfxArt(g, female, A.FALL_FRONT, FO.SFX_EXTRA.DIE) === 'HFJMPSZB' && snd.sfxPath('HFJMPSAN', female) === 'SOUND\\SFX\\HMXXXXAN.ACM', 'death screams use Z and missing female sounds use the male ones');
  ok(FO.sfxArt(g, male, A.PUNCH, FO.SFX_EXTRA.CONTACT) === 'HMJMPSZQ' && FO.sfxArt(g, male, A.TAKE_OUT, 5) === 'HMJMPSHC' && FO.sfxArt(g, male, A.TAKE_OUT, 0) === null, 'punch contact and weapon take out names');
  ok(snd.sfxPath('MAMTN2AO', null) === 'SOUND\\SFX\\MAMTNTAO.ACM' && snd.sfxPath('MAMTN2AA', null) === 'SOUND\\SFX\\MAMTN2AA.ACM', 'super mutant variants borrow the MAMTNT set');
  const pistol = { pid: 8, fid: -1, proto: g.protos.get(8) };
  ok(FO.sfxWeapon(g, 1, pistol, 2, null) === 'WAA1XXX1' && FO.sfxWeapon(g, 4, pistol, 2, male) === 'WHA1FXX1' && FO.sfxWeapon(g, 0, pistol, 3, null) === 'WRA1XXX1' && FO.sfxWeapon(g, 1, null, 4, null) === 'WA', 'weapon sounds: effect letter, sound code, mode digit and target material');
  const wooden = { pid: 0x2000002, fid: FO.fid(FO.ART.SCENERY, 1), proto: g.protos.get(0x2000002) };
  const locker = { pid: 132, fid: FO.fid(FO.ART.ITEM, 1), proto: g.protos.get(132) };
  ok(FO.sfxOpen(g, wooden, FO.SFX_OPEN.OPEN) === 'SODOORSD' && FO.sfxOpen(g, wooden, FO.SFX_OPEN.LOCKED) === 'SLDOORSD' && FO.sfxOpen(g, locker, FO.SFX_OPEN.CLOSE) === 'ICCNTNRB', 'door and container sounds come from the proto sound codes');
  ok(FO.sfxPickup(g, { fid: FO.fid(FO.ART.ITEM, 1) }) === 'AMMO' && FO.sfxAmbient('wind') === 'A  WIND1' && FO.sfxItem('rad') === 'N   RAD1' && FO.sfxScenery(1, 0, 'ab') === 'SPO  AB1', 'pickup, ambient, item and scenery names');
  const handles = [1, 2, 3, 4].map(() => snd.load('AMMO'));
  ok(handles.every(Boolean) && !snd.load('AMMO') && snd.effects === 4, 'only four sound effects can be loaded at once');
  snd.free(handles[0]);
  const again = snd.load('AMMO');
  snd.play(handles[1]);
  snd.free(handles[1]);
  ok(again && snd.effects === 4 && handles[1].state === 1, 'freeing an unplayed effect frees its slot, a playing one stays');
  await new Promise(r => setTimeout(r, 0));
  ok(snd.effects === 3 && !snd.load('NOSUCH'), 'effects that fail to decode release their slot and missing files load nothing');
  const harry = await FO.loadLip(g, 'HARRY', 'HARRY_10');
  const lip = { data: harry, index: 0, phoneme: harry.phonemes[0], ended: false };
  const seen = harry.markers.slice(0, 6).map(m => FO.lipStep(lip, m.pos + 1));
  ok(FO.PHONEME_FRAMES.length === 42 && seen.join() === Array.from(harry.phonemes.slice(0, 6)).join() && !lip.ended, 'lip sync shows the phoneme of the last passed marker');
  FO.lipStep(lip, harry.markers[harry.markers.length - 1].pos + 1);
  ok(lip.ended && lip.index === 0 && lip.phoneme === harry.phonemes[0] && FO.LIP_VOLUME === 22609, 'passing the last marker closes the mouth; speech plays at 0.69 volume');

  const slides = gv => FO.endgameSteps(gv).map(s => (s.pan ? 'pan' + s.pan : s.art) + ':' + s.nar).join(' ');
  ok(slides([]) === 'pan1:NAR_10 323:NAR_19 316:NAR_25 318:NAR_28 320:NAR_37 pan-1:NAR_40', 'an ending with nothing done: ' + slides([]));
  const won = [];
  Object.assign(won, { 51: 1, 13: 1, 7: 1, 12: 1, 15: 1, 108: 2, 250: 1, 14: 1, 69: 2, 114: 1, 115: 5 });
  ok(slides(won) === 'pan1:NAR_11 311:NAR_15 314:NAR_18 324:NAR_23 317:NAR_27 319:NAR_29 326:NAR_34 320:NAR_35 pan-1:NAR_40', 'the ending slides follow the global variables like the EXE: ' + slides(won));
  const mixed = [];
  Object.assign(mixed, { 30: 1, 31: 2, 132: 1, 26: 1, 604: 1, 104: 2, 606: 1, 69: 3, 115: 4 });
  ok(slides(mixed) === 'pan1:NAR_10 312:NAR_13 313:NAR_16 324:NAR_22 315:NAR_24 318:NAR_28 325:NAR_32 320:NAR_36 pan-1:NAR_40', 'other branches of the ending: ' + slides(mixed));
  ok(FO.subtitleTimes(['abcd', 'ef'], 3).join() === '2000,3000' && FO.subtitleTimes(['abcd', 'ef'], 0).join() === '320,480', 'narration subtitles split the rounded-up speech length by characters, or 0.08 s per character');
  ok(FO.readNarration('1:Hello there\r\n2:World\r\n').join('|') === 'Hello there|World', 'narration text files list numbered lines');
}

async function objects(D) {
  const g = {
    data: D, art: new FO.Art(D), protos: new FO.Protos(D), prefs: {}, scr: new FO.Screen(640, 480), mouse: { x: 0, y: 0, inside: false, down: 0 }, keys: new Set(), opts: {}, now: 0,
    active: () => true,
    setMode(m) {
      this.mode = m;
      return m && m.enter ? m.enter() : null;
    }
  };
  const loads = [];
  const ui = [];
  g.audio = { load: name => (loads.push(name), { name }), play() {}, free() {}, sfx: name => ui.push(name), playMusic() {}, stopMusic() {} };
  await g.art.init();
  await g.protos.init();
  const world = await FO.newWorld(g);
  const sc = new FO.Scripts(g, world);
  await sc.init();
  const play = new FO.Play(g, world, sc);
  g.play = play;
  await g.setMode(play);
  await play.start('VAULT13', -1, -1, -1);
  const w = world;
  const d = w.dude;
  const said = [];
  play.say = s => said.push(s);
  const looted = [];
  play.openLoot = o => looted.push(o);
  const run = async (test, n) => {
    for (let i = 0; i < (n || 600) && !test(); i++) {
      w.anim.update(50);
      await new Promise(r => setImmediate(r));
    }
  };
  const all = w.map.byElev[d.elev];
  const box = all.find(o => w.itemType(o) === FO.ITEM.CONTAINER && !o.script && !w.locked(o) && o.frame === 0 && o.proto.pid >= 128 && o.proto.pid <= 139);
  ok(!!box, 'a plain locker or footlocker on the map');
  w.place(d, box.tile + 1, d.elev);
  await play.getObject(d, box);
  await run(() => looted.length > 0);
  const name = g.protos.name(box.pid);
  ok(looted[0] === box && box.frame !== 0 && said.includes('You search the ' + name + '.') && loads.includes(FO.sfxOpen(g, box, FO.SFX_OPEN.OPEN)), 'getting a closed container opens it with its sound and message, then loots it');
  await play.getObject(d, box);
  await run(() => box.frame === 0 && !w.anim.busy(box));
  ok(looted.length === 1 && said.includes('You close the ' + name + '.') && loads.includes(FO.sfxOpen(g, box, FO.SFX_OPEN.CLOSE)), 'getting an open container only closes it');
  const ammo = w.adopt({ id: w.newId(), pid: 40, fid: FO.fid(FO.ART.ITEM, 1), tile: -1, elev: d.elev, rot: 0, frame: 0, flags: 0, x: 0, y: 0, lightRadius: 0, lightIntensity: 0, sid: -1, inventory: [] }, d.elev, null);
  w.add(ammo, d.tile, d.elev);
  await play.getObject(d, ammo);
  await run(() => ammo.owner === d);
  ok(ammo.owner === d && loads.includes('AMMO'), 'picking up an item plays the sound named after its ground art');
  const door = all.find(o => w.isDoor(o) && !w.locked(o) && o.frame === 0 && !o.script && g.protos.name(o.pid) === 'Security Door');
  const npc = all.find(o => FO.pidType(o.pid) === FO.PID.CRITTER && !o.dude && !w.isDead(o) && (o.proto.body | 0) === 0);
  ok(door && npc && w.canUseDoor(npc, door) && !w.canUseDoor(d, door), 'people can open doors on their way, the player cannot');
  const free = t => t >= 0 && !w.blocker(t, door.elev, npc);
  const k = [0, 1, 2].find(i => free(FO.hexStep(door.tile, i)) && free(FO.hexStep(door.tile, i + 3)));
  const a = FO.hexStep(door.tile, k);
  const b = FO.hexStep(door.tile, k + 3);
  w.anim.cancel(npc);
  w.place(npc, a, door.elev);
  const path = w.findPath(npc, b, 0);
  ok(k !== undefined && path && path.includes(door.tile) && !w.findPath(d, door.tile, 0), 'their paths lead through closed doors: ' + (path && path.join(',')));
  let walked = null;
  w.anim.run([{ kind: 'move', obj: npc, tile: b, done: r => { walked = r; } }]);
  await run(() => walked !== null && !w.anim.busy(door));
  ok(walked === true && npc.tile === b && door.frame !== 0 && loads.includes(FO.sfxOpen(g, door, FO.SFX_OPEN.OPEN)), 'a walker opens the door with its sound and steps in');
}

async function saves(D) {
  const g = {
    data: D, art: new FO.Art(D), protos: new FO.Protos(D), prefs: {}, scr: new FO.Screen(640, 480), mouse: { x: 0, y: 0, inside: false, down: 0 }, keys: new Set(), opts: {}, now: 0,
    active: () => true,
    setMode(m, entered) {
      if (this.mode && this.mode.leave) this.mode.leave();
      this.mode = m;
      return m && m.enter && !entered ? m.enter() : null;
    },
    text(s, x, y, c, f) {
      const font = this.fonts[f === undefined ? 101 : f];
      return font ? font.draw(this.scr, s, x, y, c, this.colors) : x;
    }
  };
  const ui = [];
  const music = [];
  g.audio = { load: name => ({ name }), play() {}, free() {}, sfx: name => ui.push(name), playMusic: name => music.push(name), stopMusic() {}, apply() {} };
  await g.art.init();
  await g.protos.init();
  g.fonts = await FO.loadFonts(D);
  g.colors = new FO.Colors(FO.readPal(await D.get('COLOR.PAL')));
  const until = async (test, n) => {
    for (let i = 0; i < (n || 4000) && !test(); i++) {
      if (g.colors.fadeJob) g.colors.stepFade(50);
      await new Promise(r => setImmediate(r));
    }
    return test();
  };
  const S = FO.SAVE.STATE;
  const K = FO.SAVE_KIND;

  const src = new Uint8Array(640 * 380).map((_, i) => ((i % 640) + Math.floor(i / 640)) & 0xFF);
  const thumb = FO.scaleThumb(src, 640, 380, 640);
  ok(thumb.length === 224 * 133 && thumb[0] === 4 && thumb[223] === 0 && thumb[132 * 224] === 0, 'the thumbnail scaler keeps one source pixel per step and never reaches the last column and row, like FALLOUTW.EXE');
  ok(FO.slotClock(FO.START_TIME) === 824 && FO.slotClock(FO.START_TIME + 36000 * 16) === 24, 'slot times show the hour and minute of the game clock');
  const mapMsg = FO.readMsg(await D.text(FO.textPath('GAME\\MAP.MSG')));
  ok(FO.EXE.mapPlaces.length === 66 && FO.slotPlace(mapMsg, { map: 3, elev: 0 }).startsWith('Necropolis'), 'slot locations use the place table of FALLOUTW.EXE: ' + FO.slotPlace(mapMsg, { map: 3, elev: 0 }));

  const world = await FO.newWorld(g);
  const sc = new FO.Scripts(g, world);
  await sc.init();
  const play = new FO.Play(g, world, sc);
  g.play = play;
  await g.setMode(play);
  await play.start('V13ENT', -1, -1, -1);
  await play.goto(world.mapIndex('VAULT13'), -1, -1, -1);
  const w = world;
  const d = w.dude;
  ok(w.map.name === 'VAULT13' && w.states.has('V13ENT'), 'the cave is kept after walking into the vault');
  let spot = -1;
  for (let dir = 0; dir < 6 && spot < 0; dir++) {
    const t = FO.hexStep(d.tile, dir);
    if (t >= 0 && !w.blocker(t, d.elev, d)) spot = t;
  }
  w.moveTo(d, spot, d.elev);
  d.rot = 4;
  d.critter.hp = Math.max(1, d.critter.hp - 5);
  d.kills = { 3: 2 };
  const ammo = w.adopt({ id: w.newId(), pid: 40, fid: FO.fid(FO.ART.ITEM, 1), tile: -1, elev: d.elev, rot: 0, frame: 0, flags: 0, x: 0, y: 0, lightRadius: 0, lightIntensity: 0, sid: -1, inventory: [] }, d.elev, d);
  d.inventory.push({ count: 7, obj: ammo });
  sc.gvars[20] = 4321;
  if (w.map.gvars.length) w.map.gvars[0] = 77;
  const scripted = w.map.scriptList.find(s => s.self && s.lvars.length && !s.self.dude);
  scripted.lvars[0] = 9876;
  sc.addTimer(scripted.self, 3000, 5);
  sc.addEvent(d, 900, 'sneak');
  w.wm.x = 900;
  w.movies.add(9);
  const facts = p => {
    const pw = p.w;
    const pd = pw.dude;
    const ids = st => st.byElev.map(l => l.map(o => o.id).sort((a, b) => a - b).join(',')).join('|');
    const cave = pw.states.get('V13ENT');
    const s = pw.map.scriptList.find(x => x.self && x.self.id === scripted.self.id);
    return {
      map: pw.map.name, elev: pw.elev, tile: pd.tile, rot: pd.rot, hp: pd.critter.hp, kills: JSON.stringify(pd.kills),
      inv: pd.inventory.map(e => e.obj.pid + 'x' + e.count + '@' + e.obj.id).join(','),
      time: p.sc.time, gvars: p.sc.gvars.join(','), mvars: pw.map.gvars.join(','), lvar: s ? s.lvars[0] : null, scripts: pw.map.scriptList.length,
      timers: (pw.map.timers || []).map(t => t.at + ':' + (t.obj ? t.obj.id : 0) + ':' + t.fixed).join(','),
      events: p.sc.events.map(t => t.kind + ':' + t.at + ':' + (t.obj ? t.obj.id : 0)).sort().join(','),
      here: ids(pw.map), cave: cave ? ids(cave) : '', caveScripts: cave && cave.scriptList ? cave.scriptList.length : -1,
      wm: JSON.stringify(pw.wm), movies: [...pw.movies].join(','), walked: FO.toBase64(pw.walked)
    };
  };
  const before = facts(play);
  const data = JSON.parse(JSON.stringify(FO.saveData(play)));
  music.length = 0;
  const loaded = await FO.loadGameData(g, data);
  const after = facts(loaded);
  ok(g.mode === loaded && g.play === loaded && loaded !== play && loaded.w !== world, 'loading builds a new world and switches to it');
  const diff = Object.keys(before).filter(k => before[k] !== after[k]);
  ok(diff.length === 0, 'a save restores position, stats, inventory, variables, timers, other maps and the world map: ' + diff.map(k => k + ' ' + String(before[k]).slice(0, 80) + ' / ' + String(after[k]).slice(0, 80)).join('; '));
  const ld = loaded.w.dude;
  const item = ld.inventory[ld.inventory.length - 1].obj;
  const ls = loaded.w.map.scriptList.find(x => x.self && x.self.id === scripted.self.id);
  ok(item.owner === ld && item.proto && ls.self.script === ls && loaded.w.at(ld.tile, ld.elev).includes(ld) && loaded.sc.host === loaded, 'restored objects are linked to owners, prototypes, scripts and the tile index');
  ok(music[0] === 'WIND2' && music.includes(FO.EXE.mapMusic[loaded.w.map.index]), 'loading plays the map loading music, then the map music');

  loaded.combat.run(null);
  ok(await until(() => loaded.combat.dudeTurn()), 'combat starts on the player turn');
  const fight = JSON.parse(JSON.stringify(FO.saveData(loaded)));
  ui.length = 0;
  const fought = await FO.loadGameData(g, fight);
  ok(await until(() => fought.combat.dudeTurn()), 'a game saved in combat waits for the player again');
  ok(fought.w.inCombat && fought.combat.list.map(o => o.id).join() === loaded.combat.list.map(o => o.id).join() && fought.combat.current === fought.w.dude && fought.iface.combatFrame === 4 && ui.includes('iciboxx1'), 'combat resumes with the same order and the combat panel already open');

  const host = g.play;
  const empty = await FO.slotList(g);
  ok(empty.length === 10 && empty.every(s => s.state === S.EMPTY), 'ten empty slots in a new store');
  g.saveCursor = 0;
  let rc = null;
  const open = async (kind) => {
    rc = null;
    const screen = new FO.SaveLoadScreen(host, kind, r => { rc = r; });
    host.openModal(screen);
    await until(() => screen.ready);
    return screen;
  };
  const key = (screen, code, k) => screen.keyDown({ code, key: k || '', ctrlKey: false });
  const type = (screen, text) => { for (const ch of text) key(screen, 'Key', ch); };
  const save = await open(K.SAVE);
  ok(save.snapshot && save.snapshot.length === 224 * 133 && save.snapshot.some(v => v !== 0), 'opening the save screen grabs a thumbnail of the map');
  save.draw(g.scr);
  key(save, 'End');
  const end = g.saveCursor;
  key(save, 'Home');
  key(save, 'ArrowUp');
  ok(end === 9 && g.saveCursor === 0, 'Home and End jump to the first and last slot, arrows stop at the ends');
  key(save, 'Enter');
  const box = save.child;
  ok(box && box.value === '', 'an empty slot asks for a description');
  type(save, 'Cave {1}');
  ok(box.value === 'Cave 1', 'the description takes characters from space to z only: ' + box.value);
  type(save, 'x'.repeat(30));
  ok(box.value.length === 29, 'descriptions hold 29 characters');
  for (let i = 0; i < 23; i++) key(save, 'Backspace');
  box.update(0.041 * 3);
  ok(box.value === 'Cave 1' && box.shown, 'the cursor blinks on after three 41 ms frames');
  save.draw(g.scr);
  key(save, 'Enter');
  ok(await until(() => rc !== null) && rc === 1 && !host.modals.includes(save), 'saving closes the screen');
  let slots = await FO.slotList(g);
  ok(slots[0].state === S.VALID && slots[0].header.description === 'Cave 1' && slots[0].header.name === host.w.dude.name && slots[0].thumb.length === 224 * 133, 'the slot keeps the description, the name and the thumbnail');

  const again = await open(K.SAVE);
  key(again, 'Enter');
  ok(again.child instanceof FO.MessageBox && again.child.o.yesNo && again.child.o.title === 'Save game already exists, overwrite?', 'a used slot asks before overwriting');
  again.child.done(true);
  ok(again.child && again.child.value === 'Cave 1', 'the description box starts with the old description');
  key(again, 'Backspace');
  type(again, '2');
  key(again, 'Enter');
  await until(() => rc !== null);
  slots = await FO.slotList(g);
  ok(rc === 1 && slots[0].header.description === 'Cave 2', 'overwriting replaces the slot');

  const pick = await open(K.SAVE);
  g.mouse = { x: 100, y: 87 + 3 * 34 + 5, inside: true, down: 0 };
  pick.mouseDown(g.mouse, 0);
  pick.mouseUp(g.mouse, 0);
  ok(g.saveCursor === 3 && !pick.child, 'a click on the list selects the slot');
  ui.length = 0;
  pick.mouseDown(g.mouse, 0);
  pick.mouseUp(g.mouse, 0);
  ok(pick.child && pick.child.value === '' && ui.includes('ib1p1xx1'), 'a second click on the same slot is a double click');
  key(pick, 'Escape');
  ok(!pick.child && host.modals.includes(pick), 'cancelling the description keeps the screen');
  g.mouse = { x: 40, y: 58 + 14 + 5, inside: true, down: 1 };
  pick.mouseDown(g.mouse, 0);
  const steps = [g.saveCursor];
  pick.update(0.5);
  steps.push(g.saveCursor);
  pick.update(0.08);
  steps.push(g.saveCursor);
  pick.update(0.2);
  steps.push(g.saveCursor);
  g.mouse = { x: 300, y: 300, inside: true, down: 1 };
  pick.update(1);
  steps.push(g.saveCursor);
  pick.mouseUp(g.mouse, 0);
  ok(steps.join() === '4,4,5,6,6', 'the arrow moves once, repeats after 14 frames at 5 then 6 a second, and stops when the pointer leaves: ' + steps.join());
  key(pick, 'Escape');
  ok(rc === 0 && !host.modals.includes(pick), 'Escape cancels the screen');

  const store = FO.saveStore(g);
  await store.write(7, { header: { version: 0 } }, {});
  await store.write(8, { thumb: '' }, {});
  slots = await FO.slotList(g);
  ok(slots[7].state === S.OLD && slots[8].state === S.CORRUPT && slots[1].state === S.EMPTY, 'old and broken records are marked');
  const load = await open(K.LOAD);
  load.draw(g.scr);
  g.saveCursor = 1;
  key(load, 'Enter');
  ok(!load.child && !load.busy, 'an empty slot does nothing in the load screen');
  g.saveCursor = 7;
  key(load, 'Enter');
  ok(load.child instanceof FO.MessageBox && load.child.o.lines.join('|') === 'Save game file is an older version.|Unable to load game.', 'an old save explains itself');
  load.child.done(true);
  g.saveCursor = 8;
  key(load, 'Enter');
  ok(load.child instanceof FO.MessageBox && load.child.o.title === 'Error loading game!' && load.child.o.lines.join() === 'Unable to load game.', 'a broken save cannot be loaded');
  load.child.done(true);
  g.saveCursor = 0;
  key(load, 'Enter');
  ok(await until(() => rc !== null) && rc === 1 && g.mode instanceof FO.Play && g.mode !== host, 'the load screen loads the selected slot');

  const qp = g.play;
  const said = [];
  qp.say = s => said.push(s);
  g.quickDone = false;
  const firstQuick = qp.quickSave();
  const qs = qp.top();
  ok(qs instanceof FO.SaveLoadScreen && qs.kind === K.QUICK_SAVE, 'the first quick save asks for a slot');
  await until(() => qs.ready);
  g.saveCursor = 5;
  key(qs, 'Enter');
  type(qs, 'Quick');
  key(qs, 'Enter');
  ok(await firstQuick === 1 && g.quickDone && said.includes('Quick save game successfully saved.'), 'a quick save reports itself');
  qp.sc.time += 600;
  said.length = 0;
  ok(await qp.quickSave() === 1 && !qp.modals.length && said.length === 1, 'later quick saves go straight to the slot');
  slots = await FO.slotList(g);
  ok(slots[5].header.description === 'Quick' && slots[5].header.time === qp.sc.time >>> 0, 'the quick slot keeps its description and the new time');
  ok(await qp.quickLoad() === 1 && g.play !== qp, 'quick load reads the same slot without a screen');
  const ql = g.play;
  ok(ql.log.some(l => l.line === 'Quick load game successfully loaded.'), 'quick load reports itself');
  await until(() => !ql.w.inCombat || ql.combat.canAct());
  ui.length = 0;
  ql.keyDown({ code: 'F4', key: 'F4', ctrlKey: false });
  const f4 = ql.top();
  ok(f4 instanceof FO.SaveLoadScreen && f4.kind === K.SAVE && ui.includes('ib1p1xx1') && !g.quickDone, 'F4 opens the save screen with a click and forgets the quick slot');
  await until(() => f4.ready);
  key(f4, 'Escape');
  ql.keyDown({ code: 'KeyL', key: 'l', ctrlKey: true });
  const ctrlL = ql.top();
  ok(ctrlL instanceof FO.SaveLoadScreen && ctrlL.kind === K.LOAD, 'Ctrl-L opens the load screen');
  await until(() => ctrlL.ready);
  key(ctrlL, 'Escape');

  ql.openOptions();
  const options = ql.top();
  await until(() => options.msg && options.msg.size > 0);
  options.buttons[0].onClick();
  const fromOptions = ql.top();
  await until(() => fromOptions.ready);
  key(fromOptions, 'Escape');
  ok(ql.top() === options, 'cancelling a save from the options menu returns to the menu');
  options.buttons[0].onClick();
  const saving = ql.top();
  await until(() => saving.ready);
  g.saveCursor = 6;
  key(saving, 'Enter');
  key(saving, 'Enter');
  ok(await until(() => !ql.modals.length), 'a finished save closes the options menu too');

  FO.loadFromMenu(g);
  await until(() => g.mode instanceof FO.SaveLoadScreen && g.mode.ready);
  const menuLoad = g.mode;
  ok(menuLoad instanceof FO.SaveLoadScreen && menuLoad.kind === K.MENU_LOAD && menuLoad.standalone && g.colors.fade === 1, 'the main menu opens the load screen on its own');
  menuLoad.draw(g.scr);
  key(menuLoad, 'Escape');
  ok(await until(() => g.mode instanceof FO.MainMenu) && g.colors.fadeTint === FO.FADE_TINT.WHITE, 'cancelling goes back to the main menu through white');
  ok(await until(() => g.colors.fade === 1 && !g.colors.fadeJob), 'the main menu fades in from white');
  const menuDone = FO.loadFromMenu(g);
  await until(() => g.mode instanceof FO.SaveLoadScreen && g.mode.ready);
  g.saveCursor = 0;
  key(g.mode, 'Enter');
  let menuRc = null;
  menuDone.then(r => { menuRc = r; });
  await until(() => menuRc !== null);
  ok(menuRc === 1 && g.mode instanceof FO.Play && g.mode.w.map.name === 'VAULT13', 'a game loads from the main menu');

  const tp = g.play;
  const tw = tp.w;
  const f101 = g.fonts[101];
  const cap = f101.advance('xxxxx-yy');
  const split = f101.breakLines('xxxxx-yyyyy zzzz', cap);
  const long = f101.breakLines('x'.repeat(40), cap);
  ok(split[0] === 'xxxxx-' && split.join('') === 'xxxxx-yyyyy zzzz' && split.every(l => f101.advance(l.replace(/ $/, '')) <= cap) && long.length > 1 && long.join('') === 'x'.repeat(40), 'EXE word wrap breaks after spaces and hyphens, long words anywhere: ' + JSON.stringify(split));
  ok(f101.advance('A') === f101.width('A') + f101.gap && f101.advance('') === 0, 'EXE string widths include the trailing letter spacing');
  const delays = FO.textDelays({ textDelay: 3.5 });
  const slow = FO.textDelays({ textDelay: 6 });
  ok(delays.base === 3500 && delays.line === 1000 && slow.base === 6000 && slow.line === 2000 && FO.textDelays({ textDelay: 1 }).line === 0, 'floating text lasts base + line delay per line from the text delay setting');
  const talkers = tw.map.byElev[tw.elev].filter(o => FO.pidType(o.pid) === FO.PID.CRITTER && !o.dude && o.tile >= 0);
  const npc = talkers[0];
  tp.floats = [];
  tp.centerOn(npc.tile);
  const red = tp.floatMsg(npc, 'Hello there', 2);
  const inks = new Set(red.buf.px);
  ok(red && red.lines === 1 && FO.floatColor(g, 2) === g.colors.inv[31744] && FO.floatColor(g, 9) === g.colors.inv[32767] && FO.floatColor(g, 40) === g.colors.inv[32747] && inks.has(g.colors.inv[0]) && inks.size > 2, 'float_msg colour 2 is red with a black outline, unknown colours are yellow');
  ok(red.dx === 16 - Math.trunc(red.buf.w / 2) && red.dy === -(red.buf.h + 60), 'floating text is centred 60 px above the hex');
  tp.floatMsg(npc, 'Second line for the same man', 3);
  ok(tp.floats.length === 1 && tp.floats[0].lines === 1, 'a new text replaces the old one of the same object');
  g.floatCycle = 12;
  tp.floatMsg(npc, 'cycle', -1);
  ok(g.floatCycle === 1, 'colour -1 cycles through colours 1 to 12');
  const warn = tp.floatMsg(npc, 'Warning!', -2);
  ok(warn && warn.o === null && warn.fixed && warn.tile === tw.dude.tile && warn.buf.h === g.fonts[103].height + g.fonts[103].lineGap + 3, 'colour -2 shows a warning in font 103 on the player tile');
  const elsewhere = Object.assign({}, npc, { elev: (tw.elev + 1) % 3 });
  ok(tp.floatMsg(elsewhere, 'nope', 0) === null, 'float_msg ignores objects on other elevations');
  tp.floats = [];
  const [, vy0] = tp.viewXY();
  tp.cy += FO.hexTop(npc.tile) - vy0 - 12;
  const top = tp.floatMsg(npc, 'Near the top', 0);
  ok(top.dy === 0, 'text that would leave the screen above moves under the hex: ' + top.dy);
  tp.centerOn(npc.tile);
  tp.floats = [];
  const many = talkers.concat(tw.map.byElev[tw.elev].filter(o => o.tile >= 0)).slice(0, 30);
  for (const o of many) tp.floatText(o, 'x', 101, 1, 0);
  ok(tp.floats.length === 19, 'at most 19 floating texts at once');
  tp.floats = [];
  tp.floatMsg(npc, 'Timed text', 0);
  const clock = tp.textClock;
  tp.textClock = clock + 4400;
  tp.update(0);
  const kept = tp.floats.length;
  tp.textClock = clock + 4500;
  tp.update(0);
  ok(kept === 1 && tp.floats.length === 0, 'a one-line text disappears after 3.5 + 1.0 s');

  const loose = tw.adopt({ id: tw.newId(), pid: 40, fid: FO.fid(FO.ART.ITEM, 1), tile: -1, elev: tw.elev, rot: 0, frame: 0, flags: 0, x: 0, y: 0, lightRadius: 0, lightIntensity: 0, sid: -1, inventory: [] }, tw.elev, null);
  tw.add(loose, tw.dude.tile, tw.elev);
  tp.hover = loose;
  g.prefs.itemHighlight = 1;
  const lit = tp.itemLit();
  g.prefs.itemHighlight = 0;
  ok(loose && lit === loose && tp.itemLit() === null, 'item highlight outlines the item under the pointer only when switched on');

  const lines = new Map([[1, { text: 'Quelle putain de vie, pute!' }], [2, { text: 'Merde alors' }]]);
  g.badWords = null;
  await FO.loadBadWords(g);
  g.prefs.languageFilter = 0;
  FO.filterMessages(g, lines);
  ok(lines.get(1).text === 'Quelle putain de vie, pute!', 'the language filter is off by default');
  g.prefs.languageFilter = 1;
  FO.filterMessages(g, lines);
  const clean = lines.get(1).text;
  ok(g.badWords.length === 103 && clean.startsWith('Quelle ') && clean.slice(13, 21) === ' de vie,' && !/putain|pute/.test(clean) && clean.length === 27 && lines.get(2).text === 'Merde alors', 'filtered words become symbols, whole words only, like BADWORDS.TXT in the EXE: ' + clean);
  g.prefs.languageFilter = 0;

  g.prefs.gameDifficulty = 2;
  g.prefs.textDelay = 5;
  const withPrefs = FO.saveData(tp);
  g.prefs.gameDifficulty = 0;
  g.prefs.textDelay = 2;
  FO.applySavedPrefs(g, withPrefs.prefs);
  ok(g.prefs.gameDifficulty === 2 && g.prefs.textDelay === 5 && withPrefs.prefs.combatSpeed !== undefined && withPrefs.prefs.res === undefined, 'options are stored in the save and restored on load, like LoadOptions in the EXE');

  tp.sc.request('endGame');
  tp.handleRequests();
  tp.update(0);
  ok(tp.gameOver && tp.over && g.colors.fadeTint === FO.FADE_TINT.WHITE, 'metarule 13 ends the game through a white fade, like the EXE quit flag');
  ok(await until(() => g.mode instanceof FO.MainMenu), 'the main menu follows the end of the game');
}

async function hires(D) {
  const g = {
    data: D, art: new FO.Art(D), protos: new FO.Protos(D), prefs: {}, scr: new FO.Screen(640, 480), mouse: { x: 0, y: 0, inside: false, down: 0 }, keys: new Set(), opts: {}, now: 0,
    active: () => true,
    setMode(m, entered) {
      if (this.mode && this.mode.leave) this.mode.leave();
      this.mode = m;
      return m && m.enter && !entered ? m.enter() : null;
    },
    setResolution(mode) {
      this.prefs.res = mode;
    },
    text(s, x, y, c, f) {
      const font = this.fonts[f === undefined ? 101 : f];
      return font ? font.draw(this.scr, s, x, y, c, this.colors) : x;
    },
    color(r, gg, b) {
      return this.colors.nearest(r, gg, b);
    }
  };
  g.audio = { load: name => ({ name }), play() {}, free() {}, sfx() {}, playMusic() {}, stopMusic() {}, apply() {} };
  await g.art.init();
  await g.protos.init();
  g.fonts = await FO.loadFonts(D);
  g.colors = new FO.Colors(FO.readPal(await D.get('COLOR.PAL')));

  ok(JSON.stringify(FO.scaleRect(1250, 865, 640, 480, FO.SCALE.FIT)) === '[48,0,1153,865]' && JSON.stringify(FO.scaleRect(1250, 865, 640, 480, FO.SCALE.FILL)) === '[0,0,1250,865]' && JSON.stringify(FO.scaleRect(800, 600, 640, 480, FO.SCALE.NONE)) === '[80,60,640,480]', 'pictures fit the screen keeping their shape, fill it, or stay at their size');
  const tiny = new FO.Screen(4, 4);
  tiny.blitScaled({ w: 2, h: 2, px: Uint8Array.from([1, 2, 3, 4]) }, [0, 0, 2, 2], [0, 0, 4, 4]);
  ok(tiny.px.join('') === '1122112233443344', 'scaled pictures repeat their pixels');
  ok(FO.screenPref({}, 'res') === 'r640' && FO.screenPref({}, 'sideArt') === 1 && FO.screenPref({}, 'scaling') === FO.SCALE.FIT, 'screen settings default to 640x480, metal side art and pictures fitted to the screen, like f1_res.ini');

  const world = await FO.newWorld(g);
  const sc = new FO.Scripts(g, world);
  await sc.init();
  const play = new FO.Play(g, world, sc);
  g.play = play;
  await g.setMode(play);
  await play.start('V13ENT', -1, -1, -1);
  const iface = play.iface;
  let o = iface.origin();
  ok(!o.wide && o.x === 0 && o.bar === 0, 'at 640x480 the original bar fills the width');
  g.scr.resize(800, 600);
  o = iface.origin();
  ok(o.wide && o.bar === 0 && o.x === 160 && iface.regions().inv[0] === 371 && iface.regions().map[0] === 686, 'at 800 wide the hi-res bar is used and its buttons sit 160 pixels to the right');
  ok(JSON.stringify(FO.screenOrigin(g.scr, g)) === '[80,10]' && JSON.stringify(FO.screenOrigin(g.scr)) === '[80,60]', 'windows over the map are centred above the bar when it fits');
  g.scr.resize(1024, 768);
  o = iface.origin();
  ok(o.wide && o.bar === 112 && o.x === 272, 'wider screens centre the 800 bar');
  for (const [side, path] of [[1, FO.SIDE_ART[1][0]], [2, FO.SIDE_ART[2][0]]]) {
    g.prefs.sideArt = side;
    g.scr.fill(0);
    iface.draw(g.scr);
    const art = FO.frameOfArt(g, path);
    ok(g.scr.px[(o.y + 50) * g.scr.w + o.bar - 1] === art.px[50 * art.w + art.w - 1], 'side art ' + side + ' meets the bar on its left');
  }
  g.prefs.sideArt = 0;
  g.scr.fill(0);
  iface.draw(g.scr);
  ok(g.scr.px[(o.y + 50) * g.scr.w + o.bar - 1] === 0, 'without side art the sides stay black');

  const talk = new FO.DialogScreen(play, { head: -1 });
  await g.art.loadPath('ART\\INTRFACE\\HR_ALLTLK.FRM');
  ok(talk.frame().art === 'ART\\INTRFACE\\HR_ALLTLK.FRM' && talk.frame().dy === 5, 'the bordered dialogue art of the hi-res patch is used on bigger screens, its window is 5 pixels lower');
  g.scr.resize(640, 480);
  ok(talk.frame().art === 103 && talk.frame().dy === 0, 'the original dialogue art stays at 640x480');

  g.scr.resize(1250, 865);
  g.prefs = {};
  await FO.showMainMenu(g);
  const menu = g.mode;
  ok(menu.buttons.length === 6 && menu.buttons[3].id === 'options' && menu.itemText({ screen: 3 }) === 'OPTIONS', 'the main menu has the OPTIONS item of the hi-res patch on its sixth plate');
  ok(JSON.stringify(menu.backdrop(g.scr)) === '[48,0,1153,865]', 'the hi-res main menu picture fits the screen');
  g.prefs.scaling = FO.SCALE.NONE;
  menu.draw(g.scr);
  ok(JSON.stringify(menu.backdrop(g.scr)) === '[305,192,640,480]', 'without scaling the original main menu stays at its size');
  g.prefs = {};
  menu.choose('options');
  ok(menu.top() && menu.top().buttons.length === 2, 'OPTIONS opens the choice between game and screen settings');
  menu.top().pick(1);
  const screen = menu.top();
  ok(screen instanceof FO.ScreenSettings, 'the second button opens the screen settings');
  await screen.enter();
  screen.set('sideArt', 2);
  screen.set('scaling', FO.SCALE.FILL);
  screen.set('res', 1);
  ok(g.prefs.sideArt === 2 && g.prefs.scaling === FO.SCALE.FILL && g.prefs.res === 'r800', 'screen settings change the side art, the picture scaling and the resolution');
  screen.draw(g.scr);
  screen.cancel();
  ok(g.prefs.sideArt === 1 && g.prefs.scaling === FO.SCALE.FIT && g.prefs.res === 'r640' && !menu.top(), 'CANCEL restores the screen settings and closes the window');
  menu.choose('options');
  menu.top().pick(0);
  ok(menu.top() instanceof FO.PrefsScreen, 'the first button opens the game preferences from the main menu');
  menu.top().close();
  ok(!menu.top(), 'the preferences close back to the main menu');
}

async function russian() {
  const RU = path.join(ROOT, 'content/fallout-ru');
  const data = require(path.join(ROOT, 'tools/fallout-data.cjs'));
  const tool = require(path.join(ROOT, 'tools/fallout-ru.cjs'));
  ok(JSON.stringify(data.russianFiles()) === JSON.stringify(FO.RU), 'fo-files.js lists content/fallout-ru (run node tools/fallout-data.cjs files)');
  const R = await FO.Data.open(FO.nodeSource(GAME), FO.LOOSE, { src: FO.nodeSource(RU, ''), files: FO.RU });
  const misc = FO.readMsg(await R.text('TEXT\\ENGLISH\\GAME\\MISC.MSG'));
  const maps = FO.readMsg(await R.text('TEXT\\ENGLISH\\GAME\\MAP.MSG'));
  ok(misc.get(10).text === 'НОВАЯ ИГРА' && maps.get(0).text === 'DESERT1.MAP', 'Russian lines replace English ones by number and the rest stays English');
  ok(R.peekText('TEXT\\ENGLISH\\GAME\\MISC.MSG') === null || /НОВАЯ ИГРА/.test(R.peekText('TEXT\\ENGLISH\\GAME\\MISC.MSG')), 'synchronous text reads see the same Russian lines');
  await R.prefetch(/^TEXT\\ENGLISH\\GAME\\MISC/);
  ok(/НОВАЯ ИГРА/.test(R.peekText('TEXT\\ENGLISH\\GAME\\MISC.MSG')), 'prefetched Russian lines are available without waiting');
  ok(FO.glyphCode('Я'.charCodeAt(0)) === 0xDF && FO.glyphCode('ё'.charCodeAt(0)) === 0xB8 && FO.glyphCode('—'.charCodeAt(0)) === 0x97 && FO.glyphCode(65) === 65, 'Unicode letters map to cp1251 glyph slots');
  const letters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя«»—…';
  const fonts = {};
  for (const n of [0, 1, 2, 3, 4]) {
    const f = fonts[100 + n] = new FO.Font(FO.readAaf(await R.get('FONT' + n + '.AAF')));
    const orig = new FO.Font(FO.readAaf(await D0.get('FONT' + n + '.AAF')));
    ok([...letters].every(c => f.glyphWidth(FO.glyphCode(c.charCodeAt(0))) > 0), 'font ' + (100 + n) + ' has every Russian letter');
    ok(f.width('FALLOUT 13') === orig.width('FALLOUT 13') && f.height === orig.height, 'font ' + (100 + n) + ' keeps the original Latin glyphs and metrics');
  }
  const was = FO.textGender;
  FO.textGender = 1;
  const she = FO.genderText('Ты ~пришёл|пришла~ одна? ~Да|Нет~.');
  const w = fonts[101].width('Ты ~пришёл|пришла~');
  FO.textGender = 0;
  ok(she === 'Ты пришла одна? Нет.' && FO.genderText('Ты ~пришёл|пришла~') === 'Ты пришёл', 'gender forms follow the player');
  ok(w === fonts[101].width('Ты пришла') && fonts[101].breakLines('~а|б~', 200)[0] === 'а', 'fonts measure and wrap the resolved form');
  FO.textGender = was;
  const strings = FO.readStrings(await R.overlayText(FO.STRINGS_PATH));
  ok(FO.tr({ strings }, 'JAN') === 'ЯНВ' && FO.tr({ strings }, 'Max Stone') === 'Max Stone', 'engine and script strings have a translation table');
  const problems = await tool.check();
  ok(!problems.length, 'Russian texts pass the checks' + (problems.length ? ': ' + problems.slice(0, 5).join('; ') : ''));
  const used = new Set();
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(txt|sve)$/i.test(e.name)) for (const c of fs.readFileSync(p, 'utf8')) used.add(c);
    }
  };
  walk(path.join(RU, 'TEXT'));
  const missing = [...used].filter(c => c >= ' ' && c !== '~' && c !== '|' && !fonts[101].glyphWidth(FO.glyphCode(c.charCodeAt(0))) && c !== ' ');
  ok(!missing.length, 'every character of the Russian texts has a glyph' + (missing.length ? ': ' + missing.join('') : ''));
  const sprites = new Set(['BURST.FRM', 'KICK.FRM', 'PUNCH.FRM', 'SINGLE.FRM', 'SWING.FRM', 'THRUST.FRM', 'THROW.FRM', 'UNARMED.FRM', 'MVEPNT.FRM', 'RELOAD.FRM', 'USET.FRM', 'USEON.FRM']);
  const arts = fs.readdirSync(path.join(RU, 'ART', 'INTRFACE'));
  ok(arts.length >= 40 && ['IFACE.FRM', 'INVBOX.FRM', 'PIP.FRM', 'MONTHS.FRM', 'PICKCHAR.FRM', 'HELPSCRN.FRM'].every(f => arts.includes(f)), 'interface art with English labels has Russian copies');
  const badArt = [];
  for (const f of arts) {
    const key = 'ART\\INTRFACE\\' + f;
    const ru = FO.readFrm(await R.get(key)).dirs[0].frames[0];
    const en = FO.readFrm(await D0.get(key)).dirs[0].frames[0];
    const same = ru.w === en.w && ru.h === en.h;
    if (sprites.has(f) ? !ru.w || ru.h > 16 : !same || ru.px.every((c, i) => c === en.px[i])) badArt.push(f);
    else if (!sprites.has(f) && ru.px.some((c, i) => !c !== !en.px[i])) badArt.push(f);
  }
  ok(!badArt.length, 'Russian interface art keeps sizes and transparency, label sprites are one line' + (badArt.length ? ': ' + badArt.join(' ') : ''));
}

function code() {
  const SL = String.fromCharCode(47);
  const LINE = SL + SL;
  const BLOCK = SL + '*';
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/fallout/' + f).concat(['tools/fallout-data.cjs', 'tools/fallout-ru.cjs', 'tools/fallout-ru-glyphs.cjs', 'tests/fallout.test.js', 'tests/fallout-bot.js']);
  for (const f of files) {
    const src = read(f);
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
    ok(!BANNED.test(src), f + ' follows the naming rule');
  }
  for (const f of ['tools/fallout-ru-fonts.cjs', 'tools/fallout-ru-art.cjs']) {
    const src = read(f);
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(/'\.dat'/.test(read('server.js')), 'server answers byte ranges of DAT archives');
  ok(!read('css/apps/fallout.css').includes(BLOCK) && !read('fallout.html').includes('<!' + '--'), 'styles and page have no comments');
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every module is listed');
  const page = read('fallout.html');
  let last = -1;
  for (const f of ORDER) {
    const at = page.indexOf(`js/apps/fallout/${f}.js`);
    ok(at > last, 'fallout.html loads ' + f + ' in order');
    last = at;
  }
  shell(LINE, BLOCK);
}

function shell(LINE, BLOCK) {
  const index = read('index.html');
  let last = -1;
  for (const f of ORDER) {
    const at = index.indexOf(`js/apps/fallout/${f}.js`);
    ok(at > last, 'index.html loads ' + f + ' in order');
    last = at;
  }
  ok(index.indexOf('js/apps/fallout-app.js') > last, 'index.html loads the window after the engine');
  ok(index.includes('css/apps/fallout.css'), 'index.html loads the styles');
  const app = read('js/apps/fallout-app.js');
  ok(!app.includes(LINE) && !app.includes(BLOCK) && !BANNED.test(app), 'window wrapper has no comments and follows the naming rule');
  ok(/debug: false/.test(app), 'the map viewer stays off in the Win 98 window');
  const catalog = read('js/game-manager.js');
  ok(!/falloutGranted/.test(catalog), 'nothing grants the game');
  for (const f of ['js/desktop.js', 'js/taskbar.js', 'js/apps/dialogs.js']) ok(read(f).includes(`isInstalled('fallout')`), f + ' checks the installation');
  ok(fs.existsSync(path.join(ROOT, 'content/steam/fallout-1.jpg')) && fs.existsSync(path.join(ROOT, 'content/steam/fallout-2.jpg')), 'Steam screenshots exist');
}

(async () => {
  const D = await archives();
  await looseIsCurrent();
  await samples(D);
  await everyFile(D);
  geometry();
  await maps(D);
  await movement(D);
  await scripting(D);
  await pipboy(D);
  await combat(D);
  await items(D);
  await rules(D);
  await travel(D);
  await audio(D);
  await objects(D);
  await saves(D);
  await hires(D);
  D0 = D;
  await russian();
  code();
  finished = true;
  console.log('fallout: ' + checks + ' checks passed in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
