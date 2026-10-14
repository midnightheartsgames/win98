(function (L) {
  'use strict';

  const cache = new Map();

  const once = (key, fn) => {
    if (!cache.has(key)) {
      const p = fn();
      cache.set(key, p);
      p.catch(() => cache.delete(key));
    }
    return cache.get(key);
  };

  L.parseModel = (buf, key) => {
    const dv = new DataView(buf);
    const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
    if (magic !== 'LGM1') throw new Error('bad model ' + key);
    const V = dv.getUint16(4, true), T = dv.getUint16(6, true), F = dv.getUint16(8, true), slots = dv.getUint16(10, true);
    const anims = [];
    let o = 12;
    for (let i = 0; i < slots; i++) {
      anims.push({ start: dv.getUint16(o, true), count: dv.getUint16(o + 2, true), ticks: dv.getUint16(o + 4, true) });
      o += 6;
    }
    while (o % 4) o++;
    const idx = new Uint16Array(buf, o, T * 3);
    o += T * 6;
    const uv = new Int16Array(buf, o, V * 2);
    o += V * 4;
    while (o % 4) o++;
    const pos = new Int16Array(buf, o, F * V * 3);
    const nrm = new Int8Array(F * V * 3);
    const acc = new Float32Array(V * 3);
    let flip = 1;
    for (let f = 0; f < F; f++) {
      acc.fill(0);
      const base = f * V * 3;
      for (let t = 0; t < T; t++) {
        const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
        const ax = pos[base + a], ay = pos[base + a + 1], az = pos[base + a + 2];
        const e1x = pos[base + b] - ax, e1y = pos[base + b + 1] - ay, e1z = pos[base + b + 2] - az;
        const e2x = pos[base + c] - ax, e2y = pos[base + c + 1] - ay, e2z = pos[base + c + 2] - az;
        const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        acc[a] += nx; acc[a + 1] += ny; acc[a + 2] += nz;
        acc[b] += nx; acc[b + 1] += ny; acc[b + 2] += nz;
        acc[c] += nx; acc[c + 1] += ny; acc[c + 2] += nz;
      }
      if (f === 0) {
        let cx = 0, cy = 0, cz = 0;
        for (let v = 0; v < V; v++) { cx += pos[base + v * 3]; cy += pos[base + v * 3 + 1]; cz += pos[base + v * 3 + 2]; }
        cx /= V; cy /= V; cz /= V;
        let s = 0;
        for (let v = 0; v < V; v++) {
          s += acc[v * 3] * (pos[base + v * 3] - cx) + acc[v * 3 + 1] * (pos[base + v * 3 + 1] - cy) + acc[v * 3 + 2] * (pos[base + v * 3 + 2] - cz);
        }
        flip = s < 0 ? -1 : 1;
      }
      for (let v = 0; v < V; v++) {
        const x = acc[v * 3], y = acc[v * 3 + 1], z = acc[v * 3 + 2];
        const l = Math.hypot(x, y, z) || 1;
        nrm[base + v * 3] = Math.round(x / l * 127 * flip);
        nrm[base + v * 3 + 1] = Math.round(y / l * 127 * flip);
        nrm[base + v * 3 + 2] = Math.round(z / l * 127 * flip);
      }
    }
    let top = 0;
    const st = anims[0].count ? anims[0].start : 0;
    for (let v = 0; v < V; v++) top = Math.max(top, pos[(st * V + v) * 3 + 1]);
    return { key, V, T, F, anims, idx, uv, pos, nrm, top };
  };

  L.loadModel = key => once('model:' + key, async () => L.parseModel(await L.readBinary('models/' + key + '.lgm'), key));

  L.loadImage = url => once('img:' + url, () => new Promise((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('image ' + url));
    img.src = L.ASSET_ROOT + url;
  }));

  L.unitTexture = (key, color) => L.loadImage('tex/units/' + key + '-' + color + '.jpg');

  L.portrait = key => L.ASSET_ROOT + 'ui/portraits/' + key + '.png';
  L.card = key => L.ASSET_ROOT + 'ui/cards/' + key + '.png';
  L.uiImg = path => L.ASSET_ROOT + 'ui/' + path;

  L.loadMapTextures = async (key, meta) => {
    const dir = 'maps/' + key + '/';
    const jobs = {
      macro: L.loadImage(dir + 'macro.jpg'),
      detail: L.loadImage(dir + 'detail.jpg'),
      rock: L.loadImage(dir + 'rock.jpg'),
      sky: L.loadImage(dir + 'sky.jpg'),
      trees: L.loadImage(dir + 'trees.webp')
    };
    if (meta.grass) jobs.grass = L.loadImage(dir + 'grass.webp');
    if (meta.tuft) jobs.tuft = L.loadImage(dir + 'tuft.webp');
    if (meta.wheat) jobs.wheat = L.loadImage(dir + 'wheat.webp');
    const out = {};
    for (const k in jobs) out[k] = await jobs[k];
    return out;
  };

  L.clearAssetCache = () => cache.clear();
})(globalThis.Legion = globalThis.Legion || {});
