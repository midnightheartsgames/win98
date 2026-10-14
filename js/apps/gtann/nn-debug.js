(function (N) {
  'use strict';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const GUNS = [['knuckles', 1, 'Кастет'], ['knife', 1, 'Нож'], ['pm', 120, 'ПМ'], ['rsh12', 30, 'РШ-12'], ['shotgun', 60, 'Дробь'], ['toz34', 40, 'ТОЗ-34'], ['kiparis', 240, 'Кипарис'], ['bizon', 320, 'Бизон'], ['ak', 300, 'АК-74'], ['sks', 100, 'СКС'], ['svd', 50, 'СВД'], ['vss', 80, 'ВСС'], ['pkm', 500, 'ПКМ'], ['rpg7', 10, 'РПГ-7'], ['grenade', 12, 'Ф-1'], ['molotov', 12, 'Молотов'], ['izh38', 100, 'ИЖ-38']];
  const SPOTS = [
    ['hotel_door', 'Гостиница'], ['kesha_door', '«Фемида»'], ['club_door', '«Мираж»'], ['colonel', 'Дебаркадер'],
    ['gunshop', '«Охотник»'], ['market', 'Рынок'], ['zarya', 'ГСК «Заря»'], ['gaz_gate', 'Проходная ГАЗ'],
    ['port', 'Речной порт'], ['stadium_gate', 'Стадион'], ['ferris', 'Колесо обозрения'], ['dk', 'ДК ГАЗ'],
    ['myza_bridge', 'Мызинский мост'], ['respray_n', 'Автосервис'], ['hosp_n', 'Больница'], ['ovd_n', 'ОВД'],
    ['flat', 'Квартира'], ['tower_roof', 'Крыша высотки'], ['univermag', 'Универмаг'], ['cinema', 'Кинотеатр «Мир»'],
    ['park_gate', 'Вход в парк'], ['mpl_pk', 'Метро «Парк культуры»'], ['mpl_kir', 'Метро «Кировская»'], ['mpl_kom', 'Метро «Комсомольская»'],
    ['mpl_avt', 'Метро «Автозаводская»'], ['park_square', 'Парк: фонтан'], ['tir', 'Парк: тир'], ['park_dance', 'Парк: танцплощадка'],
    ['park_cinema', 'Кинотеатр «Родина»']
  ];
  const GREEN_SPOTS = [['yard', 'Палисадник'], ['hedge', 'Живая изгородь'], ['tires', 'Покрышки'], ['boulders', 'Валуны'], ['swan', 'Лебедь'], ['forest', 'Лес'], ['pond', 'Камыш'], ['riprap', 'Берег, камни']];
  const HOURS = [[6, '06:00'], [12, '12:00'], [18.5, '18:30'], [21.5, '21:30'], [0, '00:00']];
  const LIVERIES = { militia: 'ППС', dps: 'ДПС', gai: 'ГАИ', old: 'Сов. милиция', omon: 'ОМОН', fsb: 'ФСБ', taxi: 'Такси', ambulance: 'Скорая', army: 'Армия', carrier: 'Автовоз' };
  const military = spec => spec.type === 'tank' || spec.type === 'apc' || (!spec.spawn && spec.liveries && Object.keys(spec.liveries).join() === 'army');
  const CAR_GROUPS = [
    ['Легковые', s => s.type === 'car'],
    ['Грузовые и автобусы', s => (s.type === 'truck' || s.type === 'bus') && !military(s)],
    ['Армия', military],
    ['Мотоциклы', s => s.type === 'bike']
  ];

  class Debug {
    constructor(ui) {
      this.ui = ui;
      this.open = false;
      this.el = null;
      this.t = 0;
      this.view = null;
      this.car = { model: 't72', livery: 'army' };
      this.spawned = [];
    }

    toggle() { if (this.open) this.close(); else this.show(); }

    show() {
      const ui = this.ui;
      if (!ui.game || ui.demo || ui.state !== 'play' || ui.game.cut || ui.game.shop) return false;
      this.open = true;
      ui.keys.clear();
      ui.pressed.clear();
      ui.mouse.l = ui.mouse.r = false;
      if (ui.locked && document.exitPointerLock) document.exitPointerLock();
      this.build();
      this.refresh();
      const b = this.el.querySelector('button');
      if (b) b.focus({ preventScroll: true });
      return true;
    }

    close() {
      this.open = false;
      if (this.el) { this.el.remove(); this.el = null; }
      this.ui.el.focus({ preventScroll: true });
    }

    section(title, key, body) {
      return `<section><h4>${esc(title)}${key ? `<em data-k="${key}"></em>` : ''}</h4>${body}</section>`;
    }

    btn(a, v, label, extra) {
      return `<button type="button" data-a="${a}"${v !== undefined ? ` data-v="${esc(v)}"` : ''}${extra || ''}>${label}</button>`;
    }

    build() {
      const el = document.createElement('div');
      el.className = 'nn-dbg';
      const guns = GUNS.map(([id, , short]) => this.btn('gun', id, `<canvas width="56" height="32"></canvas><i>${esc(short)}</i>`, ` title="${esc(N.WEAPONS[id].name)}"`)).join('') + this.btn('guns', undefined, 'Всё<br>сразу');
      const money = [[1000, '+1 000'], [10000, '+10 000'], [100000, '+100 000'], [0, 'Обнулить']].map(([v, l]) => this.btn('money', v, l)).join('');
      const spots = SPOTS.map(([id, l]) => this.btn('tp', id, esc(l))).join('') + this.btn('goal', undefined, 'К цели задания');
      const wx = N.WEATHER_IDS.map(id => this.btn('wx', id, esc(N.WEATHER[id].name))).join('') + this.btn('wx', 'auto', 'Само') + this.btn('bolt', undefined, 'Молния');
      const hours = HOURS.map(([h, l]) => this.btn('hour', h, l)).join('') + this.btn('clock', undefined, 'Часы');
      const player = this.btn('god', undefined, 'Бессмертие') + this.btn('heal', undefined, 'Вылечить') + this.btn('fix', undefined, 'Починить машину');
      const moves = this.btn('run', undefined, 'Супербег') + this.btn('jump', undefined, 'Суперпрыжок') + this.btn('fly', undefined, 'Полёт (noclip)');
      const wanted = this.btn('wanted', -1, '−1') + this.btn('wanted', 1, '+1') + this.btn('wanted', 0, 'Снять розыск') + this.btn('wanted', 6, 'Все шесть');
      const cars = CAR_GROUPS.map(([title, fit]) => `<div class="nn-dbg-sub">${esc(title)}</div>` + N.VEHICLE_IDS.filter(id => fit(N.VEHICLES[id])).map(id => this.btn('car', id, esc(N.VEHICLES[id].name))).join('')).join('');
      const carActs = this.btn('spawn', undefined, 'Поставить рядом') + this.btn('drive', undefined, 'Сесть за руль') + this.btn('unspawn', undefined, 'Убрать поставленные');
      const missions = N.MISSIONS.map((m, i) => this.btn('mission', m.id, (i + 1) + '. ' + esc(m.title))).join('');
      const mActs = this.btn('mpass', undefined, 'Пройти') + this.btn('mfail', undefined, 'Провалить') + this.btn('ledger', 'lyova', 'Тетрадь → Лёве') + this.btn('ledger', 'kesha', 'Тетрадь → Кеше');
      el.innerHTML = `<div class="nn-dbg-head"><b>ОТЛАДКА</b><span>F7 или Esc — закрыть</span></div><div class="nn-dbg-body">`
        + this.section('Задания', 'mission', `<div class="nn-dbg-row nn-dbg-missions">${missions}</div><div class="nn-dbg-sub">Контрольные точки текущего задания</div><div class="nn-dbg-row nn-dbg-cps"></div><div class="nn-dbg-row">${mActs}</div>`)
        + this.section('Оружие', '', `<div class="nn-dbg-row nn-dbg-guns">${guns}</div>`)
        + this.section('Деньги', 'money', `<div class="nn-dbg-row">${money}</div>`)
        + this.section('Телепорт', 'where', `<canvas class="nn-dbg-map" width="336" height="224"></canvas><div class="nn-dbg-row nn-dbg-spots">${spots}</div>`)
        + this.section('Погода', 'wx', `<div class="nn-dbg-row">${wx}</div>`)
        + this.section('Время', 'clock', `<div class="nn-dbg-row">${hours}</div>`)
        + this.section('Игрок', 'hp', `<div class="nn-dbg-row">${player}</div>`)
        + this.section('Способности', 'moves', `<div class="nn-dbg-row">${moves}</div><div class="nn-dbg-sub">Полёт: Пробел — вверх, Alt — вниз, Shift — быстрее</div>`)
        + this.section('Розыск', 'wanted', `<canvas class="nn-dbg-stars" width="336" height="44"></canvas><div class="nn-dbg-row">${wanted}</div>`)
        + this.section('Улица', 'street', `<div class="nn-dbg-row">${this.btn('street', undefined, 'Восстановить сломанное')}</div>`)
        + this.section('Прохожие', 'crowd', `<div class="nn-dbg-row">${this.btn('crowd', undefined, 'Заполнить улицу')}</div>`)
        + this.section('Природа', 'green', `<div class="nn-dbg-row">${GREEN_SPOTS.map(([k, l]) => this.btn('green', k, esc(l))).join('')}</div>`)
        + this.section('Транспорт', 'veh', `<div class="nn-dbg-row nn-dbg-cars">${cars}</div><div class="nn-dbg-sub">Окраска</div><div class="nn-dbg-row nn-dbg-livs"></div><div class="nn-dbg-row nn-dbg-acts">${carActs}</div>`)
        + `</div><div class="nn-dbg-msg"></div>`;
      this.ui.el.appendChild(el);
      this.el = el;
      el.querySelectorAll('.nn-dbg-guns button[data-v]').forEach(b => {
        const c = b.querySelector('canvas');
        N.weaponIcon(c.getContext('2d'), b.dataset.v, c.width, c.height);
      });
      el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => this.act(b.dataset.a, b.dataset.v)));
      this.renderLivs();
      this.renderCps();
      el.addEventListener('mousedown', e => e.stopPropagation());
      el.addEventListener('wheel', e => e.stopPropagation());
      const map = el.querySelector('.nn-dbg-map');
      map.addEventListener('click', e => this.mapClick(e, map));
      map.addEventListener('wheel', e => { e.preventDefault(); this.mapZoom(e, map); }, { passive: false });
      const stars = el.querySelector('.nn-dbg-stars');
      stars.addEventListener('click', e => {
        const r = stars.getBoundingClientRect();
        const i = N.clamp(Math.floor((e.clientX - r.left) / r.width * 6), 0, 5);
        const w = this.ui.game.world;
        w.setWanted(w.wanted.level === i + 1 ? i : i + 1);
        this.say('Розыск: ' + w.wanted.level);
        this.refresh();
      });
    }

    renderCps() {
      const row = this.el && this.el.querySelector('.nn-dbg-cps');
      if (!row) return;
      const g = this.ui.game, m = g.mission;
      const key = m ? m.def.id + ':' + (m.cp ? m.cp.i : -1) : '';
      if (row.dataset.key === key) return;
      row.dataset.key = key;
      row.innerHTML = m ? m.def.steps.map((s, i) => (s.type === 'cp' ? this.btn('mcp', i, esc(s.name || s.id), m.cp && m.cp.i === i ? ' class="on"' : '') : '')).join('') || '<span class="nn-dbg-sub">Нет контрольных точек</span>' : '<span class="nn-dbg-sub">Задание не идёт</span>';
      row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => this.act(b.dataset.a, b.dataset.v)));
    }

    startMission(id, cpIndex) {
      const g = this.ui.game;
      if (g.cut) g.endCut();
      if (g.mission) { g.mission.dispose(); g.mission = null; }
      if (g.failInfo) { g.failInfo.run.dispose(); g.failInfo = null; g.failReq = false; }
      g.death = null;
      g.fade = null;
      for (const m of N.MISSIONS) { if (m.id === id) break; g.state.done[m.id] = true; }
      delete g.state.done[id];
      if (N.MISSIONS.findIndex(m => m.id === id) > N.MISSIONS.findIndex(m => m.id === 'm7') && !g.flags.ledger) g.flag('ledger', 'kesha');
      const def = N.MISSION_BY[id];
      if (cpIndex === undefined) {
        const p = def.marker ? g.city.places[def.marker] : null;
        if (p) g.putPlayer(p.x, p.z, p.yaw);
        return g.startMission(id);
      }
      const s = def.steps[cpIndex];
      g.world.setWanted(0);
      g.msg.title = { text: def.title, t: 3 };
      g.mission = new N.MissionRun(g, def, { cp: { i: cpIndex, id: s.id, name: s.name || s.id, vars: {}, snap: g.snapPlayer() } });
      return true;
    }

    livName(l) {
      return l ? LIVERIES[l] || l : 'Обычная';
    }

    renderLivs() {
      const row = this.el && this.el.querySelector('.nn-dbg-livs');
      if (!row) return;
      const spec = N.VEHICLES[this.car.model], keys = Object.keys(spec.liveries || {});
      row.innerHTML = (military(spec) ? [] : ['']).concat(keys).map(l => this.btn('liv', l, esc(this.livName(l)))).join('');
      row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => this.act(b.dataset.a, b.dataset.v)));
    }

    spawnCar(drive) {
      const w = this.ui.game.world, pl = w.player, spec = N.VEHICLES[this.car.model];
      const base = pl.veh || pl, fx = Math.sin(base.yaw), fz = -Math.cos(base.yaw);
      const d = (pl.veh ? pl.veh.spec.hl : 0.6) + spec.hl + 2;
      const v = w.spawnVehicle(this.car.model, base.x + fx * d, base.z + fz * d, base.yaw, { livery: this.car.livery || null, persistent: true });
      this.spawned.push(v);
      if (drive) {
        if (pl.veh) w.exitVehicle(pl);
        w.seat(pl, v, true);
        pl.anim.sit = 1;
        v.used = true;
        v.ctl = { thr: 0, steer: 0, hand: false };
        w.emit({ t: 'enter', v });
        this.ui.resetCam();
      }
      return v;
    }

    say(text) {
      const m = this.el && this.el.querySelector('.nn-dbg-msg');
      if (m) m.textContent = text;
      if (this.ui.audio.on) this.ui.audio.play('menu');
    }

    act(a, v) {
      const ui = this.ui, g = ui.game, w = g.world, pl = w.player;
      if (a === 'gun') {
        const it = GUNS.find(q => q[0] === v);
        g.giveWeapon(v, it[1]);
        if (!pl.veh) pl.weapon = v;
        this.say('Выдано: ' + N.WEAPONS[v].name);
      } else if (a === 'guns') {
        for (const [id, n] of GUNS) g.giveWeapon(id, n);
        if (!pl.veh) pl.weapon = 'ak';
        this.say('Выдан весь арсенал');
      } else if (a === 'money') {
        const n = +v;
        g.state.money = n ? g.state.money + n : 0;
        this.say(n ? 'Деньги: +' + N.money(n) : 'Деньги обнулены');
        if (n && ui.audio.on) ui.audio.play('money');
      } else if (a === 'tp') {
        const p = g.city.places[v];
        if (!p) return;
        if (p.y !== undefined) g.teleport(v);
        else g.teleportTo(p.x, p.z);
        ui.resetCam();
        this.say('Телепорт: ' + SPOTS.find(q => q[0] === v)[1]);
      } else if (a === 'goal') {
        const b = this.goal();
        if (!b) { this.say('Нет цели: возьми задание'); return; }
        g.teleportTo(b.x + 4, b.z);
        ui.resetCam();
        this.say('Телепорт к цели задания');
      } else if (a === 'wx') {
        if (v === 'auto') { w.wx.lock = false; this.say('Погода меняется сама'); }
        else { w.setWeather(v, 'fast', true); this.say('Погода: ' + N.WEATHER[v].name.toLowerCase()); }
      } else if (a === 'bolt') {
        w.wx.lightning(N.lerp(450, 1600, Math.random()));
        this.say('Удар молнии');
      } else if (a === 'hour') {
        w.clock = (+v * 60) % 1440;
        this.say('Время: ' + N.clock(w.clock));
      } else if (a === 'clock') {
        w.clockRate = w.clockRate ? 0 : 1;
        this.say(w.clockRate ? 'Часы идут' : 'Часы остановлены');
      } else if (a === 'god') {
        w.god = !w.god;
        this.say(w.god ? 'Бессмертие включено' : 'Бессмертие выключено');
      } else if (a === 'run') {
        w.superRun = !w.superRun;
        this.say(w.superRun ? 'Супербег включён' : 'Супербег выключен');
      } else if (a === 'jump') {
        w.superJump = !w.superJump;
        this.say(w.superJump ? 'Суперпрыжок включён: падения не ранят' : 'Суперпрыжок выключен');
      } else if (a === 'fly') {
        w.setFly(!w.fly);
        this.say(w.fly ? (pl.veh ? 'Полёт включится, когда выйдешь из машины' : 'Полёт включён: стены не мешают') : 'Полёт выключен');
      } else if (a === 'heal') {
        pl.hp = pl.maxHp;
        pl.armor = pl.maxArmor;
        this.say('Здоровье и броня восстановлены');
      } else if (a === 'fix') {
        const c = pl.veh;
        if (!c) { this.say('Сначала сядь в машину'); return; }
        Object.assign(c, { hp: c.maxHp, burning: false, burnT: 0, fire: 0, smoke: 0, popped: false, damageFactor: 1 });
        if (c.up < 0.9) Object.assign(c, { roll: 0, pitch: 0, wp: 0, wr: 0, vy: 0, upT: 0, up: 1, y: w.city.groundY(c.x, c.z) + 0.1 });
        this.say('Машина как новая');
      } else if (a === 'wanted') {
        const n = +v;
        w.setWanted(n === 1 || n === -1 ? N.clamp(w.wanted.level + n, 0, 6) : n);
        this.say(w.wanted.level ? 'Розыск: ' + w.wanted.level : 'Розыск снят');
      } else if (a === 'car') {
        const spec = N.VEHICLES[v];
        this.car.model = v;
        if (!(spec.liveries && spec.liveries[this.car.livery])) this.car.livery = military(spec) ? Object.keys(spec.liveries)[0] : '';
        this.renderLivs();
        this.say('Выбран: ' + spec.name);
      } else if (a === 'liv') {
        this.car.livery = v || '';
        this.say('Окраска: ' + this.livName(this.car.livery));
      } else if (a === 'spawn' || a === 'drive') {
        const c = this.spawnCar(a === 'drive');
        this.say((a === 'drive' ? 'За рулём: ' : 'Поставлен: ') + c.spec.name + ' · ' + this.livName(c.livery));
        if (a === 'drive') { this.refresh(); this.close(); return; }
      } else if (a === 'street') {
        const list = [...w.broken.keys()];
        for (const rec of list) N.Debris.restore(w, rec);
        w.debris.length = 0;
        this.say(list.length ? 'Восстановлено: ' + list.length : 'Всё и так цело');
      } else if (a === 'crowd') {
        if (w.passers) w.passers.px = null;
        N.AI.crowd(w);
        this.say(w.passers ? 'Прохожих рядом: ' + w.passers.live : 'Прохожих нет');
      } else if (a === 'green') {
        const q = g.city.greenSpots && g.city.greenSpots[v];
        if (!q) { this.say('Такого места нет'); return; }
        g.teleportTo(q.x, q.z);
        if (!pl.veh) pl.yaw = Math.atan2(q.tx - pl.x, -(q.tz - pl.z));
        ui.resetCam();
        this.say('Телепорт: ' + GREEN_SPOTS.find(s => s[0] === v)[1]);
      } else if (a === 'mission') {
        this.startMission(v);
        this.say('Задание: ' + N.MISSION_BY[v].title);
        this.refresh();
        this.close();
        return;
      } else if (a === 'mcp') {
        if (!g.mission) { this.say('Сначала начни задание'); return; }
        const id = g.mission.def.id, s = g.mission.def.steps[+v];
        this.startMission(id, +v);
        this.say('Контрольная точка: ' + (s.name || s.id));
        this.refresh();
        this.close();
        return;
      } else if (a === 'mpass') {
        if (!g.mission) { this.say('Задание не идёт'); return; }
        if (g.cut) g.endCut();
        const t = g.mission.def.title;
        g.mission.complete();
        this.say('Пройдено: ' + t);
      } else if (a === 'mfail') {
        if (!g.mission) { this.say('Задание не идёт'); return; }
        g.mission.fail('Провалено из меню отладки.');
        this.say('Задание провалено — через пару секунд будет меню');
        this.close();
        return;
      } else if (a === 'ledger') {
        g.flag('ledger', v);
        this.say('Тетрадь отдана: ' + (v === 'lyova' ? 'Лёве' : 'Кеше'));
      } else if (a === 'unspawn') {
        let n = 0;
        for (const c of this.spawned) if (!c.removed && c !== pl.veh) { w.removeVehicle(c); n++; }
        this.spawned = this.spawned.filter(c => !c.removed);
        this.say(n ? 'Убрано машин: ' + n : 'Убирать нечего');
      }
      this.refresh();
    }

    goal() {
      const g = this.ui.game;
      const bl = g.blips();
      const b = bl.find(q => q.type === 'dest') || bl.find(q => q.ent) || bl[0];
      if (!b) return null;
      if (b.ent) { const e = b.ent.veh || b.ent; return { x: e.x, z: e.z }; }
      return { x: b.x, z: b.z };
    }

    fit(c) {
      const city = this.ui.city;
      const s = Math.min(c.width / (city.PX1 - city.PX0), c.height / (city.PZ1 - city.PZ0)) * 0.98;
      return { x: (city.PX0 + city.PX1) / 2, z: (city.PZ0 + city.PZ1) / 2, s, s0: s };
    }

    mapPoint(e, c) {
      const r = c.getBoundingClientRect();
      const V = this.view || (this.view = this.fit(c));
      const mx = (e.clientX - r.left) / r.width * c.width, my = (e.clientY - r.top) / r.height * c.height;
      return { mx, my, x: V.x + (mx - c.width / 2) / V.s, z: V.z + (my - c.height / 2) / V.s };
    }

    mapClick(e, c) {
      const q = this.mapPoint(e, c);
      const g = this.ui.game;
      g.teleportTo(q.x, q.z);
      this.ui.resetCam();
      this.say('Телепорт: ' + g.city.zoneAt(g.world.player.x, g.world.player.z));
      this.refresh();
    }

    mapZoom(e, c) {
      const V = this.view || (this.view = this.fit(c));
      const q = this.mapPoint(e, c);
      const k = e.deltaY < 0 ? 1.25 : 0.8;
      const s = N.clamp(V.s * k, V.s0, V.s0 * 14);
      V.x = q.x - (q.mx - c.width / 2) / s;
      V.z = q.z - (q.my - c.height / 2) / s;
      V.s = s;
      this.drawMap();
    }

    drawMap() {
      const c = this.el && this.el.querySelector('.nn-dbg-map');
      if (!c) return;
      const ui = this.ui, g = ui.game, pl = g.world.player;
      const ctx = c.getContext('2d');
      const map = ui.hud.ensureMap();
      const V = this.view || (this.view = this.fit(c));
      ctx.fillStyle = '#4a6a3e';
      ctx.fillRect(0, 0, c.width, c.height);
      const ox = c.width / 2 - V.x * V.s, oz = c.height / 2 - V.z * V.s;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(map, ox + map.ox * V.s, oz + map.oz * V.s, map.width / map.s * V.s, map.height / map.s * V.s);
      for (const ic of g.radarIcons()) {
        ctx.fillStyle = ic.icon === 'letter' ? '#ffd030' : ic.icon === 'save' ? '#3ac0ff' : ic.icon === 'hosp' ? '#ffffff' : ic.icon === 'ovd' ? '#2050c0' : '#ffa030';
        ctx.fillRect(ox + ic.x * V.s - 2.5, oz + ic.z * V.s - 2.5, 5, 5);
      }
      for (const b of g.blips()) {
        const e = b.ent ? (b.ent.veh || b.ent) : b;
        const col = N.MARKER_COL[b.type] || [255, 255, 255];
        ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
        ctx.strokeStyle = '#000';
        ctx.beginPath(); ctx.arc(ox + e.x * V.s, oz + e.z * V.s, 4, 0, 7); ctx.fill(); ctx.stroke();
      }
      const op = g.city.outsidePos(pl.x, pl.z);
      const px = op.x, pz = op.z;
      ctx.save();
      ctx.translate(ox + px * V.s, oz + pz * V.s);
      ctx.rotate(pl.veh ? pl.veh.yaw : pl.yaw);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    drawStars() {
      const c = this.el && this.el.querySelector('.nn-dbg-stars');
      if (!c) return;
      const ctx = c.getContext('2d');
      const w = this.ui.game.world;
      ctx.clearRect(0, 0, c.width, c.height);
      for (let i = 0; i < 6; i++) N.drawBeacon(ctx, (i + 0.5) * c.width / 6, c.height * 0.52, 13, i < w.wanted.level, i, w.t);
    }

    text(k, v) {
      const e = this.el.querySelector(`[data-k="${k}"]`);
      if (e && e.textContent !== v) e.textContent = v;
    }

    mark(a, v, on) {
      this.el.querySelectorAll(`button[data-a="${a}"]${v !== undefined ? `[data-v="${v}"]` : ''}`).forEach(b => b.classList.toggle('on', !!on));
    }

    refresh() {
      if (!this.el) return;
      const g = this.ui.game, w = g.world, wx = w.wx, pl = w.player;
      this.text('money', N.money(g.state.money));
      this.text('where', g.city.zoneAt(pl.x, pl.z));
      this.text('wx', wx.name + (wx.lock ? ' · закреплено' : '') + ' · дождь ' + Math.round(wx.rain * 100) + '% · сырость ' + Math.round(wx.wet * 100) + '% · лужи ' + Math.round(wx.puddle * 100) + '%');
      this.text('clock', N.clock(w.clock) + (w.clockRate ? '' : ' · стоят'));
      this.text('hp', 'здоровье ' + Math.ceil(pl.hp) + ' · броня ' + Math.ceil(pl.armor));
      this.text('moves', [w.superRun && 'бег ×3', w.superJump && 'прыжок', w.fly && 'полёт · высота ' + Math.round(pl.y - g.city.groundY(pl.x, pl.z)) + ' м'].filter(Boolean).join(' · ') || 'выключены');
      this.text('wanted', w.wanted.level ? w.wanted.level + ' из 6' : 'нет');
      this.text('green', 'кустов ' + (g.city.bushes ? g.city.bushes.length : 0) + (w.hidden ? ' · в кустах' : pl.bush ? ' · в зарослях' : ''));
      this.text('crowd', w.passers ? 'рядом ' + w.passers.live + ' из ' + w.passers.target + ' · стоят ' + w.passers.still : 'нет');
      this.text('street', 'сломано ' + w.broken.size + ' · обломков ' + w.debris.length + ' · в движении ' + w.debris.filter(b => !b.sleep).length);
      this.text('veh', N.VEHICLES[this.car.model].name + ' · ' + this.livName(this.car.livery));
      const m = g.mission;
      this.text('mission', m ? m.def.title + ' · шаг ' + (m.i + 1) + ' из ' + m.def.steps.length + (m.cp ? ' · КТ «' + m.cp.name + '»' : '') : 'пройдено ' + Object.keys(g.state.done).filter(k => N.MISSION_BY[k]).length + ' из ' + N.MISSIONS.length + (g.flags.ledger ? ' · тетрадь: ' + (g.flags.ledger === 'lyova' ? 'Лёве' : 'Кеше') : ''));
      this.el.querySelectorAll('button[data-a="mission"]').forEach(b => b.classList.toggle('on', !!(m && m.def.id === b.dataset.v) || !!g.state.done[b.dataset.v]));
      this.mark('ledger', 'lyova', g.flags.ledger === 'lyova');
      this.mark('ledger', 'kesha', g.flags.ledger === 'kesha');
      this.renderCps();
      this.el.querySelectorAll('button[data-a="car"]').forEach(b => b.classList.toggle('on', b.dataset.v === this.car.model));
      this.el.querySelectorAll('button[data-a="liv"]').forEach(b => b.classList.toggle('on', (b.dataset.v || '') === this.car.livery));
      for (const id of N.WEATHER_IDS) this.mark('wx', id, wx.lock && wx.kind === id);
      this.mark('wx', 'auto', !wx.lock);
      this.mark('god', undefined, w.god);
      this.mark('run', undefined, w.superRun);
      this.mark('jump', undefined, w.superJump);
      this.mark('fly', undefined, w.fly);
      this.mark('clock', undefined, !w.clockRate);
      const gb = this.el.querySelector('button[data-a="goal"]');
      if (gb) gb.classList.toggle('dim', !this.goal());
      this.el.querySelectorAll('button[data-a="gun"]').forEach(b => b.classList.toggle('on', !!pl.weapons[b.dataset.v]));
      this.drawMap();
      this.drawStars();
    }

    tick(dt) {
      if (!this.open) return;
      this.t += dt;
      if (this.t >= 0.25) { this.t = 0; this.refresh(); }
    }

    key(e) {
      const k = e.code;
      if (k === 'F7' || k === 'Escape') { e.preventDefault(); this.close(); return; }
      const btns = Array.from(this.el.querySelectorAll('button'));
      let i = btns.indexOf(document.activeElement);
      if (k === 'ArrowRight' || k === 'ArrowLeft') {
        e.preventDefault();
        i = i < 0 ? 0 : (i + (k === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length;
        btns[i].focus({ preventScroll: false });
      } else if (k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        const cur = btns[i] || btns[0];
        const secs = Array.from(this.el.querySelectorAll('section'));
        const si = secs.indexOf(cur.closest('section'));
        const next = secs[(si + (k === 'ArrowDown' ? 1 : -1) + secs.length) % secs.length];
        const r0 = cur.getBoundingClientRect();
        let best = null, bd = Infinity;
        next.querySelectorAll('button').forEach(b => { const r = b.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - r0.left - r0.width / 2) + (r.top - next.getBoundingClientRect().top) * 0.5; if (d < bd) { bd = d; best = b; } });
        if (best) best.focus({ preventScroll: false });
      } else if (k === 'Enter' || k === 'NumpadEnter' || k === 'Space') {
        e.preventDefault();
        if (btns[i]) btns[i].click();
      }
    }
  }

  Debug.SPOTS = SPOTS;
  Debug.GUNS = GUNS;
  N.Debug = Debug;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
