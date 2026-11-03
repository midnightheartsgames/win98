(function (H) {
  'use strict';
  const G = H.Gfx;
  const U = 16;
  const hash = (x, y, s) => G.hash(x, y, s);
  const J = () => H.Jarilo;
  const spr = (w, h, up, draw) => J().spr(w, h, up, draw);

  const DAY = {
    roof: ['#3e444c', '#59616b', '#23272d'], face: ['#e6e2d4', '#f7f3e8', '#b8b2a2'], trim: ['#c4482e', '#7c2a1c'], post: ['#6a3a26', '#8a5234'], base: '#68696c', jade: '#58d8c0',
    glass: ['#22323e', '#4e8090'], lit: '#ffd890', frame: '#2a221c', door: ['#a03a26', '#c85a3a', '#5a1e14'], cap: null,
    rock: ['#7a8088', '#969ca4', '#565a62'], rockCap: ['#6a7078', '#868c94', '#4a4e56'],
    ground: ['#a4aab0', '#bec4c8', '#7c8288'], ground2: ['#6e8e8c', '#8ab0ac', '#4a6664'], ground3: ['#8a5e3c', '#a87a50', '#5a3a24'], road: ['#c0bcb0', '#d6d2c6', '#94907f'], wood: ['#a0764c', '#be9464', '#6e4e30'], lacquer: ['#7c2a22', '#a44434', '#4c1812'], gold: '#e0b458',
    rail: ['#8a909c', '#c8ccd4', '#3a3e48'], drop: ['#64ace6', '#c2e4f8', '#3c84c6'], lip: ['#70747c', '#3a3e46'], lamp: '#8affd8', edge: '#23272d', night: 0.04, tint: null, rockHouse: true, storeys: 2, noRail: true
  };
  const NIGHT = Object.assign({}, DAY, {
    roof: ['#1e2340', '#30385c', '#10142a'], face: ['#8e94b6', '#a8aed0', '#62688c'], trim: ['#a83438', '#5a1c26'], post: ['#3a2438', '#54344e'], base: '#3a3e58', jade: '#60f0d8',
    glass: ['#141c30', '#2a3c60'], lit: '#ffc878', frame: '#141022', door: ['#7c2a30', '#a03c40', '#3a1218'],
    rock: ['#3a4060', '#4e5478', '#262a44'], rockCap: ['#2c3050', '#3e4468', '#1a1e34'],
    ground: ['#3e4464', '#52587c', '#2a2e4a'], ground2: ['#2c5a66', '#3e7a84', '#1a3a46'], ground3: ['#54384a', '#6e4e60', '#361f30'], road: ['#4e5270', '#646a88', '#343850'], wood: ['#5a4050', '#74566a', '#3a2636'], lacquer: ['#5a1c2c', '#7c2c3c', '#340e1a'], gold: '#d8a850',
    drop: ['#0e1234', '#28367c', '#060822'], lip: ['#23274a', '#0c0e24'], lamp: '#ffc878', edge: '#10142a', night: 0.6, tint: 'rgba(36,30,110,0.14)'
  });
  const PORT = Object.assign({}, DAY, {
    roof: ['#2e3a4c', '#48586c', '#1a2230'], face: ['#dfe6ec', '#f4f8fa', '#aeb8c4'], post: ['#3a4658', '#566478'], base: '#5a6470',
    ground: ['#8a93a0', '#a0a9b4', '#66707c'], ground2: ['#4e7480', '#6aa0a8', '#2e4e58'], road: ['#6e7884', '#8a94a0', '#505a66'], seam: '#46a8a0',
    drop: ['#5aa8e8', '#d4ecfa', '#3c84c6'], lip: ['#5a6470', '#2e3a4c'], edge: '#1a2230'
  });
  const ASTRUM = Object.assign({}, DAY, {
    roof: ['#16323a', '#245058', '#0c1e24'], face: ['#2e7e84', '#46a8a8', '#1c5258'], trim: ['#e0b458', '#8a6a24'], post: ['#14363c', '#245058'], base: '#123036',
    ground: ['#1e4a50', '#2a6066', '#123036'], ground2: ['#2e7e84', '#58c8b8', '#1c5258'], road: ['#c8552e', '#e07a4a', '#7c2a1c'], lacquer: ['#7c2a22', '#a44434', '#4c1812'],
    glass: ['#0c2a30', '#58d8c0'], lit: '#7ae8ff', frame: '#0c1e24', door: ['#e0b458', '#f4d48a', '#8a6a24'], jade: '#7ae8ff', gold: '#e0b458', lamp: '#7ae8ff', edge: '#0c1e24', night: 0.5, tint: 'rgba(40,120,150,0.06)'
  });
  const SHIP = Object.assign({}, DAY, {
    roof: ['#16283e', '#28405c', '#0a1626'], face: ['#3e6484', '#5a88a8', '#28465e'], trim: ['#c8452a', '#7c2a1c'], post: ['#1e3248', '#34506c'], base: '#1c2e42',
    ground: ['#34506c', '#46688a', '#223a52'], ground2: ['#1e5a66', '#2e8a8a', '#123e48'], road: ['#2a4258', '#3e5e78', '#1a2e42'], wood: ['#3e4e5e', '#56687a', '#28343f'], seam: '#46c8b8',
    glass: ['#0e2a40', '#58d8c0'], lit: '#7affe0', frame: '#0a1626', door: ['#7c2a1c', '#a8442a', '#4c1812'], drop: ['#0a1c34', '#1e3e62', '#061226'], lip: ['#28405c', '#0a1626'], lamp: '#58f0d8', edge: '#0a1626', jade: '#58f0d8', night: 0.45, tint: 'rgba(20,60,120,0.1)'
  });
  const SEAT = Object.assign({}, DAY, {
    roof: ['#1c1638', '#2e2658', '#100c24'], face: ['#2e2850', '#443a70', '#1c1834'], trim: ['#a8342a', '#6a1e18'], post: ['#241c40', '#3a3060'], base: '#1c1834',
    ground: ['#3a3258', '#4c4470', '#282240'], ground2: ['#a8342a', '#d8604a', '#6a1e18'], road: ['#8a2a24', '#c0503e', '#561a16'], lacquer: ['#3e2a5a', '#5a4280', '#281a3e'],
    glass: ['#141030', '#7a6ae0'], lit: '#ffd890', frame: '#100c24', door: ['#a8342a', '#d8604a', '#6a1e18'], drop: ['#140e30', '#4a3a90', '#0a0620'], lip: ['#2e2658', '#100c24'], jade: '#7ae8ff', gold: '#e0b458', lamp: '#ffd890', edge: '#100c24', night: 0.55, tint: 'rgba(70,40,150,0.08)'
  });
  const DIV = Object.assign({}, DAY, {
    roof: ['#1a2a58', '#2e4680', '#0e1838'], face: ['#6a80c8', '#94a8e8', '#445aa0'], trim: ['#2ec8c0', '#127a80'], post: ['#1e2c60', '#34488c'], base: '#2a3a78',
    ground: ['#2e3a80', '#404e9c', '#1e2860'], ground2: ['#1e6a80', '#2ea0a8', '#124a60'], road: ['#3a4890', '#5060b0', '#242e68'], wood: ['#2a3468', '#3c4888', '#1a2248'], lacquer: ['#3a2a78', '#5040a0', '#241a50'], seam: '#3e8ad0',
    glass: ['#101c50', '#58d8e8'], lit: '#b8f0ff', frame: '#0e1838', door: ['#1e6a80', '#2ea0a8', '#124a60'], drop: ['#241a60', '#6a58c8', '#14103c'], lip: ['#2e4680', '#0e1838'], jade: '#58f0e0', gold: '#e8d080', lamp: '#7affe8', edge: '#0e1838', night: 0.6, tint: 'rgba(60,50,170,0.1)'
  });
  const ART_LAND = Object.assign({}, DAY, {
    roof: ['#14304a', '#22486a', '#0a1c30'], face: ['#2e5a7a', '#467a9a', '#1c3e58'], trim: ['#46d8e8', '#1a7a8a'], post: ['#14304a', '#22486a'], base: '#1c3e58',
    ground: ['#2a4a6a', '#3a6088', '#1c3450'], ground2: ['#1e6a80', '#2ea0a8', '#124a60'], road: ['#34586a', '#4a7488', '#223e4e'], wood: ['#2a4258', '#3c5a74', '#1a2e40'], lacquer: ['#1e4a6a', '#2e6a8a', '#123048'], seam: '#3ec8d8',
    glass: ['#0e2a40', '#58d8e8'], lit: '#b8f0ff', frame: '#0a1c30', door: ['#1e6a80', '#2ea0a8', '#124a60'], drop: ['#2a3a78', '#7a9ae0', '#141e50'], lip: ['#22486a', '#0a1c30'], jade: '#58f0e0', gold: '#e8c860', lamp: '#7affe8', edge: '#0a1c30', night: 0.55, tint: 'rgba(40,80,170,0.08)'
  });
  const DELVE = Object.assign({}, ART_LAND, { lamp: '#3e6a88', jade: '#2e8a88', seam: '#1e4a60', lit: '#3e6a88', night: 0.85, tint: 'rgba(8,16,50,0.32)' });
  const ALCH = Object.assign({}, DAY, {
    roof: ['#3a4650', '#54626e', '#242c34'], face: ['#e8e8e0', '#fafaf4', '#b8bab0'], trim: ['#c8642e', '#7c3a1c'], post: ['#3a3a3e', '#5a5a60'], base: '#6a7478',
    ground: ['#a8b0b4', '#c0c8ca', '#7e868c'], ground2: ['#5a8a84', '#7ab0a8', '#3e6460'], ground3: ['#7e7a5c', '#9a9672', '#54523c'], road: ['#b4b8b0', '#ccd0c8', '#8a8e86'], wood: ['#8a6a44', '#a88860', '#5e4630'],
    drop: ['#2a8a88', '#4cb4a8', '#1e7478'], lip: ['#c8d0cc', '#5a6a6a'], lamp: '#ffd890', jade: '#58d8c0', edge: '#242c34', night: 0.06, tint: 'rgba(70,110,150,0.1)'
  });
  const MIST = Object.assign({}, DAY, {
    roof: ['#1a2a28', '#2a3e3a', '#0e1a18'], face: ['#465a54', '#5e7a72', '#2c3c38'], trim: ['#c8843c', '#7a4e20'], post: ['#2a2018', '#4a3a28'], base: '#22302e',
    ground: ['#34463f', '#465a52', '#22302a'], ground2: ['#2e5a4a', '#3e8066', '#1c3e32'], ground3: ['#3e3a2a', '#5a5240', '#28241a'], road: ['#4a5a4e', '#5e7062', '#2e3a32'], wood: ['#4a3e2a', '#665840', '#2e2618'], lacquer: ['#5a3a1c', '#7a5228', '#3a2410'], seam: '#b89a4a',
    glass: ['#0e2a24', '#58d8a0'], lit: '#ffb860', frame: '#0e1a18', door: ['#5a3a1c', '#7a5228', '#3a2410'], drop: ['#0c2a24', '#1e4a3c', '#061814'], lip: ['#2a3e3a', '#0e1a18'], jade: '#7affa0', gold: '#d8a850', lamp: '#ffb060', edge: '#0e1a18', night: 0.6, noStars: true, tint: 'rgba(60,200,120,0.08)'
  });
  const SEA = Object.assign({}, DAY, {
    roof: ['#34424e', '#4a5a68', '#202a34'], face: ['#6a7a88', '#8494a2', '#465460'], trim: ['#2e8a9a', '#14505e'], post: ['#2a3640', '#445260'], base: '#303c48',
    ground: ['#7c8c98', '#96a6b0', '#5a6874'], ground2: ['#c0b494', '#d8ceb0', '#94886a'], ground3: ['#4e5a58', '#667470', '#343e3c'], road: ['#70808c', '#8a9aa4', '#4e5c68'], wood: ['#56605e', '#70807a', '#3a4442'], lacquer: ['#2a5a6a', '#3e7a8a', '#183e4c'], seam: '#4ac0f0',
    glass: ['#103040', '#58d8e8'], lit: '#9affc8', frame: '#202a34', door: ['#2e8a9a', '#4ab0c0', '#14505e'], rock: ['#56646e', '#6e7e88', '#3a4650'], rockCap: ['#3e4a54', '#56646e', '#28323a'],
    drop: ['#1e5a8a', '#3e86b0', '#123e68'], lip: ['#56646e', '#1e3a50'], jade: '#7affc8', gold: '#d8c080', lamp: '#7affc8', edge: '#202a34', night: 0.22, crack: true, sand: true, tint: 'rgba(40,80,130,0.1)'
  });
  const ROOTS_LAND = Object.assign({}, DAY, {
    roof: ['#1a1e12', '#2a2e1c', '#0e1208'], face: ['#2e3a20', '#42522c', '#1e2814'], trim: ['#c8e070', '#6a7a30'], post: ['#1e2412', '#343e1e'], base: '#141a0c',
    ground: ['#1e2214', '#2a2e1c', '#12140c'], ground2: ['#2a2a14', '#3e3e1e', '#1a1a0c'], ground3: ['#3a2e1c', '#54442a', '#241c10'], road: ['#343624', '#4a4e32', '#20221a'], wood: ['#3a2e1c', '#54442a', '#241c10'], lacquer: ['#3e3a1c', '#5a5428', '#28240e'], seam: '#7a8a3a',
    glass: ['#10180c', '#c8e070'], lit: '#d8f080', frame: '#0e1208', door: ['#3e3a1c', '#5a5428', '#28240e'], rock: ['#2a2e1c', '#42462c', '#141608'], rockCap: ['#1a1e12', '#2a2e1c', '#0e1208'],
    drop: ['#040806', '#0c1a10', '#020403'], lip: ['#2a2e1c', '#0a0e08'], jade: '#d8f080', gold: '#c8a850', lamp: '#d8f080', edge: '#0e1208', night: 0.72, noStars: true, crack: true, sand: true, tint: 'rgba(120,180,60,0.07)'
  });
  const DUSK = Object.assign({}, DAY, {
    roof: ['#1e2236', '#2e3450', '#12152a'], face: ['#2a2432', '#3e3446', '#1a1622'], trim: ['#e0a040', '#8a5a20'], post: ['#1a1620', '#2e2834'], base: '#141220',
    ground: ['#4a4e6a', '#5e6284', '#34384e'], ground2: ['#6a5a58', '#8a7468', '#4a3e40'], ground3: ['#3e4258', '#525672', '#2a2e40'], road: ['#565a78', '#6e7296', '#3c4058'], wood: ['#3a3040', '#524458', '#26202c'], lacquer: ['#7c2a22', '#a44434', '#4e1a14'], seam: '#e0a040',
    glass: ['#2a1e30', '#ffc060'], lit: '#ffd080', frame: '#141220', door: ['#7c2a22', '#a44434', '#4e1a14'], rock: ['#3a3a54', '#4e4e6a', '#26263a'], rockCap: ['#2a2a40', '#3a3a54', '#1a1a2c'],
    drop: ['#141848', '#1e2460', '#0c0f34'], lip: ['#2e3450', '#141220'], jade: '#58d8c0', gold: '#e8b050', lamp: '#ffc060', edge: '#141220', night: 0.42, tint: 'rgba(240,140,60,0.08)'
  });
  const LANDS = { lf_dusk: DUSK, lf_roots: ROOTS_LAND, lf_sea: SEA, lf_haven: DAY, lf_night: NIGHT, lf_port: PORT, lf_astrum: ASTRUM, lf_ship: SHIP, lf_seat: SEAT, lf_div: DIV, lf_art: ART_LAND, lf_delve: DELVE, lf_alch: ALCH, lf_mist: MIST };

  const PROPS = new Set(['tree', 'crate', 'fence', 'lamp', 'statue', 'table', 'console', 'block']);
  const BUILD = new Set(['house', 'window', 'housedoor', 'gate']);

  function slabs(P, Z, e) {
    const [b, hi, dk] = Z.ground, odd = e.y & 1, r = hash(e.x * 3 + odd, e.y, 301);
    P(0, 0, U, U, b);
    P(0, U - 1, U, 1, dk);
    P(odd ? 7 : 15, 0, 1, U - 1, dk);
    P(odd ? 8 : 0, 0, 7, 1, hi);
    if (r > 0.7) { P(2 + Math.floor(r * 9), 4 + Math.floor(hash(e.x, e.y, 303) * 8), 3, 1, hi); P(1 + Math.floor(hash(e.x, e.y, 305) * 11), 10, 2, 1, dk); }
    if (Z.seam && e.x % 6 === 0) P(7, 0, 2, U, Z.seam);
    if (Z.seam && e.y % 6 === 0) P(0, 7, U, 2, Z.seam);
  }

  function cracked(P, Z, e) {
    const [b, hi, dk] = Z.ground, r = i => hash(e.x * 11 + i, e.y * 17 + i, 391);
    P(0, 0, U, U, b);
    if (r(1) > 0.5) P(0, 0, U, 1, hi);
    if (r(2) > 0.55) P(0, 3 + Math.floor(r(3) * 10), U, 1, dk);
    if (r(4) > 0.55) P(3 + Math.floor(r(5) * 10), 0, 1, U, dk);
    if (r(6) > 0.74) P.line(Math.floor(r(7) * 8), Math.floor(r(8) * 8), 8 + Math.floor(r(9) * 7), 8 + Math.floor(r(10) * 7), Z.seam);
    if (r(11) > 0.86) P(2 + Math.floor(r(12) * 9), 3 + Math.floor(r(13) * 9), 4, 2, hi);
  }

  function sandy(P, Z, e) {
    const [b, hi, dk] = Z.ground2, r = i => hash(e.x * 7 + i, e.y * 13 + i, 393);
    P(0, 0, U, U, b);
    for (let i = 0; i < 6; i++) P(Math.floor(r(i) * 15), Math.floor(r(i + 7) * 15), 2, 1, i % 2 ? hi : dk);
    if (!e.same.u) P(0, 0, U, 2, hi);
  }

  function planks(P, pal, e) {
    const [b, hi, dk] = pal;
    P(0, 0, U, U, b);
    for (let y = 0; y < U; y += 4) { P(0, y, U, 1, hi); P(0, y + 3, U, 1, dk); P((e.x * 5 + (e.y * 4 + y) * 3) % 16, y, 1, 4, dk); }
  }

  function floorPaint(P, Z, kind, e) {
    const r = i => hash(e.x * 13 + i, e.y * 7 + i * 3, 311);
    switch (kind) {
      case 'floor': return Z.crack ? cracked(P, Z, e) : slabs(P, Z, e);
      case 'floor2': {
        if (Z.sand) return sandy(P, Z, e);
        const [b, hi, dk] = Z.ground2;
        P(0, 0, U, U, b);
        P(0, U - 1, U, 1, dk); P(U - 1, 0, 1, U, dk);
        if ((e.x + e.y) % 2 === 0) { P.tri([8, 5, 11, 8, 8, 11, 5, 8], hi); P(7, 7, 2, 2, dk); }
        if (!e.same.u) { P(0, 0, U, 1, Z.gold); P(0, 1, U, 1, hi); }
        if (!e.same.d) { P(0, U - 2, U, 1, hi); P(0, U - 1, U, 1, Z.gold); }
        if (!e.same.l) { P(0, 0, 1, U, Z.gold); P(1, 0, 1, U, hi); }
        if (!e.same.r) { P(U - 2, 0, 1, U, hi); P(U - 1, 0, 1, U, Z.gold); }
        return;
      }
      case 'floor3': return planks(P, Z.ground3, e);
      case 'floor4': {
        planks(P, Z.wood, e);
        if (!e.same.u) { P(0, 0, U, 2, Z.trim[1]); P(0, 0, U, 1, Z.trim[0]); }
        if (!e.same.d) { P(0, U - 2, U, 2, Z.trim[1]); P(0, U - 2, U, 1, Z.trim[0]); }
        return;
      }
      case 'floor5': {
        const [b, hi, dk] = Z.lacquer;
        P(0, 0, U, U, b);
        P(0, 0, U, 1, hi); P(0, 0, 1, U, hi); P(U - 1, 0, 1, U, dk); P(0, U - 1, U, 1, dk);
        if ((e.x + e.y) % 2 === 0) P.tri([8, 4, 12, 8, 8, 12, 4, 8], Z.gold);
        return;
      }
      case 'road': {
        const [b, hi, dk] = Z.road;
        P(0, 0, U, U, dk);
        const k = hash(e.x, e.y, 313);
        P(1, 1, U - 2, U - 2, k > 0.6 ? hi : b);
        P(1, 1, U - 2, 1, hi);
        if (r(1) > 0.8) P(4, 6, 5, 1, dk);
        return;
      }
      case 'stairs': {
        const [b, hi, dk] = Z.road;
        for (let y = 0; y < U; y += 4) { P(0, y, U, 4, b); P(0, y, U, 1, hi); P(0, y + 3, U, 1, dk); }
        if (!e.same.l) P(0, 0, 2, U, Z.trim[0]);
        if (!e.same.r) P(U - 2, 0, 2, U, Z.trim[0]);
        return;
      }
      case 'bridge': {
        planks(P, Z.wood, e);
        P(0, 0, U, 2, Z.trim[1]); P(0, U - 2, U, 2, Z.trim[1]);
        return;
      }
      case 'door': {
        const [b, hi, dk] = Z.door;
        P(0, 0, U, U, dk); P(2, 0, U - 4, U, b); P(3, 0, 1, U, hi);
        return;
      }
      case 'chasm': {
        const [b, hi, dk] = Z.drop;
        P(0, 0, U, U, b);
        if (Z.night > 0.3) {
          P.dither(0, 0, U, U, dk, (e.x + e.y) & 1);
          if (!Z.noStars && r(1) > 0.72) P.dot(Math.floor(r(2) * 15), Math.floor(r(3) * 15), r(4) > 0.6 ? '#ffffff' : hi);
        } else {
          for (let py = 0; py < U; py += 1) for (let px = 0; px < U; px += 1) {
            const gx = e.x * U + px, gy = e.y * U + py, v = Math.sin(gx * 0.045) + Math.sin(gy * 0.11 + gx * 0.02) + Math.sin((gx + gy) * 0.03);
            if (v > 1.5 || (v > 1.15 && ((gx + gy) & 1))) P(px, py, 1, 1, hi);
            else if (v < -1.7 && ((gx + gy) & 1)) P(px, py, 1, 1, dk);
          }
        }
        if (!e.same.u) { P(0, 0, U, 5, Z.lip[0]); P(0, 5, U, 1, Z.lip[1]); P(0, 1, U, 1, Z.lip[1]); }
        return;
      }
      default: return slabs(P, Z, e);
    }
  }

  function roofTile(P, Z, e, open, eave) {
    const [b, hi, dk] = Z.roof, [pl, plHi, plDk] = Z.face;
    P(0, 0, U, U, b);
    for (let x = 0; x < U; x += 4) { P(x, 0, 1, U, dk); P(x + 2, 0, 1, U, hi); }
    for (let y = (e.y % 2) * 3 + 2; y < U; y += 6) P(0, y, U, 1, dk);
    if (open.u) { P(0, 0, U, 3, plHi); P(0, 3, U, 1, plDk); P(0, 4, U, 1, dk); }
    if (open.l) { P(0, 0, 3, U, plHi); P(3, 0, 1, U, plDk); }
    if (open.r) { P(U - 3, 0, 3, U, plHi); P(U - 4, 0, 1, U, plDk); }
    if (eave) {
      P(0, U - 6, U, 3, dk);
      for (let x = 1; x < U; x += 4) { P(x, U - 6, 2, 2, hi); P(x, U - 5, 2, 1, b); }
      P(0, U - 3, U, 2, Z.trim[0]); P(0, U - 1, U, 1, Z.trim[1]);
    }
  }

  function lattice(P, Z, x0, y0, w, h, lit) {
    P(x0 - 1, y0 - 1, w + 2, h + 2, Z.post[0]);
    P(x0, y0, w, h, lit ? Z.lit : Z.glass[0]);
    if (!lit) P(x0, y0, 2, h, Z.glass[1]);
    for (let x = x0 + 2; x < x0 + w; x += 3) P(x, y0, 1, h, Z.frame);
    for (let y = y0 + 2; y < y0 + h; y += 3) P(x0, y, w, 1, Z.frame);
  }

  function faceTile(P, Z, ro, ch, e, sides) {
    const [b, hi, dk] = Z.face, r = i => hash(e.x * 23 + i, e.y * 9 + i, 321), lit = r(1) < Z.night;
    P(0, 0, U, U, b);
    if (r(2) > 0.6) P(Math.floor(r(3) * 11), Math.floor(r(4) * 11), 5, 2, hi);
    if (r(5) > 0.72) { P.dither(Math.floor(r(6) * 10), 4 + Math.floor(r(7) * 6), 5, 5, dk, 1); }
    if (!sides.l) { P(0, 0, 2, U, Z.post[0]); P(0, 0, 1, U, Z.post[1]); P(2, 0, 1, U, dk); }
    if (!sides.r) { P(U - 2, 0, 2, U, Z.post[0]); P(U - 1, 0, 1, U, Z.post[1]); P(U - 3, 0, 1, U, dk); }
    if (ro === 'high') {
      if (e.top) { P(0, 0, U, 3, Z.trim[0]); P(0, 3, U, 1, Z.trim[1]); if (e.x % 4 === 0) P(2, 1, 12, 1, Z.jade); }
      if (ch === 'window') lattice(P, Z, 4, e.top ? 6 : 3, 8, 10, lit);
      else if (ch === 'housedoor') { P(2, 6, 12, 10, Z.door[2]); P(3, 7, 10, 9, Z.door[0]); P(3, 7, 10, 1, Z.door[1]); P(7, 7, 2, 9, Z.door[2]); P(3, 4, 10, 2, Z.gold); }
      else if (ch === 'gate') { P(1, 4, U - 2, 12, Z.frame); for (let x = 2; x < U - 1; x += 3) P(x, 4, 1, 12, Z.jade); }
      return;
    }
    P(0, U - 3, U, 3, Z.base); P(0, U - 3, U, 1, dk);
    if (ch === 'window') lattice(P, Z, 4, 1, 8, 9, lit);
    else if (ch === 'housedoor') {
      P(2, 0, 12, 13, Z.door[2]); P(3, 0, 10, 13, Z.door[0]); P(3, 0, 10, 1, Z.door[1]); P(7, 0, 2, 13, Z.door[2]);
      P(5, 6, 1, 2, Z.gold); P(10, 6, 1, 2, Z.gold);
    } else if (ch === 'gate') {
      P(1, 0, U - 2, 13, Z.frame); for (let x = 2; x < U - 1; x += 3) P(x, 0, 1, 13, Z.jade);
    }
  }

  function pinePot(P, Z) {
    P.shadow(8, 39, 7, 2);
    P(3, 33, 10, 6, Z.face[1]); P(3, 33, 10, 1, '#ffffff'); P(3, 38, 10, 1, Z.face[2]); P(4, 35, 8, 2, Z.trim[1]);
    P(7, 18, 2, 15, Z.post[0]); P(7, 18, 1, 15, Z.post[1]);
    P.line(8, 22, 3, 18, Z.post[0]); P.line(8, 20, 13, 16, Z.post[0]);
    const lf = Z.night > 0.3 ? ['#2e8a86', '#60d8c8', '#14505a'] : ['#2e6e46', '#58a266', '#1a4a30'];
    P.oval(8, 13, 7, 3, lf[2]); P.oval(8, 12, 7, 3, lf[0]); P.oval(3, 18, 4, 2, lf[0]); P.oval(13, 16, 4, 2, lf[0]); P.oval(8, 6, 5, 2, lf[0]);
    P(4, 11, 6, 1, lf[1]); P(1, 17, 4, 1, lf[1]); P(11, 15, 4, 1, lf[1]); P(5, 5, 5, 1, lf[1]);
  }

  function propSprite(kind, Z, land, x, y) {
    switch (kind) {
      case 'tree': return { up: 26, cv: spr(U, U, 26, P => pinePot(P, Z)) };
      case 'lamp': return {
        up: 20, light: [8, -12, 30, Z.lamp, Z.night > 0.3 ? 0.42 : 0.14],
        cv: spr(U, U, 20, P => {
          P.shadow(8, 33, 5, 2);
          P(4, 30, 8, 4, Z.road[2]); P(4, 30, 8, 1, Z.road[1]);
          P(6, 18, 4, 12, Z.road[0]); P(6, 18, 1, 12, Z.road[1]);
          P(3, 10, 10, 8, Z.road[2]); P(4, 11, 8, 6, Z.lamp); P(4, 11, 8, 1, '#ffffff');
          P(2, 7, 12, 3, Z.roof[0]); P(4, 5, 8, 2, Z.roof[1]); P(7, 3, 2, 2, Z.gold);
        })
      };
      case 'crate': return {
        up: 6, cv: spr(U, U, 6, P => {
          P.shadow(8, 20, 7, 2);
          P(2, 6, 12, 14, Z.trim[0]); P(2, 6, 12, 1, '#e87a5a'); P(13, 6, 1, 14, Z.trim[1]); P(2, 19, 12, 1, Z.trim[1]);
          P(2, 11, 12, 2, Z.roof[2]); P(7, 6, 2, 14, Z.roof[2]); P(7, 11, 2, 2, Z.gold);
        })
      };
      case 'fence': return {
        up: 6, cv: spr(U, U, 6, P => {
          P(0, 6, U, 2, Z.face[1]); P(0, 8, U, 1, Z.face[2]); P(0, 14, U, 2, Z.face[0]); P(0, 16, U, 1, Z.base);
          for (let i = 1; i < U; i += 5) { P(i, 8, 2, 6, Z.face[0]); P(i, 8, 1, 6, Z.face[1]); }
        })
      };
      case 'statue': return {
        up: 12, cv: spr(U, U, 12, P => {
          P.shadow(8, 28, 7, 2);
          P(2, 22, 12, 6, Z.road[2]); P(2, 22, 12, 1, Z.road[1]);
          P(4, 10, 8, 12, Z.road[0]); P(4, 10, 8, 1, Z.road[1]); P(5, 5, 6, 6, Z.road[0]); P(5, 5, 6, 1, Z.road[1]); P(6, 7, 1, 1, Z.jade); P(9, 7, 1, 1, Z.jade); P(4, 4, 2, 2, Z.road[0]); P(10, 4, 2, 2, Z.road[0]);
        })
      };
      case 'table': return {
        up: 4, cv: spr(U, U, 4, P => { P.shadow(8, 18, 7, 2); P(1, 6, 14, 4, Z.trim[0]); P(1, 6, 14, 1, Z.gold); P(2, 10, 2, 8, Z.post[0]); P(12, 10, 2, 8, Z.post[0]); })
      };
      case 'console': return {
        up: 6, cv: spr(U, U, 6, P => { P(2, 4, 12, 16, Z.frame); P(2, 4, 12, 1, Z.gold); P(4, 7, 8, 6, '#0e3a34'); P(5, 8, 6, 1, Z.jade); P(5, 10, 4, 1, Z.jade); })
      };
      case 'block': return { up: 0, cv: spr(U, U, 0, P => { P(0, 0, U, U, Z.road[2]); P(1, 1, U - 2, U - 2, Z.road[0]); P(1, 1, U - 2, 1, Z.road[1]); }) };
    }
    return J().KIT.propSprite(kind, Z, land, x, y);
  }

  function container(P, x, y, w, h, lift, top, topHi, topDk) {
    P(x, y, w, h - lift, top); P(x, y, w, 2, topHi); P(x + 4, y + 5, w - 8, h - lift - 10, topDk); P(x + 5, y + 6, w - 10, h - lift - 12, top);
    P(x, y + h - lift, w, lift, '#2e3a4c'); P(x, y + h - lift, w, 1, '#566478'); P(x + 2, y + h - lift + 3, w - 4, lift - 5, '#1e2836');
    for (let i = x + 4; i < x + w - 4; i += 7) P(i, y + h - lift + 4, 3, 1, '#f0c040');
    P(x + 1, y + h - lift + 2, 1, lift - 3, '#4ad8c0'); P(x + w - 2, y + h - lift + 2, 1, lift - 3, '#4ad8c0');
  }

  const DECOR = {
    express: { w: 18, h: 3, up: 18, draw(P, v) { H.Axel.DECOR.express.draw(P, v); } },
    skiffframe: {
      w: 8, h: 7, up: 0,
      draw(P) {
        const K = '#2e4a66', Kh = '#58809e', J = '#58f0d8';
        P.oval(64, 96, 54, 10, '#0e2a40'); P.oval(64, 94, 46, 7, '#1e5a66');
        for (let i = -4; i <= 4; i++) { const x = 64 + i * 11, h = 64 - Math.abs(i) * 8; P(x - 1, 92 - h, 3, h, K); P(x - 1, 92 - h, 1, h, Kh); }
        P.line(14, 62, 64, 28, K, 3); P.line(114, 62, 64, 28, K, 3); P.line(14, 76, 114, 76, Kh, 2); P.line(24, 58, 104, 58, K, 2); P(60, 18, 8, 10, J); P(62, 12, 4, 6, '#ffffff');
        for (let x = 24; x < 110; x += 16) P(x, 74, 4, 4, J);
      },
      lights() { return [[64, 40, 60, '#58f0d8', 0.2, true]]; }
    },
    liftpad: { w: 1, h: 1, up: 12, draw(P) { P(1, 12, 14, 14, '#1e3248'); P(1, 12, 14, 2, '#58809e'); P(3, 16, 10, 8, '#0e2a40'); P(4, 17, 8, 2, '#58f0d8'); P(1, 2, 2, 12, '#34506c'); P(13, 2, 2, 12, '#34506c'); P(1, 0, 14, 3, '#c8452a'); }, lights() { return [[8, 14, 22, '#58f0d8', 0.3, true]]; } },
    hologram: {
      w: 2, h: 2, up: 8,
      draw(P) {
        const J = '#58f0d8', D = '#14505a';
        P(2, 10, 28, 30, 'rgba(88,240,216,0.18)'); P(2, 10, 28, 2, J); P(2, 38, 28, 2, J); P(2, 10, 2, 30, J); P(28, 10, 2, 30, J); P.tri([16, 14, 24, 25, 16, 36, 8, 25], 'rgba(88,240,216,0.35)'); P.tri([16, 18, 21, 25, 16, 32, 11, 25], D);
      },
      lights() { return [[16, 22, 30, '#58f0d8', 0.26, true]]; }
    },
    stage: {
      w: 3, h: 2, up: 6,
      draw(P, v) {
        const K = '#8aa8c4', Kh = '#d0e4f0', G0 = '#6aee8a', J = '#7affe0', n = v || 1, ribs = n * 2 + 1, step = n === 1 ? 3 : n === 2 ? 4 : 5, tall = ribs * step;
        P(15, 30, 18, 6, '#1e3248'); P(15, 30, 18, 1, '#46688a'); P(19, 32, 10, 2, J);
        P(23, 30 - tall, 2, tall, K); P(23, 30 - tall, 1, tall, Kh);
        for (let i = 0; i < ribs; i++) {
          const y = 28 - i * step, half = n === 1 ? 2 + i * 2 : Math.min(21, 4 + (ribs - Math.abs(i - ribs / 2) * 2) * (n === 2 ? 2 : 3));
          P(24 - half, y, half * 2, 1, K);
          P(24 - half - 1, y - 1, 2, 2, n > 2 ? J : G0);
          P(24 + half - 1, y - 1, 2, 2, n > 2 ? J : G0);
          if (n > 2 && i < ribs - 1) P(24 - half + 2, y - step + 1, half * 2 - 4, step - 1, 'rgba(88,240,216,0.28)');
        }
        if (n > 1) P(22, 28 - tall, 4, 3, n > 2 ? J : G0);
      },
      lights(v) { return [[24, 24, 16 + (v || 1) * 6, '#58f0d8', 0.2, true]]; }
    },
    litter: {
      w: 1, h: 1, up: 0,
      draw(P, v) {
        const ART = {
          blade() { P(3, 9, 7, 2, '#c8d0dc'); P(5, 8, 3, 1, '#f0f4f8'); P(9, 5, 2, 5, '#9aa4b4'); P(10, 4, 1, 2, '#e8eef4'); P(4, 12, 3, 1, '#6a7484'); },
          tag() { P(4, 5, 5, 8, '#2e8a78'); P(5, 6, 3, 6, '#7fffd4'); P(10, 7, 3, 5, '#2e8a78'); P(11, 8, 1, 3, '#7fffd4'); P(6, 3, 1, 2, '#e0b458'); },
          grenade() { P.oval(8, 9, 4, 4, '#3a4a30'); P(6, 4, 4, 2, '#566a48'); P(10, 5, 3, 1, '#c8d0dc'); P(6, 8, 3, 2, '#e04060'); },
          iron() { P(3, 8, 7, 2, '#4a3a2a'); P(10, 8, 4, 1, '#c8d0dc'); P(14, 8, 1, 1, '#ff9040'); },
          clay() { P.oval(8, 10, 5, 3, '#a87a50'); P.oval(7, 9, 3, 2, '#c89a70'); },
          paper() { P(3, 5, 10, 8, '#e8e4d0'); P(4, 7, 8, 1, '#8a94a8'); P(4, 9, 6, 1, '#8a94a8'); P(4, 11, 7, 1, '#8a94a8'); },
          ad() { P(3, 4, 10, 9, '#2e6ea8'); P(4, 5, 8, 2, '#e0b458'); P(4, 8, 8, 1, '#e8e4d0'); P(4, 10, 5, 1, '#e8e4d0'); },
          tea() { P(5, 8, 6, 4, '#f4efe2'); P(6, 8, 4, 1, '#8a5e3c'); P(11, 9, 2, 2, '#f4efe2'); P(4, 12, 8, 1, '#b8b2a2'); }
        };
        (ART[v] || ART.paper)();
      }
    },
    synwood: {
      w: 9, h: 7, up: 14,
      draw(P) {
        const Z = NIGHT, O = '#ffb868', Od = '#c8743a', T = '#3eb8ac', Th = '#7ae8d8';
        P.shadow(72, 124, 66, 3);
        P(10, 76, 124, 48, Z.face[2]); P(12, 78, 120, 44, Z.face[0]); P(12, 78, 120, 2, Z.face[1]); P(10, 120, 124, 6, Z.base);
        for (const x of [18, 38, 92, 112]) { P(x, 86, 14, 22, Od); P(x + 1, 87, 12, 20, O); P(x + 6, 87, 1, 20, Od); P(x + 1, 96, 12, 1, Od); }
        P.oval(72, 102, 20, 24, Z.gold); P.oval(72, 102, 18, 22, '#0e1830'); P.oval(72, 104, 12, 14, '#2e6e66'); P(52, 120, 40, 6, Z.base); P(54, 118, 36, 2, Z.trim[1]);
        P(0, 70, 144, 6, Z.roof[0]); P(0, 70, 144, 1, Z.roof[1]); P(0, 76, 144, 2, Z.trim[0]); P.tri([0, 70, 0, 62, 12, 70], Z.roof[0]); P.tri([144, 70, 144, 62, 132, 70], Z.roof[0]);
        for (let x = 6; x < 140; x += 8) P(x, 72, 3, 2, Z.roof[1]);
        P(36, 38, 72, 32, Z.face[0]); P(36, 38, 72, 2, Z.face[1]);
        for (const x of [42, 60, 78, 94]) { P(x, 44, 10, 18, Od); P(x + 1, 45, 8, 16, O); }
        P(26, 32, 92, 6, Z.roof[0]); P(26, 32, 92, 1, Z.roof[1]); P(26, 38, 92, 2, Z.trim[0]); P.tri([26, 32, 26, 26, 36, 32], Z.roof[0]); P.tri([118, 32, 118, 26, 108, 32], Z.roof[0]);
        P(58, 22, 28, 10, Z.face[1]); P.oval(72, 18, 24, 11, T); P.oval(72, 16, 20, 8, Th); P(70, 0, 4, 10, Z.gold); P.oval(72, 2, 3, 3, Th);
      },
      lights() { return [[72, 96, 70, '#ffb868', 0.26, true], [72, 16, 34, '#7ae8d8', 0.26, true]]; }
    },
    jadehall: {
      w: 6, h: 2, up: 10,
      draw(P) {
        const Z = NIGHT, O = '#ffb868', Oh = '#ffdca8', Od = '#c8743a';
        P(0, 8, 96, 34, Z.frame);
        for (let i = 0; i < 6; i++) { const x = 2 + i * 16; P(x, 12, 12, 28, Od); P(x + 1, 13, 10, 26, O); P(x + 1, 13, 10, 3, Oh); P(x + 5, 13, 1, 26, Od); P(x + 1, 25, 10, 1, Od); }
        for (let x = 0; x <= 96; x += 16) P(Math.min(x, 94), 8, 2, 34, Z.trim[1]);
        P(0, 6, 96, 4, Z.trim[0]); P(0, 6, 96, 1, Z.gold);
        P(26, 0, 44, 10, '#14503e'); P(27, 1, 42, 8, '#2e8a78'); P(26, 0, 44, 1, Z.gold); P(26, 9, 44, 1, Z.gold);
        for (let x = 31; x < 66; x += 7) P(x, 3, 4, 4, '#e8fff4');
      },
      lights() { return [[48, 26, 76, '#ffb868', 0.4, true]]; }
    },
    jadetable: {
      w: 2, h: 2, up: 4,
      draw(P) {
        P.shadow(16, 34, 15, 2);
        P(1, 6, 30, 26, '#5a2a1a'); P(1, 6, 30, 2, '#a8643c'); P(3, 9, 26, 20, '#14604a'); P(3, 9, 26, 1, '#2e9a78');
        for (const [x, y] of [[6, 11], [10, 11], [14, 11], [20, 12], [24, 15], [24, 19], [7, 24], [11, 24], [15, 24], [6, 16], [6, 20], [14, 18], [18, 18]]) { P(x, y, 3, 3, '#f4efe2'); P(x, y + 2, 3, 1, '#9ad8c0'); }
      },
      lights() { return [[16, 16, 22, '#8affd8', 0.12, true]]; }
    },
    pool: {
      w: 6, h: 2, up: 4,
      draw(P) {
        P(0, 4, 96, 32, '#62688c'); P(0, 4, 96, 2, '#a8aed0'); P(3, 8, 90, 25, '#123a5a'); P(3, 8, 90, 2, '#1e5a7a');
        for (const [x, y] of [[18, 16], [44, 24], [70, 14]]) { P.oval(x, y, 6, 3, '#2e8a56'); P.oval(x, y - 1, 5, 2, '#58c87a'); P(x - 1, y - 2, 2, 2, '#ff9ac8'); }
        for (let i = 0; i < 8; i++) P(10 + i * 11, 12 + (i % 3) * 6, 5, 1, '#3e8ab0');
      },
      lights() { return [[48, 20, 44, '#58c8e8', 0.12, true]]; }
    },
    glyphs: {
      w: 1, h: 7, up: 0,
      draw(P, v) {
        const n = v || 1;
        for (let i = 0; i < 12; i++) {
          const y = 4 + i * 9, x = 4 + Math.floor(hash(n, i, 341) * 5), a = hash(n, i, 343) > 0.5;
          P(x, y, 6, 1, '#ffe0a0'); P(x + 2, y, 1, 5, a ? '#ffe0a0' : '#c8a050'); if (a) P(x, y + 4, 6, 1, '#c8a050'); else P(x + 4, y + 2, 2, 1, '#ffe0a0');
        }
      },
      lights() { return [[8, 56, 26, '#ffd890', 0.16, true]]; }
    },
    seatgate: {
      w: 6, h: 3, up: 6,
      draw(P) {
        const Z = NIGHT;
        P(16, 16, 64, 38, '#141030');
        for (const x of [16, 76]) { P(x, 6, 6, 48, Z.trim[0]); P(x, 6, 2, 48, '#e8604a'); P(x - 2, 50, 10, 4, Z.gold); }
        P(10, 2, 76, 6, Z.roof[1]); P(10, 8, 76, 3, Z.gold); P.tri([10, 2, 2, 0, 10, 8], Z.roof[1]); P.tri([86, 2, 94, 0, 86, 8], Z.roof[1]);
        P(36, 14, 24, 8, Z.gold); P(38, 16, 20, 4, '#3a2a6a');
        P(32, 26, 32, 28, '#3a2030'); P(47, 26, 2, 28, '#141030');
      },
      lights() { return [[48, 30, 40, '#c0a0ff', 0.18, true]]; }
    },
    lionhead: {
      w: 3, h: 3, up: 8,
      draw(P) {
        const K = '#241e2a', M = '#3e3440', G0 = '#e0b458', Y = '#ffe080';
        P.shadow(24, 52, 20, 3);
        P(8, 40, 32, 14, '#2e2850'); P(8, 40, 32, 2, '#443a70'); P(10, 50, 28, 2, G0);
        P.oval(24, 24, 18, 18, K); P.oval(24, 22, 16, 15, M); P.oval(24, 34, 11, 7, K);
        P.tri([10, 16, 0, 0, 16, 10], G0); P.tri([38, 16, 48, 0, 32, 10], G0); P.tri([12, 14, 6, 4, 16, 10], Y); P.tri([36, 14, 42, 4, 32, 10], Y);
        P(14, 20, 7, 3, Y); P(27, 20, 7, 3, Y); P(16, 21, 3, 1, '#ffffff'); P(29, 21, 3, 1, '#ffffff');
        P(16, 32, 16, 2, G0); P(18, 34, 2, 3, '#f4efe2'); P(28, 34, 2, 3, '#f4efe2');
      },
      lights() { return [[24, 21, 18, '#ffd860', 0.26, true]]; }
    },
    tallbanner: {
      w: 1, h: 4, up: 0,
      draw(P) {
        const R0 = '#c8302a', Rh = '#ea5a48', Rd = '#7c1c18', G0 = '#e0b458';
        P(0, 0, 16, 3, Rd); P(1, 3, 14, 48, R0); P(1, 3, 2, 48, Rh); P(13, 3, 2, 48, Rd);
        P.tri([1, 51, 8, 62, 15, 51], R0); P.tri([3, 51, 8, 58, 13, 51], Rd);
        P(4, 8, 8, 1, G0); P(4, 42, 8, 1, G0); P.oval(8, 18, 3, 3, G0); P.oval(8, 18, 1, 1, Rd);
        for (let y = 24; y < 40; y += 4) P(6, y, 4, 2, '#ffd0c0');
      }
    },
    emblem: {
      w: 8, h: 4, up: 0,
      draw(P) {
        const G0 = '#e0b458', J = '#7ae8d8';
        P(0, 0, 128, 64, '#1c1638'); P(10, 2, 108, 60, '#5a4ac8'); P(10, 2, 108, 14, '#3a2e90');
        for (let i = 0; i < 40; i++) P(12 + Math.floor(hash(i, 3, 351) * 104), 3 + Math.floor(hash(i, 5, 353) * 56), 1, 1, '#ffffff');
        for (const x of [10, 44, 82, 116]) { P(x, 2, 3, 60, '#141030'); }
        P(10, 46, 108, 4, '#2e2658'); P(10, 50, 108, 2, G0);
        P.oval(64, 28, 24, 24, '#14503e'); P.oval(64, 28, 21, 21, J); P.oval(64, 28, 16, 16, '#e8fff4');
        P.oval(64, 28, 11, 11, '#4a5464'); P.oval(60, 26, 9, 9, '#e8fff4'); for (let i = 0; i < 5; i++) { const a = i * 0.9 - 0.4; P(Math.round(64 + Math.cos(a) * 13), Math.round(28 + Math.sin(a) * 13), 2, 2, '#4a5464'); }
        P.ring(64, 28, 24, 24, G0);
      },
      lights() { return [[64, 28, 44, '#8a7aff', 0.3, true]]; }
    },
    abacus: {
      w: 2, h: 1, up: 2,
      draw(P) {
        P(2, 4, 28, 12, '#14503e'); P(2, 4, 28, 1, '#e0b458'); P(2, 15, 28, 1, '#e0b458'); P(2, 4, 1, 12, '#e0b458'); P(29, 4, 1, 12, '#e0b458');
        for (let y = 7; y < 15; y += 3) { P(3, y, 26, 1, '#3e9a78'); for (let x = 5; x < 28; x += 5) P(x + (y % 2), y - 1, 3, 3, '#7fffd4'); }
      },
      lights() { return [[16, 10, 16, '#7fffd4', 0.2, true]]; }
    },
    matrixpillar: {
      w: 8, h: 9, up: 0,
      draw(P) {
        const K = '#14305a', M = '#2e6aa8', C0 = '#58f0e0', C1 = '#c8fff4', W0 = 'rgba(200,230,255,0.55)';
        P(12, 6, 104, 3, C0); P(12, 6, 3, 34, C0); P(113, 6, 3, 34, C0); P(12, 37, 22, 3, C0); P(94, 37, 22, 3, C0);
        P(46, 0, 36, 12, K); P(50, 12, 28, 14, M); P(50, 12, 28, 2, C1);
        P(52, 26, 24, 62, '#1e8a9a'); for (let y = 30; y < 86; y += 10) { P(52, y, 24, 2, C0); P(56, y + 3, 16, 4, '#58c8d8'); }
        P(40, 22, 8, 66, W0); P(80, 22, 8, 66, W0); P(24, 30, 7, 46, W0); P(97, 30, 7, 46, W0);
        P(62, 88, 4, 8, C1); P.tri([50, 88, 78, 88, 64, 98], K);
        P.oval(64, 118, 18, 8, '#3e2a8a'); P.ring(64, 118, 18, 8, '#e0b458'); P.ring(64, 118, 8, 16, '#e0b458'); P(62, 98, 4, 10, 'rgba(120,240,230,0.6)');
      },
      lights() { return [[64, 56, 66, '#58f0e0', 0.3, true], [64, 118, 34, '#8a6aff', 0.26, true]]; }
    },
    roundaltar: {
      w: 5, h: 4, up: 4,
      draw(P) {
        P.shadow(40, 62, 36, 4);
        P.oval(40, 44, 36, 18, '#445aa0'); P.oval(40, 40, 36, 18, '#94a8e8'); P.ring(40, 40, 36, 18, '#e8d080');
        P.oval(40, 38, 24, 12, '#1e2860'); P.oval(40, 36, 18, 9, '#f4fbff'); P.oval(40, 36, 11, 5, '#58f0e0');
      },
      lights() { return [[40, 34, 40, '#58f0e0', 0.2, true]]; }
    },
    gatebar: {
      w: 3, h: 1, up: 18,
      draw(P, v) {
        const K = '#0e1838', C0 = '#58f0e0', M = '#2e4680';
        if (v === 1) { P(24, 4, 10, 48, K); P(26, 6, 6, 44, M); for (let y = 10; y < 50; y += 8) P(26, y, 6, 2, C0); return; }
        P(0, 2, 48, 32, K); P(2, 4, 44, 28, M); P(2, 4, 44, 2, C0);
        for (let x = 6; x < 44; x += 7) P(x, 8, 2, 24, C0);
        P(20, 14, 8, 8, '#e8d080');
      },
      lights() { return [[24, 16, 24, '#58f0e0', 0.2, true]]; }
    },
    inkblossom: {
      w: 4, h: 4, up: 14,
      draw(P) {
        const K = '#14101e', K1 = '#2e2838', W0 = '#f4f8ff', W1 = '#c8d8f0', W2 = '#8aa0d0';
        P.shadow(32, 76, 14, 3);
        P(28, 44, 7, 32, K); P(30, 44, 2, 32, K1); P.line(31, 50, 10, 28, K, 3); P.line(32, 46, 54, 24, K, 3); P.line(32, 40, 30, 14, K, 3);
        for (const [cx, cy, rx, ry] of [[10, 24, 10, 7], [30, 12, 13, 8], [54, 22, 10, 7], [20, 36, 7, 5], [44, 36, 7, 5]]) {
          P.oval(cx, cy + 1, rx, ry, W2); P.oval(cx, cy, rx - 1, ry - 1, W1);
          for (let i = 0; i < rx * 2; i++) { const a = hash(cx, i, 361) * Math.PI * 2, d = hash(cy, i, 363), x = Math.round(cx + Math.cos(a) * d * rx), y = Math.round(cy + Math.sin(a) * d * ry); P(x, y, 2, 1, W0); }
        }
      },
      lights() { return [[32, 20, 34, '#c8d8ff', 0.16, true]]; }
    },
    jadepanel: {
      w: 2, h: 1, up: 6,
      draw(P) {
        const C0 = '#7affe8', C1 = '#c8fff4';
        P(2, 2, 28, 18, '#0e1838'); P(4, 4, 24, 14, '#1e6a80'); P(4, 4, 24, 1, C1); P(4, 17, 24, 1, C0); P(4, 4, 1, 14, C0); P(27, 4, 1, 14, C0);
        P.tri([16, 6, 22, 11, 16, 16, 10, 11], C0); P.tri([16, 8, 20, 11, 16, 14, 12, 11], '#0e3a48');
      },
      lights() { return [[16, 10, 18, '#7affe8', 0.26, true]]; }
    },
    stele: {
      w: 3, h: 3, up: 8,
      draw(P) {
        const K = '#14305a', C0 = '#58f0e0', C1 = '#c8fff4';
        P.tri([0, 22, 10, 6, 14, 22], '#1a2a58'); P.tri([48, 22, 38, 6, 34, 22], '#1a2a58');
        P(14, 2, 20, 50, K); P(16, 4, 16, 46, '#1e6a80'); P(16, 4, 16, 1, C1); P(16, 49, 16, 1, C0);
        P.tri([24, 10, 33, 20, 24, 30, 15, 20], '#0e1838'); P.tri([24, 12, 31, 20, 24, 28, 17, 20], C0); P.tri([24, 15, 28, 20, 24, 25, 20, 20], '#0e3a48');
        P(10, 52, 28, 4, '#445aa0'); P(10, 52, 28, 1, '#94a8e8');
      },
      lights() { return [[24, 20, 28, '#58f0e0', 0.3, true]]; }
    },
    arbortree: {
      w: 10, h: 12, up: 0,
      size: v => (v === 1 ? [10, 6] : [10, 12]),
      draw(P, v) {
        const K = '#2a1a34', K1 = '#4a2e50', Y = '#c8e870', Y1 = '#f4ffb8', Y2 = '#7a9a50', q = v === 1 ? 0.5 : 1, Q = y => Math.round(y * q);
        P.line(80, Q(190), 78, Q(120), K, 16); P.line(80, Q(190), 78, Q(120), K1, 4);
        P.line(78, Q(130), 36, Q(84), K, 8); P.line(78, Q(120), 122, Q(76), K, 8); P.line(78, Q(110), 74, Q(50), K, 8); P.line(36, Q(84), 14, Q(70), K, 4); P.line(122, Q(76), 148, Q(64), K, 4); P.line(74, Q(50), 46, Q(30), K, 4); P.line(74, Q(50), 108, Q(26), K, 4);
        for (const [cx, cy0, rx, ry0] of [[14, 62, 14, 8], [42, 78, 16, 9], [48, 24, 18, 10], [80, 14, 20, 10], [112, 22, 18, 10], [126, 66, 18, 10], [150, 56, 10, 7], [76, 58, 14, 8]]) {
          const cy = Math.max(6, Q(cy0)), ry = Math.max(5, Q(ry0));
          P.oval(cx, cy + 2, rx, ry, Y2); P.oval(cx, cy, rx - 1, ry - 1, Y);
          for (let i = 0; i < rx * 2; i++) { const a = hash(cx, i, 371) * Math.PI * 2, d = hash(cy0, i, 373), x = Math.round(cx + Math.cos(a) * d * rx), y = Math.round(cy + Math.sin(a) * d * ry); P(x, y, 2, 1, Y1); }
        }
      },
      lights() { return [[80, 50, 90, '#d8f080', 0.22, true]]; }
    },
    forge: {
      w: 9, h: 10, up: 0,
      size: v => (v === 1 ? [5, 6] : [9, 10]),
      draw(P, v) {
        const k = v === 1 ? 0.55 : 1, X = a => Math.round(a * k), K = '#1a1420', K1 = '#32283a', Y = '#ffd060', T = '#58f0e0', B = '#8a6a34', B1 = '#c8a050';
        const root = (a, b, c, d, w) => { P.line(X(a), X(b), X(c), X(d), K, Math.max(2, Math.round(w * k))); };
        for (const [a, b, c, d, w] of [[20, 158, 56, 92, 8], [124, 158, 88, 92, 8], [8, 120, 52, 70, 6], [136, 120, 92, 70, 6], [40, 30, 66, 60, 5], [108, 26, 80, 60, 5], [72, 0, 72, 40, 5], [30, 68, 110, 40, 3], [110, 76, 30, 44, 3]]) root(a, b, c, d, w);
        P.oval(X(72), X(78), X(32), X(36), B); P.oval(X(72), X(76), X(28), X(32), B1); P.oval(X(72), X(78), X(20), X(24), '#3a2a18'); P.oval(X(72), X(78), X(14), X(17), Y); P.oval(X(72), X(78), X(7), X(9), '#fff4b8');
        for (const [a, b, c, d] of [[46, 56, 96, 100], [96, 52, 48, 104], [40, 86, 104, 72]]) { P.line(X(a), X(b), X(c), X(d), K, Math.max(2, Math.round(5 * k))); P.line(X(a), X(b), X(c), X(d), K1, 1); }
        P.line(X(20), X(100), X(124), X(60), T); P.line(X(16), X(108), X(128), X(68), 'rgba(88,240,224,0.5)');
        for (const [x, y] of [[32, 40], [112, 30], [24, 90], [126, 96], [60, 20], [90, 120]]) P(X(x), X(y), 2, 2, Y);
      },
      lights(v) { const k = v === 1 ? 0.55 : 1; return [[Math.round(72 * k), Math.round(78 * k), Math.round(80 * k), '#ffd060', 0.32, true]]; }
    },
    rootknot: {
      w: 2, h: 3, up: 6,
      draw(P) {
        const K = '#1a1420', K1 = '#32283a', Y = '#ffd060';
        P.line(16, 50, 14, 24, K, 7); P.line(16, 50, 26, 34, K, 5); P.line(14, 26, 6, 10, K, 4); P.line(14, 26, 24, 8, K, 4); P.line(14, 40, 4, 30, K, 3);
        P.line(15, 48, 14, 26, K1); P.line(15, 44, 15, 32, Y); P.line(22, 16, 19, 22, Y); P.line(9, 16, 12, 22, Y);
      },
      lights() { return [[15, 36, 16, '#ffd060', 0.2, true]]; }
    },
    rootmass: {
      w: 4, h: 3, up: 0,
      draw(P) {
        const K = '#1a1420', K1 = '#2e2436', Y = '#ffd060';
        for (const [a, b, c, d, w] of [[4, 44, 26, 14, 6], [60, 44, 34, 12, 6], [18, 46, 46, 18, 5], [46, 46, 14, 20, 4], [30, 46, 30, 6, 6]]) { P.line(a, b, c, d, K, w); P.line(a, b, c, d, K1); }
        P.line(28, 36, 32, 16, Y); P.line(14, 30, 20, 22, Y); P.line(46, 28, 42, 20, Y);
      },
      lights() { return [[30, 26, 22, '#ffd060', 0.16, true]]; }
    },
    scrollfall: {
      w: 3, h: 3, up: 0,
      draw(P) {
        const C0 = '#58d8f8', C1 = '#c8f4ff', K = '#14304a';
        P(6, 0, 36, 6, K); P(6, 0, 36, 1, C0); P(10, 6, 28, 38, '#1e5a8a'); P(10, 6, 2, 38, C0); P(36, 6, 2, 38, C0); P(8, 44, 32, 4, K); P(8, 44, 32, 1, C0);
        P.tri([24, 12, 33, 22, 24, 32, 15, 22], C0); P.tri([24, 15, 30, 22, 24, 29, 18, 22], '#14406a'); P(22, 21, 4, 2, C1);
        for (let y = 34; y < 44; y += 3) P(14, y, 20, 1, C0);
      },
      lights() { return [[24, 24, 30, '#58d8f8', 0.3, true]]; }
    },
    aurumwhite: {
      w: 2, h: 3, up: 0,
      draw(P) {
        const W0 = '#c8ccd0', W1 = '#e8eaec', W2 = '#8a9098', K = '#2a2e34';
        P.shadow(16, 46, 13, 2);
        P(4, 6, 24, 40, K); P(6, 8, 20, 36, W2); P(7, 9, 8, 34, W0); P(17, 9, 8, 34, W0); P(7, 9, 8, 1, W1); P(17, 9, 8, 1, W1); P(15, 8, 2, 36, K);
        P.oval(16, 20, 6, 6, K); P.oval(16, 20, 4, 4, W2);
      }
    },
    maple: {
      w: 5, h: 5, up: 20,
      draw(P, v) {
        const K = ['#3a2a24', '#5a4438'], Pt = v === 1 ? ['#e0562e', '#ff9a5a', '#8a2e1c'] : ['#f0882e', '#ffc05a', '#a8541c'];
        P.shadow(40, 96, 20, 4);
        P(36, 58, 8, 38, K[0]); P(38, 58, 2, 38, K[1]); P.line(39, 68, 16, 38, K[0], 4); P.line(41, 62, 64, 32, K[0], 4); P.line(40, 54, 36, 20, K[0], 3);
        const crowns = [[16, 30, 15, 11], [40, 16, 19, 13], [64, 26, 15, 11], [28, 44, 12, 8], [54, 42, 12, 8]];
        for (const [cx, cy, rx, ry] of crowns) { P.oval(cx, cy + 2, rx, ry, Pt[2]); P.oval(cx, cy, rx - 1, ry - 1, Pt[0]); }
        for (const [cx, cy, rx, ry] of crowns) for (let i = 0; i < rx * 3; i++) {
          const a = hash(cx, i, 381) * Math.PI * 2, d = hash(cy, i, 383), x = Math.round(cx + Math.cos(a) * d * rx), y = Math.round(cy + Math.sin(a) * d * ry);
          P(x, y, 2, 1, hash(i, cx + cy, 385) > 0.5 ? Pt[1] : Pt[2]);
        }
      }
    },
    waterfall: {
      w: 3, h: 4, up: 0,
      draw(P) {
        const W0 = '#d8f0f0', W1 = '#ffffff', B = '#6ab8c0', D = '#3a8a98';
        P(4, 0, 40, 58, B); P(4, 0, 40, 4, W1);
        for (let i = 0; i < 5; i++) P(8 + i * 7, 4, 2, 54, D);
        for (let i = 0; i < 14; i++) { const x = 6 + Math.floor(hash(i, 1, 387) * 34), y = 2 + Math.floor(hash(i, 2, 387) * 30), h = 10 + Math.floor(hash(i, 3, 387) * 24); P(x, y, 2, h, i % 3 ? W0 : W1); }
        P.oval(24, 58, 24, 5, W0); P.oval(24, 58, 18, 3, W1); P.oval(8, 61, 6, 2, W1); P.oval(40, 61, 6, 2, W1);
      }
    },
    blackroot: {
      w: 8, h: 5, up: 0,
      draw(P, v) {
        const K = '#141a14', M = '#2a3e28', Hi = '#5a7a3a', X = x => (v === 1 ? 128 - x : x), R0 = Math.round;
        const curve = (ax, ay, bx, by, cx, cy, r0, r1) => {
          const at = i => { const t = i / 24, u = 1 - t; return [u * u * ax + 2 * u * t * bx + t * t * cx, u * u * ay + 2 * u * t * by + t * t * cy, r0 + (r1 - r0) * t]; };
          for (let i = 0; i <= 24; i++) { const [x, y, r] = at(i); P.oval(R0(X(x)), R0(y), R0(r + 1), R0(r * 0.85 + 1), K); }
          for (let i = 0; i <= 24; i++) { const [x, y, r] = at(i); P.oval(R0(X(x)), R0(y - r * 0.25), Math.max(1, R0(r * 0.62)), Math.max(1, R0(r * 0.42)), M); }
          for (let i = 0; i <= 24; i += 2) { const [x, y, r] = at(i); P(R0(X(x)) - 1, R0(y - r * 0.55), 3, 1, Hi); }
        };
        curve(0, 72, 30, 40, 66, 30, 9, 4); curve(128, 72, 98, 34, 60, 24, 10, 4); curve(34, 76, 46, 50, 62, 18, 7, 3); curve(96, 76, 84, 52, 56, 14, 7, 3); curve(60, 24, 62, 10, 74, 3, 3, 1); curve(60, 22, 50, 8, 36, 5, 3, 1); curve(40, 34, 26, 26, 14, 26, 3, 1);
      }
    },
    octroof: {
      w: 10, h: 9, up: 10,
      draw(P) {
        const Z = ALCH, R = Z.roof, F0 = Z.face, G0 = Z.gold, J0 = '#58d8c0';
        P.shadow(80, 151, 74, 4);
        P(16, 92, 128, 58, F0[2]); P(18, 94, 124, 54, F0[0]); P(18, 94, 124, 2, F0[1]); P(16, 146, 128, 4, Z.base);
        for (const x of [18, 46, 74, 110, 138]) { P(x, 94, 4, 54, Z.post[0]); P(x, 94, 1, 54, Z.post[1]); }
        for (const x of [24, 52, 116]) { P(x, 104, 20, 28, Z.post[0]); P(x + 1, 105, 18, 26, Z.glass[0]); P(x + 1, 105, 3, 26, Z.glass[1]); for (let y = 110; y < 132; y += 6) P(x + 1, y, 18, 1, Z.frame); for (let a = x + 6; a < x + 20; a += 6) P(a, 105, 1, 26, Z.frame); }
        P(80, 110, 28, 38, Z.door[2]); P(82, 112, 24, 36, Z.door[0]); P(82, 112, 24, 2, Z.door[1]); P(93, 112, 2, 36, Z.door[2]);
        P.tri([0, 92, 30, 56, 130, 56, 160, 92, 132, 104, 28, 104], R[0]);
        P.tri([0, 92, 30, 56, 56, 56, 40, 104, 28, 104], R[1]);
        for (let i = 0; i < 9; i++) { P.line(38 + i * 11, 58, 24 + i * 14, 102, R[2]); }
        P(26, 102, 108, 3, Z.trim[0]); P(28, 105, 104, 2, Z.trim[1]); P.tri([0, 92, 0, 84, 12, 88], R[0]); P.tri([160, 92, 160, 84, 148, 88], R[0]);
        P(46, 36, 68, 22, F0[0]); P(46, 36, 68, 2, F0[1]); for (const x of [52, 68, 84, 100]) { P(x, 41, 8, 13, J0); P(x, 41, 8, 1, '#ffffff'); }
        P.tri([28, 38, 54, 14, 106, 14, 132, 38, 108, 44, 52, 44], R[0]);
        P.tri([28, 38, 54, 14, 70, 14, 58, 44, 52, 44], R[1]);
        for (let i = 0; i < 6; i++) P.line(60 + i * 8, 16, 52 + i * 11, 42, R[2]);
        P(50, 42, 60, 3, Z.trim[0]);
        P(74, 0, 12, 14, G0); P(76, 2, 8, 10, J0); P.oval(80, 2, 6, 3, G0);
      },
      lights() { return [[80, 8, 30, '#58d8c0', 0.2, true]]; }
    },
    tent: {
      w: 4, h: 3, up: 6,
      draw(P) {
        const W0 = '#e8ecf4', W1 = '#ffffff', W2 = '#a8b4c8', T = '#3a6ad0', D = '#1e2838';
        P.shadow(32, 53, 30, 2);
        P.tri([4, 50, 18, 12, 46, 12, 60, 50], W2); P.tri([8, 50, 20, 14, 44, 14, 56, 50], W0);
        P.tri([8, 50, 20, 14, 30, 14, 24, 50], W1);
        P(24, 28, 16, 22, D); P(30, 28, 2, 22, '#3a4658'); P(22, 26, 20, 2, T);
        P(4, 48, 56, 3, T); P(18, 12, 28, 2, T); P(31, 0, 2, 12, D); P.tri([33, 0, 44, 3, 33, 7], T);
      }
    },
    crucible: {
      w: 3, h: 3, up: 8,
      draw(P, v) {
        const off = v === 1, B = off ? '#3e3428' : '#8a6a34', Bh = off ? '#5a4c38' : '#c8a050', Bd = off ? '#241e16' : '#4e3a1a';
        P.shadow(24, 54, 22, 3);
        P(8, 44, 6, 10, Bd); P(34, 44, 6, 10, Bd); P(21, 46, 6, 8, Bd);
        P.oval(24, 32, 22, 18, Bd); P.oval(24, 30, 21, 17, B); P(6, 26, 3, 10, Bh);
        P.oval(24, 16, 22, 6, Bd); P.oval(24, 15, 19, 4, off ? '#14100c' : '#7affa0'); if (!off) P.oval(24, 15, 11, 2, '#e8ffe0');
        P(4, 13, 40, 2, Bh);
        for (const x of [14, 24, 34]) { P(x - 3, 24, 6, 14, off ? '#5a5444' : '#e8dcb0'); P(x - 2, 27, 4, 1, off ? '#3a3428' : '#c8452a'); P(x - 2, 30, 4, 1, off ? '#3a3428' : '#c8452a'); P(x - 2, 33, 4, 1, off ? '#3a3428' : '#c8452a'); }
      },
      lights(v) { return v === 1 ? [] : [[24, 14, 44, '#7affa0', 0.34, true]]; }
    },
    bigcrucible: {
      w: 8, h: 6, up: 16,
      draw(P) {
        const K = '#141a18', B = '#3e3a24', Bh = '#7a6a3c', G0 = '#7affa0';
        P(26, 98, 12, 14, K); P(90, 98, 12, 14, K);
        P.oval(64, 76, 54, 34, K); P.oval(64, 72, 50, 31, B); P(16, 66, 5, 18, Bh);
        P.oval(64, 40, 56, 11, K); P.oval(64, 38, 48, 8, G0); P.oval(64, 38, 30, 5, '#e8ffe0'); P(8, 34, 112, 3, Bh);
        for (const x of [32, 64, 96]) { P(x - 6, 56, 12, 30, '#c8bc90'); for (let y = 60; y < 84; y += 6) P(x - 4, y, 8, 2, '#a8342a'); }
      },
      lights() { return [[64, 38, 90, '#7affa0', 0.36, true]]; }
    },
    elixirfurnace: {
      w: 7, h: 8, up: 40,
      draw(P) {
        const K = '#1e1812', B = '#7a5a2c', Bh = '#c8a050', Bd = '#4a3418', F0 = '#ff8a30', F1 = '#ffd060', F2 = '#fff4b8';
        P.tri([40, 8, 56, 60, 40, 74, 16, 74, 8, 60], F0); P.tri([62, 22, 74, 74, 42, 74, 50, 44], F0); P.tri([34, 0, 44, 40, 40, 74, 24, 74, 20, 44], F1); P.tri([58, 40, 66, 74, 46, 74, 50, 58], F1); P.tri([38, 26, 44, 60, 40, 76, 30, 76, 28, 56], F2);
        P.oval(56, 148, 54, 16, K);
        P.tri([6, 96, 26, 76, 86, 76, 106, 96, 106, 150, 86, 166, 26, 166, 6, 150], K);
        P.tri([10, 98, 28, 80, 84, 80, 102, 98, 102, 148, 84, 162, 28, 162, 10, 148], B);
        P.tri([10, 98, 28, 80, 40, 80, 26, 162, 28, 162, 10, 148], Bh);
        P(4, 92, 104, 5, Bh); P(8, 97, 96, 3, Bd); P(4, 146, 104, 4, Bd); P(6, 144, 100, 2, Bh);
        P(38, 108, 36, 40, K); P(42, 112, 28, 32, F0); P(46, 116, 20, 24, F1); P(50, 122, 12, 14, F2);
        for (const x of [20, 92]) { P(x - 4, 106, 8, 32, '#e8dcb0'); for (let y = 110; y < 136; y += 6) P(x - 2, y, 4, 2, '#a8342a'); }
      },
      lights() { return [[56, 40, 130, '#ff9a40', 0.42, true], [56, 128, 60, '#ffd060', 0.3, true]]; }
    },
    fogwall: {
      w: 5, h: 3, up: 10,
      draw(P) {
        for (const [cx, cy, rx, ry] of [[14, 38, 16, 14], [40, 34, 22, 18], [66, 38, 16, 14], [26, 24, 16, 12], [54, 22, 16, 12], [40, 44, 34, 11]]) { P.oval(cx, cy, rx, ry, 'rgba(70,170,110,0.62)'); P.oval(cx, cy - 2, rx - 4, ry - 4, 'rgba(150,240,180,0.34)'); }
      }
    },
    monsterbody: {
      w: 2, h: 1, up: 4,
      draw(P) {
        const A = '#c8ced8', D = '#6a7484', Fl = '#7a9a6a', Fh = '#a8cc8a', V = '#a060e0';
        P.shadow(16, 18, 15, 2);
        P(3, 10, 22, 7, D); P(5, 9, 18, 6, A); P(23, 8, 7, 7, D); P(24, 8, 5, 5, A); P(26, 10, 2, 1, '#2a2e34');
        P.line(10, 10, 4, 2, Fl, 2); P.line(16, 9, 20, 0, Fl, 2); P.line(4, 3, 1, 1, Fh); P.line(20, 1, 24, 0, Fh);
        P(14, 12, 3, 3, V); P(15, 11, 1, 1, '#e0c0ff');
      }
    },
    beastbody: {
      w: 2, h: 1, up: 6,
      draw(P) {
        const K = '#2e3a24', M = '#4a5e38', G0 = '#b8e070', S0 = '#7ac85a';
        P.shadow(16, 20, 15, 2);
        P.oval(16, 15, 13, 5, K); P.oval(16, 14, 12, 4, M); P.oval(27, 14, 5, 4, K); P.oval(27, 13, 4, 3, M); P(30, 12, 2, 2, K); P(6, 15, 3, 1, G0);
        P.line(12, 11, 11, 3, S0); P.line(11, 5, 7, 2, S0); P.line(11, 5, 15, 1, S0); P.line(20, 11, 21, 5, S0); P.line(21, 6, 24, 4, S0); P(10, 2, 2, 2, G0); P(14, 0, 2, 2, G0);
      }
    },
    scrollrack: {
      w: 2, h: 2, up: 8,
      draw(P) {
        const W0 = '#4a3a28', W1 = '#6a5438', W2 = '#2e2418';
        P.shadow(16, 39, 15, 2);
        P(1, 2, 30, 36, W2); P(1, 2, 30, 2, W1); P(3, 5, 26, 31, W0);
        for (const y of [14, 25]) P(3, y, 26, 2, W1);
        for (const [x, y, c] of [[5, 7, '#e8dcb0'], [9, 8, '#c8bc90'], [14, 7, '#e8dcb0'], [20, 8, '#a8d8c0'], [24, 7, '#e8dcb0'], [6, 18, '#c8bc90'], [11, 19, '#e8dcb0'], [17, 18, '#e8dcb0'], [22, 19, '#a8d8c0'], [5, 29, '#e8dcb0'], [12, 29, '#c8bc90'], [19, 29, '#e8dcb0'], [24, 29, '#c8bc90']]) { P(x, y, 3, 6, c); P(x, y + 2, 3, 1, '#a8342a'); }
      }
    },
    coral: {
      w: 2, h: 3, up: 0,
      draw(P, v) {
        const c = v === 1 ? ['#2e6ac8', '#6aa8f0', '#ffe070'] : ['#d8622e', '#f0915a', '#ffc08a'];
        P.shadow(16, 46, 10, 2);
        for (const [a, b, x, y, w] of [[16, 46, 15, 22, 3], [15, 30, 7, 14, 2], [15, 26, 24, 10, 2], [7, 14, 4, 6, 2], [7, 16, 12, 6, 1], [24, 10, 28, 3, 2], [24, 12, 19, 3, 1]]) { P.line(a, b, x, y, c[0], w); P.line(a - 1, b, x - 1, y, c[1]); }
        for (const [x, y] of [[4, 5], [12, 5], [28, 2], [19, 2]]) P(x - 1, y - 2, 3, 3, c[2]);
      }
    },
    seafan: {
      w: 5, h: 3, up: 0,
      draw(P) {
        const A = '#463a90', B = '#6a5ac0', C0 = '#a898f0', K = '#2a2460';
        P.shadow(40, 46, 22, 2);
        P(36, 24, 8, 22, K); P(38, 24, 2, 22, A);
        for (const [cx, cy, rx, ry] of [[40, 32, 26, 6], [38, 21, 32, 7], [42, 10, 22, 6]]) { P.oval(cx, cy + 2, rx, ry, K); P.oval(cx, cy, rx - 1, ry - 1, A); P.oval(cx - 2, cy - 1, rx - 6, ry - 3, B); P(cx - rx + 8, cy - 2, rx, 1, C0); }
      }
    },
    stonepillar: {
      w: 3, h: 5, up: 24,
      draw(P, v) {
        const K = '#2a3640', M = '#56646e', Hi = '#7e8e98', J0 = '#4ac0f0';
        P.shadow(24, 102, 22, 3);
        P(2, 88, 44, 14, K); P(4, 88, 40, 3, Hi); P(4, 91, 40, 9, M); P(8, 72, 32, 16, K); P(10, 72, 28, 3, Hi); P(10, 75, 28, 13, M); P(20, 78, 8, 8, J0);
        const top = v === 1 ? 26 : 6;
        P(12, top, 24, 72 - top, K); P(14, top, 20, 72 - top, M); P(14, top, 4, 72 - top, Hi);
        if (v === 1) P.tri([12, 26, 24, 18, 36, 26], K); else { P.tri([12, 6, 30, 0, 36, 10, 36, 14, 12, 12], K); P(14, 8, 20, 2, Hi); }
        P(22, 40, 4, 22, J0); P(16, 56, 16, 2, K);
      },
      lights() { return [[24, 80, 20, '#4ac0f0', 0.2, true]]; }
    },
    greenlamp: {
      w: 2, h: 4, up: 14,
      draw(P) {
        const K = '#202a34', M = '#56646e', Hi = '#7e8e98', G0 = '#7affc8', G1 = '#e8ffd0';
        P.shadow(16, 76, 13, 2);
        P(4, 68, 24, 8, K); P(6, 68, 20, 2, Hi); P(9, 26, 14, 42, K); P(11, 26, 10, 42, M); P(11, 26, 3, 42, Hi); P(5, 18, 22, 8, K); P(7, 18, 18, 2, Hi);
        P.tri([16, 0, 24, 14, 20, 18, 12, 18, 8, 14], G0); P.tri([16, 6, 20, 14, 16, 18, 12, 14], G1);
      },
      lights() { return [[16, 10, 44, '#7affc8', 0.4, true]]; }
    },
    dragonroot: {
      w: 10, h: 6, up: 0,
      draw(P) {
        const K = '#2a2e24', M = '#55583e', Hi = '#7e8050', Y = '#d8e870', R0 = Math.round;
        const curve = (ax, ay, bx, by, cx, cy, r0, r1, vein) => {
          const at = i => { const t = i / 30, u = 1 - t; return [u * u * ax + 2 * u * t * bx + t * t * cx, u * u * ay + 2 * u * t * by + t * t * cy, r0 + (r1 - r0) * t]; };
          for (let i = 0; i <= 30; i++) { const [x, y, r] = at(i); P.oval(R0(x), R0(y), R0(r + 1), R0(r * 0.9 + 1), K); }
          for (let i = 0; i <= 30; i++) { const [x, y, r] = at(i); P.oval(R0(x), R0(y - r * 0.2), Math.max(1, R0(r * 0.66)), Math.max(1, R0(r * 0.5)), M); }
          for (let i = 0; i <= 30; i += 3) { const [x, y, r] = at(i); P(R0(x) - 1, R0(y - r * 0.5), 3, 1, Hi); if (vein) P(R0(x), R0(y), 2, 1, Y); }
        };
        curve(44, 92, 20, 56, 70, 44, 11, 7, true); curve(70, 44, 110, 34, 76, 14, 7, 4, true); curve(76, 14, 60, 4, 34, 12, 4, 1, false); curve(72, 42, 112, 56, 150, 52, 6, 1, true); curve(78, 16, 118, 12, 142, 28, 4, 1, false); curve(44, 70, 22, 74, 10, 58, 4, 1, false);
      },
      lights() { return [[72, 40, 60, '#d8e870', 0.16, true]]; }
    },
    elderstatue: {
      w: 8, h: 7, up: 8,
      draw(P) {
        const K = '#232e38', M = '#5e6e7a', Hi = '#8a9aa6', Dk = '#3e4c58', J0 = '#4ac0f0';
        P(14, 104, 100, 16, K); P(16, 104, 96, 3, Hi); P(16, 107, 96, 11, M);
        P(26, 90, 76, 14, K); P(28, 90, 72, 2, Hi); P(28, 92, 72, 12, M); P(56, 94, 16, 8, J0); P(60, 96, 8, 4, '#c8f0ff');
        P.tri([42, 90, 49, 46, 79, 46, 88, 90], K); P.tri([45, 89, 52, 48, 76, 48, 85, 89], M); P.tri([45, 89, 52, 48, 60, 48, 54, 89], Hi);
        P(60, 50, 8, 40, Dk); P.line(48, 68, 80, 71, K, 3);
        P.line(51, 50, 34, 68, K, 8); P.line(51, 50, 35, 68, M, 4); P.line(77, 50, 92, 40, K, 8); P.line(77, 50, 92, 41, M, 4);
        P(48, 43, 32, 7, K); P(50, 43, 28, 2, Hi);
        P.oval(64, 33, 10, 11, K); P.oval(64, 32, 8, 9, M); P.oval(62, 30, 4, 5, Hi);
        P.line(57, 25, 48, 10, K, 4); P.line(57, 25, 49, 11, M, 2); P.line(71, 25, 80, 10, K, 4); P.line(71, 25, 79, 11, M, 2); P.line(52, 17, 44, 16, K, 2); P.line(76, 17, 84, 16, K, 2);
        P.line(94, 6, 94, 90, K, 5); P.line(94, 6, 94, 90, Hi, 1); P.tri([94, 0, 100, 12, 94, 18, 88, 12], Hi); P.tri([94, 3, 97, 12, 94, 15, 91, 12], J0);
      },
      lights() { return [[64, 98, 34, '#4ac0f0', 0.26, true]]; }
    },
    waterwall: {
      w: 6, h: 10, up: 24,
      draw(P) {
        const W = 96, Hh = 184, B0 = '#1e7a9a', B1 = '#3ea8c0', B2 = '#7ad8e0', B3 = '#d8fff8';
        P.tri([0, Hh, 0, 40, 18, 12, 60, 0, W, 6, W, Hh], B0);
        for (let x = 0; x < W; x += 6) { const top = 8 + Math.round(Math.abs(x - 58) * 0.42), n = hash(x, 2, 395); P(x, top + Math.round(n * 26), 3, Hh - top - Math.round(n * 40), n > 0.5 ? B1 : B0); if (n > 0.72) P(x + 3, top + 18, 1, 90, B2); }
        for (let x = 0; x < W; x += 3) { const top = 6 + Math.round(Math.abs(x - 58) * 0.42); P(x, top, 3, 3 + Math.round(hash(x, 5, 395) * 6), hash(x, 6, 395) > 0.4 ? B3 : B2); }
        for (let i = 0; i < 16; i++) { const x = Math.round(hash(i, 7, 395) * 92), y = Hh - 10 - Math.round(hash(i, 8, 395) * 10); P.oval(x, y, 7, 3, i % 2 ? B3 : B2); }
      }
    },
    marketgate: {
      w: 8, h: 4, up: 22,
      draw(P) {
        const K = '#141220', W0 = '#2e2834', R0 = '#7c2a22', R1 = '#a44434', Y = '#e8b050', A = '#ffc060', Rf = '#1e2236', Rh = '#2e3450';
        P(10, 34, 8, 52, K); P(12, 36, 4, 48, R0); P(110, 34, 8, 52, K); P(112, 36, 4, 48, R0);
        P(18, 42, 92, 44, K); P(20, 44, 88, 40, R0); P(20, 44, 88, 2, R1);
        for (let x = 28; x < 108; x += 16) { P(x, 46, 2, 36, K); for (let y = 52; y < 80; y += 8) P.oval(x + 8, y, 2, 2, Y); }
        P(62, 44, 4, 40, K); P.oval(59, 64, 2, 2, Y); P.oval(68, 64, 2, 2, Y);
        P(4, 28, 120, 8, K); P(6, 30, 116, 4, R0); P(6, 30, 116, 1, Y);
        P.tri([0, 28, 18, 12, 110, 12, 128, 28], Rf); P.tri([6, 26, 22, 14, 106, 14, 122, 26], Rh);
        for (let x = 22; x < 108; x += 8) P.line(x, 15, x + (x - 64) * 0.15, 26, Rf);
        P.tri([0, 28, 0, 20, 8, 24], Rf); P.tri([128, 28, 128, 20, 120, 24], Rf);
        P(52, 4, 24, 10, Rf); P(50, 12, 28, 2, K); P(58, 0, 12, 4, Rh);
        for (const x of [14, 114]) { P(x - 1, 36, 2, 4, K); P.oval(x, 44, 4, 5, '#e0442e'); P.oval(x, 43, 2, 3, A); }
      },
      lights() { return [[14, 44, 26, '#ffc060', 0.34, true], [114, 44, 26, '#ffc060', 0.34, true], [64, 60, 44, '#ff9a60', 0.12, true]]; }
    },
    stringlights: {
      w: 10, h: 2, up: 26,
      draw(P) {
        const K = '#141220', A = '#ffc060', B = '#fff0c0', W = 160;
        const sag = x => 8 + Math.round(Math.sin(x / W * Math.PI) * 14);
        P(0, 2, 2, 56, K); P(W - 2, 2, 2, 56, K);
        for (let x = 0; x < W; x += 2) P(x, sag(x), 2, 1, K);
        for (let x = 6; x < W; x += 12) { P(x, sag(x) + 1, 3, 3, x % 24 === 6 ? B : A); }
      },
      lights() { return [[80, 20, 80, '#ffc060', 0.14, true]]; }
    },
    spicesign: {
      w: 5, h: 1, up: 12,
      draw(P) {
        const K = '#141220', R0 = '#a8342a', R1 = '#d85a44', Y = '#e8b050';
        P(4, 2, 72, 24, K); P(6, 4, 68, 20, R0); P(6, 4, 68, 2, R1); P(6, 22, 68, 2, Y);
        for (let i = 0; i < 4; i++) { const x = 14 + i * 16; P(x, 8, 8, 2, Y); P(x + 3, 8, 2, 12, Y); P(x, 13, 8, 2, Y); P(x, 18, 8, 2, Y); }
      },
      lights() { return [[40, 14, 34, '#ff9a60', 0.26, true]]; }
    },
    wokstand: {
      w: 2, h: 2, up: 12,
      draw(P) {
        const K = '#141220', M = '#3a3440', F0 = '#ff8a30', F1 = '#ffd060';
        P(4, 22, 24, 12, K); P(6, 24, 20, 8, M); P.oval(16, 18, 11, 4, K); P.oval(16, 17, 9, 3, '#5a5060');
        for (const [x, h] of [[10, 8], [15, 11], [20, 7]]) { P.tri([x - 3, 26, x, 26 - h, x + 3, 26], F0); P.tri([x - 1, 26, x, 26 - h + 3, x + 1, 26], F1); }
        for (const [x, y] of [[9, 6], [17, 3], [24, 7]]) P.oval(x, y, 3, 2, 'rgba(220,220,240,0.35)');
      },
      lights() { return [[16, 18, 30, '#ff9a40', 0.36, true]]; }
    },
    diners: {
      w: 2, h: 2, up: 10,
      draw(P) {
        for (const [x, c, h] of [[4, '#3e7e86', '#2e2a2a'], [26, '#a03a2e', '#4a3430']]) { P(x - 3, 22, 6, 12, c); P(x - 3, 22, 6, 2, '#f4efe2'); P.oval(x, 18, 3, 3, '#f0d6c2'); P.oval(x, 16, 3, 2, h); }
        P(13, 16, 6, 3, '#f4efe2'); P(14, 13, 1, 2, 'rgba(220,220,240,0.5)'); P(17, 12, 1, 3, 'rgba(220,220,240,0.5)');
      }
    },
    adboard: {
      w: 1, h: 2, up: 4,
      draw(P) {
        const K = '#141220', G0 = '#3e8a6a', Y = '#e8b050', W0 = '#f4efe2';
        P(1, 4, 14, 22, K); P(2, 5, 12, 20, G0); P(2, 5, 12, 1, Y); P(4, 8, 8, 6, W0); P(4, 16, 8, 1, Y); P(4, 19, 8, 1, Y); P(3, 26, 2, 10, K); P(11, 26, 2, 10, K);
      }
    },
    seacover: {
      w: 35, h: 34, up: 0,
      size(v) { return v === 1 ? [4, 13] : [35, 34]; },
      draw(P, v) {
        const W = (v === 1 ? 4 : 35) * U, Hh = (v === 1 ? 13 : 34) * U, [b, hi, dk] = SEA.drop;
        P(0, 0, W, Hh, b);
        for (let y = 0; y < Hh; y += 2) for (let x = 0; x < W; x += 2) {
          const n = Math.sin(x * 0.045) + Math.sin(y * 0.11 + x * 0.02) + Math.sin((x + y) * 0.03);
          if (n > 1.5) P(x, y, 2, 2, hi); else if (n < -1.7) P(x, y, 2, 2, dk);
        }
      }
    },
    seawall: {
      w: 8, h: 6, up: 0,
      size(v) { return v === 1 ? [11, 4] : v === 2 ? [3, 4] : [8, 6]; },
      draw(P, v) {
        const low = v === 1, W = (low ? 11 : v === 2 ? 3 : 8) * U, Hh = (low || v === 2 ? 4 : 6) * U, B0 = '#14607e', B1 = '#2a8ea8', B2 = '#6ad0d8', B3 = '#dcfff8';
        const crest = x => (low ? Hh - 22 : 6) + Math.round(Math.sin(x * 0.05) * 4 + Math.sin(x * 0.17) * 2);
        for (let x = 0; x < W; x += 4) {
          const top = crest(x), n = hash(x, 3, 397);
          P(x, top, 4, Hh - top, n > 0.55 ? B1 : B0);
          if (n > 0.72 && !low) P(x + 1, top + 6 + Math.round(n * 10), 2, Math.round(16 + n * 40), B2);
          P(x, top, 4, 3 + Math.round(hash(x, 5, 397) * 5), hash(x, 6, 397) > 0.35 ? B3 : B2);
        }
        if (!low) for (let i = 0; i < W / 16; i++) { const x = Math.round(hash(i, 9, 397) * W); P.oval(x, Hh - 3, 8, 3, i % 2 ? B3 : B2); }
      },
      lights(v) { return v === 1 ? [] : [[32, 40, 70, '#58d8e8', 0.16, true]]; }
    },
    sealgate: {
      w: 1, h: 3, up: 18,
      draw(P) {
        const K = '#202a34', M = '#56646e', C0 = '#7affc8', C1 = '#e8ffd0';
        P(3, 0, 10, 66, K); P(5, 2, 6, 62, M);
        for (let y = 6; y < 62; y += 8) P(5, y, 6, 2, C0);
        P(6, 28, 4, 10, C1);
      },
      lights() { return [[8, 30, 26, '#7affc8', 0.24, true]]; }
    },
    vidyaegg: {
      w: 1, h: 1, up: 8,
      draw(P) {
        P.shadow(8, 22, 6, 2);
        P.oval(8, 14, 6, 8, '#3a5a80'); P.oval(8, 13, 5, 7, '#c8d8f0'); P.oval(6, 10, 2, 3, '#ffffff'); P.line(4, 16, 12, 14, '#7a9ac0');
      },
      lights() { return [[8, 12, 18, '#a8d0ff', 0.28, true]]; }
    },
    muralstone: {
      w: 2, h: 3, up: 0,
      draw(P, v) {
        const K = '#2a3640', M = '#56646e', Hi = '#8a9aa6', C0 = '#3e6a88', J0 = '#7affc8', Y = '#ffe89a', Sh = '#c8d8f0', Sea = '#1e5a8a';
        P.shadow(16, 46, 14, 2);
        P(2, 2, 28, 42, K); P(4, 4, 24, 38, M); P(4, 4, 24, 2, Hi); P(7, 8, 18, 28, C0);
        if (v === 1) { P.oval(16, 14, 5, 5, Y); P.oval(16, 27, 4, 6, Sh); P(7, 32, 18, 4, Sea); }
        else if (v === 2) { P(11, 16, 5, 16, Sh); P.oval(13, 13, 3, 3, Sh); P(19, 24, 4, 8, J0); P.oval(21, 21, 2, 2, J0); P.line(14, 18, 20, 22, Sh); }
        else if (v === 3) { P(7, 30, 18, 6, Sea); P(13, 12, 6, 10, J0); P.oval(16, 10, 2, 2, J0); P.line(13, 14, 8, 10, J0); P.line(18, 14, 24, 10, J0); for (const x of [9, 15, 21]) P(x, 28, 3, 1, Hi); }
        else { P.oval(16, 12, 4, 3, '#ff9a60'); P(7, 22, 18, 14, Sea); P.oval(16, 28, 4, 6, Sh); P.line(10, 24, 22, 24, Hi); }
      }
    },
    revslate: {
      w: 1, h: 1, up: 0,
      draw(P) { P(1, 2, 14, 12, '#2a3640'); P(2, 3, 12, 10, '#56646e'); for (const [x, y] of [[4, 10], [4, 5], [11, 10], [11, 5]]) P(x, y, 2, 2, '#7affc8'); }
    },
    bluegrass: {
      w: 1, h: 1, up: 4,
      draw(P) {
        for (const [x, h, c] of [[2, 12, '#3e70c0'], [5, 16, '#5a94e0'], [8, 13, '#3e70c0'], [11, 17, '#7ab4f0'], [13, 10, '#3e70c0']]) P.line(x, 20, x + (x % 3) - 1, 20 - h, c);
      }
    },
    lightcol: {
      w: 1, h: 3, up: 32,
      draw(P) {
        const a = 'rgba(122,232,255,0.34)', b = 'rgba(190,244,255,0.5)';
        P(4, 0, 8, 80, a); P(6, 0, 4, 80, b); P.oval(8, 72, 7, 4, '#245058'); P.oval(8, 71, 6, 3, '#7ae8ff');
      },
      lights() { return [[8, 30, 34, '#7ae8ff', 0.26, true]]; }
    },
    altar: {
      w: 4, h: 3, up: 14,
      draw(P) {
        const O = '#e07a2e', H0 = '#ffb060', D = '#8a3e14', G0 = '#e0b458';
        P.shadow(32, 60, 28, 3);
        P(6, 40, 52, 20, D); P(6, 40, 52, 2, G0); P(14, 26, 36, 16, O); P(14, 26, 36, 2, H0); P(24, 10, 16, 18, H0); P(24, 10, 16, 2, '#fff0c8'); P(28, 14, 8, 10, '#fff0c8');
        for (let x = 12; x < 56; x += 12) P(x, 46, 6, 10, O);
      },
      lights() { return [[32, 20, 40, '#ffa060', 0.3, true]]; }
    },
    desk: {
      w: 6, h: 1, up: 6,
      draw(P) {
        const K = '#14262c', G0 = '#e0b458';
        P(2, 2, 92, 16, K); P(2, 2, 92, 2, G0); P(2, 16, 92, 4, '#0c1e24');
        for (const x of [10, 42, 74]) { P(x, 6, 12, 6, '#7ae8ff'); P(x, 6, 12, 1, '#ffffff'); }
      }
    },
    coffin: {
      w: 2, h: 3, up: 8,
      draw(P) {
        const K = '#2a1e18', W0 = '#4a3428', G0 = '#c8a050';
        P.shadow(16, 54, 12, 3);
        P(6, 0, 20, 54, K); P(8, 2, 16, 50, W0); P(6, 8, 20, 3, G0); P(6, 44, 20, 3, G0); P(14, 16, 4, 20, G0); P(10, 22, 12, 4, G0);
      }
    },
    tower: {
      w: 8, h: 10, up: 30,
      draw(P) {
        const D = '#232e3e', M = '#3a4658', L = '#566478', R = '#c8452a', Rh = '#ea7a50', Rd = '#7c2a1c', T = '#46a8a0', G = '#e0b458', Z = PORT;
        P(48, 96, 32, 64, D); P(48, 96, 4, 64, M); P(76, 96, 4, 64, '#141c28');
        for (let y = 104; y < 160; y += 12) { P(44, y, 40, 3, M); P(44, y + 3, 40, 1, '#141c28'); }
        P.tri([16, 84, 34, 72, 94, 72], Rd); P(34, 72, 60, 24, Rd); P.tri([94, 72, 112, 84, 94, 96], Rd); P.tri([16, 84, 34, 96, 34, 72], Rd);
        P(30, 76, 68, 16, R); for (let x = 36; x < 92; x += 12) { P(x, 76, 2, 16, D); P(x + 3, 78, 6, 12, Rh); }
        P(26, 92, 76, 5, M); P(26, 92, 76, 1, L); P(30, 97, 68, 3, T);
        P.tri([0, 62, 26, 40, 102, 40], D); P(26, 40, 76, 22, D); P.tri([102, 40, 128, 62, 102, 62], D); P.tri([0, 62, 26, 62, 26, 40], M);
        for (let x = 30; x < 100; x += 8) P(x, 44, 2, 18, M);
        P(0, 62, 128, 4, G); P(4, 66, 120, 3, Z.trim[1]); P(12, 69, 104, 3, T);
        P(0, 58, 6, 8, T); P(122, 58, 6, 8, T); P(26, 38, 76, 3, L);
        P(52, 28, 24, 12, D); P(52, 28, 24, 2, L); P(58, 20, 12, 8, M); P(62, 6, 4, 14, G); P.oval(64, 6, 4, 4, T);
      },
      lights() { return [[64, 84, 60, '#ff9a60', 0.16, true], [64, 6, 18, '#8affd8', 0.3, true]]; }
    },
    cont: { w: 2, h: 2, up: 4, draw(P) { P.shadow(16, 36, 15, 2); container(P, 0, 0, 32, 36, 14, '#c8552e', '#e07a4a', '#a03e20'); } },
    crown: { w: 2, h: 2, up: 8, draw(P) { container(P, 0, 12, 32, 28, 10, '#3e4e62', '#5a6c82', '#2a3648'); container(P, 4, 0, 24, 22, 8, '#c8552e', '#e07a4a', '#a03e20'); } },
    banner: {
      w: 2, h: 1, up: 0,
      draw(P) {
        P(0, 2, 32, 12, '#7c1c14'); P(1, 3, 30, 10, '#d8301c'); P(0, 2, 32, 1, '#ff8a70'); P(0, 13, 32, 1, '#4a100c');
        P.tri([16, 3, 21, 8, 16, 13, 11, 8], '#ffe8d8'); P.tri([16, 5, 19, 8, 16, 11, 13, 8], '#d8301c');
        for (let x = 3; x < 10; x += 3) P(x, 6, 2, 4, '#ffd0c0'); for (let x = 23; x < 30; x += 3) P(x, 6, 2, 4, '#ffd0c0');
      },
      lights() { return [[16, 8, 22, '#ff5a40', 0.14, true]]; }
    },
    fallen: {
      w: 1, h: 1, up: 2,
      draw(P, v) {
        const A = '#e8ecf4', B = '#9aa4b8', T = '#3a6ad0', D = '#2e3a58';
        P.shadow(8, 15, 7, 2);
        if (v === 1) { P(5, 2, 7, 6, A); P(6, 3, 5, 3, D); P(3, 8, 11, 6, A); P(3, 8, 11, 1, '#ffffff'); P(5, 10, 7, 2, T); P(2, 14, 13, 3, D); return; }
        P(1, 9, 5, 5, A); P(2, 10, 3, 2, D); P(5, 8, 7, 6, A); P(5, 8, 7, 1, '#ffffff'); P(7, 10, 4, 2, T); P(11, 10, 5, 3, D);
        if (v === 2) P.dither(0, 7, U, 8, B, 1);
      }
    },
    vase: {
      w: 1, h: 1, up: 14,
      draw(P) {
        const W = '#eef4f6', S = '#b8ccd2', D = '#8aa4ac', K = '#5a7884';
        P.shadow(8, 29, 6, 2);
        P(5, 0, 6, 3, S); P(5, 0, 6, 1, W); P(6, 3, 4, 3, W); P.oval(8, 15, 7, 10, D); P.oval(8, 14, 6, 9, W); P(3, 8, 3, 8, '#ffffff'); P(5, 25, 6, 3, S);
        P.line(5, 8, 8, 13, K); P.line(8, 13, 6, 19, K); P.line(8, 13, 12, 18, K); P.line(10, 7, 8, 13, K); P.line(6, 19, 9, 23, K);
      }
    },
    parasol: {
      w: 1, h: 2, up: 0,
      draw(P) {
        P(7, 6, 2, 24, '#3a4658');
        P.tri([0, 10, 8, 0, 16, 10], '#3eb8ac'); P(0, 10, 16, 2, '#2a8a80'); P.tri([4, 10, 8, 2, 12, 10], '#7ae8d8');
      }
    },
    gable: {
      w: 1, h: 2, up: 10,
      draw(P, v) {
        const Z = LANDS[v] || DAY;
        P(1, 26, 14, 16, Z.face[1]); P(3, 16, 10, 12, Z.face[1]); P(5, 8, 6, 10, Z.face[1]);
        P(0, 24, 16, 2, Z.roof[2]); P(2, 14, 12, 2, Z.roof[2]); P(4, 6, 8, 2, Z.roof[2]);
        P(0, 23, 3, 1, Z.roof[1]); P(13, 23, 3, 1, Z.roof[1]); P(2, 13, 2, 1, Z.roof[1]); P(12, 13, 2, 1, Z.roof[1]); P(4, 5, 8, 1, Z.roof[1]);
        P(3, 28, 1, 14, Z.face[2]); P(12, 18, 1, 8, Z.face[2]);
      }
    },
    pine: {
      w: 2, h: 2, up: 26,
      draw(P, v) {
        const Z = LANDS[v] || DAY, lf = Z.night > 0.3 ? ['#2e8a86', '#60d8c8', '#14505a'] : ['#2e6e46', '#58a266', '#1a4a30'];
        P.shadow(16, 56, 12, 3);
        P(8, 48, 16, 9, Z.face[1]); P(8, 48, 16, 1, '#ffffff'); P(8, 56, 16, 1, Z.face[2]); P(10, 51, 12, 2, Z.trim[1]);
        P(14, 26, 4, 22, Z.post[0]); P(14, 26, 2, 22, Z.post[1]); P.line(15, 34, 6, 24, Z.post[0], 2); P.line(16, 30, 26, 20, Z.post[0], 2);
        for (const [x, y, rx, ry] of [[16, 10, 8, 3], [7, 22, 7, 3], [25, 18, 7, 3], [15, 17, 11, 4]]) { P.oval(x, y + 1, rx, ry, lf[2]); P.oval(x, y, rx, ry, lf[0]); P(x - rx + 2, y - 1, rx * 2 - 4, 1, lf[1]); }
      }
    },
    skiff: {
      w: 5, h: 2, up: 12,
      draw(P, v) {
        const Z = LANDS[v] || DAY;
        P.shadow(40, 42, 36, 3);
        P.tri([0, 22, 10, 16, 10, 30], Z.face[1]);
        P(10, 16, 58, 14, Z.face[1]); P(10, 16, 58, 1, '#ffffff'); P(10, 26, 58, 2, Z.trim[0]); P(10, 28, 58, 2, Z.roof[2]);
        P.tri([68, 16, 78, 19, 68, 30], Z.face[0]);
        P(14, 30, 50, 3, Z.roof[2]); P(72, 21, 6, 3, Z.jade); P(70, 26, 4, 2, Z.jade);
        P(24, 4, 30, 12, Z.ground2[0]); P(24, 4, 30, 1, Z.ground2[1]); P(21, 2, 36, 3, Z.roof[1]); P(21, 4, 36, 1, Z.roof[2]);
        for (let x = 27; x < 52; x += 7) { P(x, 7, 5, 6, Z.jade); P(x, 7, 5, 1, '#ffffff'); }
        P(58, 10, 2, 6, Z.gold); P.tri([60, 6, 68, 9, 60, 12], Z.trim[0]);
      },
      lights() { return [[70, 22, 18, '#8affd8', 0.3, true]]; }
    },
    palace: {
      w: 8, h: 6, up: 26,
      draw(P, v) {
        const Z = LANDS[v] || DAY, a = Z.trim[0], d = Z.trim[1];
        P(14, 74, 100, 48, Z.face[0]); P(14, 74, 100, 2, Z.face[1]); P(14, 118, 100, 4, Z.base);
        for (let x = 22; x < 110; x += 14) { P(x, 82, 8, 18, Z.glass[0]); P(x, 82, 2, 18, Z.glass[1]); P(x - 1, 81, 10, 1, Z.gold); }
        P(54, 96, 20, 26, Z.door[0]); P(54, 96, 20, 2, Z.gold); P(63, 96, 2, 26, Z.door[2]);
        P.tri([4, 74, 28, 56, 124 - 24, 56], Z.roof[0]); P(28, 56, 72, 18, Z.roof[0]); P.tri([100, 56, 124, 74, 100, 74], Z.roof[0]); P.tri([4, 74, 28, 56, 28, 74], Z.roof[1]);
        P(4, 74, 120, 3, a); P(4, 77, 120, 2, d); for (let x = 8; x < 120; x += 8) P(x, 71, 3, 3, Z.roof[1]);
        P(34, 36, 60, 20, Z.face[1]); P(34, 36, 60, 2, a); for (let x = 40; x < 90; x += 10) { P(x, 41, 5, 12, Z.jade); P(x, 41, 5, 1, '#ffffff'); }
        P.tri([26, 36, 46, 22, 82, 22], Z.roof[0]); P(46, 22, 36, 14, Z.roof[0]); P.tri([82, 22, 102, 36, 82, 36], Z.roof[0]); P(26, 36, 76, 2, a);
        P(58, 4, 12, 18, Z.gold); P(60, 6, 8, 14, Z.jade); P.oval(64, 4, 8, 4, a); P(63, 0, 2, 4, Z.gold);
      },
      lights() { return [[64, 14, 40, '#8affd8', 0.24, true]]; }
    },
    stall: {
      w: 3, h: 2, up: 12,
      draw(P, v) {
        const Z = LANDS[v] || DAY;
        P.shadow(24, 42, 22, 3);
        P(4, 24, 40, 18, Z.post[0]); P(4, 24, 40, 2, Z.post[1]); P(8, 28, 32, 6, Z.lit); P(8, 34, 32, 1, Z.frame);
        for (let x = 10; x < 38; x += 8) { P(x, 29, 4, 3, x % 16 ? Z.trim[0] : Z.jade); }
        P(4, 8, 2, 16, Z.frame); P(42, 8, 2, 16, Z.frame);
        for (let x = 0; x < 48; x += 8) { P(x, 2, 8, 10, x % 16 ? '#e8a040' : Z.face[1]); P(x, 12, 8, 2, x % 16 ? '#a86a20' : Z.face[2]); }
        P(0, 2, 48, 1, '#ffffff');
      },
      lights() { return [[24, 30, 26, '#ffd890', 0.22, true]]; }
    },
    lantern: {
      w: 1, h: 1, up: 28,
      draw(P, v) {
        const Z = LANDS[v] || DAY;
        P.shadow(8, 43, 5, 2);
        P(7, 4, 2, 40, Z.post[0]); P(7, 4, 1, 40, Z.post[1]); P(7, 4, 9, 2, Z.post[0]);
        P.oval(13, 13, 3, 4, '#e0442e'); P(11, 11, 4, 1, '#ffb080'); P(12, 8, 2, 1, Z.gold); P(12, 18, 2, 3, Z.gold);
      },
      lights() { return [[13, -14, 20, '#ff9a60', 0.32, true]]; }
    },
    blossom: {
      w: 5, h: 5, up: 26,
      draw(P) {
        const K = ['#1e1a2a', '#3a3044'], Pt = ['#9af0e0', '#e8fff8', '#3e9a9a'];
        P.shadow(40, 104, 22, 4);
        P(34, 62, 12, 42, K[0]); P(36, 62, 3, 42, K[1]); P.line(38, 70, 14, 40, K[0], 4); P.line(42, 66, 66, 34, K[0], 4); P.line(40, 56, 34, 20, K[0], 3); P.line(14, 42, 6, 28, K[0], 2); P.line(66, 34, 74, 22, K[0], 2);
        const crowns = [[14, 32, 12, 9], [40, 16, 16, 11], [66, 26, 12, 9], [27, 46, 9, 6], [55, 46, 9, 6]];
        for (const [cx, cy, rx, ry] of crowns) { P.oval(cx, cy + 1, rx, ry, Pt[2]); P.oval(cx, cy, rx - 1, ry - 1, Pt[0]); }
        for (const [cx, cy, rx, ry] of crowns) for (let i = 0; i < rx * 3; i++) {
          const a = hash(cx, i, 331) * Math.PI * 2, d = hash(cy, i, 333), x = Math.round(cx + Math.cos(a) * d * rx), y = Math.round(cy + Math.sin(a) * d * ry), k = hash(i, cx + cy, 335);
          P(x, y, 2, 1, k > 0.55 ? Pt[1] : Pt[2]);
        }
      },
      lights() { return [[40, 26, 56, '#8affe8', 0.26, true]]; }
    },
    stump: {
      w: 5, h: 4, up: 18,
      draw(P) {
        const D = '#1a1420', M = '#32283a', V = '#c8d870', Vd = '#5a7a3a';
        P.shadow(40, 80, 34, 4);
        P.tri([18, 80, 28, 14, 54, 80], D); P.tri([30, 80, 40, 6, 62, 80], M); P.tri([26, 80, 34, 30, 44, 80], D);
        P.line(40, 8, 24, 2, D, 4); P.line(42, 12, 58, 0, D, 3);
        P.line(16, 80, 0, 74, D, 5); P.line(22, 80, 6, 62, D, 4); P.line(60, 80, 78, 72, D, 5); P.line(56, 78, 72, 58, D, 4);
        P.line(38, 18, 34, 56, Vd); P.line(34, 56, 28, 76, Vd); P.line(46, 30, 50, 74, Vd); P.line(38, 18, 36, 40, V); P.line(46, 34, 48, 56, V); P.line(8, 66, 20, 76, Vd); P.line(70, 62, 58, 76, Vd);
      },
      lights() { return [[42, 40, 34, '#c8e870', 0.2, true]]; }
    }
  };

  const LAYER = {
    matrixcore(P, v, Z) {
      const cx = 136, cy = 136;
      P.oval(cx, cy, 128, 128, Z.ground2[2]); P.oval(cx, cy, 124, 124, Z.ground[0]); P.ring(cx, cy, 126, 126, Z.jade);
      for (const r of [100, 72, 44]) { P.ring(cx, cy, r, r, Z.ground2[1]); P.ring(cx, cy, r - 1, r - 1, Z.jade); }
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; P.line(Math.round(cx + Math.cos(a) * 44), Math.round(cy + Math.sin(a) * 44), Math.round(cx + Math.cos(a) * 100), Math.round(cy + Math.sin(a) * 100), Z.ground2[1]); }
      P.oval(cx, cy, 20, 20, Z.lacquer[0]); P.ring(cx, cy, 20, 20, Z.gold); P.oval(cx, cy, 8, 8, Z.jade);
    },
    mutcircle(P, v, Z) {
      const cx = 64, cy = 64;
      P.oval(cx, cy, 62, 62, '#c8d8e0'); P.oval(cx, cy, 56, 56, Z.ground2[2]); P.oval(cx, cy, 50, 50, '#a8905a'); P.oval(cx, cy, 44, 44, Z.ground[2]);
      for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 3; P.line(cx, cy, Math.round(cx + Math.cos(a) * 44), Math.round(cy + Math.sin(a) * 44), Z.jade); }
      P.ring(cx, cy, 30, 30, Z.ground2[1]); P.ring(cx, cy, 44, 44, Z.jade);
    },
    petals(P, v, Z) {
      const cx = 96, cy = 96, R = Math.round;
      P.oval(cx, cy, 94, 94, Z.ground2[2]); P.oval(cx, cy, 91, 91, Z.ground[2]); P.ring(cx, cy, 92, 92, Z.gold);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, x = R(cx + Math.cos(a) * 56), y = R(cy + Math.sin(a) * 56);
        P.oval(x, y, 32, 32, Z.ground2[0]); P.oval(x, y, 28, 28, Z.ground[0]); P.ring(x, y, 32, 32, Z.gold); P.oval(x, y, 7, 7, Z.ground2[1]);
      }
      P.oval(cx, cy, 28, 28, Z.lacquer[0]); P.ring(cx, cy, 28, 28, Z.gold); P.oval(cx, cy, 14, 14, Z.ground2[1]); P.oval(cx, cy, 6, 6, Z.jade);
    },
    board(P, v, Z) {
      const S = 128, G0 = Z.gold;
      P(0, 0, S, S, Z.ground[2]); P(2, 2, S - 4, S - 4, Z.ground[0]); P(6, 6, S - 12, 1, G0); P(6, S - 7, S - 12, 1, G0); P(6, 6, 1, S - 12, G0); P(S - 7, 6, 1, S - 12, G0);
      for (let x = 14; x <= 114; x += 14) { P(x, 6, 1, 50, G0); P(x, 72, 1, 50, G0); }
      for (const y of [18, 30, 42, 55, 72, 85, 97, 109]) P(6, y, S - 12, 1, G0);
      P.line(50, 6, 78, 30, G0); P.line(78, 6, 50, 30, G0); P.line(50, 97, 78, 121, G0); P.line(78, 97, 50, 121, G0);
    },
    duskline(P) {
      const W = 416, Hh = 64, Sky = ['#0c0f34', '#141848', '#1e2460', '#3a2e68', '#6a4068'];
      for (let y = 0; y < Hh; y++) P(0, y, W, 1, Sky[Math.min(Sky.length - 1, Math.floor(y / 13))]);
      for (let i = 0; i < 40; i++) P(Math.round(hash(i, 1, 399) * W), Math.round(hash(i, 2, 399) * 30), 1, 1, i % 4 ? '#c8d8ff' : '#ffffff');
      const K = '#1a2050', B = '#2a3a80', C0 = '#58a8e8';
      P.tri([150, Hh, 168, 22, 176, 8, 186, 0, 196, 8, 204, 22, 222, Hh], K);
      P(176, 24, 20, 40, B); for (const y of [30, 40, 50]) for (const x of [180, 186, 192]) P(x, y, 2, 3, C0);
      for (const [x, w, h] of [[60, 34, 18], [100, 26, 24], [236, 30, 22], [280, 36, 16], [330, 30, 26]]) { P(x, Hh - h, w, h, K); P.tri([x - 4, Hh - h, x + w / 2, Hh - h - 8, x + w + 4, Hh - h], K); for (let a = x + 4; a < x + w - 3; a += 7) P(a, Hh - h + 6, 2, 3, '#ffb060'); }
      P.oval(330, 16, 12, 7, '#7a4a2a'); P.oval(330, 15, 9, 5, '#e8a040'); P(322, 22, 16, 3, '#4a2e1c'); for (const x of [318, 342]) P.oval(x, 18, 2, 2, '#ffc060');
    },
    rootsfield(P) {
      const K = '#0e1008', M = '#262a18', Hi = '#3a4022', Y = '#a8c050', G0 = '#d8f080', R0 = Math.round, cx = 224, cy = 168;
      const curve = (ax, ay, bx, by, ex, ey, r0, r1, vein) => {
        for (let i = 0; i <= 32; i++) {
          const t = i / 32, u = 1 - t, x = u * u * ax + 2 * u * t * bx + t * t * ex, y = u * u * ay + 2 * u * t * by + t * t * ey, r = r0 + (r1 - r0) * t;
          P.oval(R0(x), R0(y), R0(r + 1), R0(r * 0.8 + 1), K);
          P.oval(R0(x), R0(y - r * 0.2), Math.max(1, R0(r * 0.62)), Math.max(1, R0(r * 0.42)), M);
          if (i % 2 === 0) P(R0(x), R0(y - r * 0.5), 2, 1, Hi);
          if (vein && i % 5 === 0) P(R0(x), R0(y), 2, 2, Y);
        }
      };
      for (const c of [[0, 60, 50, 90, 104, 120, 10, 3, true], [448, 60, 398, 90, 344, 120, 10, 3, true], [0, 200, 40, 190, 92, 182, 9, 3, true], [448, 200, 408, 190, 356, 182, 9, 3, true], [0, 320, 50, 310, 112, 280, 10, 3, true], [448, 320, 398, 310, 336, 280, 10, 3, true], [70, 384, 90, 340, 130, 296, 8, 2, false], [378, 384, 358, 340, 318, 296, 8, 2, false]]) curve(...c);
      for (let i = 0; i < 20; i++) {
        const a = i * Math.PI / 10 + 0.12, turn = i % 2 ? 0.8 : -0.8, r1 = 26 + (i % 3) * 8;
        curve(cx + Math.cos(a) * 128, cy + Math.sin(a) * 124, cx + Math.cos(a + turn * 0.4) * 88, cy + Math.sin(a + turn * 0.4) * 84, cx + Math.cos(a + turn) * r1, cy + Math.sin(a + turn) * r1, 5, 2, i % 4 === 0);
      }
      P.oval(cx, cy, 22, 20, K); P.oval(cx, cy - 1, 19, 17, M); P.oval(cx, cy - 3, 11, 9, Hi); P.oval(cx, cy - 3, 3, 3, Y); P(cx - 1, cy - 4, 2, 2, G0);
    },
    moonring(P, v, Z) {
      const cx = 160, cy = 160;
      P.ring(cx, cy, 150, 150, Z.seam); P.ring(cx, cy, 148, 148, Z.ground[2]); P.ring(cx, cy, 110, 110, Z.seam);
      for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, r = 124 + Math.sin(a * 2) * 12; P(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 3, 3, Z.seam); }
    },
    octagon(P, v, Z) {
      const R = 40, cx = 48, cy = 48;
      P.oval(cx, cy, R, R, Z.ground2[2]); P.oval(cx, cy, R - 2, R - 2, Z.ground[0]); P.ring(cx, cy, R - 1, R - 1, Z.gold);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, x = cx + Math.cos(a) * 22, y = cy + Math.sin(a) * 22;
        P.oval(Math.round(x), Math.round(y), 13, 13, Z.ground2[0]); P.ring(Math.round(x), Math.round(y), 13, 13, Z.gold);
      }
      P.oval(cx, cy, 12, 12, Z.lacquer[0]); P.ring(cx, cy, 12, 12, Z.gold); P.oval(cx, cy, 5, 5, Z.jade);
    },
    inlay(P, v, Z) { P(0, 7, U, 2, Z.gold); P(7, 0, 2, U, Z.gold); P(6, 6, 4, 4, Z.jade); },
    railh(P, v, Z) { P(0, 2, U, 2, Z.road[2]); P(0, 2, U, 1, Z.seam || Z.jade); P(0, 12, U, 2, Z.road[2]); P(0, 12, U, 1, Z.seam || Z.jade); for (let x = 2; x < U; x += 6) P(x, 4, 2, 8, Z.road[1]); },
    railv(P, v, Z) { P(2, 0, 2, U, Z.road[2]); P(2, 0, 1, U, Z.seam || Z.jade); P(12, 0, 2, U, Z.road[2]); P(12, 0, 1, U, Z.seam || Z.jade); for (let y = 2; y < U; y += 6) P(4, y, 8, 2, Z.road[1]); },
    shards(P) { for (const [x, y, w, h] of [[2, 6, 3, 7], [7, 3, 3, 10], [11, 8, 3, 5]]) { P(x, y, w, h, '#a060e0'); P(x, y, 1, h, '#e0c0ff'); } P(1, 13, 14, 1, '#5a2a8a'); P(4, 10, 8, 1, '#c8c8d8'); },
    seal(P, v, Z) { P(1, 1, 14, 22, Z.trim[1]); P(2, 2, 12, 20, Z.trim[0]); P(4, 5, 8, 1, Z.gold); P(4, 9, 8, 1, Z.gold); P(4, 13, 8, 1, Z.gold); P(4, 17, 8, 1, Z.gold); }
  };
  const LAYER_SIZE = { duskline: [26, 4], rootsfield: [28, 24], moonring: [20, 20], matrixcore: [17, 17], mutcircle: [8, 8], petals: [12, 12], board: [8, 8], octagon: [6, 6], inlay: [1, 1], seal: [1, 2], railh: [1, 1], railv: [1, 1], shards: [1, 1] };
  const LAYER_LIGHT = { rootsfield: () => [[224, 168, 190, '#c8f070', 0.18, true]], octagon: () => [[48, 48, 40, '#60f0d8', 0.12, true]] };

  const KIT = { LANDS, DECOR, LAYER, LAYER_LIGHT, BUILD, PROPS, floorPaint, roofTile, faceTile, rockFace: (...a) => J().KIT.rockFace(...a), rockTop: (...a) => J().KIT.rockTop(...a), propSprite, outside: 'herta', fallback: 'lf_haven' };
  function buildLayer(map) { return J().buildLayer(map, KIT); }

  const tex = Z => (P, e) => slabs(P, Z, e);
  Object.assign(G.THEMES, {
    lf_haven: { bg: '#3c84c6', fl: ['#a4aab0', '#bec4c8', '#7c8288', '#565a62'], fl2: ['#6e8e8c', '#8ab0ac', '#4a6664'], fl3: ['#8a5e3c', '#a87a50', '#5a3a24'], top: ['#3e444c', '#59616b', '#23272d'], face: ['#e6e2d4', '#f7f3e8', '#b8b2a2', '#68696c'], accent: '#58d8c0', accentDk: '#2a7a70', light: '#ffffff', tex: tex(DAY) },
    lf_port: { bg: '#3c84c6', fl: ['#8a93a0', '#a0a9b4', '#66707c', '#505a66'], fl2: ['#4e7480', '#6aa0a8', '#2e4e58'], fl3: ['#8a5e3c', '#a87a50', '#5a3a24'], top: ['#2e3a4c', '#48586c', '#1a2230'], face: ['#dfe6ec', '#f4f8fa', '#aeb8c4', '#5a6470'], accent: '#46a8a0', accentDk: '#2a7a70', light: '#ffffff', tex: tex(PORT) },
    lf_astrum: { bg: '#0c1e24', fl: ['#1e4a50', '#2a6066', '#123036', '#0c1e24'], fl2: ['#2e7e84', '#58c8b8', '#1c5258'], fl3: ['#7c2a22', '#a44434', '#4c1812'], top: ['#16323a', '#245058', '#0c1e24'], face: ['#2e7e84', '#46a8a8', '#1c5258', '#123036'], accent: '#7ae8ff', accentDk: '#2a7a70', light: '#7ae8ff', tex: tex(ASTRUM) },
    lf_ship: { bg: '#0a1c34', fl: ['#34506c', '#46688a', '#223a52', '#1a2e42'], fl2: ['#1e5a66', '#2e8a8a', '#123e48'], fl3: ['#3e4e5e', '#56687a', '#28343f'], top: ['#16283e', '#28405c', '#0a1626'], face: ['#3e6484', '#5a88a8', '#28465e', '#1c2e42'], accent: '#58f0d8', accentDk: '#2a7a70', light: '#7affe0', tex: tex(SHIP) },
    lf_art: { bg: '#2a3a78', fl: ['#2a4a6a', '#3a6088', '#1c3450', '#14283e'], fl2: ['#1e6a80', '#2ea0a8', '#124a60'], fl3: ['#2a4258', '#3c5a74', '#1a2e40'], top: ['#14304a', '#22486a', '#0a1c30'], face: ['#2e5a7a', '#467a9a', '#1c3e58', '#1c3e58'], accent: '#58f0e0', accentDk: '#1a7a8a', light: '#b8f0ff', tex: tex(ART_LAND) },
    lf_div: { bg: '#241a60', fl: ['#2e3a80', '#404e9c', '#1e2860', '#141c50'], fl2: ['#1e6a80', '#2ea0a8', '#124a60'], fl3: ['#3a2a78', '#5040a0', '#241a50'], top: ['#1a2a58', '#2e4680', '#0e1838'], face: ['#6a80c8', '#94a8e8', '#445aa0', '#2a3a78'], accent: '#58f0e0', accentDk: '#127a80', light: '#b8f0ff', tex: tex(DIV) },
    lf_seat: { bg: '#140e30', fl: ['#3a3258', '#4c4470', '#282240', '#1c1834'], fl2: ['#a8342a', '#d8604a', '#6a1e18'], fl3: ['#3e2a5a', '#5a4280', '#281a3e'], top: ['#1c1638', '#2e2658', '#100c24'], face: ['#2e2850', '#443a70', '#1c1834', '#1c1834'], accent: '#e0b458', accentDk: '#8a6a24', light: '#ffd890', tex: tex(SEAT) },
    lf_alch: { bg: '#2a8a88', fl: ['#a8b0b4', '#c0c8ca', '#7e868c', '#6a7478'], fl2: ['#5a8a84', '#7ab0a8', '#3e6460'], fl3: ['#7e7a5c', '#9a9672', '#54523c'], top: ['#3a4650', '#54626e', '#242c34'], face: ['#e8e8e0', '#fafaf4', '#b8bab0', '#6a7478'], accent: '#c8642e', accentDk: '#7c3a1c', light: '#ffffff', tex: tex(ALCH) },
    lf_mist: { bg: '#0c2a24', fl: ['#34463f', '#465a52', '#22302a', '#1a2622'], fl2: ['#2e5a4a', '#3e8066', '#1c3e32'], fl3: ['#3e3a2a', '#5a5240', '#28241a'], top: ['#1a2a28', '#2a3e3a', '#0e1a18'], face: ['#465a54', '#5e7a72', '#2c3c38', '#22302e'], accent: '#7affa0', accentDk: '#2e8a58', light: '#ffb860', tex: tex(MIST) },
    lf_dusk: { bg: '#141848', fl: ['#4a4e6a', '#5e6284', '#34384e', '#2a2e40'], fl2: ['#6a5a58', '#8a7468', '#4a3e40'], fl3: ['#3e4258', '#525672', '#2a2e40'], top: ['#1e2236', '#2e3450', '#12152a'], face: ['#2a2432', '#3e3446', '#1a1622', '#141220'], accent: '#e0a040', accentDk: '#8a5a20', light: '#ffd080', tex: tex(DUSK) },
    lf_roots: { bg: '#040806', fl: ['#2e3020', '#42462c', '#1c1e12', '#141608'], fl2: ['#3e3a1c', '#5a5428', '#28240e'], fl3: ['#3a2e1c', '#54442a', '#241c10'], top: ['#1a1e12', '#2a2e1c', '#0e1208'], face: ['#2e3a20', '#42522c', '#1e2814', '#141a0c'], accent: '#d8f080', accentDk: '#6a7a30', light: '#d8f080', tex: tex(ROOTS_LAND) },
    lf_sea: { bg: '#1e5a8a', fl: ['#7c8c98', '#96a6b0', '#5a6874', '#303c48'], fl2: ['#c0b494', '#d8ceb0', '#94886a'], fl3: ['#4e5a58', '#667470', '#343e3c'], top: ['#3e4a54', '#56646e', '#28323a'], face: ['#56646e', '#6e7e88', '#3a4650', '#303c48'], accent: '#4ac0f0', accentDk: '#1e6a90', light: '#c8f0ff', tex: tex(SEA) },
    lf_night: { bg: '#0e1234', fl: ['#3e4464', '#52587c', '#2a2e4a', '#1a1e34'], fl2: ['#2c5a66', '#3e7a84', '#1a3a46'], fl3: ['#54384a', '#6e4e60', '#361f30'], top: ['#1e2340', '#30385c', '#10142a'], face: ['#8e94b6', '#a8aed0', '#62688c', '#3a3e58'], accent: '#60f0d8', accentDk: '#2a7a70', light: '#ffc878', tex: tex(NIGHT) }
  });

  const META = G.FOE_META, ART = G.FOE_ART;
  const alias = (id, from, extra) => { META[id] = Object.assign({}, META[from], extra || {}); ART[id] = ART[from]; };
  const stroke = (p, col, x0, y0, x1, y1, w) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2; p.poly(col, [x0 + nx, y0 + ny, x1 + nx, y1 + ny, x1 - nx, y1 - ny, x0 - nx, y0 - ny]); };
  const crystal = (p, x, y, h, w, hi, mid) => { p.poly(mid, [x - w, y, x, y - h, x + w, y, x, y + h * 0.25]); p.poly(hi, [x - w * 0.4, y - h * 0.1, x, y - h, x + w * 0.1, y - h * 0.1]); };

  ART.mara = (p, f) => {
    const { bez, curve, seg, shard, glowing } = G.FOE_KIT;
    const E = '#140c0c', A = '#8c8070', Ah = '#b8ac98', Al = '#ddd4c2', Ad = '#5a5048', T = '#123a48', Th = '#22606e', P = '#2c2a2e', Ph = '#46444c';
    const Wd = '#3a2020', Wh = '#5a3428', Gd = '#e0902a', Gh = '#ffd060', Lf = '#f0b84a', Lfh = '#f8dc6a', Lfd = '#c07030', s = f ? 1.2 : 0;
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const limb = (x0, y0, x1, y1, w0, w1, col) => { seg(p, E, x0, y0, x1, y1, w0 + 1.6, w1 + 1.6); seg(p, col, x0, y0, x1, y1, w0, w1); };
    const spike = (x, y, len, a, w, col, hi) => { shard(p, E, null, x, y, len + 1.4, a, w + 0.9); shard(p, col, hi, x, y, len, a, w); };
    const branch = (x, y, len, a, w, crack) => {
      spike(x, y, len, a, w, Wd, Wh);
      if (crack) { const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx; curve(p, Gd, bez(x + dx * len * 0.1, y + dy * len * 0.1, x + dx * len * 0.5 + nx * w * 0.3, y + dy * len * 0.5 + ny * w * 0.3, x + dx * len * 0.86, y + dy * len * 0.86, 8), w * 0.5, 0.4); curve(p, Gh, bez(x + dx * len * 0.16, y + dy * len * 0.16, x + dx * len * 0.5 + nx * w * 0.3, y + dy * len * 0.5 + ny * w * 0.3, x + dx * len * 0.7, y + dy * len * 0.7, 8), w * 0.2, 0.2); }
    };
    const gink = (x, y, r, a) => {
      const pts = [x, y];
      for (let k = 0; k <= 6; k++) { const t = a - 0.75 + k * 0.25, rr = k === 3 ? r * 0.72 : r; pts.push(x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
      p.poly(Lfd, pts.map((v, i) => v + (i % 2 ? 0.6 : 0.4))); p.poly(Lf, pts); p.poly(Lfh, pts.slice(0, 2).concat(pts.slice(2, 10)));
    };
    branch(44, 15, 24, -0.36, 1.8, false);
    for (const [x, y, r, a] of [[52, 11, 4, -1.9], [56, 9, 4.4, -1.2], [60, 8, 3.8, -0.6], [55, 13, 3.6, 0.6], [62, 11, 3.4, 0.2]]) gink(x, y, r, a - s * 0.1);
    spike(31, 15, 25, 2.72, 3.6, Gd, Gh); spike(30, 14, 10, -1.95, 2, Gd, Gh);
    limb(52, 48, 62, 68, 7.6, 6.4, P); seg(p, Ph, 51, 49, 60, 67, 1.4, 1.2);
    p.poly(E, [56, 52, 62, 50, 66, 62, 62, 66, 57, 60]); p.poly(A, [57, 53, 61.4, 51.4, 64.6, 61.6, 61.6, 64.6, 57.8, 59.6]); p.poly(Al, [57, 53, 61.4, 51.4, 61.4, 53.6, 58, 56]);
    limb(62, 68, 72, 84, 6.2, 5.4, T); seg(p, Th, 61.4, 69, 70.6, 83, 1.4, 1);
    p.poly(E, [64, 68.6, 69, 66.4, 74.4, 79, 70.6, 82]); p.poly(A, [64.8, 69, 68.6, 67.4, 73.4, 78.6, 70.8, 80.8]); p.poly(Ah, [64.8, 69, 68.6, 67.4, 69.4, 70, 66, 71]);
    mass([70, 82, 77, 81, 79, 88, 80, 95, 72, 96, 71, 90], T); p.poly(Th, [70.8, 83, 76, 82, 77, 87, 72, 88]); seg(p, Gd, 71, 95.4, 79.6, 95, 1.2); seg(p, Gd, 76, 84, 77.4, 91, 0.8);
    mass([34, 22, 40, 16.6, 47, 16.4, 52, 20, 54, 29, 52, 38, 53, 46, 48, 51, 41, 50, 37.6, 44, 36, 36, 33, 28], A);
    p.poly(T, [49.6, 21, 52.6, 20.6, 54, 29, 52, 37.6, 49.6, 36.6]); p.poly(Th, [50.2, 22, 52, 21.6, 52.6, 28, 50.4, 30]);
    p.poly(Ah, [34.6, 22, 40, 17.4, 46.6, 17.2, 48.6, 24, 47.6, 33, 40, 34.6, 36.6, 30]); p.poly(Al, [35.4, 22, 40, 18.2, 44, 18.2, 39.6, 23, 37, 27]);
    seg(p, Ad, 36.4, 29, 48.4, 27.4, 0.8); seg(p, Ad, 37.6, 34.6, 49.4, 33, 0.8); seg(p, Ad, 42, 18, 44.6, 34, 0.7);
    p.poly(Ad, [38.6, 36, 49.6, 35, 50, 37, 39, 38]);
    p.poly(E, [40, 37, 54, 36, 54.6, 41.4, 40.6, 42.4]); p.poly('#6e665c', [40.8, 37.6, 53.8, 36.6, 54, 40.6, 41.2, 41.6]);
    for (let k = 0; k < 4; k++) { const x = 42.4 + k * 3; seg(p, '#a0968a', x, 38.2, x + 1.6, 40.8, 0.6); seg(p, '#a0968a', x + 1.6, 38.2, x, 40.8, 0.6); }
    p.poly(T, [41, 42.4, 54.6, 41.4, 55, 47, 49, 51.6, 41.4, 50]);
    limb(43, 47, 27, 52, 9, 7.4, P); seg(p, Ph, 42, 45, 27, 49.6, 1.6, 1.2); seg(p, T, 40, 50.6, 30, 53.4, 1.6, 1.2);
    p.poly(E, [22, 48.6, 28.4, 47.6, 30, 54, 25.6, 57, 21.6, 54]); p.poly(A, [22.8, 49.4, 27.8, 48.6, 29, 53.6, 25.6, 56, 22.6, 53.4]); p.poly(Al, [22.8, 49.4, 27.8, 48.6, 27, 50.6, 23.6, 51.4]);
    limb(25.4, 55, 23.6, 61, 6, 5.6, T);
    mass([19.6, 59.4, 28.4, 59, 29.6, 66, 22, 66.4, 16, 66.6, 15.6, 63.6], T); p.poly(Th, [20.4, 60, 27.6, 59.6, 27.6, 62, 20.4, 62.6]);
    seg(p, Gd, 15.6, 66, 29.4, 65.6, 1.2); seg(p, Gd, 21, 60.4, 22.6, 64.6, 0.8);
    spike(24, 52, 7, -2.4, 1.6, Gd, Gh); spike(25.6, 56, 6, 2.6, 1.4, Gd, Gh);
    seg(p, E, 36, 21, 33, 30, 5.4, 4.8); seg(p, A, 36, 21, 33, 30, 4, 3.4); p.ell(E, 35.6, 21.4, 4.6, 4); p.ell(Ah, 35.6, 21.2, 3.8, 3.2); p.ell(Al, 34.6, 20.2, 1.8, 1.4);
    mass([37.6, 18, 38.6, 13, 42, 10.6, 46.4, 11.4, 48, 15, 47, 20, 43, 22.6, 39, 21.6], A);
    p.poly(Ah, [38.4, 15, 41, 11.6, 44.6, 11.4, 41.6, 15.4, 39, 19]); p.poly(E, [39.4, 16.6, 46.6, 15.6, 46.2, 18, 40, 19]); p.poly(T, [40, 17, 46, 16.2, 45.6, 17.6, 40.4, 18.4]);
    branch(41, 12, 9, -1.95, 1.6, false); branch(45, 11, 8, -1.2, 1.4, false); branch(47, 13, 8, -0.6, 1.4, false);
    for (const [x, y, r, a] of [[35, 18, 3.4, -2.4], [32, 21, 3.6, 2.6], [40, 24, 3.2, 2.2], [44, 22, 3, -0.4], [39, 33, 3, 2.6]]) gink(x, y, r, a);
    branch(60, 50, 34, 2.58, 3.2, true);
    branch(50, 46, 40, -0.06 - s * 0.01, 3.4, true);
    for (const [x, y, r, a] of [[66, 41, 4.4, -1.6], [71, 40, 4.6, -1.2], [76, 39, 4.4, -0.9], [80, 42, 4, -0.3], [86, 43, 3.6, 0.2], [74, 47, 4.4, 1.4], [68, 47, 3.6, 1.9], [82, 37, 3.4, -1.4], [78, 34, 3.6, -1.6], [73, 34.6, 3.2, -2.2]]) gink(x, y - s, r, a);
    for (const [x, y, r, a] of [[46, 45, 3.6, 2.4], [50, 44, 3.8, -1.4], [53, 47, 3.6, 0.4], [47, 50, 3.4, 2]]) gink(x, y, r, a);
    for (const [x, y, r, a] of [[60, 56, 3.4, 0.2], [63, 61, 3.6, 0.8], [61, 66, 3.2, 2.4], [65, 70, 3.4, 0.4], [62, 73, 3, 2]]) gink(x, y, r, a);
  };
  ART.shifter = (p, f) => {
    const { bez, curve, seg, shard, glowing, ringBand } = G.FOE_KIT;
    const E = '#140c0c', A = '#9a8c7a', Ah = '#c4b6a0', Al = '#e2d8c4', Ad = '#6a5a4a', Ak = '#3a2626', Akh = '#5a4038', K = '#1c1a20', Kh = '#3a3640';
    const T = '#0e3a4c', Th = '#1e6474', Gd = '#e0902a', Gh = '#ffd060', Lf = '#f0b84a', Lfh = '#f8dc6a', Lfd = '#c07030', u = f ? -1.4 : 0, sw = f ? 1.2 : 0;
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const spike = (x, y, len, a, w, col, hi) => { shard(p, E, null, x, y, len + 1.4, a, w + 0.9); shard(p, col, hi, x, y, len, a, w); };
    const gink = (x, y, r, a) => {
      const pts = [x, y];
      for (let k = 0; k <= 6; k++) { const t = a - 0.75 + k * 0.25, rr = k === 3 ? r * 0.72 : r; pts.push(x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
      p.poly(Lfd, pts.map((v, i) => v + (i % 2 ? 0.6 : 0.4))); p.poly(Lf, pts); p.poly(Lfh, pts.slice(0, 2).concat(pts.slice(2, 10)));
    };
    seg(p, E, 21, 37.4 + sw, 47, 44, 2.4, 2.2); seg(p, T, 21, 37.4 + sw, 47, 44, 1.4, 1.2); seg(p, Th, 24, 37.6 + sw, 44, 42.6, 0.5);
    for (const t of [0.3, 0.62]) p.snap(Ah, 21 + 26 * t - 0.6, 37.4 + sw + (6.6 - sw) * t - 0.6, 1.2, 1.2);
    for (const [len, a, w] of [[15, 3.3, 1.8], [8, -1.95, 1.6], [8, -2.5, 1.6], [7, 2.4, 1.6], [6, 1.9, 1.4], [7, -1.2, 1.6], [6, 0.9, 1.4]]) spike(16, 35 + sw, len, a, w, K, Kh);
    mass([9, 33.6 + sw, 13.6, 30 + sw, 21, 30.4 + sw, 25, 34.4 + sw, 23.6, 39.4 + sw, 16, 40.6 + sw, 10, 38.6 + sw], K); p.poly(Kh, [10, 33.6 + sw, 13.6, 31 + sw, 20, 31.4 + sw, 16, 34 + sw]);
    ringBand(p, E, 21.6, 36.4 + sw, 3.2, 2.8, 1.6, 0, Math.PI * 2); ringBand(p, Ah, 21.6, 36.4 + sw, 2.8, 2.4, 1, 0, Math.PI * 2);
    for (const [x, y, r, a] of [[9, 31, 3, -2.4], [12, 37, 3.2, 2.4], [18, 30, 3, -1.4], [24, 33, 2.8, -0.6], [27, 39, 2.8, 0.6], [30, 41, 2.6, 1.2]]) gink(x, y + sw, r, a);
    mass([44.6, 58, 56, 57.4, 56.6, 66, 51, 69, 45.4, 67.4], K); p.poly(Kh, [45.4, 58.6, 50, 58.4, 48.6, 64, 45.6, 63]);
    mass([46, 66, 53, 65.6, 55, 76, 49, 77.6], T); p.poly(Th, [46.8, 66.6, 49.6, 66.4, 50.6, 75, 48.6, 76]); curve(p, Gd, bez(51.6, 67, 53.6, 71, 53.4, 75, 6), 0.7, 0.5);
    mass([41.6, 75.4, 53.4, 74.6, 55, 79.6, 42.6, 80.4], T); p.poly(A, [41.6, 75.4, 46, 75.2, 45.6, 80.2, 42.6, 80.4]); seg(p, Gd, 42.6, 80, 55, 79.4, 0.9);
    mass([40.6, 60.4, 50.4, 59.4, 52, 65.6, 46, 68.4, 41.6, 66], A); p.poly(Ah, [41.4, 61, 49.6, 60, 49.6, 62, 42, 63]);
    const shield = [43.6, 45, 44, 31, 50, 26, 60, 23.6, 70, 24.4, 75.6, 27.6, 80.4, 39, 86, 53, 91.6, 66, 96.6, 81.6, 91, 84, 79, 84.4, 70, 80, 62, 71.6, 56, 63.6, 48.4, 56];
    mass(shield, A);
    p.clipPoly(shield, () => {
      p.poly(K, [55.6, 60, 70, 58.4, 79.6, 57.6, 86.6, 67, 92.6, 79.6, 82.6, 81.6, 70.4, 78.4, 62.4, 70.4]);
      p.poly(T, [58.6, 61.4, 67.4, 60.6, 71.6, 71, 70.4, 77.6, 63.4, 70.4]); p.poly(Th, [59.6, 62, 63.6, 61.8, 64.6, 69, 62.6, 68.6]);
      for (const x of [72.6, 75.6, 78.6, 81.6]) seg(p, Kh, x, 60 + (x - 72.6) * 0.5, x + 5, 78.6 - (x - 72.6) * 0.2, 0.8);
      p.poly(T, [84.6, 67.4, 87.6, 67.8, 92.4, 79, 88.6, 80]);
      seg(p, Gd, 58, 70.4, 70.4, 80, 0.8); seg(p, Gd, 86, 66, 93.4, 80.4, 0.8);
      p.poly(Ad, [80.4, 39, 86, 53, 91.6, 66, 96.6, 81.6, 94.6, 82, 89, 66.6, 83.6, 53.6, 78.4, 40.6]); seg(p, T, 79.4, 40, 94.8, 80.6, 1.2); seg(p, Gd, 80, 39.4, 95.6, 81, 0.6);
      p.poly(Ad, [48.4, 56, 56, 63.6, 62, 71.6, 70, 80, 79, 84.4, 91, 84, 96.6, 81.6, 96.6, 86, 70, 86, 50, 62]);
      p.poly(Ah, [44, 31, 50, 26, 60, 23.6, 70, 24.4, 75.6, 27.6, 74, 29.6, 62, 27, 52, 29.4, 46.6, 34]);
      p.poly(Ak, [44, 31, 46.6, 34, 47.4, 44, 50, 52, 48.4, 56, 43.6, 45]); seg(p, Akh, 45, 34, 46.4, 46, 0.6);
      const plate = (pts, col) => p.poly(col, pts);
      plate([48.6, 36, 52.6, 30.6, 58.6, 28.4, 57, 36.6, 52.6, 44.6, 49.4, 46.6], Ah);
      plate([61.6, 28.4, 68, 27.4, 74.4, 30.4, 73.6, 36, 66.6, 34.6, 62.6, 33.4], Ah);
      plate([58.6, 36.4, 64.4, 35.4, 70, 37.4, 71.4, 46, 66.6, 52.6, 60, 53.6, 55.6, 48.4], A);
      plate([73.6, 37, 77.6, 41, 80, 49, 77, 55.4, 71.6, 54, 72.4, 44], Ad);
      plate([49.6, 51, 56, 49, 60.4, 54.6, 67, 53.6, 72.6, 56, 79.6, 57.4, 70, 58.8, 58.6, 59.6, 52, 56.6], Ad);
      for (const [x0, y0, x1, y1] of [[57, 36.6, 52.6, 44.6], [62.6, 33.4, 58.6, 36.4], [73.6, 36, 73.6, 37], [55.6, 48.4, 60, 54], [61.6, 28.4, 62.6, 33.4], [66.6, 52.6, 72.6, 56], [49.6, 51, 56, 49]]) seg(p, E, x0, y0, x1, y1, 1.2, 0.9);
      p.poly(E, [57.6, 29.6, 60.6, 28.4, 59.6, 40, 57.6, 47.6, 55.6, 46.4]); p.poly(Ak, [58.2, 30.6, 59.8, 29.8, 58.8, 40, 57.2, 46, 56.4, 45.4]);
      p.poly(E, [70.4, 37.6, 72.6, 37.4, 73.4, 50.6, 71, 51.6]); p.poly(Ak, [71, 38.4, 72, 38.4, 72.6, 49.6, 71.4, 50.4]);
      seg(p, Ah, 48.4, 57, 79.6, 57.6, 1, 0.8);
    });
    mass([50.4, 65, 57.6, 64.6, 59, 72, 52.6, 73.6], A); p.poly(Ah, [51.2, 65.6, 57, 65.2, 57.2, 67, 51.6, 67.6]); p.snap('#a83030', 52.4, 70.6, 1.4, 1);
    mass([53, 72, 59.6, 71.6, 61.6, 85, 56, 86.6], T); p.poly(Th, [53.8, 72.6, 56.4, 72.4, 57.4, 84.6, 56, 85.6]); curve(p, Gd, bez(58.6, 73, 60.6, 78, 60.4, 84, 6), 0.7, 0.5);
    mass([51.6, 86, 61.4, 85.4, 62.6, 92, 61.6, 96.6, 52.6, 96.6, 51, 93.6, 54.4, 91], T); p.poly(Th, [52.4, 86.6, 56, 86.2, 55.4, 91, 53, 91.6]); seg(p, Gd, 51.8, 96.2, 61.4, 96.2, 1); curve(p, Gd, bez(60.4, 86.4, 62, 90, 61, 95, 6), 0.7, 0.5);
    curve(p, E, bez(56.6, 46, 59, 38, 64, 30, 8), 2.2, 1.2); curve(p, '#3a2020', bez(56.6, 46, 59, 38, 64, 30, 8), 1.4, 0.6);
    curve(p, E, bez(57, 40, 53, 36, 49, 34, 6), 1.8, 1); curve(p, '#3a2020', bez(57, 40, 53, 36, 49, 34, 6), 1, 0.5);
    seg(p, E, 46.6, 41.6, 42.6, 44, 4.6, 4); seg(p, A, 46.6, 41.6, 42.6, 44, 3.4, 2.8); p.ell(E, 42.4, 44, 2.4, 2.2); p.ell(Ad, 42.4, 44, 1.8, 1.6);
    mass([50.4, 18, 52.6, 13, 55.6, 10.4, 58.6, 14.6, 59.6, 21.4, 58.4, 26, 51.6, 27.4, 49.6, 22.4], A);
    p.poly(Ah, [50.8, 18.4, 52.8, 13.6, 55.4, 11.4, 55, 15.6, 52.4, 20]); p.poly(Ad, [58.6, 14.6, 59.6, 21.4, 58.4, 26, 56.4, 20.6]);
    spike(55.4, 11.4, 6, -1.85, 1.4, A, Ah); spike(57.4, 13.4, 4.4, -0.9, 1.1, A, null); seg(p, Ak, 51, 22.4, 57.6, 21, 0.9); seg(p, Ak, 55.6, 15, 56, 25, 0.6);
    curve(p, E, bez(53, 12 + u, 59, 0 + u, 68.6, 12 + u, 12), 1.6, 1.4); curve(p, '#3a2020', bez(53, 12 + u, 59, 0 + u, 68.6, 12 + u, 12), 0.9, 0.8);
    curve(p, E, bez(62, 33, 66, 24, 72.6, 14 + u, 10), 2, 1.2); curve(p, '#3a2020', bez(62, 33, 66, 24, 72.6, 14 + u, 10), 1.2, 0.6);
    for (const [x, y, r, a] of [[53, 9 + u, 2.8, -2.2], [56, 5.6 + u, 3, -1.8], [60, 4 + u, 3, -1.5], [64, 5.4 + u, 3, -1.1], [67, 8.6 + u, 2.8, -0.6], [68.6, 12.6 + u, 2.6, 0.2]]) gink(x, y, r, a);
    for (const [x, y, r, a] of [[72.6, 13 + u, 4, -1.2], [69, 15.6, 4.2, -2.2], [75.4, 17.6, 4, -0.2], [66.6, 20.6, 4, -2.6], [71.6, 21.6, 4.2, 0.4], [68, 27, 4, 0.6], [77, 26.6, 3.6, 0.8], [81.6, 42, 3.8, 0.4], [79, 35, 3.6, -0.6]]) gink(x, y, r, a);
    for (const [x, y, r, a] of [[45.6, 37, 4, -2.6], [49.6, 35, 4.2, -1.6], [52.6, 40.6, 4.2, 0.4], [48.6, 44.6, 4, 2.2], [61.6, 37.6, 4, -0.6], [62.6, 43, 4, 0.6], [59.6, 48, 3.8, 1.8], [53, 50.4, 3.6, 2.4], [64.6, 31, 3.6, -1.4]]) gink(x, y, r, a);
    for (const [x, y, r, a] of [[59.6, 71.6, 3.6, -2.4], [62.6, 70, 3.6, -1.2], [61, 75, 3.6, 2.4], [64.6, 74, 3.4, 0.4], [66, 70.6, 3, -0.6]]) gink(x, y, r, a);
  };
  ART.dracolion = (p, f) => {
    const { bez, curve, seg, shard, glowing } = G.FOE_KIT;
    const E = '#10141a', T = '#48b0b0', Th = '#76d4cc', Td = '#2a7474', Tk = '#16484c', B = '#a89068', Bh = '#c8b080', Bl = '#f6dc90', Bd = '#7e6648', Bk = '#4e3a2c';
    const Cl = '#5c5070', Ch = '#7e7294', Or = '#fca010', Ac = '#f0b030', gl = f ? '#fff0a0' : '#fcd818';
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const claw = (x0, y0, x1, y1, w) => { const a = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0); shard(p, E, null, x0, y0, l + 0.8, a, w + 0.6); shard(p, Cl, Ch, x0, y0, l, a, w); };
    const swirl = (x, y, r, dir) => { const pts = []; for (let k = 0; k <= 30; k++) { const t = k / 30 * 8.4, rr = r * (1 - k / 38); pts.push([x + Math.cos(t * dir + 3.2) * rr, y + Math.sin(t * dir + 3.2) * rr * 0.85]); } curve(p, Bk, pts, 1.3, 0.9); };
    const curl = (x, y, r) => { p.ell(Bd, x, y, r, r * 0.9); p.ell(B, x - 0.3, y - 0.3, r - 0.7, r * 0.9 - 0.7); const pts = []; for (let k = 0; k <= 14; k++) { const t = k / 14 * 4.6, rr = (r - 1) * (1 - k / 18); pts.push([x + Math.cos(t + 3.6) * rr, y + Math.sin(t + 3.6) * rr * 0.85]); } curve(p, Bk, pts, 0.9, 0.5); p.ell(Bh, x - r * 0.45, y - r * 0.45, r * 0.3, r * 0.22); };
    mass([67, 41.6, 71, 40.4, 74, 42.6, 75, 47, 73.6, 51, 70.6, 53.4, 67.4, 52.4, 66.6, 47], T); p.poly(Td, [67.4, 49, 70.6, 50, 73.6, 51, 70.6, 53.4, 67.4, 52.4]); seg(p, Th, 69, 42.4, 73, 43.6, 0.6);
    mass([40, 36, 50, 37.6, 58, 36, 62.6, 40, 64.6, 46, 62, 50.6, 50, 50.6, 42, 48.6, 38.6, 44], Tk);
    mass([51, 38, 56.4, 37, 60, 40.4, 59, 45.6, 55.6, 46.6, 52.6, 43], B); p.poly(Bh, [51.8, 38.4, 56, 37.8, 58.8, 40.6, 55.6, 41, 53, 42]);
    const ball = []; for (let k = 0; k < 40; k++) { const t = k / 40 * Math.PI * 2; ball.push(50.2 + Math.cos(t) * 25, 72 + Math.sin(t) * 23.8); }
    mass(ball, B);
    p.clipPoly(ball, () => {
      p.ell(Bk, 44, 88, 24, 14); p.ell(Bd, 46, 82, 26, 16); p.ell(B, 52, 70, 24, 17); p.ell(Bh, 51, 58, 18, 8); p.ell('#e2c886', 50.6, 66.4, 11, 8); p.ell(Bl, 49.6, 67, 6.6, 5); p.ell('#fff4c8', 49.4, 67.2, 3.4, 2.6);
      swirl(35.6, 67.4, 5.6, 1); swirl(60.6, 67.2, 5.4, -1);
      curve(p, Bk, bez(28.6, 73.6, 50, 69.6, 71.6, 73.6, 12), 1.1, 1.1); curve(p, Bk, bez(25.2, 77.4, 50, 82, 75.2, 77.4, 14), 1.4, 1.4);
      curve(p, Bk, bez(26.6, 83, 38, 85, 47.6, 89.6, 10), 1.2, 1); curve(p, Bk, bez(73.8, 83, 62.4, 85, 52.8, 89.6, 10), 1.2, 1);
      curve(p, Bk, bez(31, 88.6, 40, 89.4, 47.4, 93.6, 8), 0.6, 0.5); curve(p, Bk, bez(69.4, 88.6, 60.4, 89.4, 53, 93.6, 8), 0.6, 0.5);
      p.poly(Bk, [48.4, 86, 52.2, 86, 52.2, 97, 48.4, 97]); p.ell('#5a0a06', 50.3, 86.4, 4, 1.4); p.ell(gl, 50.3, 85.6, 4, 0.9);
    });
    mass([73, 55, 75, 57.6, 74.2, 60.4, 70.6, 62.6, 68, 64.4, 65.4, 64.2, 65, 61.6, 68.6, 58.4], T); seg(p, Th, 73.4, 56.6, 69, 60.8, 0.6);
    claw(65.4, 62.8, 57, 61.4, 1); claw(65, 63.8, 57.6, 64.6, 1); claw(65.6, 64.6, 59.8, 67.4, 0.9);
    mass([35, 38.4, 38.6, 38, 41.4, 41.6, 41.4, 46.4, 39.6, 50.6, 36.6, 51, 35.6, 46], T); p.poly(Th, [35.8, 39, 38.4, 38.8, 40.4, 41.6, 37.6, 42, 36.4, 43.6]); p.poly(Td, [39.8, 45.4, 41.4, 46.4, 39.6, 50.6, 36.6, 51, 37.6, 48.4]);
    claw(36, 50.6, 29.6, 55, 1.1); claw(36.6, 51.4, 31, 58.6, 1.1); claw(38.2, 51.8, 34.4, 60.4, 1.1); claw(39.8, 51.6, 38.4, 59.8, 1);
    mass([58.4, 48.6, 62.4, 49.6, 61.6, 53.6, 57.6, 57.6, 54.4, 61, 51.6, 62, 50.4, 60, 53, 56, 56, 52], T); p.poly(Th, [58.4, 49.4, 61.4, 50.2, 57.4, 53, 55, 54.8, 56.6, 51.8]); seg(p, Td, 61, 53.8, 54.6, 61, 0.9);
    claw(49.4, 64.8, 40.2, 68.4, 1.1); claw(49, 65.6, 41.6, 71.6, 1.1); claw(49.6, 66.2, 45.4, 72.8, 1.1); claw(50.6, 66.4, 49.2, 72.6, 1);
    glowing(p, E, 0.7, q => q.ell(B, 50.4, 63.8, 2.6, 2.6)); p.ell(T, 50.4, 63.8, 1.8, 1.8); p.ell(Bh, 50.2, 63.6, 1.1, 1.1);
    mass([56.4, 14, 60, 9, 64, 12, 66.6, 16.6, 68.4, 23, 68.6, 30, 68.2, 36, 66.6, 40.6, 62.6, 42.4, 58.6, 39.6, 56.6, 30, 55.6, 20], B);
    p.poly(Bd, [60, 39.6, 62.6, 42.4, 66.6, 40.6, 68.2, 36, 66, 37.6, 62.6, 38.4]);
    for (const [x, y, r] of [[62.6, 13.6, 3.2], [64.8, 19.6, 3.4], [65.4, 26.4, 3.6], [65, 33.2, 3.4], [62.8, 39, 3], [59.6, 24, 2.8], [59.8, 31, 2.8]]) curl(x, y, r);
    mass([35, 16, 40, 13, 47, 12.6, 54, 14, 57, 18, 57.6, 24, 56, 30, 54.4, 34.4, 50.6, 37.6, 44, 38.4, 38.6, 36.6, 35, 33, 33.4, 27, 33.4, 21], '#3aa0a0');
    p.poly(Th, [37.6, 16.4, 40.4, 14.6, 46, 14.2, 50, 15, 45.6, 16.6, 40.6, 18.6]); p.poly(Td, [33.4, 27, 35, 33, 38.6, 36.6, 44, 38.4, 50.6, 37.6, 54.4, 34.4, 56, 30, 52, 31.6, 44, 31.6, 38, 30]);
    mass([32.6, 19, 35.4, 17.6, 37, 21, 37.4, 26, 36.4, 30.6, 34, 31, 32.4, 26], B); curl(34.8, 21.4, 1.8);
    p.poly(Or, [34.6, 24.6, 36.6, 25.6, 36.8, 29.4, 35, 30]); p.poly(gl, [35.4, 26.2, 36.2, 26.6, 36.2, 28.6, 35.4, 28.8]);
    p.poly(Tk, [35.6, 13.4, 40, 12.4, 47, 12, 54, 12.8, 57, 14.6, 56.4, 16.4, 50, 15.4, 44, 15.4, 38.6, 16.4, 35.4, 17.6]);
    mass([38.6, 25.4, 40.6, 21.4, 45.4, 20.2, 50, 21.8, 54.4, 20.4, 57.2, 22.4, 56, 26.2, 51.4, 26, 47, 25, 43, 26.4, 40.4, 27.4], B);
    p.poly(Bh, [40.4, 24, 42, 22.2, 46, 21.6, 49.4, 23, 46, 23.2, 42.6, 24.2]); curve(p, Bk, bez(42.6, 25.2, 45.4, 21.8, 48.4, 23.8, 6), 0.9, 0.6); curve(p, Bk, bez(50.4, 24.4, 53, 21.4, 55.6, 23.6, 6), 0.9, 0.6);
    glowing(p, E, 0.7, q => q.ell('#ecdcdc', 48.2, 28.8, 4.6, 3.2)); p.ell('#b8a0a8', 49.4, 30, 3.4, 1.8); p.ell('#ecdcdc', 48.6, 28.4, 3.6, 2.4);
    p.ell(E, 46.6, 28.6, 3, 3); p.ell(Or, 46.6, 28.6, 2.5, 2.5); p.ell(gl, 46.4, 28.4, 1.3, 1.3); p.ell('#fffbe0', 45.8, 27.6, 0.5, 0.5);
    seg(p, E, 42.6, 26.4, 52.8, 26.2, 0.7); p.poly(Ac, [52.6, 24.6, 55, 24, 54, 27.4, 52.4, 27]); p.poly(Ac, [44.2, 14.4, 46.4, 14.6, 45.2, 16.4]); p.poly(Ac, [36, 30.6, 37.6, 30.2, 37, 32]);
    p.poly(E, [38.4, 33.2, 44, 32.8, 50, 33.2, 53.6, 34.2, 52.4, 35.4, 46, 35.8, 40.4, 35.4]);
    for (const [x, y, s] of [[41.4, 33, 0.9], [47.8, 33.2, 0.9]]) p.poly(Bh, [x - s, y, x + s, y, x, y + 2 * s]);
    for (const [x, y] of [[44.6, 35.6], [51, 35]]) p.poly(Bh, [x - 0.8, y, x + 0.8, y, x, y - 1.6]);
    mass([32.6, 11, 41.8, 14.6, 41.2, 18.6, 36.6, 18.6], '#8a7050'); p.poly(Bh, [32.6, 11, 41.8, 14.6, 39.8, 15.4]); p.poly(Bk, [33.8, 12.8, 41.2, 18.6, 36.6, 18.6]);
    mass([34, 10.4, 37, 6.4, 41.6, 4, 47, 2.8, 53, 3, 58.6, 5.4, 62.4, 9, 61, 13.4, 56, 14.2, 50, 12.4, 44, 12.6, 38.6, 13.4], B);
    p.poly(Bd, [38.6, 13.4, 44, 12.6, 50, 12.4, 56, 14.2, 61, 13.4, 58, 11.6, 50, 10.8, 42, 11.4]);
    for (const [x, y, r] of [[38.6, 9.6, 3.2], [44.6, 6.4, 3.8], [51.6, 5.6, 3.8], [58, 8, 3.4], [47.6, 10.6, 2.8], [54, 11, 2.6]]) curl(x, y, r);
  };
  ART.dragonfish = (p, f) => {
    const { bez, curve, seg, shard, glowing } = G.FOE_KIT;
    const E = '#081416', F = '#0e3a40', Fh = '#22605e', Fd = '#0a2426', Y = '#f8d820', Yh = '#fff27a', Yd = '#9a7c08', Ym = '#c8a028';
    const B = '#b0a07c', Bh = '#d4c6a0', Bd = '#6c6048', Bk = '#3e3626', V = '#04302c', s = f ? 0.8 : 0, glow = f ? '#fffff4' : '#fcfcd0';
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const fold = (x, y, r) => { const pts = []; for (let k = 0; k <= 20; k++) { const t = k / 20 * 6.6, rr = r * (1 - k / 26); pts.push([x + Math.cos(t + 3.4) * rr, y + Math.sin(t + 3.4) * rr * 0.8]); } curve(p, Bk, pts, 1.3, 0.8); };
    mass([55, 52.6, 55.6, 46, 56.6, 40, 58, 33, 60.4, 27.4, 63.4, 23, 67, 20.4, 71.4, 19.4, 75.4, 18.6, 79, 16.4, 81.6 + s, 13.2 - s * 0.5, 81.8, 17, 80.6, 20.6, 78.4, 23.6, 77, 26, 77.4, 29.4, 75.4, 30.6, 72.6, 31.4, 70.6, 33, 69.4, 35.6, 70.2, 38, 71.2, 40.4, 70.6, 43.4, 68.6, 45.6, 65.6, 47.4, 62, 49.6, 58.4, 52.6], F);
    p.poly(Y, [81.6 + s, 13.2 - s * 0.5, 81.8, 17, 80.6, 20.6, 78.4, 23.6, 77, 26, 77.4, 29.4, 75.4, 30.6, 72.6, 31.4, 70.6, 33, 69.4, 35.6, 70.2, 38, 71.2, 40.4, 70.6, 43.4, 68.6, 45.6, 65.6, 47.4, 63.6, 45.4, 66.4, 43.4, 67.6, 41, 66.6, 38.4, 66.4, 34.8, 68.6, 31, 71.6, 28.8, 74.2, 27.6, 74.4, 24.6, 76.4, 21.4, 78.6, 17.6]);
    p.poly(Yh, [80.6, 16.2, 78.6, 21, 76.6, 24.6, 76.4, 27.6, 74.6, 28.4, 75.2, 25, 77.2, 21.4]); curve(p, Fh, bez(57.4, 50.6, 59.6, 34, 71, 22, 10), 1.6, 0.9); curve(p, Y, bez(59.4, 50, 62, 36, 76.4, 20.4, 12), 0.8, 0.6);
    mass([46.6, 48, 47.6, 42, 47.4, 36, 46.4, 30, 46.6, 24, 45.4, 17, 43.6, 11, 42.4 - s * 0.6, 5.6, 41.4, 10, 40, 16, 39, 22, 39.4, 28, 41.4, 32.6, 43.6, 36, 44.4, 42, 43.6, 48], F);
    p.poly(Y, [41.6, 10.6, 40.4, 16, 39.6, 22, 40, 28, 41.6, 31.6, 42.4, 27, 42.6, 21, 42.8, 15.6]); p.poly(Y, [43.6, 36.4, 44.6, 42, 44.2, 47.6, 43.6, 48, 43.6, 42]); curve(p, Fh, bez(43, 12, 45, 24, 45.6, 40, 8), 1.2, 0.8); curve(p, Ym, bez(42.6, 34.6, 44.6, 36, 45.4, 40.6, 6), 0.8, 0.5);
    mass([33, 52, 32.4, 46, 32.6, 40, 33.2, 35.6, 35.2, 39, 37, 44, 37.6, 50, 36, 54], F); curve(p, Fh, bez(33.6, 38, 35, 44, 35.2, 50, 6), 1, 0.6);
    mass([15, 52, 12.6, 47, 11, 42, 11.6, 36 - s * 0.4, 13.6, 39, 15.6, 44, 17.4, 49], Yd); p.poly(Ym, [12.2, 38.6, 13.6, 40.4, 15.2, 44.6, 16.6, 48.6, 15, 50, 13.4, 46, 12, 42]);
    mass([60, 56.6, 64, 54.2, 69, 52.6, 74, 51.6, 79, 51.4, 84, 52.2, 88.6 + s, 54.2, 85, 55.8, 80, 56.4, 76, 57.6, 72, 59, 67, 60.4, 62.6, 61], Yd); p.poly(Ym, [62, 56.6, 66, 54.8, 72, 53.4, 78, 52.8, 85.4, 53.4, 80, 54.4, 74, 55, 68, 56.4, 63.4, 58]); curve(p, Yh, bez(66, 55.6, 74, 52.8, 84, 53.4, 8), 0.7, 0.4); curve(p, Y, bez(63, 59.4, 72, 57.6, 80, 55.6, 8), 0.8, 0.5); fold(62.6, 57.6, 1.6);
    mass([44, 50.4, 47, 45, 52, 44.6, 57, 47, 59.6, 51, 56, 54.4, 50, 54.6, 45.6, 53.6], Fd);
    mass([40.6, 58, 44, 53, 50, 51.6, 56, 52, 60.6, 54, 62.6, 58, 61.6, 63, 57.6, 67, 51, 69, 45, 68, 41, 64], B); p.poly(Bd, [41, 64, 45, 68, 51, 69, 57.6, 67, 61.6, 63, 57, 64.4, 50, 66, 44.4, 65]);
    p.poly(Bh, [44, 55.6, 50, 53.4, 56, 53.6, 60, 55.6, 56.4, 56.2, 50, 56, 45.6, 57.6]); fold(49.4, 59.8, 3.2); fold(56.8, 58.4, 3); curve(p, Y, bez(43.6, 65.4, 52, 70, 61.4, 62.4, 10), 1, 0.7); curve(p, Y, bez(46, 55.4, 53, 52.6, 60, 55.6, 8), 0.8, 0.5);
    mass([43.6, 84.6, 47.6, 82.8, 52, 83, 56, 84.4, 59.6, 87, 61.6 + s * 0.5, 90.4, 57.6, 90, 53, 91.4, 48.4, 90.6, 45, 88.4], '#1e5a5c'); curve(p, Y, bez(46.6, 87.4, 51.6, 83.6, 56.4, 88, 8), 1.2, 0.8); curve(p, Y, bez(52, 89.6, 56, 89, 59.6, 89.4, 6), 0.9, 0.5); p.ell(Yh, 49.4, 87.4, 1, 0.8);
    glowing(p, E, 0.6, q => q.poly(F, [29.6, 87.6, 33.4, 87.6, 35.6, 95.6, 31.4, 96.6, 29.8, 94])); seg(p, Fh, 31.4, 88.4, 32.8, 95, 0.7);
    glowing(p, E, 0.6, q => q.ell(Ym, 31.6, 86, 2, 1.5)); p.ell(Yh, 31, 85.6, 0.8, 0.6);
    glowing(p, E, 0.8, q => q.ell(B, 36, 74, 11.6, 12.4)); p.ell(Bd, 37, 76, 10.4, 11); p.ell(B, 35.6, 73.4, 10, 10.6);
    p.ell('#e8e070', 36.4, 74.6, 8.8, 9.8); p.ell('#f8f4a0', 36.2, 74.2, 7.6, 8.6); p.ell(glow, 35.6, 74.6, 5.4, 6.6);
    for (const [x0, y0, cx, cy, x1, y1] of [[30, 78, 33, 75, 36.6, 78.6], [35, 81, 38.6, 78, 42.4, 80.6], [32.6, 70.4, 36, 68, 39.6, 70.6]]) curve(p, '#bfeec0', bez(x0, y0, cx, cy, x1, y1, 8), 1.3, 0.9);
    p.poly(Bh, [26.4, 62.6, 32, 60.4, 38, 60, 43, 61.6, 44.6, 64, 38, 62.4, 32, 62.4, 27.6, 64.6]);
    glowing(p, E, 0.6, q => q.ell(B, 44.6, 66.4, 2.6, 2.6)); p.ell(Bh, 44, 65.8, 1.2, 1.2);
    p.poly(Bd, [36, 85.4, 40, 84, 43.6, 81.6, 45, 83.4, 42, 86.4, 37.6, 87]); fold(41.4, 83.4, 1.6);
    mass([16, 66, 20, 61.6, 26, 60, 30, 62, 32, 67, 31.6, 74, 29, 80, 26, 84, 21, 84.6, 17.4, 82, 15, 77, 14.4, 71], B);
    p.poly(Bd, [15, 77, 17.4, 82, 21, 84.6, 26, 84, 29, 80, 26.4, 81, 21.6, 82.2, 18, 79.6]);
    p.poly(V, [16.4, 66, 20.4, 62.4, 26.4, 61.6, 29.4, 64, 28, 68.4, 24, 71.6, 19.6, 73, 16.6, 71.4]);
    curve(p, '#3a7af0', bez(16.8, 67, 19, 62.8, 26.6, 62.6, 8), 0.9, 0.6); p.poly('#1e8a86', [20.6, 65.4, 24.6, 64.6, 22.6, 67.6]);
    seg(p, E, 15.2, 75, 31.6, 66.4, 2.6); seg(p, Ym, 15.4, 74.6, 31.4, 66.2, 1.8); seg(p, Yh, 16.4, 73.6, 30.4, 65.8, 0.6);
    glowing(p, E, 0.6, q => q.ell('#f4f0e4', 25.2, 75, 2.8, 2.8)); p.ell(E, 25.6, 75.3, 1.4, 1.4); p.ell('#f4f0e4', 25.2, 74.8, 0.5, 0.5);
    glowing(p, E, 0.5, q => q.ell('#f4f0e4', 15.6, 71.6, 1.2, 1.6)); p.ell(E, 15.4, 72, 0.6, 0.8);
    fold(20, 79.6, 2.2); fold(24.2, 81.6, 1.6); p.ell(Bh, 18.4, 77.4, 1.2, 0.8);
    for (const [x0, y0, x1, y1, w] of [[22.6, 61, 21, 49.4, 1.3], [26.6, 60.4, 27.6, 50.6, 1.7], [30.6, 61, 33.6, 52.4, 1.7], [35.6, 60.6, 39.4, 54.6, 1.4]]) { const a = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0); shard(p, E, null, x0, y0, l + 0.9, a, w + 0.7); shard(p, B, Bh, x0, y0, l, a, w); }
  };
  ART.cloudtoad = (p, f) => {
    const { bez, curve, seg, glowing } = G.FOE_KIT;
    const E = '#140c0a', M = '#5a4440', Mh = '#7c6460', Ml = '#a08880', Md = '#3a2828', B = '#a8906c', Bh = '#d8c49a', Bl = '#fce4a8', Bd = '#7e6a4e', Bk = '#4a3a2a';
    const R = '#9c3c3c', Rh = '#c45a58', Rd = '#6c2424', Gw = f ? '#fffcc0' : '#fcf090', Go = '#e0a050', Gr = '#8a3a22';
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const limb = (pts, w) => { for (const [c, d] of [[E, 1.6], [M, 0]]) { for (let i = 0; i + 3 < pts.length; i += 2) seg(p, c, pts[i], pts[i + 1], pts[i + 2], pts[i + 3], w + d); for (let i = 2; i + 2 < pts.length; i += 2) p.ell(c, pts[i], pts[i + 1], (w + d) / 2, (w + d) / 2); } };
    const finger = (x0, y0, x1, y1, col) => { seg(p, E, x0, y0, x1, y1, 2.2, 1.8); seg(p, col, x0, y0, x1, y1, 1.3, 1); };
    const win = (pts, dark) => { glowing(p, Bk, 0.7, q => q.poly(Go, pts)); const c = pts.reduce((a, v, i) => (a[i % 2] += v / (pts.length / 2), a), [0, 0]); p.poly(dark ? Gr : Gw, pts.map((v, i) => c[i % 2] + (v - c[i % 2]) * 0.72)); };
    limb([60, 27, 66.6, 33, 67.6, 40, 64.6, 45.4], 3.2);
    mass([39, 23, 46, 25, 54, 25.6, 58.6, 28, 60.6, 33, 59.6, 40, 52, 44, 43, 43, 38.4, 36, 37.6, 29], M); p.poly(Md, [38.4, 36, 43, 43, 52, 44, 59.6, 40, 54, 39.6, 46, 38.6, 41, 34]);
    const lan = [37, 46, 44, 45, 50, 45.4, 56, 45, 62, 46, 66, 48, 69.6, 51, 72, 55, 72.6, 59, 72, 63, 70, 67, 66.6, 70.6, 62, 73, 56, 74.6, 50, 75, 44, 74.6, 38, 73, 33.6, 70.4, 30, 67, 28, 63, 27.4, 59, 28, 55, 30.4, 51, 33.6, 48];
    mass(lan, B);
    p.clipPoly(lan, () => {
      p.ell(Bd, 46, 74, 30, 9); p.ell(Bh, 49, 52, 15, 8); p.ell(Bl, 48.6, 54, 9, 6); p.ell('#fff0c0', 48, 56, 5, 4);
      win([40, 63.4, 40.8, 58, 43.6, 55.4, 47.4, 57, 51.4, 55.2, 54.4, 57.6, 54.8, 63.4, 47.4, 64.2], false);
      win([38.6, 54.6, 39.8, 49.6, 42.6, 47.6, 46.4, 48.4, 45, 52.8, 41.6, 55], false);
      win([55.4, 61.6, 56, 56.6, 59, 53.8, 63, 54.8, 63.2, 59.4, 59.6, 62.2], true);
      win([31, 59.6, 32, 55.6, 35.4, 54, 36.4, 57, 34.2, 60.4], true);
      const zig = []; for (let k = 0; k <= 13; k++) zig.push([28 + k * 3.4, k % 2 ? 63.8 : 66.8]);
      curve(p, Bk, zig, 1.1, 1.1); curve(p, Bh, zig.map(([x, y]) => [x, y - 1.1]), 0.6, 0.6);
      curve(p, Bk, bez(28.4, 68.4, 50, 74, 71.6, 68.4, 14), 1.2, 1.2); curve(p, Bk, bez(29, 55, 50, 60, 71, 55, 14), 0.9, 0.9);
      for (const [x0, y0, x1, y1] of [[47.4, 45.4, 48.4, 56.4], [37.6, 46.4, 38.4, 54.4], [62, 46.4, 61, 54.6]]) seg(p, Bk, x0, y0, x1, y1, 0.9);
    });
    mass([36.6, 29, 39.6, 27.8, 42, 30.6, 42.4, 36.6, 41, 41.4, 38.4, 41.4, 36.6, 36], B); p.poly(Bd, [41, 33, 42.4, 36.6, 41, 41.4, 38.4, 41.4, 39.6, 37]); p.poly(Bh, [37.4, 29.6, 39.4, 28.6, 41, 30.6, 39.4, 32.6, 37.8, 33.6]);
    for (const [x0, y0, x1, y1] of [[38.4, 41.6, 32.6, 44.2], [39.6, 42.2, 34.6, 47], [41, 42.4, 37.6, 47.4]]) finger(x0, y0, x1, y1, M);
    limb([64.6, 45.4, 58.4, 46.4, 52.6, 48.8], 2.8);
    glowing(p, E, 0.6, q => q.ell(B, 50, 50.4, 2.4, 2.2)); p.ell(Bh, 49.6, 50, 1.2, 1);
    for (const [x0, y0, x1, y1] of [[48.6, 51.4, 43.4, 52.6], [48.8, 52.4, 44.6, 56.4], [50, 52.8, 49.4, 57.6], [51.4, 52, 54.4, 56], [51.6, 49.4, 55.4, 47]]) finger(x0, y0, x1, y1, Bh);
    limb([64.6, 36, 69.4, 41.6, 68.6, 47.4], 2.6);
    for (const [x0, y0, x1, y1] of [[68.4, 47.2, 64.4, 50.4], [68.8, 47.6, 67.4, 51.6], [69.2, 47.4, 70.6, 51]]) finger(x0, y0, x1, y1, Bh);
    glowing(p, E, 0.6, q => q.poly(B, [52.6, 26.4, 55.4, 27.6, 57.6, 33.6, 56.4, 36.4, 54.6, 33, 52.4, 31.4, 50.6, 33, 49.6, 31, 51.6, 28.6])); seg(p, Bh, 53.4, 27.6, 56, 33, 0.6);
    mass([31.4, 12, 32.6, 7.4, 34, 3.4, 38.6, 4.2, 44, 4.6, 50, 6, 56.4, 8.6, 60.4, 7.2, 62.6, 10.6, 64.2, 14.6, 64.4, 19.2, 62.4, 22.6, 58, 24.4, 52, 25.4, 44, 25, 38, 23.4, 33, 21, 31, 17.6], M);
    p.poly(Mh, [44, 6.2, 50, 7.4, 55.4, 9.4, 50.4, 10.4, 45, 9]); p.poly(Md, [36, 13, 42, 12.6, 48, 12.2, 54.4, 13.4, 55, 11.6, 48, 11, 41, 11.4]);
    p.poly(B, [31.4, 12.4, 33, 7.4, 34.4, 4.2, 37, 4.6, 35.4, 8.6, 34.6, 13, 37.6, 18.6, 41.6, 17.6, 46, 14.6, 51.4, 13.4, 54, 14.6, 53.6, 18, 52.6, 22, 50.6, 24.6, 44, 24.4, 38, 22.8, 33.4, 20.6, 31.4, 17.4]); p.poly(Bd, [33.4, 20.6, 38, 22.8, 44, 24.4, 50.6, 24.6, 52.6, 22, 46, 22.4, 39.6, 21.2]);
    glowing(p, E, 0.6, q => q.poly(B, [31.6, 13, 32.2, 8, 33.6, 2.4, 36.6, 4.6, 39.4, 4.2, 36.4, 8.6, 35.4, 13.6]));
    p.poly(Bh, [32.6, 12, 33.2, 7.8, 34, 4, 35.6, 5.4, 34.4, 9, 34.2, 12.6, 36.6, 18.4, 34.6, 18.6, 32.6, 16]); p.poly(Bl, [41, 18.4, 46.4, 15.4, 51, 13.6, 47.6, 16.6, 42.6, 19.4]);
    seg(p, Bk, 37.6, 19, 52.6, 13, 0.6); seg(p, Bk, 33.6, 21, 50.6, 24.8, 0.8); seg(p, Bh, 56.6, 8.6, 60.2, 7.4, 0.8);
    glowing(p, E, 0.8, q => q.ell(Md, 60, 15.6, 5.2, 5.4)); p.ell(M, 59.6, 15, 4.4, 4.6); p.ell(Ml, 58, 12.8, 1.8, 1.3);
    seg(p, E, 55.6, 16.2, 63.6, 15.4, 1.7); p.ell(Bh, 64.6, 15.4, 0.9, 1.8);
    for (const [x, y, rx, ry] of [[38.6, 76.6, 3, 2.6], [44, 78.6, 3.2, 2.8], [55.6, 78.4, 3.4, 2.8], [61, 76.4, 2.8, 2.4]]) { glowing(p, E, 0.6, q => q.ell(B, x, y, rx, ry)); p.ell(Bh, x - 0.6, y - 0.8, rx * 0.5, ry * 0.4); }
    glowing(p, E, 0.6, q => q.poly(R, [45.6, 80, 49.4, 80, 50.6, 90, 51, 95.6, 46.4, 96.4, 45.6, 92, 46.4, 86])); p.poly(Rh, [46.4, 81, 48, 81, 48.4, 90, 47.4, 95.4, 46.6, 92]); seg(p, Rd, 49.6, 82, 50.2, 94.6, 0.7);
    glowing(p, E, 0.6, q => q.ell(R, 47.6, 78.8, 2, 1.7)); p.ell(Rh, 47, 78.4, 0.8, 0.6);
  };
  ART.alchemist = (p, f) => {
    const { bez, curve, seg, shard, glowing } = G.FOE_KIT;
    const E = '#140c0c', A = '#8c8070', Ah = '#b8ac98', Al = '#ddd4c2', Ad = '#5a5048', Ak = '#766b5d', T = '#1a5664', Th = '#2c7e8c', Td = '#0e3440', P = '#2c2a30', Ph = '#46444e';
    const Wd = '#3a2020', Wh = '#5a3428', Gd = '#e0902a', Gh = '#ffd060', Lf = '#f0b84a', Lfh = '#f8dc6a', Lfd = '#c07030', Fl = '#ff7a3a', Mk = '#d6d4d8', Mks = '#9c9aa4', u = f ? -1.2 : 0;
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const limb = (x0, y0, x1, y1, w0, w1, col) => { seg(p, E, x0, y0, x1, y1, w0 + 1.6, w1 + 1.6); seg(p, col, x0, y0, x1, y1, w0, w1); };
    const spike = (x, y, len, a, w, col, hi) => { shard(p, E, null, x, y, len + 1.4, a, w + 0.9); shard(p, col, hi, x, y, len, a, w); };
    const gink = (x, y, r, a) => {
      const pts = [x, y];
      for (let k = 0; k <= 6; k++) { const t = a - 0.75 + k * 0.25, rr = k === 3 ? r * 0.72 : r; pts.push(x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
      p.poly(Lfd, pts.map((v, i) => v + (i % 2 ? 0.6 : 0.4))); p.poly(Lf, pts); p.poly(Lfh, pts.slice(0, 2).concat(pts.slice(2, 10)));
    };
    const knot = (x0, y0, x1, y1) => { for (let y = y0 + 1.4; y < y1 - 0.8; y += 2.6) for (let x = x0 + 1; x < x1 - 0.8; x += 2.6) { seg(p, Ak, x, y, x + 1.6, y + 1.6, 0.5); seg(p, Ak, x + 1.6, y, x, y + 1.6, 0.5); } };
    curve(p, E, bez(47, 52, 65, 46, 84, 51, 10), 4.2, 2.4); curve(p, Wd, bez(47, 52, 65, 46, 83, 51, 10), 3, 1.4); curve(p, Gd, bez(51, 50.4, 65, 46.4, 80, 50.6, 10), 0.9, 0.5);
    spike(68, 48.6, 6, -1.7, 1.6, Wd, Wh);
    spike(51, 54, 15, 1.36, 2.2, Wd, Wh); seg(p, Gd, 51.4, 57, 52.6, 66, 0.7);
    mass([25, 47, 32, 44, 34, 52, 33.6, 64, 31, 70, 27, 66, 25.6, 58], P); curve(p, Th, bez(27, 50, 29, 58, 28.4, 66, 6), 0.8, 0.5); curve(p, Ph, bez(30, 47, 32, 56, 31, 66, 6), 0.8, 0.5);
    limb(38, 64, 36, 71, 6, 5.6, P); limb(36, 71, 39, 80, 5.6, 5, P);
    limb(42, 64, 46, 72, 5.6, 5, P);
    p.poly(E, [33.6, 67.6, 39.4, 67, 40.4, 72, 35, 73.6]); p.poly(A, [34.4, 68.2, 38.8, 67.6, 39.6, 71.6, 35.4, 72.8]); p.poly(Al, [34.4, 68.2, 38.8, 67.6, 38.4, 69.4, 34.8, 70]);
    mass([43.6, 72, 49.6, 72.6, 51, 78, 50.6, 86, 46.6, 86.4, 45, 80], T); p.poly(Th, [44.4, 73, 47, 73, 47, 82, 45.4, 80]); seg(p, Gd, 46.6, 86, 50.6, 85.6, 1); seg(p, Gd, 49.6, 74, 50.4, 83, 0.7);
    p.poly(E, [43, 70.4, 48.4, 69.6, 49, 74, 43.6, 74.6]); p.poly(A, [43.8, 71, 47.8, 70.4, 48.2, 73.6, 44.2, 74]);
    mass([36.6, 79, 43, 78.4, 44.4, 86, 43.6, 96, 38, 96.4, 37, 88], T); p.poly(Th, [37.4, 80, 40, 79.6, 39.6, 92, 37.8, 88]); seg(p, Gd, 37.6, 96, 43.8, 95.6, 1.1); curve(p, Gd, bez(42.6, 80, 44, 86, 42.6, 92, 6), 0.7, 0.5);
    gink(39.6, 78.4, 3, -1.8); gink(41.6, 80, 2.8, 0.4);
    mass([33, 50, 46.6, 48.6, 47, 62, 41, 64.6, 34, 64], A); p.poly(Ah, [33, 50, 46.6, 48.6, 46.6, 51, 33.2, 52.4]); p.poly(Ad, [44, 50, 46.6, 48.6, 47, 62, 44.6, 63.4]);
    knot(34.6, 52.6, 44.4, 62.6);
    mass([33, 42.6, 47, 41.2, 47.6, 46.4, 46, 49, 34, 50], A); p.poly(Ah, [33.6, 43, 46.4, 41.8, 46.4, 43.4, 33.8, 44.8]);
    mass([28.6, 43.4, 33.4, 41.8, 36.6, 44.6, 36, 49, 31.4, 50.4, 28.6, 47.6], Ah); p.poly(Al, [29.4, 44, 33.2, 42.6, 34.6, 44.4, 30.4, 46]);
    mass([34, 29, 42, 27.4, 46.4, 30, 46.4, 38, 44, 42.6, 36, 43, 33.6, 37], A);
    knot(35, 30, 45.4, 41); p.poly(Ah, [34.4, 29.6, 42, 28.2, 41, 30.4, 35, 31.4]);
    mass([42, 27, 47, 26, 52, 28.4, 53.6, 32, 50.4, 35, 46.4, 33], T); p.poly(Th, [42.6, 27.6, 47, 26.8, 51.4, 28.8, 47, 29.6]); curve(p, Gd, bez(42.6, 29.6, 47, 28, 52.4, 30.6, 6), 0.7, 0.5);
    limb(34.6, 31, 27, 33, 4.6, 4, T); limb(27, 33, 22, 33, 3.6, 3.2, T); seg(p, Gd, 33.6, 31.4, 27.6, 32.6, 0.6);
    p.poly(E, [22.4, 31, 18.4, 29.4, 16, 31.6, 17.4, 35.4, 22.4, 35.4]); p.poly(Td, [21.8, 31.6, 18.6, 30.4, 17, 32, 18, 34.6, 21.8, 34.6]);
    gink(16.6, 33.4, 2.4, 3.4); gink(17.4, 30.6, 2.2, -2.3);
    limb(51, 33, 54, 38.6, 4.6, 4.2, T); limb(54, 38.6, 49.4, 33.4, 4, 3.4, T); seg(p, Th, 51.4, 33.6, 53.6, 37.6, 1, 0.8);
    mass([53, 36, 56.6, 37, 57.6, 42.6, 54.6, 42], Ah); seg(p, Ad, 54, 37, 55, 41.6, 0.5);
    for (const [x, y, l, a] of [[48, 32, 4.4, -2.1], [49.4, 31, 5, -1.7], [51, 31, 5, -1.3], [52, 32.4, 4.4, -0.9], [47.4, 33.6, 3.6, -2.6]]) { shard(p, E, null, x, y, l + 1, a, 1.5); shard(p, Fl, Gh, x, y, l, a, 1); }
    mass([35, 26, 42.6, 25.4, 43, 29.4, 36, 30], P);
    mass([39.6, 18.6, 44.6, 18, 44.4, 25.6, 40.6, 27], Td);
    mass([33.6, 20.6, 39.6, 19.4, 41, 23, 39.6, 26.6, 36.6, 28.4, 34, 25], Mk); p.poly(Mks, [37, 21, 41, 23, 39.6, 26.6, 36.6, 28.4]); seg(p, E, 35, 23.2, 38.6, 22.4, 0.6);
    mass([31.6, 11.6, 35, 10, 41, 10.4, 45.4, 12, 48.6, 14.4 + u, 45.4, 16, 43, 18.6, 38, 20.2, 33.4, 20.4, 32.4, 16], T);
    p.poly(Th, [32.4, 12.4, 35, 10.8, 40, 11.2, 37, 13.6, 34, 17]); curve(p, Gd, bez(33.6, 16.6, 38, 13.6, 45, 14.6, 6), 0.7, 0.5); seg(p, Td, 34, 19.6, 43, 18.2, 0.8);
    curve(p, E, bez(31.6, 9, 39, -1 + u, 48.4, 8.6 + u, 12), 1.6, 1.4); curve(p, Wd, bez(31.6, 9, 39, -1 + u, 48.4, 8.6 + u, 12), 0.9, 0.8);
    curve(p, E, bez(48.4, 8.6 + u, 50.6, 12, 48, 16, 8), 1.4, 1); curve(p, Wd, bez(48.4, 8.6 + u, 50.6, 12, 48, 16, 8), 0.8, 0.6);
    for (const [x, y, r, a] of [[32, 7.6, 2.8, -2.2], [34, 5, 2.8, -1.9], [37.6, 3 + u, 3, -1.6], [41.4, 2.6 + u, 3, -1.3], [45, 4.2 + u, 2.8, -0.9], [47.6, 7 + u, 2.8, -0.4], [49.4, 11, 2.6, 0.2], [48.6, 15, 2.6, 0.6]]) gink(x, y, r, a);
    for (const [x, y, r, a] of [[38, 31.6, 3.4, -2], [41, 30.6, 3.6, -1.4], [43.6, 32.6, 3.4, -0.6], [39, 35.6, 3.4, 2.6], [42.6, 36.6, 3.6, 1.4], [40.6, 39.6, 3.4, 2], [44, 40.4, 3, 0.8]]) gink(x, y, r, a);
    for (const [x, y, r, a] of [[27.6, 48, 3.4, -2.6], [24.6, 50.6, 3.6, 3.1], [26, 54, 3.4, 2.4], [28.6, 56.4, 3, 1.8], [23.4, 47, 3, -2.2], [22, 53.4, 2.8, 2.9]]) gink(x, y, r, a);
    for (const [x, y, r, a] of [[48.6, 49, 3.6, -1.6], [51.4, 50.4, 3.4, -0.6], [49.4, 53, 3.4, 1.2], [53, 47.4, 3, -1], [46.6, 51.6, 3, 2]]) gink(x, y, r, a);
  };
  ART.ballista = (p, f) => {
    const { bez, curve, seg, shard, glowing } = G.FOE_KIT;
    const E = '#140c0c', A = '#8c8070', Ah = '#b8ac98', Al = '#ddd4c2', Ad = '#5a5048', Ak = '#766b5d', T = '#1a5664', Th = '#2c7e8c', Td = '#0e3440', P = '#2c2a30', Ph = '#46444e', K = '#1c1a20', Kh = '#34323a';
    const Wd = '#3a2020', Wh = '#5a3428', Gd = '#e0902a', Gh = '#ffd060', Lf = '#f0b84a', Lfh = '#f8dc6a', Lfd = '#c07030', Mk = '#d0c4b0', Mks = '#9c9080', u = f ? -1.2 : 0;
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const limb = (x0, y0, x1, y1, w0, w1, col) => { seg(p, E, x0, y0, x1, y1, w0 + 1.6, w1 + 1.6); seg(p, col, x0, y0, x1, y1, w0, w1); };
    const crack = (pts, w) => { curve(p, Gd, pts, w, w * 0.4); curve(p, Gh, pts.map(([x, y]) => [x - 0.2, y - 0.2]), w * 0.4, w * 0.2); };
    const gink = (x, y, r, a) => {
      const pts = [x, y];
      for (let k = 0; k <= 6; k++) { const t = a - 0.75 + k * 0.25, rr = k === 3 ? r * 0.72 : r; pts.push(x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
      p.poly(Lfd, pts.map((v, i) => v + (i % 2 ? 0.6 : 0.4))); p.poly(Lf, pts); p.poly(Lfh, pts.slice(0, 2).concat(pts.slice(2, 10)));
    };
    const knot = (cx, cy, r) => { p.ell(Ak, cx, cy, r, r * 0.86); p.ell(A, cx, cy, r - 0.8, r * 0.86 - 0.8); for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { seg(p, Ak, cx, cy, cx + dx * r * 0.6, cy + dy * r * 0.5, 0.5); } };
    curve(p, E, bez(49, 28, 54, 18, 58.6, 7, 10), 2, 1.2); curve(p, Wd, bez(49, 28, 54, 18, 58.6, 7, 10), 1.2, 0.6);
    for (const [x, y, r, a] of [[58.4, 6.6 + u, 3.4, -1.6], [57, 10.4 + u, 3.8, -0.4], [53.4, 10.6 + u, 3.4, -2.4], [58.6, 14, 3.8, 0.2], [52.6, 15, 3.6, -2.8], [56.4, 18.4, 3.8, 0.6], [51, 20.6, 3.4, 2.6], [54.6, 23.4, 3.6, 0.9], [60, 18.6, 3, 0.4], [55, 13.4, 3.2, -1.2]]) gink(x, y, r, a);
    limb(52, 50, 57, 64, 7.4, 6.4, T); seg(p, Th, 51, 51, 56, 63, 1.4, 1); crack(bez(54, 54, 57, 58, 56.6, 63, 6), 0.9);
    limb(57, 64, 61, 77, 6.4, 5.6, T); limb(61, 80, 63.4, 88, 5.6, 5, T); crack(bez(61, 82, 63, 85, 62.6, 88, 6), 0.8);
    mass([58, 76, 63.4, 75, 65, 80, 63, 83.6, 58.6, 83], A); p.poly(Ah, [58.6, 76.6, 63, 75.8, 63.6, 78, 59, 78.6]);
    mass([60.6, 86, 66, 85.4, 67.6, 92, 67, 97, 60.4, 97, 60, 91], T); p.poly(Th, [61.2, 86.8, 63.4, 86.4, 62.6, 95, 61, 92]); seg(p, Gd, 60.6, 96.6, 67, 96.4, 1.1); curve(p, Gd, bez(65.6, 87, 67, 91, 66, 95, 6), 0.7, 0.5);
    mass([37, 24, 52, 23.4, 55, 36, 54.6, 50, 37.4, 50.6, 35, 36], K);
    limb(39, 48, 34, 61, 8, 7, T); seg(p, Th, 37.6, 48.6, 33, 60, 1.4, 1); crack(bez(37, 51, 35.6, 55, 34, 60, 6), 0.9);
    limb(34, 61, 33, 72, 6.6, 6, T); crack(bez(34.6, 63, 34, 67, 33.4, 71, 6), 0.8);
    mass([28.6, 60, 35, 58.4, 36.6, 63.6, 30.4, 65], A); p.poly(Ah, [29.2, 60.6, 34.6, 59.2, 35, 61, 29.8, 62]);
    mass([30, 71.6, 37, 71, 38.4, 76, 38, 81, 26.6, 81, 25.6, 78.4, 30, 76.4], T); p.poly(Th, [30.6, 72.4, 33.6, 72, 33, 77, 30.6, 76.6]); seg(p, Gd, 25.8, 80.6, 38, 80.4, 1.1); curve(p, Gd, bez(36.6, 72.6, 37.6, 76, 37, 79.6, 6), 0.7, 0.5);
    mass([38.6, 22.4, 51.6, 22.4, 53, 34, 46, 38.4, 39, 34], A);
    p.poly(Ah, [39.4, 23, 45, 23, 45.6, 30, 41, 33.4, 39.6, 31]); p.poly(Al, [40.6, 23, 45, 23, 42.6, 27.4]);
    knot(45.6, 31.4, 3.2);
    mass([33, 27, 39, 25.4, 40, 34, 38.6, 46, 34, 44, 32, 35], T); p.poly(Th, [33.6, 27.6, 37, 26.6, 36.6, 34, 34, 36]); crack(bez(34, 30, 36, 36, 35.4, 42, 6), 0.8);
    mass([51.4, 30, 55.4, 30, 56.4, 46, 51.4, 46], T); p.poly(Td, [53.4, 30.6, 55.4, 30.6, 56.2, 45.6, 54, 45.6]);
    mass([37, 43.4, 54, 42.4, 54.6, 48, 37.6, 49], A); p.poly(Ah, [37.6, 44, 53.6, 43, 53.6, 44.6, 37.8, 45.6]);
    mass([40.6, 41, 46.6, 40.6, 47.6, 46, 44, 49, 40.6, 47], Ah); p.poly(Al, [41.2, 41.6, 45, 41.2, 43, 44.4]); p.ell(Ak, 44, 45, 1.4, 1.2);
    mass([51.6, 23, 61, 21.4, 63.6, 30.6, 58.4, 35, 52, 32.6], A);
    p.poly(Ah, [52.4, 23.6, 60.4, 22.2, 61.4, 25, 53, 26]); p.poly(Ad, [61.4, 25, 63.6, 30.6, 58.4, 35, 59, 29]);
    knot(57, 28.6, 2.6);
    shard(p, E, null, 60, 34, 8, 0.5, 2.4); shard(p, T, Th, 60, 34, 7, 0.5, 1.6);
    limb(57, 34, 59, 42, 5.6, 5, T); limb(59, 42, 56, 50, 5, 4.6, T); crack(bez(57.6, 36, 59, 40, 58.4, 44, 6), 0.8);
    mass([40, 20, 50.4, 19.8, 51.4, 25.6, 40.4, 26], K); p.poly(Kh, [40.6, 20.6, 44.6, 20.4, 44.2, 22, 40.8, 22.4]);
    p.poly(Ah, [39.6, 24.6, 45.6, 33, 51.4, 24.4, 50, 24, 45.6, 30, 41, 24]);
    curve(p, E, bez(41.4, 14, 37, 11, 36.6, 5 + u, 8), 2, 0.8); curve(p, K, bez(41.4, 14, 37.4, 11, 37, 5.8 + u, 8), 1.1, 0.4);
    curve(p, E, bez(48, 13.6, 51.6, 11, 51.2, 5.4 + u, 8), 2, 0.8); curve(p, K, bez(48, 13.6, 51.2, 11, 51, 6.2 + u, 8), 1.1, 0.4);
    shard(p, E, null, 40.6, 18, 5, 2.7, 1.6); shard(p, K, null, 40.6, 18, 4, 2.7, 1); shard(p, E, null, 49, 18, 5, 0.4, 1.6); shard(p, K, null, 49, 18, 4, 0.4, 1);
    mass([41.6, 11.6, 48.6, 11.2, 48.6, 18.6, 45.6, 25.6, 42.6, 19.6], Mk); p.poly(Mks, [46, 11.6, 48.6, 11.4, 48.6, 18.6, 45.6, 25.6, 45.6, 17]); seg(p, Ad, 45.4, 12.6, 45.6, 22.6, 0.5);
    mass([43.2, 6.6, 47.6, 6.4, 48.6, 12.4, 46, 13.6, 42.6, 12.6], T); p.poly(Th, [43.6, 7, 45.4, 7, 45, 12.6, 43.2, 12]);
    mass([42.4, 4, 45, 3.2, 48.4, 4.2, 47.8, 6.6, 43, 6.8], Al); p.poly(Ah, [45.6, 4, 48.4, 4.2, 47.8, 6.6, 45.6, 6.6]);
    for (const [x, y, r, a] of [[42, 26.4, 3.2, -2.6], [40.6, 30, 3.4, 2.8], [43.6, 34.4, 3.2, 2.2], [48.4, 33, 3.2, 0.4], [50.4, 28.6, 3.4, -0.4], [47.4, 25.6, 3, -1.4]]) gink(x, y, r, a);
    curve(p, E, bez(21, 44.6, 34, 50, 47, 56.6, 10), 6, 5.4); curve(p, K, bez(21, 44.6, 34, 50, 47, 56.6, 10), 4.6, 4); crack(bez(23, 45, 33, 49.4, 44, 54.6, 10), 0.9);
    limb(34.6, 31, 28.6, 38.6, 5.4, 4.8, T); limb(28.6, 38.6, 28, 45.6, 4.8, 4.4, T); crack(bez(33.6, 32, 30, 36, 28.6, 42, 6), 0.8);
    mass([25.6, 44, 30.6, 43.6, 31.4, 48.6, 26.4, 49.4], Td); p.poly(T, [26.2, 44.6, 29.6, 44.2, 29.8, 46, 26.4, 46.4]);
    p.poly(E, [43, 50.4, 48, 48.6, 72.6, 70, 67, 73.4]); p.poly(T, [44, 51, 47.4, 50, 71, 69.6, 67.4, 72]); p.poly(K, [46, 52.6, 48.6, 51.6, 70, 69, 67.6, 70.4]); seg(p, Th, 44.6, 51.6, 67.6, 71.6, 0.6);
    for (const [x, y, r, a] of [[19.6, 40.6, 3.6, -2.2], [22.6, 37.6, 3.8, -1.8], [17.4, 45, 3.6, 2.9], [20.6, 48.6, 3.8, 2.4], [24.6, 41.4, 3.4, -1.2], [24.6, 50.6, 3.4, 1.6], [22.6, 53, 3.2, 2.2], [31, 41.4, 3, -0.8], [29.6, 52.6, 3.2, 1.2], [33.6, 58, 3.4, 2.8], [31.4, 61.4, 3.2, 2.4], [35.6, 55.6, 3, -0.4], [26.4, 34, 3.2, -2.4]]) gink(x, y, r, a);
    mass([46.4, 66.6, 58, 64.4, 70, 63.4, 78.6, 64, 79, 70, 72, 72.4, 62, 72, 54, 70.6], A);
    p.poly(Ah, [47.6, 66.6, 58, 65, 70, 64, 78, 64.6, 77.6, 66.6, 68, 66.6, 58, 67.6]); p.poly(Ad, [54, 70.6, 62, 72, 72, 72.4, 79, 70, 78.4, 71.6, 72, 74, 62, 73.6]);
    mass([56, 59.6, 65, 57.6, 74, 56.6, 77, 60, 74.4, 63, 66, 62.6, 58.6, 62.4], A); p.poly(Ah, [56.8, 60, 65, 58.2, 73.6, 57.2, 75.6, 59.6, 65, 60, 58, 61.4]);
    mass([71, 56, 75.6, 54.4, 79, 58, 82.4, 66, 82, 74, 79, 80, 76.6, 88, 73.6, 86.6, 74, 80, 72, 76, 73.6, 70, 74, 63], A);
    p.poly(Ah, [71.6, 56.6, 75.4, 55.2, 78, 58.4, 80.6, 65, 76.6, 64, 74.6, 60]); p.poly(Ad, [82.4, 66, 82, 74, 79, 80, 76.6, 88, 77, 80, 79.4, 72]);
    mass([75, 66.6, 79, 66, 79.6, 71.6, 76.6, 74.6, 74.4, 72], Ad); p.ell(E, 77.2, 70, 1.4, 1.6); p.ell(K, 77.2, 70, 0.8, 1);
  };
  ART.aurumaton = (p, f) => {
    const { bez, curve, seg, shard, glowing, ringBand } = G.FOE_KIT;
    const E = '#0c0e12', S = '#46525e', Sh = '#647482', Sl = '#8c9ca8', Sd = '#2c343e', Sk = '#181c22', B = '#b0a48e', Bh = '#d6ccb4', Bd = '#7c7060';
    const R = '#a84444', Rh = '#c86e66', Rd = '#6c2424', K = '#22262c', Kh = '#3e434c', Gd = '#d8b46c', Gl = f ? '#fff4b8' : '#ffe08c';
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const plate = (pts) => { mass(pts, R); const c = pts.reduce((a, v, i) => (a[i % 2] += v / (pts.length / 2), a), [0, 0]); p.poly(Rh, pts.slice(0, 4).concat([c[0], c[1]])); };
    const fin = (x0, y0, x1, y1, w) => { const a = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0); shard(p, E, null, x0, y0, l + 0.9, a, w + 0.7); shard(p, R, Rh, x0, y0, l, a, w); };
    mass([49, 17, 58, 17, 58.6, 32, 48.6, 32], K);
    mass([35.4, 8, 69.6, 8, 79, 9.4, 77.6, 12.6, 72, 15, 70, 18.6, 62, 20.6, 50, 20.4, 43.4, 18.4, 40, 15, 37, 13, 35, 10.4], S);
    p.poly(Sd, [40, 15, 72, 15, 70, 18.6, 62, 20.6, 50, 20.4, 43.4, 18.4]); p.poly(Sh, [36.4, 8.6, 69, 8.6, 77.6, 9.8, 70, 10.4, 40, 10.4]);
    seg(p, Sl, 38.4, 12.4, 74.6, 12.2, 0.6); for (const x of [41, 47, 53, 59, 65, 71]) { seg(p, Sl, x, 11.2, x, 13.6, 0.5); seg(p, Sl, x, 13.6, x + 2.2, 13.6, 0.5); }
    mass([36.6, 5, 67.6, 5, 68.4, 7.8, 36, 7.8], S); p.poly(Sh, [37, 5.4, 67.2, 5.4, 67.4, 6.4, 37, 6.4]);
    for (const [x0, y0, x1, y1] of [[36.6, 6.6, 35.6, 2.8], [67.4, 6.6, 68.8, 2.6]]) { const a = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0); shard(p, E, null, x0, y0, l + 0.8, a, 1.5); shard(p, B, Bh, x0, y0, l, a, 1); }
    curve(p, E, bez(39, 11.6, 33.4, 11.4, 33.6, 6.6, 8), 2.6, 2); curve(p, B, bez(39, 11.6, 33.4, 11.4, 33.6, 6.6, 8), 1.6, 1.1);
    curve(p, E, bez(74.6, 11.4, 80.6, 11, 80.4, 6.2, 8), 2.6, 2); curve(p, B, bez(74.6, 11.4, 80.6, 11, 80.4, 6.2, 8), 1.6, 1.1);
    seg(p, E, 32, 50.6, 19.8, 85.2, 5.2); seg(p, K, 32, 50.6, 19.8, 85.2, 3.8); seg(p, Kh, 31, 51, 19.4, 83.6, 1);
    for (let k = 0; k < 7; k++) { const t = 0.22 + k * 0.1, x = 32 + (19.8 - 32) * t, y = 50.6 + (85.2 - 50.6) * t; seg(p, '#a08850', x - 0.8, y + 0.2, x + 0.6, y - 0.4, 0.6); }
    seg(p, E, 31.2, 56.6, 29.2, 59.6, 4.4); seg(p, Bh, 31.2, 56.6, 29.2, 59.6, 3.4); glowing(p, E, 0.6, q => q.ell(B, 19.6, 84.6, 2.4, 1.8)); p.ell(Bh, 19, 84, 1, 0.8);
    mass([53.4, 57, 59.6, 57, 59.6, 88.6, 54, 88.6], K); mass([37.6, 57, 45.6, 57, 46.6, 70, 50.4, 73, 50, 77.4, 43, 77.4, 38, 70], K);
    plate([52.6, 56.6, 57.4, 56.6, 57.2, 66.2, 53.2, 65.8]); plate([57.8, 57, 63.2, 57.6, 62.6, 66.6, 58.4, 66]); fin(60.6, 59, 64.4, 61.2, 1); fin(60.4, 63, 64, 66.6, 0.9);
    p.ell(Bh, 55.4, 69.6, 0.8, 1.4); p.ell(Bh, 57.6, 69.6, 0.8, 1.4);
    plate([52.8, 71.4, 57, 71.2, 57.4, 83, 53.6, 83.4]); plate([57.4, 71.8, 62.4, 72.4, 61.6, 81, 57.8, 82]); p.ell(Bh, 57, 85.6, 0.9, 1.2);
    plate([51.8, 88.4, 56.4, 88.4, 57, 95.6, 52.6, 96.4]); plate([57.2, 88.4, 61.8, 88.4, 62.2, 95, 57.8, 95.6]);
    plate([37.2, 56.6, 44.6, 56.6, 45.6, 62.6, 41.6, 65, 37.6, 62.6]); plate([37.8, 64, 42.4, 65, 43.4, 71, 39.8, 72.4, 37.4, 69]); fin(38.4, 59, 34.4, 62.6, 0.9);
    plate([43.6, 66.6, 46.6, 66, 47.4, 71.6, 44.4, 72]); plate([42.6, 72.2, 50, 72.4, 50.4, 77, 43.2, 77.4]);
    mass([37, 46, 45, 45, 46, 55.4, 38.6, 57.6], S); mass([45.6, 45, 55, 45.6, 54.4, 56, 46.6, 56.4], S);
    p.poly(Sh, [37.6, 46.4, 44.6, 45.6, 45, 47.6, 38, 48.4]); p.poly(Sh, [46, 45.6, 54.4, 46.2, 54.4, 48, 46.2, 47.4]);
    for (const [x, y] of [[41.6, 51.4], [50.4, 51]]) { ringBand(p, Gd, x, y, 2.6, 2.6, 0.7, 0, 6.3); seg(p, Gd, x - 1, y - 1, x + 1, y + 1, 0.6); seg(p, Gd, x - 1, y + 1, x + 1, y - 1, 0.6); }
    mass([37, 25, 43, 23.6, 51, 23.6, 57.6, 25.4, 59, 30, 56.4, 36, 52.6, 40, 51, 44.6, 44, 44.6, 42, 40, 38.6, 35, 36.4, 30], S);
    p.poly(Sd, [41.4, 37.6, 52.8, 37.6, 51, 44.6, 44, 44.6]); p.poly(Sh, [37.6, 25.6, 43, 24.4, 51, 24.4, 57, 25.8, 58, 28.4, 51, 27.4, 43, 27.4, 37.4, 29]); p.poly(Sk, [43.6, 33.6, 51.6, 33.6, 50.6, 37, 44.4, 37]); seg(p, Sl, 39.4, 31, 43, 34.6, 0.6); seg(p, Sl, 56.2, 31, 52.6, 34.6, 0.6);
    glowing(p, E, 0.6, q => q.poly(Gd, [44.4, 27.6, 49.6, 27.6, 49.6, 32.4, 44.4, 32.4])); p.poly(Gl, [45.2, 28.4, 48.8, 28.4, 48.8, 31.6, 45.2, 31.6]);
    seg(p, Gd, 45.6, 30, 48.4, 30, 0.6); seg(p, Gd, 47, 28.8, 47, 31.2, 0.6);
    fin(30, 30.6, 25.6, 27.4, 1.4); fin(31, 33.6, 25.6, 32.6, 1.3);
    plate([28, 33, 33.6, 32.6, 34.4, 39, 31.6, 43, 28.6, 41]); plate([28.6, 42, 33.6, 42.6, 34.6, 48.6, 31, 50.6, 28.4, 48.4]); fin(28.8, 38.4, 24, 40.6, 1.1); fin(29.4, 44.6, 25, 47.4, 1);
    mass([29.4, 46.6, 34.8, 46.6, 35.6, 52.6, 30, 53.6], R); seg(p, Rd, 29.6, 50, 35.2, 50, 0.7);
    fin(74, 41.6, 80.6, 39.4, 1.4); fin(74, 47, 80.6, 46.6, 1.3); fin(73.4, 51, 79, 52.6, 1.1);
    plate([63.4, 38.4, 72, 38, 73.4, 45, 70.6, 50, 65.4, 47.6]); plate([68.6, 49.6, 74.6, 50, 75, 56.6, 69.6, 57.4]); seg(p, Rd, 64.6, 43.6, 72.6, 43, 0.8);
    mass([69.6, 56.4, 76.4, 56.6, 76.6, 59.6, 70, 59.6], K);
    for (const [x0, y0, x1, y1] of [[70.4, 59, 69.4, 64], [72.6, 59.4, 72.6, 64.6], [75, 59.2, 76.4, 63.6]]) { seg(p, E, x0, y0, x1, y1, 2.2, 1.6); seg(p, Kh, x0, y0, x1, y1, 1.3, 0.9); }
    glowing(p, E, 0.8, q => q.ell(B, 36.6, 28, 5.4, 6.8)); p.ell(Bd, 37.4, 29, 4.2, 5.6); p.ell(B, 36.4, 27.6, 4, 5.2); p.ell(Bh, 35, 25.4, 1.8, 2.2);
    curve(p, Bd, bez(34, 31, 34.6, 28.4, 37, 29, 6), 1, 0.7); curve(p, Bd, bez(37, 29, 39, 30, 37.6, 32, 6), 1, 0.7);
    glowing(p, E, 0.8, q => q.ell(B, 68.2, 34.4, 5.8, 6.2)); p.ell(Bh, 66.6, 32.2, 2, 2.2);
    ringBand(p, Bd, 68.4, 34.6, 4.4, 4.6, 0.8, 0, 6.3); ringBand(p, Bd, 68.4, 34.6, 2.4, 2.6, 0.7, 0, 6.3); p.ell(Bd, 68.4, 34.6, 0.8, 0.8);
    mass([42, 19, 49, 18.6, 51, 21, 51.4, 26, 49.6, 29, 43.6, 29.2, 41.6, 26, 41, 21.6], S); p.poly(Sh, [42.4, 19.6, 48.6, 19.4, 50.4, 21.4, 46, 22, 42.2, 22.4]); p.poly(Sk, [42.6, 23.6, 50, 23.4, 49.6, 26, 43, 26.2]);
    for (const [x0, y0, x1, y1] of [[43, 20.4, 41.4, 15.4], [45.6, 19.8, 45.4, 14.6], [48.2, 20, 50, 15.6]]) { const a = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0); shard(p, E, null, x0, y0, l + 0.8, a, 1.4); shard(p, B, Bh, x0, y0, l, a, 0.9); }
  };
  ART.spectral = (p, f) => {
    const { bez, curve, seg, shard, glowing } = G.FOE_KIT;
    const E = '#0c0a10', D = '#3a3040', Dh = '#56485c', Dd = '#241c2a', Gd = '#a8946c', Gh = '#d0bc90', Gk = '#76644a', R = '#a84848', Rh = '#c86a60', Rd = '#6c2a2a';
    const W = '#dcd8d8', Wh = '#f4f2f2', Ws = '#a8a0a4', Pa = '#d0cec4', Ps = '#a89e9e', Ink = '#3a2e2e', Lv = '#786c84', s = f ? 0.8 : 0;
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const rim = (pts, w) => { for (let i = 0; i + 3 < pts.length; i += 2) seg(p, Gd, pts[i], pts[i + 1], pts[i + 2], pts[i + 3], w); };
    mass([46.4, 57, 49.6, 58.6, 60, 68, 70, 77, 83 + s, 87.4, 68, 78.6, 58, 70.6, 47.6, 62], Dd); curve(p, Dh, bez(48.6, 59.4, 62, 70, 82, 86.6, 10), 0.6, 0.3);
    mass([39.6, 50, 44.4, 50, 44, 60, 43.2, 70, 42.8, 80, 41.2, 80, 40.8, 70, 40.2, 60], Dd); seg(p, Dh, 43.8, 53, 42.8, 76, 0.7);
    mass([40.8, 79.6, 43.6, 79.6, 44.6, 85, 44, 91.6, 41.6, 92, 40.8, 87], D); p.poly(Lv, [41.6, 83.6, 43.6, 83.6, 43.6, 87.6, 41.8, 88]); seg(p, Gd, 41, 80.4, 43.4, 80.4, 0.6); seg(p, Dd, 43.6, 88, 45, 92, 1);
    mass([33, 50, 38.4, 50, 38.6, 58, 38, 64, 37.8, 74, 37.4, 84, 34.8, 84.4, 34.6, 74, 34.2, 66, 33.2, 58], D);
    p.poly(Dh, [33.8, 51, 35.4, 51, 35.6, 58, 35, 63, 34.2, 58]); seg(p, Dh, 36.4, 68, 36.2, 82, 0.6);
    mass([32.6, 62.4, 36.4, 58.4, 40.2, 62.4, 36.4, 67.4], Gd); p.poly(R, [33.8, 62.4, 36.4, 59.8, 39, 62.4, 36.4, 65.8]); p.poly(Rh, [34.6, 62.2, 36.4, 60.6, 37, 61.6, 35.6, 62.8]);
    curve(p, Gd, bez(34.4, 66.4, 36.4, 70, 34.6, 72.6, 6), 0.7, 0.5); curve(p, Gd, bez(38.4, 66.4, 36.6, 70, 38.4, 72.6, 6), 0.7, 0.5);
    mass([33.6, 84, 37.8, 84, 38.4, 89, 37.8, 94.6, 33.4, 95.8, 32.6, 93.2], D); p.poly(Lv, [34.4, 87.4, 37.2, 87.4, 37.2, 91.4, 34.6, 91.8]); seg(p, Gd, 33.8, 84.6, 37.6, 84.6, 0.7); seg(p, Dd, 37.4, 92, 38.8, 96.2, 1.1);
    mass([30.6, 40, 34, 37.6, 39.6, 37.6, 43, 40, 45.6, 46, 45.2, 51.6, 41, 55.4, 31.6, 55.4, 29.4, 48], D); rim([30.6, 40, 29.4, 48, 31.6, 55.4], 0.7); rim([43, 40, 45.6, 46, 45.2, 51.6, 41, 55.4], 0.7); p.poly(Dh, [31.4, 41, 33.4, 39.4, 33, 47, 31, 48]);
    mass([32.4, 30, 38.6, 30, 38.8, 46, 37.2, 54.6, 35.4, 58.4, 33.4, 54.6, 32, 44], R); p.poly(Rd, [36.2, 31, 38.6, 31, 38.8, 46, 37.2, 54.6, 35.6, 57]);
    rim([32.4, 31, 32, 44, 33.4, 54.6, 35.4, 58.4, 37.2, 54.6, 38.8, 46, 38.6, 31], 0.7); for (const [x0, y0, x1, y1] of [[33, 40, 35.4, 44], [38.2, 40, 35.4, 44], [33, 48, 35.4, 44], [38.2, 48, 35.4, 44], [33.6, 49, 35.4, 53], [37.4, 49, 35.4, 53]]) seg(p, Gd, x0, y0, x1, y1, 0.5);
    mass([33, 29.6, 40, 29.6, 39.8, 33.6, 38.8, 37.6, 34.6, 37.6, 33.6, 33.6], D);
    mass([40.6, 24, 46, 24.4, 49.4, 30, 52.6, 34, 53.4, 40, 51.4, 44.6, 49, 44, 49.6, 38, 47, 33.6, 43, 30], D); p.poly(Dh, [44, 25.4, 46, 25.6, 48.6, 30, 46, 30.4]); seg(p, Gd, 49.2, 37.6, 52.4, 38, 1.2);
    mass([49.4, 42.6, 53.6, 43, 55.4, 46.4, 54, 49, 50.6, 48], D);
    const px = 52.6, py = 62.4, edge = [[49.8, 50.6], [50.6, 44 - s * 0.3], [53.6, 38.6 - s * 0.4], [57.6, 36.4 - s * 0.4], [61.6, 37.6 - s * 0.3], [65, 41.6], [66.6, 47.6], [66, 54], [63.4, 59.6]];
    for (const [x, y] of edge) { seg(p, E, px, py, x, y, 1.1); seg(p, Dh, px, py, x, y, 0.5); }
    const fan = edge.flat().concat(edge.slice().reverse().map(([x, y]) => [px + (x - px) * 0.42, py + (y - py) * 0.42]).flat());
    mass(fan, Pa); p.clipPoly(fan, () => { p.poly(Ps, [px, py, 58, 57, 66.6, 47.6, 66, 54, 63.4, 59.6]); for (const [x, y] of edge) seg(p, Ps, px, py, x, y, 0.4); });
    curve(p, Ink, bez(56.6, 44.6, 61.4, 41.6, 62.6, 46.6, 8), 1.4, 0.9); curve(p, Ink, bez(62.6, 46.6, 63.2, 51, 58.6, 51.6, 8), 1.2, 0.8);
    rim(edge.flat(), 0.9); seg(p, Gd, px, py, 49.8, 50.6, 1); seg(p, Gd, px, py, 63.4, 59.6, 1);
    glowing(p, E, 0.6, q => q.ell(Gd, 52.8, 62.6, 1.8, 1.8)); p.ell(Gh, 52.4, 62.2, 0.8, 0.8);
    for (const [x0, y0, x1, y1] of [[51.4, 46, 53.6, 51.6], [52.6, 45.4, 55.4, 50], [53.8, 45.6, 56.4, 48]]) { seg(p, E, x0, y0, x1, y1, 1.7); seg(p, D, x0, y0, x1, y1, 1); }
    mass([30.6, 22.6, 40, 22.6, 41, 28, 38.6, 32, 33, 32, 30.6, 28], Gd); p.poly(Gh, [31.6, 23.4, 35.4, 23.2, 34.4, 27.6, 31.6, 27]); p.poly(Gk, [36.6, 29.4, 40.4, 27.6, 38.6, 31.4, 34, 31.4]);
    glowing(p, E, 0.6, q => q.ell(Dd, 35.4, 25.6, 2, 1.8)); seg(p, Gh, 34.4, 25.6, 36.4, 25.6, 0.5); seg(p, Gh, 35.4, 24.6, 35.4, 26.6, 0.5);
    mass([25.6, 18, 31, 16.6, 34, 19, 33, 25, 28.4, 26, 25, 22.6], D); rim([25, 22.6, 25.6, 18, 31, 16.6, 34, 19], 0.8); shard(p, E, null, 26.4, 19, 4, 3.4, 1.2); shard(p, Gd, Gh, 26.4, 19, 3.2, 3.4, 0.7);
    mass([40, 17.6, 46, 16, 51.4, 18.6, 53, 24, 49.6, 29, 43.6, 27, 40.6, 23], D); p.poly(Dh, [41.4, 18.4, 46, 17.2, 50.4, 19.4, 46, 21, 42.4, 22]); rim([40, 17.6, 46, 16, 51.4, 18.6, 53, 24, 49.6, 29], 0.8);
    shard(p, E, null, 50.6, 18.4, 5, -0.4, 1.2); shard(p, Gd, Gh, 50.6, 18.4, 4.2, -0.4, 0.7);
    seg(p, E, 30.6, 24.6, 17.4, 38.6, 3.2); seg(p, Dd, 30.6, 24.6, 17.4, 38.6, 2.2); seg(p, Gd, 18.6, 37.4, 17.4, 38.6, 2.4); seg(p, Gd, 29.6, 25.6, 30.6, 24.6, 2.4); seg(p, Gd, 22.6, 33, 21.4, 34.2, 2.2);
    mass([27.6, 22.6, 31.4, 24.6, 28.6, 28.4, 25.4, 27.4], D); mass([22.4, 26.6, 26.6, 27, 27.4, 31, 23.4, 31.6, 21.6, 29.6], D); seg(p, Gd, 23.2, 27.4, 26.4, 27.6, 0.7);
    mass([33.6, 9, 37, 7, 41.4, 7.4, 42.8, 10, 42, 16, 40, 20.6, 36.4, 21, 34, 17, 33.4, 12], D);
    mass([35.4, 10.8, 38, 9.8, 40.6, 10.8, 40.4, 15, 39.4, 18.4, 37.8, 19.4, 36.2, 18, 35.6, 14], Gd); p.poly(Gh, [36, 11.2, 38, 10.4, 38.4, 13, 36.6, 14.6, 36, 13.8]);
    p.poly(E, [35.6, 13.2, 40.8, 12.4, 40.6, 14.2, 35.8, 14.8]); p.poly(Gk, [37.4, 15.6, 39.6, 15.2, 38.6, 18.6]); shard(p, Gh, null, 38, 10.6, 2.6, -1.57, 0.7);
    mass([34.4, 9, 35, 4.6, 38, 3.2, 41.4, 4.2, 42.4, 8.6], Dd); seg(p, Dh, 36.4, 5, 40.6, 5.2, 0.6);
    seg(p, E, 35, 7.6, 29, 8.4, 1.6); seg(p, Dd, 35, 7.6, 29, 8.4, 0.9); p.ell(Gd, 29, 8.4, 0.9, 0.9); seg(p, E, 41.6, 6, 47.8, 5, 1.6); seg(p, Dd, 41.6, 6, 47.8, 5, 0.9); p.ell(Gd, 47.8, 5, 0.9, 0.9);
    mass([41, 6.4, 43.8, 7.6, 45, 12, 45.4, 18, 44.8, 24, 43.4, 27.4, 42, 24.6, 42, 18, 41.6, 12], W); p.poly(Ws, [43.6, 9.4, 45, 12, 45.4, 18, 44.6, 24.4, 43.4, 26, 43.6, 18]); seg(p, Wh, 42, 9, 42.6, 20, 0.5);
    mass([33.6, 10.6, 34.6, 11, 34.4, 16, 33.6, 21.6, 32.8, 20.8, 33, 15], W);
  };
  ART.patroller = (p, f) => {
    const { bez, curve, seg, shard, glowing } = G.FOE_KIT;
    const E = '#0e1018', S = '#9c9c92', Sh = '#c6c6ba', Sl = '#e2e2d8', Sd = '#76766e', Sk = '#34343c', C = '#86aac4', Ch = '#bcd2e6', Cl = '#dce8f4', Cd = '#5a7ea8', Ck = '#2a3a66';
    const Pl = '#0e1a5e', Plh = '#3a4ea0', Cy = f ? '#a8f4ff' : '#38d8ff', Rd = '#5a2e2e', Rh = '#7c4040', Sn = '#f4d8cc';
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const fin = (x0, y0, x1, y1, w) => { const a = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0); shard(p, E, null, x0, y0, l + 0.9, a, w + 0.7); shard(p, S, Sl, x0, y0, l, a, w); };
    const cloud = (x, y, r) => { const pts = []; for (let k = 0; k <= 14; k++) { const t = k / 14 * 4.4, rr = r * (1 - k / 20); pts.push([x + Math.cos(t + 3.4) * rr, y + Math.sin(t + 3.4) * rr * 0.85]); } curve(p, Cl, pts, 0.9, 0.5); };
    mass([54, 50, 61.4, 50, 63.4, 58, 63, 64.6, 58.4, 66.4, 55.6, 62], C); p.poly(Cd, [55, 62, 58, 66.6, 64, 64.6, 64.4, 60, 59, 62.4]); p.poly(Ch, [54.4, 51, 58, 50.8, 57, 55, 55, 57]); cloud(60.4, 56.4, 2.4);
    mass([56, 63.4, 64.4, 63.6, 64.4, 68.6, 56.6, 68.6], Ck);
    mass([56.4, 68.6, 64.6, 68.6, 66, 76, 65.4, 84.6, 59.6, 85.4, 57.4, 78], S); p.poly(Sh, [57.4, 69.4, 60.4, 69.4, 60, 78, 58.4, 77]); seg(p, Ck, 62, 70, 62.6, 82.6, 1.1); fin(57.6, 69, 54.4, 66.6, 1);
    mass([59, 84.6, 65.6, 84.6, 66.6, 90, 65.6, 95.4, 59.6, 95.6, 58.4, 90], S); p.poly(Sh, [59.6, 85.4, 62.4, 85.4, 62, 92, 59.6, 91]); seg(p, Sd, 59.4, 90.4, 66, 90.4, 0.6);
    mass([44, 51, 51.4, 50, 53, 55, 50.4, 60.4, 45.6, 61.2, 43, 57], C); p.poly(Ch, [43.6, 51.6, 48, 51, 46.6, 55.6, 43, 56.6]); p.poly(Cd, [45, 61.6, 50.6, 60.6, 53, 55, 51, 58.4, 46, 59.4]); cloud(47.6, 56.2, 2.4);
    mass([44, 60.6, 50.6, 60, 51, 63, 44.6, 63.6], Ck);
    mass([44.6, 62.4, 51.6, 62, 52.6, 69, 49.6, 70.4, 45.6, 68.4], S); p.poly(Sh, [45.4, 63, 48, 62.8, 47.6, 68, 46, 67.6]);
    mass([41.6, 69, 49.6, 68.4, 52.6, 70, 52.4, 73.4, 44, 73.6, 41, 72], S); p.poly(Sh, [42.4, 69.6, 49.4, 69.2, 49, 71, 42.4, 71.2]);
    mass([47, 44, 58, 44, 60, 52, 54, 54.4, 48, 52], C); p.poly(Cd, [53, 46, 58, 44, 60, 52, 54, 54.4]); p.poly(Ch, [47.6, 44.6, 52, 44.6, 51, 48, 48.4, 49]);
    mass([47.6, 29, 55, 28, 59.6, 32, 59.6, 40, 57, 46, 52, 48, 48, 44, 47, 36], C);
    mass([50.4, 27.6, 55, 26, 58.6, 27.8, 58.2, 33, 55, 35, 51.6, 32], '#2e6a7c'); seg(p, Sl, 50.8, 27.8, 55, 26.4, 0.7); seg(p, Sl, 55, 26.4, 58.4, 28, 0.7); p.poly(Rd, [53.2, 31.4, 55.6, 31, 56.4, 39.6, 53.8, 39.8]);
    mass([47.6, 31, 51.8, 31.6, 52.6, 37, 50, 39.6, 47.6, 37], S); p.poly(Sh, [48, 31.6, 51.2, 32, 50.6, 34.4, 48.2, 34.6]);
    mass([50, 39.6, 58.4, 38.6, 59, 43.6, 51, 45.4], Rd); p.poly(Rh, [50.6, 40.2, 58, 39.2, 58, 40.6, 50.8, 41.6]); glowing(p, E, 0.5, q => q.poly(S, [53.4, 40.6, 55.6, 40.2, 55.8, 43, 53.6, 43.4]));
    for (const [x0, y0, cx, cy, x1, y1, w] of [[55.4, 34, 57.2, 24.6, 64.6, 19.2, 5], [60.2, 32, 62, 27.2, 67.4, 25, 3.8]]) { curve(p, E, bez(x0, y0, cx, cy, x1, y1, 10), w + 1.4, 1.2); curve(p, S, bez(x0, y0, cx, cy, x1, y1, 10), w, 0.5); curve(p, Sl, bez(x0 + 0.4, y0 - 0.6, cx + 0.4, cy - 0.4, x1, y1, 10), w * 0.3, 0.2); }
    mass([55.4, 31, 60, 29.6, 65.6, 29.8, 69, 33.6, 69.6, 38.6, 66.6, 41.4, 60.4, 41.6, 56.4, 38.6], S); p.poly(Sh, [56.4, 31.6, 60, 30.4, 65.4, 30.6, 67.4, 33, 61.4, 33.4, 57.4, 34.6]);
    p.poly('#b4a88c', [57.4, 37.4, 59.6, 35.2, 62.6, 36, 65, 34.8, 67.8, 35.8, 68.6, 38.4, 66.4, 40.6, 60.4, 40.8, 57.6, 39.6]); curve(p, '#d8ceb0', bez(58.4, 37.6, 62.4, 35.6, 67.6, 36.6, 8), 0.8, 0.5);
    mass([58, 41, 67.6, 40.4, 69.6, 45, 67, 50, 61.4, 50.4, 58.4, 46.4], S); p.poly(Sd, [58.4, 46.4, 61.4, 50.4, 67, 50, 69.6, 45, 66, 47, 61.4, 47.4]); seg(p, Sh, 59, 42, 67, 41.4, 0.7);
    mass([47, 29, 48.6, 32.6, 42, 33.2, 38.6, 31, 39.4, 27.6, 44, 28.2], Ck); mass([40, 27.8, 45.4, 28.4, 45.2, 32.4, 40.4, 31.6], S); p.poly(Sh, [40.6, 28.4, 44.8, 28.8, 44.6, 30, 40.6, 29.8]);
    seg(p, E, 34, 22.4, 80.6, 85.2, 2.8); seg(p, Pl, 34, 22.4, 80.6, 85.2, 1.9); seg(p, Plh, 34.4, 22.2, 79, 82.6, 0.6);
    shard(p, E, null, 72, 74, 14, Math.atan2(11.2, 8.6), 2.2); shard(p, S, Sl, 72, 74, 13, Math.atan2(11.2, 8.6), 1.5); seg(p, '#2a4ad0', 74.4, 77.4, 77.6, 81.6, 0.8, 0.4);
    mass([18.6, 2.6, 21.4, 2.8, 24.6, 4.6, 27.6, 7.4, 30.4, 11, 32.6, 15, 35, 19.6, 33.4, 22.6, 30.4, 21.4, 26.6, 17.6, 23, 13.4, 20.6, 8.6, 20.4, 5.4, 18.4, 4.4], S);
    p.poly(Sh, [19.2, 3.2, 21.2, 3.4, 21.4, 6, 23, 10.6, 25.6, 14.6, 28.4, 18, 25.4, 16.2, 22.4, 12, 21, 8]);
    p.poly('#14182a', [22.6, 5.4, 25.6, 7.6, 28.6, 11.4, 31, 15.4, 33, 19.6, 30.6, 19, 27.6, 15.4, 24.6, 11.4, 22.6, 7.6]);
    p.poly(Cy, [25.2, 9.4, 27.6, 12, 30, 15.6, 31.4, 18.6, 29, 17, 27, 14, 25.4, 11.6]); seg(p, '#f0feff', 26.2, 11.2, 29.4, 16, 0.6);
    mass([29.6, 20.6, 33.6, 19.6, 37.4, 22.6, 36.4, 24.6, 32.6, 23.6, 29.4, 23], Sk); seg(p, Sh, 30.2, 21, 36.4, 23, 0.5);
    mass([35.4, 25.4, 39, 25.2, 39.6, 28.6, 37.4, 30, 35.2, 28.6], Sn); seg(p, '#b88a7c', 35.8, 27.2, 39, 27, 0.4);
    mass([53.6, 44.4, 58.4, 44.6, 59, 49, 54.6, 49.6], S); p.poly(Sh, [54.2, 45, 57.6, 45.2, 57.2, 46.6, 54.4, 46.6]);
    mass([46.4, 16.4, 47.4, 12.8, 49.4, 11, 51.8, 11.4, 53.8, 13.4, 55.2, 17, 55.6, 22, 54.8, 27, 51.6, 30.4, 48, 29, 46.4, 24], S);
    p.poly(Sh, [47.2, 15.8, 48.6, 12.6, 51.4, 11.4, 52.4, 14, 49.6, 16.4, 48, 21]); p.poly(Sd, [53, 24, 55.4, 22, 55, 27, 51.6, 30.4, 49.6, 29.4]);
    p.poly(Sk, [48.4, 19, 54.6, 18.6, 54.4, 24, 50.6, 26.6, 48.6, 24]); for (const x of [50, 51.6, 53.2]) seg(p, S, x, 19.4, x, 24.6, 0.6);
    fin(48.6, 12.6, 47.6, 9.6, 1); fin(51, 11.6, 52.2, 9.2, 0.9); fin(46.8, 18, 44.4, 16.6, 0.8); curve(p, E, bez(53.4, 19.4, 57, 16.4, 60.6, 17.4, 8), 2.2, 1); curve(p, Sk, bez(53.4, 19.4, 57, 16.4, 60.6, 17.4, 8), 1.3, 0.5);
  };
  ART.ebon = (p, f) => {
    const { bez, curve, seg, shard, leaf, glowing } = G.FOE_KIT;
    const E = '#0c0a14', K = '#1a181e', Kh = '#4a4a54', Km = '#2e2c34', Au = '#e4b424', Gd = '#d8ae40', Gh = '#fce884', Gk = '#8a6418';
    const I = '#5a62ae', Ih = '#8a92d4', Id = '#2a2a66', Tb = '#2a86b0', Th = '#6cc4e0', Td = '#16466e', Nk = '#3090a8', Nh = '#5cbacb';
    const Sl = '#5a6068', Slh = '#868c96', Sld = '#2e3238', Bl = '#2a64b0', Bd = '#1a3a72', Cr = '#f0e2b0', Crh = '#fff6d8', Lf = '#d8ba48', Lfh = '#f8e48a', Tw = '#2a2228';
    const s = f ? 0.06 : 0, eye = f ? '#fff2a0' : '#ffc840';
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const moon = (a, b) => a.concat(b.slice().reverse()).flat();
    const vein = (x0, y0, cx, cy, x1, y1, w) => curve(p, Au, bez(x0, y0, cx, cy, x1, y1, 8), w + 0.5, w * 0.6 + 0.4);
    const blade = (x, y, a, l, w, c) => { const t = a + s, x1 = x + Math.cos(t) * l, y1 = y + Math.sin(t) * l; leaf(p, E, x - Math.cos(t) * 0.5, y - Math.sin(t) * 0.5, x1 + Math.cos(t) * 0.7, y1 + Math.sin(t) * 0.7, w + 0.6, w + 0.6); leaf(p, c[0], x, y, x1, y1, w, w); leaf(p, c[1], x, y, x1, y1, w, 0); };
    const bloom = (x, y, r) => { glowing(p, E, 0.5, q => { for (let k = 0; k < 5; k++) { const t = k * 1.2566 - 1.57 + s; q.ell(Cr, x + Math.cos(t) * r * 0.56, y + Math.sin(t) * r * 0.56, r * 0.52, r * 0.52); } }); p.ell(Crh, x - r * 0.3, y - r * 0.4, r * 0.3, r * 0.26); p.ell('#c89a40', x, y, r * 0.28, r * 0.28); };
    const fruit = (x, y, r) => { glowing(p, E, 0.7, q => q.ell('#c8a650', x, y, r, r * 1.05)); p.ell('#8a6c28', x + r * 0.2, y + r * 0.26, r * 0.78, r * 0.76); p.ell('#c8a650', x - r * 0.1, y - r * 0.1, r * 0.8, r * 0.82); p.ell('#f2e2a0', x - r * 0.36, y - r * 0.4, r * 0.32, r * 0.26); };
    const LEAF = [Lf, Lfh], FAN = ['#e8b838', '#fce070'];
    const leg = (a, b) => { const pts = a.concat(b.slice().reverse()).flat(), mid = a.map(([x, y], k) => [(x + b[k][0]) / 2, (y + b[k][1]) / 2]); mass(pts, Km); curve(p, '#55575f', mid, 2.4, 1.1); curve(p, '#8a8e98', mid.map(([x, y]) => [x - 0.4, y]), 0.7, 0.3); curve(p, Au, a, 0.9, 0.8); curve(p, Au, b, 0.9, 0.8); };
    leg([[70.4, 60], [70.8, 68], [72.2, 74], [73.6, 80], [74.2, 86.6]], [[74.4, 60.4], [76.6, 65.6], [75.4, 71], [77, 77], [76.8, 86.2]]);
    shard(p, E, null, 75.8, 67, 5, -0.8, 1.5); shard(p, K, Kh, 75.8, 67, 4.2, -0.8, 1);
    leg([[48.6, 70], [48.6, 75], [49.4, 80], [49.8, 86], [49.8, 91]], [[52, 70.4], [52.4, 76], [51.6, 82], [51.8, 88], [51.8, 91]]);
    mass(moon(bez(44.5, 4.7, 59.4, 12.4, 63.8, 28.6, 12), bez(44.5, 4.7, 51.6, 19.6, 53, 31, 12)).concat([57.6, 31.8]), Sl);
    p.poly(Sld, moon(bez(44.5, 4.7, 49.6, 14, 50.6, 20, 8), bez(44.5, 4.7, 47.6, 12.6, 48.8, 19, 8)));
    p.poly(Gd, moon(bez(50.2, 17.6, 59.6, 21.4, 62.6, 29.4, 10), bez(50.2, 17.6, 54, 24.6, 53.8, 30.8, 10)).concat([58, 31.2]));
    curve(p, Gh, bez(52.6, 22, 57, 25.4, 59.6, 29.6, 8), 0.9, 0.5); curve(p, Slh, bez(46.6, 7.4, 56, 12.6, 60.6, 22, 10), 1.2, 0.6); curve(p, '#c8d0dc', bez(49.6, 9.6, 55.6, 13.6, 59, 20.6, 8), 0.6, 0.4);
    mass([44, 48, 50, 46.6, 56, 46.4, 61, 45.2, 67, 45.4, 72.6, 48, 75.6, 52.6, 74.6, 58, 70.6, 61.4, 64.4, 62.8, 57, 63.6, 50.6, 64.8, 46, 62.6], Km);
    p.poly('#3c6c84', [46, 49, 50, 47.6, 56, 47.4, 61, 46.6, 63.4, 50, 61.4, 54.6, 56, 57, 51.6, 59, 47.4, 57]); p.poly('#5a8aa4', [48, 49.4, 54, 48, 60, 47.6, 57, 50, 52, 51.4]);
    curve(p, '#4a4c58', bez(63.4, 49.4, 70, 50, 73.6, 55.6, 10), 2.6, 1.4); curve(p, '#6a6e7a', bez(64.6, 49.6, 69.6, 50.4, 72.6, 54.4, 8), 0.9, 0.5);
    vein(50.6, 58.6, 57, 56.4, 63.6, 56.8, 0.8); vein(63.6, 56.8, 69, 55, 72.4, 50, 0.7); vein(54, 63.6, 58, 60.6, 63, 61.4, 0.6); vein(66.6, 61.4, 71, 59.6, 74.4, 55.6, 0.7);
    curve(p, Kh, bez(56, 61.4, 62, 58.6, 70, 58.6, 10), 1, 0.6);
    leg([[60, 58], [60.4, 64], [62.4, 69], [63.6, 74], [63.2, 79], [63, 84.2]], [[69, 58.4], [69.4, 64], [67.8, 70], [66.6, 74], [66, 79], [66.2, 84]]);
    mass([62.2, 83.4, 67, 83.4, 67.6, 86.4, 61.6, 86.6], Kh); seg(p, Au, 62.2, 83.6, 67, 83.6, 0.6);
    leg([[43.6, 63.4], [44.4, 69], [45.4, 73], [46.4, 78], [45.8, 84], [46.4, 90], [46, 95.4]], [[51.4, 63], [51.6, 68], [50.4, 73], [49.2, 78], [49.4, 84], [48.8, 90], [49.4, 95.4]]);
    mass([45, 94.8, 50, 94.8, 50.6, 97, 44.4, 97.2], Kh); seg(p, Au, 45, 95, 50, 95, 0.8);
    mass([52, 44, 56, 42.6, 62, 41.4, 68, 39, 72.6, 36.6, 75.6, 36, 74.6, 39.6, 71.4, 43.4, 66, 46, 60, 47, 54, 47.2], Gd);
    p.poly(Bd, [54, 47.2, 60, 47, 66, 46, 71.4, 43.4, 70.4, 45.8, 66, 48.4, 60, 49.4, 54.4, 49.4]); curve(p, Gh, bez(53.4, 44.2, 64, 41.4, 75, 36.4, 10), 0.9, 0.5); curve(p, Gk, bez(55, 46, 64, 44.6, 72.4, 40.4, 10), 0.6, 0.4);
    mass([71, 40.8, 73.4, 37.4, 76.6, 35.4, 77.6, 37, 75.2, 41.4, 72.6, 43.6], Gd); p.poly(Gh, [73.4, 37.8, 76.4, 35.8, 76.8, 36.8, 74, 39]);
    curve(p, E, bez(55.4, 43, 57, 38.6, 60.6, 36, 8), 1.6, 1); curve(p, Tw, bez(55.4, 43, 57, 38.6, 60.6, 36, 8), 0.9, 0.5);
    for (const [x, y, a, l, w] of [[60.4, 36.2, -0.6, 4.6, 1.3], [60, 36.6, 0.4, 5, 1.4], [58, 38.6, -1.4, 4, 1.1], [61.4, 35.6, -1.4, 3.6, 1]]) blade(x, y, a, l, w, LEAF);
    fruit(52.6, 44.2 + (f ? 0.4 : 0), 2.6); fruit(55.8, 44.8, 2.8);
    mass([38.6, 43.6, 44.4, 42, 46.6, 45.6, 46.4, 51, 44.6, 54, 39.4, 54, 38.4, 49], Nk); p.poly(Nh, [39.4, 44.4, 42.4, 43.4, 41.6, 48, 39.4, 50]); curve(p, '#c8e8f0', bez(43.4, 44.6, 42.4, 48, 43.6, 52, 6), 0.5, 0.4);
    mass([36.4, 52.6, 34.2, 50, 38, 51.4, 44, 51, 47.6, 53.4, 47, 58.6, 44.6, 63, 40.4, 66.8, 37.6, 62.6, 36.6, 57.6], Gd);
    p.poly(Gh, [37.2, 52.6, 38, 51.6, 44, 51.2, 46.6, 53, 42, 53.4, 38.4, 54.4]); p.poly(Gk, [41.4, 54.4, 44.6, 54, 44, 60.4, 40.6, 66, 40.8, 60]);
    p.poly(Gh, [37.6, 55.4, 40.6, 54.8, 40.4, 60, 39, 62.6, 37.6, 59]); seg(p, Gk, 37, 57, 46.4, 56.6, 0.6);
    mass([32.6, 24.6, 36.6, 23.6, 42, 25.4, 48, 27.6, 53.4, 29.6, 58, 30.6, 62.4, 29.8, 64, 31.6, 60.4, 34.2, 54, 35, 47, 33.4, 42, 31.6, 37.4, 30.4, 33.6, 29], Tb);
    p.poly(Th, [33.4, 25.4, 36.6, 24.4, 42, 26.2, 48, 28.4, 53.4, 30.4, 58, 31.4, 62.2, 30.6, 58, 32, 53, 31.6, 47, 30, 41.6, 28, 36.6, 26.6]); p.poly(Td, [37.4, 30.4, 42, 31.6, 47, 33.4, 54, 35, 60.4, 34.2, 57, 35.4, 50, 35.6, 43.6, 34]);
    curve(p, '#e8f6fc', bez(44, 28.4, 50, 31.2, 56.6, 32, 8), 0.6, 0.4);
    mass(moon(bez(29.6, 3.2, 26.2, 15, 31.2, 26.8, 12), bez(29.6, 3.2, 33.6, 13.6, 37.2, 24.6, 12)), Bl);
    p.poly(Gd, moon(bez(29.6, 3.2, 28.8, 14, 33, 26.2, 12), bez(29.6, 3.2, 33.6, 13.6, 37.2, 24.6, 12)));
    p.poly(Bd, moon(bez(28, 14, 27.2, 20, 31.2, 26.8, 8), bez(28, 14, 28.6, 20, 31.6, 26.2, 8))); curve(p, Gh, bez(30.4, 6, 31.8, 14, 34.4, 22.6, 10), 1.1, 0.6);
    blade(37.2, 37.8, -2.55, 15.4, 1.4, FAN); blade(36.6, 33.8, -2.2, 5, 1.3, LEAF);
    curve(p, E, bez(43.6, 34, 44.6, 26, 44.8, 16.4, 10), 1.8, 1); curve(p, Tw, bez(43.6, 34, 44.6, 26, 44.8, 16.4, 10), 1.1, 0.5);
    curve(p, E, bez(45, 27, 47.6, 25, 50.6, 21.6, 8), 1.4, 0.9); curve(p, Tw, bez(45, 27, 47.6, 25, 50.6, 21.6, 8), 0.8, 0.4);
    curve(p, E, bez(41.4, 33.6, 39.4, 28, 38.4, 20.6, 8), 1.6, 1); curve(p, Tw, bez(41.4, 33.6, 39.4, 28, 38.4, 20.6, 8), 0.9, 0.5);
    for (const [x, y, a, l, w] of [[44.8, 17, -1.8, 4.6, 1.3], [44.8, 19.6, -0.6, 5, 1.4], [44.4, 21.6, -2.7, 4.6, 1.3], [45.4, 24, -0.2, 5.4, 1.4], [50.4, 21.8, -0.9, 4.6, 1.3], [49, 24.4, 0.3, 4.6, 1.3], [44, 26, 2.9, 4.6, 1.2], [47.4, 22.6, -1.6, 4, 1.1]]) blade(x, y, a, l, w, LEAF);
    for (const [x, y, r] of [[38.4, 18.6, 1.6], [36.8, 21.8, 1.7], [39.8, 22.6, 1.5], [36.4, 25.6, 1.7], [38.8, 27.2, 1.5], [40.6, 19.6, 1.3], [35.4, 19.4, 1.3]]) bloom(x, y, r);
    mass([45, 33.2, 50.6, 30.4, 48.4, 35.6], Id); p.poly(Td, [46, 33.4, 49.6, 31.2, 48, 34.6]);
    mass([33.2, 44, 36, 40.8, 39, 37.7, 42.1, 34.7, 45.4, 32, 47.9, 33.2, 49.2, 36.6, 46.1, 39.6, 42.4, 41.9, 38.5, 43.8, 34.6, 45.7, 33.2, 45.3], Id);
    p.poly(I, [36.6, 40.6, 39.2, 37.9, 42.2, 34.9, 45.4, 32.5, 47.4, 33.4, 46.8, 36.6, 44, 38.8, 40.8, 40.8, 38.2, 42.2]);
    p.poly('#30306a', [33.2, 44, 36.1, 40.9, 37.4, 41.9, 38.2, 43.5, 34.4, 45.6, 33.2, 45.3]); p.ell('#0e0e22', 33.9, 44.7, 0.7, 0.55);
    curve(p, '#e8f0f8', bez(45.4, 32.9, 41.4, 35.6, 36.8, 40.8, 10), 0.8, 0.3); curve(p, Au, bez(46.4, 38.4, 41.6, 41.6, 35.8, 44.8, 10), 0.8, 0.4);
    glowing(p, E, 0.5, q => q.poly(eye, [40.3, 38.8, 41.8, 38.4, 42.5, 37, 41, 37.4])); p.ell('#fffbe0', 41.6, 37.8, 0.4, 0.3);
  };
  ART.lupus = (p, f) => {
    const { bez, curve, seg, shard, glowing } = G.FOE_KIT;
    const E = '#10121c', W = '#f0f1f6', Wm = '#d6d8e4', Wh = '#fbfcff', Ws = '#b6bacb', Wd = '#868aa2', N = '#1c2234', Nh = '#2e3a54', K = '#121420';
    const H = '#b49a64', Hh = '#dcc08a', Hd = '#8e7a52', T = '#4a808c', Th = '#72b0b8', Tl = '#a8dcdc';
    const B = '#5a82d0', Bh = '#a6c4ff', Bd = '#38589a', Bl = '#8cb4ec', Pw = '#c6c8d4', Ps = '#8c8ea2', Cl = '#5e5848', u = f ? 0.6 : 0, eye = f ? '#9ad8ff' : '#62b2f4';
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const leg = (pts, ws, col) => {
      for (const [c, d] of [[E, 1.6], [col, 0]]) {
        for (let i = 0; i + 3 < pts.length; i += 2) seg(p, c, pts[i], pts[i + 1], pts[i + 2], pts[i + 3], ws[i / 2] + d, ws[i / 2 + 1] + d);
        for (let i = 2; i + 2 < pts.length; i += 2) p.ell(c, pts[i], pts[i + 1], (ws[i / 2] + d) / 2, (ws[i / 2] + d) / 2);
      }
    };
    const claws = list => { for (const [x, y, a] of list) { shard(p, E, null, x, y, 2.2, a, 0.8); shard(p, Cl, null, x, y, 1.7, a, 0.45); } };
    const ring = (x0, y0, x1, y1) => { seg(p, E, x0, y0, x1, y1, 2.6); seg(p, H, x0, y0, x1, y1, 1.4); seg(p, Hh, x0, y0 - 0.3, x1, y1 - 0.3, 0.5); };
    const tuft = (x, y, len, a, w) => { shard(p, E, null, x, y, len + 1, a, w + 0.6); shard(p, W, null, x, y, len, a, w); };
    const band = (list, col) => { for (const [c, d] of [[E, 1.2], [col, 0]]) for (const [pts, a, b] of list) curve(p, c, pts, a + d, b + d); };
    leg([49.6, 58.6, 46.4, 71], [4.6, 3.6], K); seg(p, T, 47.4, 62.4, 45.2, 69.6, 1.4, 1); seg(p, Th, 47.2, 63, 45.8, 67.6, 0.5);
    ring(43.6, 72.2, 47, 72.4);
    mass([43, 73, 46.6, 73.2, 46, 76.6, 44.6, 79.4, 39.6, 79.6, 39.8, 77.4, 41.8, 75.4], Ps); p.poly(Pw, [43, 73.6, 44.6, 73.8, 43.6, 76.6, 41.4, 78.6, 40.4, 78.6, 41.8, 76]);
    claws([[40.2, 79.2, 1.9], [41.8, 79.4, 1.7], [43.4, 79.4, 1.5]]);
    leg([67.6, 45.6, 70.8, 60.6, 76.6, 71.4], [5.2, 4.4, 3.2], K);
    seg(p, T, 69.8, 47.6, 72.6, 59.4, 1.4, 1.2); seg(p, Th, 70, 48.4, 72, 57.4, 0.5);
    seg(p, T, 72.6, 64.2, 76.6, 70.6, 1.6, 1.2); seg(p, Th, 73, 64.6, 75.6, 68.8, 0.5);
    tuft(70.4, 61.4, 3, -0.5, 1);
    ring(75.2, 72.2, 78.4, 71.8);
    mass([75.8, 73, 78.8, 72.6, 80.2, 76, 81.8, 79.8, 81.4, 81.8, 77.2, 82, 76.6, 79, 76, 75.6], Pw); p.poly(Ps, [79, 73.4, 80.2, 76, 81.8, 79.8, 81.4, 81.4, 79.6, 81.6, 78.6, 77]);
    claws([[77.6, 81.6, 1.6], [79.2, 81.8, 1.5], [80.8, 81.6, 1.3]]);
    mass([48.6, 42.6, 50.6, 38.8, 54, 36.6, 58, 35.6, 61.8, 36.2, 64.6, 38.6, 66.2, 42.4, 66.4, 47, 63, 51, 58.6, 55.4, 53, 56.4, 49.4, 53.4], N);
    p.poly(Nh, [51.4, 39.6, 54.4, 37.6, 58, 36.8, 61.4, 37.4, 63.6, 39.4, 59, 39.4, 54.6, 40.6, 52, 42.4]);
    curve(p, Bd, bez(52.4, 39.8, 57.6, 35.2, 64, 38.8, 10), 2.6, 1.4); curve(p, B, bez(52.8, 39.4, 57.6, 35.8, 63.6, 38.8, 10), 1.8, 1); curve(p, Bh, bez(54.4, 38, 57.6, 36.2, 61, 37.2, 6), 0.8, 0.5);
    curve(p, B, bez(61.6, 41.2, 64.8, 41, 64.6, 45, 6), 1, 0.6);
    mass([57.4, 44, 62, 40.6, 66.4, 43.6, 67.6, 51, 67, 59, 65.4, 65.2, 62.8, 67.6, 60, 66.8, 58.6, 62, 58.2, 53], N);
    curve(p, Bd, bez(65.6, 45.6, 67.6, 54, 65, 62.6, 8), 2.8, 1.4); curve(p, B, bez(65.7, 45.6, 67.4, 54, 65.1, 62.6, 8), 1.9, 0.9); curve(p, Bh, bez(65.9, 47, 66.8, 53, 65.6, 58, 6), 0.5, 0.3);
    seg(p, T, 59.2, 58, 60.6, 65.4, 0.9, 0.6);
    band([[bez(62.8, 47.6, 60.4, 42.6, 53.4, 43.8, 10), 1.2, 2.4], [bez(53.4, 43.8, 50.2, 45, 51.4, 49.4, 8), 2.4, 2.2], [bez(51.4, 49.4, 53.2, 51.4, 56.8, 49.6, 8), 2.2, 1.4], [bez(56.8, 49.6, 58.2, 47.8, 56.2, 47, 6), 1.4, 0.6], [bez(58.6, 43.6, 59.2, 41.6, 58, 40.2, 6), 1.4, 0.4]], '#d4d6e2');
    curve(p, Ws, bez(51.2, 47, 51.6, 50, 54.6, 50.6, 6), 0.7, 0.4); curve(p, Ws, bez(55, 44.8, 59, 44.6, 61.6, 47, 6), 0.7, 0.3);
    mass([44.8, 57.6, 53.6, 57.4, 54.2, 63, 53.6, 67, 54.6, 72, 54, 80, 54.4, 88.2, 50.6, 88.4, 50.4, 80, 49.6, 74, 47.6, 70, 46, 65.6, 44.6, 61.6], K);
    p.poly(T, [51.8, 59.2, 53.6, 58.8, 54, 63, 53.4, 66.4, 51.8, 66.6]); seg(p, Th, 52.6, 59.6, 52.8, 65.6, 0.5);
    p.poly(T, [45.4, 61.4, 47, 61, 48.6, 66, 49, 70.4, 47.8, 70.2, 46.2, 66]); seg(p, Th, 46.2, 61.8, 47.8, 68.4, 0.5);
    seg(p, T, 50.8, 73, 51.2, 83, 1, 0.8); shard(p, W, null, 52.6, 80.4, 3, 1.5, 0.5);
    mass([50.6, 87.6, 54.6, 87.6, 56, 90.6, 57.4, 94.4, 56.8, 96, 50.4, 96, 50, 92.6], Pw); p.poly(Ps, [54.6, 87.6, 56, 90.6, 57.4, 94.4, 56.8, 95.6, 55, 95.6, 54.6, 91]);
    seg(p, Ps, 52.2, 92.4, 52.2, 95.6, 0.4); seg(p, Ps, 53.8, 92.6, 54, 95.6, 0.4);
    claws([[51, 95.8, 1.7], [52.6, 96, 1.6], [54.4, 96, 1.5], [56.2, 95.8, 1.3]]);
    mass([28.4, 57, 36, 57.4, 35.6, 62, 34.6, 66, 34.6, 72, 33.4, 74, 31.6, 75.4, 30.6, 80, 29.8, 86, 25.4, 86, 25.4, 83, 26.4, 79.6, 27.2, 74, 27.4, 69, 28.4, 64], K);
    p.poly(T, [28.6, 59, 30.6, 58.6, 30.6, 66, 29.6, 71, 28, 70.6, 28.2, 64]); seg(p, Th, 29.4, 59.6, 28.8, 68, 0.5);
    seg(p, T, 27.6, 74.6, 26.4, 84, 1, 0.8); seg(p, Nh, 34, 60, 33.4, 72, 0.8); shard(p, W, null, 30.8, 71.4, 4, 1.75, 0.6);
    mass([24.4, 85.6, 29.2, 85.8, 28.8, 89, 27.8, 92, 26, 92.8, 21.2, 92.8, 20.6, 91.6, 22.2, 89.4], Pw); p.poly(Ps, [28.6, 86, 29, 89, 27.8, 92, 26, 92.6, 26.4, 89.6]);
    seg(p, Ps, 23.2, 90.6, 22.6, 92.6, 0.4); seg(p, Ps, 24.8, 90.8, 24.4, 92.6, 0.4);
    claws([[21, 92.6, 2], [22.6, 92.8, 1.9], [24.4, 92.8, 1.8], [26, 92.6, 1.7]]);
    mass([29, 40.4, 33, 39.4, 38, 41, 43, 39.6, 48.6, 38.6, 50.8, 40.4, 50.6, 46, 49.6, 52.4, 47.6, 57.4, 44.4, 60, 36, 60.6, 31, 59.4, 28.8, 52], N);
    mass([49.6, 41.4, 50.4, 44, 46.8, 46, 44.4, 48.6, 41.4, 49.6, 40.8, 47, 43.6, 44, 46.4, 42.4], W); p.poly(Ws, [50.2, 43.6, 46.8, 46, 44.4, 48.6, 41.4, 49.6, 42.6, 48, 45, 45.4]);
    mass([40.8, 39.6, 48.8, 39.4, 49.6, 40.8, 44.6, 42.6, 41.8, 45.6, 40.2, 49, 37.4, 48.8, 37.6, 45.4, 39.2, 42.4], T);
    p.poly(Th, [41.4, 40.2, 48, 40, 44, 41.6, 41, 44.6, 39.4, 47.6, 38.4, 47.4, 38.8, 44.6]); seg(p, Tl, 42, 40.6, 47.4, 40.2, 0.5);
    mass([29.4, 39.8, 32.8, 39.6, 35.6, 43.8, 35.8, 48.6, 35.2, 51.6, 33.6, 48, 31.4, 43.4, 29.6, 42], Th);
    p.poly(Tl, [30.2, 40.2, 32.4, 40.2, 34.6, 43.8, 34.8, 46.6, 33.2, 44]);
    mass([37.2, 53, 40.6, 49.4, 45.2, 48.6, 44.2, 50.8, 41, 51.4], T); seg(p, Th, 38.4, 51.6, 41, 49.8, 0.5);
    glowing(p, E, 0.8, q => q.ell(H, 46.6, 50.4, 2.9, 4.1)); p.ell(Hd, 47.2, 51.4, 2.2, 3); p.ell(H, 46.4, 50.2, 2.1, 3.2); p.ell(Hh, 45.6, 49.2, 1, 1.8);
    p.ell(E, 47.4, 48.6, 1.4, 1.4); p.ell(N, 47.4, 48.6, 0.8, 0.8); curve(p, Hd, bez(45.8, 49.4, 45, 51.6, 46.8, 53.6, 6), 0.7, 0.4);
    glowing(p, E, 0.8, q => q.ell(H, 32.6, 50.8, 2, 3.8)); p.ell(Hh, 32, 49.8, 0.8, 1.6); p.ell(E, 33.2, 49.2, 1, 1); p.ell(N, 33.2, 49.2, 0.5, 0.5);
    mass([29.6, 48.6, 30.8, 50.6, 31.6, 53.4, 33.6, 54.4, 34.8, 57.2, 33.4, 59.8, 32.2, 58.8, 30.6, 59.6, 30.2, 57, 29, 54.4, 29, 51], W); p.poly(Ws, [31.6, 53.4, 33.6, 54.4, 34.8, 57.2, 33.4, 59.8, 32.6, 57]);
    mass([49.4, 51.6, 51.6, 51.4, 53.4, 52.6, 52, 54.4, 49.4, 55.6, 47.6, 57.6, 46.6, 58.4, 45, 56.4, 45.6, 54.6, 47.4, 53.4], W); p.poly(Ws, [52, 54.4, 49.4, 55.6, 47.6, 57.6, 46.6, 58.4, 47.2, 56, 49.6, 54.4]);
    mass([24.2 - u, 4.2 + u * 0.5, 25.8, 6.6, 27.8, 9.8, 29.8, 12.8, 31.6, 16.4, 31, 20.4, 28.4, 18.6, 27, 14, 25.4, 9.4], W);
    p.poly(Ws, [25.2 - u * 0.6, 6 + u * 0.3, 27.8, 9.8, 29.8, 12.8, 30.6, 15, 29, 13.8, 27, 10.6]);
    mass([44.8 + u * 0.4, 3.2 + u * 0.6, 45.8, 6, 46.2, 10.6, 45.6, 15, 44.6, 19, 42, 20.6, 39.6, 18.6, 39.6, 15, 41, 11, 43, 6.8], W);
    p.poly('#3a3e52', [44.8 + u * 0.4, 5.4 + u * 0.6, 45.4, 8.4, 45.2, 13, 44.2, 17.6, 42.6, 19, 42.4, 14, 43.4, 9.6]);
    curve(p, B, bez(44.8, 7.4, 44.6, 12, 43.4, 17, 6), 0.7, 0.4); seg(p, Wh, 43.4, 6.6, 40.6, 14.6, 0.5);
    mass([36, 26, 38.6, 21.6, 40.4, 19.6, 42, 18.6, 44.4, 18.4, 45, 20.4, 46.6, 21.6, 47.4, 24.6, 48.6, 25.8, 49.6, 28, 49.6, 31.4, 50, 35, 49.4, 38.4, 46.6, 38.8, 44, 39.8, 41, 40.4, 38.6, 41.6, 36.4, 43.8, 34, 40.6, 32.4, 40, 31.6, 37.4, 33, 32], Wm);
    tuft(44, 21, 3.2, -1.35, 1); tuft(46.2, 22.8, 3, -0.95, 1); tuft(48.4, 26.6, 2.6, -0.6, 0.9); tuft(49.4, 31.6, 2.2, -0.25, 0.8);
    for (const [x0, y0, cx, cy, x1, y1] of [[41.6, 30.6, 44.6, 31.6, 46.8, 35], [39.4, 33, 42, 34.6, 44.6, 37.6], [36.6, 35.6, 38.6, 36.6, 40.4, 38.8], [43.8, 26.4, 46.2, 27.4, 47.8, 30], [44.6, 33.6, 47, 34.6, 48.6, 37.6]]) curve(p, Ws, bez(x0, y0, cx, cy, x1, y1, 6), 0.7, 0.3);
    seg(p, Wd, 41.6, 21, 42.6, 23.4, 0.4); seg(p, Wd, 42.6, 25.4, 44, 27.4, 0.4); seg(p, Wd, 41, 29.4, 42.6, 30.6, 0.4);
    mass([29.4, 19.6, 33, 19, 36.6, 19.6, 40, 20.2, 40.8, 23, 40.6, 26.6, 39.6, 29.4, 38.2, 31.6, 37, 34, 36.2, 37.2, 35.2, 39, 34.2, 39.8, 33, 39.4, 32.2, 38.2, 31.6, 36.4, 30.6, 34.4, 29.2, 32.6, 28.1, 31.2, 27.6, 29.8, 26.8, 28.4, 27.8, 26.6, 28.2, 24.2], W);
    tuft(28, 27.2, 2, 2.9, 0.8); tuft(28.4, 30.4, 1.8, 2.6, 0.7);
    p.poly(Ws, [37, 30.6, 38.6, 29.6, 39.6, 29.4, 38.2, 31.6, 37, 34, 36.2, 37.2, 35.6, 36.6, 36.4, 33.2]);
    p.poly(Ws, [27.6, 29.8, 28.6, 29.4, 29.8, 31.4, 31.4, 34.4, 32.2, 37, 31.6, 36.4, 30.6, 34.4, 29.2, 32.6, 28.1, 31.2]);
    curve(p, Bl, bez(38.6, 20.6, 40.2, 23, 39.8, 26.4, 6), 0.8, 0.5); seg(p, Wd, 37.2, 33.2, 35.6, 36.4, 0.5);
    mass([31.6, 24.4, 29.4, 24.4, 29.6, 20.6, 27.4, 19.6, 24.6, 18.8, 22, 17.4, 19.4, 15.6, 19, 14.4, 22.6, 13.8, 26.8, 14.2, 29, 15.4, 29.4, 13.6, 30.2, 12.2, 31.2, 13.6, 32.6, 16.2, 32.4, 19.6, 31.6, 22], H);
    p.poly(Hd, [29.4, 20.6, 27.4, 19.6, 24.6, 18.8, 22, 17.4, 19.4, 15.6, 22, 16.4, 24.8, 17.6, 27.6, 18.4, 29.6, 19.4]); seg(p, Hh, 20, 14.4, 28, 14.6, 0.6); seg(p, Hh, 31.6, 15, 31, 23, 0.6);
    mass([36.2, 24, 35.6, 21, 35.2, 17.4, 35.6, 14.2, 36.6, 11.6, 37.6, 13.2, 38.6, 13.6, 40.4, 12.6, 41.8, 12, 41.4, 14.4, 40, 16.4, 38.4, 18.4, 37.4, 20.4, 37.6, 24], H);
    p.poly(Hd, [38.4, 18.4, 40, 16.4, 41.4, 14.4, 41.8, 12, 40.6, 14.6, 38.6, 16, 37.4, 18.4, 37.2, 21, 37.6, 24, 37.4, 20.4]); seg(p, Hh, 36.2, 13.4, 36.2, 21, 0.6);
    p.poly(Ws, [30, 32.4, 31.4, 34.2, 32.4, 36.6, 32, 37.8, 30.8, 35.4]); p.poly(Ws, [36.8, 32.4, 36.4, 35, 35.6, 37, 35.4, 35.6]);
    p.poly(Hd, [29, 25.4, 30.8, 25.8, 33.4, 29.6, 32.4, 30.2]); p.poly(H, [29.4, 25.4, 30.8, 25.6, 33.2, 29.2, 32.6, 29.4, 30.2, 26.6]);
    p.poly(Hd, [39.2, 25, 37.4, 25.4, 34.8, 29.4, 35.8, 30]); p.poly(H, [38.8, 25, 37.4, 25.2, 35, 29, 35.6, 29.2, 38, 26.2]);
    p.poly(Hd, [34, 28.2, 35, 31.2, 36, 33.2, 34.8, 34, 34.2, 36, 33.6, 34, 32.2, 33, 33.2, 31.2]); p.poly(H, [34, 29, 34.7, 31.4, 35.4, 33.1, 34.5, 33.6, 34.1, 35, 33.7, 33.6, 32.8, 33, 33.5, 31.4]);
    p.poly(eye, [28.8, 27.8, 33, 29.4, 32.6, 31.2, 28.8, 29.8]); p.poly(Wh, [30.4, 29, 31.6, 29.6, 31.4, 29.9, 30.4, 29.4]);
    p.poly(eye, [38.8, 27.6, 34.8, 29.4, 35.2, 31.2, 38.8, 29.6]); p.poly(Wh, [37.4, 28.8, 36.4, 29.4, 36.6, 29.7, 37.6, 29.2]);
    seg(p, Bl, 31.2, 31.2, 31.8, 33, 0.6, 0.2); seg(p, Bl, 36.2, 31.4, 35.8, 33.2, 0.6, 0.2);
    glowing(p, E, 0.6, q => q.poly('#30303a', [33.6, 36.2, 35.4, 37.6, 34, 39.6, 32.2, 37.8])); p.poly('#5a5a68', [33.4, 36.8, 34.4, 37.4, 33.4, 37.8]);
  };
  ART.ghound = (p, f) => {
    const { bez, curve, seg, shard, glowing } = G.FOE_KIT;
    const E = '#0e1018', N = '#3a5060', Nh = '#557282', Nd = '#26323e', K = '#161b22', Km = '#2e3c48', T = '#5c9c9c', Th = '#8cc8c2';
    const L = '#aca070', Lh = '#d6ca8c', Ld = '#7c7246', A = '#7c6c40', Ah = '#a89558', Ad = '#54482a', Gl = '#ffe9a0';
    const R = 'rgba(176,160,98,0.86)', Re = '#f4e8a8', Rm = '#d8ca90', Rk = '#8c7e52', eye = f ? '#fffce0' : '#fff2a8', a = f ? 0.06 : 0, b = f ? 0.6 : 0;
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const at = (o, t) => [o[0] + Math.cos(t) * o[2], o[1] + Math.sin(t) * o[3]];
    const arc = (o, t0, t1) => { const out = []; for (let k = 0; k <= 18; k++) out.push(at(o, t0 + (t1 - t0) * k / 18)); return out; };
    const ring = (O, I, parts, dots) => {
      const M = O.map((v, i) => (v + I[i]) / 2);
      for (const [t0, t1] of parts) {
        const outer = arc(O, t0, t1), inner = arc(I, t0, t1);
        p.poly(R, outer.concat(inner.slice().reverse()).flat());
        curve(p, Re, outer, 0.7, 0.7); curve(p, Re, inner, 0.6, 0.6); curve(p, Rm, arc(M, t0, t1), 0.35, 0.35);
        seg(p, Re, ...outer[0], ...inner[0], 0.6); seg(p, Re, ...outer[18], ...inner[18], 0.6);
        for (let t = t0 + 0.3; t < t1 - 0.15; t += 0.5) seg(p, Rm, ...at(O, t), ...at(I, t), 0.35);
      }
      for (const t of dots) { const [x, y] = at(M, t + a); p.ell(Re, x, y, 1.3, 1.3); p.ell(Rk, x, y, 0.8, 0.8); p.ell(Gl, x, y, 0.4, 0.4); }
    };
    mass([47.4, 62.6, 50.4, 63.4, 49.6, 68.6, 48.2, 72.6, 47, 75.4, 46.2, 77.6, 43, 77.6, 44.2, 74, 45.4, 70, 46.2, 66.6], L);
    p.poly(Ld, [49.6, 64, 50.4, 63.4, 49.6, 68.6, 48.2, 72.6, 47, 75.4, 46.2, 77.6, 45.4, 77.6, 46.6, 74, 47.8, 70, 48.8, 66.4]);
    mass([41.4, 76.6, 46.4, 76.4, 46.8, 78.6, 45.6, 80.2, 41.4, 80.4, 40.8, 78.6], Lh); seg(p, Ld, 42.6, 78.6, 42.4, 80.2, 0.35); seg(p, Ld, 44, 78.6, 44, 80.2, 0.35);
    mass([61.4, 56.4, 69.6, 57.4, 69.6, 61.6, 67.6, 66.6, 64.8, 66.6, 62.6, 62], A); p.poly(Ah, [63, 57, 69, 57.8, 68.8, 60.6, 66.4, 65.4, 65.6, 61]); seg(p, Lh, 63.4, 58, 66.6, 65.4, 0.4);
    seg(p, E, 60.4, 56.2, 60.2, 61.2, 1.6, 1.2); seg(p, L, 60.4, 56.6, 60.2, 60.8, 0.9, 0.5);
    mass([71.4, 55.6, 74.8, 56.2, 75.6, 61, 74, 63.6, 71.4, 62.2], Nd);
    shard(p, E, null, 73.2, 58.4, 4, -1.45, 1.1); shard(p, L, Lh, 73.2, 58.4, 3.2, -1.45, 0.7);
    mass([72.6, 61.6, 75.4, 61.2, 77.6, 66, 79.6, 70.6, 81.2, 75, 81.6, 77.6, 78.6, 78, 77.4, 74.6, 75.4, 70, 73.4, 65.6], L);
    p.poly(Ld, [72.6, 61.6, 73.8, 61.4, 75.4, 66, 77.4, 70.6, 79, 75.6, 78.6, 78, 77.4, 74.6, 75.4, 70, 73.4, 65.6]); seg(p, Lh, 75.6, 63, 80, 74.6, 0.5);
    mass([78.2, 77, 81.6, 76.8, 82.8, 79, 83.6, 81.4, 82.6, 82.2, 78.6, 82.2, 78, 80], Lh); seg(p, Ld, 79.6, 80, 79.6, 82, 0.35); seg(p, Ld, 81.2, 80, 81.4, 82, 0.35);
    mass([47, 38.4, 52, 39.4, 57, 42, 63, 43.4, 68.4, 45.4, 71, 49.6, 71, 55, 68.6, 58.4, 62, 58, 56, 58.8, 50, 58.2, 46, 52], Nd);
    curve(p, Km, bez(51, 40.4, 60, 42.6, 68, 46.4, 8), 1.6, 1); curve(p, Ad, bez(55, 46, 60, 50, 66, 49, 8), 0.5, 0.5); curve(p, Ad, bez(56, 52, 61, 55, 67, 53, 8), 0.5, 0.5);
    mass([63.6, 46.4, 68.6, 45.6, 71.8, 50, 72.6, 56, 72, 61.6, 69.6, 63.4, 66.6, 61.4, 64.6, 55], Nd);
    p.poly(T, [67.6, 51.4, 70.4, 50.6, 72, 55, 71.8, 61.2, 69.8, 62.8, 68.2, 61, 67.4, 56]); p.poly(Th, [68.4, 52, 70, 51.4, 71, 54.6, 69, 55.6]); curve(p, Rm, bez(67.6, 52, 67, 57, 69.6, 62.6, 6), 0.4, 0.4);
    mass([45.6, 57.4, 55.6, 57.6, 55.8, 63, 55.2, 69.6, 50.8, 69.8, 49.8, 64], Nd); seg(p, Nh, 54.4, 62.6, 54, 69, 0.6);
    mass([50.6, 69.2, 56, 69, 56.2, 75, 56, 80, 56.8, 86.4, 52.4, 86.6, 52, 80, 51.4, 75], L);
    p.poly(Ld, [50.6, 69.2, 52.4, 69.2, 53, 75, 53.4, 80, 53.6, 86.6, 52.4, 86.6, 52, 80, 51.4, 75]); seg(p, Lh, 54.8, 70, 55, 85, 0.6);
    curve(p, Ld, bez(51.4, 70, 53.4, 72, 52.6, 76, 6), 0.4, 0.3); p.ell(Gl, 54.6, 73.4, 0.4, 0.4); p.ell(Gl, 55, 79.4, 0.4, 0.4);
    mass([52.4, 86, 56.8, 86, 58.4, 89.4, 59.4, 94.6, 58, 95.4, 53, 95.4, 52.4, 92], Lh); p.poly(L, [56.8, 86, 58.4, 89.4, 59.4, 94.6, 58, 95.4, 56.6, 95.4, 56.4, 90]);
    seg(p, Ld, 54.4, 92, 54.4, 95.4, 0.35); seg(p, Ld, 56.2, 92, 56.4, 95.4, 0.35);
    mass([31, 57.6, 37, 58, 36.4, 63, 36, 68.4, 33.6, 69.6, 31, 68.6, 31.4, 63], Nd); seg(p, Nh, 31.8, 62, 31.6, 68, 0.6);
    mass([30.4, 68.4, 35.2, 68.6, 34.6, 73, 33.4, 78, 32.4, 83, 31.2, 86, 29.6, 88, 25, 88.6, 26.6, 85, 28.6, 82, 29.2, 77, 29.6, 72], L);
    p.poly(Ld, [33.6, 68.6, 35.2, 68.6, 34.6, 73, 33.4, 78, 32.4, 83, 31.2, 86, 29.6, 88, 28.4, 88, 30.4, 84, 31.6, 79, 32.6, 73.6]); seg(p, Lh, 30.8, 70, 29, 84, 0.6);
    curve(p, Ld, bez(30.6, 69.6, 32.6, 71.6, 31.6, 75, 6), 0.4, 0.3); p.ell(Gl, 30.6, 75.6, 0.4, 0.4); p.ell(Gl, 29.6, 81, 0.4, 0.4);
    mass([24.6, 87.2, 30, 86.8, 29.6, 90.6, 28.6, 93.2, 23.4, 93.4, 22, 92, 22.8, 89.6], Lh); p.poly(L, [28.6, 87, 30, 86.8, 29.6, 90.6, 28.6, 93.2, 27.4, 93.2, 28, 90]);
    seg(p, Ld, 24.4, 91, 23.8, 93.4, 0.35); seg(p, Ld, 26, 91, 25.8, 93.4, 0.35);
    mass([31.6, 37, 40, 37.4, 46, 36.6, 50.4, 38.4, 53.2, 42, 53, 50, 50, 56, 44, 59.4, 36, 59.6, 31.4, 56, 30.8, 46], K);
    p.poly(Nd, [33, 38, 39.6, 38.4, 41, 44, 38, 48, 34, 46]);
    for (const [x, y] of [[41, 43], [42, 42.4], [43, 41.8], [44, 41.2], [45, 40.6]]) p.ell(Rm, x, y, 0.45, 0.4);
    curve(p, Ad, bez(36, 38, 38, 42, 37.4, 46, 6), 0.4, 0.4); curve(p, Ad, bez(46, 37, 48.6, 41, 47.6, 44, 6), 0.4, 0.4);
    mass([50, 39.6, 52.8, 41, 53.4, 46.4, 51.8, 47.8, 50, 45], T); p.poly(Th, [50.6, 40.6, 52.2, 41.6, 52.4, 43.6, 50.8, 43]);
    mass([31.4, 44.8, 34.6, 42, 38.6, 41.6, 40.6, 44.4, 41.4, 46.4, 44, 44, 48.4, 43.6, 50.6, 46, 50, 50.4, 47.4, 53.6, 43.6, 54.6, 40.6, 53.8, 39, 55.4, 36.2, 55.8, 33, 55.2, 31.2, 51], A);
    p.poly(Ah, [32.2, 45, 34.8, 43, 38.2, 42.6, 39.6, 44.4, 36.4, 44.6, 33.6, 46.6]); p.poly(Ah, [42, 46.4, 44.2, 44.8, 48.2, 44.4, 49.8, 46, 46, 45.6, 43.4, 47.4]);
    p.poly(T, [33.2, 48, 35.6, 46.8, 37.4, 48.6, 36.6, 52, 34, 52.6]); p.poly(Th, [33.8, 48, 35.4, 47.4, 36, 48.6, 34.4, 49.4]);
    p.poly(T, [43, 47.2, 46.6, 46, 49, 47, 47.8, 50, 44.4, 50.6]); p.poly(Th, [43.8, 47.2, 46.4, 46.6, 47, 47.6, 44.6, 48.4]); seg(p, Ad, 40.4, 45.4, 40.2, 53.4, 0.7);
    mass([41, 19.4, 45, 19.6, 48.6, 21.4, 50.4, 24, 52, 27.4, 51.4, 30.6, 49.6, 33.4, 46.8, 35.4, 43, 34, 41, 30], K);
    for (const [x, y, l, t] of [[46, 22.4, 4, -0.62], [48.6, 24.6, 4.4, -0.34], [50, 28, 3.8, -0.02], [49.4, 31, 3.6, 0.3], [47.6, 33.4, 3.4, 0.62]]) { shard(p, E, null, x, y, l + 1, t, 1.6); shard(p, K, Km, x, y, l, t, 1.1); }
    curve(p, Km, bez(43, 23, 46, 25, 49, 26, 6), 0.5, 0.3); curve(p, Km, bez(43.4, 27, 46.4, 29, 49.6, 29.4, 6), 0.5, 0.3);
    mass([40.4, 31, 44, 30.6, 46.6, 32.4, 46.4, 35.6, 43.6, 37.2, 41, 36.4, 40.2, 33.6], T); p.poly(Th, [41.2, 31.6, 43.8, 31.4, 45, 32.8, 42.6, 33.6]);
    for (const y of [35.8, 37, 38.2]) p.ell(Rm, 45, y, 0.4, 0.4);
    mass([26.6, 4.6, 28.6, 7.6, 31.6, 11.6, 34, 15.6, 34.8, 19, 32.6, 19.4, 31, 15.4, 28.2, 9.4], K); seg(p, Km, 27.8, 7, 32.4, 16, 0.5);
    mass([46.9, 3.2, 47.8, 6.6, 47.8, 11, 47.2, 15, 45.4, 15.6, 45.6, 10.6, 46.2, 6.6], K); seg(p, Ld, 47, 5.6, 46.8, 13.4, 0.6, 0.4);
    mass([30.4, 21, 30, 24.6, 29.4, 27, 29.8, 29.4, 30.6, 31.4, 31.6, 33.2, 32.6, 35.2, 33.2, 37.2, 34.2, 39, 36, 39.8, 38, 39.2, 39.2, 37.4, 39.8, 35, 40.6, 33, 41.6, 31, 42.4, 28, 42.8, 25, 42.4, 21.4, 40, 19.6, 36, 19, 32.6, 19.4], N);
    p.poly(Nh, [35.8, 25, 37.4, 25, 37.8, 30, 37.6, 34.6, 36.6, 36.4, 36, 33, 35.8, 28]);
    p.poly(Nd, [30, 24.6, 31.6, 24, 32, 28.6, 33.4, 33.4, 34.2, 37.6, 33.2, 37.2, 32.6, 35.2, 31.6, 33.2, 30.6, 31.4, 29.8, 29.4, 29.4, 27]);
    seg(p, L, 34.6, 21, 35.4, 34.6, 1, 0.7); seg(p, L, 31.6, 30.8, 32.8, 34.6, 0.7, 0.5); seg(p, L, 39.8, 30.2, 39.6, 33.2, 0.6, 0.4);
    seg(p, E, 30, 27.6, 33.8, 28.6, 0.9, 0.6); seg(p, E, 36.6, 28.2, 40.4, 26.8, 0.6, 0.9);
    p.poly(eye, [30.2, 28.4, 33.8, 29.6, 33.4, 31.2, 30.2, 30]); p.poly(eye, [36.6, 29.6, 40.2, 28, 40.4, 29.6, 37, 31]);
    glowing(p, E, 0.6, q => q.ell('#26303a', 36.4, 38.2, 2.2, 1.5)); p.ell('#4a5a66', 35.8, 37.6, 0.8, 0.4);
    ring([36.4, 14.6 + b, 10.4, 9.6], [36.8, 14.7 + b, 6.4, 5], [[-1.7, 1.85], [1.92, 3.75]], [-1.3, 0.56, -0.14]);
    ring([42.1, 39.6, 25.6, 19.2], [41.2, 39.4, 19.2, 14.6], [[-0.92, -0.66], [-0.62, -0.28], [-0.24, 1.58], [1.63, 2.8], [2.86, 4]], [0.11, 2.32, 3.71]);
  };
  ART.danshu = (p, f) => {
    const { bez, curve, seg, leaf, glowing } = G.FOE_KIT;
    const E = '#100c12', Sk = '#fcd8cc', Skh = '#fff0e6', Sks = '#e8b4a8', Hr = '#d8cca8', Hrh = '#f0e6c8', Hrs = '#a8906c', Hrd = '#6c5a44';
    const Bb = '#1e5cb0', Bc = '#34b4ec', Au = '#e2b44a', Auh = '#fce49c', Aud = '#9c6c24';
    const D = '#2e2a32', Dh = '#46404c', Dt = '#3c7a80', Sc = '#183c54', Sch = '#2a7286', Scd = '#0c2234', Lv = '#2a2418';
    const Y = '#e4b448', Yh = '#fce8a4', Ys = '#b88a34', St = '#a8906c', Sth = '#d8c8a0', Stt = '#2e7c80';
    const w = f ? 0.8 : 0;
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const tube = (pts, ws, col) => { for (const [c, d] of [[E, 1.4], [col, 0]]) { for (let i = 0; i + 3 < pts.length; i += 2) seg(p, c, pts[i], pts[i + 1], pts[i + 2], pts[i + 3], ws[i / 2] + d, ws[i / 2 + 1] + d); for (let i = 2; i + 2 < pts.length; i += 2) p.ell(c, pts[i], pts[i + 1], (ws[i / 2] + d) / 2, (ws[i / 2] + d) / 2); } };
    const petals = list => { for (const [x0, y0, x1, y1, wd] of list) leaf(p, E, x0, y0, x1, y1, wd + 0.7, wd + 0.7); for (const [x0, y0, x1, y1, wd] of list) { leaf(p, Bb, x0, y0, x1, y1, wd, wd); leaf(p, Bc, x0, y0, x1, y1, wd * 0.7, 0); seg(p, Au, x0, y0, x0 + (x1 - x0) * 0.8, y0 + (y1 - y0) * 0.8, 0.35); } };
    const blade = (x0, y0, x1, y1, wd, a, b) => { leaf(p, E, x0, y0, x1, y1, wd + 0.7, wd + 0.7); leaf(p, a, x0, y0, x1, y1, wd, wd); leaf(p, b, x0, y0, x1, y1, wd, 0); };
    const hooks = list => {
      const shapes = list.map(([x0, y0, cx, cy, x1, y1, wd, a, b]) => {
        const c = bez(x0, y0, cx, cy, x1, y1, 12), A = [], B = [];
        for (let i = 0; i < c.length; i++) { const q0 = c[Math.max(0, i - 1)], q1 = c[Math.min(c.length - 1, i + 1)], dx = q1[0] - q0[0], dy = q1[1] - q0[1], l = Math.hypot(dx, dy) || 1, k = wd * Math.pow(1 - i / (c.length - 1), 0.45); A.push(c[i][0] - dy / l * k, c[i][1] + dx / l * k); B.unshift(c[i][0] + dy / l * k, c[i][1] - dx / l * k); }
        return [A.concat(B), A.concat(c.slice().reverse().flat()), a, b];
      });
      for (const [all] of shapes) glowing(p, E, 0.8, q => q.poly(E, all));
      for (const [all, half, a, b] of shapes) { p.poly(a, all); p.poly(b, half); }
    };
    const strip = (x0, y0, x1, y1, wd) => { blade(x0, y0, x1 + w, y1 + w * 0.5, wd, Ys, Y); leaf(p, Yh, x0, y0, x1 + w, y1 + w * 0.5, wd * 0.6, 0); };
    mass([57, 36.6, 61, 37.6, 64, 41.4, 68, 44, 74, 44.6, 80, 45, 86, 45.4, 92, 45.6 - w * 0.6, 98.6 + w, 45 - w, 95.6, 47.4, 98.4 + w, 50.4, 94, 50.4, 97.4 + w, 53.6, 90, 52.2, 84, 50.8, 78, 50, 72, 49.6, 66, 48.8, 62, 46.2, 58.6, 43], Sc);
    p.poly(Sch, [62, 39.6, 65.4, 42.6, 70, 44.4, 78, 45, 86, 45.6, 80, 46.6, 72, 46.4, 66, 45.2]); p.poly(Scd, [66, 48.8, 72, 49.6, 78, 50, 84, 50.8, 90, 52.2, 86, 50, 78, 48.6, 70, 48]);
    curve(p, Sch, bez(70, 47.4, 82, 47.4, 94, 48.8, 10), 0.6, 0.4);
    blade(53.6, 9.6, 59.4, 8.4 - w * 0.4, 1.3, Lv, '#4a4232'); blade(53.8, 15, 58, 13.4, 1.2, Lv, '#4a4232'); blade(53.4, 17.4, 56.6, 19.6, 1.1, Lv, '#4a4232'); blade(41.4, 10.4, 37.6, 11.8, 1, Lv, '#4a4232');
    tube([16, 39.4, 26, 47.6, 38.6, 60.6], [2.2, 2.2, 2], '#1c1c22'); seg(p, '#3c3c46', 16.8, 39.8, 37.6, 59.6, 0.6);
    mass([6.2, 9.6 - w * 0.5, 8.6, 11.4, 10.4, 14, 11.8, 17.4, 13, 21, 14.4, 24.6, 15.4, 27.4, 17.4, 26.6, 17.2, 29.4, 16.4, 31.6, 17, 34.4, 17.4, 37.2, 15, 38.4, 12.8, 37.6, 9.4, 38.6, 10.6, 36.4, 7.4, 36, 4.2, 35.2 + w * 0.4, 6.6, 33.4, 9.8, 32.4, 7, 31, 4.4, 28.4, 3, 24.6 - w * 0.4, 5.6, 25.2, 8.4, 26.8, 9.6, 24.4, 8.2, 20.6, 6.6, 17.2, 4.6, 14.2, 3.2, 12.2 - w * 0.4, 4.4, 11], St);
    p.poly(Stt, [8.6, 12.6, 10.6, 15.4, 12.2, 19.6, 13.6, 24, 14.8, 29, 15.6, 34, 14.4, 34.4, 13.2, 29, 11.8, 24, 10.4, 19.4, 9, 15.6]); p.poly(Stt, [9.6, 30.4, 6.4, 29.4, 4.2, 26.6, 6.2, 27.8, 9.4, 28.6]); p.poly(Stt, [10.6, 36.4, 7.4, 36, 5.6, 35, 8, 35.2, 11.2, 35.4]);
    p.poly(Sth, [6.2, 9.6 - w * 0.5, 4.4, 11, 3.2, 12.2 - w * 0.4, 4.6, 14.2, 6.6, 17.2, 8.2, 20.6, 8.8, 18.6, 7.4, 14.6]); curve(p, Sth, bez(7.6, 27, 5, 26, 3.8, 25, 6), 0.6, 0.3);
    curve(p, Hrd, bez(9.8, 32.4, 11.6, 31.6, 13.6, 31.4, 6), 0.6, 0.4); curve(p, Hrd, bez(8.4, 26.8, 10.4, 26.6, 12.6, 27.4, 6), 0.6, 0.4); curve(p, Hrd, bez(10.6, 36.4, 12.4, 35.4, 14.4, 35.6, 6), 0.5, 0.4);
    mass([14.4, 36.6, 18, 36.4, 18.6, 39.4, 16, 40.8, 13.8, 39.4], Au); p.poly(Auh, [14.8, 37, 17.4, 36.8, 16, 38.4]);
    mass([43.6, 56.6, 48.8, 56.6, 49.8, 64, 49.8, 72, 49.4, 80, 49.8, 88, 49.4, 90.6, 45.8, 90.6, 45.4, 86, 45, 78, 44.6, 70, 44, 63], D);
    p.poly(Dh, [46.8, 58, 48.6, 58, 49, 66, 48.4, 76, 48.6, 86, 47.6, 88, 47.4, 78, 47.6, 66]); curve(p, Dt, bez(48.4, 62, 49.4, 74, 48, 86, 10), 0.6, 0.4);
    mass([50, 75, 53.4, 74.2, 55.4, 76.6, 55.8, 80.6, 54.8, 84, 52.6, 84.8, 51.4, 80.6, 50, 78], Sk); p.poly(Sks, [50, 75, 51.6, 74.6, 52.4, 78.4, 51.4, 80.6, 50, 78]); seg(p, Sks, 52.6, 82.6, 54.4, 82.6, 0.4);
    mass([45, 89.4, 49.6, 89.4, 50.6, 92, 49.8, 95.4, 46.8, 96.4, 44.6, 94.8, 44.4, 92], Sk); p.poly(Sks, [48.4, 89.6, 49.6, 89.4, 50.6, 92, 49.8, 95.4, 48.4, 95.6, 49, 92.4]); seg(p, Sks, 45.6, 95, 48.4, 95.4, 0.4);
    mass([35.6, 56.4, 43.6, 56.4, 44.4, 62, 44, 68, 43.2, 72.4, 41, 74, 38.6, 73.2, 36.4, 68.4, 35.2, 62], Sk);
    p.poly(Skh, [36.6, 58, 39, 57.6, 38.6, 64, 37.6, 68, 36.4, 64]); p.poly(Sks, [42.4, 58, 44.4, 62, 44, 68, 43.2, 72.4, 41, 74, 42, 68, 42.2, 62]);
    for (const [x0, y0, x1, y1, wd] of [[53.2, 58, 66.4, 60.6, 2.4], [53.6, 59.6, 78, 67, 3.2], [54.4, 61.6, 90.4, 86, 3.4], [55, 61, 86.4, 73.4, 3.6], [54.6, 63, 82.4, 82.4, 2.6]]) strip(x0, y0, x1, y1, wd);
    mass([35.2, 42, 39.4, 40.4, 41.2, 50, 40.6, 58, 39.2, 61.4, 37, 58.6, 35.8, 50], Sc); p.poly(Sch, [36, 42.6, 38, 42, 38.6, 50, 37.8, 56, 36.4, 50]); curve(p, Au, bez(39.2, 41.2, 41, 50, 39.6, 60.6, 8), 0.5, 0.4);
    mass([39.8, 33.4, 43.6, 32.8, 46.4, 36.4, 49.4, 33, 53.4, 33.6, 54.4, 38, 52.4, 42.6, 53, 47, 55.4, 53, 55, 57.6, 48.8, 58.4, 43.6, 62.4, 40.6, 59.4, 37.6, 56.6, 37.6, 50, 40, 44, 40.6, 38.6], D);
    p.poly(Dh, [40.8, 36, 43.6, 37.4, 42.4, 46, 40.4, 55, 39, 48]); curve(p, Dt, bez(41.6, 37.4, 40.8, 46, 41.6, 56, 8), 0.6, 0.4); curve(p, Dt, bez(52.6, 37.4, 54.2, 46, 54, 56, 8), 0.5, 0.4);
    glowing(p, E, 0.5, q => q.poly(Sk, [46.2, 39.6, 48.8, 39.8, 49.4, 42.6, 48.8, 44.8, 47, 44.4, 46, 42])); p.poly(Skh, [46.6, 40.2, 48, 40.4, 47.4, 42.6]);
    mass([48.6, 44, 51.2, 42.8, 52.8, 44.6, 54.6, 50, 57, 55.6, 58, 61.4, 52, 62.4, 47.8, 60.4, 47.4, 52], Y);
    p.poly(Yh, [49.2, 44.8, 50.8, 44.2, 50, 52, 49.4, 60, 48.2, 59.4, 48, 52]); p.poly(Ys, [52.6, 44.6, 54.6, 50, 57, 55.6, 58, 61.4, 55.4, 61.6, 54.6, 52]); curve(p, Aud, bez(51.2, 44, 52.2, 52, 52, 61.4, 8), 0.5, 0.4);
    curve(p, Au, bez(37.8, 56.8, 40.6, 59.6, 43.6, 62, 6), 0.7, 0.6);
    tube([38.6, 36.4, 32.6, 42.2, 25.8, 45.2], [2.6, 2.4, 2.2], D); curve(p, Dt, bez(38, 36, 33.6, 40.4, 26.4, 44, 8), 0.5, 0.4);
    glowing(p, E, 0.6, q => q.ell(Sk, 23.4, 45.4, 2.2, 1.8)); p.ell(Skh, 22.8, 44.8, 0.9, 0.6); seg(p, Sks, 22.2, 46.4, 24.6, 46.6, 0.4);
    tube([52.6, 34.6, 54.4, 40.2, 58.2, 42.4], [2.6, 2.4, 2.2], D); seg(p, Dt, 53, 35.2, 54.6, 39.6, 0.5);
    glowing(p, E, 0.6, q => { q.ell(Sk, 59.8, 42.6, 1.6, 1.4); for (const [x, y] of [[62.6, 41.4], [62.8, 42.6], [62.4, 43.8]]) seg(q, Sk, 60.4, 42.6, x, y, 0.8); });
    mass([42.6, 26, 49.6, 25.8, 53.4, 27.6, 54.4, 31, 51, 32.6, 47.6, 36.4, 45.6, 36.6, 42.6, 32.4, 38.6, 30.4, 39, 27.6], Sk);
    p.poly(Skh, [43.4, 27, 46.4, 26.8, 45.6, 30, 43.6, 31]); p.poly(Sks, [49.4, 26.6, 53.4, 27.6, 54.4, 31, 51, 32.4, 50.6, 29]); curve(p, Sks, bez(46.6, 32.6, 46.8, 34.6, 46.6, 36.4, 6), 0.6, 0.4);
    petals([[39.4, 31.4, 35.8, 27.4, 1.5], [41, 32.8, 35.8, 31.8, 1.5], [42.4, 34.4, 38.4, 37, 1.3], [41.6, 32.6, 40.8, 28.6, 1.2], [53, 32.4, 56, 28, 1.5], [54.2, 33.8, 58.6, 32.6, 1.5], [53.8, 35.4, 57.2, 38.8, 1.3], [51.6, 32.8, 51.8, 29.4, 1.1]]);
    glowing(p, E, 0.7, q => { q.poly(Bb, [38.4, 30.4, 42.6, 31.8, 45.8, 35.8, 44.6, 37.6, 40.4, 37, 38, 34.6]); q.poly(Bb, [47.6, 36.2, 50.8, 32.6, 54.6, 31.4, 55.8, 34.6, 53.2, 37.6, 49, 37.8]); });
    p.poly(Bc, [38.8, 30.8, 42.6, 32, 44.6, 34.8, 41.6, 33.4, 39, 32.4]); p.poly(Bc, [48.6, 35.6, 50.8, 33, 54.2, 31.8, 51.6, 33.8]);
    curve(p, Au, bez(38.4, 30.4, 43, 31.4, 45.8, 35.8, 8), 0.6, 0.5); curve(p, Au, bez(47.6, 36.2, 50.8, 32.4, 54.6, 31.4, 8), 0.6, 0.5);
    glowing(p, E, 0.5, q => q.poly(Sk, [44.8, 22, 48.6, 22, 48.8, 26.4, 44.8, 26.6])); p.poly(Sks, [44.8, 23.2, 48.6, 23.4, 48.6, 25, 44.8, 25]); seg(p, '#5a4a5a', 44.8, 25.4, 48.6, 25.2, 0.45);
    mass([44.6, 4.4, 47.4, 2.8, 51, 3, 53.4, 5, 53.2, 8.6, 50.4, 10.4, 46.4, 10, 44.2, 7.6], Hr); p.poly(Hrh, [45.6, 4.4, 47.6, 3.4, 50.6, 3.6, 49, 5.6, 46.4, 6.6]); curve(p, Hrs, bez(46, 8, 49, 5, 52.4, 6.4, 8), 0.6, 0.4); curve(p, Hrs, bez(47, 9.4, 50, 7.4, 52.8, 8.6, 8), 0.5, 0.4);
    mass([39.4, 13.6, 42, 10.8, 46.4, 9.6, 51, 10.2, 54, 12.4, 55.4, 16, 55, 20.4, 53.6, 24.4, 51.6, 26, 49, 25.4, 44, 25.4, 40.4, 25, 38.6, 20.4], Hr);
    glowing(p, E, 0.5, q => q.poly(Sk, [41.8, 16.4, 44.6, 18, 47, 19.2, 49.8, 19.8, 50.4, 22, 49.4, 24.2, 47, 25.2, 44.4, 24.8, 42.6, 23.2, 42, 20]));
    p.poly(Sks, [42, 16.6, 43.4, 17.4, 43.2, 21.6, 44.4, 24.6, 42.6, 23.2, 42, 20]); p.poly(Skh, [45.4, 19.4, 48, 20, 47, 21.6, 45.4, 21]); seg(p, '#c87c74', 45.8, 23.2, 47.2, 23.4, 0.5);
    p.poly(Hr, [39.4, 13.6, 42.4, 12.6, 43.2, 16.6, 42.6, 21, 42.6, 25.2, 40.4, 25, 38.6, 20.4]); p.poly(Hrs, [41.4, 16, 42.8, 16.6, 42.4, 21, 42.6, 25.2, 41.4, 25]);
    p.poly(Hr, [50.6, 17, 53.4, 14.6, 55.4, 16, 55, 20.4, 53.6, 24.4, 51.6, 26, 49.8, 25, 50.6, 22]); p.poly(Hrs, [51.6, 18.6, 54, 16.6, 54.6, 20, 53.2, 24, 51.6, 25.4, 50.6, 24.8, 51.4, 22]);
    p.poly(Hr, [41.8, 13, 46.4, 11.4, 51.6, 12.2, 53.4, 14.6, 50.6, 17.4, 49.8, 19.8, 47, 19.2, 44.6, 18, 41.8, 16.4]); p.poly(Hrh, [41.4, 13.2, 44, 11.2, 48.6, 10.6, 46, 12.8, 42.6, 15.4]);
    curve(p, Hrd, bez(41.8, 16.4, 45.8, 18.8, 49.8, 19.8, 10), 0.9, 0.6); curve(p, Hrs, bez(42.4, 14.6, 46.6, 14, 52, 15.4, 10), 0.6, 0.4); curve(p, Hrs, bez(43, 12.6, 47, 12.4, 51, 13.4, 10), 0.5, 0.4);
    petals([[45.6, 8.4, 42.2, 3.4 - w * 0.4, 1.7], [45, 9.6, 40.4, 9 - w * 0.3, 1.6], [46.6, 8.2, 45.6, 3.4, 1.3], [52.4, 7.6, 55, 4.4 - w * 0.4, 1.5], [52.6, 8.8, 56, 9.2, 1.3]]);
    petals([[54.6, 15.8, 57, 14, 1.1], [54.2, 17.2, 56.6, 18, 1]]);
  };
  ART.ape = (p, f) => {
    const { bez, curve, seg, shard, leaf, glowing, ringBand } = G.FOE_KIT;
    const E = '#0e0c24', Pm = '#3a3c88', P = '#4a4aa2', Ph = '#6262bc', Pl = '#8c8cd8', Pd = '#2e3072', Pk = '#1c1c4a', St = '#c4c6fa';
    const Wc = '#a4a6c8', Wh = '#c8cae2', Wd = '#7e80a6', Wf = '#9ea0ae', Wfh = '#c4c6d0';
    const Gd = '#a8985c', Gh = '#d4c688', Gl = '#f0e6b0', Gk = '#706238', Y = f ? '#fffde0' : '#f8f0a8', Ye = '#e2d270', o = f ? -0.8 : 0;
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts)), thin = (pts, col) => glowing(p, E, 0.5, q => q.poly(col, pts));
    const shrink = (pts, k) => { let cx = 0, cy = 0; for (let i = 0; i < pts.length; i += 2) { cx += pts[i]; cy += pts[i + 1]; } cx /= pts.length / 2; cy /= pts.length / 2; return pts.map((v, i) => i % 2 ? cy + (v - cy) * k : cx + (v - cx) * k); };
    const petal = (outer, glow) => { mass(outer, Gd); p.poly(Gh, shrink(outer, 0.88)); p.poly(Gd, shrink(glow, 1.12)); p.poly(Ye, glow); p.poly(Y, shrink(glow, 0.78)); };
    const scroll = (x0, y0, cx, cy, x1, y1) => { curve(p, E, bez(x0, y0, cx, cy, x1, y1, 8), 2.4, 1.8); curve(p, Gd, bez(x0, y0, cx, cy, x1, y1, 8), 1.4, 0.9); p.ell(E, x1, y1, 1.6, 1.6); p.ell(Gh, x1, y1, 1, 1); };
    const spike = (x0, y0, x1, y1, w, col = P) => { glowing(p, E, 0.7, q => leaf(q, col, x0, y0, x1, y1, w, w)); seg(p, Pl, x0, y0, x0 + (x1 - x0) * 0.7, y0 + (y1 - y0) * 0.7, 0.5, 0.3); };
    const lock = list => { for (const [x, y, len, a] of list) { const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len; leaf(p, Pd, x + 0.3, y + 0.5, x1 + 0.3, y1 + 0.5, 0.9, 0.9); leaf(p, Ph, x, y, x1, y1, 0.8, 0.8); } };
    const claw = (x, y, len, a, w) => { shard(p, E, null, x, y, len + 1, a, w + 0.7); shard(p, Gh, Gl, x, y, len, a, w); };
    const lotus = (x, y) => { const L = [[2.3, 2.8], [0.84, 2.8], [-2.9, 3.6], [-0.24, 3.6], [-2.3, 4.2], [-0.84, 4.2], [-1.57, 4.8]]; for (const [a, l] of L) shard(p, E, null, x, y, l + 1, a, 2.2); for (const [a, l] of L) shard(p, Gd, Gh, x, y, l, a, 1.5); p.ell(E, x, y + 0.2, 2, 1.6); p.ell(Gh, x, y, 1.5, 1.1); p.ell(Gd, x + 0.4, y + 0.4, 0.7, 0.5); };
    const at = (O, t) => [O[0] + Math.cos(t) * O[2], O[1] + Math.sin(t) * O[3]];
    const band = (O, I, t0, t1) => { const a = [], b = []; for (let k = 0; k <= 24; k++) { const t = t0 + (t1 - t0) * k / 24; a.push(...at(O, t)); b.unshift(...at(I, t)); } return a.concat(b); };
    petal([57.6, 33.6, 58.6, 28.6, 61, 24.6, 64.6, 21.8, 69.4, 20.4, 75, 20.2, 81.6, 20.4, 79.6, 24, 76.6, 28, 72.6, 31.4, 67, 33.6, 61.6, 34.4], [61.6, 31.6, 63, 27.6, 66, 24.4, 70.4, 22.6, 76.4, 22.4, 74.6, 25.6, 71.4, 28.6, 66.6, 31, 63, 31.8]);
    shard(p, E, null, 65.6, 22, 9.4, -1.47, 2); shard(p, Gd, Gh, 65.6, 22, 8.4, -1.47, 1.4);
    scroll(56, 23, 62.4, 22, 62, 15.4); scroll(45, 26.4, 39, 25, 40.6, 18.6);
    petal([34, 27.6, 37.6, 25.6, 42, 25.4, 45.6, 27, 44.6, 30.6, 41, 32.6, 36.6, 31.6], [36.4, 28.4, 39.6, 27, 43.4, 27.6, 42.6, 29.8, 39.4, 31, 36.8, 30.4]);
    petal([49, 3.4, 51.4, 8, 54.4, 12.6, 57, 17.2, 57.4, 22, 55.4, 26.4, 52, 29.4, 48.6, 29.6, 45.4, 27, 43.4, 23, 43.8, 18.4, 45.6, 14, 47.6, 9.4], [49, 11.4, 52.4, 15.6, 54.6, 20, 53.6, 24.4, 50.4, 27.2, 47.4, 25.4, 45.8, 21.2, 46.6, 16]);
    curve(p, Gd, bez(46.4, 21.6, 50, 28, 53.8, 21.4, 8), 0.6, 0.6);
    for (const [x0, y0, x1, y1, w, c] of [[31.4, 52, 26.4, 43.4, 2.4, Pd], [32.6, 50, 33.4, 25.4, 3.2, Pm], [36.6, 46, 38, 29.4, 2.6, P], [53.4, 48, 55.4, 26.6, 3, Pm], [55.4, 47.4, 62.6, 33, 3, P], [58, 49.4, 67.4, 40.4, 2.8, Pm], [60, 51.6, 70.6, 47.6, 2.4, Pd]]) spike(x0, y0, x1, y1, w, c);
    spike(25, 62, 18.6, 52.4, 2.6); spike(26, 63.6, 16.2, 62.6, 2.4); spike(74.6, 60, 79.2, 50.2, 2.6); spike(76, 63.6, 82.2, 60, 2.2); spike(77, 66.4, 82.8, 64.8, 2);
    for (const [x0, y0, x1, y1, w] of [[30.4, 53, 26.6, 45.4, 2.2], [34, 50.6, 33, 43.6, 2], [65.6, 50.6, 68.4, 43.6, 2], [69, 53, 74.4, 46.6, 2.2]]) spike(x0, y0, x1, y1, w, Ph);
    mass([28.4, 50, 33, 46, 40, 44.4, 50, 44.4, 58, 44, 66, 45.6, 70.6, 49, 72.4, 54, 73.6, 62, 66, 64, 56, 62.4, 46, 62.6, 36, 62.6, 26.6, 62, 25.4, 56], Pm); p.poly(Pd, [35, 46.4, 40, 44.6, 50, 44.6, 57, 44.4, 59.4, 48.4, 53, 50.6, 44, 50.8, 37, 49.2]);
    p.poly(Pd, [66, 45.6, 70.6, 49, 72.4, 54, 73.6, 62, 66, 64, 66.4, 56]); curve(p, Ph, bez(29.6, 51, 33, 47.6, 38, 46.4, 6), 1.2, 0.6); lock([[58, 49, 4, -1.2], [62, 50, 4, -0.9], [66, 51.4, 3.6, -0.6], [29.4, 53.4, 3.6, -2.4], [32.6, 51, 3.4, -2]]);
    ringBand(p, E, 70.6, 41.2 + o, 5.2, 5.2, 3.8, 0, 6.3); ringBand(p, Gd, 70.6, 41.2 + o, 4.4, 4.4, 2.2, 0, 6.3); ringBand(p, Gh, 70.4, 40.8 + o, 4.2, 4.2, 1, 3.4, 5.6);
    shard(p, E, null, 73.4, 37.8 + o, 10, -0.78, 1.7); shard(p, Gd, Gh, 73.4, 37.8 + o, 9, -0.78, 1.1);
    for (const t of [-2.2, -1.2, -0.2]) shard(p, Gh, null, 74.6, 36.6 + o, 2, t, 0.7);
    mass([36.4, 64, 44, 63.6, 48.6, 67.6, 49.2, 75.6, 47, 81, 42, 83, 37.4, 81, 35.6, 74], Pk); curve(p, Pd, bez(39, 66, 44, 68, 46.4, 76, 6), 1.2, 0.6);
    mass([33.4, 82.4, 38, 81.4, 43.4, 82.2, 45.2, 85, 43.6, 87.6, 40.2, 88.6, 39.6, 92, 35.6, 93.6, 31.2, 93.2, 31.4, 90, 33.2, 86], Wf);
    p.poly(Wfh, [33.8, 83, 38, 82.2, 42.6, 82.8, 43.8, 84.6, 39.4, 84.8, 35.4, 85.6]); seg(p, Wd, 33.6, 90.4, 33.4, 93.2, 0.4); seg(p, Wd, 36, 90.6, 36, 93.4, 0.4); seg(p, Wd, 41, 86.4, 42.4, 88, 0.4);
    mass([54.6, 82.6, 59.6, 82.4, 60.4, 86, 60, 92.6, 57.6, 93.6, 54.6, 92.4, 54.4, 87], Wf); p.poly(Wfh, [55.2, 83.2, 58.8, 83, 59.2, 85.4, 55.4, 86]); seg(p, Wd, 56.4, 90, 56.4, 93.2, 0.4);
    mass([36, 60, 64, 60, 64.4, 70, 58, 74, 50, 74.4, 40, 72.6, 36.4, 66], Pk);
    mass([36, 50, 41.4, 49.6, 44, 56, 48, 58, 53, 57.6, 55.4, 50, 60, 50, 61, 55, 66.4, 58.6, 66, 63, 63, 66.6, 57.4, 70.4, 50, 71, 44.6, 68.6, 41, 63.4, 34, 63, 30.4, 60.4, 32.6, 57.2, 36.6, 55], Wc);
    p.poly(Wh, [31.6, 59, 36, 57.4, 40, 58.6, 39.6, 60.6, 35, 60.4]); p.poly(Wh, [57, 59, 61.4, 58, 65.4, 59.4, 62, 60.8, 58, 60.6]);
    curve(p, Wd, bez(33, 61, 37, 63, 41, 61.6, 6), 0.5, 0.4); curve(p, Wd, bez(57, 62.4, 61, 63.6, 65.4, 61, 6), 0.5, 0.4); curve(p, Wd, bez(50.4, 62.6, 50.6, 66, 50.2, 70, 6), 0.5, 0.4);
    seg(p, Wd, 46.4, 64.6, 50, 65, 0.4); seg(p, Wd, 51, 65, 55, 64.4, 0.4); seg(p, Wd, 47, 67.6, 50, 68, 0.4); seg(p, Wd, 51, 68, 54.6, 67.4, 0.4);
    mass([24, 54.4, 30, 50.6, 35, 52, 37.4, 58, 36, 64, 31, 66, 24.4, 66, 21.4, 62], Pm); p.poly(Pd, [21.4, 62, 24.4, 66, 31, 66, 36, 64, 36.6, 61, 31, 62.6, 25, 62]); curve(p, Ph, bez(24.6, 57, 27.6, 54, 31.6, 54.6, 6), 1.2, 0.6); curve(p, Pl, bez(26, 58.6, 29, 57, 32.6, 57.6, 6), 0.5, 0.3); lock([[25, 61, 4, -2.5], [27.6, 59.4, 4.2, -2.1], [31, 58.4, 4, -1.8], [34.4, 60.6, 3.4, -1.5], [23.4, 57.6, 3.4, -2.2]]);
    mass([21.4, 67.6, 30.4, 67.6, 34.6, 70.6, 36, 76, 35, 82, 33, 85.6, 27, 86, 22.4, 82, 20.8, 75], P);
    p.poly(Pd, [30.4, 67.6, 34.6, 70.6, 36, 76, 35, 82, 33, 85.6, 31.4, 85.6, 32.6, 80, 32.6, 74]); curve(p, Ph, bez(22.4, 72, 21.8, 76, 23, 80, 6), 1, 0.5);
    for (const [x0, y0, cx, cy, x1, y1] of [[23.2, 69.6, 21.4, 74, 24, 80.4], [26.8, 69.4, 25, 74.4, 28.4, 80.6], [30.6, 70.2, 29.6, 74.6, 32.6, 79.6], [33.4, 72, 33, 75, 34.6, 78]]) curve(p, St, bez(x0, y0, cx, cy, x1, y1, 8), 1.2, 1);
    p.poly(Pd, [22.4, 82, 27, 86, 33, 85.6, 35, 82, 31, 83.4, 26.4, 83]);
    mass([18.6, 64.4, 21.6, 61.6, 27, 61.2, 31, 62.4, 33, 65.4, 32.6, 68.6, 28.6, 68.2, 24, 67.6, 22.6, 69, 21.8, 72.6, 19.8, 72.8, 18.4, 68.4], Gd);
    p.poly(Gh, [19.6, 64.4, 22, 62.4, 27, 62, 30.6, 63.2, 32, 65, 27, 64.2, 22.4, 64.6, 20.4, 66.4]); seg(p, Gl, 21.4, 63.6, 29.6, 63.2, 0.6); seg(p, Gk, 21.4, 67.2, 32, 67.6, 0.6);
    mass([20.6, 79.6, 25.6, 80, 30.6, 82.6, 33.4, 86, 32.6, 90, 29.6, 92.6, 25, 92.6, 21.4, 90.4, 20.2, 85], P); p.poly(Pd, [29.4, 82.4, 33.4, 86, 32.6, 90, 29.6, 92.6, 28, 92.4, 30, 87.6]);
    mass([21.4, 79, 26.4, 79.4, 28.2, 82.4, 26.4, 83.6, 22.4, 82.2], Gd); seg(p, Gh, 22, 79.8, 26.2, 80.2, 0.5);
    claw(22.6, 86, 6.2, 1.95, 1.5); claw(26.4, 86.2, 6.6, 1.78, 1.6); claw(30.2, 85.4, 6, 1.62, 1.5);
    mass([60, 51.6, 67.6, 49.6, 72.6, 53.4, 75.4, 59.4, 76.4, 64, 70.4, 66, 63, 65.4, 59.6, 60], Pm); p.poly(Pd, [59.6, 60, 63, 65.4, 70.4, 66, 76.4, 64, 75.8, 61.4, 70, 62.6, 63.4, 62]); curve(p, Ph, bez(62, 53.6, 67, 51.4, 71, 54, 6), 1.2, 0.6); curve(p, Pl, bez(64, 56.4, 68, 55, 72, 57, 6), 0.5, 0.3); lock([[63, 59.6, 4, -1.4], [66.6, 58.6, 4.2, -1.1], [70, 59.4, 4, -0.8], [73, 61.6, 3.4, -0.5], [61.4, 62.6, 3.4, -1.7]]);
    mass([67.4, 56.6, 72.4, 56, 72.6, 59.6, 68.4, 60.6], Gd); seg(p, Gh, 68, 57, 72, 56.6, 0.5);
    mass([60.4, 67.6, 74, 68, 78.6, 70.6, 79.8, 77.6, 78.8, 84.6, 74, 87.6, 64, 87.6, 60, 84, 59.4, 76], P);
    p.poly(Pd, [60.4, 67.6, 63.6, 67.8, 62.4, 74, 63, 80, 64, 87.6, 60, 84, 59.4, 76]); curve(p, Ph, bez(76.4, 71, 78.4, 75, 77.6, 80, 6), 1, 0.5);
    for (const [x0, y0, cx, cy, x1, y1] of [[64.6, 70, 63, 75, 65.8, 81], [68.6, 69.6, 67.2, 75, 70.4, 81.6], [72.6, 70, 71.6, 75, 74.6, 80.6], [76.4, 71, 75.6, 74.6, 77.6, 78.6]]) curve(p, St, bez(x0, y0, cx, cy, x1, y1, 8), 1.2, 1);
    p.poly(Pd, [60, 84, 64, 87.6, 74, 87.6, 78.8, 84.6, 73.6, 85, 66, 84.6]);
    mass([65, 64.4, 68.6, 62, 73.6, 61.4, 76.6, 62.6, 78.8, 66, 79.6, 70, 78.6, 73.8, 76, 74, 75.2, 70, 71.4, 68.8, 67, 69.2, 65.2, 67.6], Gd);
    p.poly(Gh, [66, 64.4, 69, 62.8, 73.6, 62.2, 76, 63.2, 77.8, 66, 73.4, 64.6, 69, 64.8, 66.6, 66]); seg(p, Gl, 68, 63.4, 75.4, 63.4, 0.6); seg(p, Gk, 66.2, 68, 78.4, 68.6, 0.6);
    mass([59.4, 84, 66, 85.4, 74, 85.2, 78.6, 85.8, 80.6, 89.4, 78.2, 93.6, 74, 95.4, 66, 95.6, 61.8, 94.6, 60.2, 90], P); p.poly(Pd, [59.4, 84, 62.6, 85, 63, 90, 64.6, 95.4, 61.8, 94.6, 60.2, 90]);
    mass([76.4, 85.8, 80.4, 86.2, 81.6, 89.4, 79, 90.8], Wf);
    mass([63.6, 85.8, 75.4, 85.4, 76.2, 88, 70, 88.8, 63.4, 88.8], Gd); seg(p, Gh, 64.4, 86.4, 75, 86, 0.5);
    claw(62.8, 89, 6, 1.75, 1.5); claw(66.4, 89.4, 6.4, 1.62, 1.6); claw(70.2, 89.6, 6.2, 1.55, 1.6); claw(73.8, 89.2, 5.6, 1.45, 1.5);
    lotus(35.4, 54.4); lotus(63.2, 54);
    glowing(p, E, 0.6, q => leaf(q, Gd, 54.6, 58.2, 55.6, 53.4, 1.4, 1.4)); seg(p, Gh, 54.8, 57.4, 55.4, 54.4, 0.4);
    curve(p, E, bez(37.4, 56.6, 46, 66, 56.4, 57.6, 12), 2, 2); curve(p, Gd, bez(37.4, 56.6, 46, 66, 56.4, 57.6, 12), 1.1, 1.1);
    glowing(p, E, 0.6, q => q.poly(Gd, [45.4, 60.6, 48.4, 60.6, 49.4, 62.4, 47, 64.2, 44.6, 62.4])); p.poly(Gh, [45.8, 61, 48, 61, 48.6, 62, 46.2, 62]);
    mass([44.6, 26.4, 47.6, 29.6, 50.8, 33.2, 52.6, 37.6, 52.2, 42.4, 49.6, 46, 44.6, 47.4, 39.6, 46, 37.2, 41.6, 37.4, 36.6, 40, 32, 42.4, 29.2], P);
    p.poly(Pd, [50.8, 33.2, 52.6, 37.6, 52.2, 42.4, 49.6, 46, 48.4, 42, 49.4, 37]); curve(p, Ph, bez(43.6, 29.4, 41, 32, 40, 36.4, 6), 1, 0.5); curve(p, Pl, bez(46.4, 30, 48.6, 32.6, 49.6, 36, 6), 0.7, 0.4);
    const O = [45, 38.4, 9.8, 9], I = [45, 38.8, 5.8, 6];
    glowing(p, E, 0.8, q => q.poly(Gd, band(O, I, -1.45, 4.29))); p.poly(Gh, band([45, 38.4, 9.2, 8.4], [45, 38.7, 6.6, 6.6], 2.2, 4.29)); p.poly(Gh, band([45, 38.4, 9.2, 8.4], [45, 38.7, 6.6, 6.6], -1.45, 0.4));
    p.poly(Gl, band([45, 38.4, 8.8, 8], [45, 38.6, 8, 7.4], 2.9, 4.2)); p.poly(Gk, band([45, 38.7, 6.6, 6.6], [45, 38.8, 5.9, 6.1], -0.4, 2.6));
    thin([44.4, 37.6, 46.6, 39.4, 48.4, 41.8, 49.6, 44.6, 50.6, 46.8, 48.8, 48, 46.4, 47.6, 44.4, 48.6, 42.4, 47.6, 40, 48, 38.4, 46.6, 40.2, 44, 41.4, 41.4, 42.6, 39.4], Gd);
    p.poly(Gh, [44.4, 38.6, 42.8, 40, 41.6, 42, 40.6, 44.4, 39.6, 46.4, 41.6, 45.6, 42.6, 43, 43.6, 40.6]);
    p.poly(P, [44.4, 40.4, 45.8, 42.2, 46.8, 45, 44.4, 45.8, 42.2, 45, 43.2, 42.2]); seg(p, Pl, 43.4, 42.6, 42.8, 44.6, 0.5); shard(p, Gd, Gh, 44.4, 46, 4.4, -1.57, 0.8);
    claw(40.4, 46.4, 4, 2.7, 1.2); claw(48.6, 46.2, 4, 0.45, 1.2);
    thin([40.2, 47.6, 44.4, 48.8, 48.8, 47.6, 50.2, 49.8, 49.2, 53, 46.6, 54.8, 42.4, 54.8, 40, 53.2, 39.4, 49.8], Gd);
    p.poly(Gh, [40.6, 48.4, 44.4, 49.6, 48.4, 48.4, 47.4, 50.2, 44.4, 50.8, 41.4, 50.2]); seg(p, Gk, 41.4, 52, 47.6, 52, 0.6); p.ell(Gk, 40.2, 50.6, 0.6, 0.6); p.ell(Gk, 49.2, 50.4, 0.6, 0.6);
  };
  ART.flysword = (p, f) => {
    const { bez, curve, seg, glowing } = G.FOE_KIT;
    const E = '#101a3c', Bd = '#3058c0', B = '#5a88ee', Bm = '#7ab2fc', Bc = '#68e2fc', Bl = '#b4f2ff', W = f ? '#ffffff' : '#e8fcff', Vi = '#8c8cf8', b = f ? -1.6 : 0;
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts.map((v, i) => i % 2 ? v + b : v)));
    const Y = y => y + b;
    p.ell('rgba(120,200,255,0.22)', 50, Y(50), 20, 40);
    mass([65.6, 3, 66.6, 6, 64, 16, 60.6, 28, 56.6, 40, 52.8, 50, 49.4, 58.4, 44.4, 57.6, 47, 48, 50.6, 38, 55, 26, 59.6, 14], B);
    p.poly(Bm, [65.6, 3.6, 65.4, 7, 62.4, 16, 58.6, 28, 54.6, 40, 50.8, 50, 48, 57.6, 46.4, 57.4, 48.6, 48, 52.4, 38, 56.6, 26, 60.6, 14].map((v, i) => i % 2 ? v + b : v));
    p.poly(Bc, [56.6, 30, 54.6, 40, 50.8, 50, 48, 57.6, 46.4, 57.4, 48.6, 48, 52.4, 38, 55, 31].map((v, i) => i % 2 ? v + b : v));
    curve(p, W, bez(64.6, 6, 57.6, 24, 49.6, 50, 14).map(([x, y]) => [x, Y(y)]), 0.6, 1);
    p.poly(Vi, [66.6, 6, 64, 16, 60.6, 28, 61.2, 22, 64.2, 12].map((v, i) => i % 2 ? v + b : v));
    mass([46.6, 54.6, 50.4, 55.4, 52, 60, 50.6, 66, 47.4, 70.4, 43.6, 72, 40, 71, 38.4, 67, 40, 61.4, 43, 57.4], Bd);
    glowing(p, Bd, 0.5, q => q.ell(Bc, 45.2, Y(64), 4.6, 5.6)); p.ell(Bd, 45.4, Y(64.2), 3, 3.8); p.ell(B, 45.4, Y(64.2), 2.5, 3.3);
    p.poly(W, [43, 62.4, 46.8, 61.2, 48.6, 62.8, 45.8, 63.6, 47.2, 66.6, 44.6, 65.2, 43.2, 67].map((v, i) => i % 2 ? v + b : v));
    seg(p, Bm, 41, Y(60.4), 40.2, Y(66), 0.8); seg(p, Bm, 49.4, Y(58.6), 49.6, Y(64), 0.8);
    for (const [x0, y0, x1, y1] of [[40.6, 68.6, 36.6, 66.6], [42.4, 70.4, 39.4, 72.2], [49.6, 67, 52.2, 68.6]]) { seg(p, E, x0, Y(y0), x1, Y(y1), 1.9, 0.9); seg(p, B, x0, Y(y0), x1, Y(y1), 1.1, 0.4); }
    mass([41, 71, 44.2, 71.6, 42.6, 78, 40.4, 85, 38.4, 89.4, 36.4, 88.8, 37.6, 84, 39.2, 77], B); p.poly(Bm, [41.4, 71.8, 42.8, 72, 41.4, 78, 39.4, 85, 37.6, 88.6, 37.6, 85, 39, 78].map((v, i) => i % 2 ? v + b : v));
    for (const y of [75, 79, 83]) seg(p, Bd, 38.6 + (75 - y) * 0.3 + 1, Y(y), 41.8 + (75 - y) * 0.3 + 0.6, Y(y + 1), 0.7);
    mass([36.4, 87.4, 39.4, 88.4, 38.6, 92, 35.2, 97, 33.4, 94.6, 34, 90.6], Vi); p.poly(Bl, [36.2, 88.6, 37.8, 89.2, 36.4, 92, 35, 94, 34.8, 91.4].map((v, i) => i % 2 ? v + b : v));
  };
  const TWIG = o => (p, f) => {
    const { bez, curve, seg, leaf, glowing } = G.FOE_KIT;
    const E = '#100c10', Rk = '#2a2224', Rl = '#4a3e3c', Rg = '#a8842c', [B0, B1, B2, B3] = o.bark, s = f ? 0.07 : 0, d = f ? 0.5 : 0;
    const mass = (pts, col) => glowing(p, E, 0.8, q => q.poly(col, pts));
    const tube = (pts, k = 1, off = 0) => {
      const L = [], R = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = pts[i][2], cx = pts[i][0] + nx * w * off, cy = pts[i][1] + ny * w * off;
        L.push(cx + nx * w * k, cy + ny * w * k); R.unshift(cx - nx * w * k, cy - ny * w * k);
      }
      return L.concat(R);
    };
    const rock = (pts, lit) => { mass(pts, Rk); p.poly(Rl, lit); for (let i = 0; i < pts.length; i += 2) seg(p, Rg, pts[i], pts[i + 1], pts[(i + 2) % pts.length], pts[(i + 3) % pts.length], 0.5); };
    const blade = (x, y, a, l, w, c) => { const t = a + s, x1 = x + Math.cos(t) * l, y1 = y + Math.sin(t) * l; leaf(p, E, x - Math.cos(t) * 0.5, y - Math.sin(t) * 0.5, x1 + Math.cos(t) * 0.7, y1 + Math.sin(t) * 0.7, w + 0.6, w + 0.6); leaf(p, c[0], x, y, x1, y1, w, w); leaf(p, c[1], x, y, x1, y1, w, 0); seg(p, c[2], x, y, x + (x1 - x) * 0.8, y + (y1 - y) * 0.8, 0.4); };
    const flower = (x, y, r) => { x += d; glowing(p, E, 0.6, q => { for (let k = 0; k < 5; k++) { const t = k * 1.2566 - 1.57 + s; q.ell('#f4eee6', x + Math.cos(t) * r * 0.56, y + Math.sin(t) * r * 0.56, r * 0.52, r * 0.52); } }); for (const k of [2, 3]) { const t = k * 1.2566 - 1.57 + s; p.ell('#dccac4', x + Math.cos(t) * r * 0.62, y + Math.sin(t) * r * 0.62, r * 0.36, r * 0.36); } p.ell('#e8a4a4', x, y, r * 0.32, r * 0.32); p.ell('#f0c040', x, y, r * 0.14, r * 0.14); };
    const fruit = (x, y, r) => { glowing(p, E, 0.8, q => q.ell('#f2dc82', x, y, r, r)); p.ell('#c4a444', x + r * 0.22, y + r * 0.24, r * 0.76, r * 0.74); p.ell('#f2dc82', x - r * 0.1, y - r * 0.12, r * 0.78, r * 0.76); p.ell('#fffbe0', x - r * 0.38, y - r * 0.42, r * 0.36, r * 0.28); curve(p, '#b8963a', bez(x - r * 0.1, y - r, x + r * 0.5, y, x - r * 0.1, y + r * 0.95, 8), 0.7, 0.7); };
    const TR = [[51.6, 96.4, 6.6], [49.6, 86, 5.8], [45.4, 77, 4.9], [42.6, 69, 4.3], [42.8, 62, 3.9], [45.6, 56, 4.3], [51, 51.2, 4.6], [57.6, 47.6, 4.4], [62.6, 43.6, 3.7], [63.4, 39, 3.3], [57.6, 36, 3.3], [50.6, 33.6, 3.1], [44, 31, 2.7], [40.4, 27, 2.3], [39.4, 21.4, 1.9], [40.8, 16, 1.5], [44.4, 11, 1.1], [48.4, 7, 0.7], [52 + d, 4, 0.2]];
    const BR = [[63.4, 40.6, 1.7], [63.6, 33, 1.3], [63.6, 26, 0.9], [64 + d, 20.6, 0.3]], BL = [[41.8, 60.4, 1.7], [38.4, 54, 1.4], [35.6, 47, 1.1], [34.4, 41, 0.8], [33.8 + d, 36.4, 0.3]];
    rock([55, 82.5, 58.7, 79.4, 59, 88.8, 56.7, 88.8], [55, 82.5, 58.7, 79.4, 57.6, 84]); rock([41.4, 81.9, 44.2, 80.8, 45.3, 83.6, 43.1, 85.3], [41.4, 81.9, 44.2, 80.8, 43.4, 83]);
    if (o.behind) o.behind(blade, flower, fruit);
    mass(tube(BR), o.top); mass(tube(BL), o.top);
    mass(tube(TR), B1);
    p.poly(B0, tube(TR.slice(0, 9), 0.5, -0.5)); p.poly(B2, tube(TR, 0.32, 0.55)); p.poly(o.top, tube(TR.slice(12), 0.7, 0.15));
    if (o.core) { p.poly(o.core[0], tube(TR.slice(0, 7), 0.42, 0.12)); p.poly(o.core[1], tube(TR.slice(0, 5), 0.2, 0.15)); }
    curve(p, B3, bez(50.2, 93.6, 40.8, 76, 44.6, 61, 12), o.streak, o.streak * 0.4); curve(p, B3, bez(46.6, 57.4, 55, 50.6, 61.6, 45.6, 10), o.streak * 0.8, o.streak * 0.3);
    curve(p, Rg, bez(56.6, 93, 49, 80, 47.6, 66, 10), 0.7, 0.5); curve(p, Rg, bez(62.6, 38, 54, 35, 45.4, 33.4, 8), 0.6, 0.5);
    rock([38.1, 79.9, 40.2, 79.8, 44.2, 82.2, 43.9, 84.8, 38, 85, 36.8, 83.9], [38.1, 79.9, 40.2, 79.8, 44.2, 82.2, 39.6, 82.6]);
    rock([35.4, 87, 38.5, 89.9, 40.8, 89.6, 43.9, 93.9, 43.6, 96.4, 39.1, 95, 35.7, 88.8], [35.4, 87, 38.5, 89.9, 40.8, 89.6, 39.6, 91.6, 36.8, 90.6]);
    rock([65.2, 86.5, 66.4, 82.2, 68.6, 83.6, 67.5, 87], [66.4, 82.2, 68.6, 83.6, 67, 84.6]);
    rock([57.8, 79.1, 61, 77.7, 65.8, 79.1, 65, 93.3, 61.8, 95, 59.5, 91.6, 58.4, 83], [57.8, 79.1, 61, 77.7, 65.8, 79.1, 61.4, 80.6]);
    rock([48.8, 92.7, 57.8, 91.6, 58.4, 93.9, 53.9, 96.7, 49.3, 96.1], [48.8, 92.7, 57.8, 91.6, 54, 93.6, 49.4, 94]);
    o.front(blade, flower, fruit);
  };
  const SPROUT = ['#a4bc20', '#d8ec54', '#6a8410'], GOLD = ['#e0c84a', '#fcec8c', '#9c8224'], OLIVE = ['#7c6c12', '#b4a030', '#4a3e08'], LGOLD = ['#d6c446', '#f8ec8c', '#8a7418'];
  ART.twig_wind = TWIG({ bark: ['#28469a', '#5684cc', '#80d2e2', '#eef4fa'], top: '#58c4d0', streak: 1.8, front: blade => {
    for (const [x, y, a, l] of [[51.4, 5, -1, 4.2], [46.2, 9.6, -2.6, 4], [44.4, 12.6, -0.4, 4.4], [39.6, 14, -2, 4], [38.2, 17, -2.7, 3.6], [42, 27.6, -1.2, 3.4], [64, 21.4, -1.4, 4], [64, 26.4, -0.5, 3.8], [62.8, 30, -2.4, 3.4], [66, 44, -0.4, 5], [67.6, 41.4, -0.9, 4.4], [34.2, 38.6, -1.8, 4], [35, 44.4, -2.6, 4], [31.6, 49.2, 3, 5], [33.4, 51.4, 2.6, 4.4], [36, 50, -1.2, 3], [57.6, 76.4, -1.2, 4.4], [59.6, 75.6, -0.5, 4.4], [56.4, 77.4, -2.2, 3.6], [42.4, 48, 2, 3.6]]) blade(x, y, a, l * 1.3, 1, SPROUT);
  } });
  ART.twig_leaf = TWIG({ bark: ['#1e1618', '#44363a', '#6a5a50', '#f8d050'], top: '#c8a844', streak: 1.4, core: ['#e8b838', '#fff09a'], front: blade => {
    for (const [x, y, a, l, w] of [[45, 10.6, -1.9, 9.5, 1.7], [47, 9.4, -0.5, 11.3, 1.9], [48, 10.4, 0.2, 10.8, 1.7], [40, 18, 3, 12.2, 2], [40, 20.4, 2.6, 11.3, 1.9], [40.4, 16, -2.4, 9.5, 1.7], [41, 24, 2.4, 12.2, 2], [42, 24, -0.6, 8.6, 1.6], [64, 22, -0.2, 11.3, 1.9], [65, 24.4, 0.4, 12.2, 2], [63, 22.4, -2.2, 6.8, 1.4], [63.4, 40, 0.2, 12.2, 2], [64, 43, 0.6, 13.5, 2.2], [63, 44.6, 1.2, 10, 1.7], [62, 38, -0.4, 8.6, 1.6], [60, 36.4, -2.6, 7.6, 1.4], [34, 46, 3, 12.2, 2], [34, 52, 2.4, 12.2, 2], [35, 44, -2.2, 8.6, 1.6], [36.4, 40.4, -1.4, 7.6, 1.4], [37, 50, -0.4, 7.6, 1.4], [58, 77, -0.6, 8.1, 1.6], [58, 77, -1.4, 6.8, 1.4], [57, 78, -2.4, 5.4, 1.3]]) blade(x, y, a, l, w, GOLD);
  } });
  ART.twig_bloom = TWIG({ bark: ['#161414', '#363230', '#5a5650', '#f0c030'], top: '#4a4238', streak: 1, front: (blade, flower) => {
    for (const [x, y, r] of [[43, 7.4, 2.2], [40.2, 10.6, 2.4], [37.8, 14.4, 2.2], [36.8, 18.4, 2], [44.6, 12.6, 1.8], [41, 27.4, 2.6], [39, 31.4, 2.2], [44.2, 30.2, 2.4], [42.8, 34.4, 1.8], [54, 31.2, 2.4], [58, 30.2, 2.2], [61, 29.4, 2], [63.6, 23.4, 1.8], [64.6, 28, 2], [59, 38.4, 2.6], [62.2, 41.2, 2.4], [57, 44.2, 2.2], [63, 47.2, 2.4], [60, 49.4, 2], [66.2, 44.8, 2], [72, 40.4, 2.6], [68.8, 38.2, 2], [32, 42.4, 2.4], [34, 45.6, 2], [30.6, 51, 2.4], [34.6, 52.4, 2.2], [31, 58, 2.4], [35, 56.4, 2], [29, 55, 1.6]]) flower(x, y, r);
  } });
  ART.twig_fruit = TWIG({ bark: ['#86681a', '#c6a23e', '#f2da72', '#fff2b0'], top: '#a88a24', streak: 1.4, core: ['#f0d062', '#fff6c0'], behind: blade => {
    for (const [x, y, a, l, w] of [[40, 18, 3, 12.2, 2.2], [41, 24, 2.4, 12.2, 2.2], [64, 22, -0.2, 11.3, 2], [63.4, 40, 0.2, 12.2, 2.2], [34, 46, 3, 12.2, 2.2]]) blade(x, y, a, l, w, OLIVE);
  }, front: (blade, flower, fruit) => {
    fruit(41.6, 35, 5.4); fruit(47.2, 40.6, 5.8);
    for (const [x, y, a, l, w, c] of [[45, 10.6, -1.9, 9.5, 1.8, LGOLD], [47, 9.4, -0.5, 11.3, 2, OLIVE], [48, 10.4, 0.2, 10.8, 1.8, LGOLD], [40, 20.4, 2.6, 11.3, 2, LGOLD], [40.4, 16, -2.4, 9.5, 1.8, OLIVE], [42, 24, -0.6, 8.6, 1.7, LGOLD], [38, 30, 2.6, 9.5, 1.8, OLIVE], [65, 24.4, 0.4, 12.2, 2.2, LGOLD], [63, 22.4, -2.2, 6.8, 1.5, OLIVE], [64, 43, 0.6, 13.5, 2.3, LGOLD], [63, 44.6, 1.2, 10, 1.8, OLIVE], [60, 36.4, -2.6, 7.6, 1.5, LGOLD], [34, 52, 2.4, 12.2, 2.2, LGOLD], [35, 44, -2.2, 8.6, 1.7, OLIVE], [37, 50, -0.4, 7.6, 1.5, LGOLD], [46, 37, 1.3, 8.1, 1.7, OLIVE], [43, 31.6, 2, 6.8, 1.3, LGOLD]]) blade(x, y, a, l, w, c);
  } });
  Object.assign(META, { ape: { icon: [45, 41, 14], anim: true, aura: '255,208,96' }, yanqing_b: { figure: 'yanqing', aura: '160,220,255' }, flysword: { icon: [46, 62, 14], anim: true, float: true, aura: '160,220,255' }, lupus: { icon: [35, 24, 16], anim: true }, ghound: { icon: [37, 24, 16], anim: true, aura: '255,216,120' }, danshu: { icon: [47, 17, 11], anim: true, float: true, aura: '200,255,176' }, ebon: { icon: [40, 38, 12], anim: true, aura: '255,208,96' }, twig_wind: { icon: [46, 26, 20], anim: true }, twig_leaf: { icon: [46, 26, 20], anim: true }, twig_bloom: { icon: [46, 26, 20], anim: true }, twig_fruit: { icon: [46, 26, 20], anim: true }, alchemist: { icon: [40, 20, 15], anim: true, float: true, aura: '255,190,80' }, ballista: { icon: [46, 19, 15], anim: true, aura: '255,190,80' }, aurumaton: { icon: [46, 26, 14], anim: true, aura: '88,240,224' }, spectral: { icon: [38, 14, 11], anim: true, aura: '184,160,255' }, mara: { icon: [43, 22, 17], anim: true, aura: '255,190,80' }, shifter: { icon: [58, 30, 24], anim: true, aura: '255,190,80' }, dracolion: { icon: [47, 22, 16], anim: true }, dragonfish: { icon: [30, 73, 15], anim: true, float: true, aura: '255,210,120' }, cloudtoad: { icon: [48, 16, 16], anim: true }, patroller: { icon: [51, 19, 12], anim: true }, kafka_b: { figure: 'kafka', aura: '200,120,255' } });
  G.FOE_FAMILY.ingenium = ['#3a2a18', '#e0b458'];
  G.FOE_FAMILY.patrol = ['#1e2c4a', '#7a9ad0'];
  for (const [id, c0, c1] of [['lf_shards', '#8a94a8', '#d8dee8'], ['lf_seal', '#2e8a78', '#7fffd4'], ['lf_grenade', '#3a4a30', '#c8452a']]) G.ITEM_ART[id] = p => { p.poly(c0, [8, 24, 12, 8, 24, 6, 26, 18, 18, 27]); p.poly(c1, [11, 21, 14, 11, 22, 9, 23, 17, 17, 23]); p.ell('#14202c', 17, 16, 2, 2); };
  G.FOE_FAMILY.abomination = ['#1e2a2a', '#7fd0a0'];
  G.ITEM_ART.lf_rice = p => { p.poly('#8a6a44', [6, 14, 26, 14, 24, 28, 8, 28]); p.ell('#f4efe2', 16, 13, 10, 6); p.ell('#ffffff', 14, 11, 5, 2.4); };
  G.ITEM_ART.lf_songcake = p => { p.ell('#c8843c', 16, 19, 12, 8); p.ell('#f0c878', 16, 16, 11, 7); p.ell('#ff9ac8', 16, 14, 5, 3); p.ell('#58c87a', 11, 15, 3, 2); };
  G.ITEM_ART.lf_gods = p => { p.poly('#2e4680', [7, 5, 25, 5, 25, 28, 7, 28]); p.poly('#94a8e8', [9, 7, 23, 7, 23, 26, 9, 26]); p.ell('#58f0e0', 16, 14, 4, 4); p.ell('#1a2a58', 16, 14, 2, 2); };
  G.ITEM_ART.lf_artseal = p => { p.poly('#2e8a78', [9, 5, 23, 5, 23, 22, 16, 28, 9, 22]); p.poly('#7fffd4', [11, 7, 21, 7, 21, 21, 16, 25, 11, 21]); p.ell('#e0b458', 16, 12, 3, 3); };
  G.ITEM_ART.lf_pill = p => { p.ell('#5a2a1a', 16, 17, 10, 10); p.ell('#c8452a', 16, 16, 9, 9); p.ell('#ff9a70', 13, 13, 3, 3); };
  G.ITEM_ART.lf_fan = p => { p.poly('#3a2e24', [16, 28, 3, 12, 8, 6, 16, 4, 24, 6, 29, 12]); p.poly('#f4efe2', [16, 26, 5, 12, 9, 8, 16, 6, 23, 8, 27, 12]); p.ell('#d8622e', 12, 12, 3, 2); p.ell('#d8622e', 20, 14, 3, 2); p.ell('#3a2e24', 16, 27, 2, 2); };
  G.ITEM_ART.lf_amiseal = p => { p.poly('#8a5a20', [8, 14, 24, 14, 26, 28, 6, 28]); p.poly('#e0a040', [10, 16, 22, 16, 24, 26, 8, 26]); p.poly('#a03a2e', [12, 6, 20, 6, 20, 14, 12, 14]); p.ell('#7c2a22', 16, 21, 4, 3); };
  G.ITEM_ART.lf_chest = p => { p.poly('#3a2e24', [5, 12, 27, 12, 27, 27, 5, 27]); p.poly('#7a5a34', [7, 14, 25, 14, 25, 25, 7, 25]); p.poly('#a8824e', [5, 7, 27, 7, 27, 12, 5, 12]); p.ell('#e8b050', 16, 13, 2, 2); };
  G.ITEM_ART.lf_knife = p => { p.poly('#e8ecf4', [6, 8, 20, 8, 22, 18, 6, 18]); p.poly('#a8b0c0', [6, 15, 21, 15, 22, 18, 6, 18]); p.poly('#4a2e1c', [20, 11, 29, 11, 29, 15, 21, 15]); p.ell('#e8b050', 24, 13, 1, 1); };
  G.ITEM_ART.lf_bowset = p => { stroke(p, '#4a2e1c', 8, 4, 18, 16, 3); stroke(p, '#4a2e1c', 18, 16, 8, 28, 3); stroke(p, '#f4efe2', 8, 4, 8, 28, 1); stroke(p, '#c8c4bc', 6, 16, 28, 16, 2); p.poly('#d8622e', [28, 13, 31, 16, 28, 19]); };
  G.ITEM_ART.lf_blend = p => { p.poly('#3e7e5a', [8, 8, 24, 8, 26, 27, 6, 27]); p.poly('#5e9a6a', [10, 10, 22, 10, 24, 25, 8, 25]); p.poly('#e8dcc0', [11, 14, 21, 14, 21, 21, 11, 21]); p.ell('#3e7e5a', 16, 17, 2, 3); p.poly('#a8824e', [9, 5, 23, 5, 24, 8, 8, 8]); };
  G.ITEM_ART.lf_offal = p => { p.ell('#2e2a2a', 16, 20, 13, 8); p.ell('#d8622e', 16, 17, 11, 6); p.ell('#a8342a', 12, 16, 3, 2); p.ell('#f0c080', 19, 18, 3, 2); p.ell('#a8342a', 21, 15, 2, 1); for (const x of [10, 16, 22]) p.ell('rgba(240,240,255,0.5)', x, 8, 1, 3); };
  G.ITEM_ART.lf_kite = p => { p.poly('#3a6ad0', [16, 3, 28, 15, 16, 25, 4, 15]); p.poly('#f4efe2', [16, 6, 24, 15, 16, 22, 8, 15]); stroke(p, '#d8622e', 16, 25, 21, 30, 1); stroke(p, '#d8622e', 21, 30, 13, 31, 1); stroke(p, '#3a2e24', 16, 3, 16, 25, 1); stroke(p, '#3a2e24', 4, 15, 28, 15, 1); };
  G.ITEM_ART.lf_abacus = p => { p.poly('#1e2a2a', [4, 8, 28, 8, 28, 26, 4, 26]); p.poly('#2e4a4a', [6, 10, 26, 10, 26, 24, 6, 24]); for (const y of [13, 17, 21]) { stroke(p, '#e8b050', 6, y, 26, y, 1); for (const x of [10, 16, 22]) p.ell('#7fffd4', x, y, 2, 1.5); } };
  G.ITEM_ART.lf_ditingpic = p => { p.poly('#3a2e24', [5, 5, 27, 5, 27, 27, 5, 27]); p.poly('#f4efe2', [7, 7, 25, 7, 25, 25, 7, 25]); p.ell('#d8dee8', 16, 19, 6, 4); p.ell('#f4f8fa', 18, 14, 4, 3); p.ell('#7fffd4', 19, 14, 1, 1); p.poly('#2e3a4c', [15, 12, 16, 8, 18, 11]); };
  G.ITEM_ART.lf_slate = p => { p.poly('#2a3640', [6, 6, 26, 6, 27, 26, 5, 26]); p.poly('#56646e', [8, 8, 24, 8, 25, 24, 7, 24]); for (const [x, y] of [[11, 12], [21, 12], [11, 20], [21, 20]]) p.ell('#7affc8', x, y, 2, 2); };
  G.ITEM_ART.lf_undestroyed = p => {
    p.poly('#3a2e20', [4, 8, 28, 6, 29, 25, 5, 27]);
    p.poly('#d8ccb0', [5, 9, 27, 7, 28, 24, 6, 26]);
    p.poly('#2a2018', [18, 7, 27, 7, 28, 16, 22, 12]);
    for (const y of [12, 16, 20]) p.poly('#6a5a44', [8, y, 20, y - 1, 20, y, 8, y + 1]);
    p.ell('#2e8a58', 11, 22, 2.4, 2.4);
  };
  G.ITEM_ART.lf_letter = p => {
    p.poly('#8a7a5a', [3, 9, 29, 7, 30, 24, 4, 26]);
    p.poly('#e8dcc0', [4, 10, 28, 8, 29, 23, 5, 25]);
    p.poly('#c8b890', [4, 10, 16, 18, 28, 8, 28, 10, 16, 20, 4, 12]);
    p.ell('#b02a1e', 16, 19, 3, 3); p.ell('#e8604a', 15.4, 18.4, 1.2, 1.2);
  };

  alias('ebon_r', 'ebon');
  alias('ascended', 'danshu');
  alias('lf_undying1', 'phantylia');
  alias('lf_undying2', 'phantylia2');
  alias('lf_undying3', 'phantylia2', { aura: '255,210,120' });

  H.Luofu = { LANDS, DECOR, LAYER, LAYER_SIZE, KIT, buildLayer };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
