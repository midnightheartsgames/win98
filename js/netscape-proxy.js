const dns = require('dns').promises;
const net = require('net');
const renderer = require('./netscape-renderer');
const { htmlSnapshot, readRefresh } = require('./netscape-html');
const web1 = require('./netscape-web1');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const FETCH_TIMEOUT_MS = 15000;
const MAX_HTML_BYTES = 6 * 1024 * 1024;
const MAX_TEXT_BYTES = 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 6;
const CACHE_LIMIT = 40;
const CACHE_TTL_MS = 10 * 60 * 1000;
const BLANK_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    if (p[0] === 10 || p[0] === 127 || p[0] === 0) return true;
    if (p[0] === 169 && p[1] === 254) return true;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true;
    if (p[0] >= 224) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const low = ip.toLowerCase();
    if (low === '::1' || low === '::') return true;
    if (low.startsWith('fc') || low.startsWith('fd') || low.startsWith('fe80')) return true;
    if (low.startsWith('::ffff:')) return isPrivateIp(low.slice(7));
    return false;
  }
  return false;
}

async function assertPublicUrl(target) {
  let u;
  try {
    u = new URL(target);
  } catch (e) {
    throw new Error('Некорректный адрес');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Поддерживаются только адреса http:// и https://');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (/^(localhost|.*\.localhost|.*\.local|.*\.internal|.*\.lan)$/i.test(host)) throw new Error('Доступ к локальной сети запрещён');
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('Доступ к локальной сети запрещён');
    return u;
  }
  let records;
  try {
    records = await dns.lookup(host, { all: true });
  } catch (e) {
    throw new Error('Не удалось найти сервер ' + host);
  }
  if (records.some((r) => isPrivateIp(r.address))) throw new Error('Доступ к локальной сети запрещён');
  return u;
}

function unwrapRedirect(href) {
  let u;
  try {
    u = new URL(href);
  } catch (e) {
    return href;
  }
  const host = u.hostname.replace(/^www\./, '');
  let inner = null;
  if (/duckduckgo\.com$/.test(host) && u.pathname === '/l/') inner = u.searchParams.get('uddg');
  else if (/^google\./.test(host) && u.pathname === '/url') inner = u.searchParams.get('q') || u.searchParams.get('url');
  else if (host === 'youtube.com' && u.pathname === '/redirect') inner = u.searchParams.get('q');
  else if (/bing\.com$/.test(host) && u.pathname === '/ck/a') {
    const b = u.searchParams.get('u');
    if (b && b.startsWith('a1')) {
      try {
        inner = Buffer.from(b.slice(2).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
      } catch (e) {}
    }
  } else if (host === 'l.facebook.com' || (host === 'vk.com' && u.pathname === '/away.php') || (host === 'away.vk.com')) {
    inner = u.searchParams.get('u') || u.searchParams.get('to');
  } else if (host === 't.me' && u.pathname === '/iv') {
    inner = u.searchParams.get('url');
  }
  if (inner && /^https?:\/\//i.test(inner)) return unwrapRedirect(inner);
  return href;
}

async function fetchPublic(target, { accept, referer, signal } = {}) {
  let url = target;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const onAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    let res;
    try {
      const headers = { 'User-Agent': USER_AGENT, Accept: accept || '*/*', 'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8' };
      if (referer) headers.Referer = referer;
      res = await fetch(url, { redirect: 'manual', signal: controller.signal, headers });
    } catch (e) {
      throw new Error(controller.signal.aborted ? 'Сервер не ответил вовремя' : 'Не удалось соединиться с ' + new URL(url).hostname);
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onAbort);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      if (res.body) res.body.cancel().catch(() => {});
      url = new URL(res.headers.get('location'), url).href;
      continue;
    }
    return { res, url };
  }
  throw new Error('Слишком много перенаправлений');
}

async function readLimited(res, limit) {
  const length = Number(res.headers.get('content-length') || 0);
  if (length && length > limit) {
    if (res.body) res.body.cancel().catch(() => {});
    throw new Error('Документ слишком велик');
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > limit) throw new Error('Документ слишком велик');
  return buf;
}

function detectCharset(contentType, buffer) {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType || '');
  if (fromHeader) return fromHeader[1].toLowerCase();
  const head = buffer.slice(0, 4096).toString('latin1');
  const meta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head) || /<meta[^>]+content=["'][^"']*charset=([\w-]+)/i.exec(head);
  return meta ? meta[1].toLowerCase() : 'utf-8';
}

