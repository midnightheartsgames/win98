/* Desktop application adapter; the model survives closing/reopening the window. */
class AppBlender {
  open() {
    const id='app_blender';
    if(window.winManager.windows.has(id)){window.winManager.restoreWindow(id);return;}
    this.model=this.model||new window.Blender160.MeshModeler();
    const content=document.createElement('div');
    window.winManager.createWindow({id,title:'Blender 1.60 Clone',icon:'blender',width:Math.min(960,window.innerWidth-30),height:Math.min(700,window.innerHeight-65),x:15,y:15,content,onClose:()=>{this.ui.destroy();this.ui=null;}});
    this.ui=new window.Blender160.BlenderUI(content,this.model);content.focus();
  }
}
window.appBlender=new AppBlender();
