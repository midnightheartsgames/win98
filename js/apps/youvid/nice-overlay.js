(function () {
  const CHAT = [
    { n: '_null', m: 'ОНА ВЫЛЕТЕЛА ЗА 30', y: 6 },
    { n: '_null', m: 'БЕЗ ПАЛЕВА', y: 22 },
    { n: 'Alberto Pelmeni', m: 'Хорошо что хоть так сделал', y: 44 },
    { n: 'Серега Серега', m: 'с*ка бахаха почти вымерла ни', y: 59, more: 'одного долб**ба кроме меня нет', blue: true },
    { n: 'Alberto Pelmeni', m: 'ты даже еще не напился', y: 96, more: 'Зоныч, это только разогрев' },
    { n: 'Vadim ZX', m: 'она', y: 128, blue: true },
    { n: 'WoWpire', m: 'волоса знак волоса знак', y: 143 },
    { n: '_null', m: 'ИЗ ПЕКИНА!', y: 158 },
    { n: 'Energy 335', m: 'БЛ**Ь С*КА ОН ВРУБИТ', y: 175, more: 'МОЙ ДОНАТ ИЛИ НЕТ', blue: true }
  ];

  const TODAY = [[0, 'Жучка - 55 RUB'], [1.8, 'Energy 115 - 55 RUB'], [4.6, 'Жучка - 55 RUB'], [6.6, 'Energy 115 - 120 RUB'], [9.4, 'Жучка - 55 RUB']];
  const TOP = [[0, ['Лудоман чепуха чумазая -', '14 909 RUB']], [5.6, ['Don Pelmenion - 12 011 RUB']]];
  const MONTH = [[0, 'Henka - 6 666 RUB'], [1.6, 'Это_Мой_Лес - 3 415 RUB'], [4.6, 'Василий Чаечка - 3 000 RUB'], [6.6, 'Жучка - 1 471 RUB'], [9.4, 'asa - 18 000 RUB']];

  const TILES = [[0.04, [8, 25, 100, 410]], [0.24, [125, 25, 330, 410]], [0.44, [355, 25, 775, 210]], [0.64, [355, 230, 775, 410]]];
  const OPEN = 0.98;

  function pick(list, t) {
    let v = list[0][1];
    list.forEach(([t0, x]) => { if (t >= t0) v = x; });
    return v;
  }

  function state(t) {
    return { today: pick(TODAY, t), top: pick(TOP, t), month: pick(MONTH, t) };
  }

  function stateKey(st) {
    return [st.today, st.top.join('|'), st.month].join('#');
  }

  function outlined(ctx, text, x, y, fill, stroke, width) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  function drawChat(ctx) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    CHAT.forEach(line => {
      ctx.font = 'bold 8px Arial, sans-serif';
      const nick = line.n + ':';
      outlined(ctx, nick, 3, line.y + 4, line.blue ? '#7fb2ff' : '#f4f4f4', '#101010', 2.5);
      const nx = 6 + ctx.measureText(nick).width;
      ctx.font = '14px "Times New Roman", serif';
      outlined(ctx, line.m, nx, line.y, '#2b8fe0', '#0a1830', 3);
      if (line.more) outlined(ctx, line.more, 3, line.y + 15, '#2b8fe0', '#0a1830', 3);
    });
  }

  function drawToday(ctx, text) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 15px Arial, sans-serif';
    outlined(ctx, 'Донатеры за сегодня', 70, 0, '#f4f0e0', '#3a2c10', 3);
    ctx.font = 'bold 14px Arial, sans-serif';
    outlined(ctx, text, 72, 17, '#ff9a28', '#3a1c08', 3);
  }

  function drawTop(ctx, lines) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = 'italic bold 22px "Times New Roman", serif';
    outlined(ctx, 'VIP', 356, 6, '#5ad24a', '#0c2a08', 3);
    ctx.fillStyle = '#e8c040';
    ctx.beginPath();
    ctx.moveTo(360, 6);
    ctx.lineTo(366, 0);
    ctx.lineTo(372, 5);
    ctx.lineTo(378, 0);
    ctx.lineTo(384, 6);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 21px Arial, sans-serif';
    outlined(ctx, 'TOP DONATE', 400, 4, '#f2ec2a', '#141414', 3.5);
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px Arial, sans-serif';
    lines.forEach((s, i) => outlined(ctx, s, 488, 30 + i * 17, '#3ce03c', '#0a2a0a', 3));
  }

  function drawMonth(ctx, name) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Arial, sans-serif';
    outlined(ctx, 'Топ 5 Донатеров за Октябрь 1999', 812, 2, '#ecd84a', '#2a2208', 3);
    ctx.fillStyle = '#c8a030';
    ctx.fillRect(681, 6, 7, 6);
    ctx.fillRect(683, 12, 3, 5);
    ctx.fillRect(681, 17, 7, 2);
    ctx.font = 'bold 15px Arial, sans-serif';
    outlined(ctx, name, 812, 15, '#b6b4f0', '#20203a', 3);
  }

  function drawGoal(ctx) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 18px Arial, sans-serif';
    outlined(ctx, 'на хороший гуднайсовский', 760, 54, '#46d63c', '#0c2808', 3);
    outlined(ctx, 'вечерок', 760, 74, '#46d63c', '#0c2808', 3);
    const x0 = 560, x1 = 955, y0 = 100, y1 = 124, full = x0 + (x1 - x0) * 0.8933;
    const grad = ctx.createLinearGradient(0, y0, 0, y1);
    grad.addColorStop(0, '#d8d6ec');
    grad.addColorStop(1, '#8e8cae');
    ctx.fillStyle = grad;
    ctx.fillRect(x0, y0, full - x0, y1 - y0);
    ctx.fillStyle = '#eef6f8';
    ctx.fillRect(full, y0, x1 - full, y1 - y0);
    ctx.strokeStyle = '#4a4a62';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
    ctx.font = 'italic bold 10px Arial, sans-serif';
    ctx.fillStyle = '#26263a';
    ctx.fillText('52 161 RUB (89.33%)', (x0 + full) / 2, 107);
    ctx.font = 'italic bold 13px Arial, sans-serif';
    ctx.textAlign = 'left';
    outlined(ctx, '0', 564, 128, '#46d63c', '#0c2808', 3);
    ctx.textAlign = 'right';
    outlined(ctx, '58 390', 954, 128, '#46d63c', '#0c2808', 3);
  }

  function drawPrices(ctx) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    ctx.font = '13px Arial, sans-serif';
    outlined(ctx, 'караоке 200 р', 958, 460, '#f6f6f6', '#141414', 3);
    ctx.font = '23px Arial, sans-serif';
    outlined(ctx, 'Видеоклип 250р', 958, 476, '#5cb6f0', '#0c1c30', 3);
    ctx.font = '16px Arial, sans-serif';
    outlined(ctx, 'Музыка 55р', 958, 503, '#4ed6e6', '#0a2028', 3);
    ctx.font = '15px Arial, sans-serif';
    outlined(ctx, 'вери найс 1000р', 958, 523, '#f2e45a', '#2a2408', 3);
  }

  function drawer(st) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 960, h / 540);
      drawChat(ctx);
      drawToday(ctx, st.today);
      drawTop(ctx, st.top);
      drawMonth(ctx, st.month);
      drawGoal(ctx);
      drawPrices(ctx);
      ctx.restore();
    };
  }

  function mask(t) {
    if (t >= OPEN) return [];
    const open = TILES.filter(([t0]) => t >= t0).map(([, r]) => r);
    const xs = [0, 960], ys = [0, 540];
    open.forEach(([x0, y0, x1, y1]) => { xs.push(x0, x1); ys.push(y0, y1); });
    xs.sort((a, b) => a - b);
    ys.sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < xs.length - 1; i++) {
      for (let j = 0; j < ys.length - 1; j++) {
        const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
        if (xs[i + 1] - xs[i] < 0.5 || ys[j + 1] - ys[j] < 0.5) continue;
        const inside = open.some(([x0, y0, x1, y1]) => cx > x0 && cx < x1 && cy > y0 && cy < y1);
        if (!inside) out.push([xs[i], ys[j], xs[i + 1] - xs[i], ys[j + 1] - ys[j]]);
      }
    }
    return out;
  }

  window.NiceOverlay = { CHAT, state, stateKey, drawer, mask, OPEN };
})();
