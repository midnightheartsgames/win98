import type { App, Scene } from '../app.ts';
import type { Game } from './state.ts';
import { ListMenu, COLORS, formatTime, type MenuItem } from './ui.ts';
import { str } from '../core/i18n.ts';
import { allSlots, readSlot, exportSav, importSav, savFileName, deleteSlot, type SlotRecord } from './save.ts';
import { SAVE_SLOTS } from '../config.ts';

export class SaveScene implements Scene {
  opaque = true;
  private app: App;
  private mode: 'save' | 'load' | 'clean';
  private idx = 0;
  private slots: (SlotRecord | null)[];
  private sub: ListMenu | null = null;
  private confirm: ListMenu | null = null;
  private msg: { text: string; t: number; color: string } | null = null;
  private files: ListMenu | null = null;
  private fileData: { name: string; content: string }[] = [];

  constructor(app: App, mode: 'save' | 'load' | 'clean') {
    this.app = app;
    this.mode = mode;
    this.slots = allSlots();
    const latest = this.slots.reduce((b, r, i) => (r && (b < 0 || r.meta.savedAt > (this.slots[b]?.meta.savedAt ?? 0)) ? i : b), -1);
    this.idx = latest >= 0 ? latest : 0;
  }

  private note(text: string, color = '#ffffff'): void {
    this.msg = { text, t: 120, color };
  }

  private placeName(): string {
    const g = this.app.game as Game;
    const m = g.data.maps[g.s.map.id];
    return m && str.has(m.name) ? str.t(m.name) : g.s.map.id;
  }

  private rows(): number {
    return SAVE_SLOTS + 1;
  }

  private openSub(): void {
    const has = !!this.slots[this.idx];
    const items: MenuItem[] = [];
    if (this.mode !== 'load') items.push({ label: str.t(this.mode === 'clean' ? 'save.do_clean' : 'save.do_save'), value: 'save' });
    if (this.mode === 'load') items.push({ label: str.t('save.do_load'), value: 'load', enabled: has });
    items.push({ label: str.t('save.export'), value: 'export', enabled: has });
    items.push({ label: str.t('save.delete'), value: 'delete', enabled: has });
    items.push({ label: str.t('save.back'), value: 'back' });
    this.sub = new ListMenu(items, 5);
    this.sub.soundMove = () => this.app.sfx('cursor');
    this.sub.soundBuzz = () => this.app.sfx('error');
  }

  private doSave(): void {
    const ok = this.app.saveToSlot(this.idx + 1, this.placeName());
    this.slots = allSlots();
    if (ok) {
      this.app.sfx('save');
      this.note(str.t(this.mode === 'clean' ? 'save.clean_done' : 'save.done'), '#80f0a0');
    } else {
      this.app.sfx('error');
      this.note(str.t('save.fail'), '#f08080');
    }
  }

  private doExport(): void {
    const rec = readSlot(this.idx + 1);
    if (!rec) return;
    const name = savFileName(rec);
    const content = exportSav(rec);
    const ok = this.app.exportFile(name, content);
    this.app.sfx(ok ? 'save' : 'error');
    this.note(str.t(ok ? 'save.exported' : 'save.fail', { file: name }), ok ? '#80f0a0' : '#f08080');
  }

  private importText(text: string | null): void {
    if (!text) return;
    try {
      const rec = importSav(text);
      this.fileData = [];
      if (this.mode === 'load') {
        this.app.sfx('load');
        this.app.fadeOut(30, () => this.app.loadRecord(rec, null));
      } else this.note(str.t('save.import_ok'), '#80f0a0');
    } catch (e) {
      this.app.sfx('error');
      this.note(str.t((e as Error).message === 'bad_checksum' ? 'save.bad_checksum' : 'save.bad_file'), '#f08080');
    }
  }

  private openImport(): void {
    const list = this.app.opts.listImportFiles ? this.app.opts.listImportFiles() : [];
    this.fileData = list;
    const items: MenuItem[] = list.map((f) => ({ label: f.name, value: f.name }));
    items.push({ label: str.t('save.from_disk'), value: '__disk' });
    items.push({ label: str.t('save.back'), value: '__back' });
    this.files = new ListMenu(items, 8);
    this.files.soundMove = () => this.app.sfx('cursor');
  }

