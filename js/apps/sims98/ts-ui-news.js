(function (S) {
  'use strict';
  const Kit = S.Kit, Font = S.Font, Icons = S.Icons;
  const W = 640, H = 430, COL_GAP = 14, NEWSPRINT = '#ece4cf', SHADE = '#d9cfb3', INK = '#1d1a14', SOFT = '#5d5543', RULE = '#3b352a', HOT = 'rgba(120,90,30,0.14)';
  const fit = (font, options, w) => options.find(s => Font.measure(font, s) <= w) || options[options.length - 1];
  const ITEM_H = 34, MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  class NewsView {
    constructor(ui) {
      this.ui = ui;
      this.open = false;
      this.day = 0;
    }

    show() {
      this.open = true;
      this.day = this.ui.scene.world.day;
      this.ui.stamp = '';
    }

    toggle() {
      if (this.open) {
        this.open = false;
        this.ui.stamp = '';
      } else this.show();
    }

    box() {
      const v = this.ui.screen;
      return { x: Math.round((v.sw - W) / 2), y: Math.max(6, Math.round((v.sh - H) / 2) - 50), w: W, h: H };
    }

    paper() {
      return S.News.paper(this.ui.scene.world, this.day);
    }

    columns() {
      const b = this.box(), cw = (b.w - 32 - COL_GAP * 2) / 3;
      return [0, 1, 2].map(i => ({ x: b.x + 16 + i * (cw + COL_GAP), w: cw }));
    }

    targets() {
      const b = this.box(), [, mid] = this.columns(), top = b.y + 96, out = [];
      this.paper().vacancies.forEach((v, i) => out.push({ kind: 'job', id: v.job, x: mid.x, y: top + 20 + i * ITEM_H, w: mid.w, h: ITEM_H - 4 }));
      this.paper().coupons.forEach((id, i) => out.push({ kind: 'coupon', id, x: mid.x, y: top + 150 + 20 + i * ITEM_H, w: mid.w, h: ITEM_H - 4 }));
      return out;
    }

    targetAt(px, py) {
      return this.targets().find(t => px >= t.x && px < t.x + t.w && py >= t.y && py < t.y + t.h) || null;
    }

    closeAt(px, py) {
      const b = this.box();
      return px >= b.x + b.w - 30 && px < b.x + b.w - 8 && py >= b.y + 8 && py < b.y + 30;
    }

    key() {
      const p = this.ui.pointer, t = p ? this.targetAt(p.x, p.y) : null, world = this.ui.scene.world;
      return [this.open, this.day, (world.news || []).length, (world.coupons || []).map(c => c.id).join(), t ? t.kind + t.id : ''].join('|');
    }

    click(px, py, button) {
      if (button !== 0 || this.closeAt(px, py)) {
        this.toggle();
        return;
      }
      const b = this.box();
      if (px < b.x || px >= b.x + b.w || py < b.y || py >= b.y + b.h) {
        this.toggle();
        return;
      }
      const t = this.targetAt(px, py);
      if (!t) return;
      const ui = this.ui, world = ui.scene.world, sim = ui.selected;
      ui.sound.play('tick');
      if (t.kind === 'coupon') {
        S.Econ.keepCoupon(world, t.id);
        ui.toast('Купон вырезан: ' + S.Econ.COUPONS[t.id][0].toLowerCase() + ', ' + S.Econ.COUPON_DAYS + ' дня');
      } else ui.applyJob(sim, t.id);
      ui.stamp = '';
    }

    dateText(day) {
      const date = new Date(Date.UTC(1999, 4, 30 + day));
      return S.dayName(day) + ', ' + date.getUTCDate() + ' ' + MONTHS[date.getUTCMonth()] + ' 1999 года';
    }

    rule(g, x, y, w, k) {
      g.fillStyle = RULE;
      g.fillRect(x, y, w, k || 1);
    }

    draw(g) {
      const b = this.box(), world = this.ui.scene.world, paper = this.paper(), [left, mid, right] = this.columns(), p = this.ui.pointer, hover = p ? this.targetAt(p.x, p.y) : null;
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(b.x + 6, b.y + 6, b.w, b.h);
      g.fillStyle = NEWSPRINT;
      g.fillRect(b.x, b.y, b.w, b.h);
      g.fillStyle = SHADE;
      for (let y = b.y + 2; y < b.y + b.h; y += 3) g.fillRect(b.x, y, b.w, 1);
      g.fillStyle = NEWSPRINT;
      g.fillRect(b.x + 10, b.y + 10, b.w - 20, b.h - 20);
      this.rule(g, b.x + 16, b.y + 16, b.w - 32, 2);
      const title = 'ВЕСТНИК ЛАЙМ-ХАРБОРА';
      Font.draw(g, 'big', title, b.x + (b.w - Font.measure('big', title)) / 2, b.y + 22, INK);
      this.rule(g, b.x + 16, b.y + 58, b.w - 32, 1);
      Font.draw(g, 'small', this.dateText(paper.day), b.x + 18, b.y + 62, SOFT);
      const price = 'Цена §1. Выпуск ' + paper.day;
      Font.draw(g, 'small', price, b.x + b.w - 18 - Font.measure('small', price), b.y + 62, SOFT);
      this.rule(g, b.x + 16, b.y + 78, b.w - 32, 2);
      Kit.plate(g, b.x + b.w - 30, b.y + 8, 22, 22, 'normal', 6);
      Icons.centered(g, 'close', b.x + b.w - 19, b.y + 19, 'white');
      const top = b.y + 96;
      g.fillStyle = RULE;
      g.fillRect(mid.x - COL_GAP / 2, top - 6, 1, b.h - 110);
      g.fillRect(right.x - COL_GAP / 2, top - 6, 1, b.h - 110);
      this.newsColumn(g, left, top, paper);
      this.jobsColumn(g, mid, top, paper, hover);
      this.sideColumn(g, right, top, paper, world);
    }

    heading(g, col, y, text) {
      Font.draw(g, 'bold', text, col.x, y, INK);
      this.rule(g, col.x, y + 15, col.w, 1);
    }

    para(g, font, text, x, y, w, color, limit) {
      const lines = Font.wrap(font, text, w).slice(0, limit || 99);
      lines.forEach((line, i) => Font.draw(g, font, line, x, y + i * 13, color));
      return y + lines.length * 13;
    }

    newsColumn(g, col, top, paper) {
      this.heading(g, col, top, 'Новости');
      let y = top + 22;
      if (!paper.news.length) {
        this.para(g, 'small', 'В городе тихо. Редакция ждёт ваших новостей.', col.x, y, col.w, SOFT);
        return;
      }
      paper.news.forEach((n, i) => {
        if (y > top + 300) return;
        y = this.para(g, i ? 'small' : 'smallb', n.text, col.x, y, col.w, INK, i ? 4 : 5) + 6;
      });
    }

    jobsColumn(g, col, top, paper, hover) {
      this.heading(g, col, top, 'Требуются');
      paper.vacancies.forEach((v, i) => {
        const y = top + 20 + i * ITEM_H, on = hover && hover.kind === 'job' && hover.id === v.job;
        if (on) {
          g.fillStyle = HOT;
          g.fillRect(col.x - 3, y - 1, col.w + 6, ITEM_H - 4);
        }
        const head = fit('smallb', [v.title + ' (' + v.name + ')', v.title], col.w), pay = '§' + v.pay + '/ч, ';
        Font.draw(g, 'smallb', head, col.x, y, INK);
        Font.draw(g, 'small', fit('small', head === v.title ? [v.name + ', ' + pay + v.hours, pay + v.place + ', ' + v.hours] : [pay + v.place + ', ' + v.hours, pay + v.hours], col.w), col.x, y + 13, SOFT);
      });
      const cy = top + 150;
      this.heading(g, col, cy, 'Купоны');
      paper.coupons.forEach((id, i) => {
        const y = cy + 20 + i * ITEM_H, on = hover && hover.kind === 'coupon' && hover.id === id, kept = (this.ui.scene.world.coupons || []).some(c => c.id === id);
        g.strokeStyle = RULE;
        g.setLineDash([3, 2]);
        g.strokeRect(col.x + 0.5, y - 0.5, col.w - 1, ITEM_H - 5);
        g.setLineDash([]);
        if (on) {
          g.fillStyle = HOT;
          g.fillRect(col.x + 1, y, col.w - 2, ITEM_H - 6);
        }
        this.para(g, 'small', S.Econ.COUPONS[id][0] + (kept ? ' (вырезан)' : ''), col.x + 6, y + 3, col.w - 12, kept ? SOFT : INK, 2);
      });
      Font.draw(g, 'small', 'Щелчок по объявлению или купону', col.x, cy + 96, SOFT);
    }

    sideColumn(g, col, top, paper) {
      this.heading(g, col, top, paper.review ? 'Рецензия' : 'Улыбка дня');
      let y = top + 22;
      if (paper.review) {
        y = this.para(g, 'smallb', '«' + paper.review.title + '»', col.x, y, col.w, INK, 2) + 2;
        y = this.para(g, 'small', paper.review.text, col.x, y, col.w, INK, 5) + 12;
        this.heading(g, col, y, 'Улыбка дня');
        y += 22;
      }
      this.para(g, 'small', paper.joke, col.x, y, col.w, INK, 6);
    }
  }

  S.NewsView = NewsView;
})(globalThis.Sims98 = globalThis.Sims98 || {});
