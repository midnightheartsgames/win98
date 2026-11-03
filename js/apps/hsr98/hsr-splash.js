(function (H) {
  'use strict';
  const G = H.Gfx;
  const EDGE_X = 0.2, EDGE_Y = 0.07;
  const images = new Map(), feathered = new Map();

  function keyOf(kitId, gender) {
    return kitId === 'trail' || kitId === 'trail_p' ? kitId + (gender === 'f' ? '-f' : '-m') : kitId;
  }

  function imageOf(key) {
    const src = H.SPLASH_PIX && H.SPLASH_PIX[key];
    if (!src || typeof Image === 'undefined') return null;
    let im = images.get(key);
    if (!im) { im = new Image(); im.src = src; images.set(key, im); }
    return im.complete && im.naturalWidth ? im : null;
  }

  function featherOf(key, im) {
    let cv = feathered.get(key);
    if (cv) return cv;
    const w = im.naturalWidth, h = im.naturalHeight;
    cv = G.mkCanvas(w, h);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(im, 0, 0);
    g.globalCompositeOperation = 'destination-in';
    const side = g.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, 'rgba(0,0,0,0)'); side.addColorStop(EDGE_X, '#000'); side.addColorStop(1 - EDGE_X, '#000'); side.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = side; g.fillRect(0, 0, w, h);
    const rim = g.createLinearGradient(0, 0, 0, h);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(EDGE_Y, '#000'); rim.addColorStop(1 - EDGE_Y, '#000'); rim.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rim; g.fillRect(0, 0, w, h);
    feathered.set(key, cv);
    return cv;
  }

  function drawSplash(c, kitId, gender, cx, y, h, alpha) {
    const key = keyOf(kitId, gender), im = imageOf(key);
    if (!im) return false;
    const cv = featherOf(key, im), w = Math.round(h * cv.width / cv.height);
    c.save();
    c.imageSmoothingEnabled = false;
    c.globalAlpha = alpha;
    c.drawImage(cv, Math.round(cx - w / 2), y, w, h);
    c.restore();
    return true;
  }

  function drawSplashCard(c, kitId, gender, x, y, w, h) {
    const im = imageOf(keyOf(kitId, gender));
    if (!im) return false;
    const sw = Math.min(im.naturalWidth, Math.round(w * im.naturalHeight / h)), sx = Math.round((im.naturalWidth - sw) / 2);
    c.imageSmoothingEnabled = false;
    c.drawImage(im, sx, 0, sw, im.naturalHeight, x, y, w, h);
    return true;
  }

  function hasSplash(kitId, gender) {
    return !!imageOf(keyOf(kitId, gender));
  }

  function splashPortrait(kitId, gender, w, h) {
    const im = imageOf(keyOf(kitId, gender));
    if (!im) return null;
    const sw = Math.round(im.naturalWidth * 0.65), sh = Math.round(sw * h / w);
    const cv = G.mkCanvas(w, h), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(im, Math.round((im.naturalWidth - sw) / 2), Math.round(im.naturalHeight * 0.07), sw, sh, 0, 0, w, h);
    return cv;
  }

  Object.assign(G, { drawSplash, drawSplashCard, hasSplash, splashPortrait });
  Object.keys(H.SPLASH_PIX || {}).forEach(imageOf);
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
