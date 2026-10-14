(function (S) {
  'use strict';
  const { esc, iconSVG, TRAITS, TRAIT_KEYS, TRAIT_CATS, LTW, AGE_INFO, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, SKIN_TONES, OUTFIT_KINDS, TOPS, BOTTOMS, COLORS, MUSIC, FOODS, RECIPES, CLOTH, PANTS, ageIdx } = S;
  const G = S.UI.prototype;
  const CAS_AGES = ['toddler', 'child', 'teen', 'ya', 'adult', 'elder'];
  const CATS = [['basics', 'ui_simology', 'Внешность'], ['hair', 'm_swirl', 'Причёска'], ['clothes', 'm_shirt', 'Одежда'], ['personality', 'm_star', 'Характер']];
  const TOP_OPTS = {
    everyday: { m: ['tshirt', 'shirt', 'sweater', 'tank'], f: ['tshirt', 'blouse', 'sweater', 'dress', 'tank'] },
    formal: { m: ['jacket', 'shirt'], f: ['dress', 'jacket', 'blouse'] },
    sleep: { m: ['pajama', 'tshirt'], f: ['pajama', 'dress'] },
    athletic: { m: ['tank', 'tshirt'], f: ['tank', 'tshirt'] },
    swim: { m: ['none'], f: ['swim'] }
  };
  const BOTTOM_OPTS = {
    everyday: { m: ['pants', 'jeans', 'shorts'], f: ['pants', 'jeans', 'skirt', 'shorts'] },
    formal: { m: ['pants'], f: ['pants', 'skirt'] },
    sleep: { m: ['pants', 'shorts'], f: ['pants', 'shorts'] },
    athletic: { m: ['shorts', 'pants'], f: ['shorts', 'pants'] },
    swim: { m: ['trunks'], f: ['none'] }
  };
  const SHOES = ['#3a2a1a', '#1c1c20', '#f0f0f0', '#6a4a2a', '#8a2a2a', '#2a3a6a', '#e8d8c8'];
  const TIES = ['#8a2a2a', '#2a3a6a', '#1c1c20', '#3a6a3a', '#d8b860', '#6a2a5a'];
  const REL_NAMES = { spouse: 'Супруг(а)', partner: 'Партнёр', child: 'Ребёнок', parent: 'Родитель', sibling: 'Брат или сестра', roommate: 'Сосед по дому' };
  const TRAIT_ANIM = { evil: 'evil_laugh', mean_spirited: 'evil_laugh', hot_headed: 'angry', grumpy: 'annoyed', shy: 'blush', flirty: 'flirt_a', great_kisser: 'flirt_a', hopeless_romantic: 'blush', party_animal: 'dance', excitable: 'cheer', athletic: 'cheer', insane: 'laugh', good_sense_of_humor: 'laugh', inappropriate: 'laugh', couch_potato: 'shrug', no_sense_of_humor: 'shrug', neurotic: 'panic', coward: 'panic', clumsy: 'embarrassed', snob: 'annoyed', friendly: 'wave_a', charismatic: 'wave_a', childish: 'laugh', virtuoso: 'dance' };

  function outfitLabel(k) { return k === 'none' ? 'Нет' : TOPS[k] || BOTTOMS[k] || k; }
  function casRng() { return new S.RNG((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0); }

  G.startCAS = function (opt) {
    opt = opt || {};
    this.closeScreens();
    this.closePie();
    this.mode = 'cas';
    const rng = casRng();
    const family = opt.last || rng.pick(S.LAST_NAMES);
    const first = S.randomSim(rng, { age: 'ya', last: family });
    this.cas = { rng, family, members: [first], rels: [null], sel: 0, cat: 'basics', okind: 'everyday', turn: 0, t: 0, anim: 'wave_a', animUntil: 2.2, opt };
    const scr = document.createElement('div');
    scr.className = 's3-screen s3-cas';
    scr.innerHTML = '<div class="side"><div class="cats"></div><div class="pane s3-panel"></div></div><div class="stage"><canvas></canvas></div><div class="top"></div><div class="fam s3-panel"></div><div class="s3-title" style="position:absolute;left:330px;top:14px;font-size:17px">Создание семьи</div>';
    this.top.appendChild(scr);
    this.screen = scr;
    const c = this.cas;
    c.el = { cats: scr.querySelector('.cats'), pane: scr.querySelector('.pane'), stage: scr.querySelector('.stage'), top: scr.querySelector('.top'), fam: scr.querySelector('.fam') };
    c.cv = scr.querySelector('.stage canvas');
    for (const [k, icon, name] of CATS) {
      const b = document.createElement('button');
      b.className = 's3-btn lg';
      b.dataset.k = k;
      b.innerHTML = iconSVG(icon, 22);
      this.tipOn(b, '<b>' + esc(name) + '</b>');
      b.onclick = () => { c.cat = k; if (this.audio) this.audio.ui('tab'); this.casPane(); };
      c.el.cats.appendChild(b);
    }
    const mk = (icon, title, cls, fn) => { const b = document.createElement('button'); b.className = 's3-btn ' + cls; b.innerHTML = iconSVG(icon, cls === 'xl' ? 30 : 20); this.tipOn(b, '<b>' + esc(title) + '</b>'); b.onclick = () => { if (this.audio) this.audio.ui('click'); fn(); }; c.el.top.appendChild(b); return b; };
    mk('ui_close', 'Назад в меню', 'lg', () => this.confirm('Выйти из редактора?', 'Созданная семья не сохранится.', () => { this.closeScreens(); if (opt.onCancel) opt.onCancel(); }));
    mk('ui_dice', 'Случайная внешность и характер', 'lg', () => this.casRandomize());
    mk('ui_check', 'Готово', 'xl', () => this.casDone());
    let drag = null;
    c.el.stage.addEventListener('pointerdown', e => { drag = e.clientX; c.el.stage.setPointerCapture(e.pointerId); c.el.stage.style.cursor = 'grabbing'; });
    c.el.stage.addEventListener('pointermove', e => { if (drag === null) return; c.turn += (e.clientX - drag) * 0.012; drag = e.clientX; });
    c.el.stage.addEventListener('pointerup', () => { drag = null; c.el.stage.style.cursor = ''; });
    this.casPane();
    this.casFamily();
    if (this.audio) this.audio.modeMusic('cas');
  };

  G.casSim = function () { return this.cas.members[this.cas.sel]; };

  G.casFrame = function (dt) {
    const c = this.cas;
    if (!c || !c.cv || !this.stage) return;
    const sim = this.casSim();
    if (!sim) return;
    const w = Math.max(64, Math.floor(c.el.stage.clientWidth)), h = Math.max(64, Math.floor(c.el.stage.clientHeight));
    if (c.cv.width !== w || c.cv.height !== h) { c.cv.width = w; c.cv.height = h; }
    c.t += dt;
    if (c.anim !== 'idle' && c.t > c.animUntil) c.anim = 'idle';
    const src = this.stage.fullBody(sim, w, h, c.turn, c.t, c.anim);
    const g = c.cv.getContext('2d');
    g.clearRect(0, 0, w, h);
    g.drawImage(src, 0, 0);
  };

  G.casPlay = function (anim, dur) { const c = this.cas; c.anim = anim; c.animUntil = c.t + (dur || 2.2); };

  G.casChanged = function (pane) {
    this.casFamily();
    if (pane) this.casPane();
  };

  G.casPane = function () {
    const c = this.cas, sim = this.casSim(), pane = c.el.pane;
    for (const b of c.el.cats.children) b.classList.toggle('on', b.dataset.k === c.cat);
    const keep = pane.scrollTop;
    pane.innerHTML = '';
    if (c.cat === 'basics') this.casBasics(pane, sim);
    else if (c.cat === 'hair') this.casHair(pane, sim);
    else if (c.cat === 'clothes') this.casClothes(pane, sim);
    else this.casPersonality(pane, sim);
    pane.scrollTop = keep;
  };

  function h4(pane, text) { const h = document.createElement('h4'); h.textContent = text; pane.appendChild(h); return h; }
  function choices(pane, list, cur, fn, cols, disabled) {
    const box = document.createElement('div');
    box.className = 's3-choice';
    if (cols) box.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    for (const [k, label] of list) {
      const d = document.createElement('div');
      const dis = disabled && disabled(k);
      d.className = 'c' + (k === cur ? ' on' : '') + (dis ? ' dis' : '');
      d.textContent = label;
      if (dis) d.title = dis;
      d.onclick = () => { if (!dis) fn(k); };
      box.appendChild(d);
    }
    pane.appendChild(box);
    return box;
  }
  function swatches(pane, list, cur, fn, tip) {
    const box = document.createElement('div');
    box.className = 's3-swatches';
    list.forEach((c, i) => {
      const hex = Array.isArray(c) ? c[1] : c;
      const d = document.createElement('div');
      d.className = 's3-sw' + (cur === hex || cur === i && typeof cur === 'number' ? ' on' : '');
      d.style.background = hex;
      if (Array.isArray(c)) d.title = c[0];
      d.onclick = () => fn(hex, i);
      box.appendChild(d);
    });
    pane.appendChild(box);
    return box;
  }
  function slider(pane, label, v, min, max, fn) {
    const row = document.createElement('div');
    row.className = 's3-slider';
    row.innerHTML = '<span style="width:70px">' + esc(label) + '</span><input type="range" min="0" max="100" value="' + Math.round((v - min) / (max - min) * 100) + '">';
    row.querySelector('input').oninput = e => fn(min + (max - min) * e.target.value / 100);
    pane.appendChild(row);
    return row;
  }

  G.casBasics = function (pane, sim) {
    const c = this.cas;
    h4(pane, 'Имя');
    const inp = document.createElement('input');
    inp.type = 'text'; inp.maxLength = 16; inp.value = sim.first;
    inp.style.cssText = 'font:bold 12px Tahoma;padding:5px 8px;border-radius:8px;border:1.5px solid #3a6cab;color:#173a6b;width:100%';
    inp.oninput = () => { sim.first = inp.value.trim() || sim.first; this.casFamily(); };
    pane.appendChild(inp);
    h4(pane, 'Пол');
    choices(pane, [['m', 'Мужской'], ['f', 'Женский']], sim.gender, g => { this.casSetGender(sim, g); this.casChanged(true); this.casPlay('wave_a'); }, 2);
    h4(pane, 'Возраст');
    choices(pane, CAS_AGES.map(a => [a, AGE_INFO[a].name]), sim.age, a => { this.casSetAge(sim, a); this.casChanged(true); this.casPlay('cheer'); }, 3, a => this.casAgeBlock(sim, a));
    h4(pane, 'Цвет кожи');
    swatches(pane, SKIN_TONES, sim.look.skin, (hex, i) => { sim.look.skin = i; this.casChanged(true); });
    h4(pane, 'Телосложение');
    slider(pane, 'Полнота', sim.look.fat, 0, 1, v => { sim.look.fat = v; this.casFamilyLater(); });
    slider(pane, 'Мускулы', sim.look.fit, 0, 1, v => { sim.look.fit = v; this.casFamilyLater(); });
    h4(pane, 'Цвет глаз');
    swatches(pane, EYE_COLORS, sim.look.eyes, hex => { sim.look.eyes = hex; this.casChanged(true); });
    h4(pane, 'Голос');
    slider(pane, 'Тембр', sim.voice, 0.15, 0.85, v => { sim.voice = v; });
    const b = document.createElement('button');
    b.className = 's3-pill';
    b.style.marginTop = '6px';
    b.textContent = 'Послушать голос';
    b.onclick = () => { if (this.audio) { this.audio.resume(); this.audio.voice(sim, 'happy', 1); } this.casPlay('wave_a', 1.6); };
    pane.appendChild(b);
  };

  G.casFamilyLater = function () {
    clearTimeout(this._casT);
    this._casT = setTimeout(() => { if (this.cas) this.casFamily(); }, 250);
  };

  G.casAgeBlock = function (sim, a) {
    const c = this.cas;
    const i = c.members.indexOf(sim);
    const others = c.members.filter(m => m !== sim);
    if (ageIdx(a) < 4 && !others.some(m => ageIdx(m.age) >= 4)) return 'В семье нужен хотя бы один взрослый';
    if (i > 0 && (c.rels[i] === 'spouse' || c.rels[i] === 'partner') && ageIdx(a) < 4) return 'Супруги должны быть взрослыми';
    return null;
  };

  G.casSetGender = function (sim, g) {
    if (sim.gender === g) return;
    const rng = this.cas.rng;
    const old = sim.look;
    const look = S.makeLook(rng, g, sim.age, { skin: old.skin, hairC: old.hairC, eyes: old.eyes });
    look.fat = old.fat; look.fit = old.fit;
    sim.gender = g;
    sim.look = look;
    const list = g === 'f' ? S.MALE_NAMES : S.FEMALE_NAMES;
    if (list.includes(sim.first)) sim.first = rng.pick(g === 'f' ? S.FEMALE_NAMES : S.MALE_NAMES);
  };

  G.casSetAge = function (sim, a) {
    if (sim.age === a) return;
    const rng = this.cas.rng;
    const old = sim.look;
    const prev = sim.age;
    sim.age = a;
    const fresh = S.makeLook(rng, sim.gender, a, { skin: old.skin, hairC: old.hairC, eyes: old.eyes });
    old.outfits = fresh.outfits;
    if (a === 'toddler' || prev === 'toddler') old.hair = fresh.hair;
    if (a === 'elder') old.hairC = fresh.hairC;
    else if (prev === 'elder') old.hairC = S.HAIR_COLORS[rng.int(0, 5)][1];
    const n = AGE_INFO[a].traits;
    sim.traits = sim.traits.filter(t => ageIdx(a) >= ageIdx(TRAITS[t].age)).slice(0, n);
    if (ageIdx(a) < 3) sim.ltw = null;
    this.casFixRels();
  };

  G.casHair = function (pane, sim) {
    h4(pane, 'Причёска');
    const styles = HAIR_STYLES[sim.gender].filter(s => sim.age !== 'toddler' || ['crew', 'short', 'bob', 'pigtails', 'ponytail', 'short_f'].includes(s[0]));
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px';
    for (const [k, name] of styles) {
      const probe = Object.assign(Object.create(Object.getPrototypeOf(sim)), sim, { look: Object.assign({}, sim.look, { hair: k }) });
      const d = document.createElement('div');
      d.className = 's3-inset';
      d.style.cssText = 'padding:3px;text-align:center;cursor:pointer;font-size:10px;font-weight:bold' + (sim.look.hair === k ? ';outline:2px solid #2a8a2a;background:linear-gradient(#f4fff0,#c6ecb6)' : '');
      d.innerHTML = '<img src="' + this.stage.portrait(probe, 64) + '" style="width:100%;display:block;border-radius:6px">' + esc(name);
      d.onclick = () => { sim.look.hair = k; this.casChanged(true); this.casPlay('look', 1.2); };
      grid.appendChild(d);
    }
    pane.appendChild(grid);
    h4(pane, 'Цвет волос');
    swatches(pane, HAIR_COLORS, sim.look.hairC, hex => { sim.look.hairC = hex; this.casChanged(true); });
  };

  G.casClothes = function (pane, sim) {
    const c = this.cas;
    const kinds = Object.keys(OUTFIT_KINDS);
    choices(pane, kinds.map(k => [k, OUTFIT_KINDS[k]]), c.okind, k => { c.okind = k; this.casPane(); }, 3);
    const o = sim.look.outfits[c.okind];
    const g = sim.gender === 'f' ? 'f' : 'm';
    const sync = () => { if (o.top === 'dress') { o.bottom = 'none'; o.bc = o.tc; } o.sleeves = o.top === 'sweater' || o.top === 'shirt' || o.top === 'jacket' || o.top === 'pajama' ? 1 : 0; if (sim.outfit !== c.okind) sim.outfit = c.okind; this.casChanged(true); };
    h4(pane, 'Верх');
    choices(pane, TOP_OPTS[c.okind][g].map(k => [k, outfitLabel(k)]), o.top, k => { o.top = k; if (o.bottom === 'none' && k !== 'dress' && !(c.okind === 'swim')) o.bottom = BOTTOM_OPTS[c.okind][g][0]; o.long = k === 'dress' && c.okind === 'formal'; sync(); }, 3);
    if (o.top !== 'none') swatches(pane, CLOTH, o.tc, hex => { o.tc = hex; if (o.top === 'dress' || o.top === 'pajama') o.bc = hex; sync(); });
    if (o.top !== 'dress' && c.okind !== 'swim' || c.okind === 'swim' && g === 'm') {
      h4(pane, 'Низ');
      choices(pane, BOTTOM_OPTS[c.okind][g].map(k => [k, outfitLabel(k)]), o.bottom, k => { o.bottom = k; sync(); }, 3);
      if (o.bottom !== 'none') swatches(pane, PANTS.concat(CLOTH), o.bc, hex => { o.bc = hex; sync(); });
    }
    if (c.okind !== 'swim') {
      h4(pane, 'Обувь');
      swatches(pane, SHOES, o.shoes, hex => { o.shoes = hex; sync(); });
    }
    if (o.top === 'jacket') {
      h4(pane, 'Галстук');
      swatches(pane, TIES, o.tie, hex => { o.tie = hex; sync(); });
    }
    sim.outfit = c.okind;
  };

  G.casPersonality = function (pane, sim) {
    const c = this.cas;
    const n = AGE_INFO[sim.age].traits;
    h4(pane, 'Черты характера (' + sim.traits.length + ' из ' + n + ')');
    const slots = document.createElement('div');
    slots.className = 's3-traitslots';
    for (let i = 0; i < n; i++) {
      const t = sim.traits[i];
      const d = document.createElement('div');
      d.className = 'slot';
      if (t) {
        d.style.border = 'none';
        d.innerHTML = S.traitIconSVG(t, 18);
        this.tipOn(d, '<b>' + esc(TRAITS[t].name) + '</b>' + esc(TRAITS[t].desc) + '<div>Щёлкните, чтобы убрать.</div>');
        d.onclick = () => { this.hideTip('el'); sim.traits.splice(i, 1); this.casChanged(true); };
      }
      slots.appendChild(d);
    }
    pane.appendChild(slots);
    const allowed = TRAIT_KEYS.filter(k => ageIdx(sim.age) >= ageIdx(TRAITS[k].age));
    for (const [cat, catName] of Object.entries(TRAIT_CATS)) {
      const list = allowed.filter(k => TRAITS[k].cat === cat);
      if (!list.length) continue;
      const lab = document.createElement('div');
      lab.className = 's3-sub';
      lab.style.cssText = 'font-weight:bold;margin:6px 0 3px';
      lab.textContent = catName;
      pane.appendChild(lab);
      const grid = document.createElement('div');
      grid.className = 's3-traitgrid';
      for (const k of list) {
        const has = sim.traits.includes(k);
        const conflict = !has && sim.traits.some(t => TRAITS[t].conflicts.includes(k) || TRAITS[k].conflicts.includes(t));
        const d = document.createElement('div');
        d.className = 'tb' + (has ? ' on' : '') + (conflict ? ' dis' : '');
        d.innerHTML = S.traitIconSVG(k, 18);
        this.tipOn(d, () => '<b>' + esc(TRAITS[k].name) + '</b>' + esc(TRAITS[k].desc) + (conflict ? '<div class="neg">Не сочетается с выбранными чертами.</div>' : ''));
        d.onclick = () => {
          if (conflict) { if (this.audio) this.audio.ui('deny'); return; }
          if (has) sim.traits = sim.traits.filter(t => t !== k);
          else if (sim.traits.length < n) { sim.traits.push(k); this.casPlay(TRAIT_ANIM[k] || 'cheer'); if (this.audio) this.audio.voice(sim, TRAIT_ANIM[k] === 'angry' || TRAIT_ANIM[k] === 'annoyed' ? 'angry' : 'happy', 0.8); }
          else { this.hint('Все ячейки заняты. Уберите черту, чтобы выбрать другую.'); return; }
          this.hideTip('el');
          this.casChanged(true);
        };
        grid.appendChild(d);
      }
      pane.appendChild(grid);
    }
    h4(pane, 'Любимое');
    const fav = document.createElement('div');
    fav.style.cssText = 'display:grid;grid-template-columns:70px 1fr;gap:4px 6px;align-items:center';
    const sel = (label, opts, cur, fn) => {
      const l = document.createElement('span'); l.textContent = label; fav.appendChild(l);
      const s = document.createElement('select');
      s.style.cssText = 'font:11px Tahoma;padding:2px;border-radius:6px;border:1.5px solid #3a6cab;color:#173a6b';
      for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === cur) o.selected = true; s.appendChild(o); }
      s.onchange = () => fn(s.value);
      fav.appendChild(s);
    };
    sel('Еда', FOODS.map(f => [f, (RECIPES[f] || { name: f }).name]), sim.fav.food, v => { sim.fav.food = v; });
    sel('Музыка', MUSIC.map(m => [m, m]), sim.fav.music, v => { sim.fav.music = v; });
    sel('Цвет', COLORS.map(x => [x[0], x[0]]), sim.fav.color, v => { sim.fav.color = v; });
    pane.appendChild(fav);
    const z = document.createElement('div');
    z.className = 's3-sub';
    z.style.marginTop = '4px';
    z.textContent = 'Знак зодиака: ' + S.zodiacOf(sim.traits);
    pane.appendChild(z);
    if (ageIdx(sim.age) >= 3) {
      h4(pane, 'Мечта всей жизни');
      if (sim.traits.length < n) {
        const d = document.createElement('div');
        d.className = 's3-sub';
        d.textContent = 'Выберите все черты, и появятся мечты, подходящие характеру.';
        pane.appendChild(d);
      } else {
        const opts = S.ltwOptions(sim.traits, new S.RNG(S.hashStr(sim.traits.join(',') + sim.gender) >>> 0), 5);
        if (!sim.ltw || !opts.includes(sim.ltw)) sim.ltw = sim.ltw && LTW[sim.ltw] ? sim.ltw : opts[0];
        const box = document.createElement('div');
        box.className = 's3-grid';
        const list = opts.includes(sim.ltw) ? opts : [sim.ltw].concat(opts.slice(0, 4));
        for (const k of list) {
          const L = LTW[k];
          const card = document.createElement('div');
          card.className = 's3-card s3-inset' + (sim.ltw === k ? ' on' : '');
          card.style.padding = '5px 6px';
          card.innerHTML = iconSVG(L.icon, 18) + '<div><div class="t" style="font-size:11px">' + esc(L.name) + '</div><div class="d">' + esc(L.desc) + '</div></div>';
          card.onclick = () => { sim.ltw = k; this.casPane(); if (this.audio) this.audio.ui('promise'); };
          box.appendChild(card);
        }
        pane.appendChild(box);
      }
    }
  };

  G.casRandomize = function () {
    const c = this.cas;
    const sim = this.casSim();
    const fresh = S.randomSim(c.rng, { gender: sim.gender, age: sim.age, last: c.family });
    c.members[c.sel] = fresh;
    this.casChanged(true);
    this.casPlay('wave_a');
  };

  G.casRelValid = function (i, kind) {
    const c = this.cas;
    const head = c.members[0], m = c.members[i];
    if (!head || !m) return false;
    const a = ageIdx(head.age), b = ageIdx(m.age);
    if (kind === 'spouse' || kind === 'partner') return a >= 4 && b >= 4 && !c.rels.some((r, j) => j !== i && (r === 'spouse' || r === 'partner'));
    if (kind === 'child') return a >= 4 && b < a && b <= 4 && (a - b >= 2 || b <= 3);
    if (kind === 'parent') return b >= 4 && b > a && a <= 4 && (b - a >= 2 || a <= 3);
    if (kind === 'roommate') return a >= 3 && b >= 3;
    return true;
  };

  G.casFixRels = function () {
    const c = this.cas;
    for (let i = 1; i < c.members.length; i++) {
      if (c.rels[i] && this.casRelValid(i, c.rels[i])) continue;
      c.rels[i] = ['child', 'spouse', 'sibling', 'parent', 'roommate'].find(k => this.casRelValid(i, k)) || 'sibling';
    }
  };

  G.casFamily = function () {
    const c = this.cas, el = c.el.fam;
    el.innerHTML = '';
    const nm = document.createElement('div');
    nm.style.cssText = 'display:flex;flex-direction:column;gap:3px;width:150px;flex:none';
    const funds = 20000 + Math.max(0, c.members.length - 2) * 1500;
    nm.innerHTML = '<span class="s3-sub" style="font-weight:bold">Семья</span><input type="text" maxlength="16" value="' + esc(c.family) + '" style="font:bold 13px Tahoma;padding:5px 8px;border-radius:8px;border:1.5px solid #3a6cab;color:#173a6b;width:100%"><span class="s3-sub">Бюджет: ' + S.fmtMoney(funds) + '</span>';
    const inp = nm.querySelector('input');
    inp.oninput = () => { const v = inp.value.trim(); if (v) { c.family = v; for (const m of c.members) m.last = v; } };
    el.appendChild(nm);
    c.members.forEach((m, i) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;position:relative';
      const d = document.createElement('div');
      d.className = 'mem' + (i === c.sel ? ' on' : '');
      d.innerHTML = '<img src="' + this.stage.portrait(m, 64) + '">';
      d.onclick = () => { c.sel = i; if (this.audio) this.audio.ui('select'); this.casPlay('wave_a', 1.6); this.casPane(); this.casFamily(); };
      this.tipOn(d, () => '<b>' + esc(m.first + ' ' + c.family) + '</b>' + esc(AGE_INFO[m.age].name) + (m.traits.length ? '<div>' + m.traits.map(t => esc(TRAITS[t].name)).join(', ') + '</div>' : ''));
      wrap.appendChild(d);
      if (i === 0) {
        const r = document.createElement('div'); r.className = 'rel'; r.textContent = 'Глава семьи'; wrap.appendChild(r);
      } else {
        const s = document.createElement('select');
        s.style.cssText = 'font:9px Tahoma;width:74px;border-radius:5px;border:1px solid #6a9ad0;color:#173a6b';
        for (const [k, t] of Object.entries(REL_NAMES)) { if (!this.casRelValid(i, k) && c.rels[i] !== k) continue; const o = document.createElement('option'); o.value = k; o.textContent = t; if (c.rels[i] === k) o.selected = true; s.appendChild(o); }
        s.onchange = () => { c.rels[i] = s.value; };
        wrap.appendChild(s);
      }
      if (c.members.length > 1) {
        const x = document.createElement('div');
        x.textContent = '✕';
        x.style.cssText = 'position:absolute;right:-6px;top:-6px;width:16px;height:16px;border-radius:50%;background:#c0302a;color:#fff;font:bold 10px Arial;display:grid;place-items:center;cursor:pointer;border:1px solid #fff';
        x.onclick = e => { e.stopPropagation(); this.casRemove(i); };
        wrap.appendChild(x);
      }
      el.appendChild(wrap);
    });
    if (c.members.length < 8) {
      const add = document.createElement('div');
      add.style.cssText = 'display:flex;flex-direction:column;gap:3px';
      const mk = (label, fn) => { const b = document.createElement('button'); b.className = 's3-pill'; b.innerHTML = iconSVG('ui_plus', 10) + ' ' + esc(label); b.style.cssText = 'display:flex;gap:4px;align-items:center'; b.onclick = () => { fn(); if (this.audio) this.audio.ui('click'); }; add.appendChild(b); };
      mk('Взрослый', () => this.casAdd('ya'));
      mk('Ребёнок', () => this.casAdd('child'));
      mk('Малыш', () => this.casAdd('toddler'));
      el.appendChild(add);
    }
  };

  G.casAdd = function (age) {
    const c = this.cas;
    const head = c.members[0];
    const gender = age === 'ya' ? (head.gender === 'm' ? 'f' : 'm') : (c.rng.chance(0.5) ? 'm' : 'f');
    const base = age === 'ya' ? null : { skin: head.look.skin, hairC: head.look.hairC, eyes: head.look.eyes };
    const sim = S.randomSim(c.rng, { gender, age, last: c.family, base });
    c.members.push(sim);
    c.rels.push(null);
    c.sel = c.members.length - 1;
    this.casFixRels();
    this.casChanged(true);
    this.casPlay('wave_a');
  };

  G.casRemove = function (i) {
    const c = this.cas;
    const rest = c.members.filter((m, j) => j !== i);
    if (!rest.some(m => ageIdx(m.age) >= 4)) { this.hint('В семье должен остаться хотя бы один взрослый.'); return; }
    c.members.splice(i, 1);
    c.rels.splice(i, 1);
    c.rels[0] = null;
    c.sel = Math.min(c.sel, c.members.length - 1);
    this.casFixRels();
    this.casChanged(true);
  };

  G.casLinks = function () {
    const c = this.cas;
    const links = [];
    const spouse = c.rels.findIndex((r, i) => i > 0 && (r === 'spouse' || r === 'partner'));
    c.rels.forEach((r, i) => {
      if (!i || !r) return;
      if (r === 'spouse' || r === 'partner') links.push([0, i, r]);
      else if (r === 'child') { links.push([0, i, 'parent']); if (spouse > 0) links.push([spouse, i, 'parent']); }
      else if (r === 'parent') links.push([i, 0, 'parent']);
      else if (r === 'sibling') links.push([0, i, 'sibling']);
      else links.push([0, i, 'roommate']);
    });
    return links;
  };

  G.casDone = function () {
    const c = this.cas;
    if (!c.members.some(m => ageIdx(m.age) >= 4)) { this.hint('В семье нужен хотя бы один взрослый.'); return; }
    const missing = c.members.filter(m => m.traits.length < AGE_INFO[m.age].traits);
    const finish = () => {
      for (const m of c.members) {
        const n = AGE_INFO[m.age].traits;
        if (m.traits.length < n) m.traits = S.pickTraits(c.rng, m.age, n, m.traits);
        if (ageIdx(m.age) >= 3 && !m.ltw) m.ltw = S.ltwOptions(m.traits, c.rng, 1)[0];
        m.last = c.family;
        m.outfit = 'everyday';
      }
      const members = c.members.map(m => m.serialize());
      const links = this.casLinks();
      const family = c.family;
      const onDone = c.opt.onDone;
      this.closeScreens();
      if (onDone) onDone(members, links, family);
    };
    if (missing.length) this.confirm('Не все черты выбраны', 'У ' + missing.map(m => m.first).join(', ') + ' остались пустые ячейки черт. Заполнить их случайно?', finish, 'Заполнить', 'Вернуться');
    else finish();
  };

  G.closeScreens = function () {
    if (this.screen) { this.screen.remove(); this.screen = null; }
    this.cas = null;
    this.hideTip();
  };

  Object.assign(S, { CAS_AGES });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
