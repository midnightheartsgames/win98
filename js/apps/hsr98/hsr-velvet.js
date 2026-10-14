(function (H) {
  'use strict';
  const T = H.TUNING;

  const ARCANA = ['Шут', 'Маг', 'Жрица', 'Императрица', 'Император', 'Иерофант', 'Влюблённые', 'Колесница', 'Сила', 'Отшельник', 'Колесо фортуны', 'Справедливость', 'Повешенный', 'Смерть', 'Умеренность', 'Дьявол', 'Башня', 'Звезда', 'Луна', 'Солнце', 'Суд', 'Мир'];
  const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

  const FOUR = ['yosuke', 'chie', 'yukiko'];
  const BANNERS = {
    mid: { name: 'Полуночный канал', kind: 'Полуночный канал', pass: 'vkey', midnight: true, stars: {
      yu: { name: 'Дикая карта', title: ['Дикая', 'карта'], arcana: 0, four: FOUR },
      kanji: { name: 'Мягкое сердце', title: ['Мягкое', 'сердце'], arcana: 4, four: FOUR },
      rise: { name: 'Настоящая я', title: ['Настоящая', 'я'], arcana: 6, four: FOUR }
    } },
    comp: { name: 'Компендиум', kind: 'Полуночный канал', pass: 'vkey', midnight: true, stars: {
      yu: { cone: 'truth', title: ['Навстречу', 'истине'], arcana: 0, four: ['cone:junesday', 'cone:dragontrial', 'cone:amagiinn'] },
      kanji: { cone: 'thread', title: ['Стежок', 'за стежком'], arcana: 4, four: ['cone:junesday', 'cone:dragontrial', 'cone:amagiinn'] },
      rise: { cone: 'affection', title: ['Твоя', 'привязанность'], arcana: 6, four: ['cone:junesday', 'cone:dragontrial', 'cone:amagiinn'] }
    } }
  };

  const ITEMS = {
    vkey: { name: 'Бархатный ключ', kind: 'key', rar: 5, price: 0, text: 'Синий ключ от комнаты между сном и явью. Билет Полуночного канала и Компендиума.' }
  };

  const RUMOR = { id: 'rumor_midnight', who: 'sampo_belobog', cost: 1200, title: 'Полуночный канал', text: 'Говорят, если в полночь смотреть в выключенный экран, он покажет того, кто тебе предназначен.', effect: 'Экран вещания в Общем вагоне: раз в день Полуночный канал и бархатный ключ (всего 10).' };

  const SCRIPTS = {
    mid_channel: [
      { recap: 'Полуночный канал', text: 'Выключенный экран вещания в Общем вагоне ловит Полуночный канал. Сквозь жёлтые помехи проступает силуэт, и из экрана выпадает бархатный ключ.' },
      '|Экран выключен, но по нему бежит жёлтая рябь. Полуночный канал.',
      '|Сквозь помехи проступает чей-то силуэт. Он машет рукой, и из экрана со стуком выпадает синий ключ.',
      { give: { midnight: 1 } },
      { if: 'mid_seen', jump: 'end' },
      { flag: 'mid_seen' },
      'pompom|Пом-Пом слышал стук! Пассажир, после отбоя технику не трогают.',
      '@|(Пом-Пом, кажется, ничего не видел на экране.)',
      '#end'
    ]
  };

  const CONTRACT = 'Я действую по своей воле и сам несу ответственность за свой выбор.';

  Object.assign(H.BANNERS, BANNERS);
  Object.assign(H.ITEMS, ITEMS);
  if (!H.RUMORS.some(r => r.id === RUMOR.id)) H.RUMORS.push(RUMOR);
  Object.assign(H.SCRIPTS, SCRIPTS);
  const tv = H.SCRIPTS.exp_broadcast;
  if (tv && !tv.some(s => s && s.jump === 'mid_tv')) {
    tv.unshift({ if: '%midnight', jump: 'mid_tv' });
    tv.push({ end: true }, '#mid_tv', { script: 'mid_channel' }, { end: true });
  }

  const proto = H.Game.prototype, baseCond = proto.cond, baseGive = proto.give;
  Object.assign(proto, {
    cond(expr) { return expr === '%midnight' ? this.midnightReady() : baseCond.call(this, expr); },

    give(spec) {
      if (spec && spec.midnight) {
        const rest = Object.assign({}, spec);
        delete rest.midnight;
        this.claimMidnight();
        rest.items = Object.assign({}, rest.items, { vkey: (rest.items && rest.items.vkey || 0) + 1 });
        return baseGive.call(this, rest);
      }
      return baseGive.call(this, spec);
    },

    midnightState() {
      const s = this.state;
      if (!s.midnight || typeof s.midnight !== 'object') s.midnight = { n: 0, day: null };
      return s.midnight;
    },

    midnightReady() {
      const m = this.midnightState();
      return !!this.state.flags.rumor_midnight && m.n < T.midnightKeys && m.day !== H.dayKey(this.now());
    },

    claimMidnight() {
      const m = this.midnightState();
      m.n++;
      m.day = H.dayKey(this.now());
    },

    contractSigned() { return !!this.state.flags.velvet_contract; },

    signContract() {
      if (this.contractSigned()) return false;
      this.state.flags.velvet_contract = true;
      this.give({ items: { vkey: T.contractKeys } });
      return true;
    },

    arcanaOf(ban) {
      const B = H.BANNERS[ban], S = B && B.stars && B.stars[this.starOf(ban)];
      return S ? S.arcana : 0;
    }
  });

  const ARCANA_OF = { trail: 0, trail_p: 0, march: 17, danheng: 9, himeko: 3, welt: 5, natasha: 14, serval: 19, asta: 10, arlan: 8, herta: 1, gepard: 11, bronya: 20, seele: 13, sampo: 15, hook: 16, pela: 2, ruanmei: 21, kafka: 18, silverwolf: 12, blade: 13, bailu: 14, yanqing: 7, clara: 8, miyabi: 7, yanagi: 2, phrolova: 18, scar: 15, kazuma: 10, aqua: 2, megumin: 16, darkness: 8, lynx: 9, luka: 8, sushang: 7, xueyi: 20, tingyun: 1, hanya: 11, qingque: 10, yukong: 4, guinaifen: 19 };
  const PATH_ARCANA = { destruction: 16, hunt: 7, erudition: 1, harmony: 6, nihility: 13, preservation: 4, abundance: 14, remembrance: 18 };
  function arcanaOf(charId, coneId) {
    if (charId && H.CHARS[charId]) {
      const name = H.CHARS[charId].arcana;
      if (name && ARCANA.includes(name)) return ARCANA.indexOf(name);
      return ARCANA_OF[charId] != null ? ARCANA_OF[charId] : 0;
    }
    const cd = coneId && H.CONES[coneId];
    return cd && PATH_ARCANA[cd.path] != null ? PATH_ARCANA[cd.path] : 0;
  }

  H.VELVET = { BANNERS, ITEMS, RUMOR, CONTRACT, ARCANA, ROMAN, ARCANA_OF, arcanaOf, arcanaName: i => ROMAN[i] + ' · ' + ARCANA[i] };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
