/**
 * Imaging for Win (Kodak Image Viewer)
 * Built-in Win 98 Image Viewer.
 * Features zoom, 90-degree rotation, prev/next folder navigation, slideshow, and image properties.
 */
class AppImageViewer {
  constructor() {
    this.currentFileName = 'windows_clouds.bmp';
    this.currentPath = ['My Computer', 'C:', 'My Documents', 'Мои рисунки'];
    this.zoomLevel = 1.0;
    this.rotation = 0; // 0, 90, 180, 270
    this.slideshowInterval = null;
  }

  open(fileName = 'windows_clouds.bmp', imageSrc = null, path = null) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    this.currentFileName = fileName || 'windows_clouds.bmp';
    if (path) this.currentPath = path;
    this.zoomLevel = 1.0;
    this.rotation = 0;

    const winId = 'app_img_' + Date.now();
    const win = window.winManager.createWindow({
      id: winId,
      title: `${this.currentFileName} - ${t('imaging.title')}`,
      icon: 'imaging',
      width: 580,
      height: 440,
      content: this.buildHTML(winId)
    });

    this.initEvents(win, winId, imageSrc);
  }

  buildHTML(winId) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    return `
      <div class="imaging-container" id="${winId}_root">
        <div class="win-menubar">
          <div class="win-menu-item">
            ${t('imaging.menuFile')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option img-opt-open">${t('imaging.menuOpen')} <span>Ctrl+O</span></div>
              <div class="win-dropdown-option img-opt-save">${t('imaging.menuSaveAs')} <span>Ctrl+S</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option img-opt-print">${t('imaging.menuPrint')} <span>Ctrl+P</span></div>
              <div class="win-dropdown-option img-opt-wallpaper">&#128187; Сделать фоном рабочего стола</div>
              <div class="win-dropdown-option img-opt-props">${t('imaging.menuProps')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option img-opt-exit">${t('imaging.menuExit')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('imaging.menuView')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option img-opt-zoomin">${t('imaging.menuZoomIn')} <span>+</span></div>
              <div class="win-dropdown-option img-opt-zoomout">${t('imaging.menuZoomOut')} <span>-</span></div>
              <div class="win-dropdown-option img-opt-actual">${t('imaging.menuActual')} <span>*</span></div>
              <div class="win-dropdown-option img-opt-fit">${t('imaging.menuFit')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option img-opt-slideshow">${t('imaging.menuSlideshow')} <span>F5</span></div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('imaging.menuImage')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option img-opt-rot-left">${t('imaging.menuRotLeft')} <span>Ctrl+L</span></div>
              <div class="win-dropdown-option img-opt-rot-right">${t('imaging.menuRotRight')} <span>Ctrl+K</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option img-opt-edit-paint">${t('imaging.menuEditPaint')}</div>
              <div class="win-dropdown-option img-opt-edit-ps">${t('imaging.menuEditPs')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('imaging.menuHelp')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option img-opt-about">${t('imaging.menuAbout')}</div>
            </div>
          </div>
        </div>

        <div class="imaging-toolbar">
          <button class="imaging-tool-btn" id="${winId}_btn_open" title="${t('imaging.menuOpen')}">${Icons['tb16-open']}</button>
          <button class="imaging-tool-btn" id="${winId}_btn_save" title="${t('imaging.btnSave')}">${Icons['tb16-save']}</button>
          <button class="imaging-tool-btn" id="${winId}_btn_print" title="${t('imaging.btnPrint')}">${Icons['tb16-print']}</button>
          <div class="imaging-separator"></div>
          <button class="imaging-tool-btn" id="${winId}_btn_prev" title="${t('imaging.tipPrev')}">${Icons['tb16-prev']}</button>
          <button class="imaging-tool-btn" id="${winId}_btn_next" title="${t('imaging.tipNext')}">${Icons['tb16-next']}</button>
          <div class="imaging-separator"></div>
          <button class="imaging-tool-btn" id="${winId}_btn_zoomin" title="${t('imaging.tipZoomIn')}">${Icons['tb16-zoomin']}</button>
          <button class="imaging-tool-btn" id="${winId}_btn_zoomout" title="${t('imaging.tipZoomOut')}">${Icons['tb16-zoomout']}</button>
          <button class="imaging-tool-btn" id="${winId}_btn_actual" title="100%">${Icons['tb16-actual']}</button>
          <button class="imaging-tool-btn" id="${winId}_btn_fit" title="${t('imaging.tipFit')}">${Icons['tb16-fit']}</button>
          <div class="imaging-separator"></div>
          <button class="imaging-tool-btn" id="${winId}_btn_rot_left" title="${t('imaging.tipRotLeft')}">${Icons['tb16-rotleft']}</button>
          <button class="imaging-tool-btn" id="${winId}_btn_rot_right" title="${t('imaging.tipRotRight')}">${Icons['tb16-rotright']}</button>
          <div class="imaging-separator"></div>
          <button class="imaging-tool-btn" id="${winId}_btn_slide" title="${t('imaging.menuSlideshow')}">${Icons['tb16-slide']}</button>
        </div>

        <div class="imaging-viewport" id="${winId}_viewport">
          <div class="imaging-img-wrap" id="${winId}_wrap">
            <img class="imaging-img" id="${winId}_img" alt="image">
          </div>
        </div>

        <div class="win-statusbar">
          <div class="win-status-pane grow" id="${winId}_status">${t('imaging.statusLoading')}</div>
          <div class="win-status-pane" style="width:90px;" id="${winId}_zoom_val">100%</div>
          <div class="win-status-pane" style="width:130px;" id="${winId}_dims">640 x 480 x 24bpp</div>
        </div>

        <input type="file" id="${winId}_file_in" accept="image/*" style="display:none;">
      </div>
    `;
  }

  initEvents(win, winId, initialSrc) {
    const el = win.element;
    const img = el.querySelector(`#${winId}_img`);
    const wrap = el.querySelector(`#${winId}_wrap`);
    const statusText = el.querySelector(`#${winId}_status`);
    const zoomText = el.querySelector(`#${winId}_zoom_val`);
    const dimsText = el.querySelector(`#${winId}_dims`);
    const fileInput = el.querySelector(`#${winId}_file_in`);

    let curZoom = 1.0;
    let curRot = 0;
    let isSlideshow = false;

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

    const updateTransform = () => {
      wrap.style.transform = `scale(${curZoom}) rotate(${curRot}deg)`;
      zoomText.textContent = `${Math.round(curZoom * 100)}%`;
    };

    const loadImageSrc = (src, title) => {
      img.onload = () => {
        statusText.textContent = t('imaging.statusReady', title);
        dimsText.textContent = `${img.naturalWidth} x ${img.naturalHeight} x 24bpp`;
        curZoom = 1.0;
        curRot = 0;
        updateTransform();
      };
      img.src = src;
      win.titleElement.textContent = `${title} - ${t('imaging.title')}`;
    };

    // Find source from VFS if not provided
    if (initialSrc) {
      loadImageSrc(initialSrc, this.currentFileName);
    } else if (window.vfs) {
      const fileData = window.vfs.readFile(this.currentPath, this.currentFileName);
      if (fileData) {
        loadImageSrc(fileData, this.currentFileName);
      } else {
        // Sample image fallback
        loadImageSrc('https://picsum.photos/640/480', this.currentFileName);
      }
    }

    // Zoom buttons
    el.querySelector(`#${winId}_btn_zoomin`).addEventListener('click', () => {
      curZoom = Math.min(5.0, curZoom + 0.25);
      updateTransform();
    });
    el.querySelector(`#${winId}_btn_zoomout`).addEventListener('click', () => {
      curZoom = Math.max(0.1, curZoom - 0.25);
      updateTransform();
    });
    el.querySelector(`#${winId}_btn_actual`).addEventListener('click', () => {
      curZoom = 1.0;
      updateTransform();
    });
    el.querySelector(`#${winId}_btn_fit`).addEventListener('click', () => {
      const vp = el.querySelector(`#${winId}_viewport`);
      const ratioW = (vp.clientWidth - 40) / (img.naturalWidth || 500);
      const ratioH = (vp.clientHeight - 40) / (img.naturalHeight || 400);
      curZoom = Math.min(ratioW, ratioH, 1.0);
      updateTransform();
    });

    // Rotation
    el.querySelector(`#${winId}_btn_rot_left`).addEventListener('click', () => {
      curRot = (curRot - 90 + 360) % 360;
      updateTransform();
    });
    el.querySelector(`#${winId}_btn_rot_right`).addEventListener('click', () => {
      curRot = (curRot + 90) % 360;
      updateTransform();
    });

    // Folder next/prev navigation
    const getFolderImages = () => {
      if (!window.vfs) return [];
      const items = window.vfs.list(this.currentPath);
      return items.filter(i => i.name && (i.name.endsWith('.bmp') || i.name.endsWith('.png') || i.name.endsWith('.jpg') || i.name.endsWith('.gif')));
    };

    const navigateImage = (dir) => {
      const imgs = getFolderImages();
      if (imgs.length <= 1) return;
      let idx = imgs.findIndex(i => i.name === this.currentFileName);
      if (idx === -1) idx = 0;
      idx = (idx + dir + imgs.length) % imgs.length;
      const nextItem = imgs[idx];
      this.currentFileName = nextItem.name;
      loadImageSrc(nextItem.content || '', nextItem.name);
    };

    el.querySelector(`#${winId}_btn_prev`).addEventListener('click', () => navigateImage(-1));
    el.querySelector(`#${winId}_btn_next`).addEventListener('click', () => navigateImage(1));

    // Slideshow
    const btnSlide = el.querySelector(`#${winId}_btn_slide`);
    btnSlide.addEventListener('click', () => {
      isSlideshow = !isSlideshow;
      if (isSlideshow) {
        btnSlide.textContent = t('imaging.btnSlideStop');
        statusText.textContent = t('imaging.statusSlideshowActive');
        this.slideshowInterval = setInterval(() => navigateImage(1), 3000);
      } else {
        btnSlide.textContent = t('imaging.btnSlide');
        statusText.textContent = t('imaging.statusSlideshowStopped');
        clearInterval(this.slideshowInterval);
      }
    });

    // Open file
    el.querySelector(`#${winId}_btn_open`).addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.currentFileName = f.name;
          loadImageSrc(ev.target.result, f.name);
        };
        reader.readAsDataURL(f);
      }
    });

    // Save file
    el.querySelector(`#${winId}_btn_save`).addEventListener('click', () => {
      const name = prompt(t('imaging.savePrompt'), this.currentFileName);
      if (name && window.vfs) {
        window.vfs.writeFile(this.currentPath, name, img.src);
        alert(t('imaging.saveSuccess', name));
      }
    });

    // Print
    el.querySelector(`#${winId}_btn_print`).addEventListener('click', () => {
      window.winManager.openDialog({
        title: t('imaging.printTitle'),
        icon: 'printer',
        message: t('imaging.printMsg', this.currentFileName)
      });
    });

    // Menubar items
    const setupMenu = (sel, fn) => {
      const opt = el.querySelector(sel);
      if (opt) opt.addEventListener('click', fn);
    };

    setupMenu('.img-opt-open', () => fileInput.click());
    setupMenu('.img-opt-save', () => el.querySelector(`#${winId}_btn_save`).click());
    setupMenu('.img-opt-print', () => el.querySelector(`#${winId}_btn_print`).click());
    setupMenu('.img-opt-zoomin', () => el.querySelector(`#${winId}_btn_zoomin`).click());
    setupMenu('.img-opt-zoomout', () => el.querySelector(`#${winId}_btn_zoomout`).click());
    setupMenu('.img-opt-actual', () => el.querySelector(`#${winId}_btn_actual`).click());
    setupMenu('.img-opt-fit', () => el.querySelector(`#${winId}_btn_fit`).click());
    setupMenu('.img-opt-rot-left', () => el.querySelector(`#${winId}_btn_rot_left`).click());
    setupMenu('.img-opt-rot-right', () => el.querySelector(`#${winId}_btn_rot_right`).click());
    setupMenu('.img-opt-slideshow', () => btnSlide.click());
    setupMenu('.img-opt-exit', () => window.winManager.closeWindow(winId));

    setupMenu('.img-opt-edit-paint', () => {
      if (window.appPaint) window.appPaint.open(this.currentFileName, img.src, this.currentPath);
    });

    setupMenu('.img-opt-edit-ps', () => {
      if (window.appPhotoshop) window.appPhotoshop.open(this.currentFileName, img.src, this.currentPath);
    });

    setupMenu('.img-opt-props', () => {
      window.winManager.openDialog({
        title: t('imaging.propsTitle'),
        icon: 'imaging',
        message: t('imaging.propsMsg', this.currentFileName, img.naturalWidth, img.naturalHeight)
      });
    });

    setupMenu('.img-opt-wallpaper', () => {
      if (img.src && window.appDialogs) {
        window.appDialogs.saveDisplaySettings({
          wallpaper: img.src,
          wallpaperMode: 'stretch'
        });
        window.appDialogs.applyDisplaySettings(window.appDialogs.getDisplaySettings());
        if (window.soundSys) window.soundSys.playDing();
        window.winManager.openDialog({
          title: 'Свойства экрана',
          icon: 'info',
          message: `Рисунок <b>${this.currentFileName}</b> успешно установлен в качестве фона рабочего стола!`
        });
      }
    });

    setupMenu('.img-opt-about', () => {
      window.winManager.openDialog({
        title: t('imaging.aboutTitle'),
        icon: 'imaging',
        message: t('imaging.aboutMsg')
      });
    });

    // Cleanup on window close
    win.element.addEventListener('window-close', () => {
      if (this.slideshowInterval) clearInterval(this.slideshowInterval);
    });
  }
}

window.appImageViewer = new AppImageViewer();
