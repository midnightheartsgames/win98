import type { App, Scene } from '../app.ts';
import type { Dir } from '../data/types.ts';
import type { Game } from './state.ts';
import { World, Ent, DIRV, dirFrom } from './world.ts';
import { EventRunner, stepPaths } from './events.ts';
import { DialogueBox, ListMenu, COLORS, parseLine } from './ui.ts';
import { Particles } from '../gfx/particles.ts';
import { Factories } from './registry.ts';
import { str } from '../core/i18n.ts';
import { SCREEN_H, SCREEN_W, TILE } from '../config.ts';
import { Rng } from '../core/rng.ts';

interface Toast {
  text: string;
  color: string;
  t: number;
}

const WALK_DUR = 12;
const RUN_DUR = 6;

export class MapScene implements Scene {
  opaque = true;
  countsPlaytime = true;
  readonly app: App;
  readonly game: Game;
  world!: World;
  runner: EventRunner;
  dialogue: DialogueBox;
  choice: ListMenu | null = null;
  choiceResult: number | null = null;
  battleResult: 'win' | 'lose' | 'escape' | null = null;
  mapChanging = false;
  tint: { color: string; alpha: number } | null = null;
  letterbox = 0;
  letterboxTarget = 0;
  vision = false;
  toasts: Toast[] = [];
  captionText: string | null = null;
  captionT = 0;
  fx = new Particles();
  chaseT = -1;
  invulnT = 0;
  private rng = new Rng(777);
  private contactEnemy: Ent | null = null;
  private musicBeforeBattle: string | null = null;
  private camFrom: { x: number; y: number } | null = null;
  private camTo: { x: number; y: number } | null = null;
  private camT = 0;
  private camDur = 0;
  private motes: { x: number; y: number; v: number }[] = [];
  private started = false;
  private lastTriggerTile = '';

  constructor(app: App) {
    this.app = app;
    this.game = app.game as Game;
    this.runner = new EventRunner(this);
    this.dialogue = new DialogueBox(app.ui);
    this.dialogue.onBlip = () => app.sfx('blip');
    this.dialogue.onAdvance = () => app.sfx('cursor');
    const s = this.game.s.map;
    this.loadWorld(s.id, null, s.x, s.y, s.dir);
    for (let i = 0; i < 40; i++) this.motes.push({ x: Math.random() * SCREEN_W, y: Math.random() * SCREEN_H, v: 0.2 + Math.random() * 0.5 });
  }

  enter(): void {
    const g = this.game;
    if (!g.flag('game_started')) {
      g.setFlag('game_started');
      this.app.setFade(1);
      this.runner.start(g.data.events[g.data.manifest.startEvent] ?? []);
    } else {
      this.app.fadeIn(20);
      this.app.music(this.world.map.music || null);
      if (this.world.map.onEnter) this.runner.start(g.data.events[this.world.map.onEnter]);
    }
    this.started = true;
  }

  resume(): void {
    if (this.musicBeforeBattle !== null) {
      const m = this.musicBeforeBattle;
      this.musicBeforeBattle = null;
      this.app.music(m || this.world.map.music || null);
    }
  }

  private loadWorld(mapId: string, spawn: string | null, x?: number, y?: number, dir?: Dir): void {
    const g = this.game;
    const map = g.data.maps[mapId];
    if (!map) throw new Error(`unknown map ${mapId}`);
    const w = new World(map, g, this.app.sprites);
    w.bubbleGlyph = (ctx, s, gx, gy, color) => this.app.font.draw(ctx, s, gx, gy, color, null);
    let px = x ?? 0;
    let py = y ?? 0;
    let pd: Dir = dir ?? 'down';
    if (spawn) {
      const sp = map.spawns[spawn];
      px = sp.x;
      py = sp.y;
      pd = sp.dir ?? pd;
    }
    w.player.place(px, py);
    w.player.dir = pd;
    w.player.look = g.data.characters.isa.look;
    this.world = w;
    this.setupFollowers();
    w.updateCamera();
    g.s.map = { id: mapId, x: px, y: py, dir: pd };
    const firstVisit = !g.s.visited.includes(mapId);
    if (firstVisit) g.s.visited.push(mapId);
    if (firstVisit && map.name && str.has(map.name) && this.started) this.caption(str.t(map.name), 150);
    this.chaseT = -1;
    this.fx = new Particles();
    this.lastTriggerTile = `${px},${py}`;
  }

