const assert=require('node:assert/strict');
for(const m of ['catalog','track','physics','hud','traffic','race-ai'])require('../js/apps/neon-racer/'+m+'.js');
const N=globalThis.NeonRacer;

console.log('--- Testing Stage 4: Traffic System ---');

// 1. Initialization and pre-spawn count
{
 const track=new N.TrackManager('dockside');
 const player=new N.Physics(track);
 const session=new N.RaceSession('circuit');
 const ai=new N.RaceAI(track,player,session);
 const traffic=new N.TrafficManager(track,player,ai,{targetTrafficCount:5});

 assert.ok(traffic.vehicles.length>=3&&traffic.vehicles.length<=5,'initial traffic pre-spawn count between 3 and 5');
 for(const v of traffic.vehicles){
  assert.equal(v.type,'van','all initial vehicles are white box vans');
  assert.equal(v.mass,2200,'van mass is 2200kg');
  assert.ok(v.speed>=13.5&&v.speed<=17.5,'initial speed in cruise range 13.5-17.5 m/s');
  assert.ok(Math.abs(v.laneOffset)<=track.halfWidth-2,'lane offset stays within road boundaries');
 }
 console.log('PASS 1. TrafficManager initialization & correct pre-spawn count');
}

// 2. Spawn ahead of player & not too close
{
 const track=new N.TrackManager('dockside');
 const player=new N.Physics(track);
 const session=new N.RaceSession('circuit');
 const ai=new N.RaceAI(track,player,session);
 const traffic=new N.TrafficManager(track,player,ai,{targetTrafficCount:5});

 for(const v of traffic.vehicles){
  const dist=Math.hypot(v.x-player.x,v.z-player.z);
  assert.ok(dist>=70,'traffic spawned at least 70m away from player: '+dist.toFixed(1)+'m');
 }
 console.log('PASS 2. Pre-spawned traffic is at safe distance ahead (>=70m)');
}

// 3. Dynamic spawn during race
{
 const track=new N.TrackManager('dockside');
 const player=new N.Physics(track);
 const session=new N.RaceSession('circuit');
 const ai=new N.RaceAI(track,player,session);
 const traffic=new N.TrafficManager(track,player,ai,{targetTrafficCount:5});

 // Clear vehicles to trigger dynamic spawn
 traffic.vehicles=[];
 traffic.spawnCooldown=0;
 traffic.trySpawn();
 assert.equal(traffic.vehicles.length,1,'dynamically spawned 1 vehicle');
 const spawned=traffic.vehicles[0];
 const dist=Math.hypot(spawned.x-player.x,spawned.z-player.z);
 assert.ok(dist>=70&&dist<=160,'dynamically spawned vehicle is 70-160m ahead: '+dist.toFixed(1)+'m');
 console.log('PASS 3. Dynamic spawn correctly places vehicle ahead');
}

// 4. Despawn far behind player
{
 const track=new N.TrackManager('dockside');
 const player=new N.Physics(track);
 const session=new N.RaceSession('circuit');
 const ai=new N.RaceAI(track,player,session);
 const traffic=new N.TrafficManager(track,player,ai,{targetTrafficCount:5});

 traffic.vehicles=[];
 // Place a van 110m behind player
 const playerProg=track.nearest(player.x,player.z).progress;
 const behindProg=(playerProg - (110/traffic.trackLength) + 1)%1;
 const p=track.sample(behindProg);
 const van=new N.TrafficVehicle(track,{progress:behindProg,x:p.x,z:p.z});
 traffic.vehicles.push(van);

 traffic.checkDespawn();
 assert.equal(traffic.vehicles.length,0,'van 110m behind player was cleanly despawned');
 console.log('PASS 4. Despawn vehicles far behind player');
}

