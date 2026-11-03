(function (P) {
  'use strict';
  const O = P.Orn, A = P.Art, S = P.Scene, I = P.Icons;
  const { W, H, FONT, SERIF, label, wrap, paper, plaque, well, keyLine, drawDesk, SCREENS, ITEMS, LEVELS, UPGRADES } = P;
  const TAU = Math.PI * 2;
  const INK = '#3b2417';

  function lock(ctx, x, y, px) { I.glyph(ctx, 'lock', x, y, px || 16); }

  function stars(ctx, x, y, n, of, r) {
    for (let i = 0; i < (of || 3); i++) A.star(ctx, x + i * (r || 7) * 2.2, y, r || 7, i < n ? '#ffd23a' : '#d8ccb0', i < n ? '#6a3a08' : '#a8987a');
  }

  function book(ctx) {
    A.rrect(ctx, 30, 36, 740, 522, 10, 'rgba(20,8,2,0.45)', null);
    A.rrect(ctx, 26, 28, 748, 520, 12, '#6a1e1a', '#2a0a08', 2);
    for (const [x, w] of [[40, 356], [404, 356]]) {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      if (x < 400) { g.addColorStop(0, '#f4e6c4'); g.addColorStop(0.92, '#fbf2dc'); g.addColorStop(1, '#d8c498'); }
      else { g.addColorStop(0, '#d8c498'); g.addColorStop(0.08, '#fbf2dc'); g.addColorStop(1, '#f2e2bc'); }
      A.rrect(ctx, x, 40, w, 496, 4, g, '#8a6a3a', 1);
      ctx.strokeStyle = 'rgba(80,120,170,0.18)'; ctx.lineWidth = 1;
      for (let y = 118; y < 520; y += 22) { ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.lineTo(x + w - 14, y); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(60,30,10,0.35)'; ctx.fillRect(396, 40, 8, 496);
    ctx.fillStyle = '#b3262e'; ctx.fillRect(560, 28, 12, 40);
    A.poly(ctx, [[560, 68], [566, 62], [572, 68], [572, 80], [566, 74], [560, 80]], '#b3262e', null);
  }

  SCREENS.days = (ui, arg) => {
    let sel = arg.sel || Math.min(ui.save.unlocked, LEVELS.length);
    const S0 = {
      enter() { ui.audio.play('menu'); },
      draw(ctx) {
        drawDesk(ctx, ui.t, 12);
        I.pialaCup(ctx, 778, 586, 1.5, '#a8401a');
        book(ctx);
        label(ctx, 'Дафтар чайханы', 218, 70, { size: 22, serif: true, color: '#6a1e1a', font: 'bold 22px ' + SERIF });
        A.coin(ctx, 72, 100, 8);
        label(ctx, 'Копилка: ' + P.money(ui.save.wallet) + ' сум', 86, 100, { align: 'left', size: 13, color: INK });
        A.star(ctx, 300, 100, 7, '#ffd23a');
        label(ctx, ui.totalStars() + ' / 30', 312, 100, { align: 'left', size: 13, color: INK });
        LEVELS.forEach((L, i) => {
          const n = i + 1;
          const locked = n > ui.save.unlocked;
          const rec = ui.dayRecord(n);
          const y = 118 + i * 34;
          ui.btn([54, y, 330, 30], '', () => { if (!locked) { sel = n; } else ui.audio.sfx('nope'); }, {
            silent: locked,
            draw: (c, hov) => {
              const on = sel === n;
              A.rrect(c, 54, y, 330, 30, 6, on ? 'rgba(200,67,42,0.2)' : hov ? 'rgba(200,120,40,0.12)' : 'rgba(0,0,0,0)', on ? '#c8432a' : hov ? '#b8703a' : 'rgba(0,0,0,0)', 1.5);
              A.ell(c, 72, y + 15, 11, 11, locked ? '#b8ac98' : on ? '#c8432a' : '#2a6ab0', INK, 1.2);
              label(c, String(n), 72, y + 15.5, { size: 12, color: '#fff' });
              label(c, locked ? '— — —' : L.title, 92, y + 15.5, { align: 'left', size: 14, color: locked ? '#a89a80' : INK, font: (on ? 'bold ' : '') + '14px ' + SERIF });
              if (locked) lock(c, 356, y + 15);
              else stars(c, 320, y + 15, rec.stars, 3, 6);
            }
          });
        });
        ui.btn([54, 474, 150, 34], '← Меню', () => ui.go('title'), { color: '#6a5a4a', size: 14 });
        ui.btn([214, 474, 170, 34], 'Книга рецептов', () => ui.go('recipes', { back: 'days', sel }), { color: '#2a6ab0', size: 13 });
        const L = LEVELS[sel - 1];
        const rec = ui.dayRecord(sel);
        label(ctx, 'День ' + sel, 582, 76, { size: 26, serif: true, color: '#8a2410', font: 'bold 26px ' + SERIF });
        label(ctx, L.title, 582, 106, { size: 18, serif: true, color: INK, font: 'bold 18px ' + SERIF });
        ctx.font = 'italic 13px ' + SERIF; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const lines = wrap(ctx, L.story, 318);
        lines.slice(0, 7).forEach((l, i) => ctx.fillText(l, 424, 136 + i * 17));
        let y = 136 + Math.min(7, lines.length) * 17 + 14;
        label(ctx, 'Новое: ' + L.news, 424, y, { align: 'left', size: 13, color: '#8a3a1a', font: 'bold 13px ' + FONT });
        y += 18;
        label(ctx, 'Меню дня:', 424, y + 16, { align: 'left', size: 12, color: INK, font: '12px ' + FONT });
        const prev = sel > 1 ? LEVELS[sel - 2].items : [];
        L.items.forEach((it, i) => {
          const ix = 502 + i * 34;
          A.ell(ctx, ix, y + 17, 15, 13, 'rgba(255,240,200,0.8)', 'rgba(138,106,58,0.5)', 1);
          I.food(ctx, it, ix, y + 16, 27);
          if (!prev.includes(it)) { A.rrect(ctx, ix + 1, y - 1, 26, 11, 3, '#c8432a', '#3a0a04', 0.8); label(ctx, 'новое', ix + 14, y + 4.8, { font: 'bold 8px ' + FONT, color: '#fff4d8' }); }
        });
        y += 50;
        ctx.font = '12px ' + FONT; ctx.fillStyle = INK; ctx.textAlign = 'left';
        const groups = L.groups + (L.special ? L.special.length : 0);
        ctx.fillText('Гостей: ' + groups + ' ' + P.plural(groups, 'компания', 'компании', 'компаний') + '   ·   Столов: ' + L.tables.length, 424, y);
        y += 26;
        A.star(ctx, 432, y - 4, 7, '#ffd23a');
        label(ctx, 'Цель: ' + P.money(L.target) + ' сум', 446, y - 4, { align: 'left', size: 13, color: INK });
        stars(ctx, 600, y - 4, 3, 3, 6);
        label(ctx, P.money(L.expert), 640, y - 4, { align: 'left', size: 13, color: INK });
        y += 24;
        if (rec.best) { label(ctx, 'Рекорд: ' + P.money(rec.best) + ' сум', 424, y, { align: 'left', size: 12, color: '#6a4a2a', font: '12px ' + FONT }); stars(ctx, 640, y, rec.stars, 3, 6); }
        ui.btn([424, 432, 318, 40], 'Начать день ' + sel, () => ui.go('play', { day: sel }), { color: '#c8432a', size: 17, serif: true });
        ui.btn([424, 480, 318, 30], 'Базар: улучшения чайханы', () => ui.go('bazaar', { sel }), { color: '#3d7a3a', size: 13 });
      },
      key(e) {
        if (e.key === 'Escape') { ui.go('title'); return true; }
        if (e.key === 'ArrowDown') { if (sel < ui.save.unlocked) { sel++; ui.audio.sfx('hover'); } return true; }
        if (e.key === 'ArrowUp') { if (sel > 1) { sel--; ui.audio.sfx('hover'); } return true; }
        if (e.key === 'Enter') { ui.go('play', { day: sel }); return true; }
        if (e.key === 'b' || e.key === 'B' || e.key === 'и' || e.key === 'И') { ui.go('bazaar', { sel }); return true; }
        return false;
      }
    };
    return S0;
  };

  function pips(ctx, x, y, n, of) {
    for (let k = 0; k < of; k++) {
      const px = x - (of - 1) * 7 + k * 14;
      A.ell(ctx, px, y, 5, 5, k < n ? '#3d9a3a' : '#d8ccb0', INK, 1);
      if (k < n) A.ell(ctx, px - 1.4, y - 1.6, 1.4, 1, 'rgba(255,255,255,0.7)', null);
    }
  }

  SCREENS.bazaar = (ui, arg) => {
    let pick = 0;
    const avail = () => UPGRADES.filter(u => u.from <= ui.save.unlocked);
    return {
      enter() { ui.audio.play('menu'); },
      draw(ctx) {
        const sky = ctx.createLinearGradient(0, 0, 0, 300);
        sky.addColorStop(0, '#7ac0e8'); sky.addColorStop(1, '#f4dca0');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#d8b07a'; ctx.fillRect(0, 150, W, 450);
        const r = P.rng(12);
        for (let i = 0; i < 90; i++) { ctx.fillStyle = 'rgba(120,80,40,0.12)'; ctx.fillRect(r() * W, 150 + r() * 450, 6 + r() * 14, 3 + r() * 5); }
        for (let i = 0; i < 16; i++) {
          const x = i * 52;
          ctx.fillStyle = ['#c8322a', '#f4ecd6', '#2a8a4a', '#f4ecd6'][i % 4];
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 52, 0); ctx.lineTo(x + 52, 70); ctx.quadraticCurveTo(x + 26, 92, x, 70); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(60,20,10,0.45)'; ctx.lineWidth = 1; ctx.stroke();
        }
        label(ctx, 'Базар', 400, 34, { size: 30, serif: true, color: '#fff4d0', outline: '#5a1a0a', ow: 5, font: 'bold 30px ' + SERIF });
        plaque(ctx, 560, 94, 220, 40, { r: 8 });
        I.glyph(ctx, 'coin', 584, 114, 22);
        label(ctx, P.money(ui.save.wallet) + ' сум', 600, 114.5, { align: 'left', font: 'bold 18px ' + FONT, color: INK });
        label(ctx, 'копилка', 770, 108, { align: 'right', font: 'italic 11px ' + SERIF, color: '#8a5a2a' });
        wood(ctx, 20, 150, 500, 420);
        UPGRADES.forEach((u, i) => {
          const cx = 34 + (i % 3) * 162, cy = 162 + Math.floor(i / 3) * 130;
          const lvl = ui.save.up[u.id] || 0;
          const locked = u.from > ui.save.unlocked;
          const maxed = lvl >= u.costs.length;
          ui.btn([cx, cy, 150, 118], '', () => { if (!locked) pick = i; else ui.audio.sfx('nope'); }, {
            silent: locked,
            draw: (c, hov) => {
              const on = pick === i;
              plaque(c, cx, cy, 150, 118, { r: 8, fill: locked ? '#cdbb98' : on ? '#fff2cc' : hov ? '#f6e4bc' : '#eed9ac', line: on ? '#c8432a' : '#241006' });
              if (on) A.rrect(c, cx - 2, cy - 2, 154, 122, 9, null, '#c8432a', 2);
              A.ell(c, cx + 75, cy + 78, 40, 7, 'rgba(90,50,20,0.18)', null);
              c.globalAlpha = locked ? 0.35 : 1;
              I.good(c, u.id, cx + 75, cy + 48, 76);
              c.globalAlpha = 1;
              if (locked) {
                lock(c, cx + 75, cy + 44, 26);
                A.rrect(c, cx + 38, cy + 60, 74, 16, 5, 'rgba(60,36,20,0.75)', null);
                label(c, 'с дня ' + u.from, cx + 75, cy + 68.5, { font: 'bold 11px ' + FONT, color: '#fff4d8' });
              }
              label(c, u.name, cx + 75, cy + 95, { font: P.fitFont(c, u.name, 140, 12, FONT, true), color: locked ? '#6a5a44' : INK });
              pips(c, cx + 75, cy + 108, lvl, u.costs.length);
              if (maxed) {
                c.save(); c.translate(cx + 118, cy + 16); c.rotate(0.3);
                A.rrect(c, -30, -8, 60, 16, 3, '#3d8a3a', '#1a4a1a', 1);
                label(c, 'Куплено', 0, 0.5, { font: 'bold 10px ' + FONT, color: '#f4ffe8' });
                c.restore();
              } else if (!locked) {
                const cost = u.costs[lvl];
                const can = ui.save.wallet >= cost;
                A.rrect(c, cx + 96, cy + 6, 48, 15, 7, can ? '#fff8e0' : '#e8dcc4', can ? '#8a6a2a' : '#a89878', 1);
                I.glyph(c, 'coin', cx + 104, cy + 13.5, 11);
                label(c, P.money(cost), cx + 111, cy + 14, { align: 'left', font: 'bold 9px ' + FONT, color: can ? INK : '#8a7a5a' });
              }
            }
          });
        });
        const u = UPGRADES[pick] && UPGRADES[pick].from <= ui.save.unlocked ? UPGRADES[pick] : avail()[0];
        paper(ctx, 540, 150, 240, 420, { r: 8 });
        if (u) {
          const lvl = ui.save.up[u.id] || 0;
          A.ell(ctx, 660, 262, 70, 12, 'rgba(90,50,20,0.16)', null);
          I.good(ctx, u.id, 660, 212, 118);
          label(ctx, u.name, 660, 286, { font: 'bold 17px ' + SERIF, color: '#6a1e1a' });
          ctx.font = '13px ' + FONT; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
          wrap(ctx, u.desc, 206).forEach((l, i) => ctx.fillText(l, 556, 312 + i * 17));
          let y = 382;
          u.levels.forEach((txt, k) => {
            if (k < lvl) I.glyph(ctx, 'check', 563, y - 4, 14);
            else A.ell(ctx, 563, y - 4, 5, 5, k === lvl ? '#ffd23a' : '#d8ccb0', INK, 1);
            ctx.fillStyle = k < lvl ? '#2a6a2a' : INK; ctx.font = (k === lvl ? 'bold ' : '') + '12px ' + FONT;
            wrap(ctx, txt, 190).forEach((l, j) => ctx.fillText(l, 576, y + j * 14));
            y += 34;
          });
          if (lvl < u.costs.length) {
            const cost = u.costs[lvl];
            const can = ui.save.wallet >= cost;
            ui.btn([556, 510, 208, 42], 'Купить: ' + P.money(cost), () => {
              if (ui.save.wallet < cost) return;
              ui.save.wallet -= cost;
              ui.save.up[u.id] = lvl + 1;
              ui.persist();
              ui.audio.sfx('buy');
            }, { color: can ? '#3d8a3a' : '#8a8478', disabled: !can, size: 15 });
            if (!can) label(ctx, 'Не хватает ' + P.money(cost - ui.save.wallet) + ' сум', 660, 498, { size: 11, color: '#8a3a1a', font: '11px ' + FONT });
          } else label(ctx, 'Всё куплено', 660, 530, { size: 16, color: '#2a6a2a', serif: true });
        }
        ui.btn([20, 574 - 8, 200, 30], '← В дафтар', () => ui.go('days', { sel: arg.sel }), { color: '#6a5a4a', size: 13 });
        label(ctx, 'В копилку идёт четверть выручки каждого дня', 480, 582, { size: 11, color: '#5a3a1a', font: 'italic 11px ' + SERIF });
      },
      key(e) {
        if (e.key === 'Escape') { ui.go('days', { sel: arg.sel }); return true; }
        return false;
      }
    };
  };

  function wood(ctx, x, y, w, h) {
    A.rrect(ctx, x, y, w, h, 8, '#8a5a2a', INK, 2);
    const r = P.rng(4);
    ctx.save(); A.rrect(ctx, x, y, w, h, 8, null, null); ctx.clip();
    ctx.strokeStyle = 'rgba(60,30,10,0.3)'; ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) { const yy = y + r() * h; ctx.beginPath(); ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * 0.3, yy + (r() - 0.5) * 10, x + w * 0.7, yy + (r() - 0.5) * 10, x + w, yy); ctx.stroke(); }
    ctx.restore();
  }

  const RECIPE_TABS = [
    { id: 'basics', name: 'Как играть' },
    { id: 'plov', name: 'Плов' },
    { id: 'drinks', name: 'Чай и компот' },
    { id: 'bake', name: 'Тандыр и салат' },
    { id: 'guests', name: 'Гости' },
    { id: 'money', name: 'Деньги' },
    { id: 'patterns', name: 'Узоры' }
  ];

  const PATTERN_TEXT = [
    'Абр по-узбекски значит облако. Нити для ткани красят пучками, потом натягивают на станок, и каждая нить чуть съезжает. Поэтому у иката размытые края.',
    'Узоры в этой игре никто не рисовал. Программа берёт число, раскладывает по нему лепестки сюзане, пояса риштанского лягана и полосы иката, а потом сдвигает каждую нить на свою долю.',
    'Одно и то же число всегда даёт один и тот же узор. Курпачи на топчанах, скатерти и тарелки на стене сделаны так же, у каждого своё число.'
  ];

  let sheetCache = null;
  function patternSheet(seed) {
    if (sheetCache && sheetCache.seed === seed) return sheetCache.c;
    sheetCache = {
      seed, c: A.mk(330, 380, 0, 0, ctx => {
        const r = P.rng(seed);
        const pals = [O.PALETTES.madder, O.PALETTES.atlas, O.PALETTES.chapan];
        const ik = O.ikat(seed, 150, 120, pals[Math.floor(r() * pals.length)], { kind: ['amulet', 'comb', 'flame', 'stripe'][seed % 4], tileW: 50, tileH: 60, feather: 0.06 + r() * 0.06 });
        A.rrect(ctx, 6, 8, 154, 124, 4, '#3b2417', null);
        ctx.drawImage(ik, 8, 10, 150, 120);
        const sp = [O.PALETTES.madder, ['#9a2a2e', '#e8b64a', '#1f4f8f', '#3d7a3a', '#f3e6c8', '#4a1a10'], ['#1f4f8f', '#e8b64a', '#b3262e', '#2a6a3a', '#f4ecd8', '#1a1a3a']];
        O.suzani(ctx, 250, 76, 64, seed ^ 0x51, sp[Math.floor(r() * sp.length)]);
        A.ell(ctx, 250, 76, 64, 64, null, '#3b2417', 1.2);
        O.rishtan(ctx, 165, 260, 92, seed ^ 0x77);
        A.ell(ctx, 165, 260, 92, 92, null, '#0e2458', 1.6);
      })
    };
    return sheetCache.c;
  }

  function step(ctx, x, y, n, text, icon) {
    A.ell(ctx, x + 12, y + 2, 11, 11, '#c8432a', INK, 1.2);
    label(ctx, String(n), x + 12, y + 2.5, { size: 12, color: '#fff' });
    if (icon) icon(ctx, x + 44, y + 10);
    ctx.font = '13px ' + FONT; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const lines = wrap(ctx, text, icon ? 260 : 300);
    lines.forEach((l, i) => ctx.fillText(l, x + (icon ? 70 : 32), y + 6 + i * 16));
    return Math.max(40, lines.length * 16 + 12);
  }

  function para(ctx, x, y, text, w) {
    ctx.font = '13px ' + FONT; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const lines = wrap(ctx, text, w || 330);
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * 16));
    return lines.length * 16 + 8;
  }

  function recipePage(ctx, id) {
    const X = 418, X2 = 58;
    if (id === 'basics') {
      let y = 90;
      label(ctx, 'Один день в чайхане', 218, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      y += step(ctx, X2, y, 1, 'Щёлкните по гостям у ворот, затем по свободному столу. Троих и четверых сажайте на топчаны.', (c, x, yy) => { I.glyph(c, 'guests', x - 2, yy + 4, 24); I.glyph(c, 'table', x + 8, yy + 16, 16); });
      y += step(ctx, X2, y, 2, 'Рука над столом: гости выбрали. Подойдите и примите заказ.', (c, x, yy) => { S.bubble(c, x, yy + 12, 26, 24, '#fff6d0'); I.glyph(c, 'hand', x, yy + 0.5, 20); });
      y += step(ctx, X2, y, 3, 'Соберите блюда из заказа. В руках помещается два, лишнее можно поставить на раздачу.', (c, x, yy) => I.food(c, 'plov', x, yy + 4, 30));
      y += step(ctx, X2, y, 4, 'Монеты над столом: гости поели. Заберите деньги, потом уберите посуду.', (c, x, yy) => I.glyph(c, 'coins', x, yy + 4, 26));
      label(ctx, 'Управление', 582, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      let y2 = 96;
      const rows = [
        ['Левая кнопка', 'идти и действовать; щелчки выстраиваются в очередь до пяти дел'],
        ['Правая кнопка', 'отменить очередь дел и выбор гостей'],
        ['Перетаскивание', 'гостей можно перетащить мышкой прямо на стол'],
        ['WASD, стрелки', 'ходить самому'],
        ['Пробел, E', 'действие с тем, что рядом; у ворот выбрать гостей'],
        ['Tab, 1–6', 'выбрать гостей в очереди и посадить за стол с этим номером'],
        ['Q', 'отменить очередь дел'],
        ['Esc, P', 'пауза']
      ];
      for (const [k, v] of rows) {
        P.keycap(ctx, k, X, y2 - 13, { size: 10, min: 104, h: 18 });
        const h = para(ctx, X + 112, y2 + 1, v, 220);
        y2 += Math.max(30, h + 6);
      }
      return;
    }
    if (id === 'plov') {
      label(ctx, 'Казан', 218, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      let y = 92;
      y += step(ctx, X2, y, 1, 'Пустой казан: щелчок, и ошпаз раскалит масло и заложит мясо. Мясо жарится само.', (c, x, yy) => I.glyph(c, 'meat', x, yy + 4, 28));
      y += step(ctx, X2, y, 2, 'Пока мясо жарится, нарежьте на доске морковь с луком. Мясо подрумянилось? Кладите в казан.', (c, x, yy) => I.food(c, 'veg', x, yy + 5, 28));
      y += step(ctx, X2, y, 3, 'Зирвак протомился: щелчок по казану, и туда идут рис и зира.', (c, x, yy) => I.glyph(c, 'rice', x, yy + 4, 28));
      y += step(ctx, X2, y, 4, 'Плов томится под крышкой, потом из казана выходит 8 ляганов. Каждый щелчок даёт один.', (c, x, yy) => I.food(c, 'plov', x, yy + 5, 30));
      label(ctx, 'Советы оша', 582, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      let y2 = 96;
      y2 += para(ctx, X, y2, 'Красное кольцо над казаном значит, что мясо или зирвак вот-вот сгорят. Сгоревший казан надо отчистить, а это время и 300 сум убытка.');
      y2 += para(ctx, X, y2, 'Новый плов можно заложить, только когда казан пуст. Остался последний ляган? Поставьте его на раздачу и сразу закладывайте мясо.');
      y2 += para(ctx, X, y2, 'Плов варится долго. Следите за казаном, когда гостей много: пустой казан в обед хуже, чем сгоревший.');
      y2 += para(ctx, X, y2, 'Большие компании часто заказывают сразу два лягана.');
      return;
    }
    if (id === 'drinks') {
      label(ctx, 'Самовар', 218, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      let y = 92;
      y += step(ctx, X2, y, 1, 'Щёлкните по чайнику, он заварится сам. Из одной заварки выходит два чайника.', (c, x, yy) => I.food(c, 'teaBlack', x, yy + 5, 30));
      y += step(ctx, X2, y, 2, 'Чёрный чай в коричневом чайнике, зелёный в белом с синим хлопком.', (c, x, yy) => I.food(c, 'teaGreen', x, yy + 5, 30));
      label(ctx, 'Компот', 582, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      let y2 = 92;
      y2 += step(ctx, X + 4, y2, 1, 'В банке восемь порций. Щелчок наливает кувшин для стола.', (c, x, yy) => I.food(c, 'compote', x, yy + 6, 30));
      y2 += step(ctx, X + 4, y2, 2, 'Пустую банку наполняют заново, это пара секунд.', null);
      return;
    }
    if (id === 'bake') {
      label(ctx, 'Тандыр', 218, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      let y = 92;
      y += step(ctx, X2, y, 1, 'Загрузите тандыр щелчком. Сначала в нём печётся четыре самсы, а когда появится нон, две самсы и две лепёшки.', (c, x, yy) => I.food(c, 'samsa', x, yy + 5, 28));
      y += step(ctx, X2, y, 2, 'Готово? Выньте выпечку в корзины. Тандыр держит жар недолго, передержанное подгорает.', (c, x, yy) => I.food(c, 'non', x, yy + 5, 28));
      y += step(ctx, X2, y, 3, 'Из корзины берут по одной штуке. В корзине помещается восемь.', null);
      label(ctx, 'Ачичук', 582, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      let y2 = 92;
      y2 += step(ctx, X + 4, y2, 1, 'Помидоры, лук, соль, райхон. Ошпаз режет на второй доске, стоя на месте.', (c, x, yy) => I.food(c, 'achichuk', x, yy + 5, 30));
      y2 += para(ctx, X, y2 + 6, 'Пока ошпаз режет, руки заняты. Режьте, когда гости едят или ждут чай.');
      return;
    }
    if (id === 'guests') {
      label(ctx, 'Кто приходит', 218, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      label(ctx, 'И кто торопится', 582, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      const cols = { neighbor: 0, elder: 0, student: 0, worker: 0, tourist: 1, family: 1, business: 1, critic: 1, courier: 1 };
      const rows = [0, 0];
      Object.keys(cols).forEach((type, i) => {
        const col = cols[type], row = rows[col]++;
        const x = col ? 418 : 58, y = 90 + row * 80;
        A.shadow(ctx, x + 18, y + 64, 12, 3.4, 0.22);
        A.drawCharHD(ctx, A.lookFor({ type, seed: 11 + i, idx: 0 }), { dir: 'down', act: 'stand', frame: 0, arm: type === 'business' ? 'phone' : null, expr: type === 'business' ? 'impatient' : 'ok' }, x + 18, y + 64, 1.05);
        label(ctx, P.TYPES[type].name, x + 46, y + 10, { align: 'left', size: 13, color: '#8a3a1a', font: 'bold 13px ' + FONT });
        para(ctx, x + 46, y + 30, P.TEXT.guests[type], 250);
      });
      return;
    }
    if (id === 'money') {
      label(ctx, 'Выручка', 218, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      let y = 96;
      for (const it of ['plov', 'achichuk', 'samsa', 'non', 'teaBlack', 'teaGreen', 'compote']) {
        I.food(ctx, it, 80, y - 1, 26);
        label(ctx, ITEMS[it].name, 104, y, { align: 'left', size: 13, color: INK, font: '13px ' + FONT });
        label(ctx, P.money(ITEMS[it].price) + ' сум', 360, y, { align: 'right', size: 13, color: INK });
        y += 30;
      }
      y += 6;
      y += para(ctx, X2, y, 'Гости платят за всё, что им принесли, даже если заказ был не весь.', 320);
      label(ctx, 'Бонусы и штрафы', 582, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
      let y2 = 96;
      y2 += para(ctx, X, y2, 'Чаевые зависят от сердечек: довольные гости оставляют больше.');
      y2 += para(ctx, X, y2, 'Весь заказ принесён быстро? Сверху 15% от счёта.');
      y2 += para(ctx, X, y2, 'Серия: дела с гостями подряд, без долгих пауз, приносят по 10 сум за каждый шаг серии.');
      y2 += para(ctx, X, y2, 'Ушедший гость стоит 150 сум с человека. Критик, ушедший голодным, обходится в 1000.');
      y2 += para(ctx, X, y2, 'Четверть выручки идёт в копилку. На базаре на неё покупают улучшения чайханы.');
    }
  }

  let patternSeed = 2000;

  SCREENS.recipes = (ui, arg) => {
    let tab = arg.tab || 0;
    return {
      enter() { ui.audio.play('menu'); },
      draw(ctx) {
        drawDesk(ctx, ui.t, 31);
        book(ctx);
        RECIPE_TABS.forEach((t, i) => {
          const y = 50 + i * 44;
          ui.btn([774 - 8, y, 26, 40], '', () => { tab = i; }, {
            draw: (c, hov) => {
              A.rrect(c, 766, y, 30, 40, 5, tab === i ? '#c8432a' : hov ? '#d8843a' : '#8a5a2a', INK, 1.2);
              c.save(); c.translate(783, y + 20); c.rotate(Math.PI / 2);
              label(c, t.name.split(' ')[0], 0, 0, { size: 9, color: '#fff', font: 'bold 9px ' + FONT });
              c.restore();
            }
          });
        });
        if (RECIPE_TABS[tab].id === 'patterns') {
          label(ctx, 'Альбом узоров', 218, 70, { size: 18, serif: true, color: '#6a1e1a', font: 'bold 18px ' + SERIF });
          let y = 100;
          for (const p of PATTERN_TEXT) y += para(ctx, 58, y, p, 320) + 6;
          const sheet = patternSheet(patternSeed);
          ctx.drawImage(sheet.c, 418, 58, sheet.w, sheet.h);
          label(ctx, 'Икат', 496, 212, { size: 11, color: '#6a4a2a', font: 'italic 11px ' + SERIF });
          label(ctx, 'Сюзане', 668, 212, { size: 11, color: '#6a4a2a', font: 'italic 11px ' + SERIF });
          label(ctx, 'Узор № ' + patternSeed, 582, 452, { size: 15, serif: true, color: '#8a2410', font: 'bold 15px ' + SERIF });
          ui.btn([424, 466, 60, 30], '◀', () => { patternSeed = Math.max(1, patternSeed - 1); }, { color: '#8a5a2a', size: 12 });
          ui.btn([492, 466, 180, 30], 'Случайный узор', () => { patternSeed = 1 + Math.floor(Math.random() * 9998); }, { color: '#3d7a3a', size: 12 });
          ui.btn([680, 466, 60, 30], '▶', () => { patternSeed = Math.min(9999, patternSeed + 1); }, { color: '#8a5a2a', size: 12 });
        } else {
          recipePage(ctx, RECIPE_TABS[tab].id);
          label(ctx, RECIPE_TABS[tab].name + '  ·  ' + (tab + 1) + ' / ' + RECIPE_TABS.length, 582, 516, { size: 12, color: '#8a6a3a', font: 'italic 12px ' + SERIF });
        }
        ui.btn([54, 496, 150, 32], '← Назад', () => ui.go(arg.back || 'title', { sel: arg.sel }), { color: '#6a5a4a', size: 13 });
        ui.btn([214, 496, 80, 32], '◀', () => { tab = (tab + RECIPE_TABS.length - 1) % RECIPE_TABS.length; }, { color: '#2a6ab0', size: 13 });
        ui.btn([302, 496, 80, 32], '▶', () => { tab = (tab + 1) % RECIPE_TABS.length; }, { color: '#2a6ab0', size: 13 });
      },
      key(e) {
        if (e.key === 'Escape') { ui.go(arg.back || 'title', { sel: arg.sel }); return true; }
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { tab = (tab + 1) % RECIPE_TABS.length; return true; }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { tab = (tab + RECIPE_TABS.length - 1) % RECIPE_TABS.length; return true; }
        return false;
      }
    };
  };

  SCREENS.results = (ui, arg) => {
    const res = arg.result, L = LEVELS[arg.day - 1];
    let t = 0, starsShown = 0;
    const st = res.stats;
    const lines = [
      ['Продажи', st.sales],
      ['Чаевые', st.tips],
      ['Бонусы: скорость и серии', st.bonus],
      ['Штрафы и убытки', -st.penalty]
    ];
    return {
      enter() { ui.audio.play(null); },
      update(dt) {
        t += dt;
        const want = t > 2.2 ? Math.min(res.stars, Math.floor((t - 2.2) / 0.45) + 1) : 0;
        if (want > starsShown) { starsShown = want; ui.audio.sfx('star', starsShown); }
        if (t > 4.6 && !this.music) { this.music = true; ui.audio.play('menu'); }
      },
      draw(ctx) {
        drawDesk(ctx, ui.t, 44);
        const x = 250, y = 26, w = 300, h = 548;
        ctx.save();
        ctx.beginPath(); ctx.rect(x - 10, y, w + 20, h * Math.min(1, t * 1.4) + 6); ctx.clip();
        A.rrect(ctx, x + 4, y + 6, w, h, 2, 'rgba(20,8,2,0.4)', null);
        ctx.fillStyle = '#fbf8ee'; ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i <= 20; i++) ctx.lineTo(x + i * w / 20, y + (i % 2 ? 5 : 0));
        ctx.lineTo(x + w, y + h);
        for (let i = 20; i >= 0; i--) ctx.lineTo(x + i * w / 20, y + h - (i % 2 ? 5 : 0));
        ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#c8bca0'; ctx.lineWidth = 1; ctx.stroke();
        const mono = '"Courier New", Courier, monospace';
        const tx = (s, yy, opts = {}) => label(ctx, s, opts.x || 400, yy, Object.assign({ size: 13, color: '#2a2a2a', font: (opts.bold ? 'bold ' : '') + (opts.size || 13) + 'px ' + mono }, opts));
        tx('ЧАЙХАНА «ГДЕ ПЛОВ?»', y + 30, { bold: true, size: 16 });
        tx('махалля Ширин, касса № 1', y + 50, { size: 11 });
        tx('─'.repeat(30), y + 64, { size: 11 });
        tx('ДЕНЬ ' + arg.day + ': ' + L.title.toUpperCase(), y + 82, { bold: true });
        tx('─'.repeat(30), y + 98, { size: 11 });
        let yy = y + 122;
        lines.forEach(([name, v], i) => {
          if (t < 0.5 + i * 0.25) return;
          label(ctx, name, x + 22, yy, { align: 'left', size: 12, color: '#2a2a2a', font: '12px ' + mono });
          label(ctx, (v < 0 ? '−' : '') + P.money(Math.abs(v)), x + w - 22, yy, { align: 'right', size: 13, color: v < 0 ? '#a8201a' : '#2a2a2a', font: 'bold 13px ' + mono });
          yy += 24;
        });
        if (t > 1.6) {
          tx('═'.repeat(30), yy - 6, { size: 11 });
          label(ctx, 'ИТОГО', x + 22, yy + 14, { align: 'left', size: 16, color: '#2a2a2a', font: 'bold 16px ' + mono });
          label(ctx, P.money(res.money) + ' сум', x + w - 22, yy + 14, { align: 'right', size: 16, color: '#2a2a2a', font: 'bold 16px ' + mono });
        }
        yy += 44;
        if (t > 1.9) {
          label(ctx, 'Гостей накормлено: ' + st.served + ' из ' + st.groups, x + 22, yy, { align: 'left', size: 12, color: '#2a2a2a', font: '12px ' + mono });
          label(ctx, 'Лучшая серия: ×' + st.bestCombo, x + 22, yy + 18, { align: 'left', size: 12, color: '#2a2a2a', font: '12px ' + mono });
          label(ctx, 'Цель дня: ' + P.money(L.target), x + 22, yy + 36, { align: 'left', size: 12, color: '#2a2a2a', font: '12px ' + mono });
          label(ctx, res.passed ? 'ВЫПОЛНЕНА' : 'НЕ ВЫПОЛНЕНА', x + w - 22, yy + 36, { align: 'right', size: 12, color: res.passed ? '#2a6a2a' : '#a8201a', font: 'bold 12px ' + mono });
          label(ctx, 'В копилку (25%): +' + P.money(arg.savings), x + 22, yy + 54, { align: 'left', size: 12, color: '#2a2a2a', font: '12px ' + mono });
          if (st.vipOk) label(ctx, 'Статья в «Ош-хабар»: пять звёзд', x + 22, yy + 72, { align: 'left', size: 12, color: '#8a5a10', font: 'bold 12px ' + mono });
        }
        ctx.restore();
        const sy = 430;
        for (let i = 0; i < 3; i++) {
          const on = i < starsShown;
          const k = on ? P.easeOutBack(Math.min(1, (t - 2.2 - i * 0.45) * 3)) : 1;
          ctx.save(); ctx.translate(360 + i * 40, sy); ctx.scale(k, k);
          A.star(ctx, 0, 0, 17, on ? '#ffd23a' : '#e0d6c0', on ? '#8a4a08' : '#b8ac90');
          ctx.restore();
        }
        if (t > 2.4 && res.money > arg.prevBest && arg.prevBest > 0) {
          ctx.save(); ctx.translate(505, 150); ctx.rotate(0.25);
          A.rrect(ctx, -58, -16, 116, 32, 4, 'rgba(200,40,30,0.12)', '#c8281a', 2.5);
          label(ctx, 'РЕКОРД!', 0, 1, { size: 20, color: '#c8281a', font: 'bold 20px ' + SERIF });
          ctx.restore();
        }
        if (t > 2.4) {
          A.shadow(ctx, 140, 422, 48, 10, 0.35);
          A.drawCharHD(ctx, A.CHEF, { dir: 'down', act: 'stand', arm: res.passed ? 'carry' : null, frame: 0, expr: res.passed ? 'happy' : 'impatient' }, 140, 420, 3.2);
          if (res.passed) I.food(ctx, 'plov', 140, 342, 70);
          ctx.font = 'italic 13px ' + SERIF; ctx.fillStyle = '#f8e8c0'; ctx.textAlign = 'center';
          const say = res.stars >= 3 ? 'Бахтиёр-ака доволен: «Вот это плов!»' : res.passed ? 'Бахтиёр-ака кивает: «Яхши, болам».' : 'Бахтиёр-ака: «Ничего. Завтра казан раньше ставь».';
          wrap(ctx, say, 210).forEach((l, i) => ctx.fillText(l, 140, 460 + i * 16));
          if (arg.unlockedNow) { A.rrect(ctx, 30, 70, 210, 60, 8, 'rgba(40,110,40,0.85)', '#f6e2b0', 2); label(ctx, 'Открыт день ' + (arg.day + 1) + '!', 135, 92, { size: 16, serif: true, color: '#fff' }); label(ctx, LEVELS[arg.day].title, 135, 114, { size: 12, color: '#e8ffd0', font: 'bold 12px ' + FONT }); }
        }
        if (t > 2.6) {
          const next = arg.day < LEVELS.length && res.passed;
          const bx = 580;
          if (arg.finale) ui.btn([bx, 300, 196, 44], 'Праздник!', () => ui.go('finale'), { color: '#c8432a', size: 17, serif: true });
          else if (next) ui.btn([bx, 300, 196, 44], 'Следующий день', () => ui.go('play', { day: arg.day + 1 }), { color: '#c8432a', size: 16, serif: true });
          ui.btn([bx, 354, 196, 38], 'Ещё раз', () => ui.go('play', { day: arg.day }), { color: '#2a6ab0', size: 15 });
          ui.btn([bx, 400, 196, 38], 'Базар', () => ui.go('bazaar', { sel: Math.min(ui.save.unlocked, arg.day + (res.passed ? 1 : 0)) }), { color: '#3d8a3a', size: 15 });
          ui.btn([bx, 446, 196, 38], 'Дафтар', () => ui.go('days', { sel: Math.min(ui.save.unlocked, arg.day + (res.passed ? 1 : 0)) }), { color: '#6a5a4a', size: 15 });
        }
      },
      click() { if (t < 2.6) t = 2.6; },
      key(e) {
        if (t < 2.6) { t = 2.6; return true; }
        if (e.key === 'Escape') { ui.go('days', { sel: arg.day }); return true; }
        return false;
      }
    };
  };

  SCREENS.finale = (ui) => {
    let t = 0;
    const sparks = [];
    const r = P.rng(2000);
    const credits = [
      ['Где плов?', 30], ['', 10],
      ['Сезон в чайхане закрыт.', 16], ['Десять дней, сотни ляганов, ни одного холодного чайника.', 14], ['', 12],
            ['Наставник', 13], ['Бахтиёр-ака', 18], ['', 8],
      ['Разработка', 13], ['Kishlak Soft, 2000', 18], ['', 8],
      ['Узоры', 13], ['икат, сюзане и риштанская керамика', 16], ['сгенерированы программой, каждый по своему семени', 13], ['', 8],
      ['Музыка', 13], ['дойра и дутар из синтезатора', 16], ['', 12],
      ['Рахмат, что играли!', 20]
    ];
    return {
      enter() { ui.audio.play('day'); ui.audio.sfx('fanfare'); },
      update(dt) {
        t += dt;
        if (r() < dt * 2.2) {
          const x = 120 + r() * 560, y = 80 + r() * 200, col = ['#ffd23a', '#ff5a4a', '#6ae06a', '#6ab8ff', '#ff8ae0'][Math.floor(r() * 5)];
          for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; sparks.push({ x, y, vx: Math.cos(a) * (60 + r() * 50), vy: Math.sin(a) * (60 + r() * 50), t: 0, col }); }
          ui.audio.sfx('pour');
        }
        for (const s of sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt; }
        for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].t > 1.4) sparks.splice(i, 1);
      },
      draw(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0e1638'); g.addColorStop(0.6, '#3a2a5a'); g.addColorStop(1, '#8a4a2a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        for (const s of sparks) { ctx.globalAlpha = 1 - s.t / 1.4; A.ell(ctx, s.x, s.y, 2, 2, s.col, null); }
        ctx.globalAlpha = 1;
        const cols = ['#ff5a4a', '#ffd23a', '#6ae06a', '#6ab8ff'];
        ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 60); ctx.quadraticCurveTo(400, 110, 800, 60); ctx.stroke();
        for (let i = 0; i < 24; i++) { const x = i * 34 + 10; const y = 60 + Math.sin(i / 23 * Math.PI) * 25; A.ell(ctx, x, y + 4, 4, 5, cols[i % 4], '#2a1a0c', 0.8); ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 4 + i); A.ell(ctx, x, y + 4, 10, 10, cols[i % 4], null); ctx.globalAlpha = 1; }
        O.basketweave(ctx, 0, 470, W, 130, 7, { brick: 14 });
        ctx.fillStyle = 'rgba(20,10,30,0.45)'; ctx.fillRect(0, 470, W, 130);
        A.drawCharHD(ctx, A.CHEF, { dir: 'down', act: 'stand', arm: 'carry', frame: 0, expr: 'happy' }, 170, 520, 3.6);
        ctx.save(); ctx.translate(170, 520); ctx.scale(3.6, 3.6);
        const gg = ctx.createLinearGradient(-12, -26, 12, -12);
        gg.addColorStop(0, '#fff2a0'); gg.addColorStop(0.5, '#ffd23a'); gg.addColorStop(1, '#c88a10');
        ctx.beginPath(); ctx.moveTo(-11, -22); ctx.bezierCurveTo(-10, -14, -5, -11, 0, -11); ctx.bezierCurveTo(5, -11, 10, -14, 11, -22); ctx.closePath();
        A.finish(ctx, gg, '#6a3a08', 0.9);
        A.ell(ctx, 0, -22, 11.5, 2.6, '#f0b24a', '#6a3a08', 0.9);
        A.rrect(ctx, -15, -23, 4, 2.4, 1, '#d8a020', '#6a3a08', 0.6);
        A.rrect(ctx, 11, -23, 4, 2.4, 1, '#d8a020', '#6a3a08', 0.6);
        ctx.restore();
        A.drawCharHD(ctx, P.mentor(), { dir: 'down', act: 'stand', frame: 0, expr: 'happy' }, 290, 520, 3);
        const y0 = 530 - t * 30;
        let y = y0;
        ctx.save();
        ctx.beginPath(); ctx.rect(400, 96, 400, 438); ctx.clip();
        for (const [text, size] of credits) {
          if (y > 80 && y < 560) label(ctx, text, 600, y, { size, color: size >= 18 ? '#ffe8a0' : '#f4e6c8', outline: '#1a0a20', ow: 3, font: (size >= 16 ? 'bold ' : '') + size + 'px ' + SERIF });
          y += size + 12;
        }
        ctx.restore();
        if (y < 90) t = 0;
        ui.btn([600, 548, 180, 38], 'В дафтар', () => ui.go('days'), { color: '#c8432a', size: 15 });
      },
      key(e) { if (e.key === 'Escape' || e.key === 'Enter') { ui.go('days'); return true; } return false; }
    };
  };

  Object.assign(P, { RECIPE_TABS, patternSheet, PATTERN_TEXT });
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