  setupFollowers(): void {
    const g = this.game;
    const ids = g.s.party.filter((p) => p !== 'isa');
    if (g.s.pipo && g.s.roster.pipo !== undefined) ids.push('pipo');
    else if (g.s.pipo) ids.push('pipo');
    this.world.setupFollowers(ids);
  }

  changeMap(mapId: string, spawn: string, dir?: Dir, fade = true): void {
    this.mapChanging = true;
    const doLoad = () => {
      this.loadWorld(mapId, spawn);
      if (dir) this.world.player.dir = dir;
      this.app.music(this.world.map.music || null);
      if (fade) this.app.fadeIn(14);
      this.mapChanging = false;
      const enter = this.world.map.onEnter;
      if (enter) this.runner.start(this.game.data.events[enter]);
    };
    if (fade) {
      this.app.sfx('step_door');
      this.app.fadeOut(14, doLoad);
    } else doLoad();
  }

  openChoice(opts: string[]): void {
    const m = new ListMenu(opts.map((o) => ({ label: o })), 6);
    m.wrap = true;
    m.soundMove = () => this.app.sfx('cursor');
    this.choice = m;
    this.choiceResult = null;
  }

  toast(text: string, color = '#ffffff'): void {
    this.toasts.push({ text, color, t: 0 });
  }

  caption(text: string, frames = 150): void {
    this.captionText = text;
    this.captionT = frames;
    this.captionMax = frames;
  }

  private captionMax = 150;

  spawnFx(kind: string, x: number, y: number): void {
    this.fx.burst(kind, x, y);
    const sfx: Record<string, string> = { fire: 'fire1', earth: 'earth', avatar: 'avatar', explosion: 'boom', vine: 'vine', sparkle: 'secret', smoke: 'smoke', glow: 'glow', spirit: 'spirit' };
    if (sfx[kind]) this.app.sfx(sfx[kind]);
  }

  panCamera(target: { x: number; y: number } | null, frames: number): void {
    const w = this.world;
    this.camFrom = { x: w.camX + SCREEN_W / 2, y: w.camY + SCREEN_H / 2 };
    this.camTo = target;
    this.camReturn = target === null;
    this.camT = 0;
    this.camDur = Math.max(1, frames);
  }

  private camReturn = false;

  startBattle(troop: string): void {
    this.battleResult = null;
    this.musicBeforeBattle = this.app.audio.currentId ?? '';
    if (!Factories.battle) {
      this.battleResult = 'win';
      return;
    }
    this.app.push(
      Factories.battle(this.app, troop, (r) => {
        this.onBattleEnd(r, troop);
        this.battleResult = r;
      })
    );
  }

  startChase(): void {
    const c = this.world.map.chase;
    if (c) this.chaseT = c.timer * 60;
  }

  stopChase(): void {
    this.chaseT = -1;
  }

