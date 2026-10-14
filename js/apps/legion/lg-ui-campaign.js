(function (L) {
  'use strict';

  const h = L.h;
  const I = L.Icons;
  const NS = 'http://www.w3.org/2000/svg';
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
  const LATIUM_CITIES = [
    ['Рим', 432, 300, 1], ['Вейи', 352, 244], ['Цере', 214, 176], ['Фалерии', 410, 110], ['Тибур', 604, 270], ['Пренесте', 650, 336], ['Тускул', 530, 392],
    ['Ардея', 426, 424], ['Лавиний', 386, 398], ['Анций', 452, 492], ['Кориолы', 470, 468], ['Анагния', 790, 430], ['Сигния', 712, 420], ['Куры', 612, 176], ['Остия', 344, 356]
  ];
  const LATIUM_BOX = [0, 0, 1000, 720];
  const MEDAL_FILL = ['#b8763a', '#c9ccd2', '#e8bc3a'];

  const svg = (tag, attrs, kids) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs || {}) el.setAttribute(k, attrs[k]);
    for (const c of kids || []) el.appendChild(c);
    return el;
  };
  const text = (x, y, str, attrs) => {
    const t = svg('text', Object.assign({ x, y }, attrs || {}));
    t.textContent = str;
    return t;
  };
  const pathOf = (pts, closed) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + (closed ? ' Z' : '');

  class CampaignScreen {
    constructor(ui) {
      this.ui = ui;
      this.el = h('div', { class: 'lga-campaign' });
      this.box = null;
    }

    show(p) {
      const ui = this.ui;
      if (!ui.profile) { ui.go('menu'); return; }
      ui.audio.music('menu');
      const prof = ui.profile;
      if (p.level) this.selId = p.level.id;
      if (!this.selId || !L.levelById(this.selId)) this.selId = this.nextLevel().id;
      this.era = L.levelById(this.selId).era;
      this.box = null;
      this.el.innerHTML = '';
      this.el.appendChild(L.topbar(ui, 'Кампания', [ui.btn('Лагерь', () => ui.go('camp')), ui.btn('Меню', () => ui.go('menu'))]));
      this.stripEl = h('div', { class: 'lga-fasti' });
      this.mapHost = h('div', { class: 'lga-map-host' });
      this.mapEl = h('div', { class: 'lga-map lga-panel lga-parch' }, [this.stripEl, this.mapHost]);
      this.briefEl = h('div', { class: 'lga-brief lga-panel lga-parch' });
      this.el.append(this.mapEl, this.briefEl);
      this.drawStrip();
      this.drawMap();
      this.renderBrief();
      if (!prof.chronicle) prof.chronicle = { intro: [], outro: [] };
      setTimeout(() => this.chronicle(), 60);
    }

    nextLevel() {
      const prof = this.ui.profile;
      return L.LEVELS.find(l => L.levelUnlocked(prof, l) && this.medalOf(l.id) == null) || L.LEVELS[L.LEVELS.length - 1];
    }

    medalOf(id) {
      const pr = this.ui.profile.progress[id];
      return pr && pr.medal != null ? pr.medal : null;
    }

    eraLevels(era) {
      return L.LEVELS.filter(l => l.era === era);
    }

    eraState(era) {
      const list = this.eraLevels(era);
      const won = list.filter(l => this.medalOf(l.id) != null).length;
      const open = list.some(l => L.levelUnlocked(this.ui.profile, l));
      return { list, won, open, done: won === list.length, current: list.includes(this.nextLevel()) && won < list.length };
    }

    chronicle() {
      const prof = this.ui.profile;
      const c = prof.chronicle;
      for (let e = 0; e < L.ERAS.length; e++) {
        if (this.eraState(e).done && !c.outro.includes(e)) {
          c.outro.push(e);
          this.ui.save();
          this.showChronicle(e, 'outro', () => this.chronicle());
          return;
        }
      }
      const e = this.nextLevel().era;
      if (!c.intro.includes(e)) {
        c.intro.push(e);
        this.ui.save();
        this.showChronicle(e, 'intro');
      }
    }

    showChronicle(era, kind, then) {
      const info = L.ERA_INFO[era];
      const paras = kind === 'outro' ? info.outro : info.intro;
      const body = h('div', { class: 'lga-chron' }, [
        h('div', { class: 'num', text: ROMAN[era] }),
        h('div', { class: 'yrs', text: info.years }),
        ...paras.map(t => h('p', { text: t }))
      ]);
      const title = (kind === 'outro' ? 'Итоги эпохи: ' : '') + info.name;
      this.ui.modal({ title, body, width: 'min(94%, 600px)', buttons: [{ label: kind === 'outro' ? 'Далее' : 'В поход', cls: 'primary' }], onClose: then });
    }

    drawStrip() {
      const el = this.stripEl;
      el.innerHTML = '';
      L.ERAS.forEach((name, e) => {
        const st = this.eraState(e);
        const cls = 'lga-era' + (e === this.era ? ' sel' : '') + (st.done ? ' done' : '') + (st.current ? ' cur' : '') + (st.open ? '' : ' locked');
        const b = h('button', { class: cls, type: 'button', disabled: !st.open }, [h('b', { text: ROMAN[e] }), h('i', {}, st.list.map(l => h('span', { class: this.medalOf(l.id) == null ? '' : 'm' + this.medalOf(l.id) })))]);
        this.ui.tip(b, '<b>' + L.esc(name) + '</b><br>Побед: ' + st.won + ' из ' + st.list.length + (st.open ? '' : '<br>Эпоха откроется позже'));
        b.addEventListener('click', () => {
          if (!st.open || e === this.era) return;
          this.ui.audio.ui();
          this.era = e;
          const pick = st.list.find(l => L.levelUnlocked(this.ui.profile, l) && this.medalOf(l.id) == null) || st.list.find(l => L.levelUnlocked(this.ui.profile, l)) || st.list[0];
          this.selId = pick.id;
          this.drawStrip();
          this.drawMap();
          this.renderBrief();
        });
        el.appendChild(b);
      });
    }

    drawMap() {
      const view = L.ATLAS.views[this.era];
      const latium = view.sheet === 'latium';
      const target = this.fitBox(latium ? LATIUM_BOX : this.medBox(view.box));
      const sameSheet = this.box && this.sheet === (latium ? 'latium' : 'med');
      const from = sameSheet ? this.box : target;
      this.sheet = latium ? 'latium' : 'med';
      this.mapHost.innerHTML = '';
      this.drawSheet(target, latium);
      if (from !== target) this.tween(from, target);
    }

    fitBox(b) {
      const W = this.mapHost.clientWidth || 760, H = this.mapHost.clientHeight || 560;
      const ar = W / H;
      let [x, y, w, hh] = b;
      if (w / hh < ar) {
        const nw = hh * ar;
        x -= (nw - w) / 2;
        w = nw;
      } else {
        const nh = w / ar;
        y -= (nh - hh) / 2;
        hh = nh;
      }
      return [x, y, w, hh];
    }

    medBox(b) {
      const [x0, y1] = L.ATLAS.project(b[0], b[1]);
      const [x1, y0] = L.ATLAS.project(b[2], b[3]);
      return [x0, y0, x1 - x0, y1 - y0];
    }

    tween(from, to) {
      const t0 = performance.now();
      const root = this.root;
      const step = now => {
        if (this.root !== root) return;
        const k = L.clamp((now - t0) / 380, 0, 1);
        const e = k * k * (3 - 2 * k);
        const b = from.map((v, i) => v + (to[i] - v) * e);
        root.setAttribute('viewBox', b.join(' '));
        if (k < 1) requestAnimationFrame(step);
      };
      root.setAttribute('viewBox', from.join(' '));
      requestAnimationFrame(step);
    }

    drawSheet(box, latium) {
      const root = svg('svg', { viewBox: box.join(' '), preserveAspectRatio: 'xMidYMid meet' });
      this.root = root;
      this.box = box;
      const s = box[2] / 1000;
      const defs = svg('defs');
      defs.innerHTML = '<filter id="lgaPaper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.18  0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
        '<pattern id="lgaWave" width="26" height="14" patternUnits="userSpaceOnUse"><path d="M0 7 q6.5 -6 13 0 t13 0" fill="none" stroke="#5f6e74" stroke-width="0.9" opacity="0.45"/></pattern>' +
        '<pattern id="lgaWaveS" width="' + (26 * s).toFixed(2) + '" height="' + (14 * s).toFixed(2) + '" patternUnits="userSpaceOnUse"><path d="M0 ' + (7 * s).toFixed(2) + ' q' + (6.5 * s).toFixed(2) + ' ' + (-6 * s).toFixed(2) + ' ' + (13 * s).toFixed(2) + ' 0 t' + (13 * s).toFixed(2) + ' 0" fill="none" stroke="#5f6e74" stroke-width="' + (0.9 * s).toFixed(2) + '" opacity="0.45"/></pattern>' +
        '<radialGradient id="lgaGlow"><stop offset="0%" stop-color="#ff5a3a" stop-opacity="0.8"/><stop offset="100%" stop-color="#ff5a3a" stop-opacity="0"/></radialGradient>';
      root.appendChild(defs);
      if (latium) this.drawLatium(root);
      else this.drawMed(root, s);
      this.drawBattles(root, latium, s);
      const info = L.ERA_INFO[this.era];
      const W = latium ? 1000 : L.ATLAS.width, H = latium ? 720 : L.ATLAS.height;
      root.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#lgaPaper)', fill: '#e8d8ae', opacity: 0.9, 'pointer-events': 'none', style: 'mix-blend-mode:multiply' }));
      this.mapHost.appendChild(root);
      this.mapHost.appendChild(h('div', { class: 'lga-map-cap' }, [h('b', { text: ROMAN[this.era] + '. ' + info.name }), h('i', { text: info.years })]));
      const lore = h('button', { class: 'lga-btn small lga-map-lore', type: 'button' }, [h('span', { text: 'Летопись эпохи' })]);
      lore.addEventListener('click', () => { this.ui.audio.ui(); this.showChronicle(this.era, 'intro'); });
      this.mapHost.appendChild(lore);
    }

    drawLatium(root) {
      root.appendChild(svg('rect', { x: 0, y: 0, width: 1000, height: 720, fill: '#e8d8ae' }));
      const coast = 'M0 0 L78 0 C95 50 120 95 168 150 C200 186 232 214 262 246 C290 276 318 318 346 354 C372 386 398 412 424 440 C446 466 470 500 500 528 C540 566 580 598 612 604 C640 610 652 628 676 650 C712 684 750 700 800 720 L0 720 Z';
      root.appendChild(svg('path', { d: coast, fill: '#b9c3bd' }));
      root.appendChild(svg('path', { d: coast, fill: 'url(#lgaWave)' }));
      root.appendChild(svg('path', { d: coast.replace(/ L800 720 L0 720 Z$/, '').replace(/^M0 0 L78 0/, 'M78 0'), fill: 'none', stroke: '#6a5534', 'stroke-width': 2.4 }));
      const g = svg('g', { fill: 'none', stroke: '#5b7d8a', 'stroke-width': 3, 'stroke-linecap': 'round' });
      g.appendChild(svg('path', { d: 'M566 0 C540 60 506 110 492 160 C478 206 470 240 450 272 C438 292 426 312 404 326 C384 338 362 346 346 354' }));
      g.appendChild(svg('path', { d: 'M760 222 C700 238 650 250 610 262 C560 276 510 282 452 280', 'stroke-width': 2 }));
      g.appendChild(svg('path', { d: 'M840 380 C800 420 760 470 740 520 C720 560 690 600 676 648', 'stroke-width': 2 }));
      root.appendChild(g);
      root.appendChild(svg('ellipse', { cx: 300, cy: 150, rx: 34, ry: 24, fill: '#b9c3bd', stroke: '#5b7d8a', 'stroke-width': 1.5 }));
      root.appendChild(svg('ellipse', { cx: 516, cy: 414, rx: 10, ry: 8, fill: '#b9c3bd', stroke: '#5b7d8a', 'stroke-width': 1.2 }));
      const roads = svg('g', { fill: 'none', stroke: '#8a6a3a', 'stroke-width': 1.6, 'stroke-dasharray': '5 4', opacity: 0.8 });
      ['M432 300 C470 340 500 380 530 430 C560 480 600 540 640 600', 'M432 300 C500 320 560 340 620 360 C680 380 740 410 790 430', 'M432 300 C480 260 540 220 612 176', 'M432 300 C436 240 436 170 432 100 C430 60 440 30 450 0', 'M432 300 C380 270 320 240 260 214 C230 200 210 190 180 170', 'M432 300 C420 340 424 380 426 424 C430 450 440 470 452 492']
        .forEach(d => roads.appendChild(svg('path', { d })));
      root.appendChild(roads);
      const mnt = svg('g', { fill: 'none', stroke: '#6a5534', 'stroke-width': 1.3 });
      const peaks = [[700, 180], [735, 200], [770, 170], [805, 200], [840, 160], [880, 190], [920, 150], [720, 330], [760, 350], [800, 320], [840, 350], [880, 310], [930, 340], [860, 250], [900, 260], [950, 220], [620, 110], [660, 90], [700, 120], [540, 420], [560, 402], [580, 424], [850, 460], [890, 440], [930, 470], [940, 400], [980, 300], [820, 540], [870, 520], [930, 560]];
      for (const [x, y] of peaks) {
        mnt.appendChild(svg('path', { d: `M${x - 13} ${y + 8} L${x} ${y - 10} L${x + 13} ${y + 8}` }));
        mnt.appendChild(svg('path', { d: `M${x} ${y - 10} L${x + 5} ${y + 8}`, 'stroke-width': 0.8, opacity: 0.7 }));
      }
      root.appendChild(mnt);
      const labels = svg('g', { fill: '#4a3418', 'font-family': 'Georgia, serif', 'font-style': 'italic' });
      labels.appendChild(text(90, 520, 'MARE TYRRHENVM', { 'font-size': 26, 'letter-spacing': 6, fill: '#51646c', transform: 'rotate(-38 90 520)' }));
      labels.appendChild(text(560, 250, 'LATIVM', { 'font-size': 20, 'letter-spacing': 10, opacity: 0.55 }));
      labels.appendChild(text(190, 160, 'ETRVRIA', { 'font-size': 18, 'letter-spacing': 8, opacity: 0.55 }));
      labels.appendChild(text(700, 60, 'SABINI', { 'font-size': 16, 'letter-spacing': 6, opacity: 0.55 }));
      labels.appendChild(text(820, 250, 'AEQVI', { 'font-size': 16, 'letter-spacing': 6, opacity: 0.55 }));
      labels.appendChild(text(820, 520, 'HERNICI', { 'font-size': 15, 'letter-spacing': 5, opacity: 0.55 }));
      labels.appendChild(text(560, 620, 'VOLSCI', { 'font-size': 15, 'letter-spacing': 5, opacity: 0.55 }));
      labels.appendChild(text(455, 22, '↑ к Клузию', { 'font-size': 13, opacity: 0.8 }));
      root.appendChild(labels);
      const cities = svg('g', { 'font-family': 'Georgia, serif' });
      for (const [n, x, y, big] of LATIUM_CITIES) {
        cities.appendChild(svg('rect', { x: x - (big ? 6 : 4), y: y - (big ? 6 : 4), width: big ? 12 : 8, height: big ? 12 : 8, fill: '#5a3a1a', stroke: '#e8d8ae', 'stroke-width': 1 }));
        cities.appendChild(text(x + (big ? 10 : 8), y + 4, n, { 'font-size': big ? 19 : 12, fill: '#3b2712', 'font-weight': big ? 'bold' : 'normal' }));
      }
      root.appendChild(cities);
      this.compass(root, 930, 640, 1);
    }

    drawMed(root, s) {
      const A = L.ATLAS;
      const P = pts => pts.map(p => A.project(p[0], p[1]));
      root.appendChild(svg('rect', { x: 0, y: 0, width: A.width, height: A.height, fill: '#b9c3bd' }));
      root.appendChild(svg('rect', { x: 0, y: 0, width: A.width, height: A.height, fill: 'url(#lgaWaveS)' }));
      const land = svg('g', { fill: '#e8d8ae', stroke: '#6a5534', 'stroke-width': (1.6 * s).toFixed(2), 'stroke-linejoin': 'round' });
      for (const poly of A.lands) land.appendChild(svg('path', { d: pathOf(P(poly), true) }));
      root.appendChild(land);
      const rivers = svg('g', { fill: 'none', stroke: '#5b7d8a', 'stroke-width': (1.8 * s).toFixed(2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      for (const r of A.rivers) rivers.appendChild(svg('path', { d: pathOf(P(r), false) }));
      root.appendChild(rivers);
      const labels = svg('g', { fill: '#4a3418', 'font-family': 'Georgia, serif', 'font-style': 'italic', opacity: 0.6 });
      for (const [t, lon, lat, size, rot] of A.regions) {
        const [x, y] = A.project(lon, lat);
        const sea = /^(MARE|OCEANVS|PONTVS EVXINVS)/.test(t);
        labels.appendChild(text(x, y, t, { 'font-size': (size * s * 0.9).toFixed(2), 'letter-spacing': (size * s * 0.3).toFixed(2), 'text-anchor': 'middle', fill: sea ? '#51646c' : '#4a3418', transform: rot ? `rotate(${rot} ${x} ${y})` : '' }));
      }
      root.appendChild(labels);
      const cities = svg('g', { 'font-family': 'Georgia, serif' });
      const marks = this.eraLevels(this.era).map(l => A.project(...A.battles[l.id]));
      for (const [n, lon, lat, big] of A.cities) {
        const [x, y] = A.project(lon, lat);
        if (!big && marks.some(m => Math.abs(m[0] - x) < 70 * s && Math.abs(m[1] - y) < 40 * s)) continue;
        const r = (big ? 5 : 3.5) * s;
        cities.appendChild(svg('rect', { x: x - r, y: y - r, width: 2 * r, height: 2 * r, fill: '#5a3a1a', stroke: '#e8d8ae', 'stroke-width': (0.8 * s).toFixed(2) }));
        cities.appendChild(text(x + r + 3 * s, y + 4 * s, n, { 'font-size': ((big ? 15 : 11.5) * s).toFixed(2), fill: '#3b2712', 'font-weight': big ? 'bold' : 'normal', stroke: '#e8d8ae', 'stroke-width': (2.5 * s).toFixed(2), 'paint-order': 'stroke' }));
      }
      root.appendChild(cities);
      this.compass(root, this.box[0] + this.box[2] - 70 * s, this.box[1] + this.box[3] - 80 * s, s);
    }

    compass(root, x, y, s) {
      const c = svg('g', { transform: `translate(${x} ${y}) scale(${s})`, stroke: '#5a3a1a', fill: '#5a3a1a', 'pointer-events': 'none' });
      c.appendChild(svg('circle', { r: 30, fill: 'none', 'stroke-width': 1.2 }));
      c.appendChild(svg('path', { d: 'M0 -34 L6 0 L0 34 L-6 0 Z', 'stroke-width': 0.5 }));
      c.appendChild(svg('path', { d: 'M-34 0 L0 5 L34 0 L0 -5 Z', fill: '#e8d8ae', 'stroke-width': 0.8 }));
      c.appendChild(text(-5, -40, 'N', { 'font-size': 14, 'font-family': 'Georgia, serif', stroke: 'none' }));
      root.appendChild(c);
    }

    layout(items, s, box) {
      const minX = 118 * s, minY = 50 * s;
      for (let it = 0; it < 60; it++) {
        let moved = false;
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i], b = items[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            if (Math.abs(dx) >= minX || Math.abs(dy) >= minY) continue;
            moved = true;
            const px = minX - Math.abs(dx), py = minY - Math.abs(dy);
            if (py < px) {
              const d = (dy >= 0 ? 1 : -1) * py / 2 + (dy === 0 ? (j % 2 ? 0.5 : -0.5) * s : 0);
              a.y -= d;
              b.y += d;
            } else {
              const d = (dx >= 0 ? 1 : -1) * px / 2 + (dx === 0 ? 0.5 * s : 0);
              a.x -= d;
              b.x += d;
            }
          }
        }
        for (const o of items) {
          o.x = L.clamp(o.x, box[0] + 60 * s, box[0] + box[2] - 60 * s);
          o.y = L.clamp(o.y, box[1] + 70 * s, box[1] + box[3] - 40 * s);
        }
        if (!moved) break;
      }
    }

    drawBattles(root, latium, s) {
      const prof = this.ui.profile;
      const list = latium ? L.LEVELS.filter(l => L.ATLAS.latium[l.id]) : this.eraLevels(this.era);
      const items = list.map(lv => {
        const p = latium ? L.ATLAS.latium[lv.id] : L.ATLAS.project(...L.ATLAS.battles[lv.id]);
        return { lv, ox: p[0], oy: p[1], x: p[0], y: p[1] };
      });
      if (!latium) this.layout(items, s, this.box);
      const route = svg('g', { fill: 'none', stroke: '#9a2a18', 'stroke-width': (2.2 * s).toFixed(2), 'stroke-dasharray': `${2 * s} ${6 * s}`, 'stroke-linecap': 'round', opacity: 0.75 });
      let d = '';
      items.forEach(it => {
        if (it.lv.era !== this.era || !L.levelUnlocked(prof, it.lv)) return;
        d += (d ? ' L' : 'M') + it.x.toFixed(1) + ' ' + it.y.toFixed(1);
      });
      if (d) route.appendChild(svg('path', { d }));
      root.appendChild(route);
      for (const it of items) {
        const { lv } = it;
        const unlocked = L.levelUnlocked(prof, lv);
        const medal = this.medalOf(lv.id);
        const sel = lv.id === this.selId;
        const inEra = lv.era === this.era;
        if (Math.hypot(it.x - it.ox, it.y - it.oy) > 6 * s) {
          root.appendChild(svg('line', { x1: it.ox, y1: it.oy, x2: it.x, y2: it.y, stroke: '#5a3a1a', 'stroke-width': (1 * s).toFixed(2), 'stroke-dasharray': `${2 * s} ${2 * s}` }));
          root.appendChild(svg('circle', { cx: it.ox, cy: it.oy, r: 2.6 * s, fill: '#5a3a1a' }));
        }
        const g = svg('g', { transform: `translate(${it.x} ${it.y}) scale(${s})`, style: 'cursor:' + (unlocked ? 'pointer' : 'default'), opacity: inEra ? 1 : 0.45 });
        if (unlocked && medal == null) g.appendChild(svg('circle', { r: 28, fill: 'url(#lgaGlow)' }));
        if (sel) g.appendChild(svg('circle', { r: 24, fill: 'none', stroke: '#9a2a18', 'stroke-width': 3, 'stroke-dasharray': '4 3' }));
        const fill = !unlocked ? '#8f846c' : medal == null ? '#a8261e' : MEDAL_FILL[medal];
        g.appendChild(svg('circle', { r: 16, fill, stroke: '#3b2712', 'stroke-width': 2.5 }));
        g.appendChild(text(0, 5.5, String(lv.ord), { 'text-anchor': 'middle', 'font-size': 15, 'font-family': 'Georgia, serif', 'font-weight': 'bold', fill: unlocked && medal == null ? '#fff5e0' : '#2a1a08' }));
        g.appendChild(text(0, 34, lv.title, { 'text-anchor': 'middle', 'font-size': 12.5, 'font-family': 'Georgia, serif', fill: unlocked ? '#3b1d08' : '#7a6a4e', 'font-weight': sel ? 'bold' : 'normal', stroke: '#e8d8ae', 'stroke-width': 3, 'paint-order': 'stroke' }));
        g.addEventListener('click', () => {
          if (!unlocked) { this.ui.toast('Эта битва откроется после победы в предыдущей', 'bad'); return; }
          this.selId = lv.id;
          this.ui.audio.ui();
          if (lv.era !== this.era) {
            this.era = lv.era;
            this.drawStrip();
          }
          this.drawMap();
          this.renderBrief();
        });
        root.appendChild(g);
      }
    }

    renderBrief() {
      const ui = this.ui, prof = ui.profile;
      const lv = L.levelById(this.selId);
      const el = this.briefEl;
      el.innerHTML = '';
      const body = h('div', { class: 'lga-brief-body' });
      const inEra = this.eraLevels(lv.era).length;
      body.append(h('div', { class: 'era', text: ROMAN[lv.era] + '. ' + L.ERAS[lv.era] + ' · битва ' + lv.ord + ' из ' + inEra }), h('div', { class: 'ttl', text: lv.title }));
      for (const para of lv.briefing) body.appendChild(h('p', { text: para }));
      body.appendChild(h('div', { class: 'sec', text: 'Цели' }));
      for (const o of lv.objectives) body.appendChild(h('div', { class: 'lga-obj' }, [I.img(I.objective(o.type, '#6a3a12'), 18), h('span', { text: this.objText(o) })]));
      body.appendChild(h('div', { class: 'sec', text: 'Разведка' }));
      const counts = new Map();
      for (const e of lv.enemy) counts.set(e.key, (counts.get(e.key) || 0) + 1);
      for (const r of lv.reinforcements || []) for (const e of r.squads) counts.set(e.key, (counts.get(e.key) || 0) + 1);
      const en = h('div', { class: 'lga-enemy' });
      for (const [k, n] of counts) {
        const u = L.UNITS[k];
        const chip = h('span', {}, [h('i', { style: { backgroundImage: 'url(' + L.card(k) + ')' } }), h('b', { text: (n > 1 ? n + ' × ' : '') + u.name })]);
        const role = L.ROLES[u.type];
        ui.tip(chip, '<b>' + u.name + '</b> · ' + L.CLASSES[u.type].name + '<br>' + u.desc + (role ? '<hr><span class="lga-good">+</span> ' + role.good + '<br><span class="lga-bad">−</span> ' + role.bad : ''));
        en.appendChild(chip);
      }
      body.appendChild(en);
      if (lv.reinforcements && lv.reinforcements.length) body.appendChild(h('div', { style: { fontSize: '12px', color: '#7a2a12', marginBottom: '6px' }, text: 'Ожидаются подкрепления противника.' }));
      const med = this.medalOf(lv.id);
      const best = prof.progress[lv.id] ? prof.progress[lv.id].best : 0;
      body.appendChild(h('div', { class: 'sec', text: 'Награда' }));
      body.appendChild(h('div', { class: 'lga-reward' }, [h('span', {}, [I.img(I.glory(), 22), lv.reward.glory + ' славы']), h('span', {}, [I.img(I.denarii(), 22), lv.reward.denarii + ' динариев']), h('span', { style: { fontWeight: 'normal', fontSize: '12px', fontFamily: 'var(--ui)' }, text: 'Отрядов в бою: до ' + lv.cap })]));
      const m = lv.medals || [0, 0];
      body.appendChild(h('div', { class: 'lga-medals' }, [I.img(I.medal(0), 24), h('span', { text: 'Бронза за победу: награда ×1' }), I.img(I.medal(1), 24), h('span', { text: 'Серебро от ' + m[0] + ' очков: награда ×1.25' }), I.img(I.medal(2), 24), h('span', { text: 'Золото от ' + m[1] + ' очков: награда ×1.5 и милость бога' })]));
      if (med != null) body.appendChild(h('div', { style: { fontSize: '12px', marginTop: '4px', fontWeight: 600 }, text: 'Лучший результат: ' + ['бронза', 'серебро', 'золото'][med] + ', счет ' + best + '. Повторная победа принесет меньше славы.' }));
      if ((lv.unlocks || []).length) body.appendChild(h('div', { style: { fontSize: '12px', marginTop: '4px' }, text: 'Победа откроет найм: ' + lv.unlocks.map(k => L.UNITS[k].name).join(', ') }));
      body.appendChild(h('img', { src: L.uiImg('maps/' + lv.map + '.jpg'), alt: '', style: { width: '120px', marginTop: '10px', border: '1px solid #8e7443', display: 'block' } }));
      const foot = h('div', { class: 'lga-brief-foot' });
      const unlocked = L.levelUnlocked(prof, lv);
      foot.append(ui.btn('Лагерь', () => ui.go('camp')), ui.btn('Спланировать битву', () => this.plan(lv), { cls: 'primary big', disabled: !unlocked }));
      el.append(body, foot);
    }

    objText(o) {
      switch (o.type) {
        case 'kill': return 'Убить ' + o.n + ' врагов';
        case 'survive': return 'Выжить ' + Math.round(o.sec / 60) + ' мин.';
        case 'killGeneral': return 'Вражеский генерал должен погибнуть';
        case 'keepGeneral': return 'Наш генерал должен остаться в живых';
        case 'losses': return 'Понести потери меньше, чем ' + o.n;
        case 'time': return 'Победить менее чем за ' + Math.round(o.sec / 60) + ' мин.';
        case 'rout': return 'Обратить армию противника в бегство';
        case 'destroy': return 'Уничтожить или прогнать черную стражу';
        default: return o.type;
      }
    }

    plan(lv) {
      const ui = this.ui;
      const p = ui.profile;
      if (!p.squads.some(s => s.men > 0 && !L.UNITS[s.key].leader)) { ui.toast('В армии нет боеспособных отрядов. Наберите войска в лагере.', 'bad'); return; }
      const hurt = p.squads.filter(s => s.men < L.Army.maxMen(s) * 0.5 && !L.UNITS[s.key].leader);
      if (hurt.length && p.glory >= 50) ui.toast('Некоторые отряды поредели. Их можно пополнить в лагере.');
      ui.go('field', { level: lv });
    }
  }

  L.Screens.campaign = CampaignScreen;
})(globalThis.Legion = globalThis.Legion || {});
