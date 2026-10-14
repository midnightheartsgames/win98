class AppSolitaire {
  constructor() {
    this.suits = ['spades', 'hearts', 'clubs', 'diamonds'];
    this.suitSymbols = { spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦' };
    this.suitColors = { spades: 'black', hearts: 'red', clubs: 'black', diamonds: 'red' };
    this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    this.options = { draw: 1, scoring: 'standard', timed: true, status: true, cumulative: false, outline: false, back: 'weave' };
    this.loadOptions();
    this.drawCount = this.options.draw;
    this.currentDeckTheme = this.options.back;
    this.score = 0;
    this.time = 0;
    this.timerInterval = null;
    this.isWon = false;
    this.stock = [];
    this.waste = [];
    this.wasteShown = 1;
    this.foundations = [[], [], [], []];
    this.tableaux = [[], [], [], [], [], [], []];
    this.undoState = null;
    this.win = null;
    this.vegasBank = 0;
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  loadOptions() {
    try {
      const raw = localStorage.getItem('win98_solitaire_options');
      if (raw) Object.assign(this.options, JSON.parse(raw));
    } catch (e) {}
    if (!window.CardArt || !CardArt.designs.includes(this.options.back)) this.options.back = 'weave';
  }

  saveOptions() {
    try {
      localStorage.setItem('win98_solitaire_options', JSON.stringify(this.options));
    } catch (e) {}
  }

  get layout() {
    const step = 82;
    const x = i => 11 + i * step;
    return { x, topY: 5, tableY: 112, downStep: 3, upStep: 15 };
  }

  open() {
    const winId = 'app_solitaire';
    if (window.winManager.windows.has(winId)) {
      window.winManager.createWindow({ id: winId });
      return;
    }
    const t = (k, ...a) => this.t(k, ...a);
    const content = document.createElement('div');
    content.className = 'solitaire-window';
    content.innerHTML = `
      <div class="win-menubar solitaire-menubar">
        <div class="win-menu-item">${t('sol.menuGame')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="deal">${t('sol.menuDeal')} <span>F2</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option sol-opt-undo" data-cmd="undo">${t('sol.menuUndo')}</div>
            <div class="win-dropdown-option" data-cmd="deck">${t('sol.menuDeck')}</div>
            <div class="win-dropdown-option" data-cmd="options">${t('sol.menuOptions')}</div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option" data-cmd="exit">${t('sol.menuExit')}</div>
          </div>
        </div>
        <div class="win-menu-item">${t('sol.menuHelp')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="help">${t('sol.menuHelpTopics')}</div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option" data-cmd="about">${t('sol.menuAbout')}</div>
          </div>
        </div>
      </div>
      <div class="solitaire-board" id="sol-board">
        <canvas class="solitaire-win-canvas" id="sol-canvas"></canvas>
      </div>
      <div class="win-statusbar solitaire-status-bar">
        <div class="win-status-pane grow sol-status-text"></div>
        <div class="win-status-pane sol-status-score"><span id="sol-score-lbl"></span><span id="sol-time-lbl"></span></div>
      </div>
    `;
    this.win = window.winManager.createWindow({
      id: winId,
      title: t('sol.title'),
      icon: 'solitaire',
      width: 600,
      height: 460,
      minWidth: 300,
      minHeight: 200,
      content
    });
    this.board = content.querySelector('#sol-board');
    this.initEvents(content);
    this.startNewGame();
  }

  initEvents(content) {
    content.querySelectorAll('.solitaire-menubar [data-cmd]').forEach(opt => {
      opt.addEventListener('click', () => this.command(opt.dataset.cmd));
    });
    this.board.addEventListener('mousedown', e => this.onBoardDown(e));
    this.board.addEventListener('dblclick', e => this.onBoardDblClick(e));
    this.board.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (!this.isWon) this.autoPlayAll();
    });
    const onKey = e => {
      if (window.winManager.activeWindowId !== 'app_solitaire') return;
      if (e.key === 'F2') {
        e.preventDefault();
        this.startNewGame();
      }
    };
    window.addEventListener('keydown', onKey);
    this.win.onClose = () => {
      window.removeEventListener('keydown', onKey);
      clearInterval(this.timerInterval);
      this.stopVictory();
      this.win = null;
    };
  }

  command(cmd) {
    if (cmd === 'deal') this.startNewGame();
    else if (cmd === 'undo') this.undo();
    else if (cmd === 'deck') this.deckDialog();
    else if (cmd === 'options') this.optionsDialog();
    else if (cmd === 'exit') window.winManager.closeWindow('app_solitaire');
    else if (cmd === 'help') {
      if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp();
    } else if (cmd === 'about') {
      window.winManager.openDialog({ title: this.t('sol.aboutTitle'), icon: 'solitaire', message: this.t('sol.aboutText') });
    }
  }

  startNewGame() {
    this.stopVictory();
    this.isWon = false;
    this.drawCount = this.options.draw;
    this.currentDeckTheme = this.options.back;
    if (this.options.scoring === 'vegas') {
      this.vegasBank = this.options.cumulative ? this.vegasBank - 52 : -52;
      this.score = this.vegasBank;
    } else {
      this.score = 0;
    }
    this.passes = 0;
    this.time = 0;
    this.started = false;
    this.undoState = null;
    clearInterval(this.timerInterval);
    const deck = [];
    let id = 0;
    this.suits.forEach(suit => {
      this.ranks.forEach((rank, i) => {
        deck.push({ id: id++, suit, rank, rankVal: i + 1, color: this.suitColors[suit], symbol: this.suitSymbols[suit], faceUp: false });
      });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.tableaux = [[], [], [], [], [], [], []];
    this.foundations = [[], [], [], []];
    this.waste = [];
    this.wasteShown = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop();
        card.faceUp = row === col;
        this.tableaux[col].push(card);
      }
    }
    this.stock = deck;
    if (window.soundSys && window.soundSys.playCardFlip) window.soundSys.playCardFlip();
    this.render();
  }

  startTimer() {
    if (this.started) return;
    this.started = true;
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.time++;
      if (this.options.scoring === 'standard' && this.options.timed && this.time % 10 === 0) this.score = Math.max(0, this.score - 2);
      this.updateStatus();
    }, 1000);
  }

  snapshot() {
    const copy = pile => pile.map(c => ({ ...c }));
    return {
      stock: copy(this.stock), waste: copy(this.waste), wasteShown: this.wasteShown,
      foundations: this.foundations.map(copy), tableaux: this.tableaux.map(copy), score: this.score, passes: this.passes
    };
  }

  remember() {
    this.undoState = this.snapshot();
    this.startTimer();
  }

  undo() {
    if (!this.undoState || this.isWon) return;
    const s = this.undoState;
    this.stock = s.stock;
    this.waste = s.waste;
    this.wasteShown = s.wasteShown;
    this.foundations = s.foundations;
    this.tableaux = s.tableaux;
    this.score = s.score;
    this.passes = s.passes;
    this.undoState = null;
    this.render();
  }

  addScore(points) {
    if (this.options.scoring === 'none') return;
    if (this.options.scoring === 'vegas') return;
    this.score = Math.max(0, this.score + points);
  }

  maxPasses() {
    if (this.options.scoring !== 'vegas') return Infinity;
    return this.drawCount === 3 ? 3 : 1;
  }

  drawCard() {
    if (this.stock.length > 0) {
      this.remember();
      const n = Math.min(this.drawCount, this.stock.length);
      for (let i = 0; i < n; i++) {
        const card = this.stock.pop();
        card.faceUp = true;
        this.waste.push(card);
      }
      this.wasteShown = n;
      if (window.soundSys && window.soundSys.playCardFlip) window.soundSys.playCardFlip();
    } else if (this.waste.length > 0) {
      if (this.passes + 1 >= this.maxPasses()) return;
      this.remember();
      this.passes++;
      this.stock = this.waste.reverse();
      this.stock.forEach(c => { c.faceUp = false; });
      this.waste = [];
      this.wasteShown = 0;
      if (this.options.scoring === 'standard') this.score = Math.max(0, this.score - (this.drawCount === 3 ? 20 : 100));
    }
    this.render();
  }

  cardStyle(card) {
    const url = card.faceUp ? CardArt.face(card.rank, card.suit) : CardArt.back(this.currentDeckTheme);
    return `background-image:url(${url})`;
  }

  cardEl(card, x, y, z) {
    const el = document.createElement('div');
    el.className = 'sol-card' + (card.faceUp ? ' front' : ' back');
    el.dataset.id = card.id;
    el.style.cssText = `${this.cardStyle(card)};left:${x}px;top:${y}px;z-index:${z}`;
    return el;
  }

  slotEl(x, y, kind, extra = '') {
    const el = document.createElement('div');
    el.className = 'solitaire-slot ' + kind;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    if (extra) el.innerHTML = extra;
    return el;
  }

  pileRects() {
    const L = this.layout;
    const rects = [];
    this.foundations.forEach((pile, i) => rects.push({ type: 'foundation', index: i, x: L.x(3 + i), y: L.topY, w: 71, h: 96 }));
    this.tableaux.forEach((pile, i) => {
      let y = L.tableY;
      pile.forEach((c, idx) => { if (idx < pile.length - 1) y += c.faceUp ? L.upStep : L.downStep; });
      rects.push({ type: 'tableau', index: i, x: L.x(i), y, w: 71, h: 96 });
    });
    return rects;
  }

  render() {
    if (!this.win || !this.board) return;
    const L = this.layout;
    const board = this.board;
    board.querySelectorAll('.sol-card, .solitaire-slot').forEach(n => n.remove());
    const frag = document.createDocumentFragment();

    const sx = L.x(0);
    if (this.stock.length) {
      const layers = Math.min(3, Math.ceil(this.stock.length / 10));
      for (let i = 0; i < layers; i++) {
        const el = this.cardEl(this.stock[this.stock.length - 1 - i] || this.stock[0], sx + (layers - 1 - i) * 2, L.topY + (layers - 1 - i) * 2, 10 - i);
        el.classList.add('stock-card');
        frag.appendChild(el);
      }
    } else {
      const canRedeal = this.waste.length > 0 && this.passes + 1 < this.maxPasses();
      frag.appendChild(this.slotEl(sx, L.topY, 'stock-slot ' + (canRedeal || !this.waste.length ? 'redeal' : 'nomore')));
    }

    const wx = L.x(1);
    const shown = this.drawCount === 3 ? Math.min(this.wasteShown || 1, this.waste.length, 3) : Math.min(1, this.waste.length);
    if (this.waste.length > shown) {
      frag.appendChild(this.cardEl(this.waste[this.waste.length - shown - 1], wx, L.topY, 1));
    }
    for (let i = 0; i < shown; i++) {
      const card = this.waste[this.waste.length - shown + i];
      const el = this.cardEl(card, wx + i * 12, L.topY, 2 + i);
      if (i === shown - 1) el.classList.add('waste-top');
      frag.appendChild(el);
    }
    if (!this.waste.length) frag.appendChild(this.slotEl(wx, L.topY, 'waste-slot hidden-slot'));

    this.foundations.forEach((pile, i) => {
      const x = L.x(3 + i);
      frag.appendChild(this.slotEl(x, L.topY, 'foundation'));
      if (pile.length) frag.appendChild(this.cardEl(pile[pile.length - 1], x, L.topY, 5));
    });

    this.tableaux.forEach((pile, col) => {
      const x = L.x(col);
      frag.appendChild(this.slotEl(x, L.tableY, 'tableau-slot'));
      let y = L.tableY;
      pile.forEach((card, idx) => {
        const el = this.cardEl(card, x, y, 10 + idx);
        el.dataset.col = col;
        el.dataset.idx = idx;
        frag.appendChild(el);
        y += card.faceUp ? L.upStep : L.downStep;
      });
    });

    board.appendChild(frag);
    const undoOpt = this.win.element.querySelector('.sol-opt-undo');
    if (undoOpt) undoOpt.classList.toggle('disabled', !this.undoState);
    this.updateStatus();
    this.checkWinCondition();
  }

  updateStatus() {
    if (!this.win) return;
    const scoreEl = this.win.element.querySelector('#sol-score-lbl');
    const timeEl = this.win.element.querySelector('#sol-time-lbl');
    const bar = this.win.element.querySelector('.solitaire-status-bar');
    bar.classList.toggle('hidden', !this.options.status);
    if (this.options.scoring === 'none') scoreEl.textContent = '';
    else if (this.options.scoring === 'vegas') scoreEl.textContent = this.t('sol.score', (this.score < 0 ? '-$' : '$') + Math.abs(this.score));
    else scoreEl.textContent = this.t('sol.score', this.score);
    timeEl.textContent = this.options.timed ? this.t('sol.time', this.time) : '';
  }

  locate(cardId) {
    const id = Number(cardId);
    if (this.waste.length && this.waste[this.waste.length - 1].id === id) return { type: 'waste', cards: [this.waste[this.waste.length - 1]] };
    for (let f = 0; f < 4; f++) {
      const pile = this.foundations[f];
      if (pile.length && pile[pile.length - 1].id === id) return { type: 'foundation', index: f, cards: [pile[pile.length - 1]] };
    }
    for (let t = 0; t < 7; t++) {
      const idx = this.tableaux[t].findIndex(c => c.id === id);
      if (idx >= 0) return { type: 'tableau', index: t, cardIndex: idx, cards: this.tableaux[t].slice(idx) };
    }
    return null;
  }

  onBoardDown(e) {
    if (e.button !== 0 || this.isWon) {
      if (this.isWon && e.button === 0) this.stopVictory();
      return;
    }
    const cardNode = e.target.closest('.sol-card');
    const slotNode = e.target.closest('.solitaire-slot');
    if (cardNode && cardNode.classList.contains('stock-card')) {
      this.drawCard();
      return;
    }
    if (!cardNode && slotNode && slotNode.classList.contains('stock-slot')) {
      this.drawCard();
      return;
    }
    if (!cardNode) return;
    const src = this.locate(cardNode.dataset.id);
    if (!src) return;
    const card = src.cards[0];
    if (!card.faceUp) {
      if (src.type === 'tableau' && src.cardIndex === this.tableaux[src.index].length - 1) {
        this.remember();
        card.faceUp = true;
        this.addScore(5);
        if (window.soundSys && window.soundSys.playCardFlip) window.soundSys.playCardFlip();
        this.render();
      }
      return;
    }
    e.preventDefault();
    this.startDrag(e, src);
  }

  startDrag(e, src) {
    const nodes = src.cards.map(c => this.board.querySelector(`.sol-card[data-id="${c.id}"]`)).filter(Boolean);
    if (!nodes.length) return;
    const origin = nodes.map(n => ({ x: parseFloat(n.style.left), y: parseFloat(n.style.top), z: n.style.zIndex }));
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;
    nodes.forEach((n, i) => { n.style.zIndex = 1000 + i; });
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      moved = true;
      nodes.forEach((n, i) => {
        n.style.left = origin[i].x + dx + 'px';
        n.style.top = origin[i].y + dy + 'px';
        n.classList.toggle('outline-drag', this.options.outline);
      });
    };
    const onUp = (ev) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (!moved) {
        nodes.forEach((n, i) => { n.style.zIndex = origin[i].z; });
        return;
      }
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const cx = origin[0].x + dx;
      const cy = origin[0].y + dy;
      const target = this.bestTarget(cx, cy, src);
      if (target) this.moveCards(src, target, src.cards);
      else this.render();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  bestTarget(x, y, src) {
    const card = src.cards[0];
    let best = null;
    let bestArea = 0;
    this.pileRects().forEach(r => {
      if (r.type === src.type && r.index === src.index) return;
      const ix = Math.max(0, Math.min(x + 71, r.x + r.w) - Math.max(x, r.x));
      const iy = Math.max(0, Math.min(y + 96, r.y + r.h) - Math.max(y, r.y));
      const area = ix * iy;
      if (area <= bestArea) return;
      const ok = r.type === 'foundation' ? src.cards.length === 1 && this.canPlaceOnFoundation(card, r.index) : this.canPlaceOnTableau(card, r.index);
      if (ok) {
        best = r;
        bestArea = area;
      }
    });
    return best ? { type: best.type, index: best.index } : null;
  }

  onBoardDblClick(e) {
    const cardNode = e.target.closest('.sol-card');
    if (!cardNode || this.isWon) return;
    const src = this.locate(cardNode.dataset.id);
    if (!src || src.cards.length !== 1 || !src.cards[0].faceUp || src.type === 'foundation') return;
    this.tryAutoMove(src.cards[0]);
  }

  canPlaceOnFoundation(card, fIdx) {
    const pile = this.foundations[fIdx];
    if (!pile.length) return card.rankVal === 1;
    const top = pile[pile.length - 1];
    return top.suit === card.suit && card.rankVal === top.rankVal + 1;
  }

  canPlaceOnTableau(card, tIdx) {
    const pile = this.tableaux[tIdx];
    if (!pile.length) return card.rankVal === 13;
    const top = pile[pile.length - 1];
    return top.faceUp && top.color !== card.color && top.rankVal === card.rankVal + 1;
  }

  moveCards(src, dst, cards) {
    this.remember();
    if (src.type === 'waste') {
      this.waste.pop();
      if (this.wasteShown > 1) this.wasteShown--;
    } else if (src.type === 'foundation') {
      this.foundations[src.index].pop();
    } else if (src.type === 'tableau') {
      this.tableaux[src.index].splice(src.cardIndex, cards.length);
    }
    if (dst.type === 'foundation') {
      this.foundations[dst.index].push(cards[0]);
      if (this.options.scoring === 'vegas') this.score += 5;
      else if (src.type !== 'foundation') this.addScore(10);
    } else {
      this.tableaux[dst.index].push(...cards);
      if (src.type === 'waste') this.addScore(5);
      if (src.type === 'foundation') {
        if (this.options.scoring === 'vegas') this.score -= 5;
        else this.addScore(-15);
      }
    }
    if (this.options.scoring === 'vegas') this.vegasBank = this.score;
    if (window.soundSys && window.soundSys.playCardPlace) window.soundSys.playCardPlace();
    this.render();
  }

  tryAutoMove(card) {
    const src = this.locate(card.id);
    if (!src || src.cards.length !== 1) return false;
    for (let f = 0; f < 4; f++) {
      if (this.canPlaceOnFoundation(card, f)) {
        this.moveCards(src, { type: 'foundation', index: f }, [card]);
        return true;
      }
    }
    return false;
  }

  autoPlayAll() {
    let moved = true;
    let guard = 0;
    while (moved && guard++ < 60) {
      moved = false;
      const candidates = [];
      if (this.waste.length) candidates.push(this.waste[this.waste.length - 1]);
      this.tableaux.forEach(p => { if (p.length && p[p.length - 1].faceUp) candidates.push(p[p.length - 1]); });
      for (const c of candidates) {
        if (this.tryAutoMove(c)) {
          moved = true;
          break;
        }
      }
    }
  }

  checkWinCondition() {
    if (this.isWon) return;
    const total = this.foundations.reduce((n, p) => n + p.length, 0);
    if (total === 52) this.triggerVictory();
  }

  triggerVictory() {
    this.isWon = true;
    clearInterval(this.timerInterval);
    if (this.options.scoring === 'standard' && this.options.timed && this.time >= 30) this.score += Math.round(700000 / this.time);
    this.updateStatus();
    if (window.soundSys && window.soundSys.playSolitaireWin) window.soundSys.playSolitaireWin();
    const canvas = this.win && this.win.element.querySelector('#sol-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    canvas.width = this.board.clientWidth || 600;
    canvas.height = this.board.clientHeight || 400;
    const ctx = canvas.getContext('2d');
    const L = this.layout;
    const queue = [];
    for (let r = 13; r >= 1; r--) {
      for (let f = 0; f < 4; f++) {
        const suit = this.foundations[f].length ? this.foundations[f][0].suit : this.suits[f];
        queue.push({ rank: this.ranks[r - 1], suit, x: L.x(3 + f), y: L.topY });
      }
    }
    const images = new Map();
    queue.forEach(q => {
      const key = q.rank + q.suit;
      if (!images.has(key)) {
        const img = new Image();
        img.src = CardArt.face(q.rank, q.suit);
        images.set(key, img);
      }
    });
    let current = null;
    const launch = () => {
      const next = queue.shift();
      if (!next) return null;
      const vx = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 5);
      return { ...next, vx, vy: -Math.random() * 6, img: images.get(next.rank + next.suit) };
    };
    current = launch();
    const step = () => {
      if (!this.isWon || !current) {
        if (this.isWon && !current) this.askDealAgain();
        return;
      }
      for (let i = 0; i < 2 && current; i++) {
        current.x += current.vx;
        current.y += current.vy;
        current.vy += 0.6;
        if (current.y + 96 > canvas.height) {
          current.y = canvas.height - 96;
          current.vy = -current.vy * (0.6 + Math.random() * 0.25);
        }
        if (current.img.complete) ctx.drawImage(current.img, Math.round(current.x), Math.round(current.y));
        if (current.x < -71 || current.x > canvas.width) current = launch();
      }
      this.victoryAnimId = requestAnimationFrame(step);
    };
    step();
  }

  askDealAgain() {
    window.winManager.openDialog({
      title: this.t('sol.title'),
      icon: 'solitaire',
      message: this.t('sol.dealAgain'),
      buttons: [
        { text: 'Yes', primary: true, onClick: () => this.startNewGame() },
        { text: 'No' }
      ]
    });
  }

  stopVictory() {
    if (this.victoryAnimId) cancelAnimationFrame(this.victoryAnimId);
    this.victoryAnimId = null;
    const canvas = this.win && this.win.element.querySelector('#sol-canvas');
    if (canvas) {
      canvas.style.display = 'none';
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  dialogWindow(id, title, width, body, onOk) {
    if (window.winManager.windows.has(id)) return null;
    const dlg = window.winManager.createWindow({
      id,
      title,
      icon: 'solitaire',
      width,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `<div class="sol-dlg">${body}<div class="sol-dlg-buttons"><button class="win-btn is-default sd-ok">${this.t('btn.ok')}</button><button class="win-btn sd-cancel">${this.t('btn.cancel')}</button></div></div>`
    });
    const close = () => window.winManager.closeWindow(id);
    dlg.element.querySelector('.sd-ok').addEventListener('click', () => { onOk(dlg.element); close(); });
    dlg.element.querySelector('.sd-cancel').addEventListener('click', close);
    dlg.element.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
    return dlg;
  }

  deckDialog() {
    let chosen = this.options.back;
    const body = `<div class="sol-deck-grid">${CardArt.designs.map(d => `<div class="sol-deck-item${d === chosen ? ' selected' : ''}" data-back="${d}"><img src="${CardArt.back(d)}" alt=""></div>`).join('')}</div>`;
    const dlg = this.dialogWindow('app_sol_deck', this.t('sol.deckTitle'), 300, body, () => {
      this.options.back = chosen;
      this.currentDeckTheme = chosen;
      this.saveOptions();
      this.render();
    });
    if (!dlg) return;
    dlg.element.querySelectorAll('.sol-deck-item').forEach(item => {
      item.addEventListener('click', () => {
        chosen = item.dataset.back;
        dlg.element.querySelectorAll('.sol-deck-item').forEach(i => i.classList.toggle('selected', i === item));
      });
      item.addEventListener('dblclick', () => dlg.element.querySelector('.sd-ok').click());
    });
  }

  optionsDialog() {
    const o = this.options;
    const t = k => this.t(k);
    const radio = (name, value, label, on) => `<label><input type="radio" name="${name}" value="${value}"${on ? ' checked' : ''}> ${label}</label>`;
    const check = (cls, label, on) => `<label><input type="checkbox" class="${cls}"${on ? ' checked' : ''}> ${label}</label>`;
    const body = `
      <div class="sol-opt-groups">
        <fieldset class="sol-opt-group"><legend>${t('sol.optDraw')}</legend>
          ${radio('sol-draw', '1', t('sol.optDrawOne'), o.draw === 1)}
          ${radio('sol-draw', '3', t('sol.optDrawThree'), o.draw === 3)}
        </fieldset>
        <fieldset class="sol-opt-group"><legend>${t('sol.optScoring')}</legend>
          ${radio('sol-score', 'standard', t('sol.optStandard'), o.scoring === 'standard')}
          ${radio('sol-score', 'vegas', t('sol.optVegas'), o.scoring === 'vegas')}
          ${radio('sol-score', 'none', t('sol.optNone'), o.scoring === 'none')}
        </fieldset>
      </div>
      <div class="sol-opt-checks">
        ${check('so-timed', t('sol.optTimed'), o.timed)}
        ${check('so-cumulative', t('sol.optCumulative'), o.cumulative)}
        ${check('so-status', t('sol.optStatus'), o.status)}
        ${check('so-outline', t('sol.optOutline'), o.outline)}
      </div>`;
    this.dialogWindow('app_sol_options', t('sol.optTitle'), 330, body, (root) => {
      const draw = Number(root.querySelector('input[name="sol-draw"]:checked').value);
      const scoring = root.querySelector('input[name="sol-score"]:checked').value;
      const changed = draw !== o.draw || scoring !== o.scoring;
      o.draw = draw;
      o.scoring = scoring;
      o.timed = root.querySelector('.so-timed').checked;
      o.cumulative = root.querySelector('.so-cumulative').checked;
      o.status = root.querySelector('.so-status').checked;
      o.outline = root.querySelector('.so-outline').checked;
      this.saveOptions();
      if (changed) this.startNewGame();
      else this.updateStatus();
    });
  }
}

window.appSolitaire = new AppSolitaire();
