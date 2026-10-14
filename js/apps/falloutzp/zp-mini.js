(function (Z) {
  'use strict';

  const U = Z.UI.prototype;
  const esc = s => Z.esc(s);
  const LOCK_NAMES = [[0, 'очень простой'], [25, 'простой'], [50, 'средний'], [75, 'сложный'], [100, 'очень сложный']];
  Z.lockName = n => { let nm = LOCK_NAMES[0][1]; for (const [v, s] of LOCK_NAMES) if (n >= v) nm = s; return nm; };

  U.openLockpick = function (ob) {
    const g = this.game, p = g.player;
    const skill = p.sheet.skill('lockpick');
    if (skill < ob.lock) { g.msg('Замок ' + Z.lockName(ob.lock) + ': нужен навык «Взлом» ' + ob.lock + '.', 'warn'); return; }
    if (p.count('lockpick') <= 0) { g.msg('Нет отмычек.', 'warn'); return; }
    if (g.flags['broken_' + ob.id] && !p.sheet.has('safecracker')) { g.msg('Замок сломан. Теперь только ключом.', 'warn'); return; }
    const R = g.rng;
    const sweet = R() * Math.PI - Math.PI / 2;
    const width = Z.clamp(0.42 - ob.lock * 0.0028 + (skill - ob.lock) * 0.0022, 0.07, 0.5);
    const st = { pin: 0, rot: 0, turning: false, pinHP: 1, done: false, t: 0 };
    const el = this.panelEl('zp-lock', '<h2>ВЗЛОМ · замок ' + esc(Z.lockName(ob.lock)) + '</h2><canvas></canvas><div class="foot" style="display:flex;justify-content:space-between;font-size:12px"><span class="dim">Мышь/A,D — отмычка · зажмите E/Пробел — поворот · Esc — выход</span><span class="lp"></span></div>');
    const panel = { el, pause: true };
    const cv = el.querySelector('canvas');
    let mx = null;
    cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); mx = Z.clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); st.pin = mx * Math.PI / 2; });
    cv.addEventListener('mousedown', () => { st.turning = true; });
    cv.addEventListener('mouseup', () => { st.turning = false; });
    panel.key = e => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') { st.pin = Math.max(-Math.PI / 2, st.pin - 0.06); return true; }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') { st.pin = Math.min(Math.PI / 2, st.pin + 0.06); return true; }
      if (e.code === 'KeyE' || e.code === 'Space') { st.turning = true; return true; }
      return false;
    };
    const up = e => { if (e.code === 'KeyE' || e.code === 'Space') st.turning = false; };
    this.el.addEventListener('keyup', up);
    panel.onClose = () => { this.el.removeEventListener('keyup', up); cancelAnimationFrame(st.raf); };
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      st.t += dt;
      const diff = Math.abs(st.pin - sweet);
      const maxRot = diff < width ? 1 : Z.clamp(1 - (diff - width) / (Math.PI * 0.45), 0, 1);
      if (st.turning && !st.done) {
        st.rot = Math.min(maxRot, st.rot + dt * 1.6);
        if (st.rot >= maxRot - 0.01 && maxRot < 0.999) {
          st.pinHP -= dt * (0.9 + ob.lock / 120);
          if (st.pinHP <= 0) {
            p.take('lockpick', 1);
            st.pinHP = 1; st.rot = 0;
            g.ev.emit('pickBreak', {});
            if (p.count('lockpick') <= 0) { this.closePanel(panel); g.msg('Отмычки кончились.', 'warn'); return; }
          }
        }
        if (st.rot >= 0.999) {
          st.done = true;
          g.unlock(ob, 'pick');
          g.ev.emit('pickOpen', {});
          setTimeout(() => { if (this.panels.includes(panel)) { this.closePanel(panel); const r = g.activate({ obj: ob }); if (r) this.routeActivation(r); } }, 350);
        }
      } else st.rot = Math.max(0, st.rot - dt * 2.4);
      draw(maxRot);
      st.raf = requestAnimationFrame(loop);
    };
    const draw = () => {
      const r = cv.getBoundingClientRect();
      cv.width = Math.max(10, Math.round(r.width)); cv.height = Math.max(10, Math.round(r.height));
      const c = cv.getContext('2d'), W = cv.width, H = cv.height, cx = W / 2, cy = H * 0.55, R0 = Math.min(W, H) * 0.32;
      c.clearRect(0, 0, W, H);
      c.shadowColor = 'rgba(255,150,30,0.8)'; c.shadowBlur = 8;
      c.strokeStyle = '#ffb642'; c.lineWidth = 3;
      c.beginPath(); c.arc(cx, cy, R0 * 1.15, 0, Math.PI * 2); c.stroke();
      c.save(); c.translate(cx, cy); c.rotate(st.rot * Math.PI / 2);
      c.beginPath(); c.arc(0, 0, R0, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#ffb642'; c.beginPath(); c.arc(0, -R0 * 0.18, R0 * 0.12, 0, Math.PI * 2); c.fill(); c.fillRect(-R0 * 0.06, -R0 * 0.18, R0 * 0.12, R0 * 0.38);
      c.restore();
      c.save(); c.translate(cx, cy); c.rotate(st.pin + Math.sin(st.t * 40) * (st.turning && st.rot < 1 ? 0.015 : 0));
      c.strokeStyle = st.pinHP < 0.4 ? '#ff6a40' : '#ffe0a0'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -R0 * 1.6); c.lineTo(R0 * 0.08, -R0 * 1.7); c.stroke();
      c.restore();
      c.save(); c.translate(cx + R0 * 0.1, cy + R0 * 0.05); c.rotate(st.rot * Math.PI / 2 + 0.35);
      c.fillStyle = '#c87c2a'; c.fillRect(-4, 0, 8, R0 * 1.3);
      c.restore();
      c.shadowBlur = 0;
      el.querySelector('.lp').textContent = 'Отмычек: ' + p.count('lockpick') + ' · навык ' + skill;
    };
    this.openPanel(panel);
    st.raf = requestAnimationFrame(loop);
  };

  const REAL = {
    5: ['ТАЛОН', 'КАСКА', 'ПЛАНЫ', 'РЕЧКА', 'СКАЛА', 'КАЗАК', 'СТАЛЬ', 'ВОЛНА', 'ПАРОМ', 'ЛАМПА', 'ГРУША', 'БАЛКА', 'ОТДЕЛ', 'ЗАВОД', 'НОРМА', 'ГОРОД', 'ПОРОГ', 'МОТОР', 'РЫНОК', 'ПОЕЗД', 'ВЕТЕР', 'ЗАМОК', 'ПЕСОК', 'ЛАВКА', 'ШАШКА'],
    7: ['ПЛОТИНА', 'ТУРБИНА', 'КОМИТЕТ', 'СИСТЕМА', 'ЭНЕРГИЯ', 'АВТОМАТ', 'КОМАНДА', 'ГЕНЕРАЛ', 'ДЕПУТАТ', 'ТОВАРИЩ', 'ПРИКАЗЫ', 'ВОКЗАЛЫ', 'ОБОРОНА', 'ТРАНЗИТ', 'КАРАУЛЫ', 'ПОРУЧИК', 'СОЛДАТЫ', 'ПАТРОНЫ', 'ДОКЛАДЫ', 'ПЕРЕВОД', 'ЗАДАНИЕ'],
    9: ['ГЕНЕРАТОР', 'КОМЕНДАНТ', 'ПЯТИЛЕТКА', 'ДИСПЕТЧЕР', 'ЗАПОРОЖЬЕ', 'ДНЕПРОГЭС', 'РАЗРЕШЕНО', 'НАЧАЛЬНИК', 'ВЫПОЛНЕНО', 'СОВЕЩАНИЕ', 'ПРОВЕРЕНО', 'ЛАБОРАНТЫ', 'ТРАНСПОРТ', 'ОБЩЕЖИТИЕ', 'ПРОЖЕКТОР', 'ТРЕВОЖНЫЙ', 'ЗАГРУЖЕНО', 'КОМАНДИРЫ', 'ОГРАЖДЕНО']
  };

  U.openHack = function (ob, onDone) {
    const g = this.game, p = g.player;
    const skill = p.sheet.skill('science');
    if (skill < ob.lock) { g.msg('ЭВМ защищена: нужна «Наука» ' + ob.lock + '.', 'warn'); return; }
    if (g.flags['lockout_' + ob.id] && !p.sheet.has('programmer')) { g.msg('ЭВМ заблокирована. Только с паролем.', 'warn'); return; }
    const R = g.rng;
    const len = ob.lock >= 75 ? 9 : ob.lock >= 40 ? 7 : 5;
    const pool = REAL[len].filter(w => w.length === len);
    const words = [];
    while (words.length < Math.min(pool.length, 12)) { const w = pool[Math.floor(R() * pool.length)]; if (!words.includes(w)) words.push(w); }
    const pass = words[Math.floor(R() * words.length)];
    let tries = 4;
    const log = [];
    const GARB = '!@#$%^&*()-+=[]{}<>?/\\|;:\'",._';
    const cols = 2, lines = 16, per = 12;
    const total = cols * lines * per;
    let dump = '';
    for (let i = 0; i < total; i++) dump += GARB[Math.floor(R() * GARB.length)];
    const slots = [];
    const used = new Set();
    for (const w of words) {
      for (let tries2 = 0; tries2 < 60; tries2++) {
        const at = Math.floor(R() * (total - w.length));
        let ok = true;
        for (let k = at - 1; k <= at + w.length; k++) if (used.has(k)) ok = false;
        if (!ok) continue;
        for (let k = 0; k < w.length; k++) used.add(at + k);
        slots.push({ w, at });
        dump = dump.slice(0, at) + w + dump.slice(at + w.length);
        break;
      }
    }
    const brackets = [];
    for (const [o, c] of [['(', ')'], ['[', ']'], ['{', '}'], ['<', '>']]) {
      for (let k = 0; k < 2; k++) {
        const at = Math.floor(R() * (total - 6));
        let ok = true;
        for (let q = at; q < at + 5; q++) if (used.has(q)) ok = false;
        if (!ok) continue;
        dump = dump.slice(0, at) + o + dump.slice(at + 1, at + 4) + c + dump.slice(at + 5);
        brackets.push({ at, len: 5, used: false });
      }
    }
    const el = this.panelEl('zp-term', '<div class="scr"></div>');
    const panel = { el };
    const scr = el.querySelector('.scr');
    const likeness = w => { let n = 0; for (let k = 0; k < w.length; k++) if (w[k] === pass[k]) n++; return n; };
    const render = () => {
      const addr = i => '0x' + (0xF4A0 + i * per).toString(16).toUpperCase();
      let html = 'ЭВМ «ИСКРА-1030» · ТЕРМИНАЛ ЗАЩИТЫ\nВВЕДИТЕ ПАРОЛЬ ДОСТУПА\n\nОсталось попыток: ' + '■ '.repeat(tries) + '\n\n<div class="hk"><div class="dump">';
      for (let l = 0; l < lines; l++) {
        let row = '';
        for (let cI = 0; cI < cols; cI++) {
          const start = (cI * lines + l) * per;
          row += addr(cI * lines + l) + ' ';
          let s = '';
          for (let k = start; k < start + per; k++) {
            const slot = slots.find(sl => k >= sl.at && k < sl.at + sl.w.length);
            const br = brackets.find(b => !b.used && k === b.at);
            if (slot && k === slot.at) { s += '<span class="w" data-w="' + slot.w + '">' + (slot.dud ? '.'.repeat(slot.w.length) : slot.w) + '</span>'; k += slot.w.length - 1; continue; }
            if (br) { s += '<span class="w" data-b="' + brackets.indexOf(br) + '">' + esc(dump.substr(k, br.len)) + '</span>'; k += br.len - 1; continue; }
            s += esc(dump[k]);
          }
          row += s + '   ';
        }
        html += row + '\n';
      }
      html += '</div><div class="log">' + log.slice(-12).map(esc).join('\n') + '\n&gt;</div></div>';
      scr.innerHTML = html;
      scr.querySelectorAll('[data-w]').forEach(e => e.addEventListener('click', () => guess(e.dataset.w)));
      scr.querySelectorAll('[data-b]').forEach(e => e.addEventListener('click', () => bracket(+e.dataset.b)));
    };
    const guess = w => {
      const slot = slots.find(s => s.w === w);
      if (!slot || slot.dud) return;
      if (w === pass) {
        log.push('>' + w, '>Доступ разрешён.');
        render();
        g.unlock(ob, 'hack');
        g.ev.emit('hackOk', {});
        setTimeout(() => { if (this.panels.includes(panel)) { this.closePanel(panel); if (onDone) onDone(); else this.openTerminal(ob); } }, 600);
        return;
      }
      tries--;
      log.push('>' + w, '>Отказ в доступе.', '>Совпадение=' + likeness(w));
      g.ev.emit('hackFail', {});
      if (tries <= 0) {
        g.flags['lockout_' + ob.id] = true;
        log.push('>ТЕРМИНАЛ ЗАБЛОКИРОВАН');
        render();
        setTimeout(() => { if (this.panels.includes(panel)) this.closePanel(panel); }, 900);
        return;
      }
      render();
    };
    const bracket = i => {
      const b = brackets[i];
      if (!b || b.used) return;
      b.used = true;
      if (R() < 0.3) { tries = 4; log.push('>Попытки восстановлены.'); }
      else { const duds = slots.filter(s => s.w !== pass && !s.dud); if (duds.length) { duds[Math.floor(R() * duds.length)].dud = true; log.push('>Пустышка удалена.'); } }
      render();
    };
    this.openPanel(panel);
    render();
  };

  U.openTerminal = function (ob) {
    const g = this.game;
    const T = (Z.TERMINALS && Z.TERMINALS[ob.term]) || { title: ob.name, entries: [] };
    let view = null;
    const el = this.panelEl('zp-term', '<div class="scr"></div>');
    const panel = { el };
    const scr = el.querySelector('.scr');
    let sel = 0;
    const entries = () => (T.entries || []).filter(e => !e.cond || g.cond(e.cond));
    const render = () => {
      if (view) {
        scr.innerHTML = esc(T.header || 'ЭВМ «ИСКРА-1030»') + '\n\n' + esc(view.title) + '\n' + '─'.repeat(40) + '\n' + esc(g.subst(view.text || '')) + '\n\n<span class="w sel" data-back="1">&lt; Назад</span>';
        scr.querySelector('[data-back]').addEventListener('click', () => { view = null; render(); });
        return;
      }
      const list = entries();
      sel = Z.clamp(sel, 0, list.length);
      scr.innerHTML = esc(T.header || 'ЭВМ «ИСКРА-1030» · ОС «ДИСПЕТЧЕР-77»') + '\n' + esc(T.title || ob.name) + '\n' + '─'.repeat(40) + '\n\n' + list.map((e, i) => '<span class="w' + (i === sel ? ' sel' : '') + '" data-i="' + i + '">&gt; ' + esc(e.title) + '</span>').join('\n') + '\n<span class="w' + (sel === list.length ? ' sel' : '') + '" data-i="' + list.length + '">&gt; Выход</span>';
      scr.querySelectorAll('[data-i]').forEach(e => e.addEventListener('click', () => { sel = +e.dataset.i; enter(); }));
    };
    const enter = () => {
      const list = entries();
      const e = list[sel];
      if (!e) { this.closePanel(panel); return; }
      if (e.act) { const r = g.act(e.act, { obj: ob }); if (e.msg) g.msg(e.msg, 'info'); if (r.includes('end')) { this.closePanel(panel); return; } }
      if (e.text) view = e;
      render();
    };
    panel.key = ev => {
      if (view) { if (ev.code === 'Enter' || ev.code === 'Backspace' || ev.code === 'KeyE') { view = null; render(); return true; } return false; }
      const n = entries().length + 1;
      if (ev.code === 'ArrowUp' || ev.code === 'KeyW') { sel = (sel + n - 1) % n; render(); return true; }
      if (ev.code === 'ArrowDown' || ev.code === 'KeyS') { sel = (sel + 1) % n; render(); return true; }
      if (ev.code === 'Enter' || ev.code === 'KeyE') { enter(); return true; }
      return false;
    };
    g.ev.emit('terminal', { ob });
    this.openPanel(panel);
    render();
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
