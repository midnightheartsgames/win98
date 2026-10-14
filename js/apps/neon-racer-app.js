(function(N){
class Game {
 constructor(root){this.root=root;this.events=new AbortController();const signal=this.events.signal;root.classList.add('nr-app');root.tabIndex=0;
 root.innerHTML=`<nav class="nr-menu"><details><summary>File</summary><div><button data-action="menu">Main menu</button><button data-action="restart">Restart race</button><button data-action="pause">Pause / Resume</button><button data-action="exit">Exit</button></div></details><details><summary>View</summary><div><button data-action="glide">3dfx Glide</button><button data-action="ps1">PS1 vertex jitter</button></div></details><details><summary>Help</summary><div><button data-action="help">Controls / About</button></div></details></nav><div class="nr-viewport"><div class="nr-stage"><canvas aria-label="Трёхмерная ночная гонка"></canvas><div class="nr-hud"></div><div class="nr-overlay"></div></div></div><footer class="nr-status">320 × 240 • 3dfx Glide • ↑ Gas · ↓ Brake · ← → Steer · Space Drift · Shift N₂O · C Cam · Esc Pause</footer>`;
 this.track=new N.TrackManager();this.physics=new N.Physics(this.track);this.session=new N.RaceSession();this.controller=new N.VehicleController(root);this.hud=new N.HUD(root.querySelector('.nr-hud'));this.overlay=root.querySelector('.nr-overlay');this.canvas=root.querySelector('canvas');this.stage=root.querySelector('.nr-stage');this.viewport=root.querySelector('.nr-viewport');
 try{this.renderer=new N.Renderer(this.canvas,this.track);}catch(e){this.overlay.textContent=e.message;this.controller.destroy();return;}
 this.state='ready';this.accumulator=0;this.last=0;this.ps1=false;
 root.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action){this.action(action);root.querySelectorAll('details').forEach(d=>d.open=false);}else if(!e.target.closest('nav'))root.focus();},{signal});
 root.addEventListener('keydown',e=>{if(this.menu?.key(e))return;if(e.code==='Escape'){e.preventDefault();this.action('pause');}if(e.code==='KeyC'){e.preventDefault();this.action('cam');}},{signal});
 root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))this.pause();},{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();},{signal});
 this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.pause();this.state='lost';this.overlay.innerHTML='<h2>WebGL context lost</h2><p>Закройте и снова откройте игру.</p>';this.overlay.hidden=false;},{signal});
 this.resize=new ResizeObserver(()=>{const scale=Math.max(1,Math.floor(Math.min(this.viewport.clientWidth/320,this.viewport.clientHeight/240)));this.stage.style.width=320*scale+'px';this.stage.style.height=240*scale+'px';this.stage.style.setProperty('--nr-scale',scale);if(!this.viewport.clientWidth)this.pause();});this.resize.observe(this.viewport);
 this.menu=new N.MainMenu(this);this.menu.intro();
 this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);root.focus();
 }
 show(title,subtitle,label,action){this.overlay.className='nr-overlay';this.overlay.hidden=false;this.overlay.innerHTML=`<small>UNDERGROUND RACING • EST. 1999</small><h1>${title}</h1><p>${subtitle}</p><button data-action="${action}">${label} ▸</button><button class="nr-back" data-action="menu">MAIN MENU</button><p class="nr-hint">↑ / W — газ · ← → / A D — руль<br>↓ / S — тормоз · Space — дрифт · Shift — нитро · C — камера</p>`;}
 pause(){if(this.state==='running'){this.state='paused';this.controller.clear();this.show('PAUSED','RACE SUSPENDED','RESUME','pause');}}
 action(a){if(this.state==='lost')return;
 if(a==='intro-next'){this.menu.advance();}
 if(this.state==='intro'&&a!=='intro-next'&&a!=='exit')return;
 if(a==='menu'){this.menu.render();}
 if(a.startsWith('quick:'))this.menu.quickAction(a.split(':')[1]);
 if(a.startsWith('front:'))this.menu.front(a.split(':')[1]);
 if(a.startsWith('garage:')){this.menu.car=N.Cars.find(c=>c.id===a.split(':')[1])||this.menu.car;this.renderer.destroy();this.renderer=new N.Renderer(this.canvas,this.track,this.menu.car);this.menu.front('customize');}
 if(a.startsWith('setting:')){this.action(a.split(':')[1]);this.menu.front('options');}
 if(a==='career-next'){this.careerIndex++;this.menu.race=N.Races[this.careerIndex];a='restart';}
 if(a.startsWith('car:')||a.startsWith('race:'))this.menu.select(a);
 if(a==='restart'){
  this.state='menu';this.renderer.destroy();this.track=new N.TrackManager(this.menu.race.id);this.physics=new N.Physics(this.track,this.menu.car);this.session=new N.RaceSession(this.menu.race.type);
  try{this.renderer=new N.Renderer(this.canvas,this.track,this.menu.car);}catch(e){this.state='lost';this.overlay.classList.remove('nr-main');this.overlay.hidden=false;this.overlay.textContent=e.message;return;}
  this.raceAI=new N.RaceAI(this.track,this.physics,this.session);
  this.traffic=new N.TrafficManager(this.track,this.physics,this.raceAI);
  this.raceAI.traffic=this.traffic;
  this.hud.setRace(this.menu.race,this.menu.car);this.hud.root.hidden=false;this.accumulator=0;this.controller.clear();this.root.focus();this.overlay.className='nr-overlay';this.overlay.hidden=true;this.overlay.replaceChildren();this.menu.previewCar=null;this.renderer.resetCamera();this.state='running';
 }
 if(a==='cam'){this.renderer?.cycleCamera();}
 if(a==='pause'){if(this.state==='paused'){this.state='running';this.overlay.hidden=true;}else this.pause();}
 if(a==='help'){this.pause();this.show('MIDNIGHT GLIDE','Две кольцевые гонки по 3 круга и спринт.<br>Space — дрифт; Shift — нитро; C — камера; стрелки — руль и газ.','BACK',this.state==='paused'?'pause':'menu');}
 if(a==='glide'||a==='ps1'){this.ps1=a==='ps1';this.root.querySelector('.nr-status').textContent=`320 × 240 • ${this.ps1?'PS1 jitter / nearest':'3dfx Glide / bilinear'} • Esc — пауза · Shift — нитро · C — камера`;}
 if(a==='exit'){if(this.onExit)this.onExit();else this.menu.panel('QUIT GAME','<p>Двигатель остановлен.</p><button data-action="menu">RETURN TO MAIN MENU</button>');return;}this.root.focus();}
 tick(now){if(this.destroyed)return;const dt=this.last?Math.min((now-this.last)/1000,.1):0;this.last=now;
 if(!this.root.getClientRects().length)this.pause();
 this.menu.update(dt);if(this.state==='running'){this.accumulator+=dt;while(this.accumulator>=1/120){this.physics.step(this.controller.read(),1/120);this.raceAI.step(1/120);this.traffic?.step(1/120);this.accumulator-=1/120;if(this.session.finished){this.state='finished';this.physics.boost=false;this.controller.clear();this.menu.record();this.show(this.career&&this.careerIndex===2?'SERIES COMPLETE':'FINISH','POSITION '+this.raceAI.position+' / 4<br>'+this.raceAI.results()+'<br>STYLE '+Math.floor(this.physics.score),this.career&&this.careerIndex<2?'NEXT EVENT':'RACE AGAIN',this.career&&this.careerIndex<2?'career-next':'restart');break;}}}
 if(this.state!=='lost'){this.renderer.render(this.physics,this.ps1,this.state==='menu',now/1000,['running','paused','finished'].includes(this.state)?this.raceAI?.rivals:[],['running','paused','finished'].includes(this.state)?this.traffic?.vehicles:[],dt||1/60);this.hud.update(this.physics,this.session,this.controller.transmission(this.physics.speed),this.raceAI);}this.raf=requestAnimationFrame(this.tick);}
 destroy(){this.destroyed=true;cancelAnimationFrame(this.raf);this.events.abort();this.resize?.disconnect();this.controller?.destroy();this.renderer?.destroy();this.traffic?.reset();this.root.replaceChildren();}
}
N.Game=Game;
})(globalThis.NeonRacer=globalThis.NeonRacer||{});
class AppNeonRacer {
 open(){const id='app_neon_racer';if(window.winManager.windows.has(id)){window.winManager.restoreWindow(id);return;}const content=document.createElement('div');window.winManager.createWindow({id,title:'Midnight Glide — Underground Racing',icon:'burnout',width:680,height:580,content,onClose:()=>{this.game?.destroy();this.game=null;}});this.game=new NeonRacer.Game(content);this.game.onExit=()=>window.winManager.closeWindow(id);}
}
window.appNeonRacer=new AppNeonRacer();