  update(): void {
    const inp = this.app.input;
    if (this.msg) {
      this.msg.t--;
      if (this.msg.t <= 0) this.msg = null;
    }
    if (this.files) {
      const f = this.files;
      const r = f.update(inp);
      if (r === 'cancel') this.files = null;
      if (r === 'confirm') {
        const v = f.current?.value as string;
        this.files = null;
        if (v === '__disk') this.app.pickImportFile((t) => this.importText(t));
        else if (v !== '__back') this.importText(this.fileData.find((f) => f.name === v)?.content ?? null);
      }
      return;
    }
    if (this.confirm) {
      const c = this.confirm;
      const r = c.update(inp);
      if (r === 'cancel') this.confirm = null;
      if (r === 'confirm') {
        const v = c.current?.value;
        this.confirm = null;
        if (v === 'overwrite') this.doSave();
        if (v === 'delete') {
          deleteSlot(this.idx + 1);
          this.slots = allSlots();
          this.app.sfx('cancel');
        }
      }
      return;
    }
    if (this.sub) {
      const r = this.sub.update(inp);
      if (r === 'cancel') {
        this.sub = null;
        return;
      }
      if (r !== 'confirm') return;
      const v = this.sub.current?.value;
      this.sub = null;
      switch (v) {
        case 'save':
          if (this.slots[this.idx]) {
            this.confirm = new ListMenu([
              { label: str.t('save.overwrite'), value: 'overwrite' },
              { label: str.t('save.back'), value: 'back' }
            ], 2);
          } else this.doSave();
          break;
        case 'load':
          this.app.sfx('load');
          this.app.fadeOut(30, () => this.app.loadSlot(this.idx + 1));
          break;
        case 'export':
          this.doExport();
          break;
        case 'delete':
          this.confirm = new ListMenu([
            { label: str.t('save.delete_yes'), value: 'delete' },
            { label: str.t('save.back'), value: 'back' }
          ], 2);
          break;
      }
      return;
    }
    const n = this.rows();
    if (inp.repeat('up')) {
      this.idx = (this.idx + n - 1) % n;
      this.app.sfx('cursor');
    }
    if (inp.repeat('down')) {
      this.idx = (this.idx + 1) % n;
      this.app.sfx('cursor');
    }
    if (inp.pressed('cancel')) {
      this.app.sfx('cancel');
      this.app.pop();
      return;
    }
    if (inp.pressed('confirm')) {
      this.app.sfx('cursor_ok');
      if (this.idx === SAVE_SLOTS) this.openImport();
      else this.openSub();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    ctx.fillStyle = '#060818';
    ctx.fillRect(0, 0, 320, 240);
    ui.window(ctx, 4, 4, 312, 22);
    ui.text(ctx, str.t(this.mode === 'load' ? 'save.title_load' : this.mode === 'clean' ? 'save.title_clean' : 'save.title_save'), 12, 11, COLORS.gold);
    for (let i = 0; i < SAVE_SLOTS; i++) {
      const y = 30 + i * 54;
      const r = this.slots[i];
      ui.window(ctx, 4, y, 312, 50, i === this.idx ? 'blue' : 'dark');
      ui.text(ctx, `${str.t('save.slot')} ${i + 1}`, 24, y + 6, i === this.idx ? COLORS.gold : COLORS.dim);
      if (i === this.idx && !this.sub && !this.files) ui.cursor(ctx, 22, y + 6);
      if (!r) {
        ui.text(ctx, str.t('save.empty'), 90, y + 20, COLORS.disabled);
        continue;
      }
      r.meta.party.forEach((id, k) => {
        const look = this.app.data.characters[id]?.look ?? id;
        ctx.drawImage(this.app.sprites.walkFrame(look, 'down', 0), 24 + k * 18, y + 16);
      });
      ui.text(ctx, `${r.meta.name}  ${str.t('ui.lv')} ${r.meta.level}${r.meta.clean ? `  ★ ${str.t('save.clean_tag')}` : ''}`, 90, y + 6, r.meta.clean ? '#80f0ff' : COLORS.text);
      ui.text(ctx, r.meta.place, 90, y + 18, COLORS.title);
      ui.text(ctx, `${str.t('ui.time')} ${formatTime(r.meta.playtime)}`, 90, y + 30, COLORS.dim);
      const d = new Date(r.meta.savedAt);
      ui.textRight(ctx, `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`, 308, y + 30, COLORS.dim);
    }
    const iy = 30 + SAVE_SLOTS * 54;
    ui.window(ctx, 4, iy, 312, 40, this.idx === SAVE_SLOTS ? 'blue' : 'dark');
    ui.text(ctx, str.t('save.import'), 24, iy + 8, this.idx === SAVE_SLOTS ? COLORS.gold : COLORS.dim);
    ui.text(ctx, str.t('save.import_hint'), 24, iy + 21, COLORS.dim);
    if (this.idx === SAVE_SLOTS && !this.files) ui.cursor(ctx, 22, iy + 8);
    const pop = (m: ListMenu, w: number) => {
      const h = m.items.length * 11 + 12;
      ui.window(ctx, 160 - w / 2, 120 - h / 2, w, h);
      m.render(ctx, ui, 160 - w / 2 + 18, 120 - h / 2 + 6, w - 24);
    };
    if (this.sub) pop(this.sub, 150);
    if (this.confirm) pop(this.confirm, 150);
    if (this.files) pop(this.files, 220);
    if (this.msg) {
      const w = this.app.font.measure(this.msg.text) + 16;
      ui.window(ctx, 160 - w / 2, 214, w, 20, 'dark');
      ui.textCenter(ctx, this.msg.text, 160, 220, this.msg.color);
    }
  }
}

export class ShopScene implements Scene {
  opaque = true;
  private app: App;
  private g: Game;
  private shopId: string;
  private mode: 'root' | 'buy' | 'sell' = 'root';
  private root: ListMenu;
  private list: ListMenu | null = null;
  private qty = 1;
  private qtyOpen = false;
  private msg: { text: string; t: number } | null = null;

