(function (B) {
  'use strict';
  const V = B.V, M = B.M;

  function newEffect(type) {
    if (type === 'build') return { type, len: 100, sfra: 1, sel: true };
    if (type === 'wave') return { type, sel: true, startx: 0, starty: 0, height: 0.5, width: 1.5, narrow: 1.5, speed: 0.5, timeoffs: 0, lifetime: 0, damp: 10, minfac: 0, flag: { x: true, y: true, cycl: false } };
    return { type: 'particles', sel: true, totpart: 1000, totkey: 8, sta: 1, end: 100, lifetime: 50, randlife: 0, seed: 0, normfac: 1, obfac: 0, randfac: 0, texfac: 0, force: [0, 0, 0], damp: 0, nabla: 0.05, vectsize: 0, mat: 1, mult: [0, 0, 0, 0], life: [50, 50, 50, 50], child: [4, 4, 4, 4], curmult: 0, flag: { bspline: false, static: false, face: false, vect: false } };
  }

  function rng(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  function applyWave(me, eff, cfra) {
    const t = (cfra - eff.timeoffs) * eff.speed;
    if (eff.lifetime > 0 && cfra - eff.timeoffs > eff.lifetime) return me;
    const out = B.MeshOps.copyMesh(me);
    out.verts.forEach(v => {
      const dx = eff.flag.x ? v.co[0] - eff.startx : 0, dy = eff.flag.y ? v.co[1] - eff.starty : 0;
      const d = Math.hypot(dx, dy);
      const x = d - t;
      let amp = 0;
      if (x > -eff.width && x < eff.width) {
        const xx = x / eff.width * Math.PI;
        amp = eff.height * Math.exp(-eff.narrow * (x / eff.width) * (x / eff.width)) * Math.cos(xx);
        if (eff.damp > 0) amp *= Math.max(0, 1 - Math.max(0, cfra - eff.timeoffs) / eff.damp / 10);
      }
      v.co = [v.co[0], v.co[1], v.co[2] + amp];
    });
    return out;
  }

  function applyBuild(me, eff, cfra) {
    const f = (cfra - eff.sfra) / Math.max(1, eff.len);
    if (f >= 1) return me;
    const n = Math.max(0, Math.floor(me.faces.length * Math.max(0, f)));
    const out = { verts: me.verts, faces: me.faces.slice(0, n), mats: me.mats, flag: me.flag, smesh: false, stamp: 'build' + n };
    return out;
  }

  function particles(ob, eff, cfra) {
    const me = ob.data;
    if (!me || !me.verts.length) return [];
    const r = rng(eff.seed + 1);
    const normals = B.MeshOps.vertexNormals(me);
    const pts = [];
    const span = Math.max(1, eff.end - eff.sta);
    const total = Math.min(eff.totpart, 5000);
    B.Data.whereIs(ob);
    for (let i = 0; i < total; i++) {
      const vi = Math.floor(r() * me.verts.length);
      const born = eff.sta + (i / total) * span;
      const life = eff.lifetime * (1 + (r() - 0.5) * 2 * eff.randlife);
      const rv = [r() - 0.5, r() - 0.5, r() - 0.5];
      if (eff.flag.static) {
        pts.push({ pos: M.loc(ob.obmat, me.verts[vi].co), age: 0 });
        continue;
      }
      const age = cfra - born;
      if (age < 0 || age > life) continue;
      const p0 = M.loc(ob.obmat, me.verts[vi].co);
      const n = V.norm(M.dir(ob.obmat, normals[vi]));
      let vel = V.add(V.mul(n, eff.normfac * 0.1), V.mul(rv, eff.randfac * 0.2));
      const t = age;
      const damp = Math.pow(1 - Math.min(0.99, eff.damp), t);
      const pos = V.add(p0, V.add(V.mul(vel, t * damp), V.mul(eff.force, 0.5 * t * t * 0.01)));
      pts.push({ pos, age: age / life, vel });
    }
    return pts;
  }

  function derived(ob, ctx, me) {
    const cfra = ctx ? ctx.scene.cfra : 1;
    let out = me;
    (ob.effects || []).forEach(e => {
      if (e.type === 'wave') out = applyWave(out, e, cfra);
      else if (e.type === 'build') out = applyBuild(out, e, cfra);
    });
    return out;
  }

  function hasGeomEffect(ob) { return (ob.effects || []).some(e => e.type === 'wave' || e.type === 'build'); }

  B.displayMesh = function (ob, ctx) {
    let me = ob.data;
    if (!me) return null;
    if (ctx && ctx.G.obedit === ob && ctx.G.editMesh) return ctx.G.editMesh;
    if (hasGeomEffect(ob)) me = derived(ob, ctx, me);
    if (me.smesh && B.Subsurf) me = B.Subsurf.cached(me, me.subdiv || 1);
    if (ob.parent && ob.parent.type === 'lattice' && B.Lattice) me = B.Lattice.deformMesh(ob, me, ob.parent);
    return me;
  };

  B.Effects = {
    newEffect, particles, derived, hasGeomEffect,
    frameChanged() { }
  };
})(globalThis.B204 = globalThis.B204 || {});
