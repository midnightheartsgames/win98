(function (B) {
  'use strict';
  const COL = B.UI.COL;
  const L = B.Buts.LAYOUTS;
  const { frame, kit } = B.ButsKit;

  function v3d(ctx) { return ctx.screen.areas.find(a => a.type === 'view3d' && a === ctx.lastView3d) || ctx.screen.areas.find(a => a.type === 'view3d'); }

  L.view = {
    w: 640, h: 100, X0: 190, Y0: 635,
    build(ctx, blk) {
      const R = frame(190, 635, 100);
      const k = kit(ctx, blk, R);
      const area = v3d(ctx);
      if (!area) return;
      const sv = area.space;
      if (!sv.bgpic) sv.bgpic = { on: false, size: 5, blend: 0.5, image: null, xof: 0, yof: 0 };
      const bg = sv.bgpic;
      k.tog(R(250, 645, 370, 657), 'BackGroundPic', bg, 'on', 'Display a picture in the 3D background');
      if (bg.on) {
        k.num(R(250, 662, 370, 672), 'Size:', bg, 'size', 0.1, 250, 1, 2, 'Size of the background picture');
        k.but(R(250, 676, 300, 686), 'LOAD', () => B.FileOps.selectImageFor(ctx, p => { bg.image = B.FileOps.imageFromPath(ctx, p); ctx.redrawAll(); }), 'Load a background picture');
        k.tex(R(302, 676, 370, 686), 'BGpic: ', () => (bg.image ? bg.image.name : ''), () => {}, 'Background picture');
        k.sli(R(250, 690, 370, 700), 'Blend:', bg, 'blend', 0, 1, 2, 'Blend the picture with the grey background');
      }
      k.num(R(400, 645, 520, 657), 'Grid:', sv, 'grid', 0.001, 1000, 0.1, 3, 'Grid spacing');
      k.num(R(400, 662, 520, 672), 'GridLines:', sv, 'gridlines', 0, 100, 1, 0, 'Number of grid lines in perspective view');
      k.num(R(400, 676, 520, 686), 'Lens:', sv, 'lens', 10, 120, 1, 0, 'Lens angle in perspective view');
      k.num(R(400, 690, 460, 700), 'ClipStart:', sv, 'near', 0.01, 100, 0.1, 2, 'Near clipping plane');
      k.num(R(462, 690, 520, 700), 'ClipEnd:', sv, 'far', 1, 10000, 10, 0, 'Far clipping plane');
    }
  };

  L.paint = {
    w: 640, h: 100, X0: 190, Y0: 635,
    build(ctx, blk) {
      const R = frame(190, 635, 100);
      const k = kit(ctx, blk, R);
      const vp = ctx.G.vpaint || (ctx.G.vpaint = { r: 1, g: 1, b: 1, a: 0.2, size: 25, mode: 'mix', area: true, soft: true, normals: false, mul: 1, gamma: 1 });
      k.label(205, 638, 'Vertex Paint');
      k.sli(R(205, 646, 320, 654), 'R ', vp, 'r', 0, 1, 3, 'The amount of red used for painting');
      k.sli(R(205, 656, 320, 664), 'G ', vp, 'g', 0, 1, 3, 'The amount of green used for painting');
      k.sli(R(205, 666, 320, 674), 'B ', vp, 'b', 0, 1, 3, 'The amount of blue used for painting');
      blk.col3(...R(322, 646, 340, 674), () => [vp.r, vp.g, vp.b]);
      k.sli(R(205, 680, 320, 688), 'Alpha ', vp, 'a', 0, 1, 3, 'The amount of pressure on the brush');
      k.sli(R(205, 690, 320, 698), 'Size ', vp, 'size', 2, 64, 0, 'The size of the brush');
      ['Mix', 'Add', 'Sub', 'Mul', 'Filter'].forEach((s, i) => k.row(R(205 + i * 27, 704, 230 + i * 27, 712), s, vp, 'mode', s.toLowerCase(), 'Paint mode: ' + s));
      k.tog(R(205, 716, 240, 724), 'Area', vp, 'area', 'Vertex paint evaluates the area of the face the brush covers');
      k.tog(R(242, 716, 277, 724), 'Soft', vp, 'soft', 'Use a soft brush');
      k.tog(R(279, 716, 320, 724), 'Normals', vp, 'normals', 'Vertex paint applies the vertex normal before mixing');
      k.but(R(350, 646, 400, 654), 'Set', () => B.Paint && B.Paint.setAll(ctx), 'Apply the current colour to all vertices');
      k.num(R(350, 656, 400, 664), 'Mul:', vp, 'mul', 0, 2, 0.1, 2, 'Set the number to multiply vertex colours with');
      k.num(R(350, 666, 400, 674), 'Gamma:', vp, 'gamma', 0.1, 5, 0.1, 2, 'Change the clarity of the vertex colours');
      k.label(450, 638, 'Face Select');
      const ob = B.Buts.activeOb(ctx);
      const me = ob && ob.type === 'mesh' ? ob.data : null;
      const tf = me && me.tfaces ? (B.Paint ? B.Paint.activeTFace(ctx, ob) : null) : null;
      if (tf) {
        const T = (x1, x2, yt, s, key, tip) => k.tog(R(x1, yt, x2, yt + 8), s, tf.mode, key, tip, null, () => B.Paint.copyActiveTFace(ctx, ob, key));
        T(450, 480, 646, 'Tex', 'tex', 'Render face with texture'); T(482, 512, 646, 'Tiles', 'tiles', 'Use tilemode for face'); T(514, 544, 646, 'Light', 'light', 'Use light for face');
        T(546, 576, 646, 'Invisible', 'invisible', 'Make face invisible'); T(578, 608, 646, 'Collision', 'collision', 'Use face for collision detection');
        T(450, 480, 656, 'Shared', 'shared', 'Blend vertex colours across face when vertices are shared'); T(482, 512, 656, 'Twoside', 'twoside', 'Render face twosided');
        T(514, 544, 656, 'ObColor', 'obcolor', 'Use ObColor instead of vertex colours'); T(546, 576, 656, 'Halo', 'halo', 'Screen aligned billboard'); T(578, 608, 656, 'Shadow', 'shadow', 'Face is used for shadow'); T(610, 640, 656, 'Text', 'text', 'Enable bitmap text on face');
        ['Opaque', 'Add', 'Alpha'].forEach((s, i) => k.row(R(450 + i * 40, 666, 488 + i * 40, 674), s, tf, 'transp', s.toLowerCase(), 'Render colour of textured face as ' + s));
      } else if (me) {
        k.label(450, 650, me.tfaces ? 'Select a face in FaceSelect mode' : 'Make TexFace in Edit buttons first', 180);
      }
      k.but(R(450, 690, 530, 698), 'Copy DrawMode', () => B.Paint && B.Paint.copyToSelected(ctx, 'mode'), 'Copy the drawmode from active face to selected faces');
      k.but(R(532, 690, 612, 698), 'Copy UV+tex', () => B.Paint && B.Paint.copyToSelected(ctx, 'uv'), 'Copy UV information and textures from active face to selected faces');
      k.but(R(450, 700, 530, 708), 'Copy VertCol', () => B.Paint && B.Paint.copyToSelected(ctx, 'col'), 'Copy vertex colours from active face to selected faces');
    }
  };

  L.radio = {
    w: 640, h: 100, X0: 190, Y0: 635,
    build(ctx, blk) {
      const R = frame(190, 635, 100);
      const k = kit(ctx, blk, R);
      const sce = ctx.scene;
      if (!sce.radio) sce.radio = { hemires: 300, maxiter: 120, subshootp: 1, subshoote: 2, nodelim: 0, maxsublamp: 4, pama: 500, pami: 200, elma: 100, elmi: 20, maxnode: 10000, convergence: 0.1, radfac: 30, gamma: 2, drawtype: 'gour', showlim: false };
      const rd = sce.radio;
      const st = B.Radio ? B.Radio.state(ctx) : { phase: 0 };
      k.but(R(200, 645, 290, 657), 'Collect Meshes', () => B.Radio && B.Radio.collect(ctx), 'Convert selected and visible meshes to patches', COL.SALMON);
      if (st.phase > 0) k.but(R(200, 660, 290, 668), 'Free Radio Data', () => B.Radio.free(ctx), 'Release all memory used by Radiosity', COL.SALMON);
      ['Wire', 'Solid', 'Gour'].forEach((s, i) => k.row(R(300 + i * 30, 645, 328 + i * 30, 653), s, rd, 'drawtype', s.toLowerCase(), 'Display radiosity as ' + s));
      k.tog(R(300, 656, 388, 664), 'ShowLim', rd, 'showlim', 'Visualize patch and element limits');
      k.num(R(400, 645, 470, 653), 'ElMax:', rd, 'elma', 1, 500, 1, 0, 'Set the maximum size of an element');
      k.num(R(472, 645, 540, 653), 'ElMin:', rd, 'elmi', 1, 100, 1, 0, 'Set the minimum size of an element');
      k.num(R(400, 656, 470, 664), 'PaMax:', rd, 'pama', 10, 1000, 10, 0, 'Set the maximum size of a patch');
      k.num(R(472, 656, 540, 664), 'PaMin:', rd, 'pami', 10, 1000, 10, 0, 'Set the minimum size of a patch');
      k.but(R(200, 676, 290, 684), 'Limit Subdivide', () => B.Radio && B.Radio.subdivide(ctx), 'Subdivide patches');
      k.num(R(300, 676, 388, 684), 'MaxEl:', rd, 'maxnode', 1, 250000, 100, 0, 'Set the maximum allowed number of elements');
      k.num(R(300, 687, 388, 695), 'Hemires:', rd, 'hemires', 100, 1000, 100, 0, 'Set the size of a hemicube');
      k.but(R(200, 700, 290, 712), 'GO', () => B.Radio && B.Radio.go(ctx), 'Start the radiosity simulation', COL.SALMON);
      k.num(R(300, 700, 388, 708), 'Max Iterations:', rd, 'maxiter', 0, 10000, 1, 0, 'Limit the maximum number of radiosity rounds');
      k.num(R(300, 711, 388, 719), 'Convergence:', rd, 'convergence', 0, 1, 0.01, 3, 'Set the lower threshold of unshot energy');
      k.num(R(400, 700, 470, 708), 'Mult:', rd, 'radfac', 0.001, 250, 1, 2, 'Multiply the energy values');
      k.num(R(472, 700, 540, 708), 'Gamma:', rd, 'gamma', 0.2, 10, 0.1, 2, 'Change the contrast of the energy values');
      k.but(R(560, 645, 640, 657), 'Replace Meshes', () => B.Radio && B.Radio.toMeshes(ctx, true), 'Convert meshes to Mesh objects with vertex colours, changing input-meshes', COL.SALMON);
      k.but(R(560, 660, 640, 672), 'Add new Meshes', () => B.Radio && B.Radio.toMeshes(ctx, false), 'Convert meshes to Mesh objects with vertex colours, unchanging input-meshes', COL.SALMON);
      if (st.info) blk.label(st.info, ...R(400, 720, 640, 730));
    }
  };

  L.script = {
    w: 640, h: 100, X0: 190, Y0: 635,
    build(ctx, blk) {
      const R = frame(190, 635, 100);
      const k = kit(ctx, blk, R);
      const ob = B.Buts.activeOb(ctx);
      const sources = [['Object', ob], ['Material', B.Shading.activeMaterial(ctx)], ['World', ctx.scene.world], ['Scene', ctx.scene]];
      sources.forEach(([label, owner], si) => {
        const x = 200 + si * 110;
        k.label(x, 640, label + ' Script link');
        if (!owner) return;
        owner.scriptlinks = owner.scriptlinks || [];
        const links = owner.scriptlinks;
        owner.actscript = Math.min(owner.actscript || 0, Math.max(0, links.length - 1));
        blk.num(links.length + ' Scr:', ...R(x, 650, x + 50, 658), () => (links.length ? owner.actscript + 1 : 0), v => { owner.actscript = Math.max(0, v - 1); }, links.length ? 1 : 0, links.length, 1, 0, 'Total / Active Script link (LeftMouse + Drag to change)');
        k.but(R(x + 52, 650, x + 76, 658), 'New', () => { links.push({ text: null, event: 1 }); owner.actscript = links.length - 1; ctx.redrawAll(); }, 'Add a new Script link');
        k.but(R(x + 78, 650, x + 100, 658), 'Del', () => { links.splice(owner.actscript, 1); ctx.redrawAll(); }, 'Delete the current Script link');
        const sl = links[owner.actscript];
        if (sl) {
          k.menu(R(x, 662, x + 100, 670), 'FrameChanged%x 1|Redraw%x 4|OnLoad%x 2', () => sl.event, v => { sl.event = v; }, 'Script links for the Frame changed event');
          k.tex(R(x, 674, x + 100, 682), '', () => (sl.text ? sl.text.name : ''), v => { sl.text = ctx.main.texts.find(t => t.name === v) || null; }, 'Name of Script to link');
        }
      });
    }
  };

  L.game = L.game || { w: 640, h: 100, build() {} };
})(globalThis.B204 = globalThis.B204 || {});
