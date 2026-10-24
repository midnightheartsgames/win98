const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'keygen', 'basefont', 'frame']);
const RAW_TAGS = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'svg', 'math', 'template']);
const SKIP_TAGS = new Set(['script', 'style', 'template', 'head', 'meta', 'link', 'title', 'base', 'basefont', 'canvas', 'audio', 'object', 'embed', 'param', 'source', 'track', 'map', 'area', 'datalist', 'dialog', 'svg', 'math', 'noembed', 'noframes', 'frameset', 'frame', 'wbr', 'col', 'colgroup']);
const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'center', 'dd', 'details', 'dir', 'div', 'dl', 'dt', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li',
  'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'tbody', 'thead', 'tfoot', 'tr', 'td', 'th',
  'caption', 'ul', 'summary', 'legend', 'listing', 'xmp', 'search'
]);
const P_CLOSERS = new Set([
  'address', 'article', 'aside', 'blockquote', 'center', 'details', 'dir', 'div', 'dl', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'menu', 'nav',
  'ol', 'p', 'pre', 'section', 'table', 'ul', 'li', 'dd', 'dt', 'listing', 'xmp', 'search'
]);
const P_BOUNDARY = ['td', 'th', 'table', 'button', 'caption'];
const LIST_BOUNDARY = ['ul', 'ol', 'menu', 'dir', 'td', 'th', 'table'];
const DL_BOUNDARY = ['dl', 'td', 'th', 'table'];
const CELL_BOUNDARY = ['tr', 'table'];
const ROW_BOUNDARY = ['table', 'thead', 'tbody', 'tfoot'];
const TABLE_TAGS = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption']);

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', copy: '\u00a9', reg: '\u00ae', trade: '\u2122',
  hellip: '\u2026', mdash: '\u2014', ndash: '\u2013', laquo: '\u00ab', raquo: '\u00bb', ldquo: '\u201c', rdquo: '\u201d',
  lsquo: '\u2018', rsquo: '\u2019', sbquo: '\u201a', bdquo: '\u201e', bull: '\u2022', middot: '\u00b7', times: '\u00d7',
  divide: '\u00f7', deg: '\u00b0', plusmn: '\u00b1', sup1: '\u00b9', sup2: '\u00b2', sup3: '\u00b3', frac12: '\u00bd',
  frac14: '\u00bc', frac34: '\u00be', euro: '\u20ac', pound: '\u00a3', yen: '\u00a5', cent: '\u00a2', sect: '\u00a7',
  para: '\u00b6', shy: '\u00ad', iexcl: '\u00a1', iquest: '\u00bf', larr: '\u2190', rarr: '\u2192', uarr: '\u2191',
  darr: '\u2193', harr: '\u2194', hearts: '\u2665', spades: '\u2660', clubs: '\u2663', diams: '\u2666',
  thinsp: '\u2009', ensp: '\u2002', emsp: '\u2003', zwnj: '\u200c', zwj: '\u200d', lrm: '\u200e', rlm: '\u200f',
  minus: '\u2212', prime: '\u2032', Prime: '\u2033', infin: '\u221e', ne: '\u2260', le: '\u2264', ge: '\u2265',
  asymp: '\u2248', micro: '\u00b5', ordf: '\u00aa', ordm: '\u00ba', not: '\u00ac', macr: '\u00af', acute: '\u00b4',
  cedil: '\u00b8', uml: '\u00a8', brvbar: '\u00a6', curren: '\u00a4', dagger: '\u2020', Dagger: '\u2021', permil: '\u2030',
  lsaquo: '\u2039', rsaquo: '\u203a', oline: '\u203e', numero: '\u2116', check: '\u2713',
  Agrave: '\u00c0', Aacute: '\u00c1', Acirc: '\u00c2', Atilde: '\u00c3', Auml: '\u00c4', Aring: '\u00c5', AElig: '\u00c6',
  Ccedil: '\u00c7', Egrave: '\u00c8', Eacute: '\u00c9', Ecirc: '\u00ca', Euml: '\u00cb', Igrave: '\u00cc', Iacute: '\u00cd',
  Icirc: '\u00ce', Iuml: '\u00cf', Ntilde: '\u00d1', Ograve: '\u00d2', Oacute: '\u00d3', Ocirc: '\u00d4', Otilde: '\u00d5',
  Ouml: '\u00d6', Oslash: '\u00d8', Ugrave: '\u00d9', Uacute: '\u00da', Ucirc: '\u00db', Uuml: '\u00dc', Yacute: '\u00dd',
  szlig: '\u00df', agrave: '\u00e0', aacute: '\u00e1', acirc: '\u00e2', atilde: '\u00e3', auml: '\u00e4', aring: '\u00e5',
  aelig: '\u00e6', ccedil: '\u00e7', egrave: '\u00e8', eacute: '\u00e9', ecirc: '\u00ea', euml: '\u00eb', igrave: '\u00ec',
  iacute: '\u00ed', icirc: '\u00ee', iuml: '\u00ef', ntilde: '\u00f1', ograve: '\u00f2', oacute: '\u00f3', ocirc: '\u00f4',
  otilde: '\u00f5', ouml: '\u00f6', oslash: '\u00f8', ugrave: '\u00f9', uacute: '\u00fa', ucirc: '\u00fb', uuml: '\u00fc',
  yacute: '\u00fd', yuml: '\u00ff', scaron: '\u0161', Scaron: '\u0160', oelig: '\u0153', OElig: '\u0152'
};
const LEGACY_ENTITIES = new Set(['amp', 'lt', 'gt', 'quot', 'nbsp', 'copy', 'reg']);

