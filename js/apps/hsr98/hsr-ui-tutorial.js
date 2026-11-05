(function (H) {
  'use strict';
  const G = H.Gfx, UP = H.UI.prototype;
  const { W, HGT, C } = H.UI_CONST;

  const ORANGE = '#e07828';
  const TEAL = '#38b8a8';
  const CREAM_CARD = '#ece8de';
  const SHEET_BG = '#e6e4de';
  const INK = '#1d1e26';
  const SUB_INK = '#5a5c68';

  const parseRichWords = text => {
    const out = [], re = /<orange>([\s\S]*?)<\/orange>/g;
    let last = 0, m;
    const pushSeg = (str, hi) => {
      for (const w of str.split(/\s+/).filter(Boolean)) out.push({ w, hi });
    };
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) pushSeg(text.slice(last, m.index), false);
      pushSeg(m[1], true);
      last = re.lastIndex;
    }
    if (last < text.length) pushSeg(text.slice(last), false);
    return out;
  };

  Object.assign(UP, {
    wrapRichTutorial(text, maxW, size, bold = false) {
      const words = parseRichWords(String(text || ''));
      const lines = [];
      let cur = [], curW = 0;
      const spW = this.measure(' ', size, bold);
      for (const tok of words) {
        const tw = this.measure(tok.w, size, bold || tok.hi);
        if (cur.length && curW + spW + tw > maxW) {
          lines.push({ tokens: cur, w: curW });
          cur = [tok];
          curW = tw;
        } else {
          if (cur.length) curW += spW;
          cur.push(tok);
          curW += tw;
        }
      }
      if (cur.length) lines.push({ tokens: cur, w: curW });
      return lines;
    },

    drawRichTutorialText(c, text, x, y, maxW, o = {}) {
      const size = o.size || 10, lh = o.lh || (size + 4), align = o.align || 'center';
      const col = o.col || INK, hiCol = o.hiCol || ORANGE, shadow = !!o.shadow;
      const lines = this.wrapRichTutorial(text, maxW, size, !!o.bold);
      const spW = this.measure(' ', size, !!o.bold);
      lines.slice(0, o.maxLines || 8).forEach((ln, i) => {
        let lx = align === 'center' ? x - ln.w / 2 : align === 'right' ? x - ln.w : x;
        const ly = y + i * lh;
        for (let k = 0; k < ln.tokens.length; k++) {
          const tok = ln.tokens[k];
          this.text(tok.w, lx, ly, { size, bold: tok.hi || !!o.bold, col: tok.hi ? hiCol : col, shadow });
          lx += this.measure(tok.w, size, tok.hi || !!o.bold) + spW;
        }
      });
      return lines.length;
    },

    drawTutorialPointer(c, x, y) {
      c.save();
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#181a24';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x - 7, y);
      c.lineTo(x - 2, y - 4);
      c.lineTo(x + 4, y);
      c.lineTo(x - 2, y + 4);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    },

    drawTutorialCheck(c, cx, cy, r, done, active) {
      c.save();
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.strokeStyle = done ? '#2e9e8e' : active ? '#8a8c98' : '#585c70';
      c.lineWidth = 1.5;
      c.stroke();
      if (done) {
        c.strokeStyle = '#2e9e8e';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cx - r * 0.45, cy + 0.5);
        c.lineTo(cx - r * 0.1, cy + r * 0.4);
        c.lineTo(cx + r * 0.5, cy - r * 0.35);
        c.stroke();
      }
      c.restore();
    },

    drawTutorialArt(c, art, x, y, w, h, tr) {
      const ui = this, g = this.game, kind = (art && art.kind) || 'sp';
      c.save();
      c.beginPath();
      c.rect(x, y, w, h);
      c.clip();
      const bgId = kind.startsWith('adv_') || kind === 'chest' || kind === 'anchor' || kind === 'anchor_heal' ? 'station' : kind === 'calyx_gold' || kind === 'calyx_crimson' ? 'jarilo_snow' : 'sim';
      const was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(G.bgCanvas(bgId, w, h), x, y, w, h);
      c.fillStyle = 'rgba(8,10,22,0.28)';
      c.fillRect(x, y, w, h);

      const heroes = tr && tr.setup && tr.setup.party ? tr.setup.party.map(p => p.id) :
        kind === 'followup' ? ['march', 'herta'] :
        kind === 'av_shift' ? ['bronya', 'seele'] :
        kind === 'dispel' ? ['pela', 'danheng'] :
        kind === 'cleanse' ? ['aqua', 'danheng'] :
        kind === 'spec_fusion' ? ['march', 'danheng'] :
        kind === 'spec_elation' ? ['kazuma', 'aqua'] :
        kind === 'break_cc' ? ['welt', 'seele'] :
        ['trail', 'hook'];
      const foes = tr && tr.setup && tr.setup.enemies ? tr.setup.enemies.map(e => e.id) :
        kind === 'interrupt' ? ['cannoneer'] :
        kind === 'spec_contact' ? ['flamespawn'] :
        ['reaver', 'frostspawn'];

      if (kind === 'chest' || kind === 'destructible' || kind === 'anchor' || kind === 'anchor_heal' || kind === 'strong_foe' || kind === 'calyx_gold' || kind === 'calyx_crimson' || kind === 'field_tech') {
        const look = G.lookOf(g.kitOf('trail'), g);
        G.drawSprite(c, look, 'right', 0, x + w * 0.28, y + h * 0.56);
        if (kind === 'chest') {
          c.fillStyle = '#1c2848'; c.fillRect(x + w * 0.52, y + h * 0.52, 34, 24);
          c.strokeStyle = '#50d8ff'; c.lineWidth = 2; c.strokeRect(x + w * 0.52, y + h * 0.52, 34, 24);
          c.fillStyle = '#80f0ff'; c.fillRect(x + w * 0.52 + 12, y + h * 0.52 + 9, 10, 5);
        } else if (kind === 'destructible') {
          c.fillStyle = '#5a3828'; c.fillRect(x + w * 0.55, y + h * 0.5, 24, 28);
          c.fillStyle = '#ffb840'; c.fillRect(x + w * 0.55 + 4, y + h * 0.5 + 8, 16, 4);
        } else if (kind === 'anchor' || kind === 'anchor_heal') {
          c.fillStyle = '#38d0ff'; c.beginPath(); c.arc(x + w * 0.6, y + h * 0.54, 14, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#e8ffff'; c.fillRect(x + w * 0.6 - 3, y + h * 0.34, 6, 36);
          if (kind === 'anchor_heal') {
            ui.text('+HP', x + w * 0.34, y + h * 0.42, { size: 11, bold: true, col: '#68ff9a' });
          }
        } else if (kind === 'calyx_gold' || kind === 'calyx_crimson') {
          const col = kind === 'calyx_gold' ? '#ffd050' : '#ff5868';
          c.fillStyle = col; c.beginPath(); c.arc(x + w * 0.6, y + h * 0.52, 16, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#ffffff'; c.stroke();
        } else {
          const foe = H.ENEMIES.trampler || H.ENEMIES.reaver;
          G.drawEnemy(c, foe, x + w * 0.65, y + h * 0.78, 54);
        }
      } else {
        heroes.slice(0, 2).forEach((hid, i) => {
          const kit = H.CHARS[hid] ? hid : 'trail';
          G.drawFigure(c, G.lookOf(kit, g), x + 46 + i * 38, y + h - 18, 1.55);
        });
        foes.slice(0, 2).forEach((fid, i) => {
          const ed = H.ENEMIES[fid] || H.ENEMIES.reaver;
          const ew = 46, eh = 46, ex = x + w - 98 + i * 44, ey = y + 36 + i * 8;
          G.drawEnemy(c, ed, ex + ew / 2, ey + eh, ew);
          c.fillStyle = '#000'; c.fillRect(ex + 4, ey - 10, 38, 7);
          c.fillStyle = '#d84040'; c.fillRect(ex + 5, ey - 9, 30, 3);
          c.fillStyle = kind === 'break_hit' ? '#555' : '#f2f2f8';
          c.fillRect(ex + 5, ey - 5, kind === 'break_hit' ? 4 : 26, 2);
          (ed.weak || ['phys', 'fire']).slice(0, 3).forEach((el, k) => {
            G.elemIcon(c, el, ex + 8 + k * 9, ey - 15, 4);
          });
        });
        c.fillStyle = 'rgba(10,14,28,0.82)';
        c.fillRect(x + 6, y + 6, 28, 52);
        heroes.slice(0, 2).forEach((hid, i) => {
          c.fillStyle = i === 0 ? '#ffd060' : '#8aa0d0';
          c.fillRect(x + 8, y + 8 + i * 16, 24, 13);
          ui.text(String(12 + i * 18), x + 20, y + 10 + i * 16, { align: 'center', size: 8, bold: true, col: '#101420', shadow: false });
        });
        c.fillStyle = 'rgba(12,16,32,0.85)';
        c.fillRect(x + w - 92, y + h - 28, 86, 22);
        c.strokeStyle = '#ffd060';
        c.strokeRect(x + w - 91.5, y + h - 27.5, 85, 21);
        ui.text(art && art.label ? art.label : '✦✦✦✧✧', x + w - 49, y + h - 22, { align: 'center', size: 9, bold: true, col: '#ffe898' });
      }
      c.imageSmoothingEnabled = was;
      c.restore();
      c.strokeStyle = '#3a4258';
      c.lineWidth = 1;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    },

    drawTutorialTopBar(c, scr) {
      const ui = this, g = this.game;
      G.menuIcon(c, 'guide', 12, 6, 26, C.gold);
      const topTitle = scr.mode === 0 ? 'Обучение' : 'Тактическая тренировка';
      const subTitle = scr.mode === 0 ? H.TUTORIAL_CATS[scr.cat].label : H.TRAINING_GROUPS[scr.group].label;
      ui.text(topTitle, 42, 6, { size: 9, col: C.brass });
      ui.text(subTitle, 42, 17, { size: 12, bold: true, col: C.cream });

      const modes = [
        { id: 0, icon: 'tut_book', label: 'Обучение' },
        { id: 1, icon: 'tut_train', label: 'Тренировка', alert: g.tutorialAlert() }
      ];
      modes.forEach((m, i) => {
        const cx = W / 2 - 22 + i * 44, cy = 18, on = scr.mode === i;
        if (on) {
          c.fillStyle = '#f2eee4';
          c.beginPath(); c.arc(cx, cy, 13, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#f2eee4';
          c.fillRect(cx - 16, 33, 32, 2);
        } else {
          c.fillStyle = 'rgba(255,255,255,0.08)';
          c.beginPath(); c.arc(cx, cy, 12, 0, Math.PI * 2); c.fill();
        }
        G.menuIcon(c, m.icon, cx - 10, cy - 10, 20, on ? '#181a24' : '#b8bcc8');
        if (m.alert) ui.badge(cx + 9, cy - 9);
        ui.hit(cx - 16, 4, 32, 32, () => scr.setMode(i));
      });
      ui.closeBtn(W - 32, 8, () => scr.key('back'));
    },

    drawTutorialEncyclopedia(c, scr) {
      const ui = this, g = this.game, cats = H.TUTORIAL_CATS;
      c.fillStyle = 'rgba(255,255,255,0.12)';
      c.fillRect(24, 62, 248, 1);
      cats.forEach((cat, i) => {
        const tx = 28 + i * 40, ty = 40, on = scr.cat === i;
        G.menuIcon(c, cat.icon, tx + 6, ty, 18, on ? '#ffffff' : '#7c8094');
        if (on) {
          c.fillStyle = '#ffffff';
          c.fillRect(tx, 61, 30, 2);
        }
        ui.hit(tx, ty - 2, 32, 24, () => scr.setCat(i));
      });

      const sx = 24, sy = 70, sw = 188, sh = 22;
      c.fillStyle = 'rgba(20,22,34,0.85)';
      c.fillRect(sx, sy, sw, sh);
      c.strokeStyle = scr.query ? C.gold : '#4a4e64';
      c.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
      ui.text(scr.query ? '🔍 ' + ui.fitText(scr.query, 10, sw - 34) : '🔍 Поиск...', sx + 8, sy + 5, { size: 10, col: scr.query ? C.cream : C.sub });
      ui.hit(sx, sy, sw - (scr.query ? 22 : 0), sh, () => scr.askSearch());
      if (scr.query) {
        ui.text('×', sx + sw - 11, sy + 4, { align: 'center', size: 12, bold: true, col: C.gold });
        ui.hit(sx + sw - 22, sy, 22, sh, () => { scr.query = ''; scr.row = 0; scr.page = 0; scr.sc.top = 0; ui.sfx('cancel'); });
      }

      const list = g.tutorialEntries(cats[scr.cat].id, scr.query);
      scr.row = Math.max(0, Math.min(scr.row, Math.max(0, list.length - 1)));
      const vis = 8, rh = 38, gap = 3, ly0 = 98;
      const top = ui.listTop(scr.sc, scr.row, list.length, vis);

      if (!list.length) {
        ui.text('Ничего не найдено', sx + sw / 2, ly0 + 80, { align: 'center', size: 11, col: C.sub });
      } else {
        const curEntry = list[scr.row];
        if (curEntry && !g.isTutorialRead(curEntry.id)) g.markTutorialRead(curEntry.id);
      }

      list.slice(top, top + vis).forEach((e, j) => {
        const i = top + j, y = ly0 + j * (rh + gap), on = i === scr.row;
        c.fillStyle = on ? CREAM_CARD : 'rgba(28,30,42,0.82)';
        c.fillRect(sx, y, sw, rh);
        c.strokeStyle = on ? '#ffffff' : 'rgba(255,255,255,0.08)';
        c.strokeRect(sx + 0.5, y + 0.5, sw - 1, rh - 1);
        if (on) ui.drawTutorialPointer(c, sx - 3, y + rh / 2);
        const lines = ui.wrap(e.title, sw - 24, 10).slice(0, 2);
        lines.forEach((ln, k) => {
          ui.text(ln, sx + 10, y + (lines.length > 1 ? 7 : 13) + k * 12, { size: 10, bold: on, col: on ? INK : C.cream, shadow: !on });
        });
        if (!g.isTutorialRead(e.id)) ui.badge(sx + sw - 8, y + 8);
        ui.hit(sx, y, sw, rh, () => {
          if (scr.row !== i) { scr.row = i; scr.page = 0; ui.sfx('select'); }
        });
      });
      if (list.length > vis) ui.scrollBar(sx + sw + 2, ly0, vis * (rh + gap) - gap, scr.sc, list.length, vis);
      ui.wheelZone(sx, ly0, sw, vis * (rh + gap), d => {
        if (list.length) { scr.row = Math.max(0, Math.min(list.length - 1, scr.row + d)); scr.page = 0; }
      });

      const rx = 224, ry = 70, rw = 392, rhCard = 368;
      c.fillStyle = '#9a968c'; c.fillRect(rx + 6, ry + 6, rw, rhCard);
      c.fillStyle = '#c8c4ba'; c.fillRect(rx + 3, ry + 3, rw, rhCard);
      c.fillStyle = '#181a24'; c.fillRect(rx, ry, rw, 166);
      c.fillStyle = SHEET_BG; c.fillRect(rx, ry + 166, rw, rhCard - 166);
      c.strokeStyle = '#3a3e52'; c.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rhCard - 1);

      const cur = list[scr.row];
      if (!cur) return;
      scr.page = Math.max(0, Math.min(scr.page, cur.pages.length - 1));
      const pg = cur.pages[scr.page];
      const arts = pg.art || [{ kind: 'sp' }];
      if (arts.length >= 2) {
        const pw = 172, ph = 136, py = ry + 16;
        ui.drawTutorialArt(c, arts[0], rx + 20, py, pw, ph);
        ui.drawTutorialArt(c, arts[1], rx + 20 + pw + 8, py, pw, ph);
      } else {
        ui.drawTutorialArt(c, arts[0], rx + 66, ry + 16, 260, 136);
      }

      ui.text(pg.title || cur.title, rx + rw / 2, ry + 180, { align: 'center', size: 13, bold: true, col: INK, shadow: false });
      ui.drawRichTutorialText(c, pg.text, rx + rw / 2, ry + 204, rw - 44, { size: 10, lh: 15, align: 'center', col: SUB_INK, hiCol: ORANGE, shadow: false, maxLines: 6 });

      const dots = cur.pages.length;
      for (let i = 0; i < dots; i++) {
        const dx = rx + rw / 2 + (i - (dots - 1) / 2) * 10, dy = ry + rhCard - 46;
        c.fillStyle = i === scr.page ? '#20222a' : '#b4b2aa';
        c.beginPath(); c.arc(dx, dy, 2.5, 0, Math.PI * 2); c.fill();
      }

      const canPrev = scr.page > 0, canNext = scr.page < cur.pages.length - 1;
      const drawPill = (bx, by, bw, bh, label, active, fn) => {
        c.fillStyle = active ? '#ffffff' : '#d8d6d0';
        c.fillRect(bx, by, bw, bh);
        c.strokeStyle = active ? '#b8b4aa' : '#c4c0b8';
        c.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
        ui.text(label, bx + bw / 2, by + 6, { align: 'center', size: 10, bold: active, col: active ? INK : '#989690', shadow: false });
        if (active) ui.hit(bx, by, bw, bh, fn);
      };
      drawPill(rx + rw / 2 - 104, ry + rhCard - 34, 96, 22, 'Назад', canPrev, () => { scr.page--; ui.sfx('select'); });
      drawPill(rx + rw / 2 + 8, ry + rhCard - 34, 96, 22, 'Далее', canNext, () => { scr.page++; ui.sfx('select'); });

      if (cur.trialId) {
        drawPill(rx + rw - 114, ry + rhCard - 34, 104, 22, 'К тренировке', true, () => scr.jumpToTrial(cur.trialId));
      }
    },

    drawTutorialTraining(c, scr) {
      const ui = this, g = this.game, groups = H.TRAINING_GROUPS;
      c.fillStyle = 'rgba(255,255,255,0.12)';
      c.fillRect(24, 62, 160, 1);
      groups.forEach((gr, i) => {
        const tx = 28 + i * 44, ty = 40, on = scr.group === i;
        G.menuIcon(c, gr.icon, tx + 7, ty, 18, on ? '#ffffff' : '#7c8094');
        if (on) {
          c.fillStyle = '#ffffff';
          c.fillRect(tx, 61, 32, 2);
        }
        const hasUnclaimed = g.trainingTrials(gr.id).some(t => !g.isTrialClaimed(t.id));
        if (hasUnclaimed && g.state.flags.express_intro) ui.badge(tx + 26, ty + 2);
        ui.hit(tx, ty - 2, 34, 24, () => scr.setGroup(i));
      });

      const list = g.trainingTrials(groups[scr.group].id);
      scr.trow = Math.max(0, Math.min(scr.trow, Math.max(0, list.length - 1)));
      const sx = 24, sw = 188, vis = 7, rh = 44, gap = 4, ly0 = 76;
      const top = ui.listTop(scr.tsc, scr.trow, list.length, vis);

      list.slice(top, top + vis).forEach((t, j) => {
        const i = top + j, y = ly0 + j * (rh + gap), on = i === scr.trow, done = g.isTrialDone(t.id);
        c.fillStyle = on ? CREAM_CARD : 'rgba(28,30,42,0.82)';
        c.fillRect(sx, y, sw, rh);
        c.fillStyle = on ? TEAL : 'rgba(255,255,255,0.18)';
        c.fillRect(sx, y, 3, rh);
        c.strokeStyle = on ? '#ffffff' : 'rgba(255,255,255,0.08)';
        c.strokeRect(sx + 0.5, y + 0.5, sw - 1, rh - 1);
        if (on) ui.drawTutorialPointer(c, sx - 3, y + rh / 2);
        const lines = ui.wrap(t.title, sw - 42, 10).slice(0, 2);
        lines.forEach((ln, k) => {
          ui.text(ln, sx + 10, y + (lines.length > 1 ? 10 : 16) + k * 12, { size: 10, bold: on, col: on ? INK : C.cream, shadow: !on });
        });
        ui.drawTutorialCheck(c, sx + sw - 16, y + rh / 2, 8, done, on);
        ui.hit(sx, y, sw, rh, () => {
          if (scr.trow !== i) { scr.trow = i; ui.sfx('select'); }
        });
      });
      if (list.length > vis) ui.scrollBar(sx + sw + 2, ly0, vis * (rh + gap) - gap, scr.tsc, list.length, vis);
      ui.wheelZone(sx, ly0, sw, vis * (rh + gap), d => {
        if (list.length) scr.trow = Math.max(0, Math.min(list.length - 1, scr.trow + d));
      });

      const tr = list[scr.trow];
      if (!tr) return;

      const rx = 224, ry = 76, rw = 392, rhCard = 252;
      c.fillStyle = 'rgba(12,14,22,0.92)';
      c.fillRect(rx, ry, rw, rhCard);
      c.strokeStyle = '#2e3448';
      c.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rhCard - 1);

      ui.text(tr.title, rx + rw / 2, ry + 10, { align: 'center', size: 13, bold: true, col: '#ffffff' });
      const adv = tr.badge.includes('Продвинутая');
      c.fillStyle = adv ? 'rgba(42,118,122,0.55)' : 'rgba(56,64,88,0.55)';
      c.fillRect(rx + rw / 2 - 76, ry + 27, 152, 14);
      ui.text(tr.badge, rx + rw / 2, ry + 29, { align: 'center', size: 9, col: adv ? '#7ef0e8' : '#a8b0c8', shadow: false });

      ui.drawTutorialArt(c, tr.art, rx + 70, ry + 46, 252, 150, tr);
      ui.drawRichTutorialText(c, tr.summary, rx + rw / 2, ry + 206, rw - 32, { size: 10, lh: 14, align: 'center', col: C.cream, hiCol: ORANGE, shadow: true, maxLines: 3 });

      const rwy = ry + rhCard + 14;
      ui.text('Награды', rx, rwy, { size: 10, col: C.sub });
      c.fillStyle = 'rgba(255,255,255,0.12)';
      c.fillRect(rx + 52, rwy + 6, rw - 52, 1);

      const claimed = g.isTrialClaimed(tr.id);
      const cells = [['jade', tr.reward.jade]];
      for (const [k, v] of Object.entries(tr.reward.items || {})) cells.push([k, v]);
      if (tr.reward.credits) cells.push(['credits', tr.reward.credits]);
      cells.forEach(([id, n], i) => {
        const cx = rx + i * 44, cy = rwy + 16;
        ui.rewardCell(c, id, n, cx, cy, 36);
        if (claimed) {
          c.fillStyle = 'rgba(8,10,18,0.55)';
          c.fillRect(cx, cy, 36, 36);
          c.fillStyle = 'rgba(255,255,255,0.9)';
          c.beginPath(); c.arc(cx + 18, cy + 16, 8, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#181a24'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(cx + 14, cy + 16); c.lineTo(cx + 17, cy + 19); c.lineTo(cx + 22, cy + 13); c.stroke();
          c.lineWidth = 1;
        }
      });

      const bx = rx + rw - 148, by = 408, bw = 148, bh = 28;
      c.fillStyle = CREAM_CARD;
      c.fillRect(bx, by, bw, bh);
      c.strokeStyle = '#ffffff';
      c.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      ui.text('Начать испытание', bx + bw / 2, by + 8, { align: 'center', size: 11, bold: true, col: INK, shadow: false });
      ui.hit(bx, by, bw, bh, () => ui.startTutorialTrialUI(tr.id));
    },

    startTutorialTrialUI(id) {
      const b = this.game.startTutorialTrial(id);
      if (!b) { this.sfx('deny'); return false; }
      this.drainGameEvents();
      return true;
    },

    openTutorial(opts = {}) {
      const ui = this, g = this.game;
      g.tutorialState();
      let initMode = opts.mode != null ? opts.mode : 0;
      let initGroup = 0, initTrow = 0, initCat = 0, initRow = 0;
      if (opts.trialId) {
        initMode = 1;
        const tr = g.trainingTrialOf(opts.trialId);
        if (tr) {
          initGroup = Math.max(0, H.TRAINING_GROUPS.findIndex(x => x.id === tr.group));
          initTrow = Math.max(0, g.trainingTrials(tr.group).findIndex(x => x.id === tr.id));
        }
      } else if (opts.entryId) {
        initMode = 0;
        initRow = Math.max(0, H.TUTORIAL_ENTRIES.findIndex(x => x.id === opts.entryId));
      }
      this.push({
        full: true,
        tutorialScreen: true,
        mode: initMode,
        cat: initCat,
        row: initRow,
        page: 0,
        query: '',
        sc: { top: 0 },
        group: initGroup,
        trow: initTrow,
        tsc: { top: 0 },
        setMode(m) {
          const next = (m + 2) % 2;
          if (this.mode !== next) { this.mode = next; ui.sfx('select'); }
        },
        setCat(i) {
          const n = H.TUTORIAL_CATS.length;
          this.cat = (i + n) % n;
          this.row = 0;
          this.page = 0;
          this.sc.top = 0;
          ui.sfx('select');
        },
        setGroup(i) {
          const n = H.TRAINING_GROUPS.length;
          this.group = (i + n) % n;
          this.trow = 0;
          this.tsc.top = 0;
          ui.sfx('select');
        },
        jumpToTrial(tid) {
          const tr = g.trainingTrialOf(tid);
          if (!tr) return;
          this.mode = 1;
          this.group = Math.max(0, H.TRAINING_GROUPS.findIndex(x => x.id === tr.group));
          this.trow = Math.max(0, g.trainingTrials(tr.group).findIndex(x => x.id === tr.id));
          this.tsc.top = 0;
          ui.sfx('confirm');
        },
        askSearch() {
          ui.openTextEntry({
            title: 'Поиск по обучению',
            value: this.query,
            max: 24,
            ok: v => {
              this.query = String(v || '').trim();
              this.row = 0;
              this.page = 0;
              this.sc.top = 0;
            }
          });
        },
        draw(c) {
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(10,12,22,0.82)';
          c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.drawTutorialTopBar(c, this);
          if (this.mode === 0) ui.drawTutorialEncyclopedia(c, this);
          else ui.drawTutorialTraining(c, this);
          ui.text('UID:' + ui.profileUid(), 12, HGT - 14, { size: 9, col: C.dim });
          const hints = this.mode === 0
            ? [['Tab', 'Тренировка'], ['Q/E', 'Раздел'], ['↑↓', 'Статья'], ['←→', 'Страница'], ['F', 'Поиск'], ['Esc', 'Назад']]
            : [['Tab', 'Обучение'], ['Q/E', 'Раздел'], ['↑↓', 'Испытание'], ['Enter', 'Начать'], ['Esc', 'Назад']];
          ui.hints(hints, W / 2 + 30, HGT - 16, { align: 'center' });
        },
        key(k, code) {
          if (code === 'Tab') { this.setMode(1 - this.mode); return; }
          if (code === 'KeyQ' || code === 'KeyE') {
            const d = code === 'KeyQ' ? -1 : 1;
            if (this.mode === 0) this.setCat(this.cat + d);
            else this.setGroup(this.group + d);
            return;
          }
          if (this.mode === 0) {
            const list = g.tutorialEntries(H.TUTORIAL_CATS[this.cat].id, this.query);
            const cur = list[this.row];
            if (code === 'KeyF') { this.askSearch(); return; }
            if (code === 'KeyT' && cur && cur.trialId) { this.jumpToTrial(cur.trialId); return; }
            if ((k === 'up' || k === 'down') && list.length) {
              this.row = (this.row + (k === 'up' ? list.length - 1 : 1)) % list.length;
              this.page = 0;
              ui.sfx('select');
              return;
            }
            if ((k === 'left' || k === 'right') && cur) {
              const to = this.page + (k === 'left' ? -1 : 1);
              if (to >= 0 && to < cur.pages.length) { this.page = to; ui.sfx('select'); }
              return;
            }
            if (k === 'ok' && cur && cur.trialId) { this.jumpToTrial(cur.trialId); return; }
            if (k === 'back') {
              if (this.query) { this.query = ''; this.row = 0; this.page = 0; this.sc.top = 0; ui.sfx('cancel'); return; }
              ui.pop();
            }
            return;
          }
          const list = g.trainingTrials(H.TRAINING_GROUPS[this.group].id);
          if ((k === 'up' || k === 'down') && list.length) {
            this.trow = (this.trow + (k === 'up' ? list.length - 1 : 1)) % list.length;
            ui.sfx('select');
            return;
          }
          if (k === 'ok' && list[this.trow]) {
            ui.startTutorialTrialUI(list[this.trow].id);
            return;
          }
          if (k === 'back') ui.pop();
        }
      });
    },

    drawTutorialCoachBanner(c) {
      const b = this.game.battle;
      if (!b || !b.opts || !b.opts.tutorial) return;
      const info = this.game.tutorialStepOf(b);
      if (!info || !info.step) return;
      const x = 132, y = 6, w = 376, h = 48;
      c.fillStyle = 'rgba(10,14,28,0.92)';
      c.fillRect(x, y, w, h);
      c.strokeStyle = info.done ? TEAL : C.brassHi;
      c.lineWidth = 1.5;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.lineWidth = 1;
      G.menuIcon(c, 'guide', x + 8, y + 11, 24, info.done ? '#7ef0e8' : C.gold);
      const stepLabel = info.done ? 'Тренировка выполнена' : 'Шаг ' + (info.idx + 1) + ' из ' + info.total;
      this.text(stepLabel, x + 38, y + 5, { size: 9, bold: true, col: info.done ? '#7ef0e8' : C.gold });
      this.drawRichTutorialText(c, info.step.text, x + 38, y + 18, w - 46, {
        size: 9, lh: 12, align: 'left', col: C.cream, hiCol: '#ff9c40', shadow: true, maxLines: 2
      });

      const cmd = info.step.cmd;
      if (cmd && this.bState && this.bState.mode === 'cmd') {
        const pulse = 0.55 + 0.45 * Math.sin(this.t * 6);
        c.strokeStyle = 'rgba(255,216,96,' + pulse.toFixed(2) + ')';
        c.lineWidth = 2;
        if (cmd === 'basic') c.strokeRect(446.5, 402.5, 91, 31);
        else if (cmd === 'skill') c.strokeRect(542.5, 402.5, 91, 31);
        else if (cmd === 'contact') c.strokeRect(446.5, 437.5, 61, 25);
        else if (cmd === 'fusion') c.strokeRect(510.5, 437.5, 61, 25);
        else if (String(cmd).startsWith('ult:')) {
          const idx = +cmd.split(':')[1] || 0;
          c.strokeRect(9 + idx * 106, 389, 102, 84);
        }
        c.lineWidth = 1;
      }
    },

    drawTutorialResult(c) {
      const r = this.bState.result, tut = r && r.tutorial;
      if (!tut) return;
      c.fillStyle = 'rgba(2,4,14,0.82)';
      c.fillRect(0, 0, W, HGT);
      const x = 130, y = 96, w = 380, h = 280;
      this.win(x, y, w, h, { title: r.win ? 'Испытание пройдено!' : 'Испытание прервано' });
      G.menuIcon(c, 'tut_train', x + w / 2 - 16, y + 26, 32, r.win ? C.gold : C.sub);
      this.text(tut.title, x + w / 2, y + 66, { align: 'center', size: 14, bold: true, serif: true, col: C.gold });
      this.text(tut.badge || 'Тактическая тренировка', x + w / 2, y + 86, { align: 'center', size: 10, col: C.sub });

      if (r.win) {
        this.text(tut.firstWin ? 'Награда за первое прохождение:' : 'Испытание успешно повторено (награда уже получена):', x + w / 2, y + 114, { align: 'center', size: 10, col: C.cream });
        const cells = [['jade', tut.reward.jade]];
        for (const [k, v] of Object.entries(tut.reward.items || {})) cells.push([k, v]);
        if (tut.reward.credits) cells.push(['credits', tut.reward.credits]);
        const totalW = cells.length * 44 - 8, rx0 = x + (w - totalW) / 2;
        cells.forEach(([id, n], i) => {
          this.rewardCell(c, id, n, rx0 + i * 44, y + 134, 36);
        });
      } else {
        this.text('Вы можете сразу повторить тренировку или вернуться к списку.', x + w / 2, y + 138, { align: 'center', size: 10, col: C.cream });
      }

      this.button(x + 36, y + h - 44, 140, 26, 'Повторить [R]', () => this.tutorialBattleRetry(), { size: 11 });
      this.button(x + w - 176, y + h - 44, 140, 26, 'К списку [Enter]', () => this.closeResult(), { size: 11, primary: true });
    },

    tutorialBattleRetry() {
      this.sfx('confirm');
      this.game.tutorialRetry();
      this.drainGameEvents();
    }
  });

  const drawBattle0 = UP.drawBattle;
  UP.drawBattle = function (c) {
    drawBattle0.call(this, c);
    const b = this.game.battle;
    if (b && b.opts && b.opts.tutorial && (!this.bState || !this.bState.result)) {
      this.drawTutorialCoachBanner(c);
    }
  };

  const drawResult0 = UP.drawResult;
  UP.drawResult = function (c) {
    if (this.bState && this.bState.result && this.bState.result.tutorial) {
      this.drawTutorialResult(c);
      return;
    }
    return drawResult0.call(this, c);
  };

  const closeResult0 = UP.closeResult;
  UP.closeResult = function () {
    const tut = this.bState && this.bState.result && this.bState.result.tutorial;
    if (!tut) return closeResult0.call(this);
    this.bState = null;
    this.playFieldMusic();
    const top = this.top();
    if (!top || !top.tutorialScreen) {
      this.openTutorial({ mode: 1, trialId: tut.id });
    }
  };

  const battleKey0 = UP.battleKey;
  UP.battleKey = function (k, code) {
    if (this.bState && this.bState.result && this.bState.result.tutorial) {
      if (code === 'KeyR') { this.tutorialBattleRetry(); return; }
      if (k === 'ok' || k === 'back') { this.closeResult(); return; }
      return;
    }
    return battleKey0.call(this, k, code);
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
