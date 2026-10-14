(() => {
  const B=window.Blender160,V=B.V;
  class ModalStateManager {
    constructor(model,viewport) { this.model=model;this.viewport=viewport;this.state=null; }
    begin(type,pointer) {
      if(this.state || !this.model.active || (this.model.edit&&!this.model.active.selected.size))return false;
      const before=this.model.snapshot();let normal=null;
      if(type==='E') {normal=this.model.extrude();if(!normal)return false;}
      const base=this.model.snapshot(),o=this.model.active;
      const ids=this.model.edit?[...o.selected]:[];
      const center=ids.length?V.mul(ids.reduce((sum,i)=>V.add(sum,V.world(o,base.mesh.vertices[i])),[0,0,0]),1/ids.length):o.loc.slice();
      this.state={type,before,base,ids,center,start:pointer.slice(),last:pointer.slice(),axis:null,normal};return true;
    }
    axis(axis) {if(this.state){this.state.axis=this.state.axis===axis?null:axis;this.update(this.state.last);}}
    update(pointer) {
      const s=this.state;if(!s)return;s.last=pointer.slice();
      const o=this.model.active;this.model.restore(s.base);
      const dx=pointer[0]-s.start[0],dy=pointer[1]-s.start[1];
      const axis=s.axis?[0,1,2].map(i=>+(i==='XYZ'.indexOf(s.axis))):null;
      const delta=this.viewport.screenDelta(dx,dy);
      let shift=axis?V.mul(axis,V.dot(delta,axis)):delta;
      const angle=(dx-dy)*0.012, factor=Math.exp(Math.max(-5,Math.min(5,(dx-dy)*0.008)));
      if(s.type==='E') {
        const direction=axis || V.norm(V.sub(V.world(o,s.normal.map((n,i)=>n/(o.scale[i]*o.scale[i]))),o.loc));
        shift=V.mul(direction,(dx-dy)/this.viewport.zoom);
      }
      if(this.model.edit) {
        s.ids.forEach(i=>{
          const world=V.world(o,s.base.mesh.vertices[i]),relative=V.sub(world,s.center);
          let result;
          if(s.type==='G'||s.type==='E')result=V.add(world,shift);
          else if(s.type==='R')result=V.add(s.center,V.rotate(relative,axis||this.viewport.forward,angle));
          else result=V.add(s.center,axis?relative.map((v,j)=>v*(axis[j]?factor:1)):V.mul(relative,factor));
          o.mesh.vertices[i]=V.localDelta(o,V.sub(result,o.loc));
        });
      } else if(s.type==='G')o.loc=V.add(s.base.loc,shift);
      else if(s.type==='R') {
        // Compose world-space trackball/axis rotation, then decompose Rz*Ry*Rx.
        const columns=[[1,0,0],[0,1,0],[0,0,1]].map(v=>{
          s.base.rot.forEach((a,i)=>v=V.rotate(v,[0,1,2].map(j=>+(i===j)),a));
          return V.rotate(v,axis||this.viewport.forward,angle);
        });
        const y=Math.asin(Math.max(-1,Math.min(1,-columns[0][2])));
        o.rot=Math.abs(Math.cos(y))>1e-6?[Math.atan2(columns[1][2],columns[2][2]),y,Math.atan2(columns[0][1],columns[0][0])]:[0,y,Math.atan2(-columns[1][0],columns[1][1])];
      } else if(s.type==='S')o.scale=s.base.scale.map((v,i)=>v*(!axis||axis[i]?factor:1));
      s.value=s.type==='R'?(angle*180/Math.PI).toFixed(1)+' deg':s.type==='S'?factor.toFixed(3):Math.hypot(...shift).toFixed(3);
    }
    confirm() {this.state=null;}
    cancel() {if(this.state)this.model.restore(this.state.before);this.state=null;}
  }
  B.ModalStateManager=ModalStateManager;
})();
