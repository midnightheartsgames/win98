(function (H) {
  'use strict';
  class Game {
    constructor(root) {
      this.root = root; this.events = new AbortController(); const signal = this.events.signal;
      root.classList.add('hl98'); root.tabIndex = 0; this.keys = {}; this.state = 'menu'; this.audio = new H.AudioManager();
      let storage; try { storage = localStorage; } catch (_) { storage = null; }
      this.save = new H.SaveManager(storage); this.settings = { sensitivity: 2, volume: 45, music: 25, resolution: 640 };
      try { const s = JSON.parse(storage?.getItem('hl98-options')); if (s) for (const key of Object.keys(this.settings)) if (Number.isFinite(s[key])) this.settings[key] = H.clamp(s[key], ...({ sensitivity: [.5,5], volume: [0,100], music: [0,100], resolution: [320,960] }[key])); } catch (_) {}
      root.innerHTML = `<div class="hl98-toolbar"><span>Half-Life 98 Prototype</span><button data-action="menu" aria-label="Пауза и меню">Game / Esc</button></div><div class="hl98-stage"><canvas class="hl98-scene" aria-label="Трёхмерный FPS: лаборатория после аварии"></canvas><canvas class="hl98-fx" aria-hidden="true"></canvas><div class="hl98-chapter"></div><div class="hl98-notice" role="status" aria-live="polite"></div><div class="hl98-prompt"></div><div class="hl98-hud"><div><small>HEALTH</small><strong class="hl98-health">100</strong></div><div class="hl98-inventory"></div><div><small class="hl98-weapon">UNARMED</small><strong class="hl98-ammo">—</strong></div></div><section class="hl98-panel"></section></div><footer>WASD · мышь · ЛКМ · E — действие · R · 1/2 · Space · Ctrl · Shift · Esc</footer>`;
      this.canvas = root.querySelector('.hl98-scene'); this.panel = root.querySelector('.hl98-panel'); this.stage = root.querySelector('.hl98-stage');
      this.ui = Object.fromEntries(['health','ammo','weapon','notice','prompt','chapter','inventory','hud'].map(n => [n, root.querySelector('.hl98-'+n)]));
      try { this.renderer = new H.Renderer(this.canvas, root.querySelector('.hl98-fx')); } catch (error) { this.panel.textContent = error.message; this.failed = true; return; }
      this.applySettings(); this.makeWorld(0); this.showMenu();
      root.addEventListener('click', e => { const a = e.target.closest('[data-action]')?.dataset.action; if (a) this.action(a); }, { signal });
      root.addEventListener('input', e => { const key = e.target.dataset.setting; if (!key) return; this.settings[key] = Number(e.target.value); this.applySettings(); try { storage?.setItem('hl98-options', JSON.stringify(this.settings)); } catch (_) {} const out = e.target.parentElement.querySelector('output'); if (out) out.textContent = e.target.value; }, { signal });
      root.addEventListener('keydown', e => {
        if (e.target.matches('input,select')) return;
        if (['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','ControlLeft'].includes(e.code)) e.preventDefault();
        if (e.code === 'Escape') { this.pause(); return; } if (this.state !== 'running') return;
        this.keys[e.code] = true; if (e.repeat) return;
        if (e.code === 'Digit1') this.world.equip('crowbar'); if (e.code === 'Digit2') this.world.equip('pistol');
        if (e.code === 'KeyR') this.world.weapons[this.world.player.weapon]?.reload(this.world);
        if (e.code === 'KeyE') { const target = this.world.trace(2.6); if (target && !(target instanceof H.HealthStation)) { target.interact(this.world); this.world.eHeld = true; } }
      }, { signal });
      document.addEventListener('keyup', e => { delete this.keys[e.code]; }, { signal });
      this.canvas.addEventListener('mousedown', e => {
        if (this.state !== 'running') return; root.focus();
        if (e.button === 2) { this.drag = true; return; }
        if (e.button === 0) { if (document.pointerLockElement !== this.canvas && !this.lockUnavailable) this.capture(); else this.world.weapons[this.world.player.weapon]?.attack(this.world); }
      }, { signal });
      this.canvas.addEventListener('contextmenu', e => e.preventDefault(), { signal });
      document.addEventListener('mouseup', () => { this.drag = false; }, { signal });
      document.addEventListener('mousemove', e => {
        if (this.state !== 'running' || (document.pointerLockElement !== this.canvas && !this.drag)) return;
        const p = this.world.player; p.yaw += e.movementX * this.settings.sensitivity * .001; p.pitch = H.clamp(p.pitch - e.movementY * this.settings.sensitivity * .001, -.95, .95);
      }, { signal });
      document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement === this.canvas) this.hadLock = true; else if (this.hadLock) { this.hadLock = false; this.pause(); } }, { signal });
      document.addEventListener('pointerlockerror', () => this.fallback(), { signal });
      window.addEventListener('blur', () => this.pause(), { signal });
      root.addEventListener('focusout', e => { if (!root.contains(e.relatedTarget)) this.pause(); }, { signal });
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); }, { signal });
      this.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.pause(); this.state = 'lost'; this.panel.hidden = false; this.panel.innerHTML = '<h1>DISPLAY LOST</h1><p>Закройте игру и откройте снова. Автосохранение сохранено.</p>'; }, { signal });
      this.resize = new ResizeObserver(() => { if (!root.clientWidth || !root.clientHeight) this.pause(); }); this.resize.observe(root);
      this.tick = this.tick.bind(this); this.raf = requestAnimationFrame(this.tick);
    }
    applySettings() { this.audio.volume = this.settings.volume / 100; this.audio.music = this.settings.music / 100; if (this.audio.ctx && this.state === 'running') this.audio.start(); this.renderer.resize(this.settings.resolution); }
    makeWorld(level, data) { this.world = new H.World(level, data, { sound: s => this.audio.play(s), transition: () => this.transition() }); this.renderer.build(this.world); }
    release() { this.keys = {}; this.drag = false; this.hadLock = false; if (document.pointerLockElement === this.canvas) document.exitPointerLock(); }
    capture() { try { const result = this.canvas.requestPointerLock?.(); if (!this.canvas.requestPointerLock) this.fallback(); result?.catch(() => this.fallback()); } catch (_) { this.fallback(); } }
    fallback() { if (this.destroyed) return; this.lockUnavailable = true; this.world.message('Мышь: удерживайте ПКМ для обзора. ЛКМ — атака. Стрелки — обзор.'); }
    resume() { if (this.state === 'lost') return; this.state = 'running'; this.panel.hidden = true; this.keys = {}; this.root.focus(); this.audio.start(); this.capture(); }
    pause() { if (this.state !== 'running') return; this.state = 'paused'; this.release(); this.audio.pause(); this.showMenu(); }
    showMenu() {
      this.panel.hidden = false; const canResume = this.state === 'paused';
      this.panel.innerHTML = `<div class="hl98-brand"><span class="hl98-lambda">λ</span><div><small>ANOMALOUS MATERIALS / FAN PROTOTYPE</small><h1>HALF-LIFE <b>98</b></h1><p>RESIDUAL CONSEQUENCES</p></div></div><div class="hl98-menu-body"><div class="hl98-menu-buttons">${canResume ? '<button data-action="resume">RESUME GAME</button>' : ''}<button data-action="new">NEW GAME</button><button data-action="continue" ${this.save.read() ? '' : 'disabled'}>CONTINUE</button><button data-action="options">OPTIONS</button><button data-action="quit">QUIT</button></div><div class="hl98-brief"><span>RESEARCH FACILITY / INCIDENT 98</span><p>После аварии лаборатория изолирована.<br>Найдите оружие. Доберитесь до лифта.<br>Восстановите питание сектора C.</p><small>02 УРОВНЯ · 03 ТИПА УГРОЗ<br>Автосохранение в начале уровня.<br>Локальный фан-прототип. Ресурсы созданы с нуля.</small></div></div><div class="hl98-menu-bottom">${canResume ? 'SIMULATION PAUSED' : 'SYSTEM READY'} <span>SOFTWARE ERA / 1998</span></div>`;
    }
    action(a) {
      if (this.state === 'lost') return;
      if (a === 'new' || a === 'continue') {
        const saved = a === 'continue' ? this.save.read() : null; if (a === 'continue' && !saved) return;
        this.makeWorld(saved?.level || 0, saved?.player); this.started = true;
        if (a === 'new' && !this.save.write(0, this.world.player)) this.world.message('Автосохранение недоступно: хранилище браузера заблокировано.');
        else this.world.message(saved ? 'CHECKPOINT RESTORED — начало уровня' : 'Найдите монтировку на полу впереди. WASD — движение.');
        this.resume(); return;
      }
      if (a === 'resume') { this.resume(); return; }
      if (a === 'menu') { if (this.state === 'running') this.pause(); else this.showMenu(); return; }
      if (a === 'options') {
        this.panel.innerHTML = `<small>HALF-LIFE 98 / CONFIGURATION</small><h2>OPTIONS</h2><div class="hl98-options">${[['sensitivity','Mouse sensitivity',.5,5,.1],['volume','Master volume',0,100,1],['music','Ambient drone volume',0,100,1]].map(([key,label,min,max,step]) => `<label>${label}<output>${this.settings[key]}</output><input type="range" data-setting="${key}" min="${min}" max="${max}" step="${step}" value="${this.settings[key]}"></label>`).join('')}<label>Render resolution<select data-setting="resolution">${[320,640,960].map(n => `<option value="${n}" ${this.settings.resolution===n?'selected':''}>${n} × ${Math.round(n*.625)}</option>`).join('')}</select></label><button data-action="fullscreen">TOGGLE FULLSCREEN</button></div><p class="hl98-controls">WASD — движение · Shift — бег · Space — прыжок<br>Ctrl / C — присесть · E — действие / удерживать для лечения<br>ЛКМ — атака · R — перезарядка · 1 / 2 — оружие<br>Мышь — обзор; без захвата: ПКМ + мышь или стрелки.<br>Esc — пауза. Continue начинает уровень с автосохранения.</p><button data-action="menu">BACK</button>`; return;
      }
      if (a === 'fullscreen') { const promise = document.fullscreenElement ? document.exitFullscreen() : this.root.requestFullscreen?.(); promise?.catch(() => { const p = this.panel.querySelector('.hl98-controls'); if (p) p.textContent = 'Полноэкранный режим недоступен в этом окне.'; }); return; }
      if (a === 'quit') { this.release(); this.audio.pause(); if (this.onExit) this.onExit(); else { this.state = 'menu'; this.started = false; this.showMenu(); } }
    }
    transition() {
      if (this.world.level === 1) { this.state = 'complete'; this.release(); this.audio.pause(); this.panel.hidden = false; this.panel.innerHTML = '<small>AUXILIARY POWER ONLINE</small><h1>SECTOR C<br>ACCESS RESTORED</h1><h2>PROTOTYPE COMPLETE</h2><p>Вы пережили аварию и восстановили аварийное питание.</p><button data-action="new">NEW GAME</button><button data-action="quit">QUIT</button>'; return; }
      this.state = 'loading'; this.keys = {}; this.panel.hidden = false; this.panel.innerHTML = '<small>TRANSIT / EMERGENCY ELEVATOR</small><h1>LOADING...</h1><p>SECTOR C — MAINTENANCE</p>';
      this.loading = .75;
    }
    tick(now) {
      if (this.destroyed) return; const dt = Math.min(.05, this.last ? (now-this.last)/1000 : 0); this.last = now;
      if (!this.root.getClientRects().length) { this.pause(); this.raf = requestAnimationFrame(this.tick); return; }
      if (this.state === 'loading') { this.loading -= dt; if (this.loading <= 0) { const p = this.world.player; this.makeWorld(1, { hp: p.hp, crowbar:p.crowbar,pistol:p.pistol,weapon:p.weapon,ammo:p.ammo,reserve:p.reserve }); const saved = this.save.write(1,this.world.player); this.state = 'running'; this.panel.hidden = true; this.world.message(saved?'SECTOR C — CHECKPOINT SAVED':'SECTOR C — сохранение недоступно'); this.root.focus(); this.audio.start(); } }
      if (this.state === 'running') {
        const p = this.world.player; p.yaw += ((+!!this.keys.ArrowRight)-(+!!this.keys.ArrowLeft))*dt*1.7; p.pitch = H.clamp(p.pitch + ((+!!this.keys.ArrowUp)-(+!!this.keys.ArrowDown))*dt, -.95,.95);
        let remaining = dt; while (remaining > 0 && this.state === 'running') { const step = Math.min(remaining,1/120); this.world.step(this.keys,step); remaining -= step; }
        if (p.hp <= 0) { this.state = 'dead'; this.release(); this.audio.pause(); this.panel.hidden = false; this.panel.innerHTML = '<small>VITAL SIGNS LOST</small><h1>SUBJECT DECEASED</h1><p>Continue возвращает к началу уровня.</p><button data-action="continue" '+(this.save.read()?'':'disabled')+'>RETRY CHECKPOINT</button><button data-action="new">NEW GAME</button>'; }
      }
      if (this.state !== 'lost') { this.renderer.render(this.world); this.updateHUD(); }
      this.raf = requestAnimationFrame(this.tick);
    }
    updateHUD() {
      const w=this.world,p=w.player; this.ui.hud.hidden=!this.started; this.ui.health.textContent=Math.ceil(p.hp); this.ui.health.style.color=p.hp<30?'#ff5638':'';
      this.ui.weapon.textContent=p.weapon==='pistol'?'9mm PISTOL':p.weapon.toUpperCase(); this.ui.ammo.textContent=p.weapon==='pistol'?`${p.ammo} | ${p.reserve}`:p.weapon==='crowbar'?'1.7 m':'—';
      this.ui.inventory.textContent=(p.crowbar?'1 МОНТИРОВКА  ':'')+(p.pistol?'2 PISTOL':'');
      this.ui.notice.textContent=w.noticeTime>0?w.notice:''; this.ui.prompt.textContent=this.state==='running'?(w.weapons[p.weapon]?.reloadTimer>0?'RELOADING…':w.target?.label||''):'';
      const left=w.enemies.filter(e=>e.hp>0).length;
      this.ui.chapter.textContent=this.started?`${w.level?'SECTOR C':'LABORATORY'} / ${w.room>=0?w.rooms[w.room].name:'TRANSIT'} · THREATS ${left}`:'';
    }
    destroy() { this.destroyed=true;cancelAnimationFrame(this.raf);this.release();this.events.abort();this.resize?.disconnect();this.audio.destroy();this.renderer?.destroy();this.root.replaceChildren(); }
  }
  H.Game=Game;
  globalThis.appHalfLife={open(){const id='app_half_life';if(window.winManager.windows.has(id)){window.winManager.restoreWindow(id);return;}const root=document.createElement('div');window.winManager.createWindow({id,title:'Half-Life 98 Prototype',icon:'half-life',width:Math.min(1000,Math.max(360,window.innerWidth-60)),height:Math.min(700,Math.max(360,window.innerHeight-90)),content:root,onClose:()=>{this.game?.destroy();this.game=null;}});this.game=new Game(root);this.game.onExit=()=>window.winManager.closeWindow(id);}};
})(globalThis.HL98=globalThis.HL98||{});
