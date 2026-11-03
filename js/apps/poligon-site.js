class PoligonPlayer {
  constructor(root, clip, site) {
    this.root = root;
    this.clip = clip;
    this.site = site || null;
    this.sound = site ? site.sound : { volume: 0.8, muted: false };
    this.canvas = root.querySelector('.pg-canvas');
    this.viewport = root.querySelector('.pg-viewport');
    this.audio = root.querySelector('.pg-audio');
    this.playBtn = root.querySelector('.pg-play');
    this.bigPlay = root.querySelector('.pg-bigplay');
    this.timeEl = root.querySelector('.pg-time');
    this.timeline = root.querySelector('.pg-timeline');
    this.cursor = root.querySelector('.pg-cursor');
    this.fadeEl = root.querySelector('.pg-fade');
    this.caption = root.querySelector('.pg-caption');
    this.msg = root.querySelector('.pg-msg');
    this.recEl = root.querySelector('.pg-rec');
    this.nowEl = root.querySelector('.pg-now');
    this.polysEl = root.querySelector('.pg-polys');
    this.fpsEl = root.querySelector('.pg-fps');
    this.muteBtn = root.querySelector('.pg-mute');
    this.volTrack = root.querySelector('.pg-vol-track');
    this.state = 'idle';
    this.time = clip.poster;
    this.silent = false;
    this.clockBase = 0;
    this.clockStart = 0;
    this.raf = 0;
    this.frames = 0;
    this.fpsSince = 0;
    this.lastStats = 0;
    this.lastShot = -1;
  }

  start() {
    try {
      this.renderer = new window.P3D.Renderer(this.canvas);
      this.scene = this.clip.create(this.renderer);
      this.scene.warm();
    } catch (e) {
      this.state = 'broken';
      this.root.classList.add('pg-broken');
      this.showMessage('Для просмотра нужен 3D-ускоритель. Браузер не дал доступ к WebGL, поэтому клип не запускается.');
      this.playBtn.disabled = true;
      this.bigPlay.hidden = true;
      return;
    }
    this.bind();
    this.applySound();
    this.drawFrame(this.time);
    this.updateTime();
    this.watch = setInterval(() => {
      if (!this.root.isConnected) this.destroy();
    }, 1000);
  }

  bind() {
    const toggle = () => this.toggle();
    this.playBtn.addEventListener('click', toggle);
    this.bigPlay.addEventListener('click', toggle);
    this.canvas.addEventListener('click', toggle);
    this.viewport.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.seek(this.currentTime() + (e.key === 'ArrowLeft' ? -5 : 5));
      }
    });
    const seekFromEvent = (e) => {
      const r = this.timeline.getBoundingClientRect();
      const k = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
      this.seek(k * this.clip.duration);
    };
    this.timeline.addEventListener('pointerdown', (e) => {
      seekFromEvent(e);
      const move = (ev) => seekFromEvent(ev);
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    this.timeline.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.seek(this.currentTime() + (e.key === 'ArrowLeft' ? -5 : 5));
      }
    });
    this.root.querySelectorAll('.pg-loc').forEach(btn => {
      btn.addEventListener('click', () => this.jumpTo(btn.dataset.loc));
    });
    this.root.querySelectorAll('.pg-at').forEach(btn => {
      btn.addEventListener('click', () => this.playFrom(Number(btn.dataset.at)));
    });
    const full = this.root.querySelector('.pg-full');
    if (full) {
      full.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (this.viewport.requestFullscreen) this.viewport.requestFullscreen().catch(() => {});
      });
    }
    this.muteBtn.addEventListener('click', () => {
      if (this.sound.volume === 0) this.setSound({ volume: 0.8, muted: false });
      else this.setSound({ muted: !this.sound.muted });
    });
    const volumeFromEvent = (e) => {
      const r = this.volTrack.getBoundingClientRect();
      const k = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
      this.setSound({ volume: Math.round(k * 100) / 100, muted: false });
    };
    this.volTrack.addEventListener('pointerdown', (e) => {
      volumeFromEvent(e);
      const move = (ev) => volumeFromEvent(ev);
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    this.volTrack.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -0.05, ArrowDown: -0.05, ArrowRight: 0.05, ArrowUp: 0.05 }[e.key];
      const v = step !== undefined ? this.sound.volume + step : e.key === 'Home' ? 0 : e.key === 'End' ? 1 : null;
      if (v === null) return;
      e.preventDefault();
      this.setSound({ volume: Math.round(Math.max(0, Math.min(1, v)) * 100) / 100, muted: false });
    });
    this.audio.addEventListener('ended', () => this.finish());
    this.audio.addEventListener('waiting', () => { if (this.state === 'playing') this.showMessage('Загрузка звука…'); });
    this.audio.addEventListener('playing', () => this.hideMessage());
  }

  setSound(patch) {
    Object.assign(this.sound, patch);
    if (this.site) this.site.saveSound();
    this.applySound();
  }

  applySound() {
    const { volume, muted } = this.sound;
    const pct = Math.round(volume * 100);
    const silent = muted || volume === 0;
    this.audio.volume = volume;
    this.audio.muted = muted;
    this.volTrack.style.setProperty('--pg-vol', `${pct}%`);
    this.volTrack.classList.toggle('pg-vol-off', muted);
    this.volTrack.setAttribute('aria-valuenow', String(pct));
    this.volTrack.setAttribute('aria-valuetext', muted ? `${pct}%, звук выключен` : `${pct}%`);
    this.volTrack.title = `Громкость: ${pct}%`;
    this.muteBtn.innerHTML = window.webGif ? window.webGif(silent ? 'mute' : 'speaker') : '';
    this.muteBtn.setAttribute('aria-label', silent ? 'Включить звук' : 'Выключить звук');
    this.muteBtn.setAttribute('aria-pressed', String(muted));
  }

  currentTime() {
    if (this.state !== 'playing') return this.time;
    if (this.silent) return this.clockBase + (performance.now() - this.clockStart) / 1000;
    return this.audio.currentTime;
  }

  toggle() {
    if (this.state === 'playing') this.pause();
    else this.play();
  }

  play() {
    if (this.state === 'broken') return;
    if (this.state === 'ended' || this.time >= this.clip.duration - 0.05) this.time = 0;
    if (this.state === 'idle') this.time = 0;
    this.state = 'playing';
    this.root.classList.add('pg-playing');
    this.root.classList.remove('pg-ended');
    this.bigPlay.hidden = true;
    this.playBtn.textContent = '❚❚';
    this.playBtn.setAttribute('aria-label', 'Пауза');
    if (this.silent) {
      this.clockBase = this.time;
      this.clockStart = performance.now();
    } else {
      try {
        this.audio.currentTime = this.time;
      } catch (e) {}
      const p = this.audio.play();
      if (p && p.catch) p.catch(() => this.goSilent());
    }
    this.fpsSince = performance.now();
    this.frames = 0;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.loop());
  }

  goSilent() {
    if (this.state !== 'playing') return;
    this.silent = true;
    this.clockBase = this.time;
    this.clockStart = performance.now();
    this.showMessage('Звуковая дорожка не загрузилась. Клип идёт без звука.');
  }

  pause() {
    this.time = this.currentTime();
    this.state = 'paused';
    this.root.classList.remove('pg-playing');
    this.audio.pause();
    cancelAnimationFrame(this.raf);
    this.playBtn.textContent = '\u25BA';
    this.playBtn.setAttribute('aria-label', 'Смотреть');
    this.drawFrame(this.time);
    this.updateTime();
  }

  finish() {
    if (this.state === 'ended') return;
    this.time = this.clip.duration;
    this.state = 'ended';
    this.root.classList.remove('pg-playing');
    this.root.classList.add('pg-ended');
    cancelAnimationFrame(this.raf);
    this.audio.pause();
    this.playBtn.textContent = '\u25BA';
    this.bigPlay.hidden = false;
    this.bigPlay.textContent = '↺ Смотреть ещё раз';
    this.updateTime();
    if (window.appClippy && window.appClippy.onPoligonClipEnded) window.appClippy.onPoligonClipEnded(this.clip);
  }

  seek(t) {
    const tt = Math.max(0, Math.min(this.clip.duration - 0.05, t));
    if (this.state === 'playing') {
      if (this.silent) {
        this.clockBase = tt;
        this.clockStart = performance.now();
      } else {
        try {
          this.audio.currentTime = tt;
        } catch (e) {}
      }
      return;
    }
    if (this.state === 'idle' || this.state === 'ended') {
      this.state = 'paused';
      this.root.classList.remove('pg-ended');
      this.bigPlay.hidden = false;
      this.bigPlay.textContent = '\u25BA Смотреть';
    }
    this.time = tt;
    this.drawFrame(tt);
    this.updateTime();
  }

  jumpTo(loc) {
    const now = this.currentTime();
    const shots = this.clip.shots.filter(s => s.loc === loc);
    if (!shots.length) return;
    const next = shots.find(s => s.start > now + 0.5) || shots[0];
    this.seek(next.start + 0.01);
  }

  playFrom(t) {
    this.seek(t);
    if (this.state !== 'playing') this.play();
    const box = (this.root.parentElement || this.root).getBoundingClientRect();
    const r = this.viewport.getBoundingClientRect();
    if (r.top < box.top || r.bottom > box.bottom) this.viewport.scrollIntoView({ block: 'start' });
    this.viewport.focus({ preventScroll: true });
  }

  loop() {
    if (!this.root.isConnected) {
      this.destroy();
      return;
    }
    if (this.state !== 'playing') return;
    const t = this.currentTime();
    if (t >= this.clip.duration) {
      this.finish();
      return;
    }
    this.time = t;
    this.drawFrame(t);
    this.frames++;
    const now = performance.now();
    if (now - this.lastStats > 400) {
      this.updateTime();
      const fps = this.frames / Math.max(0.001, (now - this.fpsSince) / 1000);
      if (this.fpsEl) this.fpsEl.textContent = String(Math.round(fps));
      this.frames = 0;
      this.fpsSince = now;
      this.lastStats = now;
    }
    this.raf = requestAnimationFrame(() => this.loop());
  }

  drawFrame(t) {
    const info = this.scene.render(t);
    this.fadeEl.style.opacity = String(info.fade);
    this.caption.classList.toggle('pg-caption-on', t > 3 && t < 9.2);
    const rec = info.overlay === 'rec';
    this.recEl.hidden = !rec;
    if (rec) {
      const f = Math.floor((t % 1) * 25);
      this.recEl.lastChild.textContent = ` 00:0${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
    }
    if (info.shot.index !== this.lastShot) {
      this.lastShot = info.shot.index;
      const loc = this.clip.locations.find(l => l.id === info.shot.loc);
      if (this.nowEl) this.nowEl.textContent = `${loc.name}, план ${info.shot.index + 1}`;
      this.root.querySelectorAll('.pg-loc').forEach(b => b.classList.toggle('pg-loc-on', b.dataset.loc === info.shot.loc));
    }
    if (this.polysEl) this.polysEl.textContent = info.polys.toLocaleString('ru-RU');
  }

  updateTime() {
    const t = Math.min(this.time, this.clip.duration);
    this.timeEl.textContent = `${PoligonPlayer.fmt(t)} / ${PoligonPlayer.fmt(this.clip.duration)}`;
    this.cursor.style.left = `${(t / this.clip.duration) * 100}%`;
    this.timeline.setAttribute('aria-valuenow', String(Math.round(t)));
    this.timeline.setAttribute('aria-valuetext', PoligonPlayer.fmt(t));
  }

  showMessage(text) {
    this.msg.textContent = text;
    this.msg.hidden = false;
  }

  hideMessage() {
    if (this.state === 'broken' || this.silent) return;
    this.msg.hidden = true;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    clearInterval(this.watch);
    this.state = 'broken';
    try {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    } catch (e) {}
    if (this.renderer) this.renderer.dispose();
    this.renderer = null;
    if (window.poligonSite && window.poligonSite.player === this) window.poligonSite.player = null;
  }

  static fmt(t) {
    const s = Math.max(0, Math.floor(t));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
}

class PoligonSite {
  constructor() {
    this.baseUrl = 'http://www.poligon3d.ru';
    this.storeKey = 'poligon3d';
    this.player = null;
    this.sound = this.loadSound();
  }

  loadSound() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.storeKey) || '{}');
      const volume = typeof raw.volume === 'number' && raw.volume >= 0 && raw.volume <= 1 ? raw.volume : 0.8;
      return { volume, muted: raw.muted === true };
    } catch (e) {
      return { volume: 0.8, muted: false };
    }
  }

  saveSound() {
    try {
      localStorage.setItem(this.storeKey, JSON.stringify(this.sound));
    } catch (e) {}
  }

  clips() {
    return (window.poligonClips || []).filter(c => !c.hidden);
  }

  esc(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  parseUrl(url) {
    const clean = String(url || '').toLowerCase();
    const m = clean.match(/\/clip\/([a-z0-9-]+)/);
    const list = this.clips();
    if (m) {
      const found = list.find(c => c.id === m[1]);
      if (found) return found.id;
    }
    return list.length ? list[0].id : null;
  }

  fmt(t) {
    return PoligonPlayer.fmt(t);
  }

  renderSite(url) {
    this.lastUrl = url;
    const list = this.clips();
    const clip = list.find(c => c.id === this.parseUrl(url));
    return `
      <div class="pg-root">
        <header class="pg-head">
          <a class="pg-brand" data-url="${this.baseUrl}">
            <span class="pg-tri" aria-hidden="true"></span>
            <span class="pg-name">ПОЛИГОН</span>
          </a>
          <span class="pg-tag">Музыкальные клипы, собранные заново из полигонов</span>
        </header>
        <main class="pg-main">
          ${clip ? this.renderClip(clip) : '<p class="pg-empty">Клипов пока нет. Первый выпуск готовится.</p>'}
          ${this.renderList(list, clip)}
          <section class="pg-how">
            <h2>Как это сделано</h2>
            <p>Каждый клип мы разбираем по склейкам: где снят план, кто в кадре, куда смотрит камера. Потом строим декорации и артистов из кубиков и призм, освещаем по вершинам и ставим камеры на те же доли такта.</p>
            <p>Картинку рисует ваша видеокарта прямо во время просмотра, в разрешении 512×384. Звук идёт из оригинальной фонограммы в MP3, поэтому губы и шаги попадают в музыку.</p>
          </section>
        </main>
        <footer class="pg-foot">Смотреть лучше с 3D-ускорителем и колонками. © «Полигон», 2001. Заявки на клипы: <a href="mailto:poligon@poligon3d.ru">poligon@poligon3d.ru</a></footer>
      </div>`;
  }

  renderClip(clip) {
    const d = clip.duration;
    const segs = clip.shots.map(s => {
      const loc = clip.locations.find(l => l.id === s.loc);
      return `<span class="pg-seg" style="left:${((s.start / d) * 100).toFixed(3)}%;width:${(((s.end - s.start) / d) * 100).toFixed(3)}%;background:${loc.color}" title="${this.esc(loc.name)}, ${this.fmt(s.start)}"></span>`;
    }).join('');
    const counts = {};
    clip.shots.forEach(s => { counts[s.loc] = (counts[s.loc] || 0) + 1; });
    const legend = clip.locations.map(l => `
      <button type="button" class="pg-loc" data-loc="${l.id}" title="Перейти к следующему плану">
        <span class="pg-swatch" style="background:${l.color}"></span>${this.esc(l.name)} <span class="pg-count">${counts[l.id] || 0}</span>
      </button>`).join('');
    const sets = new Set(clip.locations.map(l => l.scene)).size;
    const actors = Object.keys(clip.looks).length;
    return `
        <section class="pg-stage">
          <div class="pg-viewport" tabindex="0" aria-label="Клип ${this.esc(clip.title)}. Пробел: смотреть или пауза, стрелки: перемотка">
            <span class="pg-vp-label">Перспектива</span>
            <canvas class="pg-canvas" width="512" height="384"></canvas>
            <div class="pg-fade"></div>
            <div class="pg-caption">
              <span class="pg-cap-artist">${this.esc(clip.artist)}</span>
              <span class="pg-cap-title">${this.esc(clip.title)}</span>
              <span class="pg-cap-note">3D-версия «Полигона»</span>
            </div>
            <button type="button" class="pg-bigplay">&#9658; Смотреть</button>
            <div class="pg-rec" hidden><span class="pg-rec-dot">●</span> REC<span></span></div>
            <div class="pg-msg" hidden></div>
            <audio class="pg-audio" preload="metadata" src="${encodeURI(clip.audio)}"></audio>
          </div>
          <div class="pg-controls">
            <button type="button" class="win-button pg-play" aria-label="Смотреть">&#9658;</button>
            <span class="pg-time">0:00 / ${this.fmt(d)}</span>
            <div class="pg-timeline" tabindex="0" role="slider" aria-label="Перемотка" aria-valuemin="0" aria-valuemax="${Math.round(d)}" aria-valuenow="0">
              ${segs}
              <span class="pg-cursor"></span>
            </div>
            <div class="pg-vol">
              <button type="button" class="win-button pg-mute" aria-label="Выключить звук" aria-pressed="${this.sound.muted}"></button>
              <div class="pg-vol-track${this.sound.muted ? ' pg-vol-off' : ''}" tabindex="0" role="slider" aria-label="Громкость" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(this.sound.volume * 100)}" style="--pg-vol:${Math.round(this.sound.volume * 100)}%">
                <span class="pg-vol-ramp"></span>
                <span class="pg-vol-knob"></span>
              </div>
            </div>
            <button type="button" class="win-button pg-full">На весь экран</button>
          </div>
          <div class="pg-legend">${legend}</div>
        </section>
        <aside class="pg-info">
          <div class="pg-artist">${this.esc(clip.artist)}</div>
          <h1 class="pg-title">${this.esc(clip.title)}</h1>
          <dl class="pg-facts">
            <dt>Оригинальный клип</dt><dd>${clip.originalYear}</dd>
            <dt>Декораций</dt><dd>${sets}</dd>
            <dt>Персонажей</dt><dd>${actors}</dd>
            <dt>Склеек</dt><dd>${clip.shots.length - 1}</dd>
            <dt>Сейчас в кадре</dt><dd class="pg-now">—</dd>
            <dt>Полигонов в кадре</dt><dd class="pg-polys">—</dd>
            <dt>Кадров в секунду</dt><dd class="pg-fps">—</dd>
          </dl>
          <p class="pg-note">Полоса перемотки раскрашена по местам съёмки: видно, как монтаж прыгает между декорациями. Кнопки под плеером переносят к следующему плану в выбранном месте.</p>
        </aside>
        ${this.renderStory(clip)}`;
  }

  renderStory(clip) {
    const story = (window.poligonStories || {})[clip.id];
    if (!story) return '';
    const moment = (at) => ` <button type="button" class="pg-at" data-at="${at}" title="Смотреть этот момент" aria-label="Смотреть с ${this.fmt(at)}">&#9658; ${this.fmt(at)}</button>`;
    const facts = story.facts.map(f => `<li>${this.esc(f.text)}${typeof f.at === 'number' ? moment(f.at) : ''}</li>`).join('');
    return `
        <section class="pg-story">
          <h2>История оригинала</h2>
          <div class="pg-story-body">
            <div class="pg-story-text">${story.history.map(p => `<p>${this.esc(p)}</p>`).join('')}</div>
            <div class="pg-did">
              <h3>Знаете ли вы?</h3>
              <ul>${facts}</ul>
            </div>
          </div>
        </section>`;
  }

  renderList(list, current) {
    const rows = list.map((c, i) => `
      <tr class="${current && c.id === current.id ? 'pg-row-on' : ''}">
        <td class="pg-num">${i + 1}</td>
        <td><a data-url="${this.baseUrl}/clip/${c.id}"><b>${this.esc(c.artist)}</b> — ${this.esc(c.title)}</a></td>
        <td>${c.originalYear}</td>
        <td>${this.fmt(c.duration)}</td>
        <td>${c.shots.length - 1}</td>
      </tr>`).join('');
    return `
      <section class="pg-list">
        <h2>Все клипы</h2>
        <table class="pg-table">
          <thead><tr><th>№</th><th>Клип</th><th>Год оригинала</th><th>Длина</th><th>Склеек</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="pg-next">Выпуск №${list.length + 1} уже в работе.</p>
      </section>`;
  }

  attachEvents(win, container) {
    if (this.player) this.player.destroy();
    this.player = null;
    const root = container.querySelector('.pg-root');
    if (!root) return;
    const clip = this.clips().find(c => c.id === this.parseUrl(this.lastUrl || this.baseUrl));
    if (!clip || !root.querySelector('.pg-viewport')) return;
    this.player = new PoligonPlayer(root, clip, this);
    this.player.start();
  }
}

window.PoligonPlayer = PoligonPlayer;
window.poligonSite = new PoligonSite();
