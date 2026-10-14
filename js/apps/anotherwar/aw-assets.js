(function (AW) {
  'use strict';

  const A = AW.Assets = {
    base: 'content/anotherwar/',
    bitmaps: new Map(),
    frames: new Map(),
    pending: 0,

    async json(rel) {
      const r = await fetch(A.base + rel);
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + rel);
      return r.json();
    },

    bitmap(rel) {
      let p = A.bitmaps.get(rel);
      if (p) return p;
      A.pending++;
      p = fetch(A.base + rel).then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + rel);
        return r.blob();
      }).then(b => createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }))
        .finally(() => { A.pending--; });
      A.bitmaps.set(rel, p);
      p.catch(() => A.bitmaps.delete(rel));
      return p;
    },

    drop(rel) {
      const p = A.bitmaps.get(rel);
      if (!p) return;
      A.bitmaps.delete(rel);
      p.then(b => { if (b && b.close) b.close(); }).catch(() => {});
    },

    gfxMeta(key) { return AW.Data.gfx ? AW.Data.gfx[key] || null : null; },

    anim(meta, name) {
      if (!meta) return null;
      if (name === undefined || name === null) return meta.anims[0] || null;
      if (typeof name === 'number') return meta.anims[name] || null;
      const low = String(name).toLowerCase();
      return meta.anims.find(a => a.name.toLowerCase() === low) || null;
    },

    frame(key, anim, i) {
      const m = A.gfxMeta(key);
      const an = A.anim(m, anim);
      if (!an || !an.f.length) return null;
      return an.f[Math.max(0, Math.min(an.f.length - 1, i || 0))];
    },

    frameURL(key, anim, i) {
      const id = key + '|' + (anim === undefined ? '' : anim) + '|' + (i || 0);
      const hit = A.frames.get(id);
      if (hit) return hit;
      const f = A.frame(key, anim, i);
      if (!f) return Promise.resolve('');
      const p = A.bitmap('gfx/' + key + '.webp').then(bmp => {
        const c = document.createElement('canvas');
        c.width = Math.max(1, f[2]);
        c.height = Math.max(1, f[3]);
        c.getContext('2d').drawImage(bmp, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
        return c.toDataURL('image/png');
      }).catch(() => '');
      A.frames.set(id, p);
      return p;
    },

    itemIcon(it, kind) {
      if (!it || !it.icon) return null;
      const key = it.icon;
      const m = A.gfxMeta(key);
      if (!m) return null;
      const an = A.anim(m, kind || 'inv') || m.anims[0];
      return an ? { key, anim: an.name, f: an.f[0] } : null;
    }
  };
})(globalThis.AW = globalThis.AW || {});
