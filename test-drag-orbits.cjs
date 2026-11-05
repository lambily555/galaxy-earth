'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {_electron}=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const offset=s=>s.camera.map((v,i)=>v-s.look[i]);
function moving(a,b){for(const p of b.solar.orbits)assert(p.angle>a.solar.orbits.find(q=>q.id===p.id).angle,p.id+' must keep revolving during a drag');}
(async()=>{let app;try{
 app=await _electron.launch({executablePath:path.join(__dirname,'desktop/Python世界地图.exe'),args:['--atlas-qa']});const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>window.__earthReady,null,{timeout:45000});
 const size=await page.evaluate(()=>({w:innerWidth,h:innerHeight}));
 await page.mouse.move(size.w/2,size.h/2+40);await page.mouse.down();let a=await page.evaluate(()=>atlasScene.getState());await page.waitForTimeout(400);let b=await page.evaluate(()=>atlasScene.getState());moving(a,b);assert.deepEqual(b.rotation,a.rotation,'Held Earth must not auto-spin under the pointer');await page.mouse.move(size.w/2+90,size.h/2+60,{steps:12});b=await page.evaluate(()=>atlasScene.getState());assert.notDeepEqual(b.rotation,a.rotation,'Earth remains manually rotatable');await page.mouse.up();
 await page.mouse.move(size.w*.92,size.h*.85);await page.mouse.down();a=await page.evaluate(()=>atlasScene.getState());await page.mouse.move(size.w*.78,size.h*.7,{steps:15});await page.waitForTimeout(350);b=await page.evaluate(()=>atlasScene.getState());moving(a,b);assert.notDeepEqual(offset(a),offset(b),'Background still changes camera observation angle');assert(Math.abs(Math.hypot(...offset(a))-Math.hypot(...offset(b)))<1e-7,'Orbiting target remains at a stable camera distance');await page.mouse.up();
 await page.evaluate(()=>atlasScene.setPaused(true));await page.mouse.down();a=await page.evaluate(()=>atlasScene.getState());await page.waitForTimeout(250);b=await page.evaluate(()=>atlasScene.getState());assert.equal(b.solar.elapsed,a.solar.elapsed,'Explicit pause still works');await page.mouse.up();assert.deepEqual(errors,[]);
 console.log('PASS: Earth drag and background-camera drag do not stop other planets; manual Earth rotation, moving-target camera distance and explicit pause remain correct.');
 }finally{if(app)await app.evaluate(({app})=>app.exit(0));}
})().catch(e=>{console.error(e);process.exitCode=1;});
