/**
 * ActiveMovie / Win Media Player 98
 * Supports video playback, frame stepping, volume/seek control,
 * local video file opening, and interactive retro synth video generator.
 */
class AppVideoPlayer {
  constructor() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 45; // 45 seconds demo
    this.volume = 0.8;
    this.isMuted = false;
    this.currentFileName = 'DEMO_CLIP.AVI';
    this.videoSrc = null;
    this.animFrameId = null;
    this.autoPlay = false;
  }

  isValidVideoUrl(src) {
    if (!src || typeof src !== 'string') return false;
    const trimmed = src.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) return false;
    return (
      trimmed.startsWith('content/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('./') ||
      /\.(mp4|webm|ogv|ogg|mov|avi)$/i.test(trimmed)
    );
  }

  open(fileName = 'DEMO_CLIP.AVI', videoSrc = null, autoPlay = null) {
    this.currentFileName = fileName || 'DEMO_CLIP.AVI';
    this.videoSrc = videoSrc;
    // Auto-play when opened as a file or when explicitly requested
    this.autoPlay = (autoPlay !== null) ? autoPlay : (videoSrc !== null);

    const winId = 'app_mplayer_' + Date.now();
    const win = window.winManager.createWindow({
      id: winId,
      title: `${this.currentFileName} - Win Media Player`,
      icon: 'video-player',
      width: 520,
      height: 430,
      content: this.buildHTML(winId)
    });

    this.attachEvents(win, winId);
  }

  buildHTML(winId) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    return `
      <div class="mplayer-container" id="${winId}_root">
        <!-- Menubar -->
        <div class="win-menubar">
          <div class="win-menu-item">
            ${t('mplayer.menuFile')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option mplayer-opt-open">${t('mplayer.menuOpen')} <span>Ctrl+O</span></div>
              <div class="win-dropdown-option mplayer-opt-close">${t('mplayer.menuClose')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option mplayer-opt-props">${t('mplayer.menuProps')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option mplayer-opt-exit">${t('mplayer.menuExit')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('mplayer.menuPlay')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option mplayer-opt-play">${t('mplayer.menuPlayPause')} <span>Space</span></div>
              <div class="win-dropdown-option mplayer-opt-stop">${t('mplayer.menuStop')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option mplayer-opt-rewind">${t('mplayer.menuRewind')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('mplayer.menuView')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option mplayer-opt-fullscreen">${t('mplayer.menuFullscreen')} <span>Alt+Enter</span></div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('mplayer.menuHelp')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option mplayer-opt-about">${t('mplayer.menuAbout')}</div>
            </div>
          </div>
        </div>

        <!-- Video Screen Area -->
        <div class="mplayer-screen-wrap" id="${winId}_screen_wrap">
          <video class="mplayer-video" id="${winId}_video" style="display:none;" playsinline></video>
          <canvas class="mplayer-canvas" id="${winId}_canvas" width="480" height="320"></canvas>
          <div class="mplayer-overlay-info" id="${winId}_overlay">00:00 [PAUSED]</div>
        </div>

        <!-- Controls Wrap -->
        <div class="mplayer-controls-wrap">
          <!-- Timeline Slider -->
          <div class="mplayer-trackbar-row">
            <input type="range" class="mplayer-slider" id="${winId}_slider" min="0" max="${this.duration}" step="0.1" value="0">
            <span class="mplayer-time-text" id="${winId}_time">00:00 / 00:45</span>
          </div>

          <!-- Buttons & Volume -->
          <div class="mplayer-buttons-row">
            <div class="mplayer-btn-group">
              <button class="mplayer-ctrl-btn" id="${winId}_btn_play" title="${t('mplayer.tipPlay')}">&#9658;</button>
              <button class="mplayer-ctrl-btn" id="${winId}_btn_pause" title="${t('mplayer.tipPause')}">&#10074;&#10074;</button>
              <button class="mplayer-ctrl-btn" id="${winId}_btn_stop" title="${t('mplayer.tipStop')}">&#9632;</button>
              <button class="mplayer-ctrl-btn" id="${winId}_btn_prev" title="${t('mplayer.tipPrev')}">&#9668;&#9668;</button>
              <button class="mplayer-ctrl-btn" id="${winId}_btn_next" title="${t('mplayer.tipNext')}">&#9658;&#9658;</button>
              <button class="mplayer-ctrl-btn" id="${winId}_btn_eject" title="${t('mplayer.tipOpen')}">&#9167;</button>
            </div>

            <div class="mplayer-volume-wrap">
              <span id="${winId}_vol_icon" style="cursor:pointer;" title="${t('mplayer.tipVolume')}">&#128266;</span>
              <input type="range" class="mplayer-volume-slider" id="${winId}_volume" min="0" max="1" step="0.05" value="${this.volume}">
              <button class="win-btn" id="${winId}_btn_fs" style="padding:1px 6px; font-size:10px; margin-left:4px;">&#9974;</button>
            </div>
          </div>
        </div>

        <!-- Hidden file input for real video files -->
        <input type="file" id="${winId}_file_input" accept="video/*" style="display:none;">
      </div>
    `;
  }

  attachEvents(win, winId) {
    const el = win.element;
    const canvas = el.querySelector(`#${winId}_canvas`);
    const video = el.querySelector(`#${winId}_video`);
    const overlay = el.querySelector(`#${winId}_overlay`);
    const slider = el.querySelector(`#${winId}_slider`);
    const timeText = el.querySelector(`#${winId}_time`);
    const btnPlay = el.querySelector(`#${winId}_btn_play`);
    const btnPause = el.querySelector(`#${winId}_btn_pause`);
    const btnStop = el.querySelector(`#${winId}_btn_stop`);
    const btnPrev = el.querySelector(`#${winId}_btn_prev`);
    const btnNext = el.querySelector(`#${winId}_btn_next`);
    const btnEject = el.querySelector(`#${winId}_btn_eject`);
    const btnFs = el.querySelector(`#${winId}_btn_fs`);
    const volSlider = el.querySelector(`#${winId}_volume`);
    const fileInput = el.querySelector(`#${winId}_file_input`);
    const screenWrap = el.querySelector(`#${winId}_screen_wrap`);

    const ctx = canvas.getContext('2d');
    let usingRealVideo = false;
    let synthTime = 0;
    let isPlaying = false;
    let isDraggingSlider = false;

    const formatTime = (secs) => {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const updateTimeDisplay = (curr, total) => {
      timeText.textContent = `${formatTime(curr)} / ${formatTime(total)}`;
      if (!isDraggingSlider) {
        slider.max = total || 10;
        slider.value = curr;
      }
    };

    // Procedural Retro 90s Video Renderer
    const renderSynthFrame = (t) => {
      const w = canvas.width;
      const h = canvas.height;

      // Dark background with scanlines
      ctx.fillStyle = '#050a15';
      ctx.fillRect(0, 0, w, h);

      // SMPTE Color bars in top left small monitor
      const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
      const barW = w / bars.length;
      for (let i = 0; i < bars.length; i++) {
        ctx.fillStyle = bars[i];
        ctx.fillRect(i * barW, 0, barW, 40);
      }

      // 3D wireframe rotating cube
      const cx = w / 2;
      const cy = h / 2 + 10;
      const angle = t * 1.5;
      const size = 50 + Math.sin(t * 2) * 10;

      ctx.save();
      ctx.translate(cx, cy);

      // Rotating neon wireframe star / cube
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = angle + (i * Math.PI) / 4;
        const r = i % 2 === 0 ? size : size * 0.55;
        const x = Math.cos(rad) * r;
        const y = Math.sin(rad) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner polygon
      ctx.strokeStyle = '#ff00ff';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const rad = -angle * 1.2 + (i * Math.PI) / 3;
        const x = Math.cos(rad) * (size * 0.4);
        const y = Math.sin(rad) * (size * 0.4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // 90s Cyberpunk grid perspective floor
      ctx.strokeStyle = 'rgba(0, 255, 128, 0.4)';
      ctx.lineWidth = 1;
      const horizonY = h - 70;
      for (let i = 0; i < w; i += 30) {
        ctx.beginPath();
        ctx.moveTo(cx, horizonY);
        ctx.lineTo(i * 2 - w / 2, h);
        ctx.stroke();
      }
      for (let y = horizonY; y < h; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Audio visualizer spectrum bars at bottom
      ctx.fillStyle = '#ffaa00';
      const numBars = 24;
      const spectrumW = w / numBars;
      for (let i = 0; i < numBars; i++) {
        const freqHeight = Math.abs(Math.sin(t * 5 + i * 0.8)) * 30 + 4;
        ctx.fillRect(i * spectrumW + 2, h - freqHeight, spectrumW - 4, freqHeight);
      }

      // Retro text overlay
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#ffff00';
      ctx.textAlign = 'center';
      ctx.fillText('MICROSLOP ACTIVE MOVIE 1998', cx, 68);

      ctx.font = '12px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`CINEPAK CODEC • 320x240 • 30 FPS • ${formatTime(t)}`, cx, 90);

      // Scanline effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }
    };

    // Draw initial frame
    renderSynthFrame(0);

    // Retro Audio Synthesizer for Demo Clip (Web Audio API)
    let audioContext = null;
    let synthAudioTimer = null;
    let synthAudioGain = null;

    const startSynthAudio = () => {
      try {
        if (!audioContext) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) audioContext = new AudioCtx();
        }
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume();
        }
        if (!audioContext) return;

        if (synthAudioTimer) clearInterval(synthAudioTimer);

        if (!synthAudioGain) {
          synthAudioGain = audioContext.createGain();
          synthAudioGain.gain.setValueAtTime(this.volume * 0.08, audioContext.currentTime);
          synthAudioGain.connect(audioContext.destination);
        }

        const notes = [
          146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 440.00,
          261.63, 220.00, 196.00, 220.00, 293.66, 349.23, 392.00, 523.25
        ];
        let step = 0;

        synthAudioTimer = setInterval(() => {
          if (!isPlaying || usingRealVideo || !audioContext) return;
          const now = audioContext.currentTime;
          const freq = notes[step % notes.length];
          step++;

          const osc = audioContext.createOscillator();
          const noteGain = audioContext.createGain();
          osc.type = (step % 4 === 0) ? 'square' : 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);

          noteGain.gain.setValueAtTime(this.volume * 0.06, now);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

          osc.connect(noteGain);
          noteGain.connect(synthAudioGain);

          osc.start(now);
          osc.stop(now + 0.15);
        }, 135);
      } catch (e) {
        console.warn('Synth audio error:', e);
      }
    };

    const stopSynthAudio = () => {
      if (synthAudioTimer) {
        clearInterval(synthAudioTimer);
        synthAudioTimer = null;
      }
    };

    let lastTimestamp = performance.now();

    const loop = (now) => {
      if (!isPlaying) return;
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (!usingRealVideo) {
        synthTime += delta;
        if (synthTime >= this.duration) {
          synthTime = 0;
        }
        renderSynthFrame(synthTime);
        updateTimeDisplay(synthTime, this.duration);
        overlay.textContent = `${formatTime(synthTime)} [PLAYING]`;
      } else {
        updateTimeDisplay(video.currentTime, video.duration || 1);
        overlay.textContent = `${formatTime(video.currentTime)} [PLAYING]`;
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    const play = () => {
      isPlaying = true;
      lastTimestamp = performance.now();
      btnPlay.classList.add('active');
      btnPause.classList.remove('active');
      overlay.textContent = `${formatTime(usingRealVideo ? video.currentTime : synthTime)} [PLAYING]`;

      if (usingRealVideo) {
        const p = video.play();
        if (p !== undefined) {
          p.catch(e => {
            if (e.name === 'NotAllowedError') {
              console.warn('Autoplay blocked by browser policy, paused until user click');
              pause();
              overlay.textContent = `${formatTime(video.currentTime)} [CLICK PLAY]`;
            } else {
              console.warn('Video play error, falling back to synth video:', e);
              usingRealVideo = false;
              video.style.display = 'none';
              canvas.style.display = 'block';
              renderSynthFrame(synthTime);
              startSynthAudio();
            }
          });
        }
      } else {
        startSynthAudio();
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    const pause = () => {
      isPlaying = false;
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      btnPlay.classList.remove('active');
      btnPause.classList.add('active');
      overlay.textContent = `${formatTime(usingRealVideo ? video.currentTime : synthTime)} [PAUSED]`;
      if (usingRealVideo) {
        video.pause();
      } else {
        stopSynthAudio();
      }
    };

    const stop = () => {
      isPlaying = false;
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      btnPlay.classList.remove('active');
      btnPause.classList.remove('active');
      if (usingRealVideo) {
        video.pause();
        video.currentTime = 0;
      } else {
        stopSynthAudio();
        synthTime = 0;
        renderSynthFrame(0);
      }
      updateTimeDisplay(0, usingRealVideo ? video.duration : this.duration);
      overlay.textContent = `00:00 [STOPPED]`;
    };

    btnPlay.addEventListener('click', play);
    btnPause.addEventListener('click', pause);
    btnStop.addEventListener('click', stop);

    btnPrev.addEventListener('click', () => {
      if (usingRealVideo) video.currentTime = 0;
      else {
        synthTime = 0;
        renderSynthFrame(0);
      }
      updateTimeDisplay(0, usingRealVideo ? video.duration : this.duration);
    });

    btnNext.addEventListener('click', () => {
      if (usingRealVideo) video.currentTime = video.duration || 0;
      else {
        synthTime = this.duration;
        renderSynthFrame(synthTime);
      }
      updateTimeDisplay(this.duration, this.duration);
    });

    video.onended = () => {
      stop();
    };

    // Auto-load and play custom video source if provided and valid, otherwise procedural demo
    const isRealVideo = this.isValidVideoUrl(this.videoSrc) && !((this.currentFileName || '').toUpperCase().includes('DEMO_CLIP'));

    if (isRealVideo) {
      usingRealVideo = true;
      video.src = this.videoSrc;
      video.volume = this.volume;
      video.style.display = 'block';
      canvas.style.display = 'none';

      video.onerror = () => {
        console.warn('Real video source failed to load, falling back to Cinepak demo:', this.videoSrc);
        usingRealVideo = false;
        video.style.display = 'none';
        canvas.style.display = 'block';
        renderSynthFrame(0);
        if (this.autoPlay) play();
      };

      video.onloadedmetadata = () => {
        slider.max = video.duration || 10;
        updateTimeDisplay(video.currentTime, video.duration || 10);
      };
      if (video.readyState >= 1) {
        slider.max = video.duration || 10;
        updateTimeDisplay(video.currentTime, video.duration || 10);
      }
      if (this.autoPlay) {
        play();
      }
    } else {
      // Procedural 90s Cinepak Demo Clip (DEMO_CLIP.AVI)
      usingRealVideo = false;
      video.style.display = 'none';
      canvas.style.display = 'block';
      renderSynthFrame(0);
      updateTimeDisplay(0, this.duration);

      if (this.autoPlay) {
        setTimeout(() => {
          play();
        }, 120);
      }
    }

    // Slider scrubbing
    slider.addEventListener('mousedown', () => { isDraggingSlider = true; });
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (usingRealVideo) {
        video.currentTime = val;
      } else {
        synthTime = val;
        renderSynthFrame(synthTime);
      }
      timeText.textContent = `${formatTime(val)} / ${formatTime(usingRealVideo ? video.duration : this.duration)}`;
    });
    slider.addEventListener('mouseup', () => { isDraggingSlider = false; });

    // Open file from local system
    btnEject.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        usingRealVideo = true;
        video.src = url;
        video.style.display = 'block';
        canvas.style.display = 'none';
        win.titleElement.textContent = `${file.name} - Win Media Player`;

        video.onloadedmetadata = () => {
          slider.max = video.duration;
          updateTimeDisplay(0, video.duration);
          play();
        };
      }
    });

    // Volume control
    volSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      this.volume = v;
      video.volume = v;
      if (synthAudioGain && audioContext) {
        synthAudioGain.gain.setValueAtTime(v * 0.08, audioContext.currentTime);
      }
    });

    // Fullscreen toggle
    btnFs.addEventListener('click', () => {
      if (screenWrap.requestFullscreen) {
        screenWrap.requestFullscreen();
      }
    });

    // Dropdown options
    const optOpen = el.querySelector('.mplayer-opt-open');
    if (optOpen) optOpen.addEventListener('click', () => fileInput.click());
    const optPlay = el.querySelector('.mplayer-opt-play');
    if (optPlay) optPlay.addEventListener('click', () => { if (isPlaying) pause(); else play(); });
    const optStop = el.querySelector('.mplayer-opt-stop');
    if (optStop) optStop.addEventListener('click', stop);
    const optRewind = el.querySelector('.mplayer-opt-rewind');
    if (optRewind) optRewind.addEventListener('click', () => btnPrev.click());
    const optFs = el.querySelector('.mplayer-opt-fullscreen');
    if (optFs) optFs.addEventListener('click', () => btnFs.click());
    const optExit = el.querySelector('.mplayer-opt-exit');
    if (optExit) optExit.addEventListener('click', () => window.winManager.closeWindow(winId));
    const optProps = el.querySelector('.mplayer-opt-props');
    if (optProps) {
      optProps.addEventListener('click', () => {
        const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
        window.winManager.openDialog({
          title: t('mplayer.propsTitle'),
          icon: 'video-player',
          message: t('mplayer.propsMsg', win.titleElement.textContent.split(' - ')[0])
        });
      });
    }
    const optAbout = el.querySelector('.mplayer-opt-about');
    if (optAbout) {
      optAbout.addEventListener('click', () => {
        const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
        window.winManager.openDialog({
          title: t('mplayer.aboutTitle'),
          icon: 'video-player',
          message: t('mplayer.aboutMsg')
        });
      });
    }

    // Clean up animation & audio on window close
    const cleanup = () => {
      isPlaying = false;
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      if (video) video.pause();
      stopSynthAudio();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    };
    win.onClose = cleanup;
    win.element.addEventListener('window-close', cleanup);
  }
}

window.appVideoPlayer = new AppVideoPlayer();
