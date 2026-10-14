(function (S) {
  'use strict';
  const { C, Buf, Pen, part, grad, line, hash } = S;
  const BG = S.BG;
  const E = S.EP105;
  const L = E.LAYERS;
  const A = S.art105;
  const { vgrad, pool, textOn, sprite, lineIn } = BG;
  const OX = E.OX;
  const { GLOW, LAMP, NEON_G } = A;

  const VMAP = {
    grey: 'lilac', wood: 'blue', oak: 'purple', teal: 'pink', olive: 'slime', stone: 'sky', brick: 'orchid', sand: 'yellow',
    asphalt: 'night', navy: 'plum', cream: 'mint', rose: 'teal', plum: 'blue', sky: 'pink', green: 'slime', red: 'orange',
    night: 'purple', gold: 'yellow', purple: 'mint', blue: 'sky', orange: 'red', cheese: 'pink', dskin: 'dskin', skin: 'skin'
  };
  const LUT = new Uint8Array(256);
  for (let i = 0; i < 256; i++) LUT[i] = i;
  for (const [from, to] of Object.entries(VMAP)) {
    const a = C[from], b = C[to];
    for (let i = 0; i < a.length; i++) {
      const k = Math.round(i * (b.length - 1) / Math.max(1, a.length - 1));
      LUT[a[i]] = b[Math.min(b.length - 1, k + (i > 0 && i < a.length - 1 ? 1 : 0))];
    }
  }

  function virt(buf) {
    const px = buf.px;
    for (let i = 0; i < px.length; i++) px[i] = LUT[px[i]];
    return buf;
  }

  function virtSprite(spr) {
    const b = new Buf(spr.w, spr.h);
    for (let i = 0; i < spr.px.length; i++) b.px[i] = spr.px[i] ? LUT[spr.px[i]] : 0;
    return b;
  }

  function netGrid(buf, y0, y1, vx, c, step, ph) {
    const w = buf.w;
    for (let r = 0; r < 9; r++) {
      const y = Math.round(y0 + (y1 - y0) * Math.pow((r + (ph || 0)) / 9, 1.7));
      for (let x = 0; x < w; x++) if ((x + r) % 2 === 0) buf.set(x, y, c);
    }
    for (let bx = -400; bx <= w + 400; bx += step || 40) {
      const n = y1 - y0;
      for (let i = 0; i <= n; i += 2) {
        const t = i / n;
        const x = Math.round(vx + (bx - vx) * (0.35 + t * 0.65));
        if (x >= 0 && x < w) buf.set(x, y0 + i, c);
      }
    }
  }

  function bankAd(buf, P, x, y, w, h) {
    part(buf, P.rect(x, y, w, h), C.night, { b: 1 });
    part(buf, P.rect(x + 2, y + 2, w - 4, h - 4), C.green, { b: 1, sh: 0, hi: 0 });
    part(buf, P.rect(x + w / 2 - 9, y + 5, 18, 20), C.grey, { b: 5 });
    part(buf, P.ell(x + w / 2, y + 17, 6, 6), C.sky, { b: 3 });
    textOn(buf, '$', x + w / 2 - 2, y + 13, C.green[1], 0);
    buf.set(x + w / 2 - 6, y + 8, C.neonA); buf.set(x + w / 2 - 3, y + 8, C.neonB);
    textOn(buf, 'БАНКО', x + 4, y + h - 21, C.lamp, 0);
    textOn(buf, 'ЛАВАДЕРО', x + 2, y + h - 12, C.lamp, 0);
  }

  function pixTree(buf, P, x, y) {
    part(buf, P.rect(x - 4, y - 52, 8, 52), C.orange, { b: 2 });
    for (let i = 0; i < 5; i++) line(buf, x - 2 + (i % 2) * 3, y - 46 + i * 9, x - 1 + (i % 2) * 3, y - 40 + i * 9, C.orange[0]);
    for (const [dx, dy, r] of [[-16, -60, 15], [14, -62, 17], [-2, -78, 19], [-24, -78, 12], [24, -82, 11], [2, -96, 13]]) {
      const m = P.rect(x + dx - r, y + dy - r, r * 2, r * 2);
      part(buf, m, C.mint, { b: 3 });
      for (let k = 0; k < 5; k++) buf.set(x + dx - r + 3 + Math.floor(hash(k, dx, dy) * (r * 2 - 6)), y + dy - r + 3 + Math.floor(hash(k, dy, dx) * (r * 2 - 6)), C.pink[3]);
    }
  }

  function billboard(buf, P, x, y, w, h, big) {
    part(buf, P.rect(x - 2, y - 2, w + 4, h + 4), C.lilac, { b: 2 });
    const face = P.rect(x, y, w, h);
    grad(buf, face, C.yellow, (px, py) => 0.55 + (py - y) / h * 0.4);
    S.bigText(buf, 'MP3', x + (big ? 74 : 30), y + (big ? 12 : 4), big ? 6 : 3, C.red[3], C.pink[4], big ? 2 : 1);
    const t = 'СКАЧАЙ ДАРОМ';
    if (big) S.bigText(buf, t, x + w / 2 - 20, y + h - 30, 2, C.blue[2], C.sky[4], 1);
    else textOn(buf, t, x + 3, y + h - 12, C.blue[1], 0);
    for (let i = 0; i < (big ? 9 : 4); i++) {
      const nx = x + w - (big ? 58 : 26) + (i % 3) * (big ? 18 : 8), ny = y + (big ? 14 : 6) + Math.floor(i / 3) * (big ? 22 : 10) + (i % 2) * 3;
      part(buf, P.ell(nx, ny + 5, big ? 3.4 : 1.8, big ? 2.6 : 1.4), C.night, { b: 1, sh: 0, hi: 0 });
      line(buf, nx + (big ? 3 : 1), ny + 5, nx + (big ? 3 : 1), ny - (big ? 5 : 2), C.night[1]);
    }
    S.outerLine(buf, face, C.black);
  }

  BG.street2 = function (buf) {
    BG.street5(buf);
    virt(buf);
    const P = new Pen(buf);
    const sky = P.rect(0, 0, buf.w, 6);
    sky.each((x, y) => buf.set(x, y, (x + y) % 2 ? C.pink[2] : C.purple[2]));
    const road = P.rect(0, 171, buf.w, 29);
    part(buf, road, C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
    netGrid(buf, 171, 199, buf.w / 2, C.tvB, 46);
    for (let x = 0; x < buf.w; x++) { buf.set(x, 170, C.tvA); if (x % 4 < 2) buf.set(x, 137, C.neonB); }
    part(buf, P.rect(6, 76, 50, 52), C.lilac, { b: 1 });
    bankAd(buf, P, 8, 78, 46, 48);
    part(buf, P.rect(66, 66, 42, 74), C.lilac, { b: 2 });
    const door = P.rect(70, 70, 34, 68);
    grad(buf, door, [C.night[0], C.night[1], C.purple[1], C.purple[2]], (x, y) => (y - 70) / 80);
    for (let y = 74; y < 136; y += 6) line(buf, 72, y, 101, y, C.tvB);
    line(buf, 87, 70, 87, 138, C.tvA);
    part(buf, P.rect(6, 38, 104, 28), C.night, { b: 1 });
    S.bigText(buf, 'ПУЛЬТ', 58, 41, 2, C.tvB, C.tvA, 0);
    textOn(buf, 'РЕАЛЬНОСТЬ 2.0', 14, 57, C.neonB, 0);
    S.outerLine(buf, door, C.black);
    billboard(buf, P, OX + 18, 8, 116, 44, false);
    pixTree(buf, P, OX + 364, 142);
    pool(buf, 87, 150, 30, 10, 0.8);
  };

  BG.control = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 128);
    vgrad(buf, wall, [C.night[0], C.night[1], C.purple[1], C.purple[2]], 0, 128, 0.05, 0.8);
    wall.each((x, y) => { if (x % 32 === 0 || y % 32 === 0) buf.set(x, y, C.purple[3]); else if ((x % 32 === 1 || y % 32 === 1) && (x + y) % 2) buf.set(x, y, C.purple[1]); });
    part(buf, P.rect(0, 0, 320, 8), C.night, { b: 0, sh: 0, hi: 0 });
    for (let x = 8; x < 320; x += 16) buf.set(x, 5, (x / 16) % 3 ? C.tvA : C.neonA);
    part(buf, P.rect(62, 12, 204, 78), C.lilac, { b: 1 });
    part(buf, P.rect(66, 16, 196, 70), C.night, { b: 0, sh: 0, hi: 0 });
    part(buf, P.rect(4, 36, 38, 112), C.lilac, { b: 2 });
    const door = P.rect(8, 40, 30, 106);
    grad(buf, door, [C.pink[1], C.pink[2], C.pink[3], C.lamp], (x, y) => (y - 40) / 110);
    textOn(buf, 'УЛИЦА', 7, 28, C.neonB, 0);
    S.outerLine(buf, door, C.black);
    part(buf, P.rect(276, 30, 40, 96), C.lilac, { b: 1 });
    for (let r = 0; r < 2; r++) {
      part(buf, P.ell(296, 52 + r * 30, 11, 11), C.night, { b: 1 });
      part(buf, P.ell(296, 52 + r * 30, 4, 4), C.lilac, { b: 4, sh: 0 });
    }
    for (let i = 0; i < 5; i++) buf.set(282 + i * 7, 116, i % 2 ? C.neonB : C.neonA);
    part(buf, P.rect(0, 122, 320, 7), C.purple, { b: 3, sh: 0, hi: 1 });
    const floor = P.rect(0, 128, 320, 72);
    part(buf, floor, C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
    grad(buf, floor, [C.night[0], C.night[1], C.night[2]], (x, y) => (y - 128) / 110);
    netGrid(buf, 129, 199, 160, C.pink[2], 40);
    for (let x = 0; x < 320; x++) buf.set(x, 128, C.tvA);
    pool(buf, 160, 52, 110, 40, 0.5);
  };

  BG.roof2 = function (buf) {
    const P = new Pen(buf);
    const sky = P.rect(0, 0, 320, 150);
    vgrad(buf, sky, [C.night[1], C.purple[1], C.purple[2], C.pink[2], C.pink[3], C.orange[3], C.yellow[3]], 0, 150, 0, 1);
    const sun = P.ell(262, 120, 34, 34);
    sun.each((x, y) => { if (y < 150 && Math.floor((y - 86) / 4) % 2 === 0) buf.set(x, y, y < 118 ? C.yellow[3] : C.orange[3]); });
    for (let i = 0; i < 40; i++) buf.set(Math.floor(hash(i, 5, 1) * 320), Math.floor(hash(i, 5, 2) * 60), C.lamp);
    for (const [x, w, h] of [[226, 22, 30], [252, 16, 46], [272, 26, 24], [300, 20, 40]]) {
      part(buf, P.rect(x, 150 - h, w, h), C.night, { b: 1, sh: 0, hi: 0, ol: C.tvB });
      for (let yy = 150 - h + 4; yy < 148; yy += 6) for (let xx = x + 3; xx < x + w - 2; xx += 5) if (hash(xx, yy, 3) > 0.5) buf.set(xx, yy, C.tvA);
    }
    billboard(buf, P, 14, 12, 204, 118, true);
    for (const x of [30, 196]) part(buf, P.rect(x, 130, 6, 22), C.lilac, { b: 2, sh: 0 });
    const deck = P.rect(0, 148, 320, 52);
    grad(buf, deck, C.blue, (x, y) => 0.3 + (y - 148) / 120);
    for (let x = -40; x < 360; x += 24) lineIn(buf, deck, 160 + (x - 160) * 0.7, 148, x, 200, C.blue[0]);
    for (let x = 0; x < 320; x++) { buf.set(x, 148, C.tvA); if (x % 3 === 0) buf.set(x, 172, C.blue[1]); }
    part(buf, P.rect(0, 140, 320, 3), C.lilac, { b: 3, sh: 0 });
    for (let x = 8; x < 320; x += 26) if (x < 22 || x > 214) part(buf, P.rect(x, 142, 2, 8), C.lilac, { b: 2, sh: 0, hi: 0 });
    part(buf, P.rect(224, 156, 44, 16), C.night, { b: 1 });
    textOn(buf, 'ВНИЗ', 232, 160, C.neonB, 0);
    part(buf, P.poly([238, 176, 254, 176, 246, 186]), NEON_G, { sh: 0, hi: 0 });
  };

  function netCar(P, b, x, y, cols, plate) {
    const zone = [[x, x + 46], [x + 46, x + 92], [x + 92, x + 134]];
    const body = P.path(`M ${x} ${y + 31} L ${x - 1} ${y + 22} L ${x + 6} ${y + 17} L ${x + 40} ${y + 16} L ${x + 50} ${y + 5} L ${x + 92} ${y + 5} L ${x + 96} ${y + 15} L ${x + 112} ${y + 15} L ${x + 128} ${y + 3} L ${x + 131} ${y + 5} L ${x + 130} ${y + 17} L ${x + 131} ${y + 31} Z`);
    P.part(body, C.grey, { b: 5 });
    body.each((px, py) => {
      if (b.px[py * b.w + px] === C.black) return;
      const zi = px < zone[0][1] ? 0 : px < zone[1][1] ? 1 : 2;
      const id = cols[zi];
      const p = E.PAINTS.find(q => q.id === id);
      if (p) { const r = C[p.ramp]; b.set(px, py, py < y + 12 ? r[4] : py > y + 26 ? r[2] : r[3]); }
      else b.set(px, py, (Math.floor(px / 4) + Math.floor(py / 4)) % 2 ? C.grey[5] : C.grey[1]);
      if (px === zone[0][1] || px === zone[1][1]) b.set(px, py, C.black);
    });
    P.part(P.poly([x + 52, y + 7, x + 66, y + 7, x + 66, y + 15, x + 46, y + 15]), GLOW, { b: 3, sh: 0, hi: 0 });
    P.part(P.poly([x + 70, y + 7, x + 90, y + 7, x + 93, y + 15, x + 70, y + 15]), GLOW, { b: 3, sh: 0, hi: 0 });
    for (const wx of [x + 22, x + 104]) {
      P.part(P.rect(wx - 9, y + 23, 18, 18), C.night, { b: 1 });
      P.part(P.rect(wx - 4, y + 28, 8, 8), NEON_G, { sh: 0, hi: 0 });
    }
    P.part(P.rect(x + 56, y + 19, 30, 10), C.cream, { b: 4 });
    textOn(b, plate.toUpperCase(), x + 61, y + 20, C.navy[0], 0);
    P.part(P.rect(x - 2, y + 25, 5, 3), LAMP, { sh: 0, hi: 0 });
  }
  A.netCar = netCar;

  const lay = (room, arts) => { L[room] = Object.assign(L[room] || {}, arts); };
  const fileIcon = (P, b, x, y, ramp, ext) => {
    P.part(P.poly([x, y, x + 8, y, x + 11, y + 3, x + 11, y + 13, x, y + 13]), C.grey, { b: 5, sh: 1 });
    P.part(P.rect(x + 1.4, y + 6, 8, 5), ramp, { b: 3, sh: 0, hi: 0, ol: 0 });
    S.font.draw(b, ext, x + 13, y + 4, C.lamp, C.black);
  };

  lay('office2', {
    closetOpen: g => sprite(46, 92, (P, b) => {
      S.blit(b, virtSprite(S.LAYERS.office.closetOpen(g)), 0, 0);
      const inner = P.rect(4, 4, 32, 82);
      P.part(inner, C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
      inner.each((x, y) => { if ((x + y) % 8 === 0) b.set(x, y, C.tvB); });
      fileIcon(P, b, 6, 5, C.night, 'EXE');
      fileIcon(P, b, 6, 21, C.skin, 'DOC');
      fileIcon(P, b, 6, 37, C.yellow, 'BMP');
      fileIcon(P, b, 6, 53, C.rose, 'ZIP');
      fileIcon(P, b, 6, 69, C.red, 'DLL');
    }),
    desk: () => virtSprite(S.LAYERS.office.desk()),
    phone: () => virtSprite(S.LAYERS.office.phone()),
    coin: g => sprite(16, 16, P => {
      const k = g ? Math.floor(g.time * 6) % 4 : 0;
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + k * 0.5; P.px(8 + Math.cos(a) * 7, 9 + Math.sin(a) * 6, C.lamp); }
      A.coin(P, 8, 10, 4, k);
    }),
    logo: g => sprite(30, 22, P => {
      P.part(P.rect(0, 0, 30, 22), C.night, { b: 0, sh: 0, hi: 0 });
      A.netHead(P.scaled(15, 12, 0.62), 15, 12, { anim: g ? Math.floor(g.time * 4) % 4 : 0, talk: g && Math.floor(g.time * 5) % 3 === 0 });
    })
  });

  lay('street2', {
    lamp: () => virtSprite(S.LAYERS.street.lamp()),
    hydrant: () => virtSprite(S.LAYERS.street.hydrant()),
    emailbox: g => sprite(24, 34, (P, b) => {
      P.part(P.rect(10, 18, 4, 16), C.lilac, { b: 2, sh: 0 });
      P.part(P.path('M 2 20 L 2 9 Q 2 1 12 1 Q 22 1 22 9 L 22 20 Z'), C.sky, { b: 3 });
      P.part(P.rect(5, 12, 14, 2.4), C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.part(P.poly([7, 5, 17, 5, 17, 10, 7, 10]), C.grey, { b: 5, sh: 0, hi: 0 });
      P.curve('M 7 5 L 12 8.4 L 17 5', C.grey[2]);
      if (g && g.f.infected) { for (let i = 0; i < 4; i++) P.px(6 + i * 4, 15 + (i % 2) * 2, C.neonB); }
    }),
    desoto2: g => sprite(140, 46, (P, b) => netCar(P, b, 4, 3, (g && g.f.car ? g.f.car : '---').split(''), E.PLATE)),
    coins: g => sprite(52, 20, P => {
      const k = g ? Math.floor(g.time * 6) % 4 : 0;
      for (let i = 0; i < 3; i++) A.coin(P, 8 + i * 18, 10 + (i === 1 ? -4 : 0), 5, (k + i) % 4);
    }),
    jack: g => sprite(30, 30, P => A.jackBox(P, 13, 19, 1.2, g && !g.f.popOff)),
    popups: g => sprite(70, 60, P => {
      const k = g ? Math.floor(g.time * 3) : 0;
      const spots = [[2, 6], [40, 0], [44, 30], [0, 34], [22, 18]];
      for (let i = 0; i < spots.length; i++) if ((i + k) % 5 !== 0) A.popup(P, spots[i][0] + ((i + k) % 2) * 2, spots[i][1] + ((i * 3 + k) % 3), 24, 20, i + k);
    }),
    sword2: () => sprite(14, 20, P => { A.sword(P, 3, 2, 10, 18, C.sky, C.gold); P.px(2, 1, C.lamp); }),
    paperY: () => virtSprite(L.street.paperY()),
    paperG: () => virtSprite(L.street.paperG()),
    sybilPlate: () => virtSprite(L.street.sybilPlate()),
    boscoFlag: () => virtSprite(L.street.boscoFlag()),
    boscoBanner: () => virtSprite(L.street.boscoBanner()),
    posters: () => virtSprite(L.street.posters()),
    pedestal: g => sprite(40, 30, P => {
      const k = g ? Math.floor(g.time * 4) % 4 : 0;
      P.part(P.ell(20, 24, 18, 5), C.lilac, { b: 2 });
      P.part(P.ell(20, 22, 13, 3.4), GLOW, { b: 3, sh: 0, hi: 0 });
      for (let i = 0; i < 5; i++) P.px(8 + i * 6, 16 - ((i + k) % 4) * 4, C.cycle[i + k]);
    })
  });

  lay('bosco2', {
    counter: () => virtSprite(S.LAYERS.bosco.counter()),
    glovearm: g => virtSprite(S.LAYERS.bosco.glovearm(g)),
    sludgie: g => sprite(28, 58, (P, b) => A.sludgieArt(P, b, true, g ? g.time : 0)),
    spawn: g => sprite(74, 30, (P, b) => {
      P.part(P.rect(0, 0, 74, 12), C.night, { b: 1 });
      textOn(b, 'ВОЗРОЖДЕНИЕ', 3, 2, g && Math.floor(g.time * 2) % 2 ? C.neonB : C.lamp, 0);
      P.part(P.poly([32, 14, 42, 14, 37, 22]), NEON_G, { sh: 0, hi: 0 });
    }),
    pad: g => sprite(44, 14, P => {
      const k = g ? Math.floor(g.time * 4) % 3 : 0;
      P.part(P.ell(22, 7, 20, 6), C.night, { b: 1 });
      P.part(P.ell(22, 7, 14 - k * 3, 4 - k), NEON_G, { sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(22, 7, 9 - k * 2, 2.4 - k * 0.5), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
    }),
    potions: () => sprite(40, 18, P => {
      P.part(P.rect(0, 14, 40, 4), C.blue, { b: 3 });
      [C.slime, C.pink, C.sky, C.orange, C.purple].forEach((r, i) => {
        P.part(P.ell(4 + i * 8, 10, 3, 3.6), r, { b: 3 });
        P.part(P.rect(3 + i * 8, 3, 2, 4), C.grey, { b: 5, sh: 0, hi: 0 });
      });
    }),
    rack: () => sprite(30, 40, (P, b) => {
      P.part(P.rect(0, 0, 30, 40), C.blue, { b: 1 });
      for (let i = 0; i < 3; i++) { const Q = P; A.sword(Q, 5 + i * 10, 36, 5 + i * 10, 6, i === 1 ? C.oak : C.grey, C.gold); }
      textOn(b, '+0', 9, 30, C.lamp, C.black);
    })
  });

  lay('sybil2', {
    couch: g => virtSprite(S.LAYERS.sybil.couch(g)),
    lamp: () => virtSprite(S.LAYERS.sybil.lamp()),
    desk: g => sprite(64, 56, (P, b) => {
      const Q = new Pen(b).at(0, 8, 1);
      Q.part(Q.poly([2, 12, 62, 10, 64, 18, 0, 20]), C.blue, { b: 4 });
      Q.part(Q.poly([0, 20, 64, 18, 64, 48, 0, 48]), C.blue, { b: 3 });
      Q.part(Q.rect(6, 24, 22, 20), C.blue, { b: 3, sh: 1, hi: 1 });
      Q.part(Q.rect(36, 24, 22, 20), C.blue, { b: 3, sh: 1, hi: 1 });
      for (let i = 0; i < 8; i++) Q.px(4 + i * 8, 19, C.tvA);
    }),
    mouth: g => sprite(30, 20, P => {
      const t = g ? g.time : 0;
      const open = g && g.vt.blogT && g.time < g.vt.blogT ? (Math.floor(t * 9) % 3 ? 4 : 1.4) : 1;
      const bob = Math.round(Math.sin(t * 2) * 1.5);
      P.part(P.path(`M 2 ${9 + bob} Q 8 ${2 + bob} 15 ${6 + bob} Q 22 ${2 + bob} 28 ${9 + bob} Q 22 ${13 + open + bob} 15 ${13 + open + bob} Q 8 ${13 + open + bob} 2 ${9 + bob} Z`), C.pink, { b: 3 });
      P.part(P.path(`M 6 ${9 + bob} Q 15 ${8 + bob} 24 ${9 + bob} Q 15 ${9 + open * 1.4 + bob} 6 ${9 + bob} Z`), C.red, { b: 1, sh: 0, hi: 0, ol: 0 });
      if (open > 2) P.part(P.rect(11, 9 + bob, 8, 1.6), C.eye, { sh: 0, hi: 0, ol: 0 });
      P.px(7, 6 + bob, C.pink[4]);
    }),
    glow: g => sprite(40, 96, P => {
      const k = g ? Math.floor(g.time * 5) % 3 : 0;
      for (let y = 4; y < 92; y += 3) { P.px(1 + ((y + k) % 3), y, C.lamp); P.px(38 - ((y + k) % 3), y, C.lamp); }
      for (let x = 3; x < 38; x += 3) { P.px(x, 92 + ((x + k) % 3), C.lamp); P.px(x, 94, C.yellow[3]); }
    }),
    clock: g => sprite(20, 20, P => {
      P.part(P.ell(10, 10, 9, 9), C.mint, { b: 4 });
      P.part(P.ell(10, 10, 6.6, 6.6), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
      const a = g ? g.time * 2 : 0;
      P.line(10, 10, 10 + Math.cos(a) * 5, 10 + Math.sin(a) * 5, C.red[3]);
      P.line(10, 10, 10 + Math.cos(a * 12) * 3.4, 10 + Math.sin(a * 12) * 3.4, C.night[1]);
    })
  });

  lay('roof2', {
    stuck: g => sprite(40, 46, (P, b) => {
      A.sword(P, 8, 4, 30, 40, C.sky, C.gold);
      S.font.draw(b, '+2', 22, 4, C.lamp, C.black);
      if (g && g.f.slimeOnSword) for (const [x, y] of [[26, 34], [30, 38], [24, 38]]) P.part(P.ell(x, y, 2.4, 1.8), C.sky, { b: 3, sh: 0, hi: 0 });
      for (let i = 0; i < 4; i++) P.line(30, 40, 24 + i * 5, 46 - (i % 2) * 3, C.yellow[1]);
    })
  });

  Object.assign(BG, { virt, virtSprite, netGrid });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
