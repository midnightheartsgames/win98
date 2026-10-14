(function (K) {
  'use strict';
  const esc = K.esc;
  const SKINS = ['#f0c8a0', '#d8a878', '#b88058', '#8a5a3a', '#5a3a26'];
  const HAIRS = ['#1a1410', '#4a2a14', '#8a5a20', '#c8a060', '#8a1a1a', '#c0c0c0'];
  const POINT_COST = v => v <= 14 ? v - 8 : v === 15 ? 7 : v === 16 ? 9 : v === 17 ? 12 : 15;

  function stars(n, seed) {
    const r = new K.RNG(seed || 3);
    return Array.from({ length: n }, () => ({ x: r.next(), y: r.next(), z: r.next(), b: 0.3 + r.next() * 0.7 }));
  }

  class TitleScreen {
    constructor(ui) {
      this.ui = ui;
      this.t = 0;
      this.st = stars(260, 5);
      this.view = 'menu';
      ui.hud.innerHTML = '';
      this.render();
    }
    destroy() { this.ui.layer.innerHTML = ''; this.ui.ovx.clearRect(0, 0, this.ui.W, this.ui.H); }
    frame(dt) {
      this.t += dt;
      const x = this.ui.ovx, W = this.ui.W, H = this.ui.H;
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#020308'); g.addColorStop(1, '#0a0f1e');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (const s of this.st) {
        const tw = 0.6 + Math.sin(this.t * 2 + s.z * 30) * 0.4;
        x.fillStyle = `rgba(255,255,255,${s.b * tw})`;
        x.fillRect(((s.x * W + this.t * 6 * s.z) % W), s.y * H, s.z > 0.8 ? 2 : 1, s.z > 0.8 ? 2 : 1);
      }
      const pr = Math.min(W, H) * 0.55;
      const px = W * 0.78, py = H * 1.05;
      const pg = x.createRadialGradient(px - pr * 0.3, py - pr * 0.4, pr * 0.1, px, py, pr);
      pg.addColorStop(0, '#6a7a90'); pg.addColorStop(0.7, '#2a3040'); pg.addColorStop(1, '#0a0c14');
      x.fillStyle = pg; x.beginPath(); x.arc(px, py, pr, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,200,120,0.5)';
      for (let i = 0; i < 90; i++) { const a = Math.PI + (i / 90) * Math.PI * 0.9 + 0.05, rr = pr * (0.55 + ((i * 37) % 40) / 100); x.fillRect(px + Math.cos(a) * rr, py + Math.sin(a) * rr, 1.5, 1.5); }
      x.strokeStyle = 'rgba(120,200,255,0.25)'; x.lineWidth = 3; x.beginPath(); x.arc(px, py, pr + 2, Math.PI, Math.PI * 2); x.stroke(); x.lineWidth = 1;
    }
    key(e, down) {
      if (!down) return true;
      if (e.code === 'Escape' && this.view !== 'menu') { this.view = 'menu'; this.render(); }
      return !(e.target && e.target.tagName === 'INPUT');
    }
    render() {
      const ui = this.ui;
      if (this.view === 'create') return this.renderCreate();
      if (this.view === 'load') return this.renderLoad();
      const latest = ui.latestSave();
      ui.layer.innerHTML = `<div class="kt-title"><div class="kt-logo"><div class="sw">STAR WARS</div><div class="kotor">KNIGHTS OF THE<br>OLD REPUBLIC</div><div class="ed">98 · Издание «Тарис»</div></div><div class="kt-menu">
<button data-a="new">Новая игра</button>${latest ? '<button data-a="cont">Продолжить</button>' : ''}<button data-a="load">Загрузить</button><button data-a="quick">Быстрый старт</button>${ui.opts.onExit ? '<button data-a="exit">Выход</button>' : ''}</div>
<div class="kt-foot">BioWare · LucasArts (1999) — Win 98 Edition. ${ui.glError ? '<b class="warn">WebGL недоступен: ' + esc(ui.glError) + '</b>' : 'Щёлкните, чтобы включить звук.'}</div></div>`;
      ui.layer.querySelectorAll('[data-a]').forEach(b => {
        b.onmouseenter = () => ui.sfx('hover');
        b.onclick = () => {
          ui.audio.resume(); ui.sfx('click');
          const a = b.dataset.a;
          if (a === 'new') { this.view = 'create'; this.spec = this.defaultSpec('soldier'); this.render(); }
          else if (a === 'cont') ui.loadSave(latest);
          else if (a === 'load') { this.view = 'load'; this.render(); }
          else if (a === 'quick') ui.startNewGame({ cls: 'soldier', name: 'Рейвен' });
          else if (a === 'exit') ui.opts.onExit();
        };
      });
    }
    renderLoad() {
      const ui = this.ui, saves = ui.saves();
      const rows = Object.entries(saves).sort((a, b) => b[1].t - a[1].t).map(([k, v]) => `<button class="kt-saveb" data-s="${k}"><b>${k === 'quick' ? 'Быстрое' : 'Слот ' + k}</b> — ${esc(v.label || '')}<br><i>${esc(v.player || '')}, уровень ${v.level}, ${new Date(v.t).toLocaleString('ru-RU')}</i></button>`).join('');
      ui.layer.innerHTML = `<div class="kt-title"><div class="kt-box"><h2>Загрузить игру</h2>${rows || '<div class="dim">Сохранений нет.</div>'}<div class="kt-btnrow"><button class="kt-btn" data-back="1">Назад</button></div></div></div>`;
      ui.layer.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => ui.loadSave(b.dataset.s); });
      ui.layer.querySelector('[data-back]').onclick = () => { this.view = 'menu'; this.render(); };
    }
    defaultSpec(cls) {
      const attrs = K.defaultAttrs(cls);
      const base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
      const spec = { cls, fem: this.spec ? this.spec.fem : false, name: this.spec ? this.spec.name : 'Рейвен', attrs: Object.assign(base, attrs), skin: this.spec ? this.spec.skin : 1, hair: this.spec ? this.spec.hair : 1 };
      spec.skills = this.autoSkills(spec);
      spec.feat = K.defaultFeats(cls)[0];
      return spec;
    }
    tmpCreature(spec) {
      K.TEMPLATES._cc = { n: spec.name, cls: spec.cls, lvl: 1, attrs: spec.attrs, equip: {}, m: 'player_m', feats: [], skills: {}, party: true };
      const c = K.makeCreature('_cc', { faction: 'party' });
      delete K.TEMPLATES._cc;
      return c;
    }
    skillBudget(spec) { return Math.max(1, K.CLASSES[spec.cls].sk + K.mod(spec.attrs.int)) * 4; }
    spent(spec, c) { return Object.entries(spec.skills).reduce((s, [k, n]) => s + n * K.skillCost(c, k), 0); }
    autoSkills(spec) {
      const c = this.tmpCreature(spec);
      const out = {};
      let pts = this.skillBudget(spec);
      const pref = K.CLASSES[spec.cls].cskills.concat(['per', 'awa', 'tre']);
      let guard = 0;
      while (pts > 0 && guard++ < 40) {
        let any = false;
        for (const k of pref) { const cost = K.skillCost(c, k); if (pts >= cost && (out[k] || 0) < K.maxRank(c, k, 1)) { out[k] = (out[k] || 0) + 1; pts -= cost; any = true; if (pts <= 0) break; } }
        if (!any) break;
      }
      return out;
    }
    renderCreate() {
      const ui = this.ui, sp = this.spec;
      const pts = 30 - Object.values(sp.attrs).reduce((s, v) => s + POINT_COST(v), 0);
      const c = this.tmpCreature(sp);
      const budget = this.skillBudget(sp);
      const left = budget - this.spent(sp, c);
      const classes = K.PLAYER_CLASSES.map(k => `<button class="kt-cls${sp.cls === k ? ' on' : ''}" data-cls="${k}"><b>${K.CLASSES[k].n}</b><span>${esc(K.CLASSES[k].desc)}</span></button>`).join('');
      const attrs = K.ATTRS.map(([k, n]) => `<div class="kt-skl"><span>${n}</span><button class="kt-btn sm" data-a="${k}" data-d="-1"${sp.attrs[k] <= 8 ? ' disabled' : ''}>−</button><b>${sp.attrs[k]}</b><button class="kt-btn sm" data-a="${k}" data-d="1"${sp.attrs[k] >= 18 || POINT_COST(sp.attrs[k] + 1) - POINT_COST(sp.attrs[k]) > pts ? ' disabled' : ''}>+</button><i>${K.fmtSigned(K.mod(sp.attrs[k]))}</i></div>`).join('');
      const skills = K.SKILLS.map(([k, n]) => `<div class="kt-skl"><span>${n}${K.isClassSkill(c, k) ? '' : ' <i class="dim">(×2)</i>'}</span><button class="kt-btn sm" data-s="${k}" data-d="-1">−</button><b>${sp.skills[k] || 0}</b><button class="kt-btn sm" data-s="${k}" data-d="1"${(sp.skills[k] || 0) >= K.maxRank(c, k, 1) || left < K.skillCost(c, k) ? ' disabled' : ''}>+</button></div>`).join('');
      const pool = K.FEAT_POOL.filter(f => !K.CLASSES[sp.cls].feats.includes(f) && (!K.FEATS[f].req || K.CLASSES[sp.cls].feats.includes(K.FEATS[f].req)));
      const feats = pool.map(f => `<button class="kt-btn${sp.feat === f ? ' on' : ''}" data-f="${f}" title="${esc(K.FEATS[f].desc)}">${esc(K.FEATS[f].n)}</button>`).join('');
      ui.layer.innerHTML = `<div class="kt-create"><h2>Создание персонажа</h2><div class="kt-cols">
<div class="kt-col"><h3>Класс</h3><div class="kt-clss">${classes}</div><h3>Внешность</h3><div class="kt-look"><canvas width="96" height="96"></canvas><div>
<div class="kt-pick"><button class="kt-btn${!sp.fem ? ' on' : ''}" data-g="m">Мужчина</button><button class="kt-btn${sp.fem ? ' on' : ''}" data-g="f">Женщина</button></div>
<div class="kt-sw">${SKINS.map((s, i) => `<i data-skin="${i}" style="background:${s}"${sp.skin === i ? ' class="on"' : ''}></i>`).join('')}</div>
<div class="kt-sw">${HAIRS.map((s, i) => `<i data-hair="${i}" style="background:${s}"${sp.hair === i ? ' class="on"' : ''}></i>`).join('')}</div></div></div>
<h3>Имя</h3><input class="kt-name" maxlength="20" value="${esc(sp.name)}"></div>
<div class="kt-col"><h3>Характеристики <span class="dim">(очки: ${pts})</span></h3>${attrs}<button class="kt-btn sm" data-rec="1">Рекомендуемые</button>
<h3>Здоровье ${K.CLASSES[sp.cls].hd + K.mod(sp.attrs.con)} · Защита ${10 + K.mod(sp.attrs.dex)}</h3></div>
<div class="kt-col"><h3>Навыки <span class="dim">(очки: ${left})</span></h3>${skills}<button class="kt-btn sm" data-autos="1">Автоматически</button><h3>Умение</h3><div class="kt-pick">${feats}</div></div>
</div><div class="kt-btnrow"><button class="kt-btn" data-back="1">Назад</button><button class="kt-btn glow" data-go="1">Начать игру</button></div></div>`;
      const look = () => ({ skin: SKINS[sp.skin], hair: HAIRS[sp.hair] });
      K.drawPortrait(ui.layer.querySelector('.kt-look canvas'), Object.assign({}, K.MODELS[sp.fem ? 'player_f' : 'player_m'], look()), 'party');
      const q = s => ui.layer.querySelectorAll(s);
      const name = ui.layer.querySelector('.kt-name');
      name.oninput = () => { sp.name = name.value; };
      q('[data-cls]').forEach(b => { b.onclick = () => { const n = sp.name; this.spec = this.defaultSpec(b.dataset.cls); this.spec.name = n; this.render(); }; });
      q('[data-g]').forEach(b => { b.onclick = () => { sp.fem = b.dataset.g === 'f'; this.render(); }; });
      q('[data-skin]').forEach(b => { b.onclick = () => { sp.skin = +b.dataset.skin; this.render(); }; });
      q('[data-hair]').forEach(b => { b.onclick = () => { sp.hair = +b.dataset.hair; this.render(); }; });
      q('[data-a]').forEach(b => { b.onclick = () => { const k = b.dataset.a, d = +b.dataset.d; const v = sp.attrs[k] + d; if (v < 8 || v > 18) return; const np = pts - (POINT_COST(v) - POINT_COST(sp.attrs[k])); if (np < 0) return; sp.attrs[k] = v; if (k === 'int') sp.skills = this.autoSkills(sp); this.render(); }; });
      q('[data-s]').forEach(b => { b.onclick = () => { const k = b.dataset.s, d = +b.dataset.d; const v = (sp.skills[k] || 0) + d; if (v < 0) return; if (d > 0 && (v > K.maxRank(c, k, 1) || left < K.skillCost(c, k))) return; sp.skills[k] = v; this.render(); }; });
      q('[data-f]').forEach(b => { b.onclick = () => { sp.feat = b.dataset.f; this.render(); }; });
      q('[data-rec]').forEach(b => { b.onclick = () => { sp.attrs = Object.assign({}, K.defaultAttrs(sp.cls)); sp.skills = this.autoSkills(sp); this.render(); }; });
      q('[data-autos]').forEach(b => { b.onclick = () => { sp.skills = this.autoSkills(sp); this.render(); }; });
      q('[data-back]').forEach(b => { b.onclick = () => { this.view = 'menu'; this.render(); }; });
      q('[data-go]').forEach(b => {
        b.onclick = () => {
          const feats = [sp.feat].filter(Boolean);
          ui.startNewGame({ cls: sp.cls, fem: sp.fem, name: (sp.name || 'Рейвен').trim() || 'Рейвен', attrs: Object.assign({}, sp.attrs), skills: Object.assign({}, sp.skills), feats, look: look() });
        };
      });
    }
  }

  const CRAWL = [
    'ЭПИЗОД: ТАРИС', '',
    'Идёт война. Флот Ситхов под предводительством Тёмного лорда Малака захватывает одну систему за другой.',
    'Республика и Орден джедаев отступают. Их последняя надежда — юный джедай Бастила Шан и её редкий дар Боевой медитации.',
    'Флагман «Шпиль Эндара» с Бастилой на борту попал в засаду над планетой Тарис. Корабль уничтожен, выжившие разбросаны по огромному городу-планете.',
    'Вы очнулись в пустой квартире Верхнего города. Рядом — лейтенант Карт Онаси. Ситхи ввели карантин и прочёсывают улицы.',
    'Найдите Бастилу. Выберитесь с Тариса. Пока не стало слишком поздно…'
  ];

  class PrologueScreen {
    constructor(ui, done) {
      this.ui = ui; this.done = done; this.t = 0; this.st = stars(200, 9);
      ui.layer.innerHTML = '<div class="kt-skip">Нажмите любую клавишу, чтобы пропустить</div>';
      ui.audio.music('title');
      ui.ov.onclick = () => this.finish();
    }
    destroy() { this.ui.ov.onclick = null; this.ui.layer.innerHTML = ''; }
    finish() { if (this.fin) return; this.fin = true; this.ui.ov.onclick = null; this.done(); }
    key(e, down) { if (down) this.finish(); return true; }
    frame(dt) {
      this.t += dt;
      const x = this.ui.ovx, W = this.ui.W, H = this.ui.H;
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      for (const s of this.st) { x.fillStyle = `rgba(255,255,255,${s.b})`; x.fillRect(s.x * W, s.y * H, 1, 1); }
      const lines = [];
      x.font = 'bold 22px Georgia, serif';
      for (const p of CRAWL) { if (!p) { lines.push(''); continue; } lines.push(...K.wrapText(x, p, 560)); lines.push(''); }
      const speed = 28;
      const y0 = H + 40 - this.t * speed;
      x.save();
      for (let i = 0; i < lines.length; i++) {
        const y = y0 + i * 30;
        if (y < -40 || y > H + 40) continue;
        const k = y / H;
        const sc = 0.45 + k * 0.75;
        const alpha = Math.max(0, Math.min(1, (y - H * 0.08) / (H * 0.25)));
        x.globalAlpha = alpha;
        x.fillStyle = '#ffd84a';
        x.font = (i === 0 ? 'bold ' : '') + Math.round(22 * sc) + 'px Georgia, serif';
        x.textAlign = 'center';
        x.fillText(lines[i], W / 2, H * 0.08 + (y - H * 0.08) * (0.55 + k * 0.45));
      }
      x.restore();
      x.globalAlpha = 1;
      if (y0 + lines.length * 30 < -20) this.finish();
    }
  }

  class PazaakScreen {
    constructor(ui) {
      this.ui = ui;
      this.g = ui.game;
      this.p = this.g.pazaak;
      this.aiT = 0;
      this.render();
    }
    destroy() { this.ui.layer.innerHTML = ''; this.ui.ovx.clearRect(0, 0, this.ui.W, this.ui.H); }
    frame(dt) {
      const p = this.p;
      const x = this.ui.ovx;
      x.fillStyle = '#081418'; x.fillRect(0, 0, this.ui.W, this.ui.H);
      if (p.phase === 'turn' && p.turn === 'opp') {
        this.aiT += dt;
        if (this.aiT > 0.9) { this.aiT = 0; p.aiTurn(); this.ui.sfx('card'); this.render(); }
      }
    }
    key(e, down) {
      if (!down) return true;
      const p = this.p;
      if (e.code === 'KeyE') this.act('end');
      else if (e.code === 'KeyS') this.act('stand');
      else if (e.code === 'Enter' || e.code === 'Space') { if (p.phase === 'setEnd') this.act('next'); else if (p.phase === 'end') this.act('exit'); }
      return true;
    }
    card(c, extra) {
      if (!c) return '<div class="pz-card empty"></div>';
      const v = c.kind === '±' ? '±' + c.v : (c.v > 0 && (c.side || c.kind) ? '+' + c.v : String(c.v));
      const cls = c.main ? 'main' : c.kind === '-' || c.v < 0 && !c.main ? 'minus' : c.kind === '±' ? 'flip' : 'plus';
      return `<div class="pz-card ${cls}"${extra || ''}>${v}</div>`;
    }
    act(a, i, sign) {
      const p = this.p, g = this.g, ui = this.ui;
      if (a === 'end') p.endTurn('player');
      else if (a === 'stand') p.stand('player');
      else if (a === 'play') p.playCard('player', i, sign);
      else if (a === 'next') p.nextSet();
      else if (a === 'exit') { g.endPazaak(); for (const e of g.drain()) ui.onEvent(e); return; }
      ui.sfx('card');
      this.aiT = 0;
      this.render();
    }
    render() {
      const p = this.p, ui = this.ui;
      const row = side => { const cs = p.side[side].cards; let h = ''; for (let i = 0; i < 9; i++) h += this.card(cs[i]); return h; };
      const sets = w => [0, 1, 2].map(i => `<i class="${i < p.sets[w] ? 'on' : ''}"></i>`).join('');
      const hand = p.hands.player.map((c, i) => {
        const can = p.canPlay(i);
        if (c.kind === '±') return `<div class="pz-h">${this.card(c)}<div class="pz-sg"><button class="kt-btn sm" data-play="${i}" data-sign="1"${can ? '' : ' disabled'}>+</button><button class="kt-btn sm" data-play="${i}" data-sign="-1"${can ? '' : ' disabled'}>−</button></div></div>`;
        return `<div class="pz-h">${this.card(c, can ? ` data-play="${i}" data-sign="1"` : '')}</div>`;
      }).join('');
      const oppHand = p.hands.opp.map(() => '<div class="pz-card back"></div>').join('');
      const myTurn = p.phase === 'turn' && p.turn === 'player';
      ui.layer.innerHTML = `<div class="kt-pazaak">
<div class="pz-side opp"><div class="pz-name">${esc(p.opp.n)} <span class="pz-sets">${sets('opp')}</span> <b class="pz-tot">${p.side.opp.total}</b>${p.side.opp.stood ? ' <em>стоит</em>' : ''}</div><div class="pz-row">${row('opp')}</div><div class="pz-hand">${oppHand}</div></div>
<div class="pz-mid">${esc(p.msg || (myTurn ? 'Ваш ход' : p.phase === 'turn' ? 'Ход соперника…' : ''))}<span>Ставка: ${p.wager} кр.</span></div>
<div class="pz-side me"><div class="pz-row">${row('player')}</div><div class="pz-name">${esc(this.g.player.name)} <span class="pz-sets">${sets('player')}</span> <b class="pz-tot${p.side.player.total > 20 ? ' bust' : ''}">${p.side.player.total}</b>${p.side.player.stood ? ' <em>стоит</em>' : ''}</div><div class="pz-hand">${hand}</div>
<div class="kt-btnrow">${p.phase === 'turn' ? `<button class="kt-btn" data-a="end"${myTurn ? '' : ' disabled'}>Конец хода (E)</button><button class="kt-btn glow" data-a="stand"${myTurn ? '' : ' disabled'}>Стоять (S)</button>` : p.phase === 'setEnd' ? '<button class="kt-btn glow" data-a="next">Следующий сет</button>' : '<button class="kt-btn glow" data-a="exit">Выйти из-за стола</button>'}</div></div></div>`;
      ui.layer.querySelectorAll('[data-a]').forEach(b => { b.onclick = () => this.act(b.dataset.a); });
      ui.layer.querySelectorAll('[data-play]').forEach(b => { b.onclick = () => this.act('play', +b.dataset.play, +b.dataset.sign); });
    }
  }

  class SwoopScreen {
    constructor(ui) {
      this.ui = ui;
      this.g = ui.game;
      this.s = this.g.swoop;
      this.keys = {};
      this.engT = 0;
      ui.layer.innerHTML = '<div class="kt-swhelp">A/D или ←/→ — руль · Пробел/W — переключить передачу в зелёной зоне · синие стрелки — ускорители</div>';
      ui.audio.music('battle');
    }
    destroy() { this.ui.layer.innerHTML = ''; this.ui.ovx.clearRect(0, 0, this.ui.W, this.ui.H); }
    key(e, down) {
      const c = e.code;
      if (c === 'KeyA' || c === 'ArrowLeft') this.keys.l = down;
      if (c === 'KeyD' || c === 'ArrowRight') this.keys.r = down;
      if (down && (c === 'Space' || c === 'KeyW' || c === 'ArrowUp') && !e.repeat) { const q = this.s.shift(); if (q !== 'none') this.ui.sfx(q === 'good' ? 'boost' : 'shift'); }
      if (down && this.s.finished && (c === 'Enter' || c === 'Escape')) this.exit();
      return true;
    }
    exit() {
      if (this.left) return;
      this.left = true;
      this.g.endSwoop();
      for (const e of this.g.drain()) this.ui.onEvent(e);
    }
    frame(dt) {
      const s = this.s;
      const hits = s.hits, boosts = s.boosts;
      s.update(dt, { steer: (this.keys.r ? 1 : 0) - (this.keys.l ? 1 : 0) });
      if (s.hits > hits) { this.ui.sfx('crash'); this.shake = 0.4; }
      if (s.boosts > boosts) this.ui.sfx('boost');
      this.engT -= dt;
      if (this.engT <= 0 && s.countdown <= 0 && !s.finished) { this.engT = 0.25; this.ui.sfx('engine'); }
      this.draw(dt);
      if (s.finished && !this.btn) {
        this.btn = true;
        const win = s.time <= s.rival;
        this.ui.layer.innerHTML = `<div class="kt-swres"><h2>${win ? 'Победа!' : 'Финиш'}</h2><p>Ваше время: <b>${s.time.toFixed(2)} с</b><br>Лучшее время соперников: ${s.rival.toFixed(2)} с</p><p class="dim">Удары: ${s.hits} · Ускорители: ${s.boosts} · Идеальные переключения: ${s.goodShifts}</p><button class="kt-btn glow">Продолжить (Enter)</button></div>`;
        this.ui.layer.querySelector('button').onclick = () => this.exit();
      }
    }
    draw(dt) {
      const x = this.ui.ovx, W = this.ui.W, H = this.ui.H, s = this.s;
      this.shake = Math.max(0, (this.shake || 0) - dt);
      const sh = this.shake ? (Math.random() - 0.5) * 10 * this.shake : 0;
      const hz = H * 0.38;
      const sky = x.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, '#1a1030'); sky.addColorStop(1, '#a05a50');
      x.fillStyle = sky; x.fillRect(0, 0, W, hz);
      x.fillStyle = '#20182a';
      for (let i = 0; i < 30; i++) { const bw = 30 + (i * 53) % 50, bh = 40 + (i * 97) % 120; const bx = ((i * 71 - s.pos * 0.05) % (W + 100) + W + 100) % (W + 100) - 50; x.fillRect(bx, hz - bh, bw, bh); }
      x.fillStyle = 'rgba(255,200,120,0.6)';
      for (let i = 0; i < 60; i++) { const bx = ((i * 37 - s.pos * 0.05) % W + W) % W; x.fillRect(bx, hz - 20 - (i * 13) % 100, 2, 2); }
      x.fillStyle = '#2a2a34'; x.fillRect(0, hz, W, H - hz);
      const K1 = 14;
      const proj = (dz, lx) => { const k = K1 / (K1 + dz); const y = hz + (H - hz) * k; const half = W * 0.42 * k; return [W / 2 + sh + (lx - s.x * 0.85) * half / 1.5, y, half]; };
      for (let dz = 0; dz < 160; dz += 2) {
        const a = proj(dz, 0), b = proj(dz + 2, 0);
        const band = Math.floor((s.pos + dz) / 8) % 2;
        x.fillStyle = band ? '#3a3a46' : '#34343f';
        x.beginPath(); x.moveTo(a[0] - a[2], a[1]); x.lineTo(a[0] + a[2], a[1]); x.lineTo(b[0] + b[2], b[1]); x.lineTo(b[0] - b[2], b[1]); x.fill();
        x.fillStyle = band ? '#ff8040' : '#803020';
        x.fillRect(a[0] - a[2] - 6 * (a[2] / W * 4), b[1], 6 * (a[2] / W * 4) + 1, a[1] - b[1] + 1);
        x.fillRect(a[0] + a[2], b[1], 6 * (a[2] / W * 4) + 1, a[1] - b[1] + 1);
        if (band) for (const lx of [-0.5, 0.5]) { const p1 = proj(dz, lx * 1.5), p2 = proj(dz + 2, lx * 1.5); x.strokeStyle = '#8a8aa0'; x.lineWidth = Math.max(1, p1[2] / 90); x.beginPath(); x.moveTo(p1[0], p1[1]); x.lineTo(p2[0], p2[1]); x.stroke(); }
      }
      x.lineWidth = 1;
      const vis = s.items.filter(it => it.z > s.pos - 2 && it.z < s.pos + 160).sort((a, b) => b.z - a.z);
      for (const it of vis) {
        const dz = it.z - s.pos;
        const p = proj(Math.max(0, dz), it.x * 1.5);
        const w = p[2] * 0.55;
        if (it.kind === 'block') {
          if (it.hit) continue;
          x.fillStyle = '#c04020'; x.fillRect(p[0] - w / 2, p[1] - w * 0.6, w, w * 0.6);
          x.fillStyle = '#ffd040'; for (let k = 0; k < 4; k++) x.fillRect(p[0] - w / 2 + k * w / 4, p[1] - w * 0.45, w / 8, w * 0.15);
        } else {
          x.fillStyle = it.hit ? 'rgba(80,160,255,0.3)' : '#40a0ff';
          for (let k = 0; k < 2; k++) { const yy = p[1] - k * w * 0.18; x.beginPath(); x.moveTo(p[0] - w / 2, yy); x.lineTo(p[0], yy - w * 0.2); x.lineTo(p[0] + w / 2, yy); x.lineTo(p[0], yy - w * 0.08); x.fill(); }
        }
      }
      const bx = W / 2 + sh + (s.x * 0.15) * W * 0.12, by = H - 60;
      x.fillStyle = 'rgba(0,0,0,0.4)'; x.beginPath(); x.ellipse(bx, by + 30, 70, 12, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#a03020'; x.beginPath(); x.moveTo(bx - 60, by + 20); x.lineTo(bx - 35, by - 25); x.lineTo(bx + 35, by - 25); x.lineTo(bx + 60, by + 20); x.fill();
      x.fillStyle = '#202020'; x.fillRect(bx - 25, by - 45, 50, 25);
      x.fillStyle = s.boostT > 0 ? '#80e0ff' : '#4080ff'; x.fillRect(bx - 50, by + 14, 20, 8); x.fillRect(bx + 30, by + 14, 20, 8);
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(10, 10, 230, 96);
      x.fillStyle = '#ffe080'; x.font = 'bold 18px Tahoma'; x.textAlign = 'left';
      x.fillText('Время: ' + s.time.toFixed(2), 20, 34);
      x.font = '13px Tahoma'; x.fillStyle = '#c0e0ff';
      x.fillText('Соперник: ' + s.rival.toFixed(2) + ' с', 20, 54);
      x.fillText('Скорость: ' + Math.round(s.speed * 4) + ' · Передача ' + s.gear, 20, 72);
      x.fillText('Дистанция: ' + Math.round(100 * s.pos / s.length) + '%', 20, 90);
      const gx = W - 250, gy = 20;
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(gx - 10, gy - 10, 240, 56);
      x.fillStyle = '#303040'; x.fillRect(gx, gy + 10, 220, 16);
      x.fillStyle = '#20a040'; x.fillRect(gx + 220 * 0.72, gy + 10, 220 * 0.21, 16);
      x.fillStyle = s.rpm > 0.93 ? '#ff4040' : '#ffe060'; x.fillRect(gx, gy + 12, 220 * Math.min(1, s.rpm), 12);
      x.fillStyle = '#c0e0ff'; x.fillText('Обороты — переключай в зелёной зоне', gx, gy + 5);
      if (s.countdown > 0) { x.fillStyle = '#ffe060'; x.font = 'bold 64px Tahoma'; x.textAlign = 'center'; x.fillText(String(Math.ceil(s.countdown)), W / 2, H * 0.45); }
      else if (s.msgT > 0) { x.fillStyle = '#ffffff'; x.font = 'bold 28px Tahoma'; x.textAlign = 'center'; x.fillText(s.msg, W / 2, H * 0.3); }
    }
  }

  class EndingScreen {
    constructor(ui) {
      this.ui = ui;
      this.g = ui.game;
      this.t = 0;
      this.st = stars(300, 21);
      this.fires = [];
      this.fighters = Array.from({ length: 5 }, (_, i) => ({ o: i * 0.9, y: 0.2 + i * 0.12 }));
      ui.hud.innerHTML = '';
      ui.layer.innerHTML = '<div class="kt-endtext"></div>';
      this.txt = ui.layer.querySelector('.kt-endtext');
      this.lines = [
        [1, 'Флот ситхов обрушил огонь на Тарис. Лорд Малак не пощадил никого — лишь бы Бастила не ускользнула.'],
        [7, '«Эбеновый ястреб» вырвался из поместья Давика сквозь огненный шторм.'],
        [12, 'Истребители ситхов бросились в погоню, но коды запуска открыли путь сквозь блокаду.'],
        [17, 'Прыжок в гиперпространство. Тарис остался позади — навсегда.'],
        [21, 'Бастила знает, куда лететь: в анклав джедаев на Дантуине. Там ответы на вопросы о ваших снах… и о вашем прошлом.']
      ];
    }
    destroy() { this.ui.layer.innerHTML = ''; this.ui.ovx.clearRect(0, 0, this.ui.W, this.ui.H); }
    key(e, down) { if (down && this.t > 3 && (e.code === 'Enter' || e.code === 'Escape' || e.code === 'Space')) this.t = Math.max(this.t, 27); return true; }
    frame(dt) {
      this.t += dt;
      const x = this.ui.ovx, W = this.ui.W, H = this.ui.H, t = this.t;
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      const hyper = t > 16 && t < 20;
      for (const s of this.st) {
        if (hyper) {
          const cx = W / 2, cy = H / 2;
          const dx = (s.x - 0.5) * W, dy = (s.y - 0.5) * H;
          const k = 1 + (t - 16) * 2.5 * s.z;
          x.strokeStyle = `rgba(200,220,255,${s.b})`;
          x.beginPath(); x.moveTo(cx + dx, cy + dy); x.lineTo(cx + dx * k, cy + dy * k); x.stroke();
        } else { x.fillStyle = `rgba(255,255,255,${s.b})`; x.fillRect(s.x * W, s.y * H, 1.2, 1.2); }
      }
      if (t < 16) {
        const pr = Math.min(W, H) * (0.6 - Math.min(0.3, Math.max(0, t - 8) * 0.04));
        const px = W * 0.5, py = H * 1.05 + Math.max(0, t - 8) * 18;
        const pg = x.createRadialGradient(px - pr * 0.3, py - pr * 0.4, pr * 0.1, px, py, pr);
        pg.addColorStop(0, '#6a7a90'); pg.addColorStop(0.8, '#2a3040'); pg.addColorStop(1, '#0a0c14');
        x.fillStyle = pg; x.beginPath(); x.arc(px, py, pr, 0, Math.PI * 2); x.fill();
        if (Math.random() < 0.5 && t < 14 && this.fires.length < 70) this.fires.push({ a: Math.PI + 0.2 + Math.random() * (Math.PI - 0.4), r: 0.55 + Math.random() * 0.43, s: 0 });
        for (const f of this.fires) { f.s = Math.min(18, f.s + dt * 6); const fx = px + Math.cos(f.a) * pr * f.r, fy = py + Math.sin(f.a) * pr * f.r; const fg = x.createRadialGradient(fx, fy, 0, fx, fy, f.s); fg.addColorStop(0, 'rgba(255,220,120,0.9)'); fg.addColorStop(1, 'rgba(255,60,0,0)'); x.fillStyle = fg; x.beginPath(); x.arc(fx, fy, f.s, 0, Math.PI * 2); x.fill(); }
        for (let i = 0; i < 4; i++) {
          const sx = W * (0.15 + i * 0.23), sy = H * 0.15 + Math.sin(i + t * 0.2) * 10;
          x.fillStyle = '#404048'; x.beginPath(); x.moveTo(sx - 60, sy); x.lineTo(sx + 60, sy); x.lineTo(sx, sy + 26); x.fill();
          x.fillStyle = '#20202a'; x.fillRect(sx - 8, sy - 10, 16, 10);
          if (t < 14 && Math.random() < 0.4) { const ta = Math.PI + 0.3 + Math.random() * (Math.PI - 0.6); x.strokeStyle = 'rgba(255,40,40,0.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(sx, sy + 20); x.lineTo(px + Math.cos(ta) * pr * 0.9, py + Math.sin(ta) * pr * 0.9); x.stroke(); x.lineWidth = 1; }
        }
      }
      if (t > 6 && t < 17) {
        const k = (t - 6) / 10;
        const hx = W * 0.5 + (k - 0.3) * W * 0.3, hy = H * (0.85 - k * 0.5);
        const sc = 0.6 + k * 1.2;
        this.drawHawk(x, hx, hy, sc);
        for (const f of this.fighters) {
          const fk = Math.max(0, k - f.o * 0.1);
          const fx = hx - 120 * sc - f.o * 40 + Math.sin(t * 3 + f.o) * 20, fy = hy + 60 * sc + f.y * 80;
          if (t > 11 && t < 15.5) {
            x.fillStyle = '#505058'; x.beginPath(); x.arc(fx, fy, 6 * sc, 0, Math.PI * 2); x.fill(); x.fillRect(fx - 12 * sc, fy - 10 * sc, 3 * sc, 20 * sc); x.fillRect(fx + 9 * sc, fy - 10 * sc, 3 * sc, 20 * sc);
            if (Math.random() < 0.15) { x.strokeStyle = '#40ff60'; x.lineWidth = 2; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + (hx - fx) * 0.8 + (Math.random() - 0.5) * 60, fy + (hy - fy) * 0.8); x.stroke(); x.lineWidth = 1; }
          }
          void fk;
        }
      }
      let cur = '';
      for (const [at, s] of this.lines) if (t >= at) cur = s;
      if (t < 26) this.txt.innerHTML = cur ? '<p>' + esc(cur) + '</p>' : '';
      else if (!this.shown) {
        this.shown = true;
        const g = this.g;
        const align = g.align >= 60 ? 'Светлая сторона' : g.align <= 40 ? 'Тёмная сторона' : 'Нейтральность';
        const done = Object.keys(g.quests).filter(q => g.questDone(q) && q !== 'main').length;
        this.ui.layer.innerHTML = `<div class="kt-final"><h1>Конец главы «Тарис»</h1><p>«Эбеновый ястреб» держит курс на Дантуин.</p><div class="kt-stats">
<div><span>Персонаж</span><b>${esc(g.player.name)}, ${K.CLASSES[g.player.cls].n}</b></div><div><span>Уровень</span><b>${g.player.level}</b></div><div><span>Отряд</span><b>${Object.keys(g.roster).length}</b></div>
<div><span>Побеждено врагов</span><b>${g.stats.kills}</b></div><div><span>Побочных заданий</span><b>${done}</b></div><div><span>Путь</span><b>${align}</b></div><div><span>Кредиты</span><b>${g.credits}</b></div><div><span>Время в игре</span><b>${Math.round(g.time / 60)} мин</b></div></div>
<p class="dim">Продолжение следует: Дантуин, Татуин, Кашиик, Манаан, Коррибан… и Звёздная кузница.</p><div class="kt-btnrow"><button class="kt-btn glow" data-t="1">Главное меню</button></div></div>`;
        this.ui.layer.querySelector('[data-t]').onclick = () => this.ui.showTitle();
      }
    }
    drawHawk(x, cx, cy, s) {
      x.save(); x.translate(cx, cy); x.scale(s, s);
      x.fillStyle = '#b8b4a8'; x.beginPath(); x.ellipse(0, 0, 50, 22, 0, 0, Math.PI * 2); x.fill();
      x.fillRect(-40, -26, 18, 34); x.fillRect(22, -26, 18, 34);
      x.fillStyle = '#8a8680'; x.beginPath(); x.ellipse(0, -2, 26, 11, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#b8b4a8'; x.fillRect(46, -8, 20, 12);
      x.fillStyle = '#304050'; x.fillRect(62, -6, 5, 8);
      const gl = x.createLinearGradient(0, 18, 0, 34); gl.addColorStop(0, 'rgba(120,220,255,1)'); gl.addColorStop(1, 'rgba(120,220,255,0)');
      x.fillStyle = gl; x.fillRect(-36, 18, 72, 18);
      x.restore();
    }
  }

  Object.assign(K, { TitleScreen, PrologueScreen, PazaakScreen, SwoopScreen, EndingScreen });
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
