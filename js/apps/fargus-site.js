class FargusSite {
  constructor() {
    this.baseUrl = 'http://www.goldfargus.ru';
    this.votesKey = 'win98_fargus_votes_v2';
    this.legacyVotesKey = 'win98_fargus_votes_v1';
    this.bookKey = 'win98_fargus_guestbook_v1';
    this.counterKey = 'win98_fargus_counter';
    this.audioContext = null;
    this.siteDay = '28.11.1998';
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

  getGames() {
    return [
      {
        id: 'half-life',
        steamId: 'half-life',
        num: 'F-98-112',
        orig: 'Half-Life 98',
        title: 'Период полураспада',
        cds: 1,
        lang: 'тексты, голос, титры',
        color: '#d86a00',
        ink: '#000000',
        icon: 'warn',
        cast: 'семь голосов, все учёные озвучены одним актёром',
        about: 'Научный сотрудник Гордон Фримен опаздывает на работу в исследовательский центр «Чёрная Меза», а эксперимент в лаборатории идёт не по плану. Переведены все надписи на стенах, речь охраны, учёных и диктора монорельса.',
        done: ['Меню и подсказки', 'Речь персонажей', 'Надписи на стенах и ящиках', 'Титры'],
        perls: [
          ['Resonance cascade', '«Каскадный отзвук»'],
          ['Morphine administered', '«Морфий иссяк»'],
          ['Gordon, you\'re late for the test', '«Гордон, вы опоздали на аналитическую пробу!»']
        ],
        issue: 'Если после сохранения учёный молчит, установите патч FG_HL_PATCH1.TXT из раздела «Техподдержка».'
      },
      {
        id: 'doom',
        steamId: 'doom',
        num: 'F-98-097',
        orig: 'DOOM 98',
        title: 'Рок: Ад на Марсе',
        cds: 1,
        lang: 'тексты, брифинги',
        color: '#9c1010',
        ink: '#ffe600',
        icon: 'flame',
        cast: 'брифинги читает один диктор',
        about: 'Морпех остаётся один на базе у спутника Марса, куда открылись ворота из ада. Слово DOOM мы перевели по словарю: это «рок», «судьба», «гибель». Названия уровней, монстров и сообщения игры полностью на русском языке.',
        done: ['Меню и сообщения', 'Названия уровней', 'Монстры и оружие', 'Экраны между эпизодами'],
        perls: [
          ['BFG 9000', '«Большая Фиговина 9000»'],
          ['Imp', '«Бесёнок»'],
          ['You can\'t save if you aren\'t playing!', '«Ты не можешь сохраниться, если ты не играешь в игру!»']
        ],
        issue: 'Коды IDDQD и IDKFA мы не переводили: игра их не узнает. Список кодов есть в файле FARGUS_DOOM98_RUS.TXT.'
      },
      {
        id: 'gta90',
        steamId: 'gta90',
        num: 'F-98-120',
        orig: 'Grand Theft Auto: Екатеринбург \'90',
        title: 'Великий автоугон: Свердловск',
        cds: 1,
        lang: 'тексты, таксофоны',
        color: '#2a6a2a',
        ink: '#ffffff',
        icon: 'phone',
        cast: 'звонки по таксофонам озвучили три голоса',
        about: 'Город 1990 года сверху: машины, задания по таксофонам и милиция на хвосте. Мы перевели все задания, вывески и сообщения игры. Сообщение о гибели героя стало самой обсуждаемой строчкой года.',
        done: ['Задания по таксофонам', 'Сообщения на экране', 'Названия машин', 'Справка по управлению'],
        perls: [
          ['WASTED', '«ПОТРАЧЕНО»'],
          ['BUSTED', '«АРЕСТОВАН ПО ПОЛНОЙ»'],
          ['Respect +', '«Уважуха +»']
        ],
        issue: 'Если таксофон звонит, а текст не появляется, нажмите клавишу ещё раз. Ошибка будет исправлена в следующем патче.'
      },
      {
        id: 'fallout2',
        steamId: 'fallout2',
        num: 'F-98-101',
        orig: 'Fallout 2 Demo',
        title: 'Радиоактивные осадки 2',
        cds: 1,
        lang: 'тексты, диалоги',
        color: '#5a5a3a',
        ink: '#ffe600',
        icon: 'warn',
        cast: 'говорящие головы озвучены двумя актёрами',
        about: 'Демонстрационная версия ролевой игры о пустоши после ядерной войны. Слово Fallout переводится как «радиоактивные осадки», так мы и назвали издание. Переведены все диалоги, описания предметов и экран персонажа.',
        done: ['Диалоги', 'Описания предметов', 'Экран персонажа', 'Пип-бой'],
        perls: [
          ['Cool it, man!', '«Охлади траханье, парень!»'],
          ['Stimpak', '«Стимулирующий пакет»'],
          ['You have gained a level', '«Вы получили уровень»']
        ],
        issue: 'Демо-версия обрывается после первого города. Это не ошибка перевода: так устроена демо-версия.'
      },
      {
        id: 'diablo',
        steamId: 'diablo',
        num: 'F-98-088',
        orig: 'Diablo',
        title: 'Дьявол',
        cds: 1,
        lang: 'тексты, голос',
        color: '#3a0000',
        ink: '#ff9900',
        icon: 'flame',
        cast: 'старика Декарда Каина озвучил актёр драмтеатра',
        about: 'Под собором деревни Тристрам шестнадцать уровней подземелья, а на дне ждёт Владыка Ужаса. Переведены книги, речь жителей деревни и описания всех предметов.',
        done: ['Речь жителей', 'Книги и свитки', 'Предметы и заклинания', 'Меню'],
        perls: [
          ['Stay a while and listen', '«Останься ненадолго и слушай»'],
          ['Fresh meat!', '«Свежее мясо!»'],
          ['I can\'t use this yet', '«Я не могу использовать это пока»']
        ],
        issue: 'Сохранения из английской версии подходят к нашему изданию.'
      },
      {
        id: 'wolf3d',
        steamId: 'wolf3d',
        num: 'F-98-034',
        orig: 'Wolfenstein 3D',
        title: 'Волчий камень 3D',
        cds: 1,
        lang: 'тексты',
        color: '#4a4a7a',
        ink: '#ffffff',
        icon: 'shield',
        cast: 'охранники кричат по-немецки, мы оставили как есть',
        about: 'Побег из замка, коридоры, тайники за картинами и охрана с овчарками. Название замка мы перевели по частям: Wolf значит «волк», Stein значит «камень».',
        done: ['Меню', 'Экраны между уровнями', 'Справка'],
        perls: [
          ['Get Psyched!', '«Приготовься психовать!»'],
          ['Achtung!', '«Ахтунг!» (оставлено без перевода)'],
          ['Mein Leben!', '«Моя жизнь!»']
        ],
        issue: 'Если игра идёт слишком быстро, закройте другие программы.'
      },
      {
        id: 'quest',
        steamId: 'quest',
        num: 'F-98-109',
        orig: 'LucasQuest 98',
        title: 'Пиратский квест Лукаса',
        cds: 2,
        lang: 'тексты, глаголы',
        color: '#1a4a7a',
        ink: '#ffe600',
        icon: 'book',
        cast: 'без голоса, только тексты',
        about: 'Приключение про остров, пиратов и сокровища. Игра управляется глаголами внизу экрана, все глаголы переведены на русский язык.',
        done: ['Глаголы', 'Диалоги', 'Предметы', 'Финальные титры'],
        perls: [
          ['Talk to', '«Разговаривай к»'],
          ['Pick up', '«Подбери вверх»'],
          ['Look at', '«Смотри на»']
        ],
        issue: 'Игра попросит вставить диск 2. Это значит, что надо вставить второй диск.'
      },
      {
        id: 'serioussam',
        steamId: 'serioussam',
        num: 'F-98-118',
        orig: 'Serious Sam 98',
        title: 'Серьёзный Сэм',
        cds: 1,
        lang: 'тексты, подсказки',
        color: '#a07a20',
        ink: '#000000',
        icon: 'bolt',
        cast: 'реплики Сэма прочитал ведущий радио',
        about: 'Египет, толпы монстров и один очень серьёзный герой. Переведены подсказки, описания врагов и все надписи на стенах храмов.',
        done: ['Подсказки', 'Описания врагов', 'Меню'],
        perls: [
          ['Kleer Skeleton', '«Чистый скелет»'],
          ['Headless Kamikaze', '«Безголовый камикадзе»'],
          ['Serious damage!', '«Серьёзный ущерб!»']
        ],
        issue: 'Коды «please …» вводятся по-английски, как в оригинале.'
      }
    ];
  }

  getVoices() {
    return [
      { id: 'cool', text: 'Охлади траханье, парень!', game: 'fallout2', note: 'Бандит в баре, «Радиоактивные осадки 2». Наш редактор считает эту фразу лучшей в году.', pitch: 0.6, rate: 0.9 },
      { id: 'wasted', text: 'Потрачено.', game: 'gta90', note: 'Сообщение о гибели героя, «Великий автоугон: Свердловск». Короче не придумаешь.', pitch: 0.3, rate: 0.7 },
      { id: 'stay', text: 'Останься ненадолго и слушай.', game: 'diablo', note: 'Декард Каин, «Дьявол». Актёр записал фразу сорок раз.', pitch: 0.5, rate: 0.8 },
      { id: 'full', text: 'Полностью на русском языке!', game: '', note: 'Голос с нашей заставки. Звучит перед каждой игрой «Фаргус».', pitch: 1.3, rate: 1.1 }
    ];
  }

  getNews() {
    return [
      ['28.11.1998', `Вышло издание ${this.link('/game?id=half-life', '«Период полураспада»')}. Записано больше 2000 реплик, включая охранника Барни.`],
      ['24.11.1998', `Открыт раздел ${this.link('/quotes', '«Голоса»')}: фрагменты нашей озвучки можно послушать прямо в браузере.`],
      ['19.11.1998', `Для «Великого автоугона» выложен патч: таксофоны больше не молчат. Скачайте его в разделе ${this.link('/support', '«Техподдержка»')}.`],
      ['12.11.1998', 'Наши издания продаются только через клиент <a data-url="http://www.steampowered.com">Steam</a>. Диски на рынках с нашим логотипом мы не выпускали.'],
      ['02.11.1998', `Открыта ${this.link('/guestbook', 'гостевая книга')}. Пишите, что перевести следующим.`]
    ];
  }

  getSeedBook() {
    return [
      { name: 'Андрей, Тверь', date: '27.11.1998', text: 'Купил «Рок: Ад на Марсе». Большая Фиговина 9000 это вы серьёзно? Друзья третий день ржут.', reply: 'BFG 9000 переведено по смыслу. Оружие действительно большое.' },
      { name: 'Kolya_Celeron', date: '26.11.1998', text: 'В «Периоде полураспада» все учёные говорят одним голосом. Это баг или так задумано?', reply: 'Учёных в игре много, а актёр у нас один. Зато он профессиональный.' },
      { name: 'Переводчик_Вася', date: '25.11.1998', text: 'Ребята, не слушайте нытиков. «Потрачено» лучше, чем «Вы погибли». Коротко и по-русски.', reply: 'Спасибо! Мы тоже так думаем.' },
      { name: 'Лена', date: '23.11.1998', text: 'Игра пишет «Вставьте диск 2», а у меня один диск. Что делать?', reply: 'В «Пиратском квесте Лукаса» два диска. Проверьте коробку, второй диск лежит под первым.' },
      { name: 'Dr_Modem', date: '21.11.1998', text: 'Скачал патч для автоугона за 12 минут на 28800. Работает, таксофоны звонят. Спасибо техподдержке.', reply: '' },
      { name: 'Злой_Геймер', date: '18.11.1998', text: '«Разговаривай к» это не русский язык. Верните английские глаголы!', reply: 'Перевод полный и качественный. Глаголы переведены все до одного.' },
      { name: 'Ирина Петровна', date: '15.11.1998', text: 'Сын просит «Дьявола» на Новый год. Там нет ничего страшного?', reply: 'Игра для взрослых. На коробке есть надпись «Полностью на русском языке», ошибиться невозможно.' }
    ];
  }

  getVotes() {
    const legacy = this.readJSON(this.legacyVotesKey, null);
    const votes = this.readJSON(this.votesKey, null);
    if (votes) return votes;
    const fresh = { 'half-life': 1420, doom: 980, gta90: 1890, diablo: 1210 };
    if (legacy && legacy.hl) fresh['half-life'] = legacy.hl;
    if (legacy && legacy.doom) fresh.doom = legacy.doom;
    return fresh;
  }

  saveVote(id) {
    const votes = this.getVotes();
    votes[id] = (votes[id] || 0) + 1;
    this.writeJSON(this.votesKey, votes);
    this.writeJSON('win98_fargus_voted', id);
    return votes;
  }

  getUserBook() {
    const list = this.readJSON(this.bookKey, []);
    return Array.isArray(list) ? list : [];
  }

  replyFor(text) {
    const t = String(text || '').toLowerCase();
    if (t.includes('диск')) return 'Проверьте коробку: второй диск лежит под первым.';
    if (t.includes('ошиб') || t.includes('криво') || t.includes('плох') || t.includes('ужас')) return 'Перевод полный и качественный. Ваше письмо передано редактору.';
    if (t.includes('голос') || t.includes('озвуч')) return 'Озвучка записана профессиональными актёрами театра.';
    if (t.includes('перевед') || t.includes('переведи') || t.includes('следующ')) return 'Записали в план на 1999 год.';
    return 'Спасибо за письмо! Ваше мнение очень важно для нас.';
  }

  addBookEntry(name, text) {
    const list = this.getUserBook();
    const entry = {
      name: String(name || '').trim().slice(0, 40) || 'Гость',
      date: this.siteDay,
      text: String(text || '').trim().slice(0, 600),
      reply: this.replyFor(text)
    };
    if (!entry.text) return list;
    list.unshift(entry);
    this.writeJSON(this.bookKey, list.slice(0, 50));
    return list;
  }

  nextVisitor() {
    const n = (this.readJSON(this.counterKey, 0) || 0) + 1;
    this.writeJSON(this.counterKey, n);
    return 21486 + n;
  }

  logo() {
    return `
      <svg class="fargus-logo-svg" viewBox="0 0 120 92" width="120" height="92" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <polygon points="2,2 118,2 118,46 60,90 2,46" fill="#000000" stroke="#ffe600" stroke-width="4"/>
        <text x="60" y="40" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="22" fill="#ffe600">FARGUS</text>
        <text x="60" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#ffe600">MULTIMEDIA</text>
      </svg>
    `;
  }

  cover(g, big = false) {
    return `
      <div class="fargus-cover${big ? ' is-big' : ''}" style="background:${g.color};color:${g.ink}">
        <div class="fargus-cover-top"><span class="fargus-cover-pent"></span>FARGUS</div>
        <div class="fargus-cover-icon">${this.gif(g.icon, big ? 3 : 2)}</div>
        <div class="fargus-cover-title">${this.esc(g.title)}</div>
        <div class="fargus-cover-sticker">ПОЛНОСТЬЮ НА РУССКОМ ЯЗЫКЕ</div>
      </div>
    `;
  }

  renderHome() {
    const games = this.getGames();
    const votes = this.getVotes();
    const fresh = games.slice(0, 8);
    const voted = this.readJSON('win98_fargus_voted', null);
    const visitor = this.nextVisitor();
    return `
      <div class="fargus-ticker"><span>Внимание! Остерегайтесь подделок! Настоящий диск «Фаргус» имеет жёлтый логотип и надпись «Полностью на русском языке». Наши издания продаются только через Steam.</span></div>
      <h2 class="fargus-h">Новинки ноября</h2>
      <table class="fargus-shelf" cellspacing="0">
        ${[0, 4].map(start => `
          <tr>
            ${fresh.slice(start, start + 4).map(g => `
              <td>
                <a class="fargus-cover-link" data-url="${this.baseUrl}/game?id=${g.id}">${this.cover(g)}</a>
                <div class="fargus-shelf-cap">${this.link(`/game?id=${g.id}`, this.esc(g.title))}<br><span>${this.esc(g.orig)}</span></div>
              </td>
            `).join('')}
          </tr>
        `).join('')}
      </table>
      <table class="fargus-two" cellspacing="0">
        <tr>
          <td class="fargus-news">
            <h3>Новости</h3>
            ${this.getNews().map(([d, t]) => `<p><b>${d}</b> ${t}</p>`).join('')}
          </td>
          <td class="fargus-poll">
            <h3>Лучший перевод 1998</h3>
            ${this.renderVoteForm(votes, voted, true)}
          </td>
        </tr>
      </table>
      <div class="fargus-counter">Вы <span class="fargus-odo">${String(visitor).padStart(6, '0')}</span> посетитель с 1 ноября 1998 года</div>
    `;
  }

  renderVoteForm(votes, voted, compact) {
    const opts = [['half-life', 'Период полураспада'], ['doom', 'Рок: Ад на Марсе'], ['gta90', 'Великий автоугон: Свердловск'], ['diablo', 'Дьявол']];
    const total = opts.reduce((s, [k]) => s + (votes[k] || 0), 0) || 1;
    return `
      <form class="fargus-vote-form">
        ${opts.map(([k, label], i) => `
          <label class="fargus-vote-opt">
            <input type="radio" name="fargus_game" value="${k}"${(voted ? voted === k : i === 0) ? ' checked' : ''}>
            ${label}
          </label>
          ${compact ? '' : `<div class="fargus-bar-row"><span class="fargus-bar" style="width:${Math.round((votes[k] || 0) / total * 300)}px"></span> <b id="vote-count-${k}">${votes[k] || 0}</b></div>`}
        `).join('')}
        <div class="fargus-vote-actions">
          <button type="submit" class="fargus-btn fargus-btn-submit-vote">Голосовать</button>
          ${compact ? this.link('/vote', 'Результаты') : ''}
        </div>
        <div class="fargus-vote-msg" role="status">${voted ? 'Ваш голос учтён.' : ''}</div>
      </form>
    `;
  }

  renderCatalog() {
    const games = this.getGames();
    return `
      <h2 class="fargus-h">Каталог изданий 1998 года</h2>
      <p class="fargus-lead">Все издания проверены на Microslop Win 98 и ускорителях 3dfx Voodoo. Номер по каталогу напечатан на обратной стороне коробки.</p>
      <table class="fargus-price" cellspacing="0">
        <tr><th>№ по каталогу</th><th>Русское название</th><th>Оригинал</th><th>CD</th><th>Что переведено</th><th></th></tr>
        ${games.map(g => `
          <tr>
            <td class="fargus-num">${g.num}</td>
            <td>${this.link(`/game?id=${g.id}`, `<b>${this.esc(g.title)}</b>`)}</td>
            <td>${this.esc(g.orig)}</td>
            <td class="fargus-c">${g.cds}</td>
            <td>${g.lang}</td>
            <td><button class="fargus-btn fargus-btn-steam" data-steam="${g.steamId}">В Steam</button></td>
          </tr>
        `).join('')}
      </table>
      <p class="fargus-small">Кнопка «В Steam» открывает страницу игры в клиенте Steam. Если клиента ещё нет, его можно скачать на <a data-url="http://www.steampowered.com">www.steampowered.com</a>.</p>
    `;
  }

  renderGame(id) {
    const g = this.getGames().find(x => x.id === id);
    if (!g) {
      return `<h2 class="fargus-h">Издание не найдено</h2><p class="fargus-lead">Такого номера нет в каталоге. Вернитесь в ${this.link('/catalog', 'каталог')}.</p>`;
    }
    const voices = this.getVoices().filter(v => v.game === g.id);
    return `
      <div class="fargus-crumbs">${this.link('', 'Главная')} &gt; ${this.link('/catalog', 'Каталог')} &gt; ${this.esc(g.title)}</div>
      <table class="fargus-game" cellspacing="0">
        <tr>
          <td class="fargus-game-cover">${this.cover(g, true)}</td>
          <td class="fargus-game-info">
            <h2>${this.esc(g.title)}</h2>
            <table class="fargus-spec" cellspacing="0">
              <tr><td>Оригинал:</td><td>${this.esc(g.orig)}</td></tr>
              <tr><td>№ по каталогу:</td><td>${g.num}</td></tr>
              <tr><td>Дисков:</td><td>${g.cds}</td></tr>
              <tr><td>Перевод:</td><td>${g.lang}</td></tr>
              <tr><td>Озвучка:</td><td>${g.cast}</td></tr>
            </table>
            <button class="fargus-btn fargus-btn-steam" data-steam="${g.steamId}">Открыть в Steam</button>
          </td>
        </tr>
      </table>
      <p class="fargus-text">${g.about}</p>
      <table class="fargus-two" cellspacing="0">
        <tr>
          <td>
            <h3>Переведено</h3>
            <ul class="fargus-checks">${g.done.map(d => `<li>${this.gif('check')} ${d}</li>`).join('')}</ul>
          </td>
          <td>
            <h3>Как мы перевели</h3>
            <table class="fargus-perls" cellspacing="0">
              ${g.perls.map(([en, ru]) => `<tr><td class="fargus-en">${this.esc(en)}</td><td>${this.esc(ru)}</td></tr>`).join('')}
            </table>
            ${voices.map(v => `<button class="fargus-btn fargus-btn-play" data-voice="${v.id}">${this.gif('speaker')} Послушать «${this.esc(v.text)}»</button>`).join('')}
          </td>
        </tr>
      </table>
      <div class="fargus-note"><b>Известные проблемы.</b> ${this.esc(g.issue)}</div>
    `;
  }

  renderQuotes() {
    const games = this.getGames();
    return `
      <h2 class="fargus-h">Голоса «Фаргуса»</h2>
      <p class="fargus-lead">Фрагменты нашей озвучки. Нажмите «Слушать», нужны колонки или наушники.</p>
      <table class="fargus-price" cellspacing="0">
        <tr><th>Фраза</th><th>Откуда</th><th></th></tr>
        ${this.getVoices().map(v => {
          const g = games.find(x => x.id === v.game);
          return `
            <tr>
              <td class="fargus-phrase">«${this.esc(v.text)}»</td>
              <td>${g ? this.link(`/game?id=${g.id}`, this.esc(g.title)) + '<br>' : ''}<span class="fargus-small">${this.esc(v.note)}</span></td>
              <td><button class="fargus-btn fargus-btn-play" data-voice="${v.id}">${this.gif('speaker')} Слушать</button></td>
            </tr>
          `;
        }).join('')}
      </table>
    `;
  }

  getPatches() {
    return [
      { file: 'FARGUS_DOOM98_RUS.TXT', size: '2.4 КБ', kind: 'doom', desc: 'Названия уровней первого эпизода и коды для «Рок: Ад на Марсе».' },
      { file: 'FG_HL_PATCH1.TXT', size: '3.1 КБ', kind: 'hl', desc: 'Исправляет молчащих учёных в «Периоде полураспада» после загрузки сохранения.' },
      { file: 'FG_GTA90_PHONES.TXT', size: '1.2 КБ', kind: 'gta', desc: 'Таксофоны в «Великом автоугоне» снова показывают текст задания.' },
      { file: 'FARGUS_GOLD_CATALOG_1998.TXT', size: '5.8 КБ', kind: 'catalog', desc: 'Каталог всех изданий 1998 года с номерами.' }
    ];
  }

  renderSupport() {
    const faq = [
      ['Игра просит «Вставьте диск 2».', 'Значит, у издания два диска. Сейчас это только «Пиратский квест Лукаса». Второй диск лежит в коробке под первым.'],
      ['Вместо русских букв видны значки.', 'Откройте «Панель управления», затем «Язык и стандарты», и выберите «Русский». После перезагрузки буквы появятся.'],
      ['Персонажи молчат.', 'Проверьте громкость в микшере Win 98 и установите последний патч к игре из списка ниже.'],
      ['Почему DOOM переведён как «Рок»?', 'По словарю doom значит «рок, судьба, гибель». Мы выбрали самое короткое слово.'],
      ['Где купить ваши диски?', 'Издания «Фаргус» продаются только через клиент Steam. Диски на рынках с нашим логотипом мы не выпускали.']
    ];
    return `
      <h2 class="fargus-h">Техническая поддержка</h2>
      <p class="fargus-lead">Прежде чем писать нам, прочитайте ответы на частые вопросы.</p>
      <dl class="fargus-faq">
        ${faq.map(([q, a]) => `<dt>${this.gif('question')} ${q}</dt><dd>${a}</dd>`).join('')}
      </dl>
      <h3 class="fargus-h3">Патчи и файлы</h3>
      <table class="fargus-price" cellspacing="0">
        <tr><th>Файл</th><th>Размер</th><th>Что делает</th><th></th></tr>
        ${this.getPatches().map(p => `
          <tr>
            <td class="fargus-num">${this.gif('disk')} ${p.file}</td>
            <td class="fargus-c">${p.size}</td>
            <td>${p.desc}</td>
            <td><button class="fargus-btn fargus-btn-download" data-file="${p.file}" data-kind="${p.kind}">Скачать</button></td>
          </tr>
        `).join('')}
      </table>
      <div class="fargus-status-log" role="status"></div>
      <p class="fargus-small">Не нашли ответ? Напишите на <a href="mailto:support@goldfargus.ru">support@goldfargus.ru</a> или спросите Скрепыша.</p>
    `;
  }

  renderGuestbook() {
    const list = this.getUserBook().concat(this.getSeedBook());
    return `
      <h2 class="fargus-h">Гостевая книга</h2>
      <p class="fargus-lead">Пишите, что понравилось, что перевести следующим и где мы ошиблись. Администрация отвечает на каждое письмо.</p>
      <form class="fargus-book-form">
        <table cellspacing="0">
          <tr><td><label for="fargus-book-name">Имя:</label></td><td><input type="text" class="fargus-input" id="fargus-book-name" name="name" autocomplete="nickname" maxlength="40" value="Гость"></td></tr>
          <tr><td><label for="fargus-book-text">Сообщение:</label></td><td><textarea class="fargus-input" id="fargus-book-text" name="text" rows="3" maxlength="600"></textarea></td></tr>
          <tr><td></td><td><button type="submit" class="fargus-btn">Добавить запись</button> <span class="fargus-book-msg" role="status"></span></td></tr>
        </table>
      </form>
      <div class="fargus-book">
        ${list.map(e => `
          <div class="fargus-entry">
            <div class="fargus-entry-head"><b>${this.esc(e.name)}</b> &nbsp; ${this.esc(e.date)}</div>
            <div class="fargus-entry-text">${this.esc(e.text)}</div>
            ${e.reply ? `<div class="fargus-entry-reply"><b>Администрация:</b> ${this.esc(e.reply)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderVote() {
    const votes = this.getVotes();
    const voted = this.readJSON('win98_fargus_voted', null);
    return `
      <h2 class="fargus-h">Голосование: лучший перевод 1998 года</h2>
      <p class="fargus-lead">Победитель получит наклейку «Выбор читателей» на коробку следующего тиража.</p>
      <div class="fargus-vote-full">${this.renderVoteForm(votes, voted, false)}</div>
    `;
  }

  renderSite(url) {
    const { path, params } = this.parseUrl(url);
    const nav = [
      ['/', '', 'Новинки'],
      ['/catalog', '/catalog', 'Каталог'],
      ['/quotes', '/quotes', 'Голоса'],
      ['/support', '/support', 'Техподдержка'],
      ['/guestbook', '/guestbook', 'Гостевая'],
      ['/vote', '/vote', 'Голосование']
    ];
    let content;
    let active = path;
    if (path === '/catalog') content = this.renderCatalog();
    else if (path === '/game') { content = this.renderGame(params.get('id')); active = '/catalog'; }
    else if (path === '/quotes') content = this.renderQuotes();
    else if (path === '/support' || path === '/patches') { content = this.renderSupport(); active = '/support'; }
    else if (path === '/guestbook') content = this.renderGuestbook();
    else if (path === '/vote') content = this.renderVote();
    else { content = this.renderHome(); active = '/'; }

    return `
      <div class="fargus-page">
        <table class="fargus-frame" cellspacing="0">
          <tr>
            <td class="fargus-head">
              <table cellspacing="0" class="fargus-head-row">
                <tr>
                  <td class="fargus-logo">${this.link('', this.logo())}</td>
                  <td class="fargus-brand">
                    <div class="fargus-name">ФАРГУС МУЛЬТИМЕДИА</div>
                    <div class="fargus-slogan">Только полный и качественный перевод</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="fargus-nav">
              ${nav.map(([key, p, label]) => `<a data-url="${this.baseUrl}${p}" class="fargus-nav-link${key === active ? ' is-active' : ''}">${label}</a>`).join('')}
            </td>
          </tr>
          <tr><td class="fargus-main">${content}</td></tr>
          <tr>
            <td class="fargus-footer">
              <div>${nav.map(([, p, label]) => this.link(p, label)).join(' | ')}</div>
              <div>&copy; 1998 «Фаргус Мультимедиа». Сайт лучше смотреть в Microslop Internet Explorer при разрешении 800x600.</div>
              <div><button class="fargus-btn fargus-btn-clippy">Спросить Скрепыша</button></div>
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

  playQuoteTone(id) {
    const voice = this.getVoices().find(v => v.id === id);
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const Utter = typeof window !== 'undefined' ? window.SpeechSynthesisUtterance : null;
    if (voice && synth && Utter) {
      try {
        synth.cancel();
        const u = new Utter(voice.text);
        u.lang = 'ru-RU';
        u.pitch = voice.pitch;
        u.rate = voice.rate;
        const ru = synth.getVoices().find(v => /^ru/i.test(v.lang));
        if (ru) u.voice = ru;
        synth.speak(u);
        return;
      } catch (e) {}
    }
    this.initAudio();
    if (!this.audioContext) {
      if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
      return;
    }
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const tones = { cool: [220, 180, 260, 200, 150], wasted: [130, 110, 90, 70], full: [330, 440, 550, 660, 880], stay: [260, 310, 220, 180, 140] }[id] || [440, 330, 220];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.08, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.2);
    });
  }

  patchText(kind) {
    const line = '=====================================================';
    if (kind === 'doom') {
      return `${line}\n  ФАРГУС МУЛЬТИМЕДИА: «РОК: АД НА МАРСЕ»\n${line}\nНазвания уровней первого эпизода:\n  E1M1  Ангар\n  E1M9  Секретная база\n\nКоды вводятся по-английски во время игры:\n  IDDQD   Режим бога\n  IDKFA   Всё оружие, патроны и три ключа\n  IDCLIP  Проход сквозь стены\n  IDDT    Вся карта (нажмите на карте)\n\nПолностью на русском языке!`;
    }
    if (kind === 'hl') {
      return `${line}\n  ФАРГУС МУЛЬТИМЕДИА: ПАТЧ 1 К «ПЕРИОДУ ПОЛУРАСПАДА»\n${line}\nИсправлено:\n  1. Учёные молчат после загрузки сохранения.\n  2. Диктор монорельса читал объявление дважды.\n  3. Надпись «Каскадный отзвук» не помещалась в окно.\n\nУстановка: закройте игру и запустите её снова.`;
    }
    if (kind === 'gta') {
      return `${line}\n  ФАРГУС МУЛЬТИМЕДИА: ТАКСОФОНЫ ДЛЯ «ВЕЛИКОГО АВТОУГОНА»\n${line}\nИсправлено:\n  1. Таксофон звонит, а текст задания не появляется.\n  2. Сообщение «ПОТРАЧЕНО» мигало два раза.\n\nСообщение «ПОТРАЧЕНО» оставлено по просьбам игроков.`;
    }
    return `${line}\n  ФАРГУС МУЛЬТИМЕДИА: КАТАЛОГ ИЗДАНИЙ 1998 ГОДА\n${line}\n${this.getGames().map(g => `${g.num}  ${g.title} (${g.orig}), CD: ${g.cds}`).join('\n')}\n\nВсе издания продаются в клиенте Steam: www.steampowered.com`;
  }

  savePatch(fileName) {
    const patch = this.getPatches().find(p => p.file === fileName);
    if (!patch) return null;
    if (window.vfs && window.vfs.writeFile) {
      window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Downloads'], patch.file, this.patchText(patch.kind));
    }
    if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
    return patch.file;
  }

  attachEvents(win, container, url) {
    const { path } = this.parseUrl(url);

    container.querySelectorAll('.fargus-btn-steam').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.gameManager && window.gameManager.showInSteam) window.gameManager.showInSteam(btn.dataset.steam);
        else if (window.appIE) window.appIE.navigate(win, 'http://www.steampowered.com');
      });
    });

    container.querySelectorAll('.fargus-btn-play').forEach(btn => {
      btn.addEventListener('click', () => this.playQuoteTone(btn.dataset.voice));
    });

    container.querySelectorAll('.fargus-btn-download').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileName = this.savePatch(btn.dataset.file);
        if (!fileName) return;
        const log = container.querySelector('.fargus-status-log');
        if (log) log.innerHTML = `${this.gif('check')} Файл <b>${this.esc(fileName)}</b> сохранён в C:\\My Documents\\Downloads`;
      });
    });

    const voteForm = container.querySelector('.fargus-vote-form');
    if (voteForm) {
      voteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const checked = voteForm.querySelector('input[name="fargus_game"]:checked');
        if (!checked) return;
        this.saveVote(checked.value);
        if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
        if (window.appIE) window.appIE.navigate(win, `${this.baseUrl}/vote`);
      });
    }

    const bookForm = container.querySelector('.fargus-book-form');
    if (bookForm) {
      bookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = container.querySelector('#fargus-book-name');
        const text = container.querySelector('#fargus-book-text');
        const msg = container.querySelector('.fargus-book-msg');
        if (!text || !text.value.trim()) {
          if (msg) msg.textContent = 'Напишите сообщение.';
          return;
        }
        this.addBookEntry(name ? name.value : '', text.value);
        if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
        if (window.appIE) window.appIE.renderPage(win, `${this.baseUrl}/guestbook`);
      });
    }

    const btnClippy = container.querySelector('.fargus-btn-clippy');
    if (btnClippy) {
      btnClippy.addEventListener('click', () => {
        if (window.appClippy) {
          window.appClippy.wakeUp();
          window.appClippy.onNavigateIE(this.baseUrl + (path === '/' ? '' : path), 'fargus', '«Фаргус Мультимедиа»');
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.fargusSite = new FargusSite();
}
