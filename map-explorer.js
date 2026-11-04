(()=>{
'use strict';
const ui=window.earthUI,NS='http://www.w3.org/2000/svg',provinces=window.ATLAS_GEO.provinces;
const main=document.createElement('main');main.id='exploreView';main.hidden=true;
main.innerHTML='<header class="atlas-bar"><button id="geoBack">返回上一级</button><div><small id="geoCrumb"></small><h1 id="geoTitle"></h1></div><button id="geoHome">地球全景</button></header><div id="geoWrap"><svg id="geoMap" viewBox="0 0 1100 680"></svg></div><p id="geoHint">点击地域或向前滚动进入；向后滚动返回。灰色仅表示课程未完成，不限制浏览。</p>';
document.body.append(main);
const status=document.createElement('div');status.id='geoStatus';status.hidden=true;status.setAttribute('role','status');status.innerHTML='<span id="geoStatusText"></span><button id="geoRetry" hidden>重试</button><button id="geoCancel">取消等待</button>';main.querySelector('#geoWrap').prepend(status);
const $=id=>document.getElementById(id),stack=[];let countries=[],continentMaps={},loading=false,zoom=1,hover=null,gate=0,request=0,frame=0,box=[0,0,1100,680];
let retryAction=null;
function clearStatus(){status.hidden=true;main.setAttribute('aria-busy','false');retryAction=null;}
function beginLoading(message,f){loading=true;retryAction=()=>enter(f).catch(error);status.hidden=false;status.dataset.state='loading';$('geoStatusText').textContent=message;$('geoRetry').hidden=true;$('geoCancel').textContent='取消等待';main.setAttribute('aria-busy','true');$('geoHint').textContent=message;}
$('geoRetry').onclick=()=>retryAction?.();$('geoCancel').onclick=()=>{request++;loading=false;clearStatus();$('geoHint').textContent='已取消等待，可以重新选择地域。';};
const boundaryData=new Map();function getBoundary(iso,level){const key=iso+'-'+level;if(!boundaryData.has(key))boundaryData.set(key,window.atlas.boundaries({iso,level}).catch(e=>{boundaryData.delete(key);throw e;}));return boundaryData.get(key);}
const continents={'Asia':'亚洲','Europe':'欧洲','Africa':'非洲','North America':'北美洲','South America':'南美洲','Oceania':'大洋洲','Antarctica':'南极洲'};
const chooser=document.createElement('select');chooser.id='continentChoice';chooser.setAttribute('aria-label','选择大洲');for(const [key,title] of Object.entries(continents)){const option=document.createElement('option');option.value=key;option.textContent=title;chooser.append(option);}main.querySelector('.atlas-bar').insertBefore(chooser,$('geoHome'));chooser.onchange=()=>openContinent(chooser.value).catch(error);
const continentMenu=document.createElement('section');continentMenu.id='continentMenu';const heading=document.createElement('h2');heading.textContent='探索七大洲';continentMenu.append(heading);for(const [key,title] of Object.entries(continents)){const button=document.createElement('button');button.textContent=title;button.dataset.continent=key;button.onclick=()=>openContinent(key).catch(error);continentMenu.append(button);}document.getElementById('spaceMenu').insertBefore(continentMenu,document.getElementById('daily'));
const regionChoice=document.createElement('select');regionChoice.id='regionChoice';regionChoice.setAttribute('aria-label','选择当前地图内的国家或行政区');main.querySelector('.atlas-bar').insertBefore(regionChoice,$('geoHome'));regionChoice.onchange=()=>{const f=stack.at(-1)?.features[Number(regionChoice.value)];if(regionChoice.value!==''&&f)enter(f).catch(error);};
const polygons=f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
function feature(name,polys,extra={}){return {type:'Feature',properties:{name,...extra},geometry:{type:'MultiPolygon',coordinates:polys}};}
const name=f=>f.properties.ADM0_A3==='CHN'?'中国':f.properties.name||f.properties.NAME_ZH||f.properties.shapeName||f.properties.ADMIN||'区域';
function render(){
 const s=stack.at(-1);if(!s)return;clearStatus();cancelAnimationFrame(frame);zoom=1;hover=null;box=[0,0,1100,680];
 const map=$('geoMap');map.setAttribute('viewBox',box.join(' '));map.replaceChildren();$('geoTitle').textContent=s.title;$('geoCrumb').textContent='地球 / '+stack.map(x=>x.title).join(' / ');
 const layout=window.ATLAS_MAP_GEOMETRY.layout(s.features,s.continent),pathFor=layout.path;
 s.features=layout.features.sort((a,b)=>pathFor.area(b)-pathFor.area(a));const labels=[],occupied=[];
 regionChoice.replaceChildren(new Option('选择地域（'+s.features.length+'）',''));s.features.map((f,index)=>({f,index})).sort((a,b)=>name(a.f).localeCompare(name(b.f),'zh-CN')).forEach(({f,index})=>regionChoice.add(new Option(name(f),String(index))));regionChoice.disabled=s.level==='city';
 for(const f of s.features){
  const path=document.createElementNS(NS,'path');path.setAttribute('d',pathFor(f)||'');path.setAttribute('fill-rule','evenodd');path.setAttribute('class','map-area');path.setAttribute('tabindex','0');path.setAttribute('aria-label',name(f));if(f.properties.ADM0_A3)path.dataset.iso=f.properties.ADM0_A3;
  const title=document.createElementNS(NS,'title');title.textContent=name(f);path.append(title);
  const select=()=>enter(f).catch(error),hoverFeature=()=>{hover=f;$('geoHint').textContent=name(f)+' · 点击或滚轮放大进入；向后滚动返回';};
  path.onpointerenter=hoverFeature;path.onclick=select;path.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();select();}};map.append(path);
  const parts=polygons(f),largest=parts.reduce((a,p)=>window.d3.geoArea({type:'Polygon',coordinates:p})>window.d3.geoArea({type:'Polygon',coordinates:a})?p:a,parts[0]);
  const center=layout.projection(window.d3.geoCentroid({type:'Polygon',coordinates:largest})),b=pathFor.bounds(f),w=b[1][0]-b[0][0],h=b[1][1]-b[0][1];
  if(!center?.every(Number.isFinite))continue;
  if(pathFor.area(f)<12){const dot=document.createElementNS(NS,'circle');dot.setAttribute('cx',center[0]);dot.setAttribute('cy',center[1]);dot.setAttribute('r',3);dot.setAttribute('class','island-marker');dot.setAttribute('aria-label',name(f));dot.onpointerenter=hoverFeature;dot.onclick=select;const t=document.createElementNS(NS,'title');t.textContent=name(f);dot.append(t);labels.push(dot);}
  if(w>48&&h>23&&s.features.length<100&&path.isPointInFill(new DOMPoint(...center))){
   const width=name(f).length*12,rect=[center[0]-width/2,center[1]-10,center[0]+width/2,center[1]+5];
   if(occupied.some(a=>rect[0]<a[2]+4&&rect[2]>a[0]-4&&rect[1]<a[3]+4&&rect[3]>a[1]-4))continue;
   occupied.push(rect);const label=document.createElementNS(NS,'text');label.setAttribute('x',center[0]);label.setAttribute('y',center[1]);label.setAttribute('class','map-label');label.textContent=name(f);labels.push(label);
  }
 }
 map.append(...labels);
 $('geoHint').textContent=s.hint||(s.level==='city'?'已到此数据源提供的最细层级。可继续放大查看边界，缩小返回。':'点击地域、选择地域或滚轮放大进入；向后缩小返回。灰色地区同样可以浏览。')+(s.source?' 数据：'+s.source.provider+' · '+(s.source.canonical||s.source.level||'')+' · '+(s.source.year||'')+' · '+s.source.license:'');
}
function error(e){loading=false;const message='此级地图暂时无法载入：'+e.message+'。这不是学习限制。';$('geoHint').textContent=message;status.hidden=false;status.dataset.state='error';$('geoStatusText').textContent=message;$('geoRetry').hidden=!retryAction;$('geoCancel').textContent='收起';main.setAttribute('aria-busy','false');}
async function push(s){stack.push(s);await ui.view('exploreView');render();}
async function enter(f){if(loading)return;const s=stack.at(-1);if(!s||s.level==='city')return;
 if(s.continent==='Antarctica'){await push({level:'city',title:'南极洲大陆',continent:'Antarctica',features:[f]});$('geoHint').textContent='南极洲没有这里所用的国家、省、市行政层级；可滚轮放大查看大陆轮廓，缩小返回。';return;}
 if(s.level==='continent'){const iso=({KOS:'XKX',SDS:'SSD',SAH:'ESH',PSX:'PSE',ALD:'ALA'}[f.properties.ADM0_A3])||[f.properties.ADM0_A3,f.properties.ISO_A3_EH].find(x=>/^[A-Z]{3}$/.test(x));if(iso==='CHN'){await push({level:'country',title:'中国',iso,features:provinces.map(p=>feature(p.name,p.polygons,{province:p}))});return;}
 if(iso==='HKG'||iso==='MAC'){const p=provinces.find(p=>p.name===(iso==='HKG'?'香港特别行政区':'澳门特别行政区'));await push({level:'province',title:p.name,iso:'CHN',features:p.cities.filter(c=>c.polygons.length).map(c=>feature(c.name,c.polygons))});return;}
 beginLoading('正在读取 '+name(f)+' 的省／州边界，请稍候；首次需要联网，之后缓存到 D 盘。',f);const token=++request;try{
  if(!window.geographyData?.levels)throw Error('当前窗口仍是旧版主程序，请保存学习内容后重新打开软件一次');
  const levels=iso?await window.geographyData.levels(iso):[];if(token!==request)return;
  if(!levels.length){await push({level:'city',title:name(f),iso,features:[countries.find(c=>c.properties.ADM0_A3===f.properties.ADM0_A3)||f],hint:'公开数据目录暂未提供此国家／地区的下级边界；保留完整轮廓，不虚构省市。'});return;}
  const next=levels[0],data=await getBoundary(iso,next.level);if(token!==request)return;await push({level:'country',title:name(f),iso,adm:Number(next.level.slice(3)),levels,features:data.features,source:data.source});
 }catch(e){if(token===request)throw e;}finally{if(token===request)loading=false;}return;}
 if(s.level==='country'){if(s.iso==='CHN'){const p=f.properties.province,features=p.cities.filter(c=>c.polygons.length).map(c=>feature(c.name,c.polygons));if(!features.length){ui.notify('此省当前数据未提供市区边界，保留省级浏览。');return;}await push({level:'province',title:p.name,iso:s.iso,features});return;}
 }
 if(s.iso==='CHN'){
  beginLoading('正在读取 '+name(f)+' 的区／县边界…',f);const token=++request;try{const province=s.chinaProvince||s.title,data=s.level==='province'?await window.geographyData.chinaChildren({province,city:name(f)}):null;if(token!==request)return;
   if(data)await push({level:'district',title:name(f),iso:s.iso,chinaProvince:province,features:data.features,source:data.source});
   else await push({level:'city',title:name(f),iso:s.iso,features:[f],source:s.source});
  }catch(e){if(token===request)throw e;}finally{if(token===request)loading=false;}return;
 }
 const next=s.levels?.find(x=>Number(x.level.slice(3))>s.adm);if(!next){await push({level:'city',title:name(f),iso:s.iso,features:[f],source:s.source});return;}
 beginLoading('正在读取 '+name(f)+' 的下一级边界（'+next.level+' / '+next.name+'）…',f);const token=++request;try{
  const data=await getBoundary(s.iso,next.level);if(token!==request)return;
  const selected=window.ATLAS_MAP_GEOMETRY.childrenOf(f,data.features,s.features);if(!selected.length)throw Error('该上级区域没有可对应的下级边界，可能是不同年份数据不一致');
  await push({level:next.level==='ADM2'?'province':'district',title:name(f),iso:s.iso,adm:Number(next.level.slice(3)),levels:s.levels,features:selected,source:data.source});
 }catch(e){if(token===request)throw e;}finally{if(token===request)loading=false;}
}
async function back(){request++;loading=false;if(stack.length>1){stack.pop();render();}else{stack.length=0;await ui.view('spaceView');}}
async function openContinent(c){await ready;if(!continents[c])throw Error('未知大洲');request++;loading=false;stack.length=0;chooser.value=c;await push({level:'continent',continent:c,title:continents[c],features:continentMaps[c]});if(c==='Antarctica')$('geoHint').textContent='南极洲大陆：可点击或滚轮放大浏览，不设国家、省、市层级。';}
async function open(lon,lat){await ready;const c=Object.keys(continents).find(c=>continentMaps[c].some(f=>window.d3.geoContains(f,[lon,lat])));if(!c){ui.notify('这里是海洋。点击陆地可以进入所属洲，或按 Tab 在菜单选择七大洲。');return;}await openContinent(c);}
const ready=Promise.all(['assets/countries.geojson','assets/continents.geojson'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('世界地图未安装');return r.json();}))).then(([data,regions])=>{countries=data.features;continentMaps=window.ATLAS_MAP_GEOMETRY.continentalMaps(countries,regions.features);});
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
 window.atlasExplorer={open,openContinent,openChina,back,state:()=>({level:stack.at(-1)?.level,title:stack.at(-1)?.title,count:stack.at(-1)?.features.length,adm:stack.at(-1)?.adm,iso:stack.at(-1)?.iso,loading,zoom})};
})();
