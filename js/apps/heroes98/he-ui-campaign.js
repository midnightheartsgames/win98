(function (H) {
  'use strict';
  const C = H.Campaign, A = H.Art;
  const DIFFS = ['easy', 'normal', 'hard', 'impossible'];
  const CREDIT_LINE = 30;
  const CREDIT_SPEED = 34;

  const paintRing = (c, lit) => {
    c.fillStyle = '#06112a';
    c.fillRect(0, 0, H.W, H.H);
    const rings = [[300, '#20301c'], [292, '#2e4426'], [176, '#123a5e'], [168, '#0e2f50'], [120, '#0b2644'], [58, '#081b34']];
    for (const [rad, color] of rings) {
      c.fillStyle = color;
      c.beginPath();
      c.ellipse(400, 300, rad, rad * 0.78, 0, 0, Math.PI * 2);
      c.fill();
    }
    C.RING.forEach(r => {
      if (r.id === 'tysyacha' || r.id === 'chasha' || r.id === 'podlunye') return;
      const pal = A.PALETTES[r.faction], a = Math.atan2((r.y - 300) / 0.78, r.x - 400);
      c.strokeStyle = lit(r) ? pal.body : pal.dark;
      c.globalAlpha = lit(r) ? 0.9 : 0.5;
      c.lineWidth = 86;
      c.beginPath();
      c.ellipse(400, 300, 234, 234 * 0.78, 0, a - 0.36, a + 0.36);
      c.stroke();
      c.globalAlpha = 1;
      c.lineWidth = 1;
    });
    c.fillStyle = '#d8dce8';
    c.beginPath();
    c.arc(400, 300, 5, 0, Math.PI * 2);
    c.fill();
  };

  class CampaignView {
    constructor(ui, title) {
      this.ui = ui;
      this.title = title;
      this.theme = 'camp_map';
      this.regions = [];
      this.hot = null;
      this.pick = null;
      this.difficulty = 'normal';
      this.tip = '';
      this.bg = null;
    }

    update() {}

    pointer(type, x, y, btn) {
      const r = this.regionAt(x, y);
      this.hot = r && !r.off ? r.id : null;
      this.tip = r && r.tip ? r.tip : '';
      this.ui.gfx.cursor(this.hot ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r && !r.off) {
        this.ui.sfx('click');
        r.act();
      }
    }

    key() {}

    back() {
      if (this.pick) this.pick = null;
      else this.ui.show(this.title);
      return true;
    }

    play(id, fresh) {
      const camp = C.get(id);
      if (fresh || !C.runOf(id)) {
        C.begin(id, C.runOf(id) ? C.runOf(id).difficulty : this.difficulty);
        this.ui.show(new SlidesView(this.ui, { pic: 'picture/campaign' + camp.number, faction: camp.faction || 'league', title: 'Кампания «' + camp.name + '»', slides: camp.opening, theme: camp.theme, then: () => this.ui.show(new BriefView(this.ui, this, id, 0)) }));
        return;
      }
      this.ui.show(new BriefView(this.ui, this, id, C.currentMission(id)));
    }

    draw(g) {
      const c = g.ctx;
      this.regions = [];
      const pic = A.image('picture/campaignmap');
      if (pic) c.drawImage(pic.img, 0, 0, H.W, H.H);
      else paintRing(c, r => C.finished(r.id));
      g.text('Венец и Чаша', H.W / 2, 28, { align: 'center', serif: true, size: 20 });
      for (const r of C.RING) {
        const st = C.stateOf(r), on = st.ready && st.open, w = 112, x = r.x - w / 2, y = r.y - 12;
        this.region('camp-' + r.id, x, y, w, 24, () => { this.pick = r.id; }, { tip: st.ready ? r.land : r.addon ? 'Выйдет с дополнением' : 'Появится позже' });
        g.button({ x, y, w, h: 24, label: r.name, hot: this.hot === 'camp-' + r.id, off: !on, down: this.pick === r.id });
        if (st.finished) g.text('+', x + w - 12, y + 15, { bold: true, color: '#a0e0a0' });
      }
      this.button(g, 'camp-back', 'Назад', 16, H.H - 44, 110, 28, () => this.ui.show(this.title));
      if (this.tip && !this.pick) g.text(this.tip, H.W / 2, H.H - 26, { align: 'center', color: '#c8b88a' });
      if (this.pick) this.drawCard(g, this.pick);
    }

    drawCard(g, id) {
      const c = g.ctx, r = C.RING.find(x => x.id === id), st = C.stateOf(r), camp = C.get(id), run = C.runOf(id), x = 150, y = 90, W = 500, Hh = 420;
      this.regions.length = 0;
      c.fillStyle = 'rgba(5,7,15,0.5)';
      c.fillRect(0, 0, H.W, H.H);
      this.region('card-bg', x, y, W, Hh, null, { off: true });
      g.panel(x, y, W, Hh);
      A.drawPortrait(g, { hid: r.hero, name: r.name, faction: r.faction }, x + 20, y + 20, 96);
      g.text('«' + r.name + '»', x + 130, y + 36, { serif: true, size: 18 });
      g.text(r.land, x + 130, y + 56, { size: 10, color: '#c8b88a' });
      if (!st.ready || !st.open) {
        g.text(r.addon ? 'Кампания выйдет с дополнением.' : st.ready ? 'Откроется после предыдущей кампании.' : 'Появится позже.', x + 130, y + 84, { color: '#a89870' });
        this.button(g, 'card-close', 'Закрыть', x + W - 130, y + Hh - 44, 110, 28, () => { this.pick = null; });
        return;
      }
      H.Font.wrap('small', camp.about, W - 150).slice(0, 4).forEach((s, i) => g.text(s, x + 130, y + 76 + i * 14, { size: 10 }));
      camp.missions.forEach((m, i) => {
        const done = !!run && run.done.includes(i), now = !!run && !run.finished && C.currentMission(id) === i;
        g.text((done ? '+ ' : (i + 1) + '. ') + m.name, x + 24, y + 150 + i * 20, { color: done ? '#a0e0a0' : now ? '#ffe060' : '#f0e2b8', bold: now });
      });
      const chosen = run ? run.difficulty : this.difficulty;
      g.text('Сложность на всю кампанию', x + 24, y + 272, { size: 10, color: '#c8b88a' });
      DIFFS.forEach((d, i) => {
        const bx = x + 24 + i * 114;
        this.region('card-' + d, bx, y + 282, 108, 24, () => { this.difficulty = d; }, { off: !!run });
        g.button({ x: bx, y: y + 282, w: 108, h: 24, label: H.DIFFICULTY[d].name, hot: this.hot === 'card-' + d, down: chosen === d, off: !!run && chosen !== d });
      });
      const label = !run ? 'Начать' : run.finished ? 'Пройти заново' : 'Продолжить';
      this.button(g, 'card-play', label, x + 24, y + Hh - 44, 150, 28, () => this.play(id, !run || run.finished));
      if (run && !run.finished) this.button(g, 'card-reset', 'Заново', x + 184, y + Hh - 44, 110, 28, () => this.play(id, true));
      this.button(g, 'card-close', 'Закрыть', x + W - 130, y + Hh - 44, 110, 28, () => { this.pick = null; });
    }
  }
  Object.assign(CampaignView.prototype, H.Regions);

  const paintThrone = (c, step) => {
    c.fillStyle = '#0e2440';
    c.fillRect(300, 300, H.W - 300, 140);
    c.fillStyle = 'rgba(232,228,200,0.22)';
    for (let i = 0; i < 6; i++) c.fillRect(560 - step * 40 + (i % 2) * 10, 312 + i * 18, 70 - i * 9, 3);
    c.fillStyle = '#070a14';
    c.beginPath();
    c.moveTo(0, 440);
    c.lineTo(0, 236);
    c.lineTo(250, 236);
    c.lineTo(330, 440);
    c.closePath();
    c.fill();
    c.fillStyle = '#c8ccd8';
    for (let i = 0; i < 5; i++) c.fillRect(24 + i * 44, 150, 12, 86);
    c.fillRect(16, 140, 200, 10);
    c.fillRect(110, 196, 26, 40);
    c.beginPath();
    c.arc(123, 196, 13, Math.PI, 0);
    c.fill();
    c.fillStyle = 'rgba(200,215,255,0.35)';
    c.beginPath();
    c.moveTo(123, 236);
    c.lineTo(250, 236);
    c.lineTo(620 - step * 90, 116 + step * 18);
    c.closePath();
    c.fill();
  };

  const paintSlide = (c, faction, step) => {
    const pal = A.PALETTES[faction] || A.PALETTES.neutral;
    const rows = 40;
    c.fillStyle = '#070a14';
    c.fillRect(0, 0, H.W, H.H);
    for (let i = 0; i < rows; i++) {
      c.fillStyle = i < rows * 0.6 ? '#0a1430' : pal.dark;
      c.fillRect(0, i * 11, H.W, 12);
    }
    c.fillStyle = '#e8e4c8';
    c.beginPath();
    c.arc(620 - step * 90, 90 + step * 18, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#070a14';
    c.fillRect(0, 300, H.W, 140);
    if (faction === 'throne') {
      paintThrone(c, step);
      return;
    }
    if (faction === 'forge') {
      c.beginPath();
      c.moveTo(420, 302);
      c.lineTo(560, 140);
      c.lineTo(620, 140);
      c.lineTo(780, 302);
      c.closePath();
      c.fill();
      c.fillStyle = '#ff6a1a';
      c.fillRect(564, 136, 52, 6);
      for (let i = 0; i < 3; i++) c.fillRect(574 + i * 14, 142 + i * 30, 4, 160 - i * 30);
      c.fillStyle = 'rgba(200,190,180,0.25)';
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(590 + i * 6 - step * 8, 120 - i * 22, 14 + i * 5, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#ff9a30';
      for (let x = 20; x < 400; x += 60) c.fillRect(x, 290, 26, 10);
      return;
    }
    if (faction === 'tide') {
      for (let i = 0; i < 7; i++) {
        c.fillStyle = i % 2 ? '#123a58' : '#0c2c46';
        c.fillRect(0, 302 + i * 20 + ((step + i) % 3) * 3, H.W, 20);
      }
      c.fillStyle = '#070a14';
      c.beginPath();
      c.moveTo(100, 306);
      c.lineTo(150, 262);
      c.lineTo(230, 306);
      c.closePath();
      c.fill();
      c.fillRect(166, 196, 18, 70);
      c.fillRect(160, 190, 30, 8);
      c.fillStyle = pal.body;
      c.fillRect(169, 200, 12, 10);
      c.fillStyle = 'rgba(232,228,200,0.18)';
      c.beginPath();
      c.moveTo(181, 205);
      c.lineTo(560, 160 + step * 20);
      c.lineTo(560, 240 + step * 20);
      c.closePath();
      c.fill();
      return;
    }
    if (faction === 'thicket') {
      for (let x = -10 + step * 14; x < H.W + 40; x += 34) {
        const tall = 70 + ((x * 13) % 120);
        c.beginPath();
        c.moveTo(x, 302);
        c.lineTo(x + 17, 302 - tall);
        c.lineTo(x + 34, 302);
        c.closePath();
        c.fill();
      }
      c.fillStyle = pal.body;
      for (let i = 0; i < 9; i++) c.fillRect(360 + i * 12, 288 - (i % 2) * 3, 3, 4);
      return;
    }
    if (faction === 'barrows') {
      for (let x = 40 + step * 30; x < H.W + 80; x += 170) {
        const wide = 70 + ((x * 3) % 50), high = 26 + ((x * 11) % 34);
        c.beginPath();
        c.ellipse(x, 302, wide, high, 0, Math.PI, 0);
        c.fill();
      }
      c.fillRect(398, 232, 14, 70);
      c.fillStyle = pal.body;
      c.fillRect(402, 244, 6, 6);
      return;
    }
    for (let x = 0; x < H.W; x += 46) {
      const h = 18 + ((x * 7 + step * 13) % 38);
      c.fillRect(x, 300 - h, 40, h);
    }
    c.fillRect(380, 150, 44, 160);
    c.beginPath();
    c.moveTo(372, 150);
    c.lineTo(402, 104);
    c.lineTo(432, 150);
    c.closePath();
    c.fill();
    c.fillStyle = pal.body;
    c.beginPath();
    c.arc(402, 182, 10, 0, Math.PI);
    c.fill();
  };

  class SlidesView {
    constructor(ui, o) {
      this.ui = ui;
      this.o = o;
      this.theme = o.theme;
      this.i = 0;
      this.regions = [];
      this.hot = null;
    }

    update() {}

    next() {
      if (++this.i >= this.o.slides.length) this.o.then();
    }

    pointer(type, x, y, btn) {
      const r = this.regionAt(x, y);
      this.hot = r ? r.id : null;
      this.ui.gfx.cursor('hand');
      if (type !== 'down' || btn !== 0) return;
      this.ui.sfx('click');
      if (r) r.act();
      else this.next();
    }

    key(code) {
      if (code === 'Enter' || code === 'Space') this.next();
    }

    back() {
      this.o.then();
      return true;
    }

    draw(g) {
      const c = g.ctx, s = this.o.slides[Math.min(this.i, this.o.slides.length - 1)], page = typeof s === 'string' ? { text: s } : s;
      this.regions = [];
      const pic = A.image(page.pic || this.o.pic);
      if (pic) c.drawImage(pic.img, 0, 0, H.W, H.H);
      else paintSlide(c, page.faction || this.o.faction, this.i);
      g.text(page.title || this.o.title, H.W / 2, 34, { align: 'center', serif: true, size: 20 });
      g.panel(60, 450, 680, 120);
      H.Font.wrap('text', page.text, 640).slice(0, 5).forEach((s, i) => g.text(s, 80, 478 + i * 18, {}));
      g.text((this.i + 1) + ' из ' + this.o.slides.length + '. Щелчок: дальше', 80, 558, { size: 10, color: '#a89870' });
      this.button(g, 'slide-skip', 'Пропустить', 620, 538, 110, 24, () => this.o.then());
    }
  }
  Object.assign(SlidesView.prototype, H.Regions);

  class BriefView {
    constructor(ui, map, id, index) {
      this.ui = ui;
      this.map = map;
      this.id = id;
      this.index = index;
      this.camp = C.get(id);
      this.m = this.camp.missions[index];
      this.theme = this.camp.theme;
      this.regions = [];
      this.hot = null;
      this.bonus = 0;
      this.doc = null;
      this.failed = false;
      this.thumb = null;
      C.load(this.m).then(doc => {
        this.doc = doc;
        this.thumb = H.mapThumb(doc, 0);
      }, () => {
        this.failed = true;
      });
    }

    update() {}

    pointer(type, x, y, btn) {
      const r = this.regionAt(x, y);
      this.hot = r && !r.off ? r.id : null;
      this.ui.gfx.cursor(this.hot ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r && !r.off) {
        this.ui.sfx('click');
        r.act();
      }
    }

    key(code) {
      if (code === 'Enter' && this.doc) this.go();
    }

    back() {
      this.ui.show(this.map);
      return true;
    }

    go() {
      this.ui.startGame(C.setup(this.id, this.index, { seed: Math.floor(Math.random() * 1e9), bonus: this.bonus }));
    }

    draw(g) {
      const c = g.ctx, m = this.m, ink = '#2a1c0c';
      this.regions = [];
      c.fillStyle = '#0a0d18';
      c.fillRect(0, 0, H.W, H.H);
      c.fillStyle = '#17110a';
      c.fillRect(30, 26, 500, 548);
      c.fillStyle = '#d8c698';
      c.fillRect(26, 22, 500, 548);
      c.strokeStyle = '#8a7446';
      c.strokeRect(32.5, 28.5, 487, 535);
      g.text('Миссия ' + (this.index + 1) + ' из ' + this.camp.missions.length, 50, 52, { size: 10, color: ink });
      g.text(m.name, 50, 78, { serif: true, size: 20, color: ink });
      g.text(m.about, 50, 98, { size: 10, color: '#5a4624' });
      let y = 124;
      for (const part of m.brief.split('\n\n')) {
        for (const s of H.Font.wrap('text', part, 450)) {
          g.text(s, 50, y, { color: ink });
          y += 17;
        }
        y += 9;
      }
      y = Math.max(y, 340);
      g.text('Цели', 50, y, { bold: true, color: ink });
      y += 18;
      for (const s of m.goals) {
        g.text('· ' + s, 56, y, { size: 10, color: ink });
        y += 15;
      }
      g.text('Поражение: ' + m.lose, 56, y + 2, { size: 10, color: '#7a1e14' });
      A.drawPortrait(g, { hid: this.camp.hero, name: this.camp.name, faction: this.camp.faction }, 548, 26, 96);
      const hero = H.HEROES.find(h => h.id === this.camp.hero);
      g.text(hero.name, 654, 48, { bold: true });
      const run = C.runOf(this.id), level = run && run.hero ? run.hero.level : 1;
      g.text('Уровень ' + level + ', предел ' + m.levelCap, 654, 66, { size: 10, color: '#c8b88a' });
      g.text(H.DIFFICULTY[run.difficulty].name, 654, 82, { size: 10, color: '#c8b88a' });
      c.fillStyle = '#05070f';
      c.fillRect(548, 134, 228, 170);
      if (this.thumb) {
        const k = Math.min(226 / this.thumb.width, 168 / this.thumb.height), w = this.thumb.width * k, h = this.thumb.height * k;
        c.imageSmoothingEnabled = false;
        c.drawImage(this.thumb, 548 + (228 - w) / 2, 134 + (170 - h) / 2, w, h);
      } else g.text(this.failed ? 'Файл миссии не найден' : 'Загрузка карты', 662, 220, { align: 'center', size: 10, color: this.failed ? '#ff9080' : '#a89870' });
      g.text('Бонус на выбор', 548, 326, { bold: true });
      m.bonuses.forEach((b, i) => {
        const by = 336 + i * 46, on = this.bonus === i;
        this.region('bonus-' + i, 548, by, 228, 40, () => { this.bonus = i; });
        c.fillStyle = on ? 'rgba(255,224,96,0.18)' : 'rgba(5,7,15,0.6)';
        c.fillRect(548, by, 228, 40);
        c.strokeStyle = on ? '#ffe060' : this.hot === 'bonus-' + i ? '#c8b88a' : '#6a5430';
        c.strokeRect(548.5, by + 0.5, 227, 39);
        g.text(b.kind === 'art' ? 'Артефакт' : b.kind === 'unit' ? 'Существа' : 'Ресурсы', 558, by + 14, { size: 10, color: '#c8b88a' });
        g.text(C.bonusText(b), 558, by + 30, { size: 10 });
      });
      this.button(g, 'brief-back', 'Назад', 548, 540, 100, 30, () => this.back());
      this.button(g, 'brief-go', 'В путь', 660, 540, 116, 30, () => this.go(), !this.doc);
    }
  }
  Object.assign(BriefView.prototype, H.Regions);

  class MissionEndView {
    constructor(ui, map) {
      this.ui = ui;
      this.mapView = map;
      this.S = map.S;
      const c = this.S.campaign;
      this.id = c.id;
      this.index = c.mission;
      this.camp = C.get(c.id);
      this.m = this.camp.missions[c.mission];
      this.win = this.S.over.winner === map.pid;
      this.theme = this.win ? 'victory' : 'defeat';
      this.regions = [];
      this.hot = null;
      this.arts = C.artsOf(this.S);
      this.picks = this.arts.slice(0, C.MAX_ARTS);
      this.done = false;
      ui.game = null;
    }

    update() {}

    pointer(type, x, y, btn) {
      const r = this.regionAt(x, y);
      this.hot = r && !r.off ? r.id : null;
      this.ui.gfx.cursor(this.hot ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r && !r.off) {
        this.ui.sfx('click');
        r.act();
      }
    }

    key() {}

    back() {
      return true;
    }

    toggle(id) {
      if (this.picks.includes(id)) this.picks = this.picks.filter(x => x !== id);
      else if (this.picks.length < C.MAX_ARTS) this.picks.push(id);
    }

    map() {
      return new CampaignView(this.ui, new H.TitleView(this.ui));
    }

    onward() {
      if (this.done) return;
      this.done = true;
      const next = C.finish(this.S, this.picks), back = this.map();
      if (next == null) {
        const credits = () => this.ui.show(new CreditsView(this.ui, back));
        const morning = () => this.ui.show(new SlidesView(this.ui, { faction: this.camp.faction, title: 'Первое утро тысячного года', slides: this.camp.epilogue(C.runOf(this.id).flags), theme: 'finale', then: credits }));
        this.ui.show(new SlidesView(this.ui, { pic: 'picture/ending' + this.camp.number, faction: this.camp.faction, title: 'Кампания «' + this.camp.name + '» пройдена', slides: this.camp.ending, theme: this.camp.theme, then: this.camp.epilogue ? morning : () => this.ui.show(back) }));
        return;
      }
      this.ui.show(new BriefView(this.ui, back, this.id, next));
    }

    draw(g) {
      const c = g.ctx;
      this.regions = [];
      c.fillStyle = '#0a0d18';
      c.fillRect(0, 0, H.W, H.H);
      g.panel(120, 60, 560, 480);
      g.text(this.win ? 'Миссия выполнена' : 'Миссия провалена', H.W / 2, 96, { align: 'center', serif: true, size: 20, color: this.win ? '#ffe080' : '#ff9a8a' });
      g.text('«' + this.m.name + '», день ' + this.S.day, H.W / 2, 118, { align: 'center', size: 10, color: '#c8b88a' });
      if (!this.win) {
        g.text('Причина: ' + this.m.lose + '.', H.W / 2, 170, { align: 'center' });
        this.button(g, 'end-again', 'Заново', H.W / 2 - 170, 480, 160, 30, () => this.ui.show(new BriefView(this.ui, this.map(), this.id, this.index)));
        this.button(g, 'end-map', 'К кампаниям', H.W / 2 + 10, 480, 160, 30, () => this.ui.show(this.map()));
        return;
      }
      const h = C.heroOf(this.S);
      A.drawPortrait(g, { hid: h.hid, name: h.name, cls: h.cls, faction: h.faction }, 144, 140, 96);
      g.text(h.name, 256, 156, { bold: true });
      g.text('Уровень ' + h.level + ', навыков ' + Object.keys(h.skills).length + ', заклинаний ' + h.spells.length, 256, 176, { size: 10 });
      g.text('Уровень, навыки и дар идут с героем. Войско остаётся здесь.', 256, 196, { size: 10, color: '#c8b88a' });
      g.text('Артефакты с собой: ' + this.picks.length + ' из ' + C.MAX_ARTS, 144, 266, { bold: true });
      if (!this.arts.length) g.text('У героя нет вещей.', 144, 290, { color: '#a89870' });
      const seen = [...new Set(this.arts)];
      seen.slice(0, 15).forEach((id, i) => {
        const x = 144 + (i % 8) * 64, y = 280 + Math.floor(i / 8) * 76, on = this.picks.includes(id);
        this.region('end-art-' + id, x, y, 56, 56, () => this.toggle(id));
        c.fillStyle = on ? 'rgba(255,224,96,0.18)' : 'rgba(5,7,15,0.6)';
        c.fillRect(x, y, 56, 56);
        c.strokeStyle = on ? '#ffe060' : '#6a5430';
        c.strokeRect(x + 0.5, y + 0.5, 55, 55);
        A.drawArtifact(c, id, x + 4, y + 4, 48);
      });
      const hover = this.hot && this.hot.startsWith('end-art-') ? H.ARTIFACTS[this.hot.slice(8)] : null;
      if (hover) g.text(hover.name + ': ' + hover.about, H.W / 2, 450, { align: 'center', size: 10 });
      this.button(g, 'end-go', 'Дальше', H.W / 2 - 80, 480, 160, 30, () => this.onward());
    }
  }
  Object.assign(MissionEndView.prototype, H.Regions);

  const CREDITS = [
    ['Heroes 98', 'title'],
    ['Пошаговая стратегия: восемь народов Семилунья'],
    ['Sevenmoon Games (2000) / Win 98 Edition'],
    [''],
    ['Кампании', 'head'],
    ['«Набат»: Аделина Корвен, Лига Семи Рек'],
    ['«Соль»: Айсулу, Курганы степи Ак-Туз'],
    ['«Заповедь»: Ведана, Заповедная Чаща'],
    ['«Чаша»: Наэра, народ Прилива'],
    ['«Жар»: Ирга, Пепельные Горнила'],
    ['«Тысячелетие»: Валерия, Лунный Престол'],
    [''],
    ['Мир', 'head'],
    ['Семилунье, Венец и Чаша придуманы для этой игры.'],
    ['Народы, герои и существа тоже свои.'],
    [''],
    ['Музыка', 'head'],
    ['Играет на синтезаторе игры, ноты свои.'],
    [''],
    [''],
    ['Восьмая луна спит. Спасибо, что дошли до утра.', 'title']
  ];

  class CreditsView {
    constructor(ui, back) {
      this.ui = ui;
      this.back0 = back;
      this.theme = 'finale';
      this.t = 0;
      this.done = false;
    }

    update(dt) {
      this.t += dt;
      if (this.top() + CREDITS.length * CREDIT_LINE < 0) this.leave();
    }

    top() {
      return H.H - this.t * CREDIT_SPEED;
    }

    leave() {
      if (this.done) return;
      this.done = true;
      this.ui.show(this.back0);
    }

    pointer(type, x, y, btn) {
      this.ui.gfx.cursor('hand');
      if (type === 'down' && btn === 0) this.leave();
    }

    key(code) {
      if (code === 'Enter' || code === 'Space') this.leave();
    }

    back() {
      this.leave();
      return true;
    }

    draw(g) {
      const c = g.ctx, y0 = this.top();
      c.fillStyle = '#05070f';
      c.fillRect(0, 0, H.W, H.H);
      for (let i = 0; i < 70; i++) {
        c.fillStyle = 'rgba(232,236,255,' + (0.25 + (i % 5) * 0.12).toFixed(2) + ')';
        c.fillRect((i * 151) % H.W, (i * 97) % 380, 2, 2);
      }
      c.fillStyle = '#eef0f8';
      c.beginPath();
      c.arc(640, 90, 22, 0, Math.PI * 2);
      c.fill();
      CREDITS.forEach(([text, kind], i) => {
        const y = y0 + i * CREDIT_LINE;
        if (y < -20 || y > H.H + 20 || !text) return;
        if (kind === 'title') g.text(text, H.W / 2, y, { align: 'center', serif: true, size: 20, color: '#f4e2a8' });
        else g.text(text, H.W / 2, y, { align: 'center', bold: kind === 'head', color: kind === 'head' ? '#c8d4f0' : '#e8dcb8' });
      });
      g.text('Щелчок: пропустить', H.W - 12, H.H - 12, { align: 'right', size: 10, color: '#6a7290' });
    }
  }

  H.CampaignView = CampaignView;
  H.BriefView = BriefView;
  H.SlidesView = SlidesView;
  H.MissionEndView = MissionEndView;
  H.CreditsView = CreditsView;
  H.CREDITS = CREDITS;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
