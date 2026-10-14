/* Data-only catalogue shared by the menu, simulation and renderer. */
(function(N){
N.Cars=[
 {id:'pulse',name:'PULSE GT',type:'Купе • баланс',color:[.08,.55,.65],accent:'#69e4e8',width:1.85,length:3.8,cabin:1.65,height:.5,spoiler:true,acceleration:13,drag:.004,grip:7.5,steering:1.9,stats:[3,3,3],mass:1250,maxSpeed:52,brakeDecel:16,reverseSpeed:11,reverseAccel:8.5,lateralGrip:8.8,driftGrip:3.5,driftDrag:.12,rollingResistance:.12,steerResponse:15,yawResponse:12,highSpeedSteerMultiplier:.50,collisionStrength:.65,spinFactor:.18,impactSpeedLoss:.90},
 {id:'spark',name:'SPARK RS',type:'Хэтчбек • манёвренность',color:[.55,.8,.10],accent:'#c7f16a',width:1.7,length:3.15,cabin:1.95,height:.7,spoiler:false,acceleration:15,drag:.006,grip:9,steering:2.25,stats:[4,2,5],mass:1050,maxSpeed:46,brakeDecel:17,reverseSpeed:10,reverseAccel:9.0,lateralGrip:10.5,driftGrip:4.0,driftDrag:.14,rollingResistance:.12,steerResponse:18,yawResponse:14,highSpeedSteerMultiplier:.55,collisionStrength:.65,spinFactor:.18,impactSpeedLoss:.90},
 {id:'vandal',name:'VANDAL V8',type:'Маслкар • скорость',color:[.85,.18,.07],accent:'#ff9867',width:2,length:4.5,cabin:1.55,height:.42,spoiler:false,acceleration:11.8,drag:.0028,grip:5,steering:1.55,stats:[2,5,2],mass:1520,maxSpeed:58,brakeDecel:15,reverseSpeed:12,reverseAccel:8.0,lateralGrip:7.2,driftGrip:2.8,driftDrag:.10,rollingResistance:.12,steerResponse:13,yawResponse:10,highSpeedSteerMultiplier:.44,collisionStrength:.65,spinFactor:.18,impactSpeedLoss:.90}
];
N.Races=[
 {id:'dockside',name:'DOCKSIDE AFTERDARK',type:'circuit',label:'Кольцевая • 3 круга',description:'Портовый овал. Широкие плавные повороты.',color:'#69e4e8'},
 {id:'neon',name:'NEON DISTRICT',type:'circuit',label:'Кольцевая • 3 круга',description:'Городской квартал. Связки узких поворотов.',color:'#df8cff'},
 {id:'express',name:'COASTAL EXPRESS',type:'sprint',label:'Спринт • от старта до финиша',description:'Ночное шоссе. Скоростные S-образные связки.',color:'#ffc278'}
];
 N.TrafficTypes={
  van:{id:'van',name:'BOX VAN',type:'Развозной фургон',mass:2200,width:2.3,length:5.2,height:1.9,collisionRadius:2.5,collisionStrength:.65,spinFactor:.15,impactSpeedLoss:.92,baseCruiseSpeed:15.5,speedVariation:.10,accel:5.5,brakeDecel:14}
 };
})(globalThis.NeonRacer=globalThis.NeonRacer||{});
