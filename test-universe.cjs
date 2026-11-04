const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {_electron}=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{let app;try{
 app=await _electron.launch({executablePath:path.join(__dirname,'desktop/Python世界地图.exe'),args:['--atlas-qa'],timeout:45000});const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>window.__earthReady,null,{timeout:45000});
 assert((await page.evaluate(()=>atlasScene.getState().bodies)).includes('sun'));await page.screenshot({path:path.join(__dirname,'qa/universe-new.png')});
 await page.keyboard.press('Tab');await page.waitForSelector('#spaceMenu:not([hidden])');assert.equal(await page.evaluate(()=>atlasScene.getState().focused),'jupiter');await page.keyboard.press('F2');await page.waitForSelector('#settingsPanel:not([hidden])');await page.screenshot({path:path.join(__dirname,'qa/settings-new.png')});
 await page.keyboard.press('Home');await page.waitForFunction(()=>!atlasScene.getState().travel);
 await page.evaluate(()=>atlasExplorer.open(105,35));assert.equal(await page.evaluate(()=>atlasExplorer.state().level),'continent');
 await page.locator('#geoMap path[aria-label="中国"]').click();await page.waitForFunction(()=>!atlasExplorer.state().loading);assert.equal(await page.evaluate(()=>atlasExplorer.state().count),34);
 await page.locator('#geoMap path[aria-label="北京市"]').click();await page.waitForFunction(()=>!atlasExplorer.state().loading);assert.equal(await page.evaluate(()=>atlasExplorer.state().level),'province');
 await page.locator('#geoMap path').first().click();await page.waitForFunction(()=>!atlasExplorer.state().loading);assert.equal(await page.evaluate(()=>atlasExplorer.state().level),'city');await page.screenshot({path:path.join(__dirname,'qa/city-explore.png')});
 await page.locator('#geoWrap').hover();await page.mouse.wheel(0,400);await page.waitForFunction(()=>atlasExplorer.state().level==='province');
 await page.click('#geoHome');await page.keyboard.press('Tab');await page.waitForSelector('#spaceMenu:not([hidden])');await page.click('#daily');
 await page.waitForFunction(()=>atlasScene.getState().flight);assert.equal(await page.locator('#flightLabel').isVisible(),false);
 const positions=[];for(let i=0;i<10;i++){await page.waitForTimeout(300);positions.push((await page.evaluate(()=>atlasScene.getState().camera))[2]);}assert(positions.every((x,i)=>!i||x<positions[i-1]));
 await page.waitForSelector('#atlasView:not([hidden])',{timeout:12000});await page.locator('.city-pin').first().click();await page.fill('#notes','exit-save-check');await page.keyboard.press('F2');await page.waitForSelector('#settingsPanel:not([hidden])');assert.equal(await page.evaluate(()=>earthUI.entry(1).notes),'exit-save-check');
 const france=await page.evaluate(()=>window.atlas.boundaries({iso:'FRA',level:'ADM1'}));assert(france.features.length>1);console.log('PASS: live France administrative boundaries loaded through desktop bridge.');
 assert.deepEqual(errors,[]);const closed=app.waitForEvent('close');await page.keyboard.press('Escape');await closed;app=null;
 console.log('PASS: Sun, planet focus, Tab/F2/Home/Esc, hidden CG labels, continuous zoom, continent-country-province-city browsing, reverse wheel, draft preservation and safe exit.');
 }finally{if(app)await app.evaluate(({app})=>app.exit(0));}
})().catch(e=>{console.error(e);process.exitCode=1;});