const NAMED_COLORS = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff', yellow: '#ffff00',
  navy: '#000080', maroon: '#800000', purple: '#800080', teal: '#008080', olive: '#808000', silver: '#c0c0c0',
  gray: '#808080', grey: '#808080', lime: '#00ff00', aqua: '#00ffff', cyan: '#00ffff', fuchsia: '#ff00ff',
  magenta: '#ff00ff', orange: '#ffa500', brown: '#a52a2a', pink: '#ffc0cb', gold: '#ffd700', darkblue: '#00008b',
  darkred: '#8b0000', darkgreen: '#006400', lightgray: '#d3d3d3', lightgrey: '#d3d3d3', darkgray: '#a9a9a9',
  whitesmoke: '#f5f5f5', beige: '#f5f5dc', ivory: '#fffff0', crimson: '#dc143c', indigo: '#4b0082', violet: '#ee82ee'
};

const SIZE_PX = [10, 10, 13, 16, 18, 24, 32, 48];
const HEADING_PX = { h1: 32, h2: 24, h3: 19, h4: 16, h5: 13, h6: 11 };

function decodeEntities(str) {
  if (!str || str.indexOf('&') === -1) return str || '';
  return str.replace(/&(#[xX][0-9a-fA-F]+;?|#\d+;?|[a-zA-Z][a-zA-Z0-9]*;?)/g, (match, body, offset, whole) => {
    const terminated = body.endsWith(';');
    const name = terminated ? body.slice(0, -1) : body;
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      if (!code || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch (e) {
        return match;
      }
    }
    if (terminated && ENTITIES[name] !== undefined) return ENTITIES[name];
    if (!terminated && LEGACY_ENTITIES.has(name)) {
      const next = whole[offset + match.length] || '';
      if (!/[=a-zA-Z0-9]/.test(next)) return ENTITIES[name];
    }
    return match;
  });
}

function parseAttributes(raw) {
  const attrs = {};
  const re = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase();
    if (attrs[name] !== undefined) continue;
    const value = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : '';
    attrs[name] = decodeEntities(value);
  }
  return attrs;
}

function findTagEnd(html, from) {
  let quote = null;
  let lastSignificant = '';
  for (let j = from; j < html.length; j++) {
    const ch = html[j];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if ((ch === '"' || ch === "'") && lastSignificant === '=') {
      quote = ch;
      continue;
    }
    if (ch === '>') return j;
    if (!/\s/.test(ch)) lastSignificant = ch;
  }
  return -1;
}

