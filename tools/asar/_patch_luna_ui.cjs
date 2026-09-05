const fs = require("fs");

const [root] = process.argv.slice(2);
if (!root) throw new Error("usage: node _patch_luna_ui.cjs <extracted-asar-root>");

function replaceExact(file, oldText, newText, label) {
  const before = fs.readFileSync(file, "utf8");
  const count = before.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, got ${count}`);
  fs.writeFileSync(file, before.replace(oldText, newText));
  console.log(`${label}: patched`);
}

function replaceOnceOrVerify(file, oldText, newText, alreadyText, label) {
  const before = fs.readFileSync(file, "utf8");
  const count = before.split(oldText).length - 1;
  if (count === 1) {
    fs.writeFileSync(file, before.replace(oldText, newText));
    console.log(`${label}: patched`);
    return;
  }
  if (count === 0 && ((alreadyText && before.split(alreadyText).length - 1 === 1) || alreadyText === null)) {
    console.log(`${label}: already patched`);
    return;
  }
  throw new Error(`${label}: expected 1 original match or 1 patched match, got ${count}`);
}

function replaceAllExact(file, oldText, newText, expected, label) {
  const before = fs.readFileSync(file, "utf8");
  const count = before.split(oldText).length - 1;
  if (count === expected) {
    fs.writeFileSync(file, before.split(oldText).join(newText));
    console.log(`${label}: patched ${count}`);
    return;
  }
  if (count === 0 && before.split(newText).length - 1 >= expected) {
    console.log(`${label}: already patched`);
    return;
  }
  throw new Error(`${label}: expected ${expected} original matches, got ${count}`);
}

const renderer = `${root}/out/renderer/assets/index-BBAKMKgY.js`;
const settings = `${root}/out/renderer/assets/SettingsPage-4AAvyvnk.js`;

// Remove the left-navigation Canvas button without disturbing canvas internals.
replaceOnceOrVerify(
  renderer,
  'ref:N,onClick:T,className:t,children:[a.jsx(Ne,{size:18})',
  'ref:N,onClick:T,className:t,style:{display:"none"},children:[a.jsx(Ne,{size:18})',
  'ref:N,onClick:T,className:t,style:{display:"none"},children:[a.jsx(Ne,{size:18})',
  "left-nav canvas entry",
);

// The expanded sidebar has a separate Canvas button instance.
replaceOnceOrVerify(
  renderer,
  'ref:N,onClick:T,className:"group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 text-slate-400 hover:text-accent hover:bg-accent-soft/50 hover:scale-110 active:scale-95",children:[a.jsx(Ne,{size:18})',
  'ref:N,onClick:T,className:"group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 text-slate-400 hover:text-accent hover:bg-accent-soft/50 hover:scale-110 active:scale-95",style:{display:"none"},children:[a.jsx(Ne,{size:18})',
  'ref:N,onClick:T,className:"group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 text-slate-400 hover:text-accent hover:bg-accent-soft/50 hover:scale-110 active:scale-95",style:{display:"none"},children:[a.jsx(Ne,{size:18})',
  "expanded left-nav canvas entry",
);

replaceAllExact(renderer,
  'relative flex flex-1 flex-col h-full items-center justify-end bg-slate-50 pb-4',
  'relative flex flex-1 flex-col h-full items-center justify-end bg-transparent pb-4',
  2, "chat home background transparency");
replaceAllExact(renderer,
  'flex flex-1 bg-slate-50 overflow-hidden',
  'flex flex-1 bg-transparent overflow-hidden',
  2, "main layout background transparency");

replaceOnceOrVerify(renderer,
  'function Bi({leftPanel:e,chatArea:t,cardDock:o,previewPanel:s,bottomPanel:i,sidebarOpen:r,onToggleSidebar:l,framed:c=!0}){const[d,u]=n.useState(260),',
  'function Bi({leftPanel:e,chatArea:t,cardDock:o,previewPanel:s,bottomPanel:i,sidebarOpen:r,onToggleSidebar:l,framed:c=!0}){const[d,u]=n.useState(260);n.useEffect(()=>{window.api?.app?.getSetting?.("taishen.backgroundImage").then(e=>{document.body.style.backgroundImage=e?`url(${e})`:"none",document.body.style.backgroundSize="cover",document.body.style.backgroundPosition="center",document.body.style.backgroundAttachment="fixed"}).catch(()=>{})},[]);',
  'function Bi({leftPanel:e,chatArea:t,cardDock:o,previewPanel:s,bottomPanel:i,sidebarOpen:r,onToggleSidebar:l,framed:c=!0}){const[d,u]=n.useState(260);n.useEffect(()=>{window.api?.app?.getSetting?.("taishen.backgroundImage").then(e=>{document.body.style.backgroundImage=e?`url(${e})`:"none",document.body.style.backgroundSize="cover",document.body.style.backgroundPosition="center",document.body.style.backgroundAttachment="fixed"}).catch(()=>{})},[]);',
  "main background image initialization");

// Remove the IM integration tab from Settings navigation.
replaceOnceOrVerify(
  settings,
  '{id:"im",label:a("tabIM")}',
  '',
  null,
  "settings IM tab",
);

replaceOnceOrVerify(
  settings,
  'document.documentElement.style.opacity="",document.documentElement.style.backgroundColor="",document.body.style.backgroundColor="",document.body.style.backgroundImage="",document.body.style.backgroundSize="",document.body.style.backgroundPosition="",document.body.style.backgroundAttachment=""',
  'document.documentElement.style.opacity=""',
  null,
  "settings background persistence",
);
