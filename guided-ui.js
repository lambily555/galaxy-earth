(()=>{
'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let id=null,progress=null,busy=false,feedback='',reference='';
const exercise=()=>window.ATLAS_GUIDED[id];
function snapshot(){return progress?JSON.parse(JSON.stringify(progress)):undefined;}
function changed(){window.earthUI.changed();}
function code(){return (progress.history||[]).filter(h=>h.status==='correct'||h.status==='corrected').map(h=>h.code).join('\n');}
function render(){
 const host=$('guidedLesson');if(!host||!progress)return;
 const e=exercise(),done=progress.index>=e.steps.length,current=e.steps[progress.index];
 host.innerHTML='<h3>先做一道逐句理解题</h3><p class="guided-demand">'+esc(e.requirement)+'</p><p class="helper">一段需求，分句完成。变量名按题目约定；每次写一个步骤，循环／函数等代码块可以多行。提交用 Ctrl+Enter，也可点按钮。不会在打字中途判错。</p><p>第 '+Math.min(progress.index+1,e.steps.length)+' / '+e.steps.length+' 步'+(done?' · 已完成':'')+'</p>'+
 (done?'<p>完整代码已拼好，可以运行查看结果，再做下方原有练习。采用过参考写法的步骤会保留记录，不算独立答对。</p>':'<label for="guidedInput">'+esc(current.prompt)+'</label><textarea id="guidedInput" spellcheck="false" aria-describedby="guidedFeedback"></textarea><button id="guidedSubmit" class="primary">判断这一句</button>')+
 '<p id="guidedFeedback" role="status">'+esc(feedback)+'</p>'+(reference?'<p>当前步骤参考写法：</p><pre>'+esc(reference)+'</pre><button id="guidedAdopt">采用参考并继续（记为纠正）</button>':'')+
 '<details><summary>查看逐句作答记录</summary>'+progress.history.map(h=>'<p>第'+(h.index+1)+'步 · '+esc(h.status==='correct'?'答对':h.status==='corrected'?'采用参考':'未通过／待复核')+'</p><pre>'+esc(h.answer)+'</pre><p>'+esc(h.feedback)+'</p>').join('')+'</details><h4>目前拼好的代码</h4><pre id="guidedCode">'+esc(code()||'完成第一句后，代码会出现在这里。')+'</pre><button id="guidedRun" '+(code()?'':'disabled')+'>运行目前代码，结果显示在右侧</button><p class="helper">本地规则核对语法结构，支持空格、引号、注释等差异；无法确认的其他写法标为待复核，不冒充AI理解。</p>';
 if($('guidedInput')){$('guidedInput').value=progress.draft||'';$('guidedInput').oninput=()=>{progress.draft=$('guidedInput').value;reference='';changed();};$('guidedInput').onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();e.target.setRangeText('    ',e.target.selectionStart,e.target.selectionEnd,'end');progress.draft=e.target.value;changed();}if(e.ctrlKey&&e.key==='Enter'){e.preventDefault();submit();}};$('guidedSubmit').onclick=submit;}
 if($('guidedAdopt'))$('guidedAdopt').onclick=()=>{const s=exercise().steps[progress.index];progress.history.push({index:progress.index,status:'corrected',answer:progress.draft,code:s.code,feedback:'采用参考写法，后续需复练',at:new Date().toISOString()});progress.index++;progress.draft='';feedback='已接入参考写法，不记为独立答对。继续下一句。';reference='';changed();render();$('guidedInput')?.focus();};
 $('guidedRun').onclick=()=>window.earthUI.runSource(code(),'理解题').catch(e=>window.earthUI.notify(e.message));
}
async function submit(){
 if(busy||!progress||progress.index>=exercise().steps.length)return;
 busy=true;const unit=id,index=progress.index,answer=$('guidedInput').value;progress.draft=answer;changed();$('guidedSubmit').disabled=true;feedback='正在判断…';$('guidedFeedback').textContent=feedback;
 try{const r=await window.guidedCheck.check({id:unit,index,answer});if(id!==unit||progress.index!==index)return;
  feedback=r.feedback;reference=r.status==='correct'?'':r.reference;
  progress.history.push({index,status:r.status,answer,feedback:r.feedback,at:new Date().toISOString(),...(r.status==='correct'?{code:answer}:{})});
  if(r.status==='correct'){progress.index++;progress.draft='';}
  changed();render();$('guidedInput')?.focus();
 }catch(e){feedback='判题暂不可用：'+e.message;render();}finally{busy=false;}
}
window.guidedLesson={snapshotFor:unit=>unit===id?snapshot():undefined,mount(unit,saved){if(unit!==id){id=unit;progress=saved?.version===1?JSON.parse(JSON.stringify(saved)):{version:1,index:0,draft:'',history:[]};const last=progress.history.at(-1);feedback=last?.feedback||'';reference=last?.index===progress.index&&last.answer===progress.draft&&last.status!=='correct'?exercise().steps[progress.index]?.code||'':'';}render();}};
})();
