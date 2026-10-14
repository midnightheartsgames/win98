(function (B) {
  'use strict';
  const V = B.V, M = B.M, D = B.Data;

  function addObject(ctx, type, name, data) {
    const main = ctx.main, sce = ctx.scene;
    if (!data) {
      if (type === 'mesh') data = D.newMesh(main, name);
      else if (type === 'camera') data = D.newCamera(main, name);
      else if (type === 'lamp') data = D.newLamp(main, name);
      else if (B.ObTypes && B.ObTypes[type]) data = B.ObTypes[type].newData(main, name);
    }
    const ob = D.newObject(main, type, name, data ? D.idUser(data) : null);
    const area = B.Edit.viewArea(ctx);
    const sv = area ? area.space : null;
    ob.lay = sv && !sv.scenelock ? (sv.layact || 1) : (sce.layact || lowestLayer(sce.lay));
    if (sv && sv.localview) { sv.localview.obs.push(ob); ob.loc = V.copy(sv.localview.cursor); } else ob.loc = V.copy(sce.cursor);
    if (type === 'camera' || type === 'lamp' || type === 'empty') {
      if (area) {
        const svm = B.View3D.setMatrices(ctx, area);
        const rot = M.transpose3(M.normalized3(svm.viewmat));
        ob.rot = M.toEul(rot);
      }
    }
    sce.bases.forEach(b => { b.sel = false; });
    const base = { object: D.idUser(ob), sel: true };
    sce.bases.push(base);
    sce.basact = base;
    if (type === 'camera' && !sce.camera) sce.camera = ob;
    D.whereIs(ob);
    if (B.Buts) B.Buts.activeChanged(ctx);
    ctx.redrawAll();
    return ob;
  }

  function lowestLayer(lay) { for (let i = 0; i < 20; i++) if (lay & (1 << i)) return 1 << i; return 1; }

  function selectedBases(ctx) {
    const lay = ctx.scene.lay;
    return ctx.scene.bases.filter(b => b.sel && (b.object.lay & lay));
  }

  function deleteSelected(ctx) {
    const sce = ctx.scene;
    const kill = new Set(selectedBases(ctx).map(b => b.object));
    if (!kill.size) return;
    sce.bases.forEach(b => { if (kill.has(b.object.parent)) { reparentKeep(b.object, null); } if (kill.has(b.object.track)) b.object.track = null; });
    sce.bases = sce.bases.filter(b => !kill.has(b.object));
    if (kill.has(sce.camera)) sce.camera = sce.bases.map(b => b.object).find(o => o.type === 'camera') || null;
    if (sce.basact && kill.has(sce.basact.object)) sce.basact = null;
    kill.forEach(ob => {
      ob.us = Math.max(0, (ob.us || 1) - 1);
      if (!ctx.main.scenes.some(s => s.bases.some(b => b.object === ob))) {
        if (ob.data) ob.data.us = Math.max(0, (ob.data.us || 1) - 1);
        ctx.main.remove(ob);
        if (ob.data && ob.data.us <= 0) ctx.main.remove(ob.data);
      }
    });
    ctx.redrawAll();
  }

  function copyData(ctx, ob) {
    const main = ctx.main;
    const d = ob.data;
    if (!d) return null;
    const c = JSON.parse(JSON.stringify(d, (k, v) => (k === '_edgeCache' || k === 'disp' || k === 'mats' || k === 'mtex' || k === 'ipo' || k === 'key' ? undefined : v)));
    const nd = main.add(d.code, d.name, c);
    nd.us = 0;
    if (d.mats) nd.mats = d.mats.slice();
    if (d.mtex) nd.mtex = d.mtex.map(m => (m ? Object.assign({}, m) : null));
    nd.ipo = d.ipo || null;
    if (d.code === 'ME') nd.verts.forEach(v => { v.sel = false; });
    return nd;
  }

  function duplicateObject(ctx, ob, linked) {
    const main = ctx.main, sce = ctx.scene;
    const c = Object.assign({}, ob);
    const keys = ['loc', 'rot', 'size', 'dloc', 'drot', 'dsize'];
    keys.forEach(k => { c[k] = ob[k].slice(); });
    c.parentInv = ob.parentInv.slice();
    c.mats = ob.mats.slice();
    c.dtx = Object.assign({}, ob.dtx);
    c.gameflag = Object.assign({}, ob.gameflag);
    c.transflag = Object.assign({}, ob.transflag);
    c.props = ob.props.map(p => Object.assign({}, p));
    c.sensors = JSON.parse(JSON.stringify(ob.sensors || []));
    c.controllers = JSON.parse(JSON.stringify(ob.controllers || []));
    c.actuators = (ob.actuators || []).map(a => Object.assign({}, a));
    c.effects = JSON.parse(JSON.stringify(ob.effects || []));
    c.name = main.uniqueName('OB', ob.name);
    c.uid = main.uidCounter++;
    c.us = 0;
    main.objects.push(c);
    const dupMesh = ob.type === 'mesh' ? ctx.prefs.dupliMesh !== false : ob.type === 'lamp' ? ctx.prefs.dupliLamp : ob.type === 'camera' ? false : ob.type === 'curve' || ob.type === 'surf' || ob.type === 'font' || ob.type === 'mball' ? true : false;
    if (ob.data) {
      if (!linked && dupMesh) c.data = copyData(ctx, ob);
      D.idUser(c.data);
    }
    if (!linked && ctx.prefs.dupliMat && c.data && c.data.mats) {
      c.data.mats = c.data.mats.map(m => (m ? B.Shading.copyMaterial(ctx, m) : m));
    }
    if (!linked && ctx.prefs.dupliIpo && ob.ipo && B.Anim) c.ipo = B.Anim.copyIpo(ctx, ob.ipo);
    const base = { object: D.idUser(c), sel: true };
    const ob0 = sce.bases.find(b => b.object === ob);
    if (ob0) ob0.sel = false;
    sce.bases.push(base);
    sce.basact = base;
    return c;
  }

  function duplicate(ctx, area, linked) {
    const sel = selectedBases(ctx).map(b => b.object);
    if (!sel.length) return;
    const map = new Map();
    sel.forEach(ob => map.set(ob, duplicateObject(ctx, ob, linked)));
    map.forEach(c => {
      if (c.parent && map.has(c.parent)) c.parent = map.get(c.parent);
      if (c.track && map.has(c.track)) c.track = map.get(c.track);
    });
    ctx.scene.bases.forEach(b => { b.sel = [...map.values()].includes(b.object); });
    const actOrig = sel[sel.length - 1];
    const act = ctx.scene.bases.find(b => b.object === map.get(actOrig));
    if (act) ctx.scene.basact = act;
    ctx.redrawAll();
    B.Transform.start(ctx, area, 'grab', { mouse: ctx.mouse });
  }

  function reparentKeep(ob, parent) {
    D.whereIs(ob);
    const world = ob.obmat.slice();
    ob.parent = parent;
    ob.parentInv = M.ident();
    if (parent) ob.parentInv = M.invert(D.whereIs(parent));
    const local = parent ? M.mul(M.invert(M.mul(D.whereIs(parent), ob.parentInv)), world) : world;
    const d = B.Transform.decompose(local);
    ob.loc = V.sub(d.loc, ob.dloc); ob.rot = V.sub(d.rot, ob.drot); ob.size = V.sub(d.size, ob.dsize);
    D.whereIs(ob);
  }

  function makeParent(ctx) {
    const act = ctx.scene.basact;
    if (!act || !act.sel) return;
    const par = act.object;
    const kids = selectedBases(ctx).filter(b => b !== act).map(b => b.object);
    if (!kids.length) return;
    if (par.type === 'ika') {
      B.UI.pupmenu(ctx, 'Make Parent %t|Use Vertex %x1|Use Limb %x2|Use Skeleton %x3').then(v => {
        if (v === 2) {
          B.UI.button(ctx, 'Limb: ', 0, 0, Math.max(0, par.data.limbs.length - 1), 0).then(limb => {
            if (limb == null) return;
            kids.forEach(k => { D.whereIs(par); k.parent = par; k.partype = 'limb'; k.par1 = limb; k.parentInv = M.invert(M.mul(par.obmat, B.Ika.limbMatrix(par.data, limb))); D.whereIs(k); });
            ctx.redrawAll();
          });
        } else if (v === 3) B.UI.error(ctx, 'No skeleton available: use CTRL K');
        else if (v === 1) B.UI.error(ctx, 'select 1 or 3 vertices');
      });
      return;
    }
    B.UI.okee(ctx, 'Make Parent').then(ok => {
      if (!ok) return;
      for (const k of kids) {
        let p = par;
        let loop = false;
        while (p) { if (p === k) { loop = true; break; } p = p.parent; }
        if (loop) { B.UI.error(ctx, 'Loop in parents'); continue; }
        D.whereIs(par);
        k.parent = par;
        k.partype = 'object';
        k.parentInv = M.invert(par.obmat);
        D.whereIs(k);
      }
      ctx.redrawAll();
    });
  }

  function clearParent(ctx) {
    B.UI.pupmenu(ctx, 'OK? %t|Clear Parent %x1| ... and keep transform (clr track) %x2|Clear parent inverse %x3').then(v => {
      if (v < 1 || v == null) return;
      selectedBases(ctx).forEach(b => {
        const ob = b.object;
        if (v === 1) { ob.parent = null; ob.parentInv = M.ident(); }
        else if (v === 2) { reparentKeep(ob, null); ob.track = null; }
        else if (v === 3) ob.parentInv = M.ident();
        D.whereIs(ob);
      });
      ctx.redrawAll();
    });
  }

  function makeTrack(ctx) {
    const act = ctx.scene.basact;
    if (!act) return;
    B.UI.okee(ctx, 'Make Track').then(ok => {
      if (!ok) return;
      selectedBases(ctx).forEach(b => { if (b !== act) b.object.track = act.object; });
      ctx.redrawAll();
    });
  }

  function clearTrack(ctx) {
    B.UI.pupmenu(ctx, 'OK? %t|Clear Track %x1| ... and keep transform %x2').then(v => {
      if (v < 1 || v == null) return;
      selectedBases(ctx).forEach(b => {
        const ob = b.object;
        if (v === 2) { D.whereIs(ob); const world = ob.obmat.slice(); ob.track = null; const d = B.Transform.decompose(M.mul(M.invert(B.Transform.parentEffect(ob)), world)); ob.rot = d.rot; }
        else ob.track = null;
        D.whereIs(ob);
      });
      ctx.redrawAll();
    });
  }

  function clearXform(ctx, what) {
    const titles = { loc: 'Clear location', rot: 'Clear rotation', size: 'Clear size', origin: 'Clear origin' };
    B.UI.okee(ctx, titles[what]).then(ok => {
      if (!ok) return;
      selectedBases(ctx).forEach(b => {
        const ob = b.object;
        if (what === 'loc') ob.loc = [0, 0, 0];
        else if (what === 'rot') ob.rot = [0, 0, 0];
        else if (what === 'size') ob.size = [1, 1, 1];
        else if (what === 'origin' && ob.parent) { ob.parentInv[12] = 0; ob.parentInv[13] = 0; ob.parentInv[14] = 0; }
        D.whereIs(ob);
      });
      ctx.redrawAll();
    });
  }

  function applySizeRot(ctx) {
    B.UI.okee(ctx, 'Apply size/rot').then(ok => {
      if (!ok) return;
      selectedBases(ctx).forEach(b => {
        const ob = b.object;
        if (ob.type !== 'mesh' && !(B.ObTypes && B.ObTypes[ob.type] && B.ObTypes[ob.type].applyMat)) return;
        if (ob.data.us > 1) { B.UI.error(ctx, "Can't do multi user mesh"); return; }
        const m = M.mul(M.eul(V.add(ob.rot, ob.drot)), M.scale(V.add(ob.size, ob.dsize)));
        if (ob.type === 'mesh') ob.data.verts.forEach(v => { v.co = M.loc(m, v.co); });
        else B.ObTypes[ob.type].applyMat(ob.data, m);
        ob.data.stamp = (ob.data.stamp || 0) + 1;
        ob.rot = [0, 0, 0]; ob.size = [1, 1, 1];
        D.whereIs(ob);
      });
      ctx.redrawAll();
    });
  }

  function joinMeshes(ctx) {
    const act = ctx.scene.basact;
    if (!act || act.object.type !== 'mesh') return;
    const sel = selectedBases(ctx).filter(b => b.object.type === 'mesh' && b !== act);
    if (!sel.length) return;
    B.UI.okee(ctx, 'Join selected Meshes').then(ok => {
      if (!ok) return;
      const target = act.object;
      D.whereIs(target);
      const inv = M.invert(target.obmat);
      const me = target.data;
      if (me.us > 1) { target.data = copyData(ctx, target); target.data.us = 1; me.us--; }
      const tme = target.data;
      sel.forEach(b => {
        const ob = b.object;
        D.whereIs(ob);
        const m = M.mul(inv, ob.obmat);
        const off = tme.verts.length;
        const matOff = [];
        (ob.data.mats || []).forEach((ma, i) => {
          let k = tme.mats.indexOf(ma);
          if (k < 0 && ma) { tme.mats.push(ma); k = tme.mats.length - 1; }
          matOff[i] = Math.max(0, k);
        });
        ob.data.verts.forEach(v => tme.verts.push({ co: M.loc(m, v.co), sel: false, hide: false }));
        ob.data.faces.forEach(f => tme.faces.push(Object.assign({}, f, { v: f.v.map(i => i + off), mat: matOff[f.mat || 0] || 0 })));
      });
      tme.stamp = (tme.stamp || 0) + 1;
      const kill = new Set(sel.map(b => b.object));
      ctx.scene.bases = ctx.scene.bases.filter(b => !kill.has(b.object));
      kill.forEach(ob => { ctx.main.remove(ob); if (ob.data && --ob.data.us <= 0) ctx.main.remove(ob.data); });
      ctx.redrawAll();
    });
  }

  function moveToLayer(ctx) {
    const sel = selectedBases(ctx);
    if (!sel.length) return;
    let lay = sel[0].object.lay;
    const font = 'helv12';
    const w = 300, h = 92;
    const x1 = Math.round(B.clamp(ctx.mouse[0] - w / 2, 2, ctx.raster.w - w - 8)), y1 = Math.round(B.clamp(ctx.mouse[1] - h / 2, 8, ctx.raster.h - h - 4));
    const blk = new B.UI.Block(ctx.raster, { font: 'helv12' });
    for (let i = 0; i < 20; i++) {
      const col = i % 10, top = i < 10;
      const bx = x1 + 20 + (col % 5) * 24 + (col >= 5 ? 130 : 0), by = y1 + (top ? 54 : 30);
      const bit = 1 << i;
      const b = blk.tog('', bx, by, 24, 22, () => !!(lay & bit), () => {});
      b.func = e => { lay = e && e.shift ? (lay ^ bit) || bit : bit; };
    }
    let done = false;
    const close = ok => {
      if (done) return;
      done = true;
      ctx.closeOverlay(ov);
      if (ok) { sel.forEach(b => { b.object.lay = lay; if (!(lay & ctx.scene.lay)) b.sel = false; }); ctx.redrawAll(); }
    };
    const okb = blk.but('OK', x1 + 20, y1 + 4, w - 40, 20, () => close(true));
    okb.col = B.UI.COL.SALMON;
    let modal = null;
    const ov = {
      draw(r) {
        r.rect(x1 + 4, y1 - 4, x1 + w + 5, y1 + h - 3, B.rgb(0, 0, 0));
        r.rect(x1, y1, x1 + w + 1, y1 + h + 1, B.UI.COL.MENU);
        r.hline(x1, x1 + w, y1 + h, B.UI.COL.WHITE);
        r.vline(x1, y1, y1 + h, B.UI.COL.WHITE);
        r.text(font, 'Move to layer', x1 + 10, y1 + h - 14, B.rgb(0, 0, 0));
        blk.draw();
      },
      move(e) { if (e.x < x1 - 50 || e.x > x1 + w + 50 || e.y < y1 - 50 || e.y > y1 + h + 50) close(false); },
      down(e) { const b = blk.find(e.x, e.y); if (b) { modal = B.UI.press(ctx, blk, b, e); ctx.redrawOverlay(); } else close(false); },
      up(e) { if (modal && modal.up) modal.up(e); modal = null; ctx.redrawOverlay(); },
      key(e) {
        if (e.key === 'ESC') close(false);
        else if (e.key === 'RET' || e.key === 'PADENTER') close(true);
        else if (/^[0-9]$/.test(e.key)) { const i = (e.key === '0' ? 9 : +e.key - 1) + (e.alt ? 10 : 0); lay = e.shift ? (lay ^ (1 << i)) || (1 << i) : 1 << i; ctx.redrawOverlay(); }
      }
    };
    ctx.openOverlay(ov);
  }

  function selectAll(ctx) {
    const sce = ctx.scene;
    const vis = sce.bases.filter(b => b.object.lay & sce.lay);
    const any = vis.some(b => b.sel);
    vis.forEach(b => { b.sel = !any; });
    if (!any && !sce.basact && vis.length) sce.basact = vis[vis.length - 1];
    if (B.Buts) B.Buts.activeChanged(ctx);
    ctx.redrawAll();
  }

  function numbuts(ctx) {
    if (ctx.G.obedit) return;
    const base = ctx.scene.basact;
    if (!base) return;
    const ob = base.object;
    const f = (label, v, step, prec, min = -1000, max = 1000) => ({ label, value: v, min, max, step, prec });
    B.UI.numButtons(ctx, 'OK: Assign Values', [
      { label: 'OB: ', value: ob.name, type: 'text', maxlen: 19 },
      f('LocX:', ob.loc[0], 0.1, 3), f('LocY:', ob.loc[1], 0.1, 3), f('LocZ:', ob.loc[2], 0.1, 3),
      f('RotX:', ob.rot[0] / B.DEG, 1, 2, -3600, 3600), f('RotY:', ob.rot[1] / B.DEG, 1, 2, -3600, 3600), f('RotZ:', ob.rot[2] / B.DEG, 1, 2, -3600, 3600),
      f('SizeX:', ob.size[0], 0.1, 3, -100, 100), f('SizeY:', ob.size[1], 0.1, 3, -100, 100), f('SizeZ:', ob.size[2], 0.1, 3, -100, 100)
    ]).then(v => {
      if (!v) return;
      ctx.main.rename(ob, v[0]);
      ob.loc = [v[1], v[2], v[3]];
      ob.rot = [v[4] * B.DEG, v[5] * B.DEG, v[6] * B.DEG];
      ob.size = [v[7], v[8], v[9]];
      D.whereIs(ob);
      ctx.redrawAll();
    });
  }

  function copyMenu(ctx) {
    const act = ctx.scene.basact;
    if (!act) return;
    const ob = act.object;
    let str = 'COPY %t|Loc%x1|Rot%x2|Size%x3|Drawtype%x4|TimeOffs%x5|Dupli%x6|%l|Mass%x7|Damping%x8|Properties%x9';
    if (ob.type === 'mesh') str += '|Tex Space%x17';
    B.UI.pupmenu(ctx, str).then(v => {
      if (v == null || v < 1) return;
      selectedBases(ctx).forEach(b => {
        const o = b.object;
        if (o === ob) return;
        if (v === 1) o.loc = ob.loc.slice();
        else if (v === 2) o.rot = ob.rot.slice();
        else if (v === 3) o.size = ob.size.slice();
        else if (v === 4) o.dt = ob.dt;
        else if (v === 5) o.sf = ob.sf;
        else if (v === 6) { o.transflag = Object.assign({}, ob.transflag); o.dupsta = ob.dupsta; o.dupend = ob.dupend; o.dupon = ob.dupon; o.dupoff = ob.dupoff; }
        else if (v === 7) o.mass = ob.mass;
        else if (v === 8) { o.damping = ob.damping; o.rdamping = ob.rdamping; }
        else if (v === 9) o.props = ob.props.map(p => Object.assign({}, p));
        else if (v === 17 && o.type === 'mesh') o.data.texspace = ob.data.texspace ? JSON.parse(JSON.stringify(ob.data.texspace)) : null;
        D.whereIs(o);
      });
      ctx.redrawAll();
    });
  }

  function makeLinks(ctx) {
    const act = ctx.scene.basact;
    if (!act) return;
    const ob = act.object;
    let str = 'MAKE LINKS %t|To scene...%x1|Object Ipo%x4';
    if (ob.type === 'mesh') str += '|Mesh data%x2|Materials%x3';
    else if (ob.type === 'camera') str += '|Camera data%x2';
    else if (ob.type === 'lamp') str += '|Lamp data%x2';
    else if (ob.data && ob.data.mats) str += '|Curve data%x2|Materials%x3';
    B.UI.pupmenu(ctx, str).then(v => {
      if (v == null || v < 1) return;
      if (v === 1) {
        const others = ctx.main.scenes.filter(s => s !== ctx.scene);
        if (!others.length) return;
        B.UI.pupmenu(ctx, 'Link to scene %t|' + others.map((s, i) => `${s.name} %x${i}`).join('|')).then(i => {
          if (i == null || i < 0) return;
          const target = others[i];
          selectedBases(ctx).forEach(b => { if (!target.bases.some(x => x.object === b.object)) { target.bases.push({ object: D.idUser(b.object), sel: false }); } });
          ctx.redrawAll();
        });
        return;
      }
      selectedBases(ctx).forEach(b => {
        const o = b.object;
        if (o === ob) return;
        if (v === 4) o.ipo = ob.ipo;
        else if (v === 2 && o.type === ob.type) { if (o.data) o.data.us--; o.data = D.idUser(ob.data); }
        else if (v === 3 && o.data && o.data.mats) { o.data.mats = ob.data.mats.slice(); o.mats = ob.mats.slice(); o.colbits = ob.colbits; }
      });
      ctx.redrawAll();
    });
  }

  function selectLinks(ctx) {
    const act = ctx.scene.basact;
    if (!act) return;
    const ob = act.object;
    B.UI.pupmenu(ctx, 'Select links%t|Object Ipo%x1|Object Data%x2|Current Material%x3|Current texture%x4').then(v => {
      if (v == null || v < 1) return;
      const ma = B.View3D.obMaterial(ob, ob.actcol || 0);
      const tex = ma && ma.mtex[ma.texact || 0] ? ma.mtex[ma.texact || 0].tex : null;
      ctx.scene.bases.forEach(b => {
        if (!(b.object.lay & ctx.scene.lay)) return;
        const o = b.object;
        if (v === 1 && ob.ipo && o.ipo === ob.ipo) b.sel = true;
        if (v === 2 && ob.data && o.data === ob.data) b.sel = true;
        if (v === 3 && ma && o.data && o.data.mats && o.data.mats.includes(ma)) b.sel = true;
        if (v === 4 && tex && o.data && o.data.mats && o.data.mats.some(m => m && m.mtex.some(t => t && t.tex === tex))) b.sel = true;
      });
      ctx.redrawAll();
    });
  }

  function singleUser(ctx) {
    B.UI.pupmenu(ctx, 'Make Single User%t|Object%x1|Object & ObData%x2|Object & ObData & Materials+Tex%x3|Materials+Tex%x4').then(v => {
      if (v == null || v < 1) return;
      selectedBases(ctx).forEach(b => {
        const ob = b.object;
        if ((v === 2 || v === 3) && ob.data && ob.data.us > 1) { ob.data.us--; ob.data = D.idUser(copyData(ctx, ob)); }
        if ((v === 3 || v === 4) && ob.data && ob.data.mats) ob.data.mats = ob.data.mats.map(m => (m && m.us > 1 ? B.Shading.copyMaterial(ctx, m) : m));
      });
      ctx.redrawAll();
    });
  }

  function makeLocal(ctx) {
    B.UI.pupmenu(ctx, 'Make Local%t|Selected %x1|All %x2').then(v => {
      if (v == null || v < 1) return;
      ctx.main.objects.forEach(o => { if (o.lib) delete o.lib; });
      ctx.redrawAll();
    });
  }

  function convertMenu(ctx) {
    const act = ctx.scene.basact;
    if (!act) return;
    const ob = act.object;
    const T = B.ObTypes && B.ObTypes[ob.type];
    if (!T || !T.convert) return;
    B.UI.pupmenu(ctx, T.convertMenu).then(v => {
      if (v == null || v < 0) return;
      T.convert(ctx, ob, v);
      ctx.redrawAll();
    });
  }

  function centreOps(ctx, mode) {
    const ob = ctx.scene.basact ? ctx.scene.basact.object : null;
    if (!ob) return;
    if (ctx.G.obedit) { B.UI.error(ctx, 'Unable to perform function in EditMode'); return; }
    if (ob.type !== 'mesh' && !(B.ObTypes && B.ObTypes[ob.type] && B.ObTypes[ob.type].points)) return;
    const pts = ob.type === 'mesh' ? ob.data.verts.map(v => v.co) : B.ObTypes[ob.type].points(ob.data);
    if (!pts.length) return;
    D.whereIs(ob);
    let c;
    if (mode === 'cursor') c = M.loc(M.invert(ob.obmat), ctx.scene.cursor);
    else c = V.mid(...B.View3D.boundBox(pts));
    const move = V.neg(c);
    if (ob.type === 'mesh') B.MeshOps.translate(ob.data, move);
    else B.ObTypes[ob.type].translate(ob.data, move);
    if (mode === 'new' || mode === 'cursor') {
      const worldShift = M.dir(ob.obmat, c);
      const pl = M.dir(M.invert(B.Transform.parentEffect(ob)), worldShift);
      ob.loc = V.add(ob.loc, pl);
    }
    D.whereIs(ob);
    ctx.redrawAll();
  }

  function key(ctx, area, ev) {
    const k = ev.key;
    const plain = !ev.ctrl && !ev.alt && !ev.shift;
    if (k === 'A' && plain) { selectAll(ctx); return true; }
    if ((k === 'X' || k === 'DEL') && plain) {
      if (!selectedBases(ctx).length) return true;
      B.UI.okee(ctx, 'Erase selected').then(ok => { if (ok) deleteSelected(ctx); });
      return true;
    }
    if (k === 'D' && ev.shift && !ev.ctrl && !ev.alt) { duplicate(ctx, area, false); return true; }
    if (k === 'D' && ev.alt && !ev.ctrl) { duplicate(ctx, area, true); return true; }
    if (k === 'P' && ev.ctrl && !ev.alt) { makeParent(ctx); return true; }
    if (k === 'P' && ev.alt && !ev.ctrl) { clearParent(ctx); return true; }
    if (k === 'T' && ev.ctrl && !ev.alt) { makeTrack(ctx); return true; }
    if (k === 'T' && ev.alt && !ev.ctrl) { clearTrack(ctx); return true; }
    if (k === 'G' && ev.alt && !ev.ctrl) { clearXform(ctx, 'loc'); return true; }
    if (k === 'R' && ev.alt && !ev.ctrl) { clearXform(ctx, 'rot'); return true; }
    if (k === 'S' && ev.alt && !ev.ctrl) { clearXform(ctx, 'size'); return true; }
    if (k === 'O' && ev.alt && !ev.ctrl) { clearXform(ctx, 'origin'); return true; }
    if (k === 'M' && plain) { moveToLayer(ctx); return true; }
    if (k === 'A' && ev.ctrl && !ev.alt) { applySizeRot(ctx); return true; }
    if (k === 'J' && ev.ctrl && !ev.alt) { joinMeshes(ctx); return true; }
    if (k === 'C' && ev.ctrl && !ev.alt) { copyMenu(ctx); return true; }
    if (k === 'L' && ev.ctrl && !ev.alt) { makeLinks(ctx); return true; }
    if (k === 'L' && ev.shift && !ev.ctrl) { selectLinks(ctx); return true; }
    if (k === 'C' && ev.alt && !ev.ctrl) { convertMenu(ctx); return true; }
    if (k === 'U' && plain) { singleUser(ctx); return true; }
    if (k === 'L' && plain) { makeLocal(ctx); return true; }
    if (k === 'I' && plain && B.Anim) { B.Anim.insertKeyMenu(ctx); return true; }
    if (k === 'K' && plain && B.Anim) { B.Anim.showKeys(ctx); return true; }
    if (k === 'K' && ev.ctrl && B.Ika) { B.Ika.makeSkeleton(ctx); return true; }
    return false;
  }

  B.ObjectOps = {
    addObject, deleteSelected, duplicate, duplicateObject, copyData, makeParent, clearParent, makeTrack, clearTrack, clearXform, applySizeRot,
    joinMeshes, moveToLayer, selectAll, numbuts, copyMenu, makeLinks, selectLinks, singleUser, makeLocal, convertMenu, centreOps, key, selectedBases, reparentKeep
  };
})(globalThis.B204 = globalThis.B204 || {});
