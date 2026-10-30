(function (B) {
  'use strict';
  const { clamp, v3, smoothstep, cameraBasis, makeCamera, buildHeightmap, buildTerrainChunks, roadPolyline, buildTrees, buildSky, buildFrames, buildBirds, groundHeight, Renderer, Ambience, Input, Flyer } = B;

  const ALBUM_KEY = 'win98_bliss_album', SETTINGS_KEY = 'win98_bliss_settings';
  const t = (k, ...a) => (window.i18n ? window.i18n.t(k, ...a) : k);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return; } },
  };
  const QUALITY = [
    { dpr: 1.5, grassNear: 320, grassFar: 100 },
    { dpr: 1.0, grassNear: 260, grassFar: 80 },
    { dpr: 0.8, grassNear: 170, grassFar: 60 },
    { dpr: 0.65, grassNear: 110, grassFar: 40 },
  ];

  const stageHtml = () => `
    <canvas class="bl-canvas"></canvas>
    <div class="bl-layer bl-cloudfog"></div>
    <div class="bl-layer bl-vignette"></div>
    <div class="bl-layer bl-flash"></div>
    <div class="bl-title">
      <h1>${t('app.bliss')}</h1>
      <p>${t('bliss.tagline')}</p>
      <button class="win-btn bl-start">${t('bliss.takeOff')}</button>
      <div class="bl-loading">${t('bliss.loading')}</div>
    </div>
    <div class="bl-keys">
      <kbd>${t('bliss.keyMouse')}</kbd> ${t('bliss.keySteer')} · <kbd>W</kbd> ${t('bliss.keyFlap')} · <kbd>S</kbd> ${t('bliss.keyBrake')} · <kbd>Esc</kbd> ${t('bliss.keyAlbum')} ·
      <kbd>M</kbd> ${t('bliss.keySound')} · <kbd>H</kbd> ${t('bliss.keyHud')} · <kbd>F</kbd> ${t('bliss.keyMaximize')}<br>
      ${t('bliss.soundAfter')}
    </div>
    <div class="bl-album bl-hud"></div>
    <div class="bl-readout bl-hud"></div>
    <div class="bl-hint"></div>
    <div class="bl-toast"></div>
    <div class="bl-polaroid"><img alt=""><span></span></div>
    <div class="bl-pause">
      <div class="bl-panel">
        <div class="bl-panel-title">${t('bliss.albumTitle')} <span class="bl-count"></span></div>
        <div class="bl-panel-body">
          <p class="bl-sub">${t('bliss.albumSub')}</p>
          <div class="bl-cards"></div>
          <div class="bl-row">
            <label>${t('bliss.volume')} <input class="bl-vol" type="range" min="0" max="1" step="0.05"></label>
            <label>${t('bliss.sensitivity')} <input class="bl-sens" type="range" min="0.3" max="2.5" step="0.1"></label>
            <label><input class="bl-invert" type="checkbox"> ${t('bliss.invert')}</label>
          </div>
          <div class="bl-keys-help">
            <kbd>${t('bliss.keyMouse')}</kbd> ${t('bliss.keyOr')} <kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> ${t('bliss.keySteer')} ·
            <kbd>W</kbd>/<kbd>Shift</kbd> ${t('bliss.keyFlap')} · <kbd>S</kbd> ${t('bliss.keyBrake')} · <kbd>R</kbd> ${t('bliss.keyHome')} ·
            <kbd>M</kbd> ${t('bliss.keySound')} · <kbd>H</kbd> ${t('bliss.keyHud')} · <kbd>F</kbd> ${t('bliss.keyMaximize')}
          </div>
          <div class="bl-buttons">
            <button class="win-btn bl-reset">${t('bliss.resetAlbum')}</button>
            <button class="win-btn is-default bl-resume">${t('bliss.resume')}</button>
          </div>
        </div>
      </div>
    </div>`;

  function start(stage, opts) {
    const $ = (name) => stage.querySelector('.bl-' + name);
    stage.innerHTML = stageHtml();
    const canvas = $('canvas');
    const stop = new AbortController();
    const signal = stop.signal;
    const on = (target, type, fn) => target.addEventListener(type, fn, { signal });
    const game = { closed: false, destroy() {} };
    let raf = 0;

    game.destroy = () => {
      game.closed = true;
      cancelAnimationFrame(raf);
      stop.abort();
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      if (game.audio && game.audio.ctx) game.audio.ctx.close();
      const gl = canvas.getContext('webgl2');
      const lose = gl && gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    };

    const gl = canvas.getContext('webgl2', { antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    if (!gl) {
      $('loading').textContent = t('bliss.needWebgl');
      return game;
    }
    const tick = () => new Promise((r) => { raf = requestAnimationFrame(() => setTimeout(r, 0)); });
    const loading = (text) => { $('loading').textContent = text; };

    (async () => {
      loading(t('bliss.loadHills'));
      await tick();
      if (game.closed) return;
      buildHeightmap();
      loading(t('bliss.loadValley'));
      await tick();
      if (game.closed) return;
      const chunks = buildTerrainChunks();
      const road = roadPolyline();
      const trees = buildTrees(road);
      const sky = buildSky();
      const frames = buildFrames(sky);
      const birds = buildBirds(sky.thermals);
      loading(t('bliss.loadClouds'));
      await tick();
      if (game.closed) return;
      run({ gl, canvas, stage, $, on, signal, opts, game, chunks, road, trees, sky, frames, birds, setRaf: (id) => { raf = id; } });
    })().catch((e) => {
      console.error(e);
      if (!game.closed) loading(t('bliss.error', e.message));
    });
    return game;
  }

  function run({ gl, canvas, stage, $, on, signal, opts, game, chunks, road, trees, sky, frames, birds, setRaf }) {
    const R = new Renderer(gl, { chunks, trees, sky, frames, birds, road });
    const audio = new Ambience();
    const input = new Input(canvas, { isActive: opts.isActive, signal });
    const TITLE = { pos: [0, groundHeight(0, 140) + 6, 140], yaw: 0, pitch: 0.2 };
    const flyer = new Flyer(TITLE);
    const frameName = (f) => t('bliss.frame.' + f.id);

    const settings = Object.assign({ vol: 0.8, sens: 1, invert: false }, store.get(SETTINGS_KEY, {}));
    flyer.sens = settings.sens;
    flyer.invertY = settings.invert;
    audio.setVolume(settings.vol);

    let state = 'title', resumeTo = 'title';
    let golden = 0, goldenTarget = 0;
    let inCloud = 0, hudHidden = false, lockLostAt = -1000;
    for (const f of frames) f.alpha = 0;

    const album = $('album'), cards = $('cards');
    function renderAlbum() {
      album.innerHTML = '';
      cards.innerHTML = '';
      for (const f of frames) {
        const slot = document.createElement('div');
        slot.className = 'bl-slot' + (f.found ? ' found' : '');
        slot.innerHTML = f.found ? `<img src="${f.thumb}" alt="">` : '?';
        album.appendChild(slot);
        const card = document.createElement('div');
        card.className = 'bl-card' + (f.found ? ' found' : '');
        card.innerHTML = f.found
          ? `<img src="${f.thumb}" alt=""><b>${frameName(f)}</b><button class="win-btn win-btn-sm" data-id="${f.id}">${t('bliss.setWallpaper')}</button>`
          : `<div class="bl-empty">?</div><b>${t('bliss.notFound')}</b><i>${t('bliss.clue.' + f.id)}</i>`;
        cards.appendChild(card);
      }
      $('count').textContent = `${frames.filter((f) => f.found).length} / ${frames.length}`;
    }
    on(cards, 'click', (e) => {
      const id = e.target && e.target.dataset && e.target.dataset.id;
      if (!id) return;
      const f = frames.find((x) => x.id === id);
      const dialogs = window.appDialogs;
      if (!dialogs || !dialogs.saveDisplaySettings) return;
      const wallpaper = R.renderShot(f, 1920, 1080).toDataURL('image/jpeg', 0.9);
      const saved = dialogs.saveDisplaySettings({ wallpaper, wallpaperMode: 'stretch' });
      if (dialogs.applyDisplaySettings) dialogs.applyDisplaySettings(saved || dialogs.getDisplaySettings());
      toast(t('bliss.wallpaperSet', frameName(f)));
    });
    const thumb = (f) => R.renderShot(f, 480, 270).toDataURL('image/jpeg', 0.86);
    for (const id of store.get(ALBUM_KEY, [])) {
      const f = frames.find((x) => x.id === id);
      if (f) { f.found = true; f.thumb = thumb(f); }
    }
    renderAlbum();
    const allFound = () => frames.every((f) => f.found);

    const seen = new Set();
    let hintTimer = 0;
    function hint(key, text, sec = 6, repeat = false) {
      if (seen.has(key) && !repeat) return;
      seen.add(key);
      $('hint').textContent = text;
      $('hint').classList.add('show');
      hintTimer = sec;
    }
    function toast(text) {
      const el = $('toast');
      el.textContent = text;
      el.classList.remove('show');
      void el.offsetWidth;
      el.classList.add('show');
    }
    const later = (fn, ms) => setTimeout(() => { if (!game.closed) fn(); }, ms);

    function capture(f) {
      f.found = true;
      f.thumb = thumb(f);
      audio.shutter();
      $('flash').classList.remove('go');
      void $('flash').offsetWidth;
      $('flash').classList.add('go');
      const pol = $('polaroid');
      pol.querySelector('img').src = f.thumb;
      pol.querySelector('span').textContent = frameName(f);
      pol.classList.remove('go');
      void pol.offsetWidth;
      pol.classList.add('go');
      renderAlbum();
      store.set(ALBUM_KEY, frames.filter((x) => x.found).map((x) => x.id));
      const n = frames.filter((x) => x.found).length;
      toast(t('bliss.toastFrame', frameName(f), n, frames.length));
      if (n === 1) later(() => hint('frames', t('bliss.hintFrames'), 8), 2200);
      if (allFound()) {
        later(() => {
          audio.chime();
          toast(t('bliss.albumDone'));
          goldenTarget = 1;
        }, 2000);
      }
    }

    function crossed(f, a, b) {
      const { f: n, r, u } = cameraBasis(f.yaw, f.pitch, 0);
      const sa = v3.dot(v3.sub(a, f.pos), n), sb = v3.dot(v3.sub(b, f.pos), n);
      if (sa * sb > 0 || sa === sb) return false;
      const q = v3.lerp(a, b, sa / (sa - sb)), d = v3.sub(q, f.pos);
      return Math.abs(v3.dot(d, r)) < f.w / 2 + 3 && Math.abs(v3.dot(d, u)) < f.h / 2 + 3;
    }

    const isTouch = matchMedia('(pointer: coarse)').matches;
    function lock() {
      if (isTouch) return;
      const refused = () => { if (!game.closed && state === 'flying') hint('click', t('bliss.hintClick'), 4, true); };
      try {
        const p = canvas.requestPointerLock();
        if (p && p.catch) p.catch(refused);
      } catch (e) { refused(); }
    }
    function takeOff() {
      if (state !== 'title') return;
      audio.start();
      state = 'flying';
      flyer.reset(TITLE);
      stage.classList.add('flying');
      lock();
      later(() => hint('steer', t('bliss.hintSteer')), 900);
      if (allFound()) goldenTarget = 1;
    }
    function pause(p) {
      if (p === (state === 'paused')) return;
      if (p) {
        resumeTo = state;
        state = 'paused';
        if (document.pointerLockElement === canvas) document.exitPointerLock();
      } else {
        state = resumeTo;
      }
      stage.classList.toggle('paused', p);
      audio.pause(p);
      if (!p && state === 'flying') lock();
    }
    function newFlight() {
      if (state === 'title') { takeOff(); return; }
      pause(false);
      if (state === 'title') { takeOff(); return; }
      flyer.reset(TITLE);
      toast(t('bliss.backHome'));
    }
    function toggleSound() { toast(audio.toggleMute() ? t('bliss.soundOff') : t('bliss.soundOn')); }
    function toggleHud() { hudHidden = !hudHidden; stage.classList.toggle('nohud', hudHidden); }

    input.onLockChange = (locked) => {
      if (locked) return;
      lockLostAt = performance.now();
      if (state === 'flying') pause(true);
    };
    on($('start'), 'click', takeOff);
    on(album, 'click', () => { if (state === 'flying') pause(true); });
    on($('resume'), 'click', () => pause(false));
    on(canvas, 'click', () => {
      if (state === 'title') takeOff();
      else if (state === 'flying' && !input.locked) lock();
    });
    on($('reset'), 'click', () => {
      window.winManager.openDialog({
        title: t('app.bliss'), icon: 'warning', message: t('bliss.resetConfirm'),
        buttons: [
          { text: t('btn.yes'), primary: true, onClick: () => {
            for (const f of frames) { f.found = false; f.thumb = null; f.alpha = 1; }
            store.set(ALBUM_KEY, []);
            goldenTarget = 0;
            renderAlbum();
          } },
          { text: t('btn.no') },
        ],
      });
    });
    const vol = $('vol'), sens = $('sens'), inv = $('invert');
    vol.value = settings.vol;
    sens.value = settings.sens;
    inv.checked = settings.invert;
    const saveSettings = () => {
      Object.assign(settings, { vol: +vol.value, sens: +sens.value, invert: inv.checked });
      audio.setVolume(settings.vol);
      flyer.sens = settings.sens;
      flyer.invertY = settings.invert;
      store.set(SETTINGS_KEY, settings);
    };
    for (const el of [vol, sens, inv]) on(el, 'input', saveSettings);

    on(window, 'keydown', (e) => {
      if (!opts.isActive() || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.code === 'KeyM') toggleSound();
      if (e.code === 'KeyH') toggleHud();
      if (e.code === 'KeyF') opts.toggleMaximize();
      if (e.code === 'KeyR' && state === 'flying') { flyer.reset(TITLE); toast(t('bliss.backHome')); }
      if (e.code === 'F2') { e.preventDefault(); newFlight(); }
      if ((e.code === 'Enter' || e.code === 'Space') && state === 'title') { e.preventDefault(); takeOff(); }
      if (e.code === 'KeyP') pause(state !== 'paused');
      if (e.code === 'Escape' && performance.now() - lockLostAt > 400) { e.preventDefault(); pause(state !== 'paused'); }
    });

    let level = 1, frameAvg = 16, slowFor = 0, fastFor = 0;
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, QUALITY[level].dpr);
      canvas.width = Math.max(1, Math.round(stage.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(stage.clientHeight * dpr));
      Object.assign(R.quality, QUALITY[level]);
    }
    const sizeWatch = new ResizeObserver(resize);
    sizeWatch.observe(stage);
    on(signal, 'abort', () => sizeWatch.disconnect());
    resize();
    function adaptQuality(dtMs, dt) {
      frameAvg += (dtMs - frameAvg) * 0.05;
      slowFor = frameAvg > 24 ? slowFor + dt : 0;
      fastFor = frameAvg < 12.5 ? fastFor + dt : 0;
      if (slowFor > 2 && level < QUALITY.length - 1) { level++; slowFor = 0; resize(); }
      if (fastFor > 6 && level > 0) { level--; fastFor = 0; resize(); }
    }

    $('loading').textContent = '';
    stage.classList.add('ready');
    let last = performance.now();
    function frame(now) {
      if (game.closed) return;
      setRaf(requestAnimationFrame(frame));
      const dtMs = now - last;
      const dt = clamp(dtMs / 1000, 0, 0.05);
      last = now;
      if (state === 'flying' && !opts.isActive()) pause(true);
      if (opts.isMinimized()) return;
      const onTitle = state === 'title' || (state === 'paused' && resumeTo === 'title');
      golden += (goldenTarget - golden) * (1 - Math.exp(-dt * 0.08));
      R.update(dt, golden);
      if (state === 'flying') flyer.update(dt, input, sky.thermals);
      else input.consume();

      const aspect = canvas.width / canvas.height;
      let cam;
      if (onTitle) {
        const time = R.time;
        cam = makeCamera(TITLE.pos, TITLE.yaw + Math.sin(time * 0.05) * 0.012, TITLE.pitch + Math.sin(time * 0.07) * 0.006, 0, (50 * Math.PI) / 180, aspect);
      } else {
        cam = flyer.camera(aspect, R.time);
      }

      for (const f of frames) {
        if (onTitle) continue;
        if (f.found) { f.alpha = Math.max(0, f.alpha - dt * 0.6); continue; }
        f.alpha = Math.min(1, f.alpha + dt * 0.5);
        if (state === 'flying' && crossed(f, flyer.prev, flyer.pos)) capture(f);
      }

      R.renderCloudShadows();
      R.renderScene(cam, canvas.width, canvas.height, frames);

      const dens = R.cloudDensity(cam.pos);
      if (dens > 0.2 && inCloud <= 0.2 && state === 'flying') audio.whoosh();
      inCloud += (dens - inCloud) * (1 - Math.exp(-dt * 6));
      $('cloudfog').style.opacity = (inCloud * 0.85).toFixed(3);
      const speedK = onTitle ? 0 : smoothstep(25, 65, flyer.speed);
      $('vignette').style.opacity = (0.55 + 0.45 * speedK).toFixed(3);

      if (!onTitle) {
        const nearThermal = sky.thermals.some((th) => Math.hypot(flyer.pos[0] - th.x, flyer.pos[2] - th.z) < 400);
        audio.update(dt, { speed: flyer.speed, agl: flyer.agl, inCloud, lift: flyer.lift, bank: flyer.bank, nearThermal });
        $('readout').textContent = t('bliss.readout', Math.round(flyer.pos[1]), Math.round(flyer.speed * 3.6)) + (flyer.lift > 1 ? t('bliss.readoutLift', flyer.lift.toFixed(1)) : '');
        if (state === 'flying') {
          if (flyer.lift > 2) hint('thermal', t('bliss.hintThermal'), 7);
          if (R.time > 45 && flyer.maxSpeed < 32) hint('dive', t('bliss.hintDive'), 6);
          if (flyer.boundary > 0.05) hint('edge', t('bliss.hintEdge'), 4);
        }
      }
      if (hintTimer > 0) {
        hintTimer -= dt;
        if (hintTimer <= 0) $('hint').classList.remove('show');
      }
      adaptQuality(dtMs, dt);
    }
    setRaf(requestAnimationFrame(frame));

    Object.assign(game, {
      audio, R, flyer, frames, sky, takeOff, capture, newFlight, toggleSound, toggleHud,
      showAlbum() { pause(true); },
      setGolden(v) { golden = goldenTarget = v; },
    });
    Object.defineProperty(game, 'state', { get: () => state });
  }

  Object.assign(B, { start, ALBUM_KEY, SETTINGS_KEY });
})(globalThis.Bliss = globalThis.Bliss || {});