  onPlayerArrived(byInput: boolean): void {
    const w = this.world;
    const p = w.player;
    const g = this.game;
    g.s.map = { id: w.map.id, x: p.tx, y: p.ty, dir: p.dir };
    if (byInput) g.s.stats.steps++;
    const key = `${p.tx},${p.ty}`;
    if (!byInput) return;
    for (const e of w.entsAt(p.tx, p.ty)) {
      if (e.removed || e.hidden) continue;
      if (e.kind === 'warp' && e.def.to) {
        this.changeMap(e.def.to.map, e.def.to.spawn, e.def.to.dir, true);
        return;
      }
    }
    if (key !== this.lastTriggerTile) {
      this.lastTriggerTile = key;
      for (const e of w.ents) {
        if (e.removed || e.hidden || e.kind !== 'trigger' || e.def.touch === false) continue;
        const ww = e.def.w ?? 1;
        const hh = e.def.h ?? 1;
        if (p.tx >= e.tx && p.tx < e.tx + ww && p.ty >= e.ty && p.ty < e.ty + hh) {
          if (e.def.once) g.setFlag(e.def.once);
          this.runEntity(e);
          return;
        }
      }
    }
  }

  private runEntity(e: Ent): void {
    const g = this.game;
    if (e.def.event) this.runner.start(g.data.events[e.def.event], e);
    else if (e.def.script) this.runner.start(e.def.script, e);
    else if (e.def.text) {
      const t = e.def.text;
      if (str.hasDialogue(t)) this.runner.start([{ talk: t }], e);
      else this.dialogue.push([{ speaker: null, name: '', look: null, emo: 'normal', text: str.t(t) }]);
    }
  }

  private interact(): void {
    const w = this.world;
    const p = w.player;
    const [dx, dy] = DIRV[p.dir];
    let tx = p.tx + dx;
    let ty = p.ty + dy;
    const pick = (x: number, y: number) => w.entsAt(x, y).find((e) => !e.removed && !e.hidden && ['npc', 'chest', 'inspect', 'switch', 'shrine', 'vines', 'door', 'prop', 'hidden'].includes(e.kind) && (e.kind !== 'prop' || e.def.event || e.def.text || e.def.script));
    let e = pick(tx, ty);
    if (!e) {
      const tdef = w.tileDef(w.deco[ty]?.[tx] ?? null) ?? w.tileDef(w.ground[ty]?.[tx] ?? null);
      if (tdef && tdef.gen === 'counter') {
        tx += dx;
        ty += dy;
        e = pick(tx, ty);
      }
    }
    if (!e) {
      const here = w.entsAt(p.tx, p.ty).find((x) => !x.removed && x.kind === 'inspect');
      if (here) e = here;
    }
    if (!e) return;
    this.interactEnt(e);
  }

  private interactEnt(e: Ent): void {
    const g = this.game;
    const w = this.world;
    const app = this.app;
    switch (e.kind) {
      case 'npc':
        if (e.currentLook && !w.sprites.isProp(e.currentLook) && !e.def.move?.type?.startsWith('still') && e.def.dir === undefined) e.dir = dirFrom(w.player.tx - e.tx, w.player.ty - e.ty);
        else if (e.currentLook && !w.sprites.isProp(e.currentLook)) e.dir = dirFrom(w.player.tx - e.tx, w.player.ty - e.ty);
        this.runEntity(e);
        return;
      case 'chest': {
        if (e.open) {
          this.dialogue.push([{ speaker: null, name: '', look: null, emo: 'normal', text: str.t('msg.chest_empty') }]);
          return;
        }
        e.open = true;
        g.s.opened.push(w.chestKey(e));
        g.s.stats.chests++;
        app.sfx('chest');
        const cmds: Record<string, unknown>[] = [];
        if (e.def.item) cmds.push({ give: e.def.item, count: e.def.count ?? 1 });
        if (e.def.gold) cmds.push({ gold: e.def.gold });
        if (e.def.secret) cmds.push({ secret: e.def.secret });
        if (e.def.event) cmds.push({ call: e.def.event });
        this.runner.start(cmds, e);
        return;
      }
      case 'hidden': {
        g.s.opened.push(w.chestKey(e));
        e.removed = true;
        const cmds: Record<string, unknown>[] = [{ sfx: 'secret' }];
        if (e.def.item) cmds.push({ give: e.def.item, count: e.def.count ?? 1 });
        if (e.def.gold) cmds.push({ gold: e.def.gold });
        cmds.push({ secret: e.def.secret ?? `${w.map.id}_${e.id}` });
        this.runner.start(cmds, e);
        return;
      }
      case 'shrine':
        this.runner.start([{ call: 'common_shrine' }], e);
        return;
      default:
        this.runEntity(e);
    }
  }

