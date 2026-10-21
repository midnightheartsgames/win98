class AppHearts {
  constructor() {
    this.suits = ['clubs', 'diamonds', 'spades', 'hearts'];
    this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    this.players = [
      { name: 'Administrator', hand: [], score: 0, handPoints: 0, isHuman: true },
      { name: 'Paulina', hand: [], score: 0, handPoints: 0, isHuman: false },
      { name: 'Michele', hand: [], score: 0, handPoints: 0, isHuman: false },
      { name: 'Ben', hand: [], score: 0, handPoints: 0, isHuman: false }
    ];
    this.passDirections = ['left', 'right', 'across', 'none'];
    this.handIndex = 0;
    this.phase = 'idle';
    this.selectedPassIds = new Set();
    this.trick = [];
    this.leadSuit = null;
    this.turnIndex = 0;
    this.trickNumber = 0;
    this.heartsBroken = false;
    this.win = null;
  }

  isRu() {
    return !!(window.i18n && window.i18n.getLanguage() === 'ru');
  }

  playerName(p) {
    return p.isHuman && this.isRu() ? 'Администратор' : p.name;
  }

  suitName(suit) {
    const ru = { clubs: 'трефы', diamonds: 'бубны', spades: 'пики', hearts: 'червы' };
    return this.isRu() ? ru[suit] : suit;
  }

  passPrompt(dir) {
    if (!this.isRu()) return `Select 3 cards to pass ${dir}`;
    const where = { left: 'влево', right: 'вправо', across: 'напротив' };
    return `Выберите 3 карты для передачи ${where[dir]}`;
  }

  passButtonLabel(dir) {
    if (!this.isRu()) return { left: 'Pass Left', right: 'Pass Right', across: 'Pass Across' }[dir];
    return { left: 'Передать влево', right: 'Передать вправо', across: 'Передать напротив' }[dir];
  }

  open() {
    const winId = 'app_hearts';
    if (window.winManager && window.winManager.windows.has(winId)) {
      window.winManager.bringToTop(winId);
      return;
    }

    const isRu = this.isRu();
    const content = document.createElement('div');
    content.style.cssText = 'display:flex; flex-direction:column; height:100%; background:#008000; user-select:none; font-family:Tahoma,sans-serif; font-size:11px;';
    content.innerHTML = `
      <div class="win-menubar" style="background:#c0c0c0;">
        <div class="win-menu-item">${isRu ? 'Игра' : 'Game'}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="new">${isRu ? 'Новая игра' : 'New Game'} <span>F2</span></div>
            <div class="win-dropdown-option" data-cmd="scores">${isRu ? 'Счет...' : 'Score...'} <span>F4</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option" data-cmd="exit">${isRu ? 'Выход' : 'Exit'}</div>
          </div>
        </div>
        <div class="win-menu-item">${isRu ? 'Справка' : 'Help'}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="about">${isRu ? 'О программе...' : 'About Hearts...'}</div>
          </div>
        </div>
      </div>
      <div id="hearts-felt" style="flex:1; position:relative; overflow:hidden; background:#008000;">
        <div id="hearts-north-label" style="position:absolute; top:6px; left:50%; transform:translateX(-50%); color:#ffff00; font-weight:bold; text-shadow:1px 1px 0 #000;">Michele (0)</div>
        <div id="hearts-north-hand" style="position:absolute; top:24px; left:50%; transform:translateX(-50%); height:96px; width:280px;"></div>

        <div id="hearts-west-label" style="position:absolute; left:10px; top:115px; color:#ffff00; font-weight:bold; text-shadow:1px 1px 0 #000;">Paulina (0)</div>
        <div id="hearts-west-hand" style="position:absolute; left:12px; top:135px; width:71px; height:210px;"></div>

        <div id="hearts-east-label" style="position:absolute; right:10px; top:115px; color:#ffff00; font-weight:bold; text-shadow:1px 1px 0 #000;">Ben (0)</div>
        <div id="hearts-east-hand" style="position:absolute; right:12px; top:135px; width:71px; height:210px;"></div>

        <div id="hearts-center-area" style="position:absolute; left:50%; top:46%; transform:translate(-50%,-50%); width:230px; height:170px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <div id="hearts-trick-slots" style="position:relative; width:200px; height:150px;"></div>
          <div id="hearts-pass-panel" style="display:none; position:absolute; inset:0; background:rgba(0,96,0,0.92); border:2px outset #fff; padding:10px; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:#fff; text-align:center; z-index:40;">
            <div id="hearts-pass-text" style="font-weight:bold;">${this.passPrompt('left')}</div>
            <button class="win-btn default" id="hearts-pass-btn" style="color:#000; min-width:100px;" disabled>${this.passButtonLabel('left')}</button>
          </div>
        </div>

        <div id="hearts-south-label" style="position:absolute; bottom:118px; left:50%; transform:translateX(-50%); color:#ffff00; font-weight:bold; text-shadow:1px 1px 0 #000;">${this.playerName(this.players[0])} (0)</div>
        <div id="hearts-south-hand" style="position:absolute; bottom:12px; left:50%; transform:translateX(-50%); height:104px; width:340px;"></div>
      </div>
      <div class="win-statusbar" style="background:#c0c0c0; padding:2px 6px;" id="hearts-status">${isRu ? 'Добро пожаловать в The Microslop Hearts Network! Нажмите F2 или выберите Игра -> Новая игра.' : 'Welcome to The Microslop Hearts Network! Press F2 or click Game -> New Game.'}</div>
    `;

    this.win = window.winManager.createWindow({
      id: winId,
      title: isRu ? 'Червы — The Microslop Hearts Network' : 'The Microslop Hearts Network',
      icon: 'hearts',
      width: 620,
      height: 480,
      minWidth: 560,
      minHeight: 440,
      content
    });

    this.bindMenu(content);
    this.startNewMatch();
  }

  bindMenu(content) {
    const isRu = this.isRu();
    content.querySelectorAll('.win-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = item.classList.contains('open');
        content.querySelectorAll('.win-menu-item.open').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });
    content.addEventListener('click', () => {
      content.querySelectorAll('.win-menu-item.open').forEach(i => i.classList.remove('open'));
    });

    content.querySelectorAll('.win-dropdown-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        content.querySelectorAll('.win-menu-item.open').forEach(i => i.classList.remove('open'));
        const cmd = opt.dataset.cmd;
        if (cmd === 'new') this.startNewMatch();
        else if (cmd === 'scores') this.showScoreDialog();
        else if (cmd === 'exit') window.winManager.closeWindow('app_hearts');
        else if (cmd === 'about') {
          window.winManager.openDialog({
            title: isRu ? 'О программе Червы' : 'About Hearts',
            icon: 'hearts',
            message: isRu
              ? 'Червы (The Microslop Hearts Network)\nMicroslop Win 98 SE\n© Корпорация Microslop (Microslop Corp.), 1981-1998'
              : 'The Microslop Hearts Network\nMicroslop Win 98 SE\nCopyright (C) 1981-1998 Microslop Corp.'
          });
        }
      });
    });

    const passBtn = content.querySelector('#hearts-pass-btn');
    passBtn.addEventListener('click', () => this.executePass());
  }

  buildDeck() {
    const deck = [];
    let id = 1;
    this.suits.forEach(suit => {
      this.ranks.forEach((rank, idx) => {
        deck.push({
          id: id++,
          suit,
          rank,
          val: idx + 2,
          points: suit === 'hearts' ? 1 : (suit === 'spades' && rank === 'Q' ? 13 : 0)
        });
      });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    return deck;
  }

  sortHand(hand) {
    const suitOrder = { clubs: 0, diamonds: 1, spades: 2, hearts: 3 };
    hand.sort((a, b) => (suitOrder[a.suit] - suitOrder[b.suit]) || (a.val - b.val));
  }

  startNewMatch() {
    this.players.forEach(p => { p.score = 0; p.handPoints = 0; });
    this.handIndex = 0;
    this.startHand();
  }

  startHand() {
    const deck = this.buildDeck();
    this.players.forEach((p, idx) => {
      p.hand = deck.slice(idx * 13, (idx + 1) * 13);
      p.handPoints = 0;
      this.sortHand(p.hand);
    });
    this.selectedPassIds.clear();
    this.trick = [];
    this.leadSuit = null;
    this.trickNumber = 0;
    this.heartsBroken = false;

    const dir = this.passDirections[this.handIndex % 4];
    if (dir === 'none') {
      this.beginPlayPhase();
    } else {
      this.phase = 'passing';
      this.setStatus(`${this.passPrompt(dir)}.`);
      this.render();
    }
  }

  executePass() {
    if (this.phase !== 'passing' || this.selectedPassIds.size !== 3) return;
    const dir = this.passDirections[this.handIndex % 4];
    const offset = dir === 'left' ? 1 : (dir === 'right' ? 3 : 2);

    const passedSets = this.players.map((p, idx) => {
      if (idx === 0) {
        const picked = p.hand.filter(c => this.selectedPassIds.has(c.id));
        p.hand = p.hand.filter(c => !this.selectedPassIds.has(c.id));
        return picked;
      }
      const sortedByDanger = [...p.hand].sort((a, b) => (b.points * 10 + b.val) - (a.points * 10 + a.val));
      const picked = sortedByDanger.slice(0, 3);
      const ids = new Set(picked.map(c => c.id));
      p.hand = p.hand.filter(c => !ids.has(c.id));
      return picked;
    });

    this.players.forEach((p, idx) => {
      const target = this.players[(idx + offset) % 4];
      target.hand.push(...passedSets[idx]);
      this.sortHand(target.hand);
    });

    this.selectedPassIds.clear();
    if (window.soundSys && window.soundSys.playCardFlip) window.soundSys.playCardFlip();
    this.beginPlayPhase();
  }

  beginPlayPhase() {
    this.phase = 'playing';
    this.trick = [];
    this.leadSuit = null;
    this.trickNumber = 1;
    let starter = 0;
    this.players.forEach((p, idx) => {
      if (p.hand.some(c => c.suit === 'clubs' && c.rank === '2')) starter = idx;
    });
    this.turnIndex = starter;
    this.render();
    this.updateTurnStatus();
    if (this.turnIndex !== 0) {
      setTimeout(() => this.aiStep(), 450);
    }
  }

  isValidPlay(playerIdx, card) {
    const hand = this.players[playerIdx].hand;
    if (this.trick.length === 0) {
      if (this.trickNumber === 1) {
        return card.suit === 'clubs' && card.rank === '2';
      }
      if (card.suit === 'hearts' && !this.heartsBroken) {
        const hasNonHeart = hand.some(c => c.suit !== 'hearts');
        return !hasNonHeart;
      }
      return true;
    }
    const hasLeadSuit = hand.some(c => c.suit === this.leadSuit);
    if (hasLeadSuit) {
      return card.suit === this.leadSuit;
    }
    if (this.trickNumber === 1 && card.points > 0) {
      const hasZeroPointCard = hand.some(c => c.points === 0);
      if (hasZeroPointCard) return false;
    }
    return true;
  }

  onHumanCardClick(card) {
    if (!this.win) return;
    if (this.phase === 'passing') {
      if (this.selectedPassIds.has(card.id)) this.selectedPassIds.delete(card.id);
      else if (this.selectedPassIds.size < 3) this.selectedPassIds.add(card.id);
      this.render();
      return;
    }
    if (this.phase !== 'playing' || this.turnIndex !== 0) return;
    if (!this.isValidPlay(0, card)) {
      if (window.soundSys && window.soundSys.playError) window.soundSys.playError();
      const isRu = this.isRu();
      if (this.trickNumber === 1 && this.trick.length === 0) {
        this.setStatus(isRu ? 'Первый ход делается двойкой треф.' : 'You must lead with the 2 of Clubs.');
      } else if (this.trick.length > 0) {
        this.setStatus(isRu ? `Нужно ходить в масть (${this.suitName(this.leadSuit)}).` : `You must follow suit (${this.leadSuit}).`);
      } else {
        this.setStatus(isRu ? 'С червей ходить пока нельзя: их еще никто не сбрасывал.' : 'Hearts have not been broken yet.');
      }
      return;
    }
    this.playCard(0, card);
  }

  playCard(playerIdx, card) {
    const p = this.players[playerIdx];
    p.hand = p.hand.filter(c => c.id !== card.id);
    if (this.trick.length === 0) this.leadSuit = card.suit;
    if (card.suit === 'hearts') this.heartsBroken = true;
    this.trick.push({ playerIdx, card });
    if (window.soundSys && window.soundSys.playCardPlace) window.soundSys.playCardPlace();
    this.render();

    if (this.trick.length < 4) {
      this.turnIndex = (this.turnIndex + 1) % 4;
      this.updateTurnStatus();
      if (this.turnIndex !== 0) {
        setTimeout(() => this.aiStep(), 420);
      }
    } else {
      this.phase = 'trick_end';
      setTimeout(() => this.resolveTrick(), 850);
    }
  }

  aiStep() {
    if (!this.win || this.phase !== 'playing' || this.turnIndex === 0) return;
    const pIdx = this.turnIndex;
    const hand = this.players[pIdx].hand;
    const legal = hand.filter(c => this.isValidPlay(pIdx, c));
    if (!legal.length) return;

    let chosen = legal[0];
    if (this.trick.length > 0) {
      const sameSuit = legal.filter(c => c.suit === this.leadSuit);
      if (sameSuit.length) {
        const highestInTrick = Math.max(...this.trick.filter(t => t.card.suit === this.leadSuit).map(t => t.card.val));
        const under = sameSuit.filter(c => c.val < highestInTrick);
        chosen = under.length ? under[under.length - 1] : sameSuit[0];
      } else {
        const qSpades = legal.find(c => c.suit === 'spades' && c.rank === 'Q');
        const hearts = legal.filter(c => c.suit === 'hearts');
        if (qSpades) chosen = qSpades;
        else if (hearts.length) chosen = hearts[hearts.length - 1];
        else chosen = legal[legal.length - 1];
      }
    } else {
      chosen = legal[0];
    }
    this.playCard(pIdx, chosen);
  }

  resolveTrick() {
    if (!this.win) return;
    let winner = this.trick[0];
    let pts = 0;
    this.trick.forEach(t => {
      pts += t.card.points;
      if (t.card.suit === this.leadSuit && t.card.val > winner.card.val) {
        winner = t;
      }
    });
    this.players[winner.playerIdx].handPoints += pts;
    const queenTaken = this.trick.some(t => t.card.suit === 'spades' && t.card.rank === 'Q');
    if (queenTaken && winner.playerIdx === 0 && window.appClippy && typeof window.appClippy.onHeartsEvent === 'function') {
      window.appClippy.onHeartsEvent('queen');
    }
    this.trick = [];
    this.leadSuit = null;

    if (this.players[0].hand.length === 0) {
      this.finishHand();
      return;
    }

    this.trickNumber++;
    this.turnIndex = winner.playerIdx;
    this.phase = 'playing';
    this.render();
    this.updateTurnStatus();
    if (this.turnIndex !== 0) {
      setTimeout(() => this.aiStep(), 450);
    }
  }

  finishHand() {
    const shooter = this.players.findIndex(p => p.handPoints === 26);
    if (shooter >= 0) {
      this.players.forEach((p, idx) => {
        if (idx !== shooter) p.score += 26;
      });
      const shooterName = this.playerName(this.players[shooter]);
      this.setStatus(this.isRu() ? `${shooterName} срывает банк!` : `${shooterName} shot the moon!`);
      if (window.appClippy && typeof window.appClippy.onHeartsEvent === 'function') {
        window.appClippy.onHeartsEvent('moon', { human: shooter === 0, name: shooterName });
      }
    } else {
      this.players.forEach(p => { p.score += p.handPoints; });
    }
    this.handIndex++;
    this.render();
    this.showScoreDialog(true);
  }

  showScoreDialog(fromEndOfHand = false) {
    const id = 'hearts_scores_dlg';
    if (window.winManager.windows.has(id)) {
      window.winManager.closeWindow(id);
    }
    const isRu = this.isRu();
    const content = document.createElement('div');
    content.style.cssText = 'padding:12px; font-family:Tahoma,sans-serif; font-size:11px; background:#c0c0c0; display:flex; flex-direction:column; gap:10px;';
    content.innerHTML = `
      <div style="font-weight:bold;">${isRu ? 'Таблица очков — The Microslop Hearts Network' : 'Score Sheet — The Microslop Hearts Network'}</div>
      <div class="win-inset" style="background:#fff; padding:6px;">
        <table style="width:100%; border-collapse:collapse; font-size:11px;">
          <thead>
            <tr style="border-bottom:1px solid #808080; text-align:left;">
              <th style="padding:3px;">${isRu ? 'Игрок' : 'Player'}</th>
              <th style="padding:3px;">${isRu ? 'За кон' : 'This Hand'}</th>
              <th style="padding:3px;">${isRu ? 'Всего очков' : 'Total Score'}</th>
            </tr>
          </thead>
          <tbody>
            ${this.players.map(p => `
              <tr>
                <td style="padding:3px; font-weight:bold;">${this.playerName(p)}</td>
                <td style="padding:3px;">${p.handPoints}</td>
                <td style="padding:3px;">${p.score}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn default" id="hearts-score-ok" style="min-width:85px;">${fromEndOfHand ? (isRu ? 'Следующий кон' : 'Next Hand') : 'OK'}</button>
      </div>
    `;
    const dlg = window.winManager.createWindow({
      id,
      title: isRu ? 'Счет' : 'Score',
      icon: 'hearts',
      width: 300,
      height: 215,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });
    dlg.element.querySelector('#hearts-score-ok').addEventListener('click', () => {
      window.winManager.closeWindow(id);
      if (fromEndOfHand) this.startHand();
    });
  }

  updateTurnStatus() {
    const isRu = this.isRu();
    if (this.turnIndex === 0) {
      if (this.trickNumber === 1 && this.trick.length === 0) {
        this.setStatus(isRu ? 'Ваш ход: начните с двойки треф.' : 'Lead with the 2 of Clubs.');
      } else {
        this.setStatus(isRu ? 'Ваш ход. Выберите карту.' : 'Your turn to play a card.');
      }
    } else {
      const name = this.playerName(this.players[this.turnIndex]);
      this.setStatus(isRu ? `${name} думает...` : `${name} is thinking...`);
    }
  }

  setStatus(msg) {
    if (!this.win) return;
    const st = this.win.element.querySelector('#hearts-status');
    if (st) st.textContent = msg;
  }

  createCardNode(card, faceUp = true) {
    const d = document.createElement('div');
    d.style.width = '71px';
    d.style.height = '96px';
    d.style.position = 'absolute';
    d.style.backgroundSize = '71px 96px';
    d.style.borderRadius = '3px';
    if (window.CardArt) {
      const url = faceUp ? window.CardArt.face(card.rank, card.suit) : window.CardArt.back('weave');
      d.style.backgroundImage = `url(${url})`;
    } else {
      d.style.background = faceUp ? '#fff' : '#000080';
      d.style.border = '1px solid #000';
      if (faceUp) d.textContent = `${card.rank}${card.suit[0].toUpperCase()}`;
    }
    return d;
  }

  render() {
    if (!this.win || !this.win.element) return;
    const el = this.win.element;

    const isRu = this.isRu();
    const label = (p) => isRu
      ? `${this.playerName(p)} (${p.score} очк., кон: ${p.handPoints})`
      : `${this.playerName(p)} (${p.score} pts, hand: ${p.handPoints})`;
    el.querySelector('#hearts-south-label').textContent = label(this.players[0]);
    el.querySelector('#hearts-west-label').textContent = label(this.players[1]);
    el.querySelector('#hearts-north-label').textContent = label(this.players[2]);
    el.querySelector('#hearts-east-label').textContent = label(this.players[3]);

    const passPanel = el.querySelector('#hearts-pass-panel');
    const passBtn = el.querySelector('#hearts-pass-btn');
    const passText = el.querySelector('#hearts-pass-text');
    if (this.phase === 'passing') {
      const dir = this.passDirections[this.handIndex % 4];
      passPanel.style.display = 'flex';
      passText.textContent = this.passPrompt(dir);
      passBtn.textContent = this.passButtonLabel(dir);
      passBtn.disabled = this.selectedPassIds.size !== 3;
    } else {
      passPanel.style.display = 'none';
    }

    const southBox = el.querySelector('#hearts-south-hand');
    southBox.innerHTML = '';
    const humanHand = this.players[0].hand;
    const stepX = humanHand.length > 1 ? Math.min(20, Math.floor(260 / (humanHand.length - 1))) : 0;
    const startX = Math.floor((340 - (71 + (humanHand.length - 1) * stepX)) / 2);
    humanHand.forEach((c, idx) => {
      const node = this.createCardNode(c, true);
      const lifted = this.selectedPassIds.has(c.id);
      node.style.left = (startX + idx * stepX) + 'px';
      node.style.top = (lifted ? 0 : 8) + 'px';
      node.style.zIndex = String(idx + 1);
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => this.onHumanCardClick(c));
      southBox.appendChild(node);
    });

    const northBox = el.querySelector('#hearts-north-hand');
    northBox.innerHTML = '';
    this.players[2].hand.forEach((c, idx) => {
      const node = this.createCardNode(c, false);
      node.style.left = (idx * 15) + 'px';
      node.style.top = '0px';
      northBox.appendChild(node);
    });

    const westBox = el.querySelector('#hearts-west-hand');
    westBox.innerHTML = '';
    this.players[1].hand.forEach((c, idx) => {
      const node = this.createCardNode(c, false);
      node.style.left = '0px';
      node.style.top = (idx * 9) + 'px';
      westBox.appendChild(node);
    });

    const eastBox = el.querySelector('#hearts-east-hand');
    eastBox.innerHTML = '';
    this.players[3].hand.forEach((c, idx) => {
      const node = this.createCardNode(c, false);
      node.style.left = '0px';
      node.style.top = (idx * 9) + 'px';
      eastBox.appendChild(node);
    });

    const trickBox = el.querySelector('#hearts-trick-slots');
    trickBox.innerHTML = '';
    const positions = [
      { left: '64px', top: '48px' },
      { left: '12px', top: '26px' },
      { left: '64px', top: '2px' },
      { left: '116px', top: '26px' }
    ];
    this.trick.forEach((t, i) => {
      const node = this.createCardNode(t.card, true);
      node.style.left = positions[t.playerIdx].left;
      node.style.top = positions[t.playerIdx].top;
      node.style.zIndex = String(10 + i);
      trickBox.appendChild(node);
    });
  }
}

window.appHearts = new AppHearts();
