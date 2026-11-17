(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const SHOW_FOES = ['reaver', 'eliminator', 'flamespawn'];
  const ROW_H = 26;
  const LIST = { y: 50, h: 384, w: 206 };
  const RAR_COL = { 4: '#cfa2ff', 5: '#ffd45a' };
  const KINDS = [
    { id: 'ult', label: 'Абсолютная техника', icon: 'chars', has: kit => !!(H.Ults && H.Ults.SHOWS[kit]) },
    { id: 'warp', label: 'Появление в Прыжке', icon: 'warp', has: kit => !!(H.WarpIntro && H.WarpIntro.SHOWS[kit]) },
    { id: 'eid', label: 'Картина эйдолонов', icon: 'archive', has: kit => !!(H.Eidolons && H.Eidolons.has(kit)) }
  ];

  function heroName(g, key) {
    return key.startsWith('trail') ? g.state.name : H.CHARS[g.kitOf(key)].name;
  }

  function showUnit(g, key) {
    const kitId = g.kitOf(key), kit = H.CHARS[kitId];
    return { side: 'ally', id: kitId, charId: kitId, kit, name: heroName(g, key), elem: kit.elem, path: kit.path };
  }

  function showFoes(target) {
    if (target === 'allies' || target === 'self' || target === 'ally') return [];
    const s = 104, x0 = W / 2 + 34 - SHOW_FOES.length * s * 0.4;
    const list = SHOW_FOES.map((e, i) => ({ u: { data: H.ENEMIES[e] }, x: (x0 + s * 0.4 + i * s * 0.8) / 2, y: 145, s: s / 2 }));
    return target === 'single' ? list.slice(1, 2) : list;
  }

  function makeShow(ui, kind, key) {
    const g = ui.game, kitId = g.kitOf(key), kit = H.CHARS[kitId], u = showUnit(g, key);
    if (kind === 'warp') {
      const show = new H.WarpShow(ui, [{ kind: 'char', id: kitId, pick: kitId, rar: kit.rarity, name: kit.name, res: 'new' }], { ban: 'ev' });
      show.begin([0]);
      return show;
    }
    const mates = g.state.party.filter(k => k !== key && g.state.roster[k]).slice(0, 3).map(k => showUnit(g, k));
    const allies = kit.ult.target === 'self' ? [u] : [u].concat(mates);
    return new H.Ults.Show(ui, u, { foes: showFoes(kit.ult.target), allies, bg: 'station' });
  }

  Object.assign(H.UI.prototype, {
    cinemaHeroes() {
      const g = this.game, order = Object.keys(H.CHARS);
      return Object.keys(g.state.roster)
        .filter(k => H.CHARS[g.kitOf(k)] && KINDS.some(kd => kd.has(g.kitOf(k))))
        .sort((a, b) => order.indexOf(g.kitOf(a)) - order.indexOf(g.kitOf(b)));
    },

    openCinema() {
      const ui = this, g = this.game;
      const heroes = () => ui.cinemaHeroes();
      const kindsOf = key => KINDS.filter(kd => kd.has(g.kitOf(key)));
      return this.push({
        full: true, pause: true, sel: 0, kind: 0, top: 0,
        hero() { return heroes()[this.sel]; },
        pickHero(i) { if (i === this.sel) return; this.sel = i; this.kind = 0; ui.sfx('select'); },
        scroll(d) {
          const n = heroes().length, rows = Math.floor(LIST.h / ROW_H);
          this.top = Math.max(0, Math.min(Math.max(0, n - rows), this.top + d));
        },
        play() {
          const key = this.hero(), kd = key && kindsOf(key)[this.kind];
          if (!kd) { ui.sfx('deny'); return; }
          if (kd.id === 'eid') ui.openCinemaPicture(key);
          else ui.openCinemaShow(makeShow(ui, kd.id, key), kd.id);
        },
        draw(c) {
          const list = heroes(), rows = Math.floor(LIST.h / ROW_H), lx = ui.left + 12;
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(4,6,20,0.55)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          G.menuIcon(c, 'archive', lx, 10, 24, C.brassHi);
          ui.text('Кинозал Экспресса', lx + 32, 12, { size: 15, bold: true, serif: true, col: C.gold });
          ui.text('Ролики и картины героев, которые путешествуют с вами', lx + 32, 31, { size: 10, col: C.sub });
          ui.closeBtn(ui.right - 32, 10, () => this.key('back'));
          if (!list.length) {
            ui.text('Пока здесь пусто. Ролики героя появятся, когда он присоединится к вам.', W / 2, 220, { align: 'center', size: 12, col: C.sub });
            ui.hints([['Esc', 'Назад']], lx, HGT - 18);
            return;
          }
          this.sel = Math.min(this.sel, list.length - 1);
          if (this.sel < this.top) this.top = this.sel;
          if (this.sel >= this.top + rows) this.top = this.sel - rows + 1;
          ui.win(lx, LIST.y, LIST.w, LIST.h + 8, { alpha: 0.88 });
          list.slice(this.top, this.top + rows).forEach((key, j) => {
            const i = this.top + j, y = LIST.y + 4 + j * ROW_H, on = i === this.sel, kit = H.CHARS[g.kitOf(key)];
            if (on) { c.fillStyle = 'rgba(242,220,154,0.18)'; c.fillRect(lx + 4, y, LIST.w - 8, ROW_H - 2); c.fillStyle = C.brassHi; c.fillRect(lx + 4, y, 2, ROW_H - 2); }
            G.drawPortrait(c, G.lookOf(key, g), lx + 10, y + 2, 20);
            ui.text(ui.clip(heroName(g, key), LIST.w - 70, 11, on), lx + 36, y + 6, { size: 11, bold: on, col: on ? C.gold : C.cream });
            ui.text(kindsOf(key).length + '', lx + LIST.w - 14, y + 6, { size: 10, align: 'right', col: RAR_COL[kit.rarity] || C.sub });
            ui.hit(lx + 4, y, LIST.w - 8, ROW_H - 2, () => { if (i === this.sel) this.play(); else this.pickHero(i); });
          });
          if (this.top > 0) ui.diamond(lx + LIST.w / 2, LIST.y + 2, 3, C.brassHi);
          if (this.top + rows < list.length) ui.diamond(lx + LIST.w / 2, LIST.y + LIST.h + 6, 3, C.brassHi);
          ui.wheels.push({ x: lx, y: LIST.y, w: LIST.w, h: LIST.h, fn: d => this.scroll(d) });
          const key = this.hero(), kit = H.CHARS[g.kitOf(key)], kinds = kindsOf(key), r = g.state.roster[key];
          const px = lx + LIST.w + 16, pw = ui.right - 12 - px, cx = px + 90;
          c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(cx, 404, 64, 11, 0, 0, Math.PI * 2); c.fill();
          G.drawFigure(c, G.lookOf(key, g), cx, 408, 3);
          const bx = px + 190, bw = pw - 190;
          ui.text(heroName(g, key), bx, 70, { size: 18, bold: true, serif: true, col: RAR_COL[kit.rarity] || C.cream });
          ui.text(H.PATHS[kit.path].name + ' · ' + H.ELEMENTS[kit.elem].name, bx, 94, { size: 10, col: C.sub });
          ui.text('Эйдолоны: ' + (r.eid || 0) + ' из 6', bx, 108, { size: 10, col: C.sub });
          this.kind = Math.min(this.kind, kinds.length - 1);
          kinds.forEach((kd, i) => {
            const y = 128 + i * 40;
            ui.button(bx, y, bw, 30, kd.label, () => { this.kind = i; this.play(); }, { active: i === this.kind, icon: kd.icon, size: 12, bold: i === this.kind });
          });
          const note = kinds[this.kind] && kinds[this.kind].id === 'eid' ? 'Картина собрана настолько, сколько эйдолонов у героя сейчас.' : 'Просмотр не тратит ресурсы и не меняет сохранение.';
          ui.wrap(note, bw, 10).forEach((l, i) => ui.text(l, bx, 134 + kinds.length * 40 + i * 13, { size: 10, col: C.dim }));
          ui.hints([['↑↓', 'Герой'], ['←→', 'Ролик'], ['Enter', 'Смотреть'], ['Esc', 'Назад']], lx, HGT - 18);
        },
        key(k) {
          const n = heroes().length;
          if (k === 'back') { ui.pop(); return; }
          if (!n) return;
          if (ui.listNav(this, k, n)) { this.kind = 0; return; }
          const kinds = kindsOf(this.hero()).length;
          if ((k === 'left' || k === 'right') && kinds > 1) { this.kind = (this.kind + (k === 'left' ? kinds - 1 : 1)) % kinds; ui.sfx('select'); return; }
          if (k === 'ok') this.play();
        }
      });
    },

    openCinemaShow(show, kind) {
      const ui = this;
      const end = () => { if (show.done && ui.top() === s) { ui.screens.pop(); ui.audio.stopSong(); } };
      const s = this.push({
        full: true,
        tick(dt) { show.tick(dt); end(); },
        draw(c) { show.draw(c); },
        key(k, code) {
          if (kind === 'warp' && (code === 'Enter' || code === 'NumpadEnter' || k === 'ok') && show.enter) show.enter();
          else show.skip();
          end();
        }
      });
      return s;
    },

    openCinemaPicture(key) {
      const ui = this, g = this.game, E = H.Eidolons, kitId = g.kitOf(key), stage = (g.state.roster[key] || {}).eid || 0;
      return this.push({
        full: true,
        draw(c) {
          const V = E.scene(ui, c, kitId, stage, null, null), sc = E.sceneOf(kitId);
          const tr = s => (H.isEn && H.isEn() && H.tr ? H.tr(s) : s), cap = tr(heroName(g, key)) + ' · ' + tr(sc.title), sub = 'Открыто частей: ' + V.shown + ' из 6';
          const w = Math.max(280, Math.round(Math.max(ui.measure(cap, 13, true, true), ui.measure(sub, 10)) + 40)), x = Math.round(W / 2 - w / 2), y = HGT - 54;
          ui.win(x, y, w, 40, { alpha: 0.82 });
          ui.text(cap, W / 2, y + 7, { align: 'center', size: 13, bold: true, serif: true, col: C.gold });
          ui.text(sub, W / 2, y + 24, { align: 'center', size: 10, col: C.sub });
          ui.hints([['Esc', 'Назад']], ui.right - 12, 12, { align: 'right' });
          ui.hit(ui.left, 0, ui.vw, HGT, () => ui.pop());
        },
        key(k) { if (k === 'back' || k === 'ok') ui.pop(); }
      });
    }
  });

  H.CINEMA_KINDS = KINDS;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
