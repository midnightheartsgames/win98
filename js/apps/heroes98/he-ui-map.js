(function (H) {
  'use strict';
  const MD = H.MapData, D = H.MapDraw, Adv = H.Adv, T = 32;
  const VIEW = { x: 0, y: 24, w: 800, h: 448 };
  const MINI = { x: 6, y: 478, w: 116, h: 116 };
  const hit = (b, x, y) => x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h;
  const RES_NAMES = Object.fromEntries(H.RESOURCES);
  const gainText = res => Object.entries(res).map(([k, v]) => '+' + v + ' ' + RES_NAMES[k].toLowerCase()).join(', ');
  const HE = H.Hero;

  class MapView {
    constructor(ui, def) {
      this.ui = ui;
      this.def = def;
      this.S = def.S || Adv.create(def.map, def.setup);
      this.pid = Math.max(0, this.S.players.findIndex(p => p.human));
      this.level = 0;
      this.sel = (this.myHeroes()[0] || { id: 0 }).id;
      this.selOf = {};
      this.goalOf = {};
      this.ai = null;
      this.theme = 'meadow';
      this.finished = false;
      this.cam = { x: 0, y: 0 };
      this.cache = new Map();
      this.plan = null;
      this.moving = null;
      this.anim = null;
      this.toasts = [];
      this.modal = null;
      this.modalQueue = [];
      this.hover = null;
      this.mouse = [0, 0];
      this.info = null;
      this.time = 0;
      this.ver = -1;
      this.hoverPath = null;
      const col = [['end', 'Конец дня (E)'], ['next', 'Герой (H)'], ['level', 'Подлунье (U)'], ['book', 'Книга (B)'], ['kingdom', 'Держава (K)'], ['menu', 'Меню (Esc)']];
      this.buttons = col.map(([id, label], i) => ({ id, label, x: 684, y: 476 + i * 20, w: 112, h: 18 }));
      this.buttons.push({ id: 'dig', label: 'Копать (G)', x: 358, y: 520, w: 84, h: 16 });
      this.center(this.hero());
      this.toast((def.name || this.S.mapName) + ': ' + H.Moons.dateText(this.S));
      this.pickTheme();
    }

    pickTheme() {
      const h = this.hero(), own = this.S.players[this.pid].faction;
      const ground = h && h.alive ? MD.terrainAt(this.S.map, h.l, h.c, h.r).id : own === 'barrows' ? 'steppe' : 'meadow';
      this.theme = ground === 'steppe' || ground === 'saltflat' || ground === 'ash' || ground === 'highland' ? 'steppe' : 'meadow';
      if (this.ui.view === this) this.ui.music(this.theme);
    }

    resume() {
      const B = this.S.battle;
      if (B) {
        this.ui.show(this);
        this.showBattle({ name: B.name, player: B.player, humans: B.humans, colors: B.colors, seed: B.seed, B: B.B, resumed: true });
        return;
      }
      this.beginTurn(false);
    }

    hotSeat() {
      return this.S.players.filter(p => p.human && !p.out).length > 1;
    }

    beginTurn(fresh, first) {
      if (this.S.over) return;
      const t = this.S.turn;
      if (!this.S.players[t].human) {
        this.ai = H.AI.begin(this.S, t);
        return;
      }
      this.ai = null;
      const handOver = this.hotSeat() && (fresh || first || t !== this.pid);
      if (t !== this.pid) this.takeSeat(t);
      if (!handOver) {
        this.turnStarts(fresh);
        return;
      }
      this.ui.show(new H.PassView(this.ui, this, () => {
        this.ui.show(this);
        this.turnStarts(fresh);
      }));
    }

    takeSeat(pid) {
      this.selOf[this.pid] = this.sel;
      this.pid = pid;
      const mine = this.myHeroes(), keep = this.selOf[pid];
      this.sel = mine.some(h => h.id === keep) ? keep : (mine[0] || { id: 0 }).id;
      this.plan = null;
      this.kingdom = null;
      this.calendar = false;
      this.info = null;
      this.ver = -1;
      const h = this.hero(), town = H.Town.list(this.S, pid)[0];
      if (h && h.alive && h.owner === pid) this.center(h);
      else if (town) this.center(town);
    }

    turnStarts(fresh) {
      if (!fresh) return;
      this.ui.autosave(this);
      this.restoreGoal();
      this.pickTheme();
    }

    thumb() {
      this.refresh();
      const M = this.S.map, cv = document.createElement('canvas'), k = 64 / Math.max(M.w, M.h);
      cv.width = Math.round(M.w * k);
      cv.height = Math.round(M.h * k);
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(this.mini, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/png');
    }

    hero() {
      return this.S.heroes[this.sel];
    }

    myHeroes() {
      return this.S.heroes.filter(h => h.alive && h.owner === this.pid);
    }

    center(h) {
      if (!h) return;
      this.level = h.l;
      this.cam.x = h.c * T + 16 - VIEW.w / 2;
      this.cam.y = h.r * T + 16 - VIEW.h / 2;
      this.clampCam();
    }

    clampCam() {
      const M = this.S.map;
      this.cam.x = H.clamp(this.cam.x, 0, Math.max(0, M.w * T - VIEW.w));
      this.cam.y = H.clamp(this.cam.y, 0, Math.max(0, M.h * T - VIEW.h));
    }

    toast(text, color) {
      this.toasts.push({ text, color: color || '#f0e2b8', t: 0 });
      if (this.toasts.length > 4) this.toasts.shift();
    }

    refresh() {
      if (this.ver === this.S.ver && this.verLevel === this.level) return;
      this.ver = this.S.ver;
      this.verLevel = this.level;
      this.vis = Adv.visible(this.S, this.pid, this.level);
      this.mini = D.minimap(this.S, this.level, this.pid, this.vis);
      this.hoverPath = null;
    }

    foreign(ev) {
      for (const e of ev) {
        if (e.t === 'lost' && this.S.heroes[e.hero].owner === this.pid) this.toast('Ваш герой пал: ' + this.S.heroes[e.hero].name, '#ff9080');
        else if (e.t === 'caravanTaken' && this.S.heroes[e.hero].owner !== this.pid) this.toast('Обоз разграблен', '#ffb080');
        else if (e.t === 'townTaken') {
          const t = H.Town.byId(this.S, e.town);
          this.toast(t.name + ': город взял ' + H.PLAYER_NAMES[this.S.players[this.S.heroes[e.hero].owner].color] + ' игрок', '#ffb080');
        } else if (e.t === 'out') this.toast(H.PLAYER_NAMES[this.S.players[e.player].color] + ' игрок выбыл', '#ffb080');
      }
    }

    events(ev) {
      for (const e of ev) {
        if (e.t === 'gain') this.toast((Object.keys(e.res).length ? gainText(e.res) : '') + (e.xp ? (Object.keys(e.res).length ? ', ' : '') + '+' + e.xp + ' опыта' : ''), '#ffe080');
        else if (e.t === 'capture') this.toast(H.OBJ[this.S.map.objs.find(o => o.id === e.obj).t].name + ': теперь ваш', '#a0e0ff');
        else if (e.t === 'tired') this.toast('Шаги на сегодня кончились');
        else if (e.t === 'won' && this.S.heroes[e.hero].owner === this.pid) this.toast('Победа! +' + e.xp + ' опыта', '#ffe080');
        else if (e.t === 'looted' && this.S.heroes[e.hero].owner === this.pid) this.toast('Взято артефактов: ' + e.count, '#ffe080');
        else if (e.t === 'out') this.toast(H.PLAYER_NAMES[this.S.players[e.player].color] + ' игрок выбыл', '#ffb080');
        else if (e.t === 'barrow' && e.player === this.pid) this.toast(e.town != null ? 'В курган ушли тени павших: ' + e.count : 'Тени павших бродят без кургана: ' + e.count, '#d8d0b0');
        else if (e.t === 'goal') this.toast((e.state === 'done' ? 'Выполнено: ' : e.state === 'fail' ? 'Провалено: ' : 'Новая цель: ') + e.text, e.state === 'fail' ? '#ff9080' : '#ffe080');
        else if (e.t === 'dealDone' && e.player === this.pid) this.toast('Контракт исполнен' + (Object.keys(e.res).length ? ': ' + gainText(e.res) : ''), '#ffe080');
        else if (e.t === 'dealLost' && e.player === this.pid) this.toast('Контракт «' + H.Contracts.TITLE[e.kind] + '» сорван' + (e.late ? ': срок вышел' : ''), '#ff9080');
        else if (e.t === 'joined') this.toast(H.UNITS[e.unit].name + ' в войске' + (e.price ? ' (−' + e.price + ' золота)' : ''), '#a0ffa0');
        else if (e.t === 'fled') this.toast(H.UNITS[e.unit].name + ' ушли');
        else if (e.t === 'retreat') this.toast('Герой отошёл');
        else if (e.t === 'day') this.toast('День ' + Adv.date(this.S).day + ', неделя ' + Adv.date(this.S).week);
        else if (e.t === 'income' && e.player === this.pid) this.toast('Доход: ' + gainText(e.res), '#ffe080');
        else if (e.t === 'week') {
          const m = H.Moons.current(this.S);
          this.openModal(m ? 'Неделя ' + m.of : 'Неделя ' + e.week, [...(m ? H.Font.wrap('text', m.about, 380) : []), 'В городах новый прирост существ, нейтралы выросли.', ...(H.Town.list(this.S, this.pid).some(H.Contracts.desk) ? ['В Ратуше контрактов новые бумаги.'] : [])], [['ok', 'Дальше']], () => {});
        }
        else if (e.t === 'lost') this.toast(this.S.heroes[e.hero].owner === this.pid ? 'Герой пал' : 'Вражеский герой пал', this.S.heroes[e.hero].owner === this.pid ? '#ff9080' : '#a0ffa0');
        else if (e.t === 'townTaken') this.toast(H.Town.byId(this.S, e.town).name + (this.S.heroes[e.hero].owner === this.pid ? ': город теперь ваш' : ': город потерян'), this.S.heroes[e.hero].owner === this.pid ? '#a0e0ff' : '#ff9080');
        else if (e.t === 'withdrew' && this.S.heroes[e.hero].owner === this.pid) this.toast(this.S.heroes[e.hero].name + ': завтра ждёт в таверне', '#ffe080');
        else if (e.t === 'withdrew') this.toast('Вражеский герой ' + (e.kind === 'ransom' ? 'откупился' : 'бежал'), '#a0ffa0');
        else if (e.t === 'machineLost' && this.S.heroes[e.hero].owner === this.pid) this.toast(H.UNITS[e.unit].name + ': машина разбита', '#ff9080');
        else if (e.t === 'caravanTaken' && this.S.heroes[e.hero].owner === this.pid) this.toast('Обоз взят, существа в войске', '#a0ffa0');
        else if (e.t === 'caravanCame' && e.owner === this.pid) this.toast('Обоз пришёл: ' + H.Town.byId(this.S, e.town).name, '#a0e0ff');
        else if (e.t === 'star' && this.S.heroes[e.hero].owner === this.pid) this.toast(H.UNITS[e.unit].name + ': звезда бывалых', '#ffe060');
        else if (e.t === 'artifact') this.toast('Найдено: ' + H.ARTIFACTS[e.art].name, '#ffe080');
        else if (e.t === 'bagfull') this.toast('Сумка полна, вещь осталась лежать', '#ff9080');
        else if (e.t === 'learned') this.toast(this.S.heroes[e.hero].name + ': выучено ' + e.spells.map(id => H.SPELLS[id].name).join(', '), '#a0e0ff');
        else if (e.t === 'scroll') this.toast('Свиток «' + H.SPELLS[e.spell].name + '» в сумке: герою не хватает школы', '#ffe080');
        else if (e.t === 'shrine') this.toast(H.SPELLS[e.spell].name + (e.known ? ': герой уже знает' : ': герою не хватает школы'), '#ffe080');
        else if (e.t === 'landed') this.toast(this.S.heroes[e.hero].name + ' вернулся на сушу', '#ffe080');
        else if (e.t === 'collect' && this.S.heroes[e.hero].owner === this.pid) this.openModal('Сборщик: ' + this.S.heroes[e.hero].name, ['Какой редкий ресурс собрать на этой неделе?'], HE.RARE.map(r => [r, RES_NAMES[r]]), id => HE.collect(this.S, this.S.heroes[e.hero], id));
        else if (e.t === 'town' && this.S.heroes[e.hero].owner === this.pid) this.townAfter = e.town;
        else if (e.t === 'note') this.toast(e.text, e.color);
        else if (e.t === 'read') this.openModal(e.title, H.Font.wrap('text', e.text, 380), [['ok', 'Дальше']], () => {});
        else if (e.t === 'menhir') this.openModal('Менгир', ['Камень показывает, где лежит Сердце Восьмой луны.', 'Посещено менгиров: ' + e.count + '. Карта Сердца в Державе.'], [['ok', 'Дальше']], () => {});
        else if (e.t === 'teleport') {
          this.plan = null;
          this.center(this.S.heroes[e.hero]);
        } else if (e.t === 'boarded') this.toast(this.S.heroes[e.hero].name + ' на борту');
        else if (e.t === 'freed') this.toast(this.S.heroes[e.hero].name + ' теперь с вами', '#a0ffa0');
        else if (e.t === 'risen' && this.S.heroes[e.hero].owner === this.pid) this.toast(this.S.heroes[e.hero].name + ' встал на алтаре', '#a0e0ff');
        else if (e.t === 'heartFound') this.openModal('Сердце Восьмой луны', ['Камень светит без неба. Его надо привезти в свой город', 'и построить там лунный алтарь.'], [['ok', 'Дальше']], () => {});
        else if (e.t === 'heartHome') this.toast('Сердце в городе: можно строить лунный алтарь', '#ffe080');
        else if (e.t === 'terrain') this.cache.clear();
        else if (e.t === 'scene') {
          this.plan = null;
          this.moving = null;
        }
      }
      this.ensureHero();
    }

    ensureHero() {
      const h = this.hero();
      if (h && h.alive && h.owner === this.pid) return;
      this.plan = null;
      const list = this.myHeroes();
      if (list.length) {
        this.sel = list[0].id;
        this.center(list[0]);
      }
    }

    finish() {
      if (this.finished) return;
      this.finished = true;
      this.ai = null;
      this.ui.show(this.S.campaign ? new H.MissionEndView(this.ui, this) : new H.ResultView(this.ui, this));
    }

    openModal(title, lines, buttons, pick) {
      if (this.modal) {
        this.modalQueue.push([title, lines, buttons, pick]);
        return;
      }
      const w = Math.max(420, buttons.length * 128 + 20), h = 74 + lines.length * 16 + 34;
      this.modal = { title, lines, pick, x: (H.W - w) / 2, y: 140, w, h, buttons: buttons.map(([id, label, off], i) => ({ id, label, off, x: (H.W - w) / 2 + w / 2 - buttons.length * 64 + i * 128 + 4, y: 140 + h - 40, w: 120, h: 24 })) };
    }

    closeModal(id) {
      const m = this.modal;
      this.modal = null;
      m.pick(id);
      if (!this.modal && this.modalQueue.length) this.openModal(...this.modalQueue.shift());
    }

    pendingModal() {
      const p = this.S.pending;
      if (!p || this.modal) return;
      const hero = this.S.heroes[p.hero];
      if (hero.owner !== this.pid) return;
      if (p.kind === 'caravan') {
        const wagon = this.S.caravans.find(v => v.id === p.caravan);
        const lines = ['Обоз без героя везёт:', ...wagon.stacks.map(s => H.UNITS[s.unit].name + ': ' + Adv.strength(s.count).toLowerCase()), 'Победитель забирает половину существ, если в войске есть место.', this.forecastText({ stacks: wagon.stacks.map(s => ({ unit: s.unit, count: s.count })) })];
        this.openModal('Обоз: ' + H.PLAYER_NAMES[this.S.players[wagon.owner].color] + ' игрок', lines, [['fight', 'В бой'], ['retreat', 'Отойти']], id => (id === 'fight' ? this.fight() : this.events(Adv.resolve(this.S, id))));
        return;
      }
      if (p.kind === 'duel') {
        const foe = this.S.heroes[p.enemy], exact = HE.hasPerk(hero, 'recon') || HE.hasPerk(hero, 'spy');
        const lines = [H.CLASSES[foe.cls].name + ', уровень ' + foe.level, ...foe.army.filter(Boolean).map(s => H.UNITS[s.unit].name + ': ' + (exact ? s.count : Adv.strength(s.count).toLowerCase())), this.forecastText(HE.battleSide(foe, foe.army.map((s, i) => (s ? i : -1)).filter(i => i >= 0)))];
        this.openModal('Вражеский герой: ' + foe.name, lines, [['fight', 'В бой'], ['retreat', 'Отойти']], id => (id === 'fight' ? this.fight() : this.events(Adv.resolve(this.S, id))));
        return;
      }
      if (p.kind === 'choice') {
        this.openModal(p.title, p.lines, p.options, id => this.events(Adv.resolve(this.S, id)));
        return;
      }
      if (p.kind === 'vault') {
        const o = Adv.obj(this.S, p.obj), stacks = H.Sites.vaultGuards(o), prize = H.Sites.vaultPrize(o), exact = HE.hasPerk(hero, 'recon') || HE.hasPerk(hero, 'spy'), rows = new Map();
        for (const s of stacks) rows.set(s.unit, (rows.get(s.unit) || 0) + s.count);
        const lines = [...[...rows].map(([u, n]) => H.UNITS[u].name + ': ' + (exact ? n : Adv.strength(n).toLowerCase())), 'Награда: ' + prize.gold + ' золота' + (Object.keys(prize.res).length ? ', ' + gainText(prize.res).replace(/\+/g, '') : '') + (prize.rank ? ', ' + H.ART_RANKS[prize.rank][0] + ' артефакт' : ''), this.forecastText({ stacks })];
        this.openModal(H.OBJ[o.t].name, lines, [['fight', 'В бой'], ['retreat', 'Отойти']], id => (id === 'fight' ? this.fight() : this.events(Adv.resolve(this.S, id))));
        return;
      }
      if (p.kind === 'chest') {
        this.openModal('Сундук', ['В сундуке золото. Можно взять его себе', 'или раздать людям и получить опыт.'], [['gold', p.gold + ' золота'], ['xp', p.xp + ' опыта']], id => this.events(Adv.resolve(this.S, id)));
        return;
      }
      if (p.kind === 'town') {
        const t = Adv.obj(this.S, p.obj), guest = H.Town.visitor(this.S, t), own = guest ? guest.army.filter(Boolean) : [], stacks = [...own, ...t.garrison.filter(Boolean)];
        const exact = HE.hasPerk(hero, 'recon') || HE.hasPerk(hero, 'spy'), fort = Adv.fortLevel(t);
        const side = guest ? HE.battleSide(guest, guest.army.map((s, i) => (s ? i : -1)).filter(i => i >= 0)) : {};
        side.stacks = stacks.map(s => ({ unit: s.unit, count: s.count, stars: s.stars || 0, vet: s.vet || 0 }));
        const held = side.stacks.reduce((n, s) => n + s.count * H.UNITS[s.unit].cost, 0);
        const lines = [(guest ? 'Внутри герой ' + guest.name + ' и гарнизон:' : 'Держит гарнизон:'), ...stacks.slice(0, 7).map(s => H.UNITS[s.unit].name + ': ' + (exact ? s.count : Adv.strength(s.count).toLowerCase())), fort ? 'Осада: ' + H.Town.def(t, 'fort' + fort).name.toLowerCase() + (H.SIEGE.towers[fort] ? ', башни бьют каждый раунд' : '') + (fort >= 3 ? ', ров' : '') : 'Стен нет, бой в поле.', this.forecastText(side, Adv.siegeOf(t, held))];
        this.openModal(t.t === 'town' ? 'Город ' + t.name : H.OBJ[t.t].name, lines, [['fight', 'В бой'], ['retreat', 'Отойти']], id => (id === 'fight' ? this.fight() : this.events(Adv.resolve(this.S, id))));
        return;
      }
      if (p.kind !== 'encounter') return;
      const o = Adv.obj(this.S, p.obj), u = H.UNITS[o.unit], pct = v => Math.round(v * 100) + ' %';
      const exact = HE.hasPerk(hero, 'recon') || HE.hasPerk(hero, 'spy');
      const lines = [(exact ? 'Точно ' + o.count : Adv.strength(o.count)) + ' · нрав ' + H.MAP.mood[o.mood], (p.ratio >= 1 ? 'Ваше войско сильнее в ' + p.ratio.toFixed(1) + ' раза' : 'Ваше войско слабее в ' + (1 / p.ratio).toFixed(1) + ' раза')];
      let buttons;
      lines.push(this.forecastText({ stacks: Adv.splitNeutral(o) }));
      if (p.offer === 'join') {
        const res = this.S.players[hero.owner].res, slot = hero.army.some(s => !s || s.unit === o.unit);
        lines.push(p.deal != null ? 'По контракту они идут к вам за ' + p.price + ' золота' : 'Они просятся к вам ' + (p.price ? 'за ' + p.price + ' золота' : 'даром') + ' (шанс ' + pct(p.chance) + ')');
        if (!slot) lines.push('В войске нет свободной ячейки');
        buttons = [['accept', 'Принять', !slot || res.gold < p.price], ['fight', 'В бой'], ['retreat', 'Отойти']];
      } else if (p.offer === 'flee') {
        lines.push('Они бегут от вас (просятся в войско с шансом ' + pct(p.chance) + ')');
        buttons = [['release', 'Отпустить'], ['fight', 'Догнать']];
      } else {
        lines.push('Они нападают');
        buttons = [['fight', 'В бой'], ['retreat', 'Отойти']];
      }
      this.openModal('Встреча: ' + u.name, lines, buttons, id => (id === 'fight' ? this.fight() : this.events(Adv.resolve(this.S, id))));
    }

    forecastText(side, siege) {
      const h = this.hero(), slots = h.army.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
      const e = H.BattleAI.estimate([HE.battleSide(h, slots), side], H.Moons.battle(this.S), siege);
      if (!e.win) return 'Оценка боя: скорее поражение';
      const loss = Math.round(e.lost[0] * 100);
      return 'Оценка боя: победа, потери около ' + loss + ' %';
    }

    fight() {
      this.runBattle(Adv.battleSetup(this.S));
    }

    runBattle(setup) {
      this.plan = null;
      this.moving = null;
      setup.B = H.Battle.create({ seed: setup.seed, sides: setup.sides, moon: setup.moon || null, siege: setup.siege || null, deck: setup.deck, field: setup.field });
      this.S.battle = { B: setup.B, name: setup.name, player: setup.player, humans: setup.humans, colors: setup.colors, seed: setup.seed };
      setup.replay = () => this.runBattle(setup);
      this.showBattle(setup);
    }

    showBattle(setup) {
      setup.done = B => {
        this.ui.show(this);
        this.events(Adv.battleDone(this.S, B));
        this.ver = -1;
      };
      this.ui.show(new H.BattleView(this.ui, setup));
    }

    runAI() {
      const stop = performance.now() + 10;
      while (this.ai && !this.modal && !this.anim && performance.now() < stop) {
        const r = H.AI.step(this.S, this.ai);
        this.foreign(r.ev);
        if (this.S.over) return;
        if (r.battle) {
          const hero = this.S.heroes[this.S.pending.hero], who = (r.battle.humans || []).length && this.hotSeat() ? this.S.players[this.defenderOf(this.S.pending)] : null;
          this.openModal(who ? 'Враг нападает: ' + H.PLAYER_NAMES[who.color] + ' игрок' : 'Враг нападает!', [hero.name + ' ведёт войско на ' + (who ? H.PLAYER_NAMES[who.color] + ' игрока.' : 'вас.')], [['fight', 'В бой']], () => this.runBattle(r.battle));
          return;
        }
        if (r.done) {
          this.ai = null;
          this.events(Adv.endTurn(this.S));
          this.beginTurn(true);
          return;
        }
        if (r.moved != null && this.ui.settings.showAI) {
          const h = this.S.heroes[r.moved], vis = Adv.visible(this.S, this.pid, h.l);
          if (vis[h.r * this.S.map.w + h.c] && h.l === this.level) {
            this.anim = { hero: h.id, from: r.from, to: r.to, t: 0 };
            this.ui.sfx('step', MD.terrainAt(this.S.map, h.l, h.c, h.r).id);
            return;
          }
        }
      }
    }

    defenderOf(p) {
      if (p.target === 'hero') return this.S.heroes[p.enemy].owner;
      if (p.target === 'town') return H.Town.byId(this.S, p.obj).owner;
      if (p.target === 'caravan') return this.S.caravans.find(v => v.id === p.caravan).owner;
      return this.pid;
    }

    meet(friend) {
      this.plan = null;
      this.moving = null;
      this.ui.show(new H.ExchangeView(this.ui, this, this.hero(), friend, { allied: true }));
    }

    go() {
      if (!this.plan || this.moving || this.S.pending) return;
      if (this.plan.here && this.plan.kind === 'meet') {
        this.meet(this.S.heroes[this.plan.target]);
        return;
      }
      if (this.plan.here) {
        this.events(Adv.engage(this.S, this.hero(), this.plan.target, this.plan.kind));
        this.plan = null;
        return;
      }
      this.moving = { stop: false };
    }

    stepOnce() {
      const h = this.hero(), next = this.plan && this.plan.steps[0];
      if (!next || next.day > 0 || this.moving.stop) {
        this.moving = null;
        if (this.plan && !this.plan.steps.length) this.plan = null;
        else if (this.plan) this.plan = Adv.path(this.S, h, this.plan.goal[0], this.plan.goal[1]);
        return;
      }
      const from = [h.c, h.r], res = Adv.step(this.S, h, next.c, next.r);
      this.events(res.ev);
      if (!res.ok) {
        this.moving = null;
        return;
      }
      if (!this.plan) {
        this.moving = null;
        return;
      }
      this.anim = { hero: h.id, from, to: [h.c, h.r], t: 0 };
      this.ui.sfx('step', MD.terrainAt(this.S.map, h.l, h.c, h.r).id);
      this.plan.steps.shift();
      if (!this.S.pending && !this.plan.steps.length && this.plan.kind === 'meet') {
        const friend = this.S.heroes[this.plan.target];
        if (friend.alive && HE.adjacent(h, friend)) this.meet(friend);
        else this.plan = null;
        this.moving = null;
        return;
      }
      if (this.S.pending || !this.plan.steps.length) {
        if (!this.S.pending && (this.plan.kind === 'duel' || this.plan.kind === 'caravan' || this.plan.kind === 'manage')) this.events(Adv.engage(this.S, h, this.plan.target, this.plan.kind));
        this.moving = null;
        this.plan = null;
      }
    }

    update(dt) {
      this.time += dt;
      for (const t of this.toasts) t.t += dt;
      this.toasts = this.toasts.filter(t => t.t < 3.2);
      const keys = this.ui.keys, speed = 640 * dt;
      if (!this.modal) {
        if (keys.has('ArrowLeft')) this.cam.x -= speed;
        if (keys.has('ArrowRight')) this.cam.x += speed;
        if (keys.has('ArrowUp')) this.cam.y -= speed;
        if (keys.has('ArrowDown')) this.cam.y += speed;
        const [mx, my] = this.mouse;
        if (this.edge && my >= VIEW.y && my < VIEW.y + VIEW.h) {
          if (mx < 6) this.cam.x -= speed;
          if (mx > H.W - 6) this.cam.x += speed;
        }
        this.clampCam();
      }
      if (this.anim) {
        const h = this.S.heroes[this.anim.hero];
        this.anim.t += dt * 8 * (this.ai ? 2 : 1) * this.ui.settings.heroSpeed;
        if (this.anim.t >= 1) this.anim = null;
        const [x, y] = this.heroPos(h);
        if (x - this.cam.x < 120 || x - this.cam.x > VIEW.w - 120 || y - this.cam.y < 100 || y - this.cam.y > VIEW.h - 100) {
          this.cam.x += (x - VIEW.w / 2 - this.cam.x) * Math.min(1, dt * 4);
          this.cam.y += (y - VIEW.h / 2 - this.cam.y) * Math.min(1, dt * 4);
          this.clampCam();
        }
      }
      if (this.moving && !this.anim) this.stepOnce();
      if (this.S.scene) return;
      if (this.S.over && !this.moving && !this.anim && !this.modal) {
        this.finish();
        return;
      }
      if (this.ai) {
        this.runAI();
        return;
      }
      if (this.S.turn !== this.pid && !this.modal && !this.S.pending) {
        this.beginTurn(false);
        return;
      }
      if (!this.moving && !this.anim) {
        this.pendingModal();
        this.pickTheme();
      }
      if (!this.moving && !this.anim && !this.modal && !this.S.pending) {
        const up = this.myHeroes().find(h => HE.levelPending(h));
        if (up) {
          this.ui.show(new H.LevelView(this.ui, this, up));
          return;
        }
      }
      if (this.townAfter && !this.moving && !this.anim && !this.modal && !this.S.pending) {
        const t = H.Town.byId(this.S, this.townAfter);
        this.townAfter = null;
        if (t && t.owner === this.pid) this.openTown(t);
      }
    }

    openBook() {
      const h = this.hero();
      if (!h || !h.alive) return;
      this.plan = null;
      this.ui.show(new H.BookView(this.ui, this, {
        hero: HE.battleHero(h),
        board: { moon: H.Moons.battle(this.S) },
        known: h.spells,
        road: HE.roadSpells(h),
        startTab: 'road',
        block: id => (H.SPELLS[id].school === 'road' ? (h.mana < H.SPELLS[id].mana ? 'Не хватает маны' : '') : 'Только в бою'),
        pick: id => {
          this.ui.show(this);
          this.castRoad(id);
        }
      }));
    }

    castRoad(id, arg) {
      const h = this.hero();
      if (id === 'moongate' && arg == null) {
        const towns = this.myTowns();
        if (!towns.length) {
          this.toast('Нет своего города', '#ff9080');
          return;
        }
        this.openModal('Лунные врата', ['Куда отправить героя?'], towns.slice(0, 5).map(t => [t.id, t.name]), tid => this.castRoad('moongate', tid));
        return;
      }
      const r = HE.castRoad(this.S, h, id, arg);
      if (!r.ok) {
        this.toast(r.why, '#ff9080');
        return;
      }
      this.toast(H.SPELLS[id].name, '#a0e0ff');
      this.plan = null;
      this.ver = -1;
      this.center(h);
    }

    heroGone() {
      const list = this.myHeroes();
      if (list.length) {
        this.sel = list[0].id;
        this.center(list[0]);
      }
      this.plan = null;
      this.ver = -1;
    }

    openTown(t) {
      this.plan = null;
      this.kingdom = null;
      this.ui.show(new H.TownView(this.ui, this, t));
    }

    myTowns() {
      return H.Town.list(this.S, this.pid);
    }

    back() {
      if (this.kingdom || this.calendar) {
        this.kingdom = null;
        this.calendar = false;
        return true;
      }
      return false;
    }

    heroPos(h) {
      if (this.anim && h.id === this.anim.hero) {
        const k = Math.min(1, this.anim.t), [fc, fr] = this.anim.from, [tc, tr] = this.anim.to;
        return [(fc + (tc - fc) * k) * T, (fr + (tr - fr) * k) * T];
      }
      return [h.c * T, h.r * T];
    }

    cellAt(x, y) {
      if (!hit(VIEW, x, y)) return null;
      const c = Math.floor((x - VIEW.x + this.cam.x) / T), r = Math.floor((y - VIEW.y + this.cam.y) / T);
      return MD.inside(this.S.map, c, r) ? [c, r] : null;
    }

    whatAt(c, r) {
      const S = this.S, M = S.map, l = this.level, seen = S.players[this.pid].seen[l][r * M.w + c], vis = this.vis[r * M.w + c];
      if (!seen) return { text: ['Не разведано'] };
      const wagon = Adv.caravanAt(S, l, c, r);
      if (wagon) return { text: ['Обоз: ' + H.PLAYER_NAMES[S.players[wagon.owner].color] + ' игрок', wagon.owner === this.pid ? wagon.stacks.map(x => H.UNITS[x.unit].name + ' ' + x.count).join(', ') : 'Без героя: ' + Adv.strength(wagon.stacks.reduce((t, x) => t + x.count, 0)).toLowerCase(), 'В город ' + H.Town.byId(S, wagon.to).name] };
      const h = Adv.heroAt(S, l, c, r);
      const bounty = h && vis ? S.players[this.pid].deals.find(d => d.hero === h.id) : null;
      if (h && vis) return { hero: h, text: [...(bounty ? ['Контракт, награда: ' + H.Contracts.rewardText(bounty)] : []), h.name, h.owner === this.pid ? 'войско: ' + h.army.filter(Boolean).map(s => H.UNITS[s.unit].name + ' ' + s.count).join(', ') : H.CLASSES[h.cls].name + ', ' + (Adv.allied(S, h.owner, this.pid) ? 'союзник' : H.PLAYER_NAMES[S.players[h.owner].color] + ' игрок') + ', войско: ' + Adv.strength(h.army.filter(Boolean).reduce((t, s) => t + s.count, 0)).toLowerCase()] };
      const g = Adv.grid(S, l), id = g.block[r * M.w + c] || g.entry[r * M.w + c], o = id && Adv.obj(S, id);
      if (o && (o.t !== 'monster' || vis || H.Contracts.dealOn(S, this.pid, o.id))) {
        const def = H.OBJ[o.t];
        if (def.kind === 'monster') {
          const me = this.hero(), exact = me && (HE.hasPerk(me, 'recon') || HE.hasPerk(me, 'spy'));
          const deal = H.Contracts.dealOn(S, this.pid, o.id);
          return { obj: o, text: [H.UNITS[o.unit].name, (exact ? 'точно ' + o.count : Adv.strength(o.count)) + ', нрав ' + H.MAP.mood[o.mood], ...(deal ? ['Контракт, ' + H.Contracts.TITLE[deal.kind].toLowerCase() + ': ' + H.Contracts.rewardText(deal)] : [])] };
        }
        if (def.kind === 'town') {
          const fort = D.fortOf(o), g = o.garrison.filter(Boolean).reduce((n, x) => n + x.count, 0);
          return { obj: o, text: [o.name, H.FACTIONS[o.faction].full, (o.owner === this.pid ? 'ваш город' : o.owner >= 0 ? 'чужой город' : 'ничей город') + ', ' + (fort ? H.Town.def(o, 'fort' + fort).name.toLowerCase() : 'без стен'), g ? 'гарнизон: ' + Adv.strength(g).toLowerCase() : 'гарнизона нет'] };
        }
        if (def.kind === 'mine') return { obj: o, text: [def.name, (o.owner === this.pid ? 'ваш' : o.owner >= 0 ? 'чужой' : 'ничей') + (H.mineRes(o) ? ', в день +' + H.MAP.mineIncome[H.mineRes(o)] + ' ' + RES_NAMES[H.mineRes(o)].toLowerCase() : ', что внутри, неизвестно')] };
        if (def.kind === 'pile') return { obj: o, text: [def.name, 'подобрать'] };
        if (def.kind === 'chest') return { obj: o, text: ['Сундук', 'золото или опыт на выбор'] };
        if (def.kind === 'artifact') return { obj: o, text: [H.ARTIFACTS[o.art].name, H.ARTIFACTS[o.art].about] };
        if (def.kind === 'shrine') return { obj: o, text: [def.name, o.spell ? 'Учит: ' + H.SPELLS[o.spell].name + ' (' + H.SCHOOLS[H.SPELLS[o.spell].school] + ')' : 'Учит одному заклинанию'] };
        if (def.kind === 'scroll') return { obj: o, text: ['Свиток', o.spell ? H.SPELLS[o.spell].name : 'Заклинание на пергаменте'] };
        if (def.kind === 'campfire') return { obj: o, text: ['Костёр', 'золото и немного ресурсов'] };
        return { obj: o, text: H.Sites.tip(S, o, this.pid, this.hero()) };
      }
      const t = MD.terrainAt(M, l, c, r), road = MD.roadAt(M, l, c, r), place = MD.fieldAt(M, l, c, r) && H.FIELDS[H.FIELD_INDEX[MD.fieldAt(M, l, c, r)]];
      return { text: [road ? H.ROADS[road].name : t.name, MD.groundCost(M, l, c, r) ? 'шаг стоит ' + MD.groundCost(M, l, c, r) : t.id === 'water' ? 'только на корабле' : 'непроходимо', ...(place ? [place.name + ': ' + place.about.toLowerCase()] : [])] };
    }

    aim(c, r) {
      const h = this.hero();
      if (!h || h.l !== this.level || this.moving) return null;
      const seen = this.S.players[this.pid].seen[this.level][r * this.S.map.w + c];
      if (!seen) return null;
      if (Adv.foeAt(this.S, h, this.level, c, r) && !(this.vis && this.vis[r * this.S.map.w + c])) return null;
      const key = c + ',' + r + ':' + this.S.ver + ':' + h.steps;
      if (this.hoverPath && this.hoverPath.key === key) return this.hoverPath.path;
      const path = Adv.path(this.S, h, c, r);
      this.hoverPath = { key, path };
      return path;
    }

    setCursor() {
      const g = this.ui.gfx, cell = this.cellAt(this.mouse[0], this.mouse[1]);
      if (!cell || this.modal) return g.cursor('arrow');
      const h = Adv.heroAt(this.S, this.level, cell[0], cell[1]);
      if (h && h.owner === this.pid) return g.cursor('info');
      const p = this.aim(cell[0], cell[1]);
      if (!p) return g.cursor(this.S.players[this.pid].seen[this.level][cell[1] * this.S.map.w + cell[0]] ? 'no' : 'arrow');
      const days = p.steps.length ? p.steps[p.steps.length - 1].day + 1 : 1;
      if (p.kind === 'attack' || p.kind === 'duel' || p.kind === 'caravan') return g.cursor('sword', 0, days > 1 ? days : 0);
      if (p.kind === 'visit' || p.kind === 'meet') return g.cursor('hand', 0, days > 1 ? days : 0);
      return g.cursor('step', 0, days);
    }

    press(id) {
      if (id === 'end') {
        if (this.ui.settings.confirm && this.myHeroes().some(h => h.steps >= 1)) this.openModal('Конец дня', ['У героев остались шаги. Закончить день?'], [['yes', 'Да'], ['no', 'Нет']], k => { if (k === 'yes') this.endDay(); });
        else this.endDay();
      } else if (id === 'next') {
        const list = this.myHeroes();
        if (!list.length) return;
        const i = list.indexOf(this.hero());
        this.sel = list[(i + 1) % list.length].id;
        this.plan = null;
        this.center(this.hero());
      } else if (id === 'level') {
        this.level = (this.level + 1) % this.S.map.levels;
        this.plan = null;
      } else if (id === 'dig') {
        this.plan = null;
        this.events(H.Sites.dig(this.S, this.hero()));
      } else if (id === 'book') this.openBook();
      else if (id === 'kingdom') this.kingdom = { tab: 'towns' };
      else if (id === 'menu') this.ui.openMenu();
    }

    endDay() {
      const goal = this.plan && this.plan.goal;
      this.plan = null;
      this.goalOf[this.pid] = goal;
      this.events(Adv.endTurn(this.S));
      this.beginTurn(true);
    }

    restoreGoal() {
      const goal = this.goalOf[this.pid], h = this.hero();
      this.goalOf[this.pid] = null;
      if (!goal || !h || !h.alive) return;
      const p = Adv.path(this.S, h, goal[0], goal[1]);
      if (p) this.plan = Object.assign({}, p, { goal });
    }

    pointer(type, x, y, btn) {
      this.mouse = [x, y];
      this.edge = true;
      if (this.S.scene) {
        this.scenePointer(type, x, y, btn);
        return;
      }
      if (this.ai && !this.modal) {
        const b = this.buttons.find(o => o.id === 'menu' && hit(o, x, y));
        this.hot = b ? b.id : null;
        this.ui.gfx.cursor('arrow');
        if (type === 'down' && btn === 0 && b) this.press(b.id);
        return;
      }
      if (this.calendar) {
        const close = { x: 185, y: 492, w: 110, h: 26 };
        this.kHot = hit(close, x, y) ? 'cal' : null;
        this.ui.gfx.cursor(this.kHot ? 'hand' : 'arrow');
        if (type === 'down' && btn === 0 && this.kHot) this.calendar = false;
        return;
      }
      if (this.kingdom) {
        const r = (this.kRegions || []).find(o => hit(o, x, y));
        this.kHot = r ? r.id : null;
        this.ui.gfx.cursor(r ? 'hand' : 'arrow');
        if (type === 'down' && btn === 0 && r) r.act();
        return;
      }
      if (this.modal) {
        const b = this.modal.buttons.find(o => hit(o, x, y) && !o.off);
        this.modal.hot = b ? b.id : null;
        this.ui.gfx.cursor('arrow');
        if (type === 'down' && btn === 0 && b) {
          this.closeModal(b.id);
        }
        return;
      }
      if (type === 'up' && btn === 2) this.info = null;
      const b = this.buttons.find(o => hit(o, x, y));
      this.hot = b ? b.id : null;
      if (y < VIEW.y && x > 480) {
        this.ui.gfx.cursor('hand');
        if (type === 'down' && btn === 0) this.calendar = true;
        return;
      }
      if (b) {
        this.ui.gfx.cursor('arrow');
        if (type === 'down' && btn === 0 && this.enabled(b.id)) this.press(b.id);
        return;
      }
      const card = hit({ x: 130, y: 478, w: 56, h: 56 }, x, y) && this.hero() && this.hero().alive;
      if (card) {
        this.ui.gfx.cursor('hand');
        if (type === 'down' && btn === 0) this.ui.show(new H.HeroView(this.ui, this, this.hero()));
        return;
      }
      const pick = (this.heroIcons || []).find(o => hit(o, x, y));
      if (pick) {
        this.ui.gfx.cursor('hand');
        if (type === 'down' && btn === 0) {
          this.sel = pick.id;
          this.plan = null;
          this.center(this.hero());
        }
        return;
      }
      const ic = (this.townIcons || []).find(o => hit(o, x, y));
      this.hotTown = ic ? ic.id : null;
      if (ic) {
        this.ui.gfx.cursor('hand');
        if (type === 'down' && btn === 0) this.openTown(H.Town.byId(this.S, ic.id));
        return;
      }
      if (hit(MINI, x, y)) {
        this.ui.gfx.cursor('hand');
        if (type === 'down' && btn === 0) {
          const k = this.miniScale();
          this.cam.x = (x - MINI.x - this.miniOff()[0]) / k * T - VIEW.w / 2;
          this.cam.y = (y - MINI.y - this.miniOff()[1]) / k * T - VIEW.h / 2;
          this.clampCam();
          this.edge = false;
        }
        return;
      }
      const cell = this.cellAt(x, y);
      if (type === 'down' && btn === 2 && cell) {
        this.info = this.whatAt(cell[0], cell[1]);
        return;
      }
      this.setCursor();
      if (type !== 'down' || btn !== 0 || !cell) return;
      if (this.moving) {
        this.moving.stop = true;
        return;
      }
      const h = Adv.heroAt(this.S, this.level, cell[0], cell[1]);
      if (h && h.owner === this.pid) {
        if (h === this.hero()) this.ui.show(new H.HeroView(this.ui, this, h));
        else if (HE.adjacent(this.hero(), h)) this.ui.show(new H.ExchangeView(this.ui, this, this.hero(), h));
        else this.sel = h.id;
        this.plan = null;
        return;
      }
      const hero = this.hero();
      if (h && hero && hero.alive && Adv.allied(this.S, h.owner, this.pid) && HE.adjacent(hero, h)) {
        this.meet(h);
        return;
      }
      if (this.plan && this.plan.goal[0] === cell[0] && this.plan.goal[1] === cell[1]) {
        this.go();
        return;
      }
      const p = this.aim(cell[0], cell[1]);
      this.plan = p ? Object.assign({}, p, { goal: cell, steps: p.steps.map(s => ({ ...s })) }) : null;
    }

    key(code) {
      if (this.S.scene) {
        this.sceneKey(code);
        return;
      }
      if (this.ai && !this.modal) return;
      if (this.calendar) {
        if (code === 'KeyC') this.calendar = false;
        return;
      }
      if (this.kingdom) {
        if (code === 'KeyK') this.kingdom = null;
        return;
      }
      if (this.modal) {
        if (code === 'Enter' || code === 'Space') this.closeModal(this.modal.buttons.find(o => !o.off).id);
        return;
      }
      if (code === 'Space' || code === 'Enter') this.go();
      else if (code === 'KeyE') this.press('end');
      else if (code === 'KeyH') this.press('next');
      else if (code === 'KeyU') this.press('level');
      else if (code === 'KeyK') this.press('kingdom');
      else if (code === 'KeyB') this.press('book');
      else if (code === 'KeyG') this.press('dig');
      else if (code === 'KeyC') this.calendar = true;
      else if (code === 'KeyT') {
        const h = this.hero(), list = this.myTowns(), t = list.find(o => H.Town.visitor(this.S, o) === h) || list[0];
        if (t) this.openTown(t);
      }
    }

    enabled(id) {
      if (id === 'level') return this.S.map.levels > 1;
      if (id === 'dig') return !this.moving && !!this.hero() && this.hero().alive && !this.hero().boat;
      return !this.moving;
    }

    miniScale() {
      const M = this.S.map;
      return Math.min(MINI.w / M.w, MINI.h / M.h);
    }

    miniOff() {
      const M = this.S.map, k = this.miniScale();
      return [Math.floor((MINI.w - M.w * k) / 2), Math.floor((MINI.h - M.h * k) / 2)];
    }

    draw(g) {
      this.refresh();
      const c = g.ctx, S = this.S, M = S.map, l = this.level;
      c.fillStyle = '#000';
      c.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
      c.save();
      c.beginPath();
      c.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
      c.clip();
      D.terrain(c, this.cache, M, l, this.cam, VIEW);
      const items = [];
      for (const o of M.objs) {
        if (o.gone || o.l !== l) continue;
        const def = H.OBJ[o.t], i = o.r * M.w + o.c;
        if (!S.players[this.pid].seen[l][i]) continue;
        if (def.kind === 'monster' && !o.route && !this.vis[i]) continue;
        items.push({ y: (o.r + def.foot[1]) * T, draw: () => D.object(c, o, VIEW.x + o.c * T - this.cam.x, VIEW.y + o.r * T - this.cam.y, this.time, o.owner >= 0 ? H.PLAYER_COLORS[S.players[o.owner].color] : null) });
      }
      for (const v of S.caravans) {
        if (v.l === l) items.push({ y: (v.r + 1) * T, draw: () => D.caravan(c, v, VIEW.x + v.c * T - this.cam.x, VIEW.y + v.r * T - this.cam.y, H.PLAYER_COLORS[S.players[v.owner].color], this.time) });
      }
      for (const h of S.heroes) {
        if (!h.alive || h.l !== l || !this.vis[h.r * M.w + h.c]) continue;
        const [x, y] = this.heroPos(h);
        items.push({ y: y + T + 0.5, draw: () => D.hero(c, h, VIEW.x + x - this.cam.x, VIEW.y + y - this.cam.y, H.PLAYER_COLORS[S.players[h.owner].color], this.time) });
      }
      items.sort((a, b) => a.y - b.y).forEach(it => it.draw());
      for (const d of S.players[this.pid].deals) {
        const x = H.Contracts.target(S, d);
        if (x && x.l === l && d.obj != null) this.drawDealMark(c, VIEW.x + x.c * T - this.cam.x, VIEW.y + x.r * T - this.cam.y);
      }
      if (this.plan && this.hero() && this.hero().l === l) D.steps(c, this.plan, this.cam, VIEW, (s, x, y) => g.text(s, x, y, { bold: true, color: '#fff6c8' }));
      if (!this.fogPattern) {
        const tile = document.createElement('canvas');
        tile.width = 2;
        tile.height = 2;
        const tg = tile.getContext('2d');
        tg.fillStyle = 'rgba(0,0,0,0.55)';
        tg.fillRect(0, 0, 1, 1);
        tg.fillRect(1, 1, 1, 1);
        this.fogPattern = c.createPattern(tile, 'repeat');
      }
      D.fog(c, M, S.players[this.pid].seen[l], this.vis, this.cam, VIEW, this.fogPattern);
      if (l > 0 && !S.players[this.pid].seen[l].some(Boolean)) g.text('Подлунье не разведано', VIEW.x + VIEW.w / 2, VIEW.y + VIEW.h / 2, { align: 'center', serif: true });
      const cell = this.cellAt(this.mouse[0], this.mouse[1]);
      if (cell && !this.modal) {
        c.strokeStyle = 'rgba(255,255,255,0.35)';
        c.strokeRect(VIEW.x + cell[0] * T - this.cam.x + 0.5, VIEW.y + cell[1] * T - this.cam.y + 0.5, T - 1, T - 1);
      }
      this.toasts.forEach((t, i) => g.text(t.text, VIEW.x + VIEW.w / 2, VIEW.y + 18 + i * 16, { align: 'center', bold: true, color: t.color }));
      c.restore();
      if (this.ai) {
        const name = 'Ходит ' + H.PLAYER_NAMES[S.players[S.turn].color] + ' игрок';
        c.fillStyle = 'rgba(5,7,15,0.72)';
        c.fillRect(250, VIEW.y + VIEW.h - 30, 300, 24);
        c.fillStyle = H.PLAYER_COLORS[S.players[S.turn].color];
        c.fillRect(256, VIEW.y + VIEW.h - 24, 12, 12);
        g.text(name, 400, VIEW.y + VIEW.h - 18, { align: 'center', bold: true });
      }
      this.drawTop(g);
      this.drawPanel(g);
      if (this.kingdom) this.drawKingdom(g);
      if (this.calendar) this.drawCalendar(g);
      if (this.info) this.drawInfo(g);
      if (this.modal) this.drawModal(g);
      if (S.scene) this.drawScene(g);
    }

    sceneNext(answer) {
      const s = this.S.scene;
      if (s && s.text) {
        this.sceneLog = this.sceneLog || [];
        this.sceneLog.push((s.name ? s.name + ': ' : '') + s.text);
      }
      this.events(H.Script.advance(this.S, answer));
      this.ver = -1;
    }

    sceneSkip() {
      let guard = 0;
      while (this.S.scene && this.S.scene.seen && !this.S.scene.choice && guard++ < 500) this.sceneNext();
    }

    scenePointer(type, x, y, btn) {
      const r = (this.sceneRegions || []).find(o => hit(o, x, y));
      this.sceneHot = r ? r.id : null;
      this.ui.gfx.cursor(r ? 'hand' : 'arrow');
      if (type !== 'down' || btn !== 0) return;
      if (this.sceneJournal) {
        this.sceneJournal = false;
        return;
      }
      if (r) r.act();
      else if (!this.S.scene.choice) this.sceneNext();
    }

    sceneKey(code) {
      const s = this.S.scene;
      if (this.sceneJournal) {
        this.sceneJournal = false;
        return;
      }
      if (code === 'KeyL') this.sceneJournal = true;
      else if (s.choice) {
        const n = +code.replace('Digit', '') - 1;
        if (code.startsWith('Digit') && s.choice[n]) this.sceneNext(n);
      } else if (code === 'Space' || code === 'Enter') this.sceneNext();
    }

    drawScene(g) {
      const c = g.ctx, s = this.S.scene, box = { x: 150, y: 440, w: 500, h: 150 };
      this.sceneRegions = [];
      c.fillStyle = 'rgba(5,7,15,0.6)';
      c.fillRect(0, 0, H.W, H.H);
      for (const who of s.shown) {
        const rec = H.HEROES.find(x => x.id === who.id), x = who.side === 'left' ? 10 : H.W - 138, cls = rec ? rec.cls : null, face = { hid: rec || H.PEOPLE[who.id] ? who.id : null, cls, faction: cls ? H.CLASSES[cls].faction : 'neutral', name: who.name || (rec ? rec.name : H.PEOPLE[who.id] || who.id) };
        g.panel(x - 2, 460 - 2, 132, 132, 'plate');
        H.Art.drawPortrait(g, face, x + 6, 466, 116);
        if (who.id === s.who) {
          c.strokeStyle = '#ffe080';
          c.strokeRect(x + 5.5, 465.5, 117, 117);
        }
      }
      g.panel(box.x, box.y, box.w, box.h);
      if (s.name) g.text(s.name, box.x + 18, box.y + 18, { bold: true, color: '#ffe080' });
      if (s.choice) {
        s.choice.forEach((text, i) => {
          const y = box.y + 14 + i * 26, id = 'answer-' + i;
          this.sceneRegions.push({ id, x: box.x + 12, y, w: box.w - 24, h: 24, act: () => this.sceneNext(i) });
          g.button({ x: box.x + 12, y, w: box.w - 24, h: 24, label: (i + 1) + '. ' + text, hot: this.sceneHot === id });
        });
      } else H.Font.wrap('text', s.text, box.w - 36).slice(0, 5).forEach((line, i) => g.text(line, box.x + 18, box.y + 40 + i * 16));
      const tool = (id, label, x, act) => {
        this.sceneRegions.push({ id, x, y: box.y + box.h - 28, w: 90, h: 20, act });
        g.button({ x, y: box.y + box.h - 28, w: 90, h: 20, label, hot: this.sceneHot === id });
      };
      if (!s.choice) tool('journal', 'Журнал (L)', box.x + 14, () => { this.sceneJournal = true; });
      if (s.seen && !s.choice) tool('skip', 'Пропустить', box.x + 110, () => this.sceneSkip());
      if (this.sceneJournal) {
        const list = (this.sceneLog || []).flatMap(t => H.Font.wrap('text', t, 620)).slice(-24);
        g.panel(70, 30, 660, 420);
        g.text('Журнал реплик', H.W / 2, 52, { align: 'center', serif: true });
        list.forEach((line, i) => g.text(line, 86, 78 + i * 15));
      }
    }

    drawCalendar(g) {
      const c = g.ctx, S = this.S, x = 80, y = 70, W = 640, Hh = 460, cx = x + 160, cy = y + 230;
      c.fillStyle = 'rgba(5,7,15,0.5)';
      c.fillRect(0, 0, H.W, H.H);
      g.panel(x, y, W, Hh);
      g.text('Лунный календарь', x + W / 2, y + 26, { align: 'center', serif: true });
      if (!S.moons) {
        g.text('На этой карте луны не считают', x + W / 2, y + 200, { align: 'center' });
      } else {
        const week = H.Moons.weekOf(S) % S.moons.length;
        g.text('Круг ' + H.Moons.circle(S), cx, cy - 10, { align: 'center', bold: true });
        g.text('неделя ' + (week + 1) + ' из 8', cx, cy + 8, { align: 'center', size: 10, color: '#c8b88a' });
        S.moons.forEach((id, i) => {
          const m = H.Moons.byId[id], a = -Math.PI / 2 + i * Math.PI / 4, mx = cx + Math.cos(a) * 110, my = cy + Math.sin(a) * 110, size = i === week ? 44 : 32;
          if (i === week) {
            c.strokeStyle = '#ffe060';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34);
            c.lineTo(mx - Math.cos(a) * 24, my - Math.sin(a) * 24);
            c.stroke();
            c.lineWidth = 1;
          }
          H.Art.drawMoon(c, m, mx - size / 2, my - size / 2, size);
          g.text(m.name, mx, my + size / 2 + 8, { align: 'center', size: 10, color: i === week ? '#ffe060' : '#c8b88a' });
        });
        const weeks = H.Sites.calendarWeeks(S, this.pid);
        H.Moons.ahead(S, weeks).forEach((m, i) => {
          const tx = x + 340;
          if (weeks > 4) {
            const ry = y + 58 + i * 46;
            H.Art.drawMoon(c, m, tx, ry, 24);
            g.text((i ? 'Через ' + i + ' ' + H.plural(i, 'неделю', 'недели', 'недель') + ': ' : 'Сейчас: ') + m.full, tx + 32, ry + 6, { bold: true, color: i ? '#f0e2b8' : '#ffe060' });
            g.text(H.Font.wrap('small', m.about, 250)[0], tx + 32, ry + 22, { size: 10 });
            return;
          }
          const ry = y + 62 + i * 96;
          H.Art.drawMoon(c, m, tx, ry, 32);
          g.text((i ? 'Через ' + i + ' ' + H.plural(i, 'неделю', 'недели', 'недель') + ': ' : 'Сейчас: ') + m.full, tx + 40, ry + 8, { bold: true, color: i ? '#f0e2b8' : '#ffe060' });
          H.Font.wrap('small', m.about, 240).slice(0, 3).forEach((s, k) => g.text(s, tx + 40, ry + 26 + k * 13, { size: 10 }));
          g.text('Мораль +1: ' + m.people.map(p => H.Art.PALETTES[p].name).join(', '), tx + 40, ry + 66, { size: 10, color: '#a0c8ff' });
        });
      }
      g.button({ x: 185, y: 492, w: 110, h: 26, label: 'Закрыть', hot: this.kHot === 'cal' });
    }

    drawDealMark(c, x, y) {
      c.fillStyle = '#d8c698';
      c.fillRect(x + 20, y - 2, 13, 10);
      c.strokeStyle = '#3a2a12';
      c.strokeRect(x + 20.5, y - 1.5, 12, 9);
      c.fillStyle = '#a02818';
      c.fillRect(x + 24, y + 1, 5, 4);
    }

    drawDeals(g, x, top) {
      const S = this.S, C = H.Contracts, deals = S.players[this.pid].deals, c = g.ctx, desks = H.Town.list(S, this.pid).filter(C.desk);
      g.text('Идут: ' + deals.length + ' из ' + H.TOWN.contract.active + ', исполнено за партию: ' + S.players[this.pid].dealsDone, x + 24, top, { bold: true, color: '#c8b88a' });
      if (!desks.length && !deals.length) g.text('Контракты вывешивает Ратуша контрактов в городах Лиги.', x + 24, top + 28, { color: '#a89870' });
      deals.forEach((d, i) => {
        const ry = top + 18 + i * 64, text = C.describe(S, d), left = d.until - S.day;
        c.fillStyle = 'rgba(5,7,15,0.6)';
        c.fillRect(x + 20, ry, 600, 58);
        g.text(text.title, x + 30, ry + 16, { bold: true });
        g.text(text.lines.join(' '), x + 110, ry + 16, { size: 10 });
        g.text('Плата: ' + text.reward, x + 110, ry + 34, { size: 10 });
        g.text('Осталось дней: ' + left + '. Выдал город ' + H.Town.byId(S, d.town).name, x + 110, ry + 48, { size: 10, color: left <= 2 ? '#ff9a8a' : '#c8b88a' });
      });
      desks.forEach((t, i) => g.text(t.name + ': на доске ' + C.board(S, t).length + ' ' + H.plural(C.board(S, t).length, 'бумага', 'бумаги', 'бумаг'), x + 24, top + 228 + i * 16, { size: 10 }));
    }

    drawGoals(g, x, top, btn) {
      const S = this.S, text = Adv.goalText(S.map, S.goals), STATE = { open: ['идёт', '#f0e2b8'], done: ['выполнено', '#a0e0a0'], fail: ['провалено', '#ff9080'] };
      let y = top;
      const line = (s, color, bold) => {
        g.text(s, x + 24, y, { color, bold });
        y += 18;
      };
      line('Победа', '#c8b88a', true);
      for (const s of text.win) line(s, '#a0e0a0');
      y += 8;
      line('Поражение', '#c8b88a', true);
      for (const s of text.lose) line(s, '#ffb0a0');
      if (!S.script.goals.length) return;
      y += 8;
      line('Задания', '#c8b88a', true);
      for (const q of S.script.goals) {
        const aim = q.state === 'open' ? (q.targets || []).map(t => S.map.objs.find(o => o.tag === t && !o.gone) || S.heroes.find(h => h.tag === t && h.alive)).find(o => o && S.players[this.pid].seen[o.l][o.r * S.map.w + o.c]) : null;
        if (aim) btn('k-goal-' + q.id, 'На карте', x + 516, y - 12, 96, 18, () => {
          this.kingdom = null;
          this.center(aim);
        });
        line(q.text + ': ' + STATE[q.state][0], STATE[q.state][1]);
      }
    }

    drawKingdom(g) {
      const k = this.kingdom, S = this.S, x = 80, y = 64, W = 640, Hh = 472, c = g.ctx;
      this.kRegions = [];
      const btn = (id, label, bx, by, bw, bh, act, on) => {
        this.kRegions.push({ id, x: bx, y: by, w: bw, h: bh, act });
        g.button({ x: bx, y: by, w: bw, h: bh, label, hot: this.kHot === id, down: on });
      };
      const row = (id, ry, act) => {
        this.kRegions.push({ id, x: x + 16, y: ry - 11, w: W - 32, h: 24, act });
        if (this.kHot === id) {
          c.fillStyle = 'rgba(80,110,200,0.25)';
          c.fillRect(x + 16, ry - 11, W - 32, 24);
        }
      };
      c.fillStyle = 'rgba(5,7,15,0.5)';
      c.fillRect(0, 0, H.W, H.H);
      g.panel(x, y, W, Hh);
      g.text('Держава', x + W / 2, y + 26, { align: 'center', serif: true });
      [['towns', 'Города'], ['heroes', 'Герои'], ['income', 'Доход'], ['deals', 'Контракты'], ['heart', 'Сердце'], ['goals', 'Цели']].forEach(([id, label], i) => btn('k-' + id, label, x + 20 + i * 102, y + 44, 96, 22, () => { k.tab = id; }, k.tab === id));
      const top = y + 92, head = (cols, xs) => cols.forEach((s, i) => g.text(s, xs[i], top, { bold: true, color: '#c8b88a' }));
      if (k.tab === 'towns') {
        const xs = [x + 24, x + 196, x + 300, x + 400, x + 540];
        head(['Город', 'Управа', 'Доход', 'Прирост недели', 'Стройка'], xs);
        const list = this.myTowns();
        if (!list.length) g.text('Городов нет', x + 24, top + 28, { color: '#8a7a5a' });
        list.forEach((t, i) => {
          const ry = top + 28 + i * 26, hall = ['hall4', 'hall3', 'hall2', 'hall1'].find(id => H.Town.has(t, id));
          const gold = H.Town.goldOf(t);
          const growth = [1, 2, 3, 4, 5, 6, 7].filter(n => H.Town.has(t, 'dwell' + n)).map(n => H.Town.growth(S, t, n)).join(' · ');
          row('kt-' + t.id, ry, () => this.openTown(t));
          g.text(t.name, xs[0], ry, {});
          g.text(H.Town.def(t, hall).name, xs[1], ry, { size: 10 });
          g.text(gold + ' в день', xs[2], ry, { size: 10 });
          g.text(growth || '—', xs[3], ry, { size: 10 });
          g.text(t.today ? 'сегодня строили' : 'можно строить', xs[4], ry, { size: 10, color: t.today ? '#c8a0a0' : '#a0e0a0' });
        });
      } else if (k.tab === 'heroes') {
        const xs = [x + 24, x + 190, x + 300, x + 400, x + 540];
        head(['Герой', 'Уровень', 'Где', 'Войско', 'Шаги'], xs);
        this.myHeroes().forEach((h, i) => {
          const ry = top + 28 + i * 26, n = h.army.filter(Boolean).reduce((t, s) => t + s.count, 0), town = this.myTowns().find(t => H.Town.visitor(S, t) === h);
          row('kh-' + h.id, ry, () => {
            this.sel = h.id;
            this.plan = null;
            this.center(h);
            this.kingdom = null;
          });
          g.text(h.name, xs[0], ry, {});
          g.text(H.CLASSES[h.cls].name + ', ' + h.level, xs[1], ry, { size: 10 });
          g.text(town ? town.name : 'клетка ' + h.c + ', ' + h.r, xs[2], ry, { size: 10 });
          g.text(Adv.strength(n) + ', ' + Adv.armyValue(h.army) + ' зол.', xs[3], ry, { size: 10 });
          g.text((Math.floor(h.steps * 10) / 10) + ' из ' + Adv.daySteps(S, h), xs[4], ry, { size: 10 });
        });
      } else if (k.tab === 'heart') this.drawHeart(g, x, top);
      else if (k.tab === 'goals') this.drawGoals(g, x, top, btn);
      else if (k.tab === 'deals') this.drawDeals(g, x, top);
      else {
        const xs = [x + 24, x + 190, x + 280, x + 370, x + 460, x + 540], towns = H.Town.income(S, this.pid), heroes = HE.income(S, this.pid), mines = {};
        for (const o of S.map.objs) {
          if (o.gone || o.owner !== this.pid || H.OBJ[o.t].kind !== 'mine') continue;
          const r = H.mineRes(o);
          mines[r] = (mines[r] || 0) + H.MAP.mineIncome[r];
        }
        head(['Ресурс', 'Города', 'Шахты', 'Герои', 'В день', 'За неделю'], xs);
        H.RESOURCES.forEach(([id, name], i) => {
          const ry = top + 28 + i * 26, a = towns[id] || 0, b = mines[id] || 0, e = heroes[id] || 0;
          c.fillStyle = D.RES[id];
          c.fillRect(xs[0], ry - 5, 10, 10);
          g.text(name, xs[0] + 16, ry, {});
          [a, b, e, a + b + e, (a + b + e) * 7].forEach((v, k) => g.text(String(v), xs[k + 1], ry, { size: 10, color: v ? '#f0e2b8' : '#6a604a' }));
        });
      }
      btn('k-close', 'Закрыть', x + W - 130, y + Hh - 40, 110, 26, () => { this.kingdom = null; });
    }

    drawHeart(g, x, top) {
      const S = this.S, M = S.map, c = g.ctx, me = S.players[this.pid], cell = Math.floor(320 / Math.max(M.w, M.h)), ox = x + 24, oy = top + 8;
      if (!M.heart) {
        g.text('На этой карте Сердца нет', x + 24, top + 28, { color: '#8a7a5a' });
        return;
      }
      const area = H.Sites.heartArea(S, this.pid), inside = area ? new Set(area.map(([ac, ar]) => ar * M.w + ac)) : null, seen = me.seen[M.heart.l];
      for (let r = 0; r < M.h; r++) {
        for (let q = 0; q < M.w; q++) {
          const i = r * M.w + q;
          c.fillStyle = seen[i] ? D.COLORS[MD.terrainAt(M, M.heart.l, q, r).id][0] : '#14161e';
          c.fillRect(ox + q * cell, oy + r * cell, cell, cell);
          if (inside && inside.has(i)) {
            c.fillStyle = 'rgba(255,224,96,0.55)';
            c.fillRect(ox + q * cell, oy + r * cell, cell, cell);
          }
        }
      }
      c.strokeStyle = '#6a5430';
      c.strokeRect(ox - 0.5, oy - 0.5, M.w * cell + 1, M.h * cell + 1);
      for (const o of M.objs) {
        if (o.gone || o.t !== 'digspot' || o.l !== M.heart.l) continue;
        c.fillStyle = '#20140a';
        c.fillRect(ox + o.c * cell, oy + o.r * cell, cell, cell);
      }
      for (const m of me.menhirs) {
        c.fillStyle = '#a0e0ff';
        c.fillRect(ox + m.c * cell - 1, oy + m.r * cell - 1, cell + 2, cell + 2);
      }
      const tx = ox + M.w * cell + 24;
      g.text('Посещено менгиров: ' + me.menhirs.length, tx, top + 16, {});
      g.text(area ? 'Клеток в области поиска: ' + area.length : 'Область поиска пока неизвестна', tx, top + 34, {});
      g.text(M.heart.l ? 'Сердце лежит в Подлунье' : 'Сердце лежит на поверхности', tx, top + 52, { size: 10, color: '#c8b88a' });
      H.Font.wrap('small', 'Менгир показывает сторону в 45° и дальность. Три менгира сужают поиск до квадрата 5×5. Копать можно целый день, кнопка «Копать».', 190).forEach((s, i) => g.text(s, tx, top + 76 + i * 13, { size: 10, color: '#c8b88a' }));
    }

    drawTop(g) {
      const c = g.ctx, res = this.S.players[this.pid].res, d = Adv.date(this.S);
      g.panel(0, 0, H.W, 24, 'plate');
      H.RESOURCES.forEach(([id, name], i) => {
        const x = 10 + i * 82;
        c.fillStyle = D.RES[id];
        c.fillRect(x, 7, 10, 10);
        c.strokeStyle = '#000';
        c.strokeRect(x + 0.5, 7.5, 9, 9);
        g.text(String(res[id]), x + 15, 12, { size: 10 });
      });
      const moon = H.Moons.current(this.S), me = this.S.players[this.pid];
      if (me.hadTown && !this.myTowns().length) g.text('Без города: осталось ' + (H.MAP.townless - me.townless) + ' дн.', 590, 12, { align: 'right', size: 10, color: '#ff9080' });
      g.text(H.Moons.dateText(this.S), H.W - (moon ? 30 : 10), 12, { align: 'right', bold: true });
      if (moon) H.Art.drawMoon(c, moon, H.W - 25, 3, 18);
    }

    drawPanel(g) {
      const c = g.ctx, S = this.S, h = this.hero();
      g.panel(0, 472, H.W, 128, 'plate');
      c.fillStyle = '#000';
      c.fillRect(MINI.x - 1, MINI.y - 1, MINI.w + 2, MINI.h + 2);
      const k = this.miniScale(), [ox, oy] = this.miniOff();
      c.imageSmoothingEnabled = false;
      c.drawImage(this.mini, MINI.x + ox, MINI.y + oy, S.map.w * k, S.map.h * k);
      c.strokeStyle = '#ffffff';
      c.strokeRect(MINI.x + ox + this.cam.x / T * k + 0.5, MINI.y + oy + this.cam.y / T * k + 0.5, VIEW.w / T * k, VIEW.h / T * k);
      if (S.map.levels > 1) g.text(this.level ? 'Подлунье' : 'Поверхность', MINI.x + MINI.w / 2, MINI.y + MINI.h - 6, { align: 'center', size: 10 });
      if (h && h.alive) {
        H.Art.drawPortrait(g, h, 130, 478, 56);
        g.text(h.name, 192, 484, { bold: true });
        g.text(H.CLASSES[h.cls].name + ', уровень ' + h.level + ', опыт ' + h.xp, 192, 498, { size: 10, color: '#c8b88a' });
        const full = Adv.daySteps(S, h);
        c.fillStyle = '#1a1208';
        c.fillRect(192, 508, 160, 9);
        c.fillStyle = '#50c050';
        c.fillRect(193, 509, 158 * Math.min(1, h.steps / full), 7);
        g.text('Шаги ' + (Math.floor(h.steps * 10) / 10) + ' из ' + full, 358, 512, { size: 10 });
        g.text('Мана ' + h.mana + ' из ' + HE.maxMana(h), 192, 526, { size: 10, color: '#a0c8ff' });
        if (h.heart) g.text('Несёт Сердце', 284, 526, { size: 10, color: '#ffe060' });
        else if (h.boat) g.text('На корабле', 284, 526, { size: 10, color: '#a0c8ff' });
        h.army.forEach((s, i) => {
          const x = 130 + i * 44, y = 540;
          c.fillStyle = '#05070f';
          c.fillRect(x, y, 40, 54);
          c.strokeStyle = '#6a5430';
          c.strokeRect(x + 0.5, y + 0.5, 39, 53);
          if (!s) return;
          H.Art.drawUnit(c, s.unit, x + 20, y + 40, { scale: 0.42, tier: false });
          g.text(String(s.count), x + 37, y + 47, { align: 'right', size: 10, bold: true, color: '#ffffff' });
          if (s.stars) H.HeroIcons.starMarks(c, x + 2, y + 2, s.stars);
        });
      }
      g.text('Герои', 446, 484, { bold: true });
      this.heroIcons = this.myHeroes().slice(0, 5).map((hh, i) => ({ id: hh.id, x: 446 + i * 46, y: 494, w: 42, h: 42 }));
      for (const ic of this.heroIcons) {
        const hh = S.heroes[ic.id];
        H.Art.drawPortrait(g, hh, ic.x, ic.y, 42);
        if (hh === h) {
          c.strokeStyle = '#ffe060';
          c.lineWidth = 2;
          c.strokeRect(ic.x, ic.y, 42, 42);
          c.lineWidth = 1;
        }
      }
      g.text('Города', 446, 550, { bold: true });
      this.townIcons = this.myTowns().slice(0, 5).map((t, i) => ({ id: t.id, x: 446 + i * 46, y: 558, w: 42, h: 36 }));
      if (!this.townIcons.length) g.text('нет', 446, 568, { size: 10, color: '#8a7a5a' });
      for (const ic of this.townIcons) {
        const t = H.Town.byId(S, ic.id), L = H.TownDraw.LOOK[t.faction];
        c.fillStyle = this.hotTown === ic.id ? '#2a3a6a' : '#05070f';
        c.fillRect(ic.x, ic.y, ic.w, ic.h);
        c.save();
        c.beginPath();
        c.rect(ic.x, ic.y, ic.w, ic.h);
        c.clip();
        H.TownDraw.KINDS[t.faction === 'league' ? 'house' : 'yurt'](c, L, ic.x + 8, ic.y + 6, 26, 26, { t: 0 });
        c.restore();
        if (!t.today) {
          c.fillStyle = '#50c050';
          c.fillRect(ic.x + ic.w - 7, ic.y + 3, 4, 4);
        }
      }
      for (const b of this.buttons) g.button({ ...b, hot: this.hot === b.id, off: !this.enabled(b.id) || (!!this.ai && b.id !== 'menu'), label: b.id === 'level' ? (this.level ? 'Наверх (U)' : 'Подлунье (U)') : b.label });
    }

    drawInfo(g) {
      const lines = this.info.text, w = Math.max(...lines.map(s => g.measure(s))) + 20, hh = lines.length * 15 + 12;
      const x = H.clamp(this.mouse[0] + 14, 4, H.W - w - 4), y = H.clamp(this.mouse[1] + 14, 28, 468 - hh);
      g.panel(x, y, w, hh, 'tip');
      lines.forEach((s, i) => g.text(s, x + 10, y + 12 + i * 15, { bold: i === 0, size: i ? 10 : 11 }));
    }

    drawModal(g) {
      const m = this.modal;
      g.ctx.fillStyle = 'rgba(5,7,15,0.45)';
      g.ctx.fillRect(0, 0, H.W, H.H);
      g.panel(m.x, m.y, m.w, m.h);
      g.text(m.title, m.x + m.w / 2, m.y + 26, { align: 'center', serif: true });
      m.lines.forEach((s, i) => g.text(s, m.x + m.w / 2, m.y + 56 + i * 16, { align: 'center' }));
      for (const b of m.buttons) g.button({ ...b, hot: m.hot === b.id });
    }
  }

  H.MapView = MapView;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
