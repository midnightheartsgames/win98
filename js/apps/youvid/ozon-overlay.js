(function () {
  const { PI, clamp } = window.YouVidKit;

  const GOAL_DONORS = [[0, 'Игорь Кубань - 34 500 RUB'], [2.6, 'AlexBob - 31 010 RUB'], [6.9, 'каратель фуфлыжников - 28 411 RUB'], [12.4, 'SUPPORT - 29 841 RUB']];
  const A_TOP = [[0, 'Веринайс - 8 770 RUB'], [30.4, 'Добрый Дэн - 7 100 RUB'], [32.8, 'шеях - 5 757 RUB'], [35.3, 'Test User - 5 650 RUB'], [37.8, 'Kirill K. - 5 600 RUB']];
  const A_TODAY = [[0, 'Хрюн - 26 RUB'], [33.6, 'Феличита - 26 RUB']];
  const A_BIG = [[0, 'Веник задонатил 453,00 RUB'], [34, 'Бублик задонатил 450,00 RUB']];
  const B_TOP = [[0, 'Клип - 7 972 RUB'], [69.5, 'Test User - 7 550 RUB'], [72.5, 'Добрый Дэн - 7 100 RUB'], [76.5, 'Клип - 7 972 RUB'], [79.2, 'Test User - 7 550 RUB'], [80.4, 'Добрый Дэн - 7 100 RUB'], [82.0, '420 - 6 994 RUB'], [85.2, 'шеях - 5 757 RUB'], [87.4, 'Kirill K. - 5 700 RUB'], [89.4, 'DyDkaPro - 4 765 RUB'], [93.0, 'шеях - 5 757 RUB'], [95.4, 'Kirill K. - 5 700 RUB'], [97.4, 'DyDkaPro - 4 765 RUB'], [99.5, 'Сашка Г. - 30 680 RUB'], [101.9, 'Патриарх - 24 493,78 RUB']];
  const B_MONTH = [[0, 'Слушатели шансона - 2 000 RUB'], [70, 'фан - 1 150 RUB'], [82, 'Кот - 1 050 RUB'], [87, 'Кабан - 1 000 RUB']];
  const B_TODAY = [[0, 'Яша - 50 RUB'], [74, 'Девочка-праздник - 2 USD'], [99, 'Сладкий бубалех - 50 RUB']];
  const B_ORDER = [[0, 'Заказал: Пифа'], [69.5, 'Заказал: Гозон']];
  const B_RUN = [[0, 'ДВОРЕЦКОВ - ЛУДОМАН'], [75.5, 'РЕДЖОВ - ПОЗОРИЩЕ'], [78, 'ДВОРЕЦКОВ - ЛУДОМАН'], [93.0, 'VJLink - Лудоман Топ'], [96.5, 'VJLink - Лудоман Топ']];
  const CAM_ALERT = [[0, 'Неизвестный задонатил 150,00 RUB'], [112.6, 'Караоке задонатил 200,00 RUB']];
  const CAM_TODAY = [[0, 'Налоговая - 400 RUB'], [106.4, 'MAZOXA - 400 RUB'], [109.2, 'SpYkeee - 300 RUB'], [111.6, 'Мазоха - 50 RUB'], [114.2, 'Dobro - 50 RUB']];
  const CHAT = [
    [100, 'Тихоня', 'врубите', '#6ac06a'],
    [101, 'BomBomBom', '★', '#e0c040'],
    [102, 'Александр У.', 'НЕ СМЕШНО', '#e06060'],
    [103, 'Алексей М.', 'Осуждаю', '#7aa0e8'],
    [104, 'Marco Polo', 'все отходняк пошел', '#c8c8c8'],
    [105, 'Andy B.', '-=ПОШЛО ТЕРПЕНИЕ=-', '#e06060'],
    [105.5, 'Focker', 'Ахахаххахахаа', '#7aa0e8'],
    [106.6, 'Роман Викторович', 'а в каком полку служил он?', '#c8c8c8'],
    [107.7, 'Андрей Д.', 'кукушку только не ставьте! весь кайф обламаете', '#6ac06a'],
    [108.9, 'Princess Lover', 'прости меня мазоха', '#e08ad8'],
    [110.0, 'Александр У.', 'МАЗОХА ДОВЁЛ', '#e06060'],
    [111.0, 'Baks', 'Хахахахаххаха', '#e0c040'],
    [111.9, 'ZA WARUDO', 'мазоха извинись', '#7aa0e8'],
    [112.8, 'BomBomBom', 'сам от себя затащился', '#e0c040'],
    [113.6, 'ПИУ ПИУ КАКИНС', '●●', '#6ac06a'],
    [114.4, 'Fan Fantasy', 'опять степан?', '#c8c8c8'],
    [115.2, 'Baks', 'П***ец ))) что происходит', '#e0c040']
  ];

  function pick(list, t) {
    let v = list[0][1];
    list.forEach(([t0, x]) => { if (t >= t0) v = x; });
    return v;
  }

  function outlined(ctx, text, x, y, fill, stroke, width) {
    ctx.lineJoin = 'round';
    if (width > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  function round(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function glowBar(ctx, x0, x1, y, h) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(20, 60, 160, 0.0)');
    g.addColorStop(0.45, 'rgba(70, 150, 255, 0.95)');
    g.addColorStop(0.55, 'rgba(210, 240, 255, 1)');
    g.addColorStop(1, 'rgba(20, 60, 160, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(x0, y, x1 - x0, h);
  }

  function crown(ctx, x, y, s) {
    ctx.fillStyle = '#f0c030';
    ctx.strokeStyle = '#7a4a10';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + s);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x + s * 0.3, y + s * 0.6);
    ctx.lineTo(x + s * 0.5, y);
    ctx.lineTo(x + s * 0.7, y + s * 0.6);
    ctx.lineTo(x + s, y + s * 0.3);
    ctx.lineTo(x + s, y + s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d02a2a';
    ctx.beginPath();
    ctx.arc(x + s * 0.5, y + s * 0.75, s * 0.12, 0, PI * 2);
    ctx.fill();
  }

  function goalOverlay(ctx, st) {
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#0a1a52';
    ctx.beginPath();
    ctx.moveTo(228, 0);
    ctx.lineTo(736, 0);
    ctx.lineTo(724, 13);
    ctx.lineTo(240, 13);
    ctx.closePath();
    ctx.fill();
    glowBar(ctx, 236, 728, 9, 6);
    ctx.textAlign = 'center';
    ctx.font = '12px Arial, sans-serif';
    outlined(ctx, 'РЕСПЕКТ ФАНАМ', 458, 11, '#7ae0c8', '#0a1a30', 2);
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px Arial, sans-serif';
    outlined(ctx, 'на пивко', 122, 18, '#c8e050', '#304010', 2.5);
    ctx.fillStyle = 'rgba(236, 238, 244, 0.85)';
    round(ctx, -10, 28, 336, 22, 11);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = '17px Arial, sans-serif';
    outlined(ctx, '0 RUB (0%)', 158, 46, '#2a2a30', '#ffffff', 0);
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'left';
    outlined(ctx, 'RUB', 4, 68, '#9ad040', '#1a2808', 2.5);
    ctx.textAlign = 'right';
    outlined(ctx, '999 RUB', 326, 68, '#9ad040', '#1a2808', 2.5);
    ctx.fillStyle = 'rgba(18, 18, 22, 0.75)';
    round(ctx, 899, 3, 58, 17, 8);
    ctx.fill();
    ctx.fillStyle = '#e02020';
    ctx.beginPath();
    ctx.arc(911, 11.5, 4.5, 0, PI * 2);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px Arial, sans-serif';
    outlined(ctx, 'LIVE', 919, 16, '#f4f4f4', '#000', 0);
    ctx.save();
    ctx.translate(0, 0);
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 31px Impact, "Arial Narrow", Arial, sans-serif';
    outlined(ctx, 'НА ОГРОМНЫЙ ТЕЛЕК 50ДЮЙМОВ -', 652, 80, '#5ad21e', '#0c2406', 4);
    outlined(ctx, 'ПОКУПАТЬ БУДУ  (ЧЕК ПОКАЖУ)', 655, 108, '#5ad21e', '#0c2406', 4);
    ctx.restore();
    ctx.fillStyle = '#f4f4f2';
    ctx.fillRect(352, 117, 600, 44);
    ctx.strokeStyle = '#3a3a40';
    ctx.lineWidth = 2;
    ctx.strokeRect(353, 118, 598, 42);
    ctx.fillStyle = '#3ac0d0';
    ctx.fillRect(354, 119, 4, 40);
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillText('240 RUB  (0.6%)', 654, 152);
    ctx.fillStyle = '#141414';
    ctx.fillText('240 RUB  (0.6%)', 652, 150);
    ctx.textAlign = 'left';
    ctx.font = 'italic bold 20px Impact, "Arial Narrow", Arial, sans-serif';
    outlined(ctx, '0', 354, 190, '#5ad21e', '#0c2406', 3);
    ctx.textAlign = 'right';
    outlined(ctx, '40 000', 954, 190, '#5ad21e', '#0c2406', 3);
    ctx.textAlign = 'left';
    ctx.font = 'bold 26px "Arial Black", Arial, sans-serif';
    outlined(ctx, 'TRIDCATIK', 372, 186, '#c890e8', '#2a0a3a', 4);
    ctx.font = '13px Arial, sans-serif';
    outlined(ctx, 'ЭТО НЕ ВОЗМОЖНО', 556, 177, '#f2f2f2', '#000', 0);
    ctx.font = '16px Arial, sans-serif';
    outlined(ctx, '«Дикий Каньон» прохожу по вечерам, заходите на трансляцию!', 302, 432, '#ffffff', 'rgba(0,0,0,0.6)', 2.5);
    ctx.font = '22px Arial, sans-serif';
    outlined(ctx, 'Если реально задонят,буду вести прямую трансляцию как я покупаю телек', 14, 470, '#ffffff', 'rgba(0,0,0,0.7)', 3);
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial Narrow, Arial, sans-serif';
    outlined(ctx, st.donor, 472, 498, '#4ab4f0', '#0a1830', 2.5);
    ctx.fillStyle = 'rgba(8, 24, 80, 0.85)';
    ctx.beginPath();
    ctx.moveTo(130, 540);
    ctx.lineTo(160, 507);
    ctx.lineTo(790, 507);
    ctx.lineTo(820, 540);
    ctx.closePath();
    ctx.fill();
    glowBar(ctx, 0, 960, 500, 10);
    glowBar(ctx, 0, 960, 524, 10);
    crown(ctx, 378, 506, 22);
    ctx.textAlign = 'left';
    ctx.font = 'bold italic 15px Impact, Arial, sans-serif';
    outlined(ctx, 'ТОП ДОНАТЕРЫ', 412, 524, '#d8e4f4', '#0a1030', 2.5);
  }

  function marquee(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${Math.round(h * 0.62)}px Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const msg = 'ты управляешь этим стримом!!!!!! ';
    let x = 0;
    while (x < w) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.strokeText(msg, x, h * 0.55);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(msg, x, h * 0.55);
      x += ctx.measureText(msg).width;
    }
  }

  function topBlock(ctx, line, month) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 19px Impact, "Arial Narrow", Arial, sans-serif';
    outlined(ctx, 'ТОПТ ДОНАТЕРЫ - 1999', 494, 20, '#dcef3a', '#0c1c06', 3.5);
    ctx.font = 'bold 15px Arial, sans-serif';
    outlined(ctx, line, 486, 41, '#d8d8e4', '#2a2a3a', 2.5);
    if (month) {
      ctx.font = '11px Arial, sans-serif';
      outlined(ctx, 'Донатеры За Октябрь', 287, 10, '#e8e8e8', '#202020', 2);
      ctx.font = 'bold 11px Arial, sans-serif';
      outlined(ctx, month, 290, 23, '#c8e050', '#202808', 2);
    }
  }

  function todayBlock(ctx, name, x) {
    ctx.textAlign = 'center';
    ctx.font = '16px Georgia, serif';
    outlined(ctx, 'Донаты за сегодня', x, 16, '#ece4c8', '#3a3020', 2.5);
    ctx.font = 'bold 15px Arial, sans-serif';
    outlined(ctx, name, x, 34, '#f08a30', '#3a1a08', 2.5);
  }

  function alertBar(ctx, text, x, y, w) {
    ctx.fillStyle = '#f39a30';
    round(ctx, x, y, w, 22, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x + 2, y + 2, w - 4, 6);
    ctx.textAlign = 'center';
    ctx.font = '8px Arial, sans-serif';
    outlined(ctx, text, x + w / 2, y + 14, '#ffffff', '#000', 0);
  }

  function pricesBlock(ctx, lines) {
    ctx.textAlign = 'right';
    lines.forEach(([text, size, col, y]) => {
      ctx.font = `bold ${size}px Arial, sans-serif`;
      outlined(ctx, text, 956, y, col, '#141414', 2.5);
    });
  }

  function yellowA(ctx, st) {
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.font = '7px Arial, sans-serif';
    outlined(ctx, 'Самые крупные отправители', 4, 7, '#ffffff', '#000', 1.5);
    alertBar(ctx, st.big, 4, 10, 190);
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px Arial, sans-serif';
    outlined(ctx, 'ВЕРИНАЙС - ГУДНАЙС ИТС', 88, 44, '#7ac83a', '#18280a', 2);
    outlined(ctx, 'БЕГГИНА', 88, 55, '#7ac83a', '#18280a', 2);
    ctx.strokeStyle = 'rgba(200, 40, 40, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(88, 92, 24, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(200, 50, 50, 0.4)';
    ctx.beginPath();
    ctx.moveTo(88, 92);
    ctx.arc(88, 92, 20, -PI / 2, -PI / 2 + 0.6);
    ctx.fill();
    ctx.font = '6px Arial, sans-serif';
    outlined(ctx, 'собрано 460 / 2000 RUB', 88, 124, '#e8e8e8', '#000', 1.5);
    topBlock(ctx, st.top, null);
    todayBlock(ctx, st.today, 822);
    ctx.font = 'bold 8px Arial, sans-serif';
    ctx.textAlign = 'left';
    outlined(ctx, 'ПОЕЗДКА В ГОРОД КАЗАНЬ + ОТЕЛЬ + ВИДЕО ОТЧЁТ', 714, 50, '#f2f2f2', '#202020', 2);
    ctx.fillStyle = 'rgba(60, 60, 90, 0.75)';
    ctx.fillRect(714, 56, 188, 19);
    ctx.fillStyle = '#3ac040';
    ctx.fillRect(714, 56, 30, 19);
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px Arial, sans-serif';
    outlined(ctx, '1 850 / 15 000 RUB', 808, 69, '#ffffff', '#000', 0);
    ctx.fillStyle = '#e04050';
    ctx.beginPath();
    ctx.arc(26, 495, 12, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('♪', 26, 500);
    ctx.fillStyle = '#1a1a1c';
    ctx.beginPath();
    ctx.arc(82, 520, 22, 0, PI * 2);
    ctx.fill();
    pricesBlock(ctx, [['Видеоклип 90руб', 14, '#d8e83a', 508], ['музыка 26руб', 14, '#d8e83a', 524], ['Донаты ,всё в описание стрима', 10, '#f2f2f2', 537]]);
  }

  function ringGoal(ctx, pct, x, y) {
    ctx.fillStyle = 'rgba(250, 236, 236, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8303a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, 31, 0, PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#7a1018';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, 31, -PI / 2, -PI / 2 + PI * 2 * pct / 100);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = 'bold 19px Arial, sans-serif';
    outlined(ctx, pct + '%', x, y + 7, '#c01a24', '#fff', 0);
    ctx.font = '6px Arial, sans-serif';
    outlined(ctx, `Собрано: ${pct === 20 ? '10470' : '10530'} / 50000 RUB`, x, y + 48, '#f0f0f0', '#000', 1.5);
  }

  function yellowB(ctx, st) {
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.font = '7px Arial, sans-serif';
    outlined(ctx, 'Самые крупные отправители', 4, 7, '#ffffff', '#000', 1.5);
    alertBar(ctx, 'Веник задонатил 453,00 RUB', 4, 10, 190);
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px Arial, sans-serif';
    outlined(ctx, 'DJ - FAN', 103, 57, '#f2f2f2', '#202020', 2.5);
    ringGoal(ctx, st.pct, 100, 103);
    topBlock(ctx, st.top, st.month);
    todayBlock(ctx, st.today, 836);
    ctx.textAlign = 'left';
    ctx.font = 'bold 10px Arial, sans-serif';
    outlined(ctx, 'НА НОВОГОДНИЙ СТРИМ 2000', 688, 49, '#f2f2f2', '#202020', 2);
    ctx.fillStyle = 'rgba(64, 40, 110, 0.85)';
    ctx.fillRect(688, 55, 268, 27);
    ctx.fillStyle = '#3ac040';
    ctx.fillRect(688, 55, 32, 27);
    ctx.font = 'bold 10px Arial, sans-serif';
    outlined(ctx, '47 %', 693, 72, '#e8ffe8', '#000', 0);
    outlined(ctx, 'ОСТАЛОСЬ 74 ДНЯ', 688, 95, '#f2f2f2', '#202020', 2);
    ctx.fillStyle = '#141416';
    ctx.beginPath();
    ctx.arc(52, 480, 26, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a2a2a';
    ctx.fillRect(44, 470, 16, 30);
    ctx.fillStyle = '#d8b090';
    ctx.beginPath();
    ctx.arc(52, 465, 7, 0, PI * 2);
    ctx.fill();
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'left';
    outlined(ctx, st.run, 272, 506, '#6a5ae0', '#10082a', 2.5);
    ctx.font = '14px Arial, sans-serif';
    outlined(ctx, st.order, 152, 535, '#f2f2f2', '#141414', 2.5);
    pricesBlock(ctx, [['музыка 30руб', 13, '#d8e83a', 500], ['видеоклип 100руб', 11, '#7ae070', 515], ['Донаты ,всё в описание стрима', 11, '#f2f2f2', 535]]);
  }

  function chatOverlay(ctx, st) {
    ctx.textBaseline = 'alphabetic';
    alertBar(ctx, st.alert, 22, 2, 256);
    ctx.fillStyle = '#3ac040';
    ctx.fillRect(754, 0, 206, 6);
    ctx.textAlign = 'left';
    ctx.font = 'bold 9px Arial, sans-serif';
    outlined(ctx, 'ОСТАЛОСЬ 5 ДНЕЙ', 754, 20, '#f2f2f2', '#202020', 2);
    const bar = (label, sum, of, y, pct) => {
      ctx.textAlign = 'left';
      ctx.font = 'bold 7px Arial, sans-serif';
      outlined(ctx, label, 779, y, '#f2f2f2', '#202020', 1.5);
      ctx.fillStyle = 'rgba(250, 250, 250, 0.92)';
      round(ctx, 779, y + 9, 200, 17, 8);
      ctx.fill();
      ctx.fillStyle = '#f39a30';
      round(ctx, 779, y + 9, Math.max(17, 200 * pct), 17, 8);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.font = '7px Arial, sans-serif';
      outlined(ctx, `Собрано ${sum} RUB из ${of} RUB`, 880, y + 21, '#202020', '#fff', 0);
    };
    bar('ДОНАТ КОШЕЛЬКОМ СПАСИБО', 290, 1000, 51, 0.29);
    bar('ОЗОНЫЧУ НА ГУДНАЙС', 650, 10000, 95, 0.065);
    ctx.textAlign = 'center';
    ctx.font = '15px Arial, sans-serif';
    outlined(ctx, 'Донаты за сегодня', 890, 146, '#7ac8f0', '#0a1830', 2.5);
    ctx.font = 'bold 14px Arial, sans-serif';
    outlined(ctx, st.today, 892, 164, '#f08a30', '#3a1a08', 2.5);
    ctx.textAlign = 'left';
    const lines = st.chat;
    let y = 540 - 4;
    for (let i = lines.length - 1; i >= 0 && y > 360; i--) {
      const [, nick, text, col] = lines[i];
      ctx.font = '13px Arial, sans-serif';
      const full = `${nick}: ${text}`;
      const words = full.split(' ');
      const rows = [];
      let cur = '';
      words.forEach(wd => {
        const next = cur ? cur + ' ' + wd : wd;
        if (ctx.measureText(next).width > 205 && cur) {
          rows.push(cur);
          cur = wd;
        } else cur = next;
      });
      rows.push(cur);
      for (let k = rows.length - 1; k >= 0; k--) {
        if (k === 0) {
          ctx.fillStyle = col;
          ctx.fillRect(752, y - 8, 6, 6);
        }
        outlined(ctx, rows[k], 761, y, '#f4f4f4', 'rgba(0,0,0,0.85)', 2.5);
        y -= 15.5;
      }
    }
  }

  function recOverlay(ctx, st) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    const m = 24, L = 34;
    [[m, m, 1, 1], [960 - m, m, -1, 1], [m, 540 - m, 1, -1], [960 - m, 540 - m, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * L);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * L, y);
      ctx.stroke();
    });
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(480 - 18, 270);
    ctx.lineTo(480 + 18, 270);
    ctx.moveTo(480, 270 - 18);
    ctx.lineTo(480, 270 + 18);
    ctx.stroke();
    ctx.font = '18px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('REC', 900, 40);
    if (st.dot) {
      ctx.fillStyle = '#ff1a1a';
      ctx.beginPath();
      ctx.arc(918, 40, 7, 0, PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 494, 26, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(62, 497, 3, 6);
    for (let i = 0; i < 3; i++) ctx.fillRect(40 + i * 7, 497, 5, 6);
  }

  function state(kind, t) {
    if (kind === 'goal') return { kind, donor: pick(GOAL_DONORS, t) };
    if (kind === 'yellowA') return { kind, top: pick(A_TOP, t), today: pick(A_TODAY, t), big: pick(A_BIG, t) };
    if (kind === 'yellowB') return { kind, top: pick(B_TOP, t), month: pick(B_MONTH, t), today: pick(B_TODAY, t), order: pick(B_ORDER, t), run: pick(B_RUN, t), pct: t >= 93.06 ? 21 : 20 };
    if (kind === 'chat') {
      const chat = CHAT.filter(([t0]) => t >= t0);
      return { kind, alert: pick(CAM_ALERT, t), today: pick(CAM_TODAY, t), chat, n: chat.length };
    }
    if (kind === 'rec') return { kind, dot: (t % 1) < 0.62 };
    return null;
  }

  function stateKey(st) {
    if (!st) return '';
    if (st.kind === 'goal') return 'goal|' + st.donor;
    if (st.kind === 'yellowA') return ['A', st.top, st.today, st.big].join('|');
    if (st.kind === 'yellowB') return ['B', st.top, st.month, st.today, st.order, st.run, st.pct].join('|');
    if (st.kind === 'chat') return ['C', st.alert, st.today, st.n].join('|');
    if (st.kind === 'rec') return 'rec|' + st.dot;
    return '';
  }

  function drawer(st) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 960, h / 540);
      if (st.kind === 'goal') goalOverlay(ctx, st);
      else if (st.kind === 'yellowA') yellowA(ctx, st);
      else if (st.kind === 'yellowB') yellowB(ctx, st);
      else if (st.kind === 'chat') chatOverlay(ctx, st);
      else if (st.kind === 'rec') recOverlay(ctx, st);
      ctx.restore();
    };
  }

  const MARQUEE = { x: 330, y: 18, w: 274, h: 16, speed: 0.09 };

  function marqueeShift(t) {
    return clamp(t, 0, 1e6) * MARQUEE.speed;
  }

  window.OzonOverlay = { state, stateKey, drawer, marquee, MARQUEE, marqueeShift, CHAT };
})();