function decodeBody(buffer, contentType) {
  try {
    return new TextDecoder(detectCharset(contentType, buffer)).decode(buffer);
  } catch (e) {
    return buffer.toString('utf-8');
  }
}

async function fetchDocument(target, signal) {
  let url = target;
  for (let hop = 0; hop < 3; hop++) {
    const { res, url: finalUrl } = await fetchPublic(url, { accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', signal });
    const type = (res.headers.get('content-type') || '').toLowerCase();
    const base = { url: finalUrl, status: res.status, type, lastModified: res.headers.get('last-modified') || '' };
    if (/text\/html|application\/xhtml/.test(type) || !type) {
      const html = decodeBody(await readLimited(res, MAX_HTML_BYTES), type);
      const refresh = readRefresh(html, finalUrl);
      if (refresh && refresh !== finalUrl && /^https?:/i.test(refresh)) {
        url = refresh;
        continue;
      }
      return Object.assign(base, { kind: 'html', html });
    }
    if (/^image\//.test(type)) {
      if (res.body) res.body.cancel().catch(() => {});
      return Object.assign(base, { kind: 'image' });
    }
    if (/^text\/(plain|css|csv|markdown)|application\/(json|xml)|text\/xml/.test(type)) {
      const text = decodeBody(await readLimited(res, MAX_TEXT_BYTES), type);
      return Object.assign(base, { kind: 'text', text });
    }
    if (res.body) res.body.cancel().catch(() => {});
    return Object.assign(base, { kind: 'file', size: Number(res.headers.get('content-length') || 0) });
  }
  throw new Error('Слишком много перенаправлений');
}

const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, hit);
  return hit.value;
}

function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value });
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
}

function readOptions(params) {
  const mode = params.get('mode');
  return {
    javascript: mode !== 'static',
    decorate: params.get('deco') !== '0',
    websafe: params.get('colors') !== 'full',
    reload: params.get('reload') === '1'
  };
}

async function loadSnapshot(target, opts, signal) {
  const key = (opts.javascript ? 'js|' : 'static|') + target;
  if (!opts.reload) {
    const hit = cacheGet(key);
    if (hit) return hit;
  }

  const renderAbort = new AbortController();
  const stopRender = () => renderAbort.abort();
  if (signal) signal.addEventListener('abort', stopRender, { once: true });

  const engine = renderer.isAvailable() ? renderer.engineName() : null;
  const docPromise = fetchDocument(target, signal).catch((error) => ({ kind: 'error', error }));
  const renderPromise = engine
    ? renderer.render(target, { javascript: opts.javascript, signal: renderAbort.signal }).catch((error) => ({ error }))
    : null;

  try {
    const doc = await docPromise;
    if (doc.kind === 'image' || doc.kind === 'text' || doc.kind === 'file') {
      renderAbort.abort();
      if (renderPromise) renderPromise.catch(() => {});
      const result = { special: doc };
      cacheSet(key, result);
      return result;
    }

    let renderError = null;
    if (renderPromise) {
      const snap = await renderPromise;
      if (snap && !snap.error && snap.tree) {
        await assertPublicUrl(snap.url);
        if (doc.kind === 'html') {
          snap.metas = Object.assign({}, htmlSnapshot(doc.html.slice(0, 200000), doc.url).metas, snap.metas || {});
          if (!snap.status) snap.status = doc.status;
          if (!snap.lastModified && doc.lastModified) snap.lastModified = doc.lastModified;
        }
        snap.engine = opts.javascript ? 'gecko-js' : 'gecko';
        const result = { snap };
        cacheSet(key, result);
        return result;
      }
      renderError = snap && snap.error ? snap.error : new Error('Движок отрисовки не вернул страницу');
      if (renderError.aborted) throw renderError;
    }

    if (doc.kind === 'html') {
      const snap = htmlSnapshot(doc.html, doc.url);
      snap.status = doc.status;
      snap.lastModified = doc.lastModified;
      snap.engine = 'static';
      snap.renderError = renderError ? renderError.message : null;
      const result = { snap };
      cacheSet(key, result);
      return result;
    }
    throw (doc.error || renderError || new Error('Страница не загрузилась'));
  } finally {
    if (signal) signal.removeEventListener('abort', stopRender);
  }
}

