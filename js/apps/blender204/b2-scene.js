(function (B) {
  'use strict';
  const D = B.Data;

  function cloneSpaceData(sp) {
    const out = {};
    Object.entries(sp || {}).forEach(([type, data]) => {
      const c = {};
      Object.entries(data || {}).forEach(([k, v]) => {
        if (['viewmat', 'winmat', 'persmat', 'viewinv', 'persinv', 'win', 'geom', 'listCache', 'restore', 'onOk'].includes(k)) return;
        if (v instanceof Set) c[k] = new Set(v);
        else if (Array.isArray(v)) c[k] = v.map(x => (Array.isArray(x) ? x.slice() : x));
        else if (v && typeof v === 'object' && !(typeof v.code === 'string' && typeof v.uid === 'number')) c[k] = Object.assign({}, v);
        else c[k] = v;
      });
      out[type] = c;
    });
    return out;
  }

  B.cloneSpaces = function (area) { return cloneSpaceData(area.spaces); };

  B.cloneScreen = function (src, w, h) {
    const s = new B.Screen(src.name, src.w, src.h);
    const map = new Map();
    src.verts.forEach(v => { const n = { x: v.x, y: v.y }; map.set(v, n); s.verts.push(n); });
    src.areas.forEach(a => {
      const na = new B.Area(s, map.get(a.v1), map.get(a.v2), map.get(a.v3), map.get(a.v4), a.type);
      na.headertype = a.headertype;
      na.spaces = cloneSpaceData(a.spaces);
      s.areas.push(na);
    });
    s.scene = src.scene;
    s.resize(w, h);
    return s;
  };

  B.deleteScreen = function (ctx) {
    const list = ctx.main.screensUI;
    if (list.length < 2) return;
    const i = list.indexOf(ctx.screen);
    list.splice(i, 1);
    ctx.setScreen(list[Math.max(0, i - 1)]);
  };

  const SceneOps = {
    setScene(ctx, sce) {
      if (sce === ctx.scene) return;
      ctx.exitEditMode(true);
      ctx.G.scene = sce;
      ctx.main.curscene = sce;
      ctx.screen.scene = sce;
      sce.bases.forEach(b => D.whereIs(b.object));
      if (B.Anim) B.Anim.setFrame(ctx, sce.cfra, true);
      ctx.redrawAll();
    },

    addScene(ctx, mode) {
      const main = ctx.main, cur = ctx.scene;
      const sce = D.newScene(main, cur.name);
      sce.r = JSON.parse(JSON.stringify(cur.r));
      sce.lay = cur.lay; sce.layact = cur.layact; sce.cfra = cur.cfra;
      sce.world = cur.world ? D.idUser(cur.world) : null;
      if (mode >= 1) {
        const map = new Map();
        cur.bases.forEach(b => {
          let ob = b.object;
          if (mode >= 2) {
            const c = Object.assign({}, ob, { loc: ob.loc.slice(), rot: ob.rot.slice(), size: ob.size.slice(), dloc: ob.dloc.slice(), drot: ob.drot.slice(), dsize: ob.dsize.slice(), parentInv: ob.parentInv.slice(), mats: ob.mats.slice(), dtx: Object.assign({}, ob.dtx) });
            c.name = main.uniqueName('OB', ob.name);
            c.uid = main.uidCounter++;
            c.us = 0;
            main.objects.push(c);
            if (mode === 3 && ob.data) c.data = B.ObjectOps.copyData(ctx, ob);
            D.idUser(c.data);
            map.set(ob, c);
            ob = c;
          }
          sce.bases.push({ object: D.idUser(ob), sel: b.sel });
        });
        if (mode >= 2) sce.bases.forEach(b => { if (map.has(b.object.parent)) b.object.parent = map.get(b.object.parent); if (map.has(b.object.track)) b.object.track = map.get(b.object.track); });
        sce.camera = map.get(cur.camera) || (mode === 1 ? cur.camera : null);
        const actIdx = cur.bases.indexOf(cur.basact);
        sce.basact = actIdx >= 0 ? sce.bases[actIdx] : null;
      }
      SceneOps.setScene(ctx, sce);
    },

    deleteScene(ctx) {
      const main = ctx.main;
      if (main.scenes.length < 2) return;
      const cur = ctx.scene;
      ctx.exitEditMode(true);
      main.scenes.forEach(s => { if (s.set === cur) s.set = null; });
      main.remove(cur);
      main.screensUI.forEach(s => { if (s.scene === cur) s.scene = main.scenes[0]; });
      ctx.G.scene = null;
      SceneOps.setScene(ctx, main.scenes[0]);
    }
  };

  B.SceneOps = SceneOps;
})(globalThis.B204 = globalThis.B204 || {});
