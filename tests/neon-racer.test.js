const assert=require('node:assert/strict');
for(const file of ['catalog','track','physics','hud'])require('../js/apps/neon-racer/'+file+'.js');
const N=globalThis.NeonRacer,track=new N.TrackManager();
const drive={throttle:1,brake:0,steer:0,drift:false,nitro:false};
const free={sample:()=>({x:0,z:0,yaw:0}),halfWidth:10000,nearest:(x,z)=>({x,z,distance:0})};
const a=new N.Physics(free),b=new N.Physics(free);for(let i=0;i<1200;i++){a.step(drive,1/120);b.step({...drive,nitro:true},1/120);}assert.ok(b.z>a.z);assert.ok(b.nitro>=0&&b.nitro<=1);
for(let i=0;i<600;i++)a.step({...drive,throttle:0,brake:1},1/120);assert.ok(a.speed<.3);
const wall=new N.Physics(track);for(let i=0;i<6000;i++)wall.step({...drive,steer:Math.sin(i/30),drift:true},1/120);assert.ok(Number.isFinite(wall.speed));assert.ok(track.nearest(wall.x,wall.z).distance<=track.halfWidth-1+.01);
const r=new N.RaceSession();for(let i=0;i<20;i++){r.step(.99,.01);r.step(.01,.01);}assert.equal(r.lap,1);r.reset();for(let lap=0;lap<3;lap++){for(let i=1;i<100;i++)r.step(i/100,.1);r.step(0,.1);}assert.equal(r.finished,true);assert.equal(r.lap,3);assert.ok(r.best>9.9);
const rev=new N.RaceSession();for(let i=99;i>=0;i--)rev.step(i/100,.1);assert.equal(rev.lap,1);
console.log('PASS acceleration, nitro bounds, braking, barriers, finite drift simulation, ordered laps, reverse crossing and three-lap finish');

for(const race of N.Races){const track=new N.TrackManager(race.id);assert.equal(track.points.length,track.closed?128:129);for(let i=0;i<=100;i++){const t=i/100,p=track.sample(t),near=track.nearest(p.x,p.z);assert.ok(near.distance<.2);if(t<1||!track.closed)assert.ok(Math.abs(near.progress-t)<.001);}if(!track.closed){const p=track.sample(1);assert.ok(Math.hypot(p.x-track.points[0].x,p.z-track.points[0].z)>800);}}
const sprint=new N.RaceSession('sprint');sprint.step(.99,.1);assert.equal(sprint.finished,false);sprint.reset();for(let i=1;i<=99;i++)sprint.step(i/100,.1);assert.equal(sprint.finished,true);assert.equal(sprint.lap,1);
const results=N.Cars.map(c=>{const p=new N.Physics(free,c);for(let i=0;i<1200;i++)p.step(drive,1/120);return p.speed;});assert.equal(new Set(results).size,3);
console.log('PASS three distinct car tunings, all track progress, open sprint topology and checkpoint-gated sprint finish');
