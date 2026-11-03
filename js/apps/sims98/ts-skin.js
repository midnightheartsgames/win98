(function (S) {
  'use strict';
  const R = S.Body.RECTS;

  const parse = text => [parseInt(text.slice(1, 3), 16), parseInt(text.slice(3, 5), 16), parseInt(text.slice(5, 7), 16)];
  const shade = (text, k) => {
    const [r, g, b] = parse(text);
    return 'rgb(' + Math.min(255, Math.round(r * k)) + ',' + Math.min(255, Math.round(g * k)) + ',' + Math.min(255, Math.round(b * k)) + ')';
  };

  const paintHead = (g, look, face) => {
    const [x0, y0, w, h] = R.head, cx = x0 + w / 2, skin = look.skin;
    g.fillStyle = skin;
    g.fillRect(x0, y0, w, h);
    g.fillStyle = shade(skin, 0.88);
    g.fillRect(x0, y0 + 44, w, 20);
    g.fillStyle = shade(skin, 0.92);
    g.fillRect(x0, y0, w, 7);
    g.fillRect(cx - 30, y0 + 40, 60, 3);
    g.fillStyle = shade(skin, 1.06);
    g.fillRect(cx - 14, y0 + 12, 28, 5);
    g.fillRect(cx - 18, y0 + 28, 8, 5);
    g.fillRect(cx + 10, y0 + 28, 8, 5);
    g.fillStyle = shade(skin, 0.78);
    g.fillRect(x0 + w * 0.25 - 2, y0 + 20, 4, 10);
    g.fillRect(x0 + w * 0.75 - 2, y0 + 20, 4, 10);
    for (const side of [-1, 1]) {
      const ex = cx + side * 9;
      g.fillStyle = shade(look.hair, 0.7);
      g.fillRect(ex - 5, y0 + 15, 10, 3);
      g.fillStyle = '#f6f3ea';
      g.fillRect(ex - 4, y0 + 19, 8, 4);
      g.fillStyle = look.eyes;
      g.fillRect(ex - 2, y0 + 19, 4, 4);
      g.fillStyle = '#14100c';
      g.fillRect(ex - 1, y0 + 20, 2, 3);
      g.fillStyle = shade(skin, 0.6);
      g.fillRect(ex - 5, y0 + 18, 10, 1);
    }
    g.fillStyle = shade(skin, 0.78);
    g.fillRect(cx - 1, y0 + 22, 2, 7);
    g.fillRect(cx - 3, y0 + 29, 6, 1);
    g.fillStyle = shade(skin, 1.08);
    g.fillRect(cx - 2, y0 + 22, 1, 6);
    g.fillStyle = look.sex === 'f' ? '#a23e3e' : shade(skin, 0.55);
    if (face > 0) {
      g.fillRect(cx - 5, y0 + 35, 10, 2);
      g.fillRect(cx - 7, y0 + 33, 2, 2);
      g.fillRect(cx + 5, y0 + 33, 2, 2);
    } else if (face < 0) {
      g.fillRect(cx - 5, y0 + 34, 10, 2);
      g.fillRect(cx - 7, y0 + 36, 2, 2);
      g.fillRect(cx + 5, y0 + 36, 2, 2);
    } else {
      g.fillRect(cx - 6, y0 + 34, 12, 3);
    }
    g.fillStyle = shade(skin, 0.8);
    g.fillRect(cx - 3, y0 + 38, 6, 1);
  };

  const paintHair = (g, look) => {
    const [x0, y0, w, h] = R.hair;
    g.fillStyle = look.hair;
    g.fillRect(x0, y0, w + 8, h + 8);
    for (let i = 0; i < w; i += 3) {
      g.fillStyle = shade(look.hair, i % 2 ? 0.82 : 1.16);
      g.fillRect(x0 + i, y0 + (i * 7) % 6, 1, h);
    }
    g.fillStyle = shade(look.hair, 0.72);
    g.fillRect(x0, y0 + h - 3, w, 3);
  };

  const paintTorso = (g, look) => {
    const [x0, y0, w, h] = R.torso, cx = x0 + w / 2, waist = y0 + 50;
    g.fillStyle = look.shirt;
    g.fillRect(x0, y0, w, waist - y0);
    g.fillStyle = shade(look.shirt, 0.86);
    g.fillRect(cx - 1, y0 + 4, 2, waist - y0 - 4);
    for (const [fx, fy, fw] of [[-22, 26, 14], [8, 32, 16], [-12, 40, 18], [18, 20, 8], [-34, 34, 10]]) g.fillRect(cx + fx, y0 + fy, fw, 1);
    g.fillStyle = shade(look.shirt, 1.12);
    g.fillRect(cx - 28, y0 + 14, 10, 1);
    g.fillRect(cx + 18, y0 + 14, 10, 1);
    g.fillStyle = look.skin;
    g.fillRect(cx - 5, y0, 10, 4);
    g.fillRect(cx - 3, y0 + 4, 6, 3);
    g.fillStyle = shade(look.shirt, 1.2);
    g.fillRect(cx - 8, y0 + 3, 4, 3);
    g.fillRect(cx + 4, y0 + 3, 4, 3);
    g.fillStyle = look.trousers;
    g.fillRect(x0, waist, w, h - (waist - y0));
    g.fillStyle = shade(look.trousers, 0.6);
    g.fillRect(x0, waist, w, 3);
    g.fillStyle = '#b89a50';
    g.fillRect(cx - 2, waist, 4, 3);
    g.fillStyle = shade(look.trousers, 0.8);
    g.fillRect(cx - 1, waist + 3, 1, h - (waist - y0) - 3);
  };

  const paintArm = (g, look) => {
    const [x0, y0, w, h] = R.arm, sleeve = look.sleeve === 'short' ? 0.36 : 0.96;
    g.fillStyle = look.skin;
    g.fillRect(x0, y0, w, h);
    g.fillStyle = look.shirt;
    g.fillRect(x0, y0, w, Math.round(h * sleeve));
    g.fillStyle = shade(look.shirt, 0.82);
    g.fillRect(x0, y0 + Math.round(h * sleeve) - 2, w, 2);
    if (sleeve > 0.5) {
      g.fillRect(x0 + 4, y0 + 30, w - 8, 1);
      g.fillRect(x0 + 8, y0 + 34, w - 14, 1);
    }
  };

  const paintHand = (g, look) => {
    const [x0, y0, w, h] = R.hand;
    g.fillStyle = look.skin;
    g.fillRect(x0, y0, w, h + 8);
    g.fillStyle = shade(look.skin, 0.82);
    for (let i = 3; i < w; i += 3) g.fillRect(x0 + i, y0 + h / 2, 1, h / 2);
  };

  const paintLeg = (g, look) => {
    const [x0, y0, w, h] = R.leg, cx = x0 + w / 2, cuff = look.legs === 'short' ? 0.42 : 1;
    g.fillStyle = look.skin;
    g.fillRect(x0, y0, w, h);
    g.fillStyle = look.trousers;
    g.fillRect(x0, y0, w, Math.round(h * cuff));
    g.fillStyle = shade(look.trousers, 0.84);
    g.fillRect(cx - 1, y0, 1, Math.round(h * cuff));
    g.fillRect(x0, y0 + Math.round(h * cuff) - 2, w, 2);
    if (cuff > 0.5) {
      g.fillRect(x0 + 10, y0 + 50, w - 22, 1);
      g.fillRect(x0 + 18, y0 + 53, w - 34, 1);
    }
    g.fillStyle = shade(look.trousers, 1.12);
    g.fillRect(cx + 8, y0 + 8, 1, Math.round(h * cuff) - 16);
  };

  const paintFoot = (g, look) => {
    const [x0, y0, w, h] = R.foot, cx = x0 + w / 2;
    g.fillStyle = look.shoes;
    g.fillRect(x0, y0, w, h);
    g.fillStyle = shade(look.shoes, 0.55);
    g.fillRect(x0, y0, 10, h);
    g.fillRect(x0 + w - 10, y0, 10, h);
    g.fillStyle = shade(look.shoes, 1.5);
    for (let y = y0 + 12; y < y0 + 22; y += 3) g.fillRect(cx - 4, y, 8, 1);
  };

  S.Skin = {
    SIZE: S.Body.TEXTURE,

    paint(g, look, face) {
      g.fillStyle = look.shirt;
      g.fillRect(0, 0, S.Skin.SIZE, S.Skin.SIZE);
      paintHead(g, look, face || 0);
      paintHair(g, look);
      paintTorso(g, look);
      paintArm(g, look);
      paintHand(g, look);
      paintLeg(g, look);
      paintFoot(g, look);
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
