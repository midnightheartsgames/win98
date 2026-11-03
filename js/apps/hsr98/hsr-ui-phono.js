(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, C } = H.UI_CONST;

  const BOX = { x: 20, y: 18, w: 600, h: 446 };
  const SHELF = { x: 40, y: 48, size: 76, step: 92, lift: 8 };
  const LIST = { x: 32, y: 168, w: 350, h: 266, rowH: 18, max: 13 };
  const DECK = { x: 400, y: 156, w: 204 };
  const PART_ORDER = ['place', 'battle', 'story'];
  const LENS = {};

  const bare = name => String(name).replace(/^«/, '').replace(/»$/, '');
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  function trackLength(id) {
    const tr = H.TRACKS && H.TRACKS[id];
    if (!tr) return null;
    if (tr.midi) {
      if (!(id in LENS)) {
        LENS[id] = null;
        H.Midi.load(tr.midi).then(song => { LENS[id] = song.loopEnd; }).catch(() => { });
      }
      return LENS[id];
    }
    const t = tr.mel ? tr : H.TRACKS[tr.fallback];
    return t && t.mel ? t.mel.length * 30 / t.bpm : null;
  }

  function albums() { return H.RECORD_ALBUMS.filter(a => H.RECORDS.some(r => r.album === a.id)); }

  function phonoItems(g, album) {
    const rows = g.phonoRows(album), out = [];
    for (const part of PART_ORDER) {
      const list = rows.filter(r => r.rec.part === part);
      if (!list.length) continue;
      out.push({ head: H.RECORD_PARTS[part] });
      out.push(...list);
    }
    return out;
  }

  function disc(c, x, y, col, fresh) {
    c.fillStyle = '#05060e'; c.beginPath(); c.arc(x + 6, y, 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2a2c3e'; c.lineWidth = 1; c.beginPath(); c.arc(x + 6, y, 4, 0, Math.PI * 2); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(x + 6, y, 2, 0, Math.PI * 2); c.fill();
    if (fresh) { c.fillStyle = '#ff5a5a'; c.beginPath(); c.arc(x + 12, y - 5, 2.5, 0, Math.PI * 2); c.fill(); }
  }

  function drawDeck(ui, c, album, spinning) {
    const x = DECK.x, y = DECK.y, cx = x + 74, cy = y + 50, t = ui.t || 0;
    c.fillStyle = '#1a0e08'; c.fillRect(x + 4, y + 4, 196, 96);
    c.fillStyle = '#4a2a18'; c.fillRect(x + 6, y + 6, 192, 92);
    c.fillStyle = '#6a3e22'; c.fillRect(x + 6, y + 6, 192, 3);
    c.fillStyle = C.brass; c.fillRect(x + 6, y + 94, 192, 2);
    c.fillStyle = '#120a06'; c.beginPath(); c.arc(cx, cy, 42, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#0a0b12'; c.beginPath(); c.arc(cx, cy, 38, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#22243a'; c.lineWidth = 1;
    for (const r of [33, 28, 23, 18]) { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke(); }
    const a = spinning ? t * 2.4 : 0;
    c.strokeStyle = 'rgba(200,210,255,0.18)'; c.lineWidth = 2;
    c.beginPath(); c.arc(cx, cy, 30, a, a + 0.7); c.stroke();
    c.beginPath(); c.arc(cx, cy, 30, a + Math.PI, a + Math.PI + 0.7); c.stroke();
    c.lineWidth = 1;
    c.fillStyle = album.col; c.beginPath(); c.arc(cx, cy, 12, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(Math.round(cx + Math.cos(a) * 6) - 1, Math.round(cy + Math.sin(a) * 6) - 1, 3, 3);
    c.fillStyle = '#05060e'; c.beginPath(); c.arc(cx, cy, 2, 0, Math.PI * 2); c.fill();
    const px = x + 168, py = y + 22, tip = spinning ? [cx + 24, cy + 14] : [x + 150, y + 76];
    c.fillStyle = C.brassDk; c.beginPath(); c.arc(px, py, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = C.brassHi; c.beginPath(); c.arc(px, py, 5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = C.brassHi; c.lineWidth = 3; c.beginPath(); c.moveTo(px, py); c.lineTo(tip[0], tip[1]); c.stroke();
    c.lineWidth = 1;
    c.fillStyle = '#c8c4b8'; c.fillRect(tip[0] - 3, tip[1] - 2, 7, 5);
    c.fillStyle = C.brassDk; c.fillRect(x + 150, y + 80, 34, 8);
    c.fillStyle = spinning ? C.ok : C.dim; c.fillRect(x + 154, y + 82, 4, 4);
  }

  function openUi_phono() {
    const ui = this, g = this.game, list = albums();
    g.phonoOpen();
    const current = () => g.state.record || null;
    const nameOf = id => { const r = H.RECORDS.find(x => (x.id || null) === id); return r ? bare(r.name) : ''; };
    const startAlbum = Math.max(0, list.findIndex(a => H.RECORDS.some(r => r.album === a.id && (r.id || null) === current())));
    const s = this.push({
      album: startAlbum, sel: 0, sc: { top: 0, sel: null }, listen: null,
      items() { return phonoItems(g, list[this.album].id); },
      home() {
        const it = this.items();
        let i = it.findIndex(x => !x.head && (x.rec.id || null) === current());
        if (i < 0) i = it.findIndex(x => !x.head && x.ok);
        if (i < 0) i = it.findIndex(x => !x.head);
        this.sel = Math.max(0, i);
        this.sc = { top: 0, sel: null };
      },
      move(d) {
        const it = this.items();
        for (let i = this.sel + d; i >= 0 && i < it.length; i += d) if (!it[i].head) { this.sel = i; ui.sfx('select'); return; }
      },
      turn(d) { this.album = (this.album + d + list.length) % list.length; this.home(); ui.sfx('select'); },
      act(kind) {
        if (kind === 'reset') {
          if (!current()) { ui.sfx('deny'); return; }
          g.setRecord(null); this.listen = null;
          ui.audio.music(g.mapMusic(g.map.def)); ui.sfx('confirm');
          return;
        }
        const it = this.items()[this.sel];
        if (!it || it.head || !it.ok) { ui.sfx('deny'); return; }
        g.hearRecord(it.rec);
        if (kind === 'listen') { this.listen = it.rec; ui.audio.music(it.rec.track); ui.sfx('select'); return; }
        if (current() === (it.rec.id || null)) { ui.sfx('deny'); return; }
        g.setRecord(it.rec.id); this.listen = null;
        ui.audio.music(g.mapMusic(g.map.def)); ui.sfx('confirm');
      },
      draw(c) {
        const items = this.items(), album = list[this.album], it = items[this.sel];
        c.fillStyle = 'rgba(2,2,8,0.6)'; c.fillRect(0, 0, W, H.UI_CONST.HGT);
        ui.win(BOX.x, BOX.y, BOX.w, BOX.h, { title: 'Фонограф' });
        ui.text('Найдено ' + g.records().length + ' из ' + H.RECORDS.length, BOX.x + BOX.w - 40, BOX.y + 12, { align: 'right', size: 11, col: C.sub });
        ui.closeBtn(BOX.x + BOX.w - 30, BOX.y + 8, () => ui.pop());
        c.fillStyle = '#2a180c'; c.fillRect(BOX.x + 12, SHELF.y + SHELF.size + SHELF.lift, BOX.w - 24, 6);
        c.fillStyle = '#5a3a1e'; c.fillRect(BOX.x + 12, SHELF.y + SHELF.size + SHELF.lift, BOX.w - 24, 1);
        list.forEach((a, i) => {
          const on = i === this.album, x = SHELF.x + i * SHELF.step, y = SHELF.y + (on ? 0 : SHELF.lift), n = SHELF.size;
          const rows = g.phonoRows(a.id);
          if (on) {
            const vx = x + n - 6, vy = y + n / 2, vr = n / 2 - 6;
            c.fillStyle = '#05060e'; c.beginPath(); c.arc(vx, vy, vr, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#4a4e6a'; c.beginPath(); c.arc(vx, vy, vr, 0, Math.PI * 2); c.stroke();
            c.strokeStyle = '#26283a'; for (const r of [vr - 6, vr - 11]) { c.beginPath(); c.arc(vx, vy, r, 0, Math.PI * 2); c.stroke(); }
            c.fillStyle = a.col; c.beginPath(); c.arc(vx, vy, 8, 0, Math.PI * 2); c.fill();
          }
          c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, n + 2, n + 2);
          const was = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
          c.drawImage(G.bgCanvas(a.cover, n, n), x, y, n, n);
          c.imageSmoothingEnabled = was;
          c.fillStyle = 'rgba(4,6,20,0.72)'; c.fillRect(x, y + n - 18, n, 18);
          ui.text(rows.filter(r => r.ok).length + '/' + rows.length, x + n - 4, y + n - 15, { align: 'right', size: 10, col: C.cream });
          c.fillStyle = a.col; c.fillRect(x + 4, y + n - 12, 6, 6);
          if (!on) { c.fillStyle = 'rgba(2,3,12,0.35)'; c.fillRect(x, y, n, n); }
          c.strokeStyle = on ? C.brassHi : C.brassDk; c.lineWidth = on ? 2 : 1; c.strokeRect(x - 0.5, y - 0.5, n + 1, n + 1); c.lineWidth = 1;
          if (rows.some(r => r.fresh)) ui.badge(x + n - 4, y + 4);
          ui.text(ui.clip(a.name, SHELF.step - 4, 10, on), x + n / 2, SHELF.y + n + SHELF.lift + 9, { align: 'center', size: 10, bold: on, col: on ? C.gold : C.sub });
          ui.hit(x, y, n, n + 20, () => { if (this.album !== i) { this.album = i; this.home(); ui.sfx('select'); } });
        });
        c.fillStyle = 'rgba(6,8,24,0.92)'; c.fillRect(LIST.x, LIST.y, LIST.w, LIST.h);
        c.strokeStyle = C.brassDk; c.strokeRect(LIST.x + 0.5, LIST.y + 0.5, LIST.w - 1, LIST.h - 1);
        c.fillStyle = album.col; c.fillRect(LIST.x + 1, LIST.y + 1, 3, LIST.h - 2);
        ui.plate(LIST.x + 10, LIST.y - 8, album.name);
        const playing = this.listen ? this.listen.track : null, inCar = current();
        ui.list(LIST.x + 10, LIST.y + 16, LIST.w - 18, items.map(x => x.head ? { label: x.head.toUpperCase(), col: C.brass } : {
          label: x.ok ? bare(x.rec.name) : '???',
          right: x.ok ? (trackLength(x.rec.track) ? mmss(trackLength(x.rec.track)) : '') : '',
          col: !x.ok ? C.dim : x.rec.track === playing ? C.cyan : (x.rec.id || null) === inCar ? C.gold : C.cream,
          icon: (cc, ix, iy) => disc(cc, ix, iy, x.ok ? album.col : '#3a3f5a', x.fresh), iconW: 18
        }), this.sel, { rowH: LIST.rowH, max: LIST.max, size: 11, scroll: this.sc, onClick: i => { if (items[i].head) return; this.sel = i; this.act('listen'); } });
        drawDeck(ui, c, album, true);
        const shown = this.listen || (it && !it.head && it.ok ? it.rec : null);
        ui.text((this.listen ? 'Слушаю: ' : 'Выбрано: ') + (shown ? bare(shown.name) : '???'), DECK.x + 4, DECK.y + 108, { size: 11, bold: true, col: this.listen ? C.cyan : C.cream });
        ui.text('В Экспрессе: ' + nameOf(inCar), DECK.x + 4, DECK.y + 124, { size: 11, col: C.gold });
        const about = it && !it.head ? (it.ok ? g.fill(it.rec.text) : album.hint + '. Пластинка ещё не найдена.') : '';
        ui.wrap(about, DECK.w - 8, 11).slice(0, 4).forEach((l, i) => ui.text(l, DECK.x + 4, DECK.y + 144 + i * 14, { size: 11, col: C.sub }));
        const sel = it && !it.head && it.ok, set = sel && current() !== (it.rec.id || null);
        ui.button(DECK.x, DECK.y + 204, DECK.w, 22, 'Слушать', sel ? () => this.act('listen') : null, { disabled: !sel });
        ui.button(DECK.x, DECK.y + 230, DECK.w, 22, 'Поставить в Экспресс', set ? () => this.act('set') : null, { disabled: !set });
        ui.button(DECK.x, DECK.y + 256, DECK.w, 22, 'Вернуть привычную', current() ? () => this.act('reset') : null, { disabled: !current() });
        ui.hints([['←→', 'Альбом'], ['↑↓', 'Пластинка'], ['Enter', 'Слушать'], ['Пробел', 'Поставить'], ['R', 'Привычная'], ['Esc', 'Закрыть']], W / 2, BOX.y + BOX.h - 22, { align: 'center' });
      },
      key(k, code) {
        if (k === 'back') { ui.pop(); return; }
        if (code === 'KeyR') { this.act('reset'); return; }
        if (k === 'ok') { this.act(code === 'Space' ? 'set' : 'listen'); return; }
        if (k === 'left' || k === 'right') { this.turn(k === 'left' ? -1 : 1); return; }
        if (k === 'up' || k === 'down') this.move(k === 'up' ? -1 : 1);
      }
    });
    s.home();
    s.onClose = () => { ui.audio.music(g.mapMusic(g.map.def)); ui.finishPending(); };
    return s;
  }

  Object.assign(H.UI.prototype, { openUi_phono });
  Object.assign(H, { phonoItems });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
