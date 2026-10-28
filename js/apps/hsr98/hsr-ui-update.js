(function (H) {
  'use strict';
  const { W, HGT, C, lsGet, lsSet } = H.UI_CONST;

  const BASE = 'https://pennygachi.men/web98/update/sr98/';
  const KEY = 'sr98.update';
  const DAY = 24 * 3600 * 1000;
  const BOX = { x: 70, y: 46, w: 500, h: 388 };
  const bridge = () => (globalThis.Sr98Android && typeof globalThis.Sr98Android.checkUpdate === 'function' ? globalThis.Sr98Android : null);
  const saved = () => Object.assign({ checkedAt: 0, channel: 'stable', ran: '', latest: null }, lsGet(KEY, {}));
  const save = patch => lsSet(KEY, Object.assign(saved(), patch));
  const mb = n => (n / 1048576).toFixed(1).replace('.', ',') + ' МБ';
  const installedCode = () => {
    const b = bridge();
    try { return b && typeof b.versionCode === 'function' ? Number(b.versionCode()) || 0 : 0; } catch (err) { return 0; }
  };
  const cmp = (a, b) => {
    const pa = String(a || '').split('.').map(Number), pb = String(b || '').split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    return 0;
  };

  const u = { phase: 'idle', pointer: null, notes: null, error: '', done: 0, total: 0, taps: 0, tapAt: 0, auto: false };

  function newer(pointer) {
    if (!pointer || !pointer.apk) return false;
    const code = installedCode();
    return code ? pointer.apk.versionCode > code : cmp(pointer.version, H.BUILD_VERSION) > 0;
  }

  function whatsNew() {
    const versions = (u.notes && u.notes.versions) || [];
    const target = u.pointer ? u.pointer.version : '';
    const pending = versions.filter(v => cmp(v.version, H.BUILD_VERSION) > 0 && (!target || cmp(v.version, target) <= 0));
    const main = pending[0] || versions.find(v => v.version === H.BUILD_VERSION) || null;
    if (!main) return { lines: [], more: [] };
    const items = [];
    for (const s of main.sections || []) for (const i of s.items) items.push(i);
    if ((main.fixed || []).length) items.push('Исправлено ошибок из отчётов игроков: ' + main.fixed.length);
    return { title: main.title, summary: main.summary, lines: items.slice(0, 5), more: pending.slice(1).map(v => v.version) };
  }

  const baseTitleItems = H.UI.prototype.titleItems;

  Object.assign(H.UI.prototype, {
    titleItems() {
      const items = baseTitleItems.call(this);
      if (!bridge()) return items;
      this.updateOnTitle();
      const st = saved();
      const latest = st.latest && newer(st.latest) ? st.latest : null;
      let note = 'Версия ' + H.BUILD_VERSION + ' · проверить обновления';
      if (latest) note = 'Новая версия ' + latest.version + ' · ' + mb(latest.apk.bytes);
      else if (u.phase === 'offline') note = 'Версия ' + H.BUILD_VERSION + ' · нет связи';
      else if (st.checkedAt) note = 'Версия ' + H.BUILD_VERSION + ' · последняя';
      items.push({ label: 'Обновления', icon: 'update', note, noteCol: latest ? C.gold : null, badge: latest ? 'NEW' : '', fn: () => this.openUpdate() });
      return items;
    },

    updateOnTitle() {
      if (this.updateBooted) return;
      this.updateBooted = true;
      const st = saved();
      if (st.ran && st.ran !== H.BUILD_VERSION) this.toast('Обновлено до ' + H.BUILD_VERSION);
      if (st.ran !== H.BUILD_VERSION) save({ ran: H.BUILD_VERSION, latest: null });
      if (Date.now() - st.checkedAt > DAY) {
        u.auto = true;
        this.updateCheck();
      }
    },

    updateCheck() {
      const b = bridge();
      if (!b) return;
      u.phase = 'check';
      u.error = '';
      b.checkUpdate(saved().channel);
    },

    updateInfo(text) {
      let data = null;
      try { data = JSON.parse(text); } catch (err) {}
      if (!data || !data.pointer || data.pointer.product !== 'sr98' || !data.pointer.apk) {
        u.phase = 'error';
        u.error = 'Сервер ответил непонятно';
        return;
      }
      u.pointer = data.pointer;
      u.notes = data.notes;
      save({ checkedAt: Date.now(), latest: data.pointer });
      if (u.phase === 'cancelled' || u.phase === 'ready') return;
      u.phase = newer(data.pointer) ? 'available' : 'latest';
      if (u.auto && u.phase === 'available') this.sfx('anchor');
      u.auto = false;
    },

    updateError(code, message) {
      u.auto = false;
      u.phase = code === 'corrupt' ? 'corrupt' : code === 'space' ? 'space' : code === 'offline' ? 'offline' : 'error';
      u.error = message || '';
    },

    updateProgress(done, total) {
      u.phase = 'download';
      u.done = Number(done) || 0;
      u.total = Number(total) || u.total;
    },

    updateReady() {
      u.phase = 'ready';
      this.updateInstall();
    },

    updateInstall() {
      const b = bridge();
      if (b) b.installUpdate();
    },

    updateNeedsPermission() {
      u.phase = 'permission';
    },

    updatePermissionBack(allowed) {
      if (u.phase !== 'permission') return;
      if (allowed) { u.phase = 'ready'; this.updateInstall(); }
    },

    updateWaiting() {
      u.phase = 'waiting';
    },

    updateResult(status) {
      const n = Number(status);
      if (n === 0) { u.phase = 'waiting'; return; }
      u.phase = n === 3 ? 'cancelled' : 'error';
      if (n !== 3) u.error = 'Android не установил обновление (код ' + n + ')';
    },

    updateDownload() {
      const b = bridge();
      const apk = u.pointer && u.pointer.apk;
      if (!b || !apk) return;
      u.phase = 'download';
      u.done = 0;
      u.total = apk.bytes;
      b.downloadUpdate(new URL(apk.url, BASE).href, apk.sha256, String(apk.bytes));
    },

    openUpdate() {
      const ui = this;
      if (u.phase === 'idle' || u.phase === 'offline' || u.phase === 'error' || u.phase === 'latest') {
        const st = saved();
        if (st.latest && !u.pointer) { u.pointer = st.latest; }
        this.updateCheck();
      }
      const items = () => {
        const back = { label: 'Назад', fn: () => { if (u.phase === 'download') return; ui.pop(); } };
        if (u.phase === 'check') return [back];
        if (u.phase === 'latest') return [{ label: 'Проверить снова', fn: () => ui.updateCheck() }, back];
        if (u.phase === 'available') return [{ label: 'Скачать и установить', col: C.gold, fn: () => ui.updateDownload() }, back];
        if (u.phase === 'download') return [{ label: 'Отмена', fn: () => { const b = bridge(); if (b) b.cancelUpdate(); u.phase = 'available'; } }];
        if (u.phase === 'permission') return [{ label: 'Открыть настройки', col: C.gold, fn: () => { const b = bridge(); if (b) b.openInstallSettings(); } }, back];
        if (u.phase === 'cancelled') return [{ label: 'Установить', col: C.gold, fn: () => ui.updateInstall() }, back];
        if (u.phase === 'corrupt') return [{ label: 'Скачать заново', col: C.gold, fn: () => ui.updateDownload() }, back];
        if (u.phase === 'waiting' || u.phase === 'ready') return [back];
        return [{ label: 'Повторить', col: C.gold, fn: () => ui.updateCheck() }, back];
      };
      this.push({
        updateScreen: true,
        pause: true,
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.72)';
          c.fillRect(0, 0, W, HGT);
          ui.win(BOX.x, BOX.y, BOX.w, BOX.h, { title: 'Обновления' });
          const vtext = 'v' + H.BUILD_VERSION + ' · APK' + (saved().channel === 'test' ? ' · test' : '');
          ui.text(vtext, BOX.x + BOX.w - 16, BOX.y + 8, { align: 'right', size: 10, col: C.dim });
          ui.hit(BOX.x + BOX.w - 120, BOX.y, 110, 26, () => ui.updateTap());
          let y = BOX.y + 40;
          const head = (text, right, col) => {
            ui.diamond(BOX.x + 26, y + 7, 5, col || C.brassHi, '#1a1208');
            ui.text(text, BOX.x + 40, y, { size: 14, bold: true, col: col || C.cream });
            if (right) ui.text(right, BOX.x + BOX.w - 20, y + 2, { align: 'right', size: 12, col: C.gold });
            y += 26;
          };
          const line = (text, col, size) => {
            for (const l of ui.wrap(text, BOX.w - 60, size || 11)) { ui.text(l, BOX.x + 30, y, { size: size || 11, col: col || C.sub }); y += (size || 11) + 4; }
          };
          const apk = u.pointer && u.pointer.apk;
          const news = whatsNew();
          if (u.phase === 'check') head('Связываемся со станцией...');
          else if (u.phase === 'latest') head('У вас последняя версия ' + H.BUILD_VERSION);
          else if (u.phase === 'offline') { head('Станция связи молчит', null, C.bad); line('Нет связи с сервером обновлений. Играть можно и без неё.'); }
          else if (u.phase === 'error') { head('Не получилось', null, C.bad); line(u.error || 'Неизвестная ошибка.'); }
          else if (u.phase === 'corrupt') { head('Файл пришёл повреждённым', null, C.bad); line('Скачайте его заново.'); }
          else if (u.phase === 'space') { head('Не хватает места', null, C.bad); line('Нужно ещё ' + mb(Number(u.error) || 0) + ' свободного места.'); }
          else if (u.phase === 'permission') { head('Нужно разрешение'); line('Разрешите Star Rail 98 устанавливать приложения. Откроются настройки Android: включите переключатель и вернитесь в игру.', C.cream); }
          else if (u.phase === 'waiting' || u.phase === 'ready') { head('Ждём Android'); line('Нажмите «Обновить» в окне Android. После установки игра закроется, откройте её снова.', C.cream); line('Если Android предупредит о неизвестном приложении, нажмите «Всё равно установить».'); }
          else if (u.phase === 'cancelled') { head('Установка отменена'); line('Файл уже скачан, ставить можно без новой загрузки.'); }
          else if (apk) head('Доступна версия ' + u.pointer.version, mb(apk.bytes));
          if (u.phase === 'download' && apk) {
            ui.bar(BOX.x + 30, y + 4, BOX.w - 60, 14, u.total ? u.done / u.total : 0, C.gold);
            y += 24;
            line(mb(u.done) + ' из ' + mb(u.total || apk.bytes), C.cream);
          }
          if (['available', 'latest', 'download', 'cancelled', 'waiting', 'ready'].includes(u.phase) && (news.summary || news.lines.length)) {
            c.fillStyle = 'rgba(242,220,154,0.35)';
            c.fillRect(BOX.x + 24, y + 2, BOX.w - 48, 1);
            y += 10;
            ui.text('Что нового', BOX.x + 30, y, { size: 12, bold: true, col: C.gold });
            y += 18;
            if (news.summary) line(news.summary, C.cream);
            for (const l of news.lines) line('· ' + l);
            if (news.more.length) line('И ещё ' + news.more.length + ' ' + (news.more.length === 1 ? 'версия' : news.more.length < 5 ? 'версии' : 'версий') + ': ' + news.more.join(', '), C.dim);
          }
          const list = items();
          if (this.sel >= list.length) this.sel = 0;
          ui.list(BOX.x + 30, BOX.y + BOX.h - 40 - list.length * 24, BOX.w - 60, list, this.sel, { rowH: 24, onClick: i => { this.sel = i; this.key('ok'); } });
          ui.text(u.phase === 'available' ? 'Сохранения останутся. Android попросит подтвердить установку.' : '', BOX.x + BOX.w / 2, BOX.y + BOX.h - 22, { align: 'center', size: 10, col: C.dim });
        },
        key(k) {
          const list = items();
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'back') { if (u.phase !== 'download') ui.pop(); return; }
          if (k === 'ok' && list[this.sel]) list[this.sel].fn();
        }
      });
    },

    updateTap() {
      const now = Date.now();
      u.taps = now - u.tapAt < 1500 ? u.taps + 1 : 1;
      u.tapAt = now;
      if (u.taps < 5) return;
      u.taps = 0;
      const channel = saved().channel === 'test' ? 'stable' : 'test';
      save({ channel, latest: null, checkedAt: 0 });
      this.toast('Канал обновлений: ' + channel);
      this.updateCheck();
    }
  });
})(globalThis.Hsr98);
