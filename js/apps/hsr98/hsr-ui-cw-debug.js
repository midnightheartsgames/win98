(function (H) {
  'use strict';
  const G = H.Gfx, CW = H.CW, TUN = CW.TUN;
  const { C } = H.UI_CONST;
  const wrap = (i, n) => ((i % n) + n) % n;
  const ITEM_IDS = Object.keys(CW.ITEMS);
  const lastRank = () => CW.rankIndex(CW.RANKS.length - 1, CW.RANKS[CW.RANKS.length - 1].subs);

  Object.assign(H.UI.prototype, {
    debugCwForm(st, note, shift) {
      const ui = this, g = this.game, r = g.cwRun(), D = st.cw || (st.cw = { hero: 0, star: 1, item: 0 });
      const best = g.cwRankBest(), C0 = g.cwMeta();
      const rankRow = { label: 'Ранг', value: CW.RANKS[best.tier].code + '-' + best.sub, step: k => { C0.rank.best = Math.max(0, Math.min(lastRank(), C0.rank.best + k)); } };
      const bankAct = { label: 'Весь банк', icon: 'archive', fn: () => {
        const S = g.cw().seen, all = (k, ids) => { S[k] = S[k] || {}; for (const id of ids) S[k][id] = Math.max(S[k][id] || 0, 1); };
        all('strats', Object.keys(CW.STRATS)); all('envs', Object.keys(CW.ENVS)); all('items', ITEM_IDS); all('kits', CW.POOL); all('bonds', Object.keys(CW.BONDS)); all('opps', Object.keys(CW.OPPONENTS));
        note('вся коллекция банка данных');
      } };
      if (!r) return { rows: [Object.assign({ open() {} }, rankRow)], acts: [bankAct] };
      const heroId = CW.POOL[D.hero], d = CW.UNITS[heroId], maxStar = TUN.maxStar[d.cost];
      D.star = Math.min(D.star, maxStar);
      const itemId = ITEM_IDS[D.item];
      return {
        rows: [
          { label: 'Монеты', value: String(r.gold), step: k => { r.gold = Math.max(0, r.gold + k * (shift() ? 50 : 10)); } },
          { label: 'Опыт', value: r.lvl >= CW.lvlMax(r) ? 'наибольший' : r.exp + ' / ' + g.cwNeed(r), step: k => { if (k > 0) g.cwAddExp(r, shift() ? 20 : 4); else r.exp = Math.max(0, r.exp - 4); } },
          { label: 'Уровень', value: String(r.lvl), step: k => { r.lvl = Math.max(1, Math.min(TUN.maxLevel, r.lvl + k)); r.exp = 0; } },
          { label: 'НР команды', value: r.hp + ' / ' + r.hpMax, step: k => { r.hp = Math.max(1, r.hp + k * 10); r.hpMax = Math.max(r.hpMax, r.hp); } },
          { label: 'Герой', value: H.CHARS[d.kitOn].name + ' · ' + d.cost, step: k => { D.hero = wrap(D.hero + k * (shift() ? 5 : 1), CW.POOL.length); } },
          { label: 'Звёзды', value: D.star + '★', step: k => { D.star = wrap(D.star - 1 + k, maxStar) + 1; } },
          { label: 'Предмет', value: CW.ITEMS[itemId].name, step: k => { D.item = wrap(D.item + k * (shift() ? 8 : 1), ITEM_IDS.length); } },
          { label: 'Узел', value: (r.node + 1) + ' / ' + r.nodes.length + ' · ' + CW.NODE[r.nodes[r.node]].name, step: k => { if (r.phase !== 'prep') return; r.node = wrap(r.node + k, r.nodes.length); } },
          rankRow
        ],
        acts: [
          { label: 'Герой', icon: 'chars', fn: () => {
            const need = Math.pow(3, D.star - 1), at = CW.benchFree(r);
            if (at < 0) { note('зона подготовки заполнена', 'deny'); return; }
            r.pool[heroId] = Math.max(0, (r.pool[heroId] || 0) - need);
            r.board.bench[at] = { uid: ++r.uid, id: heroId, star: D.star };
            g.cwMerge(r);
            note(H.CHARS[d.kitOn].name + ' ' + D.star + '★');
          } },
          { label: 'Предмет', icon: 'bag', fn: () => { g.cwInvAdd(r, itemId); note(CW.ITEMS[itemId].name); } },
          bankAct
        ]
      };
    },

    debugCwPreview(c, x, y, w) {
      const ui = this, g = this.game, r = g.cwRun();
      ui.text('Партия Валютных войн', x + 14, y + 12, { size: 12, bold: true, col: C.gold });
      ui.text('Вкладка видна только в режиме Валютных войн.', x + 14, y + 330, { size: 9, col: C.dim });
      if (!r) {
        ui.text('Партия не начата.', x + 14, y + 36, { size: 10, col: C.sub });
        ui.text('Строки партии появятся после её начала.', x + 14, y + 54, { size: 10, col: C.sub });
        return;
      }
      const rows = [
        [CW.MODES[r.mode].name, g.cwRank(r.tier, r.sub).code],
        ['Измерение / узел', (r.plane + 1) + ' / ' + (r.node + 1)],
        ['Фаза', r.phase],
        ['Монеты, уровень', r.gold + ', ' + r.lvl],
        ['НР команды', r.hp + ' / ' + r.hpMax],
        ['Сложность', String(r.diff + (r.diffPlus || 0))],
        ['Стратегий', String((r.strats || []).length)],
        ['Среды', (r.envs || []).map(id => CW.ENVS[id].name).join(', ') || 'нет'],
        ['Аффиксы', String((r.affixes || []).length)]
      ];
      rows.forEach(([a, b], i) => { ui.text(a, x + 14, y + 36 + i * 18, { size: 10, col: C.sub }); ui.text(ui.clip(b, w - 150, 10), x + w - 14, y + 36 + i * 18, { align: 'right', size: 10, bold: true, col: C.cream }); });
      g.cwDeployed(r).slice(0, 10).forEach((u, i) => ui.cwCell(c, u, x + 14 + (i % 5) * 54, y + 210 + Math.floor(i / 5) * 54, 48));
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
