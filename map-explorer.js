(()=>{
'use strict';
const ui=window.earthUI,NS='http://www.w3.org/2000/svg',provinces=window.ATLAS_GEO.provinces;
const main=document.createElement('main');main.id='exploreView';main.hidden=true;
main.innerHTML='<header class="atlas-bar"><button id="geoBack">返回上一级</button><div><small id="geoCrumb"></small><h1 id="geoTitle"></h1></div><button id="geoHome">地球全景</button></header><div id="geoWrap"><svg id="geoMap" viewBox="0 0 1100 680"></svg></div><p id="geoHint">点击地域或向前滚动进入；向后滚动返回。灰色仅表示课程未完成，不限制浏览。</p>';
document.body.append(main);
const $=id=>document.getElementById(id),stack=[];let countries=[],loading=false,zoom=1,hover=null,gate=0,request=0,frame=0,box=[0,0,1100,680];
const continents={'Asia':'亚洲','Europe':'欧洲','Africa':'非洲','North America':'北美洲','South America':'南美洲','Oceania':'大洋洲','Antarctica':'南极洲'};
const polygons=f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
function inside([x,y],ring){let b=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [a,c]=ring[i],[d,e]=ring[j];if((c>y)!==(e>y)&&x<(d-a)*(y-c)/(e-c)+a)b=!b;}return b;}
const contains=(f,p)=>polygons(f).some(poly=>inside(p,poly[0])&&!poly.slice(1).some(r=>inside(p,r)));
function feature(name,polys,extra={}){return {type:'Feature',properties:{name,...extra},geometry:{type:'MultiPolygon',coordinates:polys}};}
const name=f=>f.properties.ADM0_A3==='CHN'?'中国':f.properties.name||f.properties.NAME_ZH||f.properties.shapeName||f.properties.ADMIN||'区域';
function bounds(features){let x=180,y=90,X=-180,Y=-90;for(const f of features)for(const p of polygons(f))for(const r of p)for(const [a,b] of r){x=Math.min(x,a);X=Math.max(X,a);y=Math.min(y,b);Y=Math.max(Y,b);}return [x,y,X,Y];}
function render(){const s=stack.at(-1);if(!s)return;cancelAnimationFrame(frame);zoom=1;hover=null;box=[0,0,1100,680];$('geoMap').setAttribute('viewBox',box.join(' '));$('geoMap').replaceChildren();$('geoTitle').textContent=s.title;$('geoCrumb').textContent='地球 / '+stack.map(x=>x.title).join(' / ');const [x,y,X,Y]=bounds(s.features),k=Math.min(980/Math.max(.01,X-x),560/Math.max(.01,Y-y));const project=([a,b])=>[550+(a-(x+X)/2)*k,340-(b-(y+Y)/2)*k];
 const area=f=>{const b=bounds([f]);return (b[2]-b[0])*(b[3]-b[1]);};s.features.sort((a,b)=>area(b)-area(a));
 for(const f of s.features){const path=document.createElementNS(NS,'path');path.setAttribute('d',polygons(f).map(p=>p.map(r=>r.map((v,i)=>(i?'L':'M')+project(v).join(',')).join(' ')+'Z').join(' ')).join(' '));path.setAttribute('fill-rule','evenodd');path.setAttribute('class','map-area');path.setAttribute('tabindex','0');path.setAttribute('aria-label',name(f));const title=document.createElementNS(NS,'title');title.textContent=name(f);path.append(title);path.onpointerenter=()=>{hover=f;$('geoHint').textContent=name(f)+' · 点击或滚轮放大进入；向后滚动返回';};path.onclick=()=>enter(f).catch(error);path.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();enter(f).catch(error);}};$('geoMap').append(path);
 const b=bounds([f]),w=(b[2]-b[0])*k,h=(b[3]-b[1])*k;if(w>55&&h>24&&s.features.length<80){const label=document.createElementNS(NS,'text'),p=project([(b[0]+b[2])/2,(b[1]+b[3])/2]);label.setAttribute('x',p[0]);label.setAttribute('y',p[1]);label.setAttribute('class','map-label');label.textContent=name(f);$('geoMap').append(label);}
 }
 $('geoHint').textContent=s.level==='city'?'已到市／区层级。继续滚轮放大查看边界，向后缩小返回。':'点击地域或滚轮放大进入；向后缩小返回。灰色地区同样可以浏览。';
}
function error(e){loading=false;$('geoHint').textContent='此级地图数据暂时无法载入（不是学习限制）：'+e.message+'。可返回或稍后重试。';}
async function push(s){stack.push(s);await ui.view('exploreView');render();}
async function enter(f){if(loading)return;const s=stack.at(-1);if(!s||s.level==='city')return;
 if(s.level==='continent'){const iso=f.properties.ADM0_A3==='CHN'?'CHN':f.properties.ISO_A3_EH||f.properties.ADM0_A3;if(iso==='CHN'){await push({level:'country',title:'中国',iso,features:provinces.map(p=>feature(p.name,p.polygons,{province:p}))});return;}
 loading=true;const token=++request;$('geoHint').textContent='正在读取 '+name(f)+' 的省／州边界，首次需要联网，之后缓存到 D 盘…';try{const data=await window.atlas.boundaries({iso,level:'ADM1'});if(token!==request)return;await push({level:'country',title:name(f),iso,features:data.features});}finally{loading=false;}return;}
 if(s.level==='country'){if(s.iso==='CHN'){const p=f.properties.province,features=p.cities.filter(c=>c.polygons.length).map(c=>feature(c.name,c.polygons));if(!features.length){ui.notify('此省当前数据未提供市区边界，保留省级浏览。');return;}await push({level:'province',title:p.name,iso:s.iso,features});return;}
 loading=true;const token=++request;$('geoHint').textContent='正在读取市／区边界…';try{const data=await window.atlas.boundaries({iso:s.iso,level:'ADM2'});if(token!==request)return;const selected=data.features.filter(c=>polygons(c).some(p=>p[0].some(v=>contains(f,v))));if(!selected.length)throw Error('数据源没有可对应的市区边界');await push({level:'province',title:name(f),iso:s.iso,features:selected});}finally{loading=false;}return;}
 await push({level:'city',title:name(f),iso:s.iso,features:[f]});
}
async function back(){request++;loading=false;if(stack.length>1){stack.pop();render();}else{stack.length=0;await ui.view('spaceView');}}
async function open(lon,lat){await ready;const f=countries.find(f=>contains(f,[lon,lat]));if(!f){ui.notify('这里是海洋。点击陆地可以进入所属洲。');return;}request++;stack.length=0;const c=f.properties.CONTINENT;await push({level:'continent',title:continents[c]||c,features:countries.filter(x=>x.properties.CONTINENT===c)});}
const ready=fetch('assets/countries.geojson').then(r=>{if(!r.ok)throw Error('世界地图未安装');return r.json();}).then(d=>countries=d.features);
ready.catch(error);$('geoBack').onclick=()=>back().catch(error);$('geoHome').onclick=()=>{request++;loading=false;stack.length=0;ui.view('spaceView').catch(error);};
 function animateBox(){const svg=$('geoMap'),v=svg.viewBox.baseVal,values=[v.x,v.y,v.width,v.height].map((n,i)=>n+(box[i]-n)*.3);svg.setAttribute('viewBox',values.join(' '));if(values.some((n,i)=>Math.abs(n-box[i])>.1))frame=requestAnimationFrame(animateBox);else svg.setAttribute('viewBox',box.join(' '));}
 $('geoWrap').addEventListener('wheel',e=>{
  e.preventDefault();if(loading||performance.now()<gate)return;const s=stack.at(-1);if(!s)return;
  const svg=$('geoMap'),p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse()),paths=[...svg.querySelectorAll('path')];
  const direct=paths.indexOf(e.target.closest('path')),hit=direct>=0?direct:paths.findLastIndex(path=>path.isPointInFill(p));const chosen=hit>=0?s.features[hit]:hover;
  const old=zoom,delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);zoom=Math.max(.65,Math.min(5,zoom*Math.exp(-delta*.003)));
  const ratio=old/zoom;box=[p.x-(p.x-box[0])*ratio,p.y-(p.y-box[1])*ratio,1100/zoom,680/zoom];cancelAnimationFrame(frame);frame=requestAnimationFrame(animateBox);
  if(zoom<.78){gate=performance.now()+450;back().catch(error);}
  else if(zoom>1.6&&s.level!=='city'){
   if(!chosen){$('geoHint').textContent='把鼠标移到想深入的陆地区域，再向前滚动。';return;}
   gate=performance.now()+450;enter(chosen).catch(error);
  }
 },{passive:false});
 async function openChina(provinceId){await open(105,35);await enter(countries.find(f=>f.properties.ADM0_A3==='CHN'));if(provinceId){const f=stack.at(-1).features.find(f=>f.properties.province.id===provinceId);if(f)await enter(f);}}
 let legacyDelta=0;
 $('flatMapWrap').addEventListener('wheel',e=>{
  e.preventDefault();if(loading||performance.now()<gate)return;legacyDelta+=e.deltaY*(e.deltaMode===1?16:1);if(Math.abs(legacyDelta)<100)return;
  const inward=legacyDelta<0;legacyDelta=0;gate=performance.now()+500;const context=ui.mapContext(),target=e.target.closest('[data-province]')?.dataset.province;
  if(context.province){openChina(inward?context.province:null).catch(error);}
  else if(inward){openChina(Number(target)||Math.min(ui.nextId(),34)).catch(error);}
  else{open(105,35).catch(error);}
 },{passive:false});
 window.atlasExplorer={open,openChina,back,state:()=>({level:stack.at(-1)?.level,title:stack.at(-1)?.title,count:stack.at(-1)?.features.length,zoom})};
})();
