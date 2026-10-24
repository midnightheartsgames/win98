const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');
const { htmlSnapshot, parseHtml, decodeEntities } = require(path.join(root, 'js/netscape-html.js'));
const web1 = require(path.join(root, 'js/netscape-web1.js'));
const proxy = require(path.join(root, 'js/netscape-proxy.js'));
const { snapshotExpression } = require(path.join(root, 'js/netscape-snapshot.js'));

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('PASS ' + name);
}

const PAGE = 'https://example.org/wiki/page';

const STATIC_HTML = `<!doctype html><html lang="ru"><head><title>Тест &amp; страница</title>
<meta name="description" content="Описание страницы">
<script>document.write('ВРЕДНЫЙ СКРИПТ')</script><style>body{color:red}</style></head>
<body bgcolor="#f8f9fa" text="#202122" link="#3366cc">
<nav><a href="/">Главная</a> | <a href="/news">Новости</a> | <a href="#history">История</a></nav>
<h1>Заголовок</h1>
<p>Текст с <b>жирным</b> и <i>курсивом</i>&nbsp;&mdash; и <a href="https://other.example.com/x?a=1&amp;b=2">ссылкой</a>.
<p>Второй абзац без закрывающего тега
<table class="infobox" border="1" align="right"><tr><th colspan="2">Карточка</th></tr><tr><td>Тип<td>браузер</table>
<h2 id="history">История</h2>
<ul><li>Первый<li>Второй</ul>
<img src="/img/logo.png" width="120" height="40" alt="Логотип">
<img src="/pixel.gif" width="1" height="1">
<form action="/search" method="get"><input type="text" name="q" placeholder="Поиск"><input type="hidden" name="lang" value="ru"></form>
<form action="/login" method="post"><input type="password" name="pw"><button type="submit">Войти</button></form>
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Ролик"></iframe>
<div style="display:none">Скрытый текст</div>
<p hidden>Тоже скрыт</p>
</body></html>`;

test('static parser builds a tree with implied end tags, entities and head metadata', () => {
  const doc = parseHtml(STATIC_HTML);
  assert.strictEqual(doc.title, 'Тест & страница');
  assert.strictEqual(doc.metas.description, 'Описание страницы');
  assert.strictEqual(doc.bodyAttrs.bgcolor, '#f8f9fa');
  assert.strictEqual(decodeEntities('a&nbsp;b &mdash; &#1046; &#x416; &copy 2026 &param=1'), 'a\u00a0b \u2014 Ж Ж \u00a9 2026 &param=1');
  const snap = htmlSnapshot(STATIC_HTML, PAGE);
  const ps = [];
  const walk = (n) => {
    if (typeof n === 'string') return;
    if (n.t === 'p') ps.push(n);
    (n.k || []).forEach(walk);
  };
  walk(snap.tree);
  assert.strictEqual(ps.length, 2, 'unclosed <p> must be closed by the next <p> and by <table>');
  assert.strictEqual(snap.base.bg, '#f8f9fa');
  assert.strictEqual(snap.base.link, '#3366cc');
});

