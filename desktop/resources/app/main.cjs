'use strict';
const {app,BrowserWindow,ipcMain,Menu,dialog}=require('electron'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../../..');const qa=process.argv.includes('--atlas-qa');const dataRoot=qa?path.join(root,'qa','desktop-session-'+process.pid):root;
fs.mkdirSync(path.join(dataRoot,'profile'),{recursive:true});app.setPath('userData',path.join(dataRoot,'profile'));app.setPath('sessionData',path.join(dataRoot,'profile'));app.setPath('logs',path.join(dataRoot,'profile','logs'));app.setName('Python世界地图');app.setAppUserModelId('local.python.learning.atlas');
const store=require('./store.cjs')(dataRoot);let win,running=null,closing=false;
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{if(win){win.restore();win.show();win.focus();}});
 app.whenReady().then(async()=>{
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'编辑',submenu:[{role:'undo',label:'撤销'},{role:'redo',label:'重做'},{type:'separator'},{role:'cut',label:'剪切'},{role:'copy',label:'复制'},{role:'paste',label:'粘贴'},{role:'selectAll',label:'全选'}]},{label:'查看',submenu:[{role:'togglefullscreen',label:'全屏'},{role:'resetZoom',label:'实际字号'},{role:'zoomIn',label:'放大字号'},{role:'zoomOut',label:'缩小字号'}]}]));
  win=new BrowserWindow({width:1480,height:980,minWidth:850,minHeight:650,show:!qa,fullscreen:!qa,frame:false,title:'Python世界地图',backgroundColor:'#03060d',autoHideMenuBar:true,icon:path.join(root,'app-icon.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:false,backgroundThrottling:!qa,offscreen:qa}});
  const trusted=event=>{if(event.sender!==win.webContents)throw Error('来源无效');};
  ipcMain.handle('atlas:load',event=>{trusted(event);return store.read();});
  ipcMain.handle('atlas:close',event=>{trusted(event);setImmediate(()=>win.close());});
  ipcMain.handle('atlas:boundaries',async(event,p)=>{
   trusted(event);if(!/^[A-Z]{3}$/.test(p.iso)||!['ADM1','ADM2'].includes(p.level))throw Error('无效地图请求');
   const folder=path.join(root,'assets','boundary-cache');fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,p.iso+'-'+p.level+'.json');if(fs.existsSync(file))return JSON.parse(fs.readFileSync(file,'utf8'));
   const get=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('地图数据服务返回 '+r.status);return r.json();};
   const metadata=await get('https://www.geoboundaries.org/api/current/gbOpen/'+p.iso+'/'+p.level+'/');
   const url=metadata.simplifiedGeometryGeoJSON||metadata.gjDownloadURL;if(!url||!['www.geoboundaries.org','raw.githubusercontent.com','github.com','media.githubusercontent.com'].includes(new URL(url).hostname))throw Error('该地区暂未提供此级边界数据');
   const data=await get(url);if(data.type!=='FeatureCollection')throw Error('地图数据格式无效');data.source={provider:'geoBoundaries gbOpen',url,license:metadata.boundaryLicense,licenseSource:metadata.licenseSource,source:metadata.boundarySource,version:metadata.boundaryID};fs.writeFileSync(file,JSON.stringify(data));return data;
  });
  ipcMain.handle('atlas:save',(event,payload)=>{trusted(event);return store.save(payload);});
  ipcMain.handle('atlas:backup',event=>{trusted(event);const p=path.join(dataRoot,'backups',`manual-${Date.now()}.json`);fs.writeFileSync(p,JSON.stringify(store.read(),null,2));return p;});
  ipcMain.handle('atlas:export',(event,p)=>{trusted(event);if(!Number.isInteger(p.id)||p.id<1||p.id>42)throw Error('无效课程');const folder=path.join(dataRoot,'workspace','exports');fs.mkdirSync(folder,{recursive:true});const name=path.join(folder,`单元${String(p.id).padStart(2,'0')}-${Date.now()}`);fs.writeFileSync(name+'.py',String(p.code??''));fs.writeFileSync(name+'-答案与笔记.txt',String(p.answer??'')+'\n\n'+String(p.notes??''));return name;});
  ipcMain.handle('atlas:run',async(event,p)=>{
   trusted(event);if(running)throw Error('上一段代码还在运行，请等待。');if(typeof p.code!=='string'||p.code.length>200000)throw Error('代码过长。');
   const python=path.join(root,'runtime','python','python.exe');if(!fs.existsSync(python))throw Error('Python运行环境缺失。');
   const work=path.join(dataRoot,'workspace');fs.mkdirSync(work,{recursive:true});const plot=path.join(work,'plots');fs.mkdirSync(plot,{recursive:true});const stamp=Date.now().toString();
   const wrapper=`import sys,os,traceback\nos.environ['MPLBACKEND']='Agg'\nsource=sys.stdin.read()\ntry:\n exec(compile(source,'<我的练习>','exec'),{'__name__':'__main__'})\n if 'matplotlib.pyplot' in sys.modules:\n  import matplotlib.pyplot as plt\n  for n in plt.get_fignums()[:4]:\n   plt.figure(n).savefig(${JSON.stringify(plot.replaceAll('\\','/'))}+'/'+${JSON.stringify(stamp)}+'-'+str(n)+'.png',bbox_inches='tight')\nexcept BaseException:\n traceback.print_exc()\n sys.exit(1)\n`;
   return await new Promise(resolve=>{let out='',err='',timeout=false,finished=false;const child=spawn(python,['-I','-u','-c',wrapper],{cwd:work,windowsHide:true,env:{...process.env,PYTHONIOENCODING:'utf-8',MPLCONFIGDIR:path.join(dataRoot,'profile','matplotlib')}});running=child;const timer=setTimeout(()=>{timeout=true;child.kill();},20000);const finish=code=>{if(finished)return;finished=true;clearTimeout(timer);running=null;let images=[];for(let f of fs.readdirSync(plot).filter(f=>f.startsWith(stamp+'-')).slice(0,4)){const bytes=fs.readFileSync(path.join(plot,f));if(bytes.length<4e6)images.push('data:image/png;base64,'+bytes.toString('base64'));}resolve({stdout:out,stderr:err,code,timeout,images});};child.stdout.on('data',b=>{out+=b.toString('utf8');if(out.length>200000)child.kill();});child.stderr.on('data',b=>{err+=b.toString('utf8');if(err.length>200000)child.kill();});child.on('error',e=>{err=e.message;finish(-1);});child.on('close',finish);child.stdin.end(p.code);});
  });
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
  win.webContents.on('context-menu',(_e,p)=>{if(p.isEditable)Menu.buildFromTemplate([{role:'undo',label:'撤销'},{role:'redo',label:'重做'},{type:'separator'},{role:'cut',label:'剪切'},{role:'copy',label:'复制'},{role:'paste',label:'粘贴'},{role:'selectAll',label:'全选'}]).popup({window:win});});
  win.on('close',async e=>{if(closing)return;e.preventDefault();try{await win.webContents.executeJavaScript('window.flushAtlas()');if(running)running.kill();closing=true;win.close();}catch(error){dialog.showMessageBox(win,{type:'warning',message:'内容尚未保存，窗口已保留。请先导出草稿。',detail:error.message});}});
  await win.loadFile(path.join(root,'earth.html'));
 });app.on('window-all-closed',()=>app.quit());
}
