(function (H) {
  'use strict';
  const { W, HGT, C, lsGet, lsSet } = H.UI_CONST;

  const KINDS = [['bug', 'Не работает'], ['crash', 'Зависло или вылетело'], ['visual', 'Графика'], ['text', 'Текст'], ['sound', 'Звук'], ['balance', 'Баланс'], ['idea', 'Идея']];
  const REPEATS = [['always', 'Всегда'], ['sometimes', 'Иногда'], ['once', 'Один раз'], ['unknown', 'Не проверял']];
  const STATUS = { queued: 'В очереди', received: 'Получен', local: 'Сохранён локально', file: 'Сохранён в файл', accepted: 'Принят', fixed: 'Исправлен', duplicate: 'Уже известен', notabug: 'Не ошибка', wontfix: 'Не будет исправлен', rejected: 'Не принят сервером', dropped: 'Не отправлен', new: 'Получен' };
  const OFFLINE = ['file', 'local', 'queued', 'rejected', 'dropped'];
  const BOX = { x: 60, y: 36, w: 520, h: 408 };
  const ROWS = { x: 78, y: 226, w: 484, h: 21 };

  const inSystem = () => !!globalThis.winManager;
  const listKey = () => (inSystem() ? 'win98.bugs.sent' : 'sr98.bugs.sent');
  const checkedKey = () => (inSystem() ? 'win98.bugs.checked' : 'sr98.bugs.checked');
  const readList = () => {
    const v = lsGet(listKey(), []);
    return Array.isArray(v) ? v : [];
  };
  const writeList = list => lsSet(listKey(), list.slice(0, 50));
  const statusText = r => (r.status === 'fixed' && r.fixedIn === 'next' ? 'Исправлен, будет в обновлении' : r.status === 'fixed' && r.fixedIn ? 'Исправлен в ' + r.fixedIn : STATUS[r.status] || 'Получен');
  const dateText = iso => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (typeof addEventListener === 'function') {
    ['bugreport-sent', 'bugreport-rejected', 'bugreport-dropped'].forEach(type => addEventListener(type, e => {
      if (inSystem()) return;
      const detail = e.detail || {};
      const list = readList();
      const item = list.find(r => r.id === detail.id);
      if (!item) return;
      item.status = type === 'bugreport-sent' ? (detail.local ? 'local' : 'received') : type === 'bugreport-rejected' ? 'rejected' : 'dropped';
      if (detail.error) item.note = detail.error;
      writeList(list);
    }));
  }

  function copyCanvas(src) {
    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    return c;
  }

  function thumb(src) {
    try {
      const c = document.createElement('canvas');
      c.width = 96;
      c.height = 72;
      c.getContext('2d').drawImage(src, 0, 0, 96, 72);
      return c.toDataURL('image/jpeg', 0.6);
    } catch (err) {
      return '';
    }
  }

  function toBlob(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/png'));
  }

  async function gzip(text) {
    if (typeof CompressionStream !== 'function') return null;
    return new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).blob();
  }

  function hsrStorage() {
    const ls = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('hsr98.')) ls[k] = localStorage.getItem(k);
      }
    } catch (err) {}
    return ls;
  }

  if (typeof addEventListener === 'function') {
    addEventListener('bugreport-crash', e => {
      const ui = globalThis.hsrui;
      if (inSystem() || !ui || typeof ui.openBugCrash !== 'function') return;
      ui.openBugCrash(e.detail || {});
    });
  }

  const baseKeydown = H.UI.prototype.keydown;
  const baseFileSaved = H.UI.prototype.fileSaved;
  const baseRender = H.UI.prototype.render;
  const CRASH_MUTE = 'sr98.bugs.crashMute';

  Object.assign(H.UI.prototype, {
    render() {
      try {
        return baseRender.call(this);
      } catch (err) {
        const top = this.top();
        if (top && (top.bugReport || top.bugList || top.bugCrash)) {
          try {
            this.ctx.setTransform(this.canvas.width / W, 0, 0, this.canvas.height / HGT, 0, 0);
            top.draw(this.ctx);
          } catch (inner) {}
        }
        throw err;
      }
    },

    openBugCrash(detail) {
      const top = this.top();
      if (top && (top.bugReport || top.bugList || top.bugCrash)) return false;
      if (lsGet(CRASH_MUTE, false) || (this.bugCrashN || 0) >= 3 || Date.now() - (this.bugCrashAt || 0) < 120000) return false;
      this.bugCrashAt = Date.now();
      this.bugCrashN = (this.bugCrashN || 0) + 1;
      const ui = this;
      const items = [
        { label: 'Отправить отчёт', col: C.gold, fn: () => { ui.screens.pop(); ui.openBugReport({ crash: detail }); } },
        { label: 'Продолжить', fn: () => ui.pop() },
        { label: 'Больше не показывать', fn: () => { lsSet(CRASH_MUTE, true); ui.pop(); } }
      ];
      this.push({
        bugCrash: true,
        pause: true,
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.7)';
          c.fillRect(0, 0, W, HGT);
          ui.win(W / 2 - 220, 120, 440, 236, { title: 'Ошибка в игре' });
          ui.text('В игре что-то сломалось.', W / 2, 146, { align: 'center', size: 14, bold: true, col: C.bad });
          ui.text('Отчёт займёт полминуты: снимок и место в игре приложатся сами.', W / 2, 168, { align: 'center', size: 11, col: C.sub });
          ui.wrap(String(detail.msg || ''), 400, 10).slice(0, 3).forEach((line, i) => ui.text(line, W / 2 - 200, 190 + i * 13, { size: 10, col: C.dim }));
          ui.list(W / 2 - 190, 236, 380, items, this.sel, { rowH: 26, onClick: i => { this.sel = i; this.key('ok'); } });
          ui.hints([['Enter', 'Выбрать'], ['Esc', 'Продолжить']], W / 2, 120 + 236 - 20, { align: 'center' });
        },
        key(k) {
          if (ui.listNav(this, k, items.length)) return;
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok') items[this.sel].fn();
        }
      });
      return true;
    },

    keydown(e) {
      if (e.code === 'F9') {
        if (e.preventDefault) e.preventDefault();
        if (!this.active() || e.repeat) return;
        this.openBugReport();
        return;
      }
      return baseKeydown.call(this, e);
    },

    fileSaved(ok) {
      if (!this.bugFileName) return baseFileSaved.call(this, ok);
      const name = this.bugFileName;
      this.bugFileName = null;
      this.sfx(ok ? 'anchor' : 'deny');
      this.toast(ok ? 'Отчёт сохранён в файл ' + name : 'Файл не записан');
    },

    bugUnseen() {
      return readList().filter(r => r.status !== r.seen).length;
    },

    openBugReport(opts) {
      const top = this.top();
      if (top && (top.bugReport || top.bugList)) return;
      if (globalThis.Net98) globalThis.Net98.hideCode();
      const crash = opts && opts.crash;
      const ui = this;
      const d = {
        title: crash ? ('Сбой: ' + (crash.msg || '')).slice(0, 200) : '', text: '', kind: crash ? 1 : 0, repeat: 3, save: true, busy: false, status: '', done: null,
        shot: copyCanvas(this.canvas),
        info: this.bugInfo(),
        live: this.bugSave()
      };
      const rows = () => {
        const sent = readList().length;
        const unseen = this.bugUnseen();
        return [
          { id: 'title', label: 'Что случилось?', right: d.title ? ui.clip(d.title, 230, 11) : 'Enter — написать', rcol: d.title ? C.cream : C.gold },
          { id: 'text', label: 'Подробности', right: d.text ? ui.clip(d.text.replace(/\s+/g, ' '), 230, 11) : 'необязательно' },
          { id: 'kind', label: 'Тип', right: '‹ ' + KINDS[d.kind][1] + ' ›' },
          { id: 'repeat', label: 'Повторяется', right: '‹ ' + REPEATS[d.repeat][1] + ' ›' },
          { id: 'save', label: 'Приложить состояние игры', right: d.save ? 'да' : 'нет' },
          { id: 'send', label: d.busy ? 'Отправка…' : 'Отправить', disabled: !d.title || d.busy, col: d.title && !d.busy ? C.gold : null },
          { id: 'file', label: 'Сохранить в файл', disabled: d.busy },
          { id: 'list', label: 'Мои отчёты', right: (unseen ? '• ' : '') + sent, rcol: unseen ? C.gold : C.sub }
        ];
      };
      const cycle = (key, n, dir) => { d[key] = (d[key] + dir + n) % n; ui.sfx('select'); };
      const act = id => {
        if (id === 'title') ui.beginBugEdit(ROWS.y, false, d.title, v => { d.title = v; });
        else if (id === 'text') ui.beginBugEdit(ROWS.y + ROWS.h, true, d.text, v => { d.text = v; });
        else if (id === 'kind') cycle('kind', KINDS.length, 1);
        else if (id === 'repeat') cycle('repeat', REPEATS.length, 1);
        else if (id === 'save') { d.save = !d.save; ui.sfx('select'); }
        else if (id === 'send') ui.bugSend(d);
        else if (id === 'file') ui.bugToFile(d);
        else if (id === 'list') ui.openBugList();
      };
      this.push({
        bugReport: true,
        pause: true,
        draft: d,
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.66)';
          c.fillRect(0, 0, W, HGT);
          ui.win(BOX.x, BOX.y, BOX.w, BOX.h, { title: 'Сообщение об ошибке' });
          ui.closeBtn(BOX.x + BOX.w - 30, BOX.y + 8, () => this.key('back'));
          if (d.done) {
            ui.text(d.done.queued ? 'Сервер не ответил. Отчёт сохранён.' : d.done.local ? 'Отчёт сохранён в папке проекта.' : 'Отчёт отправлен. Спасибо!', W / 2, 150, { align: 'center', size: 15, bold: true, col: d.done.queued ? C.gold : C.ok });
            ui.text('Номер отчёта', W / 2, 190, { align: 'center', size: 11, col: C.sub });
            ui.text(d.done.id, W / 2, 206, { align: 'center', size: 16, bold: true, col: C.cream });
            const note = d.done.queued ? 'Он уйдёт сам, когда появится связь.' : d.done.local ? 'Запуск из папки проекта: отчёт в bugreports, в Telegram он не уходит.' : 'Статус виден в «Моих отчётах».';
            ui.text(note, W / 2, 240, { align: 'center', size: 11, col: C.sub });
            ui.button(W / 2 - 150, 290, 140, 26, 'Мои отчёты', () => { ui.pop(); ui.openBugList(); });
            ui.button(W / 2 + 10, 290, 140, 26, 'Закрыть', () => ui.pop(), { active: true });
            ui.hints([['Enter', 'Закрыть'], ['Esc', 'Закрыть']], W / 2, BOX.y + BOX.h - 22, { align: 'center' });
            return;
          }
          const tx = 78, ty = 72, tw = 192, th = 144;
          c.fillStyle = '#000';
          c.fillRect(tx - 2, ty - 2, tw + 4, th + 4);
          c.fillStyle = C.brassDk;
          c.fillRect(tx - 1, ty - 1, tw + 2, th + 2);
          c.drawImage(d.shot, tx, ty, tw, th);
          ui.text('Где', 286, 70, { size: 11, col: C.sub });
          ui.wrap(d.info.summary, 270, 11).slice(0, 6).forEach((line, i) => ui.text(line, 286, 86 + i * 15, { size: 11, col: C.cream }));
          if (d.info.state && d.info.state.cheats) ui.text('Использовались F7/F8 — это попадёт в отчёт', 286, 182, { size: 10, col: C.gold });
          ui.text('Снимок экрана, место в игре и журнал ошибок прикладываются сами', 286, 198, { size: 10, col: C.dim });
          ui.list(ROWS.x, ROWS.y, ROWS.w, rows(), this.sel, { rowH: ROWS.h, max: 8, onClick: i => { this.sel = i; this.key('ok'); } });
          if (d.status) ui.wrap(d.status, ROWS.w, 11).slice(0, 2).forEach((line, i) => ui.text(line, ROWS.x, 398 + i * 13, { size: 11, col: d.statusBad ? C.bad : C.sub }));
          ui.hints([['↑↓', 'Поле'], ['←→', 'Значение'], ['Enter', 'Выбрать'], ['Esc', 'Закрыть']], W / 2, BOX.y + BOX.h - 18, { align: 'center' });
        },
        key(k, code) {
          if (d.done) {
            if (k === 'ok' || k === 'back') ui.pop();
            return;
          }
          if (d.busy) return;
          const list = rows();
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'back') { ui.pop(); return; }
          const id = list[this.sel].id;
          const dir = k === 'left' || code === 'KeyQ' ? -1 : k === 'right' || code === 'KeyE' ? 1 : 0;
          if (dir && id === 'kind') { cycle('kind', KINDS.length, dir); return; }
          if (dir && id === 'repeat') { cycle('repeat', REPEATS.length, dir); return; }
          if (dir && id === 'save') { d.save = !d.save; ui.sfx('select'); return; }
          if (k === 'ok') {
            if (list[this.sel].disabled) { ui.sfx('deny'); return; }
            act(id);
          }
        },
        onClose() { ui.endBugEdit(); }
      });
    },

    beginBugEdit(rowY, multiline, value, done) {
      this.endBugEdit();
      if (typeof document === 'undefined' || !this.canvas.getBoundingClientRect || !this.root.getBoundingClientRect || !this.root.appendChild) return;
      const cr = this.canvas.getBoundingClientRect();
      const rr = this.root.getBoundingClientRect();
      const k = cr.width / W || 1;
      const el = document.createElement(multiline ? 'textarea' : 'input');
      if (!multiline) el.type = 'text';
      el.className = 'hsr-bug-input';
      el.value = value || '';
      el.maxLength = multiline ? 4000 : 200;
      el.placeholder = multiline ? 'Что делали, что ожидали увидеть. Ctrl+Enter — готово' : 'Коротко: что пошло не так. Enter — готово';
      Object.assign(el.style, {
        left: Math.round(cr.left - rr.left + ROWS.x * k) + 'px',
        top: Math.round(cr.top - rr.top + rowY * k) + 'px',
        width: Math.round(ROWS.w * k) + 'px',
        height: Math.round((multiline ? 110 : ROWS.h) * k) + 'px',
        fontSize: Math.max(12, Math.round(12 * k)) + 'px'
      });
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        done(el.value.trim());
        el.remove();
        if (this.bugEdit === edit) this.bugEdit = null;
        this.held = [];
        if (this.root.focus) this.root.focus({ preventScroll: true });
      };
      const edit = { el, finish };
      el.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Escape' || (e.key === 'Enter' && (!multiline || e.ctrlKey))) {
          e.preventDefault();
          finish();
        }
      });
      el.addEventListener('keyup', e => e.stopPropagation());
      el.addEventListener('mousedown', e => e.stopPropagation());
      el.addEventListener('blur', finish);
      this.root.appendChild(el);
      this.bugEdit = edit;
      el.focus();
    },

    endBugEdit() {
      if (this.bugEdit) this.bugEdit.finish();
    },

    async bugPack(d) {
      const B = globalThis.BugReport;
      const info = d.info;
      const report = await B.build({
        source: 'hsr98',
        where: { summary: info.summary, window: inSystem() ? 'app_hsr98' : '', app: 'hsr98' },
        apps: { hsr98: Object.assign({}, info.details, { state: info.state }) }
      });
      report.user = { title: d.title.slice(0, 200), text: d.text.slice(0, 4000), kind: KINDS[d.kind][0], repeat: REPEATS[d.repeat][0], contact: '' };
      const files = {};
      if (globalThis.BugShot) {
        const enc = await globalThis.BugShot.encode({ canvas: d.shot, full: d.shot, scale: 1, method: 'canvas' }, {});
        Object.assign(files, enc.files);
        Object.assign(report.attach, enc.attach);
      } else {
        files['shot.png'] = await toBlob(d.shot);
        report.attach.shot = 'shot.png';
      }
      if (d.save) {
        const archive = { format: 'hsr98-bug-save', version: 1, components: ['game_hsr98'], data: { ls: hsrStorage(), idb: {} } };
        if (d.live) archive.live = { hsr98: d.live };
        const gz = await gzip(JSON.stringify(archive));
        if (gz && gz.size <= 1024 * 1024) {
          files['save.json.gz'] = gz;
          report.attach.save = 'save.json.gz';
          report.attach.saveComponent = 'game_hsr98';
          if (d.live) report.attach.live = ['hsr98'];
        } else report.attach.saveSkipped = gz ? 'too large: ' + gz.size : 'no gzip';
      }
      return { report, files };
    },

    bugRemember(d, report, status) {
      const list = readList().filter(r => r.id !== report.id);
      list.unshift({ id: report.id, at: report.created, title: report.user.title, where: report.where.summary, thumb: thumb(d.shot), status, seen: status });
      writeList(list);
    },

    async bugSend(d) {
      const B = globalThis.BugReport;
      if (!B) { d.status = 'Отправка отчётов здесь недоступна'; d.statusBad = true; this.sfx('deny'); return; }
      d.busy = true;
      d.status = 'Отправка отчёта…';
      d.statusBad = false;
      let pack = null;
      try {
        pack = await this.bugPack(d);
        let res;
        try {
          res = await B.send(pack.report, pack.files);
        } catch (err) {
          if (err.status !== 409) throw err;
          pack.report.id = B.newId();
          res = await B.send(pack.report, pack.files);
        }
        this.bugRemember(d, pack.report, res.local ? 'local' : 'received');
        d.done = { id: pack.report.id, local: res.local };
        this.sfx('anchor');
      } catch (err) {
        if (pack && B.shouldQueue(err)) {
          try {
            await B.queue(pack.report, pack.files);
            this.bugRemember(d, pack.report, 'queued');
            d.done = { id: pack.report.id, queued: true };
            return;
          } catch (queueErr) {}
        }
        d.statusBad = true;
        d.status = err.status === 429 ? 'Слишком много отчётов за час. Сохраните отчёт в файл.' : err.status === 413 ? 'Отчёт слишком большой. Выключите «Приложить состояние игры».' : 'Сервер отказал: ' + err.message + '. Сохраните отчёт в файл.';
        this.sfx('deny');
      } finally {
        d.busy = false;
      }
    },

    async bugToFile(d) {
      const B = globalThis.BugReport;
      if (!B) { this.sfx('deny'); return; }
      d.busy = true;
      d.status = 'Подготовка файла…';
      d.statusBad = false;
      try {
        if (!d.title) d.title = 'Без названия';
        const pack = await this.bugPack(d);
        const text = JSON.stringify(await B.pack(pack.report, pack.files));
        const name = pack.report.id + '.bugreport.json';
        this.bugRemember(d, pack.report, 'file');
        this.bugFileName = name;
        const android = globalThis.Sr98Android;
        if (android && android.saveFile) android.saveFile(name, text);
        else {
          const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 15000);
          this.fileSaved(true);
        }
        d.status = 'Файл: ' + name;
      } catch (err) {
        d.status = 'Файл не записан: ' + err.message;
        d.statusBad = true;
      } finally {
        d.busy = false;
      }
    },

    async bugRefreshStatuses(force) {
      const B = globalThis.BugReport;
      const list = readList();
      const last = Number(lsGet(checkedKey(), 0)) || 0;
      const remote = list.filter(r => !OFFLINE.includes(r.status));
      if (!B || !remote.length || (!force && Date.now() - last < 10 * 60 * 1000)) return { ok: true, at: last };
      try {
        const items = await B.statuses(remote.map(r => r.id));
        const fresh = readList();
        fresh.forEach(r => {
          const s = items[r.id];
          if (!s) return;
          r.status = s.status === 'new' ? 'received' : s.status;
          r.fixedIn = s.fixedIn || '';
          r.note = s.note || '';
        });
        writeList(fresh);
        lsSet(checkedKey(), Date.now());
        return { ok: true, at: Date.now() };
      } catch (err) {
        return { ok: false, at: last };
      }
    },

    openBugList() {
      const ui = this;
      const view = { line: 'Проверка статусов…' };
      const items = () => readList().map(r => ({ label: r.title || '(без названия)', right: statusText(r), rcol: r.status === 'fixed' ? C.ok : r.status !== r.seen ? C.gold : C.sub, col: r.status !== r.seen ? C.gold : null }));
      const markSeen = i => {
        const list = readList();
        const r = list[i];
        if (r && r.seen !== r.status) {
          r.seen = r.status;
          writeList(list);
        }
      };
      let screen = null;
      const refresh = force => ui.bugRefreshStatuses(force).then(res => {
        view.line = (res.ok ? 'Статусы' : 'Нет связи, статусы') + (res.at ? ' от ' + dateText(new Date(res.at).toISOString()) : ' ещё не проверялись');
        if (screen && ui.top() === screen) markSeen(screen.sel);
      });
      screen = this.push({
        bugList: true,
        pause: true,
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.7)';
          c.fillRect(0, 0, W, HGT);
          ui.win(BOX.x, BOX.y, BOX.w, BOX.h, { title: 'Мои отчёты об ошибках' });
          ui.closeBtn(BOX.x + BOX.w - 30, BOX.y + 8, () => this.key('back'));
          const list = readList();
          if (!list.length) {
            ui.text('Отчётов пока нет.', W / 2, 160, { align: 'center', size: 13, col: C.cream });
            ui.text('Нажмите F9 там, где заметили ошибку.', W / 2, 182, { align: 'center', size: 11, col: C.sub });
          } else {
            ui.list(78, 74, 484, items(), this.sel, { rowH: 22, max: 9, scroll: this.scroll || (this.scroll = {}), onClick: i => { this.sel = i; markSeen(i); } });
            const r = list[Math.min(this.sel, list.length - 1)];
            if (r) {
              c.fillStyle = 'rgba(0,0,0,0.35)';
              c.fillRect(78, 280, 484, 112);
              ui.text(r.id + '  ·  ' + dateText(r.at), 88, 286, { size: 11, col: C.sub });
              ui.text(statusText(r), 552, 286, { align: 'right', size: 11, bold: true, col: r.status === 'fixed' ? C.ok : C.gold });
              ui.wrap(r.where || '', 460, 11).slice(0, 3).forEach((line, i) => ui.text(line, 88, 304 + i * 14, { size: 11, col: C.cream }));
              if (r.note) ui.wrap('Разработчик: ' + r.note, 460, 11).slice(0, 2).forEach((line, i) => ui.text(line, 88, 352 + i * 14, { size: 11, col: C.cyan }));
            }
          }
          ui.text(view.line, 78, 398, { size: 10, col: C.dim });
          ui.hints([['↑↓', 'Отчёт'], ['R', 'Обновить'], ['Esc', 'Назад']], W / 2, BOX.y + BOX.h - 18, { align: 'center' });
        },
        key(k, code) {
          const n = readList().length;
          if (ui.listNav(this, k, n)) { markSeen(this.sel); return; }
          if (code === 'KeyR') { view.line = 'Проверка статусов…'; refresh(true); return; }
          if (k === 'back' || k === 'ok') ui.pop();
        }
      });
      markSeen(0);
      refresh(false);
    }
  });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
