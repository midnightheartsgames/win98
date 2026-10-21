const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

const vfsFiles = new Map();
const dialogs = [];
const opened = [];
const steamCalls = [];
const launched = [];

global.window = {
  isOnline: true,
  addEventListener: () => {},
  removeEventListener: () => {},
  webGif: name => `<span class="gif-${name}"></span>`,
  soundSys: { playClick: () => {}, playDing: () => {}, playError: () => {} },
  winManager: {
    windows: new Map(),
    openDialog: opts => { dialogs.push(opts); },
    createWindow: () => ({})
  },
  vfs: {
    mkdir: () => {},
    writeFile: (folder, name, content) => { vfsFiles.set(folder.join('\\') + '\\' + name, content); return true; }
  },
  appVideoPlayer: { open: (name, src, auto) => opened.push({ name, src, auto }) },
  gameManager: {
    catalog: {
      'half-life': { title: 'Half-Life 98', priceDisplay: '$34.99', launch: () => launched.push('half-life') },
      fallout: { title: 'Fallout', priceDisplay: '$19.99', launch: () => launched.push('fallout') },
      fallout2: { title: 'Fallout 2', priceDisplay: 'FREE', launch: () => launched.push('fallout2') },
      anotherwar: { title: 'Another War', priceDisplay: '$20.99', launch: () => launched.push('anotherwar') },
      bttf: { title: 'Back to the Future', priceDisplay: '$24.79', launch: () => launched.push('bttf') }
    },
    installed: ['fallout'],
    isInstalled(id) { return this.installed.includes(id); },
    showInSteam(id) { steamCalls.push(id); return false; }
  }
};

eval(read('js/apps/webcinema-data.js'));
eval(read('js/apps/webcinema-site.js'));
eval(read('js/apps/ie.js'));

const site = window.webcinemaSite;
const ie = window.appIE;
const data = window.webcinemaData;
const base = 'http://www.webcinema98.com';
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

function mp4Info(file) {
  const buf = fs.readFileSync(file);
  const find = (tag, from = 0) => buf.indexOf(Buffer.from(tag, 'ascii'), from);
  const mvhd = find('mvhd');
  const version = buf[mvhd + 4];
  const scale = version === 1 ? buf.readUInt32BE(mvhd + 24) : buf.readUInt32BE(mvhd + 16);
  const dur = version === 1 ? Number(buf.readBigUInt64BE(mvhd + 28)) : buf.readUInt32BE(mvhd + 20);
  let w = 0;
  let h = 0;
  let at = 0;
  while ((at = find('tkhd', at + 1)) > 0) {
    const v = buf[at + 4];
    const off = at + 4 + (v === 1 ? 88 : 76);
    const tw = buf.readUInt32BE(off) / 65536;
    const th = buf.readUInt32BE(off + 4) / 65536;
    if (tw > 0 && th > 0) { w = Math.round(tw); h = Math.round(th); break; }
  }
  return { bytes: buf.length, seconds: dur / scale, w, h };
}

