'use strict';
const fs=require('node:fs'),path=require('node:path'),catalog=require('./assets/boundary-catalog.json'),service=require('./desktop/resources/app/boundaries.cjs')(__dirname);
const results=[],jobs=catalog.layers.filter(x=>x.boundaryType==='ADM0');let cursor=0;
async function worker(){while(cursor<jobs.length){const job=jobs[cursor++],row={iso:job.boundaryISO};try{const data=await service.boundaries({iso:row.iso,level:'ADM0'});Object.assign(row,{status:'ok',count:data.features.length,source:data.source});}catch(e){row.status='failed';row.error=e.message;}results.push(row);fs.writeFileSync(path.join(__dirname,'qa/country-outline-downloads.json'),JSON.stringify({total:jobs.length,results},null,2));console.log(row.iso,row.status,results.length+'/'+jobs.length);}}
(async()=>{await Promise.all([worker(),worker(),worker()]);console.log('DONE',results.length,'failed',results.filter(x=>x.status==='failed').length);})().catch(e=>{console.error(e);process.exitCode=1;});
