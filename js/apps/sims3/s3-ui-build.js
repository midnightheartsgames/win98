(function (S) {
  'use strict';
  const { esc, iconSVG, OBJECTS, OBJECT_KEYS, FUNC_CATS, ROOM_CATS, WALLPAPERS, FLOORS, DOORS, WINDOWS, TERRAIN, BUILD_COSTS, TER, footprint, layerOf, Geo, GEO_STRIDE, WALL_H, SKILLS, DX, DY } = S;
  const G = S.UI.prototype;
  const BUILD_TOOLS = [
    ['wall', 'ui_wall', 'Стены', 'Потяните мышью от угла к углу клеток. Секция стены стоит §' + BUILD_COSTS.wall + '. Наверху стены держатся над комнатами нижнего этажа.'],
    ['room', 'ui_room', 'Комната', 'Потяните мышью прямоугольник: четыре стены появятся сразу. На верхнем этаже комната получает и пол.'],
    ['fence', 'ui_fence', 'Забор', 'Потяните мышью вдоль края клеток. Секция забора стоит §' + BUILD_COSTS.fence + '. Наверху забор служит перилами.'],
    ['door', 'ui_door', 'Двери', 'Выберите дверь и щёлкните по стене.'],
    ['window', 'ui_window', 'Окна', 'Выберите окно и щёлкните по стене.'],
    ['floor', 'ui_floor', 'Пол', 'Щёлкните по клетке или обведите мышью несколько. С Shift покрывается вся комната. Наверху пол кладут над комнатами нижнего этажа.'],
    ['stairs', 'ui_stairs', 'Лестницы и лифт', 'Лестница ведёт с этого этажа на этаж выше, у её выхода наверху нужен пол. Лифт едет на все этажи, где у шахты есть пол. R: поворот.'],
    ['paint', 'ui_paint', 'Обои и краска', 'Щёлкните по стороне стены. С Shift красятся все стены комнаты.'],
    ['terrain', 'ui_terrain', 'Покрытие земли', 'Обведите мышью клетки двора. Покрытие засыпает и бассейн.'],
    ['pool', 'ui_pool', 'Бассейн', 'Обведите мышью клетки двора, чтобы выкопать бассейн. Клетка стоит §' + BUILD_COSTS.pool + '. Без лестницы в бассейн не залезть.'],
    ['roof', 'ui_roof', 'Крыша', 'Выберите форму, наклон и цвет крыши. Навес: потяните мышью прямоугольник, щелчок по навесу убирает его.'],
    ['hammer', 'ui_hammer', 'Снос', 'Щёлкните по двери, окну, лестнице или лифту, чтобы убрать их. Потяните вдоль стены, чтобы снести её.']
  ];
  const ROOF_STYLES = [['hip', 'Вальмовая', 'Скаты со всех четырёх сторон.'], ['gable', 'Двускатная', 'Два ската и треугольные фронтоны.'], ['shed', 'Односкатная', 'Один скат, как у сарая или веранды.'], ['flat', 'Плоская', 'Ровная крыша с низким парапетом.'], ['none', 'Без крыши', 'Дом останется открытым сверху.']];
  const ROOF_PITCH = [[0.6, 'Пологий скат'], [1, 'Обычный скат'], [1.5, 'Крутой скат']];
  const STAIR_ITEMS = ['stairs_wood', 'stairs_metal', 'elevator'];
  const ROOF_COLORS = ['#7a4a3a', '#5a3a2a', '#8a2a2a', '#6a3a2a', '#3a6a4a', '#2a4a3a', '#4a5a6a', '#2a4a7a', '#3a3a4a', '#6a6a70', '#a87a3a', '#c8b89a'];
  const TERRAIN_CELL = { grass: 'grass0', grass2: 'grass2_0', dirt: 'dirt', flowers: 'flowers', gravel: 'gravel', sand: 'sand' };
  const CLUTTER = { plate: 1, dirty_plate: 1, platter: 1, puddle: 1, trash_pile: 1, newspaper: 1 };
  const OK = [0.45, 1, 0.5], BAD = [1, 0.32, 0.28], SEL = [0.55, 0.8, 1];
  const thumbs = new Map();

  function cellThumb(atlas, name, size) {
    const key = 'c' + name + size;
    if (thumbs.has(key)) return thumbs.get(key);
    const c = atlas.get(name);
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    cv.getContext('2d').drawImage(atlas.canvas, c.px + 3, c.py + 3, c.pw - 6, c.ph - 6, 0, 0, size, size);
    const url = cv.toDataURL();
    thumbs.set(key, url);
    return url;
  }

  function wallBg(g, s) {
    g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#d8ceb8'; for (let y = 6; y < s; y += 12) g.fillRect(0, y, s, 1);
    g.fillStyle = '#b8a888'; g.fillRect(0, s - 6, s, 6);
  }

  function doorThumb(d, s) {
    const key = 'd' + d.style + d.c + s;
    if (thumbs.has(key)) return thumbs.get(key);
    const cv = document.createElement('canvas'); cv.width = s; cv.height = s;
    const g = cv.getContext('2d');
    wallBg(g, s);
    const x0 = s * 0.27, x1 = s * 0.73, y0 = s * 0.1, y1 = s - 6;
    if (d.style === 'arch') {
      g.fillStyle = d.c; g.beginPath(); g.moveTo(x0 - 4, y1); g.lineTo(x0 - 4, y0 + 12); g.arc(s / 2, y0 + 12, (x1 - x0) / 2 + 4, Math.PI, 0); g.lineTo(x1 + 4, y1); g.fill();
      g.fillStyle = '#4a3a2a'; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + 12); g.arc(s / 2, y0 + 12, (x1 - x0) / 2, Math.PI, 0); g.lineTo(x1, y1); g.fill();
    } else {
      g.fillStyle = '#f4f0e8'; g.fillRect(x0 - 3, y0 - 3, x1 - x0 + 6, y1 - y0 + 3);
      g.fillStyle = d.c; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1;
      if (d.style === 'glass') { g.fillStyle = '#a8d4f0'; g.fillRect(x0 + 4, y0 + 4, x1 - x0 - 8, (y1 - y0) * 0.45); g.strokeRect(x0 + 4, y0 + 4, x1 - x0 - 8, (y1 - y0) * 0.45); }
      else { g.strokeRect(x0 + 4, y0 + 4, x1 - x0 - 8, (y1 - y0) * 0.4); g.strokeRect(x0 + 4, y0 + (y1 - y0) * 0.5, x1 - x0 - 8, (y1 - y0) * 0.42); }
      if (d.style === 'fancy') { g.fillStyle = '#d8b860'; g.fillRect(x0 - 3, y0 - 7, x1 - x0 + 6, 4); }
      g.fillStyle = '#d8b860'; g.beginPath(); g.arc(x1 - 5, (y0 + y1) / 2, 2, 0, 7); g.fill();
    }
    const url = cv.toDataURL();
    thumbs.set(key, url);
    return url;
  }

  function winThumb(d, s) {
    const key = 'w' + d.style + d.c + s;
    if (thumbs.has(key)) return thumbs.get(key);
    const cv = document.createElement('canvas'); cv.width = s; cv.height = s;
    const g = cv.getContext('2d');
    wallBg(g, s);
    g.fillStyle = d.c; g.strokeStyle = d.c; g.lineWidth = 3;
    const glass = '#a8d4f0';
    if (d.style === 'round') {
      g.beginPath(); g.arc(s / 2, s * 0.45, s * 0.26, 0, 7); g.fill();
      g.fillStyle = glass; g.beginPath(); g.arc(s / 2, s * 0.45, s * 0.21, 0, 7); g.fill();
      g.beginPath(); g.moveTo(s / 2, s * 0.24); g.lineTo(s / 2, s * 0.66); g.moveTo(s * 0.29, s * 0.45); g.lineTo(s * 0.71, s * 0.45); g.stroke();
    } else {
      const tall = d.style === 'tall';
      const x0 = s * 0.24, x1 = s * 0.76, y0 = tall ? s * 0.08 : s * 0.2, y1 = tall ? s * 0.86 : s * 0.7;
      g.fillRect(x0 - 3, y0 - 3, x1 - x0 + 6, y1 - y0 + 6);
      g.fillStyle = glass; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x0 + 3, y0 + 3, 5, y1 - y0 - 6);
      g.beginPath(); g.moveTo(s / 2, y0); g.lineTo(s / 2, y1);
      if (d.style !== 'simple') { g.moveTo(x0, (y0 + y1) / 2); g.lineTo(x1, (y0 + y1) / 2); }
      g.stroke();
      g.fillStyle = d.c; g.fillRect(x0 - 5, y1 + 2, x1 - x0 + 10, 4);
    }
    const url = cv.toDataURL();
    thumbs.set(key, url);
    return url;
  }

  function roofThumb(style, c, pitch, s) {
    const key = 'r' + style + c + pitch + s;
    if (thumbs.has(key)) return thumbs.get(key);
    const cv = document.createElement('canvas'); cv.width = s; cv.height = s;
    const g = cv.getContext('2d');
    g.fillStyle = '#cfe6fa'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#79a75a'; g.fillRect(0, s - 8, s, 8);
    const x0 = s * 0.22, x1 = s * 0.78, wy = s * 0.58, gy = s - 8;
    g.fillStyle = '#e8e0d0'; g.fillRect(x0, wy, x1 - x0, gy - wy);
    g.fillStyle = '#a8d4f0'; g.fillRect(s * 0.31, wy + 5, 8, 8); g.fillRect(s * 0.56, wy + 5, 8, 8);
    const h = s * 0.27 * pitch, ex = 5;
    g.fillStyle = c; g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1;
    g.beginPath();
    if (style === 'hip') { g.moveTo(x0 - ex, wy); g.lineTo(x0 + s * 0.15, wy - h); g.lineTo(x1 - s * 0.15, wy - h); g.lineTo(x1 + ex, wy); }
    else if (style === 'gable') { g.moveTo(x0 - ex, wy); g.lineTo(s / 2, wy - h); g.lineTo(x1 + ex, wy); }
    else if (style === 'shed') { g.moveTo(x0 - ex, wy); g.lineTo(x0 - ex, wy - h * 0.85); g.lineTo(x1 + ex, wy); }
    else if (style === 'flat') g.rect(x0 - 2, wy - 6, x1 - x0 + 4, 6);
    if (style !== 'none') { g.closePath(); g.fill(); g.stroke(); }
    else { g.strokeStyle = '#8a7a5a'; g.lineWidth = 2; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x0, wy); g.lineTo(x1, wy); g.stroke(); }
    const url = cv.toDataURL();
    thumbs.set(key, url);
    return url;
  }

  function poolThumb(s) {
    const key = 'pool' + s;
    if (thumbs.has(key)) return thumbs.get(key);
    const cv = document.createElement('canvas'); cv.width = s; cv.height = s;
    const g = cv.getContext('2d');
    g.fillStyle = '#e8e4da'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#3a9ad8'; g.fillRect(6, 6, s - 12, s - 12);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { g.beginPath(); const y = 14 + i * 10; g.moveTo(10, y); g.bezierCurveTo(s * 0.35, y - 3, s * 0.6, y + 3, s - 10, y); g.stroke(); }
    const url = cv.toDataURL();
    thumbs.set(key, url);
    return url;
  }

  function faceTile(wl, f) {
    if (wl.o === 'h') return f === 'a' ? [wl.x, wl.y - 1] : [wl.x, wl.y];
    return f === 'a' ? [wl.x - 1, wl.y] : [wl.x, wl.y];
  }
  function edgeTiles(o, x, y) { return o === 'h' ? [[x, y - 1], [x, y]] : [[x - 1, y], [x, y]]; }
  function edgeInLot(o, x, y, lot) {
    if (o === 'h') return x >= lot.x && x < lot.x + lot.w && y >= lot.y && y <= lot.y + lot.h;
    return x >= lot.x && x <= lot.x + lot.w && y >= lot.y && y < lot.y + lot.h;
  }
  function tileInLot(x, y, lot) { return x >= lot.x && y >= lot.y && x < lot.x + lot.w && y < lot.y + lot.h; }

  function lotValue(w, lot) {
    let objVal = 0, walls = 0, floors = 0;
    for (const ob of w.objects.values()) if (ob.lot === lot.id && (!OBJECTS[ob.t].hidden || OBJECTS[ob.t].build)) objVal += OBJECTS[ob.t].price;
    for (const wl of w.walls) if (wl && wl.lot === lot.id) walls++;
    let pools = 0;
    for (let y = lot.y; y < lot.y + lot.h; y++) for (let x = lot.x; x < lot.x + lot.w; x++) {
      for (let lv = 0; lv < w.L; lv++) if (w.floor[w.li(x, y, lv)]) floors++;
      if (w.terrain[w.idx(x, y)] === TER.pool) pools++;
    }
    let roofs = 0;
    for (const p of lot.roofPieces || []) roofs += p.w * p.h;
    return Math.round(((lot.land || lot.w * lot.h * 6) + objVal + walls * 30 + floors * 8 + pools * BUILD_COSTS.pool + roofs * BUILD_COSTS.roof) / 100) * 100;
  }

  G.enterBuild = function (sub) {
    const g = this.game, hh = g.active();
    const prev = this.bm || {};
    this.bm = {
      sub, lot: hh.lot, view: prev.view || 'func', cat: prev.cat || 'seating', tool: prev.tool || 'wall',
      floor: prev.floor !== undefined ? prev.floor : 'wood_light', paper: prev.paper || 'paint_white', door: prev.door || 'door_wood', win: prev.win || 'win_cross', terr: prev.terr || 'grass2',
      rot: prev.rot === undefined ? 2 : prev.rot, colors: prev.colors || {}, buyTool: 'hand', stair: prev.stair || 'stairs_wood', poolMode: prev.poolMode || 'dig',
      placing: null, drag: null, hover: null, fresh: new Set(), floats: [], changed: false, changedWalls: false
    };
    this.buildTool = sub === 'build' ? this.bm.tool : null;
    this.root.classList.add('s3-building');
    if (this.queueEl) this.queueEl.style.display = 'none';
    this.makeToolbar();
    this.renderCatalog();
    if (!this._buildFx) this._buildFx = tr => this.buildGeo(tr);
    if (!this.r.extra.includes(this._buildFx)) this.r.extra.push(this._buildFx);
    this.r.showCeil = sub === 'buy';
    this.r.showRoofs = sub === 'build' && this.bm.tool === 'roof';
    if (sub === 'build') this.toolLevel();
    g.dirtyObjs();
  };

  G.lvNow = function () { return this.r ? this.r.viewLv || 0 : 0; };

  G.toolLevel = function () {
    const t = this.bm && this.bm.tool;
    if ((t === 'terrain' || t === 'pool') && this.curViewLv() > 0) this.setViewLv(0);
  };

  G.exitBuild = function () {
    const bm = this.bm;
    if (!bm) return;
    this.cancelHeld();
    bm.drag = null; bm.hover = null;
    this.buildTool = null;
    this.root.classList.remove('s3-building');
    if (this.toolbarEl) { this.toolbarEl.remove(); this.toolbarEl = null; }
    if (this.queueEl) this.queueEl.style.display = '';
    this.r.extra = this.r.extra.filter(f => f !== this._buildFx);
    this.r.showCeil = false;
    this.r.showRoofs = false;
    this.hideTip();
    if (bm.changed) this.finishBuild();
    this.game.dirtyObjs();
  };

  G.finishBuild = function () {
    const g = this.game, w = g.world, bm = this.bm, lot = g.lots[bm.lot];
    if (bm.changedWalls) {
      w.computeRooms();
      const fd = w.frontDoorOf(lot);
      lot.frontDoor = fd ? fd.out : null;
      lot.doorIn = fd ? fd.inn : null;
      lot.entrance = lot.frontDoor || [lot.x + (lot.w >> 1), lot.y + (lot.h >> 1)];
      for (const sim of g.sims.values()) if (!sim.dead && !sim.hidden && sim.lot === lot.id && sim.path) g.hardStop(sim);
    }
    this.refreshElevators();
    this.bumpSims();
    lot.dirty = true;
    lot.value = lotValue(w, lot);
    g.lightsChanged();
    bm.changed = false; bm.changedWalls = false;
  };

  G.bumpSims = function () {
    const g = this.game, w = g.world, lotId = this.bm.lot;
    for (const sim of g.sims.values()) {
      if (sim.dead || sim.hidden || sim.lot !== lotId || sim.seatOf || sim.lieH > 0.05 || sim.carriedBy || sim.inCrib || sim.swimZ || sim.ride) continue;
      const tx = Math.floor(sim.x), ty = Math.floor(sim.y), lv = sim.lv || 0;
      if (w.walkable(tx, ty, lv)) continue;
      let p = w.nearestWalkable(tx, ty, 8, null, lv);
      if (!p && lv) p = w.nearestWalkable(tx, ty, 12, null, 0);
      if (p) { g.hardStop(sim); sim.x = p[0] + 0.5; sim.y = p[1] + 0.5; sim.lv = p[2] || 0; sim.lot = w.lotAt(p[0], p[1]); }
    }
  };

  G.refreshElevators = function () {
    const w = this.game.world, lotId = this.bm ? this.bm.lot : -1;
    for (const ob of w.objects.values()) {
      if (ob.lot !== lotId || !OBJECTS[ob.t].elevator) continue;
      const lv = ob.lv || 0, old = ob.st.top || lv;
      w.stamp(ob, 0);
      ob.st.top = Math.max(lv, w.elevatorTop(ob.x, ob.y, ob.r, lv));
      w.stamp(ob, ob.id);
      if (ob.st.top !== old) { w.linkVersion++; w.version++; this.game.dirtyObjs(); }
    }
  };

  G.makeToolbar = function () {
    if (this.toolbarEl) this.toolbarEl.remove();
    const buy = this.bm.sub === 'buy';
    const tb = document.createElement('div');
    tb.className = 's3-toolbar s3-panel';
    tb.style.cssText = 'align-items:center;gap:10px;padding:6px 8px 6px 12px;border-radius:14px';
    tb.innerHTML = '<span style="color:#2a5a9a">' + iconSVG(buy ? 'ui_buy' : 'ui_build', 22) + '</span><div><div class="s3-title" style="font-size:12px">' + (buy ? 'Режим покупки' : 'Режим строительства') + '</div><div class="s3-sub bt-hint" style="width:300px;line-height:1.25"></div></div><div class="bt-lv"></div><div class="bt-cost" style="font:bold 12px Tahoma;color:#1e6a1e;min-width:74px;text-align:right"></div>';
    const done = document.createElement('button');
    done.className = 's3-btn';
    done.innerHTML = iconSVG('ui_check', 18);
    this.tipOn(done, '<b>Готово</b>Вернуться в режим жизни (Esc).');
    done.onclick = () => this.setSub('live');
    tb.appendChild(done);
    this.hudEl.appendChild(tb);
    this.toolbarEl = tb;
    this.updateToolbar();
  };

  G.updateToolbar = function () {
    if (!this.toolbarEl) return;
    const hh = this.game.active();
    this.toolbarEl.querySelector('.bt-hint').textContent = this.buildHint();
    this.toolbarEl.querySelector('.bt-cost').textContent = hh ? S.fmtMoney(hh.funds) : '';
    this.toolbarEl.querySelector('.bt-lv').textContent = 'Этаж ' + (this.curViewLv() + 1);
  };

  G.buildHint = function () {
    const bm = this.bm;
    if (bm.sub === 'buy') {
      if (bm.placing && bm.placing.move) return 'Щёлкните, чтобы поставить. R: поворот, I: в инвентарь семьи, Del: продать, Esc: вернуть на место.';
      if (bm.placing && bm.placing.fromFam) return 'Щёлкните, чтобы поставить. R: поворот. Esc: оставить в инвентаре.';
      if (bm.placing) return 'Щёлкните, чтобы поставить. R: поворот. Shift: поставить ещё один. Esc: отмена.';
      if (bm.buyTool === 'sell') return 'Щёлкните по вещи в доме, чтобы продать её.';
      if (bm.buyTool === 'stash') return 'Выберите вещь в инвентаре семьи, чтобы поставить её, или щёлкните по вещи в доме, чтобы убрать её сюда.';
      return 'Выберите предмет в каталоге или щёлкните по вещи в доме, чтобы переставить её.';
    }
    const t = BUILD_TOOLS.find(x => x[0] === bm.tool);
    return t ? t[3] : '';
  };

  G.renderCatalog = function () {
    const bm = this.bm, el = this.el.catalog;
    el.innerHTML = '<div class="cats" style="grid-template-columns:repeat(4,28px)"></div><div class="items"></div><div class="info"></div>';
    const cats = el.children[0];
    const items = el.children[1];
    items.addEventListener('wheel', e => { items.scrollLeft += e.deltaY + e.deltaX; e.preventDefault(); }, { passive: false });
    const add = (icon, title, on, fn) => {
      const b = document.createElement('button');
      b.className = 's3-btn' + (on ? ' on' : '');
      b.style.cssText = 'width:28px;height:28px';
      b.innerHTML = iconSVG(icon, 15);
      this.tipOn(b, '<b>' + esc(title) + '</b>');
      b.onclick = () => { if (this.audio) this.audio.ui('click'); this.hideTip('el'); fn(); };
      cats.appendChild(b);
    };
    if (bm.sub === 'buy') {
      const stash = bm.buyTool === 'stash';
      const toCatalog = () => { if (bm.buyTool === 'stash') { this.cancelHeld(); bm.buyTool = 'hand'; this.buildTool = null; } };
      add('ui_hand', 'Взять и переставить', bm.buyTool === 'hand', () => { this.cancelHeld(); bm.buyTool = 'hand'; this.buildTool = null; this.renderCatalog(); this.updateToolbar(); });
      add('ui_sell', 'Продать', bm.buyTool === 'sell', () => { this.cancelHeld(); bm.buyTool = 'sell'; this.buildTool = 'sell'; this.renderCatalog(); this.updateToolbar(); });
      add(bm.view === 'func' ? 'r_misc' : 'b_misc', bm.view === 'func' ? 'Каталог по комнатам' : 'Каталог по назначению', false, () => { toCatalog(); bm.view = bm.view === 'func' ? 'room' : 'func'; bm.cat = bm.view === 'func' ? 'seating' : 'living'; this.renderCatalog(); this.updateToolbar(); });
      add('ui_box', 'Инвентарь семьи (I)', stash, () => { this.cancelHeld(); bm.buyTool = 'stash'; this.buildTool = null; this.renderCatalog(); this.updateToolbar(); });
      const CATS = bm.view === 'func' ? FUNC_CATS : ROOM_CATS;
      for (const [k, c] of Object.entries(CATS)) add(c.icon, c.name, !stash && bm.cat === k, () => { toCatalog(); bm.cat = k; this.renderCatalog(); this.updateToolbar(); });
      this.renderBuyItems();
    } else {
      for (const [k, icon, name] of BUILD_TOOLS) add(icon, name, bm.tool === k, () => { this.cancelHeld(); bm.tool = k; this.buildTool = k; bm.drag = null; bm.hover = null; this.r.showRoofs = k === 'roof'; this.toolLevel(); this.renderCatalog(); this.updateToolbar(); });
      this.renderBuildItems();
    }
  };

  G.buyItemsList = function () {
    const bm = this.bm;
    return OBJECT_KEYS.filter(k => {
      const d = OBJECTS[k];
      if (d.hidden || !d.price || d.lotItem) return false;
      return bm.view === 'func' ? d.func === bm.cat : d.rooms.includes(bm.cat);
    }).sort((a, b) => OBJECTS[a].price - OBJECTS[b].price);
  };

  G.renderBuyItems = function () {
    const bm = this.bm;
    const items = this.el.catalog.querySelector('.items');
    if (!items || bm.sub !== 'buy') return;
    if (bm.buyTool === 'stash') { this.renderFamItems(); return; }
    const keep = items.scrollLeft;
    items.innerHTML = '';
    const list = this.buyItemsList();
    const hh = this.game.active();
    for (const k of list) {
      const d = OBJECTS[k];
      const it = document.createElement('div');
      it.className = 'it' + (bm.placing && !bm.placing.move && bm.placing.type === k ? ' on' : '');
      it.innerHTML = '<img src="' + this.stage.thumb(k, bm.colors[k] || d.col, 58) + '"><div class="pr"' + (hh && d.price > hh.funds ? ' style="color:#ffb0a0"' : '') + '>' + S.fmtMoney(d.price) + '</div>';
      it.onmouseenter = () => this.showInfo(k);
      it.onmouseleave = () => this.showInfo(bm.placing ? bm.placing.type : null);
      it.onclick = () => { this.startPlacing(k); this.renderBuyItems(); };
      items.appendChild(it);
    }
    items.scrollLeft = keep;
    this.showInfo(bm.placing ? bm.placing.type : null);
  };

  G.famPlaceable = function (it) { return (it.k === 'obj' && !!OBJECTS[it.t]) || it.k === 'painting'; };

  G.renderFamItems = function () {
    const bm = this.bm, g = this.game, hh = g.active();
    const items = this.el.catalog.querySelector('.items');
    if (!items) return;
    const keep = items.scrollLeft;
    items.innerHTML = '';
    const inv = hh ? g.famInv(hh) : [];
    const groups = new Map();
    inv.forEach((it, i) => {
      if (!this.famPlaceable(it)) return;
      const key = it.k === 'painting' || it.t === 'painting_own' ? 'p' + i : it.t + ':' + (it.col || []).join(',') + (it.broken ? ':b' : '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    });
    if (!groups.size) {
      items.innerHTML = '<div class="s3-sub" style="grid-row:1/3;width:300px;align-self:center;line-height:1.45;padding:4px 8px">Инвентарь семьи пуст. Щёлкните по вещи в доме, чтобы убрать её сюда. Потом её можно поставить снова, бесплатно.</div>';
      this.showFamInfo(null);
      return;
    }
    const held = bm.placing && bm.placing.fromFam;
    for (const list of groups.values()) {
      const it = list[0];
      const [type, extra] = this.placeExtra(it);
      const d = OBJECTS[type];
      const el = document.createElement('div');
      el.className = 'it' + (held && list.includes(held) ? ' on' : '');
      el.innerHTML = '<img src="' + this.stage.thumb(type, extra.col || d.col, 58) + '"><div class="pr">' + (list.length > 1 ? '× ' + list.length : 'в запасе') + '</div>';
      el.onmouseenter = () => this.showFamInfo(it);
      el.onmouseleave = () => this.showFamInfo(bm.placing && bm.placing.fromFam);
      el.onclick = () => { if (this.audio) this.audio.ui('click'); this.startPlacing(type, Object.assign({ fromFam: it }, extra)); this.renderBuyItems(); this.updateToolbar(); };
      items.appendChild(el);
    }
    items.scrollLeft = keep;
    this.showFamInfo(held);
  };

  G.showFamInfo = function (it) {
    const info = this.el.catalog.querySelector('.info');
    if (!info) return;
    const g = this.game, hh = g.active(), inv = hh ? g.famInv(hh) : [];
    if (!it) {
      const other = inv.filter(x => !this.famPlaceable(x)).length;
      info.innerHTML = '<div class="t">Инвентарь семьи</div><div class="d">Общие вещи семьи. Мебель ждёт здесь своего часа, поставить её обратно ничего не стоит. Клавиша I убирает сюда вещь под курсором.' + (other ? ' Ещё ' + other + ' ' + S.plural(other, ['вещь', 'вещи', 'вещей']) + ' (еда, книги, находки) видны во вкладке «Инвентарь» у симов.' : '') + '</div>';
      return;
    }
    const inf = this.itemInfo(it);
    info.innerHTML = '<div class="t">' + esc(inf.name) + '</div>' + (it.k === 'obj' ? '<div class="p">При продаже: ' + S.fmtMoney(g.famItemValue(it)) + '</div>' : '') + '<div class="d">' + (it.broken ? 'Сломано. ' : '') + 'Щёлкните, чтобы поставить бесплатно.</div>';
  };

  G.showInfo = function (k) {
    const info = this.el.catalog.querySelector('.info');
    if (!info) return;
    const bm = this.bm;
    if (!k || !OBJECTS[k]) {
      const CATS = bm.view === 'func' ? FUNC_CATS : ROOM_CATS;
      const c = CATS[bm.cat];
      info.innerHTML = '<div class="t">' + esc(c ? c.name : 'Каталог') + '</div><div class="d">Наведите на предмет, чтобы узнать о нём больше. Щёлкните, чтобы купить и поставить.</div>';
      return;
    }
    const d = OBJECTS[k];
    const held = bm.placing && bm.placing.type === k ? bm.placing : null;
    const cols = (held ? held.col : null) || bm.colors[k] || d.col;
    const st = [];
    if (d.seat) st.push('Уют: ' + d.seat);
    if (d.bed) st.push('Сон: ' + d.bed);
    if (d.env) st.push('Обстановка: +' + d.env);
    if (d.tv || d.stereo || d.computer) st.push('Веселье: ' + (d.tv || (d.stereo || 0) * 3 || (d.computer || 0) * 4));
    if (d.fridge || d.stove) st.push('Кухня: ' + (d.fridge || d.stove));
    if (d.toilet || d.shower || d.tub) st.push('Гигиена: ' + (d.toilet || d.shower || 2));
    if (d.light) st.push('Свет');
    if (d.skill) st.push('Навык: ' + (d.skill === 'all' ? 'любой' : SKILLS[d.skill].name.toLowerCase()));
    if (d.breaks) st.push('Надёжность: ' + (d.breaks <= 0.006 ? 'высокая' : d.breaks <= 0.01 ? 'средняя' : 'низкая'));
    info.innerHTML = '<div class="t">' + esc(d.name) + '</div><div class="p">' + (held && held.move ? 'Продать за ' + S.fmtMoney(this.sellValue(held.move)) : S.fmtMoney(d.price)) + '</div><div class="d">' + esc(d.desc || '') + '</div>' + (st.length ? '<div class="st">' + st.map(x => '<span>' + esc(x) + '</span>').join('') + '</div>' : '');
    if (!d.pal) return;
    d.pal.forEach((pal, slot) => {
      const row = document.createElement('div');
      row.className = 's3-swatches';
      for (const c of pal) {
        const sw = document.createElement('div');
        sw.className = 's3-sw' + (cols[slot] === c ? ' on' : '');
        sw.style.cssText = 'width:17px;height:17px;background:' + c;
        sw.onclick = () => {
          const nc = cols.slice();
          nc[slot] = c;
          bm.colors[k] = nc.slice();
          if (held) { held.col = nc.slice(); if (held.move) { held.move.col = nc.slice(); this.game.dirtyObjs(); this.bm.changed = true; } }
          this.renderBuyItems();
          this.showInfo(k);
        };
        row.appendChild(sw);
      }
      info.appendChild(row);
    });
  };

  G.renderBuildItems = function () {
    const bm = this.bm;
    const items = this.el.catalog.querySelector('.items');
    if (!items || bm.sub !== 'build') return;
    items.innerHTML = '';
    const tool = BUILD_TOOLS.find(t => t[0] === bm.tool);
    const A = this.r.atlas;
    const img = url => '<img src="' + url + '">';
    const card = (thumb, price, on, name, desc, fn) => {
      const it = document.createElement('div');
      it.className = 'it' + (on ? ' on' : '');
      it.innerHTML = thumb + (price !== null ? '<div class="pr">' + (price ? S.fmtMoney(price) : 'даром') + '</div>' : '');
      it.onmouseenter = () => this.buildInfo(name, price, desc);
      it.onmouseleave = () => this.buildInfo();
      it.onclick = () => { fn(); if (this.audio) this.audio.ui('click'); this.renderBuildItems(); };
      items.appendChild(it);
    };
    if (bm.tool === 'door') for (const [k, d] of Object.entries(DOORS)) card(img(doorThumb(d, 58)), d.price, bm.door === k, d.name, 'Двери пропускают симов в комнаты. Арка пропускает без двери.', () => { bm.door = k; });
    else if (bm.tool === 'window') for (const [k, d] of Object.entries(WINDOWS)) card(img(winThumb(d, 58)), d.price, bm.win === k, d.name, 'Окна впускают свет. Днём комнаты с окнами уютнее.', () => { bm.win = k; });
    else if (bm.tool === 'floor') {
      card('<div class="sw" style="background:repeating-linear-gradient(45deg,#8ab86a 0 6px,#79a75a 6px 12px)"></div>', 0, bm.floor === null, 'Снять покрытие', 'Убирает пол, под ним снова земля.', () => { bm.floor = null; });
      for (const [k, f] of Object.entries(FLOORS)) card(img(cellThumb(A, 'fl_' + k, 58)), f.price, bm.floor === k, f.name, 'Цена за одну клетку.', () => { bm.floor = k; });
    } else if (bm.tool === 'paint') for (const [k, p] of Object.entries(WALLPAPERS)) card(img(cellThumb(A, 'wp_' + k, 58)), p.price, bm.paper === k, p.name, 'Цена за одну сторону секции стены.', () => { bm.paper = k; });
    else if (bm.tool === 'terrain') for (const [k, t] of Object.entries(TERRAIN)) card(img(cellThumb(A, TERRAIN_CELL[k], 58)), t.price, bm.terr === k, t.name, 'Цена за одну клетку.', () => { bm.terr = k; });
    else if (bm.tool === 'stairs') for (const k of STAIR_ITEMS) { const d = OBJECTS[k]; card(img(this.stage.thumb(k, bm.colors[k] || d.col, 58)), d.price, bm.stair === k, d.name, d.desc, () => { bm.stair = k; bm.hover = null; }); }
    else if (bm.tool === 'pool') {
      card(img(poolThumb(58)), BUILD_COSTS.pool, bm.poolMode === 'dig', 'Выкопать бассейн', 'Обведите мышью клетки двора. Цена за одну клетку. Покрытие земли засыпает бассейн обратно.', () => { bm.poolMode = 'dig'; bm.hover = null; });
      const d = OBJECTS.pool_ladder;
      card(img(this.stage.thumb('pool_ladder', d.col, 58)), d.price, bm.poolMode === 'ladder', d.name, d.desc, () => { bm.poolMode = 'ladder'; bm.hover = null; });
    } else if (bm.tool === 'roof') {
      const lot = this.game.lots[bm.lot];
      const rc = lot.roof || ROOF_COLORS[0], st = lot.roofStyle || 'hip', pitch = lot.roofPitch || 1;
      const set = fn => () => { fn(); lot.dirty = true; bm.changed = true; };
      for (const [k, name, desc] of ROOF_STYLES) card(img(roofThumb(k, rc, pitch, 58)), null, st === k, name, desc + ' Меняется бесплатно.', set(() => { lot.roofStyle = k; }));
      for (const [p, name] of ROOF_PITCH) card(img(roofThumb(st === 'none' || st === 'flat' ? 'gable' : st, rc, p, 58)), null, Math.abs(pitch - p) < 0.01, name, 'Наклон крыши меняется бесплатно.', set(() => { lot.roofPitch = p; }));
      for (const c of ROOF_COLORS) card('<div class="sw" style="background:' + c + '"></div>', null, rc === c, 'Черепица', 'Цвет меняется бесплатно.', set(() => { lot.roof = c; }));
    } else items.innerHTML = '<div class="s3-sub" style="grid-row:1/3;width:280px;align-self:center;line-height:1.45;padding:4px 8px">' + esc(tool[3]) + '<br><br>Этажи: Page Up / Page Down. Стены: V. Поворот камеры: Q и E.</div>';
    this.buildInfo();
  };

  G.buildInfo = function (name, price, desc) {
    const info = this.el.catalog.querySelector('.info');
    if (!info) return;
    const tool = BUILD_TOOLS.find(t => t[0] === this.bm.tool);
    if (!name) { name = tool[2]; desc = tool[3]; price = null; }
    info.innerHTML = '<div class="t">' + esc(name) + '</div>' + (price !== null && price !== undefined ? '<div class="p">' + (price ? S.fmtMoney(price) : 'Бесплатно') + '</div>' : '') + '<div class="d">' + esc(desc || '') + '</div>';
  };

  G.startPlacing = function (type, extra) {
    const bm = this.bm;
    if (!bm || bm.sub !== 'buy' || !OBJECTS[type]) return;
    this.cancelHeld();
    const d = OBJECTS[type];
    const p = Object.assign({ type, col: (bm.colors[type] || d.col).slice() }, extra || {});
    if (p.fromInv) p.fromInv.item = p.fromInv.sim.inv[p.fromInv.idx];
    bm.placing = p;
    if (!p.fromFam) bm.buyTool = 'hand';
    this.buildTool = 'place';
    this.updateToolbar();
    if (bm.mx !== undefined) this.buyHover(bm.mx, bm.my);
  };

  G.cancelHeld = function () {
    const bm = this.bm;
    if (!bm) return;
    if (bm.placing && bm.placing.move) { bm.placing.move.held = false; this.game.dirtyObjs(); }
    bm.placing = null;
    bm.hover = null;
    this.buildTool = bm.sub === 'build' ? bm.tool : bm.buyTool === 'sell' ? 'sell' : null;
  };

  G.buildEscape = function () {
    const bm = this.bm;
    if (!bm || (this.sub !== 'buy' && this.sub !== 'build')) return false;
    if (bm.placing) { this.cancelHeld(); this.renderBuyItems(); this.updateToolbar(); return true; }
    if (bm.drag) { bm.drag = null; bm.hover = null; return true; }
    return false;
  };

  G.buildKey = function (e) {
    const bm = this.bm;
    if (!bm || (this.sub !== 'buy' && this.sub !== 'build')) return;
    if (e.code === 'KeyR') {
      bm.rot = (bm.rot + (e.shiftKey ? 3 : 1)) % 4;
      if (bm.mx !== undefined) this.buildMove(bm.mx, bm.my, e);
      if (this.audio) this.audio.ui('click');
    } else if (e.code === 'Delete' || e.code === 'Backspace') {
      e.preventDefault();
      if (bm.placing && bm.placing.move) { const ob = bm.placing.move; this.cancelHeld(); this.sellObject(ob, bm.mx, bm.my); }
      else if (bm.hover && bm.hover.kind === 'obj') this.sellObject(bm.hover.ob, bm.mx, bm.my);
    } else if (e.code === 'KeyI' && bm.sub === 'buy') {
      if (bm.placing && bm.placing.move) { const ob = bm.placing.move; this.cancelHeld(); this.stashObject(ob, bm.mx, bm.my); this.updateToolbar(); }
      else if (bm.hover && bm.hover.kind === 'obj') this.stashObject(bm.hover.ob, bm.mx, bm.my);
      else { this.cancelHeld(); bm.buyTool = 'stash'; this.buildTool = null; this.renderCatalog(); this.updateToolbar(); }
    }
  };

  G.tileAt = function (x, y) { const p = this.r.cam.ground(x, y, this.lvNow() * WALL_H); return [Math.floor(p[0]), Math.floor(p[1])]; };
  G.cornerAt = function (x, y) {
    const lot = this.game.lots[this.bm.lot];
    const p = this.r.cam.ground(x, y, this.lvNow() * WALL_H);
    return [Math.max(lot.x, Math.min(lot.x + lot.w, Math.round(p[0]))), Math.max(lot.y, Math.min(lot.y + lot.h, Math.round(p[1])))];
  };

  G.buildMove = function (x, y, e) {
    const bm = this.bm;
    if (!bm || this.mode !== 'live') return;
    bm.mx = x; bm.my = y; bm.shift = !!(e && e.shiftKey);
    if (this.mouse.down && this.mouse.btn !== 0) return;
    if (bm.sub === 'buy') this.buyHover(x, y);
    else this.buildHover(x, y);
  };

  G.buildDown = function (x, y, e) {
    const bm = this.bm;
    if (!bm || bm.sub !== 'build') return;
    const t = bm.tool;
    if (t === 'wall' || t === 'fence' || t === 'room' || t === 'hammer') { const c = this.cornerAt(x, y); bm.drag = { c0: c, c1: c }; bm.hover = this.edgePlan(c, c, t); }
    else if (t === 'floor' || t === 'terrain' || (t === 'pool' && bm.poolMode !== 'ladder')) { const tl = this.tileAt(x, y); bm.drag = { t0: tl }; bm.hover = this.tilePlan(tl, tl, t, e.shiftKey); }
    else if (t === 'roof') { const tl = this.tileAt(x, y); bm.drag = { t0: tl }; bm.hover = this.roofPlan(tl, tl); }
  };

  G.buildUp = function (x, y, e) {
    const bm = this.bm;
    if (!bm) return;
    if (bm.sub === 'buy') { if (this.mouse.drag && !bm.placing && bm.buyTool !== 'sell') return; this.buyClick(x, y, e); return; }
    const t = bm.tool;
    if (t === 'wall' || t === 'fence' || t === 'room' || t === 'hammer') {
      const d = bm.drag;
      bm.drag = null;
      if (!d) return;
      const c1 = this.cornerAt(x, y);
      if (t === 'hammer' && c1[0] === d.c0[0] && c1[1] === d.c0[1]) { this.hammerClick(x, y); this.buildHover(x, y); return; }
      const plan = this.edgePlan(d.c0, c1, t);
      if (plan.list.some(e2 => !e2.skip)) this.applyEdges(plan, x, y);
      this.buildHover(x, y);
    } else if (t === 'door' || t === 'window') {
      this.buildHover(x, y);
      const h = bm.hover;
      if (h) this.applyOpening(h, x, y); else this.hint('Щёлкните по стене своего дома.');
      this.buildHover(x, y);
    } else if (t === 'paint') {
      this.buildHover(x, y);
      if (bm.hover) this.applyPaint(bm.hover, x, y);
      this.buildHover(x, y);
    } else if (t === 'stairs' || (t === 'pool' && bm.poolMode === 'ladder')) {
      this.buildHover(x, y);
      this.placeBuildItem(bm.hover, x, y);
      this.buildHover(x, y);
    } else if (t === 'floor' || t === 'terrain' || t === 'pool') {
      const d = bm.drag;
      bm.drag = null;
      const tl = this.tileAt(x, y);
      const plan = this.tilePlan(d ? d.t0 : tl, tl, t, e.shiftKey && (!d || (d.t0[0] === tl[0] && d.t0[1] === tl[1])));
      this.applyTiles(plan, x, y);
      this.buildHover(x, y);
    } else if (t === 'roof') {
      const d = bm.drag;
      bm.drag = null;
      const tl = this.tileAt(x, y);
      const piece = !d || (d.t0[0] === tl[0] && d.t0[1] === tl[1]) ? this.roofPieceAt(tl) : null;
      if (piece) this.removeRoofPiece(piece, x, y);
      else this.applyRoofPlan(this.roofPlan(d ? d.t0 : tl, tl), x, y);
      this.buildHover(x, y);
    }
  };

  G.buyHover = function (x, y) {
    const bm = this.bm, cam = this.r.cam;
    const p = bm.placing;
    if (p) {
      const d = OBJECTS[p.type], lay = layerOf(d);
      const gp = cam.ground(x, y, this.lvNow() * WALL_H + (lay === 'surf' ? 0.8 : lay === 'wall' ? 1.2 : 0));
      const at = r => { const f = footprint(d, r); return [Math.floor(gp[0]) - ((f[0] - 1) >> 1), Math.floor(gp[1]) - ((f[1] - 1) >> 1)]; };
      let r = bm.rot, [ax, ay] = at(r);
      let chk = this.placeCheck(p, ax, ay, r);
      if (lay === 'wall' && !chk.ok) {
        for (let k = 1; k < 4; k++) {
          const rr = (bm.rot + k) % 4;
          const [bx, by] = at(rr);
          const c2 = this.placeCheck(p, bx, by, rr);
          if (c2.ok) { r = rr; ax = bx; ay = by; chk = c2; break; }
        }
      }
      bm.hover = { kind: 'place', x: ax, y: ay, r, ok: chk.ok, reason: chk.reason, cost: chk.cost || 0 };
      this.hideTip('obj');
      return;
    }
    const ob = this.buyPick(x, y);
    bm.hover = ob ? { kind: 'obj', ob } : null;
    if (ob) this.showTip(this.buyObjTip(ob), x + 16, y + 16, 'obj');
    else this.hideTip('obj');
  };

  G.buyPick = function (x, y) {
    const lotId = this.bm.lot, lv = this.lvNow();
    const p = this.r.pick(x, y, { sims: false, ceil: true, filter: ob => ob.lot === lotId && !ob.held && (ob.lv || 0) === lv });
    return p.hit && p.hit.kind === 'obj' ? p.hit.ob : null;
  };

  G.buyObjTip = function (ob) {
    const d = OBJECTS[ob.t];
    const why = this.cantMove(ob);
    let html = '<b>' + esc(ob.t === 'painting_own' && ob.st.title ? ob.st.title : d.name) + '</b>';
    if (why) return html + '<div class="neg">' + esc(why) + '</div>';
    const sellWhy = this.cantSell(ob);
    html += sellWhy ? '<div>' + esc(sellWhy) + '</div>' : '<div class="val">Продать за ' + S.fmtMoney(this.sellValue(ob)) + '</div>';
    if (ob.broken) html += '<div class="neg">Сломано</div>';
    if (this.bm.buyTool === 'stash') { const why2 = this.cantStash(ob); return html + (why2 ? '<div class="neg">' + esc(why2) + '</div>' : 'Щёлкните, чтобы убрать в инвентарь семьи.'); }
    return html + (this.bm.buyTool === 'sell' ? 'Щёлкните, чтобы продать.' : 'Щёлкните, чтобы переставить. I: в инвентарь семьи.');
  };

  G.placeCost = function (p) { return p.move || p.fromInv || p.fromFam ? 0 : OBJECTS[p.type].price; };

  G.placeCheck = function (p, x, y, r) {
    const g = this.game, w = g.world, hh = g.active(), lv = this.lvNow();
    const d = OBJECTS[p.type];
    const res = w.canPlace(p.type, x, y, r, { lot: hh.lot, lv, ignore: p.move ? p.move.id : 0 });
    if (!res.ok) return res;
    const lay = layerOf(d);
    if (lay === 'ceil' && !w.indoor(x, y, lv)) return { ok: false, reason: 'Потолочный светильник вешают в комнате' };
    if (lay === 'occ' && !lv) for (const [tx, ty] of w.footTiles(d, x, y, r)) {
      const t = w.ter(tx, ty);
      if (t === TER.road || t === TER.walk) return { ok: false, reason: 'За пределами участка' };
    }
    const cost = this.placeCost(p);
    if (cost > hh.funds) return { ok: false, reason: 'Не хватает денег' };
    return { ok: true, cost };
  };

  G.cantMove = function (ob) {
    const d = OBJECTS[ob.t];
    if (ob.lot !== this.bm.lot) return 'Это не ваш участок';
    if (d.rabbit || d.tree) return 'Этот предмет нельзя сдвинуть';
    if (d.build) return 'Это меняют в режиме строительства';
    if (d.hidden && !CLUTTER[ob.t] && ob.t !== 'tombstone' && ob.t !== 'painting_own') return 'Этот предмет нельзя сдвинуть';
    if (this.game.fires.some(f => Math.abs(f.x - ob.x) < 2 && Math.abs(f.y - ob.y) < 2)) return 'Сначала потушите пожар';
    return null;
  };

  G.cantSell = function (ob) {
    const d = OBJECTS[ob.t];
    if (d.lotItem) return 'Нужен участку, продать нельзя';
    if (ob.t === 'tombstone') return 'Надгробие не продаётся';
    return null;
  };

  G.sellValue = function (ob) {
    const d = OBJECTS[ob.t];
    if (CLUTTER[ob.t]) return 0;
    const v = ob.value !== undefined ? ob.value : d.price;
    if (this.bm && this.bm.fresh.has(ob.id)) return v;
    if (ob.t === 'painting_own') return v;
    return Math.round(v * 0.7 * (ob.broken ? 0.5 : 1));
  };

  G.surfaceItems = function (ob) {
    const w = this.game.world, out = [];
    if (ob.layer !== 'occ') return out;
    for (const [tx, ty] of w.tilesOf(ob)) { const si = w.inb(tx, ty) ? w.layer.surf[w.li(tx, ty, ob.lv)] : 0; if (si && w.objects.get(si)) out.push(w.objects.get(si)); }
    return out;
  };

  G.cantStash = function (ob) {
    const d = OBJECTS[ob.t];
    if (CLUTTER[ob.t]) return 'Это мусор, его не хранят';
    if (d.lotItem) return 'Нужен участку, убрать нельзя';
    return null;
  };

  G.famItem = function (ob) {
    const st = JSON.parse(JSON.stringify(ob.st || {}));
    for (const k of ['on', 'cooking', 'play', 'woohoo', 'ride']) delete st[k];
    const it = { k: 'obj', t: ob.t, col: ob.col.slice(), st, value: ob.value !== undefined ? ob.value : OBJECTS[ob.t].price };
    if (ob.art) it.art = ob.art;
    if (ob.broken) it.broken = true;
    return it;
  };

  G.stashObject = function (ob, x, y) {
    const g = this.game, w = g.world, hh = g.active(), bm = this.bm;
    const why = this.cantMove(ob) || this.cantStash(ob);
    if (why) { this.hint(why); if (this.audio) this.audio.ui('deny'); return false; }
    this.releaseObj(ob);
    const inv = g.famInv(hh);
    for (const o of [ob].concat(this.surfaceItems(ob))) if (!CLUTTER[o.t]) inv.push(this.famItem(o));
    ob.held = false;
    bm.fresh.delete(ob.id);
    w.removeObject(ob.id);
    bm.hover = null;
    this.hideTip('obj');
    bm.floats.push({ x: x !== undefined ? x : bm.mx || 200, y: y !== undefined ? y : bm.my || 200, text: 'В инвентарь семьи', good: true, t: performance.now() });
    if (this.audio) this.audio.ui('pick');
    this.afterBuild(false);
    this.tabSig = '';
    this.renderBuyItems();
    return true;
  };

  G.releaseObj = function (ob) {
    const g = this.game;
    const set = [ob].concat(this.surfaceItems(ob));
    for (const sim of g.sims.values()) {
      if (sim.dead) continue;
      const uses = sim.queue.some(a => set.includes(a.target) || a.reserved.some(r => set.includes(r[0]))) || set.some(o => sim.seatOf === o.id);
      if (uses) g.hardStop(sim);
      if (sim.inCrib && set.some(o => o.id === sim.inCrib)) { sim.inCrib = null; }
    }
    for (const o of set) o.use = {};
  };

  G.pickUpObject = function (ob) {
    const bm = this.bm;
    this.releaseObj(ob);
    bm.placing = { type: ob.t, col: ob.col.slice(), move: ob, st: ob.st };
    bm.rot = ob.r;
    ob.held = true;
    this.game.dirtyObjs();
    this.buildTool = 'place';
    this.showInfo(ob.t);
    this.updateToolbar();
    if (this.audio) this.audio.ui('pick');
  };

  G.sellObject = function (ob, x, y) {
    const g = this.game, w = g.world;
    const why = this.cantMove(ob) || this.cantSell(ob);
    if (why) { this.hint(why); if (this.audio) this.audio.ui('deny'); return; }
    this.releaseObj(ob);
    let refund = this.sellValue(ob);
    for (const si of this.surfaceItems(ob)) refund += this.sellValue(si);
    ob.held = false;
    w.removeObject(ob.id);
    this.spend(-refund, x, y);
    this.bm.hover = null;
    this.hideTip('obj');
    this.afterBuild(false);
    this.renderBuyItems();
  };

  G.buyClick = function (x, y, e) {
    const bm = this.bm, g = this.game, w = g.world;
    const p = bm.placing;
    if (p) {
      this.buyHover(x, y);
      const h = bm.hover;
      if (!h || h.kind !== 'place') return;
      if (!h.ok) { if (this.audio) this.audio.ui('deny'); this.hint(h.reason || 'Сюда нельзя'); return; }
      const lv = this.lvNow();
      if (p.move) {
        const ob = p.move;
        w.moveObject(ob.id, h.x, h.y, h.r, lv);
        ob.held = false;
        bm.placing = null;
      } else {
        const props = { lot: bm.lot, lv, col: p.col.slice() };
        if (p.st) props.st = JSON.parse(JSON.stringify(p.st));
        if (p.art) props.art = p.art;
        if (p.value !== undefined) props.value = p.value;
        if (p.broken) props.broken = true;
        const ob = w.placeObject(p.type, h.x, h.y, h.r, props);
        if (h.cost) { this.spend(h.cost, x, y); bm.fresh.add(ob.id); }
        if (p.fromInv) {
          const inv = p.fromInv.sim.inv;
          const i = inv.indexOf(p.fromInv.item);
          if (i >= 0) inv.splice(i, 1);
          this.tabSig = '';
        }
        if (p.fromFam) {
          const inv = g.famInv(g.active());
          const i = inv.indexOf(p.fromFam);
          if (i >= 0) inv.splice(i, 1);
          this.tabSig = '';
        }
        if (!(e && e.shiftKey) || p.fromInv || p.fromFam || OBJECTS[p.type].price > g.active().funds) bm.placing = null;
      }
      this.buildTool = bm.placing ? 'place' : null;
      this.afterBuild(false);
      this.bumpSims();
      if (this.audio) this.audio.ui('place');
      this.renderBuyItems();
      this.updateToolbar();
      this.buyHover(x, y);
      return;
    }
    const ob = this.buyPick(x, y);
    if (!ob) return;
    if (bm.buyTool === 'sell') { this.sellObject(ob, x, y); return; }
    if (bm.buyTool === 'stash') { this.stashObject(ob, x, y); return; }
    const why = this.cantMove(ob);
    if (why) { this.hint(why); if (this.audio) this.audio.ui('deny'); return; }
    this.pickUpObject(ob);
    this.buyHover(x, y);
  };

  G.spend = function (amount, x, y) {
    const hh = this.game.active();
    if (!hh || !amount) return;
    hh.funds -= amount;
    const bm = this.bm;
    bm.floats.push({ x: x !== undefined ? x : bm.mx || 200, y: y !== undefined ? y : bm.my || 200, text: (amount > 0 ? '−' : '+') + S.fmtMoney(Math.abs(amount)), good: amount < 0, t: performance.now() });
    if (this.audio) this.audio.ui(amount > 0 ? 'buy' : 'sell');
    this.refreshHud(false);
    this.updateToolbar();
  };

  G.afterBuild = function (walls) {
    const g = this.game, bm = this.bm, lot = g.lots[bm.lot];
    if (walls) { g.world.computeRooms(); bm.changedWalls = true; }
    bm.changed = true;
    lot.dirty = true;
    g.dirtyObjs();
    g.lightsChanged();
    this.updateToolbar();
  };

  G.buildHover = function (x, y) {
    const bm = this.bm, t = bm.tool;
    if (t === 'wall' || t === 'fence' || t === 'room' || t === 'hammer') {
      const c = this.cornerAt(x, y);
      if (bm.drag) { bm.drag.c1 = c; bm.hover = this.edgePlan(bm.drag.c0, c, t); return; }
      if (t === 'hammer') {
        const ob = this.buildObjAt(x, y);
        if (ob) { bm.hover = { kind: 'hammerObj', ob, ok: true, cost: -OBJECTS[ob.t].price }; return; }
        const h = this.wallAt(x, y);
        if (h) { bm.hover = { kind: 'hammer', wl: h.wl, ok: true, cost: -this.wallRefund(h.wl, h.wl.door || h.wl.win ? 'opening' : 'all') }; return; }
      }
      bm.hover = { kind: 'corner', c };
    } else if (t === 'door' || t === 'window') {
      const h = this.wallAt(x, y);
      bm.hover = h ? Object.assign({ kind: t, wl: h.wl }, this.openingCheck(h.wl, t)) : null;
    } else if (t === 'paint') {
      const h = this.wallAt(x, y);
      if (!h || h.wl.fence) { bm.hover = null; return; }
      const faces = bm.shift ? this.roomFaces(h.wl, h.face) : [[h.wl, h.face]];
      const price = WALLPAPERS[bm.paper].price;
      const cost = faces.filter(([wl, f]) => wl[f] !== bm.paper).length * price;
      const funds = this.game.active().funds;
      bm.hover = { kind: 'paint', faces, cost, ok: cost <= funds, reason: cost > funds ? 'Не хватает денег' : '' };
    } else if (t === 'floor' || t === 'terrain' || (t === 'pool' && bm.poolMode !== 'ladder')) {
      const tile = this.tileAt(x, y);
      bm.hover = this.tilePlan(bm.drag ? bm.drag.t0 : tile, tile, t, bm.shift && !bm.drag);
    } else if (t === 'stairs') bm.hover = this.stairHover(x, y);
    else if (t === 'pool') bm.hover = this.ladderHover(x, y);
    else if (t === 'roof') {
      const tile = this.tileAt(x, y);
      const piece = bm.drag ? null : this.roofPieceAt(tile);
      bm.hover = piece ? { kind: 'roofdel', piece, ok: true, cost: -piece.w * piece.h * BUILD_COSTS.roof } : this.roofPlan(bm.drag ? bm.drag.t0 : tile, tile);
    } else bm.hover = null;
  };

  G.buildObjAt = function (x, y) {
    const w = this.game.world, lotId = this.bm.lot, lv = this.lvNow();
    const p = this.r.pick(x, y, { sims: false, filter: ob => ob.lot === lotId && OBJECTS[ob.t].build && S.objLevels(ob).includes(lv) });
    if (p.hit && p.hit.kind === 'obj') return p.hit.ob;
    const t = this.tileAt(x, y);
    for (const lay of ['occ', 'ground']) { const ob = w.objAt(t[0], t[1], lay, lv); if (ob && ob.lot === lotId && OBJECTS[ob.t].build) return ob; }
    return null;
  };

  G.stairHover = function (x, y) {
    const bm = this.bm, g = this.game, w = g.world, lv = this.lvNow();
    const type = bm.stair, d = OBJECTS[type];
    const gp = this.r.cam.ground(x, y, lv * WALL_H);
    const f = footprint(d, bm.rot);
    const ax = Math.floor(gp[0]) - ((f[0] - 1) >> 1), ay = Math.floor(gp[1]) - ((f[1] - 1) >> 1);
    const chk = d.elevator ? w.elevatorCheck(type, ax, ay, bm.rot, lv, bm.lot) : w.stairsCheck(type, ax, ay, bm.rot, lv, bm.lot);
    const res = { kind: 'bplace', type, x: ax, y: ay, r: bm.rot, lv, ok: chk.ok, reason: chk.reason, cost: d.price, st: d.elevator && chk.ok ? { top: chk.top } : {} };
    if (res.ok && d.price > g.active().funds) { res.ok = false; res.reason = 'Не хватает денег'; }
    if (!res.ok) res.cost = 0;
    return res;
  };

  G.ladderHover = function (x, y) {
    const bm = this.bm, g = this.game, w = g.world;
    const gp = this.r.cam.ground(x, y, 0);
    const ax = Math.floor(gp[0]), ay = Math.floor(gp[1]);
    let r = bm.rot, chk = w.canPlace('pool_ladder', ax, ay, r, { lot: bm.lot });
    if (!chk.ok && w.isPool(ax, ay)) {
      for (let k = 1; k < 4; k++) {
        const rr = (bm.rot + k) % 4;
        const c2 = w.canPlace('pool_ladder', ax, ay, rr, { lot: bm.lot });
        if (c2.ok) { r = rr; chk = c2; break; }
      }
    }
    const price = OBJECTS.pool_ladder.price;
    const res = { kind: 'bplace', type: 'pool_ladder', x: ax, y: ay, r, lv: 0, ok: chk.ok, reason: chk.reason, cost: price, st: {} };
    if (res.ok && price > g.active().funds) { res.ok = false; res.reason = 'Не хватает денег'; }
    if (!res.ok) res.cost = 0;
    return res;
  };

  G.placeBuildItem = function (h, x, y) {
    if (!h || h.kind !== 'bplace') return;
    if (!h.ok) { if (this.audio) this.audio.ui('deny'); this.hint(h.reason || 'Сюда нельзя'); return; }
    const g = this.game, w = g.world, d = OBJECTS[h.type], bm = this.bm;
    if (d.stairs) { const s = w.stairInfo({ t: h.type, x: h.x, y: h.y, r: h.r, lv: h.lv }); for (const [px, py] of s.tiles) w.setFloor(px, py, null, h.lv + 1); }
    const props = { lot: bm.lot, lv: h.lv, col: (bm.colors[h.type] || d.col).slice() };
    if (d.elevator) props.st = { top: h.st.top };
    w.placeObject(h.type, h.x, h.y, h.r, props);
    this.spend(h.cost, x, y);
    this.afterBuild(false);
    this.bumpSims();
    if (this.audio) this.audio.ui('build');
    if (d.stairs && !bm.toldStairs) { bm.toldStairs = true; this.hint('Симы сами поднимутся наверх, когда им что-то там понадобится.'); }
  };

  G.demolishObj = function (ob, x, y) {
    const g = this.game, w = g.world;
    for (const sim of g.sims.values()) if (!sim.dead && sim.lot === ob.lot && (sim.ride || sim.queue.some(a => a.target === ob))) g.hardStop(sim);
    w.removeObject(ob.id);
    this.spend(-OBJECTS[ob.t].price, x, y);
    this.afterBuild(false);
    this.bumpSims();
    if (this.audio) this.audio.ui('demolish');
  };

  G.validateLadders = function (x, y) {
    const w = this.game.world, lotId = this.bm.lot;
    let refund = 0;
    for (const ob of [...w.objects.values()]) {
      if (ob.lot !== lotId || !OBJECTS[ob.t].poolEdge) continue;
      if (w.canPlace(ob.t, ob.x, ob.y, ob.r, { lot: lotId, ignore: ob.id }).ok) continue;
      w.removeObject(ob.id);
      refund += OBJECTS[ob.t].price;
    }
    if (refund) this.spend(-refund, x, y);
  };

  G.roofPlan = function (a, b) {
    const g = this.game, lot = g.lots[this.bm.lot], lv = this.lvNow();
    const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
    const plan = { kind: 'roofrect', x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, lv, ok: true, reason: '', cost: 0 };
    if (!tileInLot(x0, y0, lot) || !tileInLot(x1, y1, lot)) { plan.ok = false; plan.reason = 'За пределами участка'; return plan; }
    if (plan.w > 12 || plan.h > 12) { plan.ok = false; plan.reason = 'Навес не шире 12 клеток'; return plan; }
    for (const p of lot.roofPieces || []) {
      if ((p.lv || 0) === lv && p.x <= x1 && x0 < p.x + p.w && p.y <= y1 && y0 < p.y + p.h) { plan.ok = false; plan.reason = 'Здесь уже есть навес'; return plan; }
    }
    plan.cost = plan.w * plan.h * BUILD_COSTS.roof;
    if (plan.cost > g.active().funds) { plan.ok = false; plan.reason = 'Не хватает денег'; }
    return plan;
  };

  G.roofPieceAt = function (t) {
    const lot = this.game.lots[this.bm.lot], lv = this.lvNow();
    return (lot.roofPieces || []).find(p => (p.lv || 0) === lv && t[0] >= p.x && t[0] < p.x + p.w && t[1] >= p.y && t[1] < p.y + p.h) || null;
  };

  G.applyRoofPlan = function (plan, x, y) {
    if (!plan.ok) { if (this.audio) this.audio.ui('deny'); this.hint(plan.reason || 'Здесь нельзя'); return; }
    const lot = this.game.lots[this.bm.lot];
    const style = lot.roofStyle && lot.roofStyle !== 'none' ? lot.roofStyle : 'gable';
    lot.roofPieces = (lot.roofPieces || []).concat([{ x: plan.x, y: plan.y, w: plan.w, h: plan.h, lv: plan.lv, style }]);
    this.spend(plan.cost, x, y);
    this.afterBuild(false);
    if (this.audio) this.audio.ui('build');
  };

  G.removeRoofPiece = function (p, x, y) {
    const lot = this.game.lots[this.bm.lot];
    lot.roofPieces = (lot.roofPieces || []).filter(q => q !== p);
    this.spend(-p.w * p.h * BUILD_COSTS.roof, x, y);
    this.afterBuild(false);
    if (this.audio) this.audio.ui('demolish');
  };

  G.wallAt = function (mx, my) {
    const w = this.game.world, r = this.r, cam = r.cam, lotId = this.bm.lot, lv = this.lvNow(), bz = lv * WALL_H;
    const ray = cam.ray(mx, my), o = ray.o, d = ray.d;
    const tall = this.bm.tool === 'door' || this.bm.tool === 'window' || this.bm.tool === 'hammer';
    let best = null, bt = 1e9;
    for (const wl of w.walls) {
      if (!wl || wl.lot !== lotId || (wl.lv || 0) !== lv) continue;
      const H = tall && !wl.fence ? Math.max(r.wallHeight(wl, lotId), 2.3) : r.wallHeight(wl, lotId);
      let t, u;
      if (wl.o === 'h') { if (Math.abs(d[1]) < 1e-6) continue; t = (wl.y - o[1]) / d[1]; u = o[0] + d[0] * t - wl.x; }
      else { if (Math.abs(d[0]) < 1e-6) continue; t = (wl.x - o[0]) / d[0]; u = o[1] + d[1] * t - wl.y; }
      if (u < 0 || u > 1) continue;
      const z = o[2] + d[2] * t - bz;
      if (z < -0.05 || z > H + 0.05) continue;
      if (t < bt) { bt = t; best = { wl, face: wl.o === 'h' ? (d[1] < 0 ? 'b' : 'a') : (d[0] < 0 ? 'b' : 'a') }; }
    }
    if (best) return best;
    const gp = cam.ground(mx, my, bz);
    const cands = [['h', Math.floor(gp[0]), Math.round(gp[1]), Math.abs(gp[1] - Math.round(gp[1]))], ['v', Math.round(gp[0]), Math.floor(gp[1]), Math.abs(gp[0] - Math.round(gp[0]))]].sort((a, b) => a[3] - b[3]);
    for (const [o2, x2, y2, dd] of cands) {
      if (dd > 0.4) continue;
      const wl = w.getWall(o2, x2, y2, lv);
      if (wl && wl.lot === lotId) return { wl, face: o2 === 'h' ? (gp[1] < y2 ? 'a' : 'b') : (gp[0] < x2 ? 'a' : 'b') };
    }
    return null;
  };

  G.wallItems = function (o, x, y, lv) {
    const w = this.game.world, out = [];
    const [A, B] = edgeTiles(o, x, y);
    const rA = o === 'h' ? 0 : 3, rB = o === 'h' ? 2 : 1;
    for (const [t, r] of [[A, rA], [B, rB]]) {
      const id = w.wallSlots.get(S.slotKey(t[0], t[1], r, lv));
      if (id && w.objects.get(id)) out.push(w.objects.get(id));
    }
    return out;
  };

  G.wallRefund = function (wl, part) {
    let v = 0;
    if (part !== 'opening' || (!wl.door && !wl.win)) {
      v += wl.fence ? BUILD_COSTS.fence : BUILD_COSTS.wall;
      for (const ob of this.wallItems(wl.o, wl.x, wl.y, wl.lv)) v += this.sellValue(ob);
    }
    if (wl.door) v += DOORS[wl.door].price;
    if (wl.win) v += WINDOWS[wl.win].price;
    return v;
  };

  G.splitsObject = function (o, x, y, lv) {
    const w = this.game.world;
    const [A, B] = edgeTiles(o, x, y);
    if (!w.inb(A[0], A[1]) || !w.inb(B[0], B[1])) return false;
    const ia = w.li(A[0], A[1], lv), ib = w.li(B[0], B[1], lv);
    for (const lay of ['occ', 'rug', 'ground']) { const a = w.layer[lay][ia]; if (a && a === w.layer[lay][ib]) return true; }
    return false;
  };

  G.stairwellAt = function (x, y, lv) {
    const ob = lv > 0 ? this.game.world.objAt(x, y, 'occ', lv) : null;
    return !!ob && !!OBJECTS[ob.t].stairs && (ob.lv || 0) === lv - 1;
  };

  G.edgePlan = function (c0, c1, tool) {
    const g = this.game, w = g.world, bm = this.bm, lot = g.lots[bm.lot], lv = this.lvNow();
    const edges = [];
    let room = null;
    if (tool === 'room') {
      const x0 = Math.min(c0[0], c1[0]), x1 = Math.max(c0[0], c1[0]), y0 = Math.min(c0[1], c1[1]), y1 = Math.max(c0[1], c1[1]);
      if (x1 > x0 && y1 > y0) {
        room = [x0, y0, x1, y1];
        for (let x = x0; x < x1; x++) { edges.push(['h', x, y0]); edges.push(['h', x, y1]); }
        for (let y = y0; y < y1; y++) { edges.push(['v', x0, y]); edges.push(['v', x1, y]); }
      }
    } else if (Math.abs(c1[0] - c0[0]) >= Math.abs(c1[1] - c0[1])) {
      for (let x = Math.min(c0[0], c1[0]); x < Math.max(c0[0], c1[0]); x++) edges.push(['h', x, c0[1]]);
    } else {
      for (let y = Math.min(c0[1], c1[1]); y < Math.max(c0[1], c1[1]); y++) edges.push(['v', c0[0], y]);
    }
    const plan = { kind: 'edges', tool, lv, list: [], cost: 0, ok: true, reason: '', end: c1, floors: [], floorKey: bm.floor || 'wood_light' };
    const held = (tx, ty) => w.inb(tx, ty) && (w.supported(tx, ty, lv) || w.hasFloor(tx, ty, lv));
    for (const [o, x, y] of edges) {
      const e = { o, x, y, ok: true, skip: false };
      const cur = w.getWall(o, x, y, lv);
      if (!edgeInLot(o, x, y, lot)) { e.ok = false; plan.reason = 'За пределами участка'; }
      else if (tool === 'hammer') {
        if (!cur || cur.lot !== lot.id) e.skip = true;
        else plan.cost -= this.wallRefund(cur, 'all');
      } else if (cur && (tool === 'fence' || !cur.fence)) e.skip = true;
      else if (lv > 0 && !edgeTiles(o, x, y).some(([tx, ty]) => held(tx, ty))) { e.ok = false; plan.reason = 'Наверху стены держатся только над комнатами нижнего этажа'; }
      else if (this.splitsObject(o, x, y, lv)) { e.ok = false; plan.reason = 'Мешает предмет'; }
      else plan.cost += tool === 'fence' ? BUILD_COSTS.fence : BUILD_COSTS.wall;
      plan.list.push(e);
    }
    if (room && lv > 0) {
      for (let y = room[1]; y < room[3]; y++) for (let x = room[0]; x < room[2]; x++) {
        if (w.hasFloor(x, y, lv) || this.stairwellAt(x, y, lv)) continue;
        if (!w.supported(x, y, lv)) { plan.ok = false; plan.reason = 'Пол наверху держится только над комнатами нижнего этажа'; continue; }
        plan.floors.push([x, y]);
        plan.cost += FLOORS[plan.floorKey].price;
      }
    }
    if (!plan.ok || plan.list.some(e => !e.ok)) plan.ok = false;
    else if (plan.cost > g.active().funds) { plan.ok = false; plan.reason = 'Не хватает денег'; }
    return plan;
  };

  G.applyEdges = function (plan, x, y) {
    if (!plan.ok) { if (this.audio) this.audio.ui('deny'); this.hint(plan.reason || 'Здесь строить нельзя'); return; }
    const g = this.game, w = g.world, lot = g.lots[this.bm.lot], lv = plan.lv || 0;
    const added = [];
    for (const e of plan.list) {
      if (e.skip) continue;
      if (plan.tool === 'hammer') { if (w.getWall(e.o, e.x, e.y, lv)) w.removeWall(e.o, e.x, e.y, lv); }
      else added.push(w.addWall(e.o, e.x, e.y, { lot: lot.id, lv, fence: plan.tool === 'fence', a: 'paint_white', b: 'paint_white', door: null, win: null }));
    }
    for (const [fx, fy] of plan.floors || []) w.setFloor(fx, fy, plan.floorKey, lv);
    this.spend(plan.cost, x, y);
    this.afterBuild(true);
    for (const wl of added) {
      if (!wl || wl.fence) continue;
      for (const f of ['a', 'b']) { const t = faceTile(wl, f); if (!w.indoor(t[0], t[1], lv)) wl[f] = lot.ext || 'siding'; }
    }
    w.wallVersion++;
    if (this.audio) this.audio.ui(plan.tool === 'hammer' ? 'demolish' : 'build');
  };

  G.hammerClick = function (x, y) {
    const ob = this.buildObjAt(x, y);
    if (ob) { this.demolishObj(ob, x, y); return; }
    const h = this.wallAt(x, y);
    if (!h) return;
    const wl = h.wl, w = this.game.world;
    if (wl.door || wl.win) {
      const refund = (wl.door ? DOORS[wl.door].price : 0) + (wl.win ? WINDOWS[wl.win].price : 0);
      wl.door = null; wl.win = null;
      w.wallVersion++;
      this.spend(-refund, x, y);
    } else {
      const refund = this.wallRefund(wl, 'all');
      w.removeWall(wl.o, wl.x, wl.y, wl.lv);
      this.spend(-refund, x, y);
    }
    this.afterBuild(true);
    if (this.audio) this.audio.ui('demolish');
  };

  G.openingCheck = function (wl, kind) {
    const w = this.game.world, bm = this.bm;
    if (wl.fence) return { ok: false, reason: 'В заборе так нельзя' };
    const key = kind === 'door' ? bm.door : bm.win;
    if ((kind === 'door' && wl.door === key) || (kind === 'window' && wl.win === key)) return { ok: false, reason: 'Здесь уже стоит такая же' };
    if (kind === 'door') for (const [tx, ty] of edgeTiles(wl.o, wl.x, wl.y)) if (w.inb(tx, ty) && w.layer.occ[w.li(tx, ty, wl.lv)]) return { ok: false, reason: 'Проход загорожен предметом' };
    if (this.wallItems(wl.o, wl.x, wl.y, wl.lv).length) return { ok: false, reason: 'На стене что-то висит' };
    const refund = (wl.door ? DOORS[wl.door].price : 0) + (wl.win ? WINDOWS[wl.win].price : 0);
    const cost = (kind === 'door' ? DOORS[key].price : WINDOWS[key].price) - refund;
    if (cost > this.game.active().funds) return { ok: false, reason: 'Не хватает денег' };
    return { ok: true, cost };
  };

  G.applyOpening = function (h, x, y) {
    if (!h.ok) { if (this.audio) this.audio.ui('deny'); this.hint(h.reason); return; }
    const wl = h.wl, bm = this.bm;
    if (h.kind === 'door') { wl.win = null; wl.door = bm.door; }
    else { wl.door = null; wl.win = bm.win; }
    this.game.world.wallVersion++;
    this.spend(h.cost, x, y);
    this.afterBuild(true);
    if (this.audio) this.audio.ui('build');
  };

  G.roomFaces = function (wl, face) {
    const w = this.game.world;
    const t = faceTile(wl, face), lv = wl.lv || 0;
    const rid = w.roomAt(t[0], t[1], lv);
    const out = [];
    for (const w2 of w.walls) {
      if (!w2 || w2.lot !== wl.lot || w2.fence || (w2.lv || 0) !== lv) continue;
      for (const f of ['a', 'b']) { const tt = faceTile(w2, f); if (w.inb(tt[0], tt[1]) && w.roomAt(tt[0], tt[1], lv) === rid) out.push([w2, f]); }
    }
    return out;
  };

  G.applyPaint = function (h, x, y) {
    if (!h.ok) { if (this.audio) this.audio.ui('deny'); this.hint(h.reason); return; }
    const bm = this.bm;
    let n = 0;
    for (const [wl, f] of h.faces) if (wl[f] !== bm.paper) { wl[f] = bm.paper; n++; }
    if (!n) return;
    this.game.world.wallVersion++;
    this.spend(h.cost, x, y);
    this.afterBuild(false);
    if (this.audio) this.audio.ui('paint');
  };

  G.floorRemoveBlock = function (x, y, lv) {
    const g = this.game, w = g.world, j = w.li(x, y, lv);
    for (const lay of ['occ', 'surf', 'rug', 'ground', 'ceil']) if (w.layer[lay][j]) return 'Сначала уберите вещи';
    for (const s of g.sims.values()) if (!s.dead && !s.hidden && (s.lv || 0) === lv && Math.floor(s.x) === x && Math.floor(s.y) === y) return 'Здесь стоит сим';
    for (const ob of w.objects.values()) {
      if (ob.lot !== this.bm.lot || !OBJECTS[ob.t].stairs) continue;
      const s = w.stairInfo(ob);
      if (s.exit[0] === x && s.exit[1] === y && s.exit[2] === lv) return 'Это выход с лестницы';
    }
    return null;
  };

  G.tilePlan = function (a, b, tool, fillRoom) {
    const g = this.game, w = g.world, bm = this.bm, lot = g.lots[bm.lot];
    const lv = tool === 'floor' ? this.lvNow() : 0;
    const tiles = [];
    if (fillRoom && tool === 'floor' && w.inb(b[0], b[1]) && w.roomAt(b[0], b[1], lv) > 0) {
      const rid = w.roomAt(b[0], b[1], lv);
      for (let y = lot.y; y < lot.y + lot.h; y++) for (let x = lot.x; x < lot.x + lot.w; x++) if (w.roomAt(x, y, lv) === rid) tiles.push([x, y]);
    } else {
      for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++) for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) tiles.push([x, y]);
    }
    const plan = { kind: 'tiles', tool, lv, list: [], cost: 0, ok: true, reason: '' };
    const upper = tool !== 'floor' && this.lvNow() > 0;
    for (const [x, y] of tiles) {
      const e = { x, y, ok: true, skip: false };
      if (!tileInLot(x, y, lot)) { e.ok = false; plan.reason = 'За пределами участка'; }
      else if (upper) { e.ok = false; plan.reason = tool === 'pool' ? 'Бассейн копают на первом этаже' : 'Землю меняют на первом этаже'; }
      else if (!lv && w.isWater(x, y)) { e.ok = false; plan.reason = 'Это вода'; }
      else if (tool === 'floor' && lv > 0) {
        const cur = w.floorAt(x, y, lv);
        if (cur === bm.floor) e.skip = true;
        else if (!bm.floor) { const why = this.floorRemoveBlock(x, y, lv); if (why) { e.ok = false; plan.reason = why; } }
        else if (!cur && this.stairwellAt(x, y, lv)) { e.ok = false; plan.reason = 'Здесь проём лестницы'; }
        else if (!cur && !w.supported(x, y, lv)) { e.ok = false; plan.reason = 'Пол наверху держится только над комнатами нижнего этажа'; }
        else plan.cost += FLOORS[bm.floor].price;
      } else if (tool === 'floor') {
        const cur = w.floorAt(x, y);
        if (w.isPool(x, y)) { e.ok = false; plan.reason = 'Здесь бассейн'; }
        else if (cur === bm.floor) e.skip = true; else plan.cost += bm.floor ? FLOORS[bm.floor].price : 0;
      } else if (tool === 'pool') {
        const i = w.idx(x, y), t = w.terrain[i];
        if (t === TER.pool) e.skip = true;
        else if (w.floorAt(x, y) || w.indoor(x, y)) { e.ok = false; plan.reason = 'Бассейн копают во дворе'; }
        else if (w.layer.occ[i] || w.layer.rug[i] || w.layer.ground[i]) { e.ok = false; plan.reason = 'Мешает предмет'; }
        else if (t === TER.road || t === TER.walk || t === TER.bridge || t === TER.rock) { e.ok = false; plan.reason = 'Здесь копать нельзя'; }
        else if (this.game.sims && [...this.game.sims.values()].some(s => !s.hidden && !s.dead && Math.floor(s.x) === x && Math.floor(s.y) === y)) { e.ok = false; plan.reason = 'Здесь стоит сим'; }
        else plan.cost += BUILD_COSTS.pool;
      } else {
        const t = w.ter(x, y);
        if (w.floorAt(x, y) || t === TER.road || t === TER.walk || t === TER.bridge) e.skip = true;
        else if (t === TER[bm.terr]) e.skip = true;
        else plan.cost += TERRAIN[bm.terr].price;
      }
      plan.list.push(e);
    }
    if (upper || plan.list.every(e => !e.ok)) plan.ok = false;
    if (plan.cost > g.active().funds) { plan.ok = false; plan.reason = 'Не хватает денег'; }
    return plan;
  };

  G.applyTiles = function (plan, x, y) {
    if (!plan.ok) { if (this.audio) this.audio.ui('deny'); this.hint(plan.reason || 'Здесь нельзя'); return; }
    const w = this.game.world, bm = this.bm;
    let n = 0;
    for (const e of plan.list) {
      if (!e.ok || e.skip) continue;
      if (plan.tool === 'floor') w.setFloor(e.x, e.y, bm.floor, plan.lv);
      else { w.terrain[w.idx(e.x, e.y)] = plan.tool === 'pool' ? TER.pool : TER[bm.terr]; w.version++; }
      n++;
    }
    if (!n) return;
    if (plan.tool !== 'floor') { this.r.resetWater(); this.validateLadders(x, y); }
    this.spend(plan.cost, x, y);
    if (plan.lv > 0) this.refreshElevators();
    this.afterBuild(false);
    if (this.audio) this.audio.ui(plan.tool === 'floor' ? 'floor' : plan.tool === 'pool' ? 'demolish' : 'terrain');
    if (plan.tool === 'pool' && !this.game.world.objectsInLot(bm.lot, o => OBJECTS[o.t].poolEdge).length) this.hint('Поставьте лестницу для бассейна: без неё симы не залезут в воду.');
  };

  G.buildGeo = function (tr) {
    const bm = this.bm;
    if (!bm || (this.sub !== 'buy' && this.sub !== 'build')) return;
    const g = this.game, lot = g.lots[bm.lot];
    if (!lot) return;
    const lv = this.lvNow(), bz = lv * WALL_H;
    if (bm.sub === 'build' || bm.placing) this.gridGeo(tr, lot, bz + (lv ? 0.085 : 0.055));
    const h = bm.hover;
    if (!h) return;
    const r = this.r;
    if (h.kind === 'place') this.ghostGeo(tr, bm.placing, h, h.ok ? OK : BAD);
    else if (h.kind === 'bplace') this.buildGhost(tr, h);
    else if (h.kind === 'obj' || h.kind === 'hammerObj') {
      const ob = h.ob, d = OBJECTS[ob.t], oz = (ob.lv || 0) * WALL_H, col = h.kind === 'hammerObj' ? BAD : SEL;
      if (ob.layer === 'wall' || ob.layer === 'surf' || ob.layer === 'ceil') { const z = oz + (ob.layer === 'ceil' ? 2.4 : ob.layer === 'surf' ? 0.8 : 0.9); tr.box(ob.x + 0.15, ob.y + 0.15, z, ob.x + 0.85, ob.y + 0.85, z + 0.05, col, { e: 0.45 }); }
      else { const f = footprint(d, ob.r), z0 = h.kind === 'hammerObj' && lv > (ob.lv || 0) ? bz : oz; tr.box(ob.x + 0.04, ob.y + 0.04, z0 + 0.02, ob.x + f[0] - 0.04, ob.y + f[1] - 0.04, z0 + 0.08, col, { e: 0.45 }); }
    } else if (h.kind === 'edges') {
      for (const e of h.list) {
        if (e.skip) continue;
        const col = !e.ok || !h.ok || h.tool === 'hammer' ? BAD : OK;
        this.edgeBox(tr, e.o, e.x, e.y, bz, bz + (h.tool === 'fence' ? 1 : WALL_H + 0.04), 0.09, col, 0.42);
      }
      for (const [fx, fy] of h.floors || []) this.tileMark(tr, fx, fy, lv, h.ok ? OK : BAD, 0.03);
      this.postGeo(tr, h.end, h.ok ? OK : BAD, bz);
    } else if (h.kind === 'corner') this.postGeo(tr, h.c, OK, bz);
    else if (h.kind === 'hammer') { const wl = h.wl, wz = (wl.lv || 0) * WALL_H; if (wl.door || wl.win) this.openingGeo(tr, wl, wl.door ? 'door' : 'window', BAD); else this.edgeBox(tr, wl.o, wl.x, wl.y, wz, wz + r.wallHeight(wl, bm.lot) + 0.04, 0.09, BAD, 0.42); }
    else if (h.kind === 'door' || h.kind === 'window') this.openingGeo(tr, h.wl, h.kind, h.ok ? OK : BAD);
    else if (h.kind === 'paint') {
      for (const [wl, f] of h.faces) {
        const H = r.wallHeight(wl, bm.lot), wz = (wl.lv || 0) * WALL_H;
        const s = f === 'a' ? -0.078 : 0.078;
        const P = (u, z) => wl.o === 'h' ? [wl.x + u, wl.y + s, wz + z] : [wl.x + s, wl.y + u, wz + z];
        tr.quad(P(0, 0.02), P(1, 0.02), P(1, H), P(0, H), h.ok ? [1, 1, 0.75] : BAD, { e: 0.38 });
      }
    } else if (h.kind === 'tiles') {
      const tl = h.lv || 0;
      for (const e of h.list) {
        if (e.skip && e.ok) continue;
        const z = tl ? tl * WALL_H + 0.09 : Math.max(0, r.tileZ(e.x, e.y)) + 0.05;
        tr.quad([e.x + 0.03, e.y + 0.03, z], [e.x + 0.97, e.y + 0.03, z], [e.x + 0.97, e.y + 0.97, z], [e.x + 0.03, e.y + 0.97, z], e.ok && h.ok ? OK : BAD, { e: 0.35, n: [0, 0, 1] });
      }
    } else if (h.kind === 'roofrect' || h.kind === 'roofdel') this.roofGeo(tr, h);
  };

  G.tileMark = function (tr, x, y, lv, col, inset) {
    const z = lv * WALL_H + (lv ? 0.1 : 0.07), m = inset === undefined ? 0.12 : inset;
    tr.quad([x + m, y + m, z], [x + 1 - m, y + m, z], [x + 1 - m, y + 1 - m, z], [x + m, y + 1 - m, z], col, { e: 0.5, n: [0, 0, 1] });
  };

  G.buildGhost = function (tr, h) {
    const d = OBJECTS[h.type], w = this.game.world, col = h.ok ? OK : BAD;
    this.ghostGeo(tr, { type: h.type, col: (this.bm.colors[h.type] || d.col).slice(), st: h.st || {} }, h, col);
    if (d.stairs) {
      const s = w.stairInfo({ t: h.type, x: h.x, y: h.y, r: h.r, lv: h.lv });
      this.tileMark(tr, s.entry[0], s.entry[1], s.entry[2], col);
      this.tileMark(tr, s.exit[0], s.exit[1], s.exit[2], col);
    } else if (d.elevator) this.tileMark(tr, h.x + DX[h.r], h.y + DY[h.r], h.lv, col);
    else if (d.poolEdge) this.tileMark(tr, h.x - DX[h.r], h.y - DY[h.r], 0, col);
  };

  G.roofGeo = function (tr, h) {
    const p = h.kind === 'roofdel' ? h.piece : h;
    const col = h.kind === 'roofdel' || !h.ok ? BAD : OK;
    const lv = p.lv || 0, z0 = lv * WALL_H + (lv ? 0.09 : 0.06), zt = (lv + 1) * WALL_H;
    const x0 = p.x, y0 = p.y, x1 = p.x + p.w, y1 = p.y + p.h, t = 0.05;
    tr.quad([x0 + 0.03, y0 + 0.03, z0], [x1 - 0.03, y0 + 0.03, z0], [x1 - 0.03, y1 - 0.03, z0], [x0 + 0.03, y1 - 0.03, z0], col, { e: 0.3, n: [0, 0, 1] });
    for (const [cx, cy] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) tr.box(cx - t, cy - t, z0, cx + t, cy + t, zt, col, { e: 0.5 });
    tr.box(x0 - t, y0 - t, zt, x1 + t, y0 + t, zt + 0.08, col, { e: 0.5 });
    tr.box(x0 - t, y1 - t, zt, x1 + t, y1 + t, zt + 0.08, col, { e: 0.5 });
    tr.box(x0 - t, y0 - t, zt, x0 + t, y1 + t, zt + 0.08, col, { e: 0.5 });
    tr.box(x1 - t, y0 - t, zt, x1 + t, y1 + t, zt + 0.08, col, { e: 0.5 });
  };

  G.gridGeo = function (tr, lot, z) {
    const t = 0.012, c = [1, 1, 1];
    for (let x = lot.x; x <= lot.x + lot.w; x++) tr.quad([x - t, lot.y, z], [x + t, lot.y, z], [x + t, lot.y + lot.h, z], [x - t, lot.y + lot.h, z], c, { e: 0.22, n: [0, 0, 1] });
    for (let y = lot.y; y <= lot.y + lot.h; y++) tr.quad([lot.x, y - t, z], [lot.x + lot.w, y - t, z], [lot.x + lot.w, y + t, z], [lot.x, y + t, z], c, { e: 0.22, n: [0, 0, 1] });
  };

  G.edgeBox = function (tr, o, x, y, z0, z1, th, col, a) {
    if (o === 'h') tr.box(x, y - th, z0, x + 1, y + th, z1, col, { e: a });
    else tr.box(x - th, y, z0, x + th, y + 1, z1, col, { e: a });
  };

  G.postGeo = function (tr, c, col, z) {
    if (!c) return;
    const z0 = z || 0;
    tr.box(c[0] - 0.09, c[1] - 0.09, z0, c[0] + 0.09, c[1] + 0.09, z0 + 0.9, col, { e: 0.6 });
  };

  G.openingGeo = function (tr, wl, kind, col) {
    const wz = (wl.lv || 0) * WALL_H;
    const z0 = wz + (kind === 'door' ? 0.02 : 0.95), z1 = wz + (kind === 'door' ? 2.2 : 2.25);
    const th = 0.1;
    if (wl.o === 'h') tr.box(wl.x + 0.1, wl.y - th, z0, wl.x + 0.9, wl.y + th, z1, col, { e: 0.5 });
    else tr.box(wl.x - th, wl.y + 0.1, z0, wl.x + th, wl.y + 0.9, z1, col, { e: 0.5 });
  };

  G.ghostGeo = function (tr, p, h, tint) {
    const d = OBJECTS[p.type];
    const lay = layerOf(d);
    const lv = h.lv !== undefined ? h.lv : this.lvNow();
    const fake = { id: -7, t: p.type, x: h.x, y: h.y, r: h.r, lv, col: p.col, st: p.st || {}, layer: lay, upg: {}, use: {}, art: p.art || 0 };
    const geo = new Geo(this.r.atlas);
    try { this.r.placeGeo(geo, fake, { lampOn: false, night: false }); } catch (e) { return; }
    const dd = geo.data;
    for (let i = 0; i < dd.length; i += GEO_STRIDE) {
      dd[i + 6] = Math.min(1, dd[i + 6] * 0.7 + tint[0] * 0.35);
      dd[i + 7] = Math.min(1, dd[i + 7] * 0.7 + tint[1] * 0.35);
      dd[i + 8] = Math.min(1, dd[i + 8] * 0.7 + tint[2] * 0.35);
      dd[i + 9] = 0.8;
    }
    tr.append(geo);
    if (lay === 'occ' || lay === 'rug' || lay === 'ground') {
      const f = footprint(d, h.r);
      const bz = lv * WALL_H, z = bz + (lv ? 0.09 : 0.06);
      tr.quad([h.x + 0.03, h.y + 0.03, z], [h.x + f[0] - 0.03, h.y + 0.03, z], [h.x + f[0] - 0.03, h.y + f[1] - 0.03, z], [h.x + 0.03, h.y + f[1] - 0.03, z], tint, { e: 0.45, n: [0, 0, 1] });
      if (!d.build) {
        const fx = h.x + f[0] / 2 + S.DX[h.r] * (f[0] / 2 + 0.25), fy = h.y + f[1] / 2 + S.DY[h.r] * (f[1] / 2 + 0.25);
        tr.box(fx - 0.08, fy - 0.08, z - 0.02, fx + 0.08, fy + 0.08, z + 0.04, tint, { e: 0.7 });
      }
    }
  };

  G.drawExtra = function (g) {
    const bm = this.bm;
    if (!bm || (this.sub !== 'buy' && this.sub !== 'build')) return;
    const now = performance.now();
    bm.floats = bm.floats.filter(f => now - f.t < 1500);
    g.font = 'bold 15px Tahoma, Verdana, sans-serif';
    for (const f of bm.floats) {
      const k = (now - f.t) / 1500;
      g.globalAlpha = Math.min(1, (1 - k) * 2);
      const y = f.y - 18 - k * 44;
      g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(f.text, f.x - 10, y);
      g.fillStyle = f.good ? '#7cff6a' : '#ff8a7a'; g.fillText(f.text, f.x - 10, y);
    }
    g.globalAlpha = 1;
    const h = bm.hover;
    if (!h || bm.mx === undefined || this.mouse.drag && this.mouse.btn !== 0) return;
    let label = null, bad = false;
    if (h.ok === false && h.reason) { label = h.reason; bad = true; }
    else if (h.cost) label = (h.cost > 0 ? '−' : '+') + S.fmtMoney(Math.abs(h.cost));
    if (!label) return;
    g.font = 'bold 11px Tahoma, Verdana, sans-serif';
    const wd = g.measureText(label).width + 14;
    const x = Math.round(bm.mx + 18), y = Math.round(bm.my + 14);
    g.fillStyle = bad ? 'rgba(255,236,232,.96)' : 'rgba(236,250,232,.96)';
    g.strokeStyle = bad ? '#b0302a' : '#2a7a2a';
    g.lineWidth = 1.5;
    g.beginPath();
    if (g.roundRect) g.roundRect(x, y, wd, 19, 9); else g.rect(x, y, wd, 19);
    g.fill(); g.stroke();
    g.fillStyle = bad ? '#8a1a14' : '#1e5a1e';
    g.fillText(label, x + 7, y + 13);
  };

  Object.assign(S, { BUILD_TOOLS, ROOF_COLORS, ROOF_STYLES, lotValue });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
