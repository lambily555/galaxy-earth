'use strict';
const fs=require('node:fs'),path=require('node:path');
module.exports=function(root){
 const folder=path.join(root,'assets','boundary-cache'),pending=new Map();
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets','boundary-catalog.json'),'utf8'));
 fs.mkdirSync(folder,{recursive:true});
 const valid=data=>data?.type==='FeatureCollection'&&Array.isArray(data.features)&&data.features.length&&data.features.every(f=>['Polygon','MultiPolygon'].includes(f.geometry?.type)&&Array.isArray(f.geometry.coordinates)&&f.geometry.coordinates.length);
 async function get(url,alternatives=[]){
  const github=url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/([^/]+)\/(.+)$/);if(github&&!alternatives.length)alternatives=['https://media.githubusercontent.com/media/'+github.slice(1).join('/')];
  let last;for(const target of [url,...alternatives,url]){try{const r=await fetch(target,{signal:AbortSignal.timeout(20000),headers:new URL(target).hostname==='api.github.com'?{Accept:'application/vnd.github.raw+json'}:{}});if(!r.ok){const e=Error('地图服务返回 HTTP '+r.status);e.status=r.status;throw e;}return await r.json();}catch(e){last=e;if(e.status&&e.status<500&&!alternatives.length)break;}}
  throw last;
 }
 async function cached(key,load){
  const file=path.join(folder,key+'.json');if(fs.existsSync(file)){try{const data=JSON.parse(fs.readFileSync(file,'utf8'));if(valid(data))return data;}catch{}}
  if(pending.has(key))return pending.get(key);
  const job=(async()=>{const data=await load();if(!valid(data))throw Error('此级没有可显示的行政区边界');const temp=file+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify(data));fs.renameSync(temp,file);return data;})();
  pending.set(key,job);try{return await job;}finally{pending.delete(key);}
 }
 function levels(iso){if(typeof iso!=='string'||!/^[A-Z]{3}$/.test(iso))throw Error('无效国家代码');return catalog.layers.filter(x=>x.boundaryISO===iso&&x.boundaryType!=='ADM0').map(x=>({level:x.boundaryType,name:x.boundaryCanonical||x.boundaryType,count:Number(x.admUnitCount),year:x.boundaryYearRepresented}));}
 async function boundaries(p){
  if(!p||typeof p.iso!=='string'||!/^[A-Z]{3}$/.test(p.iso)||!/^ADM[1-5]$/.test(p.level))throw Error('无效地图请求');
  const metadata=catalog.layers.find(x=>x.boundaryISO===p.iso&&x.boundaryType===p.level);if(!metadata)throw Error('公开数据源尚未提供该国家的 '+p.level+' 边界');
  return cached(p.iso+'-'+p.level,async()=>{
   const url=metadata.simplifiedGeometryGeoJSON||metadata.gjDownloadURL;
   if(!url||new URL(url).protocol!=='https:'||!['www.geoboundaries.org','raw.githubusercontent.com','github.com','media.githubusercontent.com'].includes(new URL(url).hostname))throw Error('无效边界来源');
   const data=await get(url);data.source={provider:catalog.provider,url,license:metadata.boundaryLicense,licenseSource:metadata.licenseSource,source:metadata.boundarySource,version:metadata.boundaryID,year:metadata.boundaryYearRepresented,level:p.level,canonical:metadata.boundaryCanonical};return data;
  });
 }
 async function chinaChildren(p){
  if(!p||typeof p.province!=='string'||!p.province||/[\\/]/.test(p.province)||p.province.length>80||typeof p.city!=='string')throw Error('无效中国行政区请求');
  const file=path.join(root,'assets','provinces',p.province+'.json');if(!fs.existsSync(file))throw Error('未找到省级数据');
  const city=JSON.parse(fs.readFileSync(file,'utf8')).features.find(f=>f.properties.name===p.city);if(!city)throw Error('该市区不属于当前省');
  if(city.properties.level!=='city'||!city.properties.childrenNum)return null;
  return cached('CHN-'+city.properties.adcode,async()=>{
   const url='https://raw.githubusercontent.com/zhChuXiao/ChinaGeoJson/master/citys/'+encodeURIComponent(p.city)+'.json',api='https://api.github.com/repos/zhChuXiao/ChinaGeoJson/contents/citys/'+encodeURIComponent(p.city)+'.json',mirror='https://cdn.jsdelivr.net/gh/zhChuXiao/ChinaGeoJson@master/citys/'+encodeURIComponent(p.city)+'.json',data=await get(url,[api,mirror]);
   data.features=data.features.filter(f=>String(f.properties.parent?.adcode)===String(city.properties.adcode)&&String(f.properties.adcode)!==String(city.properties.adcode));
   data.source={provider:'ChinaGeoJson',url,license:'MIT',licenseSource:'https://github.com/zhChuXiao/ChinaGeoJson/blob/master/LICENSE'};return data;
  });
 }
 return {levels,boundaries,chinaChildren};
};
