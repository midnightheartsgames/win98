class ClippyWardrobe {
  constructor() {
    this.storageKey = 'win98_clippy_wardrobe';
    this.slots = [
      { id: 'head', name: 'Головные уборы', icon: '🎩' },
      { id: 'eyes', name: 'Очки', icon: '👓' },
      { id: 'mouth', name: 'Усы', icon: '🥸' },
      { id: 'neck', name: 'Галстуки и шея', icon: '👔' }
    ];
    this.layerOrder = ['neck', 'mouth', 'eyes', 'head'];

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
      }
    ];

    this.state = { owned: [], equipped: { head: null, eyes: null, mouth: null, neck: null } };
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
    const h = Math.round(size * 104 / 84);
    return `<svg viewBox="-8 -24 84 104" width="${size}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">` +
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
