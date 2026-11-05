'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {_electron}=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
(async()=>{let app;try{
 app=await _electron.launch({executablePath:path.join(__dirname,'desktop/Python世界地图.exe'),args:['--atlas-qa']});const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.waitForFunction(()=>window.__earthReady&&atlasScene.getState().solar,null,{timeout:45000});
 const expected=['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
 let a=await page.evaluate(()=>atlasScene.getState());assert.deepEqual(a.solar.orbits.map(p=>p.id),expected);assert.equal(a.bodies.length,10);assert.equal(new Set(a.bodies).size,10);
 await page.waitForTimeout(1300);let b=await page.evaluate(()=>atlasScene.getState());
 for(let i=0;i<8;i++){const p=b.solar.orbits[i];assert(p.angle>a.solar.orbits[i].angle,p.id+' must revolve');assert(Math.abs(distance(p.position,b.solar.center)-p.radius)<.00001);if(i)assert(p.radius>b.solar.orbits[i-1].radius);}
 assert(distance(a.earthCenter,b.earthCenter)>.1,'Earth must actually move, not only spin');assert(Math.abs(distance(b.camera,b.earthCenter)-8.3)<.00001,'Earth view camera follows its orbit');assert(Math.abs(distance(b.solar.moon,b.earthCenter)-3.5)<.00001,'Moon orbits Earth');
 await page.evaluate(()=>atlasScene.setPaused(true));a=await page.evaluate(()=>atlasScene.getState().solar);await page.waitForTimeout(400);assert.deepEqual(await page.evaluate(()=>atlasScene.getState().solar),a);
 await page.keyboard.press('Tab');await page.waitForSelector('#spaceMenu:not([hidden])');await page.click('#solarSystemView');await page.waitForFunction(()=>!atlasScene.getState().travel);assert.equal(await page.evaluate(()=>atlasScene.getState().focused),'solar');assert.equal(await page.locator('.planet-pin:not([hidden])').count(),9,'All eight planets and Sun should be visible in overview');await page.screenshot({path:path.join(__dirname,'qa/solar-system-overview.png')});
 for(const id of ['mercury','venus','uranus','neptune']){await page.locator('.planet-pin[data-planet="'+id+'"]').click();await page.waitForFunction(()=>!atlasScene.getState().travel);assert.equal(await page.evaluate(()=>atlasScene.getState().focused),id);assert(await page.locator('#planetInfo').isVisible());await page.evaluate(()=>atlasScene.focusPlanet('solar'));await page.waitForFunction(()=>!atlasScene.getState().travel);}
 await page.evaluate(()=>{atlasScene.setPaused(false);return atlasScene.focusPlanet('neptune');});await page.waitForFunction(()=>!atlasScene.getState().travel);a=await page.evaluate(()=>atlasScene.getState());await page.waitForTimeout(500);b=await page.evaluate(()=>atlasScene.getState());assert(distance(a.look,b.look)>.01,'Focused moving planet should stay tracked');assert(Math.abs(distance(a.camera,a.look)-distance(b.camera,b.look))<.00001);
 await page.keyboard.press('Home');await page.waitForFunction(()=>!atlasScene.getState().travel);b=await page.evaluate(()=>atlasScene.getState());assert(Math.abs(distance(b.camera,b.earthCenter)-8.3)<.0001);assert(distance(b.look,b.earthCenter)<.0001);
 await page.emulateMedia({reducedMotion:'reduce'});a=await page.evaluate(()=>atlasScene.getState().solar.elapsed);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>atlasScene.getState().solar.elapsed),a);assert.deepEqual(errors,[]);
 console.log('PASS: 8 planets + Sun + Moon, heliocentric orbits, Earth/Moon motion, camera tracking, 9 visible overview labels, four added planets clickable, pause/Home/reduced-motion.');
 }finally{if(app)await app.evaluate(({app})=>app.exit(0));}
})().catch(e=>{console.error(e);process.exitCode=1;});