  private updateEnemy(e: Ent): void {
    const w = this.world;
    const p = w.player;
    if (e.moving) {
      w.stepEnt(e);
      return;
    }
    if (e.stunT > 0) {
      e.stunT--;
      return;
    }
    const mv = e.def.move;
    const dx = p.tx - e.tx;
    const dy = p.ty - e.ty;
    const dist = Math.abs(dx) + Math.abs(dy);
    const chase = e.def.chase ?? 0;
    if (chase > 0 && dist <= chase && this.invulnT <= 0) {
      if (e.wanderT > 0) {
        e.wanderT--;
        return;
      }
      const tryDirs: Dir[] = [];
      if (Math.abs(dx) >= Math.abs(dy)) tryDirs.push(dx < 0 ? 'left' : 'right', dy < 0 ? 'up' : 'down');
      else tryDirs.push(dy < 0 ? 'up' : 'down', dx < 0 ? 'left' : 'right');
      for (const d of tryDirs) {
        const [ddx, ddy] = DIRV[d];
        if (ddx === 0 && ddy === 0) continue;
        if (!w.tileSolid(e.tx + ddx, e.ty + ddy) && !w.entsAt(e.tx + ddx, e.ty + ddy).some((o) => o !== e && w.solidEnt(o))) {
          const isPlayer = e.tx + ddx === p.tx && e.ty + ddy === p.ty;
          if (isPlayer) break;
          w.startMove(e, d, 15, true);
          e.wanderT = 4;
          return;
        }
      }
      e.dir = dirFrom(dx, dy);
      return;
    }
    if (!mv || mv.type === 'still') return;
    if (mv.type === 'patrol' && mv.path?.length) {
      const idx = Math.floor(e.wanderT / 1000) % mv.path.length;
      const [px, py] = mv.path[idx];
      if (e.tx === px && e.ty === py) {
        e.wanderT = ((idx + 1) % mv.path.length) * 1000;
        return;
      }
      const d = dirFrom(px - e.tx, py - e.ty);
      if (!w.startMove(e, d, 20)) e.dir = d;
      return;
    }
    if (e.wanderT > 0) {
      e.wanderT--;
      return;
    }
    e.wanderT = this.rng.int(40, 110);
    const d = this.rng.pick(['up', 'down', 'left', 'right'] as Dir[]);
    const [ddx, ddy] = DIRV[d];
    const r = mv.radius ?? 3;
    if (Math.abs(e.tx + ddx - e.def.x) > r || Math.abs(e.ty + ddy - e.def.y) > r) {
      e.dir = d;
      return;
    }
    w.startMove(e, d, 20);
  }

  private updateNpc(e: Ent): void {
    const w = this.world;
    const mv = e.def.move;
    if (e.moving) {
      w.stepEnt(e);
      return;
    }
    if (!mv || mv.type === 'still' || this.runner.running || this.dialogue.active) return;
    if (e.wanderT > 0) {
      e.wanderT--;
      return;
    }
    e.wanderT = this.rng.int(mv.wait ?? 60, (mv.wait ?? 60) * 2.5);
    if (mv.type === 'turn') {
      e.dir = this.rng.pick(['up', 'down', 'left', 'right'] as Dir[]);
      return;
    }
    const d = this.rng.pick(['up', 'down', 'left', 'right'] as Dir[]);
    const [ddx, ddy] = DIRV[d];
    const r = mv.radius ?? 2;
    if (Math.abs(e.tx + ddx - e.def.x) > r || Math.abs(e.ty + ddy - e.def.y) > r) {
      e.dir = d;
      return;
    }
    w.startMove(e, d, 22);
  }

