(function(N){
class TrackManager {
 constructor(id='dockside'){this.id=id;this.closed=id!=='express';this.halfWidth=9;this.count=128;this.points=Array.from({length:this.count+(this.closed?0:1)},(_,i)=>this.sample(i/this.count));}
 sample(t){const a=t*Math.PI*2;
 if(this.id==='express'){return{x:48*Math.sin(t*Math.PI*3),z:850*t,yaw:Math.atan2(144*Math.PI*Math.cos(t*Math.PI*3),850)};}
 if(this.id==='neon'){return{x:125*Math.sin(a)+24*Math.sin(2*a),z:120*(1-Math.cos(a)),yaw:Math.atan2(125*Math.cos(a)+48*Math.cos(2*a),120*Math.sin(a))};}return{x:110*Math.sin(a),z:155*(1-Math.cos(a)),yaw:Math.atan2(110*Math.cos(a),155*Math.sin(a))};}
 nearest(x,z){let best={distance:Infinity};for(let i=0;i<this.count;i++){
  const a=this.points[i],b=this.points[(i+1)%this.points.length],dx=b.x-a.x,dz=b.z-a.z;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));
  const px=a.x+t*dx,pz=a.z+t*dz,d=Math.hypot(x-px,z-pz);
  if(d<best.distance)best={x:px,z:pz,distance:d,progress:(i+t)/this.count};
 }return best;}
 build(g){
  g.box(0,-.45,this.closed?150:425,700,.5,this.closed?750:1100,[.016,.022,.04]);
  for(let i=0;i<this.count;i++){
   const a=this.points[i],b=this.points[(i+1)%this.points.length],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),x=(a.x+b.x)/2,z=(a.z+b.z)/2;
   g.box(x,-.12,z,18,.2,len+.3,[.10,.13,.17],yaw,1);
   if(i%2===0)g.box(x,.015,z,.16,.02,len*.5,[.48,.54,.51],yaw);
   for(const s of [-1,1]){
    const nx=Math.cos(yaw)*s,nz=-Math.sin(yaw)*s;
    g.box(x+nx*9.7,.5,z+nz*9.7,.5,1,len+.4,i%4<2?[.30,.36,.40]:[.12,.15,.20],yaw);
    if(i%4===0){
     const hue=this.id==='neon'?[.55,.1,.8]:this.id==='express'?[.8,.4,.08]:i%8===0?[.02,.8,.78]:[.7,.04,.32];
     g.box(x+nx*10,3,z+nz*10,.16,6,.16,[.2,.26,.3]);
     g.box(x+nx*9.8,5.8,z+nz*9.8,.5,.35,2,hue,yaw);
     g.box(x+nx*6,.022,z+nz*6,3,.01,8,hue.map(v=>v*.14),yaw,1);
     const h=12+(i*17%37);g.box(x+nx*22,h/2,z+nz*22,13,h,14,[.20,.24,.32],yaw,2);
     g.box(x+nx*14.9,5,z+nz*14.9,.2,1.3,6,hue,yaw);
    }
   }
  }
  for(const t of (this.closed?[0]:[0,.99])){const p=this.sample(t),r=Math.cos(p.yaw),s=-Math.sin(p.yaw);
 for(let i=0;i<12;i++){const offset=-8.25+i*1.5;g.box(p.x+r*offset,.035,p.z+s*offset,1.5,.03,2,i%2?[.8,.85,.8]:[.04,.05,.08],p.yaw);}
 if(t>0){g.box(p.x,7,p.z,20,.7,.7,[.75,.5,.1],p.yaw);for(const side of [-1,1])g.box(p.x+r*10*side,3.5,p.z+s*10*side,.5,7,.5,[.7,.4,.08]);}
}
 }
}
N.TrackManager=TrackManager;
})(globalThis.NeonRacer=globalThis.NeonRacer||{});

