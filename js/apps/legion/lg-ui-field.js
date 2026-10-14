(function (L) {
  'use strict';

  const h = L.h;
  const QUOTES = [
    'Si vis pacem, para bellum. Хочешь мира - готовься к войне.',
    'Застрельщики сильны в лесу и на холмах, а на равнине их топчет конница.',
    'Тяжелая пехота теряет три четверти силы в лесу, в болоте и на крутых склонах.',
    'Кавалерия бьет сильнее всего в первом натиске. Выведите ее из схватки и атакуйте снова.',
    'Удар во фланг и тыл ломает боевой дух быстрее любых потерь.',
    'Отряды рядом с генералом держатся дольше. Берегите легата.',
    'Приказ «Пауза» держит резерв до сигнала. Сигнал поднимает всех разом.',
    'Копейщики и триарии встречают лобовой удар конницы стеной копий.'
  ];

  const COHESION = ['#555', '#d0503a', '#e0a040', '#d8d060', '#7fbf5f'];
  const I = L.Icons;
  const STATE_ICON = {
    waiting: ['hourglass', '#d9d2c0'], ready: ['hourglass', '#d9d2c0'], holding: ['shield', '#d9d2c0'], advancing: ['sandal', '#e3d3ae'], moving: ['sandal', '#e3d3ae'],
    flanking: ['evade', '#e3d3ae'], pursuing: ['sandal', '#a8d88a'], charging: ['burst', '#ffcf8a'], engaged: ['swords', '#f0a08a'], shooting: ['arrow', '#e3d3ae'],
    volley: ['javelin', '#e3d3ae'], withdrawing: ['evade', '#d9d2c0'], evading: ['evade', '#d9d2c0'], routing: ['mask', '#ffb060'], rallying: ['banner', '#a8d88a'],
    fled: ['cross', '#999'], destroyed: ['cross', '#999']
  };
  const glyph = (name, size, color) => I.img(I.ui(name, { color: color || '#e3d3ae' }), size);

  class FieldScreen {
    constructor(ui) {
      this.ui = ui;
      this.el = h('div', { class: 'lga-field' });
      this.canvas = h('canvas', { class: 'lga-view' });
      this.bannerEl = h('div', { class: 'lga-banners' });
      this.boxEl = h('div', { class: 'lga-box' });
      this.hudEl = h('div');
      this.el.append(this.canvas, this.bannerEl, this.boxEl, this.hudEl);
      this.banners = new Map();
      this.keys = {};
      this.sel = new Set();
      this.speed = 1;
      this.acc = 0;
      this.mode = 'idle';
      this.bindCanvas();
    }

    async show(p) {
      this.params = p;
      this.mode = 'loading';
      this.hudEl.innerHTML = '';
      this.clearBanners();
      this.sel.clear();
      this.speed = 1;
      this.acc = 0;
      this.endT = 0;
      this.hintStep = 0;
      this.feedCount = 0;
      const ui = this.ui;
      const lv = p.level;
      this.level = lv;
      ui.audio.music('deploy');
      ui.loading(true, lv.title, 'Загрузка карты', 0.02, QUOTES[Math.floor(Math.random() * QUOTES.length)]);
      try {
        const terrain = await L.loadTerrain(lv.map, L.terrainOpts(lv));
        if (this.ui.currentName !== 'field' || this.params !== p) return;
        const profile = p.quick ? null : ui.profile;
        const opts = { seed: (Date.now() & 0x7fffffff) || 1 };
        if (p.quick) { opts.squads = p.squads; opts.enemy = p.enemy; opts.difficulty = p.difficulty; opts.selected = p.squads.map(s => s.id); }
        const b = L.setupBattle(lv, profile, terrain, opts);
        this.battle = b;
        if (!this.renderer) {
          try { this.renderer = new L.Renderer(this.canvas); }
          catch (e) { ui.loading(false); await ui.alert('Нет 3D-ускорителя', 'Для битв нужен WebGL2. ' + e.message); ui.go(p.quick ? 'arena' : 'camp'); return; }
        }
        const r = this.renderer;
        r.opts.grass = ui.opts.grass;
        r.opts.trees = ui.opts.trees;
        r.opts.shadows = ui.opts.shadows;
        r.opts.numbers = ui.opts.numbers;
        r.opts.scale = ui.opts.quality === 0 ? 0.75 : 1;
        r.numbers = [];
        r.dust = [];
        r.models = new Map();
        await r.load(b, (f, t) => ui.loading(true, lv.title, t, 0.05 + f * 0.9));
        if (this.ui.currentName !== 'field' || this.params !== p) return;
        ui.audio.preload(['hit', 'heavy', 'die', 'cavdie', 'missile', 'missilecav', 'volley', 'select', 'received', 'rally', 'rout', 'retreat', 'attack', 'gallop', 'run', 'tick', 'error', 'elecharge']);
        ui.loading(false);
        this.enterDeploy();
      } catch (e) {
        ui.loading(false);
        ui.fail(e);
      }
    }

    hide() {
      this.mode = 'idle';
      this.ui.audio.stopLoops();
      this.clearBanners();
      this.ui.hideTip();
    }

    destroy() {
      if (this.renderer) this.renderer.destroy();
      this.renderer = null;
    }

    clearBanners() {
      for (const b of this.banners.values()) b.el.remove();
      this.banners.clear();
    }

    enterDeploy() {
      this.mode = 'deploy';
      const b = this.battle;
      this.renderer.overlay.zone = b.sides[0].zone;
      this.renderer.overlay.arrows = [];
      this.renderer.overlay.rings = [];
      const first = b.squads.find(s => s.side === 0 && s.onField && !s.general) || b.squads.find(s => s.side === 0);
      this.sel = new Set(first ? [first] : []);
      this.buildDeployHud();
      this.checkOverlaps();
      if (this.level.tutorial && this.ui.opts.hints) this.showHint(0);
    }

    squadsOf(side) {
      return this.battle.squads.filter(s => s.side === side);
    }

    capUsed() {
      return this.squadsOf(0).filter(s => s.onField).length;
    }

    buildDeployHud() {
      const ui = this.ui, lv = this.level, b = this.battle;
      this.hudEl.innerHTML = '';
      const left = h('div', { class: 'lga-deploy-left lga-panel' });
      this.capEl = h('div', { class: 'lga-cap' });
      this.rosterEl = h('div', { class: 'list' });
      left.append(this.capEl, this.rosterEl, h('div', { class: 'foot', text: 'Галочка: отряд на поле. ЛКМ: выбрать и тащить, ПКМ: развернуть. 1, 2, 3: строй.' }));
      const right = h('div', { class: 'lga-deploy-right lga-panel' });
      const enemies = this.squadsOf(1);
      const reinf = (b.reinforcements || []).reduce((a, r) => a + r.squads.length, 0);
      right.appendChild(this.battleCard());
      right.appendChild(h('div', { class: 'lga-cap' }, [h('span', { text: 'Разведка' }), h('small', { text: (L.FACTIONS[lv.faction] ? L.FACTIONS[lv.faction].name : 'Противник') + ', ' + enemies.length + ' отр.' + (reinf ? ' и подкрепления' : '') })]));
      const elist = h('div', { class: 'list' });
      const groups = new Map();
      for (const s of enemies) {
        if (!groups.has(s.key)) groups.set(s.key, []);
        groups.get(s.key).push(s);
      }
      for (const [key, list] of groups) {
        const u = L.UNITS[key];
        const lvls = list.map(q => q.level);
        const lo = Math.min(...lvls), hi = Math.max(...lvls);
        let at = 0;
        const row = h('div', { class: 'lga-erow' }, [
          h('div', { class: 'pic', style: { backgroundImage: 'url(' + L.card(key) + ')' } }),
          h('div', { style: { minWidth: 0 } }, [h('div', { style: { fontWeight: 600 }, text: u.name }), h('div', { class: 't' }, [I.img(I.cls(u.type), 12), 'ур. ' + (lo === hi ? lo : lo + '-' + hi) + ', ' + list[0].men0 + ' чел.'])]),
          h('span', { class: 'cnt', text: '×' + list.length })
        ]);
        row.addEventListener('mouseenter', e => { this.renderer.overlay.hover = list[at % list.length]; ui.showTip(e, this.squadTip(list[0])); });
        row.addEventListener('mousemove', e => ui.moveTip(e));
        row.addEventListener('mouseleave', () => { this.renderer.overlay.hover = null; ui.hideTip(); });
        row.addEventListener('click', () => {
          const s = list[at % list.length];
          at++;
          this.renderer.overlay.hover = s;
          this.renderer.focus(s.ax, s.az);
        });
        elist.appendChild(row);
      }
      right.appendChild(elist);
      const actions = h('div', { class: 'lga-deploy-actions' }, [
        ui.btn('Местность', () => this.toggleTypes(), { cls: 'small', icon: I.ui('tree', { color: '#bfe3a8' }), tip: '<b>Показать местность (T)</b><br>Подсвечивает лес, болото, броды и крутые склоны. Тяжелые войска и кавалерия теряют там силу.' }),
        ui.btn('Расставить', () => { b.autoDeploy(0); this.checkOverlaps(); this.renderRoster(); }, { cls: 'small', icon: I.ui('wedge', { color: '#e3d3ae' }), tip: 'Расставить все отряды на поле автоматически' }),
        ui.btn(this.params.quick ? 'Назад' : 'Лагерь', () => this.leaveDeploy(), { cls: 'small', icon: I.ui('tent', { color: '#e3d3ae' }) }),
        ui.btn('В бой!', () => this.startBattle(), { cls: 'primary big', tip: 'Начать битву (Enter)' })
      ]);
      this.planEl = h('div', { class: 'lga-plan lga-panel' });
      const bottom = h('div', { class: 'lga-deploy-bottom' }, [this.planEl]);
      this.terrainInfo = h('div', { class: 'lga-terrain-info lga-chip', style: { display: 'none' } });
      this.hudEl.append(left, right, actions, bottom, this.terrainInfo);
      this.renderRoster();
      this.renderPlan();
    }

    battleCard() {
      const lv = this.level, b = this.battle;
      const card = h('div', { class: 'lga-bcard' });
      card.append(h('div', { class: 'ttl', text: lv.title }), h('div', { class: 'sub', text: this.params.quick ? 'Быстрая битва' : 'Битва ' + lv.n + ' из ' + L.LEVELS.length + ', до ' + lv.cap + ' отрядов' }));
      for (const o of b.objectiveStatus()) card.appendChild(h('div', { class: 'row' }, [I.img(I.objective(o.type), 16), this.objectiveLabel(o)]));
      if (!this.params.quick && lv.reward) card.appendChild(h('div', { class: 'res' }, [h('span', {}, [I.img(I.glory(), 18), String(lv.reward.glory)]), h('span', {}, [I.img(I.denarii(), 18), String(lv.reward.denarii)])]));
      return card;
    }

    objectiveLabel(o) {
      switch (o.type) {
        case 'kill': return o.text.replace('Осталось убить: ', 'Убить врагов: ');
        default: return o.text;
      }
    }

    renderRoster() {
      const ui = this.ui;
      const mine = this.squadsOf(0);
      const used = this.capUsed();
      this.capEl.innerHTML = '';
      this.capEl.append(h('span', { text: 'Отряды на поле' }), h('span', { text: used + ' / ' + this.level.cap, style: { color: used > this.level.cap ? '#ec907a' : 'var(--gold-hi)' } }));
      this.rosterEl.innerHTML = '';
      for (const s of mine) {
        const cb = h('input', { type: 'checkbox', 'aria-label': 'На поле' });
        cb.checked = s.onField;
        if (s.general) cb.disabled = true;
        cb.addEventListener('click', e => { e.stopPropagation(); this.toggleField(s, cb.checked); });
        const row = h('div', { class: 'lga-drow' + (this.sel.has(s) ? ' sel' : '') + (s.onField ? '' : ' res') }, [
          cb,
          h('div', { class: 'pic', style: { backgroundImage: 'url(' + L.card(s.key) + ')' } }),
          h('div', { style: { minWidth: 0 } }, [h('div', { class: 'n', text: s.name }), h('div', { class: 't' }, [I.img(I.cls(s.clsName), 12), L.CLASSES[s.clsName].name + ', ' + s.men0 + '/' + s.menMax])]),
          h('span', { class: 'lga-lvl', text: String(s.level) })
        ]);
        row.addEventListener('click', () => { this.select(s); if (s.onField) this.renderer.focus(s.ax, s.az); });
        ui.tip(row, () => this.squadTip(s));
        this.rosterEl.appendChild(row);
      }
    }

    toggleField(s, on) {
      if (s.general) return;
      if (on && this.capUsed() >= this.level.cap) {
        this.ui.toast('В этой битве можно выставить не больше ' + this.level.cap + ' отрядов', 'bad');
        this.ui.audio.play('error', { vol: 0.6 });
        this.renderRoster();
        return;
      }
      s.onField = on;
      if (on) this.placeFree(s);
      this.checkOverlaps();
      this.renderRoster();
      this.renderPlan();
    }

    placeFree(s) {
      const b = this.battle, zn = b.sides[0].zone;
      const others = this.squadsOf(0).filter(o => o !== s && o.onField);
      let best = null;
      for (let z = zn[1] + 20; z < zn[3] - 5 && !best; z += 14) {
        for (let x = zn[0] + s.width / 2 + 4; x < zn[2] - s.width / 2; x += 8) {
          if (!b.validDeploy(s, x, z)) continue;
          if (others.some(o => L.dist(o.ax, o.az, x, z) < (o.radius + s.radius) * 0.85)) continue;
          best = [x, z];
          break;
        }
      }
      if (best) b.placeSquad(s, best[0], best[1], this.level.playerFace);
    }

    checkOverlaps() {
      const bad = this.battle.deployClashes(0);
      this.renderer.overlay.invalid = bad;
      return bad;
    }

    squadTip(s) {
      const d = L.UNITS[s.key];
      const role = L.ROLES[d.type];
      const st = s.stats;
      const lines = ['<b>' + L.esc(s.name) + '</b> · ' + L.esc(d.name) + ', ур. ' + s.level,
        L.CLASSES[d.type].name + ', людей: ' + (this.mode === 'deploy' ? s.men0 : s.alive) + ' из ' + s.menMax];
      if (this.mode === 'battle') lines.push('Состояние: ' + L.STATE_NAMES[s.state] + ', боевой дух ' + Math.max(0, Math.round(s.morale / s.moraleMax * 100)) + '%');
      lines.push('<hr>Атака ' + Math.round(st.hit) + ' · урон ' + Math.round(st.dm) + ' · броня ' + Math.round(st.ar) + ' · ловкость ' + Math.round(st.ag));
      if (d.fire) lines.push('Метание: ' + st.shots + ' ед. на человека, дальность ' + Math.round(st.range) + ' м');
      const own = s.side === 0 ? (this.params.quick ? this.params.squads : this.ui.profile ? this.ui.profile.squads : []).find(q => q.id === s.ref) : null;
      const ids = own ? Object.keys(own.skills || {}) : [];
      if (ids.length) lines.push('<hr>' + ids.map(id => I.html(I.skill(id, own.skills[id]), 22)).join(' '));
      if (role) lines.push('<hr><span class="lga-good">+</span> ' + role.good + '<br><span class="lga-bad">−</span> ' + role.bad);
      return lines.join('<br>');
    }

    select(s, add) {
      if (!add) this.sel.clear();
      if (s) {
        if (add && this.sel.has(s)) this.sel.delete(s);
        else this.sel.add(s);
        if (s.side === 0 && this.mode === 'battle' && !add) this.ui.audio.play('select', { voice: true, gap: 0.8, vol: 0.8 });
      }
      if (this.mode === 'deploy') { this.renderRoster(); this.renderPlan(); }
      else this.hudDirty = true;
    }

    selected() {
      return Array.from(this.sel).filter(s => s.alive > 0 && s.state !== 'fled');
    }

    formIcon(s, form) {
      const f = L.FORMS[form];
      const idx = f.icon[s.family] != null ? f.icon[s.family] : f.icon.regular;
      return L.uiImg('forms/form' + idx + '.png');
    }

    formsFor(s) {
      if (s.general) return ['balanced'];
      const out = ['attack', 'balanced', 'defend'];
      if (s.stats.forms) out.push('wedge', 'square');
      return out;
    }

    formTip(form) {
      const f = L.FORMS[form];
      const pct = v => (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
      const parts = [];
      if (f.hit) parts.push('атака ' + pct(f.hit));
      if (f.dm) parts.push('урон ' + pct(f.dm));
      if (f.ar) parts.push('броня ' + pct(f.ar));
      if (f.sa) parts.push('защита от снарядов ' + pct(f.sa));
      if (f.speed) parts.push('скорость ' + pct(f.speed));
      if (f.oc) parts.push('приказы ' + (f.oc > 0 ? 'дороже' : 'дешевле') + ' на ' + Math.abs(f.oc));
      if (f.noFlank) parts.push('нет уязвимых флангов');
      return '<b>Строй: ' + f.name + '</b><br>' + (parts.join(', ') || 'без поправок');
    }

    doctrineTip(k) {
      const d = L.DOCTRINES[k];
      return '<b>' + d.name + '</b><br>' + d.desc;
    }

    renderPlan() {
      const ui = this.ui;
      const s = Array.from(this.sel)[0];
      const el = this.planEl;
      el.innerHTML = '';
      if (!s) {
        el.appendChild(h('div', { class: 'lga-dim', style: { gridColumn: '1 / -1' }, text: 'Выберите отряд, чтобы задать ему строй и приказ.' }));
        return;
      }
      const forms = h('div', { class: 'grp' }, [h('div', { class: 'lbl' }, ['Строй: ', h('span', { text: L.FORMS[s.form].name })])]);
      const frow = h('div', { style: { display: 'flex', gap: '4px' } });
      for (const f of this.formsFor(s)) {
        const b = h('button', { class: 'lga-form' + (s.form === f ? ' on' : ''), type: 'button', style: { backgroundImage: 'url(' + this.formIcon(s, f) + ')' }, 'aria-label': L.FORMS[f].name });
        b.addEventListener('click', () => {
          ui.audio.ui();
          this.battle.setForm(s, f);
          this.checkOverlaps();
          this.renderPlan();
        });
        ui.tip(b, this.formTip(f));
        frow.appendChild(b);
      }
      forms.appendChild(frow);
      const ords = h('div', { class: 'ords' });
      for (const k of L.DOCTRINE_ORDER) {
        const d = L.DOCTRINES[k];
        const c = h('div', { class: 'ordc' + (s.doctrine === k ? ' on' : '') }, [h('img', { src: L.uiImg('orders/order' + d.icon + (s.doctrine === k ? '-on' : '') + '.png'), alt: '' }), h('span', { text: d.name })]);
        c.addEventListener('click', () => {
          ui.audio.ui();
          this.battle.command(s, { type: 'doctrine', doctrine: k });
          this.renderPlan();
        });
        ui.tip(c, this.doctrineTip(k));
        ords.appendChild(c);
      }
      const doc = h('div', { class: 'grp' }, [h('div', { class: 'lbl' }, ['Приказ: ', h('span', { text: L.DOCTRINES[s.doctrine].name + '. Отряд выполнит его сам.' })]), ords]);
      const pic = h('div', { class: 'pic', style: { backgroundImage: 'url(' + L.portrait(s.key) + ')' } });
      ui.tip(pic, () => this.squadTip(s));
      el.append(pic, h('div', { class: 'grp', style: { minWidth: '150px' } }, [
        h('div', { class: 'who', text: s.name }),
        h('div', { class: 'lga-dim', style: { display: 'flex', alignItems: 'center', gap: '5px' } }, [I.img(I.cls(s.clsName), 14), L.UNITS[s.key].name + ', ур. ' + s.level]),
        h('div', { class: 'lga-dim', text: 'Людей: ' + s.men0 + ' из ' + s.menMax }),
        forms
      ]), doc);
    }

    leaveDeploy() {
      if (!this.params.quick) {
        L.rememberDeploy(this.battle, this.ui.profile);
        this.ui.save();
      }
      this.ui.go(this.params.quick ? 'arena' : 'campaign', { level: this.level });
    }

    startBattle() {
      const bad = this.checkOverlaps();
      if (bad.size) {
        this.ui.toast('Отряды перекрывают друг друга или стоят вне зоны. Измените расстановку.', 'bad');
        this.ui.audio.play('error', { vol: 0.6 });
        return;
      }
      const b = this.battle;
      if (!this.params.quick) { L.rememberDeploy(b, this.ui.profile); this.ui.save(); }
      this.hideHint();
      b.start();
      this.mode = 'battle';
      this.renderer.overlay.zone = null;
      this.renderer.overlay.invalid = null;
      this.ui.audio.music('battle');
      this.ui.audio.loop('wind1', 0.18);
      this.ui.audio.loop(this.level.night ? 'cricketloop' : 'wind2', 0.12);
      this.ui.audio.loop('fight1', 0.5);
      this.ui.audio.loop('fight2', 0.4);
      this.ui.audio.loop('infmove', 0.35);
      this.ui.audio.loop('cavmove', 0.35);
      this.ui.audio.play('rally', { vol: 0.8, gap: 0 });
      this.birdT = 5;
      this.buildBattleHud();
      if (this.level.tutorial && this.ui.opts.hints) this.showHint(3);
    }

    buildBattleHud() {
      const ui = this.ui;
      this.hudEl.innerHTML = '';
      this.feedEl = h('div', { class: 'lga-feed' });
      this.objEl = h('div', { class: 'lga-hud-top' });
      this.objChips = this.battle.objectiveStatus().map(o => {
        const text = h('span');
        const bar = o.type !== 'keepGeneral' ? h('div', { class: 'lga-bar' }, [h('i')]) : null;
        const chip = h('div', { class: 'lga-chip' }, [I.img(I.objective(o.type), 18), text, bar]);
        this.objEl.appendChild(chip);
        return { chip, text, bar };
      });
      this.clockText = h('span');
      this.clockEl = h('div', { class: 'lga-clock' }, [glyph('hourglass', 15), this.clockText]);
      const speed = h('div', { class: 'lga-speed' }, [this.clockEl]);
      this.speedBtns = [0, 1, 2, 4].map(v => {
        const b = ui.btn(v === 0 ? '❚❚' : v + '×', () => this.setSpeed(v), { tip: v === 0 ? 'Пауза (Пробел). На паузе можно отдавать приказы.' : 'Скорость ' + v + '× (+ и -)' });
        speed.appendChild(b);
        return b;
      });
      speed.appendChild(ui.btn('Меню', () => this.pauseMenu(), { tip: 'Меню битвы (Esc)' }));
      this.stripEl = h('div', { class: 'lga-strip' });
      this.selEl = h('div', { class: 'lga-selpanel lga-panel' });
      this.cpEl = h('div', { class: 'lga-cp' }, [h('i'), h('b'), h('span')]);
      ui.tip(this.cpEl, '<b>Очки приказов</b><br>Каждый приказ в бою тратит очки. Они восстанавливаются со временем, быстрее с навыками генерала. Светлая черта: цена приказа выбранным отрядам. Если генерал погибнет, приказы подорожают.');
      this.globEl = h('div', { class: 'lga-glob' });
      const cmd = h('div', { class: 'lga-cmd lga-panel' }, [h('div', { class: 'head' }, ['Командование', h('span', { text: 'G сигнал, R воодушевить' })]), this.cpEl, this.globEl]);
      this.miniEl = h('div', { class: 'lga-minimap' });
      this.miniCanvas = h('canvas', { width: '174', height: '174' });
      this.miniEl.appendChild(this.miniCanvas);
      this.bindMinimap();
      const bottom = h('div', { class: 'lga-bottom' }, [this.selEl, cmd, this.miniEl]);
      this.hudEl.append(this.feedEl, this.objEl, speed, h('div', { class: 'lga-dock' }, [this.stripEl, bottom]));
      this.buildGlobals();
      this.buildStrip();
      this.hudDirty = true;
      this.hudT = 0;
      this.miniBase = null;
    }

    buildGlobals() {
      const ui = this.ui;
      this.globEl.innerHTML = '';
      const mk = (img, cap, cost, fn, tip) => {
        const btn = h('button', { class: 'lga-icon', type: 'button', style: { backgroundImage: 'url(' + L.uiImg('battle/' + img + '.png') + ')' }, 'aria-label': cap }, [h('span', { class: 'cap', text: cap })]);
        btn.addEventListener('click', () => { ui.audio.ui(); fn(); });
        ui.tip(btn, '<b>' + cap + '</b> · ' + cost + ' очк.<br>' + tip);
        this.globEl.appendChild(btn);
        return btn;
      };
      this.gSignal = mk('charge', 'Сигнал', L.COSTS.signal, () => this.doSignal(), 'Все отряды, ждущие сигнала (Пауза, Долгая пауза, остановленные), переходят в наступление. Клавиша G.');
      this.gRally = mk('rally', 'Воодушевить', L.COSTS.rally, () => this.doRally(), 'Генерал трубит сбор: отряды рядом с ним получают прилив боевого духа, бегущие могут вернуться в строй. Клавиша R.');
      this.gRetreat = mk('retreat', 'Отход', L.COSTS.retreat, () => this.doRetreat(), 'Все отряды не в бегстве отходят на 70 м назад и останавливаются. Спасает армию от окружения.');
      const p = this.params.quick ? null : ui.profile;
      if (p && p.favours.length) {
        this.globEl.appendChild(h('span', { class: 'sep' }));
        p.favours.forEach((k, i) => {
          const btn = h('button', { class: 'lga-fav', type: 'button', 'aria-label': L.FAVOURS[k].name }, [I.img(I.favour(k), null)]);
          btn.addEventListener('click', () => this.useFavour(k, i));
          ui.tip(btn, ui.favourTip(k, true));
          this.globEl.appendChild(btn);
        });
      }
    }

    buildStrip() {
      this.stripEl.innerHTML = '';
      this.stripItems = [];
      const mine = this.squadsOf(0).filter(s => s.onField);
      mine.forEach((s, i) => {
        const stt = h('div', { class: 'stt' });
        const it = h('div', { class: 'lga-sq', style: { backgroundImage: 'url(' + L.card(s.key) + ')' } }, [h('div', { class: 'no' + (s.general ? ' gen' : ''), text: s.general ? '★' : String(i + 1) }), stt, h('div', { class: 'hp' }, [h('i')]), h('div', { class: 'mo' }, [h('i')])]);
        it.addEventListener('click', e => { this.select(s, e.shiftKey || e.ctrlKey); });
        it.addEventListener('dblclick', () => this.renderer.focus(s.cx, s.cz));
        this.ui.tip(it, () => this.squadTip(s));
        this.stripEl.appendChild(it);
        this.stripItems.push({ s, el: it, stt, hp: it.querySelector('.hp i'), mo: it.querySelector('.mo i'), state: null });
      });
    }

    setSpeed(v) {
      this.speed = v;
      this.hudDirty = true;
    }

    cpCostSel() {
      const list = this.selected().filter(s => s.side === 0);
      return list.reduce((a, s) => a + this.battle.orderCost(s), 0);
    }

    order(cmd) {
      const b = this.battle;
      const list = this.selected().filter(s => s.side === 0 && s.state !== 'routing');
      if (!list.length) return false;
      let ok = 0;
      for (const s of list) {
        if (cmd.type === 'disengage' && !s.cls.cav) continue;
        if (b.command(s, typeof cmd === 'function' ? cmd(s) : cmd)) ok++;
      }
      if (ok) {
        this.ui.audio.play('received', { voice: true, gap: 0.6, vol: 0.8 });
        this.hudDirty = true;
      } else this.noPoints();
      return ok > 0;
    }

    noPoints() {
      this.ui.audio.play('error', { vol: 0.6, gap: 0.3 });
      if (this.cpEl) {
        this.cpEl.classList.remove('flash');
        this.cpEl.getBoundingClientRect();
        this.cpEl.classList.add('flash');
      }
    }

    doSignal() {
      if (this.battle.signal(0)) this.ui.audio.play('attack', { vol: 0.9 });
      else this.noPoints();
    }

    doRally() {
      const s = this.battle.sides[0];
      if (!s.general || s.generalDead) { this.ui.toast('Генерал погиб, воодушевлять некому', 'bad'); return; }
      if (!this.battle.rally(0)) this.noPoints();
    }

    doRetreat() {
      if (!this.battle.retreat(0)) this.noPoints();
    }

    useFavour(k, i) {
      const s = this.selected().find(q => q.side === 0);
      if (!s) { this.ui.toast('Сначала выберите свой отряд', 'bad'); return; }
      if (this.battle.useFavour(s, k)) {
        this.ui.profile.favours.splice(i, 1);
        this.ui.save();
        this.buildGlobals();
        this.ui.audio.play('rally', { vol: 0.8 });
      }
    }

    pauseMenu() {
      const ui = this.ui;
      const prev = this.speed;
      this.speed = 0;
      const box = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '260px' } });
      box.append(
        ui.btn('Продолжить', () => ui.closeModal(), { cls: 'primary' }),
        ui.btn('Настройки', () => { ui.closeModal(); L.openSettings(ui, () => this.applyOpts()); }),
        ui.btn('Горячие клавиши', () => { ui.closeModal(); this.keysHelp(); }),
        ui.btn('Сдаться', async () => {
          ui.closeModal();
          if (await ui.confirm('Сдаться', 'Армия покинет поле боя. Битва будет проиграна, но потери и опыт не сохранятся.', 'Сдаться', 'Отмена')) this.battle.finish(false, 'surrender');
        }),
        ui.btn('Выйти в главное меню', async () => {
          ui.closeModal();
          if (await ui.confirm('Выход', 'Битва будет прервана без результата. Выйти в главное меню?', 'Выйти', 'Остаться')) ui.go('menu');
        })
      );
      ui.modal({ title: 'Битва остановлена', body: box, onClose: () => { if (this.mode === 'battle') this.speed = prev || 1; this.hudDirty = true; } });
    }

    keysHelp() {
      const rows = [['ЛКМ', 'Выбрать отряд, рамка - несколько отрядов'], ['ПКМ по земле', 'Идти (перетаскивание задает направление строя)'], ['ПКМ по врагу', 'Атаковать отряд'], ['WASD / стрелки', 'Двигать камеру'], ['Q / E, средняя кнопка', 'Поворот камеры'], ['Колесо', 'Приблизить или отдалить'],
        ['Пробел', 'Пауза'], ['1 / 2 / 3', 'Строй: атака, баланс, оборона'], ['G', 'Сигнал'], ['R', 'Воодушевить'], ['H', 'Стоять'], ['C', 'Атака (бегом)'], ['X', 'Вывести конницу из боя'], ['Tab', 'Следующий отряд'], ['F', 'Камера на выбранный отряд'], ['Home', 'Камера на генерала'], ['T', 'Показать местность'], ['+ / -', 'Скорость боя'], ['Esc', 'Меню'], ['F7', 'Отладка: +500 славы и +500 динариев']];
      const t = h('table', { class: 'lga-table' });
      for (const [k, v] of rows) t.appendChild(h('tr', {}, [h('td', { style: { color: 'var(--gold-hi)', whiteSpace: 'nowrap' }, text: k }), h('td', { text: v })]));
      this.ui.modal({ title: 'Управление в бою', body: t, buttons: [{ label: 'OK', cls: 'primary' }] });
    }

    applyOpts() {
      const r = this.renderer;
      if (!r) return;
      const o = this.ui.opts;
      r.opts.grass = o.grass;
      r.opts.shadows = o.shadows;
      r.opts.numbers = o.numbers;
      r.opts.scale = o.quality === 0 ? 0.75 : 1;
    }

    toggleTypes() {
      const r = this.renderer;
      r.opts.types = r.opts.types ? 0 : 1;
    }

    update(dt) {
      const r = this.renderer;
      if (!r || !this.battle || this.mode === 'loading' || this.mode === 'idle') return;
      this.moveCamera(dt);
      const b = this.battle;
      let alpha = 1;
      if (this.mode === 'battle' || this.mode === 'ending') {
        const sp = this.mode === 'ending' ? 0.35 : this.speed;
        this.acc += dt * sp;
        let steps = 0;
        while (this.acc >= L.TICK && steps < 12) {
          b.tick();
          this.acc -= L.TICK;
          steps++;
          this.processEvents();
          if (b.state !== 'battle') break;
        }
        if (steps >= 12) this.acc = 0;
        alpha = L.clamp(this.acc / L.TICK, 0, 1);
        if (b.state === 'over' && this.mode === 'battle') {
          this.mode = 'ending';
          this.endT = 0;
          this.onEnd();
        }
        if (this.mode === 'ending') {
          this.endT += dt;
          if (this.endT > 2.6 && !this.resultsShown) this.showResults();
        }
        this.ambient(dt);
      }
      this.updateOverlay();
      r.render(alpha, dt, this.sel);
      this.updateBanners(alpha);
      if (this.mode === 'battle' || this.mode === 'ending') {
        this.hudT -= dt;
        if (this.hudT <= 0 || this.hudDirty) {
          this.hudT = 0.12;
          this.updateHud();
          this.hudDirty = false;
        }
        this.drawMinimap();
      }
    }

    moveCamera(dt) {
      const r = this.renderer;
      const k = this.keys;
      const sp = r.cam.dist * 1.1 * dt;
      let dx = 0, dz = 0;
      if (k.KeyW || k.ArrowUp) dz -= sp;
      if (k.KeyS || k.ArrowDown) dz += sp;
      if (k.KeyA || k.ArrowLeft) dx -= sp;
      if (k.KeyD || k.ArrowRight) dx += sp;
      if (k.KeyQ) r.cam.yaw += dt * 1.4;
      if (k.KeyE) r.cam.yaw -= dt * 1.4;
      if (this.ui.opts.edgeScroll && this.mouse && this.mouse.inside && !this.drag && document.hasFocus()) {
        const m = this.mouse, rect = this.canvas.getBoundingClientRect();
        const e = 6;
        if (m.x - rect.left < e) dx -= sp;
        if (rect.right - m.x < e) dx += sp;
        if (m.y - rect.top < e) dz -= sp;
        if (rect.bottom - m.y < e) dz += sp;
      }
      if (dx || dz) r.moveCamera(dx, dz);
    }

    processEvents() {
      const b = this.battle, r = this.renderer, ui = this.ui;
      const events = b.events;
      b.events = [];
      const tx = r.cam.tx, tz = r.cam.tz;
      const vol = (x, z, base) => {
        const d = L.dist(x, z, tx, tz);
        const v = Math.pow(L.clamp(1 - d / (260 + r.cam.dist * 1.2), 0, 1), 1.4);
        return v * (base == null ? 1 : base) * L.clamp(260 / (r.cam.dist + 120), 0.35, 1.2);
      };
      const pan = (x, z) => {
        const p = r.project(x, b.terrain.heightAt(x, z), z);
        return p ? L.clamp((p[0] / Math.max(1, this.canvas.clientWidth)) * 2 - 1, -1, 1) * 0.8 : 0;
      };
      for (const e of events) {
        switch (e.type) {
          case 'hit':
            if (e.dmg !== 0 && this.ui.opts.numbers && L.dist(e.x, e.z, tx, tz) < r.cam.dist * 2.5 + 60) {
              const col = e.side === 0 ? [1, 0.35, 0.28] : [1, 0.86, 0.3];
              r.addNumber(e.x + (Math.random() - 0.5), e.z + (Math.random() - 0.5), e.dmg < 0 ? 'x' : e.dmg, col);
            }
            ui.audio.play(e.heavy ? 'heavy' : 'hit', { x: e.x, z: e.z, vol: vol(e.x, e.z, 0.55), pan: pan(e.x, e.z), gap: 0.06 });
            break;
          case 'clash':
            ui.audio.play('hit', { vol: vol(e.x, e.z, 0.3), pan: pan(e.x, e.z), gap: 0.09 });
            break;
          case 'kill':
          case 'trample':
            ui.audio.play(e.cav ? 'cavdie' : 'die', { vol: vol(e.x, e.z, 0.6), pan: pan(e.x, e.z), gap: 0.12 });
            if (e.type === 'trample' && this.ui.opts.numbers) r.addNumber(e.x, e.z, 'h', e.side === 0 ? [1, 0.35, 0.28] : [1, 0.86, 0.3]);
            break;
          case 'shoot':
            if (e.kind === 'arrow') ui.audio.play('volley', { vol: vol(e.x, e.z, 0.5), pan: pan(e.x, e.z), gap: 0.35 });
            break;
          case 'missilehit':
            ui.audio.play(e.cav ? 'missilecav' : 'missile', { vol: vol(e.x, e.z, 0.45), pan: pan(e.x, e.z), gap: 0.07 });
            break;
          case 'charge':
            if (e.squad.cls.cav) ui.audio.play(e.squad.clsName === 'Elephant' ? 'elecharge' : 'gallop', { vol: vol(e.x, e.z, 0.8), pan: pan(e.x, e.z), gap: 0.5 });
            else ui.audio.play(e.squad.def.irregular || e.squad.clsName === 'LightInf' ? 'run' : 'attack', { vol: vol(e.x, e.z, 0.7), pan: pan(e.x, e.z), gap: 0.8 });
            break;
          case 'rout':
            if (e.side === 0) { this.feed(e.squad.name + ' бежит!', 'bad'); ui.audio.play('retreat', { vol: 0.7, gap: 0.6 }); }
            else { this.feed('Враг бежит: ' + e.squad.name, 'good'); ui.audio.play('rout', { vol: vol(e.x, e.z, 0.9), gap: 0.6 }); }
            break;
          case 'rallied':
            this.feed((e.side === 0 ? '' : 'Враг: ') + e.squad.name + ' вернулись в строй', e.side === 0 ? 'good' : '');
            break;
          case 'destroyed':
            if (e.side === 0) this.feed(e.squad.name + ' уничтожены', 'bad');
            break;
          case 'fled':
            if (e.side === 0) this.feed(e.squad.name + ' покинули поле боя', 'bad');
            break;
          case 'general':
            if (e.side === 0) { this.feed('Наш генерал пал! Приказы отдавать труднее.', 'bad'); ui.audio.play('retreat', { vol: 1 }); }
            else { this.feed('Вражеский генерал убит: ' + e.squad.name, 'good'); ui.audio.play('attack', { vol: 1 }); }
            break;
          case 'armyBreak':
            if (e.side === 0) { this.feed('Армия дрогнула и бежит!', 'bad'); ui.audio.play('retreat', { vol: 1 }); }
            else { this.feed('Строй врага сломлен, противник бежит!', 'good'); ui.audio.play('rout', { vol: 1 }); }
            break;
          case 'signal':
            if (e.side === 0) this.feed('Сигнал к наступлению!', 'good');
            else this.feed('Враг перешел в наступление');
            break;
          case 'rally':
            if (e.side === 0) { this.feed('Генерал воодушевляет войска', 'good'); ui.audio.play('rally', { vol: 0.9 }); }
            break;
          case 'retreat':
            if (e.side === 0) { this.feed('Отход!'); ui.audio.play('retreat', { vol: 0.8 }); }
            break;
          case 'reinforce':
            this.feed(e.text || 'К врагу подошло подкрепление', 'bad');
            ui.audio.play('attack', { vol: 0.7 });
            this.hudDirty = true;
            break;
          case 'escape':
            this.feed(e.squad.name + ' уходит с донесением! Не дайте ему покинуть поле.', 'bad');
            break;
          case 'favour':
            if (e.side === 0) this.feed(L.FAVOURS[e.kind].name + ': ' + e.squad.name, 'good');
            break;
          case 'nopoints':
            break;
          default:
            break;
        }
      }
    }

    feed(text, kind) {
      if (!this.feedEl) return;
      const d = h('div', { class: kind || '', text });
      this.feedEl.appendChild(d);
      setTimeout(() => d.remove(), 7000);
      while (this.feedEl.children.length > 5) this.feedEl.firstChild.remove();
    }

    ambient(dt) {
      const b = this.battle, r = this.renderer, ui = this.ui;
      const tx = r.cam.tx, tz = r.cam.tz;
      let fighting = 0, walking = 0, riding = 0;
      const R = 120 + r.cam.dist;
      for (const s of b.soldiers) {
        if (!s.alive) continue;
        const d = Math.abs(s.x - tx) + Math.abs(s.z - tz);
        if (d > R) continue;
        if (s.anim === 'fight' || s.anim === 'ready') fighting++;
        else if (s.anim === 'walk' || s.anim === 'run') { if (s.sq.cls.cav) riding++; else walking++; }
        if (s.sq.cls.cav && s.anim === 'run' && Math.random() < dt * 2.5) r.addDust(s.x, s.z, s.sq.clsName === 'Elephant' ? 5 : 3);
      }
      const near = L.clamp(220 / (r.cam.dist + 100), 0.3, 1);
      ui.audio.loopLevel('fight1', Math.min(1, fighting / 60) * near);
      ui.audio.loopLevel('fight2', Math.min(1, Math.max(0, fighting - 40) / 80) * near);
      ui.audio.loopLevel('infmove', Math.min(1, walking / 80) * near);
      ui.audio.loopLevel('cavmove', Math.min(1, riding / 20) * near);
      ui.audio.loopLevel('wind1', 0.6);
      ui.audio.loopLevel(this.level.night ? 'cricketloop' : 'wind2', 0.5);
      this.birdT -= dt;
      if (this.birdT <= 0) {
        this.birdT = 6 + Math.random() * 10;
        if (!this.level.night) ui.audio.play(fighting > 30 ? 'crows' : 'birds', { vol: 0.3, pan: Math.random() * 1.6 - 0.8 });
      }
    }

    onEnd() {
      const res = this.battle.result;
      this.hideHint();
      this.speed = 1;
      this.ui.audio.stopLoops();
      this.ui.audio.music(res.won ? 'won' : 'lost');
      this.feed(res.won ? 'Задание выполнено!' : 'Задание не выполнено!', res.won ? 'good' : 'bad');
    }

    reasonText(res) {
      const map = {
        objective: 'Задание выполнено.', enemyRouted: 'Вражеская армия разбита и бежит.', routed: 'Ваша армия бежала с поля боя.', keepGeneral: 'Наш генерал погиб.',
        losses: 'Потери превысили допустимые.', time: 'Время вышло.', timeout: 'Битва затянулась, войска отведены.', escape: 'Атер ушел с донесением к Бренну.', surrender: 'Вы сдали поле боя.'
      };
      return map[res.reason] || '';
    }

    showResults() {
      this.resultsShown = true;
      const ui = this.ui, res = this.battle.result, lv = this.level;
      let rewards = null;
      if (!this.params.quick && ui.profile) {
        rewards = L.Army.applyBattle(ui.profile, lv, res);
        ui.save();
      }
      const medalNames = ['Бронза', 'Серебро', 'Золото'];
      const medal = h('div', { class: 'medal' + (res.won ? '' : ' lost') }, [I.img(res.won ? I.medal(res.medal) : I.defeat(), 112), h('span', { text: res.won ? medalNames[res.medal] : 'Поражение' })]);
      const head = h('div', { class: 'lga-res-head' }, [medal, h('div', {}, [
        h('div', { class: 'lga-title', text: res.won ? 'Задание выполнено!' : 'Задание не выполнено!' }),
        h('div', { style: { font: '700 15px var(--serif)', color: 'var(--ink)', margin: '4px 0' }, text: lv.title }),
        h('div', { class: 'lga-dim', text: this.reasonText(res) + ' Время битвы ' + L.fmtTime(res.time) + '.' }),
        !res.won && !this.params.quick ? h('div', { class: 'lga-dim', style: { marginTop: '6px' }, text: 'Вы не сумели победить в этом сценарии. Счет и потери не сохранены, так что снова в бой!' }) : null
      ])]);
      const score = h('div', { class: 'lga-score' });
      const addS = (k, v, cls) => { score.append(h('span', { class: cls || '', text: k }), h('b', { class: cls || '', text: v })); };
      addS('Убито врагов', res.kills + ' из ' + res.enemyMen);
      addS('Наши потери', res.lost + ' из ' + res.playerMen);
      addS('Очки за убитых', '+' + res.killScore);
      addS('Сломленные отряды', '+' + res.routScore);
      if (res.bonus) addS('Задание выполнено' + (res.speed > 1.05 ? ', быстро' : res.speed < 0.95 ? ', долго' : ''), '+' + res.bonus);
      addS('Штраф за потери', '−' + res.lossScore);
      addS('Счет', String(res.score), 'tot');
      const left = h('div', {}, [h('div', { class: 'lga-h3', text: 'Итоги' }), score]);
      const medals = h('div', { class: 'lga-medals', style: { color: 'var(--ink-dim)' } }, [I.img(I.medal(1), 24), h('span', { text: 'Серебро от ' + res.medals[0] + ' очков' }), I.img(I.medal(2), 24), h('span', { text: 'Золото от ' + res.medals[1] + ' очков' })]);
      left.appendChild(medals);
      if (rewards && res.won) {
        const rw = h('div', { style: { marginTop: '10px' } }, [h('div', { class: 'lga-h3', text: 'Награда' }), h('div', { class: 'lga-reward' }, [h('span', {}, [I.img(I.glory(), 22), rewards.glory + ' славы']), h('span', {}, [I.img(I.denarii(), 22), rewards.denarii + ' динариев'])])]);
        if (rewards.favour) rw.appendChild(h('div', { class: 'lga-gain lga-good' }, [I.img(I.favour(rewards.favour), 26), 'Боги благосклонны: ' + L.FAVOURS[rewards.favour].name]));
        if (rewards.unlocked.length) rw.appendChild(h('div', { class: 'lga-gain lga-good' }, [glyph('plus', 20, '#a8d88a'), 'Можно нанимать: ' + rewards.unlocked.map(k => L.UNITS[k].name).join(', ')]));
        if (rewards.destroyed && rewards.destroyed.length) rw.appendChild(h('div', { class: 'lga-gain lga-bad' }, [glyph('cross', 18, '#ec907a'), 'Погибли все воины отрядов: ' + rewards.destroyed.join(', ')]));
        left.appendChild(rw);
      }
      const table = h('table', { class: 'lga-table' }, [h('tr', {}, ['Отряд', 'Убил', 'Потери', 'Опыт', ''].map(t => h('th', { text: t })))]);
      for (const s of res.squads) {
        const sq = ui.profile && ui.profile.squads.find(q => q.id === s.id);
        const up = res.won && sq && L.Army.canPromote(sq);
        table.appendChild(h('tr', {}, [h('td', { text: s.name }), h('td', { class: 'n', text: s.kills }), h('td', { class: 'n', text: s.lost }), h('td', { class: 'n', text: res.won || this.params.quick ? '+' + s.xp : '0' }), h('td', {}, up ? [glyph('chevron', 16, '#f4d992')] : [])]));
      }
      const right = h('div', {}, [h('div', { class: 'lga-h3', text: 'Отряды' }), table]);
      if (rewards && rewards.promotions.length) right.appendChild(h('div', { class: 'lga-gain lga-good' }, [glyph('chevron', 18, '#f4d992'), 'Отряды заслужили награды. Выберите навыки в лагере.']));
      const foot = h('div', { class: 'lga-modal-foot' });
      if (this.params.quick) {
        foot.append(ui.btn('Новая битва', () => ui.go('arena')), ui.btn('Главное меню', () => ui.go('menu'), { cls: 'primary' }));
      } else {
        foot.append(ui.btn('Переиграть', () => ui.go('field', { level: lv })), ui.btn('В лагерь', () => ui.go('camp'), { cls: 'primary big' }));
      }
      const box = h('div', { class: 'lga-res lga-panel' }, [head, h('div', { class: 'lga-res-body' }, [left, right]), foot]);
      this.hudEl.appendChild(h('div', { class: 'lga-results' }, [box]));
    }

    updateOverlay() {
      const r = this.renderer;
      r.overlay.arrows = [];
      r.overlay.rings = [];
      if (this.mode === 'battle') {
        for (const s of this.sel) {
          if (s.side !== 0 || s.alive <= 0) continue;
          if (s.order && s.order.type === 'move') r.overlay.arrows.push({ pts: [[s.cx, s.cz]].concat(s.path || [[s.order.x, s.order.z]]), col: [0.55, 0.95, 0.45, 0.65], w: 0.6 });
          const t = s.target || (s.order && s.order.target);
          if (t && t.alive > 0) r.overlay.arrows.push({ pts: [[s.cx, s.cz], [t.cx, t.cz]], col: [1, 0.35, 0.25, 0.65], w: 0.6 });
        }
        const g = this.battle.sides[0].general;
        if (g && this.sel.has(g) && g.alive > 0) r.overlay.rings.push({ x: g.cx, z: g.cz, r: this.battle.sides[0].leaderR, col: [1, 0.86, 0.3, 0.35], w: 0.5 });
      }
      if (this.dragMove) r.overlay.arrows.push({ pts: [this.dragMove.from, this.dragMove.to], col: [0.55, 0.95, 0.45, 0.9], w: 1.2 });
    }

    updateBanners() {
      const r = this.renderer, b = this.battle;
      const seen = new Set();
      for (const s of b.squads) {
        if (!s.onField || s.alive <= 0 || s.state === 'fled' || s.state === 'absent') continue;
        const x = this.mode === 'deploy' ? s.ax : s.cx, z = this.mode === 'deploy' ? s.az : s.cz;
        if (x == null) continue;
        const top = b.terrain.heightAt(x, z) + (s.cls.cav ? 5 : 3.6) + (s.clsName === 'Elephant' ? 3 : 0);
        const p = r.project(x, top, z);
        let bn = this.banners.get(s);
        if (!p || p[0] < -40 || p[1] < -40 || p[0] > this.canvas.clientWidth + 40 || p[1] > this.canvas.clientHeight + 40) {
          if (bn) bn.el.style.display = 'none';
          continue;
        }
        if (!bn) {
          const el = h('div', { class: 'lga-ban p' + s.side }, [h('div', { class: 'flag' }), h('div', { class: 'str' }, [h('i')]), h('div', { class: 'pole' })]);
          el.addEventListener('pointerdown', e => {
            e.stopPropagation();
            if (e.button === 0) {
              if (s.side === 0) this.select(s, e.shiftKey || e.ctrlKey);
              else if (this.mode === 'battle' && this.selected().some(q => q.side === 0)) this.order({ type: 'attack', target: s });
            } else if (e.button === 2 && this.mode === 'battle' && s.side === 1) this.order({ type: 'attack', target: s });
          });
          el.addEventListener('mouseenter', ev => { r.overlay.hover = s; this.ui.showTip(ev, this.squadTip(s)); });
          el.addEventListener('mousemove', ev => this.ui.moveTip(ev));
          el.addEventListener('mouseleave', () => { if (r.overlay.hover === s) r.overlay.hover = null; this.ui.hideTip(); });
          this.bannerEl.appendChild(el);
          bn = { el, flag: el.querySelector('.flag'), bar: el.querySelector('.str i'), last: '' };
          this.banners.set(s, bn);
        }
        seen.add(s);
        bn.el.style.display = '';
        bn.el.style.left = Math.round(p[0]) + 'px';
        bn.el.style.top = Math.round(p[1]) + 'px';
        const idx = s.side === 0 ? this.squadsOf(0).filter(q => q.onField).indexOf(s) + 1 : 0;
        const label = s.general ? '★' : s.side === 0 ? String(idx) : (L.UNITS[s.key].name[0]);
        const frac = (this.mode === 'deploy' ? s.men0 : s.alive) / s.menMax;
        const key = label + '|' + Math.round(frac * 40) + '|' + s.state + '|' + this.sel.has(s) + '|' + s.cohesion;
        if (key !== bn.last) {
          bn.last = key;
          bn.flag.textContent = label;
          bn.bar.style.width = Math.round(frac * 100) + '%';
          bn.bar.style.background = COHESION[s.state === 'routing' ? 1 : s.cohesion || 4];
          bn.el.classList.toggle('sel', this.sel.has(s));
          bn.el.classList.toggle('rout', s.state === 'routing');
          bn.el.classList.toggle('small', r.cam.dist > 380);
        }
      }
      for (const [s, bn] of this.banners) {
        if (!seen.has(s)) { bn.el.remove(); this.banners.delete(s); }
      }
    }

    updateHud() {
      const b = this.battle;
      this.clockText.textContent = L.fmtTime(b.time);
      this.speedBtns.forEach((btn, i) => btn.classList.toggle('on', [0, 1, 2, 4][i] === this.speed));
      b.objectiveStatus().forEach((o, i) => {
        const c = this.objChips[i];
        if (!c) return;
        c.text.textContent = o.text;
        c.chip.classList.toggle('done', !!o.done);
        c.chip.classList.toggle('fail', !!o.failed);
        if (c.bar) c.bar.firstChild.style.width = Math.round(o.progress * 100) + '%';
      });
      const side = b.sides[0];
      const cp = this.cpEl;
      cp.querySelector('i').style.width = (side.cp / side.cpMax * 100) + '%';
      const cost = this.cpCostSel();
      const mark = cp.querySelector('b');
      mark.style.display = cost ? 'block' : 'none';
      mark.style.left = Math.min(100, cost / side.cpMax * 100) + '%';
      cp.querySelector('span').textContent = Math.floor(side.cp) + ' / ' + Math.round(side.cpMax) + (cost ? '  ·  приказ ' + cost : '');
      this.gSignal.classList.toggle('off', side.cp < L.COSTS.signal);
      this.gRally.classList.toggle('off', side.cp < L.COSTS.rally || side.generalDead);
      this.gRetreat.classList.toggle('off', side.cp < L.COSTS.retreat);
      for (const it of this.stripItems) {
        const s = it.s;
        const gone = s.alive <= 0 || s.state === 'fled';
        it.el.classList.toggle('sel', this.sel.has(s));
        it.el.classList.toggle('rout', s.state === 'routing');
        it.el.classList.toggle('dead', gone);
        it.hp.style.width = (s.alive / s.menMax * 100) + '%';
        it.mo.style.width = (gone ? 0 : L.clamp(s.morale / s.moraleMax, 0, 1) * 100) + '%';
        it.mo.style.background = COHESION[s.state === 'routing' ? 1 : s.cohesion || 4];
        const st = gone ? 'destroyed' : s.state;
        if (st !== it.state) {
          it.state = st;
          const g = STATE_ICON[st] || ['star', '#e3d3ae'];
          it.stt.innerHTML = '';
          it.stt.appendChild(glyph(g[0], 11, g[1]));
          it.stt.title = L.STATE_NAMES[st] || '';
        }
      }
      this.renderSelPanel();
    }

    renderSelPanel() {
      const ui = this.ui, b = this.battle;
      const list = this.selected();
      const el = this.selEl;
      const s = list[0];
      const sig = s ? [s.id, s.form, s.doctrine, s.state, s.alive, Math.round(s.morale / s.moraleMax * 20), list.length, Math.floor(b.sides[0].cp / 500), s.favour].join('|') : 'none';
      if (sig === this.selSig) return;
      this.selSig = sig;
      el.innerHTML = '';
      if (!s) {
        el.append(h('div', {}), h('div', { class: 'lga-dim', text: 'Выберите отряд: щелчок по воинам, знамени или карточке. Рамкой можно выбрать несколько.' }));
        return;
      }
      const enemy = s.side === 1;
      const pic = h('div', { class: 'pic', style: { backgroundImage: 'url(' + L.portrait(s.key) + ')' } });
      const info = h('div', {});
      info.append(h('div', { class: 'nm' }, [I.img(I.cls(s.clsName, enemy ? '#a9c0f0' : '#f4d992'), 16), list.length > 1 ? 'Выбрано отрядов: ' + list.length : s.name]), h('div', { class: 'st', text: (enemy ? 'Противник, ' : '') + L.UNITS[s.key].name + ', ур. ' + s.level + '. ' + L.STATE_NAMES[s.state] + (s.favour ? '. ' + L.FAVOURS[s.favour].name : '') }));
      const kv = (g, k, frac, v, cls) => h('div', { class: 'kv' }, [glyph(g, 14), h('span', { class: 'lga-dim', text: k }), h('div', { class: 'lga-bar ' + (cls || '') }, [h('i', { style: { width: Math.round(L.clamp(frac, 0, 1) * 100) + '%' } })]), h('b', { text: v })]);
      info.append(kv('soldier', 'Люди', s.alive / s.menMax, s.alive + '/' + s.menMax), kv('banner', 'Дух', s.morale / s.moraleMax, Math.max(0, Math.round(s.morale / s.moraleMax * 100)) + '%', 'mo'));
      if (s.def.fire) {
        const ammo = s.soldiers.reduce((a, q) => a + (q.alive ? q.ammo : 0), 0);
        info.appendChild(kv('arrows', 'Снаряды', ammo / Math.max(1, s.alive * s.stats.shots), String(ammo), 'xp'));
      }
      if (!enemy && s.state !== 'routing') {
        const cost = b.orderCost(s);
        const fr = h('div', { class: 'lga-row-btns' }, [h('span', { class: 'lbl', text: 'Строй' })]);
        for (const f of this.formsFor(s)) {
          const btn = h('button', { class: 'lga-form' + (s.form === f ? ' on' : ''), type: 'button', style: { backgroundImage: 'url(' + this.formIcon(s, f) + ')' } });
          btn.addEventListener('click', () => { ui.audio.ui(); this.order({ type: 'form', form: f }); });
          ui.tip(btn, this.formTip(f) + '<br>Цена: ' + cost + ' очк.');
          fr.appendChild(btn);
        }
        const act = h('div', { class: 'lga-row-btns' }, [h('span', { class: 'lbl', text: 'Приказ' })]);
        const actBtn = (img, name, cmd, tip, off) => {
          const btn = h('button', { class: 'lga-ord' + (off ? ' off' : ''), type: 'button', style: { backgroundImage: 'url(' + L.uiImg(img) + ')' } });
          btn.addEventListener('click', () => { if (off) return; ui.audio.ui(); this.order(cmd); });
          ui.tip(btn, '<b>' + name + '</b> · ' + cost + ' очк.<br>' + tip);
          act.appendChild(btn);
        };
        actBtn('battle/halt.png', 'Стоять', { type: 'halt' }, 'Остановиться и держать позицию до сигнала. Клавиша H.');
        actBtn('battle/charge.png', 'Атака', { type: 'charge' }, 'Бегом на ближайшего врага с натиском. Клавиша C.');
        if (s.cls.cav) actBtn('battle/disengage.png', 'Выйти из боя', { type: 'disengage' }, 'Конница отходит на 70 м, чтобы снова ударить с разгона. Клавиша X.');
        for (const k of ['advance', 'envelop', 'outflank', 'seek', 'holdfire']) {
          const d = L.DOCTRINES[k];
          actBtn('orders/order' + d.icon + (s.doctrine === k ? '-on' : '') + '.png', d.name, { type: 'doctrine', doctrine: k }, d.desc);
        }
        info.append(fr, act);
      } else if (enemy) {
        const role = L.ROLES[s.def.type];
        if (role) info.appendChild(h('div', { class: 'lga-dim', style: { fontSize: '11px', marginTop: '4px' }, html: '<span class="lga-good">+</span> ' + role.good + '<br><span class="lga-bad">−</span> ' + role.bad }));
      }
      el.append(pic, info);
    }

    bindMinimap() {
      const go = e => {
        const r = this.miniCanvas.getBoundingClientRect();
        const s = this.battle.terrain.size;
        this.renderer.focus((e.clientX - r.left) / r.width * s, (e.clientY - r.top) / r.height * s);
      };
      this.miniCanvas.addEventListener('pointerdown', e => {
        e.stopPropagation();
        if (e.button === 2 && this.mode === 'battle') {
          const r = this.miniCanvas.getBoundingClientRect();
          const s = this.battle.terrain.size;
          const x = (e.clientX - r.left) / r.width * s, z = (e.clientY - r.top) / r.height * s;
          this.moveOrder(x, z, null);
          return;
        }
        go(e);
        this.miniDrag = true;
      });
      this.miniCanvas.addEventListener('pointermove', e => { if (this.miniDrag) go(e); });
      window.addEventListener('pointerup', () => { this.miniDrag = false; });
    }

    drawMinimap() {
      const cv = this.miniCanvas;
      if (!cv) return;
      const c = cv.getContext('2d');
      const W = cv.width, H = cv.height;
      const b = this.battle, r = this.renderer;
      const size = b.terrain.size;
      if (!this.miniBase) {
        const base = document.createElement('canvas');
        base.width = W; base.height = H;
        const bc = base.getContext('2d');
        bc.drawImage(r.mapTex.macro, 0, 0, W, H);
        if (this.level.night) { bc.fillStyle = 'rgba(10,15,40,0.45)'; bc.fillRect(0, 0, W, H); }
        this.miniBase = base;
      }
      c.drawImage(this.miniBase, 0, 0);
      const k = W / size;
      for (const s of b.squads) {
        if (!s.onField || s.alive <= 0 || s.state === 'fled') continue;
        c.save();
        c.translate(s.cx * k, s.cz * k);
        c.rotate(-s.face);
        c.fillStyle = s.state === 'routing' ? '#bbb' : s.side === 0 ? (this.sel.has(s) ? '#ffe070' : '#e03a2a') : '#4a78ff';
        const w = Math.max(3, s.width * k), d = Math.max(2, s.depth * k);
        c.fillRect(-w / 2, -d / 2, w, d);
        c.restore();
      }
      const cam = r.cam;
      c.strokeStyle = 'rgba(255,255,255,0.8)';
      c.lineWidth = 1;
      const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw);
      const dist = cam.dist * 1.2;
      const rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
      const cx = cam.tx, cz = cam.tz;
      const pts = [[cx - rx * dist * 0.6 + fx * dist * 0.4, cz - rz * dist * 0.6 + fz * dist * 0.4], [cx + rx * dist * 0.6 + fx * dist * 0.4, cz + rz * dist * 0.6 + fz * dist * 0.4], [cx + rx * dist * 1.1 - fx * dist, cz + rz * dist * 1.1 - fz * dist], [cx - rx * dist * 1.1 - fx * dist, cz - rz * dist * 1.1 - fz * dist]];
      c.beginPath();
      pts.forEach((p, i) => (i ? c.lineTo(p[0] * k, p[1] * k) : c.moveTo(p[0] * k, p[1] * k)));
      c.closePath();
      c.stroke();
    }

    pickSquad(e) {
      const r = this.renderer, b = this.battle;
      const g = r.pickGround(e.clientX, e.clientY);
      if (!g) return null;
      let best = null, bd = 16;
      if (this.mode === 'deploy') {
        for (const s of b.squads) {
          if (!s.onField) continue;
          const c = Math.cos(s.face), sn = Math.sin(s.face);
          const dx = g[0] - s.ax, dz = g[2] - s.az;
          const lx = c * dx - sn * dz, lz = sn * dx + c * dz;
          if (Math.abs(lx) < s.width / 2 + 2 && Math.abs(lz) < s.depth / 2 + 2) {
            const d = Math.hypot(lx, lz);
            if (d < bd + 20) { bd = d; best = s; }
          }
        }
        return best ? { s: best, g } : { s: null, g };
      }
      let bestSoldier = 3.2 * 3.2;
      b.query(g[0], g[2], 4, o => {
        if (!o.alive) return;
        const d2 = (o.x - g[0]) ** 2 + (o.z - g[2]) ** 2;
        if (d2 < bestSoldier) { bestSoldier = d2; best = o.sq; }
      });
      return { s: best, g };
    }

    bindCanvas() {
      const cv = this.canvas;
      cv.addEventListener('pointerdown', e => this.onDown(e));
      cv.addEventListener('pointermove', e => this.onMove(e));
      cv.addEventListener('pointerup', e => this.onUp(e));
      cv.addEventListener('pointerleave', () => { if (this.mouse) this.mouse.inside = false; });
      cv.addEventListener('pointerenter', () => { if (this.mouse) this.mouse.inside = true; });
      cv.addEventListener('wheel', e => {
        e.preventDefault();
        if (!this.renderer) return;
        this.renderer.zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12);
      }, { passive: false });
    }

    onDown(e) {
      if (!this.renderer || !this.battle || (this.mode !== 'deploy' && this.mode !== 'battle')) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.ui.hideTip();
      const pk = this.pickSquad(e);
      this.drag = { button: e.button, x: e.clientX, y: e.clientY, moved: false, pick: pk, shift: e.shiftKey || e.ctrlKey };
      if (e.button === 1) { this.drag.cam = { yaw: this.renderer.cam.yaw, pitch: this.renderer.cam.pitch }; return; }
      if (this.mode === 'deploy') {
        if (e.button === 0 && pk && pk.s && pk.s.side === 0) {
          this.select(pk.s);
          this.drag.squad = pk.s;
          this.drag.off = [pk.s.ax - pk.g[0], pk.s.az - pk.g[2]];
        } else if (e.button === 2) {
          const s = Array.from(this.sel)[0];
          if (s && s.side === 0) this.drag.rotate = s;
        }
      }
    }

    onMove(e) {
      this.mouse = { x: e.clientX, y: e.clientY, inside: true };
      const d = this.drag;
      if (!this.renderer || !this.battle) return;
      if (!d) {
        if (this.mode === 'deploy' || this.mode === 'battle') this.hoverInfo(e);
        return;
      }
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) d.moved = true;
      const r = this.renderer;
      if (d.cam) {
        r.cam.yaw = d.cam.yaw - (e.clientX - d.x) * 0.006;
        r.cam.pitch = L.clamp(d.cam.pitch + (e.clientY - d.y) * 0.004, 0.25, 1.45);
        return;
      }
      if (this.mode === 'deploy') {
        const g = r.pickGround(e.clientX, e.clientY);
        if (!g) return;
        if (d.squad && d.moved) {
          const zn = this.battle.sides[0].zone;
          const s = d.squad;
          const x = L.clamp(g[0] + d.off[0], zn[0] + 2, zn[2] - 2), z = L.clamp(g[2] + d.off[1], zn[1] + 2, zn[3] - 2);
          if (this.battle.terrain.passable(x, z, s.clsName)) {
            this.battle.placeSquad(s, x, z, s.face);
            this.checkOverlaps();
          }
        } else if (d.rotate && d.moved) {
          const s = d.rotate;
          const face = Math.atan2(g[0] - s.ax, g[2] - s.az);
          this.battle.placeSquad(s, s.ax, s.az, face);
          this.checkOverlaps();
        } else if (d.button === 0 && !d.squad && d.moved) {
          const sp = r.cam.dist / 500;
          r.moveCamera(-(e.movementX || 0) * sp, -(e.movementY || 0) * sp);
        }
        return;
      }
      if (this.mode === 'battle') {
        if (d.button === 0 && d.moved) {
          const rect = this.el.getBoundingClientRect();
          const x0 = Math.min(d.x, e.clientX) - rect.left, y0 = Math.min(d.y, e.clientY) - rect.top;
          Object.assign(this.boxEl.style, { display: 'block', left: x0 + 'px', top: y0 + 'px', width: Math.abs(e.clientX - d.x) + 'px', height: Math.abs(e.clientY - d.y) + 'px' });
        } else if (d.button === 2 && d.moved && d.pick && d.pick.g && !(d.pick.s && d.pick.s.side === 1)) {
          const g = r.pickGround(e.clientX, e.clientY);
          if (g) this.dragMove = { from: [d.pick.g[0], d.pick.g[2]], to: [g[0], g[2]] };
        }
      }
    }

    onUp(e) {
      const d = this.drag;
      this.drag = null;
      this.boxEl.style.display = 'none';
      if (!d || !this.battle) return;
      if (d.cam) return;
      if (this.mode === 'deploy') {
        if (d.squad || d.rotate) { this.renderPlan(); return; }
        if (d.button === 0 && !d.moved) {
          if (d.pick && d.pick.s && d.pick.s.side === 1) { this.renderer.overlay.hover = d.pick.s; }
          else this.select(null);
        }
        return;
      }
      if (this.mode !== 'battle') return;
      if (d.button === 0) {
        if (d.moved) this.boxSelect(d, e);
        else if (d.pick && d.pick.s) {
          if (d.pick.s.side === 0) this.select(d.pick.s, d.shift);
          else if (this.selected().some(s => s.side === 0) && e.altKey) this.order({ type: 'attack', target: d.pick.s });
          else this.select(d.pick.s, false);
        } else if (!d.shift) this.select(null);
      } else if (d.button === 2) {
        const move = this.dragMove;
        this.dragMove = null;
        if (d.pick && d.pick.s && d.pick.s.side === 1 && !d.moved) this.order({ type: 'attack', target: d.pick.s });
        else if (d.pick && d.pick.g) {
          const g = d.pick.g;
          const face = move && L.dist(move.from[0], move.from[1], move.to[0], move.to[1]) > 4 ? Math.atan2(move.to[0] - move.from[0], move.to[1] - move.from[1]) : null;
          this.moveOrder(g[0], g[2], face);
        }
      }
    }

    moveOrder(x, z, face) {
      const list = this.selected().filter(s => s.side === 0 && s.state !== 'routing');
      if (!list.length) return;
      const cx = list.reduce((a, s) => a + s.cx, 0) / list.length, cz = list.reduce((a, s) => a + s.cz, 0) / list.length;
      const ok = this.order(s => ({ type: 'move', x: L.clamp(x + (s.cx - cx), 10, this.battle.size - 10), z: L.clamp(z + (s.cz - cz), 10, this.battle.size - 10), face, run: s.cls.cav }));
      if (ok) this.renderer.overlay.rings = [{ x, z, r: 4, col: [0.55, 0.95, 0.45, 0.8] }];
    }

    boxSelect(d, e) {
      const x0 = Math.min(d.x, e.clientX), x1 = Math.max(d.x, e.clientX), y0 = Math.min(d.y, e.clientY), y1 = Math.max(d.y, e.clientY);
      const rect = this.canvas.getBoundingClientRect();
      if (!d.shift) this.sel.clear();
      for (const s of this.squadsOf(0)) {
        if (!s.onField || s.alive <= 0 || s.state === 'fled') continue;
        const p = this.renderer.project(s.cx, this.battle.terrain.heightAt(s.cx, s.cz) + 1, s.cz);
        if (!p) continue;
        const px = p[0] + rect.left, py = p[1] + rect.top;
        if (px >= x0 && px <= x1 && py >= y0 && py <= y1) this.sel.add(s);
      }
      this.hudDirty = true;
    }

    hoverInfo(e) {
      const r = this.renderer;
      const pk = this.pickSquad(e);
      r.overlay.hover = pk && pk.s ? pk.s : null;
      this.canvas.style.cursor = pk && pk.s ? (pk.s.side === 1 && this.mode === 'battle' && this.selected().some(s => s.side === 0) ? 'crosshair' : 'pointer') : 'default';
      if (this.mode === 'deploy' && pk && pk.g && this.terrainInfo) {
        const t = this.battle.terrain.typeAt(pk.g[0], pk.g[2]);
        const s = Array.from(this.sel)[0];
        let txt = L.TERRAIN[t].name;
        if (s) txt += ' · ' + s.name + ': ' + Math.round(L.CLASSES[s.clsName].eff[t]) + '% силы';
        this.terrainInfo.textContent = txt;
        this.terrainInfo.style.display = '';
      }
    }

    keydown(e) {
      this.keys[e.code] = true;
      const b = this.battle;
      if (!b) return false;
      if (e.code === 'Escape') {
        if (this.mode === 'battle') { this.pauseMenu(); return true; }
        return false;
      }
      if (e.code === 'KeyT') { this.toggleTypes(); return true; }
      if (e.code === 'Tab') {
        const list = this.squadsOf(0).filter(s => s.onField && s.alive > 0 && s.state !== 'fled');
        if (list.length) {
          const cur = list.indexOf(Array.from(this.sel)[0]);
          const s = list[(cur + (e.shiftKey ? list.length - 1 : 1)) % list.length];
          this.select(s);
          this.renderer.focus(this.mode === 'deploy' ? s.ax : s.cx, this.mode === 'deploy' ? s.az : s.cz);
        }
        return true;
      }
      if (e.code === 'KeyF') {
        const s = Array.from(this.sel)[0];
        if (s) this.renderer.focus(this.mode === 'deploy' ? s.ax : s.cx, this.mode === 'deploy' ? s.az : s.cz);
        return true;
      }
      if (e.code === 'Home') {
        const g = b.sides[0].general;
        if (g && g.alive > 0) this.renderer.focus(g.cx || g.ax, g.cz || g.az);
        return true;
      }
      if (this.mode === 'deploy') {
        const s = Array.from(this.sel)[0];
        if (s && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
          this.battle.setForm(s, ['attack', 'balanced', 'defend'][+e.code.slice(5) - 1]);
          this.checkOverlaps();
          this.renderPlan();
          return true;
        }
        if (e.code === 'Enter') { this.startBattle(); return true; }
        return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);
      }
      if (this.mode !== 'battle') return false;
      switch (e.code) {
        case 'Space': this.setSpeed(this.speed === 0 ? 1 : 0); return true;
        case 'Equal': case 'NumpadAdd': this.setSpeed(this.speed >= 4 ? 4 : this.speed === 0 ? 1 : this.speed * 2); return true;
        case 'Minus': case 'NumpadSubtract': this.setSpeed(this.speed <= 1 ? 1 : this.speed / 2); return true;
        case 'KeyG': this.doSignal(); return true;
        case 'KeyR': this.doRally(); return true;
        case 'KeyH': this.order({ type: 'halt' }); return true;
        case 'KeyC': this.order({ type: 'charge' }); return true;
        case 'KeyX': this.order({ type: 'disengage' }); return true;
        case 'Digit1': case 'Digit2': case 'Digit3': this.order({ type: 'form', form: ['attack', 'balanced', 'defend'][+e.code.slice(5) - 1] }); return true;
        default: return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);
      }
    }

    keyup(e) {
      this.keys[e.code] = false;
    }

    blur() {
      this.keys = {};
    }

    showHint(step) {
      const HINTS = [
        { text: '<b>План битвы.</b> Ваши отряды стоят в желтой зоне, крестьяне ждут в полях. Перетащите отряд левой кнопкой мыши, правой - разверните его.', at: 'left' },
        { text: '<b>Строй и приказ.</b> Внизу выберите строй и приказ. Приказ - это то, что отряд сделает сам, без вашего участия. «Пауза» держит отряд до сигнала.', at: 'plan' },
        { text: '<b>Готово?</b> Застрельщиков поставьте впереди, разведчиков на фланг. Нажмите «В бой!».', at: 'top' },
        { text: '<b>Очки приказов.</b> Зеленая полоса внизу пополняется медленно. Каждый приказ в бою стоит очков, поэтому хороший план важнее спешки.', at: 'battle' },
        { text: '<b>Сигнал.</b> Отряды с приказом «Пауза» ждут. Нажмите «Сигнал» (G), чтобы армия двинулась вперед.', at: 'battle' },
        { text: '<b>Ручное управление.</b> Выделите отряд и щелкните правой кнопкой по врагу, чтобы атаковать, или по земле, чтобы идти туда. Пробел - пауза.', at: 'battle' }
      ];
      this.hideHint();
      const hi = HINTS[step];
      if (!hi) return;
      const ui = this.ui;
      const el = h('div', { class: 'lga-hint', html: hi.text });
      const pos = { left: { left: '300px', top: '110px' }, plan: { left: '300px', top: '110px' }, top: { right: '240px', top: '100px' }, battle: { right: '16px', top: '96px' } }[hi.at];
      Object.assign(el.style, pos);
      const last = step === 2 || step === 5;
      el.appendChild(h('div', { class: 'row' }, [
        h('span', { text: 'Подсказка ' + (step % 3 + 1) + ' из 3' }),
        h('div', { style: { display: 'flex', gap: '6px' } }, [
          ui.btn('Скрыть подсказки', () => { ui.opts.hints = false; ui.saveOpts(); this.hideHint(); }, { cls: 'small' }),
          ui.btn(last ? 'Понятно' : 'Дальше', () => (last ? this.hideHint() : this.showHint(step + 1)), { cls: 'small primary' })
        ])
      ]));
      this.hintEl = el;
      this.hudEl.appendChild(el);
    }

    hideHint() {
      if (this.hintEl) this.hintEl.remove();
      this.hintEl = null;
    }
  }

  L.Screens.field = FieldScreen;
})(globalThis.Legion = globalThis.Legion || {});
