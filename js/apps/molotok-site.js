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
      { id: 'misc', short: 'Мелочи', name: 'Мыши, джойстики, мелочи' },
      { id: 'storage', short: 'Диски', name: 'Жёсткие диски, CD-ROM и Zip' },
      { id: 'monitor', short: 'Мониторы', name: 'Мониторы и защитные экраны' },
      { id: 'printer', short: 'Принтеры', name: 'Принтеры, сканеры и корпуса' },
      { id: 'pager', short: 'Пейджеры', name: 'Пейджеры, АОНы и трубки' },
      { id: 'soft', short: 'Диски и книги', name: 'Компакт-диски и книги' },
      { id: 'photo', short: 'Фото и аудио', name: 'Плееры, фото и кассеты' }
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
      { id: 'matrox_g200', cat: 'video', title: 'Matrox Millennium G200 8MB SGRAM AGP', seller: 'Buh_Liquidation', city: 'Москва', start: 65, bid: 78, step: 4, blitz: 110, count: 9, leader: 'Foto_Zenit', hours: 38, botMax: 94, cond: 'б/у, 3 месяца в банке', pic: 'card',
        desc: 'Снята с компьютера главного дизайнера в закрывшемся банке на Таганке. Чёткость текста в 1280x1024 при 85 Гц такая, что глаза за день не слезятся. Память SGRAM, в слот для модуля расширения никто ничего не ставил.',
        qa: [['Как у неё с Unreal?', 'Под Direct3D бегает сносно, но если нужен чистый Glide, берите Voodoo. Эта карта для тех, кто сидит за таблицами и CorelDRAW по десять часов.'], ['Манибэк даёте?', 'Два дня на проверку. Встреча у метро Таганская кольцевая после шести.']] },
      { id: 'banshee', cat: 'video', title: 'Creative 3D Blaster Banshee 16MB PCI', seller: 'Overclock_Pro_98', city: 'Москва', start: 75, bid: 88, step: 5, blitz: 125, count: 12, leader: 'Kolya_Celeron', hours: 44, botMax: 103, cond: 'б/у, с кулером на радиаторе', pic: 'card',
        desc: 'Для тех, у кого на плате нет AGP, а занять два слота связкой с Voodoo2 не выходит. 2D и 3D на одном чипе, проходной шнур не нужен, картинку не мылит. На родной зелёный радиатор прикрутил вентилятор от 486-го, чип держит 115 МГц по ядру без артефактов в Quake 2.',
        qa: [['Второй текстурный блок там реально урезан?', 'В играх с мультитекстурированием уступает обычной Voodoo2 процентов пятнадцать, зато в однотекстурных за счёт частоты идёт ноздря в ноздрю.']] },
      { id: 'virge_dx', cat: 'video', title: 'S3 ViRGE/DX 4MB PCI (память в панельках допихана до 4 МБ)', seller: 'Junona_Spb', city: 'Санкт-Петербург', start: 12, bid: 16, step: 2, blitz: 26, count: 5, leader: 'Shtirlits', hours: 15, botMax: 20, cond: 'б/у, рабочая', pic: 'card',
        desc: 'Честные четыре мегабайта EDO 50 нс, микросхемы в кроватках стоят плотно. Держит 1024x768 в High Color при 75 Гц. На коробке когда-то писали про 3D-ускоритель, но будем честны: в режиме сглаживания кадры падают ниже плинтуса. Зато как 2D-карта под пару к Voodoo идеальна.',
        qa: [['На «Юноне» в субботу можно забрать?', 'Да, павильон 12 с десяти до четырёх. Скажите, что с «Молотка», отдам по ставке без рыночной наценки.']] },
      { id: 'awe64', cat: 'sound', title: 'Creative Sound Blaster AWE64 Gold ISA', seller: 'Midi_Master', city: 'Москва', start: 35, bid: 45, step: 5, blitz: 70, count: 8, leader: 'Guybrush_Fan', hours: 20, botMax: 55, cond: 'б/у, как новая', pic: 'card',
        desc: 'Позолоченные разъёмы, синтезатор EMU8000 и 4 МБ памяти под сэмплы. MIDI в DOOM звучит как оркестр. Отдам вместе с колонками Genius, если договоримся.',
        qa: [['Под DOS работает?', 'Работает, драйвер ставится из AUTOEXEC.BAT. Инструкцию распечатаю.']] },
      { id: 'sb16', cat: 'sound', title: 'Sound Blaster 16 PnP ISA', seller: 'Dendy_Junior', city: 'Тула', start: 8, bid: 10, step: 1, blitz: 18, count: 2, leader: 'Shtirlits', hours: 4, botMax: 12, cond: 'б/у', pic: 'card',
        desc: 'Шипит на максимальной громкости, на средней нормально. Джойстиковый порт рабочий.',
        qa: [] },
      { id: 'sblive', cat: 'sound', title: 'Creative Sound Blaster Live! Value (CT4670) PCI', seller: 'Midi_Master', city: 'Москва', start: 55, bid: 68, step: 4, blitz: 98, count: 16, leader: 'CyberDemon98', hours: 49, botMax: 84, cond: 'почти новая, OEM', pic: 'card',
        desc: 'Чип EMU10K1, выход на четыре колонки. В Thief и Half-Life по звуку шагов за спиной сразу слышно, с какой стороны коридора крадётся охрана. Банки SoundFont грузятся прямо в системную память компьютера, так что покупать отдельные планки SIMM на карту больше не надо.',
        qa: [['В чистом DOS без Win 98 звук в старых играх будет?', 'В комплекте на диске лежит драйвер эмуляции SB16, но ему нужен менеджер памяти EMM386. Если игра не дружит с защищённым режимом, лучше оставить во втором слоте старую ISA-карту.']] },
      { id: 'gus_pnp', cat: 'sound', title: 'Gravis Ultrasound PnP 2MB ISA (красная плата)', seller: 'Spec_Master_ZX', city: 'Нижний Новгород', start: 28, bid: 36, step: 3, blitz: 58, count: 11, leader: 'Fido_Sysop_5020', hours: 29, botMax: 45, cond: 'б/у, 2 МБ на борту', pic: 'card',
        desc: 'Красный текстолит, чип AMD InterWave, запаяно два мегабайта памяти. Трекерные модули .XM и .IT в FastTracker II и заставки демосцены с диска Assembly звучат прозрачно, без каши и клиппинга на тридцати двух каналах.',
        qa: [['Почтой в Москву отправите?', 'Лучше передам с проводником поезда «Нижегородец», утром встретите на Курском вокзале у третьего вагона.']] },
      { id: 'ess1868', cat: 'sound', title: 'ESS AudioDrive ES1868F ISA + колонки SP-60 в нагрузку', seller: 'Bazar_Admin', city: 'Екатеринбург', start: 6, bid: 9, step: 1, blitz: 15, count: 4, leader: 'Dendy_Junior', hours: 12, botMax: 11, cond: 'б/у', pic: 'speaker',
        desc: 'Простая плата на ISA, подхватывается в DOS и Win 98 с полпинка как Sound Blaster Pro. В придачу отдаю белые пластмассовые колонки с кнопкой Bass Boost. У левой чуть шуршит колёсико громкости, если не крутить каждые пять минут, то не мешает.',
        qa: [] },
      { id: 'celeron', cat: 'cpu', title: 'Intel Celeron 300A, Slot 1, разгоняется до 450', seller: 'Overclock_Pro_98', city: 'Москва', start: 60, bid: 72, step: 4, blitz: 110, count: 17, leader: 'VoodooMaster', hours: 26, botMax: 92, cond: 'б/у, проверен', pic: 'chip',
        desc: 'Тот самый 300A. На плате с чипсетом BX ставите шину 100 МГц, и он работает на 450 МГц без доработок. Проверял в Quake 2 сутки подряд. Кулер в подарок.',
        qa: [['А если не разгонится?', 'Значит, у вас не BX. Верну деньги, если принесёте плату и покажете.']] },
      { id: 'simm', cat: 'cpu', title: 'Память SIMM 72-pin 16MB EDO, две планки', seller: 'Fido_Sysop_5020', city: 'Москва', start: 20, bid: 24, step: 2, blitz: 40, count: 5, leader: 'RadioActive', hours: 14, botMax: 30, cond: 'б/у', pic: 'chip',
        desc: 'Вынул из 486-го после апгрейда. Две планки по 16 МБ, ставятся парой в Pentium.',
        qa: [] },
      { id: 'abit_bh6', cat: 'cpu', title: 'Материнская плата ABIT BH6 (Slot 1, Intel 440BX, ATX)', seller: 'Overclock_Pro_98', city: 'Москва', start: 85, bid: 98, step: 5, blitz: 135, count: 18, leader: 'Krot_Tester', hours: 41, botMax: 118, cond: 'б/у, ревизия 1.01', pic: 'chip',
        desc: 'Главная плата под разгон Celeron 300A. Никаких перемычек на текстолите: частота шины от 66 до 133 МГц и напряжение ядра выставляются прямо в меню SoftMenu II в BIOS. Перемычка защиты флеш-памяти от вируса Чернобыль уже переставлена в закрытое положение.',
        qa: [['Заглушка в корпус и шлейфы есть?', 'Шлейф IDE под UltraDMA-33 и шлейф дисковода положу. Заглушка стандартная ATX.'], ['Конденсаторы возле слота не пухлые?', 'Все ровные, плата стояла в открытом корпусе под обдувом.']] },
      { id: 'k6_2_300', cat: 'cpu', title: 'AMD K6-2 300 МГц (Socket 7, 3DNow!) + медный кулер', seller: 'Admin_NIITeh', city: 'Воронеж', start: 48, bid: 56, step: 4, blitz: 82, count: 8, leader: 'Kolya_Celeron', hours: 31, botMax: 68, cond: 'б/у, крышка ровная', pic: 'chip',
        desc: 'Спасение для тех, кто не хочет менять старую материнку и корпус AT ради перехода на Slot 1. Нужна плата с поддержкой шины 100 МГц и раздельного питания 2.2 вольта. С патчем под 3DNow! в Quake 2 прибавляет треть кадров.',
        qa: [['На обычной Intel VX заведётся?', 'Только если плата умеет давать 2.2 В на ядро и множитель 6x (выставляется как 2x). На шине 66 МГц получите 400 МГц, если повезёт с охлаждением.']] },
      { id: 'sdram_64', cat: 'cpu', title: 'Память DIMM 64MB PC100 SDRAM Hyundai (чипы 8 нс)', seller: 'Mitino_Row_B', city: 'Москва', start: 52, bid: 64, step: 4, blitz: 90, count: 15, leader: 'VoodooMaster', hours: 23, botMax: 76, cond: 'новая с проверкой', pic: 'chip',
        desc: 'Настоящая PC100 с маркировкой HY57V658020A TC-10, а не перемаркированная PC66 с рынка. Спокойно держит CAS Latency 2 на шине 100 МГц и запускается на 112 МГц. С 64 мегабайтами Win 98 наконец перестаёт трещать свопом при каждом переключении из игры по Alt+Tab.',
        qa: [['Где проверяем?', 'В субботу на Митинском рынке в фургоне со стендом, в будни вечером у метро Тушинская.']] },
      { id: 'flash_bios', cat: 'cpu', title: 'Микросхема Flash BIOS 29EE010 (DIP-32) с прошивкой на заказ', seller: 'Spec_Master_ZX', city: 'Нижний Новгород', start: 5, bid: 7, step: 1, blitz: 12, count: 6, leader: 'Bazar_Admin', hours: 19, botMax: 10, cond: 'прошита на программаторе', pic: 'chip',
        desc: 'Для тех, у кого сработал вирус CIH или моргнул свет во время перепрошивки Award BIOS. Присылаете по электронной почте точное название платы и ревизию, я заливаю свежий дамп на программаторе Турбо-6 и высылаю заказным письмом в антистатике.',
        qa: [['Можно принести свою мёртвую флешку на перепрошивку?', 'Если вы в Нижнем, приносите на радиорынок в Герц, прошью на месте за 30 рублей.']] },
      { id: 'usr56k', cat: 'modem', title: 'US Robotics Courier V.Everything, внешний', seller: 'Fido_Sysop_5020', city: 'Москва', start: 50, bid: 60, step: 5, blitz: 95, count: 19, leader: 'CyberDemon98', hours: 40, botMax: 80, cond: 'б/у, работал на узле', pic: 'modem',
        desc: 'Три года работал на узле ФидоНета без выключения. Держит связь на любой линии, даже через АТС с реле. Блок питания родной.',
        qa: [['На наших линиях даёт 33600?', 'На цифровой АТС да. На старой обычно 26400.']] },
      { id: 'zyxel', cat: 'modem', title: 'ZyXEL Omni 288S, внешний', seller: 'Shtirlits', city: 'Новосибирск', start: 40, bid: 46, step: 3, blitz: 75, count: 9, leader: 'Fido_Sysop_5020', hours: 18, botMax: 58, cond: 'б/у', pic: 'modem',
        desc: 'Народный модем для наших линий. Определитель номера, автоответчик, работает с АОН. В комплекте шнур и инструкция.',
        qa: [] },
      { id: 'sportster_voice', cat: 'modem', title: 'US Robotics Sportster Voice 33.6 ISA (аппаратный, с джамперами)', seller: 'Fido_Sysop_5020', city: 'Москва', start: 28, bid: 34, step: 2, blitz: 52, count: 11, leader: 'Guybrush_Fan', hours: 27, botMax: 42, cond: 'б/у, мексиканская сборка', pic: 'modem',
        desc: 'Не путать с дешёвым Winmodem, который грузит процессор при каждом шорохе в трубке. Настоящий аппаратный модем на шине ISA, порт COM1–COM4 и прерывание IRQ выставляются перемычками на плате, так что работает и в DOS, и в OS/2, и в терминале T-Mail.',
        qa: [['До 56K по x2 прошивается?', 'Эта ревизия без флеш-памяти, ПЗУ в панельке. Зато 33600 на шаговой АТС держит крепче новых пятидесятишеститысячников.']] },
      { id: 'rockwell_pci', cat: 'modem', title: 'Внутренний модем Acorp 56K PCI (Rockwell HCF)', seller: 'Neo_99', city: 'Санкт-Петербург', start: 12, bid: 15, step: 1, blitz: 24, count: 4, leader: 'RadioActive', hours: 16, botMax: 18, cond: 'б/у, в коробке', pic: 'modem',
        desc: 'Программный модем под Win 98. На процессоре слабее Pentium 166 в сетевой Quake лучше не садиться, пинг прыгает, но для ночного скачивания MP3 через ReGet и посиделок в чате «Кроватка» по ночному тарифу хватает за глаза.',
        qa: [] },
      { id: 'bnc_kit', cat: 'modem', title: 'Две сетевые карты Realtek 8029 PCI + 25 метров коаксиала с Т-коннекторами', seller: 'Admin_NIITeh', city: 'Воронеж', start: 14, bid: 18, step: 2, blitz: 28, count: 7, leader: 'CyberDemon98', hours: 35, botMax: 24, cond: 'б/у, обжаты', pic: 'modem',
        desc: 'Готовый комплект, чтобы протянуть сетку на 10 Мбит к соседу через балкон или вентиляционный стояк и рубиться в Duke Nukem 3D, StarCraft и Diablo по IPX без модема и занятого телефона. Два терминатора на 50 Ом и две «тройки» в комплекте, кабель РК-50 целый, без скруток.',
        qa: [['Через три этажа пробьёт?', 'Коаксиал по стандарту бьёт до 185 метров. Главное, не забудьте накрутить оба терминатора по концам и не трогайте разъём руками, когда за окном гроза.']] },
      { id: 'dendy', cat: 'console', title: 'Dendy Junior, два джойстика и пистолет', seller: 'Dendy_Junior', city: 'Тула', start: 10, bid: 12, step: 2, blitz: 25, count: 5, leader: 'RadioActive', hours: 11, botMax: 16, cond: 'б/у', pic: 'console',
        desc: 'Жёлтая приставка из детства. Оба джойстика рабочие, турбо-кнопки нажимаются. Пистолет стреляет по уткам с двух метров. Блок питания трещит, но работает.',
        qa: [['Картриджи есть?', 'Только приставка. Картриджи продаю отдельно на рынке.']] },
      { id: 'megadrive', cat: 'console', title: 'Sega Mega Drive 2, один джойстик', seller: 'Guybrush_Fan', city: 'Пермь', start: 25, bid: 30, step: 2, blitz: 50, count: 7, leader: 'Neo_99', hours: 33, botMax: 38, cond: 'б/у', pic: 'console',
        desc: 'Чёрная, без царапин. Джойстик трёхкнопочный. Антенный кабель и блок питания в комплекте.',
        qa: [] },
      { id: 'psx_5502', cat: 'console', title: 'Sony PlayStation SCPH-5502 (чипованная, карта памяти, 2 джойстика)', seller: 'Gorbushka_CD', city: 'Москва', start: 95, bid: 110, step: 5, blitz: 155, count: 16, leader: 'Neo_99', hours: 46, botMax: 130, cond: 'б/у, лазер не посажен', pic: 'console',
        desc: 'Чип под штамповку распаян аккуратно, читает любые диски с Горбушки с первого раза, приставку на бок или вверх ногами переворачивать не нужно. В комплекте родная серая карта памяти на 15 блоков с сохранениями Resident Evil 2 и Gran Turismo, плюс три диска на выбор.',
        qa: [['Джойстики с грибками DualShock или обычные?', 'Один обычный из комплекта, второй докупал с аналоговыми стиками и вибрацией.']] },
      { id: 'pentagon128', cat: 'console', title: 'Компьютер «Пентагон-128» с дисководом 5.25", муз. чипом AY-3-8910 и 40 дискетами', seller: 'Spec_Master_ZX', city: 'Нижний Новгород', start: 18, bid: 24, step: 2, blitz: 38, count: 9, leader: 'Fido_Sysop_5020', hours: 37, botMax: 30, cond: 'ручная сборка, рабочий', pic: 'console',
        desc: 'Полный комплект спектрумиста в корпусе от клавиатуры с отдельным блоком питания и дисководом Электроника МС 5313. Встроен контроллер Beta Disk и трёхканальный музыкальный чип Yamaha. На пятидюймовых дискетах записаны Elite, UFO: Враг неведом, Звёздное наследие, Чёрный Ворон и журналы Spectrofon.',
        qa: [['К какому телевизору подключается?', 'Выведен кабель RGB на разъём SCART. На любом телевизоре со скартом картинка чёткая, цвета не плывут.']] },
      { id: 'gameboy_pocket', cat: 'console', title: 'Nintendo Game Boy Pocket (прозрачный корпус) + картридж Tetris и 32-в-1', seller: 'Dendy_Junior', city: 'Тула', start: 22, bid: 28, step: 2, blitz: 42, count: 6, leader: 'Guybrush_Fan', hours: 21, botMax: 34, cond: 'б/у, экран без полос', pic: 'console',
        desc: 'Тонкая версия на двух мизинчиковых батарейках AAA. Сквозь прозрачный пластик видно всю плату и микросхемы. Экран чёрно-белый, гораздо контрастнее старого «кирпича», битых вертикальных строчек нет.',
        qa: [] },
      { id: 'genius_mouse', cat: 'misc', title: 'Мышь Genius EasyMouse, COM-порт', seller: 'Bazar_Admin', city: 'Екатеринбург', start: 3, bid: 6, step: 1, blitz: 12, count: 3, leader: 'Kolya_Celeron', hours: 7, botMax: 8, cond: 'б/у, шарик промыт', pic: 'mouse',
        desc: 'Шарик промыт в спирте, валики очищены от катышков. Курсор не прыгает. Готова к Сапёру и Paint.',
        qa: [] },
      { id: 'gravis', cat: 'misc', title: 'Джойстик Gravis GamePad, 4 кнопки', seller: 'Midi_Master', city: 'Москва', start: 6, bid: 9, step: 1, blitz: 16, count: 4, leader: 'Guybrush_Fan', hours: 22, botMax: 12, cond: 'б/у', pic: 'mouse',
        desc: 'Подключается в игровой порт звуковой карты. Крестовик отвинчивается, можно поставить штырёк.',
        qa: [] },
      { id: 'intellimouse', cat: 'misc', title: 'Мышь Microslop IntelliMouse с колёсиком прокрутки (PS/2)', seller: 'Buh_Liquidation', city: 'Москва', start: 10, bid: 14, step: 2, blitz: 22, count: 8, leader: 'Krot_Tester', hours: 17, botMax: 18, cond: 'б/у, белая, без желтизны', pic: 'mouse',
        desc: 'Та самая изогнутая мышь с резиновым колёсиком между кнопками. Кто хоть раз крутил длинные таблицы или страницы в Internet Explorer колёсиком, а не таскал ползунок полосы прокрутки в углу экрана, обратно на двухкнопочную не сядет. Разъём круглый PS/2, переходник на COM приложу.',
        qa: [['Колёсико в Quake 2 под смену оружия работает?', 'В свежем патче 3.19 подхватывается сразу: крутите вверх для двустволки, вниз для рельсы.']] },
      { id: 'natural_kbd', cat: 'misc', title: 'Клавиатура Microslop Natural Keyboard Elite (разделённая на две половинки)', seller: 'Fido_Sysop_5020', city: 'Москва', start: 18, bid: 24, step: 2, blitz: 36, count: 7, leader: 'Shtirlits', hours: 32, botMax: 30, cond: 'б/у, русские буквы заводские', pic: 'mouse',
        desc: 'Клавиши развёрнуты веером под углом, под запястьями широкая подставка. Первые два дня промахиваешься по букве «Т» и «Ь», зато потом при слепом наборе перестают болеть кисти. Все ножки целые, пробел не гремит.',
        qa: [['Разъём широкий DIN или узкий PS/2?', 'Узкий PS/2. Если у вас плата AT с широким гнездом, за 1 у.е. добавлю переходник.']] },
      { id: 'pilot_1000', cat: 'misc', title: 'Карманный органайзер U.S. Robotics Pilot 1000 с крэдлом на COM-порт', seller: 'Pager_Service', city: 'Самара', start: 55, bid: 65, step: 5, blitz: 95, count: 10, leader: 'Neo_99', hours: 43, botMax: 80, cond: 'б/у, со стилусом и чехлом', pic: 'pager',
        desc: 'Помещается в нагрудный карман рубашки, от двух батареек AAA живёт полтора месяца. Распознаёт рукописный ввод Graffiti, синхронизирует телефоны и расписание одной кнопкой на подставке. В память залита программа для чтения книжек в метро и русификатор Papirus.',
        qa: [['Экран не продавлен стилусом?', 'С первого дня стояла защитная плёнка, вырезанная из прозрачной папки-уголка. Под ней стекло чистое.']] },
      { id: 'quantum_fb', cat: 'storage', title: 'Жёсткий диск Quantum Fireball EX 6.4GB IDE (UltraDMA-33)', seller: 'Mitino_Row_B', city: 'Москва', start: 95, bid: 112, step: 5, blitz: 150, count: 15, leader: 'CyberDemon98', hours: 48, botMax: 132, cond: 'б/у, без бэд-блоков', pic: 'disk',
        desc: 'Тихий и быстрый винчестер на 5400 оборотов. Прогнал поверхность в Norton Disk Doctor от начала до конца, ни одного медленного или битого сектора нет. Шести гигабайт хватит, чтобы держать полные установки Baldur\'s Gate, Fallout 2 и ещё три сотни песен в MP3.',
        qa: [['Старый BIOS на плате Intel VX увидит все 6.4 гигабайта?', 'Если BIOS старше лета 97-го года, может обрезать на 2.1 или 4.3 ГБ. Тогда ставьте диск через утилиту Ontrack Disk Manager или обновите прошивку.']] },
      { id: 'iomega_zip', cat: 'storage', title: 'Дисковод Iomega Zip 100MB внешний (LPT-порт) + 4 дискеты по 100 МБ', seller: 'Foto_Zenit', city: 'Казань', start: 45, bid: 54, step: 3, blitz: 78, count: 9, leader: 'Guybrush_Fan', hours: 28, botMax: 66, cond: 'б/у, головки целые', pic: 'disk',
        desc: 'Синий корпус, подключается в принтерный порт LPT, а сам принтер втыкается в него сквозным разъёмом сзади. Чтобы перенести дистрибутив игры или вёрстку в типографию, больше не нужно резать архив RAR на семьдесят обычных дискет и молиться, чтобы тридцать восьмая не размагнитилась в метро.',
        qa: [['Болезни с щелчками головок нет?', 'Ни одной битой дискеты в этот привод не совали, пружинка парковки на месте. Проверю при вас записью полного диска.']] },
      { id: 'teac_cd532', cat: 'storage', title: 'Привод CD-ROM Teac CD-532E 32x IDE (железная механика)', seller: 'Junona_Spb', city: 'Санкт-Петербург', start: 30, bid: 38, step: 2, blitz: 55, count: 13, leader: 'Krot_Tester', hours: 24, botMax: 46, cond: 'б/у, полгода', pic: 'cd',
        desc: 'Единственный привод, который вытягивает поцарапанные диски с радиорынка и синие болванки CD-R без зависаний. В отличие от дешёвых пятидесятискоростных гуделок, не пытается разорвать треснутый диск внутри лотка и честно грабит аудиодорожки через CDex без щелчков.',
        qa: [] },
      { id: 'verbatim_box', cat: 'storage', title: 'Две нераспечатанные пачки дискет 3.5" Verbatim DataLifePlus (20 шт., с тефлоном)', seller: 'Buh_Liquidation', city: 'Москва', start: 6, bid: 8, step: 1, blitz: 14, count: 4, leader: 'Kolya_Celeron', hours: 10, botMax: 11, cond: 'новые в плёнке', pic: 'disk',
        desc: 'Остатки со склада бухгалтерии. Поверхность диска с тефлоновым покрытием, шторки металлические, в каждой коробке наклейки в полоску. Отформатированы на заводе под 1.44 МБ.',
        qa: [] },
      { id: 'sony_100es', cat: 'monitor', title: 'Монитор 15" Sony Multiscan CPD-100ES (трубка Trinitron)', seller: 'Buh_Liquidation', city: 'Москва', start: 110, bid: 130, step: 5, blitz: 175, count: 16, leader: 'Overclock_Pro_98', hours: 50, botMax: 150, cond: 'б/у, запас яркости полный', pic: 'monitor',
        desc: 'Апертурная решётка Trinitron, экран плоский по вертикали, геометрия сведена в нитку по сетке Nokia Monitor Test. На белом фоне видны две тончайшие демпферные нити поперёк экрана. Кто знает трубки Sony, понимает, что это признак настоящей решётки, а не брак.',
        qa: [['В метро реально увезти в руках?', 'Весит килограммов пятнадцать и коробка здоровая. Лучше приезжайте на машине или берите складную тележку.']] },
      { id: 'syncmaster_3ne', cat: 'monitor', title: 'Монитор 14" Samsung SyncMaster 3Ne (LR, MPR-II)', seller: 'Bazar_Admin', city: 'Екатеринбург', start: 35, bid: 42, step: 3, blitz: 62, count: 6, leader: 'Dendy_Junior', hours: 19, botMax: 51, cond: 'б/у, не севший', pic: 'monitor',
        desc: 'Рабочая лошадка, которая стоит в половине компьютерных классов страны. 800x600 при 75 Гц держит ровно, колёсики регулировки размера и трапеции под крышкой спереди не разболтаны. Шнур питания и VGA припаяны сзади намертво.',
        qa: [] },
      { id: 'shield_glass', cat: 'monitor', title: 'Защитный стеклянный экран 15" «Русский Щит» с проводом заземления', seller: 'Admin_NIITeh', city: 'Воронеж', start: 4, bid: 6, step: 1, blitz: 11, count: 3, leader: 'Shtirlits', hours: 8, botMax: 8, cond: 'б/у, без царапин', pic: 'monitor',
        desc: 'Тёмное оптическое стекло с антибликовым напылением, вешается сверху на монитор лапками с липучкой и убирает статику, от которой к экрану липнет пыль и щёлкает по пальцам. Зелёный провод с «крокодилом» цепляется за неокрашенную трубу батареи отопления.',
        qa: [['Темно в играх с ним не становится?', 'Яркость на мониторе прибавите на четверть оборота, зато блики от люстры за спиной пропадают начисто.']] },
      { id: 'aver_tv', cat: 'monitor', title: 'Внутренний ТВ-тюнер AVerMedia TVPhone98 (PCI, с пультом и FM-радио)', seller: 'Foto_Zenit', city: 'Казань', start: 38, bid: 46, step: 3, blitz: 68, count: 8, leader: 'Midi_Master', hours: 34, botMax: 55, cond: 'б/у, полный комплект', pic: 'monitor',
        desc: 'Чип Brooktree Bt848, принимает все каналы в SECAM и PAL, позволяет вывести окно с футболом или MTV в угол монитора поверх таблицы Excel. В комплекте выносной глазок для инфракрасного пульта, проволочная антенна для FM-радио и шнурок в линейный вход звуковой карты.',
        qa: [['С видеомагнитофона кассеты оцифровывать можно?', 'Через тюльпан или S-Video пишет видео в AVI, если процессор и жёсткий диск успевают жать поток налету.']] },
      { id: 'hp_lj4l', cat: 'printer', title: 'Лазерный принтер HP LaserJet 4L + перезаправленный картридж', seller: 'Buh_Liquidation', city: 'Москва', start: 80, bid: 95, step: 5, blitz: 130, count: 14, leader: 'Fido_Sysop_5020', hours: 39, botMax: 115, cond: 'б/у, печка и фотобарабан в идеале', pic: 'printer',
        desc: 'Маленький неубиваемый лазерник на четыре страницы в минуту. Картридж 92274A без всяких чипов: проковыряли сбоку дырочку паяльником, засыпали баночку тонера за тридцать рублей, заклеили скотчем, и он снова печатает две тысячи листов рефератов и договоров без серых полос.',
        qa: [['Шнур к компьютеру есть?', 'Отдам толстый экранированный кабель LPT Centronics на полтора метра.']] },
      { id: 'epson_300', cat: 'printer', title: 'Матричный принтер Epson LX-300 (9 иголок, узкая каретка) + 3 ленты', seller: 'Admin_NIITeh', city: 'Воронеж', start: 22, bid: 28, step: 2, blitz: 42, count: 5, leader: 'Bazar_Admin', hours: 25, botMax: 34, cond: 'б/у, все 9 игл целые', pic: 'printer',
        desc: 'Пробивает накладные под копирку в три слоя и тянет перфорированную рулонную бумагу с дырочками по краям. Головка печатает без пропусков строчек, шестерёнки смазаны. Ночью в квартире лучше не включать, визжит на весь подъезд.',
        qa: [] },
      { id: 'mustek_600', cat: 'printer', title: 'Планшетный сканер Mustek Paragon 600 II EP (подключение в LPT)', seller: 'Foto_Zenit', city: 'Казань', start: 32, bid: 40, step: 3, blitz: 60, count: 7, leader: 'Guybrush_Fan', hours: 36, botMax: 49, cond: 'б/у, лампа яркая', pic: 'printer',
        desc: 'Планшетник формата А4, втыкается в порт принтера, отдельная плата SCSI не нужна. В комплекте диск с программой FineReader 3.0: курсовую из библиотечного учебника распознаёт и перегоняет в текст быстрее, чем набирать руками за неделю.',
        qa: [['Блок питания на 220 вольт родной?', 'Родной тяжёлый трансформатор в комплекте, штекер не расшатан.']] },
      { id: 'inwin_a500', cat: 'printer', title: 'Корпус InWin A500 ATX (толстая сталь 1 мм, блок питания PowerMan 235W)', seller: 'Mitino_Row_B', city: 'Москва', start: 36, bid: 44, step: 3, blitz: 65, count: 11, leader: 'Overclock_Pro_98', hours: 42, botMax: 53, cond: 'почти новый', pic: 'card',
        desc: 'Настоящая тайваньская штамповка из миллиметровой стали: можно сверху встать ногами и крышка не прогнётся. Кромки внутри завальцованы, при сборке компьютера пальцы в кровь не изрежешь, а вся материнская плата выезжает вбок на съёмном поддоне.',
        qa: [] },
      { id: 'moto_advisor', cat: 'pager', title: 'Пейджер Motorola Advisor (4 строки, русский шрифт, клипса на ремень)', seller: 'Pager_Service', city: 'Самара', start: 18, bid: 24, step: 2, blitz: 38, count: 12, leader: 'Neo_99', hours: 22, botMax: 30, cond: 'б/у, стекло без трещин', pic: 'pager',
        desc: 'Четырёхстрочный текстовый пейджер в чёрном корпусе с зелёной подсветкой. Прошит под частоту «ВессоЛинк» и «Мобил ТелеКом», можно перешить на любого оператора за пять минут. Виброзвонок в кармане джинсов чувствуется даже в трамвае, кобура с прищепкой и цепочкой в комплекте.',
        qa: [['С контрактом или чистый?', 'Снят с абонентского обслуживания без долгов, при подключении на операторской точке платите только за месяц эфира.']] },
      { id: 'rus_26', cat: 'pager', title: 'Телефон с определителем номера «Русь-26 Профи» (кнопочный, с голосом)', seller: 'Spec_Master_ZX', city: 'Нижний Новгород', start: 15, bid: 19, step: 2, blitz: 30, count: 8, leader: 'Shtirlits', hours: 15, botMax: 25, cond: 'новый в коробке', pic: 'modem',
        desc: 'Собирается в корпусе Panasonic, красный светодиодный индикатор виден через всю прихожую в темноте. Проговаривает определившийся номер женским голосом, ведёт архив на сто входящих и исходящих звонков, имеет десять будильников, ночной режим и анти-АОН.',
        qa: [['Если модем на одной линии, можно отключать автоподнятие одной кнопкой?', 'Да, комбинация клавиш выключает запрос АТС на время ночного дозвона, чтобы не рвало коннект.']] },
      { id: 'nokia_3110', cat: 'pager', title: 'Сотовый телефон Nokia 3110 GSM-900 + кожаный чехол на пояс', seller: 'Buh_Liquidation', city: 'Москва', start: 85, bid: 105, step: 5, blitz: 145, count: 15, leader: 'CyberDemon98', hours: 47, botMax: 125, cond: 'б/у, батарея держит 3 дня', pic: 'pager',
        desc: 'Аппарат с центральной синей кнопкой меню NaviKey, под любой стандарт GSM-900 (МТС или Билайн-900). Уверенный приём даже в цокольных этажах внутри Садового кольца. В комплекте стакан настольной зарядки с разрядником для тренировки никель-металлгидридного аккумулятора.',
        qa: [['Русские SMS читает?', 'Принимает транслитом, меню на английском и немецком.']] },
      { id: 'casio_databank', cat: 'pager', title: 'Часы с телефонной книжкой Casio Telememo 50 (DB-55W) и калькулятором', seller: 'Junona_Spb', city: 'Санкт-Петербург', start: 10, bid: 14, step: 1, blitz: 22, count: 5, leader: 'Kolya_Celeron', hours: 13, botMax: 17, cond: 'б/у, ремешок целый', pic: 'pager',
        desc: 'Записная книжка на пятьдесят телефонов прямо на запястье, мировое время, секундомер и восьмиразрядный калькулятор с резиновыми кнопочками. На зачёте по матанализу или физике в строки телефонной книги отлично забиваются шпаргалки с формулами.',
        qa: [] },
      { id: 'figurnov_book', cat: 'soft', title: 'Книга В. Э. Фигурнов «IBM PC для пользователя» (7-е издание, 640 стр.)', seller: 'Admin_NIITeh', city: 'Воронеж', start: 4, bid: 6, step: 1, blitz: 10, count: 5, leader: 'Dendy_Junior', hours: 11, botMax: 8, cond: 'б/у, корешок целый', pic: 'book',
        desc: 'Та самая синяя библия, по которой вся страна училась прописывать драйверы мыши и CD-ROM в CONFIG.SYS и AUTOEXEC.BAT, работать в Norton Commander, форматировать дискеты и жать файлы архиватором ARJ. Страницы белые, пометок карандашом нет.',
        qa: [] },
      { id: 'reanimator_cd', cat: 'soft', title: 'Золотой диск «Реаниматор \'98» + 4 сборника «Кrazы Collection» в боксах', seller: 'Gorbushka_CD', city: 'Москва', start: 8, bid: 11, step: 1, blitz: 18, count: 9, leader: 'Krot_Tester', hours: 20, botMax: 14, cond: 'зеркало без царапин', pic: 'cd',
        desc: 'Пять дисков заводской штамповки с золотистым рабочим слоем. На «Реаниматоре» собраны загрузочное меню для спасения рухнувшей системы, Partition Magic, Norton Utilities, антивирусы Лозинского и Касперского, плюс три десятка утилит с лекарствами в папках CRACK.',
        qa: [['Коды и серийники на самих дисках есть?', 'В корне каждого диска лежит файл SERIALS.TXT с таблицей под каждую папку.']] },
      { id: 'igromania_pack', cat: 'soft', title: 'Подшивка журналов «Игромания» и «Страна Игр» за 1998 год (8 номеров с CD)', seller: 'Guybrush_Fan', city: 'Пермь', start: 12, bid: 16, step: 2, blitz: 25, count: 6, leader: 'RadioActive', hours: 31, botMax: 20, cond: 'все диски и постеры на месте', pic: 'book',
        desc: 'Восемь толстых номеров в глянцевых обложках. Внутри полные прохождения Fallout, Grim Fandango, Unreal и Half-Life, коды, демоверсии и патчи на комплектных компакт-дисках. Двусторонние постеры с Ларой Крофт и Kerrigan из скрепок не выдирались.',
        qa: [] },
      { id: 'panasonic_shockwave', cat: 'photo', title: 'Кассетный плеер Panasonic ShockWave RQ-SW20 (жёлтый бронебойный корпус)', seller: 'Gorbushka_CD', city: 'Москва', start: 35, bid: 44, step: 3, blitz: 65, count: 14, leader: 'Midi_Master', hours: 33, botMax: 53, cond: 'б/у, пассик не растянут', pic: 'speaker',
        desc: 'Прорезиненный корпус на металлической защёлке с цифровым тюнером радио и басами XBS. Не боится дождя и падений на асфальт, от одной пальчиковой батарейки крутит девяностоминутную кассету TDK два дня подряд. В подарок отдам две кассеты The Prodigy и «Мумий Тролль».',
        qa: [['Родные наушники-ободок с вибробасом остались?', 'У родных перетёрся провод у джека, отдаю с вкладышами Sony Fontopia.']] },
      { id: 'zenit_et', cat: 'photo', title: 'Зеркальный фотоаппарат «Зенит-ЕТ» с объективом Гелиос-44-2 + вспышка «Луч-70»', seller: 'Foto_Zenit', city: 'Казань', start: 16, bid: 20, step: 2, blitz: 32, count: 6, leader: 'Shtirlits', hours: 26, botMax: 26, cond: 'б/у, шторки не светят', pic: 'camera',
        desc: 'Механическая зеркалка с прыгающей диафрагмой и светосильным портретником 58 мм f/2.0. Шторки затвора проклеены, на морозе не дубеют и кадры не засвечивают, кольцо фокусировки крутится мягко. В комплекте кожаный кофр на ремне и коробка свежей плёнки Kodak Gold 200 на 36 кадров.',
        qa: [] },
      { id: 'vhs_xfiles', cat: 'photo', title: 'Шесть видеокассет VHS «Секретные материалы» (1–2 сезон, запись со стереозвуком)', seller: 'Junona_Spb', city: 'Санкт-Петербург', start: 9, bid: 12, step: 1, blitz: 20, count: 5, leader: 'RadioActive', hours: 18, botMax: 15, cond: 'кассеты BASF E-240', pic: 'vhs',
        desc: 'Записано с лазерного диска на четырёхголовочном видеомагнитофоне Panasonic в режиме SP на немецкие четырёхчасовые кассеты BASF. Четыре серии на каждой кассете, двухголосая озвучка без гнусавости, лента не жёваная.',
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
      Guybrush_Fan: { plus: 9, minus: 0, since: 'сентябрь 1998', note: '' },
      Mitino_Row_B: { plus: 64, minus: 1, since: 'февраль 1998', note: 'Митинский радиорынок, ряд Б, синий фургон со стендом.' },
      Junona_Spb: { plus: 53, minus: 2, since: 'март 1998', note: 'Рынок «Юнона» на Казакова, павильон 12. Проверка на месте.' },
      Buh_Liquidation: { plus: 31, minus: 0, since: 'сентябрь 1998', note: 'Распродаю оргтехнику закрывшегося банка на Таганке.' },
      Gorbushka_CD: { plus: 87, minus: 2, since: 'январь 1998', note: 'ДК им. Горбунова по выходным, аллея у фонтана.' },
      Spec_Master_ZX: { plus: 44, minus: 0, since: 'апрель 1998', note: 'Ремонт плат, пайка контроллеров и прошивка ПЗУ на программаторе.' },
      Pager_Service: { plus: 29, minus: 1, since: 'июль 1998', note: 'Пейджеры, АОНы и перепрошивка частот.' },
      Foto_Zenit: { plus: 19, minus: 0, since: 'июнь 1998', note: 'Фототехника, оптика и сканирование слайдов.' },
      Admin_NIITeh: { plus: 37, minus: 0, since: 'март 1998', note: 'Вычислительный центр НИИ. Честное железо из серверной.' }
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
    const icons = {
      card: 'pc',
      chip: 'tools',
      modem: 'phone',
      console: 'cart',
      mouse: 'robot',
      disk: 'disk',
      cd: 'cd',
      monitor: 'tv',
      printer: 'printer',
      speaker: 'speaker',
      pager: 'pager',
      camera: 'camera',
      vhs: 'vhs',
      book: 'book'
    };
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
    const perCol = Math.ceil(cats.length / 3);
    const cols = [0, perCol, perCol * 2];
    const ending = lots.filter(l => !l.closed).sort((a, b) => a.left - b.left).slice(0, 6);
    const hot = lots.filter(l => !l.closed).sort((a, b) => b.count - a.count).slice(0, 6);
    return `
      <table class="molotok-cats" cellspacing="0">
        <tr>
          ${cols.map(i => `
            <td>
              ${cats.slice(i, i + perCol).map(c => `<div class="molotok-cat">${this.gif('folder')} ${this.link(`/cat?id=${c.id}`, `<b>${c.name}</b>`)} <span>(${lots.filter(l => l.cat === c.id && !l.closed).length})</span></div>`).join('')}
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
