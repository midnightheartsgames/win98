(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { C } = H.UI_CONST;
  const LORD_AT = { x: 96, y: 330, s: 170 };
  const VIOLET = '#b48aff', GOLD = '#ffd060', TEAL = '#7ae8e0', ICE = '#a8d8ff', LILAC = '#c8a8ff', ROSE = '#ff8a8a', MINT = '#9af0c8', AMBER = '#f0d070';
  const PIPS = {
    luocha: ['Flower', 'flowers', 2, AMBER],
    imbibitor: ['Scale', 'scales', 3, TEAL],
    fuxuan: ['FxHeal', 'fxCharges', 2, LILAC],
    jingliu: ['Syz', 'syz', 3, ICE],
    argenti: ['Apo', 'apo', 10, ROSE]
  };
  const has = (u, name) => u.buffs.some(b => b.name === name);
  const left = (u, name) => { const b = u.buffs.find(x => x.name === name); return b ? b.turns : 0; };
  let lordCache = null;

  function lordArt() {
    if (lordCache) return lordCache;
    const cv = G.mkCanvas(80, 104), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    H.FivesScenes.lordGiant(g, 34, 104, 0.58, 1, 0);
    lordCache = cv;
    return cv;
  }

  Object.assign(H.UI.prototype, {
    fivesUi() {
      const bt = this.bt;
      if (!bt.five) bt.five = { lord: null, numby: null, trans: new Map() };
      return bt.five;
    },

    fivesPos(u) {
      if (u.id === 'lord') return { x: LORD_AT.x, y: LORD_AT.y - LORD_AT.s * 0.55 };
      if (u.id === 'numby') { const n = this.numbySpot(u); return { x: n.x, y: n.y - n.s * 0.5 }; }
      return null;
    },

    numbySpot(u) { const o = u.owner ? this.allyPos(u.owner) : { x: 180 }; return { x: o.x + 32, y: 362, s: 60 }; },

    fivesEvent(e) {
      const bt = this.bt, f = this.fivesUi();
      switch (e.t) {
        case 'lord':
          if (e.on) {
            f.lord = { u: e.u, t: 0, a: 0, hits: e.hits, leaving: false, zap: 0 };
            bt.big = { text: 'ПОВЕЛИТЕЛЬ МОЛНИЙ', sub: 'Цзин Юань призывает духа', col: VIOLET, t: 0.9 };
            this.sfx('warp');
          } else if (e.on === false) { if (f.lord && f.lord.u === e.u) f.lord.leaving = true; }
          else if (f.lord && f.lord.u === e.u) { if (e.hits > f.lord.hits) f.lord.zap = 0.4; f.lord.hits = e.hits; }
          return true;
        case 'numby':
          if (e.on) {
            f.numby = { u: e.u, t: 0, a: 0, wind: 0, leaving: false, hop: 0 };
            this.sfx('glint');
          } else if (e.on === false) { if (f.numby && f.numby.u === e.u) f.numby.leaving = true; }
          else if (f.numby && f.numby.u === e.u) {
            if (e.wind > f.numby.wind) bt.big = { text: 'ПОРАЗИТЕЛЬНЫЙ РОСТ!', sub: 'Счетовод входит в азарт', col: GOLD, t: 0.9 };
            f.numby.wind = e.wind;
          }
          return true;
        case 'trans':
          e.u.dTrans = e.on;
          if (e.on) { bt.big = { text: 'СПЕКТРАЛЬНАЯ ТРАНСМИГРАЦИЯ', sub: e.u.name + ' становится мечом', col: ICE, t: 1 }; bt.shake = Math.max(bt.shake, 6); this.sfx('ult'); }
          else this.floatAt(e.u, 'Трансмиграция окончена', ICE, 11);
          return true;
      }
      return false;
    },

    fivesAct(e) {
      const f = this.fivesUi();
      if (f.lord && e.u === f.lord.u) f.lord.zap = 0.6;
      if (f.numby && e.u === f.numby.u) f.numby.hop = 0.5;
    },

    fivesUpdate(dt) {
      const f = this.fivesUi();
      for (const k of ['lord', 'numby']) {
        const s = f[k];
        if (!s) continue;
        s.t += dt;
        if (s.zap) s.zap = Math.max(0, s.zap - dt);
        if (s.hop) s.hop = Math.max(0, s.hop - dt);
        s.a = s.leaving ? Math.max(0, s.a - dt * 2) : Math.min(1, s.a + dt * 2.5);
        if (s.leaving && s.a <= 0) f[k] = null;
      }
    },

    fivesBack(c, lay) {
      const f = this.fivesUi(), b = this.game.battle;
      if (f.lord) this.drawLord(c, f.lord);
      if (f.numby) this.drawNumby(c, f.numby);
      const lc = b && b.allies.find(a => a.charId === 'luocha' && !a.dead && has(a, 'Зона Лочи'));
      if (lc) {
        const pulse = 0.18 + 0.06 * Math.sin(this.t * 2);
        for (const [u, p] of lay) {
          if (u.dead || u.gone) continue;
          c.strokeStyle = 'rgba(240,210,110,' + pulse.toFixed(3) + ')'; c.lineWidth = 2;
          c.beginPath(); c.ellipse(p.x, p.y + 4, p.s * 0.42, 12, 0, 0, Math.PI * 2); c.stroke();
          c.lineWidth = 1;
        }
      }
    },

    fivesField(c, lay) {
      for (const [u, p] of lay) {
        if (u.dead || u.gone) continue;
        const top = p.y - p.s * 0.95;
        let dx = 0;
        if (u.buffs.some(b => b.s === 'debt')) { this.debtBadge(c, p.x - 18 + dx, top); dx += 20; }
        if (u.buffs.some(b => b.s === 'folly')) { this.follyBadge(c, p.x - 18 + dx, top); dx += 20; }
      }
    },

    debtBadge(c, x, y) {
      const bob = Math.sin(this.t * 3) * 1.5;
      c.fillStyle = '#5a3a10'; c.beginPath(); c.arc(x + 8, y + 8 + bob, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD; c.beginPath(); c.arc(x + 8, y + 8 + bob, 6.5, 0, Math.PI * 2); c.fill();
      this.text('₵', x + 8, y + 2 + bob, { align: 'center', size: 10, bold: true, col: '#5a3a10' });
    },

    follyBadge(c, x, y) {
      c.fillStyle = '#2a2050'; c.fillRect(x, y, 16, 16);
      c.fillStyle = '#e8e4f0'; c.fillRect(x + 4, y + 3, 8, 9); c.fillRect(x + 3, y + 11, 10, 3);
      c.fillStyle = '#2a2050'; c.fillRect(x + 5, y + 6, 2, 1); c.fillRect(x + 9, y + 6, 2, 1);
      c.strokeStyle = LILAC; c.strokeRect(x + 0.5, y + 0.5, 15, 15);
    },

    drawLord(c, l) {
      const { x, y, s } = LORD_AT, bt = this.bt, bob = Math.sin(l.t * 1.3) * 5, lunge = (bt.lunge.get(l.u) || 0) * 26;
      c.save();
      c.globalAlpha = l.a * (0.8 + 0.1 * Math.sin(l.t * 5));
      const gr = c.createRadialGradient(x, y - s * 0.55, 8, x, y - s * 0.55, s * 0.8);
      gr.addColorStop(0, 'rgba(170,120,255,' + (0.3 + l.zap * 0.4).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(170,120,255,0)');
      c.fillStyle = gr; c.fillRect(x - s, y - s * 1.4, s * 2, s * 1.7);
      c.imageSmoothingEnabled = false;
      const art = lordArt(), w = s * 0.76, h = w * art.height / art.width;
      c.drawImage(art, Math.round(x - w / 2 + lunge), Math.round(y - h + bob), Math.round(w), Math.round(h));
      c.imageSmoothingEnabled = true;
      c.strokeStyle = 'rgba(230,210,255,' + (0.35 + l.zap).toFixed(3) + ')'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const k = Math.floor(l.t * 9 + i * 3.7), sx = x - 40 + ((k * 37) % 80), sy = y - h * 0.9 + ((k * 53) % Math.round(h * 0.7));
        c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 6, sy + 8); c.lineTo(sx + 1, sy + 11); c.lineTo(sx + 8, sy + 20); c.stroke();
      }
      c.lineWidth = 1;
      c.globalAlpha = l.a;
      this.text('×' + l.hits, x + w * 0.34, y - h * 0.86, { align: 'center', size: 18, bold: true, serif: true, col: l.hits >= 6 ? '#ffe080' : '#e8dcff' });
      c.restore();
    },

    drawNumby(c, n) {
      const { x, y, s } = this.numbySpot(n.u), bt = this.bt, hop = n.hop ? Math.sin(n.hop * Math.PI * 2) * 10 : 0, bob = Math.sin(n.t * 4) * 2;
      c.save();
      c.globalAlpha = n.a;
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x, y + 4, s * 0.32, 6, 0, 0, Math.PI * 2); c.fill();
      if (n.wind > 0) {
        const gr = c.createRadialGradient(x, y - s * 0.4, 4, x, y - s * 0.4, s * 0.9);
        gr.addColorStop(0, 'rgba(255,210,80,0.45)'); gr.addColorStop(1, 'rgba(255,210,80,0)');
        c.fillStyle = gr; c.fillRect(x - s, y - s * 1.3, s * 2, s * 1.6);
        for (let i = 0; i < 5; i++) { const a = n.t * 2 + i * 1.26; this.text('₵', x + Math.cos(a) * s * 0.55, y - s * 0.45 + Math.sin(a) * s * 0.3, { align: 'center', size: 9, bold: true, col: GOLD }); }
      }
      G.drawEnemy(c, { id: 'trotter' }, x, y - Math.abs(hop) + bob, s, { t: n.t, aura: false, flash: bt.flash.has(n.u) ? 0.5 : 0 });
      if (n.wind > 0) this.text('×' + n.wind, x + s * 0.4, y - s * 0.95, { align: 'center', size: 14, bold: true, col: GOLD });
      c.restore();
    },

    fivesIcon(c, u, x, y, size) {
      if (u.id === 'lord') {
        const gr = c.createLinearGradient(0, y, 0, y + size);
        gr.addColorStop(0, '#5a3aa8'); gr.addColorStop(1, '#1a0e3a');
        c.fillStyle = gr; c.fillRect(x, y, size, size);
        c.imageSmoothingEnabled = false;
        const art = lordArt(), h = size * 1.2, w = h * art.width / art.height;
        c.save(); c.beginPath(); c.rect(x, y, size, size); c.clip();
        c.drawImage(art, Math.round(x + size / 2 - w / 2), Math.round(y - size * 0.05), Math.round(w), Math.round(h));
        c.restore();
        c.imageSmoothingEnabled = true;
        const f = this.fivesUi(), n = f.lord && f.lord.u === u ? f.lord.hits : u.flags.hits;
        c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(x, y, 16, 10);
        this.text('×' + n, x + 1, y, { size: 9, bold: true, col: '#e8dcff' });
        return true;
      }
      if (u.id === 'numby') { G.foeIcon(c, { id: 'trotter', fam: 'trotter' }, x, y, size, { border: false }); return true; }
      return false;
    },

    fivesCard(c, u, x, y, tags, tx) {
      const b = this.game.battle;
      const pip = PIPS[u.charId];
      if (pip) {
        const n = u['d' + pip[0]] == null ? u.flags[pip[1]] || 0 : u['d' + pip[0]], max = pip[2], step = max > 6 ? 6 : 8;
        for (let k = 0; k < max; k++) this.diamond(x + 9 + k * step, y + 93, max > 6 ? 2.5 : 3, k < n ? pip[3] : '#20263e', '#0a1020');
        tx = x + 12 + max * step;
      }
      if (has(u, 'Знание')) tags.push('Знание');
      switch (u.charId) {
        case 'jingyuan': { const h = b && b.lordOf(u); if (h) tags.push('Удары ' + h.flags.hits); break; }
        case 'luocha':
          if (has(u, 'Зона Лочи')) tags.push('Зона ' + left(u, 'Зона Лочи'));
          else if (u.flags.lcCd > 0) tags.push('Молитва ' + u.flags.lcCd);
          break;
        case 'imbibitor':
          if (u.flags.tier) tags.unshift('Усил. ' + u.flags.tier);
          if (u.flags.right) tags.push('Сердце ' + u.flags.right);
          break;
        case 'fuxuan': if (has(u, 'Матрица предвидения')) tags.unshift('Матрица ' + left(u, 'Матрица предвидения')); break;
        case 'jingliu': if (u.flags.trans) tags.unshift('Трансм.'); break;
        case 'topaz': { const h = b && b.numbyOf(u); if (h && h.flags.wind > 0) tags.unshift('Рост ×' + h.flags.wind); break; }
        case 'huohuo': if (u.flags.prov > 0) tags.unshift('Жертв. ' + u.flags.prov + ' · ' + (u.flags.provN || 0)); break;
        case 'argenti': if (u.energy >= u.kit.ult.cost) tags.unshift(u.energy >= u.kit.grand.cost ? 'Ульта 180' : 'Ульта 90'); break;
      }
      return tx;
    },

    fivesCommands(c, b, u, x, y) {
      if (u.charId === 'imbibitor') {
        const tier = u.flags.tier || 0, have = b.sp + (u.flags.scales || 0);
        for (let lv = 3; lv >= 1; lv--) {
          const yy = y + (3 - lv) * 13, on = lv <= have, sel = tier >= lv;
          c.fillStyle = sel ? TEAL : on ? '#1e4a4a' : '#14182a'; c.fillRect(x, yy, 12, 10);
          c.strokeStyle = sel ? '#ffffff' : '#2a6a6a'; c.strokeRect(x + 0.5, yy + 0.5, 11, 9);
          this.text(String(lv), x + 6, yy, { align: 'center', size: 8, bold: true, col: sel ? '#0a1020' : on ? C.cream : C.dim });
        }
        this.text('E', x + 6, y + 40, { align: 'center', size: 8, col: C.sub });
        if (u.flags.scales) for (let i = 0; i < u.flags.scales; i++) this.diamond(x + 34 + (T.spMax + i) * 14, y - 40, 4, TEAL, '#0a2020');
      }
      if (u.charId === 'jingliu' && u.flags.trans) this.text('Трансмиграция: Сизигия ' + (u.flags.syz || 0), x + 84, y - 6, { align: 'center', size: 9, bold: true, col: ICE });
      if (u.charId === 'argenti' && u.energy >= u.kit.ult.cost) this.text(u.energy >= u.kit.grand.cost ? 'Большая ульта готова' : 'Малая ульта: 90 энергии', x + 84, y - 6, { align: 'center', size: 9, bold: true, col: ROSE });
      if (u.charId === 'huohuo' && u.flags.prov > 0) this.text('Жертвенность жизни: ' + (u.flags.provN || 0) + ' лечений', x + 84, y - 6, { align: 'center', size: 9, bold: true, col: MINT });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