  constructor(app: App, shopId: string) {
    this.app = app;
    this.g = app.game as Game;
    this.shopId = shopId;
    this.root = new ListMenu([
      { label: str.t('shop.buy'), value: 'buy' },
      { label: str.t('shop.sell'), value: 'sell' },
      { label: str.t('shop.leave'), value: 'leave' }
    ], 3);
    this.root.soundMove = () => app.sfx('cursor');
  }

  private shop() {
    return this.g.data.shops[this.shopId];
  }

  private buildBuy(): void {
    const items: MenuItem[] = this.shop().stock.filter((s) => this.g.test(s.if)).map((s) => {
      const it = this.g.item(s.item);
      return { label: it.name, right: `${it.price}`, value: it.id, icon: it.icon, enabled: this.g.s.gold >= it.price };
    });
    const idx = this.list?.index ?? 0;
    this.list = new ListMenu(items, 10);
    this.list.index = Math.min(idx, Math.max(0, items.length - 1));
    this.list.soundMove = () => this.app.sfx('cursor');
    this.list.soundBuzz = () => this.app.sfx('error');
  }

  private buildSell(): void {
    const items: MenuItem[] = Object.keys(this.g.s.items).map((id) => this.g.data.items[id]).filter((it) => it && it.type !== 'key' && it.type !== 'sign' && it.price > 0 && this.g.count(it.id) > 0).map((it) => ({ label: it.name, right: `${Math.floor(it.price / 2)} ×${this.g.count(it.id)}`, value: it.id, icon: it.icon }));
    const idx = this.list?.index ?? 0;
    this.list = new ListMenu(items, 10);
    this.list.index = Math.min(idx, Math.max(0, items.length - 1));
    this.list.soundMove = () => this.app.sfx('cursor');
  }

