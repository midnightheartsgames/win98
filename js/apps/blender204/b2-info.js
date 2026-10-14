(function (B) {
  'use strict';
  const rgb = B.rgb;
  const COL = B.UI.COL;

  function fileMenu(ctx) {
    const F = B.FileOps;
    return [
      { str: 'New', key: 'Ctrl X', func: () => F.eraseAll(ctx) },
      { str: 'Open', key: 'F1', func: () => F.open(ctx) },
      { str: 'Reopen last', key: 'Ctrl O', func: () => F.reopen(ctx) },
      { str: 'Append', key: 'Shift F1', func: () => F.append(ctx) },
      { sep: true },
      { str: 'Save as', key: 'F2', func: () => F.saveAs(ctx) },
      { str: 'Save', key: 'Ctrl W', func: () => F.save(ctx) },
      { str: 'Save Image', key: 'F3', func: () => F.saveImage(ctx) },
      { str: 'Save DXF', key: 'Shift F2', func: () => F.saveDXF(ctx) },
      { str: 'Save VRML', key: 'Ctrl F2', func: () => F.saveVRML(ctx) },
      { str: 'Save Videoscape', key: 'Alt W', func: () => F.saveVideoscape(ctx) },
      { sep: true },
      { str: 'Quit', key: 'Q', func: () => ctx.quit() }
    ];
  }

  function view3dArea(ctx) {
    return ctx.screen.areas.find(a => a.type === 'view3d' && a === ctx.lastView3d) || ctx.screen.areas.find(a => a.type === 'view3d');
  }

  function fakeKey(ctx, key, mods) {
    const area = view3dArea(ctx);
    if (!area) return;
    const ev = Object.assign({ type: 'key', key, char: key.length === 1 ? key.toLowerCase() : '', shift: false, ctrl: false, alt: false, x: (area.win.x1 + area.win.x2) / 2, y: (area.win.y1 + area.win.y2) / 2 }, mods || {});
    ctx.mouse = [ev.x, ev.y];
    B.SPACES.view3d.event(ctx, area, ev);
    ctx.redrawAll();
  }

  function editMenu(ctx) {
    return [
      { str: '(De)Select All', key: 'a', func: () => fakeKey(ctx, 'A') },
      { str: 'Borderselect', key: 'b', func: () => fakeKey(ctx, 'B') },
      { sep: true },
      { str: 'Add', key: 'Space', func: () => fakeKey(ctx, 'SPACE') },
      { str: 'Copy', key: 'Shift D', func: () => fakeKey(ctx, 'D', { shift: true }) },
      { str: 'Delete', key: 'x', func: () => fakeKey(ctx, 'X') },
      { sep: true },
      { str: 'Edit Mode', key: 'Tab', func: () => fakeKey(ctx, 'TAB') },
      { str: 'Grabber', key: 'G', func: () => fakeKey(ctx, 'G') },
      { str: 'Rotate', key: 'R', func: () => fakeKey(ctx, 'R') },
      { str: 'Scale', key: 'S', func: () => fakeKey(ctx, 'S') }
    ];
  }

  function viewMenu(ctx) {
    return [
      { str: 'Front', key: 'NumPad 1', func: () => fakeKey(ctx, 'PAD1') },
      { str: 'Right', key: 'NumPad 3', func: () => fakeKey(ctx, 'PAD3') },
      { str: 'Top', key: 'NumPad 7', func: () => fakeKey(ctx, 'PAD7') },
      { str: 'Camera', key: 'NumPad 0', func: () => fakeKey(ctx, 'PAD0') },
      { sep: true },
      { str: 'Zoom in', key: 'NumPad +', func: () => fakeKey(ctx, 'PADPLUS') },
      { str: 'Zoom out', key: 'NumPad -', func: () => fakeKey(ctx, 'PADMINUS') },
      { sep: true },
      { str: 'Center', key: 'c', func: () => fakeKey(ctx, 'C') },
      { str: 'ViewAll', key: 'Home', func: () => fakeKey(ctx, 'HOME') }
    ];
  }

  function toolsMenu(ctx) {
    const F = B.FileOps;
    return [
      { str: 'Pack Data', func: () => F.packAll(ctx) },
      { str: 'Unpack Data to current dir', func: () => F.unpackAll(ctx) },
      { str: 'Advanced Unpack', func: () => F.advancedUnpack(ctx) }
    ];
  }

  function browseScreens(ctx) {
    const list = ctx.main.screensUI;
    const str = 'SCREEN %t|' + list.map((s, i) => `${s.name} %x${i}`).join('|') + '|ADD NEW %x32767';
    B.UI.pupmenu(ctx, str, { current: list.indexOf(ctx.screen) }).then(v => {
      if (v == null || v < 0) return;
      if (v === 32767) {
        const s = B.cloneScreen(ctx.screen, ctx.raster.w, ctx.raster.h);
        s.name = uniqueScreenName(list, ctx.screen.name);
        list.push(s);
        ctx.setScreen(s);
      } else ctx.setScreen(list[v]);
    });
  }

  function uniqueScreenName(list, base) {
    const stem = base.replace(/\.\d{3}$/, '');
    for (let i = 1; i < 999; i++) {
      const n = stem + '.' + String(i).padStart(3, '0');
      if (!list.some(s => s.name === n)) return n;
    }
    return stem + '.x';
  }

  function browseScenes(ctx) {
    const list = ctx.main.scenes;
    const str = 'SCENE %t|' + list.map((s, i) => `${s.name} %x${i}`).join('|') + '|ADD NEW %x32767';
    B.UI.pupmenu(ctx, str, { current: list.indexOf(ctx.scene) }).then(v => {
      if (v == null || v < 0) return;
      if (v === 32767) {
        B.UI.pupmenu(ctx, 'Add scene%t|Empty%x0|Link Objects%x1|Link ObData%x2|Full Copy%x3').then(m => {
          if (m == null || m < 0) return;
          B.SceneOps.addScene(ctx, m);
        });
      } else B.SceneOps.setScene(ctx, list[v]);
    });
  }

  function header(ctx, area, blk) {
    const b = blk.iconrow([0, 0], B.SPACE_ORDER.length, 6, 0, 21, 22, () => B.SPACE_ORDER.indexOf(area.type), v => ctx.setSpaceType(area, B.SPACE_ORDER[v]), 'Current window type');
    b.icons = B.SPACE_ORDER.map((_, i) => [i, 0]);
    const hdr = area.hdr;
    const menus = [['File', 44, fileMenu], ['Edit', 84, editMenu], ['View', 120, viewMenu], ['Tools', 158, toolsMenu]];
    menus.forEach(([name, x, fn]) => {
      const m = blk.label(name, x, 1, 38, 20);
      m.func = () => {
        const mx = blk.px(x) - 4;
        B.UI.pulldown(ctx, fn(ctx), mx, hdr.y1 - 1);
      };
      m.font = 'helv12';
    });
    const browse = blk.icon([0, 4], 212, 0, 21, 22, () => browseScreens(ctx), 'Browse Datablock');

    browse.icon = null;
    browse.str = '';
    browse.minusIcon = true;
    blk.tex('SCR:', 232, 0, 121, 22, () => ctx.screen.name, v => { ctx.screen.name = String(v).slice(0, 19) || ctx.screen.name; }, 19, 'Screen name');
    blk.icon([0, 4], 352, 0, 21, 22, () => B.UI.okee(ctx, 'Delete current screen').then(ok => { if (ok) B.deleteScreen(ctx); }), 'Delete current screen');
    const browse2 = blk.icon([0, 4], 377, 0, 21, 22, () => browseScenes(ctx), 'Browse Datablock');
    browse2.icon = null;
    browse2.minusIcon = true;
    blk.tex('SCE:', 397, 0, 122, 22, () => ctx.scene.name, v => ctx.main.rename(ctx.scene, v), 19, 'Scene name');
    blk.icon([0, 4], 518, 0, 21, 22, () => B.UI.okee(ctx, 'Delete current scene').then(ok => { if (ok) B.SceneOps.deleteScene(ctx); }), 'Delete current scene');
    const logo = blk.but('', 538, 0, 136, 22, () => ctx.showSplash(), 'Blender 2.04');
    logo.logo = true;
    const help = blk.icon([0, 5], 0, 0, 21, 22, () => { if (B.openHelp) B.openHelp(ctx); }, 'Help');
    help.x = Math.round((hdr.x2 - hdr.x1 + 1) - 20 - 0) + (area.space.hdrScroll || 0);
    blk.extraDraw = r => {
      const lx1 = blk.px(538), lx2 = blk.px(674);
      r.pushClip(lx1, hdr.y1, lx2, hdr.y2 - 1);
      r.rect(lx1, hdr.y1 + 1, lx2 + 1, hdr.y2, rgb(178, 82, 98));
      r.icon(0, 9, lx1 + 5, hdr.y1 + 3, rgb(178, 82, 98));
      r.text('helv10', 'www.blender.nl', lx1 + 24, hdr.y1 + 7, rgb(0, 0, 0));
      r.text('helv10', '204', lx1 + 114, hdr.y1 + 7, rgb(0, 0, 0));
      r.popClip();
      const ob = ctx.scene.basact ? ctx.scene.basact.object : null;
      const s = ctx.stats() + (ob ? ob.name : '');
      const sx = blk.px(690);
      const maxw = blk.px(help.x) - sx - 6;
      r.text('helv10', B.UI.fitTextEnd('helv10', s, maxw), sx, hdr.y1 + 7, rgb(0, 0, 0));
    };
  }

  function drawHeaderExtras(blk) { if (blk.extraDraw) blk.extraDraw(blk.r); }

  function prefsDraw(ctx, area, r) {
    const w = area.win;
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, rgb(144, 144, 144));
    const p = ctx.prefs;
    const blk = new B.UI.Block(r, { ox: w.x1 + 10, oy: w.y2 - 30, font: 'helv8', area });
    blk.col = COL.GREY;
    const T = (str, x, y, wd, key, tip) => blk.tog(str, x, y, wd, 18, () => !!p[key], v => { p[key] = !!v; B.savePrefs && B.savePrefs(p); }, tip);
    T('Auto Temp Save', 0, 0, 120, 'autoTempSave', 'Enables/Disables the automatic temp. file saving');
    blk.tex('Dir:', 125, 0, 160, 18, () => p.tempDir || 'C:\\WINDOWS\\TEMP\\', v => { p.tempDir = v; }, 79, 'The directory for temp. files');
    blk.num('Time:', 290, 0, 80, 18, () => p.tempTime || 2, v => { p.tempTime = v; }, 1, 60, 1, 0, 'The time in minutes to wait between temp. saves');
    blk.but('Load Temp', 375, 0, 80, 18, () => B.FileOps && B.FileOps.loadTemp(ctx), 'Loads the most recently saved temp file');
    blk.num('Versions:', 460, 0, 90, 18, () => p.versions, v => { p.versions = v; B.savePrefs && B.savePrefs(p); }, 0, 32, 1, 0, 'The number of old versions to maintain when saving');
    T('Scene Global', 0, -22, 120, 'sceneGlobal', 'Forces the current Scene to be displayed in all Screens');
    T('TrackBall', 125, -22, 80, 'trackball', 'Switches between trackball and turntable view rotation methods (MiddleMouse)');
    T('2-Mouse', 210, -22, 80, 'twoMouse', 'Maps ALT+LeftMouse to MiddleMouse button');
    T('Mat on Obj', 295, -22, 80, 'matOnOb', 'Sets whether Material data is linked to Obj or ObjData');
    T('NoCapsLock', 380, -22, 80, 'noCapsLock', 'Deactives the CapsLock button (only applies to text input)');
    T('ToolTips', 465, -22, 85, 'tooltips', 'Enables/Disables tooltips');
    T('Grab Grid', 0, -44, 80, 'grabGrid', 'Changes default step mode for grabbing');
    T('Rot Grid', 85, -44, 80, 'rotGrid', 'Changes default step mode for rotation');
    T('Size Grid', 170, -44, 80, 'sizeGrid', 'Changes default step mode for scaling');
    T('Dupli Mesh', 255, -44, 80, 'dupliMesh', 'Causes Mesh data to be duplicated with SHIFT+D');
    T('Lamp', 340, -44, 50, 'dupliLamp', 'Causes Lamp data to be duplicated with SHIFT+D');
    T('Material', 395, -44, 70, 'dupliMat', 'Causes Material data to be duplicated with SHIFT+D');
    T('Ipo', 470, -44, 40, 'dupliIpo', 'Causes Ipo data to be duplicated with SHIFT+D');
    blk.tex('Fonts:', 0, -66, 180, 18, () => p.fontDir || '//fonts/', v => { p.fontDir = v; }, 79, 'The default directory to search when loading fonts');
    blk.tex('Render:', 185, -66, 180, 18, () => p.renderDir || '//render/', v => { p.renderDir = v; }, 79, 'The default directory to choose for rendering');
    blk.tex('Textures:', 370, -66, 180, 18, () => p.texDir || '//textures/', v => { p.texDir = v; }, 79, 'The default directory to search when loading textures');
    blk.draw();
    area.winBlock = blk;
  }

  B.SPACES.info = {
    name: 'Info', headerTop: true,
    init: () => ({}),
    draw: (ctx, area, r) => prefsDraw(ctx, area, r),
    header: (ctx, area, blk) => { header(ctx, area, blk); blk.postDraw = () => drawHeaderExtras(blk); },
    event: () => false
  };

  B.InfoMenus = { fileMenu, editMenu, viewMenu, toolsMenu };
})(globalThis.B204 = globalThis.B204 || {});
