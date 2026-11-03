(function (S) {
  'use strict';
  const SIZE = 2048;
  const TABLE_W = 1024;
  const ROW_TEXELS = 3;
  const ROWS_PER_LINE = Math.floor(TABLE_W / ROW_TEXELS);
  const SHELF_SLACK = 1.3;
  const NEAR = 0, HALF = 1;

  class Shelves {
    constructor(size) {
      this.size = size;
      this.layers = [];
    }

    place(w, h) {
      if (w > this.size || h > this.size) return null;
      for (let layer = 0; layer < this.layers.length; layer++) {
        const shelves = this.layers[layer];
        for (const s of shelves) {
          if (h <= s.h && s.h <= h * SHELF_SLACK + 2 && s.x + w <= this.size) {
            const spot = { x: s.x, y: s.y, layer };
            s.x += w;
            return spot;
          }
        }
        const bottom = shelves.length ? shelves[shelves.length - 1].y + shelves[shelves.length - 1].h : 0;
        if (bottom + h <= this.size) {
          shelves.push({ y: bottom, h, x: w });
          return { x: 0, y: bottom, layer };
        }
      }
      this.layers.push([{ y: 0, h, x: w }]);
      return { x: 0, y: 0, layer: this.layers.length - 1 };
    }
  }

  class Atlas {
    constructor(gpu, rows, opts) {
      this.gpu = gpu;
      this.fixed = opts.fixed || 0;
      this.free = opts.free || 0;
      this.live = opts.live || 0;
      this.layers = this.fixed + this.free + this.live;
      this.shadowLayers = Math.max(1, opts.shadow || 0);
      this.shelves = new Shelves(SIZE);
      this.liveShelves = new Shelves(SIZE);
      const before = gpu.bytes;
      this.color = gpu.textureArray(SIZE, this.layers);
      this.data = gpu.textureArray(SIZE, this.layers);
      this.shadow = gpu.textureArray(SIZE, this.shadowLayers, true);
      this.lines = Math.max(1, Math.ceil(rows / ROWS_PER_LINE));
      this.table = new Float32Array(TABLE_W * this.lines * 4);
      this.bytes = gpu.bytes - before;
      this.dirty = true;
    }

    offset(row) {
      return ((row % ROWS_PER_LINE) * ROW_TEXELS + Math.floor(row / ROWS_PER_LINE) * TABLE_W) * 4;
    }

    setRow(row, values) {
      this.table.set(values, this.offset(row));
      this.dirty = true;
    }

    clearRow(row) {
      this.table.fill(0, this.offset(row), this.offset(row) + ROW_TEXELS * 4);
      this.dirty = true;
    }

    upload(spot, w, h, color, data) {
      const gl = this.gpu.gl;
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.color);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, spot.x, spot.y, spot.layer, w, h, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.data);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, spot.x, spot.y, spot.layer, w, h, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }

    place(sprite) {
      const spot = this.shelves.place(sprite.w, sprite.h);
      if (!spot || spot.layer >= this.free) throw new Error('the sprite atlas is full');
      const at = { x: spot.x, y: spot.y, layer: spot.layer + this.fixed };
      this.upload(at, sprite.w, sprite.h, sprite.color, sprite.data);
      return [sprite.ox, sprite.oy, sprite.w, sprite.h, at.x, at.y, at.layer, 0, sprite.dMin, sprite.dMax - sprite.dMin, 0, 0];
    }

    add(row, sprite) {
      this.setRow(row, this.place(sprite));
    }

    placeLive(w, h, color, data) {
      const spot = this.liveShelves.place(w, h);
      if (!spot || spot.layer >= this.live) return null;
      const at = { x: spot.x, y: spot.y, layer: spot.layer + this.fixed + this.free };
      this.upload(at, w, h, color, data);
      return at;
    }

    clearLive() {
      this.liveShelves = new Shelves(SIZE);
    }

    addPage(layer, color, data) {
      this.upload({ x: 0, y: 0, layer }, SIZE, SIZE, color, data);
    }

    addShadowPage(layer, image) {
      const gl = this.gpu.gl;
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.shadow);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, SIZE, SIZE, 1, gl.RED, gl.UNSIGNED_BYTE, image);
    }

    flush() {
      if (!this.dirty) return;
      const gl = this.gpu.gl;
      if (!this.tableTexture) {
        this.tableTexture = this.gpu.texture2D(TABLE_W, this.lines, gl.RGBA32F, gl.RGBA, gl.FLOAT, this.table, gl.NEAREST);
        this.gpu.bytes += this.table.byteLength;
        this.bytes += this.table.byteLength;
      } else {
        gl.bindTexture(gl.TEXTURE_2D, this.tableTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TABLE_W, this.lines, gl.RGBA, gl.FLOAT, this.table);
      }
      this.dirty = false;
    }

    destroy() {
      const gl = this.gpu.gl;
      for (const t of [this.color, this.data, this.shadow, this.tableTexture]) {
        if (t) gl.deleteTexture(t);
      }
      this.gpu.bytes -= this.bytes;
    }
  }

  const bitmap = async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('no file ' + url);
    return createImageBitmap(await response.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  };

  const scaled = (r, shift, dMin, dRange, glass) => {
    const k = 2 ** shift;
    return [r[5] * k, r[6] * k, r[3] * k, r[4] * k, r[1], r[2], r[0], shift, dMin, dRange, glass, 0];
  };

  class SpriteStore {
    constructor(atlas, index) {
      this.atlas = atlas;
      this.index = index;
      this.rows = new Map();
      this.state = new Uint8Array(S.KINDS.length * 8);
      this.nearLoaded = 0;
      this.halfLoaded = 0;
      this.dead = false;
    }

    async loadPages() {
      for (let page = 0; page < this.index.pages; page++) {
        const [color, data] = await Promise.all([
          bitmap(this.index.root + 'pack-' + page + '.color.png'),
          bitmap(this.index.root + 'pack-' + page + '.data.png')
        ]);
        if (this.dead) return;
        this.atlas.addPage(page, color, data);
        color.close();
        data.close();
      }
      for (let page = 0; page < this.index.shadowPages; page++) {
        const image = await bitmap(this.index.root + 'shadow-' + page + '.png');
        if (this.dead) return;
        this.atlas.addShadowPage(page, image);
        image.close();
      }
    }

    fill() {
      for (const [name, entry] of Object.entries(this.index.kinds)) {
        const id = S.KIND_ID['m_' + name], glass = S.KINDS[id].glass ? 1 : 0, shaded = !S.KINDS[id].opening;
        for (let turn = 0; turn < 4; turn++) {
          const dMin = entry.near[turn][4], dRange = entry.near[turn][5], quarter = entry.levels[turn][0];
          this.rows.set(S.spriteRow(id, 0, turn, false), scaled(quarter, 2, dMin, dRange, glass));
          this.rows.set(S.spriteRow(id, 1, turn, false), scaled(quarter, 1, dMin, dRange, glass));
          entry.levels[turn].forEach((r, i) => this.rows.set(S.spriteRow(id, i + 2, turn, false), scaled(r, 0, dMin, dRange, glass)));
          if (!shaded) continue;
          entry.shadow[turn].forEach((r, i) => this.rows.set(S.spriteRow(id, i + 1, turn, true), scaled(r, 0, 0, 0, 0)));
          this.rows.set(S.spriteRow(id, 0, turn, true), scaled(entry.shadow[turn][0], 1, 0, 0, 0));
        }
      }
    }

    apply() {
      this.rows.forEach((values, row) => this.atlas.setRow(row, values));
    }

    want(id, turn, level) {
      const key = id * 8 + turn * 2 + level;
      if (this.state[key]) return;
      const name = S.KINDS[id].model;
      if (!name || !this.index.kinds[name]) {
        this.state[key] = 2;
        return;
      }
      this.state[key] = 1;
      const stem = this.index.root + name + '-' + turn + (level === HALF ? '.half' : '');
      Promise.all([bitmap(stem + '.color.png'), bitmap(stem + '.data.png')]).then(([color, data]) => {
        if (!this.dead) this.addLive(id, name, turn, level, color, data);
        color.close();
        data.close();
      }).catch(() => { this.state[key] = 2; });
    }

    setLiveRow(id, zoom, turn, w, h, ox, oy, at, shift, dMin, dRange, glass) {
      const k = 2 ** shift, values = [ox * k, oy * k, w * k, h * k, at.x, at.y, at.layer, shift, dMin, dRange, glass, 0], row = S.spriteRow(id, zoom, turn, false);
      this.rows.set(row, values);
      this.atlas.setRow(row, values);
    }

    addLive(id, name, turn, level, color, data) {
      const entry = this.index.kinds[name], near = entry.near[turn], rect = level === NEAR ? near : entry.half[turn], [ox, oy, w, h] = rect;
      let at = this.atlas.placeLive(w, h, color, data);
      if (!at) {
        this.atlas.clearLive();
        this.state.fill(0);
        this.nearLoaded = 0;
        this.halfLoaded = 0;
        this.fill();
        this.apply();
        this.state[id * 8 + turn * 2 + level] = 1;
        at = this.atlas.placeLive(w, h, color, data);
      }
      const dMin = near[4], dRange = near[5], glass = S.KINDS[id].glass ? 1 : 0;
      if (level === NEAR) {
        this.setLiveRow(id, 0, turn, w, h, ox, oy, at, 0, dMin, dRange, glass);
        this.nearLoaded++;
      } else {
        this.setLiveRow(id, 1, turn, w, h, ox, oy, at, 0, dMin, dRange, glass);
        if (this.state[id * 8 + turn * 2 + NEAR] !== 3) this.setLiveRow(id, 0, turn, w, h, ox, oy, at, 1, dMin, dRange, glass);
        this.halfLoaded++;
      }
      this.state[id * 8 + turn * 2 + level] = 3;
    }
  }

  S.ATLAS = { SIZE, ROWS_PER_LINE, ROW_TEXELS, NEAR, HALF };
  S.Shelves = Shelves;
  S.Atlas = Atlas;
  S.SpriteStore = SpriteStore;
})(globalThis.Sims98 = globalThis.Sims98 || {});
