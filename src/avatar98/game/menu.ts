import type { App, Scene } from '../app.ts';
import type { Game } from './state.ts';
import { EQUIP_SLOTS, STAT_KEYS } from './state.ts';
import { ListMenu, COLORS, formatTime, type MenuItem } from './ui.ts';
import { str } from '../core/i18n.ts';
import { Factories } from './registry.ts';
import type { EquipSlot, ItemDef, StatKey, TechniqueDef, Element } from '../data/types.ts';
import { Particles } from '../gfx/particles.ts';

type Panel = 'main' | 'items' | 'techs' | 'equip' | 'signs' | 'status' | 'journal';

const STAT_LABEL: Record<StatKey, string> = { hp: 'ui.hp', mp: 'ui.mp', atk: 'stat.atk', def: 'stat.def', mag: 'stat.mag', res: 'stat.res', spd: 'stat.spd', lck: 'stat.lck' };

export class MenuScene implements Scene {
  opaque = true;
  countsPlaytime = true;
  private app: App;
  private g: Game;
  private panel: Panel = 'main';
  private main: ListMenu;
  private sub: ListMenu | null = null;
  private sub2: ListMenu | null = null;
  private charSel: number | null = null;
  private pickingChar = false;
  private pickFor: Panel | null = null;
  private itemTab = 0;
  private targetMode: { kind: 'item' | 'tech'; id: string; user?: string } | null = null;
  private targetIdx = 0;
  private equipSlot: EquipSlot | null = null;
  private signSlot: number | null = null;
  private msg: { text: string; t: number } | null = null;
  private journalTab = 0;
  private fx = new Particles();
  private place: string;

  constructor(app: App) {
    this.app = app;
    this.g = app.game as Game;
    const items: MenuItem[] = [
      { label: str.t('menu.items'), value: 'items' },
      { label: str.t('menu.techs'), value: 'techs' },
      { label: str.t('menu.equip'), value: 'equip' },
      { label: str.t('menu.signs'), value: 'signs' },
      { label: str.t('menu.status'), value: 'status' },
      { label: str.t('menu.journal'), value: 'journal' },
      { label: str.t('menu.settings'), value: 'settings' },
      { label: str.t('menu.save'), value: 'save', enabled: false, help: str.t('menu.save_help') }
    ];
    this.main = this.list(items, 9);
    const mapId = this.g.s.map.id;
    const nm = this.g.data.maps[mapId]?.name;
    this.place = nm && str.has(nm) ? str.t(nm) : '';
  }

  private list(items: MenuItem[], rows: number): ListMenu {
    const m = new ListMenu(items, rows);
    m.soundMove = () => this.app.sfx('cursor');
    m.soundBuzz = () => this.app.sfx('error');
    return m;
  }

  private party(): string[] {
    return this.g.s.party;
  }

  private flash(text: string): void {
    this.msg = { text, t: 90 };
  }

  update(): void {
    const inp = this.app.input;
    this.fx.update();
    if (this.msg) {
      this.msg.t--;
      if (this.msg.t <= 0) this.msg = null;
    }
    if (this.targetMode) {
      this.updateTarget();
      return;
    }
    if (this.pickingChar) {
      const n = this.party().length;
      if (inp.repeat('up')) {
        this.charSel = ((this.charSel ?? 0) - 1 + n) % n;
        this.app.sfx('cursor');
      }
      if (inp.repeat('down')) {
        this.charSel = ((this.charSel ?? 0) + 1) % n;
        this.app.sfx('cursor');
      }
      if (inp.pressed('cancel')) {
        this.pickingChar = false;
        this.charSel = null;
        this.app.sfx('cancel');
      } else if (inp.pressed('confirm')) {
        this.pickingChar = false;
        this.app.sfx('cursor_ok');
        this.openPanel(this.pickFor as Panel);
      }
      return;
    }
    switch (this.panel) {
      case 'main':
        this.updateMain();
        break;
      case 'items':
        this.updateItems();
        break;
      case 'techs':
        this.updateTechs();
        break;
      case 'equip':
        this.updateEquip();
        break;
      case 'signs':
        this.updateSigns();
        break;
      case 'status':
        this.updateStatus();
        break;
      case 'journal':
        this.updateJournal();
        break;
    }
  }

  private close(): void {
    this.app.sfx('menu_close');
    this.app.pop();
  }

