(function (H) {
  'use strict';
  const G = H.Gfx;
  const U = 16;
  const hash = (x, y, s) => G.hash(x, y, s);
  const S = () => H.Station;
  function spr(w, h, up, draw) {
    const cv = G.mkCanvas(w, h + up), g = cv.getContext('2d');
    draw(S().pen(g, 0, 0), g);
    return cv;
  }

  const LANDS = {
    city: {
      roof: ['#3c4a64', '#52648a', '#283246'], cap: ['#e4ecf4', '#ffffff', '#b4c2d2'],
      face: ['#d0aa96', '#e4c4b0', '#a27e6e'], trim: ['#f4e8d6', '#c4ae94'], base: '#7a645c',
      glass: ['#1e2c40', '#4a6c92'], lit: '#ffd690', frame: '#2c2832', door: ['#5c3628', '#7e4e36', '#3a2018'],
      rock: ['#6e7c90', '#8a98aa', '#4c5868'], rockCap: ['#e4ecf4', '#ffffff', '#b4c2d2'],
      ground: ['#a49c92', '#bab2a6', '#7a7268'], snow: '#e2eaf2', storeys: 3,
      ground2: ['#b6aea6', '#ccc6be', '#8e8680'], ground3: ['#c4b6a6', '#d8cec0', '#9a8e80'],
      road: ['#585c64', '#6c7079', '#42454c'], rail: ['#a0aab6', '#dde4ec', '#4a4e56'],
      drop: ['#0c1018', '#1a2230', '#05070c'], lamp: '#ffd690', night: 0.25, edge: '#283246', tint: null, rockHouse: true
    },
    backwater: {
      roof: ['#3a3e52', '#4e5468', '#262838'], cap: ['#c8d0e0', '#e6ecf6', '#9aa4ba'],
      face: ['#c49c8a', '#d8b4a2', '#94705e'], trim: ['#e8dccc', '#a48a7a'], base: '#5a4a4e',
      glass: ['#1a2236', '#3a4a6a'], lit: '#ffcf80', frame: '#2a2632', door: ['#4a2e28', '#6a4434', '#2a1a16'],
      rock: ['#5a5e6e', '#70768a', '#3e4250'], rockCap: ['#c8d0e0', '#e6ecf6', '#9aa4ba'],
      ground: ['#8a8496', '#a09aac', '#625e70'], snow: '#d4dcea', storeys: 3,
      ground2: ['#9a8e8a', '#b0a4a0', '#706664'], ground3: ['#a6a0b2', '#bcb6c8', '#7a7488'],
      road: ['#56566a', '#6a6a80', '#3e3e50'], rail: ['#8a94a2', '#c8d0da', '#4a4e56'],
      drop: ['#0c0a18', '#1a1630', '#05040c'], lamp: '#ffd690', night: 0.35, edge: '#262838', tint: 'rgba(90,60,170,0.10)', rockHouse: true
    },
    plains: {
      roof: ['#4a5468', '#5e6a80', '#323a4a'], cap: ['#e6eef6', '#ffffff', '#b8c6d6'],
      face: ['#8a7a6a', '#a2927e', '#665848'], trim: ['#cfc2ae', '#9a8c78'], base: '#4e443a',
      glass: ['#1a2230', '#3a4c64'], lit: '#ffcf80', frame: '#2a2622', door: ['#4a3426', '#664834', '#2e1e14'],
      rock: ['#5a6a82', '#7484a0', '#3e4a5e'], rockCap: ['#b4c2d4', '#dfe7f1', '#9aaabf'],
      ground: ['#d6e0ec', '#f2f6fb', '#c4d0de'], snow: '#ffffff',
      ground2: ['#c4d0dc', '#d8e2ec', '#9aa8ba'], ground3: ['#dce6f0', '#f6f9fc', '#c8d4e2'],
      road: ['#a8b4c4', '#bcc8d6', '#8694a6'], rail: ['#8a94a2', '#c8d0da', '#4a4e56'],
      drop: ['#8ab8dc', '#c4e2f6', '#5a88b0'], lamp: '#ffcf80', night: 0, edge: '#3e4a5e', tint: 'rgba(200,220,255,0.05)', ice: true
    },
    cavern: {
      roof: ['#2e2a2c', '#423c3c', '#1e1a1c'], cap: null,
      face: ['#7a4430', '#94563a', '#563022'], trim: ['#c8a070', '#8a6a44'], base: '#3a2a24',
      glass: ['#2a2018', '#4a3828'], lit: '#ffc060', frame: '#1e1614', door: ['#4a2e1e', '#6a4428', '#2e1c12'],
      rock: ['#2a2e3a', '#3a404e', '#1a1d26'], rockCap: ['#141820', '#20242e', '#0c0e14'],
      ground: ['#4a4a50', '#5c5c64', '#36363c'], snow: null,
      ground2: ['#6a4e36', '#84623e', '#4a3424'], ground3: ['#4e545e', '#646c78', '#383c44'],
      road: ['#5a4a3a', '#6e5c48', '#42362a'], rail: ['#8a8070', '#c8b89a', '#3a3028'],
      drop: ['#05060a', '#0c0e16', '#000000'], lamp: '#ffb050', night: 0.85, edge: '#0c0e14', tint: 'rgba(30,40,80,0.10)'
    },
    rivet: {
      roof: ['#262c3c', '#343c52', '#181c28'], cap: ['#c4cede', '#eaf0f8', '#8a96ac'],
      face: ['#5e5a64', '#76727c', '#403c46'], trim: ['#a4968a', '#544842'], base: '#34303a',
      glass: ['#121824', '#2a3650'], lit: '#ffb45a', frame: '#1c181e', door: ['#3c2a22', '#583e30', '#22160e'],
      rock: ['#363c4c', '#4a5266', '#242834'], rockCap: ['#2c3242', '#c4cede', '#1c202c'],
      ground: ['#565a66', '#6a6e7a', '#3e424c'], snow: '#c4cede', storeys: 3,
      ground2: ['#625a5e', '#766e72', '#46404a'], ground3: ['#747884', '#888c98', '#555964'],
      road: ['#40424a', '#52545c', '#2c2e36'], rail: ['#8a909c', '#c8ccd4', '#3a3e48'],
      drop: ['#05060c', '#0e1020', '#000000'], lamp: '#ffb45a', night: 0.6, edge: '#181c28', tint: 'rgba(40,46,120,0.16)', rockHouse: true
    },
    corridor: {
      roof: ['#4a5468', '#5e6a82', '#323a4c'], cap: ['#dce6f2', '#f6faff', '#a8b6ca'],
      face: ['#8a92a4', '#a2aabb', '#646c7e'], trim: ['#c8d0dc', '#7a8496'], base: '#4a5262',
      glass: ['#1e2838', '#3a4c66'], lit: '#a8d8ff', frame: '#2a3040', door: ['#3a4250', '#525c6c', '#242a36'],
      rock: ['#5a6a82', '#7484a0', '#3e4a5e'], rockCap: ['#b4c2d4', '#dfe7f1', '#9aaabf'],
      ground: ['#b4bccc', '#cad2e0', '#8a92a6'], snow: '#eef4fb', storeys: 3,
      ground2: ['#8a92a4', '#a2aabb', '#646c7e'], ground3: ['#9aa4b8', '#b4bcd0', '#7a8498'],
      road: ['#6a7286', '#7e869a', '#525a6c'], rail: ['#8a909c', '#c8ccd4', '#3a3e48'],
      drop: ['#c8d8ec', '#e8f0fa', '#9ab0cc'], lamp: '#a8d8ff', night: 0.08, edge: '#323a4c', tint: 'rgba(210,225,255,0.16)', rockHouse: true
    },
    settle: {
      roof: ['#1e2436', '#2c344c', '#121624'], cap: ['#b8c4d8', '#e4ecf6', '#7e8aa4'],
      face: ['#4a4e62', '#62667a', '#32364a'], trim: ['#8a96b0', '#3a4258'], base: '#2a2e40',
      glass: ['#121a2a', '#2a3a58'], lit: '#ffc870', frame: '#16182a', door: ['#2e2a3a', '#46405a', '#1a1622'],
      rock: ['#1e2840', '#2c3858', '#121a2c'], rockCap: ['#1a2236', '#8a9ab8', '#0e1424'],
      ground: ['#a8b2c4', '#c8d2e2', '#7e889c'], snow: '#dde6f2', storeys: 3,
      ground2: ['#5a5e70', '#6e7286', '#42465a'], ground3: ['#8e98ac', '#a8b2c4', '#6a7488'],
      road: ['#4a5064', '#5c6278', '#363a4c'], rail: ['#8a909c', '#c8ccd4', '#3a3e48'],
      drop: ['#05060c', '#0e1020', '#000000'], lamp: '#ffc870', night: 0.7, edge: '#121a2c', tint: 'rgba(30,50,130,0.18)', rockHouse: true
    },
    hill: {
      roof: ['#4a5468', '#5e6a82', '#323a4c'], cap: ['#e6eef6', '#ffffff', '#b8c6d6'],
      face: ['#8a92a4', '#a2aabb', '#646c7e'], trim: ['#c8d0dc', '#7a8496'], base: '#4a5262',
      glass: ['#1e2838', '#3a4c66'], lit: '#a8f0e0', frame: '#2a3040', door: ['#3a4250', '#525c6c', '#242a36'],
      rock: ['#5a6a84', '#7486a2', '#3e4a60'], rockCap: ['#a8b8cc', '#c8d6e4', '#8698b0'],
      ground: ['#e4ecf4', '#ffffff', '#c0cede'], snow: '#ffffff',
      ground2: ['#8a929e', '#a6aeba', '#5e6672'], ground3: ['#b4bcc8', '#d2d8e2', '#8a92a0'],
      road: ['#a8b4c4', '#bcc8d6', '#8694a6'], rail: ['#8a94a2', '#c8d0da', '#4a4e56'],
      drop: ['#9ab8d4', '#d2e4f2', '#6a8cb0'], lamp: '#a8f0e0', night: 0, edge: '#4a586e', tint: 'rgba(150,235,215,0.10)', ice: true, deck: true
    },
    pillars: {
      roof: ['#5a4a44', '#6e5c54', '#3e322e'], cap: ['#f2e6d8', '#fff8ee', '#cdbcaa'],
      face: ['#8a7a6e', '#a29080', '#665a50'], trim: ['#d8c8b0', '#8a7460'], base: '#4a3e38',
      glass: ['#2a2420', '#5a4a3a'], lit: '#ffc070', frame: '#2a221e', door: ['#4a3426', '#664834', '#2e1e14'],
      rock: ['#6a5c56', '#86766c', '#4a3e38'], rockCap: ['#b8aaa0', '#d4c8bc', '#9a8c80'],
      ground: ['#f6efe4', '#ffffff', '#ddd0bf'], snow: '#ffffff',
      ground2: ['#9a8a7c', '#b4a492', '#74665a'], ground3: ['#b8a894', '#d2c4b0', '#8e7e6c'],
      road: ['#a8988a', '#bcae9e', '#867868'], rail: ['#8a7a6a', '#c8b8a0', '#4a3e34'],
      drop: ['#3a2a24', '#5a4034', '#1a1210'], lamp: '#ffc070', night: 0, edge: '#56483f', tint: 'rgba(255,186,120,0.12)', ice: true, deck: true
    },
    pathspace: {
      roof: ['#1a1030', '#2a1a48', '#0e0820'], cap: null,
      face: ['#3a2a58', '#4e3a72', '#261a3e'], trim: ['#f4c060', '#8a5a1a'], base: '#1a1030',
      glass: ['#1a1030', '#3a2a58'], lit: '#ffd070', frame: '#0e0820', door: ['#3a2a58', '#4e3a72', '#261a3e'],
      rock: ['#1a1030', '#2a1a48', '#0e0820'], rockCap: ['#1a1030', '#2a1a48', '#0e0820'],
      ground: ['#c47e26', '#ffd27a', '#7a4a12'], snow: null,
      ground2: ['#c8862a', '#f4c060', '#8a5a1a'], ground3: ['#e0a040', '#ffe0a0', '#9a6a20'],
      road: ['#c8862a', '#f4c060', '#8a5a1a'], rail: ['#c8862a', '#f4c060', '#8a5a1a'],
      drop: ['#0a0618', '#3a2a6a', '#05030c'], lamp: '#ffd070', night: 0.5, edge: '#05030c', tint: 'rgba(255,190,90,0.08)', amber: true
    },
    hotel: {
      inside: true, rockHouse: true, roof: ['#2a1e1a', '#3a2a24', '#1a1210'], cap: null,
      face: ['#dccaa8', '#ecdcbc', '#b49c78'], trim: ['#f4e6c8', '#7a5434'], base: '#5a3a24',
      glass: ['#2a3a5a', '#7aa0c8'], lit: '#ffd690', frame: '#3a2618', door: ['#6a4228', '#8a5a36', '#3e2414'],
      rock: ['#3a2a24', '#4a3a30', '#2a1e1a'], rockCap: ['#2a1e1a', '#3a2a24', '#1a1210'],
      ground: ['#d8d0c4', '#ece6dc', '#aaa094'], ground2: ['#9a6a40', '#b8844e', '#6a4628'], ground3: ['#2a7a7a', '#3a9a94', '#1a5252'],
      ground4: ['#e6e0d4', '#1e1e24', '#b8b0a2'], ground5: ['#8a2a2a', '#c89a4a', '#5a1a1a'],
      road: ['#d8d0c4', '#ece6dc', '#aaa094'], rail: ['#8a8070', '#c8b89a', '#3a3028'],
      drop: ['#1a1210', '#2a1e1a', '#0a0806'], lamp: '#ffc070', night: 0, edge: '#1a1210', tint: 'rgba(255,190,110,0.05)', storeys: 2
    },
    workshop: {
      inside: true, rockHouse: true, roof: ['#1e1612', '#2e221a', '#120c08'], cap: null,
      face: ['#7a5434', '#94683e', '#5a3a22'], trim: ['#c8a070', '#3a2818'], base: '#3a2818',
      glass: ['#2a3a5a', '#7aa0c8'], lit: '#ffd690', frame: '#2a1e14', door: ['#4a3022', '#6a4630', '#2a1a10'],
      rock: ['#3a2a20', '#4a3828', '#2a1e14'], rockCap: ['#1e1612', '#2e221a', '#120c08'],
      ground: ['#e2dace', '#f2ece2', '#b8ae9e'], ground2: ['#8a5a34', '#a8703e', '#5e3c20'], ground3: ['#6a3a2a', '#8a4a34', '#4a2618'],
      ground4: ['#e8e0d0', '#24222a', '#bcb2a2'], ground5: ['#3a3e48', '#c8a070', '#2a2c34'],
      road: ['#e2dace', '#f2ece2', '#b8ae9e'], rail: ['#8a8070', '#c8b89a', '#3a3028'],
      drop: ['#120c08', '#1e1612', '#000000'], lamp: '#ffc070', night: 0, edge: '#120c08', tint: 'rgba(255,170,90,0.06)', storeys: 2
    },
    fort: {
      inside: true, rockHouse: true, roof: ['#1a2234', '#28324a', '#0e1420'], cap: null,
      face: ['#e2ddd2', '#f2eee6', '#b4ac9e'], trim: ['#f6f2ea', '#5a4a3a'], base: '#4a3e34',
      glass: ['#c8dcf0', '#ffffff'], lit: '#ffffff', frame: '#2a2a34', door: ['#4a3426', '#6a4a36', '#2a1c12'],
      rock: ['#4a4a54', '#5a5a66', '#34343e'], rockCap: ['#1a2234', '#28324a', '#0e1420'],
      ground: ['#e6e2da', '#f6f2ec', '#c4bcae'], ground2: ['#5a3e2a', '#74523a', '#3e2a1c'], ground3: ['#4a5a72', '#6a7a92', '#34404e'],
      ground4: ['#e6e2da', '#c8a050', '#c4bcae'], ground5: ['#4a5a72', '#c8a050', '#34404e'],
      road: ['#e6e2da', '#f6f2ec', '#c4bcae'], rail: ['#8a8070', '#c8b89a', '#3a3028'],
      drop: ['#0e1420', '#1a2234', '#000000'], lamp: '#fff0c8', night: 0, edge: '#0e1420', tint: 'rgba(200,220,255,0.05)', storeys: 3
    },
    florist: {
      inside: true, rockHouse: true, roof: ['#1e2a22', '#2a3a2e', '#121a14'], cap: null,
      face: ['#d8e4cc', '#e8f0dc', '#a8b89a'], trim: ['#f4f8ec', '#4a6a44'], base: '#3a5a34',
      glass: ['#b8d4ec', '#ffffff'], lit: '#ffffff', frame: '#2a3a2a', door: ['#5a4228', '#7a5a36', '#3a2a18'],
      rock: ['#3a4a3a', '#4a5a4a', '#2a362a'], rockCap: ['#1e2a22', '#2a3a2e', '#121a14'],
      ground: ['#b8946a', '#d0ac80', '#8a6a46'], ground2: ['#9a6a40', '#b8844e', '#6a4628'], ground3: ['#6a8a5a', '#8aaa74', '#4a6a3e'],
      ground4: ['#e6e0d4', '#5a7a4a', '#b8b0a2'], ground5: ['#7a4a6a', '#e8a8c8', '#4a2a42'],
      road: ['#b8946a', '#d0ac80', '#8a6a46'], rail: ['#8a8070', '#c8b89a', '#3a3028'],
      drop: ['#121a14', '#1e2a22', '#000000'], lamp: '#fff0c8', night: 0, edge: '#121a14', tint: null, storeys: 2
    },
    clinic: {
      inside: true, rockHouse: true, roof: ['#1e1a18', '#2e2824', '#120e0c'], cap: null,
      face: ['#c8c4b4', '#dcd8ca', '#9a968a'], trim: ['#eae6da', '#5a4a3a'], base: '#5a6a5a',
      glass: ['#2a3a5a', '#ffb050'], lit: '#ffd690', frame: '#2a2420', door: ['#4a3426', '#6a4a36', '#2a1c12'],
      rock: ['#3a3430', '#4a443e', '#2a2420'], rockCap: ['#1e1a18', '#2e2824', '#120e0c'],
      ground: ['#b8b4a6', '#ccc8ba', '#8a8678'], ground2: ['#7a5a3a', '#94704a', '#56402a'], ground3: ['#5a7a6a', '#7a9a8a', '#3a5a4a'],
      ground4: ['#d8d4c8', '#5a6a5a', '#aaa69a'], ground5: ['#6a3a3a', '#c89a4a', '#4a2424'],
      road: ['#b8b4a6', '#ccc8ba', '#8a8678'], rail: ['#8a8070', '#c8b89a', '#3a3028'],
      drop: ['#120e0c', '#1e1a18', '#000000'], lamp: '#ffd690', night: 0, edge: '#120e0c', tint: 'rgba(255,190,110,0.06)', storeys: 2
    },
    club: {
      inside: true, rockHouse: true, roof: ['#16120e', '#241e18', '#0c0a08'], cap: null,
      face: ['#6a3a2a', '#844a34', '#4a2618'], trim: ['#c8a050', '#2a1a10'], base: '#2a1a12',
      glass: ['#2a2018', '#ffb050'], lit: '#ffb050', frame: '#1a1210', door: ['#3a2418', '#5a3a26', '#1e120a'],
      rock: ['#2a2420', '#3a322c', '#1a1612'], rockCap: ['#16120e', '#241e18', '#0c0a08'],
      ground: ['#5a4a3a', '#6e5c48', '#3e3228'], ground2: ['#4a3a2c', '#5e4a38', '#30261c'], ground3: ['#8a2a2a', '#b84a3a', '#5a1a1a'],
      ground4: ['#5a4a3a', '#c8a050', '#3e3228'], ground5: ['#3a3e48', '#c8a050', '#2a2c34'],
      road: ['#5a4a3a', '#6e5c48', '#3e3228'], rail: ['#8a8070', '#c8b89a', '#3a3028'],
      drop: ['#0c0a08', '#16120e', '#000000'], lamp: '#ffb050', night: 0, edge: '#0c0a08', tint: 'rgba(255,140,60,0.08)', storeys: 2
    },
    grandhotel: {
      inside: true, rockHouse: true, roof: ['#1a1410', '#2a201a', '#0e0a08'], cap: null,
      face: ['#8a5a3a', '#a06a44', '#64402a'], trim: ['#d8b880', '#3a2618'], base: '#3a2618',
      glass: ['#2a2018', '#ffb050'], lit: '#ffc070', frame: '#2a1a10', door: ['#4a2e1e', '#6a4428', '#2e1c12'],
      rock: ['#3a2a20', '#4a3a2c', '#2a1e16'], rockCap: ['#1a1410', '#2a201a', '#0e0a08'],
      ground: ['#9a7a5a', '#b08c68', '#6e563e'], ground2: ['#7a5434', '#94683e', '#5a3a22'], ground3: ['#6a2a2a', '#8a3a34', '#4a1a18'],
      ground4: ['#c8b89a', '#5a3a22', '#9a8a6e'], ground5: ['#6a2a2a', '#c89a4a', '#4a1a18'],
      road: ['#9a7a5a', '#b08c68', '#6e563e'], rail: ['#8a8070', '#c8b89a', '#3a3028'],
      drop: ['#0e0a08', '#1a1410', '#000000'], lamp: '#ffc070', night: 0, edge: '#0e0a08', tint: 'rgba(255,170,90,0.08)', storeys: 2
    },
    museum: {
      inside: true, rockHouse: true, bare: true, roof: ['#1c2628', '#2a3638', '#101618'], cap: null,
      face: ['#3e7a7e', '#4a888c', '#2a585c'], trim: ['#e8dcc0', '#3a2a1e'], base: '#3a2a20',
      glass: ['#2a3a5a', '#7aa0c8'], lit: '#ffd690', frame: '#2a1e14', door: ['#4a3022', '#6a4630', '#2a1a10'],
      rock: ['#3a4a4a', '#4a5a5a', '#2a3434'], rockCap: ['#1c2628', '#2a3638', '#101618'],
      ground: ['#e2dccd', '#f2ede2', '#b8b0a0'], ground2: ['#8a5a34', '#a8703e', '#5e3c20'], ground3: ['#2a7a72', '#3a9a8e', '#1a524c'],
      ground4: ['#e6e0d4', '#3a6a6a', '#b8b0a2'], ground5: ['#7a2a2a', '#c89a4a', '#4a1a1a'],
      road: ['#e2dccd', '#f2ede2', '#b8b0a0'], rail: ['#8a8070', '#c8b89a', '#3a3028'],
      drop: ['#101618', '#1c2628', '#000000'], lamp: '#ffe0a0', night: 0, edge: '#101618', tint: 'rgba(255,220,160,0.04)', storeys: 2
    },
    cable: {
      inside: true, rockHouse: true, roof: ['#16181e', '#22252e', '#0c0e12'], cap: null,
      face: ['#8a9098', '#a2a8b0', '#6a7078'], trim: ['#c8cdd4', '#3a3e46'], base: '#4a4e58',
      glass: ['#2a3a5a', '#7aa0c8'], lit: '#ffd690', frame: '#22252e', door: ['#4a4e58', '#6a707c', '#2a2c34'],
      rock: ['#3a3e46', '#4a4e58', '#2a2c34'], rockCap: ['#16181e', '#22252e', '#0c0e12'],
      ground: ['#9a9890', '#b2b0a8', '#787670'], ground2: ['#7a7a74', '#8e8e88', '#5e5e58'], ground3: ['#c8a050', '#e8c070', '#8a6a2a'],
      ground4: ['#a8a69e', '#3a3e46', '#868480'], ground5: ['#5a5e68', '#e0b040', '#3a3e46'],
      road: ['#4a4e58', '#5a5e68', '#34363e'], rail: ['#a0aab6', '#dde4ec', '#4a4e56'],
      drop: ['#0c0e12', '#16181e', '#000000'], lamp: '#fff0c8', night: 0, edge: '#0c0e12', tint: 'rgba(120,150,200,0.06)', storeys: 2
    }
  };

  function insideFloor(P, Z, kind, e) {
    const r = i => hash(e.x * 13 + i, e.y * 7 + i * 3, 181);
    switch (kind) {
      case 'floor2': {
        const [b, hi, dk] = Z.ground2;
        P(0, 0, U, U, b);
        for (let y = 0; y < U; y += 4) { P(0, y + 3, U, 1, dk); const o = ((e.y * 4 + y) % 8) ? 3 : 9; P(o, y, 1, 3, dk); P(0, y, U, 1, hi); }
        return;
      }
      case 'floor3': case 'floor5': {
        const [b, hi, dk] = kind === 'floor3' ? Z.ground3 : Z.ground5;
        P(0, 0, U, U, b);
        if (kind === 'floor3') P.dither(0, 0, U, U, dk, (e.x + e.y) & 1);
        if (!e.same.u) { P(0, 0, U, 2, dk); P(0, 2, U, 1, hi); }
        if (!e.same.d) { P(0, U - 3, U, 1, hi); P(0, U - 2, U, 2, dk); }
        if (!e.same.l) { P(0, 0, 2, U, dk); P(2, 0, 1, U, hi); }
        if (!e.same.r) { P(U - 3, 0, 1, U, hi); P(U - 2, 0, 2, U, dk); }
        return;
      }
      case 'floor4': {
        const [b, mid, dk] = Z.ground4;
        P(0, 0, U, U, b);
        P.tri([8, 2, 14, 8, 8, 14, 2, 8], mid);
        P(0, 0, U, 1, dk); P(0, 0, 1, U, dk);
        return;
      }
      default: {
        const [b, hi, dk] = Z.ground;
        P(0, 0, U, U, b);
        P(0, 0, U, 1, hi); P(0, 0, 1, U, hi); P(U - 1, 0, 1, U, dk); P(0, U - 1, U, 1, dk);
        if (r(1) > 0.6) P.line(Math.floor(r(2) * 8), Math.floor(r(3) * 16), 8 + Math.floor(r(4) * 8), Math.floor(r(5) * 16), dk);
      }
    }
  }

  function insideWall(P, Z, ro, ch, e, sides) {
    const [b, hi, dk] = Z.face;
    P(0, 0, U, U, b);
    for (let x = 1; x < U; x += 4) P(x, 0, 1, U, hi);
    if (!sides.l) P(0, 0, 2, U, dk);
    if (!sides.r) P(U - 2, 0, 2, U, dk);
    if (ro === 'high') {
      if (e.top) { P(0, 0, U, 3, Z.trim[0]); P(0, 3, U, 1, Z.trim[1]); }
      if (ch === 'window') {
        P(3, e.top ? 5 : 2, 10, U - (e.top ? 5 : 2), Z.frame);
        P(4, e.top ? 6 : 3, 8, U - (e.top ? 6 : 3), Z.glass[0]); P(5, e.top ? 7 : 4, 2, U - (e.top ? 8 : 5), Z.glass[1]); P(7, e.top ? 6 : 3, 1, U, Z.frame);
        P(1, e.top ? 4 : 1, 3, U, '#8a2a2a'); P(12, e.top ? 4 : 1, 3, U, '#8a2a2a'); P(1, e.top ? 4 : 1, 1, U, '#b84a3a');
      } else if (ch === 'housedoor' || ch === 'gate') {
        P(3, e.top ? 5 : 2, 10, U, Z.trim[1]); P(4, e.top ? 6 : 3, 8, U, Z.door[0]); P(4, e.top ? 6 : 3, 8, 1, Z.door[1]);
        if (ch === 'gate') { P(0, e.top ? 5 : 2, U, U, Z.door[2]); P(7, e.top ? 6 : 3, 2, U, Z.door[1]); }
      } else if (hash(e.x, e.y, 191) > 0.82 && sides.l && sides.r) { P(4, 5, 8, 7, Z.trim[1]); P(5, 6, 6, 5, Z.glass[1]); P(6, 7, 3, 2, Z.trim[0]); }
      return;
    }
    P(0, 6, U, 2, Z.trim[0]); P(0, 8, U, U - 8, Z.base); P(0, 8, U, 1, Z.trim[1]);
    for (let x = 2; x < U; x += 8) { P(x, 10, 5, 4, Z.trim[1]); P(x + 1, 11, 3, 2, Z.base); }
    P(0, U - 1, U, 1, '#000000');
    if (ch === 'window') {
      P(3, 0, 10, 7, Z.frame); P(4, 0, 8, 6, Z.glass[0]); P(7, 0, 1, 6, Z.frame); P(2, 6, 12, 2, Z.trim[0]);
      P(1, 0, 3, 8, '#8a2a2a'); P(12, 0, 3, 8, '#8a2a2a');
    } else if (ch === 'housedoor' || ch === 'gate') {
      P(3, 0, 10, U - 1, Z.trim[1]); P(4, 0, 8, U - 1, Z.door[0]); P(7, 0, 2, U - 1, Z.door[2]); P(5, 8, 1, 1, Z.trim[0]); P(10, 8, 1, 1, Z.trim[0]);
      if (ch === 'gate') { P(0, 0, U, U - 1, Z.door[0]); P(7, 0, 2, U - 1, Z.door[2]); P(0, 0, U, 1, Z.door[1]); }
    }
  }

  const BUILD = new Set(['house', 'window', 'housedoor', 'gate']);
  const PROPS = new Set(['tree', 'crate', 'pipe', 'console', 'lamp', 'fence', 'statue', 'table', 'crystal', 'shelf', 'block']);

  function cobble(P, Z, e, r) {
    const [b, hi, dk] = Z.ground;
    P(0, 0, U, U, dk);
    for (let row = 0; row < 4; row++) for (let col = -1; col < 3; col++) {
      const x = col * 6 + (row % 2 ? 3 : 0) + 1, y = row * 4 + 1, x0 = Math.max(0, x), w = Math.min(x + 5, U) - x0;
      if (w <= 0) continue;
      const k = hash(e.x * 4 + col, e.y * 4 + row, 147);
      P(x0, y, w, 3, k > 0.8 ? hi : b);
      P(x0, y, w, 1, k > 0.8 ? '#d2cabe' : hi);
      if (k < 0.15) P(x0, y + 2, w, 1, dk);
    }
    if (Z.snow && r(1) > 0.55) {
      const sx = Math.floor(r(2) * 10), sy = Math.floor(r(3) * 10), sw = 3 + Math.floor(r(4) * 6);
      P(sx, sy, sw, 2, Z.snow); P(sx + 1, sy + 2, Math.max(1, sw - 2), 1, Z.snow);
    }
  }

  function floorPaint(P, Z, kind, e) {
    if (Z.inside) return insideFloor(P, Z, kind, e);
    const r = i => hash(e.x * 13 + i, e.y * 7 + i * 3, 141);
    switch (kind) {
      case 'floor': {
        if (Z.amber) {
          const [b, hi, dk] = Z.ground;
          P(0, 0, U, U, b);
          const k = (e.x + e.y) & 1;
          if (k) P.tri([0, 0, U, 0, 0, U], '#d89a3a'); else P.tri([U, 0, U, U, 0, U], '#b8741e');
          P.line(k ? 0 : U - 1, k ? U - 1 : 0, k ? U - 1 : 0, k ? 0 : U - 1, hi);
          if (r(3) > 0.6) { const x = Math.floor(r(4) * 12) + 2, y = Math.floor(r(5) * 12) + 2; P(x, y, 2, 1, '#fff4c8'); P(x, y + 1, 1, 1, '#ffffff'); }
          if (!e.same.u) { P(0, 0, U, 2, '#fff0c0'); P(0, 2, U, 1, hi); }
          if (!e.same.d) { P(0, U - 4, U, 4, dk); P(0, U - 1, U, 1, '#2a1406'); }
          if (!e.same.l) P(0, 0, 1, U, '#fff0c0');
          if (!e.same.r) P(U - 1, 0, 1, U, dk);
          return;
        }
        if (Z.ice) {
          const [b, hi, dk] = Z.ground;
          P(0, 0, U, U, b);
          for (let i = 0; i < 3; i++) { const y = 2 + Math.floor(r(i) * 12), x = Math.floor(r(i + 4) * 8); P(x, y, 5 + Math.floor(r(i + 8) * 6), 1, dk); P(x + 1, y - 1, 3, 1, hi); }
          if (r(12) > 0.82) P.dot(Math.floor(r(13) * 15), Math.floor(r(14) * 15), '#ffffff');
          return;
        }
        cobble(P, Z, e, r);
        return;
      }
      case 'floor2': {
        const [b, hi, dk] = Z.ground2;
        P(0, 0, U, U, b);
        if (Z.ice && !Z.deck) { for (let i = 0; i < 2; i++) { const x = 3 + i * 7 + Math.floor(r(i) * 2), y = 2 + Math.floor(r(i + 2) * 10); P(x, y, 2, 3, dk); P(x + 1, y + 1, 1, 1, hi); } return; }
        if (Z === LANDS.cavern) { for (let i = 0; i < 4; i++) { P(0, i * 4 + 3, U, 1, dk); P(0, i * 4, U, 1, hi); } P(((e.x * 5) % 12) + 2, 1, 1, 2, dk); return; }
        P(0, 0, U, 1, hi); P(0, 0, 1, U, hi); P(U - 1, 0, 1, U, dk); P(0, U - 1, U, 1, dk);
        P(0, 7, U, 1, dk); if ((e.x + e.y) % 2) P(7, 0, 1, 7, dk); else P(7, 8, 1, 8, dk);
        if (Z.snow && r(5) > 0.7) P(2 + Math.floor(r(6) * 8), 2 + Math.floor(r(7) * 8), 4, 2, Z.snow);
        return;
      }
      case 'floor4': case 'floor5': cobble(P, Z, e, r); if (kind === 'floor5') P.dither(0, 0, U, U, Z.ground[1], (e.x + e.y) & 1); return;
      case 'floor3': {
        const [b, hi, dk] = Z.ground3;
        P(0, 0, U, U, b);
        if (Z.ice) { const k = hash(e.x, e.y, 149); P.oval(8, 9, 7, 3, hi); P(2 + Math.floor(k * 8), 11, 6, 1, dk); return; }
        P(0, 0, U, 1, dk); P(0, 0, 1, U, dk);
        P(4, 4, 8, 8, hi); P(5, 5, 6, 6, b); P(7, 7, 2, 2, dk);
        if (Z.snow && r(5) > 0.8) P(1, 10, 6, 2, Z.snow);
        return;
      }
      case 'road': {
        const [b, hi, dk] = Z.road;
        P(0, 0, U, U, b);
        P.dither(0, 0, U, U, dk, (e.x + e.y) & 1);
        if (!e.same.u) P(0, 0, U, 1, hi);
        if (!e.same.d) P(0, U - 1, U, 1, dk);
        if (Z.snow && r(2) > 0.5) { P(0, Math.floor(r(3) * 12), 3 + Math.floor(r(4) * 5), 2, Z.snow); }
        return;
      }
      case 'rail': {
        const [b, hi, dk] = Z.rail;
        if (Z === LANDS.cavern) {
          P(0, 0, U, U, Z.road[0]); P.dither(0, 0, U, U, Z.road[2], (e.x + e.y) & 1);
          if (e.railV) { for (let y = 1; y < U; y += 4) P(1, y, U - 2, 2, Z.ground2[2]); P(3, 0, 2, U, b); P(11, 0, 2, U, b); P(3, 0, 1, U, hi); P(11, 0, 1, U, hi); }
          else { for (let x = 1; x < U; x += 4) P(x, 1, 2, U - 2, Z.ground2[2]); P(0, 3, U, 2, b); P(0, 11, U, 2, b); P(0, 3, U, 1, hi); P(0, 11, U, 1, hi); }
          return;
        }
        const [rb, rhi, rdk] = Z.road;
        P(0, 0, U, U, rb); P.dither(0, 0, U, U, rdk, (e.x * 3 + e.y) & 1);
        if (e.railV) { P(e.same.l ? 2 : 3, 0, 2, U, dk); P(e.same.l ? 2 : 3, 0, 1, U, hi); if (!e.same.l) P(0, 0, 1, U, Z.ground[2]); if (!e.same.r) P(U - 1, 0, 1, U, Z.ground[2]); }
        else { P(0, 4, U, 2, dk); P(0, 10, U, 2, dk); P(0, 4, U, 1, hi); P(0, 10, U, 1, hi); }
        return;
      }
      case 'stairs': {
        const [b, hi, dk] = Z.ground3;
        for (let y = 0; y < U; y += 4) { P(0, y, U, 4, b); P(0, y, U, 1, hi); P(0, y + 3, U, 1, dk); }
        if (Z.snow) for (let y = 1; y < U; y += 4) if (r(y) > 0.6) P(Math.floor(r(y + 1) * 10), y, 5, 1, Z.snow);
        return;
      }
      case 'bridge': {
        const [b, hi, dk] = Z === LANDS.cavern ? Z.ground2 : Z.ground3;
        P(0, 0, U, U, b);
        if (e.bridgeV) { P(0, 0, 2, U, dk); P(U - 2, 0, 2, U, dk); for (let y = 2; y < U; y += 4) P(2, y, U - 4, 1, hi); }
        else { P(0, 0, U, 2, dk); P(0, U - 2, U, 2, dk); for (let x = 2; x < U; x += 4) P(x, 2, 1, U - 4, hi); }
        return;
      }
      case 'chasm': {
        const [b, hi, dk] = Z.drop;
        P(0, 0, U, U, b);
        if (Z.amber) {
          if (r(1) > 0.8) P.dot(Math.floor(r(2) * 15), Math.floor(r(3) * 15), r(4) > 0.5 ? '#ffffff' : '#ffd070');
          if (r(5) > 0.93) { const x = Math.floor(r(6) * 12) + 2, y = Math.floor(r(7) * 12) + 2; P(x - 1, y, 3, 1, hi); P(x, y - 1, 1, 3, hi); P.dot(x, y, '#ffffff'); }
          if (!e.same.u) { P(0, 0, U, 2, '#5a3a1a'); P(0, 2, U, 2, '#2a1406'); }
          return;
        }
        if (Z.ice) {
          P.dither(0, 0, U, U, hi, (e.x * 3 + e.y) & 1);
          if (r(1) > 0.6) P.line(Math.floor(r(2) * 8), Math.floor(r(3) * 16), 8 + Math.floor(r(4) * 8), Math.floor(r(5) * 16), dk);
          if (!e.same.u) { P(0, 0, U, 3, Z.ground[0]); P(0, 3, U, 1, dk); }
          return;
        }
        if (!e.same.u) { P(0, 0, U, 5, hi); P(0, 5, U, 1, Z.edge); }
        P.dither(0, 6, U, U - 6, dk, (e.x + e.y) & 1);
        return;
      }
      case 'door': {
        const [b, hi, dk] = Z.door;
        P(0, 0, U, U, dk); P(2, 0, U - 4, U, b); P(3, 0, 1, U, hi);
        return;
      }
      default: cobble(P, Z, e, r);
    }
  }

  function rockFace(P, Z, ro, e) {
    const [b, hi, dk] = Z.rock, r = i => hash(e.x * 5 + i, e.y * 11 + i, 151);
    P(0, 0, U, U, b);
    for (let i = 0; i < 3; i++) { const x = Math.floor(r(i) * 12), y = Math.floor(r(i + 3) * 14); P(x, y, 3 + Math.floor(r(i + 6) * 4), 1, dk); P(x + 1, y + 1, 2, 1, hi); }
    if (ro === 'low') { P(0, U - 3, U, 3, dk); P(0, U - 1, U, 1, '#000000'); }
    if ((ro === 'high' || e.capTop) && Z.cap) { P(0, 0, U, 3, Z.rockCap[0]); P(0, 0, U, 1, Z.rockCap[1]); P(Math.floor(r(9) * 8), 3, 6, 1, Z.rockCap[2]); P(Math.floor(r(10) * 10), 3, 3, 2, Z.rockCap[0]); }
  }

  function rockTop(P, Z, e, open) {
    const [b, hi, dk] = Z.rockCap, r = i => hash(e.x * 7 + i, e.y * 3 + i, 153);
    P(0, 0, U, U, b);
    if (Z.cap) {
      if (e.deep) P.dither(0, 0, U, U, dk, (e.x + e.y) & 1);
      if (r(1) > 0.45) { const x = Math.floor(r(2) * 10), y = Math.floor(r(3) * 11); P(x, y, 5, 3, Z.rock[1]); P(x, y, 5, 1, hi); P(x + 1, y + 3, 4, 1, Z.rock[2]); }
      if (r(6) > 0.7) P(Math.floor(r(7) * 12), Math.floor(r(8) * 13), 4, 1, hi);
    } else { P.dither(0, 0, U, U, hi, (e.x + e.y) & 1); if (r(6) > 0.85) P(Math.floor(r(7) * 12), Math.floor(r(8) * 12), 2, 2, Z.rock[1]); }
    if (open.l) { P(0, 0, 3, U, Z.rock[0]); P(0, 0, 1, U, Z.rock[2]); }
    if (open.r) { P(U - 3, 0, 3, U, Z.rock[0]); P(U - 1, 0, 1, U, Z.rock[2]); }
    if (open.u) { P(0, 0, U, 2, Z.cap ? '#ffffff' : Z.rock[1]); P(0, 2, U, 1, Z.rock[1]); }
  }

  function roofTile(P, Z, e, open, eave) {
    const [b, hi, dk] = Z.roof, r = i => hash(e.x * 17 + i, e.y * 5 + i, 157);
    if (Z.inside) {
      P(0, 0, U, U, b);
      if (open.l) P(0, 0, 2, U, hi);
      if (open.r) P(U - 2, 0, 2, U, hi);
      if (open.u) P(0, 0, U, 2, hi);
      if (eave) { P(0, U - 2, U, 2, hi); P(0, U - 1, U, 1, Z.trim[0]); }
      return;
    }
    P(0, 0, U, U, b);
    for (let y = 3; y < U; y += 4) { P(0, y, U, 1, dk); for (let x = (y % 8 === 3 ? 2 : 6); x < U; x += 8) P(x, y - 3, 1, 3, dk); }
    P(0, 0, U, 1, hi);
    if (Z.cap) {
      const [s, shi, sdk] = Z.cap;
      if (r(1) > 0.35) { const sx = Math.floor(r(2) * 6), sw = 6 + Math.floor(r(3) * 10); P(sx, 0, Math.min(sw, U - sx), 3 + Math.floor(r(4) * 3), s); P(sx, 0, Math.min(sw, U - sx), 1, shi); }
      if (r(5) > 0.6) P(Math.floor(r(6) * 10), 8 + Math.floor(r(7) * 4), 5, 2, s);
      if (open.u) { P(0, 0, U, 3, s); P(0, 0, U, 1, shi); P(0, 3, U, 1, sdk); }
    }
    if (r(9) > 0.93 && !eave) {
      P(5, 3, 6, 8, '#6a3a2e'); P(5, 3, 6, 1, '#8a5040'); P(4, 2, 8, 2, Z.cap ? Z.cap[0] : '#4a4446');
      P(6, 5, 1, 5, '#4a2820');
    }
    if (open.l) P(0, 0, 1, U, Z.edge);
    if (open.r) P(U - 1, 0, 1, U, Z.edge);
    if (eave) {
      P(0, U - 4, U, 2, Z.trim[1]); P(0, U - 2, U, 2, Z.trim[0]);
      if (Z.cap) { P(0, U - 5, U, 1, Z.cap[0]); for (let x = 1; x < U; x += 3) if (r(x) > 0.5) P(x, U - 1, 1, 2 + Math.floor(r(x + 1) * 2), '#dff2ff'); }
    }
  }

  function windowAt(P, Z, x0, y0, w, h, lit, seed) {
    P(x0 - 1, y0 - 1, w + 2, h + 2, Z.trim[1]);
    P(x0, y0, w, h, Z.frame);
    const gl = lit ? Z.lit : Z.glass[0];
    P(x0 + 1, y0 + 1, w - 2, h - 2, gl);
    if (!lit) { P(x0 + 1, y0 + 1, 2, h - 2, Z.glass[1]); P.dot(x0 + w - 3, y0 + 2, Z.glass[1]); }
    else if (hash(seed, 3, 161) > 0.5) P(x0 + 1, y0 + h - 3, w - 2, 2, '#ffe8b8');
    P(x0 + Math.floor(w / 2), y0, 1, h, Z.frame);
    P(x0, y0 + Math.floor(h / 2), w, 1, Z.frame);
    P(x0 - 1, y0 + h, w + 2, 1, Z.trim[0]);
    if (Z.cap) P(x0 - 1, y0 + h + 1, w + 2, 1, Z.cap[0]);
  }

  function faceTile(P, Z, ro, ch, e, sides) {
    if (Z.inside) return insideWall(P, Z, ro, ch, e, sides);
    const [b, hi, dk] = Z.face, r = i => hash(e.x * 23 + i, e.y * 9 + i, 163);
    const lit = r(1) < Z.night;
    P(0, 0, U, U, b);
    if (Z === LANDS.cavern) { for (let y = 2; y < U; y += 4) { P(0, y, U, 1, dk); for (let x = (y % 8 === 2 ? 0 : 4); x < U; x += 8) P(x, y - 3, 1, 3, dk); } }
    else for (let y = 5; y < U; y += 5) P(0, y, U, 1, hi);
    if (!sides.l) { P(0, 0, 2, U, Z.trim[0]); P(2, 0, 1, U, dk); }
    if (!sides.r) { P(U - 2, 0, 2, U, Z.trim[1]); P(U - 3, 0, 1, U, dk); }
    if (ro === 'high') {
      if (e.top) { P(0, 0, U, 2, Z.trim[0]); P(0, 2, U, 1, dk); }
      else P(0, 0, U, 1, Z.trim[1]);
      if (ch === 'window') windowAt(P, Z, 4, e.top ? 4 : 3, 8, 10, lit, e.x * 31 + e.y);
      else if (ch === 'housedoor') { P(3, 4, 10, 12, Z.trim[1]); P(4, 5, 8, 11, Z.door[2]); P(5, 6, 6, 10, Z.glass[0]); }
      else if (ch === 'gate') { P(0, 3, U, 13, '#1a1c22'); for (let x = 1; x < U; x += 3) P(x, 3, 1, 13, '#4a4e58'); P(0, 3, U, 1, '#6a707c'); }
      else if (r(4) > 0.85 && sides.l && sides.r) { P(7, 3, 2, 13, dk); P(7, 3, 1, 13, hi); }
      return;
    }
    P(0, U - 3, U, 3, Z.base); P(0, U - 3, U, 1, Z.trim[1]);
    if (ch === 'window') {
      if (r(5) > 0.5 && Z !== LANDS.plains) { P(1, 1, U - 2, 10, Z.trim[1]); P(2, 2, U - 4, 8, lit || Z.night > 0.5 ? Z.lit : Z.glass[0]); P(2, 2, U - 4, 1, '#ffffff'); P(2, 9, U - 4, 1, Z.frame); }
      else windowAt(P, Z, 4, 2, 8, 8, lit, e.x * 37 + e.y);
    } else if (ch === 'housedoor') {
      P(2, 0, 12, 13, Z.trim[1]); P(3, 1, 10, 12, Z.door[0]);
      P(3, 1, 10, 1, Z.door[1]); P(7, 1, 2, 12, Z.door[2]); P(5, 7, 1, 1, Z.trim[0]); P(10, 7, 1, 1, Z.trim[0]);
      P(2, 13, 12, 1, '#000000');
    } else if (ch === 'gate') {
      P(0, 0, U, 13, '#16181e'); for (let x = 1; x < U; x += 3) { P(x, 0, 1, 13, '#4a4e58'); P.dot(x, 1, '#8a909c'); }
      P(0, 6, U, 1, '#6a707c');
    } else if (r(6) > 0.88) {
      P(5, 3, 6, 7, Z.trim[1]); P(6, 4, 4, 5, Z.glass[0]); P(6, 4, 4, 1, Z.glass[1]);
    }
  }

  function propSprite(kind, Z, land, x, y) {
    const r = i => hash(x * 7 + i, y * 13 + i, 171);
    const st = S();
    switch (kind) {
      case 'tree': return {
        up: 26, cv: spr(U, U, 26, P => {
          P.shadow(8, 39, 7, 2);
          if (land === 'cavern') { P(7, 10, 2, 30, '#2a2018'); P.line(8, 18, 3, 12, '#2a2018'); P.line(8, 24, 13, 17, '#2a2018'); P.oval(8, 9, 4, 3, '#3a6a4a'); return; }
          P(7, 20, 2, 20, '#4a3a2e'); P(7, 20, 1, 20, '#6a5444');
          for (let i = 0; i < 4; i++) { const yy = 4 + i * 6, w = 2 + i * 2; P.tri([8, yy - 3, 8 - w - 1, yy + 4, 8 + w + 1, yy + 4], '#2e4a42'); P.tri([8, yy - 3, 8 - w, yy + 2, 8 + w, yy + 2], Z.cap ? Z.cap[0] : '#4a6a5a'); }
          P(7, 0, 2, 2, Z.cap ? '#ffffff' : '#4a6a5a');
        })
      };
      case 'lamp': return {
        up: 28, light: [8, -24, 34, Z.lamp, Z.night > 0.5 ? 0.42 : 0.18],
        cv: spr(U, U, 28, P => {
          P.shadow(8, 40, 4, 2);
          P(6, 40, 4, 2, '#2a2c34'); P(7, 6, 2, 34, '#2a2c34'); P(7, 6, 1, 34, '#5a5e6a');
          P(4, 2, 8, 6, '#2a2c34'); P(5, 3, 6, 4, Z.lamp); P(5, 3, 6, 1, '#ffffff'); P(3, 1, 10, 1, '#2a2c34');
          if (land === 'city') { P(9, 12, 5, 9, '#2a5aa8'); P(9, 12, 5, 1, '#ffffff'); P(10, 15, 3, 1, '#ffffff'); P(9, 20, 5, 1, '#1a3a78'); }
        })
      };
      case 'crate': return {
        up: 6, cv: spr(U, U, 6, P => {
          P.shadow(8, 20, 7, 2);
          P(2, 6, 12, 14, '#7a5a3a'); P(2, 6, 12, 1, '#a07a50'); P(2, 6, 1, 14, '#a07a50'); P(13, 6, 1, 14, '#4a3420'); P(2, 19, 12, 1, '#3a2818');
          P.line(3, 7, 12, 18, '#5a4028'); P(2, 12, 12, 1, '#5a4028');
          if (Z.cap) P(2, 5, 12, 2, Z.cap[0]);
        })
      };
      case 'pipe': return {
        up: 4, cv: spr(U, U, 4, P => {
          P(0, 6, U, 6, '#4a4e58'); P(0, 6, U, 1, '#7a808c'); P(0, 11, U, 1, '#2a2c34');
          if (r(1) > 0.6) { P(6, 4, 4, 10, '#5a5e68'); P(6, 4, 4, 1, '#8a909c'); }
          if (r(2) > 0.8) { P.dot(3, 13, '#c8e0ff'); P.dot(4, 15, '#c8e0ff'); }
        })
      };
      case 'crystal': {
        const col = land === 'cavern' ? ['#ff9a3a', '#ffd890', '#a04a1a'] : ['#56d4ff', '#c8f4ff', '#1a6a9a'];
        return {
          up: 12, light: [8, -2, 26, col[0], 0.3, true],
          cv: spr(U, U, 12, P => {
            P.shadow(8, 26, 6, 2);
            P.tri([8, 0, 3, 18, 13, 18], col[2]); P.tri([8, 0, 5, 16, 9, 18], col[0]); P.tri([8, 2, 7, 12, 9, 8], col[1]);
            P.tri([3, 10, 0, 24, 6, 24], col[0]); P.tri([13, 12, 16, 24, 10, 24], col[2]);
          })
        };
      }
      case 'fence': return {
        up: 6, cv: spr(U, U, 6, P => {
          P(0, 8, U, 1, '#2a2c34'); P(0, 14, U, 1, '#2a2c34');
          for (let x = 1; x < U; x += 4) { P(x, 4, 1, 14, '#2a2c34'); P.dot(x, 3, '#5a5e6a'); }
          if (Z.cap) P(0, 7, U, 1, Z.cap[0]);
        })
      };
      case 'statue': return {
        up: 4, cv: spr(U, U, 4, P => {
          P(0, 6, U, 14, '#8a8490'); P(0, 6, U, 2, '#c8c2cc'); P(0, 19, U, 1, '#4a4650');
          if (Z.cap) P(1, 4, 14, 2, Z.cap[0]);
        })
      };
      case 'table': return {
        up: 4, cv: spr(U, U, 4, P => { P.shadow(8, 18, 7, 2); P(1, 6, 14, 5, '#7a5a3a'); P(1, 6, 14, 1, '#a07a50'); P(2, 11, 2, 7, '#4a3420'); P(12, 11, 2, 7, '#4a3420'); })
      };
      case 'shelf': return {
        up: 14, cv: spr(U, U, 14, P => {
          P(1, 2, 14, 28, '#5a3a24'); P(1, 2, 14, 1, '#7a5434');
          for (let y = 9; y < 30; y += 7) { P(2, y, 12, 1, '#3a2414'); for (let x = 3; x < 13; x += 3) P(x, y - 5, 2, 5, ['#8a3a3a', '#3a5a8a', '#6a8a3a', '#a08a4a'][(x + y) % 4]); }
        })
      };
      case 'console': return {
        up: 6, cv: spr(U, U, 6, P => { P(2, 4, 12, 16, '#3a3e48'); P(2, 4, 12, 1, '#6a707c'); P(4, 7, 8, 5, '#103a2a'); P(5, 8, 5, 1, '#5aff9a'); P(5, 10, 3, 1, '#5aff9a'); })
      };
      case 'block': if (Z.bare) return null; return { up: 0, cv: spr(U, U, 0, P => { P(0, 0, U, U, Z.ground3[2]); P(1, 1, U - 2, U - 2, Z.ground3[0]); P(1, 1, U - 2, 1, Z.ground3[1]); }) };
    }
    return null;
  }

  const DECOR = {
    wanted: {
      w: 1, h: 1, up: 22,
      draw(P, v) {
        const hair = { trail: '#c8c8d0', danheng: '#1a1a2a', danheng2: '#1a1a2a', march: '#f0b8d8', march2: '#f0b8d8', sampo: '#2a4aa8', sampo2: '#2a4aa8' }[v] || '#888';
        P.shadow(8, 37, 6, 2);
        P(3, 4, 10, 34, '#5a3a2a'); P(2, 2, 12, 3, '#3a2418'); P(2, 36, 12, 2, '#3a2418');
        P(3, 8, 10, 16, '#e8dcc0'); P(3, 8, 10, 2, '#a8302a');
        P.oval(8, 15, 3, 3, '#f0d0b8'); P(5, 12, 6, 3, hair); P(4, 19, 8, 4, v && v.endsWith('2') ? '#7a5aa8' : '#4a6a9a');
        P(4, 25, 8, 1, '#2a2018'); P(5, 27, 6, 1, '#2a2018');
      }
    },
    sofa: {
      w: 2, h: 1, up: 8,
      draw(P, v) {
        const c = v === 'red' ? ['#8a2a2a', '#b84a3a', '#5a1a1a'] : ['#2a7a7a', '#3a9a94', '#1a5252'];
        P.shadow(16, 21, 15, 2);
        P(1, 2, 30, 8, c[2]); P(2, 3, 28, 6, c[0]); P(2, 3, 28, 1, c[1]);
        P(0, 8, 32, 10, c[0]); P(0, 8, 32, 1, c[1]); P(0, 17, 32, 2, c[2]);
        P(0, 6, 4, 12, c[2]); P(28, 6, 4, 12, c[2]);
        P(7, 9, 6, 5, '#e8902a'); P(19, 9, 6, 5, '#e8902a'); P(7, 9, 6, 1, '#ffc060'); P(19, 9, 6, 1, '#ffc060');
        P(2, 19, 2, 3, '#3a2618'); P(28, 19, 2, 3, '#3a2618');
      }
    },
    armchair: {
      w: 1, h: 1, up: 8,
      draw(P, v) {
        const c = v === 'red' ? ['#8a2a2a', '#b84a3a', '#5a1a1a'] : ['#2a7a7a', '#3a9a94', '#1a5252'];
        P.shadow(8, 21, 7, 2); P(2, 2, 12, 8, c[2]); P(3, 3, 10, 6, c[0]); P(1, 8, 14, 10, c[0]); P(1, 8, 14, 1, c[1]); P(1, 6, 3, 12, c[2]); P(12, 6, 3, 12, c[2]); P(3, 19, 2, 3, '#3a2618'); P(11, 19, 2, 3, '#3a2618');
      }
    },
    counter: {
      w: 3, h: 1, up: 10,
      draw(P, v) {
        const wood = v === 'iron' ? ['#3a3e48', '#5a5e6a', '#24262e'] : ['#6a4228', '#8a5a36', '#3e2414'];
        P.shadow(24, 23, 23, 2);
        P(0, 4, 48, 6, '#e8dcc0'); P(0, 4, 48, 1, '#ffffff'); P(0, 10, 48, 12, wood[0]); P(0, 10, 48, 1, wood[1]);
        for (let x = 4; x < 48; x += 11) { P(x, 12, 7, 8, wood[2]); P(x + 1, 13, 5, 6, wood[0]); }
        P(6, 0, 4, 4, '#c8a050'); P(7, 1, 2, 2, '#ffe890'); P(36, 1, 8, 3, '#f4ecd8');
      }
    },
    desk: {
      w: 3, h: 1, up: 12,
      draw(P) {
        P.shadow(24, 23, 23, 2);
        P(0, 4, 48, 8, '#4a3020'); P(0, 4, 48, 2, '#6a4630'); P(1, 12, 46, 10, '#3a2418'); P(2, 13, 44, 1, '#c8a050');
        P(6, 0, 10, 5, '#f4ecd8'); P(7, 1, 8, 2, '#e8dcc0'); P(30, 1, 6, 3, '#2a2a34'); P(38, 0, 2, 5, '#c8a050'); P(36, 0, 6, 2, '#e8dcc0');
      }
    },
    bed: {
      w: 2, h: 2, up: 6,
      draw(P, v) {
        const c = v === 'blue' ? ['#4a6a9a', '#6a8aba', '#2a4a7a'] : ['#8a2a3a', '#b84a5a', '#5a1a24'];
        P.shadow(16, 36, 15, 3);
        P(1, 0, 30, 10, '#5a3a24'); P(1, 0, 30, 2, '#7a5434');
        P(2, 8, 28, 26, '#f4ecdc'); P(3, 9, 12, 7, '#ffffff'); P(17, 9, 12, 7, '#ffffff');
        P(2, 18, 28, 16, c[0]); P(2, 18, 28, 2, c[1]); P(2, 32, 28, 2, c[2]);
        P(1, 34, 30, 3, '#5a3a24');
      }
    },
    wardrobe: {
      w: 1, h: 1, up: 20,
      draw(P) { P.shadow(8, 37, 7, 2); P(1, 2, 14, 34, '#5a3a24'); P(1, 2, 14, 2, '#7a5434'); P(2, 5, 6, 30, '#6a4628'); P(8, 5, 6, 30, '#6a4628'); P(7, 18, 1, 3, '#c8a050'); P(8, 18, 1, 3, '#c8a050'); }
    },
    plant: {
      w: 1, h: 1, up: 14,
      draw(P) {
        P.shadow(8, 30, 6, 2); P(4, 20, 8, 10, '#a85a3a'); P(4, 20, 8, 2, '#c87a4a');
        for (let i = 0; i < 6; i++) { const x = 3 + i * 2; P.line(8, 20, x, 4 + (i % 3) * 4, '#2a6a3a', 2); P.dot(x, 4 + (i % 3) * 4, '#6ac06a'); }
        P.oval(8, 10, 5, 5, '#3a8a4a'); P.oval(7, 8, 3, 3, '#5aaa5a');
      }
    },
    flowers: {
      w: 2, h: 1, up: 8,
      draw(P, v) {
        const cols = v === 'cold' ? ['#a8d8ff', '#ffffff', '#c8a8ff'] : ['#ff7a9a', '#ffd040', '#ff9a40', '#e8507a', '#ffffff'];
        P.shadow(16, 21, 15, 2); P(0, 10, 32, 10, '#6a4a30'); P(0, 10, 32, 2, '#8a6440'); P(0, 19, 32, 1, '#3a2818');
        for (let i = 0; i < 14; i++) { const x = 2 + i * 2, y = 2 + (i * 5) % 7; P.line(x, 11, x, y + 2, '#3a7a3a'); P(x - 1, y, 3, 3, cols[i % cols.length]); }
      }
    },
    gear: {
      w: 2, h: 1, up: 26,
      draw(P) {
        P.shadow(16, 40, 14, 2);
        P(13, 30, 6, 10, '#3a2e1e');
        P.oval(16, 16, 13, 13, '#6a5a3a'); P.oval(16, 16, 10, 10, '#8a7448'); P.oval(16, 16, 5, 5, '#3a2e1e'); P.oval(16, 16, 2, 2, '#c8a050');
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P(Math.round(16 + Math.cos(a) * 14) - 2, Math.round(16 + Math.sin(a) * 14) - 2, 4, 4, '#5a4a2e'); }
      }
    },
    machine: {
      w: 2, h: 1, up: 14,
      draw(P, v) {
        P.shadow(16, 23, 15, 2);
        P(1, 2, 30, 20, '#4a4e58'); P(1, 2, 30, 2, '#7a808c'); P(4, 6, 12, 10, '#101828');
        const on = v === 'on', col = on ? '#ffd040' : '#5a6a8a';
        P(6, 10, 8, 2, col); P(9, 8, 2, 6, col); P(19, 7, 9, 2, '#2a2c34'); P(19, 11, 9, 2, '#2a2c34'); P(20, 16, 3, 3, on ? '#5aff9a' : '#c83a3a');
        P(4, 0, 3, 3, '#5a5e6a'); P(3, 0, 5, 1, '#8a909c');
      },
      lights: v => v === 'on' ? [[10, 0, 20, '#ffd040', 0.25, true]] : []
    },
    sphere: {
      w: 2, h: 2, up: 18,
      draw(P) {
        P.shadow(16, 36, 12, 3);
        P(12, 26, 8, 10, '#5a4a3a'); P(8, 34, 16, 3, '#3a2e22');
        P.oval(16, 17, 12, 12, '#2a4a7a'); P.oval(14, 15, 6, 5, '#e8eef6'); P.oval(20, 20, 4, 3, '#e8eef6');
        P.ring(16, 17, 15, 6, '#c8a050'); P.ring(16, 17, 6, 15, '#c8a050'); P.ring(16, 17, 15, 15, '#8a6a2a');
      }
    },
    papers: {
      w: 1, h: 1, up: 8,
      draw(P) { P.shadow(8, 20, 7, 2); for (let i = 0; i < 5; i++) { P(2 + (i % 2), 14 - i * 3, 12, 3, i % 2 ? '#f4ecd8' : '#e2d6bc'); P(2 + (i % 2), 14 - i * 3, 12, 1, '#ffffff'); } }
    },
    teatable: {
      w: 1, h: 1, up: 6,
      draw(P) { P.shadow(8, 20, 6, 2); P.oval(8, 9, 7, 4, '#6a4228'); P.oval(8, 8, 6, 3, '#8a5a36'); P(7, 11, 2, 8, '#3e2414'); P(5, 5, 3, 3, '#ffffff'); P(9, 6, 3, 2, '#ffffff'); P.dot(6, 6, '#a86a2a'); }
    },
    floorlamp: {
      w: 1, h: 1, up: 24,
      draw(P) { P.shadow(8, 39, 4, 2); P(6, 38, 4, 2, '#3a2a1a'); P(7, 10, 2, 28, '#3a2a1a'); P.tri([2, 10, 14, 10, 11, 2, 5, 2], '#e8c890'); P(4, 9, 8, 1, '#ffe8b8'); },
      lights: () => [[8, -18, 30, '#ffd690', 0.3]]
    },
    chandelier: {
      w: 1, h: 1, up: 0,
      draw(P) {},
      lights: () => [[8, 8, 48, '#ffd690', 0.22]]
    },
    kiosk: {
      w: 2, h: 1, up: 22,
      draw(P, v) {
        const c = v === 'news' ? ['#2a5aa8', '#4a7ac8'] : ['#7a3a2a', '#a85a3a'];
        P.shadow(16, 38, 15, 2);
        P(0, 0, 32, 6, c[0]); P(0, 0, 32, 2, c[1]); for (let x = 0; x < 32; x += 4) P(x, 5, 2, 3, c[1]);
        P(2, 8, 28, 30, '#5a4a3a'); P(3, 9, 26, 12, '#2a2620');
        for (let i = 0; i < 6; i++) P(4 + i * 4, 12 + (i % 2) * 3, 3, 6, ['#e8dcc0', '#c84a3a', '#4a7ac8', '#e8c050'][i % 4]);
        P(2, 22, 28, 3, '#e8dcc0'); P(2, 25, 28, 13, '#6a5a48');
      }
    },
    phonebooth: {
      w: 1, h: 1, up: 24,
      draw(P) {
        P.shadow(8, 39, 7, 2); P(1, 0, 14, 40, '#a8302a'); P(1, 0, 14, 2, '#d85a4a'); P(3, 4, 10, 30, '#3a4a5a'); P(3, 4, 10, 1, '#8ab0d0');
        for (let y = 10; y < 34; y += 8) P(3, y, 10, 1, '#a8302a'); P(2, 36, 12, 3, '#6a1a14'); P(5, 1, 6, 2, '#ffe8b8');
      }
    },
    fountain: {
      w: 2, h: 2, up: 10,
      draw(P) {
        P.shadow(16, 38, 15, 3);
        P.oval(16, 26, 15, 9, '#8a8490'); P.oval(16, 25, 13, 7, '#4a7aa8'); P.oval(14, 24, 6, 3, '#8ab8e0'); P.dot(10, 25, '#c8a050'); P.dot(19, 27, '#c8a050'); P.dot(22, 24, '#c8a050');
        P(13, 6, 6, 18, '#a8a2ae'); P.oval(16, 6, 6, 3, '#c8c2cc'); P(15, 0, 2, 6, '#a8d8ff'); P.dot(14, 0, '#ffffff'); P.dot(18, 1, '#ffffff');
      }
    },
    signpost: {
      w: 1, h: 1, up: 14,
      draw(P) { P.shadow(8, 30, 5, 2); P(7, 6, 2, 24, '#3a2a1a'); P(1, 2, 14, 10, '#e8dcc0'); P(1, 2, 14, 1, '#ffffff'); P(3, 5, 10, 1, '#5a3a2a'); P(3, 8, 7, 1, '#5a3a2a'); }
    },
    blockade: {
      w: 2, h: 1, up: 6,
      draw(P) { P.shadow(16, 20, 15, 2); P(2, 6, 3, 14, '#2a2c34'); P(27, 6, 3, 14, '#2a2c34'); for (let x = 0; x < 32; x += 8) { P(x, 6, 4, 4, '#e8c040'); P(x + 4, 6, 4, 4, '#2a2a30'); } P(0, 12, 32, 2, '#e8c040'); }
    },
    guards: {
      w: 1, h: 1, up: 0,
      draw(P) {}
    },
    lamp: { w: 1, h: 1, up: 28, prop: 'lamp' },
    mailbox: {
      w: 1, h: 1, up: 8,
      draw(P) { P.shadow(8, 22, 5, 2); P(4, 6, 8, 12, '#c82a2a'); P(4, 6, 8, 2, '#e85a4a'); P(4, 4, 8, 2, '#a01a1a'); P(5, 10, 6, 1, '#3a0a0a'); P(6, 18, 4, 6, '#3a3a40'); P(4, 4, 8, 1, '#ffffff'); }
    },
    trash: {
      w: 1, h: 1, up: 4,
      draw(P) { P.shadow(8, 19, 5, 2); P(4, 6, 8, 12, '#4a5a4a'); P(4, 6, 8, 1, '#7a8a7a'); for (let x = 5; x < 12; x += 2) P(x, 8, 1, 9, '#3a4a3a'); P(3, 5, 10, 2, '#5a6a5a'); P(5, 4, 6, 1, '#e2eaf2'); }
    },
    bench: {
      w: 2, h: 1, up: 6,
      draw(P) { P.shadow(16, 19, 13, 2); P(2, 4, 28, 3, '#6a4a30'); P(2, 4, 28, 1, '#8a6440'); P(2, 9, 28, 3, '#6a4a30'); P(2, 9, 28, 1, '#8a6440'); P(3, 12, 2, 7, '#2a2c34'); P(27, 12, 2, 7, '#2a2c34'); P(2, 3, 28, 1, '#e8f4ff'); }
    },
    heater: {
      w: 1, h: 1, up: 14,
      draw(P) { P.shadow(8, 28, 6, 2); P(4, 4, 8, 22, '#5a4a3a'); P(4, 4, 8, 1, '#8a7458'); P(5, 8, 6, 10, '#ff8a2a'); P(6, 9, 4, 8, '#ffd890'); for (let y = 9; y < 18; y += 2) P(5, y, 6, 1, '#7a3a10'); P(3, 2, 10, 2, '#3a3028'); },
      lights: () => [[8, -2, 30, '#ff9a3a', 0.32, true]]
    },
    car: {
      w: 2, h: 1, up: 8,
      draw(P, v) {
        const c = v === 'red' ? ['#a02a2a', '#d05a4a', '#601818'] : ['#2a4a6a', '#4a6a8a', '#18304a'];
        P.shadow(16, 21, 15, 3);
        P(1, 8, 30, 10, c[0]); P(1, 8, 30, 1, c[1]); P(6, 2, 18, 7, c[2]); P(7, 3, 7, 5, '#a8c8e0'); P(16, 3, 7, 5, '#a8c8e0');
        P(4, 16, 6, 5, '#141418'); P(22, 16, 6, 5, '#141418'); P(1, 11, 2, 2, '#ffe8a0'); P(6, 1, 18, 2, '#e8f4ff');
      }
    },
    tram: {
      w: 2, h: 4, up: 12,
      draw(P) {
        P.shadow(16, 74, 15, 3);
        P(15, 0, 2, 12, '#2a2c34'); P(10, 0, 12, 2, '#2a2c34');
        P(1, 12, 30, 62, '#c84a2a'); P(1, 12, 30, 2, '#e8805a'); P(1, 72, 30, 2, '#6a2010');
        P(4, 8, 24, 6, '#3a3e48');
        for (let y = 18; y < 68; y += 9) { P(2, y, 4, 6, '#a8c8e0'); P(26, y, 4, 6, '#a8c8e0'); }
        P(6, 16, 20, 54, '#d86040'); P(6, 16, 20, 1, '#f0a080'); P(6, 42, 20, 2, '#e8d0a0');
        P(8, 71, 16, 3, '#ffe8a0'); P(8, 71, 16, 1, '#ffffff');
      },
      lights: () => [[16, 60, 20, '#ffe8a0', 0.25]]
    },
    hedgehog: {
      w: 1, h: 1, up: 8,
      draw(P) { P.shadow(8, 22, 7, 2); P.line(2, 22, 13, 6, '#3a3c44', 2); P.line(2, 6, 13, 22, '#3a3c44', 2); P.line(8, 4, 8, 22, '#4a4e58', 2); P.dot(8, 4, '#e8f4ff'); }
    },
    sandbag: {
      w: 2, h: 1, up: 4,
      draw(P) { for (let i = 0; i < 4; i++) { P.oval(4 + i * 8, 14, 4, 3, '#8a7a5a'); P.oval(4 + i * 8, 13, 3, 2, '#a8966e'); } for (let i = 0; i < 3; i++) { P.oval(8 + i * 8, 9, 4, 3, '#8a7a5a'); P.oval(8 + i * 8, 8, 3, 2, '#a8966e'); } P(4, 5, 24, 1, '#e8f4ff'); }
    },
    shard: {
      w: 1, h: 1, up: 14,
      draw(P) { P.tri([8, 0, 2, 26, 14, 26], '#0e0a14'); P.tri([8, 2, 4, 22, 9, 26], '#2a1a3a'); P.line(8, 4, 6, 20, '#56d4ff'); P.dot(8, 4, '#c8f4ff'); P.tri([2, 16, 0, 28, 5, 28], '#1a1224'); },
      lights: () => [[8, -10, 22, '#56d4ff', 0.24, true]]
    },
    snowpile: {
      w: 1, h: 1, up: 2,
      draw(P) { P.oval(8, 12, 7, 4, '#b8c6d6'); P.oval(8, 11, 6, 3, '#e6eef6'); P.oval(7, 10, 3, 1, '#ffffff'); }
    },
    monument: {
      w: 4, h: 3, up: 46,
      draw(P) {
        P.shadow(32, 92, 28, 5);
        P(6, 74, 52, 20, '#8a8490'); P(6, 74, 52, 2, '#c8c2cc'); P(10, 70, 44, 6, '#a8a2ae'); P(10, 70, 44, 1, '#e2dce6'); P(6, 92, 52, 2, '#4a4650');
        P.oval(32, 50, 18, 18, '#2a2c34'); P.oval(30, 47, 14, 14, '#3a3e48'); P.oval(27, 43, 5, 4, '#5a5e6a');
        P.ring(32, 50, 24, 9, '#6a707c'); P.ring(32, 50, 25, 10, '#3a3e48');
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P(Math.round(32 + Math.cos(a) * 25) - 1, Math.round(50 + Math.sin(a) * 10) - 1, 3, 3, '#4a4e58'); }
        P.ring(32, 50, 12, 24, '#5a5e6a');
        const ice = ['#bfe6ff', '#ffffff', '#6ab4e0'];
        P.tri([32, 0, 24, 40, 40, 40], ice[0]); P.tri([32, 0, 28, 30, 33, 40], ice[1]); P.tri([20, 12, 14, 44, 26, 40], ice[2]); P.tri([44, 10, 38, 40, 50, 44], ice[0]);
        P.tri([14, 26, 8, 50, 18, 46], ice[2]); P.tri([50, 24, 46, 46, 56, 50], ice[2]); P.line(32, 2, 30, 36, ice[1]);
      },
      lights: () => [[32, -36, 46, '#9ad8ff', 0.28, true]]
    },
    mansion: {
      w: 6, h: 7, up: 40,
      draw(P) {
        const wall = ['#d88a6a', '#eaa888', '#a8604a'], roof = ['#2a2c3a', '#40445a'];
        P(4, 40, 88, 112, wall[0]); P(4, 40, 88, 2, wall[1]); P(4, 40, 3, 112, wall[1]); P(89, 40, 3, 112, wall[2]);
        P.tri([0, 42, 48, 4, 96, 42], roof[0]); P.tri([10, 40, 48, 12, 86, 40], roof[1]); P(0, 38, 96, 5, roof[0]); P(0, 42, 96, 2, '#c8d0e0');
        for (const x of [24, 48, 72]) { P(x - 5, 18, 10, 14, roof[1]); P.tri([x - 7, 19, x, 11, x + 7, 19], roof[0]); P(x - 3, 21, 6, 9, '#ffcf80'); P(x - 3, 21, 6, 1, '#ffffff'); }
        for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
          const x = 10 + c * 14, y = 50 + r * 24;
          if (r === 3 && (c === 2 || c === 3)) continue;
          P(x, y, 9, 16, '#3a2a2a'); P.oval(x + 4, y + 1, 5, 4, '#3a2a2a'); P(x + 1, y + 1, 7, 14, (r + c) % 3 ? '#2a3450' : '#ffcf80'); P(x + 4, y, 1, 16, '#3a2a2a'); P(x - 1, y + 16, 11, 2, '#e8dccc');
        }
        for (let y = 64; y < 150; y += 24) P(4, y, 88, 2, wall[2]);
        P(36, 120, 24, 32, '#e8dccc'); P(39, 124, 18, 28, '#4a2e28'); P.oval(48, 124, 9, 6, '#4a2e28'); P(47, 124, 2, 28, '#2a1a16');
        P(30, 128, 4, 22, '#2a2632'); P(62, 128, 4, 22, '#2a2632'); P(30, 136, 36, 2, '#c84a3a'); P(44, 132, 8, 8, '#e8dcc0'); P(46, 134, 4, 4, '#c84a3a');
      },
      lights: () => [[48, 60, 50, '#ffcf80', 0.18]]
    },
    oldcannon: {
      w: 1, h: 1, up: 8,
      draw(P) {
        P.shadow(8, 22, 8, 2);
        P.line(3, 15, 14, 4, '#2a2c34', 5); P.line(3, 14, 13, 4, '#5a5e6a', 1); P.oval(14, 4, 2, 2, '#14161c');
        P.oval(5, 17, 4, 4, '#5a3a24'); P.ring(5, 17, 4, 4, '#3a2418'); P.oval(12, 18, 4, 4, '#5a3a24'); P.ring(12, 18, 4, 4, '#3a2418'); P.dot(5, 17, '#c8a050'); P.dot(12, 18, '#c8a050');
        P(2, 9, 6, 2, '#c8d0e0');
      }
    },
    wire: {
      w: 1, h: 1, up: 4,
      draw(P) { for (let i = 0; i < 4; i++) P.ring(3 + i * 3, 12, 4, 5, '#5a5e6a'); for (let i = 0; i < 9; i++) P.dot(1 + i * 2, 8 + (i % 3) * 4, '#c8ccd4'); P(0, 17, 16, 1, '#3a3e48'); }
    },
    cafetable: {
      w: 1, h: 1, up: 6,
      draw(P) { P.shadow(8, 21, 7, 2); P.oval(8, 8, 7, 3, '#e8dcc0'); P.oval(8, 7, 6, 2, '#f4ecd8'); P(7, 10, 2, 10, '#3a2a24'); P(4, 19, 8, 1, '#3a2a24'); P(5, 5, 2, 2, '#ffffff'); P.dot(6, 5, '#8a5a34'); }
    },
    vein: {
      w: 6, h: 6, up: 24,
      draw(P) {
        P.oval(48, 92, 40, 16, '#1a120c'); P.oval(48, 88, 30, 12, '#3a2a1a');
        const shard = (x, y, w, h, c) => { P.tri([x, y - h, x - w, y, x + w, y], c[0]); P.tri([x, y - h, x - 2, y, x + w / 2, y], c[1]); };
        const A = ['#ff9a3a', '#ffd890'], B = ['#d86a1a', '#ffb050'], D = ['#a04a1a', '#ff8a2a'];
        shard(48, 92, 14, 84, A); shard(30, 92, 10, 60, B); shard(66, 92, 11, 66, B); shard(20, 94, 8, 38, D); shard(78, 94, 8, 42, D); shard(40, 96, 7, 30, A); shard(58, 96, 7, 34, A);
        P.ring(48, 90, 46, 14, '#5a5e68'); P.ring(48, 90, 45, 13, '#8a909c');
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P(Math.round(48 + Math.cos(a) * 46) - 1, Math.round(90 + Math.sin(a) * 14), 2, 10, '#3a3e48'); }
      },
      lights: () => [[48, 40, 90, '#ff9a3a', 0.45, true]]
    },
    lift: {
      w: 1, h: 2, up: 20,
      draw(P) { P.shadow(8, 51, 8, 2); P(1, 4, 14, 48, '#2a2c34'); for (let y = 6; y < 50; y += 6) P(2, y, 12, 1, '#5a5e68'); P(2, 4, 1, 48, '#8a909c'); P(13, 4, 1, 48, '#8a909c'); P(4, 0, 8, 4, '#3a3e48'); P(7, 0, 2, 4, '#c8a050'); P(5, 30, 6, 16, '#4a4e58'); }
    },
    furnace: {
      w: 4, h: 5, up: 0,
      draw(P) {
        P(20, 0, 24, 80, '#2a2420'); P(22, 0, 4, 80, '#4a3e34'); P(40, 0, 4, 80, '#1a1410');
        for (let y = 6; y < 80; y += 14) { P(16, y, 32, 4, '#3a3028'); for (let x = 18; x < 46; x += 5) P(x, y + 1, 2, 2, '#ffb050'); }
        P.oval(32, 76, 18, 6, '#ff9a3a'); P.oval(32, 75, 12, 3, '#ffd890');
      },
      lights: () => [[32, 40, 70, '#ffb050', 0.22, true]]
    },
    clocktower: {
      w: 2, h: 3, up: 30,
      draw(P) {
        P(6, 26, 20, 52, '#6a5a4a'); P(6, 26, 20, 2, '#8a7a6a'); P(8, 30, 16, 46, '#5a4a3a');
        P.oval(16, 38, 7, 7, '#f4ecd8'); P.ring(16, 38, 7, 7, '#3a2a1a'); P.line(16, 38, 16, 33, '#1a1a20'); P.line(16, 38, 20, 40, '#1a1a20');
        P.oval(16, 16, 12, 12, '#3a8a6a'); P.oval(14, 13, 5, 4, '#6ac09a'); P(4, 22, 24, 6, '#3a8a6a'); P(15, 0, 2, 6, '#c8a050');
        for (let y = 52; y < 74; y += 8) { P(11, y, 3, 5, '#ffcf80'); P(18, y, 3, 5, '#2a2018'); }
      },
      lights: () => [[16, 38, 26, '#ffd890', 0.18, true]]
    },
    barrel: {
      w: 1, h: 1, up: 6,
      draw(P) { P.shadow(8, 21, 6, 2); P(3, 4, 10, 16, '#7a5434'); P(3, 4, 10, 1, '#a07a50'); P(3, 8, 10, 1, '#3a3028'); P(3, 15, 10, 1, '#3a3028'); P.oval(8, 4, 5, 2, '#5a3a24'); }
    },
    crates: {
      w: 1, h: 1, up: 10,
      draw(P) { P.shadow(8, 25, 7, 2); P(1, 12, 14, 12, '#7a5a3a'); P(1, 12, 14, 1, '#a07a50'); P.line(2, 13, 14, 23, '#5a4028'); P(4, 2, 10, 10, '#8a6a44'); P(4, 2, 10, 1, '#b08a5a'); P.line(5, 3, 13, 11, '#5a4028'); }
    },
    junk: {
      w: 1, h: 1, up: 6,
      draw(P) { P.shadow(8, 21, 7, 2); P(1, 12, 6, 8, '#5a5e68'); P(6, 8, 8, 12, '#6a4a30'); P.ring(5, 9, 3, 3, '#8a909c'); P(9, 4, 2, 8, '#8a909c'); P(2, 16, 12, 1, '#3a3028'); P.dot(12, 13, '#c8a050'); }
    },
    robotkit: {
      w: 1, h: 1, up: 8,
      draw(P) { P.shadow(8, 23, 7, 2); P(2, 12, 12, 10, '#4a4e58'); P(2, 12, 12, 1, '#7a808c'); P(4, 4, 8, 8, '#5a5e68'); P(5, 6, 2, 2, '#5ad0ff'); P(9, 6, 2, 2, '#5ad0ff'); P(1, 14, 2, 6, '#3a3e48'); P(13, 14, 2, 6, '#3a3e48'); P(7, 0, 2, 4, '#8a909c'); }
    },
    lantern: {
      w: 1, h: 1, up: 16,
      draw(P) { P(7, 0, 2, 4, '#2a2420'); P(4, 4, 8, 10, '#3a3028'); P(5, 5, 6, 8, '#ffb050'); P(5, 5, 6, 2, '#ffe0a0'); P(3, 14, 10, 2, '#2a2420'); },
      lights: () => [[8, -8, 30, '#ffb050', 0.32, true]]
    },
    cart: {
      w: 1, h: 1, up: 8,
      draw(P) { P.shadow(8, 23, 7, 2); P(1, 6, 14, 10, '#5a5e68'); P(1, 6, 14, 1, '#8a909c'); P(3, 3, 10, 4, '#ff9a3a'); P(4, 3, 4, 2, '#ffd890'); P.oval(4, 18, 3, 3, '#2a2c34'); P.oval(12, 18, 3, 3, '#2a2c34'); }
    },
    pickaxe: {
      w: 1, h: 1, up: 4,
      draw(P) { P.line(3, 18, 12, 6, '#7a5434', 2); P.line(7, 4, 15, 10, '#8a909c', 2); P.dot(15, 10, '#c8ccd4'); }
    },
    enginewreck: {
      w: 9, h: 12, up: 40,
      draw(P) {
        const W = '#e8ecf2', Wm = '#c4ccd8', Wd = '#8a96aa', Bl = '#3a6ac8', ink = '#1a1c24', rust = '#8a4a2a', glow = '#ff9a3a', sc = '#c87a2a', scd = '#7a4418';
        for (let i = 0; i < 6; i++) { P.line(4 + i * 24, 236, 30 + i * 18, 60, '#5a4a40', 2); P.line(140 - i * 22, 236, 120 - i * 16, 60, '#5a4a40', 2); }
        P(46, 120, 56, 90, Wd); P(48, 118, 52, 86, W); P(74, 118, 26, 86, Wm); P(48, 150, 52, 6, Bl); P(48, 156, 52, 2, '#1e3a7a');
        for (let y = 128; y < 200; y += 14) P(50, y, 48, 1, Wd);
        P(56, 70, 36, 52, Wd); P(58, 68, 32, 50, W); P(76, 68, 14, 50, Wm); P(60, 84, 28, 8, '#141820'); P(64, 86, 20, 4, glow);
        P(66, 40, 16, 30, Wd); P(68, 38, 12, 28, W); P(74, 38, 6, 28, Wm); P(70, 46, 8, 4, '#141820'); P(72, 47, 4, 2, '#7af0ff');
        P(16, 88, 34, 18, Wd); P(18, 86, 30, 16, W); P(6, 104, 16, 40, W); P(14, 104, 8, 40, Wm); P(6, 140, 16, 6, Bl);
        P(98, 92, 30, 14, Wd); P(100, 90, 26, 12, W); P.line(126, 96, 140, 70, ink, 3); P.line(130, 100, 142, 86, rust, 2);
        P(54, 210, 18, 26, Wd); P(80, 210, 18, 26, Wd); P(56, 208, 14, 24, W); P(82, 208, 14, 24, Wm);
        for (const [x, y] of [[50, 130], [92, 132], [62, 176], [86, 186], [24, 96]]) { P(x, y, 6, 2, rust); P(x + 2, y + 2, 3, 3, rust); }
        P.oval(74, 168, 10, 8, '#5a2a14'); P.oval(74, 168, 6, 5, glow); P.oval(74, 168, 3, 2, '#fff0c0');
        for (const x of [36, 108]) { P(x, 100, 3, 136, sc); P(x + 3, 100, 1, 136, scd); for (let y = 108; y < 236; y += 16) { P(x - 6, y, 15, 2, sc); P.line(x - 6, y, x + 9, y + 16, scd); } }
        P(30, 98, 90, 3, sc); P(30, 101, 90, 1, scd);
        for (const [x, y] of [[48, 116], [58, 66], [68, 36], [18, 84], [100, 88], [8, 102], [30, 96]]) P(x, y, 10, 2, '#fffaf2');
      },
      lights: () => [[74, 128, 60, '#ff9a3a', 0.3, true], [72, 8, 26, '#7af0ff', 0.25, true]]
    },
    tower: {
      w: 4, h: 6, up: 70,
      draw(P, v) {
        const lean = [-0.14, 0.1, -0.06][(v | 0) % 3], c = ['#7a7472', '#948c88', '#56504e'];
        for (let y = 0; y < 160; y += 2) {
          const x = 10 + Math.round((160 - y) * lean) + (lean > 0 ? 0 : 16);
          const w = 40 - (y < 20 ? 8 : 0);
          P(x, y, w, 2, y % 18 < 2 ? c[2] : c[0]); P(x, y, 4, 2, c[1]);
          if (y % 18 === 8) for (let k = 6; k < w - 4; k += 8) P(x + k, y, 4, 4, (k + y) % 3 ? '#2a2420' : '#ffc070');
        }
        P(14, 158, 36, 6, '#fffaf2');
      }
    },
    crane: {
      w: 4, h: 3, up: 60,
      draw(P) {
        const st = '#c87a2a', dk = '#7a4418';
        P.shadow(32, 106, 26, 3);
        for (let y = 10; y < 104; y += 8) { P.line(20, y, 28, y + 8, dk); P.line(28, y, 20, y + 8, dk); }
        P(19, 10, 2, 96, st); P(27, 10, 2, 96, st);
        P(0, 8, 64, 3, st); P(0, 11, 64, 1, dk); for (let x = 2; x < 64; x += 6) P.line(x, 8, x + 3, 2, dk);
        P(24, 0, 2, 8, dk); P.line(25, 0, 0, 8, '#3a2a1a'); P.line(25, 0, 62, 8, '#3a2a1a');
        P(54, 11, 1, 30, '#3a2a1a'); P(51, 40, 7, 5, '#2a2420');
        P(16, 100, 16, 6, '#4a3a2a');
      }
    },
    longbridge: {
      w: 22, h: 11, up: 0,
      draw(P) {
        const deck = '#8a7a6a', hi = '#c8b8a0', dk = '#4a3e34';
        for (let t = 0; t <= 1; t += 0.004) {
          const x = Math.round(8 + t * 340), y = Math.round(8 + t * 156);
          P(x, y, 8, 6, deck); P(x, y, 8, 1, hi); P(x, y + 6, 8, 2, dk);
        }
        for (let i = 1; i < 7; i++) { const t = i / 7, x = Math.round(8 + t * 340), y = Math.round(8 + t * 156); P(x + 2, y + 8, 4, 20, dk); }
        P(176, 88, 16, 10, '#2a221e');
        P.line(176, 88, 190, 104, '#1a1210', 2);
      }
    },
    hut: {
      w: 3, h: 2, up: 14,
      draw(P) {
        P.shadow(24, 46, 22, 3);
        P(4, 18, 40, 28, '#7a5a3a'); for (let y = 20; y < 46; y += 4) P(4, y, 40, 1, '#5a3e26');
        P.tri([0, 20, 24, 2, 48, 20], '#5a4a44'); P.tri([2, 19, 24, 4, 46, 19], '#f6ece0');
        P(20, 30, 8, 16, '#3a2a1a'); P(8, 26, 8, 6, '#ffc070'); P(32, 26, 8, 6, '#2a2420');
      },
      lights: () => [[12, 16, 16, '#ffc070', 0.22, true]]
    },
    campfire: {
      w: 1, h: 1, up: 8,
      draw(P) {
        P.oval(8, 20, 7, 3, '#3a2a20'); P.line(2, 22, 14, 16, '#5a3a22', 2); P.line(2, 16, 14, 22, '#5a3a22', 2);
        P.tri([3, 18, 8, 2, 13, 18], '#ff7a2a'); P.tri([5, 18, 8, 7, 11, 18], '#ffd060'); P.dot(8, 12, '#fff4c0');
      },
      lights: () => [[8, 4, 34, '#ff9a3a', 0.4, true]]
    },
    bookstack: {
      w: 1, h: 1, up: 8,
      draw(P) {
        const cols = ['#8a3a2a', '#3a5a8a', '#6a8a3a', '#c8a040', '#5a3a6a'];
        for (let i = 0; i < 5; i++) { P(2 + (i % 2), 18 - i * 4, 12, 4, cols[i]); P(2 + (i % 2), 18 - i * 4, 12, 1, '#f2ead8'); }
        P(2, 0, 12, 2, '#fffaf2');
      }
    },
    liftpad: {
      w: 2, h: 2, up: 0,
      draw(P) {
        P.oval(16, 16, 15, 13, '#2a2420'); P.ring(16, 16, 12, 10, '#5a4a40'); P.ring(16, 16, 8, 6, '#5a4a40'); P.oval(16, 16, 3, 2, '#c8283a');
        P(2, 2, 6, 2, '#d0a840'); P(24, 28, 6, 2, '#d0a840');
      }
    },
    colossus: {
      w: 12, h: 5, up: 0,
      draw(P) {
        const ink = '#141824', dk = '#232a3a', md = '#384256', hi = '#5a6680', snow = '#eef4fb', glow = '#7af0e0';
        P.shadow(96, 78, 84, 4);
        P.tri([6, 80, 40, 52, 82, 80], dk); P.tri([110, 80, 150, 50, 188, 80], dk);
        P(34, 56, 124, 22, md); P(34, 56, 124, 2, hi); P(34, 76, 124, 4, ink);
        const fingers = [[46, 58, 16, 9, -0.35], [72, 56, 4, 10, -0.12], [98, 56, 0, 10, 0.05], [124, 56, 6, 10, 0.25], [150, 62, 34, 9, 0.75]];
        for (const [x, y, top, w, lean] of fingers) {
          const tx = Math.round(x + lean * (y - top));
          P.tri([x - w / 2, y, x + w / 2, y, tx, top], md); P.tri([x - w / 2, y, x, y, tx, top], dk);
          P.line(x, y, tx, top, hi); P(tx - 2, top, 4, 2, snow);
          const kx = Math.round((x + tx) / 2), ky = Math.round((y + top) / 2);
          P(kx - 3, ky, 6, 2, ink);
        }
        for (const [x, y, sz] of [[86, 8, 4], [112, 14, 3], [60, 4, 3], [168, 10, 4], [140, 2, 3], [20, 30, 3]]) { P.tri([x, y - sz, x + sz, y + sz, x - sz, y + sz], md); P.dot(x, y - sz + 1, hi); }
        P(36, 54, 120, 2, snow); P(52, 50, 18, 2, snow); P(116, 48, 14, 2, snow);
        P.oval(96, 66, 7, 6, '#1e4a56'); P.oval(96, 66, 4, 4, glow); P.dot(95, 65, '#ffffff');
        for (const [x0, y0, x1, y1] of [[40, 70, 70, 74], [120, 72, 150, 68], [60, 62, 84, 60]]) P.line(x0, y0, x1, y1, ink);
      },
      lights: () => [[96, 66, 46, '#7af0e0', 0.26, true]]
    },
    device: {
      w: 3, h: 2, up: 26,
      draw(P) {
        P.shadow(24, 56, 22, 4);
        P(4, 40, 40, 16, '#4a5262'); P(4, 40, 40, 2, '#8a94a8'); P(4, 54, 40, 2, '#2a3040');
        P(8, 36, 32, 6, '#6a7488'); P(8, 36, 32, 1, '#c8d0dc');
        P(10, 6, 4, 32, '#2a3040'); P(34, 6, 4, 32, '#2a3040'); P(10, 4, 28, 4, '#3a4252'); P(11, 4, 26, 1, '#8a94a8');
        P.ring(24, 22, 9, 9, '#8a94a8'); P.ring(24, 22, 10, 10, '#3a4252');
        P.oval(24, 22, 6, 6, '#1a3a4a'); P.oval(24, 22, 4, 4, '#4ac8e0'); P.oval(23, 21, 2, 2, '#e8ffff');
        P(16, 46, 16, 4, '#2a3040'); P(18, 47, 3, 2, '#4ac8e0'); P(27, 47, 3, 2, '#4ac8e0');
        P(10, 3, 28, 1, '#eef4fb'); P(4, 39, 40, 1, '#eef4fb');
      },
      lights: () => [[24, 22, 36, '#4ac8e0', 0.3, true]]
    },
    voidranger: {
      w: 1, h: 1, up: 20,
      draw(P, v) {
        const pose = (v | 0) % 3;
        P.shadow(8, 35, 7, 2);
        P(1, 6, 14, 30, '#9ad8ec'); P(2, 5, 12, 2, '#d8f4ff'); P(1, 34, 14, 2, '#6aa8c4');
        const x = pose === 1 ? 5 : 6;
        P(x, 12, 5, 12, '#1a2a3a'); P(x + 1, 9, 3, 4, '#2a3a52'); P.dot(x + 2, 10, '#ff4a6a');
        if (pose === 0) { P(x - 2, 14, 2, 8, '#1a2a3a'); P(x + 5, 13, 3, 2, '#1a2a3a'); P.line(x + 7, 13, x + 9, 6, '#4a5a7a', 2); }
        else if (pose === 1) { P(x + 5, 14, 5, 2, '#1a2a3a'); P(x - 1, 16, 2, 6, '#1a2a3a'); }
        else { P(x - 3, 12, 3, 2, '#1a2a3a'); P(x + 5, 12, 3, 2, '#1a2a3a'); P.tri([x, 24, x + 5, 24, x + 2, 30], '#1a2a3a'); }
        P(x, 24, 2, 8, '#1a2a3a'); P(x + 3, 24, 2, 8, '#1a2a3a');
        P.line(2, 30, 13, 8, 'rgba(255,255,255,0.55)'); P(3, 8, 1, 10, '#ffffff'); P.dither(1, 6, 14, 30, '#c8eefa', 1);
      }
    },
    icefrag: {
      w: 1, h: 1, up: 10,
      draw(P) {
        P.shadow(8, 25, 6, 2);
        P.tri([3, 25, 6, 8, 9, 25], '#3ab8d0'); P.tri([4, 24, 6, 10, 7, 24], '#9af0ff');
        P.tri([8, 25, 11, 4, 14, 25], '#2a98b8'); P.tri([9, 24, 11, 6, 12, 24], '#c8f8ff');
        P.tri([1, 25, 2, 16, 5, 25], '#3ab8d0'); P.dot(11, 6, '#ffffff');
      },
      lights: () => [[8, 4, 16, '#7af0ff', 0.2, true]]
    },
    roots: {
      w: 1, h: 1, up: 0, size: v => [(v | 0) || 3, 1],
      draw(P, v) {
        const w = ((v | 0) || 3) * 16;
        for (let x = 0; x < w; x++) { const y = 8 + Math.round(Math.sin(x / 7) * 3 + Math.sin(x / 3.1) * 1); P(x, y, 1, 2, '#2a2c34'); if (x % 9 === 0) P(x, y - 1, 2, 1, '#eef4fb'); }
      }
    },
    amberlance: {
      w: 1, h: 2, up: 30,
      draw(P, v) {
        P.oval(8, 58, 8, 3, '#8a5a1a'); P.oval(8, 57, 6, 2, '#f4c060');
        P.tri([2, 58, 8, 30, 14, 58], 'rgba(255,200,90,0.55)');
        P(7, 2, 2, 56, '#3a2410'); P(7, 2, 1, 56, '#c8862a');
        P.tri([4, 14, 8, 0, 12, 14], '#ffd070'); P.tri([6, 12, 8, 3, 10, 12], '#fff4c8');
        for (let i = 0; i < 6; i++) P.dot(4 + (i * 5) % 9, 18 + i * 6, '#ff9a3a');
      },
      lights: () => [[8, 10, 44, '#ffc050', 0.45, true]]
    },
    pathstar: {
      w: 1, h: 1, up: 0,
      draw(P) { P(7, 3, 2, 10, '#fff0c0'); P(3, 7, 10, 2, '#fff0c0'); P(6, 6, 4, 4, '#ffffff'); },
      lights: () => [[8, 8, 18, '#ffe0a0', 0.3, true]]
    },
    hubball: {
      w: 2, h: 2, up: 18,
      draw(P) {
        P.shadow(16, 50, 15, 3);
        P(4, 40, 24, 10, '#2a2e3a'); P(4, 40, 24, 2, '#5a6070');
        P.oval(16, 26, 14, 14, '#2a2e3a'); P.oval(16, 25, 13, 13, '#4a5266'); P.oval(12, 20, 5, 4, '#7a8498');
        for (let i = -12; i <= 12; i += 6) P(16 + i, 12, 1, 28, '#2a2e3a');
        P(3, 25, 26, 1, '#2a2e3a'); P.oval(16, 25, 4, 4, '#ffd040'); P.oval(16, 25, 2, 2, '#fff4b0');
        P(0, 30, 4, 2, '#6a7080'); P(28, 30, 4, 2, '#6a7080'); P(0, 32, 2, 18, '#3a3e48'); P(30, 32, 2, 18, '#3a3e48');
      },
      lights: () => [[16, 8, 30, '#ffd040', 0.28, true]]
    },
    gearhub: {
      w: 1, h: 1, up: 6,
      draw(P) {
        P.oval(16, 18, 14, 9, '#2a2c34'); P.oval(16, 17, 12, 8, '#5a5e6a'); P.oval(16, 17, 6, 4, '#8a909c'); P.oval(16, 17, 2, 2, '#e8c040');
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P(Math.round(16 + Math.cos(a) * 13) - 1, Math.round(17 + Math.sin(a) * 8) - 1, 3, 3, '#3a3e48'); }
      }
    },
    mast: {
      w: 1, h: 1, up: 90,
      draw(P) {
        P(5, 90, 6, 16, '#2a2c34');
        P(6, 0, 1, 92, '#4a4e58'); P(10, 0, 1, 92, '#4a4e58');
        for (let y = 2; y < 90; y += 8) { P.line(6, y, 10, y + 8, '#4a4e58'); P.line(10, y, 6, y + 8, '#4a4e58'); }
        P(0, 0, 16, 3, '#5a5e6a'); P(2, 3, 1, 10, '#3a3e48'); P(8, 0, 1, 1, '#ff5a3a');
      },
      lights: () => [[8, -88, 10, '#ff5a3a', 0.4, true]]
    },
    railing: {
      w: 1, h: 1, up: 6, size: v => [(v | 0) || 2, 1],
      draw(P, v) {
        const w = ((v | 0) || 2) * 16;
        P(0, 6, w, 2, '#1a1e2c'); P(0, 6, w, 1, '#4a5268'); P(0, 18, w, 1, '#1a1e2c');
        for (let x = 1; x < w; x += 4) { P(x, 7, 1, 12, '#1a1e2c'); if (x % 8 === 1) P.dot(x, 12, '#4a5268'); }
        P(0, 2, 3, 18, '#2a3044'); P(w - 3, 2, 3, 18, '#2a3044'); P(0, 1, 3, 2, '#c8d2e2'); P(w - 3, 1, 3, 2, '#c8d2e2'); P(0, 5, w, 1, '#c8d2e2');
      }
    },
    tent: {
      w: 2, h: 1, up: 16,
      draw(P) {
        P.shadow(16, 31, 15, 2);
        P.tri([2, 31, 16, 2, 30, 31], '#5a5a4e'); P.tri([16, 2, 30, 31, 18, 31], '#44443a'); P.tri([12, 31, 16, 14, 20, 31], '#1e1c18');
        P(15, 0, 2, 4, '#3a3428'); P.line(4, 30, 16, 4, '#7a786a'); P(2, 30, 28, 1, '#2a2820');
        P(6, 12, 6, 2, '#c8d2e2'); P(18, 10, 5, 2, '#c8d2e2');
      }
    },
    geocrystal: {
      w: 1, h: 1, up: 20,
      draw(P) {
        P.shadow(8, 35, 7, 2);
        P(3, 10, 10, 26, '#1a2034'); P(3, 10, 3, 26, '#2c3654'); P(2, 8, 12, 3, '#c8d2e2');
        P.tri([5, 22, 8, 12, 11, 22], '#e8b030'); P.tri([6, 21, 8, 14, 9, 21], '#ffe28a'); P.tri([9, 30, 12, 22, 14, 30], '#d89a20'); P.dot(12, 25, '#fff0b0');
      },
      lights: () => [[8, -4, 22, '#ffc040', 0.28, true]]
    },
    ironwall: {
      w: 1, h: 1, up: 22, size: v => [(v | 0) || 3, 1],
      draw(P, v) {
        const w = ((v | 0) || 3) * 16;
        P(0, 2, w, 36, '#1a1c26'); P(0, 2, w, 2, '#4a5068'); P(0, 36, w, 2, '#0a0c12');
        for (let x = 4; x < w; x += 8) { P(x, 6, 2, 28, '#2e3244'); P(x, 6, 1, 28, '#4a5068'); }
        P(0, 18, w, 3, '#2e3244'); P(0, 18, w, 1, '#6a7088'); P(w / 2 - 4, 14, 8, 10, '#ff5a3a'); P(w / 2 - 2, 16, 4, 6, '#ffb090');
        P(0, 0, w, 2, '#c8d2e2');
      },
      lights: () => [[24, 4, 18, '#ff5a3a', 0.25, true]]
    },
    stall: {
      w: 2, h: 1, up: 20,
      draw(P) {
        P.shadow(16, 35, 15, 2);
        P(2, 8, 2, 28, '#3a2a22'); P(28, 8, 2, 28, '#3a2a22');
        for (let x = 0; x < 32; x += 8) { P(x, 2, 4, 8, '#7a3a34'); P(x + 4, 2, 4, 8, '#4a6a6a'); }
        P(0, 2, 32, 1, '#a85a4a'); P(5, 10, 3, 4, '#7a3a34'); P(20, 10, 4, 3, '#4a6a6a');
        P(0, 0, 32, 3, '#c4cede'); P(3, 0, 10, 1, '#eaf0f8');
        P(2, 22, 28, 4, '#5a4434'); P(2, 22, 28, 1, '#7a5e48'); P(4, 26, 24, 10, '#3e2e24');
        P(6, 16, 6, 6, '#6a4a30'); P(6, 16, 6, 1, '#8a6440'); P(18, 18, 8, 4, '#5a5e68'); P(18, 18, 8, 1, '#8a909c');
        P(3, 21, 26, 1, '#c4cede');
      }
    },
    swing: {
      w: 2, h: 1, up: 24,
      draw(P) {
        P.shadow(16, 39, 14, 2);
        P.line(2, 38, 8, 2, '#4a4e58', 2); P.line(14, 38, 8, 2, '#4a4e58', 2); P.line(18, 38, 24, 2, '#4a4e58', 2); P.line(30, 38, 24, 2, '#4a4e58', 2);
        P(6, 1, 20, 3, '#5a5e68'); P(6, 1, 20, 1, '#8a909c'); P(6, 0, 20, 1, '#c4cede');
        P(11, 4, 1, 24, '#2a2c34'); P(20, 4, 1, 24, '#2a2c34'); P(9, 28, 14, 3, '#8a5a3a'); P(9, 28, 14, 1, '#b07a50');
        P(10, 27, 12, 1, '#c4cede');
      }
    },
    slide: {
      w: 2, h: 1, up: 20,
      draw(P) {
        P.shadow(16, 35, 15, 2);
        P(2, 4, 2, 32, '#4a4e58'); P(8, 4, 2, 32, '#4a4e58'); for (let y = 8; y < 34; y += 5) P(2, y, 8, 1, '#6a707c');
        P(1, 2, 10, 3, '#5a5e68'); P(1, 1, 10, 1, '#c4cede');
        P.line(10, 4, 30, 32, '#b83a32', 3); P.line(10, 7, 30, 35, '#2a5aa8', 3); P.line(11, 4, 30, 31, '#e86a5a', 1);
        P(27, 32, 5, 4, '#2a2c34');
      }
    },
    pipes: {
      w: 1, h: 1, up: 34, size: v => [(v | 0) || 3, 1],
      draw(P, v) {
        const w = ((v | 0) || 3) * 16;
        P(0, 2, 2, 46, '#2a2c34'); P(w - 2, 2, 2, 46, '#2a2c34');
        P(0, 4, w, 6, '#5a4a40'); P(0, 4, w, 1, '#8a6a54'); P(0, 9, w, 1, '#2a201c');
        for (let x = 10; x < w - 4; x += 22) { P(x, 3, 4, 8, '#6a5a4e'); P(x, 3, 4, 1, '#9a8070'); }
        P(0, 12, w, 1, '#3a3e48'); for (let x = 6; x < w; x += 9) P(x, 13, 1, 2 + (x % 3), '#3a3e48');
        P(0, 3, w, 1, '#c4cede');
      }
    },
    dumpster: {
      w: 1, h: 1, up: 6,
      draw(P) { P.shadow(8, 21, 8, 2); P(0, 6, 16, 14, '#3a5a4a'); P(0, 6, 16, 1, '#5a7a6a'); P(0, 4, 16, 3, '#2a4a3a'); for (let x = 2; x < 16; x += 4) P(x, 9, 1, 9, '#2a3a30'); P(2, 19, 3, 2, '#1a1a20'); P(11, 19, 3, 2, '#1a1a20'); }
    },
    medcab: {
      w: 1, h: 1, up: 14,
      draw(P) { P.shadow(8, 29, 7, 2); P(1, 2, 14, 27, '#e8e4dc'); P(1, 2, 14, 1, '#ffffff'); P(2, 4, 12, 10, '#a8c8d8'); for (let x = 3; x < 13; x += 3) P(x, 8, 2, 5, ['#c84a3a', '#e8c040', '#5a9a6a', '#ffffff'][x % 4]); P(6, 18, 4, 1, '#c83a3a'); P(7, 17, 2, 3, '#c83a3a'); }
    },
    punchbag: {
      w: 1, h: 1, up: 18,
      draw(P) { P.shadow(8, 33, 5, 2); P(7, 0, 2, 6, '#2a2420'); P(3, 6, 10, 22, '#8a2a22'); P(3, 6, 10, 2, '#b84a3a'); P(3, 26, 10, 2, '#5a1a14'); P(4, 14, 8, 1, '#e8dcc0'); }
    },
    lockbox: {
      w: 1, h: 1, up: 6,
      draw(P) { P.shadow(8, 21, 7, 2); P(1, 6, 14, 14, '#5a3a24'); P(1, 6, 14, 2, '#7a5434'); P(5, 10, 6, 6, '#8a909c'); for (let i = 0; i < 4; i++) P(5 + i, 12, 1, 2, '#2a2c34'); P(7, 15, 2, 1, '#c8a050'); }
    },
    stove: {
      w: 1, h: 1, up: 12,
      draw(P) { P.shadow(8, 27, 7, 2); P(1, 6, 14, 20, '#2a2c34'); P(1, 6, 14, 2, '#4a4e58'); P(3, 14, 10, 8, '#ff8a2a'); P(4, 15, 8, 6, '#ffd890'); P.oval(5, 4, 3, 2, '#5a5e68'); P.oval(11, 4, 3, 2, '#5a5e68'); P(9, 0, 4, 4, '#8a909c'); },
      lights: () => [[8, 0, 26, '#ff9a3a', 0.3, true]]
    },
    plinth: {
      w: 1, h: 1, up: 4,
      draw(P) { P(0, 6, 16, 14, '#cfc8b8'); P(0, 4, 16, 3, '#f0ece2'); P(0, 19, 16, 1, '#8a8478'); P(1, 9, 14, 1, '#e2dccd'); }
    },
    panel: {
      w: 1, h: 1, up: 10,
      draw(P, v) {
        v = v || 'L';
        const left = v[0] === 'L', bx = left ? 10 : 0;
        P(bx, 0, 6, 26, '#4a3020'); P(bx, 0, 6, 2, '#7a5434'); P(left ? 10 : 5, 2, 1, 24, '#2a1a10');
        if (v[1] === 'p') {
          const fx = left ? 5 : 6, k = SCENES[Object.keys(SCENES)[(v.length * 7 + bx) % 6]];
          P(fx, 6, 5, 12, '#c8a050'); P(fx + 1, 7, 3, 10, k[0]); P(fx + 1, 13, 3, 4, k[2]);
        }
      }
    },
    vitrine: {
      w: 1, h: 1, up: 14,
      draw(P, v) {
        P.shadow(8, 29, 7, 2);
        P(1, 20, 14, 10, '#4a3020'); P(1, 20, 14, 1, '#7a5434'); P(2, 29, 12, 1, '#2a1a10'); P(3, 23, 10, 4, '#3a2418');
        vitrineItem(P, v);
        P(2, 6, 12, 14, 'rgba(200,232,248,0.28)'); P(2, 5, 12, 1, '#c8a050'); P(2, 5, 1, 15, '#8a6a2a'); P(13, 5, 1, 15, '#8a6a2a');
        P.line(4, 8, 7, 17, 'rgba(255,255,255,0.55)'); P.dot(11, 7, '#ffffff');
      }
    },
    rack: {
      w: 1, h: 1, up: 18,
      draw(P) {
        P.shadow(8, 33, 7, 2); P(1, 28, 14, 5, '#4a3020'); P(1, 28, 14, 1, '#7a5434');
        for (let i = 0; i < 3; i++) { P(3 + i * 4, 2, 1, 27, '#8a909c'); P.tri([3 + i * 4, 0, 2 + i * 4, 4, 5 + i * 4, 4], '#e8eef6'); }
        P(1, 12, 14, 2, '#5a3a24'); P.line(2, 26, 13, 16, '#2a2c34', 2); P(9, 18, 4, 2, '#6a4628');
      }
    },
    icesculpt: {
      w: 1, h: 1, up: 22,
      draw(P, v) {
        P.shadow(8, 37, 8, 2);
        P(0, 32, 16, 6, '#8a8490'); P(0, 32, 16, 1, '#c8c2cc');
        P(1, 2, 14, 30, '#9ad4f2'); P(2, 3, 12, 28, '#bfe6ff');
        const arm = { a: [3, 8, 2, 4], b: [11, 6, 14, 3], c: [2, 14, 5, 10], d: [12, 14, 14, 20] }[v] || [3, 8, 2, 4];
        P.oval(8, 12, 4, 4, '#3a2a5a'); P(5, 15, 6, 12, '#2a1e44'); P(6, 27, 2, 4, '#2a1e44'); P(9, 27, 2, 4, '#2a1e44');
        P.line(6, 17, arm[0], arm[1], '#2a1e44', 2); P.line(10, 17, arm[2], arm[3], '#2a1e44', 2); P.dot(7, 11, '#ff5ad0'); P.dot(9, 11, '#ff5ad0');
        P(2, 3, 12, 28, 'rgba(220,244,255,0.35)'); P.line(3, 5, 6, 26, '#ffffff'); P(1, 2, 14, 1, '#ffffff');
      },
      lights: () => [[8, -8, 22, '#9ad8ff', 0.18, true]]
    },
    easel: {
      w: 1, h: 1, up: 16,
      draw(P, v) {
        P.shadow(8, 31, 6, 2);
        P.line(4, 30, 7, 10, '#5a3a24', 2); P.line(12, 30, 9, 10, '#5a3a24', 2); P(7, 18, 2, 12, '#4a3020');
        P(1, 2, 14, 16, '#c8a050'); P(1, 2, 14, 1, '#ffe890'); sceneIn(P, 2, 3, 12, 14, v); P(1, 18, 14, 2, '#5a3a24');
      }
    },
    projector: {
      w: 1, h: 1, up: 10,
      draw(P, v) {
        const body = v === 'gold' ? ['#8a6a2a', '#c8a050'] : v === 'civil' ? ['#4a4e58', '#6a707c'] : ['#2a2c34', '#4a4e58'];
        P.shadow(8, 25, 6, 2); P(3, 16, 2, 9, '#2a2c34'); P(11, 16, 2, 9, '#2a2c34'); P(2, 15, 12, 2, '#3a2a1e');
        P(2, 6, 12, 9, body[0]); P(2, 6, 12, 1, body[1]); P.oval(4, 4, 3, 3, body[0]); P.oval(11, 4, 3, 3, body[0]); P.ring(4, 4, 3, 3, body[1]); P.ring(11, 4, 3, 3, body[1]);
        P(13, 9, 3, 4, '#101820'); P.dot(14, 10, '#c8f0ff');
      },
      lights: v => v === 'museum' ? [[14, 10, 18, '#e8f4ff', 0.25]] : []
    },
    term: {
      w: 1, h: 1, up: 14,
      draw(P, v) {
        P.shadow(8, 29, 7, 2); P(1, 4, 14, 25, '#4a4e58'); P(1, 4, 14, 1, '#7a808c'); P(1, 28, 14, 1, '#2a2c34');
        const scr = v === 'screen' ? '#2a3a2a' : v === 'mine' ? '#1a1c22' : '#103a2a';
        P(3, 7, 10, 8, scr);
        if (v !== 'screen' && v !== 'mine') { P(4, 9, 6, 1, '#5aff9a'); P(4, 11, 4, 1, '#5aff9a'); }
        for (let i = 0; i < 3; i++) P(3 + i * 4, 18, 2, 2, ['#e8c040', '#c83a3a', '#5a9aff'][i]);
        P(3, 22, 10, 4, '#3a3e48'); if (v === 'mine') { P(3, 7, 10, 18, '#5a5e68'); for (let y = 9; y < 25; y += 4) P(4, y, 8, 1, '#3a3e48'); }
      }
    },
    tramodel: {
      w: 1, h: 1, up: 8,
      draw(P) { P(0, 8, 16, 16, '#cfc8b8'); P(0, 6, 16, 3, '#f0ece2'); P(3, 0, 10, 8, '#c84a2a'); P(3, 0, 10, 1, '#e8805a'); P(4, 2, 2, 3, '#a8c8e0'); P(7, 2, 2, 3, '#a8c8e0'); P(10, 2, 2, 3, '#a8c8e0'); }
    },
    globe: {
      w: 1, h: 1, up: 12,
      draw(P) { P(0, 10, 16, 14, '#cfc8b8'); P(0, 8, 16, 3, '#f0ece2'); P(7, 4, 2, 6, '#8a6a2a'); P.oval(8, 2, 5, 5, '#2a4a7a'); P.dot(7, 1, '#e8eef6'); P.ring(8, 2, 6, 2, '#c8a050'); P.ring(8, 2, 2, 6, '#c8a050'); }
    },
    lever: {
      w: 1, h: 1, up: 10,
      draw(P) { P(0, 12, 16, 14, '#cfc8b8'); P(0, 10, 16, 3, '#f0ece2'); P(3, 4, 10, 7, '#5a5e68'); P(3, 4, 10, 1, '#8a909c'); P.line(8, 6, 12, 1, '#2a2c34', 2); P.oval(12, 1, 2, 2, '#c83a3a'); }
    },
    hub: {
      w: 1, h: 1, up: 10,
      draw(P) {
        P(0, 12, 16, 12, '#cfc8b8'); P(0, 10, 16, 3, '#f0ece2');
        P.oval(8, 5, 6, 6, '#2a2c34'); P.oval(7, 4, 4, 4, '#4a4e58'); P.dot(6, 2, '#8a909c');
        for (const [x, y] of [[2, 5], [14, 5], [8, -1], [8, 11]]) P(x - 1, y - 1, 3, 3, '#c8a050');
      }
    },
    cannon: {
      w: 1, h: 1, up: 8,
      draw(P) {
        P(0, 12, 16, 12, '#cfc8b8'); P(0, 10, 16, 3, '#f0ece2');
        P.line(4, 9, 13, 0, '#2a2c34', 4); P.line(4, 8, 12, 0, '#5a5e6a'); P.oval(5, 10, 3, 3, '#5a3a24'); P.oval(11, 10, 3, 3, '#5a3a24'); P.dot(5, 10, '#c8a050'); P.dot(11, 10, '#c8a050');
        P(3, 6, 4, 3, '#2a5aa8');
      }
    },
    carmodel: {
      w: 2, h: 1, up: 8,
      draw(P, v) {
        const c = { bronze: ['#8a6a3a', '#b8925a', '#5a4422'], beacon: ['#2a4a7a', '#4a6aa0', '#18304a'], lantern: ['#d8a830', '#f0c860', '#8a6a1a'] }[v] || ['#a02a2a', '#d05a4a', '#601818'];
        P(0, 18, 32, 6, '#4a3a5a'); P(0, 18, 32, 1, '#7a6a8a');
        P.shadow(16, 18, 14, 2);
        P(2, 6, 28, 9, c[0]); P(2, 6, 28, 1, c[1]); P(7, 0, 16, 7, c[2]); P(8, 1, 6, 5, '#a8c8e0'); P(16, 1, 6, 5, '#a8c8e0');
        P(5, 13, 6, 5, '#141418'); P(21, 13, 6, 5, '#141418'); P(2, 9, 2, 2, '#ffe8a0');
        if (v === 'lantern') { P(13, 0, 6, 2, '#2a2a30'); P(14, 0, 4, 1, '#ffe890'); }
      }
    },
    automodel: {
      w: 1, h: 1, up: 12,
      draw(P, v) {
        P(0, 14, 16, 14, '#cfc8b8'); P(0, 12, 16, 3, '#f0ece2');
        if (v === 'spider') { for (const s of [-1, 1]) { P.line(8, 7, 8 + s * 7, 12, '#2a2c34'); P.line(8, 7, 8 + s * 6, 3, '#2a2c34'); } P.oval(8, 6, 4, 4, '#3a3e48'); P.dot(8, 6, '#ff3a3a'); }
        else if (v === 'beetle') { P.oval(8, 6, 6, 5, '#5a5e68'); P.oval(8, 5, 5, 4, '#8a909c'); P.dot(5, 4, '#ffd040'); P.dot(11, 4, '#ffd040'); P(4, 10, 2, 3, '#2a2c34'); P(10, 10, 2, 3, '#2a2c34'); }
        else { P(4, 4, 9, 5, '#6a707c'); P(11, 1, 4, 4, '#6a707c'); P.dot(13, 2, '#5ad0ff'); P(4, 9, 2, 4, '#3a3e48'); P(10, 9, 2, 4, '#3a3e48'); P(2, 3, 2, 2, '#6a707c'); }
      }
    },
    sewing: {
      w: 1, h: 1, up: 8,
      draw(P, v) {
        P.shadow(8, 23, 7, 2); P(1, 10, 14, 3, '#6a4228'); P(2, 13, 2, 10, '#3a2418'); P(12, 13, 2, 10, '#3a2418');
        P(3, 2, 10, 8, '#1a1a20'); P(3, 2, 10, 1, '#4a4a52'); P(10, 6, 2, 4, '#1a1a20'); P(4, 4, 5, 1, '#c8a050');
        if (v === 'pro') { P.oval(13, 4, 2, 2, '#c8a050'); P(3, 0, 2, 2, '#c8a050'); }
      }
    },
    gclock: {
      w: 1, h: 1, up: 24,
      draw(P) {
        P.shadow(8, 39, 6, 2); P(3, 2, 10, 38, '#5a3a24'); P(3, 2, 10, 1, '#8a5a36'); P(2, 0, 12, 3, '#3a2418');
        P.oval(8, 9, 4, 4, '#f4ecd8'); P.line(8, 9, 8, 6, '#1a1a20'); P.line(8, 9, 10, 10, '#1a1a20');
        P(5, 16, 6, 18, '#2a1a10'); P(7, 18, 2, 10, '#c8a050'); P.oval(8, 29, 2, 2, '#e8c060');
      }
    },
    radiator: {
      w: 1, h: 1, up: 18,
      draw(P) { P.shadow(8, 33, 8, 2); P(1, 2, 14, 30, '#5a4a3a'); P(1, 2, 14, 2, '#8a7458'); P(3, 6, 10, 20, '#ff8a2a'); P(4, 7, 8, 18, '#ffd890'); for (let y = 8; y < 26; y += 3) P(3, y, 10, 1, '#7a3a10'); P(0, 30, 16, 3, '#3a3028'); },
      lights: () => [[8, -4, 34, '#ff9a3a', 0.34, true]]
    },
    rope: {
      w: 1, h: 1, up: 8,
      draw(P) { P(2, 2, 2, 18, '#c8a050'); P(12, 2, 2, 18, '#c8a050'); P.oval(3, 2, 2, 2, '#ffe890'); P.oval(13, 2, 2, 2, '#ffe890'); P(1, 19, 4, 2, '#8a6a2a'); P(11, 19, 4, 2, '#8a6a2a'); P.line(3, 5, 8, 9, '#a8202a', 2); P.line(8, 9, 13, 5, '#a8202a', 2); }
    },
    reception: {
      w: 5, h: 1, up: 10,
      draw(P) {
        P.shadow(40, 25, 38, 3);
        P(0, 4, 80, 6, '#4a3020'); P(0, 4, 80, 2, '#7a5434');
        P(2, 10, 76, 14, '#5a3a24'); P(2, 10, 76, 1, '#8a5a36'); P(2, 23, 76, 1, '#2a1a10');
        for (let x = 6; x < 76; x += 12) { P(x, 13, 8, 8, '#3a2418'); P(x + 1, 14, 6, 6, '#5a3a24'); }
        P(14, 0, 8, 4, '#f4ecd8'); P(52, 1, 3, 3, '#1a1a20'); P(60, 0, 10, 4, '#3a5a8a'); P(61, 1, 8, 2, '#5a7aaa');
      }
    },
    pillar: {
      w: 1, h: 1, up: 34,
      draw(P) { P.shadow(8, 49, 8, 3); P(1, 44, 14, 6, '#cfc8b8'); P(1, 44, 14, 1, '#f0ece2'); P(3, 4, 10, 40, '#e2dccd'); P(3, 4, 2, 40, '#f4f0e6'); P(11, 4, 2, 40, '#b8b0a0'); P(1, 0, 14, 5, '#cfc8b8'); P(1, 0, 14, 1, '#f0ece2'); }
    },
    booth: {
      w: 1, h: 1, up: 22,
      draw(P) {
        P.shadow(8, 38, 8, 2); P.tri([8, 0, -1, 8, 17, 8], '#2a3a5a'); P(0, 6, 16, 2, '#e4ecf4');
        P(1, 8, 14, 30, '#3a4a6a'); P(1, 8, 14, 1, '#5a6a8a'); P(3, 12, 10, 9, '#ffd690'); P(3, 12, 10, 1, '#ffffff'); P(2, 22, 12, 2, '#2a3448'); P(4, 26, 8, 10, '#2a3448');
      },
      lights: () => [[8, -6, 20, '#ffd690', 0.25, true]]
    },
    workbench: {
      w: 2, h: 1, up: 8,
      draw(P) {
        P.shadow(16, 23, 15, 2); P(0, 6, 32, 5, '#7a5a3a'); P(0, 6, 32, 1, '#a07a50'); P(2, 11, 3, 12, '#4a3420'); P(27, 11, 3, 12, '#4a3420');
        P(4, 2, 6, 4, '#cfc8b8'); P(5, 0, 3, 2, '#cfc8b8'); P(14, 3, 8, 2, '#8a909c'); P(24, 1, 4, 5, '#3a5a8a'); P.dot(18, 2, '#c8a050');
      }
    }
  };

  const SCENES = {
    snow: ['#8ab8dc', '#e6eef6', '#c4d0de'], city: ['#4a6a9a', '#d0aa96', '#7a645c'], club: ['#2a2024', '#c84a3a', '#5a3a2a'], mine: ['#1a1d26', '#ffb040', '#4a3424'],
    office: ['#c8dcf0', '#1a3a7a', '#e6e2da'], flower: ['#d8e4cc', '#ff7a9a', '#6a8a5a'], ruin: ['#3a2a4a', '#56d4ff', '#2a1a3a'], theater: ['#5a8ad8', '#e8c040', '#c8a070'],
    engine: ['#6a7aa0', '#c8c2cc', '#4a4650'], monument: ['#4a6a9a', '#bfe6ff', '#8a8490'], zone: ['#6a7a8a', '#3a5aa0', '#e2eaf2'], cable: ['#8ab8dc', '#2a2c34', '#c4d0de'],
    device: ['#1a1830', '#ff6aff', '#3a3e48'], veins: ['#1a1d26', '#ff9a3a', '#3a2a20'], bridge: ['#2a2e3a', '#8a909c', '#1a1d26'], station: ['#3a2a20', '#ffc060', '#5a5e68'],
    hub: ['#6a7a8a', '#2a2c34', '#c8a050'], market: ['#4a3424', '#c87a3a', '#2a2420'], hotel: ['#dccaa8', '#2a7a7a', '#8a2a2a'], workshop: ['#7a5434', '#c8a070', '#3a2818'],
    under: ['#2a2e3a', '#ffb050', '#4a3a2a'], citadel: ['#2a1e3a', '#8a6aaa', '#3a3e48'], mount: ['#8ab8dc', '#ffffff', '#6a7a9a'], dawn: ['#ffc890', '#e4ecf4', '#6a7aa0'],
    labor: ['#4a3424', '#e0a040', '#6a5a4a'], boulder: ['#2e2a2c', '#ffb050', '#7a4430'], clubin: ['#3a2a24', '#e8c040', '#7a2a1a'], admin: ['#52648a', '#e4c4b0', '#a49c92'],
    photo: ['#c8b89a', '#5a4a3a', '#8a7a62'], posters: ['#e8dcc0', '#c84a3a', '#4a3a2a'], posters2: ['#e8dcc0', '#3a5aa0', '#4a3a2a'], concept: ['#f4ecd8', '#6a5a3a', '#c8b89a'],
    sewad: ['#f4ecd8', '#1a1a20', '#c8a050'], machine: ['#5a5e68', '#2a2c34', '#c8a050']
  };

  function sceneIn(P, x, y, w, h, v) {
    const k = SCENES[v] || SCENES.city, hz = y + Math.floor(h * 0.55);
    P(x, y, w, h, k[0]); P(x, hz, w, y + h - hz, k[2]);
    P(x + Math.floor(w * 0.25), hz - Math.floor(h * 0.3), Math.max(2, Math.floor(w * 0.35)), Math.floor(h * 0.3), k[1]);
    P(x + Math.floor(w * 0.65), hz - Math.floor(h * 0.18), Math.max(2, Math.floor(w * 0.2)), Math.floor(h * 0.18), k[1]);
    if (v === 'photo' || v === 'posters' || v === 'posters2' || v === 'concept' || v === 'sewad') { P(x + 1, y + h - 3, w - 2, 1, k[1]); P(x + 1, y + 1, w - 2, 1, k[1]); }
  }

  function vitrineItem(P, v) {
    switch (v) {
      case 'meteor': P.oval(8, 15, 4, 3, '#3a2a3a'); P.oval(7, 14, 2, 1, '#6a5a6a'); P.dot(9, 16, '#a87aff'); P.dot(6, 15, '#a87aff'); return;
      case 'ore': P.tri([8, 8, 5, 19, 11, 19], '#ff9a3a'); P.tri([8, 9, 7, 17, 9, 15], '#ffd890'); P.tri([5, 13, 3, 19, 7, 19], '#c86a1a'); return;
      case 'radio': P(4, 11, 8, 8, '#6a4a2a'); P(4, 11, 8, 1, '#8a6a3a'); P.oval(7, 15, 2, 2, '#3a2a1a'); P(10, 13, 1, 4, '#c8a050'); return;
      case 'lamp': P(5, 17, 6, 2, '#3a3028'); P.line(8, 17, 6, 11, '#3a3028'); P.tri([4, 12, 9, 9, 10, 13], '#2a6a4a'); P.dot(7, 13, '#ffe890'); return;
      case 'bottle': P(6, 11, 4, 8, '#8ac0a0'); P(7, 9, 2, 2, '#8ac0a0'); P.dot(6, 8, '#ff7a9a'); P.dot(9, 7, '#ffd040'); P.dot(8, 9, '#e8507a'); return;
      case 'jewel': P(5, 14, 6, 4, '#8a3a4a'); P(5, 13, 6, 1, '#c8a050'); P.dot(8, 13, '#a8e0ff'); return;
      case 'case': P(4, 13, 8, 6, '#7a4a2a'); P(4, 13, 8, 1, '#a06a3a'); P(7, 11, 2, 2, '#3a2418'); P(4, 16, 8, 1, '#c8a050'); return;
      case 'bedroll': P.oval(8, 16, 5, 3, '#5a6a3a'); P(5, 13, 1, 6, '#3a2418'); P(10, 13, 1, 6, '#3a2418'); return;
      case 'oillamp': P(5, 16, 6, 3, '#8a6a2a'); P(6, 10, 4, 6, 'rgba(255,240,200,0.7)'); P(7, 12, 2, 3, '#ffb040'); return;
      case 'craft': P(6, 12, 4, 7, '#a07a50'); P.oval(8, 10, 2, 2, '#a07a50'); P.dot(7, 10, '#3a2418'); return;
      case 'component': P.ring(6, 14, 3, 3, '#8a909c'); P.ring(10, 15, 2, 2, '#c8a050'); P.dot(6, 14, '#5a5e68'); return;
      case 'device': P.oval(8, 14, 4, 4, '#2a2c34'); P.ring(8, 14, 5, 2, '#c8a050'); P.dot(8, 14, '#ff6aff'); return;
      case 'papers': P(3, 12, 6, 7, '#f4ecd8'); P(7, 11, 6, 7, '#e8dcc0'); P(8, 13, 4, 1, '#4a3a2a'); P(8, 15, 3, 1, '#4a3a2a'); P(4, 14, 3, 1, '#4a3a2a'); return;
      case 'bat': P.line(4, 19, 12, 8, '#c8ccd4', 2); P.line(4, 19, 6, 16, '#4a3a5a', 2); return;
      case 'lance': P.line(8, 19, 8, 9, '#c8a050', 1); P.tri([8, 6, 6, 10, 10, 10], '#e8f4ff'); P.dot(8, 13, '#ff7a2a'); return;
    }
  }

  const LAYER = {
    porch(P, v, Z) {
      const w = ((v | 0) || 2) * U;
      P(0, 12, w, 4, '#3a2a20'); P(2, 14, w - 4, 18, '#1a1210'); P(4, 16, w - 8, 16, '#2a1e18');
      P(0, 10, w, 3, Z.trim[0]); P(-2, 8, w + 4, 3, '#7a2a2a'); P(-2, 8, w + 4, 1, '#b84a3a');
      for (let x = 2; x < w - 2; x += 4) P(x, 11, 2, 2, '#ffd690');
      P(0, 28, w, 2, Z.ground ? Z.ground[2] : '#3a2a20');
    },
    toolwall(P) {
      P(0, 1, 32, 14, '#5a3a22'); for (let i = 0; i < 6; i++) { const x = 2 + i * 5; P(x, 3, 1, 9, '#8a909c'); P(x - 1, 3, 3, 2, ['#c83a3a', '#e8c040', '#5a5e6a'][i % 3]); }
      P.oval(26, 8, 3, 3, '#8a909c'); P(0, 14, 32, 1, '#3a2818');
    },
    painting(P, v) {
      P(2, 2, 12, 10, '#c8a050'); P(3, 3, 10, 8, v === 'sea' ? '#4a7aa8' : '#6a8a5a'); P(3, 8, 10, 3, v === 'sea' ? '#8ab8e0' : '#e8dcc0'); P.dot(10, 5, '#ffe890');
    },
    fortbanner(P) { P(4, 0, 8, 24, '#1a3a7a'); P(4, 0, 8, 2, '#c8a050'); P(6, 6, 4, 4, '#e8eef6'); P(7, 12, 2, 6, '#e8eef6'); P.tri([4, 24, 8, 20, 12, 24], '#0e2450'); },
    rug(P, v, Z) {
      const [w, h] = (v || '4x2').split('x').map(Number);
      P(0, 0, w * U, h * U, '#5a1a1a'); P(2, 2, w * U - 4, h * U - 4, '#8a2a2a');
      P(4, 4, w * U - 8, 1, '#c89a4a'); P(4, h * U - 5, w * U - 8, 1, '#c89a4a'); P(4, 4, 1, h * U - 8, '#c89a4a'); P(w * U - 5, 4, 1, h * U - 8, '#c89a4a');
      P.oval(w * 8, h * 8, Math.min(w, h) * 4, Math.min(w, h) * 3, '#a8403a');
    },
    timetable(P) { P(1, 2, 30, 12, '#1a1c22'); P(1, 2, 30, 1, '#5a5e6a'); for (let y = 5; y < 13; y += 3) { P(3, y, 12, 1, '#ffd040'); P(18, y, 10, 1, '#e8dcc0'); } },
    programs(P) { P(2, 4, 5, 8, '#e8dcc0'); P(9, 4, 5, 8, '#c84a3a'); P(2, 4, 5, 2, '#5a3a2a'); P(9, 4, 5, 2, '#ffd040'); },
    sign(P, v, Z) {
      const w = ((v | 0) || 2) * U;
      P(1, 3, w - 2, 9, '#2a2420'); P(2, 4, w - 4, 7, '#7a2a1a'); P(2, 4, w - 4, 1, '#c85a3a');
      for (let x = 5; x < w - 5; x += 4) P(x, 7, 2, 2, '#ffd690');
    },
    banner(P, v, Z) { P(5, 0, 6, 15, '#2a5aa8'); P(5, 0, 6, 1, '#ffffff'); P(6, 4, 4, 1, '#ffffff'); P(7, 6, 2, 5, '#e8f0ff'); P.tri([5, 15, 8, 12, 11, 15], '#1a3a78'); },
    poster(P) { P(3, 2, 10, 12, '#e8dcc0'); P(3, 2, 10, 1, '#ffffff'); P(5, 4, 6, 5, '#7a6a5a'); P(4, 10, 8, 1, '#8a2a1a'); P(4, 12, 8, 1, '#4a3a2a'); },
    bracket(P, v, Z) { P(2, 3, 6, 1, '#2a2c34'); P(7, 2, 1, 4, '#2a2c34'); P(5, 4, 5, 6, '#2a2c34'); P(6, 5, 3, 4, Z.lamp); P(6, 5, 3, 1, '#ffffff'); },
    portrait(P, v) {
      const k = { alisa: ['#e8dcc0', '#2a5aa8'], alina: ['#f0c870', '#8a2a3a'], svetlana: ['#8a5a3a', '#3a5a3a'], alexandra: ['#c8c6c2', '#4a3a6a'], cyrille: ['#d8b070', '#6a4a3a'], cocolia: ['#f4f0e8', '#2a3a6a'] }[v] || ['#8a5a3a', '#3a3e48'];
      P(2, 0, 12, 16, '#c8a050'); P(2, 0, 12, 1, '#ffe890'); P(3, 1, 10, 14, '#2a2620');
      P(4, 9, 8, 6, k[1]); P.oval(8, 6, 3, 3, '#f0d0b8'); P(5, 3, 6, 3, k[0]); P(4, 5, 2, 6, k[0]); P(10, 5, 2, 6, k[0]);
      if (v === 'cocolia') { P(10, 10, 3, 4, '#f0d0b8'); P(10, 8, 3, 2, '#e8e4e0'); }
      P(5, 15, 6, 1, '#8a6a2a');
    },
    art(P, v) { P(1, 2, 14, 12, '#c8a050'); P(1, 2, 14, 1, '#ffe890'); sceneIn(P, 2, 3, 12, 10, v); },
    screen(P) {
      P(0, 1, 48, 14, '#f4f2ec'); P(0, 1, 48, 1, '#ffffff'); P(0, 14, 48, 1, '#b8b0a0');
      P(4, 4, 18, 1, '#c8c2b4'); P(4, 7, 26, 1, '#c8c2b4'); P(4, 10, 14, 1, '#c8c2b4'); P.oval(38, 8, 4, 4, '#d8d4ca');
    },
    minerail(P, v) {
      const n = (v | 0) || 4;
      for (let i = 0; i < n; i++) { P(i * 16, 6, 16, 2, '#8a909c'); P(i * 16, 11, 16, 2, '#8a909c'); for (let x = 2; x < 16; x += 5) P(i * 16 + x, 5, 2, 9, '#5a4028'); P(i * 16 + 7, 13, 2, 3, '#3a3e48'); }
    },
    clinicsign(P) {
      P(1, 3, 46, 10, '#e8e4dc'); P(1, 3, 46, 1, '#ffffff'); P(1, 12, 46, 1, '#8a8678');
      P(5, 5, 6, 6, '#c83a3a'); P(7, 4, 2, 8, '#ffffff'); P(5, 7, 6, 2, '#ffffff');
      for (const [x, w] of [[14, 5], [21, 4], [27, 6], [35, 8]]) P(x, 7, w, 2, '#4a3a2a');
    },
    ring(P) {
      const W = 9 * 16, Hh = 6 * 16;
      P(4, 2, W - 8, 2, '#e8dcc0'); P(4, Hh - 6, W - 8, 2, '#e8dcc0'); P(2, 6, 2, Hh - 14, '#e8dcc0'); P(W - 4, 6, 2, Hh - 14, '#e8dcc0');
      for (const [x, y] of [[2, 2], [W - 6, 2], [2, Hh - 8], [W - 6, Hh - 8]]) { P(x, y, 5, 6, '#c8a050'); P(x + 1, y, 3, 2, '#ffe890'); }
      P.oval(W / 2, Hh / 2, 16, 10, 'rgba(255,220,160,0.12)');
    },
    board(P) {
      P(0, 1, 16, 14, '#4a3226'); P(1, 2, 14, 12, '#7a5a3e'); P(0, 1, 16, 1, '#a07a50');
      P(2, 3, 5, 7, '#e8dcc0'); P(8, 3, 6, 5, '#d8ccb0'); P(8, 9, 6, 4, '#e8dcc0'); P(3, 5, 3, 1, '#4a3a2a'); P(9, 5, 4, 1, '#4a3a2a'); P(9, 11, 4, 1, '#4a3a2a');
      P.dot(4, 3, '#c84a3a'); P.dot(10, 3, '#c84a3a'); P.dot(10, 9, '#c84a3a');
    },
    rift(P) {
      P.line(1, 12, 6, 7, '#56d4ff'); P.line(6, 7, 9, 10, '#56d4ff'); P.line(9, 10, 15, 3, '#56d4ff');
      P.line(1, 13, 6, 8, '#1a0e2a'); P.line(9, 11, 15, 4, '#1a0e2a'); P.dot(6, 7, '#c8f4ff'); P.dot(12, 6, '#c8f4ff');
    },
    plaque(P) {
      P(2, 3, 44, 11, '#1e2a4a'); P(2, 3, 44, 1, '#c8a050'); P(2, 13, 44, 1, '#c8a050'); P(2, 3, 1, 11, '#c8a050'); P(45, 3, 1, 11, '#c8a050');
      P.tri([6, 7, 10, 4, 14, 7], '#c8a050'); for (const x of [7, 10, 13]) P(x, 7, 1, 5, '#c8a050'); P(6, 12, 9, 1, '#c8a050');
      for (const [x, w] of [[18, 4], [24, 3], [29, 5], [36, 6]]) { P(x, 6, w, 1, '#e8d8a8'); P(x, 9, w - 1, 1, '#e8d8a8'); }
    },
    pclock(P) { P(4, 0, 8, 16, '#5a3a24'); P(4, 0, 8, 1, '#8a5a36'); P.oval(8, 4, 3, 3, '#f4ecd8'); P.dot(8, 3, '#1a1a20'); P(6, 8, 4, 7, '#2a1a10'); P(7, 9, 2, 4, '#c8a050'); },
    shopsign(P) {
      P(4, 0, 24, 2, '#2a2c34'); P(6, 2, 1, 3, '#2a2c34'); P(25, 2, 1, 3, '#2a2c34');
      P(2, 5, 28, 10, '#3a2418'); P(3, 6, 26, 8, '#c8642a'); P(3, 6, 26, 1, '#ffb45a');
      P.ring(16, 10, 4, 3, '#3a2418'); P(9, 10, 14, 1, '#3a2418');
      P(3, 13, 26, 1, '#8a3a1a');
    },
    festoon(P, v) {
      const w = ((v | 0) || 8) * 16;
      for (let x = 0; x < w; x++) { const t = (x % 32) / 32, y = 2 + Math.round(Math.sin(t * Math.PI) * 5); P(x, y, 1, 1, '#2a2420'); if (x % 8 === 4) { P(x - 1, y + 1, 3, 3, ['#ffd080', '#ff9a5a', '#fff0c0', '#ffb45a'][(x >> 3) % 4]); P(x, y + 1, 1, 1, '#ffffff'); } }
    },
    playmat(P) {
      for (let r = 0; r < 4; r++) P.arc(40, 56, 18 + r * 9, 12 + r * 6, Math.PI * 1.05, Math.PI * 1.95, r % 2 ? '#8a6a5a' : '#6a7a8a');
      P.oval(40, 50, 6, 3, '#5a4a40');
    },
    manhole(P) { P.oval(8, 8, 6, 5, '#2a2c34'); P.oval(8, 8, 5, 4, '#4a4e58'); P(4, 8, 9, 1, '#2a2c34'); P(8, 4, 1, 9, '#2a2c34'); }
  };
  const LAYER_SIZE = { sign: [2, 1], banner: [1, 1], poster: [1, 1], bracket: [1, 1], manhole: [1, 1], porch: [2, 2], toolwall: [2, 1], painting: [1, 1], fortbanner: [1, 2], rug: [4, 2], timetable: [2, 1], programs: [1, 1], portrait: [1, 1], art: [1, 1], screen: [3, 1], pclock: [1, 1], plaque: [3, 1], board: [1, 1], rift: [1, 1], shopsign: [2, 1], festoon: [16, 1], playmat: [5, 4], clinicsign: [3, 1], ring: [9, 6], minerail: [4, 1] };
  const LAYER_LIGHT = { bracket: () => [[8, 7, 22, '#ffb050', 0.3, true]], rift: () => [[8, 8, 18, '#56d4ff', 0.22, true]], shopsign: () => [[16, 10, 22, '#ff9a4a', 0.24, true]], festoon: v => Array.from({ length: (v | 0) || 8 }, (_, i) => [i * 16 + 8, 6, 18, '#ffd080', 0.22, true]) };

  function buildLayer(map, K = KIT) {
    const def = map.def, Z = K.LANDS[def.land] || K.LANDS[K.fallback], land = K.LANDS[def.land] ? def.land : K.fallback;
    const st = S();
    const cv = G.mkCanvas(map.w * U, map.h * U), g = cv.getContext('2d');
    const inside = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h;
    const kind = (x, y) => G.tileKindAt(map, x, y);
    const isWall = k => k === 'wall' || k === 'rock' || K.BUILD.has(k);
    const wall = (x, y) => !inside(x, y) || isWall(kind(x, y));
    const rocky = (x, y) => { const k = inside(x, y) ? kind(x, y) : 'wall'; return k === 'rock' || (k === 'wall' && !Z.rockHouse); };
    const depth = (x, y) => {
      const rk = rocky(x, y), top = rk ? 2 : (def.storeys || Z.storeys || 2);
      for (let d = 1; d <= top; d++) {
        if (y + d >= map.h) return 0;
        if (!wall(x, y + d)) return d;
        if (rocky(x, y + d) !== rk) return 0;
      }
      return 0;
    };
    const role = (x, y) => {
      if (!wall(x, y)) return null;
      const d = depth(x, y);
      return d === 1 ? 'low' : d > 1 ? 'high' : 'roof';
    };
    const winCol = (x, y) => {
      for (let k = -3; k <= 3; k++) { const yy = y + k; if (inside(x, yy) && kind(x, yy) === 'window' && role(x, yy)) return true; }
      return false;
    };
    const baseKind = (H.TILES[def.floor] || { kind: 'floor' }).kind;
    const floorKind = (x, y) => {
      const k = kind(x, y);
      if (!K.PROPS.has(k)) return k;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
        const n = inside(x + dx, y + dy) ? kind(x + dx, y + dy) : 'wall';
        if (!K.PROPS.has(n) && !isWall(n) && n !== 'chasm' && n !== 'door' && n !== 'stairs') return n;
      }
      return baseKind;
    };
    const lights = [], sprites = [];
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const P = st.pen(g, x * U, y * U), ro = role(x, y), e = { x, y, k: kind(x, y) };
      const open = { u: inside(x, y - 1) && !wall(x, y - 1), d: inside(x, y + 1) && !wall(x, y + 1), l: inside(x - 1, y) && !wall(x - 1, y), r: inside(x + 1, y) && !wall(x + 1, y) };
      if (!ro) {
        const fk = floorKind(x, y);
        const same = (dx, dy) => inside(x + dx, y + dy) && floorKind(x + dx, y + dy) === fk;
        e.same = { u: same(0, -1), d: same(0, 1), l: same(-1, 0), r: same(1, 0) };
        e.railV = (kind(x, y - 1) === 'rail' || kind(x, y + 1) === 'rail') && !(kind(x - 1, y) === 'rail' || kind(x + 1, y) === 'rail');
        e.bridgeV = kind(x, y - 1) !== 'chasm' && kind(x, y + 1) !== 'chasm';
        K.floorPaint(P, Z, fk, e);
        if (wall(x, y - 1)) { P(0, 0, U, 3, 'rgba(0,0,0,0.3)'); P(0, 3, U, 2, 'rgba(0,0,0,0.12)'); }
        if (wall(x - 1, y) && role(x - 1, y) === 'roof') P(0, 0, 2, U, 'rgba(0,0,0,0.25)');
        if (kind(x, y) !== 'chasm' && inside(x, y + 1) && kind(x, y + 1) === 'chasm' && !Z.ice && !Z.noRail) { P(0, U - 3, U, 2, Z.trim[1]); P(0, U - 3, U, 1, Z.trim[0]); if (x % 2 === 0) P(2, U - 7, 2, 5, Z.frame); }
        if (K.PROPS.has(kind(x, y))) {
          const s = K.propSprite(kind(x, y), Z, land, x, y, (xx, yy) => inside(xx, yy) ? kind(xx, yy) : 'wall');
          if (s) {
            sprites.push({ k: kind(x, y), x, y, w: 1, h: 1, up: s.up, cv: s.cv, sort: y });
            if (s.light) lights.push(st.light(x, y, s.light));
          }
        }
        continue;
      }
      const rk = rocky(x, y);
      if (ro === 'roof') {
        if (rk) { e.deep = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -2], [0, 2], [-2, 0], [2, 0]].every(([dx, dy]) => wall(x + dx, y + dy)); K.rockTop(P, Z, e, open); }
        else K.roofTile(P, Z, e, open, role(x, y + 1) === 'high' || role(x, y + 1) === 'low');
        continue;
      }
      if (rk) { e.capTop = open.u; K.rockFace(P, Z, ro, e); continue; }
      const sides = { l: inside(x - 1, y) && wall(x - 1, y) && !rocky(x - 1, y), r: inside(x + 1, y) && wall(x + 1, y) && !rocky(x + 1, y) };
      const k0 = kind(x, y), ch = k0 === 'house' && winCol(x, y) ? 'window' : k0;
      e.top = ro === 'high' && role(x, y - 1) !== 'high';
      K.faceTile(P, Z, ro, ch, e, sides);
      if (ch === 'window' && Z.night > 0.5 && hash(x * 23 + 1, y * 9 + 1, 163) < Z.night) lights.push(st.light(x, y, [8, 8, 16, Z.lit, 0.16]));
    }
    for (const [k, x, y, v, cond] of def.decor || []) {
      if (K.LAYER[k]) {
        K.LAYER[k](st.pen(g, x * U, y * U), v, Z);
        for (const l of (K.LAYER_LIGHT[k] || (() => []))(v)) lights.push(st.light(x, y, l));
        continue;
      }
      const d = K.DECOR[k];
      if (!d) continue;
      const [w, h] = d.size ? d.size(v) : [d.w, d.h];
      const ps = d.prop && K.propSprite(d.prop, K.LANDS[v] || Z, K.LANDS[v] ? v : land, x, y);
      if (ps) {
        sprites.push({ k, x, y, w, h, up: ps.up, cv: ps.cv, sort: y + h - 1, if: cond });
        if (ps.light) lights.push(Object.assign(st.light(x, y, ps.light), { if: cond }));
        continue;
      }
      const cvs = spr(w * U, h * U, d.up, P => d.draw(P, v));
      sprites.push({ k, x, y, w, h, up: d.up, cv: cvs, sort: y + h - 1, if: cond });
      for (const l of d.lights ? d.lights(v) : []) lights.push(Object.assign(st.light(x, y, l), { if: cond }));
    }
    return { cv, anims: [], th: def.theme, deco: true, land, outside: def.outside || K.outside, tint: Z.tint, glass: [], lights, sprites, overs: [] };
  }

  const KIT = { LANDS, DECOR, LAYER, LAYER_LIGHT, BUILD, PROPS, floorPaint, roofTile, faceTile, rockFace, rockTop, propSprite, outside: 'jarilo', fallback: 'city' };

  let tramCv = null;
  function tramSprite() {
    if (!tramCv) { const d = DECOR.tram; tramCv = { cv: spr(d.w * U, d.h * U, d.up, P => d.draw(P)), up: d.up }; }
    return tramCv;
  }

  H.Jarilo = { buildLayer, LANDS, DECOR, LAYER, LAYER_SIZE, tramSprite, KIT, spr };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
