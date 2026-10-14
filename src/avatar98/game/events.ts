import type { Command, Dir } from '../data/types.ts';
import type { MapScene } from './mapscene.ts';
import { Ent, dirFrom, opposite } from './world.ts';
import { str } from '../core/i18n.ts';
import { parseLine } from './ui.ts';
import { commandName } from '../data/validate.ts';
import { Factories } from './registry.ts';
import type { Scene } from '../app.ts';

export type Wait = number | (() => boolean);

interface Script {
  gen: Generator<Wait, void, unknown>;
  wait: Wait | null;
  self: Ent | null;
  done: boolean;
}

const DIR_OF: Record<string, Dir> = { u: 'up', d: 'down', l: 'left', r: 'right' };

export class EventRunner {
  scene: MapScene;
  private scripts: Script[] = [];
  aborted = false;

  constructor(scene: MapScene) {
    this.scene = scene;
  }

  get running(): boolean {
    return this.scripts.some((s) => !s.done);
  }

  start(cmds: Command[], self: Ent | null = null): void {
    this.aborted = false;
    this.scripts.push({ gen: this.exec(cmds, self), wait: null, self, done: false });
  }

  abort(): void {
    this.aborted = true;
    this.scripts = [];
  }

  update(): void {
    for (const s of this.scripts) {
      if (s.done) continue;
      let guard = 0;
      while (!s.done && guard++ < 200) {
        if (s.wait !== null) {
          if (typeof s.wait === 'number') {
            if (s.wait > 0) {
              s.wait--;
              break;
            }
          } else if (!s.wait()) break;
          s.wait = null;
        }
        const r = s.gen.next();
        if (r.done) {
          s.done = true;
          break;
        }
        s.wait = r.value;
        if (this.aborted) break;
      }
    }
    this.scripts = this.scripts.filter((s) => !s.done);
  }

  resolve(id: string, self: Ent | null): Ent | null {
    const w = this.scene.world;
    if (id === 'self') return self;
    if (id === 'player') return w.player;
    if (id.startsWith('f:')) return w.followers.find((f) => f.id === `follow_${id.slice(2)}`) ?? null;
    return w.ent(id) ?? null;
  }

  *exec(cmds: Command[], self: Ent | null): Generator<Wait, void, unknown> {
    for (let i = 0; i < cmds.length; i++) {
      if (this.aborted) return;
      const next = cmds[i + 1];
      const nextIsChoice = !!next && commandName(next) === 'choice';
      yield* this.one(cmds[i], self, nextIsChoice);
    }
  }

  private waitScene(s: Scene): Wait {
    const app = this.scene.app;
    app.push(s);
    return () => !app.scenes.includes(s);
  }

  private *message(text: string, sfx?: string): Generator<Wait, void, unknown> {
    const sc = this.scene;
    if (sfx) sc.app.sfx(sfx);
    sc.dialogue.push([{ speaker: null, name: '', look: null, emo: 'normal', text }]);
    yield () => !sc.dialogue.active;
  }

