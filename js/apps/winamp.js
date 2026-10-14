const t = (k, ...a) => (window.i18n ? window.i18n.t(k, ...a) : k);

class AppWinamp {
  static WIN_ID = 'app_winamp';
  static STATE_KEY = 'win98_winamp_state';
  static SKINS_PATH = ['My Computer', 'C:', 'Program Files', 'Winamp', 'Skins'];
  static EQ_FREQS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
  static EQ_LABELS = ['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'];
  static EQ_PRESETS = [
    { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'Rock', gains: [5, 4, 2, -1, -2, 1, 3, 5, 5, 6] },
    { name: 'Pop', gains: [-1, 1, 3, 4, 3, 1, -1, 1, 3, 4] },
    { name: 'Techno', gains: [6, 5, 2, 0, -3, 0, 3, 5, 6, 6] },
    { name: 'Bass Boost', gains: [7, 6, 5, 3, 1, 0, 0, 0, 0, 0] },
    { name: 'Treble Boost', gains: [0, 0, 0, 0, 0, 2, 4, 6, 7, 8] },
    { name: 'Classical', gains: [0, 0, 0, 0, 0, 0, -4, -4, -4, -6] },
    { name: 'Live', gains: [-3, 0, 2, 3, 3, 3, 2, 1, 1, 1] },
    { name: '1998 Dance', gains: [4, 6, 4, -1, 0, 3, 4, 5, 4, 2] }
  ];
  static VIZ_MODES = ['bars', 'scope', 'off'];
  static ICONS = {
    prev: '<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true"><path d="M1 1h2v8H1zM9 1v8L3 5z"/></svg>',
    play: '<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 1v8l7-4z"/></svg>',
    pause: '<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 1h2v8H2zM6 1h2v8H6z"/></svg>',
    stop: '<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 2h6v6H2z"/></svg>',
    next: '<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true"><path d="M1 1v8l6-4zM7 1h2v8H7z"/></svg>',
    eject: '<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true"><path d="M5 1l4 5H1zM1 7h8v2H1z"/></svg>'
  };

  static defaultPlaylist() {
    return [
      {
        title: "Winamp Intro (It really whips the llama's ass!)",
        artist: 'Nullsoft',
        src: 'content/music/Intro.mp3',
        duration: '0:05',
        seconds: 5
      },
      {
        title: "Loadsamoney (Doin' Up the House)",
        artist: 'Harry Enfield',
        src: 'content/music/Loadsamoney.mp3',
        duration: '3:48',
        seconds: 228
      }
    ];
  }

  constructor() {
    this.playlist = AppWinamp.defaultPlaylist();
    this.currentTrackIndex = 0;
    this.selectedTrackIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.isShuffle = false;
    this.isRepeat = true;
    this.volume = 0.8;
    this.pan = 0;
    this.vizMode = 'bars';
    this.showRemaining = false;
    this.isEqOpen = false;
    this.isPlOpen = true;
    this.isShaded = false;
    this.eqEnabled = true;
    this.preamp = 0;
    this.eqGains = new Array(10).fill(0);
    this.currentSkin = 'classic';
    this.loadState();

    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('loadedmetadata', () => this.rememberDuration());

    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.preampNode = null;
    this.gainNode = null;
    this.panNode = null;
    this.eqNodes = [];
    this.audioConnected = false;
    this.freqBuffer = null;
    this.waveBuffer = null;

    this.win = null;
    this.animFrameId = null;
    this.levels = [];
    this.peaks = [];
    this.peakFall = [];
    this.synthT = 0;
    this.tickerText = '';
    this.tickerOffset = 0;
    this.tickerLoop = 0;
    this.flashText = '';
    this.flashUntil = 0;
    this.midiStartedAt = 0;
    this.skinColors = null;
    this.seekDragging = false;
  }

  loadState() {
    try {
      const raw = localStorage.getItem(AppWinamp.STATE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.volume === 'number') this.volume = Math.min(1, Math.max(0, saved.volume));
      if (typeof saved.pan === 'number') this.pan = Math.min(1, Math.max(-1, saved.pan));
      ['isShuffle', 'isRepeat', 'showRemaining', 'isEqOpen', 'isPlOpen', 'isShaded', 'eqEnabled'].forEach(key => {
        if (typeof saved[key] === 'boolean') this[key] = saved[key];
      });
      if (AppWinamp.VIZ_MODES.includes(saved.vizMode)) this.vizMode = saved.vizMode;
      if (typeof saved.preamp === 'number') this.preamp = saved.preamp;
      if (Array.isArray(saved.eqGains) && saved.eqGains.length === 10) this.eqGains = saved.eqGains.map(v => Number(v) || 0);
      if (this.findSkin(saved.skin)) this.currentSkin = saved.skin;
    } catch (e) {}
  }

  saveState() {
    try {
      localStorage.setItem(AppWinamp.STATE_KEY, JSON.stringify({
        volume: this.volume,
        pan: this.pan,
        isShuffle: this.isShuffle,
        isRepeat: this.isRepeat,
        showRemaining: this.showRemaining,
        isEqOpen: this.isEqOpen,
        isPlOpen: this.isPlOpen,
        isShaded: this.isShaded,
        eqEnabled: this.eqEnabled,
        vizMode: this.vizMode,
        preamp: this.preamp,
        eqGains: this.eqGains,
        skin: this.currentSkin
      }));
    } catch (e) {}
  }

  skins() {
    return window.winampSkins || [{ id: 'classic', name: 'Nullsoft Base Skin', file: 'Base.wsz' }];
  }

  findSkin(id) {
    return this.skins().find(skin => skin.id === id) || null;
  }

  parseSkinId(content) {
    const match = /(?:^|\n)id=([\w-]+)/.exec(String(content || ''));
    return match ? match[1] : null;
  }

  getInstalledSkinIds() {
    const ids = new Set(['classic']);
    if (window.vfs && typeof window.vfs.list === 'function') {
      window.vfs.list(AppWinamp.SKINS_PATH).forEach(item => {
        if (!String(item.name || item.key).toLowerCase().endsWith('.wsz')) return;
        const id = this.parseSkinId(item.content);
        if (this.findSkin(id)) ids.add(id);
      });
    }
    return this.skins().filter(skin => ids.has(skin.id)).map(skin => skin.id);
  }

  isSkinInstalled(id) {
    return this.getInstalledSkinIds().includes(id);
  }

