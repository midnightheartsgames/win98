/* City traffic simulation for Midnight Glide: independent vehicles, lane following, and collisions. */
(function(N){
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));

let trafficIdCounter=1;

class TrafficVehicle {
 constructor(track,config={}){
  this.track=track;
  this.type=config.type||'van';
  const spec=(N.TrafficTypes&&N.TrafficTypes[this.type])||{
   mass:2200,width:2.3,length:5.2,height:1.9,
   collisionRadius:2.5,collisionStrength:.65,spinFactor:.15,
   impactSpeedLoss:.92,baseCruiseSpeed:15.5,speedVariation:.10,
   accel:5.5,brakeDecel:14
  };

  this.id=config.id||('traffic_van_'+(trafficIdCounter++));
  this.name=config.name||('VAN_'+(trafficIdCounter));
  this.mass=spec.mass;
  this.width=spec.width;
  this.length=spec.length;
  this.collisionRadius=spec.collisionRadius||2.5;

  this.car={
   id:this.type,
   mass:this.mass,
   length:this.length,
   width:this.width,
   collisionStrength:spec.collisionStrength||.65,
   spinFactor:spec.spinFactor||.15,
   impactSpeedLoss:spec.impactSpeedLoss||.92,
   collisionRadius:this.collisionRadius
  };

  this.progress=config.progress||0;
  this.laneOffset=config.laneOffset!==undefined?config.laneOffset:3.6;
  this.targetLaneOffset=this.laneOffset;

  const variation=1.0+(config.speedVariation!==undefined?config.speedVariation:(Math.random()*2-1)*(spec.speedVariation||.10));
  this.targetSpeed=(spec.baseCruiseSpeed||15.5)*variation;
  this.speed=config.speed!==undefined?config.speed:this.targetSpeed;
  this.accel=spec.accel||5.5;
  this.brakeDecel=spec.brakeDecel||14.0;

  const p=this.track.sample(this.progress);
  this.yaw=p.yaw;
  this.yawRate=0;
  const nx=Math.cos(p.yaw),nz=-Math.sin(p.yaw);
  this.x=config.x!==undefined?config.x:p.x+nx*this.laneOffset;
  this.z=config.z!==undefined?config.z:p.z+nz*this.laneOffset;
  this.vx=Math.sin(this.yaw)*this.speed;
  this.vz=Math.cos(this.yaw)*this.speed;
  this.vForward=this.speed;

  this.wheelSpin=0;
  this.steerVisual=0;
  this.pitch=0;
  this.roll=0;
  this.lastImpact=0;

  this.disturbedTimer=0;
 }

