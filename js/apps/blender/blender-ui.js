(() => {
  const B=window.Blender160;
  class BlenderUI {
    constructor(root,model) {
      this.root=root;this.model=model;this.context='Edit';this.faceMode=false;this.listeners=new AbortController();this.renderTimer=null;
      root.className='blender-app';root.tabIndex=0;
      root.innerHTML=`<div class="blender-top"><span class="blender-brand" data-pixel="BLENDER / 1.60"></span><button data-action="add">Add</button><button data-action="render">Render</button><span class="blender-spacer"></span><span data-pixel="NEOGEO / NaN"></span><button data-action="help">?</button></div>
        <div class="blender-view"><canvas class="blender-viewport" aria-label="3D Viewport. ПКМ: выделение, ЛКМ: 3D Cursor, СКМ: вращение"></canvas></div>
        <div class="blender-header"><button data-action="mode">Object Mode</button><button data-action="shade">Wireframe</button><button data-action="camera">Frame</button><button data-action="home">Home</button><span class="blender-spacer"></span><span class="blender-count"></span></div>
        <div class="blender-divider" title="Перетащите границу тайлов"></div>
        <div class="blender-buttons"><div class="blender-header"><span data-pixel="BUTTONS"></span><button data-context="Edit">Edit</button><button data-context="Material">Material</button><button data-context="Scene">Scene</button><span class="blender-spacer"></span><span data-pixel="SCR: MODEL"></span></div><div class="blender-panels"></div></div>
        <div class="blender-status" aria-live="polite"></div>`;
      this.canvas=root.querySelector('.blender-viewport');this.view=new B.Viewport3D(this.canvas,model);this.modal=new B.ModalStateManager(model,this.view);
      this.pointer=[0,0];this.drag=null;this.borderArmed=false;
      this.labelStatic(root);this.bind();this.panel();this.resize=new ResizeObserver(()=>{this.view.resize();this.pointer=[this.canvas.width/2,this.canvas.height/2];});this.resize.observe(this.canvas);this.update();
    }
    label(el,text) {
      el.textContent='';const c=document.createElement('canvas');c.width=String(text).length*6;c.height=9;c.style.width=c.width+'px';c.style.height='9px';c.setAttribute('aria-hidden','true');
      B.pixelText(c.getContext('2d'),text,0,1);el.append(c);el.setAttribute('aria-label',text);
    }
    labelStatic(parent) {parent.querySelectorAll('[data-pixel]').forEach(el=>this.label(el,el.dataset.pixel));parent.querySelectorAll('button').forEach(el=>this.label(el,el.textContent));}
    on(el,event,fn,options={}) {el.addEventListener(event,fn,{...options,signal:this.listeners.signal});}
    panel() {
      const panel=this.root.querySelector('.blender-panels'),o=this.model.active;
      panel.innerHTML='';
      if(this.context==='Edit') {
        panel.innerHTML=`<section class="blender-panel"><h3 data-pixel="TRANSFORM / ${o.name}"></h3><div class="blender-fields">${['LocX','LocY','LocZ','RotX','RotY','RotZ','ScaleX','ScaleY','ScaleZ'].map((name,i)=>`<label class="blender-field"><span data-pixel="${name}"></span><input aria-label="${name}" type="number" step="${i<3?'0.1':i<6?'5':'0.1'}" data-field="${i}"></label>`).join('')}</div></section>
          <section class="blender-panel"><h3 data-pixel="MESH TOOLS"></h3><div class="blender-actions"><button data-action="vertices">Vertices</button><button data-action="faces">Faces</button></div><div class="blender-actions"><button data-action="extrude">Extrude E</button><button data-action="border">Border B</button><button data-action="all">All A</button></div><div class="blender-actions"><button data-action="grab">Grab G</button><button data-action="rotate">Rot R</button><button data-action="scale">Size S</button></div></section>
          <section class="blender-panel"><h3 data-pixel="ACTIVE OBJECT"></h3><select aria-label="Active object">${this.model.objects.map((item,i)=>`<option value="${i}">${item.name}</option>`).join('')}</select><div class="blender-actions"><button data-action="render">Render F12</button></div></section>`;
        panel.querySelector('select').value=this.model.objects.indexOf(o);
      } else if(this.context==='Material') {
        panel.innerHTML=`<section class="blender-panel"><h3 data-pixel="MATERIAL / ${o.name}"></h3><label>Diffuse <input type="color" aria-label="Diffuse color" value="${o.color}"></label><div class="blender-actions"><span data-pixel="FLAT SHADED / LAMBERT"></span></div></section><section class="blender-panel"><h3 data-pixel="PREVIEW"></h3><button data-action="shade">Wire / Solid</button><div class="blender-actions"><button data-action="render">Render F12</button></div></section>`;
      } else {
        panel.innerHTML=`<section class="blender-panel"><h3 data-pixel="RENDER / SCANLINE"></h3><span data-pixel="SIZE: 320 X 240"></span><div class="blender-actions"><button data-action="render">Render F12</button></div></section><section class="blender-panel"><h3 data-pixel="SCENE"></h3><p>Камера: Loc / Rot в контексте Edit.</p><p>Освещение: Lamp / Flat shading</p><button data-action="home">Center view</button></section>`;
      }
      this.labelStatic(panel);this.syncFields();this.updateButtons();
    }
    syncFields() {
      const o=this.model.active;
      this.root.querySelectorAll('[data-field]').forEach(el=>{if(document.activeElement===el)return;const i=+el.dataset.field;el.value=(i<3?o.loc[i]:i<6?o.rot[i-3]*180/Math.PI:o.scale[i-6]).toFixed(3);});
    }
    updateButtons() {
      this.root.querySelectorAll('[data-context]').forEach(b=>b.classList.toggle('active',b.dataset.context===this.context));
      ['vertices','faces'].forEach(name=>this.root.querySelector(`[data-action="${name}"]`)?.classList.toggle('active',name==='faces'?this.faceMode:!this.faceMode));
      ['extrude','border','all','vertices','faces'].forEach(name=>{const b=this.root.querySelector(`[data-action="${name}"]`);if(b)b.disabled=!this.model.edit;});
    }
    update(message) {
      this.view.draw();this.syncFields();this.updateButtons();
      this.label(this.root.querySelector('[data-action="mode"]'),this.model.edit?'Edit Mode':'Object Mode');
      this.label(this.root.querySelector('[data-action="shade"]'),this.view.solid?'Flat Solid':'Wireframe');
      const o=this.model.active;this.label(this.root.querySelector('.blender-count'),`VE:${o.mesh?.vertices.length||0} FA:${o.mesh?.faces.length||0} OB:${this.model.objects.length}`);
      const s=this.modal.state;
      this.label(this.root.querySelector('.blender-status'),message||(s?`${s.type} ${s.axis||'FREE'}: ${s.value||'0.000'} | LMB: OK  RMB/ESC: CANCEL`:this.borderArmed?'BORDER: DRAG LMB | SHIFT: ADD | ESC: CANCEL':'RMB SELECT | LMB CURSOR | MMB ORBIT | SPACE ADD | TAB EDIT'));
    }
    point(e) {const r=this.canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
    bind() {
      const root=this.root;
      this.on(root,'contextmenu',e=>{e.preventDefault();e.stopPropagation();});
      this.on(root,'pointerdown',e=>{if(!e.target.closest('input,select'))root.focus({preventScroll:true});});
      this.on(root,'click',e=>{
        const b=e.target.closest('button');if(!b)return;
        if(b.dataset.context){if(this.modal.state)return;this.context=b.dataset.context;this.panel();return;}
        if(b.dataset.primitive){this.closeMenu();this.model.add(b.dataset.primitive);this.panel();this.update();return;}
        if(b.dataset.menu){this.openMenu(this.menuPosition,b.dataset.menu);return;}
        this.action(b.dataset.action);
      });
      this.on(root,'change',e=>{
        if(this.modal.state){this.syncFields();return;}
        const o=this.model.active,el=e.target;
        if(el.matches('[data-field]')){const i=+el.dataset.field,v=Number(el.value);if(Number.isFinite(v)&&(i<6||Math.abs(v)>=0.001)){if(i<3)o.loc[i]=v;else if(i<6)o.rot[i-3]=v*Math.PI/180;else o.scale[i-6]=v;}el.blur();}
        if(el.type==='color')o.color=el.value;
        if(el.matches('select')){this.model.edit=false;this.model.active=this.model.objects[+el.value];this.panel();}
        this.update();
      });
      this.on(this.canvas,'pointerdown',e=>{
        e.preventDefault();this.closeMenu();this.pointer=this.point(e);
        if(this.modal.state){if(e.button===0)this.modal.confirm();if(e.button===2)this.modal.cancel();this.update();return;}
        if(e.button===1){this.drag={kind:e.shiftKey?'pan':e.ctrlKey?'zoom':'orbit',last:this.pointer};}
        else if(e.button===0&&this.borderArmed){this.drag={kind:'border',start:this.pointer,extend:e.shiftKey};this.view.border={a:this.pointer,b:this.pointer};}
        else if(e.button===0)this.view.cursorAt(this.pointer);
        else if(e.button===2){if(this.borderArmed)this.borderArmed=false;else{this.view.pick(this.pointer,e.shiftKey,this.faceMode);this.panel();}}
        if(this.drag)this.canvas.setPointerCapture(e.pointerId);this.update();
      });
      this.on(this.canvas,'pointermove',e=>{
        this.pointer=this.point(e);if(this.modal.state){this.modal.update(this.pointer);this.update();return;}
        if(!this.drag)return;const d=this.drag;
        if(d.kind==='border')this.view.border={a:d.start,b:this.pointer};
        else{const dx=this.pointer[0]-d.last[0],dy=this.pointer[1]-d.last[1];if(d.kind==='orbit')this.view.orbit(dx,dy);else if(d.kind==='pan')this.view.target=B.V.sub(this.view.target,this.view.screenDelta(dx,dy));else this.view.zoom=Math.max(8,Math.min(400,this.view.zoom*Math.exp(-dy*0.012)));d.last=this.pointer;}
        this.update();
      });
      this.on(this.canvas,'pointerup',e=>{if(this.drag?.kind==='border'){this.view.borderSelect(this.drag.start,this.point(e),this.drag.extend);this.borderArmed=false;this.view.border=null;}this.drag=null;if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);this.update();});
      this.on(this.canvas,'pointercancel',()=>{this.drag=null;this.view.border=null;this.borderArmed=false;this.update();});
      this.on(this.canvas,'wheel',e=>{e.preventDefault();if(this.modal.state)return;this.view.zoom=Math.max(8,Math.min(400,this.view.zoom*Math.exp(-e.deltaY*0.001)));this.update();},{passive:false});
      this.on(document,'keydown',e=>{
        if(!window.winManager.isTopWindow('app_blender')||e.target.closest('input,select,textarea'))return;
        const key=e.key.toUpperCase();if(!['G','R','S','E','B','A','X','Y','Z','TAB',' ','ESCAPE','ENTER','F12','HOME'].includes(key))return;
        e.preventDefault();e.stopPropagation();if(e.repeat)return;
        if(this.modal.state){if('XYZ'.includes(key)&&key.length===1)this.modal.axis(key);else if(key==='ESCAPE')this.modal.cancel();else if(key==='ENTER')this.modal.confirm();this.update();return;}
        if(key==='ESCAPE'){this.closeMenu();root.querySelector('.blender-help')?.remove();this.borderArmed=false;this.drag=null;this.view.border=null;}
        else if(key===' ')this.action('add');else if(key==='TAB')this.action('mode');else if(key==='F12')this.render();
        else if(key==='B')this.action('border');else if(key==='A')this.action('all');else if(key==='HOME')this.action('home');
        else if(['G','R','S','E'].includes(key))this.modal.begin(key,this.pointer);
        else if(key==='Z')this.view.solid=!this.view.solid;
        this.update();
      });
      const divider=root.querySelector('.blender-divider');let split=null;
      this.on(divider,'pointerdown',e=>{split={y:e.clientY,height:root.querySelector('.blender-buttons').offsetHeight};divider.setPointerCapture(e.pointerId);});
      this.on(divider,'pointermove',e=>{if(split)root.querySelector('.blender-buttons').style.height=Math.max(95,Math.min(root.clientHeight-180,split.height+split.y-e.clientY))+'px';});
      this.on(divider,'pointerup',()=>split=null);this.on(divider,'pointercancel',()=>split=null);
      this.on(window,'blur',()=>{this.modal.cancel();this.drag=null;this.view.border=null;this.update();});
    }
    action(name) {
      if(this.modal.state)return;
      const m=this.model;
      if(name==='mode'){m.toggleEdit();this.panel();}
      else if(name==='shade')this.view.solid=!this.view.solid;
      else if(name==='camera')this.view.cameraView=!this.view.cameraView;
      else if(name==='home'){this.view.target=m.active.loc.slice();this.view.zoom=55;}
      else if(name==='vertices')this.faceMode=false;
      else if(name==='faces')this.faceMode=true;
      else if(name==='border'&&m.edit)this.borderArmed=true;
      else if(name==='all'&&m.edit)m.active.selected=m.active.selected.size?new Set():new Set(m.active.mesh.vertices.map((_,i)=>i));
      else if(['grab','rotate','scale','extrude'].includes(name))this.modal.begin({grab:'G',rotate:'R',scale:'S',extrude:'E'}[name],this.pointer);
      else if(name==='add'){const rect=this.canvas.getBoundingClientRect(),r=this.root.getBoundingClientRect();this.openMenu([this.pointer[0]+rect.left-r.left,this.pointer[1]+rect.top-r.top],'root');}
      else if(name==='render')this.render();
      else if(name==='help') {
        const old=this.root.querySelector('.blender-help');if(old)old.remove();else{const help=document.createElement('div');help.className='blender-help';help.innerHTML='<strong>BLENDER 1.60 / QUICK REFERENCE</strong><p>ПКМ — выделить · Shift + ПКМ — добавить</p><p>ЛКМ — 3D Cursor · СКМ — вращать</p><p>Shift + СКМ — панорама · Ctrl + СКМ / колесо — зум</p><p>G / R / S — перемещение / вращение / масштаб</p><p>X / Y / Z — ось · ЛКМ / Enter — принять</p><p>ПКМ / Esc — отменить · Tab — Edit Mode</p><p>A — всё / ничего · B — рамка (сквозное выделение)</p><p>Faces + ПКМ — выбрать грань · E — выдавить</p><p>Space — Add → Mesh · Z — Wire / Solid</p><p>F12 — рендер · Home — центр объекта</p><p>Перетаскивайте разделитель над Buttons Window.</p><button data-action="help">Close</button>';this.root.append(help);}}
      this.update();
    }
    closeMenu() {this.root.querySelector('.blender-menu')?.remove();}
    openMenu(position,stage) {
      this.closeMenu();this.menuPosition=position;const menu=document.createElement('div');menu.className='blender-menu';
      menu.style.left=Math.max(0,Math.min(this.root.clientWidth-170,position[0]))+'px';menu.style.top=Math.max(0,Math.min(this.root.clientHeight-165,position[1]))+'px';
      menu.innerHTML=stage==='root'?'<div class="blender-menu-title" data-pixel="TOOLBOX"></div><button data-menu="add">Add ></button>':stage==='add'?'<div class="blender-menu-title" data-pixel="ADD"></div><button data-menu="mesh">Mesh ></button>':'<div class="blender-menu-title" data-pixel="ADD / MESH"></div>'+['Cube','Plane','UV Sphere','Cylinder'].map(p=>`<button data-primitive="${p}">${p}</button>`).join('');
      this.labelStatic(menu);this.root.append(menu);
    }
    render() {
      const id='app_blender_render';
      if(window.winManager.windows.has(id)){window.winManager.restoreWindow(id);return;}
      const content=document.createElement('div');content.className='blender-render';content.innerHTML='<canvas width="320" height="240" aria-label="Scanline render result"></canvas><span>RENDER: 0 / 240</span>';
      const canvas=content.querySelector('canvas'),ctx=canvas.getContext('2d'),frame=this.view.renderFrame();let row=0;
      ctx.fillStyle='#101820';ctx.fillRect(0,0,320,240);
      window.winManager.createWindow({id,title:'Blender Render — 320 x 240',icon:'blender',width:350,height:305,resizable:false,maximizable:false,content,onClose:()=>{clearInterval(this.renderTimer);this.renderTimer=null;}});
      this.renderTimer=setInterval(()=>{const count=Math.min(4,240-row);ctx.putImageData(frame,0,0,0,row,320,count);row+=count;content.querySelector('span').textContent=`RENDER: ${row} / 240${row===240?' — DONE':''}`;if(row>=240){clearInterval(this.renderTimer);this.renderTimer=null;}},16);
    }
    destroy() {this.modal.cancel();this.listeners.abort();this.resize.disconnect();clearInterval(this.renderTimer);if(window.winManager.windows.has('app_blender_render'))window.winManager.closeWindow('app_blender_render');}
  }
  B.BlenderUI=BlenderUI;
})();
