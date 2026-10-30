(function () {
  'use strict';
  const bridge = window.Parohod98;
  const QUEUE_KEY = 'parohod98.probe.queue';
  const CAPS_KEY = 'parohod98.probe.caps';
  const RESULT_PREFIX = 'parohod98.probe.result.';
  const GAMES = [
    { id: 'serioussam', title: 'Serious Sam 98', minutes: 4 },
    { id: 'forza', title: 'Forza Horizon: Рига', minutes: 4 },
    { id: 'gtann', title: 'GTA: Нижний Сити', minutes: 7 }
  ];
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const device = (() => { try { return bridge ? JSON.parse(bridge.device()) : { browser: navigator.userAgent }; } catch (e) { return {}; } })();
  let countdown = null;

  const sceneIds = long => GAMES.map(g => g.id + (long ? '-long' : ''));
  const gameOf = scene => scene.replace(/-long$/, '');
  const results = () => {
    const out = {};
    for (const g of GAMES) for (const id of [g.id, g.id + '-long']) {
      const r = read(RESULT_PREFIX + id, null);
      if (r) out[id] = r;
    }
    return out;
  };

  function setStatus(html) { $('status').innerHTML = html; }

  function play(scene) {
    const q = 'probe=' + scene + (scene.endsWith('-long') ? '&long=1&dur=600' : '&dur=' + (window.PROBE_DUR || 60));
    if (bridge) bridge.play(gameOf(scene), q);
    else location.href = '../games/' + gameOf(scene) + '/index.html?' + q;
  }

  function startQueue(long) {
    const ids = sceneIds(long);
    for (const id of ids) localStorage.removeItem(RESULT_PREFIX + id);
    write(QUEUE_KEY, ids);
    next();
  }

  function stopQueue() {
    clearInterval(countdown);
    countdown = null;
    localStorage.removeItem(QUEUE_KEY);
    render();
  }

  function next() {
    const queue = read(QUEUE_KEY, []);
    if (!queue.length) { localStorage.removeItem(QUEUE_KEY); render(); return; }
    const scene = queue.shift();
    write(QUEUE_KEY, queue);
    play(scene);
  }

  function resumeQueue() {
    const queue = read(QUEUE_KEY, null);
    if (!queue) return;
    if (!queue.length) {
      localStorage.removeItem(QUEUE_KEY);
      render();
      setStatus('<b class="ok">Замер закончен.</b> Нажмите «Отправить замер».');
      return;
    }
    let left = 5;
    const tick = () => {
      setStatus('Следующая сцена: <b>' + esc(GAMES.find(g => g.id === gameOf(queue[0])).title) + '</b> через ' + left + ' с. «Назад» останавливает замер.');
      if (left-- <= 0) { clearInterval(countdown); countdown = null; next(); }
    };
    tick();
    countdown = setInterval(tick, 1000);
  }

  function takeCrash() {
    if (!bridge) return;
    const raw = bridge.lastCrash();
    if (!raw) return;
    let crash;
    try { crash = JSON.parse(raw); } catch (e) { return; }
    const m = /probe=([a-z0-9-]+)/.exec(crash.query || '');
    const scene = m ? m[1] : crash.game;
    const prev = read(RESULT_PREFIX + scene, {}) || {};
    write(RESULT_PREFIX + scene, Object.assign(prev, { scene, game: crash.game, crash }));
  }

  async function capabilities() {
    const caps = {};
    const c = document.createElement('canvas');
    const gl2 = c.getContext('webgl2');
    const gl = gl2 || document.createElement('canvas').getContext('webgl');
    caps.webgl2 = !!gl2;
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      caps.renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      caps.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (gl2) {
        caps.maxSamples = gl2.getParameter(gl2.MAX_SAMPLES);
        caps.floatTargets = !!gl2.getExtension('EXT_color_buffer_float');
      }
      caps.depthTexture = !!(gl2 || gl.getExtension('WEBGL_depth_texture'));
    }
    caps.gamepadApi = typeof navigator.getGamepads === 'function';
    caps.vibrate = typeof navigator.vibrate === 'function';
    caps.pointerLock = typeof document.body.requestPointerLock === 'function';
    caps.memoryApi = !!performance.memory;
    caps.heapLimitMB = performance.memory ? Math.round(performance.memory.jsHeapSizeLimit / 1048576) : null;
    try { const ac = new (window.AudioContext || window.webkitAudioContext)(); caps.audioWithoutGesture = ac.state; ac.close(); } catch (e) { caps.audioWithoutGesture = 'error'; }
    caps.speech = 'speechSynthesis' in window;
    if (caps.speech) {
      await new Promise(r => setTimeout(r, 1500));
      const voices = speechSynthesis.getVoices();
      caps.speechVoices = voices.length;
      caps.speechRussian = voices.some(v => /^ru/i.test(v.lang));
    }
    caps.orientation = await new Promise(res => {
      const t = setTimeout(() => { removeEventListener('deviceorientation', on); res(false); }, 3000);
      function on(e) { if (e.beta != null || e.gamma != null) { clearTimeout(t); removeEventListener('deviceorientation', on); res(true); } }
      addEventListener('deviceorientation', on);
    });
    caps.audioSeek = await new Promise(res => {
      const a = new Audio();
      const t = setTimeout(() => res('timeout'), 10000);
      a.preload = 'auto';
      a.addEventListener('loadedmetadata', () => { a.currentTime = Math.max(1, a.duration / 2); });
      a.addEventListener('seeked', () => { clearTimeout(t); res(a.currentTime > 1 ? 'ok' : 'no'); });
      a.addEventListener('error', () => { clearTimeout(t); res('error'); });
      a.src = '../games/gtann/content/radio/EMOTION.mp3';
    });
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    caps.safeArea = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(v => parseFloat(v) || 0);
    probe.remove();
    caps.viewport = [innerWidth, innerHeight];
    caps.dpr = devicePixelRatio;
    caps.storageKB = Math.round(Object.keys(localStorage).reduce((a, k) => a + k.length + (localStorage.getItem(k) || '').length, 0) * 2 / 1024);
    return caps;
  }

  const yesNo = v => v === true ? '<span class="ok">да</span>' : v === false ? '<span class="bad">нет</span>' : esc(v);

  function render() {
    const res = results();
    const rows = [];
    for (const [id, r] of Object.entries(res)) {
      const title = esc((GAMES.find(g => g.id === gameOf(id)) || {}).title || id) + (id.endsWith('-long') ? ' · долгий' : '');
      const head = [];
      if (r.loadMenu != null) head.push('до меню ' + (r.loadMenu / 1000).toFixed(1) + ' с');
      if (r.loadPlay != null) head.push('до игры ' + (r.loadPlay / 1000).toFixed(1) + ' с');
      if (r.crash) head.push('<span class="bad">страница упала</span>');
      if (r.failed) head.push('<span class="bad">' + esc(r.failed) + '</span>');
      if (r.aborted) head.push('остановлено');
      if (r.partial && !r.crash) head.push('не закончено');
      rows.push('<tr><th colspan="5">' + title + ': ' + head.join(' · ') + '</th></tr>');
      for (const s of r.segments || []) rows.push('<tr><td>' + esc(s.name) + (s.heapAfter != null ? '<br><span class="dim">память JS ' + s.heapAfter + ' МБ</span>' : '') + '</td><td>' + (s.fps || 0) + ' к/с</td><td>95 %: ' + (s.p95 || 0) + ' мс</td><td>худшие 5 %: ' + (s.worst5 || 0) + ' мс</td><td>&gt;50 мс: ' + (s.long50 || 0) + (s.perMinute ? '<br>по минутам: ' + s.perMinute.join(', ') : '') + '</td></tr>');
    }
    $('scenes').innerHTML = rows.length ? '<table>' + rows.join('') + '</table>' : '<p class="dim">Пока пусто. Нажмите «Начать замер», положите телефон и подождите: игры запустятся по очереди сами. Сцены: ' + GAMES.map(g => esc(g.title) + ' (~' + g.minutes + ' мин)').join(', ') + '.</p>';
    const d = device;
    $('device').innerHTML = d.model ? '<table>' +
      [['Модель', d.maker + ' ' + d.model], ['Android', d.android + ' (SDK ' + d.sdk + ')'], ['Память', d.memory ? d.memory.totalMB + ' МБ, свободно ' + d.memory.availMB + ' МБ' : ''], ['Экран', d.widthPx + '×' + d.heightPx + ', ' + d.dpi + ' dpi'], ['WebView', d.webview], ['Приложение', d.app]]
        .map(([k, v]) => '<tr><th>' + k + '</th><td>' + esc(v) + '</td></tr>').join('') + '</table>' : '<p class="dim">' + esc(d.browser || '') + '</p>';
    const disp = Object.values(res).map(r => r.display).find(Boolean);
    const caps = read(CAPS_KEY, null);
    $('caps').innerHTML = !caps ? '<p class="dim">Проверяем...</p>' : '<table>' + [
      ['WebGL 2', yesNo(caps.webgl2)], ['Видеокарта', esc(caps.renderer)], ['Текстура, max', esc(caps.maxTexture)], ['MSAA, max', esc(caps.maxSamples)], ['Буферы RGBA16F', yesNo(caps.floatTargets)],
      ['Геймпад (Gamepad API)', yesNo(caps.gamepadApi)], ['Датчик наклона', yesNo(caps.orientation)], ['Вибрация', yesNo(caps.vibrate)], ['Голос (speechSynthesis)', caps.speech ? yesNo(true) + ', голосов ' + caps.speechVoices + ', русский: ' + yesNo(caps.speechRussian) : yesNo(false)],
      ['Перемотка радио (206)', esc(caps.audioSeek)], ['Звук без касания', esc(caps.audioWithoutGesture)], ['Pointer Lock', yesNo(caps.pointerLock)], ['Предел памяти JS', caps.heapLimitMB == null ? 'неизвестно' : caps.heapLimitMB + ' МБ'], ['Экран, CSS px', caps.viewport.join('×') + ', DPR ' + caps.dpr], ['Частота экрана в игре', disp ? disp.refresh + ' Гц (самая высокая ' + disp.fastest + ' Гц; режимы: ' + (disp.modes || []).join(', ') + ')' : 'после замера'], ['Вырез (верх, право, низ, лево)', caps.safeArea.join(', ')]
    ].map(([k, v]) => '<tr><th>' + k + '</th><td>' + v + '</td></tr>').join('') + '</table>';
    const running = !!read(QUEUE_KEY, null);
    $('run').disabled = $('long').disabled = running;
    if (!running && !countdown && !$('status').dataset.sent) setStatus(Object.keys(res).length ? 'Результаты ниже. «Отправить замер» пришлёт их разработчику.' : 'Телефон лучше держать заряженным, экран не гаснет сам.');
  }

  async function send() {
    const btn = $('send');
    btn.disabled = true;
    setStatus('Отправляем...');
    try {
      const all = { device, caps: read(CAPS_KEY, null), results: results() };
      const report = await BugReport.build({
        source: 'parohod98',
        user: { title: 'Замер Пароход 98: ' + (device.maker || '') + ' ' + (device.model || 'браузер'), text: 'Результаты замера игр на телефоне', kind: 'idea', repeat: 'once' },
        where: { summary: 'Пароход 98 > замер', window: '', app: 'probe' },
        apps: { probe: all }
      });
      const r = await BugReport.send(report, {});
      $('status').dataset.sent = '1';
      setStatus('<b class="ok">Отправлено:</b> ' + esc(r.id));
    } catch (e) {
      setStatus('<b class="bad">Не отправилось:</b> ' + esc(e.message) + '. Проверьте интернет и нажмите ещё раз.');
    }
    btn.disabled = false;
  }

  window.parohod98Back = () => {
    if (read(QUEUE_KEY, null) || countdown) { stopQueue(); setStatus('Замер остановлен.'); return true; }
    return false;
  };

  $('run').addEventListener('click', () => startQueue(false));
  $('long').addEventListener('click', () => startQueue(true));
  $('send').addEventListener('click', send);
  $('clear').addEventListener('click', () => {
    for (const k of Object.keys(localStorage)) if (k.startsWith(RESULT_PREFIX)) localStorage.removeItem(k);
    delete $('status').dataset.sent;
    render();
  });
  $('open').innerHTML = GAMES.map(g => '<button class="btn" data-game="' + g.id + '">' + esc(g.title) + '</button>').join('');
  $('open').addEventListener('click', e => {
    const id = e.target.dataset && e.target.dataset.game;
    if (!id) return;
    if (bridge) bridge.play(id, ''); else location.href = '../games/' + id + '/index.html';
  });

  takeCrash();
  render();
  resumeQueue();
  if (!read(CAPS_KEY, null) || !read(QUEUE_KEY, null)) capabilities().then(caps => { write(CAPS_KEY, caps); render(); });
})();
