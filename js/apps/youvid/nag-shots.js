(function () {
  const { V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Cast = window.NagCast;
  const A = window.NagArt;

  const ID = 'N4gat0r0Op1';
  const DURATION = 99.985;
  const STAND = { nagatoro: 0.87, senpai: 0.97, gamo: 0.83, yoshi: 0.89, sakura: 0.86 };

  function seg(t, a, b) {
    return clamp((t - a) / (b - a), 0, 1);
  }

  function mix(a, b, k) {
    return Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], k)) : lerp(a, b, k);
  }

  function keyed(list, t) {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (t < list[i][0]) {
        const k = ease((t - list[i - 1][0]) / (list[i][0] - list[i - 1][0]));
        return mix(list[i - 1][1], list[i][1], k);
      }
    }
    return list[list.length - 1][1];
  }

  function L5(ink, dark, md, mid, light) {
    return [[0, ink], [0.035, ink], [0.06, dark], [0.29, dark], [0.33, md], [0.48, md], [0.52, mid], [0.79, mid], [0.83, light], [1, light]];
  }

  function ramp(dark, light, mid) {
    return mid ? [[0, dark], [0.5, mid], [1, light]] : [[0, dark], [1, light]];
  }

  function look(eye, at, fov, roll) {
    const f = V3.norm(V3.sub(at, eye));
    let rt = V3.cross(f, [0, 1, 0]);
    if (V3.len(rt) < 1e-4) rt = [1, 0, 0];
    rt = V3.norm(rt);
    const up0 = V3.cross(rt, f);
    const r = roll || 0;
    const up = V3.add(V3.mul(up0, C(r)), V3.mul(rt, S(r)));
    return { eye, at, fov: fov || 30, up };
  }

  function who(name, pose, extra) {
    const p = Object.assign({ p: [0, STAND[name], 0] }, pose);
    return Object.assign({ who: name, pose: p }, extra);
  }

  function rigOf(c) {
    if (!c.m) c.m = Cast.solve(c.who, c.pose);
    return c.m;
  }

  function headOf(c) {
    return rigOf(c).pts.head;
  }

  function faceCam(c, dist, o) {
    const opt = o || {};
    const h = headOf(c);
    const yaw = opt.yaw || 0, pit = opt.pitch || 0;
    const dir = [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
    const tgt = V3.add(h, opt.off || [0, 0, 0]);
    return look(V3.add(tgt, V3.mul(dir, dist)), tgt, opt.fov || 30, opt.roll || 0);
  }

  function layer(o) {
    return Object.assign({ cast: [], props: [], env: 'toon', rim: null, ink: null, lut: null, set: null }, o);
  }

  function walkLegs(ph, stride, lift) {
    const s = stride || 0.22, l = lift || 0.08;
    const a = S(ph * PI * 2), b = S(ph * PI * 2 + PI);
    return {
      fL: [0.1, -0.84 + Math.max(0, C(ph * PI * 2)) * l, a * s],
      fR: [-0.1, -0.84 + Math.max(0, C(ph * PI * 2 + PI)) * l, b * s],
      bob: Math.abs(S(ph * PI * 2)) * 0.02
    };
  }

  function sitFloor(x, z, yaw) {
    return { p: [x || 0, 0.15, z || 0], yaw: yaw || 0, fL: [0.12, -0.05, 0.42], fR: [-0.12, -0.05, 0.42], kL: [0.2, 1, 0.3], kR: [-0.2, 1, 0.3] };
  }

  function sitCross(x, z, yaw) {
    return { p: [x || 0, 0.16, z || 0], yaw: yaw || 0, fL: [-0.14, -0.06, 0.34], fR: [0.14, -0.06, 0.3], kL: [1, 0.3, 0.6], kR: [-1, 0.3, 0.6] };
  }

  const NF = {
    smug: { eyes: 'smug', mouth: 'smirk', brows: 'smug', blush: 0.45 },
    grin: { eyes: 'smug', mouth: 'grin', brows: 'smug', blush: 0.9 },
    grinOpen: { eyes: 'open', mouth: 'grin', brows: 'up', blush: 0.6 },
    laugh: { eyes: 'shut', mouth: 'laugh', brows: 'up', blush: 0.6 },
    happy: { eyes: 'open', mouth: 'laugh', brows: 'up', blush: 0.5 },
    smile: { eyes: 'open', mouth: 'smile', brows: 'normal', blush: 0.3 },
    soft: { eyes: 'soft', mouth: 'smile', brows: 'normal', blush: 0.35 },
    calm: { eyes: 'calm', mouth: 'smile', brows: 'normal', blush: 0.3 },
    devil: { eyes: 'glare', mouth: 'grin', brows: 'devil', shade: true },
    sly: { eyes: 'smug', mouth: 'fang', brows: 'smug', blush: 0.6 },
    pupu: { eyes: 'dot', mouth: 'cat', brows: 'up', blush: 1 },
    wink: { eyes: ['shut', 'open'], mouth: 'smile', brows: 'up', blush: 0.6 },
    kiss: { eyes: ['shut', 'smug'], mouth: 'kiss', brows: 'smug', blush: 0.7 },
    blank: { eyes: 'open', mouth: 'flat', brows: 'normal' }
  };

  const SF = {
    flat: { eyes: 'open', mouth: 'flat' },
    shock: { eyes: 'wide', mouth: 'open', blush: 0.6, sweat: true, brows: 'worry' },
    yell: { eyes: 'wide', mouth: 'yell', blush: 0.4, brows: 'angry' },
    squeeze: { eyes: 'squeeze', mouth: 'frown', blush: 1, brows: 'worry' },
    shutYell: { eyes: 'squeeze', mouth: 'yell', blush: 0.6, brows: 'worry' },
    grit: { eyes: 'half', mouth: 'grit', sweat: true, blush: 0.5, brows: 'worry' },
    cry: { eyes: 'teary', mouth: 'yell', tears: true, brows: 'worry' },
    annoyed: { eyes: 'half', mouth: 'flat', vein: true, brows: 'angry' },
    dreamy: { eyes: 'calm', mouth: 'smile', blush: 1 },
    terror: { eyes: 'dot', mouth: 'yell', sweat: true, brows: 'worry' },
    shy: { eyes: 'open', mouth: 'wavy', blush: 1, gaze: [-0.6, 0.2], brows: 'worry' }
  };

  function tags(ctx, list, ink) {
    list.forEach(([x, y, role, names, o]) => A.tag(ctx, x, y, role, Object.assign({ names: names || [], ink: ink || '#d0206a', seed: Math.floor(x * 3 + y) }, o)));
  }

  const CREDITS = {
    plan: ['三嶋 章夫', '篠原 宏康', '角田 真敏', '丸山 博雄'],
    make: ['中西 豪', '金子 義雄'],
    series: ['岸本 卓'],
    chara: ['鈴木 美咲'],
    prop: ['益田 賢治'],
    art: ['市倉 敬'],
    color: ['橋本 賢'],
    photo: ['井上 洋志'],
    edit: ['笠原 義宏'],
    scene: ['伊東 正志', '石見 優作'],
    sound: ['明田川 仁'],
    sfx: ['長谷川 卓也'],
    music: ['吟(BUSTED ROSE)'],
    label: ['キングレコード'],
    chief: ['須藤 孝太郎', '古川 慎'],
    prod: ['諏訪 豊', '岸田 拓磨', '笹 大地', '亀井 博司'],
    coop: ['週刊少年マガジン編集部', '栗田 宏俊', '平塚 敏', '絹谷 正太郎'],
    exec: ['浄園 祐'],
    anim: ['徳永 智広'],
    studio: ['テレコム・アニメーションフィルム'],
    director: ['花井 宏和']
  };

  function solidBg(ctx, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, A.W, A.H);
  }

  window.NagShots = { ID, DURATION, CREDITS, seg, keyed, L5, ramp, look, who, headOf, faceCam, layer, walkLegs, sitFloor, sitCross, NF, SF, tags, solidBg };
})();
