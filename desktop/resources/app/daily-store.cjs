'use strict';
const fs=require('node:fs'),path=require('node:path'),plan=require('./daily-plan.cjs');
module.exports=root=>{
 const file=path.join(root,'data','daily-learning.json');
 const read=()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{revision:0,days:{}};
 return p=>{
  const state=read();
  if(!p)return {plan,state};
  if(p.id!==plan.id||p.revision!==state.revision)throw Error('每日记录已有更新，请保留当前答案并重新打开安排后合并。');
  if(!['learning','self-completed'].includes(p.status))throw Error('无效学习状态');
  const answers={};for(const q of plan.questions){answers[q.id]=String(p.answers?.[q.id]??'');if(answers[q.id].length>100000)throw Error('答案过长，请先导出保留。');}
  const help=String(p.help??'');if(help.length>10000)throw Error('复盘文字过长');
  const old=state.days[plan.id],at=new Date().toISOString();
  const history=old?.history||[];
  if(old&&(JSON.stringify(old.answers)!==JSON.stringify(answers)||old.help!==help||old.status!==p.status))history.push({answers:old.answers,help:old.help,status:old.status,at:old.updatedAt});
  state.days[plan.id]={plan,answers,help,status:p.status,history,updatedAt:at};state.revision++;
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.mkdirSync(path.join(root,'backups'),{recursive:true});
  if(fs.existsSync(file))fs.copyFileSync(file,path.join(root,'backups','daily-'+Date.now()+'-'+state.revision+'.json'));
  const temp=file+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify(state,null,2),'utf8');fs.renameSync(temp,file);
  return {plan,state};
 };
};
