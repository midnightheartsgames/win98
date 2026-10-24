function pageSnapshot(options) {
  const opts = options || {};
  const doc = document;
  const viewW = window.innerWidth || 1024;
  const viewH = window.innerHeight || 768;
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;
  const here = location.href.split('#')[0];
  let budget = opts.maxNodes || 20000;
  let textBudget = opts.maxText || 600000;

  const SKIP_TAGS = new Set([
    'script', 'style', 'template', 'head', 'meta', 'link', 'title', 'canvas', 'audio',
    'object', 'embed', 'param', 'source', 'track', 'map', 'area', 'datalist', 'dialog',
    'math', 'portal', 'frameset', 'frame', 'wbr'
  ]);
  const GENERIC_INLINE = new Set(['span', 'font', 'label', 'small', 'big', 'abbr', 'time', 'data', 'bdi', 'bdo', 'nobr', 'picture']);
  const NOISE = /(^|[\s_-])(cookies?|consent|gdpr|onetrust|cookiebar|cmp-banner|ads?|advert|advertisement|adsbygoogle|adfox|yandex_rtb|adslot|ad-slot|sponsored|banner-ad|skip-link|skiplink|visually-hidden|sr-only|screen-reader-text)([\s_-]|$)/i;
  const ICON_FONT = /icon|material symbols|material-symbols|fontawesome|font awesome|glyph|dashicons|ionicons|feather/i;
  const PAINT_PROPS = ['fill', 'stroke', 'stroke-width', 'fill-opacity', 'stroke-opacity', 'opacity', 'fill-rule', 'stop-color', 'stop-opacity', 'display', 'visibility'];

  const colorCache = new Map();
  let probe = null;

  function probeColor(value) {
    if (!probe) {
      const canvas = doc.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      probe = canvas.getContext('2d', { willReadFrequently: true });
    }
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = '#000000';
    probe.fillStyle = value;
    probe.fillRect(0, 0, 1, 1);
    const d = probe.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  }

  function parseColor(value) {
    if (!value) return null;
    if (colorCache.has(value)) return colorCache.get(value);
    let rgba;
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(value);
    if (m) {
      const alpha = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      rgba = [+m[1], +m[2], +m[3], alpha];
    } else if (value === 'transparent') {
      rgba = [0, 0, 0, 0];
    } else {
      rgba = probeColor(value);
    }
    colorCache.set(value, rgba);
    return rgba;
  }

  function toHex(rgb) {
    return '#' + [0, 1, 2].map((i) => Math.max(0, Math.min(255, Math.round(rgb[i]))).toString(16).padStart(2, '0')).join('');
  }

  function blend(rgba, under) {
    const a = rgba[3];
    return [0, 1, 2].map((i) => rgba[i] * a + under[i] * (1 - a));
  }

  function fontClass(family) {
    const first = String(family || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    if (first === 'monospace' || /mono|courier|consol|menlo|monaco|code/.test(first)) return 'mono';
    if (/sans/.test(first)) return 'sans';
    if (first === 'serif' || /georgia|times|garamond|merriweather|playfair|lora|charter|cambria|palatino|baskerville|serif|literata|minion|book antiqua/.test(first)) return 'serif';
    return 'sans';
  }

  function alignOf(cs) {
    let ta = cs.textAlign;
    const rtl = cs.direction === 'rtl';
    if (ta === 'start') ta = rtl ? 'right' : 'left';
    if (ta === 'end') ta = rtl ? 'left' : 'right';
    if (ta === '-webkit-center') ta = 'center';
    if (ta === '-webkit-right') ta = 'right';
    return ta === 'center' || ta === 'right' ? ta : '';
  }

  function styleOf(cs, bgEff) {
    const c = parseColor(cs.color) || [0, 0, 0, 1];
    const weight = parseInt(cs.fontWeight, 10) || (cs.fontWeight === 'bold' ? 700 : 400);
    return {
      c: toHex(blend(c, bgEff)),
      fs: Math.round(parseFloat(cs.fontSize) || 16),
      fw: weight >= 600 ? 1 : 0,
      it: /italic|oblique/.test(cs.fontStyle) ? 1 : 0,
      ff: fontClass(cs.fontFamily),
      ta: alignOf(cs)
    };
  }

  const INHERITED = ['c', 'fs', 'fw', 'it', 'ff', 'ta'];

  function diffStyle(st, base) {
    let s = null;
    for (const k of INHERITED) {
      if (st[k] !== base[k]) {
        if (!s) s = {};
        s[k] = st[k];
      }
    }
    return s;
  }

  function firstUrl(value) {
    const m = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(value || '');
    return m ? m[1] : null;
  }

  function gradientColor(value, bgEff) {
    const found = String(value || '').match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/gi);
    if (!found || !found.length) return null;
    const picks = found.slice(0, 2).map((v) => parseColor(v)).filter(Boolean).map((rgba) => blend(rgba, bgEff));
    if (!picks.length) return null;
    const avg = [0, 1, 2].map((i) => picks.reduce((sum, p) => sum + p[i], 0) / picks.length);
    return avg;
  }

  function hasBorder(cs) {
    let sides = 0;
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const width = parseFloat(cs['border' + side + 'Width']) || 0;
      const style = cs['border' + side + 'Style'];
      const color = parseColor(cs['border' + side + 'Color']);
      if (width >= 1 && style !== 'none' && style !== 'hidden' && color && color[3] > 0.3) sides++;
    }
    return sides >= 3;
  }

  function attrText(el) {
    return (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 120);
  }

  function noiseName(el) {
    const cls = el.getAttribute('class') || '';
    const id = el.id || '';
    return NOISE.test(cls) || NOISE.test(id);
  }

  function boxOf(r) {
    return [Math.round(r.left + scrollX), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)];
  }

  function kidsOf(el) {
    if (el.shadowRoot) return el.shadowRoot.childNodes;
    if (el.localName === 'slot') {
      const assigned = el.assignedNodes({ flatten: true });
      return assigned.length ? assigned : el.childNodes;
    }
    return el.childNodes;
  }

  const fragTargets = new Set();
  doc.querySelectorAll('a[href*="#"]').forEach((a) => {
    const href = a.href || '';
    const i = href.indexOf('#');
    if (i > 0 && href.slice(0, i) === here && href.length > i + 1) {
      try {
        fragTargets.add(decodeURIComponent(href.slice(i + 1)));
      } catch (e) {
        fragTargets.add(href.slice(i + 1));
      }
    }
  });

  function linkTarget(a) {
    const raw = a.getAttribute('href');
    if (!raw || /^\s*javascript:/i.test(raw)) return null;
    const href = a.href;
    if (!href) return null;
    const i = href.indexOf('#');
    if (i > 0 && href.slice(0, i) === here) return href.length > i + 1 ? href.slice(i) : null;
    if (/^(https?|mailto|ftp):/i.test(href)) return href;
    return null;
  }

  function pushText(out, value) {
    if (!value) return;
    const last = out[out.length - 1];
    if (value === ' ' && (out.length === 0 || (typeof last === 'string' && /\s$/.test(last)))) return;
    textBudget -= value.length;
    if (typeof last === 'string') out[out.length - 1] = last + value;
    else out.push(value);
  }

  function serializeSvg(el, cs, r) {
    const all = el.querySelectorAll('*');
    if (all.length > 800) return null;
    const clone = el.cloneNode(true);
    const cloned = clone.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      const ocs = getComputedStyle(all[i]);
      const parts = [];
      for (const prop of PAINT_PROPS) {
        const v = ocs.getPropertyValue(prop);
        if (v) parts.push(prop + ':' + v);
      }
      if (cloned[i]) {
        cloned[i].setAttribute('style', parts.join(';'));
        cloned[i].removeAttribute('class');
      }
    }
    const external = Array.from(clone.querySelectorAll('use')).some((use) => !(use.getAttribute('href') || use.getAttribute('xlink:href') || '#').startsWith('#'));
    if (external) return null;
    clone.querySelectorAll('use').forEach((use) => {
      const ref = use.getAttribute('href') || use.getAttribute('xlink:href') || '';
      if (!ref.startsWith('#')) return;
      const target = doc.getElementById(ref.slice(1));
      if (!target) return;
      const isSymbol = target.localName === 'symbol';
      const group = doc.createElementNS('http://www.w3.org/2000/svg', isSymbol ? 'svg' : 'g');
      if (isSymbol) {
        const vb = target.getAttribute('viewBox');
        if (vb) group.setAttribute('viewBox', vb);
        ['x', 'y', 'width', 'height'].forEach((k) => {
          if (use.hasAttribute(k)) group.setAttribute(k, use.getAttribute(k));
        });
        group.innerHTML = target.innerHTML;
      } else {
        group.appendChild(target.cloneNode(true));
      }
      const style = use.getAttribute('style');
      if (style) group.setAttribute('style', style);
      use.replaceWith(group);
    });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(Math.round(r.width)));
    clone.setAttribute('height', String(Math.round(r.height)));
    clone.removeAttribute('class');
    const paint = [];
    for (const prop of PAINT_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (v && prop !== 'display' && prop !== 'visibility') paint.push(prop + ':' + v);
    }
    paint.push('color:' + cs.color);
    clone.setAttribute('style', paint.join(';'));
    const xml = new XMLSerializer().serializeToString(clone);
    if (xml.length > 90000) return null;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  }

  function imageSource(el) {
    let src = el.currentSrc || el.src || '';
    if (!src || (/^data:/i.test(src) && src.length < 600)) {
      const lazy = el.getAttribute('data-src') || el.getAttribute('data-lazy-src') ||
        el.getAttribute('data-original') || el.getAttribute('data-lazy') ||
        (el.getAttribute('data-srcset') || '').trim().split(/[\s,]+/)[0];
      if (lazy) {
        try {
          src = new URL(lazy, doc.baseURI).href;
        } catch (e) {}
      }
    }
    if (!src || src.length > 200000) return null;
    if (/^data:/i.test(src) && src.length < 600 && !el.naturalWidth) return null;
    return src;
  }

  function visitControl(el, tag, cs, r, out) {
    if (tag === 'input') {
      const type = (el.type || 'text').toLowerCase();
      if (type === 'file' || type === 'color' || type === 'range') return;
      out.push({ t: 'input', a: { type, name: el.name || '', value: type === 'password' ? '' : String(el.value || '').slice(0, 300), ph: el.placeholder || '', ch: el.checked ? 1 : 0, w: Math.round(r.width), al: attrText(el) } });
      return;
    }
    if (tag === 'select') {
      const options = Array.from(el.options || []).slice(0, 250).map((o) => ({ t: 'option', a: { v: o.value, sel: o.selected ? 1 : 0 }, k: [String(o.text || '').trim().slice(0, 120)] }));
      out.push({ t: 'select', a: { name: el.name || '', multiple: el.multiple ? 1 : 0 }, k: options });
      return;
    }
    if (tag === 'textarea') {
      out.push({ t: 'textarea', a: { name: el.name || '', value: String(el.value || '').slice(0, 4000), w: Math.round(r.width), h: Math.round(r.height) } });
      return;
    }
    if (tag === 'button') {
      const label = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) || attrText(el);
      out.push({ t: 'button', a: { type: (el.getAttribute('type') || 'submit').toLowerCase(), name: el.name || '', value: el.value || '', label } });
    }
  }

  function visit(el, ctx, out, depth) {
    if (budget <= 0 || textBudget <= 0 || depth > 220) return;
    const tag = el.localName;
    if (!tag || SKIP_TAGS.has(tag)) return;
    if (tag === 'noscript' && opts.javascript !== false) return;
    if (tag === 'input' && String(el.type).toLowerCase() === 'hidden') {
      if (el.name) out.push({ t: 'input', a: { type: 'hidden', name: el.name, value: String(el.value || '').slice(0, 500) } });
      return;
    }
    const cs = getComputedStyle(el);
    const display = cs.display;
    if (display === 'none') return;
    if (display === 'contents') {
      walk(el, { base: ctx.base, bgEff: ctx.bgEff, pre: /^pre|break-spaces/.test(cs.whiteSpace), up: cs.textTransform === 'uppercase', icon: ctx.icon || ICON_FONT.test(cs.fontFamily) }, out, depth + 1);
      return;
    }
    if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return;
    if (parseFloat(cs.opacity) < 0.05) return;
    if (noiseName(el)) return;

    const r = el.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    const clipped = cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || cs.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\(50%\)/.test(cs.clipPath);
    if ((w < 2 || h < 2) && clipped) return;
    const position = cs.position;
    if (w > 0 && (r.left + scrollX >= viewW || r.right + scrollX <= 0)) return;
    if ((position === 'absolute' || position === 'fixed') && r.bottom + scrollY < 0) return;
    if (position === 'fixed') {
      const topBar = r.top <= 180 && h <= 220 && w >= viewW * 0.6;
      if (!topBar) return;
    }
    if (el.getAttribute('aria-hidden') === 'true' && w * h < 40000 && tag !== 'img' && !el.querySelector('img')) {
      const linkedLogo = tag === 'svg' && w >= 24 && h >= 24 && el.closest('a[href]');
      if (!linkedLogo) return;
    }
    if (el.getAttribute('role') === 'dialog' && position !== 'static') return;

    budget--;

    if (tag === 'br') {
      out.push({ t: 'br' });
      return;
    }

    const isBlock = display.startsWith('inline') ? display !== 'inline' && (w >= 220 || h >= 90) : display !== 'ruby';
    const inlineBlock = display.startsWith('inline') && display !== 'inline' && !isBlock;
    const float = cs.cssFloat === 'left' || cs.cssFloat === 'right' ? cs.cssFloat[0] : '';

    if (tag === 'img') {
      if (w < 2 || h < 2) return;
      const src = imageSource(el);
      if (!src) return;
      const node = { t: 'img', a: { src, alt: (el.alt || el.title || '').trim().slice(0, 200) }, b: boxOf(r) };
      if (isBlock) node.d = 1;
      if (float) node.fl = float;
      out.push(node);
      return;
    }

    if (tag === 'svg') {
      if (w < 16 || h < 16 || w * h > 900 * 700) return;
      const src = serializeSvg(el, cs, r);
      if (!src) return;
      const titleEl = el.querySelector('title');
      const node = { t: 'img', a: { src, alt: attrText(el) || (titleEl ? titleEl.textContent.trim().slice(0, 120) : '') }, b: boxOf(r) };
      if (isBlock) node.d = 1;
      if (float) node.fl = float;
      out.push(node);
      return;
    }

    if (tag === 'iframe') {
      if (w < 60 || h < 40) return;
      out.push({ t: 'iframe', d: 1, b: boxOf(r), a: { src: el.src || '', title: (el.title || '').trim().slice(0, 160) } });
      return;
    }

    if (tag === 'video') {
      if (w < 60 || h < 40) return;
      out.push({ t: 'video', d: 1, b: boxOf(r), a: { poster: el.poster || '', src: el.currentSrc || el.src || '', title: attrText(el) } });
      return;
    }

    if (tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'button') {
      visitControl(el, tag, cs, r, out);
      return;
    }

    const st = styleOf(cs, ctx.bgEff);
    const node = { t: tag };
    let s = diffStyle(st, ctx.base);
    let bgEff = ctx.bgEff;

    const bgColor = parseColor(cs.backgroundColor);
    let bgRgb = null;
    if (bgColor && bgColor[3] > 0.1) bgRgb = blend(bgColor, ctx.bgEff);
    const bgImage = cs.backgroundImage;
    let bi = null;
    if (bgImage && bgImage !== 'none') {
      if (/gradient/.test(bgImage)) {
        if (!bgRgb) bgRgb = gradientColor(bgImage, ctx.bgEff);
      } else if (w >= 40 && h >= 40) {
        bi = firstUrl(bgImage);
      }
    }
    if (bgRgb) {
      const hex = toHex(bgRgb);
      if (hex !== toHex(ctx.bgEff)) {
        s = s || {};
        s.bg = hex;
      }
      bgEff = bgRgb;
    }
    if (bi) {
      s = s || {};
      s.bi = bi;
    }
    if (isBlock && w > 24 && h > 16 && hasBorder(cs)) {
      s = s || {};
      s.bd = 1;
    }
    const deco = cs.textDecorationLine || '';
    if (/underline/.test(deco) && tag !== 'a') {
      s = s || {};
      s.u = 1;
    }
    if (/line-through/.test(deco)) {
      s = s || {};
      s.x = 1;
    }
    if (s) node.s = s;

    if (isBlock) {
      node.d = 1;
      node.b = boxOf(r);
    }
    if (inlineBlock) node.ib = 1;
    if (float) node.fl = float;

    const attrs = {};
    if (tag === 'a') {
      const target = linkTarget(el);
      if (target) attrs.h = target;
      const label = attrText(el);
      if (label) attrs.al = label;
    }
    if (el.id && fragTargets.has(el.id)) attrs.id = el.id;
    if (tag === 'a' && el.name && fragTargets.has(el.name)) attrs.id = el.name;
    if (tag === 'td' || tag === 'th') {
      if (el.colSpan > 1) attrs.cs = el.colSpan;
      if (el.rowSpan > 1) attrs.rs = el.rowSpan;
    }
    if (tag === 'form') {
      let action = here;
      try {
        action = new URL(el.getAttribute('action') || here, doc.baseURI).href;
      } catch (e) {}
      attrs.action = action;
      attrs.method = (el.getAttribute('method') || 'get').toLowerCase();
    }
    if (tag === 'ol' && el.start && el.start !== 1) attrs.start = el.start;
    if (tag === 'li' && display === 'list-item' && cs.listStyleType !== 'none') node.mk = 1;
    if (Object.keys(attrs).length) node.a = attrs;

    node.k = [];
    walk(el, {
      base: st,
      bgEff,
      pre: /^pre|break-spaces/.test(cs.whiteSpace),
      up: cs.textTransform === 'uppercase',
      icon: ICON_FONT.test(cs.fontFamily)
    }, node.k, depth + 1);

    if (!node.k.length) {
      if (bi) {
        out.push({ t: 'img', a: { src: bi, alt: '' }, b: boxOf(r), d: isBlock ? 1 : 0, bgimg: 1 });
        return;
      }
      if (tag === 'hr' || (node.s && node.s.bg && isBlock && h <= 6 && w >= 120)) {
        out.push({ t: 'hr', d: 1, b: boxOf(r) });
        return;
      }
      if (tag !== 'td' && tag !== 'th' && !(attrs.id)) return;
    }

    if (!isBlock && !node.s && !node.a && !node.ib && GENERIC_INLINE.has(tag)) {
      for (const kid of node.k) {
        const last = out[out.length - 1];
        if (typeof kid === 'string' && typeof last === 'string') out[out.length - 1] = last + kid;
        else out.push(kid);
      }
      return;
    }
    out.push(node);
  }

  function walk(el, ctx, out, depth) {
    const kids = kidsOf(el);
    for (let i = 0; i < kids.length; i++) {
      if (budget <= 0 || textBudget <= 0) return;
      const child = kids[i];
      if (child.nodeType === 3) {
        if (ctx.icon) continue;
        let v = child.nodeValue || '';
        v = v.replace(/[\ue000-\uf8ff\u200b\u200e\u200f\ufeff]/g, '');
        if (!ctx.pre) v = v.replace(/[\t\n\r\f ]+/g, ' ');
        if (ctx.up) v = v.toUpperCase();
        pushText(out, v);
      } else if (child.nodeType === 1) {
        visit(child, ctx, out, depth);
      }
    }
  }

  const htmlCs = getComputedStyle(doc.documentElement);
  const body = doc.body || doc.documentElement;
  const bodyCs = getComputedStyle(body);
  let pageBg = parseColor(bodyCs.backgroundColor);
  if (!pageBg || pageBg[3] < 0.5) pageBg = parseColor(htmlCs.backgroundColor);
  if (!pageBg || pageBg[3] < 0.5) {
    const grad = gradientColor(bodyCs.backgroundImage, [255, 255, 255]) || gradientColor(htmlCs.backgroundImage, [255, 255, 255]);
    pageBg = grad ? grad.concat(1) : [255, 255, 255, 1];
  }
  const bgRgb = pageBg.slice(0, 3);
  const baseStyle = styleOf(bodyCs, bgRgb);
  const pageBi = firstUrl(bodyCs.backgroundImage) || firstUrl(htmlCs.backgroundImage);

  function sampleLinkColor() {
    const counts = new Map();
    const scan = (list) => {
      let n = 0;
      for (const a of list) {
        if (n > 300) break;
        const r = a.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const color = parseColor(getComputedStyle(a).color);
        if (!color) continue;
        const hex = toHex(color);
        counts.set(hex, (counts.get(hex) || 0) + 1);
        n++;
      }
      return n;
    };
    if (scan(doc.querySelectorAll('main p a[href], article p a[href], p a[href]')) < 5) {
      counts.clear();
      scan(doc.querySelectorAll('a[href]'));
    }
    let best = null;
    let bestCount = 0;
    counts.forEach((count, hex) => {
      if (count > bestCount) {
        best = hex;
        bestCount = count;
      }
    });
    return best || '#0000ee';
  }

  const root = { t: 'body', d: 1, b: [0, 0, viewW, Math.round(Math.max(body.scrollHeight || 0, viewH))], k: [] };
  walk(body, {
    base: baseStyle,
    bgEff: bgRgb,
    pre: false,
    up: bodyCs.textTransform === 'uppercase',
    icon: false
  }, root.k, 0);

  const metas = {};
  doc.querySelectorAll('meta[name], meta[property]').forEach((m) => {
    const key = (m.getAttribute('property') || m.getAttribute('name') || '').toLowerCase();
    const content = (m.getAttribute('content') || '').trim();
    if (key && content && !metas[key]) metas[key] = content.slice(0, 400);
  });

  return JSON.stringify({
    url: location.href,
    title: (doc.title || '').replace(/\s+/g, ' ').trim(),
    lang: doc.documentElement.lang || '',
    metas,
    lastModified: doc.lastModified || '',
    width: viewW,
    base: Object.assign({}, baseStyle, { bg: toHex(bgRgb), link: sampleLinkColor(), bi: pageBi || '' }),
    text: (body.innerText || '').length,
    truncated: budget <= 0 || textBudget <= 0,
    tree: root
  });
}

function snapshotExpression(options) {
  return '(' + pageSnapshot.toString() + ')(' + JSON.stringify(options || {}) + ')';
}

module.exports = { pageSnapshot, snapshotExpression };
