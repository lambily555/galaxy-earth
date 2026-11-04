'use strict';
const fs=require('node:fs'),path=require('node:path');
module.exports=root=>{
  const folder=path.join(root,'data'),file=path.join(folder,'progress.json');fs.mkdirSync(folder,{recursive:true});fs.mkdirSync(path.join(root,'backups'),{recursive:true});
  const read=()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{revision:0,units:{}};
  function save(payload){
    if(!Number.isInteger(payload.id)||payload.id<1||payload.id>42)throw Error('无效课程');
    const current=read(),old=current.units[payload.id]||{revision:0};
    if(old.revision!==payload.revision)throw Error('此课程已有更新。请先导出当前草稿，再重新打开课程。');
    const value={};for(const k of ['code','notes','answer']){value[k]=String(payload[k]??'');if(value[k].length>500000)throw Error('内容过长，请先导出代码。');}
    for(const key of ['guided','lastRun']){
      const extra=payload[key]===undefined?old[key]:payload[key];
      if(extra!==undefined){const text=JSON.stringify(extra);if(text.length>(key==='guided'?1000000:9000000))throw Error('学习结果过大，请先导出保留');value[key]=JSON.parse(text);}
    }
    value.parts=[...new Set((payload.parts||[]).filter(n=>Number.isInteger(n)&&n>=0&&n<4))];
    value.status=value.parts.length===4?'done':(['new','learning','review'].includes(payload.status)?payload.status:'learning');value.revision=old.revision+1;value.updatedAt=new Date().toISOString();
    current.units[payload.id]=value;current.revision++;
    if(fs.existsSync(file))fs.copyFileSync(file,path.join(root,'backups',`progress-${Date.now()}-${current.revision}.json`));
    const temp=file+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify(current,null,2),'utf8');fs.renameSync(temp,file);return current;
  }
  return {read,save};
};