  private updateMain(): void {
    const inp = this.app.input;
    if (inp.pressed('menu')) {
      this.close();
      return;
    }
    const r = this.main.update(inp);
    if (r === 'cancel') {
      this.close();
      return;
    }
    if (r !== 'confirm') {
      if (inp.pressed('confirm') && this.main.current?.value === 'save') this.flash(str.t('menu.save_help'));
      return;
    }
    const v = this.main.current?.value as string;
    this.app.sfx('cursor_ok');
    if (v === 'settings') {
      if (Factories.settings) this.app.push(Factories.settings(this.app));
      return;
    }
    if (v === 'items' || v === 'journal') {
      this.openPanel(v);
      return;
    }
    this.pickFor = v as Panel;
    this.pickingChar = true;
    this.charSel = 0;
  }

  private openPanel(p: Panel): void {
    this.panel = p;
    this.sub = null;
    this.sub2 = null;
    this.equipSlot = null;
    this.signSlot = null;
    if (p === 'items') this.buildItems();
    if (p === 'techs') this.buildTechs();
    if (p === 'equip') this.buildEquipSlots();
    if (p === 'signs') this.buildSignSlots();
  }

  private back(): void {
    this.app.sfx('cancel');
    this.panel = 'main';
    this.sub = null;
    this.sub2 = null;
    this.charSel = null;
  }

  private itemsOfTab(): ItemDef[] {
    const types: ItemDef['type'][][] = [['consumable'], ['weapon', 'armor', 'accessory'], ['sign'], ['key']];
    const want = types[this.itemTab];
    return Object.keys(this.g.s.items).map((id) => this.g.data.items[id]).filter((it) => it && want.includes(it.type) && this.g.count(it.id) > 0);
  }

  private buildItems(): void {
    const items = this.itemsOfTab().map((it) => ({ label: it.name, right: it.type === 'key' || it.type === 'sign' ? '' : `×${this.g.count(it.id)}`, value: it.id, icon: it.icon, enabled: this.itemTab !== 0 || !!it.use?.field }));
    const idx = this.sub?.index ?? 0;
    this.sub = this.list(items, 12);
    this.sub.index = Math.min(idx, Math.max(0, items.length - 1));
  }

  private updateItems(): void {
    const inp = this.app.input;
    if (inp.pressed('left') || inp.pressed('right')) {
      this.itemTab = (this.itemTab + (inp.pressed('left') ? 3 : 1)) % 4;
      this.app.sfx('cursor');
      this.sub = null;
      this.buildItems();
      return;
    }
    const m = this.sub as ListMenu;
    const r = m.update(inp);
    if (r === 'cancel') return this.back();
    if (r === 'confirm' && m.current) {
      const it = this.g.item(m.current.value as string);
      if (it.use?.field) {
        this.targetMode = { kind: 'item', id: it.id };
        this.targetIdx = 0;
        this.app.sfx('cursor_ok');
      }
    }
  }

  private techsOf(id: string): TechniqueDef[] {
    return this.g.techniques(id);
  }

  private buildTechs(): void {
    const id = this.party()[this.charSel ?? 0];
    const techs = this.techsOf(id);
    const items: MenuItem[] = techs.map((t) => ({ label: t.name, right: `${t.cost?.mp ?? 0}`, value: t, color: t.group && this.g.data.stances[t.group] ? this.g.data.stances[t.group].color : undefined, enabled: !!t.field && (t.cost?.mp ?? 0) <= this.g.cs(id).mp }));
    const lt = this.g.limitTech(id);
    if (lt) items.push({ label: `${str.t('menu.avatar_form')}: ${lt.name}`, value: lt, enabled: false, color: '#80f0ff' });
    this.sub = this.list(items, 12);
  }

  private updateTechs(): void {
    const inp = this.app.input;
    const m = this.sub as ListMenu;
    const r = m.update(inp);
    if (r === 'cancel') return this.back();
    if (r === 'confirm' && m.current) {
      const t = m.current.value as TechniqueDef;
      if (t.field) {
        this.targetMode = { kind: 'tech', id: t.id, user: this.party()[this.charSel ?? 0] };
        this.targetIdx = 0;
      }
    }
  }