  installSkin(id) {
    const skin = this.findSkin(id);
    const vfs = window.vfs;
    if (!skin || !vfs || typeof vfs.resolvePath !== 'function') return false;
    if (skin.id === 'classic' || this.isSkinInstalled(skin.id)) return true;
    const winampDir = AppWinamp.SKINS_PATH.slice(0, -1);
    if (!vfs.resolvePath(AppWinamp.SKINS_PATH)) {
      if (!vfs.resolvePath(winampDir)) return false;
      vfs.createFolder(winampDir, 'Skins');
    }
    return vfs.writeFile(AppWinamp.SKINS_PATH, skin.file, `[Winamp Skin]\nid=${skin.id}\nname=${skin.name}\nauthor=${skin.author || ''}\n`);
  }

  setSkin(skinId) {
    const skin = this.findSkin(skinId) || this.findSkin('classic');
    this.installSkin(skin.id);
    this.currentSkin = skin.id;
    this.saveState();
    this.applySkinClass();
    this.drawEqCurve();
    if (this.win) this.flash(t('winamp.flashSkin', skin.name));
  }

  applySkinClass() {
    const el = this.win && this.win.element;
    if (!el) return;
    this.skins().forEach(skin => el.classList.remove('wa-skin-' + skin.id));
    el.classList.add('wa-skin-' + this.currentSkin);
    this.skinColors = null;
  }

  readSkinColors() {
    const colors = { low: '#1db83a', mid: '#dcd61e', high: '#ef3b1f', peak: '#c9c9d8', line: '#00e428', dim: '#135a1f' };
    const el = this.win && this.win.element;
    if (!el || typeof getComputedStyle !== 'function') return colors;
    const style = getComputedStyle(el);
    const read = (name, fallback) => (style.getPropertyValue(name) || '').trim() || fallback;
    return {
      low: read('--wa-viz-1', colors.low),
      mid: read('--wa-viz-2', colors.mid),
      high: read('--wa-viz-3', colors.high),
      peak: read('--wa-viz-peak', colors.peak),
      line: read('--wa-lcd-text', colors.line),
      dim: read('--wa-lcd-dim', colors.dim)
    };
  }

  colors() {
    if (!this.skinColors) this.skinColors = this.readSkinColors();
    return this.skinColors;
  }

  initAudioContext() {
    if (this.audioCtx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.55;
      this.preampNode = this.audioCtx.createGain();
      this.gainNode = this.audioCtx.createGain();
      if (this.audioCtx.createStereoPanner) this.panNode = this.audioCtx.createStereoPanner();
      this.eqNodes = AppWinamp.EQ_FREQS.map(freq => {
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
      const chain = [this.sourceNode, this.preampNode, ...this.eqNodes, this.analyser, this.panNode, this.gainNode].filter(Boolean);
      chain.reduce((from, to) => {
        from.connect(to);
        return to;
      });
      this.gainNode.connect(this.audioCtx.destination);
      this.audioConnected = true;
      this.applyEq();
      this.applyVolume();
      this.applyPan();
    } catch (e) {
      console.warn('Web Audio API not fully available, using fallback visualizer:', e);
    }
  }

  applyEq() {
    if (this.preampNode) this.preampNode.gain.value = this.eqEnabled ? Math.pow(10, this.preamp / 20) : 1;
    this.eqNodes.forEach((node, i) => {
      node.gain.value = this.eqEnabled ? this.eqGains[i] : 0;
    });
  }

  applyVolume() {
    this.audio.volume = this.volume;
    if (this.gainNode) this.gainNode.gain.value = this.volume;
  }

  applyPan() {
    if (this.panNode) this.panNode.pan.value = this.pan;
  }

  currentTrack() {
    return this.playlist[this.currentTrackIndex] || null;
  }

  trackLabel(track) {
    return track.artist ? `${track.artist} - ${track.title}` : track.title;
  }

  trackKind(track) {
    const key = `${track.title || ''} ${track.src || ''}`.toLowerCase();
    if (key.includes('canyon') || key.includes('passport') || /\.midi?$/.test(String(track.src || '').toLowerCase())) return 'midi';
    return track.live ? 'stream' : 'file';
  }

  formatClock(secs, padMinutes = false) {
    const total = Math.max(0, Math.floor(Number(secs) || 0));
    const minutes = Math.floor(total / 60);
    return `${padMinutes ? String(minutes).padStart(2, '0') : minutes}:${String(total % 60).padStart(2, '0')}`;
  }

  escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  query(suffix) {
    return this.win && this.win.element ? this.win.element.querySelector(`#${AppWinamp.WIN_ID}_${suffix}`) : null;
  }

  addTrack({ title, artist = '', src, live = false }) {
    const track = { title, artist, src, live, duration: '', seconds: 0 };
    const kind = this.trackKind(track);
    if (kind === 'midi') track.duration = 'MIDI';
    if (kind === 'stream') track.duration = 'LIVE';
    this.playlist.push(track);
    this.probeDuration(track);
    this.renderPlaylist();
    return this.playlist.length - 1;
  }

  probeDuration(track) {
    if (this.trackKind(track) !== 'file' || typeof Audio === 'undefined') return;
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.addEventListener('loadedmetadata', () => {
      if (!isFinite(probe.duration)) return;
      track.seconds = probe.duration;
      track.duration = this.formatClock(probe.duration);
      this.renderPlaylist();
    });
    probe.src = track.src;
  }

  rememberDuration() {
    const track = this.currentTrack();
    if (!track || this.trackKind(track) !== 'file' || !isFinite(this.audio.duration)) return;
    if (Math.floor(track.seconds) === Math.floor(this.audio.duration)) return;
    track.seconds = this.audio.duration;
    track.duration = this.formatClock(this.audio.duration);
    this.renderPlaylist();
  }

  open(fileName = null, fileSrc = null) {
    if (fileName && /\.wsz$/i.test(fileName)) return this.openSkinFile(fileSrc);

    let target = null;
    if (fileName && fileSrc) {
      const known = this.playlist.findIndex(track => track.src === fileSrc);
      target = known !== -1 ? known : this.addTrack({ title: fileName.replace(/\.[^/.]+$/, ''), src: fileSrc });
    }

    const existing = this.focusWindow();
    if (existing) {
      if (target !== null) this.play(target);
      return existing;
    }

    const win = this.createWindow();
    const startIndex = target !== null ? target : 0;
    this.currentTrackIndex = startIndex;
    this.selectedTrackIndex = startIndex;
    this.renderPlaylist();
    this.updateUI();
    setTimeout(() => {
      if (this.win === win) this.play(startIndex);
    }, 150);
    return win;
  }

  focusWindow() {
    const wm = window.winManager;
    if (!wm || !wm.windows.has(AppWinamp.WIN_ID)) return null;
    const win = wm.windows.get(AppWinamp.WIN_ID);
    if (win.isMinimized) wm.restoreWindow(AppWinamp.WIN_ID);
    else wm.bringToTop(AppWinamp.WIN_ID);
    return win;
  }

  openSkinFile(content) {
    const id = this.parseSkinId(content);
    if (!this.findSkin(id)) {
      window.winManager.openDialog({ title: 'WinAmp 98 Pro', icon: 'error', message: t('winamp.skinBroken') });
      return null;
    }
    const win = this.focusWindow() || this.open();
    this.setSkin(id);
    return win;
  }

  createWindow() {
    const winId = AppWinamp.WIN_ID;
    const win = window.winManager.createWindow({
      id: winId,
      title: 'WinAmp 98 Pro',
      icon: 'winamp',
      width: 380,
      height: 'auto',
      minHeight: 0,
      resizable: false,
      maximizable: false,
      content: this.buildHTML(winId),
      onClose: () => this.handleClose()
    });
    this.win = win;
    this.decorateWindow(win);
    this.attachEvents(win, winId);
    return win;
  }

  handleClose() {
    this.stop();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = null;
    this.win = null;
  }

  decorateWindow(win) {
    const el = win.element;
    el.classList.add('winamp-window');
    el.style.height = 'auto';
    this.applySkinClass();

    const icon = el.querySelector('.win-titlebar-icon');
    if (icon) {
      icon.classList.add('wa-menu-button');
      icon.title = t('winamp.tipMenu');
      icon.addEventListener('click', () => {
        const rect = icon.getBoundingClientRect();
        setTimeout(() => this.showMainMenu(rect.left, rect.bottom + 2), 0);
      });
    }

    const controls = el.querySelector('.win-titlebar-controls');
    if (controls) {
      const shade = document.createElement('button');
      shade.className = 'win-control-btn wa-shade-button';
      shade.title = t('winamp.tipShade');
      shade.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleShade();
      });
      controls.insertBefore(shade, controls.firstChild);
    }
  }

