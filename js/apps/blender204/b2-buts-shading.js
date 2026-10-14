(function (B) {
  'use strict';
  const V = B.V, rgb = B.rgb;
  const COL = B.UI.COL;
  const L = B.Buts.LAYOUTS;
  const { frame, kit } = B.ButsKit;
  const D = B.Data;

  const Shading = {};

  Shading.copyMaterial = function (ctx, ma) {
    const c = JSON.parse(JSON.stringify(ma, (k, v) => (k === 'mtex' || k === 'ipo' ? undefined : v)));
    const n = ctx.main.add('MA', ma.name, c);
    n.mtex = ma.mtex.map(m => (m ? Object.assign({}, m, { mapto: Object.assign({}, m.mapto), ofs: m.ofs.slice(), size: m.size.slice(), proj: m.proj.slice() }) : null));
    n.ipo = ma.ipo || null;
    n.us = 0;
    return n;
  };

  Shading.activeMaterial = function (ctx) {
    const ob = B.Buts.activeOb(ctx);
    if (!ob || !ob.data || !ob.data.mats) return null;
    return B.View3D.obMaterial(ob, ob.actcol || 0);
  };

  Shading.setActiveMaterial = function (ctx, ma) {
    const ob = B.Buts.activeOb(ctx);
    if (!ob || !ob.data || !ob.data.mats) return;
    const i = ob.actcol || 0;
    const onOb = ob.colbits & (1 << i);
    if (onOb) { if (ob.mats[i]) ob.mats[i].us--; ob.mats[i] = D.idUser(ma); }
    else {
      if (!ob.data.mats.length) { ob.data.mats.push(null); ob.actcol = 0; }
      if (ob.data.mats[i]) ob.data.mats[i].us--;
      ob.data.mats[i] = D.idUser(ma);
    }
    ctx.redrawAll();
  };

  Shading.newMaterialFor = function (ctx) {
    const cur = Shading.activeMaterial(ctx);
    const ma = cur ? Shading.copyMaterial(ctx, cur) : D.newMaterial(ctx.main, 'Material');
    Shading.setActiveMaterial(ctx, ma);
  };

  Shading.newMatIndex = function (ctx, ob) {
    const me = ob.data;
    const cur = B.View3D.obMaterial(ob, ob.actcol || 0);
    me.mats.push(cur ? D.idUser(cur) : null);
    ob.actcol = me.mats.length - 1;
    ctx.redrawAll();
  };

  Shading.delMatIndex = function (ctx, ob) {
    const me = ob.data;
    if (!me.mats.length) return;
    const i = ob.actcol || 0;
    if (me.mats[i]) me.mats[i].us--;
    me.mats.splice(i, 1);
    const faces = ctx.G.obedit === ob && ctx.G.editMesh ? ctx.G.editMesh.faces : me.faces;
    faces.forEach(f => { if ((f.mat || 0) > i) f.mat--; else if (f.mat === i) f.mat = 0; });
    ob.actcol = Math.max(0, Math.min(i, me.mats.length - 1));
    ctx.redrawAll();
  };

  function editFaces(ctx, ob) {
    if (ctx.G.obedit !== ob || !ctx.G.editMesh) return null;
    const em = ctx.G.editMesh;
    return em.faces.filter(f => f.v.every(i => em.verts[i].sel && !em.verts[i].hide));
  }

  Shading.assignMatIndex = function (ctx, ob) {
    const fs = editFaces(ctx, ob);
    if (!fs) return;
    fs.forEach(f => { f.mat = ob.actcol || 0; });
    ctx.redrawAll();
  };

  Shading.selectMatIndex = function (ctx, ob, on) {
    if (ctx.G.obedit !== ob) return;
    const em = ctx.G.editMesh;
    em.faces.forEach(f => { if ((f.mat || 0) === (ob.actcol || 0)) f.v.forEach(i => { if (!em.verts[i].hide) em.verts[i].sel = on; }); });
    ctx.redrawAll();
  };

  Shading.matIndexFromSel = function (ctx, ob) {
    const fs = editFaces(ctx, ob);
    if (!fs || !fs.length) return;
    ob.actcol = fs[0].mat || 0;
    ctx.redrawAll();
  };

  Shading.setSmooth = function (ctx, ob, on) {
    const fs = editFaces(ctx, ob);
    if (!fs) return;
    fs.forEach(f => { f.smooth = on; });
    ctx.redrawAll();
  };

  Shading.toggleSticky = function (ctx, ob) {
    const me = ob.data;
    if (me.sticky) { me.sticky = null; ctx.redrawAll(); return; }
    const area = B.Edit.viewArea(ctx);
    if (!area) return;
    const sv = B.View3D.setMatrices(ctx, area);
    B.Data.whereIs(ob);
    me.sticky = me.verts.map(v => {
      const s = B.View3D.project(sv, B.M.loc(ob.obmat, v.co));
      return s ? [(s[0] - sv.win.x1) / sv.winx * 2 - 1, (s[1] - sv.win.y1) / sv.winy * 2 - 1] : [0, 0];
    });
    ctx.redrawAll();
  };

  Shading.toggleVertCol = function (ctx, ob) {
    const me = ob.data;
    if (me.vcols) me.vcols = null;
    else {
      const ma = B.View3D.obMaterial(ob, 0);
      const c = ma ? [ma.r, ma.g, ma.b] : [1, 1, 1];
      me.vcols = me.verts.map(() => c.slice());
    }
    ctx.redrawAll();
  };

  Shading.toggleTexFace = function (ctx, ob) {
    const me = ob.data;
    if (me.tfaces) { me.tfaces = null; me.faces.forEach(f => { delete f.uv; delete f.tf; }); }
    else {
      me.tfaces = true;
      me.faces.forEach(f => {
        if (f.v.length === 4) f.uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
        else if (f.v.length === 3) f.uv = [[0, 0], [1, 0], [1, 1]];
        f.tf = { mode: { tex: true, tiles: false, light: false, invisible: false, collision: true, shared: false, twoside: false, obcolor: false, halo: false, shadow: false, text: false }, transp: 'opaque', image: null };
      });
    }
    ctx.redrawAll();
  };

  Shading.imageAspect = function (ctx) {
    B.ObjectOps.selectedBases(ctx).forEach(b => {
      const ma = B.View3D.obMaterial(b.object, 0);
      const mt = ma && ma.mtex.find(t => t && t.tex && t.tex.type === 'image' && t.tex.image && t.tex.image.pix);
      if (!mt) return;
      const im = mt.tex.image.pix;
      const asp = im.w / im.h;
      if (asp > 1) b.object.size[1] = b.object.size[0] / asp; else b.object.size[0] = b.object.size[1] * asp;
      B.Data.whereIs(b.object);
    });
    ctx.redrawAll();
  };

  function previewCache(key) {
    Shading._pc = Shading._pc || new Map();
    return Shading._pc.get(key);
  }

  function previewSig(obj) {
    try { return JSON.stringify(obj, (k, v) => (k === 'pix' || k === 'image' ? (v && v.name) : v)); } catch (e) { return String(Math.random()); }
  }

  Shading.renderPreview = function (kind, data, size, shape) {
    const sig = kind + size + shape + previewSig(data);
    const old = previewCache(kind + size);
    if (old && old.sig === sig) return old.img;
    const img = { w: size, h: size, buf: new Uint32Array(size * size), flipY: false };
    const lampDir = V.norm([0.1, 0.55, 0.85]);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x + 0.5) / size * 2 - 1, v = (y + 0.5) / size * 2 - 1;
        let col;
        const checker = ((Math.floor((x / size) * 8) + Math.floor((y / size) * 8)) & 1) ? 0.35 : 0.25;
        if (kind === 'tex') {
          const c = B.Tex.previewPixel(data, u, v);
          col = c;
        } else if (kind === 'world') {
          const t = (v + 1) / 2;
          const w = data;
          const hor = [w.horr, w.horg, w.horb], zen = [w.zenr, w.zeng, w.zenb];
          col = w.skytype.blend ? hor.map((h, i) => h * (1 - t) + zen[i] * t) : hor;
          if (w.stars.on && B.Tex.hash3(x, y, 1) > 0.985) col = [1, 1, 1];
        } else if (kind === 'lamp') {
          const la = data;
          const d = Math.hypot(u, v);
          let i = Math.max(0, 1 - d * 1.1);
          if (la.type === 'spot') i *= d < Math.sin(la.spotsize * B.DEG / 2) ? 1 : 0.2;
          col = [checker * 0.5 + la.r * i * la.energy, checker * 0.5 + la.g * i * la.energy, checker * 0.5 + la.b * i * la.energy];
        } else {
          const ma = data;
          let hit = null;
          if (shape === 'plane') { if (Math.abs(u) < 0.9 && Math.abs(v) < 0.9) hit = { p: [u, v, 0], n: [0, 0, 1], orco: [u / 0.9, v / 0.9, 0] }; }
          else if (shape === 'cube') {
            const s = 0.55;
            const pu = u * 1.1, pv = v * 1.1;
            if (Math.abs(pu - pv * 0.3) < s && Math.abs(pv) < s) hit = { p: [pu, pv, s], n: V.norm([0, -0.2, 1]), orco: [pu / s, pv / s, 1] };
          } else {
            const r2 = u * u + v * v;
            const RR = 2.1;
            if (r2 < RR) { const z = Math.sqrt(RR - r2); const n = V.norm([u, v, z]); hit = { p: [u, v, z], n, orco: [u / 1.45, v / 1.45, z / 1.45] }; }
          }
          if (!hit) { col = ma.mode.halo ? [0, 0, 0] : [checker, checker, checker]; }
          else {
            const sp = { ma, ob: { lay: 1 }, co: [hit.p[0], hit.p[1], hit.p[2] - 3], nor: hit.n, view: V.norm([hit.p[0], hit.p[1], -3]), orco: hit.orco, glob: hit.orco, win: [(u + 1) / 2, (v + 1) / 2], refl: hit.n, uv: [(u + 1) / 2, (v + 1) / 2] };
            const lamps = [
              { la: { type: 'sun', energy: 1, mode: {}, r: 1, g: 1, b: 1 }, dir: V.neg(lampDir), col: [1, 1, 1], lay: 1 },
              { la: { type: 'sun', energy: 0.3, mode: {}, r: 1, g: 1, b: 1 }, dir: V.norm([0.6, 0.3, -0.4]), col: [1, 1, 1], lay: 1 }
            ];
            const c = B.Render.shade(null, null, { ambr: 0.2, ambg: 0.2, ambb: 0.2 }, sp, lamps);
            const a = Math.max(0, Math.min(1, c[3]));
            col = [c[0] * a + checker * (1 - a), c[1] * a + checker * (1 - a), c[2] * a + checker * (1 - a)];
            if (ma.mode.halo) { const d = Math.hypot(u, v) / 0.9; const hi = Math.pow(Math.max(0, 1 - d), (ma.halo.hard || 50) / 16 + 0.5) * ma.alpha; col = [ma.r * hi, ma.g * hi, ma.b * hi]; }
          }
        }
        img.buf[(size - 1 - y) * size + x] = B.rgbf(col[0], col[1], col[2]);
      }
    }
    Shading._pc.set(kind + size, { sig, img });
    return img;
  };

  function drawPreview(blk, box, kind, data, shape) {
    const r = blk.r;
    const x1 = blk.px(box[0]), y1 = blk.py(box[1]), x2 = blk.px(box[0] + box[2]) - 1, y2 = blk.py(box[1] + box[3]) - 1;
    const size = Math.max(8, Math.min(x2 - x1 - 1, y2 - y1 - 1));
    r.frame(x1, y1, x2, y2, rgb(0, 0, 0));
    r.hline(x1 + 1, x2, y1 + 1, rgb(255, 255, 255));
    r.vline(x2 - 1, y1 + 1, y2 - 1, rgb(255, 255, 255));
    if (!data) { r.rect(x1 + 1, y1 + 2, x2 - 1, y2, rgb(110, 110, 110)); return; }
    const img = Shading.renderPreview(kind, data, size, shape);
    r.pushClip(x1 + 1, y1 + 2, x2 - 2, y2 - 1);
    r.blit(img, x1 + 1, y1 + 2, 1);
    r.popClip();
  }

  function texChannelButtons(ctx, k, R, owner, n, x0, yt, x1, yb) {
    const w = (x1 - x0 - 2) / n;
    for (let i = 0; i < n; i++) {
      const mt = owner.mtex[i];
      const a = Math.round(x0 + i * w), b = Math.round(x0 + (i + 1) * w) - 2;
      const bt = k.row(R(a, yt, b, yb), mt && mt.tex ? mt.tex.name : '', owner, 'texact', i, 'Texture channel');
      bt.left = true;
    }
  }

  function mtexPanel(ctx, k, R, owner, ownerKind) {
    const mt = owner.mtex[owner.texact || 0];
    if (!mt) {
      k.but(R(640, 645, 720, 653), 'ADD NEW TEX', () => { owner.mtex[owner.texact || 0] = D.newMTex(D.idUser(D.newTexture(ctx.main, 'Tex'))); ctx.redrawAll(); }, 'Add a new texture', COL.SALMON);
      B.Buts.idBrowseInline && void 0;
      const list = ctx.main.textures;
      if (list.length) k.menu(R(640, 656, 720, 664), 'TEXTURES %t|' + list.map((t, i) => `${t.name} %x${i}`).join('|'), () => -1, v => { if (v >= 0) { owner.mtex[owner.texact || 0] = D.newMTex(D.idUser(list[v])); ctx.redrawAll(); } }, 'Browse textures');
      return null;
    }
    return mt;
  }

  L.material = {
    w: 640, h: 113, X0: 190, Y0: 622,
    header(ctx, area, blk, x) {
      const ob = B.Buts.activeOb(ctx);
      if (!ob || !ob.data || !ob.data.mats) return x;
      return B.Buts.idBrowse(ctx, blk, x, 'MA', {
        get: () => Shading.activeMaterial(ctx),
        set: m => Shading.setActiveMaterial(ctx, m),
        addNew: () => Shading.newMaterialFor(ctx),
        unlink: () => { const i = ob.actcol || 0; const onOb = ob.colbits & (1 << i); if (onOb) { ob.mats[i] = null; } else if (ob.data.mats[i]) { ob.data.mats[i].us--; ob.data.mats[i] = null; } },
        singleUser: () => { const m = Shading.activeMaterial(ctx); if (m && m.us > 1) Shading.setActiveMaterial(ctx, Shading.copyMaterial(ctx, m)); }
      });
    },
    build(ctx, blk) {
      const R = frame(190, 622, 113);
      const k = kit(ctx, blk, R);
      const ob = B.Buts.activeOb(ctx);
      if (!ob || !ob.data || !ob.data.mats) return;
      const ma = Shading.activeMaterial(ctx);
      ctx.G.previewShape = ctx.G.previewShape || 'sphere';
      [['plane', [3, 9]], ['sphere', [4, 9]], ['cube', [5, 9]]].forEach(([s, ic], i) => {
        blk.add('ROW', { icon: ic, ...box(R(195 + i * 9, 630, 203 + i * 9, 638)), get: () => ctx.G.previewShape, set: v => { ctx.G.previewShape = v; }, rowValue: s, tip: 'Preview type' });
      });
      const pv = R(195, 641, 285, 730);
      blk.postDraw = () => drawPreview(blk, pv, 'mat', ma, ctx.G.previewShape);
      const totcol = ob.data.mats.length;
      const i = ob.actcol || 0;
      k.tex(R(290, 630, 358, 638), (({ mesh: 'ME', curve: 'CU', surf: 'CU', font: 'CU', mball: 'MB' })[ob.type] || 'ME') + ':', () => ob.data.name, v => ctx.main.rename(ob.data, v), 'Object data name');
      blk.row('OB', ...R(361, 630, 378, 638), () => !!(ob.colbits & (1 << i)), v => { if (v) ob.colbits |= (1 << i); else ob.colbits &= ~(1 << i); if (v && !ob.mats[i]) ob.mats[i] = ob.data.mats[i] ? D.idUser(ob.data.mats[i]) : null; }, true, 'Link material to object').col = COL.SALMON;
      blk.row('ME', ...R(380, 630, 395, 638), () => !!(ob.colbits & (1 << i)), v => { if (v) ob.colbits |= (1 << i); else ob.colbits &= ~(1 << i); }, false, 'Link material to object data').col = COL.GREEN;
      blk.num(totcol + ' Mat ', ...R(398, 630, 467, 638), () => (totcol ? i + 1 : 0), v => { ob.actcol = Math.max(0, v - 1); ctx.redrawAll(); }, totcol ? 1 : 0, totcol, 1, 0, 'Active material index');
      if (!ma) {
        k.but(R(290, 650, 400, 662), 'ADD NEW', () => Shading.newMaterialFor(ctx), 'Add a new Material', COL.SALMON);
        return;
      }
      ma.rgbsel = ma.rgbsel || 0;
      k.row(R(290, 641, 311, 649), 'RGB', ma, 'colormodel', 'RGB', 'RGB');
      k.row(R(290, 653, 311, 661), 'HSV', ma, 'colormodel', 'HSV', 'HSV');
      k.row(R(290, 665, 311, 673), 'DYN', ma, 'colormodel', 'DYN', 'Dynamic (game engine) settings');
      blk.col3(...R(313, 641, 330, 665), () => [ma.mirr, ma.mirg, ma.mirb]);
      blk.col3(...R(333, 641, 350, 665), () => [ma.specr, ma.specg, ma.specb]);
      blk.col3(...R(353, 641, 375, 665), () => [ma.r, ma.g, ma.b]);
      k.row(R(313, 666, 330, 673), 'Mir', ma, 'rgbsel', 2, 'Mirror colour');
      k.row(R(333, 666, 350, 673), 'Spec', ma, 'rgbsel', 1, 'Specular colour');
      k.row(R(353, 666, 375, 673), 'Color', ma, 'rgbsel', 0, 'Diffuse colour', COL.GREEN);
      k.num(R(290, 677, 375, 685), 'Zoffset: ', ma, 'zoffs', 0, 10, 0.1, 3, 'Gives faces an artificial offset in the Z buffer');
      k.sli(R(290, 690, 375, 697), 'Spec ', ma, 'spec', 0, 2, 3, 'Specularity');
      k.sli(R(290, 700, 375, 707), 'Hard ', ma, 'hard', 1, 255, 0, 'Hardness of the specularity');
      k.sli(R(290, 710, 375, 717), 'SpTr ', ma, 'spectra', 0, 1, 3, 'Makes specular areas opaque');
      k.sli(R(290, 720, 375, 728), 'Add ', ma, 'add', 0, 1, 3, 'Glow factor');
      if (ma.colormodel === 'DYN') {
        k.sli(R(380, 643, 467, 650), 'Reflect ', ma, 'reflect', 0, 1, 3, 'The factor a wall or floor reflects a collision');
        k.sli(R(380, 653, 467, 661), 'Fh Frict ', ma, 'fhfrict', 0, 1, 3, 'Inside the Fh dist, floor friction');
        k.sli(R(380, 664, 467, 671), 'Fh Force ', ma, 'fhforce', 0, 1, 3, 'The factor a Dynamic Object is pushed away from the floor');
      } else {
        const keys = [['r', 'g', 'b'], ['specr', 'specg', 'specb'], ['mirr', 'mirg', 'mirb']][ma.rgbsel];
        if (ma.colormodel === 'HSV') {
          const hsv = rgb2hsv(ma[keys[0]], ma[keys[1]], ma[keys[2]]);
          const set = (idx, v) => { hsv[idx] = v; const c = hsv2rgb(hsv[0], hsv[1], hsv[2]); ma[keys[0]] = c[0]; ma[keys[1]] = c[1]; ma[keys[2]] = c[2]; };
          blk.sli('H ', ...R(380, 643, 467, 650), () => hsv[0], v => set(0, v), 0, 1, 3);
          blk.sli('S ', ...R(380, 653, 467, 661), () => hsv[1], v => set(1, v), 0, 1, 3);
          blk.sli('V ', ...R(380, 664, 467, 671), () => hsv[2], v => set(2, v), 0, 1, 3);
        } else {
          k.sli(R(380, 643, 467, 650), 'R ', ma, keys[0], 0, 1, 3, 'Red');
          k.sli(R(380, 653, 467, 661), 'G ', ma, keys[1], 0, 1, 3, 'Green');
          k.sli(R(380, 664, 467, 671), 'B ', ma, keys[2], 0, 1, 3, 'Blue');
        }
      }
      k.tog(R(389, 680, 426, 687), 'TexFace', ma.mode, 'texface', 'UV-Editor assigned texture gives color and texture info for the faces');
      k.tog(R(429, 680, 467, 687), 'No Mist', ma.mode, 'nomist', 'Sets the material to ignore mist values');
      k.sli(R(380, 690, 467, 697), 'Ref ', ma, 'ref', 0, 1, 3, 'Sets the amount of reflection');
      k.sli(R(380, 700, 467, 707), 'Alpha ', ma, 'alpha', 0, 1, 3, 'Alpha');
      k.sli(R(380, 710, 467, 717), 'Emit ', ma, 'emit', 0, 1, 3, 'Sets the amount of emitting light');
      k.sli(R(380, 720, 467, 728), 'Amb ', ma, 'amb', 0, 1, 3, 'Sets the amount global ambient color');
      const T = (yt, s, key, tip) => k.tog(R(476, yt, 512, yt + 7), s, ma.mode, key, tip);
      T(628, 'Traceable', 'traceable', 'Makes material cast shadows in spotlights');
      T(637, 'Shadow', 'shadow', 'Makes material receive shadows from spotlights');
      T(647, 'Shadeless', 'shadeless', 'Makes material insensitive to light or shadow');
      T(656, 'Wire', 'wire', 'Renders only the edges of faces as a wireframe');
      T(666, 'VCol Light', 'vcolLight', 'Adds vertex colours as extra light');
      T(675, 'VCol Paint', 'vcolPaint', 'Replaces material\'s colours with vertex colours');
      T(685, 'Halo', 'halo', 'Renders material as a halo');
      T(694, 'ZTransp', 'ztransp', 'Enables Z-Buffering of transparent faces');
      T(704, 'ZInvert', 'zinvert', 'Renders material\'s faces with inverted Z Buffer');
      T(713, 'Env', 'env', 'Do not render material');
      T(723, 'OnlyShadow', 'onlyshadow', 'Renders shadows falling on material only');
      if (ma.mode.halo) {
        const hs = ma.halo;
        k.sli(R(380, 690, 467, 697), 'HaloSize ', hs, 'size', 0, 100, 3, 'Sets the dimension of the halo');
        k.sli(R(380, 700, 467, 707), 'Alpha ', ma, 'alpha', 0, 1, 3, 'Alpha');
        k.sli(R(380, 710, 467, 717), 'Hard ', hs, 'hard', 1, 127, 0, 'Sets the hardness of the halo');
        k.sli(R(380, 720, 467, 728), 'Add ', hs, 'add', 0, 1, 3, 'Sets the strength of the add effect');
        k.num(R(290, 690, 330, 697), 'Rings: ', hs, 'rings', 1, 24, 1, 0, 'Sets the number of rings rendered over the basic halo');
        k.num(R(290, 700, 330, 707), 'Lines: ', hs, 'lines', 1, 250, 1, 0, 'Sets the number of star shaped lines rendered over the halo');
        k.num(R(290, 710, 330, 717), 'Star: ', hs, 'star', 3, 50, 1, 0, 'Sets the number of points on the star shaped halo');
        k.num(R(290, 720, 330, 728), 'Seed: ', hs, 'seed', 0, 255, 1, 0, 'Randomizes ring dimension and line location');
        const HT = (x1, x2, yt, s, key) => k.tog(R(x1, yt, x2, yt + 7), s, hs.flags, key, s);
        HT(332, 352, 690, 'Flare', 'flare'); HT(354, 375, 690, 'Rings', 'rings'); HT(332, 352, 700, 'Lines', 'lines'); HT(354, 375, 700, 'Star', 'star');
        HT(332, 352, 710, 'HaloTex', 'halotex'); HT(354, 375, 710, 'HaloPuno', 'halopuno'); HT(332, 352, 720, 'X Alpha', 'xalpha'); HT(354, 375, 720, 'Shaded', 'shaded');
      }
      texChannelButtons(ctx, k, R, ma, 8, 523, 629, 785, 638);
      k.tog(R(802, 629, 822, 638), 'SepT', ma, 'septex', 'Use active texture channel only');
      const mt = mtexPanel(ctx, k, R, ma, 'mat');
      if (!mt) return;
      const TC = (x1, x2, yt, s, v) => k.row(R(x1, yt, x2, yt + 8), s, mt, 'texco', v, 'Texture coordinates: ' + s);
      TC(522, 534, 645, 'UV', 'uv'); TC(536, 561, 645, 'Object', 'object');
      k.tex(R(563, 645, 628, 653), '', () => (mt.object ? mt.object.name : ''), v => { mt.object = ctx.main.objects.find(o => o.name === v) || null; }, 'Object name to use for texture coordinates');
      TC(522, 534, 654, 'Glob', 'glob'); TC(536, 557, 654, 'Orco', 'orco'); TC(560, 581, 654, 'Stick', 'stick'); TC(584, 596, 654, 'Win', 'win'); TC(597, 612, 654, 'Nor', 'nor'); TC(614, 628, 654, 'Refl', 'refl');
      const MP = (x1, x2, yt, s, v) => k.row(R(x1, yt, x2, yt + 8), s, mt, 'mapping', v, 'Mapping: ' + s);
      MP(522, 547, 671, 'Flat', 'flat'); MP(549, 569, 671, 'Cube', 'cube'); MP(522, 547, 681, 'Tube', 'tube'); MP(549, 569, 681, 'Sphe', 'sphe');
      ['X', 'Y', 'Z'].forEach((a, ai) => {
        const yt = 701 + ai * 10.5;
        const row = (x1, x2, s, v) => blk.row(s, ...R(x1, Math.round(yt), x2, Math.round(yt) + 8), () => mt.proj[ai], vv => { mt.proj[ai] = vv; }, v, 'Projection ' + a);
        row(522, 532, '', 0); row(535, 545, 'X', 1); row(548, 558, 'Y', 2); row(560, 570, 'Z', 3);
        blk.num('ofs' + a + ' ', ...R(579, 671 + ai * 10, 628, 679 + ai * 10), () => mt.ofs[ai], v => { mt.ofs[ai] = v; }, -10, 10, 0.1, 3, 'Offset');
        blk.num('size' + a + ' ', ...R(579, Math.round(yt), 628, Math.round(yt) + 8), () => mt.size[ai], v => { mt.size[ai] = v; }, -100, 100, 0.1, 2, 'Size');
      });
      const tex = mt.tex;
      k.but(R(640, 654, 647, 662), '', () => {
        const list = ctx.main.textures;
        B.UI.pupmenu(ctx, list.map((t, j) => `${t.name} %x${j}`).join('|') + '|ADD NEW %x32767').then(v => {
          if (v === 32767) { mt.tex = D.idUser(D.newTexture(ctx.main, 'Tex')); }
          else if (v >= 0) { if (mt.tex) mt.tex.us--; mt.tex = D.idUser(list[v]); }
          ctx.redrawAll();
        });
      }, 'Browse texture').minusIcon = true;
      k.tex(R(640, 645, 720, 653), 'TE:', () => (tex ? tex.name : ''), v => { if (tex) ctx.main.rename(tex, v); }, 'Texture name');
      k.but(R(651, 654, 688, 662), 'Clear', () => { if (mt.tex) mt.tex.us--; ma.mtex[ma.texact || 0] = null; ctx.redrawAll(); }, 'Erases link to texture', COL.SALMON);
      k.tog(R(640, 671, 661, 679), 'Stencil', mt, 'stencil', 'Sets the texture mapping to stencil mode');
      k.tog(R(663, 671, 686, 679), 'Neg', mt, 'neg', 'Inverts the values of the texture to reverse its effect');
      k.tog(R(688, 671, 720, 679), 'No RGB', mt, 'noRGB', 'Converts texture RGB values to intensity (gray) values');
      blk.col3(...R(640, 682, 720, 687), () => [mt.r, mt.g, mt.b]);
      k.sli(R(640, 690, 720, 697), 'R ', mt, 'r', 0, 1, 3, 'Red');
      k.sli(R(640, 700, 720, 707), 'G ', mt, 'g', 0, 1, 3, 'Green');
      k.sli(R(640, 710, 720, 717), 'B ', mt, 'b', 0, 1, 3, 'Blue');
      k.sli(R(640, 723, 720, 730), 'DVar ', mt, 'def_var', 0, 1, 3, 'Value to use for Ref, Spec, Amb, Emit and Alpha');
      const MT = (x1, x2, yt, s, key) => k.tog(R(x1, yt, x2, yt + 8), s, mt.mapto, key, 'Map to ' + s);
      MT(734, 750, 645, 'Col', 'col'); MT(752, 767, 645, 'Nor', 'nor'); MT(770, 785, 645, 'Csp', 'csp'); MT(787, 800, 645, 'Cmir', 'cmir'); MT(803, 822, 645, 'Ref', 'ref');
      MT(734, 750, 654, 'Spec', 'spec'); MT(752, 767, 654, 'Hard', 'hard'); MT(770, 785, 654, 'Alpha', 'alpha'); MT(787, 822, 654, 'Emit', 'emit');
      const BT = (x1, x2, s, v) => k.row(R(x1, 681, x2, 689), s, mt, 'blendtype', v, s);
      BT(734, 757, 'Mix', 'mix'); BT(759, 779, 'Mul', 'mul'); BT(781, 800, 'Add', 'add'); BT(802, 822, 'Sub', 'sub');
      k.sli(R(734, 703, 822, 710), 'Col ', mt, 'colfac', 0, 1, 3, 'Sets the amount the texture affects color values');
      k.sli(R(734, 713, 822, 720), 'Nor ', mt, 'norfac', 0, 5, 3, 'Sets the amount the texture affects normal values');
      k.sli(R(734, 723, 822, 730), 'Var ', mt, 'varfac', 0, 1, 3, 'Sets the amount the texture affects other values');
    }
  };

  function box(b) { return { x: b[0], y: b[1], w: b[2], h: b[3] }; }

  function rgb2hsv(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; if (h < 0) h += 1; }
    return [h, mx ? d / mx : 0, mx];
  }

  function hsv2rgb(h, s, v) {
    const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][((i % 6) + 6) % 6];
  }

  L.lamp = {
    w: 640, h: 113, X0: 190, Y0: 622,
    header(ctx, area, blk, x) {
      const ob = B.Buts.activeOb(ctx);
      if (!ob || ob.type !== 'lamp') return x;
      return B.Buts.idBrowse(ctx, blk, x, 'LA', {
        get: () => ob.data, set: d => { ob.data.us--; ob.data = D.idUser(d); },
        singleUser: () => { if (ob.data.us > 1) { ob.data.us--; ob.data = D.idUser(B.ObjectOps.copyData(ctx, ob)); } }
      });
    },
    build(ctx, blk) {
      const R = frame(190, 622, 113);
      const k = kit(ctx, blk, R);
      const ob = B.Buts.activeOb(ctx);
      if (!ob || ob.type !== 'lamp') return;
      const la = ob.data;
      const pv = R(195, 641, 285, 730);
      blk.postDraw = () => drawPreview(blk, pv, 'lamp', la);
      const TY = (x1, x2, s, v) => k.row(R(x1, 630, x2, 638), s, la, 'type', v, s);
      TY(290, 315, 'Lamp', 'lamp'); TY(317, 342, 'Spot', 'spot'); TY(344, 369, 'Sun', 'sun'); TY(371, 396, 'Hemi', 'hemi');
      k.num(R(290, 643, 396, 651), 'Dist: ', la, 'dist', 0.01, 5000, 1, 2, 'Sets the distance value');
      const T = (x1, x2, yt, s, key, tip) => k.tog(R(x1, yt, x2, yt + 8), s, la.mode, key, tip);
      T(290, 340, 656, 'Quad', 'quad', 'Uses inverse quadratic proportion for light attenuation');
      T(342, 396, 656, 'Sphere', 'sphere', 'Lamp only shines inside a sphere');
      T(290, 340, 667, 'Shadows', 'shadow', 'Lets lamp produce shadows');
      T(342, 396, 667, 'Halo', 'halo', 'Renders spotlight with a volumetric halo');
      T(290, 340, 678, 'Layer', 'layer', 'Illuminates objects in the same layer as the lamp only');
      T(342, 396, 678, 'Negative', 'negative', 'Sets lamp to cast negative light');
      T(290, 340, 689, 'OnlyShadow', 'onlyshadow', 'Causes spotlight to cast shadows only without illuminating objects');
      T(342, 396, 689, 'Square', 'square', 'Sets square spotbundles');
      k.sli(R(410, 630, 520, 638), 'R ', la, 'r', 0, 1, 3, 'Red');
      k.sli(R(410, 641, 520, 649), 'G ', la, 'g', 0, 1, 3, 'Green');
      k.sli(R(410, 652, 520, 660), 'B ', la, 'b', 0, 1, 3, 'Blue');
      blk.col3(...R(410, 663, 520, 670), () => [la.r, la.g, la.b]);
      k.sli(R(410, 676, 520, 684), 'Energy ', la, 'energy', 0, 10, 3, 'Sets the intensity of the light');
      k.sli(R(410, 687, 520, 695), 'SpotSi ', la, 'spotsize', 1, 180, 2, 'Sets the angle of the spotlight beam in degrees');
      k.sli(R(410, 698, 520, 706), 'SpotBl ', la, 'spotblend', 0, 1, 3, 'Sets the softness of the spotlight edge');
      k.sli(R(410, 709, 520, 717), 'Quad1 ', la, 'quad1', 0, 1, 3, 'Sets the light intensity value 1 for a quad lamp');
      k.sli(R(410, 720, 520, 728), 'Quad2 ', la, 'quad2', 0, 1, 3, 'Sets the light intensity value 2 for a quad lamp');
      k.sli(R(290, 709, 396, 717), 'HaloInt ', la, 'haint', 0, 5, 3, 'Sets the intensity of the spotlight halo');
      [512, 768, 1024, 1536, 2560].forEach((v, i) => k.row(R(530 + i * 22, 630, 551 + i * 22, 638), i ? String(v) : 'BufSi ' + v, la, 'bufsize', v, 'Sets the size of the shadow buffer'));
      k.num(R(530, 643, 638, 651), 'ClipSta: ', la, 'clipsta', 0.1, 1000, 0.1, 2, 'Sets the shadow map clip start');
      k.num(R(530, 654, 638, 662), 'ClipEnd: ', la, 'clipend', 1, 5000, 1, 1, 'Sets the shadow map clip end');
      k.num(R(530, 665, 638, 673), 'Samples: ', la, 'samp', 1, 16, 1, 0, 'Sets the number of shadow map samples');
      k.num(R(530, 676, 638, 684), 'Halo step: ', la, 'haloStep', 0, 12, 1, 0, 'Sets the volumetric halo sampling frequency');
      k.num(R(530, 687, 638, 695), 'Bias: ', la, 'bias', 0.01, 5, 0.1, 3, 'Sets the shadow map sampling bias');
      k.num(R(530, 698, 638, 706), 'Soft: ', la, 'soft', 1, 100, 0.5, 2, 'Sets the size of the shadow sample area');
      texChannelButtons(ctx, k, R, la, 6, 650, 630, 830, 638);
    }
  };

  L.world = {
    w: 640, h: 113, X0: 190, Y0: 622,
    header(ctx, area, blk, x) {
      const sce = ctx.scene;
      return B.Buts.idBrowse(ctx, blk, x, 'WO', {
        get: () => sce.world, set: w => { if (sce.world) sce.world.us--; sce.world = D.idUser(w); },
        addNew: () => { const w = sce.world ? Object.assign(D.newWorld(ctx.main, sce.world.name), JSON.parse(JSON.stringify(sce.world, (kk, v) => (kk === 'code' || kk === 'name' || kk === 'uid' || kk === 'us' || kk === 'ipo' || kk === 'mtex' ? undefined : v)))) : D.newWorld(ctx.main, 'World'); if (sce.world) sce.world.us--; sce.world = D.idUser(w); },
        unlink: () => { if (sce.world) sce.world.us--; sce.world = null; }
      });
    },
    build(ctx, blk) {
      const R = frame(190, 622, 113);
      const k = kit(ctx, blk, R);
      const w = ctx.scene.world;
      if (!w) {
        k.but(R(290, 650, 400, 662), 'ADD NEW', () => { ctx.scene.world = D.idUser(D.newWorld(ctx.main, 'World')); ctx.redrawAll(); }, 'Add a new World', COL.SALMON);
        return;
      }
      const pv = R(195, 641, 285, 730);
      blk.postDraw = () => drawPreview(blk, pv, 'world', w);
      k.sli(R(290, 630, 380, 638), 'HoR ', w, 'horr', 0, 1, 3, 'Sets the amount of red color at the horizon');
      k.sli(R(290, 641, 380, 649), 'HoG ', w, 'horg', 0, 1, 3, 'Sets the amount of green color at the horizon');
      k.sli(R(290, 652, 380, 660), 'HoB ', w, 'horb', 0, 1, 3, 'Sets the amount of blue color at the horizon');
      k.sli(R(290, 665, 380, 673), 'ZeR ', w, 'zenr', 0, 1, 3, 'Sets the amount of red color at the zenith');
      k.sli(R(290, 676, 380, 684), 'ZeG ', w, 'zeng', 0, 1, 3, 'Sets the amount of green color at the zenith');
      k.sli(R(290, 687, 380, 695), 'ZeB ', w, 'zenb', 0, 1, 3, 'Sets the amount of blue color at the zenith');
      k.sli(R(290, 700, 380, 708), 'AmbR ', w, 'ambr', 0, 1, 3, 'Sets the amount of red ambient color');
      k.sli(R(290, 711, 380, 719), 'AmbG ', w, 'ambg', 0, 1, 3, 'Sets the amount of green ambient color');
      k.sli(R(290, 722, 380, 730), 'AmbB ', w, 'ambb', 0, 1, 3, 'Sets the amount of blue ambient color');
      k.num(R(390, 630, 470, 638), 'Grav ', w, 'grav', 0, 25, 0.1, 2, 'Sets the gravitation constant of the game world');
      k.num(R(390, 641, 470, 649), 'Expos ', w, 'exposure', 0.2, 5, 0.1, 2, 'Sets the lighting time, exposure');
      k.tog(R(390, 655, 420, 663), 'Blend', w.skytype, 'blend', 'Renders background with natural progression from horizon to zenith');
      k.tog(R(422, 655, 446, 663), 'Real', w.skytype, 'real', 'Renders background with a real horizon');
      k.tog(R(448, 655, 470, 663), 'Paper', w.skytype, 'paper', 'Flattens blend or texture coordinates');
      k.tog(R(390, 670, 470, 678), 'Mist', w.mist, 'on', 'Enables mist');
      k.row(R(390, 681, 415, 689), 'Qua', w.mist, 'type', 'quad', 'Mist uses quadratic progression');
      k.row(R(417, 681, 443, 689), 'Lin', w.mist, 'type', 'lin', 'Mist uses linear progression');
      k.row(R(445, 681, 470, 689), 'Sqr', w.mist, 'type', 'sqr', 'Mist uses inverse quadratic progression');
      k.num(R(390, 692, 470, 700), 'Sta:', w.mist, 'sta', 0, 1000, 1, 2, 'Specifies the starting distance of the mist');
      k.num(R(390, 703, 470, 711), 'Di:', w.mist, 'dist', 0, 1000, 1, 2, 'Specifies the depth of the mist');
      k.num(R(390, 714, 470, 722), 'Hi:', w.mist, 'height', 0, 100, 1, 2, 'Specifies the factor for a less dense mist with increasing height');
      k.tog(R(480, 670, 560, 678), 'Stars', w.stars, 'on', 'Enables stars');
      k.num(R(480, 681, 560, 689), 'StarDist:', w.stars, 'dist', 2, 1000, 1, 2, 'Specifies the average distance between stars');
      k.num(R(480, 692, 560, 700), 'MinDist:', w.stars, 'mindist', 0, 1000, 1, 2, 'Specifies the minimum distance to the camera');
      k.num(R(480, 703, 560, 711), 'Size:', w.stars, 'size', 0, 10, 0.1, 2, 'Specifies the average screen dimension');
      k.num(R(480, 714, 560, 722), 'Colnoise:', w.stars, 'colnoise', 0, 1, 0.1, 2, 'Randomizes starcolour');
      texChannelButtons(ctx, k, R, w, 6, 580, 630, 830, 638);
      const mt = w.mtex[w.texact || 0];
      if (mt) {
        k.tog(R(580, 645, 620, 653), 'Blend', mt.mapto, 'col', 'Texture affects color progression of background');
        k.tog(R(622, 645, 662, 653), 'Hori', mt.mapto, 'csp', 'Texture affects colour of the horizon');
        k.tog(R(664, 645, 704, 653), 'ZenUp', mt.mapto, 'cmir', 'Texture affects colour of the zenith above');
        k.sli(R(580, 660, 704, 668), 'Col ', mt, 'colfac', 0, 1, 3, 'Sets the amount the texture affects colour values');
      } else mtexPanel(ctx, k, R, w, 'world');
    }
  };

  L.texture = {
    w: 640, h: 113, X0: 190, Y0: 622,
    header(ctx, area, blk, x) {
      const sp = area.space;
      const owner = texOwner(ctx, sp);
      if (!owner) return x;
      const mt = owner.mtex[owner.texact || 0];
      return B.Buts.idBrowse(ctx, blk, x, 'TE', {
        get: () => (mt ? mt.tex : null),
        set: t => { if (!owner.mtex[owner.texact || 0]) owner.mtex[owner.texact || 0] = D.newMTex(null); const m = owner.mtex[owner.texact || 0]; if (m.tex) m.tex.us--; m.tex = D.idUser(t); },
        addNew: () => { const t = D.newTexture(ctx.main, 'Tex'); if (!owner.mtex[owner.texact || 0]) owner.mtex[owner.texact || 0] = D.newMTex(null); const m = owner.mtex[owner.texact || 0]; if (m.tex) m.tex.us--; m.tex = D.idUser(t); },
        unlink: () => { if (mt && mt.tex) mt.tex.us--; owner.mtex[owner.texact || 0] = null; }
      });
    },
    build(ctx, blk, area) {
      const R = frame(190, 622, 113);
      const k = kit(ctx, blk, R);
      const sp = area.space;
      k.row(R(290, 630, 315, 638), 'Mat', sp, 'texfrom', 'mat', 'Displays the textures of the active material');
      k.row(R(316, 630, 345, 638), 'World', sp, 'texfrom', 'world', 'Displays the textures of the world block');
      k.row(R(346, 630, 375, 638), 'Lamp', sp, 'texfrom', 'lamp', 'Displays the textures of the selected lamp');
      const owner = texOwner(ctx, sp);
      if (!owner) return;
      const nch = owner.mtex.length;
      for (let i = 0; i < nch; i++) { const a = 195 + Math.round(i * 90 / nch), b2 = 195 + Math.round((i + 1) * 90 / nch) - 1; k.row(R(a, 630, b2, 638), String(i + 1), owner, 'texact', i, 'Texture channel ' + (i + 1)); }
      const mt = owner.mtex[owner.texact || 0];
      const tex = mt ? mt.tex : null;
      const pv = R(195, 641, 285, 730);
      blk.postDraw = () => drawPreview(blk, pv, 'tex', tex && tex.type !== 'none' ? tex : null);
      if (!tex) {
        k.but(R(390, 650, 500, 662), 'ADD NEW', () => { const t = D.newTexture(ctx.main, 'Tex'); if (!owner.mtex[owner.texact || 0]) owner.mtex[owner.texact || 0] = D.newMTex(null); owner.mtex[owner.texact || 0].tex = D.idUser(t); ctx.redrawAll(); }, 'Add a new Texture', COL.SALMON);
        return;
      }
      const types = ['none', 'clouds', 'wood', 'marble', 'magic', 'blend', 'stucci', 'noise', 'image', 'plugin', 'envmap'];
      const names = ['None', 'Clouds', 'Wood', 'Marble', 'Magic', 'Blend', 'Stucci', 'Noise', 'Image', 'Plugin', 'EnvMap'];
      types.forEach((t, i) => k.row(R(390 + (i % 6) * 40, 630 + Math.floor(i / 6) * 10, 428 + (i % 6) * 40, 638 + Math.floor(i / 6) * 10), names[i], tex, 'type', t, 'Texture type: ' + names[i], i === 0 ? COL.GREY : COL.GREY, () => { tex.stype = 0; }));
      const ST = (labels) => labels.forEach((s, i) => k.row(R(390 + i * 42, 660, 430 + i * 42, 668), s, tex, 'stype', i, s));
      const noiseT = () => { k.row(R(390, 672, 440, 680), 'Soft noise', tex, 'noisetype', 'soft', 'Generates soft noise'); k.row(R(442, 672, 492, 680), 'Hard noise', tex, 'noisetype', 'hard', 'Generates hard noise'); };
      const t = tex.type;
      if (t === 'clouds') { ST(['Default', 'Color']); noiseT(); k.num(R(390, 684, 490, 692), 'NoiseSize :', tex, 'noisesize', 0.0001, 2, 0.01, 3, 'Sets the dimension of the noise table'); k.num(R(390, 695, 490, 703), 'NoiseDepth:', tex, 'noisedepth', 0, 6, 1, 0, 'Sets the depth of the cloud calculation'); }
      else if (t === 'wood') { ST(['Bands', 'Rings', 'BandNoise', 'RingNoise']); noiseT(); k.num(R(390, 684, 490, 692), 'NoiseSize :', tex, 'noisesize', 0.0001, 2, 0.01, 3, 'Sets the dimension of the noise table'); k.num(R(390, 695, 490, 703), 'Turbulence:', tex, 'turbul', 0, 200, 1, 2, 'Sets the turbulence of the bandnoise and ringnoise types'); }
      else if (t === 'marble') { ST(['Soft', 'Sharp', 'Sharper']); noiseT(); k.num(R(390, 684, 490, 692), 'NoiseSize :', tex, 'noisesize', 0.0001, 2, 0.01, 3, 'Sets the dimension of the noise table'); k.num(R(390, 695, 490, 703), 'NoiseDepth:', tex, 'noisedepth', 0, 6, 1, 0, 'Sets the depth of the marble calculation'); k.num(R(390, 706, 490, 714), 'Turbulence:', tex, 'turbul', 0, 200, 1, 2, 'Sets the turbulence of the sine bands'); }
      else if (t === 'magic') { k.num(R(390, 684, 490, 692), 'Size :', tex, 'noisesize', 0.0001, 2, 0.01, 3, 'Sets the dimension of the pattern'); k.num(R(390, 695, 490, 703), 'Depth:', tex, 'noisedepth', 0, 10, 1, 0, 'Sets the depth of the pattern'); k.num(R(390, 706, 490, 714), 'Turbulence:', tex, 'turbul', 0, 200, 1, 2, 'Sets the strength of the pattern'); }
      else if (t === 'blend') { ['Lin', 'Quad', 'Ease', 'Diag', 'Sphere', 'Halo'].forEach((s, i) => k.row(R(390 + i * 34, 660, 422 + i * 34, 668), s, tex, 'stype', i, s)); k.tog(R(390, 672, 440, 680), 'Flip XY', tex, 'flipXY', 'Flips the direction of the progression 90 degrees'); }
      else if (t === 'stucci') { ST(['Plastic', 'Wall In', 'Wall Out']); noiseT(); k.num(R(390, 684, 490, 692), 'NoiseSize :', tex, 'noisesize', 0.0001, 2, 0.01, 3, 'Sets the dimension of the noise table'); k.num(R(390, 695, 490, 703), 'Turbulence:', tex, 'turbul', 0, 200, 1, 2, 'Sets the depth of the stucci'); }
      else if (t === 'noise') { k.num(R(390, 684, 490, 692), 'NoiseDepth:', tex, 'noisedepth', 0, 6, 1, 0, 'Sets the depth of the noise'); }
      else if (t === 'image') {
        k.but(R(390, 660, 470, 668), 'Load Image', () => B.FileOps.loadTextureImage(ctx, tex), 'Load image - file select', COL.SALMON);
        k.tex(R(472, 660, 620, 668), '', () => (tex.image ? tex.image.name : ''), () => {}, 'Image name');
        k.but(R(622, 660, 650, 668), 'Reload', () => B.FileOps.reloadImage(ctx, tex), 'Reloads loaded image');
        const IF = (x1, x2, yt, s, key) => k.tog(R(x1, yt, x2, yt + 8), s, tex.imaflag, key, s);
        IF(390, 425, 672, 'InterPol', 'interpol'); IF(427, 462, 672, 'UseAlpha', 'usealpha'); IF(464, 499, 672, 'CalcAlpha', 'calcalpha'); IF(501, 536, 672, 'NegAlpha', 'negalpha');
        IF(390, 425, 683, 'MipMap', 'mipmap'); IF(427, 462, 683, 'Fields', 'fields'); IF(464, 499, 683, 'Rot90', 'rot90'); IF(501, 536, 683, 'Movie', 'movie');
        const EX = (x1, x2, s, v) => k.row(R(x1, 696, x2, 704), s, tex, 'extend', v, s);
        EX(390, 422, 'Extend', 'extend'); EX(424, 452, 'Clip', 'clip'); EX(454, 486, 'Repeat', 'repeat'); EX(488, 526, 'ClipCube', 'clipcube');
        k.num(R(390, 707, 456, 715), 'Xrepeat:', tex, 'xrepeat', 1, 512, 1, 0, 'Sets the degree of repetition in the X direction');
        k.num(R(458, 707, 526, 715), 'Yrepeat:', tex, 'yrepeat', 1, 512, 1, 0, 'Sets the degree of repetition in the Y direction');
        ['MinX ', 'MinY ', 'MaxX ', 'MaxY '].forEach((lab, i) => blk.num(lab, ...R(530 + (i % 2) * 52, 696 + Math.floor(i / 2) * 11, 580 + (i % 2) * 52, 704 + Math.floor(i / 2) * 11), () => tex.crop[i], v => { tex.crop[i] = v; }, -10, 10, 0.1, 3, 'Sets the crop extents'));
      } else if (t === 'plugin') {
        k.but(R(390, 660, 470, 668), 'Load Plugin', () => B.UI.error(ctx, 'Not a plugin'), 'Load plugin - file select', COL.SALMON);
      } else if (t === 'envmap') {
        k.row(R(390, 660, 430, 668), 'Static', tex, 'stype', 0, 'Calculates environment map only once');
        k.row(R(432, 660, 472, 668), 'Anim', tex, 'stype', 1, 'Calculates environment map at each rendering');
        k.row(R(474, 660, 514, 668), 'Load', tex, 'stype', 2, 'Loads saved environment map');
        k.but(R(390, 672, 470, 680), 'Free Data', () => {}, 'Releases all images associated with this environment map');
      }
      if (t !== 'none') {
        k.tog(R(640, 630, 720, 638), 'Colorband', tex, 'useColorband', 'Toggles colorband operations', null, () => { if (tex.useColorband && !tex.colorband) tex.colorband = B.Tex.newColorband(); });
        if (tex.useColorband && tex.colorband) {
          const cb = tex.colorband;
          k.but(R(722, 630, 742, 638), 'Add', () => { const c = B.Tex.colorband(cb, 0.5); cb.keys.push({ pos: 0.5, col: c }); cb.keys.sort((a, b2) => a.pos - b2.pos); cb.cur = cb.keys.findIndex(kk => kk.pos === 0.5); ctx.redrawAll(); }, 'Adds a new colour position to the colorband');
          k.but(R(744, 630, 764, 638), 'Del', () => { if (cb.keys.length > 1) { cb.keys.splice(cb.cur, 1); cb.cur = Math.max(0, cb.cur - 1); ctx.redrawAll(); } }, 'Deletes the active position');
          blk.num('Cur: ', ...R(766, 630, 806, 638), () => cb.cur, v => { cb.cur = v; }, 0, cb.keys.length - 1, 1, 0, 'The active colour from the colorband');
          k.row(R(808, 630, 822, 638), 'E', cb, 'ipo', 'ease', 'Sets interpolation type \'Ease\'');
          k.row(R(808, 640, 822, 648), 'L', cb, 'ipo', 'linear', 'Sets interpolation type \'Linear\'');
          const key = cb.keys[cb.cur] || cb.keys[0];
          const bandBox = R(640, 642, 806, 652);
          const prevPost = blk.postDraw;
          blk.postDraw = () => {
            prevPost();
            const x1 = blk.px(bandBox[0]), y1 = blk.py(bandBox[1]), x2 = blk.px(bandBox[0] + bandBox[2]) - 1, y2 = blk.py(bandBox[1] + bandBox[3]) - 1;
            for (let x = x1; x <= x2; x++) { const c = B.Tex.colorband(cb, (x - x1) / Math.max(1, x2 - x1)); blk.r.vline(x, y1, y2, B.rgbf(c[0], c[1], c[2])); }
            cb.keys.forEach((kk, i) => { const x = Math.round(x1 + kk.pos * (x2 - x1)); blk.r.vline(x, y1, y2, i === cb.cur ? rgb(255, 255, 255) : rgb(0, 0, 0)); });
            blk.r.frame(x1, y1, x2, y2, rgb(0, 0, 0));
          };
          blk.num('Pos ', ...R(640, 655, 720, 663), () => key.pos, v => { key.pos = v; cb.keys.sort((a, b2) => a.pos - b2.pos); cb.cur = cb.keys.indexOf(key); }, 0, 1, 0.01, 3, 'Sets the position of the active colour');
          ['R ', 'G ', 'B ', 'A '].forEach((s, i) => blk.sli(s, ...R(722 + (i % 2) * 50, 655 + Math.floor(i / 2) * 10, 770 + (i % 2) * 50, 663 + Math.floor(i / 2) * 10), () => key.col[i], v => { key.col[i] = v; }, 0, 1, 3));
        }
        k.sli(R(640, 690, 750, 698), 'Bright ', tex, 'bright', 0, 2, 3, 'Changes the brightness of the colour or intensity of a texture');
        k.sli(R(640, 701, 750, 709), 'Contr ', tex, 'contrast', 0.01, 5, 3, 'Changes the contrast of the colour or intensity of a texture');
        k.sli(R(760, 680, 830, 688), 'R ', tex, 'rfac', 0, 2, 3, 'Changes the red value of the texture');
        k.sli(R(760, 691, 830, 699), 'G ', tex, 'gfac', 0, 2, 3, 'Changes the green value of the texture');
        k.sli(R(760, 702, 830, 710), 'B ', tex, 'bfac', 0, 2, 3, 'Changes the blue value of the texture');
      }
    }
  };

  function texOwner(ctx, sp) {
    const from = sp.texfrom || 'mat';
    if (from === 'world') return ctx.scene.world;
    if (from === 'lamp') { const ob = B.Buts.activeOb(ctx); return ob && ob.type === 'lamp' ? ob.data : null; }
    return Shading.activeMaterial(ctx);
  }

  Shading.texOwner = texOwner;
  Shading.drawPreview = drawPreview;
  Shading.rgb2hsv = rgb2hsv;
  Shading.hsv2rgb = hsv2rgb;
  B.Shading = Shading;
})(globalThis.B204 = globalThis.B204 || {});
