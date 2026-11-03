(function (H) {
  'use strict';
  const A = H.Art;
  const D = H.Duel;
  const MOON_CHOICES = [null, ...H.Moons.MOONS.map(m => m.id)];
  const FIELD_CHOICES = [null, ...H.FIELDS.filter(Boolean).map(f => f.id)];
  const fieldName = id => (id ? H.FIELDS.find(f => f && f.id === id).name : 'Обычное поле');
  const fieldAbout = id => (id ? H.FIELDS.find(f => f && f.id === id).about : 'Без особых свойств');
  const moonOf = id => H.Moons.MOONS.find(m => m.id === id);

  class PassView {
    constructor(ui, map, go) {
      this.ui = ui;
      this.map = map;
      this.go = go;
      this.theme = map.theme;
      this.regions = [];
      this.hot = null;
    }

    update() {}

    pointer(type, x, y, btn) {
      const r = this.regionAt(x, y);
      this.hot = r ? r.id : null;
      this.ui.gfx.cursor(r ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r) {
        this.ui.sfx('click');
        r.act();
      }
    }

    key(code) {
      if (code === 'Enter' || code === 'Space') this.go();
    }

    back() {
      return true;
    }

    draw(g) {
      const c = g.ctx, S = this.map.S, p = S.players[this.map.pid], color = H.PLAYER_COLORS[p.color];
      this.regions = [];
      c.fillStyle = color;
      c.fillRect(0, 0, H.W, H.H);
      c.fillStyle = 'rgba(0,0,0,0.18)';
      for (let x = -H.H; x < H.W; x += 12) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x + 6, 0);
        c.lineTo(x + 6 + H.H, H.H);
        c.lineTo(x + H.H, H.H);
        c.fill();
      }
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(0, 0, H.W, 40);
      c.fillRect(0, H.H - 40, H.W, 40);
      g.panel(190, 196, 420, 196);
      g.text('Ходит ' + H.PLAYER_NAMES[p.color] + ' игрок', H.W / 2, 226, { align: 'center', serif: true, color: '#fff6d0' });
      g.text(H.FACTIONS[p.faction].full, H.W / 2, 252, { align: 'center', bold: true, color: '#f0e2b8' });
      g.text(H.Moons.dateText(S), H.W / 2, 272, { align: 'center', size: 10, color: '#c8b88a' });
      const heroes = S.heroes.filter(h => h.alive && h.owner === p.id).length, towns = H.Town.list(S, p.id).length;
      g.text('Героев ' + heroes + ', городов ' + towns + '. Карта скрыта, пока игрок не начнёт ход.', H.W / 2, 294, { align: 'center', size: 10, color: '#c8b88a' });
      this.button(g, 'go', 'Начать ход', H.W / 2 - 80, 330, 160, 32, () => this.go());
    }
  }
  Object.assign(PassView.prototype, H.Regions);

  class DuelView {
    constructor(ui, parent) {
      this.ui = ui;
      this.parent = parent;
      this.theme = 'title';
      this.regions = [];
      this.hot = null;
      this.picks = [0, 2];
      this.who = ['human', 'ai'];
      this.active = 1;
      this.mouse = [0, 0];
      this.field = null;
      this.moon = null;
      this.last = '';
      this.heroes = [null, null];
      this.refresh(0);
      this.refresh(1);
    }

    refresh(side) {
      this.heroes[side] = D.heroOf(D.HEROES[this.picks[side]]);
    }

    update() {}

    pointer(type, x, y, btn) {
      this.mouse = [x, y];
      const r = this.regionAt(x, y);
      this.hot = r && !r.off && r.act ? r.id : null;
      this.ui.gfx.cursor(r && !r.off && r.act ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r && !r.off && r.act) {
        this.ui.sfx('click');
        r.act();
      }
    }

    key(code) {
      if (code === 'Enter') this.fight();
    }

    back() {
      this.ui.show(this.parent);
      return true;
    }

    pick(i) {
      this.picks[this.active] = i;
      this.refresh(this.active);
      this.active = 1 - this.active;
    }

    fight(again) {
      const seed = again != null ? again : Math.floor(Math.random() * 1e9), duel = D.battle(D.HEROES[this.picks[0]], D.HEROES[this.picks[1]], { seed, field: this.field, moon: this.moon });
      const humans = [0, 1].filter(i => this.who[i] === 'human');
      const setup = {
        name: duel.name,
        seed,
        B: duel.B,
        player: humans.length ? humans[0] : 0,
        humans,
        colors: [0, 1],
        doneLabel: 'К поединку',
        done: B => {
          const winner = B.winner >= 0 ? duel.heroes[B.winner].name : 'никто';
          this.last = 'Последний бой: победил ' + winner + ', раундов ' + B.round + '.';
          this.ui.show(this);
        },
        replay: () => this.fight(seed)
      };
      const view = new H.BattleView(this.ui, setup);
      if (!humans.length) view.auto = true;
      this.ui.show(view);
    }

    card(g, side, x) {
      const c = g.ctx, h = this.heroes[side], d = D.HEROES[this.picks[side]], rec = D.recordOf(d), cls = H.CLASSES[h.cls], top = 46, on = this.active === side;
      c.fillStyle = 'rgba(0,0,0,0.55)';
      c.fillRect(x, top, 284, 336);
      c.fillStyle = H.PLAYER_COLORS[side];
      c.fillRect(x, top, 284, 6);
      c.fillRect(x, top + 330, 284, 6);
      c.strokeStyle = on ? '#ffe060' : '#6a5430';
      c.strokeRect(x + 0.5, top + 0.5, 283, 335);
      this.region('side-' + side, x, top, 284, 336, () => { this.active = side; });
      A.drawPortrait(g, h, x + 12, top + 16, 80);
      g.text(h.name, x + 102, top + 26, { bold: true, color: '#fff6d0' });
      g.text(cls.name + ', ' + H.FACTIONS[cls.faction].name, x + 102, top + 42, { size: 10, color: '#c8b88a' });
      g.text('Уровень ' + h.level + ', ветвь ' + (d.branch === 1 ? 'первая' : 'вторая'), x + 102, top + 56, { size: 10, color: '#c8b88a' });
      g.text(rec.spec.name, x + 102, top + 74, { bold: true, size: 10, color: '#a0e0ff' });
      H.Font.wrap('text', rec.spec.about, 176).slice(0, 2).forEach((t, i) => g.text(t, x + 102, top + 88 + i * 13, { size: 10 }));
      g.text('Натиск ' + H.Hero.stat(h, 'atk') + ', Стойкость ' + H.Hero.stat(h, 'def') + ', Чары ' + H.Hero.stat(h, 'power') + ', Мудрость ' + H.Hero.stat(h, 'wis'), x + 12, top + 122, { size: 10 });
      const skills = Object.entries(h.skills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, v]) => H.SKILLS[id].name + ' ' + v);
      H.Font.wrap('text', 'Навыки: ' + skills.join(', '), 260).slice(0, 2).forEach((t, i) => g.text(t, x + 12, top + 138 + i * 13, { size: 10, color: '#c8d4f0' }));
      g.text('Заклинаний ' + h.spells.length + ', мана ' + h.mana, x + 12, top + 168, { size: 10, color: '#a0c8ff' });
      h.army.forEach((s, i) => {
        const cx = x + 10 + i * 38, cy = top + 180;
        c.fillStyle = '#0a1024';
        c.fillRect(cx, cy, 36, 44);
        A.drawUnit(c, s.unit, cx + 18, cy + 38, { scale: 36 / 104, tier: false });
        g.text(String(s.count), cx + 34, cy + 42, { align: 'right', size: 10, color: '#fff6d0' });
        this.region('u-' + side + '-' + i, cx, cy, 36, 44, null, { info: H.UNITS[s.unit].name + ': ' + s.count });
      });
      const arts = Object.values(h.arts).filter(Boolean).map(id => H.ARTIFACTS[id].name);
      H.Font.wrap('text', 'Вещи: ' + arts.join(', '), 260).slice(0, 3).forEach((t, i) => g.text(t, x + 12, top + 242 + i * 13, { size: 10, color: '#c8b88a' }));
      this.button(g, 'who-' + side, this.who[side] === 'human' ? 'Ведёт человек' : 'Ведёт ИИ', x + 12, top + 290, 260, 26, () => { this.who[side] = this.who[side] === 'human' ? 'ai' : 'human'; });
    }

    draw(g) {
      const c = g.ctx;
      this.regions = [];
      c.fillStyle = '#0a0c1c';
      c.fillRect(0, 0, H.W, H.H);
      c.fillStyle = '#141a34';
      for (let y = 0; y < H.H; y += 4) c.fillRect(0, y, H.W, 1);
      g.text('Поединок', H.W / 2, 22, { align: 'center', serif: true });
      this.card(g, 0, 16);
      this.card(g, 1, 500);
      g.panel(308, 46, 184, 336);
      g.text('Поле боя', 400, 66, { align: 'center', bold: true });
      FIELD_CHOICES.forEach((id, i) => {
        const y = 76 + i * 24;
        this.region('field-' + i, 320, y, 160, 22, () => { this.field = id; });
        g.button({ x: 320, y, w: 160, h: 22, label: fieldName(id), hot: this.hot === 'field-' + i, down: this.field === id });
      });
      H.Font.wrap('text', fieldAbout(this.field), 160).slice(0, 2).forEach((t, i) => g.text(t, 400, 232 + i * 13, { align: 'center', size: 10, color: '#c8b88a' }));
      g.text('Луна', 400, 270, { align: 'center', bold: true });
      const m = this.moon ? moonOf(this.moon) : null;
      this.button(g, 'moon', m ? m.full : 'Без луны', 320, 280, 160, 22, () => { this.moon = MOON_CHOICES[(MOON_CHOICES.indexOf(this.moon) + 1) % MOON_CHOICES.length]; });
      H.Font.wrap('text', m ? 'Сильнее: ' + (m.people.map(f => (H.FACTIONS[f] ? H.FACTIONS[f].name : '')).filter(Boolean).join(', ') || 'никто') : 'Луна не помогает никому', 160).slice(0, 2).forEach((t, i) => g.text(t, 400, 316 + i * 13, { align: 'center', size: 10, color: '#c8b88a' }));
      this.button(g, 'fight', 'В бой', 320, 346, 160, 28, () => this.fight());
      g.text(this.last || 'Щелчок по герою внизу ставит его ' + (this.active ? 'справа' : 'слева') + '. Щелчок по карточке выбирает сторону.', H.W / 2, 396, { align: 'center', size: 10, color: this.last ? '#ffe080' : '#c8b88a' });
      D.HEROES.forEach((d, i) => {
        const x = 16 + (i % 6) * 128, y = 408 + Math.floor(i / 6) * 84, rec = D.recordOf(d), cls = H.CLASSES[rec.cls], id = 'pick-' + i, mine = this.picks.indexOf(i);
        this.region(id, x, y, 124, 80, () => this.pick(i));
        c.fillStyle = this.hot === id ? '#1e2c58' : '#10183a';
        c.fillRect(x, y, 124, 80);
        c.strokeStyle = mine >= 0 ? H.PLAYER_COLORS[mine] : '#3a3020';
        c.strokeRect(x + 0.5, y + 0.5, 123, 79);
        A.drawPortrait(g, { hid: rec.id, cls: rec.cls, faction: cls.faction }, x + 6, y + 6, 44);
        g.text(rec.name.split(' ')[0], x + 56, y + 16, { bold: true, size: 10, color: '#f0e2b8' });
        g.text(H.FACTIONS[cls.faction].name, x + 56, y + 30, { size: 10, color: '#c8b88a' });
        g.text(cls.mage ? 'маг' : 'воин', x + 56, y + 44, { size: 10, color: '#8a94b0' });
        if (mine >= 0) g.text(this.picks[0] === this.picks[1] ? 'обе стороны' : mine ? 'справа' : 'слева', x + 6, y + 68, { size: 10, color: H.PLAYER_COLORS[mine] });
      });
      this.button(g, 'back', 'Назад', 16, 10, 90, 22, () => this.back());
      const tip = this.regionAt(this.mouse[0], this.mouse[1]);
      if (tip && tip.info) {
        const tw = H.Font.measure('text', tip.info) + 16, tx = H.clamp(this.mouse[0] + 12, 4, H.W - tw - 4), ty = this.mouse[1] + 16;
        g.panel(tx, ty, tw, 22, 'tip');
        g.text(tip.info, tx + 8, ty + 15, { size: 10 });
      }
    }
  }
  Object.assign(DuelView.prototype, H.Regions);

  class FameView {
    constructor(ui, parent) {
      this.ui = ui;
      this.parent = parent;
      this.theme = 'title';
      this.regions = [];
      this.hot = null;
      this.rows = H.Fame.list();
      this.scene = null;
    }

    update() {}

    pointer(type, x, y, btn) {
      const r = this.regionAt(x, y);
      this.hot = r ? r.id : null;
      this.ui.gfx.cursor(r ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r) {
        this.ui.sfx('click');
        r.act();
      }
    }

    key(code) {
      if (code === 'Enter') this.back();
    }

    back() {
      this.ui.show(this.parent);
      return true;
    }

    draw(g) {
      const c = g.ctx;
      this.regions = [];
      if (!this.scene) {
        this.scene = document.createElement('canvas');
        this.scene.width = H.W;
        this.scene.height = H.H;
        H.paintNight(this.scene.getContext('2d'));
      }
      c.drawImage(this.scene, 0, 0);
      c.fillStyle = 'rgba(4,6,16,0.55)';
      c.fillRect(0, 0, H.W, H.H);
      const title = 'Зал славы';
      H.Font.draw(c, 'big', title, H.W / 2 - H.Font.measure('big', title) / 2 + 2, 22, '#000000');
      H.Font.draw(c, 'big', title, H.W / 2 - H.Font.measure('big', title) / 2, 20, '#f4e2a8');
      const x0 = 130, y0 = 76, w = 540, rowH = 34;
      const stone = c.createLinearGradient(x0, y0, x0 + w, y0);
      stone.addColorStop(0, '#2a2a34');
      stone.addColorStop(0.5, '#3a3a46');
      stone.addColorStop(1, '#2a2a34');
      c.fillStyle = stone;
      c.beginPath();
      c.moveTo(x0, y0 + 18);
      c.lineTo(x0 + w / 2, y0 - 6);
      c.lineTo(x0 + w, y0 + 18);
      c.lineTo(x0 + w, y0 + 30 + rowH * H.Fame.MAX);
      c.lineTo(x0, y0 + 30 + rowH * H.Fame.MAX);
      c.closePath();
      c.fill();
      c.strokeStyle = '#6a6a7a';
      c.stroke();
      for (let i = 0; i < H.Fame.MAX; i++) {
        const y = y0 + 26 + i * rowH, r = this.rows[i];
        c.fillStyle = i % 2 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.03)';
        c.fillRect(x0 + 12, y, w - 24, rowH - 2);
        g.text(String(i + 1), x0 + 36, y + 20, { align: 'right', serif: true, color: i < 3 ? '#ffe080' : '#c8c0a8' });
        if (!r) {
          g.text('пусто', x0 + 52, y + 20, { size: 10, color: '#6a6a7a' });
          continue;
        }
        g.text(r.rank, x0 + 52, y + 14, { bold: true, color: '#f4e2a8' });
        g.text(r.map + ', ' + (H.FACTIONS[r.faction] ? H.FACTIONS[r.faction].name : r.faction) + ', ' + H.DIFFICULTY[r.difficulty].name.toLowerCase() + ', дней ' + r.days + (r.when ? ', ' + r.when : ''), x0 + 52, y + 28, { size: 10, color: '#b8b0a0' });
        g.text(String(r.score), x0 + w - 24, y + 20, { align: 'right', serif: true, color: '#ffe080' });
      }
      if (!this.rows.length) g.text('Зал пока пуст. Победа на сценарии или случайной карте вписывает сюда имя.', H.W / 2, y0 + 40 + rowH * H.Fame.MAX, { align: 'center', size: 10, color: '#c8b88a' });
      const ladder = H.Fame.RANKS.map(([n, name]) => name + ' ' + n);
      for (let k = 0; k < 3; k++) g.text(ladder.slice(k * 4, k * 4 + 4).join(', '), H.W / 2, 468 + k * 14 + (this.rows.length ? 0 : 10), { align: 'center', size: 10, color: '#8a94b0' });
      g.text('Очки: размер карты, сложность и скорость победы.', H.W / 2, 528, { align: 'center', size: 10, color: '#8a94b0' });
      this.button(g, 'back', 'Назад', H.W / 2 - 70, 550, 140, 28, () => this.back());
    }
  }
  Object.assign(FameView.prototype, H.Regions);

  H.PassView = PassView;
  H.DuelView = DuelView;
  H.FameView = FameView;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
