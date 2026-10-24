const OUT_WIDTH = 760;
const SIZE_PX = [0, 10, 13, 16, 18, 24, 32, 48];
const FACES = { sans: 'Arial, Helvetica', serif: 'Times New Roman, Times', mono: 'Courier New, Courier' };
const CSS_FACES = { sans: 'Arial, Helvetica, sans-serif', serif: '"Times New Roman", Times, serif', mono: '"Courier New", Courier, monospace' };
const HEADING_SIZE = { 1: 6, 2: 5, 3: 4 };
const MAX_LAYOUT_TABLES = 6;
const MAX_DEPTH = 140;
const DOCTYPE = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">';
const INLINE_ONLY = new Set(['br', 'input', 'select', 'textarea', 'button', 'option']);
const TEXT_INPUTS = new Set(['text', 'search', 'email', 'url', 'tel', 'number', 'password', 'date', 'datetime-local', 'month', 'week', 'time']);
const SEPARATOR_TEXT = /^[\s|·•\/\\\-–—:,]*$/;

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sizeIndex(px) {
  if (px <= 11) return 1;
  if (px <= 14) return 2;
  if (px <= 16.5) return 3;
  if (px <= 20) return 4;
  if (px <= 27) return 5;
  if (px <= 38) return 6;
  return 7;
}

function rgbOf(hex) {
  const h = String(hex || '#000000').replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
}

function hexOf(rgb) {
  return '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function websafe(hex) {
  return hexOf(rgbOf(hex).map((v) => Math.round(v / 51) * 51));
}

function luminance(hex) {
  const [r, g, b] = rgbOf(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return String(url || '');
  }
}

function youtubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m|music)\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = /^\/(shorts|embed|live|v)\/([\w-]{6,})/.exec(u.pathname);
      if (m) return m[2];
    }
  } catch (e) {}
  return null;
}

function stripTags(html) {
  return String(html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;|\u00a0/g, ' ');
}

function hasContent(html) {
  if (/<(img|input|select|textarea|table|hr)\b/i.test(html)) return true;
  return stripTags(html).trim().length > 0;
}

function textLength(node) {
  if (typeof node === 'string') return node.trim().length;
  if (!node) return 0;
  if (node._tl !== undefined) return node._tl;
  let n = 0;
  if (node.k) for (const kid of node.k) n += textLength(kid);
  if (!n && node.a && node.a.al) n = node.a.al.length;
  node._tl = n;
  return n;
}

function isBlock(node) {
  if (!node || typeof node === 'string') return false;
  if (node._blk !== undefined) return node._blk;
  let result = false;
  if (!INLINE_ONLY.has(node.t)) {
    result = !!node.d;
    if (!result && node.k) result = node.k.some(isBlock);
  }
  node._blk = result;
  return result;
}

function containsLink(node) {
  if (!node || typeof node === 'string') return false;
  if (node.t === 'a' && node.a && node.a.h) return true;
  return !!(node.k && node.k.some(containsLink));
}

function countBlocks(node, limit) {
  if (!node || typeof node === 'string' || !node.k) return 0;
  let n = 0;
  for (const kid of node.k) {
    if (isBlock(kid)) {
      n += 1 + countBlocks(kid, limit);
      if (n > limit) return n;
    }
  }
  return n;
}

function largestImage(node) {
  if (!node || typeof node === 'string') return 0;
  if (node.t === 'img') return node.b ? Math.max(node.b[2], node.b[3]) : Math.max(node.a.w || 0, node.a.h || 0, 100);
  if (node.t === 'iframe' || node.t === 'video') return 999;
  let max = 0;
  if (node.k) for (const kid of node.k) max = Math.max(max, largestImage(kid));
  return max;
}

function inlineCopy(node) {
  if (typeof node === 'string') return node;
  const copy = Object.assign({}, node, { d: 0, _blk: false });
  if (isBlock(node) && node.t !== 'img') copy.ib = 1;
  if (node.k) copy.k = node.k.map(inlineCopy);
  return copy;
}

function defaultGatewayPage(url) {
  return '/netscape/page?url=' + encodeURIComponent(url);
}

function defaultGatewayImage(url, ref) {
  return '/netscape/img?url=' + encodeURIComponent(url) + (ref ? '&ref=' + encodeURIComponent(ref) : '');
}

function filterMarkup() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="ns216" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="noise"/>' +
    '<feComposite in="SourceGraphic" in2="noise" operator="arithmetic" k1="0" k2="1" k3="0.11" k4="-0.055" result="dither"/>' +
    '<feComponentTransfer in="dither"><feFuncR type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1"/><feFuncG type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1"/>' +
    '<feFuncB type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1"/><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer></filter></svg>';
}

function documentShell({ url, title, bodyAttrs, css, body, websafeImages }) {
  return DOCTYPE + '\n<html>\n<head>\n' +
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">\n' +
    `<meta name="ns-url" content="${esc(url)}">\n` +
    `<meta name="ns-title" content="${esc(title)}">\n` +
    '<meta name="generator" content="Netscape 6 Web 1.0 Gateway">\n' +
    `<title>${esc(title)}</title>\n` +
    `<style type="text/css">\n${css}\n</style>\n` +
    '</head>\n' +
    `<body ${bodyAttrs}>\n` +
    (websafeImages ? filterMarkup() + '\n' : '') +
    body + '\n</body>\n</html>\n';
}

function baseCss(face, sizePx, color, websafeImages) {
  return `body, td, th { font-family: ${CSS_FACES[face] || CSS_FACES.serif}; font-size: ${sizePx}px; color: ${color}; }\n` +
    `img { max-width: 100%; height: auto;${websafeImages ? ' filter: url(#ns216);' : ''} }\n` +
    'input, select, textarea { font-size: 13px; }';
}

function hitCounter(url) {
  const digits = String(hash32(url) % 1000000).padStart(6, '0').split('');
  return '<table border="0" cellspacing="1" cellpadding="1" bgcolor="#808080"><tr>' +
    digits.map((d) => `<td bgcolor="#000000"><font face="Courier New, Courier" color="#00FF00" size="3"><b>${d}</b></font></td>`).join('') +
    '</tr></table>';
}

