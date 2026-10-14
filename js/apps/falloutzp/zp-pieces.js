(function (Z) {
  'use strict';

  Z.PIECE_SOLID = {
    box: p => p.solid !== false, cyl: p => p.solid !== false, wall: () => true, fence: () => true, palisade: () => true, shack: () => true, hut: () => true, tower: () => true,
    church: () => true, stall: () => true, kiosk: () => true, sandbags: () => true, block: () => true, wire: () => false, wreck: () => true, lamp: () => true,
    tank: () => true, statue: () => true, tent: () => true, pole: () => true, sign: () => false, prop: p => !!(Z.PROP_SIZE[p.prop]) && p.solid !== false, tree: () => true,
    pear: () => true, bigoak: () => true, stone: () => true, rubble: () => true, picket: () => true, hedgehog: () => true, well: () => true, booth: () => true, banner: () => false, pier: () => false, ruinwall: () => true, boat: () => true, hydrofoil: () => true,
    container: () => true, busstop: () => true, bench: () => false, gate: () => false, arch: () => false, deck: () => false, dam: () => false, pylon: () => true, chimney: () => true, cistern: () => true, bed: () => false, haystack: () => true, crossbar: () => false
  };

  Z.pieceBox = p => {
    const s = p.size || [1, 1, 1];
    switch (p.kind) {
      case 'fence': case 'wall': case 'palisade': case 'ruinwall': case 'sandbags': case 'wire': case 'picket': { const L = Math.hypot(p.x2 - p.x, p.z2 - p.z); return { cx: (p.x + p.x2) / 2, cz: (p.z + p.z2) / 2, sx: L, sz: p.thick || (p.kind === 'palisade' ? 0.5 : p.kind === 'sandbags' ? 0.9 : 0.2), yaw: Math.atan2(p.z2 - p.z, p.x2 - p.x), h: p.h || (p.kind === 'palisade' ? 3.6 : p.kind === 'sandbags' ? 1.1 : p.kind === 'picket' ? 1.2 : 2) }; }
      case 'cyl': case 'tower': case 'chimney': case 'cistern': case 'pole': case 'tree': case 'pear': case 'bigoak': case 'lamp': case 'stone': case 'pylon': return { r: p.r || (p.kind === 'tower' ? 2.2 : p.kind === 'pear' ? 0.6 : p.kind === 'bigoak' ? 1.2 : p.kind === 'lamp' ? 0.15 : p.kind === 'pole' ? 0.2 : p.kind === 'pylon' ? 2.5 : 0.5), h: p.h || (p.kind === 'tower' ? 9 : p.kind === 'lamp' ? 7 : 4) };
      case 'prop': { const sz = Z.PROP_SIZE[p.prop] || [1, 1, 1]; return { cx: p.x, cz: p.z, sx: sz[0], sz: sz[2], yaw: p.yaw || 0, h: sz[1] }; }
      case 'shack': return { cx: p.x, cz: p.z, sx: s[0], sz: s[2], yaw: p.yaw || 0, h: s[1] + 1.2 };
      case 'hut': return { cx: p.x, cz: p.z, sx: s[0], sz: s[2], yaw: p.yaw || 0, h: s[1] + 2 };
      case 'church': return { cx: p.x, cz: p.z, sx: 8, sz: 12, yaw: p.yaw || 0, h: 14 };
      case 'stall': return { cx: p.x, cz: p.z, sx: 2.6, sz: 1.2, yaw: p.yaw || 0, h: 1.0 };
      case 'kiosk': return { cx: p.x, cz: p.z, sx: 2.6, sz: 2.2, yaw: p.yaw || 0, h: 2.6 };
      case 'block': return { cx: p.x, cz: p.z, sx: 2.0, sz: 0.8, yaw: p.yaw || 0, h: 0.9 };
      case 'wreck': { const L = { volga: [1.8, 4.8], zhiguli: [1.62, 4.1], bus: [2.5, 9], trolley: [2.5, 11], truck: [2.4, 6.5], zaz: [1.5, 3.7] }[p.model || 'zaz']; return { cx: p.x, cz: p.z, sx: L[0], sz: L[1], yaw: p.yaw || 0, h: p.model === 'bus' || p.model === 'trolley' ? 2.9 : 1.6 }; }
      case 'tank': return { cx: p.x, cz: p.z, sx: 3.4, sz: 7, yaw: p.yaw || 0, h: 4.6 };
      case 'statue': return { cx: p.x, cz: p.z, sx: s[0] || 3, sz: s[2] || 3, yaw: p.yaw || 0, h: s[1] || 6 };
      case 'tent': return { cx: p.x, cz: p.z, sx: s[0] || 3, sz: s[2] || 4, yaw: p.yaw || 0, h: 2.2 };
      case 'container': return { cx: p.x, cz: p.z, sx: 2.4, sz: 6, yaw: p.yaw || 0, h: 2.6 };
      case 'busstop': return { cx: p.x, cz: p.z, sx: 3, sz: 1.4, yaw: p.yaw || 0, h: 2.6 };
      case 'boat': return { cx: p.x, cz: p.z, sx: 1.6, sz: 5, yaw: p.yaw || 0, h: 1 };
      case 'hydrofoil': return { cx: p.x, cz: p.z, sx: 5, sz: 30, yaw: p.yaw || 0, h: 4 };
      case 'haystack': return { r: 2, h: 3 };
      case 'well': return { r: 0.9, h: 1.0 };
      case 'hedgehog': return { r: 0.8, h: 1.4 };
      case 'booth': return { cx: p.x, cz: p.z, sx: 2, sz: 2, yaw: p.yaw || 0, h: 2.6 };
      case 'rubble': return { cx: p.x, cz: p.z, sx: s[0] || 3, sz: s[2] || 3, yaw: p.yaw || 0, h: s[1] || 1.2 };
      default: return { cx: p.x, cz: p.z, sx: s[0], sz: s[2], yaw: p.yaw || 0, h: s[1] };
    }
  };

  Z.addPieceColliders = (cw, pieces) => {
    for (const p of pieces) {
      const solid = Z.PIECE_SOLID[p.kind];
      if (!solid || !solid(p)) continue;
      const b = Z.pieceBox(p);
      const y0 = (p.y || 0) - 0.5;
      if (b.r !== undefined) cw.addCyl(p.x, p.z, b.r, y0, (p.y || 0) + b.h, { piece: p });
      else {
        const s = cw.addBox(b.cx, b.cz, b.sx, b.sz, b.yaw, y0, (p.y || 0) + b.h, { piece: p });
        if (p.walk) s.walk = true;
      }
    }
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