function gatewayNotes(snap, opts) {
  const notes = [];
  if (snap.engine === 'gecko-js') notes.push('Страница отрисована движком Gecko, JavaScript выполнен');
  else if (snap.engine === 'gecko') notes.push('Страница отрисована движком Gecko, JavaScript отключён');
  else if (snap.renderError) notes.push('Движок Gecko недоступен: ' + snap.renderError + '. Показан исходный HTML');
  else if (opts.javascript) notes.push('Движок Gecko не найден. Показан исходный HTML');
  if (snap.truncated) notes.push('Страница слишком длинная и показана не полностью');
  return notes;
}

async function buildPage(target, options = {}, signal) {
  const opts = Object.assign({ javascript: true, decorate: true, websafe: true, reload: false }, options);
  const url = unwrapRedirect(String(target || '').trim());
  await assertPublicUrl(url);
  const result = await loadSnapshot(url, opts, signal);

  if (result.special) {
    const doc = result.special;
    if (doc.kind === 'image') return web1.imageDocument(doc.url, undefined, { websafeImages: opts.websafe });
    if (doc.kind === 'text') return web1.textDocument(doc.url, doc.text);
    return web1.fileDocument(doc.url, { type: doc.type, size: doc.size });
  }

  const snap = result.snap;
  const notes = gatewayNotes(snap, opts);
  if (snap.status >= 400) notes.unshift('Сервер вернул код ' + snap.status);
  return web1.transcode(snap, {
    decorate: opts.decorate,
    websafe: opts.websafe,
    notes
  });
}

function sendHtml(res, status, html) {
  if (res.headersSent || res.destroyed) return;
  const buf = Buffer.from(html, 'utf-8');
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store'
  });
  res.end(buf);
}

async function handlePage(req, res, target, opts) {
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) abort.abort();
  });
  try {
    sendHtml(res, 200, await buildPage(target, opts, abort.signal));
  } catch (err) {
    if (abort.signal.aborted) return;
    sendHtml(res, 200, web1.errorDocument(target, err.message || String(err)));
  }
}

function sendBlank(res) {
  if (res.headersSent || res.destroyed) return;
  res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': BLANK_GIF.length, 'Cache-Control': 'no-store' });
  res.end(BLANK_GIF);
}

async function handleImage(res, target, referer) {
  try {
    let ref = '';
    try {
      ref = referer ? new URL(referer).origin + '/' : '';
    } catch (e) {}
    const { res: upstream } = await fetchPublic(target, { accept: 'image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5', referer: ref });
    const type = (upstream.headers.get('content-type') || '').toLowerCase();
    if (!upstream.ok || !/^image\//.test(type)) {
      if (upstream.body) upstream.body.cancel().catch(() => {});
      throw new Error('not an image');
    }
    const buf = await readLimited(upstream, MAX_IMAGE_BYTES);
    if (res.headersSent || res.destroyed) return;
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=3600',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(buf);
  } catch (e) {
    sendBlank(res);
  }
}

function handleForm(res, params) {
  const action = params.get('__ns_action') || '';
  let dest;
  try {
    dest = new URL(action);
    if (!/^https?:$/.test(dest.protocol)) throw new Error('bad');
  } catch (e) {
    sendHtml(res, 200, web1.errorDocument(action, 'Некорректный адрес формы'));
    return;
  }
  dest.search = '';
  dest.hash = '';
  params.forEach((value, key) => {
    if (key !== '__ns_action') dest.searchParams.append(key, value);
  });
  res.writeHead(302, { Location: '/netscape/page?url=' + encodeURIComponent(dest.href) });
  res.end();
}

function handle(req, res) {
  const parsed = new URL(req.url, 'http://localhost');
  if (!parsed.pathname.startsWith('/netscape/')) return false;
  const params = parsed.searchParams;
  const target = params.get('url') || '';

  if (parsed.pathname === '/netscape/page') {
    if (!target) sendHtml(res, 200, web1.errorDocument('', 'Не указан адрес'));
    else handlePage(req, res, target, readOptions(params));
    return true;
  }
  if (parsed.pathname === '/netscape/form') {
    handleForm(res, params);
    return true;
  }
  if (parsed.pathname === '/netscape/img') {
    if (!target) sendBlank(res);
    else handleImage(res, target, params.get('ref') || '');
    return true;
  }
  if (parsed.pathname === '/netscape/status') {
    const body = JSON.stringify({ engine: renderer.engineName(), cached: cache.size });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(body);
    return true;
  }
  sendHtml(res, 404, web1.errorDocument(target, 'Неизвестный адрес шлюза'));
  return true;
}

module.exports = { handle, buildPage, isPrivateIp, assertPublicUrl, unwrapRedirect, readOptions };
