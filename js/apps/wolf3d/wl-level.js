(function (W) {
  'use strict';
  const D = W.Data;
  const DIRS4 = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  function rowsOf(map) {
    const lines = map.rows.split(/\r?\n/);
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const w = Math.max(...lines.map(l => l.length));
    return lines.map(l => l.padEnd(w, ' '));
  }

  function parse(map, skill = 1) {
    const rows = rowsOf(map), h = rows.length, w = rows[0].length;
    const legend = Object.assign({}, D.LEGEND, map.legend || {});
    const texIndex = name => D.TEXTURES.indexOf(name) + 1;
    const L = {
      w, h, map, name: map.name, par: map.par || 0, ceil: map.ceil || '#383838', music: map.music || 'm1',
      wall: new Uint8Array(w * h), push: new Uint8Array(w * h), exitAt: new Uint8Array(w * h), solid: new Uint8Array(w * h),
      doorAt: new Int16Array(w * h).fill(-1), area: new Int16Array(w * h).fill(-1), statAt: new Int16Array(w * h).fill(-1),
      doors: [], statics: [], actors: [], pushwalls: [], start: null, totals: { kills: 0, secrets: 0, treasures: 0 }
    };
    const idx = (x, y) => y * w + x;
    const defs = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      let def = D.WALLS[ch] ? { wall: ch } : legend[ch];
      if (map.legend && map.legend[ch]) def = map.legend[ch];
      if (!def) throw new Error(`${map.id || 'map'}: unknown char '${ch}' at ${x},${y}`);
      defs.push(def);
    }
    const isWallDef = d => !!(d.wall || d.push || d.void);
    const wallTexOf = (x, y) => {
      const d = defs[idx(x, y)];
      return d && d.wall ? D.WALLS[d.wall] : null;
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = idx(x, y), d = defs[k];
      if (d.wall) {
        L.wall[k] = texIndex(D.WALLS[d.wall]);
        if (d.wall === 'X') L.exitAt[k] = 1;
        if (d.wall === 'Y') L.exitAt[k] = 2;
        L.solid[k] = 1;
      } else if (d.void) {
        L.wall[k] = texIndex('grey'); L.solid[k] = 1;
      } else if (d.push) {
        let tex = typeof d.push === 'string' ? D.WALLS[d.push] : null;
        if (!tex) {
          const count = {};
          for (const [dx, dy] of DIRS4) { const t = x + dx >= 0 && x + dx < w && y + dy >= 0 && y + dy < h ? wallTexOf(x + dx, y + dy) : null; if (t && t !== 'switch' && t !== 'elevator') count[t] = (count[t] || 0) + 1; }
          tex = Object.keys(count).sort((a, b) => count[b] - count[a])[0] || 'grey';
        }
        L.wall[k] = texIndex(tex); L.push[k] = 1; L.solid[k] = 1;
        L.totals.secrets++;
      }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = idx(x, y), d = defs[k];
      if (d.door === undefined) continue;
      const solidAt = (xx, yy) => xx < 0 || yy < 0 || xx >= w || yy >= h || L.solid[idx(xx, yy)];
      const we = solidAt(x - 1, y) && solidAt(x + 1, y), ns = solidAt(x, y - 1) && solidAt(x, y + 1);
      if (we === ns) throw new Error(`${map.id || 'map'}: door at ${x},${y} needs walls on exactly two opposite sides`);
      L.doorAt[k] = L.doors.length;
      L.doors.push({ x, y, axis: we ? 'h' : 'v', lock: d.door === 1 || d.door === 2 ? d.door : 0, elev: d.door === 3, pos: 0, state: 'closed', tics: 0, areas: [-1, -1] });
    }
    let areaCount = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = idx(x, y);
      if (L.solid[k] || L.doorAt[k] >= 0 || L.area[k] >= 0) continue;
      const stack = [[x, y]]; L.area[k] = areaCount;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        for (const [dx, dy] of DIRS4) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = idx(nx, ny);
          if (L.solid[q] || L.doorAt[q] >= 0 || L.area[q] >= 0) continue;
          L.area[q] = areaCount; stack.push([nx, ny]);
        }
      }
      areaCount++;
    }
    L.areaCount = areaCount;
    for (const door of L.doors) {
      const a = door.axis === 'h' ? [[door.x, door.y - 1], [door.x, door.y + 1]] : [[door.x - 1, door.y], [door.x + 1, door.y]];
      door.areas = a.map(([xx, yy]) => xx >= 0 && yy >= 0 && xx < w && yy < h ? L.area[idx(xx, yy)] : -1);
    }
    const openRun = (x, y, dx, dy) => { let n = 0; for (let i = 1; i < 12; i++) { const xx = x + dx * i, yy = y + dy * i; if (xx < 0 || yy < 0 || xx >= w || yy >= h) break; const q = idx(xx, yy); if (L.solid[q] || L.doorAt[q] >= 0) break; n++; } return n; };
    const bestDir = (x, y) => { let best = 0, bn = -1; DIRS4.forEach(([dx, dy], i) => { const n = openRun(x, y, dx, dy); if (n > bn) { bn = n; best = i; } }); return best * 2; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = idx(x, y), d = defs[k];
      if (d.start !== undefined) L.start = { x: x + 0.5, y: y + 0.5, angle: d.start * Math.PI / 2 };
      if (d.item || d.decor) {
        const spr = d.item || d.decor;
        const pick = d.item ? D.PICKUPS[d.item] : null;
        const block = d.decor ? !!(D.DECOR[d.decor] && D.DECOR[d.decor].block) : false;
        if (!pick && !D.DECOR[spr]) throw new Error(`${map.id || 'map'}: unknown object ${spr}`);
        L.statAt[k] = L.statics.length;
        L.statics.push({ x, y, spr, block, pick: d.item || null, active: true });
        if (pick && pick.treasure) L.totals.treasures++;
      }
      const actorType = d.actor || (d.boss ? map.boss : null);
      if (actorType) {
        if (!D.ENEMIES[actorType]) throw new Error(`${map.id || 'map'}: unknown actor ${actorType}`);
        if ((d.skill || 0) > skill) continue;
        L.actors.push({ type: actorType, x, y, dir: d.dir !== undefined ? d.dir : bestDir(x, y), patrol: !!d.patrol, ambush: !!d.ambush, variant: d.variant || 0 });
        if (!D.ENEMIES[actorType].ghost) L.totals.kills++;
      }
    }
    if (!L.start) throw new Error(`${map.id || 'map'}: no player start`);
    return L;
  }

  W.Level = { parse, rowsOf, DIRS4 };
})(globalThis.Wolf3D = globalThis.Wolf3D || {});