  private updateTarget(): void {
    const inp = this.app.input;
    const tm = this.targetMode;
    if (!tm) return;
    const ids = this.party();
    if (inp.repeat('up')) {
      this.targetIdx = (this.targetIdx - 1 + ids.length) % ids.length;
      this.app.sfx('cursor');
    }
    if (inp.repeat('down')) {
      this.targetIdx = (this.targetIdx + 1) % ids.length;
      this.app.sfx('cursor');
    }
    if (inp.pressed('cancel')) {
      this.targetMode = null;
      this.app.sfx('cancel');
      return;
    }
    if (!inp.pressed('confirm')) return;
    const target = ids[this.targetIdx];
    const cs = this.g.cs(target);
    const st = this.g.stats(target);
    let effects;
    let power = 0;
    if (tm.kind === 'item') {
      const it = this.g.item(tm.id);
      effects = it.use?.effects ?? [];
    } else {
      const t = this.g.data.techniques[tm.id];
      const user = this.g.cs(tm.user as string);
      if ((t.cost?.mp ?? 0) > user.mp) {
        this.app.sfx('error');
        return;
      }
      effects = t.effects;
      power = this.g.stats(tm.user as string).mag;
    }
    let did = false;
    for (const e of effects) {
      if (e.type === 'heal' && cs.hp > 0 && cs.hp < st.hp) {
        const amt = Math.floor((e.fixed ?? 0) + (e.pct ? (st.hp * e.pct) / 100 : 0) + (e.power ? power * 2 * e.power + 10 : 0));
        cs.hp = Math.min(st.hp, cs.hp + amt);
        did = true;
      }
      if (e.type === 'mp' && cs.mp < st.mp) {
        cs.mp = Math.min(st.mp, cs.mp + Math.floor((e.fixed ?? 0) + (e.pct ? (st.mp * e.pct) / 100 : 0)));
        did = true;
      }
      if (e.type === 'revive' && cs.hp <= 1) {
        cs.hp = Math.max(cs.hp, Math.floor((st.hp * (e.pct ?? 25)) / 100));
        did = true;
      }
    }
    if (!did) {
      this.app.sfx('error');
      this.flash(str.t('menu.no_effect'));
      return;
    }
    this.app.sfx('heal');
    this.fx.burst('heal', 60, 50 + this.targetIdx * 52);
    if (tm.kind === 'item') {
      this.g.take(tm.id, 1);
      if (this.g.count(tm.id) <= 0) this.targetMode = null;
      this.buildItems();
    } else {
      const user = this.g.cs(tm.user as string);
      user.mp -= this.g.data.techniques[tm.id].cost?.mp ?? 0;
      this.buildTechs();
    }
  }

  private buildEquipSlots(): void {
    const id = this.party()[this.charSel ?? 0];
    const cs = this.g.cs(id);
    const items: MenuItem[] = EQUIP_SLOTS.map((s) => ({ label: str.t(`equip.${s}`), right: cs.equip[s] ? this.g.item(cs.equip[s] as string).name : '—', value: s }));
    this.sub = this.list(items, 3);
  }

  private buildEquipChoices(slot: EquipSlot): void {
    const id = this.party()[this.charSel ?? 0];
    const cs = this.g.cs(id);
    const opts = Object.keys(this.g.s.items).filter((it) => this.g.data.items[it]?.type === slot && this.g.canEquip(id, it) && this.g.count(it) > 0);
    const items: MenuItem[] = opts.map((it) => ({ label: this.g.item(it).name, value: it, icon: this.g.item(it).icon, right: `×${this.g.count(it)}` }));
    if (cs.equip[slot] && slot === 'accessory') items.push({ label: str.t('equip.remove'), value: null });
    this.sub2 = this.list(items, 8);
  }

  private updateEquip(): void {
    const inp = this.app.input;
    const id = this.party()[this.charSel ?? 0];
    if (this.sub2) {
      const r = this.sub2.update(inp);
      if (r === 'cancel') {
        this.sub2 = null;
        this.equipSlot = null;
        this.app.sfx('cancel');
      } else if (r === 'confirm' && this.equipSlot) {
        const v = this.sub2.current?.value as string | null;
        if (this.g.equip(id, this.equipSlot, v)) {
          this.app.sfx('equip');
          this.sub2 = null;
          this.equipSlot = null;
          this.buildEquipSlots();
        } else this.app.sfx('error');
      }
      return;
    }
    if (inp.pressed('left') || inp.pressed('right')) {
      const n = this.party().length;
      this.charSel = ((this.charSel ?? 0) + (inp.pressed('left') ? n - 1 : 1)) % n;
      this.app.sfx('cursor');
      this.buildEquipSlots();
      return;
    }
    const m = this.sub as ListMenu;
    const r = m.update(inp);
    if (r === 'cancel') return this.back();
    if (r === 'confirm' && m.current) {
      this.equipSlot = m.current.value as EquipSlot;
      this.buildEquipChoices(this.equipSlot);
      const choices = this.sub2 as ListMenu | null;
      if (!choices || !choices.items.length) {
        this.sub2 = null;
        this.equipSlot = null;
        this.flash(str.t('equip.none'));
        this.app.sfx('error');
      }
    }
  }

