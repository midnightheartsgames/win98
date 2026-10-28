(() => {
  const BUILD = JSON.parse(document.getElementById('sr98-build').textContent);
  const PLAY_URL = 'play/index.html';
  let APK_URL = BUILD.apk;
  let PC = null;
  const TELEGRAM = 'https://t.me/Penny_Gachimen';
  const SHOTS = ['Бой на станции «Герта»', 'Административный район Белобога'];

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
  const mb = (bytes) => (bytes / 1048576).toFixed(1).replace('.', ',');

  const NAV = [
    ['home', '', 'Главная'],
    ['download', '/download', 'Загрузка'],
    ['news', '/news', 'Новости'],
    ['characters', '/characters', 'Персонажи'],
    ['worlds', '/worlds', 'Миры'],
    ['play', '/play', 'Как играть'],
    ['gallery', '/gallery', 'Галерея'],
    ['support', '/support', 'Поддержка']
  ];
  const NAV_OF = { news: 'news', article: 'news', characters: 'characters', character: 'characters', gallery: 'gallery', picture: 'gallery' };

  const PATH_ORDER = ['destruction', 'hunt', 'erudition', 'harmony', 'nihility', 'preservation', 'abundance', 'remembrance'];
  const PATH_ROLE = {
    destruction: 'Бойцы первой линии. Бьют сильно, часто по нескольким врагам, и держат удар.',
    hunt: 'Убийцы одной цели. Лучше всех добивают боссов и сильных врагов.',
    erudition: 'Бьют по всем врагам сразу. Незаменимы против толпы.',
    harmony: 'Усиливают команду: атаку, скорость, урон от пробития.',
    nihility: 'Ослабляют врагов и наносят урон со временем.',
    preservation: 'Щиты и провокация. Принимают удары на себя.',
    abundance: 'Лечат команду и снимают ослабления.',
    remembrance: 'Вызывают помощников, которые ходят в бою сами и бьют по врагам.'
  };
  const STORY_JOIN = ['trail', 'march', 'danheng', 'arlan', 'hook', 'natasha', 'serval'];
  const TARGETS = { single: 'Одна цель', blast: 'Цель и соседи', all: 'Все враги', bounce: 'Отскоки по врагам', ally: 'Союзник', allies: 'Вся команда', self: 'На себя' };
  const FX_WORDS = {
    heal: 'лечение', hot: 'лечение каждый ход', shield: 'щит', buff: 'усиление', debuff: 'ослабление врагов', dot: 'урон со временем',
    freeze: 'шанс заморозки', imprison: 'заточение', taunt: 'провокация', advance: 'ход раньше', cleanse: 'снимает ослабления',
    dispel: 'снимает усиления врага', resurge: 'возвращает в бой', invig: 'оживление', magma: 'заряд Магмы', bloom: 'цветение пробитых врагов'
  };

  const AREA_STILL = {
    hs_control: 'station', hs_storage: 'cargo', express: 'express', j_plains: 'jarilo', j_belobog: 'belobog', j_fissures: 'snowgate',
    j_everwinter: 'everwinter', u_boulder: 'boulder', u_mine: 'mine', u_rivet: 'rivet',
    j_restricted: 'restricted', j_backwater: 'alley', j_workshop: 'workshop', j_hotel: 'hotel', j_fort: 'fort', j_pathspace: 'pathspace', j_pillars: 'pillars',
    u_clinic: 'clinic', u_grandhotel: 'grandhotel', u_rivet2: 'orphan', u_settle: 'settlement', u_settle1: 'settlement', u_camp: 'mine', u_rivet3: 'rivet'
  };

  const STILLS = [
    ['station', 'Главный пульт станции «Герта»'],
    ['cargo', 'Зона хранения станции'],
    ['express', 'Вагон-салон Звёздного экспресса'],
    ['jarilo', 'Пригородные снежные поля'],
    ['snowgate', 'Стены Белобога'],
    ['belobog', 'Белобог и Форт Клипота'],
    ['fort', 'Форт Клипота'],
    ['workshop', 'Мастерская Сервал'],
    ['hotel', 'Отель «Гёте» ночью'],
    ['nightstreet', 'Ночные улицы Белобога'],
    ['alley', 'Переулок, где реальность треснула'],
    ['clinic', 'Клиника Наташи'],
    ['boulder', 'Камнеград'],
    ['mine', 'Большая шахта'],
    ['rivet', 'Заклёпкоград'],
    ['settlement', 'Поселение роботов'],
    ['restricted', 'Линия фронта'],
    ['everwinter', 'Холм вечнозимья'],
    ['summit', 'Вершина холма'],
    ['pathspace', 'Пространство Пути']
  ];

  const NEWS = window.SR98_NEWS || [];

  const FAQ = [
    ['Игра правда бесплатная?', 'Да. Звёздный нефрит и пропуски даёт сама игра: события, почта, сундуки, боссы и уровни Освоения. За деньги внутри игры ничего не продаётся.'],
    ['Нужно ли что-то устанавливать?', 'Нет. Нажмите «Играть», и игра запустится прямо в браузере. Для телефона есть Android-версия, её ставят из файла APK.'],
    ['Где хранятся сохранения?', 'В браузере, на вашем устройстве. Если очистить данные сайта, сохранения пропадут. У Android-версии свои сохранения, с браузерными они не общие.'],
    ['Можно играть на телефоне?', 'Да. На сенсорном экране сами появляются кнопки: крестовина, A, B, Q, E и полная панель клавиш. Держите телефон горизонтально.'],
    ['Как поставить Android-версию?', `Скачайте ${APK_URL} и откройте его на телефоне. Android попросит разрешить установку из этого источника: разрешите и нажмите «Установить».`],
    ['Игра тормозит.', 'Откройте телефон (Esc), затем «Настройки» и поставьте «Разрешение» 640. Ещё помогает «Скорость боя» ×2 и выключенные сцены абсолютных техник.'],
    ['Как сохраниться?', 'У Якоря пространства или в безопасном месте, например на Экспрессе. Есть три ячейки и автосохранение.'],
    ['Игра на русском?', 'Да, полностью: диалоги, интерфейс и сцены. Сюжет идёт по заданиям Освоения версии 1.0.'],
    ['Можно играть за девушку?', 'Да. Перед началом вы выбираете Первопроходца, и все реплики подстраиваются под выбор.']
  ];

  const CONTROLS = [
    ['Карта', 'WASD или стрелки: идти (Shift: шагом). Пробел или Enter: говорить, использовать. F: атаковать врага на карте. E: техника лидера. 1–4: сменить лидера. M: карта. Esc: телефон'],
    ['Диалог', 'Enter или Пробел: дальше. Tab: пересказ и пропуск сцены'],
    ['Бой', 'Q: обычная атака. E: навык. Пробел или Enter: применить. ←/→: цель. 1–4: абсолютная техника. T: Контакт. R: Слияние. V: автобой. X: скорость боя'],
    ['Прыжок', 'Q/E: баннер. ←/→: один прыжок или десять. Enter: прыгнуть. H: история прыжков'],
    ['Карта навигации', '↑/↓: область. ←/→: следующая метка. Enter: карточка метки и телепорт. Tab: карта Звёздного пути']
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
      return id === 'trail_p' ? H.CHARS.trail.name + ' на Пути Сохранения' : H.CHARS[id].name;
    },

    source(id) {
      const H = Hsr();
      if (STORY_JOIN.includes(id)) return 'Присоединяется по сюжету';
      if (H && H.BANNERS && H.BANNERS.ev.stars[id]) return `Прыжок события «${H.BANNERS.ev.stars[id].name}»`;
      if (H && H.BANNERS && H.BANNERS.sig && H.BANNERS.sig.stars[id]) return `Поиск сигнала «${H.BANNERS.sig.stars[id].name}»`;
      if (H && H.BANNERS && H.BANNERS.conv && H.BANNERS.conv.stars[id]) return `Призыв резонатора «${H.BANNERS.conv.stars[id].name}»`;
      if (H && H.BANNERS && H.BANNERS.guild && H.BANNERS.guild.stars[id]) return `Гильдия, набор в отряд «${H.BANNERS.guild.stars[id].name}»`;
      if (H && H.BANNERS && H.BANNERS.guild && Object.values(H.BANNERS.guild.stars).some(s => s.four.includes(id))) return 'Гильдия, набор в отряд, 4★';
      if (H && H.BANNERS && H.BANNERS.mid && H.BANNERS.mid.stars[id]) return `Полуночный канал «${H.BANNERS.mid.stars[id].name}»`;
      if (H && H.BANNERS && H.BANNERS.con && H.BANNERS.con.stars[id]) return `Кон-Тон, главная сцена «${H.BANNERS.con.stars[id].name}»`;
      if (H && H.BANNERS && H.BANNERS.mid && Object.values(H.BANNERS.mid.stars).some(s => s.four.includes(id))) return 'Полуночный канал, 4★';
      if (H && H.BANNERS && H.BANNERS.sig && !H.WARP_POOL.four.includes(id) && Object.values(H.BANNERS.sig.stars).some(s => s.four.includes(id))) return 'Поиск сигнала, выделенный канал, агент A';
      if (H && H.WARP_POOL && H.WARP_POOL.five.includes(id)) return 'Стандартный прыжок «Путь Первопроходцев», 5★';
      if (H && H.WARP_POOL && H.WARP_POOL.four.includes(id)) return 'Стандартный прыжок и прыжки события, 4★';
      return 'Прыжки, 4★';
    },

    galleryItems() {
      const H = Hsr();
      const items = SHOTS.map((cap, i) => ({ kind: 'shot', src: `img/hsr98-${i + 1}.jpg`, title: cap, group: 'Кадры из игры' }));
      STILLS.forEach(([id, title]) => items.push({ kind: 'still', id, title, group: 'Места' }));
      if (H && H.Eidolons && H.CHARS) {
        this.characterIds().filter(id => H.Eidolons.has(id)).forEach(id => {
          items.push({ kind: 'eid', id, title: `${H.Eidolons.SCENES[id].title} (${H.CHARS[id].name})`, group: 'Картины Эйдолонов' });
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
      return `<a class="hsrs-btn hsrs-btn-big" href="${PLAY_URL}">Играть</a>${PC ? ` <a class="hsrs-btn hsrs-btn-big" href="${PC.url}" download>Для ПК</a>` : ''} <a class="hsrs-btn hsrs-btn-big" href="${APK_URL}" download>Android версия</a>`;
    },

    renderHeader() {
      return `
        <table class="hsrs-head" cellspacing="0" cellpadding="0">
          <tr>
            <td class="hsrs-head-left">
              <div class="hsrs-logo">
                <div class="hsrs-logo-big">Star Rail <span class="hsrs-logo-98">98</span></div>
              </div>
              <p class="hsrs-motto">Да приведёт нас этот путь к звёздам</p>
              <p class="hsrs-head-text">Пошаговая ролевая игра о Звёздном экспрессе. Полная версия, бесплатно, на русском языке.</p>
              <div class="hsrs-head-action">${this.primaryActions()}<span class="hsrs-head-note">Версия ${BUILD.version}. В браузере, на ПК или на Android</span></div>
            </td>
            <td class="hsrs-head-right">
              <div class="hsrs-window">${art('title', 320, 240, 'hsrs-window-view')}</div>
            </td>
          </tr>
        </table>`;
    },

    renderRoute(here) {
      return `
        <nav class="hsrs-route" aria-label="Разделы сайта">
          ${NAV.map(([key, path, label]) => `<a class="hsrs-stop${key === here ? ' is-here' : ''}" href="${href(path)}"${key === here ? ' aria-current="page"' : ''}><i></i><span>${label}</span></a>`).join('')}
        </nav>`;
    },

    renderFooter() {
      return `
        <div class="hsrs-foot">
          <div class="hsrs-foot-row">
            <span>Вопросы и ошибки: <a href="${TELEGRAM}">Telegram-канал</a></span>
            <span><a href="../kovcheg/">«Ковчег»: тир-лист и гайды</a> &nbsp; <a href="../sr98wiki/">АстралВики</a> &nbsp; <a href="../">Win 98 Web Edition</a></span>
          </div>
          <p>Star Rail 98 — некоммерческий фанатский проект Midnight Hearts. Мы не связаны с HoYoverse. Персонажи, названия и мир игры принадлежат их владельцам.</p>
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
                <h1 class="hsrs-h1">Добро пожаловать на борт</h1>
                <p>Первопроходец просыпается на космической станции «Герта» и не помнит, кто он. В груди у него Стелларон, камень, который приносит мирам беды. Его находят Март 7 и Дань Хэн из экипажа Звёздного экспресса.</p>
                <p>Экспресс идёт по Звёздному пути от мира к миру. Следующая остановка: Ярило-VI, ледяная планета, где город Белобог семьсот лет живёт за стеной и не знает, откуда пришла вечная зима.</p>
                <p>${link('/play', 'Как устроена игра')} &nbsp; ${link('/characters', 'Все персонажи')} &nbsp; ${link('/worlds', 'Куда идёт Экспресс')}</p>
              </div>
              <h2 class="hsrs-h2">Новости</h2>
              <table class="hsrs-newslist" cellspacing="0">
                ${latest.map((n, i) => `
                <tr>
                  <td class="hsrs-date">${n.date}</td>
                  <td>${i === 0 ? '<span class="hsrs-new">NEW!</span> ' : ''}<b>${link(`/news?id=${n.id}`, esc(n.title))}</b><br><span class="hsrs-lead">${esc(n.lead)}</span></td>
                </tr>`).join('')}
              </table>
              <p class="hsrs-more">${link('/news', 'Все новости')}</p>
            </td>
            <td class="hsrs-side">
              ${this.renderTicketMini()}
              ${H && H.BANNERS ? this.renderWarpBox() : ''}
              <div class="hsrs-box">
                <div class="hsrs-box-h">Из игры</div>
                <a href="${href('/gallery?pic=0')}"><img class="hsrs-thumb" src="img/hsr98-1.jpg" width="200" height="150" alt="${SHOTS[0]}"></a>
                <p class="hsrs-small">${link('/gallery', 'Галерея')}: кадры, места и картины Эйдолонов.</p>
              </div>
              <div class="hsrs-box">
                <div class="hsrs-box-h">Ковчег</div>
                <p class="hsrs-small">Сайт игроков с тир-листом всех героев, личными делами, отрядами, гайдами по Залу забвения и Виртуальной вселенной и конструктором команды.</p>
                <p class="hsrs-small"><a href="../kovcheg/">Открыть «Ковчег»</a></p>
              </div>
              <div class="hsrs-box">
                <div class="hsrs-box-h">АстралВики</div>
                <p class="hsrs-small">Энциклопедия игроков: персонажи, фракции и миры, карты с сундуками и записками, прохождение миссий, световые конусы, облики и питомцы.</p>
                <p class="hsrs-small"><a href="../sr98wiki/">Открыть АстралВики</a></p>
              </div>
            </td>
          </tr>
        </table>`;
    },

    renderTicketMini() {
      return `
        <div class="hsrs-ticket-mini">
          <div class="hsrs-ticket-mini-h">${art('item:spass:24', 24, 24)} Билет на Экспресс</div>
          <p>Полная версия ${BUILD.version}. Бесплатно, без регистрации.</p>
          <a class="hsrs-btn hsrs-btn-big" href="${PLAY_URL}">Играть</a>
          <p class="hsrs-small">${PC ? `<a href="${PC.url}" download>Для ПК</a>, ${mb(PC.bytes)} МБ · ` : ''}<a href="${APK_URL}" download>Android версия</a>, ${mb(BUILD.apkBytes)} МБ</p>
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
          <div class="hsrs-box-h">Сейчас в прыжке</div>
          <table class="hsrs-warp" cellspacing="0">
            ${rows.map(row => `<tr>${row.map(id => `<td>${link(`/characters?id=${id}`, art(`fig:${id}:1`, 48, 96))}</td>`).join('')}</tr>`).join('')}
          </table>
          <p class="hsrs-small">Прыжок события: выберите героя (${ids.map(id => link(`/characters?id=${id}`, esc(H.CHARS[id].name))).join(', ')}). Каждая 5★ с него будет выбранным героем. Гарант 5★ на ${T.pity5}-м прыжке, 4★ не реже раза в ${T.pity4}.</p>
          <p class="hsrs-small">Стандартный прыжок: ${H.BANNERS.std.featured.map(id => link(`/characters?id=${id}`, esc(H.CHARS[id].name))).join(', ')}.</p>
        </div>`;
    },

    renderDownload() {
      return `
        <h1 class="hsrs-h1">Загрузка</h1>
        <table class="hsrs-ticket" cellspacing="0" cellpadding="0">
          <tr>
            <td class="hsrs-ticket-stub">
              ${art('item:spass:48', 48, 48)}
              <div class="hsrs-ticket-stub-t">Звёздный<br>экспресс</div>
              <div class="hsrs-ticket-no">&#8470; 0981-${BUILD.version}</div>
            </td>
            <td class="hsrs-ticket-main">
              <div class="hsrs-ticket-h">Билет на Звёздный экспресс</div>
              <table class="hsrs-ticket-rows" cellspacing="0">
                <tr><td>Браузер</td><td><b>без установки</b></td></tr>
                ${PC ? `<tr><td>ПК</td><td><b>${PC.url.split('/').pop()}</b>, ${mb(PC.bytes)} МБ</td></tr>` : ''}
                <tr><td>Android</td><td><b>${APK_URL.split('/').pop()}</b>, ${mb(BUILD.apkBytes)} МБ</td></tr>
                <tr><td>Версия</td><td>${BUILD.version}</td></tr>
                <tr><td>Цена</td><td>бесплатно</td></tr>
              </table>
              <div class="hsrs-ticket-act">${this.primaryActions()}</div>
            </td>
          </tr>
        </table>

        <table class="hsrs-two" cellspacing="0">
          <tr>
            <td>
              <h2 class="hsrs-h2">В браузере</h2>
              <ol class="hsrs-steps">
                <li>Нажмите «Играть». Игра откроется на весь экран.</li>
                <li>Первый запуск загружает около ${mb(BUILD.gameBytes)} МБ, музыка догружается по ходу игры.</li>
                <li>Играйте с клавиатуры. На сенсорном экране сами появятся кнопки.</li>
              </ol>
              <table class="hsrs-spec" cellspacing="0">
                <tr><td>Браузер</td><td>свежий Chrome, Edge, Firefox или Safari</td></tr>
                <tr><td>Управление</td><td>клавиатура или сенсорный экран</td></tr>
                <tr><td>Сохранения</td><td>в браузере на вашем устройстве</td></tr>
              </table>
            </td>
            <td>
              <h2 class="hsrs-h2">На Android</h2>
              <ol class="hsrs-steps">
                <li>Нажмите «Android версия» и скачайте ${APK_URL.split('/').pop()}.</li>
                <li>Откройте файл на телефоне. Android попросит разрешить установку из этого источника.</li>
                <li>Нажмите «Установить» и запустите Star Rail 98 с главного экрана.</li>
              </ol>
              <table class="hsrs-spec" cellspacing="0">
                <tr><td>Система</td><td>Android 7.0 или новее</td></tr>
                <tr><td>Экран</td><td>горизонтальный</td></tr>
                <tr><td>Интернет</td><td>только для обновлений, игра внутри APK</td></tr>
              </table>
            </td>
          </tr>
        </table>

        ${PC ? `<h2 class="hsrs-h2">На ПК</h2>
        <table class="hsrs-two" cellspacing="0">
          <tr>
            <td>
              <ol class="hsrs-steps">
                <li>Нажмите «Для ПК» и скачайте ${PC.url.split('/').pop()}.</li>
                <li>Распакуйте архив в любую папку, например D:\\Games.</li>
                <li>Запустите StarRail98.exe. Первый запуск может занять 15–20 секунд, пока антивирус проверяет файлы.</li>
                <li>Дальше игра обновляется сама: при запуске она проверяет новую версию и качает только изменённые файлы.</li>
              </ol>
            </td>
            <td>
              <table class="hsrs-spec" cellspacing="0">
                <tr><td>Система</td><td>Win 10 или 11, 64 бит</td></tr>
                <tr><td>Архив</td><td>${mb(PC.bytes)} МБ, версия ${PC.version}</td></tr>
                <tr><td>Интернет</td><td>только для обновлений</td></tr>
                <tr><td>Сохранения</td><td>на вашем компьютере, отдельно от папки игры</td></tr>
              </table>
            </td>
          </tr>
        </table>` : ''}

        <h2 class="hsrs-h2">Если что-то пошло не так</h2>
        ${FAQ.slice(2, 5).map(([q, a]) => `<p><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}
        <p>Не помогло? Напишите нам в <a href="${TELEGRAM}">Telegram</a>.</p>`;
    },

    renderNewsList() {
      return `
        <h1 class="hsrs-h1">Новости</h1>
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
        <p class="hsrs-crumbs">${link('/news', 'Новости')} &gt; ${n.tag}</p>
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
        <h1 class="hsrs-h1">Персонажи</h1>
        <p>В игре ${ids.length} героев. Каждый идёт своим Путём: Путь определяет роль в бою. Нажмите на героя, чтобы увидеть его способности и картину Эйдолонов.</p>
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
        if (f.k === 'dmg') w = `${H.ELEMENTS[f.e || c.elem].name.toLowerCase()} урон`;
        else w = FX_WORDS[f.k] || null;
        if (w && !words.includes(w)) words.push(w);
      });
      const target = TARGETS[kit.target] || '';
      return `${target}${words.length ? ': ' + words.join(', ') : ''}.`;
    },

    renderKit(c) {
      const rows = [['Обычная атака', c.basic], ['Навык', c.skill], ['Абсолютная техника', c.ult]].filter(([, k]) => k);
      return `
        <table class="hsrs-kit" cellspacing="0">
          ${rows.map(([label, k]) => `<tr><td class="hsrs-kit-l">${label}</td><td><b>${esc(k.name)}</b><br>${esc(this.describeKit(c, k))}</td></tr>`).join('')}
          ${c.talent ? `<tr><td class="hsrs-kit-l">Талант</td><td>${esc(c.talent)}</td></tr>` : ''}
          ${c.tech ? `<tr><td class="hsrs-kit-l">Техника на карте</td><td><b>${esc(c.tech.name)}</b><br>${esc(c.tech.text)}</td></tr>` : ''}
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
        ? `<h2 class="hsrs-h2">Путь Разрушения</h2>${this.renderKit(c)}<h2 class="hsrs-h2">Путь Сохранения</h2><p>Позже по сюжету Первопроходец меняет Путь и получает огненное копьё.</p>${this.renderKit(H.CHARS.trail_p)}`
        : `<h2 class="hsrs-h2">Способности</h2>${this.renderKit(c)}`;
      return `
        <p class="hsrs-crumbs">${link('/characters', 'Персонажи')} &gt; ${H.PATHS[c.path].name}</p>
        <table class="hsrs-hero" cellspacing="0" cellpadding="0">
          <tr>
            <td class="hsrs-hero-pic">
              <div class="hsrs-platform">${art(`fig:${id}:3`, 144, 288)}</div>
              ${id === 'trail' ? `<div class="hsrs-alt">${art('figf:trail:1', 48, 96)}<span>Первопроходец может быть и девушкой: выбор в начале игры.</span></div>` : ''}
            </td>
            <td class="hsrs-hero-info">
              <h1 class="hsrs-h1">${esc(c.name)}</h1>
              <p>${diamonds(c.rarity)} &nbsp; ${art(`path:${c.path}:16`, 16, 16, 'hsrs-inline')} Путь: <b>${H.PATHS[c.path].name}</b> &nbsp; Стихия: <b style="color:${el.col}">${el.name}</b></p>
              ${line ? `<blockquote class="hsrs-quote">${esc(line)}</blockquote>` : ''}
              <table class="hsrs-spec" cellspacing="0">
                <tr><td>Здоровье</td><td>${c.base.hp}</td><td>Атака</td><td>${c.base.atk}</td></tr>
                <tr><td>Защита</td><td>${c.base.def}</td><td>Скорость</td><td>${c.base.spd}</td></tr>
                <tr><td>Энергия</td><td>${c.energy}</td><td>Пробитие</td><td>${H.BREAK_EFFECT[c.elem]}</td></tr>
              </table>
              <p class="hsrs-small">Характеристики на 1 уровне. Как получить: ${esc(this.source(id))}.</p>
              ${kits}
              ${fusions.length ? `<h2 class="hsrs-h2">Слияния</h2>${fusions.map(f => `<p><b>${esc(f.name)}</b> (${f.members.map(m => esc(this.memberName(m))).join(' и ')}). ${esc(f.text)}</p>`).join('')}` : ''}
            </td>
          </tr>
        </table>
        ${scene ? `
        <h2 class="hsrs-h2">Картина Эйдолонов: ${esc(scene.title)}</h2>
        <table class="hsrs-eid" cellspacing="0" cellpadding="0"><tr>
          <td>${art(`eid:${id}`, 320, 240, 'hsrs-eid-pic')}</td>
          <td><p>Каждая копия героя из прыжка открывает Эйдолон и добавляет кусочек картины. Сначала она чёрно-белая, со второго Эйдолона цветная, с третьего появляются детали, а на шестом картина оживает.</p>
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
        <h1 class="hsrs-h1">Миры</h1>
        <p>Звёздный экспресс ходит по Звёздному пути, рельсам, которые проложили Эоны. В версии ${BUILD.version} на маршруте станция «Герта» и Ярило-VI, событие KonoSuba x SR98 уводит Экспресс в Белзерг, а Сяньчжоу «Лофу» уже видна на карте.</p>
        <div class="hsrs-world">
          <h2 class="hsrs-h2">${esc(H.EXPRESS_AREA.name)}</h2>
          <table class="hsrs-areas" cellspacing="0">${area(Object.assign({}, H.EXPRESS_AREA, { name: 'Вагон-салон' }))}</table>
        </div>
        ${H.WORLDS.map(w => `
        <div class="hsrs-world">
          <h2 class="hsrs-h2">${esc(w.name)}</h2>
          ${w.groups.length ? w.groups.map(g => `
            ${w.groups.length > 1 ? `<h3 class="hsrs-h3">${esc(g.name)}</h3>` : ''}
            <table class="hsrs-areas" cellspacing="0">${g.areas.map(area).join('')}</table>`).join('') : '<p class="hsrs-locked">Маршрут ещё не проложен. На звёздной карте Экспресса этот мир пока под замком.</p>'}
        </div>`).join('')}
        <h2 class="hsrs-h2">Кого вы встретите</h2>
        <div class="hsrs-foes">
          ${foes.map(k => `<span class="hsrs-foe">${art(`foe:${k}:52`, 52, 52)}<span>${esc(H.ENEMIES[k].name)}</span></span>`).join('')}
        </div>
        <h3 class="hsrs-h3">Боссы</h3>
        <div class="hsrs-foes hsrs-foes-boss">
          ${bosses.map(k => `<span class="hsrs-foe">${art(`foe:${k}:70`, 70, 70)}<span>${esc(H.ENEMIES[k].name)}</span></span>`).join('')}
        </div>`;
    },

    renderPlay() {
      const H = Hsr();
      if (!H || !H.ELEMENTS) return this.renderNoData();
      const T = H.TUNING;
      return `
        <h1 class="hsrs-h1">Как играть</h1>
        <p>Вы ходите по карте, говорите с людьми и находите сундуки. Враги бродят по карте открыто. Ударьте первым (клавиша F), и бой начнётся с вашего хода. Если враг заметит вас раньше, первый ход будет за ним.</p>

        <h2 class="hsrs-h2">Бой</h2>
        <table class="hsrs-rules" cellspacing="0">
          <tr><td>Шкала хода</td><td>Слева на экране видно, кто ходит следующим. Чем выше скорость, тем чаще ход.</td></tr>
          <tr><td>Очки навыка</td><td>Общие на команду, не больше ${T.spMax}. Обычная атака даёт одно очко, навык тратит одно.</td></tr>
          <tr><td>Абсолютная техника</td><td>Копит энергию за удары. Когда кольцо светится, нажмите номер героя: он ударит вне очереди.</td></tr>
          <tr><td>Пробитие</td><td>Бейте врага стихией, к которой он уязвим. Когда шкала стойкости опустеет, враг теряет ход и получает эффект стихии.</td></tr>
          <tr><td>Техника</td><td>У лидера на карте есть техника (клавиша E). Она тратит очко техники и помогает в начале боя. Очков не больше ${T.tpMax}.</td></tr>
          <tr><td>Контакт</td><td>С врагом можно поговорить (T). Подберите подход: кто-то любит шутки, кто-то боится угроз. Довольный враг уходит из боя и оставляет награду, разозлённый бьёт сильнее. Боссы не слушают.</td></tr>
          <tr><td>Слияние</td><td>Двое героев с общей историей бьют вместе (R), когда у обоих готова абсолютная техника. Тратит энергию обоих.</td></tr>
          <tr><td>Слухи</td><td>У Сампо можно купить слух, и он сбудется: в лавке появится новый товар, на карте новый враг, у Пом-Пом скидка.</td></tr>
        </table>

        <h2 class="hsrs-h2">Стихии</h2>
        <table class="hsrs-elems" cellspacing="0">
          <tr><th>Стихия</th><th>Эффект пробития</th></tr>
          ${H.ELEMENT_KEYS.map(k => `<tr><td><span class="hsrs-swatch" style="background:${H.ELEMENTS[k].col}"></span>${H.ELEMENTS[k].name}</td><td>${H.BREAK_EFFECT[k]}</td></tr>`).join('')}
        </table>

        <h2 class="hsrs-h2">Пути</h2>
        <table class="hsrs-paths" cellspacing="0">
          ${PATH_ORDER.map(p => `<tr><td>${art(`path:${p}:24`, 24, 24)}</td><td><b>${H.PATHS[p].name}</b></td><td>${PATH_ROLE[p]}</td></tr>`).join('')}
        </table>

        <h2 class="hsrs-h2">Слияния</h2>
        <table class="hsrs-fusions" cellspacing="0">
          <tr><th>Слияние</th><th>Кто</th><th>Что делает</th></tr>
          ${Object.values(H.FUSIONS).map(f => `<tr><td><b>${esc(f.name)}</b></td><td>${f.members.map(m => link(`/characters?id=${m === 'trail_p' ? 'trail' : m}`, esc(this.memberName(m)))).join(', ')}</td><td>${esc(f.text)}</td></tr>`).join('')}
        </table>

        <h2 class="hsrs-h2">Прыжки</h2>
        <p>На Экспрессе стоит терминал прыжков. Один прыжок стоит один пропуск или ${T.warpCost} звёздного нефрита. С прыжка выпадают герои и световые конусы. Гарант: 5★ не позже ${T.pity5}-го прыжка, 4★ не реже раза в ${T.pity4} прыжков. У каждого прыжка свой счётчик гаранта.</p>

        <h2 class="hsrs-h2">Управление</h2>
        <table class="hsrs-rules" cellspacing="0">
          ${CONTROLS.map(([where, keys]) => `<tr><td>${where}</td><td>${keys}</td></tr>`).join('')}
        </table>`;
    },

    renderGallery() {
      const items = this.galleryItems();
      const groups = [...new Set(items.map(i => i.group))];
      return `
        <h1 class="hsrs-h1">Галерея</h1>
        <p>Нажмите на картинку, чтобы открыть её крупно.</p>
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
        <p class="hsrs-crumbs">${link('/gallery', 'Галерея')} &gt; ${it.group}</p>
        <div class="hsrs-viewer">
          ${it.kind === 'shot' ? this.pictureHtml(it, 640, 480) : art(`${it.kind}:${it.id}`, 640, 480)}
          <p class="hsrs-viewer-cap">${esc(it.title)} <span class="hsrs-small">(${n + 1} из ${items.length})</span></p>
          <p>&lt; ${link(`/gallery?pic=${prev}`, 'Предыдущая')} &nbsp;|&nbsp; ${link('/gallery', 'Все картинки')} &nbsp;|&nbsp; ${link(`/gallery?pic=${next}`, 'Следующая')} &gt;</p>
        </div>`;
    },

    renderNoData() {
      return '<p>Данные игры не загрузились. Обновите страницу.</p>';
    },

    renderSupport() {
      return `
        <h1 class="hsrs-h1">Поддержка</h1>
        <p>Здесь ответы на частые вопросы. Если вашего вопроса нет, напишите нам в <a href="${TELEGRAM}">Telegram</a>. Опишите, что вы делали и что увидели на экране.</p>
        <dl class="hsrs-faq">
          ${FAQ.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}
        </dl>`;
    },

    renderMissing() {
      return `
        <h1 class="hsrs-h1">Станция не найдена</h1>
        <p>По этому адресу ничего нет. Возможно, страница переехала или в адресе опечатка.</p>
        <p>${link('', 'На главную')} или ${link('/download', 'к загрузке игры')}.</p>`;
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
  addEventListener('hashchange', () => {
    site.show();
    scrollTo(0, 0);
  });
})();