function badge(bg, border, top, bottom, topColor, bottomColor) {
  return `<td><table width="88" height="31" border="1" cellspacing="0" cellpadding="0" bgcolor="${bg}" bordercolor="${border}"><tr><td align="center" valign="middle">` +
    `<font face="Arial, Helvetica" size="1" color="${topColor}"><b>${top}</b></font><br>` +
    `<font face="Arial, Helvetica" size="1" color="${bottomColor}">${bottom}</font></td></tr></table></td>`;
}

function formatDate(value) {
  const d = value ? new Date(value) : new Date();
  const ok = !isNaN(d.getTime()) ? d : new Date();
  return String(ok.getDate()).padStart(2, '0') + '.' + String(ok.getMonth() + 1).padStart(2, '0') + '.' + ok.getFullYear();
}

function decorations(snap, url, textColor) {
  const host = hostOf(url);
  const metas = snap.metas || {};
  const description = (metas.description || metas['og:description'] || '').replace(/\s+/g, ' ').trim();
  const updated = metas['article:modified_time'] || metas['og:updated_time'] || metas['last-modified'] || snap.lastModified || '';
  const marquee = description
    ? `<marquee scrollamount="4" bgcolor="#000000"><font face="Courier New, Courier" color="#00FF00" size="2">*** ${esc(description.slice(0, 260))} ***</font></marquee>`
    : '';
  return '\n<br clear="all">\n<hr size="2">\n<center>\n' +
    (marquee ? marquee + '\n<br>\n' : '') +
    `<font face="Arial, Helvetica" size="2" color="${textColor}">Вы посетитель номер:</font><br>\n${hitCounter(url)}\n` +
    `<font face="Arial, Helvetica" size="1" color="${textColor}">Последнее обновление: ${esc(formatDate(updated))}<br>\n` +
    'Лучше всего смотреть в <b>Netscape 6</b> при разрешении 800x600<br>\n' +
    `Пишите вебмастеру: <a href="mailto:webmaster@${esc(host)}">webmaster@${esc(host)}</a></font>\n` +
    '<br><br>\n<table border="0" cellspacing="4" cellpadding="0"><tr>' +
    badge('#000080', '#C0C0C0', 'Netscape 6', 'NOW!', '#FFFF00', '#FFFFFF') +
    badge('#FFFFFF', '#000000', 'HTML 3.2', 'CHECKED', '#CC0000', '#000000') +
    badge('#006600', '#C0C0C0', '800 x 600', 'BEST VIEWED', '#FFFFFF', '#FFFF00') +
    '</tr></table>\n</center>\n';
}

function metaCard(snap, url, gwPage, gwImage, websafeColors) {
  const metas = snap.metas || {};
  const vid = youtubeId(url);
  const image = metas['og:image'] || metas['twitter:image'] || (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : '');
  const heading = metas['og:title'] || metas['twitter:title'] || snap.title || '';
  const desc = metas['og:description'] || metas.description || metas['twitter:description'] || '';
  if (!image && !desc) return '';
  let imgAbs = null;
  try {
    imgAbs = image ? new URL(image, url).href : null;
  } catch (e) {}
  const bg = websafeColors ? '#FFFFCC' : '#FFFFE0';
  return `<table width="100%" border="1" cellspacing="0" cellpadding="6" bgcolor="${bg}"><tr>` +
    (imgAbs ? `<td width="40%" align="center" valign="top"><img src="${esc(gwImage(imgAbs, url))}" width="280" border="1" alt="${esc(heading)}"></td>` : '') +
    `<td valign="top"><font face="Arial, Helvetica" size="2" color="#000000">${vid ? '<b>[ ВИДЕОРОЛИК ]</b><br>' : ''}` +
    `<font size="4"><b>${esc(heading)}</b></font><br><br>${esc(desc).replace(/\n/g, '<br>')}</font></td></tr></table><br>`;
}

function tidy(html) {
  const parts = html.split(/(<pre>[\s\S]*?<\/pre>)/);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part;
    let out = part;
    let prev;
    do {
      prev = out;
      out = out
        .replace(/<(font|b|i|u|tt|strike|sup|sub)\b[^>]*>(\s*)<\/\1>/g, '$2')
        .replace(/<div( align="[a-z]+")?>\s*<\/div>/g, '')
        .replace(/<p( align="[a-z]+")?>\s*<\/p>/g, '');
    } while (out !== prev);
    return out.replace(/[ \t]+/g, ' ').replace(/ ?\n[\s]*/g, '\n');
  }).join('');
}

