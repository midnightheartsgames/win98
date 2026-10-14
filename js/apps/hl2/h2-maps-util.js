(function (H) {
  'use strict';

  const X = c => c * 2 + 1;
  const E = c => c * 2;

  function grid(w, h, fill) {
    const a = Array.from({ length: h }, () => Array(w).fill(fill));
    return {
      a, w, h,
      rect(ch, c1, r1, c2, r2) {
        for (let r = Math.max(0, r1); r <= Math.min(h - 1, r2); r++) for (let c = Math.max(0, c1); c <= Math.min(w - 1, c2); c++) a[r][c] = ch;
        return this;
      },
      set(ch, c, r) { if (r >= 0 && r < h && c >= 0 && c < w) a[r][c] = ch; return this; },
      frame(ch, c1, r1, c2, r2) {
        for (let c = c1; c <= c2; c++) { this.set(ch, c, r1); this.set(ch, c, r2); }
        for (let r = r1; r <= r2; r++) { this.set(ch, c1, r); this.set(ch, c2, r); }
        return this;
      },
      rows() { return a.map(r => r.join('')); }
    };
  }

  function zc(b, id, c1, r1, c2, r2, y1, y2) {
    b.zone(id, E(Math.min(c1, c2)), E(Math.min(r1, r2)), E(Math.max(c1, c2) + 1), E(Math.max(r1, r2) + 1), y1 === undefined ? -1e9 : y1, y2 === undefined ? 1e9 : y2);
  }

  function lamp(b, x, z, yaw = 0, col = [1, 0.9, 0.7]) {
    b.model('lamp', x, 0, z, yaw, { solid: [0.1, 5, 0.1] });
    const f = H.forward(yaw);
    b.light(x + f.x * 1.1, 4.6, z + f.z * 1.1, col[0], col[1], col[2], 12);
  }

  function ceilingLight(b, x, y, z, col = [1, 0.95, 0.8], radius = 9, kind = 'light') {
    b.model(kind, x, y, z, 0);
    b.light(x, y - 0.4, z, col[0], col[1], col[2], radius);
  }

  function slab(b, c1, r1, c2, r2, y, tex = 'wood_floor', holes = [], o = {}) {
    const under = o.under || 'plaster_white';
    const cells = [];
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      if (holes.some(hh => c >= hh[0] && c <= hh[2] && r >= hh[1] && r <= hh[3])) continue;
      cells.push([c, r]);
    }
    const used = new Set();
    for (const [c, r] of cells) {
      const k = c + ',' + r;
      if (used.has(k)) continue;
      let c2e = c;
      while (cells.some(q => q[0] === c2e + 1 && q[1] === r) && !used.has((c2e + 1) + ',' + r)) c2e++;
      let r2e = r;
      for (;;) {
        let ok = true;
        for (let cc = c; cc <= c2e; cc++) if (!cells.some(q => q[0] === cc && q[1] === r2e + 1) || used.has(cc + ',' + (r2e + 1))) { ok = false; break; }
        if (!ok) break;
        r2e++;
      }
      for (let rr = r; rr <= r2e; rr++) for (let cc = c; cc <= c2e; cc++) used.add(cc + ',' + rr);
      b.box(E(c), y - 0.3, E(r), E(c2e + 1), y, E(r2e + 1), tex, { top: tex, bottom: under, side: under });
    }
  }

  function wallX(b, x1, x2, z, y1, y2, tex, gaps = [], th = 0.2) {
    let cur = x1;
    const gs = gaps.slice().sort((a, c) => a[0] - c[0]);
    for (const g of gs) {
      if (g[0] > cur) b.box(cur, y1, z - th / 2, g[0], y2, z + th / 2, tex);
      if (g[2] !== undefined && g[2] < y2) b.box(g[0], g[2], z - th / 2, g[1], y2, z + th / 2, tex);
      cur = Math.max(cur, g[1]);
    }
    if (cur < x2) b.box(cur, y1, z - th / 2, x2, y2, z + th / 2, tex);
  }

  function wallZ(b, z1, z2, x, y1, y2, tex, gaps = [], th = 0.2) {
    let cur = z1;
    const gs = gaps.slice().sort((a, c) => a[0] - c[0]);
    for (const g of gs) {
      if (g[0] > cur) b.box(x - th / 2, y1, cur, x + th / 2, y2, g[0], tex);
      if (g[2] !== undefined && g[2] < y2) b.box(x - th / 2, g[2], g[0], x + th / 2, y2, g[1], tex);
      cur = Math.max(cur, g[1]);
    }
    if (cur < z2) b.box(x - th / 2, y1, cur, x + th / 2, y2, z2, tex);
  }

  function crates(b, x, z, n = 3, o = {}) {
    const r = H.rng(Math.floor(x * 31 + z * 17));
    for (let i = 0; i < n; i++) b.prop(o.type || 'crate', x + (r() - 0.5) * 1.6, z + (r() - 0.5) * 1.6, { contains: o.loot ? o.loot[i % o.loot.length] : null, stack: true });
  }

  function sandSpawner(o = {}) {
    const safe = o.safe || [];
    return (g, dt) => {
      const p = g.player;
      if (p.vehicle || g.flags.noSpawn) return;
      const bait = !!p.weapons.bugbait;
      if (o.baitOnly && !bait) return;
      const ground = g.world.cellAt(p.pos.x, p.pos.z);
      const floor = ground.smooth ? g.world.terrainH(p.pos.x, p.pos.z) : ground.f;
      if (!ground.sand || p.pos.y - floor > 0.3) return;
      if (safe.some(([x, z]) => H.distXZ(p.pos, { x, z }) < 12)) return;
      g.flags.antT = (g.flags.antT || 1.5) - dt;
      if (g.flags.antT > 0) return;
      g.flags.antT = bait ? 3 : 2 + g.rng() * 1.5;
      const count = g.npcs.filter(n => n.alive && n.type === 'antlion' && (bait ? n.team === 'pet' : n.team === 'antlion')).length;
      if (count >= (bait ? (o.maxPets || 7) : (o.max || 5))) return;
      const a = g.rng() * Math.PI * 2, d = bait ? 4 + g.rng() * 3 : 8 + g.rng() * 6;
      const x = p.pos.x + Math.sin(a) * d, z = p.pos.z + Math.cos(a) * d;
      const c2 = g.world.cellAt(x, z);
      const f2 = c2.smooth ? g.world.terrainH(x, z) : c2.f;
      if (!c2.sand || g.world.waterAt(x, z) > f2) return;
      const n = g.spawnNpc('antlion', x, z, bait ? { burrow: true, team: 'pet', follow: true } : { burrow: true, hate: true });
      n.follow = bait;
      g.emit({ type: 'sound', name: 'antlion_alert', pos: n.pos });
    };
  }

  function dispensers(g, dt, spots) {
    g.flags.dispT = (g.flags.dispT || 0) - dt;
    if (g.flags.dispT > 0) return;
    g.flags.dispT = 2;
    for (const [x, z] of spots) {
      if (g.props.some(p => !p.dead && p.type === 'combine_ball' && H.distXZ(p.pos, { x, z }) < 2.5)) continue;
      if (g.props.filter(p => !p.dead && p.type === 'combine_ball').length > 10) break;
      H.Phys.makeProp(g, 'combine_ball', x, 1.2, z, {});
      g.emit({ type: 'sound', name: 'ar2_ball', pos: { x, y: 1.4, z }, vol: 0.4 });
    }
  }

  H.MU = { X, E, grid, zc, lamp, ceilingLight, slab, wallX, wallZ, crates, sandSpawner, dispensers };

  H.CHAPTERS = [
    { title: 'Прибытие', en: 'Point Insertion', map: 'c01', color: 'linear-gradient(135deg,#4c5a60,#8a9a9a)' },
    { title: 'Красный день календаря', en: 'A Red Letter Day', map: 'c02', color: 'linear-gradient(135deg,#6a6a5a,#c8c0a0)' },
    { title: 'Канал', en: 'Route Kanal', map: 'c03', color: 'linear-gradient(135deg,#3c4a3a,#7a8a5a)' },
    { title: 'Водная преграда', en: 'Water Hazard', map: 'c04', color: 'linear-gradient(135deg,#2a4448,#6a9090)' },
    { title: 'Восточная Чёрная Меза', en: 'Black Mesa East', map: 'c05', color: 'linear-gradient(135deg,#4a4a54,#9a9aa8)' },
    { title: 'Мы не ходим в Рейвенхолм', en: "We Don't Go to Ravenholm", map: 'c06', color: 'linear-gradient(135deg,#1a1a20,#5a4a3a)' },
    { title: 'Шоссе 17', en: 'Highway 17', map: 'c07', color: 'linear-gradient(135deg,#5a7890,#c8d8d0)' },
    { title: 'Песчаные ловушки', en: 'Sandtraps', map: 'c08', color: 'linear-gradient(135deg,#8a7a50,#d8c890)' },
    { title: 'Нова Проспект', en: 'Nova Prospekt', map: 'c09', color: 'linear-gradient(135deg,#3a4448,#7a8a8a)' },
    { title: 'Запутанность', en: 'Entanglement', map: 'c10', color: 'linear-gradient(135deg,#2a3238,#6a7a80)' },
    { title: 'Антигражданин Один', en: 'Anticitizen One', map: 'c11', color: 'linear-gradient(135deg,#5a4a3a,#a08a6a)' },
    { title: 'Следуйте за Фрименом!', en: 'Follow Freeman!', map: 'c12', color: 'linear-gradient(135deg,#6a5040,#c09060)' },
    { title: 'Наши благодетели', en: 'Our Benefactors', map: 'c13', color: 'linear-gradient(135deg,#1a2430,#5a7a9a)' },
    { title: 'Тёмная энергия', en: 'Dark Energy', map: 'c14', color: 'linear-gradient(135deg,#101820,#6aa0d0)' }
  ];

  const kit = (weapons, ammo, extra = {}) => () => Object.assign({ hp: 100, armor: extra.armor || 0, aux: 100, suit: extra.suit !== false, weapons: Object.fromEntries(weapons.map(w => [w, true])), ammo: Object.assign(Object.fromEntries(Object.keys(H.AMMO).map(k => [k, 0])), ammo), clip: Object.fromEntries(weapons.filter(w => H.WEAPONS[w].clip).map(w => [w, H.WEAPONS[w].clip])), cur: weapons[weapons.length - 1], superGG: !!extra.superGG });
  H.CHAPTERS[0].carry = () => ({ hp: 100, armor: 0, aux: 100, suit: false, weapons: {}, ammo: {}, clip: {}, cur: null });
  H.CHAPTERS[1].carry = H.CHAPTERS[0].carry;
  H.CHAPTERS[2].carry = kit([], {}, { armor: 0 });
  H.CHAPTERS[3].carry = kit(['crowbar', 'pistol', 'smg'], { pistol: 60, smg: 90, smggren: 1 }, { armor: 30 });
  H.CHAPTERS[4].carry = kit(['crowbar', 'pistol', 'smg'], { pistol: 60, smg: 90, smggren: 1, '357': 6 }, { armor: 40 });
  H.CHAPTERS[5].carry = kit(['crowbar', 'gravgun', 'pistol', 'smg'], { pistol: 60, smg: 90, smggren: 1 }, { armor: 40 });
  H.CHAPTERS[6].carry = kit(['crowbar', 'gravgun', 'pistol', 'smg', 'shotgun'], { pistol: 60, smg: 90, buckshot: 20, smggren: 1 }, { armor: 50 });
  H.CHAPTERS[7].carry = kit(['crowbar', 'gravgun', 'pistol', 'magnum', 'smg', 'ar2', 'shotgun', 'rpg', 'grenade'], { pistol: 60, '357': 6, smg: 90, ar2: 30, buckshot: 20, rocket: 2, grenade: 2 }, { armor: 60 });
  H.CHAPTERS[8].carry = kit(['crowbar', 'gravgun', 'pistol', 'magnum', 'smg', 'ar2', 'shotgun', 'rpg', 'grenade', 'bugbait'], { pistol: 60, '357': 6, smg: 90, ar2: 30, buckshot: 20, rocket: 1, grenade: 3 }, { armor: 60 });
  H.CHAPTERS[9].carry = kit(['crowbar', 'gravgun', 'pistol', 'magnum', 'smg', 'ar2', 'shotgun', 'crossbow', 'rpg', 'grenade', 'bugbait'], { pistol: 60, '357': 6, smg: 90, ar2: 45, buckshot: 20, bolt: 4, rocket: 1, grenade: 3 }, { armor: 60 });
  H.CHAPTERS[10].carry = kit(['crowbar', 'gravgun', 'pistol', 'magnum', 'smg', 'ar2', 'shotgun', 'crossbow', 'grenade'], { pistol: 60, '357': 6, smg: 90, ar2: 45, buckshot: 20, bolt: 4, grenade: 3 }, { armor: 50 });
  H.CHAPTERS[11].carry = kit(['crowbar', 'gravgun', 'pistol', 'magnum', 'smg', 'ar2', 'shotgun', 'crossbow', 'rpg', 'grenade'], { pistol: 60, '357': 6, smg: 90, ar2: 45, buckshot: 20, bolt: 4, rocket: 3, grenade: 3 }, { armor: 60 });
  H.CHAPTERS[12].carry = kit(['crowbar', 'gravgun', 'pistol', 'magnum', 'smg', 'ar2', 'shotgun', 'crossbow', 'rpg', 'grenade'], { pistol: 60, '357': 6, smg: 90, ar2: 45, buckshot: 20, bolt: 4, rocket: 3, grenade: 3 }, { armor: 70 });
  H.CHAPTERS[13].carry = kit(['gravgun'], {}, { armor: 100, superGG: true });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
