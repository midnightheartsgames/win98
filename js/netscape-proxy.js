/**
 * Netscape 6 "Web 1.0 Gateway"
 * -----------------------------------------------------------
 * Серверная часть браузера Netscape 6 для Win 98 Clone.
 *
 * Скачивает настоящие страницы из интернета и переписывает их
 * в стилистике веба 1998 года: Times New Roman, серый фон,
 * таблицы вместо сеток, <hr>, счётчик посещений, бегущая строка
 * и "Best viewed at 800x600".
 *
 * Маршруты:
 *   GET /netscape/page?url=<abs>   -> HTML страницы в стиле Web 1.0
 *   GET /netscape/img?url=<abs>    -> проксированная картинка
 *
 * Зависимостей нет: только встроенные модули Node.js и global fetch.
 */

const dns = require('dns').promises;
const net = require('net');
const renderer = require('./netscape-renderer');

// Многие сайты отдают пустую страницу древнему UA, поэтому
// наружу представляемся современным браузером, а ретро-дух
// оставляем в самой отрисовке.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const FETCH_TIMEOUT_MS = 15000;
const MAX_HTML_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/* ------------------------------------------------------------------ */
/* Безопасность: не даём ходить во внутреннюю сеть                      */
/* ------------------------------------------------------------------ */

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    if (p[0] === 10) return true;
    if (p[0] === 127) return true;
    if (p[0] === 0) return true;
    if (p[0] === 169 && p[1] === 254) return true;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const low = ip.toLowerCase();
    if (low === '::1' || low === '::') return true;
    if (low.startsWith('fc') || low.startsWith('fd')) return true;
    if (low.startsWith('fe80')) return true;
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
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Поддерживаются только http:// и https://');
  }
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) {
    throw new Error('Доступ к локальной сети запрещён');
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('Доступ к локальной сети запрещён');
    return u;
  }
  try {
    const records = await dns.lookup(host, { all: true });
    if (records.some((r) => isPrivateIp(r.address))) {
      throw new Error('Доступ к локальной сети запрещён');
    }
  } catch (e) {
    if (/локальной/.test(e.message)) throw e;
    throw new Error('Не удалось найти сервер ' + host);
  }
  return u;
}

async function fetchRemote(url, accept) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: accept,
        'Accept-Language': 'ru,en;q=0.8'
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Декодирование                                                       */
/* ------------------------------------------------------------------ */

function detectCharset(contentType, buffer) {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType || '');
  if (fromHeader) return fromHeader[1].toLowerCase();
  const head = buffer.slice(0, 4096).toString('latin1');
  const meta =
    /<meta[^>]+charset=["']?([\w-]+)/i.exec(head) ||
    /<meta[^>]+content=["'][^"']*charset=([\w-]+)/i.exec(head);
  return meta ? meta[1].toLowerCase() : 'utf-8';
}

function decodeBody(buffer, contentType) {
  const charset = detectCharset(contentType, buffer);
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch (e) {
    return buffer.toString('utf-8');
  }
}

/* ------------------------------------------------------------------ */
/* HTML -> Web 1.0                                                     */
/* ------------------------------------------------------------------ */

const VOID_TAGS = new Set(['br', 'hr', 'img', 'input']);

// Что во что превращаем. null = выкинуть тег вместе с содержимым.
const TAG_MAP = {
  p: 'p', br: 'br', hr: 'hr',
  h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
  ul: 'ul', ol: 'ol', li: 'li', dl: 'dl', dt: 'dt', dd: 'dd',
  blockquote: 'blockquote', pre: 'pre',
  a: 'a', img: 'img',
  b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u', mark: 'b',
  code: 'tt', kbd: 'tt', samp: 'tt', var: 'i',
  cite: 'i', dfn: 'i', q: 'q', small: 'small', sup: 'sup', sub: 'sub',
  table: 'table', thead: 'tbody', tbody: 'tbody', tfoot: 'tbody',
  tr: 'tr', td: 'td', th: 'th', caption: 'caption',
  center: 'center', figure: 'div', figcaption: 'i',
  div: 'div', section: 'div', article: 'div', main: 'div',
  header: 'div', span: 'span', li_: 'li',
  form: 'form', input: 'input'
};

// Теги, вырезаемые вместе с содержимым
const DROP_WITH_CONTENT = [
  'script', 'style', 'noscript', 'svg', 'iframe', 'template', 'head',
  'button', 'select', 'textarea', 'canvas', 'video', 'audio',
  'object', 'embed', 'map', 'dialog', 'picture'
];

function stripBlocks(html, tags) {
  let out = html;
  tags.forEach((tag) => {
    const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi');
    let prev;
    do {
      prev = out;
      out = out.replace(re, ' ');
    } while (out !== prev);
    // незакрытые
    out = out.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), ' ');
  });
  return out;
}

