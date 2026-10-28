/**
 * Fallout 2: Temple of Trials - Win 98 Application Wrapper
 * Integrates Fallout 2 Demo into the Win 98 Window Manager.
 */

class AppFallout2 {
  constructor() {
    this.win = null;
    this.animId = null;
    this.lastTime = 0;

    // Subsystems
    this.audio = null;
    this.char = null;
    this.temple = null;
    this.combat = null;
    this.engine = null;
    this.ui = null;
  }

  open() {
    const winId = 'app_fallout2';

    // If window already open, bring to front
    const existing = document.getElementById(winId);
    if (existing) {
      if (window.winManager) window.winManager.bringToTop(winId);
      return;
    }

    this.win = window.winManager.createWindow({
      id: winId,
      title: 'Fallout 98 Demo — Храм Испытаний (Temple of Trials)',
      icon: 'fallout2',
      width: 820,
      height: 610,
      resizable: true,
      content: '<div id="fallout2-app-root" style="width:100%; height:100%; display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden;"></div>',
      onClose: () => this.destroy()
    });

    const root = (this.win && this.win.element) ? this.win.element.querySelector('#fallout2-app-root') : document.getElementById('fallout2-app-root');
    this.initGame(root);
  }

  initGame(container) {
    this.audio = new FalloutAudio();
    this.char = new FalloutCharacter();

    // Logger bridge
    const logBridge = (msg) => {
      if (this.ui) this.ui.log(msg);
    };

    this.temple = new FalloutTemple(this.char, this.audio, logBridge);
    this.combat = new FalloutCombat(this.char, this.temple, this.audio, logBridge);

    // Placeholder canvas until UI connects
    const dummyCanvas = document.createElement('canvas');
    this.engine = new FalloutEngine(
      dummyCanvas,
      this.char,
      this.temple,
      this.audio,
      (enemy) => this.combat.startCombat(enemy)
    );

    this.ui = new FalloutUI(
      this.char,
      this.temple,
      this.combat,
      this.audio,
      this.engine,
      container
    );

    // Global references for inter-system communication
    window.falloutEngine = this.engine;
    window.falloutUI = this.ui;
    window.falloutCombat = this.combat;
    window.falloutTemple = this.temple;
    window.falloutChar = this.char;

    // Welcome log
    this.ui.log('ХРАМ ИСПЫТАНИЙ, АРРОЙО (2241 год).');
    this.ui.log('Вы входите в древние залы испытаний. Отыщите путь к священному костюму Убежища 13.');
    this.ui.log('Управление: ЛКМ — перемещение / действие. ПКМ — прицельный удар.');

    this.audio.startAmbient();

    // Start Game Loop
    this.lastTime = performance.now();
    const loop = (time) => {
      const delta = Math.min(0.1, (time - this.lastTime) / 1000);
      this.lastTime = time;

      this.engine.update(delta);
      this.engine.render();

      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  restart() {
    this.destroy();
    const root = (this.win && this.win.element) ? this.win.element.querySelector('#fallout2-app-root') : document.getElementById('fallout2-app-root');
    if (root) {
      this.initGame(root);
    }
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.audio) {
      this.audio.stopAmbient();
    }
  }
}

window.AppFallout2 = AppFallout2;
window.appFallout2 = new AppFallout2();