  private buildSignSlots(): void {
    const id = this.party()[this.charSel ?? 0];
    const cs = this.g.cs(id);
    const items: MenuItem[] = cs.signs.map((s, i) => ({ label: `${str.t('signs.slot')} ${i + 1}`, right: s ? this.g.item(s).name : '—', value: i }));
    this.sub = this.list(items, 4);
  }

  private updateSigns(): void {
    const inp = this.app.input;
    const id = this.party()[this.charSel ?? 0];
    if (this.sub2) {
      const r = this.sub2.update(inp);
      if (r === 'cancel') {
        this.sub2 = null;
        this.signSlot = null;
        this.app.sfx('cancel');
      } else if (r === 'confirm' && this.signSlot !== null) {
        const v = this.sub2.current?.value as string | null;
        if (this.g.equipSign(id, this.signSlot, v)) {
          this.app.sfx('equip');
          this.sub2 = null;
          this.signSlot = null;
          this.buildSignSlots();
        } else this.app.sfx('error');
      }
      return;
    }
    if (inp.pressed('left') || inp.pressed('right')) {
      const n = this.party().length;
      this.charSel = ((this.charSel ?? 0) + (inp.pressed('left') ? n - 1 : 1)) % n;
      this.app.sfx('cursor');
      this.buildSignSlots();
      return;
    }
    const m = this.sub as ListMenu;
    const r = m.update(inp);
    if (r === 'cancel') return this.back();
    if (r === 'confirm' && m.current) {
      this.signSlot = m.current.value as number;
      const opts = Object.keys(this.g.s.items).filter((it) => this.g.data.items[it]?.type === 'sign' && this.g.count(it) > 0);
      const items: MenuItem[] = opts.map((it) => ({ label: this.g.item(it).name, value: it, icon: 'sign', right: `${str.t('signs.lv')}${this.g.signLevel(it) + 1}` }));
      if (this.g.cs(id).signs[this.signSlot]) items.push({ label: str.t('equip.remove'), value: null });
      if (!items.length) {
        this.flash(str.t('signs.none'));
        this.app.sfx('error');
        this.signSlot = null;
        return;
      }
      this.sub2 = this.list(items, 8);
    }
  }

  private updateStatus(): void {
    const inp = this.app.input;
    if (inp.pressed('left') || inp.pressed('right') || inp.pressed('up') || inp.pressed('down')) {
      const n = this.party().length;
      this.charSel = ((this.charSel ?? 0) + (inp.pressed('left') || inp.pressed('up') ? n - 1 : 1)) % n;
      this.app.sfx('cursor');
    }
    if (inp.pressed('cancel') || inp.pressed('confirm')) this.back();
  }

  private updateJournal(): void {
    const inp = this.app.input;
    if (inp.pressed('left') || inp.pressed('right')) {
      this.journalTab = (this.journalTab + (inp.pressed('left') ? 2 : 1)) % 3;
      this.app.sfx('cursor');
    }
    if (inp.pressed('cancel')) this.back();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    ctx.fillStyle = '#060818';
    ctx.fillRect(0, 0, 320, 240);
    switch (this.panel) {
      case 'main':
        this.renderMain(ctx);
        break;
      case 'items':
        this.renderItems(ctx);
        break;
      case 'techs':
        this.renderTechs(ctx);
        break;
      case 'equip':
        this.renderEquip(ctx);
        break;
      case 'signs':
        this.renderSigns(ctx);
        break;
      case 'status':
        this.renderStatus(ctx);
        break;
      case 'journal':
        this.renderJournal(ctx);
        break;
    }
    this.fx.render(ctx);
    if (this.msg) {
      const w = this.app.font.measure(this.msg.text) + 16;
      ui.window(ctx, 160 - w / 2, 110, w, 20, 'dark');
      ui.textCenter(ctx, this.msg.text, 160, 116);
    }
  }