function parseAttrs(raw) {
  const attrs = {};
  const re = /([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m;
  while ((m = re.exec(raw))) {
    const value = m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : m[5];
    attrs[m[1].toLowerCase()] = value;
  }
  return attrs;
}

function decodeEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absolutize(href, base) {
  try {
    return unwrapRedirect(new URL(decodeEntities(href), base).href);
  } catch (e) {
    return null;
  }
}

/**
 * Поисковики оборачивают ссылки в свои JS-редиректы
 * (duckduckgo.com/l/?uddg=..., google.com/url?q=...).
 * Такая «прокладка» без JavaScript открывается пустой,
 * поэтому сразу достаём настоящий адрес.
 */
function unwrapRedirect(href) {
  let u;
  try {
    u = new URL(href);
  } catch (e) {
    return href;
  }
  const host = u.hostname.replace(/^www\./, '');
  let inner = null;
  if (/duckduckgo\.com$/.test(host) && u.pathname === '/l/') {
    inner = u.searchParams.get('uddg');
  } else if (/^google\./.test(host) && u.pathname === '/url') {
    inner = u.searchParams.get('q') || u.searchParams.get('url');
  } else if (host === 'youtube.com' && u.pathname === '/redirect') {
    inner = u.searchParams.get('q');
  } else if (/bing\.com$/.test(host) && u.pathname === '/ck/a') {
    const b = u.searchParams.get('u');
    if (b && b.startsWith('a1')) {
      try {
        inner = Buffer.from(b.slice(2).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
      } catch (e) {}
    }
  } else if (host === 'l.facebook.com' || (host === 'vk.com' && u.pathname === '/away.php')) {
    inner = u.searchParams.get('u') || u.searchParams.get('to');
  }
  if (inner && /^https?:\/\//i.test(inner)) return unwrapRedirect(inner);
  return href;
}

function proxiedPage(url) {
  return '/netscape/page?url=' + encodeURIComponent(url);
}

function proxiedImage(url) {
  return '/netscape/img?url=' + encodeURIComponent(url);
}

function pickImageSrc(attrs) {
  const candidates = [
    attrs.src,
    attrs['data-src'],
    attrs['data-original'],
    attrs['data-lazy-src']
  ];
  for (const c of candidates) {
    if (c && !/^data:/i.test(c) && c.trim()) return c.trim();
  }
  const srcset = attrs.srcset || attrs['data-srcset'];
  if (srcset) {
    const first = srcset.split(',')[0].trim().split(/\s+/)[0];
    if (first && !/^data:/i.test(first)) return first;
  }
  return null;
}

/**
 * Основной конвертер: современная разметка -> разметка 1998 года.
 */
function rewriteMarkup(bodyHtml, baseUrl) {
  const out = [];
  const stack = [];
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let last = 0;
  let m;
  let getForms = 0; // глубина вложенности GET-форм

  const pushText = (text) => {
    if (!text) return;
    const cleaned = text.replace(/[ \t\r\n]+/g, ' ');
    if (!cleaned.trim() && !/ /.test(cleaned)) return;
    out.push(cleaned);
  };

  while ((m = tagRe.exec(bodyHtml))) {
    pushText(bodyHtml.slice(last, m.index));
    last = tagRe.lastIndex;

    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    const mapped = TAG_MAP[name];

    if (!mapped) {
      // неизвестный тег (в т.ч. веб-компоненты ytd-*, x-*) -> прозрачный,
      // но оставляем пробел, чтобы соседние слова не слипались
      out.push(' ');
      continue;
    }

    if (VOID_TAGS.has(mapped)) {
      if (closing) continue;
      const attrs = parseAttrs(m[3]);
      if (mapped === 'input') {
        const field = rewriteInput(attrs, getForms > 0);
        if (field) out.push(field);
        continue;
      }
      if (mapped === 'img') {
        const raw = pickImageSrc(attrs);
        const abs = raw ? absolutize(raw, baseUrl) : null;
        if (!abs || !/^https?:/i.test(abs)) continue;
        const alt = escapeHtml(decodeEntities(attrs.alt || ''));
        out.push(`<img src="${escapeHtml(proxiedImage(abs))}" alt="${alt}" border="0">`);
      } else {
        out.push(`<${mapped}>`);
      }
      continue;
    }

    if (closing) {
      const idx = stack.lastIndexOf(mapped === 'form' ? 'form' : mapped);
      if (idx === -1) continue;
      while (stack.length > idx) {
        const tag = stack.pop();
        if (tag === 'form') getForms--;
        out.push(`</${tag}>`);
      }
      continue;
    }

    const attrs = parseAttrs(m[3]);

    if (mapped === 'form') {
      // Работают только GET-формы (поиск). Отправка идёт через шлюз.
      const method = (attrs.method || 'get').toLowerCase();
      const action = absolutize(attrs.action || baseUrl, baseUrl);
      if (method !== 'get' || getForms > 0 || !action || !/^https?:/i.test(action)) continue;
      out.push(
        '<form class="ns-form" action="/netscape/form" method="get">' +
        `<input type="hidden" name="__ns_action" value="${escapeHtml(action)}">`
      );
      stack.push('form');
      getForms++;
      continue;
    }

    let open = `<${mapped}`;

    if (mapped === 'a') {
      const abs = attrs.href ? absolutize(attrs.href, baseUrl) : null;
      if (abs && /^https?:/i.test(abs)) {
        open += ` href="${escapeHtml(proxiedPage(abs))}" title="${escapeHtml(abs)}"`;
      } else if (abs && /^mailto:/i.test(abs)) {
        open += ` href="${escapeHtml(abs)}"`;
      } else {
        open += ' href="#"';
      }
    }
    open += '>';
    out.push(open);
    stack.push(mapped);
  }
  pushText(bodyHtml.slice(last));
  while (stack.length) out.push(`</${stack.pop()}>`);

  return tidy(out.join(''));
}

function rewriteInput(attrs, inForm) {
  if (!inForm) return '';
  const type = (attrs.type || 'text').toLowerCase();
  const name = attrs.name ? escapeHtml(decodeEntities(attrs.name)) : '';
  const value = escapeHtml(decodeEntities(attrs.value || ''));
  if (['text', 'search', 'email', 'number', 'url', 'tel'].includes(type)) {
    if (!name) return '';
    const hint = escapeHtml(decodeEntities(attrs.placeholder || attrs['aria-label'] || ''));
    return `<input type="text" name="${name}" value="${value}" size="30" title="${hint}">`;
  }
  if (type === 'hidden') {
    return name ? `<input type="hidden" name="${name}" value="${value}">` : '';
  }
  if (type === 'submit') {
    return `<input type="submit" value="${value || 'Искать!'}">`;
  }
  return '';
}

function tidy(html) {
  let prev;
  let out = html;
  do {
    prev = out;
    // пустые контейнеры
    out = out.replace(
      /<(p|li|div|span|b|i|u|tt|h[1-6]|blockquote|td|th|tr|table|tbody|ul|ol|dl)>\s*(?:&nbsp;|\s)*<\/\1>/gi,
      ' '
    );
    // div/span без пользы — разворачиваем
    out = out.replace(/<span>([\s\S]*?)<\/span>/gi, '$1');
  } while (out !== prev);

  out = out.replace(/(<br>\s*){3,}/gi, '<br><br>');
  // У формы без кнопки дорисовываем классическую «Искать!»
  out = out.replace(/(<form class="ns-form"[\s\S]*?)(<\/form>)/gi, (all, inner, close) =>
    /type="text"/.test(inner)
      ? (/type="submit"/.test(inner) ? all : inner + ' <input type="submit" value="Искать!">' + close)
      : ''
  );
  // Ссылки, идущие подряд, разделяем как в старых навигационных панелях
  out = out.replace(/<\/a>\s*<a /gi, '</a> | <a ');
  out = out.replace(/\s{2,}/g, ' ');
  return out.trim();
}

/**
 * Выбираем осмысленную часть документа.
 */
function extractContent(html) {
  const pick = (tag) => {
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}\\s*>`, 'i');
    const found = re.exec(html);
    return found && found[1].length > 400 ? found[1] : null;
  };
  const article = pick('article') || pick('main');
  if (article) return article;
  const body = /<body\b[^>]*>([\s\S]*)<\/body\s*>/i.exec(html);
  return body ? body[1] : html;
}

/* ------------------------------------------------------------------ */
/* Украшательства в духе 1998                                          */
/* ------------------------------------------------------------------ */

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function hitCounter(url) {
  const digits = String(hash32(url) % 1000000).padStart(6, '0');
  return digits
    .split('')
    .map((d) => `<span class="ns-counter-digit">${d}</span>`)
    .join('');
}

const WEB1_CSS = `
  body {
    background-color: #c0c0c0;
    background-image:
      repeating-linear-gradient(0deg, rgba(255,255,255,.35) 0 1px, transparent 1px 4px),
      repeating-linear-gradient(90deg, rgba(0,0,0,.06) 0 1px, transparent 1px 4px);
    color: #000000;
    font-family: "Times New Roman", Times, serif;
    font-size: 16px;
    margin: 0;
    padding: 8px;
  }
  a { color: #0000ee; }
  a:visited { color: #551a8b; }
  a:active { color: #ff0000; }
  a img { border: 2px solid #0000ee; }
  img { max-width: 92%; height: auto; image-rendering: pixelated; }
  h1, h2, h3, h4, h5, h6 {
    font-family: "Times New Roman", Times, serif;
    color: #000080;
    margin: 12px 0 6px;
  }
  h1 { font-size: 30px; }
  h2 { font-size: 24px; }
  h3 { font-size: 20px; }
  h4, h5, h6 { font-size: 17px; }
  hr { border: none; border-top: 2px groove #ffffff; margin: 10px 0; }
  pre, tt { font-family: "Courier New", Courier, monospace; font-size: 14px; }
  pre { background: #ffffff; border: 1px solid #808080; padding: 6px; overflow-x: auto; }
  blockquote {
    border-left: 4px solid #000080;
    margin: 8px 0 8px 12px;
    padding-left: 10px;
    font-style: italic;
  }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #808080; padding: 3px 5px; vertical-align: top; }
  .ns-shell { max-width: 780px; margin: 0 auto; }
  .ns-plate {
    background: #ffffff;
    border: 3px ridge #dfdfdf;
    padding: 10px 14px;
  }
  .ns-banner {
    background: #000080;
    color: #ffff00;
    border: 3px outset #8080ff;
    text-align: center;
    padding: 6px;
  }
  .ns-banner-title {
    font-size: 26px;
    font-weight: bold;
    letter-spacing: 1px;
    text-shadow: 2px 2px 0 #ff00ff;
  }
  .ns-banner-host { color: #00ff00; font-size: 13px; font-family: "Courier New", monospace; }
  .ns-marquee {
    background: #000000;
    color: #00ff00;
    font-family: "Courier New", monospace;
    font-size: 13px;
    border: 2px inset #808080;
    overflow: hidden;
    white-space: nowrap;
    padding: 2px 0;
  }
  .ns-marquee span { display: inline-block; padding-left: 100%; animation: ns-scroll 18s linear infinite; }
  @keyframes ns-scroll { to { transform: translateX(-100%); } }
  .ns-blink { animation: ns-blink 1s steps(1) infinite; color: #ff0000; font-weight: bold; }
  @keyframes ns-blink { 50% { opacity: 0; } }
  .ns-nav { text-align: center; font-size: 13px; padding: 4px 0; }
  .ns-nav a { margin: 0 6px; }
  .ns-footer { text-align: center; font-size: 13px; color: #000080; padding: 8px 0 20px; }
  .ns-counter-digit {
    display: inline-block;
    background: #000000;
    color: #00ff00;
    font-family: "Courier New", monospace;
    font-size: 16px;
    border: 1px solid #00ff00;
    padding: 0 3px;
    margin: 0 1px;
  }
  .ns-construction {
    display: inline-block;
    background: repeating-linear-gradient(45deg, #ffd700 0 8px, #000000 8px 16px);
    color: #ffffff;
    font-family: Arial, sans-serif;
    font-size: 11px;
    font-weight: bold;
    padding: 3px 8px;
    border: 2px outset #ffd700;
    text-shadow: 1px 1px 0 #000;
  }
  .ns-card td { border: 2px ridge #dfdfdf; background: #ffffe0; }
  .ns-card img { max-width: 100%; }
  .ns-jsnote { text-align: right; color: #808080; margin: 0; }
  .ns-form { display: inline; margin: 0; }
  .ns-form input[type=text] { font-family: "Courier New", monospace; font-size: 13px; border: 2px inset #808080; }
  .ns-form input[type=submit] { font-family: Arial, sans-serif; font-size: 12px; }
  .ns-error { background: #ffffff; border: 4px double #800000; padding: 14px; }
  .ns-error h1 { color: #800000; }
`;

function pageTemplate({ url, title, bodyHtml, extraNote }) {
  const u = new URL(url);
  const stamp = new Date().toLocaleDateString('ru-RU');
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="ns-url" content="${escapeHtml(url)}">
<meta name="ns-title" content="${escapeHtml(title)}">
<title>${escapeHtml(title)}</title>
<style>${WEB1_CSS}</style>
</head>
<body>
<div class="ns-shell">
  <div class="ns-banner">
    <div class="ns-banner-title">${escapeHtml(title)}</div>
    <div class="ns-banner-host">http://${escapeHtml(u.hostname)}${escapeHtml(u.pathname)}</div>
  </div>
  <div class="ns-marquee"><span>*** Добро пожаловать на ${escapeHtml(
    u.hostname
  )}! Страница оптимизирована для Netscape 6 при разрешении 800x600 *** Не забудьте расписаться в гостевой книге! ***</span></div>
  <div class="ns-nav">
    [ <a href="${escapeHtml(proxiedPage(u.origin + '/'))}">Home</a> ]
    [ <a href="#">Links</a> ]
    [ <a href="#">Guestbook</a> ]
    [ <a href="mailto:webmaster@${escapeHtml(u.hostname)}">E-Mail</a> ]
    <span class="ns-blink">NEW!</span>
  </div>
  <hr>
  ${extraNote || ''}
  <div class="ns-plate">
${bodyHtml}
  </div>
  <hr>
  <div class="ns-footer">
    <div class="ns-construction">UNDER CONSTRUCTION</div>
    <p>Вы посетитель номер:<br>${hitCounter(url)}</p>
    <p>Последнее обновление: ${escapeHtml(stamp)}<br>
    Best viewed with <b>Netscape 6</b> at 800x600<br>
    &copy; 1998&ndash;1999 ${escapeHtml(u.hostname)}. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;
}

function errorPage(url, message) {
  return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="ns-url" content="${escapeHtml(url || 'about:blank')}">
<meta name="ns-title" content="Ошибка соединения">
<title>Ошибка соединения</title><style>${WEB1_CSS}</style></head>
<body><div class="ns-shell"><div class="ns-error">
<h1>Сервер не отвечает</h1>
<p>Netscape не может открыть <tt>${escapeHtml(url || '')}</tt></p>
<p><b>Причина:</b> ${escapeHtml(message)}</p>
<hr>
<p>Проверьте подключение к сети и правильность адреса.<br>
Возможно, сервер перегружен или временно недоступен.</p>
</div></div></body></html>`;
}

/* ------------------------------------------------------------------ */
/* Сборка страницы                                                     */
/* ------------------------------------------------------------------ */

// Сайты, которые без JavaScript заведомо пустые
const JS_ONLY_HOSTS = /(^|\.)(youtube\.com|youtu\.be|twitter\.com|x\.com|instagram\.com|tiktok\.com|twitch\.tv|reddit\.com|vk\.com|ok\.ru|dzen\.ru|music\.yandex\.ru|spotify\.com|discord\.com|figma\.com|notion\.so|pinterest\.com|threads\.net)$/i;

// Меньше этого количества символов текста — считаем страницу недорисованной
const SPARSE_TEXT = 900;

function textLength(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().length;
}

function readMetas(html) {
  const metas = {};
  const re = /<meta\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(html))) {
    const a = parseAttrs(m[1]);
    const key = (a.property || a.name || '').toLowerCase();
    if (key && a.content) metas[key] = decodeEntities(a.content);
  }
  return metas;
}

function youtubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m)\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const s = /^\/(shorts|embed|live)\/([\w-]{6,})/.exec(u.pathname);
      if (s) return s[2];
    }
  } catch (e) {}
  return null;
}

/**
 * Карточка «как в каталоге Yahoo! 1998»: картинка + заголовок + описание
 * из OpenGraph. Спасает страницы, где основной контент — видео/картинка.
 */
function metaCard(url, metas, title) {
  const vid = youtubeId(url);
  const image = metas['og:image'] || metas['twitter:image'] ||
    (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : '');
  const heading = metas['og:title'] || metas['twitter:title'] || title;
  const desc = metas['og:description'] || metas['description'] || metas['twitter:description'] || '';
  if (!image && !desc) return '';

  const imgAbs = image ? absolutize(image, url) : null;
  const imgTag = imgAbs
    ? `<img src="${escapeHtml(proxiedImage(imgAbs))}" alt="${escapeHtml(heading)}" border="1">`
    : '';
  const kind = vid ? '<b>[ ВИДЕОРОЛИК ]</b><br>' : '';
  const watch = vid
    ? `<p><a href="https://www.youtube.com/watch?v=${escapeHtml(vid)}" target="_blank">&gt;&gt; Смотреть ролик (откроется в новом окне)</a></p>`
    : '';
  return `<table class="ns-card" width="100%"><tr>
    ${imgTag ? `<td width="45%" align="center">${imgTag}</td>` : ''}
    <td>${kind}<h2>${escapeHtml(heading)}</h2>
      <p>${escapeHtml(desc).replace(/\n/g, '<br>')}</p>${watch}</td>
  </tr></table><hr>`;
}

/** Статическая загрузка + следование <meta http-equiv="refresh">. */
async function fetchStatic(target) {
  let url = target;
  for (let hop = 0; hop < 3; hop++) {
    const u = await assertPublicUrl(url);
    const res = await fetchRemote(u.href, 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5');
    const contentType = res.headers.get('content-type') || '';
    const finalUrl = res.url || u.href;

    if (!/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
      return { finalUrl, contentType, status: res.status, html: null };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_HTML_BYTES) throw new Error('Документ слишком велик');
    const html = decodeBody(buf, contentType);

    const refresh = /<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["']?\s*\d+\s*;\s*url=([^"'>]+)/i.exec(html);
    if (refresh) {
      const next = absolutize(refresh[1].trim(), finalUrl);
      if (next && next !== finalUrl && /^https?:/i.test(next)) {
        url = next;
        continue;
      }
    }
    return { finalUrl, contentType, status: res.status, html };
  }
  throw new Error('Слишком много перенаправлений');
}

/** HTML (статический или отрисованный) -> тело страницы Web 1.0. */
function convertDocument(html, pageUrl) {
  const baseTag = /<base\b[^>]*href=["']([^"']+)["']/i.exec(html);
  const baseUrl = baseTag ? absolutize(baseTag[1], pageUrl) || pageUrl : pageUrl;

  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = titleMatch
    ? decodeEntities(titleMatch[1]).replace(/\s+/g, ' ').trim().slice(0, 90)
    : '';

  let clean = html.replace(/<!--[\s\S]*?-->/g, ' ');
  clean = stripBlocks(clean, DROP_WITH_CONTENT);

  let content = extractContent(clean);
  if (content !== clean) content = stripBlocks(content, ['nav', 'aside', 'footer']);

  let body = rewriteMarkup(content, baseUrl);
  const text = textLength(body);

  // Поиск по сайту обычно живёт в шапке, которую мы отрезали, — возвращаем
  if (!/class="ns-form"/.test(body)) {
    const search = findSearchForm(clean, baseUrl);
    if (search) body = `<center><b>Поиск по сайту:</b> ${search}</center><hr>` + body;
  }
  return { title, body, text };
}

function findSearchForm(html, baseUrl) {
  const re = /<form\b[^>]*>[\s\S]*?<\/form\s*>/gi;
  let m;
  let fallback = null;
  while ((m = re.exec(html))) {
    const rewritten = rewriteMarkup(m[0], baseUrl);
    if (!/class="ns-form"/.test(rewritten) || !/type="text"/.test(rewritten)) continue;
    const form = /<form class="ns-form"[\s\S]*?<\/form>/.exec(rewritten)[0];
    if (/role=["']?search|search|poisk|find/i.test(m[0].slice(0, 400))) return form;
    if (!fallback) fallback = form;
  }
  return fallback;
}

/**
 * mode: 'auto'   — статика, а если пусто — рендеринг с JavaScript;
 *       'js'     — сразу рендеринг;
 *       'static' — только статика.
 */
async function buildPage(target, mode = 'auto') {
  target = unwrapRedirect(target);
  const u = await assertPublicUrl(target);

  let staticDoc = null;
  let finalUrl = u.href;
  let status = 200;
  let metas = {};

  const wantJs = mode === 'js' || (mode === 'auto' && JS_ONLY_HOSTS.test(u.hostname));

  // Метаданные (og:*) нужны и JS-сайтам, поэтому статику качаем почти всегда
  if (!(wantJs && renderer.isAvailable() && mode === 'js')) {
    try {
      const res = await fetchStatic(u.href);
      finalUrl = res.finalUrl;
      status = res.status;

      if (!res.html) {
        if (/^image\//i.test(res.contentType)) {
          return pageTemplate({
            url: finalUrl,
            title: u.pathname.split('/').pop() || u.hostname,
            bodyHtml: `<center><img src="${escapeHtml(proxiedImage(finalUrl))}" alt="image" border="0"></center>`
          });
        }
        throw new Error('Неподдерживаемый тип документа: ' + (res.contentType || 'unknown'));
      }
      metas = readMetas(res.html);
      staticDoc = convertDocument(res.html, finalUrl);
    } catch (e) {
      if (!wantJs || !renderer.isAvailable()) throw e;
    }
  }

  let doc = staticDoc;
  let renderedWithJs = false;
  let renderError = null;

  const needsJs =
    mode === 'js' ||
    (mode === 'auto' && (wantJs || !staticDoc || staticDoc.text < SPARSE_TEXT));

  if (needsJs && renderer.isAvailable()) {
    try {
      const snap = await renderer.render(finalUrl);
      // Браузер мог уйти редиректом куда угодно — снова проверяем адрес
      await assertPublicUrl(snap.url);
      const rendered = convertDocument(snap.html, snap.url);
      if (!doc || rendered.text > doc.text) {
        doc = rendered;
        finalUrl = snap.url;
        metas = Object.assign({}, metas, snap.metas || {});
        renderedWithJs = true;
      }
    } catch (e) {
      renderError = e.message;
    }
  }

  if (!doc) throw new Error(renderError || 'Страница не загрузилась');

  const title = doc.title || metas['og:title'] || new URL(finalUrl).hostname;
  let body = doc.body;
  let note = '';

  const card = metaCard(finalUrl, metas, title);
  if (card && (doc.text < SPARSE_TEXT * 2 || youtubeId(finalUrl))) body = card + body;

  if (!body.trim()) body = '<p><i>Документ пуст.</i></p>';

  if (textLength(body) < 120) {
    note = renderError
      ? `<p><b>Не удалось выполнить JavaScript:</b> ${escapeHtml(renderError)}</p>`
      : '<p><i>На этой странице почти нет текста.</i></p>';
  }
  if (status >= 400) note = `<p><b>Сервер вернул код ${status}.</b></p>` + note;
  if (renderedWithJs) {
    note += '<p class="ns-jsnote"><small>[ JavaScript выполнен движком Gecko ]</small></p>';
  }

  return pageTemplate({ url: finalUrl, title, bodyHtml: body, extraNote: note });
}

/* ------------------------------------------------------------------ */
/* HTTP-обработчик                                                     */
/* ------------------------------------------------------------------ */

function sendHtml(res, status, html) {
  const buf = Buffer.from(html, 'utf-8');
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store'
  });
  res.end(buf);
}

async function handlePage(res, target, mode) {
  try {
    sendHtml(res, 200, await buildPage(target, mode));
  } catch (err) {
    sendHtml(res, 200, errorPage(target, err.message || String(err)));
  }
}

async function handleImage(res, target) {
  try {
    await assertPublicUrl(target);
    const upstream = await fetchRemote(target, 'image/*,*/*;q=0.5');
    const type = upstream.headers.get('content-type') || '';
    if (!upstream.ok || !/^image\//i.test(type)) throw new Error('not an image');
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) throw new Error('too large');
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=600'
    });
    res.end(buf);
  } catch (e) {
    // Прозрачная заглушка 1x1, чтобы вёрстка не ломалась
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': gif.length });
    res.end(gif);
  }
}

/**
 * Возвращает true, если запрос обработан этим модулем.
 */
function handle(req, res) {
  const parsed = new URL(req.url, 'http://localhost');
  if (!parsed.pathname.startsWith('/netscape/')) return false;

  const target = parsed.searchParams.get('url') || '';

  if (parsed.pathname === '/netscape/page') {
    if (!target) {
      sendHtml(res, 200, errorPage('', 'Не указан адрес'));
      return true;
    }
    const mode = ['js', 'static'].includes(parsed.searchParams.get('mode'))
      ? parsed.searchParams.get('mode')
      : 'auto';
    handlePage(res, target, mode);
    return true;
  }

  if (parsed.pathname === '/netscape/form') {
    // Собираем адрес назначения из полей формы и отправляем на страницу
    const action = parsed.searchParams.get('__ns_action') || '';
    let dest;
    try {
      dest = new URL(action);
      if (!/^https?:$/.test(dest.protocol)) throw new Error('bad');
    } catch (e) {
      sendHtml(res, 200, errorPage(action, 'Некорректный адрес формы'));
      return true;
    }
    dest.search = '';
    parsed.searchParams.forEach((v, k) => {
      if (k !== '__ns_action') dest.searchParams.append(k, v);
    });
    res.writeHead(302, { Location: '/netscape/page?url=' + encodeURIComponent(dest.href) });
    res.end();
    return true;
  }

  if (parsed.pathname === '/netscape/img') {
    handleImage(res, target);
    return true;
  }

  sendHtml(res, 404, errorPage(target, 'Неизвестный маршрут шлюза'));
  return true;
}

module.exports = { handle, buildPage, rewriteMarkup, errorPage };
