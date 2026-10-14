(function (FO) {
  'use strict';

  const T = { INT: 0, FLOAT: 1, STR: 2, OBJ: 3, SREF: 4 };
  FO.VT = T;
  const SUSPEND = { suspend: true };
  FO.SUSPEND = SUSPEND;
  const RETURN_HOME = -1;

  FO.OPCODES = {
    0x804D: ['say_end', 0, 0], 0x804E: ['say_start', 0, 0], 0x8052: ['say_reply', 2, 0], 0x8053: ['say_option', 2, 0], 0x8054: ['say_message', 2, 0],
    0x80A1: ['give_exp_points', 1, 0], 0x80A2: ['scr_return', 1, 0], 0x80A3: ['play_sfx', 1, 0], 0x80A4: ['obj_name', 1, 1], 0x80A5: ['sfx_build_open_name', 2, 1],
    0x80A6: ['get_pc_stat', 1, 1], 0x80A7: ['tile_contains_pid_obj', 3, 1], 0x80A8: ['set_map_start', 4, 0], 0x80A9: ['override_map_start', 4, 0],
    0x80AA: ['has_skill', 2, 1], 0x80AB: ['using_skill', 2, 1], 0x80AC: ['roll_vs_skill', 3, 1], 0x80AD: ['skill_contest', 3, 1], 0x80AE: ['do_check', 3, 1],
    0x80AF: ['is_success', 1, 1], 0x80B0: ['is_critical', 1, 1], 0x80B1: ['how_much', 1, 1], 0x80B2: ['mark_area_known', 3, 0], 0x80B3: ['reaction_influence', 3, 1],
    0x80B4: ['random', 2, 1], 0x80B5: ['roll_dice', 2, 1], 0x80B6: ['move_to', 3, 1], 0x80B7: ['create_object_sid', 4, 1], 0x80B8: ['display_msg', 1, 0],
    0x80B9: ['script_overrides', 0, 0], 0x80BA: ['obj_is_carrying_obj_pid', 2, 1], 0x80BB: ['tile_contains_obj_pid', 3, 1], 0x80BC: ['self_obj', 0, 1],
    0x80BD: ['source_obj', 0, 1], 0x80BE: ['target_obj', 0, 1], 0x80BF: ['dude_obj', 0, 1], 0x80C0: ['obj_being_used_with', 0, 1], 0x80C1: ['local_var', 1, 1],
    0x80C2: ['set_local_var', 2, 0], 0x80C3: ['map_var', 1, 1], 0x80C4: ['set_map_var', 2, 0], 0x80C5: ['global_var', 1, 1], 0x80C6: ['set_global_var', 2, 0],
    0x80C7: ['script_action', 0, 1], 0x80C8: ['obj_type', 1, 1], 0x80C9: ['obj_item_subtype', 1, 1], 0x80CA: ['get_critter_stat', 2, 1], 0x80CB: ['set_critter_stat', 3, 1],
    0x80CC: ['animate_stand_obj', 1, 0], 0x80CD: ['animate_stand_reverse_obj', 1, 0], 0x80CE: ['animate_move_obj_to_tile', 3, 0], 0x80CF: ['tile_in_tile_rect', 5, 1],
    0x80D0: ['attack_complex', 8, 0], 0x80D1: ['make_daytime', 0, 0], 0x80D2: ['tile_distance', 2, 1], 0x80D3: ['tile_distance_objs', 2, 1], 0x80D4: ['tile_num', 1, 1],
    0x80D5: ['tile_num_in_direction', 3, 1], 0x80D6: ['pickup_obj', 1, 0], 0x80D7: ['drop_obj', 1, 0], 0x80D8: ['add_obj_to_inven', 2, 0], 0x80D9: ['rm_obj_from_inven', 2, 0],
    0x80DA: ['wield_obj_critter', 2, 0], 0x80DB: ['use_obj', 1, 0], 0x80DC: ['obj_can_see_obj', 2, 1], 0x80DE: ['start_gdialog', 5, 0], 0x80DF: ['end_dialogue', 0, 0],
    0x80E0: ['dialogue_reaction', 1, 0], 0x80E3: ['set_obj_visibility', 2, 0], 0x80E4: ['load_map', 2, 0], 0x80E5: ['barter_offer', 3, 0], 0x80E6: ['barter_ask', 3, 0],
    0x80E7: ['anim_busy', 1, 1], 0x80E8: ['critter_heal', 2, 1], 0x80E9: ['set_light_level', 1, 0], 0x80EA: ['game_time', 0, 1], 0x80EB: ['game_time_in_seconds', 0, 1],
    0x80EC: ['elevation', 1, 1], 0x80ED: ['kill_critter', 2, 0], 0x80EE: ['kill_critter_type', 2, 0], 0x80EF: ['critter_damage', 3, 0], 0x80F0: ['add_timer_event', 3, 0],
    0x80F1: ['rm_timer_event', 1, 0], 0x80F2: ['game_ticks', 1, 1], 0x80F3: ['has_trait', 3, 1], 0x80F4: ['destroy_object', 1, 0], 0x80F5: ['obj_can_hear_obj', 2, 1],
    0x80F6: ['game_time_hour', 0, 1], 0x80F7: ['fixed_param', 0, 1], 0x80F8: ['tile_is_visible', 1, 1], 0x80F9: ['dialogue_system_enter', 0, 0], 0x80FA: ['action_being_used', 0, 1],
    0x80FB: ['critter_state', 1, 1], 0x80FC: ['game_time_advance', 1, 0], 0x80FD: ['radiation_inc', 2, 0], 0x80FE: ['radiation_dec', 2, 0], 0x80FF: ['critter_attempt_placement', 3, 1],
    0x8100: ['obj_pid', 1, 1], 0x8101: ['cur_map_index', 0, 1], 0x8102: ['critter_add_trait', 4, 0], 0x8103: ['critter_rm_trait', 4, 0], 0x8104: ['proto_data', 2, 1],
    0x8105: ['message_str', 2, 1], 0x8106: ['critter_inven_obj', 2, 1], 0x8107: ['obj_set_light_level', 3, 0], 0x8108: ['town_map', 0, 0], 0x8109: ['world_map', 0, 0],
    0x810A: ['float_msg', 3, 0], 0x810B: ['metarule', 2, 1], 0x810C: ['anim', 3, 0], 0x810D: ['obj_carrying_pid_obj', 2, 1], 0x810E: ['reg_anim_func', 2, 0],
    0x810F: ['reg_anim_animate', 3, 0], 0x8110: ['reg_anim_animate_reverse', 3, 0], 0x8111: ['reg_anim_obj_move_to_obj', 3, 0], 0x8112: ['reg_anim_obj_run_to_obj', 3, 0],
    0x8113: ['reg_anim_obj_move_to_tile', 3, 0], 0x8114: ['reg_anim_obj_run_to_tile', 3, 0], 0x8115: ['play_gmovie', 1, 0], 0x8116: ['add_mult_objs_to_inven', 3, 0],
    0x8117: ['rm_mult_objs_from_inven', 3, 1], 0x8118: ['get_month', 0, 1], 0x8119: ['get_day', 0, 1], 0x811A: ['explosion', 3, 0], 0x811B: ['days_since_visited', 0, 1],
    0x811C: ['gsay_start', 0, 0], 0x811D: ['gsay_end', 0, 0], 0x811E: ['gsay_reply', 2, 0], 0x811F: ['gsay_option', 4, 0], 0x8120: ['gsay_message', 3, 0],
    0x8121: ['giq_option', 5, 0], 0x8122: ['poison', 2, 0], 0x8123: ['get_poison', 1, 1], 0x8124: ['party_add', 1, 0], 0x8125: ['party_remove', 1, 0],
    0x8126: ['reg_anim_animate_forever', 2, 0], 0x8127: ['critter_injure', 2, 0], 0x8128: ['combat_is_initialized', 0, 1], 0x8129: ['gdialog_barter', 1, 0],
    0x812A: ['difficulty_level', 0, 1], 0x812B: ['running_burning_guy', 0, 1], 0x812C: ['inven_unwield', 0, 0], 0x812D: ['obj_is_locked', 1, 1], 0x812E: ['obj_lock', 1, 0],
    0x812F: ['obj_unlock', 1, 0], 0x8130: ['obj_is_open', 1, 1], 0x8131: ['obj_open', 1, 0], 0x8132: ['obj_close', 1, 0], 0x8133: ['game_ui_disable', 0, 0],
    0x8134: ['game_ui_enable', 0, 0], 0x8135: ['game_ui_is_disabled', 0, 1], 0x8136: ['gfade_out', 1, 0], 0x8137: ['gfade_in', 1, 0], 0x8138: ['item_caps_total', 1, 1],
    0x8139: ['item_caps_adjust', 2, 1], 0x813A: ['anim_action_frame', 2, 1], 0x813B: ['reg_anim_play_sfx', 3, 0], 0x813C: ['critter_mod_skill', 3, 1],
    0x813D: ['sfx_build_char_name', 3, 1], 0x813E: ['sfx_build_ambient_name', 1, 1], 0x813F: ['sfx_build_interface_name', 1, 1], 0x8140: ['sfx_build_item_name', 1, 1],
    0x8141: ['sfx_build_weapon_name', 4, 1], 0x8142: ['sfx_build_scenery_name', 3, 1], 0x8143: ['attack_setup', 2, 0], 0x8144: ['destroy_mult_objs', 2, 1],
    0x8145: ['use_obj_on_obj', 2, 0], 0x8146: ['endgame_slideshow', 0, 0], 0x8147: ['move_obj_inven_to_obj', 2, 0], 0x8148: ['endgame_movie', 0, 0],
    0x8149: ['obj_art_fid', 1, 1], 0x814A: ['art_anim', 1, 1], 0x814B: ['party_member_obj', 1, 1], 0x814C: ['rotation_to_tile', 2, 1], 0x814D: ['jam_lock', 1, 0],
    0x814E: ['gdialog_set_barter_mod', 1, 0], 0x814F: ['combat_difficulty', 0, 1], 0x8150: ['obj_on_screen', 1, 1], 0x8151: ['critter_is_fleeing', 1, 1],
    0x8152: ['critter_set_flee_state', 2, 0], 0x8153: ['terminate_combat', 0, 0], 0x8154: ['debug_msg', 1, 0], 0x8155: ['critter_stop_attacking', 1, 0]
  };

  class ScriptError extends Error {
    constructor(prog, msg) {
      super(prog.name + '@' + prog.ip + ': ' + msg);
      this.prog = prog;
    }
  }

  FO.ScriptError = ScriptError;

  class Program {
    constructor(parsed, name) {
      this.name = name;
      this.code = parsed.bytes;
      this.procs = parsed.procs;
      this.names = parsed.names;
      this.strings = parsed.strings;
      this.procByName = new Map();
      parsed.procs.forEach((p, i) => {
        const k = p.name.toLowerCase();
        if (!this.procByName.has(k)) this.procByName.set(k, i);
      });
      this.vals = new Array(1024);
      this.types = new Uint8Array(1024);
      this.sp = 0;
      this.rvals = [];
      this.base = 0;
      this.globalBase = 0;
      this.ip = 0;
      this.exited = false;
      this.waiting = null;
      this.depth = 0;
    }

    proc(name) {
      const i = this.procByName.get(String(name).toLowerCase());
      return i === undefined ? -1 : i;
    }

    push(v, t) {
      if (this.sp >= this.vals.length) {
        if (this.sp > 65536) throw new ScriptError(this, 'stack overflow');
        const nt = new Uint8Array(this.types.length * 2);
        nt.set(this.types);
        this.types = nt;
        this.vals.length *= 2;
      }
      this.vals[this.sp] = v;
      this.types[this.sp] = t;
      this.sp++;
    }

    pushInt(v) { this.push(v | 0, T.INT); }
    pushFloat(v) { this.push(+v, T.FLOAT); }
    pushStr(v) { this.push(String(v), T.STR); }

    pushObj(o) {
      if (o) this.push(o, T.OBJ);
      else this.push(0, T.INT);
    }

    pushAny(v) {
      if (v && typeof v === 'object') this.push(v, T.OBJ);
      else if (typeof v === 'string') this.push(v, T.STR);
      else if (typeof v === 'number' && !Number.isInteger(v)) this.push(v, T.FLOAT);
      else this.push(v | 0, T.INT);
    }

    popRaw() {
      if (this.sp <= 0) {
        this.underflow = (this.underflow || 0) + 1;
        return [0, T.INT];
      }
      this.sp--;
      return [this.vals[this.sp], this.types[this.sp]];
    }

    str(v, t) {
      if (t === T.STR) return v;
      if (t === T.SREF) {
        const s = this.strings.get(v);
        return s !== undefined ? s : (this.names.get(v) || '');
      }
      if (t === T.FLOAT) return v.toFixed(5);
      if (t === T.OBJ) return v && v.name ? v.name : '';
      return String(v);
    }

    ident(v, t) {
      if (t === T.SREF) {
        const s = this.names.get(v);
        return s !== undefined ? s : (this.strings.get(v) || '');
      }
      return this.str(v, t);
    }

    popInt() {
      const [v, t] = this.popRaw();
      if (t === T.INT) return v;
      if (t === T.FLOAT) return Math.trunc(v) | 0;
      if (t === T.OBJ) return v ? 1 : 0;
      if (t === T.STR) return parseInt(v, 10) | 0;
      return v | 0;
    }

    popNum() {
      const [v, t] = this.popRaw();
      if (t === T.INT || t === T.FLOAT) return v;
      if (t === T.OBJ) return v ? 1 : 0;
      return parseFloat(this.str(v, t)) || 0;
    }

    popStr() {
      const [v, t] = this.popRaw();
      return this.str(v, t);
    }

    popName() {
      const [v, t] = this.popRaw();
      return this.ident(v, t);
    }

    popObj() {
      const [v, t] = this.popRaw();
      if (t === T.OBJ) return v;
      return null;
    }

    popAny() {
      const [v, t] = this.popRaw();
      if (t === T.SREF) return this.str(v, t);
      return v;
    }

    rpush(v) { this.rvals.push(v); }

    rpop() {
      if (!this.rvals.length) throw new ScriptError(this, 'return stack underflow');
      return this.rvals.pop();
    }

    i32(at) {
      const c = this.code;
      return (c[at] << 24) | (c[at + 1] << 16) | (c[at + 2] << 8) | c[at + 3];
    }
  }

  FO.Program = Program;

  function truthy(v, t) {
    if (t === T.STR || t === T.SREF) return true;
    if (t === T.OBJ) return !!v;
    return v !== 0;
  }

  function compare(p, op) {
    const [b, tb] = p.popRaw();
    const [a, ta] = p.popRaw();
    let r;
    const strA = ta === T.STR || ta === T.SREF;
    const strB = tb === T.STR || tb === T.SREF;
    if (ta === T.OBJ || tb === T.OBJ) {
      const ia = ta === T.OBJ ? (a ? a.id || 1 : 0) : a;
      const ib = tb === T.OBJ ? (b ? b.id || 1 : 0) : b;
      if (op === 0x8033) return a === b || (ia === 0 && ib === 0) ? 1 : 0;
      if (op === 0x8034) return a === b || (ia === 0 && ib === 0) ? 0 : 1;
      r = ia - ib;
    } else if (strA || strB) {
      const sa = p.str(a, ta);
      const sb = p.str(b, tb);
      r = sa < sb ? -1 : sa > sb ? 1 : 0;
    } else {
      r = a - b;
    }
    switch (op) {
      case 0x8033: return r === 0 ? 1 : 0;
      case 0x8034: return r !== 0 ? 1 : 0;
      case 0x8035: return r <= 0 ? 1 : 0;
      case 0x8036: return r >= 0 ? 1 : 0;
      case 0x8037: return r < 0 ? 1 : 0;
      default: return r > 0 ? 1 : 0;
    }
  }

  function arith(p, op) {
    const [b, tb] = p.popRaw();
    const [a, ta] = p.popRaw();
    if (op === 0x8039 && (ta === T.STR || ta === T.SREF || tb === T.STR || tb === T.SREF)) {
      p.pushStr(p.str(a, ta) + p.str(b, tb));
      return;
    }
    const na = ta === T.OBJ ? (a ? 1 : 0) : (ta === T.STR || ta === T.SREF ? parseFloat(p.str(a, ta)) || 0 : a);
    const nb = tb === T.OBJ ? (b ? 1 : 0) : (tb === T.STR || tb === T.SREF ? parseFloat(p.str(b, tb)) || 0 : b);
    const fl = ta === T.FLOAT || tb === T.FLOAT;
    let r;
    switch (op) {
      case 0x8039: r = na + nb; break;
      case 0x803A: r = na - nb; break;
      case 0x803B: r = fl ? na * nb : Math.imul(na, nb); break;
      case 0x803C:
        if (nb === 0) throw new ScriptError(p, 'division by zero');
        r = fl ? na / nb : Math.trunc(na / nb);
        break;
      default:
        if (nb === 0) throw new ScriptError(p, 'modulo by zero');
        r = na % nb;
    }
    if (fl) p.pushFloat(r);
    else p.pushInt(r);
  }

  class VM {
    constructor(host) {
      this.host = host;
      this.handlers = {};
      this.exports = new Map();
      this.budget = 2000000;
      this.missing = new Map();
    }

    register(name, fn) {
      this.handlers[name] = fn;
    }

    run(p, ctx) {
      const code = p.code;
      let steps = 0;
      p.ctx = ctx;
      while (!p.exited) {
        if (++steps > this.budget) throw new ScriptError(p, 'instruction budget exceeded');
        if (p.ip === RETURN_HOME) return 'done';
        const at = p.ip;
        if (at < 0 || at + 2 > code.length) throw new ScriptError(p, 'ran off the code');
        const op = (code[at] << 8) | code[at + 1];
        p.ip = at + 2;
        if (op === 0xC001) {
          p.pushInt(p.i32(p.ip));
          p.ip += 4;
          continue;
        }
        if (op === 0xA001) {
          const dv = new DataView(code.buffer, code.byteOffset + p.ip, 4);
          p.pushFloat(dv.getFloat32(0));
          p.ip += 4;
          continue;
        }
        if (op === 0x9001) {
          p.push(p.i32(p.ip), T.SREF);
          p.ip += 4;
          continue;
        }
        if (op >= 0x80A1 || (op >= 0x804C && op <= 0x80A0)) {
          const r = this.game(p, op);
          if (r === SUSPEND) return 'suspended';
          continue;
        }
        this.core(p, op);
        if (p.suspendNow) {
          p.suspendNow = false;
          return 'suspended';
        }
      }
      return 'exited';
    }

    core(p, op) {
      switch (op) {
        case 0x8000: case 0x8002: case 0x8003: case 0x804A: case 0x804B: case 0x800F:
          return;
        case 0x8004: p.ip = p.popInt(); return;
        case 0x8005: {
          const idx = p.popInt();
          const proc = p.procs[idx];
          if (!proc) throw new ScriptError(p, 'call to missing procedure ' + idx);
          p.ip = proc.body;
          return;
        }
        case 0x800C: {
          const v = p.rpop();
          p.push(v[0], v[1]);
          return;
        }
        case 0x800D: p.rpush(p.popRaw()); return;
        case 0x8010: case 0x8011: case 0x800E: p.exited = true; return;
        case 0x8012: {
          const i = p.globalBase + p.popInt();
          p.push(p.vals[i], p.types[i]);
          return;
        }
        case 0x8013: {
          const i = p.globalBase + p.popInt();
          const [v, t] = p.popRaw();
          p.vals[i] = v;
          p.types[i] = t;
          return;
        }
        case 0x8014: {
          const name = p.popName().toLowerCase();
          const e = this.exports.get(name);
          if (e) p.push(e[0], e[1]);
          else p.pushInt(0);
          return;
        }
        case 0x8015: {
          const name = p.popName().toLowerCase();
          this.exports.set(name, p.popRaw());
          return;
        }
        case 0x8016: {
          const name = p.popName().toLowerCase();
          if (!this.exports.has(name)) this.exports.set(name, [0, T.INT]);
          return;
        }
        case 0x8018: {
          const a = p.popRaw();
          const b = p.popRaw();
          p.push(a[0], a[1]);
          p.push(b[0], b[1]);
          return;
        }
        case 0x8019: {
          const a = p.rpop();
          const b = p.rpop();
          p.rpush(a);
          p.rpush(b);
          return;
        }
        case 0x801A: p.popRaw(); return;
        case 0x801B: {
          const [v, t] = p.popRaw();
          p.push(v, t);
          p.push(v, t);
          return;
        }
        case 0x801C: {
          const r = p.rpop();
          p.ip = Array.isArray(r) ? r[0] : r;
          if (p.ip !== RETURN_HOME && typeof p.ip === 'object' && p.ip) {
            const mark = p.ip;
            p.ip = mark.resume;
            if (mark.drop) p.popRaw();
            if (mark.after && mark.after(p) === SUSPEND) p.suspendNow = true;
          }
          return;
        }
        case 0x8027: {
          p.popInt();
          p.popInt();
          return;
        }
        case 0x8028: {
          const name = p.popStr();
          p.pushInt(p.proc(name));
          return;
        }
        case 0x8029: {
          const r = p.rpop();
          p.base = Array.isArray(r) ? r[0] : r;
          return;
        }
        case 0x802A: p.sp = p.base; return;
        case 0x802B: {
          const n = p.popInt();
          p.rpush(p.base);
          p.base = p.sp - n;
          return;
        }
        case 0x802C: p.globalBase = p.sp; return;
        case 0x802F: {
          const [v, t] = p.popRaw();
          const addr = p.popInt();
          if (!truthy(v, t)) p.ip = addr;
          return;
        }
        case 0x8030: {
          const [v, t] = p.popRaw();
          if (!truthy(v, t)) p.ip = p.popInt();
          return;
        }
        case 0x8031: {
          const i = p.base + p.popInt();
          const [v, t] = p.popRaw();
          p.vals[i] = v;
          p.types[i] = t;
          if (i >= p.sp) p.sp = i + 1;
          return;
        }
        case 0x8032: {
          const i = p.base + p.popInt();
          p.push(p.vals[i], p.types[i]);
          return;
        }
        case 0x8033: case 0x8034: case 0x8035: case 0x8036: case 0x8037: case 0x8038:
          p.pushInt(compare(p, op));
          return;
        case 0x8039: case 0x803A: case 0x803B: case 0x803C: case 0x803D:
          arith(p, op);
          return;
        case 0x803E: {
          const [b, tb] = p.popRaw();
          const [a, ta] = p.popRaw();
          p.pushInt(truthy(a, ta) && truthy(b, tb) ? 1 : 0);
          return;
        }
        case 0x803F: {
          const [b, tb] = p.popRaw();
          const [a, ta] = p.popRaw();
          p.pushInt(truthy(a, ta) || truthy(b, tb) ? 1 : 0);
          return;
        }
        case 0x8040: { const b = p.popInt(); p.pushInt(p.popInt() & b); return; }
        case 0x8041: { const b = p.popInt(); p.pushInt(p.popInt() | b); return; }
        case 0x8042: { const b = p.popInt(); p.pushInt(p.popInt() ^ b); return; }
        case 0x8043: p.pushInt(~p.popInt()); return;
        case 0x8044: p.pushInt(Math.floor(p.popNum())); return;
        case 0x8045: {
          const [v, t] = p.popRaw();
          p.pushInt(truthy(v, t) ? 0 : 1);
          return;
        }
        case 0x8046: {
          const [v, t] = p.popRaw();
          if (t === T.FLOAT) p.pushFloat(-v);
          else p.pushInt(-(t === T.INT ? v : 0));
          return;
        }
        default:
          if (op >= 0x8020 && op <= 0x8026) {
            p.exited = true;
            return;
          }
          throw new ScriptError(p, 'unknown core opcode 0x' + op.toString(16));
      }
    }

    game(p, op) {
      const sig = FO.OPCODES[op];
      if (!sig) throw new ScriptError(p, 'unknown opcode 0x' + op.toString(16));
      const fn = this.handlers[sig[0]];
      if (!fn) {
        this.missing.set(sig[0], (this.missing.get(sig[0]) || 0) + 1);
        const args = [];
        for (let i = 0; i < sig[1]; i++) args.push(p.popAny());
        if (sig[2]) p.pushInt(0);
        return null;
      }
      return fn(p, p.ctx);
    }

    start(p, ctx) {
      p.ip = 0;
      p.sp = 0;
      p.rvals = [];
      p.base = 0;
      p.globalBase = 0;
      p.exited = false;
      return this.run(p, ctx);
    }

    call(p, index, ctx, args) {
      const proc = p.procs[index];
      if (!proc) return { state: 'missing' };
      const saveSp = p.sp;
      const saveBase = p.base;
      const saveR = p.rvals.length;
      const saveIp = p.ip;
      p.exited = false;
      p.rpush(RETURN_HOME);
      const list = args || [];
      for (const a of list) p.pushAny(a);
      p.pushInt(list.length);
      p.ip = proc.body;
      p.depth++;
      let state;
      try {
        state = this.run(p, ctx);
      } catch (e) {
        p.sp = saveSp;
        p.base = saveBase;
        p.rvals.length = saveR;
        p.ip = saveIp;
        p.depth--;
        throw e;
      }
      if (state === 'suspended') {
        p.waiting = { saveSp, saveBase, saveR, saveIp, ctx };
        return { state };
      }
      p.depth--;
      const ret = state === 'done' && p.sp > saveSp ? p.popAny() : 0;
      p.sp = saveSp;
      p.base = saveBase;
      p.rvals.length = saveR;
      p.ip = saveIp;
      return { state, ret };
    }

    resume(p, value, callProc, after) {
      const w = p.waiting;
      if (!w) return { state: 'idle' };
      p.waiting = null;
      if (value !== undefined) p.pushAny(value);
      if (callProc !== undefined && callProc >= 0 && p.procs[callProc]) {
        p.rpush({ resume: p.ip, drop: true, after });
        p.pushInt(0);
        p.ip = p.procs[callProc].body;
      } else if (after && after(p) === SUSPEND) {
        p.waiting = w;
        return { state: 'suspended' };
      }
      let state;
      try {
        state = this.run(p, w.ctx);
      } catch (e) {
        p.sp = w.saveSp;
        p.base = w.saveBase;
        p.rvals.length = w.saveR;
        p.ip = w.saveIp;
        p.depth--;
        throw e;
      }
      if (state === 'suspended') {
        p.waiting = w;
        return { state };
      }
      p.depth--;
      p.sp = w.saveSp;
      p.base = w.saveBase;
      p.rvals.length = w.saveR;
      p.ip = w.saveIp;
      return { state };
    }
  }

  FO.VM = VM;
})(globalThis.FO = globalThis.FO || {});
