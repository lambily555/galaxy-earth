(()=>{
'use strict';
const $=id=>document.getElementById(id),{lessons}=window.ATLAS_COURSE,{provinces}=window.ATLAS_GEO;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const partNames=['认识新知识','看代码与结果','动手练习','复盘与巩固'];
let state={revision:0,units:{}},current=null,part=0,dirty=false,editVersion=0,saveTimer,saveChain=Promise.resolve(),loading=false,parts=[],lastRun=null,introPage=4;
try{const saved=localStorage.getItem('w3-reading-page');if(saved!==null&&Number.isInteger(Number(saved))&&Number(saved)>=0&&Number(saved)<window.ATLAS_BEGINNER_INTRO.length)introPage=Number(saved);}catch{}
function entry(id){return state.units[id]||{revision:0,status:'new',parts:[]};}
function notify(text){$('message').textContent=text;$('message').hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('message').hidden=true,6500);}
function fail(e){$('saved').textContent='未保存，请保留页面';notify(e.message||String(e));}
function nextId(){return lessons.find(u=>entry(u.id).status!=='done')?.id||42;}
function syncWorld(){window.dispatchEvent(new CustomEvent('atlas-progress',{detail:{units:state.units,next:nextId()}}));$('journeyCount').textContent=Object.values(state.units).filter(u=>u.status==='done').length+' / 42 区域已开发';}
function changed(){if(loading||current===null)return;dirty=true;editVersion++;$('saved').textContent='未保存';clearTimeout(saveTimer);saveTimer=setTimeout(()=>flush().catch(fail),650);}
function flush(){clearTimeout(saveTimer);if(!dirty||current===null)return saveChain;const version=editVersion,payload={id:current,code:$('code').value,notes:$('notes').value,answer:$('answer').value,parts:[...parts],guided:window.guidedLesson?.snapshotFor(current),lastRun,status:parts.length===4?'done':'learning'};saveChain=saveChain.catch(()=>{}).then(async()=>{payload.revision=entry(payload.id).revision;state=await window.atlas.save(payload);if(version===editVersion&&current===payload.id){dirty=false;$('saved').textContent='已保存';}syncWorld();});return saveChain;}
window.flushAtlas=async()=>{await flush();if(dirty)await flush();if(dirty)throw Error('还有未保存的内容');return true;};
async function view(name){await window.flushAtlas();for(const id of ['spaceView','atlasView','routeView','lessonView','exploreView'])$(id).hidden=id!==name;document.body.dataset.view=name==='spaceView'?'space':'learning';$('spaceMenu').hidden=true;$('settingsPanel').hidden=true;$('planetInfo').hidden=true;window.scrollTo(0,0);window.dispatchEvent(new CustomEvent('atlas-view',{detail:name}));}
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
function completedAreas(id){const p=provinces[id-1],v=entry(id);return !p?[]:v.status==='done'?[p]:cityStops(p).filter((c,i)=>(v.parts||[]).includes(i));}
function cityComplete(id,name){return entry(id).status==='done'||completedAreas(id).some(c=>c.name===name);}
async function showProvince(id){if(id>34){notify('周边地图尚未开发，后续再来拓展。课程已预留在完整路线中。');return;}await view('atlasView');current=id;const p=provinces[id-1],u=lessons[id-1],stops=cityStops(p);$('mapTitle').textContent=p.name+' / '+u.title;$('mapCrumb').textContent='亚洲 / 中国 / 单元 '+id;$('upMap').hidden=false;$('mapHint').textContent='点击市／区进入细分内容。'+(entry(id).status==='done'?'这个单元已学完，仍可回看。':'完成四站后，整片省份恢复自然色。');const project=projectFor(p.bbox),map=mapBase(project);for(const c of p.cities){if(!c.polygons.length)continue;const area=svg('path',{d:shape(c.polygons,project),class:'map-area '+(cityComplete(id,c.name)?'completed':''),'data-city':c.name});map.append(area);}if(!p.cities.some(c=>c.polygons.length))map.append(svg('path',{d:shape(p.polygons,project),class:'map-area '+(entry(id).status==='done'?'completed':'')}));stops.forEach((c,i)=>{const [x,y]=project(c.center),g=svg('g',{class:'city-pin '+((entry(id).parts||[]).includes(i)?'completed':''),'data-part':i,'aria-label':c.name+' '+partNames[i]});g.append(svg('circle',{cx:x,cy:y,r:12}),svg('text',{x,y:y+5},String(i+1)),svg('text',{x,y:y+33},c.name+((entry(id).parts||[]).includes(i)?' · 已学完':'')),svg('text',{x,y:y+54},partNames[i]));clickable(g,()=>openLesson(id,i).catch(fail));map.append(g);});}
function resultHTML(stdout){const lines=stdout.trim().split('\n');if(lines.length>1&&/\s{2,}/.test(lines[0])){const rows=lines.map(l=>l.trim().split(/\s{2,}/));if(rows.every(r=>r.length===rows[0].length))return '<div class="result-table"><table><thead><tr>'+rows[0].map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(1).map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}return '<pre>'+esc(stdout)+'</pre>';}
function introHTML(){
 const pages=window.ATLAS_BEGINNER_INTRO,p=pages[introPage];
 return '<section id="beginnerIntro"><p class="helper">W3基础主线 · 按网站顺序学习；原42单元是补充练习，不代表W3完成进度。</p><label for="w3Chapter">W3章节目录</label><select id="w3Chapter">'+pages.map((v,i)=>'<option value="'+i+'" '+(i===introPage?'selected':'')+'>'+esc(v.title)+'</option>').join('')+'</select><h2>'+esc(p.title)+'</h2><p>对应教材：'+esc(p.url)+'</p><button id="introSource" class="primary">在Chrome打开本章W3教材</button><p>先读W3正文及子目录，再看下方原创中文补充。阅读位置不是完成或掌握证明。右侧为共享练习草稿，切章节不会自动替换。</p>'+p.body+(p.code?'<h3>补充例子</h3><pre>'+esc(p.code)+'</pre><h3>预期结果</h3><pre>'+esc(p.output)+'</pre><button id="runIntro">直接运行这个例子</button>':'')+'<div class="lesson-actions"><button id="introPrevious" '+(introPage===0?'disabled':'')+'>上一章</button><button id="introNext" '+(introPage===pages.length-1?'disabled':'')+'>下一章（不标记完成）</button></div></section>';
}
function bindIntro(){
 $('finishPart').hidden=!!$('beginnerIntro');
 if($('introNext')){
  $('lessonTitle').textContent=window.ATLAS_BEGINNER_INTRO[introPage].title;
  $('lessonRegion').textContent='W3基础主线 / 当前阅读位置';
  const go=index=>{introPage=index;try{localStorage.setItem('w3-reading-page',String(index));}catch{}renderPart();$('lessonArticle').scrollIntoView({block:'start'});};
  $('introNext').onclick=()=>go(Math.min(introPage+1,window.ATLAS_BEGINNER_INTRO.length-1));
  $('introPrevious').onclick=()=>go(Math.max(0,introPage-1));
  $('w3Chapter').onchange=e=>go(Number(e.target.value));
  $('introSource').onclick=()=>window.learningSites.open(window.ATLAS_BEGINNER_INTRO[introPage].source).catch(fail);
  if($('runIntro'))$('runIntro').onclick=()=>runSource(window.ATLAS_BEGINNER_INTRO[introPage].code,'W3补充：'+window.ATLAS_BEGINNER_INTRO[introPage].title).catch(fail);
 }
 if(current===1)for(const [i,b]of [...$('cityTabs').children].entries())b.textContent=i===0?'W3基础主线':'原单元补充 · '+partNames[i];
}
const tables=document.createElement('div');tables.id='resultTables';$('plots').before(tables);
const runMeta=document.createElement('p');runMeta.className='helper';runMeta.id='runMeta';$('output').before(runMeta);
const runSourceDetails=document.createElement('details'),runSourceSummary=document.createElement('summary'),runSourceCode=document.createElement('pre');runSourceSummary.textContent='查看生成此结果的代码';runSourceDetails.append(runSourceSummary,runSourceCode);$('output').before(runSourceDetails);
function showResult(r){
 $('output').textContent=r?((r.stdout||'')+(r.stderr||'')+(r.timeout?'\n运行超过20秒，已停止。':'')||'运行结束，无文本输出。'):'还没有运行代码。';
 $('output').classList.toggle('error',!!(r?.stderr||r?.timeout));$('plots').replaceChildren();tables.replaceChildren();
 runMeta.textContent=r?(r.label||'我的练习')+' · '+new Date(r.at).toLocaleString()+' · 最近一次结果（不会自动重跑）'+(r.partial?' · 大图仅保留本次显示，未全部存入记录':''):'';
 runSourceDetails.hidden=!r;runSourceCode.textContent=r?.source||'';
for(const t of r?.tables||[]){const wrap=document.createElement('div');wrap.className='result-table';wrap.innerHTML='<p>显示'+t.data.length+'行／共'+esc(t.total_rows)+'行，'+t.columns.length+'列／共'+esc(t.total_columns)+'列</p><table><thead><tr>'+(t.show_index?[t.index_names?.join(' / ')||'行索引',...t.columns]:t.columns).map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+t.data.map((row,i)=>'<tr>'+(t.show_index?[t.index[i],...row]:row).map(v=>'<td>'+esc(v===null?'缺失':typeof v==='object'?JSON.stringify(v):v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';tables.append(wrap);}
 for(const src of r?.images||[]){const img=document.createElement('img');img.src=src;img.alt='本次代码生成的图表';$('plots').append(img);}
}
async function runSource(source,label){
 if($('run').disabled)throw Error('上一段代码还在运行，请稍候。');
 const unit=current;$('run').disabled=true;$('output').textContent='正在运行…';tables.replaceChildren();$('plots').replaceChildren();
 try{await window.flushAtlas();const r=await window.atlas.run({code:source,id:current,label}),record={...r,source,label,at:new Date().toISOString()};
  const saved={...record,images:[]};let bytes=0;for(const image of record.images||[]){if(bytes+image.length<=6000000){saved.images.push(image);bytes+=image.length;}else saved.partial=true;}
  if(current===unit){record.partial=saved.partial;lastRun=saved;showResult(record);changed();await flush();}
  else{state=await window.atlas.save({...entry(unit),id:unit,lastRun:saved});syncWorld();}
 }finally{$('run').disabled=false;}
}
function renderPart(){const u=lessons[current-1],p=provinces[current-1],stops=p?cityStops(p):[];const location=stops[part]?.name||'学习站';$('lessonRegion').textContent=(p?p.name:'周边预留课程')+' / '+location+' / 单元 '+current;$('lessonTitle').textContent=u.title;$('finishPart').textContent=parts.includes(part)?'已学完，取消标记':'这部分学完了';$('cityTabs').replaceChildren();partNames.forEach((name,i)=>{const b=document.createElement('button');b.textContent=(parts.includes(i)?'✓ ':'')+(stops[i]?.name||'')+' '+name;b.className=i===part?'active':'';b.onclick=()=>{part=i;renderPart();};$('cityTabs').append(b);});const output=window.ATLAS_EXAMPLES?.[current]?.stdout||'本例生成文件或图表，请点击运行查看。';let content='';if(part===0)content=`<h2>${esc(u.title)}</h2><p class="goal">${esc(u.goal)}</p><h3>先用白话理解</h3><p>${esc(u.plain)}</p><h3>专业定义</h3><p class="definition">${esc(u.definition)}</p><p class="helper">${esc(u.schedule)}</p>`;if(part===1)content=`<h2>一段代码，一个结果</h2><p>先观察右侧代码中的输入，再看它输出什么。</p><pre>${esc(u.code)}</pre>${u.checkpoint?'<p>阶段测试请自己运行并记录结果。</p>':'<h3>这段代码实际输出</h3>'+resultHTML(output)}<button id="loadExample">把示例放入编辑区</button><h3>为什么得到这个结果</h3><p>${esc(u.plain)}</p>`;if(part===2)content=`<section id="guidedLesson"></section><h2>${u.checkpoint?'阶段测试':'动手练习'}</h2><p>${esc(u.goal)}</p><ol>${u.tasks.map((t,i)=>'<li data-timer-question="PY-U'+current+'-Q'+(i+1)+'">'+esc(t)+'</li>').join('')}</ol><p>直接在右侧写代码并运行，结果表、图表或报错会显示并自动保存，不需要外部编辑器或截图。display(df) 可把表格显示成可视化结果。</p>`;if(part===3)content=`<h2>把这次探索变成自己的知识</h2><p>对照本单元的目标：${esc(u.goal)}</p><ol><li>说明输入是什么，代码做了什么，输出是什么。</li><li>换一组数字或数据再运行，检查结果是否符合预期。</li><li>把仍不理解的地方写入笔记；借助过提示也可以如实记录。</li></ol><p>四部分都标记学完后，省份恢复自然色。这个标记记录你的学习进度，不等于已批改或独立掌握。</p>`;if(current===1&&part===0&&introPage<window.ATLAS_BEGINNER_INTRO.length)content=introHTML();$('lessonArticle').innerHTML='<p class="part-location">'+esc(location)+' / '+partNames[part]+'</p>'+content;bindIntro();if(part===2)window.guidedLesson.mount(current,entry(current).guided);if($('loadExample'))$('loadExample').onclick=()=>{if($('code').value!==u.code&&$('code').value.trim()&&!confirm('替换编辑区代码？可先导出草稿保留原答案。'))return;$('code').value=u.code;changed();};}
async function openLesson(id,index=0){await window.flushAtlas();loading=true;current=id;part=index;const v=entry(id);parts=[...(v.parts||[])];$('code').value=v.code??(id===1?'print("你好，Python！")':lessons[id-1].code);$('notes').value=v.notes||'';$('answer').value=v.answer||'';$('output').textContent='还没有运行代码。';$('plots').replaceChildren();lastRun=v.lastRun||null;showResult(lastRun);loading=false;renderPart();await view('lessonView');}
async function showRoute(){await view('routeView');$('routeList').replaceChildren();for(const u of lessons){const b=document.createElement('button');b.className='unit-button';b.innerHTML=`<span>${u.id}. ${esc(provinces[u.id-1]?.name||'周边地图预留')}<small>${esc(u.title)} / ${entry(u.id).status==='done'?'已学完':'尚未学完'}</small></span>`;b.onclick=()=>u.id<=34?showProvince(u.id).catch(fail):openLesson(u.id).catch(fail);$('routeList').append(b);}}
for(const id of ['code','notes','answer'])$(id).addEventListener('input',changed);
$('finishPart').onclick=async()=>{parts=parts.includes(part)?parts.filter(x=>x!==part):[...parts,part];changed();try{await flush();renderPart();if(parts.length===4)notify('单元已学完，'+(provinces[current-1]?.name||'区域')+'恢复自然色。');}catch(e){fail(e);}};
$('reopenUnit').onclick=async()=>{parts=[];changed();try{await flush();renderPart();}catch(e){fail(e);}};
$('run').onclick=()=>runSource($('code').value,'我的练习').catch(e=>{$('output').textContent=e.message;});
$('code').onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();e.target.setRangeText('    ',e.target.selectionStart,e.target.selectionEnd,'end');changed();}if(e.ctrlKey&&e.key==='Enter'&&!$('run').disabled){e.preventDefault();$('run').click();}};
$('exportCode').onclick=async()=>{try{notify('草稿已导出：'+await window.atlas.exportDraft({id:current,code:$('code').value,notes:$('notes').value,answer:$('answer').value}));}catch(e){fail(e);}};
$('clearOutput').onclick=()=>{lastRun=null;showResult(null);changed();};
$('menuToggle').onclick=()=>window.dispatchEvent(new CustomEvent('atlas-planet',{detail:'jupiter'}));
$('china').onclick=()=>showChina().catch(fail);$('upMap').onclick=()=>showChina().catch(fail);$('fallbackMap').onclick=()=>showChina().catch(fail);$('routeTab').onclick=()=>showRoute().catch(fail);
for(const id of ['backSpace','routeBack'])$(id).onclick=()=>view('spaceView').then(syncWorld).catch(fail);
$('backMap').onclick=()=>current<=34?showProvince(current).catch(fail):showRoute().catch(fail);
$('backup').onclick=async()=>{try{await flush();notify('备份已保存：'+await window.atlas.backup());}catch(e){fail(e);}};
$('about').onclick=()=>{$('spaceMenu').hidden=true;$('infoDialog').showModal();};$('closeInfo').onclick=()=>$('infoDialog').close();
const minimizeButton=document.createElement('button');minimizeButton.id='minimizeApp';minimizeButton.textContent='暂时收起（最小化） · F1';minimizeButton.title='保留在任务栏，点击任务栏图标继续学习';
minimizeButton.onclick=async()=>{try{await flush();await window.atlasWindow.minimize();}catch(error){fail(error);}};
$('spaceMenu').insertBefore(minimizeButton,$('exitApp'));
const minimizeHelp=document.createElement('tr');minimizeHelp.innerHTML='<td>F1</td><td>保存并最小化到任务栏；点击任务栏图标恢复，不退出应用</td>';$('settingsPanel').querySelector('table').appendChild(minimizeHelp);
window.addEventListener('keydown',e=>{if(e.key==='F1'){e.preventDefault();minimizeButton.click();}});
const learningLinks=document.createElement('section');learningLinks.innerHTML='<h2>零基础 Python 教学</h2><p>使用 Google Chrome 打开，和当前课程对照学习。</p><button data-learning-site="w3schools">W3Schools Python · 示例与练习</button><button data-learning-site="runoob">菜鸟 Python3 · 中文讲解</button>';
const w3Button=document.createElement('button');w3Button.id='w3Main';w3Button.className='primary';w3Button.textContent='继续W3主线 · 当前学到Output';w3Button.onclick=()=>openLesson(1,0).catch(fail);$('spaceMenu').insertBefore(w3Button,$('daily'));
$('routeTab').textContent='原42单元 · 业务补充练习';
const routeHeader=$('routeView').querySelector('header div');routeHeader.querySelector('h1').textContent='业务补充练习（保留原进度）';routeHeader.querySelector('p').textContent='基础课程以W3主线为准；这些单元不与W3章节完成状态互相折算。';
const routeW3=w3Button.cloneNode(true);routeW3.id='routeW3Main';routeW3.onclick=()=>openLesson(1,0).catch(fail);routeHeader.append(routeW3);
$('spaceMenu').insertBefore(learningLinks,$('about'));learningLinks.addEventListener('click',e=>{const button=e.target.closest('[data-learning-site]');if(button)window.learningSites.open(button.dataset.learningSite).catch(fail);});
window.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='s'){e.preventDefault();flush().catch(fail);}if(e.key==='Escape'){e.preventDefault();window.atlas.close().catch(fail);}if(e.key==='Tab'&&!e.defaultPrevented&&!e.target.matches('input,textarea,[contenteditable=true]')){e.preventDefault();window.dispatchEvent(new CustomEvent('atlas-planet',{detail:'jupiter'}));}if(e.key==='F2'){e.preventDefault();window.dispatchEvent(new CustomEvent('atlas-planet',{detail:'saturn'}));}if(e.key==='Home'&&!e.target.matches('input,textarea,[contenteditable=true]')){e.preventDefault();window.dispatchEvent(new CustomEvent('atlas-planet',{detail:'earth'}));}});
window.earthUI={completedAreas,cityComplete,showProvince,showChina,showRoute,view,notify,nextId,entry,syncWorld,changed,runSource,openW3:async index=>{introPage=index;await openLesson(1,0);},mapContext:()=>({province:$('upMap').hidden?null:current})};
window.earthUI.openPractice=id=>openLesson(id,2);
const dailyScript=document.createElement('script');dailyScript.src='daily-learning.js';document.head.append(dailyScript);
(async()=>{try{state=await window.atlas.load();syncWorld();}catch(e){$('sceneLoading').textContent='学习记录读取失败，请保留文件并联系修复。';notify(e.message);}})();
})();
