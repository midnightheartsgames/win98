(function (O) {
  'use strict';
  const PI = Math.PI;
  const FONT = (px, w) => `italic ${w || 700} ${Math.round(px)}px "Bahnschrift SemiBold Condensed","Bahnschrift Condensed","Arial Narrow","Arial Black",Impact,sans-serif`;
  const FONT_N = (px, w) => `${w || 400} ${Math.round(px)}px Tahoma,"Segoe UI",Arial,sans-serif`;
  O.HUD_FONT = FONT;
  const BLUE = '#3cc4ff', RED = '#ff4b4b', WHITE = '#ffffff', ULT = '#ffc43a', ARMOR = '#ffc640', SHIELD = '#8fd8ff';

  function para(ctx, x, y, w, h, sk) {
    ctx.beginPath(); ctx.moveTo(x + sk, y); ctx.lineTo(x + w + sk, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
  }
  function txt(ctx, s, x, y, px, col, align, o = {}) {
    ctx.font = o.normal ? FONT_N(px, o.weight) : FONT(px, o.weight);
    ctx.textAlign = align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(s, x + Math.max(1, px * 0.05), y + Math.max(1, px * 0.05)); }
    ctx.fillStyle = col;
    ctx.fillText(s, x, y);
  }
  function hex(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = PI / 6 + i * PI / 3; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath();
  }
  function icon(ctx, id, x, y, size, color) {
    const c = O.iconCanvas(id, Math.max(8, Math.round(size)), color);
    if (c) ctx.drawImage(c, x - size / 2, y - size / 2, size, size);
  }
  O.hudHelpers = { para, txt, hex, icon, FONT };

  const KEYNAME = { shift: 'Л. SHIFT', e: 'E', q: 'Q', fire2: 'ПКМ', fire: 'ЛКМ', slot: '2' };

  function abilityList(h) {
    const d = h.def, kit = d.kit;
    const out = [];
    const byKey = k => kit.find(x => x.key === k);
    const addCd = (key, it, cd, max, extra) => { if (it) out.push(Object.assign({ key, icon: it.icon, cd, max }, extra || {})); };
    if (h.heroId === 'tracer') addCd('shift', byKey('SHIFT'), h.k.blinks > 0 ? 0 : d.blink.cd - h.k.blinkT, d.blink.cd, { charges: h.k.blinks, maxCh: d.blink.charges });
    else if (h.heroId === 'junkrat') addCd('shift', byKey('SHIFT'), h.cd.shift || 0, d.mine.cd, { active: h.k.mine !== null });
    else if (h.heroId === 'torbjorn') addCd('shift', byKey('SHIFT'), h.cd.shift || 0, d.turret.cd, { active: !!h.k.turret });
    else if (h.heroId === 'lucio') addCd('shift', byKey('SHIFT'), 0, 1, { tag: h.k.song === 'heal' ? 'ЛЕЧЕНИЕ' : 'СКОРОСТЬ', tagCol: h.k.song === 'heal' ? ULT : '#7dff5a' });
    else if (byKey('SHIFT')) { const it = byKey('SHIFT'); const cdmax = { mccree: d.roll && d.roll.cd, soldier: 0, widowmaker: d.hook && d.hook.cd, reinhardt: d.charge && d.charge.cd, roadhog: d.hook && d.hook.cd, winston: d.jump && d.jump.cd, mercy: d.ga && d.ga.cd, zenyatta: 1 }[h.heroId] || 1; addCd('shift', it, h.cd.shift || 0, cdmax); }
    const e = byKey('E');
    if (e) {
      if (h.heroId === 'torbjorn') addCd('e', e, 0, 1, { tag: Math.floor(h.k.scrap) + '', tagCol: '#ffae3a', disabled: h.k.scrap < d.pack.cost });
      else { const cdmax = { mccree: d.flash && d.flash.cd, soldier: d.field && d.field.cd, tracer: d.recall && d.recall.cd, junkrat: d.trap && d.trap.cd, widowmaker: d.venom && d.venom.cd, reinhardt: d.strike && d.strike.cd, roadhog: d.breather && d.breather.cd, winston: d.bubble && d.bubble.cd, lucio: d.amp && d.amp.cd, zenyatta: 1 }[h.heroId] || 1; addCd('e', e, h.cd.e || 0, cdmax); }
    }
    const rmb = byKey('ПКМ');
    if (rmb && (h.heroId === 'soldier' || h.heroId === 'lucio')) addCd('fire2', rmb, h.cd.fire2 || 0, h.heroId === 'soldier' ? d.helix.cd : d.wave.cd);
    if (h.heroId === 'reinhardt') out.unshift({ key: 'fire2', icon: 'barrier', cd: h.cd.barrier || 0, max: d.barrier.breakCd, bar: h.k.bar ? h.k.bar.hp / d.barrier.hp : 1 });
    return out;
  }

  const Hud = {
    draw(ui, ctx, W, H) {
      const g = ui.game, p = ui.viewHero();
      const S = Math.min(H / 1080, W / 1500) * 1.12;
      ctx.clearRect(0, 0, W, H);
      if (!g) return;
      if (ui.mode === 'potg' || ui.mode === 'killcam') { this.replayOverlay(ui, ctx, W, H, S); return; }
      if (ui.overlay === 'heroes') return;
      this.world(ui, ctx, W, H, S);
      if (p && p.alive) {
        this.damageDir(ui, ctx, W, H, S);
        if (p.heroId === 'widowmaker' && p.vis.scope >= 0) this.scope(ui, ctx, W, H, S, p);
        this.crosshair(ui, ctx, W, H, S, p);
        this.hits(ui, ctx, W, H, S);
      }
      this.objective(ui, ctx, W, H, S);
      this.feed(ui, ctx, W, H, S);
      this.chat(ui, ctx, W, H, S);
      if (p && p.heroId) {
        if (p.alive) {
          this.vitals(ui, ctx, W, H, S, p);
          this.ult(ui, ctx, W, H, S, p);
          this.abilities(ui, ctx, W, H, S, p);
          this.status(ui, ctx, W, H, S, p);
        } else this.dead(ui, ctx, W, H, S, p);
      }
      this.notices(ui, ctx, W, H, S);
      this.phase(ui, ctx, W, H, S);
      if (ui.keys.tab) this.scoreboard(ui, ctx, W, H, S);
      if (ui.opts.fps) txt(ctx, Math.round(ui.fps) + ' FPS', W - 10, H - 10, 14 * S + 6, '#8f8', 'right', { normal: true });
    },

    world(ui, ctx, W, H, S) {
      const g = ui.game, R = ui.renderer, p = ui.viewHero();
      if (!R || !R.cam || !p) return;
      const team = p.team;
      const obj = O.MODES[g.mode].target(g);
      if (obj && g.phase !== 'end' && g.mode !== 'practice') {
        const y = obj.payload ? obj.y + 3 : obj.y + 2.2;
        const pr = R.project(obj.x, y, obj.z);
        let x, yy, off = false;
        if (pr && pr.x > 0.03 && pr.x < 0.97 && pr.y > 0.08 && pr.y < 0.9) { x = pr.x * W; yy = pr.y * H; }
        else {
          off = true;
          const ang = Math.atan2(obj.x - p.pos.x, obj.z - p.pos.z) - p.yaw;
          const s = -Math.sin(ang), c = Math.cos(ang);
          const behind = pr === null;
          x = W / 2 + (behind ? Math.sign(s || 1) : s) * W * 0.44; yy = H * 0.45 - (behind ? -1 : c) * H * 0.08;
          x = Math.max(40 * S, Math.min(W - 40 * S, x));
        }
        const att = g.mode === 'control' ? true : g.roleOf(team) === 'att';
        let col = WHITE;
        if (g.mode === 'control') col = g.obj.owner === -1 ? WHITE : g.obj.owner === team ? BLUE : RED;
        else col = att ? RED : BLUE;
        const name = obj.payload ? 'P' : g.mode === 'control' ? '' : (g.obj.idx ? 'Б' : 'A');
        const sz = 24 * S;
        ctx.save();
        ctx.translate(x, yy);
        ctx.rotate(PI / 4);
        ctx.fillStyle = col; ctx.globalAlpha = 0.9;
        ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
        ctx.restore();
        ctx.globalAlpha = 1;
        if (g.mode === 'control' && g.obj.locked) icon(ctx, 'lock', x, yy, sz * 0.8, '#fff');
        else txt(ctx, name, x, yy + 7 * S, 20 * S, '#fff', 'center', { shadow: false });
        const label = obj.payload ? (att ? 'СОПРОВОЖДАЙТЕ' : 'ОСТАНОВИТЕ') : g.mode === 'control' ? (g.obj.owner === team ? 'УДЕРЖИВАЙТЕ' : 'ЗАХВАТИТЕ') : (att ? 'АТАКУЙТЕ' : 'ЗАЩИЩАЙТЕ');
        txt(ctx, label, x, yy + 36 * S, 17 * S, col, 'center');
        if (!off) { const d = Math.hypot(obj.x - p.pos.x, obj.z - p.pos.z); if (d > 12) txt(ctx, Math.round(d) + ' м', x, yy + 54 * S, 13 * S, '#fff', 'center'); }
      }
      for (const h of g.heroes) {
        if (!h.alive || h === p || !h.heroId) continue;
        const ally = h.team === team;
        const pr = R.project(h.pos.x, h.pos.y + ui.heroTop(h) + 0.35, h.pos.z);
        if (!pr || pr.x < 0 || pr.x > 1 || pr.y < 0 || pr.y > 1) continue;
        const x = pr.x * W, y = pr.y * H;
        if (ally) {
          if (ui.opts.names !== false) {
            txt(ctx, h.name.toUpperCase(), x, y - 10 * S, 15 * S, BLUE, 'center');
            ctx.fillStyle = BLUE; ctx.beginPath(); ctx.moveTo(x - 7 * S, y - 4 * S); ctx.lineTo(x + 7 * S, y - 4 * S); ctx.lineTo(x, y + 3 * S); ctx.closePath(); ctx.fill();
          }
          const f = (h.hp + h.armor + h.shield) / (h.maxHp + h.maxArmor + h.maxShield);
          if (f < 0.5 && p.def.role === 'support') icon(ctx, 'heal', x, y - 30 * S, 16 * S, f < 0.3 ? RED : ULT);
          if (h.aux.callT && ui.game.t - h.aux.callT < 4) icon(ctx, 'heal', x + 22 * S, y - 12 * S, 16 * S, '#ff6060');
        } else {
          const recent = h.lastHurt > g.t - 3 || ui.aimTarget === h.id;
          if (!recent) continue;
          if (!ui.visible(h)) continue;
          const tot = h.maxHp + h.maxArmor + h.maxShield;
          const bw = 70 * S, bh = 7 * S;
          ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - bw / 2 - 1, y - 1, bw + 2, bh + 2);
          let xx = x - bw / 2;
          const seg = (v, c) => { if (v <= 0) return; const w = bw * v / tot; ctx.fillStyle = c; ctx.fillRect(xx, y, w, bh); xx += w; };
          seg(h.hp, RED); seg(h.armor + h.packArmor, ARMOR); seg(h.shield, SHIELD); seg(h.temp, '#b8ff9a');
          if (ui.opts.names !== false && ui.aimTarget === h.id) txt(ctx, h.name.toUpperCase(), x, y - 6 * S, 13 * S, RED, 'center');
        }
      }
      if (p.heroId === 'mccree' && p.ultOn === 'deadeye') {
        for (const h of g.heroes) {
          if (!h.alive || h.team === team) continue;
          const m = (p.k.marks || {})[h.id] || 0;
          if (!p.k.vis || !p.k.vis[h.id]) continue;
          const pr = R.project(h.pos.x, h.pos.y + ui.heroTop(h) * 0.6, h.pos.z);
          if (!pr) continue;
          const x = pr.x * W, y = pr.y * H;
          const ready = m >= h.hp + h.armor + h.shield + h.temp;
          ctx.strokeStyle = ready ? RED : '#fff'; ctx.lineWidth = 3 * S;
          const r = 34 * S * (ready ? 1 : 1.4 - Math.min(1, m / (h.hp + 1)) * 0.4);
          ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.stroke();
          if (ready) icon(ctx, 'skull', x, y, 28 * S, RED);
        }
      }
      for (const pk of g.pickups) {
        if (pk.t > 0) continue;
        const pr = R.project(pk.x, pk.y + 1.4, pk.z);
        if (!pr || pr.x < 0 || pr.x > 1 || pr.y < 0 || pr.y > 1) continue;
        if (p.hp >= p.maxHp || Math.hypot(pk.x - p.pos.x, pk.z - p.pos.z) > 25) continue;
        icon(ctx, 'heal', pr.x * W, pr.y * H, 14 * S, pk.big ? ULT : '#7dff5a');
      }
    },

    vitals(ui, ctx, W, H, S, p) {
      const cx = 170 * S, cy = H - 125 * S, r = 64 * S;
      ctx.save();
      hex(ctx, cx, cy, r + 6 * S);
      const gr = ctx.createLinearGradient(0, cy - r, 0, cy + r);
      gr.addColorStop(0, 'rgba(230,240,255,0.95)'); gr.addColorStop(1, 'rgba(120,170,220,0.95)');
      ctx.fillStyle = gr; ctx.fill();
      hex(ctx, cx, cy, r);
      ctx.fillStyle = 'rgba(40,60,90,0.95)'; ctx.fill();
      ctx.clip();
      const por = ui.portrait(p.heroId, p.skin);
      if (por) ctx.drawImage(por, cx - r * 1.05, cy - r * 1.05, r * 2.1, r * 2.1);
      ctx.restore();
      ctx.fillStyle = '#1a2a44'; ctx.fillRect(cx - 18 * S, cy + r - 6 * S, 36 * S, 22 * S);
      ctx.strokeStyle = '#d8e4f4'; ctx.lineWidth = 2 * S; ctx.strokeRect(cx - 18 * S, cy + r - 6 * S, 36 * S, 22 * S);
      txt(ctx, String(ui.profile.level), cx, cy + r + 11 * S, 17 * S, '#fff', 'center', { shadow: false });
      const total = p.hp + p.armor + p.packArmor + p.shield + p.temp;
      const max = p.maxHp + p.maxArmor + p.maxShield;
      const x0 = cx + r + 26 * S, y0 = cy - 30 * S;
      txt(ctx, String(Math.ceil(total)), x0, y0, 58 * S, total / max < 0.35 ? RED : WHITE);
      ctx.font = FONT(58 * S);
      const w1 = ctx.measureText(String(Math.ceil(total))).width;
      txt(ctx, '/' + Math.round(max), x0 + w1 + 6 * S, y0, 26 * S, 'rgba(255,255,255,0.8)');
      const segHp = 25;
      const barW = Math.min(360, 250 + (max - 200) * 0.25) * S, bh = 24 * S;
      const n = Math.ceil((max + p.temp + p.packArmor) / segHp);
      const gap = Math.max(1.5, 3 * S * Math.min(1, 16 / n));
      const sw = (barW - gap * (n - 1)) / n;
      const pools = [[p.hp, total / max < 0.35 ? '#ff7070' : WHITE, p.maxHp], [p.armor + p.packArmor, ARMOR, p.maxArmor + p.packArmor], [p.shield, SHIELD, p.maxShield], [p.temp, '#b8ff9a', p.temp]];
      let seg = 0;
      const by = y0 + 14 * S;
      for (const [val, color, cap] of pools) {
        const nseg = Math.ceil(cap / segHp);
        for (let i = 0; i < nseg; i++) {
          const fill = Math.max(0, Math.min(1, (val - i * segHp) / segHp));
          const x = x0 + seg * (sw + gap);
          para(ctx, x, by, sw, bh, -4 * S);
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
          if (fill > 0) { para(ctx, x, by + bh * (1 - fill), sw, bh * fill, -4 * S * fill); ctx.fillStyle = color; ctx.fill(); }
          seg++;
        }
      }
    },

    ult(ui, ctx, W, H, S, p) {
      const cx = W / 2, cy = H - 150 * S, r = 52 * S;
      const f = p.ultOn ? 1 : p.ult / p.def.ultCost;
      const ready = f >= 1 && !p.ultOn;
      const t = ui.clock;
      ctx.lineWidth = 7 * S;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, PI * 2); ctx.stroke();
      const segs = 40;
      for (let i = 0; i < segs; i++) {
        const a0 = -PI / 2 + i / segs * PI * 2 + 0.02, a1 = -PI / 2 + (i + 1) / segs * PI * 2 - 0.02;
        if (i / segs >= f) break;
        ctx.strokeStyle = ready ? `rgba(255,${200 + 40 * Math.sin(t * 6)},90,1)` : ULT;
        ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
      }
      if (ready) {
        ctx.fillStyle = `rgba(255,190,60,${0.25 + 0.15 * Math.sin(t * 5)})`;
        ctx.beginPath(); ctx.arc(cx, cy, r - 8 * S, 0, PI * 2); ctx.fill();
        const it = p.def.kit.find(k => k.ult);
        icon(ctx, it ? it.icon : 'star', cx, cy, 52 * S, '#fff');
      } else if (p.ultOn) {
        const it = p.def.kit.find(k => k.ult);
        icon(ctx, it ? it.icon : 'star', cx, cy, 46 * S, ULT);
      } else txt(ctx, Math.floor(f * 100) + '%', cx, cy + 14 * S, 40 * S, WHITE, 'center');
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(cx, cy + r + 24 * S, 13 * S, 0, PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5 * S; ctx.stroke();
      txt(ctx, 'Q', cx, cy + r + 30 * S, 16 * S, WHITE, 'center', { shadow: false });
    },

    abilities(ui, ctx, W, H, S, p) {
      const list = abilityList(p);
      const bw = 74 * S, bh = 64 * S, gap = 10 * S;
      const right = W - 260 * S;
      let x = right - list.length * (bw + gap);
      const y = H - 150 * S;
      for (const a of list) {
        const cool = a.cd > 0.05;
        para(ctx, x, y, bw, bh, 12 * S);
        ctx.fillStyle = a.active ? 'rgba(255,200,80,0.55)' : cool || a.disabled ? 'rgba(20,30,50,0.55)' : 'rgba(255,255,255,0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2 * S; ctx.stroke();
        icon(ctx, a.icon, x + bw / 2 + 6 * S, y + bh / 2, 42 * S, cool || a.disabled ? 'rgba(255,255,255,0.45)' : a.active ? '#fff' : '#26334a');
        if (cool) txt(ctx, a.cd >= 1 ? String(Math.ceil(a.cd)) : a.cd.toFixed(1), x + bw / 2 + 6 * S, y + bh / 2 + 12 * S, 34 * S, WHITE, 'center');
        if (a.charges !== undefined) for (let i = 0; i < a.maxCh; i++) { para(ctx, x + 10 * S + i * 18 * S, y - 12 * S, 14 * S, 6 * S, 3 * S); ctx.fillStyle = i < a.charges ? BLUE : 'rgba(255,255,255,0.3)'; ctx.fill(); }
        if (a.bar !== undefined) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 8 * S, y - 12 * S, bw - 4 * S, 6 * S); ctx.fillStyle = SHIELD; ctx.fillRect(x + 8 * S, y - 12 * S, (bw - 4 * S) * a.bar, 6 * S); }
        if (a.tag) txt(ctx, a.tag, x + bw / 2 + 6 * S, y - 8 * S, 14 * S, a.tagCol || WHITE, 'center');
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        const kn = KEYNAME[a.key] || a.key.toUpperCase();
        ctx.font = FONT(14 * S); const kw = ctx.measureText(kn).width + 12 * S;
        para(ctx, x + bw / 2 - kw / 2, y + bh + 6 * S, kw, 20 * S, 4 * S); ctx.fill();
        txt(ctx, kn, x + bw / 2 + 2 * S, y + bh + 21 * S, 14 * S, WHITE, 'center', { shadow: false });
        x += bw + gap;
      }
      const ax = W - 90 * S, ay = H - 118 * S;
      if (p.maxAmmo > 0 && !(p.heroId === 'mercy' && p.weapon === 0) && !(p.heroId === 'torbjorn' && p.weapon === 1)) {
        const am = Math.ceil(p.ammo);
        txt(ctx, String(am), ax - 34 * S, ay - 30 * S, 50 * S, am <= p.maxAmmo * 0.25 ? RED : WHITE, 'right');
        txt(ctx, '/' + p.maxAmmo, ax - 30 * S, ay - 30 * S, 24 * S, 'rgba(255,255,255,0.8)', 'left');
        if (p.reloadT > 0) txt(ctx, 'ПЕРЕЗАРЯДКА', ax - 30 * S, ay - 80 * S, 16 * S, ULT, 'center');
        else if (am <= p.maxAmmo * 0.2) txt(ctx, 'R — ПЕРЕЗАРЯДИТЬ', W / 2, H / 2 + 70 * S, 18 * S, ULT, 'center');
      }
      const wicon = p.def.kit[p.heroId === 'mercy' || p.heroId === 'torbjorn' ? (p.weapon === 1 ? 1 : 0) : 0].icon;
      icon(ctx, wicon, ax - 20 * S, ay + 2 * S, 58 * S, 'rgba(255,255,255,0.9)');
      ctx.strokeStyle = BLUE; ctx.lineWidth = 3 * S;
      ctx.beginPath(); ctx.moveTo(ax + 28 * S, ay - 60 * S); ctx.lineTo(ax + 14 * S, ay + 28 * S); ctx.stroke();
    },

    status(ui, ctx, W, H, S, p) {
      const st = p.st;
      let s = null;
      if (st.stun > 0 || st.knock > 0) s = 'ОГЛУШЕНИЕ';
      else if (st.hooked > 0) s = 'ЗАХВАЧЕН';
      else if (st.root > 0) s = 'В КАПКАНЕ';
      else if (st.poison > 0) s = 'ОТРАВЛЕНИЕ';
      if (s) txt(ctx, s, W / 2, H / 2 + 110 * S, 26 * S, RED, 'center');
      const b = [];
      if (st.boost > 0) b.push(['УРОН +30%', BLUE]);
      if (st.discord > 0) b.push(['РАЗДОР', '#d070ff']);
      if (st.harmony > 0) b.push(['ГАРМОНИЯ', ULT]);
      if (st.song > 0) b.push(['СКОРОСТЬ', '#7dff5a']);
      if (st.healSong > 0) b.push(['ЛЕЧЕНИЕ', '#ffe07a']);
      if (p.packArmor > 0) b.push(['БРОНЕПАКЕТ', ARMOR]);
      b.forEach(([name, col], i) => txt(ctx, name, 250 * S, H - 230 * S - i * 22 * S, 16 * S, col, 'left'));
      if (p.ultOn) {
        const dur = { deadeye: p.def.deadeye && p.def.deadeye.dur, visor: p.def.visor && p.def.visor.dur, molten: p.def.molten && p.def.molten.dur, infra: p.def.infra && p.def.infra.dur, hog: p.def.hog && p.def.hog.dur, rage: p.def.rage && p.def.rage.dur, trans: p.def.trans && p.def.trans.dur, tire: p.def.tire && p.def.tire.dur }[p.ultOn];
        if (dur) {
          const left = p.ultOn === 'tire' ? Math.max(0, dur - ((ui.game.deploy.find(d => d.id === p.k.tire) || { age: 0 }).age)) : Math.max(0, dur - p.ultT);
          const w = 240 * S, x = W / 2 - w / 2, y = H - 270 * S;
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x, y, w, 8 * S);
          ctx.fillStyle = ULT; ctx.fillRect(x, y, w * left / dur, 8 * S);
        }
      }
      if (p.heroId === 'zenyatta' && p.vis.volley) txt(ctx, 'x' + p.vis.volley, W / 2 + 40 * S, H / 2 + 8 * S, 22 * S, ULT, 'left');
    },

    crosshair(ui, ctx, W, H, S, p) {
      const cx = W / 2, cy = H / 2;
      const style = p.def.cross;
      const col = ui.opts.xcol || '#6fff6f';
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.5, 2 * S);
      const spread = (p.heroId === 'soldier' && p.k.shots > 2) ? Math.min(20, (p.k.shots - 2) * 2) * S : 0;
      if (style === 'widow' && p.vis.scope >= 0) return;
      if (style === 'dot') { ctx.beginPath(); ctx.arc(cx, cy, 2.5 * S, 0, PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy, 16 * S, 0, PI * 2); ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1; }
      else if (style === 'cross' || style === 'tracer' || style === 'widow') {
        const g0 = (style === 'tracer' ? 10 : 6) * S + spread, l = 9 * S;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.beginPath(); ctx.moveTo(cx + dx * g0, cy + dy * g0); ctx.lineTo(cx + dx * (g0 + l), cy + dy * (g0 + l)); ctx.stroke(); }
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
      } else if (style === 'circle') { ctx.beginPath(); ctx.arc(cx, cy, (p.heroId === 'roadhog' ? 42 : 26) * S, 0, PI * 2); ctx.stroke(); ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3); }
      else if (style === 'rein') { ctx.beginPath(); ctx.arc(cx, cy, 30 * S, PI * 0.15, PI * 0.85); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 30 * S, PI * 1.15, PI * 1.85); ctx.stroke(); }
      else if (style === 'mercy') {
        ctx.beginPath(); ctx.arc(cx, cy, 20 * S, 0, PI * 2); ctx.stroke(); ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
        if (p.weapon === 0 && p.k.beamTo === null && (p.inp.fire || p.inp.fire2)) txt(ctx, 'НЕТ ЦЕЛИ', cx, cy + 50 * S, 14 * S, '#fff', 'center');
      } else if (style === 'zen') { ctx.beginPath(); ctx.arc(cx, cy, 12 * S, 0, PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 3 * S, 0, PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(cx, cy, 3 * S, 0, PI * 2); ctx.fill(); }
      if (p.heroId === 'winston' && !p.ultOn) { ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(cx, cy, 90 * S, 0, PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    },

    scope(ui, ctx, W, H, S, p) {
      const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.46;
      ctx.save();
      ctx.fillStyle = 'rgba(10,0,20,0.92)';
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, r, 0, PI * 2, true); ctx.fill();
      ctx.strokeStyle = 'rgba(220,120,255,0.8)'; ctx.lineWidth = 3 * S;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,90,200,0.9)'; ctx.lineWidth = 1.5 * S;
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx - 12 * S, cy); ctx.moveTo(cx + 12 * S, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy - 12 * S); ctx.moveTo(cx, cy + 12 * S); ctx.lineTo(cx, cy + r); ctx.stroke();
      ctx.fillStyle = '#ff60d0'; ctx.fillRect(cx - 2, cy - 2, 4, 4);
      const ch = Math.max(0, p.vis.scope);
      ctx.strokeStyle = ch >= 1 ? '#ff4ad8' : 'rgba(255,255,255,0.8)'; ctx.lineWidth = 6 * S;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.28, PI * 0.6, PI * 0.6 + PI * 0.8 * ch); ctx.stroke();
      txt(ctx, Math.round(ch * 100) + '%', cx - r * 0.3, cy + r * 0.3, 20 * S, ch >= 1 ? '#ff4ad8' : '#fff', 'center');
      ctx.restore();
    },

    hits(ui, ctx, W, H, S) {
      const cx = W / 2, cy = H / 2, t = ui.clock;
      for (const h of ui.hud.hits) {
        const age = t - h.t;
        if (age > 0.25) continue;
        const a = 1 - age / 0.25;
        ctx.strokeStyle = h.kill ? `rgba(255,60,60,${a})` : h.crit ? `rgba(255,220,80,${a})` : `rgba(255,255,255,${a})`;
        ctx.lineWidth = (h.kill ? 4 : 2.5) * S;
        const g0 = 8 * S, l = (h.kill ? 14 : 10) * S;
        for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { ctx.beginPath(); ctx.moveTo(cx + dx * g0, cy + dy * g0); ctx.lineTo(cx + dx * (g0 + l), cy + dy * (g0 + l)); ctx.stroke(); }
      }
    },

    damageDir(ui, ctx, W, H, S) {
      const p = ui.viewHero(), t = ui.clock;
      for (const d of ui.hud.hurt) {
        const age = t - d.t;
        if (age > 1) continue;
        const ang = Math.atan2(d.x - p.pos.x, d.z - p.pos.z) - p.yaw;
        const a = -ang - PI / 2;
        ctx.strokeStyle = `rgba(255,40,40,${0.8 * (1 - age)})`;
        ctx.lineWidth = 10 * S;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, 130 * S, a - 0.3, a + 0.3); ctx.stroke();
      }
      const hurtA = Math.max(0, 1 - (t - (ui.hud.hurtT || -9)) * 2.5);
      const low = p.hp / p.maxHp < 0.3 ? 0.35 + 0.15 * Math.sin(t * 6) : 0;
      const a = Math.max(hurtA * 0.35, low);
      if (a > 0.01) {
        const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
        gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(190,0,0,${a})`);
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      }
    },

    objective(ui, ctx, W, H, S) {
      const g = ui.game, p = ui.viewHero();
      const team = p ? p.team : 0;
      const hud = O.MODES[g.mode].hud(g);
      const cx = W / 2, top = 28 * S;
      const att = g.mode === 'control' || g.roleOf(team) === 'att';
      const flash = Math.sin(ui.clock * 8) > 0;
      if (hud.kind === 'practice') {
        if (!hud.tut) { txt(ctx, 'ТРЕНИРОВОЧНЫЙ ПОЛИГОН', cx, top + 30 * S, 26 * S, WHITE, 'center'); txt(ctx, 'H — СМЕНИТЬ ГЕРОЯ', cx, top + 54 * S, 15 * S, '#cde', 'center'); return; }
        const tu = hud.tut, pop = Math.min(1, tu.t * 4), bw = 560 * S, bh = 78 * S, bx = cx - bw / 2, by = top + 8 * S - (1 - pop) * 20 * S;
        ctx.save();
        ctx.globalAlpha = pop;
        ctx.fillStyle = 'rgba(12,20,36,0.78)'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#f39c26'; ctx.fillRect(bx, by, 6 * S, bh);
        txt(ctx, 'ОБУЧЕНИЕ ' + (tu.step + 1) + '/' + tu.n + ' · ' + tu.title, bx + 22 * S, by + 28 * S, 20 * S, '#f5b04a', 'left');
        txt(ctx, tu.text, bx + 22 * S, by + 56 * S, 15 * S, WHITE, 'left');
        for (let i = 0; i < tu.n; i++) { ctx.fillStyle = i < tu.step ? '#f39c26' : i === tu.step ? '#ffffff' : 'rgba(255,255,255,0.25)'; ctx.fillRect(bx + bw - (tu.n - i) * 16 * S - 8 * S, by + 12 * S, 10 * S, 4 * S); }
        ctx.restore();
        return;
      }
      const timeStr = hud.overtime ? 'ОВЕРТАЙМ' : O.fmtClock(hud.time);
      if (hud.kind === 'points') {
        const n = hud.pts.length;
        let x = cx - 150 * S - (n - 1) * 30 * S;
        hud.pts.forEach((pt, i) => {
          const sz = 34 * S, col = pt.done ? (att ? BLUE : RED) : pt.locked ? 'rgba(200,200,200,0.5)' : (att ? RED : BLUE);
          ctx.save(); ctx.translate(x, top + 24 * S); ctx.rotate(PI / 4);
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-sz / 2 - 3, -sz / 2 - 3, sz + 6, sz + 6);
          ctx.fillStyle = pt.locked ? 'rgba(120,120,130,0.6)' : col; ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
          ctx.restore();
          if (pt.locked) icon(ctx, 'lock', x, top + 24 * S, 22 * S, '#fff');
          else txt(ctx, pt.name, x, top + 32 * S, 24 * S, '#fff', 'center', { shadow: false });
          if (!pt.locked && !pt.done && pt.prog > 0) {
            ctx.strokeStyle = WHITE; ctx.lineWidth = 4 * S;
            ctx.beginPath(); ctx.arc(x, top + 24 * S, 30 * S, -PI / 2, -PI / 2 + PI * 2 * pt.prog); ctx.stroke();
            for (const tk of [1 / 3, 2 / 3]) { const a = -PI / 2 + PI * 2 * tk; ctx.fillStyle = '#222'; ctx.fillRect(x + Math.cos(a) * 30 * S - 2, top + 24 * S + Math.sin(a) * 30 * S - 2, 4, 4); }
          }
          if (i === hud.cur && hud.contested && flash) txt(ctx, '!', x + 26 * S, top + 10 * S, 22 * S, ULT, 'center');
          x += 62 * S;
        });
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(cx - 30 * S, top + 2 * S, 3 * S, 46 * S);
        txt(ctx, timeStr, cx - 18 * S, top + 36 * S, 40 * S, hud.overtime && flash ? ULT : WHITE, 'left');
        const label = hud.overtime ? '' : (att ? 'АТАКУЙТЕ ОБЪЕКТ ' : 'ЗАЩИЩАЙТЕ ОБЪЕКТ ') + (hud.pts[hud.cur] ? hud.pts[hud.cur].name : '');
        txt(ctx, label, cx - 18 * S, top + 58 * S, 17 * S, WHITE, 'left');
        if (hud.overtime) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(cx - 18 * S, top + 48 * S, 160 * S, 6 * S); ctx.fillStyle = ULT; ctx.fillRect(cx - 18 * S, top + 48 * S, 160 * S * Math.max(0, hud.otFuse / 3), 6 * S); }
      } else if (hud.kind === 'payload') {
        const w = 360 * S, x = cx - w / 2;
        ctx.fillStyle = 'rgba(20,20,30,0.45)'; ctx.fillRect(x - 10 * S, top - 4 * S, w + 20 * S, 72 * S);
        txt(ctx, timeStr, x + 4 * S, top + 26 * S, 30 * S, hud.overtime && flash ? ULT : ULT, 'left');
        txt(ctx, att ? 'СОПРОВОЖДАЙТЕ ГРУЗ' : 'ОСТАНОВИТЕ ГРУЗ', x + 90 * S, top + 24 * S, 20 * S, WHITE, 'left');
        const by = top + 44 * S, bh = 10 * S;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, by, w, bh);
        ctx.fillStyle = att ? BLUE : RED; ctx.fillRect(x, by, w * Math.max(0, Math.min(1, hud.frac)), bh);
        for (const c of hud.cps) { ctx.fillStyle = '#fff'; ctx.fillRect(x + w * c - 2 * S, by - 4 * S, 4 * S, bh + 8 * S); }
        const px = x + w * Math.max(0, Math.min(1, hud.frac));
        ctx.save(); ctx.translate(px, by - 12 * S); ctx.rotate(PI / 4); ctx.fillStyle = att ? BLUE : RED; ctx.fillRect(-9 * S, -9 * S, 18 * S, 18 * S); ctx.restore();
        txt(ctx, 'P', px, by - 5 * S, 14 * S, '#fff', 'center', { shadow: false });
        const st = hud.contested ? '!' : hud.moving > 0 ? '▶'.repeat(Math.min(3, hud.attN)) : hud.moving < 0 ? '◀' : '';
        if (st) txt(ctx, st, px + 18 * S, by - 4 * S, 16 * S, hud.contested ? ULT : WHITE, 'left');
      } else if (hud.kind === 'control') {
        const bw = 110 * S, bh = 44 * S;
        const mine = hud.pct[team], theirs = hud.pct[1 - team];
        const drawBox = (x, pct, col, own) => {
          para(ctx, x, top, bw, bh, 10 * S); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
          para(ctx, x, top + bh - 6 * S, bw * pct / 100, 6 * S, 2 * S); ctx.fillStyle = col; ctx.fill();
          txt(ctx, Math.floor(pct) + '%', x + bw / 2 + 5 * S, top + 32 * S, 30 * S, own ? col : '#fff', 'center');
        };
        drawBox(cx - bw - 58 * S, mine, BLUE, hud.owner === team);
        drawBox(cx + 58 * S, theirs, RED, hud.owner === 1 - team);
        const sz = 40 * S;
        ctx.save(); ctx.translate(cx, top + 22 * S); ctx.rotate(PI / 4);
        ctx.fillStyle = hud.owner === -1 ? 'rgba(230,230,230,0.9)' : hud.owner === team ? BLUE : RED;
        ctx.fillRect(-sz / 2, -sz / 2, sz, sz); ctx.restore();
        if (hud.locked) { icon(ctx, 'lock', cx, top + 22 * S, 22 * S, '#333'); txt(ctx, O.fmtClock(hud.lockT), cx, top + 76 * S, 18 * S, WHITE, 'center'); }
        if (hud.cap > 0 && hud.capTeam >= 0) { ctx.strokeStyle = hud.capTeam === team ? BLUE : RED; ctx.lineWidth = 5 * S; ctx.beginPath(); ctx.arc(cx, top + 22 * S, 34 * S, -PI / 2, -PI / 2 + PI * 2 * hud.cap); ctx.stroke(); }
        for (let i = 0; i < 2; i++) {
          ctx.fillStyle = i < hud.wins[team] ? BLUE : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(cx - bw - 58 * S + 16 * S + i * 18 * S, top + bh + 14 * S, 6 * S, 0, PI * 2); ctx.fill();
          ctx.fillStyle = i < hud.wins[1 - team] ? RED : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(cx + 58 * S + bw - 16 * S - i * 18 * S, top + bh + 14 * S, 6 * S, 0, PI * 2); ctx.fill();
        }
        if (hud.contested && flash) txt(ctx, 'ТОЧКА ОСПАРИВАЕТСЯ', cx, top + 96 * S, 16 * S, ULT, 'center');
        if (hud.overtime) txt(ctx, 'ОВЕРТАЙМ', cx, top + 112 * S, 22 * S, flash ? ULT : WHITE, 'center');
      }
    },

    feed(ui, ctx, W, H, S) {
      const g = ui.game, p = ui.viewHero(), t = g.t;
      const team = p ? p.team : 0;
      const items = g.feed.filter(f => t - f.t < 7).slice(-6);
      let y = 22 * S;
      for (const f of items) {
        const k = f.killer >= 0 ? g.heroes[f.killer] : null, v = g.heroes[f.victim];
        if (!v) continue;
        const hs = 30 * S;
        ctx.font = FONT(17 * S);
        const kn = k ? k.name : '', vn = v.name;
        const kw = k ? ctx.measureText(kn).width : 0, vw = ctx.measureText(vn).width;
        const total = (k ? kw + hs + 12 * S : 0) + 44 * S + hs + vw + 22 * S;
        const x0 = W - 24 * S - total;
        const mine = (k && k === p) || v === p;
        ctx.fillStyle = mine ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.38)';
        ctx.fillRect(x0 - 6 * S, y, total + 12 * S, 36 * S);
        let x = x0;
        if (k) {
          txt(ctx, kn, x, y + 25 * S, 17 * S, k.team === team ? BLUE : RED, 'left');
          x += kw + 6 * S;
          const pk = ui.portrait(k.heroId, k.skin);
          if (pk) { ctx.drawImage(pk, x, y + 3 * S, hs, hs); ctx.strokeStyle = k.team === team ? BLUE : RED; ctx.lineWidth = 2; ctx.strokeRect(x, y + 3 * S, hs, hs); }
          x += hs + 6 * S;
        }
        const ic = O.hasIcon(f.icon) ? f.icon : (O.HEROES[f.icon] ? ((O.HEROES[f.icon].kit[0] || {}).icon || 'skull') : 'skull');
        icon(ctx, f.env ? 'fall' : ic, x + 14 * S, y + 18 * S, 24 * S, f.crit ? ULT : '#fff');
        if (f.crit) icon(ctx, 'skull', x + 32 * S, y + 10 * S, 12 * S, ULT);
        x += 38 * S;
        const pv = ui.portrait(v.heroId, v.skin);
        if (pv) { ctx.drawImage(pv, x, y + 3 * S, hs, hs); ctx.strokeStyle = v.team === team ? BLUE : RED; ctx.lineWidth = 2; ctx.strokeRect(x, y + 3 * S, hs, hs); }
        x += hs + 6 * S;
        txt(ctx, vn, x, y + 25 * S, 17 * S, v.team === team ? BLUE : RED, 'left');
        y += 40 * S;
      }
    },

    chat(ui, ctx, W, H, S) {
      const g = ui.game, p = ui.viewHero();
      const lines = ui.hud.chat.filter(c => ui.clock - c.t < 12).slice(-7);
      let y = H - 290 * S - lines.length * 20 * S;
      for (const c of lines) {
        const a = Math.min(1, (12 - (ui.clock - c.t)) / 2);
        ctx.globalAlpha = a;
        const sys = c.from === undefined || c.from < 0;
        const h = sys ? null : g.heroes[c.from];
        const col = sys ? '#9fdcff' : (p && h && h.team === p.team ? '#7fd4ff' : '#ff9a8a');
        txt(ctx, (h ? '[' + h.name + ']: ' : '') + c.text, 30 * S, y, 16 * S, col, 'left', { normal: true });
        ctx.globalAlpha = 1;
        y += 20 * S;
      }
    },

    notices(ui, ctx, W, H, S) {
      const t = ui.clock;
      const list = ui.hud.notices.filter(n => t - n.t < 2.6);
      let y = H * 0.66;
      for (const n of list.slice(-4)) {
        const a = Math.min(1, (2.6 - (t - n.t)) * 2);
        ctx.globalAlpha = a;
        const px = (n.big ? 30 : 22) * S;
        if (n.parts) {
          ctx.font = FONT(px);
          const ws = n.parts.map(q => ctx.measureText(q[0]).width), gap = 10 * S;
          let x = W / 2 - (ws.reduce((s, w) => s + w, 0) + gap * (ws.length - 1)) / 2;
          if (n.icon) icon(ctx, n.icon, x - 22 * S, y - 9 * S, 26 * S, n.parts[1] ? n.parts[1][1] : '#fff');
          n.parts.forEach((q, i) => { txt(ctx, q[0], x, y, px, q[1], 'left'); x += ws[i] + gap; });
        } else {
          if (n.icon) icon(ctx, n.icon, W / 2 - (n.text.length * 6 + 26) * S, y - 8 * S, 26 * S, n.col || '#fff');
          txt(ctx, n.text, W / 2, y, px, n.col || WHITE, 'center');
        }
        ctx.globalAlpha = 1;
        y += 30 * S;
      }
      const an = ui.hud.announce;
      if (an && t - an.t < 3.2) {
        const a = Math.min(1, (3.2 - (t - an.t)) * 2);
        ctx.globalAlpha = a;
        txt(ctx, an.text.toUpperCase(), W / 2, H * 0.24, 34 * S, an.col || WHITE, 'center');
        ctx.globalAlpha = 1;
      }
      const ul = ui.hud.ultLine;
      if (ul && t - ul.t < 2.5) {
        ctx.globalAlpha = Math.min(1, (2.5 - (t - ul.t)) * 2);
        txt(ctx, ul.text, W / 2, H * 0.78, 22 * S, ul.col, 'center');
        ctx.globalAlpha = 1;
      }
    },

    phase(ui, ctx, W, H, S) {
      const g = ui.game, p = ui.viewHero();
      if (!p) return;
      const att = g.mode === 'control' || g.roleOf(p.team) === 'att';
      if (g.phase === 'setup') {
        txt(ctx, att ? 'ПОДГОТОВКА К АТАКЕ' : 'ПОДГОТОВКА К ОБОРОНЕ', W / 2, 150 * S, 30 * S, WHITE, 'center');
        txt(ctx, O.fmtClock(g.phaseT), W / 2, 196 * S, 42 * S, ULT, 'center');
        if (p.inSpawn) txt(ctx, 'H — СМЕНИТЬ ГЕРОЯ', W / 2, 228 * S, 16 * S, '#cde', 'center');
      } else if (g.phase === 'roundEnd') {
        txt(ctx, 'СЛЕДУЮЩИЙ РАУНД ЧЕРЕЗ ' + Math.ceil(g.phaseT), W / 2, 150 * S, 28 * S, WHITE, 'center');
      } else if (g.mode === 'control' && g.obj.locked === undefined && !g.obj.unlocked && g.phase === 'play') {
        txt(ctx, 'ОБЪЕКТ ОТКРОЕТСЯ ЧЕРЕЗ ' + Math.ceil(g.obj.lockT), W / 2, 150 * S, 24 * S, WHITE, 'center');
      }
      if (p.alive && p.inSpawn && g.phase === 'play' && !ui.heroSelectOpen) txt(ctx, 'H — СМЕНИТЬ ГЕРОЯ', W / 2, H - 260 * S, 15 * S, '#cde', 'center');
    },

    dead(ui, ctx, W, H, S, p) {
      const g = ui.game;
      ctx.fillStyle = 'rgba(40,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
      const t = Math.ceil(p.respawnT);
      txt(ctx, 'ВОЗРОЖДЕНИЕ ЧЕРЕЗ', W / 2, H - 200 * S, 24 * S, WHITE, 'center');
      txt(ctx, String(Math.max(0, t)), W / 2, H - 150 * S, 52 * S, WHITE, 'center');
      const k = ui.hud.killer;
      if (k) {
        const kh = g.heroes[k.id];
        const x = W / 2 - 180 * S, y = 110 * S;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y, 360 * S, 84 * S);
        const pr = kh ? ui.portrait(kh.heroId, kh.skin) : null;
        if (pr) ctx.drawImage(pr, x + 10 * S, y + 8 * S, 68 * S, 68 * S);
        txt(ctx, 'ВАС УБИЛ', x + 90 * S, y + 28 * S, 16 * S, '#ccc', 'left');
        txt(ctx, k.name.toUpperCase(), x + 90 * S, y + 58 * S, 28 * S, RED, 'left');
        if (kh && kh.heroId) txt(ctx, O.HEROES[kh.heroId].name + (kh.alive ? '  ' + Math.ceil(kh.hp + kh.armor + kh.shield) + ' ОЗ' : ''), x + 90 * S, y + 76 * S, 14 * S, '#fff', 'left');
      }
      txt(ctx, 'H — СМЕНИТЬ ГЕРОЯ', W / 2, H - 100 * S, 16 * S, '#cde', 'center');
    },

    scoreboard(ui, ctx, W, H, S) {
      const g = ui.game, p = ui.viewHero();
      if (!p) return;
      ctx.fillStyle = 'rgba(8,16,30,0.78)'; ctx.fillRect(0, 0, W, H);
      const map = O.MAP_LIST.find(m => m.id === g.mapId);
      txt(ctx, map ? map.name : '', 60 * S, 70 * S, 40 * S, WHITE, 'left');
      txt(ctx, O.MODE_INFO[g.mode].ru + (g.mode === 'control' ? ' · ' + (map.stages[g.subStage] || '') : ''), 60 * S, 98 * S, 18 * S, '#9cf', 'left');
      txt(ctx, 'ВРЕМЯ МАТЧА ' + O.fmtClock(g.t), W - 60 * S, 70 * S, 20 * S, '#fff', 'right');
      const col = (team, x, title, colr) => {
        txt(ctx, title, x, 150 * S, 22 * S, colr, 'left');
        let y = 170 * S;
        for (const h of g.heroes.filter(hh => hh.team === team)) {
          const ally = team === p.team;
          ctx.fillStyle = h === p ? 'rgba(255,220,120,0.25)' : ally ? 'rgba(60,160,255,0.2)' : 'rgba(255,70,70,0.18)';
          para(ctx, x, y, 520 * S, 48 * S, 8 * S); ctx.fill();
          const pr = h.heroId ? ui.portrait(h.heroId, h.skin) : null;
          if (pr) ctx.drawImage(pr, x + 12 * S, y + 4 * S, 40 * S, 40 * S);
          if (!h.alive && h.spawned) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x + 12 * S, y + 4 * S, 40 * S, 40 * S); icon(ctx, 'skull', x + 32 * S, y + 24 * S, 20 * S, RED); }
          txt(ctx, h.name.toUpperCase(), x + 64 * S, y + 32 * S, 20 * S, ally ? '#fff' : '#ffd0d0', 'left');
          if (ally) {
            txt(ctx, Math.floor(h.def ? h.ult / h.def.ultCost * 100 : 0) + '%', x + 300 * S, y + 32 * S, 18 * S, h.def && h.ult >= h.def.ultCost ? ULT : '#fff', 'left');
            txt(ctx, h.stats.elims + ' / ' + h.stats.deaths, x + 390 * S, y + 32 * S, 18 * S, '#fff', 'left');
          }
          txt(ctx, (g.opts.ping ? g.opts.ping[h.id] : 40 + (h.id * 17) % 60) + ' мс', x + 500 * S, y + 32 * S, 13 * S, '#9ab', 'right');
          y += 54 * S;
        }
      };
      col(p.team, 60 * S, 'ВАША КОМАНДА', BLUE);
      col(1 - p.team, W - 600 * S, 'ПРОТИВНИКИ', RED);
      const st = p.stats;
      const cells = [['УБИЙСТВА', st.elims], ['У ЦЕЛИ', st.objKills], ['ВРЕМЯ У ЦЕЛИ', O.fmtClock(st.objTime)], ['УРОН', Math.round(st.dmg)], ['ЛЕЧЕНИЕ', Math.round(st.heal)], ['СМЕРТИ', st.deaths]];
      const med = O.Profile.medals(g, p.team)[p.id] || [];
      const cw = (W - 120 * S) / cells.length;
      cells.forEach(([n, v], i) => {
        const x = 60 * S + i * cw, y = H - 170 * S;
        para(ctx, x, y, cw - 14 * S, 110 * S, 10 * S); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
        const key = ['elims', 'objKills', 'objTime', 'dmg', 'heal', null][i];
        const m = med.find(mm => mm.cat === key);
        if (m) { ctx.fillStyle = { gold: '#ffcc40', silver: '#d8dde4', bronze: '#d08a50' }[m.medal]; ctx.beginPath(); ctx.arc(x + cw - 40 * S, y + 24 * S, 12 * S, 0, PI * 2); ctx.fill(); }
        txt(ctx, n, x + 20 * S, y + 32 * S, 15 * S, '#9cf', 'left');
        txt(ctx, String(v), x + 20 * S, y + 86 * S, 44 * S, '#fff', 'left');
      });
    },

    replayOverlay(ui, ctx, W, H, S) {
      const r = ui.replayView;
      if (!r) return;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, 90 * S); ctx.fillRect(0, H - 90 * S, W, 90 * S);
      if (ui.mode === 'potg') {
        const a = Math.min(1, r.t * 2);
        ctx.globalAlpha = a;
        txt(ctx, 'ЛУЧШИЙ МОМЕНТ МАТЧА', 60 * S, 60 * S, 30 * S, ULT, 'left');
        txt(ctx, (r.name || '').toUpperCase(), 60 * S, H - 40 * S, 44 * S, WHITE, 'left');
        txt(ctx, r.heroName || '', 60 * S + (ui.hctx.measureText((r.name || '').toUpperCase()).width || 200) + 30 * S, H - 40 * S, 22 * S, '#9cf', 'left');
        ctx.globalAlpha = 1;
      } else {
        txt(ctx, 'ПОВТОР УБИЙСТВА', 60 * S, 60 * S, 26 * S, RED, 'left');
        txt(ctx, (r.name || '').toUpperCase(), 60 * S, H - 40 * S, 34 * S, WHITE, 'left');
        txt(ctx, 'ПРОБЕЛ — ПРОПУСТИТЬ', W - 60 * S, H - 40 * S, 16 * S, '#ccc', 'right');
      }
      if (ui.replayCross) Hud.crosshair(ui, ctx, W, H, S, ui.replayCross);
    }
  };
  O.Hud = Hud;
  O.abilityList = abilityList;
})(globalThis.Ow98 = globalThis.Ow98 || {});