function transcode(snap, options = {}) {
  const url = snap.url;
  const websafeColors = options.websafe !== false;
  const gwPage = options.gatewayPage || defaultGatewayPage;
  const gwImageRaw = options.gatewayImage || defaultGatewayImage;
  const gwImage = (src) => gwImageRaw(src, url);
  const formAction = options.formAction || '/netscape/form';
  const geo = !!snap.width;
  const scale = geo ? OUT_WIDTH / snap.width : 1;
  const base = snap.base || {};

  const paint = (hex) => (websafeColors ? websafe(hex || '#000000') : String(hex || '#000000').toUpperCase());
  const readable = (fg, bg) => (contrast(fg, bg) >= 2.6 ? fg : luminance(bg) > 0.3 ? '#000000' : '#FFFFFF');

  const pageBg = paint(base.bg || '#ffffff');
  const rootFace = base.ff || 'serif';
  const rootSize = sizeIndex(base.fs || 16);
  const textColor = readable(paint(base.c || '#000000'), pageBg);
  let linkColor = readable(paint(base.link || '#0000ee'), pageBg);
  if (linkColor === textColor && contrast(textColor, pageBg) > 4) linkColor = textColor;
  const linkRgb = rgbOf(linkColor);
  const visitedColor = linkRgb[2] > 150 && linkRgb[0] < 100 && linkRgb[1] < 100 ? '#663399' : linkColor;

  const rootShow = { c: textColor, size: rootSize, face: rootFace, fw: 0, it: 0, u: 0, x: 0, ta: '' };
  const cellShow = () => Object.assign({}, rootShow);

  const rootCtx = {
    c: base.c || '#000000', fs: base.fs || 16, fw: base.fw || 0, it: base.it || 0, ff: rootFace, ta: base.ta || '',
    u: 0, x: 0, bg: base.bg || '#ffffff', width: OUT_WIDTH, tables: 0, depth: 0,
    link: null, inA: false, form: null, pre: false, pbox: snap.tree && snap.tree.b
  };

  function applyStyle(ctx, s) {
    if (!s) return ctx;
    const n = Object.assign({}, ctx);
    if (s.c !== undefined) n.c = s.c;
    if (s.fs !== undefined) n.fs = s.fs;
    if (s.fw !== undefined) n.fw = s.fw;
    if (s.it !== undefined) n.it = s.it;
    if (s.ff !== undefined) n.ff = s.ff;
    if (s.ta !== undefined) n.ta = s.ta;
    if (s.u) n.u = 1;
    if (s.x) n.x = 1;
    if (s.bg) n.bg = s.bg;
    return n;
  }

  function colorFor(ctx) {
    return readable(paint(ctx.c), paint(ctx.bg));
  }

  function wrap(ctx, show) {
    const attrs = [];
    const color = colorFor(ctx);
    if (color !== show.c) attrs.push(`color="${color}"`);
    const size = sizeIndex(ctx.fs);
    if (size !== show.size) attrs.push(`size="${size}"`);
    let tt = false;
    if (ctx.ff !== show.face) {
      if (ctx.ff === 'mono') tt = true;
      else attrs.push(`face="${FACES[ctx.ff]}"`);
    }
    let open = '';
    let close = '';
    if (attrs.length) {
      open += `<font ${attrs.join(' ')}>`;
      close = '</font>' + close;
    }
    if (tt) {
      open += '<tt>';
      close = '</tt>' + close;
    }
    if (ctx.fw && !show.fw) {
      open += '<b>';
      close = '</b>' + close;
    }
    if (ctx.it && !show.it) {
      open += '<i>';
      close = '</i>' + close;
    }
    if (ctx.u && !show.u) {
      open += '<u>';
      close = '</u>' + close;
    }
    if (ctx.x && !show.x) {
      open += '<strike>';
      close = '</strike>' + close;
    }
    return {
      open,
      close,
      show: { c: color, size, face: ctx.ff, fw: show.fw || ctx.fw, it: show.it || ctx.it, u: show.u || ctx.u, x: show.x || ctx.x, ta: show.ta }
    };
  }

  function linkHref(target) {
    if (target.startsWith('#')) return esc(target);
    if (/^mailto:/i.test(target)) return esc(target);
    return esc(gwPage(target));
  }

  function scaled(px) {
    if (!geo) return px;
    return px > 64 ? Math.round(px * scale) : Math.round(px);
  }

  function linkShow(show) {
    return Object.assign({}, show, { c: linkColor, u: 1 });
  }

  function needsGap(prev, next) {
    if (typeof prev === 'string' || typeof next === 'string') return false;
    if (prev.t === 'sup' || prev.t === 'sub' || next.t === 'sup' || next.t === 'sub') return false;
    if (prev.ib || next.ib) return true;
    const linkish = (n) => n.t === 'a' || n.t === 'img' || n.t === 'button' || n.t === 'input' || n.t === 'select';
    return linkish(prev) && linkish(next);
  }

  function soleLink(node) {
    if (typeof node === 'string' || !node) return false;
    if (node.t === 'a') return !!(node.a && node.a.h);
    const kids = (node.k || []).filter((k) => typeof k !== 'string' || k.trim());
    return kids.length === 1 && soleLink(kids[0]);
  }

  function linkBar(nodes) {
    const links = nodes.filter(soleLink);
    if (links.length < 2) return false;
    return nodes.every((n) => (typeof n === 'string' ? SEPARATOR_TEXT.test(n) : soleLink(n)));
  }

  function inlineList(nodes, ctx, show) {
    if (linkBar(nodes)) {
      return nodes
        .filter((n) => typeof n !== 'string')
        .map((n) => inlineNode(n, ctx, show))
        .filter((part) => hasContent(part))
        .join(' | ');
    }
    let html = '';
    let prev = null;
    for (const node of nodes) {
      const part = inlineNode(node, ctx, show);
      if (!part) continue;
      if (prev && needsGap(prev, node) && !/\s$/.test(html) && !/^\s/.test(part)) html += ' ';
      html += part;
      prev = node;
    }
    return html;
  }

  function inlineNode(node, ctx, show) {
    if (typeof node === 'string') return esc(node);
    switch (node.t) {
      case 'br': return '<br>';
      case 'img': return image(node, ctx);
      case 'hr': return '<hr>';
      case 'input':
      case 'select':
      case 'textarea':
      case 'button':
        return control(node, ctx);
      case 'iframe':
      case 'video':
        return media(node, ctx);
      case 'option':
        return '';
      default:
        break;
    }
    if (isBlock(node)) return inlineNode(inlineCopy(node), ctx, show);
    const c2 = applyStyle(ctx, node.s);
    const anchor = node.a && node.a.id ? `<a name="${esc(node.a.id)}"></a>` : '';
    if (node.t === 'a' && node.a && node.a.h && !ctx.inA) return anchor + linkHtml(node.k || [], node.a, c2, show);
    const w = wrap(c2, show);
    const inner = inlineList(node.k || [], c2, w.show);
    if (!inner) return anchor;
    let html = w.open + inner + w.close;
    if (node.t === 'sup' || node.t === 'sub') html = `<${node.t}>${html}</${node.t}>`;
    else if (node.t === 'q') html = '\u00ab' + html + '\u00bb';
    return anchor + html;
  }

  function linkHtml(kids, attrs, ctx, show) {
    const lctx = Object.assign({}, ctx, { inA: true });
    const w = wrap(lctx, linkShow(show));
    let inner = inlineList(kids, lctx, w.show);
    if (!hasContent(inner)) {
      if (!attrs.al) return inner;
      inner = esc('[' + attrs.al + ']');
    }
    return `<a href="${linkHref(attrs.h)}">${w.open}${inner}${w.close}</a>`;
  }

  function run(nodes, ctx, show) {
    if (ctx.link && !ctx.inA) return linkHtml(nodes, { h: ctx.link }, ctx, show);
    const w = wrap(ctx, show);
    const inner = inlineList(nodes, ctx, w.show);
    if (!hasContent(inner)) return '';
    return w.open + inner.replace(/^\s+|\s+$/g, '') + w.close;
  }

  function image(node, ctx) {
    const a = node.a || {};
    if (!a.src) return '';
    const isData = /^data:/i.test(a.src);
    const src = isData ? a.src : gwImage(a.src);
    let w = 0;
    let h = 0;
    if (node.b) {
      w = scaled(node.b[2]);
      h = node.b[2] > 64 ? Math.round(node.b[3] * scale) : Math.round(node.b[3]);
    } else {
      w = a.w || 0;
      h = a.h || 0;
      if (w > 600) {
        h = h ? Math.round(h * 600 / w) : 0;
        w = 600;
      }
    }
    const limit = Math.max(40, ctx.width || OUT_WIDTH);
    if (w > limit) {
      h = h ? Math.round(h * limit / w) : 0;
      w = limit;
    }
    let attrs = `src="${esc(src)}"`;
    if (w) attrs += ` width="${Math.max(1, w)}"`;
    if (w && h) attrs += ` height="${Math.max(1, h)}"`;
    attrs += ` border="0" alt="${esc(a.alt || '')}"`;
    if (node.fl === 'l' || node.fl === 'r') attrs += ` align="${node.fl === 'l' ? 'left' : 'right'}" hspace="6" vspace="4"`;
    else if (w && w <= 32 && !node.d) attrs += ' align="absmiddle"';
    let html = `<img ${attrs}>`;
    if (ctx.link && !ctx.inA) html = `<a href="${linkHref(ctx.link)}">${html}</a>`;
    return html;
  }

  function media(node, ctx) {
    const a = node.a || {};
    const width = Math.min(ctx.width || OUT_WIDTH, node.b ? scaled(node.b[2]) : a.w || 320);
    const cell = (inner) => `<table border="1" cellspacing="0" cellpadding="6" bgcolor="#000000" width="${Math.max(160, width)}"><tr><td align="center">` +
      `<font face="Arial, Helvetica" size="2" color="#FFFFFF">${inner}</font></td></tr></table>`;
    if (node.t === 'iframe') {
      if (!a.src || !/^https?:/i.test(a.src)) return '';
      const vid = youtubeId(a.src);
      const target = vid ? `https://www.youtube.com/watch?v=${vid}` : a.src;
      const thumb = vid ? `<img src="${esc(gwImage(`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`))}" width="${Math.min(320, Math.max(120, width - 20))}" border="0" alt=""><br>` : '';
      const label = vid ? 'ВИДЕОРОЛИК' : 'ВСТРОЕННАЯ СТРАНИЦА';
      return cell(`<b>[ ${label} ]</b><br><a href="${linkHref(target)}">${thumb}<font color="#FFFF00">${esc(a.title || hostOf(target))}</font></a>`);
    }
    const poster = a.poster ? `<img src="${esc(gwImage(a.poster))}" width="${Math.min(320, Math.max(120, width - 20))}" border="0" alt=""><br>` : '';
    return cell(`${poster}<b>[ ВИДЕО ]</b>${a.title ? '<br>' + esc(a.title) : ''}`);
  }

  function control(node, ctx) {
    const state = ctx.form;
    if (!state) return '';
    const a = node.a || {};
    const disabled = state.active ? '' : ' disabled';
    const name = a.name ? ` name="${esc(a.name)}"` : '';
    if (node.t === 'input') {
      const type = a.type || 'text';
      if (type === 'hidden') return state.active && a.name ? `<input type="hidden"${name} value="${esc(a.value)}">` : '';
      if (TEXT_INPUTS.has(type)) {
        state.hasText = true;
        const size = a.w ? Math.max(6, Math.min(40, Math.round(scaled(a.w) / 8))) : 20;
        return `<input type="${type === 'password' ? 'password' : 'text'}"${name} value="${esc(a.value)}" size="${size}"${disabled}>`;
      }
      if (type === 'checkbox' || type === 'radio') {
        return `<input type="${type}"${name} value="${esc(a.value || 'on')}"${a.ch ? ' checked' : ''}${disabled}>`;
      }
      if (type === 'submit' || type === 'image' || type === 'button') {
        if (type === 'button') return '';
        state.hasSubmit = true;
        return `<input type="submit"${name} value="${esc(a.value || a.al || 'Отправить')}"${disabled}>`;
      }
      if (type === 'reset') return `<input type="reset" value="${esc(a.value || 'Сброс')}"${disabled}>`;
      return '';
    }
    if (node.t === 'button') {
      if (a.type !== 'submit') return '';
      state.hasSubmit = true;
      const value = name && a.value ? a.value : a.label || a.value || 'OK';
      return `<input type="submit"${name} value="${esc(value)}"${disabled}>`;
    }
    if (node.t === 'select') {
      const options = (node.k || []).map((o) => `<option value="${esc(o.a.v)}"${o.a.sel ? ' selected' : ''}>${esc(o.k[0] || '')}`).join('');
      return `<select${name}${a.multiple ? ' multiple' : ''}${disabled}>${options}</select>`;
    }
    if (node.t === 'textarea') {
      const cols = a.w ? Math.max(10, Math.min(70, Math.round(scaled(a.w) / 8))) : 40;
      const rows = a.h ? Math.max(2, Math.min(14, Math.round(a.h / 18))) : 4;
      return `<textarea${name} rows="${rows}" cols="${cols}"${disabled}>${esc(a.value)}</textarea>`;
    }
    return '';
  }

  function enter(node, ctx) {
    const c = applyStyle(ctx, node.s);
    c.depth = ctx.depth + 1;
    c.pbox = node.b || ctx.pbox;
    if (node.t === 'a' && node.a && node.a.h && !ctx.inA) c.link = node.a.h;
    return c;
  }

  function widthShare(node, ctx) {
    if (!node.b || !ctx.pbox || !ctx.pbox[2]) return 1;
    return Math.max(0.05, Math.min(1, node.b[2] / ctx.pbox[2]));
  }

  function isCentered(node, ctx) {
    if (!node.b || !ctx.pbox) return false;
    const left = node.b[0] - ctx.pbox[0];
    const right = ctx.pbox[0] + ctx.pbox[2] - (node.b[0] + node.b[2]);
    return left > 20 && Math.abs(left - right) < Math.max(12, ctx.pbox[2] * 0.04);
  }

  function boxOf(node, ctx) {
    const s = node.s || {};
    const bg = s.bg && paint(s.bg) !== paint(ctx.bg) ? paint(s.bg) : null;
    const bi = s.bi || null;
    const bd = !!s.bd;
    if (!bg && !bi && !bd) return null;
    return { bg, bi, bd };
  }

  function block(node, ctx, show) {
    if (typeof node === 'string') return node.trim() ? run([node], ctx, show) : '';
    if (!isBlock(node)) return run([node], ctx, show);
    if (ctx.depth > MAX_DEPTH) return run([inlineCopy(node)], ctx, show);

    switch (node.t) {
      case 'img': return image(node, ctx) + '<br>';
      case 'hr': return '<hr>';
      case 'iframe':
      case 'video':
        return media(node, ctx);
      case 'table':
        return table(node, ctx, show);
      default:
        break;
    }

    const c = enter(node, ctx);
    const anchor = node.a && node.a.id ? `<a name="${esc(node.a.id)}"></a>` : '';
    const box = c.tables < MAX_LAYOUT_TABLES + 2 ? boxOf(node, ctx) : null;
    const share = widthShare(node, ctx);
    let innerShow = show;
    if (box) {
      c.tables = ctx.tables + 1;
      c.width = Math.max(60, Math.round((ctx.width || OUT_WIDTH) * share) - 12);
      innerShow = cellShow();
    } else if (share < 1) {
      c.width = Math.max(60, Math.round((ctx.width || OUT_WIDTH) * share));
    }

    let align = '';
    if (c.ta !== innerShow.ta) {
      align = c.ta || 'left';
      innerShow = Object.assign({}, innerShow, { ta: c.ta });
    }

    let html = content(node, c, innerShow);
    if (!html.trim()) return anchor;
    if (align && !box) html = `<div align="${align}">${html}</div>`;

    if (box) {
      const attrs = [];
      const pct = Math.round(share * 100);
      attrs.push(`width="${node.fl || pct < 96 ? pct + '%' : '100%'}"`);
      attrs.push(`border="${box.bd ? 1 : 0}"`, 'cellspacing="0"', 'cellpadding="6"');
      if (box.bg) attrs.push(`bgcolor="${box.bg}"`);
      if (box.bi) attrs.push(`background="${esc(gwImage(box.bi))}"`);
      if (node.fl) attrs.push(`align="${node.fl === 'l' ? 'left' : 'right'}"`);
      else if (isCentered(node, ctx)) attrs.push('align="center"');
      html = `<table ${attrs.join(' ')}><tr><td valign="top"${align ? ` align="${align}"` : ''}>${html}</td></tr></table>`;
    } else if (node.fl && share < 0.7) {
      html = `<table width="${Math.round(share * 100)}%" border="0" cellspacing="0" cellpadding="4" align="${node.fl === 'l' ? 'left' : 'right'}"><tr><td valign="top">${html}</td></tr></table>`;
    }
    return anchor + html + '\n';
  }

  function content(node, c, show) {
    switch (node.t) {
      case 'ul':
      case 'ol':
        if ((node.k || []).some((k) => typeof k !== 'string' && k.t === 'li' && k.mk)) return list(node, c, show);
        return flow(node, c, show);
      case 'dl':
        return definitionList(node, c, show);
      case 'pre':
        return preformatted(node, c, show);
      case 'blockquote':
        return `<blockquote>${flow(node, c, show)}</blockquote>`;
      case 'form':
        return form(node, c, show);
      default:
        return flow(node, c, show);
    }
  }

  function groupsOf(kids, pre) {
    const groups = [];
    for (const kid of kids || []) {
      if (isBlock(kid)) {
        groups.push({ block: kid });
      } else {
        let g = groups[groups.length - 1];
        if (!g || !g.inline) {
          g = { inline: [] };
          groups.push(g);
        }
        g.inline.push(kid);
      }
    }
    return groups.filter((g) => g.block || pre || g.inline.some((n) => typeof n !== 'string' || n.trim()));
  }

  function flow(node, c, show) {
    const groups = groupsOf(node.k, c.pre);
    if (!groups.length) return '';
    if (groups.length === 1 && groups[0].inline) return leaf(node, groups[0].inline, c, show);
    if (groups.length === 1) return block(groups[0].block, c, show);
    if (groups.every((g) => g.block)) return layout(groups.map((g) => g.block), node, c, show);
    return groups.map((g) => (g.block ? block(g.block, c, show) : run(g.inline, c, show) + '\n')).join('');
  }

  function dominantSize(nodes, ctx) {
    const tally = new Map();
    const walk = (list, cx) => {
      for (const n of list) {
        if (typeof n === 'string') {
          const len = n.trim().length;
          if (len) tally.set(cx.fs, (tally.get(cx.fs) || 0) + len);
        } else if (n.k) {
          walk(n.k, applyStyle(cx, n.s));
        }
      }
    };
    walk(nodes, ctx);
    let best = ctx.fs;
    let bestLen = -1;
    tally.forEach((len, fs) => {
      if (len > bestLen) {
        best = fs;
        bestLen = len;
      }
    });
    return best;
  }

  function headingLevel(fs, tag) {
    if (fs >= 30) return 1;
    if (fs >= 23) return 2;
    if (fs >= 19) return 3;
    if (/^h[1-3]$/.test(tag) && fs >= 17) return 3;
    return 0;
  }

  function leaf(node, nodes, c, show) {
    const len = nodes.reduce((sum, n) => sum + textLength(n), 0);
    if (len > 0 && len <= 200 && !c.pre) {
      const fs = dominantSize(nodes, c);
      const level = headingLevel(fs, node.t);
      if (level) {
        const hShow = Object.assign({}, show, { fw: 1, size: HEADING_SIZE[level] });
        const hCtx = Object.assign({}, c, { fs: c.fs === fs && sizeIndex(fs) < 7 ? SIZE_PX[HEADING_SIZE[level]] : c.fs });
        const inner = run(nodes, hCtx, hShow);
        return inner ? `<h${level}>${inner}</h${level}>\n` : '';
      }
    }
    const inner = run(nodes, c, show);
    if (!inner) return '';
    if (node.t === 'p' || len > 180) return `<p>${inner}</p>\n`;
    return `<div>${inner}</div>\n`;
  }

  function stack(items, c, show) {
    let html = '';
    let prev = null;
    for (const item of items) {
      const part = block(item, c, show);
      if (!part.trim()) continue;
      if (prev && prev.b && item.b && item.b[1] - (prev.b[1] + prev.b[3]) >= 18 && !/<\/(p|h\d|ul|ol|dl|blockquote)>\s*$|<br>\s*$|<hr>\s*$/.test(html)) {
        html += '<br>\n';
      }
      html += part;
      prev = item;
    }
    return html;
  }

  function buildRows(items) {
    const sorted = items.slice().sort((a, b) => a.b[1] - b.b[1] || a.b[0] - b.b[0]);
    const rows = [];
    let row = null;
    for (const item of sorted) {
      const [x, y, w, h] = item.b;
      if (row && y < row.bottom - 3) {
        let best = null;
        let bestOverlap = 0;
        for (const col of row.cols) {
          const overlap = Math.min(col.right, x + w) - Math.max(col.left, x);
          if (overlap > bestOverlap) {
            bestOverlap = overlap;
            best = col;
          }
        }
        if (best && bestOverlap > Math.min(8, w * 0.3)) {
          best.items.push(item);
          best.left = Math.min(best.left, x);
          best.right = Math.max(best.right, x + w);
        } else {
          row.cols.push({ left: x, right: x + w, items: [item] });
        }
        row.bottom = Math.max(row.bottom, y + h);
      } else {
        row = { top: y, bottom: y + h, cols: [{ left: x, right: x + w, items: [item] }] };
        rows.push(row);
      }
    }
    rows.forEach((r) => r.cols.sort((a, b) => a.left - b.left));
    return rows;
  }

  function isInlineRow(row) {
    if (row.cols.length < 2) return false;
    let total = 0;
    for (const col of row.cols) {
      if (col.items.length !== 1) return false;
      const item = col.items[0];
      if (item.t === 'table' || item.t === 'form' || item.t === 'iframe' || item.t === 'video') return false;
      if (item.t === 'img') {
        if (largestImage(item) > 48) return false;
        continue;
      }
      const len = textLength(item);
      if (len > 80 || countBlocks(item, 4) > 4 || largestImage(item) > 48) return false;
      total += len;
    }
    return total <= 420;
  }

  function sameGrid(a, b) {
    if (a.cols.length !== b.cols.length || isInlineRow(b)) return false;
    return a.cols.every((col, i) => Math.abs(col.left - b.cols[i].left) <= 16);
  }

  function rowAlign(row, node) {
    if (!node.b) return '';
    const left = row.cols[0].left - node.b[0];
    const right = node.b[0] + node.b[2] - row.cols[row.cols.length - 1].right;
    if (left > 24 && Math.abs(left - right) < Math.max(16, node.b[2] * 0.05)) return 'center';
    if (left > node.b[2] * 0.4 && right < 40) return 'right';
    return '';
  }

  function inlineRow(row, node, c, show) {
    const parts = row.cols.map((col) => run([inlineCopy(col.items[0])], c, show)).filter(hasContent);
    if (!parts.length) return '';
    const allLinks = row.cols.every((col) => containsLink(col.items[0]));
    const html = parts.join(allLinks ? ' | ' : ' &nbsp; ');
    const align = rowAlign(row, node);
    const target = align || c.ta || '';
    return target && target !== show.ta ? `<div align="${target}">${html}</div>\n` : `<div>${html}</div>\n`;
  }

  function gridTable(rows, node, c, show) {
    const containerW = (node.b && node.b[2]) || (c.pbox && c.pbox[2]) || OUT_WIDTH;
    const first = rows[0];
    const left = Math.min(...rows.map((r) => r.cols[0].left));
    const right = Math.max(...rows.map((r) => r.cols[r.cols.length - 1].right));
    const spanPct = Math.round((right - left) / containerW * 100);
    const widths = first.cols.map((col) => Math.max(1, col.right - col.left));
    const total = widths.reduce((a, b) => a + b, 0);
    const pcts = widths.map((w) => Math.max(1, Math.round(w / total * 100)));
    let gap = 0;
    for (let i = 1; i < first.cols.length; i++) gap += Math.max(0, first.cols[i].left - first.cols[i - 1].right);
    gap = first.cols.length > 1 ? gap / (first.cols.length - 1) : 0;
    const pad = Math.max(2, Math.min(10, Math.round(gap * scale / 2)));
    const tableW = spanPct >= 92 ? 100 : Math.max(10, spanPct);
    const align = rowAlign({ cols: [{ left, right }] }, node);
    const outerWidth = Math.round((c.width || OUT_WIDTH) * tableW / 100);
    let html = `<table width="${tableW}%" border="0" cellspacing="0" cellpadding="${pad}"${align === 'center' ? ' align="center"' : ''}>\n`;
    for (const row of rows) {
      html += '<tr>';
      row.cols.forEach((col, i) => {
        const pct = pcts[i] || Math.round(100 / row.cols.length);
        const cc = Object.assign({}, c, {
          tables: c.tables + 1,
          width: Math.max(40, Math.round(outerWidth * pct / 100) - pad * 2),
          pbox: [col.left, row.top, col.right - col.left, row.bottom - row.top]
        });
        let attrs = ` valign="top" width="${pct}%"`;
        let items = col.items;
        if (items.length === 1) {
          const box = boxOf(items[0], c);
          if (box && box.bg && !box.bd) {
            attrs += ` bgcolor="${box.bg}"`;
            if (box.bi) attrs += ` background="${esc(gwImage(box.bi))}"`;
            cc.bg = items[0].s.bg;
          }
        }
        const cshow = cellShow();
        if (cc.ta) {
          attrs += ` align="${cc.ta}"`;
          cshow.ta = cc.ta;
        }
        const inner = stack(items, cc, cshow);
        html += `<td${attrs}>${inner.trim() ? inner : '&nbsp;'}</td>`;
      });
      html += '</tr>\n';
    }
    return html + '</table>\n';
  }

  function layout(items, node, c, show) {
    if (!geo || items.length < 2 || items.some((n) => !n.b) || c.tables >= MAX_LAYOUT_TABLES) return stack(items, c, show);
    const rows = buildRows(items);
    if (rows.every((r) => r.cols.length === 1)) return stack(rows.map((r) => r.cols[0].items).flat(), c, show);
    let html = '';
    let i = 0;
    while (i < rows.length) {
      const row = rows[i];
      if (row.cols.length === 1) {
        const items1 = [];
        while (i < rows.length && rows[i].cols.length === 1) {
          items1.push(...rows[i].cols[0].items);
          i++;
        }
        html += stack(items1, c, show);
        continue;
      }
      if (isInlineRow(row)) {
        html += inlineRow(row, node, c, show);
        i++;
        continue;
      }
      const group = [row];
      while (i + group.length < rows.length && sameGrid(row, rows[i + group.length])) group.push(rows[i + group.length]);
      html += gridTable(group, node, c, show);
      i += group.length;
    }
    return html;
  }

  function list(node, c, show) {
    const tag = node.t === 'ol' ? 'ol' : 'ul';
    const start = tag === 'ol' && node.a && node.a.start ? ` start="${node.a.start}"` : '';
    let html = `<${tag}${start}>\n`;
    for (const kid of node.k || []) {
      if (typeof kid === 'string') {
        if (kid.trim()) html += run([kid], c, show);
        continue;
      }
      if (kid.t !== 'li') {
        html += block(kid, c, show);
        continue;
      }
      const lc = enter(kid, c);
      const anchor = kid.a && kid.a.id ? `<a name="${esc(kid.a.id)}"></a>` : '';
      const groups = groupsOf(kid.k, false);
      const inner = groups.length === 1 && groups[0].inline ? run(groups[0].inline, lc, show) : flow(kid, lc, show);
      if (inner.trim()) html += `<li>${anchor}${inner}\n`;
    }
    return html + `</${tag}>\n`;
  }

  function definitionList(node, c, show) {
    let html = '<dl>\n';
    for (const kid of node.k || []) {
      if (typeof kid === 'string') continue;
      const kc = enter(kid, c);
      if (kid.t === 'dt') html += `<dt>${flow(kid, kc, show)}\n`;
      else if (kid.t === 'dd') html += `<dd>${flow(kid, kc, show)}\n`;
      else html += block(kid, c, show);
    }
    return html + '</dl>\n';
  }

  function preformatted(node, c, show) {
    const pc = Object.assign({}, c, { pre: true, ff: 'mono' });
    const pshow = Object.assign({}, show, { face: 'mono' });
    const nodes = (node.k || []).map((k) => (isBlock(k) ? inlineCopy(k) : k));
    const w = wrap(pc, pshow);
    const inner = inlineList(nodes, pc, w.show);
    return inner.trim() ? `<pre>${w.open}${inner}${w.close}</pre>\n` : '';
  }

  function form(node, c, show) {
    const a = node.a || {};
    const action = a.action || '';
    const active = (a.method || 'get') === 'get' && /^https?:/i.test(action);
    const state = { active, hasText: false, hasSubmit: false };
    const fc = Object.assign({}, c, { form: state });
    const inner = flow(node, fc, show);
    if (!active) return inner;
    if (!state.hasText && !state.hasSubmit) return inner;
    const submit = state.hasText && !state.hasSubmit ? ' <input type="submit" value="Искать!">' : '';
    return `<form action="${esc(formAction)}" method="get"><input type="hidden" name="__ns_action" value="${esc(action)}">\n${inner}${submit}</form>\n`;
  }

  function table(node, ctx, show) {
    const rows = [];
    let caption = null;
    const collect = (n) => {
      for (const kid of n.k || []) {
        if (typeof kid === 'string') continue;
        if (kid.t === 'tr') rows.push(kid);
        else if (kid.t === 'caption') caption = kid;
        else if (kid.t === 'thead' || kid.t === 'tbody' || kid.t === 'tfoot') collect(kid);
      }
    };
    collect(node);
    const c = enter(node, ctx);
    if (!rows.length) return flow(node, c, show);
    c.tables = ctx.tables + 1;
    const cellsOf = (tr) => (tr.k || []).filter((k) => typeof k !== 'string' && (k.t === 'td' || k.t === 'th'));
    const border = (node.s && node.s.bd) || rows.some((tr) => cellsOf(tr).some((cell) => cell.s && cell.s.bd)) ? 1 : 0;
    const tableBg = node.s && node.s.bg ? node.s.bg : null;
    const attrs = [`border="${border}"`, 'cellspacing="0"', `cellpadding="${border ? 4 : 2}"`];
    let share = widthShare(node, ctx);
    if (!node.b && node.wp) {
      const m = /^(\d+)(%?)$/.exec(node.wp);
      if (m) share = m[2] ? Math.min(1, +m[1] / 100) : Math.min(1, +m[1] / OUT_WIDTH);
    }
    if (share < 0.97 || node.b) attrs.push(`width="${Math.max(5, Math.round(share * 100))}%"`);
    if (node.fl) attrs.push(`align="${node.fl === 'l' ? 'left' : 'right'}"`);
    else if (isCentered(node, ctx)) attrs.push('align="center"');
    if (tableBg) attrs.push(`bgcolor="${paint(tableBg)}"`);
    const tableWidth = Math.round((ctx.width || OUT_WIDTH) * share);
    const anchor = node.a && node.a.id ? `<a name="${esc(node.a.id)}"></a>` : '';
    let html = `${anchor}<table ${attrs.join(' ')}>\n`;
    if (caption) {
      const cc = enter(caption, c);
      html += `<caption>${flow(caption, cc, cellShow())}</caption>\n`;
    }
    rows.forEach((tr, rowIndex) => {
      const rc = enter(tr, c);
      const rowBg = tr.s && tr.s.bg ? tr.s.bg : null;
      html += rowBg ? `<tr bgcolor="${paint(rowBg)}">` : '<tr>';
      for (const cell of cellsOf(tr)) {
        const cc = enter(cell, rc);
        const a = cell.a || {};
        let cattrs = ' valign="top"';
        if (a.cs) cattrs += ` colspan="${a.cs}"`;
        if (a.rs) cattrs += ` rowspan="${a.rs}"`;
        if (cell.s && cell.s.bg) cattrs += ` bgcolor="${paint(cell.s.bg)}"`;
        if (cell.s && cell.s.bi) cattrs += ` background="${esc(gwImage(cell.s.bi))}"`;
        let cshare = 0;
        if (cell.b && node.b && node.b[2]) cshare = cell.b[2] / node.b[2];
        else if (cell.wp && /%$/.test(cell.wp)) cshare = parseInt(cell.wp, 10) / 100;
        if (rowIndex === 0 && cshare && !a.cs) cattrs += ` width="${Math.max(1, Math.round(cshare * 100))}%"`;
        cc.width = Math.max(30, Math.round(tableWidth * (cshare || 1 / Math.max(1, cellsOf(tr).length))) - 8);
        const cshow = cellShow();
        if (cell.t === 'th') cshow.fw = 1;
        if (cell.t === 'th' && !cc.ta) cc.ta = 'center';
        if (cc.ta) {
          cattrs += ` align="${cc.ta}"`;
          cshow.ta = cc.ta;
        }
        const inner = flow(cell, cc, cshow);
        html += `<${cell.t}${cattrs}>${inner.trim() ? inner : '&nbsp;'}</${cell.t}>`;
      }
      html += '</tr>\n';
    });
    return html + '</table>\n';
  }

  let body = snap.tree ? block(snap.tree, rootCtx, rootShow) : '';
  if (!hasContent(body)) body = '<p><i>Документ не содержит данных.</i></p>';

  const vid = youtubeId(url);
  if (vid || (snap.text || 0) < 200) {
    const card = metaCard(snap, url, gwPage, gwImage, websafeColors);
    if (card) body = card + body;
  }

  const notes = (options.notes || []).filter(Boolean);
  let footer = '';
  if (options.decorate !== false) footer += decorations(snap, url, textColor);
  if (notes.length) {
    footer += `\n<p align="right"><font face="Arial, Helvetica" size="1" color="${readable('#808080', pageBg)}">${notes.map((n) => '[ ' + esc(n) + ' ]').join('<br>')}</font></p>`;
  }

  let bodyAttrs = `bgcolor="${pageBg}" text="${textColor}" link="${linkColor}" vlink="${visitedColor}" alink="#FF0000"`;
  if (base.bi) bodyAttrs += ` background="${esc(/^data:/i.test(base.bi) ? base.bi : gwImage(base.bi))}"`;

  const title = (snap.title || hostOf(url)).slice(0, 140);
  return documentShell({
    url,
    title,
    bodyAttrs,
    css: baseCss(rootFace, SIZE_PX[rootSize], textColor, options.websafeImages !== false && websafeColors),
    body: tidy(body + footer),
    websafeImages: options.websafeImages !== false && websafeColors
  });
}

