(function (H) {
  'use strict';
  class Game {
    constructor(root) {
      this.root = root; this.keys = {}; this.paused = true; this.started = false; this.muted = false;
      this.match = new H.Match(); this.events = new AbortController(); const signal = this.events.signal;
      root.classList.add('hockey98'); root.tabIndex = 0;
      root.innerHTML = `<div class="h98-bar"><span>🏒 NHL 98</span><button data-action="pause">Матч / Esc</button><button data-action="sound">Звук: вкл.</button><button data-action="full">⛶</button></div><div class="h98-score"><div class="h98-team"><i></i>MOS <strong data-score="0">0</strong></div><div class="h98-clock"><small>ПЕРИОД 1 / 3</small><span>1:00</span></div><div class="h98-team h98-away"><strong data-score="1">0</strong> DET<i></i></div></div><div class="h98-stage"><canvas width="960" height="600" aria-label="Хоккейный каток. Вы играете за синих и атакуете правые ворота."></canvas><div class="h98-notice" role="status"></div><section class="h98-panel"></section></div><div class="h98-touch"><button data-key="ArrowLeft" aria-label="Влево">◀</button><button data-key="ArrowUp" aria-label="Вверх">▲</button><button data-key="ArrowDown" aria-label="Вниз">▼</button><button data-key="ArrowRight" aria-label="Вправо">▶</button><button data-action="shoot">Бросок / отбор</button><button data-action="pass">Пас / смена</button></div><footer class="h98-bottom"><span>СИНИЕ → · WASD / стрелки · Space — бросок · X — пас · Shift — ускорение</span><span class="h98-shots">БРОСКИ 0 : 0</span></footer>`;
      this.canvas = root.querySelector('canvas'); this.ctx = this.canvas.getContext('2d'); this.panel = root.querySelector('.h98-panel');
      root.addEventListener('click', e => { const a = e.target.closest('[data-action]')?.dataset.action; if (a) this.action(a); }, {signal});
      root.addEventListener('keydown', e => {
        if (e.target.matches('select')) return;
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Tab'].includes(e.code)) e.preventDefault();
        this.keys[e.code] = true; if (e.repeat) return;
        if (e.code === 'Escape' || e.code === 'KeyP') this.action('pause');
        if (!this.paused) { if (e.code === 'Space') this.match.action(); if (e.code === 'KeyX' || e.code === 'Tab') this.match.action(true); }
      }, {signal});
      document.addEventListener('keyup', e => { delete this.keys[e.code]; }, {signal});
      root.addEventListener('pointerdown', e => { const k = e.target.closest('[data-key]'); if (k) { e.preventDefault(); k.setPointerCapture(e.pointerId); this.keys[k.dataset.key] = true; } else if (e.target === this.canvas) root.focus(); }, {signal});
      for (const event of ['pointerup','pointercancel','lostpointercapture']) root.addEventListener(event, e => { const k = e.target.closest('[data-key]'); if (k) delete this.keys[k.dataset.key]; }, {signal});
      root.addEventListener('focusout', e => { if (!root.contains(e.relatedTarget)) this.pause(); }, {signal});
      window.addEventListener('blur', () => this.pause(), {signal});
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); }, {signal});
      this.menu(); this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
    }
    menu(final = false) {
      this.panel.hidden = false;
      this.panel.innerHTML = `<div class="h98-card"><div class="h98-kicker">EA SPORTS • SEASON 1998</div><h1>NHL <b>98</b></h1><div class="h98-subtitle">EXHIBITION • ARCADE EDITION</div>${final ? `<h2>${this.match.message}</h2><p>Итоговый счёт ${this.match.score.join(' : ')} · Броски ${this.match.shots.join(' : ')}</p>` : `<div class="h98-matchup"><span>MOSCOW ICE</span><small>VS</small><span>DETROIT REDS</span></div><p>Три на три. Три периода по минуте.<br>Вы — синие. Атакуйте правые ворота!</p><div class="h98-controls"><div><b>WASD / ↑↓←→</b> · движение</div><div><b>Space</b> · бросок / силовой отбор</div><div><b>X / Tab</b> · пас / выбор игрока</div><div><b>Shift</b> · ускорение</div></div><p style="font-size:11px">Перед броском направьте игрока вверх или вниз, чтобы целиться в угол. Жёлтое кольцо — ваш игрок.</p>`}<label>Сложность<select aria-label="Сложность"><option value="easy">Любитель</option><option value="normal" selected>Профессионал</option><option value="hard">Звезда</option></select></label>${this.started && !final ? '<button data-action="resume">ПРОДОЛЖИТЬ</button>' : ''}<button data-action="new">${this.started ? 'НОВЫЙ МАТЧ' : 'НАЧАТЬ МАТЧ'}</button></div>`;
      this.panel.querySelector('select').value = this.match.difficulty;
    }
    pause() { if (this.paused) return; this.paused = true; this.keys = {}; this.menu(this.match.phase === 'final'); }
    action(a) {
      if (a === 'new') { this.match = new H.Match(this.panel.querySelector('select')?.value || 'normal'); this.started = true; this.resume(); this.sound('whistle'); }
      if (a === 'resume') this.resume();
      if (a === 'pause') { if (this.paused && this.started && this.match.phase !== 'final') this.resume(); else this.pause(); }
      if (a === 'sound') { this.muted = !this.muted; this.root.querySelector('[data-action="sound"]').textContent = 'Звук: ' + (this.muted ? 'выкл.' : 'вкл.'); }
      if (a === 'shoot' && !this.paused) this.match.action();
      if (a === 'pass' && !this.paused) this.match.action(true);
      if (a === 'full') { const p = document.fullscreenElement ? document.exitFullscreen() : this.root.requestFullscreen?.(); p?.catch(() => {}); }
    }
    resume() { this.paused = false; this.keys = {}; this.panel.hidden = true; this.root.focus(); }
    sound(event) {
      if (this.muted) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        this.audio ||= new AC(); this.audio.resume().catch(() => {});
        const osc = this.audio.createOscillator(), gain = this.audio.createGain(), now = this.audio.currentTime;
        const duration = event === 'goal' ? .7 : event === 'whistle' ? .28 : .09;
        osc.type = event === 'goal' ? 'sawtooth' : 'square'; osc.frequency.setValueAtTime(({goal:180,whistle:1500,shot:220,save:110,check:75,pass:300})[event] || 120, now);
        osc.frequency.exponentialRampToValueAtTime(event === 'goal' ? 360 : 60, now + duration);
        gain.gain.setValueAtTime(.035, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
        osc.connect(gain); gain.connect(this.audio.destination); osc.start(); osc.stop(now + duration);
      } catch (_) {}
    }
    frame(now) {
      if (this.destroyed) return;
      const dt = Math.min(.05, this.last ? (now - this.last) / 1000 : 0); this.last = now;
      if (!this.root.getClientRects().length || (this.isActive && !this.isActive())) this.pause();
      if (!this.paused) {
        let left = dt; while (left > 0) { const step = Math.min(left, 1/120); this.match.step(step, this.keys); left -= step; }
        if (this.match.event) { this.sound(this.match.event); this.match.event = ''; }
        if (this.match.phase === 'final') { this.paused = true; this.keys = {}; this.menu(true); }
      }
      this.draw(now / 1000);
      this.root.querySelectorAll('[data-score]').forEach((el, i) => { el.textContent = this.match.score[i]; });
      const sec = Math.ceil(this.match.time);
      this.root.querySelector('.h98-clock span').textContent = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
      this.root.querySelector('.h98-clock small').textContent = `ПЕРИОД ${this.match.period} / 3`;
      this.root.querySelector('.h98-shots').textContent = 'БРОСКИ ' + this.match.shots.join(' : ');
      this.root.querySelector('.h98-notice').textContent = this.paused ? '' : this.match.message;
      this.raf = requestAnimationFrame(this.frame);
    }
    draw(t) {
      const c = this.ctx, m = this.match;
      c.clearRect(0, 0, 960, 600); c.fillStyle = '#0a1421'; c.fillRect(0, 0, 960, 600);
      // Stadium seating, drawn from a fixed pattern to avoid flickering crowds.
      for (let row = 0; row < 6; row++) for (let col = 0; col < 80; col++) {
        c.fillStyle = ['#27445d','#526376','#873f4b','#baa58a','#172c45'][(row * 17 + col * 13) % 5];
        c.fillRect(col * 12 + (row % 2) * 5, 12 + row * 9, 7, 5);
        c.fillRect(col * 12, 536 + row * 9, 7, 5);
      }
      c.fillStyle = '#09121f'; c.fillRect(0, 72, 960, 28); c.fillRect(0, 511, 960, 25);
      c.font = 'bold 13px Courier New'; c.textAlign = 'center'; c.fillStyle = '#86a9c3';
      c.fillText('EA SPORTS      •      NHL 98      •      EXHIBITION NIGHT', 480, 90);
      c.fillText('MOSCOW ICE     /     HOME ARENA     /     SEASON 1998', 480, 529);
      c.save(); c.translate(30, 110); c.scale(1, .72);
      c.fillStyle = '#1e344b'; c.beginPath(); c.roundRect(24, 27, 852, 503, 70); c.fill();
      c.fillStyle = '#e6eef0'; c.strokeStyle = '#758fa3'; c.lineWidth = 7;
      c.beginPath(); c.roundRect(30, 23, 840, 490, 65); c.fill(); c.stroke();
      c.strokeStyle = '#e1b54c'; c.lineWidth = 5; c.beginPath(); c.roundRect(40, 35, 820, 468, 55); c.stroke();
      c.save(); c.beginPath(); c.roundRect(43, 39, 814, 460, 53); c.clip();
      const ice = c.createLinearGradient(0, 40, 0, 500); ice.addColorStop(0, '#d2e8ee'); ice.addColorStop(.5, '#f1f8f7'); ice.addColorStop(1, '#d5e9ee'); c.fillStyle = ice; c.fillRect(40, 38, 820, 465);
      c.strokeStyle = '#bdcfd633'; c.lineWidth = 1;
      for (let i = 0; i < 85; i++) { const x = 55 + (i * 167 % 770), y = 50 + (i * 83 % 440); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 38, y - 10); c.stroke(); }
      for (const x of [285, 615]) { c.fillStyle = '#4477ae'; c.fillRect(x - 3, 40, 6, 460); }
      c.strokeStyle = '#c85466'; c.lineWidth = 3; c.setLineDash([9, 7]); c.beginPath(); c.moveTo(450, 40); c.lineTo(450, 500); c.stroke(); c.setLineDash([]);
      const circle = (x,y,r,color) => { c.strokeStyle=color; c.lineWidth=2; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.stroke(); };
      circle(450,270,66,'#5181ac');
      c.save(); c.translate(450,270); c.rotate(-.16); c.fillStyle='#648fa530'; c.textAlign='center'; c.font='italic 900 35px Arial'; c.fillText('NHL 98',0,10); c.restore();
      for (const x of [180,720]) for (const y of [145,395]) { circle(x,y,54,'#cb7883'); c.fillStyle='#b74960'; c.fillRect(x-3,y-3,6,6); }
      for (const x of [85,815]) { c.fillStyle='#cce6f0'; c.fillRect(x===85?42:815,228,43,84); c.strokeStyle='#cd5261'; c.lineWidth=2; c.strokeRect(x===85?42:815,228,43,84); }
      c.restore();
      for (const x of [16,858]) {
        c.fillStyle='#afbfc9'; c.fillRect(x,223,27,94); c.strokeStyle='#758a98'; c.lineWidth=1;
        for (let y=224;y<318;y+=9) { c.beginPath();c.moveTo(x,y);c.lineTo(x+27,y);c.stroke(); }
        for(let xx=x;xx<x+28;xx+=7){c.beginPath();c.moveTo(xx,224);c.lineTo(xx,316);c.stroke();}
        c.strokeStyle='#c23d4c'; c.lineWidth=4;c.strokeRect(x,223,27,94);
      }
      // Upright pixel skaters over a foreshortened ice surface.
      const skater = (p, index) => {
        c.save(); c.translate(Math.round(p.x),Math.round(p.y)); c.scale(1,1/.72);
        c.fillStyle='#28495c40'; c.beginPath();c.ellipse(1,3,14,5,0,0,Math.PI*2);c.fill();
        if(index===m.selected){c.strokeStyle='#f1b82b';c.lineWidth=2;c.beginPath();c.ellipse(0,3,17,7,0,0,Math.PI*2);c.stroke();c.fillStyle='#ffc840';c.beginPath();c.moveTo(-5,-42);c.lineTo(5,-42);c.lineTo(0,-36);c.fill();}
        if(p.stun){c.rotate(.8);}
        const stride = Math.hypot(p.vx,p.vy)>30 ? Math.sin(t*19+index)*3 : 0;
        c.fillStyle='#0b192b';c.fillRect(-8,-6,6,10+stride);c.fillRect(3,-6,6,10-stride);
        c.fillStyle='#b3c6cf';c.fillRect(-10,4+stride,10,2);c.fillRect(2,4-stride,11,2);
        if(p.goalie){c.fillStyle='#e4dbbc';c.fillRect(-10,-7,8,13);c.fillRect(3,-7,8,13);}
        c.fillStyle=p.team?'#a32539':'#16659a';c.fillRect(-11,-24,22,18);
        c.fillStyle=p.team?'#ed4b55':'#39b4ef';c.fillRect(-9,-25,18,11);
        c.fillStyle='#f1eee0';c.fillRect(-11,-11,22,3);c.fillRect(-15,-22,5,12);c.fillRect(10,-22,5,12);
        c.fillStyle='#edc3a1';c.fillRect(-5,-31,10,7);c.fillStyle=p.team?'#f2ece3':'#163c61';c.fillRect(-7,-36,14,8);
        c.fillStyle='#152436';c.fillRect(-5,-28,10,2);
        c.strokeStyle='#6f5840';c.lineWidth=3;c.beginPath();c.moveTo(12,-12);c.lineTo(p.dx*24,p.dy*12+7);c.lineTo(p.dx*24+9,p.dy*12+7);c.stroke();
        c.fillStyle='white';c.font='bold 9px monospace';c.textAlign='center';c.fillText(p.number,0,-14);c.restore();
      };
      m.players.map((p,i)=>({p,i})).sort((a,b)=>a.p.y-b.p.y).forEach(o=>skater(o.p,o.i));
      c.fillStyle='#07121b';c.beginPath();c.ellipse(m.puck.x,m.puck.y,5,4,0,0,Math.PI*2);c.fill();
      c.fillStyle='#657787';c.fillRect(m.puck.x-2,m.puck.y-3,4,1);
      c.restore();
    }
    destroy() { this.destroyed = true; cancelAnimationFrame(this.raf); this.events.abort(); this.audio?.close().catch(() => {}); this.root.replaceChildren(); }
  }
  H.Game = Game;
  globalThis.appHockey = { open() {
    const id = 'app_hockey'; if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
    const root = document.createElement('div');
    window.winManager.createWindow({id,title:'NHL 98',icon:'hockey',width:Math.min(1020,window.innerWidth-30),height:Math.min(790,window.innerHeight-65),x:15,y:15,content:root,onClose:()=>{this.game?.destroy();this.game=null;}});
    this.game = new Game(root); this.game.isActive = () => window.winManager.isTopWindow(id);
  }};
})(globalThis.Hockey98 = globalThis.Hockey98 || {});
