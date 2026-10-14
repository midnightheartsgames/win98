/**
 * Doom 98 — episode "Knee-Deep in Win 98": hand-built maps as sector polygons (see doom-level.js).
 * Coordinates in map units, y points north. Nested polygons carve pits, platforms and pillars.
 */
(function (D) {
  'use strict';
  const R = (x0, y0, x1, y1, p = {}) => Object.assign({ poly: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] }, p);   // edges: 0 south, 1 east, 2 north, 3 west
  const P = (pts, p = {}) => Object.assign({ poly: pts }, p);
  const door = (x0, y0, x1, y1, p = {}) => R(x0, y0, x1, y1, Object.assign({ door: {}, ftex: 'FLAT20', ctex: 'FLAT20', wall: 'DOORTRAK' }, p));
  const T = (type, x, y, angle = 0, extra = {}) => Object.assign({ type, x, y, angle }, extra);

  const MAPS = [];

  // ================================================================== E1M1 — UAC Hangar
  MAPS.push({
    id: 'E1M1', name: { ru: 'E1M1: Ангар', en: 'E1M1: Hangar' }, music: 'e1m1', sky: 'SKY1', par: 30, next: 'E1M2', demo: { x: 300, y: 250, angle: 200 },
    sectors: [
      R(0, 0, 512, 384, { id: 'start', floor: 0, ceil: 160, light: 176, wall: 'STARTAN', lower: 'STEP', ftex: 'FLOOR4', ctex: 'CEIL3' }),
      R(224, 160, 288, 224, { floor: 0, ceil: 160, light: 224, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'TLITE' }),
      R(48, 240, 176, 352, { floor: -16, ceil: 160, light: 176, ftex: 'NUKAGE1', hurt: 5, wall: 'STONE' }),
      R(128, 80, 160, 112, { solid: true, wall: 'SUPPORT' }),
      R(352, 80, 384, 112, { solid: true, wall: 'SUPPORT' }),
      // secret closet behind the west wall
      door(-16, 160, 0, 224, { door: { tex: 'STARTAN' }, edges: { 1: { secret: true } } }),
      R(-144, 128, -16, 256, { floor: 0, ceil: 128, light: 112, secret: true, wall: 'BROWN1', ftex: 'FLOOR5', ctex: 'CEIL5' }),
      // steps east to the brown storage room
      R(512, 128, 544, 256, { floor: 16, ceil: 160, light: 176, wall: 'STARTAN', lower: 'STEP', ftex: 'STEP1', ctex: 'CEIL3' }),
      R(544, 128, 576, 256, { floor: 32, ceil: 176, light: 176, wall: 'STARTAN', lower: 'STEP', ftex: 'STEP1', ctex: 'CEIL3' }),
      R(576, 128, 608, 256, { floor: 48, ceil: 192, light: 168, wall: 'STARTAN', lower: 'STEP', ftex: 'STEP1', ctex: 'CEIL3' }),
      R(608, 0, 864, 384, { id: 'storage', floor: 48, ceil: 224, light: 160, wall: 'BROWN1', ftex: 'FLOOR5', ctex: 'CEIL3' }),
      R(640, 288, 704, 352, { floor: 112, ceil: 224, light: 160, ftex: 'CRATOP', outer: 'CRATE' }),
      R(768, 32, 832, 96, { floor: 112, ceil: 224, light: 160, ftex: 'CRATOP', outer: 'CRATE' }),
      R(800, 96, 832, 128, { floor: 80, ceil: 224, light: 160, ftex: 'CRATOP2', outer: 'CRATE2' }),
      // north corridor to the courtyard
      door(224, 384, 288, 400),
      R(224, 400, 288, 640, { floor: 0, ceil: 128, light: 144, wall: 'STARG', ftex: 'FLOOR1', ctex: 'CEIL5' }),
      // courtyard under the sky with a nukage river and a bridge
      R(96, 640, 480, 960, { id: 'yard', floor: 0, ceil: 192, light: 192, wall: 'ROCK', ftex: 'RROCK', ctex: 'F_SKY1' }),
      R(96, 760, 480, 840, { floor: -24, ceil: 192, light: 192, wall: 'ROCK', ftex: 'NUKAGE1', ctex: 'F_SKY1', hurt: 10 }),
      R(256, 760, 320, 840, { floor: 0, ceil: 192, light: 192, wall: 'METAL', outer: 'METAL', ftex: 'FLAT20', ctex: 'F_SKY1' }),
      R(128, 880, 192, 944, { floor: 32, ceil: 192, light: 192, ftex: 'CRATOP', outer: 'CRATE', ctex: 'F_SKY1' }),
      // blue door and exit booth
      door(256, 960, 320, 976, { door: { key: 'blue', tex: 'DOORBLU' }, wall: 'LITEBLU' }),
      R(256, 976, 320, 1072, { floor: 0, ceil: 128, light: 200, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'TLITE', edges: { 2: { tex: 'SW2OFF', special: 'exit' } } }),
      // storage -> computer room
      door(704, 384, 768, 400, { floor: 48 }),
      R(704, 400, 768, 560, { floor: 48, ceil: 176, light: 128, wall: 'STARG', ftex: 'FLOOR1', ctex: 'CEIL5' }),
      R(608, 560, 864, 768, { id: 'computers', floor: 48, ceil: 176, light: 160, wall: 'TEKWALL', ftex: 'FLOOR1', ctex: 'CEIL5', edges: { 2: { tex: 'COMPUTE2' } } }),
      R(704, 672, 768, 736, { floor: 72, ceil: 176, light: 208, ftex: 'FLAT20', outer: 'METAL', ctex: 'TLITE2' }),
      // monster closet (opens when you walk in)
      door(864, 640, 880, 704, { floor: 48, tag: 'amb1', door: { tex: 'TEKWALL' } }),
      R(880, 608, 976, 736, { floor: 48, ceil: 176, light: 96, wall: 'BROWNHUG', ftex: 'FLOOR7', ctex: 'CEIL5' }),
      // lift from the computer room down into the courtyard
      R(480, 640, 608, 704, { floor: 48, ceil: 176, light: 160, lift: {}, wall: 'STARG', ftex: 'FLAT20', ctex: 'CEIL5' })
    ],
    triggers: [{ a: [704, 540], b: [768, 540], action: 'openDoor', tag: 'amb1' }],
    things: [
      T('player', 256, 64, 90),
      T('zombie', 400, 300, 270), T('zombie', 100, 180, 0), T('zombie', 440, 60, 180, { min: 1 }),
      T('barrel', 440, 200), T('barrel', 64, 96), T('barrel', 460, 230),
      T('clip', 300, 120), T('stimpack', 470, 350),
      T('garmor', -80, 192), T('shellbox', -110, 150), T('hbonus', -110, 234),
      T('zombie', 700, 200, 180), T('zombie', 800, 250, 180), T('sgguy', 820, 180, 180, { min: 1 }), T('zombie', 660, 60, 90, { min: 2 }),
      T('shotgun', 672, 320), T('shells', 800, 64), T('clip', 740, 120), T('ammobox', 816, 112),
      T('stimpack', 736, 480),
      T('imp', 800, 700, 180), T('imp', 640, 620, 90), T('sgguy', 820, 600, 180, { min: 1 }), T('bluecard', 736, 704), T('medikit', 650, 740), T('techlamp', 624, 752), T('techlamp', 848, 752),
      T('imp', 920, 640, 180), T('imp', 920, 700, 180, { min: 1 }),
      T('imp', 150, 920, 270), T('imp', 420, 900, 270), T('zombie', 200, 700, 90), T('zombie', 400, 700, 90, { min: 1 }), T('sgguy', 300, 920, 270, { min: 2 }),
      T('abonus', 288, 780), T('abonus', 288, 800), T('abonus', 288, 820), T('hbonus', 160, 912), T('barrel', 130, 680), T('barrel', 450, 700), T('ammobox', 440, 680),
      T('torchgreen', 240, 952), T('torchgreen', 336, 952)
    ]
  });

  // ================================================================== E1M2 — Nuclear Plant
  MAPS.push({
    id: 'E1M2', name: { ru: 'E1M2: Атомная станция', en: 'E1M2: Nuclear Plant' }, music: 'e1m2', sky: 'SKY1', par: 75, next: 'E1M3',
    sectors: [
      R(0, 0, 320, 256, { floor: 0, ceil: 128, light: 160, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'CEIL3' }),
      R(128, 96, 192, 160, { floor: 0, ceil: 128, light: 208, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'TLITE' }),
      door(128, 256, 192, 272),
      R(128, 272, 192, 448, { floor: 0, ceil: 112, light: 128, wall: 'STARG', ftex: 'FLOOR1', ctex: 'CEIL5' }),
      // nukage hall with a cross of walkways
      R(-64, 448, 448, 832, { id: 'hall', floor: -16, ceil: 192, light: 144, wall: 'METAL', ftex: 'NUKAGE1', ctex: 'CEIL5', hurt: 5 }),
      P([[128, 448], [192, 448], [192, 608], [448, 608], [448, 672], [192, 672], [192, 832], [128, 832], [128, 672], [-64, 672], [-64, 608], [128, 608]], { floor: 0, ceil: 192, light: 160, ftex: 'FLAT20', ctex: 'CEIL5', outer: 'METAL', wall: 'METAL' }),
      R(0, 512, 64, 576, { solid: true, wall: 'SUPPORT' }), R(320, 512, 384, 576, { solid: true, wall: 'SUPPORT' }),
      R(0, 736, 64, 800, { solid: true, wall: 'SUPPORT' }), R(320, 736, 384, 800, { solid: true, wall: 'SUPPORT' }),
      R(224, 704, 288, 768, { floor: -16, ceil: 192, light: 255, ftex: 'NUKAGE1', ctex: 'TLITE', hurt: 5, fx: 'glow' }),
      // west wing: lift up to the red key platform
      door(-80, 608, -64, 672),
      R(-336, 512, -80, 768, { floor: 0, ceil: 128, light: 128, fx: 'flicker', wall: 'BROWN1', ftex: 'FLOOR5', ctex: 'CEIL3' }),
      R(-336, 512, -240, 768, { floor: 64, ceil: 128, light: 128, wall: 'BROWN1', outer: 'BROWN1', ftex: 'FLOOR5', ctex: 'CEIL3' }),
      R(-240, 576, -176, 704, { floor: 64, ceil: 128, light: 144, lift: {}, wall: 'BROWN1', ftex: 'FLAT20', ctex: 'CEIL3' }),
      // east wing computer room and its secret closet
      door(448, 608, 464, 672),
      R(464, 512, 720, 768, { floor: 0, ceil: 160, light: 176, wall: 'TEKWALL', ftex: 'FLOOR1', ctex: 'CEIL5', edges: { 2: { tex: 'COMPUTE1' } } }),
      R(560, 608, 624, 672, { floor: 24, ceil: 160, light: 176, ftex: 'FLAT20', ctex: 'TLITE2', outer: 'COMPUTE2' }),
      door(720, 608, 736, 672, { door: { tex: 'TEKWALL' }, edges: { 3: { secret: true } } }),
      R(736, 576, 832, 704, { floor: 0, ceil: 128, light: 96, secret: true, wall: 'BROWNHUG', ftex: 'FLOOR7', ctex: 'CEIL5' }),
      // red door, corridor and exit
      door(128, 832, 192, 848, { door: { key: 'red', tex: 'DOORRED' }, wall: 'LITERED' }),
      R(128, 848, 192, 960, { floor: 0, ceil: 128, light: 112, wall: 'STARG', ftex: 'FLOOR1', ctex: 'CEIL5' }),
      R(96, 960, 224, 1056, { floor: 0, ceil: 128, light: 176, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'TLITE' }),
      R(128, 1056, 192, 1072, { floor: 0, ceil: 128, light: 176, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'CEIL3', edges: { 2: { tex: 'SW2OFF', special: 'exit' } } })
    ],
    things: [
      T('player', 160, 40, 90),
      T('zombie', 60, 200, 270), T('zombie', 260, 200, 270), T('sgguy', 280, 60, 180, { min: 1 }), T('shotgun', 240, 60), T('shells', 60, 40), T('barrel', 30, 30), T('barrel', 290, 30), T('techlamp', 20, 236), T('techlamp', 300, 236),
      T('sgguy', 160, 420, 270),
      T('imp', -40, 640, 0), T('imp', 420, 640, 180), T('zombie', 160, 800, 270), T('imp', 160, 700, 270, { min: 1 }), T('zombie', 300, 640, 180), T('imp', 30, 640, 0, { min: 2 }),
      T('radsuit', 150, 500), T('stimpack', 170, 540), T('clip', 400, 650), T('abonus', 160, 620), T('abonus', 160, 640), T('abonus', 160, 660),
      T('imp', -300, 560, 0), T('imp', -300, 720, 0), T('sgguy', -150, 700, 180), T('zombie', -150, 560, 180), T('imp', -120, 640, 180, { min: 2 }),
      T('redcard', -300, 640), T('medikit', -120, 530), T('shells', -120, 740),
      T('sgguy', 600, 720, 270), T('sgguy', 680, 560, 180), T('imp', 520, 720, 270), T('demon', 520, 560, 0, { min: 1 }), T('garmor', 690, 740), T('clip', 500, 540), T('shellbox', 592, 640),
      T('chaingun', 784, 640), T('ammobox', 760, 600), T('ammobox', 800, 680),
      T('zombie', 160, 930, 270), T('zombie', 160, 880, 270, { min: 2 }),
      T('stimpack', 120, 1000), T('barrel', 110, 1040), T('techlamp', 210, 1040)
    ]
  });

  // ================================================================== E1M3 — Toxin Refinery (secret exit to E1M9)
  MAPS.push({
    id: 'E1M3', name: { ru: 'E1M3: Очистной завод', en: 'E1M3: Toxin Refinery' }, music: 'e1m3', sky: 'SKY1', par: 90, next: 'E1M4', secretNext: 'E1M9',
    sectors: [
      R(0, 0, 256, 256, { floor: 32, ceil: 160, light: 176, wall: 'BROWN1', ftex: 'FLOOR5', ctex: 'CEIL3' }),
      R(96, 256, 160, 288, { floor: 24, ceil: 160, light: 176, wall: 'BROWN1', lower: 'STEP', ftex: 'STEP1', ctex: 'CEIL3' }),
      R(96, 288, 160, 320, { floor: 12, ceil: 160, light: 176, wall: 'BROWN1', lower: 'STEP', ftex: 'STEP1', ctex: 'CEIL3' }),
      // hub with a nukage pit, an island teleporter and a raisable bridge
      R(-128, 320, 384, 704, { id: 'hub', floor: 0, ceil: 224, light: 160, wall: 'STONE', lower: 'STEP', ftex: 'FLOOR7', ctex: 'CEIL5' }),
      R(0, 416, 256, 608, { floor: -32, ceil: 224, light: 176, wall: 'STONE', ftex: 'NUKAGE1', ctex: 'CEIL5', hurt: 10 }),
      R(0, 416, 32, 448, { floor: -16, ceil: 224, light: 176, ftex: 'STEP1', ctex: 'CEIL5', outer: 'STEP' }),
      R(96, 480, 160, 544, { floor: 0, ceil: 224, light: 255, ftex: 'GATE', ctex: 'TLITE', outer: 'METAL', teleport: 't1', fx: 'glow' }),
      R(160, 496, 256, 528, { floor: -32, ceil: 224, light: 176, ftex: 'FLAT20', ctex: 'CEIL5', outer: 'PLAT1', tag: 'bridge', raiseTo: 0, moveSpeed: 2 }),
      // yellow key room reachable only by teleporter; a ledge drops back to the hub
      R(-448, 320, -256, 512, { floor: 64, ceil: 192, light: 192, wall: 'COMPUTE1', ftex: 'FLOOR1', ctex: 'TLITE2' }),
      R(-256, 384, -128, 448, { floor: 64, ceil: 160, light: 144, wall: 'STARG', ftex: 'FLOOR1', ctex: 'CEIL5' }),
      // east armory with the bridge switch
      door(384, 448, 400, 512),
      R(400, 384, 592, 576, { floor: 0, ceil: 128, light: 112, fx: 'blink', wall: 'METAL', ftex: 'FLAT5', ctex: 'CEIL5' }),
      R(464, 576, 528, 592, { floor: 0, ceil: 128, light: 144, wall: 'METAL', ftex: 'FLAT5', ctex: 'CEIL5', edges: { 2: { tex: 'SW1OFF', special: 'raiseFloorTo', tag: 'bridge' } } }),
      // yellow door to the refinery yard
      door(96, 704, 160, 720, { door: { key: 'yellow', tex: 'DOORYEL' }, wall: 'LITEYEL' }),
      R(-64, 720, 320, 1040, { id: 'yard', floor: 0, ceil: 224, light: 200, wall: 'ROCK', ftex: 'RROCK', ctex: 'F_SKY1' }),
      R(-64, 848, 96, 912, { floor: -16, ceil: 224, light: 200, ftex: 'NUKAGE1', ctex: 'F_SKY1', hurt: 5, wall: 'ROCK' }),
      R(160, 848, 320, 912, { floor: -16, ceil: 224, light: 200, ftex: 'NUKAGE1', ctex: 'F_SKY1', hurt: 5, wall: 'ROCK' }),
      R(0, 960, 64, 1024, { floor: 64, ceil: 224, light: 200, ftex: 'CRATOP', ctex: 'F_SKY1', outer: 'CRATE' }),
      R(256, 752, 304, 800, { floor: 48, ceil: 224, light: 200, ftex: 'CRATOP2', ctex: 'F_SKY1', outer: 'CRATE2' }),
      door(96, 1040, 160, 1056),
      R(64, 1056, 192, 1152, { floor: 0, ceil: 128, light: 176, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'TLITE' }),
      R(96, 1152, 160, 1168, { floor: 0, ceil: 128, light: 176, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'CEIL3', edges: { 2: { tex: 'SW2OFF', special: 'exit' } } }),
      // secret passage to the secret exit
      door(320, 800, 336, 864, { door: { tex: 'ROCK' }, edges: { 3: { secret: true } } }),
      R(336, 800, 528, 864, { floor: 0, ceil: 128, light: 96, secret: true, wall: 'BROWNHUG', ftex: 'FLOOR7', ctex: 'CEIL5' }),
      R(528, 752, 656, 912, { floor: 0, ceil: 144, light: 160, wall: 'MARBLE', ftex: 'MFLR', ctex: 'CEIL5' }),
      R(656, 800, 672, 864, { floor: 0, ceil: 144, light: 160, wall: 'MARBLE', ftex: 'MFLR', ctex: 'CEIL5', edges: { 1: { tex: 'SW3OFF', special: 'secretexit' } } })
    ],
    things: [
      T('player', 128, 40, 90),
      T('zombie', 40, 200, 0), T('zombie', 220, 200, 180), T('sgguy', 128, 220, 270, { min: 1 }), T('shotgun', 60, 60), T('clip', 200, 60),
      T('imp', -100, 680, 270), T('imp', 360, 680, 270), T('imp', 360, 340, 90, { min: 1 }), T('sgguy', -100, 340, 90), T('zombie', 300, 400, 180), T('zombie', -60, 600, 0, { min: 1 }),
      T('stimpack', -100, 420), T('shells', 330, 640), T('barrel', -110, 460), T('barrel', 360, 460),
      T('demon', 500, 420, 180), T('demon', 520, 520, 180, { min: 1 }), T('spectre', 450, 540, 0, { min: 2 }), T('launcher', 560, 480), T('rocketammo', 420, 400), T('rocketammo', 440, 400), T('shellbox', 570, 400), T('medikit', 420, 560),
      T('teledest', -352, 352, 90, { id: 't1' }), T('yellowcard', -352, 440), T('imp', -300, 480, 270), T('imp', -420, 480, 270, { min: 1 }), T('medikit', -420, 340), T('abonus', -200, 416), T('abonus', -168, 416),
      T('imp', 32, 992, 270), T('imp', 280, 1000, 270), T('sgguy', 128, 1000, 270), T('imp', 280, 776, 180, { min: 1 }), T('zombie', 200, 950, 270), T('caco', 128, 900, 270, { min: 2 }),
      T('barrel', 220, 740), T('barrel', 240, 760), T('ammobox', -40, 760), T('stimpack', -30, 1000), T('shells', -30, 970),
      T('zombie', 100, 1120, 270), T('zombie', 160, 1100, 270, { min: 1 }),
      T('soulsphere', 430, 832), T('imp', 600, 880, 180), T('imp', 600, 780, 180), T('torchred', 548, 772), T('torchred', 636, 892)
    ]
  });

  // ================================================================== E1M9 — Military Base (secret)
  MAPS.push({
    id: 'E1M9', name: { ru: 'E1M9: Секретная база', en: 'E1M9: Military Base' }, music: 'e1m9', sky: 'SKY1', par: 120, next: 'E1M4',
    sectors: [
      R(0, 0, 256, 256, { floor: 0, ceil: 128, light: 176, wall: 'STARG', ftex: 'FLOOR1', ctex: 'TLITE2' }),
      R(256, 96, 320, 160, { floor: 0, ceil: 112, light: 144, wall: 'SUPPORT', ftex: 'FLAT20', ctex: 'CEIL5' }),
      R(320, 0, 576, 256, { floor: 0, ceil: 160, light: 160, wall: 'BRICK', ftex: 'FLOOR5', ctex: 'CEIL3' }),
      R(416, 96, 480, 160, { floor: 32, ceil: 160, light: 208, ftex: 'CRATOP2', ctex: 'TLITE', outer: 'CRATE2' }),
      door(576, 96, 592, 160), R(592, 96, 640, 160, { floor: 0, ceil: 112, light: 128, wall: 'STARG', ftex: 'FLAT20', ctex: 'CEIL5' }),
      R(640, 0, 896, 256, { floor: 0, ceil: 192, light: 144, wall: 'COMPUTE2', ftex: 'FLOOR4', ctex: 'CEIL5' }),
      R(736, 96, 800, 160, { floor: 24, ceil: 192, light: 224, ftex: 'FLAT20', ctex: 'TLITE', outer: 'METAL' }),
      R(96, 256, 160, 320, { floor: 0, ceil: 112, light: 144, wall: 'SUPPORT', ftex: 'FLAT20', ctex: 'CEIL5' }),
      R(0, 320, 256, 576, { floor: -32, ceil: 128, light: 128, fx: 'strobe', wall: 'STONE', lower: 'STEP', ftex: 'FLOOR7', ctex: 'CEIL5' }),
      R(96, 320, 160, 352, { floor: -16, ceil: 128, light: 144, wall: 'STONE', lower: 'STEP', ftex: 'STEP1', ctex: 'CEIL5' }),
      door(256, 416, 272, 480, { floor: -32 }), R(272, 416, 320, 480, { floor: -16, ceil: 112, light: 128, wall: 'STARG', lower: 'STEP', ftex: 'FLAT20', ctex: 'CEIL5' }),
      R(320, 320, 576, 576, { floor: 0, ceil: 176, light: 160, wall: 'TEKWALL', ftex: 'FLAT14', ctex: 'CEIL3' }),
      R(368, 368, 416, 416, { solid: true, wall: 'SUPPORT' }), R(480, 480, 528, 528, { solid: true, wall: 'SUPPORT' }),
      door(736, 256, 800, 272, { door: { key: 'blue', tex: 'DOORBLU' }, wall: 'LITEBLU' }), R(736, 272, 800, 320, { floor: 0, ceil: 128, light: 128, wall: 'STARG', ftex: 'FLAT20', ctex: 'CEIL5' }),
      R(640, 320, 896, 576, { floor: 0, ceil: 160, light: 176, wall: 'STONE', ftex: 'FLOOR4', ctex: 'CEIL3' }),
      R(704, 384, 832, 512, { floor: -24, ceil: 160, light: 176, ftex: 'NUKAGE1', ctex: 'CEIL3', hurt: 5, wall: 'STONE' }),
      R(704, 384, 736, 416, { floor: -8, ceil: 160, light: 176, ftex: 'STEP1', ctex: 'CEIL3', outer: 'STEP' }),
      door(736, 576, 800, 592), R(704, 592, 832, 704, { floor: 0, ceil: 128, light: 192, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'TLITE' }),
      R(736, 704, 800, 720, { floor: 0, ceil: 128, light: 192, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'CEIL3', edges: { 2: { tex: 'SW2OFF', special: 'exit' } } })
    ],
    things: [
      T('player', 128, 40, 90),
      T('berserk', 448, 128), T('sgguy', 520, 220, 180), T('demon', 360, 40, 0), T('spectre', 540, 40, 180, { min: 1 }), T('clip', 380, 200), T('stimpack', 540, 128),
      T('plasmagun', 768, 128), T('cellpack', 680, 40), T('cell', 860, 220), T('imp', 700, 220, 270), T('imp', 860, 40, 90), T('sgguy', 850, 128, 180, { min: 1 }),
      T('ssg', 448, 448), T('shellbox', 350, 540), T('bluecard', 540, 360), T('spectre', 400, 520, 0), T('spectre', 520, 360, 90, { min: 1 }), T('demon', 360, 350, 0, { min: 2 }),
      T('imp', 40, 540, 270), T('imp', 220, 540, 270), T('zombie', 128, 500, 270), T('medikit', 30, 350), T('rocketammo', 220, 350), T('launcher', 128, 450),
      T('caco', 768, 450, 270, { min: 1 }), T('imp', 670, 540, 0), T('imp', 870, 540, 180), T('sgguy', 870, 350, 180), T('medikit', 670, 350), T('cellpack', 860, 540),
      T('zombie', 740, 680, 270), T('zombie', 800, 680, 270), T('techlamp', 712, 600), T('techlamp', 824, 600)
    ]
  });

  // ================================================================== E1M4 — Command Center
  MAPS.push({
    id: 'E1M4', name: { ru: 'E1M4: Командный центр', en: 'E1M4: Command Center' }, music: 'e1m4', sky: 'SKY1', par: 120, next: 'E1M5',
    sectors: [
      R(0, 0, 256, 192, { floor: 0, ceil: 128, light: 160, wall: 'STARG', ftex: 'FLOOR1', ctex: 'CEIL3' }),
      door(-16, 64, 0, 128, { door: { tex: 'STARG' }, edges: { 1: { secret: true } } }),
      R(-144, 32, -16, 160, { floor: 0, ceil: 128, light: 96, secret: true, wall: 'BROWN1', ftex: 'FLOOR5', ctex: 'CEIL5' }),
      door(96, 192, 160, 208), R(96, 208, 160, 256, { floor: 0, ceil: 128, light: 144, wall: 'STARG', ftex: 'FLAT20', ctex: 'CEIL5' }),
      // courtyard
      R(-192, 256, 448, 768, { id: 'court', floor: 0, ceil: 288, light: 200, wall: 'ROCK', ftex: 'RROCK', ctex: 'F_SKY1' }),
      R(64, 448, 192, 576, { solid: true, wall: 'STONE' }),
      R(-192, 640, -64, 768, { floor: 48, ceil: 288, light: 200, ftex: 'GRNROCK', ctex: 'F_SKY1', outer: 'ROCK' }),
      R(320, 640, 448, 768, { floor: 48, ceil: 288, light: 200, ftex: 'GRNROCK', ctex: 'F_SKY1', outer: 'ROCK' }),
      R(-64, 320, 0, 384, { floor: -16, ceil: 288, light: 200, ftex: 'NUKAGE1', ctex: 'F_SKY1', hurt: 5, wall: 'ROCK' }),
      R(256, 320, 384, 384, { floor: -16, ceil: 288, light: 200, ftex: 'NUKAGE1', ctex: 'F_SKY1', hurt: 5, wall: 'ROCK' }),
      // west building with a lift to the upper floor (blue key)
      door(-208, 448, -192, 512),
      R(-448, 384, -208, 576, { floor: 0, ceil: 160, light: 144, wall: 'BROWN1', ftex: 'FLOOR5', ctex: 'CEIL3' }),
      R(-448, 576, -208, 768, { floor: 96, ceil: 224, light: 160, wall: 'BROWN1', ftex: 'FLOOR5', ctex: 'CEIL3' }),
      R(-352, 512, -288, 576, { floor: 96, ceil: 224, light: 176, lift: {}, wall: 'BROWN1', ftex: 'FLAT20', ctex: 'CEIL3' }),
      // blue door to the computer hall (red key)
      door(96, 768, 160, 784, { door: { key: 'blue', tex: 'DOORBLU' }, wall: 'LITEBLU' }),
      R(-64, 784, 320, 1040, { floor: 0, ceil: 160, light: 128, wall: 'TEKWALL', ftex: 'FLOOR1', ctex: 'CEIL5', edges: { 2: { tex: 'COMPUTE2' } } }),
      R(224, 944, 288, 1008, { floor: 16, ceil: 160, light: 208, ftex: 'FLAT20', ctex: 'TLITE2', outer: 'METAL' }),
      R(-32, 816, 32, 880, { solid: true, wall: 'COMPUTE1' }), R(-32, 944, 32, 1008, { solid: true, wall: 'COMPUTE1' }),
      // red door to the barons and the exit
      door(448, 448, 464, 512, { door: { key: 'red', tex: 'DOORRED' }, wall: 'LITERED' }),
      R(464, 384, 720, 640, { floor: 0, ceil: 192, light: 112, wall: 'MARBLE', ftex: 'MFLR', ctex: 'CEIL5', edges: { 1: { tex: 'MARBFACE' } } }),
      R(560, 480, 624, 544, { floor: -8, ceil: 192, light: 255, ftex: 'BLOOD1', ctex: 'CEIL5', wall: 'MARBLE', fx: 'glow' }),
      door(720, 480, 736, 544),
      R(736, 448, 864, 576, { floor: 0, ceil: 128, light: 176, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'TLITE' }),
      R(864, 480, 880, 544, { floor: 0, ceil: 128, light: 176, wall: 'STARTAN', ftex: 'FLOOR4', ctex: 'CEIL3', edges: { 1: { tex: 'SW2OFF', special: 'exit' } } })
    ],
    things: [
      T('player', 128, 32, 90),
      T('launcher', -80, 96), T('rocketbox', -110, 60), T('shellbox', -110, 130),
      T('zombie', 30, 160, 0), T('sgguy', 220, 160, 180), T('shells', 30, 40), T('clip', 220, 40),
      T('caco', 128, 700, 270, { min: 1 }), T('caco', -100, 450, 0, { min: 2 }), T('imp', -128, 700, 270), T('imp', 384, 700, 270), T('imp', -150, 720, 270, { min: 1 }), T('imp', 410, 720, 270, { min: 1 }),
      T('zombie', 300, 300, 90), T('zombie', 0, 600, 0), T('sgguy', 250, 600, 180), T('sgguy', -120, 300, 90, { min: 1 }), T('barrel', 220, 420), T('barrel', 240, 440), T('barrel', 30, 700),
      T('medikit', 400, 300), T('rocketammo', -150, 500), T('shellbox', 300, 450), T('ammobox', 20, 420),
      T('sgguy', -300, 420, 90), T('imp', -420, 540, 0), T('zombie', -240, 540, 180, { min: 1 }), T('stimpack', -420, 400),
      T('bluecard', -420, 740), T('sgguy', -300, 700, 270), T('sgguy', -250, 620, 270), T('sgguy', -400, 620, 0, { min: 1 }), T('medikit', -240, 740), T('barmor', -330, 740),
      T('imp', 100, 1010, 270), T('imp', 280, 820, 180), T('demon', 128, 900, 270), T('demon', 200, 980, 270, { min: 1 }), T('spectre', 70, 820, 0, { min: 2 }), T('caco', 128, 1000, 270, { min: 1 }),
      T('redcard', 256, 976), T('cellpack', 300, 810), T('rocketbox', -40, 1010), T('stimpack', 100, 820),
      T('baron', 680, 600, 180), T('baron', 680, 420, 180, { min: 1 }), T('torchgreen', 490, 410), T('torchgreen', 490, 614), T('medikit', 500, 500), T('rocketbox', 500, 520),
      T('techlamp', 750, 460), T('techlamp', 750, 564)
    ]
  });

  // ================================================================== E1M5 — Hell Gate (boss)
  const oct = (cx, cy, a, b) => [[cx + a, cy - b], [cx + b, cy - a], [cx + b, cy + a], [cx + a, cy + b], [cx - a, cy + b], [cx - b, cy + a], [cx - b, cy - a], [cx - a, cy - b]];
  MAPS.push({
    id: 'E1M5', name: { ru: 'E1M5: Врата ада', en: 'E1M5: Hell Gate' }, music: 'e1m5', sky: 'SKY3', par: 150, next: null, bossType: 'cyber', bossAction: { action: 'exit' },
    sectors: [
      R(0, 0, 256, 256, { floor: 0, ceil: 160, light: 144, wall: 'MARBLE', ftex: 'MFLR', ctex: 'CEIL5', edges: { 2: { tex: 'MARBFACE' } } }),
      R(96, 96, 160, 160, { floor: -8, ceil: 160, light: 255, ftex: 'LAVA1', ctex: 'CEIL5', hurt: 5, wall: 'MARBLE', fx: 'flicker' }),
      door(96, 256, 160, 272, { door: { tex: 'SKIN' } }),
      R(96, 272, 160, 512, { floor: 0, ceil: 128, light: 112, wall: 'SKIN', ftex: 'FLOOR7', ctex: 'CEIL5' }),
      // the arena: octagon under a burning sky
      P(oct(128, 960, 185, 448), { id: 'arena', floor: 0, ceil: 384, light: 176, wall: 'FIREWALL1', ftex: 'RROCK', ctex: 'F_SKY1' }),
      R(-100, 800, -36, 864, { solid: true, wall: 'MARBFACE' }), R(292, 800, 356, 864, { solid: true, wall: 'MARBFACE' }),
      R(-100, 1056, -36, 1120, { solid: true, wall: 'MARBFACE' }), R(292, 1056, 356, 1120, { solid: true, wall: 'MARBFACE' }),
      R(64, 1180, 192, 1260, { floor: -16, ceil: 384, light: 255, ftex: 'LAVA1', ctex: 'F_SKY1', hurt: 20, wall: 'RROCK' }),
      R(-200, 900, -140, 1020, { floor: -16, ceil: 384, light: 255, ftex: 'LAVA1', ctex: 'F_SKY1', hurt: 20, wall: 'RROCK' }),
      R(396, 900, 456, 1020, { floor: -16, ceil: 384, light: 255, ftex: 'LAVA1', ctex: 'F_SKY1', hurt: 20, wall: 'RROCK' }),
      R(64, 900, 192, 1020, { floor: 24, ceil: 384, light: 200, ftex: 'MFLR', ctex: 'F_SKY1', outer: 'MARBLE' }),
      // west armory: the BFG
      door(-336, 928, -320, 992, { door: { tex: 'SKIN' } }),
      R(-592, 864, -336, 1056, { floor: 0, ceil: 160, light: 112, fx: 'flicker', wall: 'SKIN', ftex: 'FLOOR7', ctex: 'CEIL5' }),
      R(-560, 928, -496, 992, { floor: 16, ceil: 160, light: 224, ftex: 'GATE', ctex: 'CEIL5', outer: 'MARBLE' }),
      // east storage and a secret stash
      door(576, 928, 592, 992, { door: { tex: 'SKIN' } }),
      R(592, 864, 848, 1056, { floor: 0, ceil: 160, light: 128, wall: 'MARBLE', ftex: 'MFLR', ctex: 'CEIL5' }),
      door(848, 928, 864, 992, { door: { tex: 'MARBLE' }, edges: { 3: { secret: true } } }),
      R(864, 896, 960, 1024, { floor: 0, ceil: 128, light: 96, secret: true, wall: 'SKIN', ftex: 'BLOOD1', ctex: 'CEIL5' })
    ],
    things: [
      T('player', 128, 40, 90),
      T('rocketbox', 30, 30), T('shellbox', 226, 30), T('medikit', 30, 226), T('cellpack', 226, 226), T('torchred', 20, 140), T('torchred', 236, 140), T('imp', 128, 220, 270),
      T('imp', 128, 480, 270), T('soul', 128, 400, 270, { min: 1 }),
      T('cyber', 128, 1300, 270),
      T('imp', -200, 800, 0), T('imp', 450, 800, 180), T('imp', -200, 1120, 0, { min: 1 }), T('imp', 450, 1120, 180, { min: 1 }), T('soul', 0, 960, 0), T('soul', 260, 960, 180), T('caco', 128, 720, 90, { min: 2 }),
      T('rocketbox', -60, 700), T('rocketbox', 320, 700), T('medikit', 128, 960), T('cell', 100, 940), T('cell', 156, 940), T('torchblue', -80, 700), T('torchblue', 336, 700), T('candelabra', 128, 1380),
      T('bfg', -528, 960), T('cellpack', -560, 890), T('cellpack', -560, 1030), T('baron', -400, 960, 0, { min: 1 }), T('imp', -450, 900, 0), T('imp', -450, 1020, 0), T('firecan', -580, 876), T('firecan', -580, 1044),
      T('rocketbox', 820, 890), T('medikit', 820, 1030), T('barmor', 720, 960), T('baron', 700, 1030, 180, { min: 2 }), T('demon', 650, 900, 180), T('spectre', 650, 1000, 180, { min: 1 }),
      T('soulsphere', 912, 960), T('invuln', 912, 1000), T('evileye', 900, 920)
    ]
  });

  D.MAPS = MAPS;
  D.MAPHELP = { R, P, door, T };
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Doom98 = globalThis.Doom98 || {});
