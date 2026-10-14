const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
global.window = {};
['js/apps/poligon/p3d.js', 'js/apps/youvid/kit.js', 'js/apps/youvid/rig.js', 'js/apps/youvid/slay-motion.js', 'js/apps/youvid/slay-cast.js', 'js/apps/youvid/slay-script.js'].forEach(f => {
  const file = path.join(root, f);
  if (fs.existsSync(file)) eval(fs.readFileSync(file, 'utf8'));
});
const times = JSON.parse(process.argv[2] || '[]');
const rows = times.map(t => {
  const c = window.SlayScript.cameraAt(t);
  return { t, eye: c.eye, at: c.at, up: c.up, fov: c.fov };
});
process.stdout.write(JSON.stringify(rows));
