'use strict';
const fs=require('node:fs'),path=require('node:path'),clip=require('./vendor/polygon-clipping.js');
const names=['北京市','天津市','河北省','山东省','江苏省','上海市','浙江省','福建省','台湾省','广东省','香港特别行政区','澳门特别行政区','海南省','广西壮族自治区','云南省','贵州省','湖南省','江西省','安徽省','河南省','湖北省','重庆市','四川省','陕西省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省','宁夏回族自治区','甘肃省','青海省','西藏自治区','新疆维吾尔自治区'];
const polygons=g=>g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
function simplify(ring){const step=Math.max(1,Math.floor(ring.length/180));const r=ring.filter((_,i)=>i%step===0).map(p=>p.map(v=>+v.toFixed(4)));if(r.length<4)return ring;r.push(r[0]);return r;}
(async()=>{
const taiwanFile=path.join(__dirname,'assets/boundary-cache/TWN-ADM1.json');if(!fs.existsSync(taiwanFile))await require('./desktop/resources/app/boundaries.cjs')(__dirname).boundaries({iso:'TWN',level:'ADM1'});
const provinces=names.map((name,i)=>{
 const file=JSON.parse(fs.readFileSync(path.join(__dirname,'assets/provinces',name+'.json'),'utf8'));
 const cities=file.features.filter(f=>f.properties.name).map(f=>({name:f.properties.name,center:f.properties.centroid||f.properties.center,polygons:polygons(f.geometry).map(p=>p.map(simplify))}));
 const points=cities.flatMap(c=>c.polygons.flatMap(p=>p[0]));const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const bbox=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
 const centers=cities.filter(c=>c.center).map(c=>c.center),center=[0,1].map(axis=>centers.reduce((n,c)=>n+c[axis],0)/centers.length);
 const merged=clip.union(...file.features.filter(f=>polygons(f.geometry).length).map(f=>polygons(f.geometry))).map(p=>p.map(simplify));
 return {id:i+1,name,center,bbox,cities,polygons:merged};
});
// Local outline data lacks Taiwan city boundaries. Use actual city/county polygons.
// Kinmen and Matsu are not assigned to Taiwan Province in this application's China map.
const context={window:{}};require('node:vm').runInNewContext(fs.readFileSync(path.join(__dirname,'geo-names.js'),'utf8'),context);
provinces[8].cities=JSON.parse(fs.readFileSync(taiwanFile,'utf8')).features.filter(f=>!['TW-KIN','TW-LIE'].includes(f.properties.shapeISO)).map(f=>{const ps=polygons(f.geometry).map(p=>p.map(simplify)),points=ps.flatMap(p=>p[0]),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),code=f.properties.shapeISO.toLowerCase().replace('-','');return {name:context.window.ATLAS_NAMES.codes[code]?.zh||f.properties.shapeName,center:[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2],polygons:ps};});
const tp=provinces[8].cities.flatMap(c=>c.polygons.flatMap(p=>p[0]));provinces[8].bbox=[Math.min(...tp.map(p=>p[0])),Math.min(...tp.map(p=>p[1])),Math.max(...tp.map(p=>p[0])),Math.max(...tp.map(p=>p[1]))];
fs.writeFileSync(path.join(__dirname,'geography.js'),'window.ATLAS_GEO='+JSON.stringify({provinces})+';\n');
console.log('34 provinces, '+provinces.reduce((n,p)=>n+p.cities.length,0)+' city/district features');
})().catch(e=>{console.error(e);process.exitCode=1;});
