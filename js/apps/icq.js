/**
 * ICQ 98a Authentic Retro Messenger (Mirabilis)
 * Complete with authentic UIN profile, expanded retro contact list,
 * White Pages user search & add wizard, User Info profiles,
 * chat toolbar, emoticons, typing indicators, file transfer simulation,
 * and retro sound effects.
 */
class AppICQ {
  constructor() {
    this.profileStorageKey = 'win98_icq_profile_v2';
    this.contactsStorageKey = 'win98_icq_contacts_v2';

    // Load or initialize user profile (New Default UIN: 749210)
    this.loadProfile();

    // Load or initialize expanded retro contacts
    this.loadContacts();

    this.chatWindows = new Map();
    this.collapsedGroups = new Set();
    this.hideOffline = false;
    this.soundEnabled = true;
    this.selectedContact = null;

    // Start ambient network events (occasional lively pings/status changes)
    this.initAmbientEvents();
  }

  loadProfile() {
    const defaultProfile = {
      uin: '749210',
      nick: 'Alexey_98',
      firstName: 'Алексей',
      lastName: 'Иванов',
      email: 'alex98@chat.ru',
      city: 'Москва',
      country: 'Россия',
      age: '19',
      gender: 'Мужской',
      interests: 'Win 98, Quake II, сборка ПК, MP3, FidoNet',
      status: 'online',
      statusNote: 'В сети / ICQ 98a'
    };

    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.profileStorageKey);
        if (saved) {
          this.profile = { ...defaultProfile, ...JSON.parse(saved) };
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load ICQ profile:', e);
    }

