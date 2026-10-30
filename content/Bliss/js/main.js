'use strict';
// Игра: состояния, кадры и альбом, подсказки, авто-качество, главный цикл.

(async function main() {
  const $ = (id) => document.getElementById(id);
  const canvas = $('gl');
  const gl = canvas.getContext('webgl2', { antialias: true, powerPreference: 'high-performance' });
  if (!gl) {
    $('loading').textContent = 'Нужен браузер с поддержкой WebGL 2.';
    return;
  }
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* приватный режим */ } },
  };
  const tick = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  const loading = (t) => { $('loading').textContent = t; };

  // ---------- генерация мира ----------
  loading('Поднимаем холмы…');
  await tick();
  buildHeightmap();
  loading('Раскатываем долину…');
  await tick();
  const chunks = buildTerrainChunks();
  const road = roadPolyline();
  const trees = buildTrees(road);
  const sky = buildSky();
  const frames = buildFrames(sky);
  const birds = buildBirds(sky.thermals);
  loading('Разводим облака…');
  await tick();
  const R = new Renderer(gl, { chunks, trees, sky, frames, birds, road });
  const audio = new Ambience();
  const input = new Input(canvas);
  const TITLE = { pos: [0, groundHeight(0, 140) + 6, 140], yaw: 0, pitch: 0.2 };
  const flyer = new Flyer(TITLE);

  const settings = Object.assign({ vol: 0.8, sens: 1, invert: false }, store.get('bliss-settings', {}));
  flyer.sens = settings.sens;
  flyer.invertY = settings.invert;
  audio.setVolume(settings.vol);

  let state = 'title';
  let golden = 0, goldenTarget = 0;
  let inCloud = 0, hudHidden = false;
  for (const f of frames) f.alpha = 0;

  // ---------- альбом ----------
  const album = $('album'), cards = $('cards');
  function renderAlbum() {
    album.innerHTML = '';
    cards.innerHTML = '';
    for (const f of frames) {
      const slot = document.createElement('div');
      slot.className = 'slot' + (f.found ? ' found' : '');
      slot.innerHTML = f.found ? `<img src="${f.thumb}" alt="">` : '?';
      album.appendChild(slot);
      const card = document.createElement('div');
      card.className = 'card' + (f.found ? ' found' : '');
      card.innerHTML = f.found
        ? `<img src="${f.thumb}" alt=""><b>${f.name}</b><button data-id="${f.id}">Сохранить обои 1920×1080</button>`
        : `<div class="empty">?</div><b>Не найден</b><i>${f.clue}</i>`;
      cards.appendChild(card);
    }
    $('count').textContent = `${frames.filter((f) => f.found).length} / ${frames.length}`;
  }
  cards.addEventListener('click', (e) => {
    const id = e.target?.dataset?.id;
    if (!id) return;
    const f = frames.find((x) => x.id === id);
    const cv = R.renderShot(f, 1920, 1080);
    cv.toBlob((b) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = `bezmyatezhnost-${f.id}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  });
  const thumb = (f) => R.renderShot(f, 480, 270).toDataURL('image/jpeg', 0.86);
  for (const id of store.get('bliss-album', [])) {
    const f = frames.find((x) => x.id === id);
    if (f) { f.found = true; f.thumb = thumb(f); }
  }
  renderAlbum();
  const allFound = () => frames.every((f) => f.found);

  // ---------- подсказки и тосты ----------
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

  function capture(f) {
    f.found = true;
    f.thumb = thumb(f);
    audio.shutter();
    $('flash').classList.remove('go');
    void $('flash').offsetWidth;
    $('flash').classList.add('go');
    const pol = $('polaroid');
    pol.querySelector('img').src = f.thumb;
    pol.querySelector('span').textContent = f.name;
    pol.classList.remove('go');
    void pol.offsetWidth;
    pol.classList.add('go');
    renderAlbum();
    store.set('bliss-album', frames.filter((x) => x.found).map((x) => x.id));
    const n = frames.filter((x) => x.found).length;
    toast(`Кадр «${f.name}» · ${n} из ${frames.length}`);
    if (n === 1) setTimeout(() => hint('frames', 'Золотые видоискатели — это кадры. Найдите все пять. Esc — альбом и подсказки.', 8), 2200);
    if (allFound()) {
      setTimeout(() => {
        audio.chime();
        toast('Альбом собран. Наступает золотой час…');
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

  // ---------- состояния ----------
  const isTouch = matchMedia('(pointer: coarse)').matches;
  function lock() {
    if (isTouch) return;
    try {
      const p = canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    } catch { /* повторный захват слишком быстро после Esc */ }
  }
  function takeOff() {
    if (state !== 'title') return;
    audio.start();
    state = 'flying';
    flyer.reset(TITLE);
    document.body.classList.add('flying');
    lock();
    setTimeout(() => hint('steer', 'Мышь — направление полёта · W — взмах · S — тормоз'), 900);
    if (allFound()) goldenTarget = 1;
  }
  function pause(p) {
    if (state === 'title') return;
    state = p ? 'paused' : 'flying';
    document.body.classList.toggle('paused', p);
    audio.pause(p);
    if (!p) lock();
  }
  input.onLockChange = (locked) => {
    if (!locked && state === 'flying') pause(true);
  };
  $('start').addEventListener('click', takeOff);
  // На сенсорном экране альбом в углу открывает паузу (Esc там нет).
  album.addEventListener('click', () => { if (state === 'flying') pause(true); });
  $('resume').addEventListener('click', () => pause(false));
  canvas.addEventListener('click', () => {
    if (state === 'title') takeOff();
    else if (state === 'paused') pause(false);
    else if (!input.locked) lock();
  });
  $('reset').addEventListener('click', () => {
    if (!confirm('Стереть найденные кадры?')) return;
    for (const f of frames) { f.found = false; f.thumb = null; f.alpha = 1; }
    store.set('bliss-album', []);
    goldenTarget = 0;
    renderAlbum();
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
    store.set('bliss-settings', settings);
  };
  for (const el of [vol, sens, inv]) el.addEventListener('input', saveSettings);

  addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') toast(audio.toggleMute() ? 'Звук выключен' : 'Звук включён');
    if (e.code === 'KeyH') { hudHidden = !hudHidden; document.body.classList.toggle('nohud', hudHidden); }
    if (e.code === 'KeyF') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    }
    if (e.code === 'KeyR' && state === 'flying') { flyer.reset(TITLE); toast('Снова у холма'); }
    if ((e.code === 'Enter' || e.code === 'Space') && state === 'title') takeOff();
    if (e.code === 'KeyP' && state !== 'title') pause(state === 'flying');
  });

  // ---------- размер и авто-качество ----------
  const levels = [
    { dpr: 1.5, grassNear: 320, grassFar: 100 },
    { dpr: 1.0, grassNear: 260, grassFar: 80 },
    { dpr: 0.8, grassNear: 170, grassFar: 60 },
    { dpr: 0.65, grassNear: 110, grassFar: 40 },
  ];
  let level = 1, frameAvg = 16, slowFor = 0, fastFor = 0;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, levels[level].dpr);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    Object.assign(R.quality, levels[level]);
  }
  addEventListener('resize', resize);
  resize();
  function adaptQuality(dtMs, dt) {
    frameAvg += (dtMs - frameAvg) * 0.05;
    slowFor = frameAvg > 24 ? slowFor + dt : 0;
    fastFor = frameAvg < 12.5 ? fastFor + dt : 0;
    if (slowFor > 2 && level < levels.length - 1) { level++; slowFor = 0; resize(); }
    if (fastFor > 6 && level > 0) { level--; fastFor = 0; resize(); }
  }

  // ---------- главный цикл ----------
  $('loading').textContent = '';
  document.body.classList.add('ready');
  let last = performance.now();
  function frame(now) {
    const dtMs = now - last;
    const dt = Math.min(0.05, dtMs / 1000);
    last = now;
    golden += (goldenTarget - golden) * (1 - Math.exp(-dt * 0.08));
    R.update(dt, golden);
    if (state === 'flying') flyer.update(dt, input, sky.thermals);
    else input.consume();

    const aspect = canvas.width / canvas.height;
    let cam;
    if (state === 'title') {
      const t = R.time;
      cam = makeCamera(TITLE.pos, TITLE.yaw + Math.sin(t * 0.05) * 0.012, TITLE.pitch + Math.sin(t * 0.07) * 0.006, 0, (50 * Math.PI) / 180, aspect);
    } else {
      cam = flyer.camera(aspect, R.time);
    }

    for (const f of frames) {
      if (state === 'title') continue;
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
    const speedK = state === 'title' ? 0 : smoothstep(25, 65, flyer.speed);
    $('vignette').style.opacity = (0.55 + 0.45 * speedK).toFixed(3);

    if (state !== 'title') {
      const nearThermal = sky.thermals.some((t) => Math.hypot(flyer.pos[0] - t.x, flyer.pos[2] - t.z) < 400);
      audio.update(dt, { speed: flyer.speed, agl: flyer.agl, inCloud, lift: flyer.lift, bank: flyer.bank, nearThermal });
      $('readout').textContent = `${Math.round(flyer.pos[1])} м · ${Math.round(flyer.speed * 3.6)} км/ч` + (flyer.lift > 1 ? ` · поток ↑ ${flyer.lift.toFixed(1)} м/с` : '');
      if (state === 'flying') {
        if (flyer.lift > 2) hint('thermal', 'Восходящий поток! Кружите в нём, чтобы подняться к облакам.', 7);
        if (R.time > 45 && flyer.maxSpeed < 32) hint('dive', 'Нырните со склона вниз — так набирается скорость.', 6);
        if (flyer.boundary > 0.05) hint('edge', 'Ветер возвращает вас в долину.', 4);
      }
    }
    if (hintTimer > 0) {
      hintTimer -= dt;
      if (hintTimer <= 0) $('hint').classList.remove('show');
    }
    adaptQuality(dtMs, dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__bliss = { R, flyer, frames, sky, get state() { return state; }, takeOff, capture, setGolden(v) { golden = goldenTarget = v; } };
})().catch((e) => {
  console.error(e);
  const el = document.getElementById('loading');
  if (el) el.textContent = 'Ошибка: ' + e.message;
});
