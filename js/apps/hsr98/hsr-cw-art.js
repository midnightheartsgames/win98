(function (H) {
  'use strict';
  const G = H.Gfx, CW = H.CW;
  const cache = new Map();

  function sized(key, size, art) {
    const k = key + '|' + size;
    let out = cache.get(k);
    if (!out) { out = G.pixelArt('cw|' + k, size, size, (p0, g) => art(G.pen(g, size / 32, 0, 0))); cache.set(k, out); }
    return out;
  }
  function blit(ctx, c, x, y, s) {
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, Math.round(x), Math.round(y), s, s);
    ctx.imageSmoothingEnabled = was;
  }
  const line = (p, col, x0, y0, x1, y1, w) => {
    const len = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / len * w / 2, ny = (x1 - x0) / len * w / 2;
    p.poly(col, [x0 + nx, y0 + ny, x1 + nx, y1 + ny, x1 - nx, y1 - ny, x0 - nx, y0 - ny]);
  };
  const star = (p, col, cx, cy, r, ri) => { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? (ri || r * 0.45) : r; pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } p.poly(col, pts); };
  const ring = (p, col, cx, cy, r, w) => { for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, b = (i + 1) / 24 * Math.PI * 2; line(p, col, cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(b) * r, cy + Math.sin(b) * r, w); } };
  const gemShape = (p, c0, c1, c2, cx, cy, r) => {
    p.poly(c0, [cx - r, cy - r * 0.2, cx - r * 0.5, cy - r * 0.8, cx + r * 0.5, cy - r * 0.8, cx + r, cy - r * 0.2, cx, cy + r]);
    p.poly(c1, [cx - r, cy - r * 0.2, cx - r * 0.5, cy - r * 0.8, cx, cy - r * 0.2, cx, cy + r]);
    p.poly(c2, [cx - r * 0.5, cy - r * 0.8, cx + r * 0.5, cy - r * 0.8, cx + r * 0.25, cy - r * 0.2, cx - r * 0.25, cy - r * 0.2]);
  };

  const BASIC = {
    skates(p) { p.poly('#2a4a6a', [6, 6, 16, 6, 18, 16, 26, 18, 27, 23, 6, 23]); p.poly('#80e0ff', [7, 7, 15, 7, 17, 17, 25, 19, 26, 22, 7, 22]); p.rect('#ffffff', 8, 9, 6, 2); p.rect('#3a3a4a', 6, 24, 21, 2); for (const x of [9, 16, 23]) { p.ell('#141020', x, 28, 2.6, 2.6); p.ell('#ffd471', x, 28, 1.2, 1.2); } },
    knife(p) { p.poly('#5a2a1a', [4, 26, 12, 18, 15, 21, 7, 29]); p.poly('#ff9a6a', [5, 26, 12, 19, 14, 21, 7, 28]); p.poly('#c8ccd8', [12, 18, 26, 4, 28, 6, 15, 21]); p.poly('#ffffff', [14, 17, 26, 5, 27, 6, 15, 18]); p.ell('#ffd471', 9.5, 23.5, 1, 1); },
    pistol(p) { p.poly('#3a2a5a', [4, 9, 27, 9, 27, 15, 14, 15, 13, 26, 6, 26, 8, 15, 4, 15]); p.poly('#c8a8ff', [5, 10, 26, 10, 26, 14, 13, 14, 12, 25, 7, 25, 9, 14, 5, 14]); p.rect('#ffffff', 6, 11, 18, 1); p.ell('#ffd471', 20, 12, 1.4, 1.4); p.rect('#3a2a5a', 14, 15, 4, 4); },
    star(p) { star(p, '#8a6420', 16, 16, 14); star(p, '#ffd471', 16, 16, 12); star(p, '#fff4c0', 14, 13, 5); p.ell('#ffffff', 12, 10, 1.4, 1.4); },
    flower(p) { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.ell('#2a6a3a', 16 + Math.cos(a) * 7, 15 + Math.sin(a) * 7, 6, 4, a); p.ell('#86e39a', 16 + Math.cos(a) * 7, 15 + Math.sin(a) * 7, 5, 3, a); } p.ell('#ffd471', 16, 15, 4, 4); p.ell('#ffffff', 15, 14, 1.5, 1.5); p.rect('#2a6a3a', 15, 22, 2, 8); },
    armor(p) { p.poly('#3a3a50', [5, 6, 12, 4, 16, 7, 20, 4, 27, 6, 26, 18, 16, 28, 6, 18]); p.poly('#b4b4c8', [7, 7, 12, 6, 16, 9, 20, 6, 25, 7, 24, 17, 16, 26, 8, 17]); p.poly('#e8e8f4', [8, 8, 12, 7, 15, 10, 15, 24, 9, 16]); p.rect('#5a5a70', 15, 10, 2, 15); },
    drill(p) { p.poly('#5a5a70', [10, 4, 22, 4, 22, 10, 10, 10]); p.poly('#f4f4f8', [11, 5, 21, 5, 21, 9, 11, 9]); p.poly('#3a3a50', [11, 10, 21, 10, 16, 29]); p.poly('#c8ccdc', [12, 11, 20, 11, 16, 27]); for (let y = 13; y < 25; y += 4) line(p, '#5ad8ff', 13 + (y - 13) * 0.15, y, 19 - (y - 13) * 0.15, y + 2, 1.2); },
    cell(p) { p.rect('#1a3a5a', 9, 5, 14, 24); p.rect('#5ad8ff', 10, 7, 12, 21); p.rect('#1a3a5a', 13, 3, 6, 3); p.rect('#c8f4ff', 11, 8, 3, 18); line(p, '#ffffff', 18, 10, 14, 17, 2); line(p, '#ffffff', 14, 17, 19, 17, 2); line(p, '#ffffff', 19, 17, 15, 25, 2); }
  };

  const ADV_PIC = {
    agBoots(p) { BASIC.skates(p); line(p, '#ffffff', 4, 4, 9, 4, 1.5); line(p, '#ffffff', 2, 8, 7, 8, 1.5); },
    firestorm(p) { p.poly('#c83a1a', [16, 3, 25, 16, 22, 28, 10, 28, 7, 16]); p.poly('#ff9a3a', [16, 9, 21, 18, 19, 26, 13, 26, 11, 18]); p.poly('#fff0a0', [16, 15, 18, 21, 16, 25, 14, 21]); },
    catapult(p) { p.rect('#3a2a5a', 5, 12, 22, 8); p.rect('#c8a8ff', 6, 13, 20, 6); line(p, '#5ad8ff', 8, 10, 24, 10, 1.4); line(p, '#5ad8ff', 8, 22, 24, 22, 1.4); p.poly('#ffffff', [27, 16, 22, 13, 22, 19]); },
    starChase(p) { star(p, '#ffd471', 21, 11, 8); line(p, '#80e0ff', 4, 26, 15, 16, 2); line(p, '#80e0ff', 6, 29, 14, 21, 1.4); },
    bloomStep(p) { BASIC.flower(p); p.poly('#80e0ff', [4, 26, 12, 22, 12, 28]); },
    meteor(p) { p.poly('#5a5a70', [4, 18, 14, 8, 16, 18]); p.poly('#b4b4c8', [16, 18, 28, 6, 26, 20]); p.ell('#ff9a3a', 16, 20, 5, 5); p.ell('#fff0a0', 15, 19, 2, 2); },
    propeller(p) { p.ell('#3a3a50', 16, 16, 3, 3); p.poly('#f4f4f8', [16, 16, 13, 3, 19, 3]); p.poly('#c8ccdc', [16, 16, 29, 13, 29, 19]); p.poly('#f4f4f8', [16, 16, 19, 29, 13, 29]); p.poly('#c8ccdc', [16, 16, 3, 19, 3, 13]); p.ell('#5ad8ff', 16, 16, 1.6, 1.6); },
    lightBoots(p) { BASIC.skates(p); line(p, '#ffd471', 22, 2, 18, 8, 2); line(p, '#ffd471', 18, 8, 24, 8, 2); line(p, '#ffd471', 24, 8, 20, 14, 2); },
    starBlade(p) { p.poly('#e8ecf8', [16, 2, 19, 22, 16, 26, 13, 22]); p.poly('#ffffff', [16, 3, 17, 22, 16, 24]); p.rect('#ff9a6a', 9, 22, 14, 3); p.rect('#5a2a1a', 15, 25, 2, 5); star(p, '#ffd471', 16, 9, 4); },
    weaponMaster(p) { line(p, '#c8ccd8', 6, 26, 24, 6, 3); line(p, '#c8ccd8', 26, 26, 8, 6, 3); p.rect('#ff9a6a', 4, 24, 6, 4); p.rect('#c8a8ff', 22, 24, 6, 4); p.ell('#ffd471', 16, 16, 3, 3); },
    chainsaw(p) { p.rect('#3a3a50', 4, 12, 10, 10); p.rect('#ffd471', 5, 13, 8, 8); p.rect('#c8ccd8', 13, 13, 15, 6); for (let x = 14; x < 28; x += 3) p.poly('#ffffff', [x, 13, x + 1.5, 10.5, x + 3, 13]); },
    bloodlust(p) { p.poly('#5a0a14', [16, 4, 25, 18, 16, 28, 7, 18]); p.poly('#d83a4a', [16, 7, 22, 18, 16, 25, 10, 18]); p.ell('#ff9aa0', 14, 15, 2, 3); },
    injector(p) { line(p, '#c8ccd8', 6, 26, 22, 10, 6); line(p, '#9affb0', 8, 24, 20, 12, 3); line(p, '#ffffff', 22, 10, 28, 4, 1.4); p.rect('#3a3a50', 3, 25, 6, 3); },
    kinetic(p) { line(p, '#5ad8ff', 8, 24, 25, 7, 4); line(p, '#ffffff', 9, 23, 24, 8, 1.4); p.rect('#3a3a50', 4, 23, 7, 3); ring(p, '#ffd471', 22, 10, 6, 1); },
    codexEvo(p) { p.rect('#3a2a10', 6, 5, 20, 23); p.rect('#5ad8ff', 7, 6, 18, 21); p.rect('#1a3a5a', 9, 9, 14, 2); p.rect('#1a3a5a', 9, 13, 10, 2); line(p, '#ffffff', 10, 23, 16, 17, 2); line(p, '#ffffff', 16, 17, 22, 21, 2); },
    railgun(p) { p.rect('#3a2a5a', 3, 13, 26, 6); p.rect('#c8a8ff', 4, 14, 24, 4); p.rect('#5ad8ff', 6, 11, 18, 2); p.rect('#5ad8ff', 6, 19, 18, 2); p.ell('#ffffff', 28, 16, 2, 2); },
    antiSat(p) { line(p, '#3a2a5a', 3, 22, 27, 12, 4); line(p, '#c8a8ff', 4, 21, 26, 12, 2); p.rect('#3a2a5a', 8, 22, 3, 7); star(p, '#ffd471', 24, 7, 4); },
    bunker(p) { p.poly('#3a4a3a', [3, 26, 7, 12, 25, 12, 29, 26]); p.poly('#86e39a', [5, 25, 8, 14, 24, 14, 27, 25]); p.rect('#141a14', 11, 17, 10, 4); p.rect('#c8a8ff', 14, 6, 4, 7); },
    exo(p) { p.ell('#3a3a50', 16, 8, 4, 4); p.rect('#3a3a50', 12, 12, 8, 10); line(p, '#c8a8ff', 12, 13, 5, 22, 3); line(p, '#c8a8ff', 20, 13, 27, 22, 3); line(p, '#b4b4c8', 13, 22, 10, 30, 3); line(p, '#b4b4c8', 19, 22, 22, 30, 3); p.rect('#5ad8ff', 14, 14, 4, 3); },
    disarm(p) { line(p, '#c8ccd8', 6, 6, 26, 26, 3); line(p, '#c8ccd8', 26, 6, 6, 26, 3); p.ell('#f4f4f8', 16, 16, 4, 4); p.ell('#c8a8ff', 16, 16, 2, 2); },
    sail(p) { p.rect('#3a3a50', 15, 4, 2, 24); p.poly('#5ad8ff', [17, 5, 28, 20, 17, 20]); p.poly('#c8a8ff', [15, 7, 5, 20, 15, 20]); p.rect('#5a3a1a', 6, 23, 20, 4); },
    anyDie(p) { p.poly('#8a6420', [16, 3, 28, 10, 28, 23, 16, 30, 4, 23, 4, 10]); p.poly('#ffd471', [16, 4, 27, 10.5, 16, 17, 5, 10.5]); p.poly('#e8b840', [5, 11, 16, 17, 16, 29, 5, 22.5]); p.poly('#c8962c', [27, 11, 16, 17, 16, 29, 27, 22.5]); p.ell('#ffffff', 16, 10, 1.6, 1.2); p.ell('#5a3a10', 10, 18, 1.4, 1.4); p.ell('#5a3a10', 22, 18, 1.4, 1.4); },
    furyFist(p) { p.rect('#5a1a10', 8, 9, 16, 14); p.rect('#ff7a5a', 9, 10, 14, 12); for (let x = 10; x < 23; x += 4) p.rect('#5a1a10', x, 10, 1, 6); p.rect('#ffd471', 8, 23, 16, 3); star(p, '#ffd471', 25, 7, 4); },
    tooth(p) { p.poly('#e8e8f4', [8, 6, 24, 6, 22, 18, 19, 28, 16, 20, 13, 28, 10, 18]); p.poly('#ffffff', [10, 7, 15, 7, 13, 17]); },
    banner(p) { p.rect('#5a3a1a', 7, 4, 2, 26); p.poly('#ffd471', [9, 5, 27, 8, 22, 13, 27, 18, 9, 18]); star(p, '#c83a1a', 15, 11, 3); },
    jokeEngine(p) { p.ell('#3a3a50', 16, 17, 11, 11); p.ell('#ffd471', 16, 17, 9, 9); p.ell('#141018', 12, 14, 1.6, 1.6); p.ell('#141018', 20, 14, 1.6, 1.6); line(p, '#141018', 11, 20, 16, 23, 1.6); line(p, '#141018', 16, 23, 21, 20, 1.6); p.rect('#5ad8ff', 14, 3, 4, 4); },
    lifeRing(p) { ring(p, '#86e39a', 16, 16, 10, 4); ring(p, '#ffffff', 16, 16, 10, 1); p.ell('#ffd471', 16, 6, 2.5, 2.5); },
    painChip(p) { p.rect('#2a3a2a', 7, 7, 18, 18); p.rect('#86e39a', 9, 9, 14, 14); for (let i = 0; i < 4; i++) { p.rect('#c8ccd8', 4, 9 + i * 4, 3, 1.6); p.rect('#c8ccd8', 25, 9 + i * 4, 3, 1.6); } p.rect('#ffffff', 15, 11, 2, 10); p.rect('#ffffff', 11, 15, 10, 2); },
    matter(p) { p.ell('#86e39a', 10, 11, 5, 5); p.ell('#f4f4f8', 22, 11, 5, 5); p.ell('#c8a8ff', 16, 22, 5, 5); line(p, '#ffffff', 10, 11, 22, 11, 1); line(p, '#ffffff', 22, 11, 16, 22, 1); line(p, '#ffffff', 16, 22, 10, 11, 1); },
    pureCal(p) { p.ell('#5a3a1a', 16, 18, 11, 9); p.ell('#ffb070', 16, 17, 10, 8); p.ell('#86e39a', 13, 13, 4, 2.6, -0.5); p.ell('#ffffff', 19, 15, 2, 1.4); },
    sturdy(p) { BASIC.armor(p); p.rect('#ffd471', 8, 16, 16, 2); },
    grenade(p) { p.ell('#3a4a2a', 16, 19, 9, 10); p.ell('#7a8a5a', 15, 18, 7, 8); p.rect('#3a3a50', 13, 6, 6, 4); ring(p, '#c8ccd8', 22, 7, 3, 1.2); for (let y = 13; y < 26; y += 4) p.rect('#3a4a2a', 9, y, 13, 1); },
    photon(p) { p.poly('#1a3a5a', [16, 3, 27, 8, 25, 22, 16, 29, 7, 22, 5, 8]); p.poly('#5ad8ff', [16, 5, 25, 9, 23.5, 21, 16, 27, 8.5, 21, 7, 9]); p.poly('#c8f4ff', [16, 5, 16, 27, 8.5, 21, 7, 9]); star(p, '#ffffff', 16, 15, 4); },
    wormhole(p) { ring(p, '#c8a8ff', 16, 16, 12, 2); ring(p, '#9a7ae8', 16, 16, 8, 2); ring(p, '#6a4ab8', 16, 16, 4, 2); p.ell('#141020', 16, 16, 2, 2); },
    warhead(p) { p.poly('#3a3a50', [16, 3, 22, 10, 22, 24, 10, 24, 10, 10]); p.poly('#c8ccd8', [16, 5, 20, 11, 20, 22, 12, 22, 12, 11]); p.rect('#c83a1a', 12, 15, 8, 3); p.poly('#ff9a3a', [10, 24, 22, 24, 19, 30, 13, 30]); },
    perpetual(p) { ring(p, '#5ad8ff', 11, 16, 6, 2); ring(p, '#5ad8ff', 21, 16, 6, 2); p.ell('#ffffff', 16, 16, 2, 2); p.poly('#ffd471', [26, 11, 29, 14, 25, 15]); }
  };

  const USE = {
    key(p, gold) { const a = gold ? '#ffd471' : '#c8c8d8', b = gold ? '#8a6420' : '#5a5a70'; ring(p, b, 10, 10, 6, 4); ring(p, a, 10, 10, 6, 2); line(p, b, 14, 14, 27, 27, 4); line(p, a, 14, 14, 26, 26, 2); p.rect(b, 20, 22, 4, 3); p.rect(b, 24, 18, 3, 4); },
    keyP(p) { USE.key(p, true); star(p, '#ffffff', 25, 7, 3); },
    furnace(p) { p.rect('#3a1a10', 6, 8, 20, 20); p.rect('#8a4a2a', 7, 9, 18, 18); p.rect('#141010', 10, 15, 12, 9); p.poly('#ff7a3a', [11, 24, 13, 17, 16, 21, 19, 16, 21, 24]); p.poly('#ffd471', [14, 24, 16, 20, 18, 24]); p.rect('#5a5a70', 11, 3, 4, 6); },
    privCard(p) { p.rect('#5a2a4a', 6, 4, 20, 25); p.rect('#ffb0e0', 7, 5, 18, 23); p.rect('#ffffff', 9, 8, 14, 5); star(p, '#ffd471', 16, 20, 5); },
    projector(p, gold) { p.rect('#2a3a5a', 4, 12, 15, 12); p.rect(gold ? '#ffd471' : '#9ad8ff', 5, 13, 13, 10); p.ell('#141a3a', 11, 18, 3.5, 3.5); p.ell('#ffffff', 11, 18, 1.5, 1.5); p.poly(gold ? 'rgba(255,212,113,0.7)' : 'rgba(154,216,255,0.7)', [19, 15, 29, 9, 29, 27, 19, 21]); },
    pprojector(p) { USE.projector(p, true); },
    charm(p) { line(p, '#c83a1a', 16, 3, 16, 9, 1.6); p.poly('#2a6a3a', [10, 9, 22, 9, 24, 27, 8, 27]); p.poly('#9affb0', [11, 10, 21, 10, 22.5, 26, 9.5, 26]); p.rect('#ffd471', 12, 15, 8, 1.6); p.rect('#ffd471', 12, 19, 8, 1.6); },
    box(p, col) { p.poly('#2a2a3a', [4, 12, 16, 7, 28, 12, 28, 26, 16, 30, 4, 26]); p.poly(col, [5, 12.5, 16, 8, 27, 12.5, 16, 17]); p.poly(G.dark ? G.dark(col, 0.2) : col, [5, 13, 16, 17.5, 16, 29, 5, 25]); p.poly(G.dark ? G.dark(col, 0.4) : col, [27, 13, 16, 17.5, 16, 29, 27, 25]); p.rect('#ffffff', 15, 17, 2, 12); },
    boxBasic(p) { USE.box(p, '#b4b4b4'); },
    boxAdv(p) { USE.box(p, '#7196ff'); },
    boxSpecial(p) { USE.box(p, '#ffd471'); star(p, '#ffffff', 16, 12, 3); },
    codex(p) { p.rect('#3a1a10', 6, 4, 21, 25); p.rect('#ff9a6a', 7, 5, 19, 23); p.rect('#5a2a1a', 7, 5, 3, 23); p.poly('#ffffff', [18, 10, 23, 16, 18, 22, 13, 16]); },
    contract(p, n, col) { p.rect('#5a4a2a', 7, 4, 18, 25); p.rect('#f4ecd8', 8, 5, 16, 23); p.rect('#c8b890', 10, 9, 12, 1.4); p.rect('#c8b890', 10, 12, 9, 1.4); p.ell(col, 20, 23, 4, 4); for (let i = 0; i < n; i++) p.rect('#141018', 17.6 + (i % 3) * 1.8 - (n > 3 ? 1 : 0), 21 + Math.floor(i / 3) * 2.2, 1.2, 1.2); },
    contract3(p) { USE.contract(p, 3, '#7196ff'); },
    contract4(p) { USE.contract(p, 4, '#927fe7'); },
    contract5(p) { USE.contract(p, 5, '#ffd471'); }
  };

  const OTHER = {
    red(p) { gemShape(p, '#a82a2a', '#ff5a5a', '#ffb0b0', 16, 16, 12); p.ell('#ffffff', 12, 11, 1.4, 1); },
    blue(p) { gemShape(p, '#2a3a9a', '#5a8aff', '#b0c8ff', 16, 16, 12); p.ell('#ffffff', 12, 11, 1.4, 1); },
    gem(p) { gemShape(p, '#8a6420', '#ffd471', '#fff4c0', 16, 15, 12); star(p, '#ffffff', 25, 6, 3); },
    trash(p, gold) { const a = gold ? '#ffd471' : '#7a8a6a', b = gold ? '#8a6420' : '#3a4a2a'; p.poly(b, [8, 10, 24, 10, 27, 26, 16, 30, 5, 26]); p.poly(a, [9, 11, 23, 11, 25.5, 25, 16, 28.5, 6.5, 25]); p.poly(b, [12, 4, 20, 4, 18, 11, 14, 11]); line(p, gold ? '#ffffff' : '#5a6a4a', 11, 16, 13, 24, 1.2); },
    goldTrash(p) { OTHER.trash(p, true); star(p, '#ffffff', 23, 8, 3); },
    ore1(p) { gemShape(p, '#2a5a8a', '#8ad0ff', '#d0f0ff', 16, 17, 11); p.poly('#5a5a70', [4, 26, 10, 20, 14, 28]); },
    ore2(p) { gemShape(p, '#8a6420', '#ffd471', '#fff4c0', 16, 17, 11); p.poly('#5a5a70', [4, 26, 10, 20, 14, 28]); },
    ore3(p) { gemShape(p, '#8a2a7a', '#ff9ae0', '#fff0fa', 16, 17, 11); p.poly('#5ad8ff', [16, 6, 19, 17, 16, 28]); p.poly('#5a5a70', [4, 26, 10, 20, 14, 28]); }
  };

  const BOND = {
    express(p, c) { p.rect(c, 5, 13, 22, 9); p.rect(c, 19, 9, 6, 4); p.rect('#141018', 7, 15, 4, 3); p.rect('#141018', 13, 15, 4, 3); for (const x of [8, 15, 22]) p.ell('#141018', x, 24, 2.4, 2.4); p.rect(c, 3, 26, 26, 1.4); },
    scholars(p, c) { ring(p, c, 16, 16, 11, 1.6); p.ell(c, 16, 16, 3, 3); for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; p.ell(c, 16 + Math.cos(a) * 11, 16 + Math.sin(a) * 11, 2, 2); } },
    belobog(p, c) { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; line(p, c, 16, 16, 16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, 2.4); line(p, c, 16 + Math.cos(a) * 8, 16 + Math.sin(a) * 8, 16 + Math.cos(a + 0.5) * 11, 16 + Math.sin(a + 0.5) * 11, 1.4); } },
    underworld(p, c) { line(p, c, 8, 26, 22, 8, 3); p.poly(c, [14, 6, 28, 12, 24, 14, 13, 9]); p.poly(c, [4, 14, 10, 4, 12, 7, 7, 15]); },
    xianzhou(p, c) { p.ell(c, 12, 20, 7, 4); p.ell(c, 20, 18, 8, 5); p.ell(c, 16, 15, 5, 4); line(p, c, 6, 8, 26, 8, 2); p.poly(c, [26, 5, 30, 8, 26, 11]); },
    hunters(p, c) { star(p, c, 16, 16, 13, 4); p.ell('#141018', 16, 16, 3, 3); },
    travelers(p, c) { ring(p, c, 16, 16, 11, 2); p.poly(c, [16, 5, 19, 16, 16, 27, 13, 16]); p.poly('#141018', [16, 16, 19, 16, 16, 27]); },
    kazuma(p, c) { p.poly(c, [8, 6, 24, 6, 27, 27, 5, 27]); p.poly('#141018', [12, 9, 20, 9, 16, 15]); ring(p, '#ffd471', 16, 21, 3.5, 1.4); },
    inaba(p, c) { p.rect(c, 4, 12, 24, 6); ring(p, c, 10, 15, 4, 2); ring(p, c, 22, 15, 4, 2); p.rect('#141018', 13, 14, 6, 2); },
    section6(p, c) { line(p, c, 6, 26, 25, 7, 2.6); p.rect(c, 4, 24, 6, 3); line(p, '#ffffff', 10, 22, 22, 10, 0.8); },
    hares(p, c) { p.ell(c, 11, 10, 3, 8, -0.2); p.ell(c, 21, 10, 3, 8, 0.2); p.ell(c, 16, 22, 8, 7); p.ell('#141018', 13, 21, 1.2, 1.2); p.ell('#141018', 19, 21, 1.2, 1.2); },
    fractsidus(p, c) { star(p, c, 16, 16, 13); line(p, '#141018', 10, 7, 18, 16, 1.6); line(p, '#141018', 18, 16, 14, 26, 1.6); },
    conton(p, c) { p.ell(c, 16, 10, 6, 7); p.rect(c, 15, 16, 2, 10); p.rect(c, 10, 26, 12, 2); for (let i = 0; i < 3; i++) p.rect('#141018', 12, 8 + i * 3, 8, 1); },
    break(p, c) { p.poly(c, [16, 3, 19, 12, 28, 10, 21, 17, 26, 28, 16, 21, 6, 28, 11, 17, 4, 10, 13, 12]); },
    follow(p, c) { p.poly(c, [4, 9, 14, 16, 4, 23]); p.poly(c, [13, 9, 23, 16, 13, 23]); p.rect(c, 24, 9, 4, 14); },
    energy(p, c) { p.poly(c, [19, 3, 8, 18, 15, 18, 12, 29, 24, 13, 17, 13]); },
    aoe(p, c) { ring(p, c, 16, 16, 12, 2); ring(p, c, 16, 16, 7, 2); p.ell(c, 16, 16, 2.4, 2.4); },
    hpburn(p, c) { p.poly(c, [16, 3, 25, 17, 22, 27, 10, 27, 7, 17]); p.poly('#141018', [16, 14, 20, 21, 16, 25, 12, 21]); },
    elation(p, c) { p.ell(c, 16, 16, 12, 12); p.ell('#141018', 12, 13, 1.8, 2.6); p.ell('#141018', 20, 13, 1.8, 2.6); p.poly('#141018', [9, 18, 23, 18, 16, 25]); },
    debuff(p, c) { p.poly(c, [16, 28, 5, 15, 11, 15, 11, 4, 21, 4, 21, 15, 27, 15]); },
    sp(p, c) { for (let i = 0; i < 3; i++) p.poly(c, [6 + i * 9, 16, 10 + i * 9, 10, 14 + i * 9, 16, 10 + i * 9, 22]); },
    dot(p, c) { for (const [x, y, s] of [[10, 10, 1], [21, 9, 0.8], [16, 21, 1.2]]) { p.poly(c, [x, y - 6 * s, x + 4 * s, y + 1 * s, x, y + 4 * s, x - 4 * s, y + 1 * s]); } },
    quantum(p, c) { p.ell(c, 16, 16, 12, 5, 0.6); p.ell('#141018', 16, 16, 10, 3.4, 0.6); p.ell(c, 16, 16, 12, 5, -0.6); p.ell('#141018', 16, 16, 10, 3.4, -0.6); p.ell(c, 16, 16, 3, 3); },
    heal(p, c) { p.rect(c, 12, 4, 8, 24); p.rect(c, 4, 12, 24, 8); },
    shield(p, c) { p.poly(c, [16, 3, 27, 8, 25, 21, 16, 29, 7, 21, 5, 8]); p.poly('#141018', [16, 8, 22, 11, 21, 20, 16, 24]); },
    keeper(p, c) { p.poly(c, [4, 24, 6, 8, 11, 15, 16, 5, 21, 15, 26, 8, 28, 24]); p.rect(c, 4, 25, 24, 3); },
    player1(p, c) { p.poly(c, [4, 12, 28, 12, 26, 24, 20, 22, 12, 22, 6, 24]); p.rect('#141018', 8, 16, 6, 2); p.rect('#141018', 10, 14, 2, 6); p.ell('#141018', 21, 16, 1.6, 1.6); p.ell('#141018', 24, 18, 1.6, 1.6); },
    mentor(p, c) { line(p, c, 6, 26, 22, 6, 2.4); line(p, c, 26, 26, 10, 6, 2.4); p.rect(c, 3, 24, 7, 3); p.rect(c, 22, 24, 7, 3); },
    numby(p, c) { p.ell(c, 16, 17, 11, 11); p.ell('#141018', 12, 15, 1.6, 1.6); p.ell('#141018', 20, 15, 1.6, 1.6); p.ell('#141018', 16, 21, 2.6, 1.6); p.poly(c, [7, 9, 10, 3, 13, 8]); p.poly(c, [25, 9, 22, 3, 19, 8]); },
    wildcard(p, c) { p.rect(c, 7, 3, 18, 26); p.rect('#141018', 9, 5, 14, 22); star(p, c, 16, 16, 7); },
    peppy(p, c) { p.ell(c, 16, 21, 6, 5); for (const [x, y] of [[8, 13], [13, 9], [19, 9], [24, 13]]) p.ell(c, x, y, 2.6, 3.2); }
  };

  const NODE = {
    reward(p, c) { USE.box(p, c); },
    fight(p, c) { line(p, c, 6, 26, 24, 6, 3); line(p, c, 26, 26, 8, 6, 3); },
    enc(p, c) { p.poly(c, [16, 4, 28, 16, 16, 28, 4, 16]); p.poly('#141018', [16, 9, 23, 16, 16, 23, 9, 16]); p.rect(c, 15, 12, 2, 6); p.rect(c, 15, 20, 2, 2); },
    supply(p, c) { p.rect(c, 6, 10, 20, 16); p.rect('#141018', 8, 12, 16, 3); p.rect(c, 13, 5, 6, 5); },
    boss(p, c) { p.ell(c, 16, 14, 10, 10); p.rect(c, 10, 20, 12, 7); p.ell('#141018', 12, 14, 2.4, 3); p.ell('#141018', 20, 14, 2.4, 3); for (let x = 12; x < 21; x += 3) p.rect('#141018', x, 23, 1.4, 4); }
  };

  const RANK_COL = [['#2a2a30', '#5a5a64', '#8a8a96'], ['#1a3a24', '#3a7a4a', '#8ac89a'], ['#1a4a3a', '#3aa080', '#9ae8c8'], ['#1a2a5a', '#4a6ac8', '#b0c8ff'], ['#2a4a5a', '#6ab8d8', '#e0f8ff'], ['#3a1a5a', '#9a5ad8', '#ffd471'], ['#4a2a10', '#c8822c', '#ffe0a0'], ['#5a0a1a', '#d83a4a', '#ffd471'], ['#3a2a08', '#ffd471', '#ffffff']];
  function rankArt(t) {
    const [d, m, l] = RANK_COL[t] || RANK_COL[0];
    return p => {
      const hex = (r, col) => { const pts = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push(16 + Math.cos(a) * r, 16 + Math.sin(a) * r); } p.poly(col, pts); };
      hex(15, d); hex(13, m); hex(9, d);
      p.poly(l, [16, 8, 23, 16, 16, 24, 9, 16]);
      p.poly(m, [16, 11, 20, 16, 16, 21, 12, 16]);
      for (let i = 0; i < Math.min(5, t); i++) { const a = -Math.PI / 2 + (i - (Math.min(5, t) - 1) / 2) * 0.42; p.ell(l, 16 + Math.cos(a) * 13, 16 + Math.sin(a) * 13, 1.4, 1.4); }
      if (t >= 6) p.poly(l, [10, 3, 12, 0.5, 14, 2.5, 16, 0, 18, 2.5, 20, 0.5, 22, 3]);
    };
  }

  function itemArt(id) {
    const D = CW.ITEMS[id];
    if (!D) return null;
    if (BASIC[id]) return BASIC[id];
    if (ADV_PIC[id]) return ADV_PIC[id];
    if (USE[id]) return USE[id];
    if (OTHER[id]) return OTHER[id];
    if (D.kind === 'emblem') {
      const col = (CW.BONDS[D.bond] || {}).col || '#ffffff', B = BOND[D.bond];
      return p => { const pts = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; pts.push(16 + Math.cos(a) * 15, 16 + Math.sin(a) * 15); } p.poly('#141018', pts); const in2 = pts.map((v, i) => (v - 16) * 0.86 + 16); p.poly(G.dark ? G.dark(col, 0.45) : col, in2); if (B) { p.g.save(); p.g.translate(p.X(16) * 4, p.Y(16) * 4); p.g.scale(0.62, 0.62); p.g.translate(-p.X(16) * 4, -p.Y(16) * 4); B(p, col); p.g.restore(); } };
    }
    return null;
  }

  Object.assign(G, {
    cwItemArt: itemArt,
    cwItemCanvas(id, size) { const a = itemArt(id); return a ? sized('it|' + id, size, a) : null; },
    cwBondIcon(ctx, k, x, y, size, col) {
      const B = BOND[k];
      if (!B) return false;
      const c = col || (CW.BONDS[k] || {}).col || '#ffffff';
      blit(ctx, sized('bond|' + k + '|' + c, size, p => B(p, c)), x, y, size);
      return true;
    },
    cwNodeIcon(ctx, k, x, y, size, col) { const N = NODE[k]; if (!N) return false; blit(ctx, sized('node|' + k + '|' + col, size, p => N(p, col)), x, y, size); return true; },
    cwOreIcon(ctx, k, x, y, size) { const O = OTHER[k]; if (O) blit(ctx, sized('ore|' + k, size, O), x, y, size); },
    cwRankIcon(ctx, t, x, y, size) { blit(ctx, sized('rank|' + t, size, rankArt(t)), x, y, size); },
    CW_ART: { BASIC, ADV_PIC, USE, OTHER, BOND, NODE }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
