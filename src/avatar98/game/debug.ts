import type { App, Scene } from '../app.ts';
import type { Game } from './state.ts';
import type { MapScene } from './mapscene.ts';
import { ListMenu, COLORS, type MenuItem } from './ui.ts';
import { exprIdentifiers } from '../core/expr.ts';
import { commandName } from '../data/validate.ts';
import type { Command } from '../data/types.ts';

type Page = 'root' | 'battle' | 'items' | 'maps' | 'spawns' | 'flags' | 'party' | 'gallery';

export class DebugScene implements Scene {
  opaque = false;
  private app: App;
  private g: Game;
  private page: Page = 'root';
  private menu: ListMenu;
  private stack: ListMenu[] = [];
  private mapPick = '';
  private note = '';
  private galleryIdx = 0;

  constructor(app: App) {
    this.app = app;
    this.g = app.game as Game;
    this.menu = this.rootMenu();
  }

  private mk(items: MenuItem[]): ListMenu {
    const m = new ListMenu(items, 16);
    m.lineH = 11;
    m.soundMove = () => this.app.sfx('cursor');
    return m;
  }

  private rootMenu(): ListMenu {
    return this.mk([
      { label: 'Бой с любым отрядом', value: 'battle' },
      { label: 'Выдать предметы', value: 'items' },
      { label: 'Телепорт по картам', value: 'maps' },
      { label: 'Сюжетные флаги', value: 'flags' },
      { label: 'Отряд и уровни', value: 'party' },
      { label: 'Полное исцеление', value: 'heal' },
      { label: '+5000 юаней', value: 'gold' },
      { label: 'Галерея спрайтов', value: 'gallery' },
      { label: 'Экспорт тайлсета PNG', value: 'tileset' },
      { label: 'Закрыть (F9)', value: 'close' }
    ]);
  }

  private mapScene(): MapScene | null {
    return (this.app.scenes.find((s) => (s as MapScene).runner !== undefined && (s as MapScene).world !== undefined) as MapScene) ?? null;
  }

  private allFlags(): string[] {
    const set = new Set<string>();
    const scan = (cmds: Command[]) => {
      for (const c of cmds) {
        const n = commandName(c);
        if (n === 'flag') set.add(c.flag as string);
        if (n === 'unflag') set.add(c.unflag as string);
        if (n === 'if' || n === 'opt') for (const id of exprIdentifiers(c[n] as string)) if (!id.includes('.')) set.add(id);
        for (const k of ['then', 'else', 'win', 'lose']) if (Array.isArray(c[k])) scan(c[k] as Command[]);
        if (Array.isArray(c.branches)) for (const b of c.branches as Command[][]) scan(b);
      }
    };
    for (const cmds of Object.values(this.g.data.events)) scan(cmds);
    for (const m of Object.values(this.g.data.maps)) for (const e of m.entities) {
      if (e.once) set.add(e.once);
      for (const src of [e.if, e.solidIf]) if (src) for (const id of exprIdentifiers(src)) if (!id.includes('.')) set.add(id);
    }
    return [...set].sort();
  }

  private open(page: Page): void {
    this.stack.push(this.menu);
    this.page = page;
    const g = this.g;
    switch (page) {
      case 'battle':
        this.menu = this.mk(Object.values(g.data.troops).map((t) => ({ label: t.id, right: t.enemies.map((e) => g.data.enemies[e.enemy].name.slice(0, 8)).join(','), value: t.id })));
        break;
      case 'items':
        this.menu = this.mk([{ label: '★ Всё понемногу', value: '__all' }, ...Object.values(g.data.items).map((it) => ({ label: it.name, right: it.type, value: it.id }))]);
        break;
      case 'maps':
        this.menu = this.mk(Object.values(g.data.maps).map((m) => ({ label: m.id, right: `${m.w}x${m.h}`, value: m.id })));
        break;
      case 'spawns':
        this.menu = this.mk(Object.keys(g.data.maps[this.mapPick].spawns).map((s) => ({ label: s, value: s })));
        break;
      case 'flags':
        this.menu = this.mk(this.allFlags().map((f) => ({ label: f, right: g.flag(f) ? 'ВКЛ' : '—', value: f, color: g.flag(f) ? '#80f0a0' : undefined })));
        break;
      case 'party':
        this.menu = this.mk([
          ...Object.keys(g.data.characters).filter((c) => g.data.characters[c].combat).map((c) => ({ label: `${g.s.roster[c] ? '+' : ' '} ${g.data.characters[c].name} ${g.s.roster[c] ? `ур.${g.s.roster[c].level}` : ''}`, value: `join:${c}` })),
          { label: 'Пипо следует', value: 'pipo' },
          { label: 'Уровень +1 всем', value: 'lvl1' },
          { label: 'Уровень 5 / 10 / 15', value: 'lvlcycle' },
          { label: 'Лимит Исы 100%', value: 'limit' },
          { label: 'Земля Исы (Каменный шаг)', value: 'earth' }
        ]);
        break;
      case 'gallery':
        this.galleryIdx = 0;
        break;
    }
  }

  private back(): void {
    const m = this.stack.pop();
    if (!m) {
      this.app.pop();
      return;
    }
    this.menu = m;
    this.page = this.stack.length ? (this.page === 'spawns' ? 'maps' : 'root') : 'root';
  }

