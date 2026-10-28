(function (root) {
  if (root.BugShot) return;

  const MAX_WIDTH = 1600;
  const MAX_BYTES = 1.5 * 1024 * 1024;
  const JPEG_QUALITY = 0.88;
  const MAX_ELEMENTS = 20000;
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE', 'TITLE', 'HEAD']);
  const SKIP_PROPS = /^(animation|transition|cursor|will-change|pointer-events|user-select|-webkit-user-select|caret-color|scroll-|overscroll|touch-action)/;
  const dataUrlCache = new Map();

  const doc = () => root.document;

  function makeCanvas(w, h) {
    const c = doc().createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  function inNextFrame(fn) {
    return new Promise((resolve, reject) => {
      root.requestAnimationFrame(() => {
        try { resolve(fn()); } catch (err) { reject(err); }
      });
    });
  }

  function copyCanvas(source) {
    const c = makeCanvas(source.width, source.height);
    c.getContext('2d').drawImage(source, 0, 0);
    return c;
  }

  function fitWidth(source, width, height) {
    const scale = Math.min(1, MAX_WIDTH / width);
    const c = makeCanvas(width * scale, height * scale);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = scale < 1;
    g.drawImage(source, 0, 0, c.width, c.height);
    return c;
  }

  async function fromPngBytes(bytes) {
    const bitmap = await root.createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const full = makeCanvas(bitmap.width, bitmap.height);
    full.getContext('2d').drawImage(bitmap, 0, 0);
    if (bitmap.close) bitmap.close();
    return full;
  }

  function snapshotCanvases() {
    const shots = new Map();
    doc().querySelectorAll('canvas').forEach(c => {
      if (!c.width || !c.height) return;
      try { shots.set(c, copyCanvas(c)); } catch (err) {}
    });
    return shots;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  function inlineUrl(url) {
    if (/^data:/i.test(url)) return Promise.resolve(url);
    if (!dataUrlCache.has(url)) {
      dataUrlCache.set(url, root.fetch(url).then(r => (r.ok ? r.blob() : null)).then(b => (b ? blobToDataUrl(b) : '')).catch(() => ''));
    }
    return dataUrlCache.get(url);
  }

  function imageDataUrl(img) {
    if (!img.complete || !img.naturalWidth) return '';
    try {
      const c = makeCanvas(img.naturalWidth, img.naturalHeight);
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/png');
    } catch (err) {
      return '';
    }
  }

  function videoDataUrl(video) {
    if (!video.videoWidth) return '';
    try {
      const c = makeCanvas(video.videoWidth, video.videoHeight);
      c.getContext('2d').drawImage(video, 0, 0);
      return c.toDataURL('image/jpeg', 0.85);
    } catch (err) {
      return '';
    }
  }

  function createDefaults() {
    const frame = doc().createElement('iframe');
    frame.style.cssText = 'position:fixed;left:-10px;top:-10px;width:1px;height:1px;border:0;visibility:hidden;';
    doc().body.appendChild(frame);
    const sandbox = frame.contentDocument;
    sandbox.open();
    sandbox.write('<!DOCTYPE html><html><body></body></html>');
    sandbox.close();
    const cache = new Map();
    return {
      of(tag) {
        if (!cache.has(tag)) {
          const el = sandbox.createElement(tag);
          sandbox.body.appendChild(el);
          const cs = frame.contentWindow.getComputedStyle(el);
          const values = {};
          for (let i = 0; i < cs.length; i++) values[cs[i]] = cs.getPropertyValue(cs[i]);
          sandbox.body.removeChild(el);
          cache.set(tag, values);
        }
        return cache.get(tag);
      },
      remove() { frame.remove(); }
    };
  }

  function styleText(cs, defaults) {
    let text = '';
    for (let i = 0; i < cs.length; i++) {
      const prop = cs[i];
      if (SKIP_PROPS.test(prop)) continue;
      const value = cs.getPropertyValue(prop);
      if (defaults[prop] === value) continue;
      text += prop + ':' + value + ';';
    }
    return text;
  }

  function placeholder(el, cs, label) {
    const box = doc().createElement('div');
    const r = el.getBoundingClientRect();
    box.setAttribute('style', 'display:' + (cs.display === 'inline' ? 'inline-block' : cs.display) + ';width:' + r.width + 'px;height:' + r.height + 'px;background:#c0c0c0;color:#000;font:11px sans-serif;overflow:hidden;' + (cs.position !== 'static' ? 'position:' + cs.position + ';left:' + cs.left + ';top:' + cs.top + ';' : ''));
    box.textContent = label;
    return box;
  }

  function cloneTree(node, state) {
    if (node.nodeType === 3) return doc().createTextNode(node.nodeValue);
    if (node.nodeType !== 1 || SKIP_TAGS.has(node.tagName)) return null;
    if (++state.count > MAX_ELEMENTS) throw new Error('too many elements');
    const view = node.ownerDocument.defaultView;
    const cs = view.getComputedStyle(node);
    if (cs.display === 'none') return null;
    const tag = node.tagName;
    if (tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED') return placeholder(node, cs, tag.toLowerCase());
    if (tag === 'svg' || node instanceof view.SVGElement) {
      const svg = node.cloneNode(true);
      svg.setAttribute('style', styleText(cs, state.defaults.of('span')));
      return svg;
    }

    let clone;
    if (tag === 'CANVAS' || tag === 'VIDEO' || tag === 'IMG') {
      clone = doc().createElement('img');
      let src = '';
      if (tag === 'CANVAS') {
        const copy = state.canvases.get(node);
        src = copy ? copy.toDataURL('image/png') : '';
      } else if (tag === 'VIDEO') src = videoDataUrl(node);
      else src = imageDataUrl(node);
      if (src) clone.setAttribute('src', src);
      clone.setAttribute('style', styleText(cs, state.defaults.of(tag === 'IMG' ? 'img' : 'canvas')));
      return clone;
    }

    clone = node.cloneNode(false);
    clone.removeAttribute('style');
    if (tag === 'INPUT') {
      if (node.type === 'checkbox' || node.type === 'radio') {
        if (node.checked) clone.setAttribute('checked', '');
        else clone.removeAttribute('checked');
      } else if (node.type !== 'password') clone.setAttribute('value', node.value);
      else clone.setAttribute('value', '•'.repeat(String(node.value).length));
    }
    const text = styleText(cs, state.defaults.of(tag.toLowerCase()));
    clone.setAttribute('style', text);

    ['::before', '::after'].forEach(pseudo => {
      const ps = view.getComputedStyle(node, pseudo);
      const content = ps.getPropertyValue('content');
      if (!content || content === 'none' || content === 'normal') return;
      const cls = 'bshot-p' + (++state.pseudo);
      clone.setAttribute('class', ((clone.getAttribute('class') || '') + ' ' + cls).trim());
      const rule = styleText(ps, state.defaults.of('span')) + 'content:' + content + ';';
      state.css.push('.' + cls + pseudo + '{' + rule + '}');
    });

    if (tag === 'TEXTAREA') {
      clone.textContent = node.value;
      return clone;
    }
    if (tag === 'SELECT') {
      Array.from(node.options).forEach((opt, i) => {
        const o = doc().createElement('option');
        o.textContent = opt.textContent;
        if (i === node.selectedIndex) o.setAttribute('selected', '');
        clone.appendChild(o);
      });
      return clone;
    }

    let host = clone;
    if (node.scrollTop || node.scrollLeft) {
      host = doc().createElement('div');
      host.setAttribute('style', 'position:relative;top:' + -node.scrollTop + 'px;left:' + -node.scrollLeft + 'px;');
      clone.appendChild(host);
    }
    for (let child = node.firstChild; child; child = child.nextSibling) {
      const c = cloneTree(child, state);
      if (c) host.appendChild(c);
    }
    return clone;
  }

  async function inlineCssUrls(svgText) {
    const urls = new Set();
    svgText.replace(/url\(&quot;([^&]+?)&quot;\)|url\("([^"]+?)"\)/g, (m, a, b) => { urls.add(a || b); return m; });
    let out = svgText;
    for (const url of urls) {
      if (/^data:/i.test(url) || url.startsWith('#')) continue;
      const data = await inlineUrl(url);
      out = out.split(url).join(data);
    }
    return out;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('page image failed to render'));
      img.src = src;
    });
  }

  async function composeDom() {
    const width = root.innerWidth;
    const height = root.innerHeight;
    const canvases = await inNextFrame(snapshotCanvases);
    const defaults = createDefaults();
    let markup;
    try {
      const state = { count: 0, pseudo: 0, css: [], canvases, defaults };
      const body = cloneTree(doc().body, state);
      const page = doc().createElement('div');
      const htmlStyle = root.getComputedStyle(doc().documentElement);
      page.setAttribute('style', 'width:' + width + 'px;height:' + height + 'px;overflow:hidden;position:relative;background:' + htmlStyle.getPropertyValue('background-color') + ';');
      const style = doc().createElement('style');
      style.textContent = state.css.join('\n');
      page.appendChild(style);
      if (body) {
        body.setAttribute('style', (body.getAttribute('style') || '') + 'margin:0;position:relative;top:' + -root.scrollY + 'px;left:' + -root.scrollX + 'px;');
        page.appendChild(body);
      }
      markup = new XMLSerializer().serializeToString(page);
    } finally {
      defaults.remove();
    }
    markup = await inlineCssUrls(markup);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"><foreignObject x="0" y="0" width="100%" height="100%">' + markup + '</foreignObject></svg>';
    const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    const full = makeCanvas(width, height);
    full.getContext('2d').drawImage(img, 0, 0);
    return full;
  }

  async function capture(options) {
    const opts = options || {};
    const started = Date.now();
    const done = (full, method, error) => ({
      canvas: full ? (full.width > MAX_WIDTH ? fitWidth(full, full.width, full.height) : full) : null,
      full,
      scale: full ? full.width / (opts.canvas ? opts.canvas.getBoundingClientRect().width || full.width : root.innerWidth) : 1,
      method,
      ms: Date.now() - started,
      error: error || ''
    });
    if (opts.canvas) {
      try {
        return done(await inNextFrame(() => copyCanvas(opts.canvas)), 'canvas');
      } catch (err) {
        return done(null, 'canvas', String(err.message || err));
      }
    }
    let nativeError = '';
    if (root.win98Native && typeof root.win98Native.capture === 'function') {
      try {
        return done(await fromPngBytes(await root.win98Native.capture()), 'electron');
      } catch (err) {
        nativeError = 'electron: ' + (err.message || err) + '; ';
      }
    }
    try {
      return done(await composeDom(), 'dom');
    } catch (err) {
      return done(null, 'dom', nativeError + String(err.message || err));
    }
  }

  function toBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('encode failed'))), type, quality));
  }

  async function smallest(canvas, base) {
    const png = await toBlob(canvas, 'image/png');
    if (png.size <= MAX_BYTES) return { name: base + '.png', blob: png };
    return { name: base + '.jpg', blob: await toBlob(canvas, 'image/jpeg', JPEG_QUALITY) };
  }

  function cleanRects(rects, canvas) {
    return (rects || []).map(r => ({
      x: Math.max(0, Math.round(r.x)),
      y: Math.max(0, Math.round(r.y)),
      w: Math.round(Math.min(r.w, canvas.width - Math.max(0, r.x))),
      h: Math.round(Math.min(r.h, canvas.height - Math.max(0, r.y)))
    })).filter(r => r.w > 0 && r.h > 0);
  }

  function focusCrop(shot, focus, hides) {
    const full = shot.full;
    const canvas = shot.canvas;
    if (!focus || !full || full.width <= canvas.width) return null;
    const s = shot.scale;
    const x = Math.max(0, Math.round(focus.x * s));
    const y = Math.max(0, Math.round(focus.y * s));
    const w = Math.min(full.width - x, Math.round(focus.w * s));
    const h = Math.min(full.height - y, Math.round(focus.h * s));
    if (w < 32 || h < 32) return null;
    const crop = makeCanvas(w, h);
    const g = crop.getContext('2d');
    g.drawImage(full, x, y, w, h, 0, 0, w, h);
    const k = full.width / canvas.width;
    g.fillStyle = '#000';
    hides.forEach(r => g.fillRect(r.x * k - x, r.y * k - y, r.w * k, r.h * k));
    return crop;
  }

  async function encode(shot, options) {
    const opts = options || {};
    const canvas = shot.canvas;
    const hides = cleanRects(opts.hides, canvas);
    const marks = cleanRects(opts.marks, canvas);
    const base = copyCanvas(canvas);
    const g = base.getContext('2d');
    g.fillStyle = '#000';
    hides.forEach(r => g.fillRect(r.x, r.y, r.w, r.h));
    const main = await smallest(base, 'shot');
    const files = { [main.name]: main.blob };
    let marked = null;
    if (marks.length) {
      const copy = copyCanvas(base);
      const m = copy.getContext('2d');
      m.strokeStyle = '#ff0000';
      m.lineWidth = 3;
      marks.forEach(r => m.strokeRect(r.x + 1.5, r.y + 1.5, Math.max(1, r.w - 3), Math.max(1, r.h - 3)));
      const out = await smallest(copy, 'shot-marked');
      files[out.name] = out.blob;
      marked = out.name;
    }
    let windowShot = null;
    const crop = focusCrop(shot, opts.focus, hides);
    if (crop) {
      const out = await smallest(crop, 'shot-window');
      files[out.name] = out.blob;
      windowShot = out.name;
    }
    return { files, attach: { shot: main.name, marked, window: windowShot, marks, hidden: hides.length, size: [canvas.width, canvas.height], method: shot.method } };
  }

  root.BugShot = { MAX_WIDTH, MAX_BYTES, capture, encode };
})(typeof window !== 'undefined' ? window : globalThis);
