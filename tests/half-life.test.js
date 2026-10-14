// Deterministic gameplay tests: run without a DOM, audio device or GPU.
const assert = require('node:assert/strict');
require('../js/apps/half-life/core.js');
require('../js/apps/half-life/world.js');
const H = globalThis.HL98;
let count = 0;
function test(name, body) { body(); count++; console.log('PASS', name); }
const world = (level = 0) => new H.World(level, {}, { random: () => .5 });
const advance = (w, seconds, input = {}) => { for (let t=0;t<seconds;t+=1/120) w.step(input,1/120); };
const aim = (p, target, height = 1) => { p.yaw=Math.atan2(target.z-p.z,target.x-p.x);p.pitch=Math.atan2(height-p.y-(p.crouch?.85:1.6),H.distance(p,target)); };
test('walking, sprinting, normalized diagonal movement, jumping and crouching',()=>{
  const a=world(),b=world();a.player.step(a,{KeyW:true},.3);b.player.step(b,{KeyW:true,KeyD:true},.3);
  assert.ok(Math.abs(H.distance({x:4,z:6.5},a.player)-H.distance({x:4,z:6.5},b.player))<1e-8);
  const c=world();c.player.step(c,{KeyW:true,ShiftLeft:true},.3);assert.ok(c.player.x>a.player.x);
  let maxY=0;for(let i=0;i<120;i++){a.player.step(a,{Space:i===0},1/120);maxY=Math.max(maxY,a.player.y);}assert.ok(maxY>1&&maxY<1.15);assert.equal(a.player.y,0);
  a.player.step(a,{ControlLeft:true},.01);assert.equal(a.player.crouch,true);
});
test('swept movement cannot tunnel through walls or closed doors',()=>{
  const w=world();w.player.x=10;w.player.z=6.5;w.move(w.player,12,0,.25);assert.ok(w.player.x<12);
  w.player.x=5;w.player.z=1.4;w.move(w.player,0,-10,.25);assert.ok(w.player.z>=1.25);
  w.player.x=10;w.player.z=6.5;w.doors[0].interact(w);w.move(w.player,5,0,.25);assert.ok(w.player.x>14);
});
test('closed doors occlude weapons and target detection',()=>{
  const w=world();w.enemies=[new H.Zombie(14,6.5)];w.player.x=10;w.player.z=6.5;aim(w.player,w.enemies[0]);
  assert.equal(w.visible(w.player,w.enemies[0]),false);assert.equal(w.trace(20,true),null);
  w.doors[0].interact(w);assert.equal(w.visible(w.player,w.enemies[0]),true);assert.equal(w.trace(20,true),w.enemies[0]);
});
test('crowbar one-hits a headcrab, respects range and cooldown',()=>{
  const w=world(),p=w.player;p.crowbar=true;w.equip('crowbar');const e=new H.Headcrab(5.2,6.5);w.enemies=[e];aim(p,e,.35);
  assert.equal(w.weapons.crowbar.attack(w),true);assert.equal(e.hp,0);assert.equal(w.weapons.crowbar.attack(w),false);
  const far=new H.Zombie(8,6.5);w.enemies=[far];w.weapons.crowbar.step(p,.5);aim(p,far);w.weapons.crowbar.attack(w);assert.equal(far.hp,60);
});
test('pistol consumes rounds, reloads conservatively, and cancels reload on switch',()=>{
  const w=world(),p=w.player;p.pistol=p.crowbar=true;w.equip('pistol');w.enemies=[new H.Zombie(7,6.5)];aim(p,w.enemies[0]);
  const gun=w.weapons.pistol;gun.attack(w);assert.equal(p.ammo,16);assert.equal(w.enemies[0].hp,46);
  gun.reload(w);assert.equal(gun.attack(w),false);gun.step(p,1.4);assert.equal(p.ammo,17);assert.equal(p.reserve,67);
  p.ammo=0;p.reserve=3;gun.reload(w);gun.step(p,2);assert.equal(p.ammo,3);assert.equal(p.reserve,0);
  p.ammo=0;p.reserve=10;gun.reload(w);w.equip('crowbar');gun.step(p,2);assert.equal(p.ammo,0);assert.equal(p.reserve,10);
});
test('nearest target is hit and corpses no longer shield living enemies',()=>{
  const w=world();const first=new H.Zombie(6,6.5),second=new H.Zombie(8,6.5);w.enemies=[second,first];aim(w.player,first);
  assert.equal(w.trace(20,true),first);first.takeDamage(60);assert.equal(w.trace(20,true),second);
});
test('breakables drop loot once; healing is bounded and station has finite charge',()=>{
  const w=world(),crate=new H.Breakable('crate',5,6,'ammo');w.breakables=[crate];const n=w.items.length;crate.takeDamage(40);crate.step(w);crate.step(w);assert.equal(w.items.length,n+1);assert.equal(crate.solid,false);
  const station=new H.HealthStation(4,6);w.player.hp=50;station.interact(w,10);assert.equal(w.player.hp,100);assert.equal(station.charge,50);
  w.player.hp=10;station.interact(w,10);assert.equal(w.player.hp,60);assert.equal(station.charge,0);
});
test('each room, weapon and exit is reachable through the intended doors',()=>{
  for(const level of[0,1]){const w=world(level);w.player.crouch=true;w.doors.filter(d=>d.type!=='locked').forEach(d=>d.interact(w));
    if(level===0){const boards=w.breakables.find(b=>b.type==='boards');w.player.crowbar=true;w.equip('crowbar');w.player.x=boards.x+1.2;w.player.z=boards.z;aim(w.player,boards,1.2);w.weapons.crowbar.attack(w);w.weapons.crowbar.step(w.player,.5);w.weapons.crowbar.attack(w);boards.step(w);assert.equal(boards.solid,false);w.player.x=4;w.player.z=6.5;}
    for(const r of w.rooms)assert.ok(w.navigate(w.player,r).length>0,`${level}: ${r.name}`);
    for(const item of w.items.filter(i=>i instanceof H.Pickup||i.type==='exit'))assert.ok(w.navigate(w.player,item).length>0,`${level}: ${item.type}`);
  }
});
test('navigation routes around obstacles and enemies stay out of walls',()=>{
  const w=world();w.doors.filter(d=>d.type!=='locked').forEach(d=>d.interact(w));const e=new H.Zombie(10.5,7);w.enemies=[e];w.player.x=4;w.player.z=4;e.lastSeen={x:4,z:4};
  const start=H.distance(e,w.player);advance(w,6);assert.ok(H.distance(e,w.player)<start);assert.equal(w.blocked(e.x,e.z,.29),false);
});
test('vortigaunt telegraphs before damage and cover interrupts its beam',()=>{
  const w=world();w.player.x=9;w.player.z=6.5;const e=new H.Vortigaunt(15,6.5);w.enemies=[e];w.doors[0].interact(w);
  e.step(w,.01);assert.equal(e.state,'charge');e.step(w,.5);assert.equal(w.player.hp,100);
  w.doors[0].open=false;w.doors[0].solid=true;e.step(w,.5);assert.equal(w.player.hp,100);
  w.doors[0].interact(w);e.cooldown=0;e.step(w,.01);e.step(w,1);assert.equal(w.player.hp,80);
});
test('headcrab jump damages once and recovers; zombie melee has a cooldown',()=>{
  const w=world(),e=new H.Headcrab(6,6.5);w.enemies=[e];advance(w,.6);assert.equal(w.player.hp,92);assert.equal(e.state,'recover');advance(w,.5);assert.equal(w.player.hp,92);
  const z=new H.Zombie(w.player.x+1,w.player.z);w.enemies=[z];z.step(w,.01);assert.equal(w.player.hp,77);z.step(w,.1);assert.equal(w.player.hp,77);
});
test('locked and automatic doors have distinct behavior; triggers fire once',()=>{
  const w=world();const locked=w.doors.find(d=>d.type==='locked');locked.interact(w);assert.equal(locked.solid,true);
  const d=w.doors[0];w.player.x=d.x-2;w.player.z=d.z;d.step(w,.1);assert.equal(d.solid,false);
  const trigger=new H.TriggerVolume(w.player.x,w.player.z,1,[{type:'SpawnEnemy',enemy:'headcrab',room:0}]);const n=w.enemies.length;trigger.step(w);trigger.step(w);assert.equal(w.enemies.length,n+1);
});
test('autosave validates data, survives unavailable storage and preserves inventory',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)},save=new H.SaveManager(storage);
  const p=new H.Player({hp:47,crowbar:true,pistol:true,weapon:'pistol',ammo:6,reserve:29});assert.equal(save.write(1,p),true);
  const s=save.read(),w=new H.World(s.level,s.player);for(const key of['hp','crowbar','pistol','weapon','ammo','reserve'])assert.equal(w.player[key],p[key]);assert.equal(w.player.x,4);
  storage.setItem(save.key,'{"version":1,"level":7}');assert.equal(save.read(),null);storage.setItem(save.key,'broken');assert.equal(save.read(),null);
  assert.equal(new H.SaveManager(null).read(),null);assert.equal(new H.SaveManager(null).write(0,p),false);
});
test('final arena locks, spawns exactly two waves, then unlocks and completes',()=>{
  let ended=0;const w=new H.World(1,{crowbar:true,pistol:true,weapon:'pistol'},{transition:()=>ended++});w.enemies.forEach(e=>e.takeDamage(999));
  Object.assign(w.player,{x:w.rooms[7].x,z:w.rooms[7].z});w.step({},1/120);assert.equal(w.wave,1);assert.equal(w.enemies.filter(e=>e.hp).length,3);assert.equal(w.doors[6].arenaLock,true);
  w.enemies.forEach(e=>e.takeDamage(999));w.step({},1/120);assert.equal(w.wave,2);assert.equal(w.enemies.filter(e=>e.hp).length,2);assert.ok(w.enemies.filter(e=>e.hp).every(e=>e.type==='vortigaunt'));
  w.enemies.forEach(e=>e.takeDamage(999));w.step({},1/120);assert.equal(w.wave,3);assert.equal(w.doors[6].solid,false);w.items.find(i=>i.type==='exit').interact(w);assert.equal(ended,1);assert.equal(w.complete,true);
});
test('laboratory exit requires acquired weapons and cleared threats',()=>{
  let ended=0;const w=new H.World(0,{}, {transition:()=>ended++}),exit=w.items.find(i=>i.type==='exit');exit.interact(w);assert.equal(ended,0);
  w.player.crowbar=w.player.pistol=true;exit.interact(w);assert.equal(ended,0);w.enemies.forEach(e=>e.takeDamage(999));exit.interact(w);assert.equal(ended,1);
});
test('dead player cannot advance simulation',()=>{const w=world();w.player.takeDamage(100);const x=w.player.x;w.step({KeyW:true},1);assert.equal(w.player.x,x);assert.equal(w.time,0);});
test('ventilation enforces crouching and prevents standing inside the ceiling',()=>{
  const w=world(1),vent=w.props.find(p=>p.type==='vent');w.player.x=vent.x-1.5;w.player.z=vent.z;w.player.yaw=0;
  w.player.step(w,{KeyW:true},.2);assert.ok(w.player.x<vent.x-1.3);
  for(let i=0;i<60;i++)w.player.step(w,{KeyW:true,ControlLeft:true},1/120);assert.ok(w.player.x>vent.x-1.3);
  w.player.step(w,{},1/120);assert.equal(w.player.crouch,true);assert.ok(w.player.y+.85<w.ceilingAt(w.player.x,w.player.z));
});
console.log(`Half-Life 98: ${count} gameplay checks passed.`);



