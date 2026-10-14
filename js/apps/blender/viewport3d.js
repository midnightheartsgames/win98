(() => {
  const B=window.Blender160,V=B.V;
  class Viewport3D {
    constructor(canvas,model) {
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.model=model;
      this.zoom=55;this.target=[0,0,0];this.right=V.norm([1,1,0]);this.up=V.norm([-0.5,0.5,1]);
      this.forward=V.norm(V.cross(this.right,this.up));this.solid=false;this.cameraView=false;this.border=null;
    }
    resize() {const r=this.canvas.getBoundingClientRect();this.canvas.width=Math.max(1,Math.round(r.width));this.canvas.height=Math.max(1,Math.round(r.height));this.draw();}
    screenDelta(dx,dy) {return V.add(V.mul(this.right,dx/this.zoom),V.mul(this.up,-dy/this.zoom));}
    orbit(dx,dy) {
      const axis=V.norm(V.add(V.mul(this.up,dx),V.mul(this.right,dy))),angle=Math.hypot(dx,dy)*0.008;
      this.right=V.norm(V.rotate(this.right,axis,-angle));this.up=V.norm(V.rotate(this.up,axis,-angle));this.forward=V.norm(V.cross(this.right,this.up));
    }
    project(p) { const d=V.sub(p,this.target);return [this.canvas.width/2+V.dot(d,this.right)*this.zoom,this.canvas.height/2-V.dot(d,this.up)*this.zoom,V.dot(d,this.forward)]; }
    cursorAt(p) {this.model.cursor=V.add(this.model.cursor,this.screenDelta(p[0]-this.project(this.model.cursor)[0],p[1]-this.project(this.model.cursor)[1]));}
    line(a,b,color,dashed=false) {
      const c=this.ctx;c.strokeStyle=color;c.setLineDash(dashed?[4,4]:[]);c.beginPath();c.moveTo(Math.round(a[0])+0.5,Math.round(a[1])+0.5);c.lineTo(Math.round(b[0])+0.5,Math.round(b[1])+0.5);c.stroke();c.setLineDash([]);
    }
    segment(p,a,b) {const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
    inside(p,poly) {let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
    pick(p,extend,faceMode) {
      const m=this.model;
      if(m.edit) {
        const o=m.active,pts=o.mesh.vertices.map(v=>this.project(V.world(o,v)));
        if(faceMode) {
          const faces=o.mesh.faces.filter(f=>this.inside(p,f.map(i=>pts[i]))).sort((a,b)=>b.reduce((s,i)=>s+pts[i][2],0)/b.length-a.reduce((s,i)=>s+pts[i][2],0)/a.length);
          if(!extend)o.selected.clear();if(faces[0])faces[0].forEach(i=>o.selected.add(i));
        } else {
          let best=-1,distance=11;
          pts.forEach((v,i)=>{const d=Math.hypot(p[0]-v[0],p[1]-v[1]);if(d<distance){best=i;distance=d;}});
          if(!extend)o.selected.clear();if(best>=0){if(extend&&o.selected.has(best))o.selected.delete(best);else o.selected.add(best);}
        }
      } else {
        let best=null,distance=12;
        m.objects.forEach(o=>{
          const geometry=this.geometry(o),pts=geometry.vertices.map(v=>this.project(V.world(o,v)));
          let d=Math.hypot(p[0]-this.project(o.loc)[0],p[1]-this.project(o.loc)[1]);
          geometry.edges.forEach(([a,b])=>d=Math.min(d,this.segment(p,pts[a],pts[b])));
          if(this.solid&&o.mesh&&o.mesh.faces.some(f=>this.inside(p,f.map(i=>pts[i]))))d=0;
          if(d<distance){best=o;distance=d;}
        });
        if(best)m.active=best;
      }
    }
    borderSelect(a,b,extend) {
      const m=this.model;if(!m.edit)return;
      if(!extend)m.active.selected.clear();
      m.active.mesh.vertices.forEach((v,i)=>{const p=this.project(V.world(m.active,v));if(p[0]>=Math.min(a[0],b[0])&&p[0]<=Math.max(a[0],b[0])&&p[1]>=Math.min(a[1],b[1])&&p[1]<=Math.max(a[1],b[1]))m.active.selected.add(i);});
    }
    geometry(o) {
      if(o.mesh)return o.mesh;
      if(o.type==='camera')return {vertices:[[0,0,0],[-1,1,-0.65],[1,1,-0.65],[1,1,0.65],[-1,1,0.65],[0,1,1.1]],edges:[[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[4,1],[4,5],[5,3]]};
      const vertices=[],edges=[];for(let i=0;i<16;i++){const a=i*Math.PI/8;vertices.push([Math.cos(a)*0.25,Math.sin(a)*0.25,0]);edges.push([i,(i+1)%16]);}
      vertices.push([0,0,-0.6],[0,0,0.6],[-0.6,0,0],[0.6,0,0],[0,-0.6,0],[0,0.6,0]);edges.push([16,17],[18,19],[20,21]);return {vertices,edges};
    }
    draw() {
      const c=this.ctx,w=this.canvas.width,h=this.canvas.height,m=this.model;c.fillStyle='#303840';c.fillRect(0,0,w,h);
      for(let i=-20;i<=20;i++) {
        this.line(this.project([i,-20,0]),this.project([i,20,0]),i===0?'#638575':i%5===0?'#4c555b':'#3d464e');
        this.line(this.project([-20,i,0]),this.project([20,i,0]),i===0?'#99636b':i%5===0?'#4c555b':'#3d464e');
      }
      if(this.solid) {
        const frame=this.rasterize(w,h,p=>this.project(p),false);c.putImageData(frame,0,0);
      }
      m.objects.forEach(o=>{
        const geo=this.geometry(o),pts=geo.vertices.map(v=>this.project(V.world(o,v))),active=o===m.active;
        const color=active?'#f3a5c4':'#11171d';
        if(!this.solid||active||!o.mesh)geo.edges.forEach(([a,b])=>this.line(pts[a],pts[b],color,o.type==='camera'&&a!==0));
        const center=this.project(o.loc);c.fillStyle=active?'#ffe58b':'#10171d';c.fillRect(Math.round(center[0])-2,Math.round(center[1])-2,4,4);
        if(m.edit&&active)pts.forEach((p,i)=>{c.fillStyle=o.selected.has(i)?'#ffe77d':'#d98aad';c.fillRect(Math.round(p[0])-2,Math.round(p[1])-2,5,5);});
        if(o.type==='lamp')this.line(center,this.project([o.loc[0],o.loc[1],0]),'#79858e',true);
      });
      const cursor=this.project(m.cursor),x=Math.round(cursor[0]),y=Math.round(cursor[1]);
      this.line([x-14,y],[x+14,y],'#101820');this.line([x,y-14],[x,y+14],'#101820');
      for(let i=0;i<8;i++){c.strokeStyle=i%2?'#fff':'#ef5662';c.beginPath();c.arc(x+0.5,y+0.5,9,i*Math.PI/4,(i+1)*Math.PI/4);c.stroke();}
      if(this.cameraView){c.strokeStyle='#e4dcc5';c.setLineDash([6,4]);const fw=Math.min(w-48,(h-50)*4/3),fh=fw*3/4;c.strokeRect((w-fw)/2,(h-fh)/2,fw,fh);c.setLineDash([]);}
      if(this.border){const {a,b}=this.border;c.strokeStyle='#fff';c.setLineDash([3,3]);c.strokeRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);c.setLineDash([]);}
      B.pixelText(c,'USER ORTHO',12,12,'#c7d0d5');
      B.pixelText(c,m.active?.name.toUpperCase()||'SCENE',12,25,'#f3a5c4');
      const origin=[34,h-31];[[[1,0,0],'X','#ed8d93'],[[0,1,0],'Y','#8abd9f'],[[0,0,1],'Z','#90b9e3']].forEach(([axis,label,color])=>{
        const end=[origin[0]+V.dot(axis,this.right)*21,origin[1]-V.dot(axis,this.up)*21];this.line(origin,end,color);B.pixelText(c,label,end[0]+3,end[1]-3,color);
      });
    }
    // Triangle scan conversion with a per-pixel depth buffer and constant face lighting.
    rasterize(w,h,project,background=true) {
      const image=this.ctx.createImageData(w,h),data=image.data,depth=new Float64Array(w*h);depth.fill(-Infinity);
      if(background)for(let i=0;i<w*h;i++){data[i*4]=37;data[i*4+1]=44;data[i*4+2]=54;data[i*4+3]=255;}
      else image.data.set(this.ctx.getImageData(0,0,w,h).data);
      const lamp=this.model.objects.find(o=>o.type==='lamp');
      this.model.objects.filter(o=>o.mesh).forEach(o=>{
        const world=o.mesh.vertices.map(v=>V.world(o,v)),pts=world.map(project);
        const rgb=[1,3,5].map(i=>parseInt(o.color.slice(i,i+2),16));
        o.mesh.faces.forEach(f=>{
          const normal=V.norm(V.cross(V.sub(world[f[1]],world[f[0]]),V.sub(world[f[2]],world[f[0]])));
          const center=V.mul(f.reduce((s,i)=>V.add(s,world[i]),[0,0,0]),1/f.length);
          const light=0.22+0.78*Math.max(0,V.dot(normal,V.norm(V.sub(lamp?.loc||[4,-3,6],center))));
          for(let k=1;k<f.length-1;k++) {
            const a=pts[f[0]],b=pts[f[k]],c=pts[f[k+1]];if(!a||!b||!c)continue;
            const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)continue;
            const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],c[0])));
            const minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],c[1])));
            for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
              const u=((b[1]-c[1])*(x+0.5-c[0])+(c[0]-b[0])*(y+0.5-c[1]))/den;
              const v=((c[1]-a[1])*(x+0.5-c[0])+(a[0]-c[0])*(y+0.5-c[1]))/den,t=1-u-v;
              if(u<0||v<0||t<0)continue;const z=u*a[2]+v*b[2]+t*c[2],index=y*w+x;
              if(z<=depth[index])continue;depth[index]=z;for(let j=0;j<3;j++)data[index*4+j]=Math.round(rgb[j]*light);data[index*4+3]=255;
            }
          }
        });
      });return image;
    }
    renderFrame() {
      const camera=this.model.objects.find(o=>o.type==='camera'),eye=camera?.loc||[6,-8,5];
      const orient=v=>{
        if(camera)camera.rot.forEach((angle,i)=>v=V.rotate(v,[0,1,2].map(j=>+(i===j)),angle));
        return v;
      };
      const forward=orient([0,-1,0]),right=orient([1,0,0]),up=orient([0,0,1]);
      return this.rasterize(320,240,p=>{const d=V.sub(p,eye),distance=-V.dot(d,forward);if(distance<0.1)return null;return [160+V.dot(d,right)*240/distance,120-V.dot(d,up)*240/distance,1/distance];});
    }
  }
  B.Viewport3D=Viewport3D;
})();