  private updateHazard(e: Ent): void {
    const hz = e.def.hazard;
    if (!hz) return;
    const t = (this.world.t + hz.phase) % hz.period;
    e.hazardOn = t < hz.on;
    const p = this.world.player;
    if (e.hazardOn && p.tx === e.tx && p.ty === e.ty && !this.mapChanging && !this.runner.running) this.hazardHit(e);
  }

  private hazardHit(e: Ent): void {
    const hz = e.def.hazard;
    if (!hz) return;
    const app = this.app;
    app.sfx(hz.type === 'steam' ? 'steam' : hz.type === 'spark' ? 'zap' : hz.type === 'crumble' ? 'fall' : 'alert');
    app.flash(hz.type === 'searchlight' ? '#fff8c0' : '#ffffff', 12);
    app.shake(12, 2);
    this.toast(str.t(`hazard.${hz.type}`), '#f0a080');
    this.mapChanging = true;
    app.fadeOut(16, () => {
      const sp = this.world.map.spawns[hz.reset];
      this.world.player.place(sp.x, sp.y);
      this.world.player.dir = sp.dir ?? 'down';
      this.world.player.moving = null;
      this.setupFollowers();
      this.world.updateCamera();
      app.fadeIn(16);
      this.mapChanging = false;
    });
  }

  private checkContact(): void {
    if (this.invulnT > 0 || this.runner.running || this.mapChanging) return;
    const w = this.world;
    const p = w.player;
    for (const e of w.ents) {
      if (e.kind !== 'enemy' || e.removed || e.hidden || e.stunT > 0) continue;
      if (Math.abs(e.px - p.px) < 12 && Math.abs(e.py - p.py) < 12) {
        this.contactEnemy = e;
        const troop = e.def.troop as string;
        this.app.sfx('encounter');
        this.runner.start([{ battle: troop }], e);
        return;
      }
    }
  }

  private playerControl(): void {
    const w = this.world;
    const p = w.player;
    const inp = this.app.input;
    if (p.moving) {
      if (w.stepEnt(p)) {
        this.onPlayerArrived(true);
        if (this.mapChanging || this.runner.running) return;
      } else return;
    }
    if (p.path.length) return;
    if (inp.pressed('menu') && Factories.menu) {
      this.app.sfx('menu_open');
      this.app.push(Factories.menu(this.app));
      return;
    }
    if (inp.pressed('extra') && this.game.count('pocket_radio') > 0 && Factories.radio) {
      if (this.world.map.radio) {
        this.app.push(Factories.radio(this.app));
      } else {
        this.toast(str.t('radio.no_signal'), '#a0a0c0');
        this.app.sfx('static');
      }
      return;
    }
    if (inp.pressed('confirm')) {
      this.interact();
      if (this.runner.running || this.dialogue.active) return;
    }
    let dir: Dir | null = null;
    if (inp.down('up')) dir = 'up';
    else if (inp.down('down')) dir = 'down';
    else if (inp.down('left')) dir = 'left';
    else if (inp.down('right')) dir = 'right';
    if (!dir) return;
    const running = inp.down('run') !== this.app.settings.runDefault;
    const moved = w.startMove(p, dir, running ? RUN_DUR : WALK_DUR);
    if (!moved) {
      p.dir = dir;
      const [dx, dy] = DIRV[dir];
      const blockers = w.entsAt(p.tx + dx, p.ty + dy).filter((e) => !e.removed && !e.hidden && e.kind === 'door' && e.def.touch);
      if (blockers.length && !this.runner.running) this.interactEnt(blockers[0]);
    } else {
      w.stepEnt(p);
    }
  }

