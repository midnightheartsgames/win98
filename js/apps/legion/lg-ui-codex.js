(function (L) {
  'use strict';

  const h = L.h;
  const I = L.Icons;
  const GROUPS = [
    ['Рим', ['legate', 'togamilitia', 'peasant', 'javelinmen', 'velites', 'auxilia', 'auxarchers', 'levyspear', 'hastati', 'princeps', 'legionary', 'triarii', 'praetorian', 'westlc', 'westnobles', 'auxcav', 'elephant']],
    ['Италийские племена', ['tunicmilitia', 'shieldjav', 'westarchers']],
    ['Галлы', ['gallicgeneral', 'celticwarriors', 'celtveterans', 'fanatic', 'celtnobles']]
  ];
  const TOPICS = [['terrain', 'Местность'], ['forms', 'Строи'], ['doctrines', 'Приказы'], ['battle', 'Ход боя'], ['skills', 'Навыки'], ['equip', 'Снаряжение'], ['favours', 'Милость богов'], ['keys', 'Управление']];

  class CodexScreen {
    constructor(ui) {
      this.ui = ui;
      this.el = h('div', { class: 'lga-camp' });
      this.page = 'unit:legionary';
    }

    show(p) {
      this.back = p.back || 'menu';
      this.ui.audio.music('menu');
      if (p.page) this.page = p.page;
      this.el.innerHTML = '';
      this.el.appendChild(L.topbar(this.ui, 'Энциклопедия', [this.ui.btn(this.back === 'camp' ? 'Лагерь' : 'Главное меню', () => this.ui.go(this.back))]));
      this.listEl = h('div', { class: 'list lga-panel' });
      this.pageEl = h('div', { class: 'page lga-panel' });
      this.el.appendChild(h('div', { class: 'lga-codex' }, [this.listEl, this.pageEl]));
      this.renderList();
      this.renderPage();
    }

    destroy() {
      if (this.preview) this.preview.destroy();
      this.preview = null;
    }

    renderList() {
      const ui = this.ui;
      this.listEl.innerHTML = '';
      const item = (id, label, sub) => {
        const b = h('div', { class: 'lga-row' + (this.page === id ? ' sel' : ''), style: { gridTemplateColumns: sub ? '30px 1fr' : '1fr' } }, sub ? [h('div', { class: 'pic', style: { width: '30px', height: '38px', backgroundImage: 'url(' + L.card(sub) + ')' } }), h('div', { class: 'nm', text: label })] : [h('div', { class: 'nm', text: label })]);
        b.addEventListener('click', () => { this.page = id; ui.audio.ui(); this.renderList(); this.renderPage(); });
        this.listEl.appendChild(b);
      };
      for (const [name, keys] of GROUPS) {
        this.listEl.appendChild(h('div', { class: 'lga-sec', style: { padding: '0 6px' }, text: name }));
        for (const k of keys) item('unit:' + k, L.UNITS[k].name, k);
      }
      this.listEl.appendChild(h('div', { class: 'lga-sec', style: { padding: '0 6px' }, text: 'Правила' }));
      for (const [id, label] of TOPICS) item(id, label);
      const cur = this.listEl.querySelector('.lga-row.sel');
      if (cur) cur.scrollIntoView({ block: 'nearest' });
    }

    renderPage() {
      const el = this.pageEl;
      el.innerHTML = '';
      el.scrollTop = 0;
      if (this.page.startsWith('unit:')) { this.unitPage(this.page.slice(5)); return; }
      const fn = this['topic_' + this.page];
      if (fn) fn.call(this, el);
    }

    unitPage(key) {
      const u = L.UNITS[key], cls = L.CLASSES[u.type], el = this.pageEl;
      const lore = L.LORE[key];
      if (!this.canvas) this.canvas = h('canvas');
      if (!this.preview) {
        try { this.preview = new L.Preview(this.canvas); } catch (e) { this.preview = null; }
      }
      if (this.preview) this.preview.setUnit(key, 0);
      const stage = h('div', { class: 'lga-unit-stage' }, [this.preview ? this.canvas : h('img', { class: 'port', src: L.portrait(key), alt: '' })]);
      if (this.preview) stage.appendChild(h('div', { class: 'hint', text: 'Вращайте мышью' }));
      const st = L.Army.stats({ key, level: 1, skills: {}, equip: {} });
      const stats = h('table', { class: 'lga-unit-stats' });
      const rows = [['hp', 'Здоровье', st.hp], ['mo', 'Боевой дух', st.mo], ['hit', 'Атака', st.hit], ['dm', 'Урон', st.dm], ['ar', 'Броня', st.ar], ['ag', 'Ловкость', st.ag], ['cc', 'Устрашение', st.cc], ['sa', 'Защита от снарядов', st.sa], ['tr', 'Растаптывание', st.tr + '%'], ['ta', 'Уклон от растапт.', st.ta + '%'], ['speed', 'Скорость шага, м/с', (30 / cls.move[0]).toFixed(1)], ['oc', 'Цена приказа', u.leader ? '-' : st.oc]];
      if (u.fire) rows.push(['shots', 'Снаряды', st.shots + ' на воина, ' + st.minRange + '-' + st.range + ' м'], ['sh', 'Меткость / урон', st.sh + ' / ' + st.sd]);
      for (const [k, a, b] of rows) stats.appendChild(h('tr', {}, [h('td', {}, [I.img(I.stat(k), 14), a]), h('td', { text: String(b) })]));
      const main = h('div', { class: 'lga-unit-main' });
      main.append(h('div', { class: 'lga-title', text: u.name }), h('div', { class: 'lga-dim', style: { margin: '2px 0 4px', display: 'flex', alignItems: 'center', gap: '6px' } }, [I.img(I.cls(u.type), 16), cls.name + ', ' + u.men + ' чел.' + (u.cost ? ', найм' : ''), u.cost ? I.img(I.glory(), 14) : null, u.cost ? String(u.cost) : null]));
      if (lore) main.appendChild(h('blockquote', { class: 'lga-epi' }, [h('p', { text: lore.quote }), h('cite', { text: lore.by })]));
      main.appendChild(h('p', { class: 'lga-unit-desc', text: u.desc }));
      const role = L.ROLES[u.type];
      if (role) main.appendChild(h('p', { class: 'lga-unit-role', html: '<span class="lga-good">+</span> ' + role.good + '<br><span class="lga-bad">−</span> ' + role.bad }));
      const eff = h('table', { class: 'lga-unit-terr' });
      const head = h('tr', {}, [h('th', { text: 'Местность' })]);
      const row = h('tr', {}, [h('td', { text: 'Сила' })]);
      [0, 1, 2, 3, 5, 6, 7].forEach(i => {
        head.appendChild(h('th', { text: L.TERRAIN[i].name }));
        const e = cls.eff[i];
        row.appendChild(h('td', {}, [h('span', { class: 'lga-eff ' + (e >= 100 ? 'g' : e >= 50 ? 'm' : 'b'), text: e + '%' })]));
      });
      eff.append(head, row);
      main.appendChild(eff);
      if (lore) main.appendChild(h('div', { class: 'lga-clipw' }, [h('article', { class: 'lga-clip' }, [h('div', { class: 'hd' }, [h('b', { text: 'Из истории' }), h('span', { text: lore.when })])].concat(lore.history.map(t => h('p', { text: t }))))]));
      el.appendChild(h('div', { class: 'lga-unit' }, [h('div', { class: 'lga-unit-side' }, [stage, stats]), main]));
    }

    topic_terrain(el) {
      el.append(h('div', { class: 'lga-title', text: 'Местность' }), h('p', { style: { lineHeight: '1.5' }, text: 'Каждый вид войск по-разному сражается на разной местности. Цифры показывают, какую долю силы сохраняет отряд. Тяжелая пехота и кавалерия созданы для равнин, легкие войска и застрельщики хозяйничают в лесу, на холмах и в болоте. Кроме того, местность замедляет движение: конница вязнет в болоте, тяжелая пехота продирается через лес. В бою клавиша T подсвечивает местность на карте.' }));
      const t = h('table', {});
      const idx = [0, 1, 2, 3, 5, 6, 7];
      t.appendChild(h('tr', {}, [h('th', { text: '' })].concat(idx.map(i => h('th', { style: { fontSize: '10px' }, text: L.TERRAIN[i].name })))));
      for (const k of ['Skirmisher', 'LightInf', 'Archer', 'HeavyInf', 'LightCav', 'HeavyCav', 'Elephant']) {
        const c = L.CLASSES[k];
        t.appendChild(h('tr', {}, [h('td', { text: c.name })].concat(idx.map(i => {
          const e = c.eff[i];
          return h('td', {}, [h('span', { class: 'lga-eff', style: { background: e >= 100 ? 'rgba(111,163,90,0.35)' : e >= 50 ? 'rgba(210,174,92,0.3)' : 'rgba(177,41,31,0.35)' }, text: e + '%' })]);
        }))));
      }
      el.appendChild(t);
      el.appendChild(h('p', { style: { lineHeight: '1.5', marginTop: '12px' }, text: 'Возвышенность тоже важна: воины, бьющиеся сверху вниз, попадают чаще. Глубокая вода непроходима, броды пересекают медленно и в беспорядке.' }));
    }

    topic_forms(el) {
      el.appendChild(h('div', { class: 'lga-title', text: 'Строи' }));
      el.appendChild(h('p', { style: { lineHeight: '1.5' }, text: 'Строй определяет, как отряд дерется. Атакующий строй бьет сильнее, но хуже защищен. Оборонительный уменьшает получаемые повреждения, но и сам наносит меньше. Клин и каре доступны после навыка «Улучшенный строй».' }));
      const t = h('table', {});
      t.appendChild(h('tr', {}, ['Строй', 'Атака', 'Урон', 'Броня', 'Защита от снарядов', 'Скорость', 'Цена приказа'].map(x => h('th', { text: x }))));
      const pct = v => (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
      for (const k of L.FORM_ORDER) {
        const f = L.FORMS[k];
        t.appendChild(h('tr', {}, [f.name, pct(f.hit), pct(f.dm), pct(f.ar), pct(f.sa), pct(f.speed), (f.oc > 0 ? '+' : '') + f.oc].map(x => h('td', { text: x }))));
      }
      el.appendChild(t);
      el.appendChild(h('p', { style: { lineHeight: '1.5', marginTop: '12px' }, text: 'Каре не имеет флангов и лучше всех встречает конницу, но движется медленно. Клин усиливает натиск.' }));
    }

    topic_doctrines(el) {
      el.appendChild(h('div', { class: 'lga-title', text: 'Приказы' }));
      el.appendChild(h('p', { style: { lineHeight: '1.5' }, text: 'Приказ задается на плане битвы и выполняется без вашего участия. В бою его можно сменить, но каждый приказ стоит очков. «Пауза» и «Долгая пауза» держат отряд до сигнала или до приближения врага.' }));
      for (const k of L.DOCTRINE_ORDER) {
        const d = L.DOCTRINES[k];
        el.appendChild(h('div', { style: { display: 'grid', gridTemplateColumns: '44px 1fr', gap: '10px', alignItems: 'center', margin: '6px 0' } }, [h('img', { src: L.uiImg('orders/order' + d.icon + '.png'), alt: '', style: { width: '40px', height: '40px' } }), h('div', {}, [h('b', { style: { color: 'var(--gold-hi)' }, text: d.name }), h('div', { class: 'lga-dim', style: { fontSize: '12px' }, text: d.desc })])]));
      }
    }

    topic_battle(el) {
      el.appendChild(h('div', { class: 'lga-title', text: 'Ход боя' }));
      const paras = [
        'Бой идет сам по себе: каждый воин ищет противника, бьется, получает раны и гибнет. Вы управляете отрядами, а не людьми.',
        'Очки приказов - главный ресурс генерала. Приказ отряду стоит от 1000 до 8000 очков, сигнал всем резервам 5000, воодушевление 12000. Очки восстанавливаются, быстрее с навыком «Сообразительность». Если генерал погибнет, приказы подорожают в полтора раза.',
        'Боевой дух падает от потерь, от ударов во фланг и тыл, от бегства соседей и от гибели генерала. Отряд с исчерпанным духом бежит к краю поля. Если его не преследуют, он может собраться и вернуться в бой.',
        'Когда убиты или бегут две трети вражеского войска, его строй ломается и бегут все отряды, кроме отборной стражи. Ваша армия держится дольше: она дрогнет, лишь потеряв четыре пятых людей.',
        'Кавалерия сильнее всего в первом натиске: разогнавшиеся всадники растаптывают пехоту. В затяжной схватке они теряют преимущество. Выведите конницу из боя и ударьте снова. Копейщики и триарии встречают лобовую атаку стеной копий.',
        'Застрельщики отступают перед пехотой и забрасывают ее дротиками. Легионеры, гастаты, принципы и преторианцы метают пилумы прямо перед столкновением.',
        'Слава за битву зависит от счета: убитые враги, бегущие отряды, выполненное задание и быстрота победы против собственных потерь. Серебряная медаль увеличивает награду на четверть, золотая в полтора раза и приносит милость богов.'
      ];
      for (const p of paras) el.appendChild(h('p', { style: { lineHeight: '1.55' }, text: p }));
    }

    topic_skills(el) {
      el.appendChild(h('div', { class: 'lga-title', text: 'Навыки' }));
      el.appendChild(h('p', { style: { lineHeight: '1.5' }, text: 'Набрав опыт, отряд повышается в уровне и получает один навык на выбор. У многих навыков четыре ступени, каждая заменяет предыдущую.' }));
      el.appendChild(h('p', { style: { lineHeight: '1.5' }, text: 'Навыки изображены фалерами, наградными дисками римских воинов. Металл показывает ступень: бронза, серебро, золото, золото с лавровым венком. Цвет эмали показывает род навыка: красный атака, синий защита, зеленый выносливость, пурпурный боевой дух, охристый стрельба, серый строй, черный командование.' }));
      for (const id of L.SKILL_ORDER) {
        const s = L.SKILLS[id];
        const tiers = h('div', { class: 'tiers' });
        for (let t = 1; t <= s.tiers.length; t++) tiers.appendChild(I.img(I.skill(id, t), 26));
        el.appendChild(h('div', { class: 'ent' }, [I.img(I.skill(id, s.tiers.length), 40), h('div', {}, [h('b', { text: s.names[0] + (s.names.length > 1 ? ' … ' + s.names[s.names.length - 1] : '') }), h('div', { class: 'lga-dim', style: { fontSize: '12px' }, text: s.desc }), s.tiers.length > 1 ? tiers : null])]));
      }
    }

    topic_equip(el) {
      el.appendChild(h('div', { class: 'lga-title', text: 'Снаряжение' }));
      el.appendChild(h('p', { style: { lineHeight: '1.5' }, text: 'Снаряжение покупается в лагере за динарии. Старшие ступени требуют мастерских навыков, реликвии доступны лишь лучшим отрядам.' }));
      for (const slot of L.EQUIP_ORDER) {
        const e = L.EQUIP[slot];
        el.appendChild(h('div', { class: 'lga-sec', text: e.name }));
        e.tiers.forEach((t, i) => el.appendChild(h('div', { class: 'ent' }, [I.img(I.equip(slot, i, e.flat ? 1 : i + 1), 40), h('div', { style: { fontSize: '12px' } }, [h('b', { text: t.name }), h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '8px' } }, [I.img(I.denarii(), 13), String(t.cost)]), h('div', { class: 'lga-dim', text: t.desc })])])));
      }
    }

    topic_favours(el) {
      el.appendChild(h('div', { class: 'lga-title', text: 'Милость богов' }));
      el.appendChild(h('p', { style: { lineHeight: '1.5' }, text: 'За золотую медаль боги дарят свою милость. В бою выберите отряд и призовите ее кнопкой на панели командования. Милость действует несколько десятков секунд и расходуется.' }));
      for (const k of L.FAVOUR_ORDER) {
        const f = L.FAVOURS[k];
        el.appendChild(h('div', { class: 'ent' }, [I.img(I.favour(k), 40), h('div', {}, [h('b', { text: f.name + ', ' + f.dur + ' с' }), h('div', { class: 'lga-dim', style: { fontSize: '12px' }, text: f.desc })])]));
      }
    }

    topic_keys(el) {
      el.appendChild(h('div', { class: 'lga-title', text: 'Управление' }));
      const rows = [['План битвы', ''], ['ЛКМ по отряду, перетаскивание', 'Переставить отряд в зоне расстановки'], ['ПКМ, перетаскивание', 'Развернуть выбранный отряд'], ['1 / 2 / 3', 'Строй'], ['Enter', 'В бой'],
        ['Битва', ''], ['ЛКМ, рамка', 'Выбрать отряды'], ['ПКМ по земле', 'Идти, перетаскивание задает фронт'], ['ПКМ по врагу', 'Атаковать'], ['Пробел', 'Пауза'], ['G', 'Сигнал'], ['R', 'Воодушевить'], ['H', 'Стоять'], ['C', 'Атака бегом'], ['X', 'Вывести конницу из боя'], ['+ / -', 'Скорость'],
        ['Камера', ''], ['WASD, стрелки, край экрана', 'Двигать'], ['Q / E, средняя кнопка', 'Поворот'], ['Колесо', 'Масштаб'], ['Tab / F / Home', 'Следующий отряд / к отряду / к генералу'], ['T', 'Показать местность'],
        ['Лагерь', ''], ['Стрелки', 'Предыдущий или следующий отряд'],
        ['Отладка', ''], ['F7', '+500 славы и +500 динариев']];
      const t = h('table', {});
      for (const [a, b] of rows) t.appendChild(h('tr', {}, b ? [h('td', { style: { color: 'var(--gold-hi)' }, text: a }), h('td', { text: b })] : [h('td', { class: 'lga-h3', text: a }), h('td')]));
      el.appendChild(t);
    }

    update(dt) {
      if (this.preview && this.page.startsWith('unit:')) this.preview.render(dt);
    }
  }

  L.Screens.codex = CodexScreen;
})(globalThis.Legion = globalThis.Legion || {});