  buildHTML(winId) {
    const icons = AppWinamp.ICONS;
    const key = (action, id, tip, extra = '') => `<button type="button" class="wa-key${extra}" data-wa="${action}" id="${winId}_${id}" title="${tip}" aria-label="${tip}">${icons[action]}</button>`;
    const miniKey = (action, tip) => `<button type="button" class="wa-key wa-key-mini" data-wa="${action}" title="${tip}" aria-label="${tip}">${icons[action]}</button>`;
    const toggle = (action, id, label, tip) => `<button type="button" class="wa-btn wa-toggle" data-wa="${action}" id="${winId}_${id}" title="${tip}">${label}</button>`;
    const band = (bandId, label) => `
      <div class="wa-eq-band">
        <input type="range" class="wa-range wa-eq-slider eq-slider" data-wa-range="eq" data-band="${bandId}" min="-12" max="12" step="1" value="0" aria-label="${label}">
        <span class="wa-eq-label">${label}</span>
      </div>`;

    return `
      <div class="wa-root" id="${winId}_root" tabindex="0">
        <div class="wa-main">
          <div class="wa-shade">
            <span class="wa-shade-state" id="${winId}_shade_state"></span>
            <span class="wa-shade-time" id="${winId}_shade_time">00:00</span>
            <span class="wa-shade-title" id="${winId}_shade_title"></span>
            <div class="wa-shade-keys">
              ${miniKey('prev', t('winamp.tipPrevBtn'))}
              ${miniKey('play', t('winamp.tipPlayBtn'))}
              ${miniKey('pause', t('winamp.tipPauseBtn'))}
              ${miniKey('stop', t('winamp.tipStopBtn'))}
              ${miniKey('next', t('winamp.tipNextBtn'))}
            </div>
          </div>
          <div class="wa-full">
            <div class="wa-lcd" id="${winId}_lcd">
              <div class="wa-clock">
                <span class="wa-state" id="${winId}_state"></span>
                <span class="wa-time" id="${winId}_timer" data-wa="time" title="${t('winamp.tipTimer')}">00:00</span>
              </div>
              <div class="wa-info">
                <span class="wa-info-value" id="${winId}_kbps">128</span><span class="wa-info-unit">kbps</span>
                <span class="wa-info-value" id="${winId}_khz">44</span><span class="wa-info-unit">kHz</span>
                <span class="wa-lamp" id="${winId}_mono">mono</span>
                <span class="wa-lamp" id="${winId}_stereo">stereo</span>
              </div>
              <div class="wa-viz" id="${winId}_viz_box" data-wa="viz" title="${t('winamp.tipViz')}">
                <canvas class="wa-viz-canvas" id="${winId}_viz" width="176" height="36"></canvas>
              </div>
              <div class="wa-ticker" id="${winId}_ticker_wrap"><span class="wa-ticker-text" id="${winId}_ticker"></span></div>
            </div>
            <input type="range" class="wa-range wa-seek" id="${winId}_seek" data-wa-range="seek" min="0" max="1000" value="0" title="${t('winamp.tipSeek')}" aria-label="${t('winamp.tipSeek')}">
            <div class="wa-deck">
              <div class="wa-transport">
                ${key('prev', 'btn_prev', t('winamp.tipPrevBtn'))}
                ${key('play', 'btn_play', t('winamp.tipPlayBtn'))}
                ${key('pause', 'btn_pause', t('winamp.tipPauseBtn'))}
                ${key('stop', 'btn_stop', t('winamp.tipStopBtn'))}
                ${key('next', 'btn_next', t('winamp.tipNextBtn'))}
                ${key('eject', 'btn_eject', t('winamp.tipEjectBtn'), ' wa-key-eject')}
              </div>
              <div class="wa-toggles">
                ${toggle('shuffle', 'btn_shuf', 'SHUF', t('winamp.tipShufBtn'))}
                ${toggle('repeat', 'btn_rep', 'REP', t('winamp.tipRepBtn'))}
                ${toggle('eq', 'btn_eq', 'EQ', t('winamp.tipEqBtn'))}
                ${toggle('pl', 'btn_pl', 'PL', t('winamp.tipPlBtn'))}
              </div>
            </div>
            <div class="wa-mixer">
              <label class="wa-label" for="${winId}_vol">VOL</label>
              <input type="range" class="wa-range wa-vol" id="${winId}_vol" data-wa-range="volume" min="0" max="100" value="80" title="${t('winamp.tipVol')}">
              <label class="wa-label" for="${winId}_bal">BAL</label>
              <input type="range" class="wa-range wa-bal" id="${winId}_bal" data-wa-range="balance" min="-100" max="100" value="0" title="${t('winamp.tipBal')}">
            </div>
          </div>
        </div>

        <section class="wa-panel wa-eq" id="${winId}_eq_panel">
          <div class="wa-panel-head">
            <span class="wa-panel-title">${t('winamp.eqTitle')}</span>
            <div class="wa-panel-tools">
              ${toggle('eq-on', 'eq_on', 'ON', t('winamp.tipEqOn'))}
              <button type="button" class="wa-btn" data-wa="eq-presets" id="${winId}_eq_presets">${t('winamp.eqPresets')} &#9662;</button>
              <button type="button" class="wa-btn" data-wa="eq-reset" id="${winId}_eq_reset">${t('winamp.eqReset')}</button>
            </div>
          </div>
          <div class="wa-eq-grid">
            <canvas class="wa-eq-curve" id="${winId}_eq_curve" width="260" height="20"></canvas>
            ${band('pre', 'PRE')}
            <div class="wa-eq-scale"><span>+12</span><span>0</span><span>-12</span></div>
            <div class="wa-eq-bands">${AppWinamp.EQ_LABELS.map((label, i) => band(i, label)).join('')}</div>
          </div>
        </section>

        <section class="wa-panel wa-pl" id="${winId}_pl_panel">
          <div class="wa-panel-head">
            <span class="wa-panel-title">${t('winamp.plTitle')}</span>
            <span class="wa-pl-summary" id="${winId}_pl_summary"></span>
          </div>
          <div class="wa-pl-list" id="${winId}_pl_list" tabindex="0" role="listbox" aria-label="${t('winamp.plTitle')}"></div>
          <div class="wa-pl-foot">
            <button type="button" class="wa-btn" data-wa="pl-add" id="${winId}_pl_add">+ ${t('winamp.plAddFile')}</button>
            <button type="button" class="wa-btn" data-wa="pl-url" id="${winId}_pl_add_url">+ URL</button>
            <button type="button" class="wa-btn" data-wa="pl-remove" id="${winId}_pl_del" title="${t('winamp.tipPlRemove')}">&minus; ${t('winamp.plRemove')}</button>
            <button type="button" class="wa-btn wa-pl-clear" data-wa="pl-clear" id="${winId}_pl_clear">${t('winamp.plClear')}</button>
          </div>
        </section>

        <input type="file" id="${winId}_file_in" accept="audio/*,.mid,.midi" multiple hidden>
      </div>
    `;
  }