  private charCard(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, highlight: boolean): void {
    const ui = this.app.ui;
    const g = this.g;
    const cs = g.cs(id);
    const st = g.stats(id);
    const def = g.char(id);
    ui.portrait(ctx, def.look, cs.hp / st.hp < 0.3 ? 'sad' : 'normal', x, y, true);
    const name = id === 'isa' ? g.s.name : def.name;
    ui.text(ctx, name, x + 56, y + 2, highlight ? COLORS.gold : COLORS.text);
    ui.text(ctx, `${str.t('ui.lv')} ${cs.level}`, x + 56, y + 13, COLORS.title);
    let role = def.role;
    while (this.app.font.measure(role) > 120 && role.length > 4) role = role.slice(0, -2) + '…';
    ui.text(ctx, role, x + 92, y + 13, COLORS.dim);
    ui.text(ctx, str.t('ui.hp'), x + 56, y + 25, COLORS.dim);
    ui.textRight(ctx, `${cs.hp}/${st.hp}`, x + 150, y + 25, ui.hpColor(cs.hp / st.hp));
    ui.bar(ctx, x + 72, y + 34, 78, 2, cs.hp / st.hp, COLORS.hp);
    ui.text(ctx, str.t('ui.mp'), x + 56, y + 37, COLORS.dim);
    ui.textRight(ctx, `${cs.mp}/${st.mp}`, x + 150, y + 37);
    ui.bar(ctx, x + 72, y + 46, 78, 2, st.mp ? cs.mp / st.mp : 0, COLORS.mp);
    const next = g.expFor(cs.level + 1);
    const prev = g.expFor(cs.level);
    ui.text(ctx, str.t('ui.next'), x + 158, y + 25, COLORS.dim);
    ui.textRight(ctx, `${Math.max(0, next - cs.exp)}`, x + 214, y + 25);
    ui.bar(ctx, x + 158, y + 34, 56, 2, (cs.exp - prev) / Math.max(1, next - prev), '#c0a0ff');
    if (g.limitTech(id)) {
      ui.text(ctx, str.t('ui.limit'), x + 158, y + 37, COLORS.dim);
      ui.bar(ctx, x + 158, y + 46, 56, 2, cs.limit / 100, cs.limit >= 100 ? '#80f0ff' : COLORS.limit);
    }
  }

  private renderMain(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    ui.window(ctx, 4, 4, 226, 232);
    this.party().forEach((id, i) => {
      const y = 12 + i * 58;
      this.charCard(ctx, id, 12, y, this.pickingChar && this.charSel === i);
      if (this.pickingChar && this.charSel === i) ui.cursor(ctx, 12, y + 18);
    });
    if (this.g.s.pipo) {
      const y = 12 + this.party().length * 58;
      if (y < 190) {
        ui.portrait(ctx, 'pipo', 'happy', 12, y, true);
        ui.text(ctx, str.t('menu.pipo_name'), 68, y + 2, COLORS.text);
        ui.text(ctx, str.t('menu.pipo_role'), 68, y + 13, COLORS.dim);
        const hearts = Math.max(0, Math.min(8, (this.g.s.trust.pipo ?? 0) + 2));
        ui.text(ctx, `${str.t('menu.trust')}: ${'♥'.repeat(hearts)}${'·'.repeat(8 - hearts)}`, 68, y + 25, '#f090b0');
      }
    }
    ui.window(ctx, 234, 4, 82, 104);
    this.main.render(ctx, ui, 248, 11, 66, !this.pickingChar);
    ui.window(ctx, 234, 184, 82, 52);
    ui.text(ctx, str.t('ui.time'), 240, 190, COLORS.dim);
    ui.textRight(ctx, formatTime(this.g.s.playtime), 310, 200);
    ui.text(ctx, str.t('ui.gold'), 240, 212, COLORS.dim);
    ui.textRight(ctx, `${this.g.s.gold}`, 310, 222, COLORS.gold);
    ui.window(ctx, 234, 112, 82, 68);
    const lines = this.app.font.wrap(this.place || '—', 70);
    lines.slice(0, 4).forEach((l, i) => ui.text(ctx, l, 240, 118 + i * 10, COLORS.title));
  }