function simplePage(url, title, body, options = {}) {
  const websafeImages = !!options.websafeImages;
  return documentShell({
    url: url || 'about:blank',
    title,
    bodyAttrs: 'bgcolor="#C0C0C0" text="#000000" link="#0000FF" vlink="#663399" alink="#FF0000"',
    css: baseCss('serif', 16, '#000000', websafeImages),
    body,
    websafeImages
  });
}

function errorDocument(url, message) {
  return simplePage(url, 'Ошибка соединения',
    '<table width="100%" border="0" cellpadding="12"><tr><td>' +
    '<table width="100%" border="2" cellspacing="0" cellpadding="14" bgcolor="#FFFFFF"><tr><td>' +
    '<h1><font color="#800000">Сервер не отвечает</font></h1>' +
    `<p>Netscape не может открыть <tt>${esc(url || '')}</tt></p>` +
    `<p><b>Причина:</b> ${esc(message)}</p><hr>` +
    '<p>Проверьте подключение к сети и правильность адреса.<br>Возможно, сервер перегружен или временно недоступен.</p>' +
    '</td></tr></table></td></tr></table>');
}

function imageDocument(url, gatewayImage, options = {}) {
  const gw = gatewayImage || defaultGatewayImage;
  const name = decodeURIComponent((String(url).split('?')[0].split('/').pop() || hostOf(url)));
  return simplePage(url, name, `<center><img src="${esc(gw(url))}" border="0" alt="${esc(name)}"></center>`, options);
}

