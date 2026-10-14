/**
 * RetroShop 98 (Photoshop 4.0/5.0 Parody)
 * Multi-layer graphics editor with advanced tools, adjustments, and filters.
 */
class AppPhotoshop {
  constructor() {
    this.width = 440;
    this.height = 320;
    this.currentTool = 'brush';
    this.fgColor = '#000000';
    this.bgColor = '#ffffff';
    this.brushSize = 4;
    this.opacity = 1.0;
    this.layers = [];
    this.activeLayerIndex = 0;
    this.history = [];
    this.historyIndex = -1;
    this.currentFileName = 'Untitled-1.psd';
    this.currentPath = ['My Computer', 'C:', 'My Documents', 'Мои рисунки'];
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.selection = null; // { x, y, w, h }
  }

  open(fileName = 'Untitled-1.psd', initialImage = null, path = null) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    this.currentFileName = fileName || 'Untitled-1.psd';
    if (path) this.currentPath = path;

    const winId = 'app_ps_' + Date.now();
    const win = window.winManager.createWindow({
      id: winId,
      title: `${this.currentFileName} @ 100% (RGB/8) - ${t('photoshop.title')}`,
      icon: 'photoshop',
      width: 680,
      height: 520,
      content: this.buildHTML(winId)
    });

    this.initApp(win, winId, initialImage);
  }

  buildHTML(winId) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    return `
      <div class="ps-container" id="${winId}_root">
        <!-- Menubar -->
        <div class="win-menubar">
          <div class="win-menu-item">
            ${t('photoshop.menuFile')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option ps-opt-new">${t('photoshop.menuNew')} <span>Ctrl+N</span></div>
              <div class="win-dropdown-option ps-opt-open">${t('photoshop.menuOpen')} <span>Ctrl+O</span></div>
              <div class="win-dropdown-option ps-opt-save">${t('photoshop.menuSave')} <span>Ctrl+S</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option ps-opt-exit">${t('photoshop.menuExit')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('photoshop.menuEdit')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option ps-opt-undo">${t('photoshop.menuUndo')} <span>Ctrl+Z</span></div>
              <div class="win-dropdown-option ps-opt-redo">${t('photoshop.menuRedo')} <span>Ctrl+Y</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option ps-opt-clear">${t('photoshop.menuClear')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('photoshop.menuImage')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option ps-opt-adjust-bc">${t('photoshop.menuAdjustBc')}</div>
              <div class="win-dropdown-option ps-opt-invert">${t('photoshop.menuInvert')} <span>Ctrl+I</span></div>
              <div class="win-dropdown-option ps-opt-grayscale">${t('photoshop.menuGrayscale')}</div>
              <div class="win-dropdown-option ps-opt-sepia">${t('photoshop.menuSepia')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('photoshop.menuLayer')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option ps-opt-new-layer">${t('photoshop.menuNewLayer')} <span>Shift+Ctrl+N</span></div>
              <div class="win-dropdown-option ps-opt-dup-layer">${t('photoshop.menuDupLayer')}</div>
              <div class="win-dropdown-option ps-opt-del-layer">${t('photoshop.menuDelLayer')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option ps-opt-merge">${t('photoshop.menuMerge')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('photoshop.menuFilter')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option ps-opt-filter-blur">${t('photoshop.menuFilterBlur')}</div>
              <div class="win-dropdown-option ps-opt-filter-sharpen">${t('photoshop.menuFilterSharpen')}</div>
              <div class="win-dropdown-option ps-opt-filter-mosaic">${t('photoshop.menuFilterMosaic')}</div>
              <div class="win-dropdown-option ps-opt-filter-emboss">${t('photoshop.menuFilterEmboss')}</div>
              <div class="win-dropdown-option ps-opt-filter-edges">${t('photoshop.menuFilterEdges')}</div>
              <div class="win-dropdown-option ps-opt-filter-noise">${t('photoshop.menuFilterNoise')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('photoshop.menuHelp')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option ps-opt-about">${t('photoshop.menuAbout')}</div>
            </div>
          </div>
        </div>

        <!-- Options Toolbar -->
        <div style="background:var(--win-bg); border-bottom:1px solid var(--win-border-dark); padding:3px 8px; display:flex; align-items:center; gap:10px; font-size:11px;">
          <span>${t('photoshop.lblTool')} <strong id="${winId}_tool_name">${t('photoshop.toolBrush')}</strong></span>
          <span style="color:#808080;">|</span>
          <label style="display:flex; align-items:center; gap:4px;">
            ${t('photoshop.lblSize')}
            <input type="number" id="${winId}_brush_size" value="4" min="1" max="50" style="width:40px; height:18px;">
          </label>
          <span style="color:#808080;">|</span>
          <label style="display:flex; align-items:center; gap:4px;">
            ${t('photoshop.lblOpacity')}
            <input type="range" id="${winId}_brush_opacity" min="10" max="100" value="100" style="width:60px; height:14px;">
            <span id="${winId}_brush_opacity_val">100%</span>
          </label>
        </div>

        <!-- Main Workspace -->
        <div class="ps-workspace">
          <!-- Left Toolbox -->
          <div class="ps-toolbox">
            <div class="ps-tools-grid">
              <button class="ps-tool-btn" data-tool="rect-select" title="${t('photoshop.tipRectSelect')}">&#9634;</button>
              <button class="ps-tool-btn" data-tool="move" title="${t('photoshop.tipMove')}">&#10021;</button>
              <button class="ps-tool-btn" data-tool="lasso" title="${t('photoshop.tipLasso')}">&#9741;</button>
              <button class="ps-tool-btn" data-tool="wand" title="${t('photoshop.tipWand')}">&#10022;</button>
              <button class="ps-tool-btn" data-tool="crop" title="${t('photoshop.tipCrop')}">&#9986;</button>
              <button class="ps-tool-btn" data-tool="eyedropper" title="${t('photoshop.tipEyedropper')}">&#128394;</button>
              <button class="ps-tool-btn" data-tool="stamp" title="${t('photoshop.tipStamp')}">&#9874;</button>
              <button class="ps-tool-btn" data-tool="eraser" title="${t('photoshop.tipEraser')}">&#9646;</button>
              <button class="ps-tool-btn active" data-tool="brush" title="${t('photoshop.tipBrush')}">&#128396;</button>
              <button class="ps-tool-btn" data-tool="pencil" title="${t('photoshop.tipPencil')}">&#9998;</button>
              <button class="ps-tool-btn" data-tool="gradient" title="${t('photoshop.tipGradient')}">&#9639;</button>
              <button class="ps-tool-btn" data-tool="bucket" title="${t('photoshop.tipBucket')}">&#129523;</button>
              <button class="ps-tool-btn" data-tool="blur" title="${t('photoshop.tipBlur')}">&#10041;</button>
              <button class="ps-tool-btn" data-tool="text" title="${t('photoshop.tipText')}">&#128466;</button>
            </div>

            <!-- Color Swatches -->
            <div class="ps-color-swatches">
              <div class="ps-color-fg" id="${winId}_fg" style="background:#000000;" title="${t('photoshop.tipFgColor')}"></div>
              <div class="ps-color-bg" id="${winId}_bg" style="background:#ffffff;" title="${t('photoshop.tipBgColor')}"></div>
              <div class="ps-color-reset" id="${winId}_reset_colors" title="${t('photoshop.tipResetColors')}">&#9632;&#9633;</div>
            </div>
          </div>

          <!-- Viewport with Canvas -->
          <div class="ps-viewport">
            <div class="ps-canvas-wrapper" id="${winId}_canvas_wrap">
              <canvas class="ps-canvas" id="${winId}_main_canvas" width="${this.width}" height="${this.height}"></canvas>
            </div>
          </div>

          <!-- Right Sidebar (Layers & History) -->
          <div class="ps-sidebar">
            <!-- Layers Panel -->
            <div class="ps-panel">
              <div class="ps-panel-header">
                <span>${t('photoshop.layersHeader')}</span>
                <span style="font-size:9px;">RGB</span>
              </div>
              <div style="display:flex; align-items:center; gap:4px; margin-bottom:4px; font-size:10px;">
                <span>${t('photoshop.opacityLabel')}</span>
                <input type="range" id="${winId}_layer_opacity" min="0" max="100" value="100" style="width:70px; height:12px;">
              </div>
              <div class="ps-layers-list" id="${winId}_layers_list"></div>
              <div class="ps-layers-tools">
                <button class="win-btn" id="${winId}_btn_new_layer" title="${t('photoshop.btnNewLayer')}" style="font-size:10px; padding:1px 4px;">${t('photoshop.btnNewLayer')}</button>
                <button class="win-btn" id="${winId}_btn_del_layer" title="${t('photoshop.btnDelLayer')}" style="font-size:10px; padding:1px 4px;">&#10005;</button>
              </div>
            </div>

            <!-- History Panel -->
            <div class="ps-panel" style="flex:1;">
              <div class="ps-panel-header">${t('photoshop.historyHeader')}</div>
              <div class="ps-history-list" id="${winId}_history_list"></div>
            </div>
          </div>
        </div>

        <!-- Statusbar -->
        <div class="win-statusbar">
          <div class="win-status-pane grow" id="${winId}_status">${t('photoshop.statusReady')}</div>
          <div class="win-status-pane" style="width:110px;" id="${winId}_coords">X: 0 Y: 0</div>
        </div>

        <!-- Hidden input for file loading -->
        <input type="file" id="${winId}_file_in" accept="image/*" style="display:none;">
      </div>
    `;
  }

  initApp(win, winId, initialImage) {
    const el = win.element;
    const mainCanvas = el.querySelector(`#${winId}_main_canvas`);
    const mainCtx = mainCanvas.getContext('2d');
    const layersListEl = el.querySelector(`#${winId}_layers_list`);
    const historyListEl = el.querySelector(`#${winId}_history_list`);
    const statusText = el.querySelector(`#${winId}_status`);
    const coordsText = el.querySelector(`#${winId}_coords`);
    const fgSwatch = el.querySelector(`#${winId}_fg`);
    const bgSwatch = el.querySelector(`#${winId}_bg`);
    const toolNameEl = el.querySelector(`#${winId}_tool_name`);
    const brushSizeInput = el.querySelector(`#${winId}_brush_size`);
    const brushOpacityInput = el.querySelector(`#${winId}_brush_opacity`);
    const brushOpacityVal = el.querySelector(`#${winId}_brush_opacity_val`);
    const layerOpacityInput = el.querySelector(`#${winId}_layer_opacity`);
    const btnNewLayer = el.querySelector(`#${winId}_btn_new_layer`);
    const btnDelLayer = el.querySelector(`#${winId}_btn_del_layer`);
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const fileInput = el.querySelector(`#${winId}_file_in`);

    // Initialize layers: Background layer
    this.layers = [];
    const bgLayer = this.createLayer(t('photoshop.layerBg'), true);
    this.layers.push(bgLayer);
    this.activeLayerIndex = 0;

    // Fill background with white or initial image
    bgLayer.ctx.fillStyle = '#ffffff';
    bgLayer.ctx.fillRect(0, 0, this.width, this.height);

    if (initialImage) {
      this.loadImageOntoActiveLayer(initialImage, () => {
        this.compositeLayers(mainCtx);
        this.pushHistory(t('photoshop.histOpenImg'), mainCtx);
      });
    } else {
      this.compositeLayers(mainCtx);
      this.pushHistory(t('photoshop.histNewDoc'), mainCtx);
    }

    this.renderLayersUI(layersListEl, winId);
    this.renderHistoryUI(historyListEl);

    // Mouse coordinates tracking
    mainCanvas.addEventListener('mousemove', (e) => {
      const rect = mainCanvas.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);
      coordsText.textContent = `X: ${x} Y: ${y}`;
    });

    // Tool switching
    el.querySelectorAll('.ps-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.ps-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
        toolNameEl.textContent = btn.title.split(' [')[0];
        statusText.textContent = t('photoshop.statusTool', toolNameEl.textContent);
      });
    });

    // Color pickers (foreground / background)
    fgSwatch.addEventListener('click', () => {
      const color = prompt(t('photoshop.promptFgColor'), this.fgColor);
      if (color) {
        this.fgColor = color;
        fgSwatch.style.background = color;
      }
    });

    bgSwatch.addEventListener('click', () => {
      const color = prompt(t('photoshop.promptBgColor'), this.bgColor);
      if (color) {
        this.bgColor = color;
        bgSwatch.style.background = color;
      }
    });

    el.querySelector(`#${winId}_reset_colors`).addEventListener('click', () => {
      this.fgColor = '#000000';
      this.bgColor = '#ffffff';
      fgSwatch.style.background = this.fgColor;
      bgSwatch.style.background = this.bgColor;
    });

    // Brush controls
    brushSizeInput.addEventListener('change', () => {
      this.brushSize = Math.max(1, parseInt(brushSizeInput.value) || 4);
    });

    brushOpacityInput.addEventListener('input', () => {
      this.opacity = parseInt(brushOpacityInput.value) / 100;
      brushOpacityVal.textContent = `${brushOpacityInput.value}%`;
    });

    layerOpacityInput.addEventListener('input', () => {
      const curLayer = this.layers[this.activeLayerIndex];
      if (curLayer) {
        curLayer.opacity = parseInt(layerOpacityInput.value) / 100;
        this.compositeLayers(mainCtx);
      }
    });

    // Layer buttons
    btnNewLayer.addEventListener('click', () => {
      const l = this.createLayer(t('photoshop.layerName', this.layers.length + 1));
      this.layers.unshift(l);
      this.activeLayerIndex = 0;
      this.renderLayersUI(layersListEl, winId);
      this.pushHistory(t('photoshop.btnNewLayer'), mainCtx);
    });

    btnDelLayer.addEventListener('click', () => {
      if (this.layers.length <= 1) {
        alert(t('photoshop.errDelOnlyLayer'));
        return;
      }
      this.layers.splice(this.activeLayerIndex, 1);
      this.activeLayerIndex = Math.max(0, this.activeLayerIndex - 1);
      this.compositeLayers(mainCtx);
      this.renderLayersUI(layersListEl, winId);
      this.pushHistory(t('photoshop.histDelLayer'), mainCtx);
    });

    // Canvas drawing events
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let layerSnapshot = null;

    mainCanvas.addEventListener('mousedown', (e) => {
      const rect = mainCanvas.getBoundingClientRect();
      startX = Math.floor(e.clientX - rect.left);
      startY = Math.floor(e.clientY - rect.top);
      isDrawing = true;

      const curLayer = this.layers[this.activeLayerIndex];
      if (!curLayer || !curLayer.visible) return;

      const ctx = curLayer.ctx;
      layerSnapshot = ctx.getImageData(0, 0, this.width, this.height);

      if (this.currentTool === 'brush' || this.currentTool === 'pencil') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.strokeStyle = this.fgColor;
        ctx.lineWidth = this.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.opacity;
        ctx.lineTo(startX, startY);
        ctx.stroke();
        this.compositeLayers(mainCtx);
      } else if (this.currentTool === 'eraser') {
        ctx.clearRect(startX - this.brushSize, startY - this.brushSize, this.brushSize * 2, this.brushSize * 2);
        this.compositeLayers(mainCtx);
      } else if (this.currentTool === 'bucket') {
        // Flood fill active layer
        ctx.fillStyle = this.fgColor;
        ctx.fillRect(0, 0, this.width, this.height);
        this.compositeLayers(mainCtx);
        this.pushHistory(t('photoshop.histFillColor'), mainCtx);
        isDrawing = false;
      } else if (this.currentTool === 'eyedropper') {
        // Pick color from composite canvas
        const p = mainCtx.getImageData(startX, startY, 1, 1).data;
        const hex = '#' + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1);
        this.fgColor = hex;
        fgSwatch.style.background = hex;
        statusText.textContent = t('photoshop.statusEyedropper', hex);
        isDrawing = false;
      } else if (this.currentTool === 'text') {
        const text = prompt(t('photoshop.promptInsertText'), 'Win 98');
        if (text) {
          ctx.font = `bold ${Math.max(12, this.brushSize * 4)}px "MS Sans Serif", sans-serif`;
          ctx.fillStyle = this.fgColor;
          ctx.globalAlpha = this.opacity;
          ctx.fillText(text, startX, startY);
          this.compositeLayers(mainCtx);
          this.pushHistory(t('photoshop.histText', text), mainCtx);
        }
        isDrawing = false;
      }
    });

    mainCanvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      const rect = mainCanvas.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);

      const curLayer = this.layers[this.activeLayerIndex];
      if (!curLayer || !curLayer.visible) return;
      const ctx = curLayer.ctx;

      if (this.currentTool === 'brush' || this.currentTool === 'pencil') {
        ctx.lineTo(x, y);
        ctx.stroke();
        this.compositeLayers(mainCtx);
      } else if (this.currentTool === 'eraser') {
        ctx.clearRect(x - this.brushSize, y - this.brushSize, this.brushSize * 2, this.brushSize * 2);
        this.compositeLayers(mainCtx);
      } else if (this.currentTool === 'gradient') {
        // Preview gradient from startX, startY to x, y
        ctx.putImageData(layerSnapshot, 0, 0);
        const grad = ctx.createLinearGradient(startX, startY, x, y);
        grad.addColorStop(0, this.fgColor);
        grad.addColorStop(1, this.bgColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);
        this.compositeLayers(mainCtx);
      } else if (this.currentTool === 'rect-select') {
        // Draw selection marquee preview
        this.compositeLayers(mainCtx);
        mainCtx.strokeStyle = '#000080';
        mainCtx.setLineDash([4, 4]);
        mainCtx.strokeRect(Math.min(startX, x), Math.min(startY, y), Math.abs(x - startX), Math.abs(y - startY));
        mainCtx.setLineDash([]);
      }
    });

    const finishDrawing = () => {
      if (!isDrawing) return;
      isDrawing = false;
      const curLayer = this.layers[this.activeLayerIndex];
      if (curLayer) {
        curLayer.ctx.closePath();
      }
      this.compositeLayers(mainCtx);
      this.pushHistory(toolNameEl.textContent, mainCtx);
    };

    mainCanvas.addEventListener('mouseup', finishDrawing);
    mainCanvas.addEventListener('mouseleave', finishDrawing);

    // Dropdown Actions & Filters
    const setupMenu = (selector, action) => {
      const opt = el.querySelector(selector);
      if (opt) opt.addEventListener('click', action);
    };

    setupMenu('.ps-opt-new', () => {
      this.layers = [this.createLayer(t('photoshop.layerBg'), true)];
      this.layers[0].ctx.fillStyle = '#ffffff';
      this.layers[0].ctx.fillRect(0, 0, this.width, this.height);
      this.activeLayerIndex = 0;
      this.compositeLayers(mainCtx);
      this.renderLayersUI(layersListEl, winId);
      this.pushHistory(t('photoshop.histNewDoc'), mainCtx);
    });

    setupMenu('.ps-opt-open', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.loadImageOntoActiveLayer(ev.target.result, () => {
            this.compositeLayers(mainCtx);
            this.pushHistory(`${t('imaging.menuOpen')} ${file.name}`, mainCtx);
          });
        };
        reader.readAsDataURL(file);
      }
    });

    setupMenu('.ps-opt-save', () => {
      const dataUrl = mainCanvas.toDataURL('image/png');
      const fileName = prompt(t('photoshop.promptSave'), this.currentFileName.replace(/\.psd$/i, '.bmp'));
      if (fileName && window.vfs) {
        const targetFolder = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Мои рисунки']);
        if (targetFolder && targetFolder.children) {
          targetFolder.children[fileName] = {
            type: 'file',
            name: fileName,
            icon: 'file-bmp',
            app: 'paint',
            content: dataUrl
          };
          window.vfs.saveToStorage();
          if (window.soundSys) window.soundSys.playClick();
          statusText.textContent = t('photoshop.statusSaved', fileName);
        }
      }
    });

    setupMenu('.ps-opt-undo', () => this.undo(mainCtx, historyListEl));
    setupMenu('.ps-opt-redo', () => this.redo(mainCtx, historyListEl));
    setupMenu('.ps-opt-clear', () => {
      const cur = this.layers[this.activeLayerIndex];
      if (cur) {
        cur.ctx.clearRect(0, 0, this.width, this.height);
        this.compositeLayers(mainCtx);
        this.pushHistory(t('photoshop.histClearLayer'), mainCtx);
      }
    });

    // Image Adjustments
    setupMenu('.ps-opt-invert', () => {
      this.applyPixelEffect(mainCtx, (r, g, b) => [255 - r, 255 - g, 255 - b]);
      this.pushHistory(t('photoshop.histInvert'), mainCtx);
    });

    setupMenu('.ps-opt-grayscale', () => {
      this.applyPixelEffect(mainCtx, (r, g, b) => {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        return [gray, gray, gray];
      });
      this.pushHistory(t('photoshop.histGrayscale'), mainCtx);
    });

    setupMenu('.ps-opt-sepia', () => {
      this.applyPixelEffect(mainCtx, (r, g, b) => {
        const tr = 0.393 * r + 0.769 * g + 0.189 * b;
        const tg = 0.349 * r + 0.686 * g + 0.168 * b;
        const tb = 0.272 * r + 0.534 * g + 0.131 * b;
        return [Math.min(255, tr), Math.min(255, tg), Math.min(255, tb)];
      });
      this.pushHistory(t('photoshop.histSepia'), mainCtx);
    });

    setupMenu('.ps-opt-adjust-bc', () => {
      const bStr = prompt(t('photoshop.promptBrightness'), '20');
      const cStr = prompt(t('photoshop.promptContrast'), '20');
      if (bStr !== null && cStr !== null) {
        const bright = parseInt(bStr) || 0;
        const contrast = (parseInt(cStr) || 0) * 2.55;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        this.applyPixelEffect(mainCtx, (r, g, b) => {
          return [
            Math.min(255, Math.max(0, factor * (r - 128) + 128 + bright)),
            Math.min(255, Math.max(0, factor * (g - 128) + 128 + bright)),
            Math.min(255, Math.max(0, factor * (b - 128) + 128 + bright))
          ];
        });
        this.pushHistory(t('photoshop.histBrightnessContrast'), mainCtx);
      }
    });

    // Filters
    setupMenu('.ps-opt-filter-mosaic', () => {
      this.applyMosaicFilter(mainCtx, 8);
      this.pushHistory(t('photoshop.histMosaic'), mainCtx);
    });

    setupMenu('.ps-opt-filter-blur', () => {
      this.applyConvolutionFilter(mainCtx, [
        1/9, 1/9, 1/9,
        1/9, 1/9, 1/9,
        1/9, 1/9, 1/9
      ]);
      this.pushHistory(t('photoshop.histBlur'), mainCtx);
    });

    setupMenu('.ps-opt-filter-sharpen', () => {
      this.applyConvolutionFilter(mainCtx, [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ]);
      this.pushHistory(t('photoshop.histSharpen'), mainCtx);
    });

    setupMenu('.ps-opt-filter-emboss', () => {
      this.applyConvolutionFilter(mainCtx, [
        -2, -1, 0,
        -1, 1, 1,
        0, 1, 2
      ], 128);
      this.pushHistory(t('photoshop.histEmboss'), mainCtx);
    });

    setupMenu('.ps-opt-filter-edges', () => {
      this.applyConvolutionFilter(mainCtx, [
        -1, -1, -1,
        -1, 8, -1,
        -1, -1, -1
      ]);
      this.pushHistory(t('photoshop.histEdges'), mainCtx);
    });

    setupMenu('.ps-opt-filter-noise', () => {
      this.applyPixelEffect(mainCtx, (r, g, b) => {
        const noise = (Math.random() - 0.5) * 60;
        return [Math.min(255, Math.max(0, r + noise)), Math.min(255, Math.max(0, g + noise)), Math.min(255, Math.max(0, b + noise))];
      });
      this.pushHistory(t('photoshop.histNoise'), mainCtx);
    });

    setupMenu('.ps-opt-about', () => {
      window.winManager.openDialog({
        title: t('photoshop.aboutTitle'),
        icon: 'photoshop',
        message: t('photoshop.aboutMsg')
      });
    });

    setupMenu('.ps-opt-exit', () => window.winManager.closeWindow(winId));
  }

  createLayer(name, isBg = false) {
    const c = document.createElement('canvas');
    c.width = this.width;
    c.height = this.height;
    return {
      name,
      canvas: c,
      ctx: c.getContext('2d'),
      visible: true,
      opacity: 1.0,
      isBackground: isBg
    };
  }

  compositeLayers(targetCtx) {
    targetCtx.clearRect(0, 0, this.width, this.height);
    // Draw layers from bottom to top (reversed array)
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const l = this.layers[i];
      if (l.visible) {
        targetCtx.globalAlpha = l.opacity;
        targetCtx.drawImage(l.canvas, 0, 0);
      }
    }
    targetCtx.globalAlpha = 1.0;
  }

  renderLayersUI(container, winId) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    container.innerHTML = '';
    this.layers.forEach((layer, idx) => {
      const el = document.createElement('div');
      el.className = `ps-layer-item ${idx === this.activeLayerIndex ? 'active' : ''}`;
      el.innerHTML = `
        <span class="ps-layer-eye" title="${t('photoshop.layerVisibility')}">${layer.visible ? '&#128065;' : '&nbsp;'}</span>
        <span class="ps-layer-name">${layer.name}</span>
      `;

      el.querySelector('.ps-layer-eye').addEventListener('click', (e) => {
        e.stopPropagation();
        layer.visible = !layer.visible;
        el.querySelector('.ps-layer-eye').innerHTML = layer.visible ? '&#128065;' : '&nbsp;';
        const mainCanvas = document.querySelector(`#${winId}_main_canvas`);
        if (mainCanvas) this.compositeLayers(mainCanvas.getContext('2d'));
      });

      el.addEventListener('click', () => {
        this.activeLayerIndex = idx;
        this.renderLayersUI(container, winId);
        const opSlider = document.querySelector(`#${winId}_layer_opacity`);
        if (opSlider) opSlider.value = Math.round(layer.opacity * 100);
      });

      container.appendChild(el);
    });
  }

  pushHistory(actionName, mainCtx) {
    const active = this.layers[this.activeLayerIndex];
    if (!active) return;

    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({
      name: actionName,
      layerIndex: this.activeLayerIndex,
      data: active.ctx.getImageData(0, 0, this.width, this.height)
    });
    this.historyIndex = this.history.length - 1;

    const histList = document.querySelector(`#app_ps_${this.winId || ''}_history_list`);
    if (histList) this.renderHistoryUI(histList);
  }

  renderHistoryUI(container) {
    container.innerHTML = '';
    this.history.forEach((h, idx) => {
      const item = document.createElement('div');
      item.className = `ps-history-item ${idx === this.historyIndex ? 'active' : ''}`;
      item.textContent = h.name;
      container.appendChild(item);
    });
    container.scrollTop = container.scrollHeight;
  }

  undo(mainCtx, histContainer) {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const step = this.history[this.historyIndex];
      const curLayer = this.layers[step.layerIndex] || this.layers[0];
      curLayer.ctx.putImageData(step.data, 0, 0);
      this.compositeLayers(mainCtx);
      this.renderHistoryUI(histContainer);
    }
  }

  redo(mainCtx, histContainer) {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const step = this.history[this.historyIndex];
      const curLayer = this.layers[step.layerIndex] || this.layers[0];
      curLayer.ctx.putImageData(step.data, 0, 0);
      this.compositeLayers(mainCtx);
      this.renderHistoryUI(histContainer);
    }
  }

  loadImageOntoActiveLayer(src, cb) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const cur = this.layers[this.activeLayerIndex];
      if (cur) {
        cur.ctx.drawImage(img, 0, 0, this.width, this.height);
        if (cb) cb();
      }
    };
    img.src = src;
  }

  applyPixelEffect(mainCtx, pixelFn) {
    const cur = this.layers[this.activeLayerIndex];
    if (!cur) return;
    const imgData = cur.ctx.getImageData(0, 0, this.width, this.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const res = pixelFn(d[i], d[i + 1], d[i + 2], d[i + 3]);
      d[i] = res[0];
      d[i + 1] = res[1];
      d[i + 2] = res[2];
      if (res.length > 3) d[i + 3] = res[3];
    }
    cur.ctx.putImageData(imgData, 0, 0);
    this.compositeLayers(mainCtx);
  }

  applyMosaicFilter(mainCtx, blockSize = 8) {
    const cur = this.layers[this.activeLayerIndex];
    if (!cur) return;
    const imgData = cur.ctx.getImageData(0, 0, this.width, this.height);
    const d = imgData.data;

    for (let y = 0; y < this.height; y += blockSize) {
      for (let x = 0; x < this.width; x += blockSize) {
        const i = (y * this.width + x) * 4;
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        for (let by = 0; by < blockSize && y + by < this.height; by++) {
          for (let bx = 0; bx < blockSize && x + bx < this.width; bx++) {
            const bi = ((y + by) * this.width + (x + bx)) * 4;
            d[bi] = r;
            d[bi + 1] = g;
            d[bi + 2] = b;
          }
        }
      }
    }
    cur.ctx.putImageData(imgData, 0, 0);
    this.compositeLayers(mainCtx);
  }

  applyConvolutionFilter(mainCtx, weights, offset = 0) {
    const cur = this.layers[this.activeLayerIndex];
    if (!cur) return;
    const src = cur.ctx.getImageData(0, 0, this.width, this.height);
    const dst = cur.ctx.createImageData(this.width, this.height);
    const s = src.data;
    const d = dst.data;
    const w = this.width;
    const h = this.height;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let r = 0, g = 0, b = 0;
        for (let cy = -1; cy <= 1; cy++) {
          for (let cx = -1; cx <= 1; cx++) {
            const weight = weights[(cy + 1) * 3 + (cx + 1)];
            const idx = ((y + cy) * w + (x + cx)) * 4;
            r += s[idx] * weight;
            g += s[idx + 1] * weight;
            b += s[idx + 2] * weight;
          }
        }
        const outIdx = (y * w + x) * 4;
        d[outIdx] = Math.min(255, Math.max(0, r + offset));
        d[outIdx + 1] = Math.min(255, Math.max(0, g + offset));
        d[outIdx + 2] = Math.min(255, Math.max(0, b + offset));
        d[outIdx + 3] = s[outIdx + 3];
      }
    }
    cur.ctx.putImageData(dst, 0, 0);
    this.compositeLayers(mainCtx);
  }
}

window.appPhotoshop = new AppPhotoshop();
