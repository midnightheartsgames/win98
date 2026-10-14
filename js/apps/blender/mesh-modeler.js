(() => {
  const B=window.Blender160, V=B.V;
  class MeshModeler {
    constructor() {
      this.objects=[]; this.cursor=[0,0,0]; this.edit=false;
      this.add('Cube');
      this.objects.push(this.object('Lamp','lamp',null,[4,-3,6]));
      const camera=this.object('Camera','camera',null,[6,-8,5]);
      const look=V.norm(V.mul(camera.loc,-1)),right=V.norm(V.cross(look,[0,0,1])),up=V.cross(right,look);
      camera.rot=[Math.atan2(look[2],up[2]),Math.asin(-right[2]),Math.atan2(right[1],right[0])];
      this.objects.push(camera);
    }
    object(name,type,mesh,loc) { return {name,type,mesh,loc:loc.slice(),rot:[0,0,0],scale:[1,1,1],color:'#a5b1bd',selected:new Set()}; }
    static edges(faces) {
      const edges=new Map();
      faces.forEach(f=>f.forEach((a,i)=>{const b=f[(i+1)%f.length];edges.set([a,b].sort((x,y)=>x-y).join(':'),[a,b]);}));
      return [...edges.values()];
    }
    static primitive(kind) {
      let vertices=[], faces=[];
      if(kind==='Cube') {
        vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
        faces=[[3,2,1,0],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
      } else if(kind==='Plane') { vertices=[[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0]];faces=[[0,1,2,3]]; }
      else if(kind==='Cylinder') {
        const n=16;
        for(let z=0;z<2;z++) for(let i=0;i<n;i++) vertices.push([Math.cos(i*2*Math.PI/n),Math.sin(i*2*Math.PI/n),z*2-1]);
        faces.push(Array.from({length:n},(_,i)=>n-1-i),Array.from({length:n},(_,i)=>n+i));
        for(let i=0;i<n;i++) { const j=(i+1)%n;faces.push([i,j,j+n,i+n]); }
      } else if(kind==='UV Sphere') {
        const n=16,rings=7; vertices.push([0,0,1]);
        for(let j=1;j<=rings;j++) for(let i=0;i<n;i++) { const a=j*Math.PI/8,b=i*2*Math.PI/n;vertices.push([Math.sin(a)*Math.cos(b),Math.sin(a)*Math.sin(b),Math.cos(a)]); }
        const bottom=vertices.length;vertices.push([0,0,-1]);
        for(let i=0;i<n;i++) {
          const k=(i+1)%n; faces.push([0,1+i,1+k]);
          for(let j=0;j<rings-1;j++){const a=1+j*n;faces.push([a+i,a+n+i,a+n+k,a+k]);}
          faces.push([bottom,1+(rings-1)*n+k,1+(rings-1)*n+i]);
        }
      } else throw new Error('Unknown primitive');
      return {vertices,faces,edges:MeshModeler.edges(faces)};
    }
    add(kind) {
      const mesh=MeshModeler.primitive(kind);
      if(this.edit && this.active?.mesh) {
        const o=this.active,offset=o.mesh.vertices.length;
        o.mesh.vertices.push(...mesh.vertices.map(v=>V.localDelta(o,V.sub(V.add(v,this.cursor),o.loc))));
        o.mesh.faces.push(...mesh.faces.map(f=>f.map(i=>i+offset)));
        o.mesh.edges=MeshModeler.edges(o.mesh.faces);o.selected=new Set(mesh.vertices.map((_,i)=>i+offset));
      } else {
        let name=kind.replace(' ','');let n=1;while(this.objects.some(o=>o.name===name)) name=kind.replace(' ','')+'.'+String(n++).padStart(3,'0');
        this.active=this.object(name,'mesh',mesh,this.cursor);this.objects.push(this.active);
      }
    }
    toggleEdit() {
      if(!this.active?.mesh) return;
      this.edit=!this.edit;
      if(this.edit && !this.active.selected.size) this.active.selected=new Set(this.active.mesh.vertices.map((_,i)=>i));
    }
    snapshot() {
      const o=this.active;
      return {loc:o.loc.slice(),rot:o.rot.slice(),scale:o.scale.slice(),mesh:o.mesh ? structuredClone(o.mesh):null,selected:new Set(o.selected)};
    }
    restore(s) { Object.assign(this.active,{loc:s.loc.slice(),rot:s.rot.slice(),scale:s.scale.slice(),mesh:s.mesh?structuredClone(s.mesh):null,selected:new Set(s.selected)}); }
    // Extrude the selected region: replace its cap and bridge only boundary edges.
    // Loose vertices produce edges; a closed region becomes a translated shell.
    extrude() {
      const o=this.active;if(!this.edit || !o?.selected.size) return null;
      const m=o.mesh, selected=o.selected, chosen=m.faces.filter(f=>f.every(i=>selected.has(i)));
      let normal=[0,0,0];
      chosen.forEach(f=>normal=V.add(normal,V.cross(V.sub(m.vertices[f[1]],m.vertices[f[0]]),V.sub(m.vertices[f[2]],m.vertices[f[0]]))));
      normal=V.norm(normal);
      const map=new Map();selected.forEach(i=>{map.set(i,m.vertices.length);m.vertices.push(m.vertices[i].slice());});
      const boundary=new Map();
      chosen.forEach(f=>f.forEach((a,i)=>{const b=f[(i+1)%f.length],key=[a,b].sort((x,y)=>x-y).join(':');if(boundary.has(key))boundary.delete(key);else boundary.set(key,[a,b]);}));
      m.faces=m.faces.filter(f=>!chosen.includes(f));
      chosen.forEach(f=>m.faces.push(f.map(i=>map.get(i))));
      boundary.forEach(([a,b])=>m.faces.push([a,b,map.get(b),map.get(a)]));
      const loose=m.edges.filter(([a,b])=>selected.has(a)&&selected.has(b)&&!chosen.some(f=>f.includes(a)&&f.includes(b)));
      loose.forEach(([a,b])=>m.faces.push([a,b,map.get(b),map.get(a)]));
      const oldEdges=m.edges;
      m.edges=MeshModeler.edges(m.faces);
      oldEdges.filter(([a,b])=>!chosen.some(f=>f.includes(a)&&f.includes(b))&&!m.faces.some(f=>f.includes(a)&&f.includes(b))).forEach(e=>m.edges.push(e));
      selected.forEach(i=>{if(!chosen.some(f=>f.includes(i))&&!loose.some(e=>e.includes(i)))m.edges.push([i,map.get(i)]);});
      // Remove abandoned interior vertices, retaining intentional loose vertices.
      const used=new Set(m.edges.flat());m.faces.forEach(f=>f.forEach(i=>used.add(i)));
      const remap=new Map(),vertices=[];
      m.vertices.forEach((v,i)=>{if(used.has(i)||!selected.has(i)||map.has(i)&&!chosen.some(f=>f.includes(i))){remap.set(i,vertices.length);vertices.push(v);}});
      m.vertices=vertices;m.faces=m.faces.map(f=>f.map(i=>remap.get(i)));m.edges=m.edges.map(e=>e.map(i=>remap.get(i)));
      o.selected=new Set([...map.values()].map(i=>remap.get(i)));return normal;
    }
  }
  B.MeshModeler=MeshModeler;
})();