  private renderItems(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const tabs = ['items.tab_use', 'items.tab_equip', 'items.tab_signs', 'items.tab_key'];
    ui.window(ctx, 4, 4, 312, 20);
    tabs.forEach((t, i) => ui.text(ctx, str.t(t), 14 + i * 76, 10, i === this.itemTab ? COLORS.gold : COLORS.dim));
    ui.window(ctx, 4, 26, 312, 22);
    const cur = this.sub?.current;
    if (cur) ui.text(ctx, this.g.item(cur.value as string).desc, 12, 33);
    ui.window(ctx, 4, 50, 196, 186);
    if (this.sub?.items.length) this.sub.render(ctx, ui, 20, 58, 172, !this.targetMode);
    else ui.text(ctx, str.t('items.empty'), 20, 58, COLORS.dim);
    ui.window(ctx, 202, 50, 114, 186);
    this.party().forEach((id, i) => {
      const y = 56 + i * 52;
      const cs = this.g.cs(id);
      const st = this.g.stats(id);
      ui.text(ctx, id === 'isa' ? this.g.s.name : this.g.char(id).name, 214, y);
      ui.text(ctx, `${str.t('ui.hp')} ${cs.hp}/${st.hp}`, 214, y + 11, ui.hpColor(cs.hp / st.hp));
      ui.text(ctx, `${str.t('ui.mp')} ${cs.mp}/${st.mp}`, 214, y + 22);
      if (this.targetMode && this.targetIdx === i) ui.cursor(ctx, 212, y + 10);
    });
  }

  private renderTechs(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const id = this.party()[this.charSel ?? 0];
    ui.window(ctx, 4, 4, 312, 56);
    this.charCard(ctx, id, 8, 8, false);
    ui.window(ctx, 4, 62, 312, 22);
    const cur = this.sub?.current;
    if (cur) {
      const t = cur.value as TechniqueDef;
      ui.text(ctx, t.desc, 12, 69);
    }
    ui.window(ctx, 4, 86, 312, 150);
    if (this.sub?.items.length) this.sub.render(ctx, ui, 20, 94, 180, !this.targetMode);
    else ui.text(ctx, str.t('techs.none'), 20, 94, COLORS.dim);
    const def = this.g.char(id);
    if (def.stances) ui.text(ctx, str.t('techs.stance_hint'), 206, 94, COLORS.dim);
    if (def.resource === 'opora') ui.text(ctx, str.t('techs.opora_hint'), 206, 94, COLORS.dim);
    if (this.targetMode) {
      ui.window(ctx, 206, 110, 106, 20 + this.party().length * 12);
      this.party().forEach((pid, i) => {
        const cs = this.g.cs(pid);
        ui.text(ctx, `${pid === 'isa' ? this.g.s.name : this.g.char(pid).name} ${cs.hp}`, 222, 118 + i * 12);
        if (this.targetIdx === i) ui.cursor(ctx, 220, 118 + i * 12);
      });
    }
  }

  private statDiff(id: string, slot: EquipSlot, itemId: string | null): Partial<Record<StatKey, number>> {
    const cur = this.g.cs(id).equip[slot];
    const a = cur ? this.g.item(cur).equip?.stats ?? {} : {};
    const b = itemId ? this.g.item(itemId).equip?.stats ?? {} : {};
    const out: Partial<Record<StatKey, number>> = {};
    for (const k of STAT_KEYS) out[k] = (b[k] ?? 0) - (a[k] ?? 0);
    return out;
  }

  private renderEquip(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const id = this.party()[this.charSel ?? 0];
    ui.window(ctx, 4, 4, 312, 56);
    this.charCard(ctx, id, 8, 8, false);
    ui.window(ctx, 4, 62, 196, 44);
    this.sub?.render(ctx, ui, 20, 68, 172, !this.sub2);
    ui.window(ctx, 202, 62, 114, 174);
    const st = this.g.stats(id);
    const choice = this.sub2?.current?.value as string | null | undefined;
    const diff = this.sub2 && this.equipSlot ? this.statDiff(id, this.equipSlot, choice ?? null) : null;
    STAT_KEYS.forEach((k, i) => {
      const y = 68 + i * 11;
      ui.text(ctx, str.t(STAT_LABEL[k]), 210, y, COLORS.dim);
      ui.textRight(ctx, `${st[k]}`, 280, y);
      const d = diff?.[k] ?? 0;
      if (d) ui.textRight(ctx, `${d > 0 ? '+' : ''}${d}`, 310, y, d > 0 ? '#80f0a0' : '#f08080');
    });
    ui.window(ctx, 4, 108, 196, 128);
    if (this.sub2) {
      this.sub2.render(ctx, ui, 20, 114, 172, true);
      const cur = this.sub2.current?.value as string | null;
      if (cur) {
        const d = this.g.item(cur).desc;
        this.app.font.wrap(d, 104).slice(0, 5).forEach((l, i) => ui.text(ctx, l, 208, 162 + i * 10, COLORS.title));
      }
    } else ui.text(ctx, str.t('equip.hint'), 14, 114, COLORS.dim);
  }

