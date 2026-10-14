import type { App, Scene } from '../../app.ts';
import type { Game } from '../state.ts';
import { Battle, type Actor, type ActionResult, type Cmd, type Hit, type Rewards } from './core.ts';
import { paintBattleBg } from './bg.ts';
import { DialogueBox, ListMenu, COLORS, parseLine, type MenuItem } from '../ui.ts';
import { Particles } from '../../gfx/particles.ts';
import { str } from '../../core/i18n.ts';
import { SCREEN_H, SCREEN_W } from '../../config.ts';
import { Rng } from '../../core/rng.ts';
import type { TechniqueDef, Element } from '../../data/types.ts';
import { makeCanvas } from '../../gfx/pixel.ts';

interface Popup {
  x: number;
  y: number;
  text: string;
  color: string;
  t: number;
  big: boolean;
}

interface Visual {
  dx: number;
  dy: number;
  flash: number;
  fade: number;
  shake: number;
  pose: string | null;
  poseT: number;
}

interface MenuState {
  kind: 'root' | 'tech' | 'item' | 'stance' | 'target';
  list: ListMenu | null;
  targetKind?: string;
  targets?: Actor[];
  targetIndex?: number;
  pending?: Cmd;
  allMode?: boolean;
}

interface Anim {
  res: ActionResult;
  t: number;
  hitAt: number;
  end: number;
  hitDone: boolean;
}

const ENEMY_LAYOUT: Record<number, [number, number][]> = {
  1: [[86, 118]],
  2: [[64, 104], [118, 132]],
  3: [[58, 96], [122, 112], [66, 140]],
  4: [[46, 98], [108, 98], [58, 142], [122, 142]]
};

const ELEMENT_FLASH: Record<string, string> = { fire: '#ff8040', earth: '#c0a070', metal: '#e0e8f0', chi: '#c0b0ff', spirit: '#80e0ff' };

export class BattleScene implements Scene {
  opaque = true;
  countsPlaytime = true;
  readonly app: App;
  readonly game: Game;
  readonly battle: Battle;
  private done: (r: 'win' | 'lose' | 'escape') => void;
  private bg: HTMLCanvasElement;
  private state: 'intro' | 'fight' | 'victory' | 'defeat' | 'escape' | 'exit' = 'intro';
  private introT = 0;
  private snapshot: HTMLCanvasElement;
  private shards: { x: number; y: number; w: number; h: number; vx: number; vy: number; rot: number; vr: number }[] = [];
  private ready: Actor[] = [];
  private active: Actor | null = null;
  private menus: MenuState[] = [];
  private anim: Anim | null = null;
  private popups: Popup[] = [];
  private banner: { text: string; t: number } | null = null;
  private vis = new Map<number, Visual>();
  private fx = new Particles();
  private dlg: DialogueBox;
  private rewards: Rewards | null = null;
  private resultT = 0;
  private tutorialShown = false;
  private t = 0;
  private rng = new Rng(31337);
  private help: string | null = null;
  private tickDelay = 0;
  private elementFlash: { color: string; t: number } | null = null;

