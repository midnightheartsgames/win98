(function (H) {
  'use strict';
  const proto = H.Game.prototype, baseAlerts = proto.alerts, baseInteract = proto.interact, baseLoadMap = proto.loadMap, baseBook = proto.bookPages;
  const CARS = ['express', 'express_cabin', 'express_party', 'express_room'];
  const GUEST_SCRIPTS = new Set(['exp_guestbook', 'exp_photowall', 'exp_books', 'exp_futon', 'exp_tv', 'exp_march_bed', 'exp_march_desk', 'exp_mirror', 'exp_rest', 'exp_trolley', 'exp_lounge', 'exp_drinks', 'exp_counter', 'exp_arcade', 'exp_coatroom', 'exp_staircase', 'exp_door_himeko', 'exp_door_welt', 'exp_himeko_coffee', 'exp_himeko_charts', 'exp_himeko_bed', 'exp_himeko_case', 'exp_welt_shelf', 'exp_welt_desk', 'exp_welt_cane', 'exp_welt_projector', 'exp_car_door', 'rm_bed_prop', 'rm_desk_prop', 'rm_bath_prop', 'rm_fridge_prop', 'rm_bar_prop', 'rm_pc_prop', 'rm_vitrine_prop']);
  const NOT_TOUCHED = new Set(['enemy', 'trigger', 'exit', 'marvel', 'span', 'rbridge', 'gbridge']);
  const FACE_BACK = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const GUEST_TALK = {
    pompom: [
      'Билет, пожалуйста! Нет билета? Тогда Пом-Пом запишет вас как багаж!',
      'Вы не с этого Экспресса! Пом-Пом знает всех пассажиров в лицо, а вашего лица в списке нет!',
      'Откуда взялся второй Экспресс?! Проводника никто не предупредил! Пом-Пом будет жаловаться!'
    ],
    himeko: [
      'Гость? Присаживайся. Кофе будешь? Я как раз сварила новую партию.',
      'На Пом-Пом не обижайся. Билеты он спрашивает даже у меня.',
      'Этот кофе ещё никто не допил до конца. Может, у тебя получится.'
    ],
    march: [
      'Ого, новое лицо! Стой, не двигайся, сейчас сниму! Ой, ты моргнул{|а}. Давай ещё раз!',
      'Ты с другого Экспресса? А там тоже есть я? Скажи честно, та Март хуже снимает?',
      'Снимок повешу на фотостену. Подпишу так: «Гость. Имя узнать потом».'
    ],
    danheng: [
      'Записываю в архив: гость, прибыл{|а} через эфирный мост. Цель визита не указана.',
      'Папки на полке можно смотреть. Перекладывать нельзя.'
    ],
    welt: [
      'Гостям здесь рады. Только не спрашивай у Пом-Пом, откуда ты взял{ся|ась}: у него и так тяжёлый день.',
      'Вагон чужой, а чай тот же. Садись, если устал{|а}.'
    ]
  };
  const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f|{}=#<>]/g, '').trim().slice(0, max);
  const dayMonth = at => { const d = new Date(at); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0'); };
  let flagNames = null;

  H.NET = {
    giftCredits: 2000, giftKeep: 50, CARS,
    PHRASES: ['Привет!', 'Какой у вас поезд!', 'Пом!', 'Кофе Химико не пей', 'В Рубеж?', 'Подожди меня', 'Спасибо!', 'До встречи!'],
    WISHES: ['Хороший поезд, чистые окна.', 'Спасибо, что пустили. Пом-Пом всё ещё требует билет.', 'Пластинка у вас отличная. Зайду ещё.', 'Кофе Химико пережит. Рекомендую не повторять.', 'Март, удалите тот снимок, пожалуйста.', 'В следующий раз идём в Рубеж вместе.']
  };

  H.netExpressFlags = () => {
    if (flagNames) return flagNames;
    const out = new Set(['room_open']);
    const add = expr => {
      for (const part of String(expr || '').split(/[|&]/)) {
        const t = part.trim().replace(/^!/, '');
        if (t && t[0] !== '?' && t[0] !== '$' && t[0] !== '%') out.add(t);
      }
    };
    for (const id of CARS) for (const mk of Object.values(H.MAPS[id].marks)) { add(mk.if); add(mk.always); }
    for (const r of H.RECORDS) add(r.need);
    for (const e of H.GUESTS) add(e[0]);
    for (const e of H.PHOTOS) add(e[0]);
    for (const w of H.WORLDS) add(w.express);
    flagNames = Array.from(out);
    return flagNames;
  };

  H.visitGame = (m, home) => {
    const ex = m.express || {}, names = new Set(H.netExpressFlags()), roster = {}, outfits = [];
    const g = new H.Game({ state: Object.assign(H.Game.newState(), { name: home.state.name, gender: home.state.gender, mcPath: home.state.mcPath, map: 'express', anchors: ['express:0'] }) });
    const s = g.state;
    for (const f of ex.flags || []) if (names.has(f)) s.flags[f] = true;
    if (g.applyNetRoom) g.applyNetRoom(ex.room);
    for (const r of ex.roster || []) {
      if (!Array.isArray(r) || (r[0] !== 'trail' && !own(H.CHARS, r[0]))) continue;
      const outfit = H.OUTFITS && own(H.OUTFITS, r[3]) ? r[3] : null;
      roster[r[0]] = { lvl: Number(r[1]) || 1, exp: 0, eid: Number(r[2]) || 0, cone: null, relics: {}, hp: null, energy: 0, outfit };
      if (outfit) outfits.push(outfit);
    }
    s.roster = Object.assign({}, s.roster, roster);
    s.outfits = outfits;
    s.party = (ex.party || []).filter(k => own(s.roster, k)).slice(0, 4);
    if (!s.party.length) s.party = ['trail'];
    s.record = H.RECORDS.some(r => r.id === ex.record) ? ex.record : null;
    g.guest = { uid: m.uid, name: clean(m.name, 12) || 'Первопроходец', sign: clean(m.sign, 40), gender: m.gender === 'f' ? 'f' : 'm', lead: ex.lead || null, look: null, ref: null };
    g.loadMap('express', null, { silent: true });
    g.events.length = 0;
    return g;
  };

  Object.assign(proto, {
    alerts() {
      const a = baseAlerts.call(this), n = globalThis.Net98;
      a.friends = !!(n && n.friends && (n.friends.in.length || n.activeInvites().length));
      return a;
    },

    interact(opts = {}) {
      return this.guest ? this.guestInteract(opts) : baseInteract.call(this, opts);
    },

    loadMap(id, atMark, opts = {}) {
      if (!this.guest) return baseLoadMap.call(this, id, atMark, opts);
      baseLoadMap.call(this, id, atMark, Object.assign({}, opts, { silent: true }));
      if (!opts.silent) this.emit({ t: 'map', id, name: this.map.def.name, music: this.mapMusic(this.map.def) });
      return undefined;
    },

    bookPages(kind) {
      const list = baseBook.call(this, kind), n = globalThis.Net98, net = kind === 'guests' && n ? (this.guest ? n.room && n.room.book : n.book) : null;
      if (!net) return list;
      return net.map(e => ({ who: clean(e.name, 12) + ' · ' + dayMonth(e.at), text: e.text != null ? clean(e.text, 40) : H.NET.WISHES[e.id] || '' })).concat(list);
    },

    guestDeny(text) {
      this.toast(text);
      this.emit({ t: 'sfx', id: 'deny' });
      return true;
    },

    guestInteract(opts) {
      if (this.busy() || this.player.moving) return false;
      const [fx, fy] = this.front(), e = this.entAt(fx, fy, x => !NOT_TOUCHED.has(x.kind));
      if (!e) return false;
      if (e.kind === 'npc') {
        if (e.def.ghost) return this.guestDeny('Терминал отвечает только хозяину.');
        if (e.def.dir !== 'fixed') e.dir = FACE_BACK[this.player.dir];
        if (e.def.visit) { this.visitorTalk(e.def.who); return true; }
        const lines = GUEST_TALK[e.def.who];
        if (!lines) return this.guestDeny('Сейчас не до разговоров.');
        this.say(e.def.who, lines[Math.floor(this.rng() * lines.length)]);
        return true;
      }
      if (e.kind !== 'prop') return this.guestDeny('Это можно только хозяину.');
      if (opts.shift && e.def.shift) return this.guestDeny('Замок пускает только хозяина.');
      if (e.def.script === 'exp_phono') return this.guestDeny('Это чужая коллекция.');
      if (!GUEST_SCRIPTS.has(e.def.script)) return this.guestDeny('Это можно только хозяину.');
      this.runScript(e.def.script);
      return true;
    },

    netCardRef(key) {
      const s = this.state;
      if (!key || !s.roster[key]) return null;
      const r = s.roster[key];
      return { k: this.kitOf(key), o: this.outfitOf ? this.outfitOf(key) || null : null, lvl: r.lvl, eid: r.eid };
    },

    netCard() {
      const s = this.state, p = this.profile(), slots = this.profileSlots();
      return {
        name: s.name, gender: s.gender, tl: s.tl.lvl, avatar: this.netCardRef(this.profileAvatar()), stage: this.netCardRef(this.profileStageHero()), sign: p.sign, bday: p.showBday ? p.bday : null,
        show: slots.show.map(k => this.netCardRef(k)), comp: slots.comp.map(k => this.netCardRef(k)),
        merits: this.profileMerits().map(m => ({ id: m.id, open: m.open, value: m.value })),
        coll: this.profileCollections().map(m => ({ id: m.id, got: m.got, total: m.total })),
        log: p.log.slice(0, 5).map(e => ({ at: e.at, text: this.profileLogText(e) }))
      };
    },

    netExpress() {
      const s = this.state, party = s.party.filter(k => !H.labOnly(k));
      const out = {
        flags: H.netExpressFlags().filter(f => s.flags[f]), party,
        roster: Object.keys(s.roster).filter(k => !H.labOnly(k)).map(k => [k, s.roster[k].lvl, s.roster[k].eid, this.outfitOf ? this.outfitOf(k) || null : null]),
        record: s.record, lead: this.netCardRef(party[0])
      };
      if (this.netRoom) { const rm = this.netRoom(); if (rm) out.room = rm; }
      return out;
    },

    netGift(gift) {
      const s = this.state, list = s.netGifts || (s.netGifts = []);
      if (list.includes(gift.id)) return 0;
      list.push(gift.id);
      if (list.length > H.NET.giftKeep) list.shift();
      const credits = Math.max(0, Math.min(H.NET.giftCredits, Math.floor(Number(gift.credits) || 0)));
      this.give({ credits });
      return credits;
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
