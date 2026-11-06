(()=>{
'use strict';
const ui=window.earthUI,NS='http://www.w3.org/2000/svg',provinces=window.ATLAS_GEO.provinces;
const main=document.createElement('main');main.id='exploreView';main.hidden=true;
main.innerHTML='<header class="atlas-bar"><button id="geoBack">返回上一级</button><div><small id="geoCrumb"></small><h1 id="geoTitle"></h1></div><button id="geoHome">地球全景</button></header><div id="geoWrap"><svg id="geoMap" viewBox="0 0 1100 680"></svg></div><p id="geoHint">点击地域或向前滚动进入；向后滚动返回。灰色仅表示课程未完成，不限制浏览。</p>';
document.body.append(main);
const status=document.createElement('div');status.id='geoStatus';status.hidden=true;status.setAttribute('role','status');status.innerHTML='<span id="geoStatusText"></span><button id="geoRetry" hidden>重试</button><button id="geoCancel">取消等待</button>';main.querySelector('#geoWrap').prepend(status);
const $=id=>document.getElementById(id),stack=[];let countries=[],continentMaps={},loading=false,zoom=1,hover=null,gate=0,request=0,frame=0,box=[0,0,1100,680];
let geometryWorker=null,geometryId=0,rendering=false,renderVersion=0;const geometryJobs=new Map(),workerSets=new Set();
function geometry(type,payload){if(!geometryWorker){geometryWorker=new Worker('map-worker.js');geometryWorker.onmessage=({data})=>{const job=geometryJobs.get(data.id);if(!job)return;geometryJobs.delete(data.id);data.error?job.reject(Error(data.error)):job.resolve(data.missing?null:JSON.parse(data.json));};geometryWorker.onerror=e=>{for(const job of geometryJobs.values())job.reject(Error(e.message||'地图计算失败'));geometryJobs.clear();geometryWorker.terminate();geometryWorker=null;workerSets.clear();};}return new Promise((resolve,reject)=>{const id=++geometryId;geometryJobs.set(id,{resolve,reject});geometryWorker.postMessage({id,type,json:JSON.stringify(payload)});});}
function cancelGeometry(){renderVersion++;rendering=false;if(geometryWorker){geometryWorker.terminate();geometryWorker=null;}workerSets.clear();for(const job of geometryJobs.values()){const e=Error('地图计算已取消');e.name='AbortError';job.reject(e);}geometryJobs.clear();}
async function childrenOf(parent,fileURL,parents,key){const index=parents.indexOf(parent),send=()=>geometry('children',{key,index,parents,fileURL});let selected=workerSets.has(key)?await geometry('children',{key,index}):await send();if(selected===null)selected=await send();workerSets.add(key);return selected;}
let retryAction=null;
function clearStatus(){status.hidden=true;main.setAttribute('aria-busy','false');retryAction=null;}
function beginLoading(message,f){loading=true;retryAction=()=>enter(f).catch(error);status.hidden=false;status.dataset.state='loading';$('geoStatusText').textContent=message;$('geoRetry').hidden=true;$('geoCancel').textContent='取消等待';main.setAttribute('aria-busy','true');$('geoHint').textContent=message;}
$('geoRetry').onclick=()=>retryAction?.();$('geoCancel').onclick=()=>{if(rendering){back().catch(error);return;}request++;loading=false;cancelGeometry();clearStatus();$('geoHint').textContent='已取消等待，可以重新选择地域。';};
const boundaryData=new Map();function getBoundary(iso,level){const key=iso+'-'+level;if(!boundaryData.has(key))boundaryData.set(key,window.geographyData.boundaryFile({iso,level}).catch(e=>{boundaryData.delete(key);throw e;}));return boundaryData.get(key);}
const continents={'Asia':'亚洲','Europe':'欧洲','Africa':'非洲','North America':'北美洲','South America':'南美洲','Oceania':'大洋洲','Antarctica':'南极洲'};
const chooser=document.createElement('select');chooser.id='continentChoice';chooser.setAttribute('aria-label','选择大洲');for(const [key,title] of Object.entries(continents)){const option=document.createElement('option');option.value=key;option.textContent=title;chooser.append(option);}main.querySelector('.atlas-bar').insertBefore(chooser,$('geoHome'));chooser.onchange=()=>openContinent(chooser.value).catch(error);
const continentMenu=document.createElement('section');continentMenu.id='continentMenu';const heading=document.createElement('h2');heading.textContent='探索七大洲';continentMenu.append(heading);for(const [key,title] of Object.entries(continents)){const button=document.createElement('button');button.textContent=title;button.dataset.continent=key;button.onclick=()=>openContinent(key).catch(error);continentMenu.append(button);}document.getElementById('spaceMenu').insertBefore(continentMenu,document.getElementById('daily'));
const regionChoice=document.createElement('select');regionChoice.id='regionChoice';regionChoice.setAttribute('aria-label','选择当前地图内的国家或行政区');main.querySelector('.atlas-bar').insertBefore(regionChoice,$('geoHome'));regionChoice.onchange=()=>{const f=stack.at(-1)?.features[Number(regionChoice.value)];if(regionChoice.value!==''&&f)enter(f).catch(error);};
const polygons=f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
function feature(name,polys,extra={}){return {type:'Feature',properties:{name,...extra},geometry:{type:'MultiPolygon',coordinates:polys}};}
const details=f=>window.ATLAS_LOCALIZATION.get(f,stack.at(-1)?.boundaryISO||stack.at(-1)?.iso),name=f=>details(f).name;
const originalTitle=document.createElement('p');originalTitle.id='geoOriginal';main.querySelector('.atlas-bar>div').append(originalTitle);
const geoHover=document.createElement('div');geoHover.id='geoHover';geoHover.hidden=true;geoHover.setAttribute('role','tooltip');main.append(geoHover);let labelRecords=[];
const labelMeasure=document.createElement('canvas').getContext('2d');labelMeasure.font='12px "Microsoft YaHei UI",sans-serif';
const quality=document.createElement('details');quality.id='geoQuality';quality.innerHTML='<summary>边界来源与核验说明（参考地图）</summary><p id="geoQualityText"></p>';main.append(quality);
function drawLabels(){
 const map=$('geoMap');map.querySelectorAll('.map-label,.map-label-line').forEach(el=>el.remove());const occupied=[],scale=1100/box[2],v=box,sparse=labelRecords.length<=40;
 for(const r of labelRecords){const [cx,cy]=r.center,w=(r.bounds[1][0]-r.bounds[0][0])*scale,h=(r.bounds[1][1]-r.bounds[0][1])*scale;if(cx<v[0]||cy<v[1]||cx>v[0]+v[2]||cy>v[1]+v[3]||(!sparse&&(w<22||h<12)))continue;
  const font=12/scale,width=Math.max(24,labelMeasure.measureText(r.name).width+6)/scale,offsets=sparse?[[0,0],[0,-18],[0,18],[-25,-18],[25,-18],[-25,18],[25,18],[0,-36],[0,36],[-50,0],[50,0]]:[[0,0]];let point=null;
  for(const [dx,dy] of offsets){const x=cx+dx/scale,y=cy+dy/scale,rect=[x-width/2,y-font,x+width/2,y+font*.25];if(rect[0]<v[0]||rect[2]>v[0]+v[2]||rect[1]<v[1]||rect[3]>v[1]+v[3]||occupied.some(a=>rect[0]<a[2]+3/scale&&rect[2]>a[0]-3/scale&&rect[1]<a[3]+3/scale&&rect[3]>a[1]-3/scale))continue;point=[x,y];occupied.push(rect);break;}if(!point)continue;
  const [x,y]=point;if(x!==cx||y!==cy){const line=document.createElementNS(NS,'line');for(const [key,value] of Object.entries({x1:cx,y1:cy,x2:x,y2:y-4/scale,class:'map-label-line'}))line.setAttribute(key,value);line.style.strokeWidth=1/scale+'px';map.append(line);}
  const label=document.createElementNS(NS,'text');label.setAttribute('x',x);label.setAttribute('y',y);label.setAttribute('class','map-label');label.style.fontSize=font+'px';label.style.strokeWidth=3/scale+'px';label.textContent=r.name;map.append(label);
 }
}
async function render(){
 const s=stack.at(-1);if(!s)return;const version=++renderVersion,token=request;rendering=true;status.hidden=false;status.dataset.state='loading';$('geoStatusText').textContent='正在绘制 '+s.title+'，可以返回、切换大洲或取消等待。';$('geoRetry').hidden=true;$('geoCancel').textContent='取消等待';main.setAttribute('aria-busy','true');cancelAnimationFrame(frame);zoom=1;hover=null;geoHover.hidden=true;box=[0,0,1100,680];
 const plan=s.plan||await geometry('layout',{features:s.features,continent:s.continent,fileURL:s.fileURL,excludeCodes:s.excludeCodes});if(version!==renderVersion||token!==request||s!==stack.at(-1))return;s.plan=plan;if(plan.source)s.source=plan.source;
 const map=$('geoMap');map.setAttribute('viewBox',box.join(' '));map.replaceChildren();$('geoTitle').textContent=s.title;$('geoCrumb').textContent='地球 / '+stack.map(x=>x.title).join(' / ');
 originalTitle.textContent=s.originalTitle&&s.originalTitle!==s.title?'原名：'+s.originalTitle:'';originalTitle.hidden=!originalTitle.textContent;
 s.features=plan.features;const labels=[];labelRecords=[];
 regionChoice.replaceChildren(new Option('选择地域（'+s.features.length+'）',''));s.features.map((f,index)=>({f,index})).sort((a,b)=>name(a.f).localeCompare(name(b.f),'zh-CN')).forEach(({f,index})=>{const info=details(f),option=new Option(info.name,String(index));option.dataset.original=info.original;option.title=info.translated?info.original:'原名（中文待核实）：'+info.original;regionChoice.add(option);});regionChoice.disabled=s.level==='city';
 for(let index=0;index<s.features.length;index++){const f=s.features[index],item=plan.items[index];
  if(index&&index%20===0){await new Promise(resolve=>setTimeout(resolve,0));if(version!==renderVersion||token!==request||s!==stack.at(-1))return;}
  const path=document.createElementNS(NS,'path');path.setAttribute('d',item.d);path.setAttribute('fill-rule','evenodd');path.setAttribute('class','map-area');path.setAttribute('tabindex','0');path.setAttribute('aria-label',name(f));if(f.properties.ADM0_A3)path.dataset.iso=f.properties.ADM0_A3;
  const province=f.properties.province||provinces.find(p=>s.iso==='CHN'&&p.name===(s.chinaProvince||s.title));if(province){const done=f.properties.province?ui.entry(province.id).status==='done':ui.cityComplete(province.id,f.properties.name);path.dataset.learningComplete=String(done);if(done)path.style.fill='#5d9284';}
  const info=details(f),hoverName=f.properties.ADM0_A3==='CHN'?'中华人民共和国':info.translated&&info.name!==info.original?info.name+'（'+info.original+'）':info.translated?info.name:info.name+'（中文待核实）';path.dataset.original=info.original;
  const title=document.createElementNS(NS,'title');title.textContent=hoverName;path.append(title);
  const select=()=>enter(f).catch(error),hoverFeature=e=>{hover=f;$('geoHint').textContent=hoverName+' · 点击或滚轮放大进入；向后滚动返回';geoHover.textContent=hoverName;geoHover.hidden=false;const b=path.getBoundingClientRect();geoHover.style.left=Math.min(innerWidth-260,Math.max(12,e?.clientX||b.x+b.width/2))+12+'px';geoHover.style.top=Math.max(12,Math.min(innerHeight-60,e?.clientY||b.y))+16+'px';};
  path.onpointerenter=hoverFeature;path.onclick=select;path.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();select();}};map.append(path);
  path.onfocus=hoverFeature;path.onpointerleave=path.onblur=()=>{geoHover.hidden=true;};
  let center=item.center;const b=item.bounds;
  if(!center?.every(Number.isFinite))continue;
  if(item.area<12){const dot=document.createElementNS(NS,'circle');dot.setAttribute('cx',center[0]);dot.setAttribute('cy',center[1]);dot.setAttribute('r',3);dot.setAttribute('class','island-marker');dot.setAttribute('aria-label',name(f));dot.onpointerenter=hoverFeature;dot.onpointerleave=()=>{geoHover.hidden=true;};dot.onclick=select;const t=document.createElementNS(NS,'title');t.textContent=name(f);dot.append(t);labels.push(dot);}
  if(!path.isPointInFill(new DOMPoint(...center))){const w=b[1][0]-b[0][0],h=b[1][1]-b[0][1];let found=null;for(const dy of [.5,.35,.65,.2,.8]){for(const dx of [.5,.35,.65,.2,.8]){const p=[b[0][0]+w*dx,b[0][1]+h*dy];if(path.isPointInFill(new DOMPoint(...p))){found=p;break;}}if(found)break;}if(found)center=found;else continue;}
  labelRecords.push({center,bounds:b,name:name(f)});
 }
 map.append(...labels);drawLabels();rendering=false;clearStatus();
 $('geoHint').textContent=s.hint||(s.level==='city'?'已到此数据源提供的最细层级。可继续放大查看边界，缩小返回。':'点击地域、选择地域或滚轮放大进入；向后缩小返回。灰色地区同样可以浏览。')+(s.source?' 数据：'+s.source.provider+' · '+(s.boundaryISO==='TWN'?(s.adm===1?'市／县':'区／乡镇'):'第'+(s.adm||1)+'级行政区')+' · '+(s.source.year||'')+' · '+s.source.license:'');
 const q=window.ATLAS_BOUNDARY_QUALITY?.countries[s.boundaryISO||s.iso],year=s.source?.year||q?.year||'来源未注明';let explanation='世界国家轮廓来自 Natural Earth 1:50m；下级边界来自所标注的数据源。资料经过简化，来源年份：'+year+'。不是最新官方标准地图，也不能作为法定国界或行政区界依据。';
 if(q?.review)explanation+=' 自动核验发现来源范围、年代、上下级包含关系或几何差异，仍需对照官方资料人工核实；不把差异直接判定成国界错误。';
 if(q?.missingPct>5)explanation+=' 本层行政区与国家参考轮廓的覆盖差异约 '+q.missingPct+'%，可能未覆盖部分离岛或海外区域。';
 if(q?.coordinateErrors||q?.invalidGeometry||q?.invalidChildGeometry)explanation+=' 来源数据存在待复核的几何结构，未擅自改画边界。';
 explanation+=' 中文名优先按 Unicode CLDR 行政区代码和同国同级名称匹配；悬停可对照原名。没有可靠对应的名称标为“中文待核实”。';$('geoQualityText').textContent=explanation;
}
function error(e){if(e.name==='AbortError')return;loading=false;rendering=false;const message='此级地图暂时无法载入：'+e.message+'。这不是学习限制。';$('geoHint').textContent=message;status.hidden=false;status.dataset.state='error';$('geoStatusText').textContent=message;$('geoRetry').hidden=!retryAction;$('geoCancel').textContent='收起';main.setAttribute('aria-busy','false');}
async function push(s){stack.push(s);await ui.view('exploreView');await render();}
async function enter(f){if(loading||rendering)return;const s=stack.at(-1);if(!s||s.level==='city')return;
 if(s.continent==='Antarctica'){await push({level:'city',title:'南极洲大陆',continent:'Antarctica',features:[f]});$('geoHint').textContent='南极洲没有这里所用的国家、省、市行政层级；可滚轮放大查看大陆轮廓，缩小返回。';return;}
 if(s.level==='continent'){const iso=({KOS:'XKX',SDS:'SSD',SAH:'ESH',PSX:'PSE',ALD:'ALA'}[f.properties.ADM0_A3])||[f.properties.ADM0_A3,f.properties.ISO_A3_EH].find(x=>/^[A-Z]{3}$/.test(x));if(iso==='CHN'){await push({level:'country',title:'中国',iso,features:provinces.map(p=>feature(p.name,p.polygons,{province:p}))});return;}
 if(iso==='HKG'||iso==='MAC'){const p=provinces.find(p=>p.name===(iso==='HKG'?'香港特别行政区':'澳门特别行政区'));await push({level:'province',title:p.name,iso:'CHN',features:p.cities.filter(c=>c.polygons.length).map(c=>feature(c.name,c.polygons))});return;}
 beginLoading('正在读取 '+name(f)+' 的省／州边界，请稍候；首次需要联网，之后缓存到 D 盘。',f);const token=++request;try{
  if(!window.geographyData?.levels||!window.geographyData?.boundaryFile)throw Error('当前窗口仍是旧版主程序，请保存学习内容后重新打开软件一次');
  const levels=iso?await window.geographyData.levels(iso):[];if(token!==request)return;
  if(!levels.length){await push({level:'city',title:name(f),iso,features:[countries.find(c=>c.properties.ADM0_A3===f.properties.ADM0_A3)||f],hint:'公开数据目录暂未提供此国家／地区的下级边界；保留完整轮廓，不虚构省市。'});return;}
  const next=levels[0],fileURL=await getBoundary(iso,next.level);if(token!==request)return;await push({level:'country',title:name(f),iso,adm:Number(next.level.slice(3)),levels,features:[],fileURL});
 }catch(e){if(token===request)throw e;}finally{if(token===request)loading=false;}return;}
 if(s.level==='country'){if(s.iso==='CHN'){const p=f.properties.province;if(p.name==='台湾省'){
  beginLoading('正在读取台湾省市县边界…',f);const token=++request;try{const levels=await window.geographyData.levels('TWN'),fileURL=await getBoundary('TWN','ADM1');if(token!==request)return;await push({level:'province',title:'台湾省',iso:'CHN',boundaryISO:'TWN',adm:1,levels,fileURL,features:[],excludeCodes:['TW-KIN','TW-LIE']});}catch(e){if(token===request)throw e;}finally{if(token===request)loading=false;}return;
 }const features=p.cities.filter(c=>c.polygons.length).map(c=>feature(c.name,c.polygons));if(!features.length){ui.notify('此省当前数据未提供市区边界，保留省级浏览。');return;}await push({level:'province',title:p.name,iso:s.iso,features});return;}
 }
 if(s.iso==='CHN'&&!s.boundaryISO){
  beginLoading('正在读取 '+name(f)+' 的区／县边界…',f);const token=++request;try{const province=s.chinaProvince||s.title,data=s.level==='province'?await window.geographyData.chinaChildren({province,city:name(f)}):null;if(token!==request)return;
   if(data)await push({level:'district',title:name(f),iso:s.iso,chinaProvince:province,features:data.features,source:data.source});
   else await push({level:'city',title:name(f),iso:s.iso,features:[f],source:s.source});
  }catch(e){if(token===request)throw e;}finally{if(token===request)loading=false;}return;
 }
 const next=s.levels?.find(x=>Number(x.level.slice(3))>s.adm);if(!next){await push({level:'city',title:name(f),originalTitle:details(f).original,iso:s.iso,boundaryISO:s.boundaryISO,features:[f],source:s.source});return;}
 beginLoading('正在读取 '+name(f)+' 的下一级边界（'+next.level+' / '+next.name+'）…',f);const token=++request;try{
  const fileURL=await getBoundary(s.boundaryISO||s.iso,next.level);if(token!==request)return;
  const selected=await childrenOf(f,fileURL,s.features,(s.boundaryISO||s.iso)+'|'+s.adm+'|'+next.level+'|'+stack.map(x=>x.title).join('/'));if(token!==request)return;if(!selected.features.length)throw Error('该上级区域没有可对应的下级边界，可能是不同年份数据不一致');
  await push({level:next.level==='ADM2'?'province':'district',title:name(f),originalTitle:details(f).original,iso:s.iso,boundaryISO:s.boundaryISO,adm:Number(next.level.slice(3)),levels:s.levels,features:selected.features,source:selected.source});
 }catch(e){if(token===request)throw e;}finally{if(token===request)loading=false;}
}
async function back(){request++;loading=false;cancelGeometry();clearStatus();geoHover.hidden=true;if(stack.length>1){stack.pop();await render();}else{stack.length=0;await ui.view('spaceView');}}
async function openContinent(c){await ready;if(!continents[c])throw Error('未知大洲');request++;loading=false;cancelGeometry();stack.length=0;chooser.value=c;await push({level:'continent',continent:c,title:continents[c],features:continentMaps[c]});if(c==='Antarctica')$('geoHint').textContent='南极洲大陆：可点击或滚轮放大浏览，不设国家、省、市层级。';}
async function open(lon,lat){await ready;const c=Object.keys(continents).find(c=>continentMaps[c].some(f=>window.d3.geoContains(f,[lon,lat])));if(!c){ui.notify('这里是海洋。点击陆地可以进入所属洲，或按 Tab 在菜单选择七大洲。');return;}await openContinent(c);}
const ready=Promise.all(['assets/countries.geojson','assets/continents.geojson'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('世界地图未安装');return r.json();}))).then(([data,regions])=>{const china=data.features.find(f=>f.properties.ADM0_A3==='CHN'),taiwan=data.features.find(f=>f.properties.ADM0_A3==='TWN');countries=data.features.filter(f=>f!==taiwan);if(china&&taiwan)china.geometry={type:'MultiPolygon',coordinates:[...polygons(china),...polygons(taiwan)]};continentMaps=window.ATLAS_MAP_GEOMETRY.continentalMaps(countries,regions.features);});
ready.catch(error);$('geoBack').onclick=()=>back().catch(error);$('geoHome').onclick=()=>{request++;loading=false;cancelGeometry();clearStatus();geoHover.hidden=true;stack.length=0;ui.view('spaceView').catch(error);};
window.addEventListener('atlas-view',e=>{if(e.detail!=='exploreView'){request++;loading=false;cancelGeometry();clearStatus();geoHover.hidden=true;}});
 function animateBox(){const svg=$('geoMap'),v=svg.viewBox.baseVal,values=[v.x,v.y,v.width,v.height].map((n,i)=>n+(box[i]-n)*.3);svg.setAttribute('viewBox',values.join(' '));if(values.some((n,i)=>Math.abs(n-box[i])>.1))frame=requestAnimationFrame(animateBox);else{svg.setAttribute('viewBox',box.join(' '));drawLabels();}}
 $('geoWrap').addEventListener('wheel',e=>{
  e.preventDefault();if(loading||rendering||performance.now()<gate)return;const s=stack.at(-1);if(!s)return;
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
 window.atlasExplorer={open,openContinent,openChina,back,state:()=>({level:stack.at(-1)?.level,title:stack.at(-1)?.title,count:stack.at(-1)?.features.length,adm:stack.at(-1)?.adm,iso:stack.at(-1)?.iso,loading:loading||rendering,zoom})};
})();
