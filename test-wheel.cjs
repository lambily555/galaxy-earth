const assert=require('node:assert/strict'),path=require('node:path');
const {_electron}=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{let app;try{
 app=await _electron.launch({executablePath:path.join(__dirname,'desktop/Python世界地图.exe'),args:['--atlas-qa'],timeout:45000});const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>window.__earthReady,null,{timeout:45000});
 const size=page.viewportSize()||await page.evaluate(()=>({width:innerWidth,height:innerHeight}));await page.mouse.move(size.width/2,size.height/2);
 for(let i=0;i<7;i++){if(await page.locator('#exploreView').isVisible())break;await page.mouse.wheel(0,-240);await page.waitForTimeout(300);}
 await page.waitForSelector('#exploreView:not([hidden])');assert.equal(await page.evaluate(()=>atlasExplorer.state().level),'continent');
 async function zoomInto(selector,level){const point=await page.locator(selector).first().evaluate(el=>{const b=el.getBBox();for(let y=.1;y<1;y+=.1)for(let x=.1;x<1;x+=.1){const p=new DOMPoint(b.x+b.width*x,b.y+b.height*y);if(el.isPointInFill(p)){const s=p.matrixTransform(el.getScreenCTM());return {x:s.x,y:s.y};}}throw Error('No interior point');});await page.waitForTimeout(500);await page.mouse.move(point.x,point.y);await page.mouse.wheel(0,-240);await page.waitForFunction(level=>atlasExplorer.state().level===level,level);}
 await zoomInto('#geoMap path[aria-label="中国"]','country');await zoomInto('#geoMap path[aria-label="北京市"]','province');await zoomInto('#geoMap path','city');
 await page.screenshot({path:path.join(__dirname,'qa/wheel-city.png')});
 for(const level of ['province','country','continent']){await page.waitForTimeout(500);await page.mouse.wheel(0,350);await page.waitForFunction(level=>atlasExplorer.state().level===level,level);}
 await page.waitForTimeout(500);await page.mouse.wheel(0,350);await page.waitForSelector('#spaceView:not([hidden])');
 await page.evaluate(()=>earthUI.showProvince(1));await page.locator('#flatMapWrap').hover();await page.mouse.wheel(0,-240);await page.waitForSelector('#exploreView:not([hidden])');assert.equal(await page.evaluate(()=>atlasExplorer.state().level),'province');
 await page.evaluate(()=>earthUI.showProvince(1));await page.waitForTimeout(550);await page.locator('#flatMapWrap').hover();await page.mouse.wheel(0,240);await page.waitForSelector('#exploreView:not([hidden])');assert.equal(await page.evaluate(()=>atlasExplorer.state().level),'country');
 assert.deepEqual(errors,[]);console.log('PASS: real mouse wheel panorama -> continent -> country -> province -> city -> province -> country -> continent -> panorama; original course map wheel in/out.');
 }finally{if(app)await app.evaluate(({app})=>app.exit(0));}
})().catch(e=>{console.error(e);process.exitCode=1;});
