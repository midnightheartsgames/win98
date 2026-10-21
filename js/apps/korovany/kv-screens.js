(function (K) {
  'use strict';
  const { clamp, fmtTime, gold } = K;
  const D = K.DATA, IT = D.ITEMS;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const para = t => esc(t).split('\n\n').map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');

  const LETTER = 'Здраствуйте. Я, Кирилл. Хотел бы чтобы вы сделали игру, 3Д-экшон суть такова... Пользователь может играть лесными эльфами, охраной дворца и злодеем. И если пользователь играет эльфами то эльфы в лесу, домики деревяные набигают солдаты дворца и злодеи. Можно грабить корованы... И эльфу раз лесные то сделать так что там густой лес... А движок можно поставить так что вдали деревья картинкой, когда подходиш они преобразовываются в 3-хмерные деревья. Можно покупать и т.п. возможности как в Daggerfall. И враги 3-хмерные тоже, и труп тоже 3д. Можно прыгать и т.п. Если играть за охрану дворца то надо слушаться командира, и защищать дворец от злого (имя я не придумал) и шпионов, партизанов эльфов, и ходит на набеги на когото из этих (эльфов, злого...). Ну а если за злого... то значит шпионы или партизаны эльфов иногда нападают, пользователь сам себе командир может делать что сам захочет прикажет своим войскам с ним самим напасть на дворец и пойдет в атаку. Всего в игре 4 зоны. Т.е. карта и на ней есть 4 зоны, 1 - зона людей (нейтрал), 2- зона императора (где дворец), 3-зона эльфов, 4 - зона злого... (в горах, там есть старый форт...) Так же чтобы в игре могли не только убить но и отрубить руку и если пользователя не вылечат то он умрет, так же выколоть глаз но пользователь может не умереть а просто пол экрана не видеть, или достать или купить протез, если ногу тоже либо умреш либо будеш ползать либо на коляске котаться, или самое хорошее... поставить протез. Сохранятся можно... P.S. Я джва года хочу такую игру.';

  const REP_WORD = v => v <= -60 ? 'Смертельный враг' : v <= -30 ? 'Враг' : v < -5 ? 'Неприязнь' : v <= 15 ? 'Нейтрально' : v <= 40 ? 'Уважение' : 'Свой';

  class Screens {
    constructor(ui) { this.ui = ui; this.keyFn = null; }
    get g() { return this.ui.game; }
    close() {
      this.ui.winEl.innerHTML = ''; this.ui.win = null; this.keyFn = null;
      if (this.ui.state === 'play') this.ui.root.focus({ preventScroll: true });
    }
    open(title, body, opts = {}) {
      const ui = this.ui;
      ui.unlock(); ui.skipPause = true;
      ui.winEl.innerHTML = '';
      const w = document.createElement('div');
      w.className = 'kvw ' + (opts.cls || '');
      w.innerHTML = (title != null ? '<div class="kvw-t"><span>' + esc(title) + '</span>' + (opts.noClose ? '' : '<button class="kvw-x" data-x>×</button>') + '</div>' : '') + '<div class="kvw-b">' + body + '</div>';
      ui.winEl.appendChild(w);
      ui.win = w;
      ui.keys.clear(); ui.mouse.l = ui.mouse.r = false;
      this.keyFn = opts.key || null;
      w.addEventListener('click', e => { const x = e.target.closest('[data-x]'); if (x) { this.ui.audio.play('ui'); (opts.onClose || (() => this.close()))(); } });
      return w;
    }
    key(c, e) {
      if (this.keyFn && this.keyFn(c, e) === true) return;
      if (c === 'Escape' && this.ui.win && !this.ui.win.classList.contains('kv-title') && !this.ui.win.classList.contains('kv-create')) { this.close(); }
    }
    on(w, sel, fn) { w.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => { this.ui.audio.play('ui'); fn(el, e); })); }

    title() {
      const idx = this.ui.saveIndex(), has = Object.keys(idx).length > 0;
      const w = this.open(null, `
        <div class="kv-logo"><div class="kv-logo-t">КОРОВАНЫ</div><div class="kv-logo-s">3Д-экшон. Лесные эльфы, охрана дворца и Злой.</div></div>
        <div class="kv-menu">
          ${has ? '<button data-a="cont">Продолжить</button>' : ''}
          <button data-a="new">Новая игра</button>
          <button data-a="load" ${has ? '' : 'disabled'}>Загрузить</button>
          <button data-a="opt">Настройки</button>
          <button data-a="letter">Письмо Кирилла</button>
          ${this.ui.opts.onExit ? '<button data-a="exit">Выход</button>' : ''}
        </div>
        <div class="kv-foot">Джва Года Софт, 2000. По письму Кирилла.</div>`, { cls: 'kv-title', noClose: true });
      this.on(w, '[data-a]', el => {
        const a = el.dataset.a;
        if (a === 'cont') this.ui.loadFrom(this.ui.latestSlot());
        if (a === 'new') this.create();
        if (a === 'load') this.saves('load', () => this.title());
        if (a === 'opt') this.options(() => this.title());
        if (a === 'letter') this.letter();
        if (a === 'exit') this.ui.opts.onExit();
      });
    }
    letter() {
      const w = this.open('Письмо, с которого всё началось', `<div class="kv-letter">${esc(LETTER)}</div><div class="kv-letter-sign">Письмо пришло в «Джва Года Софт» весной 1998 года. Через два года игра вышла. Всё, о чём просил Кирилл, в ней есть.</div><div class="kv-row"><button data-b>Назад</button></div>`, { cls: 'kv-note', onClose: () => this.title() });
      this.on(w, '[data-b]', () => this.title());
    }

    create() {
      const sides = [
        { id: 'elf', title: 'Лесные эльфы', at: 'Листва, западный лес', sum: 'Луки, тишина, засады на трактах. Дома из брёвен, которые жгут и солдаты дворца, и войско Злого. Приказы даёт старейшина Ясень.', perks: 'Стрельба 40, Скрытность 35. Эльфийский клинок, лук, капюшон. Лечение у травницы даром.' },
        { id: 'emp', title: 'Охрана дворца', at: 'Дворец на северном холме', sum: 'Служба: пост у ворот, обозы, шпионы, набеги. Слушайтесь воеводу Груздя. За ослушание выговор, за три выговора холодная.', perks: 'Ближний бой 35, Блок 35. Меч, щит, кольчуга, шлем. Жалованье каждый день, протезы за полцены.' },
        { id: 'evil', title: 'Злой', at: 'Старый форт в восточных горах', sum: 'Сам себе командир. Вербуйте войско, грабьте корованы, отбивайтесь от партизан и ведите армию на дворец. Имени у вас нет: его стёрли с камня Летописи.', perks: 'Ближний бой 45. Секира, чёрные латы, железная левая рука. Дань 40 золотых в день, протезы в кузне форта за полцены.' }
      ];
      let pick = 'elf';
      const w = this.open('Новая игра: кем играть?', `
        <div class="kv-create-wrap">
          <canvas class="kv-cmap" width="300" height="300"></canvas>
          <div class="kv-cside">
            <div class="kv-tabs">${sides.map(s => `<button data-s="${s.id}">${s.title}</button>`).join('')}</div>
            <div class="kv-cdesc"></div>
            <label class="kv-name">Имя: <input maxlength="20" value="Ольха"></label>
            <div class="kv-row"><button data-back>Назад</button><button data-go class="kv-def">Начать</button></div>
          </div>
        </div>`, { cls: 'kv-create', noClose: true, key: c => { if (c === 'Enter') { start(); return true; } if (c === 'Escape') { this.title(); return true; } } });
      const cv = w.querySelector('.kv-cmap'), input = w.querySelector('input');
      const names = { elf: 'Ольха', emp: 'Гаврила', evil: '' };
      const show = () => {
        const s = sides.find(x => x.id === pick);
        w.querySelectorAll('[data-s]').forEach(b => b.classList.toggle('on', b.dataset.s === pick));
        w.querySelector('.kv-cdesc').innerHTML = `<h3>${s.title}</h3><div class="kv-at">${s.at}</div><p>${s.sum}</p><p class="kv-perk">${s.perks}</p>`;
        input.value = names[pick]; input.placeholder = pick === 'evil' ? 'Имя не придумано' : '';
        this.drawMap(cv, { home: pick, small: true });
      };
      const start = () => { const nm = input.value.trim(); this.ui.newGame(pick, pick === 'evil' ? (nm || 'Злой') : (nm || names[pick])); };
      this.on(w, '[data-s]', el => { pick = el.dataset.s; show(); });
      this.on(w, '[data-back]', () => this.title());
      this.on(w, '[data-go]', start);
      cv.addEventListener('click', e => {
        const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 1200 - 600, z = (e.clientY - r.top) / r.height * 1200 - 600;
        const zn = this.ui.world.zoneAt(x, z);
        if (zn === 'elf' || zn === 'emp' || zn === 'evil') { pick = zn; show(); this.ui.audio.play('ui'); }
      });
      show();
    }

    drawMap(cv, o = {}) {
      const W = this.ui.world, c = cv.getContext('2d'), w = cv.width, h = cv.height;
      if (!this.mapImg || this.mapImg.width !== w) {
        const img = c.createImageData(w, h), d = img.data;
        const zc = { folk: [196, 180, 120], emp: [200, 170, 110], elf: [70, 120, 60], evil: [140, 130, 120] };
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
          const x = i / w * 1200 - 600, z = j / h * 1200 - 600, hh = W.height(x, z), zn = W.zoneAt(x, z);
          const k = (j * w + i) * 4;
          let col = zc[zn].slice();
          if (hh < 0) col = [90, 120, 140];
          else {
            const hx = W.height(x + 4, z) - hh, sh = clamp(1 - hx * 0.08, 0.6, 1.3);
            const e = clamp(hh / 120, 0, 1);
            col = [col[0] * sh + e * 60, col[1] * sh + e * 50, col[2] * sh + e * 40];
            if (W.inField(x, z)) col = [210, 190, 110];
          }
          d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
        }
        const off = document.createElement('canvas'); off.width = w; off.height = h; off.getContext('2d').putImageData(img, 0, 0);
        const oc = off.getContext('2d');
        oc.fillStyle = 'rgba(30,70,30,0.45)';
        for (let i = 0; i < W.treeCount; i += 3) oc.fillRect((W.tx[i] + 600) / 1200 * w, (W.tz[i] + 600) / 1200 * h, 1, 1);
        oc.strokeStyle = 'rgba(110,80,40,0.9)'; oc.lineWidth = 1.3;
        for (const r of K.WORLD.ROADS) { oc.beginPath(); r.dense.forEach((p, i) => { const x = (p[0] + 600) / 1200 * w, y = (p[1] + 600) / 1200 * h; if (i) oc.lineTo(x, y); else oc.moveTo(x, y); }); oc.stroke(); }
        this.mapImg = off;
      }
      c.drawImage(this.mapImg, 0, 0);
      const X = x => (x + 600) / 1200 * w, Z = z => (z + 600) / 1200 * h;
      c.textAlign = 'center'; c.font = (o.small ? 10 : 12) + 'px Tahoma, Arial';
      const big = ['town', 'palace', 'village', 'fort'];
      const homes = { elf: 'village', emp: 'palace', evil: 'fort' };
      for (const id in W.places) {
        const P = W.places[id];
        if (o.small && !big.includes(id)) continue;
        const seen = !this.g || o.small || (this.g.flags.seen && this.g.flags.seen[id]);
        c.fillStyle = seen ? '#2a1a0a' : 'rgba(40,30,20,0.4)';
        c.fillRect(X(P.x) - 3, Z(P.z) - 3, 6, 6);
        if (o.home && homes[o.home] === id) { c.strokeStyle = '#ffe040'; c.lineWidth = 2; c.beginPath(); c.arc(X(P.x), Z(P.z), 12, 0, Math.PI * 2); c.stroke(); }
        if (seen) { c.fillStyle = '#1a1008'; c.fillText(P.name, X(P.x), Z(P.z) - 6); }
      }
      if (o.small) {
        c.font = 'bold 11px Tahoma'; c.fillStyle = 'rgba(30,20,10,0.75)';
        c.fillText('1. Люди', X(40), Z(40)); c.fillText('2. Император', X(40), Z(-300)); c.fillText('3. Эльфы', X(-400), Z(-60)); c.fillText('4. Злой', X(420), Z(160));
        return;
      }
      const g = this.g;
      c.font = 'bold 12px Tahoma'; c.fillStyle = 'rgba(30,20,10,0.55)';
      c.fillText('ЗОНА ЛЮДЕЙ', X(60), Z(40)); c.fillText('ЗОНА ИМПЕРАТОРА', X(40), Z(-250)); c.fillText('ЗОНА ЭЛЬФОВ', X(-420), Z(-260)); c.fillText('ЗОНА ЗЛОГО', X(430), Z(-40));
      c.font = '12px Tahoma, Arial';
      for (const wg of g.wagons) if (!wg.gone && Math.hypot(wg.x - g.player.x, wg.z - g.player.z) < 250) { c.fillStyle = wg.robbed ? '#806040' : '#c08020'; c.fillRect(X(wg.x) - 2, Z(wg.z) - 2, 4, 4); }
      const m = K.Quests.marker(g);
      if (m) { c.fillStyle = '#ffd030'; c.strokeStyle = '#3a2a00'; c.beginPath(); c.moveTo(X(m.x), Z(m.z) - 6); c.lineTo(X(m.x) + 5, Z(m.z)); c.lineTo(X(m.x), Z(m.z) + 6); c.lineTo(X(m.x) - 5, Z(m.z)); c.closePath(); c.fill(); c.stroke(); }
      const p = g.player;
      c.save(); c.translate(X(p.x), Z(p.z)); c.rotate(this.ui.camYaw);
      c.fillStyle = '#d02020'; c.beginPath(); c.moveTo(0, -8); c.lineTo(5, 5); c.lineTo(0, 2); c.lineTo(-5, 5); c.closePath(); c.fill(); c.strokeStyle = '#fff'; c.stroke();
      c.restore();
    }

    pause() {
      if (this.ui.state !== 'play') return;
      const w = this.open('Пауза', `<div class="kv-menu kv-small">
        <button data-a="go">Продолжить</button><button data-a="save">Сохранить</button><button data-a="load">Загрузить</button>
        <button data-a="opt">Настройки</button><button data-a="help">Управление</button><button data-a="menu">Главное меню</button></div>`, { cls: 'kv-pause' });
      this.on(w, '[data-a]', el => {
        const a = el.dataset.a;
        if (a === 'go') this.close();
        if (a === 'save') this.saves('save', () => this.pause());
        if (a === 'load') this.saves('load', () => this.pause());
        if (a === 'opt') this.options(() => this.pause());
        if (a === 'help') this.help();
        if (a === 'menu') { this.ui.demo(); this.ui.state = 'title'; this.title(); }
      });
    }
    help() {
      const rows = [['W A S D', 'идти'], ['Shift', 'бежать'], ['Пробел', 'прыжок'], ['C', 'пригнуться'], ['Мышь', 'смотреть'], ['ЛКМ', 'удар, выстрел (держите для лука)'], ['ПКМ', 'блок'], ['Взгляд вверх / прямо / вниз', 'удар в голову / корпус / ноги'], ['1 / 2 / 3', 'оружие / лук / факел'], ['R', 'убрать или достать оружие'], ['E', 'говорить, обыскать, открыть, поджечь'], ['B', 'перевязать рану'], ['H', 'выпить зелье'], ['V', 'вид от первого лица'], ['Колесо', 'камера ближе, дальше'], ['I или Tab', 'инвентарь и протезы'], ['M', 'карта, быстрый переход'], ['J', 'журнал'], ['T', 'ждать или отдыхать'], ['Q', 'приказы войску (за Злого)'], ['F5 / F9', 'быстрое сохранение / загрузка'], ['Esc', 'пауза']];
      const w = this.open('Управление', `<table class="kv-keys">${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table><div class="kv-row"><button data-b>Назад</button></div>`, { cls: 'kv-help' });
      this.on(w, '[data-b]', () => this.pause());
    }
    options(back) {
      const o = this.ui.options;
      const sl = (k, label, min, max, step) => `<label class="kv-opt"><span>${label}</span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${o[k]}"><b data-v="${k}">${o[k]}</b></label>`;
      const w = this.open('Настройки', `
        ${sl('sens', 'Чувствительность мыши', 1, 10, 1)}${sl('fov', 'Угол обзора', 55, 95, 5)}${sl('sfx', 'Звуки', 0, 1, 0.05)}${sl('music', 'Музыка', 0, 1, 0.05)}
        ${sl('res', 'Разрешение (0..3)', 0, 3, 1)}${sl('trees', 'Дальность 3D-деревьев, м', 30, 140, 10)}
        <label class="kv-chk"><input type="checkbox" data-c="invert" ${o.invert ? 'checked' : ''}> Инвертировать мышь</label>
        <label class="kv-chk"><input type="checkbox" data-c="fps" ${o.fps ? 'checked' : ''}> Показывать FPS</label>
        <div class="kv-tip">Деревья дальше этого расстояния рисуются картинкой. Подойдёте ближе, и картинка сменится трёхмерным деревом.</div>
        <div class="kv-row"><button data-b>Готово</button></div>`, { cls: 'kv-options', onClose: () => { this.ui.saveOptions(); back(); } });
      w.querySelectorAll('input[type=range]').forEach(el => el.addEventListener('input', () => { o[el.dataset.k] = +el.value; w.querySelector('[data-v="' + el.dataset.k + '"]').textContent = el.value; }));
      w.querySelectorAll('input[type=checkbox]').forEach(el => el.addEventListener('change', () => { o[el.dataset.c] = el.checked; }));
      this.on(w, '[data-b]', () => { this.ui.saveOptions(); back(); });
    }
    saves(mode, back) {
      const idx = this.ui.saveIndex();
      const slots = ['1', '2', '3', '4', '5', '6', 'quick', 'auto'];
      const FAC = { elf: 'Эльф', emp: 'Стража', evil: 'Злой' };
      const row = s => {
        const m = idx[s];
        const label = s === 'quick' ? 'Быстрое' : s === 'auto' ? 'Авто' : 'Ячейка ' + s;
        const info = m ? `${esc(m.name)}, ${FAC[m.fac] || ''}. День ${fmtTime(m.time).day}, ${fmtTime(m.time).text}. ${esc(m.zone || '')}` : '<i>пусто</i>';
        const can = mode === 'save' ? (s !== 'auto') : !!m;
        return `<div class="kv-slot ${can ? '' : 'off'}" data-s="${s}"><b>${label}</b><span>${info}</span>${m ? `<small>${new Date(m.date).toLocaleString('ru-RU')}</small>` : ''}</div>`;
      };
      const w = this.open(mode === 'save' ? 'Сохранить игру' : 'Загрузить игру', `<div class="kv-slots">${slots.map(row).join('')}</div><div class="kv-row"><button data-b>Назад</button></div>`, { cls: 'kv-saves', onClose: back });
      this.on(w, '[data-s]', el => {
        const s = el.dataset.s;
        if (el.classList.contains('off')) return;
        if (mode === 'save') { if (this.ui.saveTo(s)) this.close(); }
        else this.ui.loadFrom(s);
      });
      this.on(w, '[data-b]', back);
    }

    note(title, text) {
      if (!text) return;
      const w = this.open(title || 'Записка', `<div class="kv-paper">${para(text)}</div><div class="kv-row"><button data-b class="kv-def">Ясно</button></div>`, { cls: 'kv-note', key: c => { if (c === 'Enter' || c === 'Space') { this.close(); return true; } } });
      this.on(w, '[data-b]', () => this.close());
    }

    death() {
      const g = this.g, p = g.player;
      const cause = { bleed: 'Вы истекли кровью. Рану нужно было перевязать.', head: 'Вам отрубили голову.', wound: 'Вас убили.', fire: 'Вы сгорели.', fall: 'Вы разбились.' }[p.cause] || 'Вы погибли.';
      const has = Object.keys(this.ui.saveIndex()).length > 0;
      const w = this.open(null, `<div class="kv-dead"><h2>Вы погибли</h2><p>${cause}</p>
        <div class="kv-menu kv-small">${has ? '<button data-a="load">Загрузить последнее сохранение</button>' : ''}<button data-a="saves" ${has ? '' : 'disabled'}>Выбрать сохранение</button><button data-a="menu">Главное меню</button></div></div>`, { cls: 'kv-death', noClose: true });
      this.on(w, '[data-a]', el => {
        const a = el.dataset.a;
        if (a === 'load') this.ui.loadFrom(this.ui.latestSlot());
        if (a === 'saves') this.saves('load', () => this.death());
        if (a === 'menu') { this.ui.demo(); this.ui.state = 'title'; this.title(); }
      });
    }
    ending(fac) {
      const g = this.g, st = g.stats;
      const T = {
        elf: ['Лес остался лесом', 'Злой погиб в чаще, куда пришёл жечь Листву. Ветераны ушли в горы, кто на своих ногах, кто на деревянных. Через месяц из дворца приехал гонец с грамотой: лес за Развилками принадлежит эльфам, отныне и навсегда. Старейшина Ясень повесил грамоту на большой дуб. Корованы по-прежнему ходят по трактам, и иногда их по-прежнему грабят.'],
        emp: ['Форт пал', 'Старый форт взят. Злого похоронили у стены, без имени, как он и жил последние двенадцать лет. Ветераны сдали оружие, и император, к удивлению двора, велел выдать каждому протез из казны. Ваше имя вписали в Летопись. Рядом теперь есть пустая строка, затёртая когда-то.'],
        evil: ['Имя на камне', 'Велимир Третий мёртв. Двор дворца полон людей на деревянных ногах и с крюками вместо рук, и никто их больше не прогоняет. На камне Летописи, поверх затёртой строки, теперь вырезано имя: ' + g.player.name + '. Его называли Злым двенадцать лет. Больше так не называют.']
      }[fac];
      const w = this.open(null, `<div class="kv-end"><h2>${T[0]}</h2><p>${esc(T[1])}</p>
        <table class="kv-stats"><tr><td>Убито врагов</td><td>${st.kills}</td></tr><tr><td>Ограблено корованов</td><td>${st.robbed}</td></tr><tr><td>Отрублено рук и ног</td><td>${st.limbsCut}</td></tr><tr><td>Своих потеряно конечностей</td><td>${st.limbsLost}</td></tr><tr><td>Выколото ваших глаз</td><td>${st.eyes}</td></tr><tr><td>Поставлено протезов</td><td>${st.pros}</td></tr><tr><td>Сожжено домов</td><td>${st.houses}</td></tr><tr><td>Дней прошло</td><td>${Math.floor(g.time / 1440) + 1}</td></tr></table>
        <div class="kv-menu kv-small"><button data-a="go">Продолжить играть</button><button data-a="menu">Главное меню</button></div></div>`, { cls: 'kv-ending', noClose: true });
      this.on(w, '[data-a]', el => { if (el.dataset.a === 'go') { this.ui.state = 'play'; this.close(); } else { this.ui.demo(); this.ui.state = 'title'; this.title(); } });
      this.ui.saveTo('auto', true);
    }

    interact(t) {
      const g = this.g, p = g.player;
      if (!t) return;
      if (t.kind === 'talk') {
        const a = t.obj;
        if (g.hostile(p, a) && (a.aware.get(p.id) || {}).known) { g.msg(a.name + ' не станет с вами разговаривать.', '#ff8060'); return; }
        this.talk(a);
      } else if (t.kind === 'corpse') this.loot(t.obj, 'Тело: ' + (t.obj.quad ? t.obj.title : t.obj.name));
      else if (t.kind === 'container') this.loot(t.obj, t.obj.name);
      else if (t.kind === 'wagon') this.loot(t.obj.cargo, t.obj.name + (t.obj.robbed ? ' (разграблен)' : ''));
      else if (t.kind === 'use') this.useThing(t.obj);
    }
    useThing(u) {
      const g = this.g, p = g.player;
      if (u.kind === 'bed') {
        const r = g.sleepAt(u);
        if (r === 'inn') this.wait('Комната в трактире стоит 5 золотых. Поговорите с трактирщицей Глафирой.');
        else if (r === 'notyours') g.msg(u.bed === 'house' ? 'Этот дом продаётся. Купить его можно у старосты.' : 'Кровать чужая.', '#e0a080');
        else if (r === 'danger') g.msg('Нельзя спать, когда рядом враги.', '#ff8060');
        else if (r === 'ok') this.ui.saveTo('auto', true);
      } else if (u.kind === 'chronicle') {
        const emp = g.actors.find(a => a.kind === 'emperor');
        if (g.pf === 'evil' && (!emp || emp.dead) && g.quest && !g.flags.carved) this.carve();
        else this.note('Камень Летописи', g.flags.carved ? 'Поверх затёртой строки вырезано свежее имя: ' + g.player.name + '.' : 'Имена тех, кто служил дворцу. Сотни строк мелких букв. Посередине одна строка затёрта камнем так, что не прочесть ни буквы. Сверху её перечеркнули ещё и ножом, для верности.');
      } else if (u.kind === 'wartable') {
        if (g.pf !== 'evil') { this.note('Военный стол', 'Карта долины, придавленная кинжалом. Красные флажки у дворца, зелёные в лесу. Рядом записка: «Корованы ходят из Развилок во дворец. Брать на тракте, у леса».'); return; }
        this.questDialog(null);
      } else if (u.kind === 'well') { p.hp = Math.min(p.maxHp, p.hp + 3); g.msg('Вода холодная, зубы сводит.', '#c0d8ff'); }
      else if (u.kind === 'fire') g.msg('Тепло. Можно подождать здесь (T).', '#e0c090');
    }
    carve() {
      const g = this.g;
      const def = g.player.name && g.player.name !== 'Злой' ? g.player.name : '';
      const w = this.open('Камень Летописи', `<div class="kv-paper"><p>Затёртая строка. Двенадцать лет назад здесь было ваше имя.</p><p>Впишите его заново.</p></div><label class="kv-name">Имя: <input maxlength="20" value="${esc(def)}" placeholder="Имя не придумано"></label><div class="kv-row"><button data-go class="kv-def">Вырезать</button></div>`, { cls: 'kv-note', key: c => { if (c === 'Enter') { go(); return true; } } });
      const input = w.querySelector('input');
      const go = () => { const nm = input.value.trim(); if (!nm) { input.focus(); return; } g.player.name = nm; g.flags.carved = true; g.emit('carve', { name: nm }); this.close(); };
      this.on(w, '[data-go]', go);
      setTimeout(() => input.focus(), 30);
    }

    loot(src, title) {
      const g = this.g;
      const render = () => {
        const list = g.lootList(src);
        const rows = list.map(it => `<tr><td>${esc(it.name)}</td><td>${it.n > 1 && it.id !== 'gold' ? '×' + it.n : ''}</td><td><button data-t="${esc(it.id)}">Взять</button></td></tr>`).join('');
        const body = list.length ? `<table class="kv-list">${rows}</table><div class="kv-row"><button data-all class="kv-def">Взять всё</button><button data-b>Закрыть</button></div>` : '<p class="kv-empty">Пусто.</p><div class="kv-row"><button data-b>Закрыть</button></div>';
        const w = this.open(title, body, { cls: 'kv-loot', key: c => { if (c === 'KeyE' || c === 'Enter') { takeAll(); return true; } } });
        this.on(w, '[data-t]', el => { g.loot(src, el.dataset.t); render(); });
        this.on(w, '[data-all]', takeAll);
        this.on(w, '[data-b]', () => this.close());
      };
      const takeAll = () => { for (const it of g.lootList(src)) g.loot(src, it.id); this.close(); };
      render();
    }

    talk(a) {
      const g = this.g, p = g.player;
      const lines = [];
      const say = t => { lines.push(t); };
      const topics = () => {
        const T = [];
        if (K.Quests.isGiver(g, a)) {
          const q = g.quest, cur = K.Quests.cur(g);
          if (cur && q.state === 'offer') T.push(['order', 'Приказ']);
          if (cur && q.state === 'active') T.push(['progress', 'Про задание']);
          if (cur && q.state === 'done') T.push(['report', 'Доложить']);
          if (g.pf === 'emp' && a.kind === 'commander') T.push(['wage', 'Жалованье']);
        }
        if (a.shop && D.SHOPS[a.shop]) {
          const S = D.SHOPS[a.shop];
          if (S.sells.length || S.buys !== undefined && S.buys.length) T.push(['shop', 'Торговать']);
          for (const sv of S.services || []) T.push(['sv_' + sv, { heal: 'Лечиться', fit: 'Поставить протез', room: 'Снять комнату (5)', rumors: 'Слухи', house: 'Купить дом', repair: 'Починить оружие', recruit: 'Нанять солдата (60)' }[sv]]);
        }
        if (!a.shop || !(D.SHOPS[a.shop].services || []).includes('rumors')) T.push(['rumors', 'Слухи']);
        T.push(['where', 'Где находится...']);
        T.push(['self', 'О себе']);
        if (a.equip.head === 'hood' && !a.revealed && !a.arrested) T.push(['hood', 'Снять капюшон!']);
        if (a.revealed && !a.arrested && (a.hp < a.maxHp * 0.55 || Object.values(a.limbs).some(l => l.state !== 'ok')) && g.pf === 'emp') T.push(['arrest', 'Арестовать']);
        if (a.bleed > 0 && a.stumps.some(s => !s.bandaged) && g.has(p, 'bandage') && !g.hostile(p, a)) T.push(['bandage', 'Перевязать']);
        if (g.pf === 'evil' && a.tags.has('army')) T.push(['army', 'Приказ солдату']);
        T.push(['bye', 'Прощай']);
        return T;
      };
      const draw = () => {
        const w = this.open(a.name + (a.title && a.title !== a.name ? ', ' + a.title.toLowerCase() : ''), `
          <div class="kv-talk"><div class="kv-said">${lines.slice(-3).map(para).join('<hr>')}</div>
          <div class="kv-topics">${topics().map(([k, l]) => `<button data-k="${k}">${esc(l)}</button>`).join('')}</div></div>`, { cls: 'kv-talkw', key: c => { const m = /^Digit(\d)$/.exec(c); if (m) { const t = topics()[+m[1] - 1]; if (t) pickTopic(t[0]); return true; } } });
        this.on(w, '[data-k]', el => pickTopic(el.dataset.k));
      };
      const pickTopic = k => {
        if (k === 'bye') { this.close(); return; }
        if (k === 'order' || k === 'progress' || k === 'report') { this.questDialog(a); return; }
        if (k === 'wage') { const r = K.Quests.wage(g); say(r === 'ok' ? 'Держи свои тридцать. Не пропей.' : r === 'paid' ? 'Сегодня уже получил. Завтра приходи.' : r === 'reprimand' ? 'С выговором жалованье не положено. Служи как следует.' : 'Нечего тебе платить.'); draw(); return; }
        if (k === 'shop') { this.shop(a.shop, a); return; }
        if (k.startsWith('sv_')) { this.service(k.slice(3), a, say, draw); return; }
        if (k === 'rumors') { say(this.rumor(a)); draw(); return; }
        if (k === 'where') { this.where(a, say, draw); return; }
        if (k === 'self') { say(this.selfLine(a)); draw(); return; }
        if (k === 'hood') {
          if (a.kind === 'spy') { K.AI.reveal(g, a, p); g.emit('unhood', { id: a.id, spy: true }); say('Под капюшоном острые уши. Эльф выхватывает нож!'); this.close(); g.msg('Это эльфийский шпион!', '#ffd080'); return; }
          a.equip.head = null; g.rep.folk = Math.max(-100, g.rep.folk - 4); g.emit('unhood', { id: a.id, spy: false });
          say('Под капюшоном обычные уши и злое лицо. «Совсем с ума посходили! Человеку уже и капюшон не надеть!»');
          draw(); return;
        }
        if (k === 'arrest') { a.arrested = true; a.hostile.clear(); a.drawn = false; a.ai.target = null; g.emit('arrest', { id: a.id, tags: [...a.tags] }); g.msg(a.name + ' арестован.', '#ffd080'); say('Эльф бросает нож и садится на землю.'); draw(); return; }
        if (k === 'bandage') { if (g.take(p, 'bandage')) { const st = a.stumps.find(s => !s.bandaged); st.bandaged = true; a.bleed = a.stumps.every(s => s.bandaged) ? 0 : Math.max(0, a.bleed - 1); g.rep[a.fac] = Math.min(100, (g.rep[a.fac] || 0) + 3); say('«Спасибо... Думал, всё, конец.»'); } draw(); return; }
        if (k === 'army') { a.ai.order = a.ai.order === 'follow' ? 'hold' : 'follow'; a.ai.holdAt = { x: a.x, z: a.z }; say(a.ai.order === 'follow' ? '«Иду за вами.»' : '«Стою здесь.»'); draw(); return; }
      };
      say(this.greeting(a));
      draw();
    }
    greeting(a) {
      const g = this.g, f = a.fac, mine = g.memberOf(g.player) === f;
      if (a.kind === 'cow') return 'Му.';
      if (a.kind === 'elder') return mine ? 'Садись, если пришёл говорить. Стой, если пришёл по делу.' : 'Чужой в Листве. Говори быстро.';
      if (a.kind === 'commander') return mine ? 'Чего стоишь? Докладывай.' : 'Ты кто такой? Здесь двор дворца, не трактир.';
      if (a.kind === 'emperor') return 'Мы не принимаем просителей без доклада.';
      if (a.kind === 'villain') return 'Ещё один. Ну, говори, пока голова на месте.';
      if (a.kind === 'prosthetist') return 'Заходи, заходи! Нога, рука, глаз? Всё сделаем, всё приладим. Ходить будешь лучше прежнего. Ну, почти.';
      if (a.kind === 'healer') return 'Что болит? Показывай. Кровь не капает? Хорошо.';
      if (a.kind === 'innkeeper') return 'Добро пожаловать в «Корову и колесо». Комната пять монет, сплетни бесплатно.';
      if (a.kind === 'recruiter') return 'Хочешь солдат? Шестьдесят монет за голову. Голова, правда, не всегда целая.';
      if (a.kind === 'evilsmith') return 'Кузня работает. Крюки, ноги, топоры. Своим за полцены.';
      if (a.kind === 'spy') return 'Мимо иду. Ничего не знаю.';
      if (a.kind === 'veteran_beggar') return 'Подай ветерану, добрый человек. Ногу я оставил под Листвой, а пенсию во дворце.';
      if (a.kind === 'veteran') return mine ? 'Здорово. Нога ноет к дождю.' : 'Проходи мимо, пока цел.';
      if (f === 'elf') return mine ? 'Тихо в лесу сегодня. Пока.' : 'Чего надо?';
      if (f === 'emp') return mine ? 'Служу дворцу.' : 'Проходи, не задерживайся.';
      if (f === 'evil') return mine ? 'Приказывай.' : 'Ты не из наших.';
      return ['Доброго дня.', 'Здравствуй.', 'Чего тебе?', 'Только быстро, у меня корова не доена.'][a.id % 4];
    }
    selfLine(a) {
      const g = this.g;
      const L = {
        elder: 'Я помню лес, когда дворца ещё не было. Помню и войну, после которой у дворца стало много калек, а у нас много пней.',
        commander: 'Тридцать лет в страже. Начинал у ворот, как и все. Глаза оба целы, руки обе свои. В этом деле это уже удача.',
        emperor: 'Мы Велимир, третий этого имени. Летопись помнит всех, кто служил нам достойно.',
        villain: 'Двенадцать лет назад я потерял под Листвой руку и глаз. Вернулся во дворец, а моё имя уже стёрли с камня. Калек в Летописи не держат. Теперь у меня своя летопись.',
        prosthetist: 'Отец делал ноги для ветеранов, теперь делаю я. Работы всегда хватает. Война, знаешь ли, лучший заказчик.',
        healer: 'Лечу всех, кто платит, и некоторых, кто не может. Отрубленное не пришиваю, не проси.',
        recruiter: 'Култышка меня зовут. Угадай почему.',
        evilsmith: 'Руку оставил на императорской войне. Крюк сам себе выковал. Теперь кую другим.',
        carver: 'Режу из дерева всё: ложки, луки, руки. Руки дороже ложек.',
        herbalist: 'Травы собираю. Кровь останавливаю. Своих лечу даром, чужих не лечу.',
        innkeeper: 'Трактир держу двадцать лет. Слышу всё, что говорят за столами.',
        headman: 'Староста я. Дом продаётся, тысяча пятьсот. Хороший дом, крыша почти не течёт.'
      }[a.kind];
      if (L) return L;
      if (a.pros && Object.keys(a.pros).length) return 'Видишь? ' + Object.values(a.pros).map(x => IT[x] ? IT[x].name.toLowerCase() : x).join(', ') + '. Память о прошлой войне.';
      return ['Живу как все. Корова, огород, налоги.', 'Да что рассказывать. Работаю.', 'Родился в Развилках, тут и помру, если эльфы не помешают.'][a.id % 3];
    }
    rumor(a) {
      const g = this.g, d = g.director || {}, R = [];
      const when = t => { const ft = fmtTime(t); const days = Math.floor(t / 1440) - Math.floor(g.time / 1440); return (days <= 0 ? 'сегодня' : days === 1 ? 'завтра' : 'через ' + days + ' дня') + ' к ' + ft.h + ' часам'; };
      if (d.supply) R.push('Казённый корован с жалованьем для стражи выйдет из Развилок во дворец ' + when(d.supply) + '. Охрана у него обычно три человека.');
      if (d.smuggle) R.push('Говорят, ночью из Развилок в форт опять повезут железо и гвозди. Выйдут ' + when(d.smuggle) + '.');
      if (d.merchant) R.push('Купцы ' + when(d.merchant) + ' повезут из дворца в Развилки сукно и соль.');
      const spies = g.actors.filter(x => x.kind === 'spy' && !x.dead && !x.revealed);
      if (spies.length && a.fac !== 'elf') { const s = spies[0], pl = g.world.placeAt(s.x, s.z); R.push('Видели чужака в капюшоне' + (pl ? ' в месте ' + pl.name : '') + '. Ходит, слушает, ни с кем не говорит. ' + (Math.hypot(s.x - g.world.spots.town_square.x, s.z - g.world.spots.town_square.z) < 25 ? 'Всё у колодца крутится.' : 'Бродит у домов.')); }
      R.push('Мастер Деревяшкин говорит, что за год поставил сорок ног. Тридцать из них ветеранам форта.');
      R.push('У Злого левая рука железная. Говорят, ею он гнёт подковы.');
      R.push('Стражники у ворот дворца пропускают всех в капюшонах, если не подходить близко. Ленятся.');
      R.push('В эльфийском лесу деревья стоят так густо, что днём темно. Без тропы там заблудишься.');
      return R[(g.tick + a.id) % R.length];
    }
    where(a, say, draw) {
      const g = this.g;
      const w = this.open('Где находится...', `<div class="kv-topics">${Object.values(g.world.places).map(P => `<button data-p="${P.id}">${esc(P.name)}</button>`).join('')}</div>`, { cls: 'kv-talkw' });
      this.on(w, '[data-p]', el => {
        const P = g.world.places[el.dataset.p];
        const ang = K.angTo(a.x, a.z, P.x, P.z), dirs = ['на север', 'на северо-восток', 'на восток', 'на юго-восток', 'на юг', 'на юго-запад', 'на запад', 'на северо-запад'];
        const di = dirs[((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8];
        const dist = Math.hypot(P.x - a.x, P.z - a.z);
        g.flags.seen = g.flags.seen || {}; g.flags.seen[P.id] = true;
        say(P.name + ' отсюда ' + di + ', шагов ' + Math.round(dist / 10) * 10 + '. Я отмечу на вашей карте.');
        draw();
      });
    }
    service(sv, a, say, draw) {
      const g = this.g, p = g.player, S = a.shop;
      if (sv === 'heal') {
        const c = g.healCost(S);
        const w = this.open('Лечение', `<div class="kv-paper"><p>${p.hp >= p.maxHp && !p.bleed && !Object.values(p.limbs).some(l => l.state === 'broken') ? 'Вы здоровы. Отрубленное отрастить нельзя, но остальное в порядке.' : 'Перевязать раны, вправить сломанное, остановить кровь. Это займёт час.'}</p><p>Цена: <b>${c ? gold(c) : 'даром'}</b>.</p></div><div class="kv-row"><button data-y class="kv-def">Лечиться</button><button data-n>Нет</button></div>`, { cls: 'kv-note' });
        this.on(w, '[data-y]', () => { const r = g.serviceHeal(S); if (r === 'gold') g.msg('Не хватает золота.', '#ff8060'); this.talk(a); });
        this.on(w, '[data-n]', () => this.talk(a));
        return;
      }
      if (sv === 'fit') { this.fitting(a); return; }
      if (sv === 'room') { const r = g.serviceRoom(); say(r === 'ok' ? 'Выспались? Заходите ещё.' : r === 'gold' ? 'Пять монет, милок. Нету? Тогда на сеновал к коровам.' : 'Сейчас не до сна: на улице драка.'); if (r === 'ok') this.ui.saveTo('auto', true); draw(); return; }
      if (sv === 'rumors') { say(this.rumor(a)); draw(); return; }
      if (sv === 'house') { const r = g.buyHouse(); say(r === 'ok' ? 'Поздравляю с покупкой! Изба на западном краю, с сундуком. Ключ под порогом.' : r === 'have' ? 'Дом уже ваш. Живите на здоровье.' : 'Тысяча пятьсот золотых. Не хватает? Корованы грабить научитесь, тогда приходите.'); draw(); return; }
      if (sv === 'repair') { say('Всё у вас в порядке, точить нечего. Приходите, когда затупите.'); draw(); return; }
      if (sv === 'recruit') { const r = g.recruit(); say(r === 'ok' ? 'Вот вам солдат. Кормить не забывайте.' : r === 'gold' ? 'Шестьдесят монет. Без денег никто не воюет.' : 'Наёмники только для своих.'); draw(); return; }
    }
    fitting(a) {
      const g = this.g, p = g.player;
      const mine = p.inv.filter(s => IT[s.id] && IT[s.id].type === 'pros');
      const lost = [];
      for (const k of ['armL', 'armR', 'legL', 'legR']) if (p.limbs[k].state === 'lost') lost.push(D.PARTS[k] + (p.pros[k] ? ': ' + IT[p.pros[k]].name : ': нет'));
      for (const sd of ['L', 'R']) if (p.eyes[sd] === 'lost') lost.push((sd === 'L' ? 'Левый' : 'Правый') + ' глаз' + (p.pros['eye' + sd] ? ': ' + IT[p.pros['eye' + sd]].name : ': нет'));
      const fee = a.shop === 'pros' ? 30 : 15;
      const w = this.open('Поставить протез', `<div class="kv-paper"><p>${lost.length ? 'Чего не хватает: ' + lost.join('; ') + '.' : 'Всё на месте. Протезы вам пока не нужны, и слава богу.'}</p><p>Работа мастера: ${fee} зол. и два часа. Протез нужно сначала купить или снять с тела.</p></div>
        <table class="kv-list">${mine.map(s => `<tr><td>${esc(IT[s.id].name)}</td><td>${IT[s.id].self ? '' : 'только мастер'}</td><td><button data-f="${s.id}">Поставить</button></td></tr>`).join('') || '<tr><td><i>Протезов в сумке нет.</i></td></tr>'}</table>
        <div class="kv-row"><button data-shop>Купить протез</button><button data-b>Назад</button></div>`, { cls: 'kv-loot' });
      this.on(w, '[data-f]', el => {
        const r = g.serviceFit(a.shop, el.dataset.f);
        const msg = { gold: 'Не хватает золота за работу.', noslot: 'Этот протез некуда ставить.', bleeding: 'Сначала остановите кровь. На кровоточащую культю ничего не приладишь.', legs: 'Обе ноги на месте, коляска не нужна.', master: 'Это ставит только мастер.' }[r];
        if (msg) g.msg(msg, '#ff8060');
        this.fitting(a);
      });
      this.on(w, '[data-shop]', () => this.shop(a.shop, a));
      this.on(w, '[data-b]', () => this.talk(a));
    }

    questDialog(a) {
      const g = this.g, q = g.quest, cur = K.Quests.cur(g);
      if (!cur) { this.note(a ? a.name : 'Военный стол', g.quest && g.quest.ended ? 'Война закончилась. Долина живёт дальше: корованы ходят, коровы пасутся.' : 'Приказов больше нет.'); return; }
      if (q.state === 'offer') {
        const w = this.open('«' + cur.title + '»', `<div class="kv-paper">${para(cur.offer)}</div><div class="kv-goal">Задание: ${esc(cur.goal)}</div><div class="kv-row"><button data-y class="kv-def">${g.pf === 'evil' ? 'Так и сделаю' : 'Будет сделано'}</button><button data-n>Позже</button></div>`, { cls: 'kv-note', key: c => { if (c === 'Enter') { yes(); return true; } } });
        const yes = () => { K.Quests.accept(g); this.close(); };
        this.on(w, '[data-y]', yes); this.on(w, '[data-n]', () => this.close());
      } else if (q.state === 'active') {
        this.note('«' + cur.title + '»', cur.goal + (cur.progress ? '\n\n' + cur.progress(g, q) : '') + '\n\n' + (g.pf === 'evil' ? 'Записка лежит на столе.' : 'Ну? Чего ждёшь?'));
      } else if (q.state === 'done') {
        const text = K.Quests.complete(g);
        const r = cur.reward || {};
        const rw = [r.gold ? gold(r.gold) : null, ...(r.items || []).map(([id, n]) => IT[id].name + (n > 1 ? ' ×' + n : ''))].filter(Boolean).join(', ');
        const nextC = K.Quests.cur(g);
        const w = this.open('«' + cur.title + '» выполнен', `<div class="kv-paper">${para(text || '')}</div>${rw ? '<div class="kv-goal">Награда: ' + esc(rw) + '</div>' : ''}<div class="kv-row">${nextC && !g.quest.ended ? '<button data-next class="kv-def">Следующий приказ</button>' : ''}<button data-b>Закрыть</button></div>`, { cls: 'kv-note' });
        this.on(w, '[data-next]', () => this.questDialog(a));
        this.on(w, '[data-b]', () => this.close());
        this.ui.saveTo('auto', true);
      }
    }

    shop(id, owner) {
      const g = this.g, p = g.player, S = D.SHOPS[id];
      const render = () => {
        const sells = S.sells.filter(x => IT[x]);
        const mine = p.inv.filter(s => g.shopBuys(id, s.id) && !(Object.values(p.equip).includes(s.id) && s.n <= 1));
        const hg = g.haggle[id];
        const w = this.open(S.name, `
          <div class="kv-shop">
            <div class="kv-shop-h"><span>У вас: <b>${gold(p.gold)}</b></span><span class="kv-hg">${hg === 'ok' ? 'Сторговались: цены ниже.' : hg === 'fail' ? 'Торг не удался: цены выше до завтра.' : '<button data-hg>Торговаться</button>'}</span></div>
            <div class="kv-cols">
              <div><h4>Продаётся</h4><table class="kv-list">${sells.map(x => `<tr title="${esc(IT[x].desc || '')}"><td>${esc(IT[x].name)}${x === 'arrows' ? ' ×10' : ''}</td><td class="kv-pr">${g.buyPrice(id, x) * (x === 'arrows' ? 10 : 1)}</td><td><button data-buy="${x}" ${p.gold < g.buyPrice(id, x) * (x === 'arrows' ? 10 : 1) ? 'disabled' : ''}>Купить</button></td></tr>`).join('') || '<tr><td><i>Ничего</i></td></tr>'}</table></div>
              <div><h4>Ваши вещи</h4><table class="kv-list">${mine.map(s => `<tr><td>${esc(IT[s.id].name)}${s.n > 1 ? ' ×' + s.n : ''}</td><td class="kv-pr">${g.sellPrice(id, s.id) * (s.id === 'arrows' ? Math.min(10, s.n) : 1)}</td><td><button data-sell="${s.id}">Продать</button></td></tr>`).join('') || '<tr><td><i>Здесь такое не берут</i></td></tr>'}</table></div>
            </div>
            <div class="kv-desc"></div>
            <div class="kv-row">${owner ? '<button data-talk>Поговорить</button>' : ''}<button data-b>Уйти</button></div>
          </div>`, { cls: 'kv-shopw' });
        const desc = w.querySelector('.kv-desc');
        w.querySelectorAll('tr[title]').forEach(tr => tr.addEventListener('mouseenter', () => { desc.textContent = tr.title; }));
        this.on(w, '[data-buy]', el => {
          const x = el.dataset.buy;
          if (x === 'arrows') { const pr = g.buyPrice(id, x) * 10; if (p.gold >= pr) { p.gold -= pr; g.give(p, 'arrows', 10, true); g.emit('sfx', { s: 'coins' }); } }
          else g.buy(id, x);
          render();
        });
        this.on(w, '[data-sell]', el => { g.sell(id, el.dataset.sell); render(); });
        this.on(w, '[data-hg]', () => { const r = g.tryHaggle(id); g.msg(r === 'ok' ? 'Хозяин махнул рукой: «Ладно, уступлю».' : 'Хозяин обиделся: «Не нравится, не бери».', r === 'ok' ? '#c8e0a0' : '#ff8060'); render(); });
        this.on(w, '[data-talk]', () => this.talk(owner));
        this.on(w, '[data-b]', () => this.close());
      };
      render();
    }

    inventory() {
      const g = this.g, p = g.player;
      const doll = () => {
        const st = part => { const l = p.limbs[part]; if (l.state === 'lost') return p.pros[part] ? 'pros' : 'lost'; if (l.state === 'broken') return 'broken'; const k = l.hp / l.max; return k > 0.66 ? 'ok' : k > 0.33 ? 'hurt' : 'bad'; };
        const label = part => { const l = p.limbs[part]; if (l.state === 'lost') return p.pros[part] ? IT[p.pros[part]].name : (l.cut === 'lower' ? 'отрублена ниже ' + (part.startsWith('arm') ? 'локтя' : 'колена') : 'отрублена'); if (l.state === 'broken') return 'сломана'; return Math.ceil(l.hp) + ' / ' + Math.ceil(l.max); };
        const eye = sd => p.eyes[sd] === 'ok' ? 'видит' : p.pros['eye' + sd] ? IT[p.pros['eye' + sd]].name + (p.pros['eye' + sd] === 'crystaleye' ? ', видит' : ', не видит') : 'выколот';
        return `<div class="kv-doll">
          <div class="kv-bp head ${st('head')}"></div><div class="kv-bp torso ${st('torso')}"></div>
          <div class="kv-bp armL ${st('armL')}"></div><div class="kv-bp armR ${st('armR')}"></div>
          <div class="kv-bp legL ${st('legL')}"></div><div class="kv-bp legR ${st('legR')}"></div>
          <div class="kv-eye L ${p.eyes.L === 'ok' || p.pros.eyeL === 'crystaleye' ? '' : 'off'}"></div><div class="kv-eye R ${p.eyes.R === 'ok' || p.pros.eyeR === 'crystaleye' ? '' : 'off'}"></div>
          ${p.chair ? '<div class="kv-chair"></div>' : ''}
        </div>
        <table class="kv-body">
          <tr><td>Здоровье</td><td>${Math.ceil(p.hp)} / ${p.maxHp}${p.bleed > 0 ? ' <b class="red">кровь!</b>' : ''}</td></tr>
          <tr><td>Голова</td><td>${label('head')}</td></tr><tr><td>Глаза</td><td>левый ${eye('L')}, правый ${eye('R')}</td></tr>
          <tr><td>Левая рука</td><td>${label('armL')}</td></tr><tr><td>Правая рука</td><td>${label('armR')}</td></tr>
          <tr><td>Левая нога</td><td>${label('legL')}</td></tr><tr><td>Правая нога</td><td>${label('legR')}</td></tr>
          <tr><td>Передвижение</td><td>${({ walk: 'на ногах', crawl: 'ползком', chair: 'в коляске' })[g.mobility(p).mode]}</td></tr>
        </table>`;
      };
      const SL = { main: 'Оружие', off: 'Щит', ranged: 'Лук', head: 'Голова', torso: 'Тело', arms: 'Руки', legs: 'Ноги' };
      const render = () => {
        const eqRows = Object.keys(SL).map(k => `<tr><td>${SL[k]}</td><td>${p.equip[k] ? esc(IT[p.equip[k]].name) : '<i>нет</i>'}</td><td>${p.equip[k] ? `<button data-un="${k}">Снять</button>` : ''}</td></tr>`).join('');
        const items = p.inv.slice().sort((a, b) => (IT[a.id].type > IT[b.id].type ? 1 : -1));
        const act = s => {
          const it = IT[s.id], out = [];
          if (['weapon', 'shield', 'armor'].includes(it.type) && !Object.values(p.equip).includes(s.id)) out.push(`<button data-eq="${s.id}">Надеть</button>`);
          if (it.type === 'use') out.push(`<button data-use="${s.id}">${it.use === 'bandage' ? 'Перевязать' : it.use === 'food' ? 'Съесть' : 'Выпить'}</button>`);
          if (it.type === 'pros') out.push(`<button data-fit="${s.id}">${it.part === 'chair' ? (p.chair ? 'Встать' : 'Сесть') : 'Пристегнуть'}</button>`);
          if (it.type !== 'quest') out.push(`<button data-drop="${s.id}">Бросить</button>`);
          return out.join('');
        };
        const w = this.open('Инвентарь: ' + p.name, `
          <div class="kv-inv">
            <div class="kv-inv-l">${doll()}</div>
            <div class="kv-inv-r">
              <h4>Надето</h4><table class="kv-list">${eqRows}</table>
              <h4>Сумка <span class="kv-gold">${gold(p.gold)}</span></h4>
              <div class="kv-scroll"><table class="kv-list">${items.map(s => `<tr title="${esc(IT[s.id].desc || '')}"><td>${esc(IT[s.id].name)}${s.n > 1 ? ' ×' + s.n : ''}</td><td class="kv-acts">${act(s)}</td></tr>`).join('')}</table></div>
              <div class="kv-desc">Наведите на вещь, чтобы прочитать описание.</div>
            </div>
          </div>`, { cls: 'kv-invw', key: c => { if (c === 'KeyI' || c === 'Tab') { this.close(); return true; } } });
        const desc = w.querySelector('.kv-desc');
        w.querySelectorAll('tr[title]').forEach(tr => tr.addEventListener('mouseenter', () => { desc.textContent = tr.title || ''; }));
        this.on(w, '[data-un]', el => { p.equip[el.dataset.un] = null; render(); });
        this.on(w, '[data-eq]', el => { this.equip(el.dataset.eq); render(); });
        this.on(w, '[data-use]', el => { const id = el.dataset.use, it = IT[id]; if (it.use === 'bandage') g.useBandage(p); else if (it.use === 'food') g.eat(p, id); else g.usePotion(p); this.close(); });
        this.on(w, '[data-fit]', el => { const r = g.fitPros(p, el.dataset.fit, false); const m = { master: 'Это может поставить только мастер: Деревяшкин в Развилках или кузнец форта.', noslot: 'Этот протез некуда ставить.', bleeding: 'Сначала перевяжите культю.', legs: 'Обе ноги на месте.' }[r]; if (m) g.msg(m, '#ff8060'); else if (r === 'ok' && IT[el.dataset.fit].part !== 'chair') g.passTime(30, false); render(); });
        this.on(w, '[data-drop]', el => { const id = el.dataset.drop; if (g.take(p, id, 1)) g.dropItem(id, p.x + Math.sin(p.yaw), p.z - Math.cos(p.yaw)); render(); });
      };
      render();
    }
    equip(id) {
      const g = this.g, p = g.player, it = IT[id];
      if (it.type === 'weapon') {
        if (it.kind === 'bow' || it.kind === 'xbow') { p.equip.ranged = id; }
        else { p.equip.main = id; if (it.hand === 2) p.equip.off = null; p.slot = 'melee'; }
      } else if (it.type === 'shield') { if (p.equip.main && IT[p.equip.main].hand === 2) g.msg('С двуручным оружием щит не надеть.', '#ff8060'); else p.equip.off = id; }
      else if (it.type === 'armor') p.equip[it.slot] = id;
    }

    map() {
      const g = this.g;
      const w = this.open('Карта долины', `<div class="kv-mapw"><canvas class="kv-bigmap" width="520" height="520"></canvas><div class="kv-mapside"><p>Красная стрелка: вы. Ромб: цель приказа. Жёлтые точки: корованы рядом.</p><p>Щёлкните по месту, где уже были, чтобы отправиться туда.</p><div class="kv-trav"></div></div></div>`, { cls: 'kv-mapwin', key: c => { if (c === 'KeyM') { this.close(); return true; } } });
      const cv = w.querySelector('canvas'), trav = w.querySelector('.kv-trav');
      this.drawMap(cv, {});
      cv.addEventListener('click', e => {
        const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 1200 - 600, z = (e.clientY - r.top) / r.height * 1200 - 600;
        let best = null, bd = 40;
        for (const id in g.world.places) { const P = g.world.places[id], d = Math.hypot(P.x - x, P.z - z); if (d < bd) { bd = d; best = P; } }
        if (!best) { trav.innerHTML = ''; return; }
        const seen = g.flags.seen && g.flags.seen[best.id];
        if (!seen) { trav.innerHTML = `<p><b>${esc(best.name)}</b>: вы там ещё не были.</p>`; return; }
        const ok = g.canTravel(), mins = g.travelTime(best.id);
        trav.innerHTML = `<p><b>${esc(best.name)}</b>. В пути около ${mins} мин.</p>` + (ok === 'ok' ? '<button data-go class="kv-def">Отправиться</button>' : `<p class="red">${ok === 'bleed' ? 'С кровоточащей раной далеко не уйти.' : 'Рядом враги.'}</p>`);
        const btn = trav.querySelector('[data-go]');
        if (btn) btn.addEventListener('click', () => { const r2 = g.fastTravel(best.id); if (r2 === 'ok') this.close(); });
      });
    }

    journal(tab) {
      const g = this.g, p = g.player, q = g.quest;
      tab = tab || 'q';
      const camp = K.Quests.CAMPAIGNS[g.pf];
      const tabs = { q: 'Приказы', r: 'Отношения', s: 'Навыки', t: 'Летопись' };
      let body = '';
      if (tab === 'q') {
        body = `<div class="kv-goal">${esc(K.Quests.goalText(g))}</div><ol class="kv-steps">${camp.map((st, i) => `<li class="${i < q.step ? 'done' : i === q.step ? 'cur' : 'later'}">${i <= q.step ? esc(st.title) : '...'}</li>`).join('')}</ol>`;
      } else if (tab === 'r') {
        body = `<table class="kv-rep">${['emp', 'elf', 'evil', 'folk'].map(f => `<tr><td>${D.FACTIONS[f].name}${f === g.pf ? ' (свои)' : ''}</td><td><div class="kv-bar"><i style="left:${(g.rep[f] + 100) / 2}%"></i></div></td><td>${REP_WORD(g.rep[f])}</td></tr>`).join('')}</table>${g.pf === 'emp' ? `<p>Выговоры: ${g.reprimands} из 3.${g.flags.outlaw ? ' <b class="red">Вы вне закона.</b>' : ''}</p>` : ''}${g.flags.house ? '<p>У вас есть дом в Развилках.</p>' : ''}`;
      } else if (tab === 's') {
        body = `<table class="kv-list">${Object.keys(D.SKILLS).map(k => `<tr><td>${D.SKILLS[k]}</td><td><div class="kv-bar sk"><i style="width:${p.skills[k]}%"></i></div></td><td>${Math.floor(p.skills[k])}</td></tr>`).join('')}</table><p class="kv-tip">Навыки растут, когда вы ими пользуетесь: бьёте, стреляете, блокируете, бегаете, торгуетесь, крадётесь.</p>`;
      } else {
        const st = g.stats;
        body = `<table class="kv-stats"><tr><td>Убито</td><td>${st.kills}</td></tr><tr><td>Ограблено корованов</td><td>${st.robbed}</td></tr><tr><td>Отрублено конечностей</td><td>${st.limbsCut}</td></tr><tr><td>Своих конечностей потеряно</td><td>${st.limbsLost}</td></tr><tr><td>Глаз потеряно</td><td>${st.eyes}</td></tr><tr><td>Протезов поставлено</td><td>${st.pros}</td></tr><tr><td>Сожжено домов</td><td>${st.houses}</td></tr><tr><td>Заработано золота</td><td>${st.gold}</td></tr><tr><td>Смертей</td><td>${st.deaths}</td></tr></table>`;
      }
      const w = this.open('Журнал', `<div class="kv-tabs">${Object.keys(tabs).map(k => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${tabs[k]}</button>`).join('')}</div><div class="kv-jb">${body}</div>`, { cls: 'kv-journal', key: c => { if (c === 'KeyJ') { this.close(); return true; } } });
      this.on(w, '[data-t]', el => this.journal(el.dataset.t));
    }

    wait(msg) {
      const g = this.g;
      const safe = g.canRest();
      const w = this.open('Ждать', `${msg ? '<p>' + esc(msg) + '</p>' : ''}<label class="kv-opt"><span>Часов</span><input type="range" min="1" max="24" value="2" data-h><b data-v>2</b></label>
        <p class="kv-tip">${safe ? 'Отдых лечит раны и сращивает кости (за 8 часов). Кровь при этом не остановится.' : 'Рядом враги. Отдыхать нельзя.'}</p>
        <div class="kv-row"><button data-w>Ждать</button><button data-r ${safe ? '' : 'disabled'} class="kv-def">Отдыхать</button><button data-b>Отмена</button></div>`, { cls: 'kv-wait' });
      const h = w.querySelector('[data-h]');
      h.addEventListener('input', () => { w.querySelector('[data-v]').textContent = h.value; });
      this.on(w, '[data-w]', () => { if (!safe) { g.msg('Рядом враги.', '#ff8060'); return; } g.passTime(+h.value * 60, false); this.close(); });
      this.on(w, '[data-r]', () => { g.passTime(+h.value * 60, true); this.close(); });
      this.on(w, '[data-b]', () => this.close());
    }

    command() {
      const g = this.g, p = g.player, army = g.army();
      const run = k => {
        const t = this.ui.aimTarget;
        for (const a of army) {
          if (k === 1) { a.ai.order = 'follow'; a.ai.slotK = null; }
          if (k === 2) { a.ai.order = 'hold'; a.ai.holdAt = { x: a.x, z: a.z }; }
          if (k === 3) { if (t && g.hostile(p, t)) { a.ai.order = 'attack'; a.ai.orderTarget = t.id; } else a.ai.order = 'hunt'; }
          if (k === 4) a.ai.order = 'hunt';
          if (k === 5) { a.ai.order = 'palace'; a.ai.route = null; a.ai.inside = false; }
        }
        army.forEach((a, i) => { a.ai.slotK = i; });
        const L = { 1: 'За мной!', 2: 'Стоять здесь!', 3: t && g.hostile(p, t) ? 'Взять его!' : 'В атаку!', 4: 'Вольная охота!', 5: 'На дворец!' };
        g.msg('Вы: «' + L[k] + '»', '#d0c0ff');
        g.emit('order', { k });
        this.close();
      };
      const w = this.open('Приказ войску (' + army.length + ')', `<div class="kv-menu kv-small kv-cmd">
        <button data-k="1">1. За мной</button><button data-k="2">2. Стоять здесь</button><button data-k="3">3. Атаковать цель под прицелом</button><button data-k="4">4. Вольная охота</button><button data-k="5">5. На дворец!</button></div>
        <p class="kv-tip">${army.length ? 'Солдат можно нанять у вербовщика в форте.' : 'Войска нет. Наймите солдат у вербовщика в форте.'}</p>`, { cls: 'kv-cmdw', key: c => { const m = /^Digit([1-5])$/.exec(c); if (m) { run(+m[1]); return true; } if (c === 'KeyQ') { this.close(); return true; } } });
      this.on(w, '[data-k]', el => run(+el.dataset.k));
    }

    arrest() {
      const g = this.g;
      if (g.reprimands < 3) return;
      const w = this.open('Арест', `<div class="kv-paper"><p>Три выговора. Двое стражников берут вас под руки. Воевода говорит коротко: «Штраф или холодная. Выбирай».</p></div>
        <div class="kv-menu kv-small"><button data-a="fine">Заплатить штраф (150)</button><button data-a="cell">Сутки в холодной</button><button data-a="fight">Вырваться (стать вне закона)</button></div>`, { cls: 'kv-note', noClose: true });
      this.on(w, '[data-a]', el => { const r = K.Quests.resolveArrest(g, el.dataset.a); if (r === 'gold') { g.msg('Не хватает золота на штраф.', '#ff8060'); return; } this.close(); });
    }
  }

  K.Screens = Screens;
})(globalThis.Korovany = globalThis.Korovany || {});
