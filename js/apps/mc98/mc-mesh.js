(function (M) {
  'use strict';
  const B = M.BLOCKS;
  const STRIDE = 8;
  const FACES = [
    { n: [1, 0, 0], shade: 0.6, c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], name: 'side' },
    { n: [-1, 0, 0], shade: 0.6, c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], name: 'side' },
    { n: [0, 1, 0], shade: 1.0, c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], name: 'top' },
    { n: [0, -1, 0], shade: 0.5, c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], name: 'bottom' },
    { n: [0, 0, 1], shade: 0.8, c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], name: 'side' },
    { n: [0, 0, -1], shade: 0.8, c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], name: 'side' }
  ];
  const FACING = [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0]];
  const FACING_FACE = [4, 5, 0, 1];

  class MeshBuilder {
    constructor(atlas) { this.atlas = atlas; this.uvCache = {}; this.arr = new Float32Array(1 << 16); this.n = 0; }
    uv(name) { let u = this.uvCache[name]; if (!u) u = this.uvCache[name] = this.atlas.uv(name); return u; }
    reset() { this.n = 0; }
    grow(extra) { if (this.n + extra > this.arr.length) { const a = new Float32Array(Math.max(this.arr.length * 2, this.n + extra)); a.set(this.arr.subarray(0, this.n)); this.arr = a; } }
    vertex(x, y, z, u, v, sky, blk, shade) { const a = this.arr, i = this.n; a[i] = x; a[i + 1] = y; a[i + 2] = z; a[i + 3] = u; a[i + 4] = v; a[i + 5] = sky; a[i + 6] = blk; a[i + 7] = shade; this.n += STRIDE; }
    quad(p, uvs, sky, blk, shade) {
      this.grow(6 * STRIDE);
      this.vertex(p[0][0], p[0][1], p[0][2], uvs[0][0], uvs[0][1], sky, blk, shade);
      this.vertex(p[1][0], p[1][1], p[1][2], uvs[1][0], uvs[1][1], sky, blk, shade);
      this.vertex(p[2][0], p[2][1], p[2][2], uvs[2][0], uvs[2][1], sky, blk, shade);
      this.vertex(p[0][0], p[0][1], p[0][2], uvs[0][0], uvs[0][1], sky, blk, shade);
      this.vertex(p[2][0], p[2][1], p[2][2], uvs[2][0], uvs[2][1], sky, blk, shade);
      this.vertex(p[3][0], p[3][1], p[3][2], uvs[3][0], uvs[3][1], sky, blk, shade);
    }
    boxFace(fi, x0, y0, z0, x1, y1, z1, tex, sky, blk, shadeMul = 1, ox = 0, oy = 0, oz = 0) {
      const f = FACES[fi], t = this.uv(tex), tw = t[2] - t[0], th = t[3] - t[1];
      const pts = [], uvs = [];
      for (const c of f.c) {
        const px = c[0] ? x1 : x0, py = c[1] ? y1 : y0, pz = c[2] ? z1 : z0;
        pts.push([ox + px, oy + py, oz + pz]);
        let u, v;
        if (fi === 0) { u = 1 - pz; v = 1 - py; } else if (fi === 1) { u = pz; v = 1 - py; }
        else if (fi === 2) { u = px; v = 1 - pz; } else if (fi === 3) { u = px; v = pz; }
        else if (fi === 4) { u = px; v = 1 - py; } else { u = 1 - px; v = 1 - py; }
        uvs.push([t[0] + u * tw, t[1] + v * th]);
      }
      this.quad(pts, uvs, sky, blk, f.shade * shadeMul);
    }
    box(x0, y0, z0, x1, y1, z1, texes, sky, blk, ox, oy, oz, mask = 63) {
      for (let fi = 0; fi < 6; fi++) if (mask & (1 << fi)) this.boxFace(fi, x0, y0, z0, x1, y1, z1, texes[FACES[fi].name] || texes.side, sky, blk, 1, ox, oy, oz);
    }
    cross(tex, sky, blk, ox, oy, oz) {
      const t = this.uv(tex);
      const uv = [[t[0], t[3]], [t[0], t[1]], [t[2], t[1]], [t[2], t[3]]];
      this.quad([[ox, oy, oz], [ox, oy + 1, oz], [ox + 1, oy + 1, oz + 1], [ox + 1, oy, oz + 1]], uv, sky, blk, 0.85);
      this.quad([[ox + 1, oy, oz + 1], [ox + 1, oy + 1, oz + 1], [ox, oy + 1, oz], [ox, oy, oz]], uv, sky, blk, 0.85);
      this.quad([[ox, oy, oz + 1], [ox, oy + 1, oz + 1], [ox + 1, oy + 1, oz], [ox + 1, oy, oz]], uv, sky, blk, 0.85);
      this.quad([[ox + 1, oy, oz], [ox + 1, oy + 1, oz], [ox, oy + 1, oz + 1], [ox, oy, oz + 1]], uv, sky, blk, 0.85);
    }
    transformedBox(x0, y0, z0, x1, y1, z1, texes, sky, blk, mat, mirror) {
      for (let fi = 0; fi < 6; fi++) {
        const f = FACES[fi], tex = texes[f.name] || texes.side, t = this.uv(tex), tw = t[2] - t[0], th = t[3] - t[1];
        const pts = [], uvs = [];
        for (const c of f.c) {
          const px = c[0] ? x1 : x0, py = c[1] ? y1 : y0, pz = c[2] ? z1 : z0;
          pts.push([mat[0] * px + mat[4] * py + mat[8] * pz + mat[12], mat[1] * px + mat[5] * py + mat[9] * pz + mat[13], mat[2] * px + mat[6] * py + mat[10] * pz + mat[14]]);
          let u = c[0] ? 1 : 0, v = c[1] ? 0 : 1;
          if (fi < 2) u = c[2] ? 1 : 0; if (fi === 2 || fi === 3) v = c[2] ? 1 : 0;
          if (mirror && fi === 5) u = 1 - u;
          uvs.push([t[0] + u * tw, t[1] + v * th]);
        }
        this.quad(pts, uvs, sky, blk, f.shade);
      }
    }
    slice() { return this.arr.slice(0, this.n); }
  }

  function liquidHeight(meta) { const l = meta & 7; if (meta & 8) return 1; return l === 0 ? 0.875 : Math.max(0.125, 0.875 - l * 0.11); }

  function buildChunkMesh(world, chunk, opaqueB, waterB) {
    opaqueB.reset(); waterB.reset();
    const bx = chunk.cx * 16, bz = chunk.cz * 16, blocks = chunk.blocks, meta = chunk.meta;
    const get = (x, y, z) => world.getBlock(x, y, z);
    const light = (x, y, z) => { if (y >= M.CH) return [15, 0]; const c = world.chunkAt(x, z); if (!c || y < 0) return [15, 0]; const l = c.light[M.idx(x & 15, y, z & 15)]; return [l >> 4, l & 15]; };
    for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) {
      const x = bx + lx, z = bz + lz, col = (lx << 10) | (lz << 6);
      for (let y = 0; y < M.CH; y++) {
        const id = blocks[col | y];
        if (!id) continue;
        const b = B[id], mt = meta[col | y];
        if (b.model === 'cube' || b.model === 'cactus' || b.model === 'half') {
          const inset = b.model === 'cactus' ? 0.0625 : 0, top = b.model === 'half' ? 0.5 : 1;
          for (let fi = 0; fi < 6; fi++) {
            const f = FACES[fi], nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2], nid = get(nx, ny, nz), nb = B[nid];
            if (b.model === 'cube' && (nb.opaque || (nid === id && (b.cutout || !b.opaque)))) continue;
            if (b.model !== 'cube' && nb.opaque && (fi === 3 || (b.model === 'cactus' && fi === 2))) continue;
            let tex = b.faces && FACING_FACE[mt & 3] === fi ? M.faceTexture(b, 'front') : M.faceTexture(b, f.name);
            const l = nb.opaque ? light(x, y, z) : light(nx, ny, nz);
            const builder = opaqueB;
            builder.boxFace(fi, inset, 0, inset, 1 - inset, top, 1 - inset, tex, l[0], l[1], 1, x, y, z);
          }
        } else if (b.model === 'cross') {
          const l = light(x, y, z);
          opaqueB.cross(b.tex, l[0], l[1], x, y, z);
        } else if (b.model === 'torch') {
          const l = light(x, y, z), box = M.blockBox(b, mt);
          const f = mt & 7;
          opaqueB.box(box[0], box[1], box[2], box[3], box[4], box[5], { side: 'torch', top: 'torch', bottom: 'torch' }, l[0], l[1], x, y, z, f === 0 ? 55 : 63);
        } else if (b.model === 'ladder') {
          const l = light(x, y, z), f = mt & 3, fi = [5, 4, 1, 0][f], box = M.blockBox(b, mt);
          opaqueB.boxFace(fi, box[0], box[1], box[2], box[3], box[4], box[5], 'ladder', l[0], l[1], 1.2, x, y, z);
        } else if (b.model === 'fence') {
          const l = light(x, y, z), tx = { side: 'planks', top: 'planks', bottom: 'planks' };
          opaqueB.box(0.375, 0, 0.375, 0.625, 1, 0.625, tx, l[0], l[1], x, y, z);
          for (const [dx, dz, rb] of [[1, 0, [0.625, 0.4375, 1, 0.5625]], [-1, 0, [0, 0.4375, 0.375, 0.5625]], [0, 1, [0.4375, 0.625, 0.5625, 1]], [0, -1, [0.4375, 0, 0.5625, 0.375]]]) {
            const n = B[get(x + dx, y, z + dz)];
            if (n.model === 'fence' || n.opaque) { opaqueB.box(rb[0], 0.375, rb[1], rb[2], 0.5625, rb[3], tx, l[0], l[1], x, y, z); opaqueB.box(rb[0], 0.75, rb[1], rb[2], 0.9375, rb[3], tx, l[0], l[1], x, y, z); }
          }
        } else if (b.model === 'liquid') {
          const builder = id === 8 ? waterB : opaqueB, h = liquidHeight(mt), l = light(x, y, z);
          for (let fi = 0; fi < 6; fi++) {
            const f = FACES[fi], nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2], nid = get(nx, ny, nz), nb = B[nid];
            if (nid === id || (nb.opaque && fi !== 2)) continue;
            const ll = nb.opaque ? l : light(nx, ny, nz);
            builder.boxFace(fi, 0, 0, 0, 1, h, 1, b.tex, ll[0], ll[1], 1, x, y, z);
          }
        }
      }
    }
    return { opaque: opaqueB.slice(), water: waterB.slice() };
  }

  Object.assign(M, { MeshBuilder, buildChunkMesh, STRIDE, FACES, FACING, FACING_FACE, liquidHeight });
})(globalThis.Mc98 = globalThis.Mc98 || {});
