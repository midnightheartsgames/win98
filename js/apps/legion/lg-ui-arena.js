(function (L) {
  'use strict';

  const h = L.h;
  const MAP_NAMES = {
    plains1: 'Равнина с рощами', plains2: 'Лесистый холм', farmland: 'Поля', snowy1: 'Зимние поля', snowy2: 'Снежная долина', river2: 'Речная долина',
    mediumplains1: 'Холмистая равнина', mediumfarmlands: 'Долина ферм', mediumarid1: 'Засушливые холмы', mediumriver1: 'Извилистая река', mediumcoastal1: 'Побережье', mediumsnowy1: 'Снежные холмы'
  };
  const ROSTER = ['togamilitia', 'javelinmen', 'velites', 'auxilia', 'auxarchers', 'levyspear', 'hastati', 'princeps', 'legionary', 'triarii', 'praetorian', 'westlc', 'westnobles', 'auxcav', 'elephant'];

  class ArenaScreen {
    constructor(ui) {
      this.ui = ui;
      this.el = h('div', { class: 'lga-camp' });
      this.cfg = { map: 'plains1', faction: 'gauls', budget: 5000, level: 2, difficulty: 1, army: { hastati: 2, velites: 2, westnobles: 1 } };
    }

    show() {
      this.ui.audio.music('menu');
      this.render();
    }

    spent() {
      let s = 0;
      for (const k in this.cfg.army) s += L.UNITS[k].cost * this.cfg.army[k];
      return s;
    }

    count() {
      let n = 0;
      for (const k in this.cfg.army) n += this.cfg.army[k];
      return n;
    }

    render() {
      const ui = this.ui, c = this.cfg;
      this.el.innerHTML = '';
      this.el.appendChild(L.topbar(ui, 'Арена', [ui.btn('Главное меню', () => ui.go('menu')), ui.btn('В бой!', () => this.start(), { cls: 'primary big', disabled: this.count() === 0 || this.spent() > c.budget })]));
      const left = h('div', { class: 'lga-panel pad', style: { overflow: 'auto', minHeight: 0 } });
      left.appendChild(h('div', { class: 'lga-h2', text: 'Поле боя' }));
      const maps = h('div', { class: 'lga-maps' });
      for (const k of L.QUICK_MAPS) {
        const card = h('div', { class: 'lga-mapcard' + (c.map === k ? ' sel' : '') }, [h('img', { src: L.uiImg('maps/' + k + '.jpg'), alt: '' }), h('span', { text: MAP_NAMES[k] || k })]);
        card.addEventListener('click', () => { c.map = k; ui.audio.ui(); this.render(); });
        maps.appendChild(card);
      }
      left.appendChild(maps);
      const seg = (label, list, cur, fn) => {
        const s = h('div', { class: 'lga-seg' });
        for (const [v, n] of list) {
          const b = h('button', { type: 'button', class: v === cur ? 'on' : '', text: n });
          b.addEventListener('click', () => { fn(v); ui.audio.ui(); this.render(); });
          s.appendChild(b);
        }
        return h('div', { style: { margin: '10px 0' } }, [h('div', { class: 'lga-h3', text: label }), s]);
      };
      left.appendChild(seg('Противник', Object.keys(L.QUICK_FACTIONS).map(k => [k, L.QUICK_FACTIONS[k].name]), c.faction, v => { c.faction = v; }));
      left.appendChild(seg('Опыт армий (уровень отрядов)', [[1, '1'], [2, '2'], [3, '3'], [5, '5'], [8, '8']], c.level, v => { c.level = v; }));
      left.appendChild(seg('Сложность', L.DIFFICULTY.map((d, i) => [i, d.name]), c.difficulty, v => { c.difficulty = v; }));
      const val = h('b', { text: String(c.budget) });
      const range = h('input', { type: 'range', min: '2000', max: '14000', step: '500', value: String(c.budget) });
      range.addEventListener('input', () => { c.budget = +range.value; val.textContent = String(c.budget); });
      range.addEventListener('change', () => this.render());
      left.appendChild(h('div', { class: 'lga-opt' }, [h('span', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [L.Icons.img(L.Icons.glory(), 18), 'Бюджет каждой армии']), range, val]));
      const right = h('div', { class: 'lga-panel pad', style: { overflow: 'auto', minHeight: 0 } });
      const spent = this.spent();
      right.appendChild(h('div', { class: 'lga-h2', text: 'Ваша армия' }));
      right.appendChild(h('div', { style: { marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } }, [L.Icons.img(L.Icons.glory(), 18), 'Потрачено ', h('b', { style: { color: spent > c.budget ? '#ec907a' : 'var(--gold-hi)' }, text: String(spent) }), ' из ' + c.budget + '. Отрядов: ' + this.count() + ' из 15. Легат входит бесплатно.']));
      for (const k of ROSTER) {
        const u = L.UNITS[k];
        const n = c.army[k] || 0;
        const minus = ui.btn('−', () => { c.army[k] = Math.max(0, n - 1); this.render(); }, { cls: 'small', disabled: n === 0 });
        const plus = ui.btn('+', () => { c.army[k] = n + 1; this.render(); }, { cls: 'small', disabled: this.count() >= 15 || spent + u.cost > c.budget });
        const row = h('div', { class: 'lga-build' }, [h('div', { class: 'pic', style: { backgroundImage: 'url(' + L.card(k) + ')' } }), h('div', {}, [h('div', { style: { fontWeight: 600 }, text: u.name }), h('div', { class: 'c' }, [L.Icons.img(L.Icons.cls(u.type), 12), L.CLASSES[u.type].name + ', ', L.Icons.img(L.Icons.glory(), 12), String(u.cost)])]), minus, h('b', { style: { minWidth: '18px', textAlign: 'center' }, text: String(n) }), plus]);
        ui.tip(row, '<b>' + u.name + '</b><br>' + u.desc);
        right.appendChild(row);
      }
      this.el.appendChild(h('div', { class: 'lga-arena' }, [left, right]));
    }

    start() {
      const c = this.cfg;
      const size = L.CELL * ((c.map.startsWith('medium') ? 385 : 257) - 1);
      const lv = L.quickLevel({ map: c.map, faction: c.faction, size });
      const squads = [];
      let id = 1;
      const add = key => {
        const sq = { id: id++, key, name: '', men: L.UNITS[key].men, level: 1, xp: 0, skills: {}, equip: {}, color: 0, deploy: null };
        L.Army.autoSkills(sq, c.level, L.rng(id * 17));
        const same = squads.filter(s => s.key === key).length;
        sq.name = L.UNITS[key].name + ' ' + L.roman(same + 1);
        squads.push(sq);
      };
      add('legate');
      for (const k of ROSTER) for (let i = 0; i < (c.army[k] || 0); i++) add(k);
      lv.cap = squads.length;
      const enemy = L.quickEnemy(c.faction, c.budget, size, (Date.now() & 0xffff) + 1, c.level + L.DIFFICULTY[c.difficulty].enemyLevel);
      this.ui.go('field', { level: lv, quick: true, squads, enemy, difficulty: c.difficulty });
    }
  }

  L.Screens.arena = ArenaScreen;
})(globalThis.Legion = globalThis.Legion || {});
