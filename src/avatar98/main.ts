import { App, SceneRegistry, type AppOptions } from './app.ts';
import { DEBUG } from './config.ts';
import { MapScene } from './game/mapscene.ts';
import { BattleScene } from './game/battle/scene.ts';
import { MenuScene } from './game/menu.ts';
import { TitleScene, SettingsScene, TitleCardScene, NameScene, GameOverScene, RadioScene, EndingScene } from './game/scenes.ts';
import { SaveScene, ShopScene } from './game/saveui.ts';
import { PaiShoScene } from './game/paisho/scene.ts';
import { WorldMapScene } from './game/worldmap.ts';
import { DebugScene } from './game/debug.ts';
import { Factories } from './game/registry.ts';
import { exportSav, importSav } from './game/save.ts';

SceneRegistry.title = (app) => new TitleScene(app);
SceneRegistry.map = (app) => new MapScene(app);
SceneRegistry.gameover = (app) => new GameOverScene(app);
if (DEBUG) SceneRegistry.debug = (app) => new DebugScene(app);

Factories.battle = (app, troop, done) => new BattleScene(app, troop, done);
Factories.menu = (app) => new MenuScene(app);
Factories.settings = (app) => new SettingsScene(app);
Factories.titlecard = (app, title, sub, frames) => new TitleCardScene(app, title, sub, frames);
Factories.name = (app, done) => new NameScene(app, done);
Factories.radio = (app) => new RadioScene(app);
Factories.ending = (app) => new EndingScene(app);
Factories.save = (app, mode) => new SaveScene(app, mode);
Factories.shop = (app, id) => new ShopScene(app, id);
Factories.paisho = (app, opp, done) => new PaiShoScene(app, opp, done);
Factories.worldmap = (app, node, done) => new WorldMapScene(app, node, done);

export function mount(root: HTMLElement, opts: AppOptions = {}): App {
  return new App(root, opts);
}

export { App, exportSav, importSav, DEBUG };
