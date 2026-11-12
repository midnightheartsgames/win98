(() => {
  const BUILD = JSON.parse(document.getElementById('sr98-build').textContent);
  const PLAY_URL = 'play/index.html';
  let APK_URL = BUILD.apk;
  let PC = null;
  let PAROHOD = null;
  const TELEGRAM = 'https://t.me/Penny_Gachimen';
  const LANG_KEY = 'sr98.site.lang';
  const LANG = (() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'ru' || saved === 'en') return saved;
    } catch (e) {}
    return /^ru\b|^ru-/i.test((typeof navigator !== 'undefined' && navigator.language) || '') ? 'ru' : 'en';
  })();
  const L = (ru, en) => (LANG === 'en' ? en : ru);
  const langSwitch = () => (LANG === 'en' ? '<a href="#" data-lang="ru">Русский</a>' : '<a href="#" data-lang="en">English</a>');
  const SHOTS = [L('Бой на станции «Герта»', 'Battle on Herta Space Station'), L('Административный район Белобога', 'Belobog\'s Administrative District')];

  const Hsr = () => globalThis.Hsr98 || null;
  const esc = (s) => String(s == null ? '' : s)
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, '$1/$2')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const href = (path = '') => '#' + (path || '/');
  const WARP_ROW = 4;
  const link = (path, label, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${href(path)}">${label}</a>`;
  const art = (spec, w, h, cls = '') => `<canvas class="hsrs-art${cls ? ' ' + cls : ''}" data-art="${spec}" width="${w}" height="${h}"></canvas>`;
  const diamonds = (n) => `<span class="hsrs-rar hsrs-rar-${n}">${'&#9670;'.repeat(n)}</span>`;
  const mb = (bytes) => L((bytes / 1048576).toFixed(1).replace('.', ','), (bytes / 1048576).toFixed(1));
  const parohodLink = () => `<a href="${PAROHOD.url}" download>${L('Пароход 98 для Android', 'Parohod 98 for Android')}</a>, ${mb(PAROHOD.bytes)} ${L('МБ', 'MB')}`;

  const NAV = [
    ['home', '', L('Главная', 'Home')],
    ['download', '/download', L('Загрузка', 'Download')],
    ['news', '/news', L('Новости', 'News')],
    ['characters', '/characters', L('Персонажи', 'Characters')],
    ['worlds', '/worlds', L('Миры', 'Worlds')],
    ['play', '/play', L('Как играть', 'How to Play')],
    ['gallery', '/gallery', L('Галерея', 'Gallery')],
    ['support', '/support', L('Поддержка', 'Support')]
  ];
  const NAV_OF = { news: 'news', article: 'news', characters: 'characters', character: 'characters', gallery: 'gallery', picture: 'gallery' };

  const PATH_ORDER = ['destruction', 'hunt', 'erudition', 'harmony', 'nihility', 'preservation', 'abundance', 'remembrance'];
  const PATH_ROLE = {
    destruction: L('Бойцы первой линии. Бьют сильно, часто по нескольким врагам, и держат удар.', 'Front-line fighters. They hit hard, often several enemies at once, and can take a hit.'),
    hunt: L('Убийцы одной цели. Лучше всех добивают боссов и сильных врагов.', 'Single-target killers. The best at finishing off bosses and strong enemies.'),
    erudition: L('Бьют по всем врагам сразу. Незаменимы против толпы.', 'Hit all enemies at once. Indispensable against crowds.'),
    harmony: L('Усиливают команду: атаку, скорость, урон от пробития.', 'Buff the team: ATK, SPD, Break DMG.'),
    nihility: L('Ослабляют врагов и наносят урон со временем.', 'Weaken enemies and deal damage over time.'),
    preservation: L('Щиты и провокация. Принимают удары на себя.', 'Shields and taunts. They take the hits themselves.'),
    abundance: L('Лечат команду и снимают ослабления.', 'Heal the team and remove debuffs.'),
    remembrance: L('Вызывают помощников, которые ходят в бою сами и бьют по врагам.', 'Summon helpers that act on their own in battle and attack enemies.')
  };
  const STORY_JOIN = ['trail', 'march', 'danheng', 'arlan', 'hook', 'natasha', 'serval'];
  const TARGETS = { single: L('Одна цель', 'Single target'), blast: L('Цель и соседи', 'Target and adjacent'), all: L('Все враги', 'All enemies'), bounce: L('Отскоки по врагам', 'Bounces between enemies'), ally: L('Союзник', 'Ally'), allies: L('Вся команда', 'Whole team'), self: L('На себя', 'Self') };
  const FX_WORDS = {
    heal: L('лечение', 'healing'), hot: L('лечение каждый ход', 'healing each turn'), shield: L('щит', 'shield'), buff: L('усиление', 'buff'), debuff: L('ослабление врагов', 'enemy debuff'), dot: L('урон со временем', 'damage over time'),
    freeze: L('шанс заморозки', 'Freeze chance'), imprison: L('заточение', 'Imprisonment'), taunt: L('провокация', 'taunt'), advance: L('ход раньше', 'action advance'), cleanse: L('снимает ослабления', 'removes debuffs'),
    dispel: L('снимает усиления врага', 'removes enemy buffs'), resurge: L('возвращает в бой', 'revives'), invig: L('оживление', 'Invigoration'), magma: L('заряд Магмы', 'Magma charge'), bloom: L('цветение пробитых врагов', 'bloom on broken enemies')
  };

  const AREA_STILL = {
    hs_control: 'station', hs_storage: 'cargo', express: 'express', j_plains: 'jarilo', j_belobog: 'belobog', j_fissures: 'snowgate',
    j_everwinter: 'everwinter', u_boulder: 'boulder', u_mine: 'mine', u_rivet: 'rivet',
    j_restricted: 'restricted', j_backwater: 'alley', j_workshop: 'workshop', j_hotel: 'hotel', j_fort: 'fort', j_pathspace: 'pathspace', j_pillars: 'pillars',
    u_clinic: 'clinic', u_grandhotel: 'grandhotel', u_rivet2: 'orphan', u_settle: 'settlement', u_settle1: 'settlement', u_camp: 'mine', u_rivet3: 'rivet'
  };

  const STILLS = [
    ['station', L('Главный пульт станции «Герта»', 'Herta Space Station main control')],
    ['cargo', L('Зона хранения станции', 'Station Storage Zone')],
    ['express', L('Вагон-салон Звёздного экспресса', 'Astral Express Parlor Car')],
    ['jarilo', L('Пригородные снежные поля', 'Outlying Snow Plains')],
    ['snowgate', L('Стены Белобога', 'Walls of Belobog')],
    ['belobog', L('Белобог и Форт Клипота', 'Belobog and Qlipoth Fort')],
    ['fort', L('Форт Клипота', 'Qlipoth Fort')],
    ['workshop', L('Мастерская Сервал', 'Serval\'s Workshop')],
    ['hotel', L('Отель «Гёте» ночью', 'Goethe Hotel at night')],
    ['nightstreet', L('Ночные улицы Белобога', 'Belobog streets at night')],
    ['alley', L('Переулок, где реальность треснула', 'The alley where reality cracked')],
    ['clinic', L('Клиника Наташи', 'Natasha\'s Clinic')],
    ['boulder', L('Камнеград', 'Boulder Town')],
    ['mine', L('Большая шахта', 'Great Mine')],
    ['rivet', L('Заклёпкоград', 'Rivet Town')],
    ['settlement', L('Поселение роботов', 'Robot Settlement')],
    ['restricted', L('Линия фронта', 'Front Line')],
    ['everwinter', L('Холм вечнозимья', 'Everwinter Hill')],
    ['summit', L('Вершина холма', 'Hilltop')],
    ['pathspace', L('Пространство Пути', 'Path Space')]
  ];

  const NEWS = (window.SR98_NEWS || []).map(n => (LANG === 'en' && n.en ? Object.assign({}, n, n.en) : n));

  const FAQ = [
    [L('Игра правда бесплатная?', 'Is the game really free?'), L('Да. Звёздный нефрит и пропуски даёт сама игра: события, почта, сундуки, боссы и уровни Освоения. За деньги внутри игры ничего не продаётся.', 'Yes. Stellar Jade and passes come from the game itself: events, mail, chests, bosses and Trailblaze Levels. Nothing is sold for money in the game.')],
    [L('Нужно ли что-то устанавливать?', 'Do I need to install anything?'), L('Нет. Нажмите «Играть», и игра запустится прямо в браузере. Для телефона есть Android-версия, её ставят из файла APK.', 'No. Press "Play" and the game starts right in your browser. For phones there is an Android version installed from an APK file.')],
    [L('Где хранятся сохранения?', 'Where are saves kept?'), L('В браузере, на вашем устройстве. Если очистить данные сайта, сохранения пропадут. У Android-версии свои сохранения, с браузерными они не общие.', 'In your browser, on your device. Clearing site data deletes them. The Android version has its own saves, separate from the browser ones.')],
    [L('Можно играть на телефоне?', 'Can I play on a phone?'), L('Да. На сенсорном экране сами появляются кнопки: крестовина, A, B, Q, E и полная панель клавиш. Держите телефон горизонтально.', 'Yes. On a touch screen, buttons appear by themselves: a D-pad, A, B, Q, E and a full key panel. Hold the phone in landscape.')],
    [L('Как поставить Android-версию?', 'How do I install the Android version?'), L(`Скачайте ${APK_URL} и откройте его на телефоне. Android попросит разрешить установку из этого источника: разрешите и нажмите «Установить».`, `Download ${APK_URL} and open it on your phone. Android will ask you to allow installs from this source: allow it and press "Install".`)],
    [L('Игра тормозит.', 'The game is slow.'), L('Откройте телефон (Esc), затем «Настройки» и поставьте «Разрешение» 640. Ещё помогает «Скорость боя» ×2 и выключенные сцены абсолютных техник.', 'Open the phone (Esc), then "Settings", and set "Resolution" to 640. "Battle speed" ×2 and turning off Ultimate scenes also help.')],
    [L('Как сохраниться?', 'How do I save?'), L('У Якоря пространства или в безопасном месте, например на Экспрессе. Есть три ячейки и автосохранение.', 'At a Space Anchor or in a safe place such as the Express. There are three slots and an autosave.')],
    [L('Можно играть вместе с другом?', 'Can I play with a friend?'), L('Да. В Рубеже Экспресса за один стол садятся от двух до четырёх игроков, а на Экспресс друга можно зайти в гости. Нужна Эфирная связь и UID друга из его профиля.', 'Yes. In Express Frontier, two to four players sit at one table, and you can visit a friend\'s Express. You need the Ether Link and your friend\'s UID from their profile.')],
    [L('Что игра отправляет в сеть?', 'What does the game send online?'), L('Ничего, пока вы не согласились на Эфирную связь. После согласия друзья видят имя, уровень Освоения, аватар, подпись, витрину героев, заслуги и чем вы заняты в игре. Сохранения и почта не отправляются. Удалить все данные можно в настройках связи.', 'Nothing until you agree to the Ether Link. After that, friends see your name, Trailblaze Level, avatar, signature, character showcase, records and what you are doing in the game. Saves and mail are not sent. You can delete all data in the link settings.')],
    [L('Игра на русском?', 'Is the game in English?'), L('Да, полностью: диалоги, интерфейс и сцены. Сюжет идёт по заданиям Освоения версии 1.0.', 'Yes. Switch the language in the game settings: dialogue, interface and scenes are translated. The story follows the Trailblaze Missions of version 1.0.')],
    [L('Можно играть за девушку?', 'Can I play as a girl?'), L('Да. Перед началом вы выбираете Первопроходца, и все реплики подстраиваются под выбор.', 'Yes. You choose your Trailblazer before starting, and all lines adapt to your choice.')]
  ];

  const CONTROLS = [
    [L('Карта', 'Map'), L('WASD или стрелки: идти (Shift: шагом). Пробел или Enter: говорить, использовать. F: атаковать врага на карте. E: техника лидера. 1–4: сменить лидера. M: карта. Esc: телефон', 'WASD or arrows: move (Shift: walk). Space or Enter: talk, use. F: attack an enemy on the map. E: leader Technique. 1–4: change leader. M: map. Esc: phone')],
    [L('Диалог', 'Dialogue'), L('Enter или Пробел: дальше. Tab: пересказ и пропуск сцены', 'Enter or Space: next. Tab: recap and skip the scene')],
    [L('Бой', 'Battle'), L('Q: обычная атака. E: навык. Пробел или Enter: применить. ←/→: цель. 1–4: абсолютная техника. T: Контакт. R: Слияние. V: автобой. X: скорость боя', 'Q: Basic ATK. E: Skill. Space or Enter: confirm. ←/→: target. 1–4: Ultimate. T: Contact. R: Fusion. V: auto battle. X: battle speed')],
    [L('Прыжок', 'Warp'), L('Q/E: баннер. ←/→: один прыжок или десять. Enter: прыгнуть. H: история прыжков', 'Q/E: banner. ←/→: one Warp or ten. Enter: Warp. H: Warp history')],
    [L('Карта навигации', 'Navigation map'), L('↑/↓: область. ←/→: следующая метка. Enter: карточка метки и телепорт. Tab: карта Звёздного пути', '↑/↓: area. ←/→: next marker. Enter: marker card and teleport. Tab: Star Rail map')]
  ];

  const site = {
    anim: null,

    parseRoute(hash) {
      const rest = String(hash || '').replace(/^#/, '');
      const [pathPart, query = ''] = rest.split('?');
      const path = pathPart.replace(/\/+$/, '').toLowerCase();
      const params = {};
      query.split('&').filter(Boolean).forEach(pair => {
        const [k, v = ''] = pair.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
      });
      if (path === '') return { view: 'home' };
      if (path === '/download') return { view: 'download' };
      if (path === '/news') {
        if (!params.id) return { view: 'news' };
        return NEWS.some(n => n.id === params.id) ? { view: 'article', id: params.id } : { view: 'missing' };
      }
      if (path === '/characters') {
        if (!params.id) return { view: 'characters' };
        return this.characterIds().includes(params.id) ? { view: 'character', id: params.id } : { view: 'missing' };
      }
      if (path === '/gallery') {
        if (params.pic == null) return { view: 'gallery' };
        const n = parseInt(params.pic, 10);
        return n >= 0 && n < this.galleryItems().length ? { view: 'picture', n } : { view: 'missing' };
      }
      if (['/worlds', '/play', '/support'].includes(path)) return { view: path.slice(1) };
      return { view: 'missing' };
    },

    characterIds() {
      const H = Hsr();
      if (!H || !H.CHARS) return [];
      const ids = Object.keys(H.CHARS).filter(id => id !== 'trail_p');
      return PATH_ORDER.flatMap(p => ids.filter(id => H.CHARS[id].path === p));
    },

    memberName(id) {
      const H = Hsr();
      return id === 'trail_p' ? H.CHARS.trail.name + L(' на Пути Сохранения', ' on the Path of Preservation') : H.CHARS[id].name;
    },

    source(id) {
      const H = Hsr();
      if (STORY_JOIN.includes(id)) return L('Присоединяется по сюжету', 'Joins in the story');
      if (H && H.BANNERS && H.BANNERS.ev.stars[id]) return L(`Прыжок события «${H.BANNERS.ev.stars[id].name}»`, `Event Warp "${H.BANNERS.ev.stars[id].name}"`);
      if (H && H.BANNERS && H.BANNERS.sig && H.BANNERS.sig.stars[id]) return L(`Поиск сигнала «${H.BANNERS.sig.stars[id].name}»`, `Signal Search "${H.BANNERS.sig.stars[id].name}"`);
      if (H && H.BANNERS && H.BANNERS.conv && H.BANNERS.conv.stars[id]) return L(`Призыв резонатора «${H.BANNERS.conv.stars[id].name}»`, `Resonator Convene "${H.BANNERS.conv.stars[id].name}"`);
      if (H && H.BANNERS && H.BANNERS.guild && H.BANNERS.guild.stars[id]) return L(`Гильдия, набор в отряд «${H.BANNERS.guild.stars[id].name}»`, `Guild recruitment "${H.BANNERS.guild.stars[id].name}"`);
      if (H && H.BANNERS && H.BANNERS.guild && Object.values(H.BANNERS.guild.stars).some(s => s.four.includes(id))) return L('Гильдия, набор в отряд, 4★', 'Guild recruitment, 4★');
      if (H && H.BANNERS && H.BANNERS.mid && H.BANNERS.mid.stars[id]) return L(`Полуночный канал «${H.BANNERS.mid.stars[id].name}»`, `Midnight Channel "${H.BANNERS.mid.stars[id].name}"`);
      if (H && H.BANNERS && H.BANNERS.con && H.BANNERS.con.stars[id]) return L(`Кон-Тон, главная сцена «${H.BANNERS.con.stars[id].name}»`, `Con-Ton main stage "${H.BANNERS.con.stars[id].name}"`);
      if (H && H.BANNERS && H.BANNERS.mid && Object.values(H.BANNERS.mid.stars).some(s => s.four.includes(id))) return L('Полуночный канал, 4★', 'Midnight Channel, 4★');
      if (H && H.BANNERS && H.BANNERS.sig && !H.WARP_POOL.four.includes(id) && Object.values(H.BANNERS.sig.stars).some(s => s.four.includes(id))) return L('Поиск сигнала, выделенный канал, агент A', 'Signal Search, dedicated channel, A-rank agent');
      if (H && H.WARP_POOL && H.WARP_POOL.five.includes(id)) return L('Стандартный прыжок «Путь Первопроходцев», 5★', 'Standard Warp "Stellar Warp", 5★');
      if (H && H.WARP_POOL && H.WARP_POOL.four.includes(id)) return L('Стандартный прыжок и прыжки события, 4★', 'Standard and event Warps, 4★');
      return L('Прыжки, 4★', 'Warps, 4★');
    },

    galleryItems() {
      const H = Hsr();
      const items = SHOTS.map((cap, i) => ({ kind: 'shot', src: `img/hsr98-${i + 1}.jpg`, title: cap, group: L('Кадры из игры', 'In-game shots') }));
      STILLS.forEach(([id, title]) => items.push({ kind: 'still', id, title, group: L('Места', 'Places') }));
      if (H && H.Eidolons && H.CHARS) {
        this.characterIds().filter(id => H.Eidolons.has(id)).forEach(id => {
          items.push({ kind: 'eid', id, title: `${H.Eidolons.SCENES[id].title} (${H.CHARS[id].name})`, group: L('Картины Эйдолонов', 'Eidolon paintings') });
        });
      }
      return items;
    },

    renderSite(hash) {
      const route = this.parseRoute(hash);
      const here = NAV_OF[route.view] || route.view;
      const body = {
        home: () => this.renderHome(),
        download: () => this.renderDownload(),
        news: () => this.renderNewsList(),
        article: () => this.renderArticle(route.id),
        characters: () => this.renderCharacters(),
        character: () => this.renderCharacter(route.id),
        worlds: () => this.renderWorlds(),
        play: () => this.renderPlay(),
        gallery: () => this.renderGallery(),
        picture: () => this.renderPicture(route.n),
        support: () => this.renderSupport(),
        missing: () => this.renderMissing()
      }[route.view]();
      return `
        <table class="hsrs-frame" cellspacing="0" cellpadding="0">
          <tr><td>${this.renderHeader()}</td></tr>
          <tr><td>${this.renderRoute(here)}</td></tr>
          <tr><td class="hsrs-body">${body}</td></tr>
          <tr><td>${this.renderFooter()}</td></tr>
        </table>`;
    },

    primaryActions() {
      return `<a class="hsrs-btn hsrs-btn-big" href="${PLAY_URL}">${L('Играть', 'Play')}</a>${PC ? ` <a class="hsrs-btn hsrs-btn-big" href="${PC.url}" download>${L('Для ПК', 'For PC')}</a>` : ''} <a class="hsrs-btn hsrs-btn-big" href="${APK_URL}" download>${L('Android версия', 'Android version')}</a>`;
    },

    renderHeader() {
      return `
        <table class="hsrs-head" cellspacing="0" cellpadding="0">
          <tr>
            <td class="hsrs-head-left">
              <div class="hsrs-logo">
                <div class="hsrs-logo-big">Star Rail <span class="hsrs-logo-98">98</span></div>
              </div>
              <p class="hsrs-motto">${L('Да приведёт нас этот путь к звёздам', 'May this journey lead us starward')}</p>
              <p class="hsrs-head-text">${L('Пошаговая ролевая игра о Звёздном экспрессе. Полная версия, бесплатно, на русском языке.', 'A turn-based RPG about the Astral Express. Full version, free, in English and Russian.')}</p>
              <div class="hsrs-head-action">${this.primaryActions()}<span class="hsrs-head-note">${L('Версия', 'Version')} ${BUILD.version}. ${L('В браузере, на ПК или на Android', 'In the browser, on PC or on Android')} · ${langSwitch()}</span>${PAROHOD ? `<p class="hsrs-small">${L('Другие игры на телефон:', 'More games for your phone:')} ${parohodLink()}</p>` : ''}</div>
            </td>
            <td class="hsrs-head-right">
              <div class="hsrs-window">${art('title', 320, 240, 'hsrs-window-view')}</div>
            </td>
          </tr>
        </table>`;
    },

    renderRoute(here) {
      return `
        <nav class="hsrs-route" aria-label="${L('Разделы сайта', 'Site sections')}">
          ${NAV.map(([key, path, label]) => `<a class="hsrs-stop${key === here ? ' is-here' : ''}" href="${href(path)}"${key === here ? ' aria-current="page"' : ''}><i></i><span>${label}</span></a>`).join('')}
        </nav>`;
    },

    renderFooter() {
      return `
        <div class="hsrs-foot">
          <div class="hsrs-foot-row">
            <span>${L('Вопросы и ошибки:', 'Questions and bugs:')} <a href="${TELEGRAM}">${L('Telegram-канал', 'Telegram channel')}</a> &nbsp; ${langSwitch()}</span>
            <span><a href="../kovcheg/">${L('«Ковчег»: тир-лист и гайды', 'Kovcheg: tier list and guides')}</a> &nbsp; <a href="../sr98wiki/">${L('АстралВики', 'AstralWiki')}</a> &nbsp; <a href="../">Win 98 Web Edition</a></span>
          </div>
          <p>${L('Star Rail 98 — некоммерческий фанатский проект Midnight Hearts. Мы не связаны с HoYoverse. Персонажи, названия и мир игры принадлежат их владельцам.', 'Star Rail 98 is a non-commercial Midnight Hearts fan project. We are not affiliated with HoYoverse. Characters, names and the game world belong to their owners.')}</p>
        </div>`;
    },

    renderHome() {
      const H = Hsr();
      const latest = NEWS.slice(0, 10);
      return `
        <table class="hsrs-cols" cellspacing="0" cellpadding="0">
          <tr>
            <td class="hsrs-main">
              <div class="hsrs-intro">
                ${art('fig:march:2', 96, 192, 'hsrs-intro-fig')}
                <h1 class="hsrs-h1">${L('Добро пожаловать на борт', 'Welcome aboard')}</h1>
                <p>${L('Первопроходец просыпается на космической станции «Герта» и не помнит, кто он. В груди у него Стелларон, камень, который приносит мирам беды. Его находят Март 7 и Дань Хэн из экипажа Звёздного экспресса.', 'The Trailblazer wakes up on Herta Space Station with no memory of who they are. In their chest is a Stellaron, a stone that brings disaster to worlds. March 7th and Dan Heng of the Astral Express crew find them.')}</p>
                <p>${L('Экспресс идёт по Звёздному пути от мира к миру. Следующая остановка: Ярило-VI, ледяная планета, где город Белобог семьсот лет живёт за стеной и не знает, откуда пришла вечная зима.', 'The Express travels the Star Rail from world to world. Next stop: Jarilo-VI, an icy planet where the city of Belobog has lived behind a wall for seven hundred years, not knowing where the eternal winter came from.')}</p>
                <p>${link('/play', L('Как устроена игра', 'How the game works'))} &nbsp; ${link('/characters', L('Все персонажи', 'All characters'))} &nbsp; ${link('/worlds', L('Куда идёт Экспресс', 'Where the Express goes'))}</p>
              </div>
              <h2 class="hsrs-h2">${L('Новости', 'News')}</h2>
              <table class="hsrs-newslist" cellspacing="0">
                ${latest.map((n, i) => `
                <tr>
                  <td class="hsrs-date">${n.date}</td>
                  <td>${i === 0 ? '<span class="hsrs-new">NEW!</span> ' : ''}<b>${link(`/news?id=${n.id}`, esc(n.title))}</b><br><span class="hsrs-lead">${esc(n.lead)}</span></td>
                </tr>`).join('')}
              </table>
              <p class="hsrs-more">${link('/news', L('Все новости', 'All news'))}</p>
            </td>
            <td class="hsrs-side">
              ${this.renderTicketMini()}
              ${H && H.BANNERS ? this.renderWarpBox() : ''}
              <div class="hsrs-box">
                <div class="hsrs-box-h">${L('Из игры', 'From the game')}</div>
                <a href="${href('/gallery?pic=0')}"><img class="hsrs-thumb" src="img/hsr98-1.jpg" width="200" height="150" alt="${SHOTS[0]}"></a>
                <p class="hsrs-small">${link('/gallery', L('Галерея', 'Gallery'))}: ${L('кадры, места и картины Эйдолонов.', 'shots, places and Eidolon paintings.')}</p>
              </div>
              <div class="hsrs-box">
                <div class="hsrs-box-h">${L('Ковчег', 'Kovcheg')}</div>
                <p class="hsrs-small">${L('Сайт игроков с тир-листом всех героев, личными делами, отрядами, гайдами по Залу забвения и Виртуальной вселенной и конструктором команды.', 'A player site with a tier list of every hero, profiles, teams, Forgotten Hall and Simulated Universe guides and a team builder.')}</p>
                <p class="hsrs-small"><a href="../kovcheg/">${L('Открыть «Ковчег»', 'Open Kovcheg')}</a></p>
              </div>
              <div class="hsrs-box">
                <div class="hsrs-box-h">${L('АстралВики', 'AstralWiki')}</div>
                <p class="hsrs-small">${L('Энциклопедия игроков: персонажи, фракции и миры, карты с сундуками и записками, прохождение миссий, световые конусы, облики и питомцы.', 'A player encyclopedia: characters, factions and worlds, maps with chests and notes, mission walkthroughs, Light Cones, outfits and pets.')}</p>
                <p class="hsrs-small"><a href="../sr98wiki/">${L('Открыть АстралВики', 'Open AstralWiki')}</a></p>
              </div>
            </td>
          </tr>
        </table>`;
    },

    renderTicketMini() {
      return `
        <div class="hsrs-ticket-mini">
          <div class="hsrs-ticket-mini-h">${art('item:spass:24', 24, 24)} ${L('Билет на Экспресс', 'Express Ticket')}</div>
          <p>${L('Полная версия', 'Full version')} ${BUILD.version}. ${L('Бесплатно, без регистрации.', 'Free, no sign-up.')}</p>
          <a class="hsrs-btn hsrs-btn-big" href="${PLAY_URL}">${L('Играть', 'Play')}</a>
          <p class="hsrs-small">${PC ? `<a href="${PC.url}" download>${L('Для ПК', 'For PC')}</a>, ${mb(PC.bytes)} ${L('МБ', 'MB')} · ` : ''}<a href="${APK_URL}" download>${L('Android версия', 'Android version')}</a>, ${mb(BUILD.apkBytes)} ${L('МБ', 'MB')}${PAROHOD ? ` · ${parohodLink()}` : ''}</p>
        </div>`;
    },

    renderWarpBox() {
      const H = Hsr();
      const ids = Object.keys(H.BANNERS.ev.stars);
      const rows = [];
      for (let i = 0; i < ids.length; i += WARP_ROW) rows.push(ids.slice(i, i + WARP_ROW));
      const T = H.TUNING;
      return `
        <div class="hsrs-box">
          <div class="hsrs-box-h">${L('Сейчас в прыжке', 'Now in Warp')}</div>
          <table class="hsrs-warp" cellspacing="0">
            ${rows.map(row => `<tr>${row.map(id => `<td>${link(`/characters?id=${id}`, art(`fig:${id}:1`, 48, 96))}</td>`).join('')}</tr>`).join('')}
          </table>
          <p class="hsrs-small">${L('Прыжок события: выберите героя', 'Event Warp: choose a hero')} (${ids.map(id => link(`/characters?id=${id}`, esc(H.CHARS[id].name))).join(', ')})${L(`. Каждая 5★ с него будет выбранным героем. Гарант 5★ на ${T.pity5}-м прыжке, 4★ не реже раза в ${T.pity4}.`, `. Every 5★ from it is the chosen hero. 5★ guaranteed by Warp ${T.pity5}, 4★ at least once every ${T.pity4}.`)}</p>
          <p class="hsrs-small">${L('Стандартный прыжок:', 'Standard Warp:')} ${H.BANNERS.std.featured.map(id => link(`/characters?id=${id}`, esc(H.CHARS[id].name))).join(', ')}.</p>
        </div>`;
    },

    renderDownload() {
      return `
        <h1 class="hsrs-h1">${L('Загрузка', 'Download')}</h1>
        <table class="hsrs-ticket" cellspacing="0" cellpadding="0">
          <tr>
            <td class="hsrs-ticket-stub">
              ${art('item:spass:48', 48, 48)}
              <div class="hsrs-ticket-stub-t">${L('Звёздный', 'Astral')}<br>${L('экспресс', 'Express')}</div>
              <div class="hsrs-ticket-no">&#8470; 0981-${BUILD.version}</div>
            </td>
            <td class="hsrs-ticket-main">
              <div class="hsrs-ticket-h">${L('Билет на Звёздный экспресс', 'Astral Express Ticket')}</div>
              <table class="hsrs-ticket-rows" cellspacing="0">
                <tr><td>${L('Браузер', 'Browser')}</td><td><b>${L('без установки', 'no install')}</b></td></tr>
                ${PC ? `<tr><td>${L('ПК', 'PC')}</td><td><b>${PC.url.split('/').pop()}</b>, ${mb(PC.bytes)} ${L('МБ', 'MB')}</td></tr>` : ''}
                <tr><td>Android</td><td><b>${APK_URL.split('/').pop()}</b>, ${mb(BUILD.apkBytes)} ${L('МБ', 'MB')}</td></tr>
                <tr><td>${L('Версия', 'Version')}</td><td>${BUILD.version}</td></tr>
                <tr><td>${L('Цена', 'Price')}</td><td>${L('бесплатно', 'free')}</td></tr>
              </table>
              <div class="hsrs-ticket-act">${this.primaryActions()}</div>
            </td>
          </tr>
        </table>

        <table class="hsrs-two" cellspacing="0">
          <tr>
            <td>
              <h2 class="hsrs-h2">${L('В браузере', 'In the browser')}</h2>
              <ol class="hsrs-steps">
                <li>${L('Нажмите «Играть». Игра откроется на весь экран.', 'Press "Play". The game opens full screen.')}</li>
                <li>${L('Первый запуск загружает около', 'The first start downloads about')} ${mb(BUILD.gameBytes)} ${L('МБ', 'MB')}${L(', музыка догружается по ходу игры.', '; music loads as you play.')}</li>
                <li>${L('Играйте с клавиатуры. На сенсорном экране сами появятся кнопки.', 'Play with the keyboard. On a touch screen, buttons appear by themselves.')}</li>
              </ol>
              <table class="hsrs-spec" cellspacing="0">
                <tr><td>${L('Браузер', 'Browser')}</td><td>${L('свежий Chrome, Edge, Firefox или Safari', 'a recent Chrome, Edge, Firefox or Safari')}</td></tr>
                <tr><td>${L('Управление', 'Controls')}</td><td>${L('клавиатура или сенсорный экран', 'keyboard or touch screen')}</td></tr>
                <tr><td>${L('Сохранения', 'Saves')}</td><td>${L('в браузере на вашем устройстве', 'in the browser on your device')}</td></tr>
              </table>
            </td>
            <td>
              <h2 class="hsrs-h2">${L('На Android', 'On Android')}</h2>
              <ol class="hsrs-steps">
                <li>${L('Нажмите «Android версия» и скачайте', 'Press "Android version" and download')} ${APK_URL.split('/').pop()}.</li>
                <li>${L('Откройте файл на телефоне. Android попросит разрешить установку из этого источника.', 'Open the file on your phone. Android will ask you to allow installs from this source.')}</li>
                <li>${L('Нажмите «Установить» и запустите Star Rail 98 с главного экрана.', 'Press "Install" and launch Star Rail 98 from the home screen.')}</li>
              </ol>
              <table class="hsrs-spec" cellspacing="0">
                <tr><td>${L('Система', 'System')}</td><td>${L('Android 7.0 или новее', 'Android 7.0 or newer')}</td></tr>
                <tr><td>${L('Экран', 'Screen')}</td><td>${L('горизонтальный', 'landscape')}</td></tr>
                <tr><td>${L('Интернет', 'Internet')}</td><td>${L('только для обновлений, игра внутри APK', 'only for updates, the game is inside the APK')}</td></tr>
              </table>
              ${PAROHOD ? `<p class="hsrs-small">${L('Другие игры на телефон: Forza Horizon: Рига, Grand Theft Auto: Нижний Сити и Serious Sam 98. Это отдельное приложение, игры скачиваются внутри него:', 'More games for your phone: Forza Horizon: Riga, Grand Theft Auto: Nizhny City and Serious Sam 98. It is a separate app, and the games download inside it:')} ${parohodLink()}.</p>` : ''}
            </td>
          </tr>
        </table>

        ${PC ? `<h2 class="hsrs-h2">${L('На ПК', 'On PC')}</h2>
        <table class="hsrs-two" cellspacing="0">
          <tr>
            <td>
              <ol class="hsrs-steps">
                <li>${L('Нажмите «Для ПК» и скачайте', 'Press "For PC" and download')} ${PC.url.split('/').pop()}.</li>
                <li>${L('Распакуйте архив в любую папку, например', 'Unpack the archive into any folder, for example')} D:\\Games.</li>
                <li>${L('Запустите StarRail98.exe. Первый запуск может занять 15–20 секунд, пока антивирус проверяет файлы.', 'Run StarRail98.exe. The first start can take 15–20 seconds while your antivirus checks the files.')}</li>
                <li>${L('Дальше игра обновляется сама: при запуске она проверяет новую версию и качает только изменённые файлы.', 'After that the game updates itself: on start it checks for a new version and downloads only changed files.')}</li>
              </ol>
            </td>
            <td>
              <table class="hsrs-spec" cellspacing="0">
                <tr><td>${L('Система', 'System')}</td><td>${L('Win 10 или 11, 64 бит', 'Win 10 or 11, 64-bit')}</td></tr>
                <tr><td>${L('Архив', 'Archive')}</td><td>${mb(PC.bytes)} ${L('МБ', 'MB')}, ${L('версия', 'version')} ${PC.version}</td></tr>
                <tr><td>${L('Интернет', 'Internet')}</td><td>${L('только для обновлений', 'only for updates')}</td></tr>
                <tr><td>${L('Сохранения', 'Saves')}</td><td>${L('на вашем компьютере, отдельно от папки игры', 'on your computer, separate from the game folder')}</td></tr>
              </table>
            </td>
          </tr>
        </table>` : ''}

        <h2 class="hsrs-h2">${L('Если что-то пошло не так', 'If something goes wrong')}</h2>
        ${FAQ.slice(2, 5).map(([q, a]) => `<p><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}
        <p>${L('Не помогло? Напишите нам в', 'Didn\'t help? Write to us on')} <a href="${TELEGRAM}">Telegram</a>.</p>`;
    },

    renderNewsList() {
      return `
        <h1 class="hsrs-h1">${L('Новости', 'News')}</h1>
        <table class="hsrs-newslist" cellspacing="0">
          ${NEWS.map(n => `
          <tr>
            <td class="hsrs-date">${n.date}</td>
            <td class="hsrs-tag">${n.tag}</td>
            <td><b>${link(`/news?id=${n.id}`, esc(n.title))}</b><br><span class="hsrs-lead">${esc(n.lead)}</span></td>
          </tr>`).join('')}
        </table>`;
    },

    renderArticle(id) {
      const i = NEWS.findIndex(n => n.id === id);
      const n = NEWS[i];
      const newer = NEWS[i - 1];
      const older = NEWS[i + 1];
      return `
        <p class="hsrs-crumbs">${link('/news', L('Новости', 'News'))} &gt; ${n.tag}</p>
        <h1 class="hsrs-h1">${esc(n.title)}</h1>
        <p class="hsrs-date-line">${n.date}</p>
        <p class="hsrs-article-lead">${esc(n.lead)}</p>
        ${n.body.map(p => `<p>${esc(p)}</p>`).join('')}
        <table class="hsrs-pager" cellspacing="0"><tr>
          <td>${older ? `&lt; ${link(`/news?id=${older.id}`, esc(older.title))}` : ''}</td>
          <td class="hsrs-right">${newer ? `${link(`/news?id=${newer.id}`, esc(newer.title))} &gt;` : ''}</td>
        </tr></table>`;
    },

    renderCharacters() {
      const H = Hsr();
      if (!H || !H.CHARS) return this.renderNoData();
      const ids = this.characterIds();
      return `
        <h1 class="hsrs-h1">${L('Персонажи', 'Characters')}</h1>
        <p>${L(`В игре ${ids.length} героев. Каждый идёт своим Путём: Путь определяет роль в бою. Нажмите на героя, чтобы увидеть его способности и картину Эйдолонов.`, `The game has ${ids.length} heroes. Each follows a Path, and the Path sets their role in battle. Click a hero to see their abilities and Eidolon painting.`)}</p>
        ${PATH_ORDER.map(p => {
          const list = ids.filter(id => H.CHARS[id].path === p);
          return `
          <div class="hsrs-path">
            <div class="hsrs-path-h">${art(`path:${p}:28`, 28, 28)}<span>${H.PATHS[p].name}</span><em>${PATH_ROLE[p]}</em></div>
            <div class="hsrs-cards">
              ${list.map(id => this.renderCard(id)).join('')}
            </div>
          </div>`;
        }).join('')}`;
    },

    renderCard(id) {
      const H = Hsr();
      const c = H.CHARS[id];
      const el = H.ELEMENTS[c.elem];
      return `
        <a class="hsrs-card" href="${href(`/characters?id=${id}`)}">
          <span class="hsrs-card-pic">${art(`fig:${id}:2`, 96, 192)}</span>
          <span class="hsrs-card-name">${esc(c.name)}</span>
          ${diamonds(c.rarity)}
          <span class="hsrs-elem" style="color:${el.col}">${el.name}</span>
        </a>`;
    },

    describeKit(c, kit) {
      const H = Hsr();
      const words = [];
      (kit.fx || []).forEach(f => {
        let w = null;
        if (f.k === 'dmg') w = `${H.ELEMENTS[f.e || c.elem].name.toLowerCase()} ${L('урон', 'DMG')}`;
        else w = FX_WORDS[f.k] || null;
        if (w && !words.includes(w)) words.push(w);
      });
      const target = TARGETS[kit.target] || '';
      return `${target}${words.length ? ': ' + words.join(', ') : ''}.`;
    },

    renderKit(c) {
      const rows = [[L('Обычная атака', 'Basic ATK'), c.basic], [L('Навык', 'Skill'), c.skill], [L('Абсолютная техника', 'Ultimate'), c.ult]].filter(([, k]) => k);
      return `
        <table class="hsrs-kit" cellspacing="0">
          ${rows.map(([label, k]) => `<tr><td class="hsrs-kit-l">${label}</td><td><b>${esc(k.name)}</b><br>${esc(this.describeKit(c, k))}</td></tr>`).join('')}
          ${c.talent ? `<tr><td class="hsrs-kit-l">${L('Талант', 'Talent')}</td><td>${esc(c.talent)}</td></tr>` : ''}
          ${c.tech ? `<tr><td class="hsrs-kit-l">${L('Техника на карте', 'Technique')}</td><td><b>${esc(c.tech.name)}</b><br>${esc(c.tech.text)}</td></tr>` : ''}
        </table>`;
    },

    renderCharacter(id) {
      const H = Hsr();
      if (!H || !H.CHARS) return this.renderNoData();
      const c = H.CHARS[id];
      const el = H.ELEMENTS[c.elem];
      const ids = this.characterIds();
      const i = ids.indexOf(id);
      const prev = ids[(i - 1 + ids.length) % ids.length];
      const next = ids[(i + 1) % ids.length];
      const line = H.WarpIntro && H.WarpIntro.has(id) ? H.WarpIntro.line(id) : '';
      const fusions = H.FUSIONS ? Object.values(H.FUSIONS).filter(f => f.members.includes(id) || (id === 'trail' && f.members.includes('trail_p'))) : [];
      const scene = H.Eidolons && H.Eidolons.has(id) ? H.Eidolons.SCENES[id] : null;
      const kits = id === 'trail'
        ? `<h2 class="hsrs-h2">${L('Путь Разрушения', 'Path of Destruction')}</h2>${this.renderKit(c)}<h2 class="hsrs-h2">${L('Путь Сохранения', 'Path of Preservation')}</h2><p>${L('Позже по сюжету Первопроходец меняет Путь и получает огненное копьё.', 'Later in the story the Trailblazer changes Path and gets a fiery spear.')}</p>${this.renderKit(H.CHARS.trail_p)}`
        : `<h2 class="hsrs-h2">${L('Способности', 'Abilities')}</h2>${this.renderKit(c)}`;
      return `
        <p class="hsrs-crumbs">${link('/characters', L('Персонажи', 'Characters'))} &gt; ${H.PATHS[c.path].name}</p>
        <table class="hsrs-hero" cellspacing="0" cellpadding="0">
          <tr>
            <td class="hsrs-hero-pic">
              <div class="hsrs-platform">${art(`fig:${id}:3`, 144, 288)}</div>
              ${id === 'trail' ? `<div class="hsrs-alt">${art('figf:trail:1', 48, 96)}<span>${L('Первопроходец может быть и девушкой: выбор в начале игры.', 'The Trailblazer can also be a girl: you choose at the start of the game.')}</span></div>` : ''}
            </td>
            <td class="hsrs-hero-info">
              <h1 class="hsrs-h1">${esc(c.name)}</h1>
              <p>${diamonds(c.rarity)} &nbsp; ${art(`path:${c.path}:16`, 16, 16, 'hsrs-inline')} ${L('Путь', 'Path')}: <b>${H.PATHS[c.path].name}</b> &nbsp; ${L('Стихия', 'Type')}: <b style="color:${el.col}">${el.name}</b></p>
              ${line ? `<blockquote class="hsrs-quote">${esc(line)}</blockquote>` : ''}
              <table class="hsrs-spec" cellspacing="0">
                <tr><td>${L('Здоровье', 'HP')}</td><td>${c.base.hp}</td><td>${L('Атака', 'ATK')}</td><td>${c.base.atk}</td></tr>
                <tr><td>${L('Защита', 'DEF')}</td><td>${c.base.def}</td><td>${L('Скорость', 'SPD')}</td><td>${c.base.spd}</td></tr>
                <tr><td>${L('Энергия', 'Energy')}</td><td>${c.energy}</td><td>${L('Пробитие', 'Break')}</td><td>${H.BREAK_EFFECT[c.elem]}</td></tr>
              </table>
              <p class="hsrs-small">${L('Характеристики на 1 уровне. Как получить:', 'Stats at level 1. How to get:')} ${esc(this.source(id))}.</p>
              ${kits}
              ${fusions.length ? `<h2 class="hsrs-h2">${L('Слияния', 'Fusions')}</h2>${fusions.map(f => `<p><b>${esc(f.name)}</b> (${f.members.map(m => esc(this.memberName(m))).join(L(' и ', ' and '))}). ${esc(f.text)}</p>`).join('')}` : ''}
            </td>
          </tr>
        </table>
        ${scene ? `
        <h2 class="hsrs-h2">${L('Картина Эйдолонов:', 'Eidolon painting:')} ${esc(scene.title)}</h2>
        <table class="hsrs-eid" cellspacing="0" cellpadding="0"><tr>
          <td>${art(`eid:${id}`, 320, 240, 'hsrs-eid-pic')}</td>
          <td><p>${L('Каждая копия героя из прыжка открывает Эйдолон и добавляет кусочек картины. Сначала она чёрно-белая, со второго Эйдолона цветная, с третьего появляются детали, а на шестом картина оживает.', 'Every copy of a hero from a Warp unlocks an Eidolon and adds a piece of the painting. It starts black and white, turns color at the second Eidolon, gains details at the third, and comes alive at the sixth.')}</p>
          <ol class="hsrs-frags">${scene.frags.map(([name, text]) => `<li><b>${esc(name)}.</b> ${esc(text)}</li>`).join('')}</ol></td>
        </tr></table>` : ''}
        <table class="hsrs-pager" cellspacing="0"><tr>
          <td>&lt; ${link(`/characters?id=${prev}`, esc(H.CHARS[prev].name))}</td>
          <td class="hsrs-right">${link(`/characters?id=${next}`, esc(H.CHARS[next].name))} &gt;</td>
        </tr></table>`;
    },

    renderWorlds() {
      const H = Hsr();
      if (!H || !H.WORLDS) return this.renderNoData();
      const area = (a) => `
        <tr>
          <td class="hsrs-area-pic">${AREA_STILL[a.map] ? art(`still:${AREA_STILL[a.map]}`, 160, 120) : ''}</td>
          <td><b>${esc(a.name)}</b><br>${esc(a.text)}</td>
        </tr>`;
      const bosses = Object.keys(H.ENEMIES).filter(k => H.ENEMIES[k].boss);
      const foes = Object.keys(H.ENEMIES).filter(k => !H.ENEMIES[k].boss);
      return `
        <h1 class="hsrs-h1">${L('Миры', 'Worlds')}</h1>
        <p>${L(`Звёздный экспресс ходит по Звёздному пути, рельсам, которые проложили Эоны. В версии ${BUILD.version} на маршруте станция «Герта» и Ярило-VI, событие KonoSuba x SR98 уводит Экспресс в Белзерг, а Лофу Сяньчжоу уже видна на карте.`, `The Astral Express runs on the Star Rail, tracks laid by the Aeons. In version ${BUILD.version} the route covers Herta Space Station and Jarilo-VI, the KonoSuba x SR98 event takes the Express to Belzerg, and the Xianzhou Luofu is already on the map.`)}</p>
        <div class="hsrs-world">
          <h2 class="hsrs-h2">${esc(H.EXPRESS_AREA.name)}</h2>
          <table class="hsrs-areas" cellspacing="0">${area(Object.assign({}, H.EXPRESS_AREA, { name: L('Вагон-салон', 'Parlor Car') }))}</table>
        </div>
        ${H.WORLDS.map(w => `
        <div class="hsrs-world">
          <h2 class="hsrs-h2">${esc(w.name)}</h2>
          ${w.groups.length ? w.groups.map(g => `
            ${w.groups.length > 1 ? `<h3 class="hsrs-h3">${esc(g.name)}</h3>` : ''}
            <table class="hsrs-areas" cellspacing="0">${g.areas.map(area).join('')}</table>`).join('') : L('<p class="hsrs-locked">Маршрут ещё не проложен. На звёздной карте Экспресса этот мир пока под замком.</p>', '<p class="hsrs-locked">The route isn\'t laid yet. On the Express star map this world is still locked.</p>')}
        </div>`).join('')}
        <h2 class="hsrs-h2">${L('Кого вы встретите', 'Who you will meet')}</h2>
        <div class="hsrs-foes">
          ${foes.map(k => `<span class="hsrs-foe">${art(`foe:${k}:52`, 52, 52)}<span>${esc(H.ENEMIES[k].name)}</span></span>`).join('')}
        </div>
        <h3 class="hsrs-h3">${L('Боссы', 'Bosses')}</h3>
        <div class="hsrs-foes hsrs-foes-boss">
          ${bosses.map(k => `<span class="hsrs-foe">${art(`foe:${k}:70`, 70, 70)}<span>${esc(H.ENEMIES[k].name)}</span></span>`).join('')}
        </div>`;
    },

    renderPlay() {
      const H = Hsr();
      if (!H || !H.ELEMENTS) return this.renderNoData();
      const T = H.TUNING;
      return `
        <h1 class="hsrs-h1">${L('Как играть', 'How to Play')}</h1>
        <p>${L('Вы ходите по карте, говорите с людьми и находите сундуки. Враги бродят по карте открыто. Ударьте первым (клавиша F), и бой начнётся с вашего хода. Если враг заметит вас раньше, первый ход будет за ним.', 'You walk the map, talk to people and find chests. Enemies roam the map in the open. Strike first (F key) and the battle starts on your turn. If an enemy spots you first, it gets the first turn.')}</p>

        <h2 class="hsrs-h2">${L('Бой', 'Battle')}</h2>
        <table class="hsrs-rules" cellspacing="0">
          <tr><td>${L('Шкала хода', 'Action Order')}</td><td>${L('Слева на экране видно, кто ходит следующим. Чем выше скорость, тем чаще ход.', 'The left side of the screen shows who acts next. The higher the SPD, the more often a unit acts.')}</td></tr>
          <tr><td>${L('Очки навыка', 'Skill Points')}</td><td>${L(`Общие на команду, не больше ${T.spMax}. Обычная атака даёт одно очко, навык тратит одно.`, `Shared by the team, up to ${T.spMax}. A Basic ATK gives one point, a Skill spends one.`)}</td></tr>
          <tr><td>${L('Абсолютная техника', 'Ultimate')}</td><td>${L('Копит энергию за удары. Когда кольцо светится, нажмите номер героя: он ударит вне очереди.', 'Charges Energy from attacks. When the ring glows, press the hero\'s number and they strike out of turn.')}</td></tr>
          <tr><td>${L('Пробитие', 'Weakness Break')}</td><td>${L('Бейте врага стихией, к которой он уязвим. Когда шкала стойкости опустеет, враг теряет ход и получает эффект стихии.', 'Hit an enemy with a Type it is weak to. When its Toughness bar empties, it loses its turn and suffers that Type\'s effect.')}</td></tr>
          <tr><td>${L('Техника', 'Technique')}</td><td>${L(`У лидера на карте есть техника (клавиша E). Она тратит очко техники и помогает в начале боя. Очков не больше ${T.tpMax}.`, `The leader on the map has a Technique (E key). It spends a Technique Point and helps at the start of battle. Up to ${T.tpMax} points.`)}</td></tr>
          <tr><td>${L('Контакт', 'Contact')}</td><td>${L('С врагом можно поговорить (T). Подберите подход: кто-то любит шутки, кто-то боится угроз. Довольный враг уходит из боя и оставляет награду, разозлённый бьёт сильнее. Боссы не слушают.', 'You can talk to an enemy (T). Find the right approach: some like jokes, some fear threats. A pleased enemy leaves the battle and drops a reward; an angry one hits harder. Bosses do not listen.')}</td></tr>
          <tr><td>${L('Слияние', 'Fusion')}</td><td>${L('Двое героев с общей историей бьют вместе (R), когда у обоих готова абсолютная техника. Тратит энергию обоих.', 'Two heroes with a shared story strike together (R) when both have their Ultimate ready. Uses both Energy bars.')}</td></tr>
          <tr><td>${L('Слухи', 'Rumors')}</td><td>${L('У Сампо можно купить слух, и он сбудется: в лавке появится новый товар, на карте новый враг, у Пом-Пом скидка.', 'You can buy a rumor from Sampo and it comes true: a new item in a shop, a new enemy on the map, a discount at Pom-Pom\'s.')}</td></tr>
        </table>

        <h2 class="hsrs-h2">${L('Стихии', 'Types')}</h2>
        <table class="hsrs-elems" cellspacing="0">
          <tr><th>${L('Стихия', 'Type')}</th><th>${L('Эффект пробития', 'Break effect')}</th></tr>
          ${H.ELEMENT_KEYS.map(k => `<tr><td><span class="hsrs-swatch" style="background:${H.ELEMENTS[k].col}"></span>${H.ELEMENTS[k].name}</td><td>${H.BREAK_EFFECT[k]}</td></tr>`).join('')}
        </table>

        <h2 class="hsrs-h2">${L('Пути', 'Paths')}</h2>
        <table class="hsrs-paths" cellspacing="0">
          ${PATH_ORDER.map(p => `<tr><td>${art(`path:${p}:24`, 24, 24)}</td><td><b>${H.PATHS[p].name}</b></td><td>${PATH_ROLE[p]}</td></tr>`).join('')}
        </table>

        <h2 class="hsrs-h2">${L('Слияния', 'Fusions')}</h2>
        <table class="hsrs-fusions" cellspacing="0">
          <tr><th>${L('Слияние', 'Fusion')}</th><th>${L('Кто', 'Who')}</th><th>${L('Что делает', 'What it does')}</th></tr>
          ${Object.values(H.FUSIONS).map(f => `<tr><td><b>${esc(f.name)}</b></td><td>${f.members.map(m => link(`/characters?id=${m === 'trail_p' ? 'trail' : m}`, esc(this.memberName(m)))).join(', ')}</td><td>${esc(f.text)}</td></tr>`).join('')}
        </table>

        <h2 class="hsrs-h2">${L('Прыжки', 'Warps')}</h2>
        <p>${L(`На Экспрессе стоит терминал прыжков. Один прыжок стоит один пропуск или ${T.warpCost} звёздного нефрита. С прыжка выпадают герои и световые конусы. Гарант: 5★ не позже ${T.pity5}-го прыжка, 4★ не реже раза в ${T.pity4} прыжков. У каждого прыжка свой счётчик гаранта.`, `The Express has a Warp terminal. One Warp costs one pass or ${T.warpCost} Stellar Jade. Warps drop heroes and Light Cones. Guarantee: a 5★ by Warp ${T.pity5}, a 4★ at least once every ${T.pity4} Warps. Each Warp has its own pity counter.`)}</p>

        <h2 class="hsrs-h2">${L('Управление', 'Controls')}</h2>
        <table class="hsrs-rules" cellspacing="0">
          ${CONTROLS.map(([where, keys]) => `<tr><td>${where}</td><td>${keys}</td></tr>`).join('')}
        </table>`;
    },

    renderGallery() {
      const items = this.galleryItems();
      const groups = [...new Set(items.map(i => i.group))];
      return `
        <h1 class="hsrs-h1">${L('Галерея', 'Gallery')}</h1>
        <p>${L('Нажмите на картинку, чтобы открыть её крупно.', 'Click a picture to open it large.')}</p>
        ${groups.map(g => `
          <h2 class="hsrs-h2">${g}</h2>
          <div class="hsrs-gallery">
            ${items.map((it, n) => it.group === g ? `<a class="hsrs-gal" href="${href(`/gallery?pic=${n}`)}">${this.pictureHtml(it, 160, 120)}<span>${esc(it.title)}</span></a>` : '').join('')}
          </div>`).join('')}`;
    },

    pictureHtml(it, w, h) {
      if (it.kind === 'shot') return `<img src="${it.src}" width="${w}" height="${h}" alt="${esc(it.title)}">`;
      return art(`${it.kind}:${it.id}`, w, h);
    },

    renderPicture(n) {
      const items = this.galleryItems();
      const it = items[n];
      const prev = (n - 1 + items.length) % items.length;
      const next = (n + 1) % items.length;
      return `
        <p class="hsrs-crumbs">${link('/gallery', L('Галерея', 'Gallery'))} &gt; ${it.group}</p>
        <div class="hsrs-viewer">
          ${it.kind === 'shot' ? this.pictureHtml(it, 640, 480) : art(`${it.kind}:${it.id}`, 640, 480)}
          <p class="hsrs-viewer-cap">${esc(it.title)} <span class="hsrs-small">(${n + 1} ${L('из', 'of')} ${items.length})</span></p>
          <p>&lt; ${link(`/gallery?pic=${prev}`, L('Предыдущая', 'Previous'))} &nbsp;|&nbsp; ${link('/gallery', L('Все картинки', 'All pictures'))} &nbsp;|&nbsp; ${link(`/gallery?pic=${next}`, L('Следующая', 'Next'))} &gt;</p>
        </div>`;
    },

    renderNoData() {
      return L('<p>Данные игры не загрузились. Обновите страницу.</p>', '<p>The game data didn\'t load. Refresh the page.</p>');
    },

    renderSupport() {
      return `
        <h1 class="hsrs-h1">${L('Поддержка', 'Support')}</h1>
        <p>${L('Здесь ответы на частые вопросы. Если вашего вопроса нет, напишите нам в', 'Here are answers to common questions. If yours isn\'t here, write to us on')} <a href="${TELEGRAM}">Telegram</a>. ${L('Опишите, что вы делали и что увидели на экране.', 'Describe what you were doing and what you saw on screen.')}</p>
        <dl class="hsrs-faq">
          ${FAQ.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}
        </dl>`;
    },

    renderMissing() {
      return `
        <h1 class="hsrs-h1">${L('Станция не найдена', 'Station not found')}</h1>
        <p>${L('По этому адресу ничего нет. Возможно, страница переехала или в адресе опечатка.', 'There is nothing at this address. The page may have moved, or there is a typo.')}</p>
        <p>${link('', L('На главную', 'Home page'))} ${L('или', 'or')} ${link('/download', L('к загрузке игры', 'download the game'))}.</p>`;
    },

    paintArt(cv) {
      const H = Hsr();
      if (!H || !H.Gfx) return;
      const G = H.Gfx;
      const [kind, id, arg] = cv.dataset.art.split(':');
      const g = cv.getContext('2d');
      if (!g) return;
      g.imageSmoothingEnabled = false;
      const fit = (src) => g.drawImage(src, 0, 0, cv.width, cv.height);
      if (kind === 'fig') fit(G.figureCanvas(G.lookOf(id, null), Number(arg) || 1));
      else if (kind === 'figf') fit(G.figureCanvas(G.trailLook('f'), Number(arg) || 1));
      else if (kind === 'bust') fit(G.bustCanvas(G.lookOf(id, null), Number(arg) || 64));
      else if (kind === 'path') G.pathIcon(g, id, 0, 0, cv.width, '#f3dc96');
      else if (kind === 'item') G.itemIcon(g, id, 0, 0, cv.width);
      else if (kind === 'foe') fit(G.foeCanvas(id, Number(arg) || 52, 0));
      else if (kind === 'still') H.Cine.still(g, id, cv.width, cv.height, 0, null);
      else if (kind === 'eid') fit(H.Eidolons.pic(id).colorD);
      else if (kind === 'title') this.startWindow(cv);
    },

    starTile() {
      if (this.tile !== undefined) return this.tile;
      this.tile = null;
      if (typeof document === 'undefined' || !document.createElement) return null;
      const cv = document.createElement('canvas');
      cv.width = 96;
      cv.height = 96;
      const g = cv.getContext && cv.getContext('2d');
      if (!g || !cv.toDataURL) return null;
      g.fillStyle = '#0b0f26';
      g.fillRect(0, 0, 96, 96);
      const colors = ['#4a5088', '#6a70a8', '#9aa0d0', '#f3dc96'];
      for (let i = 0; i < 26; i++) {
        g.fillStyle = colors[i % 7 === 0 ? 3 : i % 3];
        g.fillRect((i * 37 + 11) % 96, (i * 61 + 7) % 96, 1, 1);
      }
      this.tile = cv.toDataURL('image/png');
      return this.tile;
    },

    startWindow(cv) {
      const H = Hsr();
      if (!H || !H.TitleScene) return;
      const g = cv.getContext('2d');
      const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - 4000;
      let last = 0;
      const step = (now) => {
        if (!cv.isConnected) return;
        if (now - last >= 80) {
          last = now;
          H.TitleScene.draw(g, cv.width, cv.height, (now - t0) / 1000);
        }
        this.anim = requestAnimationFrame(step);
      };
      H.TitleScene.draw(g, cv.width, cv.height, 4);
      const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!still && typeof requestAnimationFrame === 'function') this.anim = requestAnimationFrame(step);
    },

    paintAll(container) {
      if (this.anim && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.anim);
      this.anim = null;
      container.querySelectorAll('canvas.hsrs-art').forEach(cv => {
        try { this.paintArt(cv); } catch (e) { console.warn('sr98 site art', cv.dataset.art, e); }
      });
    },

    show() {
      const root = document.getElementById('site');
      root.innerHTML = this.renderSite(location.hash);
      this.paintAll(root);
      const route = this.parseRoute(location.hash);
      const title = root.querySelector('.hsrs-body .hsrs-h1');
      document.title = route.view === 'home' || !title ? 'Star Rail 98' : `${title.textContent} | Star Rail 98`;
    }
  };

  document.documentElement.lang = LANG;
  if (LANG === 'en' && Hsr() && Hsr().setLang) Hsr().setLang('en', {});
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[data-lang]');
    if (!a) return;
    e.preventDefault();
    try { localStorage.setItem(LANG_KEY, a.dataset.lang); } catch (err) {}
    location.reload();
  });
  const page = document.querySelector('.hsrs-page');
  const tile = site.starTile();
  if (page && tile) page.style.backgroundImage = `url(${tile})`;
  site.show();
  const loadPointer = name => fetch('../update/sr98/' + name + '.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null));
  loadPointer('stable')
    .then(p => p || loadPointer('test'))
    .then(p => {
      if (!p) return;
      if (p.apk && p.apk.url) {
        APK_URL = '../update/sr98/' + p.apk.url;
        BUILD.version = p.version || BUILD.version;
        BUILD.apkBytes = p.apk.bytes || BUILD.apkBytes;
      }
      if (p.full && p.full.url) PC = { url: '../update/sr98/' + p.full.url, bytes: p.full.bytes, version: p.full.version };
      site.show();
    })
    .catch(() => {});
  fetch('../update/parohod98/stable.json', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(p => {
      if (!p || !p.apk) return;
      PAROHOD = { url: '../update/parohod98/' + p.apk.url, bytes: p.apk.bytes };
      site.show();
    })
    .catch(() => {});
  addEventListener('hashchange', () => {
    site.show();
    scrollTo(0, 0);
  });
})();
