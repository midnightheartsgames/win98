(function (H) {
  'use strict';
  const G = H.Gfx, CW = H.CW, SS = 4;
  const META = G.FOE_META, ART = G.FOE_ART;

  const alias = (id, from, extra) => {
    META[id] = Object.assign({}, META[from], extra || {});
    if (!META[from] || !META[from].figure) ART[id] = ART[from];
  };

  alias('cocolia_x', 'cocolia2', { aura: '230,245,255' });
  alias('phantylia_x', 'phantylia2', { aura: '255,210,120' });
  alias('timekiller', 'distorter', { aura: '200,140,255', anim: true });
  alias('trotter_big', 'trotter', { aura: '255,220,90' });

  META.svarog_hand = { icon: [40, 60, 28], anim: true, aura: '255,60,160' };
  ART.svarog_hand = (p, f) => {
    if (!H.Ults || !H.Ults.Art || !H.Ults.Art.svarogHand) { p.ell('#3a3048', 50, 60, 24, 30); return; }
    H.Ults.Art.svarogHand(p.g, p.X(36) * SS, p.Y(64 - (f ? 3 : 0)) * SS, p.u * SS * 0.55);
  };

  const ev0 = H.UI.prototype.cwEvent;
  if (ev0) H.UI.prototype.cwEvent = function (e) {
    const bt = this.bt;
    if (e && e.t === 'cwPhase' && CW.PHASE_FX[e.k] && !['aura', 'auraBreak', 'wrath'].includes(e.k)) {
      const F = CW.PHASE_FX[e.k];
      bt.big = { text: F.name.toUpperCase(), sub: F.text.split('.')[0], col: '#ffb0d0', t: 1 };
      this.sfx('ult');
      return true;
    }
    return ev0.call(this, e);
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
