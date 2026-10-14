(function (B) {
  'use strict';

  const K = (key, mods) => Object.assign({ key, shift: false, ctrl: false, alt: false }, mods || {});
  const S = { shift: true }, C = { ctrl: true }, A = { alt: true };

  function prim(ctx, kind) {
    const UI = B.UI;
    const go = opts => B.Edit.addPrimitive(ctx, kind, opts);
    const ask = (label, def, min, max) => UI.button(ctx, label, def, min, max, 0);
    const st = ctx.G.primDefaults || (ctx.G.primDefaults = { verts: 32, segments: 32, rings: 32, subdiv: 2, xres: 32, yres: 32 });
    if (kind === 'circle' || kind === 'cylinder' || kind === 'tube' || kind === 'cone') {
      ask('Vertices:', st.verts, 3, 500).then(v => { if (v != null) { st.verts = v; go({ verts: v }); } });
    } else if (kind === 'uvsphere') {
      ask('Segments:', st.segments, 3, 500).then(s => {
        if (s == null) return;
        st.segments = s;
        ask('Rings:', st.rings, 3, 500).then(r => { if (r != null) { st.rings = r; go({ segments: s, rings: r }); } });
      });
    } else if (kind === 'icosphere') {
      ask('Subdivision:', st.subdiv, 1, 5).then(v => { if (v != null) { st.subdiv = v; go({ subdiv: v }); } });
    } else if (kind === 'grid') {
      ask('X res:', st.xres, 2, 100).then(x => {
        if (x == null) return;
        st.xres = x;
        ask('Y res:', st.yres, 2, 100).then(y => { if (y != null) { st.yres = y; go({ xres: x, yres: y }); } });
      });
    } else go({});
  }

  function addSimple(ctx, type) {
    if (ctx.G.obedit) B.Edit.exit(ctx, true);
    const names = { empty: 'Empty', camera: 'Camera', lamp: 'Lamp' };
    B.ObjectOps.addObject(ctx, type, names[type]);
  }

  function addExtra(ctx, type, sub) {
    if (B.ObTypes && B.ObTypes[type] && B.ObTypes[type].add) B.ObTypes[type].add(ctx, sub);
    else B.UI.error(ctx, 'Not implemented yet');
  }

  function pages(ctx) {
    const dupMesh = { name: 'Duplicate', ev: K('D', S) };
    return [
      { name: 'ADD', items: [
        { name: 'Mesh', items: [
          { name: 'Plane', fn: () => prim(ctx, 'plane') }, { name: 'Cube', fn: () => prim(ctx, 'cube') }, { name: 'Circle', fn: () => prim(ctx, 'circle') },
          { name: 'UVsphere', fn: () => prim(ctx, 'uvsphere') }, { name: 'Icosphere', fn: () => prim(ctx, 'icosphere') }, { name: 'Cylinder', fn: () => prim(ctx, 'cylinder') },
          { name: 'Tube', fn: () => prim(ctx, 'tube') }, { name: 'Cone', fn: () => prim(ctx, 'cone') }, { name: 'Grid', fn: () => prim(ctx, 'grid') }, dupMesh
        ] },
        { name: 'Curve', items: [
          { name: 'Bezier Curve', fn: () => addExtra(ctx, 'curve', 'bezier') }, { name: 'Bezier Circle', fn: () => addExtra(ctx, 'curve', 'bezcircle') },
          { name: 'Nurbs Curve', fn: () => addExtra(ctx, 'curve', 'nurbs') }, { name: 'Nurbs Circle', fn: () => addExtra(ctx, 'curve', 'nurbcircle') },
          { name: 'Path', fn: () => addExtra(ctx, 'curve', 'path') }, dupMesh
        ] },
        { name: 'Surface', items: [
          { name: 'Curve', fn: () => addExtra(ctx, 'surf', 'curve') }, { name: 'Circle', fn: () => addExtra(ctx, 'surf', 'circle') },
          { name: 'Surface', fn: () => addExtra(ctx, 'surf', 'surface') }, { name: 'Tube', fn: () => addExtra(ctx, 'surf', 'tube') },
          { name: 'Sphere', fn: () => addExtra(ctx, 'surf', 'sphere') }, { name: 'Donut', fn: () => addExtra(ctx, 'surf', 'donut') }, dupMesh
        ] },
        { name: 'Text', fn: () => addExtra(ctx, 'font') },
        { name: 'MetaBall', fn: () => addExtra(ctx, 'mball', 'ball') },
        { name: 'Empty', key: 'A', fn: () => addSimple(ctx, 'empty') },
        { sep: true },
        { name: 'Camera', key: 'A', fn: () => addSimple(ctx, 'camera') },
        { name: 'Lamp', key: 'A', fn: () => addSimple(ctx, 'lamp') },
        { name: 'Ika', key: 'A', fn: () => addExtra(ctx, 'ika') },
        { sep: true }, { sep: true }, { sep: true },
        { name: 'Lattice', key: 'A', fn: () => addExtra(ctx, 'lattice') }
      ] },
      { name: 'VIEW', items: [
        { name: 'Centre', key: 'c', ev: K('C') }, { name: 'Home', key: 'home', ev: K('HOME') }, { name: 'Zbuffer', key: 'z', ev: K('Z') },
        { sep: true },
        { name: 'Front', key: 'pad1', ev: K('PAD1') }, { name: 'Right', key: 'pad3', ev: K('PAD3') }, { name: 'Top', key: 'pad7', ev: K('PAD7') }, { name: 'Camera', key: 'pad0', ev: K('PAD0') },
        { name: 'Persp/Ortho', key: 'pad5', ev: K('PAD5') }, { name: 'Local View', key: 'pad/', ev: K('PADSLASH') }
      ] },
      { name: 'EDIT', items: [
        { name: 'Grabber', key: 'g', ev: K('G') }, { name: 'Rotate', key: 'r', ev: K('R') }, { name: 'Size', key: 's', ev: K('S') },
        { name: 'Shear', key: 'c|s', ev: K('S', C) }, { name: 'Warp/bend', key: 's|w', ev: K('W', S) }, { name: 'Snapmenu', key: 's|s', ev: K('S', S) },
        { sep: true }, { name: '(De)sel All', key: 'a', ev: K('A') }, { name: 'BorderSelect', key: 'b', ev: K('B') },
        { sep: true }, { name: 'Quit', key: 'q', fn: () => ctx.quit() }
      ] },
      { name: 'OBJECT', items: [
        { name: 'Clear size', key: 'a|s', ev: K('S', A) }, { name: 'Clear rotation', key: 'a|r', ev: K('R', A) }, { name: 'Clear location', key: 'a|g', ev: K('G', A) },
        { name: 'Clear origin', key: 'a|o', ev: K('O', A) }, { name: 'Make Parent', key: 'c|p', ev: K('P', C) }, { name: 'Clear Parent', key: 'a|p', ev: K('P', A) },
        { name: 'Make Track', key: 'c|t', ev: K('T', C) }, { name: 'Clear Track', key: 'a|t', ev: K('T', A) },
        { name: 'Image Displist', key: 'c|d', fn: () => ctx.redrawAll() }, { name: 'Image Aspect', key: 'a|v', fn: () => B.Shading && B.Shading.imageAspect(ctx) }
      ] },
      { name: 'OBJECT', items: [
        { name: 'EditMode', key: 'Tab', ev: K('TAB') }, { name: 'Move To Layer', key: 'm', ev: K('M') }, { name: 'Delete', key: 'x', ev: K('X') },
        { name: 'Delete All', key: 'c|x', fn: () => B.FileOps.eraseAll(ctx) }, { name: 'Apply Size/Rot', key: 'c|a', ev: K('A', C) },
        { name: 'Apply Deform', key: 'c|A', fn: () => B.Lattice && B.Lattice.applyDeform(ctx) }, { name: 'Join', key: 'c|j', ev: K('J', C) },
        { name: 'make local', key: 'l', ev: K('L') }, { name: 'select Links', key: 's|l', ev: K('L', S) }, { name: 'make Links', key: 'c|l', ev: K('L', C) },
        { name: 'Copy menu', key: 'c|c', ev: K('C', C) }, { name: 'Convert menu', key: 'a|c', ev: K('C', A) }
      ] },
      { name: 'MESH', items: [
        { name: 'Select Linked', key: 'l', ev: K('L') }, { name: 'Deselect Linked', key: 's|l', ev: K('L', S) }, { name: 'Extrude', key: 'e', ev: K('E') },
        { name: 'Delete Menu', key: 'x', ev: K('X') }, { name: 'Make edge/face', key: 'f', ev: K('F') }, { name: 'Fill', key: 's|f', ev: K('F', S) },
        { name: 'Split', key: 'y', ev: K('Y') }, { name: 'Undo/reload', key: 'u', ev: K('U') }, { name: 'Calc Normals', key: 'c|n', ev: K('N', C) },
        { name: 'Separate', key: 'p', ev: K('P') }, { name: 'Write Videosc', key: 'a|w', fn: () => B.FileOps.saveVideoscape(ctx) }
      ] },
      { name: 'CURVE', items: [
        { name: 'Select Linked', key: 'l', ev: K('L') }, { name: 'Deselect Link', key: 's|l', ev: K('L', S) }, { name: 'Extrude', key: 'e', ev: K('E') },
        { name: 'Delete Menu', key: 'x', ev: K('X') }, { name: 'Make Segment', key: 'f', ev: K('F') }, { name: 'Cyclic', key: 'c', ev: K('C') },
        { name: 'SelectRow', key: 's|r', ev: K('R', S) }, { name: 'Calc Handle', key: 'h', ev: K('H') }, { name: 'Auto Handle', key: 's|h', ev: K('H', S) },
        { name: 'Vect Handle', key: 'v', ev: K('V') }, { name: 'Specials', key: 'w', ev: K('W') }
      ] },
      { name: 'KEY', items: [
        { name: 'Insert', key: 'i', ev: K('I') }, { name: 'Show', key: 'k', ev: K('K') }, { name: 'Next', key: 'PageUp', ev: K('PAGEUP') },
        { name: 'Prev', key: 'PageDn', ev: K('PAGEDOWN') }, { name: 'Show+sel', key: 's|k', ev: K('K', S) }
      ] },
      { name: 'RENDER', items: [
        { name: 'RenderWindow', key: 'F11', fn: () => B.Render.toggleWindow(ctx) }, { name: 'Render', key: 'F12', fn: () => B.Render.render(ctx) },
        { name: 'Set Border', key: 's|b', ev: K('B', S) }, { name: 'Image Zoom', key: 'c|b', fn: () => B.Render.toggleWindow(ctx) }
      ] },
      { name: 'FILE', items: [
        { name: 'Load File As', key: 'F1', fn: () => B.FileOps.open(ctx) }, { name: 'Load Last', key: 'c|o', fn: () => B.FileOps.reopen(ctx) },
        { name: 'Append File', key: 'shift+F1', fn: () => B.FileOps.append(ctx) }, { name: 'Save File as', key: 'F2', fn: () => B.FileOps.saveAs(ctx) },
        { name: 'Save', key: 'c|w', fn: () => B.FileOps.save(ctx) }, { name: 'Save Image', key: 'F3', fn: () => B.FileOps.saveImage(ctx) },
        { name: 'Save VRML', key: 'c|F2', fn: () => B.FileOps.saveVRML(ctx) }, { name: 'Save DXF', key: 'shift+F2', fn: () => B.FileOps.saveDXF(ctx) },
        { name: 'Save VideoScape', key: 'a|w', fn: () => B.FileOps.saveVideoscape(ctx) }, { name: 'Quit Blender', key: 'q', fn: () => ctx.quit() }
      ] }
    ];
  }

  function open(ctx, area) {
    const ps = pages(ctx);
    const mouse = ctx.mouse.slice();
    B.UI.toolbox(ctx, ps, ctx.G.toolboxPage || 0).then(it => {
      if (!it) return;
      const pi = ps.findIndex(p => p.items.includes(it) || p.items.some(s => s.items && s.items.includes(it)));
      if (pi >= 0) ctx.G.toolboxPage = pi;
      if (it.fn) { it.fn(); return; }
      if (it.ev) {
        ctx.mouse = mouse;
        const ev = Object.assign({ type: 'key', x: mouse[0], y: mouse[1], char: '' }, it.ev);
        if (!B.SPACES.view3d.event(ctx, area, ev)) ctx.globalKeyLate(ev, area);
      }
    });
  }

  B.Toolbox = { open, pages, prim };
})(globalThis.B204 = globalThis.B204 || {});
