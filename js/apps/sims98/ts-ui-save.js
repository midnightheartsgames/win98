(function (S) {
  'use strict';
  const WIDTH = 520, ROW = 24, HEAD = 62, FOOT = 34, TAB_H = 28, YES_X = 136, NO_X = 70, CHOICE_W = 58;

  class SaveView {
    constructor(ui) {
      this.ui = ui;
      this.open = false;
      this.mode = 'save';
      this.rows = [];
      this.ask = -1;
      this.busy = false;
      this.message = '';
    }

    show(mode) {
      this.open = true;
      this.mode = mode;
      this.ask = -1;
      this.message = '';
      this.ui.stamp = '';
      return this.refresh();
    }

    hide() {
      this.open = false;
      this.ui.stamp = '';
    }

    async refresh() {
      try {
        this.rows = await S.Save.list(await this.ui.saveStore());
      } catch (e) {
        this.rows = [];
        this.message = 'Хранилище недоступно: ' + e.message;
      }
      this.ui.stamp = '';
    }

    box(v) {
      const h = HEAD + S.Save.SLOTS.length * ROW + FOOT;
      return { x: Math.floor((v.sw - WIDTH) / 2), y: Math.floor((v.sh - h) / 2), w: WIDTH, h };
    }

    rowAt(v, sx, sy) {
      const b = this.box(v), i = Math.floor((sy - b.y - HEAD) / ROW);
      return sx >= b.x && sx < b.x + b.w && i >= 0 && i < S.Save.SLOTS.length ? i : -1;
    }

    usable(i) {
      const row = this.rows[i];
      return this.mode === 'save' ? !S.Save.SLOTS[i].fixed : !!(row && row.record);
    }

    async run(i) {
      const slot = S.Save.SLOTS[i], saving = this.mode === 'save';
      this.busy = true;
      const done = saving ? await this.ui.saveGame(slot.key, slot.name) : await this.ui.loadGame(slot.key, slot.name);
      this.busy = false;
      if (!saving && done) {
        this.hide();
        return;
      }
      if (!done) this.message = this.ui.note ? this.ui.note.text : '';
      await this.refresh();
    }

    click(sx, sy) {
      const v = this.ui.screen, b = this.box(v);
      if (sx < b.x || sx >= b.x + b.w || sy < b.y || sy >= b.y + b.h) {
        this.hide();
        return;
      }
      if (sy < b.y + TAB_H) {
        this.mode = sx < b.x + b.w / 2 ? 'save' : 'load';
        this.ask = -1;
        this.ui.stamp = '';
        return;
      }
      const i = this.rowAt(v, sx, sy);
      if (i < 0 || this.busy) return;
      if (this.ask === i) {
        this.ask = -1;
        this.ui.stamp = '';
        const right = b.x + b.w - sx;
        if (right <= YES_X && right > YES_X - CHOICE_W) this.run(i);
        return;
      }
      this.ask = -1;
      this.ui.stamp = '';
      if (!this.usable(i)) return;
      if (this.mode === 'save' && !(this.rows[i] && this.rows[i].record)) this.run(i);
      else this.ask = i;
    }

    detail(row) {
      const r = row.record;
      if (!r) return 'пусто';
      const date = new Date(r.when).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      return S.dateText(r.day, r.clock) + ', записано ' + date + ', ' + Math.max(1, Math.round(r.size / 1024)) + ' КБ';
    }

    draw(g, v) {
      const b = this.box(v), pointer = this.ui.pointer, hover = pointer ? this.rowAt(v, pointer.x, pointer.y) : -1, Font = S.Font, Kit = S.Kit, INK = '#102a66', GRAY = '#6a7ca4';
      g.fillStyle = 'rgba(8, 14, 30, 0.55)';
      g.fillRect(0, 0, v.sw, v.sh);
      Kit.glass(g, b.x, b.y, b.w, b.h, 'pale', 12);
      [['save', 'Сохранить', 0], ['load', 'Загрузить', 1]].forEach(([mode, name, n]) => {
        const on = this.mode === mode, x = b.x + 8 + n * (b.w / 2 - 4), w = b.w / 2 - 8;
        Kit.plate(g, x, b.y + 5, w, TAB_H - 5, on ? 'on' : 'normal', 6);
        Font.shadowed(g, 'bold', name, x + w / 2 - Font.measure('bold', name) / 2, b.y + 9, '#fff', '#12306e');
      });
      Font.draw(g, 'small', this.mode === 'save' ? 'Выберите слот. Быстрое и автосохранения пишет сама игра.' : 'Выберите файл. Игра встанет на паузу, пробел продолжит.', b.x + 14, b.y + TAB_H + 9, INK);
      S.Save.SLOTS.forEach((slot, i) => {
        const row = this.rows[i] || { record: null }, y = b.y + HEAD + i * ROW, on = this.usable(i);
        if (this.ask === i) {
          Kit.plate(g, b.x + 6, y, b.w - 12, ROW - 1, 'normal', 5);
          Font.draw(g, 'bold', slot.name + ': ' + (this.mode === 'save' ? 'записать поверх?' : 'заменить игру?'), b.x + 14, y + 5, '#fff');
          for (const [right, name] of [[YES_X, 'Да'], [NO_X, 'Нет']]) {
            Kit.plate(g, b.x + b.w - right, y + 2, CHOICE_W, ROW - 5, 'hover', 5);
            Font.shadowed(g, 'bold', name, b.x + b.w - right + CHOICE_W / 2 - Font.measure('bold', name) / 2, y + 4, '#fff', '#12306e');
          }
          return;
        }
        if (hover === i && on) {
          g.fillStyle = 'rgba(255, 255, 255, 0.45)';
          g.fillRect(b.x + 6, y, b.w - 12, ROW - 1);
        }
        Font.draw(g, 'bold', slot.name, b.x + 14, y + 5, on ? INK : GRAY);
        Font.draw(g, 'small', this.detail(row), b.x + 176, y + 5, on ? INK : GRAY);
      });
      Font.draw(g, 'small', this.message || (this.busy ? 'Минуту...' : 'Esc или щелчок мимо окна: закрыть'), b.x + 14, b.y + b.h - 22, this.message ? '#a01818' : INK);
    }
  }

  S.SaveView = SaveView;
})(globalThis.Sims98 = globalThis.Sims98 || {});
