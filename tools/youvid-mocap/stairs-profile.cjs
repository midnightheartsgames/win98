const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
global.window = {};
['js/apps/poligon/p3d.js', 'js/apps/youvid/kit.js', 'js/apps/youvid/stairs-world.js'].forEach(f => eval(fs.readFileSync(path.join(root, f), 'utf8')));
const W = window.StairsWorld;
process.stdout.write(JSON.stringify({ RISE: W.RISE, RUN: W.RUN, HALF: W.HALF, CHEEK: W.CHEEK, SEGS: W.SEGS }));
