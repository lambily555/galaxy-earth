'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function(root,kind){
 const file=path.join(root,'data','learning-stats.json');
 const statuses=['未标记','已学习','不熟练','熟练','已忘记'];
 const initial=kind==='sql'?'SELECT与别名|WHERE筛选|ORDER BY排序|GROUP BY分组|HAVING筛选组|COUNT计数|SUM求和|CASE WHEN|NULL与空值|IFNULL与COALESCE|NULLIF|ROUND|CONCAT|LIKE|日期筛选|DATE_FORMAT|INNER JOIN|LEFT JOIN|连接后重复计数|CTE|ROW_NUMBER|RANK与DENSE_RANK|SUM OVER累计|LAG与LEAD|月环比|复购|留存|漏斗人数|漏斗转化与流失|TIMESTAMPADD|建库建表|ALTER TABLE|索引':
 'Python是什么|print输出|变量|数字运算|字符串|列表|字典|条件判断|循环|函数|导入模块|理解报错|DataFrame|读取CSV|读取Excel|loc筛选|排序与索引|计算列|数据类型转换|缺失值|去重|日期处理|字符串处理|数据质量检查|groupby聚合|条件计数|merge连接|先聚合再连接|concat拼接|透视表|transform|rank排名|shift环比|cumsum累计|rolling滚动|折线图|分类对比图|描述统计|复购与留存|路径与批量处理|SQL与pandas|导出报告';
 function read(){if(!fs.existsSync(file))return {version:1,revision:0,topics:initial.split('|').map((name,i)=>({id:'t'+i,name,status:'未标记'})),attempts:[],sessions:[],active:null};const s=JSON.parse(fs.readFileSync(file,'utf8'));if(s.version!==1||!Array.isArray(s.topics)||!Array.isArray(s.attempts)||!Array.isArray(s.sessions))throw Error('统计文件格式异常，未覆盖原文件');return s;}
 function save(s){fs.mkdirSync(path.dirname(file),{recursive:true});if(fs.existsSync(file))fs.copyFileSync(file,file+'.previous');const temp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(s,null,2),{flag:'wx'});fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}return s;}
 const clean=(v,n=160)=>{if(typeof v!=='string'||!v.trim()||v.length>n)throw Error('请填写有效名称');return v.trim();};
 let sourceCache=null,sourceStamp=null;
 function sources(){
  const sourceFile=path.join(root,'data',kind==='python'?'progress.json':'journal.json');
  const stamp=fs.existsSync(sourceFile)?fs.statSync(sourceFile).mtimeMs:0;
  if(sourceCache&&stamp===sourceStamp)return sourceCache;
  sourceStamp=stamp;sourceCache=loadSources();return sourceCache;
 }
 function loadSources(){
  if(kind==='python'){const p=path.join(root,'data','progress.json');const u=fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')).units||{}:{};return {label:'原学习记录（不等同于知识点掌握）',items:Object.entries(u).map(([id,v])=>({name:'单元 '+id,done:v.status==='done',parts:v.parts?.length||0,guided:v.guided?.history?.length||0,syntax:(v.guided?.history||[]).filter(h=>h.status==='syntax').length,correct:(v.guided?.history||[]).filter(h=>h.status==='correct').length,review:(v.guided?.history||[]).filter(h=>h.status==='review').length,corrected:(v.guided?.history||[]).filter(h=>h.status==='corrected').length,hasRun:!!v.lastRun,updatedAt:v.updatedAt}))};}
  const p=path.join(root,'data','journal.json');const j=fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):{};
  const answers=new Map();
  for(const [date,v] of Object.entries(j))for(const m of String(v.body||'').matchAll(/([DW]\d{8}-Q\d+)[｜|]([\s\S]*?)(?=[DW]\d{8}-Q\d+[｜|]|$)/g)){
   const a=m[2].match(/我的答案[：:]([\s\S]*?)(?:正确答案|参考答案|$)/);
   const text=a?.[1].replace(/[\s\u200b-\u200d\ufeff]/g,'');
   if(text&&text.length>3&&!/^(请在|在这里|待作答|未作答|填写)/.test(text))answers.set(m[1],{name:m[1],date,source:'现存作答；不推断次数或正误'});
  }
  return {label:'原每日手记（保存记录不等同于做题次数）',answers:[...answers.values()],items:Object.entries(j).map(([date,v])=>({name:date+' '+(v.title||''),updatedAt:v.updatedAt}))};
 }
 function view(){return {...read(),source:sources()};}
 function act(p){
  const s=read(),now=Date.now();if(!p||typeof p.type!=='string')throw Error('无效操作');
  // No hidden observation: every timing session is manually started.
  if(p.type==='start'){
   if(s.active)throw Error('请先暂停当前计时');
   const mode=p.mode;if(!['question','understanding'].includes(mode))throw Error('无效计时类型');
   const target=clean(p.target),topics=(p.topics||[]).filter(id=>s.topics.some(t=>t.id===id));
   const item={id:crypto.randomUUID(),mode,target,topics:[...new Set(topics)],ms:0,startedAt:new Date(now).toISOString(),endedAt:null,interrupted:false};
   s.sessions.push(item);s.active={id:item.id,last:now}; 
  }else if(['tick','stop','recover'].includes(p.type)){
   if(s.active){
    if(p.sessionId&&p.sessionId!==s.active.id)throw Error('计时已变化，请刷新');
    const item=s.sessions.find(x=>x.id===s.active.id);const delta=Math.max(0,now-s.active.last);
    if(p.type!=='recover'&&delta<=15000)item.ms+=delta;
    else item.interrupted=true;
    s.active.last=now;
    if(p.type!=='tick'||delta>15000){item.endedAt=new Date(now).toISOString();s.active=null;}
   }else return view();
  }else if(p.type==='weakPoint'){
   const name=clean(p.name,60),note=clean(p.note,2000);
   let topic=s.topics.find(t=>t.name===name);
   if(!topic){topic={id:crypto.randomUUID(),name,status:'未标记'};s.topics.push(topic);}
   topic.weakNote=note;topic.weakUpdatedAt=new Date(now).toISOString();
  }else if(p.type==='topic'){
   const topic=s.topics.find(t=>t.id===p.id);if(!topic||!statuses.includes(p.status))throw Error('无效知识点状态');
   topic.status=p.status;topic.updatedAt=new Date(now).toISOString();
  }else if(p.type==='addTopic'){
   const name=clean(p.name,60);if(s.topics.some(t=>t.name===name))throw Error('知识点已存在');
   s.topics.push({id:crypto.randomUUID(),name,status:'未标记'});
  }else if(p.type==='attempt'){
   const target=clean(p.target),topics=[...new Set(p.topics||[])];if(!topics.length||topics.some(id=>!s.topics.some(t=>t.id===id)))throw Error('请选择相关知识点');
   if(!['未批改','正确','部分正确','错误'].includes(p.outcome))throw Error('无效结果');
   const errorTopics=[...new Set(p.errorTopics||[])];if(errorTopics.some(id=>!topics.includes(id)))throw Error('错误知识点必须属于本题');
   if(['正确','未批改'].includes(p.outcome)&&errorTopics.length)throw Error('未批改或正确的题不能记录错误知识点');
   // Client request id makes retry after a lost response idempotent.
   const requestId=clean(p.requestId,80);if(s.attempts.some(a=>a.requestId===requestId))return view();
   s.attempts.push({id:crypto.randomUUID(),requestId,target,topics,errorTopics,outcome:p.outcome,assisted:!!p.assisted,at:new Date(now).toISOString(),source:'手动登记'});
  }else if(p.type==='removeSession'){
   if(s.active?.id===p.id)throw Error('请先暂停计时');const i=s.sessions.findIndex(x=>x.id===p.id);if(i<0)throw Error('记录不存在');s.sessions.splice(i,1);
  }else if(p.type==='removeAttempt'){
   const i=s.attempts.findIndex(a=>a.id===p.id);if(i<0)throw Error('记录不存在');s.attempts.splice(i,1);
  }else throw Error('未知操作');
  s.revision++;save(s);return view();
 }
 function captureRun(id,label,result){
  if(!Number.isInteger(id)||id<1||id>42)return;
  const s=read();s.runs||=[];s.runs.push({id:crypto.randomUUID(),unit:id,label:String(label||'练习').slice(0,60),at:new Date().toISOString(),failed:result.code!==0,timeout:!!result.timeout});s.revision++;save(s);
 }
 function importWeakEvidence(records){
  const s=read();
  for(const record of records){
   const name=clean(record.name,60);let t=s.topics.find(t=>t.name===name);
   if(!t){t={id:crypto.randomUUID(),name,status:'未标记'};s.topics.push(t);}
   t.weakEvidence||=[];
   for(const e of record.evidence){if(!e.date||!e.question||!e.detail||!e.source)throw Error('错题证据不完整');if(!t.weakEvidence.some(x=>x.date===e.date&&x.question===e.question))t.weakEvidence.push(e);}
  }
  s.revision++;save(s);return view();
 }
 return {read:view,act,captureRun,importWeakEvidence};
};
