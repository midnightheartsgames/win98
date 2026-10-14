(function (S) {
  'use strict';
  const { W, H, C, Pen, Buf, blit } = S;
  const CLOSEUPS = S.CLOSEUPS;
  const A = S.art202;
  const font = S.font;
  const E = S.EP202;

  function spr(f, id, pose, s, x, y) {
    const sp = S.sprite(id, pose, s);
    if (sp) blit(f, sp.buf, Math.round(x - sp.ox), Math.round(y - sp.oy));
  }

  CLOSEUPS.titlecard22 = function (f, g, cu) {
    const t = g.time - cu.t0;
    const P = new Pen(f);
    P.part(P.rect(0, 0, W, H), C.night, { b: 0 });
    for (let y = 0; y < 110; y++) {
      const v = y / 110;
      for (let x = 0; x < W; x++) f.set(x, y, v < 0.4 ? C.teal[3] : C.sky[4]);
    }
    P.part(P.ell(60, 36, 20, 20), C.yellow, { b: 4, sh: 0, hi: 0 });
    P.part(P.rect(0, 110, W, 40), C.teal, { b: 2 });
    P.part(P.poly([0, 150, W, 150, W, H, 0, H]), C.sand, { b: 3 });
    A.palmTree(P, 30, 180);
    A.palmTree(P, 290, 182);
    spr(f, 'moai_mort', {}, 1.1, 220, 180);
    spr(f, 'sam', { dir: 's' }, 1.3, 110, 190);
    spr(f, 'max', { dir: 's', act: 'grin' }, 1.3, 70, 190 - (Math.floor(t * 3) % 2 ? 3 : 0));
    S.bigText(f, 'SAM & MAX', 160, 10, 4, C.yellow[4], C.orange[3], 2);
    if (t > 1) S.bigText(f, cu.lines[1] || '', 160, 50, 2, C.sky[3], C.sky[4], 1);
    if (t > 2) S.bigText(f, cu.lines[2] || '', 160, 72, 2, C.rose[3], C.rose[4], 1);
  };

  CLOSEUPS.warp22 = function (f, g, cu) {
    const t = g.time - cu.t0;
    const P = new Pen(f);
    P.part(P.rect(0, 0, W, H), C.night, { b: 0 });
    const cx = W / 2, cy = H / 2;
    for (let r = 10; r < 160; r += 20) {
      const pulse = (r + t * 40) % 150;
      P.part(P.poly([cx, cy - pulse * 1.2, cx - pulse, cy + pulse * 0.8, cx + pulse, cy + pulse * 0.8]), C.sky, { b: 3, sh: 0, hi: 0 });
    }
    for (let i = 0; i < 30; i++) {
      const a = t * 5 + i * 2.1;
      const d = (t * 80 + i * 15) % 160;
      const x = Math.round(cx + Math.cos(a) * d);
      const y = Math.round(cy + Math.sin(a) * d);
      if (x >= 0 && x < W && y >= 0 && y < H) f.set(x, y, C.neonA);
    }
    spr(f, 'sam', { dir: 's' }, 1.0, cx - 20, cy + 20);
    spr(f, 'max', { dir: 's' }, 1.0, cx + 20, cy + 18);
  };

  CLOSEUPS.volcano22 = function (f, g, cu) {
    const t = g.time - cu.t0;
    const P = new Pen(f);
    P.part(P.rect(0, 0, W, H), C.orange, { b: 3 });
    P.part(P.poly([0, H, W, H, W, 100, 0, 100]), C.stone, { b: 2 });
    P.part(P.poly([60, 140, 260, 140, 290, 180, 30, 180]), C.red, { b: 3 });
    P.part(P.poly([80, 145, 240, 145, 270, 175, 50, 175]), C.yellow, { b: 4, sh: 0 });
    for (let i = 0; i < 6; i++) {
      const y = 80 - ((t * 30 + i * 20) % 80);
      P.part(P.ell(160 + Math.sin(t * 3 + i) * 20, y, 16 + i * 4, 12 + i * 3), C.grey, { b: 2, sh: 0 });
    }
    spr(f, 'spatula22', {}, 1.6, 160, 130);
  };

  CLOSEUPS.epilogue22 = function (f, g, cu) {
    const t = g.time - cu.t0;
    const P = new Pen(f);
    for (let y = 0; y < 120; y++) {
      for (let x = 0; x < W; x++) f.set(x, y, y < 60 ? C.rose[3] : C.orange[3]);
    }
    P.part(P.ell(240, 50, 18, 18), C.yellow, { b: 4, sh: 0, hi: 0 });
    P.part(P.rect(0, 120, W, 30), C.teal, { b: 2 });
    P.part(P.rect(0, 150, W, 50), C.sand, { b: 3 });
    A.palmTree(P, 40, 180);
    spr(f, 'moai_billy', { serious: true }, 1.1, 100, 175);
    spr(f, 'moai_bernie', { happy: true }, 1.1, 180, 175);
    spr(f, 'moai_mort', {}, 1.1, 260, 175);
    S.bigText(f, 'ОСТРОВ ПАСХИ СПАСЕН', 160, 20, 2, C.grey[5], C.night, 1);
  };

  const TITLE_ITEMS = ['Новая игра', 'Продолжить', 'Загрузить', 'Настройки', 'Выход'];
  E.TITLE = {
    items: TITLE_ITEMS,
    draw(f, t, hover, enabled) {
      const P = new Pen(f);
      P.part(P.rect(0, 0, W, H), C.night, { b: 0 });
      for (let y = 0; y < 110; y++) {
        const v = y / 110;
        for (let x = 0; x < W; x++) f.set(x, y, v < 0.4 ? C.teal[3] : C.sky[4]);
      }
      P.part(P.ell(250, 40, 20, 20), C.yellow, { b: 4, sh: 0, hi: 0 });
      P.part(P.rect(0, 110, W, 40), C.teal, { b: 2 });
      P.part(P.poly([0, 150, W, 150, W, H, 0, H]), C.sand, { b: 3 });
      A.palmTree(P, 30, 185);
      A.palmTree(P, 290, 185);
      spr(f, 'moai_mort', {}, 1.0, 210, 175);
      spr(f, 'sam', { dir: 'w', blink: Math.floor(t * 2) % 9 === 0 }, 1.3, 190, 196);
      spr(f, 'max', { dir: 'w', act: 'grin' }, 1.3, 150, 196 - (Math.floor(t * 2.5) % 2 ? 3 : 0));
      S.bigText(f, 'SAM & MAX', 100, 6, 3, C.orange[3], C.yellow[4], 2);
      S.bigText(f, 'БЛЮЗ ИСТУКАНОВ', 100, 32, 2, C.teal[3], C.teal[4], 1);
      S.bigText(f, 'МОАИ', 100, 50, 2, C.sand[3], C.sand[4], 1);
      font.drawCentered(f, 'ЭПИЗОД 202', 100, 70, C.grey[5]);
      TITLE_ITEMS.forEach((s, i) => {
        const on = enabled[i];
        const col = !on ? C.grey[2] : hover === i ? C.yellow[4] : C.grey[5];
        font.draw(f, (hover === i && on ? '» ' : '  ') + s, 30, 86 + i * 14, col);
      });
      font.draw(f, '(c) 2000 LucasArts. Win 98 Edition', 4, 190, C.grey[3]);
    },
    hit(x, y) {
      for (let i = 0; i < TITLE_ITEMS.length; i++) if (x >= 26 && x < 150 && y >= 84 + i * 14 && y < 96 + i * 14) return i;
      return -1;
    }
  };

  E.CREDITS = [
    ['SAM & MAX', 3], ['БЛЮЗ ИСТУКАНОВ', 2], ['', 1],
    ['По мотивам Стива Пёрселла', 1], ['', 1],
    ['Сэм, вольный полицейский детектив', 1], ['Макс, пушистый агент хаоса', 1], ['', 1],
    ['Дизайн и сценарий', 2], ['Отдел вольной полиции', 1], ['', 1],
    ['Особая благодарность', 2], ['Берни за каменные слезы', 1], ['Билли за серьезность', 1], ['Мортимеру за пророчество', 1], ['Сибил и Линкольну за любовь', 1], ['Педро за бессмертную серенаду', 1], ['', 1],
    ['Мистер Лопатка', 2], ['верховный владыка подземного пламени', 1], ['', 1],
    ['Ни один истукан не утонул в лаве.', 1], ['', 1],
    ['КОНЕЦ ЭПИЗОДА 202', 2], ['Продолжение следует...', 1]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
