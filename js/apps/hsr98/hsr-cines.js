(function (H) {
  'use strict';
  const K = H.Cine.Kit, CU = H.Cine.closeup, TWO = H.Cine.two;
  const { LW, LH, BAR, cl, lerp, sm, eOut, eIn, seg, hx, rgba, glow, lighter, poly, rect, ell, line, ring, flash, vignette } = K;
  const LOW = LH - BAR + 6;
  const M2 = 262;

  function wolfGlyph(g, x, y, a) {
    poly(g, rgba('#4ae8ff', a), [x - 12, y + 8, x - 10, y - 10, x - 4, y - 2, x + 4, y - 2, x + 10, y - 10, x + 12, y + 8, x, y + 14]);
    poly(g, rgba('#2a0a2a', a), [x - 6, y + 2, x - 2, y + 2, x - 4, y + 5]);
    poly(g, rgba('#2a0a2a', a), [x + 6, y + 2, x + 2, y + 2, x + 4, y + 5]);
    rect(g, rgba('#ff4aa8', a), x - 1, y + 8, 2, 3);
  }

  let raster = null;
  function threeD(S, fn) {
    const R = raster || (raster = new H.R3.Raster(LW, LH));
    fn(R, H.WarpKit, H.R3.M);
    R.finish(S.g, 0, 0, LW, LH);
  }

  function voiceGlow(S, a) { K.stellaron(S.g, 256, 70, 7, S.T, a == null ? 0.8 : a); }

  function dreamBg(S) {
    const g = S.g;
    K.vgrad(g, 0, LH, [[0, '#02040e'], [1, '#0e1a36']]);
    for (let i = 0; i < 90; i++) {
      const y = ((hx(i, 3, 5) * LH - S.T * (10 + hx(i, 4, 5) * 20)) % LH + LH) % LH;
      rect(g, rgba('#c8e4ff', 0.5 * hx(i, 2, 5)), Math.floor(hx(i, 1, 5) * LW), Math.floor(y), 1, 1);
    }
  }

  function dream(line, who, o = {}) {
    return {
      d: o.d || 3.2, sub: [[0.15, line]], draw: S => {
        dreamBg(S);
        if (o.voice) voiceGlow(S, 0.6 + 0.4 * Math.sin(S.T * 3));
        if (who) {
          const push = lerp(1, 1.04, S.t / 3.2);
          S.g.save(); S.g.translate(o.x || 110, LOW); S.g.scale(push, push);
          S.bust(who, 0, 0, 132, { v: o.v, tint: '#4a6ad8', ta: 0.28, flip: o.flip });
          S.g.restore();
        }
        vignette(S.g, 0.7, '#000010');
      }
    };
  }

  function archive(lines, cast) {
    return {
      d: 2 + lines.length * 3.2, sub: lines.map((l, i) => [0.2 + i * 3.2, l]), sfx: [[0.05, 'glint']], draw: S => {
        const g = S.g, t = S.t;
        K.vgrad(g, 0, LH, [[0, '#140a02'], [1, '#2a1804']]);
        lighter(g, () => glow(g, 160, 120, 150, '#ffa030', 0.25));
        cast.forEach(([who, x, flip, foe], i) => {
          const a = 0.55 + 0.25 * Math.sin(S.T * 9 + i) + (hx(Math.floor(S.T * 14), i, 2) > 0.9 ? -0.4 : 0);
          if (foe) S.foe(foe, x, 214, 120, { tint: '#ffb040', ta: 0.85, a });
          else S.fig(who, x, M2, { k: 2, flip, tint: '#ffb040', ta: 0.85, a });
        });
        for (let y = BAR; y < LH - BAR; y += 2) rect(g, 'rgba(0,0,0,0.25)', 0, y, LW, 1);
        rect(g, rgba('#ffd080', 0.08 + 0.05 * Math.sin(t * 20)), 0, BAR + ((t * 60) % 180), LW, 6);
        vignette(g, 0.6);
      }
    };
  }

  const CINES = {
    c_attack: {
      music: 'station',
      shots: [
        { d: 3.4, sfx: [[0.1, 'rumble']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('space', S.T, { station: { x: 170, y: 132, s: lerp(1.15, 1.3, t / 3.4), hit: true } });
          for (let i = 0; i < 7; i++) {
            const ph = (t * 0.55 + i / 7) % 1, x = lerp(-30, 230, ph) + i * 8, y = 40 + i * 20 - ph * 12;
            poly(g, '#1a0a1a', [x, y, x - 12, y - 3, x - 9, y, x - 12, y + 3]);
            lighter(g, () => glow(g, x - 14, y, 6, '#b050ff', 0.9));
          }
          if ((t * 2.5) % 1 < 0.12) flash(g, '#ffb070', 0.2);
        } },
        { d: 2.6, sub: [[0.2, '=Обитатели станции|А-а-а!'], [1.3, '=Обитатели станции|Что это?!']], sfx: [[0.8, 'hit']], draw: S => {
          const t = S.t, g = S.g;
          g.save(); S.shake(t, t > 0.8 && t < 1.3 ? 2 : 0);
          S.bg('station', S.T, { kind: 'hall', alert: true, fire: true });
          lighter(g, () => glow(g, 160, 118, 20 + seg(t, 0.8, 1.2) * 60, '#ff9a40', seg(t, 0.8, 1) * (1 - seg(t, 1.2, 2.4))));
          for (let i = 0; i < 7; i++) S.sprite(i % 3 ? 'scientist' : 'townswoman', 'left', Math.floor(S.T * 8 + i) % 4, lerp(210 + i * 22, -30 + i * 14, t / 2.6), 178 + (i % 3) * 13);
          g.restore();
        } },
        { d: 2.4, sub: [[0.15, 'asta|Возглавь эвакуацию, быстро!']], draw: CU('station', 'asta', { bgo: { kind: 'control', alert: true }, side: 'l', v: { mouth: 'open' } }) },
        { d: 2.2, sub: [[0.3, 'arlan|Вперёд!']], draw: S => {
          const t = S.t;
          S.bg('station', S.T, { kind: 'hall', alert: true });
          for (let i = 0; i < 4; i++) S.fig(i % 2 ? 'scientist' : 'townswoman', lerp(-30 - i * 36, 340 - i * 30, t / 2.2), 196 + (i % 2) * 6);
          S.fig('arlan', lerp(120, 150, t / 2.2), M2, { k: 2, rot: Math.sin(S.T * 3) * 0.03 });
        } },
        { d: 2.4, sub: [[0.3, 'march|Осторожно!']], sfx: [[0.45, 'shield']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('station', S.T, { kind: 'storage', alert: true });
          S.foe('reaver', lerp(262, 226, eOut(t / 0.6)), 200, 96);
          S.fig('march', 108, M2, { k: 2 });
          K.hexShield(g, 172, 128, 42, seg(t, 0.4, 0.6), S.T);
          if (t > 0.45 && t < 0.85) K.shards(g, (t - 0.45) * 3, 190, 124, 12, 3, '#b8f4ff', 50);
        } },
        { d: 3.6, sub: [[1.4, 'kafka|Кажется, я не вовремя.']], sfx: [[0.1, 'door']], draw: S => {
          const t = S.t, g = S.g, open = eOut(seg(t, 0, 0.9)), k = sm(seg(t, 0.4, 3.6));
          S.bg('station', S.T, { kind: 'hall', fire: true });
          rect(g, '#0c0a14', 118, 58, 84, 112);
          lighter(g, () => glow(g, 160, 110, 50, '#ff5a8a', 0.3));
          rect(g, '#3a4262', 120 - open * 42, 58, 40, 112); rect(g, '#3a4262', 160 + open * 42, 58, 40, 112);
          rect(g, '#d8b868', 158 - open * 42, 58, 2, 112); rect(g, '#d8b868', 160 + open * 42, 58, 2, 112);
          S.fig('kafka', 160, lerp(176, 244, k), { k: 2, s: lerp(0.6, 0.92, k) });
          K.embers(g, S.T, 30, 9, 0, LW, 205, '#ff8a4a');
        } },
        { d: 3.4, sub: [[0.25, '=???|Нет-нет. По-моему, лучше момента не придумать.']], sfx: [[0.1, 'debuff']], draw: S => {
          const g = S.g;
          S.bg('station', S.T, { kind: 'control' });
          for (let i = 0; i < 3; i++) {
            const x = 40 + i * 90;
            rect(g, '#0a0a14', x, 58, 70, 52); rect(g, '#2a0a2a', x + 3, 61, 64, 46);
            K.glitch(g, S.T + i, x + 3, 61, 64, 46, 0.9, i + 1);
            wolfGlyph(g, x + 35, 82, 0.6 + 0.4 * Math.sin(S.T * 6 + i));
          }
        } }
      ]
    },

    c_elevator: {
      shots: [
        { d: 2.2, sub: [[0.5, 'kafka|В конце концов...']], sfx: [[0.1, 'door'], [0.9, 'swing']], draw: S => {
          const t = S.t, g = S.g, open = eOut(seg(t, 0, 0.6));
          S.bg('station', S.T, { kind: 'hall' });
          S.fig('kafka', 150, M2, { k: 2 });
          S.foe('reaver', lerp(360, 236, eOut(seg(t, 0.7, 1.3))), 214, 110, { flip: true });
          rect(g, '#3a4262', 0, BAR, 90 - open * 90, LH - BAR * 2); rect(g, '#3a4262', 230 + open * 90, BAR, 90, LH - BAR * 2);
        } },
        { d: 2.4, sub: [[0.1, 'kafka|В сценарии Элио этого нет.']], draw: CU('station', 'kafka', { bgo: { kind: 'hall' }, side: 'l', fx: S => { const x = lerp(40, 150, seg(S.t, 0.6, 1.2)); lighter(S.g, () => rect(S.g, 'rgba(255,255,255,0.8)', x, 130, 10, 1)); } }) },
        { d: 2.4, sub: [[0.3, 'kafka|Так какая разница?']], sfx: [[0.35, 'hit'], [0.65, 'crit']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('station', S.T, { kind: 'hall' });
          const dead = t > 0.7;
          if (!dead) S.foe('reaver', 236, 214, 110, { flip: true, flash: t > 0.35 ? 0.6 : 0 });
          else K.shards(g, (t - 0.7) * 1.4, 236, 150, 24, 5, '#7a4ac0', 90, '#e8d0ff');
          S.fig('kafka', 120, M2, { k: 2 });
          for (const s of [0.35, 0.65]) if (t > s && t < s + 0.1) lighter(g, () => { glow(g, 170, 150, 24, '#fff0a0', 1); line(g, '#fff8d0', 2, 170, 150, 230, 140); });
        } },
        { d: 2.8, sub: [[0.2, '=???|Убирать за другими в мои обязанности не входит.']], sfx: [[0.5, 'debuff']], draw: S => {
          const t = S.t, g = S.g, k = seg(t, 0.5, 1.4);
          S.bg('station', S.T, { kind: 'hall' });
          S.fig('kafka', 120, M2, { k: 2, flip: true });
          if (k < 1) S.foe('eliminator', 60, 214, 120, { a: 1 - k });
          K.glitch(g, S.T, 10, 90, 110, 120, 0.3 + k, 5);
        } },
        { d: 2.4, sub: [[0.2, 'silverwolf|Знаешь, Кафка?']], draw: S => {
          const g = S.g;
          S.bg('station', S.T, { kind: 'hall' });
          S.fig('silverwolf', 200, M2, { k: 2, flip: true });
          for (let i = 0; i < 3; i++) { const x = 120 + i * 24, y = 90 + (i % 2) * 20 + Math.sin(S.T * 2 + i) * 3; rect(g, rgba('#ff5ac8', 0.35), x, y, 20, 14); K.glitch(g, S.T + i, x, y, 20, 14, 0.4, i + 9); }
        } }
      ]
    },

    c_vessel: {
      music: 'title',
      shots: [
        { d: 3.0, sub: [[0.4, 'silverwolf|Сосуд готов.']], sfx: [[0.2, 'tech']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('station', S.T, { kind: 'vault', orb: 0.6 + seg(t, 0, 2) * 0.4 });
          S.fig('silverwolf', 250, M2, { k: 2, flip: true });
          for (let i = 0; i < 4; i++) rect(g, rgba('#ff5ac8', 0.4 + 0.2 * Math.sin(S.T * 8 + i)), 196 + i * 8, 120 + (i % 2) * 6, 6, 3);
        } },
        { d: 3.0, sub: [[0.4, 'silverwolf|Твоё решение.']], draw: S => {
          const g = S.g;
          S.bg('station', S.T, { kind: 'vault' });
          rect(g, 'rgba(0,0,0,0.35)', 0, 0, LW, LH);
          K.capsule(g, 116, 196, S.look(H.Gfx.trailLook('m')), S.T);
          K.capsule(g, 204, 196, S.look(H.Gfx.trailLook('f')), S.T);
          lighter(g, () => { glow(g, 116, 150, 30, '#8a7aff', 0.3); glow(g, 204, 150, 30, '#8a7aff', 0.3); });
        } },
        { d: 3.4, sub: [[0.2, 'kafka|Элио сказал, что это решение многое изменит.']], draw: CU('station', 'kafka', { bgo: { kind: 'vault' }, side: 'r', flip: true, fx: S => lighter(S.g, () => glow(S.g, 80, 120, 70, '#9ae8ff', 0.25)) }) },
        { d: 3.2, sub: [[0.2, 'silverwolf|А ещё он сказал, что принимать его должна ты.']], draw: CU('station', 'silverwolf', { bgo: { kind: 'vault' }, side: 'l' }) }
      ]
    },

    c_awaken: {
      music: 'title',
      shots: [
        { d: 2.6, sub: [[0.4, 'kafka|Ну вот.']], sfx: [[0.1, 'steam']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('station', S.T, { kind: 'vault', orb: 0 });
          K.smoke(g, S.T, 110, 190, 8, 40, '#c8c0e8', 0.4 * (1 - seg(t, 0, 2.6)));
          S.fig('trail', 110, 204, { v: { closed: true } });
          S.fig('kafka', 200, M2, { k: 2, flip: true });
          K.stellaron(g, 172, 150, 5, S.T, 1);
        } },
        { d: 2.8, sub: [[0.2, 'kafka|Сколько {он|она} будет помнить?']], draw: CU('station', 'kafka', { bgo: { kind: 'vault', orb: 0 }, side: 'r', flip: true }) },
        { d: 2.4, sub: [[0.2, 'silverwolf|Тебя вспомнит.']], draw: CU('station', 'silverwolf', { bgo: { kind: 'vault', orb: 0 }, side: 'l' }) },
        { d: 3.2, sub: [[0.6, 'kafka|Пора вставать.']], sfx: [[0.4, 'ult']], draw: S => {
          const t = S.t, g = S.g;
          S.soft('station', S.T, { kind: 'vault', orb: 0 }, 0.4);
          S.bust('trail', 160, LOW, 150, { v: { closed: true } });
          const k = seg(t, 0.3, 1.6);
          K.stellaron(g, 160, LOW - 10, 4 + k * 10, S.T, 1);
          lighter(g, () => glow(g, 160, LOW - 10, 40 + k * 200, '#d8f0ff', k * 0.8));
          flash(g, '#ffffff', seg(t, 2.2, 3.2));
        } },
        { d: 2.4, sfx: [[0.3, 'glint']], draw: S => {
          const t = S.t, g = S.g;
          S.soft('station', S.T, { kind: 'storage' }, 0.2);
          S.bust('trail', 160, LOW, 150, { v: t < 1.1 ? { closed: true } : null });
          flash(g, '#ffffff', 1 - seg(t, 0, 0.8));
          vignette(g, 0.9, '#1a0a2a');
        } }
      ]
    },

    c_wake: {
      shots: [
        { d: 2.4, draw: S => {
          const t = S.t, g = S.g;
          S.soft('station', S.T, { kind: 'storage' }, 0.1);
          S.bust('danheng', 170, LOW + 40, 210, { a: 0.9 });
          const lid = 0.5 + 0.5 * Math.cos(t * 2.6);
          rect(g, '#000000', 0, 0, LW, LH / 2 * lid); rect(g, '#000000', 0, LH - LH / 2 * lid, LW, LH / 2 * lid);
          vignette(g, 0.8);
        } },
        { d: 2.2, sub: [[0.2, 'march=Женский голос|Стой! Погоди!']], sfx: [[0.3, 'swing']], draw: S => {
          const t = S.t, k = eOut(seg(t, 0.1, 0.6));
          S.soft('station', S.T, { kind: 'storage' }, 0.15);
          S.bust('danheng', lerp(170, 340, k), LOW + 40, 210, { rot: k * 0.3 });
          S.bust('march', lerp(-60, 130, k), LOW + 10, 180, { flip: true, v: { mouth: 'open' } });
          vignette(S.g, 0.5);
        } },
        { d: 2.4, sub: [[0.1, 'march=Женский голос|{Он очнулся|Она очнулась}!']], draw: CU('station', 'march', { bgo: { kind: 'storage' }, size: 150, v: { mouth: 'open', blush: true } }) }
      ]
    },

    c_drones: {
      music: 'battle',
      shots: [
        { d: 2.4, sub: [[0.3, 'march|Эй, неудачники!']], draw: S => {
          const t = S.t;
          S.bg('station', S.T, { kind: 'hall', alert: true });
          [[36, 'reaver', 96], [90, 'reaver', 84], [232, 'reaver', 84], [286, 'reaver', 96]].forEach(([x, id, s], i) => S.foe(id, x, 196 + (i % 2) * 6, s, { flip: x > 160 }));
          S.fig('danheng', 130, 206); S.fig('march', 164, 208); S.fig('trail', 196, 206, { flip: true });
        } },
        { d: 2.2, sub: [[0.1, 'march|Толпой на троих нечестно!']], draw: CU('station', 'march', { bgo: { kind: 'hall', alert: true }, side: 'l', v: { mouth: 'open' } }) },
        { d: 1.8, sub: [[0.2, 'danheng|Вперёд!']], sfx: [[0.4, 'swing']], draw: S => {
          const t = S.t, g = S.g, k = eOut(seg(t, 0.3, 0.6));
          S.bg('station', S.T, { kind: 'hall', alert: true });
          S.fig('danheng', lerp(120, 170, k), M2, { k: 2 });
          lighter(g, () => { line(g, rgba('#9af0ff', 1 - seg(t, 0.6, 1.2)), 3, 150, 140, 150 + k * 170, 128); glow(g, 150 + k * 170, 128, 20, '#6ae0ff', k * (1 - seg(t, 0.6, 1.2))); });
        } },
        { d: 2.8, sfx: [[0.6, 'ult'], [1.1, 'hit'], [1.5, 'hit']], draw: S => {
          const t = S.t, g = S.g;
          g.save(); S.shake(t, t > 1 && t < 2 ? 2 : 0);
          S.bg('station', S.T, { kind: 'hall' });
          [[50, 'reaver'], [110, 'eliminator'], [220, 'reaver'], [280, 'eliminator']].forEach(([x, id], i) => { if (t < 1.1 + i * 0.25) S.foe(id, x, 196, 90, { flip: x > 160, flash: t > 0.8 + i * 0.25 ? 0.7 : 0 }); else K.shards(g, (t - 1.1 - i * 0.25) * 1.2, x, 150, 14, i + 2, '#7a4ac0', 60, '#ffd0a0'); });
          for (let i = 0; i < 5; i++) {
            const ph = seg(t, 0, 0.9), x = lerp(360 + i * 20, 60 + i * 50, eOut(ph)), y = 60 + (i % 2) * 14 + Math.sin(S.T * 6 + i) * 3;
            K.drone(g, x, y, S.T, i);
            if (t > 0.8 + i * 0.12 && t < 1.2 + i * 0.25) lighter(g, () => line(g, '#ff9a4a', 2, x, y + 2, [50, 110, 220, 280, 160][i], 150));
          }
          g.restore();
        } },
        { d: 3.2, sub: [[0.8, 'himeko|И почему каждый раз так весело выходит?']], sfx: [[0.2, 'step'], [0.8, 'step']], draw: S => {
          const t = S.t, g = S.g, k = sm(seg(t, 0, 3.2));
          S.bg('station', S.T, { kind: 'hall' });
          S.fig('himeko', 160, lerp(210, 250, k), { k: 2, s: lerp(0.75, 0.95, k) });
          K.smoke(g, S.T, 80, 200, 6, 60, '#6a6a7a', 0.6 * (1 - k));
          K.smoke(g, S.T + 3, 240, 200, 6, 60, '#6a6a7a', 0.6 * (1 - k));
        } },
        { d: 2.6, sub: [[0.2, 'himeko|Ну, главное, вернулись.']], draw: CU('station', 'himeko', { bgo: { kind: 'hall' }, side: 'r', flip: true }) }
      ]
    },

    c_doom: {
      music: 'doomsday', keepMusic: true,
      shots: [
        { d: 3.0, sfx: [[0.1, 'rumble']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('space', S.T, { station: { x: 150, y: 130, s: 1.3, hit: true } });
          S.foe('doomsday', 200, lerp(170, 150, sm(t / 3)), 130, { tint: '#140820', ta: 0.7 });
          lighter(g, () => glow(g, 200, 100, 70, '#b050ff', 0.35 + 0.1 * Math.sin(S.T * 4)));
        } },
        { d: 2.8, sub: [[0.9, 'danheng|Стой, Март!']], sfx: [[0.2, 'break'], [0.6, 'rumble']], draw: S => {
          const t = S.t, g = S.g, k = eIn(seg(t, 0.2, 0.9));
          g.save(); S.shake(t, t > 0.8 && t < 1.8 ? 3 : 0);
          S.bg('station', S.T, { kind: 'platform', alert: true });
          S.foe('doomsday', 170, lerp(-20, 206, k), 170);
          if (t > 0.2 && t < 1.8) K.shards(g, (t - 0.2) * 0.8, 170, 40, 30, 11, '#4a4a58', 120, '#d8b868');
          S.fig('march', 70, 214, { flip: true }); S.fig('danheng', 40, 214, { flip: true });
          g.restore();
        } },
        { d: 3.0, sub: [[0.2, 'himeko|Зверь Судного дня...'], [1.4, 'himeko|Он правда здесь.']], draw: CU('station', 'himeko', { bgo: { kind: 'platform', alert: true }, side: 'l', fx: S => lighter(S.g, () => glow(S.g, 260, 60, 80, '#b050ff', 0.35)) }) },
        { d: 2.2, sub: [[0.2, 'march|Эй! А ну спускайся!']], draw: S => {
          S.bg('station', S.T, { kind: 'platform', alert: true });
          S.foe('doomsday', 230, 200, 180);
          S.fig('march', 90, M2, { k: 2, flip: true, v: { mouth: 'open' } });
        } },
        { d: 2.2, sub: [[0.2, 'himeko|Осторожно, все.']], draw: S => {
          S.bg('station', S.T, { kind: 'platform', alert: true });
          S.foe('doomsday', 250, 196, 150);
          S.fig('himeko', 60, 208, { flip: true }); S.fig('march', 96, 210, { flip: true }); S.fig('danheng', 128, 208, { flip: true }); S.fig('trail', 160, 210, { flip: true });
        } }
      ]
    },

    c_nanook: {
      music: 'final',
      shots: [
        { d: 2.6, sub: [[0.4, '=Экипаж Экспресса|Март!']], sfx: [[0.3, 'ult'], [0.9, 'hit']], draw: S => {
          const t = S.t, g = S.g;
          g.save(); S.shake(t, t > 0.8 && t < 1.6 ? 3 : 0);
          S.bg('station', S.T, { kind: 'platform', alert: true });
          S.foe('doomsday', 250, 196, 150);
          lighter(g, () => { const r = seg(t, 0.3, 1.2) * 200; ring(g, rgba('#c07aff', 1 - seg(t, 0.8, 1.6)), 6, 250, 140, r); glow(g, 250, 140, r * 0.6, '#8a3aff', 0.3 * (1 - seg(t, 0.8, 1.6))); });
          S.fig('march', 70, 210, { flip: true });
          S.fig('trail', lerp(150, 110, eOut(seg(t, 0.2, 0.7))), 210, { flip: true });
          g.restore();
        } },
        { d: 2.4, draw: S => {
          const t = S.t, g = S.g;
          S.soft('station', S.T, { kind: 'platform' }, 0.5);
          S.fig('trail', 160, 200, { k: 2, s: 0.8, rot: -eOut(seg(t, 0, 2.4)) * 1.2, a: 1 - seg(t, 1.8, 2.4) });
          K.vignette(g, 0.9);
          flash(g, '#ffffff', 0.1 * (0.5 + 0.5 * Math.sin(S.T * 30)));
        } },
        { d: 3.0, sub: [[0.6, '=???|Мне пора...']], sfx: [[0.1, 'rumble']], draw: S => S.bg('void', S.T, { eye: seg(S.t, 0, 2.4) }) },
        { d: 3.0, sub: [[0.3, '@|Что случилось...']], draw: S => S.bg('void', S.T, { eye: 1, shards: ['snow', 'ice', 'city'] }) },
        { d: 3.2, sub: [[0.2, '=???|Ты {должен|должна} увидеть конец своей истории.']], draw: S => S.bg('void', S.T, { eye: 1, shards: ['fire', 'snow', 'ice', 'city', 'snow'] }) },
        { d: 2.2, sub: [[0.2, '@|...Кто это?']], draw: S => S.bg('void', S.T, { eye: 1 }) },
        { d: 3.0, sub: [[0.2, '=???|Дойди до конца своей истории своим путём.']], draw: S => S.bg('void', S.T, { eye: 1.1, shards: ['city'] }) },
        { d: 3.2, sub: [[0.2, '=???|Смотри.'], [1.1, '=???|ОНИ уже заметили тебя.']], sfx: [[1.1, 'crit']], draw: S => { S.bg('void', S.T, { eye: 1.2 + seg(S.t, 1, 2) * 0.6 }); flash(S.g, '#ff3010', seg(S.t, 1.1, 1.4) * (1 - seg(S.t, 1.4, 3.2)) * 0.8); } },
        { d: 3.0, sub: [[0.4, 'march|Господин Ян! {Он|Она}...']], sfx: [[1.4, 'shield']], draw: S => {
          const t = S.t, g = S.g, calm = seg(t, 1.4, 2.4);
          S.soft('station', S.T, { kind: 'platform' }, 0.3);
          S.bust('trail', 120, LOW, 140, { v: { closed: true } });
          lighter(g, () => { glow(g, 120, LOW - 20, 60 * (1 - calm) + 20, '#ff4a8a', 0.8 * (1 - calm) + 0.1); glow(g, 120, LOW - 20, 30, '#b050ff', 0.6 * (1 - calm)); });
          S.fig('welt', lerp(330, 250, eOut(seg(t, 0, 1))), M2, { k: 2, flip: true });
          if (t > 1.2) lighter(g, () => { line(g, '#e8d8a0', 2, 210, 130, 140, 118); glow(g, 140, 118, 14, '#ffe8a0', 1 - calm * 0.5); });
        } },
        { d: 3.4, sub: [[0.2, 'welt|Теперь всё в порядке.'], [1.7, 'welt|Поговорим в другом месте.']], draw: CU('station', 'welt', { bgo: { kind: 'platform' }, side: 'r', flip: true }) }
      ]
    },

    c_depart: {
      music: 'express',
      shots: [
        { d: 3.2, sub: [[0.2, 'march|Пойдём!'], [1.4, 'himeko|Пора подниматься.']], draw: S => {
          const g = S.g;
          S.bg('station', S.T, { kind: 'platform' });
          K.expressSide(g, 280, 196, 1.05, S.T, { cars: 3 });
          S.fig('himeko', 150, 212); S.fig('march', 186, 212, { flip: true }); S.fig('trail', 110, 212);
        } },
        { d: 3.0, sfx: [[0.1, 'steam'], [0.6, 'whoosh']], draw: S => threeD(S, (R, W, M) => {
          const t = S.t, zf = -1 + t * t * 3.6;
          R.light({ amb: [0.42, 0.46, 0.62], dir: [0.7, 0.5, 0.5], sun: [0.95, 0.9, 0.78] });
          R.look([2.4, 1.1, -30], [0, 0.4, zf - 6], 58, -0.04);
          W.spaceBg(R, t, 10);
          W.trainAt(R, zf);
          W.sparks(R, t, 70, 17, (i, ts) => [1.18, -0.42, -1 + ts * ts * 3.6 - 6 - hx(i, 9, 1) * 16], i => [1 + hx(i, 1, 9) * 3, 0.5 + hx(i, 2, 9) * 2, -2 - hx(i, 3, 9) * 6], 0.35, 1.5, ['#fff0a0', '#ff5010']);
        }) },
        { d: 2.6, draw: S => {
          const t = S.t, g = S.g;
          S.bg('space', S.T, { station: { x: lerp(90, 60, t / 2.6), y: 150, s: 0.7 }, drift: 20 });
          lighter(g, () => { const x = lerp(160, 330, eIn(t / 2.6)), y = lerp(120, 60, t / 2.6); line(g, 'rgba(255,220,140,0.8)', 2, x - 80, y + 30, x, y); glow(g, x, y, 14, '#ffe8b0', 1); });
        } },
        { d: 1.8, sub: [[0.3, '=???|Кхм!']], draw: S => {
          S.bg('parlor', S.T, { moving: true });
          S.fig('trail', 160, M2, { k: 2 });
        } },
        { d: 2.6, sub: [[0.3, '=???|Я здесь!']], sfx: [[0.2, 'select']], draw: S => {
          const t = S.t, k = eOut(seg(t, 0, 0.5));
          S.soft('parlor', S.T, { moving: true }, 0.2);
          S.bust('pompom', 160, lerp(LH + 40, LOW + 10, k), 150);
        } }
      ]
    },

    c_window: {
      music: 'express',
      shots: [
        { d: 3.4, sub: [[0.3, '@|Вселенная...'], [1.8, '@|Звёздный экспресс...']], draw: S => {
          const g = S.g;
          S.bg('parlor', S.T, { moving: true });
          S.fig('trail', 160, M2, { k: 2, tint: '#0a0610', ta: 0.85 });
          lighter(g, () => glow(g, 160, 80, 60, '#9ab8ff', 0.15));
        } },
        { d: 3.4, sub: [[0.2, '@|Эоны...'], [1.3, '@|Меня что, затянуло в фантастический фильм?']], draw: CU('parlor', 'trail', { bgo: { moving: true }, side: 'r', flip: true }) },
        { d: 3.0, sub: [[0.3, '@|Этот «Стелларон»... во мне...']], draw: CU('parlor', 'trail', { bgo: { moving: true }, side: 'r', flip: true, push: 1.1, fx: S => lighter(S.g, () => glow(S.g, 224, LOW - 12, 30, '#b07aff', 0.3 + 0.1 * Math.sin(S.T * 3))) }) },
        { d: 2.6, sub: [[0.4, 'march|Пытаешься поймать звёзды?']], draw: S => {
          const t = S.t;
          S.soft('parlor', S.T, { moving: true }, 0.25);
          S.bust('trail', 230, LOW, 124, { flip: true, a: 0.9 });
          S.bust('march', lerp(-40, 88, eOut(seg(t, 0, 0.5))), LOW, 124, { flip: true });
        } },
        { d: 2.6, sub: [[0.2, 'march|Хи-хи, я тоже так делала.']], draw: CU('parlor', 'march', { bgo: { moving: true }, side: 'l', v: { blush: true } }) },
        { d: 3.4, sub: [[0.3, 'march|Только у меня это были не звёзды. А лампы.']], draw: CU('parlor', 'march', { bgo: { moving: true }, side: 'l', push: 1.08, fx: S => lighter(S.g, () => { for (let i = 0; i < 4; i++) glow(S.g, 180 + i * 34, 50 + (i % 2) * 12, 10, '#ffe0a0', 0.5); }) }) }
      ]
    },

    c_jump: {
      music: 'express',
      shots: [
        { d: 3.0, sub: [[0.2, 'pompom|Алло? Алло-алло?'], [1.2, 'pompom|Всем пассажирам вернуться на свои места.']], draw: CU('parlor', 'pompom', { bgo: { moving: true }, side: 'r', size: 140 }) },
        { d: 2.6, sub: [[0.3, 'march|...Не упаду! Не упаду!']], draw: S => {
          S.bg('parlor', S.T, { moving: true });
          S.fig('march', 160, M2, { k: 2, rot: Math.sin(S.T * 5) * 0.08 });
        } },
        { d: 2.4, sub: [[0.2, 'pompom|Поезд совершает прыжок!'], [1.2, 'pompom|Держитесь!']], draw: CU('parlor', 'pompom', { bgo: { warp: true }, side: 'l', size: 140 }) },
        { d: 2.6, sfx: [[0.0, 'select'], [0.5, 'select'], [1.0, 'select'], [1.5, 'select'], [2.0, 'confirm']], draw: S => {
          const t = S.t, g = S.g, n = 5 - Math.min(4, Math.floor(t / 0.5));
          S.bg('parlor', S.T, { warp: true });
          g.save(); g.translate(160, 120); const sc = 1 + ((t % 0.5) / 0.5) * 0.3; g.scale(sc, sc);
          digit(g, n, 0, 0, '#ffe8a0');
          g.restore();
        } },
        { d: 3.0, sfx: [[0.1, 'whoosh']], draw: S => threeD(S, (R, W, M) => {
          const t = S.t;
          R.light({ amb: [0.45, 0.5, 0.7], dir: [0, 0.4, 1], sun: [0.7, 0.8, 1.0] });
          R.look([0, 0.6, 3], [Math.sin(t * 1.3) * 0.15, 0.1, -10], 62, Math.sin(t * 0.7) * 0.06);
          R.clear('#040a1c', '#06122c', '#0c2a58');
          R.stars(90, 11, 0.7);
          const dist = 30 * t;
          for (let i = 0; i < 200; i++) {
            const a = hx(i, 1, 3) * Math.PI * 2, r = 0.8 + hx(i, 2, 3) * 6.5, z = -60 + ((hx(i, 3, 3) * 60 + dist * (0.8 + hx(i, 4, 3) * 0.5)) % 60);
            if (z > -0.3) continue;
            const x = Math.cos(a) * r, y = Math.sin(a) * r, near = cl((z + 60) / 50);
            R.streak([x, y, z], [x, y, z - 3], 1 + near * 1.5, [200 * (0.3 + near * 0.7), 240 * (0.3 + near * 0.7), 255 * (0.3 + near * 0.7)], '#061430', { depth: false });
          }
          W.trainAt(R, lerp(-60, -5, Math.pow(cl(t / 2.8), 2.2)));
          R.glow([0, 0.9, lerp(-60, -5, Math.pow(cl(t / 2.8), 2.2)) - 0.4], 1.4, '#c8ecff', { a: 0.9, depth: false });
          R.glow([0.2, 0.9, -70], 10, '#ffffff', { shape: 'star', a: 0.9, depth: false });
        }) },
        { d: 3.2, sfx: [[0.05, 'brake']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('space', S.T, { tint: 'jarilo', planet: { x: 170, y: 130, r: lerp(40, 70, sm(t / 3.2)), kind: 'jarilo' } });
          K.expressSide(g, lerp(40, 110, t / 3.2), 70, 0.35, S.T, { cars: 2 });
          flash(g, '#ffffff', 1 - seg(t, 0, 0.6));
        } }
      ]
    },

    c_gepard: {
      music: 'gepard', keepMusic: true,
      shots: [
        { d: 2.2, sfx: [[0.6, 'swing'], [0.9, 'swing']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('snow', S.T, { wall: true });
          for (let i = 0; i < 4; i++) S.fig('guard', lerp(330 + i * 20, 220 + i * 26, eOut(seg(t, 0, 1.2))), 206 + (i % 2) * 4, { flip: true });
          S.fig('march', 80, M2, { k: 2 });
          for (let i = 0; i < 3; i++) { const ph = seg(t, 0.6 + i * 0.15, 1.2 + i * 0.15); if (ph > 0 && ph < 1) lighter(g, () => { const x = lerp(110, 260, ph), y = 130 - i * 6; line(g, '#b8f4ff', 2, x - 14, y + 2, x, y); glow(g, x, y, 8, '#9ae8ff', 0.8); }); }
        } },
        { d: 2.6, sfx: [[0.5, 'shield'], [0.7, 'break']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('snow', S.T, { wall: true });
          S.fig('gepard', 210, M2, { k: 2, flip: true });
          K.hexShield(g, 170, 130, 50, seg(t, 0.3, 0.5), S.T, '#a8d8ff');
          for (let i = 0; i < 3; i++) { const s = 0.5 + i * 0.2; if (t > s && t < s + 0.8) K.shards(g, (t - s) * 2, 150, 120 + i * 10, 10, i + 20, '#b8f4ff', 40); }
        } },
        { d: 1.8, draw: CU('snow', 'march', { bgo: { wall: true }, side: 'l', v: { mouth: 'open' } }) },
        { d: 3.4, sub: [[0.6, 'gepard|Я, Гепард Ландау, капитан Среброгривых стражей...']], sfx: [[0.3, 'step'], [1.1, 'step'], [1.9, 'step']], draw: S => {
          const t = S.t, k = sm(seg(t, 0, 3.4));
          S.bg('snow', S.T, { wall: true, storm: true });
          S.fig('gepard', 160, lerp(200, 262, k), { k: 2, s: lerp(0.7, 1, k) });
        } },
        { d: 3.0, sub: [[0.2, 'gepard|...приказываю вам прекратить бесполезное сопротивление.']], draw: CU('snow', 'gepard', { bgo: { wall: true, storm: true }, side: 'r', flip: true }) }
      ]
    },

    c_belobog: {
      music: 'city',
      shots: [
        { d: 3.8, sub: [[0.8, 'gepard|Добро пожаловать в Белобог, город Сохранения.']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('snow', S.T, { wall: true });
          flash(g, '#e8eef6', 0.8 * (1 - seg(t, 0, 2)));
          K.snowfall(g, S.T, 200 * (1 - seg(t, 0, 2.5)), 51, { speed: 50, wind: 120, streak: true });
        } },
        { d: 3.8, sub: [[0.3, 'march|Эй, а тут вроде теплее!'], [1.8, 'gepard|Потому что вы в Белобоге, последнем оплоте человечества.']], draw: S => S.bg('city', S.T, { pan: lerp(0, 40, S.t / 3.8), fort: true }) },
        { d: 4.4, sub: [[0.3, 'gepard|Семьсот лет назад чудовища из-за неба сожгли мир. Земля стала пепелищем, дым пожаров тянулся за горизонт.']], draw: S => S.bg('panel', S.t, { kind: 'fire' }) },
        { d: 4.4, sub: [[0.3, 'gepard|В разгар войны без предупреждения пришла Вечная мерзлота. Метели похоронили армию Легиона. Остался только Белобог.']], draw: S => S.bg('panel', S.t, { kind: 'freeze' }) },
        { d: 4.6, sub: [[0.3, 'gepard|Стойкие Архитекторы построили этот город. Под защитой Клипота Сохраняющего Белобог хранит тепло посреди вечного холода.']], draw: S => S.bg('panel', S.t, { kind: 'build' }) }
      ]
    },

    c_whisper: {
      music: 'title',
      shots: [
        { d: 2.8, draw: S => {
          const t = S.t;
          S.bg('fort', S.T);
          S.fig('danheng', lerp(150, 110, t / 2.8), lerp(208, 190, t / 2.8), { s: 0.9 });
          S.fig('march', lerp(170, 130, t / 2.8), lerp(210, 192, t / 2.8), { s: 0.9 });
          S.fig('trail', lerp(190, 160, t / 2.8), lerp(208, 192, t / 2.8), { s: 0.9, flip: t > 1.6 });
        } },
        { d: 3.0, sub: [[0.6, '=???|...']], draw: S => {
          S.bg('fort', S.T, { voice: [196, 120] });
          S.fig('cocolia', 160, 206);
        } },
        { d: 3.0, sub: [[0.2, 'cocolia|...Конечно, я понимаю.']], draw: CU('fort', 'cocolia', { side: 'l', fx: S => lighter(S.g, () => { for (let i = 0; i < 3; i++) { const ph = (S.T * 0.4 + i / 3) % 1; ring(S.g, rgba('#7ad8ff', 0.4 * (1 - ph)), 1, 250, 90, 10 + ph * 60); } }) }) },
        { d: 3.2, sub: [[0.2, 'cocolia|Не волнуйся, у меня есть способ.']], draw: CU('fort', 'cocolia', { side: 'l', push: 1.1 }) }
      ]
    },

    c_dream: {
      music: 'title',
      shots: [
        dream('=Голос Стелларона|Коколия... Коколия...', null, { voice: true }),
        dream('cocolia=Юная Коколия|Кто ты?.. Что ты такое?', 'cocolia', { voice: false }),
        dream('=Голос Стелларона|Мы союзники... Союзники хранителей из поколения в поколение.', 'cocolia', { voice: true }),
        dream('cocolia=Юная Коколия|Чего ты хочешь?', 'cocolia'),
        dream('=Голос Стелларона|Возродить... этот умирающий мир...', 'cocolia', { voice: true }),
        dream('=Голос Стелларона|Помочь тебе... исполнить твоё желание.', 'cocolia', { voice: true, d: 3.6 })
      ]
    },

    c_escape: {
      music: 'order',
      shots: [
        { d: 1.8, sfx: [[0.3, 'shield']], draw: S => {
          const t = S.t;
          S.bg('city', S.T, { night: true });
          for (let i = 0; i < 4; i++) S.fig('guard', 200 + i * 28, 208, { flip: true });
          S.fig('march', 110, 210); S.fig('danheng', lerp(80, 140, eOut(seg(t, 0.1, 0.5))), 208);
        } },
        { d: 1.8, sfx: [[0.4, 'hit']], draw: S => {
          const t = S.t, g = S.g, k = seg(t, 0.3, 0.6);
          S.bg('city', S.T, { night: true });
          S.fig('guard', lerp(220, 290, eOut(k)), 208, { flip: true, rot: k * 0.8 });
          S.fig('trail', 160, M2, { k: 2 });
          lighter(g, () => { g.strokeStyle = rgba('#fff0c0', 1 - seg(t, 0.6, 1)); g.lineWidth = 3; g.beginPath(); g.arc(170, 150, 50, -1.8 + k * 1.2, -0.4 + k * 1.2); g.stroke(); });
        } },
        { d: 2.6, sub: [[0.6, 'march|Хорошего вам ледяного дня!']], sfx: [[0.3, 'shield']], draw: S => {
          const t = S.t, g = S.g, k = seg(t, 0.2, 0.8);
          S.bg('city', S.T, { night: true });
          for (let i = 0; i < 3; i++) {
            const x = 80 + i * 80;
            S.fig('guard', x, M2, { k: 2, flip: true });
            lighter(g, () => glow(g, x - 20, 150, 20 * k, '#9ae8ff', k));
            if (k > 0) for (let j = 0; j < 5; j++) poly(g, rgba('#c8f4ff', k), [x - 30 + j * 4, 150, x - 26 + j * 4, 150 - 10 * k - hx(i, j, 3) * 6, x - 22 + j * 4, 150]);
          }
        } },
        { d: 2.4, draw: S => {
          const t = S.t;
          S.bg('alley', S.T);
          const k = sm(t / 2.4);
          S.fig('danheng', 150, lerp(230, 180, k), { s: lerp(1.2, 0.7, k) });
          S.fig('march', 166, lerp(234, 184, k), { s: lerp(1.2, 0.7, k) });
          S.fig('trail', 182, lerp(236, 186, k), { s: lerp(1.2, 0.7, k) });
        } }
      ]
    },

    c_ambush: {
      music: 'order', keepMusic: true,
      shots: [
        { d: 1.8, sub: [[0.2, 'danheng|Осторожно!']], sfx: [[0.3, 'swing']], draw: S => {
          const t = S.t;
          S.bg('alley', S.T);
          for (let i = 0; i < 3; i++) S.fig('guard', 60 + i * 100, lerp(120, 208, eOut(seg(t, 0.1 + i * 0.1, 0.6 + i * 0.1))), { flip: i > 1 });
        } },
        { d: 2.4, sub: [[0.2, 'march|Она всё-таки нас догнала...']], draw: CU('alley', 'march', { side: 'l' }) },
        { d: 2.2, sub: [[0.2, 'march|И даже засаду успела устроить...']], draw: CU('alley', 'march', { side: 'l', push: 1.1 }) },
        { d: 3.0, sub: [[0.6, 'bronya|Хм. Недооценили меня?']], draw: S => {
          const g = S.g;
          S.bg('alley', S.T);
          rect(g, '#1a0c20', 196, 96, 90, 10);
          S.fig('bronya', 240, 100, { flip: true });
          for (let i = 0; i < 3; i++) S.fig('guard', 60 + i * 34, 210);
        } }
      ]
    },

    c_smoke: {
      music: 'order',
      shots: [
        { d: 2.0, sub: [[0.3, 'danheng|Пригнись!']], sfx: [[0.5, 'hit']], draw: S => {
          const t = S.t, k = seg(t, 0.5, 1.2);
          S.bg('alley', S.T);
          S.fig('march', 110, 210);
          S.fig('guard', lerp(80, 290, eOut(k)), lerp(150, 200, k), { rot: k * 2 });
          S.fig('danheng', 150, 210);
        } },
        { d: 2.0, sub: [[0.2, 'bronya|Этих злодеев...']], draw: S => { S.bg('alley', S.T); S.fig('bronya', 200, M2, { k: 2, flip: true }); } },
        { d: 2.2, sub: [[0.1, 'bronya|...я возьму на себя. Сама!']], draw: CU('alley', 'bronya', { side: 'r', flip: true }) },
        { d: 2.6, sub: [[0.8, 'bronya|Сдавайтесь, чужаки! Вам гарантирован честный суд.']], sfx: [[0.2, 'crit'], [0.4, 'hit']], draw: S => {
          const t = S.t, g = S.g;
          g.save(); S.shake(t, t < 0.6 ? 3 : 0);
          S.bg('alley', S.T);
          S.fig('bronya', 220, 208, { flip: true }); S.fig('march', 100, 210); S.fig('danheng', 130, 208); S.fig('trail', 70, 210);
          lighter(g, () => glow(g, 160, 150, 60, '#ffffff', 1 - seg(t, 0, 0.5)));
          g.restore();
        } },
        { d: 2.2, sub: [[0.2, 'sampo|Ой! Простите, не хотел портить такой напряжённый момент.']], draw: CU('alley', 'sampo', { side: 'l', bgo: {} }) },
        { d: 2.8, sub: [[0.4, 'bronya|Что это?!'], [1.4, 'march|Не... могу... дышать...']], sfx: [[0.1, 'break_obj'], [0.3, 'steam']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('alley', S.T);
          S.fig('bronya', 220, 208, { flip: true }); S.fig('march', 100, 210);
          for (let i = 0; i < 3; i++) K.smoke(g, S.T + i, 80 + i * 80, 210, 12, 60 + t * 40, '#b8b8c0', 0.9);
          rect(g, rgba('#c8c8d0', seg(t, 0.4, 2.2) * 0.8), 0, 0, LW, LH);
        } },
        { d: 3.4, sub: [[0.4, 'sampo|Скажу одно.'], [1.4, 'sampo|Сампо никогда не даёт в обиду друзей, которые ему помогли.']], draw: S => {
          const t = S.t, g = S.g, k = sm(seg(t, 0, 2));
          rect(g, '#b8b8c0', 0, 0, LW, LH);
          S.fig('sampo', 160, lerp(220, M2, k), { k: 2, s: lerp(0.8, 1, k), a: k });
          for (let i = 0; i < 4; i++) K.smoke(g, S.T + i * 2, 40 + i * 80, 220, 10, 90, '#a8a8b4', 0.8);
        } },
        { d: 3.0, sub: [[0.2, 'sampo|Я говорю, что думаю. И думаю, что говорю.']], draw: S => {
          CU('alley', 'sampo', { side: 'r', flip: true, dim: 0 })(S);
          flash(S.g, '#b8b8c0', 0.35);
          flash(S.g, '#000000', seg(S.t, 2.2, 3));
        } }
      ]
    },

    c_lostworld: {
      music: 'under',
      shots: [
        { d: 3.2, draw: S => {
          const g = S.g;
          S.bg('under', S.T, { kind: 'town' });
          lighter(g, () => glow(g, 160, 30, 90, '#ffb050', 0.35 + 0.1 * Math.sin(S.T * 2)));
          flash(g, '#000000', 1 - seg(S.t, 0, 1.2));
        } },
        { d: 3.0, sub: [[0.4, '|Камнеград. Шахтёрский город под Белобогом, где геосущность греет дома, а над крышами висит Ядро печи.']], draw: S => {
          const g = S.g;
          S.bg('under', S.T + 3, { kind: 'town' });
          lighter(g, () => glow(g, 160, 30, 100, '#ffb050', 0.45));
          flash(g, '#000000', seg(S.t, 2.4, 3));
        } }
      ]
    },

    c_dream2: {
      music: 'title',
      shots: [
        dream('cocolia=Юная Коколия|...Из-за моего приказа они будут страдать, жертвовать собой и умирать.', 'cocolia', { d: 3.8 }),
        dream('=Голос Стелларона|Их встретит не смерть... Их унесёт в младенчество нового мира.', 'cocolia', { voice: true, d: 3.8 }),
        dream('cocolia=Юная Коколия|А люди Подземья? Они лишатся защиты Архитекторов. Они сочтут меня тираном.', 'cocolia', { d: 4 }),
        dream('=Голос Стелларона|Ты видела... мир, который мы обещаем.', 'cocolia', { voice: true }),
        dream('=Голос Стелларона|Временное непонимание... ради вечного процветания.', 'cocolia', { voice: true }),
        dream('=Голос Стелларона|Мы уважим... твоё решение.', 'cocolia', { voice: true }),
        dream('cocolia=Юная Коколия|...Я понимаю.', 'cocolia', { d: 3 })
      ]
    },

    c_seele: {
      music: 'order', keepMusic: true,
      shots: [
        { d: 2.4, sub: [[0.2, 'miner=Бродяга|Ну что, принцесса, хватит любезностей!']], draw: S => {
          S.bg('under', S.T, { kind: 'town' });
          S.fig('bronya', 110, 210);
          S.foe('vagrant', 210, 212, 80, { flip: true }); S.foe('vagrant', 262, 206, 80, { flip: true });
        } },
        { d: 1.4, sfx: [[0.3, 'hit']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('under', S.T, { kind: 'town' });
          S.fig('bronya', lerp(110, 80, eOut(seg(t, 0.3, 0.7))), 210);
          S.foe('vagrant', 210, 212, 80, { flip: true });
          if (t > 0.3 && t < 0.45) lighter(g, () => glow(g, 180, 150, 16, '#fff0a0', 1));
        } },
        { d: 2.0, sfx: [[0.4, 'crit']], draw: S => {
          const t = S.t, g = S.g;
          K.vgrad(g, 0, LH, [[0, '#1a0a2a'], [1, '#3a1a3a']]);
          K.speedLines(g, S.T, 160, 120, 40, '#c8a8ff', 0.5, 30);
          const split = seg(t, 0.4, 1.2) * 14;
          ell(g, '#d8c0a0', 160 - split, 120 - split * 0.3, 6, 3, -0.3); ell(g, '#d8c0a0', 160 + split, 120 + split * 0.3, 6, 3, -0.3);
          if (t > 0.35) lighter(g, () => line(g, rgba('#e8a8ff', 1 - seg(t, 0.6, 1.4)), 2, 120, 150, 200, 90));
          butterflies(g, S.T, 160, 120, seg(t, 0.4, 1.4));
        } },
        { d: 2.8, sub: [[0.4, 'seele|На нашей территории нападать вздумали?']], draw: S => {
          S.bg('under', S.T, { kind: 'town' });
          S.fig('seele', 150, M2, { k: 2 });
          butterflies(S.g, S.T, 150, 140, 0.8);
        } },
        { d: 2.6, sub: [[0.2, 'seele|Ну? Как насчёт пары раундов со мной?']], sfx: [[0.3, 'swing']], draw: CU('under', 'seele', { bgo: { kind: 'town' }, side: 'r', flip: true, fx: S => { butterflies(S.g, S.T, 220, 110, 0.6); lighter(S.g, () => { S.g.strokeStyle = rgba('#e8a8ff', 1 - seg(S.t, 0.3, 0.9)); S.g.lineWidth = 3; S.g.beginPath(); S.g.arc(200, 130, 70, -2.4, -0.2); S.g.stroke(); }); } }) }
      ]
    },

    c_wish: {
      music: 'title',
      shots: [
        { d: 3.8, sub: [[0.3, 'cocolia|Я потеряла её... Моё желание, ваш так называемый план... Какой во всём этом смысл?']], draw: S => {
          S.bg('fort', S.T, { voice: [250, 80] });
          rect(S.g, 'rgba(0,0,30,0.55)', 0, 0, LW, LH);
          S.fig('cocolia', 150, M2, { k: 2 });
        } },
        dream('=Голос Стелларона|Твоя скорбь... печаль... бесполезные чувства... отбрось их...', 'cocolia', { voice: true, d: 3.6 }),
        { d: 3.0, sub: [[0.1, 'cocolia|Замолчи! Она моя дочь, моя единственная...']], draw: CU('fort', 'cocolia', { side: 'l', v: { mouth: 'open' }, dim: 0.5 }) },
        { d: 3.6, sub: [[0.1, 'cocolia|Бездушная тварь, что ты можешь понять?! Ты никогда не поймёшь... Никогда!']], draw: CU('fort', 'cocolia', { side: 'l', v: { mouth: 'open' }, dim: 0.55, push: 1.12 }) },
        dream('=Голос Стелларона|Ты её не потеряла... Она ждёт встречи с тобой по ту сторону.', 'cocolia', { voice: true, d: 3.8 }),
        dream('cocolia|Новый мир...', 'cocolia'),
        dream('=Голос Стелларона|Восстань... хранительница...', 'cocolia', { voice: true }),
        dream('=Голос Стелларона|Исполни своё предназначение... Исполни желание матери.', 'cocolia', { voice: true, d: 3.8 })
      ]
    },

    c_mercy: {
      music: 'final',
      shots: [
        { d: 2.4, sfx: [[0.6, 'tech']], draw: S => {
          const g = S.g;
          S.bg('rivet', S.T, { kind: 'factory' });
          S.foe('svarog_b', 190, 226, 150, { rot: 0.08 });
          K.sparks(g, S.T, 190, 130, 14, 3, '#ffb060', 30);
          S.fig('natasha', 80, M2, { k: 2 });
          lighter(g, () => glow(g, 120, 150, 6, '#ffe0a0', 0.6));
        } },
        { d: 2.0, sub: [[0.2, 'clara|Стойте... Стойте!']], sfx: [[0.2, 'step'], [0.5, 'step']], draw: S => {
          const t = S.t;
          S.bg('rivet', S.T, { kind: 'factory' });
          S.foe('svarog_b', 220, 226, 150, { rot: 0.08 });
          S.fig('clara', lerp(330, 150, eOut(seg(t, 0, 0.8))), 214, { k: 2, s: 0.7, flip: true });
        } },
        { d: 3.2, sub: [[0.2, 'clara|Пожалуйста, не трогайте господина Сварога!']], draw: CU('rivet', 'clara', { bgo: { kind: 'factory' }, side: 'l', v: { mouth: 'open' }, size: 140 }) }
      ]
    },

    c_archive: {
      music: 'title',
      shots: [
        { d: 2.6, sub: [[0.2, 'svarog|Запрос кэша базы данных. Серийный номер 13175. Уровень шифрования: высший. Передача...']], sfx: [[0.3, 'tech']], draw: S => { S.bg('rivet', S.T, { kind: 'factory' }); S.foe('svarog_b', 160, 226, 160); lighter(S.g, () => glow(S.g, 160, 83, 70, '#ff2e8e', 0.3 + 0.2 * Math.sin(S.T * 6))); } },
        archive([
          '=Голос исследователя|...Это плод многолетних исследований, госпожа хранительница. Доказательства неопровержимы: так называемый Стелларон и есть источник всех разрушений.',
          '=Старая хранительница|Людям будет трудно это принять, доктор. Сказать им, что всемогущая Алиса Рэнд сама пробудила эту вещь и вызвала Вечную мерзлоту...',
          '=Голос исследователя|Это правда, госпожа. Правда не зависит от мнения людей.',
          '=Старая хранительница|С тех пор как я приняла этот пост, их голос живёт у меня в голове. Мне от него не избавиться. Обнародовать эти доклады я не могу. Разве что...',
          '=Старая хранительница|...Разве что вы найдёте способ полностью уничтожить Стелларон.',
          '=Голос исследователя|Понимаю. Во имя Сохранения... я выполню эту миссию.'
        ], [['scientist', 110, false], ['townswoman', 210, true]]),
        { d: 2.4, sub: [[0.2, 'svarog|Передача завершена. Следующий кэш: номер 24830.']], draw: S => { S.bg('rivet', S.T, { kind: 'factory' }); S.foe('svarog_b', 160, 226, 160); } },
        archive([
          '=Молодой исследователь|Не понимаю, доктор. Зачем прятать такие результаты? Это труд всей вашей жизни...',
          '=Старый исследователь|Ты ещё молод. Однажды поймёшь. Хранительница видит дальше нас с тобой. Все её решения ради безопасности Белобога.',
          '=Старый исследователь|Не расстраивайся. Когда найдёшь способ уничтожить Стелларон... наши усилия окупятся.'
        ], [['scientist', 110, false], ['oleg', 210, true]]),
        { d: 2.4, sub: [[0.2, 'svarog|Передача завершена. Следующий кэш: номер 57614.']], draw: S => { S.bg('rivet', S.T, { kind: 'factory' }); S.foe('svarog_b', 160, 226, 160); } },
        archive([
          '=Юная хранительница|...А что здесь делает робот?',
          '=Телохранитель хранительницы|Это был личный робот-телохранитель доктора Миршаймера. Говорят, прототип со времён великой войны. После смерти доктора он так и стоит здесь.',
          '=Юная хранительница|Начнём. Нужно выкопать все выводы доктора. Все до единого.',
          '=Телохранитель хранительницы|Госпожа хранительница, а что делать с роботом?',
          '=Юная хранительница|Уничтожать жалко. Пусть его перезагрузят и отправят в Подземье. Говорят, группе разработчиков нужен робот для обороны.',
          '=Юная хранительница|Простите, доктор. Эти результаты должны остаться у Архитекторов. Однажды кто-нибудь исполнит ваш завет.'
        ], [['cocolia', 90, false], ['guard', 170, true], [null, 250, true, 'svarog_b']]),
        { d: 2.4, sub: [[0.2, 'svarog|Передача данных завершена.']], draw: S => { S.bg('rivet', S.T, { kind: 'factory' }); S.foe('svarog_b', 160, 226, 160); } }
      ]
    },

    c_engine: {
      music: 'final',
      shots: [
        { d: 3.0, sub: [[0.3, 'cocolia|Чтобы построить новое, нужно сломать старое.']], sfx: [[0.2, 'rumble']], draw: S => {
          const t = S.t, g = S.g;
          g.save(); S.shake(t, 1.5);
          S.bg('hill', S.T, { summit: true });
          S.foe('cocolia1', 160, 196, 110);
          g.restore();
        } },
        { d: 2.6, sub: [[0.2, 'cocolia|Верховная хранительница приказывает тебе...']], draw: CU('hill', 'cocolia', { bgo: { summit: true }, side: 'r', flip: true, fx: S => lighter(S.g, () => glow(S.g, 224, 110, 30, '#9ae8ff', 0.5 + 0.3 * Math.sin(S.T * 6))) }) },
        { d: 3.8, sub: [[0.6, 'cocolia|Восстань, Двигатель созидания!']], sfx: [[0.2, 'rumble'], [1.2, 'rumble'], [2.4, 'ult']], draw: S => {
          const t = S.t, g = S.g, k = eOut(seg(t, 0, 3.2));
          g.save(); S.shake(t, 2.5 * (1 - seg(t, 2.8, 3.8)));
          S.bg('hill', S.T, { summit: true });
          K.engine(g, 160, lerp(360, 250, k), 0.9, S.T);
          K.shards(g, seg(t, 0.2, 2.2), 160, 190, 30, 13, '#9ad8f0', 140, '#ffffff');
          g.restore();
        } },
        { d: 2.6, sub: [[0.1, 'bronya|Это древняя машина Архитекторов! Осторожно!']], draw: CU('hill', 'bronya', { bgo: { summit: true }, side: 'l', v: { mouth: 'open' } }) }
      ]
    },

    c_cannon: {
      music: 'final',
      shots: [
        { d: 2.2, sfx: [[0.3, 'rumble']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('hill', S.T, { summit: true });
          K.engine(g, 160, 250, 0.9, S.T, { armL: seg(t, 0, 1.6) * 1.6 });
          S.fig('march', 120, 216, { s: 0.6 }); S.fig('trail', 140, 216, { s: 0.6 }); S.fig('bronya', 160, 216, { s: 0.6 });
        } },
        { d: 2.4, sfx: [[0.2, 'tech'], [1.2, 'ult']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('space', S.T, { tint: 'jarilo', planet: { x: 160, y: 300, r: 180, kind: 'jarilo' } });
          K.expressSide(g, 200, 90, 0.8, S.T, { cars: 2 });
          lighter(g, () => { glow(g, 242, 86, 10 + seg(t, 0, 1.2) * 40, '#9af0ff', 0.9); if (t > 1.2) line(g, '#e8ffff', 4 + Math.sin(S.T * 40), 242, 86, 170, 260); });
        } },
        { d: 2.0, sfx: [[0.1, 'crit'], [0.3, 'break']], draw: S => {
          const t = S.t, g = S.g;
          g.save(); S.shake(t, 3);
          S.bg('hill', S.T, { summit: true });
          K.engine(g, 160, 250, 0.9, S.T, { noLeft: t > 0.35, armL: 1.6 });
          lighter(g, () => { line(g, rgba('#e8ffff', 1 - seg(t, 0.6, 1.4)), 10, 90, BAR, 90, 170); glow(g, 90, 150, 60, '#9af0ff', 1 - seg(t, 0.4, 1.6)); });
          K.shards(g, seg(t, 0.3, 1.8), 90, 150, 26, 17, '#4a4454', 120, '#d8a848');
          g.restore();
        } },
        { d: 1.2, draw: S => { S.bg('hill', S.T, { summit: true }); K.engine(S.g, 160, 250, 0.9, S.T, { noLeft: true }); flash(S.g, '#ffffff', 1 - seg(S.t, 0, 1.2)); } }
      ]
    },

    c_climb: {
      music: 'final',
      shots: [
        { d: 2.4, sub: [[0.3, 'bronya|Я прикрою!']], sfx: [[0.6, 'hit'], [1.0, 'hit']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('hill', S.T, { summit: true });
          poly(g, '#342e44', [20, 236, 64, 236, 312, 70, 290, 52]);
          poly(g, '#57506a', [24, 232, 56, 232, 300, 66, 288, 58]);
          for (let i = 1; i < 6; i++) { const u = i / 6; rect(g, '#e0b050', lerp(40, 294, u) - 6, lerp(232, 60, u), 14, 2); }
          S.fig('trail', lerp(60, 200, t / 2.4), lerp(224, 128, t / 2.4), { s: 0.8, rot: 0.25 });
          for (let i = 0; i < 2; i++) { const s = 0.5 + i * 0.4; if (t > s) { if (t < s + 0.3) lighter(g, () => line(g, '#ffe0a0', 2, 20, 200, 200 + i * 40, 110 - i * 20)); else K.shards(g, (t - s - 0.3) * 1.5, 200 + i * 40, 110 - i * 20, 10, i + 30, '#9ad8f0', 30); } else S.foe('iceedge', 200 + i * 40, 116 - i * 20, 40); }
        } },
        { d: 2.2, sub: [[0.6, 'seele|Держись за меня!']], sfx: [[0.3, 'swing']], draw: S => {
          const t = S.t, g = S.g, fall = seg(t, 0, 0.5);
          S.bg('hill', S.T, { summit: true });
          S.fig('trail', 170, lerp(120, 170, fall), { s: 0.9, rot: fall * 0.6 });
          if (t > 0.4) { S.fig('seele', 200, 160, { s: 0.9, flip: true }); butterflies(g, S.T, 200, 120, 0.7); }
        } },
        { d: 2.2, sfx: [[0.4, 'swing'], [1.0, 'hit']], draw: S => {
          const t = S.t, g = S.g, k = seg(t, 0.3, 1.2);
          S.bg('hill', S.T, { summit: true });
          lighter(g, () => line(g, rgba('#9af0ff', 1), 3, lerp(40, 180, k) - 30, lerp(220, 110, k) + 12, lerp(40, 180, k), lerp(220, 110, k)));
          S.fig('trail', 180, lerp(170, 90, eOut(seg(t, 1, 2.2))), { s: 0.9 });
        } },
        { d: 2.8, sub: [[0.6, 'cocolia|Узрите силу, дарованную ИМИ!']], draw: S => {
          S.bg('hill', S.T, { summit: true });
          S.foe('cocolia2', 230, 206, 160);
          S.fig('trail', 90, M2, { k: 2 });
        } },
        { d: 2.8, sub: [[0.2, 'cocolia|Позвольте подарить вам... отчаяние!']], draw: S => {
          S.soft('hill', S.T, { summit: true }, 0.3);
          S.foe('cocolia2', 170, 330, 300);
          vignette(S.g, 0.5, '#001030');
        } },
        { d: 3.0, sfx: [[0.4, 'crit'], [0.6, 'hit']], draw: S => {
          const t = S.t, g = S.g, k = seg(t, 0.1, 0.45);
          S.bg('hill', S.T, { summit: true });
          S.fig('trail', 120, lerp(M2, M2 + 30, seg(t, 0.8, 2.6)), { k: 2, rot: -seg(t, 0.6, 2.6) * 0.9 });
          lighter(g, () => { const x = lerp(330, 130, k); line(g, '#c8f4ff', 5, x, 120, x + 60, 110); glow(g, x, 120, 18, '#9ae8ff', 1); if (t > 0.45) glow(g, 130, 130, 50 * (1 - seg(t, 0.5, 1.4)), '#ffffff', 1); });
          flash(g, '#000000', seg(t, 2, 3));
        } }
      ]
    },

    c_lance: {
      music: 'final',
      shots: [
        { d: 2.8, sfx: [[1.2, 'break']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('void', S.T, { amber: 1 });
          lance(g, 160, 150, S.T, 1);
          S.fig('trail', lerp(100, 128, seg(t, 0, 1.2)) - (t > 1.2 ? eOut(seg(t, 1.2, 1.6)) * 30 : 0), M2, { k: 2 });
          if (t > 1.2 && t < 1.5) flash(g, '#ffd080', 0.6);
        } },
        { d: 3.4, sfx: [[1.0, 'ult'], [1.8, 'break']], draw: S => {
          const t = S.t, g = S.g, pull = eOut(seg(t, 0.8, 1.6));
          S.bg('void', S.T, { amber: 1 - seg(t, 1.6, 2.4) * 0.6 });
          lighter(g, () => { glow(g, 160, 90, 100 + pull * 60, '#ffb040', 0.4 + pull * 0.4); poly(g, rgba('#ffe0a0', 0.25 * pull), [120, 40, 200, 40, 230, 200, 90, 200]); });
          lance(g, 160, 150 - pull * 50, S.T, 1);
          S.fig('trail', 130, M2, { k: 2 });
          if (t > 1.6) K.shards(g, seg(t, 1.6, 3.2), 160, 110, 40, 41, '#c88a30', 160, '#ffe0a0');
          flash(g, '#fff0c0', seg(t, 1.7, 1.9) * (1 - seg(t, 1.9, 2.6)));
        } },
        { d: 2.4, sub: [[0.6, 'march|Ха-ха!']], sfx: [[0.2, 'heal']], draw: S => {
          const g = S.g;
          S.bg('hill', S.T, { summit: true });
          K.engine(g, 160, 250, 0.9, S.T, { noLeft: true });
          S.fig('trail', 230, 140, { s: 0.9 });
          lance(g, 244, 108, S.T, 0.5);
          S.bust('march', 70, LOW, 100, { flip: true, v: { mouth: 'open', blush: true } });
        } },
        { d: 2.6, draw: S => {
          const t = S.t, g = S.g;
          S.bg('hill', S.T, { summit: true });
          S.foe('cocolia2', 260, 190, 120);
          S.fig('trail', 110, M2, { k: 2, flip: t < 1 });
          lance(g, 150, 120, S.T, 0.7, t > 1 ? 1.3 : 0);
        } }
      ]
    },

    c_end: {
      music: 'title',
      shots: [
        { d: 2.8, sub: [[0.3, 'bronya|Пусти! Я должна... к ней!']], draw: S => {
          S.bg('hill', S.T, { summit: true });
          S.fig('cocolia', 220, 214, { rot: -1.4 });
          S.fig('bronya', 120, 210, { rot: 0.1 }); S.fig('seele', 96, 210);
        } },
        { d: 3.0, sub: [[0.2, 'cocolia|Стелларон...'], [1.3, 'cocolia|...обещал нам будущее!']], draw: CU('hill', 'cocolia', { bgo: { summit: true }, side: 'r', flip: true, v: { closed: true } }) },
        { d: 2.8, sub: [[0.2, 'cocolia|Он...'], [1.1, 'cocolia|...поглотит всё!']], draw: CU('hill', 'cocolia', { bgo: { summit: true }, side: 'r', flip: true, push: 1.12, fx: S => lighter(S.g, () => glow(S.g, 224, LOW - 20, 30 + S.t * 20, '#9ae8ff', 0.6)) }) },
        { d: 3.0, sub: [[0.3, 'bronya|Мама!'], [1.4, 'bronya|Стой!']], sfx: [[0.2, 'ult'], [0.8, 'shield']], draw: S => {
          const t = S.t, g = S.g;
          g.save(); S.shake(t, 2);
          S.bg('hill', S.T, { summit: true });
          S.fig('cocolia', 210, 210);
          lighter(g, () => { glow(g, 210, 150, 40 + t * 30, '#9ae8ff', 0.8); ring(g, rgba('#c8f4ff', 0.8), 2, 210, 150, 50 + Math.sin(S.T * 8) * 3); });
          K.hexShield(g, 210, 150, 64, 0.9, S.T);
          S.fig('bronya', lerp(80, 128, eOut(seg(t, 0, 0.8))), 212, { rot: 0.15 });
          g.restore();
        } },
        { d: 4.0, draw: S => {
          const t = S.t, g = S.g, k = seg(t, 0.8, 3.2);
          S.bg('hill', S.T, { summit: true });
          S.fig('cocolia', 210, 210, { a: 1 - k });
          lighter(g, () => { for (let i = 0; i < 60; i++) { const ph = cl(k * 1.4 - hx(i, 1, 7) * 0.4); if (ph <= 0) continue; rect(g, rgba('#e8faff', 1 - ph), 196 + hx(i, 2, 7) * 28, 120 + hx(i, 3, 7) * 90 - ph * 80, 1, 1); } });
          S.fig('bronya', 128, 214, { rot: 0.05 + seg(t, 2, 3) * 0.5 });
        } }
      ]
    },

    c_leave: {
      music: 'express',
      shots: [
        { d: 3.4, sub: [[0.2, 'seele|...Приоритеты? То есть восстановление Подземья у тебя не в приоритете?']], draw: S => {
          S.bg('city', S.T, { sun: true, fort: true });
          balcony(S.g);
          S.fig('bronya', 110, M2, { k: 2 }); S.fig('seele', 214, M2, { k: 2, flip: true });
        } },
        { d: 3.2, sub: [[0.2, 'bronya|Конечно, в приоритете! Просто ресурсы ограничены, нужны новые параметры.']], draw: CU('city', 'bronya', { bgo: { sun: true }, side: 'l' }) },
        { d: 3.6, sub: [[0.2, 'seele|Ресурсы... параметры... Любишь ты мудрёные слова.'], [1.9, 'seele|Ладно, забудь. Я сама спущусь...']], draw: CU('city', 'seele', { bgo: { sun: true }, side: 'r', flip: true }) },
        { d: 2.4, sub: [[0.2, 'bronya|...Зеле, я не отпущу тебя одну...']], draw: CU('city', 'bronya', { bgo: { sun: true }, side: 'l', v: { mouth: 'open' } }) },
        { d: 2.4, sub: [[0.3, 'seele|Смотри, Броня!']], draw: S => {
          const t = S.t, g = S.g;
          S.bg('city', S.T, { sun: true, fort: true });
          lighter(g, () => { const x = lerp(-20, 200, t / 2.4), y = lerp(80, 40, t / 2.4); line(g, 'rgba(255,240,200,0.8)', 2, x - 120, y + 30, x, y); glow(g, x, y, 12, '#ffffff', 1); });
          balcony(g);
        } },
        { d: 3.0, sub: [[0.2, 'seele|Их там ждёт куча трудностей, да?']], draw: S => {
          const t = S.t, g = S.g;
          K.vgrad(g, 0, LH, [[0, '#f0a060'], [1, '#fff0d0']]);
          lighter(g, () => { const x = lerp(160, 330, t / 3), y = lerp(40, 10, t / 3); line(g, 'rgba(255,240,200,0.8)', 2, x - 160, y + 30, x, y); glow(g, x, y, 10, '#ffffff', 1); });
          S.fig('bronya', 130, M2, { k: 2, tint: '#2a1a14', ta: 0.6 }); S.fig('seele', 190, M2, { k: 2, tint: '#2a1a14', ta: 0.6 });
        } },
        { d: 3.2, sub: [[0.2, 'bronya|Да... Их будущее ещё туманнее нашего.']], draw: CU('city', 'bronya', { bgo: { sun: true }, side: 'l' }) },
        { d: 3.6, sub: [[0.2, 'bronya|Но мы здесь справимся. Даже если такие споры будут длиться вечно...']], draw: CU('city', 'bronya', { bgo: { sun: true }, side: 'l', push: 1.08 }) },
        { d: 3.2, sub: [[0.2, 'seele|...Хм. Не будут, если я буду в них побеждать.']], draw: CU('city', 'seele', { bgo: { sun: true }, side: 'r', flip: true, v: { blush: true } }) }
      ]
    }
  };

  function digit(g, n, x, y, col) {
    const SEG = { 1: [0, 1, 0, 0, 1, 0, 0], 2: [1, 0, 1, 1, 1, 0, 1], 3: [1, 0, 1, 1, 0, 1, 1], 4: [0, 1, 1, 1, 0, 1, 0], 5: [1, 1, 0, 1, 0, 1, 1] }[n] || [1, 1, 1, 0, 1, 1, 1];
    const w = 22, h = 4, L = [[-w / 2, -30, w, h], [-w / 2 - 4, -26, h, 24], [w / 2, -26, h, 24], [-w / 2, -2, w, h], [-w / 2 - 4, 2, h, 24], [w / 2, 2, h, 24], [-w / 2, 26, w, h]];
    lighter(g, () => glow(g, x, y, 50, col, 0.3));
    L.forEach((s, i) => { if (SEG[i]) rect(g, col, x + s[0], y + s[1], s[2], s[3]); });
  }

  function butterflies(g, t, x, y, a) {
    if (a <= 0) return;
    for (let i = 0; i < 10; i++) {
      const ang = hx(i, 1, 61) * Math.PI * 2 + t * 0.6, r = 14 + hx(i, 2, 61) * 30 + Math.sin(t * 2 + i) * 4;
      const bx = x + Math.cos(ang) * r, by = y + Math.sin(ang) * r * 0.7, f = Math.abs(Math.sin(t * 14 + i)) * 3 + 1;
      poly(g, rgba('#b07aff', a), [bx, by, bx - f, by - 3, bx - f, by + 2]);
      poly(g, rgba('#e0b8ff', a), [bx, by, bx + f, by - 3, bx + f, by + 2]);
    }
  }

  function lance(g, x, y, t, a, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    lighter(g, () => { glow(g, 0, -40, 30, '#ff8a2a', 0.8 * a); for (let i = 0; i < 6; i++) { const ph = (t * 1.6 + i / 6) % 1; poly(g, rgba('#ffb040', (1 - ph) * a), [-3 + Math.sin(t * 9 + i) * 2, -60 + ph * 40, 0, -80 + ph * 30, 3, -60 + ph * 40]); } });
    rect(g, '#6a3a1a', -1, -70, 3, 110); rect(g, '#ffd080', -1, -70, 1, 110);
    poly(g, '#ffe0a0', [-5, -70, 0, -92, 5, -70]); poly(g, '#ff9a3a', [-5, -70, 0, -80, 5, -70]);
    g.restore();
  }

  function balcony(g) {
    rect(g, '#d8c8a8', 0, 196, LW, 14); rect(g, '#b8a888', 0, 196, LW, 2);
    for (let x = 6; x < LW; x += 16) rect(g, '#c8b898', x, 176, 6, 20);
    rect(g, '#e8dcc0', 0, 172, LW, 5);
  }

  Object.assign(H.Cine.CINES, CINES);
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
