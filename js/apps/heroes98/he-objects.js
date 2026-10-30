(function (H) {
  'use strict';
  const mine = (name, res, foot) => ({ name, kind: 'mine', res, foot: foot || [3, 2], entry: [1, foot ? foot[1] - 1 : 1] });
  const pile = (name, res, amount) => ({ name, kind: 'pile', res, foot: [1, 1], entry: [0, 0], amount });

  H.OBJ = {
    goldmine: mine('Золотой прииск', 'gold'),
    sawmill: mine('Лесопилка', 'wood'),
    oremine: mine('Рудник', 'ore'),
    saltworks: mine('Солеварня', 'salt'),
    ambermine: mine('Янтарная копь', 'amber'),
    sulfurspring: mine('Серный ключ', 'sulfur', [2, 2]),
    moonrift: mine('Лунный разлом', 'moonsilver'),
    'res-gold': pile('Куча золота', 'gold', [500, 1000]),
    'res-wood': pile('Брёвна', 'wood', [5, 10]),
    'res-ore': pile('Руда', 'ore', [5, 10]),
    'res-salt': pile('Соль', 'salt', [3, 6]),
    'res-amber': pile('Янтарь', 'amber', [3, 6]),
    'res-sulfur': pile('Сера', 'sulfur', [3, 6]),
    'res-moonsilver': pile('Лунное серебро', 'moonsilver', [3, 6]),
    chest: { name: 'Сундук', kind: 'chest', foot: [1, 1], entry: [0, 0], offers: [[1000, 500], [1500, 1000], [2000, 1500]] },
    campfire: { name: 'Костёр', kind: 'campfire', foot: [1, 1], entry: [0, 0], gold: [400, 600], res: [4, 6] },
    artifact: { name: 'Артефакт', kind: 'artifact', foot: [1, 1], entry: [0, 0] },
    scroll: { name: 'Свиток', kind: 'scroll', foot: [1, 1], entry: [0, 0] },
    shrine1: { name: 'Святилище 1 круга', kind: 'shrine', circle: 1, foot: [2, 2], entry: [0, 1] },
    shrine2: { name: 'Святилище 2 круга', kind: 'shrine', circle: 2, foot: [2, 2], entry: [0, 1] },
    shrine3: { name: 'Святилище 3 круга', kind: 'shrine', circle: 3, foot: [2, 2], entry: [0, 1] },
    monster: { name: 'Отряд', kind: 'monster', foot: [1, 1], entry: null },
    town: { name: 'Город', kind: 'town', foot: [5, 3], entry: [2, 2] },
    tree: { name: 'Дерево', kind: 'decor', foot: [1, 1], entry: null },
    pine: { name: 'Ель', kind: 'decor', foot: [1, 1], entry: null },
    rock: { name: 'Камень', kind: 'decor', foot: [1, 1], entry: null },
    mountain: { name: 'Гора', kind: 'decor', foot: [3, 2], entry: null }
  };

  const span = (S, [lo, hi]) => lo + Math.floor(H.roll(S) * (hi - lo + 1));
  const RARE = ['wood', 'ore', 'salt', 'amber', 'sulfur', 'moonsilver'];

  const randomSpell = (S, circle) => {
    const pool = Object.values(H.SPELLS).filter(s => s.circle === circle);
    return pool[Math.floor(H.roll(S) * pool.length)].id;
  };

  H.OBJ_VISIT = {
    scroll(S, hero, o, ev) {
      if (!o.spell) o.spell = randomSpell(S, 1 + Math.floor(H.roll(S) * 3));
      if (H.Hero.learn(hero, o.spell) || hero.spells.includes(o.spell)) {
        H.Adv.remove(S, o);
        ev.push({ t: 'learned', hero: hero.id, spells: [o.spell] });
      } else if (hero.bag.length < H.HERO.maxBag) {
        hero.bag.push('scroll-' + o.spell);
        H.Adv.remove(S, o);
        ev.push({ t: 'scroll', hero: hero.id, spell: o.spell });
      } else ev.push({ t: 'bagfull', hero: hero.id });
    },
    shrine(S, hero, o, ev) {
      const t = H.OBJ[o.t];
      if (!o.spell) o.spell = randomSpell(S, t.circle);
      S.ver++;
      if (hero.spells.includes(o.spell)) ev.push({ t: 'shrine', hero: hero.id, spell: o.spell, known: true });
      else if (H.Hero.learn(hero, o.spell)) ev.push({ t: 'learned', hero: hero.id, spells: [o.spell] });
      else ev.push({ t: 'shrine', hero: hero.id, spell: o.spell, known: false });
    },
    artifact(S, hero, o, ev) {
      if (!H.Hero.giveArt(hero, o.art)) {
        ev.push({ t: 'bagfull', hero: hero.id });
        return;
      }
      H.Adv.remove(S, o);
      ev.push({ t: 'artifact', hero: hero.id, art: o.art });
    },
    mine(S, hero, o, ev) {
      if (o.owner === hero.owner) return;
      o.owner = hero.owner;
      ev.push({ t: 'capture', obj: o.id, res: H.OBJ[o.t].res });
    },
    pile(S, hero, o, ev) {
      const t = H.OBJ[o.t], n = (o.amount || span(S, t.amount)) + (H.Hero.hasPerk(hero, 'treasure') && t.res !== 'gold' ? 1 : 0);
      S.players[hero.owner].res[t.res] += n;
      H.Adv.remove(S, o);
      ev.push({ t: 'gain', hero: hero.id, res: { [t.res]: n } });
    },
    campfire(S, hero, o, ev) {
      const t = H.OBJ[o.t], gold = span(S, t.gold), kind = RARE[Math.floor(H.roll(S) * RARE.length)], n = span(S, t.res);
      const res = S.players[hero.owner].res;
      res.gold += gold;
      res[kind] += n;
      H.Adv.remove(S, o);
      ev.push({ t: 'gain', hero: hero.id, res: { gold, [kind]: n } });
    },
    chest(S, hero, o, ev) {
      const offer = H.OBJ.chest.offers[o.offer != null ? o.offer : Math.floor(H.roll(S) * H.OBJ.chest.offers.length)];
      S.pending = { kind: 'chest', hero: hero.id, obj: o.id, gold: Math.round(offer[0] * (H.Hero.hasPerk(hero, 'treasure') ? H.HERO.treasureGold : 1)), xp: offer[1] };
      ev.push({ t: 'pending', kind: 'chest' });
    }
  };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
