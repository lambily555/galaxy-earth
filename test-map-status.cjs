'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {_electron}=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{let app;try{
 app=await _electron.launch({executablePath:path.join(__dirname,'desktop/Python世界地图.exe'),args:['--atlas-qa']});const page=await app.firstWindow();await page.waitForFunction(()=>window.__earthReady,null,{timeout:45000});
 const service=require('./desktop/resources/app/boundaries.cjs')(__dirname),data={RUS:await service.boundaries({iso:'RUS',level:'ADM1'}),DEU:await service.boundaries({iso:'DEU',level:'ADM1'})};
 await app.evaluate(({ipcMain},data)=>{let attempts=0;ipcMain.removeHandler('atlas:boundaries');ipcMain.handle('atlas:boundaries',async(_event,p)=>{if(p.iso==='RUS'&&++attempts===1){await new Promise(r=>setTimeout(r,800));throw Error('测试：模拟首次连接失败');}if(p.iso==='DEU')await new Promise(r=>setTimeout(r,1200));return data[p.iso];});},data);
 async function country(iso){const name=await page.locator('#geoMap path[data-iso="'+iso+'"]').getAttribute('aria-label');await page.selectOption('#regionChoice',{label:name});}
 await page.evaluate(()=>atlasExplorer.openContinent('Asia'));await country('RUS');await page.waitForSelector('#geoStatus[data-state=loading]:not([hidden])');await page.waitForSelector('#geoStatus[data-state=error]:not([hidden])');assert(await page.locator('#geoRetry').isVisible());await page.click('#geoRetry');await page.waitForFunction(()=>atlasExplorer.state().iso==='RUS'&&!atlasExplorer.state().loading);assert.equal(await page.locator('#geoStatus').isVisible(),false);assert.equal(await page.locator('#geoMap path').count(),83);
 await page.evaluate(()=>atlasExplorer.openContinent('Europe'));await country('DEU');await page.waitForSelector('#geoStatus[data-state=loading]:not([hidden])');await page.click('#geoCancel');await page.waitForTimeout(1600);assert.equal(await page.evaluate(()=>atlasExplorer.state().level),'continent');assert.equal(await page.locator('#geoStatus').isVisible(),false);
 console.log('PASS: visible loading, failed-request retry, real Russia map, canceled result cannot replace current view.');
 }finally{if(app)await app.evaluate(({app})=>app.exit(0));}
})().catch(e=>{console.error(e);process.exitCode=1;});
