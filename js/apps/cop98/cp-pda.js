(function (C) {
  'use strict';
  const { clamp, lerp } = C;
  const D = C.DATA, M = C.MAP;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TABS = [['map', 'Карта местности'], ['tasks', 'Задания'], ['news', 'Сообщения'], ['enc', 'Энциклопедия'], ['stats', 'Статистика']];
  const FILTERS = [['tasks', 'Задания', 'target'], ['stashes', 'Тайники', 'stash'], ['places', 'Места', 'loc'], ['people', 'Важные люди', 'trader'], ['shelters', 'Укрытия', 'shelter']];
  const SENDER_LOOK = { 'Сыч': 'owl', 'Борода': 'beard', 'Кардан': 'cardan', 'Султан': 'sultan', 'Ной': 'noah', 'Шустрый': 'nimble', 'Лоцман': 'lotsman', 'Зверобой': 'zveroboy', 'Тесак': 'tesak', 'Дегтярёв': 'degtyarev' };
  const PEOPLE = { beard: ['Борода', 'бармен, заказы на артефакты', 'skadovsk'], owl: ['Сыч', 'торговец информацией', 'skadovsk'], nimble: ['Шустрый', 'торговец оружием', 'skadovsk'], cardan: ['Кардан', 'техник: ремонт и улучшения', 'skadovsk'], sultan: ['Султан', 'главарь бандитов', 'skadovsk'], noah: ['Ной', 'отшельник на барже', 'noah'] };
  const ENC_IMG = { enc_stalker: ['look', 'zarya'], enc_bandit: ['look', 'bandit'], enc_merc: ['look', 'merc'], enc_zombie: ['look', 'zombie'], enc_dog: ['look', 'dog'], enc_flesh: ['look', 'flesh'], enc_boar: ['look', 'boar'], enc_bloodsucker: ['look', 'bloodsucker'], enc_chimera: ['look', 'chimera'] };

  function senderLook(name) {
    if (SENDER_LOOK[name]) return SENDER_LOOK[name];
    if (D.NAMES.bandit.includes(name)) return 'bandit';
    if (name === 'КПК' || name === 'Центр') return null;
    let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return ['loner', 'loner2', 'zarya'][h % 3];
  }

  const methods = {
    buildMapImage() {
      const T = this.world.terrain, N = M.SIZE, S = N;
      const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
      const cx = cv.getContext('2d'), img = cx.createImageData(S, S), d32 = new Uint32Array(img.data.buffer);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const wy = S - 1 - y, i = wy * N + x, h = T.height[i];
        const col = T.color[i];
        let r = C.red(col), g = C.green(col), b = C.blue(col);
        const hx = T.height[i + (x < N - 1 ? 1 : 0)] - T.height[i - (x > 0 ? 1 : 0)], hy = T.height[i + (wy < N - 1 ? N : 0)] - T.height[i - (wy > 0 ? N : 0)];
        const shade = clamp(1 + (-hx + hy) * 0.16, 0.62, 1.32);
        const lum = r * 0.3 + g * 0.55 + b * 0.15;
        r = lerp(r, lum * 1.04, 0.5); g = lerp(g, lum * 1.06, 0.42); b = lerp(b, lum * 0.82, 0.55);
        if (h < 0) {
          const dk = clamp(-h / 2.6, 0, 1), shore = clamp(1 + h / 0.5, 0, 1);
          r = lerp(56, 24, dk) + shore * 18; g = lerp(64, 38, dk) + shore * 16; b = lerp(54, 40, dk) + shore * 8;
        } else if (T.road[i] > 0.5) { r = lerp(r, 148, 0.75); g = lerp(g, 138, 0.75); b = lerp(b, 112, 0.75); }
        const n = 0.93 + C.hash01(x, y, 91) * 0.1 + (C.valueNoise(x / 9, y / 9, 92) - 0.5) * 0.12;
        const k = (h < 0 ? 1 : shade) * n;
        d32[y * S + x] = C.rgb(r * k, g * k, b * k);
      }
      cx.putImageData(img, 0, 0);
      for (const t of this.world.trees) {
        const rad = t.kind === 'willow' ? 2.6 : t.kind === 'pine' ? 2.1 : t.kind === 'birch' ? 1.8 : t.kind === 'bush' ? 1.3 : 1.1;
        const px = t.x, py = S - 1 - t.y;
        cx.fillStyle = 'rgba(8,10,6,0.35)'; cx.beginPath(); cx.arc(px + 1.2, py + 1.2, rad, 0, C.TAU); cx.fill();
        cx.fillStyle = t.kind === 'dead' || t.kind === 'irontree' ? 'rgba(70,62,50,0.9)' : t.kind === 'birch' ? 'rgba(92,94,54,0.92)' : 'rgba(40,50,30,0.92)';
        cx.beginPath(); cx.arc(px, py, rad, 0, C.TAU); cx.fill();
      }
      for (const col of this.world.colliders) {
        if (col.z1 - col.z0 < 1.2) continue;
        cx.save(); cx.translate(col.x, S - col.y); cx.rotate(-Math.atan2(col.s, col.c));
        cx.fillStyle = 'rgba(20,18,16,0.6)'; cx.fillRect(-col.hx + 1, -col.hy + 1, col.hx * 2, col.hy * 2);
        cx.fillStyle = 'rgba(76,72,64,0.95)'; cx.fillRect(-col.hx, -col.hy, col.hx * 2, col.hy * 2);
        cx.strokeStyle = 'rgba(140,132,116,0.5)'; cx.lineWidth = 0.6; cx.strokeRect(-col.hx + 0.3, -col.hy + 0.3, col.hx * 2 - 0.6, col.hy * 2 - 0.6);
        cx.restore();
      }
      return cv;
    },

    trackedObjective(g) {
      const objs = g.activeObjectives();
      if (this.trackedQuest) { const o = objs.find(q => q.quest === this.trackedQuest); if (o) return o; }
      return objs[0] || null;
    },

    portraitIfReady(look) {
      if (!look) return null;
      const key = C.Portraits.has(look) ? look : 'loner';
      if (this.bank.hasPortrait(key)) return this.portraitUrl(key);
      this.queuePortrait(key);
      return null;
    },

    faceImg(look, glyph, cls = 'cpp-face') {
      const u = this.portraitIfReady(look);
      return u ? `<img class="${cls}" src="${u}" alt="">` : `<img class="${cls} glyph" data-look="${look || ''}" src="${C.Skin.glyphUrl(glyph || 'pda', 32, '#8fbf7a')}" alt="">`;
    },

    openPDA(tab) {
      const g = this.game;
      if (!g) return;
      tab = tab || this.pdaTab || 'map';
      this.pdaTab = tab;
      const obj = this.trackedObjective(g);
      const q = obj ? g.questList().find(x => x.id === obj.quest) : null;
      const dist = obj && obj.at ? Math.round(Math.hypot(obj.at.x - g.player.x, obj.at.y - g.player.y)) + ' м' : '';
      let body = '';
      if (tab === 'map') body = this.pdaMapHTML();
      if (tab === 'tasks') body = this.pdaTasksHTML();
      if (tab === 'news') body = this.pdaNewsHTML();
      if (tab === 'enc') body = this.pdaEncHTML();
      if (tab === 'stats') body = this.pdaStatsHTML();
      const el = this.screen('pda', `<div class="cps-frame cpp">
        <div class="cpp-top"><nav class="cpp-tabs">${TABS.map(([k, n]) => `<button class="${k === tab ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</nav><span class="cpp-clock">${C.formatClock(g.time)} · день ${g.day()}</span></div>
        <div class="cpp-task">${obj ? `<img src="${C.Skin.glyphUrl('target', 18, obj.main ? '#f0d050' : '#8cc0ff')}" alt=""><b>${esc(q ? q.title : '')}</b><span>${esc(obj.text)}</span><em>${dist}</em>` : '<span>Нет активных заданий</span>'}</div>
        <div class="cpp-body ${tab}">${body}</div>
        <div class="cpp-foot"><span>${tab === 'map' ? 'Колесо — масштаб, перетаскивание — сдвиг карты, наведение — подробности' : ''}</span><button class="cps-exit" data-a="close">Закрыть (P)</button></div>
      </div>`, 'cps-pda');
      el.addEventListener('click', e => {
        const t = e.target.closest('[data-t]'); if (t) return this.openPDA(t.dataset.t);
        const a = e.target.closest('[data-a]');
        if (a && a.dataset.a === 'close') return this.closePanel();
        const f = e.target.closest('[data-f]'); if (f) { this.pdaFilter[f.dataset.f] = !this.pdaFilter[f.dataset.f]; return this.openPDA('map'); }
        const tr = e.target.closest('[data-track]'); if (tr) { this.trackedQuest = tr.dataset.track; return this.openPDA('tasks'); }
        const sm = e.target.closest('[data-show]'); if (sm) { const [x, y] = sm.dataset.show.split(',').map(Number); this.pdaView = { x, y, z: 3 }; return this.openPDA('map'); }
        const qs = e.target.closest('[data-q]'); if (qs) { this.pdaQuest = qs.dataset.q; return this.openPDA('tasks'); }
        const en = e.target.closest('[data-enc]'); if (en) { this.pdaEnc = en.dataset.enc; return this.openPDA('enc'); }
      });
      if (tab === 'map') this.bindPDAMap(el.querySelector('.cpp-mapwrap'));
      this.pdaRefresh = tab === 'news' || tab === 'enc' ? () => { if (this.mode === 'pda' && this.pdaTab === tab) this.openPDA(tab); } : null;
    },

    pdaMapHTML() {
      this.pdaFilter = this.pdaFilter || { tasks: true, stashes: true, places: true, people: true, shelters: false };
      const f = this.pdaFilter;
      return `<div class="cpp-filters">${FILTERS.map(([k, n, gl]) => `<button class="${f[k] ? 'on' : ''}" data-f="${k}"><img src="${C.Skin.glyphUrl(gl, 14, f[k] ? '#d8e8c0' : '#5a6a50')}" alt="">${n}</button>`).join('')}</div>
        <div class="cpp-mapwrap"><canvas class="cpp-map"></canvas><div class="cpp-tip"></div><div class="cpp-zoom"><button data-z="in" title="Приблизить">+</button><button data-z="out" title="Отдалить">−</button><button data-z="me" title="К себе"><img src="${C.Skin.glyphUrl('loc', 14, '#d8e8c0')}" alt=""></button></div></div>`;
    },

    pdaMarkers() {
      const g = this.game, f = this.pdaFilter, out = [];
      const known = id => g.discovered['poi_' + id] || ['skadovsk', 'start'].includes(id) || ((id === 'skat2' || id === 'skat3') && g.flag('owl_info')) || (id === 'station' && g.flag('knows_tesak'));
      if (f.places) for (const [id, poi] of Object.entries(M.POI)) if (known(id)) out.push({ x: poi.x, y: poi.y, glyph: 'loc', color: '#d8d4b8', r: 7, title: poi.name, sub: poi.shelter ? 'Есть укрытие от выброса' : '', label: poi.name, big: id === 'skadovsk' });
      if (f.shelters || g.emission.phase !== 'none') for (const z of g.W.zones) if (z.shelter) out.push({ x: z.x, y: z.y, glyph: 'shelter', color: '#58c0ff', r: 6, title: z.name || 'Укрытие', sub: 'Укрытие от выброса' });
      if (f.stashes) for (const [id, s] of Object.entries(g.stashes)) if (g.knownStashes[id] && !s.opened) out.push({ x: s.x, y: s.y, glyph: 'stash', color: '#70e070', r: 7, title: s.name, sub: 'Тайник: координаты из КПК' });
      if (f.people) for (const [id, [name, role, poi]] of Object.entries(PEOPLE)) { const a = g.actorById ? g.actorById(id) : null; if (a && known(poi) && !a.dead) out.push({ x: a.x, y: a.y, glyph: 'trader', color: '#e8c060', r: 6, title: name, sub: role }); }
      if (g.flag('plateau_safe')) for (const a of g.anomalies) if (a.field === 'plateau') out.push({ x: a.x, y: a.y, ring: a.trigger, color: '#ff6040', r: 4, title: D.ANOMALY_TYPES[a.type].name, sub: 'Отмечено по записке Ноя' });
      if (f.tasks) for (const o of g.activeObjectives()) if (o.at) { const q = g.questList().find(x => x.id === o.quest); out.push({ x: o.at.x, y: o.at.y, glyph: 'target', color: o.main ? '#f0d050' : '#8cc0ff', r: 9, title: q ? q.title : 'Задание', sub: o.text, task: o.quest }); }
      return out;
    },

    drawPDAMap(cv) {
      const g = this.game, c = cv.getContext('2d'), W = cv.width, H = cv.height, dpr = W / (cv.clientWidth || W);
      const v = this.pdaView, base = Math.min(W, H) / M.SIZE, s = base * v.z;
      const X = x => W / 2 + (x - v.x) * s, Y = y => H / 2 - (y - v.y) * s;
      c.fillStyle = '#0a0f0a'; c.fillRect(0, 0, W, H);
      c.imageSmoothingEnabled = v.z < 2.2;
      c.drawImage(this.mapImg, X(0), Y(M.SIZE), M.SIZE * s, M.SIZE * s);
      c.fillStyle = 'rgba(10,30,10,0.12)'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(150,210,140,0.1)'; c.lineWidth = 1;
      for (let k = 0; k <= 16; k++) { const gx = X(k * 64), gy = Y(k * 64); c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, H); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke(); }
      const ms = this.pdaMarkers(), sz = 16 * dpr;
      this.pdaHits = [];
      c.font = `${Math.round(11 * dpr)}px Tahoma, sans-serif`; c.textBaseline = 'middle';
      for (const m of ms) {
        const px = X(m.x), py = Y(m.y);
        if (px < -20 || py < -20 || px > W + 20 || py > H + 20) continue;
        if (m.ring) { c.strokeStyle = m.color; c.lineWidth = 1.5 * dpr; c.beginPath(); c.arc(px, py, Math.max(3 * dpr, m.ring * s), 0, C.TAU); c.stroke(); }
        else {
          c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.arc(px, py, sz * 0.62, 0, C.TAU); c.fill();
          C.Skin.glyph(c, m.glyph, px, py, sz * (m.big ? 1.05 : 0.9), m.color);
          if (m.label && (v.z >= 1.6 || m.big)) { const tw = c.measureText(m.label).width; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(px + sz * 0.7, py - 7 * dpr, tw + 6 * dpr, 14 * dpr); c.fillStyle = '#dfe8c8'; c.fillText(m.label, px + sz * 0.7 + 3 * dpr, py); }
        }
        this.pdaHits.push({ x: px / dpr, y: py / dpr, m });
      }
      const p = g.player, px = X(p.x), py = Y(p.y);
      c.save(); c.translate(px, py); c.rotate(-p.yaw + Math.PI / 2);
      c.fillStyle = '#48b8ff'; c.strokeStyle = '#001018'; c.lineWidth = 1.5 * dpr;
      c.beginPath(); c.moveTo(0, -11 * dpr); c.lineTo(-7 * dpr, 8 * dpr); c.lineTo(0, 4 * dpr); c.lineTo(7 * dpr, 8 * dpr); c.closePath(); c.fill(); c.stroke();
      c.restore();
      this.pdaHits.push({ x: px / dpr, y: py / dpr, m: { title: 'Вы здесь', sub: `${Math.round(p.x)}, ${Math.round(p.y)}` } });
      const sc = 100 * s / dpr;
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(10 * dpr, H - 26 * dpr, sc * dpr + 16 * dpr, 18 * dpr);
      c.fillStyle = '#cfe0b8'; c.fillRect(18 * dpr, H - 16 * dpr, sc * dpr, 2 * dpr); c.fillText('100 м', 20 * dpr + sc * dpr, H - 16 * dpr);
    },

    bindPDAMap(wrap) {
      const g = this.game, cv = wrap.querySelector('canvas'), tip = wrap.querySelector('.cpp-tip');
      if (!this.pdaView) this.pdaView = { x: g.player.x, y: g.player.y, z: 1 };
      const fit = () => {
        const r = wrap.getBoundingClientRect(), dpr = globalThis.devicePixelRatio || 1;
        cv.width = Math.max(64, Math.round(r.width * dpr)); cv.height = Math.max(64, Math.round(r.height * dpr));
        cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
        this.drawPDAMap(cv);
      };
      const v = this.pdaView;
      const toWorld = (mx, my) => { const r = cv.getBoundingClientRect(), s = Math.min(r.width, r.height) / M.SIZE * v.z; return [v.x + (mx - r.left - r.width / 2) / s, v.y - (my - r.top - r.height / 2) / s]; };
      const zoomAt = (k, mx, my) => {
        const [wx, wy] = mx == null ? [v.x, v.y] : toWorld(mx, my);
        const nz = clamp(v.z * k, 1, 6), r = cv.getBoundingClientRect(), s0 = Math.min(r.width, r.height) / M.SIZE * nz;
        if (mx != null) { v.x = wx - (mx - r.left - r.width / 2) / s0; v.y = wy + (my - r.top - r.height / 2) / s0; }
        v.z = nz; clampView(); this.drawPDAMap(cv);
      };
      const clampView = () => { const half = M.SIZE / 2 / v.z; v.x = clamp(v.x, half * 0.6, M.SIZE - half * 0.6); v.y = clamp(v.y, half * 0.6, M.SIZE - half * 0.6); if (v.z <= 1.001) { v.x = M.SIZE / 2; v.y = M.SIZE / 2; } };
      clampView();
      requestAnimationFrame(fit);
      cv.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.25 : 0.8, e.clientX, e.clientY); }, { passive: false });
      let drag = null;
      cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y }; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
      cv.addEventListener('pointerup', () => { drag = null; });
      cv.addEventListener('pointermove', e => {
        const r = cv.getBoundingClientRect();
        if (drag && (e.buttons & 1)) { const s = Math.min(r.width, r.height) / M.SIZE * v.z; v.x = drag.vx - (e.clientX - drag.x) / s; v.y = drag.vy + (e.clientY - drag.y) / s; clampView(); this.drawPDAMap(cv); tip.style.display = 'none'; return; }
        const mx = e.clientX - r.left, my = e.clientY - r.top;
        let best = null, bd = 12;
        for (const h of this.pdaHits || []) { const d = Math.hypot(h.x - mx, h.y - my); if (d < bd) { bd = d; best = h; } }
        if (!best) { tip.style.display = 'none'; return; }
        tip.innerHTML = `<b>${esc(best.m.title)}</b>${best.m.sub ? `<span>${esc(best.m.sub)}</span>` : ''}${best.m.x != null ? `<em>${Math.round(Math.hypot(best.m.x - g.player.x, best.m.y - g.player.y))} м от вас</em>` : ''}`;
        tip.style.display = 'block';
        tip.style.left = Math.round(clamp(mx + 14, 4, r.width - tip.offsetWidth - 4)) + 'px'; tip.style.top = Math.round(clamp(my + 10, 4, r.height - tip.offsetHeight - 4)) + 'px';
      });
      cv.addEventListener('pointerleave', () => { tip.style.display = 'none'; });
      wrap.querySelector('.cpp-zoom').addEventListener('click', e => {
        const b = e.target.closest('[data-z]'); if (!b) return;
        if (b.dataset.z === 'in') zoomAt(1.5);
        if (b.dataset.z === 'out') zoomAt(1 / 1.5);
        if (b.dataset.z === 'me') { v.z = Math.max(v.z, 2.5); v.x = g.player.x; v.y = g.player.y; clampView(); this.drawPDAMap(cv); }
      });
    },

    pdaTasksHTML() {
      const g = this.game, list = g.questList();
      if (!list.length) return '<div class="cpp-empty">Заданий пока нет. Поговорите с людьми на «Скадовске».</div>';
      const sel = list.find(q => q.id === this.pdaQuest) || list.find(q => q.state === 'active') || list[0];
      const tracked = this.trackedObjective(g);
      const group = (title, qs) => qs.length ? `<h4>${title}</h4>${qs.map(q => `<button class="cpp-q ${q === sel ? 'on' : ''} ${q.state}" data-q="${q.id}"><img src="${C.Skin.glyphUrl(q.state === 'done' ? 'check' : q.state === 'failed' ? 'warn' : 'quest', 16, q.state === 'active' ? (q.main ? '#f0d050' : '#8cc0ff') : q.state === 'done' ? '#7aa860' : '#c06040')}" alt=""><span>${esc(q.title)}</span>${tracked && tracked.quest === q.id ? '<em>отслеживается</em>' : ''}</button>`).join('')}` : '';
      const act = list.filter(q => q.state === 'active');
      const detail = `<h3>${esc(sel.title)}</h3><div class="cpp-qstate">${sel.main ? 'Сюжетное задание' : 'Дополнительное задание'} · ${sel.state === 'active' ? 'выполняется' : sel.state === 'done' ? 'выполнено' : 'провалено'}</div>
        ${sel.objectives.map(o => `<div class="cpp-obj"><img src="${C.Skin.glyphUrl('target', 14, sel.main ? '#f0d050' : '#8cc0ff')}" alt=""><span>${esc(o.text)}</span>${o.at ? `<em>${Math.round(Math.hypot(o.at.x - g.player.x, o.at.y - g.player.y))} м</em><button data-show="${Math.round(o.at.x)},${Math.round(o.at.y)}">На карте</button>` : ''}</div>`).join('')}
        ${sel.state === 'active' ? `<button class="cps-exit sm" data-track="${sel.id}" ${tracked && tracked.quest === sel.id ? 'disabled' : ''}>${tracked && tracked.quest === sel.id ? 'Отслеживается' : 'Отслеживать'}</button>` : ''}`;
      return `<div class="cpp-list">${group('Текущие', act.filter(q => q.main))}${group('Дополнительные', act.filter(q => !q.main))}${group('Выполненные', list.filter(q => q.state === 'done'))}${group('Проваленные', list.filter(q => q.state === 'failed'))}</div><div class="cpp-detail">${detail}</div>`;
    },

    pdaNewsHTML() {
      const g = this.game;
      if (!g.pda.length) return '<div class="cpp-empty">Сообщений нет.</div>';
      return `<div class="cpp-news">${g.pda.slice().reverse().map(n => { const look = senderLook(n.from); return `<div class="cpp-msg ${n.important ? 'imp' : ''}">${this.faceImg(look, n.from === 'Центр' ? 'info' : 'pda')}<div><div class="cpp-msghead"><b>${esc(n.from)}</b><span>${C.formatClock(n.t)}, день ${Math.floor(n.t / 1440) + 1}</span></div><p>${esc(n.text)}</p></div></div>`; }).join('')}</div>`;
    },

    encEntries() {
      const g = this.game, out = [];
      for (const k of Object.keys(g.encyclopedia)) {
        if (C.ENCYCLOPEDIA[k]) out.push({ id: k, cat: C.ENCYCLOPEDIA[k][0], title: C.ENCYCLOPEDIA[k][1], text: C.ENCYCLOPEDIA[k][2] });
        else if (k.startsWith('art_')) { const a = D.ARTIFACTS[k.slice(4)]; if (a) out.push({ id: k, cat: 'Артефакты', title: a.name, text: a.desc, item: k.slice(4) }); }
      }
      out.push({ id: 'lore_skadovsk', cat: 'Затон', title: '«Скадовск»', text: C.LORE.skadovsk }, { id: 'lore_zaton', cat: 'Затон', title: 'Затон', text: C.LORE.zaton });
      if (g.flag('box_decoded')) out.push({ id: 'lore_fairway', cat: 'Расследование', title: '«Фарватер»', text: C.LORE.fairway });
      out.sort((a, b) => a.cat.localeCompare(b.cat) || a.title.localeCompare(b.title));
      return out;
    },

    pdaEncHTML() {
      const list = this.encEntries();
      const sel = list.find(e => e.id === this.pdaEnc) || list[0];
      let cat = '', items = '';
      for (const e of list) { if (e.cat !== cat) { cat = e.cat; items += `<h4>${esc(cat)}</h4>`; } items += `<button class="cpp-q ${e === sel ? 'on' : ''}" data-enc="${e.id}"><span>${esc(e.title)}</span></button>`; }
      let pic = '';
      const im = ENC_IMG[sel.id];
      if (sel.item) pic = `<img class="cpp-encimg item" src="${this.iconUrl(sel.item)}" alt="">`;
      else if (im && im[0] === 'look') pic = this.faceImg(im[1], 'info', 'cpp-encimg');
      else if (sel.id.startsWith('anom_') && this.anomalyIcon) pic = `<img class="cpp-encimg anom" src="${this.anomalyIcon(sel.id.slice(5))}" alt="">`;
      return `<div class="cpp-list">${items}</div><div class="cpp-detail enc">${pic}<div class="cpp-qstate">${esc(sel.cat)}</div><h3>${esc(sel.title)}</h3><p>${esc(sel.text)}</p></div>`;
    },

    pdaStatsHTML() {
      const g = this.game, s = g.stats;
      const rel = r => r >= 50 ? ['друзья', 'good'] : r > -50 ? ['нейтралы', ''] : ['враги', 'bad'];
      const rows = [['Дней в Зоне', g.day()], ['Пройдено', (s.distance / 1000).toFixed(1) + ' км'], ['Убито людей', s.kills], ['Убито мутантов', s.mutants], ['Найдено артефактов', s.artifacts], ['Найдено тайников', s.stashes], ['Точность стрельбы', (s.shots ? Math.round(s.hits / s.shots * 100) : 0) + '%'], ['Пережито выбросов', s.emissions], ['Заработано', C.formatMoney(s.money)], ['Репутация на «Скадовске»', g.rep]];
      return `<div class="cpp-stats">${this.faceImg('degtyarev', 'info', 'cpp-encimg')}<div><h3>Майор Дегтярёв</h3><div class="cpp-qstate">Легенда: вольный сталкер</div><table>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}${['stalker', 'bandit', 'merc'].map(f => { const [t, c] = rel(g.playerRel[f]); return `<tr><td>${D.FACTIONS[f].name}</td><td class="${c}">${t}</td></tr>`; }).join('')}</table></div></div>`;
    }
  };

  Object.assign(C.UI.prototype, methods);
  C.senderLook = senderLook;
})(globalThis.Cop98 = globalThis.Cop98 || {});
