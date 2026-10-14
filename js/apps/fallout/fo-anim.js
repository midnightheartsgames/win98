(function (FO) {
  'use strict';

  FO.ANIM = {
    STAND: 0, WALK: 1, JUMP_BEGIN: 2, JUMP_END: 3, CLIMB_LADDER: 4, FALLING: 5,
    UP_STAIRS_RIGHT: 6, UP_STAIRS_LEFT: 7, DOWN_STAIRS_RIGHT: 8, DOWN_STAIRS_LEFT: 9,
    MAGIC_HANDS_GROUND: 10, MAGIC_HANDS_MIDDLE: 11, MAGIC_HANDS_UP: 12, DODGE: 13,
    HIT_FRONT: 14, HIT_BACK: 15, PUNCH: 16, KICK: 17, THROW: 18, RUN: 19,
    FALL_BACK: 20, FALL_FRONT: 21, BAD_LANDING: 22, BIG_HOLE: 23, CHARRED: 24, CHUNKS: 25,
    DANCING_AUTOFIRE: 26, ELECTRIFY: 27, SLICED: 28, BURNED_TO_NOTHING: 29, ELECTRIFIED_TO_NOTHING: 30,
    EXPLODED: 31, MELTED: 32, FIRE_DANCE: 33, FALL_BACK_BLOOD: 34, FALL_FRONT_BLOOD: 35,
    PRONE_TO_STANDING: 36, BACK_TO_STANDING: 37, TAKE_OUT: 38, PUT_AWAY: 39, PARRY: 40,
    THRUST: 41, SWING: 42, POINT: 43, UNPOINT: 44, FIRE_SINGLE: 45, FIRE_BURST: 46, FIRE_CONTINUOUS: 47,
    FALL_BACK_SF: 48, CALLED_SHOT_PIC: 64
  };

  FO.critterFid = function (obj, anim) {
    return FO.fid(FO.ART.CRITTER, FO.fidIndex(obj.fid), anim, FO.fidWeapon(obj.fid));
  };

  const INSTANT = new Set(['call', 'rotate', 'fid', 'sfx', 'unhide', 'hide', 'erase']);

  class Animator {
    constructor(world) {
      this.w = world;
      this.seqs = [];
      this.reg = null;
      this.speed = 1;
    }

    begin() {
      this.reg = [];
      return this.reg;
    }

    end() {
      const steps = this.reg;
      this.reg = null;
      if (steps && steps.length) this.seqs.push({ steps });
      return steps;
    }

    loadSfx(step) {
      if (step.kind === 'sfx' && step.sound && step.handle === undefined) step.handle = FO.loadSfx(this.w.g, step.sound, step.obj);
      return step;
    }

    push(step) {
      this.loadSfx(step);
      if (this.reg) this.reg.push(step);
      else this.seqs.push({ steps: [step] });
      return step;
    }

    run(steps) {
      steps.forEach(st => this.loadSfx(st));
      if (steps.length) this.seqs.push({ steps });
      return steps;
    }

    runCombat(steps) {
      steps.forEach(st => this.loadSfx(st));
      if (steps.length) this.seqs.push({ steps, combat: true });
      return steps;
    }

    drop(s) {
      const audio = this.w.g && this.w.g.audio;
      for (const st of s.steps) {
        if (st.started && !st.finished && st.kind === 'move') this.stopWalk(st.obj);
        if (!st.started && st.handle && audio) audio.free(st.handle);
      }
    }

    idle() {
      return !this.seqs.length;
    }

    combatIdle() {
      return !this.seqs.some(s => s.combat);
    }

    busy(obj) {
      return this.seqs.some(s => s.steps.some(st => !st.finished && st.obj === obj));
    }

    cancel(obj) {
      this.seqs = this.seqs.filter(s => {
        const hit = s.steps.some(st => !st.finished && st.obj === obj);
        if (hit) this.drop(s);
        return !hit;
      });
    }

    stopAll() {
      for (const s of this.seqs) this.drop(s);
      this.seqs = [];
    }

    progress(st) {
      if (st.finished) return Infinity;
      if (st.kind === 'anim') return st.frames | 0;
      if (st.kind === 'move' || st.kind === 'straight') return st.moved | 0;
      if (st.kind === 'wait') return Math.floor((st.time || 0) / 100);
      return 0;
    }

    ready(s, i) {
      if (!i) return true;
      if (s.steps[i].kind === 'erase') return s.steps.slice(0, i).every(st => st.finished);
      const prev = s.steps[i - 1];
      if (!prev.started) return false;
      const delay = s.steps[i].delay === undefined ? -1 : s.steps[i].delay;
      return delay < 0 ? !!prev.finished : this.progress(prev) >= delay;
    }

    update(ms) {
      for (const s of this.seqs.slice()) {
        let dt = ms;
        for (let guard = 0; guard < 64; guard++) {
          let changed = false;
          for (let i = 0; i < s.steps.length; i++) {
            const st = s.steps[i];
            if (st.started) continue;
            if (!this.ready(s, i)) break;
            st.started = true;
            this.start(st);
            changed = true;
          }
          for (const st of s.steps) {
            if (!st.started || st.finished) continue;
            if (this.tick(st, st.ticked ? dt : 0)) {
              st.finished = true;
              changed = true;
            }
            st.ticked = true;
          }
          dt = 0;
          if (!changed) break;
        }
        if (s.steps.every(st => st.finished)) {
          const at = this.seqs.indexOf(s);
          if (at >= 0) this.seqs.splice(at, 1);
        }
      }
    }

    frameMs(frm, st) {
      let fps = frm && frm.fps ? frm.fps : 10;
      if (this.fpsBonus && st && st.obj) fps += this.fpsBonus(st.obj);
      return 1000 / fps / this.speed / (st && st.fast ? 2 : 1);
    }

    start(st) {
      const w = this.w;
      const o = st.obj;
      st.time = 0;
      if (st.kind === 'move') {
        st.path = w.findPath(o, st.tile, st.near || 0);
        st.i = 0;
        st.moved = 0;
        if (!st.path) {
          st.failed = true;
          return;
        }
        if (st.limit !== undefined && st.path.length > st.limit) st.path = st.path.slice(0, Math.max(0, st.limit));
        if (st.run && FO.pidType(o.pid) === FO.PID.CRITTER && FO.canRun && !FO.canRun(o)) st.run = false;
        if (st.path.length && FO.pidType(o.pid) === FO.PID.CRITTER) {
          o.fid = FO.critterFid(o, st.run ? FO.ANIM.RUN : FO.ANIM.WALK);
          o.rot = FO.hexDir(o.tile, st.path[0]);
          o.frame = 0;
        }
      } else if (st.kind === 'straight') {
        st.path = FO.hexLine(o.tile, st.tile).slice(1);
        st.moved = 0;
        if (st.code !== undefined && FO.pidType(o.pid) === FO.PID.CRITTER) {
          o.fid = FO.critterFid(o, st.code);
          o.frame = 0;
          o.x = 0;
          o.y = 0;
        }
        if (st.face && st.path.length) o.rot = FO.hexDir(o.tile, st.tile);
      } else if (st.kind === 'anim') {
        if (FO.pidType(o.pid) === FO.PID.CRITTER && st.code !== undefined) o.fid = FO.critterFid(o, st.code);
        if (st.fid !== undefined) o.fid = st.fid;
        st.reverse = !!st.reverse;
        st.frm = undefined;
        st.frames = 0;
      } else if (st.kind === 'rotate') {
        if (st.tile !== undefined) o.rot = FO.hexDir(o.tile, st.tile);
        else o.rot = ((st.dir % 6) + 6) % 6;
      } else if (st.kind === 'fid') {
        o.fid = st.fid;
        o.frame = 0;
        if (st.reset) {
          o.x = 0;
          o.y = 0;
        }
      } else if (st.kind === 'unhide') {
        o.flags &= ~FO.FLAG.HIDDEN;
      } else if (st.kind === 'hide') {
        o.flags |= FO.FLAG.HIDDEN;
      } else if (st.kind === 'erase') {
        if (o.tile >= 0) w.remove(o);
      } else if (st.kind === 'sfx') {
        if (st.handle) this.w.g.audio.play(st.handle);
      }
    }

    stopWalk(o) {
      o.x = 0;
      o.y = 0;
      o.frame = 0;
      if (FO.pidType(o.pid) === FO.PID.CRITTER && !this.w.isDead(o)) o.fid = FO.critterFid(o, FO.ANIM.STAND);
    }

    tick(st, ms) {
      const w = this.w;
      const o = st.obj;
      if (st.kind === 'call') {
        if (st.fn) st.fn();
        return true;
      }
      if (INSTANT.has(st.kind)) return true;
      if (st.kind === 'until') return !!st.test();
      if (st.kind === 'wait') {
        st.time += ms;
        return st.time >= st.ms;
      }
      if (st.kind === 'move') return this.tickMove(st, ms);
      if (st.kind === 'straight') return this.tickStraight(st, ms);
      if (st.kind === 'anim') {
        const frm = w.art.get(o.fid);
        if (frm === undefined) return false;
        if (frm === null) return this.finishAnim(st);
        const n = FO.frameOf(frm, o.rot, 0)[0].frames.length;
        if (st.frm === undefined) {
          st.frm = frm;
          o.frame = st.reverse ? n - 1 : 0;
          if (n <= 1) return this.finishAnim(st);
        }
        st.time += ms;
        const fm = this.frameMs(frm, st);
        while (st.time >= fm) {
          st.time -= fm;
          let next = o.frame + (st.reverse ? -1 : 1);
          if ((next < 0 || next >= n) && st.forever) next = st.reverse ? n - 1 : 0;
          if (next < 0 || next >= n) return this.finishAnim(st);
          o.frame = next;
          st.frames++;
          if (!st.noOffset) {
            const f = FO.frameOf(frm, o.rot, o.frame)[1];
            o.x += st.reverse ? -f.ox : f.ox;
            o.y += st.reverse ? -f.oy : f.oy;
          }
          if (st.onFrame) st.onFrame(o.frame);
        }
        return false;
      }
      return true;
    }

    finishAnim(st) {
      const o = st.obj;
      if (!st.hold && FO.pidType(o.pid) === FO.PID.CRITTER && !this.w.isDead(o)) {
        o.fid = FO.critterFid(o, FO.ANIM.STAND);
        o.frame = 0;
        o.x = 0;
        o.y = 0;
      }
      if (st.hideAfter) o.flags |= FO.FLAG.HIDDEN;
      if (st.done) st.done();
      return true;
    }

    tickStraight(st, ms) {
      const w = this.w;
      const o = st.obj;
      const frm = w.art.get(o.fid);
      if (frm === undefined) return false;
      const n = frm ? FO.frameOf(frm, o.rot, 0)[0].frames.length : 1;
      st.time += ms;
      const fm = this.frameMs(frm, st);
      while (st.time >= fm) {
        st.time -= fm;
        if (st.code !== undefined) o.frame = Math.min(n - 1, o.frame + 1);
        else if (n > 1) o.frame = (o.frame + 1) % n;
        if (st.moved < st.path.length) {
          w.place(o, st.path[st.moved], o.elev);
          st.moved++;
        }
        if (st.moved >= st.path.length && (st.code === undefined || o.frame >= n - 1)) {
          if (st.done) st.done();
          return true;
        }
      }
      return false;
    }

    tickMove(st, ms) {
      const w = this.w;
      const o = st.obj;
      if (st.failed) {
        if (st.done) st.done(false);
        return true;
      }
      if (st.i >= st.path.length) {
        this.stopWalk(o);
        if (st.done) st.done(true);
        return true;
      }
      const frm = w.art.get(o.fid);
      if (frm === undefined) return false;
      if (frm === null) {
        w.place(o, st.path[st.path.length - 1], o.elev);
        st.i = st.path.length;
        return false;
      }
      st.time += ms;
      const fm = this.frameMs(frm, st);
      while (st.time >= fm) {
        st.time -= fm;
        const dir = FO.frameOf(frm, o.rot, 0)[0];
        o.frame = (o.frame + 1) % dir.frames.length;
        const f = dir.frames[o.frame];
        o.x += f.ox;
        o.y += f.oy;
        const next = st.path[st.i];
        const [ax, ay] = FO.hexCenter(o.tile);
        const [bx, by] = FO.hexCenter(next);
        const sx = bx - ax;
        const sy = by - ay;
        if (o.x * sx + o.y * sy >= sx * sx + sy * sy) {
          let block = w.blocker(next, o.elev, o);
          if (block && w.on.door && w.canUseDoor(o, block)) {
            w.on.door(o, block);
            block = null;
          }
          if (block) {
            const again = st.limit === undefined ? w.findPath(o, st.tile, st.near || 0) : null;
            if (!again || !again.length || st.retried) {
              this.stopWalk(o);
              if (st.done) st.done(false);
              return true;
            }
            st.retried = true;
            st.path = again;
            st.i = 0;
            o.x = 0;
            o.y = 0;
            o.rot = FO.hexDir(o.tile, st.path[0]);
            continue;
          }
          o.x -= sx;
          o.y -= sy;
          w.place(o, next, o.elev);
          st.i++;
          st.moved++;
          if (w.stepped(o, st) === false || st.i >= st.path.length) {
            this.stopWalk(o);
            if (st.done) st.done(st.i >= st.path.length);
            return true;
          }
          o.rot = FO.hexDir(o.tile, st.path[st.i]);
        }
      }
      return false;
    }
  }

  FO.Animator = Animator;
})(globalThis.FO = globalThis.FO || {});
