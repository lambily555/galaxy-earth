'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {_electron}=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{let app;try{
 app=await _electron.launch({executablePath:path.join(__dirname,'desktop/Python世界地图.exe'),args:['--atlas-qa']});const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>window.__earthReady,null,{timeout:45000});
 async function choose(text){await page.selectOption('#regionChoice',{label:text});await page.waitForFunction(()=>!atlasExplorer.state().loading,null,{timeout:90000});}
 async function chooseFirst(){const value=await page.locator('#regionChoice option').nth(1).getAttribute('value');await page.selectOption('#regionChoice',value);await page.waitForFunction(()=>!atlasExplorer.state().loading,null,{timeout:90000});}
 await page.evaluate(()=>atlasExplorer.openChina(3));await choose('石家庄市');assert.equal(await page.evaluate(()=>atlasExplorer.state().level),'district',await page.locator('#geoHint').textContent());assert((await page.evaluate(()=>atlasExplorer.state().count))>10);await chooseFirst();assert.equal(await page.evaluate(()=>atlasExplorer.state().level),'city');
 for(const [continent,iso] of [['Europe','FRA'],['North America','USA'],['South America','BRA'],['Asia','JPN'],['Africa','ZAF'],['Oceania','AUS']]){
  await page.evaluate(c=>atlasExplorer.openContinent(c),continent);const label=await page.locator('#geoMap path[data-iso="'+iso+'"]').getAttribute('aria-label');await choose(label);assert.equal(await page.evaluate(()=>atlasExplorer.state().adm),1,iso+' country');await chooseFirst();assert.equal(await page.evaluate(()=>atlasExplorer.state().adm),2,iso+' subregions');
  const paths=await page.locator('#geoMap path').count();assert(paths>0);await page.screenshot({path:path.join(__dirname,'qa/admin-'+iso+'.png')});console.log('PASS UI',iso,paths,'subregions');
 }
 await page.evaluate(()=>atlasExplorer.openContinent('Europe'));const france=await page.locator('#geoMap path[data-iso="FRA"]').getAttribute('aria-label');await choose(france);await chooseFirst();await chooseFirst();assert.equal(await page.evaluate(()=>atlasExplorer.state().adm),3);await page.click('#geoBack');assert.equal(await page.evaluate(()=>atlasExplorer.state().adm),2);
 await page.setViewportSize({width:900,height:700});assert(await page.locator('#regionChoice').isVisible());await page.screenshot({path:path.join(__dirname,'qa/admin-compact.png')});
 await page.evaluate(()=>atlasExplorer.openContinent('Europe'));const vatican=await page.locator('#geoMap path[data-iso="VAT"]').getAttribute('aria-label');await choose(vatican);assert.equal(await page.evaluate(()=>atlasExplorer.state().level),'city');assert((await page.locator('#geoHint').textContent()).includes('暂未提供'));
 await page.evaluate(()=>atlasExplorer.openContinent('Asia'));const hongKong=await page.locator('#geoMap path[data-iso="HKG"]').getAttribute('aria-label');await choose(hongKong);assert.equal(await page.evaluate(()=>atlasExplorer.state().title),'香港特别行政区');assert((await page.evaluate(()=>atlasExplorer.state().count))>1);
 await page.evaluate(()=>atlasExplorer.open(100,60));assert.equal(await page.evaluate(()=>atlasExplorer.state().title),'亚洲');await page.evaluate(()=>atlasExplorer.open(40,55));assert.equal(await page.evaluate(()=>atlasExplorer.state().title),'欧洲');
 const links=await page.evaluate(async()=>Promise.all(['w3schools','runoob'].map(key=>learningSites.open(key))));assert(links.every(x=>x.browser==='chrome'));assert.deepEqual(errors,[]);
 console.log('PASS: China district drilldown, six continents ADM1/ADM2, France ADM3, back navigation, small-region selector, Chrome links.');
 }finally{if(app)await app.evaluate(({app})=>app.exit(0));}
})().catch(e=>{console.error(e);process.exitCode=1;});
