/* Deterministic opponents: steering/throttle inputs feed the same Physics as the player. */
(function(N){
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
class RaceAI {
 constructor(track,player,session){this.track=track;this.contacts=new Map();this.player={name:'YOU',body:player,session,player:true};this.rivals=N.Cars.map((car,i)=>{const body=new N.Physics(track,car),t=i===0?0:.009,p=track.sample(t),lane=i===1?-3:3;body.x=p.x+Math.cos(p.yaw)*lane;body.z=p.z-Math.sin(p.yaw)*lane;body.yaw=p.yaw;const r={name:['RAVEN','AXEL','GHOST'][i],body,session:new N.RaceSession(track.closed?'circuit':'sprint'),lane,homeLane:lane,pace:[.94,1,.90][i]};r.session.last=track.nearest(body.x,body.z).progress;return r;});const p=track.sample(0);player.x=p.x-Math.cos(p.yaw)*3;player.z=p.z+Math.sin(p.yaw)*3;session.last=track.nearest(player.x,player.z).progress;this.entries=[this.player,...this.rivals];}
 input(r,dt){const b=r.body,t=this.track.nearest(b.x,b.z).progress,local=this.track.sample(t),next=this.track.sample(Math.min(1,t+.001));const metresPerT=Math.max(500,Math.hypot(next.x-local.x,next.z-local.z)/.001);const ahead=clamp((8+b.speed*.65)/metresPerT,.008,.055);const sample=u=>this.track.sample(this.track.closed?(u%1+1)%1:clamp(u,0,1));
  let lane=r.homeLane,blocked=false;
  const obstacles=[...this.entries.filter(e=>e!==r&&!e.session.finished).map(e=>e.body),...(this.traffic?.vehicles||[])];
  for(const obs of obstacles){
   const dx=obs.x-b.x,dz=obs.z-b.z;
   const forward=dx*Math.sin(b.yaw)+dz*Math.cos(b.yaw);
   const side=dx*Math.cos(b.yaw)-dz*Math.sin(b.yaw);
   if(forward>0&&forward<20&&Math.abs(side)<3.0){
    lane=Math.abs(side)>.4?(side>=0?-3.8:3.8):(r.lane>=0?-3.8:3.8);
    if(forward<6&&Math.abs(side)<1.8)blocked=true;
   }
  }
  r.lane+=(lane-r.lane)*(1-Math.exp(-dt*1.8));const target=sample(t+ahead);target.x+=Math.cos(target.yaw)*r.lane;target.z-=Math.sin(target.yaw)*r.lane;const error=angle(Math.atan2(target.x-b.x,target.z-b.z)-b.yaw);
  // Lateral acceleration a=v²*kappa limits corner speed; preview the curve before arrival.
  const far=sample(t+ahead*2),curvature=Math.abs(angle(far.yaw-local.yaw))/Math.max(1,ahead*2*metresPerT);let desired=clamp(Math.sqrt(6.5/Math.max(.001,curvature)),14,39)*r.pace;if(Math.abs(error)>.65)desired=Math.min(desired,12);if(blocked)desired=Math.min(desired,16);
  return{steer:clamp(error*2.8/b.car.steering,-1,1),throttle:b.speed<desired?1:0,brake:b.speed>desired+1?clamp((b.speed-desired)/7,0,1):0,drift:false,nitro:curvature<.003&&Math.abs(error)<.12&&!blocked&&b.speed>19&&b.nitro>.25};}
 step(dt){for(const r of this.rivals){if(r.session.finished)continue;r.body.step(this.input(r,dt),dt);}this.collide(dt);for(const e of this.entries){if(e.session.finished)continue;e.session.step(this.track.nearest(e.body.x,e.body.z).progress,dt);if(e.session.finished){e.body.boost=false;e.body.vx=0;e.body.vz=0;e.body.speed=0;}}}
 collide(dt=1/120){
  const activeContacts=new Set();
  for(let i=0;i<this.entries.length;i++){
   for(let j=i+1;j<this.entries.length;j++){
    const a=this.entries[i],b=this.entries[j];
    if(a.session.finished||b.session.finished)continue;
    N.resolveVehicleCollision(a,b,this.contacts,activeContacts,dt,this.track);
   }
  }
  for(const key of this.contacts.keys())if(!activeContacts.has(key))this.contacts.delete(key);
  for(const key of activeContacts)this.contacts.set(key,true);
 }
 standings(){const progress=e=>(this.track.closed?e.session.lap-1:0)+e.session.progress;return [...this.entries].sort((a,b)=>{if(a.session.finished&&b.session.finished)return a.session.elapsed-b.session.elapsed;if(a.session.finished)return -1;if(b.session.finished)return 1;return progress(b)-progress(a);});}
 get position(){return this.standings().findIndex(e=>e.player)+1;}
 results(){return this.standings().map((e,i)=>`${i+1}. ${e.name} — ${e.session.finished?N.formatTime(e.session.elapsed):'не финишировал'}`).join('<br>');}
}
N.RaceAI=RaceAI;
})(globalThis.NeonRacer=globalThis.NeonRacer||{});
