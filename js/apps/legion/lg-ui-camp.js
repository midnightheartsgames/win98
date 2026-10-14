(function (L) {
  'use strict';

  const h = L.h;
  const I = L.Icons;
  const CAT_NAMES = { att: 'Атака', def: 'Защита', hp: 'Выносливость', mo: 'Боевой дух', shot: 'Стрельба', form: 'Строй', cmd: 'Командование' };
  const CAT_ORDER = ['att', 'def', 'hp', 'mo', 'shot', 'form', 'cmd'];
  const STAT_GROUPS = [
    ['Ближний бой', [['hit', 'Атака', 40], ['dm', 'Урон', 50], ['crit', 'Критич. удар, %', 50], ['cc', 'Устрашение', 25]]],
    ['Защита', [['ar', 'Броня', 40], ['ag', 'Ловкость', 60], ['sa', 'Защита от снарядов', 30], ['hp', 'Здоровье', 60]]],
    ['Дух и натиск', [['mo', 'Боевой дух', 500], ['speed', 'Скорость, м/с', 3.5], ['tr', 'Растаптывание', 100], ['ta', 'Уклон от растапт.', 100], ['oc', 'Цена приказа', 10000]]]
  ];
  const SHOT_ROWS = [['sh', 'Меткость', 60], ['sd', 'Урон снарядом', 30], ['shots', 'Боезапас', 25], ['range', 'Дальность, м', 90]];
  const LEAD_ROWS = [['op', 'Очки приказов', 30000], ['og', 'Восстановление, %', 60], ['lr', 'Радиус лидерства, м', 130]];
  const LABELS = {
    hit: 'Атака', dm: 'Урон', ar: 'Броня', ag: 'Ловкость', mo: 'Боевой дух', hp: 'Здоровье', cc: 'Устрашение', sa: 'Защита от снарядов', sh: 'Меткость', sd: 'Урон снарядом',
    crit: 'Критич. удар, %', pierce: 'Пробивание брони, %', shots: 'Боезапас', range: 'Дальность, м', oc: 'Цена приказа', op: 'Очки приказов', og: 'Восстановление', lr: 'Лидерство',
    tr: 'Растаптывание', ta: 'Уклон от растапт.', vsCav: 'Крит. по кавалерии, %', vsInf: 'Крит. по пехоте, %', vsEle: 'Крит. по слонам, %', defCav: 'Уклон от кавалерии, %',
    defInf: 'Уклон от пехоты, %', speed: 'Скорость, %'
  };
  const FX_NAMES = { ar: 'броня', dm: 'урон', cc: 'устрашение', ag: 'ловкость', hit: 'атака', sh: 'меткость', sa: 'защита от снарядов', sd: 'урон снарядом', mo: 'боевой дух', hp: 'здоровье', crit: 'критич. удар %', shots: 'боезапас', range: 'дальность', oc: 'цена приказа', op: 'очки приказов', og: 'восстановление приказов', lr: 'лидерство', tr: 'растаптывание', ta: 'уклон от растаптывания', vsCav: 'крит. по кавалерии %', vsInf: 'крит. по пехоте %', vsEle: 'крит. по слонам %', defCav: 'уклон от кавалерии %', defInf: 'уклон от пехоты %' };
  const RECRUIT_FILTERS = [['all', 'Все', null], ['inf', 'Пехота', 'shield'], ['shoot', 'Стрелки', 'bow'], ['cav', 'Конница', 'horse'], ['ele', 'Слоны', 'elephant']];
  const FILTER_TYPES = { inf: ['LightInf', 'HeavyInf'], shoot: ['Skirmisher', 'Archer'], cav: ['LightCav', 'HeavyCav'], ele: ['Elephant'] };

  const unlockedBy = key => L.LEVELS.find(l => (l.unlocks || []).includes(key));
  const pips = (n, on) => {
    const el = h('span', { class: 'lga-pips' });
    for (let i = 0; i < n; i++) el.appendChild(h('i', { class: i < on ? 'on' : '' }));
    return el;
  };
  const notch = (n, on) => {
    const el = h('span', { class: 'lga-notch' });
    for (let i = 0; i < n; i++) el.appendChild(h('i', { class: i < on ? (i >= 3 ? 'on gold' : 'on') : '' }));
    return el;
  };
  const glyph = (name, size, color) => I.img(I.ui(name, { color: color || '#e3d3ae' }), size);
  const gauge = (frac, text, cls, ticks) => {
    const el = h('div', { class: 'lga-gauge' + (cls ? ' ' + cls : '') }, [h('i', { style: { width: Math.round(L.clamp(frac, 0, 1) * 100) + '%' } })]);
    for (let i = 1; i < (ticks || 0); i++) el.appendChild(h('b', { style: { left: (i / ticks * 100) + '%' } }));
    el.appendChild(h('span', { text }));
    return el;
  };

  class CampScreen {
    constructor(ui) {
      this.ui = ui;
      this.el = h('div', { class: 'lga-camp' });
      this.tab = 'skills';
    }

    show(p) {
      const ui = this.ui;
      if (!ui.profile) { ui.go('menu'); return; }
      ui.audio.music('menu');
      if (p.select) this.selId = p.select;
      if (!this.selId || !ui.profile.squads.some(s => s.id === this.selId)) this.selId = ui.profile.squads[0].id;
      this.build();
      if (p.fresh) this.welcome();
    }

    destroy() {
      if (this.preview) this.preview.destroy();
      this.preview = null;
    }

    sel() {
      return this.ui.profile.squads.find(s => s.id === this.selId);
    }

    build() {
      const ui = this.ui;
      this.el.innerHTML = '';
      const p = ui.profile;
      const hurtCost = p.squads.reduce((a, s) => a + L.Army.replenishCost(s), 0);
      const promo = p.squads.filter(s => L.Army.canPromote(s)).length;
      const bar = L.topbar(ui, 'Лагерь', [
        ui.btn('Набрать', () => this.recruit(), { icon: I.ui('plus', { color: '#f4d992' }), tip: '<b>Набрать отряд</b><br>Нанять новый отряд за славу' }),
        ui.btn('Пополнить', () => this.replenishAll(), { icon: I.ui('heart', { color: '#f0a08a' }), disabled: !hurtCost, tip: hurtCost ? '<b>Пополнить все отряды</b><br>Восполнить потери, начиная с самых поредевших. Нужно ' + hurtCost + ' славы.' : 'Все отряды полного состава' }),
        ui.btn(null, () => ui.go('codex', { back: 'camp' }), { icon: I.ui('book', { color: '#e3d3ae' }), tip: 'Энциклопедия: отряды, навыки, снаряжение, правила' }),
        ui.btn('Меню', () => ui.go('menu'), { icon: I.ui('scroll', { color: '#e3d3ae' }), tip: 'Главное меню' }),
        ui.btn('Кампания', () => ui.go('campaign'), { cls: 'primary big', tip: promo ? 'В армии есть отряды, готовые к повышению' : null })
      ]);
      this.rosterCap = h('div', { class: 'lga-cap' });
      this.rosterList = h('div', { class: 'lga-roster-list' });
      this.rosterFoot = h('div', { class: 'lga-roster-foot' });
      const roster = h('div', { class: 'lga-roster lga-panel' }, [this.rosterCap, this.rosterList, this.rosterFoot]);
      if (!this.canvas) this.canvas = h('canvas');
      this.stageHead = h('div', { class: 'lga-stage-head' });
      this.swatches = h('div', { class: 'lga-stage-swatches' });
      this.stageFoot = h('div', { class: 'lga-stage-foot' });
      this.consoleEl = h('div', { class: 'lga-console' });
      this.descEl = h('div', { class: 'lga-desc' });
      const stage = h('div', { class: 'lga-stage lga-panel' }, [h('div', { class: 'lga-stage-view' }, [this.canvas, this.stageHead, this.swatches]), this.stageFoot, this.consoleEl, this.descEl]);
      this.tabsEl = h('div', { class: 'lga-tabs' });
      this.tabBody = h('div', { class: 'lga-tabbody' });
      const side = h('div', { class: 'lga-side lga-panel' }, [this.tabsEl, this.tabBody]);
      this.el.append(bar, h('div', { class: 'lga-camp-grid' }, [roster, stage, side]));
      if (!this.preview) {
        try { this.preview = new L.Preview(this.canvas); } catch (e) { this.preview = null; }
      }
      this.renderRoster();
      this.renderSquad();
    }

    renderRoster() {
      const ui = this.ui, p = ui.profile;
      this.rosterCap.innerHTML = '';
      this.rosterCap.append(h('span', { text: p.army }), h('small', { text: p.squads.length + ' из ' + L.ARMY_MAX }));
      this.rosterList.innerHTML = '';
      let men = 0, max = 0, cost = 0, ready = 0;
      for (const s of p.squads) {
        const mx = L.Army.maxMen(s);
        men += s.men;
        max += mx;
        cost += L.Army.replenishCost(s);
        const up = L.Army.canPromote(s);
        if (up) ready++;
        const next = L.Army.nextLevelXp(s);
        const prevXp = s.level > 1 ? L.XP_LEVELS[s.level - 2] : 0;
        const xpFrac = next ? L.clamp((s.xp - prevXp) / (next - prevXp), 0, 1) : 1;
        const u = L.UNITS[s.key];
        const flags = h('div', { class: 'flags' }, [h('span', { class: 'lga-lvl', text: String(s.level) })]);
        if (up) flags.appendChild(glyph('chevron', 18, '#f4d992'));
        else if (s.men < mx) flags.appendChild(h('span', { class: 'lga-flag-hurt' }, [glyph('heart', 12, '#f0a08a'), String(mx - s.men)]));
        const row = h('div', { class: 'lga-row' + (s.id === this.selId ? ' sel' : '') + (up ? ' up' : '') }, [
          h('div', { class: 'pic', style: { backgroundImage: 'url(' + L.card(s.key) + ')' } }),
          h('div', { style: { minWidth: 0 } }, [
            h('div', { class: 'nm', text: s.name }),
            h('div', { class: 'ty' }, [I.img(I.cls(u.type), 13), u.name]),
            h('div', { class: 'bars' }, [
              h('div', { class: 'lga-bar' + (s.men < mx ? ' red' : '') }, [h('i', { style: { width: Math.round(s.men / mx * 100) + '%' } })]),
              h('div', { class: 'lga-bar xp' }, [h('i', { style: { width: Math.round(xpFrac * 100) + '%' } })])
            ])
          ]),
          flags
        ]);
        row.addEventListener('click', () => this.select(s.id));
        ui.tip(row, () => '<b>' + L.esc(s.name) + '</b><br>' + L.esc(u.name) + ', ' + L.CLASSES[u.type].name.toLowerCase() + '<hr>Людей: ' + s.men + ' из ' + mx + '<br>Уровень ' + s.level + ', опыт ' + Math.floor(s.xp) + (next ? ' из ' + next : '') + (up ? '<br><span class="lga-good">Можно повысить</span>' : '') + (s.men < mx ? '<br>Пополнение: ' + L.Army.replenishCost(s) + ' славы' : ''));
        this.rosterList.appendChild(row);
      }
      this.rosterFoot.innerHTML = '';
      this.rosterFoot.append(h('div', {}, ['В строю ', h('b', { text: String(men) }), ' из ' + max + ' воинов']));
      if (cost) this.rosterFoot.appendChild(h('div', {}, ['Пополнить всех: ', h('b', { text: cost + ' славы' })]));
      if (ready) this.rosterFoot.appendChild(h('div', { class: 'lga-good', text: 'Готовы к повышению: ' + ready }));
    }

    select(id) {
      if (this.selId === id) return;
      this.selId = id;
      this.ui.audio.ui();
      this.renderRoster();
      this.renderSquad();
    }

    cycle(dir) {
      const list = this.ui.profile.squads;
      const i = list.findIndex(s => s.id === this.selId);
      this.select(list[(i + dir + list.length) % list.length].id);
      const row = this.rosterList.querySelector('.lga-row.sel');
      if (row) row.scrollIntoView({ block: 'nearest' });
    }

    renderSquad() {
      const ui = this.ui, p = ui.profile;
      const s = this.sel();
      if (!s) return;
      const u = L.UNITS[s.key];
      const max = L.Army.maxMen(s);
      this.stageHead.innerHTML = '';
      const name = h('div', { class: 'name', text: s.name });
      name.addEventListener('click', () => this.rename());
      ui.tip(name, 'Щелкните, чтобы переименовать отряд');
      this.stageHead.append(h('div', {}, [name, h('div', { class: 'type' }, [I.img(I.cls(u.type), 15), u.name + ', ' + L.CLASSES[u.type].name.toLowerCase() + ', ' + u.men + ' чел.'])]), h('div', { class: 'hint', text: 'Вращайте мышью' }));
      this.swatches.innerHTML = '';
      L.COLORS.forEach((c, i) => {
        const sw = h('button', { class: 'lga-swatch' + (s.color === i ? ' on' : ''), type: 'button', style: { background: c.css }, 'aria-label': c.name });
        sw.addEventListener('click', () => { s.color = i; ui.save(); ui.audio.ui(); this.renderSquad(); });
        ui.tip(sw, 'Расцветка: ' + c.name);
        this.swatches.appendChild(sw);
      });
      this.stageFoot.innerHTML = '';
      const hurt = s.men < max;
      const repl = L.Army.replenishCost(s);
      const menRight = u.leader ? h('span', { class: 'note', text: 'командующий' }) : hurt ? ui.btn('Пополнить', () => this.replenish(s), { cls: 'small', icon: I.ui('heart', { color: '#f0a08a' }), cost: { icon: I.glory(), n: repl }, disabled: p.glory < L.Army.replenishCostPerMan(s.key), tip: 'Нанять ' + (max - s.men) + ' новобранцев по ' + L.Army.replenishCostPerMan(s.key) + ' славы. Опыт отряда сохранится.' }) : h('span', { class: 'note', text: 'полный состав' });
      this.stageFoot.appendChild(h('div', { class: 'lga-gline' }, [glyph('soldier', 18), h('span', { class: 'k', text: 'Люди' }), gauge(s.men / max, s.men + ' / ' + max, hurt ? 'hurt' : '', max >= 24 ? max / 12 : 0), menRight]));
      const next = L.Army.nextLevelXp(s);
      const prevXp = s.level > 1 ? L.XP_LEVELS[s.level - 2] : 0;
      const can = L.Army.canPromote(s);
      const xpRight = can ? ui.btn('Повысить', () => this.promote(), { cls: 'small primary', icon: I.ui('chevron', { color: '#fff1b8' }) }) : h('span', { class: 'note', text: next ? 'уровень ' + s.level : 'высший уровень' });
      this.stageFoot.appendChild(h('div', { class: 'lga-gline' }, [glyph('laurel', 18), h('span', { class: 'k', text: 'Опыт' }), gauge(next ? (s.xp - prevXp) / (next - prevXp) : 1, next ? Math.floor(s.xp) + ' / ' + next : String(Math.floor(s.xp)), 'xp'), xpRight]));
      this.consoleEl.innerHTML = '';
      const many = p.squads.length > 1;
      this.consoleEl.append(
        ui.med(I.ui('chevron', { color: '#f4d992' }), () => this.cycle(-1), { cap: 'Назад', label: 'Предыдущий отряд', disabled: !many, cls: 'sm prev', tip: 'Предыдущий отряд (стрелка вверх)' }),
        ui.med(I.ui('quill', { color: '#f1e3c0' }), () => this.rename(), { cap: 'Имя', tip: 'Переименовать отряд' }),
        ui.med(I.ui('helmet', { color: '#f1e3c0' }), () => { this.tab = 'equip'; this.renderTabs(); }, { cap: 'Арсенал', tip: 'Снаряжение за динарии' }),
        ui.med(I.ui('laurel', { color: '#f1e3c0' }), () => (can ? this.promote() : (this.tab = 'skills', this.renderTabs())), { cap: can ? 'Наградить' : 'Навыки', cls: can ? 'hot' : '', tip: can ? 'Отряд готов к повышению: выберите навык' : 'Навыки отряда' }),
        ui.med(I.ui('cross', { color: '#f0a08a' }), () => this.disband(s), { cap: 'Распустить', disabled: !!u.leader, tip: u.leader ? 'Легата нельзя распустить' : 'Расформировать отряд' }),
        ui.med(I.ui('chevron', { color: '#f4d992' }), () => this.cycle(1), { cap: 'Далее', label: 'Следующий отряд', disabled: !many, cls: 'sm next', tip: 'Следующий отряд (стрелка вниз)' })
      );
      this.consoleEl.querySelector('.prev img').style.transform = 'rotate(-90deg)';
      this.consoleEl.querySelector('.next img').style.transform = 'rotate(90deg)';
      this.descEl.innerHTML = '';
      const more = h('button', { class: 'lga-link', type: 'button', text: 'История отряда' });
      more.addEventListener('click', () => { ui.audio.ui(); ui.go('codex', { back: 'camp', page: 'unit:' + s.key }); });
      this.descEl.append(u.desc + ' ', more);
      if (this.preview) this.preview.setUnit(s.key, s.color);
      this.renderTabs();
    }

    renderTabs() {
      const ui = this.ui;
      const s = this.sel();
      const can = L.Army.canPromote(s);
      const tabs = [['skills', 'Навыки', 'laurel'], ['equip', 'Снаряжение', 'helmet'], ['stats', 'Качества', 'soldier'], ['history', 'История', 'book']];
      this.tabsEl.innerHTML = '';
      for (const [k, n, g] of tabs) {
        const b = h('button', { class: 'lga-tab' + (this.tab === k ? ' on' : ''), type: 'button' }, [glyph(g, 22, k === 'skills' && can ? '#fff1b8' : '#e3d3ae'), h('span', { text: n })]);
        b.addEventListener('click', () => { this.tab = k; ui.audio.ui(); this.renderTabs(); });
        this.tabsEl.appendChild(b);
      }
      this.tabBody.innerHTML = '';
      this.tabBody.scrollTop = 0;
      if (this.tab === 'skills') this.tabBody.appendChild(this.skillsView(s));
      else if (this.tab === 'equip') this.tabBody.appendChild(this.equipView(s));
      else if (this.tab === 'stats') this.tabBody.appendChild(this.statsView(s));
      else this.tabBody.appendChild(this.historyView(s));
      this.fresh = null;
    }

    skillTip(id, tier, note) {
      const sk = L.SKILLS[id];
      const n = sk.tiers.length;
      const t = Math.max(1, tier);
      let html = '<div class="head">' + I.html(I.skill(id, tier), 44) + '<div><b>' + sk.names[t - 1] + '</b>' + CAT_NAMES[sk.cat] + (n > 1 ? ', ступень ' + t + ' из ' + n : '') + '</div></div>' + sk.desc + '<hr>' + (tier ? 'Дает: ' : 'Даст: ') + this.fxText(sk.tiers[t - 1]);
      if (tier && tier < n) html += '<br><span class="lga-dim">Далее: ' + sk.names[tier] + ', ' + this.fxText(sk.tiers[tier]) + '</span>';
      if (note) html += '<br>' + note;
      return html;
    }

    skillsView(s) {
      const ui = this.ui;
      const box = h('div');
      const next = L.Army.nextLevelXp(s);
      const prevXp = s.level > 1 ? L.XP_LEVELS[s.level - 2] : 0;
      const can = L.Army.canPromote(s);
      box.appendChild(h('div', { class: 'lga-lvlhead' }, [
        h('div', { class: 'lga-lvl big', text: String(s.level) }),
        h('div', {}, [
          h('div', { class: 't', text: 'Уровень ' + s.level + (next ? '' : ', высший') }),
          h('div', { class: 's', text: next ? 'Опыт ' + Math.floor(s.xp) + ' из ' + next + '. Опыт дают убитые враги и победы.' : 'Отряд достиг вершины мастерства.' }),
          h('div', { class: 'lga-bar xp' }, [h('i', { style: { width: Math.round((next ? L.clamp((s.xp - prevXp) / (next - prevXp), 0, 1) : 1) * 100) + '%' } })])
        ])
      ]));
      if (can) box.appendChild(h('div', { class: 'lga-callout' }, [I.img(I.ui('chevron', { kind: 'disc', metal: 'gold', field: 'att', scale: 0.55 }), 34), h('div', {}, [h('div', { text: 'Отряд заслужил награду: новый навык или следующую ступень изученного.' }), h('div', { style: { marginTop: '6px' } }, [ui.btn('Повысить', () => this.promote(), { cls: 'small primary' })])])]));
      else if (next) box.appendChild(h('div', { class: 'lga-callout quiet' }, [glyph('laurel', 24, '#b7a988'), h('div', { text: 'Следующая награда при ' + next + ' опыта. Каждое повышение дает навык и прибавку к качествам.' })]));
      const ids = Object.keys(s.skills);
      const harness = h('div', { class: 'lga-harness' });
      for (const id of ids) {
        const sk = L.SKILLS[id];
        const tier = s.skills[id];
        const el = h('div', { class: 'lga-phal' + (this.fresh === id ? ' new' : '') }, [I.img(I.skill(id, tier), 50), h('div', { class: 'n', text: sk.names[tier - 1] }), sk.tiers.length > 1 ? pips(sk.tiers.length, tier) : null]);
        ui.tip(el, () => this.skillTip(id, tier));
        harness.appendChild(el);
      }
      if (next) {
        const slot = h('div', { class: 'lga-phal next' + (can ? ' ready' : '') }, [h('div', { class: 'ring', text: '+' }), h('div', { class: 'n', text: can ? 'Выбрать навык' : 'Уровень ' + (s.level + 1) })]);
        if (can) slot.addEventListener('click', () => this.promote());
        ui.tip(slot, can ? 'Нажмите, чтобы выбрать навык' : 'Новая награда на уровне ' + (s.level + 1) + ' (' + next + ' опыта)');
        harness.appendChild(slot);
      }
      if (!ids.length && !next) harness.appendChild(h('div', { class: 'lga-note', text: 'Навыков нет.' }));
      box.appendChild(harness);
      const opts = L.Army.promoteOptions(s);
      if (opts.length && next) {
        box.appendChild(h('div', { class: 'lga-sec', text: can ? 'Можно выбрать сейчас' : 'Выбор при повышении' }));
        const row = h('div', { class: 'lga-optrow' });
        for (const o of opts) {
          const img = I.img(I.skill(o.id, o.tier), 30, can ? '' : 'dim');
          ui.tip(img, () => this.skillTip(o.id, o.tier, can ? '<span class="lga-good">Щелкните, чтобы выбрать</span>' : ''));
          if (can) { img.style.cursor = 'pointer'; img.addEventListener('click', () => this.promote(o.id)); }
          row.appendChild(img);
        }
        box.appendChild(row);
      }
      const lv = s.level - 1;
      if (lv > 0) {
        const lb = L.LEVEL_BONUS;
        box.appendChild(h('div', { class: 'lga-note', text: 'За ' + lv + ' ' + L.plural(lv, 'уровень', 'уровня', 'уровней') + ': ловкость +' + lb.ag * lv + ', атака +' + lb.hit * lv + ', боевой дух +' + lb.mo * lv + ', здоровье +' + lb.hp * lv + '.' }));
      }
      return box;
    }

    fxText(fx) {
      const parts = [];
      for (const k in fx) {
        const v = fx[k];
        if (k === 'forms') { parts.push('клин и каре'); continue; }
        if (k === 'pierce') { parts.push('пробивание брони ' + Math.round(v * 100) + '%'); continue; }
        if (k === 'speed') { parts.push('скорость +' + Math.round(v * 100) + '%'); continue; }
        parts.push((FX_NAMES[k] || k) + ' ' + (v > 0 ? '+' : '') + v);
      }
      return parts.join(', ');
    }

    itemTip(o, slotName) {
      const t = o.item;
      const icon = I.equip(o.slot, o.index, o.slot === 'relic' || L.EQUIP[o.slot].flat ? 1 : o.index + 1);
      return '<div class="head">' + I.html(icon, 44) + '<div><b>' + t.name + '</b>' + slotName + ', ' + t.cost + ' ден.</div></div>' + t.desc + '<hr>' + this.fxText(t.fx) + (o.blocked ? '<br><span class="lga-bad">' + o.blocked + '</span>' : '');
    }

    equipView(s) {
      const ui = this.ui, p = ui.profile;
      const box = h('div');
      box.appendChild(h('div', { class: 'lga-purse' }, [h('span', { text: 'Снаряжение остается у отряда навсегда.' }), h('span', { class: 'lga-money den' }, [I.img(I.denarii(), 18), h('span', { 'data-money': 'denarii', text: String(p.denarii) })])]));
      const opts = L.Army.equipOptions(s);
      const buyBtn = o => ui.btn('Купить', () => this.buy(s, o), { cls: 'small', cost: { icon: I.denarii(), n: o.item.cost }, disabled: !!o.blocked || p.denarii < o.item.cost, tip: this.itemTip(o, L.EQUIP[o.slot].name) });
      for (const o of opts.filter(q => !L.EQUIP[q.slot].flat)) {
        const e = L.EQUIP[o.slot];
        const tier = s.equip[o.slot] || 0;
        const cur = tier ? e.tiers[tier - 1] : null;
        const info = h('div', { style: { minWidth: 0 } }, [
          h('div', { class: 'n' }, [e.name, notch(e.tiers.length, tier)]),
          h('div', { class: 'd' }, cur ? [cur.name + ': ', h('b', { text: this.fxText(cur.fx) })] : ['Обычное, без прибавок'])
        ]);
        if (!o.maxed) info.appendChild(h('div', { class: 'd', text: 'Далее: ' + this.fxText(o.item.fx) }));
        if (o.blocked) info.appendChild(h('div', { class: 'req' }, [glyph('lock', 12, '#e7a582'), o.blocked]));
        const img = I.img(I.equip(o.slot, 0, tier), 46);
        ui.tip(img, () => '<b>' + e.name + '</b>: ' + (cur ? cur.name : 'обычное') + '<br>' + (cur ? cur.desc : 'Отряд пользуется оружием и доспехами, выданными при найме.'));
        box.appendChild(h('div', { class: 'lga-slot' }, [img, info, o.maxed ? h('span', { class: 'best', text: 'Лучшее' }) : buyBtn(o)]));
      }
      const flat = (title, slots) => {
        const list = opts.filter(q => slots.includes(q.slot));
        if (!list.length) return;
        box.appendChild(h('div', { class: 'lga-sec', text: title }));
        for (const o of list) {
          const img = I.img(I.equip(o.slot, o.index, o.owned ? 1 : 0), 36);
          ui.tip(img, () => this.itemTip(o, L.EQUIP[o.slot].name));
          const info = h('div', { style: { minWidth: 0 } }, [h('div', { class: 'n', text: o.item.name }), h('div', { class: 'd', text: this.fxText(o.item.fx) })]);
          if (o.blocked && !o.owned) info.appendChild(h('div', { class: 'req' }, [glyph('lock', 12, '#e7a582'), o.blocked]));
          box.appendChild(h('div', { class: 'lga-slot sm' + (o.owned ? ' owned' : '') }, [img, info, o.owned ? h('span', { class: 'best', text: 'Есть' }) : buyBtn(o)]));
        }
      };
      flat('Особое снаряжение', ['ammo', 'bows']);
      flat('Реликвии', ['relic']);
      return box;
    }

    statsView(s) {
      const u = L.UNITS[s.key];
      const st = L.Army.stats(s);
      const base = L.Army.stats({ key: s.key, level: 1, skills: {}, equip: {} });
      const cls = L.CLASSES[u.type];
      const walk = sq => 30 / cls.move[0] * (1 + (sq.speed || 0));
      const box = h('div');
      const row = (key, label, max) => {
        let v = st[key], b = base[key];
        if (key === 'speed') { v = walk(st); b = walk(base); }
        if (key === 'op') { v = 20000 + st.op; b = 20000; }
        if (key === 'og') { v = st.og * 6; b = 0; }
        if (key === 'lr') { v = 40 + st.lr * 8; b = 40; }
        const lowGood = key === 'oc';
        const plus = v - b;
        const shown = key === 'speed' ? v.toFixed(1) : Math.round(v);
        const fr = x => L.clamp(lowGood ? 1 - x / max : x / max, 0, 1);
        const bar = h('div', { class: 'lga-bar' });
        if (plus > 0.05 && !lowGood) {
          bar.append(h('i', { style: { width: Math.round(fr(b) * 100) + '%' } }), h('i', { class: 'x', style: { left: Math.round(fr(b) * 100) + '%', width: Math.max(1, Math.round((fr(v) - fr(b)) * 100)) + '%' } }));
        } else bar.appendChild(h('i', { style: { width: Math.round(L.clamp(fr(v), 0.02, 1) * 100) + '%' } }));
        const good = lowGood ? plus < -0.05 : plus > 0.05;
        const bad = lowGood ? plus > 0.05 : plus < -0.05;
        const delta = good || bad ? h('span', { class: good ? 'plus' : 'minus', text: ' ' + (plus > 0 ? '+' : '') + (key === 'speed' ? plus.toFixed(1) : Math.round(plus)) }) : null;
        box.appendChild(h('div', { class: 'lga-stat' }, [I.img(I.stat(key), 15), h('span', { text: label }), bar, h('span', { class: 'v' }, [String(shown), delta])]));
      };
      const group = (title, rows) => {
        box.appendChild(h('div', { class: 'lga-sec', text: title }));
        rows.forEach(r => { if (!(u.leader && r[0] === 'oc')) row(...r); });
      };
      if (u.leader) group('Командование', LEAD_ROWS);
      for (const [title, rows] of STAT_GROUPS) group(title, rows);
      if (u.fire) group(u.bow ? 'Лук' : u.pilum ? 'Пилумы' : 'Дротики', SHOT_ROWS);
      box.appendChild(h('div', { class: 'lga-sec', text: 'Сила на местности' }));
      const eff = h('div', { class: 'lga-terr' });
      L.TERRAIN.slice(0, 8).forEach((t, i) => {
        if (i === 4) return;
        const e = cls.eff[i];
        eff.appendChild(h('span', { class: 'lga-eff ' + (e >= 100 ? 'g' : e >= 50 ? 'm' : 'b'), text: t.name + ' ' + e + '%' }));
      });
      box.appendChild(eff);
      const role = L.ROLES[u.type];
      if (role) box.appendChild(h('div', { class: 'lga-roles', html: '<span class="lga-good">+</span> ' + role.good + '<br><span class="lga-bad">−</span> ' + role.bad }));
      box.appendChild(h('div', { class: 'lga-note', style: { marginTop: '8px' }, text: 'Золотая часть полосы и зеленые цифры: прибавка от уровней, навыков и снаряжения.' }));
      return box;
    }

    historyView(s) {
      const hs = s.history;
      const box = h('div', { class: 'lga-hist' });
      const add = (g, k, v) => box.append(glyph(g, 17), h('span', { text: k }), h('b', { text: String(v) }));
      add('swords', 'Битв', hs.battles);
      add('burst', 'Всего убито', hs.kills);
      add('star', 'Больше всего убитых за битву', hs.bestKills);
      add('heart', 'Всего потерь', hs.lost);
      add('laurel', 'Больше всего опыта за битву', hs.bestXp);
      add('medal', 'Золотых медалей', hs.medals);
      add('chevron', 'Повышений', hs.promoted || 0);
      return h('div', {}, [box, h('div', { class: 'lga-note', style: { marginTop: '12px' }, text: 'Отряд помнит все свои битвы. Погибшие отряды исчезают из армии вместе с историей.' })]);
    }

    update(dt) {
      if (this.preview && this.ui.currentName === 'camp') this.preview.render(dt);
    }

    keydown(e) {
      if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') { this.cycle(-1); return true; }
      if (e.code === 'ArrowDown' || e.code === 'ArrowRight') { this.cycle(1); return true; }
      return false;
    }

    moneyChanged() {
      this.renderRoster();
      this.renderSquad();
      if (this.recruitRefresh) this.recruitRefresh();
    }

    async rename() {
      const s = this.sel();
      const name = await this.ui.prompt('Переименовать', 'Введите имя отряда.', s.name, 28);
      if (!name) return;
      s.name = name;
      this.ui.save();
      this.renderRoster();
      this.renderSquad();
    }

    async disband(s) {
      if (L.UNITS[s.key].leader) return;
      if (!(await this.ui.confirm('Расформировать', 'Вы уверены, что хотите расформировать отряд «' + s.name + '»? Люди и опыт будут потеряны.', 'Расформировать', 'Отмена'))) return;
      L.Army.disband(this.ui.profile, s);
      this.selId = this.ui.profile.squads[0].id;
      this.ui.save();
      this.build();
    }

    replenish(s) {
      const n = L.Army.replenish(this.ui.profile, s);
      if (!n) { this.ui.toast('Не хватает славы, чтобы пополнить отряд', 'bad'); return; }
      if (s.men < L.Army.maxMen(s)) this.ui.toast('Вы смогли только частично восполнить потери: +' + n, 'bad');
      else this.ui.toast('Отряд пополнен: +' + n, 'good', I.ui('heart', { color: '#f0a08a' }));
      this.ui.audio.ui();
      this.ui.save();
      this.build();
    }

    replenishAll() {
      const n = L.Army.replenishAll(this.ui.profile);
      if (!n) this.ui.toast(this.ui.profile.squads.some(s => s.men < L.Army.maxMen(s)) ? 'Не хватает славы' : 'Все отряды полного состава');
      else this.ui.toast('Нанято новобранцев: ' + n, 'good', I.ui('heart', { color: '#f0a08a' }));
      this.ui.save();
      this.build();
    }

    buy(s, o) {
      if (!L.Army.buyEquip(this.ui.profile, s, o.slot, o.index)) { this.ui.toast('Покупка невозможна', 'bad'); return; }
      this.ui.audio.ui();
      const tier = L.EQUIP[o.slot].flat ? 1 : o.index + 1;
      this.ui.toast(o.item.name + ': куплено', 'good', I.equip(o.slot, L.EQUIP[o.slot].flat ? o.index : 0, tier));
      this.ui.save();
      this.build();
    }

    promote(preId) {
      const ui = this.ui, s = this.sel();
      const opts = L.Army.promoteOptions(s);
      if (!L.Army.canPromote(s) || !opts.length) return;
      let pick = null;
      let confirmBtn = null;
      const buttons = new Map();
      const detail = h('div', { class: 'lga-pdetail' });
      const before = L.Army.stats(s);
      const showDetail = o => {
        detail.innerHTML = '';
        if (!o) { detail.appendChild(h('div', { class: 'empty', text: 'Выберите награду слева' })); return; }
        const sk = L.SKILLS[o.id];
        const after = L.clone(s);
        L.Army.promote(after, o.id);
        const st = L.Army.stats(after);
        const table = h('table');
        for (const k in LABELS) {
          const a = before[k], b = st[k];
          if (typeof a !== 'number' || Math.abs(a - b) < 0.001) continue;
          const pct = k === 'speed' || k === 'pierce';
          const fmt = v => (pct ? Math.round(v * 100) : Math.round(v * 10) / 10);
          table.appendChild(h('tr', {}, [h('td', { text: LABELS[k] }), h('td', { text: String(fmt(a)) }), h('td', { class: 'to', text: String(fmt(b)) })]));
        }
        if (st.forms && !before.forms) table.appendChild(h('tr', {}, [h('td', { text: 'Строи' }), h('td', { text: 'нет' }), h('td', { class: 'to', text: 'клин, каре' })]));
        detail.append(
          I.img(I.skill(o.id, o.tier), 92),
          h('div', { class: 'n', text: o.name }),
          h('div', { class: 'tr', text: CAT_NAMES[sk.cat] + (sk.tiers.length > 1 ? ', ступень ' + o.tier + ' из ' + sk.tiers.length : '') + (o.prev ? ', улучшение' : ', новый навык') }),
          h('div', { class: 'd', text: sk.desc }),
          table
        );
      };
      const choose = id => {
        pick = id;
        for (const [k, b] of buttons) b.classList.toggle('sel', k === id);
        showDetail(opts.find(o => o.id === id));
        if (confirmBtn) confirmBtn.disabled = false;
      };
      const left = h('div');
      for (const cat of CAT_ORDER) {
        const list = opts.filter(o => L.SKILLS[o.id].cat === cat);
        if (!list.length) continue;
        const grid = h('div', { class: 'lga-popts' });
        for (const o of list) {
          const sk = L.SKILLS[o.id];
          const b = h('button', { class: 'lga-popt', type: 'button' }, [I.img(I.skill(o.id, o.tier), 46), h('span', { text: o.name }), h('span', { class: 'tr', text: sk.tiers.length > 1 ? (o.prev ? 'ступень ' + o.tier : 'новый') : 'особый' })]);
          b.addEventListener('click', () => { ui.audio.ui(); choose(o.id); });
          b.addEventListener('dblclick', () => { choose(o.id); if (confirmBtn) confirmBtn.click(); });
          ui.tip(b, () => this.skillTip(o.id, o.tier));
          buttons.set(o.id, b);
          grid.appendChild(b);
        }
        left.appendChild(h('div', { class: 'lga-pgroup' }, [h('div', { class: 'lga-pgh', text: CAT_NAMES[cat] }), grid]));
      }
      const lb = L.LEVEL_BONUS;
      const body = h('div', { class: 'lga-promo' }, [
        h('div', { class: 'lga-promo-intro', html: '<b>' + L.esc(s.name) + '</b>: уровень ' + s.level + ' → ' + (s.level + 1) + '. Новый уровень дает ловкость +' + lb.ag + ', атаку +' + lb.hit + ', боевой дух +' + lb.mo + ' и здоровье +' + lb.hp + '. Выберите награду: новый навык или следующую ступень изученного.' }),
        left, detail
      ]);
      const m = ui.modal({
        title: 'Повышение', body, buttons: [{ label: 'Отмена' }, {
          label: 'Наградить', cls: 'primary', disabled: true, onClick: () => {
            if (!pick) return false;
            L.Army.promote(s, pick);
            ui.save();
            ui.audio.play('rally', { vol: 0.7 });
            ui.toast(s.name + ': ' + L.SKILLS[pick].names[s.skills[pick] - 1], 'good', I.skill(pick, s.skills[pick]));
            this.fresh = pick;
            this.tab = 'skills';
            setTimeout(() => this.build(), 0);
            return true;
          }
        }]
      });
      confirmBtn = m.box.querySelector('.lga-modal-foot .lga-btn.primary');
      if (preId && buttons.has(preId)) choose(preId);
      else showDetail(null);
    }

    recruit() {
      const ui = this.ui, p = ui.profile;
      let filter = 'all';
      const chips = h('div', { class: 'lga-rfilter' });
      const grid = h('div', { class: 'lga-cards' });
      const count = h('span', { class: 'lga-dim' });
      const render = () => {
        chips.innerHTML = '';
        for (const [k, n, g] of RECRUIT_FILTERS) {
          const c = h('button', { class: 'lga-chipbtn' + (filter === k ? ' on' : ''), type: 'button' }, [g ? glyph(g, 14) : null, n]);
          c.addEventListener('click', () => { filter = k; ui.audio.ui(); render(); });
          chips.appendChild(c);
        }
        count.textContent = p.squads.length + ' из ' + L.ARMY_MAX + ' отрядов';
        grid.innerHTML = '';
        const keys = L.ROMAN_ROSTER.filter(k => filter === 'all' || FILTER_TYPES[filter].includes(L.UNITS[k].type));
        keys.sort((a, b) => (p.unlocked.includes(b) - p.unlocked.includes(a)) || (L.Army.recruitCost(a) - L.Army.recruitCost(b)));
        for (const key of keys) grid.appendChild(this.recruitCard(key));
        if (!keys.length) grid.appendChild(h('div', { class: 'lga-note', text: 'Таких войск Рим пока не дает.' }));
      };
      this.recruitRefresh = render;
      render();
      ui.modal({ title: 'Набрать отряд', tools: [count, ui.money()], body: h('div', { class: 'lga-recruit' }, [chips, grid]), onClose: () => { this.recruitRefresh = null; } });
    }

    recruitCard(key) {
      const ui = this.ui, p = ui.profile;
      const u = L.UNITS[key];
      const unlocked = p.unlocked.includes(key);
      const cost = L.Army.recruitCost(key);
      const role = L.ROLES[u.type];
      const st = L.Army.stats({ key, level: 1, skills: {}, equip: {} });
      const mini = h('div', { class: 'lga-mini' });
      [['Атака', st.hit / 30], ['Урон', st.dm / 30], ['Броня', st.ar / 20], ['Дух', st.mo / 400]].forEach(([n, f]) => mini.append(h('span', { class: 'lga-dim', text: n }), h('div', { class: 'lga-bar' }, [h('i', { style: { width: Math.round(L.clamp(f, 0.03, 1) * 100) + '%' } })])));
      const card = h('button', { class: 'lga-card' + (unlocked ? '' : ' locked'), type: 'button' }, [
        h('div', { class: 'pic', style: { backgroundImage: 'url(' + L.portrait(key) + ')' } }),
        h('div', { style: { minWidth: 0 } }, [
          h('div', { class: 'n', text: u.name }),
          h('div', { class: 'c' }, [I.img(I.cls(u.type), 13), h('span', { text: L.CLASSES[u.type].name + ', ' + u.men + ' чел.' }), h('span', { class: 'price' + (p.glory < cost ? ' no' : '') }, [I.img(I.glory(), 14), String(cost)])]),
          h('div', { class: 'r', text: role ? role.good : '' }),
          mini,
          unlocked ? null : h('div', { class: 'lock' }, [glyph('lock', 14, '#e7a582'), 'После битвы «' + ((unlockedBy(key) || {}).title || '?') + '»'])
        ])
      ]);
      ui.tip(card, '<b>' + u.name + '</b><br>' + u.desc + (role ? '<hr><span class="lga-good">+</span> ' + role.good + '<br><span class="lga-bad">−</span> ' + role.bad : ''));
      card.addEventListener('click', async () => {
        if (!unlocked) return;
        if (p.squads.length >= L.ARMY_MAX) { ui.toast('В вашей армии уже ' + L.ARMY_MAX + ' отряда. Расформируйте один отряд, прежде чем нанимать следующий.', 'bad'); return; }
        if (p.glory < cost) { ui.toast('Не хватает славы: нужно ' + cost, 'bad', I.glory()); ui.audio.play('error', { vol: 0.6 }); return; }
        const name = await ui.prompt('Новый отряд', 'Введите имя отряда.', L.Army.defaultName(p, key), 28);
        if (!name) return;
        const sq = L.Army.recruit(p, key, name);
        if (sq) {
          this.selId = sq.id;
          ui.save();
          ui.audio.ui();
          ui.closeAllModals();
          this.build();
          ui.toast('В армию принят отряд «' + sq.name + '»', 'good', I.cls(u.type));
        }
      });
      return card;
    }

    welcome() {
      const ui = this.ui;
      const body = h('div', { style: { width: 'min(80vw, 520px)', font: '13px/1.5 var(--serif)' } }, [
        h('p', { style: { marginTop: 0 }, text: 'Это лагерь вашей армии. Слева список отрядов, в центре выбранный отряд, справа его навыки, снаряжение, качества и история.' }),
        h('p', { text: 'У вас есть легат, ополчение, застрельщики и разведчики. Слава, заработанная в битвах, идет на найм и пополнение, динарии на снаряжение. Опытные отряды получают награды: навыки в виде фалер.' }),
        h('p', { style: { marginBottom: 0 }, text: 'Когда будете готовы, откройте «Кампанию» и выберите первую битву.' })
      ]);
      ui.modal({ title: 'Лагерь', body, buttons: [{ label: 'В лагерь' }, { label: 'К кампании', cls: 'primary', onClick: () => setTimeout(() => ui.go('campaign'), 0) }] });
    }
  }

  L.Screens.camp = CampScreen;
})(globalThis.Legion = globalThis.Legion || {});