// 5. Despawn prevented when close to active AI racer
{
 const track=new N.TrackManager('dockside');
 const player=new N.Physics(track);
 const session=new N.RaceSession('circuit');
 const ai=new N.RaceAI(track,player,session);
 const traffic=new N.TrafficManager(track,player,ai,{targetTrafficCount:5});

 traffic.vehicles=[];
 const playerProg=track.nearest(player.x,player.z).progress;
 const behindProg=(playerProg - (100/traffic.trackLength) + 1)%1;
 const p=track.sample(behindProg);
 const van=new N.TrafficVehicle(track,{progress:behindProg,x:p.x,z:p.z});
 traffic.vehicles.push(van);

 // Place rival right next to van (10m away)
 ai.rivals[0].body.x=p.x+5;
 ai.rivals[0].body.z=p.z+5;
 ai.rivals[0].session.finished=false;

 traffic.checkDespawn();
 assert.equal(traffic.vehicles.length,1,'van not despawned because AI rival is within 28m');
 console.log('PASS 5. Near-AI despawn protection preserves active interactions');
}

// 6. Reset clears traffic and prevents duplicates
{
 const track=new N.TrackManager('dockside');
 const player=new N.Physics(track);
 const session=new N.RaceSession('circuit');
 const ai=new N.RaceAI(track,player,session);
 const traffic=new N.TrafficManager(track,player,ai,{targetTrafficCount:5});

 const initialCount=traffic.vehicles.length;
 traffic.reset();
 assert.equal(traffic.vehicles.length,initialCount,'reset repopulates fresh traffic without leaks or duplicates');
 traffic.reset();
 assert.equal(traffic.vehicles.length,initialCount,'subsequent reset maintains exact traffic count');
 console.log('PASS 6. TrafficManager reset cleanly wipes and resets state');
}

// 7. Longitudinal avoidance (slowdown behind vehicle in same lane)
{
 const track=new N.TrackManager('dockside');
 const p1=track.sample(0.1);
 const p2=track.sample(0.1 + (15/850)); // 15m ahead

 const leadVan=new N.TrafficVehicle(track,{progress:0.1 + (15/850),laneOffset:3.6,speed:12});
 const followVan=new N.TrafficVehicle(track,{progress:0.1,laneOffset:3.6,speed:16});

 // Step followVan with leadVan ahead
 const preSpeed=followVan.speed;
 for(let i=0;i<60;i++){
  followVan.step(1/60,leadVan);
 }
 assert.ok(followVan.speed<preSpeed,'follower van slowed down behind lead van in same lane: '+followVan.speed.toFixed(2)+' < '+preSpeed);
 console.log('PASS 7. Longitudinal avoidance slows vehicle behind traffic');
}

// 8. Player ↔ Van collision & mass ratio response
{
 const track=new N.TrackManager('dockside');
 const p=track.sample(0.1);

 // Test with light Spark RS (1050kg) vs Van (2200kg)
 const spark=new N.Physics(track,N.Cars[1]); // Spark RS
 spark.x=p.x; spark.z=p.z; spark.yaw=p.yaw; spark.vx=Math.sin(p.yaw)*25; spark.vz=Math.cos(p.yaw)*25; spark.speed=25;

 const van1=new N.TrafficVehicle(track,{x:p.x+Math.sin(p.yaw)*1.5,z:p.z+Math.cos(p.yaw)*1.5,laneOffset:0,speed:10});
 const contacts1=new Map();
 const active1=new Set();

 N.resolveVehicleCollision({body:spark,name:'SPARK'},{body:van1,name:'VAN1'},contacts1,active1,1/120,track);
 const sparkPostSpeed=spark.speed;
 const van1PostSpeed=van1.speed;

 // Test with heavy Vandal V8 (1520kg) vs Van (2200kg)
 const vandal=new N.Physics(track,N.Cars[2]); // Vandal V8
 vandal.x=p.x; vandal.z=p.z; vandal.yaw=p.yaw; vandal.vx=Math.sin(p.yaw)*25; vandal.vz=Math.cos(p.yaw)*25; vandal.speed=25;

 const van2=new N.TrafficVehicle(track,{x:p.x+Math.sin(p.yaw)*1.5,z:p.z+Math.cos(p.yaw)*1.5,laneOffset:0,speed:10});
 const contacts2=new Map();
 const active2=new Set();

 N.resolveVehicleCollision({body:vandal,name:'VANDAL'},{body:van2,name:'VAN2'},contacts2,active2,1/120,track);
 const vandalPostSpeed=vandal.speed;
 const van2PostSpeed=van2.speed;

 assert.ok(van2PostSpeed>van1PostSpeed,'heavy Vandal V8 transferred more momentum to van than light Spark RS did ('+van2PostSpeed.toFixed(2)+' > '+van1PostSpeed.toFixed(2)+')');
 assert.ok(vandalPostSpeed>sparkPostSpeed,'heavy Vandal retained more speed than Spark after raming the van ('+vandalPostSpeed.toFixed(2)+' > '+sparkPostSpeed.toFixed(2)+')');
 console.log('PASS 8. Player <-> Van collision exhibits realistic mass ratio exchange');
}

