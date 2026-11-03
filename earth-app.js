(()=>{
'use strict';
const $=id=>document.getElementById(id),{lessons}=window.ATLAS_COURSE,{provinces}=window.ATLAS_GEO;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const partNames=['认识新知识','看代码与结果','动手练习','复盘与巩固'];
let state={revision:0,units:{}},current=null,part=0,dirty=false,editVersion=0,saveTimer,saveChain=Promise.resolve(),loading=false,parts=[];
function entry(id){return state.units[id]||{revision:0,status:'new',parts:[]};}
function notify(text){$('message').textContent=text;$('message').hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('message').hidden=true,6500);}
function fail(e){$('saved').textContent='未保存，请保留页面';notify(e.message||String(e));}
function nextId(){return lessons.find(u=>entry(u.id).status!=='done')?.id||42;}
function syncWorld(){window.dispatchEvent(new CustomEvent('atlas-progress',{detail:{units:state.units,next:nextId()}}));$('journeyCount').textContent=Object.values(state.units).filter(u=>u.status==='done').length+' / 42 区域已开发';}
function changed(){if(loading||current===null)return;dirty=true;editVersion++;$('saved').textContent='未保存';clearTimeout(saveTimer);saveTimer=setTimeout(()=>flush().catch(fail),650);}
function flush(){clearTimeout(saveTimer);if(!dirty||current===null)return saveChain;const version=editVersion,payload={id:current,code:$('code').value,notes:$('notes').value,answer:$('answer').value,parts:[...parts],status:parts.length===4?'done':'learning'};saveChain=saveChain.catch(()=>{}).then(async()=>{payload.revision=entry(payload.id).revision;state=await window.atlas.save(payload);if(version===editVersion&&current===payload.id){dirty=false;$('saved').textContent='已保存';}syncWorld();});return saveChain;}
window.flushAtlas=async()=>{await flush();if(dirty)await flush();if(dirty)throw Error('还有未保存的内容');return true;};
async function view(name){await window.flushAtlas();for(const id of ['spaceView','atlasView','routeView','lessonView'])$(id).hidden=id!==name;document.body.dataset.view=name==='spaceView'?'space':'learning';$('spaceMenu').hidden=true;window.scrollTo(0,0);window.dispatchEvent(new CustomEvent('atlas-view',{detail:name}));}
function cityStops(p){
 const available=p.cities.filter(c=>c.center);if(available.length<=4)return available;
 // Spread the four learning destinations across the province to avoid overlapping city-center labels.
 const chosen=[available[0]];
 while(chosen.length<4){const candidate=available.filter(c=>!chosen.includes(c)).sort((a,b)=>distance(b)-distance(a))[0];chosen.push(candidate);}
 function distance(c){return Math.min(...chosen.map(a=>(a.center[0]-c.center[0])**2+(a.center[1]-c.center[1])**2));}
 return chosen;
}
const ns='http://www.w3.org/2000/svg';function svg(tag,attrs={},text){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e;}
function projectFor(bbox){const [x1,y1,x2,y2]=bbox,scale=Math.min(960/(x2-x1),530/((y2-y1)*1.25));return ([x,y])=>[550+(x-(x1+x2)/2)*scale,330-(y-(y1+y2)/2)*scale*1.25];}
function shape(polys,project){return polys.map(p=>p.map(r=>r.map((v,i)=>(i?'L':'M')+project(v).map(x=>x.toFixed(1)).join(',')).join('')+'Z').join('')).join('');}
function clickable(node,action){node.setAttribute('tabindex','0');node.setAttribute('role','button');node.onclick=action;node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}};}
function mapBase(project){const map=$('flatMap');map.replaceChildren();const defs=svg('defs'),pattern=svg('pattern',{id:'terrain',patternUnits:'userSpaceOnUse',width:10000,height:10000});const [x,y]=project([-180,90]),[x2,y2]=project([180,-90]);pattern.append(svg('image',{href:'assets/earth.jpg',x,y,width:x2-x,height:y2-y,preserveAspectRatio:'none'}));defs.append(pattern);map.append(defs);return map;}
async function showChina(){
 await view('atlasView');$('mapTitle').textContent='中国';$('mapCrumb').textContent='地球 / 亚洲';$('upMap').hidden=true;
 $('mapHint').textContent='灰色：尚未学完。定位箭头：当前任务。学完四个细分内容，省份恢复自然色。';
 const project=projectFor([73,18,135,54]),map=mapBase(project),labels=svg('g');
 for(const p of provinces){
  const area=svg('path',{d:shape(p.polygons,project),class:'map-area '+(entry(p.id).status==='done'?'completed':''),'aria-label':p.name+' 单元'+p.id,'data-province':p.id});
  clickable(area,()=>showProvince(p.id).catch(fail));map.append(area);
  let [x,y]=project(p.center);const offsets={1:[-14,-15],2:[22,10],11:[28,5],12:[-28,10]};if(offsets[p.id]){x+=offsets[p.id][0];y+=offsets[p.id][1];}
  labels.append(svg('text',{x,y,class:'map-label'},p.name.replace(/省|市|特别行政区|壮族自治区|维吾尔自治区|回族自治区|自治区/g,'')));
 }
 map.append(labels);const p=provinces[Math.min(nextId(),34)-1],[x,y]=project(p.center);map.append(svg('text',{x,y:y-33,class:'map-label'},'▼ 每日任务'));
}
async function showProvince(id){if(id>34){notify('周边地图尚未开发，后续再来拓展。课程已预留在完整路线中。');return;}await view('atlasView');current=id;const p=provinces[id-1],u=lessons[id-1],stops=cityStops(p);$('mapTitle').textContent=p.name+' / '+u.title;$('mapCrumb').textContent='亚洲 / 中国 / 单元 '+id;$('upMap').hidden=false;$('mapHint').textContent='点击市／区进入细分内容。'+(entry(id).status==='done'?'这个单元已学完，仍可回看。':'完成四站后，整片省份恢复自然色。');const project=projectFor(p.bbox),map=mapBase(project);for(const c of p.cities){if(!c.polygons.length)continue;const area=svg('path',{d:shape(c.polygons,project),class:'map-area '+(entry(id).status==='done'?'completed':'')});map.append(area);}if(!p.cities.some(c=>c.polygons.length))map.append(svg('path',{d:shape(p.polygons,project),class:'map-area '+(entry(id).status==='done'?'completed':'')}));stops.forEach((c,i)=>{const [x,y]=project(c.center),g=svg('g',{class:'city-pin '+((entry(id).parts||[]).includes(i)?'completed':''),'data-part':i,'aria-label':c.name+' '+partNames[i]});g.append(svg('circle',{cx:x,cy:y,r:12}),svg('text',{x,y:y+5},String(i+1)),svg('text',{x,y:y+33},c.name),svg('text',{x,y:y+54},partNames[i]));clickable(g,()=>openLesson(id,i).catch(fail));map.append(g);});}
function resultHTML(stdout){const lines=stdout.trim().split('\n');if(lines.length>1&&/\s{2,}/.test(lines[0])){const rows=lines.map(l=>l.trim().split(/\s{2,}/));if(rows.every(r=>r.length===rows[0].length))return '<div class="result-table"><table><thead><tr>'+rows[0].map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(1).map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}return '<pre>'+esc(stdout)+'</pre>';}
function renderPart(){const u=lessons[current-1],p=provinces[current-1],stops=p?cityStops(p):[];const location=stops[part]?.name||'学习站';$('lessonRegion').textContent=(p?p.name:'周边预留课程')+' / '+location+' / 单元 '+current;$('lessonTitle').textContent=u.title;$('finishPart').textContent=parts.includes(part)?'已学完，取消标记':'这部分学完了';$('cityTabs').replaceChildren();partNames.forEach((name,i)=>{const b=document.createElement('button');b.textContent=(parts.includes(i)?'✓ ':'')+(stops[i]?.name||'')+' '+name;b.className=i===part?'active':'';b.onclick=()=>{part=i;renderPart();};$('cityTabs').append(b);});const output=window.ATLAS_EXAMPLES?.[current]?.stdout||'本例生成文件或图表，请点击运行查看。';let content='';if(part===0)content=`<h2>${esc(u.title)}</h2><p class="goal">${esc(u.goal)}</p><h3>先用白话理解</h3><p>${esc(u.plain)}</p><h3>专业定义</h3><p class="definition">${esc(u.definition)}</p><p class="helper">${esc(u.schedule)}</p>`;if(part===1)content=`<h2>一段代码，一个结果</h2><p>先观察右侧代码中的输入，再看它输出什么。</p><pre>${esc(u.code)}</pre>${u.checkpoint?'<p>阶段测试请自己运行并记录结果。</p>':'<h3>这段代码实际输出</h3>'+resultHTML(output)}<button id="loadExample">把示例放入编辑区</button><h3>为什么得到这个结果</h3><p>${esc(u.plain)}</p>`;if(part===2)content=`<h2>${u.checkpoint?'阶段测试':'动手练习'}</h2><p>${esc(u.goal)}</p><ol>${u.tasks.map(t=>'<li>'+esc(t)+'</li>').join('')}</ol><p>在右侧运行代码，把结果和解释记到“练习答案与思路”。</p>`;if(part===3)content=`<h2>把这次探索变成自己的知识</h2><p>对照本单元的目标：${esc(u.goal)}</p><ol><li>说明输入是什么，代码做了什么，输出是什么。</li><li>换一组数字或数据再运行，检查结果是否符合预期。</li><li>把仍不理解的地方写入笔记；借助过提示也可以如实记录。</li></ol><p>四部分都标记学完后，省份恢复自然色。这个标记记录你的学习进度，不等于已批改或独立掌握。</p>`;$('lessonArticle').innerHTML='<p class="part-location">'+esc(location)+' / '+partNames[part]+'</p>'+content;if($('loadExample'))$('loadExample').onclick=()=>{if($('code').value!==u.code&&$('code').value.trim()&&!confirm('替换编辑区代码？可先导出草稿保留原答案。'))return;$('code').value=u.code;changed();};}
async function openLesson(id,index=0){await window.flushAtlas();loading=true;current=id;part=index;const v=entry(id);parts=[...(v.parts||[])];$('code').value=v.code??lessons[id-1].code;$('notes').value=v.notes||'';$('answer').value=v.answer||'';$('output').textContent='还没有运行代码。';$('plots').replaceChildren();loading=false;renderPart();await view('lessonView');}
async function showRoute(){await view('routeView');$('routeList').replaceChildren();for(const u of lessons){const b=document.createElement('button');b.className='unit-button';b.innerHTML=`<span>${u.id}. ${esc(provinces[u.id-1]?.name||'周边地图预留')}<small>${esc(u.title)} / ${entry(u.id).status==='done'?'已学完':'尚未学完'}</small></span>`;b.onclick=()=>u.id<=34?showProvince(u.id).catch(fail):openLesson(u.id).catch(fail);$('routeList').append(b);}}
for(const id of ['code','notes','answer'])$(id).addEventListener('input',changed);
$('finishPart').onclick=async()=>{parts=parts.includes(part)?parts.filter(x=>x!==part):[...parts,part];changed();try{await flush();renderPart();if(parts.length===4)notify('单元已学完，'+(provinces[current-1]?.name||'区域')+'恢复自然色。');}catch(e){fail(e);}};
$('reopenUnit').onclick=async()=>{parts=[];changed();try{await flush();renderPart();}catch(e){fail(e);}};
$('run').onclick=async()=>{const b=$('run');b.disabled=true;$('output').textContent='正在运行…';$('plots').replaceChildren();try{await flush();const r=await window.atlas.run({code:$('code').value});$('output').textContent=(r.stdout||'')+(r.stderr||'')+(r.timeout?'\n运行超过20秒，已停止。':'')||'运行结束，无打印输出。';$('output').classList.toggle('error',!!r.stderr||r.timeout);for(const src of r.images){const img=document.createElement('img');img.src=src;img.alt='本次代码生成的图表';$('plots').append(img);}}catch(e){$('output').textContent=e.message;}finally{b.disabled=false;}};
$('code').onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();e.target.setRangeText('    ',e.target.selectionStart,e.target.selectionEnd,'end');changed();}if(e.ctrlKey&&e.key==='Enter'&&!$('run').disabled){e.preventDefault();$('run').click();}};
$('exportCode').onclick=async()=>{try{notify('草稿已导出：'+await window.atlas.exportDraft({id:current,code:$('code').value,notes:$('notes').value,answer:$('answer').value}));}catch(e){fail(e);}};
$('clearOutput').onclick=()=>{$('output').textContent='还没有运行代码。';$('plots').replaceChildren();};
$('menuToggle').onclick=()=>$('spaceMenu').hidden=!$('spaceMenu').hidden;
$('china').onclick=()=>showChina().catch(fail);$('upMap').onclick=()=>showChina().catch(fail);$('fallbackMap').onclick=()=>showChina().catch(fail);$('routeTab').onclick=()=>showRoute().catch(fail);
for(const id of ['backSpace','routeBack'])$(id).onclick=()=>view('spaceView').then(syncWorld).catch(fail);
$('backMap').onclick=()=>current<=34?showProvince(current).catch(fail):showRoute().catch(fail);
$('backup').onclick=async()=>{try{await flush();notify('备份已保存：'+await window.atlas.backup());}catch(e){fail(e);}};
$('about').onclick=()=>{$('spaceMenu').hidden=true;$('infoDialog').showModal();};$('closeInfo').onclick=()=>$('infoDialog').close();
window.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='s'){e.preventDefault();flush().catch(fail);}if(e.key==='Escape'&&document.body.dataset.view==='space'&&document.body.dataset.flying!=='true')$('spaceMenu').hidden=!$('spaceMenu').hidden;});
window.earthUI={showProvince,showChina,notify,nextId,entry,syncWorld};
(async()=>{try{state=await window.atlas.load();syncWorld();}catch(e){$('sceneLoading').textContent='学习记录读取失败，请保留文件并联系修复。';notify(e.message);}})();
})();
