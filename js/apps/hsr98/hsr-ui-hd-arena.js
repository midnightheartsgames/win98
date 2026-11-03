(function (H) {
  'use strict';
  const G = H.Gfx, HD = H.HD, TUN = HD.TUN;
  const { W, HGT, C } = H.UI_CONST;
  const TS = 32, FY = 20, FH = 372, PY = 392, MARK_S = 2.5, FEED_S = 5;
  const MM = { x: W - 126, y: FY + 4, w: 120, h: 76 };
  const SHOP = { x: W - 300, w: 300, drop: 10 };
  const WARN = '#ff4a3a';
  const fmt = n => H.fmt(Math.round(n));
  const mmss = s => Math.floor(Math.max(0, s) / 60) + ':' + String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0');
  const SLOTS = ['q', 'e', 't', 'r'];
  const SLOT_KEY = { q: 'Q', e: 'E', t: 'T', r: 'R' };
  const SLOT_NAME = { q: 'Навык', e: 'Техника', t: 'Талант', r: 'Абсолютная техника' };
  const MOVE_KEYS = { KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };
  const SUPPLY_IDS = Object.keys(HD.SUPPLIES);
  const FOE_DATA = {};
  const foeData = id => FOE_DATA[id] || (FOE_DATA[id] = Object.assign({ id }, H.ENEMIES[id]));
  const rgba = (elem, a) => 'rgba(' + (G.HD_ELEM_RGB[elem] || G.HD_ELEM_RGB.phys) + ',' + a.toFixed(3) + ')';
  const SFX_GAP = 0.06;
  const MINE_ONLY = new Set(['gold', 'level', 'deny', 'cast', 'herodie', 'respawn', 'buy', 'upgrade', 'sell', 'use', 'up', 'pick']);
  function skull(c, x, y, col) {
    c.fillStyle = col; c.fillRect(x - 2, y - 3, 5, 4); c.fillRect(x - 1, y + 1, 3, 1);
    c.fillStyle = '#05060e'; c.fillRect(x - 1, y - 2, 1, 1); c.fillRect(x + 1, y - 2, 1, 1);
  }
  const POM = {
    open: ['Добро пожаловать в лавку Экспресса!', 'Пом-Пом всё разложил по полочкам.'],
    rich: ['Отличная покупка! Пом-Пом запишет её в журнал.', 'Это стоит недёшево, но Экспресс того стоит.'],
    low: ['Экспресс горит! Пом-Пом просит поторопиться!', 'Скорее, пассажир! Поезд в опасности!']
  };

  function abilName(id, slot) {
    const k = H.CHARS[id];
    if (slot === 'q') return k.skill.name;
    if (slot === 'e') return k.tech.name;
    if (slot === 'r') return k.ult.name;
    return 'Талант';
  }

  Object.assign(H.UI.prototype, {
    hdHeroInfo(id, A, h, lvl) {
      const st = HD.heroStats(id, h ? h.lvl : lvl || 1);
      if (!h) return { id, lvl: lvl || 1, exp: 0, abil: lvl >= 20 ? { q: 5, e: 5, t: 5, r: 3 } : { q: 0, e: 0, t: 0, r: 0 }, picks: {}, dossier: lvl >= 20, items: [], hp: st.hpMax, hpMax: st.hpMax, en: 0, enMax: st.enMax, str: st.str, agi: st.agi, int: st.int, main: st.main, regen: st.regen, enRegen: st.enRegen, dmg: st.dmg, interval: st.bat / (1 + st.agi / 100), armor: st.armor, range: st.range, spd: st.spd, crit: TUN.critC, critD: TUN.critD };
      return { id, lvl: h.lvl, exp: h.exp, abil: h.abil, picks: h.picks, items: h.items, cone: h.cone, hp: h.hp, hpMax: h.hpMax, en: h.en, enMax: h.enMax, str: h.str, agi: h.agi, int: h.int, main: h.main, regen: h.regen + A.sum(h, 'regen'), enRegen: h.enRegen, dmg: A.atkOf(h), interval: A.interval(h), armor: A.armorOf(h), range: h.range, spd: A.moveSpd(h), crit: TUN.critC + A.sum(h, 'crit'), critD: TUN.critD + A.sum(h, 'critD') };
    },

    hdCardLines(info, tab, w) {
      const k = H.CHARS[info.id], d = HD.HEROES[info.id], K = HD.KITS[info.id], out = [];
      const add = (t, o = {}) => { for (const l of this.wrap(t, w, o.size || 10, o.bold)) out.push(Object.assign({ t: l }, o)); };
      const one = v => Math.round(v * 10) / 10;
      if (tab === 0) {
        add('Атрибуты', { bold: true, col: C.gold });
        for (const at of ['str', 'agi', 'int']) add(HD.ATTR_NAME[at] + ' ' + Math.round(info[at]) + (at === info.main ? ' · основной' : ''), { col: at === info.main ? HD.ATTR_COL[at] : C.cream, bold: at === info.main });
        add(' ');
        add('НР ' + fmt(info.hp) + ' / ' + fmt(info.hpMax) + ', восстановление ' + one(info.regen) + ' в с');
        add('Энергия ' + fmt(info.en) + ' / ' + fmt(info.enMax) + ', восстановление ' + one(info.enRegen) + ' в с');
        add('Урон атаки ' + fmt(info.dmg) + ', интервал ' + one(info.interval) + ' с');
        add('Броня ' + one(info.armor) + ' · ' + HD.ARMOR_NAME[d.armor]);
        add('Атака: ' + HD.ATK_NAME[d.atk] + ', ' + (d.melee ? 'ближний' : 'дальний') + ' бой, дальность ' + info.range);
        add('Скорость ' + Math.round(info.spd) + ' · крит ' + Math.round(info.crit * 100) + '%, крит. урон +' + Math.round(info.critD * 100) + '%');
        add('Стихия: ' + H.ELEMENTS[k.elem].name + ' · Путь: ' + H.PATHS[k.path].name);
      } else if (tab === 1) {
        for (const sl of ['q', 'e', 't', 'r']) {
          const l = info.abil[sl], max = sl === 'r' ? 3 : 5, name = sl === 'q' ? k.skill.name : sl === 'e' ? k.tech.name : sl === 'r' ? k.ult.name : 'Талант';
          const cost = sl === 't' ? 0 : sl === 'r' ? k.energy : K[sl].cost, cd = sl === 't' ? 0 : K[sl].cd;
          add(sl.toUpperCase() + ' · ' + name + ' · ур. ' + l + '/' + max, { bold: true, col: C.gold });
          if (cost || cd) add('Энергия ' + cost + ' · перезарядка ' + cd + ' с', { col: C.sub, size: 9 });
          const lk = n => (sl === 'r' ? TUN.ultLvl : TUN.abilLvl)[n - 1];
          add((l ? 'Сейчас: ' : 'На 1-м уровне: ') + K.text[sl](lk(Math.max(1, l))));
          if (l && l < max) add('Дальше: ' + K.text[sl](lk(l + 1)), { col: C.sub });
          add(' ');
        }
      } else {
        for (const [lvl, list, title] of [[10, K.tr, 'След, 10-й уровень'], [20, K.ei, 'Эйдолон, 20-й уровень']]) {
          add(title, { bold: true, col: C.gold });
          const p = info.picks[lvl];
          list.forEach((it, i) => { if (p == null || p === i) { add((p === i ? 'Выбран: ' : '') + it.name, { bold: true, col: p === i ? C.ok : C.cream }); add(it.text, { col: C.sub }); } });
          add(' ');
        }
        if (info.dossier) return out;
        add('Предметы', { bold: true, col: C.gold });
        const its = (info.items || []).filter(Boolean);
        if (!its.length) add('Пусто', { col: C.dim });
        for (const it of its) add(HD.itemName(it) + (it.n > 1 ? ' ×' + it.n : '') + (it.id === 'relic' && it.up ? ' +' + it.up * 3 : ''));
        for (const si of HD.setInfo(info)) if (si.two) add(H.RELIC_SETS[si.set].name + ': ' + HD.RELIC.text2[si.set] + (si.four ? '; ' + HD.RELIC.text4[si.set] : ''), { col: C.ok });
        add(' ');
        add('Конус', { bold: true, col: C.gold });
        if (info.cone) { add(H.CONES[info.cone.id].name + ' · S' + info.cone.sup, { bold: true }); add(HD.coneText(info.cone.id, info.cone.sup), { col: C.sub }); }
        else add('Пусто', { col: C.dim });
      }
      return out;
    },

    drawHdCard(c, info, st, x, y, w, hh, hints) {
      const k = H.CHARS[info.id], tabs = ['Характеристики', 'Способности', info.dossier ? 'Следы и Эйдолоны' : 'Снаряжение'];
      this.win(x, y, w, hh, { title: 'Карточка героя' });
      G.drawPortrait(c, G.lookOf(info.id, this.game), x + 12, y + 16, 48);
      this.text(k.name, x + 68, y + 18, { size: 13, bold: true, col: C.gold });
      this.text(H.PATHS[k.path].name + ' · ' + H.ELEMENTS[k.elem].name, x + 68, y + 35, { size: 10, col: C.sub });
      this.text('Уровень ' + info.lvl + (info.lvl < 20 ? ' · опыт ' + info.exp + '/' + HD.expNext(info.lvl) : ''), x + 68, y + 49, { size: 10, col: C.cream });
      let tx = x + 10;
      tabs.forEach((t, i) => {
        const tw = this.measure(t, 9, true) + 10;
        c.fillStyle = i === st.tab ? '#c9a45c' : '#1a1c34'; c.fillRect(tx, y + 70, tw, 15);
        this.text(t, tx + 5, y + 72, { size: 9, bold: true, col: i === st.tab ? '#1a1208' : C.sub, shadow: false });
        this.hit(tx, y + 70, tw, 15, () => { st.tab = i; st.top = 0; });
        tx += tw + 4;
      });
      const lines = this.hdCardLines(info, st.tab, w - 28), view = Math.floor((hh - 112) / 13);
      st.top = Math.max(0, Math.min(st.top, Math.max(0, lines.length - view)));
      lines.slice(st.top, st.top + view).forEach((l, i) => this.text(l.t, x + 14, y + 92 + i * 13, { size: l.size || 10, bold: l.bold, col: l.col || C.cream }));
      this.wheelZone(x, y, w, hh, d => { st.top = Math.max(0, st.top + d * 3); });
      this.hints(hints || [['Q E', 'Вкладки'], ['↑↓', 'Листать'], ['C', 'Закрыть']], x + 12, y + hh - 18);
    },

    openHdArena(net) {
      const ui = this, g = this.game, A = net ? net.A : g.hdArena(), me = net ? net.seat : 0;
      if (net) A.cmd = c => {
        if (ui.netPaused()) {
          if (c.t !== 'move') s.flashes.push({ kind: 'note', text: 'Партия на паузе', t: 1.2 });
          return;
        }
        if (c.t === 'attack' || c.t === 'target') s.wantSel = { id: c.id, t: 0.8 };
        const seq = lead.nextSeq();
        if (net.send(Object.assign({ seq }, c))) lead.sent(seq, c, performance.now() / 1000);
      };
      else { A.onBreak = () => g.hdBreak(A); A.onWave = () => g.hdSync(A); }
      this.audio.music('battle');
      const h = A.heroes[me], M = A.M, L = G.mapLayer(M), lead = net ? new HD.HeroLead(A, h, () => globalThis.Net98.rtt) : null;
      if (net) net.onAck = seq => lead.landed(seq);
      const s = this.push({
        full: true, hd: true, hdRound: !!net, arena: A, net, me, lead, wantSel: null, echo: 0, slotLit: {}, acc: 0, nums: [], flashes: [], says: [], banner: null, shop: null, move: '0,0', look: null, sfxAt: {}, sfxWin: [], flashT: 0, deadT: 0, marks: [], feed: [], phrases: false, watch: null, signalAt: {},
        cam: { x: h.x - W / 2, y: h.y - FH / 2 },
        tick(dt) {
          if (net) {
            if (!ui.screens.includes(this)) return;
            if (net.A !== A) { ui.netRoute(); return; }
          } else {
            if (ui.top() !== this) return;
            if (!ui.active()) { ui.openHdPause(this); return; }
          }
          this.input();
          if (this.alarm) this.alarm.t -= dt;
          if (net) {
            net.advance(dt, () => this.drain());
            lead.frame(performance.now() / 1000, dt, !ui.netPaused() && !net.catching && globalThis.Net98.state === 'online', net.acc / HD.DT);
            if (this.wantSel && (this.wantSel.t -= dt) <= 0) this.wantSel = null;
            for (const sl of Object.keys(this.slotLit)) this.slotLit[sl] -= dt;
            for (const x of this.marks) x.t -= dt;
            this.marks = this.marks.filter(x => x.t > 0);
            for (const x of this.feed) x.t -= dt;
            this.feed = this.feed.filter(x => x.t > 0);
            if (!h.dead) this.watch = null;
          } else {
            this.acc += dt * (this.speed || 1);
            let n = 0;
            while (this.acc >= HD.DT && n < TUN.maxSteps * (this.speed || 1)) { A.step(); this.acc -= HD.DT; n++; this.drain(); if (A.over) break; }
            if (n >= TUN.maxSteps * (this.speed || 1)) this.acc = Math.min(this.acc, HD.DT);
          }
          for (const x of this.nums) x.t -= dt;
          this.nums = this.nums.filter(x => x.t > 0);
          for (const x of this.flashes) x.t -= dt;
          this.flashes = this.flashes.filter(x => x.t > 0);
          for (const x of this.says) x.t -= dt;
          this.says = this.says.filter(x => x.t > 0);
          if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
          if (this.pom) { this.pom.t -= dt; if (this.pom.t <= 0) this.pom = null; }
          if (this.flashT > 0) this.flashT -= dt;
          this.follow(dt);
          if (A.over) this.finish();
          else if (ui.netStalled && ui.netStalled()) ui.netFinish(true, 'Партия прервана');
        },
        input() {
          if (net && globalThis.Net98.state !== 'online') { this.move = null; return; }
          if (net && ui.netPaused()) return;
          let dx = 0, dy = 0;
          if (!this.shop && ui.top() === this) for (const code of ui.held) { const d = MOVE_KEYS[code]; if (d && !(this.card && (code === 'ArrowUp' || code === 'ArrowDown'))) { dx += d[0]; dy += d[1]; } }
          dx = Math.sign(dx); dy = Math.sign(dy);
          const key = dx + ',' + dy;
          if (key !== this.move) { this.move = key; A.cmd({ t: 'move', dx, dy }); }
        },
        follow(dt) {
          const ally = this.watch != null ? A.heroes[this.watch] : null;
          const t = this.look || ally || { x: (lead ? lead.x : h.x) + (this.shop ? SHOP.w / 2 : this.card ? -150 : 0), y: lead ? lead.y : h.y };
          const tx = Math.max(0, Math.min(M.w * TS - W, t.x - W / 2)), ty = Math.max(0, Math.min(M.h * TS - FH, t.y - FH / 2));
          const k = this.look ? 1 : Math.min(1, dt * 8);
          this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
        },
        sound(id) {
          const now = ui.t, last = this.sfxAt[id] || -1;
          this.sfxWin = this.sfxWin.filter(x => now - x < 0.1);
          if (now - last < SFX_GAP || this.sfxWin.length >= 6) return;
          this.sfxAt[id] = now; this.sfxWin.push(now);
          ui.sfx(id);
        },
        drain() {
          for (const e of A.events) {
            if (e.p != null && e.p !== me && (MINE_ONLY.has(e.t) || (e.t === 'msg' && e.x == null))) continue;
            switch (e.t) {
              case 'num': {
                const col = e.kind === 'heal' ? '#86e39a' : e.kind === 'shield' ? '#80e0ff' : e.kind === 'dot' ? rgba(e.elem, 1) : e.ally ? '#ff8a8a' : e.crit ? '#ffe04a' : '#ffffff';
                const same = this.nums.find(x => x.uid === e.uid && x.kind === e.kind && x.age < 0.25 && !e.crit);
                if (same) { same.v += e.v; break; }
                if (this.nums.length >= TUN.maxNums) this.nums.shift();
                this.nums.push({ x: e.x + ((e.v * 7) % 13) - 6, y: e.y, v: e.v, col, crit: e.crit, kind: e.kind, uid: e.uid, t: 0.9, age: 0 });
                if (e.crit) this.sound('crit'); else if (!e.ally && e.kind === 'dmg') this.sound('hit');
                break;
              }
              case 'gold': if (e.v >= 5) { this.nums.push({ x: e.x, y: e.y - 10, v: e.v, col: '#ffd471', gold: true, raid: e.raid, t: 1.1, age: 0 }); this.sound('coin'); } break;
              case 'say': this.says = this.says.filter(x => x.uid !== e.uid); this.says.push({ uid: e.uid, text: g.fill ? g.fill(e.text) : e.text, t: 3.2 }); break;
              case 'wave': this.banner = { text: 'Волна ' + e.n, sub: e.boss ? 'Босс угрозы' : HD.waveLabel(A, e.n), t: 2.4 }; this.sound('horn'); if (!e.boss) ui.audio.music('battle'); break;
              case 'boss': this.banner = { text: e.name, sub: 'Босс выходит из разлома', t: 3, red: true }; ui.audio.music(e.music); this.sound('rumble'); break;
              case 'cleared': this.banner = { text: 'Волна ' + e.n + ' отбита', sub: e.clean ? 'Чистая линия: +10% золота' : 'Перерыв', t: 2.2 }; break;
              case 'break': this.sound('break'); this.flashes.push({ kind: 'text', x: e.x, y: e.y - 40, text: e.text, col: '#ffffff', t: 1 }); break;
              case 'level': this.banner = { text: 'Уровень ' + e.lvl, sub: h.pts ? 'Очко развития: Shift + Q, E, R или T' : '', t: 2 }; this.flashT = 0.5; this.sound('levelup'); break;
              case 'deny': if (e.slot && this.echo > 0) this.echo--; if (e.why) this.flashes.push({ kind: 'note', text: e.why, t: 1.6 }); this.sound('deny'); break;
              case 'msg': this.flashes.push({ kind: e.x != null ? 'text' : 'note', x: e.x, y: e.y, text: e.text, col: '#ffe0a0', t: 1.6 }); break;
              case 'warn': this.banner = { text: e.text, t: 2.6, red: true, small: true }; break;
              case 'cast': if (this.echo > 0) this.echo--; else this.sound(e.slot === 'r' ? 'ult' : 'swing'); break;
              case 'swing': this.flashes.push({ kind: 'swing', x: e.x, y: e.y, elem: e.elem || 'phys', t: 0.18 }); break;
              case 'fx': this.flashes.push(Object.assign({ t: e.kind === 'ring' ? 0.5 : 0.35, d: e.kind === 'ring' ? 0.5 : 0.35 }, e, { kind: 'fx', fx: e.kind })); break;
              case 'skill': this.flashes.push({ kind: 'text', x: e.x, y: e.y - 50, text: e.name, col: '#ffb0a0', t: 1.2 }); if (e.r) this.flashes.push({ kind: 'fx', fx: 'ring', x: e.x, y: e.y, r: e.r, elem: 'quant', t: 0.3, d: 0.3 }); break;
              case 'vote': this.flashes.push({ kind: 'note', text: 'N: досрочно ' + e.n + '/' + e.of, t: 1.6 }); break;
              case 'herodie': this.sound('lose'); break;
              case 'respawn': this.sound('heal'); break;
              case 'buy': this.sound('confirm'); if (e.cost >= 1000) this.pomSay(POM.rich); break;
              case 'upgrade': this.sound('levelup'); break;
              case 'sell': this.sound('coin'); break;
              case 'use': this.sound('heal'); break;
              case 'up': this.sound('levelup'); break;
              case 'rift': this.sound('rift'); break;
              case 'sfx': if (!e.soft) this.sound(e.id); break;
              case 'struck': { const base = e.uid === A.base.uid; if (base || !this.alarm || this.alarm.t <= 0) this.alarm = { t: TUN.alarmT, x: e.sx, y: e.sy, base }; if (base) this.sound('alarm'); break; }
              case 'tshot': { const t = A.units.find(x => x.uid === e.uid); if (t) t.fireT = 0.12; this.sound('turret'); break; }
            }
          }
          A.events.length = 0;
          for (const x of this.nums) x.age += HD.DT;
        },
        signal(m) {
          if (m.op === 'mark') {
            this.marks = this.marks.filter(x => x.p !== m.p);
            this.marks.push({ p: m.p, x: m.x, y: m.y, id: m.id, t: MARK_S });
            this.sound('glint');
            return;
          }
          const text = ui.netPhrase(m.id), hero = A.heroes[m.p];
          if (!text || !hero) return;
          this.says = this.says.filter(x => x.uid !== hero.uid);
          this.says.push({ uid: hero.uid, text, t: 3.2 });
          if (m.p !== me) this.feed = this.feed.concat({ p: m.p, text, t: FEED_S }).slice(-3);
          this.sound('msg_in');
        },
        signalReady(kind) {
          if (performance.now() - (this.signalAt[kind] || -Infinity) < 1000) { ui.sfx('deny'); return false; }
          this.signalAt[kind] = performance.now();
          return true;
        },
        sayPhrase(id) {
          this.phrases = false;
          if (this.signalReady('say')) globalThis.Net98.send('say', { id });
        },
        markHere() {
          const m = ui.mouse, fresh = !!m && ui.t - m.t <= TUN.aimFresh && m.y >= FY && m.y <= FY + FH, f = fresh ? this.foeAt(m) : h.sel != null ? A.byId(h.sel) : null, at = f || (fresh ? this.world(m) : lead || h);
          if (!this.signalReady('mark')) return;
          globalThis.Net98.send('mark', Object.assign({ x: Math.round(at.x), y: Math.round(at.y) }, f ? { id: f.uid } : {}));
        },
        watchAlly(p) {
          if (!h.dead) { ui.sfx('deny'); return; }
          this.watch = this.watch === p ? null : p;
          ui.sfx('select');
        },
        finish() {
          if (net) { ui.netFinish(false); return; }
          const sum = g.hdFinish(A);
          ui.screens.splice(ui.screens.indexOf(this), 1);
          ui.openHdResult(sum);
        },
        world(p) { return { x: p.x + this.cam.x, y: p.y - FY + this.cam.y }; },
        foeAt(p) {
          const w = this.world(p);
          let best = null, bd = 18;
          for (const u of A.units) { if (u.dead || u.side !== 'foe') continue; const d = Math.hypot(u.x - w.x, u.y - (u.kind === 'boss' ? 30 : 12) - w.y) - u.r; if (d < bd) { bd = d; best = u; } }
          return best;
        },
        aim() {
          const m = ui.mouse, mode = g.hd().opts.aim || 'auto';
          if (mode === 'target' || !m || (mode === 'auto' && ui.t - m.t > TUN.aimFresh) || m.y < FY || m.y > FY + FH || (this.shop && m.x >= SHOP.x)) return {};
          const f = this.foeAt(m), w = this.world(m);
          return f ? { id: f.uid, x: f.x, y: f.y } : { x: w.x, y: w.y };
        },
        cast(slot) {
          if (net && !ui.netPaused() && h.abil[slot] && !h.dead && !A.stunned(h) && A.cdLeft(h, slot) <= 1e-9 && A.costOf(h, slot) <= h.en) {
            this.sound(slot === 'r' ? 'ult' : 'swing');
            this.echo++;
            this.slotLit[slot] = 0.25;
          }
          A.cmd(Object.assign({ t: 'cast', slot }, this.aim()));
        },
        cycle() {
          const list = A.foes().filter(f => Math.hypot(f.x - h.x, f.y - h.y) < 420).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y));
          if (!list.length) return;
          const i = list.findIndex(f => f.uid === h.sel);
          A.cmd({ t: 'target', id: list[(i + 1) % list.length].uid });
          ui.sfx('select');
        },
        toggleShop() {
          if (this.shop) { this.shop = null; ui.sfx('cancel'); return; }
          if (!A.nearShop(lead || h) || h.dead) { this.flashes.push({ kind: 'note', text: 'Лавка на площади. F: возврат', t: 1.8 }); ui.sfx('deny'); return; }
          this.shop = { sel: 0, slot: -1, tab: 0 };
          this.pomSay(A.base.hp < A.base.hpMax * 0.35 ? POM.low : POM.open);
          A.cmd({ t: 'move', dx: 0, dy: 0 }); this.move = '0,0';
          ui.sfx('confirm');
        },
        pomSay(list) { this.pom = { text: list[(this.pomN = (this.pomN || 0) + 1) % list.length], t: 3 }; },
        nearDeadTurret() { return A.turrets.find(t => t.dead && Math.hypot(t.x - h.x, t.y - h.y) <= 96); },
        key(k, code) {
          const shift = ui.held.includes('ShiftLeft') || ui.held.includes('ShiftRight');
          if (net && code === 'KeyP') { ui.netPauseToggle(); return; }
          if (net && this.phrases) {
            if (/^Digit[1-6]$/.test(code)) { this.sayPhrase(+code.slice(5) - 1); return; }
            if (code === 'KeyV' || k === 'back') { this.phrases = false; ui.sfx('cancel'); return; }
          }
          if (net && code === 'KeyV') { this.phrases = true; ui.sfx('select'); return; }
          if (net && code === 'KeyG') { this.markHere(); return; }
          if (this.shop) {
            const sh = this.shop, rows = this.shopRows(sh.tab);
            if (code === 'KeyB' || k === 'back') { this.toggleShop(); return; }
            if (k === 'up' || k === 'down') { const n = rows.length; sh.sel = (sh.sel + (k === 'up' ? n - 1 : 1)) % n; ui.sfx('select'); return; }
            if (k === 'left' || k === 'right' || code === 'KeyQ' || code === 'KeyE') { sh.tab = (sh.tab + (k === 'left' || code === 'KeyQ' ? 3 : 1)) % 4; sh.sel = 0; ui.sfx('select'); return; }
            if (code === 'Enter' || code === 'NumpadEnter') { if (rows[sh.sel]) this.shopBuy(rows[sh.sel]); return; }
            if (code === 'KeyU') { if (sh.tab === 1 && h.cone) A.cmd({ t: 'upgrade', i: 'cone' }); else if (sh.slot >= 0) A.cmd({ t: 'upgrade', i: sh.slot }); else ui.sfx('deny'); return; }
            if (/^Digit[1-6]$/.test(code)) { sh.slot = +code.slice(5) - 1; ui.sfx('select'); return; }
            if (code === 'Delete' && sh.slot >= 0) { A.cmd({ t: 'sell', i: sh.slot }); return; }
            return;
          }
          if (this.card) {
            if (code === 'KeyC' || k === 'back') { this.card = null; ui.sfx('cancel'); return; }
            if ((code === 'KeyQ' || code === 'KeyE') && !shift) { this.card.tab = (this.card.tab + (code === 'KeyQ' ? 2 : 1)) % 3; this.card.top = 0; ui.sfx('select'); return; }
            if (code === 'ArrowUp' || code === 'ArrowDown') { this.card.top = Math.max(0, this.card.top + (code === 'ArrowUp' ? -3 : 3)); return; }
          }
          if (k === 'back') { ui.openHdPause(this); return; }
          if (code === 'KeyC') { this.card = { tab: 0, top: 0 }; this.shop = null; ui.sfx('select'); return; }
          if (shift && (code === 'Digit1' || code === 'Digit2') && A.needPick(h)) { A.cmd({ t: 'pick', i: +code.slice(5) - 1 }); return; }
          if (code === 'KeyQ' || code === 'KeyE' || code === 'KeyR') { const sl = code[3].toLowerCase(); if (shift) A.cmd({ t: 'up', slot: sl }); else this.cast(sl); return; }
          if (code === 'KeyT' && shift) { A.cmd({ t: 'up', slot: 't' }); return; }
          if (/^Digit[1-6]$/.test(code) && !shift) { A.cmd(Object.assign({ t: 'use', i: +code.slice(5) - 1 }, this.aim())); return; }
          if (code === 'Space') { this.cycle(); return; }
          if (code === 'KeyX') { A.cmd({ t: 'hold' }); this.flashes.push({ kind: 'note', text: h.hold ? 'Герой снова преследует врагов' : 'Герой стоит на месте', t: 1.4 }); return; }
          if (code === 'KeyB') { this.toggleShop(); return; }
          if (code === 'KeyF') { A.cmd({ t: 'recall' }); return; }
          if (code === 'KeyN') { A.cmd({ t: 'early' }); return; }
          if (code === 'Enter' || code === 'NumpadEnter') {
            if (h.dead) { A.cmd({ t: 'buyback' }); return; }
            const t = this.nearDeadTurret();
            if (t) A.cmd({ t: 'restore', i: t.idx });
          }
        },
        click(btn, p) {
          const f = this.foeAt(p), w = this.world(p), S = M.shop, tap = !!ui.touchTap;
          if (btn !== 2) {
            if (Math.hypot(w.x - (S[0] * TS), w.y - (S[1] * TS)) < 30 && (!tap || A.nearShop(lead || h))) { this.toggleShop(); return; }
            const t = A.turrets.find(x => x.dead && Math.hypot(w.x - x.x, w.y - x.y) < 20);
            if (t) { A.cmd({ t: 'restore', i: t.idx }); return; }
          }
          if (btn === 2 || tap) { if (f) A.cmd({ t: 'attack', id: f.uid }); else A.cmd({ t: 'goto', x: w.x, y: w.y }); this.flashes.push({ kind: 'mark', x: w.x, y: w.y, t: 0.4 }); return; }
          A.cmd({ t: 'target', id: f ? f.uid : null });
        },
        draw(c) {
          const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y), a = Math.min(1, (net || this).acc / HD.DT);
          const P = u => (lead && u === h ? { x: lead.x - cx, y: lead.y - cy } : { x: u.px + (u.x - u.px) * a - cx, y: u.py + (u.y - u.py) * a - cy });
          c.save();
          c.beginPath(); c.rect(0, FY, W, FH); c.clip();
          c.translate(0, FY);
          G.drawMap(c, M, cx, cy, ui.t, W, FH);
          this.drawAreas(c, cx, cy, false);
          const rth = A.threats[A.wave >= TUN.lateFrom && A.threats[1] ? 1 : 0];
          for (const k of Object.keys(M.rifts)) { const r = A.rift(k); G.hdRift(c, r.x - cx, r.y - cy, ui.t, A.glow[k], rth); }
          const draws = [];
          for (const sp of L.sprites || []) {
            const sx = sp.x * TS - cx, sy = sp.y * TS - cy;
            if (sx > W + 32 || sy > FH + 64 || sx + sp.w * TS < -32 || sy + sp.h * TS < -64) continue;
            draws.push({ y: (sp.sort + 1) * TS, fn: () => H.Train.drawSprite(c, sp, sx, sy, ui.t) });
          }
          const S = M.shop;
          draws.push({ y: S[1] * TS - 8, fn: () => G.drawSprite(c, G.lookOf('pompom', g), 'down', 0, S[0] * TS - cx - 16, S[1] * TS - cy - 42) });
          for (const u of A.units) {
            if (u.dead && u.kind !== 'turret') continue;
            if (u.kind === 'base') continue;
            const p = P(u);
            if (p.x < -80 || p.y < -120 || p.x > W + 80 || p.y > FH + 60) continue;
            draws.push({ y: u.y, fn: () => this.drawUnit(c, u, p) });
          }
          draws.sort((x, y) => x.y - y.y);
          for (const d of draws) d.fn();
          for (const sh of A.shots) G.hdShot(c, sh.x - cx, sh.y - cy, sh.ang, sh.elem, sh.kind);
          this.drawAreas(c, cx, cy, true);
          this.drawFlashes(c, cx, cy);
          if (net) ui.drawHdMarks(c, this, cx, cy);
          if (L.deco) H.Train.drawFx(c, L, M, cx, cy, ui.t, W, FH, () => true);
          for (const u of A.units) if (!u.dead && u.kind !== 'base') this.drawBars(c, u, P(u));
          const selId = this.wantSel ? this.wantSel.id : h.sel, sel = selId != null ? A.byId(selId) : null;
          if (sel) { const p = P(sel); c.strokeStyle = '#ffe04a'; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y + 2, sel.r + 6, (sel.r + 6) * 0.45, 0, 0, Math.PI * 2); c.stroke(); }
          if (this.dbgFlow) this.drawFlow(c, cx, cy);
          this.drawNums(c, cx, cy);
          this.drawSays(c, P);
          if (this.pom) {
            const S2 = M.shop;
            this.bubble(c, this.pom.text, S2[0] * TS - cx, Math.max(2, S2[1] * TS - cy - 90));
          }
          if (h.dead) { c.fillStyle = 'rgba(30,30,40,0.55)'; c.fillRect(0, 0, W, FH); }
          c.restore();
          ui.hit(0, FY, W, FH, (btn, p) => this.click(btn, p));
          this.drawBoss(c);
          this.drawTop(c);
          this.drawAlarm(c);
          this.drawMini(c);
          if (net) ui.drawHdAllies(c, this);
          this.drawPanel(c);
          if (h.dead) this.drawDead(c);
          if (this.banner) this.drawBanner(c);
          this.drawNotes(c);
          if (A.needPick(h) && !this.card) this.drawPick(c);
          if (net && this.phrases) ui.drawHdPhrases(c, this, PY - (A.needPick(h) && !this.card ? 98 : 28));
          if (this.shop) this.drawShop(c);
          if (this.card) ui.drawHdCard(c, ui.hdHeroInfo(h.key, A, h), this.card, 0, FY, 300, FH);
          if (ui.held.includes('Tab')) this.drawBigMap(c);
          if (this.flashT > 0) { c.fillStyle = 'rgba(255,240,180,' + (this.flashT * 0.4).toFixed(3) + ')'; c.fillRect(0, FY, W, FH); }
          if (net) ui.drawHdNet(c, net, A);
        },
        drawUnit(c, u, p) {
          if (u.kind === 'turret') {
            const t = u.tgt != null ? A.byId(u.tgt) : null;
            if (u.fireT > 0) u.fireT -= 1 / 60;
            G.hdTurret(c, p.x, p.y + 4, ui.t, u.dead, t ? Math.atan2(t.y - u.y, t.x - u.x) : -Math.PI / 2, u.fireT);
            if (u.dead && !h.dead && Math.hypot(u.x - h.x, u.y - h.y) <= 160) {
              const cost = A.restoreCost(), txt = A.phase === 'break' ? 'Enter: восстановить за ' + fmt(cost) : 'Восстановить можно в перерыве', bw = ui.measure(txt, 9, true) + 10;
              c.fillStyle = 'rgba(6,8,20,0.85)'; c.fillRect(p.x - bw / 2, p.y - 56, bw, 14);
              ui.text(txt, p.x, p.y - 54, { align: 'center', size: 9, bold: true, col: A.phase === 'break' && h.gold >= cost ? '#ffd471' : C.sub });
              ui.hit(p.x - 18, p.y - 24, 36, 34, () => A.cmd({ t: 'restore', i: u.idx }));
            }
            return;
          }
          c.fillStyle = 'rgba(2,4,12,0.4)'; c.beginPath(); c.ellipse(p.x, p.y + 2, u.r + 2, (u.r + 2) * 0.4, 0, 0, Math.PI * 2); c.fill();
          if (u.kind === 'hero') {
            const own = lead && u === h, frame = (own ? lead.moving : u.moving) ? Math.floor(ui.t * 8) % 4 : 0, inv = A.has(u, 'invis');
            if (u.recall > 0) { c.strokeStyle = 'rgba(128,224,255,0.8)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y - 16, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - u.recall / TUN.recallT)); c.stroke(); }
            if (net) { c.strokeStyle = ui.netSeatCol(u.pl); c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y + 2, u.r + 5, (u.r + 5) * 0.45, 0, 0, Math.PI * 2); c.stroke(); }
            if (inv) c.globalAlpha = 0.45;
            G.drawSprite(c, G.lookOf(u.key, g), own ? lead.dir : u.dir, frame, p.x - 16, p.y - 34);
            c.globalAlpha = 1;
            if (net && u.pl !== me) ui.text(net.names[u.pl] + (ui.netOffline(u.pl) ? ' · нет связи' : ''), p.x, p.y - 66, { align: 'center', size: 9, bold: true, col: ui.netSeatCol(u.pl) });
            if (u.hold) { c.fillStyle = '#ffd471'; c.fillRect(p.x - 2, p.y - 46, 4, 4); }
            this.drawSummons(c, u, p);
            return;
          }
          const size = u.kind === 'boss' ? 96 : u.elite ? 64 : u.pig ? 40 : 48;
          if (u.elite || u.kind === 'boss') { c.strokeStyle = 'rgba(255,196,72,' + (0.5 + 0.3 * Math.sin(ui.t * 4 + u.uid)).toFixed(3) + ')'; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y + 2, u.r + 5, (u.r + 5) * 0.4, 0, 0, Math.PI * 2); c.stroke(); }
          const flip = u.vx < -0.1, bob = u.moving ? -Math.abs(Math.sin(ui.t * 8 + u.uid)) * 2 : 0;
          c.save();
          c.translate(Math.round(p.x), 0);
          if (flip) c.scale(-1, 1);
          G.drawEnemy(c, foeData(u.key), 0, p.y + 4 + bob, size, { t: ui.t + u.uid * 0.3, flash: u.brokenT > TUN.toughBack - 0.25 ? 0.6 : 0 });
          c.restore();
          if (A.stunned(u)) for (let i = 0; i < 3; i++) { const an = ui.t * 4 + i * 2.1; c.fillStyle = '#ffe04a'; c.fillRect(Math.round(p.x + Math.cos(an) * 10), Math.round(p.y - size * 0.8 + Math.sin(an) * 3), 2, 2); }
        },
        drawBars(c, u, p) {
          if (u.kind === 'hero') {
            const y = p.y - 52;
            c.fillStyle = '#000000'; c.fillRect(p.x - 16, y - 1, 32, 6);
            c.fillStyle = '#86e39a'; c.fillRect(p.x - 15, y, Math.round(30 * u.hp / u.hpMax), 2);
            c.fillStyle = '#f2b632'; c.fillRect(p.x - 15, y + 3, Math.round(30 * u.en / u.enMax), 1);
            return;
          }
          if (u.kind === 'turret') {
            if (u.hp >= u.hpMax) return;
            c.fillStyle = '#000000'; c.fillRect(p.x - 15, p.y - 34, 30, 4);
            c.fillStyle = '#80e0ff'; c.fillRect(p.x - 14, p.y - 33, Math.round(28 * u.hp / u.hpMax), 2);
            return;
          }
          if (u.kind === 'boss') return;
          const show = u.elite || u.hp < u.hpMax || (u.toughMax && u.tough < u.toughMax);
          if (!show) return;
          const size = u.elite ? 64 : u.pig ? 40 : 48, w = u.elite ? 36 : 26, y = p.y - size * 0.85;
          c.fillStyle = '#000000'; c.fillRect(p.x - w / 2 - 1, y - 1, w + 2, u.toughMax ? 6 : 4);
          c.fillStyle = '#ff5a4a'; c.fillRect(p.x - w / 2, y, Math.round(w * Math.max(0, u.hp) / u.hpMax), 2);
          if (u.toughMax) { c.fillStyle = u.brokenT > 0 ? '#5a5a6a' : '#f4f4f8'; c.fillRect(p.x - w / 2, y + 3, Math.round(w * (u.brokenT > 0 ? 1 - u.brokenT / TUN.toughBack : u.tough / u.toughMax)), 1); }
        },
        drawAreas(c, cx, cy, over) {
          for (const ar of A.areas) {
            const warn = !!ar.warn;
            if (over !== !!(warn && ar.mark)) continue;
            const x = ar.x - cx, y = ar.y - cy;
            const pulse = 0.5 + 0.5 * Math.sin(ui.t * 10);
            const fill = warn ? 'rgba(255,74,58,' + (0.12 + 0.12 * pulse).toFixed(3) + ')' : rgba(ar.elem || 'heal', 0.07);
            const line = warn ? 'rgba(255,74,58,0.9)' : rgba(ar.elem || 'heal', 0.45);
            c.fillStyle = fill; c.strokeStyle = line; c.lineWidth = warn ? 2 : 1;
            c.beginPath();
            if (ar.shape === 'cone') { c.moveTo(x, y); c.arc(x, y, ar.r, ar.ang - ar.arc / 2, ar.ang + ar.arc / 2); c.closePath(); }
            else if (ar.shape === 'line') { const co = Math.cos(ar.ang), si = Math.sin(ar.ang), hw = ar.w / 2; c.moveTo(x - si * hw, y + co * hw); c.lineTo(x + co * ar.len - si * hw, y + si * ar.len + co * hw); c.lineTo(x + co * ar.len + si * hw, y + si * ar.len - co * hw); c.lineTo(x + si * hw, y - co * hw); c.closePath(); }
            else c.arc(x, y, ar.r, 0, Math.PI * 2);
            c.fill(); c.stroke();
            if (!warn) G.hdAreaFx(c, ar, x, y, ui.t);
            if (warn && ar.big) { c.strokeStyle = 'rgba(255,74,58,' + (0.4 + 0.5 * pulse).toFixed(3) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, ar.r - 3, 0, Math.PI * 2); c.stroke(); }
            if (warn && ar.delay > 0 && !ar.mark) {
              const k = Math.max(0, Math.min(1, ar.delay / Math.max(0.01, ar.age + ar.delay)));
              c.fillStyle = 'rgba(255,74,58,0.25)'; c.beginPath();
              if (ar.shape === 'cone') { c.moveTo(x, y); c.arc(x, y, ar.r * (1 - k), ar.ang - ar.arc / 2, ar.ang + ar.arc / 2); c.closePath(); } else c.arc(x, y, ar.r * (1 - k), 0, Math.PI * 2);
              c.fill();
            }
          }
        },
        drawFlashes(c, cx, cy) {
          for (const f of this.flashes) {
            if (f.kind === 'swing') { c.strokeStyle = rgba(f.elem, f.t / 0.18); c.lineWidth = 2; c.beginPath(); c.arc(f.x - cx, f.y - cy - 12, 12, 0, Math.PI * 1.2); c.stroke(); }
            else if (f.kind === 'mark') { c.strokeStyle = 'rgba(134,227,154,' + (f.t / 0.4).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); c.ellipse(f.x - cx, f.y - cy, 10 * (1.4 - f.t), 4 * (1.4 - f.t), 0, 0, Math.PI * 2); c.stroke(); }
            else if (f.kind === 'text' && f.x != null) ui.text(f.text, f.x - cx, f.y - cy - (1.6 - f.t) * 10, { align: 'center', size: 10, bold: true, col: f.col });
            else if (f.kind === 'fx') {
              const k = 1 - f.t / f.d, x = f.x - cx, y = f.y - cy;
              c.strokeStyle = rgba(f.elem, 1 - k); c.fillStyle = rgba(f.elem, 0.3 * (1 - k)); c.lineWidth = 3;
              c.beginPath();
              if (f.fx === 'arc') { c.moveTo(x, y); c.arc(x, y, f.r, f.ang - f.arc / 2, f.ang + f.arc / 2); c.closePath(); c.fill(); }
              else if (f.fx === 'ring') { c.arc(x, y, f.r * (0.3 + 0.7 * k), 0, Math.PI * 2); c.stroke(); }
              else if (f.fx === 'boom') { c.arc(x, y, f.r * (0.5 + 0.5 * k), 0, Math.PI * 2); c.fill(); c.stroke(); }
              else if (f.fx === 'throw') { c.moveTo(x, y - 14); c.lineTo(x + (f.tx - f.x) * k, y - 14 + (f.ty - f.y) * k); c.stroke(); }
              else if (f.fx === 'slash') { c.moveTo(x - 18, y - 30); c.lineTo(x + 18, y + (f.big ? 10 : 0)); c.stroke(); }
              else if (f.fx === 'line') { const co = Math.cos(f.ang), si = Math.sin(f.ang), hw = f.w / 2, l = f.len * Math.min(1, k * 3); c.moveTo(x - si * hw, y + co * hw); c.lineTo(x + co * l - si * hw, y + si * l + co * hw); c.lineTo(x + co * l + si * hw, y + si * l - co * hw); c.lineTo(x + si * hw, y - co * hw); c.closePath(); c.fill(); c.stroke(); }
              else if (f.fx === 'svarog') { c.globalAlpha = 1 - k; G.drawEnemy(c, foeData('svarog_hand'), x, y + 6, 44, { t: ui.t, aura: false }); c.globalAlpha = 1; c.beginPath(); c.arc(x, y, f.r * (0.4 + 0.6 * k), 0, Math.PI * 2); c.stroke(); }
              else if (f.fx === 'numby' || f.fx === 'doll') { c.arc(x, y - 10, f.r * (0.4 + 0.6 * k), 0, Math.PI * 2); c.stroke(); }
              else if (f.fx === 'bolt') { c.moveTo(x, y - 120); c.lineTo(x - 6, y - 60); c.lineTo(x + 5, y - 50); c.lineTo(x, y - 8); c.stroke(); c.beginPath(); c.arc(x, y, f.r * k, 0, Math.PI * 2); c.stroke(); }
            }
          }
        },
        drawNums(c, cx, cy) {
          for (const n of this.nums) {
            const k = 1 - n.t / (n.gold ? 1.1 : 0.9), x = n.x - cx, y = n.y - cy - k * 18;
            c.globalAlpha = Math.min(1, n.t * 3);
            if (n.gold) ui.text('+' + fmt(n.v) + (n.raid ? ' · Вылазка' : ''), x, y, { align: 'center', size: 10, bold: true, col: n.col });
            else ui.text(fmt(n.v) + (n.crit ? '!' : ''), x, y, { align: 'center', size: n.crit ? 13 : 10, bold: n.crit, col: n.col });
            c.globalAlpha = 1;
          }
        },
        drawSays(c, P) {
          for (const sy of this.says) {
            const u = A.units.find(x => x.uid === sy.uid);
            if (!u) continue;
            const p = P(u);
            this.bubble(c, sy.text, p.x, Math.max(2, p.y - 78));
          }
        },
        drawFlow(c, cx, cy) {
          const Gd = A.G, w = Gd.w;
          for (let ty = Math.max(0, Math.floor(cy / TS)); ty < Math.min(Gd.h, Math.ceil((cy + FH) / TS)); ty++) for (let tx = Math.max(0, Math.floor(cx / TS)); tx < Math.min(w, Math.ceil((cx + W) / TS)); tx++) {
            const f = Gd.flow[ty * w + tx];
            if (!isFinite(f)) continue;
            let best = null, bd = f;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { if (!Gd.step(tx, ty, dx, dy)) continue; const n = Gd.flow[(ty + dy) * w + tx + dx]; if (n < bd) { bd = n; best = [dx, dy]; } }
            const x = tx * TS + 16 - cx, y = ty * TS + 16 - cy;
            ui.text(String(Math.round(f)), x, y - 12, { align: 'center', size: 8, col: 'rgba(160,200,255,0.55)', shadow: false });
            if (best) { c.strokeStyle = 'rgba(120,200,255,0.6)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + best[0] * 10, y + best[1] * 10); c.stroke(); }
          }
          for (const u of A.foes()) { const p = { x: u.x - cx, y: u.y - cy }; c.strokeStyle = 'rgba(255,90,74,0.4)'; c.beginPath(); c.arc(p.x, p.y, TUN.aggroR, 0, Math.PI * 2); c.stroke(); const t = u.tgt != null ? A.byId(u.tgt) : null; if (t) { c.strokeStyle = 'rgba(255,212,113,0.7)'; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(t.x - cx, t.y - cy); c.stroke(); } }
        },
        bubble(c, text, ax, by) {
          const w = Math.min(260, ui.measure(text, 10) + 12), bx = Math.max(4, Math.min(W - w - 4, ax - w / 2)), tx = Math.max(bx + 6, Math.min(bx + w - 6, ax));
          c.fillStyle = 'rgba(250,246,236,0.94)'; c.fillRect(bx, by, w, 15);
          c.strokeStyle = 'rgba(60,44,30,0.85)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, w - 1, 14);
          c.fillStyle = 'rgba(250,246,236,0.94)'; c.beginPath(); c.moveTo(tx - 4, by + 15); c.lineTo(tx + 4, by + 15); c.lineTo(tx, by + 20); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(60,44,30,0.85)'; c.beginPath(); c.moveTo(tx - 4, by + 15); c.lineTo(tx, by + 20); c.lineTo(tx + 4, by + 15); c.stroke();
          ui.text(ui.clip(text, w - 8, 10), bx + w / 2, by + 2, { align: 'center', size: 10, col: '#3a2a1e', shadow: false });
        },
        drawAlarm(c) {
          const al = this.alarm;
          if (!al || al.t <= 0) return;
          const sx = al.x - this.cam.x, sy = al.y - this.cam.y + FY;
          if (sx >= 0 && sx <= W && sy >= FY && sy <= FY + FH) return;
          const cx = W / 2, cy = FY + FH / 2, ang = Math.atan2(sy - cy, sx - cx);
          const kx = (W / 2 - 18) / Math.max(1e-6, Math.abs(Math.cos(ang))), ky = (FH / 2 - 18) / Math.max(1e-6, Math.abs(Math.sin(ang))), r = Math.min(kx, ky);
          const ax = cx + Math.cos(ang) * r, ay = cy + Math.sin(ang) * r, a = 0.6 + 0.4 * Math.sin(ui.t * 14);
          c.save(); c.translate(ax, ay); c.rotate(ang);
          c.fillStyle = 'rgba(255,74,58,' + a.toFixed(3) + ')';
          c.beginPath(); c.moveTo(14, 0); c.lineTo(-8, -10); c.lineTo(-3, 0); c.lineTo(-8, 10); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(255,240,230,0.9)'; c.lineWidth = 1; c.stroke();
          c.restore();
        },
        drawBoss(c) {
          const b = A.units.find(u => !u.dead && u.kind === 'boss');
          if (!b) return;
          const x = net ? 128 : 110, w = net ? 372 : 390, y = FY + 6;
          c.fillStyle = 'rgba(10,4,16,0.82)'; c.fillRect(x - 4, y - 2, w + 8, 26);
          ui.text(ui.clip(H.ENEMIES[b.key].name + (b.phase === 2 ? ' · фаза 2' : ''), w - 110, 11, true), x, y, { size: 11, bold: true, col: '#ffb0a0' });
          ui.text(fmt(b.hp) + ' / ' + fmt(b.hpMax), x + w, y, { align: 'right', size: 10, col: C.cream });
          ui.bar(x, y + 14, w, 5, b.hp / b.hpMax, '#d83a3a');
          c.fillStyle = b.brokenT > 0 ? '#5a5a6a' : '#f4f4f8'; c.fillRect(x, y + 20, Math.round(w * (b.brokenT > 0 ? 1 - b.brokenT / TUN.toughBack : b.tough / b.toughMax)), 2);
          if (b.act && b.act.ult) { ui.text(ui.clip('Подготовка: ' + b.act.name, 300, 10, true), x + w / 2, y + 26, { align: 'center', size: 10, bold: true, col: WARN }); ui.bar(x + w / 2 - 60, y + 40, 120, 3, 1 - b.act.t / (b.act.tt || 4), WARN); }
        },
        drawTop(c) {
          c.fillStyle = '#05060e'; c.fillRect(0, 0, W, FY);
          c.fillStyle = '#3a3020'; c.fillRect(0, FY - 1, W, 1);
          const n = HD.WAVES.length;
          for (let i = 0; i < n; i++) {
            const x = 9 + i * 6 + (i >= 10 ? 4 : 0), cur = i + 1 === A.wave, done = i + 1 < A.wave, boss = HD.WAVES[i].boss;
            c.fillStyle = done ? '#c9a45c' : cur ? (A.phase === 'wave' ? '#ff9a5a' : '#f2dc9a') : '#22243a';
            c.fillRect(x - 2, 7, 5, 5);
            if (boss) skull(c, x + 0.5, 9.5, cur ? '#ffffff' : '#ff5a4a');
          }
          ui.text(ui.clip('Волна ' + A.wave + '/' + n + ' · ' + HD.waveLabel(A, A.wave), 190, 10, true), 136, 4, { size: 10, bold: true, col: C.gold });
          if (A.phase === 'break') {
            ui.text('Перерыв ' + mmss(A.breakT), 330, 4, { size: 10, bold: true, col: C.cream });
            const votes = net ? A.earlyVotes() : null, early = 'N: досрочно' + (votes ? ' ' + votes.n + '/' + votes.of : ''), bw = ui.measure(early, 9, true) + 10, ex = net ? 398 : 410;
            c.fillStyle = '#2a3478'; c.fillRect(ex, 3, bw, 14);
            ui.text(early, ex + 5, 5, { size: 9, bold: true, col: '#ffe0a0' });
            ui.hit(ex, 3, bw, 14, () => A.cmd({ t: 'early' }));
          } else ui.text('Врагов ' + A.foes().length, 330, 4, { size: 10, bold: true, col: '#ffb0a0' });
          const blink = this.alarm && this.alarm.t > 0 && this.alarm.base && Math.sin(ui.t * 18) > 0;
          if (blink) { c.fillStyle = 'rgba(255,74,58,0.35)'; c.fillRect(484, 1, 132, FY - 3); }
          ui.text('Экспресс', 488, 4, { size: 10, col: blink ? '#ffffff' : C.sub });
          ui.bar(540, 7, net ? 46 : 70, 6, A.base.hp / A.base.hpMax, A.base.hp < A.base.hpMax * 0.35 ? '#ff5a4a' : '#80e0ff');
          if (net) {
            ui.netBars(c, 593, 16);
            const ping = ui.netPingText();
            if (ping) ui.text(ping, MM.x + MM.w, MM.y + MM.h + 3, { align: 'right', size: 9, bold: true, col: globalThis.Net98.state === 'online' ? C.cream : '#ff9a8a' });
          }
          c.fillStyle = '#c8c4b8'; c.fillRect(620, 4, 4, 12); c.fillRect(628, 4, 4, 12);
          ui.hit(614, 0, 26, FY, () => ui.openHdPause(this));
        },
        drawMini(c) {
          const { x, y, w, h: hh } = MM, kx = w / (M.w * TS), ky = hh / (M.h * TS);
          if (!this.mini) {
            const cv = G.mkCanvas(w, hh), g2 = cv.getContext('2d');
            g2.fillStyle = '#04060c'; g2.fillRect(0, 0, w, hh);
            for (let ty = 0; ty < M.h; ty++) for (let tx = 0; tx < M.w; tx++) {
              const ch = M.tiles[ty][tx], tile = H.TILES[ch];
              if (!tile || (tile.solid && ch !== 'X' && ch !== 'C' && ch !== 'B' && ch !== 'S' && ch !== 'L')) continue;
              g2.fillStyle = ch === ':' ? '#3a4458' : ch === 'X' ? '#5a4a2a' : '#262e40';
              g2.fillRect(tx * 2, ty * 2, 2, 2);
            }
            this.mini = cv;
          }
          c.fillStyle = '#000000'; c.fillRect(x - 2, y - 2, w + 4, hh + 4);
          c.drawImage(this.mini, x, y);
          c.strokeStyle = '#c9a45c'; c.lineWidth = 1; c.strokeRect(x - 1.5, y - 1.5, w + 3, hh + 3);
          const B = A.base.rect;
          c.fillStyle = A.base.hp < A.base.hpMax * 0.35 && Math.sin(ui.t * 8) > 0 ? '#ff5a4a' : '#ffd471'; c.fillRect(x + B.x0 * kx, y + B.y0 * ky, (B.x1 - B.x0) * kx, (B.y1 - B.y0) * ky);
          for (const k of Object.keys(M.rifts)) { const r = A.rift(k); c.fillStyle = A.glow[k] > 0 && Math.sin(ui.t * 14) > 0 ? '#ff4a3a' : '#b050ff'; c.fillRect(x + r.x * kx - 2, y + r.y * ky - 2, 4, 4); }
          for (const t of A.turrets) { c.fillStyle = t.dead ? '#4a4e58' : '#56d4ff'; c.fillRect(x + t.x * kx - 1.5, y + t.y * ky - 1.5, 3, 3); }
          for (const u of A.units) {
            if (u.dead || u.side !== 'foe') continue;
            c.fillStyle = u.kind === 'boss' ? '#ffffff' : u.elite ? '#ff9a3a' : u.pig ? '#ffd471' : '#ff3a3a';
            if (u.kind === 'boss') { skull(c, Math.round(x + u.x * kx), Math.round(y + u.y * ky), '#ffffff'); continue; }
            c.fillRect(Math.round(x + u.x * kx - 1), Math.round(y + u.y * ky - 1), 2, 2);
          }
          const arrow = (o, col) => {
            const ang = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[o.dir] || 0;
            c.save(); c.translate(x + o.x * kx, y + o.y * ky); c.rotate(ang); c.fillStyle = col; c.beginPath(); c.moveTo(4, 0); c.lineTo(-3, -3); c.lineTo(-1, 0); c.lineTo(-3, 3); c.closePath(); c.fill(); c.restore();
          };
          if (net) {
            for (const o of A.heroes) if (o !== h && !o.dead) arrow(o, ui.netSeatCol(o.pl));
            ui.drawHdMiniMarks(c, this, x, y, kx, ky);
          }
          if (!h.dead) arrow(h, '#ffffff');
          c.strokeStyle = 'rgba(255,255,255,0.6)'; c.strokeRect(x + this.cam.x * kx + 0.5, y + this.cam.y * ky + 0.5, W * kx, FH * ky);
          ui.hit(x, y, w, hh, (btn, p) => {
            if (btn !== 0) return;
            const look = q => ({ x: (q.x - x) / kx, y: (q.y - y) / ky });
            this.look = look(p);
            ui.drag = { move: q => { this.look = look(q); }, drop: () => { this.look = null; } };
          });
        },
        drawPanel(c) {
          const gr = c.createLinearGradient(0, PY, 0, HGT);
          gr.addColorStop(0, '#141a3a'); gr.addColorStop(1, '#070a1c');
          c.fillStyle = gr; c.fillRect(0, PY, W, HGT - PY);
          c.fillStyle = '#c9a45c'; c.fillRect(0, PY, W, 1);
          c.fillStyle = net ? ui.netSeatCol(me) : '#000000'; c.fillRect(5, PY + 7, 50, 50);
          G.drawPortrait(c, G.lookOf(h.key, g), 6, PY + 8, 48);
          c.fillStyle = 'rgba(4,6,20,0.85)'; c.fillRect(6, PY + 44, 18, 12);
          ui.text(String(h.lvl), 15, PY + 44, { align: 'center', size: 10, bold: true, col: C.gold });
          ui.text(ui.clip(H.CHARS[h.key].name, 52, 9, true), 6, PY + 72, { size: 9, bold: true, col: C.cream });
          ui.bar(62, PY + 10, 140, 7, h.hp / h.hpMax, '#86e39a');
          ui.text('НР ' + fmt(h.hp) + '/' + fmt(h.hpMax), 64, PY + 19, { size: 9, col: C.cream });
          ui.bar(62, PY + 33, 140, 5, h.en / h.enMax, '#f2b632');
          ui.text('ЭН ' + fmt(h.en) + '/' + fmt(h.enMax), 64, PY + 40, { size: 9, col: '#ffe0a0' });
          const nx = HD.expNext(h.lvl);
          c.fillStyle = '#1a1c30'; c.fillRect(62, PY + 52, 140, 2);
          c.fillStyle = '#c890ff'; c.fillRect(62, PY + 52, Math.round(140 * (h.lvl >= 20 ? 1 : h.exp / nx)), 2);
          let ax = 62;
          for (const at of ['str', 'agi', 'int']) {
            const txt = HD.ATTR_NAME[at] + ' ' + Math.round(h[at]);
            ui.text(txt, ax, PY + 58, { size: 9, bold: at === h.main, col: at === h.main ? HD.ATTR_COL[at] : C.sub });
            ax += ui.measure(txt, 9, at === h.main) + 6;
          }
          if (h.pts) ui.text('Очки развития: ' + h.pts, 62, PY + 72, { size: 9, bold: true, col: '#ffe04a' });
          if (A.needPick(h)) ui.badge(52, PY + 10);
          ui.hit(5, PY + 7, 50, 50, () => { this.card = this.card ? null : { tab: 0, top: 0 }; });
          SLOTS.forEach((sl, i) => this.drawSlot(c, sl, 214 + i * 46, PY + 18));
          for (let i = 0; i < 6; i++) this.drawItem(c, i, 410 + i * 31, PY + 12);
          this.drawConeCell(c, 599, PY + 12);
          ui.text('Золото ' + fmt(h.gold), 410, PY + 50, { size: 11, bold: true, col: '#ffd471' });
          const rc = h.recallCd > 0 ? 'F ' + Math.ceil(h.recallCd) + ' с' : h.recall > 0 ? 'F ...' : 'F: возврат';
          ui.text(rc, 410, PY + 66, { size: 9, col: h.recallCd > 0 ? C.dim : C.sub });
          if (A.nearShop(h)) { ui.keycap(500, PY + 64, 'B'); ui.text('Лавка', 518, PY + 65, { size: 9, col: C.gold }); }
          if (h.hold) ui.text('X: стоит', 560, PY + 66, { size: 9, col: '#ffd471' });
        },
        drawSlot(c, sl, x, y) {
          const l = h.abil[sl], K = HD.KITS[h.key][sl], s = 40;
          c.fillStyle = '#000000'; c.fillRect(x - 1, y - 1, s + 2, s + 2);
          c.fillStyle = '#10142e'; c.fillRect(x, y, s, s);
          G.hdAbilIcon(c, G.lookOf(h.key, g), sl, h.elem, x, y, s, h.key);
          if (!l) { c.fillStyle = 'rgba(20,20,32,0.7)'; c.fillRect(x, y, s, s); }
          c.fillStyle = 'rgba(4,6,20,0.6)'; c.fillRect(x, y + s - 12, 12, 12);
          const cost = sl === 't' ? 0 : A.costOf(h, sl), cd = sl === 't' ? 0 : A.cdLeft(h, sl), ch = sl === 't' ? 1 : A.charges(h, sl);
          if (l && cost > h.en) { c.fillStyle = 'rgba(30,60,160,0.45)'; c.fillRect(x, y, s, s); }
          if (cd > 0) { const k = Math.min(1, cd / K.cd); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x, y, s, Math.round(s * k)); ui.text(String(Math.ceil(cd)), x + s / 2, y + 13, { align: 'center', size: 12, bold: true, col: '#ffffff' }); }
          if (ch > 1 && l) { const left = Math.min(ch, Math.floor((ch * K.cd - Math.max(0, h.cd[sl])) / K.cd + 1e-9)); ui.text('×' + left, x + s - 2, y + 2, { align: 'right', size: 9, bold: true, col: '#ffe04a' }); }
          if (this.slotLit[sl] > 0) { c.strokeStyle = '#ffe04a'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, s - 2, s - 2); c.lineWidth = 1; }
          ui.text(SLOT_KEY[sl], x + 3, y + s - 12, { size: 10, bold: true, col: '#ffffff' });
          if (cost) ui.text(String(cost), x + s - 2, y + s - 12, { align: 'right', size: 9, col: '#ffe0a0' });
          const max = sl === 'r' ? 3 : 5;
          for (let i = 0; i < max; i++) { c.fillStyle = i < l ? '#ffe04a' : '#2a2e48'; c.fillRect(x + 4 + i * 7, y + s + 3, 5, 3); }
          const can = A.canUp(h, sl);
          if (can) {
            c.fillStyle = '#ffe04a'; c.fillRect(x + s / 2 - 7, y - 15, 14, 12);
            ui.text('+', x + s / 2, y - 16, { align: 'center', size: 11, bold: true, col: '#1a1208', shadow: false });
            ui.hit(x + s / 2 - 8, y - 16, 16, 14, () => A.cmd({ t: 'up', slot: sl }));
          }
          ui.hit(x, y, s, s, () => { if (sl !== 't') this.cast(sl); });
          const m = ui.mouse;
          if (m && m.x >= x && m.x < x + s && m.y >= y && m.y < y + s) this.tip = { sl, x };
        },
        drawItem(c, i, x, y) {
          const it = h.items[i], s = 28, on = this.shop && this.shop.slot === i;
          c.fillStyle = on ? '#ffe04a' : '#000000'; c.fillRect(x - 1, y - 1, s + 2, s + 2);
          c.fillStyle = '#10142e'; c.fillRect(x, y, s, s);
          if (it) {
            G.hdItemIcon(c, it, x + 2, y + 2, 24);
            if (it.n > 1) ui.text(String(it.n), x + s - 2, y + s - 11, { align: 'right', size: 9, bold: true, col: '#ffffff' });
            if (it.id === 'relic' && it.up) ui.text('+' + it.up * 3, x + s - 2, y + s - 11, { align: 'right', size: 8, bold: true, col: '#ffe04a' });
            if (it.ch != null) ui.text(String(it.ch), x + s - 2, y + s - 11, { align: 'right', size: 9, bold: true, col: '#ffffff' });
            const cd = it.cdT ? it.cdT - A.time : 0;
            if (cd > 0) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x, y, s, Math.round(s * Math.min(1, cd / (HD.DEVICES[it.id].cd || 1)))); ui.text(String(Math.ceil(cd)), x + s / 2, y + 8, { align: 'center', size: 10, bold: true, col: '#ffffff' }); }
          }
          ui.text(String(i + 1), x + 2, y + 1, { size: 8, col: '#8a90b0' });
          ui.hit(x, y, s, s, btn => { if (this.shop) { if (btn === 2) A.cmd({ t: 'sell', i }); else this.shop.slot = i; } else A.cmd(Object.assign({ t: 'use', i }, this.aim())); });
        },
        drawDead(c) {
          const cost = Math.round(TUN.buyback[0] + TUN.buyback[1] * h.lvl);
          ui.text('Возрождение ' + Math.ceil(h.respawn) + ' с', W / 2, FY + 140, { align: 'center', size: 22, bold: true, serif: true, col: '#ffffff' });
          const txt = h.bought ? 'Срочный вызов уже был в этой волне' : 'Срочный вызов: ' + fmt(cost) + ' золота (Enter)';
          const bw = ui.measure(txt, 12, true) + 24;
          ui.button(W / 2 - bw / 2, FY + 176, bw, 22, txt, () => A.cmd({ t: 'buyback' }), { disabled: h.bought || h.gold < cost });
        },
        drawBanner(c) {
          const b = this.banner, a = Math.min(1, b.t * 2);
          c.globalAlpha = a;
          const y = FY + FH - (b.small ? 84 : 110);
          c.fillStyle = b.red ? 'rgba(60,8,8,0.8)' : 'rgba(6,8,24,0.78)'; c.fillRect(0, y, W, b.small ? 24 : 40);
          c.fillStyle = b.red ? WARN : '#c9a45c'; c.fillRect(0, y, W, 1); c.fillRect(0, y + (b.small ? 23 : 39), W, 1);
          ui.text(ui.clip(b.text, W - 40, b.small ? 12 : 18, true), W / 2, y + (b.small ? 5 : 4), { align: 'center', size: b.small ? 12 : 18, bold: true, serif: !b.small, col: b.red ? '#ffb0a0' : C.gold });
          if (b.sub && !b.small) ui.text(b.sub, W / 2, y + 25, { align: 'center', size: 10, col: C.sub });
          c.globalAlpha = 1;
        },
        drawNotes(c) {
          const notes = this.flashes.filter(f => f.kind === 'note' || (f.kind === 'text' && f.x == null)).slice(-2), lift = A.needPick(h) ? 72 : 0;
          notes.forEach((n, i) => {
            const w = ui.measure(n.text, 11, true) + 20, y = PY - 26 - i * 20 - lift;
            c.fillStyle = 'rgba(6,8,24,0.85)'; c.fillRect(W / 2 - w / 2, y, w, 18);
            ui.text(n.text, W / 2, y + 3, { align: 'center', size: 11, bold: true, col: '#ffe0a0' });
          });
          if (this.tip && !this.shop && !this.card) {
            const { sl, x } = this.tip, K = HD.KITS[h.key], txt = K.text[sl](A.lvlK(sl, Math.max(1, h.abil[sl]))), lines = ui.wrap(txt, 228, 10), w = 240, y = PY - 24 - lines.length * 13 - 16 - lift;
            c.fillStyle = 'rgba(6,8,24,0.92)'; c.fillRect(Math.min(x, W - w - 4), y, w, lines.length * 13 + 20);
            c.strokeStyle = '#c9a45c'; c.strokeRect(Math.min(x, W - w - 4) + 0.5, y + 0.5, w - 1, lines.length * 13 + 19);
            ui.text(SLOT_NAME[sl] + ': ' + ui.clip(abilName(h.key, sl), 140, 10, true), Math.min(x, W - w - 4) + 6, y + 3, { size: 10, bold: true, col: C.gold });
            lines.forEach((l, i) => ui.text(l, Math.min(x, W - w - 4) + 6, y + 17 + i * 13, { size: 10, col: C.cream }));
          }
          this.tip = null;
        },
        drawPick(c) {
          const lvl = A.needPick(h), K = HD.KITS[h.key], list = lvl === 10 ? K.tr : K.ei, y = PY - 70;
          list.forEach((it, i) => {
            const x = W / 2 - 206 + i * 212;
            c.fillStyle = 'rgba(6,8,24,0.94)'; c.fillRect(x, y, 200, 64);
            c.strokeStyle = '#ffd471'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, 199, 63);
            ui.text((lvl === 10 ? 'След' : 'Эйдолон') + ' · Shift + ' + (i + 1), x + 6, y + 3, { size: 9, col: C.sub });
            ui.text(ui.clip(it.name, 188, 11, true), x + 6, y + 15, { size: 11, bold: true, col: C.gold });
            ui.wrap(it.text, 188, 9).slice(0, 3).forEach((l, j) => ui.text(l, x + 6, y + 30 + j * 11, { size: 9, col: C.cream }));
            ui.hit(x, y, 200, 64, () => A.cmd({ t: 'pick', i }));
          });
        },
        drawSummons(c, u, p) {
          if (!u.abil.t) return;
          if (u.key === 'topaz') {
            const at = u.tal.numbyAt && A.time - u.tal.numbyAt.t < 0.5 ? { x: u.tal.numbyAt.x - this.cam.x, y: u.tal.numbyAt.y - this.cam.y } : { x: p.x + 22, y: p.y - 2 + Math.sin(ui.t * 6) * 2 };
            G.drawEnemy(c, foeData('trotter'), at.x, at.y + 4, 28, { t: ui.t, aura: false });
          }
          if (u.key === 'jingyuan') {
            const L = u.tal.lord, la = u.tal.lordAt && A.time - u.tal.lordAt.t < 0.25 ? { x: u.tal.lordAt.x - this.cam.x, y: u.tal.lordAt.y - this.cam.y - 10 } : null;
            G.hdLord(c, p.x - 26, p.y - 18, ui.t, L ? L.hits : 3, la);
            if (L) ui.text(String(Math.min(10, L.hits)), p.x - 26, p.y - 104, { align: 'center', size: 9, bold: true, col: '#d8b0ff' });
          }
        },
        shopRows(tab) {
          if (tab === 0) {
            const out = [];
            for (const set of Object.keys(H.RELIC_SETS)) for (const slot of Object.keys(H.RELIC_SETS[set].pieces)) out.push({ kind: 'relic', set, slot, price: HD.RELIC.price, name: H.RELIC_SETS[set].pieces[slot], sub: H.RELIC_SETS[set].name });
            return out;
          }
          if (tab === 1) return HD.conesFor(H.CHARS[h.key].path).map(id => ({ kind: 'cone', id, price: HD.CONE_PRICE[H.CONES[id].rarity], name: H.CONES[id].name, sub: H.CONES[id].rarity + '★' }));
          if (tab === 2) return Object.keys(HD.DEVICES).map(id => ({ kind: 'dev', id, price: HD.DEVICES[id].price, name: HD.devName(id), sub: 'устройство' }));
          return SUPPLY_IDS.map(id => ({ kind: 'sup', id, price: HD.SUPPLIES[id].price, name: H.ITEMS[id].name, sub: 'припас' }));
        },
        shopBuy(r) {
          if (r.kind === 'relic') A.cmd({ t: 'buy', id: 'relic', set: r.set, slot: r.slot });
          else if (r.kind === 'cone') A.cmd({ t: 'buy', id: 'cone', cone: r.id });
          else A.cmd({ t: 'buy', id: r.id });
        },
        shopDesc(r) {
          const out = [];
          if (r.kind === 'relic') {
            const own = h.items.find(it => it && it.id === 'relic' && it.slot === r.slot);
            out.push([HD.relicText({ set: r.set, slot: r.slot, up: 0 }), C.cream]);
            out.push(['На +15: ' + HD.relicText({ set: r.set, slot: r.slot, up: 5 }), C.sub]);
            const n = (HD.relicCount(h)[r.set] || 0), planar = H.RELIC_SETS[r.set].planar;
            out.push(['Набор ' + n + '/' + (planar ? 2 : 4) + ' · 2 части: ' + HD.RELIC.text2[r.set], n >= 2 ? C.ok : C.sub]);
            if (!planar) out.push(['4 части: ' + HD.RELIC.text4[r.set], n >= 4 ? C.ok : C.sub]);
            if (own) out.push(['Эта часть уже надета: ' + H.RELIC_SETS[own.set].name, C.bad]);
          } else if (r.kind === 'cone') {
            const cur = h.cone && h.cone.id === r.id ? h.cone.sup : 1;
            out.push(['S' + cur + ': ' + HD.coneText(r.id, cur), C.cream]);
            const cs = HD.coneStats(r.id);
            out.push(['Урон атаки +' + Math.round(cs.atkFlat) + ', НР +' + Math.round(cs.hp) + ', броня +' + (Math.round(cs.armor * 10) / 10), C.sub]);
            if (h.cone && h.cone.id === r.id) out.push([cur < 5 ? 'U: наложение S' + (cur + 1) + ' за ' + Math.round(r.price * 0.5) : 'Наложение S5', C.gold]);
            else if (h.cone) out.push(['Заменит «' + H.CONES[h.cone.id].name + '», он продастся за ' + HD.sellValue(A, h.cone), C.sub]);
          } else if (r.kind === 'dev') out.push([HD.DEVICES[r.id].text, C.cream]);
          else out.push([HD.SUPPLIES[r.id].text, C.cream]);
          return out;
        },
        drawShop(c) {
          const x = SHOP.x, y = FY + SHOP.drop, w = SHOP.w, sh = this.shop, TABS = ['Реликвии', 'Конусы', 'Устройства', 'Припасы'];
          ui.win(x, y, w, FH - SHOP.drop, { title: 'Лавка Пом-Пом' });
          let tx = x + 10;
          TABS.forEach((t, i) => {
            const tw = ui.measure(t, 9, true) + 10;
            c.fillStyle = i === sh.tab ? '#c9a45c' : '#1a1c34'; c.fillRect(tx, y + 20, tw, 15);
            ui.text(t, tx + 5, y + 22, { size: 9, bold: true, col: i === sh.tab ? '#1a1208' : C.sub, shadow: false });
            ui.hit(tx, y + 20, tw, 15, () => { sh.tab = i; sh.sel = 0; });
            tx += tw + 4;
          });
          const rows = this.shopRows(sh.tab), view = 8, rh = 19;
          sh.sel = Math.max(0, Math.min(sh.sel, rows.length - 1));
          const top = Math.max(0, Math.min(sh.sel - 3, rows.length - view));
          rows.slice(top, top + view).forEach((r, k) => {
            const n = top + k, yy = y + 40 + k * rh, on = n === sh.sel;
            c.fillStyle = on ? 'rgba(242,220,154,0.18)' : 'rgba(6,10,34,0.6)'; c.fillRect(x + 10, yy, w - 20, rh - 2);
            if (on) { c.fillStyle = C.brassHi; c.fillRect(x + 10, yy, 2, rh - 2); }
            if (r.kind === 'cone') G.drawConeCard(c, r.id, x + 14, yy + 1, 12, 16, { info: false });
            else G.hdItemIcon(c, r.kind === 'relic' ? { id: 'relic', set: r.set, slot: r.slot } : { id: r.id }, x + 13, yy + 1, 16);
            const owned = r.kind === 'cone' ? h.cone && h.cone.id === r.id : h.items.some(it => it && (r.kind === 'relic' ? it.id === 'relic' && it.set === r.set && it.slot === r.slot : it.id === r.id));
            ui.text(ui.clip(r.name, 196, 10, on), x + 32, yy + 3, { size: 10, bold: on, col: owned ? C.ok : on ? C.gold : C.cream });
            ui.text(String(r.price), x + w - 14, yy + 3, { align: 'right', size: 10, bold: true, col: h.gold >= r.price ? '#ffd471' : C.bad });
            ui.hit(x + 10, yy, w - 20, rh - 2, () => { if (sh.sel === n) this.shopBuy(r); sh.sel = n; });
          });
          if (rows.length > view) ui.text((sh.sel + 1) + '/' + rows.length, x + w - 14, y + 40 + view * rh, { align: 'right', size: 9, col: C.dim });
          const r = rows[sh.sel];
          let dy = y + 206;
          if (r) {
            ui.text(ui.clip(r.sub + ' · ' + r.name, w - 28, 9, true), x + 14, dy, { size: 9, bold: true, col: C.gold });
            dy += 13;
            for (const [t, col] of this.shopDesc(r)) for (const l of ui.wrap(t, w - 28, 9)) { if (dy > y + 286) break; ui.text(l, x + 14, dy, { size: 9, col }); dy += 11; }
          }
          const iy = y + 292;
          for (let i = 0; i < 6; i++) this.drawItem(c, i, x + 12 + i * 32, iy);
          this.drawConeCell(c, x + 12 + 6 * 32 + 4, iy);
          const it = sh.slot >= 0 ? h.items[sh.slot] : null;
          let note = '';
          if (it) note = 'Delete: продать за ' + HD.sellValue(A, it) + (it.id === 'relic' && (it.up || 0) < 5 ? ' · U: +' + ((it.up || 0) + 1) * 3 + ' за ' + HD.upgradeCost(it) : '');
          ui.text(ui.clip(note || 'Золото ' + fmt(h.gold), w - 24, 9), x + 12, iy + 32, { size: 9, col: note ? C.cream : '#ffd471', bold: !note });
          if (note) ui.text('Золото ' + fmt(h.gold), x + w - 12, iy + 44, { align: 'right', size: 10, bold: true, col: '#ffd471' });
          ui.hints([['Enter', 'Купить'], ['U', 'Улучшить'], ['1-6', 'Ячейка'], ['B', 'Закрыть']], x + 10, y + FH - SHOP.drop - 16);
        },
        drawConeCell(c, x, y) {
          c.fillStyle = '#000000'; c.fillRect(x - 1, y - 1, 22, 30);
          c.fillStyle = '#1a1c30'; c.fillRect(x, y, 20, 28);
          if (h.cone) { G.drawConeCard(c, h.cone.id, x, y, 20, 28, { info: false }); ui.text('S' + h.cone.sup, x + 18, y + 18, { align: 'right', size: 8, bold: true, col: '#ffffff' }); }
          else ui.text('К', x + 10, y + 8, { align: 'center', size: 9, col: '#3a3e60' });
          ui.hit(x, y, 20, 28, () => { if (this.shop) { this.shop.tab = 1; } });
        },
        drawBigMap(c) {
          const k = Math.min((W - 40) / (M.w * TS), (FH - 20) / (M.h * TS)), w = M.w * TS * k, hh = M.h * TS * k, x = (W - w) / 2, y = FY + (FH - hh) / 2;
          c.fillStyle = 'rgba(2,3,10,0.85)'; c.fillRect(0, FY, W, FH);
          if (this.mini) c.drawImage(this.mini, x, y, w, hh);
          c.strokeStyle = '#c9a45c'; c.strokeRect(x - 0.5, y - 0.5, w + 1, hh + 1);
          for (const u of A.units) {
            if (u.dead || u.kind === 'base') continue;
            c.fillStyle = u.kind === 'hero' ? (net ? ui.netSeatCol(u.pl) : '#ffffff') : u.kind === 'turret' ? '#56d4ff' : u.kind === 'boss' ? '#ffffff' : u.elite ? '#ff9a3a' : '#ff3a3a';
            c.fillRect(Math.round(x + u.x * k) - 2, Math.round(y + u.y * k) - 2, u.kind === 'boss' ? 6 : 4, u.kind === 'boss' ? 6 : 4);
          }
          for (const key of Object.keys(M.rifts)) { const r = A.rift(key); ui.text(HD.RIFT_NAME[key], x + r.x * k, y + r.y * k + 6, { align: 'center', size: 9, col: '#d0a0ff' }); }
        }
      });
      return s;
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
