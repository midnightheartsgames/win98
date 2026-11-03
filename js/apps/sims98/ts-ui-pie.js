(function (S) {
  'use strict';
  const PILL_H = 22, KNOB = 16, PAD = 10, RX = 84, RY = 66, FIRST_LEVEL = 6, TIP_DELAY = 400, TITLE_H = 20, SUB_H = 14, EDGE = 6;
  const DOTS = { green: '#5fe05a', gold: '#f0c838', red: '#f05a48' }, TITLE_GAP = 10;

  class PieView {
    constructor(ui) {
      this.ui = ui;
      this.open = false;
      this.target = null;
      this.first = false;
      this.all = [];
      this.page = 0;
      this.pills = [];
      this.title = '';
      this.cx = 0;
      this.cy = 0;
      this.hover = -1;
      this.hoverAt = 0;
      this.stack = [];
    }

    show(sx, sy, target, first) {
      const ui = this.ui, world = ui.scene.world;
      this.target = target;
      this.first = !!first;
      this.title = target.title;
      this.sub = target.sub || '';
      this.all = S.Acts.menu(world, ui.selected, target);
      this.stack = [];
      this.page = 0;
      this.anchorX = sx;
      this.anchorY = sy;
      this.open = true;
      this.hover = -1;
      this.place();
      ui.stamp = '';
    }

    hide() {
      this.open = false;
      this.ui.stamp = '';
    }

    pageInfo() {
      const back = this.stack.length ? this.all[0] : null;
      return { head: back ? [back] : [], items: back ? this.all.slice(1) : this.all, per: back ? FIRST_LEVEL - 1 : FIRST_LEVEL };
    }

    pageOptions() {
      const { head, items, per } = this.pageInfo();
      if (items.length <= per) return head.concat(items);
      const start = this.page * per, list = head.concat(items.slice(start, start + per));
      list.push(start + per < items.length ? { label: 'Ещё…', more: true } : { label: 'В начало', more: true });
      return list;
    }

    place() {
      const v = this.ui.screen, options = this.pageOptions(), n = options.length, pills = [], Font = S.Font;
      const titleWide = Math.max(Font.measure('bold', this.title), this.sub ? Font.measure('small', this.sub) : 0) + PAD * 2, rx = Math.max(RX, titleWide / 2 + TITLE_GAP);
      options.forEach((option, i) => {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / Math.max(n, 1), ax = Math.cos(angle) * rx, ay = Math.sin(angle) * RY;
        const w = Font.measure('bold', option.label) + PAD * 2 + KNOB, side = Math.abs(ax) < 16 ? 0 : ax > 0 ? 1 : -1;
        const x = side === 0 ? ax - w / 2 : side > 0 ? ax : ax - w, y = ay - PILL_H / 2;
        pills.push({ option, x, y, w, h: PILL_H, side });
      });
      const titleW = Math.max(Font.measure('bold', this.title), this.sub ? Font.measure('small', this.sub) : 0) + PAD * 2, titleH = TITLE_H + (this.sub ? SUB_H : 0);
      let minX = -titleW / 2, maxX = titleW / 2, minY = -titleH / 2, maxY = titleH / 2;
      for (const pill of pills) {
        minX = Math.min(minX, pill.x);
        maxX = Math.max(maxX, pill.x + pill.w);
        minY = Math.min(minY, pill.y);
        maxY = Math.max(maxY, pill.y + pill.h);
      }
      this.cx = Math.round(S.clamp(this.anchorX, EDGE - minX, Math.max(EDGE - minX, v.sw - EDGE - maxX)));
      this.cy = Math.round(S.clamp(this.anchorY, EDGE - minY, Math.max(EDGE - minY, v.sh - EDGE - maxY)));
      this.titleW = titleW;
      this.titleH = titleH;
      this.pills = pills.map(pill => Object.assign(pill, { x: Math.round(pill.x + this.cx), y: Math.round(pill.y + this.cy) }));
    }

    at(x, y) {
      for (let i = 0; i < this.pills.length; i++) {
        const pill = this.pills[i];
        if (x >= pill.x && y >= pill.y && x < pill.x + pill.w && y < pill.y + pill.h) return i;
      }
      return -1;
    }

    move(x, y, now) {
      const i = this.at(x, y);
      if (i !== this.hover) {
        this.hover = i;
        this.hoverAt = now;
      }
    }

    choose(i) {
      const pill = this.pills[i];
      if (!pill) return false;
      const option = pill.option;
      if (option.closed) {
        this.ui.toast(option.closed, true);
        return false;
      }
      if (option.more) {
        const { items, per } = this.pageInfo();
        this.page = (this.page + 1) * per < items.length ? this.page + 1 : 0;
        this.hover = -1;
        this.place();
        this.ui.stamp = '';
        return true;
      }
      if (option.section) {
        this.stack.push([this.all, this.page]);
        this.all = [{ label: 'Назад', back: true }].concat(option.section);
        this.page = 0;
        this.hover = -1;
        this.place();
        this.ui.stamp = '';
        return true;
      }
      if (option.back) {
        [this.all, this.page] = this.stack.pop() || [this.all, 0];
        this.hover = -1;
        this.place();
        this.ui.stamp = '';
        return true;
      }
      this.hide();
      this.ui.pieChoice(option, this.first);
      return true;
    }

    click(x, y, button) {
      if (button !== 0) {
        this.hide();
        return;
      }
      const i = this.at(x, y);
      if (i < 0) {
        this.hide();
        return;
      }
      this.choose(i);
    }

    key() {
      return [this.open, this.page, this.stack.length, this.all.length, this.hover, this.hover >= 0 && performance.now() - this.hoverAt > TIP_DELAY].join();
    }

    draw(g) {
      const Kit = S.Kit, Font = S.Font;
      const top = this.cy - this.titleH / 2;
      Kit.glass(g, this.cx - this.titleW / 2, top, this.titleW, this.titleH, 'white', 8);
      Font.draw(g, 'bold', this.title, this.cx - Font.measure('bold', this.title) / 2, top + 3, '#102a66');
      if (this.sub) Font.draw(g, 'small', this.sub, this.cx - Font.measure('small', this.sub) / 2, top + TITLE_H - 2, '#2a4fa8');
      this.pills.forEach((pill, i) => {
        const closed = !!pill.option.closed, on = i === this.hover, look = closed ? 'off' : on ? 'hover' : 'normal', knobX = pill.side < 0 ? pill.x + pill.w - KNOB / 2 - 3 : pill.x + KNOB / 2 + 3, textX = pill.side < 0 ? pill.x + PAD : pill.x + KNOB + PAD - 2;
        Kit.plate(g, pill.x, pill.y, pill.w, pill.h, look, 10);
        Kit.bubble(g, knobX, pill.y + pill.h / 2, KNOB, closed ? 'off' : on ? 'on' : 'hover');
        Font.shadowed(g, 'bold', pill.option.label, textX, pill.y + 4, closed ? '#dde3ee' : '#fff', closed ? '#5a6478' : '#12306e');
        if (pill.option.dot) {
          g.fillStyle = '#12306e';
          g.fillRect(knobX - 3, pill.y + pill.h / 2 - 3, 6, 6);
          g.fillStyle = DOTS[pill.option.dot];
          g.fillRect(knobX - 2, pill.y + pill.h / 2 - 2, 4, 4);
        }
      });
      if (this.hover >= 0 && performance.now() - this.hoverAt > TIP_DELAY) {
        const pill = this.pills[this.hover], option = pill.option;
        if (option.closed) Kit.drawTip(g, this.ui.screen.sw, this.ui.screen.sh, pill.x + pill.w / 2, pill.y, { title: option.label, text: option.closed });
        else if (option.tip) Kit.drawTip(g, this.ui.screen.sw, this.ui.screen.sh, pill.x + pill.w / 2, pill.y, option.tip);
      }
    }
  }

  S.PieView = PieView;
})(globalThis.Sims98 = globalThis.Sims98 || {});
