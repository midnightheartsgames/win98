/* Shared geometry helpers. No rendering or DOM dependencies. */
window.Blender160 = window.Blender160 || {};
(() => {
  const B = window.Blender160;
  B.V = {
    add: (a,b) => a.map((v,i) => v+b[i]),
    sub: (a,b) => a.map((v,i) => v-b[i]),
    mul: (a,s) => a.map(v => v*s),
    dot: (a,b) => a.reduce((s,v,i) => s+v*b[i],0),
    cross: (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]],
    norm: a => { const n=Math.hypot(...a); return n>1e-9 ? a.map(v=>v/n) : [0,0,1]; },
    rotate(a, axis, angle) {
      const n=this.norm(axis), c=Math.cos(angle), s=Math.sin(angle);
      return this.add(this.add(this.mul(a,c),this.mul(this.cross(n,a),s)),this.mul(n,this.dot(n,a)*(1-c)));
    },
    world(o,v) {
      let p=v.map((x,i)=>x*o.scale[i]);
      [[1,0,0],[0,1,0],[0,0,1]].forEach((axis,i)=>p=this.rotate(p,axis,o.rot[i]));
      return this.add(p,o.loc);
    },
    localDelta(o,v) {
      let p=v.slice();
      [2,1,0].forEach(i=>p=this.rotate(p,[0,1,2].map(j=>+(i===j)),-o.rot[i]));
      return p.map((x,i)=>x/o.scale[i]);
    }
  };
})();
