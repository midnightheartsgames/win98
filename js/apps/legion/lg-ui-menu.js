(function (L) {
  'use strict';

  const h = L.h;

  class MenuScreen {
    constructor(ui) {
      this.ui = ui;
      this.el = h('div', { class: 'lga-menu', style: { backgroundImage: 'url(' + L.ASSET_ROOT + 'video/campaign-map.jpg)' } });
    }

    show() {
      const ui = this.ui;
      ui.audio.music('menu');
      this.el.innerHTML = '';
      const p = ui.profile;
      const col = h('div', { class: 'lga-menu-col' });
      col.append(h('div', { class: 'lga-logo', text: 'LEGION ARENA' }), h('div', { class: 'lga-logo-sub', text: 'Легионы Рима' }));
      const item = (label, sub, fn, off) => {
        const b = h('button', { class: 'lga-mitem' + (off ? ' off' : ''), type: 'button' }, [label, sub ? h('small', { text: sub }) : null]);
        b.addEventListener('click', () => { if (off) return; ui.audio.ui(); fn(); });
        col.appendChild(b);
        return b;
      };
      if (p) {
        const done = L.LEVELS.filter(l => p.progress[l.id] && p.progress[l.id].medal != null).length;
        item('Продолжить кампанию', p.army + ' · битв выиграно: ' + done + ' из ' + L.LEVELS.length + ' · ' + L.DIFFICULTY[p.difficulty].name, () => ui.go('camp'));
      }
      item('Новая кампания', 'Латинский вождь на службе Рима', () => this.newCampaign());
      item('Арена', 'Быстрая битва на любой карте', () => ui.go('arena'));
      item('Энциклопедия', 'Отряды, местность, строи и приказы', () => ui.go('codex'));
      item('Настройки', null, () => L.openSettings(ui));
      item('Вступительный ролик', null, () => this.intro());
      item('Авторы', null, () => this.credits());
      item('Выход', null, () => ui.exit());
      this.el.appendChild(col);
      this.el.appendChild(h('div', { class: 'lga-menu-foot', text: 'Slitherine Software (2005) · Win 98 Edition' }));
      if (p) {
        const card = h('div', { class: 'lga-menu-card lga-panel' });
        const next = L.LEVELS.find(l => !(p.progress[l.id] && p.progress[l.id].medal != null));
        card.append(h('div', { class: 'lga-h3', style: { marginTop: 0 }, text: p.army }), h('div', { class: 'lga-dim', text: 'Отрядов: ' + p.squads.length + ', воинов: ' + p.squads.reduce((a, s) => a + s.men, 0) }), h('div', { class: 'res' }, [ui.money(), ui.favours()]));
        if (next) card.appendChild(h('div', { style: { marginTop: '6px' }, html: 'Следующая битва: <b style="color:var(--gold-hi)">' + L.esc(next.title) + '</b>' }));
        else card.appendChild(h('div', { class: 'lga-good', style: { marginTop: '6px' }, text: 'Кампания пройдена. Слава Риму!' }));
        this.el.appendChild(card);
      }
    }

    keydown(e) {
      if (e.key === 'Enter' && this.ui.profile) { this.ui.go('camp'); return true; }
      return false;
    }

    newCampaign() {
      const ui = this.ui;
      const name = h('input', { class: 'lga-input', type: 'text', maxlength: '24', value: 'Легион I' });
      let diff = 1;
      const seg = h('div', { class: 'lga-seg' });
      const descs = ['Враг слабее, награды меньше.', 'Как задумано авторами.', 'Враг опытнее и чаще пользуется приказами.', 'Для ветеранов: враг сильнее на два уровня.'];
      const desc = h('div', { class: 'lga-dim', style: { marginTop: '6px', minHeight: '18px' }, text: descs[1] });
      L.DIFFICULTY.forEach((d, i) => {
        const b = h('button', { type: 'button', class: i === diff ? 'on' : '', text: d.name });
        b.addEventListener('click', () => { diff = i; seg.querySelectorAll('button').forEach((x, j) => x.classList.toggle('on', j === i)); desc.textContent = descs[i]; });
        seg.appendChild(b);
      });
      const body = h('div', { style: { width: 'min(80vw, 520px)' } }, [
        h('p', { style: { font: '13px/1.5 Georgia, serif', marginTop: 0 }, text: 'Когда Рим еще не был великим, его окружали деревни латинских племен. Ваше племя покорено, и теперь вы служите в римской армии. Для начала дайте имя своему войску.' }),
        h('div', { class: 'lga-h3', text: 'Название армии' }), name,
        h('div', { class: 'lga-h3', text: 'Уровень сложности' }), seg, desc
      ]);
      const start = async () => {
        if (ui.profile && !(await ui.confirm('Новая армия', 'При создании новой армии старая будет уничтожена! Вы уверены?', 'Уничтожить', 'Отмена'))) return;
        ui.profile = L.Army.newProfile(name.value.trim() || 'Легион I', diff);
        ui.save();
        ui.go('camp', { fresh: true });
      };
      ui.modal({ title: 'Новая кампания', body, buttons: [{ label: 'Отмена' }, { label: 'Начать кампанию', cls: 'primary', onClick: () => { setTimeout(start, 0); } }] });
      name.addEventListener('keydown', e => e.stopPropagation());
      setTimeout(() => name.focus(), 30);
    }

    intro() {
      const ui = this.ui;
      ui.audio.stopMusic();
      const v = h('video', { src: L.ASSET_ROOT + 'video/intro.mp4', autoplay: true, playsinline: true });
      const box = h('div', { class: 'lga-video' }, [v]);
      const close = () => { box.remove(); ui.audio.music('menu'); };
      v.volume = L.clamp(ui.opts.music + 0.2, 0, 1);
      v.addEventListener('ended', close);
      v.addEventListener('click', close);
      box.appendChild(ui.btn('Пропустить', close, { cls: 'skip' }));
      this.el.appendChild(box);
      v.play().catch(() => { });
    }

    credits() {
      const rows = [
        ['Оригинальная игра', 'Slitherine Software, 2005'],
        ['Программирование', 'Philip Veale, Steven Tovey'],
        ['Рисунки', 'Alex Scarrow и DoubleThink Studios'],
        ['Дизайн', 'Iain McNeil'],
        ['Музыка', 'Michael Rubino'],
        ['Дизайн карт', 'Pyross, Master of Darkness, Stalins Organ, Ispanico'],
        ['Win 98 Edition', 'Движок, интерфейс и кампания для этой системы на основе данных, моделей, карт, звуков и музыки оригинала']
      ];
      const t = h('table', { class: 'lga-table', style: { width: 'min(80vw, 560px)' } });
      for (const [a, b] of rows) t.appendChild(h('tr', {}, [h('td', { style: { color: 'var(--gold-hi)', whiteSpace: 'nowrap', verticalAlign: 'top' }, text: a }), h('td', { text: b })]));
      this.ui.modal({ title: 'Авторы', body: t, buttons: [{ label: 'OK', cls: 'primary' }] });
    }
  }

  L.openSettings = (ui, after) => {
    const o = ui.opts;
    const body = h('div', { style: { width: 'min(80vw, 480px)' } });
    const slider = (label, key) => {
      const val = h('em', { text: Math.round(o[key] * 100) + '%' });
      const r = h('input', { type: 'range', min: '0', max: '100', value: String(Math.round(o[key] * 100)) });
      r.addEventListener('input', () => { o[key] = r.value / 100; val.textContent = r.value + '%'; ui.saveOpts(); });
      body.appendChild(h('div', { class: 'lga-opt' }, [h('span', { text: label }), r, val]));
    };
    const check = (label, key, tip) => {
      const c = h('input', { type: 'checkbox' });
      c.checked = !!o[key];
      c.addEventListener('change', () => { o[key] = c.checked; ui.saveOpts(); });
      const row = h('label', { class: 'lga-opt chk' }, [c, h('span', { text: label })]);
      if (tip) ui.tip(row, tip);
      body.appendChild(row);
    };
    body.appendChild(h('div', { class: 'lga-h3', text: 'Звук' }));
    slider('Музыка', 'music');
    slider('Эффекты', 'sfx');
    slider('Голоса', 'voice');
    body.appendChild(h('div', { class: 'lga-h3', text: 'Графика' }));
    check('Трава', 'grass', 'Если игра идет медленно, выключите траву.');
    check('Тени', 'shadows');
    const q = h('select', {}, [h('option', { value: '0', text: 'Пониженное' }), h('option', { value: '1', text: 'Полное' })]);
    q.value = String(o.quality);
    q.addEventListener('change', () => { o.quality = +q.value; ui.saveOpts(); });
    body.appendChild(h('div', { class: 'lga-opt' }, [h('span', { text: 'Разрешение 3D' }), q, h('span')]));
    body.appendChild(h('div', { class: 'lga-h3', text: 'Игра' }));
    check('Цифры урона над воинами', 'numbers', 'Красные цифры - урон вашим людям, желтые - противнику. Подкова - воин растоптан.');
    check('Прокрутка камеры у края экрана', 'edgeScroll');
    check('Подсказки обучения', 'hints');
    ui.modal({ title: 'Настройки', body, buttons: [{ label: 'Готово', cls: 'primary' }], onClose: () => { ui.saveOpts(); if (after) after(); } });
  };

  L.Screens.menu = MenuScreen;
})(globalThis.Legion = globalThis.Legion || {});