test('static page is rewritten into HTML 3.2 with gateway links, anchors and safe content', () => {
  const html = web1.transcode(htmlSnapshot(STATIC_HTML, PAGE), { notes: ['note'] });
  assert.ok(html.startsWith('<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">'));
  assert.ok(html.includes('<meta name="ns-url" content="https://example.org/wiki/page">'));
  assert.ok(html.includes('<title>Тест &amp; страница</title>'));
  assert.ok(!html.includes('ВРЕДНЫЙ СКРИПТ'));
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('Скрытый текст'));
  assert.ok(!html.includes('Тоже скрыт'));
  assert.ok(html.includes('bgcolor="#FFFFFF"'), 'background is quantized to the 216-colour palette');
  assert.ok(html.includes('text="#333333"'));
  assert.ok(html.includes('link="#3366CC"'));
  assert.ok(html.includes('href="/netscape/page?url=' + encodeURIComponent('https://other.example.com/x?a=1&b=2') + '"'));
  assert.ok(html.includes('href="#history"'), 'same-page fragment links stay local');
  assert.ok(html.includes('<a name="history"></a>'), 'fragment targets become <a name>');
  assert.ok(/<a href="[^"]+">Главная<\/a> \| <a href="[^"]+">Новости<\/a> \| <a href="#history">История<\/a>/.test(html), 'link rows become a | separated bar');
  assert.ok(html.includes('<b>жирным</b>'));
  assert.ok(html.includes('<i>курсивом</i>'));
  assert.ok(/<table border="1"[^>]*align="right"/.test(html), 'floated data table keeps border and alignment');
  assert.ok(html.includes('colspan="2"'));
  assert.ok(/<ul>\s*<li>/.test(html));
  assert.ok(html.includes('src="/netscape/img?url=' + encodeURIComponent('https://example.org/img/logo.png') + '&amp;ref='));
  assert.ok(html.includes('width="120" height="40"'));
  assert.ok(!html.includes('pixel.gif'), 'tracking pixels are dropped');
  assert.ok(html.includes('<form action="/netscape/form" method="get"><input type="hidden" name="__ns_action" value="https://example.org/search">'));
  assert.ok(html.includes('<input type="hidden" name="lang" value="ru">'));
  assert.ok(html.includes('value="Искать!"'), 'a search form without a button gets one');
  assert.ok(/<input type="password" name="pw" value="" size="\d+" disabled>/.test(html), 'POST forms are shown but disabled');
  assert.ok(html.includes('[ ВИДЕОРОЛИК ]'));
  assert.ok(html.includes(encodeURIComponent('https://www.youtube.com/watch?v=dQw4w9WgXcQ')));
  assert.ok(html.includes('Вы посетитель номер'));
  assert.ok(html.includes('[ note ]'));
  assert.ok(!/Microsoft|Windows/.test(html.replace(/https?:[^"\s]+/g, '')));
});

function box(x, y, w, h) {
  return [x, y, w, h];
}

const GEO_SNAP = {
  url: 'https://news.example.com/',
  title: 'Новости',
  metas: { description: 'Свежие новости' },
  width: 1024,
  text: 2000,
  base: { c: '#202122', fs: 14, fw: 0, it: 0, ff: 'sans', ta: '', bg: '#ffffff', link: '#0645ad', bi: '' },
  tree: {
    t: 'body', d: 1, b: box(0, 0, 1024, 900), k: [
      {
        t: 'header', d: 1, b: box(0, 0, 1024, 60), s: { bg: '#1a1a2e', c: '#ffffff' }, k: [
          { t: 'img', d: 1, b: box(20, 10, 40, 40), a: { src: 'https://news.example.com/logo.svg', alt: 'Логотип' } },
          {
            t: 'ul', d: 1, b: box(400, 20, 600, 20), k: [
              { t: 'li', d: 1, b: box(400, 20, 80, 20), k: [{ t: 'a', a: { h: 'https://news.example.com/world' }, k: ['Мир'] }] },
              { t: 'li', d: 1, b: box(500, 20, 80, 20), k: [{ t: 'a', a: { h: 'https://news.example.com/sport' }, k: ['Спорт'] }] },
              { t: 'li', d: 1, b: box(600, 20, 80, 20), k: [{ t: 'a', a: { h: 'https://news.example.com/tech' }, k: ['Техника'] }] }
            ]
          }
        ]
      },
      {
        t: 'main', d: 1, b: box(0, 80, 1024, 800), k: [
          { t: 'aside', d: 1, b: box(0, 80, 256, 400), s: { bg: '#cccccc' }, k: [{ t: 'div', d: 1, b: box(0, 80, 256, 20), k: ['Рубрики'] }] },
          {
            t: 'article', d: 1, b: box(276, 80, 748, 800), k: [
              { t: 'h2', d: 1, b: box(276, 80, 748, 40), s: { fs: 32, fw: 1 }, k: ['Главная новость дня'] },
              { t: 'p', d: 1, b: box(276, 130, 748, 60), k: ['Очень длинный текст новости. '.repeat(10)] },
              { t: 'div', d: 1, b: box(276, 200, 748, 20), s: { c: '#999999', fs: 10 }, k: ['5 минут назад'] }
            ]
          }
        ]
      }
    ]
  }
};

test('geometry turns side-by-side boxes into layout tables and keeps site colours', () => {
  const html = web1.transcode(JSON.parse(JSON.stringify(GEO_SNAP)), { decorate: false });
  assert.ok(/<td valign="top" width="25%" bgcolor="#CCCCCC">/.test(html), 'sidebar column keeps its width share and background');
  assert.ok(/<td valign="top" width="75%">/.test(html), 'content column gets the rest');
  assert.ok(/<table width="100%" border="0" cellspacing="0" cellpadding="6" bgcolor="#333333">/.test(html), 'dark header becomes a coloured table');
  assert.ok(html.includes('>Мир</font></a> | <a'), 'horizontal menu becomes a link bar');
  assert.ok(html.includes('<h1>'), 'visually huge text becomes <h1>');
  assert.ok(html.includes('<font color="#999999" size="1">5 минут назад</font>'));
  assert.ok(html.includes('font-family: Arial, Helvetica, sans-serif; font-size: 13px'));
  assert.ok(html.includes('<font color="#FFFFFF">Мир</font>'), 'links on dark backgrounds stay readable');
  assert.ok(!html.includes('Вы посетитель номер'), 'decorations can be turned off');
  assert.ok(html.includes('filter: url(#ns216)'));
});

test('full colour mode keeps exact colours and drops the dither filter', () => {
  const html = web1.transcode(JSON.parse(JSON.stringify(GEO_SNAP)), { decorate: false, websafe: false });
  assert.ok(html.includes('bgcolor="#1A1A2E"'));
  assert.ok(html.includes('bgcolor="#CCCCCC"'));
  assert.ok(!html.includes('ns216'));
});

test('unreadable text colours are corrected against the background', () => {
  const snap = {
    url: 'https://a.example/', title: 'A', width: 1024, text: 500, metas: {},
    base: { c: '#000000', fs: 16, fw: 0, it: 0, ff: 'serif', ta: '', bg: '#ffffff', link: '#0000ee', bi: '' },
    tree: { t: 'body', d: 1, b: box(0, 0, 1024, 100), k: [{ t: 'div', d: 1, b: box(0, 0, 1024, 100), s: { bg: '#000000', c: '#111111' }, k: ['Почти невидимый текст'] }] }
  };
  const html = web1.transcode(snap, { decorate: false });
  assert.ok(html.includes('<font color="#FFFFFF">Почти невидимый текст</font>'));
});

test('helpers: palette, font sizes and video ids', () => {
  assert.strictEqual(web1.websafe('#202122'), '#333333');
  assert.strictEqual(web1.websafe('#ff8800'), '#FF9900');
  assert.strictEqual(web1.sizeIndex(13), 2);
  assert.strictEqual(web1.sizeIndex(16), 3);
  assert.strictEqual(web1.sizeIndex(48), 7);
  assert.strictEqual(web1.youtubeId('https://youtu.be/abcdefghijk'), 'abcdefghijk');
  assert.strictEqual(web1.youtubeId('https://www.youtube.com/shorts/abcdefghijk'), 'abcdefghijk');
  assert.strictEqual(web1.youtubeId('https://example.com/'), null);
});

test('special documents: errors, images, plain text and files', () => {
  assert.ok(web1.errorDocument('https://x.example/', 'Тайм-аут').includes('Тайм-аут'));
  assert.ok(web1.imageDocument('https://x.example/a.png').includes('/netscape/img?url='));
  assert.ok(web1.textDocument('https://x.example/a.txt', '<b>').includes('<pre>&lt;b&gt;</pre>'));
  assert.ok(web1.fileDocument('https://x.example/setup.zip', { type: 'application/zip', size: 3 * 1048576 }).includes('3.0 МБ'));
});

test('gateway: private networks are refused and redirect wrappers unwrapped', () => {
  ['127.0.0.1', '10.1.2.3', '192.168.0.1', '172.20.0.5', '169.254.1.1', '::1', 'fd00::1', '::ffff:127.0.0.1', '100.64.0.1'].forEach((ip) => assert.ok(proxy.isPrivateIp(ip), ip));
  ['8.8.8.8', '93.184.216.34', '2606:4700::1111'].forEach((ip) => assert.ok(!proxy.isPrivateIp(ip), ip));
  assert.strictEqual(proxy.unwrapRedirect('https://duckduckgo.com/l/?uddg=' + encodeURIComponent('https://ru.wikipedia.org/wiki/X')), 'https://ru.wikipedia.org/wiki/X');
  assert.strictEqual(proxy.unwrapRedirect('https://www.google.com/url?q=https://example.com/'), 'https://example.com/');
  assert.strictEqual(proxy.unwrapRedirect('https://example.com/a'), 'https://example.com/a');
  const opts = proxy.readOptions(new URLSearchParams('mode=static&deco=0&colors=full&reload=1'));
  assert.deepStrictEqual(opts, { javascript: false, decorate: false, websafe: false, reload: true });
  assert.deepStrictEqual(proxy.readOptions(new URLSearchParams('')), { javascript: true, decorate: true, websafe: true, reload: false });
});

test('gateway: GET form submissions are forwarded to the page route', () => {
  let status = 0;
  let headers = null;
  const res = { writeHead(s, h) { status = s; headers = h; }, end() {}, on() {} };
  const handled = proxy.handle({ url: '/netscape/form?__ns_action=' + encodeURIComponent('https://example.org/search?old=1') + '&q=netscape+6' }, res);
  assert.ok(handled);
  assert.strictEqual(status, 302);
  assert.strictEqual(headers.Location, '/netscape/page?url=' + encodeURIComponent('https://example.org/search?q=netscape+6'));
  assert.strictEqual(proxy.handle({ url: '/index.html' }, res), false);
});

test('page snapshot script is a self-contained expression', () => {
  const expr = snapshotExpression({ maxNodes: 10 });
  assert.ok(expr.startsWith('(function pageSnapshot('));
  assert.ok(expr.endsWith(')({"maxNodes":10})'));
  assert.doesNotThrow(() => new Function('return ' + expr));
});

test('source files of the gateway contain no comments', () => {
  const fs = require('fs');
  ['js/netscape-proxy.js', 'js/netscape-renderer.js', 'js/netscape-snapshot.js', 'js/netscape-html.js', 'js/netscape-web1.js'].forEach((file) => {
    const src = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!/^\s*\/\/|\/\*/m.test(src.replace(/'[^'\n]*'|"[^"\n]*"|`[^`]*`|\/(?![*/])(?:\\.|[^/\n])+\/[gimsuy]*/g, '')), file);
  });
});

console.log(`\nALL ${passed} NETSCAPE WEB 1.0 GATEWAY TESTS PASSED`);
process.exit(0);
