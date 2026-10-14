class MultSite {
  constructor() {
    this.baseUrl = 'http://www.mult98.ru';
    this.guestbookKey = 'win98_mult_guestbook_v2';
    this.legacyGuestbookKey = 'win98_mult_guestbook_v1';
    this.siteDay = '28.11.1998';
    this.currentEpisodeId = 'modem';
    this.isPlaying = false;
    this.animTimer = null;
    this.flapTimer = null;
    this.frameIndex = 0;
    this.audioContext = null;
    this.colors = {
      ink: '#000000', skin: '#f7ddb8', red: '#e8231b', blue: '#2b4fd8', white: '#ffffff',
      gray: '#8c8c8c', suit: '#5a5a66', floor: '#c8a878', wall: '#f4ecd0', night: '#1c2450'
    };
  }

  esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  gif(name, scale = 1) {
    return window.webGif ? window.webGif(name, scale) : '';
  }

  parseUrl(url) {
    const rest = String(url || '').replace(/^[a-z]+:\/{2}[^\/?#]*/i, '');
    const path = (rest.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';
    const query = rest.includes('?') ? rest.split('?')[1].split('#')[0] : '';
    return { path: path.toLowerCase(), params: new URLSearchParams(query) };
  }

  link(path, label, cls = '') {
    return `<a${cls ? ` class="${cls}"` : ''} data-url="${this.baseUrl}${path}">${label}</a>`;
  }

  getCast() {
    return {
      mas: { name: 'Масяня', pitch: 1.9, rate: 1.5, tone: 620 },
      hru: { name: 'Хрюндель', pitch: 1.2, rate: 1.4, tone: 330 },
      boss: { name: 'Начальник', pitch: 0.7, rate: 1.1, tone: 180 },
      seller: { name: 'Продавец', pitch: 0.9, rate: 1.3, tone: 240 },
      modem: { name: 'Модем', pitch: 2, rate: 2, tone: 1200 }
    };
  }

  getEpisodes() {
    return [
      {
        id: 'modem', num: 1, title: 'Модем', date: '02.11.1998', duration: '0:38',
        desc: 'Три часа ночи, самое время выйти в интернет. Модем с этим согласен, остальные жильцы нет.',
        frames: [
          { bg: 'night', props: ['desk', 'monitor', 'modem'], chars: [{ who: 'mas', x: 0.42, pose: 'sit' }], who: 'mas', text: 'Так. Три часа ночи. Самое время в интернет.' },
          { bg: 'night', props: ['desk', 'monitor', 'modem', 'noise'], chars: [{ who: 'mas', x: 0.42, pose: 'sit' }], who: 'modem', text: 'ПИ-И-И-И-И... ШШШШ... ДЗЫНЬ-ДЗЫНЬ!' },
          { bg: 'night', props: ['desk', 'monitor', 'modem', 'door'], chars: [{ who: 'mas', x: 0.42, pose: 'sit' }, { who: 'hru', x: 0.85, pose: 'stand' }], who: 'hru', text: 'Масяня, у тебя чайник свистит или ты опять в интернете?' },
          { bg: 'night', props: ['desk', 'monitor', 'modem', 'door'], chars: [{ who: 'mas', x: 0.42, pose: 'wave' }, { who: 'hru', x: 0.85, pose: 'stand' }], who: 'mas', text: 'Это не чайник, это двадцать восемь восемьсот. Иди спи.' },
          { bg: 'night', props: ['desk', 'monitor-error', 'modem'], chars: [{ who: 'mas', x: 0.42, pose: 'facepalm' }], who: 'mas', text: 'Ну вот. Связь оборвалась. Мама трубку сняла.' }
        ]
      },
      {
        id: 'office', num: 2, title: 'Понедельник', date: '09.11.1998', duration: '0:41',
        desc: 'Хрюндель раскладывает пасьянс, начальник ищет отчёт за ноябрь. Масяня находит обоим занятие.',
        frames: [
          { bg: 'office', props: ['desk', 'monitor-cards'], chars: [{ who: 'hru', x: 0.4, pose: 'sit' }], who: 'hru', text: 'Пасьянс сошёлся. Можно домой.' },
          { bg: 'office', props: ['desk', 'monitor-cards'], chars: [{ who: 'hru', x: 0.4, pose: 'sit' }, { who: 'boss', x: 0.8, pose: 'point' }], who: 'boss', text: 'Где отчёт за ноябрь?' },
          { bg: 'office', props: ['desk', 'monitor-cards'], chars: [{ who: 'hru', x: 0.4, pose: 'sit' }, { who: 'mas', x: 0.15, pose: 'wave' }, { who: 'boss', x: 0.8, pose: 'stand' }], who: 'mas', text: 'Отчёт в компьютере. Компьютер думает.' },
          { bg: 'office', props: ['desk', 'monitor-cards'], chars: [{ who: 'boss', x: 0.5, pose: 'sit' }], who: 'boss', text: 'А это что, водопад из карт? Ну-ка, ну-ка...' },
          { bg: 'office', props: ['desk', 'monitor-cards'], chars: [{ who: 'boss', x: 0.5, pose: 'sit' }, { who: 'mas', x: 0.12, pose: 'walk' }, { who: 'hru', x: 0.25, pose: 'walk' }], who: 'mas', text: 'Всё, начальник при деле. Пошли пить чай.' }
        ]
      },
      {
        id: 'market', num: 3, title: 'Радиорынок', date: '16.11.1998', duration: '0:45',
        desc: 'Масяня и Хрюндель идут за шлейфом для второго винчестера. Продавец предлагает тысячу игр на одном диске.',
        frames: [
          { bg: 'market', props: ['stall', 'snow'], chars: [{ who: 'seller', x: 0.7, pose: 'point' }, { who: 'mas', x: 0.3, pose: 'stand' }], who: 'seller', text: 'Девушка, берите диск! Тысяча игр, всё на русском!' },
          { bg: 'market', props: ['stall', 'snow'], chars: [{ who: 'seller', x: 0.7, pose: 'stand' }, { who: 'mas', x: 0.3, pose: 'wave' }], who: 'mas', text: 'А почему игр тысяча, а коробка одна?' },
          { bg: 'market', props: ['stall', 'snow'], chars: [{ who: 'seller', x: 0.7, pose: 'point' }, { who: 'mas', x: 0.3, pose: 'stand' }], who: 'seller', text: 'Сжатые! Новые технологии!' },
          { bg: 'market', props: ['stall', 'snow'], chars: [{ who: 'seller', x: 0.7, pose: 'stand' }, { who: 'mas', x: 0.3, pose: 'stand' }, { who: 'hru', x: 0.12, pose: 'wave' }], who: 'hru', text: 'Масяня, нам шлейф нужен, а не игры.' },
          { bg: 'market', props: ['stall', 'snow'], chars: [{ who: 'seller', x: 0.7, pose: 'wave' }, { who: 'mas', x: 0.3, pose: 'wave' }, { who: 'hru', x: 0.12, pose: 'facepalm' }], who: 'mas', text: 'Шлейф скучный. Берём диск, шлейф потом.' }
        ]
      },
      {
        id: 'y2k', num: 4, title: 'Проблема 2000', date: '23.11.1998', duration: '0:44',
        desc: 'В газете пишут, что в 2000 году компьютеры сойдут с ума. Масяня считает, что бояться ей уже нечего.',
        frames: [
          { bg: 'kitchen', props: ['table', 'paper', 'mugs'], chars: [{ who: 'hru', x: 0.65, pose: 'read' }, { who: 'mas', x: 0.3, pose: 'sit' }], who: 'hru', text: 'Пишут, что в двухтысячном все компьютеры сойдут с ума.' },
          { bg: 'kitchen', props: ['table', 'paper', 'mugs'], chars: [{ who: 'hru', x: 0.65, pose: 'read' }, { who: 'mas', x: 0.3, pose: 'wave' }], who: 'mas', text: 'Мой сошёл с ума ещё весной. Никто не заметил.' },
          { bg: 'kitchen', props: ['table', 'paper', 'mugs'], chars: [{ who: 'hru', x: 0.65, pose: 'point' }, { who: 'mas', x: 0.3, pose: 'sit' }], who: 'hru', text: 'А лифты? А банки?' },
          { bg: 'kitchen', props: ['table', 'mugs'], chars: [{ who: 'hru', x: 0.65, pose: 'sit' }, { who: 'mas', x: 0.3, pose: 'wave' }], who: 'mas', text: 'Лифт у нас и так стоит. Банк лопнул в августе. Нам бояться нечего.' },
          { bg: 'kitchen', props: ['table', 'mugs'], chars: [{ who: 'hru', x: 0.65, pose: 'cheers' }, { who: 'mas', x: 0.3, pose: 'cheers' }], who: 'hru', text: 'Ну, тогда с наступающим!' }
        ]
      }
    ];
  }

  getSeedBook() {
    return [
      { name: 'Лёха_Питер', date: '27.11.1998', text: 'Серия про двухтысячный самая жизненная. Банк лопнул, лифт стоит, всё про нас.' },
      { name: 'DJ_Hrundel', date: '25.11.1998', text: 'Звук модема в первой серии один в один как мой Sportster. Сосед думал, что у меня пожарная тревога.' },
      { name: 'Света_СПб', date: '20.11.1998', text: 'Рисуйте ещё! Пересылаем ссылку всем по ICQ, у нас на работе смотрят в обед.' },
      { name: 'Начальник_отдела', date: '18.11.1998', text: 'Пасьянс у меня тоже сошёлся. Отчёт сдам завтра.' },
      { name: 'Ромка', date: '14.11.1998', text: 'Скачивается долго, 2 минуты на 33600. Но оно того стоит.' }
    ];
  }

  getUserBook() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.guestbookKey);
        if (raw) {
          const list = JSON.parse(raw);
          return Array.isArray(list) ? list : [];
        }
        const legacy = localStorage.getItem(this.legacyGuestbookKey);
        if (legacy) {
          const old = JSON.parse(legacy);
          const seedNames = ['Лёха_Питер', 'DJ_Hrundel', 'Света_СПб'];
          const mine = Array.isArray(old) ? old.filter(e => e && e.text && !seedNames.includes(e.name)).map(e => ({ name: String(e.name || 'Аноним'), date: this.siteDay, text: String(e.text) })) : [];
          localStorage.setItem(this.guestbookKey, JSON.stringify(mine));
          localStorage.removeItem(this.legacyGuestbookKey);
          return mine;
        }
      }
    } catch (e) {}
    return [];
  }

  getGuestbook() {
    return this.getUserBook().concat(this.getSeedBook());
  }

  addGuestbookEntry(name, text) {
    const clean = String(text || '').trim().slice(0, 500);
    const list = this.getUserBook();
    if (clean) list.unshift({ name: String(name || '').trim().slice(0, 30) || 'Аноним', date: this.siteDay, text: clean });
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(this.guestbookKey, JSON.stringify(list.slice(0, 60)));
    } catch (e) {}
    return list.concat(this.getSeedBook());
  }

  drawBackground(ctx, w, h, bg) {
    const c = this.colors;
    const floorY = h * 0.78;
    ctx.lineWidth = 2;
    ctx.strokeStyle = c.ink;
    if (bg === 'market') {
      ctx.fillStyle = '#b8c8d8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();
      return;
    }
    if (bg === 'night') {
      ctx.fillStyle = '#d8d0b0';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = c.night;
      ctx.fillRect(w * 0.06, h * 0.12, w * 0.2, h * 0.32);
      ctx.strokeRect(w * 0.06, h * 0.12, w * 0.2, h * 0.32);
      ctx.beginPath(); ctx.moveTo(w * 0.16, h * 0.12); ctx.lineTo(w * 0.16, h * 0.44); ctx.stroke();
      ctx.fillStyle = '#fff6a0';
      ctx.beginPath(); ctx.arc(w * 0.21, h * 0.2, h * 0.035, 0, Math.PI * 2); ctx.fill();
    } else if (bg === 'office') {
      ctx.fillStyle = '#d8e0e8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w * 0.62, h * 0.1, w * 0.14, h * 0.2);
      ctx.strokeRect(w * 0.62, h * 0.1, w * 0.14, h * 0.2);
      ctx.fillStyle = c.ink;
      ctx.font = `bold ${Math.round(h * 0.035)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('ПЛАН', w * 0.69, h * 0.17);
      ctx.beginPath(); ctx.moveTo(w * 0.64, h * 0.27); ctx.lineTo(w * 0.67, h * 0.22); ctx.lineTo(w * 0.7, h * 0.25); ctx.lineTo(w * 0.74, h * 0.19); ctx.stroke();
    } else {
      ctx.fillStyle = c.wall;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#a8d0f0';
      ctx.fillRect(w * 0.4, h * 0.08, w * 0.2, h * 0.28);
      ctx.strokeRect(w * 0.4, h * 0.08, w * 0.2, h * 0.28);
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.08); ctx.lineTo(w * 0.5, h * 0.36); ctx.stroke();
    }
    ctx.fillStyle = c.floor;
    ctx.fillRect(0, floorY, w, h - floorY);
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();
  }

  drawProps(ctx, w, h, props, tick) {
    const c = this.colors;
    const floorY = h * 0.78;
    const box = (x, y, bw, bh, fill) => { ctx.fillStyle = fill; ctx.fillRect(x, y, bw, bh); ctx.strokeRect(x, y, bw, bh); };
    ctx.lineWidth = 2;
    ctx.strokeStyle = c.ink;
    props.forEach(p => {
      if (p === 'desk') {
        box(w * 0.3, floorY - h * 0.2, w * 0.4, h * 0.04, '#a07040');
        box(w * 0.33, floorY - h * 0.16, w * 0.02, h * 0.16, '#a07040');
        box(w * 0.65, floorY - h * 0.16, w * 0.02, h * 0.16, '#a07040');
      } else if (p.startsWith('monitor')) {
        const mx = w * 0.5, my = floorY - h * 0.2;
        box(mx, my - h * 0.2, w * 0.15, h * 0.2, '#e8e0c8');
        box(mx + w * 0.012, my - h * 0.185, w * 0.126, h * 0.13, p === 'monitor-error' ? '#000080' : '#008080');
        if (p === 'monitor-cards') {
          for (let i = 0; i < 4; i++) box(mx + w * (0.02 + i * 0.026), my - h * (0.17 - ((i + tick) % 3) * 0.02), w * 0.02, h * 0.05, '#ffffff');
        }
        if (p === 'monitor-error') {
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(h * 0.028)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText('НЕТ СВЯЗИ', mx + w * 0.075, my - h * 0.11);
        }
      } else if (p === 'modem') {
        box(w * 0.36, floorY - h * 0.25, w * 0.1, h * 0.05, '#e8e8e8');
        ctx.fillStyle = tick % 2 ? '#00cc00' : '#004400';
        ctx.fillRect(w * 0.38, floorY - h * 0.23, w * 0.01, h * 0.012);
        ctx.fillStyle = tick % 2 ? '#cc0000' : '#ff3333';
        ctx.fillRect(w * 0.41, floorY - h * 0.23, w * 0.01, h * 0.012);
      } else if (p === 'noise') {
        for (let i = 0; i < 3; i++) {
          const r = h * (0.05 + i * 0.04 + (tick % 2) * 0.015);
          ctx.beginPath();
          ctx.arc(w * 0.41, floorY - h * 0.26, r, -Math.PI * 0.85, -Math.PI * 0.15);
          ctx.stroke();
        }
      } else if (p === 'door') {
        box(w * 0.92, h * 0.2, w * 0.08, floorY - h * 0.2, '#c09060');
      } else if (p === 'table') {
        box(w * 0.2, floorY - h * 0.18, w * 0.6, h * 0.04, '#ffffff');
        box(w * 0.24, floorY - h * 0.14, w * 0.02, h * 0.14, '#a07040');
        box(w * 0.74, floorY - h * 0.14, w * 0.02, h * 0.14, '#a07040');
      } else if (p === 'mugs') {
        box(w * 0.42, floorY - h * 0.24, w * 0.035, h * 0.06, c.red);
        box(w * 0.53, floorY - h * 0.24, w * 0.035, h * 0.06, c.blue);
      } else if (p === 'paper') {
        box(w * 0.58, h * 0.36, w * 0.14, h * 0.2, '#f0f0f0');
        ctx.fillStyle = c.ink;
        ctx.font = `bold ${Math.round(h * 0.03)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('2000!', w * 0.65, h * 0.42);
      } else if (p === 'stall') {
        box(w * 0.55, h * 0.3, w * 0.4, floorY - h * 0.3 - h * 0.1, '#e8e8e8');
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = i % 2 ? c.red : '#ffffff';
          ctx.fillRect(w * (0.55 + i * 0.05), h * 0.22, w * 0.05, h * 0.08);
        }
        ctx.strokeRect(w * 0.55, h * 0.22, w * 0.4, h * 0.08);
        for (let i = 0; i < 6; i++) box(w * (0.57 + i * 0.06), h * 0.36, w * 0.045, h * 0.06, i % 2 ? '#c0c0ff' : '#ffffc0');
      } else if (p === 'snow') {
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 30; i++) {
          const sx = ((i * 97 + tick * 7) % 100) / 100 * w;
          const sy = ((i * 53 + tick * 11) % 70) / 100 * h;
          ctx.fillRect(sx, sy, 3, 3);
        }
      }
    });
  }

  drawCharacter(ctx, w, h, ch, talking, tick) {
    const c = this.colors;
    const floorY = h * 0.78;
    const s = h / 300;
    const tall = ch.who === 'hru' ? 1.15 : ch.who === 'boss' ? 1.1 : 1;
    const x = ch.x * w;
    const seated = ch.pose === 'sit' || ch.pose === 'read';
    const groundY = floorY - (seated ? 22 * s : 0);
    const legLen = (seated ? 20 : 38) * s * tall;
    const bodyH = 62 * s * tall;
    const bodyW = 30 * s;
    const hipY = groundY - legLen;
    const bodyTop = hipY - bodyH * 0.85;
    const headR = 34 * s;
    const headY = bodyTop - headR * 0.6;
    const walk = ch.pose === 'walk' ? (tick % 2 ? 1 : -1) : 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = c.ink;
    ctx.lineCap = 'round';

    const legColor = ch.who === 'hru' ? c.blue : ch.who === 'boss' || ch.who === 'seller' ? c.suit : c.ink;
    ctx.strokeStyle = legColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, hipY); ctx.lineTo(x - (8 + walk * 6) * s, groundY);
    ctx.moveTo(x + 6 * s, hipY); ctx.lineTo(x + (8 + walk * 6) * s, groundY);
    ctx.stroke();
    ctx.fillStyle = c.ink;
    ctx.fillRect(x - (14 + walk * 6) * s, groundY - 3 * s, 9 * s, 4 * s);
    ctx.fillRect(x + (6 + walk * 6) * s, groundY - 3 * s, 9 * s, 4 * s);
    ctx.lineWidth = 2;
    ctx.strokeStyle = c.ink;

    const bodyFill = { mas: c.red, hru: c.blue, boss: c.suit, seller: '#6a4a2a' }[ch.who] || c.gray;
    ctx.fillStyle = bodyFill;
    ctx.beginPath();
    ctx.ellipse(x, bodyTop + bodyH / 2, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    if (ch.who === 'mas') {
      ctx.fillStyle = c.blue;
      ctx.beginPath();
      ctx.moveTo(x - bodyW * 0.48, bodyTop + bodyH * 0.62);
      ctx.lineTo(x + bodyW * 0.48, bodyTop + bodyH * 0.62);
      ctx.lineTo(x + bodyW * 0.7, bodyTop + bodyH * 0.98);
      ctx.lineTo(x - bodyW * 0.7, bodyTop + bodyH * 0.98);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (ch.who === 'hru') {
      ctx.beginPath();
      ctx.moveTo(x - bodyW * 0.25, bodyTop + 4 * s); ctx.lineTo(x - bodyW * 0.2, bodyTop + bodyH * 0.4);
      ctx.moveTo(x + bodyW * 0.25, bodyTop + 4 * s); ctx.lineTo(x + bodyW * 0.2, bodyTop + bodyH * 0.4);
      ctx.stroke();
      ctx.fillStyle = '#ffd040';
      ctx.fillRect(x - bodyW * 0.24, bodyTop + bodyH * 0.38, 4 * s, 4 * s);
      ctx.fillRect(x + bodyW * 0.16, bodyTop + bodyH * 0.38, 4 * s, 4 * s);
    } else if (ch.who === 'boss') {
      ctx.fillStyle = c.red;
      ctx.beginPath();
      ctx.moveTo(x, bodyTop + 3 * s); ctx.lineTo(x - 4 * s, bodyTop + bodyH * 0.45); ctx.lineTo(x, bodyTop + bodyH * 0.55); ctx.lineTo(x + 4 * s, bodyTop + bodyH * 0.45);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    const shoulderY = bodyTop + bodyH * 0.22;
    const arm = (side, ex, ey) => { ctx.beginPath(); ctx.moveTo(x + side * bodyW * 0.42, shoulderY); ctx.lineTo(ex, ey); ctx.stroke(); };
    const flip = tick % 2 ? 1 : 0;
    ctx.lineWidth = 2.5;
    if (ch.pose === 'wave') {
      arm(-1, x - 26 * s, shoulderY + 30 * s);
      arm(1, x + 30 * s, shoulderY - (22 + flip * 8) * s);
    } else if (ch.pose === 'point') {
      arm(-1, x - 24 * s, shoulderY + 32 * s);
      arm(1, x + 44 * s, shoulderY - 4 * s);
    } else if (ch.pose === 'facepalm') {
      arm(-1, x - 24 * s, shoulderY + 32 * s);
      arm(1, x + 6 * s, headY + 4 * s);
    } else if (ch.pose === 'cheers') {
      arm(-1, x - 24 * s, shoulderY + 32 * s);
      arm(1, x + 28 * s, shoulderY - 28 * s);
      ctx.fillStyle = ch.who === 'mas' ? c.red : c.blue;
      ctx.fillRect(x + 24 * s, shoulderY - 42 * s, 10 * s, 14 * s);
      ctx.strokeRect(x + 24 * s, shoulderY - 42 * s, 10 * s, 14 * s);
    } else if (ch.pose === 'read') {
      arm(-1, x - 20 * s, shoulderY + 14 * s);
      arm(1, x + 20 * s, shoulderY + 14 * s);
    } else if (ch.pose === 'sit') {
      arm(-1, x - 18 * s, shoulderY + 26 * s);
      arm(1, x + 26 * s, shoulderY + (18 - flip * 3) * s);
    } else {
      arm(-1, x - 24 * s, shoulderY + 32 * s);
      arm(1, x + 24 * s, shoulderY + 32 * s);
    }
    ctx.lineWidth = 2;

    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.ellipse(x, headY, headR, headR * 0.8, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    if (ch.who === 'seller') {
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x - headR * 0.9, headY - headR * 1.05, headR * 1.8, headR * 0.5);
      ctx.strokeRect(x - headR * 0.9, headY - headR * 1.05, headR * 1.8, headR * 0.5);
      ctx.fillRect(x - headR * 1.05, headY - headR * 0.6, headR * 0.3, headR * 0.6);
      ctx.fillRect(x + headR * 0.75, headY - headR * 0.6, headR * 0.3, headR * 0.6);
    } else if (ch.who === 'boss') {
      ctx.beginPath();
      ctx.moveTo(x - headR * 0.7, headY - headR * 0.55);
      ctx.quadraticCurveTo(x, headY - headR * 1.0, x + headR * 0.7, headY - headR * 0.55);
      ctx.stroke();
    } else {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const hx = x - headR * 0.35 + i * headR * 0.14;
        ctx.moveTo(hx, headY - headR * 0.78);
        ctx.quadraticCurveTo(hx + (i - 2.5) * 2 * s, headY - headR * 1.15, hx + (i - 2.5) * 4 * s, headY - headR * 1.25);
      }
      ctx.stroke();
    }

    const look = ch.x > 0.5 ? -1 : 1;
    const eyeY = headY - headR * 0.15;
    [-1, 1].forEach(side => {
      const ex = x + side * headR * 0.28;
      ctx.fillStyle = c.white;
      ctx.beginPath(); ctx.ellipse(ex, eyeY, headR * 0.22, headR * 0.26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = c.ink;
      ctx.beginPath(); ctx.arc(ex + look * headR * 0.09, eyeY + headR * 0.05, headR * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ex - headR * 0.22, eyeY - headR * 0.04); ctx.lineTo(ex + headR * 0.22, eyeY - headR * 0.04); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex - headR * 0.2, eyeY - headR * (0.62 + (talking && flip ? 0.08 : 0)));
      ctx.quadraticCurveTo(ex, eyeY - headR * (0.75 + (talking && flip ? 0.08 : 0)), ex + headR * 0.2, eyeY - headR * (0.62 + (talking && flip ? 0.08 : 0)));
      ctx.stroke();
    });

    const mouthY = headY + headR * 0.35;
    ctx.beginPath();
    if (talking && flip) {
      ctx.fillStyle = '#7a1010';
      ctx.moveTo(x - headR * 0.7, mouthY - headR * 0.05);
      ctx.quadraticCurveTo(x, mouthY + headR * 0.5, x + headR * 0.7, mouthY - headR * 0.05);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.moveTo(x - headR * 0.72, mouthY - headR * 0.08);
      ctx.quadraticCurveTo(x, mouthY + headR * 0.2, x + headR * 0.72, mouthY - headR * 0.08);
      ctx.stroke();
    }
  }

  wrap(ctx, text, maxW) {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  drawBubble(ctx, w, h, frame) {
    if (!frame.text) return;
    const c = this.colors;
    const speaker = frame.chars.find(ch => ch.who === frame.who);
    const size = Math.max(10, Math.round(h * 0.05));
    ctx.font = `bold ${size}px Arial`;
    const lines = this.wrap(ctx, frame.text, w * 0.4);
    const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + size * 1.2;
    const bh = lines.length * size * 1.25 + size * 0.8;
    const anchorX = speaker ? speaker.x * w : w * 0.41;
    const gap = h * 0.13;
    const toLeft = speaker ? speaker.x > 0.5 : false;
    let bx = toLeft ? anchorX - gap - bw : anchorX + gap;
    bx = Math.max(6, Math.min(w - bw - 6, bx));
    const by = h * 0.04;
    const tailX = toLeft ? bx + bw - 10 : bx + 10;
    ctx.fillStyle = frame.who === 'modem' ? '#ffff80' : c.white;
    ctx.strokeStyle = c.ink;
    ctx.lineWidth = 2;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);
    ctx.beginPath();
    ctx.moveTo(tailX - 7, by + bh);
    ctx.lineTo(anchorX + (toLeft ? -gap * 0.55 : gap * 0.55), by + bh + h * 0.09);
    ctx.lineTo(tailX + 7, by + bh);
    ctx.fill(); ctx.stroke();
    ctx.fillRect(tailX - 6, by + bh - 2, 12, 3);
    ctx.fillStyle = c.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, bx + size * 0.6, by + size * 0.4 + i * size * 1.25));
    ctx.textBaseline = 'alphabetic';
  }

  drawFrame(canvas, ep, frameIdx, tick = 0, talking = false) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const frame = ep.frames[frameIdx % ep.frames.length];
    this.drawBackground(ctx, w, h, frame.bg);
    this.drawProps(ctx, w, h, frame.props.filter(p => p !== 'snow'), tick);
    frame.chars.forEach(ch => this.drawCharacter(ctx, w, h, ch, talking && ch.who === frame.who, tick));
    if (frame.props.includes('snow')) this.drawProps(ctx, w, h, ['snow'], tick);
    this.drawBubble(ctx, w, h, frame);
    ctx.strokeStyle = this.colors.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
  }

  initAudio() {
    const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!this.audioContext && Ctx) this.audioContext = new Ctx();
    if (this.audioContext && this.audioContext.state === 'suspended') this.audioContext.resume();
  }

  playBeepTone(freq, duration = 0.15) {
    this.initAudio();
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  speakLine(who, text) {
    const voice = this.getCast()[who] || this.getCast().mas;
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const Utter = typeof window !== 'undefined' ? window.SpeechSynthesisUtterance : null;
    if (synth && Utter) {
      try {
        synth.cancel();
        const u = new Utter(text);
        u.lang = 'ru-RU';
        u.pitch = voice.pitch;
        u.rate = voice.rate;
        const ru = synth.getVoices().find(v => /^ru/i.test(v.lang));
        if (ru) u.voice = ru;
        synth.speak(u);
        return true;
      } catch (e) {}
    }
    this.playBeepTone(voice.tone, 0.25);
    return false;
  }

  stopAnimation() {
    if (this.animTimer) clearTimeout(this.animTimer);
    if (this.flapTimer) clearInterval(this.flapTimer);
    this.animTimer = null;
    this.flapTimer = null;
    this.isPlaying = false;
  }

  frameTime(frame) {
    return 1400 + String(frame.text || '').length * 60;
  }

  startAnimation(canvas, ep, statusEl, btnPlay) {
    if (this.isPlaying) {
      this.stopAnimation();
      if (btnPlay) btnPlay.textContent = 'Смотреть';
      if (statusEl) statusEl.textContent = 'Пауза.';
      return;
    }
    this.isPlaying = true;
    if (btnPlay) btnPlay.textContent = 'Пауза';
    if (this.frameIndex >= ep.frames.length) this.frameIndex = 0;
    const cast = this.getCast();
    const showFrame = () => {
      const frame = ep.frames[this.frameIndex];
      let tick = 0;
      let syll = 0;
      const total = Math.max(2, Math.round(String(frame.text).length / 3));
      if (statusEl) statusEl.textContent = `Кадр ${this.frameIndex + 1} из ${ep.frames.length}`;
      if (this.flapTimer) clearInterval(this.flapTimer);
      this.drawFrame(canvas, ep, this.frameIndex, 0, true);
      this.flapTimer = setInterval(() => {
        tick++;
        const talking = syll < total;
        this.drawFrame(canvas, ep, this.frameIndex, tick, talking);
        if (talking) {
          const base = (cast[frame.who] || cast.mas).tone;
          this.playBeepTone(base + ((tick * 37) % 5) * base * 0.08, 0.06);
          syll++;
        }
      }, 160);
      this.animTimer = setTimeout(() => {
        this.frameIndex++;
        if (this.frameIndex >= ep.frames.length) {
          this.stopAnimation();
          this.frameIndex = 0;
          this.drawFrame(canvas, ep, ep.frames.length - 1, 0, false);
          if (btnPlay) btnPlay.textContent = 'Смотреть ещё раз';
          if (statusEl) statusEl.textContent = 'Конец серии.';
          return;
        }
        showFrame();
      }, this.frameTime(frame));
    };
    showFrame();
  }

  renderPlayer(ep) {
    const cast = this.getCast();
    return `
      <table class="mult-player" cellspacing="0">
        <tr><td class="mult-screen"><canvas class="mult-canvas" width="480" height="270" data-ep="${ep.id}" role="img" aria-label="Серия ${ep.num}: ${this.esc(ep.title)}. Текст серии в сценарии ниже."></canvas></td></tr>
        <tr>
          <td class="mult-controls">
            <button class="mult-btn mult-btn-play">Смотреть</button>
            <button class="mult-btn mult-btn-stop">Стоп</button>
            <span class="mult-player-status" role="status">Серия ${ep.num}, ${ep.frames.length} кадров, ${ep.duration}</span>
          </td>
        </tr>
      </table>
      <h2 class="mult-ep-h">Серия ${ep.num}. ${this.esc(ep.title)}</h2>
      <p class="mult-ep-desc">${this.esc(ep.desc)} <span class="mult-gray">Вышла ${ep.date}.</span></p>
      <div class="mult-script">
        <div class="mult-script-h">Сценарий</div>
        ${ep.frames.map((f, i) => `<p><b>${(cast[f.who] || {}).name || ''}:</b> ${this.esc(f.text)} <button type="button" class="mult-say" data-who="${f.who}" data-text="${this.esc(f.text)}" title="Послушать" aria-label="Послушать реплику">${this.gif('speaker')}</button></p>`).join('')}
      </div>
    `;
  }

  renderStrip(activeId) {
    return `
      <table class="mult-strip" cellspacing="0">
        <tr>
          ${this.getEpisodes().map(ep => `
            <td class="${ep.id === activeId ? 'is-active' : ''}">
              <a data-url="${this.baseUrl}/ep?id=${ep.id}" class="mult-thumb-link"><canvas class="mult-thumb" width="128" height="72" data-ep="${ep.id}"></canvas></a>
              <div>${this.link(`/ep?id=${ep.id}`, `${ep.num}. ${this.esc(ep.title)}`)}</div>
              <div class="mult-gray">${ep.date}, ${ep.duration}</div>
            </td>
          `).join('')}
        </tr>
      </table>
    `;
  }

  renderHome() {
    const eps = this.getEpisodes();
    const latest = eps[eps.length - 1];
    const book = this.getGuestbook().slice(0, 3);
    return `
      <div class="mult-new">${this.gif('new')} <b>Новая серия!</b> «${this.esc(latest.title)}», ${latest.date}</div>
      ${this.renderPlayer(latest)}
      <h3 class="mult-h3">Все серии</h3>
      ${this.renderStrip(latest.id)}
      <h3 class="mult-h3">Пишут в гостевую</h3>
      ${book.map(e => `<p class="mult-gb-line"><b>${this.esc(e.name)}:</b> ${this.esc(e.text)}</p>`).join('')}
      <p>${this.link('/guestbook', 'Вся гостевая книга')}</p>
    `;
  }

  renderEpisode(id) {
    const ep = this.getEpisodes().find(e => e.id === id);
    if (!ep) return `<p>Такой серии нет. ${this.link('', 'Смотреть последнюю')}</p>`;
    return `
      ${this.renderPlayer(ep)}
      <h3 class="mult-h3">Другие серии</h3>
      ${this.renderStrip(ep.id)}
    `;
  }

  renderQuotes() {
    const cast = this.getCast();
    const lines = [];
    this.getEpisodes().forEach(ep => ep.frames.forEach(f => {
      if (f.who !== 'modem') lines.push({ ep, f });
    }));
    return `
      <h2 class="mult-ep-h">Цитатник</h2>
      <p class="mult-ep-desc">Все реплики из всех серий. Нажмите на динамик, чтобы послушать.</p>
      <table class="mult-quotes" cellspacing="0">
        ${lines.map(({ ep, f }) => `
          <tr>
            <td class="mult-q-who">${cast[f.who].name}</td>
            <td>«${this.esc(f.text)}»</td>
            <td class="mult-q-ep">${this.link(`/ep?id=${ep.id}`, `серия ${ep.num}`)}</td>
            <td><button type="button" class="mult-say" data-who="${f.who}" data-text="${this.esc(f.text)}" title="Послушать" aria-label="Послушать реплику">${this.gif('speaker')}</button></td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  getWallpapers() {
    return [
      { id: 'kitchen', file: 'MASYANYA_KITCHEN.BMP', title: 'Масяня и Хрюндель на кухне', ep: 'y2k', frame: 4 },
      { id: 'night', file: 'MASYANYA_MODEM.BMP', title: 'Масяня и модем', ep: 'modem', frame: 0 }
    ];
  }

  wallpaperData(id) {
    const wp = this.getWallpapers().find(x => x.id === id);
    if (!wp || typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ep = this.getEpisodes().find(e => e.id === wp.ep);
    const frame = Object.assign({}, ep.frames[wp.frame], { text: '' });
    this.drawFrame(canvas, { frames: [frame] }, 0, 0, false);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('www.mult98.ru', 624, 466);
    return canvas.toDataURL('image/png');
  }

  setWallpaper(id) {
    const data = this.wallpaperData(id);
    const dialogs = typeof window !== 'undefined' ? window.appDialogs : null;
    if (!data || !dialogs || !dialogs.saveDisplaySettings) return false;
    const settings = dialogs.saveDisplaySettings({ wallpaper: data, wallpaperMode: 'center' });
    if (dialogs.applyDisplaySettings) dialogs.applyDisplaySettings(settings || dialogs.getDisplaySettings());
    return true;
  }

  getTextFiles() {
    return [
      { file: 'MULT_ICQ_SOUNDS.TXT', title: 'Звуки для ICQ голосами героев', text: '[MULT.RU: ЗВУКИ ДЛЯ ICQ 98]\nНовое сообщение = «Эй, тебе пишут!» (Масяня)\nВход в сеть      = «ПИ-И-И-ИСК» (модем)\nВыход из сети    = «Пошли пить чай» (Масяня)\nКто-то в сети    = «А лифты? А банки?» (Хрюндель)\n\nКак поставить: откройте ICQ, «Настройки», «Звуки», выберите файл для каждого события.' },
      { file: 'MODEM_SONG.TXT', title: 'Песня модема (слова)', text: '[ПЕСНЯ МОДЕМА]\nСвистит модем, трещит АТС,\nУ мамы снова перевес.\nДвадцать восемь восемьсот,\nКто дозвонился, тот живёт.\n\nПрипев:\nПИ-И-И-ИСК, ШШШ, ДЗЫНЬ!\nСоединение есть. Аминь.' }
    ];
  }

  renderDownloads() {
    return `
      <h2 class="mult-ep-h">Обои и звуки</h2>
      <p class="mult-ep-desc">Картинки 640x480. Сохраняются в «Мои документы\\Downloads», открываются в Paint. Можно сразу поставить на рабочий стол.</p>
      <table class="mult-dl" cellspacing="0">
        <tr>
          ${this.getWallpapers().map(wp => `
            <td>
              <canvas class="mult-thumb mult-wall-preview" width="160" height="120" data-ep="${wp.ep}" data-frame="${wp.frame}" data-wall="1"></canvas>
              <div><b>${this.esc(wp.title)}</b></div>
              <div class="mult-gray">${wp.file}, 640x480</div>
              <button class="mult-btn mult-btn-download" data-type="wall" data-wall="${wp.id}">Скачать</button>
              <button class="mult-btn mult-btn-setwall" data-wall="${wp.id}">На рабочий стол</button>
            </td>
          `).join('')}
        </tr>
      </table>
      <table class="mult-quotes" cellspacing="0">
        ${this.getTextFiles().map((t, i) => `
          <tr>
            <td>${this.gif('disk')} <b>${t.file}</b></td>
            <td>${this.esc(t.title)}</td>
            <td><button class="mult-btn mult-btn-download" data-type="${i === 0 ? 'sound' : 'song'}" data-file="${t.file}">Скачать</button></td>
          </tr>
        `).join('')}
      </table>
      <div class="mult-dl-status" role="status"></div>
    `;
  }

  renderGuestbook() {
    const list = this.getGuestbook();
    return `
      <h2 class="mult-ep-h">Гостевая книга</h2>
      <p class="mult-ep-desc">Напишите, что понравилось и о чём снять следующую серию.</p>
      <form class="mult-gb-form">
        <table cellspacing="0">
          <tr><td><label for="mult-gb-name">Имя:</label></td><td><input type="text" class="mult-input" id="mult-gb-name" name="name" autocomplete="nickname" maxlength="30" value="Гость_98"></td></tr>
          <tr><td><label for="mult-gb-text">Текст:</label></td><td><textarea class="mult-input" id="mult-gb-text" name="text" rows="3" maxlength="500"></textarea></td></tr>
          <tr><td></td><td><button type="submit" class="mult-btn mult-btn-submit-gb">Написать</button> <span class="mult-gb-msg" role="status"></span></td></tr>
        </table>
      </form>
      ${list.map(e => `
        <div class="mult-gb-entry">
          <div class="mult-gb-meta"><b>${this.esc(e.name)}</b> <span class="mult-gray">${this.esc(e.date)}</span></div>
          <div>${this.esc(e.text)}</div>
        </div>
      `).join('')}
    `;
  }

  renderSite(url) {
    const { path, params } = this.parseUrl(url);
    let content;
    let active = '/';
    if (path === '/ep') { content = this.renderEpisode(params.get('id')); this.currentEpisodeId = params.get('id'); }
    else if (path === '/quotes') { content = this.renderQuotes(); active = '/quotes'; }
    else if (path === '/downloads') { content = this.renderDownloads(); active = '/downloads'; }
    else if (path === '/guestbook') { content = this.renderGuestbook(); active = '/guestbook'; }
    else { content = this.renderHome(); const eps = this.getEpisodes(); this.currentEpisodeId = eps[eps.length - 1].id; }

    const nav = [['/', '', 'Мультики'], ['/quotes', '/quotes', 'Цитатник'], ['/downloads', '/downloads', 'Обои и звуки'], ['/guestbook', '/guestbook', 'Гостевая']];
    const letters = 'МУЛЬТ.РУ'.split('');
    return `
      <div class="mult-page">
        <table class="mult-frame" cellspacing="0">
          <tr>
            <td class="mult-head">
              <a class="mult-logo" data-url="${this.baseUrl}">${letters.map((ch, i) => `<span class="mult-l${i % 4}">${ch}</span>`).join('')}</a>
              <div class="mult-tag">мультики, которые пересылают по ICQ</div>
            </td>
            <td class="mult-head-pic"><canvas class="mult-head-canvas" width="120" height="96"></canvas></td>
          </tr>
          <tr>
            <td colspan="2" class="mult-nav">
              ${nav.map(([k, p, label]) => k === active ? `<b>${label}</b>` : `<a data-url="${this.baseUrl}${p}">${label}</a>`).join(' | ')}
            </td>
          </tr>
          <tr><td colspan="2" class="mult-main">${content}</td></tr>
          <tr>
            <td colspan="2" class="mult-footer">
              <div>Серии весят по 200-300 КБ, на модеме 33600 грузятся пару минут. Звук нужен обязательно.</div>
              <div>&copy; 1998 Мульт.ру. Пишите: <a href="mailto:masyanya@mult98.ru">masyanya@mult98.ru</a> | <button type="button" class="mult-linkbtn mult-btn-clippy">Позвать Скрепыша</button></div>
              ${window.retroSites && window.retroSites.renderWebRing ? window.retroSites.renderWebRing(this.baseUrl) : ''}
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  attachEvents(win, container, url) {
    this.stopAnimation();
    this.frameIndex = 0;
    const eps = this.getEpisodes();
    const findEp = id => eps.find(e => e.id === id);

    const head = container.querySelector('.mult-head-canvas');
    if (head) {
      this.drawFrame(head, { frames: [{ bg: 'kitchen', props: [], chars: [{ who: 'mas', x: 0.5, pose: 'wave' }], who: '', text: '' }] }, 0, 1, false);
    }

    container.querySelectorAll('canvas.mult-thumb').forEach(cv => {
      const ep = findEp(cv.dataset.ep);
      if (!ep) return;
      const idx = cv.dataset.frame ? Number(cv.dataset.frame) : 0;
      const frame = Object.assign({}, ep.frames[idx], { text: '' });
      this.drawFrame(cv, { frames: [frame] }, 0, 0, false);
    });

    const canvas = container.querySelector('canvas.mult-canvas');
    const statusEl = container.querySelector('.mult-player-status');
    const btnPlay = container.querySelector('.mult-btn-play');
    const ep = canvas ? findEp(canvas.dataset.ep) : null;
    if (canvas && ep) {
      this.drawFrame(canvas, ep, 0, 0, false);
      if (btnPlay) btnPlay.addEventListener('click', () => this.startAnimation(canvas, ep, statusEl, btnPlay));
      const stop = container.querySelector('.mult-btn-stop');
      if (stop) {
        stop.addEventListener('click', () => {
          this.stopAnimation();
          this.frameIndex = 0;
          this.drawFrame(canvas, ep, 0, 0, false);
          if (btnPlay) btnPlay.textContent = 'Смотреть';
          if (statusEl) statusEl.textContent = 'Остановлено.';
        });
      }
    }

    container.querySelectorAll('.mult-say').forEach(a => {
      a.addEventListener('click', () => this.speakLine(a.dataset.who, a.dataset.text));
    });

    const status = (html) => {
      const st = container.querySelector('.mult-dl-status');
      if (st) st.innerHTML = html;
    };

    container.querySelectorAll('.mult-btn-download').forEach(btn => {
      btn.addEventListener('click', () => {
        let file;
        let content;
        if (btn.dataset.type === 'wall') {
          const wp = this.getWallpapers().find(x => x.id === btn.dataset.wall);
          if (!wp) return;
          file = wp.file;
          content = this.wallpaperData(wp.id);
        } else {
          const t = this.getTextFiles().find(x => x.file === btn.dataset.file);
          if (!t) return;
          file = t.file;
          content = t.text;
        }
        if (window.vfs && window.vfs.writeFile) window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Downloads'], file, content);
        if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
        status(`${this.gif('check')} <b>${this.esc(file)}</b> сохранён в «Мои документы\\Downloads».`);
      });
    });

    container.querySelectorAll('.mult-btn-setwall').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.setWallpaper(btn.dataset.wall)) return;
        status(`${this.gif('check')} Обои стоят на рабочем столе. Вернуть старые можно в свойствах экрана.`);
      });
    });

    const gbForm = container.querySelector('.mult-gb-form');
    if (gbForm) {
      gbForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = container.querySelector('#mult-gb-name');
        const textInput = container.querySelector('#mult-gb-text');
        if (!textInput || !textInput.value.trim()) {
          const msg = container.querySelector('.mult-gb-msg');
          if (msg) msg.textContent = 'Напишите хоть пару слов.';
          return;
        }
        this.addGuestbookEntry(nameInput ? nameInput.value : '', textInput.value);
        if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
        if (window.appIE) window.appIE.renderPage(win, `${this.baseUrl}/guestbook`);
      });
    }

    const btnClippy = container.querySelector('.mult-btn-clippy');
    if (btnClippy) {
      btnClippy.addEventListener('click', () => {
        if (window.appClippy) {
          window.appClippy.wakeUp();
          window.appClippy.onNavigateIE(this.baseUrl, 'mult', 'Мульт.ру');
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.multSite = new MultSite();
}
