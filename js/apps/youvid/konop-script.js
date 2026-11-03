(function () {
  const K = window.YouVidKit;
  const { clamp, lerp, ease } = K;
  const Sh = window.KonopShots;
  const A1 = window.KonopAct1 || {};
  const A2 = window.KonopAct2 || {};
  const A3 = window.KonopAct3 || {};

  const hold = () => Sh.blank({ bg: [0, 0, 0] });
  const pick = (A, name) => A[name] || hold;

  const SHOTS = [
    [0, 1.292, pick(A1, 'townNight')],
    [1.292, 3.002, pick(A1, 'castleGate')],
    [3.002, 4.712, pick(A1, 'nightField')],
    [4.712, 6.422, pick(A1, 'streets')],
    [6.422, 6.756, pick(A1, 'card0')],
    [6.756, 7.09, pick(A1, 'card1')],
    [7.09, 7.423, pick(A1, 'card2')],
    [7.423, 7.757, pick(A1, 'card3')],
    [7.757, 9.175, pick(A1, 'kazumaSky')],
    [9.175, 9.342, pick(A1, 'kazumaReach1')],
    [9.342, 9.842, pick(A1, 'kazumaReach2')],
    [9.842, 12.25, pick(A1, 'kazumaGlow')],
    [12.25, 24.607, pick(A1, 'logoShot')],
    [24.607, 27.902, pick(A1, 'hill')],
    [27.902, 30.28, pick(A2, 'aquaGrass')],
    [30.28, 31.906, pick(A2, 'barn')],
    [31.906, 32.574, pick(A2, 'kazumaKnife')],
    [32.574, 33.199, pick(A2, 'aquaStaff')],
    [33.199, 33.908, pick(A2, 'trollChase')],
    [33.908, 34.659, pick(A2, 'lyingField')],
    [34.659, 36.202, pick(A2, 'guildWaitress')],
    [36.202, 37.203, pick(A2, 'meguminEat')],
    [37.203, 38.663, pick(A2, 'darknessStreet')],
    [38.663, 40.039, pick(A2, 'castleDance')],
    [40.039, 41.165, pick(A2, 'dungeon')],
    [41.165, 41.916, pick(A2, 'campfire')],
    [41.916, 43.543, pick(A2, 'lake')],
    [43.543, 44.335, pick(A2, 'sunset')],
    [44.335, 45.086, pick(A2, 'footstep')],
    [45.086, 48.756, pick(A2, 'waterDance')],
    [48.756, 49.507, pick(A2, 'aquaSpin')],
    [49.507, 50.0, pick(A2, 'aquaArms')],
    [50.0, 51.175, pick(A2, 'bubbleChest')],
    [51.175, 52.969, pick(A2, 'chestHand')],
    [52.969, 53.553, pick(A3, 'aquaSkyBack')],
    [53.553, 53.97, pick(A3, 'aquaShout')],
    [53.97, 54.387, pick(A3, 'dagger')],
    [54.387, 55.096, pick(A3, 'kazumaPoint')],
    [55.096, 56.18, pick(A3, 'golem')],
    [56.18, 56.681, pick(A3, 'golemHead')],
    [56.681, 57.098, pick(A3, 'darknessCharge')],
    [57.098, 57.682, pick(A3, 'darknessSwing')],
    [57.682, 58.683, pick(A3, 'darknessMiss')],
    [58.683, 62.27, pick(A3, 'rockComic')],
    [62.27, 62.75, pick(A3, 'explosionSmoke')],
    [62.75, 63.354, pick(A3, 'darknessPass')],
    [63.354, 63.688, pick(A3, 'darknessBlown')],
    [63.688, 64.606, pick(A3, 'skyFall')],
    [64.606, 66.19, pick(A3, 'darknessFly')],
    [66.19, 67.025, pick(A3, 'meguminCliff')],
    [67.025, 67.275, pick(A3, 'meguminFace')],
    [67.275, 67.942, pick(A3, 'meguminCast')],
    [67.942, 68.484, pick(A3, 'aquaNight')],
    [68.484, 69.986, pick(A3, 'circles')],
    [69.986, 70.361, pick(A3, 'pillar')],
    [70.361, 71.237, pick(A3, 'blast')],
    [71.237, 73.072, pick(A3, 'aftermath')],
    [73.072, 76.826, pick(A3, 'lyingClose')],
    [76.826, 78.995, pick(A3, 'kazumaSmile')],
    [78.995, 79.829, pick(A3, 'swordSky')],
    [79.829, 80.163, pick(A3, 'wizShop')],
    [80.163, 80.913, pick(A3, 'wiz')],
    [80.913, 81.664, pick(A3, 'crowd')],
    [81.664, 82.206, pick(A3, 'chris')],
    [82.206, 82.957, pick(A3, 'verdia')],
    [82.957, 83.583, pick(A3, 'mitsurugi')],
    [83.583, 84.083, pick(A3, 'waitresses')],
    [84.083, 84.917, pick(A3, 'yunyun')],
    [84.917, 85.668, pick(A3, 'luna')],
    [85.668, 89.505, pick(A3, 'finale')],
    [89.505, 99.52, null]
  ];

  const CUTS = SHOTS.map(s => s[0]);

  function shotIndexAt(t) {
    let idx = 0;
    for (let i = 1; i < SHOTS.length; i++) if (t >= SHOTS[i][0]) idx = i;
    return idx;
  }

  function stage(rawT) {
    const t = clamp(rawT, 0, Sh.DURATION);
    const shot = shotIndexAt(t);
    if (!SHOTS[shot][2]) {
      const fade = t > Sh.DURATION - 0.6 ? lerp(1, 0, ease((t - (Sh.DURATION - 0.6)) / 0.6)) : 1;
      return Object.assign(Sh.blank({ kind: 'end', fade }), { t, shot, replay: Math.min(t - Sh.REPLAY_SHIFT, 63.3) });
    }
    const st = SHOTS[shot][2](t);
    const fadeIn = t < 0.35 ? ease(t / 0.35) : 1;
    st.fade = (st.fade === undefined ? 1 : st.fade) * fadeIn;
    st.copyright = clamp((t - 86.9) / 0.3, 0, 1) * (t < 89.5 ? 1 : 0);
    st.episode = t >= 45.95 && t < 48.756 ? (t < 46.3 ? (Math.floor(t * 30) % 2 ? 1 : 0.3) : 1) : 0;
    return Object.assign({ t, shot }, st);
  }

  window.KonopScript = { SHOTS, CUTS, stage, DURATION: Sh.DURATION };
})();
