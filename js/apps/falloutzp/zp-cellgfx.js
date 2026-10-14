(function (Z) {
  'use strict';

  const M = k => Z.MAT[k];

  Z.interiorEnv = (cell, time) => {
    const a = cell.amb || [0.2, 0.19, 0.17];
    return {
      hour: 12, el: 0.5, sunDir: [0.3, 0.8, 0.2], moonDir: [0, 1, 0], sunCol: [0, 0, 0],
      skyTop: [0, 0, 0], skyHor: [0.02, 0.02, 0.02], ambTop: a, ambBot: a.map(v => v * 0.55), fogCol: [0.02, 0.02, 0.02],
      fog: [0.012, 0, 0, 0], sky: [0, 0, 0, 0], waterDeep: [0, 0, 0], waterShallow: [0, 0, 0], night: 1, interior: true, time
    };
  };

  Z.buildInteriorMesh = cell => {
    const def = cell.def, rows = def.map, H = rows.length, W = cell.w;
    const mb = new Z.MeshBuilder();
    const at = (c, r) => (rows[r] && rows[r][c]) || ' ';
    const isFloor = ch => ch !== '#' && ch !== 'W' && ch !== ' ' && ch !== 'X';
    const h = def.h || 2.8;
    const mat = Object.assign({ wall: 'wallpaper', floor: 'linoleum', floor2: 'tiles', ceil: 'plasterWhite', wall2: 'tiles' }, def.mat || {});
    const tint = def.tint || {};
    const T = k => { const t = tint[k] || [128, 128, 128]; mb.setTint(t[0], t[1], t[2], 255); };
    const zoneOf = (c, r) => def.zones ? def.zones.find(z => c >= z.c0 && c <= z.c1 && r >= z.r0 && r <= z.r1) : null;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const ch = at(c, r);
      if (!isFloor(ch)) continue;
      const zn = zoneOf(c, r);
      const fl = zn && zn.floor ? zn.floor : ch === ',' ? mat.floor2 : mat.floor;
      mb.setMat(M(fl), 0, 0); T('floor');
      mb.quad([[c, 0, r], [c, 0, r + 1], [c + 1, 0, r + 1], [c + 1, 0, r]], [0, 1, 0], [[c * 0.5, r * 0.5], [c * 0.5, (r + 1) * 0.5], [(c + 1) * 0.5, (r + 1) * 0.5], [(c + 1) * 0.5, r * 0.5]]);
      if (!def.noCeil) {
        mb.setMat(M(zn && zn.ceil ? zn.ceil : mat.ceil), 0, 0); T('ceil');
        mb.quad([[c, h, r], [c + 1, h, r], [c + 1, h, r + 1], [c, h, r + 1]], [0, -1, 0], [[c * 0.5, r * 0.5], [(c + 1) * 0.5, r * 0.5], [(c + 1) * 0.5, (r + 1) * 0.5], [c * 0.5, (r + 1) * 0.5]]);
      }
      const wm = zn && zn.wall ? zn.wall : mat.wall;
      const edges = [[0, -1, [c + 1, r], [c, r]], [0, 1, [c, r + 1], [c + 1, r + 1]], [-1, 0, [c, r], [c, r + 1]], [1, 0, [c + 1, r + 1], [c + 1, r]]];
      for (const [dc, dr, a, b] of edges) {
        const nch = at(c + dc, r + dr);
        if (isFloor(nch)) continue;
        mb.setMat(M(wm), 0, 0); T('wall');
        if (nch === 'W') {
          mb.wall(a[0], a[1], b[0], b[1], 0, 0.9, 0, 0.5, 0, 0.45);
          mb.wall(a[0], a[1], b[0], b[1], 2.1, h, 0, 0.5, 1.05, h * 0.5);
          const wt = def.windowTint || [110, 120, 130];
          mb.setMat(M('glow'), 0, 0); mb.setTint(wt[0], wt[1], wt[2], 255);
          mb.wall(a[0], a[1], b[0], b[1], 0.9, 2.1, 0, 1, 0, 1);
          continue;
        }
        mb.wall(a[0], a[1], b[0], b[1], 0, h, 0, 0.5, 0, h * 0.5);
        if (def.dado) { mb.setMat(M(def.dado), 0, 0); T('dado'); const nx = (b[1] - a[1]), nz = -(b[0] - a[0]); mb.wall(a[0] + nx * 0.01, a[1] + nz * 0.01, b[0] + nx * 0.01, b[1] + nz * 0.01, 0, 1.2, 0, 0.5, 0, 0.6); }
      }
    }
    for (const p of cell.props) {
      const s0 = mb.n;
      const f = Z.Props.P[p.kind] || Z.Props.OBJ[p.kind];
      if (!f) continue;
      f(mb, p);
      mb.transformFrom(s0, Z.M4.trs(p.x, p.y || 0, p.z, -(p.yaw || 0), 0, 0));
    }
    return mb;
  };

  Z.Scene.prototype.setCell = function (cell) {
    this.cell = cell;
    if (cell.interior && !cell.gfx) {
      const mb = Z.buildInteriorMesh(cell);
      cell.gfx = this.r.meshVAO(mb.pack());
    }
  };

  Z.Scene.prototype.drawCell = function (r) {
    const cell = this.cell;
    if (!cell || cell.exterior) {
      this.drawStatic(r);
      this.drawTrees(r);
      if (this.drawSites) this.drawSites(r);
    } else if (cell.gfx) {
      const gl = r.gl, p = r.prog.world.use();
      r.setEnvUniforms(p);
      r.bindWorldTextures(p);
      gl.uniformMatrix4fv(p.u.uVP, false, r.vp);
      gl.uniformMatrix4fv(p.u.uModel, false, r.ident);
      gl.bindVertexArray(cell.gfx.vao);
      gl.drawElements(gl.TRIANGLES, cell.gfx.count, cell.gfx.type, 0);
      gl.bindVertexArray(null);
    }
    if (cell) this.drawObjects(r, cell);
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
