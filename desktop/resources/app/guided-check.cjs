'use strict';
const path=require('node:path'),{spawn}=require('node:child_process');
module.exports=root=>{
 const exercises=require(path.join(root,'guided-lessons.js'));
 return async p=>{
  if(!p||!Number.isInteger(p.id)||!Number.isInteger(p.index)||!exercises[p.id]?.steps[p.index])throw Error('无效理解题步骤');
  if(typeof p.answer!=='string'||p.answer.length>12000)throw Error('单步代码过长');
  const expected=exercises[p.id].steps[p.index].code;
  return new Promise((resolve,reject)=>{
   const child=spawn(path.join(root,'runtime/python/python.exe'),['-I','-X','utf8','-B',path.join(__dirname,'check-guided.py')],{windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,PYTHONIOENCODING:'utf-8'}});
   let out='',err='';const timer=setTimeout(()=>child.kill(),5000);
   child.stdout.on('data',b=>out+=b.toString('utf8'));child.stderr.on('data',b=>err+=b.toString('utf8'));
   child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);if(code!==0)return reject(Error('判题暂不可用，答案仍保留：'+err.slice(0,200)));try{resolve({...JSON.parse(out),reference:expected});}catch{reject(Error('判题结果读取失败，答案仍保留'));}});
   child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({answer:p.answer,expected}));
  });
 };
};