function parseHtml(html) {
  const source = String(html || '');
  const lower = source.toLowerCase();
  const root = { tag: '#root', attrs: {}, kids: [] };
  const doc = { root, title: '', metas: {}, base: '', bodyAttrs: {}, htmlAttrs: {}, refresh: '' };
  const stack = [root];
  const current = () => stack[stack.length - 1];

  const addText = (text) => {
    if (!text) return;
    const kids = current().kids;
    const decoded = decodeEntities(text);
    if (typeof kids[kids.length - 1] === 'string') kids[kids.length - 1] += decoded;
    else kids.push(decoded);
  };

  const closeIfOpen = (tag, boundary) => {
    for (let i = stack.length - 1; i > 0; i--) {
      const t = stack[i].tag;
      if (t === tag) {
        stack.length = i;
        return true;
      }
      if (boundary.includes(t)) return false;
    }
    return false;
  };

  const openTag = (tag, attrs, selfClosing) => {
    if (tag === 'html') {
      Object.assign(doc.htmlAttrs, attrs);
      return null;
    }
    if (tag === 'body') {
      Object.assign(doc.bodyAttrs, attrs);
      return null;
    }
    if (tag === 'head') return null;
    if (tag === 'meta') {
      const key = (attrs.property || attrs.name || '').toLowerCase();
      if (key && attrs.content && !doc.metas[key]) doc.metas[key] = attrs.content.slice(0, 400);
      if ((attrs['http-equiv'] || '').toLowerCase() === 'refresh') doc.refresh = attrs.content || '';
      if (attrs.charset) doc.metas.charset = attrs.charset;
      return null;
    }
    if (tag === 'base') {
      if (!doc.base && attrs.href) doc.base = attrs.href;
      return null;
    }
    if (P_CLOSERS.has(tag)) closeIfOpen('p', P_BOUNDARY);
    if (tag === 'li') closeIfOpen('li', LIST_BOUNDARY);
    if (tag === 'dt' || tag === 'dd') {
      closeIfOpen('dt', DL_BOUNDARY);
      closeIfOpen('dd', DL_BOUNDARY);
    }
    if (tag === 'td' || tag === 'th') {
      closeIfOpen('td', CELL_BOUNDARY);
      closeIfOpen('th', CELL_BOUNDARY);
    }
    if (tag === 'tr') {
      closeIfOpen('td', CELL_BOUNDARY);
      closeIfOpen('th', CELL_BOUNDARY);
      closeIfOpen('tr', ROW_BOUNDARY);
    }
    if (tag === 'thead' || tag === 'tbody' || tag === 'tfoot') {
      closeIfOpen('td', CELL_BOUNDARY);
      closeIfOpen('th', CELL_BOUNDARY);
      closeIfOpen('tr', ROW_BOUNDARY);
      ['thead', 'tbody', 'tfoot'].forEach((t) => closeIfOpen(t, ['table']));
    }
    if (tag === 'option' || tag === 'optgroup') closeIfOpen('option', ['select', 'datalist', 'optgroup']);
    if (tag === 'optgroup') closeIfOpen('optgroup', ['select']);
    if (/^h[1-6]$/.test(tag) && /^h[1-6]$/.test(current().tag)) stack.pop();
    if (tag === 'a') closeIfOpen('a', ['table', 'td', 'th']);
    if (tag === 'form' && stack.some((n) => n.tag === 'form')) return null;
    const el = { tag, attrs, kids: [] };
    current().kids.push(el);
    if (!VOID_TAGS.has(tag) && !selfClosing) stack.push(el);
    return el;
  };

  const closeTag = (tag) => {
    if (tag === 'br') {
      current().kids.push({ tag: 'br', attrs: {}, kids: [] });
      return;
    }
    if (tag === 'p') {
      closeIfOpen('p', P_BOUNDARY);
      return;
    }
    if (tag === 'body' || tag === 'html' || tag === 'head') return;
    const tableish = TABLE_TAGS.has(tag);
    for (let i = stack.length - 1; i > 0; i--) {
      const t = stack[i].tag;
      if (t === tag) {
        stack.length = i;
        return;
      }
      if (!tableish && (t === 'td' || t === 'th' || t === 'table' || t === 'caption')) return;
      if (tableish && t === 'table' && tag !== 'table') return;
    }
  };

  let i = 0;
  const len = source.length;
  while (i < len) {
    const lt = source.indexOf('<', i);
    if (lt === -1) {
      addText(source.slice(i));
      break;
    }
    if (lt > i) addText(source.slice(i, lt));
    if (source.startsWith('<!--', lt)) {
      const end = source.indexOf('-->', lt + 4);
      i = end === -1 ? len : end + 3;
      continue;
    }
    const next = source[lt + 1] || '';
    if (next === '!' || next === '?') {
      const end = source.indexOf('>', lt);
      i = end === -1 ? len : end + 1;
      continue;
    }
    if (next === '/') {
      const m = /^<\/([a-zA-Z][\w:-]*)[^>]*>/.exec(source.slice(lt, lt + 256));
      if (!m) {
        addText('<');
        i = lt + 1;
        continue;
      }
      closeTag(m[1].toLowerCase());
      i = lt + m[0].length;
      continue;
    }
    if (!/[a-zA-Z]/.test(next)) {
      addText('<');
      i = lt + 1;
      continue;
    }
    const end = findTagEnd(source, lt + 1);
    if (end === -1) {
      addText(source.slice(lt));
      break;
    }
    const raw = source.slice(lt + 1, end);
    const nameMatch = /^([a-zA-Z][\w:-]*)/.exec(raw);
    const tag = nameMatch[1].toLowerCase();
    const selfClosing = /\/\s*$/.test(raw);
    const attrs = parseAttributes(raw.slice(nameMatch[1].length).replace(/\/\s*$/, ''));
    i = end + 1;

    if (RAW_TAGS.has(tag) && !selfClosing) {
      const closeAt = lower.indexOf('</' + tag, i);
      const content = closeAt === -1 ? source.slice(i) : source.slice(i, closeAt);
      const closeEnd = closeAt === -1 ? len : source.indexOf('>', closeAt);
      i = closeEnd === -1 ? len : closeEnd + 1;
      if (tag === 'title') {
        if (!doc.title) doc.title = decodeEntities(content).replace(/\s+/g, ' ').trim();
        continue;
      }
      const el = openTag(tag, attrs, true);
      if (el && (tag === 'textarea' || tag === 'xmp')) el.kids.push(tag === 'xmp' ? content : decodeEntities(content));
      continue;
    }
    openTag(tag, attrs, selfClosing);
  }
  return doc;
}

