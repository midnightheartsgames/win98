(function (S) {
  'use strict';
  const { C, Buf, Pen, part, shade, grad, hash, line } = S;
  const BG = S.BG;
  const E = S.EP201;
  const L = E.LAYERS;
  const A = S.art201;
  const { vgrad, pool, textOn, sprite, bricks, lineIn, dropShadow, vignette } = BG;
  const STREET_W = 880;

  function snowCap(buf, x0, x1, y) {
    for (let x = x0; x < x1; x++) {
      const h = 1 + Math.floor(hash(x >> 1, y, 3) * 2.4);
      for (let k = 0; k < h; k++) buf.set(x, y - k, k ? C.grey[5] : C.grey[4]);
    }
  }

  function garland(buf, x0, x1, y, sag, seed) {
    const cols = [C.neonA, C.lamp, C.neonB, C.sky[4]];
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / Math.max(1, x1 - x0);
      const yy = Math.round(y + Math.sin(t * Math.PI) * sag);
      buf.set(x, yy, C.green[1]);
      if ((x - x0) % 7 === 3) { buf.set(x, yy + 1, cols[((x - x0) / 7 + seed) % 4 | 0]); buf.set(x, yy + 2, cols[((x - x0) / 7 + seed) % 4 | 0]); }
    }
  }

  function pavement(buf, w) {
    const P = new Pen(buf);
    const walk = P.rect(0, 138, w, 30);
    grad(buf, walk, C.stone, (x, y) => 0.55 + (y - 138) / 90 + (hash(Math.floor(x / 2), Math.floor(y / 2), 4) - 0.5) * 0.1);
    for (let x = 0; x < w; x += 30) lineIn(buf, walk, x + 8, 138, x - 4, 168, C.stone[1]);
    lineIn(buf, walk, 0, 152, w, 152, C.stone[2]);
    walk.each((x, y) => { if (hash(x, y, 77) < 0.05) buf.set(x, y, C.grey[5]); });
    part(buf, P.rect(0, 136, w, 3), C.stone, { b: 2, sh: 0, hi: 0 });
    part(buf, P.rect(0, 166, w, 5), C.stone, { b: 1, sh: 0, hi: 1 });
    const road = P.rect(0, 171, w, 29);
    grad(buf, road, C.asphalt, (x, y) => 0.55 - (y - 171) / 120 + (hash(x, y, 6) - 0.5) * 0.2);
    for (let x = 20; x < w; x += 60) part(buf, P.rect(x, 194, 26, 3), C.yellow, { b: 3, sh: 0, hi: 0, ol: 0 });
    for (let x = 0; x < w; x++) if (hash(x, 3, 9) < 0.4) buf.set(x, 171, C.grey[5]);
  }

  function garage(buf, x0) {
    const P = new Pen(buf);
    const wall = P.rect(x0, 18, 140, 120);
    bricks(buf, wall, 12, 6, C.olive, C.olive[0], 21);
    shade(buf, wall, 0, (x, y) => (y - 18) / 300);
    part(buf, P.rect(x0, 14, 140, 6), C.olive, { b: 1 });
    vgrad(buf, P.rect(x0, 0, 140, 14), C.sky, 0, 80, 0.7, 0.3);
    part(buf, P.rect(x0 + 6, 26, 128, 30), C.night, { b: 1 });
    S.bigText(buf, 'ГАРАЖ', x0 + 70, 29, 2, C.neonB, C.mint[4], 1);
    textOn(buf, 'К.О.П.С. ТЮНИНГ', x0 + 22, 46, C.lamp, C.black);
    const door = P.rect(x0 + 18, 70, 104, 68);
    part(buf, door, C.night, { b: 1 });
    grad(buf, P.rect(x0 + 20, 96, 100, 40), C.teal, (x, y) => 0.2 + (y - 96) / 70);
    for (let i = 0; i < 6; i++) part(buf, P.rect(x0 + 18, 70 + i * 4, 104, 4), C.grey, { b: 2 + (i % 2), sh: 0, hi: 0 });
    part(buf, P.rect(x0 + 16, 66, 108, 4), C.grey, { b: 1, sh: 0 });
    for (let i = 0; i < 5; i++) buf.set(x0 + 30 + i * 20, 100, C.neonB);
    part(buf, P.rect(x0 + 132, 18, 8, 120), C.grey, { b: 2, sh: 0 });
    snowCap(buf, x0, x0 + 140, 14);
  }

  function diner(buf, x0) {
    const P = new Pen(buf);
    const wall = P.rect(x0, 30, 174, 108);
    vgrad(buf, wall, C.mint, 30, 138, 0.75, 0.4);
    wall.each((x, y) => { if ((y - 30) % 14 === 0) buf.set(x, y, C.mint[1]); });
    vgrad(buf, P.rect(x0, 0, 174, 30), C.sky, 0, 80, 0.7, 0.5);
    part(buf, P.path(`M ${x0} 30 L ${x0 + 174} 30 L ${x0 + 174} 22 Q ${x0 + 87} 10 ${x0} 22 Z`), C.pink, { b: 3 });
    for (let x = x0; x < x0 + 174; x += 8) part(buf, P.poly([x, 30, x + 8, 30, x + 4, 36]), x % 16 ? C.pink : C.grey, { b: 4, sh: 0, hi: 0 });
    part(buf, P.rect(x0 + 24, 38, 126, 18), C.night, { b: 1 });
    S.bigText(buf, 'У СТИНКИ', x0 + 87, 41, 2, C.neonA, C.pink[4], 1);
    for (const wx of [x0 + 8, x0 + 104]) {
      const win = P.rect(wx, 64, 58, 50);
      grad(buf, win, C.teal, (x, y) => 0.75 - (y - 64) / 80 + (hash(x >> 2, y >> 2, 5) - 0.5) * 0.1);
      S.outerLine(buf, win, C.black);
      part(buf, P.rect(wx - 2, 114, 62, 4), C.pink, { b: 3, sh: 0 });
      for (let i = 0; i < 3; i++) part(buf, P.ell(wx + 12 + i * 16, 104, 5, 6), C.grey, { b: 2, sh: 0, hi: 0, ol: 0 });
      part(buf, P.rect(wx + 4, 96, 50, 4), C.red, { b: 2, sh: 0, hi: 0 });
    }
    const door = P.rect(x0 + 68, 70, 32, 68);
    part(buf, door, C.pink, { b: 2 });
    grad(buf, P.rect(x0 + 72, 76, 24, 30), C.teal, (x, y) => 0.7 - (y - 76) / 50);
    part(buf, P.ell(x0 + 94, 112, 1.6, 1.6), C.gold, { b: 3, sh: 0 });
    const m = new Pen(buf).at(x0 + 160, 136, 1);
    m.part(m.path('M -6 0 Q -10 -12 -4 -20 Q 2 -26 0 -34 Q 6 -28 4 -20 Q 10 -12 6 0 Z'), C.teal, { b: 3 });
    m.part(m.ell(0, -40, 5, 5.6), C.pale, { b: 3 });
    m.part(m.path('M -6 -42 Q -4 -50 4 -48 Q 8 -44 6 -36 Q 2 -42 -6 -42 Z'), C.teal, { b: 4, sh: 0 });
    garland(buf, x0 + 2, x0 + 172, 58, 4, 2);
    snowCap(buf, x0 + 6, x0 + 168, 114);
  }

  BG.street21 = function (buf) {
    const base = new Buf(640, 200, 1);
    BG.street(base);
    const P = new Pen(buf);
    vgrad(buf, P.rect(0, 0, STREET_W, 200), C.sky, 0, 80, 0.7, 0.3);
    const copy = (sx0, sx1, dx) => {
      for (let y = 0; y < 138; y++) for (let x = sx0; x < sx1; x++) buf.px[y * buf.w + x + dx] = base.px[y * 640 + x];
    };
    copy(152, 564, -12);
    copy(0, 154, 552);
    pavement(buf, STREET_W);
    garage(buf, 0);
    diner(buf, 706);
    snowCap(buf, 146, 382, 62);
    snowCap(buf, 386, 552, 16);
    snowCap(buf, 552, 708, 6);
    garland(buf, 150, 380, 6, 5, 0);
    garland(buf, 392, 548, 58, 4, 1);
    garland(buf, 556, 704, 60, 4, 3);
    part(buf, P.rect(650, 86, 40, 24), C.gold, { b: 3 });
    textOn(buf, 'Е. В.', 661, 88, C.gold[0], 0);
    textOn(buf, 'СИБИЛ', 656, 98, C.gold[0], 0);
    part(buf, P.rect(556, 44, 144, 11), C.red, { b: 1 });
    textOn(buf, 'КАНАДА. КАНЦЕЛЯРИЯ', 572, 46, C.grey[5], 0);
    for (const [x, y] of [[100, 150], [330, 160], [520, 146], [760, 156]]) { line(buf, x, y, x + 5, y + 3, C.stone[1]); line(buf, x + 5, y + 3, x + 9, y + 2, C.stone[1]); }
    pool(buf, 160, 150, 40, 12, 0.6);
    pool(buf, 428, 150, 40, 12, 0.6);
    pool(buf, 788, 150, 40, 12, 0.6);
    shade(buf, P.rect(0, 0, 8, 200), 0, x => (8 - x) / 8);
    shade(buf, P.rect(STREET_W - 8, 0, 8, 200), 0, x => (x - STREET_W + 8) / 8);
  };

  BG.diner21 = function (buf, o) {
    o = o || {};
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 132);
    vgrad(buf, wall, C.mint, 0, 132, 0.25, 0.7);
    wall.each((x, y) => { if (y > 70 && (x + y) % 12 === 0) buf.set(x, y, C.teal[2]); });
    part(buf, P.rect(0, 70, 320, 4), C.pink, { b: 3, sh: 0 });
    const floor = P.poly([0, 132, 320, 132, 320, 200, 0, 200]);
    floor.each((x, y) => { const k = (Math.floor(x / 14) + Math.floor((y - 132) / 9)) % 2; buf.set(x, y, k ? C.grey[5] : C.pink[2]); });
    shade(buf, floor, 0, (x, y) => (y - 132) / 260);
    part(buf, P.rect(0, 128, 320, 5), C.pink, { b: 2, sh: 0 });
    part(buf, P.rect(4, 40, 28, 92), C.pink, { b: 2 });
    grad(buf, P.rect(8, 46, 20, 40), C.teal, (x, y) => 0.7 - (y - 46) / 60);
    part(buf, P.ell(27, 92, 1.6, 1.6), C.gold, { b: 3, sh: 0 });
    for (const wx of [44, 132]) {
      const win = P.rect(wx, 18, 70, 42);
      grad(buf, win, C.sky, (x, y) => 0.75 - (y - 18) / 70);
      for (let i = 0; i < 7; i++) buf.set(wx + 6 + i * 9, 50 - (i % 3), C.grey[5]);
      S.outerLine(buf, win, C.black);
      part(buf, P.rect(wx - 2, 60, 74, 3), C.pink, { b: 3, sh: 0 });
    }
    part(buf, P.rect(212, 12, 104, 50), C.night, { b: 1 });
    textOn(buf, 'МЕНЮ', 250, 14, C.lamp, 0);
    const menu = ['Суп дня', 'Сэндвич Нептун', 'Пирог «Сюрприз»', 'Кофе как есть'];
    menu.forEach((m, i) => textOn(buf, m, 218, 24 + i * 9, C.grey[5], 0));
    const counter = P.poly([178, 106, 320, 106, 320, 150, 178, 150]);
    part(buf, counter, C.pink, { b: 2 });
    part(buf, P.rect(176, 100, 144, 7), C.grey, { b: 4 });
    for (let x = 184; x < 320; x += 14) part(buf, P.rect(x, 112, 8, 34), C.pink, { b: 3, sh: 0, hi: 1 });
    part(buf, P.rect(40, 96, 110, 6), C.red, { b: 3 });
    part(buf, P.rect(36, 74, 10, 54), C.red, { b: 2 });
    part(buf, P.rect(146, 74, 10, 54), C.red, { b: 2 });
    part(buf, P.rect(92, 100, 6, 30), C.grey, { b: 3, sh: 0 });
    garland(buf, 0, 320, 6, 6, 1);
    garland(buf, 176, 320, 96, 3, 2);
    if (o.xmas) {
      for (let i = 0; i < 40; i++) buf.set(Math.floor(hash(i, 4, 1) * 320), 8 + Math.floor(hash(i, 4, 2) * 60), [C.red[3], C.gold[4], C.green[3]][i % 3]);
      part(buf, P.rect(118, 62, 84, 11), C.red, { b: 3 });
      textOn(buf, 'С РОЖДЕСТВОМ', 122, 63, C.gold[4], 0);
    }
    pool(buf, 160, 60, 140, 60, 0.4);
    vignette(buf, 0.9);
  };

  BG.garage21 = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 130);
    bricks(buf, wall, 14, 7, C.stone, C.stone[0], 12);
    shade(buf, wall, 0, (x, y) => 0.6 - y / 300);
    const floor = P.poly([0, 130, 320, 130, 320, 200, 0, 200]);
    grad(buf, floor, C.asphalt, (x, y) => 0.4 + (y - 130) / 110 + (hash(x >> 1, y >> 1, 3) - 0.5) * 0.1);
    for (let x = 0; x < 320; x += 40) lineIn(buf, floor, x, 130, x - 30, 200, C.asphalt[1]);
    part(buf, P.rect(0, 126, 320, 5), C.stone, { b: 1, sh: 0 });
    part(buf, P.rect(2, 40, 34, 90), C.grey, { b: 1 });
    for (let i = 0; i < 8; i++) part(buf, P.rect(4, 42 + i * 10, 30, 6), C.grey, { b: 3, sh: 0, hi: 0 });
    part(buf, P.rect(60, 18, 120, 70), C.grey, { b: 5 });
    S.outerLine(buf, P.rect(60, 18, 120, 70), C.black);
    for (const [x, y, r] of [[80, 40, 6], [104, 30, 4], [150, 56, 7]]) part(buf, P.ell(x, y, r, r), [C.neonB, C.neonB, C.neonB, C.neonB, C.neonB], { b: 3, sh: 0, hi: 0, ol: 0 });
    textOn(buf, 'ДОПОЛНЕННАЯ', 76, 62, C.grey[1], 0);
    textOn(buf, 'РЕАЛЬНОСТЬ', 80, 72, C.grey[1], 0);
    part(buf, P.rect(200, 20, 100, 36), C.night, { b: 1 });
    textOn(buf, 'ТЮНИНГ', 230, 24, C.lamp, 0);
    textOn(buf, 'РЕКОРД: 19 КУКОЛ', 204, 38, C.neonA, 0);
    for (let x = 194; x < 310; x += 12) { part(buf, P.rect(x, 68, 3, 16), C.grey, { b: 3, sh: 0 }); }
    for (let i = 0; i < 6; i++) part(buf, P.rect(198 + i * 18, 70 + (i % 2) * 4, 10, 4), [C.red, C.grey, C.gold][i % 3], { b: 3, sh: 0 });
    part(buf, P.rect(232, 104, 84, 8), C.wood, { b: 3 });
    part(buf, P.rect(236, 112, 6, 30), C.wood, { b: 2, sh: 0 });
    part(buf, P.rect(306, 112, 6, 30), C.wood, { b: 2, sh: 0 });
    garland(buf, 0, 320, 4, 8, 0);
    pool(buf, 120, 50, 130, 70, 0.5);
    vignette(buf, 0.8);
  };

  const lay = (room, arts) => { L[room] = Object.assign(L[room] || {}, arts); };

  function closetItems() {
    return {
      closetOpen: gg => S.LAYERS.office.closetOpen(gg),
      mrbear: gg => sprite(24, 26, P => { S.art103.mrBear(P, 12, 24, gg ? gg.time : 0); S.art106.goggles(P, 12, 8.4, 0.62); }),
      head: () => sprite(16, 20, (P, b) => { S.art104.presHead(new Pen(b).at(8, 11, 0.5), 0, 0, { v: 'dead' }); }),
      leoCloset: () => sprite(36, 92, (P, b) => {
        const sp = S.sprite('leonard', { act: 'tied', v: 'tape', dir: 's' }, 0.8);
        S.blit(b, sp.buf, 13 - sp.ox, 88 - sp.oy);
        S.art.bradyHair(new Pen(b).at(13, 42, 0.8), 0, 0);
      }),
      capgun: () => sprite(10, 10, P => {
        P.px(5, 0, C.grey[3]);
        P.part(P.poly([1, 2, 9, 2, 9, 4.4, 4.4, 5, 4, 9, 1, 9]), C.grey, { b: 4 });
        P.part(P.rect(8, 2, 2, 2.4), C.orange, { b: 3, sh: 0, hi: 0 });
      }),
      glove: () => sprite(14, 14, P => {
        P.line(7, 0, 7, 3, C.grey[3]);
        P.part(P.ell(7, 8, 5.4, 5), C.red, { b: 3 });
        P.part(P.ell(3, 7, 2.4, 2.8), C.red, { b: 3 });
        P.part(P.rect(4, 11.6, 6, 2.4), C.grey, { b: 5, sh: 0 });
      }),
      jar: gg => sprite(12, 16, P => {
        const k = gg ? Math.floor(gg.time * 3) % 4 : 0;
        P.part(P.rect(2, 3, 8, 12), S.art106.GLOW, { b: 3, sh: 0, hi: 0 });
        P.part(P.rect(1.4, 1, 9.2, 2.6), C.grey, { b: 2, sh: 0 });
        for (let i = 0; i < 3; i++) P.px(3 + ((i * 3 + k) % 6), 6 + ((i * 4 + k * 2) % 8), C.cycle[i * 2 + k]);
      }),
      key: () => sprite(24, 12, P => A.windKey(P, 12, 8, 0.7))
    };
  }

  lay('office', Object.assign(closetItems(), {
    desk: () => S.LAYERS.office.desk(),
    phone: () => S.LAYERS.office.phone(),
    hanger: () => S.LAYERS.office.hanger(),
    cooler: g => sprite(24, 72, P => A.cooler(P, 12, 70, { k: g ? g.time * 6 : 0, gone: !!(g && g.f.introDone) })),
    machine: g => sprite(16, 10, P => {
      P.part(P.rect(0, 2, 16, 8), C.grey, { b: 1 });
      P.part(P.rect(2, 4, 7, 4), C.grey, { b: 0, sh: 0, hi: 0 });
      P.px(12, 5, g && !g.f.machineDone && Math.floor(g.time * 2) % 2 ? C.neonA : C.red[1]);
    }),
    flinthole: () => sprite(14, 12, P => {
      P.part(P.ell(7, 6, 5, 4.4), C.night, { b: 0, sh: 0, hi: 0 });
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; P.line(7 + Math.cos(a) * 5, 6 + Math.sin(a) * 4.4, 7 + Math.cos(a) * 7, 6 + Math.sin(a) * 5.6, C.teal[1]); }
      P.px(6, 5, C.lamp);
    }),
    tree: () => sprite(30, 40, P => {
      P.part(P.rect(12, 32, 6, 8), C.wood, { b: 2 });
      for (let i = 0; i < 3; i++) P.part(P.poly([15 - 13 + i * 3, 32 - i * 9, 15 + 13 - i * 3, 32 - i * 9, 15, 14 - i * 9]), C.green, { b: 3 });
      for (const [x, y, c] of [[9, 28, C.red], [20, 24, C.gold], [13, 16, C.sky], [17, 8, C.pink]]) P.part(P.ell(x, y, 1.6, 1.6), c, { b: 3, sh: 0 });
      P.part(P.ell(15, 1.6, 2, 2), C.gold, { b: 4, sh: 0 });
    })
  }));

  lay('street', {
    desoto: () => S.LAYERS.street.desoto(),
    lamp: () => S.LAYERS.street.lamp(),
    hydrant: () => S.LAYERS.street.hydrant(),
    mailbox: () => S.LAYERS.street.mailbox(),
    robot: g => sprite(180, 200, P => A.robot(P, 90, 198, { body: 'front', head: E.robotHead(g), k: g ? Math.floor(g.time * 3) : 0, talk: E.robotHead(g) === 'face' && g.speech.some(s => s.who === 'robot') && Math.floor(g.time * 9) % 3 > 0, eye: true })),
    wreck: g => sprite(330, 80, P => A.wreck(P, 165, 78, { ring: !!(g && g.f.robotDown) })),
    note: () => sprite(46, 14, (P, b) => {
      P.part(P.rect(1, 1, 44, 12), C.cream, { b: 4 });
      textOn(b, 'ЗАКРЫТО', 3, 3, C.red[2], 0);
    }),
    jimmyledge: g => sprite(28, 30, (P, b) => {
      const sp = S.sprite('jimmy', { dir: 's', blink: g ? Math.floor(g.time * 2) % 7 === 0 : false }, 0.9);
      S.blit(b, sp.buf, 14 - sp.ox, 28 - sp.oy);
    })
  });

  lay('bosco', {
    counter: () => S.LAYERS.bosco.counter(),
    table: () => S.LAYERS.bosco.table(),
    glovearm: g => S.LAYERS.bosco.glovearm(g),
    parcel: g => sprite(28, 20, P => A.parcel(P, 14, 18, 1, g ? g.time * 4 : 0)),
    parcel2: g => sprite(28, 20, P => { A.parcel(P, 14, 18, 0.9, g ? g.time * 6 + 1 : 0); A.stopwatch(P, 20, 8, 0.5); }),
    xray: g => sprite(46, 40, (P, b) => {
      P.part(P.rect(20, 0, 4, 10), C.grey, { b: 2, sh: 0 });
      P.part(P.rect(2, 10, 42, 30), C.grey, { b: 2 });
      const scr = P.rect(6, 14, 34, 22);
      S.grad(b, scr, C.sky, (x, y) => 0.15 + (y - 14) / 60);
      if (g && !g.f.famineGot) {
        A.horse(new Pen(b), 22, 34, 'famine', 0.7);
        for (let y = 14; y < 36; y++) for (let x = 6; x < 40; x++) { const v = b.px[y * b.w + x]; if (v && v !== C.black && S.C.sky.indexOf(v) < 0) b.px[y * b.w + x] = C.sky[4]; }
        P.part(P.ell(12, 22, 3.4, 3.4), C.sky, { b: 4, sh: 0, hi: 0, ol: C.grey[5] });
      }
    }),
    gate: g => sprite(40, 80, P => {
      P.part(P.rect(0, 0, 4, 80), C.grey, { b: 2 });
      P.part(P.rect(34, 0, 4, 80), C.grey, { b: 2 });
      const k = g ? Math.floor(g.time * 4) % 2 : 0;
      for (let i = 0; i < 6; i++) P.line(4, 8 + i * 12 + k, 34, 12 + i * 12 - k, C.neonA);
    })
  });

  lay('stinky', {
    stinkycounter: () => sprite(144, 50, P => {
      P.part(P.rect(0, 6, 144, 44), C.pink, { b: 2 });
      P.part(P.rect(0, 0, 144, 7), C.grey, { b: 4 });
      for (let x = 6; x < 144; x += 14) P.part(P.rect(x, 12, 8, 34), C.pink, { b: 3, sh: 0, hi: 1 });
    }),
    booth: () => sprite(126, 60, P => {
      P.part(P.rect(4, 22, 118, 6), C.red, { b: 3 });
      P.part(P.rect(0, 0, 10, 58), C.red, { b: 2 });
      P.part(P.rect(112, 0, 10, 58), C.red, { b: 2 });
      P.part(P.rect(54, 26, 6, 32), C.grey, { b: 3, sh: 0 });
      P.part(P.ell(30, 20, 5, 2), C.grey, { b: 5 });
      P.part(P.ell(86, 20, 5, 2), C.grey, { b: 5 });
    }),
    prize: () => sprite(28, 34, P => {
      P.part(P.rect(2, 26, 24, 6), C.gold, { b: 3 });
      A.horse(P, 14, 27, 'pest', 0.9);
    }),
    quizboard: () => sprite(62, 38, (P, b) => {
      P.line(10, 30, 4, 37, C.wood[2]); P.line(52, 30, 58, 37, C.wood[2]);
      P.part(P.rect(0, 0, 62, 30), C.wood, { b: 2 });
      P.part(P.rect(3, 3, 56, 24), C.night, { b: 1, sh: 0 });
      textOn(b, 'ВИКТОРИНА', 5, 4, C.grey[5], 0);
      textOn(b, 'ПРИЗ: МОР', 6, 15, C.lamp, 0);
    }),
    bath: g => sprite(34, 16, P => A.footbath(P, 17, 15, 1, g ? g.time * 3 : 0)),
    sock: () => sprite(16, 22, P => A.sock(P, 7, 20, 1, false)),
    sugar: () => sprite(12, 18, P => {
      P.part(P.rect(2, 4, 8, 13), C.sky, { b: 4, sh: 0 });
      P.part(P.rect(1, 1, 10, 4), C.grey, { b: 4, sh: 0 });
      P.line(6, 0, 9, -2, C.grey[3]);
    }),
    roaches: g => sprite(320, 200, P => {
      const k = g ? g.time : 0;
      for (let i = 0; i < 26; i++) {
        const x = 10 + ((hash(i, 1, 1) * 300 + Math.sin(k * (0.6 + hash(i, 2, 2)) + i) * 14) % 300);
        const y = 30 + hash(i, 3, 3) * 160;
        const sp = S.sprite('roach', { dir: i % 2 ? 'e' : 'w', walk: (k * 2 + i * 0.13) % 1 }, 0.8 + hash(i, 4, 4) * 0.7);
        S.blit(P.b, sp.buf, Math.round(x - sp.ox), Math.round(y - sp.oy));
        if (i % 4 === 0) P.part(P.poly([x - 2, y - 9, x + 2, y - 9, x, y - 15]), [C.red, C.gold, C.green][i % 3], { b: 3, sh: 0 });
      }
    })
  });

  lay('garage', {
    bench: g => sprite(90, 40, P => {
      if (!(g && g.f.deathGot)) A.horse(P, 44, 38, 'death', 1.1);
      P.part(P.rect(66, 30, 18, 8), C.grey, { b: 2 });
      P.part(P.rect(8, 32, 16, 6), C.red, { b: 3 });
    }),
    projector: g => sprite(40, 70, P => {
      for (const sx of [-10, 0, 10]) P.line(20, 30, 20 + sx, 68, C.grey[2]);
      P.part(P.rect(8, 14, 26, 16), C.night, { b: 2 });
      P.part(P.ell(34, 22, 5, 6), C.grey, { b: 3 });
      P.part(P.ell(35, 22, 3, 4), g && Math.floor(g.time * 3) % 2 ? [C.neonB, C.neonB, C.neonB, C.neonB, C.neonB] : C.sky, { b: 3, sh: 0, hi: 0 });
      P.part(P.ell(14, 10, 5, 5), C.grey, { b: 2 });
      P.part(P.ell(28, 10, 5, 5), C.grey, { b: 2 });
    }),
    tires: () => sprite(40, 30, P => {
      for (let i = 0; i < 3; i++) { P.part(P.ell(20, 26 - i * 8, 18, 5), C.night, { b: 1 }); P.part(P.ell(20, 26 - i * 8, 8, 2), C.asphalt, { b: 0, sh: 0, hi: 0 }); }
    })
  });

  Object.assign(BG, { snowCap, garland, pavement, STREET_W });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
