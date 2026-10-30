(() => {
  const ICON_WIDTH = 96;
  const ICON_HEIGHT = 60;
  const COLUMNS = 4;

  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  class Og2Launcher {
    constructor() {
      this.winId = 'og2_launcher';
      this.win = null;
      this.selected = 0;
    }

    open() {
      if (window.winManager.windows.has(this.winId)) {
        const existing = window.winManager.windows.get(this.winId);
        if (existing.isMinimized) window.winManager.restoreWindow(this.winId);
        else window.winManager.bringToTop(this.winId);
        return;
      }
      const games = window.Og2.games;
      const tiles = games.map((game, i) => `
        <button class="og2-tile" data-index="${i}">
          <canvas width="${ICON_WIDTH}" height="${ICON_HEIGHT}"></canvas>
          <span class="og2-tile-title">${escapeHtml(game.title)}</span>
          <span class="og2-tile-genre">${escapeHtml(game.genre)}</span>
          <span class="og2-tile-record"></span>
        </button>
      `).join('');
      this.win = window.winManager.createWindow({
        id: this.winId,
        title: 'Офисные игры 2',
        icon: 'game-manager',
        width: 524,
        height: 486,
        resizable: false,
        maximizable: false,
        onClose: () => this.dispose(),
        content: `
          <div class="og2-shell">
            <div class="og2-shell-banner">
              <div class="og2-shell-title">ОФИСНЫЕ ИГРЫ 2</div>
              <div class="og2-shell-sub">Восемь игр на перерыв. Шаги в коридоре — нажмите F12.</div>
            </div>
            <div class="og2-shell-grid">${tiles}</div>
            <div class="og2-shell-detail"></div>
            <div class="og2-shell-buttons">
              <button class="win-btn og2-run">Запустить</button>
              <button class="win-btn og2-quit">Закрыть</button>
            </div>
          </div>
        `
      });
      const body = this.win.body;
      this.tileEls = Array.from(body.querySelectorAll('.og2-tile'));
      this.detailEl = body.querySelector('.og2-shell-detail');
      this.runButton = body.querySelector('.og2-run');
      this.tileEls.forEach((el, i) => {
        el.addEventListener('click', () => this.select(i));
        el.addEventListener('dblclick', () => this.launch(i));
      });
      this.runButton.addEventListener('click', () => this.launch(this.selected));
      body.querySelector('.og2-quit').addEventListener('click', () => window.winManager.closeWindow(this.winId));
      this.stopKeys = this.listenNavigation();
      this.stopScores = window.Og2.subscribeScores(() => this.refresh());
      this.refresh();
      this.select(this.selected);
    }

    dispose() {
      if (this.stopKeys) this.stopKeys();
      if (this.stopScores) this.stopScores();
      this.stopKeys = null;
      this.stopScores = null;
      this.win = null;
    }

    listenNavigation() {
      const onKey = (e) => {
        if (window.winManager.activeWindowId !== this.winId) return;
        const count = window.Og2.games.length;
        const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLUMNS, ArrowDown: COLUMNS };
        if (moves[e.key] !== undefined) {
          e.preventDefault();
          const next = this.selected + moves[e.key];
          if (next >= 0 && next < count) this.select(next);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.launch(this.selected);
        }
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }

    refresh() {
      if (!this.win) return;
      window.Og2.games.forEach((game, i) => {
        const el = this.tileEls[i];
        const canvas = el.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        if (game.drawIcon) {
          game.drawIcon(ctx, ICON_WIDTH, ICON_HEIGHT);
        } else {
          this.drawPlaceholder(ctx);
        }
        const best = window.Og2.bestScore(game.id);
        const record = el.querySelector('.og2-tile-record');
        record.textContent = game.open ? (best ? 'Рекорд: ' + best : 'Рекорда нет') : 'Скоро на диске';
        el.classList.toggle('og2-tile-locked', !game.open);
      });
      this.renderDetail();
    }

    drawPlaceholder(ctx) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, ICON_WIDTH, ICON_HEIGHT);
      ctx.fillStyle = '#9a9a9a';
      for (let x = 0; x < ICON_WIDTH; x += 12) {
        for (let y = 0; y < ICON_HEIGHT; y += 12) {
          if (((x + y) / 12) % 2 === 0) ctx.fillRect(x, y, 12, 12);
        }
      }
    }

    select(index) {
      this.selected = index;
      this.tileEls.forEach((el, i) => el.classList.toggle('og2-tile-selected', i === index));
      this.renderDetail();
    }

    renderDetail() {
      if (!this.win) return;
      const game = window.Og2.games[this.selected];
      const best = window.Og2.bestScore(game.id);
      this.detailEl.innerHTML = `
        <div class="og2-detail-head">${escapeHtml(game.title)} <span>— ${escapeHtml(game.genre)}</span></div>
        <div class="og2-detail-text">${escapeHtml(game.blurb)}</div>
        <div class="og2-detail-keys"><b>Управление:</b> ${escapeHtml(game.controls)}</div>
        <div class="og2-detail-file">${escapeHtml(game.exe)}${game.open && best ? ' · рекорд ' + best : ''}</div>
      `;
      this.runButton.disabled = !game.open;
    }

    launch(index) {
      const game = window.Og2.games[index];
      if (game.open) window.Og2.openApp(game.appId);
    }
  }

  window.appOg2Launcher = new Og2Launcher();
})();