  update(): void {
    const w = this.world;
    const app = this.app;
    w.t++;
    if (this.choice) {
      const r = this.choice.update(app.input);
      if (r === 'confirm') {
        this.choiceResult = this.choice.index;
        this.choice = null;
        app.sfx('confirm');
      } else if (r === 'cancel' && this.choice.items.length > 0) {
        this.choice.index = this.choice.items.length - 1;
      }
      app.input.consume('confirm');
      app.input.consume('cancel');
    }
    this.dialogue.speed = app.textSpeed;
    if (!this.choice) this.dialogue.update(app.input);
    this.runner.update();
    const scriptLock = this.runner.running || this.dialogue.active || this.mapChanging || this.choice !== null;
    for (const e of w.ents) {
      if (e.removed) continue;
      if (e.bubble) {
        e.bubble.t++;
        if (e.bubble.t > 70) e.bubble = null;
      }
      if (e.flashT > 0) e.flashT--;
      if (e.jumpT > 0) e.jumpT--;
      if (e.path.length || (e.moving && e.kind !== 'enemy' && !e.def.move)) {
        stepPaths(this, e);
        continue;
      }
      if (e.kind === 'enemy' && !scriptLock) this.updateEnemy(e);
      else if (e.kind === 'npc') this.updateNpc(e);
      else if (e.kind === 'hazard') this.updateHazard(e);
      else if (e.moving) w.stepEnt(e);
      if (e.kind === 'switch') e.on = this.game.flag(`sw_${e.id}`);
      if (e.kind === 'prop' && e.def.frame && e.def.frame !== 'anim' && e.def.frame !== 'on') e.on = this.game.test(e.def.frame);
    }
    const p = w.player;
    if (p.bubble) {
      p.bubble.t++;
      if (p.bubble.t > 70) p.bubble = null;
    }
    if (p.jumpT > 0) p.jumpT--;
    if (p.path.length || (p.moving && scriptLock)) stepPaths(this, p);
    else if (!scriptLock) this.playerControl();
    for (const f of w.followers) {
      if (f.bubble) {
        f.bubble.t++;
        if (f.bubble.t > 70) f.bubble = null;
      }
      if (f.path.length) stepPaths(this, f);
    }
    if (!w.followers.some((f) => f.path.length)) w.updateFollowers();
    if (!scriptLock) this.checkContact();
    if (this.invulnT > 0) this.invulnT--;
    this.updateCamera();
    this.fx.update();
    for (const t of this.toasts) t.t++;
    this.toasts = this.toasts.filter((t) => t.t < 150);
    if (this.captionT > 0) this.captionT--;
    this.letterbox += (this.letterboxTarget - this.letterbox) * 0.12;
    if (Math.abs(this.letterbox - this.letterboxTarget) < 0.01) this.letterbox = this.letterboxTarget;
    if (this.chaseT > 0 && !this.dialogue.active && !this.mapChanging) {
      this.chaseT--;
      if (this.chaseT === 0) this.chaseFailed();
    }
    for (const m of this.motes) {
      m.y -= m.v;
      m.x += Math.sin((m.y + w.t) / 30) * 0.2;
      if (m.y < -2) {
        m.y = SCREEN_H + 2;
        m.x = Math.random() * SCREEN_W;
      }
    }
  }

  private chaseFailed(): void {
    const c = this.world.map.chase;
    if (!c) return;
    this.chaseT = -1;
    if (this.game.data.events[c.fail]) this.runner.start(this.game.data.events[c.fail]);
  }

  onBattleEnd(result: 'win' | 'lose' | 'escape', troop: string): void {
    const e = this.contactEnemy;
    this.contactEnemy = null;
    if (!e || e.def.troop !== troop) return;
    if (result === 'win') {
      e.removed = true;
      if (e.def.once) this.game.setFlag(e.def.once);
    } else if (result === 'escape') {
      e.stunT = 150;
      this.invulnT = 120;
    }
  }

