class AppACDSee {
  constructor() {
    this.windowId = 'win-acdsee';
    this.currentFolder = 'my-pictures';
    this.viewMode = 'thumbs';
    this.selectedIndex = 0;
    this.viewerZoom = 100;
    this.viewerRotation = 0;
    this.slideshowTimer = null;

    this.folders = [
      { id: 'my-pictures', label: 'C:\\My Documents\\Мои рисунки', icon: '📁' },
      { id: 'igromania-art', label: 'D:\\ARTWORK_98 (Igromania CD)', icon: '💿' },
      { id: 'win98-wallpapers', label: 'C:\\WINDOWS\\Wallpapers 98', icon: '🖼️' }
    ];
  }

  makeSvgDataUri(svgContent) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent.trim());
  }

  getBuiltInGallery(folderId) {
    if (folderId === 'igromania-art') {
      return [
        {
          name: 'QUAKE2_3DFX_GLIDE.BMP',
          dim: '640×480×24b',
          size: '900 KB',
          desc: 'Quake II OpenGL / 3Dfx Glide Screenshot',
          src: this.makeSvgDataUri(`
            <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
              <defs>
                <linearGradient id="q2bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2b0f06"/>
                  <stop offset="60%" stop-color="#5a230d"/>
                  <stop offset="100%" stop-color="#1a120e"/>
                </linearGradient>
              </defs>
              <rect width="320" height="240" fill="url(#q2bg)"/>
              <polygon points="0,240 120,130 200,130 320,240" fill="#2e2a27" stroke="#7a4422"/>
              <rect x="40" y="30" width="45" height="140" fill="#3a1c12" stroke="#8c4a27"/>
              <rect x="235" y="30" width="45" height="140" fill="#3a1c12" stroke="#8c4a27"/>
              <circle cx="160" cy="115" r="24" fill="none" stroke="#ff6600" stroke-width="3"/>
              <line x1="160" y1="185" x2="160" y2="115" stroke="#00e5ff" stroke-width="4"/>
              <text x="14" y="22" fill="#ffcc66" font-family="monospace" font-size="12" font-weight="bold">3DFX GLIDE 2.51 | Q2DM1 85 FPS</text>
            </svg>
          `)
        },
        {
          name: 'ENLIGHT98_PARTY.BMP',
          dim: '640×480×24b',
          size: '900 KB',
          desc: 'Enlight 98 Demoscene Compo Graphics',
          src: this.makeSvgDataUri(`
            <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
              <rect width="320" height="240" fill="#090d24"/>
              <circle cx="240" cy="70" r="42" fill="#ffaa00" opacity="0.85"/>
              <polygon points="20,220 110,80 195,220" fill="#1e3c72" stroke="#55ccff" stroke-width="2"/>
              <polygon points="120,220 210,95 300,220" fill="#2a5298" stroke="#88eeff" stroke-width="2"/>
              <text x="18" y="36" fill="#55ff88" font-family="monospace" font-size="15" font-weight="bold">ENLIGHT '98 DEMOPARTY</text>
              <text x="18" y="54" fill="#ffffff" font-family="monospace" font-size="11">ST. PETERSBURG — TRITON &amp; FUTURE CREW</text>
            </svg>
          `)
        },
        {
          name: 'VOODOO2_SLI_BOX.BMP',
          dim: '800×600×24b',
          size: '1406 KB',
          desc: 'Diamond Monster 3D II 12MB PCI Box Art',
          src: this.makeSvgDataUri(`
            <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
              <rect width="320" height="240" fill="#121814"/>
              <rect x="28" y="28" width="264" height="184" fill="#1b3b26" stroke="#44ff88" stroke-width="3"/>
              <rect x="55" y="75" width="75" height="65" fill="#111" stroke="#aaa"/>
              <rect x="155" y="60" width="52" height="42" fill="#111" stroke="#aaa"/>
              <rect x="155" y="112" width="52" height="42" fill="#111" stroke="#aaa"/>
              <text x="63" y="112" fill="#ffcc00" font-family="monospace" font-size="12" font-weight="bold">3Dfx FBI</text>
              <text x="163" y="85" fill="#ffcc00" font-family="monospace" font-size="10">TMU 0</text>
              <text x="163" y="137" fill="#ffcc00" font-family="monospace" font-size="10">TMU 1</text>
              <text x="45" y="52" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">VOODOO² 1000 SLI 12MB</text>
            </svg>
          `)
        },
        {
          name: 'FALLOUT2_HIGHWAYMAN.BMP',
          dim: '640×480×256c',
          size: '308 KB',
          desc: 'Fallout 2 Chryslus Highwayman Concept Art',
          src: this.makeSvgDataUri(`
            <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
              <rect width="320" height="240" fill="#2c1d10"/>
              <rect y="150" width="320" height="90" fill="#1b120a"/>
              <polygon points="45,165 95,125 225,125 275,165" fill="#8b3a22" stroke="#e6a15c" stroke-width="2"/>
              <circle cx="95" cy="170" r="18" fill="#111" stroke="#aaa" stroke-width="3"/>
              <circle cx="225" cy="170" r="18" fill="#111" stroke="#aaa" stroke-width="3"/>
              <text x="18" y="34" fill="#77ff55" font-family="monospace" font-size="13" font-weight="bold">PIP-BOY 2000 — HIGHWAYMAN</text>
            </svg>
          `)
        }
      ];
    }

    if (folderId === 'win98-wallpapers') {
      return [
        {
          name: 'CLOUDS_98.BMP',
          dim: '800×600×24b',
          size: '1406 KB',
          desc: 'Microslop Win 98 Sky & Clouds Wallpaper',
          src: this.makeSvgDataUri(`
            <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
              <defs>
                <linearGradient id="sky98" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#1e69de"/>
                  <stop offset="100%" stop-color="#8ec5fc"/>
                </linearGradient>
              </defs>
              <rect width="320" height="240" fill="url(#sky98)"/>
              <ellipse cx="95" cy="95" rx="58" ry="26" fill="#ffffff" opacity="0.9"/>
              <ellipse cx="130" cy="88" rx="46" ry="28" fill="#ffffff" opacity="0.95"/>
              <ellipse cx="225" cy="145" rx="64" ry="24" fill="#ffffff" opacity="0.88"/>
              <text x="16" y="220" fill="#002b66" font-family="sans-serif" font-size="13" font-weight="bold">Microslop Win 98 SE</text>
            </svg>
          `)
        },
        {
          name: 'CIRCUIT_MATRIX.BMP',
          dim: '640×480×16b',
          size: '600 KB',
          desc: 'Plus! 98 Science & PCB Matrix',
          src: this.makeSvgDataUri(`
            <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
              <rect width="320" height="240" fill="#082416"/>
              <path d="M20,40 H140 L170,70 H290 M40,120 H110 L145,155 H280 M30,195 H200 L230,165 H300" stroke="#28e070" stroke-width="3" fill="none"/>
              <circle cx="140" cy="40" r="5" fill="#ffd86b"/>
              <circle cx="170" cy="70" r="5" fill="#ffd86b"/>
              <circle cx="145" cy="155" r="5" fill="#ffd86b"/>
            </svg>
          `)
        },
        {
          name: 'RETRO_SYNTH_GRID.BMP',
          dim: '800×600×24b',
          size: '1406 KB',
          desc: '3D Cyber Grid Horizon 1998',
          src: this.makeSvgDataUri(`
            <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
              <rect width="320" height="240" fill="#140726"/>
              <circle cx="160" cy="110" r="45" fill="#ff3388"/>
              <rect y="120" width="320" height="120" fill="#1c0b36"/>
              <line x1="0" y1="140" x2="320" y2="140" stroke="#00ffcc" stroke-width="1.5"/>
              <line x1="0" y1="170" x2="320" y2="170" stroke="#00ffcc" stroke-width="1.5"/>
              <line x1="0" y1="205" x2="320" y2="205" stroke="#00ffcc" stroke-width="1.5"/>
              <line x1="160" y1="120" x2="20" y2="240" stroke="#ff44cc" stroke-width="1.5"/>
              <line x1="160" y1="120" x2="160" y2="240" stroke="#ff44cc" stroke-width="1.5"/>
              <line x1="160" y1="120" x2="300" y2="240" stroke="#ff44cc" stroke-width="1.5"/>
            </svg>
          `)
        }
      ];
    }

    const vfsItems = [];
    if (window.vfs && typeof window.vfs.resolvePath === 'function') {
      const picFolder = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Мои рисунки']);
      if (picFolder && picFolder.children) {
        Object.entries(picFolder.children).forEach(([name, item]) => {
          if (item && item.type === 'file' && item.content) {
            vfsItems.push({
              name,
              dim: '320×240×24b',
              size: item.size || '225 KB',
              desc: 'Рисунок из папки Мои рисунки',
              src: item.content
            });
          }
        });
      }
    }

    if (vfsItems.length > 0) return vfsItems;

    return [
      {
        name: 'Закат.bmp',
        dim: '320×240×24b',
        size: '225 KB',
        desc: 'Растровый рисунок Закат.bmp',
        src: this.makeSvgDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
            <rect width="320" height="240" fill="#ff6b35"/>
            <circle cx="160" cy="125" r="46" fill="#ffe66d"/>
            <rect y="155" width="320" height="85" fill="#1a535c"/>
          </svg>
        `)
      },
      {
        name: 'Горы.bmp',
        dim: '320×240×24b',
        size: '225 KB',
        desc: 'Растровый рисунок Горы.bmp',
        src: this.makeSvgDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
            <rect width="320" height="240" fill="#88ccf1"/>
            <polygon points="20,220 115,65 210,220" fill="#4a5859"/>
            <polygon points="120,220 215,80 305,220" fill="#323e40"/>
          </svg>
        `)
      }
    ];
  }

  getCurrentImages() {
    return this.getBuiltInGallery(this.currentFolder);
  }

  open(initialImageName) {
    this.winId = this.windowId;
    if (window.winManager && window.winManager.windows.has(this.windowId)) {
      const existing = window.winManager.windows.get(this.windowId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.windowId);
      else window.winManager.bringToTop(this.windowId);
      this.renderAll();
      return existing;
    }

    const content = `
      <div class="acdsee-shell" id="${this.windowId}-shell">
        <div class="win-menubar">
          <div class="win-menu-item" onclick="window.appACDSee.setViewMode('thumbs')"><u>F</u>ile</div>
          <div class="win-menu-item" onclick="window.appACDSee.setViewMode('viewer')"><u>V</u>iew</div>
          <div class="win-menu-item" onclick="window.appACDSee.setAsWallpaper()"><u>T</u>ools</div>
          <div class="win-menu-item" onclick="window.appACDSee.showAbout()"><u>H</u>elp</div>
        </div>

        <div class="acdsee-toolbar">
          <button class="acdsee-tb-btn active" id="acdsee-btn-thumbs" onclick="window.appACDSee.setViewMode('thumbs')">🖼️ Эскизы</button>
          <button class="acdsee-tb-btn" id="acdsee-btn-details" onclick="window.appACDSee.setViewMode('details')">📋 Таблица</button>
          <button class="acdsee-tb-btn" id="acdsee-btn-viewer" onclick="window.appACDSee.setViewMode('viewer')">🔍 Просмотр</button>
          <div class="acdsee-tb-sep"></div>
          <button class="acdsee-tb-btn" id="acdsee-btn-prev" onclick="window.appACDSee.stepImage(-1)">◀ Пред.</button>
          <button class="acdsee-tb-btn" id="acdsee-btn-next" onclick="window.appACDSee.stepImage(1)">След. ▶</button>
          <button class="acdsee-tb-btn" id="acdsee-btn-slideshow" onclick="window.appACDSee.toggleSlideshow()">▶️ Слайд-шоу</button>
          <div class="acdsee-tb-sep"></div>
          <button class="acdsee-tb-btn" id="acdsee-btn-rotate" onclick="window.appACDSee.rotateImage()">🔄 90°</button>
          <button class="acdsee-tb-btn" id="acdsee-btn-wallpaper" onclick="window.appACDSee.setAsWallpaper()">🖥️ Сделать фоном Рабочего стола</button>
        </div>

        <div class="acdsee-browser-layout" id="acdsee-browser-layout">
          <div class="acdsee-left-col">
            <div class="acdsee-tree-box" id="acdsee-folder-tree"></div>
            <div class="acdsee-preview-box" id="acdsee-preview-box"></div>
          </div>
          <div class="acdsee-right-col" id="acdsee-file-pane"></div>
        </div>

        <div class="acdsee-viewer-stage" id="acdsee-viewer-stage" ondblclick="window.appACDSee.setViewMode('thumbs')"></div>

        <div class="status-bar">
          <div class="status-bar-field" id="acdsee-status-left">ACDSee 32 v2.23 High-Speed Image Viewer</div>
          <div class="status-bar-field" id="acdsee-status-right" style="flex:0 0 215px;">0 objects</div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.windowId,
      title: 'ACDSee 32 v2.23 - [C:\\My Documents\\Мои рисунки]',
      icon: 'acdsee',
      width: 690,
      height: 475,
      minWidth: 540,
      minHeight: 370,
      content,
      onClose: () => this.stopSlideshow()
    });

    if (initialImageName) {
      const imgs = this.getCurrentImages();
      const idx = imgs.findIndex((x) => x.name.toLowerCase() === String(initialImageName).toLowerCase());
      if (idx >= 0) this.selectedIndex = idx;
    }

    this.renderAll();
    return win;
  }

  selectFolder(folderId) {
    this.currentFolder = folderId;
    this.selectedIndex = 0;
    this.viewerRotation = 0;
    this.renderAll();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.renderAll();
  }

  selectImage(idx) {
    const imgs = this.getCurrentImages();
    if (!imgs.length) return;
    this.selectedIndex = Math.max(0, Math.min(imgs.length - 1, idx));
    this.viewerRotation = 0;
    this.renderAll();
  }

  openImageInViewer(idx) {
    this.selectImage(idx);
    this.setViewMode('viewer');
  }

  stepImage(delta) {
    const imgs = this.getCurrentImages();
    if (!imgs.length) return;
    this.selectedIndex = (this.selectedIndex + delta + imgs.length) % imgs.length;
    this.viewerRotation = 0;
    this.renderAll();
  }

  rotateImage() {
    this.viewerRotation = (this.viewerRotation + 90) % 360;
    this.renderAll();
  }

  toggleSlideshow() {
    if (this.slideshowTimer) {
      this.stopSlideshow();
      this.renderAll();
      return;
    }
    this.slideshowTimer = setInterval(() => {
      if (!document.getElementById(this.windowId)) {
        this.stopSlideshow();
        return;
      }
      this.stepImage(1);
    }, 1800);
    this.renderAll();
  }

  stopSlideshow() {
    if (this.slideshowTimer) {
      clearInterval(this.slideshowTimer);
      this.slideshowTimer = null;
    }
  }

  setAsWallpaper() {
    const imgs = this.getCurrentImages();
    const current = imgs[this.selectedIndex] || imgs[0];
    if (!current) return;

    const desktop = document.getElementById('desktop');
    if (desktop) {
      desktop.style.backgroundImage = `url("${current.src}")`;
      desktop.style.backgroundSize = 'cover';
      desktop.style.backgroundPosition = 'center';
    }

    const statusLeft = document.getElementById('acdsee-status-left');
    if (statusLeft) {
      statusLeft.textContent = `Обои Рабочего стола обновлены: ${current.name} (${current.dim})`;
    }
  }

  renderAll() {
    const imgs = this.getCurrentImages();
    const current = imgs[this.selectedIndex] || imgs[0];
    const folderMeta = this.folders.find((f) => f.id === this.currentFolder) || this.folders[0];

    if (window.winManager && typeof window.winManager.setTitle === 'function') {
      window.winManager.setTitle(this.windowId, `ACDSee 32 v2.23 - [${folderMeta.label}${current ? ' — ' + current.name : ''}]`);
    }

    const bThumbs = document.getElementById('acdsee-btn-thumbs');
    const bDetails = document.getElementById('acdsee-btn-details');
    const bViewer = document.getElementById('acdsee-btn-viewer');
    const bSlide = document.getElementById('acdsee-btn-slideshow');
    if (bThumbs) bThumbs.classList.toggle('active', this.viewMode === 'thumbs');
    if (bDetails) bDetails.classList.toggle('active', this.viewMode === 'details');
    if (bViewer) bViewer.classList.toggle('active', this.viewMode === 'viewer');
    if (bSlide) {
      bSlide.classList.toggle('active', Boolean(this.slideshowTimer));
      bSlide.textContent = this.slideshowTimer ? '⏹ Стоп слайд-шоу' : '▶️ Слайд-шоу';
    }

    const browserLayout = document.getElementById('acdsee-browser-layout');
    const viewerStage = document.getElementById('acdsee-viewer-stage');
    if (browserLayout && viewerStage) {
      const isViewer = this.viewMode === 'viewer';
      browserLayout.style.display = isViewer ? 'none' : 'grid';
      viewerStage.classList.toggle('active', isViewer);
    }

    this.renderFolderTree();
    this.renderPreviewBox(current);
    this.renderFilePane(imgs);
    this.renderViewerStage(current);

    const statusLeft = document.getElementById('acdsee-status-left');
    const statusRight = document.getElementById('acdsee-status-right');
    if (statusLeft && current) {
      statusLeft.textContent = `${current.name} — ${current.desc}`;
    }
    if (statusRight) {
      statusRight.textContent = current
        ? `${imgs.length} файл(ов) | ${current.dim} | ${current.size}`
        : `${imgs.length} файл(ов)`;
    }
  }

  renderFolderTree() {
    const tree = document.getElementById('acdsee-folder-tree');
    if (!tree) return;
    tree.innerHTML = this.folders.map((f) => `
      <div class="acdsee-folder-item ${f.id === this.currentFolder ? 'active' : ''}"
           data-folder="${f.id}"
           onclick="window.appACDSee.selectFolder('${f.id}')">
        <span>${f.icon}</span>
        <span>${f.label}</span>
      </div>
    `).join('');
  }

  renderPreviewBox(current) {
    const box = document.getElementById('acdsee-preview-box');
    if (!box) return;
    if (!current) {
      box.innerHTML = '<div>Нет изображений</div>';
      return;
    }
    box.innerHTML = `
      <img src="${current.src}" alt="${current.name}" style="transform: rotate(${this.viewerRotation}deg);" />
      <div class="acdsee-preview-meta">${current.name} (${current.dim})</div>
    `;
  }

  renderFilePane(imgs) {
    const pane = document.getElementById('acdsee-file-pane');
    if (!pane) return;

    if (this.viewMode === 'details') {
      pane.innerHTML = `
        <table class="acdsee-details-table">
          <thead>
            <tr>
              <th>Имя файла</th>
              <th>Размер</th>
              <th>Разрешение</th>
              <th>Описание</th>
            </tr>
          </thead>
          <tbody>
            ${imgs.map((img, idx) => `
              <tr class="acdsee-details-row ${idx === this.selectedIndex ? 'selected' : ''}"
                  onclick="window.appACDSee.selectImage(${idx})"
                  ondblclick="window.appACDSee.openImageInViewer(${idx})">
                <td>🖼️ ${img.name}</td>
                <td>${img.size}</td>
                <td>${img.dim}</td>
                <td>${img.desc}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      return;
    }

    pane.innerHTML = `
      <div class="acdsee-thumb-grid">
        ${imgs.map((img, idx) => `
          <div class="acdsee-thumb-card ${idx === this.selectedIndex ? 'selected' : ''}"
               data-idx="${idx}"
               onclick="window.appACDSee.selectImage(${idx})"
               ondblclick="window.appACDSee.openImageInViewer(${idx})">
            <div class="acdsee-thumb-frame">
              <img src="${img.src}" alt="${img.name}" />
            </div>
            <div class="acdsee-thumb-name">${img.name}</div>
            <div class="acdsee-thumb-dim">${img.dim}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderViewerStage(current) {
    const stage = document.getElementById('acdsee-viewer-stage');
    if (!stage || !current) return;
    stage.innerHTML = `
      <img class="acdsee-viewer-img"
           src="${current.src}"
           alt="${current.name}"
           style="transform: rotate(${this.viewerRotation}deg) scale(${this.viewerZoom / 100});" />
    `;
  }

  showAbout() {
    if (window.dialogs && typeof window.dialogs.alert === 'function') {
      window.dialogs.alert(
        'ACDSee 32 v2.23 (1998) ACD Systems Ltd.\nБыстрый просмотрщик графики с компакт-диска «Игромания» №9 (D:\\soft_u\\acdc3223.exe).',
        'About ACDSee 32'
      );
    }
  }

  close() {
    this.stopSlideshow();
    if (window.winManager) window.winManager.closeWindow(this.windowId);
  }
}

window.appACDSee = new AppACDSee();
