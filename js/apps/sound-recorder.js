class AppSoundRecorder {
  constructor() {
    this.audioCtx = null;
    this.buffer = null;
    this.source = null;
    this.isPlaying = false;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.stream = null;
    this.currentTime = 0;
    this.fileName = null;
    this.filePath = ['My Computer', 'C:', 'My Documents'];
    this.dirty = false;
    this.win = null;
    this.maxRecord = 60;
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  get duration() {
    if (this.isRecording) return this.currentTime;
    return this.buffer ? this.buffer.duration : 0;
  }

  fmt(sec) {
    const sep = window.i18n && window.i18n.getLanguage() === 'en' ? '.' : ',';
    return `${sec.toFixed(2).replace('.', sep)} ${this.t('sndrec.sec')}`;
  }

  titleText() {
    const name = this.fileName ? this.fileName.replace(/\.wav$/i, '') : this.t('sndrec.untitled');
    return `${name} - ${this.t('sndrec.appName')}`;
  }

  glyph(kind) {
    const paths = {
      start: 'M3 4h2v8h-2zM6 8l5-4v8zM11 8l5-4v8z',
      end: 'M1 4l5 4-5 4zM6 4l5 4-5 4zM12 4h2v8h-2z',
      play: 'M5 3l7 5-7 5z',
      stop: 'M4 4h8v8h-8z',
      record: 'M8 3a5 5 0 1 0 0.01 0z'
    };
    const fill = kind === 'record' ? '#ff0000' : '#000000';
    return `<svg viewBox="0 0 17 16" width="17" height="16" shape-rendering="crispEdges"><path d="${paths[kind]}" fill="${fill}"/></svg>`;
  }

  open() {
    const winId = 'app_sound_recorder';
    if (window.winManager.windows.has(winId)) {
      window.winManager.createWindow({ id: winId });
      return;
    }
    const t = (k, ...a) => this.t(k, ...a);
    const m = (cmd, label, extra = '') => `<div class="win-dropdown-option${extra}" data-cmd="${cmd}">${label}</div>`;
    const sep = '<div class="win-menu-separator"></div>';
    const content = document.createElement('div');
    content.className = 'sndrec-window';
    content.innerHTML = `
      <div class="win-menubar sndrec-menubar">
        <div class="win-menu-item">${t('sndrec.menuFile')}
          <div class="win-menu-dropdown">
            ${m('new', t('sndrec.menuNew'))}
            ${m('open', t('sndrec.menuOpen'))}
            ${m('save', t('sndrec.menuSave'))}
            ${m('saveas', t('sndrec.menuSaveAs'))}
            ${sep}
            ${m('exit', t('sndrec.menuExit'))}
          </div>
        </div>
        <div class="win-menu-item">${t('sndrec.menuEdit')}
          <div class="win-menu-dropdown">
            ${m('del-before', t('sndrec.menuDeleteBefore'), ' needs-sound')}
            ${m('del-after', t('sndrec.menuDeleteAfter'), ' needs-sound')}
          </div>
        </div>
        <div class="win-menu-item">${t('sndrec.menuEffects')}
          <div class="win-menu-dropdown">
            ${m('vol-up', t('sndrec.menuVolUp'), ' needs-sound')}
            ${m('vol-down', t('sndrec.menuVolDown'), ' needs-sound')}
            ${sep}
            ${m('speed-up', t('sndrec.menuSpeedUp'), ' needs-sound')}
            ${m('speed-down', t('sndrec.menuSpeedDown'), ' needs-sound')}
            ${sep}
            ${m('echo', t('sndrec.menuEcho'), ' needs-sound')}
            ${m('reverse', t('sndrec.menuReverse'), ' needs-sound')}
          </div>
        </div>
        <div class="win-menu-item">${t('sndrec.menuHelp')}
          <div class="win-menu-dropdown">
            ${m('help', t('sndrec.menuHelpTopics'))}
            ${sep}
            ${m('about', t('sndrec.menuAbout'))}
          </div>
        </div>
      </div>
      <div class="sndrec-body">
        <div class="sndrec-display-row">
          <div class="sndrec-label"><span>${t('sndrec.position')}</span><span class="snd-pos"></span></div>
          <div class="sndrec-scope-wrap"><canvas class="sndrec-scope-canvas" width="132" height="42"></canvas></div>
          <div class="sndrec-label right"><span>${t('sndrec.length')}</span><span class="snd-len"></span></div>
        </div>
        <div class="sndrec-track">
          <div class="sndrec-channel"></div>
          <div class="sndrec-thumb"></div>
          <div class="sndrec-ticks"></div>
        </div>
        <div class="sndrec-controls">
          <button class="sndrec-btn" data-act="start" title="${t('sndrec.tipStart')}">${this.glyph('start')}</button>
          <button class="sndrec-btn" data-act="end" title="${t('sndrec.tipEnd')}">${this.glyph('end')}</button>
          <button class="sndrec-btn" data-act="play" title="${t('sndrec.tipPlay')}">${this.glyph('play')}</button>
          <button class="sndrec-btn" data-act="stop" title="${t('sndrec.tipStop')}">${this.glyph('stop')}</button>
          <button class="sndrec-btn" data-act="record" title="${t('sndrec.tipRecord')}">${this.glyph('record')}</button>
        </div>
      </div>
    `;
    this.win = window.winManager.createWindow({
      id: winId,
      title: this.titleText(),
      icon: 'sound-recorder',
      width: 310,
      height: 'auto',
      resizable: false,
      content
    });
    this.canvas = content.querySelector('.sndrec-scope-canvas');
    this.ctx = this.canvas.getContext('2d');
    const ticks = content.querySelector('.sndrec-ticks');
    ticks.innerHTML = Array.from({ length: 11 }, (_, i) => `<span style="left:${i * 10}%"></span>`).join('');
    this.bind(content);
    this.updateUI();
  }

  bind(content) {
    content.querySelectorAll('[data-cmd]').forEach(opt => opt.addEventListener('click', () => this.command(opt.dataset.cmd)));
    content.querySelectorAll('.sndrec-btn').forEach(btn => btn.addEventListener('click', () => {
      const act = btn.dataset.act;
      if (act === 'start') this.seek(0);
      else if (act === 'end') this.seek(this.duration);
      else if (act === 'play') this.play();
      else if (act === 'stop') this.stop();
      else if (act === 'record') this.record();
    }));
    const track = content.querySelector('.sndrec-track');
    const seekAt = (e) => {
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left - 6) / (rect.width - 12)));
      this.seek(ratio * this.duration);
    };
    track.addEventListener('mousedown', (e) => {
      if (!this.buffer || this.isRecording) return;
      e.preventDefault();
      const wasPlaying = this.isPlaying;
      this.stop();
      seekAt(e);
      const move = ev => seekAt(ev);
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        if (wasPlaying) this.play();
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    });
    this.win.beforeClose = () => {
      if (!this.dirty || this.closing) return true;
      this.confirmDiscard(() => {
        this.closing = true;
        window.winManager.closeWindow('app_sound_recorder');
      });
      return false;
    };
    this.win.onClose = () => {
      this.stop();
      this.win = null;
      this.closing = false;
    };
  }

  ensureAudio() {
    if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new Ctx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
    return this.audioCtx;
  }

  command(cmd) {
    const actions = {
      new: () => this.confirmDiscard(() => {
        this.stop();
        this.buffer = null;
        this.fileName = null;
        this.currentTime = 0;
        this.dirty = false;
        this.updateUI();
      }),
      open: () => this.confirmDiscard(() => window.fileDialog.show({
        mode: 'open',
        path: this.filePath,
        filters: [{ label: this.t('sndrec.filterWav'), exts: ['wav'] }, { label: this.t('fdlg.allFiles'), exts: ['*'] }],
        onOk: (path, name) => this.loadFile(path, name)
      })),
      save: () => this.save(),
      saveas: () => this.saveAs(),
      exit: () => window.winManager.closeWindow('app_sound_recorder'),
      'del-before': () => this.cut(this.currentTime, this.duration),
      'del-after': () => this.cut(0, this.currentTime),
      'vol-up': () => this.transform(d => d.map(v => Math.max(-1, Math.min(1, v * 1.25)))),
      'vol-down': () => this.transform(d => d.map(v => v * 0.75)),
      'speed-up': () => this.resample(2),
      'speed-down': () => this.resample(0.5),
      echo: () => this.transform((d, rate) => {
        const delay = Math.floor(rate * 0.25);
        const out = new Float32Array(d.length);
        for (let i = 0; i < d.length; i++) out[i] = Math.max(-1, Math.min(1, d[i] + (i >= delay ? out[i - delay] * 0.45 : 0)));
        return out;
      }),
      reverse: () => this.transform(d => d.slice().reverse()),
      help: () => { if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp(); },
      about: () => window.winManager.openDialog({ title: this.t('sndrec.aboutTitle'), icon: 'sound-recorder', message: this.t('sndrec.aboutText') })
    };
    if (actions[cmd]) actions[cmd]();
  }

  confirmDiscard(then) {
    if (!this.dirty) {
      then();
      return;
    }
    window.winManager.openDialog({
      title: this.t('sndrec.appName'),
      icon: 'warning',
      message: this.t('sndrec.saveChanges', this.fileName || this.t('sndrec.untitled')),
      buttons: [
        { text: 'Yes', primary: true, onClick: () => setTimeout(() => this.save(then), 0) },
        { text: 'No', onClick: then },
        { text: 'Cancel' }
      ]
    });
  }

  makeBuffer(channels, rate) {
    const ctx = this.ensureAudio();
    if (!ctx || !channels[0].length) return null;
    const buf = ctx.createBuffer(channels.length, channels[0].length, rate);
    channels.forEach((d, i) => buf.copyToChannel(d, i));
    return buf;
  }

  channels() {
    const b = this.buffer;
    return Array.from({ length: b.numberOfChannels }, (_, i) => b.getChannelData(i).slice());
  }

  transform(fn) {
    if (!this.buffer) return;
    this.stop();
    const rate = this.buffer.sampleRate;
    this.buffer = this.makeBuffer(this.channels().map(d => Float32Array.from(fn(d, rate))), rate);
    this.currentTime = Math.min(this.currentTime, this.duration);
    this.dirty = true;
    this.updateUI();
  }

  resample(factor) {
    this.transform(d => {
      const len = Math.max(1, Math.floor(d.length / factor));
      const out = new Float32Array(len);
      for (let i = 0; i < len; i++) out[i] = d[Math.min(d.length - 1, Math.floor(i * factor))];
      return out;
    });
    this.currentTime = Math.min(this.currentTime / factor, this.duration);
    this.updateUI();
  }

  cut(from, to) {
    if (!this.buffer) return;
    const rate = this.buffer.sampleRate;
    const a = Math.floor(from * rate);
    const b = Math.floor(to * rate);
    this.transform(d => {
      const out = new Float32Array(d.length - (b - a));
      out.set(d.subarray(0, a));
      out.set(d.subarray(b), a);
      return out;
    });
    this.currentTime = from === 0 ? 0 : Math.min(from, this.duration);
    this.updateUI();
  }

  seek(time) {
    const playing = this.isPlaying;
    if (playing) this.stopPlayback();
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    if (playing) this.play();
    this.updateUI();
  }

  play() {
    if (!this.buffer || this.isRecording || this.isPlaying) return;
    const ctx = this.ensureAudio();
    if (!ctx) return;
    if (this.currentTime >= this.duration - 0.01) this.currentTime = 0;
    const src = ctx.createBufferSource();
    src.buffer = this.buffer;
    src.connect(ctx.destination);
    const offset = this.currentTime;
    const startedAt = ctx.currentTime;
    src.start(0, offset);
    this.source = src;
    this.isPlaying = true;
    src.onended = () => {
      if (this.source !== src) return;
      this.isPlaying = false;
      this.source = null;
      this.currentTime = this.duration;
      this.updateUI();
    };
    const loop = () => {
      if (!this.isPlaying || this.source !== src) return;
      this.currentTime = Math.min(this.duration, offset + ctx.currentTime - startedAt);
      this.updateUI();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    this.updateUI();
  }

  stopPlayback() {
    if (this.source) {
      const src = this.source;
      this.source = null;
      try { src.stop(); } catch (e) {}
    }
    this.isPlaying = false;
  }

  record() {
    if (this.isRecording) return;
    this.stopPlayback();
    const ctx = this.ensureAudio();
    if (!ctx || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      this.noDevice();
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.stream = stream;
      const chunks = [];
      const rec = new MediaRecorder(stream);
      this.mediaRecorder = rec;
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(tr => tr.stop());
        new Blob(chunks).arrayBuffer().then(ab => ctx.decodeAudioData(ab)).then(recorded => {
          this.insertRecording(recorded);
        }).catch(() => this.updateUI());
      };
      rec.start();
      this.isRecording = true;
      this.recordFrom = this.currentTime;
      const started = performance.now();
      const loop = () => {
        if (!this.isRecording) return;
        this.recordElapsed = (performance.now() - started) / 1000;
        if (this.recordElapsed >= this.maxRecord) {
          this.stop();
          return;
        }
        this.updateUI();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      this.updateUI();
    }).catch(() => this.noDevice());
  }

  insertRecording(recorded) {
    const rate = recorded.sampleRate;
    const rec = Array.from({ length: recorded.numberOfChannels }, (_, i) => recorded.getChannelData(i));
    if (!this.buffer) {
      this.buffer = this.makeBuffer(rec.map(d => Float32Array.from(d)), rate);
    } else {
      const base = this.channels();
      const at = Math.floor(this.recordFrom * this.buffer.sampleRate);
      const merged = base.map((d, i) => {
        const r = rec[Math.min(i, rec.length - 1)];
        const out = new Float32Array(Math.max(d.length, at + r.length));
        out.set(d);
        out.set(r, at);
        return out;
      });
      this.buffer = this.makeBuffer(merged, this.buffer.sampleRate);
    }
    this.currentTime = Math.min(this.duration, this.recordFrom + recorded.duration);
    this.dirty = true;
    this.updateUI();
  }

  noDevice() {
    this.isRecording = false;
    window.winManager.openDialog({ title: this.t('sndrec.appName'), icon: 'error', message: this.t('sndrec.noDevice') });
    this.updateUI();
  }

  stop() {
    this.stopPlayback();
    if (this.isRecording) {
      this.isRecording = false;
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
    }
    this.updateUI();
  }

  encodeWav() {
    const b = this.buffer;
    const rate = 22050;
    const src = b.getChannelData(0);
    const len = Math.floor(b.duration * rate);
    const data = new DataView(new ArrayBuffer(44 + len * 2));
    const str = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF');
    data.setUint32(4, 36 + len * 2, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    data.setUint32(16, 16, true);
    data.setUint16(20, 1, true);
    data.setUint16(22, 1, true);
    data.setUint32(24, rate, true);
    data.setUint32(28, rate * 2, true);
    data.setUint16(32, 2, true);
    data.setUint16(34, 16, true);
    str(36, 'data');
    data.setUint32(40, len * 2, true);
    for (let i = 0; i < len; i++) {
      const v = src[Math.min(src.length - 1, Math.floor(i * b.sampleRate / rate))];
      data.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true);
    }
    let bin = '';
    const bytes = new Uint8Array(data.buffer);
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return 'data:audio/wav;base64,' + btoa(bin);
  }

  writeTo(path, name) {
    const content = this.buffer ? this.encodeWav() : '';
    if (!window.vfs.writeFile(path, name, content)) return false;
    this.fileName = name;
    this.filePath = path;
    this.dirty = false;
    this.updateUI();
    return true;
  }

  saveAs(then) {
    window.fileDialog.show({
      mode: 'save',
      path: this.filePath,
      fileName: this.fileName || this.t('sndrec.untitled'),
      filters: [{ label: this.t('sndrec.filterWav'), exts: ['wav'] }],
      onOk: (path, name) => { if (this.writeTo(path, name) && then) then(); }
    });
  }

  save(then) {
    if (this.fileName) {
      this.writeTo(this.filePath, this.fileName);
      if (then) then();
    } else {
      this.saveAs(then);
    }
  }

  loadFile(path, name) {
    const content = window.vfs.readFile(path, name);
    const ctx = this.ensureAudio();
    const fail = () => window.winManager.openDialog({ title: this.t('sndrec.appName'), icon: 'error', message: this.t('sndrec.badFile', name) });
    if (!ctx || typeof content !== 'string' || !content.startsWith('data:audio')) {
      fail();
      return;
    }
    fetch(content).then(r => r.arrayBuffer()).then(ab => ctx.decodeAudioData(ab)).then(buf => {
      this.stop();
      this.buffer = buf;
      this.fileName = name;
      this.filePath = path;
      this.currentTime = 0;
      this.dirty = false;
      this.updateUI();
    }).catch(fail);
  }

  updateUI() {
    if (!this.win) return;
    const el = this.win.element;
    const pos = this.isRecording ? this.recordFrom + (this.recordElapsed || 0) : this.currentTime;
    const len = this.isRecording ? Math.max(this.buffer ? this.buffer.duration : 0, pos) : this.duration;
    el.querySelector('.snd-pos').textContent = this.fmt(pos);
    el.querySelector('.snd-len').textContent = this.fmt(len);
    const ratio = len > 0 ? pos / len : 0;
    const track = el.querySelector('.sndrec-track');
    el.querySelector('.sndrec-thumb').style.left = `${6 + ratio * (track.clientWidth - 12) - 5}px`;
    const has = !!this.buffer;
    const set = (act, on) => { el.querySelector(`.sndrec-btn[data-act="${act}"]`).disabled = !on; };
    set('start', has && !this.isRecording && pos > 0);
    set('end', has && !this.isRecording && pos < len);
    set('play', has && !this.isRecording && !this.isPlaying);
    set('stop', this.isPlaying || this.isRecording);
    set('record', !this.isRecording && !this.isPlaying);
    el.querySelectorAll('.needs-sound').forEach(o => o.classList.toggle('disabled', !has || this.isRecording));
    window.winManager.setTitle(this.win.id, this.titleText());
    this.drawScope(pos);
  }

  drawScope(pos) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#00ff00';
    const mid = Math.floor(h / 2);
    if (!this.buffer || this.isRecording) {
      if (this.isRecording) {
        for (let x = 0; x < w; x++) {
          const y = Math.round(mid + Math.sin(x * 0.4 + performance.now() / 60) * Math.random() * h * 0.35);
          ctx.fillRect(x, Math.min(y, mid), 1, Math.abs(y - mid) + 1);
        }
      } else {
        ctx.fillRect(0, mid, w, 1);
      }
      return;
    }
    const data = this.buffer.getChannelData(0);
    const rate = this.buffer.sampleRate;
    const center = Math.floor(pos * rate);
    const span = Math.floor(rate * 0.05);
    for (let x = 0; x < w; x++) {
      const i = center + Math.floor((x / w - 0.5) * span);
      const v = i >= 0 && i < data.length ? data[i] : 0;
      const y = Math.round(mid - v * (h / 2 - 1));
      ctx.fillRect(x, Math.min(y, mid), 1, Math.abs(y - mid) + 1);
    }
  }
}

window.appSoundRecorder = new AppSoundRecorder();
