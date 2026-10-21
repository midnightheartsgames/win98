class AvpSite {
  constructor() {
    this.storageKey = 'win98_avp_site_v1';
    this.state = this.loadState();
    this.activeEncyclopediaId = 'Win95.CIH.1003';
    this.encyclopediaQuery = '';
    this.encyclopediaFilter = 'all';
    this.newsCategory = 'all';
    this.forumCategory = 'all';
    this.promoCode = '';
    this.promoDiscount = 0;
    this.promoMessage = '';
    this.labState = {
      sampleId: 'sample_cih',
      ring0: true,
      biosPort: true,
      normalDot: false,
      wsockHook: false,
      polyXor: false,
      lastReport: null,
      webScanReport: null
    };
  }

  getDefaultState() {
    return {
      encoding: 'win1251',
      bannerIdx: 0,
      hits: 29418,
      pollVoted: null,
      pollVotes: { cih: 614, macro: 428, trojan: 389, boot: 197 },
      downloadedAvc: [],
      articleComments: {
        'cih-anatomy': [
          {
            author: 'Igor_BX440 (Москва)',
            date: '20.10.1998 19:42',
            text: 'Спасибо за разбор! Вчера поставил AVP 3.0 и включил монитор AVPM — перехватил заражённый архив с игрового диска до запуска!'
          }
        ]
      },
      customThreads: [],
      threadReplies: {}
    };
  }

  loadState() {
    const def = this.getDefaultState();
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return def;
      const parsed = JSON.parse(raw);
      return Object.assign({}, def, parsed, {
        pollVotes: Object.assign({}, def.pollVotes, parsed.pollVotes || {}),
        articleComments: Object.assign({}, def.articleComments, parsed.articleComments || {}),
        threadReplies: Object.assign({}, def.threadReplies, parsed.threadReplies || {}),
        downloadedAvc: Array.isArray(parsed.downloadedAvc) ? parsed.downloadedAvc : [],
        customThreads: Array.isArray(parsed.customThreads) ? parsed.customThreads : []
      });
    } catch (e) {
      return def;
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {}
  }

  esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  sanitizeBrandText(str) {
    return String(str == null ? '' : str)
      .replace(/\bMicrosoft\b/gi, 'Microslop')
      .replace(/\bWindows\b/gi, 'Win');
  }

  toTranslit(html) {
    const map = {
      'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh','З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'Kh','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Sch','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya',
      'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
    };
    return html.replace(/([^<>]+)(?=<|$)/g, (seg) => seg.replace(/[А-ЯЁа-яё]/g, (ch) => (map[ch] !== undefined ? map[ch] : ch)));
  }

  parseUrl(url) {
    const raw = String(url || 'http://www.avp.ru');
    const clean = raw.replace(/^https?:\/\/(www\.)?(avp\.ru|avp98\.ru|kaspersky98\.ru|kaspersky\.ru|kami\.ru)/i, '');
    const parts = clean.split('?');
    let path = (parts[0] || '/').trim();
    if (!path.startsWith('/')) path = '/' + path;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    const params = {};
    if (parts[1]) {
      parts[1].split('&').forEach((kv) => {
        const idx = kv.indexOf('=');
        if (idx > -1) {
          const k = decodeURIComponent(kv.slice(0, idx));
          const v = decodeURIComponent(kv.slice(idx + 1));
          params[k] = v;
        } else if (kv) {
          params[decodeURIComponent(kv)] = '1';
        }
      });
    }
    return { path, params, raw };
  }

  getAvpGameState() {
    const gm = window.gameManager;
    const game = gm ? (typeof gm.getGame === 'function' ? gm.getGame('avp') : (gm.catalog ? gm.catalog.avp : null)) : null;
    const purchased = gm && typeof gm.isPurchased === 'function' ? gm.isPurchased('avp') : false;
    const downloaded = gm && typeof gm.isDownloaded === 'function' ? gm.isDownloaded('avp') : false;
    const installed = gm && typeof gm.isInstalled === 'function' ? gm.isInstalled('avp') : false;
    const basePrice = game ? game.price : 24.99;
    const finalPrice = Math.max(5, Number((basePrice - (this.promoDiscount || 0)).toFixed(2)));
    return { gm, game, purchased, downloaded, installed, basePrice, finalPrice };
  }

  getTotalSignatureCount() {
    return 18240 + (this.state.downloadedAvc ? this.state.downloadedAvc.length * 142 : 0);
  }

  getShieldSvg() {
    return `<svg width="46" height="50" viewBox="0 0 46 50" xmlns="http://www.w3.org/2000/svg" style="display:block;">
      <polygon points="23,2 43,9 39,33 23,48 7,33 3,9" fill="#8b0000" stroke="#ffd700" stroke-width="2"/>
      <polygon points="23,6 38,12 35,31 23,43 11,31 8,12" fill="#2b0000" stroke="#cc3333" stroke-width="1"/>
      <path d="M13,22 L33,22 M23,11 L23,37" stroke="#ffd700" stroke-width="2"/>
      <rect x="14" y="17" width="18" height="11" fill="#8b0000" stroke="#ffd700" stroke-width="1"/>
      <text x="23" y="25" text-anchor="middle" fill="#ffffff" font-family="Arial Black, Tahoma, sans-serif" font-size="8" font-weight="bold">AVP</text>
      <text x="23" y="39" text-anchor="middle" fill="#ffd700" font-family="Courier New, monospace" font-size="7" font-weight="bold">3.0</text>
    </svg>`;
  }

  getBoxArtSvg() {
    return `<svg width="110" height="134" viewBox="0 0 110 134" xmlns="http://www.w3.org/2000/svg" style="display:block;border:1px solid #400000;">
      <rect width="110" height="134" fill="#1e0202"/>
      <polygon points="0,0 20,0 110,16 90,16" fill="#5c0909"/>
      <rect x="6" y="8" width="98" height="118" fill="#3a0404" stroke="#ffd700" stroke-width="2"/>
      <rect x="10" y="12" width="90" height="18" fill="#8b0000"/>
      <text x="55" y="24" text-anchor="middle" fill="#ffffff" font-family="Arial Black, sans-serif" font-size="10">KASPERSKY LAB</text>
      <polygon points="55,36 82,45 77,80 55,98 33,80 28,45" fill="#700000" stroke="#ffd700" stroke-width="2"/>
      <text x="55" y="65" text-anchor="middle" fill="#ffffff" font-family="Arial Black, sans-serif" font-size="14" font-weight="bold">AVP</text>
      <text x="55" y="79" text-anchor="middle" fill="#00ff66" font-family="Courier New, monospace" font-size="10" font-weight="bold">v3.0 PRO</text>
      <rect x="12" y="104" width="86" height="16" fill="#000000" stroke="#808080" stroke-width="1"/>
      <text x="55" y="115" text-anchor="middle" fill="#ffd700" font-family="Tahoma, sans-serif" font-size="8" font-weight="bold">PLATINUM EDITION</text>
    </svg>`;
  }

  renderHeader(activeSection) {
    const data = window.avpData;
    const banner = data.banners[this.state.bannerIdx % data.banners.length] || data.banners[0];
    const avpState = this.getAvpGameState();
    let statusBadge = '<span class="avp-badge avp-badge-crit">НЕ ЗАЩИЩЕН • ЛИЦЕНЗИЯ НЕ КУПЛЕНА</span>';
    if (avpState.installed) {
      statusBadge = '<span class="avp-badge avp-badge-ok">AVP 3.0 УСТАНОВЛЕН (C:\\Program Files\\AVP)</span>';
    } else if (avpState.downloaded) {
      statusBadge = '<span class="avp-badge avp-badge-med">SETUP_AVP.EXE СКАЧАН • ГОТОВ К УСТАНОВКЕ</span>';
    } else if (avpState.purchased) {
      statusBadge = '<span class="avp-badge avp-badge-med">ЛИЦЕНЗИЯ АКТИВНА • СКАЧАЙТЕ ДИСТРИБУТИВ</span>';
    }

    const navItems = [
      { key: 'home', url: 'http://www.avp.ru', label: 'Сводка угроз' },
      { key: 'store', url: 'http://www.avp.ru/store', label: 'Купить и Скачать AVP 3.0', fresh: true },
      { key: 'encyclopedia', url: 'http://www.avp.ru/encyclopedia', label: 'Вирусная энциклопедия' },
      { key: 'lab', url: 'http://www.avp.ru/lab', label: 'Эвристик CodeAnalyzer', fresh: true },
      { key: 'news', url: 'http://www.avp.ru/news', label: 'Бюллетени и Статьи' },
      { key: 'forum', url: 'http://www.avp.ru/forum', label: 'FidoNet RU.ANTIVIRUS' },
      { key: 'about', url: 'http://www.avp.ru/about', label: 'О Лаборатории' }
    ];

    return `
      <div class="avp-top-strip">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <b>KASPERSKY LAB • МОСКВА, УЛ. ГЕРОЕВ ПАНФИЛОВЦЕВ, 10</b> | Зеркала:
              <a data-url="http://www.avp.ru">www.avp.ru</a> •
              <a data-url="http://www.avp98.ru">www.avp98.ru</a> •
              <a data-url="http://www.ferrum98.ru">Ferrum98</a>
            </td>
            <td align="right">
              Кодировка:
              <a href="#" class="avp-enc-btn ${this.state.encoding === 'win1251' ? 'avp-enc-active' : ''}" data-enc="win1251">[Win-1251]</a>
              <a href="#" class="avp-enc-btn ${this.state.encoding === 'koi8r' ? 'avp-enc-active' : ''}" data-enc="koi8r">[KOI8-R]</a>
              <a href="#" class="avp-enc-btn ${this.state.encoding === 'translit' ? 'avp-enc-active' : ''}" data-enc="translit">[Translit]</a>
            </td>
          </tr>
        </table>
      </div>

      <div class="avp-masthead">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="54" valign="middle">${this.getShieldSvg()}</td>
            <td valign="middle" style="padding-left:6px;">
              <div class="avp-logo-title">ЛАБОРАТОРИЯ <span>КАСПЕРСКОГО</span></div>
              <div class="avp-logo-sub">ANTIVIRAL TOOLKIT PRO (AVP 3.0) • ОФИЦИАЛЬНЫЙ СЕРВЕР ЗАЩИТЫ ИНФОРМАЦИИ • 1989–1998</div>
            </td>
            <td width="245" align="right" valign="middle">
              <div class="avp-avc-counter">
                <div>БАЗА DAILY.AVC: <b>${this.getTotalSignatureCount()}</b> штаммов</div>
                <div>ЭВРИСТИК: <b>CodeAnalyzer v3.0 (i386 VM)</b></div>
                <div>ЭКСТРЕННАЯ ЛИНИЯ: <b>virus@avp.ru</b></div>
              </div>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
          <tr>
            <td>
              <div class="avp-banner-frame" style="background:${banner.bg};border-color:${banner.border};padding:4px 8px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="font-size:9px;color:#ffd700;font-family:'Courier New',monospace;font-weight:bold;">[БАННЕРНАЯ СЕТЬ БЕЗОПАСНОСТИ • ${this.esc(banner.tag)}]</div>
                      <div style="font-size:12px;font-weight:bold;color:#ffffff;"><a data-url="${this.esc(banner.url)}" style="color:#ffffff;text-decoration:underline;">${this.esc(banner.title)}</a></div>
                      <div style="font-size:10px;color:#d8e8c8;">${this.esc(banner.sub)}</div>
                    </td>
                    <td width="120" align="right" valign="middle">
                      <button class="avp-btn-gold" data-url="${this.esc(banner.url)}" style="font-size:10px;">Перейти &gt;&gt;</button>
                      <button class="avp-btn" id="avp-next-banner-btn" title="Следующий баннер" style="font-size:10px;padding:2px 5px;">[Сменить]</button>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" class="avp-navbar">
        <tr>
          ${navItems.map((item) => `
            <td>
              <a class="avp-nav-link ${activeSection === item.key ? 'active' : ''}" data-url="${item.url}">${item.label}${item.fresh ? ' <span class="avp-new">NEW!</span>' : ''}</a>
            </td>
          `).join('')}
        </tr>
      </table>

      <div class="avp-subbar">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              Статус вашего ПК: ${statusBadge}
              &nbsp;|&nbsp; Официальный дистрибутив <b>Setup_AVP.exe</b> перенесён с SoftStore 98 на <b>www.avp.ru</b>
            </td>
            <td align="right">
              <button class="avp-btn-red" id="avp-squeal-test-btn" style="padding:1px 7px;font-size:10px;">[Тест тревоги AVP: Визг кабанчика!]</button>
            </td>
          </tr>
        </table>
      </div>

      <div class="avp-alert-ticker">
        <marquee scrollamount="4" onmouseover="this.stop()" onmouseout="this.start()"><b>ЭКСТРЕННАЯ СВОДКА ЛАБОРАТОРИИ:</b> Внимание! 26-го числа активируется разрушительная процедура вируса <b>Win95.CIH («Чернобыль»)</b>, стирающая Flash BIOS! На Рабочих столах обнаружен троян <b>totally_not_a_virus.exe</b>. Проверьте диск сканером <a data-url="http://www.avp.ru/store">Антивирус Касперского AVP 3.0</a>!</marquee>
      </div>
    `;
  }

  renderLeftSidebar() {
    const avp = this.getAvpGameState();
    let actionHtml = '';
    if (avp.installed) {
      actionHtml = `
        <div style="color:#006600;font-weight:bold;margin-bottom:5px;">[OK] AVP 3.0 установлен в системе!</div>
        <button class="avp-btn-green" id="avp-launch-app-btn" style="width:100%;margin-bottom:4px;">Запустить AVP 3.0 (AVP.EXE)</button>
        <button class="avp-btn" data-url="http://www.avp.ru/store" style="width:100%;">Центр обновлений .AVC</button>
      `;
    } else if (avp.downloaded) {
      actionHtml = `
        <div style="color:#8b4500;font-weight:bold;margin-bottom:5px;">Дистрибутив Setup_AVP.exe скачан!</div>
        <button class="avp-btn-gold" id="avp-run-setup-btn" style="width:100%;margin-bottom:4px;">Запустить Setup_AVP.exe</button>
        <button class="avp-btn" data-url="http://www.avp.ru/store" style="width:100%;">Открыть страницу загрузки</button>
      `;
    } else if (avp.purchased) {
      actionHtml = `
        <div style="color:#005500;font-weight:bold;margin-bottom:5px;">Именная лицензия оплачена!</div>
        <button class="avp-btn-green" id="avp-download-exe-btn" style="width:100%;margin-bottom:4px;">Скачать Setup_AVP.exe (6.2 МБ)</button>
        <button class="avp-btn" data-url="http://www.avp.ru/store" style="width:100%;">Досье и базы DAILY.AVC</button>
      `;
    } else {
      actionHtml = `
        <div style="margin-bottom:4px;">Официальная версия для дома и офиса:</div>
        <div class="avp-price-tag" style="margin-bottom:5px;">$${avp.finalPrice.toFixed(2)}</div>
        <button class="avp-btn-red" data-url="http://www.avp.ru/order" style="width:100%;margin-bottom:4px;">Купить лицензию AVP 3.0</button>
        <button class="avp-btn" data-url="http://www.avp.ru/store" style="width:100%;">Подробное описание пакета</button>
      `;
    }

    return `
      <div class="avp-panel">
        <div class="avp-panel-head">ПАКЕТ AVP 3.0 PLATINUM</div>
        <div class="avp-panel-body" style="text-align:center;">
          <div style="margin:3px auto 6px auto;display:inline-block;">${this.getBoxArtSvg()}</div>
          <div style="font-weight:bold;color:#8b0000;margin-bottom:3px;">Антивирус Касперского AVP 3.0</div>
          <div style="font-size:10px;color:#333333;margin-bottom:6px;">
            Сканер AVP32 + Сторож AVPM + Ревизор AVPI + Распаковщик архивов ZIP/RAR/ARJ
          </div>
          ${actionHtml}
        </div>
      </div>

      <div class="avp-panel">
        <div class="avp-panel-head-gold">НАВИГАТОР БЕЗОПАСНОСТИ</div>
        <div class="avp-panel-body">
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.avp.ru">Радар вирусных эпидемий</a></div>
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.avp.ru/store">Магазин и загрузка Setup_AVP.exe</a></div>
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.avp.ru/order">Оформление лицензии ($24.99)</a></div>
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.avp.ru/encyclopedia">Энциклопедия VirusList 98</a></div>
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.avp.ru/lab">Эвристик CodeAnalyzer и Веб-Сканер</a></div>
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.avp.ru/news">Статьи Е. Касперского</a></div>
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.avp.ru/forum">Конференция RU.ANTIVIRUS</a></div>
          <div>&bull; <a data-url="http://www.avp.ru/about">История Лаборатории (1989–1998)</a></div>
        </div>
      </div>

      <div class="avp-panel">
        <div class="avp-panel-head-dark">СВЕЖИЕ БАЗЫ (.AVC)</div>
        <div class="avp-panel-body" style="font-size:10px;">
          <div><b>Выпуск:</b> 21.10.1998 (06:00 МСК)</div>
          <div><b>Записей в базе:</b> ${this.getTotalSignatureCount()}</div>
          <div><b>Новые сигнатуры:</b></div>
          <div style="font-family:'Courier New',monospace;color:#8b0000;margin:3px 0;">
            + Win95.CIH.1003<br>
            + Trojan.TotallyNotAVirus<br>
            + Worm.Win32.Happy99<br>
            + Macro.Word97.Melissa
          </div>
          <button class="avp-btn" data-url="http://www.avp.ru/store" style="width:100%;margin-top:4px;font-size:10px;">Скачать DAILY.AVC</button>
        </div>
      </div>

      <div class="avp-panel">
        <div class="avp-panel-head">ГОРЯЧАЯ ЛИНИЯ 24/7</div>
        <div class="avp-panel-body" style="font-size:10px;">
          <div>Пришлите подозрительный файл в зашифрованном архиве с паролем <b>VIRUS</b>:</div>
          <div style="margin-top:4px;"><b>E-Mail:</b> <a href="mailto:lab@avp.ru">lab@avp.ru</a></div>
          <div><b>Поддержка:</b> <a href="mailto:support@avp.ru">support@avp.ru</a></div>
          <div><b>FidoNet:</b> 2:5020/400</div>
          <div><b>Тел. (Москва):</b> (095) 948-56-00</div>
        </div>
      </div>
    `;
  }

  renderRightSidebar() {
    const poll = window.avpData.poll;
    const votes = this.state.pollVotes || {};
    const totalVotes = Object.keys(votes).reduce((acc, k) => acc + (Number(votes[k]) || 0), 0) || 1;

    return `
      <div class="avp-panel">
        <div class="avp-panel-head">ЭКСПРЕСС-ПРОВЕРКА ДИСКА C:</div>
        <div class="avp-panel-body">
          <div style="font-size:10px;margin-bottom:5px;">
            Подозреваете, что на Рабочем столе притаился троян <b>totally_not_a_virus.exe</b>?
          </div>
          <button class="avp-btn-red" data-url="http://www.avp.ru/lab" style="width:100%;margin-bottom:4px;font-size:10px;">Открыть стенд CodeAnalyzer</button>
          <div style="font-size:10px;color:#444444;">
            Для полного лечения всех папок установите стационарный пакет <a data-url="http://www.avp.ru/store">AVP 3.0</a>.
          </div>
        </div>
      </div>

      <div class="avp-panel">
        <div class="avp-panel-head-gold">ОПРОС ЧИТАТЕЛЕЙ AVP.RU</div>
        <div class="avp-panel-body">
          <div style="font-weight:bold;margin-bottom:5px;">${this.esc(poll.question)}</div>
          ${poll.options.map((opt) => {
            const count = Number(votes[opt.id] || opt.votes || 0);
            const pct = Math.round((count / totalVotes) * 100);
            return `
              <div style="margin-bottom:5px;font-size:10px;">
                <label style="cursor:pointer;display:block;">
                  <input type="radio" name="avp_poll_opt" value="${opt.id}" ${this.state.pollVoted === opt.id ? 'checked' : ''}>
                  ${this.esc(opt.label)}
                </label>
                <div style="background:#d4d0c8;border:1px solid #808080;height:8px;margin-top:2px;">
                  <div style="background:#8b0000;width:${pct}%;height:8px;"></div>
                </div>
                <div style="color:#555555;">${pct}% (${count} гол.)</div>
              </div>
            `;
          }).join('')}
          <button class="avp-btn" id="avp-poll-vote-btn" style="width:100%;font-size:10px;">
            ${this.state.pollVoted ? 'Переголосовать' : 'Голосовать'}
          </button>
          <div style="font-size:9px;color:#555555;margin-top:3px;text-align:center;">Всего голосов: ${totalVotes}</div>
        </div>
      </div>

      <div class="avp-panel">
        <div class="avp-panel-head-dark">СОВЕТ ДНЯ ОТ Е. КАСПЕРСКОГО</div>
        <div class="avp-panel-body" style="font-size:10px;">
          «Никогда не оставляйте системную дискету в дисководе A: при выключении ПК и всегда сдвигайте язычок защиты от записи на эталонных дискетах со сканером AVP!»
        </div>
      </div>

      <div class="avp-panel">
        <div class="avp-panel-head">ДРУЗЬЯ ПО КАТЕГОРИИ</div>
        <div class="avp-panel-body" style="font-size:10px;">
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.ferrum98.ru">Ferrum '98 — Железо и BIOS</a></div>
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.3dfx-zone.com">3dfx Voodoo Zone</a></div>
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.antivirus98.com">AntiVirus Center '98</a></div>
          <div style="margin-bottom:3px;">&bull; <a data-url="http://www.y2k-countdown.org">Штаб проблемы Y2K (2000)</a></div>
          <div>&bull; <a data-url="http://www.search98.com">Каталог Search '98</a></div>
        </div>
      </div>
    `;
  }

  renderOdometer(value) {
    const digits = String(Math.max(0, Math.floor(Number(value) || 0))).padStart(6, '0').split('');
    return `<span class="avp-odometer">${digits.map((d) => `<b>${d}</b>`).join('')}</span>`;
  }

  renderFooter() {
    return `
      <div class="avp-footer">
        <div style="margin-bottom:4px;">
          <a data-url="http://www.avp.ru">Главная</a> |
          <a data-url="http://www.avp.ru/store">Магазин и Загрузка AVP 3.0</a> |
          <a data-url="http://www.avp.ru/encyclopedia">Энциклопедия VirusList</a> |
          <a data-url="http://www.avp.ru/lab">Эвристический стенд</a> |
          <a data-url="http://www.avp.ru/news">Статьи</a> |
          <a data-url="http://www.avp.ru/forum">Конференция RU.ANTIVIRUS</a> |
          <a data-url="http://www.avp.ru/about">О компании</a>
        </div>
        <div class="avp-footer-visitors">
          Вы ${this.renderOdometer(this.state.hits)}-й посетитель сервера www.avp.ru с 1 января 1998 года!
        </div>
        <div style="margin-bottom:5px;">
          <span class="avp-counter-box">Rambler Top100: #1 Security</span>
          <span class="avp-counter-box">SpyLOG Hits: ${this.state.hits}</span>
          <span class="avp-counter-box">ICSA Certified 1998</span>
          <span class="avp-counter-box">FidoNet 2:5020/400</span>
        </div>
        <hr>
        <div class="avp-footer-note">
          Лучше всего просматривается в <b>Internet Explorer 4.0</b> при разрешении <b>800x600</b>, 256 цветов.<br>
          Страница обновлена: 21 октября 1998 г. | Веб-мастер: <a href="mailto:webmaster@avp.ru">webmaster@avp.ru</a>
        </div>
        <div>
          &copy; 1997–1998 ЗАО «Лаборатория Касперского» (Kaspersky Lab). Все права защищены. Антивирус Касперского AVP 3.0 (Setup_AVP.exe).
        </div>
      </div>
    `;
  }

  renderHomePage() {
    const data = window.avpData;
    const avp = this.getAvpGameState();

    let heroCta = '';
    if (avp.installed) {
      heroCta = `
        <button class="avp-btn-green" id="avp-hero-launch-btn">Запустить установленный AVP 3.0 (AVP.EXE)</button>
        <button class="avp-btn" data-url="http://www.avp.ru/store">Проверить обновления DAILY.AVC</button>
      `;
    } else if (avp.downloaded) {
      heroCta = `
        <button class="avp-btn-gold" id="avp-hero-setup-btn">Установить Setup_AVP.exe в C:\\Program Files\\AVP</button>
        <button class="avp-btn" data-url="http://www.avp.ru/store">Открыть центр загрузки</button>
      `;
    } else if (avp.purchased) {
      heroCta = `
        <button class="avp-btn-green" id="avp-hero-download-btn">Скачать оплаченный дистрибутив Setup_AVP.exe (6.2 МБ)</button>
        <button class="avp-btn" data-url="http://www.avp.ru/store">Перейти в Центр загрузки</button>
      `;
    } else {
      heroCta = `
        <button class="avp-btn-red" data-url="http://www.avp.ru/order">Купить лицензию AVP 3.0 ($${avp.finalPrice.toFixed(2)})</button>
        <button class="avp-btn-gold" data-url="http://www.avp.ru/store">Перейти в Магазин и Центр загрузки</button>
        <button class="avp-btn" data-url="http://www.avp.ru/lab">Онлайн-стенд CodeAnalyzer</button>
      `;
    }

    return `
      <div class="avp-product-hero">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="top">
              <div style="font-size:10px;color:#8b0000;font-weight:bold;font-family:'Courier New',monospace;">
                [ОФИЦИАЛЬНЫЙ РЕЛИЗ • ОКТЯБРЬ 1998 • ПЕРЕЕЗД ИЗ КАТАЛОГА SOFTSTORE 98]
              </div>
              <div style="font-size:15px;font-weight:bold;color:#2b0000;margin:2px 0 4px 0;">
                Антивирус Касперского — AntiViral Toolkit Pro (AVP 3.0 Platinum)
              </div>
              <div style="margin-bottom:6px;">
                Флагманский антивирусный комплекс <b>«Лаборатории Касперского»</b> теперь распространяется и обновляется напрямую через наш официальный узел <b>http://www.avp.ru</b>. Сверхбыстрый 32-битный сканер с эмулятором процессора i386, перехватчик ядра Ring 0 <b>AVPM.EXE</b>, проверка архивов ZIP/RAR/ARJ/CAB и мгновенное лечение троянов (включая <code>totally_not_a_virus.exe</code> и <code>Win95.CIH</code>)!
              </div>
              <div>${heroCta}</div>
            </td>
          </tr>
        </table>
      </div>

      <div class="avp-section-hdr">РАДАР ВИРУСНЫХ ЭПИДЕМИЙ ОКТЯБРЯ 1998 ГОДА (VIRUS WEATHER FORECAST)</div>
      <table class="avp-table" style="margin-bottom:10px;">
        <thead>
          <tr>
            <th>Штамм / Сигнатура AVP</th>
            <th>Уровень тревоги</th>
            <th>Вектор проникновения</th>
            <th>Разрушительное действие и лечение</th>
          </tr>
        </thead>
        <tbody>
          ${data.outbreakRadar.map((row, idx) => `
            <tr class="${idx % 2 === 1 ? 'alt' : ''}">
              <td>
                <b><a data-url="http://www.avp.ru/encyclopedia?id=${encodeURIComponent(row.code)}">${this.esc(row.code)}</a></b>
                <div style="font-size:10px;color:#555555;">(${this.esc(row.alias)})</div>
              </td>
              <td><span class="avp-badge ${row.badge}">${this.esc(row.level)}</span></td>
              <td>${this.esc(row.vector)}</td>
              <td>
                <div><b>Угроза:</b> ${this.esc(row.damage)}</div>
                <div style="color:#005500;margin-top:2px;"><b>Лечение AVP:</b> ${this.esc(row.cure)}</div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="avp-section-hdr">СВЕЖИЕ АНАЛИТИЧЕСКИЕ БЮЛЛЕТЕНИ И РАЗБОРЫ ВИРУСНОЙ ЛАБОРАТОРИИ</div>
      ${data.articles.map((art) => `
        <div class="avp-panel-inset">
          <div style="font-size:10px;color:#666666;">
            <span class="avp-badge avp-badge-med">${this.esc(art.catName)}</span>
            &nbsp;<b>${this.esc(art.date)}</b> | Автор: ${this.esc(art.author)} | Просмотров: ${art.views}
          </div>
          <div style="font-size:13px;font-weight:bold;margin:3px 0;">
            <a data-url="http://www.avp.ru/article?id=${encodeURIComponent(art.id)}">${this.esc(art.title)}</a>
          </div>
          <div style="margin-bottom:5px;">${this.esc(art.lead)}</div>
          <div>
            <button class="avp-btn" data-url="http://www.avp.ru/article?id=${encodeURIComponent(art.id)}" style="font-size:10px;">Читать разбор и HEX-протокол &gt;&gt;</button>
          </div>
        </div>
      `).join('')}

      <div class="avp-section-hdr">РЕЗУЛЬТАТЫ СРАВНИТЕЛЬНЫХ ИСПЫТАНИЙ VIRUS TEST CENTER (УНИВЕРСИТЕТ ГАМБУРГА, 1998)</div>
      <table class="avp-table">
        <thead>
          <tr>
            <th>Антивирусный пакет</th>
            <th>Коллекция In-The-Wild</th>
            <th>Полиморфные вирусы</th>
            <th>Макро-вирусы OLE2</th>
            <th>Проверка архивов и упаковщиков</th>
            <th>Вердикт</th>
          </tr>
        </thead>
        <tbody>
          ${data.hamburgTests.map((t, idx) => `
            <tr class="${idx % 2 === 1 ? 'alt' : ''}" style="${idx === 0 ? 'background-color:#fff8dc;font-weight:bold;' : ''}">
              <td>${this.esc(t.product)}<div style="font-size:9px;color:#555555;font-weight:normal;">${this.esc(t.vendor)}</div></td>
              <td style="color:#006600;font-weight:bold;">${this.esc(t.itwScore)}</td>
              <td>${this.esc(t.polyScore)}</td>
              <td>${this.esc(t.macroScore)}</td>
              <td>${this.esc(t.archiveDepth)}</td>
              <td>${this.esc(t.verdict)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderStorePage(params) {
    const avp = this.getAvpGameState();
    const justPurchased = params && params.purchased === '1';

    let statusBanner = '';
    if (justPurchased || avp.purchased) {
      statusBanner = `
        <div style="background:#e6ffe6;border:2px solid #006600;padding:8px;margin-bottom:8px;">
          <div style="font-size:12px;font-weight:bold;color:#004d00;">
            [ЛИЦЕНЗИЯ ПОДТВЕРЖДЕНА] Именной ключ AVP03-1998-KAMI-7788 зарегистрирован на ваш компьютер!
          </div>
          <div style="margin-top:4px;">
            Теперь вы можете скачать официальный инсталлятор <b>Setup_AVP.exe (6.2 МБ)</b>, запустить мастер установки в <code>C:\\Program Files\\AVP</code> и включить постоянную антивирусную защиту.
          </div>
        </div>
      `;
    }

    let primaryActions = '';
    if (avp.installed) {
      primaryActions = `
        <div style="margin-bottom:6px;color:#006600;font-weight:bold;">
          Статус: Программа Антивирус Касперского AVP 3.0 установлена в C:\\Program Files\\AVP\\AVP.EXE и готова к работе!
        </div>
        <button class="avp-btn-green" id="avp-store-launch-btn" style="margin-right:6px;">Запустить Антивирус Касперского AVP 3.0</button>
        <button class="avp-btn" id="avp-store-redownload-btn">Перекачать Setup_AVP.exe</button>
      `;
    } else if (avp.downloaded) {
      primaryActions = `
        <div style="margin-bottom:6px;color:#8b4500;font-weight:bold;">
          Статус: Инсталлятор Setup_AVP.exe находится в папке C:\\My Documents\\Downloads. Запустите установку!
        </div>
        <button class="avp-btn-gold" id="avp-store-setup-btn" style="margin-right:6px;">Запустить установку Setup_AVP.exe</button>
        <button class="avp-btn" id="avp-store-redownload-btn">Скачать Setup_AVP.exe повторно</button>
      `;
    } else if (avp.purchased) {
      primaryActions = `
        <div style="margin-bottom:6px;color:#005500;font-weight:bold;">
          Статус: Лицензия оплачена ($${avp.basePrice.toFixed(2)}). Доступна прямая загрузка с сервера www.avp.ru!
        </div>
        <button class="avp-btn-green" id="avp-store-download-btn" style="margin-right:6px;">Скачать Setup_AVP.exe (6.2 МБ) с сервера AVP.RU</button>
      `;
    } else {
      primaryActions = `
        <div style="margin-bottom:6px;">
          <b>Официальная коммерческая лицензия на 1 рабочее место (годовая подписка на DAILY.AVC включена):</b>
        </div>
        <button class="avp-btn-red" data-url="http://www.avp.ru/order" style="margin-right:6px;">Купить лицензию AVP 3.0 ($${avp.finalPrice.toFixed(2)})</button>
        <button class="avp-btn" id="avp-store-save-keyinfo-btn">Сохранить прайс-лист в Мои документы</button>
      `;
    }

    return `
      <div class="avp-section-hdr">МАГАЗИН ЛИЦЕНЗИЙ И ЦЕНТР ЗАГРУЗКИ АНТИВИРУСА КАСПЕРСКОГО AVP 3.0</div>
      ${statusBanner}

      <div class="avp-product-hero">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="122" valign="top" align="center">
              ${this.getBoxArtSvg()}
              <div style="margin-top:6px;" class="avp-price-tag">$${avp.finalPrice.toFixed(2)}</div>
              <div style="font-size:9px;color:#555555;margin-top:2px;">(~399 руб. по курсу ЦБ)</div>
            </td>
            <td valign="top" style="padding-left:10px;">
              <div style="font-size:15px;font-weight:bold;color:#8b0000;">
                Антивирус Касперского — AntiViral Toolkit Pro (AVP 3.0 Platinum Edition)
              </div>
              <div style="font-size:10px;color:#444444;margin:2px 0 6px 0;">
                Разработчик: ЗАО «Лаборатория Касперского» (Е. Касперский, А. Де-Мондерик, В. Богданов) • Файл: <b>Setup_AVP.exe (6.2 МБ)</b> • Каталог установки: <code>C:\\Program Files\\AVP</code>
              </div>
              <div style="margin-bottom:8px;">
                Полнофункциональный антивирусный пакет для защиты домашних и корпоративных компьютеров. Включает сигнатурный и эвристический сканер второго поколения <b>CodeAnalyzer</b>, резидентный сторож файловой системы <b>AVPM.EXE</b>, ревизор изменений диска <b>AVP Inspector</b> и автоматический распаковщик многотомных архивов.
              </div>

              <div class="avp-panel-inset" style="background:#f5f2e8;">
                <div style="font-weight:bold;margin-bottom:4px;">Купон скидки для подписчиков FidoNet RU.ANTIVIRUS и читателей Ferrum98:</div>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <input type="text" id="avp-promo-input" class="avp-input" value="${this.esc(this.promoCode)}" placeholder="Например: AVP1998" style="width:140px;">
                    </td>
                    <td style="padding-left:6px;">
                      <button class="avp-btn" id="avp-apply-promo-btn">Применить купон (-$5.00)</button>
                    </td>
                    <td style="padding-left:8px;font-size:10px;color:#006600;font-weight:bold;">
                      ${this.esc(this.promoMessage)}
                    </td>
                  </tr>
                </table>
              </div>

              <div style="margin-top:8px;">
                ${primaryActions}
              </div>
            </td>
          </tr>
        </table>
      </div>

      <div class="avp-section-hdr">СОСТАВ КОМПЛЕКСА ANTIVIRAL TOOLKIT PRO 3.0</div>
      <table class="avp-table" style="margin-bottom:10px;">
        <thead>
          <tr>
            <th>Модуль пакета</th>
            <th>Исполняемый файл</th>
            <th>Назначение и технические характеристики</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>AVP Scanner 32-bit</b></td>
            <td><code>AVP.EXE / AVP32.EXE</code></td>
            <td>Графический сканер с виртуальным процессором i386 для раскрутки полиморфных вирусов, проверкой секторов MBR/Boot, памяти и лечением заражённых файлов.</td>
          </tr>
          <tr class="alt">
            <td><b>AVP Monitor (Сторож)</b></td>
            <td><code>AVPM.EXE / AVP95.VXD</code></td>
            <td>Резидентный перехватчик файловых операций на уровне ядра Ring 0 (IFSMgr). Блокирует запуск заражённых программ и макросов в реальном времени.</td>
          </tr>
          <tr>
            <td><b>AVP Inspector (Ревизор)</b></td>
            <td><code>AVPI.EXE</code></td>
            <td>Контроль целостности системных областей, реестра и исполняемых файлов по криптографическим CRC-паспортам. Выявляет даже неизвестные науке вирусы.</td>
          </tr>
          <tr class="alt">
            <td><b>UnpackEngine &amp; OLE2</b></td>
            <td><code>KERNEL.AVC</code></td>
            <td>Прозрачная проверка внутри архивов ZIP, ARJ, RAR, CAB, LHA и исполняемых упаковщиков PKLite, LZEXE, Diet, Petite, WWPack без создания временных файлов.</td>
          </tr>
        </tbody>
      </table>

      <div class="avp-section-hdr">ЦЕНТР ОПЕРАТИВНЫХ ОБНОВЛЕНИЙ АНТИВИРУСНЫХ БАЗ (.AVC)</div>
      <div style="margin-bottom:6px;">
        Скачайте свежий контейнер сигнатур <b>DAILY.AVC</b>. При загрузке пакета обновления новые сигнатуры автоматически подключаются к вашему установленному сканеру <b>Антивирус Касперского AVP 3.0</b> и сохраняются в виртуальную файловую систему!
      </div>
      <table class="avp-table">
        <thead>
          <tr>
            <th>Пакет базы</th>
            <th>Дата выпуска</th>
            <th>Размер</th>
            <th>Описание и добавляемые сигнатуры</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          ${window.avpData.avcPackages.map((pkg, idx) => {
            const isDone = this.state.downloadedAvc.includes(pkg.id);
            return `
              <tr class="${idx % 2 === 1 ? 'alt' : ''}">
                <td><b>${this.esc(pkg.filename)}</b></td>
                <td>${this.esc(pkg.date)}</td>
                <td>${this.esc(pkg.size)}</td>
                <td>
                  <div><b>${this.esc(pkg.records)}</b></div>
                  <div style="font-size:10px;color:#444444;">${this.esc(pkg.desc)}</div>
                </td>
                <td width="150" align="center">
                  <button class="${isDone ? 'avp-btn-green' : 'avp-btn-gold'} avp-dl-avc-btn" data-avc-id="${this.esc(pkg.id)}" style="width:100%;font-size:10px;">
                    ${isDone ? '[Обновлено • Скачать ещё]' : 'Скачать и подключить'}
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  renderOrderPage() {
    const avp = this.getAvpGameState();
    if (avp.purchased) {
      return `
        <div class="avp-section-hdr">ЛИЦЕНЗИЯ НА АНТИВИРУС КАСПЕРСКОГО AVP 3.0 УЖЕ АКТИВНА</div>
        <div class="avp-panel-inset" style="background:#e6ffe6;border-color:#006600;">
          <div style="font-size:13px;font-weight:bold;color:#004d00;margin-bottom:6px;">
            Заказ оплачен! Ваш регистрационный ключ AVP.KEY активен без ограничений.
          </div>
          <div style="margin-bottom:8px;">
            Перейдите в Центр загрузки, чтобы скачать <b>Setup_AVP.exe (6.2 МБ)</b> или запустить установленный сканер.
          </div>
          <button class="avp-btn-green" data-url="http://www.avp.ru/store?purchased=1">Перейти к загрузке Setup_AVP.exe &gt;&gt;</button>
        </div>
      `;
    }

    return `
      <div class="avp-section-hdr">ОФОРМЛЕНИЕ ИМЕННОЙ ЛИЦЕНЗИИ • АНТИВИРУС КАСПЕРСКОГО AVP 3.0</div>
      <div class="avp-panel-inset" style="background:#fffdf5;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="top">
              <div style="font-size:13px;font-weight:bold;color:#8b0000;">Заказ #AVP-98-1021: AntiViral Toolkit Pro 3.0 Platinum</div>
              <div style="margin-top:4px;">
                &bull; <b>Продукт:</b> Антивирус Касперского AVP 3.0 (полный дистрибутив <code>Setup_AVP.exe</code>, 6.2 МБ)<br>
                &bull; <b>Лицензия:</b> Именной ключевой файл <code>AVP.KEY</code> + годовая подписка на ежедневные базы <code>DAILY.AVC</code><br>
                &bull; <b>Сервер доставки:</b> Прямой защищённый канал <code>http://www.avp.ru</code>
              </div>
            </td>
            <td width="160" align="right" valign="top">
              <div style="font-size:10px;color:#555555;">К оплате:</div>
              <div class="avp-price-tag">$${avp.finalPrice.toFixed(2)}</div>
              ${this.promoDiscount > 0 ? `<div style="font-size:10px;color:#006600;font-weight:bold;">Скидка по купону: -$${this.promoDiscount.toFixed(2)}</div>` : ''}
            </td>
          </tr>
        </table>
      </div>

      <div class="avp-panel">
        <div class="avp-panel-head">ЗАЩИЩЁННЫЙ ПРОТОКОЛ ОПЛАТЫ SSL 3.0 (KASPERSKY LAB DIRECT BILLING)</div>
        <div class="avp-panel-body">
          <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <span>Введите реквизиты банковской карты Visa / MasterCard / Сберкарта или заполните автоматически:</span>
            <button class="avp-btn-gold" id="avp-autofill-card-btn" type="button">Вставить из файла</button>
          </div>

          <table class="avp-table" style="margin-bottom:8px;">
            <tr>
              <td width="190"><b>Номер кредитной карты:</b></td>
              <td>
                <input type="text" id="avp-pay-num" class="avp-input" placeholder="4276 3800 1998 2024" maxlength="19" style="width:230px;font-family:'Courier New',monospace;font-weight:bold;">
              </td>
            </tr>
            <tr class="alt">
              <td><b>Срок действия (ММ/ГГ) и CVV2:</b></td>
              <td>
                <input type="text" id="avp-pay-exp" class="avp-input" placeholder="12/28" maxlength="5" style="width:70px;font-family:'Courier New',monospace;">
                &nbsp;CVV2:&nbsp;
                <input type="password" id="avp-pay-cvv" class="avp-input" placeholder="777" maxlength="3" style="width:55px;font-family:'Courier New',monospace;">
              </td>
            </tr>
            <tr>
              <td><b>Имя владельца (латиницей):</b></td>
              <td>
                <input type="text" id="avp-pay-name" class="avp-input" placeholder="RETRO USER" style="width:230px;text-transform:uppercase;">
              </td>
            </tr>
            <tr class="alt">
              <td><b>Купон скидки (необязательно):</b></td>
              <td>
                <input type="text" id="avp-order-promo-input" class="avp-input" value="${this.esc(this.promoCode)}" placeholder="AVP1998" style="width:120px;">
                <button class="avp-btn" id="avp-order-promo-btn" type="button">Пересчитать</button>
                <span style="font-size:10px;color:#006600;margin-left:6px;">${this.esc(this.promoMessage)}</span>
              </td>
            </tr>
          </table>

          <div id="avp-pay-error" style="display:none;background:#ffe6e6;border:1px solid #cc0000;color:#990000;padding:5px 8px;margin-bottom:8px;font-weight:bold;"></div>

          <div>
            <button class="avp-btn-green" id="avp-confirm-pay-btn" type="button">Оплатить $${avp.finalPrice.toFixed(2)} и получить Setup_AVP.exe</button>
            <button class="avp-btn" data-url="http://www.avp.ru/store" type="button" style="margin-left:6px;">Вернуться к описанию AVP 3.0</button>
          </div>
        </div>
      </div>
    `;
  }

  renderEncyclopediaPage(params) {
    const list = window.avpData.virusEncyclopedia;
    if (params && params.id) {
      const found = list.find((v) => v.id.toLowerCase() === params.id.toLowerCase());
      if (found) this.activeEncyclopediaId = found.id;
    }

    const q = (this.encyclopediaQuery || '').trim().toLowerCase();
    const filtered = list.filter((item) => {
      if (this.encyclopediaFilter === 'crit' && item.badge !== 'avp-badge-crit') return false;
      if (this.encyclopediaFilter === 'macro' && !item.id.toLowerCase().includes('macro') && !item.id.toLowerCase().includes('worm')) return false;
      if (this.encyclopediaFilter === 'trojan' && !item.id.toLowerCase().includes('trojan')) return false;
      if (!q) return true;
      return (
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.targets.toLowerCase().includes(q)
      );
    });

    const activeVirus = filtered.find((v) => v.id === this.activeEncyclopediaId) || filtered[0] || list[0];

    return `
      <div class="avp-section-hdr">ВИРУСНАЯ ЭНЦИКЛОПЕДИЯ КАСПЕРСКОГО (VIRUSLIST '98 • ИЛЛЮСТРИРОВАННЫЙ КАТАЛОГ)</div>
      <div class="avp-panel-inset" style="background:#f2eee6;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              Поиск по сигнатуре или описанию:
              <input type="text" id="avp-enc-search-input" class="avp-input" value="${this.esc(this.encyclopediaQuery)}" placeholder="CIH, TotallyNotAVirus, OneHalf..." style="width:185px;">
              <button class="avp-btn" id="avp-enc-search-btn">Найти</button>
            </td>
            <td align="right">
              Фильтр:
              <select id="avp-enc-filter-select" class="avp-select">
                <option value="all" ${this.encyclopediaFilter === 'all' ? 'selected' : ''}>Все классы угроз (${list.length})</option>
                <option value="crit" ${this.encyclopediaFilter === 'crit' ? 'selected' : ''}>Критические (BIOS / MBR)</option>
                <option value="trojan" ${this.encyclopediaFilter === 'trojan' ? 'selected' : ''}>Троянские программы</option>
                <option value="macro" ${this.encyclopediaFilter === 'macro' ? 'selected' : ''}>Макро-вирусы и черви</option>
              </select>
            </td>
          </tr>
        </table>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="42%" valign="top" style="padding-right:6px;">
            <table class="avp-table">
              <thead>
                <tr>
                  <th>Имя в базе AVP</th>
                  <th>Опасность</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map((v) => `
                  <tr style="${v.id === activeVirus.id ? 'background:#fff4cc;font-weight:bold;' : ''}">
                    <td>
                      <a href="#" class="avp-select-virus-link" data-virus-id="${this.esc(v.id)}">${this.esc(v.name)}</a>
                      <div style="font-size:9px;color:#555555;">${this.esc(v.family)}</div>
                    </td>
                    <td><span class="avp-badge ${v.badge}">ДОСЬЕ</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </td>
          <td width="58%" valign="top">
            <div class="avp-panel">
              <div class="avp-panel-head">КАРТОЧКА ШТАММА: ${this.esc(activeVirus.name)}</div>
              <div class="avp-panel-body">
                <div style="margin-bottom:4px;"><b>Класс угрозы:</b> ${this.esc(activeVirus.family)}</div>
                <div style="margin-bottom:4px;"><b>Обнаружен:</b> ${this.esc(activeVirus.discovered)}</div>
                <div style="margin-bottom:4px;"><b>Степень опасности:</b> <span class="avp-badge ${activeVirus.badge}">${this.esc(activeVirus.danger)}</span></div>
                <div style="margin-bottom:4px;"><b>Поражаемые объекты:</b> ${this.esc(activeVirus.targets)}</div>
                <div style="margin-bottom:6px;"><b>Длина кода:</b> ${this.esc(activeVirus.size)}</div>

                <div style="font-weight:bold;color:#8b0000;margin-bottom:2px;">Техническое описание и поведение:</div>
                <div style="margin-bottom:6px;">${this.esc(activeVirus.summary)}</div>

                <div style="font-weight:bold;color:#2b0000;margin-bottom:2px;">Карта перехватов в памяти:</div>
                <div class="avp-terminal" style="margin-bottom:6px;">${this.esc(activeVirus.memoryMap)}</div>

                <div style="font-weight:bold;color:#2b0000;margin-bottom:2px;">Характерный HEX-дамп сигнатуры:</div>
                <div class="avp-hex-box" style="margin-bottom:6px;">${this.esc(activeVirus.hexDump)}</div>

                <div style="font-weight:bold;color:#005500;margin-bottom:2px;">Алгоритм лечения в AVP 3.0:</div>
                <div style="margin-bottom:8px;">${this.esc(activeVirus.cureMethod)}</div>

                <div>
                  <button class="avp-btn" id="avp-export-virus-notepad-btn" data-virus-id="${this.esc(activeVirus.id)}">Открыть досье в Блокноте</button>
                  <button class="avp-btn-gold" id="avp-save-virus-vfs-btn" data-virus-id="${this.esc(activeVirus.id)}">Сохранить карточку в Мои документы</button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  computeHeuristicVerdict() {
    const s = this.labState;
    let score = 0;
    const triggers = [];
    if (s.ring0) {
      score += 45;
      triggers.push('[CRITICAL] Обнаружена инструкция SIDT и модификация вектора INT 03h (прорыв в Ring 0 ядра)');
    }
    if (s.biosPort) {
      score += 45;
      triggers.push('[CRITICAL] Прямая запись в порты ввода-вывода 0CF8h/0CFCh (попытка стирания микросхемы Flash BIOS)');
    }
    if (s.normalDot) {
      score += 35;
      triggers.push('[HIGH] Макрос AutoOpen в потоке OLE2 с отключением Options.VirusProtection (шаблон NORMAL.DOT)');
    }
    if (s.wsockHook) {
      score += 30;
      triggers.push('[HIGH] Скрытый перехват сетевой библиотеки WSOCK32.DLL / открытие фонового порта UDP 31337');
    }
    if (s.polyXor) {
      score += 25;
      triggers.push('[MEDIUM] В точке входа обнаружен полиморфный цикл расшифровки XOR/ROR (эмуляция 32 768 тактов CPU)');
    }

    let signature = 'Объект чист (подозрительных инструкций не выявлено)';
    let level = 'БЕЗОПАСНО';
    if (s.ring0 && s.biosPort) {
      signature = 'Подозрение на Win95.CIH.1003 (Chernobyl Ring-0 BIOS Killer)';
      level = 'КРИТИЧЕСКАЯ ТРЕВОГА (БОЕВОЙ ВИРУС)';
    } else if (s.polyXor && s.wsockHook) {
      signature = 'Trojan.Win98.TotallyNotAVirus / BackOrifice Dropper';
      level = 'ТРОЯНСКАЯ ПРОГРАММА ОБНАРУЖЕНА';
    } else if (s.normalDot) {
      signature = 'Macro.Word97.Melissa / Concept.VBA';
      level = 'МАКРО-ВИРУС В КОНТЕЙНЕРЕ OLE2';
    } else if (score >= 45) {
      signature = 'Suspicious.Win32.Heuristic.Type_PE';
      level = 'ВЫСОКИЙ РИСК ЗАРАЖЕНИЯ';
    } else if (score > 0) {
      signature = 'Packed.Executable.Warning (требуется углублённая проверка AVP 3.0)';
      level = 'ПОДОЗРИТЕЛЬНЫЙ КОД';
    }

    return { score: Math.min(100, score), triggers, signature, level };
  }

  renderLabPage() {
    const samples = window.avpData.heuristicSamples;
    const currentSample = samples.find((x) => x.id === this.labState.sampleId) || samples[0];
    const verdict = this.labState.lastReport || this.computeHeuristicVerdict();
    const webScan = this.labState.webScanReport;

    return `
      <div class="avp-section-hdr">ИНТЕРАКТИВНЫЙ СТЕНД ЭВРИСТИЧЕСКОГО АНАЛИЗАТОРА AVP CODEANALYZER (i386 EMULATOR)</div>
      <div style="margin-bottom:8px;">
        Испытайте работу виртуального процессора и эвристического ядра <b>AVP 3.0 CodeAnalyzer</b>! Выберите исследуемый образец или переключите флаги перехватов в дизассемблере, чтобы запустить эмуляцию кода в изолированной песочнице.
      </div>

      <div class="avp-panel">
        <div class="avp-panel-head-dark">ШАГ 1. ВЫБОР ОБРАЗЦА И НАСТРОЙКА ТРАССЫ ИНСТРУКЦИЙ ЭМУЛЯТОРА</div>
        <div class="avp-panel-body">
          <div style="margin-bottom:6px;">
            <b>Исследуемый файл в песочнице:</b>
            <select id="avp-lab-sample-select" class="avp-select" style="width:360px;">
              ${samples.map((smp) => `
                <option value="${this.esc(smp.id)}" ${smp.id === this.labState.sampleId ? 'selected' : ''}>${this.esc(smp.name)}</option>
              `).join('')}
            </select>
          </div>

          <div class="avp-hex-box" style="margin-bottom:6px;">Байты точки входа (EntryPoint): ${this.esc(currentSample.entryHex)}
Примечание аналитика: ${this.esc(currentSample.notes)}</div>

          <div style="font-weight:bold;margin-bottom:4px;">Активные флаги поведения в трассе виртуального процессора i386:</div>
          <div style="margin-bottom:3px;">
            <label style="cursor:pointer;"><input type="checkbox" id="avp-flag-ring0" ${this.labState.ring0 ? 'checked' : ''}> Инструкция <code>SIDT</code> и модификация вектора <code>INT 03h</code> (прорыв из Ring 3 в ядро Ring 0)</label>
          </div>
          <div style="margin-bottom:3px;">
            <label style="cursor:pointer;"><input type="checkbox" id="avp-flag-bios" ${this.labState.biosPort ? 'checked' : ''}> Прямой вывод в порты <code>0CF8h / 0CFCh</code> (запись в микросхему Flash BIOS)</label>
          </div>
          <div style="margin-bottom:3px;">
            <label style="cursor:pointer;"><input type="checkbox" id="avp-flag-macro" ${this.labState.normalDot ? 'checked' : ''}> Макромодуль <code>AutoOpen</code> в потоке OLE2 и отключение <code>VirusProtection</code> в <code>NORMAL.DOT</code></label>
          </div>
          <div style="margin-bottom:3px;">
            <label style="cursor:pointer;"><input type="checkbox" id="avp-flag-wsock" ${this.labState.wsockHook ? 'checked' : ''}> Перехват таблицы экспорта <code>WSOCK32.DLL</code> или открытие скрытого порта <code>UDP 31337</code></label>
          </div>
          <div style="margin-bottom:8px;">
            <label style="cursor:pointer;"><input type="checkbox" id="avp-flag-poly" ${this.labState.polyXor ? 'checked' : ''}> Многослойный полиморфный расшифровщик <code>XOR BYTE PTR [ESI], AL</code> в точке входа</label>
          </div>

          <div>
            <button class="avp-btn-red" id="avp-run-emulation-btn">Запустить эмуляцию CodeAnalyzer (со звуком тревоги)</button>
            <button class="avp-btn" id="avp-export-lab-notepad-btn" style="margin-left:6px;">Выгрузить протокол в Блокнот</button>
          </div>
        </div>
      </div>

      <div class="avp-panel">
        <div class="avp-panel-head">РЕЗУЛЬТАТ ЭВРИСТИЧЕСКОЙ ЭМУЛЯЦИИ AVP CODEANALYZER</div>
        <div class="avp-panel-body">
          <div class="avp-terminal" id="avp-lab-terminal">AVP 3.0 CodeAnalyzer Engine (Build 3.0.129)
------------------------------------------------------------
Объект анализа : ${this.esc(currentSample.name)}
Индекс угрозы  : ${verdict.score} / 100
Вердикт ядра   : ${this.esc(verdict.level)}
Сигнатура AVP  : ${this.esc(verdict.signature)}
------------------------------------------------------------
Сработавшие эвристики:
${verdict.triggers.length > 0 ? verdict.triggers.map((t) => ' * ' + this.esc(t)).join('\n') : ' * Подозрительных инструкций в трассе эмулятора не обнаружено.'}</div>
        </div>
      </div>

      <div class="avp-section-hdr">ОНЛАЙН-СКАНЕР РАБОЧЕГО СТОЛА И ДИСКА C: (AVP WEB-INSPECTOR)</div>
      <div class="avp-panel-inset">
        <div style="margin-bottom:6px;">
          Быстрая проверка вашей виртуальной файловой системы и Рабочего стола на наличие активного трояна <b>totally_not_a_virus.exe</b> и подозрительных архивов:
        </div>
        <div>
          <button class="avp-btn-gold" id="avp-webscan-run-btn">Проверить Рабочий стол и C:\\ сейчас</button>
          <button class="avp-btn-green" id="avp-webscan-cure-btn" style="margin-left:6px;">Обезвредить найденный троян (Лечить)</button>
          <button class="avp-btn" data-url="http://www.avp.ru/store" style="margin-left:6px;">Скачать полную версию AVP 3.0</button>
        </div>
        ${webScan ? `
          <div class="avp-terminal" style="margin-top:8px;">${this.esc(webScan)}</div>
        ` : ''}
      </div>
    `;
  }

  renderNewsPage(params) {
    if (params && params.cat) {
      this.newsCategory = params.cat;
    }
    const articles = window.avpData.articles.filter((a) => this.newsCategory === 'all' || a.cat === this.newsCategory);

    return `
      <div class="avp-section-hdr">БЮЛЛЕТЕНИ БЕЗОПАСНОСТИ И АВТОРСКИЕ СТАТЬИ ЛАБОРАТОРИИ КАСПЕРСКОГО</div>
      <div class="avp-panel-inset" style="margin-bottom:8px;">
        Рубрика:
        <button class="avp-btn ${this.newsCategory === 'all' ? 'avp-btn-gold' : ''}" data-url="http://www.avp.ru/news?cat=all" style="font-size:10px;">Все статьи</button>
        <button class="avp-btn ${this.newsCategory === 'bios' ? 'avp-btn-gold' : ''}" data-url="http://www.avp.ru/news?cat=bios" style="font-size:10px;">Атаки на BIOS (CIH)</button>
        <button class="avp-btn ${this.newsCategory === 'tech' ? 'avp-btn-gold' : ''}" data-url="http://www.avp.ru/news?cat=tech" style="font-size:10px;">Технологии AVP 3.0</button>
        <button class="avp-btn ${this.newsCategory === 'epidemics' ? 'avp-btn-gold' : ''}" data-url="http://www.avp.ru/news?cat=epidemics" style="font-size:10px;">Сетевые эпидемии</button>
        <button class="avp-btn ${this.newsCategory === 'macro' ? 'avp-btn-gold' : ''}" data-url="http://www.avp.ru/news?cat=macro" style="font-size:10px;">Базы .AVC</button>
      </div>

      ${articles.map((art) => `
        <div class="avp-panel">
          <div class="avp-panel-head">${this.esc(art.catName)} • ${this.esc(art.date)}</div>
          <div class="avp-panel-body">
            <div style="font-size:13px;font-weight:bold;margin-bottom:4px;">
              <a data-url="http://www.avp.ru/article?id=${encodeURIComponent(art.id)}">${this.esc(art.title)}</a>
            </div>
            <div style="font-size:10px;color:#555555;margin-bottom:5px;">
              Автор: <b>${this.esc(art.author)}</b> | Просмотров: ${art.views}
            </div>
            <div style="margin-bottom:6px;">${this.esc(art.lead)}</div>
            <button class="avp-btn-red" data-url="http://www.avp.ru/article?id=${encodeURIComponent(art.id)}" style="font-size:10px;">Открыть полный текст и листинг &gt;&gt;</button>
          </div>
        </div>
      `).join('')}
    `;
  }

  renderArticlePage(params) {
    const id = params && params.id ? params.id : 'cih-anatomy';
    const art = window.avpData.articles.find((a) => a.id === id) || window.avpData.articles[0];
    const comments = (this.state.articleComments && this.state.articleComments[art.id]) || [];

    return `
      <div style="margin-bottom:6px;">
        <a data-url="http://www.avp.ru/news">&lt;&lt; Ко всем бюллетеням Лаборатории Касперского</a>
      </div>

      <div class="avp-panel">
        <div class="avp-panel-head">${this.esc(art.catName)} • ОПУБЛИКОВАНО: ${this.esc(art.date)}</div>
        <div class="avp-panel-body">
          <div style="font-size:15px;font-weight:bold;color:#8b0000;margin-bottom:4px;">${this.esc(art.title)}</div>
          <div style="font-size:10px;color:#444444;border-bottom:1px solid #cccccc;padding-bottom:4px;margin-bottom:8px;">
            Автор: <b>${this.esc(art.author)}</b> | Отдел вирусных исследований ЗАО «Лаборатория Касперского»
          </div>

          <div style="font-weight:bold;margin-bottom:8px;background:#fff8dc;border:1px solid #b8860b;padding:6px;">
            ${this.esc(art.lead)}
          </div>

          <div style="font-weight:bold;margin-bottom:2px;">Фрагмент дизассемблированного кода / протокола:</div>
          <div class="avp-hex-box" style="margin-bottom:8px;">${this.esc(art.hexSnippet)}</div>

          ${art.body.map((p) => `<p style="margin:0 0 8px 0;text-align:justify;">${this.esc(p)}</p>`).join('')}

          <div class="avp-terminal" style="margin:8px 0;">${this.esc(art.protocolSummary)}</div>

          <div style="margin-top:8px;">
            <button class="avp-btn" id="avp-article-notepad-btn" data-art-id="${this.esc(art.id)}">Открыть статью в Блокноте</button>
            <button class="avp-btn-gold" id="avp-article-save-vfs-btn" data-art-id="${this.esc(art.id)}" style="margin-left:6px;">Сохранить в C:\\My Documents</button>
            <button class="avp-btn-red" data-url="http://www.avp.ru/store" style="margin-left:6px;">Скачать AVP 3.0 для защиты</button>
          </div>
        </div>
      </div>

      <div class="avp-section-hdr">КОММЕНТАРИИ ЧИТАТЕЛЕЙ И ОТВЕТЫ ДЕЖУРНОГО ВИРУСНОГО АНАЛИТИКА (${comments.length})</div>
      ${comments.map((c) => `
        <div class="avp-panel-inset">
          <div style="font-size:10px;color:#8b0000;font-weight:bold;">
            ${this.esc(c.author)} <span style="color:#666666;font-weight:normal;">(${this.esc(c.date)})</span>
          </div>
          <div style="margin-top:3px;">${this.esc(c.text)}</div>
        </div>
      `).join('')}

      <div class="avp-panel">
        <div class="avp-panel-head-dark">ДОБАВИТЬ ВОПРОС ВИРУСНОМУ АНАЛИТИКУ</div>
        <div class="avp-panel-body">
          <div style="margin-bottom:5px;">
            Ваше имя / позывной FidoNet:
            <input type="text" id="avp-comment-author" class="avp-input" placeholder="SysOp_2:5020" style="width:200px;">
          </div>
          <div style="margin-bottom:5px;">
            Текст вопроса или наблюдения:<br>
            <textarea id="avp-comment-text" class="avp-textarea" rows="3" style="width:98%;"></textarea>
          </div>
          <button class="avp-btn-gold" id="avp-comment-submit-btn" data-art-id="${this.esc(art.id)}">Отправить комментарий</button>
        </div>
      </div>
    `;
  }

  getAllThreads() {
    const base = window.avpData.fidoThreads || [];
    const custom = this.state.customThreads || [];
    return custom.concat(base);
  }

  renderForumPage(params) {
    if (params && params.cat) {
      this.forumCategory = params.cat;
    }
    const allThreads = this.getAllThreads().filter((t) => this.forumCategory === 'all' || t.cat === this.forumCategory);

    return `
      <div class="avp-section-hdr">ЭХОКОНФЕРЕНЦИЯ FIDONET RU.ANTIVIRUS • СЛУЖБА СПАСЕНИЯ AVP (УЗЕЛ 2:5020/400)</div>
      <div class="avp-panel-inset" style="margin-bottom:8px;">
        Фильтр тем:
        <button class="avp-btn ${this.forumCategory === 'all' ? 'avp-btn-gold' : ''}" data-url="http://www.avp.ru/forum?cat=all" style="font-size:10px;">Все темы</button>
        <button class="avp-btn ${this.forumCategory === 'epidemics' ? 'avp-btn-gold' : ''}" data-url="http://www.avp.ru/forum?cat=epidemics" style="font-size:10px;">Скорая помощь (SOS)</button>
        <button class="avp-btn ${this.forumCategory === 'license' ? 'avp-btn-gold' : ''}" data-url="http://www.avp.ru/forum?cat=license" style="font-size:10px;">Лицензии и покупка AVP 3.0</button>
        <button class="avp-btn ${this.forumCategory === 'cure' ? 'avp-btn-gold' : ''}" data-url="http://www.avp.ru/forum?cat=cure" style="font-size:10px;">Лечение сложных вирусов</button>
      </div>

      <table class="avp-table" style="margin-bottom:10px;">
        <thead>
          <tr>
            <th>Тема обсуждения в эхоконференции</th>
            <th>Рубрика</th>
            <th>Автор (Fido Address)</th>
            <th>Ответов</th>
          </tr>
        </thead>
        <tbody>
          ${allThreads.map((th, idx) => {
            const extraReplies = (this.state.threadReplies && this.state.threadReplies[th.id]) || [];
            const totalPosts = (th.posts ? th.posts.length : 0) + extraReplies.length;
            return `
              <tr class="${idx % 2 === 1 ? 'alt' : ''}">
                <td>
                  <b><a data-url="http://www.avp.ru/thread?id=${encodeURIComponent(th.id)}">${this.esc(th.title)}</a></b>
                  <div style="font-size:9px;color:#555555;">Дата: ${this.esc(th.date)}</div>
                </td>
                <td><span class="avp-badge avp-badge-med">${this.esc(th.catName)}</span></td>
                <td>${this.esc(th.author)}</td>
                <td align="center"><b>${totalPosts}</b></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="avp-panel">
        <div class="avp-panel-head-dark">СОЗДАТЬ НОВУЮ ТЕМУ В КОНФЕРЕНЦИИ RU.ANTIVIRUS</div>
        <div class="avp-panel-body">
          <div style="margin-bottom:5px;">
            Ваше имя / FidoNet-адрес:
            <input type="text" id="avp-newthread-author" class="avp-input" placeholder="Reader_2:5020/999" style="width:180px;">
            &nbsp;Рубрика:
            <select id="avp-newthread-cat" class="avp-select">
              <option value="epidemics">Скорая помощь (SOS)</option>
              <option value="license">Лицензии и покупка AVP</option>
              <option value="cure">Лечение сложных вирусов</option>
            </select>
          </div>
          <div style="margin-bottom:5px;">
            Заголовок темы:
            <input type="text" id="avp-newthread-title" class="avp-input" placeholder="Подозрительный файл в папке TEMP..." style="width:340px;">
          </div>
          <div style="margin-bottom:6px;">
            Сообщение:<br>
            <textarea id="avp-newthread-text" class="avp-textarea" rows="3" style="width:98%;"></textarea>
          </div>
          <button class="avp-btn-red" id="avp-newthread-submit-btn">Опубликовать в RU.ANTIVIRUS</button>
        </div>
      </div>
    `;
  }

  renderThreadPage(params) {
    const id = params && params.id ? params.id : 'fido-cih-bios';
    const all = this.getAllThreads();
    const thread = all.find((t) => t.id === id) || all[0];
    const extra = (this.state.threadReplies && this.state.threadReplies[thread.id]) || [];
    const posts = (thread.posts || []).concat(extra);

    return `
      <div style="margin-bottom:6px;">
        <a data-url="http://www.avp.ru/forum">&lt;&lt; Вернуться к списку тем конференции RU.ANTIVIRUS</a>
      </div>

      <div class="avp-section-hdr">${this.esc(thread.title)}</div>
      ${posts.map((p) => `
        <div class="avp-panel">
          <div class="avp-panel-head">
            ${this.esc(p.author)} — <span style="color:#ffd700;">${this.esc(p.role || 'Участник конференции')}</span>
            <span style="float:right;font-weight:normal;">${this.esc(p.date)}</span>
          </div>
          <div class="avp-panel-body" style="white-space:pre-line;">${this.esc(p.text)}</div>
        </div>
      `).join('')}

      <div class="avp-panel">
        <div class="avp-panel-head-dark">ОТВЕТИТЬ В ТЕМУ (ДЕЖУРНЫЙ АНАЛИТИК ПОДКЛЮЧЕН К ЭХОКОНФЕРЕНЦИИ)</div>
        <div class="avp-panel-body">
          <div style="margin-bottom:5px;">
            Ваше имя / узел:
            <input type="text" id="avp-reply-author" class="avp-input" placeholder="User_2:5020" style="width:200px;">
          </div>
          <div style="margin-bottom:6px;">
            Текст ответа:<br>
            <textarea id="avp-reply-text" class="avp-textarea" rows="3" style="width:98%;"></textarea>
          </div>
          <button class="avp-btn-gold" id="avp-reply-submit-btn" data-thread-id="${this.esc(thread.id)}">Отправить сообщение в эху</button>
        </div>
      </div>
    `;
  }

  renderAboutPage() {
    return `
      <div class="avp-section-hdr">О КОМПАНИИ ЗАО «ЛАБОРАТОРИЯ КАСПЕРСКОГО» (KASPERSKY LAB • 1989–1998)</div>
      <div class="avp-panel">
        <div class="avp-panel-head">ИСТОРИЯ ПРОЕКТА ANTIVIRAL TOOLKIT PRO (AVP)</div>
        <div class="avp-panel-body">
          <p style="margin:0 0 8px 0;">
            <b>Осень 1989 года:</b> На рабочем компьютере Евгения Касперского был обнаружен и обезврежен резидентный вирус <b>Cascade.1701</b> («Опадающие буквы»). Изучив дизассемблированный код вируса, Евгений написал первую утилиту для его лечения — с этого момента началась коллекция вирусных образцов и история антивируса Касперского.
          </p>
          <p style="margin:0 0 8px 0;">
            <b>1991–1996 годы (НТЦ «КАМИ»):</b> В рамках Информационного центра научно-технического центра «КАМИ» сформировалась команда разработчиков (Евгений Касперский, Алексей Де-Мондерик, Вадим Богданов). Проект получил название <b>AVP (AntiViral Toolkit Pro)</b>, а в 1994 году впервые занял 1-е место в международных сравнительных испытаниях Антивирусного центра Гамбургского университета (Virus Test Center), обойдя ведущие западные аналоги по проценту детектирования полиморфных вирусов.
          </p>
          <p style="margin:0 0 8px 0;">
            <b>26 июня 1997 года:</b> Была основана независимая компания <b>ЗАО «Лаборатория Касперского» (Kaspersky Lab)</b> со штаб-квартирой в Москве на улице Героев Панфиловцев, д. 10. Осенью 1998 года выпущен флагманский 32-битный комплекс <b>Антивирус Касперского AVP 3.0</b> с архитектурой сменных контейнеров <code>.AVC</code>, эмулятором процессора i386 <b>CodeAnalyzer</b> и фирменным звуковым оповещением тревоги.
          </p>
          <p style="margin:0;">
            <b>Международное признание:</b> Технологическое ядро AVP 3.0 лицензировано финской компанией Data Fellows (пакет F-Secure Anti-Virus), немецкой G Data Software и японской SoftBank, а сам пакет сертифицирован международной ассоциацией компьютерной безопасности <b>ICSA</b>.
          </p>
        </div>
      </div>

      <div class="avp-section-hdr">КООРДИНАТЫ И СЛУЖБА ТЕХНИЧЕСКОЙ ПОДДЕРЖКИ</div>
      <table class="avp-table">
        <tr>
          <td width="200"><b>Центральный офис в Москве:</b></td>
          <td>123363, г. Москва, ул. Героев Панфиловцев, д. 10, корп. 1 (ЗАО «Лаборатория Касперского»)</td>
        </tr>
        <tr class="alt">
          <td><b>Официальный веб-сервер:</b></td>
          <td><a data-url="http://www.avp.ru">http://www.avp.ru</a> (Магазин лицензий и загрузка <code>Setup_AVP.exe</code>)</td>
        </tr>
        <tr>
          <td><b>Круглосуточная вирусная лаборатория:</b></td>
          <td><a href="mailto:lab@avp.ru">lab@avp.ru</a>, <a href="mailto:virus@avp.ru">virus@avp.ru</a> (анализ новых штаммов за 24 часа)</td>
        </tr>
        <tr class="alt">
          <td><b>Эхоконференция FidoNet:</b></td>
          <td><code>RU.ANTIVIRUS</code>, узел Лаборатории <code>2:5020/400</code></td>
        </tr>
      </table>
    `;
  }

  renderNotFoundPage(path) {
    return `
      <div class="avp-section-hdr">ОШИБКА 404 • ДОКУМЕНТ НЕ НАЙДЕН НА СЕРВЕРЕ WWW.AVP.RU</div>
      <div class="avp-panel-inset" style="background:#fff0f0;border-color:#8b0000;">
        <div style="font-size:13px;font-weight:bold;color:#8b0000;margin-bottom:4px;">
          Запрошенный путь ${this.esc(path)} отсутствует в каталоге Лаборатории Касперского.
        </div>
        <div style="margin-bottom:8px;">
          Возможно, вы искали официальный инсталлятор <b>Setup_AVP.exe</b> или энциклопедию вирусов <b>VirusList</b>.
        </div>
        <button class="avp-btn-red" data-url="http://www.avp.ru">На главную страницу AVP.RU</button>
        <button class="avp-btn-gold" data-url="http://www.avp.ru/store" style="margin-left:6px;">Перейти в Магазин и Центр загрузки AVP 3.0</button>
      </div>
    `;
  }

  render(url) {
    this.state.hits = (Number(this.state.hits) || 0) + 1;
    this.saveState();
    const parsed = this.parseUrl(url);
    const path = parsed.path;
    const params = parsed.params;

    let activeSection = 'home';
    let mainContent = '';

    if (path === '/' || path === '/index.html' || path === '/home') {
      activeSection = 'home';
      mainContent = this.renderHomePage();
    } else if (path === '/store' || path === '/download' || path === '/buy') {
      activeSection = 'store';
      mainContent = this.renderStorePage(params);
    } else if (path === '/order' || path === '/checkout') {
      activeSection = 'store';
      mainContent = this.renderOrderPage();
    } else if (path === '/encyclopedia' || path === '/viruslist') {
      activeSection = 'encyclopedia';
      mainContent = this.renderEncyclopediaPage(params);
    } else if (path === '/lab' || path === '/analyzer' || path === '/scanner') {
      activeSection = 'lab';
      mainContent = this.renderLabPage();
    } else if (path === '/news' || path === '/articles') {
      activeSection = 'news';
      mainContent = this.renderNewsPage(params);
    } else if (path === '/article') {
      activeSection = 'news';
      mainContent = this.renderArticlePage(params);
    } else if (path === '/forum' || path === '/fido') {
      activeSection = 'forum';
      mainContent = this.renderForumPage(params);
    } else if (path === '/thread') {
      activeSection = 'forum';
      mainContent = this.renderThreadPage(params);
    } else if (path === '/about' || path === '/company') {
      activeSection = 'about';
      mainContent = this.renderAboutPage();
    } else {
      activeSection = 'home';
      mainContent = this.renderNotFoundPage(path);
    }

    let fullHtml = `
      <div class="avp-site">
        ${this.renderHeader(activeSection)}
        <table class="avp-layout-table" cellpadding="0" cellspacing="0">
          <tr>
            <td class="avp-sidebar-left">${this.renderLeftSidebar()}</td>
            <td class="avp-main-col">${mainContent}</td>
            <td class="avp-sidebar-right">${this.renderRightSidebar()}</td>
          </tr>
        </table>
        ${this.renderFooter()}
      </div>
    `;

    fullHtml = this.sanitizeBrandText(fullHtml);
    if (this.state.encoding === 'translit') {
      fullHtml = this.toTranslit(fullHtml);
    }
    return fullHtml;
  }

  applyPromoCode(rawCode) {
    const code = String(rawCode || '').trim().toUpperCase();
    this.promoCode = code;
    if (code === 'AVP1998' || code === 'KAMI98' || code === 'WIN98SE' || code === 'FERRUM98') {
      this.promoDiscount = 5.0;
      this.promoMessage = `Купон ${code} активирован! Скидка -$5.00 (цена $19.99)`;
      if (window.soundSys && typeof window.soundSys.playChord === 'function') window.soundSys.playChord();
    } else if (!code) {
      this.promoDiscount = 0;
      this.promoMessage = '';
    } else {
      this.promoDiscount = 0;
      this.promoMessage = 'Неизвестный купон (попробуйте AVP1998 или KAMI98)';
    }
  }

  saveTextToVfs(folderPath, fileName, content) {
    try {
      if (window.vfs) {
        if (typeof window.vfs.WriteFile === 'function') {
          window.vfs.WriteFile(folderPath + '\\' + fileName, content);
          return true;
        }
        if (typeof window.vfs.createFile === 'function') {
          window.vfs.createFile(folderPath, fileName, content);
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  attachEvents(contentEl, win, currentUrl, navigateFn) {
    if (!contentEl) return;
    const rerender = (targetUrl) => {
      if (typeof navigateFn === 'function') {
        navigateFn(targetUrl || currentUrl || 'http://www.avp.ru');
      }
    };

    contentEl.querySelectorAll('.avp-enc-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.state.encoding = btn.getAttribute('data-enc') || 'win1251';
        this.saveState();
        rerender(currentUrl);
      });
    });

    const nextBannerBtn = contentEl.querySelector('#avp-next-banner-btn');
    if (nextBannerBtn) {
      nextBannerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.state.bannerIdx = (this.state.bannerIdx + 1) % window.avpData.banners.length;
        this.saveState();
        rerender(currentUrl);
      });
    }

    const squealBtn = contentEl.querySelector('#avp-squeal-test-btn');
    if (squealBtn) {
      squealBtn.addEventListener('click', () => {
        if (window.soundSys && typeof window.soundSys.playAvpPigSqueal === 'function') {
          window.soundSys.playAvpPigSqueal();
        }
        if (window.dialogs && typeof window.dialogs.alert === 'function') {
          window.dialogs.alert('Внимание! Сработал фирменный звуковой сигнал тревоги Антивируса Касперского AVP 3.0 (Sound Blaster PCM 22kHz)!', 'Тест звуковой тревоги AVP 3.0');
        }
      });
    }

    const launchApp = () => {
      if (window.appAVP && typeof window.appAVP.open === 'function') {
        window.appAVP.open();
      }
    };
    ['#avp-launch-app-btn', '#avp-hero-launch-btn', '#avp-store-launch-btn'].forEach((sel) => {
      const btn = contentEl.querySelector(sel);
      if (btn) btn.addEventListener('click', launchApp);
    });

    const runSetup = () => {
      if (window.gameManager && typeof window.gameManager.openSetupWizard === 'function') {
        window.gameManager.openSetupWizard('avp');
      }
    };
    ['#avp-run-setup-btn', '#avp-hero-setup-btn', '#avp-store-setup-btn'].forEach((sel) => {
      const btn = contentEl.querySelector(sel);
      if (btn) btn.addEventListener('click', runSetup);
    });

    const runDownload = () => {
      if (window.gameManager && typeof window.gameManager.startDownload === 'function') {
        window.gameManager.startDownload('avp');
      }
    };
    ['#avp-download-exe-btn', '#avp-hero-download-btn', '#avp-store-download-btn', '#avp-store-redownload-btn'].forEach((sel) => {
      const btn = contentEl.querySelector(sel);
      if (btn) btn.addEventListener('click', runDownload);
    });

    const applyPromoBtn = contentEl.querySelector('#avp-apply-promo-btn');
    if (applyPromoBtn) {
      applyPromoBtn.addEventListener('click', () => {
        const inp = contentEl.querySelector('#avp-promo-input');
        this.applyPromoCode(inp ? inp.value : '');
        rerender(currentUrl);
      });
    }

    const orderPromoBtn = contentEl.querySelector('#avp-order-promo-btn');
    if (orderPromoBtn) {
      orderPromoBtn.addEventListener('click', () => {
        const inp = contentEl.querySelector('#avp-order-promo-input');
        this.applyPromoCode(inp ? inp.value : '');
        rerender(currentUrl);
      });
    }

    const saveKeyInfoBtn = contentEl.querySelector('#avp-store-save-keyinfo-btn');
    if (saveKeyInfoBtn) {
      saveKeyInfoBtn.addEventListener('click', () => {
        const text = [
          'ЗАО «ЛАБОРАТОРИЯ КАСПЕРСКОГО» — ПРАЙС-ЛИСТ И ПАМЯТКА (ОКТЯБРЬ 1998)',
          '===================================================================',
          'Продукт: Антивирус Касперского AVP 3.0 Platinum Edition',
          'Официальный сервер покупки и загрузки: http://www.avp.ru/store',
          'Дистрибутив: Setup_AVP.exe (6.2 МБ)',
          'Стоимость именной лицензии: $24.99 (купон скидки -$5.00: AVP1998)',
          'Горячая линия вирусной лаборатории: lab@avp.ru, FidoNet 2:5020/400'
        ].join('\r\n');
        this.saveTextToVfs('C:\\My Documents', 'AVP30_License_Info.txt', text);
        if (window.dialogs && typeof window.dialogs.alert === 'function') {
          window.dialogs.alert('Прайс-лист и памятка сохранены в файл C:\\My Documents\\AVP30_License_Info.txt', 'Лаборатория Касперского');
        }
      });
    }

    contentEl.querySelectorAll('.avp-dl-avc-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pkgId = btn.getAttribute('data-avc-id');
        const pkg = window.avpData.avcPackages.find((p) => p.id === pkgId);
        if (!pkg) return;

        if (!this.state.downloadedAvc.includes(pkg.id)) {
          this.state.downloadedAvc.push(pkg.id);
          this.saveState();
        }

        if (window.appAVP && Array.isArray(window.appAVP.virusSignatures) && Array.isArray(pkg.newSignatures)) {
          pkg.newSignatures.forEach((sig) => {
            const exists = window.appAVP.virusSignatures.some((s) => s.name === sig.name);
            if (!exists) {
              window.appAVP.virusSignatures.push({ name: sig.name, pattern: sig.pattern });
            }
          });
        }

        const avcContent = [
          'AVP 3.0 ANTIVIRAL CONTAINER (.AVC)',
          'Package: ' + pkg.filename,
          'Release: ' + pkg.date,
          'Records: ' + pkg.records,
          'Origin : http://www.avp.ru/store'
        ].join('\r\n');
        this.saveTextToVfs('C:\\My Documents\\Downloads', pkg.filename, avcContent);

        if (window.soundSys && typeof window.soundSys.playChord === 'function') {
          window.soundSys.playChord();
        }
        if (window.dialogs && typeof window.dialogs.alert === 'function') {
          window.dialogs.alert(
            `База ${pkg.filename} (${pkg.size}) успешно скачана в C:\\My Documents\\Downloads и подключена к сканеру AVP 3.0!`,
            'Обновление антивирусных баз .AVC'
          );
        }
        rerender(currentUrl);
      });
    });

    const autofillBtn = contentEl.querySelector('#avp-autofill-card-btn');
    if (autofillBtn) {
      autofillBtn.addEventListener('click', () => {
        const numInput = contentEl.querySelector('#avp-pay-num');
        const expInput = contentEl.querySelector('#avp-pay-exp');
        const cvvInput = contentEl.querySelector('#avp-pay-cvv');
        const nameInput = contentEl.querySelector('#avp-pay-name');
        if (numInput) numInput.value = '4276 3800 1998 2024';
        if (expInput) expInput.value = '12/28';
        if (cvvInput) cvvInput.value = '777';
        if (nameInput) nameInput.value = 'RETRO USER';
        const errEl = contentEl.querySelector('#avp-pay-error');
        if (errEl) errEl.style.display = 'none';
      });
    }

    const confirmPayBtn = contentEl.querySelector('#avp-confirm-pay-btn');
    if (confirmPayBtn) {
      confirmPayBtn.addEventListener('click', () => {
        const num = (contentEl.querySelector('#avp-pay-num')?.value || '').replace(/\s+/g, '');
        const exp = (contentEl.querySelector('#avp-pay-exp')?.value || '').trim();
        const cvv = (contentEl.querySelector('#avp-pay-cvv')?.value || '').trim();
        const name = (contentEl.querySelector('#avp-pay-name')?.value || '').trim();
        const errEl = contentEl.querySelector('#avp-pay-error');

        const showErr = (msg) => {
          if (errEl) {
            errEl.textContent = msg;
            errEl.style.display = 'block';
          }
          if (window.soundSys && typeof window.soundSys.playError === 'function') {
            window.soundSys.playError();
          }
        };

        if (!/^\d{16}$/.test(num)) {
          showErr('Ошибка процессинга: введите 16 цифр номера карты (или нажмите «Вставить из файла»).');
          return;
        }
        if (!/^\d{2}\/\d{2}$/.test(exp)) {
          showErr('Ошибка процессинга: укажите срок действия карты в формате ММ/ГГ.');
          return;
        }
        if (!/^\d{3}$/.test(cvv)) {
          showErr('Ошибка процессинга: укажите 3-значный код безопасности CVV2.');
          return;
        }
        if (name.length < 2) {
          showErr('Ошибка процессинга: укажите имя владельца карты.');
          return;
        }

        const avp = this.getAvpGameState();
        if (window.gameManager && typeof window.gameManager.purchaseGame === 'function') {
          window.gameManager.purchaseGame('avp', avp.finalPrice, '$' + avp.finalPrice.toFixed(2));
        }
        this.saveTextToVfs(
          'C:\\My Documents',
          'AVP.KEY',
          'AVP 3.0 REGISTERED KEY FILE\r\nOwner: ' + name + '\r\nKey: AVP03-1998-KAMI-7788\r\nServer: http://www.avp.ru\r\n'
        );
        rerender('http://www.avp.ru/store?purchased=1');
      });
    }

    const pollBtn = contentEl.querySelector('#avp-poll-vote-btn');
    if (pollBtn) {
      pollBtn.addEventListener('click', () => {
        const checked = contentEl.querySelector('input[name="avp_poll_opt"]:checked');
        if (!checked) return;
        const val = checked.value;
        this.state.pollVoted = val;
        this.state.pollVotes[val] = (Number(this.state.pollVotes[val]) || 0) + 1;
        this.saveState();
        rerender(currentUrl);
      });
    }

    const encSearchBtn = contentEl.querySelector('#avp-enc-search-btn');
    if (encSearchBtn) {
      encSearchBtn.addEventListener('click', () => {
        const inp = contentEl.querySelector('#avp-enc-search-input');
        this.encyclopediaQuery = inp ? inp.value : '';
        rerender('http://www.avp.ru/encyclopedia');
      });
    }

    const encFilterSel = contentEl.querySelector('#avp-enc-filter-select');
    if (encFilterSel) {
      encFilterSel.addEventListener('change', () => {
        this.encyclopediaFilter = encFilterSel.value || 'all';
        rerender('http://www.avp.ru/encyclopedia');
      });
    }

    contentEl.querySelectorAll('.avp-select-virus-link').forEach((lnk) => {
      lnk.addEventListener('click', (e) => {
        e.preventDefault();
        const vid = lnk.getAttribute('data-virus-id');
        if (vid) {
          this.activeEncyclopediaId = vid;
          rerender('http://www.avp.ru/encyclopedia?id=' + encodeURIComponent(vid));
        }
      });
    });

    const expVirusNotepad = contentEl.querySelector('#avp-export-virus-notepad-btn');
    if (expVirusNotepad) {
      expVirusNotepad.addEventListener('click', () => {
        const vid = expVirusNotepad.getAttribute('data-virus-id');
        const v = window.avpData.virusEncyclopedia.find((x) => x.id === vid) || window.avpData.virusEncyclopedia[0];
        const txt = [
          'ДОСЬЕ ВИРУСНОЙ ЭНЦИКЛОПЕДИИ AVP (VIRUSLIST 98)',
          '==============================================',
          'Штамм     : ' + v.name,
          'Семейство : ' + v.family,
          'Опасность : ' + v.danger,
          'Объекты   : ' + v.targets,
          '',
          'ОПИСАНИЕ:',
          v.summary,
          '',
          'КАРТА ПЕРЕХВАТОВ:',
          v.memoryMap,
          '',
          'HEX-ДАМП СИГНАТУРЫ:',
          v.hexDump,
          '',
          'ЛЕЧЕНИЕ В AVP 3.0:',
          v.cureMethod
        ].join('\r\n');
        if (window.appNotepad && typeof window.appNotepad.open === 'function') {
          window.appNotepad.open(v.id + '.txt', txt);
        }
      });
    }

    const saveVirusVfs = contentEl.querySelector('#avp-save-virus-vfs-btn');
    if (saveVirusVfs) {
      saveVirusVfs.addEventListener('click', () => {
        const vid = saveVirusVfs.getAttribute('data-virus-id');
        const v = window.avpData.virusEncyclopedia.find((x) => x.id === vid) || window.avpData.virusEncyclopedia[0];
        const fileName = 'VirusList_' + v.id.replace(/[^a-zA-Z0-9._-]/g, '_') + '.txt';
        const txt = v.name + '\r\n' + v.summary + '\r\nЛечение: ' + v.cureMethod;
        this.saveTextToVfs('C:\\My Documents', fileName, txt);
        if (window.dialogs && typeof window.dialogs.alert === 'function') {
          window.dialogs.alert('Карточка штамма сохранена в C:\\My Documents\\' + fileName, 'VirusList 98');
        }
      });
    }

    const sampleSel = contentEl.querySelector('#avp-lab-sample-select');
    if (sampleSel) {
      sampleSel.addEventListener('change', () => {
        const smp = window.avpData.heuristicSamples.find((s) => s.id === sampleSel.value);
        if (smp) {
          this.labState.sampleId = smp.id;
          this.labState.ring0 = smp.flags.ring0;
          this.labState.biosPort = smp.flags.biosPort;
          this.labState.normalDot = smp.flags.normalDot;
          this.labState.wsockHook = smp.flags.wsockHook;
          this.labState.polyXor = smp.flags.polyXor;
          this.labState.lastReport = this.computeHeuristicVerdict();
          rerender('http://www.avp.ru/lab');
        }
      });
    }

    const runEmulBtn = contentEl.querySelector('#avp-run-emulation-btn');
    if (runEmulBtn) {
      runEmulBtn.addEventListener('click', () => {
        this.labState.ring0 = !!contentEl.querySelector('#avp-flag-ring0')?.checked;
        this.labState.biosPort = !!contentEl.querySelector('#avp-flag-bios')?.checked;
        this.labState.normalDot = !!contentEl.querySelector('#avp-flag-macro')?.checked;
        this.labState.wsockHook = !!contentEl.querySelector('#avp-flag-wsock')?.checked;
        this.labState.polyXor = !!contentEl.querySelector('#avp-flag-poly')?.checked;
        const rep = this.computeHeuristicVerdict();
        this.labState.lastReport = rep;
        if (rep.score >= 30 && window.soundSys && typeof window.soundSys.playAvpPigSqueal === 'function') {
          window.soundSys.playAvpPigSqueal();
        }
        rerender('http://www.avp.ru/lab');
      });
    }

    const expLabBtn = contentEl.querySelector('#avp-export-lab-notepad-btn');
    if (expLabBtn) {
      expLabBtn.addEventListener('click', () => {
        const term = contentEl.querySelector('#avp-lab-terminal');
        const txt = term ? term.textContent : 'AVP CodeAnalyzer Report';
        if (window.appNotepad && typeof window.appNotepad.open === 'function') {
          window.appNotepad.open('CodeAnalyzer_Report.txt', txt);
        }
      });
    }

    const webScanRunBtn = contentEl.querySelector('#avp-webscan-run-btn');
    if (webScanRunBtn) {
      webScanRunBtn.addEventListener('click', () => {
        const iconEl = document.querySelector('.desktop-icon[data-app="totally_not_a_virus"]');
        const vfsHasTrojan =
          window.vfs &&
          typeof window.vfs.Exists === 'function' &&
          window.vfs.Exists('C:\\WINDOWS\\Desktop\\totally_not_a_virus.exe');

        if (iconEl || vfsHasTrojan) {
          if (window.soundSys && typeof window.soundSys.playAvpPigSqueal === 'function') {
            window.soundSys.playAvpPigSqueal();
          }
          this.labState.webScanReport =
            '[ТРЕВОГА AVP WEB-INSPECTOR!]\nОбнаружен опасный троянский файл: C:\\Desktop\\totally_not_a_virus.exe\nСигнатура: Trojan.Win98.TotallyNotAVirus\nНажмите кнопку «Обезвредить найденный троян (Лечить)» или запустите установленный сканер AVP 3.0!';
        } else {
          this.labState.webScanReport =
            '[ПРОВЕРКА ЗАВЕРШЕНА]\nСектор MBR: Чист\nПамять: Чисто\nРабочий стол: Троян totally_not_a_virus.exe не обнаружен (система чиста).';
        }
        rerender('http://www.avp.ru/lab');
      });
    }

    const webScanCureBtn = contentEl.querySelector('#avp-webscan-cure-btn');
    if (webScanCureBtn) {
      webScanCureBtn.addEventListener('click', () => {
        let cured = false;
        const iconEl = document.querySelector('.desktop-icon[data-app="totally_not_a_virus"]');
        if (iconEl) {
          iconEl.remove();
          cured = true;
        }
        try {
          if (window.vfs && typeof window.vfs.Delete === 'function' && window.vfs.Exists('C:\\WINDOWS\\Desktop\\totally_not_a_virus.exe')) {
            window.vfs.Delete('C:\\WINDOWS\\Desktop\\totally_not_a_virus.exe');
            cured = true;
          }
        } catch (e) {}

        if (cured) {
          if (window.soundSys && typeof window.soundSys.playChord === 'function') window.soundSys.playChord();
          this.labState.webScanReport =
            '[УСПЕШНОЕ ЛЕЧЕНИЕ!]\nТроянская программа Trojan.Win98.TotallyNotAVirus (totally_not_a_virus.exe) полностью удалена с Рабочего стола и из файловой системы!';
        } else {
          this.labState.webScanReport =
            '[ОТЧЁТ ЛЕЧЕНИЯ]\nАктивных копий totally_not_a_virus.exe на Рабочем столе не найдено. Для полной проверки всех папок используйте стационарный AVP 3.0.';
        }
        rerender('http://www.avp.ru/lab');
      });
    }

    const artNotepadBtn = contentEl.querySelector('#avp-article-notepad-btn');
    if (artNotepadBtn) {
      artNotepadBtn.addEventListener('click', () => {
        const aid = artNotepadBtn.getAttribute('data-art-id');
        const art = window.avpData.articles.find((a) => a.id === aid) || window.avpData.articles[0];
        const text = art.title + '\r\nАвтор: ' + art.author + '\r\n\r\n' + art.body.join('\r\n\r\n') + '\r\n\r\n' + art.protocolSummary;
        if (window.appNotepad && typeof window.appNotepad.open === 'function') {
          window.appNotepad.open(art.id + '.txt', text);
        }
      });
    }

    const artSaveBtn = contentEl.querySelector('#avp-article-save-vfs-btn');
    if (artSaveBtn) {
      artSaveBtn.addEventListener('click', () => {
        const aid = artSaveBtn.getAttribute('data-art-id');
        const art = window.avpData.articles.find((a) => a.id === aid) || window.avpData.articles[0];
        const fileName = 'AVP_Article_' + art.id + '.txt';
        const text = art.title + '\r\n' + art.body.join('\r\n\r\n');
        this.saveTextToVfs('C:\\My Documents', fileName, text);
        if (window.dialogs && typeof window.dialogs.alert === 'function') {
          window.dialogs.alert('Статья сохранена в файл C:\\My Documents\\' + fileName, 'Лаборатория Касперского');
        }
      });
    }

    const commentSubmitBtn = contentEl.querySelector('#avp-comment-submit-btn');
    if (commentSubmitBtn) {
      commentSubmitBtn.addEventListener('click', () => {
        const aid = commentSubmitBtn.getAttribute('data-art-id') || 'cih-anatomy';
        const authorRaw = (contentEl.querySelector('#avp-comment-author')?.value || '').trim() || 'Читатель AVP.RU';
        const textRaw = (contentEl.querySelector('#avp-comment-text')?.value || '').trim();
        if (!textRaw) return;

        if (!this.state.articleComments[aid]) this.state.articleComments[aid] = [];
        this.state.articleComments[aid].push({
          author: this.sanitizeBrandText(authorRaw),
          date: '21.10.1998',
          text: this.sanitizeBrandText(textRaw)
        });
        this.state.articleComments[aid].push({
          author: 'AVP_Duty_Analyst (Дежурный вирусный аналитик)',
          date: '21.10.1998 (Автоответ лаборатории)',
          text: 'Благодарим за обращение! Ваше наблюдение занесено в журнал дежурной смены Лаборатории Касперского. Рекомендуем обновить базу DAILY.AVC в разделе «Магазин и Загрузка».'
        });
        this.saveState();
        rerender('http://www.avp.ru/article?id=' + encodeURIComponent(aid));
      });
    }

    const newThreadBtn = contentEl.querySelector('#avp-newthread-submit-btn');
    if (newThreadBtn) {
      newThreadBtn.addEventListener('click', () => {
        const author = (contentEl.querySelector('#avp-newthread-author')?.value || '').trim() || 'SysOp (2:5020/999)';
        const cat = contentEl.querySelector('#avp-newthread-cat')?.value || 'epidemics';
        const title = (contentEl.querySelector('#avp-newthread-title')?.value || '').trim();
        const text = (contentEl.querySelector('#avp-newthread-text')?.value || '').trim();
        if (!title || !text) return;

        const catNames = {
          epidemics: 'Скорая помощь (SOS)',
          license: 'Лицензии и покупка AVP',
          cure: 'Лечение сложных вирусов'
        };
        const newId = 'fido-user-' + Date.now();
        this.state.customThreads.unshift({
          id: newId,
          cat,
          catName: catNames[cat] || 'Скорая помощь (SOS)',
          title: this.sanitizeBrandText(title),
          author: this.sanitizeBrandText(author),
          date: '21 Окт 1998',
          views: 1,
          posts: [
            {
              author: this.sanitizeBrandText(author),
              role: 'Участник эхоконференции RU.ANTIVIRUS',
              date: '21 Окт 1998',
              text: this.sanitizeBrandText(text)
            },
            {
              author: 'Eugene_Kaspersky (2:5020/400.1)',
              role: 'Руководитель Лаборатории Касперского',
              date: '21 Окт 1998',
              text: 'Сообщение принято узлом 2:5020/400! Если подозреваете заражение новым штаммом — проверьте файл на нашем стенде CodeAnalyzer (www.avp.ru/lab) и обновите базу DAILY.AVC.'
            }
          ]
        });
        this.saveState();
        rerender('http://www.avp.ru/thread?id=' + encodeURIComponent(newId));
      });
    }

    const replyBtn = contentEl.querySelector('#avp-reply-submit-btn');
    if (replyBtn) {
      replyBtn.addEventListener('click', () => {
        const tid = replyBtn.getAttribute('data-thread-id');
        const author = (contentEl.querySelector('#avp-reply-author')?.value || '').trim() || 'Reader (2:5020/777)';
        const text = (contentEl.querySelector('#avp-reply-text')?.value || '').trim();
        if (!tid || !text) return;

        if (!this.state.threadReplies[tid]) this.state.threadReplies[tid] = [];
        this.state.threadReplies[tid].push({
          author: this.sanitizeBrandText(author),
          role: 'Участник конференции RU.ANTIVIRUS',
          date: '21 Окт 1998',
          text: this.sanitizeBrandText(text)
        });
        this.saveState();
        rerender('http://www.avp.ru/thread?id=' + encodeURIComponent(tid));
      });
    }
  }
}

window.avpSite = new AvpSite();