function textDocument(url, text) {
  const name = decodeURIComponent((String(url).split('?')[0].split('/').pop() || hostOf(url)));
  return documentShell({
    url,
    title: name,
    bodyAttrs: 'bgcolor="#FFFFFF" text="#000000" link="#0000FF" vlink="#663399" alink="#FF0000"',
    css: baseCss('mono', 13, '#000000', false),
    body: `<pre>${esc(String(text || '').slice(0, 400000))}</pre>`,
    websafeImages: false
  });
}

function fileDocument(url, info) {
  const name = decodeURIComponent((String(url).split('?')[0].split('/').pop() || hostOf(url)));
  const size = info.size ? (info.size > 1048576 ? (info.size / 1048576).toFixed(1) + ' МБ' : Math.max(1, Math.round(info.size / 1024)) + ' КБ') : 'неизвестен';
  return simplePage(url, name,
    '<table width="100%" border="0" cellpadding="12"><tr><td>' +
    '<table width="100%" border="2" cellspacing="0" cellpadding="14" bgcolor="#FFFFFF"><tr><td>' +
    '<h2><font color="#000080">Netscape не может показать этот файл</font></h2>' +
    `<p><b>Файл:</b> <tt>${esc(name)}</tt><br><b>Тип:</b> <tt>${esc(info.type || 'unknown')}</tt><br><b>Размер:</b> ${esc(size)}</p>` +
    '<p>Для просмотра нужен внешний модуль (plug-in). Сохранить файл через шлюз Web 1.0 нельзя.</p>' +
    '</td></tr></table></td></tr></table>');
}

module.exports = {
  transcode,
  errorDocument,
  imageDocument,
  textDocument,
  fileDocument,
  websafe,
  sizeIndex,
  youtubeId,
  OUT_WIDTH
};