  attachEvents(win, winId) {
    const el = win.element;
    const closest = (e, selector) => (e.target && e.target.closest ? e.target.closest(selector) : null);

    el.addEventListener('click', (e) => {
      const control = closest(e, '[data-wa]');
      if (control && el.contains(control)) this.runAction(control.dataset.wa, control);
      const row = closest(e, '.wa-pl-row');
      if (row) this.selectTrack(Number(row.dataset.index));
    });
    el.addEventListener('dblclick', (e) => {
      const row = closest(e, '.wa-pl-row');
      if (row) this.play(Number(row.dataset.index));
    });
    el.addEventListener('input', (e) => this.handleRange(e.target, false));
    el.addEventListener('change', (e) => {
      if (e.target && e.target.id === `${winId}_file_in`) this.addFiles(e.target);
      else this.handleRange(e.target, true);
    });
    el.addEventListener('keydown', (e) => this.handleKey(e));
    el.addEventListener('contextmenu', (e) => {
      if (closest(e, '.win-titlebar')) return;
      e.preventDefault();
      e.stopPropagation();
      this.showMainMenu(e.clientX, e.clientY);
    });

    this.renderPlaylist();
    this.updateUI();
    this.drawEqCurve();
    const root = this.query('root');
    if (root && root.focus) setTimeout(() => root.focus({ preventScroll: true }), 0);

    const tick = () => {
      if (this.win !== win) return;
      if (!win.isMinimized) {
        this.renderClock();
        this.renderTicker();
        this.renderViz();
      }
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  runAction(action, control) {
    const menuAt = (fn) => {
      const rect = control.getBoundingClientRect();
      setTimeout(() => fn(rect.left, rect.bottom + 2), 0);
    };
    const actions = {
      prev: () => this.prev(),
      play: () => this.pressPlay(),
      pause: () => this.togglePause(),
      stop: () => this.stop(),
      next: () => this.next(),
      eject: () => this.openFileDialog(),
      shuffle: () => this.toggleShuffle(),
      repeat: () => this.toggleRepeat(),
      eq: () => this.toggleEq(),
      pl: () => this.togglePl(),
      time: () => this.toggleTimeMode(),
      viz: () => this.setVizMode(AppWinamp.VIZ_MODES[(AppWinamp.VIZ_MODES.indexOf(this.vizMode) + 1) % AppWinamp.VIZ_MODES.length]),
      'eq-on': () => this.toggleEqEnabled(),
      'eq-presets': () => menuAt((x, y) => this.showPresetMenu(x, y)),
      'eq-reset': () => this.resetEq(),
      'pl-add': () => this.openFileDialog(),
      'pl-url': () => this.openUrlDialog(false),
      'pl-remove': () => this.removeSelected(),
      'pl-clear': () => this.clearPlaylist()
    };
    if (actions[action]) actions[action]();
  }

  handleRange(target, committed) {
    const kind = target && target.dataset ? target.dataset.waRange : null;
    if (!kind) return;
    const value = Number(target.value);
    if (kind === 'volume') {
      this.setVolume(value / 100);
    } else if (kind === 'balance') {
      this.setPan(value / 100);
    } else if (kind === 'seek') {
      const total = this.totalSeconds();
      if (!total) return;
      if (committed) {
        this.seekDragging = false;
        this.audio.currentTime = (value / 1000) * total;
      } else {
        this.seekDragging = true;
        this.setFill(target, value / 10);
        this.flash(t('winamp.flashSeek', this.formatClock((value / 1000) * total, true), this.formatClock(total, true)));
      }
    } else if (kind === 'eq') {
      const bandId = target.dataset.band;
      if (bandId === 'pre') this.preamp = value;
      else this.eqGains[Number(bandId)] = value;
      this.applyEq();
      this.drawEqCurve();
      this.flash(t('winamp.flashEq', bandId === 'pre' ? 'PRE' : AppWinamp.EQ_LABELS[Number(bandId)], (value > 0 ? '+' : '') + value));
      if (committed) this.saveState();
    }
  }

  handleKey(e) {
    const key = e.key || '';
    const lower = key.length === 1 ? key.toLowerCase() : key;
    const target = e.target || {};
    const inList = target.classList && target.classList.contains('wa-pl-list');
    let handled = true;

    if (e.ctrlKey && !e.altKey) {
      if (lower === 'o') this.openFileDialog();
      else if (lower === 'u') this.openUrlDialog(true);
      else handled = false;
    } else if (e.altKey && !e.ctrlKey) {
      if (lower === 'g') this.toggleEq();
      else if (lower === 'e') this.togglePl();
      else if (lower === 'w') this.toggleShade();
      else if (lower === 's') this.showSkinsMenuAtTitle();
      else handled = false;
    } else if (!e.ctrlKey && !e.altKey && !e.metaKey) {
      if (inList && (key === 'ArrowUp' || key === 'ArrowDown')) this.selectTrack(this.selectedTrackIndex + (key === 'ArrowUp' ? -1 : 1));
      else if (inList && key === 'Enter') this.play(this.selectedTrackIndex);
      else if (target.tagName === 'INPUT' && key.startsWith('Arrow')) handled = false;
      else if (target.tagName === 'BUTTON' && (key === ' ' || key === 'Enter')) handled = false;
      else if (lower === 'z') this.prev();
      else if (lower === 'x') this.pressPlay();
      else if (lower === 'c') this.togglePause();
      else if (lower === 'v') this.stop();
      else if (lower === 'b') this.next();
      else if (key === ' ') this.togglePlayback();
      else if (key === 'ArrowLeft') this.seekBy(-5);
      else if (key === 'ArrowRight') this.seekBy(5);
      else if (key === 'ArrowUp') this.setVolume(this.volume + 0.05);
      else if (key === 'ArrowDown') this.setVolume(this.volume - 0.05);
      else if (lower === 's') this.toggleShuffle();
      else if (lower === 'r') this.toggleRepeat();
      else if (key === 'Delete') this.removeSelected();
      else handled = false;
    } else {
      handled = false;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  showMainMenu(x, y) {
    if (!window.contextMenu) return;
    const viz = (mode, labelKey) => ({ label: t(labelKey), checked: this.vizMode === mode, action: () => this.setVizMode(mode) });
    window.contextMenu.show(x, y, [
      { label: t('winamp.menuOpen'), shortcut: 'Ctrl+O', action: () => this.openFileDialog() },
      { label: t('winamp.menuOpenUrl'), shortcut: 'Ctrl+U', action: () => this.openUrlDialog(true) },
      { separator: true },
      { label: t('winamp.menuEq'), checked: this.isEqOpen, shortcut: 'Alt+G', action: () => this.toggleEq() },
      { label: t('winamp.menuPl'), checked: this.isPlOpen, shortcut: 'Alt+E', action: () => this.togglePl() },
      { label: t('winamp.menuShade'), checked: this.isShaded, shortcut: 'Alt+W', action: () => this.toggleShade() },
      { separator: true },
      viz('bars', 'winamp.menuVizBars'),
      viz('scope', 'winamp.menuVizScope'),
      viz('off', 'winamp.menuVizOff'),
      { separator: true },
      { label: t('winamp.menuShuffle'), checked: this.isShuffle, shortcut: 'S', action: () => this.toggleShuffle() },
      { label: t('winamp.menuRepeat'), checked: this.isRepeat, shortcut: 'R', action: () => this.toggleRepeat() },
      { separator: true },
      { label: t('winamp.menuSkins'), shortcut: 'Alt+S', action: () => this.showSkinsMenu(x, y) },
      { label: t('winamp.menuKeys'), action: () => this.showKeys() },
      { label: t('winamp.menuAbout'), action: () => this.showAbout() },
      { separator: true },
      { label: t('winamp.menuExit'), shortcut: 'Alt+F4', action: () => window.winManager.closeWindow(AppWinamp.WIN_ID) }
    ]);
  }

  showSkinsMenu(x, y) {
    if (!window.contextMenu) return;
    const ids = new Set([...this.getInstalledSkinIds(), this.currentSkin]);
    const items = this.skins()
      .filter(skin => ids.has(skin.id))
      .map(skin => ({ label: skin.name, checked: skin.id === this.currentSkin, action: () => this.setSkin(skin.id) }));
    items.push({ separator: true }, { label: t('winamp.menuGetSkins'), action: () => this.openSkinSite() });
    window.contextMenu.show(x, y, items);
  }

  showSkinsMenuAtTitle() {
    const icon = this.win && this.win.element.querySelector('.win-titlebar-icon');
    const rect = icon ? icon.getBoundingClientRect() : { left: 0, bottom: 0 };
    this.showSkinsMenu(rect.left, rect.bottom + 2);
  }

  showPresetMenu(x, y) {
    if (!window.contextMenu) return;
    window.contextMenu.show(x, y, AppWinamp.EQ_PRESETS.map(preset => ({
      label: preset.name,
      checked: preset.gains.every((gain, i) => gain === this.eqGains[i]),
      action: () => this.applyPreset(preset)
    })));
  }

  openSkinSite() {
    if (window.appIE) window.appIE.open('http://skins.winamp.com');
  }

  showAbout() {
    window.winManager.openDialog({ title: t('winamp.aboutTitle'), icon: 'winamp', message: t('winamp.aboutMsg') });
  }

  showKeys() {
    window.winManager.openDialog({ title: t('winamp.keysTitle'), icon: 'winamp', message: t('winamp.keysMsg') });
  }

  openFileDialog() {
    const input = this.query('file_in');
    if (input) input.click();
  }

  addFiles(input) {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    const first = this.playlist.length;
    files.forEach(file => this.addTrack({ title: file.name.replace(/\.[^/.]+$/, ''), src: URL.createObjectURL(file) }));
    input.value = '';
    this.play(first);
  }

  openUrlDialog(playNow) {
    const add = (value) => {
      const url = String(value || '').trim();
      if (!url || url === 'http://') return;
      let name = url.split('/').pop() || '';
      try { name = decodeURIComponent(name); } catch (e) {}
      const index = this.addTrack({
        title: name || t('winamp.webStream'),
        artist: 'Web Radio',
        src: url,
        live: !/\.(mp3|wav|ogg|mid|midi)$/i.test(url)
      });
      if (playNow) this.play(index);
    };
    window.winManager.openPromptDialog({
      title: t('winamp.urlTitle'),
      icon: 'winamp',
      message: t('winamp.urlPrompt'),
      value: 'http://',
      onOk: add
    });
  }

  selectTrack(index) {
    if (!this.playlist.length || isNaN(index)) return;
    this.selectedTrackIndex = Math.min(this.playlist.length - 1, Math.max(0, index));
    this.renderPlaylistMarks(true);
  }

  removeSelected() {
    const index = this.selectedTrackIndex;
    if (!this.playlist[index]) return;
    if (index === this.currentTrackIndex) this.stop();
    this.playlist.splice(index, 1);
    if (index < this.currentTrackIndex) this.currentTrackIndex -= 1;
    const last = Math.max(0, this.playlist.length - 1);
    this.currentTrackIndex = Math.min(this.currentTrackIndex, last);
    this.selectedTrackIndex = Math.min(index, last);
    this.renderPlaylist();
    this.updateUI();
  }

  clearPlaylist() {
    this.stop();
    this.playlist = [];
    this.currentTrackIndex = 0;
    this.selectedTrackIndex = 0;
    this.renderPlaylist();
    this.updateUI();
  }

  play(index = this.currentTrackIndex) {
    if (index >= 0 && index < this.playlist.length) this.currentTrackIndex = index;
    const track = this.currentTrack();
    if (!track) return;
    this.selectedTrackIndex = this.currentTrackIndex;

    this.initAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
    this.stopMidi();
    this.isPaused = false;

    if (this.trackKind(track) === 'midi' && window.soundSys) {
      this.audio.pause();
      const name = `${track.title} ${track.src}`.toLowerCase();
      if (name.includes('passport') && window.soundSys.playPassportMidi) window.soundSys.playPassportMidi();
      else if (window.soundSys.playCanyonMidi) window.soundSys.playCanyonMidi();
      this.midiStartedAt = performance.now();
      this.isPlaying = true;
      this.updateUI();
      this.renderPlaylistMarks(true);
      return;
    }

    this.audio.src = track.src;
    this.applyVolume();
    this.isPlaying = true;
    const promise = this.audio.play();
    if (promise && promise.then) {
      promise
        .then(() => {
          if (!this.isPlaying && !this.isPaused) {
            this.audio.pause();
            this.audio.currentTime = 0;
          }
        })
        .catch(err => console.warn('Audio auto-play prevented or loading:', err));
    }
    this.updateUI();
    this.renderPlaylistMarks(true);
  }

  pressPlay() {
    if (this.isPaused) this.resume();
    else this.play(this.currentTrackIndex);
  }

  togglePause() {
    if (this.isPlaying) this.pause();
    else if (this.isPaused) this.resume();
  }

  togglePlayback() {
    if (this.isPlaying) this.pause();
    else this.pressPlay();
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.isPlaying = true;
    const promise = this.audio.play();
    if (promise && promise.catch) promise.catch(err => console.warn('Audio resume prevented:', err));
    this.updateUI();
  }

  pause() {
    if (!this.isPlaying) return;
    const track = this.currentTrack();
    if (track && this.trackKind(track) === 'midi') {
      this.stop();
      return;
    }
    this.audio.pause();
    this.isPlaying = false;
    this.isPaused = true;
    this.updateUI();
  }

  stop() {
    this.audio.pause();
    try {
      this.audio.currentTime = 0;
    } catch (e) {}
    this.stopMidi();
    this.isPlaying = false;
    this.isPaused = false;
    this.updateUI();
  }

  stopMidi() {
    if (window.soundSys && window.soundSys.stopMidiPlayback) window.soundSys.stopMidiPlayback();
  }

  prev() {
    const track = this.currentTrack();
    if (track && this.trackKind(track) === 'file' && this.isPlaying && this.currentSeconds() > 3) {
      this.audio.currentTime = 0;
      return;
    }
    if (!this.playlist.length) return;
    this.play(this.currentTrackIndex > 0 ? this.currentTrackIndex - 1 : this.playlist.length - 1);
  }

  next() {
    if (!this.playlist.length) return;
    let index = this.currentTrackIndex + 1;
    if (this.isShuffle && this.playlist.length > 1) {
      do {
        index = Math.floor(Math.random() * this.playlist.length);
      } while (index === this.currentTrackIndex);
    } else if (index >= this.playlist.length) {
      if (!this.isRepeat) {
        this.stop();
        return;
      }
      index = 0;
    }
    this.play(index);
  }

  currentSeconds() {
    const track = this.currentTrack();
    if (!track) return 0;
    if (this.trackKind(track) === 'midi') return this.isPlaying ? (performance.now() - this.midiStartedAt) / 1000 : 0;
    return this.audio.currentTime || 0;
  }

  totalSeconds() {
    const track = this.currentTrack();
    if (!track || this.trackKind(track) !== 'file') return 0;
    if (isFinite(this.audio.duration) && this.audio.duration > 0) return this.audio.duration;
    return track.seconds || 0;
  }

  seekBy(delta) {
    const total = this.totalSeconds();
    if (!total || (!this.isPlaying && !this.isPaused)) return;
    const target = Math.min(total, Math.max(0, this.currentSeconds() + delta));
    this.audio.currentTime = target;
    this.flash(t('winamp.flashSeek', this.formatClock(target, true), this.formatClock(total, true)));
  }

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, Math.round(value * 100) / 100));
    this.applyVolume();
    this.syncControls();
    this.saveState();
    this.flash(t('winamp.flashVolume', Math.round(this.volume * 100)));
  }

  setPan(value) {
    this.pan = Math.min(1, Math.max(-1, value));
    this.applyPan();
    this.syncControls();
    this.saveState();
    const percent = Math.round(Math.abs(this.pan) * 100);
    const side = percent === 0 ? t('winamp.balCenter') : t(this.pan < 0 ? 'winamp.balLeft' : 'winamp.balRight', percent);
    this.flash(t('winamp.flashBalance', side));
  }

  toggleEq() {
    this.isEqOpen = !this.isEqOpen;
    this.saveState();
    this.updateUI();
    this.drawEqCurve();
  }

  togglePl() {
    this.isPlOpen = !this.isPlOpen;
    this.saveState();
    this.updateUI();
  }

  toggleShade() {
    this.isShaded = !this.isShaded;
    this.saveState();
    this.updateUI();
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.saveState();
    this.updateUI();
    this.flash(t('winamp.flashShuffle', t(this.isShuffle ? 'winamp.on' : 'winamp.off')));
  }

  toggleRepeat() {
    this.isRepeat = !this.isRepeat;
    this.saveState();
    this.updateUI();
    this.flash(t('winamp.flashRepeat', t(this.isRepeat ? 'winamp.on' : 'winamp.off')));
  }

  toggleTimeMode() {
    this.showRemaining = !this.showRemaining;
    this.saveState();
  }

  setVizMode(mode) {
    this.vizMode = mode;
    this.saveState();
    const labels = { bars: 'winamp.menuVizBars', scope: 'winamp.menuVizScope', off: 'winamp.menuVizOff' };
    this.flash(t(labels[mode]));
  }

  toggleEqEnabled() {
    this.eqEnabled = !this.eqEnabled;
    this.applyEq();
    this.saveState();
    this.updateUI();
    this.drawEqCurve();
    this.flash(t('winamp.flashEqState', t(this.eqEnabled ? 'winamp.on' : 'winamp.off')));
  }

  applyPreset(preset) {
    this.eqGains = preset.gains.slice();
    this.eqEnabled = true;
    this.applyEq();
    this.saveState();
    this.updateUI();
    this.drawEqCurve();
    this.flash(t('winamp.flashPreset', preset.name));
  }

  resetEq() {
    this.preamp = 0;
    this.applyPreset(AppWinamp.EQ_PRESETS[0]);
  }

  flash(text) {
    this.flashText = text;
    this.flashUntil = performance.now() + 1400;
  }

  setFill(input, percent) {
    if (input && input.style && input.style.setProperty) input.style.setProperty('--fill', `${percent}%`);
  }

  syncControls() {
    const vol = this.query('vol');
    if (vol) {
      vol.value = Math.round(this.volume * 100);
      this.setFill(vol, this.volume * 100);
    }
    const bal = this.query('bal');
    if (bal) bal.value = Math.round(this.pan * 100);
    if (!this.win) return;
    this.win.element.querySelectorAll('.eq-slider').forEach(slider => {
      const bandId = slider.dataset.band;
      slider.value = bandId === 'pre' ? this.preamp : this.eqGains[Number(bandId)];
    });
  }

  updateUI() {
    if (!this.win) return;
    const root = this.query('root');
    if (root) {
      root.classList.toggle('is-eq-open', this.isEqOpen);
      root.classList.toggle('is-pl-open', this.isPlOpen);
      root.classList.toggle('is-shaded', this.isShaded);
    }

    const state = this.isPlaying ? 'playing' : this.isPaused ? 'paused' : 'stopped';
    const lcd = this.query('lcd');
    if (lcd) {
      ['playing', 'paused', 'stopped'].forEach(name => lcd.classList.toggle('is-' + name, name === state));
    }
    const stateIcon = AppWinamp.ICONS[state === 'playing' ? 'play' : state === 'paused' ? 'pause' : 'stop'];
    ['state', 'shade_state'].forEach(id => {
      const node = this.query(id);
      if (node) node.innerHTML = stateIcon;
    });

    const lit = [
      ['btn_play', this.isPlaying],
      ['btn_pause', this.isPaused],
      ['btn_shuf', this.isShuffle],
      ['btn_rep', this.isRepeat],
      ['btn_eq', this.isEqOpen],
      ['btn_pl', this.isPlOpen],
      ['eq_on', this.eqEnabled]
    ];
    lit.forEach(([id, on]) => {
      const node = this.query(id);
      if (!node) return;
      node.classList.toggle('is-on', on);
      if (node.setAttribute) node.setAttribute('aria-pressed', String(on));
    });

    this.renderTrackInfo(state);
    this.syncControls();
    this.renderPlaylistMarks(false);
    this.fitCanvases();

    const shadeButton = this.win.element.querySelector('.wa-shade-button');
    if (shadeButton) shadeButton.textContent = this.isShaded ? '▾' : '▴';
  }

  renderTrackInfo(state) {
    const track = this.currentTrack();
    const kind = track ? this.trackKind(track) : 'none';
    const active = state !== 'stopped';
    let kbps = '---';
    let khz = '--';
    if (kind === 'midi') {
      kbps = 'MIDI';
      khz = '22';
    } else if (kind === 'stream') {
      kbps = 'LIVE';
      khz = '44';
    } else if (kind === 'file') {
      kbps = /\.wav$/i.test(track.src) ? '1411' : '128';
      khz = '44';
    }
    const setText = (id, text) => {
      const node = this.query(id);
      if (node && node.textContent !== text) node.textContent = text;
    };
    setText('kbps', kbps);
    setText('khz', khz);
    const mono = this.query('mono');
    const stereo = this.query('stereo');
    if (mono) mono.classList.toggle('is-lit', active && kind === 'midi');
    if (stereo) stereo.classList.toggle('is-lit', active && (kind === 'file' || kind === 'stream'));
  }

  fitCanvases() {
    ['viz', 'eq_curve'].forEach(id => {
      const canvas = this.query(id);
      if (!canvas || !canvas.clientWidth) return;
      if (canvas.width !== canvas.clientWidth) canvas.width = canvas.clientWidth;
      if (canvas.height !== canvas.clientHeight) canvas.height = canvas.clientHeight;
    });
  }

  renderPlaylist() {
    const list = this.query('pl_list');
    if (!list) return;
    if (!this.playlist.length) {
      list.innerHTML = `<div class="wa-pl-empty">${t('winamp.plEmpty')}</div>`;
    } else {
      list.innerHTML = this.playlist.map((track, i) => `
        <div class="wa-pl-row" role="option" data-index="${i}">
          <span class="wa-pl-num">${i + 1}.</span>
          <span class="wa-pl-title">${this.escapeHtml(this.trackLabel(track))}</span>
          <span class="wa-pl-time">${this.escapeHtml(track.duration || '')}</span>
        </div>`).join('');
    }
    const total = this.playlist.reduce((sum, track) => sum + (track.seconds || 0), 0);
    const summary = this.query('pl_summary');
    if (summary) summary.textContent = t('winamp.plSummary', this.playlist.length, this.formatClock(total));
    this.renderPlaylistMarks(false);
  }

  renderPlaylistMarks(reveal) {
    const list = this.query('pl_list');
    if (!list || !list.children) return;
    Array.from(list.children).forEach(row => {
      const index = Number(row.dataset && row.dataset.index);
      const selected = index === this.selectedTrackIndex;
      row.classList.toggle('is-current', index === this.currentTrackIndex);
      row.classList.toggle('is-selected', selected);
      if (row.setAttribute) row.setAttribute('aria-selected', String(selected));
      if (reveal && selected) this.revealRow(list, row);
    });
  }

  revealRow(list, row) {
    if (!row.offsetHeight) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
  }

  renderClock() {
    const current = this.currentSeconds();
    const total = this.totalSeconds();
    let text = '00:00';
    if (this.isPlaying || this.isPaused) {
      text = this.showRemaining && total ? `-${this.formatClock(total - current, true)}` : this.formatClock(current, true);
    }
    ['timer', 'shade_time'].forEach(id => {
      const node = this.query(id);
      if (node && node.textContent !== text) node.textContent = text;
    });

    const seek = this.query('seek');
    if (seek && !this.seekDragging) {
      const value = total ? Math.round((current / total) * 1000) : 0;
      if (Number(seek.value) !== value) {
        seek.value = value;
        this.setFill(seek, value / 10);
      }
      seek.disabled = !total;
    }
  }

  renderTicker() {
    const wrap = this.query('ticker_wrap');
    const text = this.query('ticker');
    if (!wrap || !text) return;
    const flashing = performance.now() < this.flashUntil;
    const track = this.currentTrack();
    const base = track
      ? `${this.currentTrackIndex + 1}. ${this.trackLabel(track)}${track.duration ? ` (${track.duration})` : ''}`
      : t('winamp.tickerEmpty');
    const message = flashing ? this.flashText : base;

    if (message !== this.tickerText) {
      this.tickerText = message;
      this.tickerOffset = 0;
      this.tickerLoop = 0;
      text.textContent = message;
      if (!flashing && text.offsetWidth > wrap.clientWidth) {
        text.textContent = `${message}   ***   ${message}   ***   `;
        this.tickerLoop = text.offsetWidth / 2;
      }
      text.style.transform = 'translateX(0px)';
      const shadeTitle = this.query('shade_title');
      if (shadeTitle) shadeTitle.textContent = message;
    }

    if (this.tickerLoop) {
      this.tickerOffset -= 0.5;
      if (-this.tickerOffset >= this.tickerLoop) this.tickerOffset += this.tickerLoop;
      text.style.transform = `translateX(${Math.round(this.tickerOffset)}px)`;
    }
  }

  renderViz() {
    const canvas = this.query('viz');
    if (!canvas || !canvas.getContext) return;
    if (!this.vizCtx || this.vizCanvas !== canvas) {
      this.vizCanvas = canvas;
      this.vizCtx = canvas.getContext('2d');
    }
    const ctx = this.vizCtx;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (this.vizMode === 'bars') this.drawBars(ctx, w, h);
    else if (this.vizMode === 'scope') this.drawScope(ctx, w, h);
  }

  liveAnalyser() {
    const track = this.currentTrack();
    return this.isPlaying && this.analyser && track && this.trackKind(track) !== 'midi' ? this.analyser : null;
  }

  sampleSpectrum(count) {
    const out = new Array(count).fill(0);
    if (!this.isPlaying) return out;
    const analyser = this.liveAnalyser();
    if (analyser) {
      if (!this.freqBuffer || this.freqBuffer.length !== analyser.frequencyBinCount) this.freqBuffer = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(this.freqBuffer);
      const usable = Math.floor(this.freqBuffer.length * 0.8);
      for (let i = 0; i < count; i++) {
        const from = Math.floor(Math.pow(i / count, 1.7) * usable);
        const to = Math.max(from + 1, Math.floor(Math.pow((i + 1) / count, 1.7) * usable));
        let peak = 0;
        for (let j = from; j < to; j++) peak = Math.max(peak, this.freqBuffer[j] || 0);
        out[i] = peak / 255;
      }
      return out;
    }
    this.synthT += 0.12;
    for (let i = 0; i < count; i++) {
      const wave = Math.sin(this.synthT * 1.5 + i * 0.4) * 0.5 + 0.5;
      const wobble = Math.cos(this.synthT * 2.8 + i * 0.7) * 0.3 + 0.3;
      out[i] = Math.min(1, (wave * 0.7 + wobble * 0.3) * (1 - i / (count * 1.6)));
    }
    return out;
  }

  drawBars(ctx, w, h) {
    const colors = this.colors();
    const count = Math.floor((w + 1) / 4);
    const data = this.sampleSpectrum(count);
    for (let i = 0; i < count; i++) {
      const level = Math.max(data[i] * h, (this.levels[i] || 0) - h * 0.05);
      this.levels[i] = level;
      if (level >= (this.peaks[i] || 0)) {
        this.peaks[i] = level;
        this.peakFall[i] = 0;
      } else {
        this.peakFall[i] = (this.peakFall[i] || 0) + 0.025;
        this.peaks[i] = Math.max(0, this.peaks[i] - this.peakFall[i]);
      }
      const x = i * 4;
      for (let y = 0; y < Math.floor(level); y += 3) {
        const ratio = y / h;
        ctx.fillStyle = ratio > 0.7 ? colors.high : ratio > 0.4 ? colors.mid : colors.low;
        ctx.fillRect(x, h - y - 2, 3, 2);
      }
      if (this.peaks[i] >= 2) {
        ctx.fillStyle = colors.peak;
        ctx.fillRect(x, h - Math.round(this.peaks[i]) - 1, 3, 1);
      }
    }
  }

  drawScope(ctx, w, h) {
    const colors = this.colors();
    const mid = Math.floor(h / 2);
    const analyser = this.liveAnalyser();
    let sample = () => 0;
    if (analyser) {
      if (!this.waveBuffer || this.waveBuffer.length !== analyser.fftSize) this.waveBuffer = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(this.waveBuffer);
      sample = (x) => (this.waveBuffer[Math.floor((x / w) * this.waveBuffer.length)] - 128) / 128;
    } else if (this.isPlaying) {
      this.synthT += 0.12;
      sample = (x) => Math.sin(this.synthT * 3 + x * 0.12) * 0.7 * Math.sin(this.synthT * 0.7 + x * 0.02);
    }
    ctx.fillStyle = colors.line;
    let prevY = mid;
    for (let x = 0; x < w; x++) {
      const y = Math.round(mid + sample(x) * (mid - 1));
      ctx.fillRect(x, Math.min(prevY, y), 1, Math.abs(y - prevY) + 1);
      prevY = y;
    }
  }

  drawEqCurve() {
    const canvas = this.query('eq_curve');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const colors = this.colors();
    const w = canvas.width;
    const h = canvas.height;
    const mid = Math.floor(h / 2);
    const toY = (gain) => Math.round(mid - (gain / 12) * (mid - 2));
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = colors.dim;
    ctx.fillRect(0, mid, w, 1);
    const preY = toY(this.preamp);
    for (let x = 0; x < w; x += 3) ctx.fillRect(x, preY, 1, 1);

    const gains = this.eqGains;
    const column = w / gains.length;
    ctx.fillStyle = this.eqEnabled ? colors.line : colors.dim;
    let prevY = toY(gains[0]);
    for (let x = 0; x < w; x++) {
      const pos = Math.min(gains.length - 1, Math.max(0, x / column - 0.5));
      const i = Math.min(gains.length - 2, Math.floor(pos));
      const f = (1 - Math.cos((pos - i) * Math.PI)) / 2;
      const y = toY(gains[i] * (1 - f) + gains[i + 1] * f);
      ctx.fillRect(x, Math.min(prevY, y), 1, Math.abs(y - prevY) + 1);
      prevY = y;
    }
  }
}

window.appWinamp = new AppWinamp();
