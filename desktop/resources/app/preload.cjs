const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('dailyLearning',Object.freeze({read:()=>ipcRenderer.invoke('atlas:daily-learning'),save:p=>ipcRenderer.invoke('atlas:daily-learning',p)}));
contextBridge.exposeInMainWorld('learningStats',Object.freeze({read:()=>ipcRenderer.invoke('atlas:learning-stats'),act:p=>ipcRenderer.invoke('atlas:learning-stats',p)}));
contextBridge.exposeInMainWorld('atlasWindow',Object.freeze({minimize:()=>ipcRenderer.invoke('atlas:minimize')}));
contextBridge.exposeInMainWorld('guidedCheck',Object.freeze({check:p=>ipcRenderer.invoke('atlas:check-guided',p)}));
contextBridge.exposeInMainWorld('geographyData',Object.freeze({levels:iso=>ipcRenderer.invoke('atlas:boundary-levels',iso),boundaryFile:p=>ipcRenderer.invoke('atlas:boundary-file',p),chinaChildren:p=>ipcRenderer.invoke('atlas:china-children',p)}));
contextBridge.exposeInMainWorld('learningSites',Object.freeze({open:key=>ipcRenderer.invoke('atlas:open-learning-site',key)}));
contextBridge.exposeInMainWorld('atlas',Object.freeze({boundaries:p=>ipcRenderer.invoke('atlas:boundaries',p),close:()=>ipcRenderer.invoke('atlas:close'),load:()=>ipcRenderer.invoke('atlas:load'),save:p=>ipcRenderer.invoke('atlas:save',p),run:p=>ipcRenderer.invoke('atlas:run',p),backup:()=>ipcRenderer.invoke('atlas:backup'),exportDraft:p=>ipcRenderer.invoke('atlas:export',p)}));
