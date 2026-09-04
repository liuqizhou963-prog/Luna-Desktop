const{app}=require('electron');
const path=require("path");
const fs=require("fs");
// Keep the packaged app identity independent from the legacy Taishen runtime.
const originalSetName=app.setName?.bind(app);
if(originalSetName){app.setName=()=>originalSetName("Luna");originalSetName("Luna");}
const originalSetAppUserModelId=app.setAppUserModelId?.bind(app);
if(originalSetAppUserModelId){app.setAppUserModelId=()=>originalSetAppUserModelId("com.luna.desktop");originalSetAppUserModelId("com.luna.desktop");}
const redir=p=>typeof p==="string"?p.replace(/\.taishen/g,".luna").replace(/taishen-logs\.db/g,"luna-logs.db").replace(/taishen\.db/g,"luna.db"):p;
const oj=path.join;path.join=function(...a){return redir(oj.apply(this,a));};
const or=path.resolve;path.resolve=function(...a){return redir(or.apply(this,a));};
["readFileSync","writeFileSync","appendFileSync","existsSync","mkdirSync","readdirSync","statSync","rmSync","unlinkSync","renameSync","copyFileSync","openSync","realpathSync"].forEach(k=>{const o=fs[k];if(typeof o==="function"){fs[k]=function(p,...r){if(typeof p==="string")p=redir(p);return o.call(fs,p,...r);};}});
app.on('browser-window-created',(e,w)=>w.webContents.on('ipc-message',(e,c,...a)=>c=='window:set-opacity'&&w.setOpacity(Math.max(.7,Math.min(1,+a[0]||1)))));
require('bytenode');
require('./index.jsc');
