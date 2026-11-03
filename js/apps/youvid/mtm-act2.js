(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Sh = window.MedShots;
  const Props = window.MedProps;
  const Sets = window.MedSets;
  const { seg, spline, track, X, HX, medicFace, heavyFace, medStand, hand, medicState, heavyState, cam, ENV } = Sh;

  const TABLE = M4.ident();
  const LAMP = M4.translate(0.35, 2.32, 0.05);
  const SPOT = Sh.MED_SPOT;
  const MOUNT = [-0.95, 3.2, -0.35];
  const FRIDGE = M4.chain(M4.translate(Sets.LAB.x0 + 0.38, 0, -0.6), M4.rotY(PI / 2));
  const PERCH = [[0.18, 2.42, 0.3, 0.25], [0.38, 2.43, 0.36, 0.05], [0.58, 2.42, 0.28, -0.3]];

  function gunAt(pos, aim) {
    const M = Props.aimM(pos, V3.sub(aim, pos));
    const rear = M4.point(M, [0, 0, -0.34]);
    const elbow = V3.add(V3.lerp(MOUNT, rear, 0.45), [0.1, 0.25, 0.05]);
    return { mount: MOUNT, elbow, M };
  }

  const GUN_REST = () => gunAt([-0.62, 1.8, -0.14], [0.08, 1.33, 0.0]);
  const GUN_PARK = () => gunAt([-1.15, 2.45, -0.75], [0.3, 1.2, -0.2]);

  function faceCam(st, off, look, fov, tilt) {
    const c = cam(M4.point(st.m.head, off), M4.point(st.m.head, look || [0, 0, 0.03]), fov || 38);
    c.up = V3.norm(V3.lerp([0, 1, 0], V3.norm(M4.dir(st.m.head, [0, 1, 0])), tilt === undefined ? 0.6 : tilt));
    return c;
  }

  function heavy(t, o) {
    const opt = o || {};
    const pose = Sh.heavyOnTable({ nk: opt.nk || [0.2, -0.3, 0.05], hL: opt.hL, hR: opt.hR, sit: opt.sit || 0 });
    return heavyState(pose, opt.hands || null, {
      cavity: opt.cavity !== false, noBand: true, glow: opt.glow || 0,
      face: heavyFace(t, opt.expr || HX.calm, opt.faceExtra)
    });
  }

  function chestPt(h, u, v, lift) {
    return M4.point(h.m.chest, Props.cavPt(u || 0, v || 0, lift || 0));
  }

  function tip(p, fingers, palm, pose) {
    const f = V3.norm(fingers);
    return hand(V3.sub(p, V3.mul(f, 0.075)), f, palm, pose);
  }

  function medic(t, o) {
    const opt = o || {};
    const pose = medStand({ at: opt.at || SPOT, yaw: opt.yaw === undefined ? 0.2 : opt.yaw, sp: opt.sp || [0.22, 0.05, 0], nk: opt.nk || [0.12, 0.05, 0], spread: 0.1, eL: opt.eL, eR: opt.eR });
    if (opt.p) pose.p = opt.p;
    return medicState(pose, opt.hands || null, {
      outfit: 'lab', blood: opt.blood || 0, inChest: opt.inChest, opts: opt.opts,
      face: medicFace(t, opt.expr || X.talk, opt.faceExtra)
    });
  }

  function perched(bloody) {
    return PERCH.map(([x, y, z, yaw], i) => ({ M: M4.chain(M4.translate(x, y, z), M4.rotY(yaw)), bloody: i === 1 && bloody }));
  }

  function lab(st) {
    return Object.assign({
      kind: '3d', set: 'lab', env: ENV.lab, table: TABLE, lamp: LAMP, labGun: GUN_REST(), fridgeDoor: 0, fridgeM: FRIDGE, doves: perched(!!st.bloodyDove)
    }, st);
  }

  function beam(gun, target, w) {
    return { a: M4.point(gun.M, [0, 0, 0.36]), b: target, w: w || 0.05, col: [1, 0.28, 0.2] };
  }

  function heartIn(h, beat, extra) {
    const p = chestPt(h, 0.25, 0.3, -0.03);
    const ch = h.m.chest;
    const M = Props.basisM(p, V3.norm(M4.dir(ch, [1, 0, 0])), V3.norm(M4.dir(ch, [0, 1, 0])), V3.norm(M4.dir(ch, [0, 0, 1])));
    return Object.assign({ M, big: true, beat, inChest: true }, extra || {});
  }

  function storyHands(t, h) {
    const c = chestPt(h, -0.1, 0.0, 0.02);
    const wob = S(t * 2.3) * 0.02;
    return {
      L: tip(V3.add(c, [0.06 + wob, 0.04, 0.08]), [0.25, -0.75, 0.6], [0.3, -0.2, -0.9], 'pinch'),
      R: tip(V3.add(c, [-0.12, 0.05 - wob, -0.05]), [0.35, -0.8, 0.45], [-0.2, -0.3, -0.9], 'claw')
    };
  }

  function shotWindow(t) {
    const u = t - 23.065;
    const eye = spline([[0, [0.95, 2.1, 4.6]], [2.6, [0.85, 2.05, 3.6]], [4.8, [0.2, 2.45, 2.4]], [7.2, [-0.6, 2.25, 1.85]], [9.7, [-1.05, 2.0, 1.25]]])(u);
    const at = spline([[0, [0.15, 1.45, 0]], [4.8, [0.2, 1.3, -0.2]], [9.7, [0.15, 1.42, -0.2]]])(u);
    const laugh = t > 29.98;
    const h = heavy(t, { expr: laugh ? HX.laugh : HX.happy, faceExtra: laugh ? { jaw: 0.35 + 0.25 * Math.abs(S(t * 9)) } : {}, nk: [-0.3, -0.42, 0.05] });
    const m = medic(t, {
      expr: laugh ? X.laugh : X.story, hands: storyHands(t, h), faceExtra: laugh ? { jaw: 0.45 + 0.3 * Math.abs(S(t * 10)) } : { look: [0.3, -0.25] },
      sp: laugh ? [0.3 + 0.08 * S(t * 10), 0.05, 0] : [0.24, 0.05, 0], nk: laugh ? [-0.15, 0.1, 0] : [0.15, 0.1, 0]
    });
    const gun = GUN_REST();
    return lab({ shot: 'window', env: ENV.labDark, camera: cam(eye, at, 46), heavy: h, medic: m, labGun: gun, beams: [beam(gun, chestPt(h, -0.2, 0, 0.02), 0.045)] });
  }

  function shotLaughWide(t) {
    const h = heavy(t, { expr: HX.laugh, faceExtra: { jaw: 0.3 + 0.25 * Math.abs(S(t * 8)) }, nk: [0.15, -0.4, 0.1] });
    const wipe = seg(t, 36.3, 36.9) * (1 - seg(t, 37.7, 38.0));
    const ch = Sh.chestOf(window.MeetMedic, medStand({ at: SPOT, yaw: 0.25, sp: [0.12, 0.1, 0] }));
    const heartP = M4.point(ch, [0.16, 0.12, 0.28]);
    const hands = {
      L: tip(V3.add(heartP, [0.02, 0.02, 0.0]), [-0.2, 0.7, 0.6], [-0.9, 0.2, -0.2], 'cup'),
      R: wipe > 0.5 ? tip(M4.point(ch, [-0.02, 0.78, 0.18]), [0.8, 0.3, -0.3], [0.2, -0.3, 1], 'flat') : tip(M4.point(ch, [-0.24, -0.05, 0.26]), [0.1, -0.6, 0.8], [0.6, 0.2, -0.4], 'relax')
    };
    const m = medic(t, { yaw: 0.25, sp: [0.12 + 0.06 * S(t * 9), 0.1, 0], nk: [-0.22 + 0.25 * wipe, 0.1, 0], hands, blood: 0, expr: t < 36.6 ? X.laugh : X.smug, faceExtra: t < 36.6 ? { jaw: 0.45 + 0.35 * Math.abs(S(t * 10)) } : {} });
    const HM = M4.chain(M4.translate(heartP[0], heartP[1] + 0.03, heartP[2]), M4.rotY(0.4));
    const gun = GUN_REST();
    return lab({
      shot: 'laughWide', camera: cam([-1.0, 1.42, 0.78], [0.15, 1.55, -0.4], 42), heavy: h, medic: m, labGun: gun,
      hearts: [{ M: HM, beat: t * 1.2 }], beams: [beam(gun, chestPt(h, -0.2, 0, 0.02), 0.045)]
    });
  }

  function shotHeartTalk(t) {
    const h = heavy(t, { expr: t < 42 ? HX.content : t < 46 ? HX.worried : HX.calm, nk: [0.25, -0.3, 0.05] });
    const look = t > 42.0 && t < 46.2;
    const ch = Sh.chestOf(window.MeetMedic, medStand({ at: SPOT, yaw: 0.25, sp: [0.2, 0.15, 0] }));
    const heartP = M4.point(ch, [0.2, 0.0, 0.32]);
    const gest = t < 40.3 ? 0 : t < 42.2 ? 1 : t < 46 ? 2 : 3;
    const R = gest === 0 ? tip(M4.point(ch, [-0.18, 0.34, 0.36]), [0.1, 0.9, 0.3], [0.2, 0.1, 1], 'claw')
      : gest === 1 ? tip(M4.point(ch, [-0.2, 0.2, 0.4]), [0.2, 0.6, 0.7], [0.4, 0.4, 0.8], 'open')
        : gest === 2 ? tip(V3.add(chestPt(h, 0.1, 0.2, 0.05), [0, 0.06, 0]), [0.2, -0.5, 0.8], [0, -1, 0], 'point')
          : tip(M4.point(ch, [-0.22, 0.42, 0.24]), [-0.3, 0.9, 0.1], [0.6, 0.2, 0.8], 'open');
    const hands = { L: tip(heartP, [-0.1, 0.8, 0.6], [-0.9, 0.2, 0], 'cup'), R };
    const expr = t < 40.3 ? X.story : t < 42.1 ? X.smug : t < 44.3 ? X.alarm : t < 46.2 ? X.disgust : X.stern;
    const m = medic(t, { yaw: 0.25, sp: [0.2 + (look ? 0.12 : 0), 0.15, 0], nk: look ? [0.5, 0.1, 0] : [0.05, 0.15, 0.05], hands, expr, faceExtra: { look: look ? [0.1, -0.35] : [0.2, -0.1] } });
    const HM = M4.chain(M4.translate(heartP[0], heartP[1] + 0.035, heartP[2]), M4.rotY(0.5));
    const flyK = seg(t, 45.3, 46.6);
    const doveIn = t > 41.6 && t < 45.4;
    const doves = [];
    if (doveIn) {
      const p = chestPt(h, 0.05, 0.1, -0.01);
      doves.push({ M: M4.chain(M4.translate(p[0], p[1] - 0.02, p[2]), M4.rotY(-0.6 + 0.3 * S(t * 3)), M4.rotX(-0.2)), inChest: true });
    } else if (flyK > 0 && flyK < 1) {
      const p = V3.lerp(chestPt(h, 0.05, 0.1, 0.05), [0.36, 2.42, 0.16], ease(flyK));
      doves.push({ M: M4.chain(M4.translate(p[0], p[1] + S(flyK * PI) * 0.4, p[2]), M4.rotY(-1.2)), flap: S(t * 34) * 0.9 });
    }
    const roost = perched(false).filter((d, i) => i !== 1 || t > 46.6);
    const eye = spline([[37.996, [-0.62, 1.64, 0.62]], [42.0, [-0.62, 1.64, 0.62]], [44.0, [-0.5, 1.7, 0.55]], [46.3, [-0.6, 1.82, 0.66]], [48.05, [-0.78, 2.25, 0.88]]])(t);
    const at = spline([[37.996, [0.3, 1.58, -0.3]], [44.0, [0.25, 1.48, -0.2]], [48.05, [0.3, 1.45, -0.25]]])(t);
    return lab({ shot: 'heartTalk', camera: cam(eye, at, 40), heavy: h, medic: m, hearts: [{ M: HM, beat: t * 1.2 }], doves: roost.concat(doves), labGun: GUN_REST() });
  }

  const COUNTER_UBER = [-1.05, 1.0, -1.98];

  function shotUberDevice(t) {
    const reach = seg(t, 48.3, 48.9), lift = seg(t, 49.05, 49.7);
    const devP = V3.add(COUNTER_UBER, [0, lift * 0.45, lift * 0.3]);
    const UM = M4.chain(M4.translate(devP[0], devP[1], devP[2]), M4.rotY(0.35), M4.rotZ(lift * 0.6));
    const handP = reach < 1 ? V3.lerp([-0.55, 1.35, -1.35], V3.add(devP, [0.05, 0.03, 0.03]), ease(reach)) : V3.add(devP, [0.05, 0.03, 0.03]);
    const hands = { R: tip(handP, [-0.6, -0.5, -0.5], [0, -1, 0], reach > 0.85 ? 'grip' : 'open') };
    const m = medic(t, { at: [-0.95, 0, -1.25], yaw: PI, sp: [0.35, 0, 0], hands, blood: 0, expr: X.focus });
    return lab({
      shot: 'uberDevice', camera: cam([-0.82, 1.12, -1.55], [-1.12, 1.02, -2.05], 40), medic: m, heavy: heavy(t, {}),
      items: [{ kind: 'uber', M: UM, needle: 0.05 }]
    });
  }

  function attachPose(t, h, burst) {
    const ch = Sh.chestOf(window.MeetMedic, medStand({ at: SPOT, yaw: 0.3, sp: [0.24, 0.1, 0] }));
    const heartP = M4.point(ch, [0.12, 0.05, 0.36]);
    const join = seg(t, 50.0, 52.4);
    const uberP = V3.lerp(M4.point(ch, [-0.2, 0.08, 0.34]), V3.add(heartP, [0.0, 0.1, 0.0]), ease(join));
    const hands = {
      L: tip(V3.add(heartP, [0.01, -0.02, 0]), [-0.1, 0.8, 0.6], [-0.9, 0.2, 0], 'cup'),
      R: tip(V3.add(uberP, [-0.04, 0.02, 0.02]), [0.6, -0.4, 0.6], [0.1, -1, 0], 'pinch')
    };
    const expr = burst ? X.shock : t < 52.4 ? X.story : X.smug;
    const m = medic(t, { yaw: 0.3, sp: [0.24, 0.1, 0], nk: [0.25, 0.1, 0], hands, blood: burst ? 2 : 0, expr, faceExtra: { look: [0.0, -0.3] } });
    return { m, heartP, uberP };
  }

  function shotAttach(t) {
    const h = heavy(t, { expr: t < 55.2 ? HX.content : HX.scared, nk: [0.2, -0.35, 0.05] });
    const burst = t >= 55.25;
    const { m, heartP, uberP } = attachPose(t, h, burst);
    const hearts = burst ? [] : [{ M: M4.chain(M4.translate(heartP[0], heartP[1] + 0.035, heartP[2]), M4.rotY(0.5)), beat: t * 1.1 }];
    const items = [{ kind: 'uber', M: M4.chain(M4.translate(uberP[0], uberP[1], uberP[2]), M4.rotY(0.4)), needle: burst ? 1 : seg(t, 52.5, 55.2) * 0.8 }];
    const gun = GUN_REST();
    const eye = spline([[49.84, [-0.42, 1.66, 0.82]], [55.2, [-0.48, 1.68, 0.85]], [55.39, [-0.95, 1.7, 0.95]]])(t);
    return lab({
      shot: 'attach', camera: cam(eye, [0.15, 1.5, -0.35], 36), heavy: h, medic: m, hearts, items, labGun: gun,
      blood: burst ? [{ p: heartP, u: clamp((t - 55.25) * 3, 0, 1), s: 1.4, seed: 7 }] : [],
      white: burst ? 0.5 * (1 - seg(t, 55.25, 55.36)) : 0
    });
  }

  function shotDoves(t, red) {
    const doves = perched(true).map((d, i) => {
      if (!red && i === 0 && t > 56.05) {
        const k = seg(t, 56.05, 56.97);
        const p = V3.add([0.16, 2.39, 0.12], [-k * 1.2, k * 0.5, k * 0.8]);
        return { M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(-0.8)), flap: S(t * 34) * 0.9 };
      }
      const turn = red ? 0.4 * S(t * 2 + i) : 0.25 * S(t * 3 + i * 2);
      return Object.assign({}, d, { M: M4.mul(d.M, M4.rotY(turn)) });
    });
    const camera = red ? cam([0.42, 2.4, 0.95], [0.36, 2.48, 0.12], 34) : cam([0.36, 2.42, 0.88], [0.36, 2.48, 0.12], 36);
    return lab({ shot: red ? 'doves2' : 'doves1', env: red ? ENV.labRed : ENV.lab, camera, heavy: heavy(t, { glow: red ? 1 : 0 }), doves });
  }

  function shotBloody(t) {
    const h = heavy(t, { expr: t < 59.5 ? HX.worried : HX.calm, nk: [0.2, -0.4, 0.05] });
    const ch = Sh.chestOf(window.MeetMedic, medStand({ at: SPOT, yaw: 0.3, sp: [0.18, 0.1, 0] }));
    const uberP = M4.point(ch, [0.06, 0.06, 0.34]);
    const turn = seg(t, 61.7, 62.23);
    const hands = {
      L: tip(V3.add(uberP, [0.04, -0.01, 0.02]), [-0.5, 0.4, 0.6], [-0.6, -0.6, 0.2], 'cup'),
      R: tip(V3.add(uberP, [-0.05, 0.02, 0.03]), [0.6, 0.3, 0.6], [0.4, -0.7, 0.3], 'hold')
    };
    const expr = t < 59.6 ? X.calm : t < 61.5 ? X.smug : X.talk;
    const m = medic(t, { yaw: 0.3 + turn * 0.9, sp: [0.18, 0.1 + turn * 0.4, 0], nk: [0.2, 0.25 * turn, 0], hands, blood: 2, expr, faceExtra: { look: t < 59.6 ? [0.3, -0.35] : [0.4, -0.1] } });
    const gun = GUN_REST();
    return lab({
      shot: 'bloody', camera: cam([-0.95, 1.7, 0.95], [0.18, 1.52, -0.35], 38), heavy: h, medic: m, labGun: gun,
      items: [{ kind: 'uber', M: M4.chain(M4.translate(uberP[0], uberP[1], uberP[2]), M4.rotY(0.6)), needle: 1 }]
    });
  }

  const FRIDGE_FRONT = M4.point(FRIDGE, [0, 0, 0.33]);

  function shotFridgeOpen(t) {
    const open = ease(seg(t, 62.7, 63.55));
    const handle = M4.point(FRIDGE, [0.31 - open * 0.1, 0.9, 0.36 + open * 0.2]);
    const hands = { R: tip(handle, [0, -0.2, 1], [-1, 0, 0], 'grip') };
    const m = medic(t, { at: [-2.45, 0, -0.45], yaw: -PI / 2 - 0.1, sp: [0.12, 0, 0], hands, blood: 2, expr: X.calm });
    return lab({ shot: 'fridgeOpen', env: ENV.lab, camera: cam([-2.0, 1.55, -1.5], [-2.95, 1.0, -0.55], 42), medic: m, fridgeDoor: open, heavy: heavy(t, {}) });
  }

  function fridgeItems(t, take) {
    const P = (x, y, z) => M4.point(FRIDGE, [x, y, z]);
    const shelf = 0.78;
    const items = [];
    [[-0.27, 0.0], [-0.21, 0.09]].forEach(([x, z]) => {
      const p = P(x, shelf + 0.01, z);
      items.push({ kind: 'bottle', M: M4.translate(p[0], p[1], p[2]) });
    });
    const d1 = P(-0.12, shelf + 0.01, 0.06), d2 = P(0.08, shelf + 0.01, 0.04);
    items.push({ kind: 'dish', M: M4.translate(d1[0], d1[1], d1[2]) });
    items.push({ kind: 'dish', M: M4.chain(M4.translate(d2[0], d2[1], d2[2]), M4.scale(1.25, 1, 1.25)) });
    const l1 = P(-0.12, shelf + 0.05, 0.2), l2 = P(0.08, shelf + 0.05, 0.2);
    const facing = M4.mul(M4.rotY(PI / 2), M4.ident());
    items.push({ kind: 'label', tex: 'spareLabel', M: M4.chain(M4.translate(l1[0], l1[1], l1[2]), facing, M4.scale(0.1, 0.025, 1)) });
    items.push({ kind: 'label', tex: 'megaBaboon', M: M4.chain(M4.translate(l2[0], l2[1], l2[2]), facing, M4.scale(0.11, 0.028, 1)) });
    const can = P(0.3, shelf + 0.01, 0.05);
    items.push({ kind: 'can', M: M4.chain(M4.translate(can[0], can[1], can[2]), M4.rotY(PI / 2)) });
    const sand = P(-0.05, 0.43, 0.08);
    items.push({ kind: 'sandwich', M: M4.translate(sand[0], sand[1], sand[2]) });
    const hearts = [];
    const h1 = P(-0.12, shelf + 0.08, 0.06);
    hearts.push({ M: M4.chain(M4.translate(h1[0], h1[1], h1[2]), M4.rotY(PI / 2 + 0.3)), beat: 0 });
    const h2 = P(0.08, shelf + 0.1, 0.04);
    const out = V3.add(h2, [take * 0.9, take * 0.25, 0]);
    hearts.push({ M: M4.chain(M4.translate(out[0], out[1], out[2]), M4.rotY(PI / 2)), big: true, beat: t * 0.3 });
    return { items, hearts, h2: out };
  }

  function shotFridgeIn(t) {
    const take = ease(seg(t, 65.05, 66.3));
    const { items, hearts, h2 } = fridgeItems(t, take);
    const spyP = M4.point(FRIDGE, [0.22, 0.78 + 0.13, -0.05]);
    const spyM = M4.chain(M4.translate(spyP[0], spyP[1], spyP[2]), M4.rotY(PI / 2 + 0.35), M4.scale(0.9, 0.9, 0.9));
    const reach = ease(seg(t, 64.3, 65.05));
    const handTarget = V3.lerp(V3.add(FRIDGE_FRONT, [0.5, 0.2, 0.3]), V3.add(h2, [0.06, 0.02, 0.05]), reach);
    const hands = { R: tip(handTarget, [-1, -0.2, -0.1], [0, -1, 0], reach > 0.8 ? 'grip' : 'open') };
    const m = medic(t, { at: [-2.2, 0, -0.35], yaw: -PI / 2 - 0.2, sp: [0.3, 0, 0], hands, blood: 2, expr: X.calm });
    const eye = M4.point(FRIDGE, [0.0, 0.95, 0.62]);
    const at = M4.point(FRIDGE, [0.0, 0.86, -0.2]);
    return lab({
      shot: 'fridgeIn', env: ENV.lab, camera: cam(eye, at, 50), medic: m, fridgeDoor: 1, items, hearts,
      spy: { M: spyM, face: { jaw: Sh.spyJaw(t), look: [t < 64.6 ? -0.2 : 0.35, 0.15] } }
    });
  }

  function shotFridgeClose(t) {
    const close = 1 - ease(seg(t, 66.44, 66.7));
    return lab({ shot: 'fridgeClose', env: ENV.labDark, camera: cam([-2.55, 1.0, -0.1], [-3.0, 0.95, -0.55], 50), fridgeDoor: close * 0.4, heavy: heavy(t, {}) });
  }

  function bigHeartPose(t, ch, lift) {
    const heartP = M4.point(ch, [0.14, 0.12 + lift * 0.15, 0.34]);
    return heartP;
  }

  function shotBigHeart(t) {
    const h = heavy(t, { expr: HX.calm, nk: [0.2, -0.35, 0.05] });
    const enter = 1 - ease(seg(t, 66.78, 67.6));
    const at = V3.add(SPOT, [-0.25 - enter * 0.6, 0, enter * 0.3]);
    const pose = medStand({ at, yaw: 0.35 + enter * 0.6, sp: [0.18, 0.1, 0] });
    const ch = Sh.chestOf(window.MeetMedic, pose);
    const lift = seg(t, 68.2, 68.8) * (1 - seg(t, 69.6, 70.1));
    const heartP = bigHeartPose(t, ch, lift);
    const join = seg(t, 69.0, 70.2);
    const uberP = V3.lerp(M4.point(ch, [-0.22, 0.05, 0.34]), V3.add(heartP, [0.02, 0.15, 0]), ease(join));
    const hands = {
      L: tip(V3.add(heartP, [0.02, -0.03, 0]), [-0.1, 0.8, 0.6], [-0.9, 0.2, 0], 'cup'),
      R: tip(V3.add(uberP, [-0.04, 0.02, 0.02]), [0.6, -0.3, 0.6], [0.1, -1, 0], 'pinch')
    };
    const m = medic(t, { at, yaw: 0.35 + enter * 0.6, sp: [0.18, 0.1, 0], nk: [0.12, 0.05, 0], hands, blood: 2, expr: t < 68.5 ? X.talk : X.gleeful, faceExtra: { look: [0.2, -0.25] } });
    const hearts = [{ M: M4.chain(M4.translate(heartP[0], heartP[1] + 0.05, heartP[2]), M4.rotY(0.4)), big: true, beat: t * 0.6, uber: join >= 1 ? 0.1 : undefined, uberM: M4.translate(0.02, 0.16, 0) }];
    const items = join < 1 ? [{ kind: 'uber', M: M4.chain(M4.translate(uberP[0], uberP[1], uberP[2]), M4.rotY(0.4)), needle: 0.1 }] : [];
    return lab({ shot: 'bigHeart', camera: cam([0.42, 1.45, 0.3], [-0.05, 1.62, -0.5], 44), heavy: h, medic: m, hearts, items, labGun: GUN_PARK() });
  }

  function shotHeartCU(t) {
    const u = t - 70.279;
    const p = [0.0, 1.5, 0.0];
    const HM = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(0.6 + u * 0.08), M4.rotX(0.15));
    const hands = {
      L: tip(M4.point(HM, [0.09, -0.02, 0.03]), [-0.5, 0.7, 0.4], [-0.9, 0.1, 0.2], 'cup'),
      R: tip(M4.point(HM, [-0.1, -0.05, 0.03]), [0.6, 0.5, 0.4], [0.9, 0.2, 0.2], 'cup')
    };
    const m = medic(t, { at: [-0.05, 0, -0.55], yaw: 0, sp: [0.2, 0, 0], hands, blood: 2, expr: X.gleeful });
    const eye = spline([[0, [0.28, 1.58, 0.42]], [4.05, [0.2, 1.56, 0.3]]])(u);
    return lab({
      shot: 'heartCU', camera: cam(eye, p, 36), medic: m,
      hearts: [{ M: HM, big: true, beat: u * 1.5, uber: 0.15 + 0.1 * S(u * 3), uberM: M4.translate(0.02, 0.16, 0) }], bloodyDove: true
    });
  }

  function shotImplant(t) {
    const h = heavy(t, { expr: HX.worried, nk: [-0.4, -0.2, 0], glow: seg(t, 77.6, 78.3) });
    const place = ease(seg(t, 74.5, 76.2));
    const inP = chestPt(h, 0.25, 0.3, -0.03);
    const start = V3.add(inP, [-0.05, 0.35, -0.25]);
    const p = V3.lerp(start, inP, place);
    const inside = place >= 1;
    const heartObj = inside ? heartIn(h, t * 1.4, { uber: 0.2, uberM: M4.translate(0.02, 0.16, 0), glow: seg(t, 77.6, 78.3) }) : { M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(0.6)), big: true, beat: t, uber: 0.2, uberM: M4.translate(0.02, 0.16, 0), inChest: place > 0.6 };
    const away = seg(t, 76.4, 77.2);
    const hp = V3.add(p, [0, away * 0.25, -away * 0.2]);
    const hands = {
      L: tip(V3.add(hp, [0.1, 0.0, 0.04]), [-0.6, -0.4, 0.4], [-0.8, 0, 0.3], 'cup'),
      R: tip(V3.add(hp, [-0.1, 0.0, 0.04]), [0.6, -0.4, 0.4], [0.8, 0, 0.3], 'cup')
    };
    const m = medic(t, { yaw: 0.15, sp: [0.45 - away * 0.15, 0.05, 0], nk: [0.3, 0, 0], hands, blood: 2, expr: X.focus, inChest: place > 0.5 && away < 0.5 });
    const glow = seg(t, 77.6, 78.3);
    return lab({
      shot: 'implant', env: glow > 0.5 ? ENV.labRed : ENV.lab, camera: cam([-0.25, 2.62, 0.7], [0.15, 1.35, -0.15], 46), heavy: h, medic: m, hearts: [heartObj], labGun: GUN_PARK(),
      glows: glow > 0 ? [{ p: inP, s: 0.7, a: glow * 0.8, tint: [1, 0.25, 0.15] }] : []
    });
  }

  function shotHeavyCU(t, which) {
    const opts = {
      cu1: { expr: HX.grimace, nk: [-0.2, -0.55, 0.1], glow: 1 },
      cu2: { expr: t < 90.4 ? HX.worried : t < 91.9 ? HX.scared : HX.grimace, nk: [-0.25, -0.6, 0.1], glow: 0 },
      cu3: { expr: HX.worried, nk: [-0.35, -0.3, 0.05], glow: 1 },
      scream: { expr: HX.scream, nk: [0.4, -0.15, 0.0], glow: 0 }
    }[which];
    const h = heavy(t, { expr: opts.expr, nk: opts.nk, glow: opts.glow, faceExtra: which === 'scream' ? { jaw: 0.95 } : {} });
    const off = which === 'cu2' ? [0.28, 0.06, 0.58] : which === 'scream' ? [0.36, 0.02, 0.5] : [0.12, 0.16, 0.48];
    const camera = faceCam(h, which === 'scream' ? [0.42, -0.06, 0.62] : off, which === 'scream' ? [0, -0.07, 0.05] : [0, 0.0, 0.03], which === 'cu2' ? 40 : 36);
    const name = { cu1: 'heavyCU1', cu2: 'heavyCU2', cu3: 'heavyCU3', scream: 'heavyScream' }[which];
    const st = { shot: name, env: opts.glow ? ENV.labRed : ENV.lab, camera, heavy: h, medic: medic(t, { blood: 2, expr: X.focus }) };
    if (which === 'cu2') st.hearts = [heartIn(h, t * 1.2, { uber: 0.5, uberM: M4.translate(0.02, 0.16, 0) })];
    if (which === 'cu1' || which === 'cu3') st.hearts = [heartIn(h, t * 1.6, { uber: 0.7, uberM: M4.translate(0.02, 0.16, 0), glow: 1 })];
    return lab(st);
  }

  function shotGauge(t) {
    const h = heavy(t, { glow: 1 });
    const ho = heartIn(h, t * 2, { uber: lerp(0.3, 0.92, seg(t, 80.0, 80.9)), uberM: M4.translate(0.02, 0.16, 0), glow: 1 });
    const U = M4.mul(ho.M, ho.uberM);
    const g = M4.point(U, [0, 0, 0.03]);
    const n = V3.norm(M4.dir(U, [0, 0, 1]));
    return lab({
      shot: 'gauge', env: ENV.labRed, camera: cam(V3.add(g, V3.mul(n, 0.13)), g, 40), heavy: h, hearts: [ho], medic: medic(t, { blood: 2 }),
      glows: [{ p: g, s: 0.4, a: 0.5, tint: [1, 0.2, 0.1] }]
    });
  }

  function medicCU(t, o) {
    const m = medic(t, Object.assign({ blood: 2, sp: [0.1, 0.05, 0], nk: [0.05, 0.05, 0] }, o));
    const head = Sh.headPos(m);
    return { m, head };
  }

  function shotMedicCU1(t) {
    const { m, head } = medicCU(t, { expr: t < 81.6 ? X.gleeful : X.worried, faceExtra: { look: [0.1, -0.4] } });
    return lab({ shot: 'medicCU1', env: ENV.labRed, camera: faceCam(m, [-0.06, -0.2, 0.36], [0, -0.01, 0.03], 42), medic: m, heavy: heavy(t, { glow: 1 }) });
  }

  function shotMedicCU2(t) {
    const { m, head } = medicCU(t, { expr: t < 84.6 ? X.shock : X.grimace, faceExtra: { look: t < 84.6 ? [0, -0.3] : [0, -0.05] } });
    const env = t < 84.15 ? ENV.labRed : t < 85.15 ? ENV.labDark : ENV.lab;
    const camera = t < 85.15 ? faceCam(m, [-0.1, -0.14, 0.4], [0, 0, 0.03], 40) : faceCam(m, [0.02, -0.03, 0.48], [0, -0.01, 0.03], 38);
    return lab({ shot: 'medicCU2', env, camera, medic: m, heavy: heavy(t, { glow: t < 84.6 ? 1 - seg(t, 83.8, 84.6) : 0 }) });
  }

  function shotHoldHeart(t) {
    const h = heavy(t, { expr: HX.worried, nk: [-0.3, -0.5, 0.05] });
    const place = ease(seg(t, 88.3, 89.3));
    const ch = Sh.chestOf(window.MeetMedic, medStand({ at: SPOT, yaw: 0.2, sp: [0.2, 0.05, 0] }));
    const holdP = M4.point(ch, [0.0, 0.1, 0.32]);
    const inP = chestPt(h, 0.25, 0.3, -0.03);
    const p = V3.lerp(holdP, inP, place);
    const heartObj = place >= 1 ? heartIn(h, t * 1.2, { uber: 0.4, uberM: M4.translate(0.02, 0.16, 0) }) : { M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(0.4)), big: true, beat: t * 1.2, uber: 0.4, uberM: M4.translate(0.02, 0.16, 0), inChest: place > 0.7 };
    const hands = {
      L: tip(V3.add(p, [0.1, -0.02, 0.03]), [-0.5, 0.6, 0.5], [-0.9, 0, 0.2], 'cup'),
      R: tip(V3.add(p, [-0.1, -0.02, 0.03]), [0.5, 0.6, 0.5], [0.9, 0, 0.2], 'cup')
    };
    const m = medic(t, { yaw: 0.2, sp: [0.2 + place * 0.2, 0.05, 0], nk: [0.15 + place * 0.2, 0, 0], hands, blood: 2, expr: t < 87.7 ? X.tender : X.focus, faceExtra: { look: [0, -0.3] }, inChest: place > 0.6 });
    const eye = spline([[85.71, [0.4, 1.48, 0.35]], [88.4, [0.42, 1.5, 0.35]], [89.7, [0.45, 1.75, 0.55]]])(t);
    const at = spline([[85.71, [-0.02, 1.58, -0.5]], [88.4, [0.0, 1.55, -0.45]], [89.7, [0.3, 1.32, -0.05]]])(t);
    return lab({ shot: 'holdHeart', camera: cam(eye, at, 44), heavy: h, medic: m, hearts: [heartObj], labGun: GUN_PARK() });
  }

  function shotLean(t) {
    const h = heavy(t, { expr: HX.worried, nk: [-0.3, -0.5, 0.05] });
    const c = chestPt(h, 0.2, 0.0, 0.03);
    const hands = {
      L: tip(V3.add(c, [0.05, 0.02, -0.12]), [0.2, -0.6, 0.7], [0, -1, 0], 'claw'),
      R: tip(V3.add(c, [-0.15, 0.04 + 0.02 * S(t * 3), -0.1]), [0.3, -0.6, 0.7], [0, -1, 0], 'relax')
    };
    const expr = t < 92.7 ? X.calm : t < 93.8 ? X.grin : t < 97.4 ? X.talk : t < 99.0 ? X.focus : X.stern;
    const m = medic(t, { yaw: 0.45, sp: [0.5, 0.2, 0], nk: [-0.25, 0.15, 0.1], hands, blood: 2, expr, faceExtra: { look: t > 99.0 ? [-0.5, 0] : [0.35, -0.15] } });
    const head = Sh.headPos(m);
    return lab({
      shot: 'lean', camera: cam(V3.add(head, [0.48, -0.08, 0.5]), V3.add(head, [0, -0.08, 0]), 40), heavy: h, medic: m,
      hearts: [heartIn(h, t * 1.2, { uber: 0.4, uberM: M4.translate(0.02, 0.16, 0) })]
    });
  }

  function shotBaby(t) {
    const h = heavy(t, { expr: t < 102.0 ? HX.scream : HX.worried, nk: [-0.2, -0.55, 0.05], faceExtra: t < 101.6 ? { jaw: 0.8 } : {} });
    const pat = t > 102.6 && t < 104.9;
    const stand = seg(t, 105.0, 105.8);
    const cheek = M4.point(h.m.head, [-0.07, -0.03, 0.08]);
    const ch = Sh.chestOf(window.MeetMedic, medStand({ at: SPOT, yaw: 0.45, sp: [0.45 - stand * 0.35, 0.2, 0] }));
    const c = chestPt(h, 0.0, 0.0, 0.04);
    const hands = {
      L: stand > 0.3 ? tip(M4.point(ch, [0.28, 0.42, 0.18]), [0.2, 0.9, 0.2], [-0.2, 0.2, 1], 'open') : tip(V3.add(c, [0.0, 0.03, -0.1]), [0.2, -0.6, 0.7], [0, -1, 0], 'claw'),
      R: pat ? tip(V3.add(cheek, [-0.02, 0.02 + 0.015 * S(t * 18), 0.0]), [0.6, 0.1, 0.6], [0.6, 0, -0.7], 'flat') : tip(V3.add(c, [-0.16, 0.05, -0.08]), [0.3, -0.6, 0.7], [0, -1, 0], 'relax')
    };
    const expr = t < 103.8 ? X.smug : t < 105.0 ? X.talk : X.tender;
    const m = medic(t, { yaw: 0.45, sp: [0.45 - stand * 0.35, 0.2, 0], nk: [0.1 - stand * 0.25, 0.25, 0], hands, blood: 2, expr, faceExtra: { look: [0.3, -0.2] } });
    return lab({
      shot: 'baby', camera: cam([-0.62, 1.72, 0.55], [0.35, 1.5, -0.3], 40), heavy: h, medic: m, labGun: GUN_PARK(),
      hearts: [heartIn(h, t * 1.2, { uber: 0.4, uberM: M4.translate(0.02, 0.16, 0) })]
    });
  }

  function shotDoveShoulder(t) {
    const m = medic(t, { yaw: 0.35, sp: [0.08, 0.1, 0], nk: [-0.05, -0.45, -0.1], blood: 2, expr: t < 106.9 ? X.tender : X.grin, faceExtra: { look: [0.5, -0.05], blink: t > 107.2 ? 0.7 : 0 } });
    const sh = M4.point(m.m.chest, [-0.18, 0.41, 0.0]);
    const land = ease(seg(t, 105.94, 106.25));
    const p = V3.add(sh, [0.0, 0.07 + (1 - land) * 0.3, (1 - land) * 0.2]);
    const dove = { M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(PI / 2 + 0.35), M4.rotX(0.1)), flap: land < 1 ? S(t * 34) * 0.8 : undefined };
    const head = Sh.headPos(m);
    return lab({ shot: 'doveShoulder', camera: cam(V3.add(head, [0.05, -0.1, 0.62]), V3.add(head, [-0.1, -0.1, 0]), 40), medic: m, heavy: heavy(t, {}), doves: perched(true).concat([dove]) });
  }

  function shotDoveCU(t) {
    const p = [0.38, 2.43, 0.36];
    const tilt = 0.3 * S((t - 107.5) * 3);
    const dove = { M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(0.1), M4.rotZ(tilt * 0.3), M4.rotX(0.35)), bloody: true };
    return lab({ shot: 'doveCU', camera: cam([0.37, 2.4, 0.68], [0.38, 2.5, 0.38], 44), doves: [dove], heavy: heavy(t, {}) });
  }

  function shotGrabGun(t) {
    const swing = ease(seg(t, 108.9, 110.4));
    const h = heavy(t, { expr: HX.worried });
    const target = chestPt(h, 0.2, 0.2, 0.05);
    const pos = V3.lerp([-0.62, 1.8, -0.14], [-0.05, 1.88, -0.25], swing);
    const gun = gunAt(pos, target);
    const hands = {
      L: tip(M4.point(gun.M, [0.12, 0.05, -0.05]), M4.dir(gun.M, [-0.5, 0.1, 0.8]), M4.dir(gun.M, [-1, 0, 0]), 'grip'),
      R: tip(M4.point(gun.M, [-0.12, 0.0, -0.2]), M4.dir(gun.M, [0.5, 0.1, 0.8]), M4.dir(gun.M, [1, 0, 0]), 'grip')
    };
    const m = medic(t, { at: [-0.25, 0, -0.7], yaw: 0.6, sp: [0.15, 0.1, 0], nk: [0.25, 0, 0], hands, blood: 2, expr: X.mad, faceExtra: { look: [0.2, -0.3] } });
    const fire = seg(t, 110.5, 110.78);
    return lab({
      shot: 'grabGun', camera: cam(V3.add(target, [0.15, 0.3, 0.35]), [-0.2, 1.95, -0.5], 54), heavy: h, medic: m, labGun: gun,
      beams: fire > 0 ? [beam(gun, target, 0.06)] : [], white: fire * 0.3
    });
  }

  function shotBeamBlast(t) {
    const u = seg(t, 110.78, 111.53);
    const h = heavy(t, { glow: 1 });
    const target = chestPt(h, 0.2, 0.2, 0.05);
    const gun = gunAt([-0.05, 1.88, -0.25], target);
    const nozzle = M4.point(gun.M, [0, 0, 0.36]);
    const eye = V3.lerp(target, nozzle, 0.45);
    return lab({
      shot: 'beamBlast', env: ENV.labRed, camera: cam(eye, nozzle, 60, 0.2), heavy: h, labGun: gun, medic: medic(t, { at: [-0.25, 0, -0.7], yaw: 0.6, blood: 2, expr: X.mad }),
      beams: [beam(gun, target, 0.12)], zaps: [{ p: V3.lerp(eye, nozzle, 0.4), r: 0.25, n: 6, w: 0.01, seed: 3 }], white: 0.35 * (1 - u)
    });
  }

  function shotBeamPOV(t) {
    const h = heavy(t, { glow: 1, expr: HX.scared });
    const target = chestPt(h, 0.2, 0.2, 0.05);
    const gun = gunAt([-0.05, 1.88, -0.25], target);
    const m = medic(t, {
      at: [-0.25, 0, -0.7], yaw: 0.6, sp: [0.15, 0.1, 0], nk: [0.25, 0, 0], blood: 2, expr: X.mad,
      hands: {
        L: tip(M4.point(gun.M, [0.12, 0.05, -0.05]), M4.dir(gun.M, [-0.5, 0.1, 0.8]), M4.dir(gun.M, [-1, 0, 0]), 'grip'),
        R: tip(M4.point(gun.M, [-0.12, 0.0, -0.2]), M4.dir(gun.M, [0.5, 0.1, 0.8]), M4.dir(gun.M, [1, 0, 0]), 'grip')
      }
    });
    return lab({
      shot: 'beamPOV', env: ENV.labRed, camera: cam(V3.add(target, [0.45, 0.25, 0.12]), V3.lerp(Sh.headPos(m), M4.point(gun.M, [0, 0, 0.3]), 0.5), 54), heavy: h, medic: m, labGun: gun,
      beams: [beam(gun, target, 0.07)], zaps: [{ p: target, r: 0.18, n: 4, seed: 5 }]
    });
  }

  function shotChestGlow(t) {
    const h = heavy(t, { glow: 1, expr: t < 117.5 ? HX.scared : HX.grin, nk: [0.1 - seg(t, 116.8, 119.0) * 0.35, -0.3, 0], faceExtra: { look: [0, t < 117 ? -0.35 : 0.1] } });
    const ho = heartIn(h, t * 2.4, { uber: 0.95, uberM: M4.translate(0.02, 0.16, 0), glow: 1 + 0.5 * S(t * 12) });
    const c = chestPt(h, 0.2, 0.25, 0.0);
    const head = Sh.headPos(h);
    const k = ease(seg(t, 116.6, 119.2));
    const eye = V3.lerp(V3.add(c, [-0.05, 0.42, 0.12]), V3.add(head, [-0.3, 0.12, 0.3]), k);
    const at = V3.lerp(c, head, k);
    return lab({
      shot: 'chestGlow', env: ENV.labRed, camera: cam(eye, at, 44), heavy: h, hearts: [ho],
      zaps: k < 0.6 ? [{ p: c, r: 0.16, n: 5, seed: 9 }, { p: V3.add(c, [0.05, 0.02, 0.04]), r: 0.12, n: 3, seed: 13 }] : [],
      sparks: [{ p: c, u: (t * 1.7) % 1, s: 0.6, seed: 17, tint: [1, 0.45, 0.3] }],
      glows: [{ p: c, s: 0.55 + 0.15 * S(t * 12), a: 0.7, tint: [1, 0.3, 0.2] }]
    });
  }

  function shotHeal(t) {
    const flash = 1 - seg(t, 119.7, 120.6);
    const closed = t > 120.2;
    const h = heavy(t, {
      cavity: !closed, glow: flash, expr: t < 122.8 ? HX.content : HX.worried, sit: seg(t, 120.5, 122.0) * 0.4, nk: [0.1, -0.15, 0],
      hands: (() => {
        const pose = Sh.heavyOnTable({ sit: seg(t, 120.5, 122.0) * 0.4 });
        const st = heavyState(pose, null, {});
        const p = M4.point(st.m.chest, [0.05, 0.3, 0.33]);
        return { L: tip(p, M4.dir(st.m.chest, [-0.9, 0.3, 0.2]), M4.dir(st.m.chest, [0, 0, -1]), 'relax') };
      })()
    });
    const c = chestPt(h, 0.2, 0.25, 0.0);
    return lab({
      shot: 'heal', env: flash > 0.3 ? ENV.labRed : ENV.lab, camera: cam(M4.point(h.m.chest, [0.12, 0.42, 1.05]), M4.point(h.m.chest, [0.0, 0.42, 0.2]), 42), heavy: h,
      glows: flash > 0 ? [{ p: c, s: 1.1 * flash + 0.2, a: flash, tint: [1, 0.55, 0.3] }] : [], sparks: flash > 0.1 ? [{ p: c, u: 1 - flash, s: 1.2, seed: 21, tint: [1, 0.6, 0.3] }] : [],
      medic: medic(t, { blood: 2, expr: X.gleeful })
    });
  }

  function shotHandshake(t) {
    const sit = 0.4;
    const pose = Sh.heavyOnTable({ sit });
    const st0 = heavyState(pose, null, {});
    const grip = V3.add(M4.point(st0.m.chest, [0.0, 0.55, 0.4]), [0, 0.0, -0.1]);
    const shake = 0.025 * S(t * 9) * seg(t, 125.8, 126.2) * (1 - seg(t, 128.4, 128.9));
    const g = V3.add(grip, [0, shake, 0]);
    const h = heavy(t, { cavity: false, sit, expr: t < 127 ? HX.worried : HX.content, nk: [-0.1, -0.4, 0], hands: { R: tip(V3.add(g, [0.02, 0, 0.05]), [-0.3, 0.2, -0.9], [0, -1, 0.2], 'grip') } });
    const m = medic(t, {
      at: [0.15, 0, -0.62], yaw: 0.15, sp: [0.12, 0.1, 0], nk: [-0.05, 0.1, 0], blood: 2, expr: t < 126.3 ? X.grin : t < 128.5 ? X.smug : X.gleeful,
      hands: { L: tip(V3.add(g, [-0.01, 0.02, -0.04]), [0.2, -0.2, 0.9], [0, 1, 0.2], 'grip'), R: tip(M4.point(st0.m.chest, [0.0, 0.62, 0.45]), [0.1, -0.5, 0.8], [0, -1, 0], 'flat') }
    });
    return lab({ shot: 'handshake', camera: cam([1.3, 1.55, 1.3], [0.2, 1.58, -0.4], 42), heavy: h, medic: m, labGun: GUN_PARK() });
  }

  function shotMedicCU3(t) {
    const expr = t < 130.4 ? X.talk : t < 131.6 ? X.smug : X.mad;
    const m = medic(t, { at: [0.15, 0, -0.62], yaw: 0.15, sp: [0.12, 0.1, 0], nk: [0.0 - seg(t, 131.6, 132.3) * 0.12, -0.1, 0.05], blood: 2, expr, faceExtra: { look: [-0.2, 0.05] } });
    const head = Sh.headPos(m);
    const k = seg(t, 129.38, 132.34);
    const camera = faceCam(m, [lerp(-0.3, -0.26, k), -0.03, lerp(0.44, 0.38, k)], [-0.02, -0.02, 0.03], 38, 0);
    return lab({ shot: 'medicCU3', camera, medic: m, heavy: heavy(t, { cavity: false, sit: 0.4 }) });
  }

  window.MedAct2 = {
    faceCam, GUN_PARK,
    shotWindow, shotLaughWide, shotHeartTalk, shotUberDevice, shotAttach, shotDoves1: (t) => shotDoves(t, false), shotDoves2: (t) => shotDoves(t, true), shotBloody,
    shotFridgeOpen, shotFridgeIn, shotFridgeClose, shotBigHeart, shotHeartCU, shotImplant, shotHeavyCU1: (t) => shotHeavyCU(t, 'cu1'), shotGauge,
    shotMedicCU1, shotMedicCU2, shotHoldHeart, shotHeavyCU2: (t) => shotHeavyCU(t, 'cu2'), shotLean, shotHeavyScream: (t) => shotHeavyCU(t, 'scream'),
    shotBaby, shotDoveShoulder, shotDoveCU, shotGrabGun, shotBeamBlast, shotHeavyCU3: (t) => shotHeavyCU(t, 'cu3'), shotBeamPOV, shotChestGlow, shotHeal,
    shotHandshake, shotMedicCU3, lab, heavy, medic, chestPt, heartIn, TABLE, LAMP, FRIDGE, GUN_REST
  };
})();