  private renderSigns(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const id = this.party()[this.charSel ?? 0];
    ui.window(ctx, 4, 4, 312, 56);
    this.charCard(ctx, id, 8, 8, false);
    ui.window(ctx, 4, 62, 196, 58);
    this.sub?.render(ctx, ui, 20, 68, 172, !this.sub2);
    ui.window(ctx, 4, 122, 196, 114);
    if (this.sub2) this.sub2.render(ctx, ui, 20, 128, 172, true);
    else ui.text(ctx, str.t('signs.hint'), 14, 128, COLORS.dim);
    ui.window(ctx, 202, 62, 114, 174);
    const sid = (this.sub2?.current?.value as string | null) ?? (this.sub ? this.g.cs(id).signs[this.sub.index] : null);
    if (sid) {
      const it = this.g.item(sid);
      const lv = this.g.signLevel(sid);
      const exp = this.g.s.signExp[sid] ?? 0;
      ui.text(ctx, it.name, 208, 68, COLORS.gold);
      ui.text(ctx, `${str.t('signs.lv')} ${lv + 1}/${it.sign?.levels.length}`, 208, 80);
      const nextL = it.sign?.levels[lv + 1];
      ui.text(ctx, nextL ? `${str.t('signs.exp')} ${exp}/${nextL.exp}` : str.t('signs.max'), 208, 91, COLORS.dim);
      if (nextL) ui.bar(ctx, 208, 101, 100, 2, exp / nextL.exp, '#c0a0ff');
      this.app.font.wrap(it.desc, 104).slice(0, 4).forEach((l, i) => ui.text(ctx, l, 208, 108 + i * 10, COLORS.title));
      const L = it.sign?.levels[lv];
      let y = 152;
      for (const [k, v] of Object.entries(L?.stats ?? {})) {
        ui.text(ctx, `${str.t(STAT_LABEL[k as StatKey])} +${v}`, 208, y, '#80f0a0');
        y += 10;
      }
      for (const p of L?.passives ?? []) {
        ui.text(ctx, str.t(`passive.${p.id}`, { v: p.value ?? '', el: p.element ? this.g.data.elements.names[p.element] : '' }), 208, y, '#a0e0ff');
        y += 10;
      }
      if (L?.tech) ui.text(ctx, `«${this.g.data.techniques[L.tech].name}»`, 208, y, '#f8d860');
    }
  }

  private renderStatus(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const g = this.g;
    const id = this.party()[this.charSel ?? 0];
    const st = g.stats(id);
    const def = g.char(id);
    ui.window(ctx, 4, 4, 312, 56);
    this.charCard(ctx, id, 8, 8, false);
    ui.window(ctx, 4, 62, 150, 106);
    STAT_KEYS.forEach((k, i) => {
      ui.text(ctx, str.t(STAT_LABEL[k]), 12, 68 + i * 12, COLORS.dim);
      ui.textRight(ctx, `${st[k]}`, 146, 68 + i * 12);
    });
    ui.window(ctx, 156, 62, 160, 106);
    ui.text(ctx, str.t('status.equip'), 164, 68, COLORS.dim);
    const cs = g.cs(id);
    EQUIP_SLOTS.forEach((s, i) => ui.text(ctx, cs.equip[s] ? g.item(cs.equip[s] as string).name : '—', 164, 80 + i * 11));
    ui.text(ctx, str.t('status.elements'), 164, 116, COLORS.dim);
    const els: Element[] = ['fire', 'earth', 'metal', 'chi', 'spirit'];
    const mults: string[] = [];
    for (const e of els) {
      let m = 1;
      for (const it of g.equippedItems(id)) m *= it.equip?.elem?.[e] ?? 1;
      if (m !== 1) mults.push(`${g.data.elements.names[e]} ×${m}`);
    }
    ui.text(ctx, mults.join(', ') || str.t('status.neutral'), 164, 128);
    if (def.limitForms) {
      ui.text(ctx, str.t('status.forms'), 164, 142, COLORS.dim);
      for (let i = 0; i < 4; i++) {
        const f = def.limitForms[i];
        const unlocked = f && cs.forms.includes(f);
        ui.text(ctx, unlocked ? g.data.avatarForms.find((a) => a.id === f)?.name ?? '???' : '???', 164 + (i % 2) * 76, 153 + Math.floor(i / 2) * 10, unlocked ? '#80f0ff' : COLORS.disabled);
      }
    }
    ui.window(ctx, 4, 170, 312, 66);
    this.app.font.wrap(def.bio, 296).slice(0, 5).forEach((l, i) => ui.text(ctx, l, 12, 177 + i * 11, COLORS.title));
  }

