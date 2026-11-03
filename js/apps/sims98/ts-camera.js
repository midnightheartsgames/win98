(function (S) {
  'use strict';
  const K = Math.cos(S.CAMERA.elevation) / Math.SQRT2, N = Math.sin(S.CAMERA.elevation);
  const R = S.CAMERA.depthRange;

  S.TURNS = [[1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1], [0, -1, 1, 0]];
  S.DEPTH = { K, N, R };

  class Camera {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.fx = S.METRICS.town / 2;
      this.fz = S.METRICS.town / 2;
      this.zoom = 1;
      this.rot = 0;
      this.m = new Float32Array(16);
      this.update();
    }

    setSize(w, h) {
      this.w = w;
      this.h = h;
      this.update();
    }

    setView(v) {
      if (v.zoom !== undefined) this.zoom = S.clamp(v.zoom, 0, S.ZOOMS.length - 1);
      if (v.rot !== undefined) this.rot = ((v.rot % 4) + 4) % 4;
      if (v.x !== undefined) this.fx = v.x;
      if (v.z !== undefined) this.fz = v.z;
      this.keepInside();
      this.update();
    }

    keepInside() {
      const town = S.METRICS.town;
      this.fx = S.clamp(this.fx, 0, town);
      this.fz = S.clamp(this.fz, 0, town);
    }

    update() {
      const [a, b, c, d] = S.TURNS[this.rot];
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.tile = S.ZOOMS[this.zoom].tile;
      this.unitY = S.heightPx(this.zoom, 1);
      this.halfW = Math.floor(this.w / 2);
      this.halfH = Math.floor(this.h / 2);
      const rx = a * this.fx + b * this.fz, rz = c * this.fx + d * this.fz;
      this.camX = Math.floor((rx - rz) * this.tile / 2 + 0.5);
      this.camY = Math.floor((rx + rz) * this.tile / 4 + 0.5);
      this.depth0 = -K * (rx + rz);
      const T2 = this.tile / 2, T4 = this.tile / 4, sx = 2 / this.w, sy = 2 / this.h, m = this.m;
      m[0] = T2 * (a - c) * sx;
      m[1] = -T4 * (a + c) * sy;
      m[2] = -K * (a + c) / R;
      m[3] = 0;
      m[4] = 0;
      m[5] = this.unitY * sy;
      m[6] = -N / R;
      m[7] = 0;
      m[8] = T2 * (b - d) * sx;
      m[9] = -T4 * (b + d) * sy;
      m[10] = -K * (b + d) / R;
      m[11] = 0;
      m[12] = (this.halfW - this.camX) * sx - 1;
      m[13] = 1 - (this.halfH - this.camY) * sy;
      m[14] = -this.depth0 / R;
      m[15] = 1;
    }

    toScreen(x, y, z) {
      const rx = this.a * x + this.b * z, rz = this.c * x + this.d * z;
      return [(rx - rz) * this.tile / 2 - this.camX + this.halfW, (rx + rz) * this.tile / 4 - y * this.unitY - this.camY + this.halfH];
    }

    fromScreen(sx, sy, y = 0) {
      const ax = sx - this.halfW + this.camX, ay = sy - this.halfH + this.camY + y * this.unitY;
      const sum = 4 * ay / this.tile, diff = 2 * ax / this.tile;
      const rx = (sum + diff) / 2, rz = (sum - diff) / 2;
      return [this.a * rx + this.c * rz, this.b * rx + this.d * rz];
    }

    pick(terrain, sx, sy) {
      let y = 0, p = this.fromScreen(sx, sy, 0);
      for (let i = 0; i < 4; i++) {
        y = S.Terrain.heightAt(terrain, p[0], p[1]);
        p = this.fromScreen(sx, sy, y);
      }
      return p;
    }

    depthAt(x, y, z) {
      const rx = this.a * x + this.b * z, rz = this.c * x + this.d * z;
      return -K * (rx + rz) - N * y - this.depth0;
    }

    pan(dx, dy) {
      const dr = dy * 2 / this.tile + dx / this.tile, dz = dy * 2 / this.tile - dx / this.tile;
      this.fx += this.a * dr + this.c * dz;
      this.fz += this.b * dr + this.d * dz;
      this.keepInside();
      this.update();
    }

    seesBox(x0, z0, x1, z1, y0, y1) {
      let loX = Infinity, hiX = -Infinity, loY = Infinity, hiY = -Infinity;
      for (let i = 0; i < 4; i++) {
        const x = i === 1 || i === 2 ? x1 : x0, z = i >= 2 ? z1 : z0;
        const rx = this.a * x + this.b * z, rz = this.c * x + this.d * z;
        const ax = (rx - rz) * this.tile / 2, ay = (rx + rz) * this.tile / 4;
        if (ax < loX) loX = ax;
        if (ax > hiX) hiX = ax;
        if (ay < loY) loY = ay;
        if (ay > hiY) hiY = ay;
      }
      const ox = this.halfW - this.camX, oy = this.halfH - this.camY;
      return hiX + ox >= 0 && loX + ox <= this.w && hiY - y0 * this.unitY + oy >= 0 && loY - y1 * this.unitY + oy <= this.h;
    }

    visible(terrain, out) {
      const M = S.METRICS, n = M.town / M.chunk, size = M.chunk;
      const T2 = this.tile / 2, T4 = this.tile / 4, side = M.spriteSide * this.tile;
      const list = out || [];
      list.length = 0;
      for (let cz = 0; cz < n; cz++) {
        for (let cx = 0; cx < n; cx++) {
          const x0 = cx * size, z0 = cz * size;
          let loX = Infinity, hiX = -Infinity, loY = Infinity, hiY = -Infinity;
          for (let i = 0; i < 4; i++) {
            const x = x0 + (i === 1 || i === 2 ? size : 0), z = z0 + (i >= 2 ? size : 0);
            const rx = this.a * x + this.b * z, rz = this.c * x + this.d * z;
            const ax = (rx - rz) * T2, ay = (rx + rz) * T4;
            if (ax < loX) loX = ax;
            if (ax > hiX) hiX = ax;
            if (ay < loY) loY = ay;
            if (ay > hiY) hiY = ay;
          }
          const id = cx + cz * n, low = terrain.chunks[id * 2], high = terrain.chunks[id * 2 + 1];
          const top = loY - (high + M.spriteTop) * this.unitY - this.camY + this.halfH;
          const bottom = hiY - low * this.unitY - this.camY + this.halfH;
          const left = loX - this.camX + this.halfW, right = hiX - this.camX + this.halfW;
          if (right < -side || left > this.w + side || bottom < -side || top > this.h + side) continue;
          list.push(id);
        }
      }
      return list;
    }
  }

  S.Camera = Camera;
})(globalThis.Sims98 = globalThis.Sims98 || {});
