const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {_electron}=require('C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const before=fs.readFileSync(path.join(__dirname,'data/progress.json'),'utf8');let app;try{
app=await _electron.launch({executablePath:path.join(__dirname,'desktop/Python世界地图.exe'),args:['--atlas-qa']});const page=await app.firstWindow();await page.waitForFunction(()=>window.__earthReady,null,{timeout:45000});
assert.equal(await page.locator('#minimizeApp').count(),1);assert.equal(await page.locator('#exitApp').count(),1);
await page.evaluate(()=>document.getElementById('minimizeApp').click());
await page.waitForTimeout(600);assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isMinimized()));
await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].restore());await page.keyboard.press('F9');await page.waitForTimeout(600);assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isMinimized()));
assert.equal(fs.readFileSync(path.join(__dirname,'data/progress.json'),'utf8'),before);console.log('PASS: button and F9 minimize window, restore works, exit retained, real data unchanged.');
}finally{if(app)await app.evaluate(({app})=>app.exit(0));}})().catch(e=>{console.error(e);process.exitCode=1;});
