(()=>{
'use strict';
const python=!!window.learningStats;
const api=python?window.learningStats:{
 async read(){const r=await fetch('/api/learning-stats');const v=await r.json();if(!r.ok)throw Error(v.error);return v;},
 async act(p){const r=await fetch('/api/learning-stats',{method:'POST',headers:{'Content-Type':'application/json','X-Notebook-Token':document.querySelector('meta[name="notebook-token"]').content},body:JSON.stringify(p)});const v=await r.json();if(!r.ok)throw Error(v.error);return v;}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=ms=>{const s=Math.floor(ms/1000);return Math.floor(s/3600)+':'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const day=t=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date(t));
const statuses=['未标记','已学习','不熟练','熟练','已忘记'],colors=['#8795a8','#80b9cb','#e3ba71','#7cc6a1','#c28db2'];
let data=null,busy=false,tickBusy=false,requestId=crypto.randomUUID(),lastSync=0;
const panel=document.createElement('dialog');panel.id='learningStatsPanel';if(python)panel.className='ls-dark';
panel.innerHTML='<header><h2>学习统计与手动计时</h2><button id="lsClose">返回学习</button></header>'+
'<p class="ls-note">仅记录本机学习数据，不监控键盘、不读取 DataGrip。学完不等于熟练；忘记由你标记。旧记录中无法确定的次数、正误和耗时不补算。</p>'+
'<p id="lsMessage" role="status"></p>'+
'<section><h3>手动计时</h3><div class="ls-row"><label>计时类型 <select id="lsMode"><option value="question">题目作答</option><option value="understanding">理解知识点</option></select></label><label>题号或知识点名称 <input id="lsTarget" list="lsTargets" maxlength="160" placeholder="如 W20261102-Q4 或 CTE"></label><datalist id="lsTargets"></datalist></div>'+
'<p class="ls-note">下方勾选关联知识点，再开始。暂停后可继续同名目标，自动累计；切换页面或最小化不会暂停，离开前请手动暂停。睡眠或异常退出后暂停，不计离线时间。</p>'+
'<details><summary>关联知识点（可选，可多选）</summary><div id="lsTimerTopics" class="ls-tags" aria-label="计时关联知识点"></div></details><div class="ls-row"><button id="lsStart">开始计时</button><button id="lsStop">暂停／结束本次计时</button><strong id="lsClock">尚未开始</strong></div></section>'+
'<section class="ls-section"><details id="lsPractice"><summary>登记一次完整作答／重做</summary><p class="ls-note">题号相同的再次登记算重做。输入、保存、运行都不自动算一次完整作答。理解题的逐句提交单独展示，不混算整道题。</p>'+
'<div class="ls-row"><label>题号 <input id="lsQuestion" maxlength="160" list="lsTargets" placeholder="日期＋题号，保持一致"></label><label>本次结果 <select id="lsOutcome"><option>未批改</option><option>正确</option><option>部分正确</option><option>错误</option></select></label><label><input type="checkbox" id="lsAssisted">借助提示／参考答案</label></div>'+
'<p>本题涉及知识点</p><div id="lsPracticeTopics" class="ls-tags"></div><p>确认出错的知识点（不确定就不选）</p><div id="lsErrorTopics" class="ls-tags"></div><button id="lsRecord">保存这一次作答</button>'+
'</details></section><section class="ls-section"><div class="ls-row"><h3>数据概览</h3><label>统计范围 <select id="lsRange"><option value="30">近30天</option><option value="7">近7天</option><option value="all">全部</option></select></label></div><div id="lsCards" class="ls-grid"></div><div id="lsCharts" class="ls-charts"></div></section>'+
'<section class="ls-section"><h3>知识点明细</h3><p class="ls-note">状态由你确认；“错误次数”仅计算明确勾选该知识点的作答。0 表示尚无登记，不代表从未错过。状态为当前全部状态，不受日期筛选影响。</p>'+
'<div class="ls-row"><label>搜索 <input id="lsSearch" placeholder="输入知识点"></label><label>新增知识点 <input id="lsNewTopic" maxlength="60"></label><button id="lsAddTopic">添加</button></div><div id="lsTopicTable" class="ls-scroll"></div></section>'+
'<section class="ls-section"><h3>按题目／知识点累计耗时</h3><div id="lsTimeTable" class="ls-scroll"></div></section>'+
'<section class="ls-section"><details><summary>计时与作答原始记录（可删除误记）</summary><p class="ls-note">删统计记录不会删除答案。删除前需要确认；上一份统计保存在 data/learning-stats.json.previous。</p><div id="lsLog" class="ls-scroll"></div></details></section>'+
'<section class="ls-section"><details><summary>历史数据覆盖与自动读取</summary><div id="lsCoverage"></div></details></section>';
document.body.append(panel);
const $=id=>document.getElementById(id);
const dock=document.createElement('div');dock.id='learningTimerDock';dock.hidden=true;dock.innerHTML='<span id="lsDockTime"></span><button id="lsDockStop">暂停</button><button id="lsDockOpen">统计</button>';document.body.append(dock);
function entry(host){if(!host)return;const b=document.createElement('button');b.textContent='学习统计 · 计时';b.className='learning-stats-entry';b.onclick=open;host.append(b);}
if(python){entry($('spaceMenu'));entry(document.querySelector('.lesson-bar'));}else{entry(document.querySelector('.view-tabs')||document.querySelector('.sidebar'));entry(document.querySelector('.journal-topline'));}
async function open(){if(!panel.open){panel.showModal();panel.scrollTop=0;}try{data=await api.read();render();}catch(e){message(e.message);}}
function message(s){$('lsMessage').textContent=s;}
async function action(p){if(busy)return;busy=true;try{data=await api.act(p);lastSync=Date.now();render();return true;}catch(e){message(e.message);return false;}finally{busy=false;}}
function checkboxes(host){return [...$(host).querySelectorAll('input:checked')].map(x=>x.value);}
function tags(){for(const id of ['lsTimerTopics','lsPracticeTopics','lsErrorTopics']){const selected=checkboxes(id);$(id).innerHTML=data.topics.map(t=>'<label><input type="checkbox" value="'+esc(t.id)+'" '+(selected.includes(t.id)?'checked':'')+'>'+esc(t.name)+'</label>').join('');}}
function subset(xs){const range=$('lsRange').value;if(range==='all')return xs;const start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-Number(range)+1);return xs.filter(x=>Date.parse(x.at||x.startedAt)>=+start);}
function table(headers,rows){return '<table><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}

const weakSection=document.createElement('section');weakSection.className='ls-section';weakSection.id='lsWeakSection';
weakSection.innerHTML='<h3>常错知识点</h3><p class="ls-note">写下你经常卡住的地方。历史记录显示已核查的题目数，不代表所有历史错误总数；解释错误与代码错误会分开说明。旧错不等于现在仍不会。</p><label>知识点名称 <input id="lsWeakName" maxlength="60" list="lsTargets" placeholder="如 连接后重复计数"></label><label>常错在哪里 <textarea id="lsWeakNote" rows="3" maxlength="2000" placeholder="例如：连上商品表后，订单金额算重复了"></textarea></label><button id="lsWeakSave">保存／更新这个常错点</button><p id="lsWeakStatus" role="status"></p><div id="lsWeakList"></div>';
panel.insertBefore(weakSection,$('lsTopicTable').closest('section'));
function openWeak(){open().then(()=>{weakSection.scrollIntoView({block:'start'});$('lsWeakName').focus({preventScroll:true});});}
const weakButton=document.createElement('button');weakButton.textContent='常错知识点';weakButton.onclick=openWeak;panel.querySelector('header').insertBefore(weakButton,$('lsClose'));
const weakEntry=document.createElement('button');weakEntry.textContent='常错知识点';weakEntry.className='learning-stats-entry';weakEntry.onclick=openWeak;
(python?$('spaceMenu'):document.querySelector('.view-tabs'))?.append(weakEntry);
$('lsWeakSave').onclick=async()=>{if(await action({type:'weakPoint',name:$('lsWeakName').value,note:$('lsWeakNote').value}))$('lsWeakStatus').textContent='已保存。没有把这条自记虚算成一次答错。';else $('lsWeakStatus').textContent=$('lsMessage').textContent;};
function renderWeak(){
 if(!data)return;
 const topics=data.topics.filter(t=>t.weakNote||t.weakEvidence?.length);
 $('lsWeakList').innerHTML=topics.length?topics.map(t=>'<article class="ls-card"><h3>'+esc(t.name)+'</h3>'+(t.weakNote?'<p>我的记录：'+esc(t.weakNote)+'</p>':'')+(t.weakEvidence?.length?'<p>已核查至少 '+t.weakEvidence.length+' 道题 · '+(t.weakEvidence.length>=2?'有重复错误证据':'目前仅一次证据')+'</p><details><summary>查看日期、题号和具体错误</summary>'+t.weakEvidence.map(e=>'<p><strong>'+esc(e.date)+' · '+esc(e.question)+'</strong><br>'+esc(e.detail)+'<br><small>来源：'+esc(e.source)+'</small></p>').join('')+'</details>':'<p class="ls-note">用户自记，尚未核实具体次数。</p>')+'<button data-edit-weak="'+esc(t.id)+'">补充／修改我的记录</button></article>').join(''):'暂时没有常错记录，可以在上方直接填写。';
}
$('lsWeakList').onclick=e=>{const id=e.target.dataset.editWeak;if(!id)return;const t=data.topics.find(t=>t.id===id);$('lsWeakName').value=t.name;$('lsWeakNote').value=t.weakNote||'';$('lsWeakName').focus();};
function render(){
 renderWeak();
 if(!data)return;tags();
 const targets=[...new Set([...data.topics.map(t=>t.name),...data.sessions.map(s=>s.target),...data.attempts.map(a=>a.target),...(data.source.answers||[]).map(a=>a.name)])];
 $('lsTargets').innerHTML=targets.map(s=>'<option value="'+esc(s)+'"></option>').join('');
 $('lsStart').disabled=!!data.active;$('lsStop').disabled=!data.active;
 results();clock();
}
function results(){
 if(!data)return;const a=subset(data.attempts),sessions=subset(data.sessions),correct=a.filter(x=>x.outcome==='正确').length,judged=a.filter(x=>x.outcome!=='未批改').length;
 const learned=data.topics.filter(t=>t.status!=='未标记').length;
 const cards=[['已标记学习的知识点',learned],['不熟练／已忘记',data.topics.filter(t=>t.status==='不熟练').length+' / '+data.topics.filter(t=>t.status==='已忘记').length],['登记作答／不同题目',a.length+' / '+new Set(a.map(x=>x.target)).size],['重做次数',a.filter(x=>data.attempts.findIndex(t=>t.target===x.target)<data.attempts.indexOf(x)).length],['全对率（已登记且已批改）',judged?Math.round(correct/judged*100)+'%':'未记录'],['未批改／借助提示',a.filter(x=>x.outcome==='未批改').length+' / '+a.filter(x=>x.assisted).length],['作答用时',fmt(sessions.filter(s=>s.mode==='question').reduce((n,s)=>n+s.ms,0))],['理解用时',fmt(sessions.filter(s=>s.mode==='understanding').reduce((n,s)=>n+s.ms,0))]];
 $('lsCards').innerHTML=cards.map(([k,v])=>'<div class="ls-card">'+esc(k)+'<strong class="ls-number">'+esc(v)+'</strong></div>').join('');
 const days=new Map();for(const x of a){const d=day(x.at);days.set(d,(days.get(d)||0)+1);}
 const labels=[];const today=new Date();const span=$('lsRange').value==='7'?7:30;for(let i=span-1;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);labels.push(day(d));}
 const max=Math.max(1,...labels.map(d=>days.get(d)||0));const pts=labels.map((d,i)=>(20+i*320/(span-1))+','+(145-(days.get(d)||0)*120/max)).join(' ');
 const counts=statuses.map(s=>data.topics.filter(t=>t.status===s).length),total=Math.max(1,data.topics.length);let offset=0;
 const circles=counts.map((n,i)=>{const len=n/total*100;const c='<circle cx="80" cy="80" r="48" fill="none" stroke="'+colors[i]+'" stroke-width="23" pathLength="100" stroke-dasharray="'+len+' '+(100-len)+'" stroke-dashoffset="'+(-offset)+'" transform="rotate(-90 80 80)"/>';offset+=len;return c;}).join('');
 $('lsCharts').innerHTML='<div class="ls-card"><h3>每日作答趋势 · 最近'+span+'天</h3><svg viewBox="0 0 360 180" role="img" aria-label="每日登记作答次数，峰值'+max+'"><path d="M20 20V145H345" stroke="currentColor" fill="none" opacity=".4"/><polyline points="'+pts+'" stroke="currentColor" stroke-width="3" fill="none"/><text x="20" y="170" fill="currentColor" font-size="12">'+labels[0]+'</text><text x="270" y="170" fill="currentColor" font-size="12">'+labels.at(-1)+'</text><text x="3" y="25" fill="currentColor" font-size="12">'+max+'</text></svg><details><summary>查看每日数据</summary>'+table(['日期','次数'],labels.map(d=>[d,String(days.get(d)||0)]))+'</details></div>'+
 '<div class="ls-card"><h3>当前知识状态占比</h3><svg viewBox="0 0 340 180" role="img" aria-label="'+esc(statuses.map((s,i)=>s+counts[i]).join('，'))+'">'+circles+statuses.map((s,i)=>'<text x="155" y="'+(26+i*30)+'" fill="'+colors[i]+'" font-size="14">'+s+' '+counts[i]+'</text>').join('')+'</svg><p class="ls-note">所有知识点均可人工改状态，未标记不会自动算学过。</p></div>';
 const search=$('lsSearch').value.trim().toLowerCase();const filtered=data.topics.filter(t=>t.name.toLowerCase().includes(search));
 const topicRows=filtered.map(t=>{const practice=a.filter(x=>x.topics.includes(t.id)),bad=a.filter(x=>x.errorTopics.includes(t.id)),time=sessions.filter(s=>s.topics.includes(t.id)||s.mode==='understanding'&&s.target===t.name).reduce((n,s)=>n+s.ms,0);return [esc(t.name),'<select data-status="'+esc(t.id)+'" aria-label="'+esc(t.name)+'状态">'+statuses.map(s=>'<option '+(s===t.status?'selected':'')+'>'+s+'</option>').join('')+'</select>',String(practice.length),String(bad.length),fmt(time),practice.length?day(practice.at(-1).at):'未登记'];});
 $('lsTopicTable').innerHTML=table(['知识点','当前状态','涉及练习','确认错误','关联用时*','最近练习'],topicRows)+'<p class="ls-note">* 同一段时间关联多个知识点时分别显示，不可把各知识点用时相加当总时间。</p>';
 const weak=data.topics.map(t=>({name:t.name,n:a.filter(x=>x.errorTopics.includes(t.id)).length})).filter(x=>x.n).sort((x,y)=>y.n-x.n).slice(0,8);
 $('lsCharts').innerHTML+='<div class="ls-card"><h3>确认错误的知识点分布</h3>'+(weak.length?weak.map(x=>'<div>'+esc(x.name)+' · '+x.n+'次<progress value="'+x.n+'" max="'+Math.max(...weak.map(t=>t.n))+'"></progress></div>').join(''):'尚无已确认的知识点错误记录。')+'</div>';
 const groups=new Map();for(const s of sessions){const key=s.mode+'\n'+s.target;if(!groups.has(key))groups.set(key,{...s,ms:0,n:0});const x=groups.get(key);x.ms+=s.ms;x.n++;}
 $('lsTimeTable').innerHTML=groups.size?table(['类型','目标','累计时间','计时段数'],[...groups.values()].map(s=>[s.mode==='question'?'作答':'理解',esc(s.target),fmt(s.ms),String(s.n)])):'还没有手动计时记录。';
 $('lsLog').innerHTML=table(['记录','目标','详情','操作'],[...sessions.slice().reverse().map(s=>[esc(day(s.startedAt))+' · 计时',esc(s.target),fmt(s.ms)+(s.interrupted?' · 已中断，长间隔未计入':''),'<button data-remove-session="'+esc(s.id)+'" '+(data.active?.id===s.id?'disabled':'')+'>删除误记</button>']),...a.slice().reverse().map(x=>[esc(day(x.at))+' · 作答',esc(x.target),esc(x.outcome)+(x.assisted?' · 有辅助':''),'<button data-remove-attempt="'+esc(x.id)+'">删除误记</button>'])]);
 const source=data.source;
 if(python){
  const runs=subset(data.runs||[]);
  $('lsCards').innerHTML+=[['代码运行次数',runs.length],['运行失败（不等于答错）',runs.filter(r=>r.failed).length]].map(([k,v])=>'<div class="ls-card">'+esc(k)+'<strong class="ls-number">'+v+'</strong></div>').join('');
 }
 $('lsCoverage').innerHTML='<p>'+esc(source.label)+'：'+source.items.length+' 条。</p>'+(python?'<p>完成单元 '+source.items.filter(x=>x.done).length+'；逐句提交 '+source.items.reduce((n,x)=>n+x.guided,0)+' 次。这里只显示源记录，不把“待复核”算错误，不把运行成功算答对。</p>':'<p>从带题号及“我的答案”的现存文本检测到 '+(source.answers||[]).length+' 道非空作答。属于候选证据，不还原历史尝试次数，不自动判正误。</p>')+'<p>目前知识点正误由登记确认；历史截图、口头练习、DataGrip 内未保存到 App 的行为无法可靠还原。用时从手动开启计时后开始积累。</p>';
 if(python)$('lsCoverage').innerHTML+=table(['单元','逐句提交','规则通过','语法错误','待复核','采用参考'],source.items.map(x=>[esc(x.name),String(x.guided),String(x.correct),String(x.syntax),String(x.review),String(x.corrected)]));
}

// Controls live in shadow DOM: timer text never becomes part of the editable answer.
function mountQuestionTimers(){
 const targets=python?[...document.querySelectorAll('[data-timer-question]')]:[...document.querySelectorAll('#journalComposer p,#journalComposer div')].filter(el=>/^[DW](?:\d{8}|\d{2})(?:-R\d+)?-Q\d+[｜|]/.test(el.textContent.trim())&&!el.querySelector('p,div'));
 for(const el of targets){
  const target=python?el.dataset.timerQuestion:el.textContent.trim().match(/^[DW](?:\d{8}|\d{2})(?:-R\d+)?-Q\d+/)[0];
  let anchor=el;
  if(!python){for(let n=el.nextElementSibling;n;n=n.nextElementSibling){if(/我的答案[：:]|^[DW](?:\d{8}|\d{2})(?:-R\d+)?-Q\d+/.test(n.textContent.trim()))break;if(n.tagName==='P')anchor=n;}}
  if(anchor.querySelector('[data-learning-timer]'))continue;
  const host=document.createElement('span');host.dataset.learningTimer=target;host.contentEditable='false';
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML='<style>:host{display:block;margin:10px 0;font:14px/1.5 system-ui;color:inherit}button{font:inherit;color:inherit;background:transparent;border:1px solid #8b9baa;border-radius:6px;padding:5px 10px;cursor:pointer}button:disabled{opacity:.5;cursor:default}span{margin-left:10px}small{display:block;color:#b65e59}</style><button type="button">开始计时</button><span></span><small role="status"></small>';
  shadow.querySelector('button').onclick=async e=>{
   e.preventDefault();e.stopPropagation();const error=shadow.querySelector('small');error.textContent='';
   if(!data){error.textContent='统计尚未读取，请稍后重试';return;}
   if(data.active&&data.sessions.find(s=>s.id===data.active.id)?.target!==target){error.textContent='请先暂停另一道题的计时';return;}
   const ok=await action(data.active?{type:'stop',sessionId:data.active.id}:{type:'start',mode:'question',target,topics:[]});
   if(!ok)error.textContent=$('lsMessage').textContent;
   updateQuestionClocks();
  };
  anchor.append(host);
 }
 updateQuestionClocks();
}
function updateQuestionClocks(){
 if(!data)return;const active=data.active&&data.sessions.find(s=>s.id===data.active.id);
 for(const host of document.querySelectorAll('[data-learning-timer]')){
  const shadow=host.shadowRoot;if(!shadow)continue;
  const target=host.dataset.learningTimer,running=active?.mode==='question'&&active.target===target;
  const ms=data.sessions.filter(s=>s.mode==='question'&&s.target===target).reduce((n,s)=>n+s.ms,0)+(running?Math.min(5000,Math.max(0,Date.now()-lastSync)):0);
  shadow.querySelector('button').textContent=running?'暂停计时':'开始／继续计时';
  shadow.querySelector('button').disabled=!!active&&!running;
  shadow.querySelector('span').textContent=(running?'本题计时中 · ':'本题累计 · ')+fmt(ms);
 }
}
let mounting=false;
const timerObserver=new MutationObserver(()=>{if(mounting)return;mounting=true;requestAnimationFrame(()=>{mounting=false;mountQuestionTimers();});});
const timerRoot=python?$('lessonArticle'):$('journalComposer');
if(timerRoot)timerObserver.observe(timerRoot,{childList:true,subtree:true});
mountQuestionTimers();
function clock(){
 updateQuestionClocks();
 if(!data)return;const s=data.active&&data.sessions.find(x=>x.id===data.active.id);
 const elapsed=s?s.ms+Math.min(5000,Math.max(0,Date.now()-lastSync)):0;
 const text=s?(s.mode==='question'?'作答':'理解')+' · '+s.target+' · '+fmt(elapsed):'已暂停（可用相同名称继续累计）';
 $('lsClock').textContent=text;dock.hidden=!s;$('lsDockTime').textContent=text;
}
$('lsClose').onclick=()=>panel.close();$('lsDockOpen').onclick=open;
$('lsMode').onchange=()=>{if($('lsMode').value==='understanding')$('lsTarget').placeholder='如 CTE、print输出';else $('lsTarget').placeholder='如 W20261102-Q4';};
$('lsStart').onclick=async()=>{if(await action({type:'start',mode:$('lsMode').value,target:$('lsTarget').value,topics:checkboxes('lsTimerTopics')}))message('已开始。返回学习后右下角保留暂停按钮。');};
async function stop(){if(await action({type:'stop',sessionId:data?.active?.id}))message('计时已暂停并保存。此操作不会自动登记一次答题。');}
$('lsStop').onclick=stop;$('lsDockStop').onclick=stop;
$('lsRecord').onclick=async()=>{if(await action({type:'attempt',requestId,target:$('lsQuestion').value,topics:checkboxes('lsPracticeTopics'),errorTopics:checkboxes('lsErrorTopics'),outcome:$('lsOutcome').value,assisted:$('lsAssisted').checked})){requestId=crypto.randomUUID();message('已登记这一次作答。只有再次完整重做后才需要再次登记。');}};
$('lsAddTopic').onclick=async()=>{if(await action({type:'addTopic',name:$('lsNewTopic').value})){$('lsNewTopic').value='';message('已添加知识点。');}};
$('lsRange').onchange=results;$('lsSearch').oninput=results;
panel.addEventListener('change',e=>{if(e.target.dataset.status)action({type:'topic',id:e.target.dataset.status,status:e.target.value});});
panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.removeSession||b.dataset.removeAttempt;if(!id)return;if(b.dataset.confirm!=='yes'){b.dataset.confirm='yes';b.textContent='再次点击确认删除';return;}action({type:b.dataset.removeSession?'removeSession':'removeAttempt',id});});
window.addEventListener('keydown',e=>{if(!panel.open)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();panel.close();}else if(e.key==='Tab')e.stopImmediatePropagation();},true);
setInterval(clock,500);
setInterval(async()=>{if(!data?.active||busy||tickBusy)return;tickBusy=true;try{data=await api.act({type:'tick',sessionId:data.active.id});lastSync=Date.now();clock();if(!data.active){render();message('检测到长时间中断，计时已暂停，请手动重新开始。');}}catch(e){message('计时保存失败：'+e.message+'。请暂停并检查。');}finally{tickBusy=false;}},5000);
api.act({type:'recover'}).then(s=>{data=s;lastSync=Date.now();render();}).catch(e=>message(e.message));
})();
