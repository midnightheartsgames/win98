(function (T) {
  'use strict';
  const { clamp } = T;

  class Flow {
    constructor(ui) { this.ui = ui; this.vsScore = [0, 0]; }

    start(id, sel) {
      const ui = this.ui;
      this.menuSel = sel;
      if (id === 'arcade' || id === 'ta' || id === 'survival') this.ladderSelect(id);
      else if (id === 'vs') this.vsSelect();
      else if (id === 'team') ui.go('teamsize', { onDone: (n, cpu) => this.teamSelect(n, cpu) });
      else if (id === 'practice') this.practiceSelect();
      else if (id === 'force') this.forceSelect();
      else if (id === 'ball') this.ballSelect();
      else ui.go(id);
    }

    back() { this.ui.go('main', { sel: this.menuSel || 0 }); }

    randomCostume(def) { return Math.floor(Math.random() * Math.min(2, def.costumes.length)); }

    demo() {
      const ui = this.ui;
      const pool = T.selectableFighters(ui.save).filter(d => !d.boss);
      const a = pool[Math.floor(Math.random() * pool.length)];
      let b = pool[Math.floor(Math.random() * pool.length)];
      if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
      ui.go('fight', {
        mode: 'demo', stage: b.stage, rounds: 1, time: 40,
        p: [{ def: a, costume: 0, human: false, level: 3 }, { def: b, costume: 1, human: false, level: 3 }],
        onEnd: () => ui.go('title')
      });
    }

    ladderSelect(kind) {
      const ui = this.ui;
      const title = { arcade: 'АРКАДА', ta: 'НА ВРЕМЯ', survival: 'ВЫЖИВАНИЕ' }[kind];
      ui.go('select', {
        players: 1, title, sub: 'Выберите бойца', onBack: () => this.back(),
        onDone: (p1) => {
          this.ladder = new T.Ladder(kind, p1.def.id, ui.save, Date.now() >>> 0);
          this.p1 = p1;
          ui.save.plays[p1.def.id] = (ui.save.plays[p1.def.id] || 0) + 1;
          ui.persist();
          this.ladderVs();
        }
      });
    }

    ladderVs() {
      const ui = this.ui, L = this.ladder;
      const e = L.current();
      const def = T.FIGHTER[e.id];
      const cost = def.id === this.p1.def.id ? (this.p1.costume + 1) % Math.max(2, def.costumes.length) : this.randomCostume(def);
      this.opp = { def, costume: cost };
      const total = L.kind === 'survival' ? '' : ` / ${L.list.length}`;
      const top = e.finalBoss ? 'ФИНАЛЬНЫЙ БОЙ' : e.boss && !e.sub ? 'ПОСЛЕДНИЙ СТРАЖ' : e.sub ? 'ГЛАВА ТУРНИРА' : `ЭТАП ${L.stage + 1}${total}`;
      const bottom = (T.STAGE[def.stage] ? T.STAGE[def.stage].name : '') + (L.kind === 'ta' ? '   ·   ' + T.fmtTime(L.frames) : L.kind === 'survival' ? `   ·   Побед: ${L.wins}` : '');
      ui.go('vs', { p: [this.p1, this.opp], top, bottom, boss: e.boss, onDone: () => this.ladderFight() });
    }

    ladderFight() {
      const ui = this.ui, L = this.ladder;
      const e = L.current();
      const mo = L.matchOpts();
      const hp = L.kind === 'survival' ? L.hp : null;
      const run = () => ui.go('fight', {
        mode: L.kind, stage: this.opp.def.stage, rounds: mo.rounds, time: mo.time, keepHp: mo.keepHp, maxRounds: L.kind === 'survival' ? 1 : undefined,
        skipIntro: L.kind === 'survival' && L.stage > 0,
        p: [{ def: this.p1.def, costume: this.p1.costume, human: true, hp: hp === null ? undefined : hp }, { def: this.opp.def, costume: this.opp.costume, human: false, level: L.aiLevel(), dmgMul: mo.bossDmg }],
        restart: run,
        onEnd: (r) => this.ladderEnd(r)
      });
      run();
    }

    ladderEnd(r) {
      const ui = this.ui, L = this.ladder;
      if (r.quit) { this.back(); return; }
      L.frames += r.frames || 0;
      if (r.winner === 0) {
        const res = L.won(r.hp, r.maxHp);
        if (L.kind === 'survival') { this.ladderVs(); return; }
        if (res.done) { this.ladderClear(); return; }
        const next = L.current();
        if (next && next.finalBoss) {
          ui.go('message', { title: 'КОЛОСС ПРОБУЖДАЕТСЯ', text: 'Бронза трескается, и из трещин вырывается пламя, которое горело в храме три тысячи лет.', def: T.FIGHTER.colossus2, sound: 'quake', music: 'colossus2', onDone: () => this.ladderVs() });
          return;
        }
        this.ladderVs();
        return;
      }
      if (L.kind === 'survival') {
        const n = L.wins;
        T.addRecord(ui.save.records.surv, { n, id: this.p1.def.id }, (a, b) => b.n - a.n);
        ui.persist();
        ui.go('message', { title: 'ВЫЖИВАНИЕ ОКОНЧЕНО', name: `Побед подряд: ${n}`, def: this.p1.def, costume: this.p1.costume, onDone: () => this.back() });
        return;
      }
      ui.go('cont', { def: this.p1.def, costume: this.p1.costume, onYes: () => { L.continues++; this.ladderVs(); }, onNo: () => ui.go('message', { title: 'КОНЕЦ ИГРЫ', name: this.p1.def.name, text: `Этап ${L.stage + 1} из ${L.list.length}. Продолжений: ${L.continues}.`, sound: 'back', onDone: () => this.back() }) });
    }

    ladderClear() {
      const ui = this.ui, L = this.ladder;
      const me = this.p1.def;
      const events = L.kind === 'arcade' || L.kind === 'ta' ? T.onArcadeClear(ui.save, me.id) : [];
      if (L.kind === 'ta') T.addRecord(ui.save.records.ta, { t: L.frames, id: me.id }, (a, b) => a.t - b.t);
      ui.persist();
      const queue = events.slice();
      const nextMsg = () => {
        const ev = queue.shift();
        if (!ev) { this.back(); return; }
        if (ev.kind === 'fighter') {
          const d = T.FIGHTER[ev.id];
          ui.go('message', { title: 'НОВЫЙ БОЕЦ!', name: d.name, text: d.bio, def: d, sound: 'unlock', music: 'select', onDone: nextMsg });
        } else if (ev.kind === 'mode') {
          const name = { force: 'ШТУРМ «КУРОГАНЕ»', ball: 'ПЛЯЖНЫЙ МЯЧ', theater: 'КИНОЗАЛ' }[ev.id];
          ui.go('message', { title: 'НОВЫЙ РЕЖИМ!', name, sound: 'unlock', bg: 'blue', onDone: nextMsg });
        } else if (ev.kind === 'costume') {
          ui.go('message', { title: 'НОВЫЕ КОСТЮМЫ', name: me.name, text: 'На экране выбора бойца доступны костюмы на кнопках 3 и 4.', def: me, costume: me.costumes.length - 1, sound: 'unlock', onDone: nextMsg });
        } else nextMsg();
      };
      const after = () => {
        if (L.kind === 'ta') ui.go('message', { title: 'РЕЗУЛЬТАТ', name: T.fmtTime(L.frames), text: 'Время всех боёв без учёта заставок.', def: me, costume: this.p1.costume, sound: 'unlock', onDone: nextMsg });
        else nextMsg();
      };
      ui.go('cine', { kind: 'ending', id: me.id, costume: this.p1.costume, onDone: () => ui.go('cine', { kind: 'credits', onDone: after }) });
    }

    vsSelect(pre) {
      const ui = this.ui;
      ui.go('select', {
        players: 2, title: 'БОЙ ВДВОЁМ', sub: 'Игрок 1 — W A S D + U I J K · Игрок 2 — стрелки + Num 4 5 1 2', onBack: () => this.back(),
        onDone: (p1, p2) => {
          this.p1 = p1; this.p2 = p2;
          ui.go('stage', { pre: p2.def.stage, onBack: () => this.vsSelect(), onDone: (st) => { this.vsStage = st; this.vsFight(); } });
        }
      });
    }

    vsFight() {
      const ui = this.ui;
      const run = () => ui.go('vs', {
        p: [this.p1, this.p2], top: `СЧЁТ ${this.vsScore[0]} : ${this.vsScore[1]}`, bottom: T.STAGE[this.vsStage].name, dur: 90,
        onDone: () => ui.go('fight', {
          mode: 'vs', stage: this.vsStage,
          p: [{ def: this.p1.def, costume: this.p1.costume, human: true }, { def: this.p2.def, costume: this.p2.costume, human: true }],
          restart: run,
          onEnd: (r) => {
            if (r.quit) { this.back(); return; }
            if (r.winner >= 0) this.vsScore[r.winner]++;
            const w = r.winner >= 0 ? (r.winner === 0 ? this.p1 : this.p2) : this.p1;
            ui.go('result', {
              def: w.def, costume: w.costume, stage: this.vsStage, title: r.winner >= 0 ? `ПОБЕДА: ${r.winner === 0 ? '1P' : '2P'}` : 'НИЧЬЯ',
              score: `${this.vsScore[0]} : ${this.vsScore[1]}`,
              items: [['Реванш', run], ['Выбор бойцов', () => this.vsSelect()], ['Главное меню', () => this.back()]]
            });
          }
        })
      });
      run();
    }

    teamSelect(sizes, cpu) {
      const ui = this.ui;
      const teams = [[], []];
      const pickNext = () => {
        const side = teams[0].length < sizes[0] ? 0 : 1;
        if (teams[1].length >= sizes[1]) { this.teamRun(teams, cpu); return; }
        if (side === 1 && cpu) {
          const pool = T.selectableFighters(ui.save).filter(d => !d.boss);
          while (teams[1].length < sizes[1]) { const d = pool[Math.floor(Math.random() * pool.length)]; teams[1].push({ def: d, costume: this.randomCostume(d) }); }
          this.teamRun(teams, cpu);
          return;
        }
        ui.go('select', {
          players: 1, title: `КОМАНДА ${side + 1}: БОЕЦ ${teams[side].length + 1} ИЗ ${sizes[side]}`, sub: teams[side].map(p => p.def.short).join(' · '),
          onBack: () => this.back(),
          onDone: (p) => { teams[side].push(p); pickNext(); }
        });
      };
      pickNext();
    }

    teamRun(teams, cpu) {
      const ui = this.ui;
      const tm = new T.Team(teams[0], teams[1]);
      const lvl = clamp(ui.save.opts.diff, 0, 4);
      const next = () => {
        const a = tm.cur(0), b = tm.cur(1);
        ui.go('vs', {
          p: [a, b], top: `КОМАНДЫ: ${tm.left(0)} × ${tm.left(1)}`, bottom: `${T.STAGE[b.def.stage].name}`, dur: 100,
          onDone: () => ui.go('fight', {
            mode: 'team', stage: b.def.stage, rounds: 1, maxRounds: 1,
            p: [{ def: a.def, costume: a.costume, human: true, hp: tm.hp[0] === null ? undefined : tm.hp[0] }, { def: b.def, costume: b.costume, human: !cpu, level: lvl, hp: tm.hp[1] === null ? undefined : tm.hp[1] }],
            restart: next,
            onEnd: (r) => {
              if (r.quit) { this.back(); return; }
              const w = r.winner < 0 ? 0 : r.winner;
              const f = r.fighters[w];
              const done = tm.result(w, f.hp, f.maxHp);
              if (done >= 0) {
                const wp = tm.cur(done);
                ui.go('result', { def: wp.def, costume: wp.costume, stage: wp.def.stage, title: `КОМАНДА ${done + 1} ПОБЕДИЛА`, items: [['Главное меню', () => this.back()]] });
              } else next();
            }
          })
        });
      };
      next();
    }

    practiceSelect() {
      const ui = this.ui;
      ui.go('select', {
        players: 1, cpuPick: true, title: 'ТРЕНИРОВКА', sub: 'Сначала ваш боец, затем манекен', onBack: () => this.back(),
        onDone: (p1, p2) => this.practiceRun(p1, p2)
      });
    }

    practiceRun(p1, p2) {
      const ui = this.ui;
      ui.go('fight', {
        mode: 'practice', stage: 'training', time: 0,
        p: [{ def: p1.def, costume: p1.costume, human: true }, { def: p2.def, costume: p2.costume, human: false, level: 2 }],
        onEnd: (r) => { if (r.charsel) this.practiceSelect(); else this.back(); }
      });
    }

    forceSelect() {
      const ui = this.ui;
      ui.go('select', { players: 1, title: 'ШТУРМ «КУРОГАНЕ»', sub: 'Выберите бойца для штурма', onBack: () => this.back(), onDone: (p1) => ui.go('force', { p: p1, onEnd: () => this.back() }) });
    }

    ballSelect() {
      const ui = this.ui;
      ui.go('select', {
        players: 1, cpuPick: true, title: 'ПЛЯЖНЫЙ МЯЧ', sub: 'Ваш боец и соперник (игрок 2 может подключиться клавишами)', onBack: () => this.back(),
        onDone: (p1, p2) => ui.go('ball', { p: [p1, p2], onEnd: () => this.back() })
      });
    }
  }

  const baseUI = T.UI;
  class UIWithFlow extends baseUI {
    constructor(root, opts) {
      super(root, opts);
    }
    go(name, args) {
      if (!this.flow) this.flow = new Flow(this);
      super.go(name, args);
    }
  }

  Object.assign(T, { Flow, UI: UIWithFlow });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