  private renderJournal(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const g = this.g;
    const tabs = ['journal.quests', 'journal.bonds', 'journal.collection'];
    ui.window(ctx, 4, 4, 312, 20);
    tabs.forEach((t, i) => ui.text(ctx, str.t(t), 16 + i * 104, 10, i === this.journalTab ? COLORS.gold : COLORS.dim));
    ui.window(ctx, 4, 26, 312, 210);
    if (this.journalTab === 0) {
      let y = 34;
      const qs = Object.values(g.data.quests).filter((q) => (g.s.quests[q.id] ?? 0) > 0);
      if (!qs.length) ui.text(ctx, str.t('journal.no_quests'), 14, y, COLORS.dim);
      for (const q of qs) {
        const step = g.s.quests[q.id] ?? 0;
        const done = step > q.steps.length;
        ui.text(ctx, `${done ? '★' : '●'} ${q.name}`, 14, y, done ? COLORS.gold : COLORS.text);
        y += 11;
        const txt = done ? str.t(q.reward) : str.t(q.steps[Math.min(q.steps.length, Math.max(1, step)) - 1]);
        for (const l of this.app.font.wrap(txt, 284).slice(0, 2)) {
          ui.text(ctx, l, 24, y, COLORS.dim);
          y += 10;
        }
        y += 3;
      }
    } else if (this.journalTab === 1) {
      const rows: [string, string, number][] = [];
      if (g.s.roster.tao) rows.push(['tao', g.char('tao').name, g.s.trust.tao ?? 0]);
      if (g.s.roster.miri) rows.push(['miri', g.char('miri').name, g.s.trust.miri ?? 0]);
      if (g.s.pipo) rows.push(['pipo', str.t('menu.pipo_name'), g.s.trust.pipo ?? 0]);
      if (!rows.length) ui.text(ctx, str.t('journal.no_bonds'), 14, 34, COLORS.dim);
      rows.forEach(([look, name, v], i) => {
        const y = 34 + i * 58;
        ui.portrait(ctx, g.char(look).look, v >= 3 ? 'happy' : v < 0 ? 'sad' : 'normal', 14, y, true);
        ui.text(ctx, name, 70, y + 4, COLORS.gold);
        const hearts = Math.max(0, Math.min(8, v + 2));
        ui.text(ctx, '♥'.repeat(hearts) + '·'.repeat(Math.max(0, 8 - hearts)), 70, y + 18, '#f080a0');
        ui.text(ctx, str.t(`bond.${look}.${v >= 4 ? 'high' : v >= 1 ? 'mid' : v >= 0 ? 'low' : 'neg'}`), 70, y + 30, COLORS.dim);
      });
    } else {
      const tiles = g.data.paisho.tiles;
      ui.text(ctx, str.t('journal.paisho', { n: Object.keys(g.s.paisho.tiles).length, total: tiles.length }), 14, 34, COLORS.title);
      tiles.forEach((t, i) => {
        const owned = (g.s.paisho.tiles[t.id] ?? 0) > 0;
        ui.text(ctx, owned ? `${t.name} (${t.value})` : '???', 14 + (i % 3) * 100, 48 + Math.floor(i / 3) * 11, owned ? COLORS.text : COLORS.disabled);
      });
      const ry = 48 + Math.ceil(tiles.length / 3) * 11 + 6;
      ui.text(ctx, str.t('journal.radio', { n: g.s.radio.length, total: g.data.radio.length }), 14, ry, COLORS.title);
      g.data.radio.forEach((r, i) => ui.text(ctx, g.s.radio.includes(r.id) ? `${r.freq.toFixed(1)} — ${r.name}` : '???', 14, ry + 12 + i * 11, g.s.radio.includes(r.id) ? COLORS.text : COLORS.disabled));
      ui.text(ctx, str.t('journal.secrets', { n: g.s.stats.secrets.length }), 14, 222, COLORS.dim);
    }
  }
}
