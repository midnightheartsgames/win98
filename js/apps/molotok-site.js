class MolotokSite {
  constructor() {
    this.baseUrl = 'http://www.molotok98.ru';
    this.storageKey = 'win98_molotok_v3';
    this.legacyKey = 'win98_molotok_lots_v2';
    this.rate = 20.5;
    this.minutePerHour = 60000;
    this.roundHours = 72;
    this.botDelay = 2500;
    this.timers = [];
    this.state = this.loadState();
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

  getCategories() {
    return [
      { id: 'video', short: 'Видеокарты', name: 'Видеокарты и 3D-ускорители' },
      { id: 'sound', short: 'Звук', name: 'Звуковые карты' },
      { id: 'cpu', short: 'Процессоры', name: 'Процессоры и память' },
      { id: 'modem', short: 'Модемы', name: 'Модемы и связь' },
      { id: 'console', short: 'Приставки', name: 'Приставки' },
      { id: 'misc', short: 'Мелочи', name: 'Мыши, джойстики, мелочи' }
    ];
  }

  getLots() {
    return [
      { id: 'voodoo2', cat: 'video', title: '3dfx Voodoo 2 12MB PCI (Diamond Monster 3D II)', seller: 'Overclock_Pro_98', city: 'Москва', start: 70, bid: 85, step: 5, blitz: 120, count: 14, leader: 'Krot_Tester', hours: 30, botMax: 105, cond: 'б/у, полгода', pic: 'card',
        desc: 'Куплен в мае, стоял во втором слоте рядом с S3 Trio. Quake 2 в 800x600 идёт без рывков. В комплекте проходной кабель VGA и диск с драйверами под Win 98. Коробки нет.',
        qa: [['Можно поставить две штуки в SLI?', 'Можно, если найдёте вторую и шлейф. Шлейфа у меня нет.']] },
      { id: 'tnt', cat: 'video', title: 'Riva TNT 16MB AGP (Creative Graphics Blaster)', seller: 'Neo_99', city: 'Санкт-Петербург', start: 90, bid: 95, step: 5, blitz: 140, count: 6, leader: 'CyberDemon98', hours: 52, botMax: 112, cond: 'новая, вскрыта коробка', pic: 'card',
        desc: 'Взял на замену Voodoo, но жена сказала «или мы, или видеокарта». Работает в 2D и 3D, 32-битный цвет. Коробка, диск, инструкция на английском.',
        qa: [] },
      { id: 'trio64', cat: 'video', title: 'S3 Trio64V+ 2MB PCI', seller: 'Bazar_Admin', city: 'Екатеринбург', start: 5, bid: 8, step: 1, blitz: 15, count: 3, leader: 'Kolya_Celeron', hours: 9, botMax: 10, cond: 'б/у', pic: 'card',
        desc: 'Простая надёжная карта для офиса. 1024x768 в 256 цветах. Играть в 3D не получится, Сапёр идёт отлично.',
        qa: [] },
      { id: 'awe64', cat: 'sound', title: 'Creative Sound Blaster AWE64 Gold ISA', seller: 'Midi_Master', city: 'Москва', start: 35, bid: 45, step: 5, blitz: 70, count: 8, leader: 'Guybrush_Fan', hours: 20, botMax: 55, cond: 'б/у, как новая', pic: 'card',
        desc: 'Позолоченные разъёмы, синтезатор EMU8000 и 4 МБ памяти под сэмплы. MIDI в DOOM звучит как оркестр. Отдам вместе с колонками Genius, если договоримся.',
        qa: [['Под DOS работает?', 'Работает, драйвер ставится из AUTOEXEC.BAT. Инструкцию распечатаю.']] },
      { id: 'sb16', cat: 'sound', title: 'Sound Blaster 16 PnP ISA', seller: 'Dendy_Junior', city: 'Тула', start: 8, bid: 10, step: 1, blitz: 18, count: 2, leader: 'Shtirlits', hours: 4, botMax: 12, cond: 'б/у', pic: 'card',
        desc: 'Шипит на максимальной громкости, на средней нормально. Джойстиковый порт рабочий.',
        qa: [] },
      { id: 'celeron', cat: 'cpu', title: 'Intel Celeron 300A, Slot 1, разгоняется до 450', seller: 'Overclock_Pro_98', city: 'Москва', start: 60, bid: 72, step: 4, blitz: 110, count: 17, leader: 'VoodooMaster', hours: 26, botMax: 92, cond: 'б/у, проверен', pic: 'chip',
        desc: 'Тот самый 300A. На плате с чипсетом BX ставите шину 100 МГц, и он работает на 450 МГц без доработок. Проверял в Quake 2 сутки подряд. Кулер в подарок.',
        qa: [['А если не разгонится?', 'Значит, у вас не BX. Верну деньги, если принесёте плату и покажете.']] },
      { id: 'simm', cat: 'cpu', title: 'Память SIMM 72-pin 16MB EDO, две планки', seller: 'Fido_Sysop_5020', city: 'Москва', start: 20, bid: 24, step: 2, blitz: 40, count: 5, leader: 'RadioActive', hours: 14, botMax: 30, cond: 'б/у', pic: 'chip',
        desc: 'Вынул из 486-го после апгрейда. Две планки по 16 МБ, ставятся парой в Pentium.',
        qa: [] },
      { id: 'usr56k', cat: 'modem', title: 'US Robotics Courier V.Everything, внешний', seller: 'Fido_Sysop_5020', city: 'Москва', start: 50, bid: 60, step: 5, blitz: 95, count: 19, leader: 'CyberDemon98', hours: 40, botMax: 80, cond: 'б/у, работал на узле', pic: 'modem',
        desc: 'Три года работал на узле ФидоНета без выключения. Держит связь на любой линии, даже через АТС с реле. Блок питания родной.',
        qa: [['На наших линиях даёт 33600?', 'На цифровой АТС да. На старой обычно 26400.']] },
      { id: 'zyxel', cat: 'modem', title: 'ZyXEL Omni 288S, внешний', seller: 'Shtirlits', city: 'Новосибирск', start: 40, bid: 46, step: 3, blitz: 75, count: 9, leader: 'Fido_Sysop_5020', hours: 18, botMax: 58, cond: 'б/у', pic: 'modem',
        desc: 'Народный модем для наших линий. Определитель номера, автоответчик, работает с АОН. В комплекте шнур и инструкция.',
        qa: [] },
      { id: 'dendy', cat: 'console', title: 'Dendy Junior, два джойстика и пистолет', seller: 'Dendy_Junior', city: 'Тула', start: 10, bid: 12, step: 2, blitz: 25, count: 5, leader: 'RadioActive', hours: 11, botMax: 16, cond: 'б/у', pic: 'console',
        desc: 'Жёлтая приставка из детства. Оба джойстика рабочие, турбо-кнопки нажимаются. Пистолет стреляет по уткам с двух метров. Блок питания трещит, но работает.',
        qa: [['Картриджи есть?', 'Только приставка. Картриджи продаю отдельно на рынке.']] },
      { id: 'megadrive', cat: 'console', title: 'Sega Mega Drive 2, один джойстик', seller: 'Guybrush_Fan', city: 'Пермь', start: 25, bid: 30, step: 2, blitz: 50, count: 7, leader: 'Neo_99', hours: 33, botMax: 38, cond: 'б/у', pic: 'console',
        desc: 'Чёрная, без царапин. Джойстик трёхкнопочный. Антенный кабель и блок питания в комплекте.',
        qa: [] },
      { id: 'genius_mouse', cat: 'misc', title: 'Мышь Genius EasyMouse, COM-порт', seller: 'Bazar_Admin', city: 'Екатеринбург', start: 3, bid: 6, step: 1, blitz: 12, count: 3, leader: 'Kolya_Celeron', hours: 7, botMax: 8, cond: 'б/у, шарик промыт', pic: 'mouse',
        desc: 'Шарик промыт в спирте, валики очищены от катышков. Курсор не прыгает. Готова к Сапёру и Paint.',
        qa: [] },
      { id: 'gravis', cat: 'misc', title: 'Джойстик Gravis GamePad, 4 кнопки', seller: 'Midi_Master', city: 'Москва', start: 6, bid: 9, step: 1, blitz: 16, count: 4, leader: 'Guybrush_Fan', hours: 22, botMax: 12, cond: 'б/у', pic: 'mouse',
        desc: 'Подключается в игровой порт звуковой карты. Крестовик отвинчивается, можно поставить штырёк.',
        qa: [] }
    ];
  }

  getSellers() {
    return {
      Overclock_Pro_98: { plus: 42, minus: 1, since: 'март 1998', note: 'Разгоняю всё, что продаю. Проверяю сутки.' },
      Neo_99: { plus: 11, minus: 0, since: 'август 1998', note: '' },
      Bazar_Admin: { plus: 112, minus: 3, since: 'январь 1998', note: 'Стою на радиорынке, ряд 4, место 17.' },
      Midi_Master: { plus: 18, minus: 0, since: 'май 1998', note: 'Звук и MIDI.' },
      Dendy_Junior: { plus: 7, minus: 1, since: 'октябрь 1998', note: '' },
      Fido_Sysop_5020: { plus: 99, minus: 0, since: 'февраль 1998', note: 'Сисоп узла 2:5020. Связь только по e-mail.' },
      Shtirlits: { plus: 25, minus: 2, since: 'июнь 1998', note: '' },
      Guybrush_Fan: { plus: 9, minus: 0, since: 'сентябрь 1998', note: '' }
    };
  }

  readJSON(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return null;
  }

  loadState() {
    const saved = this.readJSON(this.storageKey);
    const state = saved && saved.lots ? saved : { start: 0, lots: {} };
    if (!saved) {
      const legacy = this.readJSON(this.legacyKey);
      if (Array.isArray(legacy)) {
        legacy.forEach(l => {
          if (!l || !l.id || !(l.myBid || l.won)) return;
          state.lots[l.id] = { bid: l.currentBid, count: l.bidsCount, leader: l.leader, mine: !!l.myBid, won: !!l.won, closed: !!l.won, history: [] };
        });
      }
      try { if (typeof localStorage !== 'undefined') localStorage.removeItem(this.legacyKey); } catch (e) {}
    }
    this.state = state;
    this.saveState();
    return state;
  }

  saveState() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {}
  }

  lot(id) {
    const base = this.getLots().find(l => l.id === id);
    if (!base) return null;
    if (this.state.lots[id] && this.state.lots[id].pendingBot && Date.now() - (this.state.lots[id].pendingBot.at || 0) >= this.botDelay) this.resolveBot(id);
    const s = this.state.lots[id] || {};
    const lot = Object.assign({}, base, {
      bid: s.bid != null ? s.bid : base.bid,
      count: s.count != null ? s.count : base.count,
      leader: s.leader || base.leader,
      mine: !!s.mine,
      won: !!s.won,
      closed: !!s.closed,
      history: s.history || []
    });
    lot.left = Math.max(0, base.hours * this.minutePerHour - (Date.now() - (this.state.start || Date.now())));
    if (lot.left === 0 && !lot.closed) this.closeLot(lot);
    return lot;
  }

  startClock() {
    const now = Date.now();
    if (!this.state.start) {
      this.state.start = now;
      this.saveState();
    } else if (now - this.state.start > this.roundHours * this.minutePerHour) {
      Object.keys(this.state.lots).forEach(id => {
        if (!this.state.lots[id].won) delete this.state.lots[id];
      });
      this.state.start = now;
      this.state.round = (this.state.round || 1) + 1;
      this.saveState();
    }
  }

  get lots() {
    return this.getLots().map(l => this.lot(l.id));
  }

  touch(id) {
    if (!this.state.lots[id]) this.state.lots[id] = {};
    return this.state.lots[id];
  }

  closeLot(lot) {
    const s = this.touch(lot.id);
    s.closed = true;
    lot.closed = true;
    if (lot.leader === 'Вы' && !s.won) {
      s.won = true;
      lot.won = true;
      this.writeReceipt(lot, 'АУКЦИОН (ваша ставка оказалась последней)');
    }
    this.saveState();
  }

  timeLeft(lot) {
    if (lot.closed || lot.left <= 0) return 'торги окончены';
    const hours = Math.floor(lot.left / this.minutePerHour);
    const minutes = Math.floor((lot.left % this.minutePerHour) / (this.minutePerHour / 60));
    if (hours >= 24) return `${Math.floor(hours / 24)} дн. ${hours % 24} ч.`;
    if (hours >= 1) return `${hours} ч. ${minutes} мин.`;
    return `${minutes} мин.`;
  }

  placeBid(id, amount) {
    const lot = this.lot(id);
    if (!lot || lot.closed) return { ok: false, msg: 'Торги по этому лоту окончены.' };
    const min = lot.bid + lot.step;
    const value = Math.floor(Number(amount) || min);
    if (value < min) return { ok: false, msg: `Ставка должна быть не меньше ${min} у.е.` };
    if (value >= lot.blitz) return this.buyNow(id);
    const s = this.touch(id);
    s.history = lot.history.slice();
    s.history.unshift({ who: 'Вы', amount: value });
    s.bid = value;
    s.count = lot.count + 1;
    s.leader = 'Вы';
    s.mine = true;
    const rival = lot.leader !== 'Вы' ? lot.leader : 'CyberDemon98';
    s.pendingBot = lot.botMax >= value + lot.step ? { who: rival, amount: value + lot.step, at: Date.now() } : null;
    this.saveState();
    return { ok: true, msg: `Ваша ставка ${value} у.е. принята. Вы лидер торгов.` };
  }

  resolveBot(id) {
    const s = this.state.lots[id];
    if (!s || !s.pendingBot || s.closed) return false;
    const bot = s.pendingBot;
    s.pendingBot = null;
    s.history = s.history || [];
    s.history.unshift({ who: bot.who, amount: bot.amount });
    s.bid = bot.amount;
    s.count = (s.count || 0) + 1;
    s.leader = bot.who;
    this.saveState();
    return true;
  }

  buyNow(id) {
    const lot = this.lot(id);
    if (!lot || lot.closed) return { ok: false, msg: 'Торги по этому лоту окончены.' };
    const s = this.touch(id);
    s.history = lot.history.slice();
    s.history.unshift({ who: 'Вы', amount: lot.blitz, blitz: true });
    s.bid = lot.blitz;
    s.count = lot.count + 1;
    s.leader = 'Вы';
    s.mine = true;
    s.won = true;
    s.closed = true;
    s.pendingBot = null;
    this.saveState();
    lot.bid = lot.blitz;
    this.writeReceipt(lot, 'БЛИЦ-ЦЕНА («Купить сейчас»)');
    return { ok: true, msg: `Лот ваш за ${lot.blitz} у.е. Квитанция сохранена в «Мои документы».` };
  }

  receiptName(lot) {
    return `AUCTION_RECEIPT_${lot.id.toUpperCase()}.TXT`;
  }

  writeReceipt(lot, how) {
    const line = '===============================================================';
    const seller = this.getSellers()[lot.seller] || {};
    const text = `${line}\n  ИНТЕРНЕТ-АУКЦИОН «МОЛОТОК '98»\n  КВИТАНЦИЯ ПОКУПАТЕЛЯ, ЛОТ № ${lot.id.toUpperCase()}\n${line}\nТовар:     ${lot.title}\nПродавец:  ${lot.seller} (${lot.city}, отзывы +${seller.plus || 0} / -${seller.minus || 0})\nСумма:     ${lot.bid} у.е. (около ${Math.round(lot.bid * this.rate)} руб. по курсу ${this.rate})\nСпособ:    ${how}\n\nКак получить товар:\n  Напишите продавцу на e-mail или в ICQ и договоритесь о встрече.\n  Проверяйте товар при продавце. Деньги отдавайте после проверки.\n${line}`;
    if (window.vfs && window.vfs.writeFile) window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], this.receiptName(lot), text);
    if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
  }

  rub(usd) {
    return Math.round(usd * this.rate).toLocaleString('ru-RU');
  }

  picture(kind) {
    const icons = { card: 'pc', chip: 'tools', modem: 'phone', console: 'cart', mouse: 'robot' };
    return `<div class="molotok-pic">${this.gif(icons[kind] || 'box', 3)}<div>фото по запросу</div></div>`;
  }

  status(lot) {
    if (lot.won) return '<span class="molotok-st molotok-st-won">куплен вами</span>';
    if (lot.closed) return lot.mine ? '<span class="molotok-st molotok-st-lost">вас перебили</span>' : '<span class="molotok-st">закрыт</span>';
    if (lot.leader === 'Вы') return '<span class="molotok-st molotok-st-lead">вы лидер</span>';
    if (lot.mine) return '<span class="molotok-st molotok-st-lost">ставка перебита</span>';
    return '';
  }

  lotRow(lot) {
    return `
      <tr class="${lot.closed ? 'is-closed' : ''}">
        <td>${this.link(`/lot?id=${lot.id}`, this.esc(lot.title))}${lot.count >= 15 ? ` ${this.gif('flame')}` : ''}<div class="molotok-sub">${this.esc(lot.city)} &nbsp; ${this.esc(lot.cond)}</div></td>
        <td class="molotok-r"><b class="molotok-price">${lot.bid}</b> у.е.<div class="molotok-sub">${this.rub(lot.bid)} р.</div></td>
        <td class="molotok-c">${lot.count}</td>
        <td class="molotok-r">${lot.blitz} у.е.</td>
        <td>${this.timeLeft(lot)} ${this.status(lot)}</td>
      </tr>
    `;
  }

  lotTable(lots, empty) {
    if (!lots.length) return `<p class="molotok-empty">${empty}</p>`;
    return `
      <table class="molotok-list" cellspacing="0">
        <tr><th>Лот</th><th class="molotok-r">Ставка</th><th class="molotok-c">Ставок</th><th class="molotok-r">Блиц</th><th>До конца</th></tr>
        ${lots.map(l => this.lotRow(l)).join('')}
      </table>
    `;
  }

  renderHome() {
    const lots = this.lots;
    const cats = this.getCategories();
    const ending = lots.filter(l => !l.closed).sort((a, b) => a.left - b.left).slice(0, 5);
    const hot = lots.filter(l => !l.closed).sort((a, b) => b.count - a.count).slice(0, 4);
    return `
      <table class="molotok-cats" cellspacing="0">
        <tr>
          ${[0, 2, 4].map(i => `
            <td>
              ${cats.slice(i, i + 2).map(c => `<div class="molotok-cat">${this.gif('folder')} ${this.link(`/cat?id=${c.id}`, `<b>${c.name}</b>`)} <span>(${lots.filter(l => l.cat === c.id && !l.closed).length})</span></div>`).join('')}
            </td>
          `).join('')}
        </tr>
      </table>
      <h2 class="molotok-h">Скоро закрываются</h2>
      ${this.lotTable(ending, 'Все торги окончены. Продавцы выставят новые лоты через несколько минут.')}
      <h2 class="molotok-h">Больше всего ставок</h2>
      ${this.lotTable(hot, 'Пока тихо.')}
      <p class="molotok-note">${this.gif('info')} Время на «Молотке» идёт быстро: одна минута на ваших часах равна часу торгов. Не успели? Ставьте блиц-цену.</p>
    `;
  }

  renderCat(id) {
    const cat = this.getCategories().find(c => c.id === id);
    if (!cat) return `<h2 class="molotok-h">Раздел не найден</h2><p>${this.link('', 'На главную')}</p>`;
    const lots = this.lots.filter(l => l.cat === id);
    return `
      <div class="molotok-crumbs">${this.link('', 'Все разделы')} &gt; ${cat.name}</div>
      <h2 class="molotok-h">${cat.name}</h2>
      ${this.lotTable(lots, 'В этом разделе пока нет лотов.')}
    `;
  }

  renderSearch(q) {
    const words = String(q || '').toLowerCase().trim();
    const lots = words ? this.lots.filter(l => (l.title + ' ' + l.desc).toLowerCase().includes(words)) : [];
    return `
      <h2 class="molotok-h">Поиск: «${this.esc(q || '')}»</h2>
      ${this.lotTable(lots, words ? 'Ничего не найдено. Попробуйте другое слово, например «модем» или «Voodoo».' : 'Введите слово для поиска.')}
    `;
  }

  renderLot(id) {
    const lot = this.lot(id);
    if (!lot) return `<h2 class="molotok-h">Лот не найден</h2><p>Возможно, продавец снял его с торгов. ${this.link('', 'Все лоты')}</p>`;
    const cat = this.getCategories().find(c => c.id === lot.cat);
    const seller = this.getSellers()[lot.seller] || { plus: 0, minus: 0, since: '', note: '' };
    const history = lot.history.length ? lot.history : [{ who: lot.leader, amount: lot.bid }];
    const earlier = lot.count - history.length;
    const min = lot.bid + lot.step;
    return `
      <div class="molotok-crumbs">${this.link('', 'Все разделы')} &gt; ${this.link(`/cat?id=${lot.cat}`, cat ? cat.name : '')} &gt; Лот № ${lot.id.toUpperCase()}</div>
      <h2 class="molotok-lot-h">${this.esc(lot.title)}</h2>
      <table class="molotok-lot" cellspacing="0">
        <tr>
          <td class="molotok-lot-pic">${this.picture(lot.pic)}</td>
          <td class="molotok-lot-facts">
            <table cellspacing="0">
              <tr><td>Текущая ставка:</td><td><b class="molotok-price molotok-big">${lot.bid} у.е.</b> (${this.rub(lot.bid)} руб.)</td></tr>
              <tr><td>Лидер:</td><td><b>${this.esc(lot.leader)}</b> ${this.status(lot)}</td></tr>
              <tr><td>Ставок:</td><td>${lot.count}</td></tr>
              <tr><td>Начальная цена:</td><td>${lot.start} у.е.</td></tr>
              <tr><td>Шаг ставки:</td><td>${lot.step} у.е.</td></tr>
              <tr><td>До конца торгов:</td><td><b>${this.timeLeft(lot)}</b></td></tr>
              <tr><td>Состояние:</td><td>${this.esc(lot.cond)}</td></tr>
              <tr><td>Город:</td><td>${this.esc(lot.city)}</td></tr>
            </table>
          </td>
          <td class="molotok-lot-bid">
            ${lot.closed ? `
              <div class="molotok-closed">${lot.won ? `${this.gif('check')} Лот ваш.<br>Квитанция: C:\\My Documents\\${this.receiptName(lot)}` : 'Торги окончены.'}</div>
            ` : `
              <form class="molotok-bid-form" data-id="${lot.id}">
                <label class="molotok-bid-label" for="molotok-amount">Ваша ставка, у.е.:</label>
                <input type="number" inputmode="numeric" class="molotok-input" id="molotok-amount" name="amount" min="${min}" step="1" value="${min}">
                <button type="submit" class="molotok-btn molotok-btn-bid" data-id="${lot.id}">Сделать ставку</button>
                <div class="molotok-sub">не меньше ${min} у.е.</div>
              </form>
              <div class="molotok-or">или</div>
              <button class="molotok-btn molotok-btn-blitz" data-id="${lot.id}" data-price="${lot.blitz}">Купить сейчас за ${lot.blitz} у.е.</button>
              <div class="molotok-bid-msg" role="status"></div>
            `}
          </td>
        </tr>
      </table>
      <h3 class="molotok-h3">Описание от продавца</h3>
      <p class="molotok-desc">${this.esc(lot.desc)}</p>
      <table class="molotok-two" cellspacing="0">
        <tr>
          <td>
            <h3 class="molotok-h3">Продавец</h3>
            <p><b>${this.esc(lot.seller)}</b> <span class="molotok-plus">+${seller.plus}</span> / <span class="molotok-minus">-${seller.minus}</span><br>
            <span class="molotok-sub">на «Молотке» с ${seller.since}</span>${seller.note ? `<br>${this.esc(seller.note)}` : ''}</p>
            <h3 class="molotok-h3">Вопросы продавцу</h3>
            ${lot.qa.length ? lot.qa.map(([q, a]) => `<p class="molotok-qa"><b>В:</b> ${this.esc(q)}<br><b>О:</b> ${this.esc(a)}</p>`).join('') : '<p class="molotok-sub">Вопросов пока нет.</p>'}
          </td>
          <td>
            <h3 class="molotok-h3">История ставок</h3>
            <table class="molotok-hist" cellspacing="0">
              <tr><th>Участник</th><th class="molotok-r">Ставка</th></tr>
              ${history.map(h => `<tr class="${h.who === 'Вы' ? 'is-me' : ''}"><td>${this.esc(h.who)}${h.blitz ? ' (блиц)' : ''}</td><td class="molotok-r">${h.amount} у.е.</td></tr>`).join('')}
              ${earlier > 0 ? `<tr><td colspan="2" class="molotok-sub">и ещё ${earlier} ставок раньше, начиная с ${lot.start} у.е.</td></tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  renderMyBids() {
    const lots = this.lots.filter(l => l.mine || l.won);
    return `
      <h2 class="molotok-h">Мои ставки</h2>
      ${this.lotTable(lots, `Вы ещё не делали ставок. Начните с раздела ${this.link('/cat?id=video', 'видеокарт')} или ${this.link('/cat?id=modem', 'модемов')}.`)}
      <p class="molotok-note">Выигранные квитанции лежат в папке «Мои документы».</p>
    `;
  }

  renderRules() {
    return `
      <h2 class="molotok-h">Правила торгов</h2>
      <ol class="molotok-rules">
        <li><b>Валюта.</b> Ставки в у.е., 1 у.е. равна 1 доллару США. Рубли на странице считаются по курсу ${this.rate} руб. и даны для справки.</li>
        <li><b>Ставка.</b> Каждая новая ставка больше текущей хотя бы на шаг, который выбрал продавец.</li>
        <li><b>Автоставка.</b> Другие участники могут оставить роботу максимальную сумму. Робот перебивает вас на один шаг, пока не дойдёт до неё.</li>
        <li><b>Блиц-цена.</b> Если вы платите блиц-цену, торги сразу заканчиваются в вашу пользу.</li>
        <li><b>Конец торгов.</b> Лот достаётся тому, чья ставка последняя, когда время вышло.</li>
        <li><b>Встреча.</b> Товар передаётся при личной встрече. Проверяйте его при продавце и платите после проверки.</li>
        <li><b>Отзывы.</b> После сделки поставьте продавцу плюс или минус. Продавцов с тремя минусами подряд мы отключаем.</li>
      </ol>
    `;
  }

  renderSite(url) {
    const { path, params } = this.parseUrl(url);
    this.startClock();
    let content;
    let active = 'home';
    if (path === '/cat') { content = this.renderCat(params.get('id')); active = params.get('id'); }
    else if (path === '/lot') { content = this.renderLot(params.get('id')); const l = this.lot(params.get('id')); active = l ? l.cat : 'home'; }
    else if (path === '/search') content = this.renderSearch(params.get('q'));
    else if (path === '/mybids') { content = this.renderMyBids(); active = 'mybids'; }
    else if (path === '/rules') { content = this.renderRules(); active = 'rules'; }
    else content = this.renderHome();

    const lots = this.lots;
    const open = lots.filter(l => !l.closed).length;
    const mine = lots.filter(l => l.leader === 'Вы' && !l.closed).length;
    const tabs = [['home', '', 'Все разделы']].concat(this.getCategories().map(c => [c.id, `/cat?id=${c.id}`, c.short]));

    return `
      <div class="molotok-page">
        <table class="molotok-top" cellspacing="0">
          <tr>
            <td class="molotok-logo">${this.link('', `${this.gif('hammer', 3)}<span>МОЛОТОК.РУ</span>`)}</td>
            <td class="molotok-search">
              <form class="molotok-search-form">
                <input type="text" class="molotok-input" id="molotok-q" name="q" aria-label="Поиск лотов" placeholder="например, модем…" value="${path === '/search' ? this.esc(params.get('q') || '') : ''}">
                <button type="submit" class="molotok-btn">Найти</button>
              </form>
              <div class="molotok-sub">Сейчас на торгах: <b>${open}</b> лотов. Курс: 1 у.е. = ${this.rate} руб.</div>
            </td>
            <td class="molotok-user">
              Вы вошли как <b>Гость_98</b><br>
              ${this.link('/mybids', `Мои ставки${mine ? ` (${mine})` : ''}`, active === 'mybids' ? 'is-on' : '')} | ${this.link('/rules', 'Правила', active === 'rules' ? 'is-on' : '')}
            </td>
          </tr>
        </table>
        <div class="molotok-tabs">
          ${tabs.map(([k, p, label]) => `<a data-url="${this.baseUrl}${p}" class="molotok-tab${k === active ? ' is-active' : ''}">${label}</a>`).join('')}
        </div>
        <div class="molotok-main">${content}</div>
        <div class="molotok-footer">
          <div>${this.link('', 'Главная')} | ${this.link('/mybids', 'Мои ставки')} | ${this.link('/rules', 'Правила')} | <a href="mailto:help@molotok98.ru">help@molotok98.ru</a> | <button type="button" class="molotok-linkbtn molotok-btn-clippy">Помощь Скрепыша</button></div>
          <div>&copy; 1998 Интернет-аукцион «Молоток '98». Торги идут круглосуточно.</div>
          ${window.retroSites && window.retroSites.renderWebRing ? window.retroSites.renderWebRing(this.baseUrl) : ''}
        </div>
      </div>
    `;
  }

  clearTimers() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }

  attachEvents(win, container, url) {
    this.clearTimers();
    const refresh = () => { if (window.appIE) window.appIE.renderPage(win, url); };
    const say = (text) => {
      const msg = container.querySelector('.molotok-bid-msg');
      if (msg) msg.textContent = text;
    };

    const search = container.querySelector('.molotok-search-form');
    if (search) {
      search.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = container.querySelector('#molotok-q');
        if (window.appIE) window.appIE.navigate(win, `${this.baseUrl}/search?q=${encodeURIComponent(q ? q.value.trim() : '')}`);
      });
    }

    const bidForm = container.querySelector('.molotok-bid-form');
    if (bidForm) {
      bidForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = bidForm.dataset.id;
        const amount = container.querySelector('#molotok-amount');
        const res = this.placeBid(id, amount ? amount.value : 0);
        if (!res.ok) { say(res.msg); return; }
        if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
        refresh();
        const state = this.state.lots[id];
        if (state && state.pendingBot) {
          this.timers.push(setTimeout(() => {
            this.resolveBot(id);
            if (window.appIE && window.appIE.currentUrl === url) refresh();
          }, this.botDelay));
        }
      });
    }

    container.querySelectorAll('.molotok-btn-blitz').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.dataset.sure) {
          btn.dataset.sure = '1';
          btn.textContent = `Да, купить за ${btn.dataset.price} у.е.`;
          say('Блиц-покупку нельзя отменить. Нажмите ещё раз, чтобы купить.');
          return;
        }
        const res = this.buyNow(btn.dataset.id);
        if (!res.ok) { say(res.msg); return; }
        refresh();
      });
    });

    const btnClippy = container.querySelector('.molotok-btn-clippy');
    if (btnClippy) {
      btnClippy.addEventListener('click', () => {
        if (window.appClippy) {
          window.appClippy.wakeUp();
          window.appClippy.onNavigateIE(this.baseUrl, 'molotok', "Интернет-аукцион «Молоток '98»");
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.molotokSite = new MolotokSite();
}
