const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {_electron}=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const continents=['Asia','Europe','Africa','North America','South America','Oceania','Antarctica'];
(async()=>{let app;try{
 app=await _electron.launch({executablePath:path.join(__dirname,'desktop/Python世界地图.exe'),args:['--atlas-qa']});const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>window.__earthReady,null,{timeout:45000});await page.setViewportSize({width:1600,height:1000});
 const results=[];for(const continent of continents){await page.evaluate(c=>atlasExplorer.openContinent(c),continent);const result=await page.evaluate(()=>{const paths=[...document.querySelectorAll('#geoMap path')];const b=paths.map(p=>p.getBBox());return {title:document.getElementById('geoTitle').textContent,count:paths.length,empty:paths.filter(p=>!p.getAttribute('d')||/NaN|Infinity/.test(p.getAttribute('d'))).length,outside:b.filter(b=>b.x<0||b.y<0||b.x+b.width>1100.1||b.y+b.height>680.1).length,bounds:[Math.min(...b.map(x=>x.x)),Math.min(...b.map(x=>x.y)),Math.max(...b.map(x=>x.x+x.width)),Math.max(...b.map(x=>x.y+x.height))],names:paths.map(p=>p.getAttribute('aria-label'))};});result.continent=continent;results.push(result);await page.screenshot({path:path.join(__dirname,'qa/map-'+continent.replaceAll(' ','-')+'.png')});}
 console.log(JSON.stringify(results.map(({names,...x})=>x),null,2));assert.deepEqual(errors,[]);for(const result of results){assert(result.count>0);assert.equal(result.empty,0,result.continent+' missing paths');assert.equal(result.outside,0,result.continent+' clipped');}
 const polar=results.at(-1).bounds;assert((polar[3]-polar[1])/(polar[2]-polar[0])>.65,'Antarctica must use a full polar view, not a flattened strip');
 console.log('PASS: all continent paths finite, fitted and complete; Antarctica polar view.');
 }finally{if(app)await app.evaluate(({app})=>app.exit(0));}
})().catch(e=>{console.error(e);process.exitCode=1;});
