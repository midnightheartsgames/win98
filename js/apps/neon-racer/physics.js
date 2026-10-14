/* Pure planar arcade simulation; units are metres, seconds, radians. */
(function(N){
class Physics {
 constructor(track,car=N.Cars[0]){this.track=track;this.car=car;this.reset();}
 reset(){
  const p=this.track.sample(0);
  Object.assign(this,{
   x:p.x,z:p.z,yaw:p.yaw,vx:0,vz:0,speed:0,vForward:0,vLateral:0,
   nitro:1,boost:false,slip:0,score:0,
   currentSteer:0,yawRate:0,brakingToStop:false,
   wallContact:false,lastWallImpact:0,lastImpact:0,
   wheelSpin:0,pitch:0,roll:0,steerVisual:0
  });
 }
 step(input,dt){
  const car=this.car;
  let fx=Math.sin(this.yaw),fz=Math.cos(this.yaw);
  let rx=fz,rz=-fx;
  let forward=this.vx*fx+this.vz*fz;
  let lateral=this.vx*rx+this.vz*rz;

  this.boost=Boolean(input.nitro&&input.throttle>0&&this.nitro>0);
  this.nitro=Math.max(0,Math.min(1,this.nitro+(this.boost?-.23:.055)*dt));

  const targetSteer=input.steer||0;
  const steerResponse=car.steerResponse||15;
  this.currentSteer+=(targetSteer-this.currentSteer)*(1-Math.exp(-steerResponse*dt));

  const speed01=Math.min(1,Math.abs(this.speed)/(car.maxSpeed||52));
  const highMult=car.highSpeedSteerMultiplier||.50;
  const steerMult=1.0-(1.0-highMult)*speed01;

  const speedFactor=Math.min(1,Math.abs(forward)/2.8);
  const dir=forward>=-.2?1:-1;
  let targetYawRate=this.currentSteer*(car.steering||1.9)*steerMult*speedFactor*dir;
  if(input.drift)targetYawRate*=1.35;

  const yawResponse=car.yawResponse||12;
  this.yawRate+=(targetYawRate-this.yawRate)*(1-Math.exp(-yawResponse*dt));
  this.yaw+=this.yawRate*dt;

  const brakeDecel=car.brakeDecel||16;
  const reverseAccel=car.reverseAccel||8.5;
  const reverseSpeed=car.reverseSpeed||11;
  const accel=car.acceleration+(this.boost?10:0);

  if(!input.brake)this.brakingToStop=false;
  if(forward>0.2&&input.brake>0)this.brakingToStop=true;

  if(forward>0){
   if(input.throttle>0){
    forward+=input.throttle*accel*dt;
    this.brakingToStop=false;
   }
   if(input.brake>0){
    forward-=input.brake*brakeDecel*dt;
    if(forward<=0&&this.brakingToStop)forward=0;
   }
  }else if(forward<0){
   if(input.brake>0){
    forward-=input.brake*reverseAccel*dt;
    if(forward<-reverseSpeed)forward=-reverseSpeed;
   }
   if(input.throttle>0){
    forward+=input.throttle*brakeDecel*dt;
    if(forward>=0)forward=0;
   }
  }else{
   if(input.throttle>0){
    forward+=input.throttle*accel*dt;
    this.brakingToStop=false;
   }else if(input.brake>0&&!this.brakingToStop){
    forward-=input.brake*reverseAccel*dt;
   }
  }

  const rolling=(car.rollingResistance||.12)*9.81;
  if(Math.abs(forward)>0.01){
   forward-=Math.sign(forward)*Math.min(Math.abs(forward),rolling*dt);
  }
  forward-=forward*Math.abs(forward)*(car.drag||.004)*dt;

  fx=Math.sin(this.yaw);fz=Math.cos(this.yaw);
  rx=fz;rz=-fx;
  lateral=this.vx*rx+this.vz*rz;

  const slipAngle=Math.abs(Math.atan2(lateral,Math.max(1,Math.abs(forward))));
  this.slip=slipAngle;

  const baseGrip=car.lateralGrip||8.8;
  const driftGrip=car.driftGrip||3.5;
  let effectiveGrip=baseGrip;

  if(input.drift){
   effectiveGrip=driftGrip;
  }else{
   const demand=speed01*Math.abs(this.currentSteer);
   let slipRatio=0;
   if(demand>0.5)slipRatio=Math.max(slipRatio,Math.min(1,(demand-0.5)/0.4));
   if(slipAngle>0.08)slipRatio=Math.max(slipRatio,Math.min(1,(slipAngle-0.08)/0.18));
   effectiveGrip=baseGrip*(1-slipRatio*0.6)+driftGrip*(slipRatio*0.6);
  }

  if(slipAngle>0.31){
   forward-=Math.sign(forward)*Math.abs(lateral)*(car.driftDrag||.12)*dt*2.5;
  }

  lateral*=Math.exp(-effectiveGrip*dt);

  this.vx=fx*forward+rx*lateral;
  this.vz=fz*forward+rz*lateral;
  this.speed=Math.hypot(this.vx,this.vz);
  this.vForward=forward;
  this.vLateral=lateral;

  this.x+=this.vx*dt;
  this.z+=this.vz*dt;

  const hit=this.track.nearest(this.x,this.z),limit=this.track.halfWidth-1;
  if(hit.distance>limit){
   const nx=(this.x-hit.x)/hit.distance,nz=(this.z-hit.z)/hit.distance;
   this.x=hit.x+nx*limit;this.z=hit.z+nz*limit;
   const vn=this.vx*nx+this.vz*nz;

   if(!this.wallContact){
    this.wallContact=true;
    if(vn>0.2){
     this.vx-=nx*vn*1.15;
     this.vz-=nz*vn*1.15;
     const speedLoss=Math.max(0.55,1.0-(vn/(car.maxSpeed||52))*.75);
     this.vx*=speedLoss;
     this.vz*=speedLoss;

     const tx=-nz,tz=nx;
     const forwardDotT=this.vx*tx+this.vz*tz;
     const wallDir=forwardDotT>=0?1:-1;
     const targetYaw=Math.atan2(tx*wallDir,tz*wallDir);
     const diff=Math.atan2(Math.sin(targetYaw-this.yaw),Math.cos(targetYaw-this.yaw));
     this.yawRate+=diff*Math.min(1.5,vn*0.1);

     this.lastWallImpact=vn;
    }
   }else{
    if(vn>0){
     this.vx-=nx*vn;
     this.vz-=nz*vn;
    }
    const scrape=Math.exp(-dt*2.5);
    this.vx*=scrape;
    this.vz*=scrape;
   }
   this.speed=Math.hypot(this.vx,this.vz);
  }else{
   this.wallContact=false;
  }

  if(this.slip>.12&&this.speed>9)this.score+=this.slip*this.speed*dt*25;

  // Visual body feedback and wheel animation (purely visual, zero physics impact)
  this.wheelSpin=(this.wheelSpin+(this.vForward/.36)*dt)%(Math.PI*2);
  this.steerVisual=this.currentSteer*.48;
  const lateralG=(this.vForward*this.yawRate)/9.81;
  const targetRoll=-Math.max(-.06,Math.min(.06,lateralG*.04));
  this.roll+=(targetRoll-this.roll)*(1-Math.exp(-10*dt));

  const accelG=(input.throttle*car.acceleration-input.brake*(car.brakeDecel||16))/9.81;
  const targetPitch=Math.max(-.045,Math.min(.045,-accelG*.025));
  this.pitch+=(targetPitch-this.pitch)*(1-Math.exp(-12*dt));
 }
}
function resolveVehicleCollision(a,b,contacts,activeContacts,dt=1/120,track=null){
 const radiusA=a.body.car?.collisionRadius||a.body.collisionRadius||2.2;
 const radiusB=b.body.car?.collisionRadius||b.body.collisionRadius||2.2;
 const radius=(radiusA+radiusB)*.5;
 const dx=b.body.x-a.body.x,dz=b.body.z-a.body.z,d=Math.hypot(dx,dz);
 if(d>=radius)return false;

 const pairKey=(a.name||'A')+':'+(b.name||'B');
 if(activeContacts)activeContacts.add(pairKey);
 const wasContacting=contacts?contacts.has(pairKey):false;

 const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0;
 const mA=a.body.car?.mass||1250,mB=b.body.car?.mass||1250;
 const totalM=mA+mB;
 const wA=Math.max(.35,Math.min(.65,mB/totalM)),wB=1.0-wA;
 const overlap=radius-d;
 a.body.x-=nx*overlap*wA;a.body.z-=nz*overlap*wA;
 b.body.x+=nx*overlap*wB;b.body.z+=nz*overlap*wB;

 const rvx=b.body.vx-a.body.vx,rvz=b.body.vz-a.body.vz;
 const vn=rvx*nx+rvz*nz;

 if(!wasContacting){
  if(vn<-0.2){
   const impactSpeed=-vn;
   const colStrength=((a.body.car?.collisionStrength||.65)+(b.body.car?.collisionStrength||.65))*.5;
   let baseImpulse=0,speedLoss=.96;
   if(impactSpeed<2.5){
    baseImpulse=impactSpeed*colStrength*.45;
    speedLoss=.98;
   }else if(impactSpeed<8.0){
    baseImpulse=impactSpeed*colStrength*.70;
    speedLoss=.92;
   }else{
    baseImpulse=impactSpeed*colStrength*.85;
    speedLoss=Math.max(.72,.90-(impactSpeed-8.0)*.015);
   }

   const massRatioA=Math.max(.40,Math.min(1.80,mB/mA));
   const massRatioB=Math.max(.40,Math.min(1.80,mA/mB));
   const impulseA=baseImpulse*massRatioA;
   const impulseB=baseImpulse*massRatioB;

   a.body.vx-=nx*impulseA;a.body.vz-=nz*impulseA;
   b.body.vx+=nx*impulseB;b.body.vz+=nz*impulseB;
   a.body.vx*=speedLoss;a.body.vz*=speedLoss;
   b.body.vx*=speedLoss;b.body.vz*=speedLoss;

   for(const [entity,other,sign,imp] of [[a,b,-1,impulseA],[b,a,1,impulseB]]){
    const body=entity.body,car=body.car;
    const fx=Math.sin(body.yaw),fz=Math.cos(body.yaw),rx=fz,rz=-fx;
    const relX=other.body.x-body.x,relZ=other.body.z-body.z;
    const longOffset=relX*fx+relZ*fz;
    const normOffset=Math.max(-1,Math.min(1,longOffset/Math.max(1,(car?.length||4.0)*.5)));
    const latNormal=(nx*sign)*rx+(nz*sign)*rz;
    const spinFactor=car?.spinFactor||.18;
    const yawImpulse=normOffset*latNormal*imp*spinFactor;
    body.yawRate+=Math.max(-2.5,Math.min(2.5,yawImpulse*1.8));
   }

   a.body.lastImpact=impactSpeed;
   b.body.lastImpact=impactSpeed;
  }
 }else{
  if(vn<0){
   const softImpulse=-vn*.25;
   a.body.vx-=nx*softImpulse;a.body.vz-=nz*softImpulse;
   b.body.vx+=nx*softImpulse;b.body.vz+=nz*softImpulse;
  }
  const scrapeFriction=Math.exp(-dt*1.5);
  a.body.vx*=scrapeFriction;a.body.vz*=scrapeFriction;
  b.body.vx*=scrapeFriction;b.body.vz*=scrapeFriction;
 }

 if(track){
  for(const e of [a,b]){
   const body=e.body,p=track.nearest(body.x,body.z),limit=track.halfWidth-1;
   if(p.distance>limit){
    body.x=p.x+(body.x-p.x)/p.distance*limit;
    body.z=p.z+(body.z-p.z)/p.distance*limit;
   }
   body.speed=Math.hypot(body.vx,body.vz);
  }
 }else{
  a.body.speed=Math.hypot(a.body.vx,a.body.vz);
  b.body.speed=Math.hypot(b.body.vx,b.body.vz);
 }
 return true;
}
N.resolveVehicleCollision=resolveVehicleCollision;
N.Physics=Physics;
})(globalThis.NeonRacer=globalThis.NeonRacer||{});

