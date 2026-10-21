class ClippyWardrobe {
  constructor() {
    this.storageKey = 'win98_clippy_wardrobe';
    this.slots = [
      { id: 'head', name: 'Головные уборы', icon: '🎩' },
      { id: 'eyes', name: 'Очки', icon: '👓' },
      { id: 'mouth', name: 'Усы и борода', icon: '🥸' },
      { id: 'neck', name: 'Галстуки и шея', icon: '👔' },
      { id: 'accessory', name: 'Аксессуары', icon: '💼' }
    ];
    this.layerOrder = ['neck', 'mouth', 'eyes', 'head', 'accessory'];

    this.items = [
      {
        id: 'tophat', slot: 'head', name: 'Цилиндр джентльмена', file: 'TOPHAT.ACS', sizeKb: 18, badge: 'HOT',
        desc: 'Чёрный шёлковый цилиндр с алой лентой. Для деловых писем и торжественных таблиц Excel.',
        quip: 'Весьма элегантно! Теперь я готов помогать вам с письмами королеве.',
        svg: '<rect x="28" y="-14" width="20" height="21" fill="#111827" stroke="#000" stroke-width="1"/>' +
             '<rect x="28" y="1" width="20" height="4" fill="#dc2626"/>' +
             '<rect x="30" y="-12" width="3" height="12" fill="#374151"/>' +
             '<ellipse cx="38" cy="7.5" rx="17" ry="3" fill="#111827" stroke="#000" stroke-width="1"/>'
      },
      {
        id: 'party', slot: 'head', name: 'Праздничный колпак', file: 'PARTY.ACS', sizeKb: 12,
        desc: 'Бумажный колпак с помпоном — для дней рождения, Нового года и успешной дефрагментации.',
        quip: 'Ура! У нас праздник? Давайте запустим «Косынку» в честь этого!',
        svg: '<polygon points="26,9 50,9 38,-16" fill="#ec4899" stroke="#831843" stroke-width="1"/>' +
             '<path d="M30 1 L46 1 M33 -6 L43 -6" stroke="#fde047" stroke-width="2"/>' +
             '<circle cx="38" cy="-16" r="3.2" fill="#fde047" stroke="#a16207" stroke-width="0.8"/>'
      },
      {
        id: 'propeller', slot: 'head', name: 'Кепка с пропеллером', file: 'PROPCAP.ACS', sizeKb: 21, badge: 'NEW',
        desc: 'Разноцветная кепка настоящего хакера. Пропеллер крутится от воздушного потока кулера Pentium II.',
        quip: 'Взлетаю! Если что — я полетел проверять обновления.',
        svg: '<path d="M22 10 A16 13 0 0 1 54 10 Z" fill="#ef4444" stroke="#000" stroke-width="1"/>' +
             '<path d="M38 -3 L38 10 M29 -0.5 Q31 5 30 10 M47 -0.5 Q45 5 46 10" stroke="#facc15" stroke-width="2.2" fill="none"/>' +
             '<path d="M52 10 Q60 10 62 13 L50 12 Z" fill="#2563eb" stroke="#000" stroke-width="0.8"/>' +
             '<line x1="38" y1="-3" x2="38" y2="-7" stroke="#111" stroke-width="1.4"/>' +
             '<ellipse cx="38" cy="-7.5" rx="11" ry="1.8" fill="#2563eb" stroke="#1e3a8a" stroke-width="0.6">' +
             '<animate attributeName="rx" values="11;1.5;11" dur="0.3s" repeatCount="indefinite"/></ellipse>' +
             '<circle cx="38" cy="-7.5" r="1.4" fill="#facc15"/>'
      },
      {
        id: 'ushanka', slot: 'head', name: 'Ушанка «Зима 98»', file: 'USHANKA.ACS', sizeKb: 24,
        desc: 'Тёплая меховая шапка-ушанка с красной звездой. Для работы в неотапливаемых серверных.',
        quip: 'Тепло и надёжно! Теперь мне не страшен даже сквозняк из дисковода.',
        svg: '<path d="M20 11 Q38 -14 56 11 Z" fill="#7c4a1e" stroke="#3b2314" stroke-width="1"/>' +
             '<rect x="14" y="9" width="7" height="17" rx="3" fill="#d6c3a5" stroke="#8b7355" stroke-width="0.8"/>' +
             '<rect x="55" y="9" width="7" height="17" rx="3" fill="#d6c3a5" stroke="#8b7355" stroke-width="0.8"/>' +
             '<rect x="17" y="5" width="42" height="8" rx="4" fill="#e7dcc7" stroke="#8b7355" stroke-width="0.8"/>' +
             '<polygon points="38,5.2 39.2,8 42.2,8 39.8,9.8 40.7,12.6 38,10.9 35.3,12.6 36.2,9.8 33.8,8 36.8,8" fill="#dc2626"/>'
      },
      {
        id: 'santa', slot: 'head', name: 'Колпак Деда Мороза', file: 'SANTA.ACS', sizeKb: 16,
        desc: 'Красный колпак с белой опушкой. Надевается 31 декабря — в ожидании проблемы 2000 года.',
        quip: 'Хо-хо-хо! Кто был хорошим пользователем и регулярно сохранял файлы?',
        svg: '<path d="M24 8 C26 -8 44 -15 59 -5 L52 8 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1"/>' +
             '<rect x="21" y="4" width="34" height="7" rx="3.5" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8"/>' +
             '<circle cx="59" cy="-5" r="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8"/>'
      },
      {
        id: 'wizard', slot: 'head', name: 'Шляпа Мерлина', file: 'WIZARD.ACS', sizeKb: 20,
        desc: 'Звёздный колпак волшебника — подарок от коллеги Мерлина из Microslop Agent.',
        quip: 'Абракадабра! Превращаю ваш документ .DOC в .RTF!',
        svg: '<polygon points="27,8 49,8 43,-21" fill="#1e40af" stroke="#172554" stroke-width="1"/>' +
             '<circle cx="36" cy="0" r="1.4" fill="#fde047"/><circle cx="43" cy="-8" r="1.1" fill="#fde047"/>' +
             '<circle cx="41" cy="3" r="1" fill="#fde047"/><circle cx="42" cy="-15" r="0.9" fill="#fde047"/>' +
             '<ellipse cx="38" cy="8" rx="19" ry="3.5" fill="#1e3a8a" stroke="#172554" stroke-width="1"/>'
      },
      {
        id: 'cowboy', slot: 'head', name: 'Ковбойская шляпа', file: 'COWBOY.ACS', sizeKb: 19,
        desc: 'Стетсон с загнутыми полями. Для настоящих ковбоев Дикого Веба.',
        quip: 'Йи-ха! На этом сервере слишком мало места для нас двоих, партнёр.',
        svg: '<path d="M27 8 Q25 -9 38 -6 Q51 -9 49 8 Z" fill="#b45309" stroke="#78350f" stroke-width="1"/>' +
             '<rect x="27" y="3" width="22" height="3" fill="#451a03"/>' +
             '<path d="M14 4 Q18 11 38 11 Q58 11 62 4 Q56 8 38 8 Q20 8 14 4 Z" fill="#92400e" stroke="#78350f" stroke-width="1"/>'
      },
      {
        id: 'pirate', slot: 'head', name: 'Треуголка пирата', file: 'PIRATE.ACS', sizeKb: 22,
        desc: 'Чёрная треуголка с золотым кантом и черепом. Куплена на лотке «700 игр на одном CD» у метро.',
        quip: 'Йо-хо-хо и болванка CD-R! Поднять паруса, идём на абордаж папки Downloads!',
        svg: '<path d="M13 9 Q24 -12 38 -11 Q52 -12 63 9 Q49 6 38 6 Q27 6 13 9 Z" fill="#111827" stroke="#facc15" stroke-width="1.2"/>' +
             '<circle cx="38" cy="-2" r="2.8" fill="#ffffff"/>' +
             '<rect x="36.2" y="0" width="3.6" height="2" fill="#ffffff"/>' +
             '<circle cx="37" cy="-2.3" r="0.7" fill="#111827"/><circle cx="39" cy="-2.3" r="0.7" fill="#111827"/>' +
             '<path d="M32 3 L44 -1 M32 -1 L44 3" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round"/>'
      },
      {
        id: 'hardhat', slot: 'head', name: 'Каска сисадмина', file: 'HARDHAT.ACS', sizeKb: 17, badge: 'NEW',
        desc: 'Жёлтая строительная каска для обжима витой пары под потолком и защиты от падающих стоек.',
        quip: 'Осторожно, в реестре ведутся монтажные работы! Каску не снимать до перезагрузки.',
        svg: '<path d="M21 8 A17 15 0 0 1 55 8 Z" fill="#facc15" stroke="#a16207" stroke-width="1"/>' +
             '<rect x="35" y="-8" width="6" height="15" rx="2" fill="#fde047" stroke="#ca8a04" stroke-width="0.7"/>' +
             '<rect x="17" y="7" width="42" height="3.2" rx="1.5" fill="#eab308" stroke="#a16207" stroke-width="0.9"/>' +
             '<polygon points="39,-4 36,1 38.5,1 37,5 41,0 38.5,0" fill="#dc2626"/>'
      },
      {
        id: 'beret', slot: 'head', name: 'Берет художника Paint', file: 'BERET.ACS', sizeKb: 15,
        desc: 'Бархатный бордовый берет набок. Помогает рисовать мышкой ровные круги и заливать фон с первого щелчка.',
        quip: 'О, месье! Этот градиент из 256 цветов достоин Лувра. Сохраним шедевр в .BMP?',
        svg: '<ellipse cx="35" cy="2" rx="18" ry="6.5" transform="rotate(-10 35 2)" fill="#9f1239" stroke="#4c0519" stroke-width="1"/>' +
             '<rect x="24" y="5" width="28" height="3.2" rx="1" fill="#1f2937" stroke="#000" stroke-width="0.7"/>' +
             '<path d="M34 -4 Q36 -9 39 -7" stroke="#4c0519" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
      },
      {
        id: 'viking', slot: 'head', name: 'Рогатый шлем викинга', file: 'VIKING.ACS', sizeKb: 23,
        desc: 'Кованый шлем с загнутыми рогами и заклёпками. Для тех, кто штурмует башни в Warcraft и чинит блок питания ударом кулака.',
        quip: 'За Одина и локальную сеть! Сегодня мы возьмём этот квартальный отчёт штурмом!',
        svg: '<path d="M19 6 Q9 -3 14 -12 Q16 -4 23 1" fill="#fef3c7" stroke="#78350f" stroke-width="1"/>' +
             '<path d="M57 6 Q67 -3 62 -12 Q60 -4 53 1" fill="#fef3c7" stroke="#78350f" stroke-width="1"/>' +
             '<path d="M22 9 A16 14 0 0 1 54 9 Z" fill="#64748b" stroke="#1e293b" stroke-width="1"/>' +
             '<rect x="21" y="6" width="34" height="3.5" rx="1" fill="#b45309" stroke="#451a03" stroke-width="0.8"/>' +
             '<rect x="36.5" y="-5" width="3" height="15" fill="#b45309" stroke="#451a03" stroke-width="0.7"/>'
      },
      {
        id: 'crown', slot: 'head', name: 'Золотая корона', file: 'CROWN.ACS', sizeKb: 32, badge: 'VIP',
        lock: 'quiz',
        desc: 'Корона короля олдфагов. Выдаётся только тем, кто ответил на все вопросы Ретро-Викторины Скрепыша.',
        quip: 'Я — король Office 97! Преклоните колени перед помощником!',
        svg: '<polygon points="24,9 24,-4 31,3 38,-9 45,3 52,-4 52,9" fill="#facc15" stroke="#a16207" stroke-width="1"/>' +
             '<rect x="24" y="5" width="28" height="4" fill="#eab308" stroke="#a16207" stroke-width="0.8"/>' +
             '<circle cx="31" cy="7" r="1.3" fill="#dc2626"/><circle cx="38" cy="7" r="1.5" fill="#2563eb"/><circle cx="45" cy="7" r="1.3" fill="#16a34a"/>' +
             '<circle cx="38" cy="-9" r="1.5" fill="#dc2626"/>'
      },

      {
        id: 'sunglasses', slot: 'eyes', name: 'Очки «Deal With It»', file: 'DEALWITH.ACS', sizeKb: 8,
        desc: 'Легендарные пиксельные солнцезащитные очки. Раньше выдавались только за победу в «Сапёре».',
        quip: 'Deal with it. 😎',
        svg: '<rect x="20" y="23" width="14" height="8" fill="#000000" stroke="#ffffff" stroke-width="1"/>' +
             '<rect x="37" y="23" width="14" height="8" fill="#000000" stroke="#ffffff" stroke-width="1"/>' +
             '<rect x="34" y="25" width="3" height="3" fill="#000000"/>' +
             '<rect x="22" y="25" width="2" height="2" fill="#ffffff"/>' +
             '<rect x="39" y="25" width="2" height="2" fill="#ffffff"/>'
      },
      {
        id: 'nerd', slot: 'eyes', name: 'Очки отличника', file: 'NERD.ACS', sizeKb: 10,
        desc: 'Круглые очки в роговой оправе, подклеенные изолентой. +10 к знанию MS-DOS.',
        quip: 'Кхм. Согласно справочной системе, вы нажали F1 уже 42 раза.',
        svg: '<circle cx="28" cy="26" r="7.5" fill="rgba(191,219,254,0.25)" stroke="#111827" stroke-width="2"/>' +
             '<circle cx="43" cy="26" r="7.5" fill="rgba(191,219,254,0.25)" stroke="#111827" stroke-width="2"/>' +
             '<rect x="33.8" y="23.5" width="3.4" height="4" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.6"/>'
      },
      {
        id: 'monocle', slot: 'eyes', name: 'Монокль', file: 'MONOCLE.ACS', sizeKb: 9,
        desc: 'Золотой монокль на цепочке. Идеально для чтения лицензионного соглашения мелким шрифтом.',
        quip: 'Любопытно... Весьма любопытно. Ваш реестр в полном порядке, сэр.',
        svg: '<circle cx="43" cy="26" r="8" fill="rgba(254,243,199,0.2)" stroke="#b45309" stroke-width="1.8"/>' +
             '<path d="M50 30 Q56 40 52 50" stroke="#d97706" stroke-width="0.9" fill="none" stroke-dasharray="1.5 1"/>'
      },
      {
        id: 'glasses3d', slot: 'eyes', name: 'Стереоочки 3D', file: '3DGLASS.ACS', sizeKb: 11, badge: 'NEW',
        desc: 'Красно-синие анаглифные очки из журнала «Игромания». Совместимы с 3dfx Voodoo2!',
        quip: 'Ого, всё в 3D! Ваш рабочий стол буквально выпрыгивает из монитора!',
        svg: '<rect x="19" y="21" width="33" height="11" rx="1.5" fill="#ffffff" stroke="#111" stroke-width="1"/>' +
             '<rect x="21" y="23" width="12" height="7" fill="rgba(239,68,68,0.75)"/>' +
             '<rect x="38" y="23" width="12" height="7" fill="rgba(6,182,212,0.75)"/>'
      },
      {
        id: 'eyepatch', slot: 'eyes', name: 'Пиратская повязка', file: 'EYEPATCH.ACS', sizeKb: 8, badge: 'NEW',
        desc: 'Чёрная кожаная повязка на ремешке. Спасает правый глаз от мерцания монитора на 60 Гц.',
        quip: 'Один глаз на ваш документ, другой смотрит за раздачей на FTP-сервере!',
        svg: '<path d="M22 15 L55 31" stroke="#111827" stroke-width="2" stroke-linecap="round"/>' +
             '<ellipse cx="43" cy="26" rx="7.2" ry="8.2" fill="#111827" stroke="#374151" stroke-width="1"/>' +
             '<path d="M40 22 Q43 20 46 22" stroke="#4b5563" stroke-width="1" fill="none"/>'
      },
      {
        id: 'cybervisor', slot: 'eyes', name: 'Кибер-визор 2000', file: 'VISOR2K.ACS', sizeKb: 13, badge: 'HOT',
        desc: 'Хромированный визор с бегущим лазерным лучом. Именно так в 1998 году представляют моду далёкого 2000-го.',
        quip: 'Сканирую жёсткий диск... Обнаружено 98% готовности отложить работу до понедельника.',
        svg: '<rect x="18" y="21" width="35" height="9" rx="3" fill="#0f172a" stroke="#94a3b8" stroke-width="1.3"/>' +
             '<rect x="20" y="24" width="31" height="3" fill="#064e3b"/>' +
             '<rect x="21" y="24" width="8" height="3" fill="#22c55e">' +
             '<animate attributeName="x" values="21;42;21" dur="1.4s" repeatCount="indefinite"/></rect>'
      },
      {
        id: 'vr98', slot: 'eyes', name: 'Шлем VFX1 Virtuality', file: 'VFX1VR.ACS', sizeKb: 26,
        desc: 'Массивный шлем виртуальной реальности с двумя ЖК-экранами 263×230. Шея устаёт через три минуты, зато будущее уже наступило.',
        quip: 'Ого! Я вижу трёхмерный рабочий стол! Правда, все иконки размером с кирпич.',
        svg: '<rect x="16" y="18" width="39" height="14" rx="3" fill="#475569" stroke="#0f172a" stroke-width="1.2"/>' +
             '<rect x="19" y="20.5" width="14" height="9" rx="1.5" fill="#0284c7" stroke="#0f172a" stroke-width="0.8"/>' +
             '<rect x="37" y="20.5" width="14" height="9" rx="1.5" fill="#0284c7" stroke="#0f172a" stroke-width="0.8"/>' +
             '<path d="M21 22 L26 22 M39 22 L44 22" stroke="#bae6fd" stroke-width="1.2" stroke-linecap="round"/>' +
             '<circle cx="35" cy="21" r="1.2" fill="#ef4444"/>'
      },
      {
        id: 'pince', slot: 'eyes', name: 'Пенсне корректора', file: 'PINCENEZ.ACS', sizeKb: 9,
        desc: 'Тонкое пенсне на пружинке без дужек. Держится на честном слове и замечает каждую лишнюю запятую в Word 97.',
        quip: 'Минуточку! В третьем абзаце у вас два пробела подряд. Подчёркиваю красной волнистой линией.',
        svg: '<ellipse cx="28" cy="26" rx="7" ry="6" fill="rgba(254,249,195,0.22)" stroke="#ca8a04" stroke-width="1.5"/>' +
             '<ellipse cx="43" cy="26" rx="7" ry="6" fill="rgba(254,249,195,0.22)" stroke="#ca8a04" stroke-width="1.5"/>' +
             '<path d="M33 22 Q35.5 17 38 22" stroke="#ca8a04" stroke-width="1.4" fill="none"/>' +
             '<path d="M21 28 Q17 38 22 48" stroke="#eab308" stroke-width="0.8" fill="none"/>'
      },

      {
        id: 'mustache', slot: 'mouth', name: 'Усы гусара', file: 'MUSTACHE.ACS', sizeKb: 7,
        desc: 'Пышные закрученные усы. Придают любому совету солидность и вес.',
        quip: 'С такими усами мои советы звучат на 40% убедительнее!',
        svg: '<path d="M40 38 C36 33.5 28 35 25 41 C30 38.5 35 41 40 40.2 C45 41 50 38.5 55 41 C52 35 44 33.5 40 38 Z" fill="#3b2314" stroke="#1c1008" stroke-width="0.6"/>'
      },
      {
        id: 'pipe', slot: 'mouth', name: 'Трубка сыщика', file: 'PIPE.ACS', sizeKb: 9,
        desc: 'Курительная трубка Шерлока Холмса (без табака — Скрепыш за здоровый образ жизни).',
        quip: 'Элементарно, пользователь! Ваш файл лежит в «Корзине».',
        svg: '<path d="M40 38 Q48 41 54 40" stroke="#451a03" stroke-width="2" fill="none" stroke-linecap="round"/>' +
             '<path d="M52 36 L60 36 L59 44 Q56 47 53 44 Z" fill="#78350f" stroke="#451a03" stroke-width="1"/>' +
             '<path d="M57 33 q-2 -3 0 -6 M60 32 q-2 -3 0 -6" stroke="#cbd5e1" stroke-width="0.9" fill="none"/>'
      },
      {
        id: 'beard', slot: 'mouth', name: 'Борода сисадмина UNIX', file: 'BEARD.ACS', sizeKb: 14, badge: 'NEW',
        desc: 'Окладистая борода знатока консоли. Вырастает сама, если месяц настраивать почтовый сервер без мышки.',
        quip: 'Права доступа проверил, демон печатает, бубен настроен. Только руками конфиг не трогайте.',
        svg: '<path d="M26 37 Q24 49 32 54 Q40 58 48 54 Q56 49 54 37 Q47 41 40 40 Q33 41 26 37 Z" fill="#5c3a21" stroke="#2b180a" stroke-width="0.9"/>' +
             '<path d="M31 38 Q40 35 49 38 Q45 42 40 41 Q35 42 31 38 Z" fill="#3b2314"/>' +
             '<path d="M32 45 L34 51 M40 45 L40 53 M48 45 L46 51" stroke="#3b2314" stroke-width="0.9" stroke-linecap="round"/>'
      },
      {
        id: 'goatee', slot: 'mouth', name: 'Эспаньолка мушкетёра', file: 'GOATEE.ACS', sizeKb: 8,
        desc: 'Тонкие усы стрелками и острая бородка. Для благородных диспутов в гостевой книге и защиты чести отчёта.',
        quip: 'Один за всех, и все за Ctrl+S! Сударь, ваша таблица вызывает меня на дуэль!',
        svg: '<path d="M27 39 Q34 35 40 38 Q46 35 53 39 Q46 38 40 39.5 Q34 38 27 39 Z" fill="#1f2937" stroke="#000" stroke-width="0.5"/>' +
             '<polygon points="36.5,42 43.5,42 40,51" fill="#1f2937" stroke="#000" stroke-width="0.6"/>'
      },
      {
        id: 'bubblegum', slot: 'mouth', name: 'Пузырь жвачки Turbo', file: 'BUBBLE.ACS', sizeKb: 11, badge: 'HOT',
        desc: 'Огромный розовый пузырь со вкусом персика. Вкладыш с красной «Феррари» уже спрятан под ковриком мыши.',
        quip: 'Мм-м... Спорим на два вкладыша Turbo, что вы ещё не сохраняли этот документ?',
        svg: '<circle cx="45" cy="40" r="6.8" fill="rgba(244,114,182,0.82)" stroke="#be185d" stroke-width="0.9">' +
             '<animate attributeName="r" values="6.2;7.4;6.2" dur="1.8s" repeatCount="indefinite"/></circle>' +
             '<ellipse cx="42.8" cy="37.8" rx="2" ry="1.2" fill="#fce7f3" transform="rotate(-25 42.8 37.8)"/>'
      },
      {
        id: 'wheat', slot: 'mouth', name: 'Травинка бывалого', file: 'WHEAT.ACS', sizeKb: 7,
        desc: 'Золотистый колосок в уголке рта. Для неспешной работы в поле таблиц и философского взгляда на синий экран.',
        quip: 'Куда спешить-то? Пока модем дозвонится, как раз урожай в «Косынке» соберём.',
        svg: '<path d="M40 38 Q50 40 60 46" stroke="#ca8a04" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
             '<ellipse cx="56" cy="43" rx="2.2" ry="1" transform="rotate(20 56 43)" fill="#facc15" stroke="#a16207" stroke-width="0.5"/>' +
             '<ellipse cx="59" cy="44.8" rx="2.2" ry="1" transform="rotate(25 59 44.8)" fill="#facc15" stroke="#a16207" stroke-width="0.5"/>' +
             '<ellipse cx="54.5" cy="44.8" rx="2" ry="0.9" transform="rotate(-10 54.5 44.8)" fill="#facc15" stroke="#a16207" stroke-width="0.5"/>'
      },

      {
        id: 'tie', slot: 'neck', name: 'Офисный галстук', file: 'TIE.ACS', sizeKb: 14, badge: 'HOT',
        desc: 'Красный галстук в косую полоску. Обязателен для совещаний и работы в Excel 97.',
        quip: 'Дресс-код соблюдён! Шеф будет доволен вашим помощником.',
        svg: '<polygon points="37,37 43,37 42,41 38,41" fill="#b91c1c" stroke="#7f1d1d" stroke-width="0.7"/>' +
             '<polygon points="38,41 42,41 45,58 40,63 35,58" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.7"/>' +
             '<path d="M37 46 L43 43 M36 52 L44 48 M36 57 L44 53" stroke="#fca5a5" stroke-width="1.1"/>'
      },
      {
        id: 'bowtie', slot: 'neck', name: 'Бабочка', file: 'BOWTIE.ACS', sizeKb: 10,
        desc: 'Чёрная бабочка для торжественных случаев: презентаций PowerPoint и выхода Win 98 SE.',
        quip: 'Смокинг не нужен — у меня есть бабочка! Готов к балу.',
        svg: '<polygon points="40,40 30,35 30,45" fill="#111827" stroke="#000" stroke-width="0.8"/>' +
             '<polygon points="40,40 50,35 50,45" fill="#111827" stroke="#000" stroke-width="0.8"/>' +
             '<rect x="38" y="37.8" width="4" height="4.4" rx="1" fill="#374151" stroke="#000" stroke-width="0.6"/>'
      },
      {
        id: 'pioneer', slot: 'neck', name: 'Пионерский галстук', file: 'PIONEER.ACS', sizeKb: 12,
        desc: 'Алый галстук: «Будь готов — всегда готов помочь с документом!»',
        quip: 'Будь готов! Всегда готов подсказать, как сохранить файл!',
        svg: '<polygon points="26,37 54,37 40,43" fill="#dc2626" stroke="#991b1b" stroke-width="0.7"/>' +
             '<polygon points="38.5,42 33,56 37,57 40.5,44" fill="#ef4444" stroke="#991b1b" stroke-width="0.7"/>' +
             '<polygon points="41.5,42 47,56 43,57 39.5,44" fill="#dc2626" stroke="#991b1b" stroke-width="0.7"/>' +
             '<circle cx="40" cy="42.5" r="2.2" fill="#b91c1c" stroke="#7f1d1d" stroke-width="0.6"/>'
      },
      {
        id: 'scarf', slot: 'neck', name: 'Шарф болельщика', file: 'SCARF.ACS', sizeKb: 15,
        desc: 'Полосатый шарф фаната NHL 98. Кричать «Шайбу!» разрешается.',
        quip: 'Шайбу! Шайбу! Мы болеем за вашу продуктивность!',
        svg: '<rect x="24" y="36" width="32" height="6.5" rx="3" fill="#2563eb" stroke="#1e3a8a" stroke-width="0.7"/>' +
             '<rect x="30" y="36" width="3" height="6.5" fill="#ffffff"/><rect x="38" y="36" width="3" height="6.5" fill="#ffffff"/><rect x="47" y="36" width="3" height="6.5" fill="#ffffff"/>' +
             '<rect x="44" y="40" width="6.5" height="18" rx="2" fill="#2563eb" stroke="#1e3a8a" stroke-width="0.7"/>' +
             '<rect x="44" y="46" width="6.5" height="3" fill="#ffffff"/>' +
             '<path d="M45 58 v3 M47 58 v3 M49 58 v3" stroke="#1e3a8a" stroke-width="0.8"/>'
      },
      {
        id: 'medal', slot: 'neck', name: 'Медаль «Помощник года»', file: 'MEDAL.ACS', sizeKb: 13,
        desc: 'Позолоченная медаль на трёхцветной ленте. Вручена за 1 000 000 непрошеных советов.',
        quip: 'Спасибо, спасибо! Хочу поблагодарить Билла, Office 97 и лично вас!',
        svg: '<path d="M31 37 L40 49 L49 37" stroke="#1d4ed8" stroke-width="3" fill="none"/>' +
             '<path d="M33 37 L40 47 L47 37" stroke="#dc2626" stroke-width="1.2" fill="none"/>' +
             '<circle cx="40" cy="53" r="5.2" fill="#facc15" stroke="#a16207" stroke-width="1"/>' +
             '<polygon points="40,49.6 41,52.2 43.6,52.2 41.5,53.8 42.3,56.4 40,54.8 37.7,56.4 38.5,53.8 36.4,52.2 39,52.2" fill="#fef9c3"/>'
      },
      {
        id: 'goldchain', slot: 'neck', name: 'Цепь нового русского', file: 'CHAIN.ACS', sizeKb: 17,
        desc: 'Золотая цепь «с палец толщиной» — прямо из анекдотов 90-х. Малиновый пиджак в комплект не входит.',
        quip: 'Слышь, братан, мышь пашет? Если нет — я её с коврика персидского подниму!',
        svg: '<path d="M27 37 Q40 55 53 37" stroke="#eab308" stroke-width="2.6" fill="none" stroke-dasharray="2.2 1.1"/>' +
             '<circle cx="40" cy="47.5" r="3.8" fill="#facc15" stroke="#a16207" stroke-width="0.8"/>' +
             '<text x="38.2" y="49.6" font-family="Arial" font-size="5.5" font-weight="bold" fill="#92400e">$</text>'
      },
      {
        id: 'badge98', slot: 'neck', name: 'Бейдж COMDEX \'98', file: 'BADGE98.ACS', sizeKb: 13, badge: 'NEW',
        desc: 'Пластиковый пропуск прессы на синем шнурке. Даёт право трогать новинки на компьютерной выставке и брать рекламные дискеты.',
        quip: 'Предъявите пропуск! У меня аккредитация прессы на все ваши открытые окна.',
        svg: '<path d="M31 37 L40 46 L49 37" stroke="#1d4ed8" stroke-width="2" fill="none"/>' +
             '<rect x="33" y="45" width="14" height="16" rx="1.2" fill="#ffffff" stroke="#1e3a8a" stroke-width="0.9"/>' +
             '<rect x="33" y="45" width="14" height="4" fill="#2563eb"/>' +
             '<rect x="35" y="51" width="4.5" height="5" fill="#93c5fd" stroke="#1e3a8a" stroke-width="0.5"/>' +
             '<path d="M41 52 h4 M41 54.5 h4 M35 58 h10" stroke="#475569" stroke-width="0.9"/>'
      },
      {
        id: 'jabot', slot: 'neck', name: 'Кружевное жабо', file: 'JABOT.ACS', sizeKb: 15,
        desc: 'Нарядный белоснежный воротник с рубиновой брошью. Для составления торжественных объяснительных в WordPad.',
        quip: 'Милостивый государь! Дозвольте отформатировать сей абзац шрифтом Times New Roman 14-го кегля.',
        svg: '<path d="M31 38 Q35 43 40 40 Q45 43 49 38 L46 47 Q40 45 34 47 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8"/>' +
             '<path d="M33 45 Q40 49 47 45 L44 54 Q40 52 36 54 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8"/>' +
             '<ellipse cx="40" cy="41.5" rx="2.4" ry="3" fill="#dc2626" stroke="#ca8a04" stroke-width="0.9"/>'
      },
      {
        id: 'camera', slot: 'neck', name: 'Фотоаппарат «Зенит»', file: 'CAMERA.ACS', sizeKb: 19,
        desc: 'Зеркальная камера на ремешке. Внутри плёнка Kodak Gold на 36 кадров, осталось четыре — снимаем только важные окна.',
        quip: 'Улыбочку! Делаю снимок экрана на плёнку. Проявим в фотолаборатории к четвергу!',
        svg: '<path d="M30 37 L34 47 M50 37 L46 47" stroke="#374151" stroke-width="1.6" fill="none"/>' +
             '<rect x="31" y="46" width="18" height="12" rx="1.5" fill="#1f2937" stroke="#000" stroke-width="0.9"/>' +
             '<polygon points="36,46 38,43 42,43 44,46" fill="#9ca3af" stroke="#000" stroke-width="0.7"/>' +
             '<circle cx="40" cy="52" r="4.2" fill="#374151" stroke="#cbd5e1" stroke-width="1"/>' +
             '<circle cx="40" cy="52" r="2.2" fill="#0284c7"/><circle cx="39" cy="51" r="0.7" fill="#bae6fd"/>'
      },

      {
        id: 'briefcase', slot: 'accessory', name: 'Деловой дипломат', file: 'BRIEFCAS.ACS', sizeKb: 21, badge: 'HOT',
        desc: 'Кожаный чемоданчик-дипломат справа от Скрепыша с кодовым замком «000». Внутри квартальный отчёт, две чистые дискеты и бутерброд.',
        quip: 'Деловой чемоданчик всегда под рукой! Все ваши шаблоны и отчёты уже разложены по папочкам.',
        svg: '<path d="M51 54 H56" stroke="#334155" stroke-width="2" stroke-linecap="round"/>' +
             '<path d="M61 50 V46.5 C61 45.5 68 45.5 68 46.5 V50" stroke="#451a03" stroke-width="1.8" fill="none"/>' +
             '<rect x="55" y="50" width="19" height="15" rx="1.8" fill="#92400e" stroke="#451a03" stroke-width="1"/>' +
             '<rect x="55" y="50" width="19" height="6" rx="1.2" fill="#b45309" stroke="#451a03" stroke-width="0.8"/>' +
             '<rect x="58" y="54.5" width="2.5" height="3" rx="0.5" fill="#facc15" stroke="#78350f" stroke-width="0.5"/>' +
             '<rect x="68.5" y="54.5" width="2.5" height="3" rx="0.5" fill="#facc15" stroke="#78350f" stroke-width="0.5"/>'
      },
      {
        id: 'floppybox', slot: 'accessory', name: 'Стопка дискет 3.5"', file: 'FLOPPIES.ACS', sizeKb: 18, badge: 'NEW',
        desc: 'Три дискеты по 1,44 МБ с надписями ручкой: «DOOM_2.ARJ (том 1 из 8)», «Курсовая_финал_точно.doc» и «Драйвер мыши».',
        quip: 'Защита от записи включена! Главное — не класть эту стопку рядом с колонками.',
        svg: '<rect x="57" y="53" width="15" height="15" rx="1" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.9"/>' +
             '<rect x="55" y="50" width="15" height="15" rx="1" fill="#eab308" stroke="#854d0e" stroke-width="0.9"/>' +
             '<rect x="56" y="47" width="15" height="15" rx="1" fill="#2563eb" stroke="#1e3a8a" stroke-width="0.9"/>' +
             '<rect x="59" y="47" width="9" height="5" fill="#cbd5e1" stroke="#475569" stroke-width="0.6"/>' +
             '<rect x="64" y="48" width="2" height="3" fill="#1e3a8a"/>' +
             '<rect x="58.5" y="54" width="10" height="6.5" fill="#ffffff" stroke="#94a3b8" stroke-width="0.5"/>' +
             '<path d="M60 56 h7 M60 58 h5" stroke="#334155" stroke-width="0.7"/>'
      },
      {
        id: 'mobile98', slot: 'accessory', name: 'Сотовый с антенной', file: 'MOBILE98.ACS', sizeKb: 19, badge: 'NEW',
        desc: 'Тяжёлая трубка стандарта GSM с выдвижной антенной и зелёным экранчиком. Входящие с городских номеров — платные!',
        quip: 'Алло! Да, я прямо на рабочем столе! Говори быстрее, у меня минута по полтора доллара!',
        svg: '<line x1="69" y1="35" x2="69" y2="45" stroke="#111827" stroke-width="2" stroke-linecap="round"/>' +
             '<circle cx="69" cy="35" r="1.4" fill="#111827"/>' +
             '<rect x="57" y="44" width="14" height="23" rx="2.5" fill="#1e293b" stroke="#000" stroke-width="1"/>' +
             '<rect x="59" y="47" width="10" height="6.5" rx="0.8" fill="#84cc16" stroke="#1a2e05" stroke-width="0.7"/>' +
             '<path d="M60.5 50.5 h7 M60.5 48.8 h4" stroke="#1a2e05" stroke-width="0.8"/>' +
             '<g fill="#cbd5e1"><circle cx="60.5" cy="56.5" r="1"/><circle cx="64" cy="56.5" r="1"/><circle cx="67.5" cy="56.5" r="1"/>' +
             '<circle cx="60.5" cy="59.8" r="1"/><circle cx="64" cy="59.8" r="1"/><circle cx="67.5" cy="59.8" r="1"/>' +
             '<circle cx="60.5" cy="63" r="1"/><circle cx="64" cy="63" r="1"/><circle cx="67.5" cy="63" r="1"/></g>'
      },
      {
        id: 'tamagotchi', slot: 'accessory', name: 'Брелок «Тамагочи»', file: 'TAMAGOT.ACS', sizeKb: 16, badge: 'HOT',
        desc: 'Яйцо на цепочке с пиксельным цыплёнком. Пищит каждые полчаса и требует покормить его прямо посреди отчёта.',
        quip: 'Ой, секунда! Мне надо покормить своего питомца и убрать за ним пиксели, а то он обидится.',
        svg: '<path d="M53 46 Q59 44 64 47" stroke="#94a3b8" stroke-width="1.2" fill="none" stroke-dasharray="1.5 1"/>' +
             '<ellipse cx="64" cy="57" rx="8.8" ry="10.8" fill="#ec4899" stroke="#831843" stroke-width="1"/>' +
             '<rect x="59" y="51" width="10" height="8.5" rx="1" fill="#d9f99d" stroke="#365314" stroke-width="0.8"/>' +
             '<rect x="62" y="53.5" width="4" height="4" fill="#1a2e05"/>' +
             '<rect x="61" y="54.5" width="1" height="2" fill="#1a2e05"/><rect x="66" y="54.5" width="1" height="2" fill="#1a2e05"/>' +
             '<circle cx="60.8" cy="62.8" r="1.2" fill="#fde047"/><circle cx="64" cy="63.6" r="1.2" fill="#fde047"/><circle cx="67.2" cy="62.8" r="1.2" fill="#fde047"/>'
      },
      {
        id: 'boombox', slot: 'accessory', name: 'Кассетный магнитофон', file: 'BOOMBOX.ACS', sizeKb: 25,
        desc: 'Двухкассетник с автореверсом и перемоткой на карандаше. На кассете BASF 90 записан свежий сборник «Союз-22».',
        quip: 'Магнитные головки протёрты одеколоном! Включаю музыку для бодрого форматирования таблиц.',
        svg: '<path d="M58 52 V48.5 H72 V52" stroke="#1f2937" stroke-width="1.6" fill="none"/>' +
             '<rect x="54" y="52" width="21" height="14" rx="1.5" fill="#4b5563" stroke="#111827" stroke-width="1"/>' +
             '<circle cx="58.5" cy="59.5" r="3.4" fill="#1f2937" stroke="#9ca3af" stroke-width="0.8"/>' +
             '<circle cx="70.5" cy="59.5" r="3.4" fill="#1f2937" stroke="#9ca3af" stroke-width="0.8"/>' +
             '<rect x="62.5" y="56.5" width="4" height="5" fill="#e5e7eb" stroke="#111827" stroke-width="0.6"/>' +
             '<text x="68" y="45" font-family="Arial" font-size="8" font-weight="bold" fill="#2563eb">♪</text>'
      },
      {
        id: 'parrot', slot: 'accessory', name: 'Попугай на плечо', file: 'PARROT.ACS', sizeKb: 22, badge: 'NEW',
        desc: 'Яркий ара справа от Скрепыша. Повторяет за пользователем всё, что тот вслух говорит зависшему Internet Explorer.',
        quip: 'Пр-р-рограмма не отвечает! Сохранить изм-м-менения? Попка дур-р-рак, а кэш почисти!',
        svg: '<path d="M58 46 L56 56 L61 53 Z" fill="#2563eb" stroke="#1e3a8a" stroke-width="0.7"/>' +
             '<ellipse cx="60" cy="39" rx="5.5" ry="7.5" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.9"/>' +
             '<path d="M59 35 Q65 37 63 45 Q58 43 59 35 Z" fill="#16a34a" stroke="#14532d" stroke-width="0.7"/>' +
             '<circle cx="60" cy="31" r="4.5" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.9"/>' +
             '<circle cx="61" cy="30.5" r="1.8" fill="#ffffff"/><circle cx="61.4" cy="30.5" r="0.9" fill="#000000"/>' +
             '<path d="M64 29.5 Q68 30.5 65.5 34 L63.5 32.5 Z" fill="#facc15" stroke="#78350f" stroke-width="0.7"/>' +
             '<path d="M55 45 L59 46" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>'
      },
      {
        id: 'cactus', slot: 'accessory', name: 'Кактус у монитора', file: 'CACTUS.ACS', sizeKb: 15,
        desc: 'Колючий зелёный защитник в глиняном горшочке. По науке из газетных вырезок забирает на себя 99% излучения кинескопа.',
        quip: 'Ставьте кактус ближе к экрану! Теперь излучение от 15-дюймового монитора нам нипочём.',
        svg: '<polygon points="58,59 70,59 68.5,68 59.5,68" fill="#c2410c" stroke="#7c2d12" stroke-width="0.9"/>' +
             '<rect x="56.5" y="56.5" width="15" height="3" rx="1" fill="#ea580c" stroke="#7c2d12" stroke-width="0.8"/>' +
             '<ellipse cx="64" cy="49" rx="4.8" ry="8" fill="#16a34a" stroke="#14532d" stroke-width="0.9"/>' +
             '<path d="M68.5 50 Q73 50 72 44" stroke="#16a34a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
             '<path d="M64 42 v13 M61.8 44 v10 M66.2 44 v10" stroke="#bbf7d0" stroke-width="0.6" stroke-dasharray="1.5 1.5"/>' +
             '<circle cx="64" cy="40.5" r="2.2" fill="#f43f5e" stroke="#881337" stroke-width="0.6"/>'
      },
      {
        id: 'pager', slot: 'accessory', name: 'Пейджер «ВессоЛинк»', file: 'PAGER98.ACS', sizeKb: 14,
        desc: 'Чёрный пейджер на клипсе с однострочным экраном. Чтобы прислать вам весточку, нужно позвонить оператору и назвать абонента № 1998.',
        quip: 'Бип-бип! Сообщение от оператора: «Абонент просит срочно нажать Ctrl+S. Конец связи».',
        svg: '<rect x="55" y="50" width="19" height="13" rx="2" fill="#111827" stroke="#374151" stroke-width="1"/>' +
             '<rect x="57" y="52.2" width="15" height="5" rx="0.7" fill="#a3e635" stroke="#1a2e05" stroke-width="0.6"/>' +
             '<path d="M58.5 54.8 h11" stroke="#1a2e05" stroke-width="1.2" stroke-dasharray="2 1"/>' +
             '<circle cx="58.5" cy="60" r="1.2" fill="#ef4444"/>' +
             '<rect x="62" y="59" width="4" height="2" rx="0.5" fill="#64748b"/>' +
             '<rect x="67.5" y="59" width="4" height="2" rx="0.5" fill="#64748b"/>'
      }
    ];

    this.state = { owned: [], equipped: { head: null, eyes: null, mouth: null, neck: null, accessory: null } };
    this.load();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey));
      if (saved && Array.isArray(saved.owned)) {
        this.state.owned = saved.owned.filter(id => this.getItem(id));
        for (const slot of Object.keys(this.state.equipped)) {
          const id = saved.equipped && saved.equipped[slot];
          this.state.equipped[slot] = id && this.getItem(id) && this.state.owned.includes(id) ? id : null;
        }
      }
    } catch (e) {}
  }

  save() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.state)); } catch (e) {}
  }

  getItem(id) {
    return this.items.find(i => i.id === id) || null;
  }

  getItems(slot) {
    return slot && slot !== 'all' ? this.items.filter(i => i.slot === slot) : this.items.slice();
  }

  clippy() {
    return typeof window !== 'undefined' ? window.appClippy : null;
  }

  glassesOn() {
    const c = this.clippy();
    return Boolean(c && c.persistentGlasses);
  }

  isLocked(id) {
    const item = this.getItem(id);
    if (!item || !item.lock) return false;
    if (item.lock === 'quiz') {
      const c = this.clippy();
      if (c && c.quizAced) return false;
      const total = c && c.quizRoundSize ? c.quizRoundSize : (c && c.quizQuestions ? c.quizQuestions.length : 3);
      return !(c && c.quizHighScore >= total);
    }
    return false;
  }

  isOwned(id) {
    if (id === 'sunglasses' && this.glassesOn()) return true;
    return this.state.owned.includes(id);
  }

  getEquippedId(slot) {
    if (slot === 'eyes' && this.glassesOn()) return 'sunglasses';
    return this.state.equipped[slot] || null;
  }

  getOutfit() {
    const outfit = {};
    this.slots.forEach(s => { outfit[s.id] = this.getEquippedId(s.id); });
    return outfit;
  }

  isEquipped(id) {
    const item = this.getItem(id);
    return Boolean(item && this.getEquippedId(item.slot) === id);
  }

  ownedCount() {
    return this.items.filter(i => this.isOwned(i.id)).length;
  }

  markOwned(id) {
    if (!this.getItem(id) || this.isLocked(id)) return false;
    if (!this.state.owned.includes(id)) {
      this.state.owned.push(id);
      this.save();
    }
    return true;
  }

  equip(id) {
    const item = this.getItem(id);
    if (!item || !this.isOwned(id)) return false;
    const c = this.clippy();
    if (id === 'sunglasses') {
      this.state.equipped.eyes = null;
      this.save();
      if (c) c.setGlasses(true);
    } else {
      this.state.equipped[item.slot] = id;
      this.save();
      if (item.slot === 'eyes' && c && c.persistentGlasses) c.setGlasses(false);
    }
    this.apply();
    return true;
  }

  unequip(slot) {
    const c = this.clippy();
    if (slot === 'eyes' && c && c.persistentGlasses) c.setGlasses(false);
    this.state.equipped[slot] = null;
    this.save();
    this.apply();
  }

  unequipAll() {
    this.slots.forEach(s => { this.state.equipped[s.id] = null; });
    this.save();
    const c = this.clippy();
    if (c && c.persistentGlasses) c.setGlasses(false);
    this.apply();
  }

  clearEyesForGlasses() {
    if (this.state.equipped.eyes) {
      this.state.equipped.eyes = null;
      this.save();
    }
    if (!this.state.owned.includes('sunglasses')) {
      this.state.owned.push('sunglasses');
      this.save();
    }
  }

  apply() {
    const c = this.clippy();
    if (c && typeof c.applyWardrobe === 'function') c.applyWardrobe();
  }

  itemSvg(id) {
    const item = this.getItem(id);
    return item ? item.svg : '';
  }

  previewSvg(outfit = {}, size = 68) {
    const layers = this.layerOrder.map(slot => {
      if (!outfit[slot]) return '';
      const svg = this.itemSvg(outfit[slot]);
      return slot === 'neck' ? `<g transform="translate(0 3)">${svg}</g>` : svg;
    }).join('');
    const h = Math.round(size * 104 / 88);
    return `<svg viewBox="-8 -24 88 104" width="${size}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">` +
      '<path d="M26 68V20a14 14 0 1 1 28 0v42a10 10 0 1 1-20 0V24a6 6 0 1 1 12 0v36" stroke="#334155" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<path d="M26 68V20a14 14 0 1 1 28 0v42a10 10 0 1 1-20 0V24a6 6 0 1 1 12 0v36" stroke="#e2e8f0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<path d="M27 66V21a13 13 0 0 1 13-13" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="20 4" fill="none"/>' +
      '<ellipse cx="28" cy="26" rx="7.5" ry="9.5" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>' +
      '<ellipse cx="29" cy="26" rx="3.6" ry="4.8" fill="#000000"/><circle cx="28" cy="24" r="1.5" fill="#ffffff"/>' +
      '<ellipse cx="43" cy="26" rx="7.5" ry="9.5" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>' +
      '<ellipse cx="44" cy="26" rx="3.6" ry="4.8" fill="#000000"/><circle cx="43" cy="24" r="1.5" fill="#ffffff"/>' +
      '<path d="M21 16c2.5-3 7-3 9 0" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
      '<path d="M40 16c2.5-3 7-3 9 0" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
      layers + '</svg>';
  }
}

window.clippyWardrobe = new ClippyWardrobe();
