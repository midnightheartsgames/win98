(function(N){
class VehicleController {
 constructor(root){this.root=root;this.keys=new Set();this.events=new AbortController();const options={signal:this.events.signal};
 root.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();this.keys.add(e.code);}},options);
 root.addEventListener('keyup',e=>this.keys.delete(e.code),options);
 root.addEventListener('focusout',()=>this.clear(),options);
 }
 clear(){this.keys.clear();}
 read(){const k=this.keys,has=(...codes)=>codes.some(c=>k.has(c));return{throttle:+has('ArrowUp','KeyW'),brake:+has('ArrowDown','KeyS'),steer:+has('ArrowLeft','KeyA')-+has('ArrowRight','KeyD'),drift:has('Space'),nitro:has('ShiftLeft','ShiftRight')};}
 transmission(speed){const gear=Math.min(5,1+Math.floor(speed/12));return{gear,rpm:Math.min(8500,1100+(speed-(gear-1)*12)*510)};}
 destroy(){this.events.abort();this.clear();}
}
N.VehicleController=VehicleController;
})(globalThis.NeonRacer=globalThis.NeonRacer||{});
