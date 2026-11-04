'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context={};context.window=context;vm.createContext(context);
for(const file of ['vendor/d3-array.min.js','vendor/d3-geo.min.js','vendor/polygon-clipping.cjs','map-geometry.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),context);
const {childrenOf,spherical}=context.ATLAS_MAP_GEOMETRY;
const square=(name,x,y,X,Y)=>({type:'Feature',properties:{name},geometry:{type:'Polygon',coordinates:[[[x,y],[X,y],[X,Y],[x,Y],[x,y]]]}});
const left=square('Left',0,0,10,10),right=square('Right',10,0,20,10),parents=[left,right];
const children=[square('Interior',1,1,2,2),square('Touches border only',10,1,11,2),square('Mostly right',9.9,3,12,5),square('Mostly left',8,6,10.1,7)];
assert.deepEqual(childrenOf(left,children,parents).map(f=>f.properties.name),['Interior','Mostly left']);
assert.deepEqual(childrenOf(right,children,parents).map(f=>f.properties.name),['Touches border only','Mostly right']);
const polar=square('Dateline state',170,-10,-170,10),island=square('Island',175,-2,178,2),other=square('Neighbor',140,-10,160,10);
assert.equal(childrenOf(polar,[island],[polar,other]).length,1);
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'assets/boundary-catalog.json'),'utf8'));
for(const row of catalog.layers){assert(/^[A-Z]{3}$/.test(row.boundaryISO));assert(/^ADM[0-5]$/.test(row.boundaryType));assert(row.boundaryLicense);assert(row.simplifiedGeometryGeoJSON||row.gjDownloadURL);}
const service=require('./desktop/resources/app/boundaries.cjs')(__dirname);
assert.equal(service.levels('FRA').at(-1).level,'ADM5');assert.equal(service.levels('USA').at(-1).level,'ADM2');assert.throws(()=>service.levels('../USA'));
(async()=>{
 await assert.rejects(service.boundaries({iso:'USA',level:'ADM6'}));await assert.rejects(service.boundaries({iso:'ZZZ',level:'ADM1'}));await assert.rejects(service.chinaChildren({province:'../test',city:'x'}));
 if(process.argv.includes('--live')){
  const samples=[['USA','North America'],['BRA','South America'],['FRA','Europe'],['JPN','Asia'],['ZAF','Africa'],['AUS','Oceania']];let cursor=0;const results=[];
  async function worker(){while(cursor<samples.length){const [iso,continent]=samples[cursor++],layers=service.levels(iso);const [first,second]=await Promise.all(['ADM1','ADM2'].map(level=>service.boundaries({iso,level})));const parents=first.features.map(spherical);let checked=0;
   for(const parent of parents.slice(0,3)){const selected=childrenOf(parent,second.features,parents);assert(selected.length>0,iso+' '+JSON.stringify(parent.properties)+' missing children');checked+=selected.length;}
   const result={iso,continent,levels:layers.map(x=>x.level),first:first.features.length,second:second.features.length,checked};results.push(result);console.log(JSON.stringify(result));
  }}await Promise.all([worker(),worker()]);
  const china=await service.chinaChildren({province:'河北省',city:'石家庄市'});assert(china.features.length>1);assert(china.features.every(f=>f.properties.parent.adcode===130100));assert.equal(await service.chinaChildren({province:'北京市',city:'东城区'}),null);
  fs.writeFileSync(path.join(__dirname,'qa/admin-audit.json'),JSON.stringify({catalogCountries:new Set(catalog.layers.map(x=>x.boundaryISO)).size,layers:catalog.layers.length,results,chinaDistricts:china.features.length},null,2));
 }
 console.log('PASS: greatest-overlap ownership, shared-border exclusion, dateline, catalog and request validation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
