class RetroSitesEngine {
  constructor() {
    this.libRuTheme = 'light';
    this.libRuFontSize = '13px';
    this.activeLibRuBook = 'strugatsky';

    this.igroActiveTab = 'main';
    this.igroActiveVideo = 'content/igromania/AVPRED.mp4';

    this.fidoActiveEcho = 'ru.game';
    this.fidoActiveMsgId = null;
    this.fidoStorageKey = 'win98_fidonet_messages_v1';

    this.spaceJamActiveTab = 'main';
    this.y2kTestRunning = false;
    this.y2kTestProgress = 0;
    this.y2kCertified = false;

    this.initFidoStorage();
  }

  getWebRingSites() {
    return [
      { name: "WebSeeker 98", url: "http://www.search98.com" },
      { name: "Рамблер '98", url: "http://www.rambler98.ru" },
      { name: "Яndex 1998", url: "http://www.yandex.ru" },
      { name: "Интерпедия (Interpedia)", url: "http://www.interpedia.org" },
      { name: "Библиотека Мошкова (Lib.ru)", url: "http://www.lib.ru" },
      { name: "Журнал «Игромания»", url: "http://www.igromania.ru" },
      { name: "Cheat Code Central", url: "http://www.cheatcc.com" },
      { name: "Winamp Skins Archive", url: "http://skins.winamp.com" },
      { name: "Space Jam 1996", url: "http://www.spacejam.com" },
      { name: "Mirabilis ICQ Web-Pager", url: "http://www.icq.com" },
      { name: "Y2K Survival Center", url: "http://www.y2k-countdown.org" },
      { name: "FidoNet Web-Шлюз", url: "http://fido.relcom.ru" },
      { name: "Microslop Win 98", url: "http://www.microslop.com" },
      { name: "SoftStore '98", url: "http://www.softstore98.com" },
      { name: "Steam", url: "http://www.steampowered.com" },
      { name: "ThemeWorld '98", url: "http://www.themeworld98.com" },
      { name: "MP3 Vault '98", url: "http://www.mp3vault98.com" },
      { name: "Киномания '98", url: "http://www.kinomania98.ru" },
      { name: "WebCinema '98", url: "http://www.webcinema98.com" },
      { name: "GamerZone Forum", url: "http://forum.games98.com" },
      { name: "Чат «Кроватка '98»", url: "http://chat.krovatka98.ru" },
      { name: "Анекдот.ru 1998", url: "http://www.anekdot98.ru" },
      { name: "3dfx Voodoo Zone", url: "http://www.3dfx-zone.com" },
      { name: "AntiVirus Lab", url: "http://www.antivirus98.com" },
      { name: "Blender 3D", url: "http://www.blender3d.com" },
      { name: "Di Gi Charat Fan Club", url: "http://www.digicharat.net" },
      { name: "GeoCities '98", url: "http://www.geocities.com" },
      { name: "Вебмастер Дима", url: "http://www.geocities.com/~dima" },
      { name: "Retro-Web Portal", url: "http://www.retro-web.net" },
      { name: "«Фаргус Мультимедиа»", url: "http://www.goldfargus.ru" },
      { name: "Аукцион «Молоток '98»", url: "http://www.molotok98.ru" },
      { name: "Журнал «Хакер '98»", url: "http://www.xakep98.ru" },
      { name: "Студия «Мульт.ру»", url: "http://www.mult98.ru" },
      { name: "Emu-Land", url: "http://www.emuland98.ru" },
      { name: "Архив «Истина рядом»", url: "http://www.xfiles98.ru" }
    ];
  }

  mailContact(addr, label) {
    const icon = window.webGif ? window.webGif('mail') : '';
    return `<p class="retro-mail-contact">${label}: <a class="web-mail-link" href="mailto:${addr}">${icon}${addr}</a></p>`;
  }

  renderWebRing(currentUrl) {
    const sites = this.getWebRingSites();
    const gif = (name, scale) => window.webGif ? window.webGif(name, scale) : '';
    const cleanCurrent = (currentUrl || '').toLowerCase();
    let idx = sites.findIndex(s => cleanCurrent.includes(s.url.replace('http://', '').replace('https://', '')));
    if (idx === -1) idx = 0;

    const prevSite = sites[(idx - 1 + sites.length) % sites.length];
    const nextSite = sites[(idx + 1) % sites.length];
    const randSite = sites[Math.floor(Math.random() * sites.length)];

    return `
      <table class="webring-widget" cellspacing="0">
        <tr>
          <td class="webring-logo">${gif('globe', 2)}</td>
          <td>
            <div class="webring-header">Всемирное Кольцо Сайтов &laquo;The Retro WebRing 1998&raquo;</div>
            <div class="webring-note">Этот узел входит в кольцо истории Интернета. Участников: <b>${sites.length}</b>.</div>
            <div class="webring-links">
              [ <a data-url="${prevSite.url}" title="${prevSite.name}">&laquo; Пред.</a> |
              <a data-url="${randSite.url}">Случайный узел</a> |
              <a data-url="${nextSite.url}" title="${nextSite.name}">След. &raquo;</a> ]
            </div>
          </td>
          <td class="webring-logo">${gif('globe', 2)}</td>
        </tr>
      </table>
    `;
  }

  getLibRuBooks() {
    return {
      'strugatsky': {
        author: 'Аркадий и Борис Стругацкие',
        title: 'Понедельник начинается в субботу (Отрывок)',
        cat: 'Отечественная фантастика',
        year: '1965',
        text: `ПОВЕСТЬ-СКАЗКА ДЛЯ НАУЧНЫХ СОТРУДНИКОВ МЛАДШЕГО ВОЗРАСТА

Глава 1. История с диваном-транслятором

Я приближался к месту моего назначения. Вокруг меня, прижимаясь к самой дороге, зеленел дремучий северный лес. Солнце уже садилось, и длинные тени ложились через асфальт.
Я ехал в Соловец. Меня командировали из Ленинграда в Научно-исследовательский институт Чародейства и Волшебства (НИИЧАВО).
На опушке стоял странный деревянный дом с покосившейся вывеской: «ИЗНАКУРНОЖ» (Избушка на Курьих Ножках).
По двору расхаживал громадный полосатый кот. Завидев мою машину, он подошел, поднял хвост трубой и произнес басом:
— Чего глядишь, парень? Спичек не найдется?
Я остолбенел. Кот покачал головой:
— Ну вот, опять заезжий программист в ступор впал. Тоже мне, электронщики двадцать первого века...`
      },
      'lukyanenko': {
        author: 'Сергей Лукьяненко',
        title: 'Лабиринт отражений (Диптаун и Глубина)',
        cat: 'Отечественная фантастика / Киберпанк',
        year: '1997',
        text: `ЛАБИРИНТ ОТРАЖЕНИЙ

— Глубина-глубина, я не твой...
Отпусти меня, глубина.

Я вышел из Глубины. Обычный серый мир московской квартиры встретил меня запахом остывшего кофе и скрипом дисковода 3.5. На экране старенького монитора мигал курсор операционной системы Win 98.
В Диптауне все иначе. Там небо цвета переливающегося кристалла, башни «Виртуальной России», сверкающие неоном дискотеки Alibi и бескрайние катакомбы лабиринта.
Большинство людей погружаются в сеть через программу «дип-программу» Дмитрия Дибенко и верят всему, что видят, словно сну наяву. Лишь дайверы помнят, что они сидят дома в кресле перед клавиатурой.`
      },
      'gibson': {
        author: 'Уильям Гибсон',
        title: 'Нейромант (Neuromancer)',
        cat: 'Зарубежный киберпанк',
        year: '1984',
        text: `НЕЙРОМАНТ

Небо над портом было цвета экрана телевизора, включенного на мертвый канал.
— Дело не в том, что я подсел на стимуляторы, — сказал Кейс, проверяя разъем своей кибердеки Ono-Sendai Cyberspace 7.
Матрица зародилась в примитивных аркадных автоматах, в графических программах раннего военного ведомства. Это была согласующая галлюцинация, ежедневно испытываемая миллиардами операторов по всему миру, графическое представление данных, абстрагированных из банков каждого компьютера человеческой системы.`
      },
      'mentor': {
        author: 'The Mentor (Ллойд Блэнкеншип)',
        title: 'Манифест хакера (Совесть хакера)',
        cat: 'Хакерские манифесты',
        year: '1986',
        text: `МАНИФЕСТ ХАКЕРА
(8 января 1986 года, после ареста)

Еще одного поймали сегодня, об этом трубят все газеты: «Подросток арестован за компьютерное преступление».
Черт возьми, они опять ничего не поняли!
Вы судите нас за то, что мы исследуем мир, пока вы торгуете им на биржах.
Наше преступление — это любопытство.
Наше преступление — это стремление знать больше, чем положено по школьной программе.
Наше преступление в том, что мы судим людей по тому, что они думают и умеют, а не по цвету их кожи, религии или размеру банковского счета.
Да, я хакер. Мой мир простирается от телефонной линии до удаленного сервера. И если вы попытаетесь остановить нас — на смену придут миллионы других.`
      },
      'murphy': {
        author: 'Артур Блох',
        title: 'Законы Мёрфи для программистов и сисадминов',
        cat: 'Компьютерный фольклор',
        year: '1998',
        text: `ЗАКОНЫ МЁРФИ ДЛЯ КОМПЬЮТЕРЩИКОВ:

1. Первый закон отладки:
   Ошибки всегда прячутся в том куске кода, который «точно работает и в проверке не нуждается».
2. Закон сохранения багов:
   Исправление одной ошибки порождает от двух до пяти новых, из которых как минимум одна приводит к падению системы в Синий Экран Смерти (BSOD).
3. Принцип резервного копирования:
   Необходимость в резервной копии возрастает пропорционально времени, прошедшему с момента последней записи на дискету.
4. Закон сетевого шнура:
   Любой кабель витой пары, брошенный через коридор серверной, притягивает ногу уборщицы с силой магнита в 10 Тесла.
5. Правило 90/10:
   Первые 90% кода занимают 90% отведенного времени. Оставшиеся 10% кода занимают другие 90% времени разработки.`
      }
    };
  }