  private *one(cmd: Command, self: Ent | null, nextIsChoice: boolean): Generator<Wait, void, unknown> {
    const sc = this.scene;
    const app = sc.app;
    const g = sc.game;
    const name = commandName(cmd);
    const S = (k: string) => cmd[k] as string;
    const N = (k: string, d = 0) => (cmd[k] === undefined ? d : (cmd[k] as number));
    switch (name) {
      case 'talk': {
        const lines = str.dialogue(S('talk')).map((l) => parseLine(l, g.data.speakers, g.s.name));
        sc.dialogue.hold = nextIsChoice;
        sc.dialogue.push(lines);
        if (nextIsChoice) yield () => sc.dialogue.queue.length === 0 && sc.dialogue.finishedTyping;
        else yield () => !sc.dialogue.active;
        return;
      }
      case 'choice': {
        const opts = (cmd.choice as string[]).map((k) => (str.has(k) ? str.t(k) : str.dialogue(k)[0].replace(/^[^|]*\|/, '')));
        sc.openChoice(opts);
        yield () => sc.choiceResult !== null;
        const r = sc.choiceResult as number;
        sc.choiceResult = null;
        sc.dialogue.clear();
        const br = (cmd.branches as Command[][])[r];
        if (br) yield* this.exec(br, self);
        return;
      }
      case 'flag':
        g.setFlag(S('flag'));
        return;
      case 'unflag':
        g.setFlag(S('unflag'), false);
        return;
      case 'set':
        for (const [k, v] of Object.entries(cmd.set as Record<string, number>)) g.s.vars[k] = v;
        return;
      case 'add':
        for (const [k, v] of Object.entries(cmd.add as Record<string, number>)) g.s.vars[k] = (g.s.vars[k] ?? 0) + v;
        return;
      case 'if':
      case 'opt': {
        const ok = g.test(S(name));
        if (ok) yield* this.exec(cmd.then as Command[], self);
        else if (cmd.else) yield* this.exec(cmd.else as Command[], self);
        return;
      }
      case 'give': {
        const n = N('count', 1);
        g.give(S('give'), n);
        if (!cmd.silent) yield* this.message(str.t('msg.got', { item: g.item(S('give')).name, n: n > 1 ? ` ×${n}` : '' }), 'item');
        return;
      }
      case 'take': {
        const n = N('count', 1);
        g.take(S('take'), n);
        if (!cmd.silent) yield* this.message(str.t('msg.lost', { item: g.item(S('take')).name, n: n > 1 ? ` ×${n}` : '' }));
        return;
      }
      case 'gold': {
        const n = N('gold');
        g.addGold(n);
        if (!cmd.silent) yield* this.message(str.t(n >= 0 ? 'msg.gold_got' : 'msg.gold_lost', { n: Math.abs(n) }), n >= 0 ? 'coin' : undefined);
        return;
      }
      case 'battle': {
        const troop = g.data.troops[S('battle')];
        sc.startBattle(troop.id);
        yield () => sc.battleResult !== null;
        const res = sc.battleResult;
        sc.battleResult = null;
        if (res === 'lose' && !troop.loseOk) {
          this.abort();
          app.gameOver();
          return;
        }
        if (res === 'win' && cmd.win) yield* this.exec(cmd.win as Command[], self);
        if (res !== 'win' && cmd.lose) yield* this.exec(cmd.lose as Command[], self);
        return;
      }
      case 'fade': {
        const frames = N('frames', 24);
        if (S('fade') === 'out') app.fadeOut(frames, undefined, (cmd.color as string) ?? '#000000');
        else app.fadeIn(frames);
        yield frames + 1;
        return;
      }
      case 'shake':
        app.shake(N('shake'), N('power', 2));
        return;
      case 'music':
        app.music(S('music'));
        return;
      case 'sfx':
        app.sfx(S('sfx'));
        return;
      case 'move': {
        const e = this.resolve(S('move'), self);
        if (!e) return;
        const speed = N('speed', 1);
        const toks = S('path').trim().split(/\s+/);
        for (const t of toks) {
          const m = /^([udlr])(\d*)$/.exec(t);
          if (m) for (let k = 0; k < (m[2] ? parseInt(m[2], 10) : 1); k++) e.path.push(`${m[1]}:${speed}`);
          else e.path.push(t);
        }
        if (cmd.wait !== false) yield () => !e.busy;
        if (cmd.face) {
          const d = cmd.face as string;
          if (d === 'player') e.dir = dirFrom(sc.world.player.tx - e.tx, sc.world.player.ty - e.ty);
          else if (DIR_OF[d[0]]) e.dir = DIR_OF[d[0]];
        }
        return;
      }
      case 'face': {
        const e = this.resolve(S('face'), self);
        if (!e) return;
        const d = S('dir');
        if (d === 'player') e.dir = dirFrom(sc.world.player.tx - e.tx, sc.world.player.ty - e.ty);
        else if (d === 'away') e.dir = opposite(dirFrom(sc.world.player.tx - e.tx, sc.world.player.ty - e.ty));
        else e.dir = d as Dir;
        return;
      }
      case 'wait':
        yield N('wait');
        return;
      case 'warp': {
        sc.changeMap(S('warp'), S('spawn'), cmd.dir as Dir | undefined, cmd.fade !== false);
        yield () => !sc.mapChanging;
        return;
      }
      case 'show': {
        const e = this.resolve(S('show'), self);
        if (e) {
          e.hidden = false;
          e.removed = false;
        }
        return;
      }
      case 'hide': {
        const e = this.resolve(S('hide'), self);
        if (e) e.hidden = true;
        return;
      }
      case 'actor': {
        const w = sc.world;
        w.ents = w.ents.filter((e) => e.id !== S('actor'));
        const e = new Ent({ id: S('actor'), kind: 'npc', x: N('x'), y: N('y'), look: S('look'), dir: (cmd.dir as Dir) ?? 'down', solid: false });
        e.temp = true;
        w.ents.push(e);
        return;
      }
      case 'remove': {
        const e = this.resolve(S('remove'), self);
        if (e) {
          if (e.temp) sc.world.ents = sc.world.ents.filter((x) => x !== e);
          else e.removed = true;
        }
        return;
      }
      case 'camera': {
        const frames = N('frames', 30);
        const target = cmd.camera;
        if (target === 'player') {
          sc.panCamera(null, frames);
        } else if (typeof target === 'string') {
          const e = this.resolve(target, self);
          if (e) sc.panCamera({ x: e.px + 8, y: e.py + 4 }, frames);
        } else if (Array.isArray(target)) {
          sc.panCamera({ x: (target[0] as number) * 16 + 8, y: (target[1] as number) * 16 + 8 }, frames);
        }
        yield frames;
        return;
      }
      case 'emote': {
        const e = this.resolve(S('emote'), self);
        if (!e) return;
        e.bubble = { icon: S('icon'), t: 0 };
        app.sfx(S('icon') === '!' ? 'alert' : 'blip');
        yield 36;
        return;
      }
      case 'trust': {
        for (const [who, n] of Object.entries(cmd.trust as Record<string, number>)) {
          g.addTrust(who, n);
          const nm = g.data.characters[who]?.name ?? who;
          sc.toast(str.t(n > 0 ? 'msg.trust_up' : 'msg.trust_down', { who: nm }), n > 0 ? '#80f0c0' : '#f0a080');
        }
        return;
      }
      case 'join': {
        const id = S('join');
        g.join(id);
        if (id === 'pipo') g.s.pipo = true;
        sc.setupFollowers();
        yield* this.message(str.t('msg.joined', { who: id === 'isa' ? g.s.name : g.char(id).name }), 'join');
        return;
      }
      case 'leave':
        g.leave(S('leave'));
        sc.setupFollowers();
        return;
      case 'heal':
        g.healAll();
        app.sfx('heal');
        return;
      case 'shop':
        if (Factories.shop) yield this.waitScene(Factories.shop(app, S('shop')));
        return;
      case 'inn': {
        const price = N('inn');
        if (g.s.gold < price) {
          yield* this.message(str.t('msg.no_money'), 'error');
          return;
        }
        g.addGold(-price);
        app.fadeOut(30);
        yield 34;
        g.healAll();
        app.sfx('inn');
        yield 70;
        app.fadeIn(30);
        yield 30;
        return;
      }
      case 'save':
        if (Factories.save) yield this.waitScene(Factories.save(app, 'save'));
        return;
      case 'paisho': {
        if (!Factories.paisho) return;
        let won: boolean | null = null;
        yield this.waitScene(Factories.paisho(app, S('paisho'), (w) => (won = w)));
        if (won && cmd.win) yield* this.exec(cmd.win as Command[], self);
        if (won === false && cmd.lose) yield* this.exec(cmd.lose as Command[], self);
        return;
      }
      case 'title':
        if (Factories.titlecard) yield this.waitScene(Factories.titlecard(app, str.t(S('title')), cmd.sub ? str.t(S('sub')) : null, N('frames', 180)));
        return;
      case 'caption':
        sc.caption(str.t(S('caption')), N('frames', 150));
        return;
      case 'flash':
        app.flash(S('flash'), N('frames', 20));
        return;
      case 'tint':
        sc.tint = S('tint') === 'none' ? null : { color: S('tint'), alpha: N('alpha', 0.3) };
        return;
      case 'letterbox':
        sc.letterboxTarget = cmd.letterbox ? 1 : 0;
        return;
      case 'quest': {
        const q = g.data.quests[S('quest')];
        const before = g.s.quests[q.id] ?? 0;
        g.setQuest(q.id, N('step'));
        if ((g.s.quests[q.id] ?? 0) !== before) {
          const done = g.questDone(q.id);
          sc.toast(str.t(done ? 'msg.quest_done' : before === 0 ? 'msg.quest_new' : 'msg.quest_upd', { q: q.name }), done ? '#f8d860' : '#c8e0ff');
          app.sfx(done ? 'quest_done' : 'quest');
        }
        return;
      }
      case 'learn': {
        const t = g.data.techniques[S('tech')];
        if (t.learn?.flag) g.setFlag(t.learn.flag);
        const who = S('learn') === 'isa' ? g.s.name : g.char(S('learn')).name;
        yield* this.message(str.t('msg.learned', { who, tech: t.name }), 'learn');
        return;
      }
      case 'fx': {
        const e = this.resolve(S('at'), self);
        if (e) sc.spawnFx(S('fx'), e.px + 8 + N('dx') * 16, e.py + 4 + N('dy') * 16);
        return;
      }
      case 'worldmap': {
        if (!Factories.worldmap) return;
        let dest: { map: string; spawn: string } | null = null;
        yield this.waitScene(Factories.worldmap(app, S('worldmap'), (d) => (dest = d)));
        const d = dest as { map: string; spawn: string } | null;
        if (d) {
          sc.changeMap(d.map, d.spawn, undefined, true);
          yield () => !sc.mapChanging;
        }
        return;
      }
      case 'radio':
        if (Factories.radio) yield this.waitScene(Factories.radio(app));
        return;
      case 'ending':
        if (Factories.ending) {
          this.abort();
          app.push(Factories.ending(app, S('ending')));
        }
        return;
      case 'call':
        yield* this.exec(g.data.events[S('call')], self);
        return;
      case 'name': {
        if (!Factories.name) return;
        yield this.waitScene(Factories.name(app, (n) => {
          g.s.name = n;
          str.playerName = n;
        }));
        return;
      }
      case 'secret':
        if (g.secret(S('secret'))) {
          sc.toast(str.t('msg.secret'), '#f8d860');
          app.sfx('secret');
        }
        return;
      case 'pose': {
        const e = this.resolve(S('as'), self);
        if (e) e.pose = S('pose') === 'none' ? null : S('pose');
        return;
      }
      case 'chase':
        if (S('chase') === 'start') sc.startChase();
        else sc.stopChase();
        return;
      case 'pipo':
        g.s.pipo = S('pipo') !== 'hide';
        sc.setupFollowers();
        return;
      case 'gameover':
        this.abort();
        app.gameOver();
        return;
      case 'restore':
        sc.world.refresh();
        return;
      case 'avatar': {
        const e = this.resolve((cmd.at as string) ?? 'player', self);
        if (!e) return;
        const on = S('avatar') === 'on';
        e.aura = on;
        e.lookOverride = on ? 'isa_avatar' : null;
        if (on) {
          app.flash('#e0ffff', 30);
          app.sfx('avatar');
          app.shake(40, 3);
        }
        return;
      }
      case 'vision':
        sc.vision = S('vision') === 'on';
        return;
      case 'spawnpoint': {
        const sp = sc.world.map.spawns[S('spawnpoint')];
        if (sp) g.s.map = { id: sc.world.map.id, x: sp.x, y: sp.y, dir: sp.dir ?? 'down' };
        return;
      }
      case 'stat': {
        const st = g.s.stats as unknown as Record<string, number>;
        st[S('stat')] = (st[S('stat')] ?? 0) + 1;
        return;
      }
      case 'limit': {
        const c = g.s.roster[S('limit')];
        if (c) c.limit = Math.max(0, Math.min(100, N('amount')));
        return;
      }
      case 'level':
        g.setLevel(S('level'), Math.max(g.cs(S('level')).level, N('to', 1)));
        return;
      case 'cleansave':
        if (Factories.save) yield this.waitScene(Factories.save(app, 'clean'));
        return;
    }
  }
}

export function stepPaths(scene: MapScene, e: Ent): void {
  const w = scene.world;
  if (e.moving) {
    const arrived = w.stepEnt(e);
    if (arrived && e === w.player) scene.onPlayerArrived(false);
    return;
  }
  const tok = e.path.shift();
  if (!tok) return;
  const m = /^([udlr]):([\d.]+)$/.exec(tok);
  if (m) {
    const dir = DIR_OF[m[1]];
    const speed = parseFloat(m[2]);
    w.startMove(e, dir, 16 / (1.333 * speed), true);
    return;
  }
  const wm = /^w(\d+)$/.exec(tok);
  if (wm) {
    const n = parseInt(wm[1], 10);
    for (let i = 1; i < n; i++) e.path.unshift('w1x');
    return;
  }
  if (tok === 'w1x') return;
  const fm = /^f([udlr])$/.exec(tok);
  if (fm) {
    e.dir = DIR_OF[fm[1]];
    return;
  }
  if (tok === 'j') {
    e.jumpT = 12;
    return;
  }
  const tm = /^t(\d+),(\d+)$/.exec(tok);
  if (tm) {
    e.place(parseInt(tm[1], 10), parseInt(tm[2], 10));
    return;
  }
}
