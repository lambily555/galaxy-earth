'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {_electron}=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const intro=require('./beginner-intro.js');
(async()=>{let app;try{
 app=await _electron.launch({executablePath:path.join(__dirname,'desktop/Python世界地图.exe'),args:['--atlas-qa']});const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>window.__earthReady,null,{timeout:45000});
 await page.evaluate(()=>earthUI.showProvince(1));await page.click('.city-pin[data-part="0"]');assert((await page.locator('#beginnerIntro h2').textContent()).includes('Python是什么'));assert.equal(await page.locator('#code').inputValue(),'print("你好，Python！")');
 await page.fill('#code','print("我的草稿要保留")');await page.click('#introSource');
 for(let i=0;i<intro.length;i++){
  assert.equal(await page.locator('#beginnerIntro h2').textContent(),intro[i].title);
  if(intro[i].code){await page.click('#runIntro');await page.waitForFunction(expected=>document.getElementById('output').textContent.replace(/\r\n/g,'\n')===expected,intro[i].output);assert.equal(await page.locator('#code').inputValue(),'print("我的草稿要保留")');}
  if(i===2)await page.screenshot({path:path.join(__dirname,'qa/beginner-print.png'),fullPage:true});
  await page.click('#introNext');
 }
 assert.equal(await page.locator('#beginnerIntro').count(),0);assert((await page.locator('#lessonArticle').textContent()).includes('专业定义'));assert((await page.locator('#lessonArticle').textContent()).includes('赋值'));
 await page.getByRole('button',{name:'回看零基础导读'}).click();assert((await page.locator('#beginnerIntro h2').textContent()).includes('Python是什么'));
 await page.evaluate(()=>window.flushAtlas());assert.equal(await page.evaluate(()=>earthUI.entry(1).code),'print("我的草稿要保留")');assert.equal(await page.evaluate(()=>earthUI.entry(1).parts.length),0,'Reading the intro must not auto-complete the unit');
 await page.evaluate(()=>earthUI.showProvince(2));await page.click('.city-pin[data-part="0"]');assert.equal(await page.locator('#beginnerIntro').count(),0);assert((await page.locator('#lessonArticle').textContent()).includes('数字、文字'));
 assert.deepEqual(errors,[]);console.log('PASS: first-unit five-page beginner intro before variables, bundled Python examples and outputs, W3 source entry, no draft overwrite or automatic completion, other units unchanged.');
 }finally{if(app)await app.evaluate(({app})=>app.exit(0));}
})().catch(e=>{console.error(e);process.exitCode=1;});
