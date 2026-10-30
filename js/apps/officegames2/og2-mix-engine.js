window.Og2MixEngine = class Og2MixEngine {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.size = options.size || 8;
    this.kinds = 6;
    this.restart();
  }

  restart() {
    this.score = 0;
    this.startLevel(1);
  }

  nextLevel() {
    this.startLevel(this.level + 1);
  }

  startLevel(level) {
    this.level = level;
    this.moves = 25;
    this.target = 800 + (level - 1) * 450;
    this.state = 'playing';
    this.levelBonus = 0;
    this.board = this.freshBoard();
  }

  randomTile() {
    return { type: Math.floor(this.random() * this.kinds), special: null };
  }

  freshBoard() {
    for (let attempt = 0; attempt < 200; attempt++) {
      const board = [];
      for (let r = 0; r < this.size; r++) {
        board.push([]);
        for (let c = 0; c < this.size; c++) {
          let tile = this.randomTile();
          let guard = 0;
          while (guard++ < 30 && this.makesRun(board, r, c, tile.type)) tile = this.randomTile();
          board[r].push(tile);
        }
      }
      if (this.findGroups(board).length === 0 && this.findMove(board)) return board;
    }
    throw new Error('Cannot build a playable board');
  }

  makesRun(board, r, c, type) {
    const same = (rr, cc) => board[rr] && board[rr][cc] && board[rr][cc].type === type;
    if (same(r, c - 1) && same(r, c - 2)) return true;
    if (same(r - 1, c) && same(r - 2, c)) return true;
    return false;
  }

  cloneBoard(board = this.board) {
    return board.map(row => row.map(tile => (tile ? { ...tile } : null)));
  }

  findGroups(board) {
    const groups = [];
    const n = this.size;
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        const tile = board[r][c];
        let end = c;
        while (tile && end + 1 < n && board[r][end + 1] && board[r][end + 1].type === tile.type) end++;
        if (tile && end - c + 1 >= 3) {
          const cells = [];
          for (let k = c; k <= end; k++) cells.push({ r, c: k });
          groups.push({ type: tile.type, dir: 'h', cells });
        }
        c = end + 1;
      }
    }
    for (let c = 0; c < n; c++) {
      let r = 0;
      while (r < n) {
        const tile = board[r][c];
        let end = r;
        while (tile && end + 1 < n && board[end + 1][c] && board[end + 1][c].type === tile.type) end++;
        if (tile && end - r + 1 >= 3) {
          const cells = [];
          for (let k = r; k <= end; k++) cells.push({ r: k, c });
          groups.push({ type: tile.type, dir: 'v', cells });
        }
        r = end + 1;
      }
    }
    return groups;
  }

  findMove(board = this.board) {
    const n = this.size;
    const attempt = (r1, c1, r2, c2) => {
      this.swapCells(board, r1, c1, r2, c2);
      const works = this.isColorBomb(board[r1][c1]) || this.isColorBomb(board[r2][c2]) || this.findGroups(board).length > 0;
      this.swapCells(board, r1, c1, r2, c2);
      return works;
    };
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (c + 1 < n && attempt(r, c, r, c + 1)) return { r1: r, c1: c, r2: r, c2: c + 1 };
        if (r + 1 < n && attempt(r, c, r + 1, c)) return { r1: r, c1: c, r2: r + 1, c2: c };
      }
    }
    return null;
  }

  isColorBomb(tile) {
    return !!tile && tile.special === 'color';
  }

  swapCells(board, r1, c1, r2, c2) {
    const tmp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = tmp;
  }

  trySwap(r1, c1, r2, c2) {
    if (this.state !== 'playing') return { valid: false, phases: [] };
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return { valid: false, phases: [] };
    const board = this.board;
    this.swapCells(board, r1, c1, r2, c2);
    const bombSwap = this.isColorBomb(board[r1][c1]) || this.isColorBomb(board[r2][c2]);
    if (!bombSwap && this.findGroups(board).length === 0) {
      this.swapCells(board, r1, c1, r2, c2);
      return { valid: false, phases: [] };
    }
    this.moves--;
    const phases = [];
    const swapCells = [{ r: r1, c: c1 }, { r: r2, c: c2 }];
    let forced = null;
    if (bombSwap) forced = this.bombTargets(board, r1, c1, r2, c2);
    let cascade = 0;
    while (true) {
      const phase = this.resolveStep(board, swapCells, forced, cascade + 1);
      if (!phase) break;
      forced = null;
      cascade++;
      phases.push(phase);
      swapCells.length = 0;
    }
    this.finishTurn(phases);
    return { valid: true, phases, bombSwap };
  }

  bombTargets(board, r1, c1, r2, c2) {
    const a = board[r1][c1];
    const b = board[r2][c2];
    const bomb = this.isColorBomb(a) ? { r: r1, c: c1 } : { r: r2, c: c2 };
    const other = bomb.r === r1 && bomb.c === c1 ? b : a;
    const cells = [bomb];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = board[r][c];
        if (tile && (other.special === 'color' || tile.type === other.type)) cells.push({ r, c });
      }
    }
    return cells;
  }

  resolveStep(board, swapCells, forced, cascade) {
    const groups = this.findGroups(board);
    if (groups.length === 0 && !forced) return null;
    const created = this.planSpecials(groups, swapCells);
    const createdKeys = new Set(created.map(s => s.r + ',' + s.c));
    const clearSet = new Map();
    const add = (r, c) => {
      if (r < 0 || c < 0 || r >= this.size || c >= this.size) return;
      if (!board[r][c]) return;
      clearSet.set(r + ',' + c, { r, c });
    };
    groups.forEach(g => g.cells.forEach(cell => add(cell.r, cell.c)));
    if (forced) forced.forEach(cell => add(cell.r, cell.c));
    const noActivate = new Set(createdKeys);
    if (forced) noActivate.add(forced[0].r + ',' + forced[0].c);
    const activated = this.chainSpecials(board, clearSet, noActivate, add);
    created.forEach(s => clearSet.delete(s.r + ',' + s.c));
    const cleared = Array.from(clearSet.values()).map(cell => ({ r: cell.r, c: cell.c, type: board[cell.r][cell.c].type, special: board[cell.r][cell.c].special }));
    const gain = (cleared.length * 10 + activated * 20 + created.length * 15) * cascade;
    this.score += gain;
    cleared.forEach(cell => { board[cell.r][cell.c] = null; });
    created.forEach(s => { board[s.r][s.c] = { type: s.type, special: s.special }; });
    const motion = this.collapse(board);
    return { cleared, created, falls: motion.falls, spawns: motion.spawns, gain, cascade, activated, board: this.cloneBoard(board) };
  }

  planSpecials(groups, swapCells) {
    const created = [];
    const used = new Set();
    const horizontals = groups.filter(g => g.dir === 'h');
    const verticals = groups.filter(g => g.dir === 'v');
    horizontals.forEach(h => {
      verticals.forEach(v => {
        if (h.type !== v.type || used.has(h) || used.has(v)) return;
        const shared = h.cells.find(a => v.cells.some(b => b.r === a.r && b.c === a.c));
        if (!shared) return;
        used.add(h);
        used.add(v);
        created.push({ r: shared.r, c: shared.c, type: h.type, special: 'blast' });
      });
    });
    groups.forEach(g => {
      if (used.has(g) || g.cells.length < 4) return;
      const pivot = g.cells.find(cell => swapCells.some(s => s.r === cell.r && s.c === cell.c)) || g.cells[Math.floor(g.cells.length / 2)];
      let special = g.dir === 'h' ? 'row' : 'col';
      if (g.cells.length >= 5) special = 'color';
      created.push({ r: pivot.r, c: pivot.c, type: g.type, special });
    });
    return created;
  }

  chainSpecials(board, clearSet, protectedKeys, add) {
    let activated = 0;
    const handled = new Set();
    let grew = true;
    while (grew) {
      grew = false;
      Array.from(clearSet.values()).forEach(cell => {
        const key = cell.r + ',' + cell.c;
        const tile = board[cell.r][cell.c];
        if (!tile || !tile.special || handled.has(key) || protectedKeys.has(key)) return;
        handled.add(key);
        activated++;
        grew = true;
        if (tile.special === 'row') {
          for (let c = 0; c < this.size; c++) add(cell.r, c);
        } else if (tile.special === 'col') {
          for (let r = 0; r < this.size; r++) add(r, cell.c);
        } else if (tile.special === 'blast') {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) add(cell.r + dr, cell.c + dc);
          }
        } else if (tile.special === 'color') {
          for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
              if (board[r][c] && board[r][c].type === tile.type) add(r, c);
            }
          }
        }
      });
    }
    return activated;
  }

  collapse(board) {
    const falls = [];
    const spawns = [];
    for (let c = 0; c < this.size; c++) {
      let write = this.size - 1;
      for (let r = this.size - 1; r >= 0; r--) {
        if (!board[r][c]) continue;
        if (r !== write) {
          board[write][c] = board[r][c];
          board[r][c] = null;
          falls.push({ c, fromR: r, toR: write });
        }
        write--;
      }
      const missing = write + 1;
      for (let r = write; r >= 0; r--) {
        const tile = this.randomTile();
        board[r][c] = tile;
        spawns.push({ c, toR: r, fromR: r - missing, type: tile.type, special: null });
      }
    }
    return { falls, spawns };
  }

  finishTurn(phases) {
    if (!this.findMove()) {
      phases.push(this.shuffleBoard());
    }
    if (this.score >= this.target) {
      this.levelBonus = this.moves * 50;
      this.score += this.levelBonus;
      this.state = 'levelClear';
    } else if (this.moves <= 0) {
      this.state = 'over';
    }
  }

  shuffleBoard() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const tiles = [];
      this.board.forEach(row => row.forEach(tile => tiles.push(tile)));
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
      const next = [];
      for (let r = 0; r < this.size; r++) next.push(tiles.slice(r * this.size, (r + 1) * this.size));
      if (this.findGroups(next).length === 0 && this.findMove(next)) {
        this.board = next;
        return { shuffle: true, board: this.cloneBoard(next) };
      }
    }
    this.board = this.freshBoard();
    return { shuffle: true, board: this.cloneBoard() };
  }
};
