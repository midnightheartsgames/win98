const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
global.window={};
for(const name of ['math','pixel-font','mesh-modeler','viewport3d','modal-state-manager'])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../js/apps/blender',name+'.js'),'utf8'));
const B=window.Blender160,V=B.V;
const near=(a,b)=>a.forEach((x,i)=>assert.ok(Math.abs(x-b[i])<1e-8,`${a} != ${b}`));
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
function setup(){const model=new B.MeshModeler();const canvas={width:640,height:480,getContext:()=>({})};const view=new B.Viewport3D(canvas,model);return {model,view,modal:new B.ModalStateManager(model,view)};}
test('Primitive topology: Euler characteristic, valid indices and outward normals',()=>{
  for(const kind of ['Cube','Plane','UV Sphere','Cylinder']){
    const m=B.MeshModeler.primitive(kind);
    assert.equal(m.vertices.length-m.edges.length+m.faces.length,kind==='Plane'?1:2);
    for(const f of m.faces){assert.ok(f.every(i=>i>=0&&i<m.vertices.length));const [a,b,c]=f.map(i=>m.vertices[i]);const n=V.cross(V.sub(b,a),V.sub(c,a));assert.ok(Math.hypot(...n)>1e-7);if(kind!=='Plane')assert.ok(V.dot(n,a)>0);}
  }
});
test('Default scene and cursor placement for new primitives',()=>{const {model}=setup();assert.equal(model.objects.length,3);assert.equal(model.active.name,'Cube');model.cursor=[3,4,5];model.add('Plane');near(model.active.loc,[3,4,5]);});
test('G X moves only world X; cancel restores object exactly',()=>{const {model,modal}=setup();const original=model.snapshot();modal.begin('G',[0,0]);modal.axis('X');modal.update([50,30]);assert.notEqual(model.active.loc[0],0);near(model.active.loc.slice(1),[0,0]);modal.cancel();assert.deepEqual(model.snapshot(),original);});
test('Scale axis and commit',()=>{const {model,modal}=setup();modal.begin('S',[0,0]);modal.axis('Y');modal.update([50,0]);modal.confirm();assert.equal(model.active.scale[0],1);assert.ok(model.active.scale[1]>1);assert.equal(model.active.scale[2],1);});
test('World rotation composition on already rotated object',()=>{const {model,modal}=setup();model.active.rot=[0.4,0.3,0.2];const before=V.world(model.active,[1,0,0]);modal.begin('R',[0,0]);modal.axis('Z');modal.update([30,0]);near(V.world(model.active,[1,0,0]),V.rotate(before,[0,0,1],0.36));});
test('Edit world-axis move respects object rotation and scale',()=>{const {model,modal}=setup();model.toggleEdit();model.active.rot=[0.2,0.4,0.6];model.active.scale=[2,3,4];model.active.selected=new Set([0]);const a=V.world(model.active,model.active.mesh.vertices[0]),other=model.active.mesh.vertices[1].slice();modal.begin('G',[0,0]);modal.axis('Z');modal.update([0,-80]);const b=V.world(model.active,model.active.mesh.vertices[0]);near(b.slice(0,2),a.slice(0,2));assert.notEqual(a[2],b[2]);near(model.active.mesh.vertices[1],other);});
test('Face extrusion creates boundary walls, normal displacement, and cancel rolls topology back',()=>{const {model,modal}=setup();model.toggleEdit();model.active.selected=new Set([4,5,6,7]);const before=model.snapshot();modal.begin('E',[0,0]);modal.update([55,0]);assert.equal(model.active.mesh.vertices.length,12);assert.equal(model.active.mesh.faces.length,10);for(const i of model.active.selected)assert.equal(model.active.mesh.vertices[i][2],2);modal.cancel();assert.deepEqual(model.snapshot(),before);});
test('Adjacent face extrusion removes shared internal wall',()=>{const {model,modal}=setup();model.toggleEdit();model.active.selected=new Set([0,1,4,5,6,7]);modal.begin('E',[0,0]);assert.equal(model.active.mesh.faces.length,12);modal.cancel();});
test('Loose vertex extrusion creates a connected edge',()=>{const {model,modal}=setup();model.toggleEdit();model.active.selected=new Set([0]);modal.begin('E',[0,0]);assert.ok(model.active.mesh.edges.some(e=>e[0]===0&&e[1]===8));modal.cancel();});
test('Edit primitive insertion respects cursor and transformed mesh',()=>{const {model}=setup();model.toggleEdit();model.active.loc=[1,2,3];model.active.rot=[0.3,0.5,0.7];model.active.scale=[2,3,4];model.cursor=[5,6,7];model.add('Plane');assert.equal(model.objects.length,3);near(V.world(model.active,model.active.mesh.vertices[8]),[4,5,7]);});
test('Empty vertex selection does not begin a modal operation',()=>{const {model,modal}=setup();model.toggleEdit();model.active.selected.clear();assert.equal(modal.begin('G',[0,0]),false);assert.equal(modal.state,null);});
test('Trackball preserves an orthonormal basis',()=>{const {view}=setup();for(let i=0;i<100;i++)view.orbit(3,-2);near([V.dot(view.right,view.up),V.dot(view.up,view.forward),V.dot(view.right,view.forward)],[0,0,0]);near([Math.hypot(...view.right),Math.hypot(...view.up),Math.hypot(...view.forward)],[1,1,1]);});
test('Border selection and face picking select intended cube region',()=>{const {model,view}=setup();model.toggleEdit();view.borderSelect([0,0],[640,480],false);assert.equal(model.active.selected.size,8);const f=model.active.mesh.faces[1],center=V.mul(f.reduce((sum,i)=>V.add(sum,model.active.mesh.vertices[i]),[0,0,0]),0.25);view.pick(view.project(center),false,true);assert.equal(model.active.selected.size,4);});
test('Render outputs shaded non-background pixels with opaque alpha',()=>{const {view}=setup();view.ctx.createImageData=(w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h});const frame=view.renderFrame();assert.equal(frame.data.length,320*240*4);let changed=0;for(let i=0;i<frame.data.length;i+=4){assert.equal(frame.data[i+3],255);if(frame.data[i]!==37)changed++;}assert.ok(changed>500);});
console.log(`${count} tests passed`);
