(function (S) {
  'use strict';
  const { C, Buf, Pen, part, shade, grad, hash, line } = S;
  const BG = S.BG;
  const A = S.art202;
  const { vgrad, pool, textOn, vignette } = BG;
  const BEACH_W = 640;
  const VOLCANO_W = 520;

  BG.beach22 = function (buf) {
    const P = new Pen(buf);
    vgrad(buf, P.rect(0, 0, BEACH_W, 90), C.sky, 0, 90, 0.9, 0.35);
    part(buf, P.ell(120, 40, 16, 16), C.yellow, { b: 4, sh: 0, hi: 0 });
    part(buf, P.poly([440, 90, 500, 30, 560, 90]), C.stone, { b: 2 });
    for (let i = 0; i < 4; i++) buf.set(496 + i * 2, 28 - i * 3, C.grey[4]);
    part(buf, P.rect(0, 85, BEACH_W, 35), C.teal, { b: 2 });
    for (let x = 0; x < BEACH_W; x += 24) {
      P.curve(`M ${x} 118 Q ${x + 12} 114 ${x + 24} 118`, C.sky[4]);
      P.curve(`M ${x + 6} 121 Q ${x + 18} 117 ${x + 30} 121`, C.grey[5]);
    }
    const sand = P.poly([0, 120, BEACH_W, 120, BEACH_W, 200, 0, 200]);
    grad(buf, sand, C.sand, (x, y) => 0.45 + (y - 120) / 100 + (hash(x >> 1, y >> 1, 9) - 0.5) * 0.08);
    for (let x = 0; x < BEACH_W; x += 18) {
      buf.set(x, 122 + Math.floor(hash(x, 3, 2) * 4), C.grey[5]);
    }
    A.palmTree(P, 50, 150);
    A.palmTree(P, 590, 152);
    A.tikiTorch(P, 180, 156);
    A.tikiTorch(P, 460, 156);
    A.surfboard(P, 110, 164);
  };

  BG.fountain22 = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 130);
    grad(buf, wall, C.stone, (x, y) => 0.35 + y / 160 + (hash(x >> 2, y >> 2, 7) - 0.5) * 0.15);
    for (let x = 20; x < 300; x += 40) {
      part(buf, P.poly([x - 8, 0, x + 8, 0, x, 30 + (x % 20)]), C.stone, { b: 3 });
    }
    const floor = P.poly([0, 130, 320, 130, 320, 200, 0, 200]);
    grad(buf, floor, C.stone, (x, y) => 0.5 + (y - 130) / 120);
    A.fountainGrotto(P, 160, 140);
    part(buf, P.rect(230, 140, 50, 30), C.wood, { b: 2 });
    for (let x = 236; x < 280; x += 10) line(buf, x, 140, x, 170, C.wood[1]);
    vignette(buf, 0.9);
  };

  BG.cavern22 = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 140);
    grad(buf, wall, C.stone, (x, y) => 0.25 + y / 170 + (hash(x >> 2, y >> 2, 3) - 0.5) * 0.12);
    part(buf, P.rect(130, 40, 60, 60), C.night, { b: 1 });
    textOn(buf, 'ТУННЕЛЬ К ЖЕРЛУ', 134, 48, C.neonA, 0);
    const ledge = P.poly([0, 140, 320, 140, 320, 200, 0, 200]);
    grad(buf, ledge, C.stone, (x, y) => 0.4 + (y - 140) / 100);
    line(buf, 0, 140, 320, 140, C.stone[3]);
    vignette(buf, 0.9);
  };

  BG.volcano22 = function (buf) {
    const P = new Pen(buf);
    vgrad(buf, P.rect(0, 0, VOLCANO_W, 90), C.orange, 0, 90, 0.3, 0.85);
    for (let x = 0; x < VOLCANO_W; x += 30) {
      P.part(P.ell(x + 10, 30, 18, 12), C.night, { b: 1, sh: 0, hi: 0 });
    }
    const rocks = P.poly([0, 90, VOLCANO_W, 90, VOLCANO_W, 200, 0, 200]);
    grad(buf, rocks, C.stone, (x, y) => 0.2 + (y - 90) / 120 + (hash(x >> 2, y >> 2, 5) - 0.5) * 0.15);
    part(buf, P.poly([160, 130, 360, 130, 400, 175, 120, 175]), C.red, { b: 3 });
    part(buf, P.poly([180, 135, 340, 135, 370, 170, 150, 170]), C.yellow, { b: 4, sh: 0, hi: 0 });
    for (let x = 190; x < 330; x += 20) {
      buf.set(x, 145 + Math.floor(hash(x, 2, 4) * 15), C.grey[5]);
    }
    A.volcanoAltar(P, 260, 120);
    vignette(buf, 0.85);
  };

  BG.triangle22 = function (buf) {
    const P = new Pen(buf);
    vgrad(buf, P.rect(0, 0, 320, 200), C.night, 0, 200, 0.1, 0.7);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(hash(i, 5, 1) * 320);
      const y = Math.floor(hash(i, 5, 2) * 200);
      buf.set(x, y, C.neonB);
    }
    part(buf, P.poly([40, 60, 90, 45, 110, 70, 60, 85]), C.grey, { b: 2 });
    line(buf, 40, 60, 110, 70, C.grey[4]);
    part(buf, P.poly([220, 80, 270, 65, 290, 90, 240, 105]), C.wood, { b: 2 });
    const stage = P.ell(160, 160, 70, 26);
    part(buf, stage, C.sand, { b: 3 });
    part(buf, P.ell(160, 158, 62, 22), C.red, { b: 2, sh: 0 });
    vignette(buf, 0.8);
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
