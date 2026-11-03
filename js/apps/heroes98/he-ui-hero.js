(function (H) {
  'use strict';
  const HE = H.Hero, A = H.Art, HR = H.HERO;
  const hit = (b, x, y) => x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h;
  const STAT_NAMES = { atk: 'Натиск', def: 'Стойкость', power: 'Чары', wis: 'Мудрость' };
  const SKILL_COLORS = { tactics: '#7a5a2a', offense: '#a03a2a', defense: '#3a6a9a', archery: '#4a7a3a', leadership: '#c0902a', luck: '#3a8a5a', march: '#8a6a3a', scouting: '#3a7a8a', treasury: '#b89a30', learning: '#6a4a9a', sorcery: '#7a3a9a', machines: '#5a5a62', yasna: '#c8c080', zhar: '#c8501a', glub: '#2a5a9a', rostan: '#3a8a2a', morok: '#5a3a6a', tlen: '#4a5a3a', mera: '#8a8a9a' };
  const sign = v => (v > 0 ? '+' + v : String(v));

  const iconBox = (g, key, x, y, s, color, label) => {
    const c = g.ctx, pic = A.image(key);
    if (pic) {
      c.drawImage(pic.img, x, y, s, s);
      return;
    }
    c.fillStyle = color;
    c.fillRect(x, y, s, s);
    c.strokeStyle = '#0c0806';
    c.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
    g.text(label, x + s / 2, y + s / 2, { align: 'center', size: 10, bold: true, color: '#ffffff' });
  };
  const skillIcon = (g, id, x, y, s) => iconBox(g, 'skill/' + id, x, y, s, SKILL_COLORS[id], H.SKILLS[id].name.slice(0, 2));
  const perkIcon = (g, id, x, y, s) => iconBox(g, 'perk/' + id, x, y, s, SKILL_COLORS[H.PERKS[id].skill], H.PERKS[id].name.slice(0, 2));
  const talentIcon = (g, id, x, y, s) => iconBox(g, 'talent/' + id, x, y, s, H.TALENTS[id].high ? '#a07a20' : '#5a4a7a', H.TALENTS[id].name.slice(0, 2));
  const pips = (c, x, y, n) => {
    for (let i = 0; i < 3; i++) {
      c.fillStyle = i < n ? '#ffe060' : '#2a2418';
      c.fillRect(x + i * 7, y, 5, 4);
    }
  };
  const starMarks = (c, x, y, n) => {
    c.fillStyle = '#ffe060';
    for (let i = 0; i < n; i++) {
      const sx = x + i * 7;
      c.beginPath();
      c.moveTo(sx + 3, y);
      c.lineTo(sx + 4, y + 2);
      c.lineTo(sx + 6, y + 2);
      c.lineTo(sx + 4.5, y + 3.5);
      c.lineTo(sx + 5, y + 6);
      c.lineTo(sx + 3, y + 4.5);
      c.lineTo(sx + 1, y + 6);
      c.lineTo(sx + 1.5, y + 3.5);
      c.lineTo(sx, y + 2);
      c.lineTo(sx + 2, y + 2);
      c.closePath();
      c.fill();
    }
  };

  H.Regions = {
    region(id, x, y, w, h, act, more) {
      this.regions.push(Object.assign({ id, x, y, w, h, act }, more || {}));
      return this.hot === id;
    },
    button(g, id, label, x, y, w, h, act, off) {
      this.region(id, x, y, w, h, act, { off });
      g.button({ x, y, w, h, label, hot: this.hot === id, off, down: this.down === id });
    },
    regionAt(x, y) {
      return [...this.regions].reverse().find(q => hit(q, x, y)) || null;
    }
  };

  H.ArmyCells = {
    armyCells(g, key, army, x, y, size, step, more) {
      const c = g.ctx, o = more || {};
      for (let i = 0; i < 7; i++) {
        const cx = x + i * step, s = army[i], held = this.carry && this.carry.army === army && this.carry.slot === i;
        c.fillStyle = '#05070f';
        c.fillRect(cx, y, size, size);
        c.strokeStyle = held ? '#ffe060' : '#6a5430';
        c.lineWidth = held ? 2 : 1;
        c.strokeRect(cx + 0.5, y + 0.5, size - 1, size - 1);
        c.lineWidth = 1;
        if (s) {
          A.drawUnit(c, s.unit, cx + size / 2, y + size - 6, { scale: size / 104, tier: false });
          g.text(String(s.count), cx + size - 3, y + size - 7, { align: 'right', size: 10, bold: true, color: '#ffffff' });
          if (s.stars) starMarks(c, cx + 2, y + 2, s.stars);
        }
        this.region('cell-' + key + i, cx, y, size, size, () => this.cellDown(key, army, i), { cell: { key, army, slot: i }, info: s ? () => this.stackLines(s, o.hero) : null, right: s ? () => this.openSplit(key, army, i) : null });
      }
    },
    stackLines(s, hero) {
      const u = H.UNITS[s.unit], plusA = hero ? HE.stat(hero, 'atk') : 0, plusD = hero ? HE.stat(hero, 'def') : 0, st = s.stars || 0;
      return [u.name + ' — ' + s.count, 'Натиск ' + (u.atk + plusA + st) + ', Стойкость ' + (u.def + plusD + st), 'Урон ' + u.dmg[0] + '–' + u.dmg[1] + ', здоровье ' + u.hp, 'Скорость ' + u.speed + ', инициатива ' + u.init, ...(st ? ['Бывалые: ' + st + ' ' + H.plural(st, 'звезда', 'звезды', 'звёзд') + ', +' + st + ' Натиск и Стойкость'] : []), ...H.unitTraits(u).slice(0, 3).map(t => t[0] + ': ' + t[1]), 'Правый щелчок: разделить'];
    },
    cellDown(key, army, slot) {
      if (this.carry) this.cellDrop({ key, army, slot });
      else if (army[slot]) this.carry = { key, army, slot, fresh: true };
    },
    cellUp(x, y) {
      const k = this.carry;
      if (!k) return;
      const r = this.regionAt(x, y), t = r && r.cell;
      if (!t || (t.army === k.army && t.slot === k.slot)) {
        k.fresh = false;
        return;
      }
      if (k.fresh) this.cellDrop(t);
    },
    cellDrop(t) {
      const k = this.carry;
      this.carry = null;
      if (t.army === k.army && t.slot === k.slot) return;
      const keys = this.ui.keys, half = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && !t.army[t.slot] && k.army[k.slot].count > 1;
      const n = half ? Math.ceil(k.army[k.slot].count / 2) : null;
      if (!this.armyMove(k, t, n) && k.keep !== false) this.toast('Герой не может остаться без войска', '#ff9080');
    },
    openSplit(key, army, slot) {
      this.carry = null;
      this.tipOf = null;
      this.split = { key, army, slot, n: Math.floor(army[slot].count / 2) };
    },
    drawCarry(g) {
      const k = this.carry, s = k && k.army[k.slot];
      if (s) A.drawUnit(g.ctx, s.unit, this.mouse[0], this.mouse[1] + 18, { scale: 0.42, tier: false, alpha: 0.75 });
    },
    drawSplit(g) {
      const w = this.split, s = w.army[w.slot], x = 220, y = 200, W = 360, Hh = 170, c = g.ctx, free = w.army.findIndex(q => !q), max = s ? s.count - 1 : 0;
      this.region('split-block', 0, 0, H.W, H.H, null);
      c.fillStyle = 'rgba(5,7,15,0.5)';
      c.fillRect(0, 0, H.W, H.H);
      g.panel(x, y, W, Hh);
      g.text('Разделить: ' + H.UNITS[s.unit].name, x + W / 2, y + 22, { align: 'center', bold: true });
      w.n = H.clamp(w.n, 0, max);
      const bar = { x: x + 40, y: y + 50, w: 280, h: 14 }, set = mx => { w.n = Math.round(H.clamp((mx - bar.x) / bar.w, 0, 1) * max); };
      this.region('split-bar', bar.x, bar.y - 4, bar.w, bar.h + 8, mx => set(mx), { drag: mx => set(mx) });
      c.fillStyle = '#0a1024';
      c.fillRect(bar.x, bar.y, bar.w, bar.h);
      c.fillStyle = '#c8a050';
      c.fillRect(bar.x, bar.y, max ? bar.w * w.n / max : 0, bar.h);
      c.strokeStyle = '#6a5430';
      c.strokeRect(bar.x + 0.5, bar.y + 0.5, bar.w - 1, bar.h - 1);
      g.text('Остаётся ' + (s.count - w.n) + ', новый отряд ' + w.n, x + W / 2, y + 82, { align: 'center' });
      const go = () => {
        if (this.armyMove({ key: w.key, army: w.army, slot: w.slot }, { key: w.key, army: w.army, slot: free }, w.n)) this.split = null;
      };
      this.button(g, 'split-go', 'Разделить', x + 16, y + Hh - 44, 100, 26, go, free < 0 || w.n < 1);
      const canDisband = this.disbandHero && this.disbandHero(w);
      this.button(g, 'split-drop', 'Распустить', x + 130, y + Hh - 44, 100, 26, () => this.askDisband(w), !canDisband);
      this.button(g, 'split-close', 'Закрыть', x + 244, y + Hh - 44, 100, 26, () => { this.split = null; });
    }
  };

  class HeroView {
    constructor(ui, parent, hero) {
      this.ui = ui;
      this.parent = parent;
      this.S = parent.S;
      this.pid = parent.pid;
      this.h = hero;
      this.time = 0;
      this.mouse = [0, 0];
      this.regions = [];
      this.toasts = [];
      this.hot = null;
      this.carry = null;
      this.artCarry = null;
      this.split = null;
      this.confirm = null;
      this.drag = null;
    }

    toast(text, color) {
      this.toasts.push({ text, color: color || '#f0e2b8', t: 0 });
      if (this.toasts.length > 3) this.toasts.shift();
    }

    update(dt) {
      this.time += dt;
      for (const t of this.toasts) t.t += dt;
      this.toasts = this.toasts.filter(t => t.t < 3);
    }

    leave() {
      if (this.parent.heroClosed) this.parent.heroClosed(this.h);
      this.ui.show(this.parent);
    }

    back() {
      if (this.confirm) this.confirm = null;
      else if (this.split) this.split = null;
      else if (this.carry || this.artCarry) {
        this.carry = null;
        this.artCarry = null;
      } else this.leave();
      return true;
    }

    key(code) {
      if (code === 'KeyH' && !this.confirm && !this.split) this.leave();
    }

    armyMove(k, t, n) {
      const ok = HE.moveStack(k.army, k.slot, t.army, t.slot, { n, keep: true });
      if (ok) this.S.ver++;
      return ok;
    }

    disbandHero(w) {
      return w.army === this.h.army && this.h.army.filter(Boolean).length > 1;
    }

    askDisband(w) {
      const s = w.army[w.slot];
      this.confirm = { text: 'Распустить отряд «' + H.UNITS[s.unit].name + '»?', yes: () => {
        if (HE.disband(this.h, w.slot)) this.S.ver++;
        this.split = null;
      } };
    }

    pointer(type, x, y, btn) {
      this.mouse = [x, y];
      if (type === 'move' && this.drag) {
        this.drag(x, y);
        return;
      }
      if (type === 'up') {
        this.drag = null;
        this.down = null;
        if (btn === 0) {
          this.cellUp(x, y);
          this.artUp(x, y);
        }
        return;
      }
      const r = this.regionAt(x, y);
      this.hot = r && !r.off && r.act ? r.id : null;
      this.tipOf = r && r.info && !this.carry && !this.artCarry ? r.info : null;
      this.ui.gfx.cursor(this.hot ? 'hand' : 'arrow');
      if (type !== 'down') return;
      if (btn === 2) {
        if (r && r.right && !this.split && !this.confirm) r.right();
        return;
      }
      if (btn !== 0 || !r || r.off || !r.act) return;
      this.down = r.id;
      r.act(x, y);
      if (r.drag) this.drag = r.drag;
    }

    artUp(x, y) {
      const k = this.artCarry;
      if (!k) return;
      const r = this.regionAt(x, y), t = r && r.artRef;
      if (!t || (t.slot === k.ref.slot && t.bag === k.ref.bag)) {
        if (k.fresh) k.fresh = false;
        return;
      }
      if (k.fresh) this.artDrop(t);
    }

    artDown(ref) {
      if (this.artCarry) this.artDrop(ref);
      else if (HE.artAt(this.h, ref)) this.artCarry = { ref, fresh: true };
    }

    artDrop(ref) {
      const k = this.artCarry;
      this.artCarry = null;
      if (k.ref.slot === ref.slot && k.ref.bag === ref.bag) {
        if (k.ref.slot) HE.moveArt(this.h, k.ref, this.h, { bag: this.h.bag.length });
        else {
          const id = this.h.bag[k.ref.bag], slot = H.ART_SLOTS.map(s => s[0]).find(s => HE.fits(id, s));
          const free = H.ART_SLOTS.map(s => s[0]).find(s => HE.fits(id, s) && !this.h.arts[s]);
          HE.moveArt(this.h, k.ref, this.h, { slot: free || slot });
        }
      } else if (!HE.moveArt(this.h, k.ref, this.h, ref)) this.toast('Сюда эта вещь не подходит', '#ff9080');
      this.S.ver++;
    }

    artCell(g, ref, x, y, s, label) {
      const c = g.ctx, id = HE.artAt(this.h, ref), held = this.artCarry && this.artCarry.ref.slot === ref.slot && this.artCarry.ref.bag === ref.bag;
      c.fillStyle = '#0a1024';
      c.fillRect(x, y, s, s);
      c.strokeStyle = held ? '#ffe060' : '#6a5430';
      c.lineWidth = held ? 2 : 1;
      c.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      c.lineWidth = 1;
      if (id) A.drawArtifact(c, id, x + 2, y + 2, s - 4);
      this.region('art-' + (ref.slot || ref.bag), x, y, s, s, () => this.artDown(ref), { artRef: ref, info: id ? () => this.artLines(id) : label ? () => [label, 'Пусто'] : null });
    }

    artLines(id) {
      const a = H.ARTIFACTS[id], base = [a.name, a.about, H.ART_RANKS[a.rank][0] + ', ' + (a.slot === 'ring' ? 'кольцо' : H.ART_SLOTS.find(s => s[0] === a.slot)[1].toLowerCase())];
      if (!a.set) return base;
      const set = H.ART_SETS[a.set], worn = (HE.setsOn(this.h).find(x => x.set === set) || { count: 0 }).count;
      return [...base, 'Набор: ' + set.name + ', надето ' + worn + ' из ' + set.items.length, 'За 2 вещи: ' + set.twoAbout, 'За все: ' + set.fullAbout];
    }

    draw(g) {
      this.parent.draw(g);
      this.regions = [];
      const c = g.ctx, h = this.h, X = 80, Y = 60, W = 640, Hh = 480, cls = H.CLASSES[h.cls], F = H.FACTIONS[h.faction], sp = HE.spec(h);
      c.fillStyle = 'rgba(5,7,15,0.55)';
      c.fillRect(0, 0, H.W, H.H);
      this.region('block', 0, 0, H.W, H.H, null);
      g.panel(X, Y, W, Hh);
      A.drawPortrait(g, h, X + 14, Y + 14, 96);
      g.text(h.name, X + 120, Y + 24, { serif: true });
      g.text(cls.name + ', ' + F.name, X + 120, Y + 46, { size: 10, color: '#c8b88a' });
      const lvl = h.level, from = H.XP_TABLE[lvl], to = H.XP_TABLE[Math.min(HR.maxLevel, lvl + 1)];
      g.text('Уровень ' + lvl, X + 120, Y + 62, { bold: true });
      c.fillStyle = '#0a1024';
      c.fillRect(X + 120, Y + 72, 150, 8);
      c.fillStyle = '#c8a050';
      c.fillRect(X + 120, Y + 72, lvl >= HR.maxLevel ? 150 : 150 * H.clamp((h.xp - from) / Math.max(1, to - from), 0, 1), 8);
      g.text('Опыт ' + h.xp + (lvl < HR.maxLevel ? ' из ' + to : ''), X + 120, Y + 90, { size: 10 });
      g.text('Мана ' + h.mana + ' из ' + HE.maxMana(h), X + 120, Y + 104, { size: 10 });
      [['atk', 'Натиск'], ['def', 'Стойкость'], ['power', 'Чары'], ['wis', 'Мудрость']].forEach(([k, label], i) => {
        const v = HE.stat(h, k), plus = v - h[k];
        g.text(label, X + 14, Y + 128 + i * 16, { color: '#e8d8a8' });
        g.text(String(v) + (plus ? ' (+' + plus + ')' : ''), X + 130, Y + 128 + i * 16, { bold: true, align: 'right' });
      });
      const armyMix = new Set(h.army.filter(Boolean).map(s => H.UNITS[s.unit].faction).filter(f => f !== 'neutral')).size - 1, mix = HE.hasPerk(h, 'banner') ? 0 : Math.max(0, armyMix), mor = HE.morale(h) - mix;
      g.text('Мораль', X + 150, Y + 128, { color: '#e8d8a8' });
      g.text(sign(mor), X + 262, Y + 128, { bold: true, align: 'right' });
      g.text('Удача', X + 150, Y + 144, { color: '#e8d8a8' });
      g.text(sign(HE.luck(h)), X + 262, Y + 144, { bold: true, align: 'right' });
      g.text('Шаги', X + 150, Y + 160, { color: '#e8d8a8' });
      g.text((Math.floor(h.steps * 10) / 10) + '/' + H.Adv.daySteps(this.S, h), X + 262, Y + 160, { bold: true, align: 'right' });
      g.text('Обзор', X + 150, Y + 176, { color: '#e8d8a8' });
      g.text(String(HE.sight(this.S, h)), X + 262, Y + 176, { bold: true, align: 'right' });
      g.text('Особенность: ' + (sp ? sp.name : 'нет'), X + 14, Y + 200, { bold: true, color: '#a0c8ff' });
      if (sp) H.Font.wrap('small', sp.about, 256).slice(0, 2).forEach((s, i) => g.text(s, X + 14, Y + 216 + i * 13, { size: 10 }));
      const rec = HE.record(h);
      if (rec) H.Font.wrap('small', rec.bio, 256).slice(0, 4).forEach((s, i) => g.text(s, X + 14, Y + 246 + i * 12, { size: 10, color: '#a89870' }));
      this.drawFigure(g, X + 282, Y + 12);
      g.text('Сумка', X + 446, Y + 18, { bold: true });
      for (let i = 0; i < HR.maxBag; i++) this.artCell(g, { bag: i }, X + 446 + (i % 6) * 30, Y + 28 + Math.floor(i / 6) * 30, 28);
      g.text('Навыки', X + 14, Y + 304, { bold: true });
      const ids = Object.keys(h.skills);
      for (let i = 0; i < HR.maxSkills; i++) {
        const x = X + 14 + i * 46, y = Y + 314, id = ids[i];
        c.fillStyle = '#05070f';
        c.fillRect(x, y, 40, 40);
        c.strokeStyle = '#6a5430';
        c.strokeRect(x + 0.5, y + 0.5, 39, 39);
        if (!id) continue;
        skillIcon(g, id, x + 3, y + 3, 34);
        pips(c, x + 10, y + 33, h.skills[id]);
        const perk = H.SKILLS[id].perks.map(p => p[0]).find(p => h.perks.includes(p));
        if (perk) perkIcon(g, perk, x + 24, y + 2, 14);
        this.region('sk-' + id, x, y, 40, 40, null, { info: () => [H.SKILLS[id].name + ': ступень ' + h.skills[id], H.SKILLS[id].ranks[h.skills[id] - 1], ...(perk ? ['Приём: ' + H.PERKS[perk].name, H.PERKS[perk].about] : [])] });
      }
      const gift = F.gift;
      g.text('Дар: ' + gift.name, X + 300, Y + 304, { bold: true });
      HR.talentLevels.forEach((L, i) => {
        const x = X + 300 + i * 46, y = Y + 314, id = gift.talents[L].map(t => t[0]).find(t => h.talents.includes(t));
        c.fillStyle = '#05070f';
        c.fillRect(x, y, 40, 40);
        c.strokeStyle = h.level >= L ? '#c8a050' : '#3a3020';
        c.strokeRect(x + 0.5, y + 0.5, 39, 39);
        if (id) talentIcon(g, id, x + 3, y + 3, 34);
        else g.text(String(L), x + 20, y + 20, { align: 'center', color: h.level >= L ? '#f0e2b8' : '#6a604a' });
        this.region('tal-' + L, x, y, 40, 40, null, { info: () => (id ? [H.TALENTS[id].name, H.TALENTS[id].about] : ['Уровень ' + L, 'Выбор: ' + gift.talents[L].map(t => t[1]).join(' или ')]) });
      });
      const hi = HE.highState(h), hx = X + 300 + 3 * 46, hy = Y + 314;
      c.fillStyle = '#05070f';
      c.fillRect(hx, hy, 40, 40);
      c.strokeStyle = hi.open ? '#ffe060' : '#3a3020';
      c.strokeRect(hx + 0.5, hy + 0.5, 39, 39);
      if (hi.open) talentIcon(g, hi.id, hx + 3, hy + 3, 34);
      else g.text(String(HR.highLevel), hx + 20, hy + 20, { align: 'center', color: '#6a604a' });
      this.region('tal-high', hx, hy, 40, 40, null, { info: () => ['Высший дар: ' + hi.name, hi.about, hi.open ? 'Открыт' : 'С ' + HR.highLevel + ' уровня' + (hi.missing.length ? ', мастер: ' + hi.missing.join(', ') : '')] });
      g.text('Войско', X + 14, Y + 372, { bold: true });
      this.armyCells(g, 'hero', h.army, X + 14, Y + 382, 44, 48, { hero: h });
      g.text('Машины: ' + (h.machines.length ? h.machines.map(id => H.UNITS[id].name).join(', ') : 'нет'), X + 370, Y + 384, { size: 10, color: '#c8b88a' });
      this.button(g, 'h-book', 'Книга', X + 370, Y + 400, 82, 26, () => {
        const S = this.S;
        this.ui.show(new BookView(this.ui, this, { hero: HE.battleHero(h), board: { moon: H.Moons.battle(S) }, known: h.spells, road: HE.roadSpells(h), level: h.level }));
      });
      this.button(g, 'h-fire', 'Уволить', X + 458, Y + 400, 82, 26, () => this.askFire());
      this.button(g, 'h-close', 'Закрыть', X + 546, Y + 400, 82, 26, () => this.leave());
      if (this.split) this.drawSplit(g);
      if (this.confirm) this.drawConfirm(g);
      this.toasts.forEach((t, i) => g.text(t.text, H.W / 2, 18 + i * 16, { align: 'center', bold: true, color: t.color }));
      if (this.tipOf && !this.split && !this.confirm) this.drawTip(g, this.tipOf());
      this.drawCarry(g);
      if (this.artCarry) A.drawArtifact(c, HE.artAt(h, this.artCarry.ref) || 'quilted', this.mouse[0] - 14, this.mouse[1] - 14, 28);
    }

    drawFigure(g, x, y) {
      const c = g.ctx, cx = x + 75;
      c.fillStyle = '#20264a';
      c.beginPath();
      c.arc(cx, y + 40, 22, 0, Math.PI * 2);
      c.fill();
      c.fillRect(cx - 28, y + 66, 56, 120);
      c.fillRect(cx - 54, y + 76, 26, 90);
      c.fillRect(cx + 28, y + 76, 26, 90);
      c.fillRect(cx - 24, y + 186, 20, 80);
      c.fillRect(cx + 4, y + 186, 20, 80);
      const at = { head: [55, 2], neck: [55, 46], shoulders: [105, 46], body: [55, 92], right: [5, 92], left: [105, 92], ring1: [5, 138], ring2: [105, 138], legs: [55, 196], charm: [5, 46] };
      for (const [slot, label] of H.ART_SLOTS) this.artCell(g, { slot }, x + at[slot][0], y + at[slot][1], 40, label);
      HE.setsOn(this.h).filter(q => q.count >= 2).slice(0, 2).forEach((q, i) => g.text(q.set.name + ' ' + q.count + '/' + q.set.items.length, x + 75, y + 242 + i * 12, { align: 'center', size: 10, color: q.count >= q.set.items.length ? '#ffe060' : '#a0c8ff' }));
    }

    askFire() {
      const S = this.S, h = this.h, last = S.heroes.filter(x => x.alive && x.owner === h.owner).length <= 1 && !H.Town.list(S, h.owner).length;
      if (last) {
        this.toast('Последнего героя без города уволить нельзя', '#ff9080');
        return;
      }
      this.confirm = { text: 'Уволить героя ' + h.name + '? Войско уйдёт вместе с ним.', yes: () => {
        HE.dismiss(S, h);
        if (this.parent.heroGone) this.parent.heroGone(h);
        this.ui.show(this.parent);
      } };
    }

    drawConfirm(g) {
      const w = this.confirm, x = 200, y = 230, W = 400, Hh = 120, lines = H.Font.wrap('text', w.text, W - 40);
      this.region('confirm-block', 0, 0, H.W, H.H, null);
      g.panel(x, y, W, Hh);
      lines.slice(0, 2).forEach((s, i) => g.text(s, x + W / 2, y + 26 + i * 16, { align: 'center' }));
      this.button(g, 'c-yes', 'Да', x + 70, y + Hh - 40, 110, 26, () => {
        const f = w.yes;
        this.confirm = null;
        f();
      });
      this.button(g, 'c-no', 'Нет', x + 220, y + Hh - 40, 110, 26, () => { this.confirm = null; });
    }

    drawTip(g, lines) {
      const list = lines.filter(Boolean), w = Math.max(...list.map(s => g.measure(s, { size: 10 }))) + 20, hh = list.length * 14 + 10;
      const x = H.clamp(this.mouse[0] + 14, 4, H.W - w - 4), y = H.clamp(this.mouse[1] + 14, 4, H.H - hh - 4);
      g.panel(x, y, w, hh, 'tip');
      list.forEach((s, i) => g.text(s, x + 10, y + 11 + i * 14, { size: i ? 10 : 11, bold: !i }));
    }
  }
  Object.assign(HeroView.prototype, H.Regions, H.ArmyCells);

  class LevelView {
    constructor(ui, parent, hero) {
      this.ui = ui;
      this.parent = parent;
      this.S = parent.S;
      this.h = hero;
      this.time = 0;
      this.mouse = [0, 0];
      this.regions = [];
      this.hot = null;
      this.up = HE.nextUp(this.S, hero);
    }

    update(dt) {
      this.time += dt;
    }

    back() {
      return true;
    }

    key() {}

    pointer(type, x, y, btn) {
      this.mouse = [x, y];
      const r = this.regionAt(x, y);
      this.hot = r && r.act && !r.off ? r.id : null;
      this.ui.gfx.cursor(this.hot ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r && r.act && !r.off) r.act();
    }

    next() {
      if (this.h.up) return;
      HE.learnScrolls(this.h);
      if (HE.levelPending(this.h)) this.up = HE.nextUp(this.S, this.h);
      else this.ui.show(this.parent);
    }

    card(g, key, x, y, w, Hh, icon, title, lines, act) {
      const c = g.ctx, hot = this.hot === key;
      c.fillStyle = hot ? '#22336e' : '#0a1024';
      c.fillRect(x, y, w, Hh);
      c.strokeStyle = hot ? '#ffe060' : '#c8a050';
      c.lineWidth = hot ? 2 : 1;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, Hh - 1);
      c.lineWidth = 1;
      icon(x + w / 2 - 20, y + 10);
      g.text(title, x + w / 2, y + 66, { align: 'center', bold: true });
      lines.flatMap(s => H.Font.wrap('small', s, w - 16)).slice(0, 4).forEach((s, i) => g.text(s, x + w / 2, y + 84 + i * 13, { align: 'center', size: 10 }));
      this.region(key, x, y, w, Hh, act);
    }

    draw(g) {
      this.parent.draw(g);
      this.regions = [];
      const c = g.ctx, h = this.h, up = h.up, X = 150, Y = 110, W = 500, Hh = 340;
      c.fillStyle = 'rgba(5,7,15,0.55)';
      c.fillRect(0, 0, H.W, H.H);
      this.region('block', 0, 0, H.W, H.H, null);
      g.panel(X, Y, W, Hh);
      A.drawPortrait(g, h, X + 16, Y + 16, 64);
      g.text('Новый уровень', X + 92, Y + 26, { serif: true });
      if (!up) return;
      g.text(h.name + ': уровень ' + up.level, X + 92, Y + 50, { bold: true });
      g.text(STAT_NAMES[up.stat] + ' +1', X + 92, Y + 68, { color: '#a0ffa0' });
      const cards = [X + 24, X + 256], cw = 220, ch = 160, cy = Y + 96, after = () => this.next();
      if (up.step === 'card') {
        g.text('Выберите навык', X + W / 2, Y + 86, { align: 'center', color: '#c8b88a', size: 10 });
        up.cards.forEach((k, i) => {
          const sk = H.SKILLS[k.skill];
          this.card(g, 'c' + i, cards[i], cy, cw, ch, (ix, iy) => skillIcon(g, k.skill, ix, iy, 40), sk.name + (k.rank > 1 ? ': ступень ' + k.rank : ''), [sk.ranks[k.rank - 1]], () => {
            HE.pickCard(h, i);
            after();
          });
        });
      } else if (up.step === 'perk') {
        g.text('Мастер. Приём выбирается навсегда', X + W / 2, Y + 86, { align: 'center', color: '#ffc080', size: 10 });
        up.perks.forEach((id, i) => {
          const p = H.PERKS[id];
          this.card(g, 'p' + i, cards[i], cy, cw, ch, (ix, iy) => perkIcon(g, id, ix, iy, 40), p.name, [p.about], () => {
            HE.pickPerk(h, i);
            after();
          });
        });
      } else if (up.step === 'talent') {
        g.text('Дар: ' + H.FACTIONS[h.faction].gift.name + '. Выбор навсегда', X + W / 2, Y + 86, { align: 'center', color: '#ffc080', size: 10 });
        up.talents.forEach((id, i) => {
          const t = H.TALENTS[id];
          this.card(g, 't' + i, cards[i], cy, cw, ch, (ix, iy) => talentIcon(g, id, ix, iy, 40), t.name, [t.about], () => {
            HE.pickTalent(h, i);
            after();
          });
        });
      } else {
        g.text('Все навыки изучены', X + W / 2, Y + 160, { align: 'center' });
        this.button(g, 'up-ok', 'Дальше', X + W / 2 - 60, cy + 100, 120, 26, () => {
          HE.closeUp(h);
          after();
        });
      }
      const hi = HE.highState(h);
      if (!hi.open) {
        const text = 'Высший дар «' + hi.name + '»: с ' + HR.highLevel + ' уровня' + (hi.missing.length ? ', нужен мастер: ' + hi.missing.join(', ') : '');
        H.Font.wrap('small', text, W - 40).slice(0, 2).forEach((s, i) => g.text(s, X + W / 2, Y + Hh - 62 + i * 13, { align: 'center', size: 10, color: '#a89870' }));
      }
      if (up.step === 'card') g.text('Окно ждёт выбора', X + W / 2, Y + Hh - 24, { align: 'center', size: 10, color: '#a89870' });
    }
  }
  Object.assign(LevelView.prototype, H.Regions);

  class ExchangeView {
    constructor(ui, parent, a, b, o) {
      this.ui = ui;
      this.parent = parent;
      this.S = parent.S;
      this.a = a;
      this.b = b;
      this.allied = !!(o && o.allied);
      this.mouse = [0, 0];
      this.regions = [];
      this.toasts = [];
      this.hot = null;
      this.carry = null;
      this.artCarry = null;
      this.split = null;
      this.drag = null;
    }

    update(dt) {
      for (const t of this.toasts) t.t += dt;
      this.toasts = this.toasts.filter(t => t.t < 3);
    }

    toast(text, color) {
      this.toasts.push({ text, color: color || '#f0e2b8', t: 0 });
    }

    back() {
      if (this.split) this.split = null;
      else if (this.carry || this.artCarry) {
        this.carry = null;
        this.artCarry = null;
      } else this.ui.show(this.parent);
      return true;
    }

    key() {}

    armyMove(k, t, n) {
      if (k.army !== t.army && this.locked(k.army === this.a.army ? this.a : this.b)) {
        this.toast('Союзник под рукой ИИ своё войско не отдаёт', '#ff9080');
        return true;
      }
      const ok = HE.moveStack(k.army, k.slot, t.army, t.slot, { n, keep: true });
      if (ok) this.S.ver++;
      return ok;
    }

    locked(h) {
      return this.allied && !this.S.players[h.owner].human;
    }

    pointer(type, x, y, btn) {
      this.mouse = [x, y];
      if (type === 'move' && this.drag) {
        this.drag(x, y);
        return;
      }
      if (type === 'up') {
        this.drag = null;
        this.down = null;
        if (btn === 0) {
          this.cellUp(x, y);
          this.artUp(x, y);
        }
        return;
      }
      const r = this.regionAt(x, y);
      this.hot = r && !r.off && r.act ? r.id : null;
      this.tipOf = r && r.info && !this.carry && !this.artCarry ? r.info : null;
      this.ui.gfx.cursor(this.hot ? 'hand' : 'arrow');
      if (type !== 'down') return;
      if (btn === 2) {
        if (r && r.right && !this.split) r.right();
        return;
      }
      if (btn !== 0 || !r || r.off || !r.act) return;
      this.down = r.id;
      r.act(x, y);
      if (r.drag) this.drag = r.drag;
    }

    artDown(hero, ref) {
      if (this.artCarry) this.artDrop(hero, ref);
      else if (HE.artAt(hero, ref)) this.artCarry = { hero, ref, fresh: true };
    }

    artUp(x, y) {
      const k = this.artCarry;
      if (!k) return;
      const r = this.regionAt(x, y), t = r && r.artRef;
      if (!t || (t.hero === k.hero && t.ref.slot === k.ref.slot && t.ref.bag === k.ref.bag)) {
        k.fresh = false;
        return;
      }
      if (k.fresh) this.artDrop(t.hero, t.ref);
    }

    artDrop(hero, ref) {
      const k = this.artCarry;
      this.artCarry = null;
      if (k.hero === hero && k.ref.slot === ref.slot && k.ref.bag === ref.bag) return;
      if (!HE.moveArt(k.hero, k.ref, hero, ref)) this.toast('Сюда эта вещь не подходит', '#ff9080');
      this.read();
      this.S.ver++;
    }

    read() {
      for (const h of [this.a, this.b]) for (const id of HE.learnScrolls(h)) this.toast(h.name + ': выучено ' + H.SPELLS[id].name, '#a0e0ff');
    }

    side(g, h, other, x, y) {
      const c = g.ctx, army = h.army;
      A.drawPortrait(g, h, x, y, 64);
      g.text(h.name, x + 74, y + 12, { bold: true });
      g.text(H.CLASSES[h.cls].name + ', уровень ' + h.level, x + 74, y + 28, { size: 10, color: '#c8b88a' });
      g.text('Натиск ' + HE.stat(h, 'atk') + ', Стойкость ' + HE.stat(h, 'def') + ', Чары ' + HE.stat(h, 'power') + ', Мудрость ' + HE.stat(h, 'wis'), x + 74, y + 44, { size: 10 });
      g.text('Войско', x, y + 78, { bold: true });
      this.armyCells(g, 'h' + h.id, army, x, y + 88, 44, 48, { hero: h });
      if (this.allied) {
        g.text(H.PLAYER_NAMES[this.S.players[h.owner].color] + ' игрок', x, y + 156, { bold: true, color: H.PLAYER_COLORS[this.S.players[h.owner].color] });
        H.Font.wrap('text', this.locked(h) ? 'Союзник под рукой ИИ принимает отряды, но своих не отдаёт.' : 'Союзники отдают друг другу отряды. Вещи остаются у своих героев.', 300).forEach((t, i) => g.text(t, x, y + 176 + i * 15, { size: 10, color: '#c8b88a' }));
        if (!this.locked(h)) {
          this.button(g, 'give-a' + h.id, 'Отдать всё войско', x, y + 342, 164, 24, () => {
            if (HE.giveArmy(h.army, other.army)) this.S.ver++;
          });
        }
        return;
      }
      g.text('Вещи', x, y + 146, { bold: true });
      H.ART_SLOTS.forEach(([slot, label], i) => {
        const cx = x + (i % 5) * 42, cy = y + 156 + Math.floor(i / 5) * 42, id = h.arts[slot];
        c.fillStyle = '#0a1024';
        c.fillRect(cx, cy, 38, 38);
        c.strokeStyle = this.artCarry && this.artCarry.hero === h && this.artCarry.ref.slot === slot ? '#ffe060' : '#6a5430';
        c.strokeRect(cx + 0.5, cy + 0.5, 37, 37);
        if (id) A.drawArtifact(c, id, cx + 2, cy + 2, 34);
        this.region('as-' + h.id + slot, cx, cy, 38, 38, () => this.artDown(h, { slot }), { artRef: { hero: h, ref: { slot } }, info: () => (id ? [H.ARTIFACTS[id].name, H.ARTIFACTS[id].about] : [label, 'Пусто']) });
      });
      g.text('Сумка', x, y + 250, { bold: true });
      for (let i = 0; i < HR.maxBag; i++) {
        const cx = x + (i % 10) * 25, cy = y + 260 + Math.floor(i / 10) * 25, id = h.bag[i];
        c.fillStyle = '#0a1024';
        c.fillRect(cx, cy, 23, 23);
        c.strokeStyle = this.artCarry && this.artCarry.hero === h && this.artCarry.ref.bag === i ? '#ffe060' : '#4a3a20';
        c.strokeRect(cx + 0.5, cy + 0.5, 22, 22);
        if (id) A.drawArtifact(c, id, cx + 1, cy + 1, 21);
        this.region('ab-' + h.id + '-' + i, cx, cy, 23, 23, () => this.artDown(h, { bag: i }), { artRef: { hero: h, ref: { bag: i } }, info: id ? () => [H.ARTIFACTS[id].name, H.ARTIFACTS[id].about] : null });
      }
      this.button(g, 'give-a' + h.id, 'Отдать всё войско', x, y + 342, 164, 24, () => {
        if (HE.giveArmy(h.army, other.army)) this.S.ver++;
      });
      this.button(g, 'give-b' + h.id, 'Отдать все вещи', x + 172, y + 342, 164, 24, () => {
        if (HE.giveArts(h, other)) this.S.ver++;
        this.read();
      });
    }

    draw(g) {
      this.parent.draw(g);
      this.regions = [];
      const c = g.ctx;
      c.fillStyle = 'rgba(5,7,15,0.55)';
      c.fillRect(0, 0, H.W, H.H);
      this.region('block', 0, 0, H.W, H.H, null);
      g.panel(20, 60, 760, 470);
      g.text(this.allied ? 'Встреча союзников' : 'Встреча героев', H.W / 2, 84, { align: 'center', serif: true });
      this.side(g, this.a, this.b, 40, 104);
      this.side(g, this.b, this.a, 424, 104);
      c.fillStyle = '#6a5430';
      c.fillRect(399, 104, 2, 370);
      this.button(g, 'x-close', 'Закрыть', H.W / 2 - 60, 492, 120, 26, () => this.ui.show(this.parent));
      if (this.split) this.drawSplit(g);
      this.toasts.forEach((t, i) => g.text(t.text, H.W / 2, 18 + i * 16, { align: 'center', bold: true, color: t.color }));
      if (this.tipOf && !this.split) HeroView.prototype.drawTip.call(this, g, this.tipOf());
      this.drawCarry(g);
      if (this.artCarry) A.drawArtifact(c, HE.artAt(this.artCarry.hero, this.artCarry.ref) || 'quilted', this.mouse[0] - 14, this.mouse[1] - 14, 28);
    }
  }
  Object.assign(ExchangeView.prototype, H.Regions, H.ArmyCells);

  const TABS = [...Object.keys(H.SCHOOLS), 'road'];
  class BookView {
    constructor(ui, parent, o) {
      this.ui = ui;
      this.parent = parent;
      this.o = o;
      this.mouse = [0, 0];
      this.regions = [];
      this.hot = null;
      const first = o.known.map(id => H.SPELLS[id].school).find(Boolean);
      this.tab = o.startTab || first || (o.road ? 'road' : TABS[0]);
    }

    update() {}

    key() {}

    back() {
      this.ui.show(this.parent);
      return true;
    }

    pointer(type, x, y, btn) {
      this.mouse = [x, y];
      const r = this.regionAt(x, y);
      this.hot = r && r.act && !r.off ? r.id : null;
      this.tipOf = r && r.info ? r.info : null;
      this.ui.gfx.cursor(this.hot ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r && r.act && !r.off) r.act();
    }

    list() {
      if (this.tab === 'road') return Object.values(H.SPELLS).filter(s => s.school === 'road');
      return Object.values(H.SPELLS).filter(s => s.school === this.tab).sort((a, b) => a.circle - b.circle);
    }

    draw(g) {
      this.parent.draw(g);
      this.regions = [];
      const c = g.ctx, o = this.o, X = 80, Y = 80, W = 640, Hh = 440;
      c.fillStyle = 'rgba(5,7,15,0.55)';
      c.fillRect(0, 0, H.W, H.H);
      this.region('block', 0, 0, H.W, H.H, null);
      c.fillStyle = '#3a2412';
      c.fillRect(X, Y, W - 36, Hh);
      c.fillStyle = '#e4d8b4';
      c.fillRect(X + 8, Y + 8, W - 52, Hh - 16);
      c.fillStyle = '#c8b88e';
      c.fillRect(X + (W - 36) / 2 - 2, Y + 8, 4, Hh - 16);
      c.strokeStyle = '#1a1008';
      c.strokeRect(X + 0.5, Y + 0.5, W - 37, Hh - 1);
      TABS.forEach((id, i) => {
        const y = Y + 8 + i * 50, on = this.tab === id, tx = X + W - 36;
        c.fillStyle = on ? H.SPELL_COLORS[id] : '#4a3a24';
        c.fillRect(tx, y, on ? 36 : 30, 46);
        c.strokeStyle = '#1a1008';
        c.strokeRect(tx + 0.5, y + 0.5, (on ? 36 : 30) - 1, 45);
        g.text((H.SCHOOLS[id] || 'Путь').slice(0, 3), tx + 15, y + 23, { align: 'center', size: 10, bold: true, color: '#ffffff' });
        this.region('tab-' + id, tx, y, 36, 46, () => { this.tab = id; }, { info: () => [H.SCHOOLS[id] || 'Дорожные заклинания'] });
      });
      const title = this.tab === 'road' ? 'Дорожные заклинания' : 'Школа: ' + H.SCHOOLS[this.tab];
      g.text(title, X + 20, Y + 26, { serif: true, color: '#3a2412', shadow: false });
      g.text('Мана ' + o.hero.mana + ', Чары ' + o.hero.power + (this.tab !== 'road' ? ', ступень ' + (H.Battle.schoolRank(o.board, o.hero, { school: this.tab })) : ''), X + W - 56, Y + 26, { align: 'right', size: 10, color: '#3a2412', shadow: false });
      this.list().forEach((sp, i) => {
        const page = i < 6 ? 0 : 1, k = i < 6 ? i : i - 6, x = X + 22 + page * 298 + (k % 2) * 136, y = Y + 48 + Math.floor(k / 2) * 126;
        this.cell(g, sp, x, y);
      });
      this.button(g, 'b-close', 'Закрыть', X + W - 150, Y + Hh - 40, 100, 26, () => this.back());
      if (this.tipOf) HeroView.prototype.drawTip.call(this, g, this.tipOf());
    }

    cell(g, sp, x, y) {
      const o = this.o, road = sp.school === 'road', known = road ? o.road && o.road.includes(sp.id) : o.known.includes(sp.id), BA = H.Battle;
      const block = !known ? (road ? 'С ' + sp.level + ' уровня' : 'Не изучено') : o.block ? o.block(sp.id) : '';
      const pickable = known && !block && !!o.pick, cost = BA.spellCost(o.board, o.hero, sp);
      if (this.hot === 'sp-' + sp.id) {
        g.ctx.fillStyle = 'rgba(120,90,30,0.25)';
        g.ctx.fillRect(x - 2, y - 2, 132, 122);
      }
      A.drawSpell(g, sp.id, x + 40, y, 48, !known);
      H.Font.wrap('small', sp.name, 128).slice(0, 2).forEach((s, i) => g.text(s, x + 64, y + 58 + i * 12, { align: 'center', size: 10, bold: true, color: known ? '#2a1a08' : '#8a7a5a', shadow: false }));
      g.text((road ? 'Уровень ' + sp.level + ', мана ' : 'Круг ' + sp.circle + ', мана ') + cost, x + 64, y + 86, { align: 'center', size: 10, color: known ? '#5a3a18' : '#8a7a5a', shadow: false });
      if (known && block) g.text(block, x + 64, y + 100, { align: 'center', size: 10, color: '#a03020', shadow: false });
      this.region('sp-' + sp.id, x - 2, y - 2, 132, 122, pickable ? () => o.pick(sp.id) : null, { info: () => [sp.name, ...H.Font.wrap('small', sp.about, 260), ...BA.spellFacts(o.board, o.hero, sp), ...(block ? [block] : [])] });
    }
  }
  Object.assign(BookView.prototype, H.Regions);

  H.BookView = BookView;
  H.HeroView = HeroView;
  H.LevelView = LevelView;
  H.ExchangeView = ExchangeView;
  H.HeroIcons = { skillIcon, perkIcon, talentIcon, starMarks };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
