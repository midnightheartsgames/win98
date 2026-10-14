(function (B) {
  'use strict';
  const V = B.V;

  const CHANNELS = {
    OB: ['LocX', 'LocY', 'LocZ', 'dLocX', 'dLocY', 'dLocZ', 'RotX', 'RotY', 'RotZ', 'dRotX', 'dRotY', 'dRotZ', 'SizeX', 'SizeY', 'SizeZ', 'dSizeX', 'dSizeY', 'dSizeZ', 'Layer', 'Time', 'ColR', 'ColG', 'ColB', 'ColA'],
    MA: ['R', 'G', 'B', 'SpecR', 'SpecG', 'SpecB', 'MirR', 'MirG', 'MirB', 'Ref', 'Alpha', 'Emit', 'Amb', 'Spec', 'Hard', 'SpTra', 'Ang', 'Mode', 'HaSize', 'OfsX', 'OfsY', 'OfsZ', 'SizeX', 'SizeY', 'SizeZ', 'texR', 'texG', 'texB', 'DefVar', 'Col', 'Nor', 'Var'],
    WO: ['HorR', 'HorG', 'HorB', 'ZenR', 'ZenG', 'ZenB', 'Expos', 'Misi', 'MisDi', 'MisSta', 'MisHi', 'StarR', 'StarB', 'StarG', 'StarDi', 'StarSi', 'OfsX', 'OfsY', 'OfsZ', 'SizeX', 'SizeY', 'SizeZ'],
    LA: ['R', 'G', 'B', 'Energ', 'Dist', 'SpoSi', 'SpoBl', 'Quad1', 'Quad2', 'HaInt', 'OfsX', 'OfsY', 'OfsZ', 'SizeX', 'SizeY', 'SizeZ'],
    CA: ['Lens', 'ClSta', 'ClEnd'],
    KE: ['Speed'],
    SEQ: ['Fac'],
    CU: ['Speed']
  };

  function newCurve(name) { return { name, bezt: [], ipo: 'bezier', extend: 'constant', sel: false, hide: false }; }

  function curveOf(ipo, name, create) {
    let c = ipo.curves.find(x => x.name === name);
    if (!c && create) {
      c = newCurve(name);
      ipo.curves.push(c);
      const order = CHANNELS[ipo.blocktype] || [];
      ipo.curves.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    }
    return c;
  }

  function calcHandles(cu) {
    const bz = cu.bezt;
    bz.sort((a, b) => a.vec[1][0] - b.vec[1][0]);
    for (let i = 0; i < bz.length; i++) {
      const b = bz[i];
      const p = b.vec[1];
      const prev = bz[i - 1] ? bz[i - 1].vec[1] : null, next = bz[i + 1] ? bz[i + 1].vec[1] : null;
      const auto = h => h === 'auto';
      if (b.h1 === 'vect' && prev) b.vec[0] = [p[0] + (prev[0] - p[0]) / 3, p[1] + (prev[1] - p[1]) / 3];
      if (b.h2 === 'vect' && next) b.vec[2] = [p[0] + (next[0] - p[0]) / 3, p[1] + (next[1] - p[1]) / 3];
      if (auto(b.h1) || auto(b.h2)) {
        let slope = 0;
        if (prev && next) {
          slope = (next[1] - prev[1]) / ((next[0] - prev[0]) || 1);
          if ((p[1] - prev[1]) * (next[1] - p[1]) <= 0) slope = 0;
        }
        const dl = prev ? (p[0] - prev[0]) / 3 : (next ? (next[0] - p[0]) / 3 : 1);
        const dr = next ? (next[0] - p[0]) / 3 : (prev ? (p[0] - prev[0]) / 3 : 1);
        if (auto(b.h1)) b.vec[0] = [p[0] - dl, p[1] - slope * dl];
        if (auto(b.h2)) b.vec[2] = [p[0] + dr, p[1] + slope * dr];
      }
      if (b.vec[0][0] > p[0]) b.vec[0][0] = p[0];
      if (b.vec[2][0] < p[0]) b.vec[2][0] = p[0];
    }
  }

  function insertKey(cu, x, y) {
    const ex = cu.bezt.find(b => Math.abs(b.vec[1][0] - x) < 1e-4);
    if (ex) {
      const dy = y - ex.vec[1][1];
      ex.vec.forEach(v => { v[1] += dy; });
    } else cu.bezt.push({ vec: [[x - 1, y], [x, y], [x + 1, y]], h1: 'auto', h2: 'auto', sel: false });
    calcHandles(cu);
  }

  function bezierY(p0, p1, p2, p3, x) {
    let lo = 0, hi = 1, t = 0.5;
    const bx = tt => (1 - tt) ** 3 * p0[0] + 3 * (1 - tt) ** 2 * tt * p1[0] + 3 * (1 - tt) * tt * tt * p2[0] + tt ** 3 * p3[0];
    for (let i = 0; i < 30; i++) {
      t = (lo + hi) / 2;
      if (bx(t) < x) lo = t; else hi = t;
    }
    return (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3 * p3[1];
  }

  function evalCurve(cu, x) {
    const bz = cu.bezt;
    if (!bz.length) return 0;
    const first = bz[0], last = bz[bz.length - 1];
    const x0 = first.vec[1][0], x1 = last.vec[1][0];
    if (bz.length > 1 && (cu.extend === 'cyclic' || cu.extend === 'cyclicx') && (x < x0 || x > x1)) {
      const span = x1 - x0;
      const k = Math.floor((x - x0) / span);
      const xr = x - k * span;
      const v = evalCurve(Object.assign({}, cu, { extend: 'constant' }), xr);
      return cu.extend === 'cyclicx' ? v + k * (last.vec[1][1] - first.vec[1][1]) : v;
    }
    if (x <= x0) {
      if (cu.extend === 'extrap' && bz.length > 1) {
        const s = cu.ipo === 'bezier' ? (first.vec[1][1] - first.vec[0][1]) / ((first.vec[1][0] - first.vec[0][0]) || 1) : (bz[1].vec[1][1] - first.vec[1][1]) / ((bz[1].vec[1][0] - x0) || 1);
        return first.vec[1][1] + (x - x0) * s;
      }
      return first.vec[1][1];
    }
    if (x >= x1) {
      if (cu.extend === 'extrap' && bz.length > 1) {
        const pv = bz[bz.length - 2];
        const s = cu.ipo === 'bezier' ? (last.vec[2][1] - last.vec[1][1]) / ((last.vec[2][0] - last.vec[1][0]) || 1) : (last.vec[1][1] - pv.vec[1][1]) / ((x1 - pv.vec[1][0]) || 1);
        return last.vec[1][1] + (x - x1) * s;
      }
      return last.vec[1][1];
    }
    for (let i = 0; i < bz.length - 1; i++) {
      const a = bz[i], b = bz[i + 1];
      if (x >= a.vec[1][0] && x <= b.vec[1][0]) {
        if (cu.ipo === 'constant') return a.vec[1][1];
        if (cu.ipo === 'linear') {
          const t = (x - a.vec[1][0]) / ((b.vec[1][0] - a.vec[1][0]) || 1);
          return a.vec[1][1] + (b.vec[1][1] - a.vec[1][1]) * t;
        }
        return bezierY(a.vec[1], a.vec[2], b.vec[0], b.vec[1], x);
      }
    }
    return last.vec[1][1];
  }

  function obChannelValue(ob, name) {
    const map = {
      LocX: () => ob.loc[0], LocY: () => ob.loc[1], LocZ: () => ob.loc[2],
      dLocX: () => ob.dloc[0], dLocY: () => ob.dloc[1], dLocZ: () => ob.dloc[2],
      RotX: () => ob.rot[0] / B.DEG / 10, RotY: () => ob.rot[1] / B.DEG / 10, RotZ: () => ob.rot[2] / B.DEG / 10,
      dRotX: () => ob.drot[0] / B.DEG / 10, dRotY: () => ob.drot[1] / B.DEG / 10, dRotZ: () => ob.drot[2] / B.DEG / 10,
      SizeX: () => ob.size[0], SizeY: () => ob.size[1], SizeZ: () => ob.size[2],
      dSizeX: () => ob.dsize[0], dSizeY: () => ob.dsize[1], dSizeZ: () => ob.dsize[2],
      Layer: () => ob.lay, Time: () => ob.ctime || 0
    };
    return map[name] ? map[name]() : 0;
  }

  function applyObChannel(ob, name, v) {
    const set = {
      LocX: () => { ob.loc[0] = v; }, LocY: () => { ob.loc[1] = v; }, LocZ: () => { ob.loc[2] = v; },
      dLocX: () => { ob.dloc[0] = v; }, dLocY: () => { ob.dloc[1] = v; }, dLocZ: () => { ob.dloc[2] = v; },
      RotX: () => { ob.rot[0] = v * 10 * B.DEG; }, RotY: () => { ob.rot[1] = v * 10 * B.DEG; }, RotZ: () => { ob.rot[2] = v * 10 * B.DEG; },
      dRotX: () => { ob.drot[0] = v * 10 * B.DEG; }, dRotY: () => { ob.drot[1] = v * 10 * B.DEG; }, dRotZ: () => { ob.drot[2] = v * 10 * B.DEG; },
      SizeX: () => { ob.size[0] = v; }, SizeY: () => { ob.size[1] = v; }, SizeZ: () => { ob.size[2] = v; },
      dSizeX: () => { ob.dsize[0] = v; }, dSizeY: () => { ob.dsize[1] = v; }, dSizeZ: () => { ob.dsize[2] = v; },
      Layer: () => { ob.lay = Math.max(1, Math.round(v)) & 0xFFFFF; }, Time: () => { ob.ctime = v; }
    };
    if (set[name]) set[name]();
  }

  const MA_KEYS = { R: 'r', G: 'g', B: 'b', SpecR: 'specr', SpecG: 'specg', SpecB: 'specb', MirR: 'mirr', MirG: 'mirg', MirB: 'mirb', Ref: 'ref', Alpha: 'alpha', Emit: 'emit', Amb: 'amb', Spec: 'spec', Hard: 'hard', SpTra: 'spectra', Ang: 'add' };
  const WO_KEYS = { HorR: 'horr', HorG: 'horg', HorB: 'horb', ZenR: 'zenr', ZenG: 'zeng', ZenB: 'zenb', Expos: 'exposure' };
  const LA_KEYS = { R: 'r', G: 'g', B: 'b', Energ: 'energy', Dist: 'dist', SpoSi: 'spotsize', SpoBl: 'spotblend', Quad1: 'quad1', Quad2: 'quad2', HaInt: 'haint' };
  const CA_KEYS = { Lens: 'lens', ClSta: 'clipsta', ClEnd: 'clipend' };

  function dataChannel(owner, type, name) {
    const keys = type === 'MA' ? MA_KEYS : type === 'WO' ? WO_KEYS : type === 'LA' ? LA_KEYS : type === 'CA' ? CA_KEYS : {};
    if (keys[name]) return { get: () => owner[keys[name]], set: v => { owner[keys[name]] = v; } };
    if (type === 'MA' && name === 'HaSize') return { get: () => owner.halo.size, set: v => { owner.halo.size = v; } };
    if (type === 'WO' && ['Misi', 'MisDi', 'MisSta', 'MisHi'].includes(name)) {
      const k = { Misi: 'intensity', MisDi: 'dist', MisSta: 'sta', MisHi: 'height' }[name];
      return { get: () => owner.mist[k], set: v => { owner.mist[k] = v; } };
    }
    if (type === 'WO' && ['StarDi', 'StarSi'].includes(name)) {
      const k = { StarDi: 'dist', StarSi: 'size' }[name];
      return { get: () => owner.stars[k], set: v => { owner.stars[k] = v; } };
    }
    const tx = { OfsX: ['ofs', 0], OfsY: ['ofs', 1], OfsZ: ['ofs', 2], SizeX: ['size', 0], SizeY: ['size', 1], SizeZ: ['size', 2] }[name];
    if (tx && owner.mtex) {
      const mt = owner.mtex[owner.texact || 0];
      if (mt) return { get: () => mt[tx[0]][tx[1]], set: v => { mt[tx[0]][tx[1]] = v; } };
    }
    const tc = { texR: 'r', texG: 'g', texB: 'b', DefVar: 'def_var', Col: 'colfac', Nor: 'norfac', Var: 'varfac' }[name];
    if (tc && owner.mtex) {
      const mt = owner.mtex[owner.texact || 0];
      if (mt) return { get: () => mt[tc], set: v => { mt[tc] = v; } };
    }
    return null;
  }

  function obTime(ob, cfra) {
    let t = cfra - (ob.sf || 0);
    if (ob.parent && ob.ipoflag && ob.ipoflag.offsPar) t -= 0;
    return t;
  }

  function evalIpoFor(owner, ipo, type, cfra, ob) {
    if (!ipo) return;
    const t = ob ? obTime(ob, cfra) : cfra;
    ipo.curves.forEach(cu => {
      if (!cu.bezt.length) return;
      const v = evalCurve(cu, t);
      if (type === 'OB') applyObChannel(owner, cu.name, v);
      else { const ch = dataChannel(owner, type, cu.name); if (ch) ch.set(v); }
    });
  }

  function evalMeshKeys(ob, cfra) {
    const me = ob.data;
    const key = me && me.key;
    if (!key || !key.blocks || key.blocks.length < 2) return;
    let pos;
    if (key.ipo && key.ipo.curves[0] && key.ipo.curves[0].bezt.length) pos = evalCurve(key.ipo.curves[0], cfra) * key.blocks[key.blocks.length - 1].pos;
    else pos = cfra;
    const bl = key.blocks;
    let a = bl[0], b = bl[bl.length - 1], t = 0;
    if (pos <= bl[0].pos) { a = b = bl[0]; }
    else if (pos >= bl[bl.length - 1].pos) { a = b = bl[bl.length - 1]; }
    else for (let i = 0; i < bl.length - 1; i++) if (pos >= bl[i].pos && pos <= bl[i + 1].pos) { a = bl[i]; b = bl[i + 1]; t = (pos - a.pos) / ((b.pos - a.pos) || 1); break; }
    const n = Math.min(me.verts.length, a.data.length, b.data.length);
    for (let i = 0; i < n; i++) me.verts[i].co = V.lerp(a.data[i], b.data[i], t);
    me.stamp = (me.stamp || 0) + 1;
  }

  function setFrame(ctx, cfra, noRedraw) {
    const sce = ctx.scene;
    B.curFrame = cfra;
    const seen = new Set();
    sce.bases.forEach(b => {
      const ob = b.object;
      if (ob.ipo) evalIpoFor(ob, ob.ipo, 'OB', cfra, ob);
      if (ob.data && ob.data.key && ctx.G.obedit !== ob) evalMeshKeys(ob, cfra);
      const mats = [...(ob.mats || []), ...((ob.data && ob.data.mats) || [])];
      mats.forEach(m => { if (m && m.ipo && !seen.has(m)) { seen.add(m); evalIpoFor(m, m.ipo, 'MA', cfra); } });
      if (ob.type === 'lamp' && ob.data.ipo && !seen.has(ob.data)) { seen.add(ob.data); evalIpoFor(ob.data, ob.data.ipo, 'LA', cfra); }
      if (ob.type === 'camera' && ob.data.ipo && !seen.has(ob.data)) { seen.add(ob.data); evalIpoFor(ob.data, ob.data.ipo, 'CA', cfra); }
      if (B.ObTypes && B.ObTypes[ob.type] && B.ObTypes[ob.type].frameChanged) B.ObTypes[ob.type].frameChanged(ob, cfra);
    });
    if (sce.world && sce.world.ipo) evalIpoFor(sce.world, sce.world.ipo, 'WO', cfra);
    sce.bases.forEach(b => B.Data.whereIs(b.object));
    if (B.Effects) B.Effects.frameChanged(ctx, cfra);
    if (!noRedraw) ctx.redrawAll();
  }

  function frameChanged(ctx) { setFrame(ctx, ctx.scene.cfra); }

  function ensureIpo(ctx, owner, type, nameBase) {
    if (!owner.ipo) owner.ipo = B.Data.idUser(B.Data.newIpo(ctx.main, nameBase || (type === 'OB' ? 'ObIpo' : type === 'MA' ? 'MatIpo' : type === 'WO' ? 'WoIpo' : type === 'LA' ? 'LaIpo' : type === 'CA' ? 'CaIpo' : 'Ipo'), type));
    return owner.ipo;
  }

  function insertObKeys(ctx, ob, mode) {
    const groups = { 0: ['LocX', 'LocY', 'LocZ'], 1: ['RotX', 'RotY', 'RotZ'], 2: ['SizeX', 'SizeY', 'SizeZ'], 3: ['LocX', 'LocY', 'LocZ', 'RotX', 'RotY', 'RotZ'], 4: ['LocX', 'LocY', 'LocZ', 'RotX', 'RotY', 'RotZ', 'SizeX', 'SizeY', 'SizeZ'], 5: ['Layer'] };
    const ipo = ensureIpo(ctx, ob, 'OB');
    let names = groups[mode];
    if (mode === 9) names = ipo.curves.filter(c => c.bezt.length).map(c => c.name);
    if (!names) return;
    const t = obTime(ob, ctx.scene.cfra);
    names.forEach(n => insertKey(curveOf(ipo, n, true), t, obChannelValue(ob, n)));
  }

  function insertMeshKey(ctx, ob) {
    const me = ob.data;
    if (!me.key) me.key = { blocks: [], type: 'normal', slurph: 0, ipo: null };
    const verts = (ctx.G.obedit === ob && ctx.G.editMesh ? ctx.G.editMesh.verts : me.verts).map(v => v.co.slice());
    const pos = ctx.scene.cfra;
    const ex = me.key.blocks.find(b => b.pos === pos);
    if (ex) ex.data = verts; else me.key.blocks.push({ pos, data: verts });
    me.key.blocks.sort((a, b) => a.pos - b.pos);
  }

  function updateKeyFromEdit(ctx, ob) {
    const me = ob.data;
    if (!me.key || !me.key.blocks.length) return;
    const pos = ctx.scene.cfra;
    let best = me.key.blocks[0];
    me.key.blocks.forEach(b => { if (Math.abs(b.pos - pos) < Math.abs(best.pos - pos)) best = b; });
    if (best.data.length === me.verts.length) best.data = me.verts.map(v => v.co.slice());
    else me.key.blocks.forEach(b => { b.data = me.verts.map(v => v.co.slice()); });
  }

  function insertKeyMenu(ctx) {
    const base = ctx.scene.basact;
    if (!base) return;
    const ob = base.object;
    let str = 'Insert Key %t|Loc%x0|Rot%x1|Size%x2|LocRot%x3|LocRotSize%x4|Layer%x5|Avail%x9';
    if (ob.type === 'mesh') str += '| %x6|Mesh%x7';
    B.UI.pupmenu(ctx, str).then(v => {
      if (v == null || v < 0 || v === 6) return;
      if (v === 7) insertMeshKey(ctx, ob);
      else B.ObjectOps.selectedBases(ctx).forEach(b => insertObKeys(ctx, b.object, v));
      ctx.redrawAll();
    });
  }

  function insertDataKeys(ctx, kind) {
    const ob = ctx.scene.basact ? ctx.scene.basact.object : null;
    let owner = null, str = '', groups = {};
    if (kind === 'material') {
      owner = B.Shading.activeMaterial(ctx);
      str = 'Insert Key %t|RGB%x0|Alpha%x1|HaSize%x2|Mode %x3|All Color%x10|Ofs%x12|Size%x13|All Mapping%x11';
      groups = { 0: ['R', 'G', 'B'], 1: ['Alpha'], 2: ['HaSize'], 3: ['Mode'], 10: ['R', 'G', 'B', 'Alpha', 'SpecR', 'SpecG', 'SpecB', 'Ref', 'Emit', 'Amb', 'Spec', 'Hard'], 12: ['OfsX', 'OfsY', 'OfsZ'], 13: ['SizeX', 'SizeY', 'SizeZ'], 11: ['OfsX', 'OfsY', 'OfsZ', 'SizeX', 'SizeY', 'SizeZ', 'texR', 'texG', 'texB', 'Col', 'Nor', 'Var'] };
    } else if (kind === 'world') {
      owner = ctx.scene.world;
      str = 'Insert Key %t|ZenRGB%x0|HorRGB%x1|Mist%x2|stars %x3|Ofs%x12|Size%x13';
      groups = { 0: ['ZenR', 'ZenG', 'ZenB'], 1: ['HorR', 'HorG', 'HorB'], 2: ['Misi', 'MisDi', 'MisSta', 'MisHi'], 3: ['StarDi', 'StarSi'], 12: ['OfsX', 'OfsY', 'OfsZ'], 13: ['SizeX', 'SizeY', 'SizeZ'] };
    } else if (kind === 'lamp' && ob && ob.type === 'lamp') {
      owner = ob.data;
      str = 'Insert Key %t|RGB%x0|Energy%x1|Spotsi%x2|Ofs%x12|Size%x13';
      groups = { 0: ['R', 'G', 'B'], 1: ['Energ'], 2: ['SpoSi'], 12: ['OfsX', 'OfsY', 'OfsZ'], 13: ['SizeX', 'SizeY', 'SizeZ'] };
    } else if (kind === 'camera' && ob && ob.type === 'camera') {
      owner = ob.data;
      str = 'Insert Key %t|Lens%x0|Clipping%x1';
      groups = { 0: ['Lens'], 1: ['ClSta', 'ClEnd'] };
    }
    if (!owner) return;
    const type = { material: 'MA', world: 'WO', lamp: 'LA', camera: 'CA' }[kind];
    B.UI.pupmenu(ctx, str).then(v => {
      if (v == null || v < 0 || !groups[v]) return;
      const ipo = ensureIpo(ctx, owner, type);
      groups[v].forEach(n => { const ch = dataChannel(owner, type, n); if (ch) insertKey(curveOf(ipo, n, true), ctx.scene.cfra, ch.get()); });
      ctx.redrawAll();
    });
  }

  function showKeys(ctx) {
    ctx.G.showKeys = !ctx.G.showKeys;
    ctx.redrawAll();
  }


  function play(ctx, onlyArea) {
    if (ctx.G.playing) { ctx.G.playing.stop(); return; }
    const sce = ctx.scene;
    const fps = sce.r.frs_sec || 25;
    const start = performance.now();
    const f0 = sce.cfra;
    let req = 0;
    const st = {
      area: onlyArea,
      stop() {
        if (req) (typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame : clearTimeout)(req);
        ctx.G.playing = null;
        ctx.modal = null;
        ctx.redrawAll();
      }
    };
    ctx.G.playing = st;
    const tick = () => {
      if (ctx.destroyed || ctx.G.playing !== st) return;
      const el = (performance.now() - start) / 1000;
      const span = sce.r.efra - sce.r.sfra + 1;
      let f = f0 + Math.floor(el * fps);
      f = sce.r.sfra + ((f - sce.r.sfra) % span + span) % span;
      if (f !== sce.cfra) { sce.cfra = f; setFrame(ctx, f, true); if (onlyArea) { onlyArea.redraw(); ctx.redrawType('ipo'); ctx.redrawType('buts'); ctx.schedule(); } else ctx.redrawAll(); }
      req = (typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : f2 => setTimeout(f2, 16))(tick);
    };
    ctx.modal = {
      key(e) { if (e.key === 'ESC' || (e.key === 'A' && e.alt)) { st.stop(); return true; } return false; },
      down() { st.stop(); return true; }
    };
    tick();
  }

  function copyIpo(ctx, ipo) {
    const n = B.Data.newIpo(ctx.main, ipo.name, ipo.blocktype);
    n.curves = JSON.parse(JSON.stringify(ipo.curves));
    return n;
  }

  B.Anim = { CHANNELS, newCurve, curveOf, calcHandles, insertKey, evalCurve, setFrame, frameChanged, insertKeyMenu, insertDataKeys, insertObKeys, insertMeshKey, updateKeyFromEdit, showKeys, play, copyIpo, obChannelValue, dataChannel, ensureIpo, evalIpoFor };
})(globalThis.B204 = globalThis.B204 || {});
