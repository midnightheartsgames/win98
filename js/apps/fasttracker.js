class AppFastTracker {
  constructor() {
    this.windowId = 'win-fasttracker';
    this.isPlaying = false;
    this.editMode = true;
    this.currentModule = 'ENLIGHT98.XM';
    this.bpm = 132;
    this.speed = 6;
    this.octave = 4;
    this.currentRow = 0;
    this.cursorRow = 0;
    this.cursorCh = 0;
    this.selectedInst = 1;
    this.channelMuted = [false, false, false, false];
    this.channelPeaks = [0, 0, 0, 0];
    this.channelFreqs = [440, 110, 330, 80];
    this.playTimer = null;
    this.scopePhase = 0;
    this.keyHandler = null;

    this.instruments = [
      { id: 1, hex: '01', name: 'Pulse Lead 98', wave: 'square', decay: 0.24 },
      { id: 2, hex: '02', name: 'Sub Triangle Bass', wave: 'triangle', decay: 0.30 },
      { id: 3, hex: '03', name: 'Sawtooth Demoscene', wave: 'sawtooth', decay: 0.26 },
      { id: 4, hex: '04', name: 'Arp Chiptune Pluck', wave: 'square', decay: 0.16 },
      { id: 5, hex: '05', name: 'White Noise Snare', wave: 'noise', decay: 0.12 },
      { id: 6, hex: '06', name: 'Tracker Punch Kick', wave: 'kick', decay: 0.18 }
    ];

    this.noteNames = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];

    this.presetModules = {
      'ENLIGHT98.XM': {
        title: 'ENLIGHT \'98 INVITATION — Triton / FastTracker II',
        bpm: 135,
        speed: 6,
        rows: this.buildPresetRows('enlight')
      },
      'QUAKE2_CRACKTRO.MOD': {
        title: 'QUAKE II 3DFX CRACKTRO — Razor 1911 / Hybrid',
        bpm: 142,
        speed: 5,
        rows: this.buildPresetRows('quake2')
      },
      'FUTURE_CREW.XM': {
        title: 'SECOND REALITY REMIX 98 — Purple Motion / FC',
        bpm: 128,
        speed: 6,
        rows: this.buildPresetRows('future')
      }
    };

    this.pattern = this.cloneRows(this.presetModules[this.currentModule].rows);
  }

  buildPresetRows(kind) {
    const rows = [];
    const leadEnlight = [
      'A-4', '---', 'C-5', '---', 'E-5', '---', 'D-5', 'C-5',
      'G-4', '---', 'B-4', '---', 'D-5', '---', 'C-5', 'B-4',
      'F-4', '---', 'A-4', '---', 'C-5', '---', 'E-5', '---',
      'E-4', '---', 'G#4', '---', 'B-4', '---', 'E-5', '---'
    ];
    const leadQuake = [
      'E-4', 'E-4', 'G-4', 'E-4', 'A-4', '---', 'G-4', 'F#4',
      'E-4', 'E-4', 'B-4', 'A-4', 'G-4', '---', 'F#4', '---',
      'E-4', 'E-4', 'G-4', 'E-4', 'C-5', '---', 'B-4', 'A-4',
      'G-4', '---', 'F#4', '---', 'E-4', '---', '---', '---'
    ];
    const leadFuture = [
      'C-5', '---', 'G-4', '---', 'A#4', '---', 'F-4', '---',
      'G#4', '---', 'D#4', '---', 'F-4', 'G-4', 'G#4', 'A#4',
      'C-5', '---', 'D-5', '---', 'D#5', '---', 'D-5', 'C-5',
      'A#4', '---', 'G-4', '---', 'C-5', '---', '---', '---'
    ];

    const leads = kind === 'quake2' ? leadQuake : kind === 'future' ? leadFuture : leadEnlight;
    const bassNotes = kind === 'quake2'
      ? ['E-2', 'E-2', 'G-2', 'A-2']
      : kind === 'future'
        ? ['C-2', 'A#1', 'G#1', 'G-1']
        : ['A-2', 'G-2', 'F-2', 'E-2'];
    const arpNotes = ['C-4', 'E-4', 'A-4', 'E-4', 'B-3', 'D-4', 'G-4', 'D-4'];

    for (let r = 0; r < 32; r++) {
      const leadNote = leads[r] || '---';
      const bassBase = bassNotes[Math.floor(r / 8) % bassNotes.length];
      const bassNote = (r % 2 === 0) ? bassBase : '---';
      const arpNote = arpNotes[r % arpNotes.length];
      const drumNote = (r % 4 === 0) ? 'C-3' : (r % 4 === 2) ? 'F-4' : '---';
      const drumInst = (r % 4 === 0) ? '06' : (r % 4 === 2) ? '05' : '..';

      rows.push([
        {
          note: leadNote,
          inst: leadNote === '---' ? '..' : '01',
          vol: leadNote === '---' ? '..' : '40',
          fx: leadNote === '---' ? '...' : '037'
        },
        {
          note: bassNote,
          inst: bassNote === '---' ? '..' : '02',
          vol: bassNote === '---' ? '..' : '3C',
          fx: '...'
        },
        {
          note: arpNote,
          inst: '04',
          vol: '28',
          fx: '047'
        },
        {
          note: drumNote,
          inst: drumInst,
          vol: drumNote === '---' ? '..' : '40',
          fx: '...'
        }
      ]);
    }
    return rows;
  }

  cloneRows(rows) {
    return rows.map((r) => r.map((c) => ({ ...c })));
  }

  open(initialModuleKey) {
    this.winId = this.windowId;
    if (initialModuleKey) {
      const base = String(initialModuleKey).split(/[\\/]/).pop().toUpperCase();
      if (this.presetModules[base]) {
        this.currentModule = base;
        const mod = this.presetModules[this.currentModule];
        this.bpm = mod.bpm;
        this.speed = mod.speed;
        this.pattern = this.cloneRows(mod.rows);
      }
    }

    if (window.winManager && window.winManager.windows.has(this.windowId)) {
      const existing = window.winManager.windows.get(this.windowId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.windowId);
      else window.winManager.bringToTop(this.windowId);
      this.renderAll();
      return existing;
    }

    const content = `
      <div class="ft2-shell" id="${this.windowId}-shell">
        <div class="ft2-top-deck">
          <div class="ft2-bevel-box">
            <div class="ft2-box-header">
              <span>SONG & TRANSPORT</span>
              <span id="ft2-pos-indicator">POS 00/1F</span>
            </div>
            <div class="ft2-transport-grid">
              <button class="ft2-btn" id="ft2-btn-play" onclick="window.appFastTracker.togglePlay()">▶ Play Song</button>
              <button class="ft2-btn" id="ft2-btn-stop" onclick="window.appFastTracker.stop()">■ Stop</button>
              <button class="ft2-btn rec-active" id="ft2-btn-rec" onclick="window.appFastTracker.toggleEditMode()">● Edit: ON</button>
              <button class="ft2-btn" id="ft2-btn-clear" onclick="window.appFastTracker.clearCurrentPattern()">🧹 Clear Pat</button>
              <button class="ft2-btn wav-btn" id="ft2-btn-export" onclick="window.appFastTracker.exportWavToVfs()">💾 Экспорт .WAV в Мою музыку</button>
            </div>
            <div class="ft2-param-row">
              <span>BPM (Tempo):</span>
              <span class="ft2-param-val" id="ft2-val-bpm">${this.bpm}</span>
              <div class="ft2-spin-group">
                <button class="ft2-spin-btn" onclick="window.appFastTracker.changeBpm(-4)">-</button>
                <button class="ft2-spin-btn" onclick="window.appFastTracker.changeBpm(4)">+</button>
              </div>
            </div>
            <div class="ft2-param-row">
              <span>Speed (Ticks):</span>
              <span class="ft2-param-val" id="ft2-val-speed">0${this.speed}</span>
              <div class="ft2-spin-group">
                <button class="ft2-spin-btn" onclick="window.appFastTracker.changeSpeed(-1)">-</button>
                <button class="ft2-spin-btn" onclick="window.appFastTracker.changeSpeed(1)">+</button>
              </div>
            </div>
            <div class="ft2-param-row">
              <span>Octave (Keyb):</span>
              <span class="ft2-param-val" id="ft2-val-octave">${this.octave}</span>
              <div class="ft2-spin-group">
                <button class="ft2-spin-btn" onclick="window.appFastTracker.changeOctave(-1)">-</button>
                <button class="ft2-spin-btn" onclick="window.appFastTracker.changeOctave(1)">+</button>
              </div>
            </div>
          </div>

          <div class="ft2-bevel-box">
            <div class="ft2-box-header">
              <span>4-CHANNEL REALTIME SCOPES (GUS / SB16 MIXER)</span>
              <span id="ft2-module-subtitle">ENLIGHT98.XM</span>
            </div>
            <div class="ft2-scopes-wrap">
              <canvas class="ft2-scopes-canvas" id="ft2-scopes-canvas" width="380" height="78"></canvas>
              <div class="ft2-mute-row" id="ft2-mute-row"></div>
            </div>
          </div>

          <div class="ft2-bevel-box">
            <div class="ft2-box-header">
              <span>MODULE & INSTRUMENTS</span>
              <select id="ft2-module-select" style="background:#141820;color:#ffd86b;border:1px solid #48546a;font-size:10px;" onchange="window.appFastTracker.loadPresetModule(this.value)">
                <option value="ENLIGHT98.XM">ENLIGHT98.XM</option>
                <option value="QUAKE2_CRACKTRO.MOD">QUAKE2_CRACKTRO.MOD</option>
                <option value="FUTURE_CREW.XM">FUTURE_CREW.XM</option>
              </select>
            </div>
            <div class="ft2-inst-list" id="ft2-inst-list"></div>
          </div>
        </div>

        <div class="ft2-pattern-container">
          <div class="ft2-pattern-header">
            <div>ROW</div>
            <div>CH 01 — LEAD SYNTH</div>
            <div>CH 02 — SUB BASS</div>
            <div>CH 03 — ARPEGGIO</div>
            <div>CH 04 — PERCUSSION</div>
          </div>
          <div class="ft2-pattern-rows" id="ft2-pattern-rows"></div>
        </div>

        <div class="ft2-piano-strip" id="ft2-piano-strip"></div>

        <div class="status-bar">
          <div class="status-bar-field" id="ft2-status-left">Ready — Нажмите Play или вводите ноты с клавиатуры (Z-M / Q-U)</div>
          <div class="status-bar-field" id="ft2-status-right" style="flex:0 0 210px;">44.1 kHz 16-bit Stereo | Triton FT2</div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.windowId,
      title: `FastTracker 98 v2.09 - [${this.currentModule}]`,
      icon: 'fasttracker',
      width: 720,
      height: 500,
      minWidth: 640,
      minHeight: 400,
      content,
      onClose: () => {
        this.stop();
        this.unbindKeyboard();
      }
    });

    this.bindKeyboard();
    this.renderPianoStrip();
    this.renderAll();
    this.drawScopes();
    return win;
  }

  bindKeyboard() {
    this.unbindKeyboard();
    const keyMap = {
      'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 'v': 5,
      'g': 6, 'b': 7, 'h': 8, 'n': 9, 'j': 10, 'm': 11,
      'q': 12, '2': 13, 'w': 14, '3': 15, 'e': 16, 'r': 17,
      '5': 18, 't': 19, '6': 20, 'y': 21, '7': 22, 'u': 23
    };

    this.keyHandler = (e) => {
      const win = document.getElementById(this.windowId);
      if (!win || !win.classList.contains('active')) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;

      if (e.key === ' ') {
        e.preventDefault();
        this.togglePlay();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.cursorRow = (this.cursorRow + 1) % 32;
        this.renderPatternGrid();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.cursorRow = (this.cursorRow + 31) % 32;
        this.renderPatternGrid();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.cursorCh = (this.cursorCh + 1) % 4;
        this.renderPatternGrid();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.cursorCh = (this.cursorCh + 3) % 4;
        this.renderPatternGrid();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.clearCell(this.cursorRow, this.cursorCh);
        return;
      }

      const k = e.key.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(keyMap, k)) {
        e.preventDefault();
        const semi = keyMap[k];
        const noteName = this.noteNames[semi % 12];
        const oct = Math.min(7, this.octave + Math.floor(semi / 12));
        this.triggerNoteInput(`${noteName}${oct}`);
      }
    };

    document.addEventListener('keydown', this.keyHandler);
  }

  unbindKeyboard() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }

  renderPianoStrip() {
    const strip = document.getElementById('ft2-piano-strip');
    if (!strip) return;
    const keys = [];
    for (let i = 0; i < 12; i++) {
      const n = this.noteNames[i];
      const isSharp = n.includes('#');
      const fullNote = `${n}${this.octave}`;
      keys.push(`
        <button class="ft2-piano-key ${isSharp ? 'sharp' : ''}"
                onclick="window.appFastTracker.triggerNoteInput('${fullNote}')">${fullNote}</button>
      `);
    }
    strip.innerHTML = `<span style="font-size:10px;color:#ffd86b;margin-right:4px;">PIANO:</span>` + keys.join('');
  }

  renderAll() {
    if (window.winManager && typeof window.winManager.setTitle === 'function') {
      window.winManager.setTitle(this.windowId, `FastTracker 98 v2.09 - [${this.currentModule}]`);
    }
    const subEl = document.getElementById('ft2-module-subtitle');
    if (subEl) {
      subEl.textContent = this.currentModule;
    }
    const selEl = document.getElementById('ft2-module-select');
    if (selEl) {
      selEl.value = this.currentModule;
    }
    const bpmEl = document.getElementById('ft2-val-bpm');
    if (bpmEl) bpmEl.textContent = String(this.bpm);
    const spdEl = document.getElementById('ft2-val-speed');
    if (spdEl) spdEl.textContent = this.speed < 10 ? `0${this.speed}` : String(this.speed);
    const octEl = document.getElementById('ft2-val-octave');
    if (octEl) octEl.textContent = String(this.octave);

    const playBtn = document.getElementById('ft2-btn-play');
    if (playBtn) {
      playBtn.classList.toggle('active', this.isPlaying);
      playBtn.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play Song';
    }

    const recBtn = document.getElementById('ft2-btn-rec');
    if (recBtn) {
      recBtn.classList.toggle('rec-active', this.editMode);
      recBtn.textContent = this.editMode ? '● Edit: ON' : '○ Edit: OFF';
    }

    this.renderMuteRow();
    this.renderInstrumentList();
    this.renderPatternGrid();
  }

  renderMuteRow() {
    const row = document.getElementById('ft2-mute-row');
    if (!row) return;
    const labels = ['CH1 Lead', 'CH2 Bass', 'CH3 Arp', 'CH4 Drum'];
    row.innerHTML = labels.map((lbl, idx) => {
      const muted = this.channelMuted[idx];
      return `
        <div class="ft2-ch-pill ${muted ? 'muted' : ''}" onclick="window.appFastTracker.toggleChannelMute(${idx})">
          <span>${lbl}</span>
          <strong>${muted ? 'MUTE' : 'ON'}</strong>
        </div>
      `;
    }).join('');
  }

  renderInstrumentList() {
    const list = document.getElementById('ft2-inst-list');
    if (!list) return;
    list.innerHTML = this.instruments.map((inst) => `
      <div class="ft2-inst-item ${this.selectedInst === inst.id ? 'selected' : ''}"
           onclick="window.appFastTracker.selectInstrument(${inst.id})">
        <span>${inst.hex}: ${inst.name}</span>
        <span>[${inst.wave.toUpperCase()}]</span>
      </div>
    `).join('');
  }

  renderPatternGrid() {
    const container = document.getElementById('ft2-pattern-rows');
    if (!container) return;

    const posEl = document.getElementById('ft2-pos-indicator');
    if (posEl) {
      const hexRow = this.currentRow.toString(16).toUpperCase().padStart(2, '0');
      posEl.textContent = `ROW ${hexRow}/1F`;
    }

    container.innerHTML = this.pattern.map((rowCells, rIdx) => {
      const hexR = rIdx.toString(16).toUpperCase().padStart(2, '0');
      const isPlayingRow = rIdx === this.currentRow;
      const isBeat = rIdx % 4 === 0;
      const cellsHtml = rowCells.map((cell, cIdx) => {
        const isSelected = rIdx === this.cursorRow && cIdx === this.cursorCh;
        return `
          <div class="ft2-pat-cell ${isSelected ? 'selected-cell' : ''}"
               data-row="${rIdx}" data-ch="${cIdx}"
               onclick="window.appFastTracker.selectCell(${rIdx}, ${cIdx})">
            <span class="ft2-note-str">${cell.note}</span>
            <span class="ft2-inst-str">${cell.inst}</span>
            <span class="ft2-vol-str">${cell.vol}</span>
            <span class="ft2-fx-str">${cell.fx}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="ft2-pat-row ${isBeat ? 'beat-row' : ''} ${isPlayingRow ? 'active-row' : ''}" id="ft2-row-${rIdx}">
          <div class="ft2-pat-row-num">${hexR}</div>
          ${cellsHtml}
        </div>
      `;
    }).join('');
  }

  selectCell(row, ch) {
    this.cursorRow = row;
    this.cursorCh = ch;
    this.renderPatternGrid();
  }

  selectInstrument(instId) {
    this.selectedInst = instId;
    this.renderInstrumentList();
  }

  toggleChannelMute(chIdx) {
    this.channelMuted[chIdx] = !this.channelMuted[chIdx];
    this.renderMuteRow();
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    this.renderAll();
  }

  changeBpm(delta) {
    this.bpm = Math.max(70, Math.min(220, this.bpm + delta));
    this.renderAll();
    if (this.isPlaying) {
      this.restartPlayTimer();
    }
  }

  changeSpeed(delta) {
    this.speed = Math.max(1, Math.min(16, this.speed + delta));
    this.renderAll();
    if (this.isPlaying) {
      this.restartPlayTimer();
    }
  }

  changeOctave(delta) {
    this.octave = Math.max(1, Math.min(6, this.octave + delta));
    this.renderPianoStrip();
    this.renderAll();
  }

  loadPresetModule(modKey) {
    const key = String(modKey || '').toUpperCase();
    if (!this.presetModules[key]) return;
    this.currentModule = key;
    const mod = this.presetModules[key];
    this.bpm = mod.bpm;
    this.speed = mod.speed;
    this.currentRow = 0;
    this.cursorRow = 0;
    this.pattern = this.cloneRows(mod.rows);
    this.renderAll();
    this.setStatus(`Загружен трекерный модуль ${key} (${mod.title})`);
  }

  clearCell(row, ch) {
    if (!this.pattern[row] || !this.pattern[row][ch]) return;
    this.pattern[row][ch] = { note: '---', inst: '..', vol: '..', fx: '...' };
    this.renderPatternGrid();
  }

  clearCurrentPattern() {
    for (let r = 0; r < 32; r++) {
      for (let c = 0; c < 4; c++) {
        this.pattern[r][c] = { note: '---', inst: '..', vol: '..', fx: '...' };
      }
    }
    this.renderPatternGrid();
    this.setStatus('Паттерн очищен (32 строки x 4 канала)');
  }

  noteToFreq(noteStr) {
    if (!noteStr || noteStr === '---' || noteStr.length < 3) return 0;
    const prefix = noteStr.slice(0, 2);
    const oct = parseInt(noteStr.slice(2), 10);
    const semi = this.noteNames.indexOf(prefix);
    if (semi < 0 || Number.isNaN(oct)) return 0;
    const midi = (oct + 1) * 12 + semi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  playSynthNote(freq, instId, chIdx) {
    if (!freq || freq <= 0) return;
    this.channelPeaks[chIdx] = 1.0;
    this.channelFreqs[chIdx] = freq;

    const inst = this.instruments.find((i) => i.id === instId) || this.instruments[0];
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + inst.decay);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      if (inst.wave === 'kick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + inst.decay);
      } else if (inst.wave === 'noise') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * 1.7, now);
      } else {
        osc.type = inst.wave;
        osc.frequency.setValueAtTime(freq, now);
      }
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + inst.decay);
    } catch (e) {}
  }

  triggerNoteInput(noteStr) {
    const inst = this.instruments.find((i) => i.id === this.selectedInst) || this.instruments[0];
    const freq = this.noteToFreq(noteStr);
    this.playSynthNote(freq, inst.id, this.cursorCh);

    if (this.editMode && this.pattern[this.cursorRow] && this.pattern[this.cursorRow][this.cursorCh]) {
      this.pattern[this.cursorRow][this.cursorCh] = {
        note: noteStr,
        inst: inst.hex,
        vol: '40',
        fx: '000'
      };
      this.cursorRow = (this.cursorRow + 1) % 32;
      this.renderPatternGrid();
      this.setStatus(`Записана нота ${noteStr} (Инструмент ${inst.hex}) в канал CH 0${this.cursorCh + 1}`);
    }
    this.drawScopes();
  }

  stepIntervalMs() {
    const base = (2500 / Math.max(60, this.bpm)) * (this.speed / 6);
    return Math.max(55, Math.round(base * 6));
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    this.renderAll();
    this.stepRow();
    this.restartPlayTimer();
    this.setStatus(`Воспроизведение модуля ${this.currentModule} (${this.bpm} BPM)`);
  }

  restartPlayTimer() {
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    if (!this.isPlaying) return;
    this.playTimer = setInterval(() => {
      if (!document.getElementById(this.windowId)) {
        this.stop();
        return;
      }
      this.stepRow();
    }, this.stepIntervalMs());
  }

  stop() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    this.channelPeaks = [0, 0, 0, 0];
    this.renderAll();
    this.drawScopes();
    this.setStatus('Воспроизведение остановлено.');
  }

  stepRow() {
    const rowCells = this.pattern[this.currentRow];
    if (rowCells) {
      rowCells.forEach((cell, chIdx) => {
        this.channelPeaks[chIdx] *= 0.65;
        if (this.channelMuted[chIdx]) return;
        if (cell.note && cell.note !== '---') {
          const freq = this.noteToFreq(cell.note);
          const instId = parseInt(cell.inst, 16) || (chIdx + 1);
          this.playSynthNote(freq, instId, chIdx);
        }
      });
    }
    this.scopePhase += 0.65;
    this.drawScopes();
    this.renderPatternGrid();
    this.currentRow = (this.currentRow + 1) % 32;
  }

  drawScopes() {
    const canvas = document.getElementById('ft2-scopes-canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#080c12';
    ctx.fillRect(0, 0, w, h);

    const cellW = w / 4;
    for (let ch = 0; ch < 4; ch++) {
      const x0 = ch * cellW;
      ctx.strokeStyle = '#253042';
      ctx.strokeRect(x0, 0, cellW, h);

      ctx.strokeStyle = '#182230';
      ctx.beginPath();
      ctx.moveTo(x0, h / 2);
      ctx.lineTo(x0 + cellW, h / 2);
      ctx.stroke();

      const muted = this.channelMuted[ch];
      const amp = muted ? 0 : Math.max(0.08, this.channelPeaks[ch]) * (h * 0.36);
      const freqFactor = (this.channelFreqs[ch] || 220) / 140;

      ctx.strokeStyle = muted ? '#663333' : ch === 0 ? '#55ff88' : ch === 1 ? '#55ccff' : ch === 2 ? '#ffd86b' : '#ff88cc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 2; px < cellW - 2; px += 2) {
        const t = (px / cellW) * Math.PI * 2 * freqFactor + this.scopePhase;
        const sample = ch === 0 ? (Math.sin(t) >= 0 ? 1 : -1)
          : ch === 1 ? (2 / Math.PI) * Math.asin(Math.sin(t))
            : ch === 2 ? ((t / Math.PI) % 2) - 1
              : Math.sin(t * 2.3) * Math.cos(t * 0.7);
        const y = h / 2 + sample * amp;
        if (px === 2) ctx.moveTo(x0 + px, y);
        else ctx.lineTo(x0 + px, y);
      }
      ctx.stroke();
    }
  }

  buildSynthesizedWavDataUri() {
    const sampleRate = 11025;
    const seconds = 2.4;
    const numSamples = Math.floor(sampleRate * seconds);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    const samplesPerRow = Math.max(1, Math.floor(numSamples / 32));
    for (let i = 0; i < numSamples; i++) {
      const rowIdx = Math.min(31, Math.floor(i / samplesPerRow));
      const row = this.pattern[rowIdx];
      let mix = 0;
      for (let c = 0; c < 4; c++) {
        if (this.channelMuted[c]) continue;
        const freq = this.noteToFreq(row[c].note);
        if (freq > 0) {
          const t = i / sampleRate;
          mix += Math.sin(2 * Math.PI * freq * t) * 0.22;
        }
      }
      const clamped = Math.max(-1, Math.min(1, mix));
      view.setInt16(44 + i * 2, Math.floor(clamped * 32767), true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  }

  exportWavToVfs() {
    const cleanBase = this.currentModule.replace(/\.(XM|MOD)$/i, '');
    const fileName = `${cleanBase}_FT2.WAV`;
    const dataUri = this.buildSynthesizedWavDataUri();

    let savedPath = `C:\\My Documents\\Моя музыка\\${fileName}`;
    if (window.vfs && typeof window.vfs.resolvePath === 'function') {
      let folder = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Моя музыка']);
      if (!folder || !folder.children) {
        folder = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents']);
        savedPath = `C:\\My Documents\\${fileName}`;
      }
      if (folder && folder.children) {
        folder.children[fileName] = {
          type: 'file',
          icon: 'file-sound',
          size: '52 KB',
          content: dataUri,
          title: `${cleanBase} (FastTracker 98 Mix)`
        };
        if (typeof window.vfs.save === 'function') {
          window.vfs.save();
        }
      }
    }

    this.setStatus(`Экспортирован WAV: ${savedPath}`);
    if (window.dialogs && typeof window.dialogs.alert === 'function') {
      window.dialogs.alert(
        `Трекерный модуль ${this.currentModule} смикширован в 16-bit PCM WAV:\n${savedPath}\n\nТеперь его можно открыть в Winamp или Проводнике!`,
        'FastTracker 98 — WAV Export'
      );
    }
    return fileName;
  }

  setStatus(msg) {
    const el = document.getElementById('ft2-status-left');
    if (el) el.textContent = msg;
  }

  close() {
    this.stop();
    this.unbindKeyboard();
    if (window.winManager) window.winManager.closeWindow(this.windowId);
  }
}

window.appFastTracker = new AppFastTracker();