  renderLibRu(url) {
    const books = this.getLibRuBooks();
    const active = books[this.activeLibRuBook] || books['strugatsky'];
    const rule = '-'.repeat(63);

    return `
      <div class="libru-container ${this.libRuTheme === 'dark' ? 'theme-dark' : ''}">
        <table class="libru-top" cellspacing="0">
          <tr>
            <td><a class="libru-logo" data-url="http://www.lib.ru">Lib.Ru</a>: <b class="libru-title">Библиотека Максима Мошкова</b></td>
            <td class="libru-top-right">сервер lib.ru / Relcom &middot; с ноября 1994 &middot; кодировка Win-1251</td>
          </tr>
        </table>
        <hr>
        <p class="libru-sections">
          ${Object.keys(books).map(k => `<a class="libru-nav-item ${this.activeLibRuBook === k ? 'active' : ''}" data-book="${k}">${books[k].author}</a>`).join(' | ')}
        </p>
        <hr>
        <h2 class="libru-h2">${active.author}. ${active.title}</h2>
        <p class="libru-tools">
          [<a class="btn-libru-open-notepad">Открыть в Блокноте</a>]
          [<a class="btn-libru-save-txt">Скачать TXT в &laquo;Мои документы&raquo;</a>]
          [<a class="btn-libru-toggle-theme">${this.libRuTheme === 'dark' ? 'Дневной режим' : 'Ночной режим'}</a>]
          &nbsp; Шрифт:
          <a class="btn-libru-font" data-size="11px">[A-]</a>
          <a class="btn-libru-font" data-size="13px">[A]</a>
          <a class="btn-libru-font" data-size="16px">[A+]</a>
        </p>
<pre class="libru-article-body" style="font-size:${this.libRuFontSize};"> ${rule}
  ${active.cat}, ${active.year}
 ${rule}

${active.text}
</pre>
        <hr>
        <p class="libru-foot">Тексты размещены в ознакомительных некоммерческих целях. &copy; Библиотека Максима Мошкова, 1994-1998.</p>
        ${this.mailContact('texts@lib.ru', 'Прислать набранный текст или спросить о книге')}
        ${this.renderWebRing('http://www.lib.ru')}
      </div>
    `;
  }