  private updateCamera(): void {
    const w = this.world;
    if (this.camDur > 0) {
      this.camT++;
      const k = Math.min(1, this.camT / this.camDur);
      const e = k * k * (3 - 2 * k);
      const to = this.camReturn ? { x: w.player.px + 8, y: w.player.py + 4 } : (this.camTo as { x: number; y: number });
      const from = this.camFrom as { x: number; y: number };
      w.camTarget = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
      if (k >= 1) {
        this.camDur = 0;
        if (this.camReturn) {
          w.camTarget = null;
          this.camReturn = false;
        } else w.camTarget = to;
      }
    }
    w.updateCamera();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.world;
    const ui = this.app.ui;
    w.render(ctx, (c, ox, oy) => this.fx.render(c, ox, oy));
    if (this.tint) {
      ctx.globalAlpha = this.tint.alpha;
      ctx.fillStyle = this.tint.color;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      ctx.globalAlpha = 1;
    }
    if (this.vision) {
      ctx.fillStyle = 'rgba(40,20,100,0.28)';
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      for (const m of this.motes) {
        ctx.fillStyle = (m.x + m.y) % 3 < 1 ? '#e0e8ff' : '#8090ff';
        ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
      }
      const g = ctx.createRadialGradient(160, 120, 60, 160, 120, 210);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,20,0.7)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
    if (this.letterbox > 0) {
      const h = Math.round(22 * this.letterbox);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, SCREEN_W, h);
      ctx.fillRect(0, SCREEN_H - h, SCREEN_W, h);
    }
    if (this.chaseT > 0) {
      const sec = Math.ceil(this.chaseT / 60);
      ui.window(ctx, 128, 4, 64, 18, sec <= 10 ? 'red' : 'blue');
      ui.textCenter(ctx, `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, 160, 9, sec <= 10 ? '#ffb0b0' : '#ffffff');
    }
    if (this.captionText && this.captionT > 0 && !this.dialogue.active) {
      const a = Math.min(1, this.captionT / 20, (this.captionMax - this.captionT) / 15);
      ctx.globalAlpha = Math.max(0, a);
      const lines = this.app.font.wrap(this.captionText, 288);
      const tw = Math.max(...lines.map((l) => this.app.font.measure(l))) + 16;
      ui.window(ctx, 8, 8, tw, 8 + lines.length * 10, 'dark', 0.8);
      lines.forEach((l, i) => ui.text(ctx, l, 16, 13 + i * 10, COLORS.title));
      ctx.globalAlpha = 1;
    }
    this.toasts.forEach((t, i) => {
      const a = Math.min(1, t.t / 10, (150 - t.t) / 20);
      ctx.globalAlpha = Math.max(0, a);
      const tw = this.app.font.measure(t.text) + 12;
      const x = SCREEN_W - tw - 6 + Math.max(0, 10 - t.t) * 3;
      const y = 30 + i * 18;
      ui.window(ctx, x, y, tw, 16, 'dark', 0.85);
      ui.text(ctx, t.text, x + 6, y + 4, t.color);
      ctx.globalAlpha = 1;
    });
    this.dialogue.pos = this.world.player.py - this.world.camY > SCREEN_H * 0.62 ? 'top' : 'bottom';
    this.dialogue.render(ctx);
    if (this.choice) {
      const items = this.choice.items;
      const cw = Math.max(...items.map((i) => this.app.font.measure(i.label))) + 34;
      const ch = items.length * 11 + 12;
      const cx = SCREEN_W - cw - 8;
      const cy = this.dialogue.active ? (this.dialogue.pos === 'bottom' ? SCREEN_H - 66 - ch - 4 : 70) : SCREEN_H / 2 - ch / 2;
      ui.window(ctx, cx, cy, cw, ch);
      this.choice.render(ctx, ui, cx + 18, cy + 7, cw - 20);
    }
  }

  exit(): void {
    this.runner.abort();
  }

  speakers(line: string) {
    return parseLine(line, this.game.data.speakers, this.game.s.name);
  }

  get tileSize(): number {
    return TILE;
  }
}
