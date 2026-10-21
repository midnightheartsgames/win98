(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { C } = H.UI_CONST;
  const PIPS = { luka: ['Will', 'will', 'willMax', '#ff8a6a'], xueyi: ['Karma', 'karma', 'karmaMax', '#c8a0ff'], yukong: ['Bow', 'bow', null, '#ffd850'] };

  Object.assign(H.UI.prototype, {
    foursEvent(e) {
      switch (e.t) {
        case 'stack':
          e.u['d' + e.key] = e.v;
          if (e.text) { this.floatAt(e.u, e.text, e.col || C.gold, 11); this.sfx('buff'); }
          return true;
        case 'tiles':
          e.u.dTiles = e.tiles;
          if (e.kong === true) { this.bt.big = { text: 'ЗАКРЫТЫЙ КОНГ', sub: e.u.name + ': четыре одной масти', col: '#5ad08a', t: 0.9 }; this.sfx('star4'); }
          return true;
      }
      return false;
    },

    foursCard(c, u, x, y, tags, tx) {
      const pip = PIPS[u.charId];
      if (pip) {
        const n = u['d' + pip[0]] == null ? u.flags[pip[1]] || 0 : u['d' + pip[0]], max = pip[2] ? u.flags[pip[2]] || T[pip[2]] : 2, step = max > 6 ? 6 : 8;
        for (let k = 0; k < max; k++) this.diamond(x + 9 + k * step, y + 93, max > 6 ? 2.5 : 3, k < n ? pip[3] : '#20263e', '#0a1020');
        tx = x + 12 + max * step;
      }
      if (u.charId === 'qingque') {
        const hand = u.dTiles || u.flags.tiles || [];
        if (u.flags.kong) tags.unshift('Конг');
        for (let k = 0; k < T.tilesMax; k++) {
          const s = hand[k], bx = x + 6 + k * 11, by = y + 88;
          c.fillStyle = s == null ? '#20263e' : '#f2eee0'; c.fillRect(bx, by, 9, 11);
          if (s != null) this.tileFace(c, s, bx, by);
        }
        tx = x + 52;
        if (u.flags.tileStack) tags.push('Урон +' + Math.round(T.tileDmg * 100 * u.flags.tileStack) + '%');
      }
      if (u.buffs.some(b => b.name === 'Реакция выживания')) tags.push('Выживание');
      if (u.buffs.some(b => b.name === 'Благословение')) tags.push('Благосл.');
      if (u.buffs.some(b => b.name === 'Указ')) tags.push('Указ');
      if (u.charId === 'yukong' && u.flags.arrowCd > 0) tags.push('Стрела ' + u.flags.arrowCd);
      return tx;
    },

    tileFace(c, s, bx, by) {
      const col = H.FOURS.SUITS[s].col, dk = G.dark(col, 0.45);
      c.fillStyle = col; c.fillRect(bx + 1, by + 9, 7, 1);
      c.fillStyle = dk;
      if (s === 0) { c.fillRect(bx + 2, by + 2, 2, 6); c.fillRect(bx + 5, by + 2, 2, 6); c.fillStyle = col; c.fillRect(bx + 2, by + 4, 2, 1); c.fillRect(bx + 5, by + 5, 2, 1); }
      else if (s === 1) { c.beginPath(); c.arc(bx + 4.5, by + 5, 3, 0, Math.PI * 2); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(bx + 4.5, by + 5, 1.3, 0, Math.PI * 2); c.fill(); }
      else { c.fillRect(bx + 2, by + 2, 5, 1); c.fillRect(bx + 4, by + 2, 1, 6); c.fillRect(bx + 2, by + 5, 5, 1); c.fillRect(bx + 2, by + 7, 5, 1); }
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
