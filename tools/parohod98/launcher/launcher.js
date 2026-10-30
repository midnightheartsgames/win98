(function () {
  'use strict';
  const L = window.LauncherState;
  const bridge = window.Parohod98 && window.Parohod98.state ? window.Parohod98 : null;
  const t = L.texts(navigator.language);
  const $ = id => document.getElementById(id);
  const TOUCH_KEY = 'parohod98.touch';
  const READ_KEY = 'parohod98.read';
  const TOUCH_DEFAULTS = { opacity: 0.55, scale: 1, left: false, vibrate: true };
  const from = new URLSearchParams(location.search).get('from') || '';
  const progress = {};
  const notes = {};
  let S = null;
  let device = {};
  let notesData = {};
  let crash = null;
  let listState = '';
  let afterNotify = null;
  let fileFor = null;
  let view = { name: 'library' };
  let taps = 0;
  let tapTimer = 0;
  const webgl2 = (() => {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return false;
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return true;
    } catch (e) {
      return false;
    }
  })();

  document.documentElement.lang = L.language(navigator.language);
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);

  function h(tag, props, children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') el.setAttribute('style', v);
      else if (k.startsWith('on')) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of [].concat(children || [])) if (c !== null && c !== undefined && c !== false) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    return el;
  }

  function storage(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  const catalogGames = () => (S && S.catalog && S.catalog.games) || {};
  const entryOf = id => catalogGames()[id];
  const gameOf = id => (S && S.games && S.games[id]) || {};
  const titleOf = id => (entryOf(id) ? entryOf(id).title : id);
  const partsOf = id => ((gameOf(id).installed && gameOf(id).installed.parts) || []).slice();
  const ctx = () => ({ t, S, progress, notes, crash, webgl2, device });
  const posterOf = id => L.poster(id, entryOf(id), gameOf(id), ctx());
  const picture = (sha, ext) => '/pic/' + sha + '.' + ext;

  function read() {
    if (!bridge) return;
    try {
      S = JSON.parse(bridge.state());
    } catch (e) {
      S = null;
    }
  }

  function readNotes() {
    if (!bridge || !bridge.notes) return;
    try {
      notesData = JSON.parse(bridge.notes()) || {};
    } catch (e) {
      notesData = {};
    }
  }

  function refresh() {
    read();
    render();
  }

  function dialog(text, buttons) {
    $('dialog-text').textContent = text;
    const box = $('dialog-buttons');
    box.textContent = '';
    for (const [label, fn, main] of buttons) {
      box.appendChild(h('button', { type: 'button', class: main ? 'main' : '', text: label, onclick: () => {
        $('dialog').hidden = true;
        if (fn) fn();
      } }));
    }
    $('dialog').hidden = false;
  }

  function startDownload(id, parts) {
    delete notes[id];
    if (crash && crash.game === id) crash = null;
    const go = () => bridge.download(id, parts, '');
    if (bridge.notifications() === 'ask') {
      afterNotify = go;
      dialog(t('askNotify'), [[t('understood'), () => bridge.askNotifications(), true]]);
      return;
    }
    go();
  }

  function act(id, action) {
    if (!bridge) return;
    if (action === 'download') startDownload(id, '');
    else if (action === 'update' || action === 'repair') startDownload(id, partsOf(id).join(','));
    else if (action === 'resume') {
      delete notes[id];
      bridge.resume(id);
    } else if (action === 'pause') bridge.pause(id);
    else if (action === 'cancel') bridge.cancel(id);
    else if (action === 'apk') go({ name: 'settings' });
    else if (action === 'play') {
      if (crash && crash.game === id) crash = null;
      bridge.play(id, '');
    }
  }

  function mainButton(p, extraClass) {
    if (!p || !p.main) return null;
    const b = h('button', { type: 'button', class: 'main' + (p.bar !== null ? ' progress' : '') + (extraClass ? ' ' + extraClass : ''), disabled: p.main.disabled, onclick: () => act(p.id, p.main.act) }, h('span', { text: p.main.label }));
    if (p.bar !== null) b.style.setProperty('--p', Math.round(p.bar * 100) + '%');
    return b;
  }

  function go(next) {
    view = next;
    render();
    $('view').scrollTop = 0;
  }

  function lastPlayed() {
    return from || (S && S.last) || '';
  }

  function footerText() {
    if (S.current) {
      const p = posterOf(S.current);
      if (p && p.state === 'downloading') {
        const pr = progress[S.current] || {};
        const parts = [t('footerDownload', { t: titleOf(S.current), a: L.size(pr.done || 0, t), b: L.size(pr.total || 0, t) })];
        if (p.speed) parts.push(L.size(p.speed, t) + t('perSecond'));
        if (p.eta) parts.push(p.eta);
        return { text: parts.join(' · '), gold: false };
      }
    }
    if (listState) return { text: listState, gold: true };
    const any = Object.values(S.games || {}).some(g => g.installed);
    if (!any) return { text: t('firstRun'), gold: false };
    return { text: '', gold: false };
  }

  function renderLibrary(root) {
    const banner = apkBanner();
    if (banner) root.appendChild(banner);
    root.classList.toggle('with-banner', !!banner);
    const ids = L.order(S);
    const shelf = h('div', { class: 'shelf' });
    const last = lastPlayed();
    for (const id of ids) {
      const p = posterOf(id);
      if (!p) continue;
      const e = entryOf(id);
      const shot = e && e.shots && e.shots[0];
      const frame = h('button', { type: 'button', class: 'frame', 'aria-label': titleOf(id), onclick: () => go({ name: 'page', id }) },
        shot ? h('img', { src: picture(shot.sha256, 'jpg'), alt: '' }) : h('div', { class: 'placeholder' }, h('img', { src: e && e.icon ? picture(e.icon, 'png') : 'icon.png', alt: '' })));
      shelf.appendChild(h('article', { class: 'poster' + (id === last ? ' last' : ''), 'data-id': id }, [
        frame,
        h('div', { class: 'name', text: titleOf(id) }),
        h('div', { class: 'line' + (['error', 'space', 'damaged', 'crashed', 'apk', 'unsupported'].includes(p.state) ? ' alert' : ''), text: p.line }),
        mainButton(p) || h('button', { type: 'button', class: 'main', disabled: true }, h('span', { text: t('play') }))
      ]));
    }
    const empty = !shelf.children.length;
    if (empty) shelf.appendChild(h('p', { class: 'empty', text: S.checking ? t('loadingList') : listState || t('noList') }));
    const f = empty ? { text: '', gold: false } : footerText();
    root.appendChild(shelf);
    root.appendChild(h('div', { class: 'footer' + (f.gold ? ' gold' : ''), id: 'footer', text: f.text }));
  }

  function openFull(id, index) {
    const e = entryOf(id);
    const box = $('full');
    box.textContent = '';
    for (const s of e.shots) box.appendChild(h('figure', {}, [h('img', { src: picture(s.sha256, 'jpg'), alt: s.caption || '' }), h('figcaption', { text: s.caption || '' })]));
    box.onclick = () => closeFull();
    box.hidden = false;
    box.scrollLeft = index * box.clientWidth;
  }

  function closeFull() {
    $('full').hidden = true;
    $('full').textContent = '';
  }

  function askRemove(id) {
    const inst = gameOf(id).installed;
    const hasSaves = Object.keys(L.readSaves(id, localStorage)).length > 0;
    dialog(t('removeAsk', { t: titleOf(id), s: L.size(inst ? inst.bytes : 0, t) }), [
      [t('remove'), () => bridge.remove(id), true],
      hasSaves ? [t('removeAll'), () => { L.writeSaves(id, {}, localStorage); bridge.remove(id); }] : null,
      [t('cancel'), null]
    ].filter(Boolean));
  }

  function renderSaves(root) {
    const id = view.id, keys = L.readSaves(id, localStorage), count = Object.keys(keys).length;
    const inst = gameOf(id).installed;
    const button = (label, fn, cls, off) => h('button', { type: 'button', class: cls || '', text: label, disabled: off, onclick: fn });
    root.appendChild(h('div', { class: 'page-top' }, [
      h('button', { type: 'button', class: 'backlink quiet', text: '‹ ' + titleOf(id), onclick: () => go({ name: 'page', id }) }),
      h('h1', { class: 'heading', text: t('saves') })
    ]));
    root.appendChild(h('div', { class: 'saves' }, [
      h('p', { class: 'saves-size', text: count ? t('savesSize', { s: L.size(L.savesSize(keys), t), n: count }) : t('savesNone') }),
      view.note ? h('p', { class: 'saves-note', id: 'saves-note', text: view.note }) : null,
      h('div', { class: 'row' }, [
        button(t('saveToFile'), () => bridge.saveFile(L.saveFileName(id, new Date()), L.packSaves(id, keys, inst ? inst.version : '', new Date())), 'main', !count),
        button(t('loadFromFile'), () => { fileFor = id; bridge.openFile(); })
      ]),
      h('p', { class: 'hint', text: t('savesPc') }),
      h('p', { class: 'hint', text: t('savesNote') }),
      h('div', { class: 'row' }, button(t('deleteSaves'), () => dialog(t('savesDeleteAsk', { t: titleOf(id) }), [
        [t('deleteSaves'), () => { L.writeSaves(id, {}, localStorage); go({ name: 'saves', id, note: t('savesDeleted') }); }, true],
        [t('cancel'), null]
      ]), '', !count))
    ]));
  }

  function loadFile(id, text) {
    const r = L.parseSaves(id, text);
    if (r.error) {
      const other = r.game && entryOf(r.game) ? entryOf(r.game).title : r.game;
      go({ name: 'saves', id, note: t(r.error, { t: other }) });
      return;
    }
    const m = Object.keys(L.readSaves(id, localStorage)).length, n = Object.keys(r.keys).length;
    const apply = () => go({ name: 'saves', id, note: L.writeSaves(id, r.keys, localStorage) ? t('savesLoaded', { n }) : t('fileFull') });
    if (!m) return apply();
    dialog(t('savesLoadAsk', { t: titleOf(id), n, m }), [[t('savesReplace'), apply, true], [t('cancel'), null]]);
  }

  function radioButtons(id, e) {
    const out = [];
    const inst = gameOf(id).installed;
    if (!inst || !e || gameOf(id).job) return out;
    for (const [name, part] of Object.entries(e.parts || {})) {
      if (partsOf(id).includes(name)) {
        out.push(h('button', { type: 'button', text: t('radioRemove'), onclick: () => dialog(t('removeRadioAsk', { t: e.title, s: L.size(part.bytes, t) }), [[t('remove'), () => bridge.removePart(id, name), true], [t('cancel'), null]]) }));
      } else {
        out.push(h('button', { type: 'button', text: t('radio', { s: L.size(part.download, t) }), onclick: () => startDownload(id, partsOf(id).concat(name).join(',')) }));
      }
    }
    return out;
  }

  function renderPage(root) {
    const id = view.id;
    const e = entryOf(id);
    const g = gameOf(id);
    const p = posterOf(id);
    if (!p) return go({ name: 'library' });
    const shots = (e && e.shots) || [];
    const caption = h('div', { class: 'caption' });
    const setCaption = i => {
      const s = shots[i];
      caption.textContent = s ? t('shotOf', { i: i + 1, n: shots.length }) + (s.caption ? ' · ' + s.caption : '') : '';
    };
    const strip = h('div', { class: 'strip' }, shots.map((s, i) => h('img', { src: picture(s.sha256, 'jpg'), alt: s.caption || '', onclick: () => openFull(id, i) })));
    strip.onscroll = () => setCaption(Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth)));
    setCaption(0);
    const inst = g.installed;
    const meta = [];
    if (inst) {
      meta.push(t('meta', { v: inst.version, s: L.size(inst.bytes, t) }));
    } else if (e) meta.push(t('meta', { v: e.version, s: L.size(e.download, t) }));
    for (const part of Object.values((e && e.parts) || {})) meta.push(t('metaRadio', { s: L.size(part.download, t) }));
    const info = h('div', { class: 'info' }, [
      e && e.genre ? h('div', { class: 'genre', text: e.genre }) : null,
      e && e.tags && e.tags.length ? h('div', { class: 'tags' }, e.tags.map(x => h('span', { text: x }))) : null,
      h('div', { class: 'desc', text: e ? e.desc || e.subtitle || '' : '' }),
      ...L.warnings(e, ctx()).map(w => h('div', { class: 'warn', text: t(w) })),
      h('div', { class: 'line', text: meta.join(' · ') })
    ]);
    const side = h('div', { class: 'side' });
    for (const x of p.extra) if (x.act !== 'cancel') side.appendChild(h('button', { type: 'button', text: x.label, onclick: () => act(id, x.act) }));
    side.appendChild(h('button', { type: 'button', text: t('saves'), onclick: () => go({ name: 'saves', id }) }));
    if (notesData[id]) side.appendChild(h('button', { type: 'button', text: t('notesOf'), onclick: () => go({ name: 'news', game: id }) }));
    for (const b of radioButtons(id, e)) side.appendChild(b);
    if (g.job && p.extra.some(x => x.act === 'cancel')) side.appendChild(h('button', { type: 'button', text: t('cancel'), onclick: () => act(id, 'cancel') }));
    if (inst && !g.job) {
      side.appendChild(h('button', { type: 'button', text: t('verify'), onclick: () => bridge.verify(id) }));
      side.appendChild(h('button', { type: 'button', text: t('remove'), onclick: () => askRemove(id) }));
    }
    const primary = h('div', { class: 'primary' }, [
      h('div', { class: 'line' + (['error', 'space', 'damaged', 'crashed', 'apk', 'unsupported'].includes(p.state) ? ' alert' : ''), id: 'page-line', text: p.line }),
      mainButton(p)
    ]);
    root.appendChild(h('div', { class: 'page' }, [
      h('div', { class: 'page-top' }, [
        h('button', { type: 'button', class: 'backlink quiet', text: '‹ ' + t('back'), onclick: () => go({ name: 'library' }) }),
        h('h1', { class: 'heading', text: titleOf(id) })
      ]),
      h('div', { class: 'page-body' }, [h('div', { class: 'gallery' }, [strip, caption]), info]),
      h('div', { class: 'actions' }, [side, primary])
    ]));
  }

  function readSet() {
    return new Set(storage(READ_KEY, []));
  }

  function newsEntries() {
    const list = L.notesList(notesData, S, t);
    if (list.length && storage(READ_KEY, null) === null) save(READ_KEY, list.map(n => n.key));
    return list;
  }

  function unreadCount() {
    const seen = readSet();
    return newsEntries().filter(n => !seen.has(n.key)).length;
  }

  function renderNews(root) {
    const list = newsEntries();
    root.appendChild(h('h1', { class: 'heading', text: t('news').replace('­', '') }));
    if (!list.length) {
      root.appendChild(h('p', { class: 'empty', text: t('noNotes') }));
      return;
    }
    const seen = readSet();
    let pick = list.find(n => n.key === view.key) || (view.game && list.find(n => n.game === view.game)) || list.find(n => !seen.has(n.key)) || list[0];
    if (!seen.has(pick.key)) {
      seen.add(pick.key);
      save(READ_KEY, [...seen]);
    }
    const side = h('div', { class: 'news-list' }, list.map(n => h('button', { type: 'button', class: (n === pick ? 'on' : '') + (seen.has(n.key) ? '' : ' unread'), onclick: () => go({ name: 'news', key: n.key }) }, [
      h('span', { class: 'who', text: n.who + ' ' + n.version }),
      h('span', { class: 'when', text: n.date })
    ])));
    const text = h('article', { class: 'news-text' }, [
      h('h2', { text: pick.title }),
      pick.summary ? h('p', { class: 'summary', text: pick.summary.charAt(0).toUpperCase() + pick.summary.slice(1) }) : null,
      ...pick.sections.map(s => h('section', {}, [h('h3', { text: s.title }), h('ul', {}, (s.items || []).map(i => h('li', { text: i })))])),
      pick.fixed.length ? h('section', {}, [h('h3', { text: t('fixed') }), h('ul', {}, pick.fixed.map(i => h('li', { text: typeof i === 'string' ? i : i.text || '' })))]) : null
    ]);
    root.appendChild(h('div', { class: 'news' }, [side, text]));
  }

  function touchPrefs() {
    return Object.assign({}, TOUCH_DEFAULTS, storage(TOUCH_KEY, {}));
  }

  function setTouch(key, value) {
    const p = touchPrefs();
    p[key] = value;
    save(TOUCH_KEY, p);
  }

  function toggle(label, key) {
    const b = h('button', { type: 'button', class: 'toggle' }, [h('span', { text: label }), h('b', { text: touchPrefs()[key] ? t('on') : t('off') })]);
    b.onclick = () => {
      setTouch(key, !touchPrefs()[key]);
      b.lastChild.textContent = touchPrefs()[key] ? t('on') : t('off');
      if (key === 'vibrate' && touchPrefs().vibrate && bridge && bridge.vibrate) bridge.vibrate(30);
    };
    return b;
  }

  function slider(label, key, min, max, step) {
    const out = h('output', { text: Math.round(touchPrefs()[key] * 100) + ' %' });
    const input = h('input', { type: 'range', min, max, step, value: touchPrefs()[key], 'aria-label': label });
    input.oninput = () => {
      setTouch(key, Number(input.value));
      out.textContent = Math.round(Number(input.value) * 100) + ' %';
    };
    return h('div', { class: 'field' }, [h('span', { class: 'label', text: label }), h('div', { class: 'slider' }, [input, out])]);
  }

  function apkStep() {
    const entry = S.catalog && S.catalog.apk;
    if (!entry || !S.app || entry.versionCode <= S.app.versionCode) return null;
    const u = S.app.update || {};
    const v = entry.versionName;
    if (u.state === 'downloading') return { line: t('apkDownloading', { v, a: L.size(u.done || 0, t), b: L.size(u.total || entry.bytes, t) }), label: t('cancel'), fn: () => bridge.cancelApk() };
    if (u.state === 'ready') return { line: t('apkReady', { v }), label: t('apkInstallNow'), fn: () => bridge.installApk(), main: true };
    if (u.state === 'permission') return { line: t('apkPermission'), label: t('apkSettings'), fn: () => bridge.openInstallSettings(), main: true };
    if (u.state === 'installing' || u.state === 'waiting') return { line: t('apkInstalling') };
    if (u.state === 'error') return { line: t('apkError', { d: u.detail || '' }), label: t('retry'), fn: () => bridge.downloadApk(), main: true };
    return { line: t('apkAvailable', { v, s: L.size(entry.bytes, t) }), label: t('apkUpdate'), fn: () => bridge.downloadApk(), main: true };
  }

  function apkBlock() {
    const box = h('div', { id: 'apk' });
    const step = apkStep();
    const line = text => box.appendChild(h('p', { class: 'apk-line', text }));
    const button = (label, fn, main) => box.appendChild(h('div', { class: 'row' }, h('button', { type: 'button', class: main ? 'main' : '', text: label, onclick: fn })));
    if (!step) {
      line(S.checking ? t('checkingNow') : listState || t('upToDate'));
      button(t('checkUpdate'), () => { bridge.check(); refresh(); });
      return box;
    }
    line(step.line);
    if (step.label) button(step.label, step.fn, step.main);
    return box;
  }

  function apkBanner() {
    const step = apkStep();
    if (!step) return null;
    return h('div', { class: 'banner' }, [
      h('img', { src: 'icon.png', alt: '' }),
      h('span', { class: 'apk-line', text: step.line }),
      step.label ? h('button', { type: 'button', class: step.main ? 'main' : '', text: step.label, onclick: step.fn }) : null
    ]);
  }

  function renderSettings(root) {
    root.appendChild(h('h1', { class: 'heading', text: t('settings').replace('­', '') }));
    const mobile = h('div', { class: 'choice' }, [['ask', 'mobileAsk'], ['always', 'mobileAlways'], ['never', 'mobileNever']].map(([mode, key]) => h('button', { type: 'button', class: S.mobile === mode ? 'on' : '', text: t(key), onclick: () => { bridge.setMobile(mode); refresh(); } })));
    const known = L.order(S).filter(id => gameOf(id).installed || Object.keys(L.readSaves(id, localStorage)).length);
    const spaceLine = id => [gameOf(id).installed ? t('spaceFiles', { a: L.size(gameOf(id).installed.bytes, t) }) : '', t('spaceSaves', { b: L.size(L.savesSize(L.readSaves(id, localStorage)), t) })].filter(Boolean).join(' · ');
    const versionTap = h('button', { type: 'button', class: 'version-tap' }, [
      h('span', { text: t('app') + ' ' + S.app.versionName }),
      S.channel === 'test' ? h('span', { class: 'channel', text: ' · ' + t('channel') }) : null
    ]);
    versionTap.onclick = () => {
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { taps = 0; }, 1500);
      if (taps < 5) return;
      taps = 0;
      bridge.setChannel(S.channel === 'test' ? 'stable' : 'test');
      refresh();
    };
    const downloads = h('section', { class: 'group' }, [
      h('h2', { text: t('downloads') }),
      h('div', { class: 'field' }, [h('span', { class: 'label' }, [t('mobileData') + ' ', h('small', { text: '(' + t('mobileAsk').toLowerCase() + ': ' + t('mobileAskHint') + ')' })]), mobile])
    ]);
    const app = h('section', { class: 'group' }, [
      h('h2', { text: t('app') }),
      apkBlock(),
      window.Parohod98Report ? h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { type: 'button', text: t('report'), onclick: () => report() })) : null,
      h('h2', { text: t('about'), style: 'margin-top:12px' }),
      versionTap,
      h('p', { class: 'hint', text: t('aboutLine') })
    ]);
    const space = h('section', { class: 'group' }, [
      h('h2', { text: t('space') }),
      ...(known.length ? known.map(id => h('div', { class: 'rowline' }, [h('span', { text: titleOf(id) }), h('span', { text: spaceLine(id) })])) : [h('p', { class: 'hint', text: t('noGames') })]),
      h('div', { class: 'rowline' }, [h('span', { text: t('freeSpace') }), h('span', { text: L.size(S.free, t) })])
    ]);
    const controls = h('section', { class: 'group' }, [
      h('h2', { text: t('controls') }),
      toggle(t('vibrate'), 'vibrate'),
      toggle(t('lefty'), 'left'),
      slider(t('opacity'), 'opacity', 0.2, 0.9, 0.05),
      slider(t('buttonSize'), 'scale', 0.8, 1.4, 0.05),
      h('p', { class: 'hint', text: t('gamesControls') })
    ]);
    root.appendChild(h('div', { class: 'settings' }, [h('div', { class: 'column' }, [downloads, app, space]), h('div', { class: 'column' }, [controls])]));
  }

  function report() {
    const names = { library: t('back'), page: titleOf(view.id), saves: titleOf(view.id), news: t('news'), settings: t('settings') };
    window.Parohod98Report.open({
      app: 'launcher',
      where: () => ({ summary: 'Пароход 98 > ' + String(names[view.name] || view.name).replace('­', ''), view: view.name, game: view.id || '', version: S && S.app ? S.app.versionName : '', channel: S ? S.channel : '' }),
      state: () => ({ games: S ? S.games : {}, network: S ? S.network : '', free: S ? S.free : 0, device })
    });
  }

  function renderRail() {
    for (const tab of document.querySelectorAll('.tab')) tab.classList.toggle('on', tab.dataset.view === (view.name === 'page' || view.name === 'saves' ? 'library' : view.name));
    const n = S ? unreadCount() : 0;
    $('unread').hidden = !n;
    $('unread').textContent = n;
    const apk = S && S.catalog && S.catalog.apk;
    const settings = document.querySelector('.tab[data-view="settings"]');
    settings.classList.toggle('dot', !!(apk && S.app && apk.versionCode > S.app.versionCode));
  }

  function render() {
    const root = $('view');
    root.textContent = '';
    root.classList.remove('with-banner');
    if (!S) {
      root.appendChild(h('p', { class: 'empty', text: bridge ? t('noList') : t('outside') }));
      return;
    }
    renderRail();
    if (view.name === 'page') renderPage(root);
    else if (view.name === 'saves') renderSaves(root);
    else if (view.name === 'news') renderNews(root);
    else if (view.name === 'settings') renderSettings(root);
    else renderLibrary(root);
  }

  function updateProgress(id) {
    const p = posterOf(id);
    if (!p) return;
    const scope = view.name === 'page' && view.id === id ? $('view').querySelector('.primary') : view.name === 'library' ? $('view').querySelector('.poster[data-id="' + id + '"]') : null;
    if (!scope) return;
    const button = scope.querySelector('button.main');
    const line = scope.querySelector('.line');
    if (!button || !button.classList.contains('progress') || p.state !== 'downloading') return refresh();
    button.style.setProperty('--p', Math.round(p.bar * 100) + '%');
    if (line) line.textContent = p.line;
    const footer = $('footer');
    if (footer) footer.textContent = footerText().text;
  }

  window.parohod98ui = {
    state(id, state, detail) {
      if (state === 'error' && id) {
        const [code, ...rest] = String(detail).split(':');
        notes[id] = { code, detail: rest.join(':') };
      }
      if (state === 'verifying' && id) notes[id] = { text: 'checkingFiles' };
      if (state === 'queued' && id) delete notes[id];
      if (state === 'ready' || state === 'removed' || state === 'cancelled') {
        delete progress[id];
        delete notes[id];
      }
      if (state === 'notes') readNotes();
      refresh();
    },
    catalog() {
      listState = '';
      refresh();
    },
    offline(code, detail) {
      if (code === 'http' && /^404 /.test(detail || '')) listState = t('emptyChannel');
      else if (code === 'offline') listState = S && S.catalog ? t('offlineServer') : t('noList');
      else listState = t('checkFailed', { d: code });
      refresh();
    },
    progress(id, done, total, speed) {
      progress[id] = { done, total, speed };
      if (!S || S.current !== id) return refresh();
      updateProgress(id);
    },
    ask(id, parts, bytes) {
      const what = parts && parts.split(',').includes('radio') ? t('askMobileRadio', { t: titleOf(id) }) : titleOf(id);
      dialog(t('askMobile', { what, s: L.size(bytes, t) }), [[t('download'), () => bridge.download(id, parts, 'now'), true], [t('waitForWifi'), () => bridge.download(id, parts, 'wifi')]]);
    },
    notifications() {
      const f = afterNotify;
      afterNotify = null;
      if (f) f();
      refresh();
    },
    verified(id, list) {
      const damaged = JSON.parse(list);
      if (damaged.length) delete notes[id];
      else notes[id] = { text: 'filesOk' };
      refresh();
    },
    apk() {
      refresh();
    },
    fileSaved(ok) {
      if (ok === null || view.name !== 'saves') return;
      go({ name: 'saves', id: view.id, note: t(ok ? 'savesWritten' : 'savesWriteFailed') });
    },
    fileOpened(state) {
      const id = fileFor;
      fileFor = null;
      if (!id || state === 'none') return;
      if (state !== 'ok') {
        go({ name: 'saves', id, note: t(state === 'big' ? 'fileBig' : 'fileError') });
        return;
      }
      loadFile(id, bridge.takeFile());
    },
    apkProgress(done, total) {
      if (!S || !S.app) return;
      S.app.update = Object.assign({}, S.app.update, { state: 'downloading', done, total });
      const step = apkStep();
      const line = document.querySelector('.banner .apk-line, #apk .apk-line');
      if (line && step) line.textContent = step.line;
      else render();
    }
  };

  window.parohod98Back = () => {
    if (!$('dialog').hidden) {
      $('dialog').hidden = true;
      return true;
    }
    if (!$('full').hidden) {
      closeFull();
      return true;
    }
    if (view.name === 'saves') {
      go({ name: 'page', id: view.id });
      return true;
    }
    if (view.name !== 'library') {
      go({ name: 'library' });
      return true;
    }
    return false;
  };

  for (const tab of document.querySelectorAll('.tab')) tab.onclick = () => go({ name: tab.dataset.view });

  if (bridge) {
    try {
      device = JSON.parse(bridge.device()) || {};
    } catch (e) {
      device = {};
    }
    try {
      const c = bridge.lastCrash();
      crash = c ? JSON.parse(c) : null;
    } catch (e) {
      crash = null;
    }
    readNotes();
  }
  refresh();
  if (bridge) bridge.check();
})();
