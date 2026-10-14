(function (B) {
  'use strict';
  const COL = B.UI.COL;
  const L = B.Buts.LAYOUTS;

  function frame(X0, Y0, H) { return (x1, yt, x2, yb) => [x1 - X0, (Y0 + H - 1) - yb, x2 - x1 + 1, yb - yt + 1]; }

  function kit(ctx, blk, R) {
    const redraw = () => ctx.redrawAll();
    const k = {
      R,
      tog(box, str, obj, key, tip, col, func) {
        const b = blk.tog(str, ...box, () => !!(typeof obj === 'function' ? obj()[key] : obj[key]), v => { const o = typeof obj === 'function' ? obj() : obj; o[key] = !!v; }, tip);
        if (col) b.col = col;
        b.func = () => { if (func) func(); redraw(); };
        return b;
      },
      num(box, str, obj, key, min, max, step, prec, tip, func, col) {
        const b = blk.num(str, ...box, () => (typeof obj === 'function' ? obj()[key] : obj[key]), v => { const o = typeof obj === 'function' ? obj() : obj; o[key] = v; if (func) func(v); }, min, max, step, prec, tip);
        if (col) b.col = col;
        return b;
      },
      sli(box, str, obj, key, min, max, prec, tip, func) {
        return blk.sli(str, ...box, () => obj[key], v => { obj[key] = v; if (func) func(v); }, min, max, prec, tip);
      },
      but(box, str, fn, tip, col) {
        const b = blk.but(str, ...box, fn, tip);
        if (col) b.col = col;
        return b;
      },
      row(box, str, obj, key, val, tip, col, func) {
        const b = blk.row(str, ...box, () => obj[key], v => { obj[key] = v; if (func) func(v); }, val, tip);
        if (col) b.col = col;
        return b;
      },
      tex(box, str, get, set, tip, maxlen) { return blk.tex(str, ...box, get, set, maxlen || 79, tip); },
      menu(box, str, get, set, tip, col) { const b = blk.menu(str, ...box, get, set, tip); if (col) b.col = col; return b; },
      label(x, yt, str, w) { const box = R(x, yt, x + (w || B.textWidth('helv8', str) + 2), yt + 8); return blk.label(str, ...box); },
      icon(box, icon, fn, tip, col) { const b = blk.icon(icon, ...box, fn, tip); if (col) b.col = col; return b; }
    };
    return k;
  }

  function layerButtons(ctx, blk, R, x0, yt, ob) {
    for (let i = 0; i < 20; i++) {
      const col = i % 10, top = i < 10;
      const x = x0 + (col % 5) * 8 + (col >= 5 ? 41 : 0);
      const y = top ? yt : yt + 8;
      const bit = 1 << i;
      const box = R(x, y, x + 8, y + 8);
      const b = blk.tog('', ...box, () => !!(ob.lay & bit), () => {}, 'Object layer');
      b.func = ev => {
        if (ev && ev.shift) { ob.lay ^= bit; if (!ob.lay) ob.lay = bit; } else ob.lay = bit;
        const base = ctx.scene.bases.find(x2 => x2.object === ob);
        if (base && !(ob.lay & ctx.scene.lay)) base.sel = false;
        ctx.redrawAll();
      };
    }
  }

  function editHeader(ctx, area, blk, x) {
    const ob = B.Buts.activeOb(ctx);
    if (!ob) return x;
    const code = { mesh: 'ME', camera: 'CA', lamp: 'LA', curve: 'CU', surf: 'CU', font: 'CU', mball: 'MB', lattice: 'LT', ika: 'IK' }[ob.type];
    if (code && ob.data) {
      x = B.Buts.idBrowse(ctx, blk, x, code, {
        get: () => ob.data,
        list: () => ctx.main.list(code).filter(d => !(ob.type === 'surf' || ob.type === 'curve' || ob.type === 'font') || d.cutype === ob.data.cutype),
        set: d => { if (d === ob.data) return; if (ctx.G.obedit === ob) B.Edit.exit(ctx, true); ob.data.us--; ob.data = B.Data.idUser(d); },
        singleUser: () => { if (ob.data.us > 1) { ob.data.us--; ob.data = B.Data.idUser(B.ObjectOps.copyData(ctx, ob)); } }
      });
    } else x += 140;
    x = Math.max(x, 706);
    blk.col = COL.GREY;
    blk.tex('OB:', x, 0, 136, 22, () => ob.name, v => { ctx.main.rename(ob, v); ctx.redrawAll(); }, 19, 'Active Object name');
    return x + 136;
  }

  function editMesh(ctx, blk, ob) {
    const R = frame(195, 625, 110);
    const k = kit(ctx, blk, R);
    const me = ob.data;
    const G = ctx.G;
    const eo = G.editOpts;
    k.label(205, 628, 'Drawtype');
    k.menu(R(203, 636, 254, 645), 'Drawtype%t|Bounds %x1|Wire %x2|Solid %x3|Shaded %x4', () => ({ bounds: 1, wire: 2, solid: 3, shaded: 4 })[ob.dt], v => { ob.dt = [null, 'bounds', 'wire', 'solid', 'shaded'][v]; }, 'Drawtype menu');
    k.label(205, 648, 'Draw Extra');
    k.tog(R(203, 656, 254, 664), 'Bounds', ob.dtx, 'bounds', 'Displays the active object\'s bounds');
    k.menu(R(203, 666, 254, 674), 'Bounding volume%t|Box%x0|Sphere%x1|Cylinder%x2|Cone%x3|Polyheder%x4', () => ['box', 'sphere', 'cylinder', 'cone', 'polyheder'].indexOf(ob.boundtype), v => { ob.boundtype = ['box', 'sphere', 'cylinder', 'cone', 'polyheder'][v]; }, 'Bounding volume');
    k.tog(R(203, 686, 254, 694), 'Axis', ob.dtx, 'axis', 'Displays the active object\'s centre and axis');
    k.tog(R(203, 696, 254, 704), 'TexSpace', ob.dtx, 'texspace', 'Displays the active object\'s texture space');
    k.tog(R(203, 706, 254, 714), 'Name', ob.dtx, 'name', 'Displays the active object\'s name');
    k.tog(R(261, 636, 326, 644), 'AutoTexSpace', me, 'autotex', 'To switch automatic calculation of texture space');
    k.tog(R(261, 646, 326, 654), 'No V.Normal Flip', me.flag, 'noPunoFlip', 'Disable flipping of vertexnormals during render');
    k.tog(R(261, 656, 326, 664), 'Auto Smooth', me.flag, 'autosmooth', 'Automatic detection of smooth rendered faces during render', COL.GREEN);
    k.num(R(261, 666, 326, 674), 'Degr: ', me, 'smoothresh', 1, 80, 1, 0, 'Maximum angle (between face normals) that defines smooth rendering');
    k.tog(R(261, 676, 326, 684), 'S-Mesh', me, 'smesh', 'Subdivision Mesh', COL.GREEN, () => { me.stamp = (me.stamp || 0) + 1; });
    k.num(R(261, 686, 326, 694), 'Subdiv: ', me, 'subdiv', 1, 6, 1, 0, 'Level of subdivision', () => { me.stamp = (me.stamp || 0) + 1; });
    k.label(262, 700, 'Sticky');
    k.but(R(294, 698, 326, 706), me.sticky ? 'Delete' : 'Make', () => B.Shading.toggleSticky(ctx, ob), me.sticky ? 'Delete sticky texture coords' : 'Make sticky texture coords (projected from view)', COL.SALMON);
    k.label(262, 710, 'VertCol');
    k.but(R(294, 708, 326, 716), me.vcols ? 'Delete' : 'Make', () => B.Shading.toggleVertCol(ctx, ob), 'VertCol', COL.SALMON);
    k.label(262, 720, 'TexFace');
    k.but(R(294, 718, 326, 726), me.tfaces ? 'Delete' : 'Make', () => B.Shading.toggleTexFace(ctx, ob), 'TexFace', COL.SALMON);
    layerButtons(ctx, blk, R, 336, 630, ob);
    k.label(352, 652, 'Material');
    const totcol = Math.max(0, me.mats.length);
    const ma = B.View3D.obMaterial(ob, ob.actcol || 0);
    blk.col3(...R(336, 661, 348, 672), () => (ma ? [ma.r, ma.g, ma.b] : [0.5, 0.5, 0.5]));
    const mb = blk.num(totcol + ' Mat: ', ...R(349, 661, 399, 672), () => (totcol ? (ob.actcol || 0) + 1 : 0), v => { ob.actcol = Math.max(0, v - 1); }, totcol ? 1 : 0, Math.max(totcol, 0), 1, 0, 'Total indices, active index');
    mb.func = () => ctx.redrawAll();
    k.but(R(401, 661, 416, 672), '?', () => B.Shading.matIndexFromSel(ctx, ob), 'In EditMode, sets the active material index from selected faces');
    k.but(R(336, 675, 375, 683), 'New', () => B.Shading.newMatIndex(ctx, ob), 'Add a new Material index', COL.SALMON);
    k.but(R(376, 675, 416, 683), 'Delete', () => B.Shading.delMatIndex(ctx, ob), 'Delete this Material index', COL.SALMON);
    k.but(R(336, 688, 375, 696), 'Select', () => B.Shading.selectMatIndex(ctx, ob, true), 'In EditMode, select faces that have the active index');
    k.but(R(376, 688, 416, 696), 'Deselect', () => B.Shading.selectMatIndex(ctx, ob, false), 'Deselect');
    k.but(R(336, 700, 416, 710), 'Assign', () => B.Shading.assignMatIndex(ctx, ob), 'In EditMode, assign the active index to selected faces', COL.SALMON);
    k.but(R(336, 720, 374, 728), 'Set Smooth', () => B.Shading.setSmooth(ctx, ob, true), "In EditMode: set 'smooth' rendering of selected faces");
    k.but(R(377, 720, 416, 728), 'Set Solid', () => B.Shading.setSmooth(ctx, ob, false), "In EditMode: set 'solid' rendering of selected faces");
    k.tex(R(429, 636, 552, 644), 'TexMesh: ', () => (me.texmesh ? me.texmesh.name : ''), v => { me.texmesh = ctx.main.meshes.find(m => m.name === v) || null; }, 'Texture mesh');
    const inEdit = G.obedit === ob;
    const ed = fn => () => { if (inEdit) fn(); };
    k.but(R(428, 652, 552, 666), 'Extrude', ed(() => B.Edit.editTool(ctx, 'extrude')), 'Extrude', COL.SALMON);
    k.but(R(428, 669, 467, 681), 'Screw', ed(() => B.Edit.spinTool(ctx, 'screw')), 'Screw', COL.SALMON);
    k.but(R(469, 669, 508, 681), 'Spin', ed(() => B.Edit.spinTool(ctx, 'spin')), 'Spin', COL.SALMON);
    k.but(R(510, 669, 552, 681), 'Spin Dup', ed(() => B.Edit.spinTool(ctx, 'spindup')), 'Spin Dup', COL.SALMON);
    k.num(R(428, 685, 467, 692), 'Degr: ', eo, 'degr', -360, 360, 10, 0, 'Degr');
    k.num(R(469, 685, 508, 692), 'Steps: ', eo, 'steps', 1, 180, 1, 0, 'Steps');
    k.num(R(510, 685, 552, 692), 'Turns: ', eo, 'turns', 1, 360, 1, 0, 'Turns');
    k.tog(R(428, 698, 502, 707), 'Keep Original', eo, 'keepOriginal', 'Keep Original');
    k.tog(R(510, 698, 552, 707), 'Clockwise', eo, 'clockwise', 'Clockwise');
    k.but(R(428, 711, 491, 722), 'Extrude Repeat', ed(() => B.Edit.spinTool(ctx, 'extruderepeat')), 'ExtrudeRepeat', COL.SALMON);
    k.num(R(494, 711, 552, 722), 'Offset: ', eo, 'offset', 0.01, 100, 0.1, 3, 'Offset');
    const T = (box, s, name, col) => k.but(R(...box), s, ed(() => B.Edit.editTool(ctx, name)), s, col || COL.SALMON);
    T([563, 634, 611, 648], 'Intersect', 'intersect');
    T([613, 634, 658, 648], 'Split', 'split');
    T([563, 653, 611, 668], 'To Sphere', 'tosphere');
    T([613, 653, 658, 668], 'Beauty', 'beauty', COL.GREEN);
    T([563, 672, 611, 687], 'Subdivide', 'subdivide');
    T([613, 672, 658, 687], 'Fract Subd', 'fractsubd');
    T([563, 692, 611, 706], 'Noise', 'noise');
    T([613, 692, 658, 706], 'Smooth', 'smooth');
    T([563, 711, 611, 725], 'Xsort', 'xsort');
    T([613, 711, 658, 725], 'Hash', 'hash');
    T([668, 634, 716, 646], 'Rem Doubles', 'remdoubles');
    k.num(R(669, 651, 718, 659), 'Limit: ', eo, 'limit', 0.0001, 1, 0.001, 3, 'Limit');
    k.but(R(670, 669, 718, 677), 'Centre', () => B.ObjectOps.centreOps(ctx, 'centre'), "Shift object data to be centered about object's origin", COL.SALMON);
    k.but(R(670, 679, 718, 687), 'Centre New', () => B.ObjectOps.centreOps(ctx, 'new'), "Shift object's origin to center of object data", COL.SALMON);
    k.but(R(670, 689, 718, 697), 'Centre Cursor', () => B.ObjectOps.centreOps(ctx, 'cursor'), "Shift object's origin to cursor location", COL.SALMON);
    T([670, 699, 718, 707], 'Flip Normals', 'flip');
    k.but(R(670, 709, 718, 717), 'SlowerDraw', () => { eo.allEdges = true; ctx.redrawAll(); }, 'SlowerDraw', COL.SALMON);
    k.but(R(670, 719, 718, 727), 'FasterDraw', () => { eo.allEdges = false; ctx.redrawAll(); }, 'FasterDraw', COL.SALMON);
    k.tog(R(734, 634, 816, 643), 'Double Sided', me.flag, 'twoside', 'Drawmode flag,  not for rendering');
    T([735, 651, 773, 659], 'Hide', 'hide', COL.GREY);
    T([776, 651, 816, 659], 'Reveal', 'reveal', COL.GREY);
    T([735, 662, 816, 670], 'Select Swap', 'selswap', COL.GREY);
    k.num(R(735, 682, 816, 690), 'NSize: ', eo, 'normalSize', 0.001, 2, 0.01, 3, 'NSize');
    k.tog(R(735, 692, 816, 700), 'Draw Normals', eo, 'drawNormals', 'Draw Normals');
    k.tog(R(735, 702, 816, 710), 'Draw Faces', eo, 'drawFaces', 'Draw Faces');
    k.tog(R(735, 722, 816, 730), 'All edges', eo, 'allEdges', 'All edges');
  }

  function editCamera(ctx, blk, ob) {
    const R = frame(195, 625, 110);
    const k = kit(ctx, blk, R);
    const cam = ob.data;
    layerButtons(ctx, blk, R, 336, 630, ob);
    k.num(R(470, 652, 600, 664), 'Lens: ', cam, 'lens', 1, 250, 1, 2, 'Lens');
    k.num(R(470, 668, 600, 680), 'ClipSta: ', cam, 'clipsta', 0.001, 100, 0.1, 3, 'ClipSta');
    k.num(R(470, 684, 600, 696), 'ClipEnd: ', cam, 'clipend', 1, 5000, 10, 1, 'ClipEnd');
    k.num(R(470, 700, 600, 712), 'DrawSize: ', cam, 'drawsize', 0.1, 10, 0.1, 3, 'DrawSize');
    k.tog(R(610, 652, 680, 664), 'Ortho', cam, 'ortho', 'Ortho');
    k.tog(R(610, 668, 680, 680), 'ShowLimits', cam, 'showlimits', 'ShowLimits');
    k.tog(R(610, 684, 680, 696), 'Show Mist', cam, 'showmist', 'Show Mist');
    commonDraw(ctx, blk, R, ob, k);
  }

  function commonDraw(ctx, blk, R, ob, k) {
    k.label(205, 628, 'Drawtype');
    k.menu(R(203, 636, 254, 645), 'Drawtype%t|Bounds %x1|Wire %x2|Solid %x3|Shaded %x4', () => ({ bounds: 1, wire: 2, solid: 3, shaded: 4 })[ob.dt], v => { ob.dt = [null, 'bounds', 'wire', 'solid', 'shaded'][v]; }, 'Drawtype menu');
    k.label(205, 648, 'Draw Extra');
    k.tog(R(203, 656, 254, 664), 'Bounds', ob.dtx, 'bounds');
    k.tog(R(203, 686, 254, 694), 'Axis', ob.dtx, 'axis');
    k.tog(R(203, 706, 254, 714), 'Name', ob.dtx, 'name');
  }

  function editGeneric(ctx, blk, ob) {
    const R = frame(195, 625, 110);
    const k = kit(ctx, blk, R);
    layerButtons(ctx, blk, R, 336, 630, ob);
    commonDraw(ctx, blk, R, ob, k);
    if (B.ObTypes && B.ObTypes[ob.type] && B.ObTypes[ob.type].editButtons) B.ObTypes[ob.type].editButtons(ctx, blk, ob, k, R);
  }

  L.edit = {
    w: 640, h: 110, X0: 195, Y0: 625,
    header: editHeader,
    build(ctx, blk) {
      const ob = B.Buts.activeOb(ctx);
      if (!ob) return;
      if (ob.type === 'mesh') editMesh(ctx, blk, ob);
      else if (ob.type === 'camera') editCamera(ctx, blk, ob);
      else editGeneric(ctx, blk, ob);
    }
  };

  B.ButsKit = { frame, kit, layerButtons, commonDraw };
})(globalThis.B204 = globalThis.B204 || {});