    this.profile = defaultProfile;
  }

  saveProfile() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.profileStorageKey, JSON.stringify(this.profile));
      }
    } catch (e) {
      console.warn('Failed to save ICQ profile:', e);
    }
  }

  loadContacts() {
    const defaultContacts = [
      // Группа 1: Коллеги и Сеть
      {
        id: 'boris',
        nick: 'Сисадмин Борис',
        uin: '777666',
        name: 'Борис Сергеевич',
        email: 'boris@noc.cnt.ru',
        city: 'Москва',
        country: 'Россия',
        age: '28',
        gender: 'Мужской',
        interests: 'Linux, FreeBSD, Cisco, BNC, Quake IPX, пиво',
        status: 'online',
        statusNote: 'Настраиваю Samba на RedHat 5.2',
        group: 'Коллеги и Сеть',
        unread: false,
        messages: [
          { sender: 'them', time: '12:15:20', text: 'Здорово! Сервак на Linux подняли, можешь по FTP стянуть новый софт.' }
        ],
        replies: [
          'Я сейчас патч-корд обжимаю клещами, не отвлекай!',
          'Ты диск C: отдефрагментировал? Смотри, логи забьют винт!',
          'Пошли в обед в компьютерный клуб в Quake по IPX рубиться?',
          'У нас тут BNC-сеть упала, кто-то терминатор на 50 Ом спер!',
          'Перепрошиваю BIOS на сервере, молюсь чтобы свет не моргнул.'
        ]
      },
      {
        id: 'glavbuh',
        nick: 'Главбух МарьИванна',
        uin: '890123',
        name: 'Мария Ивановна',
        email: 'buh@glavbuh.msk.ru',
        city: 'Москва',
        country: 'Россия',
        age: '52',
        gender: 'Женский',
        interests: '1С 6.0, Налоговый кодекс, бухгалтерский учет, чай',
        status: 'dnd',
        statusNote: 'Квартальный отчет в 1С 6.0! НЕ ТРОГАТЬ!',
        group: 'Коллеги и Сеть',
        unread: false,
        messages: [
          { sender: 'them', time: '11:40:12', text: 'Алексей, матричный принтер опять зажевал копирку, зайдите срочно!' }
        ],
        replies: [
          'Молодой человек! Я делаю проводки по счету 60, не пишите мне!',
          'Алексей, у меня принтер Epson бумагу зажевал, зайдите немедленно!',
          'Где ведомость за прошлый месяц? У меня баланс не сходится на 3 рубля!',
          'Не стучите по клавишам, я квартальный свод делаю!'
        ]
      },
      {
        id: 'dima_web',
        nick: 'Вебмастер Дима',
        uin: '313370',
        name: 'Дмитрий Соколов',
        email: 'dima@geocities.com',
        city: 'Санкт-Петербург',
        country: 'Россия',
        age: '21',
        gender: 'Мужской',
        interests: 'HTML 3.2, JavaScript, Netscape, Geocities, GIF-анимация',
        status: 'online',
        statusNote: 'Верстаю сайт на фреймах и таблицах',
        group: 'Коллеги и Сеть',
        unread: false,
        messages: [
          { sender: 'them', time: '12:02:45', text: 'Привет! Зацени мой сайт: http://www.geocities.com/dima_web/ — там гифка с танцующим ребенком и счетчик!' }
        ],
        replies: [
          'Смотри мой сайт: http://www.geocities.com/dima_web/ ! Я никому ссылку на главной IE не давал, только здесь в ICQ!',
          'Ты видел 3D танцующего ребенка на http://www.geocities.com/dima_web/ ? Хит сезона!',
          'Слушай, а фоновая MIDI-музыка играет у тебя на моем сайте? Я через <bgsound> настроил!',
          'Тестирую вёрстку на фреймах и таблицах в Netscape 4.08 и IE 5.0 — заходи: http://www.geocities.com/dima_web/',
          'Обязательно черкни пару слов в гостевую книгу на моем сайте http://www.geocities.com/dima_web/ !'
        ]
      },
      {
        id: 'pasha_any',
        nick: 'Эникейщик Паша',
        uin: '452109',
        name: 'Павел Кузнецов',
        email: 'pavel_support@mail.ru',
        city: 'Москва',
        country: 'Россия',
        age: '19',
        gender: 'Мужской',
        interests: 'Драйвера, чистка мышек от грязи, разборка БП, DOOM',
        status: 'away',
        statusNote: 'Ставлю драйвера Sound Blaster 16',
        group: 'Коллеги и Сеть',
        unread: false,
        messages: [
          { sender: 'them', time: '10:55:00', text: 'У тебя есть дискета с драйвером для мышки Genius с колесиком?' }
        ],
        replies: [
          'Отошел на склад за чистыми дискетами 3.5 дюйма.',
          'Сейчас Win 98 переставлю на 3-м этаже и отвечу, подожди!',
          'Шарик из мышки спиртом протер — мышка летает теперь!'
        ]
      },

      // Группа 2: Друзья
      {
        id: 'elena',
        nick: 'Лена_Студентка',
        uin: '554433',
        name: 'Елена Смирнова',
        email: 'elena_msu@chat.ru',
        city: 'Москва',
        country: 'Россия',
        age: '19',
        gender: 'Женский',
        interests: 'Матан, МГУ, книги, кино, котики, стихи',
        status: 'away',
        statusNote: 'На паре по матану в МГУ',
        group: 'Друзья',
        unread: false,
        messages: [
          { sender: 'them', time: '11:10:04', text: 'Привет! Скинь домашку по алгебре из папки My Documents!' }
        ],
        replies: [
          'Ой, я сейчас на паре по информатике, препод ходит между рядами!',
          'Спасибочки огромное! Ты меня просто спас!',
          'Пока, мама телефонную трубку берет, связь сейчас оборвется!',
          'Вечером созвонимся, когда телефон будет свободен!'
        ]
      },
      {
        id: 'serega_quake',
        nick: 'Серёга (Quake-Мастер)',
        uin: '666999',
        name: 'Сергей Волков',
        email: 'quake_god@mail.ru',
        city: 'Нижний Новгород',
        country: 'Россия',
        age: '20',
        gender: 'Мужской',
        interests: 'Quake II, 3dfx Glide, Rocket Jump, Half-Life, разгон',
        status: 'online',
        statusNote: 'Купил 3dfx Voodoo 2 12MB!',
        group: 'Друзья',
        unread: false,
        messages: [
          { sender: 'them', time: '12:30:10', text: 'Го 1v1 на q2dm1 "The Edge"! Я ракетницу контролю!' }
        ],
        replies: [
          'Чувак, я разогнал Celeron 300A до 450 МГц! Летает просто жесть!',
          'Ты конфиг autoexec.cfg настроил? Врубай cl_run 1 и fov 110!',
          'Вчера рельсой снял чувака через всю карту прямо в воздухе!',
          'Погнали на сервер q2.mastak.ru, там народ собирается.'
        ]
      },
      {
        id: 'max_cd',
        nick: 'Макс_CD-ROM',
        uin: '404505',
        name: 'Максим Белов',
        email: 'max_cd@inbox.ru',
        city: 'Москва',
        country: 'Россия',
        age: '22',
        gender: 'Мужской',
        interests: 'Запись CD-R, MP3 128kbps, Игромания, Горбушка, железо',
        status: 'offline',
        statusNote: 'Оффлайн (пишу болванки Verbatim)',
        group: 'Друзья',
        unread: false,
        messages: [
          { sender: 'them', time: '09:20:15', text: 'Привет! Записал свежий сборник MP3 хитов 1998, кому болванку?' }
        ],
        replies: [
          'Привет! Есть свежий выпуск журнала Игромания с CD-диском, могу дать переписать.',
          'Купил резак Mitsumi 2x, болванки стоят по 15 рублей на Горбушке.',
          'Завтра поеду на рынок Митино за шлейфами IDE.'
        ]
      },
      {
        id: 'vovan_car',
        nick: 'Вован_Авто',
        uin: '512789',
        name: 'Владимир Морозов',
        email: 'vovan99@rambler.ru',
        city: 'Самара',
        country: 'Россия',
        age: '23',
        gender: 'Мужской',
        interests: 'ВАЗ 21099, автомагнитолы Pioneer, гараж, сабвуфер',
        status: 'offline',
        statusNote: 'В гараже тюнингую девятку',
        group: 'Друзья',
        unread: false,
        messages: [
          { sender: 'them', time: 'Вчера', text: 'Поставил в девятку магнитолу с синей подсветкой, качает!' }
        ],
        replies: [
          'Здорово! В гараже с батей карбюратор перебираем.',
          'Слушай, а на компе можно сделать чертеж для подиумов под динамики?'
        ]
      },

      // Группа 3: Интернет & Фидонет
      {
        id: 'hacker',
        nick: 'Neo_Hacker98',
        uin: '133742',
        name: 'Thomas A. Anderson',
        email: 'trinity@matrix.net',
        city: 'Capital City',
        country: 'США',
        age: '24',
        gender: 'Мужской',
        interests: 'The Matrix, USRobotics Courier 56k, Linux, QBasic, Phreaking',
        status: 'online',
        statusNote: 'Wake up, Neo... (56000 bps)',
        group: 'Интернет & Фидонет',
        unread: false,
        messages: [
          { sender: 'them', time: '12:00:00', text: 'Follow the white rabbit... Ты видел файл totally_not_a_virus.exe?' }
        ],
        replies: [
          'The Matrix has you...',
          'У меня модем USRobotics Courier 56k коннектится на честные 52000 bps без разрывов!',
          'Напиши мне скрипт на QBasic для взлома Пентагона :)',
          'Попробуй набрать в DOS: ping 127.0.0.1. Ты возвращаешься к истокам.'
        ]
      },
      {
        id: 'anya_fido',
        nick: 'Аня_Фидошница',
        uin: '204899',
        name: 'Анна Мельникова',
        email: 'anya@fido.org',
        city: 'Москва',
        country: 'Россия',
        age: '20',
        gender: 'Женский',
        interests: 'FidoNet, эхопочта, GoldED, Zyxel Omni 56K, пойнтовки',
        status: 'online',
        statusNote: '2:5020/400.12 Netmail Only',
        group: 'Интернет & Фидонет',
        unread: false,
        messages: [
          { sender: 'them', time: '11:50:33', text: 'Привет! Получила ночной босс-колл, читаю эху RU.ANEKDOT.' }
        ],
        replies: [
          'GoldED настроила, теперь почту разгребаю в три раза быстрее!',
          'Завтра пойнтовка на Чистых прудах, подтягивайся часам к шести!',
          'Мой босс опять сменил пароль на сессию, пришлось звонить голосом.'
        ]
      },
      {
        id: 'cool_girl',
        nick: 'Cool_Girl98',
        uin: '789456',
        name: 'Алиса',
        email: 'alisa_stars@chat.ru',
        city: 'Москва',
        country: 'Россия',
        age: '18',
        gender: 'Женский',
        interests: 'mIRC, Руки Вверх, Стрелки, дискотеки, чаты',
        status: 'online',
        statusNote: 'Слушаю Руки Вверх и сижу в mIRC',
        group: 'Интернет & Фидонет',
        unread: false,
        messages: [
          { sender: 'them', time: '12:28:19', text: 'Приветик! :) Ты из какого района Москвы? Заходи на канал #moscow!' }
        ],
        replies: [
          'Обожаю песню "Крошка моя", слушаю на кассете!',
          'Скинь свою фотку по ICQ, если есть сканер!',
          'Я сейчас в чате Кроватка сижу, там так весело!'
        ]
      },
      {
        id: 'dj_groove',
        nick: 'DJ_Groove_Fan',
        uin: '112233',
        name: 'Роман Ткачев',
        email: 'groove_fan@nightparty.ru',
        city: 'Москва',
        country: 'Россия',
        age: '22',
        gender: 'Мужской',
        interests: 'Станция 106.8, DJ Грув, The Prodigy, рейвы, Гагарин-парк',
        status: 'online',
        statusNote: 'Станция 106.8 FM non-stop',
        group: 'Интернет & Фидонет',
        unread: false,
        messages: [
          { sender: 'them', time: '11:05:40', text: 'Йоу! Слушаешь эфиры DJ Грува на Станции 106.8?' }
        ],
        replies: [
          'Записал с радио микс Prodigy и Chemical Brothers на 90-минутную кассету BASF!',
          'В субботу рейв в ЛД МДМ, ты идешь?',
          'Счастье есть, его не может не быть!'
        ]
      },
      {
        id: 'denchik_roller',
        nick: 'Денчик_Roller',
        uin: '912384',
        name: 'Денис Пономарев',
        email: 'denis_skate@mail.ru',
        city: 'Москва',
        country: 'Россия',
        age: '17',
        gender: 'Мужской',
        interests: 'Ролики Rollerblade, Поклонная гора, скейтборд, Dr Pepper',
        status: 'away',
        statusNote: 'Катаюсь на роликах на Поклонке',
        group: 'Интернет & Фидонет',
        unread: false,
        messages: [
          { sender: 'them', time: '10:12:30', text: 'Привет! На Поклонке классный асфальт, тренирую трюки на роликах!' }
        ],
        replies: [
          'Устал, сижу на ступеньках, пью Dr Pepper из жестяной банки.',
          'Колеса ABEC-5 поставил, разгон сумасшедший!'
        ]
      },
      {
        id: 'icq_support',
        nick: 'ICQ System Support',
        uin: '10000',
        name: 'Mirabilis Bot',
        email: 'support@icq.com',
        city: 'Tel Aviv',
        country: 'Израиль',
        age: '2',
        gender: 'Робот',
        interests: 'Instant Messaging, Peer-to-Peer, Mirabilis, Internet Protocol',
        status: 'online',
        statusNote: 'Mirabilis ICQ Network Message',
        group: 'Интернет & Фидонет',
        unread: false,
        messages: [
          { sender: 'them', time: '10:00:00', text: 'Welcome to ICQ 98a! With ICQ, you can chat, send messages and files to friends worldwide.' }
        ],
        replies: [
          'ICQ System Notice: All services are operating normally. 1,450,210 users connected worldwide.',
          'Did you know? You can change your status to Away or DND from the status dropdown menu!',
          'You can add new contacts using the Find/Add Users wizard at the bottom of the contact list.'
        ]
      }
    ];

    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.contactsStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const dima = parsed.find(c => c.id === 'dima_web');
            if (dima) {
              if (dima.messages && dima.messages[0] && !dima.messages[0].text.includes('http://')) {
                dima.messages[0].text = 'Привет! Зацени мой сайт: http://www.geocities.com/dima_web/ — там гифка с танцующим ребенком и счетчик!';
              }
              dima.replies = [
                'Смотри мой сайт: http://www.geocities.com/dima_web/ ! Я никому ссылку на главной IE не давал, только здесь в ICQ!',
                'Ты видел 3D танцующего ребенка на http://www.geocities.com/dima_web/ ? Хит сезона!',
                'Слушай, а фоновая MIDI-музыка играет у тебя на моем сайте? Я через <bgsound> настроил!',
                'Тестирую вёрстку на фреймах и таблицах в Netscape 4.08 и IE 5.0 — заходи: http://www.geocities.com/dima_web/',
                'Обязательно черкни пару слов в гостевую книгу на моем сайте http://www.geocities.com/dima_web/ !'
              ];
            }
            this.contacts = parsed;
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load ICQ contacts:', e);
    }

    this.contacts = defaultContacts;
  }

  saveContacts() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.contactsStorageKey, JSON.stringify(this.contacts));
      }
    } catch (e) {
      console.warn('Failed to save ICQ contacts:', e);
    }
  }

  // Directory of searchable retro users for the White Pages Wizard
  getDirectoryUsers() {
    return [
      { nick: 'Клава_Рейлган', uin: '888333', name: 'Клавдия Смирнова', city: 'Москва', status: 'online', note: 'Чемпионка МГУ по Quake II', interests: 'Quake II, Railgun, 3dfx' },
      { nick: 'Толян_Assembler', uin: '256512', name: 'Анатолий Решетников', city: 'Новосибирск', status: 'online', note: 'Пишу демосцены на ассемблере x86', interests: 'Assembler x86, DOS, Demoscene' },
      { nick: 'Катя_ChatGirl', uin: '345678', name: 'Екатерина Власова', city: 'Москва', status: 'online', note: 'Люблю гулять по Арбату', interests: 'Кино, театр, ролики, музыка' },
      { nick: 'Валера_Горбушка', uin: '199911', name: 'Валерий Романов', city: 'Москва', status: 'online', note: 'Продаю CD-диски на Горбушке', interests: 'CD-ROM, аудиодиски, пиратка' },
      { nick: 'Дядя_Петрович', uin: '654321', name: 'Петр Николаевич', city: 'Екатеринбург', status: 'away', note: 'Перепаиваю телефонную лапшу', interests: 'Паяльник, АТС, модемы' },
      { nick: 'Agent_Smith', uin: '101010', name: 'Agent Smith', city: 'Matrix', status: 'dnd', note: 'Mr. Anderson...', interests: 'Control, Ordnung, Sentinels' }
    ];
  }

  // Ambient network events (occasional online knock or message)
  initAmbientEvents() {
    if (this._ambientTimer) return;
    if (typeof window === 'undefined' || typeof window.setInterval === 'undefined') return;
    this._ambientTimer = window.setInterval(() => {
      if (!this.soundEnabled || Math.random() > 0.35) return;

      // Find an offline contact to bring online, or pick an online contact to say knock
      const offContacts = this.contacts.filter(c => c.status === 'offline');
      if (offContacts.length > 0 && Math.random() > 0.6) {
        const c = offContacts[Math.floor(Math.random() * offContacts.length)];
        c.status = 'online';
        c.statusNote = 'Только что вошел в сеть';
        this.saveContacts();
        if (this.mainContentEl) {
          this.renderContacts(this.mainContentEl);
        }
        if (window.soundSys && typeof window.soundSys.playIcqKnock === 'function') {
          window.soundSys.playIcqKnock();
        }
      }
    }, 45000);
  }

  open() {
    const winId = 'app_icq';
    if (window.winManager && window.winManager.windows.has(winId)) {
      window.winManager.bringToTop(winId);
      return;
    }

    const content = document.createElement('div');
    content.className = 'icq-window';
    this.mainContentEl = content;

    content.innerHTML = `
      <div class="icq-header-bar">
        <div class="icq-brand-logo">
          ${Icons['icq-online']}
          <span>ICQ 98a</span>
        </div>
        <div class="icq-header-uin" id="icq-header-uin-badge" title="Нажмите, чтобы изменить свои сведения">
          #${this.profile.uin}
        </div>
      </div>

      <div class="icq-user-status-row">
        <span class="icq-status-dot ${this.profile.status}" id="icq-my-status-dot"></span>
        <select id="icq-status-select" style="flex:1;">
          <option value="online" ${this.profile.status === 'online' ? 'selected' : ''}>Online (В сети)</option>
          <option value="away" ${this.profile.status === 'away' ? 'selected' : ''}>Away (Отошел)</option>
          <option value="dnd" ${this.profile.status === 'dnd' ? 'selected' : ''}>DND / Occupied (Занят)</option>
          <option value="na" ${this.profile.status === 'na' ? 'selected' : ''}>N/A (Недоступен)</option>
          <option value="offline" ${this.profile.status === 'offline' ? 'selected' : ''}>Offline (Отключен)</option>
        </select>
      </div>

      <div class="icq-quick-filter-bar">
        <label class="icq-filter-chk">
          <input type="checkbox" id="icq-chk-hide-offline" ${this.hideOffline ? 'checked' : ''}>
          <span>Скрыть оффлайн</span>
        </label>
        <span style="color:#555;" id="icq-status-online-count"></span>
      </div>

      <div class="icq-contacts-list" id="icq-contacts"></div>

      <div class="icq-bottom-toolbar">
        <button class="win-btn btn-icq-menu" id="btn-icq-main-menu">
          ${Icons['icq-online']}
          <span>ICQ</span>
        </button>
        <button class="win-btn" id="btn-icq-add" style="font-size:10px;">Найти/Добавить</button>
        <button class="win-btn" id="btn-icq-msg" style="font-size:10px; font-weight:bold;">Чат</button>

        <!-- Authentic ICQ Popup Menu -->
        <div class="icq-menu-dropdown" id="icq-main-menu-dropdown">
          <div class="icq-menu-item" data-action="my-details">
            ${Icons['user'] || Icons['card'] || ''}
            <span>Мои сведения (My Details)</span>
          </div>
          <div class="icq-menu-item" data-action="add-user">
            ${Icons['search'] || ''}
            <span>Найти / Добавить пользователя...</span>
          </div>
          <div class="icq-menu-separator"></div>
          <div class="icq-menu-item" data-action="toggle-sound">
            <span>🔊 Звуки: ${this.soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}</span>
          </div>
          <div class="icq-menu-item" data-action="all-history">
            <span>📜 Журнал сообщений</span>
          </div>
          <div class="icq-menu-separator"></div>
          <div class="icq-menu-item" data-action="about">
            <span>❓ О программе ICQ 98a</span>
          </div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: winId,
      title: `ICQ - ${this.profile.uin}`,
      icon: 'icq-online',
      width: 240,
      height: 480,
      resizable: true,
      content
    });

    this.win = win;
    this.renderContacts(content);
    this.initEvents(content);
    this.updateOnlineCount(content);
  }

  updateHeader() {
    if (!this.mainContentEl) return;
    const badge = this.mainContentEl.querySelector('#icq-header-uin-badge');
    if (badge) badge.textContent = `#${this.profile.uin}`;
    if (this.win && this.win.titleElement) {
      this.win.titleElement.textContent = `ICQ - ${this.profile.uin}`;
    }
  }

  initEvents(content) {
    const select = content.querySelector('#icq-status-select');
    const dot = content.querySelector('#icq-my-status-dot');
    const menuBtn = content.querySelector('#btn-icq-main-menu');
    const menuDropdown = content.querySelector('#icq-main-menu-dropdown');
    const uinBadge = content.querySelector('#icq-header-uin-badge');
    const chkHideOffline = content.querySelector('#icq-chk-hide-offline');

    // Status change
    select.addEventListener('change', () => {
      this.profile.status = select.value;
      this.saveProfile();
      dot.className = `icq-status-dot ${this.profile.status}`;
      this.updateTrayIcon();
      if (window.soundSys) window.soundSys.playClick();
    });

    // UIN badge click -> open profile
    uinBadge.addEventListener('click', () => {
      this.openMyDetailsDialog();
    });

    // Filter checkbox
    chkHideOffline.addEventListener('change', (e) => {
      this.hideOffline = e.target.checked;
      this.renderContacts(content);
    });

    // Main ICQ Menu toggle
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle('show');
      if (window.soundSys) window.soundSys.playClick();
    });

    // Close menu when clicking outside
    content.addEventListener('click', (e) => {
      if (!e.target.closest('#btn-icq-main-menu') && !e.target.closest('#icq-main-menu-dropdown')) {
        menuDropdown.classList.remove('show');
      }
    });

    // Menu actions
    menuDropdown.querySelectorAll('.icq-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        menuDropdown.classList.remove('show');
        if (window.soundSys) window.soundSys.playClick();

        if (action === 'my-details') {
          this.openMyDetailsDialog();
        } else if (action === 'add-user') {
          this.openAddUserWizard();
        } else if (action === 'toggle-sound') {
          this.soundEnabled = !this.soundEnabled;
          item.querySelector('span').textContent = `🔊 Звуки: ${this.soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}`;
        } else if (action === 'all-history') {
          this.openAllHistoryDialog();
        } else if (action === 'about') {
          this.openAboutDialog();
        }
      });
    });

    // Add button
    content.querySelector('#btn-icq-add').addEventListener('click', () => {
      this.openAddUserWizard();
    });

    // Message button
    content.querySelector('#btn-icq-msg').addEventListener('click', () => {
      if (this.selectedContact) {
        this.openChat(this.selectedContact);
      } else if (this.contacts.length > 0) {
        this.openChat(this.contacts[0]);
      }
    });
  }

  updateOnlineCount(content) {
    const el = content.querySelector('#icq-status-online-count');
    if (!el) return;
    const online = this.contacts.filter(c => c.status !== 'offline').length;
    el.textContent = `${online}/${this.contacts.length} в сети`;
  }

  updateTrayIcon() {
    const trayIcq = document.getElementById('tray-icq-icon');
    if (trayIcq) {
      const isOff = this.profile.status === 'offline' || this.profile.status === 'na';
      trayIcq.innerHTML = Icons[isOff ? 'icq-offline' : 'icq-online'];
      trayIcq.title = `ICQ 98a (${this.profile.nick} #${this.profile.uin} - ${this.profile.status})`;
    }
  }

  renderContacts(content) {
    const list = content.querySelector('#icq-contacts');
    if (!list) return;
    list.innerHTML = '';

    // Grouping
    const groups = {};
    this.contacts.forEach(c => {
      if (this.hideOffline && c.status === 'offline') return;
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    });

    Object.keys(groups).forEach(gName => {
      const isCollapsed = this.collapsedGroups.has(gName);
      const groupContacts = groups[gName];
      const onlineCount = groupContacts.filter(c => c.status !== 'offline').length;

      const gHeader = document.createElement('div');
      gHeader.className = 'icq-group-header';
      gHeader.innerHTML = `
        <div class="icq-group-title">
          <span class="icq-group-arrow">${isCollapsed ? '►' : '▼'}</span>
          <span>${gName}</span>
        </div>
        <span class="icq-group-count">(${onlineCount}/${groupContacts.length})</span>
      `;

      gHeader.addEventListener('click', () => {
        if (this.collapsedGroups.has(gName)) {
          this.collapsedGroups.delete(gName);
        } else {
          this.collapsedGroups.add(gName);
        }
        this.renderContacts(content);
      });

      list.appendChild(gHeader);

      if (!isCollapsed) {
        groupContacts.forEach(contact => {
          const item = document.createElement('div');
          item.className = `icq-contact-item ${this.selectedContact && this.selectedContact.id === contact.id ? 'selected' : ''}`;
          item.innerHTML = `
            <span class="icq-status-dot ${contact.status}" title="${contact.statusNote || contact.status}"></span>
            <div class="icq-contact-info">
              <div class="icq-contact-row1">
                <span class="icq-contact-name">${contact.nick}</span>
                <span class="icq-contact-uin">${contact.uin}</span>
              </div>
              <div class="icq-contact-note">${contact.statusNote || ''}</div>
            </div>
            ${contact.unread ? '<span class="icq-unread-badge" title="Новое сообщение"></span>' : ''}
          `;

          item.addEventListener('click', () => {
            list.querySelectorAll('.icq-contact-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            this.selectedContact = contact;
          });

          item.addEventListener('dblclick', () => {
            contact.unread = false;
            this.saveContacts();
            this.openChat(contact);
            this.renderContacts(content);
          });

          // Right click context menu
          item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectedContact = contact;
            list.querySelectorAll('.icq-contact-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');

            if (window.contextMenu) {
              window.contextMenu.show(e.clientX, e.clientY, [
                {
                  label: `💬 Написать сообщение (${contact.nick})`,
                  bold: true,
                  action: () => {
                    contact.unread = false;
                    this.saveContacts();
                    this.openChat(contact);
                    this.renderContacts(content);
                  }
                },
                {
                  label: '👤 Сведения о пользователе...',
                  action: () => this.openUserInfoDialog(contact)
                },
                {
                  label: '📁 Передать файл...',
                  action: () => this.openFileTransferDialog(contact)
                },
                { separator: true },
                {
                  label: contact.status === 'offline' ? '🟢 Переключить в Online' : '⚪ Переключить в Offline',
                  action: () => {
                    contact.status = contact.status === 'offline' ? 'online' : 'offline';
                    this.saveContacts();
                    this.renderContacts(content);
                    this.updateOnlineCount(content);
                    if (contact.status === 'online' && window.soundSys && typeof window.soundSys.playIcqKnock === 'function') {
                      window.soundSys.playIcqKnock();
                    }
                  }
                },
                {
                  label: '🗑️ Удалить из списка',
                  action: () => {
                    this.deleteContact(contact);
                  }
                }
              ]);
            }
          });

          list.appendChild(item);
        });
      }
    });

    this.updateOnlineCount(content);
  }

  deleteContact(contact) {
    if (!window.winManager) return;
    window.winManager.openDialog({
      title: 'Удаление контакта ICQ',
      icon: 'warning',
      message: `Вы действительно хотите удалить <b>${contact.nick}</b> (#${contact.uin}) из вашего контакт-листа?`,
      buttons: [
        {
          text: 'Да',
          primary: true,
          action: () => {
            this.contacts = this.contacts.filter(c => c.id !== contact.id);
            this.saveContacts();
            if (this.selectedContact && this.selectedContact.id === contact.id) {
              this.selectedContact = null;
            }
            if (this.mainContentEl) {
              this.renderContacts(this.mainContentEl);
            }
          }
        },
        { text: 'Отмена' }
      ]
    });
  }

  // --- Dialog: My Details / Change Profile ---
  openMyDetailsDialog() {
    const dialogId = 'icq_my_details';
    if (window.winManager && window.winManager.windows.has(dialogId)) {
      window.winManager.bringToTop(dialogId);
      return;
    }

    const content = document.createElement('div');
    content.className = 'icq-tab-container';
    content.innerHTML = `
      <div class="icq-tab-headers">
        <button class="icq-tab-btn active" data-tab="tab-main">Главная</button>
        <button class="icq-tab-btn" data-tab="tab-about">О себе</button>
        <button class="icq-tab-btn" data-tab="tab-status">Статус</button>
      </div>

      <!-- Tab 1: Main -->
      <div class="icq-tab-pane active" id="tab-main">
        <div class="icq-form-row">
          <span class="icq-form-label">UIN (Номер ICQ):</span>
          <input type="text" class="icq-form-input" id="inp-my-uin" value="${this.profile.uin}" style="font-weight:bold; font-family:'Courier New', monospace; color:#000080;">
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">Никнейм:</span>
          <input type="text" class="icq-form-input" id="inp-my-nick" value="${this.profile.nick}">
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">Имя:</span>
          <input type="text" class="icq-form-input" id="inp-my-fname" value="${this.profile.firstName || ''}">
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">Фамилия:</span>
          <input type="text" class="icq-form-input" id="inp-my-lname" value="${this.profile.lastName || ''}">
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">E-mail:</span>
          <input type="text" class="icq-form-input" id="inp-my-email" value="${this.profile.email || ''}">
        </div>
      </div>

      <!-- Tab 2: About -->
      <div class="icq-tab-pane" id="tab-about">
        <div class="icq-form-row">
          <span class="icq-form-label">Город:</span>
          <input type="text" class="icq-form-input" id="inp-my-city" value="${this.profile.city || ''}">
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">Страна:</span>
          <input type="text" class="icq-form-input" id="inp-my-country" value="${this.profile.country || ''}">
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">Возраст:</span>
          <input type="text" class="icq-form-input" id="inp-my-age" value="${this.profile.age || ''}" style="width:50px;">
        </div>
        <div class="icq-form-row" style="align-items:flex-start;">
          <span class="icq-form-label">Интересы:</span>
          <textarea class="icq-form-input" id="inp-my-interests" rows="3" style="resize:none;">${this.profile.interests || ''}</textarea>
        </div>
      </div>

      <!-- Tab 3: Status -->
      <div class="icq-tab-pane" id="tab-status">
        <div class="icq-form-row">
          <span class="icq-form-label">Статус:</span>
          <select class="icq-form-input" id="inp-my-status">
            <option value="online" ${this.profile.status === 'online' ? 'selected' : ''}>Online (В сети)</option>
            <option value="away" ${this.profile.status === 'away' ? 'selected' : ''}>Away (Отошел)</option>
            <option value="dnd" ${this.profile.status === 'dnd' ? 'selected' : ''}>DND / Occupied (Занят)</option>
            <option value="na" ${this.profile.status === 'na' ? 'selected' : ''}>N/A (Недоступен)</option>
            <option value="offline" ${this.profile.status === 'offline' ? 'selected' : ''}>Offline (Отключен)</option>
          </select>
        </div>
        <div class="icq-form-row" style="align-items:flex-start;">
          <span class="icq-form-label">Записка статуса:</span>
          <textarea class="icq-form-input" id="inp-my-note" rows="2" style="resize:none;">${this.profile.statusNote || ''}</textarea>
        </div>
        <div style="font-size:10px; color:#555; margin-top:8px;">
          * Ваша статусная записка видна другим пользователям при наведении курсора в контакт-листе.
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
        <button class="win-btn" id="btn-save-profile" style="font-weight:bold; min-width:80px;">Сохранить</button>
        <button class="win-btn" id="btn-close-profile" style="min-width:70px;">Отмена</button>
      </div>
    `;

    // Tab switching logic
    content.querySelectorAll('.icq-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.icq-tab-btn').forEach(b => b.classList.remove('active'));
        content.querySelectorAll('.icq-tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = content.querySelector(`#${btn.dataset.tab}`);
        if (target) target.classList.add('active');
      });
    });

    const win = window.winManager.createWindow({
      id: dialogId,
      title: `Мои сведения ICQ - #${this.profile.uin}`,
      icon: 'icq-online',
      width: 360,
      height: 310,
      resizable: false,
      content
    });

    // Save
    content.querySelector('#btn-save-profile').addEventListener('click', () => {
      const newUin = content.querySelector('#inp-my-uin').value.trim() || this.profile.uin;
      const newNick = content.querySelector('#inp-my-nick').value.trim() || this.profile.nick;
      const newFname = content.querySelector('#inp-my-fname').value.trim();
      const newLname = content.querySelector('#inp-my-lname').value.trim();
      const newEmail = content.querySelector('#inp-my-email').value.trim();
      const newCity = content.querySelector('#inp-my-city').value.trim();
      const newCountry = content.querySelector('#inp-my-country').value.trim();
      const newAge = content.querySelector('#inp-my-age').value.trim();
      const newInterests = content.querySelector('#inp-my-interests').value.trim();
      const newStatus = content.querySelector('#inp-my-status').value;
      const newNote = content.querySelector('#inp-my-note').value.trim();

      this.profile = {
        uin: newUin,
        nick: newNick,
        firstName: newFname,
        lastName: newLname,
        email: newEmail,
        city: newCity,
        country: newCountry,
        age: newAge,
        gender: this.profile.gender,
        interests: newInterests,
        status: newStatus,
        statusNote: newNote
      };

      this.saveProfile();
      this.updateHeader();
      this.updateTrayIcon();

      // Update main window dropdown and dot
      if (this.mainContentEl) {
        const select = this.mainContentEl.querySelector('#icq-status-select');
        const dot = this.mainContentEl.querySelector('#icq-my-status-dot');
        if (select) select.value = newStatus;
        if (dot) dot.className = `icq-status-dot ${newStatus}`;
      }

      if (window.soundSys) window.soundSys.playDing();
      window.winManager.closeWindow(dialogId);
    });

    // Cancel
    content.querySelector('#btn-close-profile').addEventListener('click', () => {
      window.winManager.closeWindow(dialogId);
    });
  }

  // --- Dialog: User Info Profile for any contact ---
  openUserInfoDialog(contact) {
    const dialogId = `icq_user_info_${contact.id}`;
    if (window.winManager && window.winManager.windows.has(dialogId)) {
      window.winManager.bringToTop(dialogId);
      return;
    }

    const content = document.createElement('div');
    content.className = 'icq-tab-container';
    content.innerHTML = `
      <div class="icq-tab-headers">
        <button class="icq-tab-btn active" data-tab="uinfo-main">Основное</button>
        <button class="icq-tab-btn" data-tab="uinfo-about">О пользователе</button>
        <button class="icq-tab-btn" data-tab="uinfo-status">Статус</button>
      </div>

      <div class="icq-tab-pane active" id="uinfo-main">
        <div class="icq-form-row">
          <span class="icq-form-label">UIN (Номер ICQ):</span>
          <input type="text" class="icq-form-input" value="${contact.uin}" readonly style="font-weight:bold; font-family:'Courier New', monospace;">
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">Никнейм:</span>
          <input type="text" class="icq-form-input" id="inp-uinfo-nick" value="${contact.nick}">
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">Полное имя:</span>
          <input type="text" class="icq-form-input" value="${contact.name || '-'}" readonly>
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">E-mail:</span>
          <input type="text" class="icq-form-input" value="${contact.email || '-'}" readonly>
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">Группа:</span>
          <select class="icq-form-input" id="inp-uinfo-group">
            <option value="Коллеги и Сеть" ${contact.group === 'Коллеги и Сеть' ? 'selected' : ''}>Коллеги и Сеть</option>
            <option value="Друзья" ${contact.group === 'Друзья' ? 'selected' : ''}>Друзья</option>
            <option value="Интернет & Фидонет" ${contact.group === 'Интернет & Фидонет' ? 'selected' : ''}>Интернет & Фидонет</option>
          </select>
        </div>
      </div>

      <div class="icq-tab-pane" id="uinfo-about">
        <div class="icq-form-row">
          <span class="icq-form-label">Город:</span>
          <input type="text" class="icq-form-input" value="${contact.city || '-'}" readonly>
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">Страна:</span>
          <input type="text" class="icq-form-input" value="${contact.country || '-'}" readonly>
        </div>
        <div class="icq-form-row">
          <span class="icq-form-label">Возраст / Пол:</span>
          <input type="text" class="icq-form-input" value="${contact.age || '-'} лет / ${contact.gender || '-'}" readonly>
        </div>
        <div class="icq-form-row" style="align-items:flex-start;">
          <span class="icq-form-label">Интересы:</span>
          <textarea class="icq-form-input" rows="3" readonly style="resize:none;">${contact.interests || '-'}</textarea>
        </div>
      </div>

      <div class="icq-tab-pane" id="uinfo-status">
        <div class="icq-form-row">
          <span class="icq-form-label">Текущий статус:</span>
          <span style="font-weight:bold; display:flex; align-items:center; gap:6px;">
            <span class="icq-status-dot ${contact.status}"></span>
            ${contact.status.toUpperCase()}
          </span>
        </div>
        <div class="icq-form-row" style="align-items:flex-start;">
          <span class="icq-form-label">Записка статуса:</span>
          <div style="flex:1; padding:4px 6px; background:#fff; border:2px inset #fff; font-style:italic;">
            ${contact.statusNote || '(нет статусной записки)'}
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-top:8px;">
        <button class="win-btn" id="btn-uinfo-msg" style="font-weight:bold;">💬 Открыть чат</button>
        <div style="display:flex; gap:6px;">
          <button class="win-btn" id="btn-uinfo-save" style="min-width:75px;">Сохранить</button>
          <button class="win-btn" id="btn-uinfo-close" style="min-width:70px;">Закрыть</button>
        </div>
      </div>
    `;

    content.querySelectorAll('.icq-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.icq-tab-btn').forEach(b => b.classList.remove('active'));
        content.querySelectorAll('.icq-tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = content.querySelector(`#${btn.dataset.tab}`);
        if (target) target.classList.add('active');
      });
    });

    const win = window.winManager.createWindow({
      id: dialogId,
      title: `Сведения о пользователе - ${contact.nick} (#${contact.uin})`,
      icon: 'icq-online',
      width: 380,
      height: 310,
      resizable: false,
      content
    });

    content.querySelector('#btn-uinfo-msg').addEventListener('click', () => {
      window.winManager.closeWindow(dialogId);
      this.openChat(contact);
    });

    content.querySelector('#btn-uinfo-save').addEventListener('click', () => {
      const newNick = content.querySelector('#inp-uinfo-nick').value.trim();
      const newGroup = content.querySelector('#inp-uinfo-group').value;
      if (newNick) contact.nick = newNick;
      if (newGroup) contact.group = newGroup;
      this.saveContacts();
      if (this.mainContentEl) {
        this.renderContacts(this.mainContentEl);
      }
      if (window.soundSys) window.soundSys.playDing();
      window.winManager.closeWindow(dialogId);
    });

    content.querySelector('#btn-uinfo-close').addEventListener('click', () => {
      window.winManager.closeWindow(dialogId);
    });
  }

  // --- Dialog: Find / Add Users Wizard ---
  openAddUserWizard() {
    const dialogId = 'icq_add_user_wizard';
    if (window.winManager && window.winManager.windows.has(dialogId)) {
      window.winManager.bringToTop(dialogId);
      return;
    }

    const directory = this.getDirectoryUsers();
    const content = document.createElement('div');
    content.className = 'icq-tab-container';
    content.innerHTML = `
      <div style="margin-bottom:8px; font-weight:bold; color:#000080; border-bottom:1px solid #808080; padding-bottom:4px;">
        🔍 Мастер поиска и добавления пользователей ICQ White Pages
      </div>

      <div style="display:flex; gap:6px; margin-bottom:8px;">
        <input type="text" class="icq-form-input" id="inp-search-term" placeholder="Поиск по никнейму, UIN или интересам...">
        <button class="win-btn" id="btn-search-exec" style="font-weight:bold;">Найти</button>
      </div>

      <div style="flex:1; overflow-y:auto; margin-bottom:8px; border:2px inset #fff; background:#fff;">
        <table class="icq-search-table" id="icq-search-results">
          <thead>
            <tr>
              <th style="width:25px;"></th>
              <th>Никнейм</th>
              <th>UIN</th>
              <th>Город</th>
              <th>О себе</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>

      <div style="background:#d4d0c8; border:1px inset #fff; padding:6px; margin-bottom:8px;">
        <div style="font-weight:bold; margin-bottom:4px;">Прямой ввод UIN (если знаете номер):</div>
        <div style="display:flex; gap:6px; align-items:center;">
          <input type="text" class="icq-form-input" id="inp-custom-uin" placeholder="UIN (напр. 349120)" style="width:110px;">
          <input type="text" class="icq-form-input" id="inp-custom-nick" placeholder="Имя / Никнейм" style="flex:1;">
          <select class="icq-form-input" id="sel-custom-group" style="width:130px;">
            <option value="Друзья">Группа: Друзья</option>
            <option value="Коллеги и Сеть">Коллеги и Сеть</option>
            <option value="Интернет & Фидонет">Интернет & Фидонет</option>
          </select>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:10px; color:#555;" id="search-status-label">Найдено в каталоге: ${directory.length}</span>
        <div style="display:flex; gap:6px;">
          <button class="win-btn" id="btn-add-selected" style="font-weight:bold; min-width:90px;">Добавить</button>
          <button class="win-btn" id="btn-close-wizard" style="min-width:70px;">Закрыть</button>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: dialogId,
      title: 'Поиск и добавление пользователей ICQ 98a',
      icon: 'icq-online',
      width: 480,
      height: 380,
      resizable: true,
      content
    });

    let selectedRowUser = null;
    const tbody = content.querySelector('#icq-search-results tbody');

    const renderTable = (list) => {
      tbody.innerHTML = '';
      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#777;">Пользователи не найдены. Попробуйте другой запрос.</td></tr>`;
        return;
      }
      list.forEach(u => {
        const tr = document.createElement('tr');
        const isAdded = this.contacts.some(c => c.uin === u.uin);
        tr.innerHTML = `
          <td style="text-align:center;"><span class="icq-status-dot ${u.status}"></span></td>
          <td style="font-weight:bold;">${u.nick} ${isAdded ? '<span style="color:#008000; font-size:9px;">(в списке)</span>' : ''}</td>
          <td style="font-family:'Courier New', monospace;">${u.uin}</td>
          <td>${u.city}</td>
          <td style="font-size:10px; color:#555;">${u.note}</td>
        `;

        tr.addEventListener('click', () => {
          tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
          tr.classList.add('selected');
          selectedRowUser = u;
        });

        tbody.appendChild(tr);
      });
    };

    renderTable(directory);

    // Search filter
    const performSearch = () => {
      const q = content.querySelector('#inp-search-term').value.trim().toLowerCase();
      if (!q) {
        renderTable(directory);
        content.querySelector('#search-status-label').textContent = `Найдено в каталоге: ${directory.length}`;
        return;
      }
      const filtered = directory.filter(u =>
        u.nick.toLowerCase().includes(q) ||
        u.uin.includes(q) ||
        u.city.toLowerCase().includes(q) ||
        (u.interests && u.interests.toLowerCase().includes(q))
      );
      renderTable(filtered);
      content.querySelector('#search-status-label').textContent = `Найдено: ${filtered.length}`;
    };

    content.querySelector('#btn-search-exec').addEventListener('click', performSearch);
    content.querySelector('#inp-search-term').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });

    // Add selected from directory or custom input
    content.querySelector('#btn-add-selected').addEventListener('click', () => {
      const customUin = content.querySelector('#inp-custom-uin').value.trim();
      const customNick = content.querySelector('#inp-custom-nick').value.trim();
      const customGroup = content.querySelector('#sel-custom-group').value;

      if (customUin) {
        // Direct custom user
        if (this.contacts.some(c => c.uin === customUin)) {
          window.winManager.openDialog({
            title: 'ICQ 98a',
            icon: 'info',
            message: `Пользователь с UIN #${customUin} уже есть в вашем контакт-листе.`
          });
          return;
        }

        const newContact = {
          id: 'user_' + Date.now(),
          nick: customNick || `User_${customUin}`,
          uin: customUin,
          name: customNick || `User ${customUin}`,
          email: `${customUin}@chat.ru`,
          city: 'Интернет',
          country: 'Россия',
          age: '20',
          gender: 'Пользователь',
          interests: 'ICQ 98a, Интернет, Общение',
          status: 'online',
          statusNote: 'Только что добавлен в контакт-лист',
          group: customGroup,
          unread: false,
          messages: [
            { sender: 'them', time: 'Сейчас', text: 'Привет! Спасибо, что добавил меня в ICQ 98a!' }
          ],
          replies: [
            'Привет! Рад знакомству в ICQ!',
            'У тебя какой модем? У меня USRobotics!',
            'Слушаю музыку и сижу в чате, как твои дела?'
          ]
        };

        this.contacts.push(newContact);
        this.saveContacts();
        if (this.mainContentEl) {
          this.renderContacts(this.mainContentEl);
        }
        if (window.soundSys && typeof window.soundSys.playIcqKnock === 'function') {
          window.soundSys.playIcqKnock();
        }

        window.winManager.openDialog({
          title: 'Контакт добавлен',
          icon: 'info',
          message: `Пользователь <b>${newContact.nick}</b> (#${newContact.uin}) успешно добавлен в группу <b>${customGroup}</b>!`
        });

        window.winManager.closeWindow(dialogId);
        return;
      }

      if (selectedRowUser) {
        if (this.contacts.some(c => c.uin === selectedRowUser.uin)) {
          window.winManager.openDialog({
            title: 'ICQ 98a',
            icon: 'info',
            message: `Пользователь <b>${selectedRowUser.nick}</b> уже добавлен в ваш список контактов.`
          });
          return;
        }

        const newContact = {
          id: 'user_' + Date.now(),
          nick: selectedRowUser.nick,
          uin: selectedRowUser.uin,
          name: selectedRowUser.name,
          email: `${selectedRowUser.uin}@mirabilis.icq`,
          city: selectedRowUser.city,
          country: 'Россия',
          age: '21',
          gender: 'Пользователь',
          interests: selectedRowUser.interests,
          status: selectedRowUser.status,
          statusNote: selectedRowUser.note,
          group: customGroup || 'Интернет & Фидонет',
          unread: false,
          messages: [
            { sender: 'them', time: 'Сейчас', text: `Привет! Я ${selectedRowUser.nick}. Рад тебя видеть в ICQ 98a!` }
          ],
          replies: [
            'Привет! Чем занимаешься в сети?',
            'Отличная погода сегодня для прогулок!',
            'Сейчас дочитаю новости и отвечу подробнее :)'
          ]
        };

        this.contacts.push(newContact);
        this.saveContacts();
        if (this.mainContentEl) {
          this.renderContacts(this.mainContentEl);
        }
        if (window.soundSys && typeof window.soundSys.playIcqKnock === 'function') {
          window.soundSys.playIcqKnock();
        }

        window.winManager.openDialog({
          title: 'Контакт добавлен',
          icon: 'info',
          message: `Пользователь <b>${newContact.nick}</b> (#${newContact.uin}) успешно добавлен в ваш контакт-лист!`
        });

        window.winManager.closeWindow(dialogId);
        return;
      }

      window.winManager.openDialog({
        title: 'Внимание',
        icon: 'warning',
        message: 'Пожалуйста, выберите пользователя из таблицы или введите UIN вручную.'
      });
    });

    content.querySelector('#btn-close-wizard').addEventListener('click', () => {
      window.winManager.closeWindow(dialogId);
    });
  }

  // --- Enhanced Chat Window ---
  openChat(contact) {
    const chatId = `app_icq_chat_${contact.id}`;
    if (window.winManager && window.winManager.windows.has(chatId)) {
      window.winManager.bringToTop(chatId);
      return;
    }

    contact.unread = false;
    this.saveContacts();
    if (this.mainContentEl) {
      this.renderContacts(this.mainContentEl);
    }

    const content = document.createElement('div');
    content.className = 'icq-chat-window';
    content.innerHTML = `
      <div class="icq-chat-contact-bar">
        <div class="icq-chat-contact-title">
          <span class="icq-status-dot ${contact.status}"></span>
          <span>${contact.nick} (#${contact.uin})</span>
        </div>
        <div class="icq-chat-contact-status-note" title="${contact.statusNote || ''}">
          ${contact.statusNote || ''}
        </div>
      </div>

      <div class="icq-chat-toolbar">
        <button class="win-btn" id="btn-chat-info-${contact.id}">👤 Инфо</button>
        <button class="win-btn" id="btn-chat-file-${contact.id}">📁 Файл</button>
        <button class="win-btn" id="btn-chat-smiles-${contact.id}">😊 Смайлы</button>
        <button class="win-btn" id="btn-chat-clear-${contact.id}">🧹 Очистить</button>
        <button class="win-btn" id="btn-chat-history-${contact.id}">📜 Лог</button>
      </div>

      <div class="icq-emoticons-bar" id="icq-smiles-bar-${contact.id}" style="display:none;">
        <button class="icq-emoticon-btn">:-)</button>
        <button class="icq-emoticon-btn">;-)</button>
        <button class="icq-emoticon-btn">:-D</button>
        <button class="icq-emoticon-btn">:-P</button>
        <button class="icq-emoticon-btn">8-)</button>
        <button class="icq-emoticon-btn">:-(</button>
        <button class="icq-emoticon-btn">:-*</button>
        <button class="icq-emoticon-btn">O_o</button>
        <button class="icq-emoticon-btn">:-O</button>
        <button class="icq-emoticon-btn">>:-(</button>
      </div>

      <div class="icq-chat-history" id="icq-history-${contact.id}"></div>

      <div class="icq-typing-indicator" id="icq-typing-${contact.id}">
        ${contact.nick} печатает ответ...
      </div>

      <div class="icq-chat-input-row">
        <input type="text" class="icq-chat-input" id="icq-input-${contact.id}" placeholder="Введите сообщение и нажмите Enter...">
        <button class="win-btn btn-icq-send" style="font-weight:bold; min-width:70px;">Послать</button>
      </div>
    `;

    const chatWin = window.winManager.createWindow({
      id: chatId,
      title: `${contact.nick} (${contact.uin}) - Сообщение ICQ`,
      icon: 'icq-online',
      width: 400,
      height: 330,
      resizable: true,
      content,
      onClose: () => {
        this.chatWindows.delete(contact.id);
      }
    });

    this.chatWindows.set(contact.id, chatWin);
    this.renderChatHistory(contact);

    const input = content.querySelector(`#icq-input-${contact.id}`);
    const btnSend = content.querySelector('.btn-icq-send');
    const smilesBar = content.querySelector(`#icq-smiles-bar-${contact.id}`);
    const typingBar = content.querySelector(`#icq-typing-${contact.id}`);

    content.querySelector(`#btn-chat-info-${contact.id}`).addEventListener('click', () => {
      this.openUserInfoDialog(contact);
    });

    content.querySelector(`#btn-chat-file-${contact.id}`).addEventListener('click', () => {
      this.openFileTransferDialog(contact);
    });

    content.querySelector(`#btn-chat-smiles-${contact.id}`).addEventListener('click', () => {
      smilesBar.style.display = smilesBar.style.display === 'none' ? 'flex' : 'none';
    });

    content.querySelector(`#btn-chat-clear-${contact.id}`).addEventListener('click', () => {
      contact.messages = [];
      this.saveContacts();
      this.renderChatHistory(contact);
    });

    content.querySelector(`#btn-chat-history-${contact.id}`).addEventListener('click', () => {
      this.openContactHistoryDialog(contact);
    });

    smilesBar.querySelectorAll('.icq-emoticon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value += (input.value ? ' ' : '') + btn.textContent;
        input.focus();
      });
    });

    const formatCurrentTime = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      return `${h}:${m}:${s}`;
    };

    const sendMessage = () => {
      const text = input.value.trim();
      if (!text) return;

      const time = formatCurrentTime();
      contact.messages.push({ sender: 'me', time, text });
      input.value = '';
      this.saveContacts();
      this.renderChatHistory(contact);

      if (this.soundEnabled && window.soundSys && typeof window.soundSys.playIcqSend === 'function') {
        window.soundSys.playIcqSend();
      } else if (window.soundSys) {
        window.soundSys.playClick();
      }

      if (contact.status === 'offline') {
        setTimeout(() => {
          contact.messages.push({
            sender: 'system',
            time: formatCurrentTime(),
            text: `Сообщение сохранено на сервере ICQ. Пользователь ${contact.nick} получит его при следующем входе в сеть.`
          });
          this.saveContacts();
          this.renderChatHistory(contact);
        }, 800);
        return;
      }

      typingBar.classList.add('active');

      const replyDelay = 1200 + Math.floor(Math.random() * 800);
      setTimeout(() => {
        typingBar.classList.remove('active');
        let reply = '';
        if (contact.id === 'clippy' && window.appClippy) {
          reply = window.appClippy.icqReply(text);
        } else if (contact.id === 'dima_web') {
          const lower = text.toLowerCase();
          if (lower.includes('где') || lower.includes('ссылк') || lower.includes('адрес') || lower.includes('url') || lower.includes('линк') || lower.includes('сайт')) {
            reply = 'Лови прямую ссылку на мой сайт: http://www.geocities.com/dima_web/ — кликай прямо сюда, он откроется в Internet Explorer!';
          } else if (lower.includes('ребенок') || lower.includes('бейби') || lower.includes('baby') || lower.includes('гиф') || lower.includes('танец')) {
            reply = 'Танцующий ребенок ждет тебя тут: http://www.geocities.com/dima_web/ ! Он зажигает в центре страницы, можно менять скорость!';
          } else if (lower.includes('счетчик') || lower.includes('посетител')) {
            reply = 'Счетчик посещений крутится на http://www.geocities.com/dima_web/ ! Я его на Perl закодил, тикает каждый визит.';
          } else if (lower.includes('музык') || lower.includes('midi') || lower.includes('миди') || lower.includes('песн') || lower.includes('звук')) {
            reply = 'Фоновую MIDI-мелодию можно включить кнопкой прямо на сайте: http://www.geocities.com/dima_web/ — играет трек Руки Вверх!';
          } else if (lower.includes('книг') || lower.includes('отзыв') || lower.includes('гостев')) {
            reply = 'Обязательно оставь мне запись в гостевой книге на http://www.geocities.com/dima_web/ !';
          } else {
            const replyPool = contact.replies && contact.replies.length > 0 ? contact.replies : [
              'Смотри мой сайт: http://www.geocities.com/dima_web/ !'
            ];
            reply = replyPool[Math.floor(Math.random() * replyPool.length)];
          }
        } else {
          const replyPool = contact.replies && contact.replies.length > 0 ? contact.replies : [
            'Привет! Я тут!',
            'Интересно!',
            'Слушай, а давай попозже спишемся?'
          ];
          reply = replyPool[Math.floor(Math.random() * replyPool.length)];
        }

        contact.messages.push({ sender: 'them', time: formatCurrentTime(), text: reply });
        this.saveContacts();
        this.renderChatHistory(contact);

        if (this.soundEnabled && window.soundSys && typeof window.soundSys.playIcqUhOh === 'function') {
          window.soundSys.playIcqUhOh();
        }
      }, replyDelay);
    };

    btnSend.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    setTimeout(() => input.focus(), 60);
  }

  ensureContact(data) {
    if (!data || !data.id) return null;
    let contact = this.contacts.find(c => c.id === data.id);
    if (!contact) {
      contact = JSON.parse(JSON.stringify(data));
      this.contacts.push(contact);
      this.saveContacts();
      if (this.mainContentEl) this.renderContacts(this.mainContentEl);
    }
    return contact;
  }

  setContactStatus(id, status, note) {
    const contact = this.contacts.find(c => c.id === id);
    if (!contact || (contact.status === status && contact.statusNote === note)) return false;
    contact.status = status;
    contact.statusNote = note;
    this.saveContacts();
    if (this.mainContentEl) this.renderContacts(this.mainContentEl);
    return true;
  }

  receiveMessage(id, text) {
    const contact = this.contacts.find(c => c.id === id);
    if (!contact) return false;
    const d = new Date();
    const time = [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
    contact.messages.push({ sender: 'them', time, text });
    contact.unread = !document.getElementById(`icq-history-${contact.id}`);
    this.saveContacts();
    this.renderChatHistory(contact);
    if (this.mainContentEl) this.renderContacts(this.mainContentEl);
    if (this.soundEnabled && window.soundSys && typeof window.soundSys.playIcqUhOh === 'function') window.soundSys.playIcqUhOh();
    return true;
  }

  renderChatHistory(contact) {
    const historyEl = document.getElementById(`icq-history-${contact.id}`);
    if (!historyEl) return;

    historyEl.innerHTML = '';
    contact.messages.forEach(msg => {
      if (msg.sender === 'system') {
        const sys = document.createElement('div');
        sys.className = 'icq-msg-system';
        sys.textContent = `[${msg.time || ''}] *** ${msg.text}`;
        historyEl.appendChild(sys);
        return;
      }

      const bubble = document.createElement('div');
      bubble.className = `icq-msg-bubble ${msg.sender === 'me' ? 'me' : 'them'}`;
      const senderName = msg.sender === 'me' ? this.profile.nick : contact.nick;
      bubble.innerHTML = `
        <span class="timestamp">[${msg.time || '12:00:00'}]</span>
        <span class="sender">${senderName}:</span>
        <span class="text">${this.formatMessageText(msg.text)}</span>
      `;
      historyEl.appendChild(bubble);
    });

    // Make URL links clickable
    historyEl.querySelectorAll('.icq-chat-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = link.dataset.url;
        if (window.appIE) {
          window.appIE.open(url);
        }
      });
    });

    historyEl.scrollTop = historyEl.scrollHeight;
  }

  formatMessageText(str) {
    if (!str) return '';
    const safe = this.escapeHtml(str);
    return safe.replace(/(https?:\/\/[^\s]+)/g, (match) => {
      return `<a href="#" class="icq-chat-link" data-url="${match}" style="color:#0000cc; font-weight:bold; text-decoration:underline; cursor:pointer;" title="Открыть в Internet Explorer: ${match}">${match}</a>`;
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // --- File Transfer Simulator Dialog ---
  openFileTransferDialog(contact) {
    const dialogId = `icq_file_transfer_${Date.now()}`;
    const files = [
      { name: 'patch_1.10.zip', size: '1.42 MB' },
      { name: 'quake2_autoexec.cfg', size: '24 KB' },
      { name: 'track01_prodigy.mp3', size: '3.85 MB' },
      { name: 'mirabilis_skin.dll', size: '512 KB' },
      { name: 'photo_arbat98.jpg', size: '340 KB' }
    ];
    const pickedFile = files[Math.floor(Math.random() * files.length)];

    const content = document.createElement('div');
    content.className = 'icq-tab-container';
    content.innerHTML = `
      <div style="font-weight:bold; color:#000080; margin-bottom:8px;">
        📁 Передача файла через прямое соединение ICQ (P2P)
      </div>

      <div class="icq-transfer-box">
        <div><b>Получатель:</b> ${contact.nick} (#${contact.uin})</div>
        <div><b>Файл:</b> <span style="font-family:'Courier New', monospace; font-weight:bold;">${pickedFile.name}</span> (${pickedFile.size})</div>
        <div id="transfer-speed-lbl" style="color:#555; font-size:10px; margin-top:3px;">Скорость: 5.4 KB/s (56k V.90 Modem)</div>
      </div>

      <div class="icq-progress-track">
        <div class="icq-progress-bar" id="icq-pbar"></div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <span id="icq-transfer-pct" style="font-weight:bold; font-size:11px;">0% завершено</span>
        <button class="win-btn" id="btn-cancel-transfer" style="min-width:70px;">Отмена</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: dialogId,
      title: `Отправка файла: ${pickedFile.name}`,
      icon: 'icq-online',
      width: 340,
      height: 200,
      resizable: false,
      content
    });

    const pbar = content.querySelector('#icq-pbar');
    const pctLbl = content.querySelector('#icq-transfer-pct');
    const btnCancel = content.querySelector('#btn-cancel-transfer');

    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += Math.floor(Math.random() * 14) + 6;
      if (currentPct >= 100) {
        currentPct = 100;
        clearInterval(interval);
        pbar.style.width = '100%';
        pctLbl.textContent = '100% Передача завершена!';
        btnCancel.textContent = 'Закрыть';
        btnCancel.style.fontWeight = 'bold';

        if (this.soundEnabled && window.soundSys && typeof window.soundSys.playIcqFileDone === 'function') {
          window.soundSys.playIcqFileDone();
        }

        // Add note in chat
        contact.messages.push({
          sender: 'system',
          time: new Date().toLocaleTimeString(),
          text: `Файл "${pickedFile.name}" (${pickedFile.size}) успешно отправлен пользователю ${contact.nick}.`
        });
        this.saveContacts();
        this.renderChatHistory(contact);
      } else {
        pbar.style.width = `${currentPct}%`;
        pctLbl.textContent = `${currentPct}% передано...`;
      }
    }, 220);

    btnCancel.addEventListener('click', () => {
      clearInterval(interval);
      window.winManager.closeWindow(dialogId);
    });
  }

  // --- Message History Logs ---
  openContactHistoryDialog(contact) {
    const dialogId = `icq_history_${contact.id}`;
    const content = document.createElement('div');
    content.className = 'icq-tab-container';
    content.innerHTML = `
      <div style="font-weight:bold; margin-bottom:6px;">История переписки с ${contact.nick} (#${contact.uin}):</div>
      <div style="flex:1; background:#fff; border:2px inset #fff; padding:6px; overflow-y:auto; font-family:'Courier New', monospace; font-size:11px; white-space:pre-wrap;">${
        contact.messages.length > 0
          ? contact.messages.map(m => `[${m.time || ''}] <${m.sender === 'me' ? this.profile.nick : contact.nick}>: ${m.text}`).join('\n')
          : '(История пуста)'
      }</div>
      <div style="display:flex; justify-content:flex-end; margin-top:8px;">
        <button class="win-btn" onclick="window.winManager.closeWindow('${dialogId}')">Закрыть</button>
      </div>
    `;

    window.winManager.createWindow({
      id: dialogId,
      title: `Журнал сообщений: ${contact.nick}`,
      icon: 'notepad',
      width: 420,
      height: 320,
      resizable: true,
      content
    });
  }

  openAllHistoryDialog() {
    const dialogId = 'icq_all_history';
    const content = document.createElement('div');
    content.className = 'icq-tab-container';

    let fullLog = `=== Журнал сообщений Mirabilis ICQ 98a ===\nПользователь: ${this.profile.nick} (#${this.profile.uin})\n\n`;
    this.contacts.forEach(c => {
      if (c.messages.length > 0) {
        fullLog += `--- Чат с ${c.nick} (#${c.uin}) [Группа: ${c.group}] ---\n`;
        c.messages.forEach(m => {
          fullLog += `[${m.time || ''}] <${m.sender === 'me' ? this.profile.nick : c.nick}>: ${m.text}\n`;
        });
        fullLog += '\n';
      }
    });

    content.innerHTML = `
      <div style="font-weight:bold; margin-bottom:6px;">Полный архив сообщений ICQ 98a:</div>
      <div style="flex:1; background:#fff; border:2px inset #fff; padding:6px; overflow-y:auto; font-family:'Courier New', monospace; font-size:11px; white-space:pre-wrap;">${this.escapeHtml(fullLog)}</div>
      <div style="display:flex; justify-content:flex-end; margin-top:8px;">
        <button class="win-btn" onclick="window.winManager.closeWindow('${dialogId}')">Закрыть</button>
      </div>
    `;

    window.winManager.createWindow({
      id: dialogId,
      title: 'Архив всех сообщений ICQ',
      icon: 'notepad',
      width: 460,
      height: 340,
      resizable: true,
      content
    });
  }

  // --- About Dialog ---
  openAboutDialog() {
    window.winManager.openDialog({
      title: 'О программе ICQ 98a',
      icon: 'icq-online',
      message: `
        <b>Mirabilis ICQ 98a (Alpha Release)</b><br>
        Революционный интернет-пейджер эпохи Win 98.<br><br>
        <b>Текущий UIN:</b> #${this.profile.uin}<br>
        <b>Пользователь:</b> ${this.profile.nick} (${this.profile.email})<br>
        <b>Сервер:</b> icq.mirabilis.com (Port 5190)<br><br>
        Copyright &copy; 1996-1998 Mirabilis Ltd. All rights reserved.
      `
    });
  }
}

window.appICQ = new AppICQ();
