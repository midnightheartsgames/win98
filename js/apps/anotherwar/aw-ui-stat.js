(function (AW) {
  'use strict';

  const el = (t, c, p, s) => AW.el(t, c, p, s);
  const R = AW.Rules;
  const T = k => (AW.TEXT && AW.TEXT[k]) || '';
  const STATS = [['str', 'Strenght'], ['agi', 'Agility'], ['int', 'Inteligence'], ['end', 'Endurance'], ['cha', 'Charisma'], ['spd', 'Speed'], ['lck', 'Luck']];
  const CLASS_KEY = { strongman: 'RaceStrongman', thief: 'RaceThief', intel: 'RaceInteligent', johann: 'RaceThief' };

  function txt(parent, cls, x, y, s, center) {
    const d = el('div', cls + (center ? ' aw-center' : ''), parent, { left: x + 'px', top: y + 'px' });
    d.textContent = s;
    return d;
  }

  function weaponDamage(a) {
    const w = a.weapon();
    if (!w || AW.Combat.isMelee(a) || !a.weaponReady()) {
      let mult = 0.3;
      if (w && AW.Items.wclass(w) === 'KNIFE') mult = 0.7;
      const mx = Math.floor(a.stat('str') * mult) + 1;
      return [1 + a.dmgBonus(), mx + a.dmgBonus()];
    }
    const d = R.AMMO_DMG[w.link ? w.link.sub : 'CNOR'] || [2, 12];
    return [d[0] + (w.damage || 0), d[1] + (w.damage || 0)];
  }

  AW.StatUI = {
    build(scr) {
      const C0 = scr.content, who = scr.who, W = scr.W;
      const tree = R.TREES[who.cls] || R.TREES.johann;
      const caps = R.skillRows(tree, who.level);
      if (!scr.alloc || scr.alloc.who !== who) scr.alloc = { who, stats: {}, skills: {}, sp: {}, used: 0 };
      const A = scr.alloc;
      const left = who.points - A.used;
      txt(C0, 'aw-tim22 aw-gray', 324, 56, T('NAME') || 'ИМЯ', true);
      txt(C0, 'aw-tim32 aw-lgray', 324, 88, who.name, true);
      txt(C0, 'aw-tim22 aw-gray', 504, 56, T('LEVEL') || 'УРОВЕНЬ', true);
      txt(C0, 'aw-tim32 aw-yellow', 506, 88, String(who.level), true);
      if (who.points > 0) txt(C0, 'aw-tim32 aw-yellow', 558, 88, '(' + left + ')', true);
      txt(C0, 'aw-tim22 aw-gray', 679, 56, T('CLASS') || 'КЛАСС', true);
      txt(C0, 'aw-tim32 aw-lgray', 682, 88, who.id === 'Johann' ? 'Механик' : (T(CLASS_KEY[who.cls]) || R.CLASSES[who.cls].name), true);
      STATS.forEach(([s, key], n) => {
        const y = 136 + n * 22;
        const add = A.stats[s] || 0;
        const cls = add ? 'aw-tim22 aw-yellow' : 'aw-tim22 aw-gray';
        const lbl = txt(C0, cls, 245, y, T(key) || R.STAT_NAMES[s]);
        AW.StatUI.descHover(scr, lbl, s);
        txt(C0, 'aw-tim22 aw-lgray', 439, y + 2, (who.base[s] + add) + '/' + (who.stat(s) + add), true);
        if (who.points > 0) AW.StatUI.pm(scr, 471, y + 8, () => left > 0, () => { A.stats[s] = add + 1; A.used++; }, () => add > 0, () => { A.stats[s] = add - 1; A.used--; });
      });
      const acLbl = txt(C0, 'aw-tim22 aw-gray', 245, 136 + 7 * 22, T('Armorclass') || 'Защищенность');
      AW.StatUI.descHover(scr, acLbl, 'ac');
      txt(C0, 'aw-tim22 aw-lgray', 439, 138 + 7 * 22, String(Math.round(who.ac())), true);
      const skills = Object.keys(R.SKILLS).filter(k => (who.skills[k] || 0) > 0 || (who.points > 0 && (caps[k] || 0) > (who.skills[k] || 0)));
      if (!scr.skFirst) scr.skFirst = 0;
      const vis = skills.slice(scr.skFirst, scr.skFirst + 8);
      vis.forEach((k, i) => {
        const y = 136 + i * 22;
        const add = A.skills[k] || 0;
        const lv = (who.skills[k] || 0) + add;
        const l = txt(C0, add ? 'aw-tim22 aw-yellow' : 'aw-tim22 aw-gray', 552, y, R.SKILLS[k].name + '(' + lv + ')');
        AW.StatUI.descHover(scr, l, 'skill:' + k);
        if (who.points > 0) AW.StatUI.pm(scr, 515, y + 8, () => left > 0 && lv < (caps[k] || 0), () => { A.skills[k] = add + 1; A.used++; }, () => add > 0, () => { A.skills[k] = add - 1; A.used--; });
      });
      if (skills.length > 8) {
        const up = AW.spr('gui/scroll-sk1', 0, 1, C0, 753, 136, { cls: 'aw-hit' });
        const dn = AW.spr('gui/scroll-sk1', 0, 0, C0, 753, 306, { cls: 'aw-hit' });
        up.addEventListener('mousedown', ev => { ev.stopPropagation(); scr.skFirst = Math.max(0, scr.skFirst - 1); AW.InvUI.build(scr); });
        dn.addEventListener('mousedown', ev => { ev.stopPropagation(); scr.skFirst = Math.min(skills.length - 8, scr.skFirst + 1); AW.InvUI.build(scr); });
      }
      if (who === W.hero) {
        const specs = R.SPECIALS[who.cls] || [];
        const row = R.spRow(who.cls, who.level);
        for (let n = 0; n < 8; n++) {
          const s = specs[n];
          const x = n < 4 ? 245 : 552, y = 370 + (n % 4) * 22;
          const add = s ? A.sp[s.id] || 0 : 0;
          const lv = s ? (who.sp[s.id] || 0) + add : 0;
          const label = 'F' + (n + 1) + ': ' + (s && lv ? s.name + '(' + lv + ')' : '');
          const l = txt(C0, add ? 'aw-tim22s aw-yellow' : 'aw-tim22s aw-gray', x, y, label);
          if (s && lv) AW.StatUI.descHover(scr, l, 'sp:' + s.id);
          if (who.points > 0 && s && row.indexOf(s.id) >= 0) {
            AW.StatUI.pm(scr, n < 4 ? 471 : 515, y + 8, () => left > 0 && lv < 4, () => { A.sp[s.id] = add + 1; A.used++; }, () => add > 0, () => { A.sp[s.id] = add - 1; A.used--; });
          }
        }
      }
      const dmg = weaponDamage(who);
      txt(C0, 'aw-tim28 aw-yellow', 504, 336, AW.label('StatHP', 'Здоровье') + ': ' + Math.floor(who.hp) + '/' + Math.floor(who.hpMax) + '  ' + AW.label('StatEXP', 'Опыт') + ': ' + who.xp + '  ' + AW.label('StatDamage', 'Урон') + ': ' + dmg[0] + '-' + dmg[1], true);
      if (who.points > 0) {
        const b = AW.spr('gui/inventory/potwierdz-sk1', 0, A.used ? 0 : 1, C0, 420, 473, { cls: 'aw-hit' });
        const t = txt(C0, 'aw-geo14 aw-lgray', 505, 478, T('StatZatwierdzZmiany') || 'Подтвердить', true);
        t.style.pointerEvents = 'none';
        b.addEventListener('mousedown', ev => { ev.stopPropagation(); AW.StatUI.commit(scr); scr.ui.audio.play('menu/accept3'); AW.InvUI.build(scr); });
        scr.statCommit = () => AW.StatUI.commit(scr);
      }
    },

    pm(scr, x, y, canPlus, plus, canMinus, minus) {
      const C0 = scr.content;
      const p = AW.spr('gui/inventory/statplus', 0, canPlus() ? 0 : 1, C0, x, y - 5, { cls: 'aw-hit' });
      const m = AW.spr('gui/inventory/statminus', 0, canMinus() ? 0 : 1, C0, x + 14, y - 5, { cls: 'aw-hit' });
      p.addEventListener('mousedown', ev => { ev.stopPropagation(); if (!canPlus()) return; plus(); scr.ui.audio.play('menu/click2'); AW.InvUI.build(scr); });
      m.addEventListener('mousedown', ev => { ev.stopPropagation(); if (!canMinus()) return; minus(); scr.ui.audio.play('menu/click2'); AW.InvUI.build(scr); });
    },

    commit(scr) {
      const A = scr.alloc;
      if (!A || !A.used) return;
      const who = A.who;
      const oldHp = R.hpBase(who.base.end, who.base.lck);
      for (const s of Object.keys(A.stats)) who.base[s] += A.stats[s];
      const newHp = R.hpBase(who.base.end, who.base.lck);
      if (newHp !== oldHp) { who.hpMax += newHp - oldHp; who.hp += Math.max(0, newHp - oldHp); }
      for (const k of Object.keys(A.skills)) if (A.skills[k]) who.skills[k] = (who.skills[k] || 0) + A.skills[k];
      for (const k of Object.keys(A.sp)) if (A.sp[k]) { who.sp[k] = (who.sp[k] || 0) + A.sp[k]; if (who.spCharge[k] === undefined) who.spCharge[k] = 100; if (!who.spSel) who.spSel = k; }
      who.points -= A.used;
      scr.alloc = null;
    },

    descHover(scr, d, id) {
      d.classList.add('aw-hit');
      d.addEventListener('mouseenter', () => { scr.statDesc = id; AW.StatUI.showDesc(scr, id); });
      d.addEventListener('mouseleave', () => { if (scr.statDesc === id) { scr.statDesc = null; AW.StatUI.showDesc(scr, null); } });
    },

    showDesc(scr, id) {
      let box = scr.statBox;
      if (!id) { if (box) box.style.display = 'none'; return; }
      if (!box || !box.isConnected) { box = scr.statBox = el('div', 'aw-desc', scr.el); }
      box.innerHTML = '';
      let title = '', body = '', mech = '';
      if (id.startsWith('skill:')) { const s = R.SKILLS[id.slice(6)]; title = s.name; body = s.desc; mech = s.mech; }
      else if (id.startsWith('sp:')) { const s = R.special(scr.who.cls, id.slice(3)); title = s.name; body = s.desc; mech = s.mech; }
      else { title = R.STAT_NAMES[id] || id; body = R.STAT_DESC[id] || ''; }
      const w = 320;
      const inner = el('div', 'aw-desc-body', box, { width: (w - 20) + 'px' });
      el('div', 'aw-desc-name', inner).textContent = title;
      el('div', 'aw-desc-line', inner).textContent = body;
      if (mech) el('div', 'aw-desc-line aw-yellow', inner).textContent = mech;
      box.style.display = 'block';
      requestAnimationFrame(() => {
        const h = inner.offsetHeight + 20;
        box.insertBefore(AW.windowCanvas(w, h), box.firstChild);
        Object.assign(box.style, { width: w + 'px', height: h + 'px', left: Math.min(800 - w, scr.ui.mouse.x + 20) + 'px', top: Math.min(600 - h, scr.ui.mouse.y + 20) + 'px' });
      });
    },

    diary(scr) {
      const C0 = scr.content, W = scr.W;
      const wrap = el('div', 'aw-diary', C0);
      const notes = W.state.notes.slice().reverse();
      if (!notes.length) {
        el('div', 'aw-diary-empty', wrap).textContent = 'Пока ни одной записи.';
        return;
      }
      for (const n of notes) {
        const d = AW.NOTES && AW.NOTES[n.id];
        if (!d) continue;
        const e = el('div', 'aw-note', wrap);
        el('div', 'aw-note-title', e).textContent = d.title;
        for (const p of String(d.text).split('\n')) el('p', 'aw-note-text', e).textContent = p;
      }
      wrap.addEventListener('wheel', ev => { wrap.scrollTop += ev.deltaY; ev.stopPropagation(); }, { passive: true });
    },

    map(scr) {
      const C0 = scr.content, W = scr.W;
      if (scr.mapTyp === undefined) scr.mapTyp = 0;
      const tabs = [['MapLocation', 0, 235], ['MapRegion', 1, 335], ['MapEurope', 2, 435]];
      for (const [key, typ, x] of tabs) {
        const ok = typ === 0 || W.flag('map' + (typ + 1));
        const t = txt(C0, 'aw-maptab' + (scr.mapTyp === typ ? ' on' : '') + (ok ? '' : ' off'), x, 27, T(key) || key);
        t.classList.add('aw-hit');
        t.addEventListener('mousedown', ev => { ev.stopPropagation(); if (!ok) return; scr.mapTyp = typ; AW.InvUI.build(scr); });
      }
      const cx = 507, cy = 264;
      let key;
      if (scr.mapTyp === 0) key = 'tla/mapy/' + (W.level.bg === 'knajpawinieta' ? 'knajpa' : W.level.bg);
      else if (scr.mapTyp === 1) key = 'tla/mapy/aregion';
      else key = 'tla/mapy/europe';
      const f = AW.Assets.frame(key, 0, 0);
      if (!f) { txt(C0, 'aw-geo14 aw-lgray', 507, 250, 'Карты этого места нет', true); return; }
      const x0 = Math.round(cx - f[2] / 2), y0 = Math.round(cy - f[3] / 2);
      AW.spr(key, 0, 0, C0, x0, y0);
      const h = W.hero;
      let hx = -1, hy = -1;
      if (scr.mapTyp === 0) {
        hx = x0 + h.x * f[2] / (W.level.bgw || 800);
        hy = y0 + h.y * f[3] / (W.level.bgh || 600);
        const marks = (W.state.mapMarks && W.state.mapMarks[W.levelId]) || [];
        for (const m of marks) AW.spr('gui/znacznik', 0, 0, C0, x0 + m[0] * f[2] / W.level.bgw, y0 + m[1] * f[3] / W.level.bgh, { center: true });
        const title = T(W.levelId + '_map') || AW.LEVEL_NAMES[W.levelId] || '';
        txt(C0, 'aw-geo14 aw-yellow', 500, 58, title, true);
      } else if (scr.mapTyp === 1) {
        const p = AW.StatUI.REGION[W.levelId.toUpperCase()];
        if (p) { hx = p[0]; hy = p[1]; }
        for (const id of Object.keys(W.state.visited)) {
          const q = AW.StatUI.REGION[id.toUpperCase()];
          if (!q || id === W.levelId) continue;
          const d = AW.spr('gui/marker_npc', 0, 0, C0, q[0], q[1], { center: true, cls: 'aw-hit' });
          d.addEventListener('mouseenter', () => { scr.btnTip = AW.LEVEL_NAMES[id] || id; });
          d.addEventListener('mouseleave', () => { scr.btnTip = ''; });
        }
      } else {
        hx = x0 + 192;
        hy = y0 + 277;
        const pin = AW.spr('gui/pineza', 0, 0, C0, 421, 327, { center: true, cls: 'aw-hit' });
        pin.addEventListener('mouseenter', () => { scr.btnTip = T('Annecy') || 'Аннет'; });
        pin.addEventListener('mouseleave', () => { scr.btnTip = ''; });
      }
      if (hx >= 0) AW.spr('gui/marker_hero', 0, 0, C0, hx, hy, { center: true });
    },

    REGION: {
      A01_RYNEK: [393, 321], A02_CAFERENE: [379, 295], A03_LOCHY: [621, 188], A04_CMENTARZ: [603, 384], A05_CHURCH: [609, 350],
      A06_ANTYK: [311, 348], A07_PRZEDZAMCZE: [585, 224], A08_KRYPTAMALA: [657, 370], A09_KATAKUMBY: [613, 360], A11_LAS: [375, 130],
      A12_LASNE: [492, 168], A12_LASNW: [442, 140], A12_LASSE: [436, 216], A12_LASSW: [378, 172]
    }
  };
})(globalThis.AW = globalThis.AW || {});
