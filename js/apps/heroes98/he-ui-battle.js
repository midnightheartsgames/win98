(function (H) {
  'use strict';
  const BA = H.Battle, D = H.BattleDraw, BT = H.BATTLE;
  const U = s => H.UNITS[s.unit];
  const TAPE = { x: 156, y: 500, cell: 40, step: 42, n: 12 };
  const hit = (b, x, y) => x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h;
  const sign = v => (v > 0 ? '+' + v : String(v));
  const MACHINE_TURN = { catapult: 'Выберите стену', tent: 'Выберите отряд' };
  const MACHINE_HINT = { catapult: 'Катапульта: выберите участок стены', tent: 'Шатёр: выберите раненый свой отряд' };
  const VERB = { cover: 'бьют', arc: 'задевают', sweep: 'бьют', burst: 'взрывом бьют', melee: 'бьют', retal: 'отвечают', support: 'строем бьют', shot: 'стреляют в', saddle: 'с седла стреляют в', bell: 'звоном бьют', last: 'последним ударом бьют', flame: 'пламенем бьют', pole: 'через клетку бьют', volley: 'залпом бьют', splash: 'разрывом задевают', through: 'насквозь бьют', trample: 'топчут' };
  const FLYING = ['shot', 'saddle', 'volley'];
  const saddleWord = s => (U(s).saddleSteps ? 'Перебежка' : 'С седла');
  const ORDER_NOTE = { warcry: 'Клич', nabat: 'Великий набат', kurgan: 'Великий курган', forest: 'Пробуждение леса', flood: 'Затопить', wave: 'Девятый вал', erupt: 'Извержение', kings: 'Возвращение царей' };

  class BattleView {
    constructor(ui, setup) {
      const t = setup, seed = setup.seed;
      this.ui = ui;
      this.setup = setup;
      this.seed = seed;
      this.player = t.player || 0;
      this.humans = t.humans && t.humans.length ? t.humans.slice() : [this.player];
      this.theme = 'battle';
      this.B = t.B || BA.create({ seed, sides: t.sides, moon: t.moon || null });
      this.deployed = new Set();
      const first = this.B.started ? null : this.humans.find(sd => this.needsDeploy(sd));
      if (first != null) this.player = first;
      this.vis = this.B.stacks.map(s => ({ x: 0, y: 0, count: s.count, alpha: 1, flash: 0, dx: 0 }));
      this.sync();
      this.beats = [];
      this.beat = null;
      this.floats = [];
      this.log = ['«' + t.name + '», seed ' + seed + '. ' + (this.humans.length > 1 ? 'Оба войска ведут люди, ход переходит от одного к другому.' : this.player ? 'Ваше войско справа.' : 'Ваше войско слева.')];
      this.auto = false;
      this.think = 0;
      this.mode = null;
      this.saddleAt = null;
      this.hover = null;
      this.mouse = [0, 0];
      this.info = null;
      this.showLog = false;
      this.result = null;
      this.rc = null;
      this.deploying = first != null;
      this.picked = null;
      this.spell = null;
      this.spellFirst = null;
      const rows = [[['wait', 'Ждать (W)', 66], ['defend', 'Оборона (D)', 76], ['skill', 'Свойство (S)', 80], ['order', 'Приказ (O)', 68], ['cast', 'Колдовать (C)', 90], ['quick', 'Быстрый (A)', 76]], [['ransom', 'Откуп', 66], ['flee', 'Бегство', 76], ['log', 'Журнал (L)', 80], ['speed', '', 68], ['menu', 'Меню', 90], ['alarm', 'Набат (N)', 76]]];
      this.buttons = rows.flatMap((row, k) => {
        let x = TAPE.x;
        return row.map(([id, label, w]) => {
          const b = { id, label, x, y: 543 + k * 21, w, h: 20 };
          x += w + 3;
          return b;
        });
      });
      if (!t.resumed) this.feed(this.B.opening);
    }

    whose() {
      const colors = this.setup.colors, color = colors && colors[this.player];
      return color >= 0 ? H.PLAYER_NAMES[color] : this.player ? 'правые' : 'левые';
    }

    needsDeploy(side) {
      const sd = this.B.sides[side];
      return !!((sd.hero && sd.hero.tactics) || sd.plantLeft > 0 || sd.mirrorLeft > 0);
    }

    at(s, c, r) {
      if (U(s).fixed) return [34, 172];
      const [x, y] = D.center(c, r);
      return U(s).big ? [x + (s.side ? 24 : -24), y] : [x, y];
    }

    sync() {
      for (const s of this.B.stacks) {
        const v = this.vis[s.id], [x, y] = this.at(s, s.c, s.r);
        v.x = x;
        v.y = y;
        v.count = s.count;
        v.alpha = s.count > 0 ? 1 : 0;
        v.flash = 0;
        v.dx = 0;
      }
    }

    mine() {
      const B = this.B;
      if (this.deploying || this.beat || this.beats.length || B.winner >= 0 || B.active < 0 || this.auto) return null;
      const s = B.stacks[B.active];
      return s.side === this.player && !this.machineByItself(s) ? s : null;
    }

    machineByItself(s) {
      const h = this.B.sides[s.side].hero;
      return !!U(s).machine && !(h && h.machines);
    }

    stackAt(c, r) {
      return BA.alive(this.B).find(s => BA.cells(s).some(p => p[0] === c && p[1] === r)) || null;
    }

    feed(ev) {
      while (this.vis.length < this.B.stacks.length) this.vis.push({ x: 0, y: 0, count: 0, alpha: 0, flash: 0, dx: 0 });
      for (const e of ev) {
        let dur = 0;
        if (e.t === 'move') dur = e.fly ? 0.3 + 0.04 * H.Hex.dist(e.path[0][0], e.path[0][1], e.path[1][0], e.path[1][1]) : (e.path.length - 1) * 0.12;
        else if (e.t === 'hit') dur = FLYING.includes(e.kind) || e.kind === 'bell' ? 0.42 : e.kind === 'splash' || e.kind === 'through' ? 0.2 : 0.34;
        else if (e.t === 'death') dur = 0.35;
        else if (e.t === 'morale' || e.t === 'round') dur = 0.5;
        else if (e.t === 'wait' || e.t === 'defend') dur = 0.25;
        else if (e.t === 'chill' || e.t === 'lament' || e.t === 'ready' || e.t === 'trait') dur = 0.15;
        else if (e.t === 'planks') dur = 0.5;
        else if (e.t === 'order' || e.t === 'wall' || e.t === 'alarm') dur = 0.5;
        else if (e.t === 'cast') dur = 0.4;
        else if (e.t === 'heal' || e.t === 'summon' || e.t === 'swap' || e.t === 'skip' || e.t === 'wild' || e.t === 'miss') dur = 0.3;
        else if (e.t === 'fx' || e.t === 'resist' || e.t === 'echo') dur = 0.2;
        this.beats.push({ e, dur, t: 0 });
      }
    }

    note(e) {
      const B = this.B, n = id => '«' + U(B.stacks[id]).name + '»';
      if (e.t === 'wall') return e.gate ? (e.hp > 0 ? 'Катапульта бьёт в ворота.' : 'Катапульта разбила ворота.') : (e.hp > 0 ? 'Катапульта бьёт в стену.' : 'Катапульта пробила стену.');
      if (e.t === 'fled') return e.kind === 'ransom' ? 'Герой откупился за ' + e.price + ' золота и ушёл с войском.' : 'Герой бежал с поля, войско погибло.';
      if (e.t === 'hit' && e.by < 0) return (e.kind === 'spell' ? H.SPELLS[e.spell].name : e.kind === 'poison' ? 'Яд' : e.kind === 'fire' ? 'Огонь' : e.kind === 'tower' ? 'Башня' : e.kind === 'heat' ? 'Перегрев' : e.kind === 'mirror' ? 'Зеркальный щит' : 'Колючки') + ': ' + n(e.to) + ', ' + e.dmg + ' урона' + (e.kills ? ', погибло ' + e.kills : '') + '.';
      if (e.t === 'hit') return n(e.by) + ' ' + VERB[e.kind] + ' ' + n(e.to) + ': ' + e.dmg + ' урона' + (e.kills ? ', погибло ' + e.kills : '') + (e.luck > 0 ? '. Удача!' : e.luck < 0 ? '. Неудача.' : '.');
      if (e.t === 'cast') return 'Заклинание: ' + H.SPELLS[e.spell].name + '.';
      if (e.t === 'echo') return 'Отголосок: заклинание повторилось.';
      if (e.t === 'heal') return n(e.id) + ': лечение ' + e.n + (e.raised ? ', встали ' + e.raised : '') + '.';
      if (e.t === 'fx') return n(e.id) + ': ' + H.SPELLS[e.spell].name + '.';
      if (e.t === 'resist') return n(e.id) + ' не поддаются заклинанию.';
      if (e.t === 'trait') return e.name + ': ' + n(e.id) + '.';
      if (e.t === 'planks') return 'С кораблей перекинули мостки: пройти можно посередине.';
      if (e.t === 'summon') return n(e.id) + ' вступают в бой: ' + e.count + '.';
      if (e.t === 'skip') return n(e.id) + ' пропускают ход.';
      if (e.t === 'wild') return n(e.id) + (e.betray ? ' бьют своих.' : ' в безумии бьют ближайшего.');
      if (e.t === 'miss') return (e.blink ? 'Удар по ' : 'Выстрел по ') + n(e.to) + ' мимо.';
      if (e.t === 'swap') return n(e.a) + ' и ' + n(e.b) + ' поменялись местами.';
      if (e.t === 'death') return n(e.id) + ': отряд уничтожен.';
      if (e.t === 'morale') return e.good ? 'Порыв: ' + n(e.id) + ' скоро ходят снова.' : 'Смятение: ' + n(e.id) + ' пропускают ход.';
      if (e.t === 'wait') return n(e.id) + ' ждут.';
      if (e.t === 'defend') return n(e.id) + ' в обороне.';
      if (e.t === 'chill') return 'Холод могилы: ' + n(e.id) + ' теряют Натиск, всего −' + e.value + '.';
      if (e.t === 'lament') return 'Плач: ' + n(e.id) + ' получают Натиск, всего +' + e.value + '.';
      if (e.t === 'ready') return n(e.id) + ' сбиты звоном, готовность ' + e.value + '.';
      if (e.t === 'order') return ORDER_NOTE[e.order] + ': ' + n(e.id) + (e.order === 'kurgan' ? ' встают, ' + e.count + '.' : e.order === 'warcry' ? ' +40 готовности.' : e.order === 'forest' ? ' зовут лес, заросли встают.' : e.order === 'flood' ? ' топят клетки.' : e.order === 'erupt' ? ' будят вулкан.' : e.order === 'wave' ? ' катят волну на врага.' : e.order === 'kings' ? ' зовут Лунных царей.' : ' и весь строй +40 готовности, +2 морали.');
      if (e.t === 'alarm') return 'Набат: ' + n(e.id) + ' поднимают весь строй, +' + e.value + ' готовности.';
      if (e.t === 'round') return 'Раунд ' + e.n + '.';
      if (e.t === 'end') return e.winner === this.player ? 'Победа!' : 'Поражение.';
      return null;
    }

    float(id, text, color) {
      const v = this.vis[id];
      this.floats.push({ x: v.x, y: v.y - 64, text, color, t: 0, dur: 0.9 });
    }

    start(b) {
      const e = b.e, line = this.note(e);
      if (line) this.log.push(line);
      if (this.log.length > 200) this.log.splice(0, this.log.length - 200);
      if (e.t === 'move') {
        const s = this.B.stacks[e.id];
        b.pts = e.path.map(p => this.at(s, p[0], p[1]));
      }
      if (e.t === 'hit') {
        const a = this.vis[e.by], d = this.vis[e.to];
        b.from = a ? [a.x, a.y - 30] : null;
        b.to = [d.x, d.y - 30];
        const by = e.by >= 0 ? this.B.stacks[e.by].unit : null;
        if (FLYING.includes(e.kind)) this.ui.sfx('shot', by);
        else this.ui.sfx('hit', { kind: e.kind, unit: by });
      }
      if (e.t === 'death') this.ui.sfx('death', this.B.stacks[e.id].unit);
      if (e.t === 'alarm') {
        this.float(e.id, 'Набат!', '#ffe060');
        this.ui.sfx('hit', { kind: 'bell', unit: this.B.stacks[e.id].unit });
      }
      if (e.t === 'wall') {
        const p = this.B.siege.pieces[e.piece], [wx, wy] = D.center(this.B.siege.col, p.rows[0]);
        this.floats.push({ x: wx, y: wy - 40, text: e.hp > 0 ? 'Трещина' : 'Пролом!', color: '#ffd080', t: 0, dur: 0.9 });
        this.ui.sfx('hit', { kind: 'melee' });
      }
      if (e.t === 'cast') this.ui.sfx('cast');
      if (e.t === 'cast') this.banner = { text: H.SPELLS[e.spell].name, t: 0, dur: 0.9 };
      if (e.t === 'heal') this.float(e.id, '+' + e.n, '#80f0a0');
      if (e.t === 'fx') this.float(e.id, H.SPELLS[e.spell].name, e.bad ? '#ff9a8a' : '#a0e0ff');
      if (e.t === 'resist') this.float(e.id, 'Не берёт', '#e0e0e0');
      if (e.t === 'trait') this.float(e.id, e.name, '#ff9a8a');
      if (e.t === 'planks') this.banner = { text: 'Мостки', t: 0, dur: 0.9 };
      if (e.t === 'skip') this.float(e.id, 'Пропуск', '#c8b88a');
      if (e.t === 'wild') this.float(e.id, 'Безумие', '#ff9a8a');
      if (e.t === 'miss') this.float(e.to, 'Мимо', '#e0e0e0');
      if (e.t === 'round') this.banner = { text: 'Раунд ' + e.n, t: 0, dur: 0.9 };
      if (e.t === 'morale') this.float(e.id, e.good ? 'Порыв!' : 'Смятение', e.good ? '#80f080' : '#ff8070');
      if (e.t === 'wait') this.float(e.id, 'Ждут', '#f0e2b8');
      if (e.t === 'defend') this.float(e.id, 'Оборона', '#a0c8ff');
      if (e.t === 'chill') this.float(e.id, 'Натиск −1', '#b0d0ff');
      if (e.t === 'lament') this.float(e.id, 'Плач +1', '#e0c080');
      if (e.t === 'ready') this.float(e.id, 'Готовность −', '#ffd080');
      if (e.t === 'order') this.float(e.id, ORDER_NOTE[e.order] + '!', '#ffe060');
    }

    animate(b) {
      const e = b.e, f = b.dur ? Math.min(1, b.t / b.dur) : 1;
      if (e.t === 'move') {
        const v = this.vis[e.id], pts = b.pts;
        if (e.fly) {
          const p = pts[0], q = pts[pts.length - 1];
          v.x = p[0] + (q[0] - p[0]) * f;
          v.y = p[1] + (q[1] - p[1]) * f - Math.sin(Math.PI * f) * 24;
        } else {
          const pos = f * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(pos)), k = pos - i;
          v.x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k;
          v.y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k;
        }
      } else if (e.t === 'hit') {
        const a = this.vis[e.by], d = this.vis[e.to];
        if (a && (e.kind === 'melee' || e.kind === 'retal' || e.kind === 'support' || e.kind === 'pole')) a.dx = Math.sin(Math.PI * f) * 9 * (d.x >= a.x ? 1 : -1);
        if (f > 0.55) d.flash = Math.min(0.8, (1 - f) * 2);
      } else if (e.t === 'death') this.vis[e.id].alpha = 1 - f;
    }

    finish(b) {
      const e = b.e;
      if (e.t === 'move') {
        const v = this.vis[e.id], q = b.pts[b.pts.length - 1];
        v.x = q[0];
        v.y = q[1];
      } else if (e.t === 'hit') {
        if (this.vis[e.by]) this.vis[e.by].dx = 0;
        const d = this.vis[e.to];
        d.flash = 0;
        d.count = e.left;
        this.float(e.to, e.kills ? '−' + e.kills + ' (' + e.dmg + ')' : '−' + e.dmg, e.luck > 0 ? '#ffe060' : '#ff9a8a');
      } else if (e.t === 'death') this.vis[e.id].alpha = 0;
      else if (e.t === 'heal') this.vis[e.id].count = e.left;
      else if (e.t === 'summon' || e.t === 'swap') this.sync();
      else if (e.t === 'order' && e.order === 'kurgan') {
        const s = this.B.stacks[e.id], v = this.vis[e.id], [x, y] = this.at(s, e.c, e.r);
        v.x = x;
        v.y = y;
        v.count = e.count;
        v.alpha = 1;
      }
    }

    update(dt) {
      for (const f of this.floats) f.t += dt;
      this.floats = this.floats.filter(f => f.t < f.dur);
      if (this.banner) {
        this.banner.t += dt;
        if (this.banner.t > this.banner.dur) this.banner = null;
      }
      let left = dt * this.ui.speed;
      for (let guard = 0; guard < 1000; guard++) {
        if (!this.beat) {
          if (!this.beats.length) break;
          this.beat = this.beats.shift();
          this.start(this.beat);
        }
        const b = this.beat, use = Math.min(b.dur - b.t, left);
        b.t += use;
        left -= use;
        this.animate(b);
        if (b.t < b.dur) break;
        this.finish(b);
        this.beat = null;
      }
      if (!this.beat && !this.beats.length) this.idle(dt);
    }

    idle(dt) {
      const B = this.B;
      if (this.deploying) return;
      if (B.winner >= 0) {
        if (!this.result) {
          this.sync();
          if (this.humans.length > 1 && B.winner >= 0) this.player = B.winner;
          this.result = BA.result(B);
          this.ui.music(B.winner === this.player ? 'victory' : 'defeat');
          const home = this.setup.doneLabel || 'На карту', row = this.setup.done ? (this.quicked && this.setup.replay ? [['done', home], ['replay', 'Переиграть вручную']] : [['done', home]]) : [['again', 'Ещё раз'], ['next', 'Новый бой'], ['list', 'К списку']];
          this.resultButtons = row.map(([id, label], i) => ({ id, label, x: H.W / 2 - row.length * 56 + i * 112 + 4, y: 420, w: 104, h: 24 }));
        }
        return;
      }
      const s = B.stacks[B.active];
      if (!this.auto && s.side !== this.player && this.humans.includes(s.side)) {
        this.player = s.side;
        this.rc = null;
      }
      if (s.side !== this.player || this.auto || this.machineByItself(s)) {
        this.think += dt * this.ui.speed;
        if (this.think < 0.25) return;
        this.think = 0;
        this.feed(BA.act(B, H.BattleAI.choose(B)));
        return;
      }
      if (!this.rc) {
        this.sync();
        this.rc = BA.reach(B, s);
        this.hover = this.aim(this.mouse[0], this.mouse[1]);
      }
    }

    act(action) {
      this.mode = null;
      this.saddleAt = null;
      this.rc = null;
      this.hover = null;
      this.feed(BA.act(this.B, action));
    }

    back() {
      if (this.mode) {
        this.mode = null;
        this.spell = null;
        this.spellFirst = null;
        this.saddleAt = null;
        this.hover = null;
        return true;
      }
      return false;
    }

    castNow(action) {
      this.mode = null;
      this.spell = null;
      this.spellFirst = null;
      this.hover = null;
      this.rc = null;
      this.feed(BA.act(this.B, action));
    }

    openBook() {
      const B = this.B, side = B.sides[this.player], h = side.hero;
      this.ui.show(new H.BookView(this.ui, this, {
        hero: h,
        board: B,
        known: h.spells,
        block: id => BA.castBlock(B, id),
        pick: id => {
          this.ui.show(this);
          const sp = H.SPELLS[id];
          if (sp.aim === 'none' || sp.aim === 'foes' || sp.aim === 'owns') this.castNow({ type: 'cast', spell: id });
          else {
            this.mode = 'spell';
            this.spell = id;
            this.spellFirst = null;
          }
        }
      }));
    }

    quick() {
      const B = this.B;
      if (B.winner >= 0) return;
      this.deploying = false;
      this.quicked = true;
      this.beats = [];
      this.beat = null;
      this.floats = [];
      const left = side => BA.alive(B).some(s => s.side === side);
      if (!left(1 - this.player)) {
        B.winner = this.player;
        B.active = -1;
      }
      while (B.winner < 0 && B.round <= 200) {
        for (const e of BA.act(B, H.BattleAI.choose(B))) {
          const line = this.note(e);
          if (line) this.log.push(line);
        }
      }
      this.log.push('Быстрый бой: ИИ довёл бой до конца.');
      this.sync();
    }

    winNow() {
      const B = this.B;
      if (B.winner >= 0) return;
      for (const s of B.stacks) {
        if (s.side === this.player) continue;
        s.count = 0;
        s.hp = 0;
      }
      this.quick();
    }

    skill(s) {
      const u = U(s);
      if (BA.canCharm(s)) return 'charm';
      if (BA.canFog(s)) return 'fog';
      if (BA.canBurst(this.B, s)) return 'burst';
      if (BA.canTemper(s)) return 'temper';
      if (BA.canDeep(s)) return 'deep';
      if (BA.canWard(s)) return 'ward';
      if (BA.canSwitch(s) && BA.switchList(this.B, s).length) return 'switch';
      if (BA.canRevive(s) && BA.reviveList(this.B, s).length) return 'revive';
      if (BA.canMend(s) && BA.mendList(this.B, s).length) return 'mend';
      if (BA.canCry(s) && BA.cryList(this.B, s).length) return 'cry';
      if (BA.canGrow(s)) return 'grow';
      if (BA.canCall(s) && BA.callList(this.B, s).length) return 'call';
      if (BA.canDrag(this.B, s)) return 'lasso';
      if (BA.canVolley(this.B, s)) return 'volley';
      if (u.bell && !BA.enemyNear(this.B, s, s.c, s.r)) return 'bell';
      if (u.saddle && s.shots > 0) return 'saddle';
      return null;
    }

    aim(x, y) {
      const s = this.mine();
      if (!s || !this.rc) return null;
      const cell = D.pick(x, y);
      if (!cell) return null;
      const B = this.B, who = this.stackAt(cell[0], cell[1]), foe = who && who.side !== s.side ? who : null, kind = U(s).machine;
      if (kind === 'catapult') {
        const piece = D.pieceAt(B, cell[0], cell[1]);
        return piece >= 0 && B.siege.pieces[piece].hp > 0 ? { cell, piece, action: { type: 'hurl', piece } } : { cell, bad: MACHINE_HINT.catapult };
      }
      if (kind === 'tent') return who && BA.tendList(B, s).includes(who) ? { cell, ally: who, tend: true, action: { type: 'tend', target: who.id } } : { cell, bad: MACHINE_HINT.tent };
      if (this.mode === 'warcry') {
        if (who && who.side === s.side && who !== s) return { cell, ally: who, action: { type: 'order', order: 'warcry', target: who.id } };
        return { cell, bad: 'Клич: выберите другой свой отряд' };
      }
      if (this.mode === 'spell') {
        const sp = H.SPELLS[this.spell], id = this.spell, list = BA.stackTargets(B, sp, s.side), first = this.spellFirst != null ? B.stacks[this.spellFirst] : null;
        if (sp.aim === 'push' && first) return BA.pushOkay(B, first, cell[0], cell[1], sp) ? { cell, sp, action: { type: 'cast', spell: id, target: first.id, c: cell[0], r: cell[1] } } : { cell, bad: 'Течение: свободная клетка не дальше ' + sp.push };
        if (sp.aim === 'swap' && first) return who && BA.swapOkay(B, first, who) ? { cell, sp, stack: who, action: { type: 'cast', spell: id, target: first.id, target2: who.id } } : { cell, bad: 'Подмена: второй отряд того же размера' };
        if (sp.aim === 'push' || sp.aim === 'swap') return who && list.includes(who) ? { cell, sp, stack: who, pickStack: who } : { cell, bad: sp.name + ': выберите отряд' };
        if (sp.aim === 'foe' || sp.aim === 'own' || sp.aim === 'stack') return who && list.includes(who) ? { cell, sp, stack: who, action: { type: 'cast', spell: id, target: who.id } } : { cell, bad: sp.name + ': эту цель не взять' };
        if (BA.cellOkay(B, sp, cell[0], cell[1])) return { cell, sp, area: sp.area ? BA.areaCells(sp.area, cell[0], cell[1], s.side) : sp.aim === 'line' ? BA.areaCells('line', cell[0], cell[1], s.side) : [cell], action: { type: 'cast', spell: id, c: cell[0], r: cell[1] } };
        return { cell, bad: sp.name + ': сюда нельзя' };
      }
      if (this.mode === 'charm') return foe ? { cell, foe, kind: 'charm', action: { type: 'charm', target: foe.id } } : { cell, bad: 'Чары: выберите врага' };
      if (this.mode === 'bell') {
        if (foe && BA.gap(s, s.c, s.r, foe) <= U(s).bell.range) return { cell, foe, kind: 'bell', action: { type: 'bell', target: foe.id }, fc: BA.forecast(B, s, foe, 'bell') };
        return { cell, bad: 'Звон: цель в ' + U(s).bell.range + ' клетках' };
      }
      if (this.mode === 'call') {
        if (who && BA.callList(B, s).includes(who)) return { cell, ally: who, call: true, action: { type: 'call', target: who.id } };
        return { cell, bad: 'Зов рода: выберите свой отряд с павшими' };
      }
      if (this.mode === 'lasso') {
        if (foe && BA.inDrag(B, s, foe)) return { cell, foe, kind: 'lasso', action: { type: 'lasso', target: foe.id } };
        return { cell, bad: (U(s).drag.name || 'Аркан') + ': цель не дальше ' + U(s).drag.range + ' клеток и не рядом' };
      }
      if (this.mode === 'flood') return { cell, area: BA.floodCells(cell[0], cell[1]), flood: true, action: { type: 'order', order: 'flood', c: cell[0], r: cell[1] } };
      if (this.mode === 'deep') {
        if (BA.deepOkay(B, s, cell[0], cell[1])) return { cell, deep: true, action: { type: 'deep', c: cell[0], r: cell[1] } };
        return { cell, bad: 'Уйти в глубь: нужна свободная клетка' };
      }
      if (this.mode === 'temper') {
        if (who && BA.temperList(B, s).includes(who)) return { cell, ally: who, temper: true, action: { type: 'temper', target: who.id } };
        return { cell, bad: 'Закалить: нужен свой отряд без закалки' };
      }
      if (this.mode === 'ward') {
        if (who && BA.wardList(B, s).includes(who)) return { cell, ally: who, ward: true, action: { type: 'ward', target: who.id } };
        return { cell, bad: 'Оберег: выберите свой отряд' };
      }
      if (this.mode === 'switch') {
        if (who && BA.switchList(B, s).includes(who)) return { cell, ally: who, swapper: true, action: { type: 'switch', target: who.id } };
        return { cell, bad: 'Зеркальный шаг: свой отряд того же размера' };
      }
      if (this.mode === 'mend') {
        if (who && BA.mendList(B, s).includes(who)) return { cell, ally: who, mend: true, action: { type: 'mend', target: who.id } };
        return { cell, bad: 'Лунный свет: свой раненый отряд' };
      }
      if (this.mode === 'revive') {
        if (who && BA.reviveList(B, s).includes(who)) return { cell, ally: who, revive: true, action: { type: 'revive', target: who.id } };
        return { cell, bad: 'Белый свет: свой отряд с павшими' };
      }
      if (this.mode === 'cry') {
        if (who && BA.cryList(B, s).includes(who)) return { cell, ally: who, cry: true, action: { type: 'cry', target: who.id } };
        return { cell, bad: 'Вещий крик: выберите другой свой отряд' };
      }
      if (this.mode === 'grow') {
        if (BA.growOkay(B, s, cell[0], cell[1])) return { cell, grow: true, action: { type: 'grow', c: cell[0], r: cell[1] } };
        return { cell, bad: 'Заросль: свободная клетка не дальше 2' };
      }
      if (this.mode === 'volley') {
        if (foe && BA.inVolley(B, s, foe)) return { cell, foe, kind: 'volley', action: { type: 'volley', target: foe.id }, fc: BA.forecast(B, s, foe, 'volley') };
        return { cell, bad: 'Залп: цель в ' + U(s).volley.range + ' клетках' };
      }
      if (this.mode === 'saddle') {
        if (!this.saddleAt) {
          const p = this.rc.get(H.Hex.idx(cell[0], cell[1])), near = U(s).saddleSteps || 99;
          if (p && p.steps && p.steps <= near && !BA.enemyNear(B, s, p.c, p.r)) return { cell, pickSpot: p, path: p.path };
          return { cell, bad: saddleWord(s) + ': клетка ' + (U(s).saddleSteps ? 'в ' + near + ' шагах и ' : '') + 'не рядом с врагом' };
        }
        if (foe) return { cell, foe, kind: 'saddle', action: { type: 'saddle', c: this.saddleAt.c, r: this.saddleAt.r, target: foe.id }, fc: BA.forecast(B, s, foe, 'saddle', { c: this.saddleAt.c, r: this.saddleAt.r }) };
        return { cell, bad: saddleWord(s) + ': выберите цель' };
      }
      if (foe) {
        if (BA.canShoot(B, s) && BA.sees(B, s, foe)) return { cell, foe, kind: 'shot', far: BA.farShot(B, s, s.c, s.r, foe), action: { type: 'shoot', target: foe.id }, fc: BA.forecast(B, s, foe, 'shot') };
        const poles = BA.poleSpots(B, s, foe, this.rc);
        let best = null, bd = Infinity;
        for (const p of poles.length ? poles : BA.spots(B, s, foe, this.rc)) {
          const [px, py] = this.at(s, p.c, p.r), d = (px - x) ** 2 + (py - y) ** 2;
          if (d < bd) {
            bd = d;
            best = p;
          }
        }
        if (!best) return { cell, bad: 'Не дотянуться' };
        const kind = poles.length ? 'pole' : 'melee';
        return { cell, foe, kind, spot: best, path: best.path, action: { type: 'attack', target: foe.id, c: best.c, r: best.r }, fc: BA.forecast(B, s, foe, kind, { c: best.c, r: best.r, flown: U(s).fly ? best.steps : 0, run: best.steps }) };
      }
      if (!who) {
        const p = this.rc.get(H.Hex.idx(cell[0], cell[1]));
        if (p && p.steps) return { cell, kind: 'move', path: p.path, action: { type: 'move', c: p.c, r: p.r } };
        return { cell, bad: 'Сюда не дойти' };
      }
      return { cell };
    }

    enabled(id) {
      const s = this.mine();
      if (id === 'wait') return !!s && !s.waited;
      if (id === 'defend') return !!s;
      if (id === 'skill') return !!s && !!this.skill(s);
      if (id === 'alarm') return !!s && (BA.canAlarm(s) || (!!U(s).drag && !!U(s).saddle && s.shots > 0));
      if (id === 'order') return !!s && (BA.canOrder(this.B, 'warcry') || BA.canOrder(this.B, 'high') || BA.canOrder(this.B, 'flood'));
      if (id === 'cast') {
        const side = s && this.B.sides[s.side], h = side && side.hero;
        return !!h && !!h.spells && h.spells.length > 0;
      }
      if (id === 'quick') return this.B.winner < 0;
      if (id === 'flee' || id === 'ransom') return !!s && BA.canRetreat(this.B, this.player, id);
      return true;
    }

    press(id) {
      if (!this.enabled(id)) return;
      if (id === 'wait') this.act({ type: 'wait' });
      else if (id === 'defend') this.act({ type: 'defend' });
      else if (id === 'alarm') {
        if (BA.canAlarm(this.mine())) this.act({ type: 'alarm' });
        else {
          this.mode = this.mode === 'saddle' ? null : 'saddle';
          this.saddleAt = null;
          this.hover = this.aim(this.mouse[0], this.mouse[1]);
        }
      }
      else if (id === 'skill') {
        const m = this.skill(this.mine());
        if (m === 'fog' || m === 'burst') {
          this.act({ type: m });
          return;
        }
        this.mode = this.mode === m ? null : m;
        this.saddleAt = null;
        this.hover = this.aim(this.mouse[0], this.mouse[1]);
      } else if (id === 'order') {
        if (BA.canOrder(this.B, 'high') && !this.highAsked) {
          this.highAsked = true;
          this.feed(BA.act(this.B, { type: 'order', order: 'high' }));
          this.rc = null;
          return;
        }
        if (BA.canOrder(this.B, 'flood') && this.mode !== 'flood') {
          this.mode = 'flood';
          this.hover = this.aim(this.mouse[0], this.mouse[1]);
          return;
        }
        this.mode = this.mode === 'warcry' || this.mode === 'flood' ? null : 'warcry';
        this.hover = this.aim(this.mouse[0], this.mouse[1]);
      } else if (id === 'cast') this.openBook();
      else if (id === 'quick') this.quick();
      else if (id === 'flee' || id === 'ransom') this.ask = id;
      else if (id === 'log') this.showLog = !this.showLog;
      else if (id === 'speed') this.ui.cycleSpeed();
      else if (id === 'menu') this.ui.openMenu();
    }

    askButtons() {
      return [{ id: 'yes', label: this.ask === 'ransom' ? 'Заплатить' : 'Бежать', x: 270, y: 300, w: 120, h: 26 }, { id: 'no', label: 'Остаться', x: 410, y: 300, w: 120, h: 26 }];
    }

    pointer(type, x, y, btn) {
      this.mouse = [x, y];
      if (this.ask) {
        const b = this.askButtons().find(o => hit(o, x, y));
        this.hotAsk = b ? b.id : null;
        this.ui.gfx.cursor(b ? 'hand' : 'arrow');
        if (type !== 'down' || btn !== 0 || !b) return;
        const kind = this.ask;
        this.ask = null;
        if (b.id === 'yes') this.act({ type: kind });
        return;
      }
      if (this.result) {
        const b = this.resultButtons.find(o => hit(o, x, y));
        this.hotResult = b ? b.id : null;
        if (type !== 'down' || btn !== 0 || !b) return;
        this.ui.sfx('click');
        if (b.id === 'done') this.setup.done(this.B);
        else if (b.id === 'replay') this.setup.replay();
        else if (b.id === 'again') this.ui.startTrial(this.setup.trial, this.seed);
        else if (b.id === 'next') this.ui.startTrial(this.setup.trial, this.seed + 1);
        else this.ui.showTrials();
        return;
      }
      if (this.deploying) {
        this.pointerDeploy(type, x, y, btn);
        return;
      }
      if (type === 'up' && btn === 2) this.info = null;
      const b = this.buttons.find(o => hit(o, x, y));
      this.hot = b ? b.id : null;
      if (type === 'down' && btn === 2) {
        const cell = D.pick(x, y), s = cell && this.stackAt(cell[0], cell[1]);
        this.info = s ? s.id : null;
        return;
      }
      if (b) {
        this.hover = null;
        this.ui.gfx.cursor('arrow');
        if (type === 'down' && btn === 0) this.press(b.id);
        return;
      }
      this.hover = this.aim(x, y);
      this.pointerCursor();
      if (type !== 'down' || btn !== 0 || !this.hover) return;
      if (this.hover.pickStack) {
        this.spellFirst = this.hover.pickStack.id;
        this.hover = this.aim(x, y);
      } else if (this.hover.pickSpot) {
        this.saddleAt = this.hover.pickSpot;
        this.hover = this.aim(x, y);
      } else if (this.hover.action) {
        if (this.hover.action.type === 'cast') this.castNow(this.hover.action);
        else if (this.hover.action.type === 'order') {
          const action = this.hover.action;
          this.mode = null;
          this.hover = null;
          this.feed(BA.act(this.B, action));
          this.rc = null;
        } else this.act(this.hover.action);
      }
    }

    deployCell(c, r) {
      const s = this.picked == null ? null : this.B.stacks[this.picked];
      if (!s) return false;
      const cols = this.B.sides[this.player].hero.tactics || 0, inBand = p => (this.player ? p[0] >= BT.cols - cols : p[0] < cols);
      return BA.cellsAt(s, c, r).every(inBand) && BA.fits(BA.occupancy(this.B, s), s, c, r);
    }

    pointerDeploy(type, x, y, btn) {
      const go = { x: H.W / 2 - 70, y: 462, w: 140, h: 26 };
      this.deployBtn = go;
      this.hot = hit(go, x, y) ? 'deploy' : null;
      this.ui.gfx.cursor(this.hot ? 'hand' : 'arrow');
      if (type !== 'down' || btn !== 0) return;
      if (this.hot) {
        this.deployed.add(this.player);
        const next = this.humans.find(sd => !this.deployed.has(sd) && this.needsDeploy(sd));
        if (next != null) {
          this.player = next;
          this.picked = null;
          return;
        }
        this.deploying = false;
        BA.plantAll(this.B);
        this.feed(BA.mirrorAll(this.B));
        this.rc = null;
        return;
      }
      const cell = D.pick(x, y), who = cell && this.stackAt(cell[0], cell[1]);
      if (who && who.side === this.player && this.picked == null && BA.mirrorOkay(this.B, this.player, who.id)) {
        this.feed(BA.mirror(this.B, this.player, who.id));
        this.ui.sfx('click');
      } else if (who && who.side === this.player) this.picked = who.id;
      else if (cell && this.picked == null && BA.plantOkay(this.B, this.player, cell[0], cell[1])) {
        BA.plant(this.B, this.player, cell[0], cell[1]);
        this.ui.sfx('click');
      } else if (cell && this.deployCell(cell[0], cell[1])) {
        BA.place(this.B, this.picked, cell[0], cell[1]);
        this.sync();
        this.picked = null;
      }
    }

    pointerCursor() {
      const h = this.hover, s = this.mine();
      if (!h || !s) return this.ui.gfx.cursor('arrow');
      if (h.bad) return this.ui.gfx.cursor('no');
      if (h.piece != null || h.tend || h.call || h.ward || h.cry || h.grow || h.deep || h.flood || h.temper || h.swapper || h.mend || h.revive) return this.ui.gfx.cursor('hand');
      if (h.sp) return this.ui.gfx.cursor('spell');
      if (h.kind === 'move' || h.pickSpot) return this.ui.gfx.cursor(U(s).fly && !h.pickSpot ? 'fly' : 'step');
      if (FLYING.includes(h.kind)) return this.ui.gfx.cursor(h.far ? 'bowfar' : 'bow');
      if (h.kind === 'bell' || h.kind === 'lasso') return this.ui.gfx.cursor('bell');
      if (h.kind === 'charm') return this.ui.gfx.cursor('spell');
      if (h.kind === 'melee' || h.kind === 'pole') {
        const [sx, sy] = this.at(s, h.spot.c, h.spot.r), [tx, ty] = D.stackPos(h.foe), a = Math.atan2(ty - sy, tx - sx);
        return this.ui.gfx.cursor('sword', (a + Math.PI * 2) % (Math.PI * 2));
      }
      return this.ui.gfx.cursor('info');
    }

    key(code) {
      if (this.result) return;
      const map = { KeyW: 'wait', KeyD: 'defend', KeyS: 'skill', KeyO: 'order', KeyC: 'cast', KeyA: 'quick', KeyL: 'log', KeyN: 'alarm' };
      if (map[code]) this.press(map[code]);
    }

    draw(g) {
      const c = g.ctx, B = this.B, s = this.mine();
      D.field(g, B);
      H.MapDraw.fighter(c, B, 0, this.ui.time);
      H.MapDraw.fighter(c, B, 1, this.ui.time);
      if (this.deploying) this.drawDeploy(g);
      if (s && this.rc) this.drawAim(c, s);
      const order = B.stacks.map(st => st.id).sort((a, b) => this.vis[a].y - this.vis[b].y || this.vis[a].x - this.vis[b].x);
      for (const id of order) D.unit(g, B, B.stacks[id], this.vis[id], id === B.active && !this.beat && !this.beats.length && B.winner < 0);
      this.drawBeat(c);
      for (const f of this.floats) g.text(f.text, f.x, f.y - f.t * 30, { align: 'center', size: 12, bold: true, color: f.color });
      if (this.banner) g.text(this.banner.text, H.W / 2, 40, { align: 'center', size: 20, bold: true, serif: true });
      this.drawPanel(g);
      if (this.hover && !this.result && this.info == null) this.drawTip(g);
      if (this.info != null) this.drawInfo(g, B.stacks[this.info]);
      if (this.showLog) this.drawLog(g);
      if (this.result) this.drawResult(g);
      if (this.ask) this.drawAsk(g);
    }

    drawAsk(g) {
      const c = g.ctx, ransom = this.ask === 'ransom';
      c.fillStyle = 'rgba(5,7,15,0.55)';
      c.fillRect(0, 0, H.W, H.H);
      g.panel(220, 190, 360, 150);
      g.text(ransom ? 'Откуп' : 'Бегство', H.W / 2, 216, { align: 'center', serif: true });
      const lines = ransom ? ['Герой заплатит ' + BA.ransomPrice(this.B, this.player) + ' золота и уйдёт с войском.', 'Через день его можно нанять в таверне.'] : ['Войско погибнет, герой уйдёт живым.', 'Через день его можно нанять в таверне.'];
      lines.forEach((s, i) => g.text(s, H.W / 2, 246 + i * 16, { align: 'center' }));
      for (const b of this.askButtons()) g.button({ ...b, hot: this.hotAsk === b.id });
    }

    drawDeploy(g) {
      const c = g.ctx, side = this.B.sides[this.player], cols = side.hero.tactics || 0, left = side.plantLeft || 0;
      for (let r = 0; r < BT.rows; r++) {
        for (let col = 0; col < cols; col++) {
          D.hexPath(c, this.player ? BT.cols - 1 - col : col, r, 2);
          c.fillStyle = 'rgba(255,240,180,0.14)';
          c.fill();
        }
      }
      if (this.picked != null) {
        for (const p of BA.cells(this.B.stacks[this.picked])) {
          D.hexPath(c, p[0], p[1], 2);
          c.strokeStyle = '#ffd040';
          c.lineWidth = 2;
          c.stroke();
        }
      }
      if (left) {
        for (let r = 0; r < BT.rows; r++) {
          for (let col = 0; col < BT.cols; col++) {
            if (!BA.plantOkay(this.B, this.player, col, r)) continue;
            D.hexPath(c, col, r, 2);
            c.fillStyle = 'rgba(120,200,110,0.13)';
            c.fill();
          }
        }
      }
      const mirrors = side.mirrorLeft || 0;
      if (mirrors) {
        for (const st of BA.alive(this.B)) {
          if (!BA.mirrorOkay(this.B, this.player, st.id)) continue;
          for (const p of BA.cells(st)) {
            D.hexPath(c, p[0], p[1], 2);
            c.strokeStyle = '#c8d8ff';
            c.lineWidth = 2;
            c.stroke();
          }
        }
        g.text('Отражения: осталось ' + mirrors + '. Щёлкните свой отряд до ' + (side.hero.mirrorTier || H.HERO.throne.tier) + ' уровня. Кого не выберете, выберет зеркало', H.W / 2, cols ? 134 : 150, { align: 'center', bold: true, color: '#c8d8ff' });
      }
      if (cols) g.text('Тактика: щёлкните свой отряд, затем клетку в светлой полосе', H.W / 2, left ? 134 : 150, { align: 'center', bold: true, color: '#fff6c8' });
      if (left) g.text('Заросли: осталось ' + left + '. Щёлкните пустую клетку. Что не поставите, лес поставит сам', H.W / 2, 150, { align: 'center', bold: true, color: '#c8f0a0' });
      g.button({ x: H.W / 2 - 70, y: 462, w: 140, h: 26, label: 'В бой', hot: this.hot === 'deploy' });
    }

    drawAim(c, s) {
      const shade = (col, rr, fill) => {
        D.hexPath(c, col, rr, 2);
        c.fillStyle = fill;
        c.fill();
      };
      if (this.mode === 'warcry') {
        for (const t of BA.alive(this.B)) if (t.side === s.side && t !== s) for (const p of BA.cells(t)) shade(p[0], p[1], 'rgba(255,230,120,0.3)');
      } else if (this.mode === 'spell') {
        const sp = H.SPELLS[this.spell];
        if (sp.aim === 'foe' || sp.aim === 'own' || sp.aim === 'stack' || ((sp.aim === 'push' || sp.aim === 'swap') && this.spellFirst == null)) {
          for (const t of BA.stackTargets(this.B, sp, s.side)) for (const p of BA.cells(t)) shade(p[0], p[1], 'rgba(160,190,255,0.3)');
        }
        if (this.spellFirst != null) for (const p of BA.cells(this.B.stacks[this.spellFirst])) shade(p[0], p[1], 'rgba(255,220,120,0.4)');
        if (this.hover && this.hover.area) for (const p of this.hover.area) shade(p[0], p[1], 'rgba(255,150,90,0.4)');
        return;
      } else if (this.mode === 'bell') {
        for (const t of BA.alive(this.B)) if (t.side !== s.side && BA.gap(s, s.c, s.r, t) <= U(s).bell.range) for (const p of BA.cells(t)) shade(p[0], p[1], 'rgba(255,120,80,0.3)');
      } else if (this.mode === 'call') {
        for (const t of BA.callList(this.B, s)) for (const p of BA.cells(t)) shade(p[0], p[1], 'rgba(160,240,180,0.3)');
      } else if (this.mode === 'lasso') {
        for (const t of BA.alive(this.B)) if (t.side !== s.side && BA.inDrag(this.B, s, t)) for (const p of BA.cells(t)) shade(p[0], p[1], 'rgba(255,190,110,0.32)');
      } else if (this.mode === 'flood') {
        if (this.hover && this.hover.area) for (const p of this.hover.area) shade(p[0], p[1], 'rgba(70,150,210,0.45)');
      } else if (this.mode === 'deep') {
        for (let rr = 0; rr < BT.rows; rr++) for (let col = 0; col < BT.cols; col++) if (BA.deepOkay(this.B, s, col, rr)) shade(col, rr, 'rgba(70,150,210,0.25)');
      } else if (this.mode === 'temper') {
        for (const t of BA.temperList(this.B, s)) for (const p of BA.cells(t)) shade(p[0], p[1], 'rgba(255,170,90,0.3)');
      } else if (this.mode === 'switch' || this.mode === 'mend' || this.mode === 'revive') {
        for (const t of this.mode === 'switch' ? BA.switchList(this.B, s) : this.mode === 'mend' ? BA.mendList(this.B, s) : BA.reviveList(this.B, s)) for (const p of BA.cells(t)) shade(p[0], p[1], 'rgba(200,215,255,0.3)');
      } else if (this.mode === 'ward') {
        for (const t of BA.wardList(this.B, s)) for (const p of BA.cells(t)) shade(p[0], p[1], 'rgba(170,230,255,0.3)');
      } else if (this.mode === 'cry') {
        for (const t of BA.cryList(this.B, s)) for (const p of BA.cells(t)) shade(p[0], p[1], 'rgba(255,230,120,0.3)');
      } else if (this.mode === 'grow') {
        for (let rr = 0; rr < BT.rows; rr++) for (let col = 0; col < BT.cols; col++) if (BA.growOkay(this.B, s, col, rr)) shade(col, rr, 'rgba(120,200,110,0.3)');
      } else if (this.mode === 'volley') {
        for (const t of BA.alive(this.B)) if (t.side !== s.side && BA.inVolley(this.B, s, t)) for (const p of BA.cells(t)) shade(p[0], p[1], 'rgba(255,170,80,0.34)');
      } else {
        for (const p of this.rc.values()) {
          if (!p.steps) continue;
          if (this.mode === 'saddle' && (BA.enemyNear(this.B, s, p.c, p.r) || p.steps > (U(s).saddleSteps || 99))) continue;
          shade(p.c, p.r, 'rgba(255,240,180,0.16)');
        }
      }
      if (this.saddleAt) {
        D.hexPath(c, this.saddleAt.c, this.saddleAt.r, 2);
        c.strokeStyle = '#ffd040';
        c.lineWidth = 2;
        c.stroke();
      }
      const h = this.hover;
      if (!h) return;
      if (h.path) {
        c.fillStyle = '#fff2b0';
        for (const p of h.path.slice(1)) {
          const [x, y] = D.center(p[0], p[1]);
          c.fillRect(x - 2, y - 2, 4, 4);
        }
      }
      if (h.spot) {
        for (const p of BA.cellsAt(s, h.spot.c, h.spot.r)) {
          D.hexPath(c, p[0], p[1], 2);
          c.strokeStyle = '#ffd040';
          c.lineWidth = 2;
          c.stroke();
        }
      }
      if (h.foe) {
        for (const p of BA.cells(h.foe)) {
          D.hexPath(c, p[0], p[1], 2);
          c.strokeStyle = '#ff5030';
          c.lineWidth = 2;
          c.stroke();
        }
      } else if (h.cell) {
        D.hexPath(c, h.cell[0], h.cell[1], 2);
        c.strokeStyle = h.bad ? 'rgba(255,80,60,0.7)' : 'rgba(255,255,255,0.7)';
        c.lineWidth = 1;
        c.stroke();
      }
    }

    drawBeat(c) {
      const b = this.beat;
      if (!b || b.e.t !== 'hit') return;
      const e = b.e, f = Math.min(1, b.t / b.dur);
      if (e.kind === 'spell' || e.kind === 'poison' || e.kind === 'fire' || e.kind === 'thorn' || e.kind === 'tower' || e.kind === 'splash' || e.kind === 'through') {
        const col = e.kind === 'spell' ? H.SPELL_COLORS[H.SPELLS[e.spell].school] : e.kind === 'poison' ? '#70c040' : e.kind === 'fire' || e.kind === 'splash' || e.kind === 'through' ? '#e8701a' : e.kind === 'tower' ? '#e8e0c8' : '#5a8a3a';
        c.save();
        c.globalAlpha = 1 - f * 0.7;
        c.strokeStyle = col;
        c.lineWidth = 3;
        for (let k = 0; k < 2; k++) {
          c.beginPath();
          c.arc(b.to[0], b.to[1], 6 + f * 26 + k * 7, 0, Math.PI * 2);
          c.stroke();
        }
        c.restore();
      } else if (FLYING.includes(e.kind)) {
        const u = H.UNITS[this.B.stacks[e.by].unit], ball = u.splash || u.line || e.kind === 'volley';
        const x = b.from[0] + (b.to[0] - b.from[0]) * f, y = b.from[1] + (b.to[1] - b.from[1]) * f - Math.sin(Math.PI * f) * (u.lob ? 70 : u.line ? 8 : 30);
        c.strokeStyle = '#2a1a0a';
        c.fillStyle = '#1a1a1a';
        c.lineWidth = 2;
        c.beginPath();
        if (ball) {
          c.arc(x, y, e.kind === 'volley' ? 2 : 4, 0, Math.PI * 2);
          c.fill();
        } else {
          c.moveTo(x - 6, y);
          c.lineTo(x + 6, y);
          c.stroke();
        }
      } else if (e.kind === 'bell') {
        c.strokeStyle = 'rgba(255,220,120,' + (1 - f) + ')';
        c.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.arc(b.to[0], b.to[1], 6 + f * 30 + k * 8, 0, Math.PI * 2);
          c.stroke();
        }
      }
    }

    drawPanel(g) {
      const c = g.ctx, B = this.B;
      g.panel(0, 496, H.W, 104, 'plate');
      const s = B.active >= 0 ? B.stacks[B.active] : null;
      if (s) {
        const u = U(s);
        g.text(u.name, 6, 506, { bold: true });
        c.fillStyle = '#05070f';
        c.fillRect(6, 516, 42, 46);
        H.Art.drawUnit(c, s.unit, 27, 558, { scale: 0.62, flip: s.side === 1, tier: false });
        g.text('×' + this.vis[s.id].count, 54, 524, { size: 10 });
        g.text('Нат ' + BA.atkOf(s) + ' Ст ' + Math.round(BA.defOf(s, 0)), 54, 537, { size: 10 });
        g.text('Здор ' + s.hp + '/' + BA.hpOf(s), 54, 550, { size: 10 });
        g.text((u.shots ? 'Выстр ' + s.shots + ' ' : '') + 'Мор ' + sign(BA.moraleOf(B, s)), 54, 563, { size: 10 });
      }
      const pick = this.hot === 'wait' ? BT.waitAt : this.hot === 'defend' ? BT.defendAt : null;
      const q = BA.queue(B, TAPE.n, this.mine() && pick != null ? pick : null);
      let prev = q.length ? q[0].round : 0;
      q.forEach((it, i) => {
        const x = TAPE.x + i * TAPE.step, st = B.stacks[it.id];
        if (it.round !== prev) {
          c.fillStyle = '#ffd040';
          c.fillRect(x - 2, TAPE.y - 2, 2, TAPE.cell + 4);
          prev = it.round;
        }
        c.fillStyle = '#05070f';
        c.fillRect(x, TAPE.y, TAPE.cell, TAPE.cell);
        c.strokeStyle = D.SIDE[st.side];
        c.lineWidth = it.id === B.active && pick != null ? 3 : 2;
        c.strokeRect(x + 1, TAPE.y + 1, TAPE.cell - 2, TAPE.cell - 2);
        H.Art.drawUnit(c, st.unit, x + 20, TAPE.y + 36, { scale: 0.42, flip: st.side === 1, tier: false });
        g.text(String(this.vis[st.id].count), x + TAPE.cell - 3, TAPE.y + TAPE.cell - 7, { align: 'right', size: 9, bold: true, color: '#ffffff' });
      });
      g.text('Раунд ' + B.round, 680, 512, { bold: true });
      if (BA.alive(B).some(q => H.FACTIONS[U(q).faction] && H.FACTIONS[U(q).faction].tide)) g.text(B.round % 2 ? 'Прилив' : 'Отлив', 748, 512, { size: 10, color: B.round % 2 ? '#8ad0f0' : '#c8b88a' });
      g.text(B.winner >= 0 ? 'Бой окончен' : this.deploying ? (this.humans.length > 1 ? 'Ставит: ' + this.whose() : 'Расстановка') : this.mine() ? (MACHINE_TURN[U(this.mine()).machine] || (this.humans.length > 1 ? 'Ход: ' + this.whose() : 'Ваш ход')) : this.auto ? 'Быстрый бой' : 'Ходит соперник', 680, 528, { size: 10, color: '#c8b88a' });
      const myHero = B.sides[this.player].hero;
      if (this.mode === 'spell') g.text((this.spellFirst != null ? 'Вторая цель: ' : 'Цель: ') + H.SPELLS[this.spell].name, 680, 541, { size: 10, color: '#ffd040' });
      else if (this.mode) g.text(this.mode === 'warcry' ? 'Клич: выберите отряд' : this.mode === 'bell' ? 'Звон: выберите цель' : this.mode === 'volley' ? 'Залп: выберите цель' : this.mode === 'call' ? 'Зов рода: свой отряд' : this.mode === 'flood' ? 'Затопить: клетка' : this.mode === 'temper' ? 'Закалить: свой отряд' : this.mode === 'switch' ? 'Зеркальный шаг: отряд' : this.mode === 'mend' ? 'Лунный свет: отряд' : this.mode === 'revive' ? 'Белый свет: отряд' : this.mode === 'deep' ? 'Уйти в глубь: клетка' : this.mode === 'ward' ? 'Оберег: свой отряд' : this.mode === 'cry' ? 'Вещий крик: свой отряд' : this.mode === 'grow' ? 'Заросль: клетка' : this.mode === 'lasso' ? (U(s).drag.name || 'Аркан') + ': выберите цель' : this.mode === 'charm' ? (U(s).spellOnce ? H.SPELLS[U(s).spellOnce].name + ': цель' : 'Чары: выберите врага') : saddleWord(s) + (this.saddleAt ? ': цель' : ': клетка'), 680, 541, { size: 10, color: '#ffd040' });
      else if (myHero && myHero.spells) g.text('Мана ' + myHero.mana + (B.sides[this.player].acted === B.round ? ', колдовал' : ''), 680, 541, { size: 10, color: '#a0c8ff' });
      for (const b of this.buttons) if (b.id !== 'alarm' || this.enabled('alarm')) g.button({ ...b, label: b.id === 'alarm' && s && !BA.canAlarm(s) ? 'С седла (N)' : b.id === 'speed' ? 'Скор. ' + this.ui.speed + '×' : b.label, hot: this.hot === b.id, off: !this.enabled(b.id), down: (b.id === 'skill' && !!this.mode && this.mode !== 'warcry' && this.mode !== 'spell') || (b.id === 'order' && this.mode === 'warcry') || (b.id === 'cast' && this.mode === 'spell') });
      const last = this.log[this.log.length - 1] || '';
      g.text(last.length > 120 ? last.slice(0, 119) + '…' : last, 6, 588, { size: 10, color: '#e8dcb8' });
    }

    drawTip(g) {
      const h = this.hover, lines = [];
      if (h.bad) lines.push(h.bad);
      else if (h.piece != null) {
        const p = this.B.siege.pieces[h.piece];
        lines.push((p.gate ? 'Ворота' : 'Участок стены') + ': прочность ' + p.hp + ' из ' + p.max);
      } else if (h.tend) lines.push('Шатёр: лечит верхнее существо', 'Здоровье ' + h.ally.hp + ' из ' + BA.hpOf(h.ally));
      else if (h.sp) {
        const side = this.B.sides[this.player];
        lines.push(h.sp.name);
        if (h.stack && h.sp.dmg) lines.push('Урон: ' + BA.spellDamage(this.B, side.hero, h.sp, h.stack, BA.spellAmount(this.B, side.hero, h.sp, h.sp.dmg)));
        else lines.push(...BA.spellFacts(this.B, side.hero, h.sp).slice(1, 3));
      } else if (h.kind === 'move') lines.push('Идти: ' + (h.path.length - 1) + ' кл.');
      else if (h.pickSpot) lines.push(saddleWord(this.B.stacks[this.B.active]) + ': отсюда стрелять', 'Затем выберите цель');
      else if (h.call) lines.push('Зов рода: вернутся ' + Math.max(1, Math.ceil((h.ally.start - h.ally.count) * U(this.B.stacks[this.B.active]).kinCall)) + ' из ' + (h.ally.start - h.ally.count) + ' павших');
      else if (h.kind === 'lasso') {
        const drag = U(this.B.stacks[this.B.active]).drag;
        lines.push((drag.name || 'Аркан') + ': цель на ' + drag.cells + ' клетки к вам' + (drag.ready ? ', −' + drag.ready + ' готовности' : ''));
      } else if (h.ward) {
        const ward = U(this.B.stacks[this.B.active]).ward;
        lines.push('Оберег: на ' + Math.round(ward.share * 100) + ' % меньше урона, раундов ' + ward.rounds);
      } else if (h.cry) lines.push('Вещий крик: +' + U(this.B.stacks[this.B.active]).cry.ready + ' готовности');
      else if (h.grow) lines.push('Поставить заросль здесь');
      else if (h.deep) lines.push('Всплыть здесь');
      else if (h.swapper) lines.push('Зеркальный шаг: поменяться местами');
      else if (h.mend) lines.push('Лунный свет: до ' + Math.round(this.B.stacks[this.B.active].count * BA.hpOf(this.B.stacks[this.B.active]) * U(this.B.stacks[this.B.active]).mend.share) + ' здоровья');
      else if (h.revive) lines.push('Белый свет: до ' + this.B.stacks[this.B.active].count * U(this.B.stacks[this.B.active]).revive + ' здоровья, павшие встают насовсем');
      else if (h.temper) lines.push('Закалить: +' + U(this.B.stacks[this.B.active]).temper + ' Стойкости до конца боя');
      else if (h.flood) lines.push('Мелководье: чужие −30 % инициативы');
      else if (h.ally) lines.push('Клич: +' + BT.warcry + ' готовности');
      else if (h.fc) {
        const f = h.fc, k = (a, b) => (a === b ? String(a) : a + '–' + b);
        const shooter = this.B.stacks[this.B.active], what = { melee: 'Удар', pole: 'Через клетку', shot: 'Выстрел', saddle: saddleWord(shooter), bell: 'Звон', volley: 'Залп' }[h.kind], blast = h.kind === 'shot' ? BA.blastTargets(this.B, shooter, h.foe) : [];
        lines.push(what + ': ' + k(f.min, f.max) + ' урона, погибнет ' + k(f.kmin, f.kmax));
        if (h.far) lines.push('Далеко: урон ' + (BA.farMulOf(this.B, shooter) === BT.farMul ? 'вдвое меньше' : 'на четверть меньше'));
        if (blast.length) lines.push('Заденет ещё: ' + blast.map(([n]) => U(n).name).join(', '));
        if (FLYING.includes(h.kind) && this.B.siege && h.foe.c > this.B.siege.col && !U(this.B.stacks[this.B.active]).lob && !U(this.B.stacks[this.B.active]).fly && BA.wallAt(this.B, h.foe.r)) lines.push('Через стену: урон вдвое меньше');
        if (f.brace) lines.push('Упор: враг ответит раньше удара');
        if (h.kind === 'pole') lines.push('Ответа не будет');
        if (h.kind === 'melee') lines.push(f.retal ? 'Ответ: ' + k(f.retal.min, f.retal.max) + ', погибнет ' + k(f.retal.kmin, f.retal.kmax) : 'Ответа не будет');
        if (f.support) lines.push('Строй: ещё ' + f.support + ' уд. по вам');
        if (h.kind === 'bell') lines.push('Без ответа, цель −' + U(this.B.stacks[this.B.active]).bell.ready + ' готовности');
      }
      if (!lines.length) return;
      const w = Math.max(...lines.map(l => l.length)) * 6 + 12, hgt = lines.length * 14 + 8;
      let x = this.mouse[0] + 14, y = this.mouse[1] + 14;
      if (x + w > H.W) x = this.mouse[0] - w - 8;
      if (y + hgt > 494) y = this.mouse[1] - hgt - 8;
      g.panel(x, y, w, hgt, 'tip');
      lines.forEach((l, i) => g.text(l, x + 6, y + 11 + i * 14, { size: 10 }));
    }

    drawInfo(g, s) {
      const u = U(s), B = this.B, pal = H.Art.PALETTES[u.faction];
      const lines = [
        pal.name + ', уровень ' + u.tier + ', в отряде ' + s.count,
        'Натиск ' + BA.atkOf(s) + (s.lament ? ' (Плач +' + s.lament + ')' : '') + (s.chill ? ' (холод −' + s.chill + ')' : '') + ', Стойкость ' + Math.round(BA.defOf(s, 0)) + (s.defending ? ' (оборона)' : ''),
        'Урон ' + u.dmg[0] + '–' + u.dmg[1] + ', здоровье ' + s.hp + ' из ' + BA.hpOf(s),
        'Скорость ' + u.speed + ', инициатива ' + BA.initOf(s) + (u.shots ? ', выстрелов ' + s.shots : ''),
        ...(s.stars ? ['Бывалые: ' + s.stars + ' ' + H.plural(s.stars, 'звезда', 'звезды', 'звёзд')] : []),
        'Мораль ' + sign(BA.moraleOf(B, s)) + ', удача ' + sign(BA.luckOf(B, s)) + ', готовность ' + Math.min(100, s.ready)
      ];
      for (const [name, text] of H.unitTraits(u)) lines.push(name + ': ' + text);
      for (const e of s.fx) if (H.SPELLS[e.spell]) lines.push((e.bad ? 'Порча: ' : 'Чары: ') + H.SPELLS[e.spell].name + (e.until < 99 ? ', до раунда ' + e.until : ''));
      if (s.summoned) lines.push(s.phantom ? 'Двойник: гибнет от любого урона' : 'Призваны до конца боя');
      const w = 380, hgt = lines.length * 14 + 34, x = Math.min(H.W - w - 4, Math.max(4, this.mouse[0] - w / 2)), y = Math.max(4, Math.min(494 - hgt, this.mouse[1] - hgt - 10));
      g.panel(x, y, w, hgt);
      g.text(u.name, x + 8, y + 12, { serif: true, color: pal.body });
      lines.forEach((l, i) => g.text(l, x + 8, y + 30 + i * 14, { size: 10 }));
    }

    drawLog(g) {
      const lines = this.log.slice(-16);
      g.panel(150, 120, 500, lines.length * 14 + 34);
      g.text('Журнал боя', 160, 136, { bold: true });
      lines.forEach((l, i) => g.text(l.length > 86 ? l.slice(0, 85) + '…' : l, 160, 154 + i * 14, { size: 10 }));
    }

    drawResult(g) {
      const r = this.result, win = r.winner === this.player, c = g.ctx;
      c.fillStyle = 'rgba(5,7,15,0.55)';
      c.fillRect(0, 0, H.W, H.H);
      g.panel(180, 110, 440, 350);
      const away = r.fled && r.fled.side === this.player ? (r.fled.kind === 'ransom' ? 'Откуп' : 'Бегство') : '';
      g.text(away || (win ? 'Победа' : 'Поражение'), H.W / 2, 136, { align: 'center', size: 24, bold: true, serif: true, color: win ? '#ffe080' : '#ff9a8a' });
      g.text('Раундов: ' + r.round + ', seed ' + this.seed, H.W / 2, 160, { align: 'center', size: 10, color: '#c8b88a' });
      [this.player, 1 - this.player].forEach((side, col) => {
        const x = 200 + col * 210;
        g.text(col ? 'Потери соперника' : 'Ваши потери', x, 186, { bold: true });
        r.lost[side].forEach((l, i) => {
          const u = H.UNITS[l.unit];
          c.fillStyle = '#05070f';
          c.fillRect(x, 198 + i * 40, 34, 36);
          H.Art.drawUnit(c, l.unit, x + 17, 230 + i * 40, { scale: 0.45, flip: side === 1, tier: false });
          g.text(u.name, x + 40, 208 + i * 40, { size: 10 });
          g.text('погибло ' + l.lost + ', осталось ' + l.left, x + 40, 222 + i * 40, { size: 10, color: l.lost ? '#ffb0a0' : '#c8e0a0' });
        });
      });
      const hero = this.B.sides[this.player].hero, gain = Math.round(r.xp[this.player] * (1 + (hero && hero.learning || 0)));
      g.text('Опыт за бой: ' + gain, H.W / 2, 388, { align: 'center' });
      if (r.stars[this.player].length) g.text('Звезда бывалых: ' + r.stars[this.player].map(id => H.UNITS[id].name).join(', '), H.W / 2, 404, { align: 'center', size: 10, color: '#ffe060' });
      for (const b of this.resultButtons) g.button({ ...b, hot: this.hotResult === b.id });
    }
  }

  H.BattleView = BattleView;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
