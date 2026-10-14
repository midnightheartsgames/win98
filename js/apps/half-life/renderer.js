(function (H) {
  'use strict';
  class Geometry {
    constructor() { this.vertices = []; }
    box(x, y, z, w, h, d, color, material = 0, yaw = 0) {
      const c = Math.cos(yaw), s = Math.sin(yaw);
      const p = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v => [x + v[0]*w/2*c-v[2]*d/2*s, y+v[1]*h/2, z+v[0]*w/2*s+v[2]*d/2*c]);
      [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]].forEach((face, i) => {
        const shade = [.75,.85,.7,.9,1,.5][i];
        for (const j of [0,1,2,0,2,3]) this.vertices.push(...p[face[j]], ...color.map(v => v*shade), material, i < 2 ? 0 : i < 4 ? 1 : 2);
      });
    }
  }
  class Renderer {
    constructor(canvas, overlay) {
      this.canvas = canvas; this.overlay = overlay; this.ctx = overlay.getContext('2d');
      const gl = this.gl = canvas.getContext('webgl', { antialias: false, alpha: false });
      if (!gl) throw new Error('Для Half-Life 98 нужен WebGL. Включите аппаратное ускорение браузера.');
      const vs = `attribute vec3 position; attribute vec3 color; attribute vec2 surface; uniform vec3 eye; uniform vec2 angle; uniform float aspect; varying vec3 vColor; varying vec3 vWorld; varying vec2 vSurface; varying float distance;
      void main(){vec3 q=position-eye;float f=dot(q.xz,vec2(cos(angle.x),sin(angle.x)));float r=dot(q.xz,vec2(-sin(angle.x),cos(angle.x)));float u=q.y*cos(angle.y)-f*sin(angle.y);float z=f*cos(angle.y)+q.y*sin(angle.y);gl_Position=vec4(r*1.35/aspect,u*1.35,z*1.00334-.200334,z);vColor=color;vWorld=position;vSurface=surface;distance=length(q);}`;
      const fs = `precision mediump float; varying vec3 vColor; varying vec3 vWorld; varying vec2 vSurface; varying float distance; uniform sampler2D tex; uniform float flicker; uniform float flash;
      void main(){vec2 uv=vSurface.y<.5?vWorld.xy:vSurface.y<1.5?vWorld.zy:vWorld.xz;float grain=texture2D(tex,uv*.45).r;float m=vSurface.x;vec3 c=vColor;
      if(m<.5)c*=.7+grain*.42;
      if(m>.5&&m<1.5){c*=.75+grain*.35;float seam=step(.975,fract(uv.x*.5))+step(.965,fract(uv.y*.5));c*=1.-min(seam,1.)*.3;}
      if(m>1.5&&m<2.5)c*=.6+grain*.45+step(.86,fract(uv.x*6.))*.15;
      if(m>2.5&&m<3.5)c*=.3+step(.5,fract((uv.x+uv.y)*3.))*.7;
      if(m<3.5)c*=flicker*(.85+flash*.4*max(0.,1.-distance/8.));
      c=m>3.5?c:mix(c,vec3(.055,.067,.063),clamp((distance-6.)/34.,0.,.88));gl_FragColor=vec4(c,1.);}`;
      const compile = (type, source) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)); return shader; };
      this.program = gl.createProgram(); this.shaders = [compile(gl.VERTEX_SHADER, vs), compile(gl.FRAGMENT_SHADER, fs)]; this.shaders.forEach(s => gl.attachShader(this.program, s)); gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
      gl.useProgram(this.program); this.locations = {};
      for (const n of ['eye','angle','aspect','flicker','flash']) this.locations[n] = gl.getUniformLocation(this.program,n);
      this.attributes = ['position','color','surface'].map(n=>gl.getAttribLocation(this.program,n));
      this.staticBuffer = gl.createBuffer(); this.dynamicBuffer = gl.createBuffer(); this.texture = gl.createTexture();
      const pixels = new Uint8Array(128*128*4); let seed = 98;
      for(let i=0;i<128*128;i++){seed=(seed*1664525+1013904223)>>>0;const v=130+(seed%95);pixels.set([v,v,v,255],i*4);}
      gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,128,128,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.enable(gl.DEPTH_TEST);
    }
    build(w) {
      this.world = w; const g = new Geometry(), lab = !w.level;
      for(let z=0;z<w.size;z++)for(let x=0;x<w.size;x++){
        if(w.grid[z][x]){
          if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>w.grid[z+dz]?.[x+dx]===0))continue;
          g.box(x+.5,1.8,z+.5,1,3.6,1,lab?[.49,.53,.49]:[.38,.40,.36],1);
          g.box(x+.5,.8,z+.5,1.015,.17,1.015,lab?[.25,.38,.34]:[.64,.40,.13]);
        }else{g.box(x+.5,-.08,z+.5,1,.16,1,lab?[.29,.32,.3]:[.22,.24,.23],1);g.box(x+.5,3.7,z+.5,1,.2,1,[.22,.25,.24],2);}
      }
      w.rooms.forEach((r,i)=>{
        g.box(r.x,3.45,r.z,3.5,.12,.48,[.85,.94,.77],4);
        g.box(r.x-3.8,3.05,r.z,.24,.24,10,[.42,.27,.16],2);
        g.box(r.x-3.4,3.05,r.z,.16,.16,10,[.26,.31,.32],2);
        g.box(r.x+4.9,2.1,r.z-2,.14,.2,.25,[1,.15,.025],4);
        g.box(r.x, .008,r.z,2.5,.015,.3,[.7,.47,.09],3);
        if(i===0&&!w.level){g.box(r.x+2,1,r.z+2,2,2,2,[.22,.26,.25],2);g.box(r.x+2,2.15,r.z+2,1.2,.3,1.2,[.3,.65,.3],4);g.box(r.x+1,.025,r.z+1.5,2,.03,1.3,[.22,.055,.03]);}
        if(w.level&&i===5)g.box(r.x,.02,r.z,6,.03,6,[.08,.27,.28],2);
      });
      for(const o of w.props){
        if(o.type==='table'){g.box(o.x, .95,o.z,2,.15,1.1,[.48,.49,.43],2);for(const dx of[-.85,.85])g.box(o.x+dx,.45,o.z,.1,.9,.8,[.25,.28,.27]);g.box(o.x,.1,o.z+1,.6,.2,.6,[.3,.12,.05]);}
        if(o.type==='console'){g.box(o.x,.65,o.z,1.6,1.3,1.4,[.31,.36,.33],2);g.box(o.x,1.65,o.z,1.4,.7,.3,[.15,.18,.17]);g.box(o.x,1.65,o.z+.17,1.15,.48,.03,[.1,.55,.32],4);}
        if(o.type==='generator'){g.box(o.x,1.15,o.z,1.6,2.3,1.4,[.35,.39,.33],2);for(let y=.4;y<2;y+=.28)g.box(o.x,y,o.z+.72,1.3,.07,.04,[.1,.12,.1]);g.box(o.x,2.3,o.z,.6,.12,.6,[.45,.63,.2],4);}
        if(o.type==='vent'){g.box(o.x,2.5,o.z,2.6,2.2,9.8,[.27,.31,.3],2);g.box(o.x,1.27,o.z,2.62,.12,9.8,[.4,.43,.4],2);}
      }
      this.staticCount = g.vertices.length/8; this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.staticBuffer);this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(g.vertices),this.gl.STATIC_DRAW);
    }
    drawBuffer(buffer,count){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);this.attributes.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,i===2?2:3,gl.FLOAT,false,32,[0,12,24][i]);});gl.drawArrays(gl.TRIANGLES,0,count);}
    project(x,y,z,p){const dx=x-p.x,dz=z-p.z,dy=y-(p.y+(p.crouch?.85:1.6));const f=dx*Math.cos(p.yaw)+dz*Math.sin(p.yaw),right=-dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw),up=dy*Math.cos(p.pitch)-f*Math.sin(p.pitch),depth=f*Math.cos(p.pitch)+dy*Math.sin(p.pitch);return depth>.2?[this.canvas.width/2+right/depth*this.canvas.height*.675,this.canvas.height/2-up/depth*this.canvas.height*.675,depth]:null;}
    render(w) {
      const gl=this.gl,p=w.player,g=new Geometry(),t=w.time;
      for(const d of w.doors){const wide=d.axis==='x';g.box(d.x,1.7+d.slide*3.5,d.z,wide?.8:3,3.4,wide?3:.8,[.35,.39,.36],2);if(d.slide<.8)g.box(d.x,1.1+d.slide*3.5,d.z,wide?.82:3.02,.3,wide?3.02:.82,d.type==='locked'||d.arenaLock?[.55,.12,.02]:[.85,.6,.12],3);}
      for(const b of w.breakables){if(b.broken)continue;if(b.type==='boards'){for(const y of[.4,1.1,1.8,2.5])g.box(b.x,y,b.z,.3,.32,3,[.53,.36,.17],2);continue;}const glass=b.type==='glass';g.box(b.x,glass?1.2:.5,b.z,glass?.12:.9,glass?2.4:1,.9,glass?[.35,.57,.58]:[.53,.36,.17],glass?1:2);if(!glass)for(const y of[.12,.86])g.box(b.x,y,b.z,.94,.09,.94,[.2,.16,.1]);}
      for(const o of w.items){if(o.used)continue;const bob=Math.sin(t*3)*.035;
        if(o.type==='station'||o.type==='exit'){g.box(o.x,1.2,o.z,.7,1.2,.35,[.23,.27,.24],2);g.box(o.x,1.4,o.z,.73,.35,.38,o.type==='exit'?[.1,.85,.38]:[.95,.23,.1],4);g.box(o.x,1,o.z,.74,.12,.39,[.8,.75,.55]);}
        else if(o.type==='crowbar'){g.box(o.x,.28+bob,o.z,.09,.09,.95,[.63,.14,.065],2);g.box(o.x+.12,.28+bob,o.z-.46,.3,.09,.1,[.5,.52,.5]);}
        else if(o.type==='pistol'){g.box(o.x,.35+bob,o.z,.18,.17,.5,[.27,.29,.28],2);g.box(o.x,.2+bob,o.z+.12,.16,.3,.18,[.12,.13,.12]);}
        else{g.box(o.x,.25+bob,o.z,.5,.38,.45,o.type==='health'?[.8,.79,.65]:[.42,.47,.24]);g.box(o.x,.45+bob,o.z,.12,.015,.36,o.type==='health'?[.8,.1,.035]:[.75,.62,.2],4);g.box(o.x,.46+bob,o.z,.36,.015,.12,o.type==='health'?[.8,.1,.035]:[.75,.62,.2],4);}
      }
      for(const e of w.enemies){
        const dead=!e.hp,crab=e.type==='headcrab',vort=e.type==='vortigaunt',y=e.y+(dead?-.8:0),walk=dead?0:Math.sin(t*7+e.x)*.12;
        if(crab){g.box(e.x,dead?.13:.3+e.y,e.z,.65,dead?.2:.38,.65,[.58,.42,.25]);for(const dx of[-1,1])for(const dz of[-1,1])g.box(e.x+dx*.42,.18+e.y,e.z+dz*.3,.42,.12,.13,[.48,.29,.13],0,dx*dz*.6);}
        else if(dead){g.box(e.x,.18,e.z,1.5,.3,.6,vort?[.38,.42,.19]:[.65,.66,.53]);}
        else{
          const skin=vort?[.42,.46,.21]:[.62,.63,.51];g.box(e.x,.98+y,e.z,.64,.85,.4,skin);g.box(e.x,1.58+y,e.z,.48,.43,.48,vort?[.45,.39,.19]:[.58,.4,.24]);
          for(const dx of[-1,1]){g.box(e.x+dx*.21,.35+y+walk*dx,e.z,.21,.7,.25,vort?[.28,.31,.16]:[.18,.23,.27]);g.box(e.x+dx*.47,1.1+y,e.z+.1+walk,.2,.65,.22,skin);}
          if(!vort){for(const dx of[-1,1])g.box(e.x+dx*.3,1.5,e.z,.15,.3,.12,[.48,.3,.14]);g.box(e.x,1.04,e.z+.21,.3,.4,.015,[.38,.075,.025]);}
          else{g.box(e.x,1.65,e.z+.25,.16,.15,.02,[1,.22,.03],4);if(e.state==='charge')for(const dx of[-1,1])g.box(e.x+dx*.5,1,e.z,.25,.25,.25,[.4,1,.25],4);}
        }
      }
      for(const a of w.particles)g.box(a.x,a.y,a.z,.08,.08,.08,a.color,4);
      gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(.055,.067,.063,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
      gl.uniform3f(this.locations.eye,p.x,p.y+(p.crouch?.85:1.6),p.z);gl.uniform2f(this.locations.angle,p.yaw,p.pitch);gl.uniform1f(this.locations.aspect,this.canvas.width/this.canvas.height);gl.uniform1f(this.locations.flicker,w.flicker&&Math.sin(t*43)>.1?.55:1);gl.uniform1f(this.locations.flash,p.weapon==='pistol'&&w.weapons.pistol.animation>.15?1:0);
      this.drawBuffer(this.staticBuffer,this.staticCount);gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.vertices),gl.DYNAMIC_DRAW);this.drawBuffer(this.dynamicBuffer,g.vertices.length/8);
      this.drawOverlay(w);
    }
    drawOverlay(w){
      const c=this.ctx,W=this.overlay.width,Hh=this.overlay.height,p=w.player;c.clearRect(0,0,W,Hh);c.save();
      for(let i=0;i<w.rooms.length;i++){const r=w.rooms[i];if(HL98.distance(r,p)>15||!w.visible(p,r))continue;const q=this.project(r.x,2.8,r.z,p);if(!q)continue;const size=Math.max(8,Math.min(17,100/q[2]));c.font=`bold ${size}px monospace`;c.textAlign='center';c.fillStyle='#151d18';const text=`${String(i+1).padStart(2,'0')} / ${r.name}`,tw=c.measureText(text).width;c.fillRect(q[0]-tw/2-7,q[1]-size,tw+14,size+8);c.fillStyle='#d2d4b4';c.fillText(text,q[0],q[1]);}
      for(const e of w.enemies){if(!e.beam)continue;const q=this.project(e.x,1,e.z,p);if(q){c.strokeStyle='#a2ff65';c.lineWidth=3;c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(W*.55,Hh*.8);c.stroke();}}
      c.translate(W*.6,Hh);const scale=Hh/360;c.scale(scale,scale);const weapon=w.weapons[p.weapon],anim=weapon?.animation||0;const bob=Math.sin(w.time*7)*2;
      c.translate(bob,weapon?.reloadTimer>0?55:0);
      if(p.weapon==='crowbar'){c.rotate(-.3-anim*3);c.strokeStyle='#272721';c.lineWidth=15;c.beginPath();c.moveTo(25,25);c.lineTo(45,-145);c.lineTo(65,-167);c.lineTo(76,-158);c.stroke();c.strokeStyle='#a33a1c';c.lineWidth=8;c.stroke();c.fillStyle='#b27d4f';c.fillRect(9,-30,37,45);}
      if(p.weapon==='pistol'){c.translate(0,anim*70);c.fillStyle='#a47348';c.beginPath();c.moveTo(-12,10);c.lineTo(8,-75);c.lineTo(46,-65);c.lineTo(85,10);c.fill();c.fillStyle='#282d2d';c.fillRect(10,-122,30,72);c.fillStyle='#666c67';c.fillRect(12,-123,26,40);c.fillStyle='#111a17';c.fillRect(20,-124,10,12);c.fillStyle='#c6cbb5';c.fillRect(24,-126,3,6);if(anim>.15){c.fillStyle='#ffc95e';c.beginPath();c.moveTo(25,-127);c.lineTo(-1,-153);c.lineTo(20,-145);c.lineTo(26,-176);c.lineTo(34,-146);c.lineTo(57,-159);c.lineTo(37,-126);c.fill();}}
      c.restore();if(p.hurt){c.fillStyle=`rgba(180,22,0,${p.hurt*.65})`;c.fillRect(0,0,W,Hh);}c.strokeStyle='#f2b34c';c.lineWidth=1;c.beginPath();c.moveTo(W/2-7,Hh/2);c.lineTo(W/2-3,Hh/2);c.moveTo(W/2+3,Hh/2);c.lineTo(W/2+7,Hh/2);c.moveTo(W/2,Hh/2-7);c.lineTo(W/2,Hh/2-3);c.moveTo(W/2,Hh/2+3);c.lineTo(W/2,Hh/2+7);c.stroke();
    }
    resize(width){this.canvas.width=width;this.canvas.height=Math.round(width*.625);this.overlay.width=this.canvas.width;this.overlay.height=this.canvas.height;}
    destroy(){const gl=this.gl;gl.deleteBuffer(this.staticBuffer);gl.deleteBuffer(this.dynamicBuffer);gl.deleteTexture(this.texture);gl.deleteProgram(this.program);this.shaders.forEach(s=>gl.deleteShader(s));}
  }
  H.Renderer=Renderer;
})(globalThis.HL98=globalThis.HL98||{});
