(function (S) {
  'use strict';
  const PI = Math.PI;
  const W = (type, x, z, o) => Object.assign({ type, x, z }, o || {});
  const sc = (x, z) => W('scarecrow', x, z), sl = (x, z) => W('scarecrowLeg', x, z), mg = (x, z) => W('mega', x, z);
  const fr = (x, z) => W('frost', x, z), an = (x, z) => W('angelo', x, z), me = (x, z) => W('mephisto', x, z), as = (x, z) => W('assault', x, z);
  const NIGHT = { amb: [0.26, 0.27, 0.38], sun: [-0.35, 0.75, 0.45], sunCol: [0.42, 0.46, 0.62], fog: [0.07, 0.08, 0.13], fogD: 0.022, sky: 'night' };
  const INDOOR = { amb: [0.3, 0.26, 0.24], sun: [0.2, 1, 0.3], sunCol: [0.18, 0.16, 0.14], fog: [0.04, 0.03, 0.03], fogD: 0.02, sky: 'indoor' };

  const AREAS = {
    opera(b) {
      b.env(Object.assign({}, INDOOR, { amb: [0.3, 0.24, 0.26], sunCol: [0.3, 0.34, 0.5], fog: [0.06, 0.04, 0.05], fogD: 0.014, music: 'boss', name: 'Оперный театр' }));
      b.room(-16, -26, 16, 26, 16, { floor: 'woodfloor', wall: 'operawall' });
      b.ceil(-16, -26, 16, 12, 16, 'ceiling'); b.ceil(-16, 18, 16, 26, 16, 'ceiling'); b.ceil(-16, 12, -4, 18, 16, 'ceiling'); b.ceil(4, 12, 16, 18, 16, 'ceiling');
      b.box(-2, 0, -26, 2, 0.03, 16, 'carpet', { side: 'carpet' });
      b.box(-16, 0, 16, 16, 1.2, 26, 'stage', { top: 'woodfloor' });
      b.stairs(-3.5, 13.6, 3.5, 16, 0, 1.2, 'n', 'woodfloor');
      b.prop('organ', 0, 1.2, 25.4, PI, 1.4); b.prop('curtain', -12, 1.2, 17, 0, 1); b.prop('curtain', 12, 1.2, 17, 0, 1);
      b.prop('pulpit', 0, 1.2, 19, PI, 1); b.prop('spardaStatue', 0, 1.2, 23.5, PI, 1.1);
      for (let z = -22; z <= -6; z += 3.2) { b.solidProp('pew', -8.3, 0, z, 0, 1, 5.6, 0.95, 0.42); b.solidProp('pew', 8.3, 0, z, 0, 1, 5.6, 0.95, 0.42); }
      for (const z of [-20, -10, 0, 10]) { b.pillar(-15, z, 0.6, 16, 'marble'); b.pillar(15, z, 0.6, 16, 'marble'); }
      b.box(-16, 5, -26, -13, 5.6, 14, 'balcony', { noWalk: true }); b.box(13, 5, -26, 16, 5.6, 14, 'balcony', { noWalk: true });
      b.prop('chandelier', 0, 12.5, -12, 0, 1.2); b.prop('chandelier', 0, 12.5, 8, 0, 1.2);
      b.light(0, 11, -12, 16, [1.2, 0.85, 0.5]); b.light(0, 11, 8, 16, [1.2, 0.85, 0.5]); b.light(0, 14, 15, 18, [0.45, 0.6, 1.1]); b.light(0, 5, 21, 10, [1, 0.7, 0.4]);
      b.fx('moonbeam', 0, 16, 15, { w: 8, d: 6 });
      for (const [x, z] of [[-13, 14.5], [13, 14.5], [-13, -24.5], [13, -24.5]]) b.breakable('vase', x, z, 0, 6);
      for (const [x, z] of [[-10, 24], [10, 24]]) b.breakable('candelabra', x, z, 1.2, 8);
      b.orbs(-13, 4, 21, 8);
      b.spawn('start', 0, 6, 0);
      b.special('boss', { id: 'dante', x: 0, z: 12, face: PI, auto: true });
      return b.done();
    },

    plaza(b) {
      b.env(Object.assign({}, NIGHT, { music: 'explore', name: 'Площадь у Оперы' }));
      b.floor(-24, -24, 24, 24, 0, 'cobble'); b.bounds(-24, -24, 24, 24);
      b.wallX(-24, -24, 24, 14, 'operafacade', [[-4, 4, 7]]); b.wallX(24, -24, 24, 11, 'facade'); b.wallZ(-24, -24, 24, 11, 'facade'); b.wallZ(24, -24, 24, 11, 'facade', [[-2, 2, 4.5]]);
      b.prop('bigdoor', 0, 0, -23.6, 0, 1);
      b.solidProp('fountain', 0, 0, 0, 0, 1, 3.2, 0.9, 3.2);
      for (const [x, z] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) { b.solidProp('lamp', x, 0, z, 0, 1, 0.2, 4, 0.2); b.light(x, 4.2, z, 11, [1.2, 0.9, 0.55]); }
      for (const [x, z, r] of [[-17, 4, PI / 2], [17, -6, -PI / 2], [-6, 19, PI], [8, -19, 0]]) b.breakable('bench', x, z, 0, 8, r);
      for (const [x, z] of [[-21, -20], [21, 20], [-21, 20], [20, -20]]) b.breakable('barrel', x, z, 0, 5);
      b.orbs(0, 5.2, 0, 10);
      b.door('toOpera', 0, -24, 0, null, { lockMsg: 'Двери Оперы заперты изнутри.', w: 8 });
      b.door('toStore', 24, 0, -PI / 2, 'store:fromPlaza');
      b.spawn('start', 0, -15, 0);
      b.fight('plaza1', [-24, -24, 24, 24], [[sc(-8, 9), sc(8, 9), sc(-11, -3), sc(11, -5)], [sc(0, 15), sl(-7, 12), sl(7, 12), sc(0, -12)], [sc(-14, 0), sc(14, 0), sl(0, 16)]], { auto: false });
      return b.done();
    },

    store(b) {
      b.env(Object.assign({}, INDOOR, { amb: [0.28, 0.26, 0.23], music: 'explore', name: 'Склад' }));
      b.room(-14, -18, 14, 18, 9, { floor: 'planks', wall: 'brick', ceil: 'planks', gaps: { w: [[-2, 2, 4]], n: [[-2, 2, 4]] } });
      b.box(-13.5, 0, -17.5, -8, 2, -12, 'cratebig'); b.box(-13.5, 2, -17.5, -10.5, 4.2, -14.5, 'cratebig'); b.box(-13.5, 0, -12, -11, 1.2, -9.5, 'cratebig');
      b.item('frag_m2a', -12, 4.8, -16);
      b.box(8, 0, -17.5, 13.5, 3, -14, 'cratebig'); b.box(10, 0, 12, 13.5, 2.4, 17.5, 'cratebig'); b.box(-13.5, 0, 12, -9, 2.8, 17.5, 'cratebig');
      b.box(13, 0, -10, 13.8, 4.5, 10, 'shelf');
      for (const [x, z] of [[-6, -10], [-4, -11], [5, -6], [6, 4], [-7, 7], [3, 12], [-3, 14], [9, 9], [-10, 3]]) b.breakable('crate', x, z, 0, 5);
      for (const [x, z] of [[11, -3], [11, 0.5], [-12, -5]]) b.breakable('barrel', x, z, 0, 4);
      for (const z of [-9, 3, 13]) { b.prop('hanglamp', 0, 7.6, z, 0, 1); b.light(0, 6.8, z, 11, [1.1, 0.8, 0.45]); }
      b.door('fromPlaza', -14, 0, PI / 2, 'plaza:toStore'); b.door('toCath', 0, 18, PI, 'cathedral:fromStore');
      b.fight('store1', [-14, -6, 14, 18], [[sc(-5, 8), sc(5, 9), sl(0, 12)], [sl(-8, 10), sl(8, 12), sc(0, 4)], [mg(0, 10)]], { introCut: { 2: 'mega_intro' } });
      return b.done();
    },

    cathedral(b) {
      b.env(Object.assign({}, INDOOR, { amb: [0.24, 0.2, 0.24], fog: [0.05, 0.035, 0.05], fogD: 0.016, music: 'church', name: 'Собор' }));
      b.room(-10, -26, 10, 26, 18, { floor: 'marble', wall: 'cathwall', ceil: 'ceiling', gaps: { s: [[-2, 2, 4.5]], w: [[16, 20, 4.5]] } });
      for (const z of [-18, -10, -2, 6, 14]) { b.pillar(-6.2, z, 0.7, 18, 'marble'); b.pillar(6.2, z, 0.7, 18, 'marble'); }
      for (const z of [-20, -16.6, -13.2, -9.8, -6.4]) { b.solidProp('pew', -3.3, 0, z, 0, 0.45, 1.55, 0.95, 0.42); b.solidProp('pew', 3.3, 0, z, 0, 0.45, 1.55, 0.95, 0.42); }
      b.box(-7, 0, 19, 7, 0.9, 26, 'marble'); b.stairs(-3, 17.2, 3, 19, 0, 0.9, 'n', 'marble');
      b.solidProp('altar', 0, 0.9, 23, 0, 1, 1.6, 1, 0.8); b.prop('spardaStatue', 0, 0.9, 25.2, PI, 1.4);
      b.item('evilLegacy', 0, 2.3, 23, { key: true });
      for (const z of [-18, -10, -2, 6, 14]) { b.prop('stainwin', -9.65, 7, z + 4, PI / 2, 1); b.prop('stainwin', 9.65, 7, z + 4, -PI / 2, 1); }
      b.light(-7, 9, -6, 14, [0.9, 0.3, 0.3]); b.light(7, 9, 6, 14, [0.3, 0.4, 1]); b.light(-7, 9, 14, 14, [0.4, 0.9, 0.5]); b.light(0, 5, 22, 10, [1.2, 0.9, 0.5]); b.light(0, 6, -18, 12, [1, 0.8, 0.5]);
      for (const [x, z] of [[-8.5, 21], [8.5, 21], [-8.5, -12], [8.5, -12]]) b.breakable('candelabra', x, z, 0, 8);
      b.statue(8, -22, -PI / 2);
      b.door('fromStore', 0, -26, 0, 'store:toCath'); b.door('toTerrace', -10, 18, PI / 2, 'terrace:fromCath', { need: 'evilLegacy', lockMsg: 'Дверь запечатана. На алтаре что-то светится.' });
      b.fight('cath1', [-10, -26, 10, 26], [[sc(-4, 12), sc(4, 12), sc(-3, 0), sc(3, 0)], [sl(-4, 16), sl(4, 16), sc(0, -4), sc(0, 8)], [mg(0, 6), sc(-5, 12)]], { auto: false });
      return b.done();
    },

    terrace(b) {
      b.env(Object.assign({}, NIGHT, { music: 'explore', name: 'Деловой квартал — террасы', voidY: -14, view: 'town' }));
      b.floor(-10, -30, 10, -8, 0, 'cobble'); b.floor(-10, 4, 10, 30, 1.5, 'cobble'); b.floor(-10, 30, 10, 46, 6, 'cobble');
      b.box(-10, -1, 29.4, 10, 5, 30.6, 'stonewall');
      b.wallX(-30, -10, 10, 9, 'facade', [[-1.5, 1.5, 4.2]]); b.wallX(46, -10, 10, 11, 'facade', [[-1.5, 1.5, 4.2]], { y: 6 });
      b.wallZ(-10.3, -30, 46, 12, 'facade', [], { y: -1 });
      b.box(9.6, 0, -30, 10.2, 1.1, -8, 'railing'); b.box(9.6, 1.5, 4, 10.2, 2.6, 30, 'railing'); b.box(9.6, 6, 30, 10.2, 7.1, 46, 'railing');
      b.box(-10, 0, -8.6, 10, 1.1, -8, 'railing');
      b.bounds(-10, -30, 10.2, 46);
      b.grip(0, 6.2, -1.5); b.grip(0, 10, 27.5);
      b.orbs(0, 7.8, -1.5, 5); b.orbs(0, 11.5, 27.5, 5);
      for (const [x, z, y] of [[-6, -20, 0], [6, 12, 1.5], [-6, 36, 6]]) { b.solidProp('lamp', x, y, z, 0, 1, 0.2, 4, 0.2); b.light(x, y + 4.2, z, 11, [1.2, 0.9, 0.55]); }
      for (const [x, z, y] of [[-8, -14, 0], [7, -24, 0], [-8, 10, 1.5], [8, 22, 1.5], [7, 40, 6]]) b.breakable('barrel', x, z, y, 5);
      b.special('hint', { zone: [-10, -14, 10, -8], text: 'Пропасть. Синие огни в воздухе — точки захвата: L без захвата цели притягивает Неро к ним (Hell Bound).', need: 'evilLegacy' });
      b.door('fromCath', 0, -30, 0, 'cathedral:toTerrace'); b.door('toPort', 0, 46, PI, 'port:fromTerrace', { y: 6 });
      b.fight('terrace1', [-10, 4, 10, 30], [[sc(-5, 14), sc(5, 14), sl(0, 20)], [sl(-6, 22), sc(6, 22), mg(0, 16)]]);
      return b.done();
    },

    port(b) {
      b.env(Object.assign({}, NIGHT, { fog: [0.08, 0.1, 0.14], fogD: 0.018, music: 'explore', name: 'Порт Каэрула', voidY: -8, view: 'sea', water: -2 }));
      b.floor(-26, -26, 20, 26, 0, 'concrete'); b.bounds(-26, -26, 36, 26);
      b.wallX(-26, -26, 20, 10, 'facade', [[-1.5, 1.5, 4.2]]); b.wallX(26, -26, 20, 12, 'rockwall', [[-2, 2, 5]]); b.wallZ(-26, -26, 26, 10, 'facade');
      b.box(19.4, 0, -26, 20, 0.9, 26, 'railing', { solid: false });
      for (const [x0, z0, x1, z1, h, t] of [[-22, -18, -16, -15.4, 2.6, 'containerR'], [-22, -15.2, -16, -12.6, 2.6, 'containerB'], [-22, -18, -16, -15.4, 5.2, 'containerG'], [8, -20, 14, -17.4, 2.6, 'containerB'], [-24, 10, -21.4, 16, 2.6, 'containerR'], [4, 14, 10, 16.6, 2.6, 'containerG'], [12, 4, 17.2, 6.6, 2.6, 'containerR']]) b.box(x0, h - 2.6, z0, x1, h, z1, t);
      b.prop('crane', 14, 0, 18, PI, 1); b.prop('boat', 27, -2, -4, 0, 1);
      for (const [x, z] of [[-10, -8], [8, 0], [-6, 12], [0, -20], [15, -10]]) b.breakable('crate', x, z, 0, 5);
      for (const [x, z] of [[-18, 4], [-17, 5.5], [10, 10], [17, 12]]) b.breakable('barrel', x, z, 0, 4);
      for (const [x, z] of [[-14, -2], [4, 6], [-4, 20]]) { b.solidProp('lamp', x, 0, z, 0, 1, 0.2, 4, 0.2); b.light(x, 4.2, z, 12, [1.1, 0.9, 0.6]); }
      b.sw('portSwitch', -21, 1.4, 21, { flag: 'portGate', text: 'Синий механизм' });
      b.barrier('portGate', -2.2, 25.2, 2.2, 25.8, { flag: 'portGate', kind: 'bars' });
      b.special('hint', { zone: [-8, 18, 8, 26], text: 'Решётку держит механизм. Ударьте светящийся синий механизм в углу порта.', unless: 'portGate' });
      b.door('fromTerrace', 0, -26, 0, 'terrace:toPort'); b.door('toMine', 0, 26, PI, 'mine:fromPort', { need: 'portGate', lockMsg: 'Путь закрыт решёткой.' });
      b.fight('port1', [-26, -14, 20, 26], [[sc(-6, 4), sc(6, 4), sc(0, 12), sc(-10, 12)], [sl(-4, 8), sl(4, 8), sl(10, 14), sc(0, 16)], [mg(0, 10), sc(-8, 6), sc(8, 6)]]);
      return b.done();
    },

    mine(b) {
      b.env({ amb: [0.28, 0.16, 0.1], sun: [0, 1, 0], sunCol: [0.2, 0.08, 0.02], fog: [0.14, 0.05, 0.02], fogD: 0.022, sky: 'cave', music: 'boss', name: 'Первая шахта' });
      b.floor(-22, -22, 22, 22, 0, 'rockfloor'); b.bounds(-22, -22, 22, 22);
      b.wallX(-22, -22, 22, 16, 'rockwall', [[-2, 2, 5]], { t: 1.4 }); b.wallX(22, -22, 22, 16, 'rockwall', [], { t: 1.4 }); b.wallZ(-22, -22, 22, 16, 'rockwall', [], { t: 1.4 }); b.wallZ(22, -22, 22, 16, 'rockwall', [], { t: 1.4 });
      for (const [x, z, s] of [[-18, 16, 3], [17, 17, 3.5], [-19, -12, 2.2], [18, -14, 2.6], [-6, 19, 2], [9, -19, 2]]) b.box(x - s, 0, z - s, x + s, s * 1.2, z + s, 'rock');
      for (const [x0, z0, x1, z1] of [[-14, 6, -9, 12], [9, 4, 14, 10], [-4, -12, 2, -9]]) { b.box(x0, 0, z0, x1, 0.04, z1, 'lava', { solid: false, glow: true }); b.hazard('lava', [x0, z0, x1, z1], { dps: 14 }); b.light((x0 + x1) / 2, 1, (z0 + z1) / 2, 9, [1.4, 0.5, 0.1]); }
      b.light(0, 10, 0, 30, [0.8, 0.35, 0.15]);
      b.prop('minecart', -16, 0, -4, 0.3, 1); b.prop('lantern', -12, 3, -21, 0, 1); b.prop('lantern', 12, 3, -21, 0, 1);
      b.fx('embers', 0, 0, 0, { w: 40, d: 40 });
      b.door('fromPort', 0, -22, 0, 'port:toMine');
      b.special('boss', { id: 'berial', x: 0, z: 10, face: PI, zone: [-20, -16, 20, 20], cut: 'berial_intro' });
      return b.done();
    },

    library(b) {
      b.env(Object.assign({}, INDOOR, { amb: [0.24, 0.24, 0.3], sunCol: [0.3, 0.34, 0.5], music: 'castle', name: 'Библиотека замка Фортуны' }));
      b.room(-12, -14, 12, 14, 10, { floor: 'woodfloor', wall: 'bookwall', ceil: 'ceiling', gaps: { s: [[-2, 2, 4.5]] } });
      for (const x of [-6, 6]) b.box(x - 1, 0, -7, x + 1, 5.2, -1, 'bookshelf');
      b.box(-7, 0, 2, -5, 5.2, 8, 'bookshelf'); b.box(5, 0, 2, 7, 5.2, 8, 'bookshelf');
      b.box(1.6, 0, 3.5, 3.6, 1, 6.5, 'table', { top: 'tabletop' }); b.box(3.6, 0, 4, 5, 3.1, 6, 'bookshelf');
      b.item('frag_m4a', 6, 5.8, 5);
      b.prop('globe', -2.5, 0, 9, 0, 1); b.prop('lectern', 0, 0, 11.5, PI, 1);
      for (const [x, z] of [[-10, -12], [10, -12], [-10, 11], [10, 11]]) b.breakable('vase', x, z, 0, 6);
      b.light(0, 8, 0, 18, [0.8, 0.8, 1.05]); b.light(-8, 4, 10, 8, [1.1, 0.7, 0.4]); b.light(8, 4, -10, 8, [1.1, 0.7, 0.4]);
      b.statue(-10, 5, PI / 2);
      b.spawn('start', 0, 10, PI);
      b.door('toHall', 0, -14, 0, 'grandhall:fromLib');
      b.fight('lib1', [-12, -14, 12, 14], [[fr(-4, -4), fr(4, -4)], [sc(-8, -9), sc(8, -9), sl(0, -10)], [fr(0, -8), sc(-3, 0), sc(3, 0)]], { auto: false });
      return b.done();
    },

    grandhall(b) {
      b.env(Object.assign({}, INDOOR, { amb: [0.26, 0.26, 0.32], sunCol: [0.28, 0.3, 0.45], music: 'castle', name: 'Главный зал' }));
      b.room(-18, -22, 18, 22, 16, { floor: 'marble', wall: 'castlewall', ceil: 'ceiling', gaps: { n: [[-2, 2, 4.5]], s: [[-2, 2, 4.5]] } });
      for (const [x, z] of [[-12, -14], [12, -14], [-12, 0], [12, 0], [-12, 14], [12, 14]]) b.pillar(x, z, 0.9, 16, 'castlestone');
      b.solidProp('spardaStatue', 0, 0, 9, PI, 1.6, 1.3, 5, 1.3);
      b.box(-2.5, 0, 7.5, 2.5, 0.6, 10.5, 'castlestone');
      b.prop('banner', -17.6, 6, -8, PI / 2, 1); b.prop('banner', -17.6, 6, 8, PI / 2, 1); b.prop('banner', 17.6, 6, -8, -PI / 2, 1); b.prop('banner', 17.6, 6, 8, -PI / 2, 1);
      b.prop('chandelier', 0, 12, -4, 0, 1.4); b.light(0, 10, -4, 22, [1.1, 0.85, 0.55]); b.light(-14, 4, -18, 10, [1, 0.6, 0.3]); b.light(14, 4, -18, 10, [1, 0.6, 0.3]);
      b.special('gyroMachine', { x: -16.8, z: -4, face: PI / 2, out: [-14.8, -4] });
      b.special('socket', { id: 'sockA', x: -7, z: -17 }); b.special('socket', { id: 'sockB', x: 7, z: -17 });
      b.barrier('hallGate', -2.2, -22.2, 2.2, -21.4, { flag: 'hallGate', kind: 'bars' });
      b.special('hint', { zone: [-18, -10, -10, 2], text: 'Механизм гироклинка: Buster (L) запускает клинок, удар мечом толкает его от Неро. Заполните оба гнезда у решётки.', unless: 'hallGate' });
      for (const [x, z] of [[-16, 20], [16, 20], [-16, -20], [16, -20]]) b.breakable('vase', x, z, 0, 6);
      b.door('fromLib', 0, 22, PI, 'library:toHall'); b.door('toCorr', 0, -22, 0, 'corridor:fromHall', { need: 'hallGate', lockMsg: 'Решётка закрыта. Два гнезда у стены пусты.' });
      b.fight('hall1', [-18, -22, 18, 17], [[sc(-6, -6), sc(6, -6), an(0, -12)], [an(-8, -10), sl(8, -4), sl(-8, 2)], [fr(0, -8), an(6, -14)]], { introCut: { 0: 'angelo_intro' } });
      return b.done();
    },

    corridor(b) {
      b.env(Object.assign({}, INDOOR, { amb: [0.22, 0.2, 0.22], music: 'castle', name: 'Коридор пушек' }));
      b.floor(-3, 0, 3, 60, 0, 'castlestone'); b.bounds(-6.5, 0, 6.5, 60);
      const alc = [[8, 12], [20, 24], [32, 36], [44, 48]];
      b.wallZ(-3.3, 0, 60, 8, 'castlewall', alc.map(a => [a[0], a[1], 4])); b.wallZ(3.3, 0, 60, 8, 'castlewall', alc.map(a => [a[0], a[1], 4]));
      for (const [z0, z1] of alc) for (const s of [-1, 1]) { b.floor(s < 0 ? -6.5 : 3, z0, s < 0 ? -3 : 6.5, z1, 0, 'castlestone'); b.wallZ(s * 6.5, z0 - 0.3, z1 + 0.3, 8, 'castlewall'); b.wallX(z0, s < 0 ? -6.5 : 3.3, s < 0 ? -3.3 : 6.5, 8, 'castlewall', [], { t: 0.6 }); b.wallX(z1, s < 0 ? -6.5 : 3.3, s < 0 ? -3.3 : 6.5, 8, 'castlewall', [], { t: 0.6 }); b.light(s * 5, 3, (z0 + z1) / 2, 7, [1.1, 0.6, 0.3]); b.prop('torch', s * 6.1, 2.6, (z0 + z1) / 2, s < 0 ? PI / 2 : -PI / 2, 1); }
      b.wallX(0, -3.3, 3.3, 8, 'castlewall', [[-1.6, 1.6, 4.2]]); b.wallX(60, -3.3, 3.3, 8, 'castlewall', [[-1.6, 1.6, 4.2]]);
      b.ceil(-6.5, 0, 6.5, 60, 8, 'ceiling');
      b.special('cannon', { id: 'cannon', x: 0, z: 56, face: PI, every: 2.3, speed: 15, dmg: 16, hp: 4, flag: 'cannonDown' });
      b.barrier('cannonGate', -1.6, 58.8, 1.6, 59.4, { flag: 'cannonDown', kind: 'bars' });
      for (const [x, z] of [[-5.5, 10], [5.5, 22], [-5.5, 34], [5.5, 46]]) b.breakable('vase', x, z, 0, 8);
      b.special('hint', { zone: [-3, 2, 3, 8], text: 'Огненная пушка в конце коридора. Укрывайтесь в нишах и разбейте её мечом.', unless: 'cannonDown' });
      b.door('fromHall', 0, 0, 0, 'grandhall:toCorr'); b.door('toGrave', 0, 60, PI, 'graveyard:fromCorr', { need: 'cannonDown', lockMsg: 'Сначала разберитесь с пушкой.' });
      b.fight('corr1', [-6.5, 18, 6.5, 40], [[sl(-5, 34), sl(5, 34), sc(0, 36)], [sc(-5, 22), sc(5, 22), sl(0, 38)]], { seal: false });
      return b.done();
    },

    graveyard(b) {
      b.env({ amb: [0.34, 0.38, 0.48], sun: [0.3, 0.8, -0.4], sunCol: [0.4, 0.46, 0.6], fog: [0.46, 0.5, 0.6], fogD: 0.03, sky: 'snow', music: 'boss', name: 'Кладбище воинов' });
      b.floor(-26, -26, 26, 26, 0, 'snow'); b.bounds(-26, -26, 26, 26);
      b.wallX(-26, -26, 26, 5, 'castlewall', [[-2, 2, 4.5]]); b.wallX(26, -26, 26, 5, 'castlewall'); b.wallZ(-26, -26, 26, 5, 'castlewall'); b.wallZ(26, -26, 26, 5, 'castlewall');
      b.box(-8, 0, 0, 8, 0.05, 16, 'ice', { solid: false });
      for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2, r = 19 + (i % 3); b.breakable('tombstone', Math.sin(a) * r, Math.cos(a) * r, 0, 5, a); }
      for (const [x, z] of [[-20, -20], [21, -19], [-21, 21], [20, 20]]) b.prop('deadtree', x, 0, z, x * z, 1.3);
      b.light(0, 14, 0, 40, [0.5, 0.55, 0.7]);
      b.fx('snowfall', 0, 0, 0, { w: 52, d: 52 });
      b.door('fromCorr', 0, -26, 0, 'corridor:toGrave');
      b.special('boss', { id: 'bael', x: 0, z: 9, face: PI, zone: [-24, -18, 24, 24], cut: 'bael_intro' });
      return b.done();
    },

    lab(b) {
      b.env(Object.assign({}, INDOOR, { amb: [0.22, 0.28, 0.3], sunCol: [0.2, 0.3, 0.35], fog: [0.02, 0.05, 0.06], music: 'lab', name: 'Подземная лаборатория' }));
      b.room(-9, 0, 9, 56, 8, { floor: 'labtile', wall: 'labwall', ceil: 'labceil', gaps: { n: [[-2, 2, 4.5]] } });
      for (let z = 8; z <= 48; z += 8) for (const s of [-1, 1]) { b.solidProp('tank', s * 7, 0, z, s * PI / 2, 1, 1.1, 5, 1.1); b.light(s * 6, 2.5, z, 7, [0.3, 1, 0.8]); }
      for (const [x, z] of [[-4.5, 14], [4.5, 30], [-4.5, 44]]) b.solidProp('console', x, 0, z, x > 0 ? -PI / 2 : PI / 2, 1, 0.5, 1.3, 0.9);
      for (const [x, z] of [[-3, 6], [3, 20], [-3, 36], [3, 50]]) b.breakable('labcrate', x, z, 0, 5);
      b.statue(7, 3, -PI / 2);
      b.spawn('start', 0, 3, 0);
      b.door('toGame', 0, 56, PI, 'gameroom:fromLab');
      b.fight('lab1', [-9, 10, 9, 30], [[an(0, 24), fr(-4, 26)], [sc(-4, 20), sc(4, 20), sl(0, 28)]]);
      b.fight('lab2', [-9, 34, 9, 54], [[an(-3, 48), an(3, 48)], [fr(-4, 44), fr(4, 44)]]);
      return b.done();
    },

    gameroom(b) {
      b.env(Object.assign({}, INDOOR, { amb: [0.28, 0.22, 0.3], sunCol: [0.3, 0.2, 0.3], music: 'lab', name: 'Игровая комната' }));
      b.room(-20, -20, 20, 20, 14, { floor: 'checker', wall: 'gamewall', ceil: 'labceil', gaps: { s: [[-2, 2, 4.5]], n: [[-2, 2, 4.5]] } });
      b.special('board', { r: 13, kinds: ['start', 'white', 'red', 'blue', 'white', 'red', 'yellow', 'blue', 'red', 'white', 'red', 'goal'], rolls: 7, frag: 7, orbs: 3, flag: 'gameGate' });
      b.barrier('gameGate', -2.2, 19.4, 2.2, 20.2, { flag: 'gameGate', kind: 'seal' });
      b.light(0, 10, 0, 30, [1, 0.8, 1]); b.light(-14, 5, -14, 10, [1, 0.3, 0.3]); b.light(14, 5, 14, 10, [0.3, 0.4, 1]);
      b.statue(-17, -17, PI / 4);
      b.special('hint', { zone: [-20, -20, 20, -10], text: 'Ударьте кубик мечом. Красная клетка — бой, синяя — награда, жёлтая — ещё бросок. Бросков: 7.', unless: 'gameGate' });
      b.door('fromLab', 0, -20, 0, 'lab:toGame'); b.door('toFalls', 0, 20, PI, 'falls:fromGame', { need: 'gameGate', lockMsg: 'Дойдите до финиша на игровом поле.' });
      return b.done();
    },

    falls(b) {
      b.env(Object.assign({}, NIGHT, { fog: [0.12, 0.14, 0.18], fogD: 0.02, music: 'explore', name: 'Водопад Форис', voidY: -16, view: 'falls' }));
      b.floor(-8, 0, 8, 22, 0, 'rockfloor'); b.floor(-3, 22, 3, 30, 0, 'bridge'); b.floor(-3, 42, 3, 50, 0, 'bridge'); b.floor(-10, 50, 10, 74, 0, 'rockfloor');
      b.wallZ(-8.5, 0, 22, 18, 'rockwall', [], { t: 1 }); b.wallZ(-10.5, 50, 74, 18, 'rockwall', [], { t: 1 });
      b.wallX(0, -8, 8, 10, 'rockwall'); b.wallX(74, -10, 10, 12, 'rockwall', [[-2, 2, 5]]);
      for (const z of [22, 42]) { b.box(-3.2, 0, z, -2.8, 1, z + 8, 'railing'); b.box(2.8, 0, z, 3.2, 1, z + 8, 'railing'); }
      b.bounds(-10, 0, 10, 74);
      b.grip(0, 6.5, 35.5);
      b.orbs(0, 8, 35.5, 5);
      b.prop('waterfall', 26, -20, 40, 0, 1);
      b.fx('mist', 14, 0, 40, { w: 16, d: 40 });
      for (const [x, z] of [[5, 6], [-5, 18], [7, 60], [-7, 68]]) b.breakable('rockpile', x, z, 0, 6);
      b.light(0, 8, 10, 18, [0.6, 0.7, 1]); b.light(0, 8, 62, 18, [0.6, 0.7, 1]);
      b.special('hint', { zone: [-3, 24, 3, 30], text: 'Мост обрушен. Hell Bound (L) к синей точке над пропастью.' });
      b.door('fromGame', 0, 0, 0, 'gameroom:toFalls'); b.door('toCreation', 0, 74, PI, 'creation:fromFalls');
      b.fight('falls0', [-8, 0, 8, 22], [[an(0, 15), sc(-4, 17), sc(4, 17)]]);
      b.fight('falls1', [-10, 50, 10, 74], [[me(-4, 64), me(4, 64)], [an(0, 68), me(0, 58)]], { introCut: { 0: 'mephisto_intro' } });
      return b.done();
    },

    creation(b) {
      b.env(Object.assign({}, INDOOR, { amb: [0.2, 0.26, 0.32], sunCol: [0.2, 0.3, 0.4], fog: [0.02, 0.04, 0.06], music: 'boss', name: 'Зал сотворения ангелов' }));
      b.room(-14, -16, 14, 16, 12, { floor: 'elecfloor', wall: 'labwall', ceil: 'labceil', gaps: { s: [[-2, 2, 4.5]] } });
      b.box(-7, 0, 10, 7, 4, 16, 'labwall'); b.box(-7, 4, 9.7, 7, 9.5, 10.1, 'glass', { glass: true, seeThrough: true });
      b.box(-7, 9.5, 10, 7, 12, 16, 'labwall');
      for (const [x, z] of [[-10, -6], [10, -6], [-10, 3], [10, 3]]) b.box(x - 1.5, 0, z - 1.5, x + 1.5, 1.2, z + 1.5, 'labmetal');
      for (const s of [-1, 1]) { b.solidProp('tank', s * 12, 0, -12, 0, 1, 1.1, 5, 1.1); b.light(s * 11, 3, -12, 8, [0.3, 1, 0.8]); }
      b.light(0, 8, 13, 10, [0.6, 0.8, 1]); b.light(0, 9, -4, 22, [0.6, 0.7, 0.9]);
      b.door('fromFalls', 0, -16, 0, 'falls:toCreation');
      b.special('boss', { id: 'agnus', x: 0, y: 4, z: 13, face: PI, zone: [-14, -14, 14, 9], cut: 'agnus_intro' });
      return b.done();
    },

    forest(b) {
      b.env(Object.assign({}, NIGHT, { amb: [0.2, 0.26, 0.26], fog: [0.1, 0.14, 0.14], fogD: 0.035, sky: 'forest', music: 'forest', name: 'Лес Митис' }));
      b.floor(-18, -32, 18, 32, 0, 'grass'); b.bounds(-18, -32, 18, 32);
      const trees = [[-15, -28], [-13, -18], [-16, -8], [-14, 4], [-16, 14], [-13, 24], [15, -27], [13, -16], [16, -4], [14, 8], [16, 18], [13, 27], [-9, 29], [9, 29], [-6, -30], [7, -31], [-10, 12], [11, -10], [-3, 22], [4, -18]];
      for (const [x, z] of trees) b.solidProp('tree', x, 0, z, x * 1.7 + z, 1 + ((x * 7 + z * 3) & 3) * 0.12, 0.5, 8, 0.5);
      for (const [x, z, s] of [[-8, -12, 1.4], [9, 3, 1.2], [-5, 18, 1], [6, 20, 1.6]]) b.box(x - s, 0, z - s * 0.8, x + s, s, z + s * 0.8, 'rock');
      b.prop('ruinArch', 0, 0, 30.6, 0, 1); b.box(-3.8, 0, 30, -2.6, 6, 31.2, 'stone', { render: false }); b.box(2.6, 0, 30, 3.8, 6, 31.2, 'stone', { render: false });
      b.prop('column', -7, 0, -4, 0, 1); b.prop('brokencolumn', 7, 0, 10, 1, 1);
      for (const [x, z] of [[-3, -20], [5, -6], [-9, 2], [2, 12], [10, 24]]) b.breakable('rockpile', x, z, 0, 6);
      b.orbs(-7, 4.8, -4, 6);
      b.light(0, 12, 0, 40, [0.45, 0.55, 0.7]);
      b.fx('fireflies', 0, 0, 0, { w: 34, d: 60 });
      b.statue(12, -24, -PI / 2);
      b.spawn('start', 0, -28, 0);
      b.door('toChurch', 0, 32, PI, 'church:fromForest');
      b.fight('forest1', [-18, -12, 18, 22], [[as(-5, 8), as(5, 8), as(0, 14)], [sc(-8, 4), sc(8, 4), sl(0, 16), as(0, 0)]], { introCut: { 0: 'assault_intro' } });
      return b.done();
    },

    church(b) {
      b.env(Object.assign({}, NIGHT, { amb: [0.24, 0.26, 0.34], fog: [0.1, 0.12, 0.16], fogD: 0.026, music: 'forest', name: 'Разрушенная церковь' }));
      b.floor(-12, -18, 12, 18, 0, 'ruinfloor'); b.bounds(-12, -18, 12, 18);
      b.wallX(-18, -12, 12, 7, 'ruinwall', [[-2, 2, 4.5]]); b.wallX(18, -12, 12, 9, 'ruinwall', [[-2, 2, 4.5]]);
      b.wallZ(12, -18, -4, 6, 'ruinwall'); b.wallZ(12, -4, 18, 3.5, 'ruinwall'); b.wallZ(-12, -18, 4, 4, 'ruinwall'); b.wallZ(-12, 10, 18, 7, 'ruinwall');
      b.box(-12.6, 0, 4, -11, 5.8, 10, 'ruinwall');
      b.box(-10, 0, 0, -8, 1.8, 2, 'rubble'); b.box(-11.5, 0, 2, -9.5, 3.9, 4.2, 'rubble');
      b.item('frag_m8a', -11.8, 6.4, 8);
      for (const [x, z] of [[-6, -10], [6, -10], [-6, 2], [6, 2]]) b.prop('brokencolumn', x, 0, z, x + z, 1.2);
      b.box(-3, 0, 13, 3, 1, 16, 'ruinfloor'); b.prop('spardaStatue', 0, 1, 15.5, PI, 1.1);
      for (const [x, z] of [[-9, -15], [9, -15], [9, 12], [-4, 10]]) b.breakable('rockpile', x, z, 0, 6);
      b.light(0, 10, 0, 30, [0.5, 0.6, 0.8]); b.light(0, 3, 14, 8, [1, 0.8, 0.5]);
      b.statue(-9, -14, PI / 2);
      b.door('fromForest', 0, -18, 0, 'forest:toChurch'); b.door('toWoods', 0, 18, PI, 'lostwoods:fromChurch');
      b.fight('church1', [-12, -8, 12, 18], [[as(-4, 8), as(4, 8), me(0, 12)], [sc(-6, 4), sc(6, 4), sl(0, 10), as(0, 0)], [me(-5, 10), me(5, 10)]]);
      return b.done();
    },

    lostwoods(b) {
      b.env(Object.assign({}, NIGHT, { amb: [0.2, 0.24, 0.22], fog: [0.2, 0.24, 0.22], fogD: 0.06, sky: 'forest', music: 'forest', name: 'Затерянный лес' }));
      b.floor(-16, -16, 16, 16, 0, 'grass'); b.bounds(-16, -16, 16, 16);
      const ring = [];
      for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2, s = Math.sin(a), c = Math.cos(a); if (Math.abs(s) < 0.16 || Math.abs(c) < 0.16) continue; ring.push([s * 13.5, c * 13.5]); }
      for (const [x, z] of ring) b.solidProp('tree', x, 0, z, x + z, 1.1, 0.5, 8, 0.5);
      for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14], [-15, 6], [15, -6], [6, 15], [-6, -15]]) b.solidProp('tree', x, 0, z, x - z, 1.3, 0.5, 8, 0.5);
      b.solidProp('tablet', 4, 0, -9, -0.4, 1, 0.8, 1.6, 0.3);
      b.special('hint', { zone: [0, -13, 8, -5], text: 'Надпись на камне: «Иди к свету вперёд, затем — по правую руку, затем — по левую. Кто собьётся, вернётся к камню».' });
      b.light(0, 10, 0, 26, [0.4, 0.55, 0.5]);
      b.fx('fireflies', 0, 0, 0, { w: 28, d: 28 });
      b.spawn('start', 0, -13, 0);
      for (const [id, x, z, f, d] of [['wN', 0, 16, PI, 'n'], ['wE', 16, 0, -PI / 2, 'e'], ['wW', -16, 0, PI / 2, 'w'], ['fromChurch', 0, -16, 0, 's']]) b.door(id, x, z, f, d === 's' ? 'church:toWoods' : null, { woods: d, dark: true });
      b.special('woods', { seq: ['n', 'e', 'w'], trap: [1, 'w'], frag: 'frag_m8b', to: 'bridge:fromWoods' });
      return b.done();
    },

    bridge(b) {
      b.env(Object.assign({}, NIGHT, { fog: [0.1, 0.1, 0.16], fogD: 0.018, music: 'boss', name: 'Мост Гран Альбум', voidY: -18, view: 'gorge' }));
      b.floor(-5, -40, 5, 40, 0, 'bridge'); b.floor(-14, -12, 14, 12, 0, 'bridge');
      for (const [x0, z0, x1, z1] of [[-5.4, -40, -5, -12], [5, -40, 5.4, -12], [-5.4, 12, -5, 40], [5, 12, 5.4, 40], [-14.4, -12, -14, 12], [14, -12, 14.4, 12], [-14, -12.4, -5, -12], [5, -12.4, 14, -12], [-14, 12, -5, 12.4], [5, 12, 14, 12.4]]) b.box(x0, 0, z0, x1, 1.1, z1, 'railing');
      b.bounds(-14.4, -40, 14.4, 40);
      for (const [x, z] of [[-12.5, -10.5], [12.5, -10.5], [-12.5, 10.5], [12.5, 10.5]]) { b.solidProp('angelStatue', x, 1.1, z, x < 0 ? PI / 2 : -PI / 2, 1, 0.8, 4, 0.8); b.light(x, 3, z, 9, [1, 0.8, 0.55]); }
      b.box(-4.5, 0, 39, 4.5, 8, 40, 'castlewall');
      b.prop('tower', 0, -30, 140, 0, 3);
      b.light(0, 14, 0, 40, [0.55, 0.6, 0.85]);
      b.spawn('fromWoods', 0, -37, 0);
      b.special('boss', { id: 'credo', x: 0, z: 6, face: PI, zone: [-14, -12, 14, 12], cut: 'credo_intro' });
      return b.done();
    }
  };

  const MISSIONS = [
    { id: 'm1', num: 1, name: 'Birds of Feathers', ru: 'Птицы одного полёта', place: 'Оперный театр, Фортуна', start: ['opera', 'start'], intro: 'm1_intro', par: { time: 240, style: 4000, orbs: 120 }, areas: ['opera'], goal: 'Остановить убийцу Санктуса.' },
    { id: 'm2', num: 2, name: "La Porte De L'Enfer", ru: 'Врата ада', place: 'Город Фортуна — Порт Каэрула', start: ['plaza', 'start'], intro: 'm2_intro', par: { time: 900, style: 16000, orbs: 1300 }, areas: ['plaza', 'store', 'cathedral', 'terrace', 'port', 'mine'], goal: 'Пройти через город к замку Фортуны.' },
    { id: 'm4', num: 4, name: 'Cold Blooded', ru: 'Хладнокровие', place: 'Замок Фортуны', start: ['library', 'start'], intro: 'm4_intro', par: { time: 780, style: 11000, orbs: 1000 }, areas: ['library', 'grandhall', 'corridor', 'graveyard'], goal: 'Найти вход в лабораторию Ордена.' },
    { id: 'm6', num: 6, name: 'Resurrection', ru: 'Воскрешение', place: 'Лаборатория под замком', start: ['lab', 'start'], intro: 'm6_intro', par: { time: 840, style: 10000, orbs: 1200 }, areas: ['lab', 'gameroom', 'falls', 'creation'], goal: 'Найти Агнуса и узнать правду об Ордене.' },
    { id: 'm8', num: 8, name: 'Profession of Faith', ru: 'Исповедание веры', place: 'Лес Митис — мост Гран Альбум', start: ['forest', 'start'], intro: 'm8_intro', par: { time: 840, style: 12000, orbs: 1100 }, areas: ['forest', 'church', 'lostwoods', 'bridge'], goal: 'Пробиться к штабу Ордена.' }
  ];

  const cache = {};
  function area(id) { if (!cache[id]) { const b = new S.Builder(id); cache[id] = AREAS[id](b); } return cache[id]; }

  S.AREAS = AREAS; S.MISSIONS = MISSIONS; S.area = area;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
