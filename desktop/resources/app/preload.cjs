const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('atlas',Object.freeze({load:()=>ipcRenderer.invoke('atlas:load'),save:p=>ipcRenderer.invoke('atlas:save',p),run:p=>ipcRenderer.invoke('atlas:run',p),backup:()=>ipcRenderer.invoke('atlas:backup'),exportDraft:p=>ipcRenderer.invoke('atlas:export',p)}));
