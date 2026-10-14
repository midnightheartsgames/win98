(function (D) {
  'use strict';
  const { clamp, RNG, fbm } = D;

  D.FLOORS = ['none', 'flag', 'cobble', 'wood', 'carpet', 'dirt', 'grass', 'forest', 'mud', 'marsh', 'sand', 'dwarf', 'deeproad', 'fade', 'marble', 'straw', 'ruin', 'road', 'rug', 'lava', 'stone', 'elfstone', 'moss', 'ash'];
  D.WALLS = ['none', 'stone', 'plaster', 'timber', 'dwarf', 'cave', 'ruin', 'elfruin', 'marble', 'fade', 'rock', 'palisade', 'hedge', 'brick', 'dark'];
  const FI = Object.fromEntries(D.FLOORS.map((n, i) => [n, i]));
  const WI = Object.fromEntries(D.WALLS.map((n, i) => [n, i]));

  D.PROPS = {
    table: { w: 2, d: 1, h: 0.8, block: 1 }, table_round: { w: 1, d: 1, h: 0.8, block: 1 }, chair: { w: 1, d: 1, h: 1, block: 0 }, bench: { w: 2, d: 1, h: 0.5, block: 0 },
    bed: { w: 1, d: 2, h: 0.6, block: 1 }, barrel: { w: 1, d: 1, h: 1.1, block: 1 }, crate: { w: 1, d: 1, h: 0.9, block: 1 }, sack: { w: 1, d: 1, h: 0.6, block: 0 },
    bookcase: { w: 2, d: 1, h: 2.4, block: 1 }, pillar: { w: 1, d: 1, h: 4, block: 1, opaque: 1 }, dpillar: { w: 1, d: 1, h: 6, block: 1, opaque: 1 },
    statue: { w: 1, d: 1, h: 3, block: 1 }, statue_big: { w: 2, d: 2, h: 5.5, block: 1 }, banner: { w: 1, d: 1, h: 3, block: 0 }, tent: { w: 3, d: 3, h: 2.6, block: 1 },
    campfire: { w: 1, d: 1, h: 0.4, block: 1 }, cage: { w: 2, d: 2, h: 2.4, block: 1 }, tree: { w: 1, d: 1, h: 7, block: 1 }, pine: { w: 1, d: 1, h: 9, block: 1 },
    deadtree: { w: 1, d: 1, h: 6, block: 1 }, bigtree: { w: 2, d: 2, h: 12, block: 1, opaque: 1 }, bush: { w: 1, d: 1, h: 1, block: 0 }, rock: { w: 1, d: 1, h: 1.4, block: 1 },
    boulder: { w: 2, d: 2, h: 2.6, block: 1, opaque: 1 }, stump: { w: 1, d: 1, h: 0.5, block: 1 }, log: { w: 3, d: 1, h: 0.6, block: 1 }, fence: { w: 1, d: 1, h: 1.1, block: 1 },
    well: { w: 1, d: 1, h: 1.6, block: 1 }, cart: { w: 2, d: 1, h: 1.4, block: 1 }, brazier: { w: 1, d: 1, h: 1.2, block: 1 }, anvil: { w: 1, d: 1, h: 0.8, block: 1 },
    forge: { w: 2, d: 1, h: 1.6, block: 1 }, throne: { w: 1, d: 1, h: 2.2, block: 1 }, fountain: { w: 2, d: 2, h: 1.2, block: 1 }, altar: { w: 2, d: 1, h: 1, block: 1 },
    mirror: { w: 1, d: 1, h: 2.8, block: 1 }, beacon: { w: 2, d: 2, h: 1.4, block: 1 }, dummy: { w: 1, d: 1, h: 1.8, block: 1 }, rack: { w: 1, d: 1, h: 1.8, block: 1 },
    counter: { w: 3, d: 1, h: 1.1, block: 1 }, hay: { w: 1, d: 1, h: 0.9, block: 1 }, pew: { w: 3, d: 1, h: 0.9, block: 1 }, windmill: { w: 3, d: 3, h: 9, block: 1, opaque: 1 },
    aravel: { w: 2, d: 4, h: 3, block: 1 }, lectern: { w: 1, d: 1, h: 1.2, block: 1 }, bones: { w: 1, d: 1, h: 0.2, block: 0 }, corpse: { w: 1, d: 1, h: 0.3, block: 0 },
    crystal: { w: 1, d: 1, h: 1.2, block: 0 }, candles: { w: 1, d: 1, h: 0.6, block: 0 }, rubble: { w: 1, d: 1, h: 0.5, block: 1 }, fadeisle: { w: 1, d: 1, h: 3, block: 0 },
    torch: { w: 1, d: 1, h: 2.2, block: 0 }, lamp: { w: 1, d: 1, h: 2.6, block: 1 }, stall: { w: 3, d: 2, h: 2.6, block: 1 }, bedroll: { w: 1, d: 2, h: 0.2, block: 0 },
    chest: { w: 1, d: 1, h: 0.8, block: 1 }, wardrobe: { w: 1, d: 1, h: 2.2, block: 1 }, cauldron: { w: 1, d: 1, h: 0.9, block: 1 }, totem: { w: 1, d: 1, h: 3.5, block: 1 },
    gate: { w: 1, d: 1, h: 4, block: 1 }, chalice: { w: 1, d: 1, h: 1.1, block: 1 }, board: { w: 1, d: 1, h: 2, block: 1 }, grave: { w: 1, d: 1, h: 1, block: 1 },
    web: { w: 2, d: 2, h: 2.5, block: 0 }, pod: { w: 1, d: 1, h: 1, block: 0 }, lavafall: { w: 1, d: 1, h: 5, block: 1 }, ballista: { w: 2, d: 2, h: 1.8, block: 1 },
    wagon: { w: 2, d: 3, h: 2.2, block: 1 }, hut: { w: 3, d: 3, h: 3.2, block: 1, opaque: 1 }, planter: { w: 1, d: 1, h: 0.7, block: 1 }, painting: { w: 1, d: 1, h: 2, block: 0 }, signpost: { w: 1, d: 1, h: 2.2, block: 1 }, door: { w: 1, d: 1, h: 3, block: 0 }
  };

  class Builder {
    constructor(w, h, opt) {
      this.w = w; this.h = h;
      this.floor = new Uint8Array(w * h);
      this.solid = new Uint8Array(w * h);
      this.wallMat = new Uint8Array(w * h);
      this.wallH = new Float32Array(w * h);
      this.roof = new Float32Array(w * h);
      this.water = new Float32Array(w * h).fill(NaN);
      this.deep = new Uint8Array(w * h);
      this.propBlock = new Uint8Array(w * h);
      this.propOpaque = new Uint8Array(w * h);
      this.small = new Uint8Array(w * h);
      this.pathMask = new Uint8Array(w * h);
      this.hv = new Float32Array((w + 1) * (h + 1));
      this.objects = [];
      this.roofs = [];
      this.rng = new RNG((opt && opt.seed) || 7);
      this.defWallH = (opt && opt.wallH) || 4;
    }
    i(x, z) { return z * this.w + x; }
    inb(x, z) { return x >= 0 && z >= 0 && x < this.w && z < this.h; }
    each(x, z, w, d, fn) {
      for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) if (this.inb(xx, zz)) fn(xx, zz, this.i(xx, zz));
      return this;
    }
    fill(floor) { return this.each(0, 0, this.w, this.h, (x, z, i) => { this.floor[i] = FI[floor]; }); }
    ground(x, z, w, d, floor) { return this.each(x, z, w, d, (xx, zz, i) => { this.floor[i] = FI[floor]; }); }
    clear(x, z, w, d, floor) {
      return this.each(x, z, w, d, (xx, zz, i) => { this.solid[i] = 0; if (floor) this.floor[i] = FI[floor]; });
    }
    wall(x, z, w, d, mat, h) {
      return this.each(x, z, w, d, (xx, zz, i) => { this.solid[i] = 1; this.wallMat[i] = WI[mat || 'stone']; this.wallH[i] = h || this.defWallH; });
    }
    rockWall(x, z, w, d, h) {
      return this.each(x, z, w, d, (xx, zz, i) => { this.solid[i] = 2; this.wallMat[i] = WI.rock; this.wallH[i] = h || 5; });
    }
    pit(x, z, w, d) { return this.each(x, z, w, d, (xx, zz, i) => { this.solid[i] = 3; this.floor[i] = 0; }); }
    roofOver(x, z, w, d, h) { return this.each(x, z, w, d, (xx, zz, i) => { this.roof[i] = h || this.defWallH; }); }
    room(x, z, w, d, o) {
      o = o || {};
      const h = o.h || this.defWallH;
      this.wall(x, z, w, d, o.wall || 'stone', h);
      this.clear(x + 1, z + 1, w - 2, d - 2, o.floor || 'flag');
      if (o.roof !== false) this.roofOver(x + 1, z + 1, w - 2, d - 2, h);
      return this;
    }
    hall(x, z, w, d, o) {
      o = o || {};
      this.clear(x, z, w, d, o.floor || 'flag');
      if (o.roof !== false) this.roofOver(x, z, w, d, o.h || this.defWallH);
      return this;
    }
    opening(x, z, w, d, floor) {
      this.clear(x, z, w, d, floor || null);
      return this.each(x, z, w, d, (xx, zz, i) => { if (!this.floor[i]) this.floor[i] = FI.flag; });
    }
    water(x, z, w, d, level, deep) {
      return this.each(x, z, w, d, (xx, zz, i) => { this.water[i] = level; if (deep) this.deep[i] = 1; });
    }
    heights(fn) {
      for (let z = 0; z <= this.h; z++) for (let x = 0; x <= this.w; x++) this.hv[z * (this.w + 1) + x] = fn(x, z, this.hv[z * (this.w + 1) + x]);
      return this;
    }
    raise(x, z, w, d, hgt) {
      for (let zz = z; zz <= z + d; zz++) for (let xx = x; xx <= x + w; xx++) if (xx >= 0 && zz >= 0 && xx <= this.w && zz <= this.h) this.hv[zz * (this.w + 1) + xx] = hgt;
      return this;
    }
    ramp(x, z, w, d, axis, h0, h1) {
      for (let zz = z; zz <= z + d; zz++) for (let xx = x; xx <= x + w; xx++) {
        if (xx < 0 || zz < 0 || xx > this.w || zz > this.h) continue;
        const t = axis === 'x' ? (xx - x) / w : (zz - z) / d;
        this.hv[zz * (this.w + 1) + xx] = h0 + (h1 - h0) * t;
      }
      return this;
    }
    noiseHeights(amp, scale, seed, mask) {
      return this.heights((x, z, v) => (mask && !mask(x, z) ? v : v + (fbm(x / scale, z / scale, seed || 3, 4) - 0.5) * 2 * amp));
    }
    path(pts, wdt, floor, keepSolid) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
        const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 2);
        for (let k = 0; k <= n; k++) {
          const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n;
          this.each(Math.round(x - wdt / 2), Math.round(z - wdt / 2), wdt, wdt, (xx, zz, ii) => { if (floor) this.floor[ii] = FI[floor]; if (!keepSolid) this.solid[ii] = 0; this.pathMask[ii] = 1; });
        }
      }
      return this;
    }
    pond(cx, cz, r, level, floor, deepR) {
      for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if (!this.inb(x, z)) continue;
        const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz) + D.valueNoise(x * 0.4, z * 0.4, 5) * 1.2;
        if (d > r) continue;
        const i = this.i(x, z);
        this.water[i] = level;
        if (floor) this.floor[i] = FI[floor];
        if (deepR && d < deepR) this.deep[i] = 1;
      }
      return this;
    }
    edgeCliffs(t, h) {
      const w = this.w, d = this.h;
      this.each(0, 0, w, d, (x, z, i) => {
        const e = Math.min(x, z, w - 1 - x, d - 1 - z);
        const n = D.valueNoise(x * 0.3, z * 0.3, 77) * 2;
        if (e < t + n) { this.solid[i] = 2; this.wallMat[i] = WI.rock; this.wallH[i] = (h || 6) + n * 2; }
      });
      return this;
    }
    add(o) { this.objects.push(o); return o; }
    prop(kind, x, z, o) {
      o = o || {};
      const def = D.PROPS[kind];
      if (!def) throw new Error('prop ' + kind);
      const rot = o.rot || 0;
      const sw = rot % 2 ? def.d : def.w, sd = rot % 2 ? def.w : def.d;
      const ox = o.px !== undefined ? o.px : x + sw / 2, oz = o.pz !== undefined ? o.pz : z + sd / 2;
      const block = o.block !== undefined ? o.block : (o.if || o.unless ? 0 : def.block);
      if (block) this.each(x, z, sw, sd, (xx, zz, i) => { this.propBlock[i] = 1; if (def.opaque || o.opaque) this.propOpaque[i] = 1; });
      return this.add(Object.assign({ t: 'prop', kind, x: ox, z: oz, rot, cx: x, cz: z, cw: sw, cd: sd }, o));
    }
    props(kind, list, o) { for (const [x, z, r] of list) this.prop(kind, x, z, Object.assign({}, o, { rot: r || 0 })); return this; }
    npc(id, x, z, o) { return this.add(Object.assign({ t: 'npc', id, x: x + 0.5, z: z + 0.5, face: 0 }, o)); }
    foe(tpl, x, z, o) { return this.add(Object.assign({ t: 'foe', tpl, x: x + 0.5, z: z + 0.5, face: 0, group: 'g' }, o)); }
    foes(tpl, list, o) { for (const [x, z] of list) this.foe(tpl, x, z, o); return this; }
    box(id, x, z, o) {
      const kind = (o && o.kind) || 'chest';
      const def = D.PROPS[kind] || D.PROPS.chest;
      if (def.block && !(o && o.noblock)) this.propBlock[this.i(x, z)] = 1;
      return this.add(Object.assign({ t: 'box', id, x: x + 0.5, z: z + 0.5, kind, face: 0, cx: x, cz: z }, o));
    }
    door(id, x, z, o) { return this.add(Object.assign({ t: 'door', id, x: x + 0.5, z: z + 0.5, cx: x, cz: z, axis: 'x' }, o)); }
    exit(id, x, z, o) { return this.add(Object.assign({ t: 'exit', id, x: x + 0.5, z: z + 0.5, cx: x, cz: z }, o)); }
    use(id, x, z, o) {
      const def = D.PROPS[(o && o.kind) || ''];
      if (def && def.block && !(o && o.noblock)) this.propBlock[this.i(x, z)] = 1;
      return this.add(Object.assign({ t: 'use', id, x: x + 0.5, z: z + 0.5, cx: x, cz: z }, o));
    }
    trig(id, x, z, w, d, o) { return this.add(Object.assign({ t: 'trig', id, x, z, w, d, once: true }, o)); }
    light(x, z, o) { return this.add(Object.assign({ t: 'light', x: x + 0.5, z: z + 0.5, y: 2.2, col: [1, 0.7, 0.4], r: 7, kind: 'torch' }, o)); }
    spot(id, x, z, face) { return this.add({ t: 'spot', id, x: x + 0.5, z: z + 0.5, face: face || 0 }); }
    hole(x, z) { const i = this.i(x, z); this.small[i] = 1; return this; }
    roofShell(x, z, w, d, o) { this.roofs.push(Object.assign({ x, z, w, d, mat: 'thatch', h: this.defWallH, peak: 2.4 }, o)); return this; }
    house(x, z, w, d, o) {
      o = o || {};
      const h = o.h || 3.4;
      if (o.closed) {
        this.wall(x, z, w, d, o.wall || 'timber', h);
      } else {
        this.room(x, z, w, d, { wall: o.wall || 'timber', floor: o.floor || 'wood', h });
        for (const [dx, dz] of o.doors || []) this.clear(x + dx, z + dz, 1, 1, o.floor || 'wood');
      }
      this.roofShell(x, z, w, d, { mat: o.roof || 'thatch', h, peak: o.peak || Math.min(w, d) * 0.45, hideInside: !o.closed, axis: o.axis || (w >= d ? 'x' : 'z') });
      return this;
    }
    scatter(kind, x, z, w, d, n, o) {
      o = o || {};
      let placed = 0, tries = 0;
      while (placed < n && tries++ < n * 30) {
        const xx = x + Math.floor(this.rng.next() * w), zz = z + Math.floor(this.rng.next() * d);
        if (!this.inb(xx, zz)) continue;
        const i = this.i(xx, zz);
        if (this.solid[i] || this.propBlock[i] || !this.floor[i] || !isNaN(this.water[i]) || (this.pathMask[i] && !o.onPath)) continue;
        if (o.avoid && o.avoid(xx, zz)) continue;
        let near = false;
        if (o.gap) for (const ob of this.objects) if (ob.t === 'prop' && Math.abs(ob.cx - xx) < o.gap && Math.abs(ob.cz - zz) < o.gap && ob.kind === kind) { near = true; break; }
        if (near) continue;
        const kinds = Array.isArray(kind) ? kind : [kind];
        const k = kinds[Math.floor(this.rng.next() * kinds.length)];
        this.prop(k, xx, zz, { rot: Math.floor(this.rng.next() * 4), scale: 0.8 + this.rng.next() * 0.45, spin: this.rng.next() * 6.28 });
        placed++;
      }
      return this;
    }
    finish() {
      const w = this.w, h = this.h;
      const nav = new D.Nav(w, h);
      nav.hv.set(this.hv);
      for (let i = 0; i < w * h; i++) {
        const walk = this.floor[i] && !this.solid[i] && !this.propBlock[i] && !this.deep[i];
        nav.walk[i] = walk ? 1 : 0;
        nav.opaque[i] = (this.solid[i] === 1 || this.solid[i] === 2) || this.propOpaque[i] ? 1 : 0;
        nav.small[i] = this.small[i];
        nav.slow[i] = !isNaN(this.water[i]) ? 1 : 0;
      }
      const spots = {};
      for (const o of this.objects) if (o.t === 'spot' || o.t === 'exit') spots[o.id] = o;
      return { w, h, nav, floor: this.floor, solid: this.solid, wallMat: this.wallMat, wallH: this.wallH, roof: this.roof, water: this.water, deep: this.deep, objects: this.objects, roofs: this.roofs, spots, small: this.small };
    }
  }

  D.THEMES = {
    castle_day: { sky: ['#5f86c0', '#c9d6e4'], fog: '#aab6c4', fogNear: 30, fogFar: 110, amb: [0.62, 0.62, 0.66], sun: [0.95, 0.88, 0.72], sunDir: [-0.45, -0.8, -0.35], outdoor: 1, music: 'castle', clouds: 1 },
    castle_night: { sky: ['#0a0c18', '#2a1a20'], fog: '#1a1418', fogNear: 14, fogFar: 60, amb: [0.2, 0.2, 0.3], sun: [0.25, 0.28, 0.45], sunDir: [0.3, -0.7, 0.4], outdoor: 1, music: 'battle', weather: 'embers', glow: '#ff5010' },
    hall: { sky: ['#000', '#000'], fog: '#120c08', fogNear: 20, fogFar: 70, amb: [0.34, 0.3, 0.28], sun: [0, 0, 0], sunDir: [0, -1, 0], outdoor: 0, music: 'castle' },
    orzammar: { sky: ['#0a0604', '#2a1208'], fog: '#2a140a', fogNear: 18, fogFar: 80, amb: [0.4, 0.3, 0.24], sun: [0.35, 0.18, 0.08], sunDir: [0.2, -1, 0.1], outdoor: 1, music: 'dwarf', weather: 'ash', cave: 1 },
    deeproads: { sky: ['#000', '#050302'], fog: '#0a0806', fogNear: 10, fogFar: 46, amb: [0.2, 0.18, 0.16], sun: [0.1, 0.08, 0.05], sunDir: [0, -1, 0], outdoor: 1, music: 'deep', cave: 1 },
    alienage: { sky: ['#7a8aa8', '#d8d0c0'], fog: '#b8b0a0', fogNear: 25, fogFar: 90, amb: [0.6, 0.58, 0.56], sun: [0.9, 0.85, 0.7], sunDir: [0.5, -0.7, -0.3], outdoor: 1, music: 'alienage', clouds: 1 },
    alienage_eve: { sky: ['#3a2a4a', '#d88a5a'], fog: '#8a6a5a', fogNear: 22, fogFar: 80, amb: [0.5, 0.42, 0.44], sun: [1.0, 0.6, 0.35], sunDir: [0.7, -0.35, -0.2], outdoor: 1, music: 'tension', clouds: 1 },
    estate: { sky: ['#000', '#000'], fog: '#0e0a08', fogNear: 18, fogFar: 60, amb: [0.3, 0.27, 0.24], sun: [0, 0, 0], sunDir: [0, -1, 0], outdoor: 0, music: 'tension' },
    forest: { sky: ['#6a9ac0', '#d8e0c8'], fog: '#8aa088', fogNear: 18, fogFar: 75, amb: [0.52, 0.58, 0.5], sun: [0.95, 0.9, 0.7], sunDir: [-0.3, -0.85, 0.25], outdoor: 1, music: 'forest', weather: 'motes', clouds: 1 },
    elfruins: { sky: ['#000', '#000'], fog: '#081210', fogNear: 12, fogFar: 50, amb: [0.24, 0.3, 0.3], sun: [0, 0, 0], sunDir: [0, -1, 0], outdoor: 0, music: 'ruins' },
    fade: { sky: ['#1a0a2a', '#4a6a5a'], fog: '#3a4a4a', fogNear: 10, fogFar: 60, amb: [0.45, 0.42, 0.55], sun: [0.4, 0.6, 0.5], sunDir: [0.2, -0.9, 0.3], outdoor: 1, music: 'fade', weather: 'motes', fadeSky: 1 },
    circle: { sky: ['#000', '#000'], fog: '#0a0c12', fogNear: 18, fogFar: 60, amb: [0.34, 0.34, 0.4], sun: [0, 0, 0], sunDir: [0, -1, 0], outdoor: 0, music: 'circle' },
    ostagar: { sky: ['#4a6a98', '#e8c898'], fog: '#b8a890', fogNear: 30, fogFar: 120, amb: [0.58, 0.56, 0.54], sun: [1.0, 0.82, 0.6], sunDir: [0.6, -0.55, -0.3], outdoor: 1, music: 'ostagar', clouds: 1 },
    ostagar_night: { sky: ['#06080e', '#20243a'], fog: '#141820', fogNear: 18, fogFar: 70, amb: [0.24, 0.26, 0.34], sun: [0.3, 0.32, 0.5], sunDir: [0.4, -0.8, 0.2], outdoor: 1, music: 'battle', weather: 'rain' },
    wilds: { sky: ['#6a7068', '#a8a890'], fog: '#7a806c', fogNear: 12, fogFar: 62, amb: [0.5, 0.52, 0.46], sun: [0.7, 0.72, 0.6], sunDir: [-0.2, -0.9, 0.3], outdoor: 1, music: 'wilds', clouds: 1 },
    tower: { sky: ['#000', '#000'], fog: '#100808', fogNear: 14, fogFar: 50, amb: [0.26, 0.22, 0.22], sun: [0, 0, 0], sunDir: [0, -1, 0], outdoor: 0, music: 'battle' },
    tower_top: { sky: ['#06080e', '#281a20'], fog: '#18101a', fogNear: 18, fogFar: 70, amb: [0.28, 0.26, 0.34], sun: [0.35, 0.3, 0.5], sunDir: [0.3, -0.8, 0.3], outdoor: 1, music: 'battle', weather: 'rain' },
    hut: { sky: ['#4a4a5a', '#b89880'], fog: '#6a6258', fogNear: 14, fogFar: 60, amb: [0.48, 0.46, 0.44], sun: [0.9, 0.7, 0.55], sunDir: [0.6, -0.5, 0.2], outdoor: 1, music: 'witch', weather: 'motes' },
    lothering: { sky: ['#8090a0', '#d0ccc0'], fog: '#a8a8a0', fogNear: 26, fogFar: 100, amb: [0.58, 0.58, 0.58], sun: [0.8, 0.78, 0.72], sunDir: [-0.4, -0.75, 0.4], outdoor: 1, music: 'lothering', clouds: 1 },
    tavern: { sky: ['#000', '#000'], fog: '#140c06', fogNear: 18, fogFar: 50, amb: [0.36, 0.3, 0.24], sun: [0, 0, 0], sunDir: [0, -1, 0], outdoor: 0, music: 'tavern' },
    chantry: { sky: ['#000', '#000'], fog: '#10100c', fogNear: 18, fogFar: 60, amb: [0.4, 0.38, 0.34], sun: [0, 0, 0], sunDir: [0, -1, 0], outdoor: 0, music: 'chantry' }
  };

  D.AREAS = D.AREAS || {};
  D.SCRIPTS = D.SCRIPTS || {};
  D.NPCS = D.NPCS || {};
  D.QUESTS = D.QUESTS || {};
  D.CODEX = D.CODEX || {};
  D.SHOPS = D.SHOPS || {};
  D.GROUPS = D.GROUPS || {};
  const layouts = {};
  const area = (id, def) => { def.id = id; D.AREAS[id] = def; return def; };
  const layout = id => {
    if (layouts[id]) return layouts[id];
    const a = D.AREAS[id];
    if (!a) throw new Error('area ' + id);
    const b = new Builder(a.w, a.h, { seed: a.seed || id.length * 131, wallH: a.wallH });
    a.build(b);
    layouts[id] = b.finish();
    return layouts[id];
  };
  const npc = (id, def) => { def.id = id; D.NPCS[id] = def; return def; };
  const script = (id, fn) => { D.SCRIPTS[id] = fn; return fn; };
  const questDef = (id, def) => { def.id = id; D.QUESTS[id] = def; return def; };
  const codex = (id, cat, title, text) => { D.CODEX[id] = { id, cat, title, text }; };

  D.CODEX_CATS = ['Персонажи', 'Культура и история', 'Существа', 'Магия и религия', 'Места', 'Предметы и записи'];

  Object.assign(D, { Builder, area, layout, npc, script, questDef, codex, FI, WI });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
