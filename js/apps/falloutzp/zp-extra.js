(function (Z) {
  'use strict';

  const U = Z.UI.prototype;
  const G = Z.Game.prototype;
  const esc = s => Z.esc(s);

  const baseAttach = U.onAttach;
  U.onAttach = function (g) {
    g.ui = this;
    baseAttach.call(this, g);
    g.ev.on('quest', ev => { if (ev.id === 'sq_mayak' && ev.stage === 30 && this.audio) this.audio.setStation('mayak'); });
    g.ev.on('cell', () => { if (!g.player.dead && this.autoSave) setTimeout(() => this.autoSave(), 50); });
  };

  const baseKeys = U.onPlayKeys;
  U.onPlayKeys = function (inp, dt) {
    if (this.pressed.has('KeyL') && this.game && this.mode === 'play') {
      const p = this.game.player;
      p.lightOn = !p.lightOn;
      if (this.audio) this.audio.uiSound('click');
      this.game.msg(p.lightOn ? 'Подсветка «Пионера» включена. Подсолнухи это заметят.' : 'Подсветка «Пионера» выключена.', 'info');
    }
    return baseKeys.call(this, inp, dt);
  };

  const baseRoute = U.routeActivation;
  U.routeActivation = function (r) {
    if (r && r.ui === 'dlg') { this.startDialogue(r.actor || null, r.tree); return; }
    return baseRoute.call(this, r);
  };

  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['6', '7', '8', '9', '10', 'В', 'Д', 'К', 'Т'];
  const cardVal = r => r === 'Т' ? 11 : ['В', 'Д', 'К'].includes(r) ? 10 : +r;
  const handVal = h => { let v = 0, aces = 0; for (const c of h) { v += cardVal(c.r); if (c.r === 'Т') aces++; } while (v > 21 && aces) { v -= 10; aces--; } return v; };

  U.openOchko = function () {
    const g = this.game, p = g.player;
    const R = Z.rng(Math.floor(g.time * 13) + p.count('talon'));
    let deck = [], bet = Math.min(20, p.count('talon')), me = [], dealer = [], phase = 'bet', note = 'Делайте ставку.';
    const shuffle = () => { deck = []; for (const s of SUITS) for (const r of RANKS) deck.push({ r, s }); for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } };
    const draw = () => { if (!deck.length) shuffle(); return deck.pop(); };
    const el = document.createElement('div');
    el.className = 'zp-panel';
    el.innerHTML = '<div class="zp-ochko"><div class="felt"><div class="hd">«ОЧКО» · ИГРОВОЙ ЗАЛ ГОСТИНИЦЫ «ИНТУРИСТ»</div><div class="side dealer"><span class="lbl">Банк</span><div class="cards"></div><span class="sum"></span></div><div class="mid"><span class="note"></span></div><div class="side me"><span class="lbl">Вы</span><div class="cards"></div><span class="sum"></span></div><div class="bar"><span class="bank"></span><span class="btns"></span></div></div></div>';
    el.addEventListener('mousedown', e => e.stopPropagation());
    const panel = { el };
    const cardHtml = (c, hidden) => hidden ? '<span class="card back"></span>' : '<span class="card' + (c.s === '♥' || c.s === '♦' ? ' red' : '') + '"><b>' + esc(c.r) + '</b><i>' + c.s + '</i></span>';
    const render = () => {
      const d = el.querySelector('.dealer'), m = el.querySelector('.me');
      d.querySelector('.cards').innerHTML = dealer.map((c, i) => cardHtml(c, phase === 'play' && i === 1)).join('');
      d.querySelector('.sum').textContent = dealer.length ? (phase === 'play' ? '?' : handVal(dealer)) : '';
      m.querySelector('.cards').innerHTML = me.map(c => cardHtml(c)).join('');
      m.querySelector('.sum').textContent = me.length ? handVal(me) : '';
      el.querySelector('.note').textContent = note;
      el.querySelector('.bank').textContent = 'Талоны: ' + p.count('talon') + ' · Ставка: ' + bet;
      const b = phase === 'play' ? [['hit', 'Ещё (E)'], ['stand', 'Хватит (R)']] : [['minus', '− (A)'], ['plus', '+ (D)'], ['deal', 'Раздать (E)'], ['quit', 'Встать (Esc)']];
      el.querySelector('.btns').innerHTML = b.map(([k, t]) => '<span class="cb" data-k="' + k + '">' + t + '</span>').join('');
      el.querySelectorAll('.cb').forEach(x => x.addEventListener('click', () => act(x.dataset.k)));
    };
    const settle = () => {
      while (handVal(dealer) < 17) dealer.push(draw());
      const a = handVal(me), b = handVal(dealer);
      let win = 0;
      if (a > 21) { note = 'Перебор. Банк забирает ставку.'; win = -bet; }
      else if (b > 21 || a > b) { note = a === 21 && me.length === 2 ? 'Очко! Банк платит полторы ставки.' : 'Ваша взяла.'; win = a === 21 && me.length === 2 ? Math.round(bet * 1.5) : bet; }
      else if (a === b) note = 'Ничья. Ставка остаётся при вас.';
      else { note = 'Банк выиграл.'; win = -bet; }
      if (win > 0) p.give('talon', win); else if (win < 0) p.take('talon', -win);
      g.flags.ochkoNet = (g.flags.ochkoNet || 0) + win;
      if (g.flags.ochkoNet > 600 && !g.flags.ochkoBanned) { g.flags.ochkoBanned = true; note += ' Крупье Лёня косится: «Вам на сегодня хватит».'; }
      if (this.audio) this.audio.uiSound(win > 0 ? 'level' : 'click');
      phase = 'bet';
      bet = Math.min(bet, p.count('talon'));
      render();
    };
    const act = k => {
      if (phase === 'bet') {
        if (k === 'plus') bet = Math.min(p.count('talon'), bet + 10, 200);
        else if (k === 'minus') bet = Math.max(10, bet - 10);
        else if (k === 'quit') { this.closePanel(panel); return; }
        else if (k === 'deal') {
          if (g.flags.ochkoBanned) { note = 'Крупье разводит руками: «Заведение закрыто для вас до утра».'; render(); return; }
          if (p.count('talon') < 10 || bet < 10) { note = 'Минимальная ставка — десять талонов.'; render(); return; }
          me = [draw(), draw()]; dealer = [draw(), draw()]; phase = 'play'; note = 'Ещё карту или хватит?';
          if (handVal(me) === 21) { phase = 'done'; settle(); return; }
        }
      } else if (phase === 'play') {
        if (k === 'hit') { me.push(draw()); if (handVal(me) >= 21) { settle(); return; } }
        else if (k === 'stand') { settle(); return; }
      }
      render();
    };
    panel.key = e => {
      const map = { KeyE: phase === 'play' ? 'hit' : 'deal', KeyR: 'stand', KeyA: 'minus', KeyD: 'plus', Escape: phase === 'play' ? null : 'quit', Enter: phase === 'play' ? 'hit' : 'deal' };
      const k = map[e.code];
      if (k) { act(k); return true; }
      return e.code === 'Escape';
    };
    shuffle();
    this.openPanel(panel);
    render();
  };

  U.openEnding = function (slides) {
    let i = 0;
    const el = document.createElement('div');
    el.className = 'zp-panel zp-ending';
    el.innerHTML = '<div class="reel"><div class="frame"><div class="no"></div><div class="tt"></div><div class="tx"></div></div><div class="hint">Enter / щелчок — дальше</div></div>';
    const panel = { el, escClose: false };
    const show = () => {
      const s = slides[i];
      el.querySelector('.no').textContent = 'КИНОЖУРНАЛ «НОВОСТИ ДНЯ» · ' + (i + 1) + ' / ' + slides.length;
      el.querySelector('.tt').textContent = s.t;
      const tx = el.querySelector('.tx');
      tx.textContent = '';
      let k = 0;
      clearInterval(this.endTyper);
      this.endTyper = setInterval(() => { k += 3; tx.textContent = s.x.slice(0, k); if (k >= s.x.length) clearInterval(this.endTyper); }, 18);
      if (this.speak && this.settings.tts) this.speak(s.t + '. ' + s.x, null);
    };
    const next = () => {
      i++;
      if (i >= slides.length) {
        clearInterval(this.endTyper);
        this.closePanel(panel);
        this.message('Конец первой главы', 'Мост Преображенского — за вами. Плотина ДнепроГЭС ждёт следующей главы.\n\nМожно продолжать странствия по Вознесеновскому району и Хортице.', [{ label: 'Продолжить', fn: () => {} }]);
        return;
      }
      show();
    };
    el.addEventListener('mousedown', e => { e.stopPropagation(); next(); });
    panel.key = e => { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { next(); return true; } return true; };
    this.openPanel(panel);
    show();
  };

  const DBG_TABS = [['player', 'Игрок'], ['map', 'Карта'], ['time', 'Время'], ['story', 'Сюжет']];
  const TIME_PRESETS = [['Рассвет', 5 * 60 + 30], ['Утро', 8 * 60], ['Полдень', 12 * 60], ['Закат', 19 * 60], ['Сумерки', 20 * 60 + 30], ['Полночь', 0]];

  U.openDebug = function () {
    const g = this.game;
    if (!g) return;
    const p = g.player;
    const st = this.dbgState = this.dbgState || { tab: 'player', sel: 0, zoom: 1.2, pan: null };
    const el = this.panelEl('zp-dbg', '<div class="dbg-head"><h2>F7 · ОТЛАДКА</h2><div class="dbg-tabs"></div></div><div class="dbg-body"></div><div class="dbg-foot dim"></div>');
    const panel = { el };
    const body = el.querySelector('.dbg-body');
    const foot = el.querySelector('.dbg-foot');
    const beep = () => { if (this.audio) this.audio.uiSound('click'); };
    let rows = [];
    const mark = () => body.querySelectorAll('.act').forEach((b, i) => b.classList.toggle('sel', i === st.sel));
    const bindActs = () => {
      rows = [...body.querySelectorAll('.act')];
      st.sel = Z.clamp(st.sel, 0, Math.max(0, rows.length - 1));
      rows.forEach((b, i) => {
        b.addEventListener('mouseenter', () => { st.sel = i; mark(); });
        b.addEventListener('click', () => { st.sel = i; run(b); });
      });
      mark();
    };
    const run = b => { const f = acts[b.dataset.a]; if (!f) return; beep(); f(b); render(); };
    const acts = {};
    const btn = (id, label, fn, cls) => { acts[id] = fn; return '<span class="btn act' + (cls ? ' ' + cls : '') + '" data-a="' + id + '">' + esc(label) + '</span>'; };
    const line = (label, value, controls) => '<div class="dbg-line"><span class="lb">' + esc(label) + '</span><span class="vl">' + value + '</span><span class="ct">' + controls + '</span></div>';

    const tabPlayer = () => {
      const s = p.sheet, next = Z.xpFor(s.level + 1), prev = Z.xpFor(s.level);
      const frac = Z.clamp((s.xp - prev) / Math.max(1, next - prev), 0, 1);
      const money = n => () => { if (n > 0) p.give('talon', n); else p.take('talon', Math.min(p.count('talon'), -n)); };
      body.innerHTML = '<div class="dbg-sec"><h3>Талоны</h3>' +
        line('На руках', '<b class="big">' + p.count('talon') + '</b>', btn('m100', '+100', money(100)) + btn('m1k', '+1 000', money(1000)) + btn('m10k', '+10 000', money(10000)) + btn('mz', 'Обнулить', money(-1e9))) +
        '<div class="dbg-line"><span class="lb">Своя сумма</span><span class="vl"><input class="num-in" data-k="money" type="number" min="1" max="999999" value="' + (st.money || 500) + '"></span><span class="ct">' + btn('mgive', 'Выдать', () => { const n = Math.round(+el.querySelector('[data-k=money]').value || 0); st.money = n; if (n > 0) p.give('talon', n); }) + btn('mtake', 'Забрать', () => { const n = Math.round(+el.querySelector('[data-k=money]').value || 0); st.money = n; if (n > 0) p.take('talon', Math.min(n, p.count('talon'))); }) + '</span></div></div>' +
        '<div class="dbg-sec"><h3>Опыт</h3>' +
        line('Уровень ' + s.level, s.xp + ' / ' + next + '<div class="meter"><i style="width:' + Math.round(frac * 100) + '%"></i></div>', btn('x100', '+100', () => g.debugXP(100)) + btn('x1k', '+1 000', () => g.debugXP(1000)) + btn('xlv', '+1 уровень', () => g.debugXP(Z.xpFor(s.level + 1) - s.xp)) + btn('xlv5', '+5 уровней', () => g.debugXP(Z.xpFor(Math.min(Z.LEVEL_CAP, s.level + 5)) - s.xp))) +
        line('Нераспределено', 'навыки ' + (s.pendingSkill || 0) + ', перки ' + (s.pendingPerk || 0), (s.pendingSkill || s.pendingPerk) ? btn('lvlup', 'Распределить', () => { this.closePanel(panel); if (this.openLevelUp) this.openLevelUp(); }) : '') + '</div>' +
        '<div class="dbg-sec"><h3>Состояние</h3>' +
        line('Здоровье', Math.ceil(p.hp) + ' / ' + p.hpMax + ', рад ' + Math.round(p.rads), btn('heal', 'Вылечить всё', () => { p.hp = p.hpMax; p.healLimbs(true); p.rads = 0; g.applyRadSickness(p); })) +
        line('Бессмертие', g.godMode ? '<span class="grn">включено</span>' : 'выключено', btn('god', g.godMode ? 'Выключить' : 'Включить', () => { g.godMode = !g.godMode; })) +
        line('Снаряжение', 'АКМ, ТТ «Фирма», шашка, гранаты, бронежилет', btn('kit', 'Выдать набор', () => { for (const [id, n] of [['akm', 1], ['a762k', 240], ['ttFirma', 1], ['a762t', 120], ['sabre', 1], ['f1', 4], ['stim', 10], ['b190', 4], ['bronik', 1], ['lockpick', 10]]) p.give(id, n); })) + '</div>';
      foot.textContent = '↑↓ — выбор, Enter — выполнить, ←→ — вкладки, Esc — закрыть';
      bindActs();
      const inp = el.querySelector('[data-k=money]');
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { run(el.querySelector('[data-a=mgive]')); } });
      inp.addEventListener('mousedown', e => e.stopPropagation());
    };

    const tabMap = () => {
      body.innerHTML = '<div class="dbg-map"><canvas></canvas><div class="dbg-coords dim"></div></div><div class="dbg-locs scroll"></div>';
      const cv = body.querySelector('canvas'), coords = body.querySelector('.dbg-coords');
      const map = this.map, img = Z.mapImage(map);
      const here = () => g.cell.exterior ? [p.x, p.z] : (g.lastExt ? [g.lastExt[0], g.lastExt[1]] : [p.x, p.z]);
      if (!st.pan) st.pan = here();
      const locs = g.locations.slice().sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      const listEl = body.querySelector('.dbg-locs');
      listEl.innerHTML = locs.map((l, i) => '<div class="row act" data-a="loc' + i + '"><span class="nm' + (l.found || g.flags['found_' + l.id] ? '' : ' dim') + '">' + esc(l.name) + '</span></div>').join('');
      locs.forEach((l, i) => { acts['loc' + i] = () => { const t = l.arrive || [l.x, l.z]; g.debugTeleport(t[0], t[1]); st.pan = [t[0], t[1]]; this.closePanel(panel); }; });
      let hover = null, drag = null;
      const scale = () => st.zoom / img.mpp;
      const toS = (x, z, W, H) => [W / 2 + (x - st.pan[0]) * scale(), H / 2 + (z - st.pan[1]) * scale()];
      const toW = (sx, sy, W, H) => [st.pan[0] + (sx - W / 2) / scale(), st.pan[1] + (sy - H / 2) / scale()];
      const draw = () => {
        const r = cv.getBoundingClientRect();
        cv.width = Math.max(10, Math.round(r.width)); cv.height = Math.max(10, Math.round(r.height));
        const c = cv.getContext('2d'), W = cv.width, H = cv.height;
        c.fillStyle = '#0d0702'; c.fillRect(0, 0, W, H);
        const [ox, oz] = toS(map.x0, map.z0, W, H);
        c.drawImage(img.cv, ox, oz, img.W * img.mpp * scale(), img.H * img.mpp * scale());
        c.font = "bold 11px 'Courier New', monospace";
        for (const l of locs) {
          const [sx, sy] = toS(l.x, l.z, W, H);
          if (sx < -40 || sy < -20 || sx > W + 40 || sy > H + 20) continue;
          c.fillStyle = '#ffb642';
          c.fillRect(sx - 3, sy - 3, 6, 6);
          if (st.zoom > 1.4) { c.fillStyle = 'rgba(255,182,66,0.8)'; c.fillText(l.name, sx + 6, sy + 4); }
        }
        const [px, pz] = here(), [ax, ay] = toS(px, pz, W, H);
        c.save(); c.translate(ax, ay); c.rotate(p.yaw); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -9); c.lineTo(6, 7); c.lineTo(0, 3); c.lineTo(-6, 7); c.closePath(); c.fill(); c.restore();
        if (hover) {
          const [hx, hy] = toS(hover[0], hover[1], W, H);
          c.strokeStyle = '#ffffff'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(hx - 10, hy); c.lineTo(hx + 10, hy); c.moveTo(hx, hy - 10); c.lineTo(hx, hy + 10); c.stroke();
        }
      };
      const nearest = (x, z) => { let best = null, bd = 1e9; for (const l of locs) { const d = Math.hypot(l.x - x, l.z - z); if (d < bd) { bd = d; best = l; } } return best ? [best, bd] : null; };
      const showCoords = () => {
        if (!hover) { coords.textContent = 'Щелчок по карте — переместиться туда. Колесо — масштаб, перетаскивание — сдвиг.'; return; }
        const n = nearest(hover[0], hover[1]);
        coords.textContent = 'x ' + Math.round(hover[0]) + ', z ' + Math.round(hover[1]) + (n ? ' · ' + n[0].name + ' — ' + Math.round(n[1]) + ' м' : '');
      };
      cv.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); st.zoom = Z.clamp(st.zoom * (e.deltaY > 0 ? 0.85 : 1.18), 0.3, 8); draw(); });
      cv.addEventListener('mousedown', e => { e.stopPropagation(); drag = { x: e.clientX, y: e.clientY, pan: st.pan.slice(), moved: false }; });
      cv.addEventListener('mousemove', e => {
        const r = cv.getBoundingClientRect();
        if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 3) drag.moved = true; st.pan = [drag.pan[0] - dx / scale(), drag.pan[1] - dy / scale()]; }
        hover = toW((e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height, cv.width, cv.height);
        draw(); showCoords();
      });
      cv.addEventListener('mouseleave', () => { hover = null; drag = null; draw(); showCoords(); });
      cv.addEventListener('mouseup', e => {
        const moved = drag && drag.moved;
        drag = null;
        if (moved) return;
        const r = cv.getBoundingClientRect();
        const w = toW((e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height, cv.width, cv.height);
        if (w[0] < map.x0 || w[0] > map.x1 || w[1] < map.z0 || w[1] > map.z1) return;
        beep();
        g.debugTeleport(w[0], w[1]);
        st.pan = w;
        this.closePanel(panel);
      });
      requestAnimationFrame(() => { draw(); showCoords(); });
      foot.textContent = 'Щелчок по карте или по названию — телепорт. ↑↓ Enter — по списку, ←→ — вкладки';
      bindActs();
    };

    const tabTime = () => {
      const mod = ((g.time % 1440) + 1440) % 1440;
      const wx = g.wxTarget || Z.WEATHER[0];
      body.innerHTML = '<div class="dbg-sec dbg-clock"><div class="clock">' + Z.fmtTime(g.time) + '</div><div class="dim">' + Z.dateStr(g.time) + ', день ' + (Math.floor(g.time / 1440) + 1) + '</div>' +
        '<input class="hour" type="range" min="0" max="1439" step="15" value="' + Math.round(mod) + '"><div class="ticks"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div></div>' +
        '<div class="dbg-sec"><h3>Время суток</h3><div class="dbg-grid">' + TIME_PRESETS.map(([n, m], i) => btn('tp' + i, n + ' ' + Z.fmtTime(m), () => g.debugSetClock(m))).join('') + '</div>' +
        '<div class="dbg-grid">' + btn('h1', '+1 час', () => g.debugAdvance(60)) + btn('h6', '+6 часов', () => g.debugAdvance(360)) + btn('d1', 'Следующий день', () => g.debugAdvance(1440)) + '</div></div>' +
        '<div class="dbg-sec"><h3>Погода · сейчас: ' + esc(wx.name) + '</h3><div class="dbg-grid">' + Z.WEATHER.map((w, i) => btn('w' + i, w.name, () => { g.wxTarget = w; g.wx = Object.assign({}, w); g.wxNext = g.time + 360; }, w === wx ? 'on' : '')).join('') + btn('wr', 'Случайная', () => g.nextWeather()) + '</div></div>';
      const sl = body.querySelector('.hour'), clock = body.querySelector('.clock');
      sl.addEventListener('mousedown', e => e.stopPropagation());
      sl.addEventListener('keydown', e => e.stopPropagation());
      sl.addEventListener('input', () => { g.debugSetClock(+sl.value); clock.textContent = Z.fmtTime(g.time); });
      foot.textContent = 'Ползунок — час внутри текущих суток. Кнопки «+» двигают время вперёд';
      bindActs();
    };

    const tabStory = () => {
      body.innerHTML = '<div class="dbg-sec"><h3>Сюжет</h3>' +
        line('Карта', 'все места отмечены', btn('allmap', 'Открыть все места', () => { for (const l of g.locations) g.discover(l.id, true); })) +
        line('«Адресат»', 'перфокарта и квесты 1–4 закрыты', btn('card', 'Выполнить', () => { if (!p.has('perfokarta')) p.give('perfokarta', 1); for (const q of ['mq01', 'mq02', 'mq03']) if (!(g.quests[q] && g.quests[q].done)) g.setStage(q, { mq01: 50, mq02: 40, mq03: 60 }[q], { force: true }); g.setStage('mq04', 50, { force: true }); })) +
        line('«Битва за мост»', 'маршрут Комендатуры', btn('bridge', 'Начать', () => { g.flags.route = 'k'; g.setStage('mq07', 10, { force: true }); })) + '</div>';
      foot.textContent = '↑↓ — выбор, Enter — выполнить, ←→ — вкладки, Esc — закрыть';
      bindActs();
    };

    const render = () => {
      el.querySelector('.dbg-tabs').innerHTML = DBG_TABS.map(([id, n]) => '<span data-t="' + id + '" class="' + (id === st.tab ? 'on' : '') + '">' + n + '</span>').join('');
      el.querySelectorAll('.dbg-tabs span').forEach(s => s.addEventListener('click', () => { st.tab = s.dataset.t; st.sel = 0; beep(); render(); }));
      for (const k in acts) delete acts[k];
      ({ player: tabPlayer, map: tabMap, time: tabTime, story: tabStory })[st.tab]();
    };
    panel.key = e => {
      const i = DBG_TABS.findIndex(t => t[0] === st.tab);
      if (e.code === 'ArrowLeft' || e.code === 'KeyQ') { st.tab = DBG_TABS[(i + DBG_TABS.length - 1) % DBG_TABS.length][0]; st.sel = 0; render(); return true; }
      if (e.code === 'ArrowRight') { st.tab = DBG_TABS[(i + 1) % DBG_TABS.length][0]; st.sel = 0; render(); return true; }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { st.sel = Math.max(0, st.sel - 1); mark(); return true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { st.sel = Math.min(rows.length - 1, st.sel + 1); mark(); return true; }
      if (e.code === 'Enter' || e.code === 'Space') { if (rows[st.sel]) run(rows[st.sel]); return true; }
      if (e.code === 'F7') { this.closePanel(panel); return true; }
      return false;
    };
    this.openPanel(panel);
    render();
  };

  const WEATHER = [
    { id: 'clear', name: 'Ясно', cloud: 0.15, dark: 0, fog: 0.02, haze: 0.1, wind: 0.3 },
    { id: 'cloudy', name: 'Облачно', cloud: 0.55, dark: 0.05, fog: 0.04, haze: 0.15, wind: 0.5 },
    { id: 'overcast', name: 'Пасмурно', cloud: 0.85, dark: 0.2, fog: 0.08, haze: 0.2, wind: 0.7 },
    { id: 'fog', name: 'Туман над Днепром', cloud: 0.5, dark: 0.1, fog: 0.55, haze: 0.3, wind: 0.1 },
    { id: 'dust', name: 'Пыльная буря с ЗАлКа', cloud: 0.7, dark: 0.3, fog: 0.3, haze: 0.9, wind: 1.4 }
  ];
  Z.WEATHER = WEATHER;

  G.nextWeather = function () {
    const R = this.rng;
    const r = R();
    this.wxTarget = r < 0.4 ? WEATHER[0] : r < 0.65 ? WEATHER[1] : r < 0.82 ? WEATHER[2] : r < 0.94 ? WEATHER[3] : WEATHER[4];
    this.wxNext = this.time + 180 + R() * 360;
  };

  G.stepWeather = function (dt) {
    if (!this.wx) this.wx = Object.assign({}, WEATHER[0]);
    if (!this.wxNext || this.time > this.wxNext) this.nextWeather();
    const t = this.wxTarget;
    const k = Math.min(1, dt * 0.05);
    for (const f of ['cloud', 'dark', 'fog', 'haze', 'wind']) this.wx[f] = Z.lerp(this.wx[f], t[f], k);
    this.wx.name = t.name;
  };

  G.stepNeeds = function (dt) {
    if (!this.hardcore || !this.needs) return;
    const n = this.needs, p = this.player;
    const mins = dt * Z.TIMESCALE / 60;
    n.h2o = Math.min(1000, n.h2o + mins * 0.55);
    n.fod = Math.min(1000, n.fod + mins * 0.3);
    n.slp = Math.min(1000, n.slp + mins * 0.22);
    p.sheet.mods = p.sheet.mods.filter(m => !m.needs);
    const lv = v => v >= 800 ? 3 : v >= 500 ? 2 : v >= 250 ? 1 : 0;
    const a = lv(n.h2o), b = lv(n.fod), c = lv(n.slp);
    const mod = { needs: true };
    if (a) { mod.per = (mod.per || 0) - a; mod.end = (mod.end || 0) - Math.max(0, a - 1); }
    if (b) { mod.str = (mod.str || 0) - b; mod.end = (mod.end || 0) - Math.max(0, b - 1); }
    if (c) { mod.agi = (mod.agi || 0) - c; mod.int = (mod.int || 0) - Math.max(0, c - 1); }
    if (a || b || c) p.sheet.mods.push(mod);
    if (n.h2o >= 1000 || n.fod >= 1000) { this.needT = (this.needT || 0) + dt; if (this.needT > 4) { this.needT = 0; p.applyDamage(5, { needs: true }); if (p.dead) this.handleDeath(p, { needs: true }); } }
    const warn = (k, v, text) => { const l = lv(v); if (l > (this.needWarn[k] || 0)) this.msg(text[l - 1], 'warn'); this.needWarn[k] = l; };
    this.needWarn = this.needWarn || {};
    warn('h2o', n.h2o, ['Хочется пить.', 'Сильная жажда.', 'Обезвоживание!']);
    warn('fod', n.fod, ['Хочется есть.', 'Сильный голод.', 'Истощение!']);
    warn('slp', n.slp, ['Клонит в сон.', 'Сильная усталость.', 'Валитесь с ног!']);
  };

  const baseUpdate = G.update;
  G.update = function (dt, inp) {
    baseUpdate.call(this, dt, inp);
    if (this.paused) return;
    this.stepWeather(dt);
    this.stepNeeds(dt);
    if (this.player && this.player.sheet.has('timofeyTech') && this.companions().some(a => a.cid === 'timofey')) {
      this.tinkerT = (this.tinkerT || 0) + dt;
      if (this.tinkerT > 120) { this.tinkerT = 0; for (const e of this.player.inv) if (e.cond !== undefined && e.cond < 0.6) e.cond = Math.min(0.6, e.cond + 0.08); }
    }
  };

  const baseFast = G.fastTravel;
  G.fastTravel = function (id) {
    const l = this.locations.find(x => x.id === id);
    if (l && l.nofast) { this.msg('Туда быстро не добраться.', 'warn'); return false; }
    return baseFast.call(this, id);
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
