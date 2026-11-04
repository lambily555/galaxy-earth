(()=>{
'use strict';
const d3=window.d3,clip=window.polygonClipping;
const centers={Asia:[100,40],Europe:[20,55],Africa:[20,0],'North America':[-100,40],'South America':[-60,-20],Oceania:[165,-20],Antarctica:[0,-90]};
const polygons=f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
function spherical(f){return {...f,geometry:{type:'MultiPolygon',coordinates:polygons(f).map(p=>{const single={type:'Polygon',coordinates:p};return d3.geoArea(single)>Math.PI*2?p.map(r=>[...r].reverse()):p;})}};}
function continentalMaps(countries,regions){
 const maps=Object.fromEntries(Object.keys(centers).map(c=>[c,[]]));
 const europe=regions.filter(f=>f.properties.FEATURECLA==='Continent'&&f.properties.REGION==='Europe').flatMap(polygons);
 for(const f of countries){
  const source=f.properties.CONTINENT,id=f.properties.ADM0_A3;
  if(['RUS','TUR','KAZ','GEO','AZE'].includes(id)){
   const eu=clip.intersection(polygons(f),europe),asia=clip.difference(polygons(f),europe);
   for(const [continent,parts] of [['Europe',eu],['Asia',asia]])if(parts.length)maps[continent].push(spherical({...f,geometry:{type:'MultiPolygon',coordinates:parts}}));
   continue;
  }
  const groups={};
  for(const p of polygons(f)){
   const piece=spherical({...f,geometry:{type:'Polygon',coordinates:p}}),[lon,lat]=d3.geoCentroid(piece);let continent=source;
   // Keep distant overseas pieces in the geographic view where they lie.
   if(source==='Europe'&&lat<25){
    if(lon>=-100&&lon<-25)continent=lat>=12?'North America':'South America';
    else if(lon>=-25&&lon<100)continent=lat<-60?'Antarctica':'Africa';
    else continent='Oceania';
   }
   if(source==='Seven seas (open ocean)')continent=lat<-60?'Antarctica':lon>=100||lon<-100?'Oceania':lon<-25?(lat>=12?'North America':'South America'):'Africa';
   if(maps[continent])(groups[continent]??=[]).push(p);
  }
  for(const [continent,parts] of Object.entries(groups))maps[continent].push(spherical({...f,geometry:{type:'MultiPolygon',coordinates:parts}}));
 }
 return maps;
}
function layout(features,continent){
 const data={type:'FeatureCollection',features:features.map(spherical)},center=centers[continent]||d3.geoCentroid(data);
 const projection=d3.geoAzimuthalEqualArea().rotate([-center[0],-center[1]]).precision(.2);
 projection.fitExtent([[60,50],[1040,630]],data);
 return {projection,path:d3.geoPath(projection),features:data.features};
}
function childrenOf(parent,children,parents){
 // A shared border is not membership. Assign each child to its greatest-area overlap.
 const anchor=d3.geoCentroid(spherical(parent))[0];
 const prepare=f=>{const coordinates=polygons(f).map(p=>p.map(r=>r.map(([lon,lat])=>[Math.round((anchor+((lon-anchor+540)%360)-180)*1e6)/1e6,Math.round(lat*1e6)/1e6])));let x=Infinity,y=Infinity,X=-Infinity,Y=-Infinity;for(const p of coordinates)for(const r of p)for(const [a,b] of r){x=Math.min(x,a);X=Math.max(X,a);y=Math.min(y,b);Y=Math.max(Y,b);}return {coordinates,bounds:[x,y,X,Y]};};
 const intersection=(a,b)=>{try{return clip.intersection(a,b);}catch{const snap=p=>p.map(p=>p.map(r=>r.map(v=>v.map(n=>Math.round(n*1e5)/1e5))));return clip.intersection(snap(a),snap(b));}};
 const area=coordinates=>coordinates.reduce((sum,p)=>sum+p.reduce((value,r,i)=>{let a=0;for(let j=1;j<r.length;j++)a+=r[j-1][0]*r[j][1]-r[j][0]*r[j-1][1];return value+(i?-1:1)*Math.abs(a/2);},0),0);
 const prepared=parents.map(prepare),index=parents.indexOf(parent);if(index<0)throw Error('未找到上级行政区');
 const overlap=(c,p)=>{const a=c.bounds,b=p.bounds;return a[2]<=b[0]||a[0]>=b[2]||a[3]<=b[1]||a[1]>=b[3]?0:area(intersection(c.coordinates,p.coordinates));};
 return children.filter(child=>{const c=prepare(child),selected=overlap(c,prepared[index]);if(selected<=0)return false;for(let i=0;i<prepared.length;i++){if(i===index)continue;const other=overlap(c,prepared[i]);if(other>selected||(other===selected&&i<index))return false;}return true;});
}
window.ATLAS_MAP_GEOMETRY={continentalMaps,layout,spherical,childrenOf};
})();
