(function (H) {
  'use strict';
  const T = H.TUNING;

  const TRACES = {
    theherta: {
      src: '1401', cost: 5, mats: ['erud', 'scion', 'echo_doom'], eidFx: true, scaled: { thStrike: ['m', 'end'], thBurst: ['m'], buff: ['v'] },
      curves: { ult: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.625, 1.75, 1.875, 2, 2.1, 2.2] },
      bonus: [
        ['Равнодушная честность', 'Атаки союзников дают поражённым врагам 1 ур. Интерпретации. После атаки Великая Герта получает 3 ед. энергии за каждого поражённого врага, до 5 целей. Если у основной цели усиленного навыка 42 ур. Интерпретации, урон Великой Герты повышается на 50% до конца атаки.', null],
        ['Письмо из-за горизонта событий', 'Если в начале боя в отряде 2 героя Эрудиции и больше, крит. урон всех союзников повышается на 80%, а след «Равнодушная честность» считает минимум 3 цели. После атаки поражённая цель с наибольшей Интерпретацией получает ещё 1 ур., а если атаковал герой Эрудиции, то ещё 2 ур.', null],
        ['Изголодавшийся пейзаж', 'Каждый ур. Интерпретации на враге даёт Великой Герте 1 ур. Ответа, до 99. Каждый ур. Ответа повышает множитель абсолютной техники на 1%.', null]
      ],
      stats: [
        ['iceP', 0.032, 1, null],
        ['atkP', 0.04, 30, 'a2'],
        ['iceP', 0.032, 40, 's2'],
        ['spd', 2, 40, 's2'],
        ['iceP', 0.048, 50, 'a4'],
        ['atkP', 0.06, 60, 's5'],
        ['iceP', 0.048, 60, 's5'],
        ['spd', 3, 70, 'a6'],
        ['atkP', 0.08, 75, 'a6'],
        ['iceP', 0.064, 80, null]
      ],
      eid: [
        ['Ночь, когда упали звёзды', 'Усиленный навык прибавляет к подсчёту 50% Интерпретации самой заряженной цели среди основной и соседних. Сброс Интерпретации оставляет 15 ур.'],
        ['Ветер сквозь замочную скважину', 'В начале боя и после абсолютной техники Великая Герта получает ещё 1 ур. Вдохновения. Усиленный навык продвигает её следующий ход на 35%.'],
        ['Дверь в лето', 'Уровень навыка повышается на 2, максимальный уровень 12. Уровень таланта повышается на 2, максимальный уровень 12.'],
        ['Шестнадцатый ключ', 'Скорость героев Эрудиции в отряде повышается на 12%.'],
        ['Правда, словно горькое лекарство', 'Уровень абсолютной техники повышается на 2, максимальный уровень 12. Уровень базовой атаки повышается на 1, максимальный уровень 7.'],
        ['Ответ, словно сладкая приманка', 'Пробитие ледяного сопротивления повышается на 20%. Множитель абсолютной техники повышается на 140%, 250% или 400%, если на поле 3 и больше, 2 или 1 враг.']
      ],
      up: { 3: { skill: 2, talent: 2 }, 5: { ult: 2, basic: 1 } }
    },
    tribbie: {
      src: '1403', cost: 5, mats: ['harm', 'scion', 'echo_borehole'], eidFx: true, scaled: { trNum: ['v'], trZone: ['vuln', 'add'] },
      curves: { ult: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.625, 1.75, 1.875, 2, 2.1, 2.2] },
      bonus: [
        ['Агнец за стеной...', 'После бонус-атаки таланта урон Трибби повышается на 72%, до 3 раз, на 3 хода.', null],
        ['Стеклянный шар с крыльями!', 'Пока зона активна, макс. HP Трибби повышается на 9% от суммы макс. HP всех героев отряда.', null],
        ['Камешек на распутье?', 'В начале боя Трибби получает 30 ед. энергии. После атаки другого союзника она получает 1,5 ед. энергии за каждую поражённую цель.', null]
      ],
      stats: [
        ['critD', 0.053, 1, null],
        ['critR', 0.027, 30, 'a2'],
        ['critD', 0.053, 40, 's2'],
        ['hpP', 0.04, 40, 's2'],
        ['critD', 0.08, 50, 'a4'],
        ['critR', 0.04, 60, 's5'],
        ['critD', 0.08, 60, 's5'],
        ['hpP', 0.06, 70, 'a6'],
        ['critR', 0.053, 75, 'a6'],
        ['critD', 0.107, 80, null]
      ],
      eid: [
        ['Церемония зачерпывания сахара', 'Пока зона активна, цель доп. урона зоны получает ещё истинный урон, равный 24% от всего урона этой атаки.'],
        ['Проводник по сновидениям', 'Доп. урон зоны равен 120% от обычного и наносится ещё 1 раз.'],
        ['Сокровище утреннего сияния', 'Уровень абсолютной техники повышается на 2, максимальный уровень 12. Уровень базовой атаки повышается на 1, максимальный уровень 7.'],
        ['Спокойствие эмпатической связи', 'Пока активно Освящение, урон всех союзников игнорирует 18% защиты цели.'],
        ['Час начала чудес', 'Уровень навыка повышается на 2, максимальный уровень 12. Уровень таланта повышается на 2, максимальный уровень 12.'],
        ['Путь к светлому будущему', 'После своей абсолютной техники Трибби проводит бонус-атаку таланта. Урон этой бонус-атаки повышается на 729%.']
      ],
      up: { 3: { ult: 2, basic: 1 }, 5: { skill: 2, talent: 2 } }
    }
  };

  for (const [id, d] of Object.entries(TRACES)) H.labPut(H.TRACES, id, d);
  Object.assign(H.ASC.shadowOf, { theherta: 'asc_rime', tribbie: 'asc_quanta' });
  Object.assign(H.ASC.coneFoe, { undeniable: 'scion', timeflower: 'scion' });
  Object.assign(H.RATE, { theherta: [100, 'Великую Герту'], tribbie: [72, 'Трибби'] });

  H.labHide(H.BANNERS, 'lab', {
    name: 'Закрытый тест', kind: 'Секретный прыжок', pass: 'lpass', secret: true,
    stars: {
      theherta: { name: 'Письмо из-за горизонта событий', title: ['Письмо из-за', 'горизонта событий'], cone: 'undeniable' },
      tribbie: { name: 'Возвращение к истокам', title: ['Возвращение', 'к истокам'], cone: 'timeflower' }
    }
  });
  H.labHide(H.ITEMS, 'lpass', { name: 'Секретный пропуск', kind: 'key', rar: 5, price: 0, text: 'Билет, отпечатанный на коленке. На обороте маркером: «Leveling_Solo. Принимает только шестой терминал». Угол прилеплен жвачкой.' });

  const proto = H.Game.prototype, basePity = proto.pityOf, baseStarOf = proto.starOf, baseSetStar = proto.setStarOf, baseBanner = proto.bannerOf, baseLog = proto.warpLogOf, baseStats = proto.warpStats, baseCond = proto.cond;
  const labStars = () => H.BANNERS.lab.stars;

  Object.assign(proto, {
    labState() {
      const s = this.state;
      if (!s.lab || typeof s.lab !== 'object') s.lab = { star: null, pity: { five: 0, four: 0 }, pair: {}, log: [], n: 0, batch: 0 };
      return s.lab;
    },

    labEmpty() { return !Object.keys(labStars()).length; },

    cond(expr) { return expr === '%lab_empty' ? this.labEmpty() : baseCond.call(this, expr); },

    pityOf(ban) { return ban === 'lab' ? this.labState().pity : basePity.call(this, ban); },

    starOf(ban) {
      if (ban !== 'lab') return baseStarOf.call(this, ban);
      const cur = this.labState().star;
      return labStars()[cur] ? cur : Object.keys(labStars())[0] || null;
    },

    setStarOf(ban, id) {
      if (ban !== 'lab') return baseSetStar.call(this, ban, id);
      if (!labStars()[id]) return false;
      this.labState().star = id;
      return true;
    },

    bannerOf(ban) {
      if (ban !== 'lab') return baseBanner.call(this, ban);
      const id = this.starOf('lab');
      return Object.assign({}, H.BANNERS.lab, labStars()[id], { star: id, five: id, pity5: T.labPity5, rate5: T.labRate5 });
    },

    warpLogOf(ban) { return ban === 'lab' ? this.labState().log : baseLog.call(this, ban); },

    warpStats(ban) {
      if (ban !== 'lab') return baseStats.call(this, ban);
      const L = this.labState(), five = L.log.filter(e => e.rar === 5);
      return { total: L.n, five: five.length, four: L.log.filter(e => e.rar === 4).length, last5: five[0] || null };
    },

    labGrant(n) {
      if (!T.labGrants.includes(n)) return null;
      this.give({ items: { lpass: n } });
      return this.state.inv.items.lpass;
    },

    labNext(star) {
      const S = labStars()[star];
      if (!S) return null;
      return (this.labState().pair[star] || 0) % 2 === 0 ? { kind: 'char', id: star, name: H.CHARS[star].name } : { kind: 'cone', id: S.cone, name: H.CONES[S.cone].name };
    },

    labFive(B) {
      const s = this.state, L = this.labState(), next = this.labNext(B.star), r = { rar: 5, pick: next.kind === 'cone' ? 'cone:' + next.id : next.id, kind: next.kind, id: next.id, name: next.name, lab: true };
      L.pair[B.star] = (L.pair[B.star] || 0) + 1;
      if (next.kind === 'cone') { r.sup = this.addCone(next.id).sup || 1; return r; }
      const light = s.starlight;
      r.res = this.addChar(next.id, Math.max(1, this.avgLevel() - 3));
      s.starlight = light;
      return r;
    },

    labGhost(rar) {
      const pick = this.rng.pick(H.WARP_POOL[rar === 4 ? 'four' : 'three'].filter(p => p.startsWith('cone:'))), id = pick.slice(5);
      return { rar, pick, kind: 'cone', id, name: H.CONES[id].name, sup: 1, ghost: true, lab: true };
    },

    labWarp(n) {
      const s = this.state, L = this.labState(), have = s.inv.items.lpass || 0;
      if (this.labEmpty() || have < n) return null;
      s.inv.items.lpass = have - n;
      if (!s.inv.items.lpass) delete s.inv.items.lpass;
      const B = this.bannerOf('lab'), res = [], batch = ++L.batch, at = this.now();
      for (let i = 0; i < n; i++) {
        L.pity.five++; L.pity.four++;
        const p5 = L.pity.five, p4 = L.pity.four;
        let rar = 3;
        if (p5 >= T.labPity5 || this.rng() < T.labRate5) { rar = 5; L.pity.five = 0; L.pity.four = 0; }
        else if (p4 >= T.pity4 || this.rng() < T.rate4) { rar = 4; L.pity.four = 0; }
        const r = rar === 5 ? this.labFive(B) : this.labGhost(rar), e = { n: ++L.n, kind: r.kind, id: r.id, rar, at, batch, pity: rar === 5 ? p5 : rar === 4 ? p4 : 0, ban: 'lab', star: B.star };
        if (r.ghost) e.ghost = true;
        if (r.kind === 'char') e.res = r.res; else e.sup = r.sup;
        res.push(r);
        L.log.unshift(e);
      }
      L.log.length = Math.min(L.log.length, T.labLog);
      return res;
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
