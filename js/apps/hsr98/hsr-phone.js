(function (H) {
  'use strict';

  H.PHONE_SKINS = {
    express: { name: 'Обычный вид', rar: 3, quote: 'Телефон таким, каким его выдали на Экспрессе.', win: ['#161c4a', '#080b24'], tile: ['#1a1f4c', '#0e1230', '#3a3a78', '#262660'], edge: '#000', rail: ['#0c1036', '#04061a'] },
    nexttoyou: { name: 'Навсегда рядом', rar: 5, quote: '«Сколько бы дней и ночей ни пережил этот мир! Сколько бы лет ни прошло, мы всегда будем рядом, пом!»', how: 'Подарок в письме версии 1.7.', wall: 'nexttoyou', win: ['#a02018', '#5a0e0c'], tile: ['rgba(150,30,22,0.82)', 'rgba(96,16,14,0.86)', 'rgba(214,92,36,0.92)', 'rgba(160,48,24,0.92)'], edge: 'rgba(48,6,4,0.8)', rail: ['#7a1410', '#3a0806'] }
  };

  const LETTER = {
    id: 'v17_growth', from: H.BRAND.team, title: 'Версия 1.7: Возвышение и новый телефон', need: 'express_intro',
    give: { skin: 'nexttoyou', credits: 30000, items: { aether3: 20, core1: 5, legion1: 5, silver1: 5, ancient1: 5 } },
    text: [
      'Уважаемый Первопроходец!',
      'Герои и световые конусы теперь растут через Возвышение. Уровень повышается на отдельном экране: клавиша U в «Персонажах». На пределе уровня там же открывается Возвышение. Ему нужны материалы, кредиты и Уровень Освоения.',
      'Если вы играли раньше, прокачка на месте: герои получили фазу по своему уровню, конусы на героях поднялись вместе с ними, и никто не стал слабее. Звёздные пропуска приходят за первое, третье и пятое Возвышения. За уже пройденные фазы их заменяет этот подарок.',
      'На телефоне появилась кнопка «…»: профиль, обои, все наряды и промокоды. Обои «Навсегда рядом» из этого письма ставятся там же.'
    ]
  };
  if (H.MAIL && !H.MAIL.some(m => m.id === LETTER.id)) H.MAIL.push(LETTER);

  H.PROMOS = [
    { code: 'STARRAILGIFT', title: 'Подарок Экспресса', from: H.BRAND.team, give: { jade: 50, credits: 10000 }, text: ['Уважаемый Первопроходец!', 'Экипаж Звёздного экспресса дарит вам немного нефрита и кредитов на дорогу. Спасибо, что едете с нами.'] },
    { code: 'POMPOM98', title: 'Билет от Пом-Пом', from: 'Пом-Пом', give: { jade: 60, items: { fuel: 1 } }, text: ['Пассажир!', 'Проводник выписывает вам билет с нефритом и канистру топлива. Не потеряйте, пом!'] },
    { code: 'TROLLEY98', title: 'Записка с тележки', from: 'Пом-Пом', give: { jade: 30, credits: 5000 }, text: ['Пассажир!', 'Читать чужие записки нехорошо, пом! Но раз уж вы нашли мою тележку, вот вам за внимательность. И верните архивные папки Дань Хэну, пом!'] }
  ];

  for (const p of H.PROMOS) {
    const id = 'promo_' + p.code;
    if (H.MAIL && !H.MAIL.some(m => m.id === id)) H.MAIL.push({ id, from: p.from, title: p.title, need: id, give: p.give, text: p.text });
  }

  const LOG_MAX = 20;

  function bossNameOf(encId) {
    const enc = H.ENCOUNTERS[encId], waves = enc && enc.waves ? enc.waves.slice().reverse() : [];
    for (const wave of waves) for (const unit of wave) {
      const foe = H.ENEMIES[String(unit).split(':')[0]];
      if (foe && foe.boss) return foe.name;
    }
    return 'сильный противник';
  }

  const addCharBase = H.Game.prototype.addChar;
  H.Game.prototype.addChar = function (id, lvl) {
    const res = addCharBase.call(this, id, lvl), key = id === 'trail_p' ? 'trail' : id;
    if (res === 'new' && key !== 'trail') this.profileNote('char', key);
    return res;
  };

  Object.assign(H.Game.prototype, {
    phoneSkinId() { return this.state.phoneSkin && this.ownsSkin(this.state.phoneSkin) ? this.state.phoneSkin : 'express'; },

    ownsSkin(id) { return id === 'express' || (!!H.PHONE_SKINS[id] && (this.state.phoneSkins || []).includes(id)); },

    setPhoneSkin(id) {
      if (!this.ownsSkin(id)) return false;
      this.state.phoneSkin = id;
      return true;
    },

    redeemPromo(raw) {
      const code = String(raw || '').replace(/[\s-]/g, '').toUpperCase(), promo = H.PROMOS.find(p => p.code === code);
      if (!code) return { ok: false, text: 'Введите код.' };
      if (!promo) return { ok: false, text: 'Такого кода нет.' };
      const used = this.state.promo || (this.state.promo = {});
      if (used[code]) return { ok: false, text: 'Этот код уже использован.' };
      if (promo.until && this.now() > Date.parse(promo.until + 'T23:59:59')) return { ok: false, text: 'Срок действия кода истёк.' };
      used[code] = this.now();
      this.state.flags['promo_' + code] = true;
      this.mailSync();
      return { ok: true, text: 'Код принят. Подарок в Почте.' };
    },

    profile() {
      const s = this.state;
      if (!s.profile) s.profile = { uid: null, sign: '', bday: null, avatar: null, stage: null, show: null, comp: null, log: [] };
      const p = s.profile;
      if (!p.logFilled) {
        p.logFilled = true;
        const past = (s.warpLog || []).filter(e => e.kind === 'char' && e.res === 'new' && H.CHARS[e.id]).map(e => ({ at: e.at, kind: 'char', id: e.id }));
        p.log = p.log.concat(past).sort((a, b) => b.at - a.at).slice(0, LOG_MAX);
      }
      return p;
    },

    profileNote(kind, id) {
      const log = this.profile().log;
      log.unshift({ at: this.now(), kind, id });
      if (log.length > LOG_MAX) log.length = LOG_MAX;
    },

    profileCwWin(code) {
      const p = this.profile(), won = p.cwWon || (p.cwWon = {});
      if (won[code]) return;
      won[code] = true;
      this.profileNote('cw', code);
    },

    profileLogText(e) {
      if (e.kind === 'char') {
        const kit = H.CHARS[e.id];
        return 'получен персонаж ' + (kit ? kit.rarity + '★ ' + (kit.short || kit.name) : '');
      }
      if (e.kind === 'boss') return 'первая победа: ' + bossNameOf(e.id);
      if (e.kind === 'su') {
        const w = H.SU.WORLDS.find(x => x.id === e.id);
        return 'Вселенная пройдена: ' + (w ? w.title : e.id);
      }
      const rank = H.CW.RANKS.find(r => r.code === e.id);
      return 'победа в Валютных войнах: ' + (rank ? rank.name : e.id);
    },

    profileMerits() {
      const s = this.state, f = s.flags, bosses = Object.keys(H.ENCOUNTERS).filter(id => H.ENCOUNTERS[id].boss);
      const worlds = H.SU.WORLDS, cleared = worlds.filter(w => f['su_clear_' + w.id]).length;
      const cwOn = !!f.lab_cw, rank = cwOn ? this.cwRankBest() : null, hdOn = !!f.lab_hd, wave = hdOn ? this.hd().recs.reduce((a, r) => Math.max(a, r.wave || 0), 0) : 0;
      const closed = 'Не открыто';
      return [
        { id: 'fh', label: 'Зал забвения', open: this.fhOpen(), value: this.fhOpen() ? this.fhTotal() + ' / ' + H.FH.STAGES.length * 3 + ' ★' : closed },
        { id: 'su', label: 'Виртуальная вселенная', open: !!f.su_open, value: f.su_open ? 'Миров: ' + cleared + ' / ' + worlds.length : closed },
        { id: 'cw', label: 'Валютные войны', open: cwOn, value: cwOn ? H.CW.RANKS[rank.tier].name + ' ' + rank.sub : closed },
        { id: 'hd', label: 'Рубеж Экспресса', open: hdOn, value: hdOn ? (wave ? 'Волна ' + wave : 'Нет записей') : closed },
        { id: 'boss', label: 'Боссов побеждено', open: true, value: bosses.filter(id => f['first_' + id]).length + ' / ' + bosses.length },
        { id: 'warp', label: 'Прыжков', open: true, value: String(s.warpN) },
        { id: 'time', label: 'В пути', open: true, value: this.summary().time }
      ];
    },

    profileCollections() {
      const s = this.state, heroes = Object.keys(H.CHARS).filter(k => k === 'trail' || !k.startsWith('trail'));
      const count = (ids, has) => ({ got: ids.filter(has).length, total: ids.length });
      const ofRar = rar => count(heroes.filter(k => H.CHARS[k].rarity === rar), k => !!s.roster[k]);
      const coneIds = new Set(s.inv.cones.map(cn => cn.id));
      const chests = Object.keys(H.MAPS).reduce((a, id) => { const n = this.chestCount(id); a.got += n.got; a.total += n.total; return a; }, { got: 0, total: 0 });
      return [
        Object.assign({ id: 'five', label: 'Персонажи 5★' }, ofRar(5)),
        Object.assign({ id: 'four', label: 'Персонажи 4★' }, ofRar(4)),
        Object.assign({ id: 'cones', label: 'Световые конусы' }, count(Object.keys(H.CONES), id => coneIds.has(id))),
        Object.assign({ id: 'outfits', label: 'Наряды' }, count(Object.keys(H.OUTFITS), id => this.ownsOutfit(id))),
        Object.assign({ id: 'pets', label: 'Питомцы' }, count(Object.keys(H.PETS), id => this.ownsPet(id))),
        Object.assign({ id: 'foes', label: 'Враги в Архиве' }, count(Object.keys(H.ENEMIES), id => !!s.bank.enemies[id])),
        Object.assign({ id: 'fusions', label: 'Слияния' }, count(Object.keys(H.FUSIONS), id => s.bank.fusions.includes(id))),
        Object.assign({ id: 'chests', label: 'Сундуки' }, chests)
      ];
    },

    profileStageHero() {
      const s = this.state, p = this.profile();
      return p.stage && s.roster[p.stage] ? p.stage : s.party[0];
    },

    profileAvatar() {
      const s = this.state, p = this.profile();
      return p.avatar && s.roster[p.avatar] ? p.avatar : s.party[0];
    },

    setProfileStage(key) {
      if (!this.state.roster[key]) return false;
      this.profile().stage = key;
      return true;
    },

    setProfileAvatar(key) {
      if (!this.state.roster[key]) return false;
      this.profile().avatar = key;
      return true;
    },

    profileSlots() {
      const s = this.state, p = this.profile(), fit = (list, n) => Array.from({ length: n }, (_, i) => (list[i] && s.roster[list[i]] ? list[i] : null));
      if (p.show) return { show: fit(p.show, 3), comp: fit(p.comp || [], 5) };
      const order = Object.keys(H.CHARS), rest = Object.keys(s.roster).filter(k => !s.party.includes(k)).sort((a, b) => order.indexOf(a) - order.indexOf(b)), all = [...s.party, ...rest];
      return { show: fit(all.slice(0, 3), 3), comp: fit(all.slice(3, 8), 5) };
    },

    setProfileSlot(kind, i, key) {
      if (key && !this.state.roster[key]) return false;
      const p = this.profile(), slots = this.profileSlots(), held = slots[kind][i];
      if (key) for (const other of ['show', 'comp']) { const at = slots[other].indexOf(key); if (at >= 0) slots[other][at] = held; }
      slots[kind][i] = key || null;
      p.show = slots.show; p.comp = slots.comp;
      return true;
    },

    setProfileName(raw) {
      const name = String(raw || '').replace(/\s+/g, ' ').trim();
      if (!name) return { ok: false, text: 'Имя не может быть пустым.' };
      if (name.length > 12) return { ok: false, text: 'Имя длиннее 12 знаков.' };
      this.profile();
      this.state.name = name;
      return { ok: true, text: 'Имя изменено.' };
    },

    setProfileSign(raw) {
      const sign = String(raw || '').replace(/\s+/g, ' ').trim();
      if (sign.length > 40) return { ok: false, text: 'Подпись длиннее 40 знаков.' };
      this.profile().sign = sign;
      return { ok: true, text: 'Подпись сохранена.' };
    },

    setProfileBday(d, m) {
      const p = this.profile();
      if (d == null) { p.bday = null; return true; }
      const last = new Date(2000, m, 0).getDate();
      if (!(m >= 1 && m <= 12 && d >= 1 && d <= last)) return false;
      p.bday = { d, m };
      return true;
    },

    promosUsed() {
      const used = this.state.promo || {};
      return Object.keys(used).sort((a, b) => used[b] - used[a]).map(code => {
        const promo = H.PROMOS.find(p => p.code === code);
        return { code, title: promo ? promo.title : '', at: used[code] };
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
