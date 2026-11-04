'use strict';
// Geometry must never occupy the UI thread: large boundaries can take seconds to clip.
self.window=self;
importScripts('vendor/d3-array.min.js','vendor/d3-geo.min.js','vendor/polygon-clipping.js','map-geometry.js');
const sets=new Map(),files=new Map(),polygons=f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
async function load(url){if(!files.has(url)){if(files.size>=8)files.delete(files.keys().next().value);files.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('边界文件读取失败');return r.json();}).then(data=>{if(data.type!=='FeatureCollection'||!data.features?.length)throw Error('边界文件无有效区域');return data;}).catch(e=>{files.delete(url);throw e;}));}return files.get(url);}
self.onmessage=async({data:{id,type,json}})=>{
 try{
  const payload=JSON.parse(json);let result;
  if(type==='children'){
   if(payload.parents){const data=await load(payload.fileURL);sets.set(payload.key,{parents:payload.parents,children:data.features,source:data.source});if(sets.size>8)sets.delete(sets.keys().next().value);}
   const set=sets.get(payload.key);if(!set){self.postMessage({id,missing:true});return;}
   result={features:ATLAS_MAP_GEOMETRY.childrenOf(set.parents[payload.index],set.children,set.parents),source:set.source};
  }else if(type==='layout'){
   const data=payload.fileURL?await load(payload.fileURL):null,features=(data?data.features:payload.features).filter(f=>!payload.excludeCodes?.includes(f.properties.shapeISO)),layout=ATLAS_MAP_GEOMETRY.layout(features,payload.continent),path=layout.path;
   const entries=layout.features.map(f=>{let largest=null,largestArea=-1;for(const p of polygons(f)){const area=d3.geoArea({type:'Polygon',coordinates:p});if(area>largestArea){largestArea=area;largest=p;}}
    const center=layout.projection(d3.geoCentroid({type:'Polygon',coordinates:largest}));return {f,area:path.area(f),d:path(f)||'',bounds:path.bounds(f),center};
   }).sort((a,b)=>b.area-a.area);
   result={features:entries.map(x=>x.f),items:entries.map(({f,...item})=>item),source:data?.source};
  }else throw Error('未知地图计算');
  self.postMessage({id,json:JSON.stringify(result)});
 }catch(e){self.postMessage({id,error:e.message});}
};
