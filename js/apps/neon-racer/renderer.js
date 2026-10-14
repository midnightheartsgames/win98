(function(N){
class Geometry {
 constructor(){this.data=[];}
 triangle(a,b,c,color,type=0){for(const [i,p] of [a,b,c].entries())this.data.push(...p,...color,i===1?1:0,i===2?1:0,type);}
 box(x,y,z,w,h,d,c,yaw=0,type=0){const sn=Math.sin(yaw),cs=Math.cos(yaw);const v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(p=>[x+p[0]*w/2*cs+p[2]*d/2*sn,y+p[1]*h/2,z-p[0]*w/2*sn+p[2]*d/2*cs]);
  [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]].forEach((f,i)=>{const col=c.map(n=>n*[.7,.8,.65,.85,1,.45][i]);this.triangle(v[f[0]],v[f[1]],v[f[2]],col,type);this.triangle(v[f[0]],v[f[2]],v[f[3]],col,type);});
 }
}
function mat3Yaw(yaw){const c=Math.cos(yaw),s=Math.sin(yaw);return[c,0,-s,0,1,0,s,0,c];}
function mat3Pitch(p){const c=Math.cos(p),s=Math.sin(p);return[1,0,0,0,c,s,0,-s,c];}
function mat3Roll(r){const c=Math.cos(r),s=Math.sin(r);return[c,-s,0,s,c,0,0,0,1];}
function mat3Multiply(a,b){
 const out=new Float32Array(9);
 for(let c=0;c<3;c++)for(let r=0;r<3;r++)out[c*3+r]=a[r]*b[c*3]+a[r+3]*b[c*3+1]+a[r+6]*b[c*3+2];
 return out;
}
const vertex=`attribute vec3 position;attribute vec3 color;attribute vec3 tex;uniform vec3 eye;uniform vec3 target;uniform vec3 origin;uniform mat3 rot;uniform float jitter;uniform vec2 fovScale;varying vec3 tint;varying vec3 world;varying float kind;varying float depth;
void main(){vec3 p=(rot*position)+origin;world=p;tint=color;kind=tex.z;
vec3 f=normalize(target-eye),r=normalize(cross(f,vec3(0.,1.,0.))),u=cross(r,f),q=p-eye;float z=dot(q,f);depth=z;
gl_PointSize=clamp(260./max(z,1.),2.,24.);gl_Position=vec4(dot(q,r)*fovScale.x,dot(q,u)*fovScale.y,z*1.000476-.200048,z);
if(jitter>0.&&z>0.)gl_Position.xy=floor(gl_Position.xy/gl_Position.w*vec2(160.,120.))*gl_Position.w/vec2(160.,120.);
}`;
const fragment=`precision mediump float;varying vec3 tint;varying vec3 world;varying float kind;varying float depth;uniform sampler2D atlas;
void main(){if(kind>2.5){float a=pow(max(0.,1.-length(gl_PointCoord-.5)*2.),2.);gl_FragColor=vec4(tint*a,a);return;}vec3 col=tint;if(kind>.5&&kind<1.5)col*=.65+texture2D(atlas,world.xz/16.).r*.6;if(kind>1.5){vec2 uv=vec2(world.x+world.z,world.y)/16.;col*=.25+texture2D(atlas,uv).g*2.8;}float fog=clamp((depth-30.)/240.,0.,1.);gl_FragColor=vec4(mix(col,vec3(.018,.025,.065),fog),1.);}`;
const postV=`attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const postF=`precision mediump float;varying vec2 uv;uniform sampler2D frame;uniform float boost;uniform float dither;
void main(){vec2 d=(uv-.5)*boost*.04;vec3 c=texture2D(frame,uv).rgb*.55+texture2D(frame,uv-d).rgb*.3+texture2D(frame,uv-d*2.).rgb*.15;
vec2 p=mod(floor(gl_FragCoord.xy),2.);float b=p.x==0.?(p.y==0.?0.:3.):(p.y==0.?2.:1.);c=floor(clamp(c+(b/4.-.375)/31.*dither,0.,1.)*31.+.5)/31.;gl_FragColor=vec4(c,1.);}`;
class Camera {
 constructor(){
  this.modes=['chase','hood','bumper'];
  this.mode=this.loadMode();
  this.eye=[0,3.8,-7];
  this.target=[0,.8,12];
  this.fov=65;
  this.targetFov=65;
  this.trauma=0;
  this.initialized=false;
 }
 loadMode(){
  try{
   const val=globalThis.localStorage?.getItem('midnight-camera');
   if(val==='hood'||val==='1')return 1;
   if(val==='bumper'||val==='2')return 2;
   return 0;
  }catch(e){return 0;}
 }
 saveMode(){
  try{
   globalThis.localStorage?.setItem('midnight-camera',this.modes[this.mode]||'chase');
  }catch(e){}
 }
 setMode(m){
  this.mode=((m%3)+3)%3;
  this.saveMode();
  this.initialized=false;
 }
 cycle(){
  this.setMode(this.mode+1);
  return this.modes[this.mode];
 }
 reset(){
  this.initialized=false;
  this.trauma=0;
 }
 triggerImpact(speed){
  if(speed<6)return;
  const t=Math.max(0,Math.min(1,(speed-6)/18));
  this.trauma=Math.max(this.trauma,Math.min(1,this.trauma+t));
 }
 update(car,dt=1/60,time=0){
  const fx=Math.sin(car.yaw),fz=Math.cos(car.yaw);
  const speed01=Math.max(0,Math.min(1,(car.speed||0)/(car.car?.maxSpeed||52)));

  const impact=Math.max(car.lastImpact||0,car.lastWallImpact||0);
  if(impact>=6){
   this.triggerImpact(impact);
   car.lastImpact=0;
   car.lastWallImpact=0;
  }
  if(this.trauma>0){
   this.trauma=Math.max(0,this.trauma-dt*2.8);
  }

  let idealEye=[0,0,0],idealTarget=[0,0,0],baseFov=65;
  const carLen=car.car?.length||4.0;

  if(this.mode===0){
   const dist=7.0+speed01*.9;
   idealEye=[car.x-fx*dist,3.8,car.z-fz*dist];
   idealTarget=[car.x+fx*12,.8,car.z+fz*12];
   baseFov=65+speed01*speed01*9+(car.boost?2:0);
  }else if(this.mode===1){
   const fwdOffset=carLen*.18;
   const pitchOffset=(car.pitch||0)*.15;
   idealEye=[car.x+fx*fwdOffset,1.10+pitchOffset,car.z+fz*fwdOffset];
   idealTarget=[car.x+fx*20,1.05+pitchOffset*2,car.z+fz*20];
   baseFov=67+speed01*7+(car.boost?1.5:0);
  }else{
   const fwdOffset=carLen*.5+.15;
   idealEye=[car.x+fx*fwdOffset,.42,car.z+fz*fwdOffset];
   idealTarget=[car.x+fx*22,.38,car.z+fz*22];
   baseFov=68+speed01*7+(car.boost?1.5:0);
  }

  this.targetFov=baseFov;

  if(!this.initialized||dt>0.2){
   this.eye=[...idealEye];
   this.target=[...idealTarget];
   this.fov=this.targetFov;
   this.initialized=true;
  }else{
   const posResponse=this.mode===0?8.5:22.0;
   const lookResponse=this.mode===0?10.5:24.0;
   const fovResponse=6.0;

   const posFactor=1-Math.exp(-posResponse*dt);
   const lookFactor=1-Math.exp(-lookResponse*dt);
   const fovFactor=1-Math.exp(-fovResponse*dt);

   for(let i=0;i<3;i++){
    this.eye[i]+=(idealEye[i]-this.eye[i])*posFactor;
    this.target[i]+=(idealTarget[i]-this.target[i])*lookFactor;
   }
   this.fov+=(this.targetFov-this.fov)*fovFactor;
  }

  const modeScale=[1.0,.75,.55][this.mode];
  const shakeAmp=this.trauma*this.trauma*modeScale;
  let shakeX=0,shakeY=0,shakeZ=0;
  if(shakeAmp>0.001){
   const st=time*42.0;
   shakeX=Math.sin(st)*.32*shakeAmp;
   shakeY=Math.cos(st*1.3)*.24*shakeAmp;
   shakeZ=Math.sin(st*1.7)*.18*shakeAmp;
  }

  return{
   eye:[this.eye[0]+shakeX,this.eye[1]+shakeY,this.eye[2]+shakeZ],
   target:[this.target[0]+shakeX*.5,this.target[1]+shakeY*.5,this.target[2]+shakeZ*.5],
   fov:this.fov
  };
 }
}
class Renderer {
 constructor(canvas,track,model=N.Cars[0]){this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl',{antialias:false,alpha:false});if(!gl)throw Error('WebGL недоступен. Включите аппаратное ускорение браузера.');this.resources=[];this.width=320;this.height=240;canvas.width=320;canvas.height=240;
 this.camera=new Camera();
 this.program=this.programFrom(vertex,fragment);this.post=this.programFrom(postV,postF);
 const g=new Geometry();track.build(g);this.track=this.buffer(g.data);this.trackCount=g.data.length/9;
 this.wheelLeft=this.buildWheel(-1);
 this.wheelRight=this.buildWheel(1);
 this.models=N.Cars.map(c=>this.buildCar(c));const chosen=this.models[N.Cars.findIndex(c=>c.id===model.id)];this.car=chosen.buffer;this.carCount=chosen.count;
 this.vanMesh=this.buildVan();
 const glow=new Geometry();for(const x of [-.6,.6])glow.triangle([x,.1,1.9],[x-2,.03,12],[x+2,.03,12],[.065,.085,.09]);glow.box(0,.035,0,2.5,.01,4.5,[.015,.09,.1]);this.glow=this.buffer(glow.data);this.glowCount=glow.data.length/9;
 const sprites=[];for(let i=0;i<track.count;i+=4){const a=track.points[i],b=track.points[(i+1)%track.points.length],yaw=Math.atan2(b.x-a.x,b.z-a.z);for(const side of [-1,1])sprites.push((a.x+b.x)/2+Math.cos(yaw)*side*9.8,5.8,(a.z+b.z)/2-Math.sin(yaw)*side*9.8,...(i%8===0?[.02,.8,.78]:[.7,.04,.32]),0,0,3);}this.sprites=this.buffer(sprites);this.spriteCount=sprites.length/9;
 this.quad=this.buffer([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);
 this.atlas=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.atlas);const pixels=new Uint8Array(64*64*4);let seed=1999;for(let y=0;y<64;y++)for(let x=0;x<64;x++){seed=(seed*1664525+1013904223)>>>0;const i=(y*64+x)*4;pixels[i]=80+(seed%110);pixels[i+1]=(x%8<3&&y%8<4&&seed%5!==0)?210:12;pixels[i+2]=128;pixels[i+3]=255;}gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,64,64,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);this.filter(gl.NEAREST);
 this.frame=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.frame);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,320,240,0,gl.RGBA,gl.UNSIGNED_BYTE,null);this.filter(gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 this.fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.frame,0);this.depth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,this.depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,320,240);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.depth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Не удалось создать буфер кадра.');
 }
 buildWheel(side){
  const wheel=new Geometry(),outer=side*.19,inner=-side*.12;
  const ring=(xx,t,r)=>[xx,Math.sin(t)*r,Math.cos(t)*r];
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
   wheel.triangle(ring(outer,a,.36),ring(inner,a,.36),ring(inner,b,.36),[.045,.05,.065]);
   wheel.triangle(ring(outer,a,.36),ring(inner,b,.36),ring(outer,b,.36),[.045,.05,.065]);
   wheel.triangle([outer,0,0],ring(outer,a,.36),ring(outer,b,.36),[.07,.08,.10]);
   wheel.triangle([outer+side*.005,0,0],ring(outer+side*.005,a,.25),ring(outer+side*.005,b,.25),i%2?[.55,.62,.68]:[.14,.18,.22]);
   wheel.triangle([inner,0,0],ring(inner,b,.36),ring(inner,a,.36),[.045,.05,.06]);
  }
  return {buffer:this.buffer(wheel.data),count:wheel.data.length/9};
 }
 buildCar(model){
  const car=new Geometry(),w=model.width,l=model.length;
  car.box(0,.55,0,w,.5,l,model.color);
  car.box(0,.9+model.height/2,-.2,w*.81,model.height,model.cabin,[.055,.14,.21]);
  if(model.spoiler)car.box(0,.92,-l*.42,w+.15,.12,.45,model.color);
  if(model.id==='vandal'){car.box(0,.84,l*.24,.7,.09,l*.28,[.055,.06,.07]);car.box(0,.57,l/2+.02,w*.75,.19,.06,[.3,.3,.32]);}
  if(model.id==='spark')car.box(0,.72,-l/2,w*.9,.15,.15,model.color);
  for(const x of [-w*.32,w*.32]){car.box(x,.63,-l/2-.01,.45,.16,.04,[1,.025,.06]);car.box(x,.65,l/2+.01,.5,.15,.04,[.7,.85,1]);}
  return {buffer:this.buffer(car.data),count:car.data.length/9,width:w,length:l,id:model.id};
 }
 buildVan(){
  const van=new Geometry(),w=2.3,l=5.2;
  const white=[.86,.87,.85],dark=[.06,.10,.14],bumper=[.24,.26,.28];
  van.box(0,1.38,-.85,2.26,1.85,3.5,white);
  van.box(0,1.3,-2.61,1.8,1.5,.04,[.62,.64,.65]);
  for(const x of [-1.02,1.02])van.box(x,.85,-2.61,.2,.5,.04,[.88,.08,.08]);
  van.box(0,.78,1.6,2.05,.65,1.6,white);
  van.box(0,1.48,1.35,1.95,.75,1.1,white);
  van.box(0,1.45,1.91,1.75,.65,.05,dark);
  for(const x of [-.99,.99])van.box(x,1.45,1.35,.04,.55,.8,dark);
  van.box(0,.72,2.15,1.95,.5,.85,white);
  van.box(0,.72,2.58,1.5,.35,.04,[.18,.20,.22]);
  for(const x of [-.82,.82]){
   van.box(x,.74,2.58,.28,.22,.04,[.85,.90,.98]);
   van.box(x>0?x+.12:x-.12,.62,2.58,.12,.12,.04,[.90,.55,.05]);
  }
  van.box(0,.46,2.62,2.15,.28,.22,bumper);
  van.box(0,.40,-2.62,2.26,.22,.25,[.22,.24,.26]);
  for(const x of [-1.08,1.08])van.box(x,1.35,1.7,.18,.22,.1,[.2,.2,.2]);
  return {buffer:this.buffer(van.data),count:van.data.length/9,width:w,length:l,id:'van'};
 }
 filter(f){const gl=this.gl;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,f);}
 programFrom(v,f){const gl=this.gl,p=gl.createProgram();for(const [type,source] of [[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);gl.deleteShader(s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
 buffer(data){const gl=this.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);this.resources.push(b);return b;}
 draw(buffer,count,origin,rot,mode){
  const gl=this.gl,p=this.program;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,offset] of [['position',0],['color',12],['tex',24]]){
   const a=gl.getAttribLocation(p,name);if(a>=0){gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,offset);}
  }
  gl.uniform3fv(gl.getUniformLocation(p,'origin'),origin);
  const loc=gl.getUniformLocation(p,'rot');
  if(typeof rot==='number'){
   gl.uniformMatrix3fv(loc,false,mat3Yaw(rot));
  }else if(rot&&(rot.length===9||rot instanceof Float32Array)){
   gl.uniformMatrix3fv(loc,false,rot);
  }else{
   gl.uniformMatrix3fv(loc,false,[1,0,0, 0,1,0, 0,0,1]);
  }
  gl.drawArrays(mode===undefined?gl.TRIANGLES:mode,0,count);
 }
 drawCar(car,mesh){
  const w=mesh.width,l=mesh.length;
  const Ryaw=mat3Yaw(car.yaw);
  const Rpitch=mat3Pitch(car.pitch||0);
  const Rroll=mat3Roll(car.roll||0);
  const Rchassis=mat3Multiply(Ryaw,mat3Multiply(Rpitch,Rroll));

  this.draw(mesh.buffer,mesh.count,[car.x,0,car.z],Rchassis);

  const spin=car.wheelSpin||0;
  const steer=car.steerVisual||0;
  const Rspin=[1,0,0, 0,Math.cos(spin),Math.sin(spin), 0,-Math.sin(spin),Math.cos(spin)];
  const Rsteer=mat3Yaw(steer);
  const RfrontWorld=mat3Multiply(Ryaw,mat3Multiply(Rsteer,Rspin));
  const RrearWorld=mat3Multiply(Ryaw,Rspin);

  const cosY=Math.cos(car.yaw),sinY=Math.sin(car.yaw);
  const wheels=[
   [-w/2,-l*.30,this.wheelLeft,RrearWorld],
   [ w/2,-l*.30,this.wheelRight,RrearWorld],
   [-w/2, l*.31,this.wheelLeft,RfrontWorld],
   [ w/2, l*.31,this.wheelRight,RfrontWorld]
  ];
  for(const [ox,oz,wheel,rot] of wheels){
   const wx=car.x+(cosY*ox+sinY*oz);
   const wz=car.z+(-sinY*ox+cosY*oz);
   this.draw(wheel.buffer,wheel.count,[wx,.36,wz],rot);
  }
 }
 render(car,ps1=false,showcase=false,time=0,rivals=[],traffic=[],dt=1/60){
  const gl=this.gl,p=this.program,fx=Math.sin(car.yaw),fz=Math.cos(car.yaw);
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);gl.viewport(0,0,320,240);gl.enable(gl.DEPTH_TEST);gl.clearColor(.018,.025,.065,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(p);

  let eye,target,fovDeg=65;
  if(showcase){
   eye=[car.x+fx*3.3+fz*(2.8+Math.sin(time*.16)*.3),1.65,car.z+fz*3.3-fx*(2.8+Math.sin(time*.16)*.3)];
   target=[car.x+fz*.85,.8,car.z-fx*.85];
   fovDeg=65;
  }else{
   const cam=this.camera.update(car,dt,time);
   eye=cam.eye;
   target=cam.target;
   fovDeg=cam.fov;
  }

  gl.uniform3fv(gl.getUniformLocation(p,'eye'),eye);
  gl.uniform3fv(gl.getUniformLocation(p,'target'),target);
  const halfFovRad=(fovDeg*.5)*Math.PI/180;
  const sx=1.0/Math.tan(halfFovRad),sy=sx*(4.0/3.0);
  gl.uniform2f(gl.getUniformLocation(p,'fovScale'),sx,sy);
  gl.uniform1f(gl.getUniformLocation(p,'jitter'),+ps1);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.atlas);this.filter(ps1?gl.NEAREST:gl.LINEAR);

  this.draw(this.track,this.trackCount,[0,0,0],0);
  const chosen=this.models[N.Cars.findIndex(c=>c.id===car.car?.id)]||this.models[0];
  if(showcase||this.camera.mode!==2){
   this.drawCar(car,chosen);
  }

  for(const rival of rivals||[]){
   const body=rival.body,m=this.models[N.Cars.findIndex(c=>c.id===body.car.id)];
   this.drawCar(body,m);
  }

  for(const van of traffic||[]){
   this.drawCar(van,this.vanMesh);
  }

  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);
  this.draw(this.sprites,this.spriteCount,[0,0,0],0,gl.POINTS);
  if(showcase||this.camera.mode!==2){
   this.draw(this.glow,this.glowCount,[car.x,0,car.z],car.yaw);
  }
  gl.depthMask(true);gl.disable(gl.BLEND);

  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.DEPTH_TEST);gl.useProgram(this.post);gl.bindTexture(gl.TEXTURE_2D,this.frame);
  gl.uniform1f(gl.getUniformLocation(this.post,'boost'),+car.boost);
  gl.uniform1f(gl.getUniformLocation(this.post,'dither'),1);
  for(let i=0;i<gl.getParameter(gl.MAX_VERTEX_ATTRIBS);i++)gl.disableVertexAttribArray(i);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);const a=gl.getAttribLocation(this.post,'p');
  gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  gl.drawArrays(gl.TRIANGLES,0,6);
 }
 cycleCamera(){return this.camera.cycle();}
 setCameraMode(m){this.camera.setMode(m);}
 resetCamera(){this.camera.reset();}
 destroy(){const g=this.gl;this.resources.forEach(b=>g.deleteBuffer(b));g.deleteProgram(this.program);g.deleteProgram(this.post);g.deleteTexture(this.atlas);g.deleteTexture(this.frame);g.deleteFramebuffer(this.fbo);g.deleteRenderbuffer(this.depth);this.camera.reset();}
}
N.Camera=Camera;
N.Renderer=Renderer;
})(globalThis.NeonRacer=globalThis.NeonRacer||{});


