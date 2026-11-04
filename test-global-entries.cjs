'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {_electron}=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const continents=['Asia','Europe','Africa','North America','South America','Oceania','Antarctica'];
(async()=>{let app;const results=[];try{
 app=await _electron.launch({executablePath:path.join(__dirname,'desktop/Python世界地图.exe'),args:['--atlas-qa']});const page=await app.firstWindow();await page.waitForFunction(()=>window.__earthReady,null,{timeout:45000});
 const catalog=require('./assets/boundary-catalog.json'),service=require('./desktop/resources/app/boundaries.cjs')(__dirname),childChecked=new Set();const failures=[];
 for(const continent of continents){
  await page.evaluate(c=>atlasExplorer.openContinent(c),continent);
  const entries=await page.locator('#geoMap path').evaluateAll(paths=>paths.map(p=>({iso:p.dataset.iso||'',name:p.getAttribute('aria-label')})));
  for(const entry of entries){
   await page.evaluate(c=>atlasExplorer.openContinent(c),continent);const item={continent,...entry};const start=Date.now();
   try{
    const point=await page.locator('#geoMap path').evaluateAll((paths,name)=>{const el=paths.find(p=>p.getAttribute('aria-label')===name),b=el.getBBox();for(let y=.05;y<1;y+=.05)for(let x=.05;x<1;x+=.05){const p=new DOMPoint(b.x+b.width*x,b.y+b.height*y);if(el.isPointInFill(p)){const q=p.matrixTransform(el.getScreenCTM());if(document.elementFromPoint(q.x,q.y)===el)return {x:q.x,y:q.y};}}return null;},entry.name);
    if(point)await page.mouse.click(point.x,point.y);else{const option=await page.locator('#regionChoice option').evaluateAll((opts,name)=>opts.find(o=>o.textContent===name)?.value,entry.name);await page.selectOption('#regionChoice',option);}
    await page.waitForFunction(()=>!atlasExplorer.state().loading,null,{timeout:100000});const state=await page.evaluate(()=>atlasExplorer.state());item.state=state;item.hint=await page.locator('#geoHint').textContent();item.method=point?'mouse':'selector';
    if(state.level==='continent')throw Error(item.hint);assert(state.count>0);if(entry.iso&&entry.iso!=='ATA'){const expected=({KOS:'XKX',SDS:'SSD',SAH:'ESH',PSX:'PSE',ALD:'ALA',HKG:'CHN',MAC:'CHN'}[entry.iso])||entry.iso;assert.equal(state.iso,expected,'Wrong country data for '+entry.name);}const invalid=await page.locator('#geoMap path').evaluateAll(paths=>paths.filter(p=>!p.getAttribute('d')||/NaN|Infinity/.test(p.getAttribute('d'))).length);assert.equal(invalid,0);item.status=state.level==='city'?'outline-only':'administrative-map';
    if(entry.iso==='RUS'){await page.screenshot({path:path.join(__dirname,'qa/russia-'+continent+'.png')});}
    if(process.argv.includes('--children')&&state.adm&&!childChecked.has(state.iso)&&service.levels(state.iso).some(x=>Number(x.level.slice(3))>state.adm)){
     childChecked.add(state.iso);const option=await page.locator('#regionChoice option').nth(1).getAttribute('value');await page.selectOption('#regionChoice',option);await page.waitForFunction(()=>!atlasExplorer.state().loading,null,{timeout:100000});item.child=await page.evaluate(()=>atlasExplorer.state());assert(item.child.adm>state.adm,await page.locator('#geoHint').textContent());assert(item.child.count>0);
    }
   }catch(e){item.status='failed';item.error=e.message;failures.push(item);}
   item.ms=Date.now()-start;results.push(item);fs.writeFileSync(path.join(__dirname,'qa/global-entries.json'),JSON.stringify({catalogDate:catalog.retrieved,results},null,2));console.log(JSON.stringify({continent,iso:item.iso,name:item.name,status:item.status,count:item.state?.count,ms:item.ms,error:item.error}));
  }
 }
 console.log('GLOBAL ENTRIES:',results.length,'failures:',failures.length);assert.equal(failures.length,0,failures.map(x=>x.name+': '+x.error).join('\n'));
 }finally{if(app)await app.evaluate(({app})=>app.exit(0));}
})().catch(e=>{console.error(e);process.exitCode=1;});
