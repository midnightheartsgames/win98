(function () {
  const K = window.YouVidKit;
  const { clamp } = K;
  const V = window.FabVoice;

  const ID = 'T3amFabu1s2';
  const PARTS = [window.FabScript1, window.FabScript2, window.FabScript3, window.FabScript4, window.FabScript5].filter(Boolean);
  const DURATION = PARTS[PARTS.length - 1].TO;
  const CUTS = [].concat(...PARTS.map(p => p.SHOTS.map(s => s[0])));
  const VOICE = V ? K.envelope(V.ALL, V.RATE) : () => 0;

  function part(t) {
    for (let i = PARTS.length - 1; i >= 0; i--) if (t >= PARTS[i].FROM) return PARTS[i];
    return PARTS[0];
  }

  function stage(t) {
    const tc = clamp(t, 0, DURATION - 1e-3);
    const P = part(tc);
    const list = P.SHOTS;
    let i = 0;
    while (i < list.length - 1 && tc >= list[i + 1][0]) i++;
    const [t0, fn] = list[i];
    const t1 = i < list.length - 1 ? list[i + 1][0] : P.TO;
    const st = fn(tc - t0, tc, t1 - t0) || {};
    st.shot = CUTS.indexOf(t0);
    st.t = tc;
    return st;
  }

  window.FabScript = { ID, DURATION, CUTS, PARTS, stage, voiceAt: VOICE };
})();
