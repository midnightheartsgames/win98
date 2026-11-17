(function (HO) {
  'use strict';
  const BASE = 'content/hsro/';
  const TYPES = { f: Float32Array, B: Uint8Array, H: Uint16Array };

  const PART_IDS = [
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => 'part_hair' + i), ...[0, 1, 2].map(i => 'part_ears' + i), ...[0, 1, 2].map(i => 'part_tail' + i),
    ...['d', 'a', 'e'].flatMap(p => [1, 2, 3].map(t => 'part_w_' + p + t))
  ];
  HO.MODEL_IDS = {
    heroes: { human_f: 'hero_human_f', human_m: 'hero_human_m', foxian_f: 'hero_fox_f', foxian_m: 'hero_fox_m' },
    parts: PART_IDS,
    npcs: { body_f: 'npc_coat_f', body_m: 'npc_coat_m', dog: 'npc_peppy', robot: 'npc_robot', creature: 'npc_creature' },
    extras: ['part_cap_nurse', 'part_cap_guard', 'part_helmet_work', 'part_glasses'],
    props: { panel: 'prop_panel', crate: 'prop_crate', lift: 'prop_lift', curio: 'prop_curio', capsule: 'prop_capsule', terminal: 'prop_terminal', vendor: 'prop_vendor', beacon: 'prop_beacon', chest: 'prop_chest', anchor: 'prop_anchor', rift: 'prop_rift', nest: 'prop_nest', podium: 'prop_podium' },
    foes: { orb: 'foe_baryon', orb2: 'foe_antibaryon', ranger: 'foe_reaver', ranger2: 'foe_eliminator', ranger3: 'foe_distorter', weaver: 'foe_weaver', spawn: 'foe_flamespawn', beast: 'elite_trampler', trotter: 'foe_trotter', sting: 'foe_sting_young', sting2: 'foe_sting_gnaw', warden: 'boss_keeper', culture: 'boss_culture', swarmking: 'boss_skaracabaz', doomsday: 'boss_doomsday' },
    kit: ['kit_floor', 'kit_wall', 'kit_pillar']
  };

  HO.SURFACES = {
    floor: { top: ['floor', 4], side: ['metal', 2] },
    wall: { top: ['metal', 2], side: ['wall', 4, true], long: 'window' },
    pillar: { top: ['gold', 0], side: ['gold', 1.5, true] },
    step: { top: ['metal', 2], side: ['metal', 2] },
    block: { top: ['metal', 2], side: ['metal', 2] },
    ramp: { top: ['metal', 2], side: ['metal', 2] },
    crate: { top: ['crate', 2], side: ['crate', 2, true] },
    portrait: { top: ['gold', 0], side: ['portrait', 0] },
    bed: { top: ['bed', 0], side: ['desk', 2, true] },
    desk: { top: ['desktop', 2], side: ['desk', 2, true] },
    machine: { top: ['metal', 2], side: ['machine', 2, true] },
    ship: { top: ['hull', 4], side: ['hull', 4] },
    core: { top: ['core', 0], side: ['core', 0] },
    shelf: { top: ['metal', 2], side: ['shelf', 2, true] },
    rail: { top: ['rail', 4], side: ['metal', 2] },
    void: { top: ['space', 8], side: ['space', 8] },
    tank: { top: ['metal', 2], side: ['tank', 3, true] },
    planter: { top: ['soil', 2], side: ['planter', 2, true] },
    cabinet: { top: ['metal', 2], side: ['cabinet', 1.5, true] }
  };
  HO.LONG_WALL = 12;

  HO.surfaceFaces = function (b) {
    const [x0, y0, z0, x1, y1, z1] = b, sp = HO.SURFACES[b[6]] || HO.SURFACES.block, out = [];
    const faces = [
      { n: [0, 1, 0], k: 1, p: [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]] },
      { n: [0, -1, 0], k: 0.7, p: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]] },
      { n: [0, 0, 1], k: 0.95, t: [1, 0], p: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
      { n: [0, 0, -1], k: 0.95, t: [-1, 0], p: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]] },
      { n: [1, 0, 0], k: 0.9, t: [0, -1], p: [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]] },
      { n: [-1, 0, 0], k: 0.9, t: [0, 1], p: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]] }
    ];
    for (const f of faces) {
      if (!f.t) {
        const [mat, s] = sp.top;
        out.push({ mat, n: f.n, k: f.k, p: f.p, uv: f.p.map(q => s ? [q[0] / s, q[2] / s] : [(q[0] - x0) / (x1 - x0), (q[2] - z0) / (z1 - z0)]) });
        continue;
      }
      const along = f.t[0] ? x1 - x0 : z1 - z0, side = q => q[0] * f.t[0] + q[2] * f.t[1];
      const [mat0, s, fitV] = sp.side, mat = sp.long && along >= HO.LONG_WALL ? sp.long : mat0;
      const lo = Math.min(...f.p.map(side));
      out.push({ mat, n: f.n, k: f.k, p: f.p, uv: f.p.map(q => [s ? side(q) / s : (side(q) - lo) / along, fitV || !s ? (y1 - q[1]) / (y1 - y0) : -q[1] / s]) });
    }
    return out;
  };

  const hexRgb = hex => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

  HO.heroParts = function (race, path, look, coneQ) {
    const lk = look || {}, tint = hexRgb(HO.LOOK.hairColors[(lk.hairColor | 0) % HO.LOOK.hairColors.length]);
    const parts = [{ model: 'part_hair' + ((lk.hair | 0) % 8), tint }];
    if (race === 'foxian') parts.push({ model: 'part_ears' + ((lk.ears | 0) % 3), tint }, { model: 'part_tail' + ((lk.tail | 0) % 3), tint });
    parts.push({ model: 'part_w_' + path[0] + (coneQ >= 4 ? 3 : coneQ === 3 ? 2 : 1) });
    return parts;
  };

  HO.EFFECT_CAP = 48;

  HO.sphereVisible = function (m, x, y, z, r, far, eye) {
    if (far && eye) {
      const dx = x - eye[0], dy = y - eye[1], dz = z - eye[2];
      if (dx * dx + dy * dy + dz * dz > (far + r) * (far + r)) return false;
    }
    const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (cw < -r) return false;
    const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13];
    const pad = r * 2.5 + 0.5;
    return Math.abs(cx) <= cw + pad && Math.abs(cy) <= cw + pad;
  };

  HO.FOE_SCALE = { gnawsting_e: 1.35 };

  HO.FX_ELEMS = ['phys', 'fire', 'ice', 'elec', 'wind', 'quant', 'imag', 'heal'];
  HO.fxCell = elem => (HO.FX_ELEMS.includes(elem) ? elem : 'glow');

  HO.NPC_LOOKS = {
    wen_minde: { sex: 'm', hair: 0, face: 1, extra: ['glasses'] },
    wen_tw: { sex: 'm', hair: 6, face: 3 },
    mayr: { sex: 'f', hair: 3, face: 5, extra: ['glasses'] },
    watson: { sex: 'm', hair: 0, face: 5 },
    hinkel: { sex: 'm', hair: 7, face: 1, extra: ['glasses'] },
    abraham: { sex: 'm', hair: 6, face: 2 },
    joanna: { sex: 'f', hair: 1, face: 0, extra: ['cap_nurse'] },
    captain: { sex: 'm', hair: 0, face: 3, ears: 1, tail: 2 },
    bob: { sex: 'm', hair: 0, face: 4, extra: ['helmet_work'] },
    adler: { sex: 'm', hair: 7, face: 3 },
    loader: { sex: 'm', hair: 6, face: 2, ears: 2, tail: 1 },
    asta: { sex: 'f', hair: 2, face: 0 },
    arlan: { sex: 'm', hair: 6, face: 3 },
    herta: { sex: 'f', hair: 3, face: 2, scale: 0.86 },
    herta_puppet: { sex: 'f', hair: 3, face: 2, scale: 0.86 },
    herta_puppet2: { sex: 'f', hair: 3, face: 2, scale: 0.86 },
    emily: { sex: 'f', hair: 5, face: 4 },
    eikura: { sex: 'f', hair: 4, face: 1, extra: ['glasses'] },
    lukacs: { sex: 'm', hair: 7, face: 2 },
    wen_shici: { sex: 'f', hair: 5, face: 0 },
    duty: { sex: 'm', hair: 0, face: 3, extra: ['cap_guard'] },
    kapote: { sex: 'm', hair: 6, face: 4 },
    lamina: { sex: 'f', hair: 1, face: 5, extra: ['glasses'] }
  };

  HO.npcSpec = function (key) {
    if (HO.NPC_LOOKS[key]) return HO.NPC_LOOKS[key];
    let h = 7;
    for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return { sex: h % 2 ? 'm' : 'f', hair: (h >>> 3) % 8, face: (h >>> 7) % 6 };
  };

  HO.npcParts = function (key, look) {
    const sp = HO.npcSpec(key), fox = look.race === 'foxian', tint = hexRgb(look.hair || '#2a2026');
    const parts = [{ model: 'part_hair' + sp.hair, tint }];
    if (fox) parts.push({ model: 'part_ears' + (sp.ears | 0), tint }, { model: 'part_tail' + (sp.tail | 0), tint });
    for (const x of sp.extra || []) parts.push({ model: 'part_' + x });
    return { model: fox ? HO.MODEL_IDS.heroes['foxian_' + sp.sex] : HO.MODEL_IDS.npcs['body_' + sp.sex], parts, face: sp.face, scale: sp.scale || 1 };
  };

  function paintLook(model, faces, skin, coat, face) {
    const img = model.image, meta = model.meta.look;
    if (!img || !meta || !faces || typeof document === 'undefined') return null;
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const c = cv.getContext('2d');
    c.drawImage(img, 0, 0);
    c.globalCompositeOperation = 'multiply';
    for (const [col, rects] of [[skin, meta.skin], [coat, meta.coat]]) {
      if (!col || !rects) continue;
      c.fillStyle = col;
      for (const [x, y, w, h] of rects) c.fillRect(x, y, w, h);
    }
    c.globalCompositeOperation = 'source-over';
    const cell = meta.cells[(face | 0) % meta.cells.length], f = meta.face;
    c.drawImage(faces, cell[0], cell[1], cell[2], cell[3], f[0], f[1], f[2], f[3]);
    return cv;
  }

  HO.npcKey = (id, look, face) => id + ':' + look.skin + ':' + look.coat + ':' + face;
  HO.npcCanvas = (model, faces, look, face) => paintLook(model, faces, look.skin, look.coat, face);

  HO.lookKey = (id, look) => id + ':' + ((look && look.skin) | 0) + ':' + ((look && look.face) | 0);

  HO.lookCanvas = function (model, faces, look) {
    const lk = look || {};
    return paintLook(model, faces, HO.LOOK.skins[(lk.skin | 0) % HO.LOOK.skins.length], null, lk.face);
  };
  HO.CLIP_NAMES = ['idle', 'run', 'attack', 'cast', 'death'];

  function view(meta, buf, name) {
    const v = meta.views[name];
    if (!v) return null;
    const Type = TYPES[v.type];
    const n = name === 'idx' || name.startsWith('clip:') ? v.count : v.count * ({ pos: 3, nor: 3, uv: 2, uv2: 2, joints: 4, weights: 2 }[name] || 1);
    return new Type(buf, v.offset, n);
  }

  function parse(meta, buf) {
    const clips = {};
    for (const [name, c] of Object.entries(meta.clips || {})) clips[name] = { frames: c.frames, loop: c.loop, data: view(meta, buf, c.view) };
    return {
      meta,
      pos: view(meta, buf, 'pos'), nor: view(meta, buf, 'nor'), uv: view(meta, buf, 'uv'), uv2: view(meta, buf, 'uv2'),
      joints: view(meta, buf, 'joints'), weights: view(meta, buf, 'weights'), idx: view(meta, buf, 'idx'),
      bones: meta.bones.length, fps: meta.fps, clips
    };
  }

  function loadImage(url) {
    return new Promise((ok, fail) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => fail(new Error('нет текстуры ' + url));
      img.src = url;
    });
  }

  HO.loadImage = loadImage;

  const cache = {};
  HO.loadModel = function (id) {
    if (!cache[id]) {
      cache[id] = (async () => {
        const meta = await (await fetch(BASE + 'mesh/' + id + '.json')).json();
        const buf = await (await fetch(BASE + meta.bin)).arrayBuffer();
        const model = parse(meta, buf);
        if (meta.tex) model.image = await loadImage(BASE + meta.tex);
        return model;
      })();
    }
    return cache[id];
  };

  HO.samplePose = function (model, clip, time, out) {
    const c = model.clips[clip] || model.clips.idle;
    const n = model.bones, res = out || new Float32Array(n * 8);
    const f = time * model.fps;
    let i0, i1, k;
    if (c.loop) { const w = ((f % c.frames) + c.frames) % c.frames; i0 = Math.floor(w); i1 = (i0 + 1) % c.frames; k = w - i0; }
    else { const w = Math.min(Math.max(f, 0), c.frames - 1); i0 = Math.floor(w); i1 = Math.min(i0 + 1, c.frames - 1); k = w - i0; }
    const d = c.data;
    for (let b = 0; b < n; b++) {
      const a = (i0 * n + b) * 7, e = (i1 * n + b) * 7;
      let qx = d[e], qy = d[e + 1], qz = d[e + 2], qw = d[e + 3];
      if (d[a] * qx + d[a + 1] * qy + d[a + 2] * qz + d[a + 3] * qw < 0) { qx = -qx; qy = -qy; qz = -qz; qw = -qw; }
      let x = d[a] + (qx - d[a]) * k, y = d[a + 1] + (qy - d[a + 1]) * k, z = d[a + 2] + (qz - d[a + 2]) * k, w = d[a + 3] + (qw - d[a + 3]) * k;
      const l = Math.hypot(x, y, z, w) || 1;
      res[b * 8] = x / l; res[b * 8 + 1] = y / l; res[b * 8 + 2] = z / l; res[b * 8 + 3] = w / l;
      res[b * 8 + 4] = d[a + 4] + (d[e + 4] - d[a + 4]) * k;
      res[b * 8 + 5] = d[a + 5] + (d[e + 5] - d[a + 5]) * k;
      res[b * 8 + 6] = d[a + 6] + (d[e + 6] - d[a + 6]) * k;
      res[b * 8 + 7] = 0;
    }
    return res;
  };

  HO.blendPose = function (a, b, k, out) {
    const res = out || new Float32Array(a.length);
    for (let i = 0; i < a.length; i += 8) {
      let x = b[i], y = b[i + 1], z = b[i + 2], w = b[i + 3];
      if (a[i] * x + a[i + 1] * y + a[i + 2] * z + a[i + 3] * w < 0) { x = -x; y = -y; z = -z; w = -w; }
      const qx = a[i] + (x - a[i]) * k, qy = a[i + 1] + (y - a[i + 1]) * k, qz = a[i + 2] + (z - a[i + 2]) * k, qw = a[i + 3] + (w - a[i + 3]) * k;
      const l = Math.hypot(qx, qy, qz, qw) || 1;
      res[i] = qx / l; res[i + 1] = qy / l; res[i + 2] = qz / l; res[i + 3] = qw / l;
      for (let j = 4; j < 7; j++) res[i + j] = a[i + j] + (b[i + j] - a[i + j]) * k;
      res[i + 7] = 0;
    }
    return res;
  };

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
