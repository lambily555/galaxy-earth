(()=>{
 'use strict';
 const dialog=document.createElement('dialog');dialog.id='dailyLearning';dialog.style.cssText='width:min(920px,92vw);max-height:88vh;overflow:auto';document.body.append(dialog);
 const style=document.createElement('style');style.textContent='#dailyLearning label{display:block;margin:14px 0 6px}#dailyLearning textarea{display:block;box-sizing:border-box;width:100%;min-height:120px;padding:12px;border:1px solid #344d60;border-radius:8px;background:#091522;color:#deedf7;font:15px/1.6 Consolas,monospace;resize:vertical}#dailyLearning section{border-top:1px solid #344d60;margin-top:24px;padding-top:12px}#dailyLearning button{margin:5px 8px 5px 0}#dailyLearning select{max-width:100%;padding:8px;background:#091522;color:#deedf7}#dailyLearning pre{white-space:pre-wrap}';document.head.append(style);
 const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 let loaded,dirty=false,editVersion=0,saving=Promise.resolve();
 async function showReview(plan,day){
  const response=await fetch('data/daily-reviews.json');if(!response.ok)throw Error('批改记录未能读取');
  const review=(await response.json())[plan.id];if(!review)return;
  for(const q of plan.questions){const item=review.questions[q.id];if(!item)continue;
   const box=document.createElement('aside');box.dataset.review=q.id;
   const original=dialog.querySelector('[data-answer="'+q.id+'"]');
   const render=()=>{const updated=original.value!==item.answer;box.innerHTML='<h4>教练批改 · '+esc(review.date)+' · '+esc(item.result)+'</h4><p>'+(updated?'当前答案已修改，以下保留上次批改；新答案待复核。':'本次已批改，待订正。')+'</p><h4>批改时我的原答案（保留）</h4><pre>'+esc(item.answer)+'</pre><p>'+esc(item.feedback)+'</p><h4>正确答案／参考解释</h4><pre>'+esc(item.correct)+'</pre>';};
   original.addEventListener('input',render);render();original.closest('section').append(box);
  }
 }
 async function save(){
  if(!dirty)return saving;
  const version=editVersion,payload={id:loaded.plan.id,answers:Object.fromEntries([...dialog.querySelectorAll('[data-answer]')].map(e=>[e.dataset.answer,e.value])),help:dialog.querySelector('#dailyHelp').value,status:dialog.querySelector('#dailyStatus').value};
  saving=saving.catch(()=>{}).then(async()=>{payload.revision=loaded.state.revision;loaded=await window.dailyLearning.save(payload);});
  try{await saving;if(version!==editVersion)return save();dirty=false;dialog.querySelector('#dailySaved').textContent='答案已保存（尚未批改）';}catch(e){dialog.querySelector('#dailySaved').textContent=e.message;throw e;}
 }
 const originalFlush=window.flushAtlas;window.flushAtlas=async()=>{await save();return originalFlush();};
 async function open(){
  try{
   await window.flushAtlas();loaded=await window.dailyLearning.read();
   const {plan,state}=loaded,day=state.days[plan.id]||{},today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date());
   dialog.innerHTML='<h2>每日学习安排 · '+esc(plan.date)+'</h2><p>'+esc(today===plan.date?'今日任务':'待续安排：按实际完成情况推进，不自动补造新一天进度')+'</p><h3>'+esc(plan.title)+'</h3><p>'+esc(plan.minutes)+' · '+esc(plan.goal)+'</p><ol>'+plan.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol><div>'+plan.links.map(l=>'<button data-source="'+esc(l.key)+'">'+esc(l.label)+'</button>').join('')+'<button id="dailyChapter">去App对应讲解</button></div>'+plan.questions.map(q=>'<section><h3>'+esc(plan.id+'-'+q.id)+' · '+(q.kind==='code'?'手写代码':'解释')+'</h3><p>'+esc(q.text)+'</p><p class="helper">完成标准：'+esc(q.check)+'</p><label for="daily'+q.id+'">我的答案</label><textarea id="daily'+q.id+'" data-answer="'+q.id+'" rows="5" spellcheck="false">'+esc(day.answers?.[q.id])+'</textarea>'+(q.kind==='code'?'<button data-run="'+q.id+'">运行本题答案</button><pre id="dailyResult'+q.id+'" role="log"></pre>':'')+'</section>').join('')+'<h3>复盘与完成标准</h3><p>'+esc(plan.finish)+'</p><label for="dailyHelp">查阅提示、用时与不明白的地方</label><textarea id="dailyHelp" rows="3">'+esc(day.help)+'</textarea><label for="dailyStatus">本次状态</label><select id="dailyStatus"><option value="learning">学习中／待提交</option><option value="self-completed">我已完成，待教练核对</option></select><p>后续：'+esc(plan.next)+'</p><p id="dailySaved" role="status">原答案按版本保留；点击保存或关闭时保存。新运行结果显示在题目下，关键结果请同时记入答案。</p><button id="dailySave">保存答案</button><button id="dailyClose">保存并关闭</button>';
   await showReview(plan,day).catch(e=>{const warning=document.createElement('p');warning.textContent=e.message;dialog.append(warning);});
   dialog.querySelector('#dailyStatus').value=day.status||'learning';
   dialog.oninput=()=>{dirty=true;editVersion++;dialog.querySelector('#dailySaved').textContent='有未保存的答案';};
   dialog.onchange=()=>{dirty=true;editVersion++;};
   dialog.querySelector('#dailySave').onclick=()=>save().catch(()=>{});
   dialog.querySelector('#dailyClose').onclick=()=>save().then(()=>dialog.close()).catch(()=>{});
   for(const b of dialog.querySelectorAll('[data-source]'))b.onclick=()=>window.learningSites.open(b.dataset.source).catch(e=>window.earthUI.notify(e.message));
   dialog.querySelector('#dailyChapter').onclick=async()=>{try{await save();await window.earthUI.openW3(plan.chapter);dialog.close();}catch(e){window.earthUI.notify(e.message);}};
   for(const b of dialog.querySelectorAll('[data-run]'))b.onclick=async()=>{const q=b.dataset.run,out=dialog.querySelector('#dailyResult'+q);b.disabled=true;try{await save();const code=dialog.querySelector('[data-answer="'+q+'"]').value;if(!code.trim())throw Error('先写出本题代码再运行。');const r=await window.atlas.run({id:1,label:plan.id+'-'+q,code});out.textContent=(r.stdout||'')+(r.stderr||'')+(r.timeout?'\n运行超时':'');}catch(e){out.textContent=e.message;}finally{b.disabled=false;}};
   dialog.showModal();dialog.scrollTop=0;
  }catch(e){window.earthUI.notify(e.message);}
 }
 dialog.addEventListener('cancel',e=>{e.preventDefault();save().then(()=>dialog.close()).catch(()=>{});});
 // Save at the existing explicit save/exit boundary; never silently lose modal drafts.
 document.addEventListener('keydown',e=>{if(dialog.open&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();save().then(()=>dialog.close()).catch(()=>{});}},true);
 const menu=document.createElement('button');menu.id='pythonDaily';menu.className='primary';menu.textContent='每日学习安排 · 学什么／练什么';menu.onclick=open;
 document.getElementById('spaceMenu').insertBefore(menu,document.getElementById('w3Main'));
 document.getElementById('daily').textContent='今日Python安排';document.getElementById('daily').onclick=open;
 const header=menu.cloneNode(true);header.id='lessonDaily';header.onclick=open;document.querySelector('.lesson-bar').append(header);
})();
