class XFilesSite {
  constructor() {
    this.baseUrl = 'http://www.xfiles98.ru';
    this.pollStorageKey = 'win98_xfiles_poll_v1';
    this.votedKey = 'win98_xfiles_poll_voted';
    this.decodedKey = 'win98_xfiles_decoded_v1';
    this.reportsKey = 'win98_xfiles_reports_v1';
    this.counterKey = 'win98_xfiles_counter';
    this.codes = ['ROSWELL', 'AREA51', 'MULDER', 'SCULLY'];
    this.audioContext = null;
    this.activeOscs = [];
    this.decrypted = this.readJSON(this.decodedKey, false) === true;
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

  readJSON(key, fallback) {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return fallback;
  }

  writeJSON(key, value) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  getCases() {
    return [
      {
        id: 'molebka', num: '98-UFO-04', date: '14.08.1998', place: 'Пермская обл., пос. Молёбка, берег р. Сылва', source: 'туристическая группа из Перми, 6 человек', status: 'Подтверждено свидетелями',
        title: 'Зелёное свечение над Сылвой',
        body: [
          'Около 23:40 группа стояла лагерем на берегу реки Сылва. Над лесом на северо-востоке появилось свечение изумрудного цвета размером с полную луну. Свечение висело неподвижно примерно четыре минуты, потом ушло вверх без звука.',
          'По словам руководителя группы [[Н. В. Захаровой]], стрелка компаса в это время вращалась, а механические часы у троих участников отстали на [[42 минуты]]. Фотоаппарат «Зенит» сделал два кадра. На проявленной плёнке оба кадра засвечены.',
          'Место известно как Пермская аномальная зона. Туристы ездят туда с конца 1980-х годов, рассказы о свечении приходят каждое лето.'
        ],
        skeptic: 'Под Молёбкой проходит ЛЭП, у проводов компас врёт всегда. Часы отстают, если их забыли завести. А плёнку засвечивают, когда открывают «Зенит» в темноте не до конца перемотав.'
      },
      {
        id: 'flash', num: '98-SKY-11', date: '03.11.1998', place: 'Москва, Юго-Запад', source: 'письма читателей, 14 сообщений', status: 'Изучается',
        title: 'Вспышка, которая двигалась',
        body: [
          'В 18:07 жители юго-запада Москвы видели в небе яркую точку. Точка медленно ползла, за пять-восемь секунд разгорелась ярче Венеры и погасла. Самолётных огней не было, звука тоже.',
          'Похожие вспышки читатели описывают с весны 1998 года, всегда в сумерках. Один из очевидцев, [[инженер НИИ]], утверждает, что видел вспышку в одном и том же месте три вечера подряд, со сдвигом в несколько минут.',
          'Мы попросили читателей присылать время и направление. Если вспышки повторяются по расписанию, это важно.'
        ],
        skeptic: 'Это спутники связи Iridium. У них плоские антенны размером с дверь. Когда антенна ловит солнце, на земле видна вспышка. Спутников запустили больше шестидесяти, время вспышек можно рассчитать заранее.'
      },
      {
        id: 'modem', num: '98-NET-33', date: '21.11.1998', place: 'Москва и Подмосковье', source: 'пользователи модемов, 6 сообщений', status: 'Изучается',
        title: 'Голос в модеме в 3:33',
        body: [
          'Шесть читателей независимо друг от друга сообщили одно и то же. Если включить динамик модема и звонить провайдеру около 3:33 ночи, в шипении соединения слышен тихий голос. Слов не разобрать. Голос звучит две-три секунды и пропадает, связь при этом обрывается.',
          'Все шестеро звонили через одну и ту же АТС номер [[134]]. Один читатель записал звук на магнитофон и прислал нам кассету. На кассете действительно слышен голос. Мы отдали запись [[знакомому звукорежиссёру]].',
          'Не доверяйте системным сообщениям «Соединение разорвано». Записывайте время.'
        ],
        skeptic: 'На старых АТС ночью линии свободны, и соседние провода наводят друг на друга. Голос из соседнего разговора слышен в любой трубке, не только в модеме. 3:33 запомнить легко, поэтому все его и пишут.'
      },
      {
        id: 'circles', num: '98-FLD-07', date: '09.07.1998', place: 'Тверская обл., поле у деревни [[Мошки]]', source: 'фермер, владелец поля', status: 'Закрыто',
        title: 'Круги на пшеничном поле',
        body: [
          'Утром фермер нашёл на своём поле три правильных круга диаметром 12, 8 и 5 метров, соединённых прямой полосой. Колосья уложены по спирали по часовой стрелке и не сломаны.',
          'Ночью собаки во дворе лаяли около часа, потом затихли. Следов техники на поле нет. Фермер говорит, что у края поля нашли [[деревянную доску и моток бечёвки]].',
          'Дело закрыто по просьбе владельца поля. Он устал от гостей.'
        ],
        skeptic: 'Доска и бечёвка. Студенты МГУ в прошлом году сделали такие круги за ночь вчетвером и сняли это на видео.'
      },
      {
        id: 'urals', num: '1947-URALS', date: 'август 1998', place: 'Уральский хребет', source: '[[станция дальней радиосвязи]]', status: 'ОСОБАЯ ПАПКА', locked: true,
        title: 'Сигнал на волне 21 см',
        body: [
          'В августе 1998 года радиотелескоп станции [[Зима]] принял импульсный сигнал на частоте 1420 МГц. На этой частоте излучает межзвёздный водород, и учёные давно предлагают слушать именно её.',
          'Сигнал повторился [[семь]] раз с равными промежутками и больше не появлялся. Объект, по данным станции, прошёл над хребтом и ушёл на орбиту Луны.',
          'Документ передан нам источником, который просил не называть его имени. ИСТИНА ГДЕ-ТО РЯДОМ.'
        ],
        skeptic: ''
      }
    ];
  }

  getCreatures() {
    return [
      ['«Серые»', 'Рост 120–140 см, большая голова, огромные чёрные глаза без зрачков. Самый частый образ в рассказах о похищениях. Говорят, рядом с ними глохнут радиоприёмники.'],
      ['«Высокие светлые»', 'Похожи на людей, высокие, со светлыми волосами. По рассказам контактёров, предупреждают об опасности ядерного оружия.'],
      ['Шаровые светящиеся объекты', 'Не существа, а самая частая форма наблюдений: светящийся шар без звука, иногда меняет цвет. Скептики называют шаровую молнию, зонды и фонари на воздушных шарах.']
    ];
  }

  getSeedReports() {
    return [
      { name: 'Ольга, Пермь', date: '26.11.1998', text: 'Вчера в 21:15 над микрорайоном Парковый видела оранжевый шар. Летел медленно, без звука, потом разделился на два.', reply: '' },
      { name: 'Петрович_астроном', date: '25.11.1998', text: 'Оранжевый шар без звука, который делится на два, это китайский фонарик или два. Их запускают на свадьбах. Проверьте, не было ли свадьбы.', reply: '' },
      { name: 'Серёга', date: '23.11.1998', text: 'У меня модем тоже говорит в 3:33. Мама говорит, это соседи по спаренному телефону. Но у нас не спаренный!', reply: 'Запишите время и номер АТС. Мы собираем все случаи.' },
      { name: 'Truth_Seeker', date: '20.11.1998', text: 'Смотрите на звёзды в бинокль. Если звезда ползёт и мигает, это не звезда.', reply: '' },
      { name: 'Петрович_астроном', date: '18.11.1998', text: 'Если звезда ползёт и мигает, это самолёт. Если ползёт и не мигает, спутник. Таблицы пролётов есть в любом астрономическом календаре.', reply: '' },
      { name: 'Марина', date: '15.11.1998', text: 'В детстве в Молёбке видела зелёный свет над лесом. Никому не рассказывала, думала, не поверят.', reply: 'Мы верим. Напишите подробнее на truth@xfiles98.ru.' }
    ];
  }

  getPollResults() {
    return this.readJSON(this.pollStorageKey, null) || { sawUfo: 148, heardSounds: 312, skeptical: 89 };
  }

  savePollVote(key) {
    const data = this.getPollResults();
    data[key] = (data[key] || 0) + 1;
    this.writeJSON(this.pollStorageKey, data);
    this.writeJSON(this.votedKey, key);
    return data;
  }

  getUserReports() {
    const list = this.readJSON(this.reportsKey, []);
    return Array.isArray(list) ? list : [];
  }

  addReport(name, text) {
    const clean = String(text || '').trim().slice(0, 600);
    const list = this.getUserReports();
    if (!clean) return list;
    list.unshift({ name: String(name || '').trim().slice(0, 40) || 'Аноним', date: '28.11.1998', text: clean, reply: 'Сообщение получено. Ваше свидетельство внесено в картотеку.' });
    this.writeJSON(this.reportsKey, list.slice(0, 40));
    return list;
  }

  tryCode(code) {
    const ok = this.codes.includes(String(code || '').trim().toUpperCase());
    if (ok) {
      this.decrypted = true;
      this.writeJSON(this.decodedKey, true);
    }
    return ok;
  }

  redact(text) {
    return this.esc(text).replace(/\[\[(.+?)\]\]/g, (m, inner) => this.decrypted
      ? `<span class="xf-declass" title="Рассекречено">${inner}</span>`
      : `<span class="xf-black" title="Засекречено">${'&#9608;'.repeat(Math.max(3, Math.min(24, inner.length)))}</span>`);
  }

  plain(text) {
    return String(text).replace(/\[\[(.+?)\]\]/g, '$1');
  }

  nextVisitor() {
    const n = (this.readJSON(this.counterKey, 0) || 0) + 1;
    this.writeJSON(this.counterKey, n);
    return 3307 + n;
  }

  renderHome() {
    const visitor = this.nextVisitor();
    return `
      <p class="xf-intro">Здесь собраны случаи, о которых не пишут газеты. Мы публикуем рассказы очевидцев, документы и всё, что удалось проверить. Скептиков тоже публикуем: истина где-то рядом, и она не боится вопросов.</p>
      <h2 class="xf-h">Последние поступления</h2>
      <table class="xf-cases" cellspacing="0">
        ${this.getCases().map(c => `
          <tr>
            <td class="xf-case-num">${c.num}</td>
            <td>${c.locked && !this.decrypted ? `<span class="xf-locked">${this.gif('lock')} Доступ закрыт.</span> Нужен ключ из ${this.link('/decoder', 'дешифратора')}.` : `${this.link(`/case?id=${c.id}`, this.esc(c.title))}<div class="xf-dim">${this.esc(this.plain(c.place).split(',')[0])}</div>`}</td>
            <td class="xf-case-date">${c.date}</td>
          </tr>
        `).join('')}
      </table>
      <p class="xf-note">${this.gif('eye')} Часть текста в документах закрыта чёрным. Ключ знает каждый поклонник сериала.</p>
      <p class="xf-center">
        <button class="xf-btn xf-btn-sound" id="xf-btn-sound">Послушать сигнал 1420 МГц</button>
      </p>
      <div class="xf-center xf-counter">Вы посетитель номер <span class="xf-odo">${String(visitor).padStart(6, '0')}</span><br><span class="xf-dim">Обновлено 27.11.98</span></div>
    `;
  }

  renderCase(id) {
    const c = this.getCases().find(x => x.id === id);
    if (!c) return `<h2 class="xf-h">Дело не найдено</h2><p>${this.link('', 'Вернуться к списку')}</p>`;
    if (c.locked && !this.decrypted) {
      return `<h2 class="xf-h">Дело № ${c.num}</h2><p class="xf-intro">${this.gif('lock')} Документ зашифрован. Введите ключ на странице ${this.link('/decoder', 'дешифратора')}.</p>`;
    }
    return `
      <div class="xf-crumbs">${this.link('', 'Все дела')} &gt; ${c.num}</div>
      <div class="xf-paper">
        <div class="xf-stamp">${c.locked ? 'ОСОБАЯ ПАПКА' : 'СЕКРЕТНО'}</div>
        <div class="xf-paper-h">ДЕЛО № ${c.num}</div>
        <div class="xf-paper-title">${this.esc(c.title)}</div>
        <table class="xf-fields" cellspacing="0">
          <tr><td>Дата:</td><td>${c.date}</td></tr>
          <tr><td>Место:</td><td>${this.redact(c.place)}</td></tr>
          <tr><td>Источник:</td><td>${this.redact(c.source)}</td></tr>
          <tr><td>Статус:</td><td><b>${this.esc(c.status)}</b></td></tr>
        </table>
        ${c.body.map(p => `<p>${this.redact(p)}</p>`).join('')}
        ${c.locked ? `
          <div class="xf-paper-tools">
            <button class="xf-btn" id="xf-btn-save-dossier">Сохранить в «Мои документы»</button>
            <button class="xf-btn" id="xf-btn-notepad-dossier">Открыть в Блокноте</button>
            <span id="xf-dossier-status"></span>
          </div>
        ` : ''}
      </div>
      ${c.skeptic ? `<div class="xf-skeptic"><b>Мнение скептика</b> (Петрович_астроном):<br>${this.esc(c.skeptic)}</div>` : ''}
      ${this.decrypted ? '' : `<p class="xf-note">${this.gif('lock')} Чёрные полосы снимает ${this.link('/decoder', 'дешифратор')}.</p>`}
    `;
  }

  dossierText() {
    const c = this.getCases().find(x => x.id === 'urals');
    return `[СОВЕРШЕННО СЕКРЕТНО // АРХИВ «ИСТИНА ГДЕ-ТО РЯДОМ»]\nДЕЛО №: ${c.num}\nГРИФ: ${c.status}\nМЕСТО: ${this.plain(c.place)}\nДАТА: ${c.date}\n\n${c.body.map(p => this.plain(p)).join('\n\n')}\n`;
  }

  renderDecoder() {
    return `
      <h2 class="xf-h">Дешифратор</h2>
      <div class="xf-paper xf-paper-narrow">
        <div class="xf-stamp">СОВЕРШЕННО СЕКРЕТНО</div>
        <p>Документы архива закрыты чёрными полосами. Введите кодовое слово, и полосы исчезнут во всех делах.</p>
        <p class="xf-hint">Подсказка: где в 1947 году нашли обломки, о которых спорят до сих пор?</p>
        <div class="xf-input-row">
          <label for="xf-code-input">Кодовое слово:</label>
          <input type="text" class="xf-input" id="xf-code-input" name="code" maxlength="20" autocomplete="off" spellcheck="false" placeholder="…">
          <button class="xf-btn xf-btn-decrypt" id="xf-btn-do-decrypt">Расшифровать</button>
        </div>
        <div class="xf-decrypt-output" id="xf-decrypt-res" role="status">
          ${this.decrypted ? this.decodedBlock() : '<span class="xf-dim">Ждём ключ...</span>'}
        </div>
      </div>
    `;
  }

  decodedBlock() {
    return `
      <b>${this.gif('check')} Доступ разрешён.</b> Полосы сняты во всех делах.<br>
      Открыта особая папка: ${this.link('/case?id=urals', 'дело № 1947-URALS, «Сигнал на волне 21 см»')}.
      <div class="xf-paper-tools">
        <button class="xf-btn" id="xf-btn-save-dossier">Сохранить в «Мои документы»</button>
        <button class="xf-btn" id="xf-btn-notepad-dossier">Открыть в Блокноте</button>
        <span id="xf-dossier-status"></span>
      </div>
    `;
  }

  renderCreatures() {
    return `
      <h2 class="xf-h">Кого описывают очевидцы</h2>
      <p class="xf-intro">Мы не утверждаем, что эти существа есть. Мы записываем, что рассказывают люди.</p>
      ${this.getCreatures().map(([name, text]) => `<h3 class="xf-h3">${this.gif('alien')} ${name}</h3><p class="xf-text">${text}</p>`).join('')}
    `;
  }

  renderReports() {
    const poll = this.getPollResults();
    const voted = this.readJSON(this.votedKey, null);
    const total = (poll.sawUfo || 0) + (poll.heardSounds || 0) + (poll.skeptical || 0) || 1;
    const opts = [['sawUfo', 'Видел(а) светящийся шар или диск'], ['heardSounds', 'Слышал(а) ночью странный гул или голос'], ['skeptical', 'Ничего не видел(а), всё это спутники']];
    const list = this.getUserReports().concat(this.getSeedReports());
    return `
      <h2 class="xf-h">Очевидцы</h2>
      <table class="xf-two" cellspacing="0">
        <tr>
          <td>
            <form class="xf-report-form">
              <div class="xf-form-h">Сообщить о наблюдении</div>
              <label for="xf-report-name">Имя и город:</label>
              <input type="text" class="xf-input xf-wide" id="xf-report-name" name="name" autocomplete="nickname" maxlength="40" value="Аноним">
              <label for="xf-report-text">Что, где и когда вы видели:</label>
              <textarea class="xf-input xf-wide" id="xf-report-text" rows="4" maxlength="600"></textarea>
              <button type="submit" class="xf-btn">Отправить</button> <span class="xf-report-msg" role="status"></span>
            </form>
          </td>
          <td class="xf-poll-cell">
            <form class="xf-poll-form">
              <div class="xf-form-h">Опрос</div>
              ${opts.map(([k, label], i) => `
                <label class="xf-poll-opt"><input type="radio" name="xf_ans" value="${k}"${(voted ? voted === k : i === 0) ? ' checked' : ''}> ${label}</label>
                <div class="xf-bar-row"><span class="xf-bar" style="width:${Math.round((poll[k] || 0) / total * 150)}px"></span> ${poll[k] || 0}</div>
              `).join('')}
              <button type="submit" class="xf-btn xf-btn-vote">Ответить</button>
              <div class="xf-poll-msg" role="status">${voted ? 'Ваш ответ записан.' : ''}</div>
            </form>
          </td>
        </tr>
      </table>
      ${list.map(r => `
        <div class="xf-report">
          <div class="xf-report-head"><b>${this.esc(r.name)}</b> <span class="xf-dim">${this.esc(r.date)}</span></div>
          <div>${this.esc(r.text)}</div>
          ${r.reply ? `<div class="xf-report-reply">Редакция: ${this.esc(r.reply)}</div>` : ''}
        </div>
      `).join('')}
    `;
  }

  renderSite(url) {
    const { path, params } = this.parseUrl(url);
    let content;
    let active = '/';
    if (path === '/case') content = this.renderCase(params.get('id'));
    else if (path === '/decoder') { content = this.renderDecoder(); active = '/decoder'; }
    else if (path === '/creatures') { content = this.renderCreatures(); active = '/creatures'; }
    else if (path === '/reports' || path === '/poll') { content = this.renderReports(); active = '/reports'; }
    else content = this.renderHome();

    const nav = [['/', 'Досье'], ['/decoder', 'Дешифратор'], ['/reports', 'Очевидцы'], ['/creatures', 'Кого видят']];
    return `
      <div class="xf-page">
        <table class="xf-frame" cellspacing="0">
          <tr>
            <td class="xf-head">
              <div class="xf-ufo-row">${this.gif('ufo', 3)}<span class="xf-title">ИСТИНА ГДЕ-ТО РЯДОМ</span>${this.gif('ufo', 3)}</div>
              <div class="xf-sub">X-FILES RU: архив необъяснённых случаев</div>
            </td>
          </tr>
          <tr>
            <td class="xf-nav">
              ${nav.map(([p, label]) => p === active ? `<b>${label}</b>` : this.link(p === '/' ? '' : p, label)).join(` ${this.gif('ball-green')} `)}
            </td>
          </tr>
          <tr><td class="xf-main">${content}</td></tr>
          <tr>
            <td class="xf-footer">
              <hr class="xf-hr">
              <div>Видели что-то странное? Пишите: <a href="mailto:truth@xfiles98.ru">truth@xfiles98.ru</a></div>
              <div>Не доверяйте никому. Даже нам. 1998</div>
              <div><button class="xf-btn xf-btn-clippy">Спросить Скрепыша</button></div>
              ${window.retroSites && window.retroSites.renderWebRing ? window.retroSites.renderWebRing(this.baseUrl) : ''}
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  initAudio() {
    const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!this.audioContext && Ctx) this.audioContext = new Ctx();
    if (this.audioContext && this.audioContext.state === 'suspended') this.audioContext.resume();
  }

  playSpookyTone() {
    this.initAudio();
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    [440, 523.25, 493.88, 392, 440, 659.25].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.3;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.linearRampToValueAtTime(f * 1.01, t + 0.35);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.42);
      this.activeOscs.push(osc);
    });
  }

  stopSpookyTone() {
    this.activeOscs.forEach(osc => { try { osc.stop(); } catch (e) {} });
    this.activeOscs = [];
  }

  bindDossierTools(root) {
    const btnSave = root.querySelector('#xf-btn-save-dossier');
    const btnNotepad = root.querySelector('#xf-btn-notepad-dossier');
    const statusEl = root.querySelector('#xf-dossier-status');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        if (window.vfs && window.vfs.writeFile) window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], 'DOSSIER_1947.TXT', this.dossierText());
        if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
        if (statusEl) statusEl.textContent = 'DOSSIER_1947.TXT сохранён в «Мои документы».';
      });
    }
    if (btnNotepad) {
      btnNotepad.addEventListener('click', () => {
        if (window.appNotepad && window.appNotepad.open) window.appNotepad.open('DOSSIER_1947.TXT', this.dossierText());
      });
    }
  }

  attachEvents(win, container, url) {
    const btnSound = container.querySelector('#xf-btn-sound');
    if (btnSound) btnSound.addEventListener('click', () => this.playSpookyTone());

    this.bindDossierTools(container);

    const btnDecrypt = container.querySelector('#xf-btn-do-decrypt');
    const inputCode = container.querySelector('#xf-code-input');
    const outRes = container.querySelector('#xf-decrypt-res');
    if (btnDecrypt && inputCode && outRes) {
      const run = () => {
        if (this.tryCode(inputCode.value)) {
          this.playSpookyTone();
          outRes.innerHTML = this.decodedBlock();
          this.bindDossierTools(outRes);
        } else {
          if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
          outRes.innerHTML = '<span class="xf-error">Неверное кодовое слово. Доступ закрыт.</span>';
        }
      };
      btnDecrypt.addEventListener('click', run);
      inputCode.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    }

    const pollForm = container.querySelector('.xf-poll-form');
    if (pollForm) {
      pollForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const chk = pollForm.querySelector('input[name="xf_ans"]:checked');
        if (!chk) return;
        this.savePollVote(chk.value);
        if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
        if (window.appIE) window.appIE.renderPage(win, `${this.baseUrl}/reports`);
      });
    }

    const reportForm = container.querySelector('.xf-report-form');
    if (reportForm) {
      reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = container.querySelector('#xf-report-name');
        const text = container.querySelector('#xf-report-text');
        if (!text || !text.value.trim()) {
          const msg = container.querySelector('.xf-report-msg');
          if (msg) msg.textContent = 'Опишите, что вы видели.';
          return;
        }
        this.addReport(name ? name.value : '', text.value);
        if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
        if (window.appIE) window.appIE.renderPage(win, `${this.baseUrl}/reports`);
      });
    }

    const btnClippy = container.querySelector('.xf-btn-clippy');
    if (btnClippy) {
      btnClippy.addEventListener('click', () => {
        if (window.appClippy) {
          window.appClippy.wakeUp();
          window.appClippy.onNavigateIE(this.baseUrl, 'xfiles', 'Архив «Истина где-то рядом»');
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.xFilesSite = new XFilesSite();
}
