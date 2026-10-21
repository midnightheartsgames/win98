class AppCDex {
  constructor() {
    this.winId = 'win-cdex';
    this.selectedTrackIdx = 1;
    this.cddbResolved = {};
    this.ripping = false;
    this.ripTimer = null;
    this.previewAudio = null;
    this.bitrate = 128;

    this.discs = {
      igromania_09_1998: {
        cddbId: '4509b405',
        rawArtist: 'Unknown Artist',
        rawAlbum: 'IGROMANIA_9809 (Mixed-Mode CD)',
        year: '1998',
        genre: 'Game Soundtrack',
        cddbArtist: 'Игромания CD #9 (Сентябрь 1998)',
        cddbAlbum: 'Igromania RedBook Bonus Audio',
        tracks: [
          {
            num: 1,
            isData: true,
            checked: false,
            rawTitle: 'Data Track [ISO9660 Mode 1]',
            cddbTitle: '[DATA] Архив журнала Игромания №9 (ISO9660)',
            start: '00:00:00',
            duration: '42:18',
            sectors: 190350,
            wavMb: '446.1 МБ',
            mp3Mb: '—',
            notes: []
          },
          {
            num: 2,
            isData: false,
            checked: true,
            rawTitle: 'Audio Track 02',
            cddbTitle: 'Sonic Mayhem - Quake II Stroggos Industrial (CD Mix)',
            start: '42:18:00',
            duration: '03:24',
            sectors: 15300,
            wavMb: '35.8 МБ',
            mp3Mb: '3.1 МБ',
            notes: [110, 110, 146.83, 110, 164.81, 155.56, 146.83, 130.81, 110, 110, 196.0, 164.81]
          },
          {
            num: 3,
            isData: false,
            checked: true,
            rawTitle: 'Audio Track 03',
            cddbTitle: 'Alexander Brandon - Unreal Na Pali Flyby (Tracker)',
            start: '45:42:00',
            duration: '04:12',
            sectors: 18900,
            wavMb: '44.3 МБ',
            mp3Mb: '3.8 МБ',
            notes: [220, 261.63, 329.63, 440, 392.0, 329.63, 293.66, 261.63, 246.94, 293.66, 392.0, 329.63]
          },
          {
            num: 4,
            isData: false,
            checked: true,
            rawTitle: 'Audio Track 04',
            cddbTitle: 'Mark Morgan - Fallout 2 Highwayman Ambient',
            start: '49:54:00',
            duration: '02:58',
            sectors: 13350,
            wavMb: '31.2 МБ',
            mp3Mb: '2.7 МБ',
            notes: [130.81, 196.0, 155.56, 130.81, 116.54, 174.61, 146.83, 130.81, 98.0, 130.81, 155.56, 196.0]
          },
          {
            num: 5,
            isData: false,
            checked: true,
            rawTitle: 'Audio Track 05',
            cddbTitle: 'Future Crew - Igromania #9 Demoscene Chiptune',
            start: '52:52:00',
            duration: '03:05',
            sectors: 13875,
            wavMb: '32.5 МБ',
            mp3Mb: '2.8 МБ',
            notes: [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23, 440.0, 587.33, 440.0, 392.0]
          }
        ]
      },
      office_games_98: {
        cddbId: '2e061a04',
        rawArtist: 'Unknown Artist',
        rawAlbum: 'OFFICE_GAMES_98 (Mixed-Mode CD)',
        year: '1998',
        genre: 'Arcade / Synth',
        cddbArtist: 'Сборник «200 Лучших Игр в Офис»',
        cddbAlbum: 'Office Arcade 98 Audio Tracks',
        tracks: [
          {
            num: 1,
            isData: true,
            checked: false,
            rawTitle: 'Data Track [ISO9660 Mode 1]',
            cddbTitle: '[DATA] Оболочка 200 Лучших Игр в Офис (ISO9660)',
            start: '00:00:00',
            duration: '28:10',
            sectors: 126750,
            wavMb: '297.0 МБ',
            mp3Mb: '—',
            notes: []
          },
          {
            num: 2,
            isData: false,
            checked: true,
            rawTitle: 'Audio Track 02',
            cddbTitle: 'Arkanoid 98 -Doh Stage AdLib Synth',
            start: '28:10:00',
            duration: '02:40',
            sectors: 12000,
            wavMb: '28.1 МБ',
            mp3Mb: '2.4 МБ',
            notes: [329.63, 392.0, 493.88, 659.25, 587.33, 493.88, 392.0, 329.63, 261.63, 329.63, 392.0, 493.88]
          },
          {
            num: 3,
            isData: false,
            checked: true,
            rawTitle: 'Audio Track 03',
            cddbTitle: 'Tetris 98 - Kalinka & Korobeiniki 8-Bit Mix',
            start: '30:50:00',
            duration: '03:15',
            sectors: 14625,
            wavMb: '34.2 МБ',
            mp3Mb: '3.0 МБ',
            notes: [329.63, 246.94, 261.63, 293.66, 261.63, 246.94, 220.0, 220.0, 261.63, 329.63, 293.66, 261.63]
          },
          {
            num: 4,
            isData: false,
            checked: true,
            rawTitle: 'Audio Track 04',
            cddbTitle: 'Color Lines 98 - King Lounge FM Theme',
            start: '34:05:00',
            duration: '02:50',
            sectors: 12750,
            wavMb: '29.8 МБ',
            mp3Mb: '2.6 МБ',
            notes: [196.0, 246.94, 293.66, 392.0, 349.23, 293.66, 246.94, 220.0, 261.63, 329.63, 293.66, 196.0]
          }
        ]
      }
    };
  }

  getActiveDisc() {
    if (!window.vfs || typeof window.vfs.isCdRomInserted !== 'function' || !window.vfs.isCdRomInserted()) {
      return null;
    }
    const discId = (window.vfs.cdRomState && window.vfs.cdRomState.discId) || 'igromania_09_1998';
    return {
      id: discId,
      data: this.discs[discId] || this.discs.igromania_09_1998
    };
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      const existing = window.winManager.windows.get(this.winId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.winId);
      else window.winManager.bringToTop(this.winId);
      this.refreshView();
      return existing;
    }

    const content = `
      <div class="cdex-shell" id="${this.winId}-shell">
        <div class="cdex-top-meta">
          <div class="cdex-meta-fields">
            <span class="cdex-meta-label">Исполнитель:</span>
            <input type="text" class="cdex-input" id="${this.winId}-artist" value="">
            <span class="cdex-meta-label">Год:</span>
            <input type="text" class="cdex-input" id="${this.winId}-year" value="1998">

            <span class="cdex-meta-label">Альбом (CD):</span>
            <input type="text" class="cdex-input" id="${this.winId}-album" value="">
            <span class="cdex-meta-label">Жанр:</span>
            <input type="text" class="cdex-input" id="${this.winId}-genre" value="Game Soundtrack">

            <span class="cdex-meta-label">Кодек MP3:</span>
            <select class="cdex-input" id="${this.winId}-bitrate">
              <option value="128">BladeEnc 0.76 • 128 kbps Joint Stereo</option>
              <option value="160">BladeEnc 0.76 • 160 kbps Stereo</option>
              <option value="192">Fraunhofer IIS • 192 kbps Hi-Fi</option>
            </select>
            <span class="cdex-meta-label">Привод:</span>
            <button class="win-btn" id="${this.winId}-refresh-cd" style="min-width:0; min-height:20px; padding:1px 6px;">D: 32X ATAPI</button>
          </div>

          <div class="cdex-drive-box">
            <div class="cdex-lcd">
              <div class="cdex-lcd-row">
                <span id="${this.winId}-lcd-disc">DISC: READY</span>
                <span id="${this.winId}-lcd-time">00:00</span>
              </div>
              <div class="cdex-lcd-sub" id="${this.winId}-lcd-cddb">CDDB: Локальный TOC</div>
              <div class="cdex-lcd-sub" id="${this.winId}-lcd-dae">DAE: ASPI 32X Paranoia OK</div>
            </div>
          </div>
        </div>

        <div class="cdex-workspace">
          <div class="cdex-tracklist-wrap" id="${this.winId}-tracklist-wrap"></div>

          <div class="cdex-vtoolbar">
            <button class="cdex-vbtn" id="${this.winId}-btn-wav" title="Извлечь выбранные дорожки в несжатый PCM WAV">
              <span class="cdex-vbtn-badge">WAV</span>
              <span>CD &rarr; WAV</span>
            </button>
            <button class="cdex-vbtn" id="${this.winId}-btn-mp3" title="Извлечь и сжать выбранные дорожки в MP3">
              <span class="cdex-vbtn-badge mp3">MP3</span>
              <span>CD &rarr; MP3</span>
            </button>
            <button class="cdex-vbtn" id="${this.winId}-btn-play" title="Прослушать выбранную CD-Audio дорожку">
              <span class="cdex-vbtn-badge play">&#9654;</span>
              <span>Прослушать</span>
            </button>
            <button class="cdex-vbtn" id="${this.winId}-btn-stop" title="Остановить воспроизведение или граббинг">
              <span class="cdex-vbtn-badge">&#9632;</span>
              <span>Стоп</span>
            </button>
            <button class="cdex-vbtn" id="${this.winId}-btn-cddb" title="Запросить названия дорожек с сервера freedb.org">
              <span class="cdex-vbtn-badge cddb">DB</span>
              <span>Запрос CDDB</span>
            </button>
            <button class="cdex-vbtn" id="${this.winId}-btn-winamp" title="Открыть сграбленную дорожку в WinAmp 98">
              <span class="cdex-vbtn-badge play">&#9835;</span>
              <span>В WinAmp</span>
            </button>
            <button class="cdex-vbtn" id="${this.winId}-btn-folder" title="Открыть папку «Моя музыка» в Проводнике">
              <span class="cdex-vbtn-badge">DIR</span>
              <span>Моя музыка</span>
            </button>
          </div>
        </div>

        <div class="cdex-rip-deck">
          <div class="cdex-rip-row">
            <span id="${this.winId}-status-text">Готов к извлечению цифровой аудиодорожки (C:\\My Documents\\Моя музыка)</span>
            <span id="${this.winId}-jitter-text">Jitter: 0 errors • Скорость: —</span>
          </div>
          <div class="cdex-progress-outer" id="${this.winId}-progress-bar"></div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.winId,
      title: 'CDex 0.14 Beta (CD-DA Digital Audio Extractor)',
      icon: 'cdex',
      width: 650,
      height: 430,
      minWidth: 560,
      minHeight: 370,
      resizable: true,
      maximizable: true,
      minimizable: true,
      content,
      onClose: () => this.cleanup()
    });

    this.bindEvents();
    this.refreshView();
    return win;
  }

  bindEvents() {
    document.getElementById(`${this.winId}-refresh-cd`).addEventListener('click', () => {
      if (window.soundSys && window.soundSys.playCdSpinUp) window.soundSys.playCdSpinUp();
      this.refreshView();
    });

    document.getElementById(`${this.winId}-bitrate`).addEventListener('change', (e) => {
      this.bitrate = Number(e.target.value) || 128;
    });

    document.getElementById(`${this.winId}-btn-wav`).addEventListener('click', () => {
      this.extractTracks('wav');
    });

    document.getElementById(`${this.winId}-btn-mp3`).addEventListener('click', () => {
      this.extractTracks('mp3');
    });

    document.getElementById(`${this.winId}-btn-play`).addEventListener('click', () => {
      this.previewSelectedTrack();
    });

    document.getElementById(`${this.winId}-btn-stop`).addEventListener('click', () => {
      this.stopAll();
    });

    document.getElementById(`${this.winId}-btn-cddb`).addEventListener('click', () => {
      this.queryRemoteCddb();
    });

    document.getElementById(`${this.winId}-btn-winamp`).addEventListener('click', () => {
      this.openSelectedInWinamp();
    });

    document.getElementById(`${this.winId}-btn-folder`).addEventListener('click', () => {
      this.ensureMusicFolder();
      if (window.appExplorer) {
        window.appExplorer.open(['My Computer', 'C:', 'My Documents', 'Моя музыка']);
      }
    });
  }

  refreshView() {
    const active = this.getActiveDisc();
    const wrap = document.getElementById(`${this.winId}-tracklist-wrap`);
    if (!wrap) return;

    const artistEl = document.getElementById(`${this.winId}-artist`);
    const albumEl = document.getElementById(`${this.winId}-album`);
    const yearEl = document.getElementById(`${this.winId}-year`);
    const genreEl = document.getElementById(`${this.winId}-genre`);
    const lcdDisc = document.getElementById(`${this.winId}-lcd-disc`);
    const lcdCddb = document.getElementById(`${this.winId}-lcd-cddb`);

    if (!active) {
      if (artistEl) artistEl.value = 'Нет диска';
      if (albumEl) albumEl.value = 'Вставьте компакт-диск в привод D:';
      if (lcdDisc) lcdDisc.textContent = 'DISC: NO DISC';
      if (lcdCddb) lcdCddb.textContent = 'CDDB: Ожидание D:';
      wrap.innerHTML = `
        <div class="cdex-empty-notice">
          <div><strong>В приводе [D:] ATAPI CD-ROM 32X нет компакт-диска.</strong></div>
          <div>Вставьте диск «Игромания №9 (1998)» или «200 Лучших Игр в Офис» через меню лотка CD-ROM.</div>
          <button class="win-btn" id="${this.winId}-insert-disc-btn">Вставить диск Игромания №9</button>
        </div>
      `;
      const insertBtn = document.getElementById(`${this.winId}-insert-disc-btn`);
      if (insertBtn) {
        insertBtn.addEventListener('click', () => {
          if (window.vfs && typeof window.vfs.insertCdRom === 'function') {
            window.vfs.insertCdRom('igromania_09_1998');
          }
          if (window.soundSys && window.soundSys.playCdSpinUp) window.soundSys.playCdSpinUp();
          this.refreshView();
        });
      }
      return;
    }

    const isResolved = !!this.cddbResolved[active.id];
    const d = active.data;
    if (artistEl) artistEl.value = isResolved ? d.cddbArtist : d.rawArtist;
    if (albumEl) albumEl.value = isResolved ? d.cddbAlbum : d.rawAlbum;
    if (yearEl) yearEl.value = d.year;
    if (genreEl) genreEl.value = d.genre;
    if (lcdDisc) lcdDisc.textContent = `DISC ID: ${d.cddbId.toUpperCase()}`;
    if (lcdCddb) lcdCddb.textContent = isResolved ? 'CDDB: freedb.org OK' : 'CDDB: Не синхр. (нажмите DB)';

    const rowsHtml = d.tracks.map((tr, idx) => {
      const title = isResolved ? tr.cddbTitle : tr.rawTitle;
      const selClass = idx === this.selectedTrackIdx ? 'selected' : '';
      const dataClass = tr.isData ? 'data-track' : '';
      const statusHtml = tr.rippedFile
        ? `<span class="cdex-status-pill done">OK (${tr.rippedFormat.toUpperCase()})</span>`
        : `<span class="cdex-status-pill">${tr.isData ? 'ISO DATA' : 'Готов'}</span>`;
      return `
        <tr class="${selClass} ${dataClass}" data-track-idx="${idx}">
          <td><input type="checkbox" class="cdex-tr-check" data-check-idx="${idx}" ${tr.checked ? 'checked' : ''} ${tr.isData ? 'disabled' : ''}></td>
          <td>${String(tr.num).padStart(2, '0')}</td>
          <td>${title}</td>
          <td>${tr.start}</td>
          <td>${tr.duration}</td>
          <td>${tr.wavMb}</td>
          <td>${tr.mp3Mb}</td>
          <td>${statusHtml}</td>
        </tr>
      `;
    }).join('');

    wrap.innerHTML = `
      <table class="cdex-table">
        <thead>
          <tr>
            <th style="width:24px;">&#10003;</th>
            <th style="width:28px;">№</th>
            <th>Название дорожки (RedBook CD-DA)</th>
            <th style="width:62px;">Начало</th>
            <th style="width:52px;">Длит.</th>
            <th style="width:64px;">WAV</th>
            <th style="width:58px;">MP3</th>
            <th style="width:84px;">Статус</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    wrap.querySelectorAll('tr[data-track-idx]').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (e.target.classList.contains('cdex-tr-check')) return;
        this.selectedTrackIdx = Number(row.dataset.trackIdx);
        this.refreshView();
      });
      row.addEventListener('dblclick', () => {
        this.selectedTrackIdx = Number(row.dataset.trackIdx);
        this.previewSelectedTrack();
      });
    });

    wrap.querySelectorAll('.cdex-tr-check').forEach((chk) => {
      chk.addEventListener('change', () => {
        const idx = Number(chk.dataset.checkIdx);
        if (d.tracks[idx] && !d.tracks[idx].isData) {
          d.tracks[idx].checked = chk.checked;
        }
      });
    });
  }

  queryRemoteCddb() {
    const active = this.getActiveDisc();
    if (!active) return;

    const statusText = document.getElementById(`${this.winId}-status-text`);
    const isDialupOnline = !!(window.appDialUp && window.appDialUp.connected);

    if (statusText) {
      statusText.textContent = isDialupOnline
        ? `Соединение с cddb.freedb.org:8880 (Disc ID ${active.data.cddbId})...`
        : `Чтение CD-TEXT и локального кэша freedb (${active.data.cddbId})...`;
    }

    setTimeout(() => {
      this.cddbResolved[active.id] = true;
      if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
      this.refreshView();
      const st = document.getElementById(`${this.winId}-status-text`);
      if (st) {
        st.textContent = `CDDB: Загружены названия дорожек для «${active.data.cddbAlbum}»`;
      }
    }, 420);
  }

  ensureMusicFolder() {
    if (!window.vfs) return ['My Computer', 'C:', 'My Documents'];
    const docsPath = ['My Computer', 'C:', 'My Documents'];
    const musicPath = ['My Computer', 'C:', 'My Documents', 'Моя музыка'];
    if (!window.vfs.resolvePath(musicPath)) {
      window.vfs.createFolder(docsPath, 'Моя музыка');
    }
    return musicPath;
  }

  synthesizeTrackWav(track) {
    if (track.cachedWavUri) return track.cachedWavUri;
    const sampleRate = 8000;
    const seconds = 6;
    const numSamples = sampleRate * seconds;
    const headerSize = 44;
    const buffer = new ArrayBuffer(headerSize + numSamples);
    const view = new DataView(buffer);

    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples, true);

    const notes = (track.notes && track.notes.length) ? track.notes : [220, 261.63, 329.63, 392.0];
    const stepSamples = Math.floor(sampleRate * 0.25);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const stepIdx = Math.floor(i / stepSamples);
      const freq = notes[stepIdx % notes.length];
      const bassFreq = freq * 0.5;
      const localT = (i % stepSamples) / stepSamples;
      const env = Math.max(0.15, 1.0 - localT * 0.72);

      const lead = Math.sin(2 * Math.PI * freq * t) + 0.45 * Math.sin(4 * Math.PI * freq * t);
      const bass = (Math.sin(2 * Math.PI * bassFreq * t) >= 0 ? 0.55 : -0.55);
      const arpFreq = freq * ((i % 400 < 200) ? 1.5 : 1.0);
      const arp = 0.25 * Math.sin(2 * Math.PI * arpFreq * t);

      const mix = (lead * 0.48 + bass * 0.32 + arp * 0.2) * env;
      const sampleByte = Math.max(8, Math.min(247, Math.round(128 + mix * 95)));
      view.setUint8(headerSize + i, sampleByte);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 4096;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    track.cachedWavUri = 'data:audio/wav;base64,' + btoa(binary);
    return track.cachedWavUri;
  }

  sanitizeFileName(title, ext) {
    const clean = String(title || 'Track')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return `${clean}.${ext}`;
  }

  extractTracks(format = 'mp3') {
    if (this.ripping) return;
    const active = this.getActiveDisc();
    if (!active) return;

    const queue = active.data.tracks.filter((tr) => !tr.isData && tr.checked);
    if (!queue.length) {
      const st = document.getElementById(`${this.winId}-status-text`);
      if (st) st.textContent = 'Отметьте хотя бы одну аудиодорожку (Track 02..05) для извлечения!';
      return;
    }

    this.stopPreview();
    this.ripping = true;
    if (window.soundSys && window.soundSys.playCdSpinUp) window.soundSys.playCdSpinUp();

    let trackPos = 0;
    let progressPct = 0;

    const stepRip = () => {
      if (!this.ripping) return;
      const tr = queue[trackPos];
      if (!tr) {
        this.finishRipBatch(queue, format);
        return;
      }

      progressPct += 25;
      this.renderProgressBar(Math.round(((trackPos + progressPct / 100) / queue.length) * 100));

      const isResolved = !!this.cddbResolved[active.id];
      const trackTitle = isResolved ? tr.cddbTitle : `Track ${String(tr.num).padStart(2, '0')}`;
      const curSector = Math.round((progressPct / 100) * tr.sectors);
      const speed = (12.4 + (tr.num * 0.7) + (progressPct * 0.02)).toFixed(1);

      const st = document.getElementById(`${this.winId}-status-text`);
      const jt = document.getElementById(`${this.winId}-jitter-text`);
      const lcdTime = document.getElementById(`${this.winId}-lcd-time`);

      if (st) {
        st.textContent = format === 'mp3'
          ? `Сжатие BladeEnc (${this.bitrate} kbps): ${trackTitle} (${progressPct}%)`
          : `Чтение PCM WAV: ${trackTitle} (${progressPct}%)`;
      }
      if (jt) {
        jt.textContent = `Сектор ${curSector}/${tr.sectors} • Jitter: 0 err • ${speed}x DAE`;
      }
      if (lcdTime) {
        lcdTime.textContent = `${progressPct}%`;
      }

      if (progressPct >= 100) {
        const wavUri = this.synthesizeTrackWav(tr);
        const fileName = this.sanitizeFileName(`${String(tr.num).padStart(2, '0')} - ${trackTitle}`, format);
        const musicPath = this.ensureMusicFolder();
        const dirNode = window.vfs ? window.vfs.resolvePath(musicPath) : null;
        if (dirNode && dirNode.children) {
          dirNode.children[fileName] = {
            type: 'file',
            icon: 'file-music',
            app: 'winamp',
            size: format === 'mp3' ? tr.mp3Mb : tr.wavMb,
            content: wavUri
          };
          if (window.vfs.save) window.vfs.save();
        }
        tr.rippedFile = fileName;
        tr.rippedFormat = format;
        tr.rippedSrc = wavUri;
        trackPos++;
        progressPct = 0;
        this.refreshView();
      }
    };

    this.ripTimer = setInterval(stepRip, 140);
  }

  finishRipBatch(queue, format) {
    this.stopRipTimer();
    this.ripping = false;
    this.renderProgressBar(100);
    if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
    if (window.appExplorer && typeof window.appExplorer.refresh === 'function') {
      window.appExplorer.refresh();
    }

    const st = document.getElementById(`${this.winId}-status-text`);
    const lcdTime = document.getElementById(`${this.winId}-lcd-time`);
    if (st) {
      st.textContent = `Готово! Извлечено дорожек: ${queue.length} (${format.toUpperCase()}) -> C:\\My Documents\\Моя музыка`;
    }
    if (lcdTime) {
      lcdTime.textContent = 'DONE';
    }
  }

  renderProgressBar(percent) {
    const bar = document.getElementById(`${this.winId}-progress-bar`);
    if (!bar) return;
    const totalBlocks = 38;
    const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * totalBlocks);
    let html = '';
    for (let i = 0; i < filled; i++) {
      html += '<div class="cdex-progress-block"></div>';
    }
    bar.innerHTML = html;
  }

  previewSelectedTrack() {
    const active = this.getActiveDisc();
    if (!active) return;
    const tr = active.data.tracks[this.selectedTrackIdx];
    if (!tr || tr.isData) {
      const st = document.getElementById(`${this.winId}-status-text`);
      if (st) st.textContent = 'Дорожка 01 содержит файловую систему ISO9660 (Data Track). Выберите аудиодорожку 02–05.';
      return;
    }

    this.stopPreview();
    const wavUri = this.synthesizeTrackWav(tr);
    this.previewAudio = new Audio(wavUri);
    this.previewAudio.play().catch(() => {});

    const isResolved = !!this.cddbResolved[active.id];
    const title = isResolved ? tr.cddbTitle : tr.rawTitle;
    const st = document.getElementById(`${this.winId}-status-text`);
    const lcdTime = document.getElementById(`${this.winId}-lcd-time`);
    if (st) st.textContent = `Прослушивание CD-DA: ${title}`;
    if (lcdTime) lcdTime.textContent = 'PLAY';
  }

  openSelectedInWinamp() {
    const active = this.getActiveDisc();
    if (!active) return;
    let tr = active.data.tracks[this.selectedTrackIdx];
    if (!tr || tr.isData) {
      tr = active.data.tracks.find((item) => !item.isData);
    }
    if (!tr) return;

    const wavUri = this.synthesizeTrackWav(tr);
    const isResolved = !!this.cddbResolved[active.id];
    const title = isResolved ? tr.cddbTitle : tr.rawTitle;
    const fileName = tr.rippedFile || `${String(tr.num).padStart(2, '0')} - ${title}.mp3`;

    this.stopPreview();
    if (window.appWinamp) {
      window.appWinamp.open(fileName, wavUri);
    }
  }

  stopRipTimer() {
    if (this.ripTimer) {
      clearInterval(this.ripTimer);
      this.ripTimer = null;
    }
  }

  stopPreview() {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
    }
  }

  stopAll() {
    this.ripping = false;
    this.stopRipTimer();
    this.stopPreview();
    const st = document.getElementById(`${this.winId}-status-text`);
    const lcdTime = document.getElementById(`${this.winId}-lcd-time`);
    if (st) st.textContent = 'Операция остановлена пользователем.';
    if (lcdTime) lcdTime.textContent = 'STOP';
  }

  cleanup() {
    this.stopAll();
  }
}

window.appCDex = new AppCDex();
