'use strict';
const fs=require('node:fs'),path=require('node:path'),clip=require('./vendor/polygon-clipping.cjs');
const names=['北京市','天津市','河北省','山东省','江苏省','上海市','浙江省','福建省','台湾省','广东省','香港特别行政区','澳门特别行政区','海南省','广西壮族自治区','云南省','贵州省','湖南省','江西省','安徽省','河南省','湖北省','重庆市','四川省','陕西省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省','宁夏回族自治区','甘肃省','青海省','西藏自治区','新疆维吾尔自治区'];
const polygons=g=>g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
function simplify(ring){const step=Math.max(1,Math.floor(ring.length/180));const r=ring.filter((_,i)=>i%step===0).map(p=>p.map(v=>+v.toFixed(4)));if(r.length<4)return ring;r.push(r[0]);return r;}
const provinces=names.map((name,i)=>{
 const file=JSON.parse(fs.readFileSync(path.join(__dirname,'assets/provinces',name+'.json'),'utf8'));
 const cities=file.features.filter(f=>f.properties.name).map(f=>({name:f.properties.name,center:f.properties.centroid||f.properties.center,polygons:polygons(f.geometry).map(p=>p.map(simplify))}));
 const points=cities.flatMap(c=>c.polygons.flatMap(p=>p[0]));const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const bbox=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
 const centers=cities.filter(c=>c.center).map(c=>c.center),center=[0,1].map(axis=>centers.reduce((n,c)=>n+c[axis],0)/centers.length);
 const merged=clip.union(...file.features.filter(f=>polygons(f.geometry).length).map(f=>polygons(f.geometry))).map(p=>p.map(simplify));
 return {id:i+1,name,center,bbox,cities,polygons:merged};
});
// Taiwan's source has only a province outline. These are real city locations, not invented boundaries.
provinces[8].cities=[['台北市',121.5654,25.033],['台中市',120.6736,24.1477],['台南市',120.227,22.9997],['高雄市',120.3014,22.6273]].map(([name,x,y])=>({name,center:[x,y],polygons:[]}));
fs.writeFileSync(path.join(__dirname,'geography.js'),'window.ATLAS_GEO='+JSON.stringify({provinces})+';\n');
console.log('34 provinces, '+provinces.reduce((n,p)=>n+p.cities.length,0)+' city/district features');