  attachLibRuEvents(win, container) {
    container.querySelectorAll('.libru-nav-item[data-book]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.activeLibRuBook = btn.dataset.book;
        if (window.appIE) window.appIE.renderPage(win, 'http://www.lib.ru');
      });
    });

    const books = this.getLibRuBooks();
    const active = books[this.activeLibRuBook] || books['strugatsky'];

    const btnNotepad = container.querySelector('.btn-libru-open-notepad');
    if (btnNotepad) {
      btnNotepad.addEventListener('click', () => {
        if (window.appNotepad) {
          const fileName = `${active.author} - ${active.title}.txt`.replace(/[\\/:*?"<>|]/g, '');
          window.appNotepad.open(fileName, active.text);
          if (window.soundSys) window.soundSys.playDing();
        }
      });
    }

    const btnSave = container.querySelector('.btn-libru-save-txt');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        if (window.vfs) {
          const fileName = `${active.title.slice(0, 30)}.txt`.replace(/[\\/:*?"<>|]/g, '');
          window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], fileName, active.text);
          if (window.soundSys) window.soundSys.playDing();
          window.winManager.openDialog({
            title: 'Библиотека Мошкова',
            icon: 'info',
            message: `Файл <b>${fileName}</b> успешно сохранён в папку «Мои документы»!`
          });
        }
      });
    }

    const btnTheme = container.querySelector('.btn-libru-toggle-theme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        this.libRuTheme = this.libRuTheme === 'dark' ? 'light' : 'dark';
        if (window.appIE) window.appIE.renderPage(win, 'http://www.lib.ru');
      });
    }

    container.querySelectorAll('.btn-libru-font[data-size]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.libRuFontSize = btn.dataset.size;
        const body = container.querySelector('.libru-article-body');
        if (body) body.style.fontSize = this.libRuFontSize;
      });
    });
  }

  getIgromaniaVideos() {
    return [
      {
        id: 'avp',
        title: 'Aliens versus Predator (1998)',
        src: 'content/igromania/AVPRED.mp4',
        genre: '3D Action / FPS',
        dev: 'Rebellion Developments / Fox',
        desc: 'Эксклюзивный геймплей долгожданного трехстороннего шутера. Игра за Морпеха, Чужого и Хищника с тепловизором!'
      },
      {
        id: 'turok2',
        title: 'Turok 2: Seeds of Evil',
        src: 'content/igromania/TUROK2.mp4',
        genre: '3D Action / 3dfx Glide',
        dev: 'Acclaim Studios Austin',
        desc: 'Потрясающие эффекты сглаживания и освещения на 3dfx Voodoo 2. Мозгобур Cerebral Bore в действии!'
      },
      {
        id: 'heretic',
        title: 'Heretic II (Raven Software)',
        src: 'content/igromania/heretic.mp4',
        genre: '3rd Person Action / Quake II Engine',
        dev: 'Raven Software / Activision',
        desc: 'Возвращение эльфа Корвуса на движке id Tech 2 с видом от третьего лица и потрясающей магией.'
      },
      {
        id: 'metro20',
        title: 'Прототип Метро-2 (Эксклюзив CD)',
        src: 'content/igromania/metro20.mp4',
        genre: 'Tactical Shooter',
        dev: 'Отечественная разработка',
        desc: 'Секретные тоннели правительственной подземки Москвы, бункеры Д-6 и мрачная атмосфера советской тайны.'
      },
      {
        id: 'ascension',
        title: 'Ultima IX: Ascension',
        src: 'content/igromania/ascension.mp4',
        genre: '3D RPG',
        dev: 'Origin Systems / Ричард Гэрриот',
        desc: 'Финальная часть саги Аватара в революционном полностью трехмерном мире Британии.'
      },
      {
        id: 'blckstn',
        title: 'The Blackstone Chronicles',
        src: 'content/igromania/Blckstn.mp4',
        genre: 'Adventure / Quest',
        dev: 'Legend Entertainment / Mindscape',
        desc: 'Психологический триллер в заброшенной психиатрической лечебнице по роману Джона Сола.'
      }
    ];
  }

  renderIgromania(url) {
    const videos = this.getIgromaniaVideos();
    const currentVideo = videos.find(v => v.src === this.igroActiveVideo) || videos[0];
    const gif = (name, scale) => window.webGif ? window.webGif(name, scale) : '';
    const tabs = [['main', 'Главная'], ['cd', 'CD-приложение'], ['hotline', 'Горячая линия'], ['cheats', 'Читерский уголок']];
    const panel = (icon, title, body) => `
      <table class="igro-panel" cellspacing="0">
        <tr><td class="igro-panel-title">${gif(icon)} ${title}</td></tr>
        <tr><td class="igro-panel-body">${body}</td></tr>
      </table>`;

    let content;
    if (this.igroActiveTab === 'cd') {
      content = panel('cd', 'Видео с компакт-диска', `
        <div class="igro-player"><video id="igro-main-player" src="${currentVideo.src}" controls autoplay></video></div>
        <b class="igro-hl">${currentVideo.title}</b><br>
        <span class="igro-dim">${currentVideo.genre} &middot; ${currentVideo.dev}</span>
        <p>${currentVideo.desc}</p>`) + panel('vhs', `Все ролики диска (${videos.length})`, `
        <table class="igro-list" cellspacing="0">
          ${videos.map(v => `
          <tr class="${v.src === currentVideo.src ? 'is-current' : ''}">
            <td>${gif('film')}</td>
            <td><b>${v.title}</b><br><span class="igro-dim">${v.genre}</span></td>
            <td class="igro-list-btn"><button class="win-btn btn-igro-select-video" data-src="${v.src}">${v.src === currentVideo.src ? 'Сейчас играет' : 'Смотреть'}</button></td>
          </tr>`).join('')}
        </table>`);
    } else if (this.igroActiveTab === 'hotline') {
      content = panel('phone', 'Горячая линия: письма читателей', `
        <p><b class="igro-q">Стоит ли брать Riva TNT вместо двух Voodoo 2 в SLI?</b><br><span class="igro-dim">Дмитрий, Самара (Celeron 300A @ 450, 64 МБ)</span></p>
        <p><b>Отвечает редакция:</b> Riva TNT с 16 МБ хороша в 32-битном цвете и высоких разрешениях, но Glide от 3dfx пока вне конкуренции в Unreal и Quake II. Две Voodoo 2 в SLI дают 1024x768 при 60 кадрах, однако обойдутся заметно дороже.</p>
        <hr class="igro-hr">
        <p><b class="igro-q">В Fallout 2 пропадает багажник Хайвеймена!</b><br><span class="igro-dim">Станислав, Москва</span></p>
        <p><b>Отвечает редакция:</b> Это известная ошибка версии 1.00 при въезде в Нью-Рино. Поставьте патч 1.02 с нашего диска, раздел &laquo;Патчи&raquo;.</p>`);
    } else if (this.igroActiveTab === 'cheats') {
      content = panel('bolt', 'Читерский уголок', `
        <p><b class="igro-hl">DOOM 98:</b> во время игры наберите <code>IDDQD</code> (бессмертие) или <code>IDKFA</code> (всё оружие и ключи). Раскладка английская.</p>
        <p><b class="igro-hl">GTA: Екатеринбург '90:</b> слово <code>TANK</code> ставит перед вами Т-34-85, <code>NOCOPS</code> снимает розыск.</p>
        <p><b class="igro-hl">F7:</b> в «Зове Припяти 98», «Нижнем Сити», Forza и The Sims 3 эта клавиша открывает меню разработчиков. В «Тени Чернобыля 98» она загружает быстрое сохранение, будьте осторожны.</p>
        <p>${gif('arrow')} <a data-url="http://www.cheatcc.com">Все проверенные коды на Cheat Code Central</a></p>`);
    } else {
      content = panel('flame', 'Тема номера: триумф Half-Life и Fallout 2', `
        <p>Ноябрь 1998 года войдёт в историю как &laquo;золотой месяц&raquo;! Valve выпустила <b>Half-Life</b> &mdash; шутер, который рассказывает историю без единого ролика. А Black Isle подарила нам <b>Fallout 2</b> &mdash; постапокалипсис невиданной глубины.</p>
        <p class="igro-verdict"><b>Наш вердикт:</b> Half-Life &mdash; 98%, Fallout 2 &mdash; 96%. Обе игры получают &laquo;Выбор редакции&raquo;.</p>`) + panel('film', 'Лучшие ролики с компакт-диска', `
        <table class="igro-list" cellspacing="0">
          ${videos.slice(0, 3).map(v => `
          <tr>
            <td>${gif('film')}</td>
            <td><b>${v.title}</b><br><span class="igro-dim">${v.genre} &middot; ${v.dev}</span></td>
            <td class="igro-list-btn"><button class="win-btn btn-igro-play-direct" data-src="${v.src}">Смотреть ролик</button></td>
          </tr>`).join('')}
        </table>`);
    }

    return `
      <div class="igro-container">
        <div class="igro-page">
          <table class="igro-banner" cellspacing="0">
            <tr>
              <td>
                <div class="igro-logo-text">ИГРОМАНИЯ</div>
                <div class="igro-sub">Компьютерно-игровой журнал &middot; выпуск №11, ноябрь 1998</div>
              </td>
              <td class="igro-banner-cd">
                <button class="win-btn btn-igro-open-cd">${gif('cd')} Вставить CD &laquo;Игромании&raquo;</button>
              </td>
            </tr>
          </table>
          <div class="igro-nav-bar">
            ${tabs.map(([id, label]) => `<a class="igro-nav-btn ${this.igroActiveTab === id ? 'active' : ''}" data-tab="${id}">${label}</a>`).join(' | ')}
          </div>
          <table class="igro-content-grid" cellspacing="0">
            <tr>
              <td class="igro-main-col">${content}</td>
              <td class="igro-side-col">
                ${panel('cup', 'Топ-5 месяца', `
                  <ol class="igro-top">
                    <li><b>Half-Life</b> &mdash; 98%</li>
                    <li><b>Fallout 2</b> &mdash; 96%</li>
                    <li><b>StarCraft: Brood War</b> &mdash; 95%</li>
                    <li><b>Unreal</b> &mdash; 93%</li>
                    <li><b>NFS III: Hot Pursuit</b> &mdash; 91%</li>
                  </ol>`)}
                ${panel('cd', 'Диск номера', `
                  <p>На золотом CD (650 МБ): 16 демоверсий, 6 роликов в MPEG-1, патчи и драйверы DirectX 6.0.</p>
                  <button class="win-btn btn-igro-open-cd">Запустить CD</button>`)}
                <p class="igro-counter">Вы <span class="web-counter">${[...'021487'].map(d => `<span>${d}</span>`).join('')}</span> посетитель</p>
              </td>
            </tr>
          </table>
          ${this.mailContact('post@igromania.ru', 'Письма в рубрику «Почта» и на «Горячую линию»')}
          ${this.renderWebRing('http://www.igromania.ru')}
        </div>
      </div>
    `;
  }

  attachIgromaniaEvents(win, container) {
    container.querySelectorAll('.igro-nav-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.igroActiveTab = btn.dataset.tab;
        if (window.appIE) window.appIE.renderPage(win, 'http://www.igromania.ru');
      });
    });

    container.querySelectorAll('.btn-igro-open-cd').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.appIgroman) {
          window.appIgroman.open();
          if (window.soundSys) window.soundSys.playDing();
        }
      });
    });

    container.querySelectorAll('.btn-igro-select-video, .btn-igro-play-direct').forEach(btn => {
      btn.addEventListener('click', () => {
        this.igroActiveVideo = btn.dataset.src;
        this.igroActiveTab = 'cd';
        if (window.appIE) window.appIE.renderPage(win, 'http://www.igromania.ru');
      });
    });
  }

  getWinampSkinsList() {
    return window.winampSkins || [];
  }

  getWinampArchiveTracks() {
    return [
      { artist: 'Harry Enfield', title: "Loadsamoney (Doin' Up the House)", src: 'content/music/Loadsamoney.mp3', info: 'MP3, 128 кбит/с, 3:48' },
      { artist: 'Nullsoft', title: "Winamp Intro (It really whips the llama's ass!)", src: 'content/music/Intro.mp3', info: 'MP3, 128 кбит/с, 0:05' },
      { artist: 'Microslop', title: 'Canyon', src: '[Standard MIDI File: Canyon.mid - Win 98 Sound Track]', info: 'MIDI, звучит через SoundBlaster' },
      { artist: 'Microslop', title: 'Passport', src: '[Standard MIDI File: Passport.mid - Win 98 Sound Track]', info: 'MIDI, звучит через SoundBlaster' }
    ];
  }

  formatWinampCount(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  }

  winampSkinState(skin) {
    const player = window.appWinamp;
    return {
      active: !!player && player.currentSkin === skin.id,
      installed: skin.id === 'classic' || (!!player && typeof player.isSkinInstalled === 'function' && player.isSkinInstalled(skin.id))
    };
  }

  renderWinampPlayerPreview(skin, animated) {
    const levels = [62, 84, 96, 78, 88, 70, 58, 74, 52, 60, 44, 50, 36, 30, 22, 14];
    const eq = [70, 62, 55, 45, 40, 48, 58, 66, 70, 74];
    const key = (path) => `<span class="wsk-p-key"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="${path}"/></svg></span>`;
    return `
      <div class="wsk-player wa-skin-${skin.id}${animated ? ' is-live' : ''}" aria-hidden="true">
        <div class="wsk-p-title"><span class="wsk-p-menu"></span><span class="wsk-p-name">WinAmp 98 Pro</span><span class="wsk-p-ctl"><i></i><i></i><i></i></span></div>
        <div class="wsk-p-plate">
          <div class="wsk-p-lcd">
            <div class="wsk-p-clock"><svg viewBox="0 0 10 10"><path d="M2 1v8l7-4z"/></svg>01:42</div>
            <div class="wsk-p-bars">${levels.map((level, i) => `<i style="height:${level}%; animation-delay:-${(i * 0.13).toFixed(2)}s"></i>`).join('')}</div>
            <div class="wsk-p-info"><b>128</b> kbps <b>44</b> kHz <span>stereo</span></div>
            <div class="wsk-p-ticker">2. Harry Enfield - Loadsamoney</div>
          </div>
          <div class="wsk-p-seek"><b></b></div>
          <div class="wsk-p-deck">
            ${key('M1 1h2v8H1zM9 1v8L3 5z')}${key('M2 1v8l7-4z')}${key('M2 1h2v8H2zM6 1h2v8H6z')}${key('M2 2h6v6H2z')}${key('M1 1v8l6-4zM7 1h2v8H7z')}
            <span class="wsk-p-toggles"><span class="wsk-p-tg is-on">EQ</span><span class="wsk-p-tg is-on">PL</span></span>
          </div>
        </div>
        <div class="wsk-p-plate wsk-p-eq">${eq.map(v => `<i><b style="bottom:${v}%"></b></i>`).join('')}</div>
        <div class="wsk-p-pl">
          <div>1. Nullsoft - Winamp Intro<span>0:05</span></div>
          <div class="is-current is-selected">2. Harry Enfield - Loadsamoney<span>3:48</span></div>
          <div>3. Canyon<span>MIDI</span></div>
        </div>
      </div>`;
  }

  renderWinampShowcase(skin) {
    const { active, installed } = this.winampSkinState(skin);
    let status = `После скачивания файл <b>${skin.file}</b> ляжет в C:\\Program Files\\Winamp\\Skins, а скин появится в меню плеера «Скины...».`;
    if (skin.id === 'classic') status = 'Базовый скин встроен в WinAmp 98 Pro, его не нужно скачивать.';
    else if (installed) status = `Скачан: C:\\Program Files\\Winamp\\Skins\\${skin.file}. Выбрать его можно в меню плеера «Скины...» (Alt+S).`;
    if (active) status = 'Этот скин сейчас надет на ваш WinAmp.';

    return `
      <div class="wsk-stage">${this.renderWinampPlayerPreview(skin, true)}</div>
      <div class="wsk-details">
        <h2 class="wsk-name">${skin.name}</h2>
        <div class="wsk-author">автор ${skin.author}, ${skin.date}</div>
        <p class="wsk-desc">${skin.desc}</p>
        <dl class="wsk-facts">
          <dt>Файл</dt><dd>${skin.file}</dd>
          <dt>Размер</dt><dd>${skin.size}</dd>
          <dt>Скачиваний</dt><dd>${this.formatWinampCount(skin.downloads)}</dd>
        </dl>
        <div class="wsk-actions">
          <button type="button" class="win-btn wsk-apply" data-wsk="apply" data-skin="${skin.id}"${active ? ' disabled' : ''}>${active ? 'Уже на плеере' : 'Применить в Winamp'}</button>
          ${skin.id === 'classic' ? '' : `<button type="button" class="win-btn" data-wsk="download" data-skin="${skin.id}"${installed ? ' disabled' : ''}>${installed ? 'Скачан' : 'Скачать .wsz'}</button>`}
        </div>
        <p class="wsk-status">${status}</p>
      </div>`;
  }

  renderWinampShelf(selectedId) {
    return this.getWinampSkinsList().map(skin => {
      const { active, installed } = this.winampSkinState(skin);
      let note = skin.author;
      if (skin.id === 'classic') note = 'Встроен в плеер';
      else if (installed) note = 'Скачан';
      if (active) note = 'Сейчас на плеере';
      const selected = skin.id === selectedId;
      return `
        <div class="wsk-thumb${selected ? ' is-selected' : ''}${active ? ' is-active' : ''}" role="button" tabindex="0" aria-pressed="${selected}" data-wsk="select" data-skin="${skin.id}">
          <div class="wsk-thumb-frame">${this.renderWinampPlayerPreview(skin, false)}</div>
          <div class="wsk-thumb-name">${skin.name}</div>
          <div class="wsk-thumb-note">${note}</div>
        </div>`;
    }).join('');
  }

  renderWinampTracks() {
    const player = window.appWinamp;
    return this.getWinampArchiveTracks().map(track => {
      const queued = !!player && player.playlist.some(item => item.src === track.src);
      return `
        <div class="wsk-track">
          <div class="wsk-track-text">
            <div class="wsk-track-title">${track.artist} — ${track.title}</div>
            <div class="wsk-track-info">${track.info}</div>
          </div>
          <button type="button" class="win-btn" data-wsk="add-track" data-src="${track.src}"${queued ? ' disabled' : ''}>${queued ? 'В плейлисте' : 'В плейлист'}</button>
        </div>`;
    }).join('');
  }

  renderWinampSkins(url) {
    const skins = this.getWinampSkinsList();
    const player = window.appWinamp;
    const selected = skins.find(skin => player && skin.id === player.currentSkin) || skins[0];
    const total = skins.reduce((sum, skin) => sum + skin.downloads, 0);

    return `
      <div class="wsk-site">
        <header class="wsk-header">
          <div class="wsk-brand">
            <span class="wsk-llama">${window.webGif ? window.webGif('bolt', 2) : ''}</span>
            <div>
              <div class="wsk-logo">Nullsoft Winamp Skins Archive</div>
              <div class="wsk-slogan">«It really whips the llama's ass!»</div>
            </div>
          </div>
          <div class="wsk-counter"><b>${skins.length}</b> скинов для WinAmp 98 Pro, <b>${this.formatWinampCount(total)}</b> скачиваний</div>
          <button type="button" class="win-btn wsk-launch" data-wsk="launch">Открыть Winamp</button>
        </header>

        ${selected ? `<section class="wsk-showcase" data-skin="${selected.id}">${this.renderWinampShowcase(selected)}</section>` : ''}

        <h3 class="wsk-heading">Выберите скин для примерки</h3>
        <div class="wsk-shelf">${this.renderWinampShelf(selected && selected.id)}</div>

        <div class="wsk-bottom">
          <section class="wsk-help">
            <h3 class="wsk-heading">Как надеть скин</h3>
            <ul>
              <li>«Применить в Winamp» переодевает плеер сразу.</li>
              <li>«Скачать .wsz» кладёт файл в C:\\Program Files\\Winamp\\Skins.</li>
              <li>Скачанные скины выбираются в плеере: значок в заголовке, затем «Скины...» (Alt+S).</li>
              <li>Двойной щелчок по .wsz в Проводнике тоже надевает скин.</li>
            </ul>
          </section>
          <section class="wsk-mp3">
            <h3 class="wsk-heading">Музыка для проверки скина</h3>
            <div class="wsk-tracks">${this.renderWinampTracks()}</div>
          </section>
        </div>

        ${this.mailContact('skins@winamp.com', 'Submit your skin')}
        ${this.renderWebRing('http://skins.winamp.com')}
      </div>
    `;
  }

  attachWinampSkinsEvents(win, container) {
    const site = container.querySelector('.wsk-site');
    if (!site) return;
    const findSkin = (id) => this.getWinampSkinsList().find(skin => skin.id === id);
    const showcase = site.querySelector('.wsk-showcase');
    let selectedId = showcase ? showcase.dataset.skin : null;

    const refresh = () => {
      const skin = findSkin(selectedId);
      if (showcase && skin) {
        showcase.dataset.skin = skin.id;
        showcase.innerHTML = this.renderWinampShowcase(skin);
      }
      const shelf = site.querySelector('.wsk-shelf');
      if (shelf) shelf.innerHTML = this.renderWinampShelf(selectedId);
      const tracks = site.querySelector('.wsk-tracks');
      if (tracks) tracks.innerHTML = this.renderWinampTracks();
    };

    const playerReady = () => {
      if (!window.appWinamp) return false;
      if (window.gameManager && !window.gameManager.isInstalled('winamp')) {
        window.winManager.openDialog({
          title: 'WinAmp 98 Pro',
          icon: 'error',
          message: 'WinAmp 98 Pro не установлен. Установите плеер, и скин можно будет надеть одним щелчком. Скачать .wsz можно уже сейчас.'
        });
        return false;
      }
      return true;
    };

    const ding = () => {
      if (window.soundSys) window.soundSys.playDing();
    };

    const actions = {
      select: (el) => {
        selectedId = el.dataset.skin;
        refresh();
        if (window.soundSys) window.soundSys.playClick();
        const again = site.querySelector(`.wsk-thumb[data-skin="${selectedId}"]`);
        if (again) again.focus({ preventScroll: true });
      },
      apply: (el) => {
        if (!playerReady()) return;
        window.appWinamp.setSkin(el.dataset.skin);
        window.appWinamp.open();
        refresh();
        ding();
      },
      download: (el) => {
        const skin = findSkin(el.dataset.skin);
        if (!skin || !window.appWinamp || !window.appWinamp.installSkin(skin.id)) return;
        refresh();
        ding();
        window.winManager.openDialog({
          title: 'Nullsoft Winamp',
          icon: 'winamp',
          message: `Скин <b>${skin.name}</b> сохранён:<br>C:\\Program Files\\Winamp\\Skins\\${skin.file}<br><br>Чтобы надеть его, щёлкните значок в заголовке WinAmp и выберите «Скины...» (Alt+S).`
        });
      },
      launch: () => {
        if (playerReady()) window.appWinamp.open();
      },
      'add-track': (el) => {
        const track = this.getWinampArchiveTracks().find(item => item.src === el.dataset.src);
        if (!track || !playerReady()) return;
        window.appWinamp.addTrack({ title: track.title, artist: track.artist, src: track.src });
        window.appWinamp.open();
        refresh();
        ding();
      }
    };

    site.addEventListener('click', (e) => {
      const el = e.target.closest('[data-wsk]');
      if (!el || el.disabled || !site.contains(el)) return;
      const action = actions[el.dataset.wsk];
      if (action) action(el);
    });
    site.addEventListener('keydown', (e) => {
      const el = e.target;
      if ((e.key === 'Enter' || e.key === ' ') && el.dataset && el.dataset.wsk === 'select') {
        e.preventDefault();
        actions.select(el);
      }
    });
  }

  renderSpaceJam(url) {
    const gif = (name, scale) => window.webGif ? window.webGif(name, scale) : '';
    const planet = (tab, icon, label) => `
      <a class="spacejam-planet-btn btn-spacejam-tab ${this.spaceJamActiveTab === tab ? 'active' : ''}" data-tab="${tab}">
        ${gif(icon, 2)}<br>${label}
      </a>`;

    let details;
    if (this.spaceJamActiveTab === 'souvenirs') {
      details = `
        <h3>Stellar Souvenirs: Wallpapers &amp; Audio</h3>
        <p>Download the original 1996 promotional desktop art and listen to the smash-hit soundtrack!</p>
        <p><button class="win-btn btn-spacejam-dl-wall">Сохранить обои Space Jam (800x600)</button></p>`;
    } else if (this.spaceJamActiveTab === 'tunes') {
      details = `
        <h3>Lunar Tunes: The TuneSquad Roster</h3>
        <ul>
          <li><b>Michael Jordan</b> #23 &mdash; shooting guard, team captain</li>
          <li><b>Bugs Bunny</b> #1 &mdash; point guard and master trickster</li>
          <li><b>Lola Bunny</b> #10 &mdash; all-star forward (&laquo;Don't ever call me Doll!&raquo;)</li>
          <li><b>Daffy Duck</b> #2 &mdash; shooting guard and water boy</li>
          <li><b>Bill Murray</b> #22 &mdash; surprise 4th-quarter substitute</li>
        </ul>`;
    } else if (this.spaceJamActiveTab === 'jump') {
      details = `
        <h3>Jump Station</h3>
        <p>Blast off to other cool places in cyberspace:</p>
        <ul>
          <li><a data-url="http://www.kinomania98.ru">Киномания '98</a> &mdash; movie news</li>
          <li><a data-url="http://www.webcinema98.com">WebCinema '98</a> &mdash; movie trailers and clips</li>
          <li><a data-url="http://www.geocities.com">GeoCities</a> &mdash; build your own Space Jam fan page</li>
        </ul>`;
    } else {
      details = `
        <h3>Planet B-Ball: The Big Game</h3>
        <p>When the evil Swackhammer sends his tiny Nerdlucks to kidnap the Looney Tunes for his theme park Moron Mountain, Bugs Bunny challenges them to a basketball game. But the aliens steal the talent of NBA stars Charles Barkley, Patrick Ewing and Muggsy Bogues and turn into the giant Monstars!</p>`;
    }

    return `
      <div class="spacejam-container">
        <table class="spacejam-planets-table" cellspacing="0">
          <tr>
            <td>${planet('bball', 'planet-bball', 'Planet B-Ball')}</td>
            <td rowspan="2" class="spacejam-center">
              <div class="spacejam-ball">${gif('basketball', 3)}</div>
              <div class="spacejam-logo">SPACE JAM</div>
              <div class="spacejam-tag">The Official Warner Bros. Space Jam Website</div>
              <p class="spacejam-intro">Welcome to the cyber-space home of <b>Michael Jordan</b> and the <b>Looney Tunes</b>! Click on a planet to explore the universe of the greatest basketball game in galaxy history.</p>
            </td>
            <td>${planet('tunes', 'planet-tunes', 'Lunar Tunes')}</td>
          </tr>
          <tr>
            <td>${planet('souvenirs', 'planet-gifts', 'Stellar Souvenirs')}</td>
            <td>${planet('jump', 'planet-jump', 'Jump Station')}</td>
          </tr>
        </table>
        <div class="spacejam-details">${details}</div>
        <p class="spacejam-legal">TM &amp; &copy; 1996 Warner Bros. All rights reserved. Designed for Netscape Navigator 3.0 and Internet Explorer.</p>
        ${this.mailContact('tunesquad@spacejam.com', 'Write to the Tune Squad')}
        ${this.renderWebRing('http://www.spacejam.com')}
      </div>
    `;
  }

  attachSpaceJamEvents(win, container) {
    container.querySelectorAll('.btn-spacejam-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.spaceJamActiveTab = btn.dataset.tab;
        if (window.appIE) window.appIE.renderPage(win, 'http://www.spacejam.com');
      });
    });

    const btnWall = container.querySelector('.btn-spacejam-dl-wall');
    if (btnWall) {
      btnWall.addEventListener('click', () => {
        if (window.vfs) {
          window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], 'SpaceJam_Wallpaper.txt', 'Space Jam 1996 Desktop Art');
          if (window.soundSys) window.soundSys.playDing();
          window.winManager.openDialog({
            title: 'Space Jam 1996',
            icon: 'info',
            message: 'Сувенирные обои <b>SpaceJam_Wallpaper.txt</b> сохранены в папку «Мои документы»!'
          });
        }
      });
    }
  }

  renderIcqPortal(url) {
    const gif = (name, scale) => window.webGif ? window.webGif(name, scale) : '';
    const people = [
      ['313370', 'Вебмастер Дима', 'Санкт-Петербург, SiliconValley / GeoCities'],
      ['777666', 'Сисадмин Борис', 'серверная, FreeBSD, Voodoo 2'],
      ['554433', 'Лена_Студентка', 'Москва, МГУ, музыка и чаты'],
      ['133742', 'Neo_Hacker98', 'Zion, фанат «Матрицы»']
    ];
    return `
      <div class="icqsite-container">
        <table class="icqsite-header" cellspacing="0">
          <tr>
            <td class="icqsite-logo">${gif('flower', 2)} <span>Mirabilis ICQ World</span><br><small>The World's Largest Online Communication Community</small></td>
            <td class="icqsite-online">Users Online Worldwide:<br><b>4,850,219</b></td>
          </tr>
        </table>
        <div class="icqsite-nav">
          <a class="icqsite-jump" data-target="icq-pager">Web-Pager</a> | <a class="icqsite-jump" data-target="icq-white">White Pages</a> | <a class="btn-icqweb-open-app">ICQ 98a</a> | <a data-url="http://chat.krovatka98.ru">Chat</a>
        </div>
        <div class="icqsite-page">
          <h2 class="icqsite-h" id="icq-pager">${gif('pager')} ICQ Web-Pager</h2>
          <p>Отправьте сообщение пользователю ICQ прямо со страницы, даже без клиента. Адресат услышит знаменитое &laquo;О-оу!&raquo;.</p>
          <table class="icqsite-box" cellspacing="0">
            <tr>
              <td class="icqsite-label">Номер UIN:</td>
              <td><input type="text" id="icqweb-uin" value="749210" size="12"> <small>(ваш UIN: 749210)</small></td>
            </tr>
            <tr>
              <td class="icqsite-label">Ваше имя:</td>
              <td><input type="text" id="icqweb-nick" value="WebGuest_98" size="24"></td>
            </tr>
            <tr>
              <td class="icqsite-label">Сообщение:</td>
              <td><textarea id="icqweb-msg" rows="4" cols="50"></textarea></td>
            </tr>
            <tr>
              <td></td>
              <td><button class="win-btn btn-icqweb-send">Отправить сообщение</button></td>
            </tr>
          </table>

          <h2 class="icqsite-h" id="icq-white">${gif('search')} ICQ White Pages</h2>
          <table class="icqsite-people" cellspacing="1">
            <tr><th></th><th>UIN</th><th>Ник</th><th>О себе</th></tr>
            ${people.map(([uin, nick, info]) => `<tr><td>${gif('flower')}</td><td>${uin}</td><td><b>${nick}</b></td><td>${info}</td></tr>`).join('')}
          </table>

          <p class="icqsite-download">${gif('disk')} Ещё нет ICQ? <button class="win-btn btn-icqweb-open-app">Открыть ICQ 98a</button></p>
        </div>
        ${this.mailContact('support@icq.com', 'Служба поддержки ICQ')}
        ${this.renderWebRing('http://www.icq.com')}
      </div>
    `;
  }

  attachIcqPortalEvents(win, container) {
    const btnSend = container.querySelector('.btn-icqweb-send');
    if (btnSend) {
      btnSend.addEventListener('click', () => {
        const uin = container.querySelector('#icqweb-uin').value.trim();
        const nick = container.querySelector('#icqweb-nick').value.trim() || 'WebGuest';
        const msg = container.querySelector('#icqweb-msg').value.trim();

        if (!msg) {
          window.winManager.openDialog({
            title: 'ICQ Web-Pager',
            icon: 'warning',
            message: 'Пожалуйста, введите текст сообщения.'
          });
          return;
        }

        if (window.soundSys && typeof window.soundSys.playIcqUhOh === 'function') {
          window.soundSys.playIcqUhOh();
        }

        if (window.appICQ) {
          const contact = window.appICQ.contacts.find(c => c.uin === uin) || {
            uin,
            nick,
            status: 'online',
            avatar: 'flower'
          };
          window.appICQ.openChat(contact);
        }

        window.winManager.openDialog({
          title: 'ICQ Web-Pager',
          icon: 'info',
          message: `Сообщение успешно отправлено пользователю <b>#${uin}</b>!<br>Сигнал <i>«О-оу!»</i> прозвучал в системе.`
        });
        container.querySelector('#icqweb-msg').value = '';
      });
    }

    container.querySelectorAll('.btn-icqweb-open-app').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.appICQ) window.appICQ.open();
      });
    });

    container.querySelectorAll('.icqsite-jump').forEach(link => {
      link.addEventListener('click', () => {
        const target = container.querySelector('#' + link.dataset.target);
        if (target) target.scrollIntoView({ block: 'start' });
      });
    });
  }

  renderY2K(url) {
    const gif = (name, scale) => window.webGif ? window.webGif(name, scale) : '';
    const counters = [['406', 'дней'], ['14', 'часов'], ['32', 'минут'], ['18', 'секунд']];

    return `
      <div class="y2k-container">
        <div class="y2k-page">
          <table class="y2k-hazard-border" cellspacing="0">
            <tr>
              <td class="y2k-warn">${gif('warn', 2)}</td>
              <td class="y2k-title-cell">
                <div class="y2k-title web-blink">ВНИМАНИЕ!</div>
                <div class="y2k-title">ЦЕНТР ТРЕВОГИ: ОШИБКА 2000 ГОДА</div>
                <div class="y2k-sub">Всемирная служба по борьбе с компьютерным апокалипсисом</div>
              </td>
              <td class="y2k-warn">${gif('warn', 2)}</td>
            </tr>
          </table>

          <table class="y2k-clock-display" cellspacing="6">
            <tr>${counters.map(([value]) => `<td class="y2k-digit-val">${value}</td>`).join('')}</tr>
            <tr>${counters.map(([, label]) => `<td class="y2k-digit-lbl">${label}</td>`).join('')}</tr>
          </table>
          <p class="y2k-center">осталось до полуночи <b>1 января 2000 года</b>, когда часы перескочат с 99 на 00!</p>
          <div class="web-construct"></div>

          <h3 class="y2k-h">${gif('bolt')} Проверка BIOS и часов RTC</h3>
          <p>Проверьте материнскую плату, регистры CMOS и Win 98 на &laquo;ошибку тысячелетия&raquo;.</p>
          ${this.y2kCertified ? `
          <pre class="y2k-cert">${'='.repeat(52)}
 СЕРТИФИКАТ: СИСТЕМА ГОТОВА К 2000 ГОДУ
${'='.repeat(52)}
 Часы CMOS RTC ........ OK  (регистры века 19h/20h)
 Високосный 2000 год .. OK  (правило деления на 400)
 Win 98 SE ........ OK  (переполнения таймера нет)
${'='.repeat(52)}</pre>` : `
          <p><button class="win-btn btn-y2k-run-test">Проверить систему на ошибку 2000 года</button></p>`}

          <h3 class="y2k-h">${gif('warn')} Памятка по выживанию в 2000 году</h3>
          <ol class="y2k-list">
            <li>Снимите наличные в сберкассе до 25 декабря 1999 года.</li>
            <li>Запаситесь водой, сухарями, тушёнкой и свечами минимум на две недели.</li>
            <li>Не садитесь в лифт и не летайте на самолётах 31 декабря около 23:59.</li>
            <li>Сделайте резервные копии всех файлов на дискеты.</li>
          </ol>
          <p class="y2k-center y2k-small">Вы посетитель номер <span class="web-counter">${[...'019990'].map(d => `<span>${d}</span>`).join('')}</span></p>
        </div>
        ${this.mailContact('prepare@y2k-countdown.org', 'Служба тревоги 2000 ждёт ваших вопросов')}
        ${this.renderWebRing('http://www.y2k-countdown.org')}
      </div>
    `;
  }

  attachY2KEvents(win, container) {
    const btnRun = container.querySelector('.btn-y2k-run-test');
    if (btnRun) {
      btnRun.addEventListener('click', () => {
        btnRun.disabled = true;
        btnRun.textContent = 'Тестирование регистров RTC...';
        setTimeout(() => {
          this.y2kCertified = true;
          if (window.soundSys) window.soundSys.playDing();
          if (window.appIE) window.appIE.renderPage(win, 'http://www.y2k-countdown.org');
        }, 1200);
      });
    }
  }

  initFidoStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(this.fidoStorageKey);
        if (!data) {
          const defaultMsgs = [
            {
              id: 1,
              echo: 'ru.game',
              msgNum: '142',
              from: 'Anton Voronov (2:5020/400.12)',
              to: 'All',
              date: '18 Nov 1998 14:22',
              subj: 'Где найти топливный контроллер в Fallout 2?',
              text: `Привет, All!

Уже второй день колешу по пустыне вокруг Кламата и Дена, никак не могу починить Хайвеймен. Смити в Дене просит топливный контроллер. В Городе Убежища (Vault City) обшарил все шкафы в предместьях — пусто. Кто уже прошел, черкните координаты!

--- GoldED/386 3.0.1
 * Origin: Station of the Lone Ranger (2:5020/400.12)`
            },
            {
              id: 2,
              echo: 'ru.game',
              msgNum: '143',
              from: 'Sergey Zaytsev (2:5020/98.4)',
              to: 'Anton Voronov',
              date: '18 Nov 1998 16:40',
              subj: 'Где найти топливный контроллер в Fallout 2?',
              text: `Здравствуй, Anton!

18 Nov 98 14:22, Anton Voronov wrote to All:
> никак не могу починить Хайвеймен. Смити в Дене просит топливный контроллер.

В Гекко (Gecko) иди, к гулю Скитеру в мастерскую на атомной станции. Либо притащи ему суперремкомплект, либо купи деталь за $2000. Тачка стоит того — багажник огромный, скорость по карте реактивная!

--- FastEcho 1.46
 * Origin: Night City Node (2:5020/98.4)`
            },
            {
              id: 3,
              echo: 'ru.anekdot',
              msgNum: '88',
              from: 'SysOp Eugene (2:5020/1024)',
              to: 'All',
              date: '19 Nov 1998 22:15',
              subj: 'Юмор сисопов и модемов',
              text: `Приветствую, All!

Приходит юзер к сисопу и жалуется:
— У меня модем US Robotics Sportster 33600 коннектится только на 14400 и рвет связь каждые пять минут!
Сисоп, не отрываясь от монитора:
— Заземли батарею отопления, смажь дисковод салом и позвони на телефонную станцию бабушке Глаше, пусть реле на декадно-шаговой АТС тряпочкой протрет.

--- Maximus-CBCS 3.01
 * Origin: Relcom Fidonet Gateway (2:5020/1024)`
            },
            {
              id: 4,
              echo: 'su.kaschenko.local',
              msgNum: '666',
              from: 'Главврач (2:5020/0)',
              to: 'Поциенты',
              date: '20 Nov 1998 03:33',
              subj: 'О пользе галоперидола в сетевых дискуссиях',
              text: `Здравствуйте, дорогие поциенты!

С прискорбием замечаю, что некоторые фидошники переметнулись во Всемирную Паутину (WWW) и строчат HTML-теги вместо лампового чтения эхоконференций в GoldED. Санитары уже выехали с клистиром наперевес. Аминь.

--- Kaschenko Mental Hospital
 * Origin: Палата №6 (2:5020/0)`
            }
          ];
          localStorage.setItem(this.fidoStorageKey, JSON.stringify(defaultMsgs));
        }
      }
    } catch (e) {}
  }

  getFidoMessages() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.fidoStorageKey);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  }

  renderFidoNet(url) {
    const allMsgs = this.getFidoMessages();
    const echoMsgs = allMsgs.filter(m => m.echo === this.fidoActiveEcho);
    const activeMsg = this.fidoActiveMsgId ? echoMsgs.find(m => m.id === this.fidoActiveMsgId) : echoMsgs[0];
    const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const echoes = ['ru.game', 'ru.anekdot', 'su.kaschenko.local'];
    const pad = (label) => (label + '     ').slice(0, 5);

    return `
      <div class="fidonet-container">
        <h2 class="fidonet-title">FidoNet Web Gateway</h2>
        <p class="fidonet-sub">Узел 2:5020/1024 (Relcom / Fido7) &middot; шлюз FidoNet &mdash; WWW &middot; перекодировка CP866 &rarr; CP1251</p>
        <hr>
        <p class="fidonet-echoes"><b>Эхоконференции:</b>
          ${echoes.map(echo => {
            const count = allMsgs.filter(m => m.echo === echo).length;
            const label = `${echo.toUpperCase()} (${count})`;
            return this.fidoActiveEcho === echo
              ? `<b class="btn-fido-echo active" data-echo="${echo}">[${label}]</b>`
              : `<a class="btn-fido-echo" data-echo="${echo}">[${label}]</a>`;
          }).join(' ')}
        </p>
        <table class="fidonet-table" cellspacing="2">
          <tr><th>#</th><th>From</th><th>Date</th><th>Subject</th></tr>
          ${echoMsgs.map(m => `
          <tr class="fido-msg-row ${activeMsg && activeMsg.id === m.id ? 'active' : ''}" data-id="${m.id}">
            <td>${esc(m.msgNum)}</td>
            <td>${esc(m.from)}</td>
            <td>${esc(m.date)}</td>
            <td><a>${esc(m.subj)}</a></td>
          </tr>`).join('')}
        </table>
        ${activeMsg ? `
<pre class="fidonet-msg-viewer">${'='.repeat(70)}
 ${pad('Msg')}: ${esc(activeMsg.msgNum)} of ${echoMsgs.length}                        ${esc(this.fidoActiveEcho.toUpperCase())}
 ${pad('From')}: ${esc(activeMsg.from)}
 ${pad('To')}: ${esc(activeMsg.to)}
 ${pad('Date')}: ${esc(activeMsg.date)}
 ${pad('Subj')}: ${esc(activeMsg.subj)}
${'='.repeat(70)}
${esc(activeMsg.text)}
</pre>` : ''}
        <hr>
        <p><b>Написать письмо в ${this.fidoActiveEcho.toUpperCase()}</b></p>
        <table class="fidonet-form" cellspacing="0">
          <tr><td>Subj:</td><td><input type="text" id="fido-new-subj" size="50"></td></tr>
          <tr><td class="fidonet-form-top">Текст:</td><td><textarea id="fido-new-text" rows="6" cols="60"></textarea></td></tr>
          <tr><td></td><td><button class="win-btn btn-fido-send">Отправить письмо</button></td></tr>
        </table>
        <hr>
        <address class="fidonet-footer">Web-FidoGate v0.97 &middot; SysOp: Eugene, 2:5020/1024</address>
        ${this.mailContact('eugene@fido.relcom.ru', 'Стать поинтом узла 2:5020/1024 — пишите сисопу')}
        ${this.renderWebRing('http://fido.relcom.ru')}
      </div>
    `;
  }

  attachFidoNetEvents(win, container) {
    container.querySelectorAll('.btn-fido-echo').forEach(btn => {
      btn.addEventListener('click', () => {
        this.fidoActiveEcho = btn.dataset.echo;
        this.fidoActiveMsgId = null;
        if (window.appIE) window.appIE.renderPage(win, 'http://fido.relcom.ru');
      });
    });

    container.querySelectorAll('.fido-msg-row').forEach(row => {
      row.addEventListener('click', () => {
        this.fidoActiveMsgId = parseInt(row.dataset.id, 10);
        if (window.appIE) window.appIE.renderPage(win, 'http://fido.relcom.ru');
      });
    });

    const btnSend = container.querySelector('.btn-fido-send');
    if (btnSend) {
      btnSend.addEventListener('click', () => {
        const subjInput = container.querySelector('#fido-new-subj');
        const textInput = container.querySelector('#fido-new-text');
        const subj = subjInput.value.trim() || 'Без темы';
        const text = textInput.value.trim();

        if (!text) return;

        const msgs = this.getFidoMessages();
        const now = new Date();
        const dateStr = `${now.getDate()} Nov 1998 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

        msgs.push({
          id: Date.now(),
          echo: this.fidoActiveEcho,
          msgNum: String(msgs.length + 1),
          from: 'RetroUser (2:5020/98.1)',
          to: 'All',
          date: dateStr,
          subj: subj,
          text: `${text}\n\n--- Win98 SE Gateway\n * Origin: Win98 Clone Station (2:5020/98.1)`
        });

        try {
          localStorage.setItem(this.fidoStorageKey, JSON.stringify(msgs));
        } catch (e) {}

        if (window.soundSys) window.soundSys.playDing();
        if (window.appIE) window.appIE.renderPage(win, 'http://fido.relcom.ru');
      });
    }
  }

  renderYandex(url) {
    let query = '';
    if (url.includes('?q=')) {
      try {
        query = decodeURIComponent(url.split('?q=')[1].split('&')[0]);
      } catch (e) {}
    }
    const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const quotes = [
      '«Рукописи не горят.» — М. Булгаков',
      '«Красота спасёт мир.» — Ф. Достоевский',
      '«В человеке должно быть всё прекрасно: и лицо, и одежда, и душа, и мысли.» — А. Чехов',
      '«Быть или не быть — вот в чём вопрос.» — В. Шекспир'
    ];
    const randQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const catalog = [
      ['Литература', [['http://www.lib.ru', 'Библиотека Мошкова'], ['http://www.interpedia.org', 'Интерпедия']]],
      ['Компьютерные игры', [['http://www.igromania.ru', 'Игромания'], ['http://www.cheatcc.com', 'Коды'], ['http://www.goldfargus.ru', 'Фаргус'], ['http://www.emuland98.ru', 'Emu-Land']]],
      ['Программы и MP3', [['http://skins.winamp.com', 'Скины Winamp'], ['http://www.mp3vault98.com', 'MP3'], ['http://www.xakep98.ru', 'Хакер']]],
      ['Кино и видео', [['http://www.kinomania98.ru', 'Киномания'], ['http://www.webcinema98.com', 'Видео'], ['http://www.mult98.ru', 'Мульт.ру']]],
      ['Общение и аукционы', [['http://chat.krovatka98.ru', 'Чаты'], ['http://fido.relcom.ru', 'Фидонет'], ['http://www.molotok98.ru', 'Молоток.ру']]],
      ['Юмор и тайны', [['http://www.anekdot98.ru', 'Анекдоты'], ['http://www.geocities.com', 'Домашние страницы'], ['http://www.xfiles98.ru', 'Истина где-то рядом']]]
    ];

    let directMatchHTML = '';
    const qLower = (query || '').toLowerCase();
    if (qLower.includes('фаргус') || qLower.includes('fargus')) {
      directMatchHTML = `<li><a data-url="http://www.goldfargus.ru">«ФАРГУС Мультимедиа» — Только полный и качественный перевод</a><br><span class="yandex-snippet">Каталог изданий, голоса озвучки, патчи и техподдержка.</span><br><span class="yandex-url">http://www.goldfargus.ru</span></li>`;
    } else if (qLower.includes('молоток') || qLower.includes('molotok')) {
      directMatchHTML = `<li><a data-url="http://www.molotok98.ru">Интернет-аукцион «Молоток.ру» (1998)</a><br><span class="yandex-snippet">Торги видеокартами, модемами и приставками в у.е. Автоставки и блиц-цена.</span><br><span class="yandex-url">http://www.molotok98.ru</span></li>`;
    } else if (qLower.includes('хакер') || qLower.includes('xakep')) {
      directMatchHTML = `<li><a data-url="http://www.xakep98.ru">Электронный журнал «Хакер '98»</a><br><span class="yandex-snippet">Пилотный сетевой номер: модемы, реестр Win 98, CIH, Х-Почта и KeyGen 98.</span><br><span class="yandex-url">http://www.xakep98.ru</span></li>`;
    } else if (qLower.includes('мульт') || qLower.includes('масяня') || qLower.includes('mult')) {
      directMatchHTML = `<li><a data-url="http://www.mult98.ru">Студия «Мульт.ру» — веб-анимация</a><br><span class="yandex-snippet">Серии про Масяню и Хрюнделя, сценарии, обои и гостевая книга.</span><br><span class="yandex-url">http://www.mult98.ru</span></li>`;
    } else if (qLower.includes('эмул') || qLower.includes('rom') || qLower.includes('dendy') || qLower.includes('денди')) {
      directMatchHTML = `<li><a data-url="http://www.emuland98.ru">Emu-Land — Мир 8-бит и 16-бит</a><br><span class="yandex-snippet">Дампы картриджей Dendy, Sega, SNES и Game Boy со скриншотами, коды и эмуляторы.</span><br><span class="yandex-url">http://www.emuland98.ru</span></li>`;
    } else if (qLower.includes('нло') || qLower.includes('истина') || qLower.includes('ufo') || qLower.includes('xfiles')) {
      directMatchHTML = `<li><a data-url="http://www.xfiles98.ru">Архив «Истина где-то рядом»</a><br><span class="yandex-snippet">Дела об НЛО с чёрными полосами, дешифратор, очевидцы и скептик.</span><br><span class="yandex-url">http://www.xfiles98.ru</span></li>`;
    }

    const resultsHTML = query ? `
      <p class="yandex-found">Яndex нашёл <b>18 документов</b> по запросу &laquo;<b>${esc(query)}</b>&raquo;. Поиск занял 0,03 сек.</p>
      <ol class="yandex-results">
        ${directMatchHTML}
        <li>
          <a data-url="http://www.search98.com/search?q=${encodeURIComponent(query)}">Все результаты в WebSeeker 98 по теме &laquo;${esc(query)}&raquo;</a><br>
          <span class="yandex-snippet">Полное совпадение с учётом русской морфологии. Каталог и подробные описания.</span><br>
          <span class="yandex-url">http://www.search98.com/search?q=${encodeURIComponent(query)}</span>
        </li>
        <li>
          <a data-url="http://www.rambler98.ru">Rambler's Top100 &mdash; рейтинг сайтов Рунета</a><br>
          <span class="yandex-snippet">Популярность русскоязычных сайтов 1998 года.</span><br>
          <span class="yandex-url">http://www.rambler98.ru</span>
        </li>
      </ol>` : '';

    return `
      <div class="yandex-container">
        <table class="yandex-head" cellspacing="0">
          <tr>
            <td class="yandex-logo-row"><span class="yandex-red-ya">Я</span><span class="yandex-black-ndex">ndex</span></td>
            <td class="yandex-slogan"><b>Найдётся всё!</b><br>поиск по Рунету с учётом русской морфологии</td>
          </tr>
        </table>
        <table class="yandex-search-bar" cellspacing="0">
          <tr>
            <td>
              <input type="text" id="yandex-input" value="${esc(query)}" size="48">
              <button class="win-btn btn-yandex-search">Найти!</button><br>
              <span class="yandex-examples">Например: <a class="yandex-example" data-q="игры">игры</a>, <a class="yandex-example" data-q="фаргус">фаргус</a>, <a class="yandex-example" data-q="молоток">молоток</a>, <a class="yandex-example" data-q="хакер">хакер</a>, <a class="yandex-example" data-q="масяня">масяня</a>, <a class="yandex-example" data-q="нло">нло</a></span>
            </td>
          </tr>
        </table>
        ${resultsHTML}
        <table class="yandex-widgets" cellspacing="0">
          <tr>
            <td><b>Цитата дня</b><br><i>${randQuote}</i></td>
            <td><b>Народная примета</b><br>Если ноябрь сухой и ясный &mdash; быть морозной зиме. Если модем соединяется на 56K &mdash; быть хорошему скачиванию!</td>
          </tr>
        </table>
        <div class="yandex-catalog-title">Каталог Яndex</div>
        <table class="yandex-catalog" cellspacing="0">
          ${[0, 3].map(i => `
          <tr>
            ${catalog.slice(i, i + 3).map(([title, links]) => `
            <td><b>${title}</b><br><small>${links.map(([href, label]) => `<a data-url="${href}">${label}</a>`).join(', ')}</small></td>`).join('')}
          </tr>`).join('')}
        </table>
        <p class="yandex-footer">&copy; CompTek International, 1997-1998. Яndex &mdash; зарегистрированная торговая марка.</p>
        ${this.mailContact('feedback@yandex.ru', 'Обратная связь')}
        ${this.renderWebRing('http://www.yandex.ru')}
      </div>
    `;
  }

  attachYandexEvents(win, container) {
    const input = container.querySelector('#yandex-input');
    const btnSearch = container.querySelector('.btn-yandex-search');

    const doSearch = () => {
      const q = input.value.trim();
      if (q && window.appIE) {
        window.appIE.navigate(win, `http://www.yandex.ru/search?q=${encodeURIComponent(q)}`);
      }
    };

    if (btnSearch) btnSearch.addEventListener('click', doSearch);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSearch();
      });
    }

    container.querySelectorAll('.yandex-example[data-q]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        input.value = link.dataset.q;
        doSearch();
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.retroSites = new RetroSitesEngine();
}
