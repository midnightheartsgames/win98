const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '../js/apps/hsr98');
const H = require(path.join(DIR, 'hsr-core.js'));
require(path.join(DIR, 'hsr-gfx.js'));
let passed = 0;
const check = (name, fn) => { fn(); passed++; };

class FakeImage {
  set src(v) { this.url = v; this.complete = true; this.naturalWidth = 200; this.naturalHeight = 280; }
}

const calls = [];
const ctx = {
  save() { }, restore() { },
  drawImage(...a) { calls.push(a); }
};

check('without pictures nothing is drawn and the callers keep their fallback', () => {
  require(path.join(DIR, 'hsr-splash-pix.js'));
  require(path.join(DIR, 'hsr-splash.js'));
  const G = H.Gfx;
  assert.equal(G.hasSplash('himeko', 'm'), false);
  assert.equal(G.drawSplash(ctx, 'himeko', 'm', 186, 0, 386, 1), false);
  assert.equal(G.drawSplashCard(ctx, 'himeko', 'm', 0, 0, 56, 300), false);
  assert.equal(G.splashPortrait('himeko', 'm', 120, 128), null);
  assert.equal(calls.length, 0);
});

check('Trailblazer art is picked by path and gender, other heroes by id', () => {
  globalThis.Image = FakeImage;
  H.SPLASH_PIX = { 'trail-m': 'data:a', 'trail_p-f': 'data:b', himeko: 'data:c' };
  delete require.cache[require.resolve(path.join(DIR, 'hsr-splash.js'))];
  require(path.join(DIR, 'hsr-splash.js'));
  const G = H.Gfx;
  assert.equal(G.hasSplash('trail', 'm'), true);
  assert.equal(G.hasSplash('trail', 'f'), false);
  assert.equal(G.hasSplash('trail_p', 'f'), true);
  assert.equal(G.hasSplash('trail_p', 'm'), false);
  assert.equal(G.hasSplash('himeko', 'f'), true);
  assert.equal(G.hasSplash('kafka', 'm'), false);
});

check('the card shows the centre strip of the picture at full height', () => {
  const G = H.Gfx;
  calls.length = 0;
  assert.equal(G.drawSplashCard(ctx, 'himeko', 'm', 10, 20, 56, 300), true);
  const [im, sx, sy, sw, sh, dx, dy, dw, dh] = calls[0];
  assert.equal(im.url, 'data:c');
  assert.deepEqual([sy, sh, dx, dy, dw, dh], [0, 280, 10, 20, 56, 300]);
  assert.equal(sx, Math.round((200 - sw) / 2));
  assert.ok(sw > 0 && sw < 200);
});

check('the page loads the picture module before the drawing module', () => {
  for (const f of ['index.html', 'hsr98.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const pix = html.indexOf('hsr-splash-pix.js'), art = html.indexOf('hsr-splash.js');
    assert.ok(pix > 0 && art > pix, f);
  }
});

console.log('hsr-splash: ' + passed + ' checks passed');