// 9. Off-center yaw impulse & recovery on Van
{
 const track=new N.TrackManager('dockside');
 const p=track.sample(0.2);
 const van=new N.TrafficVehicle(track,{progress:0.2,laneOffset:0,speed:15});

 const rammer=new N.Physics(track,N.Cars[0]);
 // Position rammer striking rear-quarter on right side
 rammer.x=van.x + Math.cos(van.yaw)*1.2 - Math.sin(van.yaw)*1.8;
 rammer.z=van.z - Math.sin(van.yaw)*1.2 - Math.cos(van.yaw)*1.8;
 rammer.vx=Math.sin(van.yaw)*28; rammer.vz=Math.cos(van.yaw)*28; rammer.speed=28;

 const contacts=new Map(), active=new Set();
 N.resolveVehicleCollision({body:rammer,name:'RAMMER'},{body:van,name:'VAN'},contacts,active,1/120,track);

 assert.ok(Math.abs(van.yawRate)>0.15,'rear-quarter hit induced significant yawRate spin on van: '+van.yawRate.toFixed(3));

 // Simulate recovery over 2 seconds
 for(let i=0;i<120;i++){
  van.step(1/60);
 }
 assert.ok(Math.abs(van.yawRate)<0.05,'van yawRate stabilized back to near-zero after impact: '+van.yawRate.toFixed(4));
 assert.ok(van.speed>8,'van recovered forward momentum: '+van.speed.toFixed(2)+' m/s');
 console.log('PASS 9. Off-center PIT impact spins van, followed by natural stabilization');
}

// 10. AI racers finish track with traffic present
{
 const track=new N.TrackManager('dockside');
 const player=new N.Physics(track);
 const session=new N.RaceSession('circuit');
 const ai=new N.RaceAI(track,player,session);
 const traffic=new N.TrafficManager(track,player,ai,{targetTrafficCount:4});
 ai.traffic=traffic;

 for(let step=0;step<120*180&&!ai.rivals.every(r=>r.session.finished);step++){
  ai.step(1/120);
  traffic.step(1/120);
 }

 assert.ok(ai.rivals.every(r=>r.session.finished),'all AI rivals successfully finish the track with traffic active');
 for(const r of ai.rivals){
  assert.ok(Number.isFinite(r.body.x)&&Number.isFinite(r.body.z),'racer coordinates are finite');
 }
 for(const v of traffic.vehicles){
  assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.z),'traffic coordinates are finite');
  assert.ok(Number.isFinite(v.speed)&&!Number.isNaN(v.speed),'traffic speed is finite');
 }
 console.log('PASS 10. AI racers finish race cleanly with live traffic present, zero NaN/Infinity');
}

console.log('ALL 10 STAGE 4 TRAFFIC TESTS PASSED!');
