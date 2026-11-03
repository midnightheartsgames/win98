const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
for (const m of ['he-core', 'he-data', 'he-units', 'he-factions', 'he-artifacts', 'he-art', 'he-files']) require(path.join(ROOT, 'js/apps/heroes98', m + '.js'));
const A = globalThis.Heroes98.Art;
const OUT = path.join(ROOT, 'HEROES-98-ART-LIST.md');

const all = A.all();
if (process.argv.includes('--json')) {
  const anims = Object.fromEntries(A.ANIMS.map(([n, k]) => [n, k]));
  const spec = all.map(e => {
    const out = { id: e.id, kind: e.kind, size: e.size, team: !!e.team };
    if (e.kind === 'creature') {
      out.anims = A.animsOf(A.UNITS[e.unit]).map(([n]) => [n, anims[n]]);
      out.anchor = e.anchor;
      out.portrait = e.portrait;
    }
    if (e.kind === 'townScene') out.layers = e.layers.map(l => l[0]);
    if (e.kind === 'mapHero') out.dirs = 8;
    return out;
  });
  process.stdout.write(JSON.stringify(spec));
  process.exit(0);
}

const cell = s => String(s == null ? '' : s).replace(/\|/g, '/');
const size = e => e.size[0] + '×' + e.size[1];
const lines = ['# Heroes 98: список картинок', '', 'Файл собирает `node tools/heroes98-art-list.cjs` из `js/apps/heroes98/he-art.js`. Руками не править: правится `he-art.js`, затем список собирается заново. Как рисовать и сдавать — `HEROES-98-ART.md`.', '', 'Всего записей: ' + all.length + '. Пометка «доп.» — дополнение (Звездочёты и Грибница), его рисуют после выпуска.', ''];
const table = (title, rows, cols) => {
  if (!rows.length) return;
  lines.push('## ' + title, '', '| ' + cols.map(c => c[0]).join(' | ') + ' |', '| ' + cols.map(() => '---').join(' | ') + ' |');
  for (const r of rows) lines.push('| ' + cols.map(c => cell(c[1](r))).join(' | ') + ' |');
  lines.push('');
};

const units = A.creatures();
const FACTIONS = ['league', 'barrows', 'thicket', 'tide', 'forge', 'throne', 'stars', 'spore', 'neutral', 'summon', 'machine'];
for (const f of FACTIONS) {
  const p = A.PALETTES[f];
  table('Существа: ' + p.name + (A.ADDON.includes(f) ? ' (доп.)' : ''), units.filter(e => e.faction === f), [
    ['id', e => '`' + e.id + '`'], ['Имя', e => e.name], ['Ур.', e => e.tier + (e.branch ? ' ' + e.branch.toUpperCase() : '')], ['Кадр', size], ['Анимации', e => e.frames], ['Как выглядит', e => e.look]
  ]);
}
table('Герои на карте', A.MAP_HEROES, [['id', e => '`' + e.id + '`'], ['Класс', e => e.name + (e.addon ? ' (доп.)' : '')], ['Кадр', size], ['Кадры', e => e.frames], ['Как выглядит', e => e.look]]);
table('Портреты героев кампаний', A.PORTRAITS, [['id', e => '`' + e.id + '`'], ['Кто', e => e.name + (e.addon ? ' (доп.)' : '')], ['Размер', size], ['Как выглядит', e => e.look]]);
lines.push('## Сцены городов (3D)', '');
for (const t of A.TOWNS) lines.push('- `' + t.id + '` ' + t.name + (t.addon ? ' (доп.)' : '') + ', ' + size(t) + ': фон и слои ' + t.layers.map(l => '`' + l[0] + '` ' + l[1]).join(', ') + '.');
lines.push('');
table('Города на карте', A.TOWN_MAP, [['id', e => '`' + e.id + '`'], ['Что', e => e.name + (e.addon ? ' (доп.)' : '')], ['Размер', size], ['След', e => e.foot.join('×')]]);
table('Объекты карты', A.OBJECTS, [['id', e => '`' + e.id + '`'], ['Что', e => e.name], ['След, клеток', e => e.foot.join('×')], ['Размер', size], ['Кадры и флаг', e => e.frames]]);
table('Жилища на карте', A.DWELLINGS, [['id', e => '`' + e.id + '`'], ['Что', e => e.name + (e.addon ? ' (доп.)' : '')], ['Размер', size], ['Как выглядит', e => e.look]]);
table('Местность', A.TERRAINS, [['id', e => '`' + e.id + '`'], ['Что', e => e.name], ['Плитка', size], ['Набор', e => e.frames]]);
table('Дороги и реки', A.ROADS, [['id', e => '`' + e.id + '`'], ['Что', e => e.name], ['Плитка', size], ['Набор', e => e.frames]]);
table('Особые поля', A.OVERLAYS, [['id', e => '`' + e.id + '`'], ['Что', e => e.name], ['Плитка', size], ['Набор', e => e.frames]]);
table('Декор', A.DECOR, [['id', e => '`' + e.id + '`'], ['Что', e => e.name], ['Размер', size]]);
table('Поля боя', A.FIELDS, [['id', e => '`' + e.id + '`'], ['Что', e => e.name + (e.addon ? ' (доп.)' : '')], ['Размер', size], ['Кадры', e => e.frames]]);
table('Значки заклинаний', A.SPELLS, [['id', e => '`' + e.id + '`'], ['Имя', e => e.name], ['Школа', e => A.SCHOOLS[e.school]], ['Круг', e => e.circle || ''], ['Размер', size]]);
table('Эффекты', A.EFFECTS, [['id', e => '`' + e.id + '`'], ['Что', e => e.name], ['Кадр', size], ['Кадры', e => e.frames]]);
table('Снаряды', A.PROJECTILES, [['id', e => '`' + e.id + '`'], ['Что', e => e.name], ['Кадр', size], ['Кадры', e => e.frames]]);
table('Значки навыков, приёмов и даров', A.SKILL_ICONS, [['id', e => '`' + e.id + '`'], ['Имя', e => e.name + (e.addon ? ' (доп.)' : '')], ['Размер', size], ['Заметка', e => e.frames]]);
table('Ресурсы', A.RESOURCES, [['id', e => '`' + e.id + '`'], ['Что', e => e.name], ['Размер', size], ['Заметка', e => e.frames]]);
table('Значки артефактов', A.artifactIcons(), [['id', e => '`' + e.id + '`'], ['Что', e => e.name], ['Размер', size], ['Свойства', e => e.look], ['Заметка', e => e.frames]]);
table('Картины и значки лун', A.PICTURES, [['id', e => '`' + e.id + '`'], ['Что', e => e.name + (e.addon ? ' (доп.)' : '')], ['Размер', size], ['Как выглядит', e => e.look]]);

fs.writeFileSync(OUT, lines.join('\r\n') + '\r\n');
console.log(OUT, all.length + ' entries');
