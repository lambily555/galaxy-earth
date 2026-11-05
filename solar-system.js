import * as THREE from './vendor/three.module.js';

// Educational circular orbits: order/direction are preserved, distance/time are compressed.
// This is not an ephemeris, a physical scale model, or a uniform time acceleration.
export const planetDefinitions=[
 {id:'mercury',name:'水星',radius:3.6,size:.55,period:26,phase:.4,description:'水星是距离太阳最近的行星，表面以岩石为主。'},
 {id:'venus',name:'金星',radius:5.6,size:1.1,period:42,phase:4.4,description:'金星位于水星与地球之间，浓厚大气覆盖了它的表面。'},
 {id:'earth',name:'地球',radius:Math.sqrt(70),size:2,period:60,phase:0,description:'地球是太阳系由内向外第三颗行星，也是你的Python学习入口。'},
 {id:'mars',name:'火星',radius:11,size:.8,period:80,phase:5.2,description:'火星位于地球轨道之外，是一颗岩石行星。'},
 {id:'jupiter',name:'木星',radius:14.3,size:2.5,period:118,phase:1.4,description:'木星是太阳系最大的行星，这里同时作为探索菜单入口。'},
 {id:'saturn',name:'土星',radius:18.4,size:2.1,period:155,phase:3.1,description:'土星有显著的环系，这里同时作为设置入口。'},
 {id:'uranus',name:'天王星',radius:23,size:1.45,period:210,phase:4.2,description:'天王星是冰巨星，外观呈浅蓝绿色。'},
 {id:'neptune',name:'海王星',radius:28,size:1.4,period:260,phase:5.5,description:'海王星是八大行星中距离太阳最远的一颗，也是冰巨星。'}
];
export function createSolarSystem({scene,earthGroup,moon,sun,addPlanet}){
 const center=sun.position.clone(),u=center.clone().negate().normalize(),v=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),u).normalize();
 const entries=planetDefinitions.map(p=>({...p,object:p.id==='earth'?earthGroup:addPlanet(p.id,p.size,[0,0,0]),angle:p.phase}));
 let elapsed=0;const lines=new THREE.Group();lines.name='educational-orbit-paths';scene.add(lines);
 function position(radius,angle){return center.clone().addScaledVector(u,radius*Math.cos(angle)).addScaledVector(v,radius*Math.sin(angle));}
 for(const p of entries){
  const points=[];for(let i=0;i<=160;i++)points.push(position(p.radius,i/160*Math.PI*2));
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x648699,transparent:true,opacity:.25,depthWrite:false}));lines.add(line);
 }
 function apply(){for(const p of entries){p.angle=p.phase+elapsed*2*Math.PI/p.period;p.object.position.copy(position(p.radius,p.angle));}const earth=entries.find(p=>p.id==='earth').object;const a=elapsed*2*Math.PI/14;moon.position.copy(earth.position).addScaledVector(u,3.5*Math.cos(a)).addScaledVector(v,3.5*Math.sin(a));}
 apply();
 return {
  center,entries,step(dt){elapsed+=dt;apply();},showPaths(show){lines.visible=show;},
  target(id){return id==='solar'?center:entries.find(p=>p.id===id)?.object.position|| (id==='moon'?moon.position:id==='sun'?center:null);},
  state(){return {elapsed,center:center.toArray(),orbits:entries.map(p=>({id:p.id,name:p.name,radius:p.radius,period:p.period,angle:p.angle,position:p.object.position.toArray()})),moon:moon.position.toArray()};}
 };
}
