(function(N){
class RaceSession {
 constructor(type='circuit'){this.type=type;this.reset();}
 reset(){Object.assign(this,{elapsed:0,lapTime:0,best:Infinity,lap:1,next:1,finished:false,last:0,progress:0});}
 step(progress,dt){if(this.finished)return;this.elapsed+=dt;this.lapTime+=dt;
 // Ordered quarter checkpoints prevent finish-line oscillation from awarding laps.
 this.progress=progress;const delta=progress-this.last;if(delta>0&&delta<.1&&this.next<4&&progress>=this.next/4)this.next++;
 if(this.type==='sprint'&&this.next===4&&this.last<.99&&progress>=.99&&delta>0&&delta<.1){this.finished=true;this.best=this.elapsed;}if(this.type==='circuit'&&this.next===4&&this.last>.9&&progress<.1){this.best=Math.min(this.best,this.lapTime);this.lapTime=0;this.next=1;if(this.lap===3)this.finished=true;else this.lap++;}this.last=progress;
 }
}
const time=s=>Number.isFinite(s)?`${Math.floor(s/60)}:${(s%60).toFixed(2).padStart(5,'0')}`:'--:--.--';
class HUD {
 constructor(root){root.innerHTML=`<div class="nr-top"><div><small>NIGHT RUN / CIRCUIT 01</small><b>DOCKSIDE <em>AFTERDARK</em></b></div><div class="nr-lap"></div></div><div class="nr-timing"></div><div class="nr-drift"></div><div class="nr-bottom"><div><small>N₂O RESERVE</small><meter class="nr-nitro" min="0" max="1"></meter></div><div class="nr-dial"><div class="nr-speed"></div><meter class="nr-rpm" min="0" max="8500"></meter></div></div>`;this.root=root;this.nodes={};for(const n of ['lap','timing','drift','nitro','speed','rpm'])this.nodes[n]=root.querySelector('.nr-'+n);}
 setRace(race,car){this.root.querySelector(".nr-top small").textContent=car.name+" / "+race.type.toUpperCase();this.root.querySelector(".nr-top b").textContent=race.name;}
 update(p,r,t,raceAI){const n=this.nodes;n.lap.textContent=(raceAI?'POS '+raceAI.position+' / 4\n':'')+(r.type==="sprint"?`${Math.min(100,Math.floor(r.progress/.99*100))}%`:`LAP ${r.lap} / 3`);n.timing.innerHTML=`TIME ${time(r.lapTime)}<br>BEST ${time(r.best)}<br>TOTAL ${time(r.elapsed)}`;n.drift.textContent=p.slip>.12&&p.speed>9?`DRIFT + ${Math.floor(p.score)}`:`STYLE ${Math.floor(p.score)}`;n.nitro.value=p.nitro;n.rpm.value=t.rpm;n.speed.innerHTML=`<strong>${Math.round(p.speed*3.6).toString().padStart(3,'0')}</strong><span>KM/H<br>GEAR ${t.gear}</span>`;}
}
N.RaceSession=RaceSession;N.HUD=HUD;N.formatTime=time;
})(globalThis.NeonRacer=globalThis.NeonRacer||{});


