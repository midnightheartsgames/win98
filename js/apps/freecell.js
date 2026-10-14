class AppFreeCell {
  constructor() {
    this.currentGameNumber = 11988;
    this.suits = ['clubs', 'diamonds', 'hearts', 'spades'];
    this.suitSymbols = { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' };
    this.suitColors = { clubs: 'black', diamonds: 'red', hearts: 'red', spades: 'black' };
    this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    this.freeCells = [null, null, null, null];
    this.foundations = [[], [], [], []];
    this.cascades = [[], [], [], [], [], [], [], []];
    this.selectedCard = null;
    this.movesCount = 0;
    this.isWon = false;
    this.history = [];
    this.kingMood = 'left';
    this.win = null;
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  generateDeck(gameNum) {
    let state = gameNum;
    const rand = () => {
      state = (Math.imul(state, 214013) + 2531011) & 0x7fffffff;
      return (state >> 16) & 0x7fff;
    };
    const cards = [];
    for (let i = 0; i < 52; i++) {
      const suitIdx = i % 4;
      const rankIdx = Math.floor(i / 4);
      cards.push({
        id: i,
        suit: this.suits[suitIdx],
        rank: this.ranks[rankIdx],
        rankVal: rankIdx + 1,
        color: this.suitColors[this.suits[suitIdx]],
        symbol: this.suitSymbols[this.suits[suitIdx]]
      });
    }
    const deck = [...cards];
    let remaining = 52;
    const shuffled = [];
    for (let i = 0; i < 52; i++) {
      const j = rand() % remaining;
      shuffled.push(deck[j]);
      deck[j] = deck[remaining - 1];
      remaining--;
    }
    return shuffled;
  }

  startNewGame(gameNum = null) {
    if (gameNum === null) this.currentGameNumber = Math.floor(Math.random() * 32000) + 1;
    else this.currentGameNumber = Math.max(1, Math.min(32000, parseInt(gameNum, 10) || 1));
    this.freeCells = [null, null, null, null];
    this.foundations = [[], [], [], []];
    this.cascades = [[], [], [], [], [], [], [], []];
    this.selectedCard = null;
    this.movesCount = 0;
    this.isWon = false;
    this.history = [];
    this.kingMood = 'left';
    this.generateDeck(this.currentGameNumber).forEach((card, idx) => this.cascades[idx % 8].push(card));
    if (window.soundSys && typeof window.soundSys.playCardFlip === 'function') window.soundSys.playCardFlip();
  }

  open(gameNum = null) {
    const winId = 'app_freecell';
    if (window.winManager.windows.has(winId)) {
      window.winManager.createWindow({ id: winId });
      return;
    }
    const t = (k, ...a) => this.t(k, ...a);
    this.startNewGame(gameNum || Math.floor(Math.random() * 32000) + 1);
    const content = document.createElement('div');
    content.className = 'freecell-window';
    content.innerHTML = `
      <div class="win-menubar fc-menubar">
        <div class="win-menu-item">${t('fc.menuGame')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="new">${t('fc.menuNew')} <span>F2</span></div>
            <div class="win-dropdown-option" data-cmd="select">${t('fc.menuSelect')} <span>F3</span></div>
            <div class="win-dropdown-option" data-cmd="restart">${t('fc.menuRestart')}</div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option" data-cmd="stats">${t('fc.menuStats')} <span>F4</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option fc-opt-undo" data-cmd="undo">${t('fc.menuUndo')} <span>F10</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option" data-cmd="exit">${t('fc.menuExit')}</div>
          </div>
        </div>
        <div class="win-menu-item">${t('fc.menuHelp')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="help">${t('fc.menuHelpTopics')} <span>F1</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option" data-cmd="about">${t('fc.menuAbout')}</div>
          </div>
        </div>
        <div class="fc-cards-left"></div>
      </div>
      <div class="freecell-board" id="fc-board">
        <div class="fc-top">
          <div class="fc-cells" id="fc-freecells">${[0, 1, 2, 3].map(i => `<div class="freecell-slot" data-type="free" data-idx="${i}"></div>`).join('')}</div>
          <div class="fc-king"><canvas width="32" height="32"></canvas></div>
          <div class="fc-cells" id="fc-foundations">${[0, 1, 2, 3].map(i => `<div class="freecell-slot foundation" data-type="foundation" data-idx="${i}"></div>`).join('')}</div>
        </div>
        <div class="freecell-cascades-row" id="fc-cascades">${[0, 1, 2, 3, 4, 5, 6, 7].map(c => `<div class="freecell-cascade" data-col="${c}"></div>`).join('')}</div>
      </div>
    `;
    const win = window.winManager.createWindow({
      id: winId,
      title: this.titleText(),
      icon: 'freecell',
      width: 640,
      height: 470,
      minWidth: 400,
      minHeight: 300,
      content
    });
    this.win = win;
    this.attachEvents(win);
    this.renderBoard(win);
  }

  titleText() {
    return this.t('fc.windowTitle', this.currentGameNumber);
  }

  attachEvents(win) {
    const el = win.element;
    el.querySelectorAll('.fc-menubar [data-cmd]').forEach(opt => opt.addEventListener('click', () => this.command(opt.dataset.cmd)));
    const board = el.querySelector('#fc-board');
    board.addEventListener('click', (e) => this.handleBoardClick(e, win));
    board.addEventListener('dblclick', (e) => this.handleDblClick(e, win));
    board.addEventListener('mousemove', (e) => {
      if (this.isWon) return;
      const rect = board.getBoundingClientRect();
      const mood = e.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
      if (mood !== this.kingMood) {
        this.kingMood = mood;
        this.drawKing();
      }
    });
    const onKey = (e) => {
      if (window.winManager.activeWindowId !== 'app_freecell') return;
      const map = { F2: 'new', F3: 'select', F4: 'stats', F10: 'undo' };
      if (map[e.key]) {
        e.preventDefault();
        this.command(map[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    win.onClose = () => {
      window.removeEventListener('keydown', onKey);
      if (!this.isWon && this.movesCount > 0) this.recordResult(false);
      this.win = null;
    };
  }

  command(cmd) {
    const win = this.win;
    if (cmd === 'new') {
      if (!this.isWon && this.movesCount > 0) this.recordResult(false);
      this.startNewGame();
      this.renderBoard(win);
    } else if (cmd === 'select') this.showSelectGameModal(win);
    else if (cmd === 'restart') {
      this.startNewGame(this.currentGameNumber);
      this.renderBoard(win);
    } else if (cmd === 'stats') this.showStats();
    else if (cmd === 'undo') this.undo();
    else if (cmd === 'exit') window.winManager.closeWindow('app_freecell');
    else if (cmd === 'help') {
      if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp();
    } else if (cmd === 'about') {
      window.winManager.openDialog({ title: this.t('fc.aboutTitle'), icon: 'freecell', message: this.t('fc.aboutText') });
    }
  }

  showSelectGameModal(win) {
    const id = 'app_fc_select';
    if (window.winManager.windows.has(id)) return;
    const dlg = window.winManager.createWindow({
      id,
      title: this.t('fc.selectTitle'),
      icon: 'freecell',
      width: 260,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="fc-dlg">
          <div class="fc-dlg-row"><label>${this.t('fc.selectPrompt')}</label><input type="text" class="fc-game-num" value="${Math.floor(Math.random() * 32000) + 1}"></div>
          <div class="fc-dlg-buttons"><button class="win-btn is-default fc-sel-ok">${this.t('btn.ok')}</button><button class="win-btn fc-sel-cancel">${this.t('btn.cancel')}</button></div>
        </div>`
    });
    const input = dlg.element.querySelector('.fc-game-num');
    const ok = () => {
      const num = parseInt(input.value, 10);
      window.winManager.closeWindow(id);
      if (!(num >= 1 && num <= 32000)) return;
      if (!this.isWon && this.movesCount > 0) this.recordResult(false);
      this.startNewGame(num);
      this.renderBoard(win);
    };
    dlg.element.querySelector('.fc-sel-ok').addEventListener('click', ok);
    dlg.element.querySelector('.fc-sel-cancel').addEventListener('click', () => window.winManager.closeWindow(id));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') window.winManager.closeWindow(id); });
    setTimeout(() => input.select(), 0);
  }

  loadStats() {
    try {
      const raw = localStorage.getItem('win98_freecell_stats');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { won: 0, lost: 0, streak: 0, streakType: 'won', bestWin: 0, bestLoss: 0 };
  }

  recordResult(won) {
    const s = this.loadStats();
    if (won) s.won++;
    else s.lost++;
    const type = won ? 'won' : 'lost';
    s.streak = s.streakType === type ? s.streak + 1 : 1;
    s.streakType = type;
    if (won) s.bestWin = Math.max(s.bestWin, s.streak);
    else s.bestLoss = Math.max(s.bestLoss, s.streak);
    try {
      localStorage.setItem('win98_freecell_stats', JSON.stringify(s));
    } catch (e) {}
  }

  showStats() {
    const id = 'app_fc_stats';
    if (window.winManager.windows.has(id)) return;
    const s = this.loadStats();
    const total = s.won + s.lost;
    const pct = total ? Math.round(s.won * 100 / total) : 0;
    const dlg = window.winManager.createWindow({
      id,
      title: this.t('fc.statsTitle'),
      icon: 'freecell',
      width: 290,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="fc-dlg">
          <fieldset class="fc-dlg-group"><legend>${this.t('fc.statsSession')}</legend>
            <div class="fc-stats-grid">
              <span>${this.t('fc.statsWon')}</span><span>${s.won}</span><span>${pct}%</span>
              <span>${this.t('fc.statsLost')}</span><span>${s.lost}</span><span></span>
            </div>
          </fieldset>
          <fieldset class="fc-dlg-group"><legend>${this.t('fc.statsStreaks')}</legend>
            <div class="fc-stats-grid">
              <span>${this.t('fc.statsWins')}</span><span>${s.bestWin}</span><span></span>
              <span>${this.t('fc.statsLosses')}</span><span>${s.bestLoss}</span><span></span>
              <span>${this.t('fc.statsCurrent')}</span><span>${s.streak} ${this.t(s.streakType === 'won' ? 'fc.statsWinShort' : 'fc.statsLossShort')}</span><span></span>
            </div>
          </fieldset>
          <div class="fc-dlg-buttons"><button class="win-btn is-default fc-st-ok">${this.t('btn.ok')}</button><button class="win-btn fc-st-clear">${this.t('fc.statsClear')}</button></div>
        </div>`
    });
    dlg.element.querySelector('.fc-st-ok').addEventListener('click', () => window.winManager.closeWindow(id));
    dlg.element.querySelector('.fc-st-clear').addEventListener('click', () => {
      try { localStorage.removeItem('win98_freecell_stats'); } catch (e) {}
      window.winManager.closeWindow(id);
      this.showStats();
    });
  }

  snapshot() {
    return {
      freeCells: this.freeCells.slice(),
      foundations: this.foundations.map(p => p.slice()),
      cascades: this.cascades.map(p => p.slice()),
      movesCount: this.movesCount
    };
  }

  undo() {
    const s = this.history.pop();
    if (!s || this.isWon) return;
    this.freeCells = s.freeCells;
    this.foundations = s.foundations;
    this.cascades = s.cascades;
    this.movesCount = s.movesCount;
    this.selectedCard = null;
    this.renderBoard(this.win);
  }

  maxMovable(toEmptyColumn) {
    const free = this.freeCells.filter(c => c === null).length;
    const empty = this.cascades.filter(c => c.length === 0).length - (toEmptyColumn ? 1 : 0);
    return (free + 1) * Math.pow(2, Math.max(0, empty));
  }

  runLength(col) {
    const cards = this.cascades[col];
    let n = cards.length ? 1 : 0;
    for (let i = cards.length - 1; i > 0; i--) {
      const a = cards[i];
      const b = cards[i - 1];
      if (b.color !== a.color && b.rankVal === a.rankVal + 1) n++;
      else break;
    }
    return n;
  }

  handleBoardClick(e, win) {
    if (this.isWon) return;
    const cardEl = e.target.closest('.freecell-card');
    const slotEl = e.target.closest('.freecell-slot');
    const cascadeEl = e.target.closest('.freecell-cascade');
    if (this.selectedCard) {
      const sel = this.selectedCard;
      let done = false;
      if (slotEl && slotEl.dataset.type === 'free' || cardEl && cardEl.dataset.type === 'free') {
        const idx = parseInt((slotEl || cardEl).dataset.idx, 10);
        if (this.freeCells[idx] === null) done = this.moveTo({ type: 'free', idx });
      } else if (slotEl && slotEl.dataset.type === 'foundation' || cardEl && cardEl.dataset.type === 'foundation') {
        const fIdx = parseInt((slotEl || cardEl).dataset.idx, 10);
        if (this.canPlaceOnFoundation(sel.card, fIdx)) done = this.moveTo({ type: 'foundation', idx: fIdx });
      } else if (cascadeEl) {
        const col = parseInt(cascadeEl.dataset.col, 10);
        if (!(sel.source === 'cascade' && sel.colIndex === col)) {
          this.moveToCascade(col);
          return;
        }
      }
      if (!done) this.selectedCard = null;
      this.renderBoard(win);
      return;
    }
    if (cardEl) {
      if (cardEl.dataset.type === 'free') {
        const idx = parseInt(cardEl.dataset.idx, 10);
        if (this.freeCells[idx]) this.selectedCard = { source: 'freecell', freeIdx: idx, card: this.freeCells[idx] };
      } else if (cardEl.dataset.type === 'cascade') {
        const col = parseInt(cardEl.dataset.col, 10);
        const colCards = this.cascades[col];
        this.selectedCard = { source: 'cascade', colIndex: col, cardIndex: colCards.length - 1, card: colCards[colCards.length - 1] };
      }
    }
    this.renderBoard(win);
  }

  handleDblClick(e, win) {
    const cardEl = e.target.closest('.freecell-card');
    if (!cardEl || cardEl.dataset.type !== 'cascade' || this.isWon) return;
    const col = parseInt(cardEl.dataset.col, 10);
    const colCards = this.cascades[col];
    if (!colCards.length) return;
    const free = this.freeCells.indexOf(null);
    if (free < 0) return;
    this.selectedCard = { source: 'cascade', colIndex: col, cardIndex: colCards.length - 1, card: colCards[colCards.length - 1] };
    this.moveTo({ type: 'free', idx: free });
    this.renderBoard(win);
  }

  takeSelected() {
    const sel = this.selectedCard;
    if (sel.source === 'cascade') return this.cascades[sel.colIndex].pop();
    const card = this.freeCells[sel.freeIdx];
    this.freeCells[sel.freeIdx] = null;
    return card;
  }

  moveTo(dest) {
    this.history.push(this.snapshot());
    const card = this.takeSelected();
    if (dest.type === 'free') this.freeCells[dest.idx] = card;
    else if (dest.type === 'foundation') this.foundations[dest.idx].push(card);
    this.afterMove();
    return true;
  }

  moveToCascade(col) {
    const sel = this.selectedCard;
    const target = this.cascades[col];
    if (sel.source === 'freecell') {
      if (this.canPlaceOnCascade(sel.card, col)) {
        this.history.push(this.snapshot());
        target.push(this.takeSelected());
        this.afterMove();
      } else {
        this.illegal();
      }
      return;
    }
    const src = this.cascades[sel.colIndex];
    const run = this.runLength(sel.colIndex);
    if (!target.length) {
      const max = Math.min(run, this.maxMovable(true));
      if (max <= 1) {
        this.history.push(this.snapshot());
        target.push(src.pop());
        this.afterMove();
        return;
      }
      window.winManager.openDialog({
        title: this.t('fc.title'),
        icon: 'question',
        message: this.t('fc.moveColumnAsk'),
        buttons: [
          { text: this.t('fc.moveColumn'), primary: true, onClick: () => this.moveRun(sel.colIndex, col, max) },
          { text: this.t('fc.moveSingle'), onClick: () => this.moveRun(sel.colIndex, col, 1) }
        ]
      });
      return;
    }
    const top = target[target.length - 1];
    for (let n = 1; n <= run; n++) {
      const card = src[src.length - n];
      if (card.color !== top.color && card.rankVal === top.rankVal - 1) {
        if (n > this.maxMovable(false)) {
          this.selectedCard = null;
          this.renderBoard(this.win);
          window.winManager.openDialog({ title: this.t('fc.title'), icon: 'info', message: this.t('fc.tooMany', n, this.maxMovable(false)) });
          return;
        }
        this.moveRun(sel.colIndex, col, n);
        return;
      }
    }
    this.illegal();
  }

  moveRun(from, to, n) {
    this.history.push(this.snapshot());
    const cards = this.cascades[from].splice(this.cascades[from].length - n, n);
    this.cascades[to].push(...cards);
    this.afterMove();
  }

  illegal() {
    this.selectedCard = null;
    this.renderBoard(this.win);
    window.winManager.openDialog({ title: this.t('fc.title'), icon: 'info', message: this.t('fc.illegal') });
  }

  afterMove() {
    this.selectedCard = null;
    this.movesCount++;
    if (window.soundSys && window.soundSys.playCardPlace) window.soundSys.playCardPlace();
    this.checkAutoMoves();
    this.renderBoard(this.win);
    this.checkWin(this.win);
  }

  canPlaceOnFoundation(card, fIdx) {
    const pile = this.foundations[fIdx];
    if (pile.length === 0) return card.rankVal === 1;
    const top = pile[pile.length - 1];
    return top.suit === card.suit && card.rankVal === top.rankVal + 1;
  }

  canPlaceOnCascade(card, colIdx) {
    const col = this.cascades[colIdx];
    if (col.length === 0) return true;
    const top = col[col.length - 1];
    return top.color !== card.color && card.rankVal === top.rankVal - 1;
  }

  isSafeHome(card) {
    if (card.rankVal <= 2) return true;
    const opposite = this.foundations.filter(p => p.length && p[0].color !== card.color).map(p => p.length);
    const oppositeHome = this.foundations.filter(p => p.length && p[0].color !== card.color).length;
    return oppositeHome === 2 && opposite.every(n => n >= card.rankVal - 1);
  }

  homeIndexFor(card) {
    for (let f = 0; f < 4; f++) if (this.canPlaceOnFoundation(card, f)) return f;
    return -1;
  }

  checkAutoMoves() {
    let moved = true;
    while (moved) {
      moved = false;
      for (let i = 0; i < 4; i++) {
        const card = this.freeCells[i];
        const f = card ? this.homeIndexFor(card) : -1;
        if (f >= 0 && this.isSafeHome(card)) {
          this.foundations[f].push(card);
          this.freeCells[i] = null;
          moved = true;
        }
      }
      for (let c = 0; c < 8; c++) {
        const col = this.cascades[c];
        const card = col[col.length - 1];
        const f = card ? this.homeIndexFor(card) : -1;
        if (f >= 0 && this.isSafeHome(card)) {
          this.foundations[f].push(col.pop());
          moved = true;
        }
      }
    }
  }

  checkWin(win) {
    const home = this.foundations.reduce((acc, pile) => acc + pile.length, 0);
    if (home !== 52 || this.isWon) return;
    this.isWon = true;
    this.kingMood = 'smile';
    this.drawKing();
    this.recordResult(true);
    if (window.soundSys && window.soundSys.playSolitaireWin) window.soundSys.playSolitaireWin();
    setTimeout(() => {
      window.winManager.openDialog({
        title: this.t('fc.winTitle'),
        icon: 'freecell',
        message: this.t('fc.winText'),
        buttons: [
          { text: 'Yes', primary: true, onClick: () => { this.startNewGame(); this.renderBoard(this.win); } },
          { text: 'No' }
        ]
      });
    }, 400);
  }

  drawKing() {
    if (!this.win) return;
    const canvas = this.win.element.querySelector('.fc-king canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 32, 32);
    ctx.save();
    if (this.kingMood === 'right') {
      ctx.translate(32, 0);
      ctx.scale(-1, 1);
    }
    const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    r(8, 3, 16, 7, '#000000');
    r(9, 4, 14, 5, '#ffff00');
    [9, 14, 19].forEach(x => { r(x, 0, 4, 4, '#000000'); r(x + 1, 1, 2, 3, '#ffff00'); });
    r(11, 6, 2, 2, '#ff0000');
    r(16, 6, 2, 2, '#0000ff');
    r(8, 10, 16, 12, '#000000');
    r(9, 10, 14, 11, '#ffffff');
    r(9, 10, 14, 2, '#ffff00');
    r(10, 13, 3, 2, '#000000');
    r(16, 13, 3, 2, '#000000');
    if (this.kingMood === 'smile') {
      r(10, 13, 3, 1, '#ffffff');
      r(16, 13, 3, 1, '#ffffff');
    } else {
      r(10, 13, 1, 2, '#0000ff');
      r(16, 13, 1, 2, '#0000ff');
    }
    r(13, 15, 2, 3, '#ff8040');
    r(9, 18, 14, 5, '#ffff00');
    r(8, 18, 1, 5, '#000000');
    r(23, 18, 1, 5, '#000000');
    if (this.kingMood === 'smile') {
      r(11, 18, 1, 1, '#000000');
      r(12, 19, 8, 1, '#000000');
      r(20, 18, 1, 1, '#000000');
    } else {
      r(12, 19, 8, 1, '#000000');
    }
    r(10, 23, 12, 1, '#000000');
    r(3, 24, 26, 8, '#000000');
    r(4, 25, 11, 7, '#ff0000');
    r(17, 25, 11, 7, '#0000ff');
    r(15, 24, 2, 8, '#ffff00');
    ctx.restore();
  }

  renderBoard(win) {
    if (!win || !win.element) return;
    const el = win.element;
    el.querySelectorAll('#fc-freecells .freecell-slot').forEach((slot, i) => {
      slot.innerHTML = '';
      if (this.freeCells[i]) slot.appendChild(this.createCardElement(this.freeCells[i], 'free', i));
    });
    el.querySelectorAll('#fc-foundations .freecell-slot').forEach((slot, i) => {
      slot.innerHTML = '';
      const pile = this.foundations[i];
      if (pile.length) slot.appendChild(this.createCardElement(pile[pile.length - 1], 'foundation', i));
    });
    const row = el.querySelector('#fc-cascades');
    const available = Math.max(200, row.clientHeight || 300);
    el.querySelectorAll('.freecell-cascade').forEach((colEl, c) => {
      colEl.innerHTML = '';
      const cards = this.cascades[c];
      const step = cards.length > 1 ? Math.max(6, Math.min(18, Math.floor((available - 96) / (cards.length - 1)))) : 18;
      cards.forEach((card, idx) => {
        const cardEl = this.createCardElement(card, 'cascade', idx, c);
        cardEl.style.top = `${idx * step}px`;
        cardEl.style.zIndex = idx + 1;
        colEl.appendChild(cardEl);
      });
    });
    const left = 52 - this.foundations.reduce((n, p) => n + p.length, 0);
    el.querySelector('.fc-cards-left').textContent = this.t('fc.cardsLeft', left);
    const undo = el.querySelector('.fc-opt-undo');
    if (undo) undo.classList.toggle('disabled', !this.history.length);
    window.winManager.setTitle(win.id, this.titleText());
    this.drawKing();
  }

  createCardElement(card, type, idx, col = null) {
    const el = document.createElement('div');
    el.className = `freecell-card ${card.color}`;
    el.dataset.type = type;
    el.dataset.idx = idx;
    if (col !== null) el.dataset.col = col;
    if (window.CardArt) el.style.backgroundImage = `url(${CardArt.face(card.rank, card.suit)})`;
    if (this.selectedCard && this.selectedCard.card.id === card.id) el.classList.add('selected');
    return el;
  }
}

window.appFreeCell = new AppFreeCell();