  update(): void {
    const inp = this.app.input;
    if (inp.pressed('debug')) {
      this.app.pop();
      return;
    }
    if (this.page === 'gallery') {
      const looks = Object.keys(this.g.data.looks);
      if (inp.repeat('right')) this.galleryIdx = (this.galleryIdx + 1) % looks.length;
      if (inp.repeat('left')) this.galleryIdx = (this.galleryIdx + looks.length - 1) % looks.length;
      if (inp.pressed('cancel')) this.back();
      return;
    }
    const r = this.menu.update(inp);
    if (r === 'cancel') return this.back();
    if (r !== 'confirm') return;
    const v = this.menu.current?.value as string;
    const g = this.g;
    const ms = this.mapScene();
    switch (this.page) {
      case 'root':
        if (v === 'close') this.app.pop();
        else if (v === 'heal') {
          g.healAll();
          this.note = 'Отряд исцелён';
        } else if (v === 'gold') {
          g.addGold(5000);
          this.note = '+5000';
        } else if (v === 'tileset') {
          const ids = Object.keys(g.data.tiles.tiles);
          const sheet = this.app.sprites.tileSheet(ids);
          sheet.toBlob((b) => {
            if (!b) return;
            const url = URL.createObjectURL(b);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'avatar98_tiles.png';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          });
          this.note = 'avatar98_tiles.png';
        } else this.open(v as Page);
        break;
      case 'battle':
        if (ms) {
          this.app.pop();
          ms.startBattle(v);
        }
        break;
      case 'items':
        if (v === '__all') {
          for (const it of Object.values(g.data.items)) if (it.type === 'consumable') g.give(it.id, 5);
          for (const it of Object.values(g.data.items)) if (it.type !== 'consumable' && it.type !== 'key') g.give(it.id, 1);
          this.note = 'Выдано';
        } else {
          g.give(v, 1);
          this.note = `+ ${g.item(v).name}`;
        }
        break;
      case 'maps':
        this.mapPick = v;
        this.open('spawns');
        break;
      case 'spawns':
        if (ms) {
          this.app.pop();
          ms.runner.abort();
          ms.changeMap(this.mapPick, v, undefined, true);
        }
        break;
      case 'flags':
        g.setFlag(v, !g.flag(v));
        this.menu.items[this.menu.index] = { label: v, right: g.flag(v) ? 'ВКЛ' : '—', value: v, color: g.flag(v) ? '#80f0a0' : undefined };
        if (ms) ms.world.refresh();
        break;
      case 'party':
        if (v.startsWith('join:')) {
          const id = v.slice(5);
          if (g.s.party.includes(id) && id !== 'isa') g.leave(id);
          else g.join(id);
        } else if (v === 'pipo') g.s.pipo = !g.s.pipo;
        else if (v === 'lvl1') for (const id of Object.keys(g.s.roster)) g.setLevel(id, g.cs(id).level + 1);
        else if (v === 'lvlcycle') {
          const cur = g.cs('isa').level;
          const next = cur < 5 ? 5 : cur < 10 ? 10 : 15;
          for (const id of Object.keys(g.s.roster)) g.setLevel(id, next);
        } else if (v === 'limit') g.cs('isa').limit = 100;
        else if (v === 'earth') g.setFlag('isa_earth');
        ms?.setupFollowers();
        this.note = 'Готово';
        this.stack.pop();
        this.open('party');
        break;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    if (this.page === 'gallery') {
      ctx.fillStyle = '#202030';
      ctx.fillRect(0, 0, 320, 240);
      const looks = Object.keys(this.g.data.looks);
      const id = looks[this.galleryIdx];
      const sp = this.app.sprites;
      ui.text(ctx, `${this.galleryIdx + 1}/${looks.length} ${id} (${sp.look(id).kind})`, 8, 8, COLORS.gold);
      (['down', 'up', 'left', 'right'] as const).forEach((d, i) => {
        for (let f = 0; f < 3; f++) ctx.drawImage(sp.walkFrame(id, d, f === 0 ? 0 : f === 1 ? 1 : 3), 8 + f * 18 + i * 60, 24);
      });
      if (sp.isHuman(id)) {
        (['strike', 'cast', 'hurt', 'guard', 'victory', 'kneel'] as const).forEach((p, i) => ctx.drawImage(sp.pose(id, p, 'left'), 8 + i * 20, 64));
        ctx.drawImage(sp.pose(id, 'ko', 'left'), 136, 80);
      }
      (['normal', 'happy', 'angry', 'sad', 'surprised'] as const).forEach((e, i) => {
        const p = sp.portrait(id, e);
        if (p) ctx.drawImage(p, 8 + i * 52, 104);
      });
      if (!sp.isProp(id) && !sp.isHuman(id)) {
        try {
          ctx.drawImage(sp.battleSprite(id, 0), 8, 160);
          ctx.drawImage(sp.battleSprite(id, 0, 'core'), 100, 160);
        } catch {
          ui.text(ctx, '—', 8, 170);
        }
      }
      ui.text(ctx, '◀ ▶ листать, X назад', 8, 228, COLORS.dim);
      return;
    }
    ui.window(ctx, 20, 8, 280, 224, 'dark', 0.95);
    ui.text(ctx, 'ОТЛАДКА (F9)', 30, 14, '#f08040');
    this.menu.render(ctx, ui, 44, 28, 250);
    if (this.note) ui.textRight(ctx, this.note, 292, 14, '#80f0a0');
  }
}
