(function (K) {
  'use strict';

  const KEYS = [
    ['W A S D', 'идти'], ['Shift', 'рывок'], ['Пробел', 'прыжок'], ['C', 'присесть'], ['X', 'шагом или бегом'],
    ['ЛКМ', 'держать и вести мышь: замах в ту сторону, отпустить: удар; держать на месте: укол в прицел, сильнее чем дольше (нож, меч, копьё); короткий щелчок: быстрый укол'],
    ['ПКМ', 'держать: блок; мышью вверх, вниз, влево или вправо; поднятый в последний миг блок парирует'],
    ['F', 'пинок'], ['E', 'лестница, обыскать тело, поднять вещь, освежевать тушу (нужен нож); сдавшегося связать, вести или отпустить'], ['B', 'перевязать себя или того, на кого смотрите (нужен бинт)'], ['G', 'нести упавшего на плече, положить; у лекаря отдать'], ['Q', 'команды своему отряду, затем 1 – 6'], ['1 – 4, колесо', 'ближний бой, лук или арбалет, топорики, сулицы'], ['5', 'факел в левой руке: волки не подходят ближе 5 м'], ['R', 'перезарядить арбалет'], ['V', 'вид от первого или третьего лица'],
    ['M', 'карта долины'], ['T', 'ждать до 4 часов'], ['F5 / F9', 'быстрое сохранение и загрузка'], ['F6', 'уронить манекен перед собой'],
    ['F2', 'свободная камера'], ['F3', 'сведения'], ['F4', 'час вперёд']
  ];
  const WEAPON_IDS = ['knife', 'sickle', 'sword', 'axe', 'mace', 'spear', 'bardiche'];
  const FOES = [['elf', 'эльф'], ['guard', 'стражник'], ['villain', 'солдат Злого'], ['town', 'горожанин']];
  const one = id => K.Data.WEAPONS[id].hands === 1 || id === 'spear';

  const GROUP = { weapon: 'Оружие', ranged: 'Луки и метательное', ammo: 'Стрелы и болты', armor: 'Броня', goods: 'Разное', aid: 'Подспорье', prosthesis: 'Протезы', food: 'Еда', hide: 'Шкуры' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const ZONE_INFO = Object.freeze({
    3: { side: 'elf', name: 'Эльфийский лес', who: 'Корни: 44 жителя. Старейшина Вяз, вожак партизан Ольха, травница Рябина, резчик Ясень.', start: 'Начало: рассвет в срубе. По Лесной дороге идёт корован.', play: 'Щелчок: играть за лесных эльфов' },
    2: { side: 'guard', name: 'Земли императора', who: 'Дворец на Белом холме, Царёво, застава. Командир Гордей Строгов, лекарь Савва, ветеран Митрофан у ворот.', start: 'Начало: утреннее построение во дворе казармы, перекличка по именам.', play: 'Щелчок: играть за охрану дворца' },
    4: { side: 'villain', name: 'Горы Злого', who: 'Старый форт, рудники, перевал. Разведчик Кривой, вожак пехоты Пень, писарь Гусь, войско из 34 человек.', start: 'Начало: ночь в зале форта. Писарь спрашивает имя для летописи.', play: 'Щелчок: играть за Злого' },
    1: { side: null, name: 'Земли людей', who: 'Мостовица, хутора, мельница, постоялый двор «Колесо», мастерская Шарнира.', start: 'Земли людей: здесь не воюют.', play: 'За эту зону не играют' }
  });
  const SIDE_WORD = { elf: 'эльфы', guard: 'охрана дворца', villain: 'Злой' };
  const MAP_N = 384;
  const LABELS = [['mostovica', 'Мостовица'], ['palace', 'Дворец'], ['korni', 'Корни'], ['fort', 'Старый форт'], ['tsarevo', 'Царёво'], ['outpost', 'Застава']];
  const two = n => String(n).padStart(2, '0');
  const dateLine = ms => { const d = new Date(ms); return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`; };
  const sideName = m => m.side === 'villain' ? m.name : K.Body.HEROES[m.hero] ? K.Body.HEROES[m.hero].name : m.name;

  function valley(ui, style) {
    ui.mapCache = ui.mapCache || {};
    if (ui.mapCache[style]) return ui.mapCache[style];
    const T = ui.T, F = ui.F, N = MAP_N, k = K.MAP.size / N, paper = style === 'paper';
    const c = document.createElement('canvas');
    c.width = N;
    c.height = N;
    const g = c.getContext('2d'), img = g.createImageData(N, N), d = img.data, zones = new Uint8Array(N * N);
    const SW = K.Places.SWAMP;
    const BASE = paper ? { 1: [232, 214, 172], 2: [226, 210, 166], 3: [206, 188, 142], 4: [214, 200, 172] } : { 1: [198, 186, 118], 2: [146, 168, 94], 3: [62, 94, 52], 4: [136, 122, 104] };
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = (i + 0.5) * k, z = (j + 0.5) * k, h = T.heightAt(x, z), zone = T.zoneAt(x, z), o = (j * N + i) * 4;
        zones[j * N + i] = zone;
        const slope = (T.heightAt(x + k, z) - h) * 0.8 + (T.heightAt(x, z + k) - h) * 1.1;
        let shade = K.clamp(1 - slope * 0.06, 0.62, 1.3);
        const dens = F && F.densityAt ? F.densityAt(x, z) : 0;
        let col = BASE[zone].slice();
        if (paper) { if (dens > 0.35 && ((i * 7 + j * 13) % 6 === 0 || (i + j * 3) % 11 === 0)) col = [120, 96, 64]; }
        else { shade *= 1 - Math.min(0.4, dens * 0.4); if (h > 60) col = col.map((v, q) => v + (q === 2 ? 30 : 22) * Math.min(1, (h - 60) / 80)); }
        const wet = T.waterAt(x, z) > h || Math.hypot(x - SW.at[0], z - SW.at[1]) < SW.r * 0.75;
        if (wet) { col = paper ? [150, 160, 170] : [64, 104, 130]; shade = 1; }
        d[o] = K.clamp(col[0] * shade, 0, 255);
        d[o + 1] = K.clamp(col[1] * shade, 0, 255);
        d[o + 2] = K.clamp(col[2] * shade, 0, 255);
        d[o + 3] = 255;
      }
    }
    const masks = {}, sums = { 1: [0, 0, 0], 2: [0, 0, 0], 3: [0, 0, 0], 4: [0, 0, 0] };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const z = zones[j * N + i], r = i < N - 1 ? zones[j * N + i + 1] : z, b = j < N - 1 ? zones[(j + 1) * N + i] : z, s = sums[z];
      s[0] += i; s[1] += j; s[2]++;
      if ((r !== z || b !== z) && ((i + j) >> 2) % 2 === 0) { const o = (j * N + i) * 4; d[o] = paper ? 120 : 150; d[o + 1] = paper ? 40 : 30; d[o + 2] = paper ? 30 : 24; }
    }
    g.putImageData(img, 0, 0);
    const band = (K.Edge.BORDER + 14) / k;
    g.save();
    g.beginPath();
    g.rect(0, 0, N, N);
    g.rect(band, band, N - band * 2, N - band * 2);
    g.clip('evenodd');
    g.strokeStyle = paper ? 'rgba(90, 60, 40, 0.8)' : 'rgba(30, 20, 10, 0.75)';
    g.lineWidth = 1;
    for (let q = -N; q < N * 2; q += 4) { g.beginPath(); g.moveTo(q, 0); g.lineTo(q + N, N); g.stroke(); }
    g.restore();
    for (const z of [1, 2, 3, 4]) {
      const m = document.createElement('canvas');
      m.width = N;
      m.height = N;
      const mg = m.getContext('2d'), mi = mg.createImageData(N, N);
      for (let q = 0; q < N * N; q++) if (zones[q] === z) { mi.data[q * 4] = 255; mi.data[q * 4 + 1] = 240; mi.data[q * 4 + 2] = 190; mi.data[q * 4 + 3] = 70; }
      mg.putImageData(mi, 0, 0);
      masks[z] = m;
    }
    const W = KIND => KIND === 'tract' ? 2.6 : KIND === 'road' || KIND === 'street' || KIND === 'bridge' ? 2 : KIND === 'path' ? 1.4 : 1;
    for (const r of K.Places.ROADS) {
      g.beginPath();
      r.pts.forEach(([x, z], n) => n ? g.lineTo(x / k, z / k) : g.moveTo(x / k, z / k));
      g.lineWidth = W(r.kind);
      g.strokeStyle = paper ? '#5a3a1e' : r.kind === 'trail' || r.kind === 'goat' ? '#2c2214' : '#e8d8a0';
      g.setLineDash(r.kind === 'trail' || r.kind === 'goat' ? [3, 3] : []);
      g.stroke();
    }
    g.setLineDash([]);
    for (const L of K.Places.LANDMARKS) {
      const x = L.at[0] / k, y = L.at[1] / k;
      g.fillStyle = paper ? '#3a2412' : '#f4ecd0';
      g.strokeStyle = '#1a1208';
      g.lineWidth = 1;
      g.beginPath();
      if (L.id === 'oak') { g.arc(x, y, 5, 0, Math.PI * 2); }
      else { g.moveTo(x - 3, y + 4); g.lineTo(x - 3, y - 6); g.lineTo(x, y - 9); g.lineTo(x + 3, y - 6); g.lineTo(x + 3, y + 4); g.closePath(); }
      g.fill();
      g.stroke();
    }
    const centers = {};
    for (const z of [1, 2, 3, 4]) {
      const s = sums[z], cx = s[0] / s[2], cy = s[1] / s[2];
      centers[z] = [cx, cy];
      g.fillStyle = paper ? 'rgba(80,40,20,0.85)' : 'rgba(250,240,200,0.9)';
      g.strokeStyle = '#1a1208';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, 15, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = paper ? '#f0e2c0' : '#3a1a0c';
      g.font = 'bold 20px Georgia, serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(String(z), cx, cy + 1);
    }
    if (!paper) {
      g.font = 'italic 11px Georgia, serif';
      g.textAlign = 'center';
      for (const [id, name] of LABELS) {
        const s = K.Places.SPOTS.find(q => q.id === id), x = s.at[0] / k, y = s.at[1] / k - 12;
        g.fillStyle = 'rgba(20,14,8,0.75)';
        g.fillText(name, x + 1, y + 1);
        g.fillStyle = '#f8eccc';
        g.fillText(name, x, y);
      }
    }
    const out = { canvas: c, masks, centers, k };
    ui.mapCache[style] = out;
    return out;
  }

  const mapPoint = (cv, e, k) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * MAP_N * k, (e.clientY - r.top) / r.height * MAP_N * k]; };

  function lookPicker(ui, el, side, paint) {
    const st = ui.startSetup, Sd = K.Data.SIDES[side], fig = K.Body.HEROES[st.hero].kit.fig;
    const styles = Sd.styles[fig], colors = Sd.hair;
    if (!styles.includes(st.look.hair)) st.look.hair = styles[0];
    const opt = (attr, v, label, on) => `<button class="ki-opt${on ? ' on' : ''}" data-${attr}="${v}">${label}</button>`;
    const heroes = K.Save.SIDE_HEROES[side].map(h => opt('hero', h, K.Body.HEROES[h].name, h === st.hero)).join('');
    const faces = [0, 1, 2, 3].map(f => opt('face', f, String(f + 1), st.look.face === f)).join('');
    const hairs = styles.map(s => opt('hair', s, HAIR_NAMES[s] || s, st.look.hair === s)).join('');
    const sw = colors.map((c, n) => `<button class="ki-swatch${c.every((v, q) => Math.abs(v - st.look.hairColor[q]) < 0.01) ? ' on' : ''}" data-color="${n}" style="background:rgb(${c.map(v => Math.round(v * 255)).join(',')})" title="цвет ${n + 1}"></button>`).join('');
    el.innerHTML = `<div class="ki-look-row"><span>Кто</span>${heroes}</div><div class="ki-look-row"><span>Лицо</span>${faces}</div><div class="ki-look-row"><span>Волосы</span>${hairs}</div><div class="ki-look-row"><span>Цвет</span>${sw}</div>`;
    el.onclick = e => {
      const h = e.target.closest('[data-hero]'), f = e.target.closest('[data-face]'), s = e.target.closest('[data-hair]'), c = e.target.closest('[data-color]');
      if (h) { st.hero = h.dataset.hero; st.look = K.Save.lookOf(K.Body.HEROES[st.hero].kit); }
      else if (f) st.look.face = Number(f.dataset.face);
      else if (s) st.look.hair = s.dataset.hair;
      else if (c) st.look.hairColor = colors[Number(c.dataset.color)].slice();
      else return;
      lookPicker(ui, el, side, paint);
      paint();
    };
  }
  const HAIR_NAMES = { long: 'длинные', tail: 'хвост', crop: 'коротко', braid: 'коса', bun: 'узел', short: 'стрижка', bald: 'бритая' };

  K.Screens = {
    title(ui) {
      const el = document.createElement('div');
      el.className = 'ki-title';
      const exit = ui.opts.onExit ? '<button class="ki-btn" data-act="exit">Выход</button>' : '';
      el.innerHTML = `<div class="ki-title-frame">
          <div class="ki-title-head"><div class="ki-title-name">${K.TITLE}</div><div class="ki-title-sub">3Д-экшон по письму Кирилла</div></div>
          <div class="ki-title-map"><canvas width="${MAP_N}" height="${MAP_N}"></canvas><div class="ki-title-card" data-card></div></div>
          <div class="ki-title-foot"><button class="ki-btn" data-act="continue" hidden>Продолжить</button><button class="ki-btn" data-act="load">Загрузить</button><button class="ki-btn" data-act="settings">Настройки</button>${exit}</div>
        </div>`;
      const cv = el.querySelector('canvas'), g = cv.getContext('2d'), V = valley(ui, 'title'), card = el.querySelector('[data-card]');
      let hover = 0;
      const show = z => {
        if (z === hover) return;
        hover = z;
        g.drawImage(V.canvas, 0, 0);
        if (z) g.drawImage(V.masks[z], 0, 0);
        const I = ZONE_INFO[z];
        card.className = 'ki-title-card' + (z ? ' z' + z : '') + (I && !I.side ? ' off' : '');
        card.innerHTML = I ? `<b>${z} · ${esc(I.name)}</b><p>${esc(I.who)}</p><p>${esc(I.start)}</p><i>${esc(I.play)}</i>` : '<b>Долина в четыре зоны</b><p>Наведите на зону, чтобы узнать, кто в ней живёт. Щелчок по зоне 3, 2 или 4 начинает игру за её сторону.</p>';
      };
      hover = -1;
      show(0);
      cv.addEventListener('mousemove', e => { const [x, z] = mapPoint(cv, e, V.k); show(ui.T.zoneAt(x, z)); });
      cv.addEventListener('mouseleave', () => show(0));
      cv.addEventListener('click', e => { const [x, z] = mapPoint(cv, e, V.k), I = ZONE_INFO[ui.T.zoneAt(x, z)]; if (I && I.side) ui.openStart(I.side); });
      const cont = el.querySelector('[data-act=continue]');
      if (ui.playing) cont.hidden = false;
      else ui.saveList().then(list => { if (list.length) { cont.hidden = false; cont.title = sideName(list[0].meta) + ', день ' + list[0].meta.day; } }, () => { });
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'continue') ui.continueLatest();
        else if (b.dataset.act === 'load') ui.openSlots('load', 'title');
        else if (b.dataset.act === 'settings') ui.openSettings('title');
        else if (b.dataset.act === 'exit') ui.exit();
      });
      el.show = show;
      return el;
    },

    pond(ui) {
      const el = document.createElement('div');
      el.className = 'ki-pond';
      el.innerHTML = `<div class="ki-pond-bank">
          <div class="ki-pond-say">Утро у лесного пруда за Корнями. Вода стоит тихо. Кто смотрит из неё?</div>
          <canvas class="ki-pond-water" width="320" height="240"></canvas>
          <div class="ki-pond-look" data-look></div>
          <div class="ki-pond-foot"><button class="ki-btn" data-act="back">Назад</button><button class="ki-btn" data-act="go">Встать и идти в Корни</button></div>
        </div>`;
      const cv = el.querySelector('canvas'), g = cv.getContext('2d');
      const paint = () => {
        const face = ui.portrait('face');
        g.fillStyle = '#0c1a16';
        g.fillRect(0, 0, 320, 240);
        if (face) for (let y = 0; y < 240; y++) {
          const sx = Math.sin(y * 0.21) * 2.2 + Math.sin(y * 0.047) * 1.3;
          g.drawImage(face, 0, face.height - (y + 0.5) * face.height / 240, face.width, face.height / 240, sx, y, 320, 1);
        }
        g.fillStyle = 'rgba(16, 52, 44, 0.45)';
        g.fillRect(0, 0, 320, 240);
        g.strokeStyle = 'rgba(210, 230, 210, 0.18)';
        for (let r = 0; r < 4; r++) { g.beginPath(); g.ellipse(232, 176, 18 + r * 16, 5 + r * 4, 0, 0, Math.PI * 2); g.stroke(); }
        g.fillStyle = '#2f5a2a';
        for (const [x, y, rx] of [[34, 206, 22], [62, 222, 14], [286, 38, 18], [300, 214, 16]]) { g.beginPath(); g.ellipse(x, y, rx, rx * 0.55, 0.3, 0.2, Math.PI * 1.85); g.lineTo(x, y); g.fill(); }
        g.strokeStyle = '#3d4a22';
        g.lineWidth = 2;
        for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(4 + i * 5, 240); g.lineTo(10 + i * 4 + Math.sin(i) * 6, 150 + (i % 3) * 18); g.stroke(); }
        g.lineWidth = 1;
      };
      lookPicker(ui, el.querySelector('[data-look]'), 'elf', paint);
      paint();
      el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; if (b.dataset.act === 'go') ui.startGame(); else ui.openTitle(); });
      return el;
    },

    muster(ui) {
      const el = document.createElement('div');
      el.className = 'ki-muster';
      el.innerHTML = `<div class="ki-muster-wall">
          <div class="ki-muster-ledger">
            <div class="ki-muster-cap">Смотр новобранцев</div>
            <div class="ki-muster-line">Двор казармы, семь утра. Сержант идёт вдоль строя и останавливается перед вами.</div>
            <div class="ki-muster-ask">— Стражник или стражница? Лицо покажи. Волосы под шлем убрать.</div>
            <div class="ki-muster-look" data-look></div>
            <div class="ki-muster-ask" data-say>— Годен. Встать в строй.</div>
          </div>
          <div class="ki-muster-yard"><canvas width="256" height="320"></canvas></div>
          <div class="ki-muster-foot"><button class="ki-btn" data-act="back">Назад</button><button class="ki-btn" data-act="go">Встать в строй</button></div>
        </div>`;
      const cv = el.querySelector('canvas'), g = cv.getContext('2d');
      const paint = () => { const p = ui.portrait('muster'); g.fillStyle = '#d8d4c8'; g.fillRect(0, 0, 256, 320); if (p) g.drawImage(p, 0, 0, 256, 320); };
      lookPicker(ui, el.querySelector('[data-look]'), 'guard', paint);
      paint();
      el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; if (b.dataset.act === 'go') ui.startGame(); else ui.openTitle(); });
      return el;
    },

    chronicle(ui) {
      const el = document.createElement('div');
      el.className = 'ki-chronicle';
      const st = ui.startSetup;
      el.innerHTML = `<div class="ki-chronicle-page">
          <div class="ki-chronicle-cap">Летопись Старого форта</div>
          <div class="ki-chronicle-text">Ночь. В зале форта горит одна свеча. Писарь Гусь обмакивает перо и поднимает глаза на человека с железной левой рукой.</div>
          <div class="ki-chronicle-text">— Как тебя записать? Имя останется в летописи, что бы ни случилось дальше.</div>
          <label class="ki-chronicle-field">Имя: <input type="text" maxlength="24" spellcheck="false" value="${esc(st.name || '')}" placeholder="впишите имя"></label>
          <canvas class="ki-chronicle-quill" width="120" height="120"></canvas>
          <div class="ki-chronicle-note" data-note>Перо скрипит. Без имени летопись не начать.</div>
          <div class="ki-chronicle-foot"><button class="ki-btn" data-act="back">Назад</button><button class="ki-btn" data-act="go">Вписать</button></div>
        </div>`;
      const q = el.querySelector('canvas').getContext('2d');
      q.strokeStyle = '#2a1a0c';
      q.fillStyle = '#e8dcc0';
      q.lineWidth = 2;
      q.beginPath(); q.moveTo(18, 108); q.quadraticCurveTo(52, 60, 104, 10); q.quadraticCurveTo(74, 64, 26, 102); q.closePath(); q.fill(); q.stroke();
      for (let i = 0; i < 9; i++) { q.beginPath(); q.moveTo(40 + i * 7, 84 - i * 8); q.lineTo(54 + i * 7, 80 - i * 9); q.stroke(); }
      q.fillStyle = '#1a1008';
      q.beginPath(); q.arc(16, 110, 3, 0, Math.PI * 2); q.fill();
      const input = el.querySelector('input'), note = el.querySelector('[data-note]');
      input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') el.querySelector('[data-act=go]').click(); });
      input.addEventListener('input', () => { st.name = input.value; });
      setTimeout(() => input.focus({ preventScroll: true }), 0);
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'back') { ui.openTitle(); return; }
        const name = input.value.replace(/\s+/g, ' ').trim();
        if (!name) { note.textContent = 'Гусь ждёт: впишите имя.'; input.focus(); return; }
        st.name = name;
        ui.startGame();
      });
      return el;
    },

    slots(ui, mode) {
      const el = document.createElement('div');
      el.className = 'ki-slots ki-slots-' + mode;
      const Sv = K.Save, ids = mode === 'save' ? Sv.SLOTS : [Sv.QUICK, ...Sv.AUTOS, ...Sv.SLOTS];
      const label = id => id === Sv.QUICK ? 'Быстрое (F5)' : id.startsWith('auto') ? 'Авто ' + id.slice(4) : 'Ячейка ' + id.slice(4);
      let confirm = null, rows = new Map(), note = '';
      const paint = () => {
        const cells = ids.map(id => {
          const r = rows.get(id), m = r && r.meta, off = mode === 'load' && !r;
          const text = m ? `<b>${esc(sideName(m))}</b><span>день войны ${m.day}, ${two(m.hour)}:00 · ${esc(m.place)}</span><i>${dateLine(r.date)}</i>` : '<b>пусто</b><span></span><i></i>';
          const ask = confirm === id ? '<em>Ещё раз: перезаписать</em>' : '';
          return `<button class="ki-slot${r ? '' : ' empty'}${confirm === id ? ' ask' : ''}" data-slot="${id}"${off ? ' disabled' : ''}><span class="ki-slot-id">${label(id)}</span>${r && r.thumb ? `<img src="${r.thumb}" width="160" height="120" alt="">` : '<span class="ki-slot-thumb"></span>'}<span class="ki-slot-text">${text}${ask}</span></button>`;
        }).join('');
        el.innerHTML = `<div class="ki-slots-book">
            <div class="ki-slots-cap">${mode === 'save' ? 'Сохранить игру' : 'Загрузить игру'}</div>
            <div class="ki-slots-note">${esc(note || (mode === 'save' ? 'Восемь ячеек. Быстрое и три автосохранения пишутся сами: F5, сон, вход в зону.' : 'Сохранения лежат в этом компьютере и переживают закрытие окна.'))}</div>
            <div class="ki-slots-grid">${cells}</div>
            <div class="ki-slots-foot"><button class="ki-btn" data-act="back">Назад</button></div>
          </div>`;
      };
      const refresh = () => ui.saveList().then(list => { rows = new Map(list.map(r => [r.id, r])); paint(); }, err => { note = 'Сохранения недоступны: ' + (err && err.message || err); paint(); });
      paint();
      refresh();
      el.addEventListener('click', e => {
        const s = e.target.closest('[data-slot]');
        if (s && !s.disabled) {
          const id = s.dataset.slot;
          if (mode === 'load') { ui.loadFrom(id); return; }
          if (rows.has(id) && confirm !== id) { confirm = id; paint(); return; }
          confirm = null;
          ui.saveTo(id).then(why => { note = why || 'Сохранено: ' + label(id).toLowerCase(); refresh(); });
          return;
        }
        if (e.target.closest('[data-act=back]')) ui.closeSub();
      });
      el.refresh = refresh;
      return el;
    },

    settings(ui) {
      const el = document.createElement('div');
      el.className = 'ki-settings';
      const D = K.Data.DIFFICULTY;
      const paint = () => {
        const s = ui.settings, opt = (key, list) => list.map(([v, l]) => `<button class="ki-opt${s[key] === v ? ' on' : ''}" data-key="${key}" data-val="${v}">${l}</button>`).join('');
        const check = (key, l) => `<label class="ki-check"><input type="checkbox" data-flag="${key}"${s[key] ? ' checked' : ''}> ${l}</label>`;
        const range = (key, l, lo, hi) => `<label class="ki-range"><span>${l}</span><input type="range" min="${lo}" max="${hi}" value="${s[key]}" data-range="${key}"><b>${s[key]}${key === 'sens' ? ' %' : ''}</b></label>`;
        const d = D[s.difficulty];
        el.innerHTML = `<div class="ki-settings-board">
            <div class="ki-settings-cap">Настройки</div>
            <div class="ki-settings-cols">
              <fieldset><legend>Картинка</legend>
                <div class="ki-set"><span>Разрешение</span>${opt('lines', [[384, '512×384'], [480, '640×480'], [600, '800×600']])}</div>
                <div class="ki-set"><span>Трава и цветы</span>${opt('grass', [[0, 'нет'], [1, 'мало'], [2, 'много']])}</div>
                <div class="ki-set"><span>Радиус 3D-деревьев</span>${opt('treeRadius', [[25, '25 м'], [40, '40 м'], [60, '60 м']])}</div>
                <div class="ki-set"><span>Дальность леса</span>${opt('forest', [[0.75, 'близко'], [1, 'обычно'], [1.3, 'далеко']])}</div>
                <div class="ki-set"><span>Предел тел</span>${opt('bodies', [[60, '60'], [100, '100'], [160, '160']])}</div>
                ${check('dither', '16-битный цвет с точечным смешением')}
                ${check('precip', 'Капли дождя и снежинки')}
                ${check('blood', 'Брызги и лужи крови')}
                ${check('border', 'Показать границу 3D-деревьев')}
              </fieldset>
              <fieldset><legend>Звук и мышь</legend>
                ${range('volume', 'Звук', 0, 100)}
                ${range('music', 'Музыка', 0, 100)}
                ${range('sens', 'Чувствительность', 25, 200)}
                ${check('invert', 'Инверсия мыши')}
              </fieldset>
              <fieldset><legend>Сложность</legend>
                <div class="ki-set">${opt('difficulty', Object.entries(D).map(([k, v]) => [k, v.name]))}</div>
                <div class="ki-settings-line">Тяжёлое кровотечение ${d.heavy} с, урон врагов ×${String(d.harm).replace('.', ',')}, окно выноса ${d.ko} с.</div>
              </fieldset>
            </div>
            <div class="ki-settings-foot"><button class="ki-btn" data-act="back">Назад</button></div>
          </div>`;
      };
      paint();
      el.addEventListener('click', e => {
        const o = e.target.closest('[data-key]');
        if (o) { const raw = o.dataset.val, v = o.dataset.key === 'difficulty' ? raw : Number(raw); ui.setOption(o.dataset.key, v); paint(); return; }
        const f = e.target.closest('[data-flag]');
        if (f) { ui.setOption(f.dataset.flag, f.checked); return; }
        if (e.target.closest('[data-act=back]')) ui.closeSub();
      });
      el.addEventListener('input', e => { const r = e.target.closest('[data-range]'); if (!r) return; ui.setOption(r.dataset.range, Number(r.value)); r.nextElementSibling.textContent = r.value + (r.dataset.range === 'sens' ? ' %' : ''); });
      return el;
    },

    map(ui) {
      const el = document.createElement('div');
      el.className = 'ki-map';
      const S = ui.state, P = S.player, V = valley(ui, 'paper'), k = V.k, side = P.team, Wd = K.World;
      const seen = new Set(S.visited || []), spots = K.Places.SPOTS.filter(s => seen.has(s.id));
      const raids = Wd.reportsFor(S, side, 40).filter(r => r.at && /набег|Набег|штурм|Штурм/.test(r.text));
      el.innerHTML = `<div class="ki-map-sheet">
          <canvas width="${MAP_N}" height="${MAP_N}"></canvas>
          <div class="ki-map-side">
            <div class="ki-map-cap">Карта долины, день ${S.day}</div>
            <div class="ki-map-legend"><span class="me">▲ вы</span><span class="dot">● где бывали</span><span class="bell">♪ бубенцы</span><span class="raid">✕ набеги</span></div>
            <div class="ki-map-trip" data-trip>Щелчок по месту, где вы бывали: путь, время и опасность дороги.</div>
            <div class="ki-map-foot"><button class="ki-btn" data-act="close">Закрыть (M)</button></div>
          </div>
        </div>`;
      const cv = el.querySelector('canvas'), g = cv.getContext('2d'), info = el.querySelector('[data-trip]');
      let route = null, pick = null;
      const paint = () => {
        g.drawImage(V.canvas, 0, 0);
        if (route) {
          g.strokeStyle = '#a01810';
          g.lineWidth = 2.4;
          g.setLineDash([5, 3]);
          g.beginPath();
          route.pts.forEach(([x, z], n) => n ? g.lineTo(x / k, z / k) : g.moveTo(x / k, z / k));
          g.stroke();
          g.setLineDash([]);
        }
        g.font = 'italic 11px Georgia, serif';
        g.textAlign = 'left';
        g.textBaseline = 'middle';
        for (const s of spots) {
          const x = s.at[0] / k, y = s.at[1] / k;
          g.fillStyle = s === pick ? '#a01810' : '#2a1608';
          g.beginPath(); g.arc(x, y, s === pick ? 4.5 : 3.2, 0, Math.PI * 2); g.fill();
          g.fillText(s.name, x + 6, y);
        }
        g.font = 'bold 13px Georgia, serif';
        g.fillStyle = '#5a2a08';
        for (const h of S.heard || []) g.fillText('♪', h.at[0] / k - 4, h.at[1] / k);
        g.fillStyle = '#a01810';
        for (const r of raids) g.fillText('✕', r.at[0] / k - 4, r.at[r.at.length - 1] / k);
        const p = P.mv.pos, x = p[0] / k, y = p[2] / k, a = ui.yaw;
        g.fillStyle = '#c02010';
        g.strokeStyle = '#1a0804';
        g.beginPath();
        g.moveTo(x + Math.sin(a) * 8, y - Math.cos(a) * 8);
        g.lineTo(x + Math.sin(a + 2.5) * 6, y - Math.cos(a + 2.5) * 6);
        g.lineTo(x + Math.sin(a - 2.5) * 6, y - Math.cos(a - 2.5) * 6);
        g.closePath();
        g.fill();
        g.stroke();
      };
      paint();
      cv.addEventListener('click', e => {
        const [x, z] = mapPoint(cv, e, k);
        let best = null, bd = 14 * k;
        for (const s of spots) { const d = Math.hypot(s.at[0] - x, s.at[1] - z); if (d < bd) { bd = d; best = s; } }
        if (!best) { info.textContent = 'Здесь вы не бывали. Путь прокладывается только к знакомым местам.'; return; }
        pick = best;
        route = ui.tripTo(best);
        const min = Math.max(1, Math.round(route.time / 60)), h = route.hours.toFixed(1).replace('.', ',');
        info.innerHTML = `<b>${esc(best.name)}</b><div>Путь ${(route.length / 1000).toFixed(1).replace('.', ',')} км, бегом около ${min} мин (${h} ч по часам долины).</div><div class="ki-map-danger d${route.danger}">Дорога: ${esc(route.word)}</div>${route.why.map(w => `<div class="ki-map-why">· ${esc(w)}</div>`).join('')}`;
        paint();
      });
      el.addEventListener('click', e => { if (e.target.closest('[data-act=close]')) ui.closePanel(true); });
      return el;
    },

    pause(ui) {
      const el = document.createElement('div');
      el.className = 'ki-menu';
      const S = ui.state, P = S.player, hh = Math.floor(S.hour);
      const exit = ui.opts.onExit ? '<button class="ki-btn" data-act="exit">Выход</button>' : '';
      const keys = KEYS.map(([k, v]) => `<div class="ki-key"><span>${k}</span>${v}</div>`).join('');
      const who = P.name || (K.Body.HEROES[P.kit.hero] ? K.Body.HEROES[P.kit.hero].name : '');
      el.innerHTML = `<div class="ki-menu-plate">
        <div class="ki-menu-title">${K.TITLE}</div>
        <div class="ki-menu-sub">${esc(who)} · день ${S.day}, ${two(hh)}:${two(Math.floor((S.hour - hh) * 60))}</div>
        <div class="ki-menu-cols"><div class="ki-menu-acts">
        <button class="ki-btn" data-act="resume">Продолжить</button>
        <button class="ki-btn" data-act="save">Сохранить…</button>
        <button class="ki-btn" data-act="load">Загрузить…</button>
        <button class="ki-btn" data-act="map">Карта (M)</button>
        <button class="ki-btn" data-act="reports">Донесения…</button>
        <button class="ki-btn" data-act="settings">Настройки…</button>
        <button class="ki-btn" data-act="title">Главное меню</button>
        ${exit}
        <div class="ki-set ki-menu-tests"><span>Проверка</span><button class="ki-opt" data-act="duel">Учебный бой</button><button class="ki-opt" data-act="wounds">Раны</button><button class="ki-opt" data-act="squad">Отряды</button></div>
        </div><div class="ki-keys">${keys}</div></div>
      </div>`;
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'duel') ui.openDuel();
        else if (act === 'wounds') ui.openWounds();
        else if (act === 'squad') ui.openSquad();
        else if (act === 'reports') ui.openReports();
        else if (act === 'save') ui.openSlots('save', 'menu');
        else if (act === 'load') ui.openSlots('load', 'menu');
        else if (act === 'settings') ui.openSettings('menu');
        else if (act === 'map') ui.openMap();
        else if (act === 'title') ui.openTitle();
        else if (act === 'resume') ui.closeMenu(true);
        else if (act === 'exit') ui.exit();
      });
      return el;
    },

    search(ui, body) {
      const el = document.createElement('div');
      el.className = 'ki-search';
      const paint = () => {
        const list = K.Body.belongings(body, ui.state), groups = new Map();
        for (const it of list) {
          if (!groups.has(it.group)) groups.set(it.group, []);
          groups.get(it.group).push(it);
        }
        const rows = [...groups].map(([g, items]) => `<div class="ki-search-group">${g}</div>` + items.map(it =>
          `<div class="ki-search-row"><span>${esc(K.Data.ITEMS[it.id].name)}</span>${it.n > 1 ? `<b class="ki-search-n">×${it.n}</b>` : ''}<button class="ki-opt" data-take="${esc(it.key)}">Взять</button></div>`).join('')).join('');
        el.innerHTML = `<div class="ki-search-cap">Обыск</div>
          <div class="ki-search-who">${esc(K.Body.title(body.kit))}</div>
          ${rows || '<div class="ki-search-empty">Ничего не осталось</div>'}
          <div class="ki-search-foot">${list.length ? '<button class="ki-btn" data-act="all">Взять всё</button>' : ''}<button class="ki-btn" data-act="close">Закрыть (E)</button></div>`;
      };
      paint();
      el.addEventListener('click', e => {
        const t = e.target.closest('[data-take]');
        if (t) { ui.takeItem(body, t.dataset.take); paint(); return; }
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'all') { ui.takeAll(body); paint(); }
        else if (b.dataset.act === 'close') ui.closePanel(true);
      });
      return el;
    },

    duel(ui) {
      const el = document.createElement('div');
      el.className = 'ki-yard';
      const c = ui.duelSetup;
      const opts = (name, list, cur) => list.map(([v, label]) => `<button class="ki-opt${cur === v ? ' on' : ''}" data-${name}="${v}">${label}</button>`).join('');
      const weapons = cur => opts('w', WEAPON_IDS.map(w => [w, K.Data.ITEMS[w].name]), cur);
      const paint = () => {
        const past = ui.duels.slice(-5).reverse().map(d => `<div class="ki-yard-row"><b>${d.win ? 'победа' : 'поражение'}</b> ${esc(d.line)}</div>`).join('');
        el.innerHTML = `<div class="ki-yard-board">
          <div class="ki-yard-title">Учебный бой</div>
          <div class="ki-yard-cols">
            <div class="ki-yard-col" data-col="me"><div class="ki-yard-cap">Вы</div>
              <div class="ki-yard-set">${weapons(c.me.weapon)}</div>
              <label class="ki-check"><input type="checkbox" data-shield="me"${c.me.shield ? ' checked' : ''}${one(c.me.weapon) ? '' : ' disabled'}> щит</label></div>
            <div class="ki-yard-col" data-col="foe"><div class="ki-yard-cap">Противник</div>
              <div class="ki-yard-set">${opts('side', FOES, c.foe.side)}</div>
              <div class="ki-yard-set">${weapons(c.foe.weapon)}</div>
              <label class="ki-check"><input type="checkbox" data-shield="foe"${c.foe.shield ? ' checked' : ''}${one(c.foe.weapon) ? '' : ' disabled'}> щит</label>
              <div class="ki-yard-set">${opts('exp', Object.entries(K.Data.EXP).map(([k, v]) => [k, v.name]), c.foe.exp)}</div></div>
          </div>
          ${past ? `<div class="ki-yard-past"><div class="ki-yard-cap">Последние бои</div>${past}</div>` : ''}
          <div class="ki-yard-foot"><button class="ki-btn" data-act="fight">К бою</button><button class="ki-btn" data-act="back">Назад</button></div>
        </div>`;
      };
      paint();
      el.addEventListener('click', e => {
        const col = e.target.closest('[data-col]'), who = col ? c[col.dataset.col] : null;
        const w = e.target.closest('[data-w]'), s = e.target.closest('[data-side]'), x = e.target.closest('[data-exp]'), sh = e.target.closest('[data-shield]');
        if (w && who) { who.weapon = w.dataset.w; if (!one(who.weapon)) who.shield = false; paint(); return; }
        if (s) { c.foe.side = s.dataset.side; paint(); return; }
        if (x) { c.foe.exp = x.dataset.exp; paint(); return; }
        if (sh) { c[sh.dataset.shield].shield = sh.checked; return; }
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'fight') ui.startDuel();
        else if (b.dataset.act === 'back') ui.closeYard();
      });
      return el;
    },

    wounds(ui) {
      const el = document.createElement('div');
      el.className = 'ki-yard';
      const row = (cap, list) => `<div class="ki-yard-cap">${cap}</div><div class="ki-yard-set">${list.map(([k, v]) => `<button class="ki-opt" data-w="${k}">${v}</button>`).join('')}</div>`;
      el.innerHTML = `<div class="ki-yard-board">
        <div class="ki-yard-title">Проверка ран</div>
        <div class="ki-yard-line">Раны ставятся герою сразу. Перевязка: B. Вылечить: последняя кнопка.</div>
        ${row('Отрубить', [['lFore', 'левую по локоть'], ['rFore', 'правую по локоть'], ['lArm', 'левую руку'], ['rArm', 'правую руку'], ['lShin', 'левую по колено'], ['rShin', 'правую по колено'], ['lThigh', 'левую ногу'], ['rThigh', 'правую ногу']])}
        ${row('Глаза', [['lEye', 'выколоть левый'], ['rEye', 'выколоть правый'], ['patch', 'повязка'], ['glass', 'стеклянный'], ['resin', 'смоляной'], ['ruby', 'рубиновый']])}
        ${row('Кровь и вещи', [['light', 'порез'], ['medium', 'укол в живот'], ['bandage', 'три бинта'], ['crutch', 'костыль'], ['chair', 'коляска рядом'], ['peg', 'деревяшка на культю']])}
        <div class="ki-yard-foot"><button class="ki-btn" data-w="heal">Вылечить всё</button><button class="ki-btn" data-act="back">Назад</button></div>
      </div>`;
      el.addEventListener('click', e => {
        const w = e.target.closest('[data-w]');
        if (w) { ui.testWound(w.dataset.w); if (w.dataset.w === 'heal') ui.hud.toast('Герой здоров'); else ui.hud.toast('Готово: ' + w.textContent); return; }
        const b = e.target.closest('[data-act]');
        if (b && b.dataset.act === 'back') ui.closeYard();
      });
      return el;
    },

    ko(ui) {
      const el = document.createElement('div');
      el.className = 'ki-ko';
      el.innerHTML = `<div class="ki-ko-title">Вы без сознания</div><div class="ki-ko-line" data-line>Если в 30 шагах есть свой, он перевяжет и вынесет. Осталось <b data-left>20</b> с.</div><div class="ki-ko-help" data-help></div>`;
      const line = el.querySelector('[data-line]'), left = el.querySelector('[data-left]'), help = el.querySelector('[data-help]');
      el.tick = (sec, who, stable) => {
        if (stable) line.textContent = 'Вас перевязали. Кровь остановлена.';
        else left.textContent = Math.ceil(sec);
        if (help.textContent !== who) help.textContent = who;
      };
      return el;
    },

    rescued(ui, res) {
      const el = document.createElement('div');
      el.className = 'ki-fallen ki-rescued';
      el.innerHTML = `<div class="ki-fallen-plate">
        <div class="ki-fallen-title">Вас вынес ${esc(res.by)}</div>
        <div class="ki-rescued-rows">
          <div><span>Откуда</span>${esc(res.from)}</div>
          <div><span>Куда</span>${esc(res.to)}</div>
          <div><span>Прошло</span>${res.hours} часов</div>
        </div>
        <div class="ki-fallen-line">Сума при вас. Оружие и щит остались на месте боя.</div>
        <div class="ki-outcome-foot"><button class="ki-btn" data-act="next">Дальше</button></div>
      </div>`;
      el.addEventListener('click', e => { if (e.target.closest('[data-act="next"]')) ui.afterRescue(); });
      return el;
    },

    captive(ui, p) {
      const el = document.createElement('div');
      el.className = 'ki-captive';
      const acts = {
        surrender: [['tie', 'Связать'], ['free', 'Отпустить']],
        bound: [['lead', 'Вести за собой'], ['free', 'Отпустить']],
        led: [['leave', 'Оставить здесь'], ['free', 'Отпустить']]
      }[p.state] || [];
      const state = { surrender: 'стоит на коленях и просит пощады', bound: 'связан', led: 'идёт за вами связанным' }[p.state] || '';
      el.innerHTML = `<div class="ki-captive-cap">${esc(K.Body.nameOf(p))}</div>
        <div class="ki-captive-who">${esc(K.Data.SIDES[p.team || p.kit.side].name[p.kit.fig])}, ${state}</div>
        <div class="ki-captive-note">Отпущенный уйдёт к своим и запомнит вас. Убить можно оружием.</div>
        <div class="ki-captive-foot">${acts.map(([a, l]) => `<button class="ki-btn" data-cap="${a}">${l}</button>`).join('')}<button class="ki-btn" data-act="close">Закрыть (E)</button></div>`;
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-cap]');
        if (b) { ui.captiveAct(p, b.dataset.cap); return; }
        if (e.target.closest('[data-act="close"]')) ui.closePanel(true);
      });
      return el;
    },

    squad(ui) {
      const el = document.createElement('div');
      el.className = 'ki-yard';
      const side = ui.state.player.team, foes = K.Data.ENEMIES[side] || [], st = K.Data.STANDING[side];
      const c = ui.squadSetup || (ui.squadSetup = { place: 'here', own: 4, foes: 5, foe: foes[0], valued: true, debt: false });
      if (!foes.includes(c.foe)) c.foe = foes[0];
      const opts = (name, list, cur) => list.map(([v, label]) => `<button class="ki-opt${String(cur) === String(v) ? ' on' : ''}" data-${name}="${v}">${label}</button>`).join('');
      const places = [['here', 'Здесь'], ...Object.entries(K.Places.GROUNDS).map(([k, g]) => [k, g.name])];
      const sideName = s => K.Data.SIDES[s].name.m.toLowerCase();
      const paint = () => {
        el.innerHTML = `<div class="ki-yard-board">
          <div class="ki-yard-title">Отряды</div>
          <div class="ki-yard-line">Ваша сторона: ${esc(K.Data.SIDES[side].name.m.toLowerCase())}. Свои идут за вами, команды отряду: Q.</div>
          <div class="ki-yard-cap">Где</div><div class="ki-yard-set">${opts('place', places, c.place)}</div>
          <div class="ki-yard-cap">Свои</div><div class="ki-yard-set">${opts('own', [[0, 'никого'], [2, 'двое'], [4, 'четверо']], c.own)}</div>
          <div class="ki-yard-cap">Противник</div><div class="ki-yard-set">${opts('foe', foes.map(f => [f, sideName(f)]), c.foe)}</div>
          <div class="ki-yard-set">${opts('foes', [[1, 'один'], [3, 'трое'], [5, 'пятеро']], c.foes)}</div>
          ${st ? `<label class="ki-check"><input type="checkbox" data-flag="valued"${c.valued ? ' checked' : ''}> ${esc(st.name)} ${Math.max(st.command, st.rescue)}: можно командовать, свои выносят</label>` : ''}
          <label class="ki-check"><input type="checkbox" data-flag="debt"${c.debt ? ' checked' : ''}> свои в долгу перед вами (долг 1)</label>
          <div class="ki-yard-foot"><button class="ki-btn" data-act="go">Начать</button><button class="ki-btn" data-act="back">Назад</button></div>
        </div>`;
      };
      paint();
      el.addEventListener('click', e => {
        for (const k of ['place', 'own', 'foe', 'foes']) {
          const o = e.target.closest('[data-' + k + ']');
          if (o) { c[k] = k === 'own' || k === 'foes' ? Number(o.dataset[k]) : o.dataset[k]; paint(); return; }
        }
        const f = e.target.closest('[data-flag]');
        if (f) { c[f.dataset.flag] = f.checked; return; }
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'go') ui.startSquad(c);
        else if (b.dataset.act === 'back') ui.closeYard();
      });
      return el;
    },

    fallen(ui, res) {
      const el = document.createElement('div');
      el.className = 'ki-fallen';
      el.innerHTML = `<div class="ki-fallen-plate">
        <div class="ki-fallen-title">${esc(res.title)}</div>
        <div class="ki-fallen-line">${esc(res.line)}</div>
        ${res.by ? `<div class="ki-fallen-by">${esc(res.by)}</div>` : ''}
        <div class="ki-fallen-where">${esc(res.where)}</div>
        <div class="ki-outcome-foot"><button class="ki-btn" data-act="load">Загрузить</button><button class="ki-btn" data-act="menu">Главное меню</button></div>
      </div>`;
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'load') ui.openSlots('load', 'fallen');
        else if (b.dataset.act === 'menu') ui.openTitle();
      });
      return el;
    },

    outcome(ui, res) {
      const el = document.createElement('div');
      el.className = 'ki-outcome';
      const again = res.duel ? '<button class="ki-btn" data-act="again">Ещё раз</button>' : '';
      const next = res.win ? '<button class="ki-btn" data-act="close">Дальше</button>' : '<button class="ki-btn" data-act="rise">Встать</button>';
      el.innerHTML = `<div class="ki-outcome-title">${res.win ? 'Победа' : 'Поражение'}</div>
        <div class="ki-outcome-line">${esc(res.line)}</div>
        <div class="ki-outcome-foot">${again}${next}</div>`;
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'again') ui.startDuel();
        else if (b.dataset.act === 'rise') ui.rise();
        else if (b.dataset.act === 'close') ui.closePanel(true);
      });
      return el;
    },

    shop(ui, shop, keeper) {
      const el = document.createElement('div');
      el.className = 'ki-shop';
      const E = K.Econ, S = ui.state, P = S.player, sh = E.SHOPS[shop];
      const paint = note => {
        const o = E.offers(S, P.bag, shop), groups = new Map();
        for (const it of o.sells) {
          const g = GROUP[K.Data.ITEMS[it.id].kind] || 'Разное';
          if (!groups.has(g)) groups.set(g, { rows: [], stock: it.stock });
          groups.get(g).rows.push(it);
        }
        const purse = E.purse(P.bag);
        const counter = [...groups].map(([g, d]) => {
          const mark = E.stockNote(S, d.stock);
          return `<div class="ki-shop-sec"><b>${g}</b>${mark ? `<i>${esc(mark)}</i>` : ''}</div>` + d.rows.map(it =>
            `<div class="ki-shop-row"><span>${esc(K.Data.ITEMS[it.id].name)}${it.lot > 1 ? ' ×' + it.lot : ''}</span><em>${it.price} сер.</em><button class="ki-opt" data-buy="${it.id}"${it.price > purse ? ' disabled' : ''}>Купить</button></div>`).join('');
        }).join('');
        const mine = o.buys.map(it => `<div class="ki-shop-row"><span>${esc(K.Data.ITEMS[it.id].name)}${it.n > 1 ? ' ×' + it.n : ''}</span><em>${it.price}${it.lot > 1 ? ' за ' + it.lot : ''} сер.</em><button class="ki-opt" data-sell="${it.id}">Продать</button></div>`).join('');
        el.innerHTML = `<div class="ki-shop-board">
          <div class="ki-shop-head"><span class="ki-shop-name">${esc(sh.name)}</span><span class="ki-shop-keeper">${esc(keeper ? K.Body.nameOf(keeper) : sh.keeper)}</span></div>
          <div class="ki-shop-cols">
            <div class="ki-shop-counter">${counter || '<div class="ki-shop-empty">Здесь только покупают</div>'}</div>
            <div class="ki-shop-mine"><div class="ki-shop-sec"><b>Ваше на продажу</b></div>${mine || '<div class="ki-shop-empty">Нечего предложить</div>'}</div>
          </div>
          <div class="ki-shop-foot"><span class="ki-purse">Кошель: <b>${purse}</b> сер.</span><span class="ki-shop-note">${esc(note || '')}</span><button class="ki-btn" data-act="close">Уйти (E)</button></div>
        </div>`;
      };
      paint(E.refuses(S) ? 'С вами здесь не торгуют' : '');
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-buy]'), s = e.target.closest('[data-sell]');
        if (b && !b.disabled) { paint(ui.trade('buy', shop, b.dataset.buy)); return; }
        if (s) { paint(ui.trade('sell', shop, s.dataset.sell)); return; }
        if (e.target.closest('[data-act="close"]')) ui.closePanel(true);
      });
      return el;
    },

    doctor(ui, keeper, who, first) {
      const el = document.createElement('div');
      el.className = 'ki-talk' + (who === 'ryabina' ? ' ki-talk-herbs' : '');
      const E = K.Econ, S = ui.state, P = S.player, herbs = who === 'ryabina';
      const paint = said => {
        const opts = E.doctor(S, P, who), purse = E.purse(P.bag), eye = herbs && Object.values(P.kit.eyes || {}).some(v => v === true || v === 'patch');
        const greet = herbs ? (P.team !== 'elf' ? '«Чужим я трав не даю.»' : K.Wounds.bleeding(P.fight) ? '«Ляг. Подорожник и мох уймут кровь.»' : '«Своим даром. Что болит?»') : E.refuses(S) ? '«Врагам города я не лекарь. Уходи.»' : K.Wounds.bleeding(P.fight) ? '«Садись, кровь сначала уймём.»' : E.stumps(P.kit).length ? '«Культю надо залечить, иначе протез не встанет.»' : '«С чем пришёл?»';
        el.innerHTML = `<div class="ki-talk-plate">
          <div class="ki-talk-who">${esc(K.Body.nameOf(keeper))}, ${herbs ? 'травница' : 'лекарь'}</div>
          <div class="ki-talk-line">${esc(said || greet)}</div>
          <ol class="ki-talk-opts">${opts.map(o => `<li><button class="ki-talk-opt" data-cure="${o.id}"${o.can && o.price <= purse ? '' : ' disabled'}><span>${esc(o.name)}</span><em>${o.can ? (o.price ? o.price + ' сер.' : 'даром') + (o.hours ? ', ' + o.hours + ' ч' : '') : esc(o.why)}</em></button></li>`).join('')}
            ${herbs && P.team === 'elf' ? `<li><button class="ki-talk-opt" data-act="eye"${eye ? '' : ' disabled'}><span>Смоляной глаз</span><em>${eye ? 'примерка' : 'глаза на месте'}</em></button></li><li><button class="ki-talk-opt" data-act="give"${S.village && S.village.upgrades.garden ? '' : ' disabled'}><span>Бинт и настойка с огорода</span><em>${S.village && S.village.upgrades.garden ? 'даром' : 'нужен огород'}</em></button></li>` : ''}
            <li><button class="ki-talk-opt" data-act="close"><span>Уйти</span><em>E</em></button></li></ol>
          <div class="ki-talk-foot">Кошель: <b>${purse}</b> сер. · жизнь ${Math.max(0, Math.round(P.fight.life))}</div>
        </div>`;
      };
      paint(first);
      el.addEventListener('click', e => {
        const c = e.target.closest('[data-cure]');
        if (c && !c.disabled) { paint(ui.cure(c.dataset.cure, who)); return; }
        const b = e.target.closest('[data-act]');
        if (!b || b.disabled) return;
        if (b.dataset.act === 'eye') ui.openFit(keeper, 'ryabina');
        else if (b.dataset.act === 'give') paint([ui.storeAct('take', 'bandage'), ui.storeAct('take', 'tincture')].join('. '));
        else if (b.dataset.act === 'close') ui.closePanel(true);
      });
      return el;
    },

    council(ui, keeper, first) {
      const el = document.createElement('div');
      el.className = 'ki-council';
      const S = ui.state, L = K.Elves, V = L.state(S);
      const paint = said => {
        const m = V.morning.day === S.day ? V.morning.lines : (L.morning(S) || { lines: ['Разведчики ещё не вернулись'] }).lines, tasks = L.tasks(S), C = S.campaign || {};
        const part = C.part ? `Часть ${['', 'I', 'II', 'III'][C.part]}` : '';
        el.innerHTML = `<div class="ki-council-ring">
            <div class="ki-council-cap">Совет у Старшего дуба <i>${esc(part)}</i></div>
            <div class="ki-council-said">${esc(said || '«Говори, с чем пришёл. Корни слушают.»')}</div>
            <div class="ki-council-cols">
              <div><b>Разведчики, день ${S.day}</b>${m.map(l => `<p>· ${esc(l)}</p>`).join('')}</div>
              <div><b>Что делать</b>${tasks.map((t, i) => `<button class="ki-council-task" data-task="${i}">${esc(t.text)}</button>`).join('')}</div>
            </div>
            <div class="ki-council-foot"><span>Уважение деревни: <b>${Math.round(S.standing.respect || 0)}</b> · домов цело ${L.intact(S)} · жителей ${S.world ? S.world.sides.elf.people : 44}</span><button class="ki-btn" data-act="close">Уйти (E)</button></div>
          </div>`;
        el.tasks = tasks;
      };
      paint(first);
      el.addEventListener('click', e => {
        const t = e.target.closest('[data-task]');
        if (t) { ui.setTask(el.tasks[Number(t.dataset.task)]); return; }
        if (e.target.closest('[data-act="close"]')) ui.closePanel(true);
      });
      return el;
    },

    elfTalk(ui, q, first) {
      const el = document.createElement('div');
      el.className = 'ki-elftalk';
      const S = ui.state, L = K.Elves, fire = L.burning(S).length > 0, joined = q.squad === 'player';
      const lines = { wood: 'Колю дрова на зиму', herbs: 'Сушу травы для Рябины', cook: 'Варю на всех у дуба', craft: 'Плету верёвки для помостов', watch: 'Смотрю за тропами', hunt: 'Хожу на кабана', council: 'Слушаю старших' };
      const r = q.villager !== undefined ? L.state(S).people[q.villager] : null;
      const paint = said => {
        const own = r && r.role === 'leader' ? '«Ты со мной? Засады лучше вдвоём.»' : '«' + (lines[r ? r.job : 'cook'] || 'Живём, пока лес стоит') + '.»';
        el.innerHTML = `<div class="ki-elftalk-bark">
            <div class="ki-elftalk-who">${esc(K.Body.nameOf(q))}${q.debt ? ` <i>долг ${q.debt}</i>` : ''}</div>
            <div class="ki-elftalk-line">${esc(said || (fire ? '«Горит! Тушить надо!»' : own))}</div>
            <div class="ki-elftalk-acts">
              ${fire ? '<button class="ki-btn" data-act="call">Зови всех тушить!</button>' : ''}
              ${joined ? '<button class="ki-btn" data-act="leave">Оставайся здесь</button>' : '<button class="ki-btn" data-act="join">Идём со мной</button>'}
              <button class="ki-btn" data-act="close">Дальше (E)</button>
            </div>
          </div>`;
      };
      paint(first);
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'close') { ui.closePanel(true); return; }
        const said = ui.elfAct(b.dataset.act, q);
        if (b.dataset.act === 'call') { ui.closePanel(true); ui.hud.toast(said, 4); return; }
        paint(said);
      });
      return el;
    },

    store(ui) {
      const el = document.createElement('div');
      el.className = 'ki-store';
      const S = ui.state, P = S.player, L = K.Elves, name = id => esc(K.Data.ITEMS[id] ? K.Data.ITEMS[id].name : id);
      const paint = said => {
        const st = L.stockOf(S), mine = P.bag.filter(s => L.STOCK[s.id] || s.id === 'silver'), gives = Object.keys(L.GIVES);
        el.innerHTML = `<div class="ki-store-earth">
            <div class="ki-store-cap">Кладовая Корней</div>
            <div class="ki-store-cols">
              <div class="ki-store-shelf"><b>Запасы</b>${['food', 'cloth', 'iron', 'medicine', 'wood', 'silver'].map(k => `<p><span>${{ food: 'еда', cloth: 'ткань', iron: 'железо', medicine: 'лекарства', wood: 'дерево', silver: 'серебро' }[k]}</span><em>${Math.round(st[k] || 0)}</em></p>`).join('')}</div>
              <div class="ki-store-bag"><b>Отдать в кладовую</b>${mine.map(s => `<p><span>${name(s.id)} ×${s.n}</span><button class="ki-opt" data-put="${s.id}">Отдать</button></p>`).join('') || '<i>Нечего отдать: мясо, шкуры, травы, тюки, серебро</i>'}</div>
              <div class="ki-store-take"><b>Взять</b>${gives.map(id => `<p><span>${name(id)}</span><button class="ki-opt" data-take="${id}">Взять</button></p>`).join('')}</div>
            </div>
            <div class="ki-store-said">${esc(said || 'Добычу делите сами: отданное растит уважение и деревню.')}</div>
            <div class="ki-store-foot"><button class="ki-btn" data-act="close">Закрыть (E)</button></div>
          </div>`;
      };
      paint();
      el.addEventListener('click', e => {
        const a = e.target.closest('[data-put]'), b = e.target.closest('[data-take]');
        if (a) { paint(ui.storeAct('put', a.dataset.put)); return; }
        if (b) { paint(ui.storeAct('take', b.dataset.take)); return; }
        if (e.target.closest('[data-act="close"]')) ui.closePanel(true);
      });
      return el;
    },

    village(ui) {
      const el = document.createElement('div');
      el.className = 'ki-village';
      const S = ui.state, L = K.Elves, V = L.state(S), o = K.Places.town(ui.T);
      let tab = 'houses';
      const paint = said => {
        const st = L.stockOf(S), alive = V.people.filter(r => r.alive);
        const houses = L.HOUSES.map(id => { const h = V.houses[id], B = K.Places.BUILDINGS.find(b => b.id === id); return `<p class="${h.burnt ? 'burnt' : h.fire > 0 ? 'fire' : h.hp < 99 ? 'hurt' : ''}"><span>${esc(B.name)}</span><em>${h.burnt ? 'сгорел' : h.fire > 0 ? 'горит' : h.hp < 99 ? 'повреждён' : 'цел'}</em>${h.burnt ? `<button class="ki-opt" data-rebuild="${id}"${L.canPay(S, L.REBUILD) ? '' : ' disabled'}>Отстроить</button>` : ''}</p>`; }).join('');
        const people = alive.map(r => `<p><span>${esc(r.name)}</span><em>${{ elder: 'старейшина', leader: 'вожак', healer: 'травница', carver: 'резчик', fighter: 'боец', villager: 'житель' }[r.role]}${r.wound && r.wound.cut && Object.values(r.wound.cut).some(v => v !== 'healed') ? ', ранен' : ''}${r.debt ? ', долг ' + r.debt : ''}</em></p>`).join('');
        const ups = Object.entries(L.UPGRADES).map(([id, U]) => `<p class="${V.upgrades[id] ? 'done' : ''}"><span>${esc(U.name)}</span><em>${V.upgrades[id] ? 'построено' : Object.entries(U.cost).map(([k, v]) => v + ' ' + { food: 'еды', cloth: 'ткани', iron: 'железа', wood: 'дерева', silver: 'сер.' }[k]).join(', ')}</em><i>${esc(U.gives)}</i>${V.upgrades[id] ? '' : `<button class="ki-opt" data-build="${id}"${L.canPay(S, U.cost) ? '' : ' disabled'}>Строить</button>`}</p>`).join('');
        const oak = V.oak.length ? V.oak.map(n => `<span>${esc(n)}</span>`).join('') : '<i>На дубе пока нет новых имён</i>';
        el.innerHTML = `<div class="ki-village-board">
            <div class="ki-village-cap">Корни · день ${S.day} · уважение ${Math.round(S.standing.respect || 0)}</div>
            <div class="ki-village-tabs">${[['houses', 'Дома'], ['people', 'Жители ' + alive.length], ['build', 'Отстройка'], ['oak', 'Имена на дубе']].map(([k, l]) => `<button class="ki-opt${tab === k ? ' on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
            <div class="ki-village-body">
              <canvas width="220" height="220"></canvas>
              <div class="ki-village-list">${tab === 'houses' ? houses : tab === 'people' ? people : tab === 'build' ? ups : `<div class="ki-village-oak">${oak}</div>`}</div>
            </div>
            <div class="ki-village-stock">Кладовая: еда ${Math.round(st.food || 0)}, ткань ${Math.round(st.cloth || 0)}, железо ${Math.round(st.iron || 0)}, лекарства ${Math.round(st.medicine || 0)}, дерево ${Math.round(st.wood || 0)}, серебро ${Math.round(st.silver || 0)}</div>
            <div class="ki-village-said">${esc(said || '')}</div>
            <div class="ki-village-foot"><button class="ki-btn" data-act="close">Закрыть (J)</button></div>
          </div>`;
        const g = el.querySelector('canvas').getContext('2d'), c = [340, 712], k = 220 / 150;
        g.fillStyle = '#2c3a1e'; g.fillRect(0, 0, 220, 220);
        g.fillStyle = '#3c5a26'; g.beginPath(); g.arc((330 - c[0]) * k + 110, (700 - c[1]) * k + 110, 14, 0, Math.PI * 2); g.fill();
        for (const id of L.HOUSES) {
          const H = o.houses[id], h = V.houses[id];
          if (!H) continue;
          g.save(); g.translate((H.at[0] - c[0]) * k + 110, (H.at[1] - c[1]) * k + 110); g.rotate(H.rot);
          g.fillStyle = h.burnt ? '#1a1410' : h.fire > 0 ? '#d05018' : h.hp < 99 ? '#9a7040' : '#c8a868';
          g.fillRect(-H.w * k / 2, -H.d * k / 2, H.w * k, H.d * k);
          g.restore();
        }
        g.fillStyle = '#6a90b0';
        for (const w of o.wells) g.fillRect((w.at[0] - c[0]) * k + 108, (w.at[1] - c[1]) * k + 108, 4, 4);
      };
      paint();
      el.addEventListener('click', e => {
        const tb = e.target.closest('[data-tab]'), bd = e.target.closest('[data-build]'), rb = e.target.closest('[data-rebuild]');
        if (tb) { tab = tb.dataset.tab; paint(); return; }
        if (bd && !bd.disabled) { paint(ui.storeAct('build', bd.dataset.build)); return; }
        if (rb && !rb.disabled) { paint(ui.storeAct('rebuild', rb.dataset.rebuild)); return; }
        if (e.target.closest('[data-act="close"]')) ui.closePanel(true);
      });
      return el;
    },

    pass(ui, q) {
      const el = document.createElement('div');
      el.className = 'ki-pass';
      const v = q.visitor, Gd = K.Guard, asked = new Set();
      let searched = false;
      const seal = (g, x, y, kind, fake) => {
        g.save(); g.translate(x, y);
        g.fillStyle = kind === 'palace' ? '#8a1a14' : kind === 'town' ? '#2a4a7a' : '#5a6a20';
        g.beginPath(); g.arc(0, 0, 22, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#f0e0c0'; g.lineWidth = 2;
        g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#f0e0c0';
        if (kind === 'palace') { g.fillRect(-4, -10, 8, 18); g.fillRect(-9, 6, 18, 3); if (!fake) { g.beginPath(); g.moveTo(0, -16); g.lineTo(3, -11); g.lineTo(-3, -11); g.fill(); } else g.fillRect(5, -12, 3, 3); }
        else if (kind === 'town') { g.beginPath(); g.moveTo(-8, 6); g.quadraticCurveTo(-8, -10, 0, -10); g.quadraticCurveTo(8, -10, 8, 6); g.closePath(); g.fill(); g.fillRect(fake ? -2 : -1, 6, 2, 5); }
        else { g.fillRect(-1, -12, 2, 18); g.fillRect(-11, -6, 22, 2); g.beginPath(); g.arc(-9, 0, 4, 0, Math.PI); g.arc(fake ? 11 : 9, 0, 4, 0, Math.PI); g.fill(); }
        g.restore();
      };
      const face = (g, k) => {
        const c = a => `rgb(${a.map(x => Math.round(x * 255)).join(',')})`;
        g.fillStyle = '#c8b890'; g.fillRect(0, 0, 120, 140);
        g.fillStyle = c(k.main); g.fillRect(20, 110, 80, 30);
        g.fillStyle = c(k.skin); g.beginPath(); g.ellipse(60, 66, 30, 38, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = c(k.hairColor); g.beginPath(); g.ellipse(60, 40, 32, 18, 0, Math.PI, Math.PI * 2); g.fill();
        if (k.head === 'kerchief' || k.head === 'cap') { g.fillStyle = c(k.accent); g.fillRect(28, 26, 64, 14); }
        g.fillStyle = '#2a1a10'; g.fillRect(46 + (k.face % 2), 62, 6, 4); g.fillRect(68 - (k.face % 2), 62, 6, 4);
        g.fillRect(54, 88, 12 + k.face, 3);
        if (k.beard) { g.fillStyle = c(k.hairColor); g.beginPath(); g.ellipse(60, 96, 22, 14, 0, 0, Math.PI); g.fill(); }
      };
      const paint = said => {
        const qs = [['from', 'Откуда идёшь?'], ['to', 'К кому?'], ['why', 'Зачем?']];
        el.innerHTML = `<div class="ki-pass-desk">
            <div class="ki-pass-cap">Проверка пропуска у ворот дворца</div>
            <div class="ki-pass-cols">
              <div class="ki-pass-who"><canvas width="120" height="140" data-face></canvas><b>${esc(v.name)}</b>
                <div class="ki-pass-qs">${qs.map(([k, l]) => `<button class="ki-opt" data-q="${k}"${asked.has(k) ? ' disabled' : ''}>${l}</button>${asked.has(k) ? `<i>«${esc(v.answer[k])}»</i>` : ''}`).join('')}</div>
                <button class="ki-opt" data-act="search"${searched ? ' disabled' : ''}>Обыскать</button>${searched ? `<i>В суме: ${v.items.map(id => esc(K.Data.ITEMS[id] ? K.Data.ITEMS[id].name.toLowerCase() : id)).join(', ')}</i>` : ''}
              </div>
              <div class="ki-pass-paper">
                <div class="ki-pass-title">ПРОПУСК</div>
                <p>Имя: <b>${esc(v.name)}</b></p><p>Цель: <b>${esc(v.purpose)}</b></p><p>Откуда: <b>${esc(v.from)}</b></p><p>Дата: <b>день ${v.date}</b></p>
                <canvas width="60" height="60" data-seal></canvas><span class="ki-pass-sealname">печать ${Gd.SEALS[v.seal]}</span>
              </div>
              <div class="ki-pass-samples"><b>Настоящие печати</b><canvas width="70" height="210" data-samples></canvas><i>Сегодня день ${ui.state.day}. Дворцовая — дворцовым службам, городская — письмам и лекарю, купеческая — товару.</i></div>
            </div>
            <div class="ki-pass-said">${esc(said || '')}</div>
            <div class="ki-pass-foot"><button class="ki-btn" data-how="pass">Пустить</button><button class="ki-btn" data-how="turn">Развернуть</button><button class="ki-btn" data-how="hold">Задержать</button></div>
          </div>`;
        face(el.querySelector('[data-face]').getContext('2d'), q.kit);
        seal(el.querySelector('[data-seal]').getContext('2d'), 30, 30, v.seal, v.fake);
        const sg = el.querySelector('[data-samples]').getContext('2d');
        ['palace', 'town', 'merchant'].forEach((k, i) => seal(sg, 35, 35 + i * 70, k, false));
      };
      paint();
      el.addEventListener('click', e => {
        const a = e.target.closest('[data-q]'), h = e.target.closest('[data-how]');
        if (a && !a.disabled) { asked.add(a.dataset.q); paint(); return; }
        if (e.target.closest('[data-act="search"]')) { searched = true; paint(); return; }
        if (h) ui.passDecide(q, h.dataset.how);
      });
      return el;
    },

    book(ui) {
      const el = document.createElement('div');
      el.className = 'ki-book';
      const S = ui.state, Gd = K.Guard, G = Gd.state(S), sv = Gd.service(S), rank = Gd.rankOf(sv), o = G.order;
      const days = new Map();
      for (const b of G.book) { if (!days.has(b.day)) days.set(b.day, []); days.get(b.day).push(b); }
      const marks = Array.from({ length: Math.max(0, Math.round(sv)) }, () => '|').join('');
      el.innerHTML = `<div class="ki-book-spread">
          <div class="ki-book-left">
            <div class="ki-book-cap">Книга приказов</div>
            <div class="ki-book-order"><b>${o ? esc(o.name) : 'Приказа нет'}</b>${o ? `<p>${esc(o.text)}, до ${o.until}:00</p><p>${o.state === 'done' ? 'Выполнено' : o.state === 'failed' ? 'Не выполнено' : 'Выполняется'}</p>` : ''}</div>
            <div class="ki-book-rank"><span class="ki-book-badge r${Gd.RANKS.indexOf(rank)}"></span>${esc(rank.name)} · жалованье ${rank.pay} сер. в день</div>
            <div class="ki-book-service">Служба: <b>${sv}</b> <span class="ki-book-marks">${marks}</span></div>
            ${G.gramota ? '<div class="ki-book-note">Казённая грамота: половина протеза у Шарнира</div>' : ''}
            ${G.trophies ? `<div class="ki-book-note">После боя: ${G.trophies.rule === 'hand' ? '«Трофеи сдать» — в оружейную до вечера' : '«Трофеи ваши»'}</div>` : ''}
          </div>
          <div class="ki-book-right">
            <div class="ki-book-cap">Похвалы и взыскания</div>
            ${[...days].reverse().map(([d, list]) => `<div class="ki-book-day"><b>день ${d}</b>${list.map(b => `<p class="${b.d > 0 ? 'up' : b.d < 0 ? 'down' : ''}">${b.d > 0 ? '+' + b.d : b.d} · ${esc(b.why)}</p>`).join('')}</div>`).join('') || '<i>Записей нет</i>'}
          </div>
          <div class="ki-book-foot"><button class="ki-btn" data-act="close">Закрыть (J)</button></div>
        </div>`;
      el.addEventListener('click', e => { if (e.target.closest('[data-act="close"]')) ui.closePanel(true); });
      return el;
    },

    guardTalk(ui, q, first) {
      const el = document.createElement('div');
      el.className = 'ki-guardtalk';
      const S = ui.state, said = first || K.Guard.talked(S, q.role, []) || '«Служба.»';
      el.innerHTML = `<div class="ki-guardtalk-plate"><div class="ki-guardtalk-who">${esc(K.Body.nameOf(q))}</div><div class="ki-guardtalk-line">${esc(said)}</div><div class="ki-guardtalk-foot"><button class="ki-btn" data-act="close">Дальше (E)</button></div></div>`;
      el.addEventListener('click', e => { if (e.target.closest('[data-act="close"]')) ui.closePanel(true); });
      return el;
    },

    armory(ui, q) {
      const el = document.createElement('div');
      el.className = 'ki-armory';
      const S = ui.state, Gd = K.Guard, G = Gd.state(S);
      const paint = said => {
        const rank = Gd.rankOf(Gd.service(S)), T = G.trophies, issue = Gd.RANKS.indexOf(rank) >= 2;
        el.innerHTML = `<div class="ki-armory-wall">
            <div class="ki-armory-cap">Оружейная · ${esc(K.Body.nameOf(q))}, квартирмейстер</div>
            <div class="ki-armory-row"><span>Трофеи после боя</span><em>${T ? (T.rule === 'hand' ? (T.handed ? 'сданы' : 'велено сдать: ' + T.taken.length + ' вещ.') : 'ваши') : 'боя не было'}</em>${T && T.rule === 'hand' && !T.handed ? '<button class="ki-opt" data-act="hand">Сдать по описи</button>' : ''}</div>
            <div class="ki-armory-row"><span>Арбалет, 12 болтов и кольчуга десятника</span><em>${issue ? 'по званию' : 'с десятника'}</em>${issue && !G.issued ? '<button class="ki-opt" data-act="issue">Получить</button>' : ''}</div>
            <div class="ki-armory-said">${esc(said || '')}</div>
            <div class="ki-armory-foot"><button class="ki-btn" data-act="close">Уйти (E)</button></div>
          </div>`;
      };
      paint();
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'hand') { const n = Gd.handIn(S, S.player); paint(n === null ? 'Нечего сдавать' : `Сдано по описи: ${n}. Служба +1`); }
        else if (b.dataset.act === 'issue') { G.issued = true; const P = S.player; P.bag.push({ id: 'crossbow', n: 1 }, { id: 'bolt', n: 12 }); if (!P.kit.armor.includes('mail')) P.kit.armor = P.kit.armor.concat(['mail']); paint('Выдано: арбалет, болты, кольчуга'); }
        else if (b.dataset.act === 'close') ui.closePanel(true);
      });
      return el;
    },

    serviceEnd(ui, end) {
      const el = document.createElement('div');
      el.className = 'ki-chronicle ki-ending ki-ending-guard';
      el.innerHTML = `<div class="ki-chronicle-page">
          <div class="ki-chronicle-cap">Летопись дворцовой стражи</div>
          <div class="ki-ending-name">${esc(end.name)}</div>
          <div class="ki-chronicle-text">${esc(end.text)}</div>
          <div class="ki-ending-list"><b>Последняя перекличка</b>${end.names.map(n => `<span${end.carried.includes(n) ? ' class="carried"' : ''}>${esc(n)}</span>`).join('')}</div>
          <div class="ki-ending-list"><b>Кто кого выносил</b>${end.rescues.length ? end.rescues.map(r => `<span>${esc(r.by)} — ${esc(r.who)}, день ${r.day}</span>`).join('') : '<span>Никого не выносили</span>'}</div>
          ${end.fallen.length ? `<div class="ki-ending-list"><b>Павшие</b>${end.fallen.map(n => `<span>${esc(n)}</span>`).join('')}</div>` : ''}
          <div class="ki-chronicle-foot"><button class="ki-btn" data-act="close">Дальше</button></div>
        </div>`;
      el.addEventListener('click', e => { if (e.target.closest('[data-act="close"]')) ui.closePanel(true); });
      return el;
    },

    warTable(ui) {
      const el = document.createElement('div');
      el.className = 'ki-war';
      const S = ui.state, Vi = K.Villain, A = Vi.state(S), Wd = K.World, E = Wd.state(S), V = E.sides.villain, M = valley(ui, 'title'), k = M.k;
      const I = S.campaign && S.campaign.intro && S.campaign.intro.villain ? S.campaign.intro : null, first = I && I.step === 'table';
      const sel = ui.war || (ui.war = { squad: 'pen', kind: null, target: null, lead: false, tab: 'map', said: '' });
      const bar = (v, max, cls) => `<span class="ki-war-bar ${cls || ''}"><i style="width:${Math.round(Math.min(1, v / max) * 100)}%"></i></span>`;
      const READY = Wd.READY, parts = [['Брёвна: лестницы и таран', V.ladders * 20 + V.ram * 60, READY.logs[0], `лестниц ${V.ladders}, таран ${V.ram ? 'есть' : 'нет'}, брёвен ${V.stock.logs}`], ['Железо', V.stock.iron, READY.iron[0], `${V.stock.iron}`], ['Люди', V.men, READY.men[0], `${V.men} из 60`], ['Сведения о дворце', V.intel, READY.intel[0], `${V.intel} из 3`], ['Дух войска', V.morale, READY.morale[0], `${V.morale}`]];
      const groupAt = sq => { const g = sq.group && E.groups.find(x => x.id === sq.group); return g ? [g.at[0], g.at[2]] : [960 + Vi.SQUADS.findIndex(s => s.id === sq.id) * 9 - 13, 105]; };
      const paint = () => {
        const cv = el.querySelector('canvas[data-map]');
        if (!cv) return;
        const g = cv.getContext('2d');
        g.drawImage(M.canvas, 0, 0);
        g.fillStyle = 'rgba(18, 10, 6, 0.32)';
        g.fillRect(0, 0, cv.width, cv.height);
        g.textBaseline = 'middle';
        g.font = 'bold 11px Georgia, serif';
        const kinds = first ? [] : sel.kind ? Vi.ORDERS[sel.kind].targets : [];
        const marks = first ? [['tract', K.Places.FORT_PTS.tract]] : Object.entries(Vi.TARGETS).filter(([id]) => kinds.includes(id)).map(([id, T]) => [id, T.at]);
        for (const [id, at] of marks) {
          const x = at[0] / k, y = at[1] / k, on = sel.target === id || first;
          g.strokeStyle = on ? '#ffd060' : '#e0a040';
          g.lineWidth = on ? 3 : 1.6;
          g.beginPath(); g.arc(x, y, on ? 9 : 7, 0, Math.PI * 2); g.stroke();
          g.fillStyle = '#ffe8b0';
          g.fillText(Vi.TARGETS[id].name, x + 11, y);
        }
        for (const sq of A.squads) {
          const [x0, z0] = groupAt(sq), x = x0 / k, y = z0 / k, on = sel.squad === sq.id;
          g.fillStyle = sq.group ? '#c02818' : '#3a3a40';
          g.strokeStyle = on ? '#ffd060' : '#100806';
          g.lineWidth = on ? 2.4 : 1.2;
          g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 5, y + 5); g.lineTo(x - 5, y + 5); g.closePath(); g.fill(); g.stroke();
        }
        const fx = 960 / k, fy = 105 / k;
        g.strokeStyle = '#100806'; g.fillStyle = '#5a4a40';
        g.fillRect(fx - 5, fy - 5, 10, 10); g.strokeRect(fx - 5, fy - 5, 10, 10);
      };
      const reportLine = r => {
        const O = Vi.ORDERS[r.order] ? Vi.ORDERS[r.order].name : r.order, T = Vi.TARGETS[r.target] ? Vi.TARGETS[r.target].name : '', L = r.loot || {};
        const loot = [L.silver ? L.silver + ' сер.' : '', L.logs ? L.logs + ' брёвен' : '', L.bread ? L.bread + ' хлеба' : '', r.intel ? 'сведения +' + r.intel : '', r.recruits ? 'пришли ' + r.recruits : ''].filter(Boolean).join(', ');
        return `<p><b>день ${r.day}</b> ${esc(O)}${T ? ' · ' + esc(T) : ''}: вернулись ${r.back}${r.lost.length ? ', потеряны ' + esc(r.lost.join(', ')) : ''}${r.wounded.length ? ', ранены ' + esc(r.wounded.join(', ')) : ''}${loot ? '. Добыча: ' + esc(loot) : ''}</p>`;
      };
      const armyRows = () => A.people.filter(r => r.alive && !r.deserted && (r.army || r.role !== 'soldier')).map(r => {
        const w = r.wound && r.wound.life !== undefined && r.wound.life < 100 ? `ранен ${Math.round(r.wound.life)}` : '', pr = Object.values(Object.assign({}, r.look && r.look.pros || {}, r.pros || {})).length, need = Vi.stump(r);
        const key = !r.army;
        return `<tr${r.away ? ' class="away"' : ''}><td><b>${esc(r.name)}</b>${key ? ' <i>' + esc({ scribe: 'писарь', scout: 'разведчик', chief: 'вожак пехоты', spymaster: 'мастер шпионов', smith: 'кузнец', surgeon: 'костоправ' }[r.role] || '') + '</i>' : ''}${r.away ? ' <i>в походе</i>' : ''}${r.pit > (S.day || 1) ? ' <i>в яме</i>' : ''}</td><td>${w}${need ? (w ? ', ' : '') + 'культя' : ''}${pr ? (w || need ? ', ' : '') + 'железо ×' + pr : ''}</td><td>${key ? '' : bar(r.loyalty, 100, 'loy') + bar(r.fear, 100, 'fear')}</td><td>${key || r.away ? '' : `${w ? `<button class="ki-opt" data-heal="${r.i}">Лечить ${Vi.HEAL}</button>` : ''}${need ? `<button class="ki-opt" data-arm="${r.i}">Протез</button>` : ''}<button class="ki-opt" data-flog="${r.i}">Пороть</button><button class="ki-opt" data-pit="${r.i}">В яму</button>`}</td></tr>`;
      }).join('');
      const render = () => {
        const st = Vi.stats(S), sq = Vi.squadOf(S, sel.squad), ready = first ? [] : Vi.ready(S, sq);
        const next = (7 - (S.day || 1) % 7) % 7;
        const assault = E.assault && !E.assault.result;
        el.innerHTML = `<div class="ki-war-board">
            <div class="ki-war-cap">Военный стол · день ${S.day} · ${esc(S.player.name || 'Злой')}</div>
            <div class="ki-war-cols">
              <div class="ki-war-left">
                ${sel.tab === 'army' && !first ? `<div class="ki-war-army"><table>${armyRows()}</table></div>` : `<canvas width="${MAP_N}" height="${MAP_N}" data-map></canvas>`}
                ${first ? `<div class="ki-war-first"><p>Кривой ставит на карту шесть фигурок: торговый корован идёт по Царскому тракту к дворцу. Козья тропа выводит мимо заставы.</p><button class="ki-btn" data-act="sortie">Вести шестерых на корован</button></div>` : sel.tab === 'army' ? '' : `
                <div class="ki-war-squads">${A.squads.map(s => { const n = Vi.members(S, s).length, r = Vi.ready(S, s).length; return `<button class="ki-opt${sel.squad === s.id ? ' on' : ''}" data-squad="${s.id}">${esc(Vi.SQUADS.find(x => x.id === s.id).name)} · ${s.group ? 'в походе' : r + ' из ' + n}</button>`; }).join('')}</div>
                <div class="ki-war-orders">${Object.entries(Vi.ORDERS).map(([id, O]) => `<button class="ki-opt${sel.kind === id ? ' on' : ''}" data-kind="${id}"${sq.group ? ' disabled' : ''}>${O.name}</button>`).join('')}</div>
                <div class="ki-war-go"><label><input type="checkbox" data-lead${sel.lead ? ' checked' : ''}> идти с отрядом</label><button class="ki-btn" data-act="order"${sel.kind && sel.target && !sq.group ? '' : ' disabled'}>Отдать приказ</button><span>${sel.kind ? (sel.target ? esc(Vi.ORDERS[sel.kind].name + ': ' + Vi.TARGETS[sel.target].name + ', людей ' + ready.length) : 'Выберите цель на карте') : 'Выберите отряд и приказ'}</span></div>`}
              </div>
              <div class="ki-war-ledger">
                <div class="ki-war-sub">Готовность к штурму: <b>${V.readiness}%</b></div>
                ${parts.map(([n, v, max, txt]) => `<div class="ki-war-row"><span>${n}</span>${bar(v, max)}<em>${txt}</em></div>`).join('')}
                <div class="ki-war-sub">Войско</div>
                <div class="ki-war-row"><span>Верность</span>${bar(st.loyalty, 100, 'loy')}<em>${st.loyalty}%</em></div>
                <div class="ki-war-row"><span>Страх</span>${bar(st.fear, 100, 'fear')}<em>${st.fear}%</em></div>
                <div class="ki-war-row"><span>Казна</span><em>${V.stock.silver} сер., хлеба ${V.stock.bread}</em></div>
                <div class="ki-war-row"><span>Жалованье</span><em>${next ? "через " + next + " дн." : "сегодня"}, ${Vi.soldiers(S).length * Vi.PAY} сер.</em>${first ? '' : `<button class="ki-opt${A.pay.held ? ' on' : ''}" data-act="hold">${A.pay.held ? 'Задержано' : 'Задержать'}</button>`}</div>
                ${A.share ? `<div class="ki-war-share">Доля добычи: ${A.share.silver} сер.<button class="ki-opt" data-share="1">Раздать</button><button class="ki-opt" data-share="0">В казну</button></div>` : ''}
                ${first ? '' : `<div class="ki-war-sub">Молот</div>
                <div class="ki-war-build"><button class="ki-opt" data-build="ladder">Лестница: ${Vi.LADDER} брёвен</button><button class="ki-opt" data-build="ram"${V.ram ? ' disabled' : ''}>Таран: ${Vi.RAM_LOGS} брёвен, ${Vi.RAM_IRON} железа</button></div>
                <div class="ki-war-sub">Штурм дворца</div>
                <div class="ki-war-assault">${assault ? '<p>Войско на штурме.</p>' : `<button class="ki-btn" data-assault="forest">Лесной дорогой с тараном</button><button class="ki-btn" data-assault="goat">Налегке козьей тропой</button>`}</div>`}
              </div>
            </div>
            <div class="ki-war-reports">${sel.said ? `<p class="said">${esc(sel.said)}</p>` : ''}${A.reports.slice(-3).reverse().map(reportLine).join('') || '<p>Отчётов ещё нет.</p>'}</div>
            <div class="ki-war-foot">${first ? '' : `<button class="ki-btn" data-act="tab">${sel.tab === 'army' ? 'Карта' : 'Войско'}</button>`}<button class="ki-btn" data-act="close">Отойти от стола (J)</button></div>
          </div>`;
        paint();
      };
      render();
      el.addEventListener('click', e => {
        const b = e.target.closest('button, input, canvas');
        if (!b) return;
        const d = b.dataset;
        if (b.tagName === 'CANVAS') {
          const [x, z] = mapPoint(b, e, k), kinds = sel.kind ? Vi.ORDERS[sel.kind].targets : [];
          let best = null, bd = 16 * k;
          for (const id of kinds) { const T = Vi.TARGETS[id], dd = Math.hypot(T.at[0] - x, T.at[1] - z); if (dd < bd) { bd = dd; best = id; } }
          for (const s of A.squads) { const [sx, sz] = groupAt(s), dd = Math.hypot(sx - x, sz - z); if (dd < bd * 0.6) { sel.squad = s.id; best = null; } }
          if (best) sel.target = best;
          render();
          return;
        }
        if (d.lead !== undefined) { sel.lead = b.checked; return; }
        if (d.squad) { sel.squad = d.squad; sel.kind = null; sel.target = null; }
        else if (d.kind) { sel.kind = d.kind; const T = Vi.ORDERS[d.kind].targets; sel.target = T.length === 1 ? T[0] : null; }
        else if (d.heal) { const r = Vi.heal(S, +d.heal); sel.said = r.ok ? r.text : r.why; }
        else if (d.arm) { const r = Vi.forgeArm(S, +d.arm, []); sel.said = r.ok ? r.text : r.why; }
        else if (d.flog) { const r = Vi.punish(S, +d.flog, 'flog', []); sel.said = r.ok ? r.text : r.why; }
        else if (d.pit) { const r = Vi.punish(S, +d.pit, 'pit', []); sel.said = r.ok ? r.text : r.why; }
        else if (d.share !== undefined) { const n = Vi.share(S, d.share === '1', []); sel.said = n ? `Роздано людям ${n} серебра` : 'Добыча ушла в казну'; }
        else if (d.build) { const r = Vi.build(S, d.build); sel.said = r.ok ? r.text : r.why; }
        else if (d.assault) { const r = ui.villainAssault(d.assault); if (r && r.ok) return; sel.said = r ? r.why : ''; }
        else if (d.act === 'order') { const r = ui.warOrder(sel.squad, sel.kind, sel.target, sel.lead); if (r && r.ok && sel.lead) return; sel.said = r ? (r.ok ? r.text : r.why) : ''; if (r && r.ok) { sel.kind = null; sel.target = null; } }
        else if (d.act === 'hold') { Vi.holdPay(S); }
        else if (d.act === 'tab') sel.tab = sel.tab === 'army' ? 'map' : 'army';
        else if (d.act === 'sortie') { ui.villainSortie(); return; }
        else if (d.act === 'close') { ui.closePanel(true); return; }
        render();
      });
      return el;
    },

    villainTalk(ui, q, line, hvosh) {
      const el = document.createElement('div');
      el.className = 'ki-vtalk';
      el.innerHTML = `<div class="ki-vtalk-plate"><div class="ki-vtalk-who">${esc(K.Body.nameOf(q))}</div><div class="ki-vtalk-line">${esc(line || '«…»')}</div><div class="ki-vtalk-foot">${hvosh ? `<button class="ki-btn" data-hv="1">Дать железную руку (${K.Villain.IRON_ARM} железа)</button><button class="ki-btn" data-hv="0">Отказать</button>` : '<button class="ki-btn" data-act="close">Дальше (E)</button>'}</div></div>`;
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-hv], [data-act]');
        if (!b) return;
        if (b.dataset.hv !== undefined) { const said = ui.hvoshDecide(b.dataset.hv === '1'); el.querySelector('.ki-vtalk-line').textContent = said || ''; el.querySelector('.ki-vtalk-foot').innerHTML = '<button class="ki-btn" data-act="close">Дальше (E)</button>'; return; }
        ui.closePanel(true);
      });
      return el;
    },

    villainEnd(ui, end) {
      const el = document.createElement('div');
      el.className = 'ki-chronicle ki-ending ki-ending-villain';
      el.innerHTML = `<div class="ki-chronicle-page">
          <div class="ki-chronicle-cap">Летопись Гуся</div>
          <div class="ki-ending-name">${esc(end.name)}</div>
          <div class="ki-chronicle-text">${esc(end.text)}</div>
          <div class="ki-chronicle-text">День ${end.day}. Верность войска ${end.loyalty}%, страх ${end.fear}%.</div>
          ${end.names.length ? `<div class="ki-ending-list"><b>Шли рядом</b>${end.names.map(n => `<span>${esc(n)}</span>`).join('')}</div>` : ''}
          ${end.fallen.length ? `<div class="ki-ending-list"><b>Павшие</b>${end.fallen.map(n => `<span>${esc(n)}</span>`).join('')}</div>` : ''}
          ${end.deserted.length ? `<div class="ki-ending-list"><b>Ушли ночью</b>${end.deserted.map(n => `<span>${esc(n)}</span>`).join('')}</div>` : ''}
          <div class="ki-chronicle-foot"><button class="ki-btn" data-act="close">Дальше</button></div>
        </div>`;
      el.addEventListener('click', e => { if (e.target.closest('[data-act="close"]')) ui.closePanel(true); });
      return el;
    },

    ending(ui, end) {
      if (end.villain) return K.Screens.villainEnd(ui, end);
      if (end.names) return K.Screens.serviceEnd(ui, end);
      const el = document.createElement('div');
      el.className = 'ki-chronicle ki-ending';
      el.innerHTML = `<div class="ki-chronicle-page">
          <div class="ki-chronicle-cap">Летопись Корней</div>
          <div class="ki-ending-name">${esc(end.name)}</div>
          <div class="ki-chronicle-text">${esc(end.text)}</div>
          <div class="ki-chronicle-text">День ${end.day}. Цело домов: ${end.intact}. Живы: ${end.people}.</div>
          <div class="ki-ending-list"><b>Кто кого выносил</b>${end.rescues.length ? end.rescues.map(r => `<span>${esc(r.by)} — ${esc(r.who)}, день ${r.day}</span>`).join('') : '<span>Никого не выносили</span>'}</div>
          <div class="ki-ending-list"><b>Имена на дубе</b>${end.oak.length ? end.oak.map(n => `<span>${esc(n)}</span>`).join('') : '<span>Никто не погиб</span>'}</div>
          <div class="ki-chronicle-note">Мир живёт дальше: стороны отстраиваются.</div>
          <div class="ki-chronicle-foot"><button class="ki-btn" data-act="close">Дальше</button></div>
        </div>`;
      el.addEventListener('click', e => { if (e.target.closest('[data-act="close"]')) ui.closePanel(true); });
      return el;
    },

    fit(ui, keeper, first) {
      const el = document.createElement('div');
      el.className = 'ki-fit';
      const E = K.Econ, S = ui.state, P = S.player;
      const paint = said => {
        const losses = E.losses(P.kit), cur = losses.find(l => l.place === ui.fitting.place) || losses[0];
        if (cur) ui.fitting.place = cur.place;
        const tabs = losses.map(l => `<button class="ki-opt${cur && l.place === cur.place ? ' on' : ''}" data-place="${l.place}">${E.PLACE_NAME[l.place]}</button>`).join('');
        const shop = ui.fitting.shop || 'sharnir', opts = cur ? E.fitOptions(S, P, cur.place, shop).filter(o => shop === 'sharnir' || E.SHOPS[shop].sells.includes(o.id) || o.how === 'own') : [];
        const how = { own: 'свой, поставить за четверть цены', side: 'от своих даром', buy: shop === 'sharnir' ? 'купить у Шарнира' : 'купить у мастера' };
        const rows = opts.map(o => `<div class="ki-fit-card${o.how ? '' : ' off'}">
            <div class="ki-fit-name">${esc(o.name)}<em>${o.how ? esc(how[o.how]) : ''}</em></div>
            <div class="ki-fit-gives">Даёт: ${esc(o.gives)}</div>
            <div class="ki-fit-lacks">Нет: ${esc(o.lacks)}</div>
            <div class="ki-fit-buy"><span>${o.how ? o.price + ' сер. · ' + (o.hours ? o.hours + ' ч' : 'сразу') : esc(o.why)}</span>${o.can ? `<button class="ki-opt" data-fit="${o.id}" data-how="${o.how}">Ставить</button>` : ''}</div>
          </div>`).join('');
        const worn = cur && cur.worn && Object.entries(E.PROS).find(([, d]) => d.kind === cur.worn && d.part === cur.kind);
        const state = !cur ? 'Протез ставить некуда: всё на месте.' : cur.why ? 'Сейчас нельзя: ' + esc(cur.why) + '.' : worn ? 'Сейчас: ' + esc(K.Data.ITEMS[worn[0]].name.toLowerCase()) : '';
        el.innerHTML = `<div class="ki-fit-panel">
          <div class="ki-fit-head">${esc(K.Body.nameOf(keeper))}. Примерка</div>
          <div class="ki-fit-tabs">${tabs}</div>
          <div class="ki-fit-state">${said ? esc(said) : state}</div>
          <div class="ki-fit-list">${rows}</div>
          <div class="ki-fit-foot"><span class="ki-purse">Кошель: <b>${E.purse(P.bag)}</b> сер.</span><button class="ki-btn" data-act="close">Уйти (E)</button></div>
        </div>`;
      };
      paint(first);
      el.addEventListener('click', e => {
        const t = e.target.closest('[data-place]');
        if (t) { ui.fitting.place = t.dataset.place; paint(); return; }
        const f = e.target.closest('[data-fit]');
        if (f) { paint(ui.fitPros(f.dataset.fit, f.dataset.how)); return; }
        if (e.target.closest('[data-act="close"]')) ui.closePanel(true);
      });
      return el;
    },

    inn(ui, keeper) {
      const el = document.createElement('div');
      el.className = 'ki-ledger';
      const E = K.Econ, S = ui.state, P = S.player;
      const paint = said => {
        const st = E.state(S), now = S.day + S.hour / 24, room = st.rent && st.rent.until > now, mercs = E.mercs(S);
        el.innerHTML = `<div class="ki-ledger-page">
          <div class="ki-ledger-title">Постоялый двор «Колесо»</div>
          <div class="ki-ledger-who">${esc(K.Body.nameOf(keeper))}, хозяин</div>
          <div class="ki-ledger-row"><span>Комната на ночь: кровать и сон до утра</span><em>${E.ROOM} сер.</em>${room ? '<i>снята до полудня</i>' : '<button class="ki-opt" data-inn="room">Снять</button>'}</div>
          <div class="ki-ledger-row"><span>Наёмник: идёт за вами, в городе не дерётся</span><em>${E.hirePrice(S)} сер. и ${E.MERC.day} в день</em><button class="ki-opt" data-inn="merc"${mercs.length >= E.MERC.most ? ' disabled' : ''}>Нанять</button></div>
          ${mercs.length ? `<div class="ki-ledger-list">Нанято: ${mercs.map(m => esc(K.Body.nameOf(m))).join(', ')}</div>` : ''}
          <div class="ki-ledger-row"><span>Сведения: казённый корован, чужие среди гостей</span><em>25 сер.</em><button class="ki-opt" data-inn="info">Спросить</button></div>
          <div class="ki-ledger-said">${esc(said || '«Ночлег, еда, люди с мечом. Что надо?»')}</div>
          <div class="ki-ledger-foot"><span class="ki-purse">Кошель: <b>${E.purse(P.bag)}</b> сер.</span><button class="ki-btn" data-act="close">Уйти (E)</button></div>
        </div>`;
      };
      paint();
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-inn]');
        if (b && !b.disabled) { paint(b.dataset.inn === 'room' ? ui.rentRoom() : b.dataset.inn === 'info' ? ui.buyInfo() : ui.hireMerc()); return; }
        if (e.target.closest('[data-act="close"]')) ui.closePanel(true);
      });
      return el;
    },

    chest(ui, id) {
      const el = document.createElement('div');
      el.className = 'ki-chest';
      const E = K.Econ, S = ui.state, P = S.player;
      const paint = () => {
        const box = E.chestOf(S, id), list = (items, dir) => items.length ? items.map(s => `<div class="ki-chest-row"><span>${esc(K.Data.ITEMS[s.id].name)}${s.n > 1 ? ' ×' + s.n : ''}</span><button class="ki-opt" data-move="${dir}" data-id="${s.id}">${dir === 'in' ? 'В сундук' : 'В суму'}</button></div>`).join('') : '<div class="ki-chest-empty">пусто</div>';
        el.innerHTML = `<div class="ki-chest-plate">
          <div class="ki-chest-col"><div class="ki-chest-cap">Сума</div>${list(P.bag, 'in')}</div>
          <div class="ki-chest-col"><div class="ki-chest-cap">Сундук</div>${list(box, 'out')}</div>
          <div class="ki-chest-foot"><button class="ki-btn" data-act="close">Закрыть (E)</button></div>
        </div>`;
      };
      paint();
      el.addEventListener('click', e => {
        const m = e.target.closest('[data-move]');
        if (m) { const box = E.chestOf(S, id); if (m.dataset.move === 'in') E.move(P.bag, box, m.dataset.id); else E.move(box, P.bag, m.dataset.id); paint(); return; }
        if (e.target.closest('[data-act="close"]')) ui.closePanel(true);
      });
      return el;
    },

    deed(ui, B) {
      const el = document.createElement('div');
      el.className = 'ki-deed';
      const E = K.Econ, S = ui.state, P = S.player;
      const paint = said => {
        const own = E.state(S).homes.includes(B.id);
        el.innerHTML = `<div class="ki-deed-paper">
          <div class="ki-deed-title">Купчая</div>
          <div class="ki-deed-text">${esc(B.name)} в Мостовице: кровать, сундук, безопасный сон. Город продаёт дом за ${B.price} сер.</div>
          <div class="ki-deed-said">${esc(said || (own ? 'Дом ваш.' : 'В кошеле ' + E.purse(P.bag) + ' сер.'))}</div>
          <div class="ki-deed-foot">${own ? '' : `<button class="ki-btn" data-act="buy"${E.purse(P.bag) < B.price ? ' disabled' : ''}>Купить</button>`}<button class="ki-btn" data-act="close">${own ? 'Закрыть' : 'Отказаться'} (E)</button></div>
        </div>`;
      };
      paint();
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b || b.disabled) return;
        if (b.dataset.act === 'buy') paint(ui.buyHome(B.id));
        else ui.closePanel(true);
      });
      return el;
    },

    wait(ui) {
      const el = document.createElement('div');
      el.className = 'ki-wait';
      const h = Math.floor(ui.state.hour), m = Math.floor((ui.state.hour - h) * 60);
      el.innerHTML = `<div class="ki-wait-plate">
        <div class="ki-wait-cap">Ждать под открытым небом</div>
        <div class="ki-wait-now">Сейчас ${h}:${String(m).padStart(2, '0')}, день ${ui.state.day}</div>
        <div class="ki-wait-set">${[1, 2, 3, 4].map(n => `<button class="ki-opt" data-wait="${n}">${n} ч</button>`).join('')}</div>
        <div class="ki-wait-note">Нельзя, если рядом враги. В кровати можно спать до утра.</div>
        <div class="ki-wait-foot"><button class="ki-btn" data-act="close">Отмена (T)</button></div>
      </div>`;
      el.addEventListener('click', e => {
        const w = e.target.closest('[data-wait]');
        if (w) { ui.waitHours(Number(w.dataset.wait)); return; }
        if (e.target.closest('[data-act="close"]')) ui.closePanel(true);
      });
      return el;
    },

    cart(ui, c, i) {
      const el = document.createElement('div');
      el.className = 'ki-manifest';
      const Cv = K.Caravan, S = ui.state, P = S.player;
      const paint = said => {
        const cart = c.carts[i], groups = new Map();
        for (const g of cart.bales) groups.set(g, (groups.get(g) || 0) + 1);
        const load = Cv.cargoKg(P.bag), friends = S.people.some(q => q.squad === 'player' && q.fight && !q.fight.down && Math.hypot(q.mv.pos[0] - P.mv.pos[0], q.mv.pos[2] - P.mv.pos[2]) < 25);
        const rows = [...groups].map(([g, n]) => { const d = Cv.GOODS[g]; return `<tr><td>${esc(K.Data.ITEMS[d.item].name)}</td><td>${n}</td><td>${d.kg} кг</td><td><button class="ki-opt" data-take="${g}"${load + d.kg > Cv.CARRY ? ' disabled' : ''}>Взять</button></td></tr>`; }).join('');
        const extra = (cart.silver ? `<tr><td>Казённое серебро</td><td>${cart.silver}</td><td>сер.</td><td><button class="ki-opt" data-take="silver">Забрать</button></td></tr>` : '') + (cart.bells ? '<tr><td>Бубенцы с упряжи</td><td>1</td><td></td><td><button class="ki-opt" data-take="bells">Снять</button></td></tr>' : '');
        el.innerHTML = `<div class="ki-manifest-sheet">
          <div class="ki-manifest-title">${esc(K.Caravan.KINDS[c.kind].name)}, телега ${i + 1} из ${c.carts.length}</div>
          <div class="ki-manifest-state">${esc(c.state === 'stopped' ? 'стоит: ' + ({ ox: 'вол убит', driver: 'возниц нет', crew: 'людей нет', guards: 'охраны нет' }[c.why] || 'остановлен') : c.state === 'led' ? 'вы ведёте упряжь' : c.state === 'blocked' ? 'дорогу перегородило дерево' : 'идёт')}</div>
          <table class="ki-manifest-list"><tr><th>Груз</th><th>Шт.</th><th>Вес</th><th></th></tr>${rows || '<tr><td colspan="4" class="ki-manifest-empty">Телега пуста</td></tr>'}${extra}</table>
          <div class="ki-manifest-said">${esc(said || '')}</div>
          <div class="ki-manifest-foot"><span>Ноша: <b>${load}</b> из ${Cv.CARRY} кг</span>${friends && cart.bales.length ? '<button class="ki-btn" data-act="friends">Своим нести</button>' : ''}<button class="ki-btn" data-act="close">Закрыть (E)</button></div>
        </div>`;
      };
      paint();
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-take]');
        if (b && !b.disabled) { paint(ui.cartTake(c, i, b.dataset.take)); return; }
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'friends') paint(ui.cartFriends(c, i));
        else ui.closePanel(true);
      });
      return el;
    },

    reports(ui) {
      const el = document.createElement('div');
      el.className = 'ki-yard';
      const S = ui.state, W = K.World, E = W.state(S), side = S.player.team, s = E.sides, V = s.villain;
      const list = W.reportsFor(S, side, 18).reverse();
      const posts = Object.entries(E.posts).map(([id, p]) => `<span class="ki-post ki-post-${p.side}">${esc(W.POSTS[id].name)}</span>`).join(' ');
      el.innerHTML = `<div class="ki-yard-board">
        <div class="ki-yard-title">Донесения, день ${S.day}</div>
        <div class="ki-yard-line">Империя: ${s.guard.men} стражников. Эльфы: ${s.elf.fighters} бойцов, ${s.elf.people} жителей, домов ${s.elf.houses}. Злой: ${V.men} человек, готовность к штурму ${V.readiness} %.</div>
        <div class="ki-yard-line">Места: ${posts}</div>
        <div class="ki-reports">${list.map(r => `<div class="ki-report${r.level >= 3 ? ' hot' : ''}"><b>день ${r.day}, ${r.hour}:00</b> ${esc(r.text)}</div>`).join('') || '<div class="ki-report">Пока тихо</div>'}</div>
        <div class="ki-yard-foot"><button class="ki-btn" data-act="back">Назад</button></div>
      </div>`;
      el.addEventListener('click', e => { if (e.target.closest('[data-act="back"]')) ui.closeYard(); });
      return el;
    }
  };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