 step(dt,trafficAhead=null){
  let desiredSpeed=this.targetSpeed;
  if(trafficAhead){
   const dx=trafficAhead.x-this.x,dz=trafficAhead.z-this.z;
   const fwd=dx*Math.sin(this.yaw)+dz*Math.cos(this.yaw);
   const side=dx*Math.cos(this.yaw)-dz*Math.sin(this.yaw);
   if(fwd>0&&fwd<45&&Math.abs(side)<2.6){
    if(fwd>30){
     desiredSpeed=Math.min(this.targetSpeed,trafficAhead.speed*1.02);
    }else if(fwd>18){
     desiredSpeed=Math.min(this.targetSpeed*.82,trafficAhead.speed*.95);
    }else if(fwd>9){
     desiredSpeed=Math.min(this.targetSpeed*.55,trafficAhead.speed*.8);
    }else{
     desiredSpeed=Math.max(0,trafficAhead.speed-3.5);
    }
   }
  }

  if(this.lastImpact>2.0){
   this.disturbedTimer=Math.min(3.0,this.disturbedTimer+1.2);
   this.lastImpact=0;
  }
  if(this.disturbedTimer>0){
   this.disturbedTimer=Math.max(0,this.disturbedTimer-dt);
  }

  if(this.speed<desiredSpeed){
   this.speed=Math.min(desiredSpeed,this.speed+this.accel*dt);
  }else if(this.speed>desiredSpeed){
   this.speed=Math.max(desiredSpeed,this.speed-this.brakeDecel*dt);
  }

  const hit=this.track.nearest(this.x,this.z);
  this.progress=hit.progress;
  const trackP=this.track.sample(this.progress);

  if(this.disturbedTimer<=0){
   const lookAhead=this.track.closed?(this.progress+.015)%1:Math.min(.999,this.progress+.015);
   const aheadP=this.track.sample(lookAhead);
   const rX=Math.cos(aheadP.yaw),rZ=-Math.sin(aheadP.yaw);
   const targetX=aheadP.x+rX*this.targetLaneOffset;
   const targetZ=aheadP.z+rZ*this.targetLaneOffset;

   const targetYaw=Math.atan2(targetX-this.x,targetZ-this.z);
   const yawErr=angle(targetYaw-this.yaw);
   this.yawRate+=(yawErr*4.0-this.yawRate)*(1-Math.exp(-8*dt));
   this.yaw+=this.yawRate*dt;

   this.vForward=this.speed;
   this.vx=Math.sin(this.yaw)*this.vForward;
   this.vz=Math.cos(this.yaw)*this.vForward;
   this.x+=this.vx*dt;
   this.z+=this.vz*dt;
  }else{
   this.x+=this.vx*dt;
   this.z+=this.vz*dt;
   this.yaw+=this.yawRate*dt;

   this.yawRate*=Math.exp(-6*dt);
   const fx=Math.sin(this.yaw),fz=Math.cos(this.yaw);
   const rx=fz,rz=-fx;
   let forward=this.vx*fx+this.vz*fz;
   let lateral=this.vx*rx+this.vz*rz;
   lateral*=Math.exp(-9*dt);

   const headingDiff=angle(trackP.yaw-this.yaw);
   this.yawRate+=headingDiff*2.5*dt;

   forward+=(this.speed-forward)*(1-Math.exp(-3*dt));
   this.vx=fx*forward+rx*lateral;
   this.vz=fz*forward+rz*lateral;
   this.vForward=forward;
   this.speed=Math.hypot(this.vx,this.vz);
  }

  const limit=this.track.halfWidth-1.2;
  if(hit.distance>limit){
   const nx=(this.x-hit.x)/hit.distance,nz=(this.z-hit.z)/hit.distance;
   this.x=hit.x+nx*limit;
   this.z=hit.z+nz*limit;
   const vn=this.vx*nx+this.vz*nz;
   if(vn>0){
    this.vx-=nx*vn;
    this.vz-=nz*vn;
    this.speed=Math.hypot(this.vx,this.vz);
   }
  }

  this.wheelSpin=(this.wheelSpin+(this.vForward/.36)*dt)%(Math.PI*2);
  this.steerVisual=clamp(this.yawRate*.25,-.4,.4);
  this.roll+=(-clamp(this.yawRate*.05,-.04,.04)-this.roll)*(1-Math.exp(-8*dt));
  this.pitch+=(0-this.pitch)*(1-Math.exp(-6*dt));
 }
}

class TrafficManager {
 constructor(track,player=null,raceAI=null,options={}){
  this.track=track;
  this.player=player;
  this.raceAI=raceAI;
  this.vehicles=[];
  this.targetTrafficCount=options.targetTrafficCount||5;
  this.contacts=new Map();
  this.spawnCooldown=0;
  this.laneChoices=[-3.6,3.6];

  let totalLen=0;
  const pts=this.track.points;
  for(let i=0;i<pts.length-1;i++){
   totalLen+=Math.hypot(pts[i+1].x-pts[i].x,pts[i+1].z-pts[i].z);
  }
  if(this.track.closed&&pts.length>1){
   totalLen+=Math.hypot(pts[0].x-pts[pts.length-1].x,pts[0].z-pts[pts.length-1].z);
  }
  this.trackLength=Math.max(500,totalLen);

  this.initPreSpawn();
 }

 initPreSpawn(){
  this.vehicles=[];
  this.contacts.clear();
  this.spawnCooldown=0;
  const count=Math.min(4,this.targetTrafficCount);
  const playerProg=this.player?this.track.nearest(this.player.x,this.player.z).progress:0;
  const spacing=Math.min(100,this.trackLength/(count+2));

  for(let i=0;i<count;i++){
   const distAhead=90+i*spacing;
   let prog=playerProg+distAhead/this.trackLength;
   if(this.track.closed){
    prog=(prog%1+1)%1;
   }else if(prog>0.92){
    break;
   }
   const lane=this.laneChoices[i%this.laneChoices.length];
   const p=this.track.sample(prog);
   const nx=Math.cos(p.yaw),nz=-Math.sin(p.yaw);
   const van=new TrafficVehicle(this.track,{
    progress:prog,
    laneOffset:lane,
    x:p.x+nx*lane,
    z:p.z+nz*lane
   });
   this.vehicles.push(van);
  }
 }

 reset(){
  this.initPreSpawn();
 }

 getVehicleAhead(vehicle){
  let closest=null,minDist=Infinity;
  for(const other of this.vehicles){
   if(other===vehicle)continue;
   const dx=other.x-vehicle.x,dz=other.z-vehicle.z;
   const fwd=dx*Math.sin(vehicle.yaw)+dz*Math.cos(vehicle.yaw);
   const side=dx*Math.cos(vehicle.yaw)-dz*Math.sin(vehicle.yaw);
   if(fwd>0&&fwd<50&&Math.abs(side)<2.6){
    if(fwd<minDist){
     minDist=fwd;
     closest=other;
    }
   }
  }
  return closest;
 }

