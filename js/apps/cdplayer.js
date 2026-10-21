class AppCDPlayer {
  constructor() {
    this.winId = 'win-cdplayer';
    this.storageKey = 'win98_cdplayer_db_v1';
    this.state = 'stopped';
    this.timeMode = 'elapsed';
    this.continuous = true;
    this.randomOrder = false;
    this.introPlay = false;
    this.showToolbar = true;
    this.showDiscInfo = true;
    this.showStatusBar = true;

    this.currentQueuePos = 0;
    this.elapsedSec = 0;
    this.tickTimer = null;
    this.audioEl = null;

    this.editorSelectedPlayIdx = 0;
    this.editorSelectedAvailIdx = 0;
    this.editorEditingTrackNum = 2;

    this.defaultCatalog = {
      igromania_09_1998: {
        artist: 'Игромания CD #9 (Сентябрь 1998)',
        title: 'Igromania RedBook Bonus Audio [D:]',
        playlist: [2, 3, 4, 5],
        tracks: [
          {
            num: 1,
            isData: true,
            title: '[DATA] Архив журнала Игромания №9 (ISO9660)',
            durationSec: 2538,
            notes: []
          },
          {
            num: 2,
            isData: false,
            title: 'Sonic Mayhem - Quake II Stroggos Industrial',
            durationSec: 204,
            notes: [110, 110, 146.83, 110, 164.81, 155.56, 146.83, 130.81, 110, 110, 196.0, 164.81]
          },
          {
            num: 3,
            isData: false,
            title: 'Alexander Brandon - Unreal Na Pali Flyby',
            durationSec: 252,
            notes: [220, 261.63, 329.63, 440, 392.0, 329.63, 293.66, 261.63, 246.94, 293.66, 392.0, 329.63]
          },
          {
            num: 4,
            isData: false,
            title: 'Mark Morgan - Fallout 2 Highwayman Ambient',
            durationSec: 178,
            notes: [130.81, 196.0, 155.56, 130.81, 116.54, 174.61, 146.83, 130.81, 98.0, 130.81, 155.56, 196.0]
          },
          {
            num: 5,
            isData: false,
            title: 'Future Crew - Igromania #9 Demoscene Chiptune',
            durationSec: 185,
            notes: [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23, 440.0, 587.33, 440.0, 392.0]
          }
        ]
      },
      office_games_98: {
        artist: 'Сборник «200 Лучших Игр в Офис»',
        title: 'Office Arcade 98 Audio Tracks [D:]',
        playlist: [2, 3, 4],
        tracks: [
          {
            num: 1,
            isData: true,
            title: '[DATA] Оболочка 200 Лучших Игр в Офис (ISO9660)',
            durationSec: 1690,
            notes: []
          },
          {
            num: 2,
            isData: false,
            title: 'Arkanoid 98 - Doh Stage AdLib Synth',
            durationSec: 160,
            notes: [329.63, 392.0, 493.88, 659.25, 587.33, 493.88, 392.0, 329.63, 261.63, 329.63, 392.0, 493.88]
          },
          {
            num: 3,
            isData: false,
            title: 'Tetris 98 - Kalinka & Korobeiniki 8-Bit Mix',
            durationSec: 195,
            notes: [329.63, 246.94, 261.63, 293.66, 261.63, 246.94, 220.0, 220.0, 261.63, 329.63, 293.66, 261.63]
          },
          {
            num: 4,
            isData: false,
            title: 'Color Lines 98 - King Lounge FM Theme',
            durationSec: 170,
            notes: [196.0, 246.94, 293.66, 392.0, 349.23, 293.66, 246.94, 220.0, 261.63, 329.63, 293.66, 196.0]
          }
        ]
      }
    };

    this.catalog = this.loadCatalog();
  }

  loadCatalog() {
    const clone = JSON.parse(JSON.stringify(this.defaultCatalog));
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return clone;
      const saved = JSON.parse(raw);
      for (const id of Object.keys(clone)) {
        if (saved && saved[id]) {
          if (saved[id].artist) clone[id].artist = String(saved[id].artist);
          if (saved[id].title) clone[id].title = String(saved[id].title);
          if (Array.isArray(saved[id].playlist) && saved[id].playlist.length) {
            clone[id].playlist = saved[id].playlist.map(Number).filter(Boolean);
          }
          if (saved[id].trackNames && typeof saved[id].trackNames === 'object') {
            clone[id].tracks.forEach((tr) => {
              if (saved[id].trackNames[tr.num]) {
                tr.title = String(saved[id].trackNames[tr.num]);
              }
            });
          }
        }
      }
    } catch (e) {}
    return clone;
  }

  saveCatalog() {
    try {
      const payload = {};
      for (const [id, disc] of Object.entries(this.catalog)) {
        const trackNames = {};
        disc.tracks.forEach((tr) => {
          trackNames[tr.num] = tr.title;
        });
        payload[id] = {
          artist: disc.artist,
          title: disc.title,
          playlist: [...disc.playlist],
          trackNames
        };
      }
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (e) {}
  }

  getActiveDisc() {
    if (!window.vfs || typeof window.vfs.isCdRomInserted !== 'function' || !window.vfs.isCdRomInserted()) {
      return null;
    }
    const discId = (window.vfs.cdRomState && window.vfs.cdRomState.discId) || 'igromania_09_1998';
    const data = this.catalog[discId] || this.catalog.igromania_09_1998;
    return { id: discId, data };
  }

  getActivePlaylistTracks(active) {
    if (!active) return [];
    const list = [];
    for (const num of active.data.playlist) {
      const tr = active.data.tracks.find((t) => t.num === num && !t.isData);
      if (tr) list.push(tr);
    }
    if (!list.length) {
      active.data.tracks.forEach((tr) => {
        if (!tr.isData) list.push(tr);
      });
    }
    return list;
  }

  getCurrentTrack() {
    const active = this.getActiveDisc();
    if (!active) return null;
    const queue = this.getActivePlaylistTracks(active);
    if (!queue.length) return null;
    if (this.currentQueuePos >= queue.length) this.currentQueuePos = 0;
    if (this.currentQueuePos < 0) this.currentQueuePos = 0;
    return queue[this.currentQueuePos] || queue[0];
  }

  formatTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  synthesizeTrackWav(track) {
    if (track.cachedWavUri) return track.cachedWavUri;
    if (window.appCDex && typeof window.appCDex.synthesizeTrackWav === 'function') {
      track.cachedWavUri = window.appCDex.synthesizeTrackWav(track);
      return track.cachedWavUri;
    }

    const sampleRate = 8000;
    const durationSec = 6;
    const numSamples = sampleRate * durationSec;
    const headerSize = 44;
    const buffer = new ArrayBuffer(headerSize + numSamples);
    const view = new DataView(buffer);

    const writeAscii = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeAscii(0, 'RIFF');
    view.setUint32(4, 36 + numSamples, true);
    writeAscii(8, 'WAVE');
    writeAscii(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    writeAscii(36, 'data');
    view.setUint32(40, numSamples, true);

    const notes = (track.notes && track.notes.length) ? track.notes : [220, 277.18, 329.63, 440];
    const stepSamples = Math.floor(sampleRate * 0.25);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const stepIdx = Math.floor(i / stepSamples);
      const freq = notes[stepIdx % notes.length];
      const localPos = (i % stepSamples) / stepSamples;
      const env = Math.max(0.12, 1 - localPos * 0.72);
      const lead = (Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.55 : -0.55);
      const sub = 0.35 * Math.sin(2 * Math.PI * (freq * 0.5) * t);
      const val = Math.max(8, Math.min(247, Math.round(128 + (lead + sub) * env * 85)));
      view.setUint8(headerSize + i, val);
    }

    const bytes = new Uint8Array(buffer);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 4096) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 4096));
    }
    track.cachedWavUri = 'data:audio/wav;base64,' + btoa(bin);
    return track.cachedWavUri;
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      const existing = window.winManager.windows.get(this.winId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.winId);
      else window.winManager.bringToTop(this.winId);
      this.refreshUI();
      return existing;
    }

    const content = `
      <div class="cdp-shell" id="${this.winId}-shell">
        <div class="cdp-menubar" id="${this.winId}-menubar">
          <div class="cdp-menu-item" data-menu="disc">
            <span><u>Д</u>иск</span>
            <div class="cdp-dropdown">
              <div class="cdp-menu-opt" data-cmd="edit-playlist"><span>Изменить список воспроизведения...</span></div>
              <div class="cdp-menu-sep"></div>
              <div class="cdp-menu-opt" data-cmd="eject"><span>Извлечь / Сменить компакт-диск</span></div>
              <div class="cdp-menu-sep"></div>
              <div class="cdp-menu-opt" data-cmd="exit"><span>Выход</span></div>
            </div>
          </div>
          <div class="cdp-menu-item" data-menu="view">
            <span><u>В</u>ид</span>
            <div class="cdp-dropdown">
              <div class="cdp-menu-opt checked" data-cmd="toggle-toolbar" id="${this.winId}-m-toolbar"><span>Панель инструментов</span></div>
              <div class="cdp-menu-opt checked" data-cmd="toggle-discinfo" id="${this.winId}-m-discinfo"><span>Сведения о диске и дорожке</span></div>
              <div class="cdp-menu-opt checked" data-cmd="toggle-statusbar" id="${this.winId}-m-statusbar"><span>Строка состояния</span></div>
              <div class="cdp-menu-sep"></div>
              <div class="cdp-menu-opt checked" data-cmd="mode-elapsed" id="${this.winId}-m-elapsed"><span>Время с начала дорожки</span></div>
              <div class="cdp-menu-opt" data-cmd="mode-track-rem" id="${this.winId}-m-trackrem"><span>Время до конца дорожки</span></div>
              <div class="cdp-menu-opt" data-cmd="mode-disc-rem" id="${this.winId}-m-discrem"><span>Время до конца диска</span></div>
              <div class="cdp-menu-sep"></div>
              <div class="cdp-menu-opt" data-cmd="volume-control"><span>Регулятор громкости...</span></div>
            </div>
          </div>
          <div class="cdp-menu-item" data-menu="options">
            <span><u>П</u>араметры</span>
            <div class="cdp-dropdown">
              <div class="cdp-menu-opt" data-cmd="toggle-random" id="${this.winId}-m-random"><span>В случайном порядке</span></div>
              <div class="cdp-menu-opt checked" data-cmd="toggle-continuous" id="${this.winId}-m-cont"><span>Непрерывное воспроизведение</span></div>
              <div class="cdp-menu-opt" data-cmd="toggle-intro" id="${this.winId}-m-intro"><span>Ознакомительное воспроизведение (10 с)</span></div>
            </div>
          </div>
          <div class="cdp-menu-item" data-menu="help">
            <span><u>С</u>правка</span>
            <div class="cdp-dropdown">
              <div class="cdp-menu-opt" data-cmd="open-cdex"><span>Открыть CDex Audio Ripper...</span></div>
              <div class="cdp-menu-sep"></div>
              <div class="cdp-menu-opt" data-cmd="about"><span>О программе «Лазерный проигрыватель»</span></div>
            </div>
          </div>
        </div>

        <div class="cdp-toolbar" id="${this.winId}-toolbar">
          <button class="cdp-tb-btn" data-cmd="edit-playlist" title="Изменить список воспроизведения">&#128221;</button>
          <div class="cdp-tb-sep"></div>
          <button class="cdp-tb-btn active" id="${this.winId}-tb-elapsed" data-cmd="mode-elapsed" title="Время с начала дорожки">T+</button>
          <button class="cdp-tb-btn" id="${this.winId}-tb-trackrem" data-cmd="mode-track-rem" title="Время до конца дорожки">T-</button>
          <button class="cdp-tb-btn" id="${this.winId}-tb-discrem" data-cmd="mode-disc-rem" title="Время до конца диска">D-</button>
          <div class="cdp-tb-sep"></div>
          <button class="cdp-tb-btn" id="${this.winId}-tb-random" data-cmd="toggle-random" title="В случайном порядке">&#128256;</button>
          <button class="cdp-tb-btn active" id="${this.winId}-tb-cont" data-cmd="toggle-continuous" title="Непрерывное воспроизведение">&#128257;</button>
          <button class="cdp-tb-btn" id="${this.winId}-tb-intro" data-cmd="toggle-intro" title="Ознакомительное воспроизведение (10 сек)">10s</button>
          <div class="cdp-tb-sep"></div>
          <button class="cdp-tb-btn" data-cmd="volume-control" title="Регулятор громкости">&#128266;</button>
        </div>

        <div class="cdp-deck">
          <div class="cdp-lcd" id="${this.winId}-lcd" title="Щелкните для переключения режима отсчета времени">
            <div class="cdp-lcd-top">
              <span id="${this.winId}-lcd-mode">TRACK ELAPSED</span>
              <div class="cdp-lcd-flags">
                <span class="cdp-flag lit" id="${this.winId}-flg-cda">CD-DA</span>
                <span class="cdp-flag" id="${this.winId}-flg-rnd">RND</span>
                <span class="cdp-flag lit" id="${this.winId}-flg-cnt">CONT</span>
                <span class="cdp-flag" id="${this.winId}-flg-int">INTRO</span>
              </div>
            </div>
            <div class="cdp-lcd-digits" id="${this.winId}-lcd-digits">[02] 00:00</div>
          </div>

          <div class="cdp-transport">
            <div class="cdp-tr-row1">
              <button class="cdp-tr-btn" id="${this.winId}-btn-play" title="Воспроизведение">&#9654;</button>
              <button class="cdp-tr-btn" id="${this.winId}-btn-pause" title="Пауза">&#10074;&#10074;</button>
              <button class="cdp-tr-btn" id="${this.winId}-btn-stop" title="Стоп">&#9632;</button>
            </div>
            <div class="cdp-tr-row2">
              <button class="cdp-tr-btn" id="${this.winId}-btn-prev" title="Предыдущая дорожка">&#9198;</button>
              <button class="cdp-tr-btn" id="${this.winId}-btn-rew" title="Назад на 5 сек">&#9194;</button>
              <button class="cdp-tr-btn" id="${this.winId}-btn-ff" title="Вперед на 5 сек">&#9193;</button>
              <button class="cdp-tr-btn" id="${this.winId}-btn-next" title="Следующая дорожка">&#9197;</button>
              <button class="cdp-tr-btn" id="${this.winId}-btn-eject" title="Извлечь / Сменить диск">&#9167;</button>
            </div>
          </div>
        </div>

        <div class="cdp-info-panel" id="${this.winId}-info-panel">
          <div class="cdp-info-row">
            <span class="cdp-info-label">Диск (Исполн.):</span>
            <div class="cdp-sunken-field">
              <span id="${this.winId}-artist">Игромания CD #9</span>
              <strong style="color:#000080;">[D:]</strong>
            </div>
          </div>
          <div class="cdp-info-row">
            <span class="cdp-info-label">Название:</span>
            <div class="cdp-sunken-field" id="${this.winId}-album">Igromania RedBook Bonus Audio</div>
          </div>
          <div class="cdp-info-row">
            <span class="cdp-info-label">Дорожка:</span>
            <select class="cdp-track-select" id="${this.winId}-track-select"></select>
          </div>
        </div>

        <div class="cdp-statusbar" id="${this.winId}-statusbar">
          <div class="cdp-status-cell" id="${this.winId}-st-left">Всего времени: 00:00 м:с</div>
          <div class="cdp-status-cell" id="${this.winId}-st-right">Дорожка: 00:00 м:с</div>
        </div>

        <div class="cdp-modal-backdrop" id="${this.winId}-playlist-modal">
          <div class="cdp-modal">
            <div class="cdp-modal-titlebar">
              <span>Параметры диска и список воспроизведения (D:)</span>
              <button class="win-btn" id="${this.winId}-pl-close" style="min-width:16px;height:14px;padding:0;line-height:10px;">×</button>
            </div>
            <div class="cdp-modal-body">
              <div class="cdp-info-row">
                <span>Исполнитель:</span>
                <input type="text" class="cdp-modal-input" id="${this.winId}-pl-artist">
              </div>
              <div class="cdp-info-row">
                <span>Название:</span>
                <input type="text" class="cdp-modal-input" id="${this.winId}-pl-title">
              </div>
              <div class="cdp-playlist-cols">
                <div>
                  <div style="margin-bottom:2px;">Список воспроизведения:</div>
                  <div class="cdp-track-box" id="${this.winId}-pl-current"></div>
                </div>
                <div class="cdp-mid-btns">
                  <button class="win-btn" id="${this.winId}-pl-add">&lt;- Добавить</button>
                  <button class="win-btn" id="${this.winId}-pl-remove">Удалить -&gt;</button>
                  <button class="win-btn" id="${this.winId}-pl-clear">Очистить</button>
                  <button class="win-btn" id="${this.winId}-pl-reset">Сброс</button>
                </div>
                <div>
                  <div style="margin-bottom:2px;">Доступные дорожки:</div>
                  <div class="cdp-track-box" id="${this.winId}-pl-avail"></div>
                </div>
              </div>
              <div class="cdp-info-row">
                <span id="${this.winId}-pl-trlabel">Дорожка 02:</span>
                <div style="display:flex;gap:4px;">
                  <input type="text" class="cdp-modal-input" id="${this.winId}-pl-trname">
                  <button class="win-btn" id="${this.winId}-pl-setname" style="white-space:nowrap;">Задать имя</button>
                </div>
              </div>
              <div class="cdp-modal-footer">
                <button class="win-btn default" id="${this.winId}-pl-ok">ОК</button>
                <button class="win-btn" id="${this.winId}-pl-cancel">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.winId,
      title: 'Лазерный проигрыватель',
      icon: 'cdplayer',
      width: 410,
      height: 248,
      minWidth: 380,
      minHeight: 220,
      resizable: false,
      maximizable: false,
      minimizable: true,
      content,
      onClose: () => this.cleanup()
    });

    this.bindEvents();
    this.refreshUI();
    return win;
  }

  bindEvents() {
    const shell = document.getElementById(`${this.winId}-shell`);
    if (!shell) return;

    const menuItems = shell.querySelectorAll('.cdp-menu-item');
    menuItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.cdp-menu-opt')) return;
        const wasOpen = item.classList.contains('open');
        menuItems.forEach((m) => m.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });

    shell.addEventListener('click', (e) => {
      if (!e.target.closest('.cdp-menu-item')) {
        menuItems.forEach((m) => m.classList.remove('open'));
      }
      const cmdNode = e.target.closest('[data-cmd]');
      if (cmdNode) {
        menuItems.forEach((m) => m.classList.remove('open'));
        this.handleCommand(cmdNode.dataset.cmd);
      }
    });

    const lcd = document.getElementById(`${this.winId}-lcd`);
    if (lcd) {
      lcd.addEventListener('click', () => {
        const order = ['elapsed', 'track_rem', 'disc_rem'];
        const next = order[(order.indexOf(this.timeMode) + 1) % order.length];
        this.setTimeMode(next);
      });
    }

    const onClick = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    onClick(`${this.winId}-btn-play`, () => this.play());
    onClick(`${this.winId}-btn-pause`, () => this.pause());
    onClick(`${this.winId}-btn-stop`, () => this.stop());
    onClick(`${this.winId}-btn-prev`, () => this.prevTrack());
    onClick(`${this.winId}-btn-next`, () => this.nextTrack());
    onClick(`${this.winId}-btn-rew`, () => this.seekRelative(-5));
    onClick(`${this.winId}-btn-ff`, () => this.seekRelative(5));
    onClick(`${this.winId}-btn-eject`, () => this.toggleDiscOrEject());

    const trackSel = document.getElementById(`${this.winId}-track-select`);
    if (trackSel) {
      trackSel.addEventListener('change', () => {
        const pos = Number(trackSel.value) || 0;
        this.currentQueuePos = pos;
        this.elapsedSec = 0;
        if (this.state === 'playing') {
          this.play();
        } else {
          this.refreshUI();
        }
      });
    }

    onClick(`${this.winId}-pl-close`, () => this.closePlaylistModal());
    onClick(`${this.winId}-pl-cancel`, () => this.closePlaylistModal());
    onClick(`${this.winId}-pl-ok`, () => this.savePlaylistModal());
    onClick(`${this.winId}-pl-add`, () => this.playlistAddSelected());
    onClick(`${this.winId}-pl-remove`, () => this.playlistRemoveSelected());
    onClick(`${this.winId}-pl-clear`, () => this.playlistClear());
    onClick(`${this.winId}-pl-reset`, () => this.playlistReset());
    onClick(`${this.winId}-pl-setname`, () => this.playlistApplyTrackName());
  }

  handleCommand(cmd) {
    switch (cmd) {
      case 'edit-playlist':
        this.openPlaylistModal();
        break;
      case 'eject':
        this.toggleDiscOrEject();
        break;
      case 'exit':
        if (window.winManager) window.winManager.closeWindow(this.winId);
        break;
      case 'toggle-toolbar':
        this.showToolbar = !this.showToolbar;
        this.refreshUI();
        break;
      case 'toggle-discinfo':
        this.showDiscInfo = !this.showDiscInfo;
        this.refreshUI();
        break;
      case 'toggle-statusbar':
        this.showStatusBar = !this.showStatusBar;
        this.refreshUI();
        break;
      case 'mode-elapsed':
        this.setTimeMode('elapsed');
        break;
      case 'mode-track-rem':
        this.setTimeMode('track_rem');
        break;
      case 'mode-disc-rem':
        this.setTimeMode('disc_rem');
        break;
      case 'toggle-random':
        this.randomOrder = !this.randomOrder;
        this.refreshUI();
        break;
      case 'toggle-continuous':
        this.continuous = !this.continuous;
        this.refreshUI();
        break;
      case 'toggle-intro':
        this.introPlay = !this.introPlay;
        this.refreshUI();
        break;
      case 'volume-control':
        if (window.appSysTools && typeof window.appSysTools.openVolumeControl === 'function') {
          window.appSysTools.openVolumeControl();
        }
        break;
      case 'open-cdex':
        if (window.appCDex && typeof window.appCDex.open === 'function') {
          window.appCDex.open();
        }
        break;
      case 'about':
        if (window.winManager && typeof window.winManager.openDialog === 'function') {
          window.winManager.openDialog({
            title: 'О программе «Лазерный проигрыватель»',
            icon: 'cdplayer',
            message: 'Лазерный проигрыватель Microslop Win 98 SE (CDPLAYER.EXE v4.10.1998)\nВоспроизведение аудиодисков RedBook CD-DA на приводе D:.'
          });
        }
        break;
    }
  }

  setTimeMode(mode) {
    this.timeMode = mode;
    this.refreshUI();
  }

  play() {
    const active = this.getActiveDisc();
    if (!active) {
      this.stop();
      this.refreshUI();
      return;
    }
    const tr = this.getCurrentTrack();
    if (!tr) return;

    this.stopAudioElement();
    const wavUri = this.synthesizeTrackWav(tr);
    this.audioEl = new Audio(wavUri);
    this.audioEl.loop = true;
    this.audioEl.play().catch(() => {});

    this.state = 'playing';
    this.startTimer();
    this.refreshUI();
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      if (this.audioEl) this.audioEl.pause();
      this.stopTimer();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      if (this.audioEl) this.audioEl.play().catch(() => {});
      this.startTimer();
    }
    this.refreshUI();
  }

  stop() {
    this.state = 'stopped';
    this.elapsedSec = 0;
    this.stopTimer();
    this.stopAudioElement();
    this.refreshUI();
  }

  prevTrack() {
    const active = this.getActiveDisc();
    if (!active) return;
    const queue = this.getActivePlaylistTracks(active);
    if (!queue.length) return;

    if (this.elapsedSec > 3) {
      this.elapsedSec = 0;
    } else {
      this.currentQueuePos = (this.currentQueuePos - 1 + queue.length) % queue.length;
      this.elapsedSec = 0;
    }
    if (this.state === 'playing') this.play();
    else this.refreshUI();
  }

  nextTrack(autoAdvance = false) {
    const active = this.getActiveDisc();
    if (!active) return;
    const queue = this.getActivePlaylistTracks(active);
    if (!queue.length) return;

    if (this.randomOrder && queue.length > 1) {
      let nextPos = this.currentQueuePos;
      while (nextPos === this.currentQueuePos) {
        nextPos = Math.floor(Math.random() * queue.length);
      }
      this.currentQueuePos = nextPos;
    } else if (this.currentQueuePos + 1 < queue.length) {
      this.currentQueuePos++;
    } else if (this.continuous || !autoAdvance) {
      this.currentQueuePos = 0;
    } else {
      this.stop();
      return;
    }

    this.elapsedSec = 0;
    if (this.state === 'playing') this.play();
    else this.refreshUI();
  }

  seekRelative(deltaSec) {
    const tr = this.getCurrentTrack();
    if (!tr) return;
    this.elapsedSec = Math.max(0, Math.min(tr.durationSec - 1, this.elapsedSec + deltaSec));
    this.refreshUI();
  }

  toggleDiscOrEject() {
    this.stop();
    if (!window.vfs) return;
    if (typeof window.vfs.isCdRomInserted === 'function' && window.vfs.isCdRomInserted()) {
      const currentId = window.vfs.cdRomState && window.vfs.cdRomState.discId;
      if (currentId === 'igromania_09_1998' && typeof window.vfs.insertCdRom === 'function') {
        window.vfs.insertCdRom('office_games_98');
      } else if (typeof window.vfs.ejectCdRom === 'function') {
        window.vfs.ejectCdRom();
      }
    } else if (typeof window.vfs.insertCdRom === 'function') {
      window.vfs.insertCdRom('igromania_09_1998');
    }
    this.currentQueuePos = 0;
    this.refreshUI();
  }

  startTimer() {
    this.stopTimer();
    this.tickTimer = setInterval(() => {
      if (this.state !== 'playing') return;
      const tr = this.getCurrentTrack();
      if (!tr) {
        this.stop();
        return;
      }
      this.elapsedSec++;
      const limit = this.introPlay ? Math.min(10, tr.durationSec) : tr.durationSec;
      if (this.elapsedSec >= limit) {
        this.nextTrack(true);
        return;
      }
      this.refreshLCDAndStatus();
    }, 1000);
  }

  stopTimer() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  stopAudioElement() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl = null;
    }
  }

  refreshLCDAndStatus() {
    const active = this.getActiveDisc();
    const digitsEl = document.getElementById(`${this.winId}-lcd-digits`);
    const modeEl = document.getElementById(`${this.winId}-lcd-mode`);
    const stLeft = document.getElementById(`${this.winId}-st-left`);
    const stRight = document.getElementById(`${this.winId}-st-right`);

    if (!active) {
      if (digitsEl) digitsEl.textContent = '[00] 00:00';
      if (modeEl) modeEl.textContent = 'NO DISC IN D:';
      if (stLeft) stLeft.textContent = 'Данные или диск не загружен';
      if (stRight) stRight.textContent = 'Дорожка: 00:00 м:с';
      return;
    }

    const queue = this.getActivePlaylistTracks(active);
    const tr = this.getCurrentTrack();
    if (!tr) return;

    const totalSec = queue.reduce((acc, item) => acc + item.durationSec, 0);
    const elapsedBefore = queue.slice(0, this.currentQueuePos).reduce((acc, item) => acc + item.durationSec, 0);
    const discRem = Math.max(0, totalSec - (elapsedBefore + this.elapsedSec));
    const trackRem = Math.max(0, tr.durationSec - this.elapsedSec);

    let timeText = this.formatTime(this.elapsedSec);
    let modeText = 'TRACK ELAPSED';
    if (this.timeMode === 'track_rem') {
      timeText = `-${this.formatTime(trackRem)}`;
      modeText = 'TRACK REMAINING';
    } else if (this.timeMode === 'disc_rem') {
      timeText = `-${this.formatTime(discRem)}`;
      modeText = 'DISC REMAINING';
    }

    if (digitsEl) {
      digitsEl.textContent = `[${String(tr.num).padStart(2, '0')}] ${timeText}`;
    }
    if (modeEl) {
      modeEl.textContent = `${modeText} (${this.state.toUpperCase()})`;
    }
    if (stLeft) {
      stLeft.textContent = `Всего времени: ${this.formatTime(totalSec)} м:с`;
    }
    if (stRight) {
      stRight.textContent = `Дорожка: ${this.formatTime(tr.durationSec)} м:с`;
    }
  }

  refreshUI() {
    const active = this.getActiveDisc();
    const tb = document.getElementById(`${this.winId}-toolbar`);
    const info = document.getElementById(`${this.winId}-info-panel`);
    const sb = document.getElementById(`${this.winId}-statusbar`);

    if (tb) tb.classList.toggle('hidden', !this.showToolbar);
    if (info) info.classList.toggle('hidden', !this.showDiscInfo);
    if (sb) sb.classList.toggle('hidden', !this.showStatusBar);

    const setChecked = (id, cond) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('checked', !!cond);
    };
    const setActive = (id, cond) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('active', !!cond);
    };
    const setLit = (id, cond) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('lit', !!cond);
    };

    setChecked(`${this.winId}-m-toolbar`, this.showToolbar);
    setChecked(`${this.winId}-m-discinfo`, this.showDiscInfo);
    setChecked(`${this.winId}-m-statusbar`, this.showStatusBar);
    setChecked(`${this.winId}-m-elapsed`, this.timeMode === 'elapsed');
    setChecked(`${this.winId}-m-trackrem`, this.timeMode === 'track_rem');
    setChecked(`${this.winId}-m-discrem`, this.timeMode === 'disc_rem');
    setChecked(`${this.winId}-m-random`, this.randomOrder);
    setChecked(`${this.winId}-m-cont`, this.continuous);
    setChecked(`${this.winId}-m-intro`, this.introPlay);

    setActive(`${this.winId}-tb-elapsed`, this.timeMode === 'elapsed');
    setActive(`${this.winId}-tb-trackrem`, this.timeMode === 'track_rem');
    setActive(`${this.winId}-tb-discrem`, this.timeMode === 'disc_rem');
    setActive(`${this.winId}-tb-random`, this.randomOrder);
    setActive(`${this.winId}-tb-cont`, this.continuous);
    setActive(`${this.winId}-tb-intro`, this.introPlay);

    setActive(`${this.winId}-btn-play`, this.state === 'playing');
    setActive(`${this.winId}-btn-pause`, this.state === 'paused');

    setLit(`${this.winId}-flg-cda`, !!active);
    setLit(`${this.winId}-flg-rnd`, this.randomOrder);
    setLit(`${this.winId}-flg-cnt`, this.continuous);
    setLit(`${this.winId}-flg-int`, this.introPlay);

    const artistEl = document.getElementById(`${this.winId}-artist`);
    const albumEl = document.getElementById(`${this.winId}-album`);
    const selectEl = document.getElementById(`${this.winId}-track-select`);

    if (!active) {
      if (artistEl) artistEl.textContent = 'Диск не вставлен или данные';
      if (albumEl) albumEl.textContent = 'Вставьте компакт-диск в привод D:';
      if (selectEl) {
        selectEl.innerHTML = '<option value="0">[Нет аудиодорожек]</option>';
        selectEl.disabled = true;
      }
      this.refreshLCDAndStatus();
      return;
    }

    if (artistEl) artistEl.textContent = active.data.artist;
    if (albumEl) albumEl.textContent = active.data.title;

    const queue = this.getActivePlaylistTracks(active);
    if (selectEl) {
      selectEl.disabled = false;
      selectEl.innerHTML = queue.map((tr, idx) => (
        `<option value="${idx}" ${idx === this.currentQueuePos ? 'selected' : ''}>` +
        `[${String(tr.num).padStart(2, '0')}] ${tr.title} (${this.formatTime(tr.durationSec)})` +
        `</option>`
      )).join('');
    }

    this.refreshLCDAndStatus();
  }

  openPlaylistModal() {
    const active = this.getActiveDisc();
    if (!active) return;

    this.draftPlaylist = [...active.data.playlist];
    this.draftTrackNames = {};
    active.data.tracks.forEach((tr) => {
      this.draftTrackNames[tr.num] = tr.title;
    });
    this.editorSelectedPlayIdx = 0;
    this.editorSelectedAvailIdx = 0;
    const audioTracks = active.data.tracks.filter((t) => !t.isData);
    this.editorEditingTrackNum = audioTracks.length ? audioTracks[0].num : 2;

    const artInput = document.getElementById(`${this.winId}-pl-artist`);
    const titInput = document.getElementById(`${this.winId}-pl-title`);
    if (artInput) artInput.value = active.data.artist;
    if (titInput) titInput.value = active.data.title;

    this.renderPlaylistModalLists();
    const modal = document.getElementById(`${this.winId}-playlist-modal`);
    if (modal) modal.classList.add('open');
  }

  renderPlaylistModalLists() {
    const active = this.getActiveDisc();
    if (!active) return;
    const curBox = document.getElementById(`${this.winId}-pl-current`);
    const availBox = document.getElementById(`${this.winId}-pl-avail`);
    const trLabel = document.getElementById(`${this.winId}-pl-trlabel`);
    const trInput = document.getElementById(`${this.winId}-pl-trname`);

    const audioTracks = active.data.tracks.filter((t) => !t.isData);

    if (curBox) {
      curBox.innerHTML = this.draftPlaylist.map((num, idx) => {
        const name = this.draftTrackNames[num] || `Track ${num}`;
        return `<div class="cdp-track-item ${idx === this.editorSelectedPlayIdx ? 'selected' : ''}" data-play-idx="${idx}" data-tr-num="${num}">[${String(num).padStart(2, '0')}] ${name}</div>`;
      }).join('');
      curBox.querySelectorAll('.cdp-track-item').forEach((el) => {
        el.addEventListener('click', () => {
          this.editorSelectedPlayIdx = Number(el.dataset.playIdx);
          this.editorEditingTrackNum = Number(el.dataset.trNum);
          this.renderPlaylistModalLists();
        });
      });
    }

    if (availBox) {
      availBox.innerHTML = audioTracks.map((tr, idx) => {
        const name = this.draftTrackNames[tr.num] || tr.title;
        return `<div class="cdp-track-item ${idx === this.editorSelectedAvailIdx ? 'selected' : ''}" data-avail-idx="${idx}" data-tr-num="${tr.num}">[${String(tr.num).padStart(2, '0')}] ${name}</div>`;
      }).join('');
      availBox.querySelectorAll('.cdp-track-item').forEach((el) => {
        el.addEventListener('click', () => {
          this.editorSelectedAvailIdx = Number(el.dataset.availIdx);
          this.editorEditingTrackNum = Number(el.dataset.trNum);
          this.renderPlaylistModalLists();
        });
      });
    }

    if (trLabel) {
      trLabel.textContent = `Дорожка ${String(this.editorEditingTrackNum).padStart(2, '0')}:`;
    }
    if (trInput) {
      trInput.value = this.draftTrackNames[this.editorEditingTrackNum] || '';
    }
  }

  playlistAddSelected() {
    const active = this.getActiveDisc();
    if (!active) return;
    const audioTracks = active.data.tracks.filter((t) => !t.isData);
    const chosen = audioTracks[this.editorSelectedAvailIdx];
    if (!chosen) return;
    this.draftPlaylist.push(chosen.num);
    this.editorSelectedPlayIdx = this.draftPlaylist.length - 1;
    this.renderPlaylistModalLists();
  }

  playlistRemoveSelected() {
    if (!this.draftPlaylist || this.draftPlaylist.length <= 1) return;
    this.draftPlaylist.splice(this.editorSelectedPlayIdx, 1);
    if (this.editorSelectedPlayIdx >= this.draftPlaylist.length) {
      this.editorSelectedPlayIdx = Math.max(0, this.draftPlaylist.length - 1);
    }
    this.renderPlaylistModalLists();
  }

  playlistClear() {
    const active = this.getActiveDisc();
    if (!active) return;
    const firstAudio = active.data.tracks.find((t) => !t.isData);
    this.draftPlaylist = firstAudio ? [firstAudio.num] : [];
    this.editorSelectedPlayIdx = 0;
    this.renderPlaylistModalLists();
  }

  playlistReset() {
    const active = this.getActiveDisc();
    if (!active) return;
    const def = this.defaultCatalog[active.id];
    if (!def) return;
    this.draftPlaylist = [...def.playlist];
    def.tracks.forEach((tr) => {
      this.draftTrackNames[tr.num] = tr.title;
    });
    const artInput = document.getElementById(`${this.winId}-pl-artist`);
    const titInput = document.getElementById(`${this.winId}-pl-title`);
    if (artInput) artInput.value = def.artist;
    if (titInput) titInput.value = def.title;
    this.editorSelectedPlayIdx = 0;
    this.renderPlaylistModalLists();
  }

  playlistApplyTrackName() {
    const trInput = document.getElementById(`${this.winId}-pl-trname`);
    if (!trInput || !trInput.value.trim()) return;
    this.draftTrackNames[this.editorEditingTrackNum] = trInput.value.trim();
    this.renderPlaylistModalLists();
  }

  savePlaylistModal() {
    const active = this.getActiveDisc();
    if (!active) return;
    const artInput = document.getElementById(`${this.winId}-pl-artist`);
    const titInput = document.getElementById(`${this.winId}-pl-title`);
    if (artInput && artInput.value.trim()) active.data.artist = artInput.value.trim();
    if (titInput && titInput.value.trim()) active.data.title = titInput.value.trim();
    if (this.draftPlaylist && this.draftPlaylist.length) {
      active.data.playlist = [...this.draftPlaylist];
    }
    if (this.draftTrackNames) {
      active.data.tracks.forEach((tr) => {
        if (this.draftTrackNames[tr.num]) {
          tr.title = this.draftTrackNames[tr.num];
        }
      });
    }
    this.currentQueuePos = 0;
    this.saveCatalog();
    this.closePlaylistModal();
    this.refreshUI();
  }

  closePlaylistModal() {
    const modal = document.getElementById(`${this.winId}-playlist-modal`);
    if (modal) modal.classList.remove('open');
  }

  cleanup() {
    this.stop();
  }
}

window.appCDPlayer = new AppCDPlayer();
