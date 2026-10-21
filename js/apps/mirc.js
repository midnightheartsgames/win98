class AppMIRC {
  constructor() {
    this.windowId = 'win-mirc';
    this.connected = true;
    this.server = 'irc.rinet.ru:6669';
    this.nick = 'User98';
    this.altNick = 'User98_RUS';
    this.realName = 'Microslop Win 98 SE User';
    this.activeTab = '#win98';
    this.selectedNick = null;
    this.selectedColor = '#000000';
    this.ambientTimer = null;
    this.unreadTabs = new Set();

    this.colors = [
      { code: '01', hex: '#000000', name: 'Black' },
      { code: '02', hex: '#000080', name: 'Navy' },
      { code: '03', hex: '#008000', name: 'Green' },
      { code: '04', hex: '#b80000', name: 'Red' },
      { code: '05', hex: '#804000', name: 'Brown' },
      { code: '06', hex: '#800080', name: 'Purple' },
      { code: '07', hex: '#d06800', name: 'Orange' },
      { code: '10', hex: '#006868', name: 'Teal' },
      { code: '12', hex: '#0000d0', name: 'Blue' },
      { code: '13', hex: '#b000b0', name: 'Magenta' }
    ];

    this.whoisProfiles = {
      'ChanServ': { host: 'services@rusnet.irc.ru', info: 'RusNet Channel Registration Service', channels: '#win98 #igromania #ru.anekdot #quake2', server: 'irc.rinet.ru (Cronyx Plus Moscow)' },
      'SysOp_98': { host: 'root@dialup-195-2-72.ropnet.ru', info: 'FidoNet 2:5020/400 | Microslop Win 98 SE Admin', channels: '@#win98 +#quake2', server: 'irc.rinet.ru (Moscow Backbone)' },
      'Lexx_3dfx': { host: 'lexx@ppp14.cityline.ru', info: 'Pentium II 350MHz / Diamond Monster 3D II SLI', channels: '@#win98 #quake2', server: 'irc.ptt.ru (Peterlink SPb)' },
      'ClippyBot': { host: 'agent@office98.microslop.com', info: 'Похоже, вы пишете в IRC! Нужна помощь?', channels: '+#win98', server: 'irc.rinet.ru' },
      'IgromanBot': { host: 'cdrom@igromania.ru', info: 'Журнал Игромания №9 (1998) — Коды и прохождения', channels: '@#igromania', server: 'irc.rinet.ru' },
      'VernerBot': { host: 'verner@anekdot.ru', info: 'Свежие анекдоты из России — Выпуск 1998', channels: '@#ru.anekdot', server: 'irc.rinet.ru' },
      'RailMaster': { host: 'rail@ctf.demoscene.ru', info: 'Quake II Railgunner | Fov 110 | Sens 4.5', channels: '@#quake2', server: 'irc.efnet.org' }
    };

    this.jokes = [
      'Звонок в техподдержку провайдера в 3 часа ночи: — Алло! У меня Интернет не скачивается! — А модем мигает? — Сейчас спичку зажгу, посмотрю...',
      'Встречаются два программиста в 1998 году: — Слышал, вышла новая бета Microslop Win 98 SE? — Ага, теперь синий экран смерти поддерживает 32-битный цвет и звук Sound Blaster!',
      'Штирлиц всю ночь качал файл по модему 14400 бод. На 99% в трубке сказали: «Межгород, закругляйтесь!». Штирлиц еще никогда не был так близок к провалу.',
      'Купил новый жесткий диск на 4.3 Гигабайта. Сижу и думаю: чем же его можно заполнить до конца жизни?!',
      'Объявление в газете «Из рук в руки»: Меняю двухкомнатную квартиру в Бутово на две планки Voodoo2 12MB SLI и лицензионный бокс StarCraft.'
    ];

    this.jokeIndex = 0;

    this.tabs = {
      'Status': {
        type: 'status',
        topic: 'mIRC32 v5.41 K.Mardam-Bey — RusNet IRC Network (KOI8-R / Win-1251)',
        nicks: [],
        lines: [
          { type: 'system', text: '*** Welcome to mIRC32 v5.41 (32-bit) for Microslop Win 98' },
          { type: 'system', text: '*** Connecting to irc.rinet.ru (6669) [Win-1251 Cyrl]...' },
          { type: 'system', text: ':irc.rinet.ru 001 User98 :Welcome to the RusNet IRC Network User98!~user98@ppp-42.aha.ru' },
          { type: 'system', text: ':irc.rinet.ru 375 User98 :- irc.rinet.ru Message of the Day -' },
          { type: 'notice', text: '-MOTD- Добро пожаловать на московский узел сети RusNet (1998)!' },
          { type: 'notice', text: '-MOTD- Кодировка порта 6669: Win-1251. Основные каналы: #win98, #igromania, #ru.anekdot, #quake2' },
          { type: 'system', text: ':irc.rinet.ru 376 User98 :End of /MOTD command.' }
        ]
      },
      '#win98': {
        type: 'channel',
        topic: '[RusNet #win98] Microslop Win 98 SE Build 2222A | Драйвера Voodoo2 | Пингуем провайдера | Без флуда!',
        nicks: ['@ChanServ', '@SysOp_98', '@Lexx_3dfx', '+ClippyBot', '+Katya_SPb', 'Dimon_P200', 'Vovan_Modem', 'K0d3r_ASM'],
        lines: [
          { type: 'system', text: '*** Now talking in #win98' },
          { type: 'system', text: '*** Topic is \'[RusNet #win98] Microslop Win 98 SE Build 2222A | Драйвера Voodoo2 | Пингуем провайдера | Без флуда!\'' },
          { type: 'chat', nick: '@Lexx_3dfx', color: '#000080', text: 'Народ, кто ставил свежие драйвера Glide 2.51 под Microslop Win 98? В Quake II прирост +12 fps!' },
          { type: 'chat', nick: 'Vovan_Modem', color: '#000000', text: 'У меня USRobotics Sportster 33.6 сегодня на 31200 законектился с первого раза, праздник!' },
          { type: 'chat', nick: '+Katya_SPb', color: '#800080', text: 'Всем привет из Питера :) Кто-нибудь качал новый скин для Winamp 1.92?' },
          { type: 'chat', nick: '+ClippyBot', color: '#006868', text: 'Подсказка: введите /slap Vovan_Modem или /whois Lexx_3dfx для проверки команд mIRC!' }
        ]
      },
      '#igromania': {
        type: 'channel',
        topic: '*** Официальный канал журнала ИГРОМАНИЯ (CD №9 \'1998) | Прохождения Fallout 2, Quake II, StarCraft, Half-Life ***',
        nicks: ['@IgromanBot', '@FX_Lover', '+Gordon_98', '+Kerrigan_RU', 'Sniper_Q2', 'Vault13_Boy', 'Max_Payne_Wait'],
        lines: [
          { type: 'system', text: '*** Now talking in #igromania' },
          { type: 'chat', nick: '@IgromanBot', color: '#008000', text: 'Добро пожаловать на #igromania! Спрашивайте про секреты Quake II, StarCraft, Fallout или софт с компакт-диска №9!' },
          { type: 'chat', nick: 'Vault13_Boy', color: '#804000', text: 'Кто нашел Водяной Чип в Некрополисе без драки с супермутантами?' },
          { type: 'chat', nick: '+Kerrigan_RU', color: '#b000b0', text: 'В StarCraft за зергов раш 6-pool вообще контрится протоссами или нет?!' }
        ]
      },
      '#ru.anekdot': {
        type: 'channel',
        topic: 'Свежие анекдоты с anekdot.ru (Дима Вернер) | Напиши !анекдот или !anek для новой истории',
        nicks: ['@VernerBot', '@Ostap_98', '+Shutnik_Msk', 'Stirlitz_45', 'Chapaev_2', 'Student_MGU'],
        lines: [
          { type: 'system', text: '*** Now talking in #ru.anekdot' },
          { type: 'chat', nick: '@VernerBot', color: '#008000', text: 'Выпуск свежих анекдотов 1998 года открыт! Напишите !анекдот в чат или нажмите кнопку на панели.' },
          { type: 'chat', nick: 'Stirlitz_45', color: '#000080', text: 'Штирлиц шел по коридору РСХА и вдруг заметил, что за ним тянется кабель коаксиальной сети BNC 10Base2.' }
        ]
      },
      '#quake2': {
        type: 'channel',
        topic: 'Quake II CTF & Railgun Arena | Сервер: 195.2.72.10:27910 | +mlook обязателен!',
        nicks: ['@RailMaster', '@Thresh_Clone', '+Bitterman', 'TankJr_3dfx', 'Strogg_Slayer', 'RocketJump98'],
        lines: [
          { type: 'system', text: '*** Now talking in #quake2' },
          { type: 'chat', nick: '@RailMaster', color: '#b80000', text: 'Заходите на Q2DM1 The Edge! Кто дуэль 1х1 на рейлганах?' },
          { type: 'action', text: '* RocketJump98 делает двойной рокет-джамп за MegaHealth на Q2DM1' }
        ]
      }
    };
  }

  open() {
    this.winId = this.windowId;
    if (window.winManager && window.winManager.windows.has(this.windowId)) {
      const existing = window.winManager.windows.get(this.windowId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.windowId);
      else window.winManager.bringToTop(this.windowId);
      this.renderAll();
      return existing;
    }

    const content = `
      <div class="mirc-shell" id="${this.windowId}-shell">
        <div class="win-menubar">
          <div class="win-menu-item" onclick="window.appMIRC.openOptionsModal()"><u>F</u>ile</div>
          <div class="win-menu-item" onclick="window.appMIRC.switchTab('Status')"><u>V</u>iew</div>
          <div class="win-menu-item" onclick="window.appMIRC.promptJoinChannel()"><u>C</u>hannels</div>
          <div class="win-menu-item" onclick="window.appMIRC.slapSelected()"><u>C</u>ommands</div>
          <div class="win-menu-item" onclick="window.appMIRC.showAbout()"><u>H</u>elp</div>
        </div>

        <div class="mirc-toolbar">
          <button class="mirc-tb-btn" id="mirc-btn-connect" onclick="window.appMIRC.toggleConnect()">⚡ Отключиться</button>
          <button class="mirc-tb-btn" id="mirc-btn-options" onclick="window.appMIRC.openOptionsModal()">⚙️ Сервер / Ник</button>
          <div class="mirc-tb-sep"></div>
          <button class="mirc-tb-btn" id="mirc-btn-join" onclick="window.appMIRC.promptJoinChannel()">#️⃣ Вход на канал</button>
          <button class="mirc-tb-btn" id="mirc-btn-whois" onclick="window.appMIRC.whoisSelected()">🔍 Whois</button>
          <button class="mirc-tb-btn" id="mirc-btn-slap" onclick="window.appMIRC.slapSelected()">🐟 Slap форелью!</button>
          <button class="mirc-tb-btn" id="mirc-btn-anek" onclick="window.appMIRC.postJoke()">😄 !анекдот</button>
          <div class="mirc-tb-sep"></div>
          <button class="mirc-tb-btn" id="mirc-btn-clear" onclick="window.appMIRC.executeCommand('/clear')">🧹 Очистить</button>
        </div>

        <div class="mirc-switchbar" id="mirc-switchbar"></div>

        <div class="mirc-topic-bar">
          <span style="font-weight:bold;">Topic:</span>
          <input type="text" class="mirc-topic-input" id="mirc-topic-input" value="" onkeydown="if(event.key==='Enter') window.appMIRC.updateTopicFromInput()" />
        </div>

        <div class="mirc-mdi-body" id="mirc-mdi-body">
          <div class="mirc-chat-pane" id="mirc-chat-pane"></div>
          <div class="mirc-nick-pane" id="mirc-nick-pane">
            <div class="mirc-nick-header" id="mirc-nick-count">0 users</div>
            <div class="mirc-nick-list" id="mirc-nick-list"></div>
            <div class="mirc-nick-actions">
              <button class="mirc-tb-btn" onclick="window.appMIRC.whoisSelected()">Whois</button>
              <button class="mirc-tb-btn" onclick="window.appMIRC.slapSelected()">Slap</button>
            </div>
          </div>
        </div>

        <div class="mirc-bottom-bar">
          <div class="mirc-color-strip" id="mirc-color-strip"></div>
          <div class="mirc-input-row">
            <input type="text" class="mirc-cmd-input" id="mirc-cmd-input" placeholder="Введите сообщение или команду (/join #канал, /me, /slap, /whois, /nick, !анекдот)..." onkeydown="if(event.key==='Enter') window.appMIRC.submitInput()" />
            <button class="mirc-tb-btn" id="mirc-btn-send" onclick="window.appMIRC.submitInput()">Отправить</button>
          </div>
        </div>

        <div class="mirc-modal-backdrop" id="mirc-options-modal">
          <div class="mirc-modal">
            <div class="mirc-modal-titlebar">
              <span>mIRC Options — IRC Servers & Identification</span>
              <button class="mirc-tb-btn" style="height:16px;padding:0 4px;" onclick="window.appMIRC.closeOptionsModal()">✕</button>
            </div>
            <div class="mirc-modal-body">
              <div class="mirc-form-grid">
                <label>IRC Server:</label>
                <select id="mirc-opt-server" style="height:21px;font-size:11px;">
                  <option value="irc.rinet.ru:6669">RusNet: Москва (irc.rinet.ru:6669)</option>
                  <option value="irc.ptt.ru:6667">RusNet: С.-Петербург (irc.ptt.ru:6667)</option>
                  <option value="irc.dal.net:6667">DALnet: US-East (irc.dal.net:6667)</option>
                  <option value="irc.efnet.org:6667">EFnet: Demoscene Hub (irc.efnet.org:6667)</option>
                </select>
                <label>Full Name:</label>
                <input type="text" id="mirc-opt-realname" value="${this.escapeAttr(this.realName)}" style="height:20px;font-size:11px;padding:1px 4px;" />
                <label>Nickname:</label>
                <input type="text" id="mirc-opt-nick" value="${this.escapeAttr(this.nick)}" style="height:20px;font-size:11px;padding:1px 4px;" />
                <label>Alternative:</label>
                <input type="text" id="mirc-opt-altnick" value="${this.escapeAttr(this.altNick)}" style="height:20px;font-size:11px;padding:1px 4px;" />
              </div>
              <div class="mirc-modal-footer">
                <button class="mirc-tb-btn" id="mirc-opt-save" onclick="window.appMIRC.saveOptionsAndConnect()">Connect to IRC Server</button>
                <button class="mirc-tb-btn" onclick="window.appMIRC.closeOptionsModal()">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <div class="status-bar">
          <div class="status-bar-field" id="mirc-status-left">Connected to ${this.server} as ${this.nick} [Lag: 142ms]</div>
          <div class="status-bar-field" id="mirc-status-right" style="flex:0 0 185px;">Mode: +i | Кодировка: Win-1251</div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.windowId,
      title: `mIRC32 - [${this.activeTab} (${this.nick} on ${this.server})]`,
      icon: 'mirc',
      width: 680,
      height: 470,
      minWidth: 520,
      minHeight: 360,
      content,
      onClose: () => this.stopAmbientChatter()
    });

    this.renderColorStrip();
    this.renderAll();
    this.startAmbientChatter();
    return win;
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  escapeAttr(str) {
    return this.escapeHtml(str).replace(/"/g, '&quot;');
  }

  stripPrefix(nick) {
    return String(nick || '').replace(/^[@+]/, '');
  }

  getFormattedNickInChannel(tabObj) {
    if (!tabObj || tabObj.type !== 'channel') return [];
    const list = [...tabObj.nicks];
    const cleanSelf = this.stripPrefix(this.nick);
    if (!list.some((n) => this.stripPrefix(n).toLowerCase() === cleanSelf.toLowerCase())) {
      list.push(cleanSelf);
    }
    return list.sort((a, b) => {
      const rank = (x) => (x.startsWith('@') ? 0 : x.startsWith('+') ? 1 : 2);
      const rDiff = rank(a) - rank(b);
      if (rDiff !== 0) return rDiff;
      return this.stripPrefix(a).localeCompare(this.stripPrefix(b));
    });
  }

  renderColorStrip() {
    const strip = document.getElementById('mirc-color-strip');
    if (!strip) return;
    strip.innerHTML = `<span style="font-size:10px;color:#404040;">Ctrl+K Цвет текста:</span>` +
      this.colors.map((c) => `
        <div class="mirc-color-swatch ${this.selectedColor === c.hex ? 'selected' : ''}"
             style="background:${c.hex};"
             title="mIRC Color ${c.code} (${c.name})"
             onclick="window.appMIRC.selectColor('${c.hex}')"></div>
      `).join('');
  }

  selectColor(hex) {
    this.selectedColor = hex;
    this.renderColorStrip();
    const input = document.getElementById('mirc-cmd-input');
    if (input) input.focus();
  }

  renderAll() {
    this.renderSwitchbar();
    this.renderActiveTab();
    this.updateTitleAndStatus();
  }

  renderSwitchbar() {
    const bar = document.getElementById('mirc-switchbar');
    if (!bar) return;
    const keys = Object.keys(this.tabs);
    bar.innerHTML = keys.map((key) => {
      const isActive = key === this.activeTab;
      const isUnread = this.unreadTabs.has(key) && !isActive;
      const icon = key === 'Status' ? '🖥️' : '#';
      const label = key === 'Status' ? 'Status' : key.replace(/^#/, '');
      return `
        <button class="mirc-tab-btn ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}"
                data-tab="${this.escapeAttr(key)}"
                onclick="window.appMIRC.switchTab('${this.escapeAttr(key)}')">
          <span>${icon}</span>
          <span>${this.escapeHtml(label)}</span>
        </button>
      `;
    }).join('');
  }

  renderActiveTab() {
    const tab = this.tabs[this.activeTab] || this.tabs['Status'];
    if (!tab) return;

    const topicInput = document.getElementById('mirc-topic-input');
    if (topicInput) {
      topicInput.value = tab.topic || '';
      topicInput.readOnly = tab.type === 'status';
    }

    const mdiBody = document.getElementById('mirc-mdi-body');
    if (mdiBody) {
      mdiBody.classList.toggle('status-mode', tab.type === 'status');
    }

    const chatPane = document.getElementById('mirc-chat-pane');
    if (chatPane) {
      chatPane.innerHTML = tab.lines.map((line) => {
        if (line.type === 'system') {
          return `<div class="mirc-line mirc-line-system">${this.escapeHtml(line.text)}</div>`;
        }
        if (line.type === 'action') {
          return `<div class="mirc-line mirc-line-action">${this.escapeHtml(line.text)}</div>`;
        }
        if (line.type === 'notice') {
          return `<div class="mirc-line mirc-line-notice">${this.escapeHtml(line.text)}</div>`;
        }
        if (line.type === 'whois') {
          return `<div class="mirc-line mirc-line-whois">${this.escapeHtml(line.text)}</div>`;
        }
        const nickColor = line.nick && line.nick.startsWith('@') ? '#000080' : '#404040';
        const textColor = line.color || '#000000';
        return `<div class="mirc-line"><strong style="color:${nickColor};">&lt;${this.escapeHtml(line.nick)}&gt;</strong> <span style="color:${textColor};">${this.escapeHtml(line.text)}</span></div>`;
      }).join('');
      chatPane.scrollTop = chatPane.scrollHeight;
    }

    if (tab.type === 'channel') {
      const nicks = this.getFormattedNickInChannel(tab);
      const countEl = document.getElementById('mirc-nick-count');
      if (countEl) countEl.textContent = `${nicks.length} users`;

      const listEl = document.getElementById('mirc-nick-list');
      if (listEl) {
        if (!this.selectedNick || !nicks.includes(this.selectedNick)) {
          this.selectedNick = nicks[0] || null;
        }
        listEl.innerHTML = nicks.map((n) => `
          <div class="mirc-nick-item ${this.selectedNick === n ? 'selected' : ''}"
               onclick="window.appMIRC.selectNick('${this.escapeAttr(n)}')"
               ondblclick="window.appMIRC.whoisNick('${this.escapeAttr(n)}')">${this.escapeHtml(n)}</div>
        `).join('');
      }
    }
  }

  updateTitleAndStatus() {
    const newTitle = `mIRC32 - [${this.activeTab} (${this.nick} on ${this.connected ? this.server : 'Disconnected'})]`;
    if (window.winManager && typeof window.winManager.setTitle === 'function') {
      window.winManager.setTitle(this.windowId, newTitle);
    }
    const connectBtn = document.getElementById('mirc-btn-connect');
    if (connectBtn) {
      connectBtn.textContent = this.connected ? '⚡ Отключиться' : '⚡ Подключиться';
    }
    const statusLeft = document.getElementById('mirc-status-left');
    if (statusLeft) {
      statusLeft.textContent = this.connected
        ? `Connected to ${this.server} as ${this.nick} [Lag: 142ms]`
        : `Not connected (нажмите «Подключиться» или выберите сервер)`;
    }
  }

  switchTab(tabName) {
    if (!this.tabs[tabName]) return;
    this.activeTab = tabName;
    this.unreadTabs.delete(tabName);
    this.renderAll();
  }

  selectNick(nick) {
    this.selectedNick = nick;
    this.renderActiveTab();
  }

  appendLine(tabName, lineObj) {
    const tab = this.tabs[tabName];
    if (!tab) return;
    tab.lines.push(lineObj);
    if (tabName !== this.activeTab) {
      this.unreadTabs.add(tabName);
      this.renderSwitchbar();
    } else {
      this.renderActiveTab();
    }
  }

  submitInput() {
    const input = document.getElementById('mirc-cmd-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    input.value = '';
    this.executeCommand(val);
  }

  executeCommand(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return;

    if (text.startsWith('/')) {
      const parts = text.slice(1).split(/\s+/);
      const cmd = (parts[0] || '').toLowerCase();
      const rest = text.slice(1 + cmd.length).trim();

      if (cmd === 'join' || cmd === 'j') {
        let chan = rest.split(/\s+/)[0] || '#demoscene';
        if (!chan.startsWith('#')) chan = '#' + chan;
        this.joinChannel(chan);
        return;
      }

      if (cmd === 'part' || cmd === 'leave') {
        const target = rest || this.activeTab;
        if (target !== 'Status' && this.tabs[target]) {
          delete this.tabs[target];
          this.activeTab = Object.keys(this.tabs)[0] || 'Status';
          this.appendLine('Status', { type: 'system', text: `*** You have left channel ${target}` });
          this.renderAll();
        }
        return;
      }

      if (cmd === 'me' || cmd === 'action') {
        const actText = rest || 'машет всем рукой';
        this.appendLine(this.activeTab, {
          type: 'action',
          text: `* ${this.nick} ${actText}`
        });
        return;
      }

      if (cmd === 'slap') {
        const target = rest || this.stripPrefix(this.selectedNick || 'Vovan_Modem');
        this.appendLine(this.activeTab, {
          type: 'action',
          text: `* ${this.nick} slaps ${target} around a bit with a large trout`
        });
        setTimeout(() => {
          if (!document.getElementById(this.windowId)) return;
          this.appendLine(this.activeTab, {
            type: 'chat',
            nick: target,
            color: '#b80000',
            text: `Эй, ${this.nick}, за что форелью-то?! Пинг чуть не вылетел!`
          });
        }, 350);
        return;
      }

      if (cmd === 'whois' || cmd === 'wi') {
        const target = this.stripPrefix(rest || this.selectedNick || 'Lexx_3dfx');
        this.whoisNick(target);
        return;
      }

      if (cmd === 'nick') {
        const newNick = (rest.split(/\s+/)[0] || '').replace(/[^a-zA-Z0-9_\-[\]]/g, '');
        if (newNick) {
          const oldNick = this.nick;
          this.nick = newNick;
          this.appendLine(this.activeTab, {
            type: 'system',
            text: `*** ${oldNick} is now known as ${this.nick}`
          });
          this.renderAll();
        }
        return;
      }

      if (cmd === 'topic') {
        const tab = this.tabs[this.activeTab];
        if (tab && tab.type === 'channel' && rest) {
          tab.topic = rest;
          this.appendLine(this.activeTab, {
            type: 'system',
            text: `*** ${this.nick} changes topic to '${rest}'`
          });
          this.renderAll();
        }
        return;
      }

      if (cmd === 'msg' || cmd === 'query') {
        const subParts = rest.split(/\s+/);
        const target = subParts[0] || 'SysOp_98';
        const msgBody = subParts.slice(1).join(' ') || 'Привет!';
        this.appendLine(this.activeTab, {
          type: 'notice',
          text: `-> *${target}* ${msgBody}`
        });
        setTimeout(() => {
          if (!document.getElementById(this.windowId)) return;
          this.appendLine(this.activeTab, {
            type: 'notice',
            text: `*${target}* Привет, ${this.nick}! Сообщение получено через ${this.server}.`
          });
        }, 300);
        return;
      }

      if (cmd === 'clear') {
        const tab = this.tabs[this.activeTab];
        if (tab) {
          tab.lines = [];
          this.renderActiveTab();
        }
        return;
      }

      if (cmd === 'anek' || cmd === 'joke') {
        this.postJoke();
        return;
      }

      this.appendLine(this.activeTab, {
        type: 'system',
        text: `*** Выполнена команда /${cmd} ${rest}`
      });
      return;
    }

    if (!this.connected) {
      this.appendLine(this.activeTab, {
        type: 'system',
        text: '*** Ошибка: нет соединения с сервером IRC. Нажмите «Подключиться».'
      });
      return;
    }

    this.appendLine(this.activeTab, {
      type: 'chat',
      nick: this.nick,
      color: this.selectedColor,
      text
    });

    if (text.toLowerCase().includes('!анекдот') || text.toLowerCase().includes('!anek')) {
      this.postJoke();
      return;
    }

    this.triggerBotReply(this.activeTab, text);
  }

  triggerBotReply(tabName, userMessage) {
    const lower = userMessage.toLowerCase();
    setTimeout(() => {
      if (!document.getElementById(this.windowId) || !this.tabs[tabName]) return;

      if (tabName === '#igromania') {
        let reply = 'В свежем номере Игромании №9 на CD есть демо-версия Sin и патч для Quake II 3.19!';
        if (lower.includes('fallout')) {
          reply = 'Совет по Fallout: поставь Agility 10 и возьми перк Sniper на 18 уровне — анклавовцы не устоят!';
        } else if (lower.includes('quake') || lower.includes('квейк')) {
          reply = 'Для Quake II не забудь прописать +set vid_ref gl и +mlook в autoexec.cfg!';
        } else if (lower.includes('starcraft') || lower.includes('старкрафт')) {
          reply = 'Код в StarCraft на минералы и газ: show me the money, но в мультиплеере по модему играем честно!';
        }
        this.appendLine(tabName, {
          type: 'chat',
          nick: '@IgromanBot',
          color: '#008000',
          text: `${this.nick}: ${reply}`
        });
        return;
      }

      if (tabName === '#ru.anekdot') {
        this.postJoke();
        return;
      }

      if (tabName === '#quake2') {
        this.appendLine(tabName, {
          type: 'chat',
          nick: '@RailMaster',
          color: '#b80000',
          text: `${this.nick}, заходи на сервер 195.2.72.10:27910, проверим твой аим с рейлгана!`
        });
        return;
      }

      const win98Replies = [
        { nick: '@Lexx_3dfx', color: '#000080', text: `${this.nick}, кстати, ты уже гонял тест Wintune 98 и Nokia Monitor Test?` },
        { nick: 'Vovan_Modem', color: '#000000', text: `${this.nick}, главное — чтобы мама трубку на кухне не сняла во время закачки!` },
        { nick: '+Katya_SPb', color: '#800080', text: `${this.nick}, полностью согласна! А какой у тебя номер аськи (ICQ UIN)?` },
        { nick: 'K0d3r_ASM', color: '#006868', text: `${this.nick}, загляни в FastTracker 98, я там новый трек ENLIGHT98.XM выложил!` }
      ];
      const pick = win98Replies[Math.floor(Math.random() * win98Replies.length)];
      this.appendLine(tabName, {
        type: 'chat',
        nick: pick.nick,
        color: pick.color,
        text: pick.text
      });
    }, 380);
  }

  joinChannel(chanName) {
    let chan = String(chanName || '#demoscene').trim();
    if (!chan.startsWith('#')) chan = '#' + chan;
    if (!this.tabs[chan]) {
      this.tabs[chan] = {
        type: 'channel',
        topic: `Канал ${chan} в сети RusNet (1998) — добро пожаловать!`,
        nicks: ['@ChanServ', '@SysOp_98', 'DemoScener_98', 'TrackerFan_RU'],
        lines: [
          { type: 'system', text: `*** Now talking in ${chan}` },
          { type: 'system', text: `*** Topic is 'Канал ${chan} в сети RusNet (1998) — добро пожаловать!'` },
          { type: 'chat', nick: 'DemoScener_98', color: '#000080', text: `Привет, ${this.nick}! Добро пожаловать на ${chan}!` }
        ]
      };
    }
    this.switchTab(chan);
  }

  promptJoinChannel() {
    const nextChan = this.tabs['#demoscene'] ? '#fido7.ru' : '#demoscene';
    this.joinChannel(nextChan);
  }

  whoisNick(rawNick) {
    const clean = this.stripPrefix(rawNick || this.selectedNick || 'Lexx_3dfx');
    const profile = this.whoisProfiles[clean] || {
      host: `${clean.toLowerCase()}@dialup-msk.rusnet.ru`,
      info: 'Microslop Win 98 SE Dial-Up User (mIRC32 v5.41)',
      channels: this.activeTab.startsWith('#') ? this.activeTab : '#win98',
      server: this.server
    };

    const lines = [
      `*** [WHOIS] ${clean} is ~${profile.host} (${profile.info})`,
      `*** [WHOIS] ${clean} on channels: ${profile.channels}`,
      `*** [WHOIS] ${clean} using server ${profile.server} [Idle: 14 secs]`,
      `*** [WHOIS] End of /WHOIS list.`
    ];

    lines.forEach((l) => {
      this.appendLine(this.activeTab, { type: 'whois', text: l });
      if (this.activeTab !== 'Status') {
        this.appendLine('Status', { type: 'whois', text: l });
      }
    });
  }

  whoisSelected() {
    this.whoisNick(this.selectedNick || 'Lexx_3dfx');
  }

  slapSelected() {
    const target = this.stripPrefix(this.selectedNick || 'Vovan_Modem');
    this.executeCommand(`/slap ${target}`);
  }

  postJoke() {
    const joke = this.jokes[this.jokeIndex % this.jokes.length];
    this.jokeIndex++;
    const targetTab = this.activeTab === 'Status' ? '#ru.anekdot' : this.activeTab;
    this.appendLine(targetTab, {
      type: 'chat',
      nick: '@VernerBot',
      color: '#008000',
      text: `[Анекдот №${this.jokeIndex}] ${joke}`
    });
  }

  updateTopicFromInput() {
    const input = document.getElementById('mirc-topic-input');
    if (!input) return;
    const val = input.value.trim();
    if (val) {
      this.executeCommand(`/topic ${val}`);
    }
  }

  toggleConnect() {
    this.connected = !this.connected;
    if (this.connected) {
      this.appendLine(this.activeTab, {
        type: 'system',
        text: `*** Reconnected to ${this.server} as ${this.nick}`
      });
    } else {
      this.appendLine(this.activeTab, {
        type: 'system',
        text: `*** Disconnected from ${this.server}`
      });
    }
    this.updateTitleAndStatus();
  }

  openOptionsModal() {
    const modal = document.getElementById('mirc-options-modal');
    if (!modal) return;
    const srv = document.getElementById('mirc-opt-server');
    if (srv) srv.value = this.server;
    const nick = document.getElementById('mirc-opt-nick');
    if (nick) nick.value = this.nick;
    modal.classList.add('open');
  }

  closeOptionsModal() {
    const modal = document.getElementById('mirc-options-modal');
    if (modal) modal.classList.remove('open');
  }

  saveOptionsAndConnect() {
    const srv = document.getElementById('mirc-opt-server');
    const nick = document.getElementById('mirc-opt-nick');
    const alt = document.getElementById('mirc-opt-altnick');
    const real = document.getElementById('mirc-opt-realname');

    if (srv && srv.value) this.server = srv.value;
    if (nick && nick.value.trim()) this.nick = nick.value.trim();
    if (alt && alt.value.trim()) this.altNick = alt.value.trim();
    if (real && real.value.trim()) this.realName = real.value.trim();

    this.connected = true;
    this.closeOptionsModal();
    this.appendLine('Status', {
      type: 'system',
      text: `*** Connected to ${this.server} as ${this.nick} (${this.realName})`
    });
    this.appendLine(this.activeTab, {
      type: 'system',
      text: `*** Server active: ${this.server} (Nick: ${this.nick})`
    });
    this.renderAll();
  }

  showAbout() {
    if (window.dialogs && typeof window.dialogs.alert === 'function') {
      window.dialogs.alert(
        'mIRC32 v5.41 (1998) by Khaled Mardam-Bey.\nРусификация и серверный лист RusNet для Microslop Win 98 SE.',
        'About mIRC32'
      );
    }
  }

  startAmbientChatter() {
    this.stopAmbientChatter();
    this.ambientTimer = setInterval(() => {
      if (!this.connected || !document.getElementById(this.windowId)) return;
      const ambientPool = [
        { tab: '#win98', nick: 'Dimon_P200', color: '#000000', text: 'Кто знает, почему CD-ROM 24x так сильно гудит при чтении штамповки?' },
        { tab: '#igromania', nick: 'Sniper_Q2', color: '#000080', text: 'Прошел Half-Life демо с диска, поездка в вагончике Black Mesa — это просто космос!' },
        { tab: '#quake2', nick: '+Bitterman', color: '#804000', text: 'У кого пинг меньше 180 на диалапе — заходите на DM!' }
      ];
      const item = ambientPool[Math.floor(Math.random() * ambientPool.length)];
      this.appendLine(item.tab, {
        type: 'chat',
        nick: item.nick,
        color: item.color,
        text: item.text
      });
    }, 28000);
  }

  stopAmbientChatter() {
    if (this.ambientTimer) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  close() {
    this.stopAmbientChatter();
    if (window.winManager) window.winManager.closeWindow(this.windowId);
  }
}

window.appMIRC = new AppMIRC();