 trySpawn(){
  if(this.vehicles.length>=this.targetTrafficCount)return;
  if(this.spawnCooldown>0)return;

  const playerPos=this.player||{x:0,z:0,speed:0};
  const pProg=this.track.nearest(playerPos.x,playerPos.z).progress;
  const spawnDist=clamp(95+(playerPos.speed||0)*.6,90,135);
  const progDelta=spawnDist/this.trackLength;
  let spawnProg=pProg+progDelta;
  if(this.track.closed){
   spawnProg=(spawnProg%1+1)%1;
  }else if(spawnProg>0.94){
   return;
  }

  const lane=this.laneChoices[Math.floor(Math.random()*this.laneChoices.length)];
  const p=this.track.sample(spawnProg);
  const nx=Math.cos(p.yaw),nz=-Math.sin(p.yaw);
  const candX=p.x+nx*lane;
  const candZ=p.z+nz*lane;

  if(this.player){
   const distToPlayer=Math.hypot(candX-this.player.x,candZ-this.player.z);
   if(distToPlayer<70)return;
  }

  if(this.raceAI?.rivals){
   for(const r of this.raceAI.rivals){
    if(Math.hypot(candX-r.body.x,candZ-r.body.z)<30)return;
   }
  }

  for(const tv of this.vehicles){
   if(Math.hypot(candX-tv.x,candZ-tv.z)<35)return;
  }

  const van=new TrafficVehicle(this.track,{
   progress:spawnProg,
   laneOffset:lane,
   x:candX,
   z:candZ
  });
  this.vehicles.push(van);
  this.spawnCooldown=1.5;
 }

 checkDespawn(){
  const playerPos=this.player||{x:0,z:0};
  const pProg=this.track.nearest(playerPos.x,playerPos.z).progress;
  const rivals=this.raceAI?.rivals||[];

  for(let i=this.vehicles.length-1;i>=0;i--){
   const v=this.vehicles[i];
   const hit=this.track.nearest(v.x,v.z);
   if(hit.distance>this.track.halfWidth+8){
    this.vehicles.splice(i,1);
    continue;
   }

   let distBehind=0;
   if(this.track.closed){
    const deltaT=(pProg-v.progress+1)%1;
    if(deltaT<.5){
     distBehind=deltaT*this.trackLength;
    }else{
     distBehind=-1; // Vehicle is ahead of player
    }
   }else{
    distBehind=(pProg-v.progress)*this.trackLength;
    if(v.progress>=0.98){
     this.vehicles.splice(i,1);
     continue;
    }
   }

   if(distBehind>85){
    let nearRival=false;
    for(const r of rivals){
     if(r.session?.finished)continue;
     if(Math.hypot(r.body.x-v.x,r.body.z-v.z)<28){
      nearRival=true;
      break;
     }
    }
    if(!nearRival){
     this.vehicles.splice(i,1);
    }
   }
  }
 }

 collide(dt=1/120){
  const activeContacts=new Set();
  const racers=[];
  if(this.player)racers.push({body:this.player,name:'YOU'});
  if(this.raceAI?.rivals){
   for(const r of this.raceAI.rivals){
    if(!r.session?.finished)racers.push({body:r.body,name:r.name});
   }
  }

  for(const racer of racers){
   for(const van of this.vehicles){
    N.resolveVehicleCollision(racer,{body:van,name:van.id},this.contacts,activeContacts,dt,this.track);
   }
  }

  for(let i=0;i<this.vehicles.length;i++){
   for(let j=i+1;j<this.vehicles.length;j++){
    N.resolveVehicleCollision(
     {body:this.vehicles[i],name:this.vehicles[i].id},
     {body:this.vehicles[j],name:this.vehicles[j].id},
     this.contacts,activeContacts,dt,this.track
    );
   }
  }

  for(const key of this.contacts.keys())if(!activeContacts.has(key))this.contacts.delete(key);
  for(const key of activeContacts)this.contacts.set(key,true);
 }

 step(dt=1/120){
  if(this.spawnCooldown>0)this.spawnCooldown-=dt;
  this.checkDespawn();
  this.trySpawn();

  for(const v of this.vehicles){
   const ahead=this.getVehicleAhead(v);
   v.step(dt,ahead);
  }

  this.collide(dt);
 }
}

N.TrafficVehicle=TrafficVehicle;
N.TrafficManager=TrafficManager;
})(globalThis.NeonRacer=globalThis.NeonRacer||{});
