const PAINT_TOOLS = ['freeselect', 'select', 'eraser', 'fill', 'picker', 'magnifier', 'pencil', 'brush', 'airbrush', 'text', 'line', 'curve', 'rect', 'polygon', 'ellipse', 'roundrect'];

class AppPaint {
  constructor() {
    this.paletteColors = [
      '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
      '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'
    ];
    this.currentFileName = null;
    this.currentPath = ['My Computer', 'C:', 'My Documents'];
    this.clipboard = null;
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  open(fileName = null, initialContent = null, filePath = null) {
    const doc = {
      fileName: fileName && fileName !== this.t('paint.untitled') ? fileName : null,
      path: (filePath || this.currentPath).slice()
    };
    this.currentFileName = doc.fileName || this.t('paint.untitled');
    if (filePath) this.currentPath = filePath;
    const win = window.winManager.createWindow({
      id: 'app_paint_' + Date.now(),
      title: this.titleFor(doc),
      icon: 'paint',
      width: 600,
      height: 460,
      minWidth: 300,
      minHeight: 260,
      content: this.buildHTML()
    });
    const session = new PaintSession(this, win, doc);
    session.load(initialContent);
    return win;
  }

  titleFor(doc) {
    const name = doc.fileName ? doc.fileName.replace(/\.(bmp|png|jpg|jpeg|gif)$/i, '') : this.t('paint.untitledName');
    return `${name} - ${this.t('paint.title')}`;
  }

  buildHTML() {
    const t = (k, ...a) => this.t(k, ...a);
    const m = (cmd, label, shortcut = '', extra = '') => `<div class="win-dropdown-option${extra}" data-cmd="${cmd}">${label}${shortcut ? ` <span>${shortcut}</span>` : ''}</div>`;
    const sep = '<div class="win-menu-separator"></div>';
    const tools = PAINT_TOOLS.map(id => `<button class="paint-tool-btn" data-tool="${id}" title="${t('paint.tool.' + id)}">${Icons['pt-' + id]}</button>`).join('');
    const swatches = this.paletteColors.map((c, i) => `<div class="paint-swatch" data-index="${i}" style="background-color:${c}"></div>`).join('');
    return `
      <div class="paint-container">
        <div class="win-menubar paint-menubar">
          <div class="win-menu-item">${t('paint.menuFile')}
            <div class="win-menu-dropdown">
              ${m('new', t('paint.menuNew'), 'Ctrl+N')}
              ${m('open', t('paint.menuOpen'), 'Ctrl+O')}
              ${m('save', t('paint.menuSave'), 'Ctrl+S')}
              ${m('saveas', t('paint.menuSaveAs'))}
              ${sep}
              ${m('print', t('paint.menuPrint'), 'Ctrl+P')}
              ${sep}
              ${m('wall-tile', t('paint.menuWallTile'))}
              ${m('wall-center', t('paint.menuWallCenter'))}
              ${sep}
              ${m('exit', t('paint.menuExit'), 'Alt+F4')}
            </div>
          </div>
          <div class="win-menu-item">${t('paint.menuEdit')}
            <div class="win-menu-dropdown">
              ${m('undo', t('paint.menuUndo'), 'Ctrl+Z')}
              ${m('redo', t('paint.menuRedo'), 'Ctrl+Y')}
              ${sep}
              ${m('cut', t('paint.menuCut'), 'Ctrl+X')}
              ${m('copy', t('paint.menuCopy'), 'Ctrl+C')}
              ${m('paste', t('paint.menuPaste'), 'Ctrl+V')}
              ${m('clearsel', t('paint.menuClearSel'), 'Del')}
              ${m('selectall', t('paint.menuSelectAll'), 'Ctrl+L')}
            </div>
          </div>
          <div class="win-menu-item">${t('paint.menuView')}
            <div class="win-menu-dropdown">
              ${m('view-tools', t('paint.menuToolBox'), 'Ctrl+T', ' is-checked')}
              ${m('view-colors', t('paint.menuColorBox'), '', ' is-checked')}
              ${m('view-status', t('paint.menuStatusBar'), '', ' is-checked')}
              ${sep}
              ${m('zoom-normal', t('paint.menuZoomNormal'), 'Ctrl+PgUp', ' is-radio is-checked')}
              ${m('zoom-large', t('paint.menuZoomLarge'), 'Ctrl+PgDn', ' is-radio')}
              ${m('grid', t('paint.menuGrid'), 'Ctrl+G')}
            </div>
          </div>
          <div class="win-menu-item">${t('paint.menuImage')}
            <div class="win-menu-dropdown">
              ${m('fliprotate', t('paint.menuFlipRotate'), 'Ctrl+R')}
              ${m('stretch', t('paint.menuStretch'), 'Ctrl+W')}
              ${m('invert', t('paint.menuInvert'), 'Ctrl+I')}
              ${m('attributes', t('paint.menuAttributes'), 'Ctrl+E')}
              ${m('clearimage', t('paint.menuClear'), 'Ctrl+Shft+N')}
              ${m('opaque', t('paint.menuOpaque'), '', ' is-checked')}
            </div>
          </div>
          <div class="win-menu-item">${t('paint.menuColors')}
            <div class="win-menu-dropdown">
              ${m('editcolors', t('paint.menuEditColors'))}
            </div>
          </div>
          <div class="win-menu-item">${t('paint.menuHelp')}
            <div class="win-menu-dropdown">
              ${m('help', t('paint.menuHelpTopics'))}
              ${sep}
              ${m('about', t('paint.menuAbout'))}
            </div>
          </div>
        </div>
        <div class="paint-workspace">
          <div class="paint-toolbox">
            <div class="paint-tools-grid">${tools}</div>
            <div class="paint-options"></div>
          </div>
          <div class="paint-canvas-viewport">
            <div class="paint-canvas-wrapper">
              <canvas class="paint-canvas" width="480" height="320"></canvas>
              <div class="paint-grid"></div>
              <svg class="paint-lasso" xmlns="http://www.w3.org/2000/svg"></svg>
              <div class="paint-canvas-handle handle-e" data-handle="e"></div>
              <div class="paint-canvas-handle handle-s" data-handle="s"></div>
              <div class="paint-canvas-handle handle-se" data-handle="se"></div>
              <div class="paint-resize-ghost"></div>
            </div>
          </div>
        </div>
        <div class="paint-palette-bar">
          <div class="paint-color-boxes">
            <div class="paint-secondary-color"></div>
            <div class="paint-primary-color"></div>
          </div>
          <div class="paint-swatches">${swatches}</div>
          <input type="color" class="paint-color-input" tabindex="-1">
        </div>
        <div class="win-statusbar paint-statusbar">
          <div class="win-status-pane grow paint-status">${t('paint.statusDefault')}</div>
          <div class="win-status-pane paint-coords"></div>
          <div class="win-status-pane paint-size"></div>
        </div>
      </div>
    `;
  }

  drawAllYourBaseMeme(canvas, ctx) {
    ctx.fillStyle = '#08140e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#123820';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(110, 120, 85, 0, Math.PI * 2);
    ctx.strokeStyle = '#1d5a32';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(110, 120, 45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#1c2833';
    ctx.fillRect(35, 140, 150, 120);
    ctx.fillStyle = '#008b8b';
    ctx.fillRect(65, 155, 90, 80);
    ctx.fillStyle = '#20b2aa';
    ctx.fillRect(75, 165, 70, 50);
    ctx.fillStyle = '#34495e';
    ctx.fillRect(75, 115, 70, 35);
    ctx.fillStyle = '#d5c4a1';
    ctx.fillRect(65, 55, 90, 70);
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.moveTo(45, 65);
    ctx.lineTo(65, 25);
    ctx.lineTo(90, 40);
    ctx.lineTo(110, 15);
    ctx.lineTo(130, 40);
    ctx.lineTo(155, 25);
    ctx.lineTo(165, 65);
    ctx.lineTo(150, 58);
    ctx.lineTo(65, 58);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(78, 75, 18, 9);
    ctx.fillStyle = '#000000';
    ctx.fillRect(84, 77, 7, 7);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(118, 70, 24, 18);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(122, 74, 16, 10);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(127, 77, 5, 4);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(142, 50, 12, 35);
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(145, 42, 6, 10);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(82, 104);
    ctx.lineTo(100, 110);
    ctx.lineTo(128, 100);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#88ffaa';
    ctx.fillText('ZERO WING (1998 MEME ARCHIVE)', 200, 35);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STATUS: INCOMING TRANSMISSION', 200, 55);
    ctx.fillStyle = '#ffff66';
    ctx.fillText('TARGET: ALL BASES IN SECTOR 98', 200, 75);
    ctx.fillStyle = '#88ccff';
    ctx.fillText('DECRYPTED AUDIO: "CATS HAS SPOKEN"', 200, 95);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.fillRect(8, canvas.height - 105, canvas.width - 16, 95);
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, canvas.height - 105, canvas.width - 16, 95);
    ctx.font = 'bold 12px "Courier New", Courier, monospace';
    ctx.fillStyle = '#39ff14';
    ctx.fillText('IN A.D. 2101 WAR WAS BEGINNING.', 20, canvas.height - 84);
    ctx.fillStyle = '#ffff33';
    ctx.fillText('CAPTAIN: WHAT HAPPEN ?', 20, canvas.height - 66);
    ctx.fillStyle = '#00ffff';
    ctx.fillText('OPERATOR: MAIN SCREEN TURN ON.', 20, canvas.height - 48);
    ctx.font = '900 13px "Courier New", Courier, monospace';
    ctx.fillStyle = '#ff3366';
    ctx.fillText('CATS: ALL YOUR BASE ARE BELONG TO US.', 20, canvas.height - 28);
  }
}

class PaintSession {
  constructor(app, win, doc) {
    this.app = app;
    this.win = win;
    this.doc = doc;
    this.el = win.element;
    this.canvas = this.el.querySelector('.paint-canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.wrapper = this.el.querySelector('.paint-canvas-wrapper');
    this.fg = '#000000';
    this.bg = '#ffffff';
    this.tool = 'pencil';
    this.prevTool = 'pencil';
    this.opts = { eraser: 1, brush: 1, airbrush: 0, line: 0, shape: 0, opaque: true };
    this.zoom = 1;
    this.grid = false;
    this.undoStack = [];
    this.redoStack = [];
    this.selection = null;
    this.drag = null;
    this.curve = null;
    this.poly = null;
    this.textBox = null;
    this.dirty = false;
    this.bind();
    this.selectTool('pencil');
    this.updateColors();
  }

  t(key, ...args) {
    return this.app.t(key, ...args);
  }

  load(content) {
    const { canvas, ctx } = this;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (this.doc.fileName === 'old_memes.bmp' || content === 'all-your-base') {
      this.app.drawAllYourBaseMeme(canvas, ctx);
    } else if (typeof content === 'string' && /^(data:|https?:|assets\/|blob:)/.test(content)) {
      const img = new Image();
      img.onload = () => {
        this.resize(img.naturalWidth || img.width, img.naturalHeight || img.height, '#ffffff');
        ctx.drawImage(img, 0, 0);
        this.undoStack = [];
      };
      img.src = content;
    }
    this.applyZoom();
  }

  $(sel) {
    return this.el.querySelector(sel);
  }

  bind() {
    const el = this.el;
    el.querySelectorAll('.paint-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
      btn.addEventListener('mouseenter', () => this.setStatus(this.t('paint.help.' + btn.dataset.tool)));
      btn.addEventListener('mouseleave', () => this.setStatus(this.t('paint.statusDefault')));
    });
    el.querySelectorAll('.paint-swatch').forEach(sw => {
      sw.addEventListener('mousedown', e => {
        e.preventDefault();
        const color = this.app.paletteColors[Number(sw.dataset.index)];
        if (e.button === 2) this.bg = color;
        else this.fg = color;
        this.updateColors();
        this.refreshSelection();
      });
      sw.addEventListener('dblclick', () => this.editColor(Number(sw.dataset.index)));
      sw.addEventListener('contextmenu', e => e.preventDefault());
    });
    el.querySelectorAll('.paint-menubar [data-cmd]').forEach(opt => {
      opt.addEventListener('click', () => this.command(opt.dataset.cmd));
    });
    this.wrapper.addEventListener('contextmenu', e => e.preventDefault());
    this.wrapper.addEventListener('mousedown', e => this.onDown(e));
    this.wrapper.addEventListener('dblclick', e => this.onDblClick(e));
    this.$('.paint-canvas-viewport').addEventListener('mousedown', e => {
      if (e.target === e.currentTarget) this.commitAll();
    });
    const onMove = e => this.onMove(e);
    const onUp = e => this.onUp(e);
    const onKey = e => this.onKey(e);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
    el.querySelectorAll('.paint-canvas-handle').forEach(h => h.addEventListener('mousedown', e => this.startResize(e, h.dataset.handle)));
    this.win.beforeClose = () => {
      if (!this.dirty || this.closing) return true;
      this.confirmDiscard(() => {
        this.closing = true;
        window.winManager.closeWindow(this.win.id);
      });
      return false;
    };
    this.win.onClose = () => {
      clearInterval(this.sprayTimer);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }

  setStatus(text) {
    this.$('.paint-status').textContent = text;
  }

  updateColors() {
    this.$('.paint-primary-color').style.backgroundColor = this.fg;
    this.$('.paint-secondary-color').style.backgroundColor = this.bg;
  }

  editColor(index) {
    const input = this.$('.paint-color-input');
    input.value = this.app.paletteColors[index] || this.fg;
    input.oninput = () => {
      this.app.paletteColors[index] = input.value;
      const sw = this.el.querySelector(`.paint-swatch[data-index="${index}"]`);
      if (sw) sw.style.backgroundColor = input.value;
      this.fg = input.value;
      this.updateColors();
    };
    input.click();
  }

  selectTool(tool) {
    if (tool !== this.tool) this.commitAll();
    if (tool === 'picker' || tool === 'magnifier') {
      if (this.tool !== 'picker' && this.tool !== 'magnifier') this.prevTool = this.tool;
    }
    this.tool = tool;
    this.el.querySelectorAll('.paint-tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    this.wrapper.dataset.tool = tool;
    this.renderOptions();
    this.setStatus(this.t('paint.help.' + tool));
  }

  renderOptions() {
    const box = this.$('.paint-options');
    const tool = this.tool;
    let html = '';
    let key = null;
    if (tool === 'freeselect' || tool === 'select' || tool === 'text') {
      key = 'opaque';
      html = `<div class="po-item po-select${this.opts.opaque ? ' on' : ''}" data-v="1"><span class="po-sel-icon opaque"></span></div>
        <div class="po-item po-select${this.opts.opaque ? '' : ' on'}" data-v="0"><span class="po-sel-icon transparent"></span></div>`;
    } else if (tool === 'eraser') {
      key = 'eraser';
      html = [4, 6, 8, 10].map((s, i) => `<div class="po-item po-eraser${this.opts.eraser === i ? ' on' : ''}" data-v="${i}"><span style="width:${s}px;height:${s}px"></span></div>`).join('');
    } else if (tool === 'magnifier') {
      key = 'zoom';
      html = [1, 2, 6, 8].map((z, i) => `<div class="po-item po-zoom${this.zoomOptionIndex() === i ? ' on' : ''}" data-v="${i}">${z}x</div>`).join('');
    } else if (tool === 'brush') {
      key = 'brush';
      html = '<div class="po-brushes">' + Array.from({ length: 12 }, (_, i) => `<div class="po-item po-brush${this.opts.brush === i ? ' on' : ''}" data-v="${i}"><canvas width="9" height="9"></canvas></div>`).join('') + '</div>';
    } else if (tool === 'airbrush') {
      key = 'airbrush';
      html = [0, 1, 2].map(i => `<div class="po-item po-spray${this.opts.airbrush === i ? ' on' : ''}" data-v="${i}"><canvas width="${[9, 17, 25][i]}" height="${[9, 17, 25][i]}"></canvas></div>`).join('');
    } else if (tool === 'line' || tool === 'curve') {
      key = 'line';
      html = [1, 2, 3, 4, 5].map((w, i) => `<div class="po-item po-line${this.opts.line === i ? ' on' : ''}" data-v="${i}"><span style="height:${w}px"></span></div>`).join('');
    } else if (['rect', 'polygon', 'ellipse', 'roundrect'].includes(tool)) {
      key = 'shape';
      html = [0, 1, 2].map(i => `<div class="po-item po-shape${this.opts.shape === i ? ' on' : ''}" data-v="${i}"><span class="po-shape-${i}"></span></div>`).join('');
    }
    box.innerHTML = html;
    box.dataset.kind = key || '';
    box.querySelectorAll('.po-brush canvas').forEach((c, i) => this.drawBrushPreview(c, i));
    box.querySelectorAll('.po-spray canvas').forEach((c, i) => this.drawSprayPreview(c, i));
    box.querySelectorAll('.po-item').forEach(item => {
      item.addEventListener('click', () => {
        const v = Number(item.dataset.v);
        if (key === 'opaque') {
          this.opts.opaque = v === 1;
          this.syncOpaqueMenu();
          this.refreshSelection();
        } else if (key === 'zoom') {
          this.setZoom([1, 2, 6, 8][v]);
          this.selectTool(this.prevTool);
          return;
        } else {
          this.opts[key] = v;
        }
        this.renderOptions();
      });
    });
  }

  zoomOptionIndex() {
    const i = [1, 2, 6, 8].indexOf(this.zoom);
    return i < 0 ? -1 : i;
  }

  drawBrushPreview(c, index) {
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000000';
    this.brushOffsets(index).forEach(([dx, dy]) => ctx.fillRect(4 + dx, 4 + dy, 1, 1));
  }

  drawSprayPreview(c, index) {
    const ctx = c.getContext('2d');
    const r = [4, 8, 12][index];
    ctx.fillStyle = '#000000';
    let seed = 7 + index;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 10 + index * 10; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * r;
      ctx.fillRect(Math.round(r + Math.cos(a) * d), Math.round(r + Math.sin(a) * d), 1, 1);
    }
  }

  brushOffsets(index) {
    const size = [8, 5, 2][index % 3];
    const kind = Math.floor(index / 3);
    const out = [];
    const half = Math.floor(size / 2);
    if (kind === 0) {
      const r = size / 2;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if ((x + 0.5 - r) ** 2 + (y + 0.5 - r) ** 2 <= r * r + 0.5) out.push([x - half, y - half]);
        }
      }
    } else if (kind === 1) {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) out.push([x - half, y - half]);
    } else if (kind === 2) {
      for (let i = 0; i < size; i++) out.push([i - half, size - 1 - i - half]);
    } else {
      for (let i = 0; i < size; i++) out.push([i - half, i - half]);
    }
    return out.length ? out : [[0, 0]];
  }

  get lineWidth() {
    return this.opts.line + 1;
  }

  pointFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / (rect.width / this.canvas.width)),
      y: Math.floor((e.clientY - rect.top) / (rect.height / this.canvas.height))
    };
  }

  pushUndo() {
    this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    if (this.undoStack.length > 10) this.undoStack.shift();
    this.redoStack = [];
    this.dirty = true;
  }

  restore(data) {
    if (data.width !== this.canvas.width || data.height !== this.canvas.height) {
      this.canvas.width = data.width;
      this.canvas.height = data.height;
      this.applyZoom();
    }
    this.ctx.putImageData(data, 0, 0);
  }

  undo() {
    this.commitAll(false);
    if (!this.undoStack.length) return;
    this.redoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    this.restore(this.undoStack.pop());
  }

  redo() {
    this.commitAll(false);
    if (!this.redoStack.length) return;
    this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    this.restore(this.redoStack.pop());
  }

  plotter(color, offsets = [[0, 0]]) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    if (offsets.length === 1) return (x, y) => ctx.fillRect(x + offsets[0][0], y + offsets[0][1], 1, 1);
    return (x, y) => offsets.forEach(([dx, dy]) => ctx.fillRect(x + dx, y + dy, 1, 1));
  }

  squareOffsets(size) {
    const out = [];
    const half = Math.floor(size / 2);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) out.push([x - half, y - half]);
    return out;
  }

  bresenham(x0, y0, x1, y1, plot) {
    let dx = Math.abs(x1 - x0);
    let dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let guard = 0; guard < 20000; guard++) {
      plot(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  strokePath(points, color, width, closed) {
    const plot = this.plotter(color, width > 1 ? this.squareOffsets(width) : [[0, 0]]);
    for (let i = 0; i < points.length - 1; i++) {
      this.bresenham(Math.round(points[i][0]), Math.round(points[i][1]), Math.round(points[i + 1][0]), Math.round(points[i + 1][1]), plot);
    }
    if (closed && points.length > 2) {
      const a = points[points.length - 1];
      const b = points[0];
      this.bresenham(Math.round(a[0]), Math.round(a[1]), Math.round(b[0]), Math.round(b[1]), plot);
    }
  }

  fillPolygon(points, color, ctx = this.ctx) {
    if (points.length < 3) return;
    ctx.fillStyle = color;
    const ys = points.map(p => p[1]);
    const minY = Math.floor(Math.min(...ys));
    const maxY = Math.ceil(Math.max(...ys));
    for (let y = minY; y <= maxY; y++) {
      const sy = y + 0.5;
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const [x0, y0] = points[i];
        const [x1, y1] = points[(i + 1) % points.length];
        if ((y0 <= sy && y1 > sy) || (y1 <= sy && y0 > sy)) xs.push(x0 + (sy - y0) * (x1 - x0) / (y1 - y0));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const from = Math.ceil(xs[i] - 0.5);
        const to = Math.floor(xs[i + 1] - 0.5);
        if (to >= from) ctx.fillRect(from, y, to - from + 1, 1);
      }
    }
  }

  ellipsePoints(x0, y0, x1, y1) {
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const rx = Math.abs(x1 - x0) / 2;
    const ry = Math.abs(y1 - y0) / 2;
    const n = Math.max(16, Math.ceil((rx + ry) * 1.5));
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return pts;
  }

  roundRectPoints(x0, y0, x1, y1) {
    const l = Math.min(x0, x1);
    const r = Math.max(x0, x1);
    const top = Math.min(y0, y1);
    const b = Math.max(y0, y1);
    const rad = Math.min(8, (r - l) / 2, (b - top) / 2);
    const pts = [];
    const arc = (cx, cy, start) => {
      for (let i = 0; i <= 6; i++) {
        const a = start + (i / 6) * Math.PI / 2;
        pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
      }
    };
    arc(r - rad, top + rad, -Math.PI / 2);
    arc(r - rad, b - rad, 0);
    arc(l + rad, b - rad, Math.PI / 2);
    arc(l + rad, top + rad, Math.PI);
    return pts;
  }

  rectPoints(x0, y0, x1, y1) {
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  }

  drawShape(kind, a, b, button, pointsOverride) {
    const primary = button === 2 ? this.bg : this.fg;
    const secondary = button === 2 ? this.fg : this.bg;
    let pts;
    if (pointsOverride) pts = pointsOverride;
    else if (kind === 'rect') pts = this.rectPoints(a.x, a.y, b.x, b.y);
    else if (kind === 'ellipse') pts = this.ellipsePoints(a.x, a.y, b.x, b.y);
    else pts = this.roundRectPoints(a.x, a.y, b.x, b.y);
    const mode = this.opts.shape;
    if (mode === 1) this.fillPolygon(kind === 'rect' ? this.rectPoints(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x) + 1, Math.max(a.y, b.y) + 1) : pts, secondary);
    if (mode === 2) {
      this.fillPolygon(kind === 'rect' ? this.rectPoints(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x) + 1, Math.max(a.y, b.y) + 1) : pts, primary);
      return;
    }
    this.strokePath(pts, primary, this.lineWidth, true);
  }

  constrain(a, b, square) {
    if (!square) return b;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const s = Math.max(Math.abs(dx), Math.abs(dy));
    return { x: a.x + Math.sign(dx || 1) * s, y: a.y + Math.sign(dy || 1) * s };
  }

  constrainLine(a, b, on) {
    if (!on) return b;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    const len = Math.max(Math.abs(dx), Math.abs(dy));
    const ux = Math.round(Math.cos(angle));
    const uy = Math.round(Math.sin(angle));
    return { x: a.x + ux * len, y: a.y + uy * len };
  }

  snapshot() {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  onDown(e) {
    if (e.target.closest('.paint-canvas-handle') || e.target.closest('.paint-textbox')) return;
    e.preventDefault();
    const p = this.pointFromEvent(e);
    const button = e.button === 2 ? 2 : 0;
    if (e.button === 1) return;
    const tool = this.tool;

    if (this.textBox && !e.target.closest('.paint-textbox')) this.commitText();

    if (tool === 'freeselect' || tool === 'select') {
      if (this.selection && this.insideSelection(p)) {
        this.startMoveSelection(p, e.ctrlKey);
        return;
      }
      this.commitSelection();
      this.drag = { kind: tool, start: p, points: [[p.x, p.y]], button };
      return;
    }
    this.commitSelection();

    if (tool === 'picker') {
      const d = this.ctx.getImageData(Math.max(0, Math.min(this.canvas.width - 1, p.x)), Math.max(0, Math.min(this.canvas.height - 1, p.y)), 1, 1).data;
      const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
      if (button === 2) this.bg = hex;
      else this.fg = hex;
      this.updateColors();
      this.selectTool(this.prevTool);
      return;
    }
    if (tool === 'magnifier') {
      this.setZoom(button === 2 || this.zoom > 1 ? 1 : 4);
      this.selectTool(this.prevTool);
      return;
    }
    if (tool === 'fill') {
      this.pushUndo();
      this.floodFill(p.x, p.y, button === 2 ? this.bg : this.fg);
      return;
    }
    if (tool === 'text') {
      this.drag = { kind: 'text', start: p, button };
      return;
    }
    if (tool === 'curve') {
      this.curveDown(p, button);
      return;
    }
    if (tool === 'polygon') {
      this.polyDown(p, button);
      return;
    }

    this.pushUndo();
    const color = button === 2 ? this.bg : this.fg;
    if (tool === 'pencil') {
      this.drag = { kind: 'free', last: p, plot: this.plotter(color) };
      this.drag.plot(p.x, p.y);
    } else if (tool === 'brush') {
      this.drag = { kind: 'free', last: p, plot: this.plotter(color, this.brushOffsets(this.opts.brush)) };
      this.drag.plot(p.x, p.y);
    } else if (tool === 'eraser') {
      this.drag = { kind: 'free', last: p, plot: this.plotter(button === 2 ? this.fg : this.bg, this.squareOffsets([4, 6, 8, 10][this.opts.eraser])) };
      this.drag.plot(p.x, p.y);
    } else if (tool === 'airbrush') {
      this.drag = { kind: 'spray', at: p, color };
      this.spray();
      clearInterval(this.sprayTimer);
      this.sprayTimer = setInterval(() => this.spray(), 30);
    } else if (['line', 'rect', 'ellipse', 'roundrect'].includes(tool)) {
      this.drag = { kind: tool, start: p, end: p, button, snap: this.snapshot() };
      this.previewShape();
    }
  }

  spray() {
    if (!this.drag || this.drag.kind !== 'spray') return;
    const r = [4, 8, 12][this.opts.airbrush];
    this.ctx.fillStyle = this.drag.color;
    for (let i = 0; i < 6 + r; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * r;
      this.ctx.fillRect(Math.round(this.drag.at.x + Math.cos(a) * d), Math.round(this.drag.at.y + Math.sin(a) * d), 1, 1);
    }
  }

  onMove(e) {
    if (!this.el.isConnected) return;
    const p = this.pointFromEvent(e);
    const inside = p.x >= 0 && p.y >= 0 && p.x < this.canvas.width && p.y < this.canvas.height;
    this.$('.paint-coords').textContent = inside ? `${p.x},${p.y}` : '';
    if (this.resizing) {
      this.updateResize(e);
      return;
    }
    const d = this.drag;
    if (!d) {
      if (this.curve && this.curve.dragging) this.curveMove(p);
      if (this.poly) this.polyMove(p, e.shiftKey);
      return;
    }
    if (d.kind === 'free') {
      this.bresenham(d.last.x, d.last.y, p.x, p.y, d.plot);
      d.last = p;
    } else if (d.kind === 'spray') {
      d.at = p;
    } else if (d.kind === 'move') {
      this.selection.x = d.origin.x + (p.x - d.start.x);
      this.selection.y = d.origin.y + (p.y - d.start.y);
      this.refreshSelection();
    } else if (d.kind === 'select' || d.kind === 'text') {
      d.end = p;
      this.drawMarquee(d.start, p);
      this.$('.paint-size').textContent = `${Math.abs(p.x - d.start.x)}x${Math.abs(p.y - d.start.y)}`;
    } else if (d.kind === 'freeselect') {
      const last = d.points[d.points.length - 1];
      if (last[0] !== p.x || last[1] !== p.y) d.points.push([p.x, p.y]);
      this.drawLasso(d.points, false);
    } else if (['line', 'rect', 'ellipse', 'roundrect'].includes(d.kind)) {
      d.end = d.kind === 'line' ? this.constrainLine(d.start, p, e.shiftKey) : this.constrain(d.start, p, e.shiftKey);
      this.previewShape();
      this.$('.paint-size').textContent = `${Math.abs(d.end.x - d.start.x)}x${Math.abs(d.end.y - d.start.y)}`;
    }
  }

  previewShape() {
    const d = this.drag;
    this.ctx.putImageData(d.snap, 0, 0);
    if (d.kind === 'line') {
      const color = d.button === 2 ? this.bg : this.fg;
      this.strokePath([[d.start.x, d.start.y], [d.end.x, d.end.y]], color, this.lineWidth, false);
    } else {
      this.drawShape(d.kind, d.start, d.end, d.button);
    }
  }

  onUp(e) {
    if (!this.el.isConnected) return;
    if (this.resizing) {
      this.finishResize(e);
      return;
    }
    if (this.curve && this.curve.dragging) {
      this.curveUp();
      return;
    }
    if (this.poly && this.poly.dragging) {
      this.polyUp();
      return;
    }
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    clearInterval(this.sprayTimer);
    this.$('.paint-size').textContent = '';
    if (d.kind === 'select') {
      this.clearOverlay();
      const x0 = Math.max(0, Math.min(d.start.x, (d.end || d.start).x));
      const y0 = Math.max(0, Math.min(d.start.y, (d.end || d.start).y));
      const x1 = Math.min(this.canvas.width, Math.max(d.start.x, (d.end || d.start).x));
      const y1 = Math.min(this.canvas.height, Math.max(d.start.y, (d.end || d.start).y));
      if (x1 - x0 > 0 && y1 - y0 > 0) this.makeSelection(x0, y0, x1 - x0, y1 - y0, null);
    } else if (d.kind === 'freeselect') {
      this.clearOverlay();
      if (d.points.length > 2) this.makeFreeSelection(d.points);
    } else if (d.kind === 'text') {
      this.clearOverlay();
      const end = d.end || { x: d.start.x + 120, y: d.start.y + 30 };
      this.openTextBox(Math.min(d.start.x, end.x), Math.min(d.start.y, end.y), Math.max(40, Math.abs(end.x - d.start.x)), Math.max(18, Math.abs(end.y - d.start.y)));
    }
  }

  onDblClick(e) {
    if (this.poly && this.tool === 'polygon') this.finishPolygon();
  }

  curveDown(p, button) {
    if (!this.curve) {
      this.pushUndo();
      this.curve = { stage: 0, p0: p, p3: p, c1: p, c2: p, button, snap: this.snapshot(), dragging: true };
    } else {
      this.curve.dragging = true;
      if (this.curve.stage === 1) this.curve.c1 = this.curve.c2 = p;
      else this.curve.c2 = p;
    }
    this.previewCurve();
  }

  curveMove(p) {
    const c = this.curve;
    if (c.stage === 0) c.p3 = p;
    else if (c.stage === 1) c.c1 = c.c2 = p;
    else c.c2 = p;
    this.previewCurve();
  }

  curveUp() {
    const c = this.curve;
    c.dragging = false;
    c.stage++;
    if (c.stage > 2) this.curve = null;
  }

  previewCurve() {
    const c = this.curve;
    this.ctx.putImageData(c.snap, 0, 0);
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const u = 1 - t;
      pts.push([
        u * u * u * c.p0.x + 3 * u * u * t * c.c1.x + 3 * u * t * t * c.c2.x + t * t * t * c.p3.x,
        u * u * u * c.p0.y + 3 * u * u * t * c.c1.y + 3 * u * t * t * c.c2.y + t * t * t * c.p3.y
      ]);
    }
    this.strokePath(pts, c.button === 2 ? this.bg : this.fg, this.lineWidth, false);
  }

  polyDown(p, button) {
    if (!this.poly) {
      this.pushUndo();
      this.poly = { points: [[p.x, p.y]], cursor: p, button, snap: this.snapshot(), dragging: true };
    } else {
      this.poly.dragging = true;
      this.poly.cursor = p;
    }
    this.previewPolygon();
  }

  polyMove(p, shift) {
    const last = this.poly.points[this.poly.points.length - 1];
    this.poly.cursor = this.constrainLine({ x: last[0], y: last[1] }, p, shift);
    if (this.poly.dragging || this.poly.points.length > 1) this.previewPolygon();
  }

  polyUp() {
    const poly = this.poly;
    poly.dragging = false;
    const c = poly.cursor;
    const first = poly.points[0];
    if (poly.points.length > 2 && Math.abs(c.x - first[0]) <= 2 && Math.abs(c.y - first[1]) <= 2) {
      this.finishPolygon();
      return;
    }
    const last = poly.points[poly.points.length - 1];
    if (last[0] !== c.x || last[1] !== c.y) poly.points.push([c.x, c.y]);
    this.previewPolygon();
  }

  previewPolygon() {
    const poly = this.poly;
    this.ctx.putImageData(poly.snap, 0, 0);
    const pts = poly.points.concat([[poly.cursor.x, poly.cursor.y]]);
    this.strokePath(pts, poly.button === 2 ? this.bg : this.fg, this.lineWidth, false);
  }

  finishPolygon() {
    const poly = this.poly;
    if (!poly) return;
    this.poly = null;
    this.ctx.putImageData(poly.snap, 0, 0);
    if (poly.points.length < 2) return;
    this.drawShape('polygon', null, null, poly.button, poly.points);
  }

  floodFill(sx, sy, hex) {
    const { canvas, ctx } = this;
    if (sx < 0 || sy < 0 || sx >= canvas.width || sy >= canvas.height) return;
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;
    const n = parseInt(hex.slice(1), 16);
    const fr = (n >> 16) & 255;
    const fg = (n >> 8) & 255;
    const fb = n & 255;
    const start = (sy * w + sx) * 4;
    const tr = data[start];
    const tg = data[start + 1];
    const tb = data[start + 2];
    if (tr === fr && tg === fg && tb === fb) return;
    const match = i => data[i] === tr && data[i + 1] === tg && data[i + 2] === tb;
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      let lx = x;
      while (lx > 0 && match((y * w + lx - 1) * 4)) lx--;
      let rx = x;
      while (rx < w - 1 && match((y * w + rx + 1) * 4)) rx++;
      for (let i = lx; i <= rx; i++) {
        const k = (y * w + i) * 4;
        data[k] = fr;
        data[k + 1] = fg;
        data[k + 2] = fb;
        data[k + 3] = 255;
        if (y > 0 && match(((y - 1) * w + i) * 4)) stack.push([i, y - 1]);
        if (y < h - 1 && match(((y + 1) * w + i) * 4)) stack.push([i, y + 1]);
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  drawMarquee(a, b) {
    const svg = this.$('.paint-lasso');
    const z = this.zoom;
    const x = Math.min(a.x, b.x) * z;
    const y = Math.min(a.y, b.y) * z;
    const w = Math.abs(b.x - a.x) * z;
    const h = Math.abs(b.y - a.y) * z;
    svg.innerHTML = `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w}" height="${h}" fill="none" stroke="#000" stroke-dasharray="4 4" shape-rendering="crispEdges"/>`;
  }

  drawLasso(points, closed) {
    const z = this.zoom;
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${p[0] * z + 0.5} ${p[1] * z + 0.5}`).join('') + (closed ? 'Z' : '');
    this.$('.paint-lasso').innerHTML = `<path d="${d}" fill="none" stroke="#000" stroke-dasharray="4 4" shape-rendering="crispEdges"/>`;
  }

  clearOverlay() {
    this.$('.paint-lasso').innerHTML = '';
  }

  makeSelection(x, y, w, h, maskCanvas) {
    const piece = document.createElement('canvas');
    piece.width = w;
    piece.height = h;
    const pctx = piece.getContext('2d');
    pctx.drawImage(this.canvas, x, y, w, h, 0, 0, w, h);
    if (maskCanvas) {
      pctx.globalCompositeOperation = 'destination-in';
      pctx.drawImage(maskCanvas, 0, 0);
      pctx.globalCompositeOperation = 'source-over';
    }
    this.selection = { x, y, w, h, piece, mask: maskCanvas, lifted: false, origin: { x, y } };
    this.renderSelectionBox();
  }

  makeFreeSelection(points) {
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const x0 = Math.max(0, Math.min(...xs));
    const y0 = Math.max(0, Math.min(...ys));
    const x1 = Math.min(this.canvas.width, Math.max(...xs) + 1);
    const y1 = Math.min(this.canvas.height, Math.max(...ys) + 1);
    if (x1 - x0 < 2 || y1 - y0 < 2) return;
    const mask = document.createElement('canvas');
    mask.width = x1 - x0;
    mask.height = y1 - y0;
    this.fillPolygon(points.map(p => [p[0] - x0 + 0.5, p[1] - y0 + 0.5]), '#000000', mask.getContext('2d'));
    this.makeSelection(x0, y0, x1 - x0, y1 - y0, mask);
    this.selection.outline = points.map(p => [p[0] - x0, p[1] - y0]);
  }

  insideSelection(p) {
    const s = this.selection;
    return s && p.x >= s.x && p.y >= s.y && p.x < s.x + s.w && p.y < s.y + s.h;
  }

  liftSelection(keepCopy) {
    const s = this.selection;
    if (!s || s.lifted) return;
    this.pushUndo();
    s.lifted = true;
    if (keepCopy) return;
    const clear = document.createElement('canvas');
    clear.width = s.w;
    clear.height = s.h;
    const cctx = clear.getContext('2d');
    cctx.fillStyle = this.bg;
    cctx.fillRect(0, 0, s.w, s.h);
    if (s.mask) {
      cctx.globalCompositeOperation = 'destination-in';
      cctx.drawImage(s.mask, 0, 0);
    }
    this.ctx.drawImage(clear, s.origin.x, s.origin.y);
  }

  startMoveSelection(p, copy) {
    this.liftSelection(copy);
    this.drag = { kind: 'move', start: p, origin: { x: this.selection.x, y: this.selection.y } };
  }

  displayPiece() {
    const s = this.selection;
    if (this.opts.opaque) return s.piece;
    const out = document.createElement('canvas');
    out.width = s.w;
    out.height = s.h;
    const octx = out.getContext('2d');
    octx.drawImage(s.piece, 0, 0);
    const img = octx.getImageData(0, 0, s.w, s.h);
    const n = parseInt(this.bg.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    for (let i = 0; i < img.data.length; i += 4) {
      if (img.data[i] === r && img.data[i + 1] === g && img.data[i + 2] === b) img.data[i + 3] = 0;
    }
    octx.putImageData(img, 0, 0);
    return out;
  }

  renderSelectionBox() {
    let box = this.$('.paint-selection');
    const s = this.selection;
    if (!s) {
      if (box) box.remove();
      return;
    }
    if (!box) {
      box = document.createElement('div');
      box.className = 'paint-selection';
      box.innerHTML = '<canvas></canvas>';
      this.wrapper.appendChild(box);
    }
    const z = this.zoom;
    box.style.left = s.x * z + 'px';
    box.style.top = s.y * z + 'px';
    box.style.width = s.w * z + 'px';
    box.style.height = s.h * z + 'px';
    box.classList.toggle('free', !!s.mask);
    const c = box.querySelector('canvas');
    c.width = s.w;
    c.height = s.h;
    const cctx = c.getContext('2d');
    cctx.clearRect(0, 0, s.w, s.h);
    if (s.lifted) cctx.drawImage(this.displayPiece(), 0, 0);
    if (s.outline) {
      this.drawLasso(s.outline.map(p => [p[0] + s.x, p[1] + s.y]), true);
    }
  }

  refreshSelection() {
    if (this.selection) this.renderSelectionBox();
  }

  commitSelection() {
    const s = this.selection;
    if (!s) return;
    if (s.lifted) this.ctx.drawImage(this.displayPiece(), s.x, s.y);
    this.selection = null;
    this.clearOverlay();
    this.renderSelectionBox();
  }

  deleteSelection() {
    const s = this.selection;
    if (!s) return;
    if (!s.lifted) this.liftSelection(false);
    this.selection = null;
    this.clearOverlay();
    this.renderSelectionBox();
  }

  copySelection() {
    const s = this.selection;
    if (!s) return false;
    const c = document.createElement('canvas');
    c.width = s.w;
    c.height = s.h;
    c.getContext('2d').drawImage(s.piece, 0, 0);
    this.app.clipboard = c;
    return true;
  }

  paste() {
    const clip = this.app.clipboard;
    if (!clip) return;
    this.commitAll();
    if (this.tool !== 'select' && this.tool !== 'freeselect') this.selectTool('select');
    this.pushUndo();
    const piece = document.createElement('canvas');
    piece.width = clip.width;
    piece.height = clip.height;
    piece.getContext('2d').drawImage(clip, 0, 0);
    const vp = this.$('.paint-canvas-viewport');
    const x = Math.floor(vp.scrollLeft / this.zoom);
    const y = Math.floor(vp.scrollTop / this.zoom);
    if (clip.width > this.canvas.width || clip.height > this.canvas.height) {
      this.resize(Math.max(clip.width, this.canvas.width), Math.max(clip.height, this.canvas.height), this.bg);
    }
    this.selection = { x, y, w: clip.width, h: clip.height, piece, mask: null, lifted: true, origin: { x, y } };
    this.renderSelectionBox();
  }

  openTextBox(x, y, w, h) {
    const z = this.zoom;
    const box = document.createElement('textarea');
    box.className = 'paint-textbox';
    box.spellcheck = false;
    box.style.left = x * z + 'px';
    box.style.top = y * z + 'px';
    box.style.width = w * z + 'px';
    box.style.height = h * z + 'px';
    box.style.color = this.fg;
    box.style.fontSize = 13 * z + 'px';
    box.style.lineHeight = 15 * z + 'px';
    box.style.background = this.opts.opaque ? this.bg : 'transparent';
    this.wrapper.appendChild(box);
    this.textBox = { el: box, x, y, w, h };
    setTimeout(() => box.focus(), 0);
  }

  commitText() {
    const tb = this.textBox;
    if (!tb) return;
    this.textBox = null;
    const text = tb.el.value;
    tb.el.remove();
    if (!text.trim()) return;
    this.pushUndo();
    const ctx = this.ctx;
    if (this.opts.opaque) {
      ctx.fillStyle = this.bg;
      ctx.fillRect(tb.x, tb.y, tb.w, tb.h);
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(tb.x, tb.y, tb.w, tb.h);
    ctx.clip();
    ctx.fillStyle = this.fg;
    ctx.font = '13px Arial, sans-serif';
    ctx.textBaseline = 'top';
    let line = 0;
    text.split('\n').forEach(par => {
      let current = '';
      par.split(' ').forEach(word => {
        const probe = current ? current + ' ' + word : word;
        if (ctx.measureText(probe).width > tb.w - 4 && current) {
          ctx.fillText(current, tb.x + 2, tb.y + 1 + line * 15);
          line++;
          current = word;
        } else {
          current = probe;
        }
      });
      ctx.fillText(current, tb.x + 2, tb.y + 1 + line * 15);
      line++;
    });
    ctx.restore();
  }

  commitAll() {
    this.commitText();
    this.commitSelection();
    if (this.poly) this.finishPolygon();
    this.curve = null;
    this.clearOverlay();
  }

  setZoom(z) {
    this.commitText();
    this.zoom = z;
    this.applyZoom();
    this.el.querySelector('[data-cmd="zoom-normal"]').classList.toggle('is-checked', z === 1);
    this.el.querySelector('[data-cmd="zoom-large"]').classList.toggle('is-checked', z !== 1);
    if (this.tool === 'magnifier') this.renderOptions();
  }

  applyZoom() {
    const z = this.zoom;
    const w = this.canvas.width * z;
    const h = this.canvas.height * z;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.wrapper.style.width = w + 'px';
    this.wrapper.style.height = h + 'px';
    const svg = this.$('.paint-lasso');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    const grid = this.$('.paint-grid');
    grid.style.display = this.grid && z >= 4 ? 'block' : 'none';
    grid.style.backgroundSize = `${z}px ${z}px`;
    this.refreshSelection();
  }

  resize(w, h, fill) {
    w = Math.max(1, Math.min(4000, Math.round(w)));
    h = Math.max(1, Math.min(4000, Math.round(h)));
    const old = document.createElement('canvas');
    old.width = this.canvas.width;
    old.height = this.canvas.height;
    old.getContext('2d').drawImage(this.canvas, 0, 0);
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.fillStyle = fill || this.bg;
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.drawImage(old, 0, 0);
    this.applyZoom();
  }

  startResize(e, dir) {
    e.preventDefault();
    e.stopPropagation();
    this.commitAll();
    this.resizing = { dir, x: e.clientX, y: e.clientY, w: this.canvas.width, h: this.canvas.height, nw: this.canvas.width, nh: this.canvas.height };
    const ghost = this.$('.paint-resize-ghost');
    ghost.style.display = 'block';
    this.updateResize(e);
  }

  updateResize(e) {
    const r = this.resizing;
    const z = this.zoom;
    if (r.dir !== 's') r.nw = Math.max(1, Math.round(r.w + (e.clientX - r.x) / z));
    if (r.dir !== 'e') r.nh = Math.max(1, Math.round(r.h + (e.clientY - r.y) / z));
    const ghost = this.$('.paint-resize-ghost');
    ghost.style.width = r.nw * z + 'px';
    ghost.style.height = r.nh * z + 'px';
    this.$('.paint-size').textContent = `${r.nw}x${r.nh}`;
  }

  finishResize() {
    const r = this.resizing;
    this.resizing = null;
    this.$('.paint-resize-ghost').style.display = 'none';
    this.$('.paint-size').textContent = '';
    if (r.nw === r.w && r.nh === r.h) return;
    this.pushUndo();
    this.resize(r.nw, r.nh, this.bg);
  }

  onKey(e) {
    if (window.winManager.activeWindowId !== this.win.id) return;
    if (e.target && e.target.closest && e.target.closest('textarea, input')) {
      if (e.key === 'Escape' && this.textBox) this.commitText();
      return;
    }
    const key = e.key.toLowerCase();
    if (e.key === 'Escape') {
      if (this.drag && this.drag.snap) this.ctx.putImageData(this.drag.snap, 0, 0);
      if (this.poly) {
        this.ctx.putImageData(this.poly.snap, 0, 0);
        this.poly = null;
      }
      if (this.curve) {
        this.ctx.putImageData(this.curve.snap, 0, 0);
        this.curve = null;
      }
      this.drag = null;
      this.clearOverlay();
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      this.command('clearsel');
      return;
    }
    if (!e.ctrlKey) return;
    const map = {
      z: 'undo', y: 'redo', x: 'cut', c: 'copy', v: 'paste', l: 'selectall', a: 'selectall', n: e.shiftKey ? 'clearimage' : 'new',
      o: 'open', s: 'save', e: 'attributes', i: 'invert', r: 'fliprotate', w: 'stretch', g: 'grid', t: 'view-tools', p: 'print',
      pageup: 'zoom-normal', pagedown: 'zoom-large'
    };
    if (map[key]) {
      e.preventDefault();
      this.command(map[key]);
    }
  }

  toggleView(cmd, selector) {
    const node = this.$(selector);
    const hidden = node.classList.toggle('hidden');
    this.el.querySelector(`[data-cmd="${cmd}"]`).classList.toggle('is-checked', !hidden);
  }

  syncOpaqueMenu() {
    this.el.querySelector('[data-cmd="opaque"]').classList.toggle('is-checked', this.opts.opaque);
  }

  command(cmd) {
    const actions = {
      new: () => this.confirmDiscard(() => {
        this.commitAll();
        this.canvas.width = 480;
        this.canvas.height = 320;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, 480, 320);
        this.undoStack = [];
        this.redoStack = [];
        this.doc.fileName = null;
        this.dirty = false;
        this.applyZoom();
        this.updateTitle();
      }),
      open: () => this.confirmDiscard(() => window.fileDialog.show({
        mode: 'open',
        path: this.doc.path,
        filters: this.filters(),
        onOk: (path, name) => {
          this.commitAll();
          this.doc.fileName = name;
          this.doc.path = path;
          this.dirty = false;
          this.undoStack = [];
          this.load(window.vfs.readFile(path, name));
          this.updateTitle();
        }
      })),
      save: () => this.save(),
      saveas: () => this.saveAs(),
      print: () => {
        const dlg = window.winManager.openDialog({ title: this.t('paint.title'), icon: 'paint', message: this.t('notepad.printing', this.app.titleFor(this.doc).split(' - ')[0]), buttons: [{ text: 'Cancel' }] });
        setTimeout(() => { if (window.winManager.windows.has(dlg.id)) window.winManager.closeWindow(dlg.id); }, 1600);
      },
      'wall-tile': () => this.setWallpaper('tile'),
      'wall-center': () => this.setWallpaper('center'),
      exit: () => window.winManager.closeWindow(this.win.id),
      undo: () => this.undo(),
      redo: () => this.redo(),
      cut: () => { if (this.copySelection()) this.deleteSelection(); },
      copy: () => this.copySelection(),
      paste: () => this.paste(),
      clearsel: () => this.deleteSelection(),
      selectall: () => {
        this.commitAll();
        this.selectTool('select');
        this.makeSelection(0, 0, this.canvas.width, this.canvas.height, null);
      },
      'view-tools': () => this.toggleView('view-tools', '.paint-toolbox'),
      'view-colors': () => this.toggleView('view-colors', '.paint-palette-bar'),
      'view-status': () => this.toggleView('view-status', '.paint-statusbar'),
      'zoom-normal': () => this.setZoom(1),
      'zoom-large': () => this.setZoom(4),
      grid: () => {
        this.grid = !this.grid;
        this.el.querySelector('[data-cmd="grid"]').classList.toggle('is-checked', this.grid);
        this.applyZoom();
      },
      fliprotate: () => this.flipRotateDialog(),
      stretch: () => this.stretchDialog(),
      invert: () => this.invert(),
      attributes: () => this.attributesDialog(),
      clearimage: () => {
        this.commitAll();
        this.pushUndo();
        this.ctx.fillStyle = this.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      },
      opaque: () => {
        this.opts.opaque = !this.opts.opaque;
        this.syncOpaqueMenu();
        this.renderOptions();
        this.refreshSelection();
      },
      editcolors: () => {
        const idx = this.app.paletteColors.indexOf(this.fg);
        this.editColor(idx >= 0 ? idx : 0);
      },
      help: () => { if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp(); },
      about: () => window.winManager.openDialog({ title: this.t('paint.menuAbout'), icon: 'paint', message: this.t('paint.aboutText') })
    };
    if (actions[cmd]) actions[cmd]();
  }

  filters() {
    return [
      { label: this.t('paint.filterBmp'), exts: ['bmp'] },
      { label: this.t('paint.filterPng'), exts: ['png'] },
      { label: this.t('paint.filterJpg'), exts: ['jpg', 'jpeg'] },
      { label: this.t('fdlg.allFiles'), exts: ['*'] }
    ];
  }

  updateTitle() {
    window.winManager.setTitle(this.win.id, this.app.titleFor(this.doc));
  }

  writeTo(path, name) {
    this.commitAll();
    if (!window.vfs.writeFile(path, name, this.canvas.toDataURL('image/png'))) return false;
    this.doc.fileName = name;
    this.doc.path = path;
    this.app.currentFileName = name;
    this.app.currentPath = path;
    this.dirty = false;
    this.updateTitle();
    return true;
  }

  saveAs(then) {
    window.fileDialog.show({
      mode: 'save',
      path: this.doc.path,
      fileName: this.doc.fileName || this.t('paint.untitledName'),
      filters: this.filters(),
      onOk: (path, name) => { if (this.writeTo(path, name) && then) then(); }
    });
  }

  save(then) {
    if (this.doc.fileName && this.doc.fileName !== 'old_memes.bmp') {
      this.writeTo(this.doc.path, this.doc.fileName);
      if (then) then();
    } else {
      this.saveAs(then);
    }
  }

  confirmDiscard(then) {
    if (!this.dirty) {
      then();
      return;
    }
    window.winManager.openDialog({
      title: this.t('paint.title'),
      icon: 'warning',
      message: this.t('paint.saveChanges', this.app.titleFor(this.doc).split(' - ')[0]),
      buttons: [
        { text: 'Yes', primary: true, onClick: () => setTimeout(() => this.save(then), 0) },
        { text: 'No', onClick: then },
        { text: 'Cancel' }
      ]
    });
  }

  setWallpaper(mode) {
    this.commitAll();
    if (!window.appDialogs || !window.appDialogs.saveDisplaySettings) return;
    const settings = window.appDialogs.saveDisplaySettings({ wallpaper: this.canvas.toDataURL('image/png'), wallpaperMode: mode });
    if (window.appDialogs.applyDisplaySettings) window.appDialogs.applyDisplaySettings(settings || window.appDialogs.getDisplaySettings());
  }

  invert() {
    const s = this.selection;
    if (s) {
      if (!s.lifted) this.liftSelection(false);
      const pctx = s.piece.getContext('2d');
      const img = pctx.getImageData(0, 0, s.w, s.h);
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] = 255 - img.data[i];
        img.data[i + 1] = 255 - img.data[i + 1];
        img.data[i + 2] = 255 - img.data[i + 2];
      }
      pctx.putImageData(img, 0, 0);
      this.renderSelectionBox();
      return;
    }
    this.pushUndo();
    const img = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = 255 - img.data[i];
      img.data[i + 1] = 255 - img.data[i + 1];
      img.data[i + 2] = 255 - img.data[i + 2];
    }
    this.ctx.putImageData(img, 0, 0);
  }

  transform(fn) {
    const s = this.selection;
    const source = s ? s.piece : this.canvas;
    const out = fn(source);
    if (s) {
      if (!s.lifted) this.liftSelection(false);
      s.piece = out;
      s.w = out.width;
      s.h = out.height;
      s.mask = null;
      s.outline = null;
      this.clearOverlay();
      this.renderSelectionBox();
      return;
    }
    this.pushUndo();
    this.canvas.width = out.width;
    this.canvas.height = out.height;
    this.ctx.drawImage(out, 0, 0);
    this.applyZoom();
  }

  transformed(source, w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cctx = c.getContext('2d');
    cctx.imageSmoothingEnabled = false;
    draw(cctx, source);
    return c;
  }

  dialog(id, title, body, onOk) {
    const full = id + this.win.id;
    if (window.winManager.windows.has(full)) return null;
    const dlg = window.winManager.createWindow({
      id: full,
      title,
      icon: 'paint',
      width: 320,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `<div class="paint-dlg"><div class="paint-dlg-body">${body}</div><div class="paint-dlg-buttons"><button class="win-btn is-default pd-ok">${this.t('btn.ok')}</button><button class="win-btn pd-cancel">${this.t('btn.cancel')}</button></div></div>`
    });
    const close = () => window.winManager.closeWindow(full);
    dlg.element.querySelector('.pd-ok').addEventListener('click', () => {
      if (onOk(dlg.element) !== false) close();
    });
    dlg.element.querySelector('.pd-cancel').addEventListener('click', close);
    dlg.element.addEventListener('keydown', e => {
      if (e.key === 'Enter') dlg.element.querySelector('.pd-ok').click();
      if (e.key === 'Escape') close();
    });
    return dlg;
  }

  flipRotateDialog() {
    const t = (k) => this.t(k);
    const name = 'pfr' + this.win.id;
    this.dialog('paint_fr_', t('paint.frTitle'), `
      <fieldset class="paint-dlg-group">
        <legend>${t('paint.frGroup')}</legend>
        <label><input type="radio" name="${name}" value="h" checked> ${t('paint.frHorizontal')}</label>
        <label><input type="radio" name="${name}" value="v"> ${t('paint.frVertical')}</label>
        <label><input type="radio" name="${name}" value="r"> ${t('paint.frRotate')}</label>
        <div class="paint-dlg-angles">
          <label><input type="radio" name="${name}a" value="90" checked> 90°</label>
          <label><input type="radio" name="${name}a" value="180"> 180°</label>
          <label><input type="radio" name="${name}a" value="270"> 270°</label>
        </div>
      </fieldset>`, (root) => {
      const mode = root.querySelector(`input[name="${name}"]:checked`).value;
      const angle = Number(root.querySelector(`input[name="${name}a"]:checked`).value);
      this.transform(src => {
        const w = src.width;
        const h = src.height;
        if (mode === 'h') return this.transformed(src, w, h, (c, s) => { c.translate(w, 0); c.scale(-1, 1); c.drawImage(s, 0, 0); });
        if (mode === 'v') return this.transformed(src, w, h, (c, s) => { c.translate(0, h); c.scale(1, -1); c.drawImage(s, 0, 0); });
        const swap = angle !== 180;
        return this.transformed(src, swap ? h : w, swap ? w : h, (c, s) => {
          if (angle === 90) { c.translate(h, 0); c.rotate(Math.PI / 2); }
          else if (angle === 180) { c.translate(w, h); c.rotate(Math.PI); }
          else { c.translate(0, w); c.rotate(-Math.PI / 2); }
          c.drawImage(s, 0, 0);
        });
      });
    });
  }

  stretchDialog() {
    const t = (k) => this.t(k);
    this.dialog('paint_st_', t('paint.stTitle'), `
      <fieldset class="paint-dlg-group">
        <legend>${t('paint.stGroup')}</legend>
        <div class="paint-dlg-row"><label>${t('paint.stHorizontal')}</label><input type="text" class="pst-h" value="100"><span>%</span></div>
        <div class="paint-dlg-row"><label>${t('paint.stVertical')}</label><input type="text" class="pst-v" value="100"><span>%</span></div>
      </fieldset>`, (root) => {
      const ph = Math.max(1, Math.min(500, parseInt(root.querySelector('.pst-h').value, 10) || 100));
      const pv = Math.max(1, Math.min(500, parseInt(root.querySelector('.pst-v').value, 10) || 100));
      this.transform(src => {
        const w = Math.max(1, Math.round(src.width * ph / 100));
        const h = Math.max(1, Math.round(src.height * pv / 100));
        return this.transformed(src, w, h, (c, s) => c.drawImage(s, 0, 0, w, h));
      });
    });
  }

  attributesDialog() {
    const t = (k) => this.t(k);
    this.dialog('paint_attr_', t('paint.attrTitle'), `
      <div class="paint-dlg-row"><label>${t('paint.attrWidth')}</label><input type="text" class="pa-w" value="${this.canvas.width}"></div>
      <div class="paint-dlg-row"><label>${t('paint.attrHeight')}</label><input type="text" class="pa-h" value="${this.canvas.height}"></div>
      <fieldset class="paint-dlg-group"><legend>${t('paint.attrUnits')}</legend><label><input type="radio" checked> ${t('paint.attrPels')}</label></fieldset>`, (root) => {
      const w = parseInt(root.querySelector('.pa-w').value, 10);
      const h = parseInt(root.querySelector('.pa-h').value, 10);
      if (!(w > 0 && h > 0)) return false;
      this.commitAll();
      this.pushUndo();
      this.resize(w, h, this.bg);
      return true;
    });
  }
}

window.appPaint = new AppPaint();