  constructor(app: App, troop: string, done: (r: 'win' | 'lose' | 'escape') => void) {
    this.app = app;
    this.game = app.game as Game;
    this.done = done;
    this.battle = new Battle(this.game, troop, new Rng((Date.now() ^ (this.game.s.playtime * 2654435761)) >>> 0), app.scannedEnemies);
    this.battle.speed = app.battleSpeed;
    this.bg = paintBattleBg(this.battle.troop.bg);
    this.dlg = new DialogueBox(app.ui);
    this.dlg.pos = 'top';
    this.dlg.onBlip = () => app.sfx('blip');
    for (const a of this.battle.actors) this.vis.set(a.uid, { dx: 0, dy: 0, flash: 0, fade: 0, shake: 0, pose: null, poseT: 0 });
    const [snap, sctx] = makeCanvas(SCREEN_W, SCREEN_H);
    sctx.drawImage(app.screen.buffer, 0, 0);
    this.snapshot = snap;
    const cols = 8;
    const rows = 6;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const w = SCREEN_W / cols;
      const h = SCREEN_H / rows;
      const cx = x * w + w / 2 - SCREEN_W / 2;
      const cy = y * h + h / 2 - SCREEN_H / 2;
      this.shards.push({ x: x * w, y: y * h, w, h, vx: cx * 0.04 + this.rng.range(-1, 1), vy: cy * 0.04 + this.rng.range(-2, 0), rot: 0, vr: this.rng.range(-0.08, 0.08) });
    }
  }

  enter(): void {
    this.app.setFade(0);
    this.app.music(this.battle.troop.music ?? 'battle');
    this.app.sfx('battle_start');
  }

  private v(a: Actor): Visual {
    return this.vis.get(a.uid) as Visual;
  }

  pos(a: Actor): { x: number; y: number } {
    if (a.side === 'party') return { x: 246 + a.slot * 10, y: 88 + a.slot * 26 };
    const n = this.battle.enemies.length;
    const tr = this.battle.troop.enemies[a.slot];
    if (tr?.x !== undefined && tr.y !== undefined) return { x: tr.x, y: tr.y };
    const lay = ENEMY_LAYOUT[n] ?? ENEMY_LAYOUT[4];
    const p = lay[a.slot] ?? [80, 120];
    if (a.boss && n === 1) return { x: 92, y: 138 };
    return { x: p[0], y: p[1] };
  }

  private sprite(a: Actor): HTMLCanvasElement {
    const sp = this.app.sprites;
    const vis = this.v(a);
    if (a.side === 'enemy') {
      const fr = vis.pose === 'strike' ? 1 : vis.pose === 'cast' ? 2 : vis.pose === 'hurt' ? 3 : Math.floor(this.t / 24) % 2;
      const look = sp.look(a.look);
      if (look.kind === 'human') return sp.battleSprite(a.look, vis.pose === 'strike' ? 1 : vis.pose === 'cast' ? 2 : vis.pose === 'hurt' ? 3 : 0);
      return sp.battleSprite(a.look, fr, a.variant);
    }
    if (!a.alive) return sp.pose(a.look, 'ko', 'left');
    if (vis.pose) return sp.pose(a.look, vis.pose as never, 'left');
    if (this.state === 'victory') return sp.pose(a.look, 'victory', 'left');
    if (a.defending) return sp.pose(a.look, 'guard', 'left');
    if (a.hp / a.maxHp < 0.25) return sp.pose(a.look, 'kneel', 'left');
    return sp.walkFrame(a.look, 'left', this.active === a ? Math.floor(this.t / 8) % 4 : 0);
  }

  private say(key: string): void {
    const lines = str.dialogue(key).map((l) => parseLine(l, this.game.data.speakers, this.game.s.name));
    this.dlg.push(lines);
  }

  private popup(a: Actor, text: string, color: string, big = false, offset = 0): void {
    const p = this.pos(a);
    const h = a.side === 'party' ? 30 : this.sprite(a).height;
    this.popups.push({ x: p.x + (a.side === 'party' ? 0 : 0), y: p.y - h / 2 - offset * 9, text, color, t: 0, big });
  }

  private hitText(h: Hit): [string, string] | null {
    switch (h.kind) {
      case 'damage':
        return [String(h.amount), h.crit ? '#ffe040' : (h.mult ?? 1) > 1.05 ? '#ffb080' : (h.mult ?? 1) < 0.95 ? '#a0a0c0' : '#ffffff'];
      case 'heal':
      case 'absorb':
      case 'revive':
        return [String(h.amount), COLORS.heal];
      case 'mp':
        return [`${h.amount} ${str.t('ui.mp')}`, COLORS.mp];
      case 'miss':
        return [str.t('battle.miss'), '#c0c0e0'];
      case 'immune':
        return [str.t('battle.immune'), '#c0c0e0'];
      case 'resist':
        return [str.t('battle.resist'), '#c0c0e0'];
      case 'status':
        return [this.game.data.statuses[h.status as string]?.name ?? '', this.game.data.statuses[h.status as string]?.color ?? '#fff'];
      case 'cure':
        return [str.t('battle.cured'), COLORS.heal];
      case 'steal':
        return [str.t('battle.stolen', { item: this.game.item(h.item as string).name }), '#f8d860'];
      case 'stealFail':
        return [str.t('battle.steal_fail'), '#c0c0e0'];
      case 'stealNone':
        return [str.t('battle.steal_none'), '#c0c0e0'];
      case 'shield':
        return [str.t('battle.shield'), '#d0e0f0'];
      case 'scan':
        return [str.t('battle.scanned'), '#a0e0ff'];
      case 'atb':
        return [str.t('battle.delay'), '#a0c0ff'];
      default:
        return null;
    }
  }

  private applyHits(hits: Hit[]): void {
    const counts = new Map<number, number>();
    for (const h of hits) {
      const target = this.battle.byUid(h.target);
      const vis = this.v(target);
      const k = counts.get(h.target) ?? 0;
      counts.set(h.target, k + 1);
      const txt = this.hitText(h);
      if (txt) this.popup(target, txt[0], txt[1], h.kind === 'damage' && !!h.crit, k);
      if (h.kind === 'damage') {
        vis.flash = 10;
        vis.shake = 10;
        if (target.side === 'party') vis.pose = 'hurt';
        vis.poseT = 16;
        this.app.sfx(h.crit ? 'crit' : (h.mult ?? 1) > 1.05 ? 'hit_weak' : 'hit');
        if (h.crit) this.app.shake(10, 3);
      }
      if (h.kind === 'ko') {
        if (target.side === 'enemy') {
          vis.fade = 1;
          this.app.sfx(target.boss ? 'boss_die' : 'enemy_die');
        } else this.app.sfx('ko');
      }
      if (h.kind === 'revive') vis.fade = 0;
      if (h.kind === 'scan' && target.enemy) this.showScan(target);
      if (h.kind === 'steal') this.app.sfx('item');
    }
  }

  private showScan(a: Actor): void {
    const els: Element[] = ['fire', 'earth', 'metal', 'chi', 'spirit', 'phys'];
    const weak = els.filter((e) => this.battle.elemMult(a, e) > 1.05).map((e) => this.game.data.elements.names[e]);
    const res = els.filter((e) => this.battle.elemMult(a, e) < 0.95 && this.battle.elemMult(a, e) >= 0).map((e) => this.game.data.elements.names[e]);
    const abs = els.filter((e) => this.battle.elemMult(a, e) < 0).map((e) => this.game.data.elements.names[e]);
    const desc = str.hasDialogue(a.enemy?.scan ?? '') ? str.dialogue(a.enemy?.scan as string)[0].replace(/^[^|]*\|/, '') : str.t(a.enemy?.scan as string);
    const lines = [
      `|${a.name} — ${str.t('battle.level')} ${a.level}. ${str.t('ui.hp')} ${a.hp}/${a.maxHp}. ${desc}`,
      `|${str.t('battle.weak')}: ${weak.join(', ') || '—'}. ${str.t('battle.strong')}: ${res.join(', ') || '—'}.${abs.length ? ` ${str.t('battle.absorbs')}: ${abs.join(', ')}.` : ''}`
    ];
    this.dlg.push(lines.map((l) => parseLine(l, {}, '')));
  }

  private startAnim(res: ActionResult): void {
    const a = res.actor;
    const vis = this.v(a);
    const isAttack = res.cmd.kind === 'attack';
    if (res.failed) {
      const key = res.failed === 'escape' ? 'battle.escape_fail' : res.failed === 'drain' ? 'battle.fail_drain' : res.failed === 'opora' ? 'battle.fail_opora' : res.failed === 'item' ? 'battle.fail_item' : 'battle.fail_mp';
      this.banner = { text: str.t(key), t: 60 };
      this.app.sfx('error');
      this.anim = { res, t: 0, hitAt: 999, end: 40, hitDone: true };
      return;
    }
    if (res.escaped) {
      this.banner = { text: str.t('battle.escaped'), t: 80 };
      this.app.sfx('run');
      this.anim = { res, t: 0, hitAt: 999, end: 50, hitDone: true };
      return;
    }
    let name = res.name;
    if (res.cmd.kind === 'defend') name = str.t('battle.defend');
    if (!isAttack || a.side === 'enemy') this.banner = { text: isAttack ? a.name : name, t: 70 };
    if (res.limit) {
      this.app.flash('#ffffff', 30);
      this.app.shake(30, 3);
      this.app.sfx('avatar');
      this.banner = { text: `${str.t('battle.avatar_state')}: ${name}`, t: 100 };
    }
    vis.pose = res.anim === 'cast' ? 'cast' : res.anim === 'throw' ? 'strike' : 'strike';
    vis.poseT = 40;
    const hitAt = res.limit ? 46 : res.cmd.kind === 'defend' ? 10 : 22;
    this.anim = { res, t: 0, hitAt, end: hitAt + (res.limit ? 70 : 36), hitDone: false };
    if (res.cmd.kind !== 'defend' && res.cmd.kind !== 'item') this.app.sfx(a.side === 'party' ? 'swing' : 'enemy_act');
    if (a.side === 'enemy') vis.flash = 8;
  }

  private updateAnim(): void {
    const an = this.anim;
    if (!an) return;
    an.t++;
    const a = an.res.actor;
    const vis = this.v(a);
    const dir = a.side === 'party' ? -1 : 1;
    const lunge = an.res.anim === 'dash' || an.res.cmd.kind === 'attack' ? 22 : 10;
    if (an.t < an.hitAt) vis.dx = dir * lunge * Math.min(1, an.t / 10);
    else vis.dx = dir * lunge * Math.max(0, 1 - (an.t - an.hitAt) / 14);
    if (an.t === an.hitAt && !an.hitDone) {
      an.hitDone = true;
      const res = an.res;
      this.app.sfx(res.sfx);
      if (res.element && res.element !== 'phys') this.elementFlash = { color: ELEMENT_FLASH[res.element] ?? '#ffffff', t: 14 };
      const targets = new Set(res.hits.map((h) => h.target));
      if (!targets.size && res.cmd.kind === 'defend') targets.add(a.uid);
      for (const uid of targets) {
        const tg = this.battle.byUid(uid);
        const p = this.pos(tg);
        const h = tg.side === 'party' ? 30 : this.sprite(tg).height;
        this.fx.burst(res.fx, p.x, p.y - h / 2, res.limit ? 2 : 1);
      }
      if (res.limit) {
        for (let i = 0; i < 6; i++) this.fx.burst('fire', 40 + i * 20, 100 + (i % 2) * 20, 1.4);
      }
      this.applyHits(res.hits);
    }
    if (an.t >= an.end) {
      vis.dx = 0;
      this.anim = null;
    }
  }

  private processEvents(): void {
    const evs = this.battle.events.splice(0);
    for (const ev of evs) {
      if (ev.type === 'ready' && ev.actor.side === 'party') this.ready.push(ev.actor);
      if (ev.type === 'tick') {
        this.applyHits(ev.hits);
        if (ev.skipped) this.popup(ev.actor, str.t('battle.stunned'), '#f0e040');
        this.tickDelay = 20;
      }
      if (ev.type === 'phase') {
        this.app.flash(ev.flash ?? '#ffffff', 24);
        this.app.shake(24, 3);
        this.app.sfx('phase');
        if (ev.say) this.say(ev.say);
      }
    }
  }

  private techsFor(a: Actor): TechniqueDef[] {
    const all = this.game.techniques(a.id);
    const stances = this.game.data.stances;
    return all.filter((t) => !(t.group && stances[t.group]) || t.group === a.stance);
  }

  private battleItems(): string[] {
    return Object.keys(this.game.s.items).filter((id) => {
      const it = this.game.data.items[id];
      return it && it.type === 'consumable' && it.use?.battle && this.game.count(id) > 0;
    });
  }

  private openRoot(a: Actor): void {
    this.active = a;
    this.app.sfx('ready');
    const limit = this.battle.limitReady(a);
    const items: MenuItem[] = [
      { label: limit ? str.t('battle.cmd_avatar') : str.t('battle.cmd_attack'), value: limit ? 'limit' : 'attack', color: limit ? '#80f0ff' : undefined },
      { label: str.t('battle.cmd_tech'), value: 'tech', enabled: this.techsFor(a).length > 0 },
      { label: str.t('battle.cmd_item'), value: 'item', enabled: this.battleItems().length > 0 }
    ];
    if (a.stance) items.push({ label: str.t('battle.cmd_stance'), value: 'stance', enabled: !a.stanceChanged, right: this.game.data.stances[a.stance].name });
    items.push({ label: str.t('battle.cmd_defend'), value: 'defend' });
    items.push({ label: str.t('battle.cmd_run'), value: 'escape', enabled: this.battle.troop.escape });
    if (limit) items.splice(1, 0, { label: str.t('battle.cmd_attack'), value: 'attack' });
    const m = new ListMenu(items, 7);
    m.soundMove = () => this.app.sfx('cursor');
    m.soundBuzz = () => this.app.sfx('error');
    this.menus = [{ kind: 'root', list: m }];
  }

  private openTargets(pending: Cmd, kind: string): void {
    const b = this.battle;
    let targets: Actor[] = [];
    let allMode = false;
    const a = b.byUid(pending.actor);
    if (kind === 'enemy') targets = b.alive('enemy');
    else if (kind === 'ally') targets = b.alive('party');
    else if (kind === 'ally_dead') targets = b.party.filter((p) => !p.alive);
    else if (kind === 'enemies') {
      targets = b.alive('enemy');
      allMode = true;
    } else if (kind === 'allies') {
      targets = b.alive('party');
      allMode = true;
    } else if (kind === 'self') {
      targets = [a];
      allMode = true;
    } else if (kind === 'all') {
      targets = b.actors.filter((x) => x.alive);
      allMode = true;
    }
    if (!targets.length) {
      this.app.sfx('error');
      return;
    }
    let idx = 0;
    if (kind === 'enemy') {
      const weakest = targets.reduce((m, x, i) => (x.hp < targets[m].hp ? i : m), 0);
      idx = weakest;
    }
    if (kind === 'ally') idx = targets.reduce((m, x, i) => (x.hp / x.maxHp < targets[m].hp / targets[m].maxHp ? i : m), 0);
    this.menus.push({ kind: 'target', list: null, targetKind: kind, targets, targetIndex: idx, pending, allMode });
  }

  private submit(cmd: Cmd): void {
    this.battle.submit(cmd);
    this.app.sfx('confirm');
    this.menus = [];
    this.ready = this.ready.filter((r) => r !== this.active);
    this.active = null;
    this.help = null;
  }

  private updateMenus(): void {
    const inp = this.app.input;
    const b = this.battle;
    if (!this.active) {
      this.ready = this.ready.filter((r) => r.alive && r.ready && !b.queue.some((c) => c.actor === r.uid));
      if (this.ready.length && !this.anim) this.openRoot(this.ready[0]);
      return;
    }
    const a = this.active;
    if (!a.alive || !a.ready) {
      this.menus = [];
      this.active = null;
      return;
    }
    const top = this.menus[this.menus.length - 1];
    if (!top) return;
    if (top.kind === 'root' && inp.pressed('extra') && this.ready.length > 1) {
      this.ready.push(this.ready.shift() as Actor);
      this.active = null;
      this.menus = [];
      return;
    }
    if (top.kind === 'target') {
      const tg = top.targets as Actor[];
      if (!top.allMode) {
        if (inp.repeat('up') || inp.repeat('left')) {
          top.targetIndex = ((top.targetIndex ?? 0) - 1 + tg.length) % tg.length;
          this.app.sfx('cursor');
        }
        if (inp.repeat('down') || inp.repeat('right')) {
          top.targetIndex = ((top.targetIndex ?? 0) + 1) % tg.length;
          this.app.sfx('cursor');
        }
      }
      const cur = tg[top.targetIndex ?? 0];
      if (cur) this.help = `${cur.name}${cur.side === 'enemy' && (cur.scanned || this.app.scannedEnemies.has(cur.id)) ? `  ${str.t('ui.hp')} ${cur.hp}/${cur.maxHp}` : ''}`;
      if (inp.pressed('confirm')) {
        const cmd = { ...(top.pending as Cmd), targets: top.allMode ? [] : [cur.uid] };
        this.submit(cmd);
      } else if (inp.pressed('cancel')) {
        this.menus.pop();
        this.app.sfx('cancel');
        this.help = null;
      }
      return;
    }
    const list = top.list as ListMenu;
    const r = list.update(inp);
    const it = list.current;
    if (top.kind === 'tech' && it) this.help = (it.value as TechniqueDef).desc;
    else if (top.kind === 'item' && it) this.help = this.game.item(it.value as string).desc;
    else if (top.kind === 'stance' && it) this.help = this.game.data.stances[it.value as string].desc;
    else this.help = null;
    if (r === 'cancel') {
      if (this.menus.length > 1) {
        this.menus.pop();
        this.app.sfx('cancel');
      }
      return;
    }
    if (r !== 'confirm' || !it) return;
    this.app.sfx('cursor_ok');
    if (top.kind === 'root') {
      switch (it.value) {
        case 'attack':
          this.openTargets({ kind: 'attack', actor: a.uid, targets: [] }, 'enemy');
          break;
        case 'limit':
          this.openTargets({ kind: 'limit', actor: a.uid, targets: [] }, 'enemies');
          break;
        case 'defend':
          this.submit({ kind: 'defend', actor: a.uid, targets: [] });
          break;
        case 'escape':
          this.submit({ kind: 'escape', actor: a.uid, targets: [] });
          break;
        case 'tech': {
          const techs = this.techsFor(a);
          const items: MenuItem[] = techs.map((t) => {
            const ok = b.canUseTech(a, t) === 'ok';
            let right = `${t.cost?.mp ?? 0}`;
            if (t.cost?.opora) right = `◆${t.cost.opora} ${right}`;
            else if (t.requires?.opora) right = `◇${t.requires.opora} ${right}`;
            return { label: t.name, right, enabled: ok, value: t };
          });
          const m = new ListMenu(items, 6);
          m.soundMove = () => this.app.sfx('cursor');
          m.soundBuzz = () => this.app.sfx('error');
          this.menus.push({ kind: 'tech', list: m });
          break;
        }
        case 'item': {
          const items: MenuItem[] = this.battleItems().map((id) => ({ label: this.game.item(id).name, right: `×${this.game.count(id)}`, value: id, icon: this.game.item(id).icon }));
          const m = new ListMenu(items, 6);
          m.soundMove = () => this.app.sfx('cursor');
          this.menus.push({ kind: 'item', list: m });
          break;
        }
        case 'stance': {
          const def = this.game.char(a.id);
          const items: MenuItem[] = (def.stances ?? []).map((s) => ({ label: this.game.data.stances[s].name, value: s, color: this.game.data.stances[s].color, right: s === a.stance ? '●' : '', enabled: s !== a.stance }));
          const m = new ListMenu(items, 4);
          m.soundMove = () => this.app.sfx('cursor');
          m.soundBuzz = () => this.app.sfx('error');
          this.menus.push({ kind: 'stance', list: m });
          break;
        }
      }
      return;
    }
    if (top.kind === 'tech') {
      const t = it.value as TechniqueDef;
      this.openTargets({ kind: 'tech', actor: a.uid, tech: t.id, targets: [] }, t.target);
      return;
    }
    if (top.kind === 'item') {
      const id = it.value as string;
      const def = this.game.item(id);
      this.openTargets({ kind: 'item', actor: a.uid, item: id, targets: [] }, def.use?.target ?? 'ally');
      return;
    }
    if (top.kind === 'stance') {
      if (b.changeStance(a, it.value as string)) {
        this.app.sfx('stance');
        const p = this.pos(a);
        this.fx.burst('buff_fire', p.x, p.y - 16);
        this.popup(a, this.game.data.stances[it.value as string].name, this.game.data.stances[it.value as string].color);
        this.openRoot(a);
      }
    }
  }

  update(): void {
    this.t++;
    const app = this.app;
    this.fx.update();
    for (const p of this.popups) p.t++;
    this.popups = this.popups.filter((p) => p.t < 60);
    for (const vis of this.vis.values()) {
      if (vis.flash > 0) vis.flash--;
      if (vis.shake > 0) vis.shake--;
      if (vis.poseT > 0) {
        vis.poseT--;
        if (vis.poseT === 0) vis.pose = null;
      }
      if (vis.fade > 0 && vis.fade < 40) vis.fade++;
    }
    if (this.banner) {
      this.banner.t--;
      if (this.banner.t <= 0) this.banner = null;
    }
    if (this.elementFlash) {
      this.elementFlash.t--;
      if (this.elementFlash.t <= 0) this.elementFlash = null;
    }
    if (this.state === 'intro') {
      this.introT++;
      for (const s of this.shards) {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.25;
        s.rot += s.vr;
      }
      if (this.introT === 40) {
        this.state = 'fight';
        if (this.battle.troop.intro) this.say(this.battle.troop.intro);
      }
      return;
    }
    if (this.dlg.active) {
      this.dlg.speed = app.textSpeed;
      this.dlg.update(app.input);
      return;
    }
    if (this.state === 'victory' || this.state === 'defeat' || this.state === 'escape') {
      this.resultT++;
      if (this.state === 'victory' && this.resultT > 30 && (app.input.pressed('confirm') || app.input.pressed('cancel'))) this.leave('win');
      if (this.state === 'defeat' && this.resultT > 120) this.leave('lose');
      if (this.state === 'escape' && this.resultT > 40) this.leave('escape');
      if (this.state === 'escape') for (const p of this.battle.party) this.v(p).dx += 4;
      return;
    }
    if (this.state === 'exit') return;
    this.processEvents();
    if (this.dlg.active) return;
    this.updateAnim();
    if (this.tickDelay > 0) {
      this.tickDelay--;
      return;
    }
    if (this.battle.result && !this.anim) {
      this.finish();
      return;
    }
    if (!this.anim) {
      const res = this.battle.nextAction();
      if (res) {
        this.startAnim(res);
        this.processEvents();
      }
    }
    if (!this.tutorialShown && this.battle.troop.tutorial && this.ready.length) {
      this.tutorialShown = true;
      this.say(`tutorial.${this.battle.troop.tutorial}`);
      return;
    }
    this.updateMenus();
    const waitMode = app.settings.atb === 'wait' && this.menus.length > 0;
    this.battle.speed = app.battleSpeed;
    this.battle.update(1, !!this.anim || waitMode || this.dlg.active);
    this.processEvents();
  }

  private finish(): void {
    const b = this.battle;
    const g = this.game;
    this.menus = [];
    this.active = null;
    g.s.stats.battles++;
    if (b.result === 'win') {
      g.s.stats.wins++;
      const r = b.rewards();
      this.rewards = b.applyRewards(r);
      b.syncBack();
      this.state = 'victory';
      this.app.music('stop');
      this.app.sfx('victory');
      if (this.rewards.levelUps.length) setTimeout(() => this.app.sfx('levelup'), 700);
    } else if (b.result === 'lose') {
      g.s.stats.defeats++;
      b.syncBack();
      this.state = 'defeat';
      this.app.music('stop');
      this.app.sfx('defeat');
    } else {
      g.s.stats.escapes++;
      b.syncBack();
      this.state = 'escape';
    }
    this.resultT = 0;
  }

  private leave(r: 'win' | 'lose' | 'escape'): void {
    if (this.state === 'exit') return;
    this.state = 'exit';
    this.app.fadeOut(18, () => {
      this.app.remove(this);
      this.done(r);
      this.app.fadeIn(18);
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    ctx.drawImage(this.bg, 0, 0);
    if (this.elementFlash) {
      ctx.globalAlpha = (this.elementFlash.t / 14) * 0.35;
      ctx.fillStyle = this.elementFlash.color;
      ctx.fillRect(0, 0, SCREEN_W, 168);
      ctx.globalAlpha = 1;
    }
    const drawActor = (a: Actor) => {
      const vis = this.v(a);
      if (a.side === 'enemy' && !a.alive && vis.fade >= 40) return;
      const img = this.sprite(a);
      const p = this.pos(a);
      const sx = vis.shake > 0 ? (vis.shake % 2 ? 2 : -2) : 0;
      let x = Math.round(p.x - img.width / 2 + vis.dx + sx);
      let y = Math.round(p.y - img.height + vis.dy);
      if (a.side === 'party' && !a.alive) {
        x = Math.round(p.x - 16);
        y = Math.round(p.y - 16);
      }
      const bob = a.side === 'enemy' && a.alive && this.app.sprites.look(a.look).kind !== 'human' ? Math.round(Math.sin(this.t / 16 + a.slot) * 1.5) : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(p.x + vis.dx, p.y - 1, Math.max(6, img.width * 0.35), 3, 0, 0, Math.PI * 2);
      ctx.fill();
      if (a.side === 'enemy' && !a.alive) {
        ctx.globalAlpha = 1 - vis.fade / 40;
        ctx.drawImage(this.app.sprites.silhouette(img, '#c060ff'), x, y + bob);
        ctx.globalAlpha = 1;
        return;
      }
      ctx.drawImage(img, x, y + bob);
      if (vis.flash > 0 && vis.flash % 4 < 2) ctx.drawImage(this.app.sprites.silhouette(img), x, y + bob);
      if (a.statuses.burn && this.t % 20 < 10) {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(this.app.sprites.silhouette(img, '#ff6020'), x, y + bob);
        ctx.globalAlpha = 1;
      }
      if (a.statuses.drain && this.t % 24 < 12) {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(this.app.sprites.silhouette(img, '#c060f0'), x, y + bob);
        ctx.globalAlpha = 1;
      }
      if (a.shield > 0) {
        ctx.strokeStyle = 'rgba(200,220,255,0.6)';
        ctx.beginPath();
        ctx.ellipse(p.x + vis.dx, p.y - img.height / 2, img.width / 2 + 3, img.height / 2 + 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (a.side === 'enemy' && (a.scanned || this.app.scannedEnemies.has(a.id))) ui.bar(ctx, p.x - 12, p.y + 2, 24, 2, a.hp / a.maxHp, COLORS.hp);
    };
    const order = [...this.battle.enemies].sort((a, b) => this.pos(a).y - this.pos(b).y);
    for (const e of order) drawActor(e);
    for (const p of this.battle.party) drawActor(p);
    this.fx.render(ctx);
    for (const p of this.popups) {
      const bounce = p.t < 16 ? -Math.sin((p.t / 16) * Math.PI) * 8 : 0;
      const y = Math.round(p.y - 8 + bounce - Math.max(0, p.t - 40) * 0.3);
      ctx.globalAlpha = p.t > 44 ? (60 - p.t) / 16 : 1;
      const w = this.app.font.measure(p.text);
      this.app.font.draw(ctx, p.text, p.x - w / 2, y, p.color, '#000000');
      if (p.big) this.app.font.draw(ctx, '!', p.x + w / 2 + 1, y, p.color, '#000000');
      ctx.globalAlpha = 1;
    }
    if (this.banner) {
      const w = Math.max(80, this.app.font.measure(this.banner.text) + 20);
      ui.window(ctx, 160 - w / 2, 4, w, 18);
      ui.textCenter(ctx, this.banner.text, 160, 9);
    }
    this.renderPanel(ctx);
    this.renderMenus(ctx);
    if (this.state === 'victory') this.renderVictory(ctx);
    if (this.state === 'defeat') {
      ctx.fillStyle = `rgba(40,0,0,${Math.min(0.6, this.resultT / 100)})`;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      ui.window(ctx, 90, 90, 140, 26, 'red');
      ui.textCenter(ctx, str.t('battle.defeat'), 160, 99);
    }
    if (this.dlg.active) this.dlg.render(ctx);
    if (this.state === 'intro') {
      ctx.fillStyle = '#000';
      ctx.globalAlpha = Math.max(0, 1 - this.introT / 30);
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      ctx.globalAlpha = 1;
      for (const s of this.shards) {
        ctx.save();
        ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
        ctx.rotate(s.rot);
        ctx.drawImage(this.snapshot, s.x, s.y, s.w, s.h, -s.w / 2, -s.h / 2, s.w, s.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.restore();
      }
      if (this.introT < 6) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1 - this.introT / 6;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        ctx.globalAlpha = 1;
      }
    }
  }

  private renderPanel(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const y = 168;
    ui.window(ctx, 2, y, 108, 70);
    const seen = new Map<string, number>();
    for (const e of this.battle.alive('enemy')) seen.set(e.name, (seen.get(e.name) ?? 0) + 1);
    let ey = y + 7;
    for (const [n, c] of seen) {
      let name = n;
      while (this.app.font.measure(name + (c > 1 ? ` ×${c}` : '')) > 96 && name.length > 4) name = name.slice(0, -2) + '…';
      ui.text(ctx, name + (c > 1 ? ` ×${c}` : ''), 9, ey);
      ey += 11;
      if (ey > y + 60) break;
    }
    ui.window(ctx, 112, y, 206, 70);
    ui.text(ctx, str.t('ui.hp'), 186, y + 4, COLORS.dim);
    ui.text(ctx, str.t('ui.mp'), 238, y + 4, COLORS.dim);
    this.battle.party.forEach((p, i) => {
      const ry = y + 15 + i * 18;
      const isActive = this.active === p;
      const col = !p.alive ? COLORS.hpCrit : isActive ? COLORS.gold : COLORS.text;
      ui.text(ctx, p.name, 120, ry, col);
      const st = Object.keys(p.statuses).filter((s) => this.game.data.statuses[s]).slice(0, 3);
      st.forEach((s, k) => {
        ctx.fillStyle = this.game.data.statuses[s].color;
        ctx.fillRect(120 + k * 5, ry + 9, 4, 3);
      });
      if (p.oporaMax) for (let k = 0; k < p.oporaMax; k++) ui.text(ctx, k < p.opora ? '◆' : '◇', 150 + k * 6, ry + 7, k < p.opora ? '#d0b070' : '#605850');
      const frac = p.hp / p.maxHp;
      ui.textRight(ctx, `${p.hp}`, 206, ry, ui.hpColor(frac));
      ui.text(ctx, `/${p.maxHp}`, 207, ry, COLORS.dim);
      ui.textRight(ctx, `${p.mp}`, 256, ry, COLORS.text);
      ui.bar(ctx, 186, ry + 9, 70, 2, frac, frac < 0.25 ? COLORS.hpCrit : COLORS.hp);
      const atbFull = p.ready || p.atb >= 1;
      ui.bar(ctx, 264, ry + 2, 48, 4, p.atb, atbFull ? (this.t % 16 < 8 ? COLORS.atbFull : '#fff8a0') : COLORS.atb);
      if (this.game.limitTech(p.id)) {
        const full = p.limit >= 100;
        ui.bar(ctx, 264, ry + 8, 48, 3, p.limit / 100, full ? (this.t % 12 < 6 ? '#80f0ff' : '#ffffff') : COLORS.limit);
      }
    });
  }

  private renderMenus(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    if (!this.active || !this.menus.length) return;
    const root = this.menus[0];
    if (root.list) {
      const h = root.list.items.length * 11 + 10;
      ui.window(ctx, 4, 238 - h - 72, 82, h);
      root.list.render(ctx, ui, 18, 238 - h - 72 + 6, 66, this.menus.length === 1);
    }
    const top = this.menus[this.menus.length - 1];
    for (const m of this.menus.slice(1)) {
      if (m.kind === 'target' || !m.list) continue;
      const rows = Math.min(6, Math.max(1, m.list.items.length));
      const h = rows * 11 + 10;
      const x = 90;
      const w = m.kind === 'stance' ? 110 : 200;
      const y = 166 - h;
      ui.window(ctx, x, y, w, h);
      m.list.render(ctx, ui, x + 16, y + 6, w - 20, m === top);
      if (m.kind === 'tech') ui.text(ctx, str.t('ui.mp'), x + w - 22, y - 9, COLORS.dim);
    }
    if (top.kind === 'target') {
      const tg = top.targets as Actor[];
      const list = top.allMode ? tg : [tg[top.targetIndex ?? 0]];
      for (const t of list) {
        if (!t) continue;
        const p = this.pos(t);
        const img = this.sprite(t);
        if (t.side === 'enemy') ui.cursor(ctx, p.x - img.width / 2 - 2, p.y - img.height / 2 - 4);
        else ui.cursorDown(ctx, p.x - 4, p.y - 34);
      }
    }
    if (this.help) {
      ui.window(ctx, 4, 4, 312, 18, 'dark', 0.85);
      ui.text(ctx, this.help, 10, 9);
    }
  }

  private renderVictory(ctx: CanvasRenderingContext2D): void {
    const ui = this.app.ui;
    const r = this.rewards;
    if (!r) return;
    const lines: [string, string][] = [];
    lines.push([str.t('battle.exp'), `${r.exp}`]);
    lines.push([str.t('battle.gold'), `${r.gold}`]);
    const items = new Map<string, number>();
    for (const it of r.items) items.set(it, (items.get(it) ?? 0) + 1);
    const h = 44 + (items.size + r.levelUps.length) * 11 + r.levelUps.reduce((s, u) => s + u.learned.length, 0) * 11;
    ui.window(ctx, 60, 30, 200, h);
    ui.textCenter(ctx, str.t('battle.victory'), 160, 36, COLORS.gold);
    let y = 50;
    for (const [k, v] of lines) {
      ui.text(ctx, k, 72, y);
      ui.textRight(ctx, v, 248, y);
      y += 11;
    }
    for (const [it, n] of items) {
      ui.icon(ctx, this.game.item(it).icon, 72, y);
      ui.text(ctx, `${this.game.item(it).name}${n > 1 ? ` ×${n}` : ''}`, 84, y, '#f8d860');
      y += 11;
    }
    for (const up of r.levelUps) {
      const name = up.id === 'isa' ? this.game.s.name : this.game.char(up.id).name;
      ui.text(ctx, str.t('battle.levelup', { who: name, lvl: up.to }), 72, y, '#80f0c0');
      y += 11;
      for (const t of up.learned) {
        ui.text(ctx, str.t('battle.learned', { tech: this.game.data.techniques[t].name }), 80, y, '#a0e0ff');
        y += 11;
      }
    }
  }
}
