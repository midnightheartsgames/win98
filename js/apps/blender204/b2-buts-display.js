(function (B) {
  'use strict';
  const COL = B.UI.COL;
  const L = B.Buts.LAYOUTS;
  const { frame, kit } = B.ButsKit;

  function sceneHeader(ctx, area, blk, x) {
    const sce = ctx.scene;
    x = B.Buts.idBrowse(ctx, blk, x, 'SC', {
      prefix: 'SCE',
      get: () => sce, set: s => B.SceneOps.setScene(ctx, s),
      addNew: () => B.UI.pupmenu(ctx, 'Add scene%t|Empty%x0|Link Objects%x1|Link ObData%x2|Full Copy%x3').then(m => { if (m >= 0) B.SceneOps.addScene(ctx, m); }),
      unlink: () => B.UI.okee(ctx, 'Delete current scene').then(ok => { if (ok) B.SceneOps.deleteScene(ctx); })
    });
    return Math.max(x, 861 - 20 - 10);
  }

  function presets(r, p) {
    const P = {
      pal: { xsch: 720, ysch: 576, xasp: 54, yasp: 51, size: 100, frs_sec: 25 },
      def: { xsch: 320, ysch: 256, xasp: 1, yasp: 1, size: 100, frs_sec: 25 },
      preview: { xsch: 640, ysch: 512, xasp: 1, yasp: 1, size: 50, frs_sec: 25 },
      pc: { xsch: 640, ysch: 480, xasp: 100, yasp: 100, size: 100, frs_sec: 25 },
      pal169: { xsch: 720, ysch: 576, xasp: 64, yasp: 45, size: 100, frs_sec: 25 },
      pano: { xsch: 36, ysch: 176, xasp: 115, yasp: 100, size: 100, frs_sec: 25, xparts: 16, panorama: true },
      full: { xsch: 1280, ysch: 1024, xasp: 1, yasp: 1, size: 100, frs_sec: 24 }
    }[p];
    Object.assign(r, P);
    if (P.panorama) r.mode.panorama = true; else if (p !== 'pano') r.mode.panorama = false;
    if (!P.xparts) r.xparts = 1;
  }

  L.display = {
    w: 645, h: 100, X0: 190, Y0: 635,
    header: sceneHeader,
    build(ctx, blk) {
      const R = frame(190, 635, 100);
      const k = kit(ctx, blk, R);
      const r = ctx.scene.r;
      const m = r.mode;
      k.but(R(195, 641, 206, 649), '', () => B.FileOps.selectRenderDir(ctx), 'Open Fileselect to get Pics dir/name');
      k.tex(R(207, 641, 335, 649), '', () => r.pic, v => { r.pic = v; }, 'Directory/name to save rendered Pics to');
      k.label(340, 642, 'Pics');
      k.tog(R(195, 652, 201, 660), '', m, 'backbuf', 'Enable/Disable use of Backbuf image');
      k.but(R(202, 652, 206, 660), '', () => B.FileOps.selectImageFor(ctx, v => { r.backbuf = v; }), 'Open Fileselect to get Backbuf image');
      k.tex(R(207, 652, 335, 660), '', () => r.backbuf, v => { r.backbuf = v; }, 'Image to use as background for rendering');
      k.tog(R(338, 652, 368, 660), 'Backbuf', m, 'backbuf', 'Enable/Disable use of Backbuf image');
      k.tog(R(195, 664, 201, 672), '', m, 'ftype', 'Enable/Disable use of Ftype image');
      k.but(R(202, 664, 206, 672), '', () => B.FileOps.selectImageFor(ctx, v => { r.ftype = v; }), 'Open Fileselect to get Ftype image');
      k.tex(R(207, 664, 335, 672), '', () => r.ftype, v => { r.ftype = v; }, 'Image to use with FTYPE Image type');
      k.label(340, 665, 'Ftype');
      k.but(R(195, 674, 205, 683), '-', () => {
        const others = ctx.main.scenes.filter(s => s !== ctx.scene);
        if (!others.length) return;
        B.UI.pupmenu(ctx, 'Set %t|' + others.map((s, i) => `${s.name} %x${i}`).join('|')).then(i => { if (i >= 0) { ctx.scene.set = others[i]; ctx.redrawAll(); } });
      }, 'Scene to link as a Set');
      if (ctx.scene.set) blk.label(ctx.scene.set.name, ...R(208, 675, 320, 683));
      k.but(R(324, 674, 335, 683), 'x', () => { ctx.scene.set = null; ctx.redrawAll(); }, 'Remove Set link');
      k.label(340, 676, 'Set');
      k.tog(R(338, 692, 372, 700), 'Edge', m, 'edge', 'Enable Toon shading');
      k.num(R(338, 702, 372, 710), 'Eint: ', r, 'edgeint', 0, 255, 1, 0, 'Sets edge intensity for Toon shading');
      k.tog(R(338, 712, 372, 720), 'Shift', m, 'edgeShift', 'For unified renderer: use old offsets for edges');
      k.tog(R(338, 722, 372, 730), 'All', m, 'edgeAll', 'For unified renderer: also consider transparent faces for toon shading');
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const idx = j * 3 + i;
        const bx = 207 + i * 9, by = 714 + j * 6;
        const b = k.row(R(bx, by, bx + 8, by + 5), '', r, 'winpos', idx, 'Render window placement on screen');
        b.flat = true;
      }
      k.row(R(240, 714, 277, 722), 'DispView', r, 'dispwin', false, 'Sets render output to display in 3D view');
      k.row(R(240, 724, 277, 731), 'DispWin', r, 'dispwin', true, 'Sets render output to display in a seperate window');
      k.tog(R(284, 724, 331, 731), 'Extensions', m, 'extensions', 'Adds extensions to the output when rendering animations');
      k.but(R(374, 641, 468, 658), 'RENDER', () => B.Render.render(ctx), 'Start the rendering', COL.SALMON);
      k.tog(R(374, 669, 435, 677), 'OSA', m, 'osa', 'Enables Oversampling (Anti-aliasing)');
      k.tog(R(438, 669, 467, 677), 'MBLUR', m, 'mblur', 'Enables Motion Blur calculation');
      [[5, 374, 390], [8, 391, 407], [11, 408, 422], [16, 423, 438]].forEach(([v, a, b]) => k.row(R(a, 681, b, 689), String(v), r, 'osa', v, 'Sets oversample level to ' + v));
      k.num(R(440, 681, 468, 689), 'Bf: ', r, 'blurfac', 0.01, 5, 0.1, 3, 'Sets motion blur factor');
      k.num(R(374, 701, 422, 712), 'Xparts: ', r, 'xparts', 1, 64, 1, 0, 'Sets the number of horizontal parts to render image in (For panorama sets number of camera slices)');
      k.num(R(425, 701, 468, 712), 'Yparts: ', r, 'yparts', 1, 64, 1, 0, 'Sets the number of vertical parts to render image in');
      k.row(R(374, 721, 392, 729), 'Sky', r, 'alphamode', 'sky', 'Fill background with sky');
      k.row(R(395, 721, 422, 729), 'Premul', r, 'alphamode', 'premul', 'Multiply alpha in advance');
      k.row(R(424, 721, 445, 729), 'Key', r, 'alphamode', 'key', 'Alpha and colour values remain unchanged');
      k.tog(R(472, 643, 532, 651), 'Shadows', m, 'shadow', 'Enable shadow calculation');
      k.tog(R(472, 654, 532, 662), 'Panorama', m, 'panorama', 'Enable panorama rendering (output width is multiplied by Xparts)');
      k.row(R(472, 669, 532, 677), '100%', r, 'size', 100, 'Set render size to defined size');
      k.row(R(472, 681, 488, 689), '75%', r, 'size', 75, 'Set render size to 3/4 of defined size');
      k.row(R(490, 681, 507, 689), '50%', r, 'size', 50, 'Set render size to 1/2 of defined size');
      k.row(R(509, 681, 532, 689), '25%', r, 'size', 25, 'Set render size to 1/4 of defined size');
      k.tog(R(472, 701, 518, 712), 'Fields', m, 'fields', 'Enables field rendering');
      k.tog(R(520, 699, 532, 705), 'Odd', m, 'odd', 'Enables Odd field first rendering (Default: Even field)');
      k.tog(R(520, 706, 532, 712), 'x', m, 'notimediff', 'Disables time difference in field calculations');
      k.tog(R(472, 721, 500, 729), 'Border', m, 'border', 'Render a small cut-out of the image');
      k.tog(R(502, 721, 532, 729), 'Gamma', m, 'gamma', 'Enable gamma correction');
      k.but(R(536, 641, 630, 664), 'ANIM', () => B.Render.renderAnim(ctx), 'Start rendering a sequence', COL.SALMON);
      k.tog(R(536, 669, 630, 680), 'Do Sequence', r, 'doSequence', 'Enables sequence output rendering (Default: 3D rendering)', COL.PURPLE);
      k.but(R(536, 681, 630, 692), 'Render Daemon', () => B.UI.notice(ctx, 'Render Daemon: no network render queue'), 'Render Daemon', COL.PURPLE);
      k.but(R(536, 701, 581, 712), 'PLAY', () => B.Render.playAnim(ctx), 'Play animation of rendered images/avi (searches Pics: field)');
      k.num(R(584, 701, 630, 712), 'rt: ', r, 'rt', -1000, 1000, 1, 0, 'General testing/debug button');
      k.num(R(536, 721, 581, 729), 'Sta: ', r, 'sfra', 1, 18000, 1, 0, 'The start frame of the animation', () => { if (r.efra < r.sfra) r.efra = r.sfra; });
      k.num(R(584, 721, 630, 729), 'End: ', r, 'efra', 1, 18000, 1, 0, 'The end  frame of the animation', () => { if (r.efra < r.sfra) r.sfra = r.efra; });
      k.num(R(636, 643, 691, 653), 'SizeX: ', r, 'xsch', 4, 10000, 1, 0, 'The image width in pixels');
      k.num(R(694, 643, 749, 653), 'SizeY: ', r, 'ysch', 4, 10000, 1, 0, 'The image height in scanlines');
      k.num(R(636, 659, 691, 667), 'AspX: ', r, 'xasp', 1, 200, 1, 0, 'The horizontal aspect ratio');
      k.num(R(694, 659, 749, 667), 'AspY: ', r, 'yasp', 1, 200, 1, 0, 'The vertical aspect ratio');
      k.row(R(636, 676, 666, 684), 'AVI raw', r, 'imtype', 'avi_raw', 'Images are saved in an uncompress AVI');
      k.row(R(668, 676, 697, 684), 'AVI jpg', r, 'imtype', 'avi_jpg', 'Images are saved in an MJPEG compressed AVI');
      k.num(R(700, 676, 749, 684), 'Frs/sec: ', r, 'frs_sec', 1, 120, 1, 0, 'Frames per second, for AVI and Sequence window grid');
      k.row(R(636, 686, 666, 694), 'Targa', r, 'imtype', 'targa', 'Images are saved in a RLE compressed TGA');
      k.row(R(668, 686, 697, 694), 'TgaRaw', r, 'imtype', 'tgaraw', 'Images are saved in an uncompressed TGA');
      k.row(R(700, 686, 719, 694), 'Iris', r, 'imtype', 'iris', 'Images are saved in SGI IRIS format');
      k.row(R(636, 696, 662, 704), 'HamX', r, 'imtype', 'hamx', 'Images are saved in HamX format');
      k.row(R(664, 696, 692, 704), 'Ftype', r, 'imtype', 'ftype', 'Images are saved in the format of the Ftype image');
      k.row(R(694, 696, 719, 704), 'JPEG', r, 'imtype', 'jpeg', 'Images are saved in JPEG format');
      k.num(R(636, 707, 673, 715), 'Quality: ', r, 'quality', 10, 100, 1, 0, 'Quality setting for JPEG images');
      k.tog(R(723, 708, 749, 716), 'Crop', m, 'crop', 'Crop the border image to the border size', COL.GREEN);
      k.row(R(636, 721, 657, 729), 'BW', r, 'planes', 'bw', 'Images are saved with BW (grayscale) data');
      k.row(R(659, 721, 686, 729), 'RGB', r, 'planes', 'rgb', 'Images are saved with RGB (color) data');
      k.row(R(688, 721, 718, 729), 'RGBA', r, 'planes', 'rgba', 'Images are saved with RGB and Alpha data (if supported)');
      k.row(R(721, 721, 749, 729), 'IRIZ', r, 'planes', 'iriz', 'Images are saved as Iris with 32 bits ZBuffer');
      const P = (yt, yb, s, p) => k.but(R(763, yt, 829, yb), s, () => { presets(r, p); ctx.redrawAll(); }, s);
      P(643, 650, 'PAL', 'pal'); P(653, 660, 'Default', 'def'); P(670, 677, 'Preview', 'preview'); P(680, 687, 'PC', 'pc');
      P(690, 697, 'PAL 16:9', 'pal169'); P(700, 707, 'PANO', 'pano'); P(710, 717, 'FULL', 'full');
      k.tog(R(763, 720, 829, 728), 'Unified Render', m, 'unified', 'Use the unified renderer');
    }
  };
  B.DisplayPresets = presets;
})(globalThis.B204 = globalThis.B204 || {});
