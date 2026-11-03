const fs = require('fs');
const path = require('path');
const { build } = require('../hsr98-standalone.cjs');

const ROOT = path.join(__dirname, '..', '..');
const SITE_DIR = '/srv/www/site/web98/';
const SITE_URL = 'https://pennygachi.men/web98/';
const pad2 = n => String(n).padStart(2, '0');
const stamp = d => 'nettest-' + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + pad2(d.getHours()) + pad2(d.getMinutes());

const QUICK_START = `<script>(() => {
  const btn = document.createElement('button');
  btn.textContent = 'Сразу к автомату Рубежа';
  btn.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99;padding:8px 12px;font:14px sans-serif;display:none';
  let quick = false;
  btn.onclick = () => {
    const ui = window.hsrui;
    if (!quick) {
      const name = (prompt('Имя за столом', 'Первопроходец') || 'Первопроходец').slice(0, 12);
      quick = true;
      ui.writeSave = () => true;
      ui.newGame();
      ui.game.script = null;
      ui.game.pending = null;
      ui.game.state.flags.express_intro = true;
      ui.game.state.name = name;
    }
    ui.screens = [];
    ui.openHdHub();
    btn.style.display = 'none';
    ui.root.focus({ preventScroll: true });
  };
  document.body.appendChild(btn);
  setInterval(() => {
    const ui = window.hsrui;
    btn.style.display = ui && (quick ? !ui.screens.length : ui.mode === 'title') ? 'block' : 'none';
  }, 300);
})();</script>`;

function addQuickStart(html) {
  const at = html.lastIndexOf('</body>');
  if (at < 0) return html + QUICK_START;
  return html.slice(0, at) + QUICK_START + html.slice(at);
}

function main() {
  const name = stamp(new Date()), out = path.join(ROOT, 'dist', name);
  build(out, 'web', 'dev');
  const file = path.join(out, 'index.html');
  fs.writeFileSync(file, addQuickStart(fs.readFileSync(file, 'utf8')));
  console.log('Built dist/' + name);
  console.log('Upload: scp -r dist/' + name + ' mini-pc:' + SITE_DIR);
  console.log('Page:   ' + SITE_URL + name + '/');
}

if (require.main === module) main();

module.exports = { addQuickStart, QUICK_START, stamp };
