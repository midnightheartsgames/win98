(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const CARD = { w: 112, h: 64, bar: 18 };
  const MEET = { w: 76, h: 44, bar: 15 };
  const COL_W = 136, PANEL_W = 236, TOP = 62, BOTTOM = 432, ROW_H = 18;
  const LANE_COL = { trail: '#f2c040', comp: '#c890ff', adv: '#60c8f0', meet: '#8fd0a0' };
  const STATUS = { done: ['Пройдено', '#e8d8a0'], active: ['В процессе', '#7ad8f0'], locked: ['Закрыто', '#8088a8'] };
  const STILL_BY_MAP = {
    hs_storage: 'cargo', hs_storage2: 'cargo', j_plains: 'jarilo', j_belobog: 'belobog', j_florist: 'belobog', j_fort: 'fort', j_workshop: 'workshop', j_hotel: 'hotel',
    j_museum: 'belobog', j_backwater: 'alley', j_cable: 'cablecar', j_restricted: 'restricted', j_fissures: 'everwinter', j_everwinter: 'everwinter', j_pathspace: 'pathspace',
    j_pillars: 'pillars', u_boulder: 'boulder', u_clinic: 'clinic', u_club: 'boulder', u_grandhotel: 'grandhotel', u_mine: 'mine', u_camp: 'mine', u_rivet: 'rivet',
    u_rivet2: 'orphan', u_rivet3: 'rivet', u_settle: 'settlement', u_settle1: 'settlement'
  };
  const STILL_BY_WORLD = { herta: 'station', jarilo: 'jarilo', luofu: 'lf_seat', express: 'express', belzerg: 'jarilo' };
  const sources = new Map();

  function stillOf(map, world) {
    if (!map) return STILL_BY_WORLD[world] || 'black';
    if (STILL_BY_MAP[map]) return STILL_BY_MAP[map];
    if (/^express/.test(map)) return 'express';
    if (/^hs_/.test(map)) return 'station';
    if (/^lf_/.test(map) && H.Cine.STILLS['lfs_' + map.slice(3)]) return 'lfs_' + map.slice(3);
    return STILL_BY_WORLD[world] || 'black';
  }

  function sourceOf(n, game) {
    if (sources.has(n.id)) return sources.get(n.id);
    let cv = null;
    if (n.thumb && H.Cine && H.Cine.frame) cv = H.Cine.frame(n.thumb.cine, n.thumb.shot, n.thumb.t, game);
    if (!cv) {
      cv = G.mkCanvas(320, 240);
      const g = cv.getContext('2d');
      if (!H.Cine || !H.Cine.still(g, stillOf(n.area, n.world), 320, 240, 0, game)) { g.fillStyle = '#20284a'; g.fillRect(0, 0, 320, 240); }
      const sp = n.face && H.SPEAKERS[n.face];
      if (sp && (sp.look || sp.char || H.CHARS[n.face])) G.drawPortrait(g, G.lookOf(n.face, game), 196, 70, 120);
    }
    sources.set(n.id, cv);
    return cv;
  }

  function drawThumb(c, n, game, x, y, w, h, hidden) {
    if (hidden) {
      const gr = c.createLinearGradient(x, y, x, y + h);
      gr.addColorStop(0, '#1a1f44'); gr.addColorStop(1, '#0a0c22');
      c.fillStyle = gr; c.fillRect(x, y, w, h);
      for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(140,150,220,' + (0.05 + i * 0.01) + ')'; c.fillRect(x + ((i * 37) % w), y + ((i * 23) % h), 2, 2); }
      return;
    }
    const cv = sourceOf(n, game), sh = Math.round(320 * h / w), sy = Math.max(0, Math.round((240 - sh) / 2));
    const was = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    c.drawImage(cv, 0, sy, 320, Math.min(240, sh), x, y, w, h);
    c.imageSmoothingEnabled = was;
  }

  function chapterTitle(ch) {
    for (const a of H.GUIDE_ACTS) for (const [id, part] of a.parts) if (id === ch) return part + ' · ' + H.MISSION_CHAPTERS[ch].name;
    const d = H.MISSION_CHAPTERS[ch];
    return d ? d.label : ch;
  }

  const baseUpdate = H.UI.prototype.update;

  Object.assign(H.UI.prototype, {
    update(dt) {
      baseUpdate.call(this, dt);
      const g = this.game;
      if (!g || this.mode !== 'field' || this.screens.length || this.dlg || this.toasts.length || g.guest || g.replay || g.busy() || g.cg) return;
      if (g.atlasOpen() && !g.atlasState().noted) this.openAtlasNotice();
    },

    openAtlasNotice() {
      const ui = this, g = this.game;
      g.atlasState().noted = true;
      const lines = this.wrap('Книга под шестерёнкой открывает карту пройденных миссий и встреч. Любую сцену можно пересмотреть и ответить в ней иначе: прохождение от этого не изменится.', 330, 11);
      this.push({
        draw(c) {
          const x = W / 2 - 220, y = 130, w = 440, h = 120 + lines.length * 15;
          ui.win(x, y, w, h, { title: 'Новое в телефоне' });
          G.menuIcon(c, 'atlas', x + 22, y + 24, 48, C.brassHi);
          ui.text('Атлас переплетения судеб', x + 86, y + 24, { size: 17, bold: true, serif: true, col: C.gold });
          lines.forEach((l, i) => ui.text(l, x + 86, y + 50 + i * 15, { size: 11 }));
          ui.button(x + 60, y + h - 44, 150, 26, 'Открыть атлас', () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0, bold: true, icon: 'atlas' });
          ui.button(x + w - 210, y + h - 44, 150, 26, 'Позже', () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1 });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'back') ui.pop();
          if (k === 'ok') { ui.screens.pop(); if (this.sel === 0) ui.openAtlas(); else ui.sfx('cancel'); }
        }
      });
    },

    openAtlas(nodeId, beatId, o = {}) {
      const ui = this, g = this.game;
      if (!g || !g.atlasOpen()) { this.toast('«Атлас» доступно после знакомства с Экспрессом.'); this.sfx('deny'); return null; }
      const worlds = () => g.atlasWorlds();
      const at = nodeId || g.atlasState().at;
      const atNode = at ? g.atlasNode(at) : null;
      const startWorld = atNode && atNode.visible ? atNode.world : (worlds().find(w => w.open) || worlds()[0]).id;
      const scr = this.push({
        full: true, atlas: true,
        world: startWorld, sel: null, focus: 'graph', beat: 0, cam: 0, camTo: 0, follow: true, fresh: new Set(o.fresh || []), sc: { top: 0 },
        layout() { return g.atlasLayout(this.world); },
        node() { return this.sel ? g.atlasNode(this.sel) : null; },
        gx() { return ui.left + 12; },
        gw() { return ui.right - PANEL_W - 8 - this.gx(); },
        laneY(L, lane) { const i = L.lanes.indexOf(lane), n = L.lanes.length, gap = Math.min(96, (BOTTOM - TOP - 36) / Math.max(1, n)); return TOP + 30 + i * gap; },
        nodeX(L, id) { return this.gx() + 16 + L.pos[id].col * COL_W - this.cam; },
        select(id, quiet) {
          if (!id) return;
          this.sel = id;
          this.follow = true;
          this.beat = 0;
          this.sc = { top: 0 };
          g.atlasMark(id);
          g.atlasState().at = id;
          if (!quiet) ui.sfx('select');
        },
        setWorld(id) {
          if (id === this.world) return;
          this.world = id;
          this.focus = 'graph';
          const L = this.layout();
          this.sel = null;
          this.select(this.initial(L), true);
          this.cam = this.camTo = 0;
          ui.sfx('select');
        },
        initial(L) {
          const open = L.nodes.filter(n => n.status !== 'locked' || n.kind === 'meet');
          const trail = open.filter(n => n.lane === 'trail');
          const pick = (trail.length ? trail : open).pop() || L.nodes[0];
          return pick ? pick.id : null;
        },
        move(dx, dy) {
          const L = this.layout();
          if (!L.nodes.length) return;
          if (!this.sel || !L.pos[this.sel]) { this.select(L.nodes[0].id); return; }
          const p = L.pos[this.sel];
          if (dx) {
            const lane = L.byLane[p.lane].slice().sort((a, b) => L.pos[a].col - L.pos[b].col), i = lane.indexOf(this.sel);
            const next = lane[i + dx];
            if (next) this.select(next);
            return;
          }
          const li = L.lanes.indexOf(p.lane), lane = L.lanes[li + dy];
          if (!lane) return;
          const best = L.byLane[lane].slice().sort((a, b) => Math.abs(L.pos[a].col - p.col) - Math.abs(L.pos[b].col - p.col) || L.pos[a].col - L.pos[b].col)[0];
          if (best) this.select(best);
        },
        chapterJump(d) {
          const L = this.layout(), n = this.node();
          const list = L.chapters.filter(ch => ch.lane === 'trail').length ? L.chapters.filter(ch => ch.lane === 'trail') : L.chapters;
          if (!list.length) return;
          const cur = n && n.ch ? list.findIndex(ch => ch.ch === n.ch) : -1;
          const target = list[Math.max(0, Math.min(list.length - 1, (cur < 0 ? 0 : cur) + d))];
          if (target) this.select(target.first);
        },
        play(beat) {
          const n = this.node();
          if (!n) return;
          if (n.kind === 'mission' && n.status === 'locked') { ui.toast(n.need); ui.sfx('deny'); return; }
          if (beat) {
            const b = n.beats.find(x => x.id === beat);
            if (!b || b.state === 'unseen') { ui.toast('Эпизод ещё не встречался.'); ui.sfx('deny'); return; }
          } else if (!n.beats.some(b => b.state === 'seen')) { ui.toast('Здесь пока нечего пересматривать'); ui.sfx('deny'); return; }
          const id = n.id;
          ui.replayBegin(id, beat || null, (node, fresh) => ui.openAtlas(node || id, fresh[0] || beat || null, { fresh }));
        },
        tick(dt) {
          const L = this.layout();
          if (this.follow && this.sel && L.pos[this.sel]) {
            const w = L.pos[this.sel].lane === 'meet' ? MEET.w : CARD.w;
            this.camTo = 16 + L.pos[this.sel].col * COL_W + w / 2 - this.gw() / 2;
          }
          const max = Math.max(0, 32 + L.cols * COL_W - this.gw());
          this.camTo = Math.max(0, Math.min(max, this.camTo));
          this.cam += (this.camTo - this.cam) * Math.min(1, dt * 10);
          if (Math.abs(this.camTo - this.cam) < 0.5) this.cam = this.camTo;
        },
        draw(c) {
          const gr = c.createLinearGradient(0, 0, 0, HGT);
          gr.addColorStop(0, '#0a1030'); gr.addColorStop(1, '#03050f');
          c.fillStyle = gr; c.fillRect(ui.left, 0, ui.vw, HGT);
          for (let i = 0; i < 70; i++) { const x = ui.left + ((i * 97) % ui.vw), y = (i * 53) % HGT; c.fillStyle = 'rgba(200,210,255,' + (0.08 + (i % 5) * 0.04) + ')'; c.fillRect(x, y, 1, 1); }
          c.strokeStyle = 'rgba(201,164,92,0.25)'; c.lineWidth = 1;
          c.beginPath(); c.arc(ui.left - 220, HGT / 2, 330, -0.9, 0.9); c.stroke();
          G.menuIcon(c, 'atlas', ui.left + 12, 8, 22, C.brassHi);
          ui.text('Атлас переплетения судеб', ui.left + 40, 11, { size: 14, bold: true, serif: true, col: C.gold });
          ui.closeBtn(ui.right - 32, 8, () => this.key('back'));
          ui.button(ui.right - 148, 8, 108, 22, 'Кинозал', () => ui.openCinema(), { size: 11, icon: 'archive' });
          this.drawTabs(c);
          const L = this.layout(), wd = worlds().find(w => w.id === this.world);
          if (!wd.open) {
            ui.text('Мир ещё не открыт', ui.left + (ui.vw - PANEL_W) / 2, 200, { align: 'center', size: 15, bold: true, serif: true, col: C.sub });
            ui.text(g.atlasWorldNeed(this.world), ui.left + (ui.vw - PANEL_W) / 2, 226, { align: 'center', size: 11, col: C.dim });
          } else this.drawGraph(c, L);
          this.drawStrip(c, L);
          this.drawPanel(c, wd.open ? this.node() : null);
          const hints = this.focus === 'beats' ? [['↑↓', 'Эпизод'], ['Enter', 'Пересмотреть'], ['Tab', 'К узлам'], ['Esc', 'Назад']] : [['←→', 'Узел'], ['↑↓', 'Дорожка'], ['Q/E', 'Мир'], ['PgUp/PgDn', 'Глава'], ['Enter', 'Пересмотреть'], ['Tab', 'Эпизоды'], ['K', 'Кинозал'], ['Esc', 'Закрыть']];
          ui.hints(hints, ui.left + 14, HGT - 18);
        },
        drawTabs(c) {
          let x = ui.left + 12;
          const list = worlds();
          list.forEach(w => {
            const label = w.tab, bw = Math.round(ui.measure(label, 10, true) + 22);
            ui.button(x, 34, bw, 20, label, () => this.setWorld(w.id), { size: 10, active: w.id === this.world, disabled: !w.open });
            x += bw + 4;
          });
          ui.text('Q / E', x + 6, 39, { size: 9, col: C.dim });
        },
        drawGraph(c, L) {
          const gx = this.gx(), gw = this.gw();
          ui.hit(gx, TOP, gw, BOTTOM - TOP, (b, p) => {
            if (!p) return;
            const x0 = p.x, cam0 = this.camTo;
            this.follow = false;
            ui.drag = { move: q => { this.camTo = cam0 - (q.x - x0); } };
          });
          ui.wheelZone(gx, TOP, gw, BOTTOM - TOP, d => { this.follow = false; this.camTo += d * COL_W; });
          c.save();
          c.beginPath(); c.rect(gx, TOP, gw, BOTTOM - TOP); c.clip();
          for (const ch of L.chapters) {
            const ys = this.laneY(L, ch.lane) - 13, x1 = gx + 16 + ch.from * COL_W - this.cam, x2 = gx + 16 + ch.to * COL_W - this.cam + (ch.lane === 'meet' ? MEET.w : CARD.w);
            c.fillStyle = 'rgba(201,164,92,0.45)'; c.fillRect(x1, ys + 10, x2 - x1, 1); c.fillRect(x1, ys + 10, 1, 4); c.fillRect(x2 - 1, ys + 10, 1, 4);
            const done = L.nodes.filter(n => n.ch === ch.ch && n.status === 'done').length, all = L.nodes.filter(n => n.ch === ch.ch).length;
            const lx = Math.max(x1, gx + 4), room = x2 - lx - 34;
            if (room > 40) {
              ui.text(ui.clip(chapterTitle(ch.ch), room, 9, true), lx + 2, ys - 2, { size: 9, bold: true, col: LANE_COL[ch.lane] });
              ui.text(done + '/' + all, x2 - 2, ys - 2, { size: 9, bold: true, align: 'right', col: LANE_COL[ch.lane] });
            }
          }
          if (L.byLane.meet) {
            const wd = worlds().find(w => w.id === this.world), y = this.laneY(L, 'meet') - 15;
            ui.text('Встречи · ' + wd.meetsSeen + ' из ' + wd.meetsTotal, gx + 6, y, { size: 9, bold: true, col: LANE_COL.meet });
          }
          this.drawLinks(c, L);
          for (const n of L.nodes) this.drawCard(c, L, n);
          c.restore();
        },
        drawLinks(c, L) {
          const line = (x1, y1, x2, y2, col) => { c.fillStyle = col; if (y1 === y2) c.fillRect(Math.min(x1, x2), y1, Math.abs(x2 - x1), 1); else c.fillRect(x1, Math.min(y1, y2), 1, Math.abs(y2 - y1)); };
          const trail = (L.byLane.trail || []).slice().sort((a, b) => L.pos[a].col - L.pos[b].col);
          for (let i = 1; i < trail.length; i++) {
            const y = this.laneY(L, 'trail') + CARD.h / 2;
            line(this.nodeX(L, trail[i - 1]) + CARD.w, y, this.nodeX(L, trail[i]), y, 'rgba(242,220,154,0.55)');
          }
          for (const n of L.nodes) {
            if (n.kind !== 'mission' || n.lane === 'trail') continue;
            const lane = (L.byLane[n.lane] || []).slice().sort((a, b) => L.pos[a].col - L.pos[b].col), i = lane.indexOf(n.id), prev = i > 0 ? g.atlasNode(lane[i - 1]) : null;
            const y = this.laneY(L, n.lane) + CARD.h / 2, x = this.nodeX(L, n.id);
            if (prev && prev.ch === n.ch) { line(this.nodeX(L, prev.id) + CARD.w, y, x, y, 'rgba(200,180,255,0.5)'); continue; }
            if (!n.after || !L.pos[n.after]) continue;
            const ax = this.nodeX(L, n.after) + CARD.w / 2, ay = this.laneY(L, 'trail'), below = this.laneY(L, n.lane) > ay;
            const sy = below ? ay + CARD.h : ay;
            line(ax, sy, ax, y, 'rgba(242,220,154,0.4)');
            line(ax, y, x, y, 'rgba(242,220,154,0.4)');
          }
        },
        drawCard(c, L, n) {
          const meet = n.kind === 'meet', S = meet ? MEET : CARD, x = Math.round(this.nodeX(L, n.id)), y = Math.round(this.laneY(L, n.lane) + (meet ? 10 : 0));
          if (x > this.gx() + this.gw() + 4 || x + S.w < this.gx() - 4) return;
          const on = n.id === this.sel, hidden = !n.known, locked = n.status === 'locked' && !meet;
          c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, S.w + 2, S.h + 2);
          drawThumb(c, n, g, x, y, S.w, S.h - S.bar, hidden);
          if (locked) { c.fillStyle = 'rgba(4,6,20,0.55)'; c.fillRect(x, y, S.w, S.h - S.bar); }
          const by = y + S.h - S.bar;
          c.fillStyle = locked ? '#1c1e30' : '#10142e'; c.fillRect(x, by, S.w, S.bar);
          c.fillStyle = locked ? '#4a4c60' : LANE_COL[n.lane]; c.fillRect(x, by, 4, S.bar);
          const name = hidden ? '???' : n.name;
          ui.text(ui.clip(name, S.w - (n.status === 'done' ? 22 : 10), meet ? 8 : 9, on), x + 7, by + (meet ? 3 : 4), { size: meet ? 8 : 9, bold: on, col: locked ? C.dim : C.cream });
          if (n.status === 'done') { c.strokeStyle = C.cream; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + S.w - 13, by + S.bar / 2); c.lineTo(x + S.w - 10, by + S.bar / 2 + 3); c.lineTo(x + S.w - 5, by + S.bar / 2 - 3); c.stroke(); c.lineWidth = 1; }
          if (locked) G.lockIcon(c, x + S.w / 2 - 6, y + (S.h - S.bar) / 2 - 7, true);
          if (n.fresh) ui.newMark(x + S.w - 4, y + 4);
          c.strokeStyle = on ? C.brassHi : locked ? '#3a3c52' : 'rgba(242,220,154,0.5)'; c.lineWidth = on ? 2 : 1;
          c.strokeRect(x + 0.5, y + 0.5, S.w - 1, S.h - 1); c.lineWidth = 1;
          if (on) { c.fillStyle = C.brassHi; for (const [cx, cy, dx, dy] of [[x - 5, y - 5, 1, 1], [x + S.w + 4, y - 5, -1, 1], [x - 5, y + S.h + 4, 1, -1], [x + S.w + 4, y + S.h + 4, -1, -1]]) { c.fillRect(cx, cy, 8 * dx || 1, 2 * dy || 1); c.fillRect(cx, cy, 2 * dx || 1, 8 * dy || 1); } }
          ui.hit(x, y, S.w, S.h, () => { if (this.sel === n.id) this.play(null); else { this.focus = 'graph'; this.select(n.id); } });
        },
        drawStrip(c, L) {
          const gx = this.gx(), gw = this.gw(), y = BOTTOM + 8, list = L.chapters;
          if (!list.length) return;
          const total = list.reduce((s, ch) => s + ch.to - ch.from + 1, 0), n = this.node();
          let x = gx;
          list.forEach(ch => {
            const w = Math.max(18, Math.round((gw - list.length * 3) * (ch.to - ch.from + 1) / total)), on = n && n.ch === ch.ch;
            c.fillStyle = on ? LANE_COL[ch.lane] : 'rgba(255,255,255,0.12)'; c.fillRect(x, y, w, 4);
            ui.hit(x, y - 4, w, 12, () => this.select(ch.first));
            x += w + 3;
          });
        },
        drawPanel(c, n) {
          const px = ui.right - PANEL_W, pw = PANEL_W - 10, py = TOP - 4, ph = BOTTOM - py + 14;
          ui.win(px, py, pw, ph, { top: '#141a44', bottom: '#080b22', alpha: 0.96 });
          if (!n) { ui.text('Выберите узел', px + pw / 2, py + 40, { align: 'center', size: 11, col: C.dim }); return; }
          const x = px + 12, w = pw - 24;
          let y = py + 12;
          const [st, scol] = n.kind === 'meet' ? ['Встреча', LANE_COL.meet] : STATUS[n.status];
          const sw = Math.round(ui.measure(st, 10, true) + 14);
          c.fillStyle = scol; c.fillRect(x, y, sw, 15);
          ui.text(st, x + 7, y + 2, { size: 10, bold: true, col: '#141210', shadow: false });
          if (n.fresh) ui.text('Новое', x + sw + 8, y + 2, { size: 10, bold: true, col: C.ok });
          y += 21;
          const title = ui.wrap(n.known ? n.name : '???', w, 14, true, true).slice(0, 2);
          title.forEach((l, i) => ui.text(l, x, y + i * 17, { size: 14, bold: true, serif: true, col: C.gold }));
          y += title.length * 17 + 2;
          c.fillStyle = C.brassDk; c.fillRect(x, y, w, 1);
          y += 5;
          const sub = n.kind === 'meet' ? 'Встречи · ' + (worlds().find(v => v.id === n.world) || {}).name : chapterTitle(n.ch);
          ui.text(ui.clip(sub, w, 10), x, y, { size: 10, col: LANE_COL[n.lane] });
          y += 16;
          c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, w + 2, 98);
          drawThumb(c, n, g, x, y, w, 96, !n.known);
          if (n.status === 'locked' && n.kind !== 'meet') G.lockIcon(c, x + w / 2 - 6, y + 40, true);
          y += 102;
          const text = n.status === 'locked' && n.kind !== 'meet' ? n.need : n.kind === 'meet' ? 'Побочные сцены этого места: разговоры, находки и случайные знакомства.' : n.desc;
          const all = ui.wrap(text, w, 10), lines = all.slice(0, n.status === 'locked' ? 4 : 3);
          if (all.length > lines.length) lines[lines.length - 1] = ui.clip(lines[lines.length - 1] + '…', w - 6, 10).replace(/…?$/, '…');
          lines.forEach((l, i) => ui.text(l, x, y + i * 13, { size: 10, col: n.status === 'locked' ? C.sub : C.cream }));
          y += Math.max(1, lines.length) * 13 + 4;
          if (n.status === 'locked' && n.kind !== 'meet') return;
          const cast = n.cast.filter(k => H.SPEAKERS[k] && (H.SPEAKERS[k].look || H.SPEAKERS[k].char || H.CHARS[k])).slice(0, 5);
          cast.forEach((k, i) => ui.portraitCard(c, G.lookOf(k, g), x + i * 30, y, 26));
          if (cast.length) y += 32;
          ui.text('Эпизоды ' + n.got + '/' + n.total, x, y, { size: 10, bold: true, col: C.sub });
          y += 15;
          const rows = Math.max(1, Math.floor((py + ph - 40 - y) / ROW_H));
          this.drawBeats(c, n, x, y, w, rows);
          const can = n.beats.some(b => b.state === 'seen');
          ui.button(x, py + ph - 34, w, 24, 'Пересмотреть', () => this.play(this.focus === 'beats' && n.beats[this.beat] ? n.beats[this.beat].id : null), { active: can && this.focus === 'graph', disabled: !can, size: 12 });
        },
        drawBeats(c, n, x, y, w, rows) {
          const list = n.beats, sel = Math.min(this.beat, list.length - 1), top = ui.listTop(this.sc, sel, list.length, rows);
          ui.wheelZone(x, y, w, rows * ROW_H, d => { this.sc.top += d; });
          for (let i = top; i < Math.min(list.length, top + rows); i++) {
            const b = list[i], yy = y + (i - top) * ROW_H, on = this.focus === 'beats' && i === sel;
            if (on) { c.fillStyle = 'rgba(242,220,154,0.22)'; c.fillRect(x, yy, w, ROW_H - 2); c.fillStyle = C.brassHi; c.fillRect(x, yy, 2, ROW_H - 2); }
            const mark = b.state === 'seen' ? '✓' : b.state === 'branch' ? '⑂' : '·';
            const label = b.state === 'seen' ? g.fill(b.id) : b.state === 'branch' ? 'Другой выбор в «' + g.fill(b.from) + '»' : '???';
            const col = this.fresh.has(b.id) ? C.ok : b.state === 'seen' ? C.cream : b.state === 'branch' ? '#c8b0ff' : C.dim;
            ui.text(mark, x + 6, yy + 2, { size: 10, bold: true, col });
            ui.text(ui.clip(label, w - 24, 10, on), x + 20, yy + 2, { size: 10, bold: on, col });
            ui.hit(x, yy, w, ROW_H, () => { if (this.focus === 'beats' && this.beat === i) this.play(b.id); else { this.focus = 'beats'; this.beat = i; ui.sfx('select'); } });
          }
          if (list.length > rows) {
            if (top > 0) ui.diamond(x + w - 5, y - 3, 3, C.brassHi);
            if (top + rows < list.length) ui.diamond(x + w - 5, y + rows * ROW_H, 3, C.brassHi);
          }
        },
        key(k, code) {
          const n = this.node();
          if (code === 'KeyK' && this.focus !== 'beats') { ui.openCinema(); return; }
          if (code === 'KeyQ' || code === 'KeyE') {
            const list = worlds(), i = list.findIndex(w => w.id === this.world);
            this.setWorld(list[(i + (code === 'KeyQ' ? list.length - 1 : 1)) % list.length].id);
            return;
          }
          if (this.focus === 'beats') {
            if (!n) { this.focus = 'graph'; return; }
            if (k === 'up' || k === 'down') { this.beat = (this.beat + (k === 'up' ? n.beats.length - 1 : 1)) % n.beats.length; ui.sfx('select'); return; }
            if (k === 'ok') { const b = n.beats[this.beat]; this.play(b ? b.id : null); return; }
            if (k === 'back' || code === 'Tab' || k === 'left') { this.focus = 'graph'; ui.sfx('cancel'); return; }
            return;
          }
          if (k === 'back') { ui.pop(); return; }
          if (code === 'Tab') { if (n && n.beats.length && (n.status !== 'locked' || n.kind === 'meet')) { this.focus = 'beats'; this.beat = 0; ui.sfx('select'); } else ui.sfx('deny'); return; }
          if (code === 'PageUp' || code === 'PageDown') { this.chapterJump(code === 'PageUp' ? -1 : 1); return; }
          if (k === 'left' || k === 'right') { this.move(k === 'left' ? -1 : 1, 0); return; }
          if (k === 'up' || k === 'down') { this.move(0, k === 'up' ? -1 : 1); return; }
          if (k === 'ok') this.play(null);
        }
      });
      {
        const L = scr.layout();
        scr.select(nodeId && L.pos[nodeId] ? nodeId : at && L.pos[at] ? at : scr.initial(L), true);
        const n = scr.node();
        if (n && beatId) { const i = n.beats.findIndex(b => b.id === beatId); if (i >= 0) { scr.focus = 'beats'; scr.beat = i; } }
      }
      return scr;
    }
  });

  H.atlasResetThumbs = () => sources.clear();
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