  update(): void {
    const inp = this.app.input;
    if (this.msg) {
      this.msg.t--;
      if (this.msg.t <= 0) this.msg = null;
    }
    if (this.qtyOpen && this.list?.current) {
      const it = this.g.item(this.list.current.value as string);
      const max = this.mode === 'buy' ? Math.max(1, Math.min(99 - this.g.count(it.id), Math.floor(this.g.s.gold / Math.max(1, it.price)))) : this.g.count(it.id);
      const cap = it.type === 'consumable' ? max : Math.min(max, this.mode === 'buy' ? 1 : max);
      if (inp.repeat('up') || inp.repeat('right')) this.qty = Math.min(cap, this.qty + (inp.repeat('right') ? 10 : 1));
      if (inp.repeat('down') || inp.repeat('left')) this.qty = Math.max(1, this.qty - (inp.repeat('left') ? 10 : 1));
      if (inp.repeat('up') || inp.repeat('down') || inp.repeat('left') || inp.repeat('right')) this.app.sfx('cursor');
      if (inp.pressed('cancel')) this.qtyOpen = false;
      if (inp.pressed('confirm')) {
        if (this.mode === 'buy') {
          const cost = it.price * this.qty;
          if (cost > this.g.s.gold) {
            this.app.sfx('error');
            return;
          }
          this.g.addGold(-cost);
          this.g.give(it.id, this.qty);
          this.msg = { text: str.t('shop.bought', { item: it.name, n: this.qty }), t: 80 };
          this.buildBuy();
        } else {
          this.g.take(it.id, this.qty);
          this.g.addGold(Math.floor(it.price / 2) * this.qty);
          this.msg = { text: str.t('shop.sold', { item: it.name, n: this.qty }), t: 80 };
          this.buildSell();
        }
        this.app.sfx('coin');
        this.qtyOpen = false;
      }
      return;
    }
    if (this.mode === 'root') {
      const r = this.root.update(inp);
      if (r === 'cancel' || (r === 'confirm' && this.root.current?.value === 'leave')) {
        this.app.sfx('cancel');
        this.app.pop();
        return;
      }
      if (r === 'confirm') {
        this.mode = this.root.current?.value as 'buy' | 'sell';
        this.list = null;
        if (this.mode === 'buy') this.buildBuy();
        else this.buildSell();
        this.app.sfx('cursor_ok');
      }
      return;
    }
    const l = this.list as ListMenu;
    const r = l.update(inp);
    if (r === 'cancel') {
      this.mode = 'root';
      this.app.sfx('cancel');
      return;
    }
    if (r === 'confirm' && l.current) {
      this.qty = 1;
      this.qtyOpen = true;
      this.app.sfx('cursor_ok');
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const g = this.g;
    const shop = this.shop();
    ctx.fillStyle = '#060818';
    ctx.fillRect(0, 0, 320, 240);
    ui.window(ctx, 4, 4, 312, 56);
    const sp = g.data.speakers[shop.keeper];
    if (sp?.look) ui.portrait(ctx, sp.look, 'happy', 10, 8, true);
    ui.text(ctx, shop.name, 66, 12, COLORS.gold);
    ui.text(ctx, str.t(this.mode === 'sell' ? 'shop.greet_sell' : 'shop.greet'), 66, 26, COLORS.title);
    ui.text(ctx, `${str.t('ui.gold')}: ${g.s.gold}`, 66, 42, COLORS.gold);
    ui.window(ctx, 4, 62, 90, 44);
    this.root.render(ctx, ui, 20, 68, 70, this.mode === 'root');
    ui.window(ctx, 96, 62, 220, 174);
    if (this.list && this.mode !== 'root') {
      if (this.list.items.length) this.list.render(ctx, ui, 112, 70, 196, !this.qtyOpen);
      else ui.text(ctx, str.t('shop.nothing'), 112, 70, COLORS.dim);
    }
    ui.window(ctx, 4, 108, 90, 128);
    const cur = this.mode !== 'root' ? this.list?.current : null;
    if (cur) {
      const it = g.item(cur.value as string);
      this.app.font.wrap(it.desc, 78).slice(0, 6).forEach((l, i) => ui.text(ctx, l, 10, 114 + i * 10, COLORS.title));
      ui.text(ctx, `${str.t('shop.have')} ${g.count(it.id) + g.equippedCount(it.id)}`, 10, 180, COLORS.dim);
      if (it.equip) {
        const who = (it.equip.who ?? g.s.party).filter((w) => g.s.roster[w]);
        who.slice(0, 3).forEach((w, i) => {
          const can = g.canEquip(w, it.id);
          ui.text(ctx, `${w === 'isa' ? g.s.name : g.char(w).name}${can ? '' : ' -'}`, 10, 192 + i * 10, can ? COLORS.text : COLORS.disabled);
        });
      }
    }
    if (this.qtyOpen && cur) {
      const it = g.item(cur.value as string);
      const price = this.mode === 'buy' ? it.price : Math.floor(it.price / 2);
      ui.window(ctx, 150, 110, 150, 40);
      ui.text(ctx, `${str.t('shop.qty')}: ◀ ${this.qty} ▶`, 162, 118);
      ui.text(ctx, `${str.t('shop.total')}: ${price * this.qty}`, 162, 132, COLORS.gold);
    }
    if (this.msg) {
      const w = this.app.font.measure(this.msg.text) + 16;
      ui.window(ctx, 160 - w / 2, 214, w, 20, 'dark');
      ui.textCenter(ctx, this.msg.text, 160, 220, '#80f0a0');
    }
  }
}
