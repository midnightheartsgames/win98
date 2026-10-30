(function (A) {
  'use strict';
  const fresh = () => ({ rank: 0, pts: 0, letgo: 0 });

  const B = A.Bonds = {
    get(S, id) {
      return S.bonds[id] || fresh();
    },
    own(S, id) {
      return S.bonds[id] || (S.bonds[id] = fresh());
    },
    rank(S, id) {
      return (S.bonds[id] || {}).rank || 0;
    },
    has(S, id, rank) {
      return B.rank(S, id) >= rank;
    },
    max(id) {
      return A.BONDS[id].ranks.length;
    },
    label(id, rank) {
      return `bond_${id}_${rank}`;
    },
    talkLabel(id) {
      return `bond_${id}_talk`;
    },
    spec(id, rank) {
      return A.BONDS[id].ranks[rank - 1] || null;
    },
    next(S, id) {
      return B.spec(id, B.rank(S, id) + 1);
    },
    plot(S, id) {
      const b = B.own(S, id), spec = B.spec(id, b.rank + 1);
      if (!spec) throw new Error(`bond ${id} is already at the top`);
      if (spec.from !== 'plot') throw new Error(`rank ${b.rank + 1} of ${id} comes from a respite`);
      b.rank++;
      b.last = B.label(id, b.rank);
      return { rank: b.rank, label: b.last };
    },
    open(S, id, respite) {
      const spec = B.next(S, id);
      return B.rank(S, id) >= 1 && !!spec && spec.from === 'respite' && spec.at.includes(respite);
    },
    meet(S, id) {
      const b = B.own(S, id);
      b.pts++;
      if (b.pts < 1) return { up: false, rank: b.rank, label: B.talkLabel(id) };
      b.pts--;
      b.rank++;
      b.last = B.label(id, b.rank);
      return { up: true, rank: b.rank, label: b.last };
    },
    released(S, id) {
      const need = A.BONDS[id].letgo;
      return !!need && B.get(S, id).letgo >= need;
    },
    known(S) {
      return Object.keys(A.BONDS).filter(id => {
        const b = S.bonds[id];
        return !!b && (b.rank > 0 || b.letgo > 0 || b.pts !== 0);
      });
    },
    when(S, id, rank) {
      const spec = B.spec(id, rank);
      if (!spec) return '';
      if (spec.from === 'plot') return spec.when;
      const left = spec.at.filter(r => !S.flags['rs_' + r]);
      if (!left.length) return 'упущена';
      const R = A.RESPITES[left[0]], place = A.PLACES[R.place];
      return 'передышка ' + R.when + (place ? ', ' + place.name : '');
    },
    rewards(id) {
      return A.BONDS[id].ranks.map((r, i) => [i + 1, r.reward]).filter(r => r[1]);
    }
  };

  A.Shop = {
    buy(S, id) {
      const row = A.SHOP.items.find(r => r[0] === id);
      if (!row) throw new Error('not in the shop: ' + id);
      if (!A.Bonds.has(S, 'villie', 2)) return { ok: false, why: 'лавка закрыта' };
      if ((S.credits || 0) < row[1]) return { ok: false, why: 'не хватает кредитов' };
      S.credits -= row[1];
      S.items[id] = (S.items[id] || 0) + 1;
      return { ok: true, price: row[1] };
    }
  };

  const P = A.Respite = {
    def(id) {
      return A.RESPITES[id];
    },
    place(id) {
      return A.PLACES[A.RESPITES[id].place] || null;
    },
    nextChapter(id) {
      return A.CHAPTER_ORDER[A.chapterIndex(A.RESPITES[id].chapter) + 1] || null;
    },
    start(S, id) {
      if (!A.RESPITES[id]) throw new Error('no respite ' + id);
      if (!S.respite || S.respite.id !== id) S.respite = { id, left: A.RESPITES[id].count, log: [] };
      return S.respite;
    },
    lastTime(who, id) {
      const order = A.RESPITE_ORDER, i = order.indexOf(id);
      const via = (A.BONDS[who] ? A.BONDS[who].ranks : []).filter(x => x.via).flatMap(x => x.at);
      return !order.slice(i + 1).some(r => A.RESPITES[r].near[who] !== undefined || via.includes(r));
    },
    people(S, id) {
      const near = A.RESPITES[id].near;
      const out = Object.entries(near).map(([who, room]) => ({
        who, room, bond: !!A.BONDS[who], rank: A.BONDS[who] ? B.rank(S, who) : null, open: !!A.BONDS[who] && B.open(S, who, id), last: P.lastTime(who, id)
      }));
      for (const who of Object.keys(A.BONDS)) {
        const spec = B.next(S, who);
        if (near[who] !== undefined || !spec || !spec.via || !spec.at.includes(id) || near[spec.via] === undefined) continue;
        out.push({ who, room: near[spec.via], bond: true, via: spec.via, viaName: spec.viaName, rank: B.rank(S, who), open: B.open(S, who, id), last: P.lastTime(who, id) });
      }
      return out;
    },
    trainings(S) {
      const a = (S.party || []).find(m => m.id === 'aayla');
      const knows = sk => !S.flags.forgot || A.Memory.skills(S).includes(sk);
      return Object.entries(A.TRAININGS).filter(([, t]) => A.reached(S, t.from)).map(([id, t]) => {
        let why = null;
        if (t.restraint) { if ((S.restraint || 0) >= 3) why = 'лекку уже не выдают'; }
        else if (S.flags['tr_' + id]) why = 'уже освоено';
        else if (t.after && !S.flags['tr_' + t.after]) why = 'сначала ' + A.TRAININGS[t.after].name;
        else if (t.needs && !knows(t.needs)) why = 'приём ещё не вернулся';
        else if (!a) why = 'Эйлы нет в отряде';
        return { id, name: t.name, about: t.about, enabled: !why, why };
      });
    },
    options(S, id, roomId) {
      const place = P.place(id), room = place && place.rooms.find(r => r.id === roomId);
      if (!room) return [];
      const out = [];
      for (const act of room.acts) {
        if (act === 'meditate') out.push({ act, name: A.ACTIVITIES.meditate.name, about: A.ACTIVITIES.meditate.about, enabled: true });
        if (act === 'train') for (const t of P.trainings(S)) out.push({ act, id: t.id, name: 'Тренировка: ' + t.name, about: t.about, enabled: t.enabled, why: t.why });
        if (act === 'archive') {
          const next = P.nextChapter(id), art = next && A.ARCHIVE[next] && (!A.ARCHIVE[next].respites || A.ARCHIVE[next].respites.includes(id)) ? A.ARCHIVE[next] : null;
          const why = !art ? 'статей о задании нет' : S.flags['archive_' + next] ? 'уже прочитано' : null;
          out.push({ act, id: next, name: A.ACTIVITIES.archive.name + (art ? ': ' + art.title : ''), about: A.ACTIVITIES.archive.about, enabled: !why, why });
        }
      }
      const log = S.respite && S.respite.id === id ? S.respite.log : [];
      for (const p of P.people(S, id).filter(x => x.room === roomId && x.bond)) {
        const spec = B.next(S, p.who);
        const why = log.includes('bond:' + p.who) ? 'в эту передышку уже говорили' : p.open ? null : spec ? 'ступень откроется позже' : 'выше некуда';
        out.push({ act: 'bond', id: p.who, name: A.ACTIVITIES.bond.name + ': ' + A.BONDS[p.who].name, about: spec ? `ступень ${p.rank + 1}` + (p.via ? ', ' + p.viaName : '') + (spec.reward ? ': ' + spec.reward : '') : 'связь на высшей ступени', enabled: !why, why });
      }
      return out;
    },
    apply(S, opt) {
      const R = S.respite;
      if (!R || R.left <= 0) throw new Error('no activities left');
      const ret = { ui: 'respite' };
      let label;
      if (opt.act === 'bond') {
        if (!B.open(S, opt.id, R.id) || R.log.includes('bond:' + opt.id)) throw new Error('bond ' + opt.id + ' is not open in ' + R.id);
        const r = B.meet(S, opt.id);
        label = r.label;
        if (r.up) Object.assign(ret, { bond: opt.id, rank: r.rank });
      } else if (opt.act === 'train') {
        const t = A.TRAININGS[opt.id], ok = P.trainings(S).find(x => x.id === opt.id);
        if (!t || !ok || !ok.enabled) throw new Error('training not available: ' + opt.id);
        const a = S.party.find(m => m.id === 'aayla');
        if (t.restraint) S.restraint = Math.min(3, (S.restraint || 0) + 1);
        else S.flags['tr_' + opt.id] = true;
        if (t.level) a[t.level[0]] = Math.max(a[t.level[0]] || 1, t.level[1]);
        label = 'tr_' + opt.id;
      } else if (opt.act === 'meditate') {
        S.dark = Math.max(0, (S.dark || 0) - A.MEDITATE_DARK);
        label = 'rs_meditate_' + R.id;
      } else if (opt.act === 'archive') {
        const next = P.nextChapter(R.id);
        const art = A.ARCHIVE[next];
        if (!art || (art.respites && !art.respites.includes(R.id)) || S.flags['archive_' + next]) throw new Error('nothing new in the archive');
        S.flags['archive_' + next] = true;
        label = 'rs_archive_' + next;
      } else throw new Error('unknown activity ' + opt.act);
      R.left--;
      R.log.push(opt.act + (opt.id ? ':' + opt.id : ''));
      A.Party.gain(S, A.RESPITE_XP);
      return { label, ret };
    },
    finish(S) {
      if (!S.respite) return;
      S.flags['rs_' + S.respite.id] = true;
      S.respite = null;
    },
    labels(id) {
      const R = A.RESPITES[id], next = P.nextChapter(id), out = ['rs_meditate_' + id], art = A.ARCHIVE[next];
      if (art && (!art.respites || art.respites.includes(id))) out.push('rs_archive_' + next);
      for (const [tid, t] of Object.entries(A.TRAININGS)) if (A.chapterIndex(t.from) <= A.chapterIndex(R.chapter)) out.push('tr_' + tid);
      return out;
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
