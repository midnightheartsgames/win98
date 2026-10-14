class AppCalculator {
  constructor() {
    this.mode = 'standard';
    this.displayVal = '0';
    this.waitingForOperand = false;
    this.memory = 0;
    this.error = null;
    this.grouping = false;
    this.base = 10;
    this.wordSize = 32;
    this.angle = 'deg';
    this.inv = false;
    this.hyp = false;
    this.fe = false;
    this.pending = [];
    this.parens = [];
    this.lastOp = null;
    this.lastOperand = null;
    this.stats = [];
    this.win = null;
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  get decimalSep() {
    return window.i18n && window.i18n.getLanguage() === 'en' ? '.' : ',';
  }

  get groupSep() {
    return window.i18n && window.i18n.getLanguage() === 'en' ? ',' : ' ';
  }

  get prevVal() {
    return this.pending.length ? this.pending[this.pending.length - 1].value : null;
  }

  get operator() {
    return this.pending.length ? this.pending[this.pending.length - 1].op : null;
  }

  open() {
    const existing = window.winManager.windows.get('app_calculator');
    if (existing) {
      window.winManager.createWindow({ id: 'app_calculator' });
      return;
    }
    this.win = window.winManager.createWindow({
      id: 'app_calculator',
      title: this.t('calc.title'),
      icon: 'calculator',
      width: 263,
      height: 251,
      resizable: false,
      content: '<div class="calc-container"></div>'
    });
    this.bindKeyboard();
    this.render();
  }

  render() {
    const win = this.win;
    if (!win) return;
    const root = win.element.querySelector('.calc-container');
    root.className = 'calc-container calc-' + this.mode;
    root.innerHTML = this.buildMenu() + this.buildDisplay() + (this.mode === 'scientific' ? this.buildScientific() : this.buildStandard());
    this.attachEvents(root);
    this.updateDisplay();
    this.fitWindow(root);
  }

  fitWindow(root) {
    const el = this.win.element;
    el.style.width = 'auto';
    el.style.height = 'auto';
    const w = Math.ceil(root.scrollWidth) + 6;
    const h = Math.ceil(root.scrollHeight) + 25;
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.minWidth = w + 'px';
    el.style.minHeight = h + 'px';
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth - 4) el.style.left = Math.max(0, window.innerWidth - w - 4) + 'px';
  }

  buildMenu() {
    const std = this.mode === 'standard';
    return `
      <div class="win-menubar calc-menubar">
        <div class="win-menu-item">${this.t('calc.menuEdit')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="copy">${this.t('calc.menuCopy')} <span>Ctrl+C</span></div>
            <div class="win-dropdown-option" data-cmd="paste">${this.t('calc.menuPaste')} <span>Ctrl+V</span></div>
          </div>
        </div>
        <div class="win-menu-item">${this.t('calc.menuView')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option is-radio${std ? ' is-checked' : ''}" data-cmd="standard">${this.t('calc.menuStandard')}</div>
            <div class="win-dropdown-option is-radio${std ? '' : ' is-checked'}" data-cmd="scientific">${this.t('calc.menuScientific')}</div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option${this.grouping ? ' is-checked' : ''}" data-cmd="grouping">${this.t('calc.menuGrouping')}</div>
          </div>
        </div>
        <div class="win-menu-item">${this.t('calc.menuHelp')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="help">${this.t('calc.menuHelpTopics')}</div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option" data-cmd="about">${this.t('calc.menuAbout')}</div>
          </div>
        </div>
      </div>`;
  }

  buildDisplay() {
    return '<div class="calc-display-wrap"><div class="calc-display">0,</div></div>';
  }

  key(label, key, tone, extra = '') {
    return `<button class="calc-btn calc-${tone}" data-key="${key}"${extra}>${label}</button>`;
  }

  buildStandard() {
    const k = (l, key, tone) => this.key(l, key, tone);
    return `
      <div class="calc-top-row">
        <div class="calc-mem-box"></div>
        <div class="calc-clear-keys">
          ${k('Backspace', 'backspace', 'red')}${k('CE', 'ce', 'red')}${k('C', 'c', 'red')}
        </div>
      </div>
      <div class="calc-keys">
        <div class="calc-mem-col">
          ${k('MC', 'mc', 'red')}${k('MR', 'mr', 'red')}${k('MS', 'ms', 'red')}${k('M+', 'm+', 'red')}
        </div>
        <div class="calc-num-grid">
          ${k('7', '7', 'blue')}${k('8', '8', 'blue')}${k('9', '9', 'blue')}${k('/', '/', 'red')}${k('sqrt', 'sqrt', 'blue')}
          ${k('4', '4', 'blue')}${k('5', '5', 'blue')}${k('6', '6', 'blue')}${k('*', '*', 'red')}${k('%', '%', 'blue')}
          ${k('1', '1', 'blue')}${k('2', '2', 'blue')}${k('3', '3', 'blue')}${k('-', '-', 'red')}${k('1/x', '1/x', 'blue')}
          ${k('0', '0', 'blue')}${k('+/-', '+/-', 'blue')}${k(this.decimalSep, '.', 'blue')}${k('+', '+', 'red')}${k('=', '=', 'red')}
        </div>
      </div>`;
  }

  buildScientific() {
    const k = (l, key, tone) => this.key(l, key, tone);
    const radio = (name, value, label, checked) => `<label class="calc-opt"><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}><span>${label}</span></label>`;
    const dec = this.base === 10;
    const second = dec
      ? radio('calc-angle', 'deg', 'Degrees', this.angle === 'deg') + radio('calc-angle', 'rad', 'Radians', this.angle === 'rad') + radio('calc-angle', 'grad', 'Grads', this.angle === 'grad')
      : radio('calc-word', '32', 'Dword', this.wordSize === 32) + radio('calc-word', '16', 'Word', this.wordSize === 16) + radio('calc-word', '8', 'Byte', this.wordSize === 8);
    const hexKeys = ['A', 'B', 'C', 'D', 'E', 'F'].map(h => k(h, h, 'blue')).join('');
    return `
      <div class="calc-sci-row">
        <div class="calc-group calc-bases">
          ${radio('calc-base', '16', 'Hex', this.base === 16)}${radio('calc-base', '10', 'Dec', this.base === 10)}${radio('calc-base', '8', 'Oct', this.base === 8)}${radio('calc-base', '2', 'Bin', this.base === 2)}
        </div>
        <div class="calc-group calc-angles">${second}</div>
      </div>
      <div class="calc-sci-row">
        <div class="calc-group calc-invhyp">
          <label class="calc-opt"><input type="checkbox" class="calc-inv"${this.inv ? ' checked' : ''}><span>Inv</span></label>
          <label class="calc-opt"><input type="checkbox" class="calc-hyp"${this.hyp ? ' checked' : ''}><span>Hyp</span></label>
        </div>
        <div class="calc-paren-box"></div>
        <div class="calc-mem-box"></div>
        <div class="calc-clear-keys">
          ${k('Backspace', 'backspace', 'red')}${k('CE', 'ce', 'red')}${k('C', 'c', 'red')}
        </div>
      </div>
      <div class="calc-sci-keys">
        <div class="calc-block calc-stat-col">
          ${k('Sta', 'sta', 'blue')}${k('Ave', 'ave', 'blue')}${k('Sum', 'sum', 'blue')}${k('s', 's', 'blue')}${k('Dat', 'dat', 'blue')}
        </div>
        <div class="calc-block calc-fn-grid">
          ${k('F-E', 'fe', 'purple')}${k('(', '(', 'purple')}${k(')', ')', 'purple')}
          ${k('dms', 'dms', 'purple')}${k('Exp', 'exp', 'purple')}${k('ln', 'ln', 'purple')}
          ${k('sin', 'sin', 'purple')}${k('x^y', 'pow', 'purple')}${k('log', 'log', 'purple')}
          ${k('cos', 'cos', 'purple')}${k('x^3', 'cube', 'purple')}${k('n!', 'fact', 'purple')}
          ${k('tan', 'tan', 'purple')}${k('x^2', 'sqr', 'purple')}${k('1/x', '1/x', 'purple')}
        </div>
        <div class="calc-block calc-mem-col">
          ${k('MC', 'mc', 'red')}${k('MR', 'mr', 'red')}${k('MS', 'ms', 'red')}${k('M+', 'm+', 'red')}${k('pi', 'pi', 'blue')}
        </div>
        <div class="calc-block calc-sci-grid">
          ${k('7', '7', 'blue')}${k('8', '8', 'blue')}${k('9', '9', 'blue')}${k('/', '/', 'red')}${k('Mod', 'mod', 'red')}${k('And', 'and', 'red')}
          ${k('4', '4', 'blue')}${k('5', '5', 'blue')}${k('6', '6', 'blue')}${k('*', '*', 'red')}${k('Or', 'or', 'red')}${k('Xor', 'xor', 'red')}
          ${k('1', '1', 'blue')}${k('2', '2', 'blue')}${k('3', '3', 'blue')}${k('-', '-', 'red')}${k('Lsh', 'lsh', 'red')}${k('Not', 'not', 'red')}
          ${k('0', '0', 'blue')}${k('+/-', '+/-', 'blue')}${k(this.decimalSep, '.', 'blue')}${k('+', '+', 'red')}${k('=', '=', 'red')}${k('Int', 'int', 'red')}
          ${hexKeys}
        </div>
      </div>`;
  }

  attachEvents(root) {
    root.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.addEventListener('click', () => {
        if (window.soundSys) window.soundSys.playClick();
        this.press(btn.dataset.key);
      });
    });
    root.querySelectorAll('[data-cmd]').forEach(opt => {
      opt.addEventListener('click', () => this.command(opt.dataset.cmd));
    });
    root.querySelectorAll('input[name="calc-base"]').forEach(r => r.addEventListener('change', () => this.setBase(Number(r.value))));
    root.querySelectorAll('input[name="calc-angle"]').forEach(r => r.addEventListener('change', () => { this.angle = r.value; }));
    root.querySelectorAll('input[name="calc-word"]').forEach(r => r.addEventListener('change', () => {
      const value = this.currentValue();
      this.wordSize = Number(r.value);
      this.setValue(value);
      this.updateDisplay();
    }));
    const inv = root.querySelector('.calc-inv');
    const hyp = root.querySelector('.calc-hyp');
    if (inv) inv.addEventListener('change', () => { this.inv = inv.checked; });
    if (hyp) hyp.addEventListener('change', () => { this.hyp = hyp.checked; });
  }

  bindKeyboard() {
    const win = this.win;
    const onKeyDown = (e) => {
      if (window.winManager.activeWindowId !== win.id) return;
      if (e.target && e.target.closest && e.target.closest('input[type="text"], textarea')) return;
      const key = this.mapKey(e);
      if (!key) return;
      e.preventDefault();
      if (key.startsWith('cmd:')) this.command(key.slice(4));
      else this.press(key);
      this.flashKey(key);
    };
    window.addEventListener('keydown', onKeyDown);
    win.onClose = () => {
      window.removeEventListener('keydown', onKeyDown);
      if (window.winManager.windows.has('app_calc_stats')) window.winManager.closeWindow('app_calc_stats');
      this.win = null;
    };
  }

  mapKey(e) {
    const k = e.key;
    const sci = this.mode === 'scientific';
    if (e.ctrlKey) {
      const map = { c: 'cmd:copy', v: 'cmd:paste', m: 'ms', r: 'mr', p: 'm+', l: 'mc', s: 'sta', a: 'ave', t: 'sum', d: 's' };
      return map[k.toLowerCase()] || null;
    }
    if (/^[0-9]$/.test(k)) return k;
    if (sci && this.base === 16 && /^[a-fA-F]$/.test(k)) return k.toUpperCase();
    const common = {
      '.': '.', ',': '.', '+': '+', '-': '-', '*': '*', '/': '/', 'Enter': '=', '=': '=',
      'Backspace': 'backspace', 'Escape': 'c', 'Delete': 'ce', 'F9': '+/-', 'r': '1/x', 'R': '1/x'
    };
    if (common[k]) return common[k];
    if (!sci) {
      if (k === '@') return 'sqrt';
      if (k === '%') return '%';
      return null;
    }
    const scientific = {
      '%': 'mod', '&': 'and', '|': 'or', '^': 'xor', '<': 'lsh', '~': 'not', ';': 'int',
      '(': '(', ')': ')', '@': 'sqr', '#': 'cube', '!': 'fact', 's': 'sin', 'o': 'cos', 't': 'tan',
      'n': 'ln', 'l': 'log', 'y': 'pow', 'p': 'pi', 'x': 'exp', 'v': 'fe', 'm': 'dms', 'i': 'toggle-inv', 'h': 'toggle-hyp',
      'F5': 'base-16', 'F6': 'base-10', 'F7': 'base-8', 'F8': 'base-2', 'F2': 'angle-deg', 'F3': 'angle-rad', 'F4': 'angle-grad',
      'Insert': 'dat'
    };
    return scientific[k] || null;
  }

  flashKey(key) {
    if (!this.win) return;
    const btn = this.win.element.querySelector(`.calc-btn[data-key="${CSS.escape(key)}"]`);
    if (!btn) return;
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 110);
  }

  command(cmd) {
    if (cmd === 'copy') {
      if (navigator.clipboard) navigator.clipboard.writeText(this.displayVal).catch(() => {});
    } else if (cmd === 'paste') {
      if (!navigator.clipboard || !navigator.clipboard.readText) return;
      navigator.clipboard.readText().then(text => {
        const num = parseFloat(String(text).replace(',', '.'));
        if (!isNaN(num)) {
          this.setValue(num);
          this.waitingForOperand = true;
          this.updateDisplay();
        }
      }).catch(() => {});
    } else if (cmd === 'standard' || cmd === 'scientific') {
      if (this.mode === cmd) return;
      if (cmd === 'standard' && this.base !== 10) this.setBase(10);
      this.mode = cmd;
      this.pending = [];
      this.parens = [];
      this.render();
    } else if (cmd === 'grouping') {
      this.grouping = !this.grouping;
      this.render();
    } else if (cmd === 'help') {
      if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp();
    } else if (cmd === 'about') {
      window.winManager.openDialog({ title: this.t('calc.aboutTitle'), icon: 'calculator', message: this.t('calc.aboutText') });
    }
  }

  isHexDigit(key) {
    return /^[A-F]$/.test(key);
  }

  digitAllowed(key) {
    const v = parseInt(key, 16);
    return !isNaN(v) && v < this.base;
  }

  press(key) {
    if (key === 'toggle-inv' || key === 'toggle-hyp') {
      const prop = key === 'toggle-inv' ? 'inv' : 'hyp';
      this[prop] = !this[prop];
      this.syncChecks();
      return;
    }
    if (key.startsWith('base-')) {
      this.setBase(Number(key.slice(5)));
      return;
    }
    if (key.startsWith('angle-')) {
      if (this.base !== 10) return;
      this.angle = key.slice(6);
      if (this.win) {
        const r = this.win.element.querySelector(`input[name="calc-angle"][value="${this.angle}"]`);
        if (r) r.checked = true;
      }
      return;
    }
    this.handleKey(key);
    this.updateDisplay();
  }

  handleKey(key) {
    if (this.error && !['c', 'ce', 'backspace'].includes(key) && !(key >= '0' && key <= '9')) return;
    if (this.error) {
      this.error = null;
      if (key === 'c' || key === 'ce' || key === 'backspace') {
        this.clearAll();
        return;
      }
      this.clearAll();
    }

    if (/^[0-9]$/.test(key) || this.isHexDigit(key)) {
      if (!this.digitAllowed(key)) return;
      this.lastInput = 'digit';
      if (this.waitingForOperand || this.displayVal === '0') {
        this.displayVal = key;
        this.waitingForOperand = false;
      } else if (this.displayVal.replace(/[-.e+]/g, '').length < 32) {
        this.displayVal += key;
      }
      return;
    }

    switch (key) {
      case '.':
        if (this.base !== 10) return;
        if (this.waitingForOperand) {
          this.displayVal = '0.';
          this.waitingForOperand = false;
        } else if (!this.displayVal.includes('.') && !this.displayVal.includes('e')) {
          this.displayVal += '.';
        }
        return;
      case 'exp':
        if (this.base !== 10) return;
        if (this.waitingForOperand) {
          this.displayVal = '0';
          this.waitingForOperand = false;
        }
        if (!this.displayVal.includes('e')) this.displayVal += 'e+';
        return;
      case '+/-':
        if (this.displayVal.includes('e') && !this.waitingForOperand) {
          this.displayVal = this.displayVal.replace(/e([+-])/, (m, s) => 'e' + (s === '+' ? '-' : '+'));
          return;
        }
        if (this.displayVal === '0') return;
        if (this.base === 10 && !this.waitingForOperand) {
          this.displayVal = this.displayVal.startsWith('-') ? this.displayVal.slice(1) : '-' + this.displayVal;
        } else {
          this.setValue(-this.currentValue());
        }
        return;
      case 'backspace':
        if (this.waitingForOperand) return;
        this.displayVal = this.displayVal.slice(0, -1).replace(/e$/, '');
        if (this.displayVal === '' || this.displayVal === '-') this.displayVal = '0';
        return;
      case 'ce':
        this.displayVal = '0';
        this.waitingForOperand = false;
        return;
      case 'c':
        this.clearAll();
        return;
      case 'mc':
        this.memory = 0;
        return;
      case 'mr':
        this.setValue(this.memory);
        this.waitingForOperand = true;
        return;
      case 'ms':
        this.memory = this.currentValue();
        this.waitingForOperand = true;
        return;
      case 'm+':
        this.memory += this.currentValue();
        this.waitingForOperand = true;
        return;
      case 'pi':
        this.setValue(this.inv ? Math.PI * 2 : Math.PI);
        this.waitingForOperand = true;
        this.resetInvHyp();
        return;
      case 'fe':
        this.fe = !this.fe;
        this.setValue(this.currentValue());
        this.waitingForOperand = true;
        return;
      case '(':
        this.parens.push(this.pending);
        this.pending = [];
        this.waitingForOperand = true;
        return;
      case ')':
        if (!this.parens.length) return;
        this.setValue(this.collapse(this.currentValue(), -Infinity));
        this.pending = this.parens.pop();
        this.waitingForOperand = true;
        return;
      case '=':
        this.equals();
        return;
      case '%':
        this.percent();
        return;
      case 'sta':
        this.openStats();
        return;
      case 'dat':
        if (!window.winManager.windows.has('app_calc_stats')) return;
        this.stats.push(this.currentValue());
        this.waitingForOperand = true;
        this.refreshStats();
        return;
      case 'ave':
      case 'sum':
      case 's':
        this.statFunction(key);
        return;
    }

    if (this.binaryOps[key]) {
      this.binary(key);
      return;
    }
    this.unary(key);
  }

  get binaryOps() {
    return { or: 1, xor: 2, and: 3, '+': 4, '-': 4, '*': 5, '/': 5, mod: 5, lsh: 6, pow: 7 };
  }

  clearAll() {
    this.displayVal = '0';
    this.pending = [];
    this.parens = [];
    this.waitingForOperand = false;
    this.lastOp = null;
    this.lastOperand = null;
    this.error = null;
  }

  precedence(op) {
    if (this.mode !== 'scientific') return 1;
    return this.binaryOps[op];
  }

  binary(op) {
    const value = this.currentValue();
    if (this.waitingForOperand && this.pending.length && this.lastInput === 'op') {
      this.pending[this.pending.length - 1].op = this.resolveOp(op);
      return;
    }
    const resolved = this.resolveOp(op);
    const result = this.collapse(value, this.precedence(op));
    if (this.error) return;
    this.pending.push({ value: result, op: resolved });
    this.setValue(result);
    this.waitingForOperand = true;
    this.lastInput = 'op';
    this.resetInvHyp();
  }

  resolveOp(op) {
    if (op === 'pow' && this.inv) return 'root';
    if (op === 'lsh' && this.inv) return 'rsh';
    return op;
  }

  collapse(value, minPrecedence) {
    let result = value;
    while (this.pending.length) {
      const top = this.pending[this.pending.length - 1];
      const prec = this.precedence(top.op === 'root' ? 'pow' : top.op === 'rsh' ? 'lsh' : top.op);
      if (prec < minPrecedence) break;
      this.pending.pop();
      result = this.apply(top.value, top.op, result);
      if (this.error) return 0;
    }
    return result;
  }

  equals() {
    let value = this.currentValue();
    if (this.pending.length || this.parens.length) {
      const last = this.pending[this.pending.length - 1];
      if (last) {
        this.lastOp = last.op;
        this.lastOperand = value;
      }
      while (this.parens.length) {
        value = this.collapse(value, -Infinity);
        this.pending = this.parens.pop();
      }
      value = this.collapse(value, -Infinity);
    } else if (this.lastOp) {
      value = this.apply(value, this.lastOp, this.lastOperand);
    }
    if (this.error) return;
    this.setValue(value);
    this.waitingForOperand = true;
    this.lastInput = 'eq';
  }

  percent() {
    const value = this.currentValue();
    if (!this.pending.length) {
      this.setValue(0);
    } else {
      const base = this.pending[this.pending.length - 1].value;
      this.setValue(base * value / 100);
    }
    this.waitingForOperand = true;
  }

  apply(a, op, b) {
    const int = (x) => Math.trunc(x);
    let r;
    switch (op) {
      case '+': r = a + b; break;
      case '-': r = a - b; break;
      case '*': r = a * b; break;
      case '/':
        if (b === 0) return this.fail('calc.errDivZero');
        r = this.base === 10 ? a / b : int(a / b);
        break;
      case 'mod':
        if (b === 0) return this.fail('calc.errDivZero');
        r = a % b;
        break;
      case 'pow': r = Math.pow(a, b); break;
      case 'root':
        if (b === 0) return this.fail('calc.errInvalid');
        r = a < 0 && Math.abs(b % 2) === 1 ? -Math.pow(-a, 1 / b) : Math.pow(a, 1 / b);
        break;
      case 'and': r = this.toWord(int(a) & int(b)); break;
      case 'or': r = this.toWord(int(a) | int(b)); break;
      case 'xor': r = this.toWord(int(a) ^ int(b)); break;
      case 'lsh': r = this.toWord(int(a) * Math.pow(2, int(b))); break;
      case 'rsh': r = Math.floor(int(a) / Math.pow(2, int(b))); break;
      default: r = b;
    }
    if (!isFinite(r) || isNaN(r)) return this.fail('calc.errInvalid');
    return r;
  }

  toRadians(x) {
    if (this.angle === 'deg') return x * Math.PI / 180;
    if (this.angle === 'grad') return x * Math.PI / 200;
    return x;
  }

  fromRadians(x) {
    if (this.angle === 'deg') return x * 180 / Math.PI;
    if (this.angle === 'grad') return x * 200 / Math.PI;
    return x;
  }

  gamma(z) {
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
    const g = 7;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }

  unary(key) {
    const x = this.currentValue();
    const inv = this.inv;
    const hyp = this.hyp;
    let r;
    const round = (v) => Math.abs(v) < 1e-15 ? 0 : v;
    switch (key) {
      case 'sqrt':
        if (x < 0) return this.fail('calc.errInvalid');
        r = Math.sqrt(x);
        break;
      case '1/x':
        if (x === 0) return this.fail('calc.errDivZero');
        r = 1 / x;
        break;
      case 'sqr': r = inv ? (x < 0 ? this.fail('calc.errInvalid') : Math.sqrt(x)) : x * x; break;
      case 'cube': r = inv ? Math.cbrt(x) : x * x * x; break;
      case 'ln':
        if (inv) r = Math.exp(x);
        else if (x <= 0) return this.fail('calc.errInvalid');
        else r = Math.log(x);
        break;
      case 'log':
        if (inv) r = Math.pow(10, x);
        else if (x <= 0) return this.fail('calc.errInvalid');
        else r = Math.log10(x);
        break;
      case 'fact':
        if (x < 0 && Number.isInteger(x) || x > 170) return this.fail('calc.errInvalid');
        if (Number.isInteger(x)) {
          r = 1;
          for (let i = 2; i <= x; i++) r *= i;
        } else {
          r = this.gamma(x + 1);
        }
        break;
      case 'sin':
      case 'cos':
      case 'tan': {
        if (hyp) {
          const fn = inv ? { sin: Math.asinh, cos: Math.acosh, tan: Math.atanh }[key] : { sin: Math.sinh, cos: Math.cosh, tan: Math.tanh }[key];
          r = fn(x);
        } else if (inv) {
          if (key !== 'tan' && Math.abs(x) > 1) return this.fail('calc.errInvalid');
          r = this.fromRadians({ sin: Math.asin, cos: Math.acos, tan: Math.atan }[key](x));
        } else {
          if (key === 'tan' && this.angle === 'deg' && Math.abs(x % 180) === 90) return this.fail('calc.errInvalid');
          r = round({ sin: Math.sin, cos: Math.cos, tan: Math.tan }[key](this.toRadians(x)));
        }
        break;
      }
      case 'dms': {
        if (inv) {
          const sign = x < 0 ? -1 : 1;
          const a = Math.abs(x);
          const d = Math.floor(a);
          const m = Math.floor(Math.round((a - d) * 100 * 1e9) / 1e9);
          const s = (a - d - m / 100) * 10000;
          r = sign * (d + m / 60 + s / 3600);
        } else {
          const sign = x < 0 ? -1 : 1;
          const a = Math.abs(x);
          const d = Math.floor(a);
          const mf = (a - d) * 60;
          const m = Math.floor(mf);
          const s = (mf - m) * 60;
          r = sign * (d + m / 100 + s / 10000);
        }
        break;
      }
      case 'int': r = inv ? x - Math.trunc(x) : Math.trunc(x); break;
      case 'not': r = this.toWord(~Math.trunc(x)); break;
      default: return;
    }
    if (this.error) return;
    if (!isFinite(r) || isNaN(r)) return this.fail('calc.errInvalid');
    this.setValue(r);
    this.waitingForOperand = true;
    this.lastInput = 'unary';
    this.resetInvHyp();
  }

  fail(key) {
    this.error = this.t(key);
    this.pending = [];
    this.parens = [];
    this.waitingForOperand = true;
    return NaN;
  }

  resetInvHyp() {
    if (!this.inv && !this.hyp) return;
    this.inv = false;
    this.hyp = false;
    this.syncChecks();
  }

  syncChecks() {
    if (!this.win) return;
    const inv = this.win.element.querySelector('.calc-inv');
    const hyp = this.win.element.querySelector('.calc-hyp');
    if (inv) inv.checked = this.inv;
    if (hyp) hyp.checked = this.hyp;
  }

  toWord(v) {
    const mod = Math.pow(2, this.wordSize);
    let r = v % mod;
    if (r < 0) r += mod;
    return r;
  }

  currentValue() {
    if (this.base === 10) {
      const v = parseFloat(this.displayVal.replace(/e[+-]?$/, ''));
      return isNaN(v) ? 0 : v;
    }
    const v = parseInt(this.displayVal, this.base);
    return isNaN(v) ? 0 : v;
  }

  setValue(v) {
    if (this.base !== 10) {
      this.displayVal = this.toWord(Math.trunc(v)).toString(this.base).toUpperCase();
      return;
    }
    if (v === 0) {
      this.displayVal = '0';
      return;
    }
    const abs = Math.abs(v);
    if (this.fe || abs >= 1e32 || abs < 1e-31) {
      this.displayVal = v.toExponential().replace(/\.?0+e/, 'e');
      return;
    }
    let s = String(parseFloat(v.toPrecision(15)));
    if (s.includes('e')) {
      const [m, e] = s.split('e');
      const exp = Number(e);
      const digits = m.replace('-', '').replace('.', '');
      const neg = m.startsWith('-') ? '-' : '';
      if (exp > 0) s = neg + digits.padEnd(exp + 1, '0');
      else s = neg + '0.' + '0'.repeat(-exp - 1) + digits;
    }
    this.displayVal = s;
  }

  setBase(base) {
    if (this.base === base) return;
    const value = this.currentValue();
    const wasDec = this.base === 10;
    this.base = base;
    this.setValue(wasDec ? Math.trunc(value) : value);
    this.waitingForOperand = true;
    if (this.win && this.mode === 'scientific') this.render();
  }

  formatDisplay() {
    if (this.error) return this.error;
    let s = this.displayVal;
    if (this.base !== 10) {
      if (this.grouping) {
        const size = this.base === 16 ? 4 : this.base === 2 ? 8 : 3;
        s = s.replace(new RegExp(`\\B(?=([0-9A-F]{${size}})+$)`, 'g'), ' ');
      }
      return s;
    }
    let mantissa = s;
    let exponent = '';
    const eIndex = s.indexOf('e');
    if (eIndex >= 0) {
      mantissa = s.slice(0, eIndex);
      exponent = s.slice(eIndex);
    }
    const neg = mantissa.startsWith('-');
    if (neg) mantissa = mantissa.slice(1);
    let [intPart, frac] = mantissa.split('.');
    if (this.grouping) intPart = intPart.replace(/\B(?=(\d{3})+$)/g, this.groupSep);
    const out = (neg ? '-' : '') + intPart + this.decimalSep + (frac || '');
    return out + exponent;
  }

  updateDisplay() {
    if (!this.win) return;
    const el = this.win.element;
    const display = el.querySelector('.calc-display');
    if (display) display.textContent = this.formatDisplay();
    const mem = el.querySelector('.calc-mem-box');
    if (mem) mem.textContent = this.memory !== 0 ? 'M' : '';
    const paren = el.querySelector('.calc-paren-box');
    if (paren) paren.textContent = this.parens.length ? '(=' + this.parens.length : '';
    const statsOpen = window.winManager.windows.has('app_calc_stats');
    el.querySelectorAll('.calc-btn[data-key="ave"], .calc-btn[data-key="sum"], .calc-btn[data-key="s"], .calc-btn[data-key="dat"]').forEach(b => {
      b.disabled = !statsOpen;
    });
    el.querySelectorAll('.calc-btn').forEach(b => {
      const k = b.dataset.key;
      if (/^[0-9A-F]$/.test(k)) b.disabled = !this.digitAllowed(k);
      if (k === '.' || k === 'exp' || k === 'fe' || k === 'dms' || ['sin', 'cos', 'tan', 'ln', 'log', 'pi', 'sqr', 'cube', 'pow', 'fact', 'ave', 'sum', 's', 'dat', 'sta'].includes(k)) {
        if (this.mode === 'scientific' && this.base !== 10) b.disabled = true;
      }
    });
  }

  openStats() {
    if (window.winManager.windows.has('app_calc_stats')) {
      window.winManager.createWindow({ id: 'app_calc_stats' });
      return;
    }
    const win = window.winManager.createWindow({
      id: 'app_calc_stats',
      title: this.t('calc.statsTitle'),
      icon: 'calculator',
      width: 196,
      height: 196,
      resizable: false,
      minimizable: false,
      maximizable: false,
      content: `
        <div class="calc-stats">
          <div class="calc-stats-list" tabindex="0"></div>
          <div class="calc-stats-buttons">
            <button class="win-btn" data-stat="ret">RET</button>
            <button class="win-btn" data-stat="load">LOAD</button>
            <button class="win-btn" data-stat="cd">CD</button>
            <button class="win-btn" data-stat="cad">CAD</button>
          </div>
          <div class="calc-stats-count">n=0</div>
        </div>`
    });
    this.statsSelected = -1;
    win.onClose = () => setTimeout(() => this.updateDisplay(), 0);
    win.element.querySelectorAll('[data-stat]').forEach(btn => btn.addEventListener('click', () => {
      const cmd = btn.dataset.stat;
      if (cmd === 'ret' && this.win) window.winManager.bringToTop(this.win.id);
      if (cmd === 'load' && this.statsSelected >= 0) {
        this.setValue(this.stats[this.statsSelected]);
        this.waitingForOperand = true;
        this.updateDisplay();
      }
      if (cmd === 'cd' && this.statsSelected >= 0) {
        this.stats.splice(this.statsSelected, 1);
        this.statsSelected = Math.min(this.statsSelected, this.stats.length - 1);
      }
      if (cmd === 'cad') {
        this.stats = [];
        this.statsSelected = -1;
      }
      this.refreshStats();
    }));
    win.element.querySelector('.calc-stats-list').addEventListener('click', (e) => {
      const row = e.target.closest('.calc-stats-row');
      if (!row) return;
      this.statsSelected = Number(row.dataset.index);
      this.refreshStats();
    });
    this.refreshStats();
    if (this.win) window.winManager.bringToTop(this.win.id);
  }

  refreshStats() {
    this.updateDisplay();
    const win = window.winManager.windows.get('app_calc_stats');
    if (!win) return;
    const list = win.element.querySelector('.calc-stats-list');
    list.innerHTML = this.stats.map((v, i) => {
      const saved = this.displayVal;
      this.setValue(v);
      const text = this.formatDisplay();
      this.displayVal = saved;
      return `<div class="calc-stats-row${i === this.statsSelected ? ' selected' : ''}" data-index="${i}">${text}</div>`;
    }).join('');
    win.element.querySelector('.calc-stats-count').textContent = 'n=' + this.stats.length;
  }

  statFunction(key) {
    const n = this.stats.length;
    const sum = this.stats.reduce((a, b) => a + b, 0);
    const sumSq = this.stats.reduce((a, b) => a + b * b, 0);
    let r = 0;
    if (key === 'sum') r = this.inv ? sumSq : sum;
    if (key === 'ave') r = n ? (this.inv ? sumSq / n : sum / n) : 0;
    if (key === 's') {
      if (this.inv) r = n ? Math.sqrt(Math.max(0, sumSq / n - (sum / n) ** 2)) : 0;
      else r = n > 1 ? Math.sqrt(Math.max(0, (sumSq - sum * sum / n) / (n - 1))) : 0;
    }
    this.setValue(r);
    this.waitingForOperand = true;
    this.resetInvHyp();
  }
}

window.appCalculator = new AppCalculator();