function parseColor(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  if (NAMED_COLORS[v]) return NAMED_COLORS[v];
  let m = /^#?([0-9a-f]{6})$/.exec(v);
  if (m) return '#' + m[1];
  m = /^#([0-9a-f]{3})$/.exec(v);
  if (m) return '#' + m[1].split('').map((ch) => ch + ch).join('');
  m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(v);
  if (m) {
    const alpha = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    if (alpha < 0.5) return null;
    return '#' + [m[1], m[2], m[3]].map((n) => Math.min(255, +n).toString(16).padStart(2, '0')).join('');
  }
  return null;
}

function parseInlineStyle(raw) {
  const out = {};
  String(raw || '').split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx === -1) return;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).replace(/!important/i, '').trim();
    if (prop) out[prop] = value;
  });
  return out;
}

function fontClass(family) {
  const first = String(family || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase();
  if (first === 'monospace' || /mono|courier|consol|menlo|code/.test(first)) return 'mono';
  if (/sans/.test(first)) return 'sans';
  if (first === 'serif' || /georgia|times|garamond|serif|palatino|book/.test(first)) return 'serif';
  return 'sans';
}

function cssFontSize(value, parentPx) {
  const m = /^([\d.]+)(px|pt|em|rem|%)?$/.exec(String(value || '').trim());
  if (!m) {
    const named = { 'xx-small': 9, 'x-small': 10, small: 13, medium: 16, large: 18, 'x-large': 24, 'xx-large': 32, smaller: parentPx * 0.83, larger: parentPx * 1.2 };
    return named[value] || null;
  }
  const n = parseFloat(m[1]);
  switch (m[2]) {
    case 'pt': return n * 4 / 3;
    case 'em': return n * parentPx;
    case 'rem': return n * 16;
    case '%': return n * parentPx / 100;
    default: return n;
  }
}

function fontAttrSize(value) {
  const v = String(value || '').trim();
  let n;
  if (/^[+-]\d$/.test(v)) n = 3 + parseInt(v, 10);
  else n = parseInt(v, 10);
  if (!n) return null;
  return SIZE_PX[Math.max(1, Math.min(7, n))];
}

const INHERITED = ['c', 'fs', 'fw', 'it', 'ff', 'ta'];

function styleFor(el, parent) {
  const tag = el.tag;
  const a = el.attrs;
  const st = Object.assign({}, parent);
  const extra = {};
  let hidden = false;
  let display = null;

  if (HEADING_PX[tag]) {
    st.fs = HEADING_PX[tag];
    st.fw = 1;
  }
  if (tag === 'b' || tag === 'strong' || tag === 'th' || tag === 'dt') st.fw = 1;
  if (tag === 'i' || tag === 'em' || tag === 'cite' || tag === 'var' || tag === 'dfn' || tag === 'address') st.it = 1;
  if (tag === 'u' || tag === 'ins') extra.u = 1;
  if (tag === 's' || tag === 'strike' || tag === 'del') extra.x = 1;
  if (tag === 'code' || tag === 'kbd' || tag === 'samp' || tag === 'tt' || tag === 'pre' || tag === 'listing' || tag === 'xmp') st.ff = 'mono';
  if (tag === 'big') st.fs = Math.round(parent.fs * 1.2);
  if (tag === 'small' || tag === 'sup' || tag === 'sub') st.fs = Math.round(parent.fs * 0.83);
  if (tag === 'center' || tag === 'th' || tag === 'caption') st.ta = 'center';
  if (tag === 'font') {
    const c = parseColor(a.color);
    if (c) st.c = c;
    const px = fontAttrSize(a.size);
    if (px) st.fs = px;
    if (a.face) st.ff = fontClass(a.face);
  }
  if (a.align && tag !== 'img' && tag !== 'table' && tag !== 'iframe') {
    const al = a.align.toLowerCase();
    if (al === 'center' || al === 'middle') st.ta = 'center';
    else if (al === 'right') st.ta = 'right';
    else if (al === 'left') st.ta = '';
  }
  const bg = parseColor(a.bgcolor);
  if (bg) extra.bg = bg;
  if (a.background && (tag === 'table' || tag === 'td' || tag === 'th')) extra.bi = a.background;
  if (a.hidden !== undefined || a['aria-hidden'] === 'true') hidden = true;

  if (a.style) {
    const css = parseInlineStyle(a.style);
    if (css.display) display = css.display.toLowerCase();
    if (display === 'none' || /^(hidden|collapse)$/i.test(css.visibility || '')) hidden = true;
    const color = parseColor(css.color);
    if (color) st.c = color;
    const bgc = parseColor(css['background-color']) || parseColor((css.background || '').split(/\s+/).find((p) => parseColor(p)));
    if (bgc) extra.bg = bgc;
    const bgUrl = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(css['background-image'] || css.background || '');
    if (bgUrl) extra.bi = bgUrl[1];
    if (css['text-align']) {
      const ta = css['text-align'].toLowerCase();
      st.ta = ta === 'center' || ta === 'right' ? ta : '';
    }
    if (css['font-weight']) st.fw = /bold|bolder|[6-9]00/.test(css['font-weight']) ? 1 : 0;
    if (css['font-style']) st.it = /italic|oblique/.test(css['font-style']) ? 1 : 0;
    if (css['font-size']) {
      const px = cssFontSize(css['font-size'], parent.fs);
      if (px) st.fs = Math.round(px);
    }
    if (css['font-family']) st.ff = fontClass(css['font-family']);
    if (/underline/.test(css['text-decoration'] || '')) extra.u = 1;
    if (/line-through/.test(css['text-decoration'] || '')) extra.x = 1;
  }
  return { st, extra, hidden, display };
}

function absolutize(href, base) {
  try {
    return new URL(String(href || '').trim(), base).href;
  } catch (e) {
    return null;
  }
}

function htmlSnapshot(html, pageUrl) {
  const doc = parseHtml(html);
  const baseUrl = (doc.base && absolutize(doc.base, pageUrl)) || pageUrl;
  const here = String(pageUrl).split('#')[0];
  const linkColor = parseColor(doc.bodyAttrs.link) || '#0000ee';
  const fragTargets = new Set();
  let textLength = 0;
  let budget = 30000;

  const collectFragments = (node) => {
    for (const kid of node.kids) {
      if (typeof kid === 'string') continue;
      if (kid.tag === 'a' && kid.attrs.href) {
        const abs = absolutize(kid.attrs.href, baseUrl);
        if (abs) {
          const i = abs.indexOf('#');
          if (i > 0 && abs.slice(0, i) === here && abs.length > i + 1) {
            try {
              fragTargets.add(decodeURIComponent(abs.slice(i + 1)));
            } catch (e) {
              fragTargets.add(abs.slice(i + 1));
            }
          }
        }
      }
      collectFragments(kid);
    }
  };
  collectFragments(doc.root);

  const linkTarget = (href) => {
    if (!href || /^\s*javascript:/i.test(href)) return null;
    const abs = absolutize(href, baseUrl);
    if (!abs) return null;
    const i = abs.indexOf('#');
    if (i > 0 && abs.slice(0, i) === here) return abs.length > i + 1 ? abs.slice(i) : null;
    return /^(https?|mailto|ftp):/i.test(abs) ? abs : null;
  };

  const imageSource = (a) => {
    const candidates = [a['data-src'], a['data-lazy-src'], a['data-original'], a.src];
    if (a.src && !/^data:/i.test(a.src)) candidates.unshift(a.src);
    for (const c of candidates) {
      if (c && !/^data:/i.test(c) && c.trim()) return absolutize(c, baseUrl);
    }
    const srcset = a.srcset || a['data-srcset'];
    if (srcset) {
      const first = srcset.trim().split(/[\s,]+/)[0];
      if (first && !/^data:/i.test(first)) return absolutize(first, baseUrl);
    }
    return null;
  };

  const intAttr = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const pushText = (out, text, pre) => {
    let v = pre ? text : text.replace(/[\t\n\r\f ]+/g, ' ');
    v = v.replace(/[\u200b\ufeff]/g, '');
    if (!v) return;
    const last = out[out.length - 1];
    if (v === ' ' && (out.length === 0 || (typeof last === 'string' && /\s$/.test(last)))) return;
    textLength += v.trim().length;
    if (typeof last === 'string') out[out.length - 1] = last + v;
    else out.push(v);
  };

  const textOf = (node) => node.kids.map((k) => (typeof k === 'string' ? k : textOf(k))).join('');

  const convert = (el, ctx, out, depth) => {
    if (budget <= 0 || depth > 200) return;
    const tag = el.tag;
    if (SKIP_TAGS.has(tag)) return;
    const a = el.attrs;
    if (tag === 'input' && (a.type || '').toLowerCase() === 'hidden') {
      if (a.name) out.push({ t: 'input', a: { type: 'hidden', name: a.name, value: a.value || '' } });
      return;
    }
    const { st, extra, hidden, display } = styleFor(el, ctx.st);
    if (hidden) return;
    budget--;
    if (tag === 'a' && a.href && !/color\s*:/i.test(a.style || '')) st.c = linkColor;

    if (tag === 'br') {
      out.push({ t: 'br' });
      return;
    }
    if (tag === 'hr') {
      out.push({ t: 'hr', d: 1 });
      return;
    }
    if (tag === 'img') {
      const w = intAttr(a.width);
      const h = intAttr(a.height);
      if ((w && w < 3) || (h && h < 3)) return;
      const src = imageSource(a);
      if (!src) return;
      const node = { t: 'img', a: { src, alt: (a.alt || a.title || '').trim().slice(0, 200) } };
      if (w) node.a.w = w;
      if (h) node.a.h = h;
      const al = (a.align || '').toLowerCase();
      if (al === 'left' || al === 'right') node.fl = al[0];
      out.push(node);
      return;
    }
    if (tag === 'iframe') {
      const src = absolutize(a.src || '', baseUrl);
      if (src && /^https?:/i.test(src)) out.push({ t: 'iframe', d: 1, a: { src, title: (a.title || '').slice(0, 160), w: intAttr(a.width), h: intAttr(a.height) } });
      return;
    }
    if (tag === 'video') {
      const poster = a.poster ? absolutize(a.poster, baseUrl) : '';
      out.push({ t: 'video', d: 1, a: { poster: poster || '', src: absolutize(a.src || '', baseUrl) || '', title: a.title || '' } });
      return;
    }
    if (tag === 'input') {
      const type = (a.type || 'text').toLowerCase();
      if (type === 'file' || type === 'color' || type === 'range') return;
      out.push({ t: 'input', a: { type, name: a.name || '', value: type === 'password' ? '' : a.value || '', ph: a.placeholder || '', ch: a.checked !== undefined ? 1 : 0, w: intAttr(a.size) * 8, al: a['aria-label'] || a.title || '' } });
      return;
    }
    if (tag === 'select') {
      const options = [];
      const scan = (node) => node.kids.forEach((k) => {
        if (typeof k === 'string') return;
        if (k.tag === 'option' && options.length < 250) options.push({ t: 'option', a: { v: k.attrs.value !== undefined ? k.attrs.value : textOf(k).trim(), sel: k.attrs.selected !== undefined ? 1 : 0 }, k: [textOf(k).replace(/\s+/g, ' ').trim().slice(0, 120)] });
        else scan(k);
      });
      scan(el);
      out.push({ t: 'select', a: { name: a.name || '', multiple: a.multiple !== undefined ? 1 : 0 }, k: options });
      return;
    }
    if (tag === 'textarea') {
      out.push({ t: 'textarea', a: { name: a.name || '', value: textOf(el).slice(0, 4000), w: intAttr(a.cols) * 8, h: intAttr(a.rows) * 16 } });
      return;
    }
    if (tag === 'button') {
      out.push({ t: 'button', a: { type: (a.type || 'submit').toLowerCase(), name: a.name || '', value: a.value || '', label: textOf(el).replace(/\s+/g, ' ').trim().slice(0, 60) || a['aria-label'] || '' } });
      return;
    }

    const node = { t: tag };
    let s = null;
    for (const k of INHERITED) {
      if (st[k] !== ctx.base[k]) {
        s = s || {};
        s[k] = st[k];
      }
    }
    if (extra.bg && extra.bg !== ctx.bg) {
      s = s || {};
      s.bg = extra.bg;
    }
    if (extra.bi) {
      const bi = absolutize(extra.bi, baseUrl);
      if (bi) {
        s = s || {};
        s.bi = bi;
      }
    }
    if (extra.u && tag !== 'a') {
      s = s || {};
      s.u = 1;
    }
    if (extra.x) {
      s = s || {};
      s.x = 1;
    }
    if (tag === 'table' && intAttr(a.border)) {
      s = s || {};
      s.bd = 1;
    }
    if (s) node.s = s;

    const isBlock = display ? !/^inline/.test(display) : BLOCK_TAGS.has(tag);
    if (isBlock) node.d = 1;
    if (tag === 'table') {
      const al = (a.align || '').toLowerCase();
      if (al === 'left' || al === 'right') node.fl = al[0];
      if (a.width) node.wp = String(a.width);
    }

    const attrs = {};
    if (tag === 'a') {
      const target = linkTarget(a.href);
      if (target) attrs.h = target;
      const label = (a['aria-label'] || a.title || '').trim();
      if (label) attrs.al = label.slice(0, 120);
      if (a.name && fragTargets.has(a.name)) attrs.id = a.name;
    }
    if (a.id && fragTargets.has(a.id)) attrs.id = a.id;
    if (tag === 'td' || tag === 'th') {
      if (intAttr(a.colspan) > 1) attrs.cs = intAttr(a.colspan);
      if (intAttr(a.rowspan) > 1) attrs.rs = intAttr(a.rowspan);
      if (a.width) node.wp = String(a.width);
    }
    if (tag === 'form') {
      attrs.action = absolutize(a.action || here, baseUrl) || here;
      attrs.method = (a.method || 'get').toLowerCase();
    }
    if (tag === 'ol' && intAttr(a.start) > 1) attrs.start = intAttr(a.start);
    if (tag === 'li' && !/list-style(-type)?\s*:\s*none/i.test(a.style || '')) node.mk = 1;
    if (Object.keys(attrs).length) node.a = attrs;

    node.k = [];
    const pre = ctx.pre || tag === 'pre' || tag === 'listing' || tag === 'xmp' || tag === 'textarea';
    const childCtx = { st, base: st, bg: (s && s.bg) || ctx.bg, pre };
    for (const kid of el.kids) {
      if (typeof kid === 'string') pushText(node.k, kid, pre);
      else convert(kid, childCtx, node.k, depth + 1);
    }

    if (!node.k.length && tag !== 'td' && tag !== 'th' && !attrs.id) return;
    if (!isBlock && !node.s && !node.a && (tag === 'span' || tag === 'font' || tag === 'noscript' || tag === 'label' || tag === 'abbr' || tag === 'time' || tag === 'nobr')) {
      for (const kid of node.k) {
        const last = out[out.length - 1];
        if (typeof kid === 'string' && typeof last === 'string') out[out.length - 1] = last + kid;
        else out.push(kid);
      }
      return;
    }
    out.push(node);
  };

  const rootStyle = { c: '#000000', fs: 16, fw: 0, it: 0, ff: 'serif', ta: '' };
  const bodyEl = { tag: 'div', attrs: doc.bodyAttrs, kids: [] };
  const bodyStyle = styleFor(bodyEl, rootStyle);
  const textColor = parseColor(doc.bodyAttrs.text);
  if (textColor) bodyStyle.st.c = textColor;
  const pageBg = bodyStyle.extra.bg || '#ffffff';
  const base = Object.assign({}, bodyStyle.st);
  const tree = { t: 'body', d: 1, k: [] };
  const rootCtx = { st: base, base, bg: pageBg, pre: false };
  for (const kid of doc.root.kids) {
    if (typeof kid === 'string') pushText(tree.k, kid, false);
    else convert(kid, rootCtx, tree.k, 0);
  }

  const bodyBg = doc.bodyAttrs.background ? absolutize(doc.bodyAttrs.background, baseUrl) : bodyStyle.extra.bi ? absolutize(bodyStyle.extra.bi, baseUrl) : '';
  return {
    url: pageUrl,
    title: doc.title,
    lang: doc.htmlAttrs.lang || '',
    metas: doc.metas,
    lastModified: '',
    width: 0,
    base: Object.assign(base, { bg: pageBg, link: linkColor, bi: bodyBg || '' }),
    text: textLength,
    truncated: budget <= 0,
    tree
  };
}

function readRefresh(html, pageUrl) {
  const doc = parseHtml(String(html || '').slice(0, 20000));
  const m = /^\s*\d+\s*;\s*url\s*=\s*['"]?([^'"]+)/i.exec(doc.refresh || '');
  return m ? absolutize(m[1].trim(), pageUrl) : null;
}

module.exports = { parseHtml, htmlSnapshot, decodeEntities, readRefresh, parseColor };