function makeFrame(values = {}) {
  const frame = {
    html: '',
    scrollTop: 0,
    scrollHeight: 1000,
    elements: new Map(),
    get innerHTML() { return this.html; },
    set innerHTML(v) { this.html = v; this.elements.clear(); },
    el(key, attrs = {}) {
      if (this.elements.has(key)) return this.elements.get(key);
      const listeners = {};
      const el = {
        attrs,
        value: values[key] !== undefined ? values[key] : (attrs.value || ''),
        getAttribute: name => (attrs[name] !== undefined ? attrs[name] : null),
        addEventListener: (evt, fn) => { listeners[evt] = fn; },
        fire: (evt = 'click') => listeners[evt] && listeners[evt]({ preventDefault: () => {} }),
        classList: { toggle: () => {} }
      };
      this.elements.set(key, el);
      return el;
    },
    querySelector(sel) {
      const id = sel.match(/^#([\w-]+)$/);
      if (id) return this.html.includes(`id="${id[1]}"`) ? this.el(sel) : null;
      if (sel === 'input[name="wc-poll"]:checked') {
        const m = this.html.match(/name="wc-poll" value="([\w-]+)" checked/);
        return m ? this.el(sel, { value: m[1] }) : null;
      }
      return null;
    },
    querySelectorAll(sel) {
      const attr = sel.match(/^\[([\w-]+)\]$/);
      const name = attr ? attr[1] : sel === 'a[data-url]' ? 'data-url' : null;
      if (!name) return [];
      const out = [];
      const re = new RegExp(`${name}="([^"]*)"`, 'g');
      let m;
      let i = 0;
      while ((m = re.exec(this.html))) out.push(this.el(`${sel}:${i++}`, { [name]: m[1] }));
      return out;
    }
  };
  return frame;
}

function open(url, values) {
  const frame = makeFrame(values);
  const win = { id: 'ie' };
  ie.navigate = (w, next) => {
    frame.innerHTML = site.renderSite(next);
    site.attachEvents(w, frame);
  };
  ie.navigate(win, url);
  return { frame, win };
}

console.log("--- WebCinema '98 ---");

test('IE routes every site URL to the site, even ones with words other keys own', () => {
  ['/', '/programme', '/programme?cat=music', '/programme?cat=games&sort=light', '/clip?id=halflife', '/clip?id=fallout2', '/clip?id=prodigy', '/booth', '/book?clip=berserk', '/nothing'].forEach(p => {
    assert.strictEqual(ie.identifyPageKey(base + p), 'webvideo', p);
  });
  assert.strictEqual(ie.getPageTitle('webvideo').includes('WebCinema'), true);
  assert.ok(read('js/apps/ie.js').includes('window.webcinemaSite.renderSite(url)'));
  assert.ok(!/renderWebVideo|getWebVideoList|webcinema-container/.test(read('js/apps/ie.js') + read('css/apps/ie.css')));
});

test('routes resolve to their pages and unknown paths get a raw Apache 404', () => {
  assert.strictEqual(site.parseUrl(base).page, 'home');
  assert.strictEqual(site.parseUrl(base + '/programme?cat=film&sort=light').cat, 'film');
  assert.strictEqual(site.parseUrl(base + '/programme?cat=bogus').cat, 'all');
  assert.strictEqual(site.parseUrl(base + '/programme?sort=light').sort, 'light');
  assert.strictEqual(site.parseUrl(base + '/clip?id=bttf').page, 'clip');
  assert.strictEqual(site.parseUrl(base + '/clip?id=matrix').page, 'notfound');
  assert.strictEqual(site.parseUrl(base + '/booth').page, 'booth');
  assert.strictEqual(site.parseUrl(base + '/book?clip=prodigy').clip, 'prodigy');
  const raw = site.renderSite(base + '/nothing');
  assert.ok(raw.includes('Not Found') && raw.includes('Apache/1.3.3') && !raw.includes('wc-canopy'));
});

test('clip records match the real video files: size, length and frame', () => {
  const files = fs.readdirSync(path.join(root, 'content/webvideo')).filter(f => f.endsWith('.mp4'));
  assert.strictEqual(data.clips.length, files.length, 'every file in content/webvideo is on the programme');
  data.clips.forEach(c => {
    const file = path.join(root, 'content/webvideo', c.file);
    assert.ok(fs.existsSync(file), c.file);
    const info = mp4Info(file);
    assert.strictEqual(c.bytes, info.bytes, `${c.id} bytes`);
    assert.ok(Math.abs(c.seconds - info.seconds) < 1.5, `${c.id} length ${c.seconds} vs ${info.seconds}`);
    assert.strictEqual(c.frame, `${info.w}x${info.h}`, `${c.id} frame`);
    site.stills(c).forEach(s => assert.ok(fs.existsSync(path.join(root, s)), s));
    assert.ok(data.rubrics.some(r => r.id === c.rubric), c.id);
  });
});

test('dates stay on or before the site day and notices point to real clips', () => {
  const key = d => d.split('.').reverse().join('');
  const day = key(data.siteDay);
  data.clips.forEach(c => assert.ok(key(c.added) <= day, c.id));
  data.notices.forEach(n => {
    assert.ok(key(n.date) <= day, n.date);
    if (n.clip) assert.ok(site.clip(n.clip), n.clip);
  });
  data.book.forEach(e => {
    assert.ok(key(e.date) <= day, e.date);
    if (e.clip) assert.ok(key(e.date) >= key(site.clip(e.clip).added), `${e.nick} wrote before ${e.clip} was added`);
  });
  const sorted = data.clips.map(c => key(c.added));
  assert.deepStrictEqual(sorted, sorted.slice().sort().reverse(), 'clips are listed newest first');
});

test('facts checked for 25.11.1998', () => {
  const text = JSON.stringify(data);
  assert.ok(text.includes('19 ноября 1998'), 'Half-Life US release');
  assert.ok(text.includes('27 ноября'), 'Half-Life Europe release still ahead');
  assert.ok(text.includes('8 октября 1997 по 1 апреля 1998'), 'Berserk air dates');
  assert.ok(text.includes('Ballantine'), 'Prodigy concert context');
  assert.ok(!/GoldSrc|GOTY|Игра года|250,000/.test(text), 'no anachronisms from the old page');
  assert.ok(!/Microsoft|Windows/.test(text + read('js/apps/webcinema-site.js')), 'naming rule');
});

test('download time follows the chosen connection everywhere', () => {
  localStorage.clear();
  const prodigy = site.clip('prodigy');
  assert.strictEqual(site.modemId(), '33k');
  assert.strictEqual(site.downloadText(prodigy), '3 ч 30 мин');
  assert.strictEqual(site.downloadText(site.clip('halflife'), '14k'), '26 мин');
  assert.strictEqual(site.timeText(40), '40 с');
  assert.strictEqual(site.sizeMb(prodigy.bytes), '42,1 МБ');
  assert.strictEqual(site.duration(prodigy.seconds), '28:01');
  const { frame } = open(base + '/programme');
  assert.ok(frame.html.includes('3 ч 30 мин'));
  const sel = frame.querySelector('#wc-modem');
  sel.value = 'isdn128';
  sel.fire('change');
  assert.strictEqual(site.modemId(), 'isdn128');
  assert.ok(frame.html.includes('49 мин') && frame.html.includes('ISDN 128K'));
  assert.ok(frame.html.includes('Время загрузки пересчитано'));
  site.setModem('nonsense');
  assert.strictEqual(site.modemId(), 'isdn128');
  assert.ok(site.timeFor('prodigy').includes('ISDN 128K'));
  site.setModem('33k');
});

test('programme filters by rubric and sorts light files first', () => {
  const light = site.renderProgramme('all', 'light');
  const order = data.clips.slice().sort((a, b) => a.bytes - b.bytes).map(c => c.title);
  let last = -1;
  order.forEach(t => {
    const at = light.indexOf(site.esc(t));
    assert.ok(at > last, t);
    last = at;
  });
  const music = site.renderProgramme('music', 'new');
  assert.ok(music.includes('Captain Jeff') && music.includes('The Prodigy') && !music.includes('Half-Life'));
});

test('clip page: player, ticket, stills, reviews, neighbours', () => {
  const { frame } = open(base + '/clip?id=halflife');
  const html = frame.html;
  assert.ok(html.includes('id="wc-video"') && html.includes('content/webvideo/Half-Life 1 trailer.mp4'));
  assert.ok(html.includes('width="388" height="288"'), 'window 2x by default');
  assert.ok(html.includes('Билет №') && html.includes('content/webvideo/stills/halflife-2.jpg'));
  assert.ok(html.includes('Freeman_Gordon'));
  assert.ok(html.includes('clip?id=anotherwar') && html.includes('clip?id=captainjeff'));
  assert.ok(html.includes('Half-Life 98 в Steam'));
  frame.querySelectorAll('[data-wc-game]')[0].fire();
  assert.deepStrictEqual(steamCalls, ['half-life']);
  const f1 = open(base + '/clip?id=fallout1').frame;
  assert.ok(f1.html.includes('Запустить Fallout'));
  f1.querySelectorAll('[data-wc-game]')[0].fire();
  assert.deepStrictEqual(launched, ['fallout']);
  const berserk = site.renderSite(base + '/clip?id=berserk');
  assert.ok(!berserk.includes('data-wc-game'), 'no Steam button without a game');
});

test('download asks first, then saves into My Videos and counts', () => {
  dialogs.length = 0;
  const before = site.downloadCount('berserk');
  const { frame } = open(base + '/clip?id=berserk');
  frame.querySelectorAll('[data-wc-save]')[0].fire();
  assert.strictEqual(dialogs.length, 1);
  assert.ok(dialogs[0].message.includes('2,5 МБ') && dialogs[0].message.includes('Модем 33 600'));
  assert.strictEqual(vfsFiles.size, 0, 'nothing saved before the user agrees');
  dialogs[0].buttons[0].onClick();
  const key = 'My Computer\\C:\\My Documents\\Мои видео\\Berserk TV Trailer.mp4';
  assert.strictEqual(vfsFiles.get(key), 'content/webvideo/Berserk TV Trailer.mp4');
  assert.strictEqual(site.downloadCount('berserk'), before + 1);
  assert.ok(dialogs[1].title.includes('завершена'));
  dialogs[1].buttons[0].onClick();
  assert.strictEqual(opened[opened.length - 1].name, 'Berserk TV Trailer.mp4');
  assert.ok(frame.html.includes('сохранён в C:\\My Documents\\Мои видео'));
});

test('guestbook: escaping, clip link, replies, legacy migration', () => {
  localStorage.clear();
  localStorage.setItem('win98_webcinema_comments', JSON.stringify([{ nick: 'Old_Neo', modem: 'ZyXEL', text: 'старая запись', date: '01.11.1998' }]));
  const seeds = data.book.length;
  const { frame } = open(base + '/book?clip=prodigy', {
    '#wc-book-nick': '<b>Хакер</b>',
    '#wc-book-modem': '28k',
    '#wc-book-clip': 'prodigy',
    '#wc-book-text': 'Связь оборвалась на 30 МБ <script>alert(1)</script>'
  });
  assert.strictEqual(localStorage.getItem('win98_webcinema_comments'), null);
  assert.ok(frame.html.includes('Old_Neo'));
  assert.ok(frame.html.includes('<option value="prodigy" selected>'));
  frame.querySelector('#wc-book-send').fire();
  assert.ok(!frame.html.includes('<script>alert') && frame.html.includes('&lt;script&gt;'));
  assert.ok(frame.html.includes('&lt;b&gt;Хакер&lt;/b&gt;'));
  assert.ok(frame.html.includes('ReGet или GetRight'));
  assert.ok(frame.html.includes(`Запись № ${seeds + 2}`));
  assert.ok(site.renderSite(base + '/clip?id=prodigy').includes('&lt;b&gt;Хакер'));
  assert.strictEqual(site.addEntry('x', '33k', '', '   '), null);
  assert.ok(site.replyFor('А трейлер Звёздных войн будет?').includes('starwars.com'));
  assert.ok(site.replyFor('ролик не открывается').includes('RealPlayer G2'));
});

test('poll takes one vote and shows results', () => {
  localStorage.clear();
  const { frame } = open(base);
  frame.querySelector('#wc-poll-vote').fire();
  assert.ok(frame.html.includes('(ваш голос)') && !frame.html.includes('id="wc-poll-vote"'));
  const total = site.pollState().options.reduce((s, o) => s + o.votes, 0);
  site.vote('anime');
  assert.strictEqual(site.pollState().options.reduce((s, o) => s + o.votes, 0), total);
});

test('booth calculator and players list', () => {
  const { frame } = open(base + '/booth', { '#wc-calc-mb': '4,5', '#wc-calc-modem': '56k' });
  frame.querySelector('#wc-calc-go').fire();
  assert.ok(site.calcResult().includes('4,5 МБ') && site.calcResult().includes('16 мин'));
  assert.ok(frame.html.includes('RealPlayer G2') && frame.html.includes('QuickTime 3.0'));
  assert.ok(frame.html.includes('mailto:info@webcinema98.com'));
  site.calc = { mb: 'abc', modem: '' };
  assert.ok(site.calcResult().includes('Введите'));
});

test('every page is Web 1.0: no emoji, CSS without radius, blur, rgba or transitions', () => {
  ['/', '/programme', '/clip?id=prodigy', '/booth', '/book'].forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(!EMOJI.test(html), p);
    assert.ok(html.includes('wc-canopy') && html.includes('Выдано билетов'), p);
  });
  const css = read('css/apps/webcinema.css');
  assert.ok(!/border-radius|rgba|blur|transition|box-shadow/.test(css));
  assert.ok(css.includes('prefers-reduced-motion'));
});

test('new files carry no comments, Clippy uses a real site method', () => {
  ['js/apps/webcinema-site.js', 'js/apps/webcinema-data.js', 'css/apps/webcinema.css'].forEach(f => {
    const src = read(f);
    assert.ok(!src.includes('/*') && !src.includes('*/'), f);
    assert.ok(!/(^|[^:\\])\/\/(?!www|ftp)/m.test(src.replace(/[a-z]+:\/\/[^\s'"`]+/g, '')), f);
  });
  const clippy = read('js/apps/clippy.js');
  assert.ok(clippy.includes("webcinemaSite.timeFor('prodigy')") && typeof site.timeFor === 'function');
  const index = read('index.html');
  assert.ok(index.indexOf('webcinema-data.js') < index.indexOf('webcinema-site.js') && index.includes('css/apps/webcinema.css'));
  const catalog = read('js/game-manager.js');
  data.clips.filter(c => c.game).forEach(c => assert.ok(new RegExp(`id: '${c.game}',\\s+steam: true`).test(catalog), c.game));
});

console.log(`\nWebCinema '98: ${passed} tests passed.`);
