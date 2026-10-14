(function (B) {
  'use strict';
  const V = B.V, M = B.M, rgb = B.rgb;
  const COL = B.UI.COL;
  const L = B.Buts.LAYOUTS;
  const { frame, kit } = B.ButsKit;

  const SENSORS = { 0: 'always', 3: 'keyboard', 1: 'touch', 6: 'collision', 2: 'near', 7: 'radar', 4: 'property', 5: 'mouse' };
  const CONTROLLERS = { 0: 'and', 1: 'or', 2: 'expression', 3: 'python' };
  const ACTUATORS = { 0: 'object', 9: 'constraint', 1: 'ipo', 3: 'camera', 5: 'sound', 6: 'property', 10: 'editobject', 11: 'scene' };
  const NAMES = { always: 'Always', keyboard: 'Keyboard', touch: 'Touch', collision: 'Collision', near: 'Near', radar: 'Radar', property: 'Property', mouse: 'Mouse', and: 'AND', or: 'OR', expression: 'Expression', python: 'Python', object: 'Object', constraint: 'Constraint', ipo: 'Ipo', camera: 'Camera', sound: 'Sound', editobject: 'Edit Object', scene: 'Scene' };

  let brickId = 1;
  function nid(main) { main.brickCounter = (main.brickCounter || 0) + 1; return 'b' + main.brickCounter + '_' + (brickId++); }

  function newSensor(main, type) {
    const s = { id: nid(main), kind: 'sensor', type, name: 'sensor', show: true, pulse: false, pulseOff: false, freq: 0, links: [] };
    if (type === 'keyboard') Object.assign(s, { key: '', mod1: '', mod2: '', allkeys: false, hold: false });
    if (type === 'touch') s.material = '';
    if (type === 'collision') Object.assign(s, { prop: '', usemat: false, material: '' });
    if (type === 'near') Object.assign(s, { prop: '', dist: 1, reset: 2 });
    if (type === 'radar') Object.assign(s, { prop: '', axis: 'Y', angle: 30, dist: 10 });
    if (type === 'property') Object.assign(s, { ptype: 'equal', prop: '', value: '', min: '', max: '' });
    if (type === 'mouse') s.button = 'left';
    return s;
  }

  function newController(main, type) { return { id: nid(main), kind: 'controller', type, name: 'cont', show: true, expr: '', links: [] }; }

  function newActuator(main, type) {
    const a = { id: nid(main), kind: 'actuator', type, name: 'act', show: true };
    if (type === 'object') Object.assign(a, { force: [0, 0, 0], torque: [0, 0, 0], dloc: [0, 0, 0], drot: [0, 0, 0], linv: [0, 0, 0], angv: [0, 0, 0], local: { force: true, torque: true, dloc: true, drot: true, linv: true, angv: true }, addv: false });
    if (type === 'constraint') Object.assign(a, { limit: 'locx', min: -1, max: 1, damp: 0 });
    if (type === 'ipo') Object.assign(a, { mode: 'play', sta: 1, end: 10, prop: '', force: false, cycl: false, back: false });
    if (type === 'camera') Object.assign(a, { ob: '', height: 1, min: 4, max: 8, axis: 'Y' });
    if (type === 'sound') Object.assign(a, { sound: '', mode: 'play' });
    if (type === 'property') Object.assign(a, { mode: 'assign', prop: '', value: '', ob: '', fromProp: '' });
    if (type === 'editobject') Object.assign(a, { mode: 'add', ob: '', time: 0, me: '', d3: false, linv: [0, 0, 0] });
    if (type === 'scene') Object.assign(a, { mode: 'restart', scene: '', camera: '' });
    return a;
  }

  function keyName(k) { return k ? k.replace('ARROW', '') : ''; }

  function gameHeader(ctx, area, blk, x) {
    const ob = B.Buts.activeOb(ctx);
    x = Math.max(x, 546);
    if (!ob) return x;
    blk.col = COL.GREY;
    blk.tex('OB:', x - 10, 0, 140, 22, () => ob.name, v => { ctx.main.rename(ob, v); ctx.redrawAll(); }, 19, 'Active Object name');
    return x + 140;
  }

  function obsForColumn(ctx, sp, kind) {
    const f = sp.logicFilter || (sp.logicFilter = { sensor: { sel: true, act: true, link: false }, controller: { sel: true, act: true, link: false }, actuator: { sel: true, act: true, link: false } });
    const flt = f[kind];
    const act = B.Buts.activeOb(ctx);
    const list = [];
    ctx.scene.bases.forEach(b => {
      const ob = b.object;
      if ((flt.sel && b.sel) || (flt.act && ob === act)) { if (!list.includes(ob)) list.push(ob); }
    });
    if (flt.link) {
      const ids = new Set();
      list.forEach(ob => { ob.sensors.forEach(s => s.links.forEach(l => ids.add(l))); ob.controllers.forEach(c => { c.links.forEach(l => ids.add(l)); ids.add(c.id); }); });
      ctx.scene.bases.forEach(b => { const ob = b.object; const has = [...ob.sensors, ...ob.controllers, ...ob.actuators].some(br => ids.has(br.id) || (br.links || []).some(l => ids.has(l))); if (has && !list.includes(ob)) list.push(ob); });
    }
    return list;
  }

  function buildGame(ctx, blk, area) {
    const R = frame(190, 630, 100);
    const k = kit(ctx, blk, R);
    const ob = B.Buts.activeOb(ctx);
    if (!ob) return;
    const sp = area.space;
    const gf = ob.gameflag;
    k.tog(R(194, 637, 226, 644), 'Sector', gf, 'sector', 'All game elements should be in the Sector boundbox');
    k.tog(R(229, 637, 252, 644), 'Prop', gf, 'prop', 'An Object fixed within a sector');
    k.tog(R(255, 637, 289, 644), 'Actor', gf, 'actor', 'Objects that are evaluated by the engine ');
    let y = 647;
    if (gf.actor) {
      k.tog(R(194, y, 240, y + 7), 'Dynamic', gf, 'dynamic', 'Motion defined by laws of physics');
      if (gf.dynamic) {
        k.tog(R(242, y, 270, y + 7), 'Do Fh', gf, 'doFh', 'Use Fh settings in Materials');
        k.tog(R(272, y, 300, y + 7), 'Rot Fh', gf, 'rotFh', 'Use face normal to rotate Object');
        y += 10;
        k.num(R(194, y, 245, y + 7), 'Mass:', ob, 'mass', 0.01, 100, 0.1, 2, 'The mass of the Object');
        k.num(R(247, y, 300, y + 7), 'Size:', ob, 'inertia', 0.01, 10, 0.1, 2, 'Bounding sphere size');
        y += 10;
        k.num(R(194, y, 245, y + 7), 'Damp:', ob, 'damping', 0, 1, 0.01, 3, 'General movement damping');
        k.num(R(247, y, 300, y + 7), 'RotDamp:', ob, 'rdamping', 0, 1, 0.01, 3, 'General rotation damping');
      }
      y += 10;
    }
    y += 6;
    k.but(R(194, y, 364, y + 11), 'ADD property', () => { ob.props.push({ name: 'prop' + (ob.props.length + 1), type: 'int', value: 0, debug: false }); ctx.redrawAll(); }, 'Add a new property', COL.SALMON);
    y += 15;
    ob.props.forEach((p, i) => {
      k.but(R(194, y, 210, y + 8), 'Del', () => { ob.props.splice(i, 1); ctx.redrawAll(); }, 'Delete property');
      k.menu(R(212, y, 250, y + 8), 'Types %t|Bool %x0|Int %x1|Float %x2|String %x3|Timer %x5', () => ({ bool: 0, int: 1, float: 2, string: 3, timer: 5 })[p.type], v => { p.type = { 0: 'bool', 1: 'int', 2: 'float', 3: 'string', 5: 'timer' }[v]; p.value = p.type === 'string' ? '' : p.type === 'bool' ? false : 0; }, 'Property type');
      k.tex(R(252, y, 318, y + 8), 'Name:', () => p.name, v => { p.name = v; }, 'Property name', 31);
      if (p.type === 'bool') { k.row(R(320, y, 340, y + 8), 'True', p, 'value', true, 'True'); k.row(R(341, y, 360, y + 8), 'False', p, 'value', false, 'False'); }
      else if (p.type === 'string') k.tex(R(320, y, 360, y + 8), '', () => p.value, v => { p.value = v; }, 'Value');
      else k.num(R(320, y, 360, y + 8), '', p, 'value', -10000, 10000, p.type === 'int' ? 1 : 0.1, p.type === 'int' ? 0 : 2, 'Value');
      k.tog(R(362, y, 372, y + 8), 'D', p, 'debug', 'Print Debug info');
      y += 10;
    });
    const cols = [
      { kind: 'sensor', label: 'Sensors', lx: 378, sel: 432, bar: [372, 470], add: [472, 496], menu: 'Sensors %t|Always %x0|Keyboard %x3|Mouse %x5|Touch %x1|Collision %x6|Near %x2|Radar %x7|Property %x4', map: SENSORS, list: 'sensors', make: newSensor },
      { kind: 'controller', label: 'Controllers', lx: 527, sel: 586, bar: [522, 650], add: [652, 676], menu: 'Controllers   %t|AND %x0|OR %x1|Expression %x2|Python %x3', map: CONTROLLERS, list: 'controllers', make: newController },
      { kind: 'actuator', label: 'Actuators', lx: 702, sel: 762, bar: [702, 801], add: [802, 826], menu: 'Actuators  %t|Object %x0|Constraint %x9|Ipo %x1|Camera %x3|Sound %x5|Property %x6|Edit Object %x10|Scene %x11', map: ACTUATORS, list: 'actuators', make: newActuator }
    ];
    const dots = [];
    const f = sp.logicFilter || (sp.logicFilter = { sensor: { sel: true, act: true, link: false }, controller: { sel: true, act: true, link: false }, actuator: { sel: true, act: true, link: false } });
    cols.forEach(c => {
      k.label(c.lx, 637, c.label);
      k.tog(R(c.sel, 637, c.sel + 20, 644), 'Sel', f[c.kind], 'sel', 'Show all selected Objects');
      k.tog(R(c.sel + 20, 637, c.sel + 40, 644), 'Act', f[c.kind], 'act', 'Show active Object');
      k.tog(R(c.sel + 42, 637, c.sel + 64, 644), 'Link', f[c.kind], 'link', 'Show linked Objects to ' + (c.kind === 'controller' ? 'Sensor/Actuator' : 'Controller'));
      let yy = 652;
      obsForColumn(ctx, sp, c.kind).forEach(o => {
        const bar = blk.but(o.name, ...R(c.bar[0], yy, c.bar[1], yy + 7), () => { o['show_' + c.kind] = !o['show_' + c.kind]; ctx.redrawAll(); }, 'Object name, click to show/hide');
        bar.col = rgb(162, 152, 169);
        k.but(R(c.add[0], yy, c.add[1], yy + 7), 'Add', () => B.UI.pupmenu(ctx, c.menu).then(v => { if (v == null || v < 0) return; o[c.list].push(c.make(ctx.main, c.map[v])); o['show_' + c.kind] = false; ctx.redrawAll(); }), 'Add a new ' + c.label.slice(0, -1));
        yy += 11;
        if (o['show_' + c.kind]) return;
        o[c.list].forEach((br, i) => { yy = brick(ctx, blk, k, R, o, br, i, c, yy, dots); });
        yy += 4;
      });
    });
    area.logicDots = dots;
    blk.postDraw = () => {
      const r = blk.r;
      dots.forEach(d => {
        const x = blk.px(d.box[0]) + Math.round(d.box[2] * blk.scale / 2), yb = blk.py(d.box[1]) + Math.round(d.box[3] * blk.scale / 2);
        d.sx = x; d.sy = yb;
        r.rect(x - 3, yb - 3, x + 4, yb + 4, rgb(0, 0, 0));
        r.rect(x - 2, yb - 2, x + 3, yb + 3, d.side === 'out' ? rgb(255, 255, 160) : rgb(200, 200, 255));
      });
      const byId = new Map(dots.map(d => [d.br.id + d.side, d]));
      dots.forEach(d => {
        if (d.side !== 'out') return;
        (d.br.links || []).forEach(lid => {
          const t = byId.get(lid + 'in');
          if (t) { r.line(d.sx, d.sy, t.sx, t.sy, rgb(0, 0, 0)); r.line(d.sx, d.sy + 1, t.sx, t.sy + 1, rgb(0, 0, 0)); }
        });
      });
      if (area.linkDrag) { const ld = area.linkDrag; r.line(ld.x1, ld.y1, ld.x2, ld.y2, rgb(255, 255, 255)); }
    };
  }

  function brick(ctx, blk, k, R, o, br, i, c, yy, dots) {
    const x1 = c.bar[0], x2 = c.add[1];
    const list = o[c.list];
    const hx = R(x1, yy, x1 + 8, yy + 8);
    blk.icon([0, 4], ...hx, () => { removeBrick(ctx, o, c.list, i); ctx.redrawAll(); }, 'Delete ' + c.kind);
    k.menu(R(x1 + 10, yy, x1 + 50, yy + 8), c.menu, () => +Object.keys(c.map).find(key => c.map[key] === br.type), v => { const nb = c.make(ctx.main, c.map[v]); nb.id = br.id; nb.links = br.links || nb.links; nb.name = br.name; list[i] = nb; ctx.redrawAll(); }, c.kind + ' type');
    k.tex(R(x1 + 52, yy, x2 - 12, yy + 8), '', () => br.name, v => { br.name = v; }, c.kind + ' name', 31);
    blk.tog(br.show ? 'v' : '>', ...R(x2 - 10, yy, x2, yy + 8), () => br.show, v => { br.show = !!v; ctx.redrawAll(); }, c.kind + ' settings');
    if (c.kind !== 'sensor') dots.push({ br, ob: o, side: 'in', kind: c.kind, box: R(x1 - 9, yy, x1 - 2, yy + 8) });
    if (c.kind !== 'actuator') dots.push({ br, ob: o, side: 'out', kind: c.kind, box: R(x2 + 2, yy, x2 + 9, yy + 8) });
    yy += 10;
    if (!br.show) return yy;
    const W = x2 - x1;
    const row = () => { const r0 = yy; yy += 10; return r0; };
    const half = (a, s) => R(x1 + (a ? W / 2 + 1 : 0), yy, x1 + (a ? W : W / 2 - 1), yy + 8);
    if (c.kind === 'sensor') {
      k.tog(R(x1, yy, x1 + 30, yy + 8), 'Pulse', br, 'pulse', 'Set pulse mode');
      k.num(R(x1 + 32, yy, x2, yy + 8), 'f:', br, 'freq', 0, 50, 1, 0, 'Frequency of pulse (in 1/50 sec)');
      row();
      if (br.type === 'keyboard') {
        const kb = blk.but(br.allkeys ? 'All keys' : (keyName(br.key) || 'Press a key'), ...R(x1, yy, x1 + W * 0.6, yy + 8), () => captureKey(ctx, br, 'key'), 'Key code');
        kb.col = rgb(200, 200, 160);
        k.tog(R(x1 + W * 0.62, yy, x2, yy + 8), 'All keys', br, 'allkeys', 'Trigger on all keys');
        row();
        blk.but(br.mod1 ? keyName(br.mod1) : 'Hold', ...half(0), () => captureKey(ctx, br, 'mod1'), 'Modifier key code').col = rgb(200, 200, 160);
        blk.but(br.mod2 ? keyName(br.mod2) : 'Hold', ...half(1), () => captureKey(ctx, br, 'mod2'), 'Second modifier key code').col = rgb(200, 200, 160);
        row();
      } else if (br.type === 'touch') { k.tex(R(x1, yy, x2, yy + 8), 'MA:', () => br.material, v => { br.material = v; }, 'Only look for floors with this Material'); row(); }
      else if (br.type === 'collision' || br.type === 'near' || br.type === 'radar') {
        k.tex(R(x1, yy, x2, yy + 8), 'Property:', () => br.prop, v => { br.prop = v; }, 'Only look for Objects with this property'); row();
        if (br.type === 'near') { k.num(half(0), 'Dist', br, 'dist', 0, 1000, 0.1, 2, 'Trigger distance'); k.num(half(1), 'Reset', br, 'reset', 0, 1000, 0.1, 2, 'Reset distance'); row(); }
        if (br.type === 'radar') {
          ['X', 'Y', 'Z', '-X', '-Y', '-Z'].forEach((a, ai) => k.row(R(x1 + ai * W / 6, yy, x1 + (ai + 1) * W / 6 - 1, yy + 8), a, br, 'axis', a, 'Radar axis'));
          row();
          k.num(half(0), 'Ang:', br, 'angle', 1, 180, 1, 1, 'View angle'); k.num(half(1), 'Dist:', br, 'dist', 0, 1000, 0.1, 2, 'Trigger distance'); row();
        }
      } else if (br.type === 'property') {
        k.menu(R(x1, yy, x2, yy + 8), 'Type %t|Equal %x0|Not Equal %x1|Interval %x2|Changed %x3', () => ['equal', 'notequal', 'interval', 'changed'].indexOf(br.ptype), v => { br.ptype = ['equal', 'notequal', 'interval', 'changed'][v]; }, 'Type'); row();
        k.tex(R(x1, yy, x2, yy + 8), 'Prop: ', () => br.prop, v => { br.prop = v; }, 'Property name'); row();
        if (br.ptype === 'interval') { k.tex(half(0), 'Min: ', () => br.min, v => { br.min = v; }, 'test for value'); k.tex(half(1), 'Max: ', () => br.max, v => { br.max = v; }, 'test for max value'); row(); }
        else if (br.ptype !== 'changed') { k.tex(R(x1, yy, x2, yy + 8), 'Value: ', () => br.value, v => { br.value = v; }, 'test for value'); row(); }
      } else if (br.type === 'mouse') {
        ['left', 'middle', 'right'].forEach((b, bi) => k.row(R(x1 + bi * W / 3, yy, x1 + (bi + 1) * W / 3 - 1, yy + 8), ['Left', 'Middle', 'Right'][bi], br, 'button', b, 'Trigger on ' + b + ' mouse'));
        row();
      }
    } else if (c.kind === 'controller') {
      if (br.type === 'expression') { k.tex(R(x1, yy, x2, yy + 8), 'Exp:', () => br.expr, v => { br.expr = v; }, 'Expression'); row(); }
      if (br.type === 'python') { k.tex(R(x1, yy, x2, yy + 8), 'Script:', () => br.expr, v => { br.expr = v; }, 'Python script name'); row(); }
    } else {
      const a = br;
      if (a.type === 'object') {
        [['Force', 'force', 0.1], ['Torque', 'torque', 0.1], ['dLoc', 'dloc', 0.01], ['dRot', 'drot', 0.01], ['linV', 'linv', 0.1], ['angV', 'angv', 0.1]].forEach(([lab, key, st]) => {
          k.label(x1, yy, lab, 24);
          [0, 1, 2].forEach(ax => blk.num('', ...R(x1 + 26 + ax * (W - 40) / 3, yy, x1 + 26 + (ax + 1) * (W - 40) / 3 - 1, yy + 8), () => a[key][ax], v => { a[key][ax] = v; }, -1000, 1000, st, 3, lab + ' ' + 'XYZ'[ax]));
          k.tog(R(x2 - 12, yy, x2, yy + 8), 'L', a.local, key, 'Local transformation');
          row();
        });
        k.tog(R(x1, yy, x1 + 40, yy + 8), 'add', a, 'addv', 'Add velocity to existing'); row();
      } else if (a.type === 'constraint') {
        k.menu(R(x1, yy, x2, yy + 8), 'Limit %t|None %x0|Loc X %x1|Loc Y %x2|Loc Z %x4|Rot X %x8|Rot Y %x16|Rot Z %x32', () => ({ none: 0, locx: 1, locy: 2, locz: 4, rotx: 8, roty: 16, rotz: 32 })[a.limit], v => { a.limit = { 0: 'none', 1: 'locx', 2: 'locy', 4: 'locz', 8: 'rotx', 16: 'roty', 32: 'rotz' }[v]; }, 'Limit'); row();
        k.num(half(0), 'Min', a, 'min', -2000, 2000, 0.1, 2, 'Minimum'); k.num(half(1), 'Max', a, 'max', -2000, 2000, 0.1, 2, 'Maximum'); row();
        k.num(R(x1, yy, x2, yy + 8), 'Damp:', a, 'damp', 0, 100, 1, 0, 'Damping'); row();
      } else if (a.type === 'ipo') {
        k.menu(R(x1, yy, x2, yy + 8), 'Ipo types   %t|Play %x0|Ping Pong %x1|Flipper %x2|Loop stop %x3|Loop End %x4|Key 2 Key %x5|Property %x6', () => ['play', 'pingpong', 'flipper', 'loopstop', 'loopend', 'key2key', 'property'].indexOf(a.mode), v => { a.mode = ['play', 'pingpong', 'flipper', 'loopstop', 'loopend', 'key2key', 'property'][v]; }, 'Ipo type'); row();
        if (a.mode === 'property') { k.tex(R(x1, yy, x2, yy + 8), 'Prop: ', () => a.prop, v => { a.prop = v; }, 'Use this property to define the Ipo position'); row(); }
        else { k.num(half(0), 'Sta', a, 'sta', 1, 18000, 1, 0, 'Start frame'); k.num(half(1), 'End', a, 'end', 1, 18000, 1, 0, 'End frame'); row(); }
        k.tog(R(x1, yy, x1 + W / 2 - 1, yy + 8), 'Force', a, 'force', 'Convert Ipo to force'); row();
      } else if (a.type === 'camera') {
        k.tex(R(x1, yy, x2, yy + 8), 'OB:', () => a.ob, v => { a.ob = v; }, 'Look at this Object'); row();
        k.num(R(x1, yy, x2, yy + 8), 'Height:', a, 'height', -20, 20, 0.1, 2, 'Height'); row();
        k.num(half(0), 'Min:', a, 'min', 0, 100, 0.1, 2, 'Minimum distance'); k.num(half(1), 'Max:', a, 'max', 0, 100, 0.1, 2, 'Maximum distance'); row();
        k.row(half(0), 'X', a, 'axis', 'X', 'Camera tries to get behind the X axis'); k.row(half(1), 'Y', a, 'axis', 'Y', 'Camera tries to get behind the Y axis'); row();
      } else if (a.type === 'sound') {
        k.tex(R(x1, yy, x2, yy + 8), 'SO:', () => a.sound, v => { a.sound = v; }, 'Sound files (use Sound window to load files)'); row();
      } else if (a.type === 'property') {
        k.menu(R(x1, yy, x2, yy + 8), 'Type   %t|Assign   %x0|Add %x1|Copy %x2', () => ['assign', 'add', 'copy'].indexOf(a.mode), v => { a.mode = ['assign', 'add', 'copy'][v]; }, 'Type'); row();
        k.tex(R(x1, yy, x2, yy + 8), 'Prop: ', () => a.prop, v => { a.prop = v; }, 'Property name'); row();
        if (a.mode === 'copy') { k.tex(half(0), 'OB:', () => a.ob, v => { a.ob = v; }, 'Copy from this Object'); k.tex(half(1), 'Prop: ', () => a.fromProp, v => { a.fromProp = v; }, 'Copy this property'); row(); }
        else { k.tex(R(x1, yy, x2, yy + 8), 'Value: ', () => a.value, v => { a.value = v; }, 'change with this value'); row(); }
      } else if (a.type === 'editobject') {
        k.menu(R(x1, yy, x2, yy + 8), 'Edit Object %t|Add Object %x0|End Object %x1|Replace Mesh %x2|Track to %x3', () => ['add', 'end', 'replace', 'track'].indexOf(a.mode), v => { a.mode = ['add', 'end', 'replace', 'track'][v]; }, 'Edit Object'); row();
        if (a.mode === 'add') { k.tex(half(0), 'OB:', () => a.ob, v => { a.ob = v; }, 'Add this Object'); k.num(half(1), 'Time:', a, 'time', 0, 2000, 1, 0, 'Duration the new Object lives'); row(); [0, 1, 2].forEach(ax => blk.num('linV' + 'XYZ'[ax] + ':', ...R(x1 + ax * W / 3, yy, x1 + (ax + 1) * W / 3 - 1, yy + 8), () => a.linv[ax], v => { a.linv[ax] = v; }, -100, 100, 0.1, 2, 'Initial velocity')); row(); }
        else if (a.mode === 'replace') { k.tex(R(x1, yy, x2, yy + 8), 'ME:', () => a.me, v => { a.me = v; }, 'Add this Object'); row(); }
        else if (a.mode === 'track') { k.tex(half(0), 'OB:', () => a.ob, v => { a.ob = v; }, 'Track to this Object'); k.num(half(1), 'Time:', a, 'time', 0, 2000, 1, 0, 'Duration the tracking takes'); row(); k.tog(R(x1, yy, x1 + 30, yy + 8), '3D', a, 'd3', 'Enable 3D tracking'); row(); }
      } else if (a.type === 'scene') {
        k.menu(R(x1, yy, x2, yy + 8), 'Scene %t|Restart %x0|Set Scene %x1|Set Camera %x2', () => ['restart', 'set', 'camera'].indexOf(a.mode), v => { a.mode = ['restart', 'set', 'camera'][v]; }, 'Scene'); row();
        if (a.mode === 'set') { k.tex(R(x1, yy, x2, yy + 8), 'SCE:', () => a.scene, v => { a.scene = v; }, 'Set this Scene'); row(); }
        if (a.mode === 'camera') { k.tex(R(x1, yy, x2, yy + 8), 'OB:', () => a.camera, v => { a.camera = v; }, 'Set this Camera'); row(); }
      }
    }
    return yy + 2;
  }

  function removeBrick(ctx, o, listName, i) {
    const br = o[listName][i];
    o[listName].splice(i, 1);
    ctx.main.objects.forEach(ob => [...ob.sensors, ...ob.controllers].forEach(b => { b.links = (b.links || []).filter(l => l !== br.id); }));
  }

  function captureKey(ctx, br, field) {
    const font = 'helv12', msg = 'Press any key';
    const w = B.textWidth(font, msg) + 24, h = 24;
    const x1 = Math.round(B.clamp(ctx.mouse[0] - w / 2, 2, ctx.raster.w - w - 8)), y1 = Math.round(B.clamp(ctx.mouse[1] - h / 2, 8, ctx.raster.h - h - 4));
    const ov = {
      draw(r) {
        r.rect(x1 + 4, y1 - 4, x1 + w + 5, y1 + h - 3, rgb(0, 0, 0));
        r.rect(x1, y1, x1 + w + 1, y1 + h + 1, COL.MENU);
        r.text(font, msg, x1 + 12, y1 + 8, rgb(0, 0, 0));
      },
      key(e) { br[field] = e.key === 'ESC' ? '' : e.key; ctx.closeOverlay(ov); },
      down() { ctx.closeOverlay(ov); }
    };
    ctx.openOverlay(ov);
  }

  function linkEvent(ctx, area, ev) {
    if (ev.type !== 'down' || ev.button !== 0 || !area.logicDots) return false;
    const d = area.logicDots.find(q => q.sx != null && Math.abs(q.sx - ev.x) <= 4 && Math.abs(q.sy - ev.y) <= 4);
    if (!d) return false;
    area.linkDrag = { x1: d.sx, y1: d.sy, x2: ev.x, y2: ev.y };
    ctx.modal = {
      move: e => { area.linkDrag.x2 = e.x; area.linkDrag.y2 = e.y; area.redraw(); ctx.schedule(); return false; },
      up: e => {
        area.linkDrag = null;
        const t = area.logicDots.find(q => q.sx != null && Math.abs(q.sx - e.x) <= 5 && Math.abs(q.sy - e.y) <= 5);
        if (t && t !== d) {
          let src = null, dst = null;
          if (d.side === 'out' && t.side === 'in') { src = d; dst = t; } else if (d.side === 'in' && t.side === 'out') { src = t; dst = d; }
          if (src && dst && ((src.kind === 'sensor' && dst.kind === 'controller') || (src.kind === 'controller' && dst.kind === 'actuator'))) {
            const ls = src.br.links || (src.br.links = []);
            const ix = ls.indexOf(dst.br.id);
            if (ix >= 0) ls.splice(ix, 1); else ls.push(dst.br.id);
          }
        }
        ctx.redrawAll();
        return true;
      }
    };
    return true;
  }

  L.game = {
    w: 640, h: 100, X0: 190, Y0: 630,
    header: gameHeader,
    build: buildGame,
    event: linkEvent
  };

  const Game = {};
  B.GameState = { main: null };

  function propValue(props, name) { const p = props.find(q => q.name === name); return p ? p.value : undefined; }

  function parseVal(s) {
    if (s === 'true' || s === 'True') return true;
    if (s === 'false' || s === 'False') return false;
    const n = Number(s);
    return s !== '' && !isNaN(n) ? n : String(s).replace(/^"|"$/g, '');
  }

  function evalExpr(expr, scope) {
    const tokens = String(expr).match(/\s*(>=|<=|==|!=|AND|OR|NOT|and|or|not|[()<>+\-*/]|"[^"]*"|[A-Za-z_][\w.]*|\d+\.?\d*)\s*/g) || [];
    let i = 0;
    const peek = () => (tokens[i] || '').trim(), next = () => (tokens[i++] || '').trim();
    const prim = () => {
      const t = next();
      if (t === '(') { const v = or(); next(); return v; }
      if (/^not$/i.test(t)) return !prim();
      if (t === '-') return -prim();
      if (/^"/.test(t)) return t.slice(1, -1);
      if (/^\d/.test(t)) return parseFloat(t);
      if (/^true$/i.test(t)) return true;
      if (/^false$/i.test(t)) return false;
      return scope(t);
    };
    const mul = () => { let v = prim(); while (['*', '/'].includes(peek())) { const o = next(), w = prim(); v = o === '*' ? v * w : v / w; } return v; };
    const add = () => { let v = mul(); while (['+', '-'].includes(peek())) { const o = next(), w = mul(); v = o === '+' ? v + w : v - w; } return v; };
    const cmp = () => { let v = add(); while (['<', '>', '<=', '>=', '==', '!='].includes(peek())) { const o = next(), w = add(); v = o === '<' ? v < w : o === '>' ? v > w : o === '<=' ? v <= w : o === '>=' ? v >= w : o === '==' ? v == w : v != w; } return v; };
    const and = () => { let v = cmp(); while (/^and$/i.test(peek())) { next(); const w = cmp(); v = v && w; } return v; };
    const or = () => { let v = and(); while (/^or$/i.test(peek())) { next(); const w = and(); v = v || w; } return v; };
    try { return !!or(); } catch (e) { return false; }
  }

  function snapshot(ctx) {
    return ctx.scene.bases.map(b => ({ b, ob: b.object, loc: b.object.loc.slice(), rot: b.object.rot.slice(), size: b.object.size.slice(), lay: b.object.lay, data: b.object.data, props: b.object.props.map(p => Object.assign({}, p)) }));
  }

  function restore(ctx, snap, basesBefore) {
    ctx.scene.bases = basesBefore.slice();
    snap.forEach(s => { s.ob.loc = s.loc; s.ob.rot = s.rot; s.ob.size = s.size; s.ob.lay = s.lay; s.ob.data = s.data; s.ob.props = s.props; B.Data.whereIs(s.ob); });
  }

  function staticTris(ctx, rt) {
    const tris = [];
    ctx.scene.bases.forEach(b => {
      const ob = b.object;
      if (!(ob.lay & ctx.scene.lay) || ob.type !== 'mesh' || (ob.gameflag.actor && ob.gameflag.dynamic)) return;
      B.Data.whereIs(ob);
      const me = B.displayMesh(ob, ctx);
      me.faces.forEach(f => {
        if (f.v.length < 3 || (f.tf && f.tf.mode && f.tf.mode.collision === false)) return;
        const p = f.v.map(i => M.loc(ob.obmat, me.verts[i].co));
        const ma = B.View3D.obMaterial(ob, f.mat || 0);
        const add = (a, b2, c) => { const n = V.normal(a, b2, c); if (V.len(n) > 0.5) tris.push({ a, b: b2, c, n, ob, ma }); };
        add(p[0], p[1], p[2]);
        if (p.length === 4) add(p[0], p[2], p[3]);
      });
    });
    rt.tris = tris;
  }

  function closestOnTri(p, t) {
    const ab = V.sub(t.b, t.a), ac = V.sub(t.c, t.a), ap = V.sub(p, t.a);
    const d1 = V.dot(ab, ap), d2 = V.dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) return t.a;
    const bp = V.sub(p, t.b), d3 = V.dot(ab, bp), d4 = V.dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) return t.b;
    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) return V.add(t.a, V.mul(ab, d1 / (d1 - d3)));
    const cp = V.sub(p, t.c), d5 = V.dot(ab, cp), d6 = V.dot(ac, cp);
    if (d6 >= 0 && d5 <= d6) return t.c;
    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) return V.add(t.a, V.mul(ac, d2 / (d2 - d6)));
    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return V.add(t.b, V.mul(V.sub(t.c, t.b), (d4 - d3) / ((d4 - d3) + (d5 - d6))));
    const den = 1 / (va + vb + vc);
    return V.add(t.a, V.add(V.mul(ab, vb * den), V.mul(ac, vc * den)));
  }

  function rotate(ob, vecLocal) { return M.dir(M.eul(ob.rot), vecLocal); }

  function tick(ctx, rt, dt) {
    const sce = ctx.scene;
    const grav = sce.world ? sce.world.grav : 9.8;
    const obs = sce.bases.filter(b => b.object.lay & sce.lay).map(b => b.object);
    rt.time += dt;
    obs.forEach(ob => ob.props.forEach(p => { if (p.type === 'timer') p.value += dt; }));
    const sensorState = new Map();
    obs.forEach(ob => ob.sensors.forEach(s => {
      let on = false;
      const st = rt.sstate.get(s.id) || { last: false, cnt: 0 };
      if (s.type === 'always') on = true;
      else if (s.type === 'keyboard') on = s.allkeys ? rt.keys.size > 0 : (!!s.key && rt.keys.has(s.key) && (!s.mod1 || rt.keys.has(s.mod1)) && (!s.mod2 || rt.keys.has(s.mod2)));
      else if (s.type === 'mouse') on = rt.mouse.has(s.button);
      else if (s.type === 'touch' || s.type === 'collision') on = (rt.contacts.get(ob) || []).some(c => (s.type === 'touch' ? (!s.material || (c.ma && c.ma.name === s.material)) : (!s.prop || (c.ob && c.ob.props.some(p => p.name === s.prop)))));
      else if (s.type === 'near') {
        const p = [ob.obmat[12], ob.obmat[13], ob.obmat[14]];
        const lim = st.last ? s.reset : s.dist;
        on = obs.some(o => o !== ob && (!s.prop || o.props.some(q => q.name === s.prop)) && V.dist(p, [o.obmat[12], o.obmat[13], o.obmat[14]]) < lim);
      } else if (s.type === 'radar') {
        const p = [ob.obmat[12], ob.obmat[13], ob.obmat[14]];
        const ax = { X: [1, 0, 0], Y: [0, 1, 0], Z: [0, 0, 1], '-X': [-1, 0, 0], '-Y': [0, -1, 0], '-Z': [0, 0, -1] }[s.axis];
        const dir = V.norm(M.dir(ob.obmat, ax));
        on = obs.some(o => { if (o === ob || (s.prop && !o.props.some(q => q.name === s.prop))) return false; const d = V.sub([o.obmat[12], o.obmat[13], o.obmat[14]], p); const l = V.len(d); return l < s.dist && V.dot(V.mul(d, 1 / (l || 1)), dir) > Math.cos(s.angle * B.DEG / 2); });
      } else if (s.type === 'property') {
        const v = propValue(ob.props, s.prop);
        if (s.ptype === 'equal') on = v == parseVal(s.value);
        else if (s.ptype === 'notequal') on = v != parseVal(s.value);
        else if (s.ptype === 'interval') on = v >= parseVal(s.min) && v <= parseVal(s.max);
        else { on = st.prev !== undefined && st.prev !== v; st.prev = v; }
      }
      let trigger = on !== st.last;
      if (on && s.pulse) { st.cnt++; if (st.cnt > s.freq) { trigger = true; st.cnt = 0; } }
      st.last = on;
      rt.sstate.set(s.id, st);
      sensorState.set(s.id, { on, trigger, name: s.name });
    }));
    const contToAct = [];
    obs.forEach(ob => ob.controllers.forEach(c => {
      const ins = [];
      obs.forEach(o => o.sensors.forEach(s => { if ((s.links || []).includes(c.id)) ins.push(sensorState.get(s.id)); }));
      if (!ins.length) return;
      if (!ins.some(x => x && x.trigger)) return;
      let out;
      if (c.type === 'and') out = ins.every(x => x && x.on);
      else if (c.type === 'or') out = ins.some(x => x && x.on);
      else if (c.type === 'expression') out = evalExpr(c.expr, nm => { const s = ins.find(x => x && x.name === nm); if (s) return s.on; const v = propValue(ob.props, nm); return v; });
      else out = ins.every(x => x && x.on);
      contToAct.push({ c, out, ob });
    }));
    contToAct.forEach(({ c, out }) => {
      (c.links || []).forEach(aid => { rt.active.set(aid, out); });
    });
    obs.forEach(ob => ob.actuators.forEach(a => {
      const on = rt.active.get(a.id);
      if (!on) { if (a.type === 'ipo' && rt.ipo.has(a.id) && a.mode === 'flipper') rt.ipo.get(a.id).dir = -1; return; }
      runActuator(ctx, rt, ob, a, dt, obs);
      if (a.type === 'property' || a.type === 'editobject' || a.type === 'scene' || a.type === 'sound') rt.active.set(a.id, false);
    }));
    rt.contacts = new Map();
    obs.forEach(ob => {
      const gf = ob.gameflag;
      if (!gf.actor || !gf.dynamic) return;
      const st = rt.body.get(ob) || { v: [0, 0, 0], w: [0, 0, 0] };
      rt.body.set(ob, st);
      st.v[2] -= grav * dt;
      const damp = Math.pow(1 - Math.min(0.99, ob.damping || 0), dt * 50);
      st.v = V.mul(st.v, damp);
      st.w = V.mul(st.w, Math.pow(1 - Math.min(0.99, ob.rdamping || 0), dt * 50));
      ob.loc = V.add(ob.loc, V.mul(st.v, dt));
      ob.rot = V.add(ob.rot, V.mul(st.w, dt));
      const r = (ob.inertia || 1) * Math.max(...ob.size.map(Math.abs));
      const contacts = [];
      for (let iter = 0; iter < 3; iter++) {
        B.Data.whereIs(ob);
        const c = [ob.obmat[12], ob.obmat[13], ob.obmat[14]];
        for (const t of rt.tris) {
          const q = closestOnTri(c, t);
          const d = V.sub(c, q);
          const l = V.len(d);
          if (l < r && l > 1e-6) {
            const n = V.mul(d, 1 / l);
            ob.loc = V.add(ob.loc, V.mul(n, r - l));
            const vn = V.dot(st.v, n);
            if (vn < 0) {
              const refl = t.ma ? (t.ma.reflect || 0) : 0;
              st.v = V.sub(st.v, V.mul(n, vn * (1 + refl)));
              const fr = t.ma && t.ma.fhfrict ? t.ma.fhfrict : 0.05;
              const tang = V.sub(st.v, V.mul(n, V.dot(st.v, n)));
              st.v = V.sub(st.v, V.mul(tang, Math.min(1, fr)));
            }
            contacts.push({ ob: t.ob, ma: t.ma });
            B.Data.whereIs(ob);
          }
        }
      }
      if (gf.doFh) {
        const c = [ob.obmat[12], ob.obmat[13], ob.obmat[14]];
        rt.tris.forEach(t => {
          if (!t.ma || !t.ma.fhdist) return;
          if (t.n[2] < 0.5) return;
          const q = closestOnTri(c, t);
          const h = c[2] - q[2];
          if (h > 0 && h < t.ma.fhdist + r && Math.hypot(c[0] - q[0], c[1] - q[1]) < 0.01 + r) {
            const f = (t.ma.fhdist + r - h) * (t.ma.fhforce || 0) * 50;
            st.v[2] += f * dt - st.v[2] * (t.ma.fhdamp || 0);
          }
        });
      }
      obs.forEach(o2 => {
        if (o2 === ob || !(o2.gameflag.actor)) return;
        const r2 = (o2.inertia || 1) * Math.max(...o2.size.map(Math.abs));
        const d = V.sub([ob.obmat[12], ob.obmat[13], ob.obmat[14]], [o2.obmat[12], o2.obmat[13], o2.obmat[14]]);
        const l = V.len(d);
        if (l < r + r2 && l > 1e-6) {
          contacts.push({ ob: o2, ma: B.View3D.obMaterial(o2, 0) });
          if (o2.gameflag.dynamic) {
            const n = V.mul(d, 1 / l);
            ob.loc = V.add(ob.loc, V.mul(n, (r + r2 - l) / 2));
            const vn = V.dot(st.v, n);
            if (vn < 0) st.v = V.sub(st.v, V.mul(n, vn));
          }
        }
      });
      rt.contacts.set(ob, contacts);
      B.Data.whereIs(ob);
    });
    obs.forEach(ob => { if (!(ob.gameflag.actor && ob.gameflag.dynamic)) B.Data.whereIs(ob); });
    rt.spawned = rt.spawned.filter(s => {
      if (s.life > 0 && rt.time > s.until) { ctx.scene.bases = ctx.scene.bases.filter(b => b.object !== s.ob); return false; }
      return true;
    });
  }

  function findOb(ctx, name) { return ctx.main.objects.find(o => o.name === name) || null; }

  function runActuator(ctx, rt, ob, a, dt, obs) {
    const st = rt.body.get(ob) || { v: [0, 0, 0], w: [0, 0, 0] };
    rt.body.set(ob, st);
    if (a.type === 'object') {
      const dyn = ob.gameflag.actor && ob.gameflag.dynamic;
      const L2 = (key, v) => (a.local[key] ? rotate(ob, v) : v);
      if (dyn) {
        st.v = V.add(st.v, V.mul(L2('force', a.force), dt / Math.max(0.01, ob.mass)));
        st.w = V.add(st.w, V.mul(L2('torque', a.torque), dt / Math.max(0.01, ob.mass)));
        if (V.len(a.linv)) st.v = a.addv ? V.add(st.v, L2('linv', a.linv)) : V.add(L2('linv', a.linv), [0, 0, a.local.linv ? 0 : 0]);
        if (V.len(a.angv)) st.w = L2('angv', a.angv);
      }
      if (V.len(a.dloc)) ob.loc = V.add(ob.loc, L2('dloc', a.dloc));
      if (V.len(a.drot)) {
        if (a.local.drot) {
          const m = M.mul(M.eul(ob.rot), M.eul(a.drot));
          ob.rot = M.toEul(m);
        } else ob.rot = V.add(ob.rot, a.drot);
      }
    } else if (a.type === 'constraint') {
      const ax = { locx: 0, locy: 1, locz: 2 }[a.limit];
      if (ax != null) ob.loc[ax] = B.clamp(ob.loc[ax], a.min, a.max);
      const rx = { rotx: 0, roty: 1, rotz: 2 }[a.limit];
      if (rx != null) ob.rot[rx] = B.clamp(ob.rot[rx], a.min * B.DEG, a.max * B.DEG);
    } else if (a.type === 'ipo') {
      if (!ob.ipo) return;
      let s = rt.ipo.get(a.id);
      if (!s) { s = { f: a.sta, dir: 1 }; rt.ipo.set(a.id, s); }
      if (a.mode === 'property') s.f = Number(propValue(ob.props, a.prop)) || 0;
      else {
        s.f += s.dir * dt * (ctx.scene.r.frs_sec || 25);
        if (a.mode === 'play' || a.mode === 'loopstop') { if (s.f > a.end) s.f = a.end; }
        else if (a.mode === 'loopend') { if (s.f > a.end) s.f = a.sta; }
        else if (a.mode === 'pingpong') { if (s.f > a.end) { s.f = a.end; s.dir = -1; } if (s.f < a.sta) { s.f = a.sta; s.dir = 1; } }
        else if (a.mode === 'flipper') { s.dir = 1; if (s.f > a.end) s.f = a.end; }
      }
      B.Anim.evalIpoFor(ob, ob.ipo, 'OB', s.f, null);
    } else if (a.type === 'camera') {
      const t = findOb(ctx, a.ob);
      if (!t) return;
      B.Data.whereIs(t);
      const tp = [t.obmat[12], t.obmat[13], t.obmat[14]];
      const back = V.norm(M.dir(t.obmat, a.axis === 'X' ? [-1, 0, 0] : [0, -1, 0]));
      const cur = [ob.obmat[12], ob.obmat[13], ob.obmat[14]];
      let d = V.dist([cur[0], cur[1], 0], [tp[0], tp[1], 0]);
      d = B.clamp(d, a.min, a.max);
      const want = V.add(tp, V.add(V.mul(back, d), [0, 0, a.height]));
      ob.loc = V.lerp(ob.loc, want, Math.min(1, dt * 5));
      const look = V.norm(V.sub(tp, ob.loc));
      const ax = B.Data.trackAxes(look, '-Z', 'Y');
      ob.rot = M.toEul([ax[0][0], ax[0][1], ax[0][2], 0, ax[1][0], ax[1][1], ax[1][2], 0, ax[2][0], ax[2][1], ax[2][2], 0, 0, 0, 0, 1]);
    } else if (a.type === 'sound') {
      const so = ctx.main.sounds.find(s => s.name === a.sound);
      if (so && B.Sound) { B.Sound.decode(ctx, so); B.Sound.play(ctx, so, 1); }
    } else if (a.type === 'property') {
      const p = ob.props.find(q => q.name === a.prop);
      if (!p) return;
      if (a.mode === 'assign') p.value = coerce(p, parseVal(a.value));
      else if (a.mode === 'add') p.value = coerce(p, Number(p.value) + Number(parseVal(a.value)));
      else { const o = findOb(ctx, a.ob); const v = o ? propValue(o.props, a.fromProp) : undefined; if (v !== undefined) p.value = coerce(p, v); }
    } else if (a.type === 'editobject') {
      if (a.mode === 'end') { ctx.scene.bases = ctx.scene.bases.filter(b => b.object !== ob); rt.body.delete(ob); }
      else if (a.mode === 'add') {
        const src = findOb(ctx, a.ob);
        if (!src) return;
        const c = Object.assign({}, src, { loc: [ob.obmat[12], ob.obmat[13], ob.obmat[14]], rot: ob.rot.slice(), size: src.size.slice(), dloc: [0, 0, 0], drot: [0, 0, 0], dsize: [0, 0, 0], lay: ctx.scene.lay, parent: null, props: src.props.map(p => Object.assign({}, p)), obmat: M.ident(), parentInv: M.ident(), gameflag: Object.assign({}, src.gameflag) });
        ctx.scene.bases.push({ object: c, sel: false });
        B.Data.whereIs(c);
        rt.body.set(c, { v: rotate(ob, a.linv), w: [0, 0, 0] });
        rt.spawned.push({ ob: c, life: a.time, until: rt.time + a.time / 50 });
      } else if (a.mode === 'replace') { const me = ctx.main.meshes.find(m => m.name === a.me); if (me) ob.data = me; }
      else if (a.mode === 'track') {
        const t = findOb(ctx, a.ob);
        if (!t) return;
        const d = V.sub([t.obmat[12], t.obmat[13], t.obmat[14]], [ob.obmat[12], ob.obmat[13], ob.obmat[14]]);
        if (!a.d3) d[2] = 0;
        if (V.len(d) < 1e-6) return;
        const ax = B.Data.trackAxes(V.norm(d), 'Y', 'Z');
        const target = M.toEul([ax[0][0], ax[0][1], ax[0][2], 0, ax[1][0], ax[1][1], ax[1][2], 0, ax[2][0], ax[2][1], ax[2][2], 0, 0, 0, 0, 1]);
        const k = a.time > 0 ? Math.min(1, 1 / a.time) : 1;
        ob.rot = ob.rot.map((v, i) => v + (target[i] - v) * k);
      }
    } else if (a.type === 'scene') {
      if (a.mode === 'restart') rt.restart = true;
      else if (a.mode === 'camera') { const c = findOb(ctx, a.camera); if (c) ctx.scene.camera = c; }
      else if (a.mode === 'set') { const s = ctx.main.scenes.find(q => q.name === a.scene); if (s) rt.setScene = s; }
    }
  }

  function coerce(p, v) {
    if (p.type === 'int') return Math.round(Number(v) || 0);
    if (p.type === 'float' || p.type === 'timer') return Number(v) || 0;
    if (p.type === 'bool') return !!v && v !== 'false';
    return String(v);
  }

  Game.start = function (ctx, area) {
    if (ctx.G.playing) return;
    if (!area || area.type !== 'view3d') return;
    if (ctx.G.obedit) B.Edit.exit(ctx, true);
    B.GameState.main = ctx.main;
    const sce = ctx.scene;
    const snap = snapshot(ctx);
    const basesBefore = sce.bases.slice();
    const camBefore = sce.camera;
    const sv = area.space;
    const viewBefore = { persp: sv.persp, drawtype: sv.drawtype };
    if (sv.drawtype === 'wire' || sv.drawtype === 'bounds') sv.drawtype = 'solid';
    const rt = { time: 0, keys: new Set(), mouse: new Set(), sstate: new Map(), active: new Map(), body: new Map(), contacts: new Map(), ipo: new Map(), spawned: [], tris: [] };
    staticTris(ctx, rt);
    let last = performance.now(), acc = 0, req = 0;
    const st = {
      game: true, area, rt,
      stop() {
        if (req) (typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame : clearTimeout)(req);
        restore(ctx, snap, basesBefore);
        sce.camera = camBefore;
        Object.assign(sv, viewBefore);
        ctx.G.playing = null;
        ctx.modal = null;
        ctx.redrawAll();
      }
    };
    ctx.G.playing = st;
    const loop = () => {
      if (ctx.destroyed || ctx.G.playing !== st) return;
      const now = performance.now();
      acc += Math.min(0.25, (now - last) / 1000);
      last = now;
      while (acc >= 0.02) {
        tick(ctx, rt, 0.02);
        acc -= 0.02;
        if (rt.restart) { rt.restart = false; restore(ctx, snap, basesBefore); rt.body.clear(); rt.sstate.clear(); rt.active.clear(); rt.ipo.clear(); rt.spawned = []; rt.time = 0; }
      }
      area.redraw();
      ctx.schedule();
      req = (typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : f => setTimeout(f, 16))(loop);
    };
    ctx.modal = {
      key: e => {
        if (e.key === 'ESC') { st.stop(); return true; }
        rt.keys.add(e.key);
        return false;
      },
      down: e => { rt.mouse.add(['left', 'middle', 'right'][e.button]); return false; },
      up: e => { rt.mouse.delete(['left', 'middle', 'right'][e.button]); return false; },
      move: () => false
    };
    if (typeof document !== 'undefined') {
      const ku = e => { const k = B.normKey(e); rt.keys.delete(k); };
      document.addEventListener('keyup', ku, true);
      const oldStop = st.stop;
      st.stop = () => { document.removeEventListener('keyup', ku, true); oldStop(); };
    }
    loop();
  };

  Game.drawView = function (ctx, area, r, sv) {
    const w = area.win;
    const world = ctx.scene.world;
    const hor = world ? [world.horr, world.horg, world.horb] : [0.3, 0.3, 0.35];
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, B.rgbf(hor[0], hor[1], hor[2]));
    r.clearDepth();
    const cam = ctx.scene.camera;
    if (cam && sv.persp !== 2) { sv.persp = 2; B.View3D.setMatrices(ctx, area); }
    const bases = ctx.scene.bases.filter(b => b.object.lay & ctx.scene.lay);
    bases.forEach(b => {
      const ob = b.object;
      if (ob.type === 'camera' || ob.type === 'lamp' || ob.type === 'empty') return;
      B.Data.whereIs(ob);
      const fake = { object: ob, sel: false };
      const oldDt = sv.drawtype;
      sv.drawtype = 'shaded';
      const savedSel = ctx.scene.basact;
      try { B.View3D.drawGameObject(ctx, r, sv, fake); } finally { sv.drawtype = oldDt; ctx.scene.basact = savedSel; }
    });
    r.depthTest = false;
    const rt = ctx.G.playing && ctx.G.playing.rt;
    if (rt) {
      let y = w.y2 - 14;
      bases.forEach(b => b.object.props.forEach(p => { if (p.debug) { r.text('helv12', `${b.object.name}:${p.name}: ${typeof p.value === 'number' ? (Number.isInteger(p.value) ? p.value : p.value.toFixed(3)) : p.value}`, w.x1 + 6, y, rgb(255, 255, 255)); y -= 14; } }));
    }
  };

  Game.stop = function (ctx) { if (ctx.G.playing && ctx.G.playing.game) ctx.G.playing.stop(); };

  B.Game = Game;
  B.GameLogic = { newSensor, newController, newActuator, evalExpr, tick, closestOnTri, staticTris };
})(globalThis.B204 = globalThis.B204 || {});
