(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const TABS = [
    { id: 'all', label: 'Все миссии', icon: 'mission', col: '#f1ead8' },
    { id: 'trail', label: 'Миссии Освоения' },
    { id: 'comp', label: 'Миссии компаньона' },
    { id: 'adv', label: 'Миссии приключения' }
  ];
  const ROW = { head: 22, chap: 40, m: 46 };
  const LIST = { x: 26, y: 70, w: 236, h: 352 };
  const EMPTY = {
    all: 'Активных миссий нет. Новые миссии приходят в сообщениях и от жителей.',
    trail: 'Путь Освоения на этой планете пройден. Следующая глава впереди.',
    comp: 'Спутники пока ни о чём не просят. Загляните к ним, они напишут сами.',
    adv: 'Приключений пока нет. Жители иногда просят о помощи, стоит заглядывать к ним.'
  };
  const tabOf = id => TABS.find(t => t.id === id);
  const typeOf = id => H.MISSION_TYPES[id];

  Object.assign(H.UI.prototype, {
    questIcon(id) {
      const q = H.QUESTS[id];
      return typeOf((q && q.type) || 'comp').map;
    },

    missionRows(tab) {
      const g = this.game, list = g.missionList().filter(m => tab === 'all' || m.type === tab), out = [];
      const chOrder = Object.keys(H.MISSION_CHAPTERS);
      for (const type of H.MISSION_TYPE_ORDER) {
        const ms = list.filter(m => m.type === type);
        if (!ms.length) continue;
        out.push({ kind: 'head', type, h: ROW.head });
        const chs = [...new Set(ms.map(m => m.ch || ''))].sort((a, b) => chOrder.indexOf(a) - chOrder.indexOf(b));
        for (const ch of chs) {
          if (ch && H.MISSION_CHAPTERS[ch]) out.push({ kind: 'chap', type, ch, h: ROW.chap });
          for (const m of ms.filter(x => (x.ch || '') === ch)) out.push({ kind: 'm', type, m, h: ROW.m });
        }
      }
      let y = 0;
      for (const r of out) { r.y = y; y += r.h + (r.kind === 'm' ? 4 : 2); }
      return out;
    },

    missionGo(m) {
      const g = this.game;
      if (!m || g.state.su || !m.map) return null;
      const area = this.navArea(m.map);
      if (!area || !g.areaOpen(area)) return null;
      return () => this.openNav(null, m.id === 'main' ? { area: m.map, goal: true } : { area: m.map, quest: m.id });
    },

    openMission() {
      const ui = this, g = this.game;
      const s = this.push({
        full: true, tab: 0, selId: null, scroll: 0,
        rows() { return ui.missionRows(TABS[this.tab].id); },
        ms() { return this.rows().filter(r => r.kind === 'm'); },
        cur() {
          const ms = this.ms();
          if (!ms.length) return null;
          const hit = ms.find(r => r.m.id === this.selId) || ms[0];
          this.selId = hit.m.id;
          return hit;
        },
        move(d) {
          const ms = this.ms();
          if (!ms.length) return;
          const i = Math.max(0, ms.findIndex(r => r.m.id === this.selId));
          this.selId = ms[(i + d + ms.length) % ms.length].m.id;
          ui.sfx('select');
        },
        setTab(i) {
          this.tab = (i + TABS.length) % TABS.length; this.scroll = 0;
          const ms = this.ms();
          if (!ms.some(r => r.m.id === this.selId)) this.selId = ms.length ? ms[0].m.id : null;
          ui.sfx('select');
        },
        track() {
          const r = this.cur();
          if (!r) { ui.sfx('deny'); return; }
          const tr = g.missionTracked();
          g.trackMission(tr && tr.id === r.m.id ? 'none' : r.m.id);
          ui.sfx('confirm');
        },
        go() {
          const r = this.cur(), fn = r && ui.missionGo(r.m);
          if (!fn) { ui.sfx('deny'); if (r) ui.toast(g.state.su ? 'Карта недоступна в Виртуальной вселенной.' : 'Место миссии пока не открыто на карте.'); return; }
          fn();
        },
        draw(c) {
          ui.fullBg(c);
          c.fillStyle = 'rgba(3,4,16,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.drawMissionHeader(c, this);
          const cur = this.cur();
          ui.drawMissionList(c, this, cur);
          ui.drawMissionCard(c, this, cur);
          ui.hints([['↑↓', 'Выбор'], ['Q E', 'Раздел'], ['Enter', 'Отслеживать'], ['M', 'Перейти'], ['Esc', 'Назад']], 16, HGT - 20);
        },
        key(k, code) {
          if (k === 'back') { ui.pop(); return; }
          if (code === 'KeyQ' || k === 'left') { this.setTab(this.tab - 1); return; }
          if (code === 'KeyE' || k === 'right') { this.setTab(this.tab + 1); return; }
          if (code === 'KeyM') { this.go(); return; }
          if (k === 'up') { this.move(-1); return; }
          if (k === 'down') { this.move(1); return; }
          if (k === 'ok') this.track();
        }
      });
      const tr = g.missionTracked();
      s.selId = tr ? tr.id : null;
      return s;
    },

    drawMissionHeader(c, s) {
      const g = this.game, tab = TABS[s.tab];
      G.menuIcon(c, 'mission', 16, 12, 34, C.brassHi);
      this.text('Миссии', 58, 12, { size: 11, col: C.sub });
      this.text(tab.label, 58, 26, { size: 17, bold: true, serif: true, col: C.cream });
      const list = g.missionList(), cx = W / 2 + 64;
      TABS.forEach((t, i) => {
        const x = cx + (i - 1.5) * 54, y = 30, on = i === s.tab, ty = typeOf(t.id), col = ty ? ty.col : t.col;
        c.fillStyle = on ? 'rgba(241,234,216,0.92)' : 'rgba(10,14,40,0.75)';
        c.beginPath(); c.arc(x, y, 19, 0, Math.PI * 2); c.fill();
        c.strokeStyle = on ? col : 'rgba(154,166,208,0.45)'; c.lineWidth = 2; c.stroke(); c.lineWidth = 1;
        G.menuIcon(c, ty ? ty.icon : t.icon, x - 13, y - 13, 26, on ? (ty ? ty.dim : '#3a3020') : col);
        if (on) { c.fillStyle = C.brassHi; c.fillRect(x - 22, y + 24, 44, 2); }
        if (list.some(m => m.isNew && (t.id === 'all' || m.type === t.id))) this.badge(x + 15, y - 14);
        this.hit(x - 20, y - 20, 40, 40, () => s.setTab(i));
      });
      this.closeBtn(W - 36, 16, () => s.key('back'));
      c.fillStyle = 'rgba(201,164,92,0.45)'; c.fillRect(16, 62, W - 32, 1);
    },

    drawMissionList(c, s, cur) {
      const g = this.game, rows = s.rows(), { x, y, w, h } = LIST, tr = g.missionTracked();
      const total = rows.length ? rows[rows.length - 1].y + rows[rows.length - 1].h : 0;
      if (cur) {
        if (cur.y < s.scroll) s.scroll = Math.max(0, cur.y - 26);
        if (cur.y + cur.h > s.scroll + h) s.scroll = cur.y + cur.h - h;
      }
      s.scroll = Math.max(0, Math.min(s.scroll, Math.max(0, total - h)));
      c.fillStyle = 'rgba(201,164,92,0.35)'; c.fillRect(x + w + 6, y, 1, h);
      if (!rows.length) {
        this.wrap(EMPTY[TABS[s.tab].id], w - 16, 11).forEach((l, i) => this.text(l, x + 8, y + 12 + i * 15, { size: 11, col: C.dim }));
        return;
      }
      c.save();
      c.beginPath(); c.rect(x - 22, y, w + 24, h); c.clip();
      for (const r of rows) {
        const ry = y + r.y - s.scroll, ty = typeOf(r.type);
        if (ry + r.h < y || ry > y + h) continue;
        if (r.kind === 'head') {
          c.fillStyle = 'rgba(120,128,160,0.35)'; c.fillRect(x, ry, w, r.h);
          c.fillStyle = ty.col; c.fillRect(x, ry, 18, r.h);
          G.menuIcon(c, ty.icon, x + 2, ry + 3, 16, '#10142a');
          this.text(ty.name, x + 24, ry + 4, { size: 12, bold: true, col: C.cream });
        } else if (r.kind === 'chap') {
          const ch = H.MISSION_CHAPTERS[r.ch], gr = c.createLinearGradient(x, 0, x + w, 0);
          gr.addColorStop(0, G.dark(ty.dim, 0.2)); gr.addColorStop(1, 'rgba(20,22,40,0.85)');
          c.fillStyle = gr; c.fillRect(x, ry, w, r.h);
          c.fillStyle = ty.col; c.fillRect(x, ry, 4, r.h);
          c.strokeStyle = 'rgba(241,234,216,0.18)'; c.strokeRect(x + 0.5, ry + 0.5, w - 1, r.h - 1);
          G.menuIcon(c, ty.icon, x + w - 36, ry + 4, 32, '#34364e');
          this.text(ch.label, x + 12, ry + 4, { size: 10, col: ty.col });
          this.text(this.clipText(ch.name, w - 50, 12, true, true), x + 12, ry + 20, { size: 12, bold: true, serif: true, col: C.cream });
        } else {
          const m = r.m, on = !!cur && cur.m.id === m.id, face = m.face && G.lookOf(m.face, g);
          c.fillStyle = on ? 'rgba(241,234,216,0.9)' : 'rgba(10,12,30,0.72)'; c.fillRect(x + 8, ry, w - 8, r.h);
          c.fillStyle = on ? ty.col : ty.dim; c.fillRect(x + 8, ry, 3, r.h);
          if (on) { c.strokeStyle = C.brassHi; c.strokeRect(x + 8.5, ry + 0.5, w - 9, r.h - 1); }
          G.menuIcon(c, ty.icon, x + 15, ry + 5, 16, on ? ty.dim : ty.col);
          const tw = w - (face ? 82 : 42), ns = this.measure(m.name, 12, true) > tw ? 11 : 12;
          this.text(this.clipText(m.name, tw, ns, true), x + 34, ry + 6, { size: ns, bold: true, col: on ? '#16120c' : C.cream, shadow: !on });
          G.mapIcon(c, 'pin', x + 15, ry + 26, 10);
          this.text(this.clipText(m.place || '???', w - (face ? 56 : 26) - 4, 10), x + 28, ry + 27, { size: 10, col: on ? G.dark(ty.dim, 0.1) : ty.col, shadow: !on });
          if (face) this.portraitCard(c, face, x + w - 38, ry + 6, 34, { border: on ? ty.dim : ty.col });
          if (m.isNew) this.missionNewTag(c, x + w - 42, ry + 33);
          if (tr && tr.id === m.id) {
            const bx = x - 12, by = ry + r.h / 2;
            this.diamond(bx, by, 7 + Math.sin(this.t * 4), ty.col, '#10142a');
            this.diamond(bx, by, 3, '#10142a');
          }
          this.hit(x + 8, ry, w - 8, r.h, () => { if (s.selId === m.id) s.track(); else { s.selId = m.id; this.sfx('select'); } });
        }
      }
      c.restore();
      if (s.scroll > 0) this.diamond(x + w / 2, y - 3, 3, C.brassHi);
      if (s.scroll < total - h) this.diamond(x + w / 2, y + h + 3, 3, C.brassHi);
    },

    missionNewTag(c, x, y) {
      c.fillStyle = '#1a1208'; c.fillRect(x - 1, y - 1, 40, 14);
      const gr = c.createLinearGradient(0, y, 0, y + 12);
      gr.addColorStop(0, '#ffe08a'); gr.addColorStop(1, '#d89a2a');
      c.fillStyle = gr; c.fillRect(x, y, 38, 12);
      this.text('Новое', x + 19, y + 1, { size: 9, bold: true, align: 'center', col: '#3a2008', shadow: false });
    },

    clipText(str, w, size, bold, serif) {
      if (this.measure(str, size, bold, serif) <= w) return str;
      let s = str;
      while (s.length > 1 && this.measure(s + '...', size, bold, serif) > w) s = s.slice(0, -1);
      return s.trimEnd() + '...';
    },

    drawMissionCard(c, s, cur) {
      const g = this.game, x = 284, w = W - 16 - x;
      if (!cur) return;
      const m = cur.m, ty = typeOf(m.type), tr = g.missionTracked();
      g.seeMission(m.id);
      let y = 72;
      if (m.place) {
        G.mapIcon(c, 'pin', x, y, 12);
        this.text(this.clipText(m.place, w - 18, 11), x + 16, y, { size: 11, col: ty.col });
      }
      y += 18;
      this.wrap(m.name, w, 18).slice(0, 2).forEach(l => { this.text(l, x, y, { size: 18, bold: true, serif: true, col: C.cream }); y += 22; });
      this.text(ty.one + (m.giver ? ' · ' + m.giver : ''), x, y, { size: 10, col: C.sub });
      y += 18;
      const step = this.wrap(m.text || '...', w - 30, 12).slice(0, 3);
      c.fillStyle = 'rgba(8,10,28,0.8)'; c.fillRect(x, y, w, 10 + step.length * 15);
      c.fillStyle = ty.col; c.fillRect(x, y, 2, 10 + step.length * 15);
      this.diamond(x + 12, y + 12, 3.5, ty.col);
      step.forEach((l, i) => this.text(l, x + 22, y + 5 + i * 15, { size: 12, bold: true, col: C.cream }));
      y += 18 + step.length * 15;
      this.wrap(m.desc || '', w, 11).slice(0, 7).forEach(l => { this.text(l, x, y, { size: 11, col: '#c8cce0' }); y += 15; });
      const ry = 330;
      c.fillStyle = 'rgba(201,164,92,0.35)'; c.fillRect(x, ry - 8, w, 1);
      this.diamond(x + w, ry - 7.5, 2.5, C.brass);
      this.text('Награды', x, ry, { size: 12, bold: true, col: C.sub });
      this.drawMissionRewards(c, m, x, ry + 18);
      const tracked = tr && tr.id === m.id, go = this.missionGo(m), bw = Math.floor((w - 10) / 2), by = HGT - 56;
      this.button(x, by, bw, 28, tracked ? 'Не отслеживать' : 'Отслеживать', () => s.track(), { icon: 'nav', size: 11, active: !tracked });
      this.button(x + bw + 10, by, bw, 28, 'Перейти', () => s.go(), { icon: 'nav', size: 12, bold: true, disabled: !go });
    },

    drawMissionRewards(c, m, x, y) {
      const g = this.game, r = m.reward || {}, cells = [];
      if (m.joins) cells.push(['char', m.joins]);
      if (r.jade) cells.push(['item', 'jade', r.jade]);
      if (r.cone) cells.push(['cone', r.cone]);
      for (const [id, n] of Object.entries(r.items || {})) cells.push(['item', id, n]);
      if (r.credits) cells.push(['item', 'credits', r.credits]);
      if (!cells.length) { this.text('Без награды', x, y + 12, { size: 11, col: C.dim }); return; }
      cells.slice(0, 7).forEach((cl, i) => {
        const cx = x + i * 46;
        if (cl[0] === 'item') this.rewardCell(c, cl[1], cl[2], cx, y, 40);
        else if (cl[0] === 'cone') { G.rarityCell(c, cx, y, 40, 40, (H.CONES[cl[1]] || {}).rar || 3); G.drawConeCard(c, cl[1], cx + 6, y + 2, 28, 36, { info: false }); }
        else this.portraitCard(c, G.lookOf(cl[1], g), cx, y, 40, { elem: H.CHARS[cl[1]] && H.CHARS[cl[1]].elem });
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
